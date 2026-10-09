import type {
  Customer,
  Invoice,
  Payment,
  PaymentPromise,
  CollectionFollowup,
  PriorityBreakdown,
  ReliabilityRating,
  UdhaarCustomerSummary,
  UdhaarDashboardSummary,
  Localized,
} from "@/lib/types";
import { DEMO_DATE, daysBetween, money } from "@/lib/utils/format";
import { outstanding, paidAmount } from "@/lib/mock/invoices";

export const UDHAAR_CONFIG = {
  priorityWeights: {
    overdue: 0.35,
    exposure: 0.30,
    promise: 0.20,
    riskTrend: 0.15,
  },
  reliabilityWeights: {
    timeliness: 0.40,
    delay: 0.25,
    brokenPromises: 0.20,
    consistency: 0.15,
  },
  exposureThreshold: 50000,
  highExposureThreshold: 20000,
  minimumEligibleHistory: 2,
  starThresholds: {
    fiveStar: 85,
    fourStar: 70,
    threeStar: 50,
    twoStar: 30,
  },
  priorityBands: {
    urgent: 75,
    high: 50,
    medium: 25,
  },
} as const;

/**
 * Normalizes days overdue into 0–100 scale.
 * 0 days (or non-overdue) = 0
 * 1–7 days = 20–40
 * 8–15 days = 40–75
 * 16–30 days = 75–95
 * >30 days = 95–100 (capped at 100)
 */
export function normalizeOverdueScore(daysOverdue: number, hasOutstanding: boolean): number {
  if (!hasOutstanding || daysOverdue <= 0) return 0;
  if (daysOverdue <= 7) {
    return Math.round(20 + (daysOverdue / 7) * 20);
  }
  if (daysOverdue <= 15) {
    return Math.round(40 + ((daysOverdue - 7) / 8) * 35);
  }
  if (daysOverdue <= 30) {
    return Math.round(75 + ((daysOverdue - 15) / 15) * 20);
  }
  return Math.min(100, Math.round(95 + (daysOverdue - 30)));
}

/**
 * Normalizes business exposure into 0–100 scale based on configurable business exposure threshold.
 * Prevents a single large invoice from permanently dominating all other customers.
 */
export function normalizeExposureScore(
  outstandingExposure: number,
  threshold: number = UDHAAR_CONFIG.exposureThreshold
): number {
  if (outstandingExposure <= 0) return 0;
  const rawRatio = outstandingExposure / threshold;
  return Math.min(100, Math.max(0, Math.round(rawRatio * 100)));
}

/**
 * Evaluates payment promises into a 0–100 priority factor.
 * Missed promises dramatically increase collection urgency.
 * Pending unreached promises lower collection urgency (handled in good faith).
 */
export function normalizePromiseScore(
  promises: PaymentPromise[] = [],
  asOfDate: string = DEMO_DATE
): { score: number; missedCount: number; pendingCount: number } {
  let missedCount = 0;
  let pendingFutureCount = 0;

  for (const p of promises) {
    if (p.status === "missed") {
      missedCount++;
    } else if (p.status === "pending") {
      if (p.expectedDate < asOfDate) {
        missedCount++;
      } else {
        pendingFutureCount++;
      }
    }
  }

  let score = 30; // neutral default when no promise exists
  if (missedCount >= 2) {
    score = 100;
  } else if (missedCount === 1) {
    score = 75;
  } else if (pendingFutureCount > 0) {
    score = 10; // active cooperative promise scheduled
  } else if (promises.length > 0) {
    score = 15; // all prior promises were fulfilled
  }

  return { score, missedCount, pendingCount: pendingFutureCount };
}

/**
 * Evaluates whether customer's repayment behavior is worsening.
 * Looks at accumulating unpaid bills and increasing delay trends.
 */
export function normalizeRiskTrendScore(
  unpaidInvoices: Invoice[],
  historicalPayments: Payment[],
  historicalInvoices: Invoice[]
): number {
  if (unpaidInvoices.length === 0) return 0;

  let score = 0;

  // Unpaid count risk
  if (unpaidInvoices.length >= 3) {
    score += 45;
  } else if (unpaidInvoices.length === 2) {
    score += 30;
  } else {
    score += 15;
  }

  // Overdue count risk
  const overdueCount = unpaidInvoices.filter((i) => i.dueDate < DEMO_DATE).length;
  if (overdueCount >= 2) {
    score += 30;
  } else if (overdueCount === 1) {
    score += 15;
  }

  // Delay progression trend
  if (historicalPayments.length >= 3) {
    const sorted = [...historicalPayments].sort((a, b) => a.date.localeCompare(b.date));
    const recent = sorted.slice(-2);
    const older = sorted.slice(0, -2);

    const getDelay = (p: Payment) => {
      const inv = historicalInvoices.find((i) => i.id === p.invoiceId);
      return inv ? daysBetween(inv.dueDate, p.date) : 0;
    };

    const avgRecentDelay = recent.reduce((s, p) => s + getDelay(p), 0) / recent.length;
    const avgOlderDelay = older.reduce((s, p) => s + getDelay(p), 0) / older.length;

    if (avgRecentDelay > avgOlderDelay + 3) {
      score += 25; // escalating delay trend
    }
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Deterministic Collection Priority Calculation
 * Priority Score = 0.35 * Overdue + 0.30 * Exposure + 0.20 * Promise + 0.15 * Risk Trend
 */
export function calculatePriorityBreakdown(
  customer: Customer,
  invoices: Invoice[],
  payments: Payment[],
  promises: PaymentPromise[] = [],
  asOfDate: string = DEMO_DATE
): PriorityBreakdown {
  const customerInvoices = invoices.filter((i) => i.customerId === customer.id);
  const unpaidInvoices = customerInvoices.filter((i) => outstanding(i, payments) > 0);
  const totalOutstanding = unpaidInvoices.reduce((s, i) => s + outstanding(i, payments), 0);

  let maxDaysOverdue = 0;
  for (const inv of unpaidInvoices) {
    const diff = daysBetween(inv.dueDate, asOfDate);
    if (diff > maxDaysOverdue) {
      maxDaysOverdue = diff;
    }
  }

  const overdueScore = normalizeOverdueScore(maxDaysOverdue, totalOutstanding > 0);
  const exposureScore = normalizeExposureScore(totalOutstanding, UDHAAR_CONFIG.exposureThreshold);
  const promiseResult = normalizePromiseScore(promises, asOfDate);
  const promiseScore = promiseResult.score;
  const riskTrendScore = normalizeRiskTrendScore(unpaidInvoices, payments.filter((p) => p.customerId === customer.id), customerInvoices);

  const rawScore =
    UDHAAR_CONFIG.priorityWeights.overdue * overdueScore +
    UDHAAR_CONFIG.priorityWeights.exposure * exposureScore +
    UDHAAR_CONFIG.priorityWeights.promise * promiseScore +
    UDHAAR_CONFIG.priorityWeights.riskTrend * riskTrendScore;

  const score = totalOutstanding === 0 ? 0 : Math.min(100, Math.max(0, Math.round(rawScore)));

  let band: "urgent" | "high" | "medium" | "low" = "low";
  if (score >= UDHAAR_CONFIG.priorityBands.urgent) {
    band = "urgent";
  } else if (score >= UDHAAR_CONFIG.priorityBands.high) {
    band = "high";
  } else if (score >= UDHAAR_CONFIG.priorityBands.medium) {
    band = "medium";
  }

  const explanation: Localized = {
    en: totalOutstanding === 0
      ? "Account is fully settled with zero outstanding exposure."
      : band === "urgent"
      ? `Contact ${customer.name} today. ${money(totalOutstanding)} remains outstanding and oldest invoice is ${maxDaysOverdue} days overdue.${promiseResult.missedCount > 0 ? " A previous payment promise was missed." : ""} High collection priority.`
      : band === "high"
      ? `High priority: ${money(totalOutstanding)} pending, ${maxDaysOverdue > 0 ? `${maxDaysOverdue} days overdue` : "due shortly"}. Follow up to prevent aging.`
      : band === "medium"
      ? `Moderate priority: ${money(totalOutstanding)} outstanding with stable repayment behavior.`
      : `Low collection priority: healthy account status or small active exposure.`,
    hi: totalOutstanding === 0
      ? "खाता पूरी तरह से चुकता है, कोई बकाया नहीं है।"
      : band === "urgent"
      ? `आज ही ${customer.name} से संपर्क करें। ${money(totalOutstanding)} बकाया है और सबसे पुराना बिल ${maxDaysOverdue} दिन ओवरड्यू है।${promiseResult.missedCount > 0 ? " पिछला पेमेंट वादा पूरा नहीं हुआ।" : ""} तुरंत संपर्क करें।`
      : band === "high"
      ? `उच्च प्राथमिकता: ${money(totalOutstanding)} बकाया, ${maxDaysOverdue > 0 ? `${maxDaysOverdue} दिन ओवरड्यू` : "जल्द देय"}। फॉलो-अप करें।`
      : band === "medium"
      ? `मध्यम प्राथमिकता: ${money(totalOutstanding)} बकाया, सामान्य भुगतान स्थिति।`
      : `कम प्राथमिकता: खाता संतुलित है।`,
    hinglish: totalOutstanding === 0
      ? "Account fully settled hai, zero outstanding."
      : band === "urgent"
      ? `Aaj hi ${customer.name} ko call karein. ${money(totalOutstanding)} pending hai aur oldest invoice ${maxDaysOverdue} days overdue hai.${promiseResult.missedCount > 0 ? " Missed payment promise detected." : ""} Urgent follow-up needed.`
      : band === "high"
      ? `High priority: ${money(totalOutstanding)} pending, ${maxDaysOverdue > 0 ? `${maxDaysOverdue} days overdue` : "due soon"}. Follow-up karein.`
      : band === "medium"
      ? `Moderate priority: ${money(totalOutstanding)} pending, stable repayment pattern.`
      : `Low collection priority: account safe hai.`,
  };

  return {
    score,
    band,
    overdueScore,
    exposureScore,
    promiseScore,
    riskTrendScore,
    daysOverdue: maxDaysOverdue,
    outstandingExposure: totalOutstanding,
    missedPromisesCount: promiseResult.missedCount,
    pendingPromisesCount: promiseResult.pendingCount,
    explanation,
  };
}

/**
 * Independent Customer Reliability Rating Engine
 * Evaluates historical repayment trustworthiness independently of current balance amount.
 * High-value transactions do not penalize reliability when settled on time.
 */
export function calculateReliabilityRating(
  customer: Customer,
  invoices: Invoice[],
  payments: Payment[],
  promises: PaymentPromise[] = []
): ReliabilityRating {
  const customerInvoices = invoices.filter((i) => i.customerId === customer.id);
  const customerPayments = payments.filter((p) => p.customerId === customer.id);

  // Eligible invoices are those that have had payments or are settled
  const eligibleInvoices = customerInvoices.filter((inv) => {
    const paid = paidAmount(inv, customerPayments);
    return paid > 0 || (inv.dueDate < DEMO_DATE && paid === 0);
  });

  const evaluationPeriod = "September 2026 (Historical)";

  if (eligibleInvoices.length < UDHAAR_CONFIG.minimumEligibleHistory) {
    return {
      stars: 0,
      score: 0,
      isInsufficientHistory: true,
      eligibleTransactionsCount: eligibleInvoices.length,
      timelinessScore: 0,
      delayScore: 0,
      promiseScore: 100,
      consistencyScore: 0,
      onTimePaymentRate: 0,
      amountWeightedOnTimeRate: 0,
      averageDelayDays: 0,
      brokenPromisesCount: 0,
      evaluationPeriod,
      explanation: {
        en: `Insufficient history (${eligibleInvoices.length} eligible cycle). Minimum ${UDHAAR_CONFIG.minimumEligibleHistory} completed transactions required.`,
        hi: `अपर्याप्त इतिहास (${eligibleInvoices.length} लेन-देन)। विश्वसनीयता रेटिंग के लिए कम से कम ${UDHAAR_CONFIG.minimumEligibleHistory} पूर्ण लेन-देन आवश्यक हैं।`,
        hinglish: `Insufficient history (${eligibleInvoices.length} cycle). Minimum ${UDHAAR_CONFIG.minimumEligibleHistory} completed transactions chahiye.`,
      },
    };
  }

  // 1. Timeliness: count-based and amount-weighted
  let onTimeCount = 0;
  let onTimePaidTotal = 0;
  let totalEligibleValue = 0;
  const paymentDelays: number[] = [];

  for (const inv of eligibleInvoices) {
    totalEligibleValue += inv.total;
    const invPayments = customerPayments.filter((p) => p.invoiceId === inv.id);
    const paid = invPayments.reduce((s, p) => s + p.amount, 0);

    if (paid >= inv.total && invPayments.length > 0) {
      // Find latest payment date for settlement
      const latestPayDate = invPayments.map((p) => p.date).sort().at(-1)!;
      const delay = daysBetween(inv.dueDate, latestPayDate);
      paymentDelays.push(Math.max(0, delay));

      if (delay <= 0) {
        onTimeCount++;
        onTimePaidTotal += inv.total;
      } else {
        // Delayed
        onTimePaidTotal += 0;
      }
    } else {
      // Unpaid or partial
      const delay = daysBetween(inv.dueDate, DEMO_DATE);
      if (delay > 0) {
        paymentDelays.push(delay);
      }
    }
  }

  const invoiceOnTimePct = Math.round((onTimeCount / eligibleInvoices.length) * 100);
  const amountWeightedOnTimePct = totalEligibleValue > 0
    ? Math.round((onTimePaidTotal / totalEligibleValue) * 100)
    : invoiceOnTimePct;

  // Composite timeliness score (50% invoice count, 50% amount-weighted)
  const timelinessScore = Math.round(0.5 * invoiceOnTimePct + 0.5 * amountWeightedOnTimePct);

  // 2. Average Delay Score
  const avgDelay = paymentDelays.length > 0
    ? Math.round(paymentDelays.reduce((s, d) => s + d, 0) / paymentDelays.length)
    : 0;

  let delayScore = 100;
  if (avgDelay <= 0) delayScore = 100;
  else if (avgDelay <= 3) delayScore = 85;
  else if (avgDelay <= 7) delayScore = 70;
  else if (avgDelay <= 14) delayScore = 50;
  else if (avgDelay <= 30) delayScore = 25;
  else delayScore = 0;

  // 3. Broken Promises Score
  const brokenPromisesCount = promises.filter(
    (p) => p.customerId === customer.id && (p.status === "missed" || (p.status === "pending" && p.expectedDate < DEMO_DATE))
  ).length;

  let promiseScore = 100;
  if (brokenPromisesCount === 1) promiseScore = 50;
  else if (brokenPromisesCount >= 2) promiseScore = 15;

  // 4. Consistency Score (Variance of delay days)
  let consistencyScore = 100;
  if (paymentDelays.length > 1) {
    const variance =
      paymentDelays.reduce((acc, val) => acc + Math.pow(val - avgDelay, 2), 0) /
      paymentDelays.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev <= 3) consistencyScore = 100;
    else if (stdDev <= 7) consistencyScore = 75;
    else if (stdDev <= 14) consistencyScore = 50;
    else consistencyScore = 25;
  }

  // Composite Reliability Score
  const rawReliability =
    UDHAAR_CONFIG.reliabilityWeights.timeliness * timelinessScore +
    UDHAAR_CONFIG.reliabilityWeights.delay * delayScore +
    UDHAAR_CONFIG.reliabilityWeights.brokenPromises * promiseScore +
    UDHAAR_CONFIG.reliabilityWeights.consistency * consistencyScore;

  const score = Math.min(100, Math.max(0, Math.round(rawReliability)));

  let stars = 1;
  if (score >= UDHAAR_CONFIG.starThresholds.fiveStar) stars = 5;
  else if (score >= UDHAAR_CONFIG.starThresholds.fourStar) stars = 4;
  else if (score >= UDHAAR_CONFIG.starThresholds.threeStar) stars = 3;
  else if (score >= UDHAAR_CONFIG.starThresholds.twoStar) stars = 2;

  const explanation: Localized = {
    en: `${stars}-star historical repayment reliability (${score}/100). On-time rate: ${invoiceOnTimePct}% across ${eligibleInvoices.length} invoices (value-weighted: ${amountWeightedOnTimePct}%). Average delay: ${avgDelay} days.${brokenPromisesCount > 0 ? ` ${brokenPromisesCount} missed promises.` : ""}`,
    hi: `${stars}-स्टार ऐतिहासिक भुगतान विश्वसनीयता (${score}/100)। समय पर भुगतान: ${invoiceOnTimePct}% (${eligibleInvoices.length} बिलों में से)। औसत विलंब: ${avgDelay} दिन।`,
    hinglish: `${stars}-star reliability rating (${score}/100). On-time rate: ${invoiceOnTimePct}% across ${eligibleInvoices.length} invoices. Average delay: ${avgDelay} days.`,
  };

  return {
    stars,
    score,
    isInsufficientHistory: false,
    eligibleTransactionsCount: eligibleInvoices.length,
    timelinessScore,
    delayScore,
    promiseScore,
    consistencyScore,
    onTimePaymentRate: invoiceOnTimePct,
    amountWeightedOnTimeRate: amountWeightedOnTimePct,
    averageDelayDays: avgDelay,
    brokenPromisesCount,
    evaluationPeriod,
    explanation,
  };
}

/**
 * Calculates complete Udhaar Customer Summary
 */
export function calculateCustomerUdhaarSummary(
  customer: Customer,
  invoices: Invoice[],
  payments: Payment[],
  promises: PaymentPromise[] = [],
  followups: CollectionFollowup[] = [],
  asOfDate: string = DEMO_DATE
): UdhaarCustomerSummary {
  const customerInvoices = invoices.filter((i) => i.customerId === customer.id);
  const customerPayments = payments.filter((p) => p.customerId === customer.id);
  const customerPromises = promises.filter((p) => p.customerId === customer.id);
  const customerFollowups = followups.filter((f) => f.customerId === customer.id);

  let totalOutstanding = 0;
  let overdueBalance = 0;
  let upcomingBalance = 0;
  const unpaidInvoices: Invoice[] = [];

  for (const inv of customerInvoices) {
    const due = outstanding(inv, payments);
    if (due > 0) {
      unpaidInvoices.push(inv);
      totalOutstanding += due;
      if (inv.dueDate < asOfDate) {
        overdueBalance += due;
      } else {
        upcomingBalance += due;
      }
    }
  }

  // Sort unpaid invoices by earliest due date
  unpaidInvoices.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const oldestUnpaidInvoice = unpaidInvoices[0];
  const earliestDueDate = oldestUnpaidInvoice?.dueDate;
  const daysOverdue = earliestDueDate ? Math.max(0, daysBetween(earliestDueDate, asOfDate)) : 0;

  const sortedPayments = [...customerPayments].sort((a, b) => b.date.localeCompare(a.date));
  const lastPayment = sortedPayments[0];
  const totalPaidHistorical = customerPayments.reduce((s, p) => s + p.amount, 0);

  const priority = calculatePriorityBreakdown(customer, invoices, payments, customerPromises, asOfDate);
  const reliability = calculateReliabilityRating(customer, invoices, payments, customerPromises);

  // Next recommended action determination
  let nextActionType: "call" | "whatsapp" | "promise" | "record_payment" | "monitor" = "monitor";
  let actionLabel: Localized = {
    en: "Monitor",
    hi: "निगरानी रखें",
    hinglish: "Monitor karein",
  };
  let actionReason: Localized = {
    en: "No immediate collection action required.",
    hi: "तत्काल किसी कार्रवाई की आवश्यकता नहीं है।",
    hinglish: "Abhi immediate action ki zaroorat nahi hai.",
  };

  if (totalOutstanding > 0) {
    if (priority.band === "urgent") {
      nextActionType = "call";
      actionLabel = {
        en: "Call Customer Now",
        hi: "अभी ग्राहक को कॉल करें",
        hinglish: "Abhi call karein",
      };
      actionReason = {
        en: `High overdue exposure (${money(overdueBalance)}). Speak with ${customer.contact || customer.name} to secure payment commitment.`,
        hi: `बड़ा ओवरड्यू बकाया (${money(overdueBalance)})। भुगतान की पुष्टि के लिए ${customer.contact || customer.name} से बात करें।`,
        hinglish: `Heavy overdue exposure (${money(overdueBalance)}). Payment commitment lene ke liye baat karein.`,
      };
    } else if (priority.band === "high") {
      nextActionType = "whatsapp";
      actionLabel = {
        en: "Send WhatsApp Reminder",
        hi: "व्हाट्सएप रिमाइंडर भेजें",
        hinglish: "WhatsApp reminder bhejein",
      };
      actionReason = {
        en: `Payment due soon or recently overdue. Send polite WhatsApp bill summary.`,
        hi: `बिल जल्द देय है या हाल ही में ओवरड्यू हुआ है। व्हाट्सएप पर विनम्र अनुस्मारक भेजें।`,
        hinglish: `Bill due hai ya recent overdue. Polite WhatsApp reminder share karein.`,
      };
    } else if (priority.pendingPromisesCount > 0) {
      nextActionType = "promise";
      actionLabel = {
        en: "Track Payment Promise",
        hi: "भुगतान वादा ट्रैक करें",
        hinglish: "Payment promise track karein",
      };
      actionReason = {
        en: `Customer promised payment. Verify account on scheduled date.`,
        hi: `ग्राहक ने भुगतान का वादा किया है। नियत तारीख पर पुष्टि करें।`,
        hinglish: `Customer ne promise kiya hai. Due date par confirm karein.`,
      };
    } else {
      nextActionType = "whatsapp";
      actionLabel = {
        en: "Friendly Reminder",
        hi: "अनुकूल अनुस्मारक",
        hinglish: "Friendly reminder",
      };
      actionReason = {
        en: `Send friendly invoice update to maintain timely cash flow.`,
        hi: `समय पर नकदी प्रवाह बनाए रखने के लिए बिल विवरण साझा करें।`,
        hinglish: `Cash flow maintain rakhne ke liye friendly reminder bhejein.`,
      };
    }
  }

  return {
    customer,
    totalOutstanding,
    overdueBalance,
    upcomingBalance,
    unpaidInvoicesCount: unpaidInvoices.length,
    oldestUnpaidInvoice,
    earliestDueDate,
    daysOverdue,
    lastPayment,
    totalPaidHistorical,
    invoices: customerInvoices,
    payments: customerPayments,
    promises: customerPromises,
    followups: customerFollowups,
    priority,
    reliability,
    nextRecommendedAction: {
      type: nextActionType,
      label: actionLabel,
      reason: actionReason,
    },
  };
}

/**
 * Calculates Main Dashboard Collection Position
 */
export function calculateUdhaarDashboardSummary(
  summaries: UdhaarCustomerSummary[],
  asOfDate: string = DEMO_DATE
): UdhaarDashboardSummary {
  let totalOutstanding = 0;
  let totalOverdue = 0;
  let dueInSevenDays = 0;
  let totalCollected = 0;
  let customersWithBalanceCount = 0;
  let overdueCustomersCount = 0;
  let urgentFollowupCount = 0;

  for (const s of summaries) {
    if (s.totalOutstanding > 0) {
      customersWithBalanceCount++;
      totalOutstanding += s.totalOutstanding;
      totalOverdue += s.overdueBalance;

      if (s.overdueBalance > 0) {
        overdueCustomersCount++;
      }

      if (s.priority.band === "urgent") {
        urgentFollowupCount++;
      }

      // Check upcoming invoices due in the next 7 days
      for (const inv of s.invoices) {
        const invDue = outstanding(inv, s.payments);
        if (invDue > 0 && inv.dueDate >= asOfDate) {
          const daysToDue = daysBetween(asOfDate, inv.dueDate);
          if (daysToDue >= 0 && daysToDue <= 7) {
            dueInSevenDays += invDue;
          }
        }
      }
    }

    totalCollected += s.totalPaidHistorical;
  }

  return {
    totalOutstanding,
    totalOverdue,
    dueInSevenDays,
    totalCollected,
    customersWithBalanceCount,
    overdueCustomersCount,
    urgentFollowupCount,
  };
}
