// lib/fintrace-zf/types.ts
/**
 * Formal types for the FINTRACE-ZF Mathematical Algorithm
 * Specification: FINTRACE-ZF (NIST SP 800-207, RFC 8785, RFC 9162, FIPS 186-5, OWASP LLM01)
 */

export type SourceSystem = "pos" | "upi" | "invoice" | "bank";
export type TransactionType = "sale" | "refund" | "fee" | "adjustment";
export type UserRole = "merchant" | "accountant" | "auditor";

export interface UserIdentity {
  id: string;
  role: UserRole;
  permissions: string[];
}

export interface RecordMetadata {
  recordId: string;
  sourceId: SourceSystem;
  timestamp: string;
  currency: string;
  watermark: string;
}

export interface SourceFields {
  transactionType: TransactionType;
  amountMinor: number; // Integer minor units (paise)
  counterparty: string;
  status: "settled" | "pending" | "failed";
  referenceId: string;
  category?: string;
  notes?: string;
}

export interface AuthenticatedRecord {
  metadata: RecordMetadata;
  fields: SourceFields;
  canonicalBytes: string; // Canon(m_i, x_i) per RFC 8785
  recordHash: string;     // h_i = SHA-256("record/v1" || canonicalBytes)
  signature: string;      // sigma_i = Verify(pk_s, h_i, sigma_i)
}

export interface TypedQuestionPlan {
  metric: "sum" | "count" | "average" | "reconcile";
  sourceFilter: SourceSystem[];
  transactionType?: TransactionType;
  timeWindow: {
    start: string;
    end: string;
  };
  currency: string;
  requiresReconciliation?: boolean;
}

export interface MerkleProofStep {
  position: "left" | "right";
  hash: string;
}

export interface MerkleInclusionProof {
  leafHash: string;
  leafIndex: number;
  auditPath: MerkleProofStep[];
  rootHash: string;
}

export interface CalculationTraceStep {
  recordId: string;
  transactionType: TransactionType;
  amountMinor: number;
  runningTotalMinor: number;
}

export interface ProofBundle {
  sourceRecordIds: string[];
  recordHashes: string[];
  merkleRoot: string;
  merkleInclusionProofs: MerkleInclusionProof[];
  calculationTrace: CalculationTraceStep[];
  executedAt: string;
  proofSignature: string;
}

export interface VerifiedFinancialValue {
  amountMinor: number;
  currency: string;
  formattedAmount: string;
  recordCount: number;
  timeWindow: {
    start: string;
    end: string;
  };
}

export interface GateConditions {
  auth: boolean;
  logProof: boolean;
  coverage: boolean;
  replay: boolean;
  lineage: boolean;
  acl: boolean;
  recon?: boolean;
}

export interface VerifiedRelease {
  status: "VERIFIED_RELEASE";
  gatePassed: true;
  value: VerifiedFinancialValue;
  proof: ProofBundle;
  claimId: string;
}

export interface Abstention {
  status: "ABSTAIN";
  gatePassed: false;
  symbol: "⊥";
  reason: string;
  discrepancies: string[];
  gateStatus: GateConditions;
  claimId: string;
}

export type FinTraceZFOutput = VerifiedRelease | Abstention;

export interface ReconciliationSummary {
  expectedMinor: number;
  observedBankMinor: number;
  deltaMinor: number;
  unmatchedRecords: string[];
  isReconciled: boolean;
}
