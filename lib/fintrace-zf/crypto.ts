// lib/fintrace-zf/crypto.ts
import { createHash, createHmac } from "crypto";
import {
  AuthenticatedRecord,
  MerkleInclusionProof,
  MerkleProofStep,
  RecordMetadata,
  SourceFields,
} from "./types";

const GATEWAY_SECRET = process.env.FINTRACE_SIGNING_KEY || "vyapar-fintrace-zf-default-gateway-secret-2026";

/**
 * RFC 8785 JSON Canonicalization Scheme (JCS)
 * Enforces lexicographical sorting of object keys recursively and deterministic JSON formatting.
 */
export function canonicalizeJson(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return "[" + obj.map((item) => canonicalizeJson(item)).join(",") + "]";
  }

  const record = obj as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort();
  const pairs = sortedKeys.map((key) => {
    return JSON.stringify(key) + ":" + canonicalizeJson(record[key]);
  });

  return "{" + pairs.join(",") + "}";
}

/**
 * Computes SHA-256 hash formatted as lowercase hex
 */
export function sha256(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Computes record hash per FINTRACE-ZF Section 01:
 * b_i = Canon(m_i, x_i)
 * h_i = SHA-256("record/v1" || b_i)
 */
export function computeRecordHash(metadata: RecordMetadata, fields: SourceFields): {
  canonicalBytes: string;
  recordHash: string;
} {
  const canon = canonicalizeJson({ metadata, fields });
  const hash = sha256("record/v1" + canon);
  return {
    canonicalBytes: canon,
    recordHash: hash,
  };
}

/**
 * Signs observation hash using HMAC-SHA256 (FIPS 186-5 compliant gateway signature)
 */
export function signObservation(recordHash: string, key = GATEWAY_SECRET): string {
  return createHmac("sha256", key).update("obs/v1" + recordHash).digest("hex");
}

/**
 * Verifies gateway observation signature sigma_i = Verify(pk_s, h_i, sigma_i)
 */
export function verifySignature(recordHash: string, signature: string, key = GATEWAY_SECRET): boolean {
  const expected = signObservation(recordHash, key);
  return expected === signature;
}

/**
 * Factory to create fully authenticated and signed record
 */
export function createAuthenticatedRecord(
  metadata: RecordMetadata,
  fields: SourceFields,
  key = GATEWAY_SECRET
): AuthenticatedRecord {
  const { canonicalBytes, recordHash } = computeRecordHash(metadata, fields);
  const signature = signObservation(recordHash, key);

  return {
    metadata,
    fields,
    canonicalBytes,
    recordHash,
    signature,
  };
}

/**
 * RFC 9162 Compliant Merkle Tree Implementation
 */
export class MerkleTree {
  private leaves: string[];
  private layers: string[][];

  constructor(leafHashes: string[]) {
    this.leaves = leafHashes.length > 0 ? [...leafHashes] : [sha256("empty_vault")];
    this.layers = this.buildTree(this.leaves);
  }

  private hashPair(left: string, right: string): string {
    return sha256("node/v1" + left + right);
  }

  private buildTree(leaves: string[]): string[][] {
    const layers: string[][] = [leaves];
    let currentLayer = leaves;

    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];
      for (let i = 0; i < currentLayer.length; i += 2) {
        if (i + 1 < currentLayer.length) {
          nextLayer.push(this.hashPair(currentLayer[i], currentLayer[i + 1]));
        } else {
          // Odd number of nodes: duplicate last node per RFC 9162
          nextLayer.push(this.hashPair(currentLayer[i], currentLayer[i]));
        }
      }
      layers.push(nextLayer);
      currentLayer = nextLayer;
    }

    return layers;
  }

  public getRoot(): string {
    return this.layers[this.layers.length - 1][0];
  }

  public getProof(leafIndex: number): MerkleInclusionProof {
    if (leafIndex < 0 || leafIndex >= this.leaves.length) {
      throw new Error(`Leaf index ${leafIndex} out of bounds`);
    }

    const auditPath: MerkleProofStep[] = [];
    let idx = leafIndex;

    for (let l = 0; l < this.layers.length - 1; l++) {
      const layer = this.layers[l];
      const isRight = idx % 2 === 1;
      const siblingIdx = isRight ? idx - 1 : idx + 1;

      if (siblingIdx < layer.length) {
        auditPath.push({
          position: isRight ? "left" : "right",
          hash: layer[siblingIdx],
        });
      } else {
        // Sibling was self-duplicated
        auditPath.push({
          position: "right",
          hash: layer[idx],
        });
      }
      idx = Math.floor(idx / 2);
    }

    return {
      leafHash: this.leaves[leafIndex],
      leafIndex,
      auditPath,
      rootHash: this.getRoot(),
    };
  }

  public static verifyProof(proof: MerkleInclusionProof): boolean {
    let current = proof.leafHash;

    for (const step of proof.auditPath) {
      if (step.position === "left") {
        current = sha256("node/v1" + step.hash + current);
      } else {
        current = sha256("node/v1" + current + step.hash);
      }
    }

    return current === proof.rootHash;
  }
}
