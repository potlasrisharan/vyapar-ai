// lib/fintrace-zf/index.ts
import { MerkleTree, createAuthenticatedRecord } from "./crypto";
import { evaluateZeroFabricationGate } from "./gate";
import {
  AuthenticatedRecord,
  FinTraceZFOutput,
  SourceSystem,
  TransactionType,
  TypedQuestionPlan,
  UserIdentity,
} from "./types";

export * from "./types";
export * from "./crypto";
export * from "./engine";
export * from "./gate";

/**
 * Section 02: Untrusted Intent Parser P(q)
 * Extracts query structure from natural language question.
 * The AI/parser CANNOT generate ledger facts or financial values.
 */
export function parseIntentPlan(question: string): TypedQuestionPlan {
  const q = question.toLowerCase();

  // Detect sources
  const sourceFilter: SourceSystem[] = [];
  if (q.includes("upi")) sourceFilter.push("upi");
  if (q.includes("pos") || q.includes("counter")) sourceFilter.push("pos");
  if (q.includes("invoice") || q.includes("bill")) sourceFilter.push("invoice");
  if (q.includes("bank")) sourceFilter.push("bank");
  if (sourceFilter.length === 0) {
    sourceFilter.push("pos", "upi", "invoice");
  }

  // Detect transaction type
  let transactionType: TransactionType | undefined = "sale";
  if (q.includes("refund")) transactionType = "refund";
  if (q.includes("fee") || q.includes("charge")) transactionType = "fee";
  if (q.includes("expense")) transactionType = "fee";

  // Detect metric
  let metric: "sum" | "count" | "average" | "reconcile" = "sum";
  if (q.includes("reconcil") || q.includes("match") || q.includes("discrepanc")) {
    metric = "reconcile";
  } else if (q.includes("how many") || q.includes("count") || q.includes("kitne")) {
    metric = "count";
  }

  // Detect time window
  const now = new Date();
  let start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  let end = now.toISOString();

  if (q.includes("yesterday") || q.includes("kal")) {
    const yestStart = new Date(now);
    yestStart.setDate(now.getDate() - 1);
    yestStart.setHours(0, 0, 0, 0);

    const yestEnd = new Date(yestStart);
    yestEnd.setHours(23, 59, 59, 999);

    start = yestStart.toISOString();
    end = yestEnd.toISOString();
  } else if (q.includes("today") || q.includes("aaj")) {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    start = todayStart.toISOString();
    end = now.toISOString();
  } else if (q.includes("september") || q.includes("sep")) {
    start = new Date("2026-09-01T00:00:00.000Z").toISOString();
    end = new Date("2026-09-30T23:59:59.999Z").toISOString();
  }

  return {
    metric,
    sourceFilter,
    transactionType,
    timeWindow: { start, end },
    currency: "INR",
    requiresReconciliation: metric === "reconcile",
  };
}

/**
 * Executes FINTRACE-ZF Algorithm
 * Equation: ZF = IF(Phi, (v, pi), bot)
 */
export function queryFinTraceZF(
  question: string,
  user: UserIdentity,
  records: AuthenticatedRecord[],
  bankRecords?: AuthenticatedRecord[],
  overridePlan?: TypedQuestionPlan
): FinTraceZFOutput {
  const plan = overridePlan || parseIntentPlan(question);
  const hashes = records.map((r) => r.recordHash);
  const vaultTree = new MerkleTree(hashes);

  return evaluateZeroFabricationGate(plan, user, records, vaultTree, bankRecords);
}

/**
 * Creates sample cryptographically authenticated ledger records for VyaparAI
 */
export function createSampleAuthenticatedLedger(): {
  records: AuthenticatedRecord[];
  bankRecords: AuthenticatedRecord[];
} {
  const records: AuthenticatedRecord[] = [
    createAuthenticatedRecord(
      {
        recordId: "TXN-UPI-901",
        sourceId: "upi",
        timestamp: "2026-09-15T10:30:00.000Z",
        currency: "INR",
        watermark: "2026-09-30T23:59:59.999Z",
      },
      {
        transactionType: "sale",
        amountMinor: 250000, // ₹2,500.00
        counterparty: "Customer A - PhonePe",
        status: "settled",
        referenceId: "BANK-REF-901",
      }
    ),
    createAuthenticatedRecord(
      {
        recordId: "TXN-UPI-902",
        sourceId: "upi",
        timestamp: "2026-09-15T14:15:00.000Z",
        currency: "INR",
        watermark: "2026-09-30T23:59:59.999Z",
      },
      {
        transactionType: "sale",
        amountMinor: 480000, // ₹4,800.00
        counterparty: "Customer B - GooglePay",
        status: "settled",
        referenceId: "BANK-REF-902",
      }
    ),
    createAuthenticatedRecord(
      {
        recordId: "TXN-POS-101",
        sourceId: "pos",
        timestamp: "2026-09-15T16:45:00.000Z",
        currency: "INR",
        watermark: "2026-09-30T23:59:59.999Z",
      },
      {
        transactionType: "sale",
        amountMinor: 1250000, // ₹12,500.00
        counterparty: "Counter Card POS",
        status: "settled",
        referenceId: "BANK-REF-101",
      }
    ),
    createAuthenticatedRecord(
      {
        recordId: "TXN-INV-1023",
        sourceId: "invoice",
        timestamp: "2026-09-11T11:00:00.000Z",
        currency: "INR",
        watermark: "2026-09-30T23:59:59.999Z",
      },
      {
        transactionType: "sale",
        amountMinor: 3500000, // ₹35,000.00
        counterparty: "ABC Traders",
        status: "settled",
        referenceId: "BANK-REF-1023",
      }
    ),
  ];

  const bankRecords: AuthenticatedRecord[] = [
    createAuthenticatedRecord(
      {
        recordId: "BNK-001",
        sourceId: "bank",
        timestamp: "2026-09-16T09:00:00.000Z",
        currency: "INR",
        watermark: "2026-09-30T23:59:59.999Z",
      },
      {
        transactionType: "sale",
        amountMinor: 250000,
        counterparty: "UPI Settlement Bank",
        status: "settled",
        referenceId: "BANK-REF-901",
      }
    ),
    createAuthenticatedRecord(
      {
        recordId: "BNK-002",
        sourceId: "bank",
        timestamp: "2026-09-16T09:00:00.000Z",
        currency: "INR",
        watermark: "2026-09-30T23:59:59.999Z",
      },
      {
        transactionType: "sale",
        amountMinor: 480000,
        counterparty: "UPI Settlement Bank",
        status: "settled",
        referenceId: "BANK-REF-902",
      }
    ),
    createAuthenticatedRecord(
      {
        recordId: "BNK-003",
        sourceId: "bank",
        timestamp: "2026-09-16T09:00:00.000Z",
        currency: "INR",
        watermark: "2026-09-30T23:59:59.999Z",
      },
      {
        transactionType: "sale",
        amountMinor: 1250000,
        counterparty: "Card POS Settlement",
        status: "settled",
        referenceId: "BANK-REF-101",
      }
    ),
  ];

  return { records, bankRecords };
}
