// tests/fintrace-zf.test.ts
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  canonicalizeJson,
  createAuthenticatedRecord,
  createSampleAuthenticatedLedger,
  MerkleTree,
  performFinancialReconciliation,
  queryFinTraceZF,
  UserIdentity,
} from "../lib/fintrace-zf";

describe("FINTRACE-ZF Algorithm Specification Tests", () => {
  const merchantUser: UserIdentity = {
    id: "user-sharma",
    role: "merchant",
    permissions: ["read:transactions", "read:reconcile"],
  };

  test("Section 01: Enforces RFC 8785 deterministic JSON canonicalization regardless of key order", () => {
    const obj1 = { z: 1, a: "test", m: { b: 2, a: 1 } };
    const obj2 = { a: "test", m: { a: 1, b: 2 }, z: 1 };
    assert.equal(canonicalizeJson(obj1), canonicalizeJson(obj2));
    assert.equal(canonicalizeJson(obj1), '{"a":"test","m":{"a":1,"b":2},"z":1}');
  });

  test("Section 01: Verifies Merkle tree construction and inclusion proofs per RFC 9162", () => {
    const { records } = createSampleAuthenticatedLedger();
    const hashes = records.map((r) => r.recordHash);
    const tree = new MerkleTree(hashes);

    assert.ok(tree.getRoot());

    for (let i = 0; i < hashes.length; i++) {
      const proof = tree.getProof(i);
      assert.equal(proof.leafHash, hashes[i]);
      assert.equal(MerkleTree.verifyProof(proof), true);
    }
  });

  test("Section 01: Fails Merkle proof verification if a leaf hash is altered", () => {
    const { records } = createSampleAuthenticatedLedger();
    const hashes = records.map((r) => r.recordHash);
    const tree = new MerkleTree(hashes);

    const proof = tree.getProof(0);
    const tamperedProof = {
      ...proof,
      leafHash: "tampered_leaf_hash",
    };

    assert.equal(MerkleTree.verifyProof(tamperedProof), false);
  });

  test("Section 02 & 03: Computes exact integer minor units (paise) without floating point errors", () => {
    const { records } = createSampleAuthenticatedLedger();
    const upiRecords = records.filter((r) => r.metadata.sourceId === "upi");
    // 250000 paise (2500 INR) + 480000 paise (4800 INR) = 730000 paise (7300 INR)
    const totalPaise = upiRecords.reduce((acc, r) => acc + r.fields.amountMinor, 0);
    assert.equal(totalPaise, 730000);
    assert.equal(Number.isInteger(totalPaise), true);
  });

  test("Section 04: Reconciles matching POS/UPI settlement against bank statement (Delta = 0)", () => {
    const { records, bankRecords } = createSampleAuthenticatedLedger();
    const upiAndPosRecords = records.filter(
      (r) => r.metadata.sourceId === "upi" || r.metadata.sourceId === "pos"
    );
    const recon = performFinancialReconciliation(upiAndPosRecords, bankRecords);

    assert.equal(recon.expectedMinor, 250000 + 480000 + 1250000);
    assert.equal(recon.observedBankMinor, recon.expectedMinor);
    assert.equal(recon.deltaMinor, 0);
    assert.equal(recon.unmatchedRecords.length, 0);
    assert.equal(recon.isReconciled, true);
  });

  test("Section 04: Detects discrepancy when bank amount diverges from expected ledger", () => {
    const { records, bankRecords } = createSampleAuthenticatedLedger();
    const tamperedBank = [
      ...bankRecords.slice(0, 2),
      createAuthenticatedRecord(bankRecords[2].metadata, {
        ...bankRecords[2].fields,
        amountMinor: 1000000, // Short by 250000 paise
      }),
    ];

    const upiAndPosRecords = records.filter(
      (r) => r.metadata.sourceId === "upi" || r.metadata.sourceId === "pos"
    );
    const recon = performFinancialReconciliation(upiAndPosRecords, tamperedBank);

    assert.equal(recon.isReconciled, false);
    assert.equal(recon.deltaMinor, -250000);
  });

  test("Section 05: Releases verified result (v, pi) when all gate conditions pass", () => {
    const { records } = createSampleAuthenticatedLedger();

    const result = queryFinTraceZF(
      "What were my UPI sales in September?",
      merchantUser,
      records
    );

    assert.equal(result.status, "VERIFIED_RELEASE");
    if (result.status === "VERIFIED_RELEASE") {
      assert.equal(result.gatePassed, true);
      assert.equal(result.value.amountMinor, 730000); // ₹7,300.00
      assert.equal(result.value.recordCount, 2);
      assert.deepEqual(result.proof.sourceRecordIds, ["TXN-UPI-901", "TXN-UPI-902"]);
      assert.equal(result.proof.merkleInclusionProofs.length, 2);
    }
  });

  test("Section 05: Fails closed (returns bot / ABSTAIN) if a record signature is tampered", () => {
    const { records } = createSampleAuthenticatedLedger();
    const tamperedRecords = [
      { ...records[0], signature: "tampered_signature_hex" },
      ...records.slice(1),
    ];

    const result = queryFinTraceZF(
      "What were my UPI sales in September?",
      merchantUser,
      tamperedRecords
    );

    assert.equal(result.status, "ABSTAIN");
    if (result.status === "ABSTAIN") {
      assert.equal(result.symbol, "⊥");
      assert.equal(result.gateStatus.auth, false);
      assert.ok(result.discrepancies.some((d) => d.includes("signature failed")));
    }
  });

  test("Section 05: Fails closed (returns bot / ABSTAIN) if time watermark coverage is incomplete", () => {
    const { records } = createSampleAuthenticatedLedger();
    const outdatedRecords = records.map((r) => ({
      ...r,
      metadata: {
        ...r.metadata,
        watermark: "2026-09-10T00:00:00.000Z", // Prior to window end Sept 30
      },
    }));

    const result = queryFinTraceZF(
      "What were my UPI sales in September?",
      merchantUser,
      outdatedRecords
    );

    assert.equal(result.status, "ABSTAIN");
    if (result.status === "ABSTAIN") {
      assert.equal(result.gateStatus.coverage, false);
      assert.ok(result.discrepancies.some((d) => d.includes("Incomplete time coverage")));
    }
  });

  test("Section 05: Fails closed (returns bot / ABSTAIN) on duplicate transaction conflicts", () => {
    const { records } = createSampleAuthenticatedLedger();
    const duplicateRecords = [...records, records[0]];

    const result = queryFinTraceZF(
      "What were my UPI sales in September?",
      merchantUser,
      duplicateRecords
    );

    assert.equal(result.status, "ABSTAIN");
    if (result.status === "ABSTAIN") {
      assert.equal(result.gateStatus.coverage, false);
      assert.ok(result.discrepancies.some((d) => d.includes("Duplicate transaction conflict")));
    }
  });
});
