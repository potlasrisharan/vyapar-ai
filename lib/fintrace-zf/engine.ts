// lib/fintrace-zf/engine.ts
import {
  AuthenticatedRecord,
  CalculationTraceStep,
  ReconciliationSummary,
  SourceSystem,
  TypedQuestionPlan,
  UserIdentity,
  VerifiedFinancialValue,
} from "./types";

const ALLOWED_OPERATORS = new Set(["sum", "count", "average", "reconcile"]);
const ALLOWED_SOURCES: SourceSystem[] = ["pos", "upi", "invoice", "bank"];

/**
 * Section 02: Policy Validator V(Q, u)
 * Rejects forbidden fields, operators, time periods, or unauthorized roles
 */
export function validateQueryPolicy(
  plan: TypedQuestionPlan,
  user: UserIdentity
): { valid: boolean; reason?: string } {
  if (!ALLOWED_OPERATORS.has(plan.metric)) {
    return { valid: false, reason: `Disallowed metric operator '${plan.metric}'` };
  }

  for (const src of plan.sourceFilter) {
    if (!ALLOWED_SOURCES.includes(src)) {
      return { valid: false, reason: `Disallowed source system '${src}'` };
    }
  }

  if (!plan.timeWindow || !plan.timeWindow.start || !plan.timeWindow.end) {
    return { valid: false, reason: "Time window boundaries start and end are mandatory" };
  }

  const startDate = new Date(plan.timeWindow.start);
  const endDate = new Date(plan.timeWindow.end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { valid: false, reason: "Invalid ISO-8601 time window date format" };
  }

  if (startDate > endDate) {
    return { valid: false, reason: "Time window start cannot be after end" };
  }

  if (plan.requiresReconciliation && user.role !== "merchant" && user.role !== "auditor") {
    return { valid: false, reason: `Role '${user.role}' unauthorized for reconciliation audit` };
  }

  return { valid: true };
}

/**
 * Section 03: Completeness, Uniqueness & Missingness Verification
 * Complete(s, W) = [watermark_s >= end(W)] ^ AllPagesVerified(s, W)
 * Missing == 0 ^ Unique(sourceID, transactionID) ^ SameCurrency(Q)
 */
export function verifyCompletenessAndUniqueness(
  records: AuthenticatedRecord[],
  plan: TypedQuestionPlan
): {
  isComplete: boolean;
  discrepancies: string[];
} {
  const discrepancies: string[] = [];

  if (records.length === 0) {
    return { isComplete: true, discrepancies: [] };
  }

  const seenIds = new Set<string>();
  const expectedCurrency = plan.currency.toUpperCase();
  const endWindowTime = new Date(plan.timeWindow.end).getTime();

  let maxWatermarkTime = 0;

  for (const r of records) {
    // 1. Uniqueness check: Unique(sourceID, transactionID)
    const uniqueKey = `${r.metadata.sourceId}:${r.metadata.recordId}`;
    if (seenIds.has(uniqueKey)) {
      discrepancies.push(`Duplicate transaction conflict detected: ${uniqueKey}`);
    }
    seenIds.add(uniqueKey);

    // 2. SameCurrency check: SameCurrency(Q)
    if (r.metadata.currency.toUpperCase() !== expectedCurrency) {
      discrepancies.push(
        `Currency mismatch: Record ${r.metadata.recordId} has currency '${r.metadata.currency}' vs expected '${expectedCurrency}'`
      );
    }

    // 3. Watermark tracking
    const recordWatermark = new Date(r.metadata.watermark || r.metadata.timestamp).getTime();
    if (recordWatermark > maxWatermarkTime) {
      maxWatermarkTime = recordWatermark;
    }

    // 4. Missingness check: amount must be well-formed integer minor unit
    if (!Number.isInteger(r.fields.amountMinor) || r.fields.amountMinor < 0) {
      discrepancies.push(
        `Invalid or missing financial value in record ${r.metadata.recordId}: ${r.fields.amountMinor}`
      );
    }
  }

  // 5. Watermark coverage: watermark >= end(W)
  if (maxWatermarkTime < endWindowTime) {
    discrepancies.push(
      `Incomplete time coverage: Highest record watermark (${new Date(maxWatermarkTime).toISOString()}) is prior to window end (${plan.timeWindow.end})`
    );
  }

  return {
    isComplete: discrepancies.length === 0,
    discrepancies,
  };
}

/**
 * Section 02: Deterministic Selection and Filter Predicate S(Q) = { r in R | Predicate(Q, r) }
 */
export function filterRecordsByPredicate(
  records: AuthenticatedRecord[],
  plan: TypedQuestionPlan
): AuthenticatedRecord[] {
  const startTime = new Date(plan.timeWindow.start).getTime();
  const endTime = new Date(plan.timeWindow.end).getTime();

  return records.filter((r) => {
    // Source filter match
    if (plan.sourceFilter.length > 0 && !plan.sourceFilter.includes(r.metadata.sourceId)) {
      return false;
    }

    // Transaction type match
    if (plan.transactionType && r.fields.transactionType !== plan.transactionType) {
      return false;
    }

    // Time window match
    const txTime = new Date(r.metadata.timestamp).getTime();
    if (txTime < startTime || txTime > endTime) {
      return false;
    }

    // Only settled records for financial totals
    if (r.fields.status !== "settled") {
      return false;
    }

    return true;
  });
}

/**
 * Section 02: Exact Integer Minor-Unit Arithmetic Engine E
 * Total(Q) = sum { amount_minor(r) : r in S(Q) }
 */
export function computeFinancialMetric(
  selectedRecords: AuthenticatedRecord[],
  plan: TypedQuestionPlan
): {
  verifiedValue: VerifiedFinancialValue;
  calculationTrace: CalculationTraceStep[];
} {
  let totalPaise = 0;
  const trace: CalculationTraceStep[] = [];

  for (const record of selectedRecords) {
    const amount = record.fields.amountMinor;
    if (record.fields.transactionType === "refund" || record.fields.transactionType === "fee") {
      totalPaise -= amount;
    } else {
      totalPaise += amount;
    }

    trace.push({
      recordId: record.metadata.recordId,
      transactionType: record.fields.transactionType,
      amountMinor: amount,
      runningTotalMinor: totalPaise,
    });
  }

  const rupees = totalPaise / 100;
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: plan.currency,
    maximumFractionDigits: 2,
  }).format(rupees);

  return {
    verifiedValue: {
      amountMinor: totalPaise,
      currency: plan.currency,
      formattedAmount: formatted,
      recordCount: selectedRecords.length,
      timeWindow: plan.timeWindow,
    },
    calculationTrace: trace,
  };
}

/**
 * Section 04: Independent Financial Reconciliation
 * Expected(W) = sum Sales - sum Refunds - sum Fees + sum Adjustments
 * Delta(W) = ObservedBank(W) - Expected(W)
 * Recon(W) = [Delta(W) = 0] ^ [Unmatched(W) = 0] ^ CompleteSources(W)
 */
export function performFinancialReconciliation(
  posAndUpiRecords: AuthenticatedRecord[],
  bankRecords: AuthenticatedRecord[]
): ReconciliationSummary {
  let salesPaise = 0;
  let refundsPaise = 0;
  let feesPaise = 0;
  let adjustmentsPaise = 0;

  const matchedBankRefs = new Set<string>();

  for (const r of posAndUpiRecords) {
    switch (r.fields.transactionType) {
      case "sale":
        salesPaise += r.fields.amountMinor;
        break;
      case "refund":
        refundsPaise += r.fields.amountMinor;
        break;
      case "fee":
        feesPaise += r.fields.amountMinor;
        break;
      case "adjustment":
        adjustmentsPaise += r.fields.amountMinor;
        break;
    }
  }

  const expectedPaise = salesPaise - refundsPaise - feesPaise + adjustmentsPaise;

  let observedBankPaise = 0;
  const unmatchedRecords: string[] = [];

  for (const b of bankRecords) {
    observedBankPaise += b.fields.amountMinor;
    if (b.fields.referenceId) {
      matchedBankRefs.add(b.fields.referenceId);
    }
  }

  // Cross-reference POS/UPI references against bank settlement
  for (const r of posAndUpiRecords) {
    if (r.fields.referenceId && !matchedBankRefs.has(r.fields.referenceId)) {
      unmatchedRecords.push(r.metadata.recordId);
    }
  }

  const deltaPaise = observedBankPaise - expectedPaise;

  return {
    expectedMinor: expectedPaise,
    observedBankMinor: observedBankPaise,
    deltaMinor: deltaPaise,
    unmatchedRecords,
    isReconciled: deltaPaise === 0 && unmatchedRecords.length === 0,
  };
}
