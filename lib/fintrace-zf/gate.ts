// lib/fintrace-zf/gate.ts
import { MerkleTree, sha256, verifySignature } from "./crypto";
import {
  computeFinancialMetric,
  filterRecordsByPredicate,
  performFinancialReconciliation,
  validateQueryPolicy,
  verifyCompletenessAndUniqueness,
} from "./engine";
import {
  Abstention,
  AuthenticatedRecord,
  FinTraceZFOutput,
  GateConditions,
  MerkleInclusionProof,
  ProofBundle,
  TypedQuestionPlan,
  UserIdentity,
  VerifiedRelease,
} from "./types";

/**
 * Section 05: Zero-Fabrication Verification Gate (ZFVG)
 * ZF = IF(Phi, (v, pi), bot)
 */
export function evaluateZeroFabricationGate(
  plan: TypedQuestionPlan,
  user: UserIdentity,
  records: AuthenticatedRecord[],
  merkleTree: MerkleTree,
  bankRecords?: AuthenticatedRecord[]
): FinTraceZFOutput {
  const claimId = "claim-" + sha256(plan.metric + plan.timeWindow.start + plan.timeWindow.end).slice(0, 12);
  const discrepancies: string[] = [];

  const gateStatus: GateConditions = {
    acl: false,
    auth: false,
    logProof: false,
    coverage: false,
    replay: false,
    lineage: false,
    recon: plan.requiresReconciliation ? false : undefined,
  };

  // 1. ACL & Policy Check
  const policyResult = validateQueryPolicy(plan, user);
  if (!policyResult.valid) {
    discrepancies.push(`Policy violation: ${policyResult.reason}`);
  } else {
    gateStatus.acl = true;
  }

  // 2. Completeness, Uniqueness & Coverage
  const completeness = verifyCompletenessAndUniqueness(records, plan);
  if (!completeness.isComplete) {
    discrepancies.push(...completeness.discrepancies);
  } else {
    gateStatus.coverage = true;
  }

  // 3. Selection S(Q)
  const selectedRecords = filterRecordsByPredicate(records, plan);
  if (selectedRecords.length === 0) {
    discrepancies.push("No settled source records found satisfying query predicate");
  }

  // 4. Source Authenticity: Auth(r_i) = Verify(pk_s, h_i, sigma_i)
  let allSignaturesValid = selectedRecords.length > 0;
  for (const r of selectedRecords) {
    if (!verifySignature(r.recordHash, r.signature)) {
      allSignaturesValid = false;
      discrepancies.push(`Cryptographic signature failed on record: ${r.metadata.recordId}`);
    }
  }
  gateStatus.auth = allSignaturesValid;

  // 5. Cryptographic Log Proof: MerkleIncluded(h_i, rho_e)
  const inclusionProofs: MerkleInclusionProof[] = [];
  let allMerkleProofsValid = selectedRecords.length > 0;
  const rootHash = merkleTree.getRoot();

  for (const r of selectedRecords) {
    const leafIndex = records.findIndex((rec) => rec.recordHash === r.recordHash);
    if (leafIndex === -1) {
      allMerkleProofsValid = false;
      discrepancies.push(`Record ${r.metadata.recordId} not included in authenticated evidence vault`);
      continue;
    }

    const proof = merkleTree.getProof(leafIndex);
    inclusionProofs.push(proof);

    if (!MerkleTree.verifyProof(proof) || proof.rootHash !== rootHash) {
      allMerkleProofsValid = false;
      discrepancies.push(`Merkle inclusion proof invalid for record: ${r.metadata.recordId}`);
    }
  }
  gateStatus.logProof = allMerkleProofsValid;

  // 6. Deterministic Arithmetic & Lineage
  const { verifiedValue, calculationTrace } = computeFinancialMetric(selectedRecords, plan);

  // Lineage check: Leaves(Provenance(c)) subseteq AuthenticatedRecords
  const authRecordIdSet = new Set(records.map((r) => r.metadata.recordId));
  const validLineage = calculationTrace.every((step) => authRecordIdSet.has(step.recordId));
  gateStatus.lineage = validLineage;
  if (!validLineage) {
    discrepancies.push("Calculation lineage references unauthenticated record ID");
  }

  // Replay check: Independent recomputation matches verified value exactly
  const replayed = computeFinancialMetric(selectedRecords, plan);
  const replayMatches = replayed.verifiedValue.amountMinor === verifiedValue.amountMinor;
  gateStatus.replay = replayMatches;
  if (!replayMatches) {
    discrepancies.push("Replay failed: Recomputed total deviates from published value");
  }

  // 7. Independent Financial Reconciliation (if required by claim semantics)
  if (plan.requiresReconciliation) {
    if (!bankRecords || bankRecords.length === 0) {
      discrepancies.push("Reconciliation claim requested but bank statement records are absent");
      gateStatus.recon = false;
    } else {
      const recon = performFinancialReconciliation(selectedRecords, bankRecords);
      gateStatus.recon = recon.isReconciled;
      if (!recon.isReconciled) {
        discrepancies.push(
          `Reconciliation mismatch: Delta = ${recon.deltaMinor / 100} INR; Unmatched records: ${recon.unmatchedRecords.join(", ")}`
        );
      }
    }
  }

  // DECISION RULE: IF(Phi, (v, pi), bot)
  const phiPasses =
    gateStatus.acl &&
    gateStatus.auth &&
    gateStatus.logProof &&
    gateStatus.coverage &&
    gateStatus.replay &&
    gateStatus.lineage &&
    (gateStatus.recon === undefined || gateStatus.recon === true);

  if (phiPasses) {
    const proofBundle: ProofBundle = {
      sourceRecordIds: selectedRecords.map((r) => r.metadata.recordId),
      recordHashes: selectedRecords.map((r) => r.recordHash),
      merkleRoot: rootHash,
      merkleInclusionProofs: inclusionProofs,
      calculationTrace,
      executedAt: new Date().toISOString(),
      proofSignature: sha256(rootHash + verifiedValue.amountMinor.toString()),
    };

    const release: VerifiedRelease = {
      status: "VERIFIED_RELEASE",
      gatePassed: true,
      value: verifiedValue,
      proof: proofBundle,
      claimId,
    };

    return release;
  }

  // FAIL-CLOSED: Return Abstention bot
  const abstention: Abstention = {
    status: "ABSTAIN",
    gatePassed: false,
    symbol: "⊥",
    reason: "Zero-Fabrication Verification Gate (ZFVG) failed proof conditions",
    discrepancies,
    gateStatus,
    claimId,
  };

  return abstention;
}
