import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const HANDOFF_SCHEMA_VERSION = "betterprhandoff.handoff/v1";
export const CHANGE_STORY_SCHEMA_VERSION = "nodekit.change-story/v1";
export const CLAIMS_SCHEMA_VERSION = "nodekit.presentation-claims/v1";
export const EVIDENCE_INDEX_SCHEMA_VERSION = "nodekit.evidence-index/v1";
export const ARCHITECTURE_DIFF_SCHEMA_VERSION = "nodekit.architecture-diff/v1";
export const LIMITATIONS_SCHEMA_VERSION = "nodekit.change-limitations/v1";
export const RECEIPT_SCHEMA_VERSION = "betterprhandoff.nodekit-present-receipt/v1";
export const NODEKIT_CONTRACT_COMMIT = "05b4e0e";

const ADAPTER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CLAIM_STATUSES = new Set([
  "verified",
  "measured",
  "observed",
  "user_asserted",
  "planned",
]);
const TEXT_EXTENSIONS = new Set([
  ".css", ".html", ".js", ".json", ".md", ".mjs", ".mustache", ".txt", ".yaml", ".yml",
]);

function fail(message) {
  throw new Error(`NodeKit Present export: ${message}`);
}

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  return value;
}

function requireString(value, label) {
  if (typeof value !== "string" || !value.trim()) fail(`${label} must be a non-empty string`);
  return value;
}

function requireStringArray(value, label, { allowEmpty = false } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    fail(`${label} must be ${allowEmpty ? "an" : "a non-empty"} array`);
  }
  value.forEach((entry, index) => requireString(entry, `${label}[${index}]`));
  return value;
}

function normalizeRepoPath(value) {
  return value.split(path.sep).join("/");
}

function relativeRepoPath(repoRoot, absolutePath, label) {
  const relative = path.relative(repoRoot, absolutePath);
  if (!relative || relative === ".") return ".";
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    fail(`${label} must stay inside the repository`);
  }
  return normalizeRepoPath(relative);
}

function resolveRepoPath(repoRoot, value, label) {
  requireString(value, label);
  if (path.isAbsolute(value)) fail(`${label} must be repository-relative`);
  const absolute = path.resolve(repoRoot, value);
  relativeRepoPath(repoRoot, absolute, label);
  return absolute;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalBytes(filePath, bytes) {
  if (!TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase())) return bytes;
  return Buffer.from(bytes.toString("utf8").replace(/\r\n?/g, "\n"), "utf8");
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function yamlScalar(value) {
  if (value === null) return "null";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  return JSON.stringify(value);
}

function yamlLines(value, indent = 0) {
  const pad = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return [`${pad}[]`];
    return value.flatMap((entry) => {
      if (entry === null || typeof entry !== "object") return [`${pad}- ${yamlScalar(entry)}`];
      return [`${pad}-`, ...yamlLines(entry, indent + 2)];
    });
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return [`${pad}{}`];
    return entries.flatMap(([key, entry]) => {
      if (entry === null || typeof entry !== "object") {
        return [`${pad}${key}: ${yamlScalar(entry)}`];
      }
      if (Array.isArray(entry) && entry.length === 0) return [`${pad}${key}: []`];
      if (!Array.isArray(entry) && Object.keys(entry).length === 0) return [`${pad}${key}: {}`];
      return [`${pad}${key}:`, ...yamlLines(entry, indent + 2)];
    });
  }
  return [`${pad}${yamlScalar(value)}`];
}

function yaml(value) {
  return `${yamlLines(value).join("\n")}\n`;
}

function validateHandoff(payload) {
  requireObject(payload, "handoff");
  if (payload.schemaVersion !== HANDOFF_SCHEMA_VERSION) {
    fail(`handoff.schemaVersion must be ${HANDOFF_SCHEMA_VERSION}`);
  }
  requireString(payload.id, "handoff.id");
  if (!/^[a-z0-9]+(?:[a-z0-9._-]*[a-z0-9])?$/.test(payload.id)) {
    fail("handoff.id must be a lowercase file-safe identifier");
  }
  requireString(payload.title, "handoff.title");
  requireString(payload.changeType, "handoff.changeType");
  requireStringArray(payload.audience, "handoff.audience");
  if (!Number.isInteger(payload.presentationTier) || payload.presentationTier < 0 || payload.presentationTier > 4) {
    fail("handoff.presentationTier must be an integer from 0 through 4");
  }

  const source = requireObject(payload.source, "handoff.source");
  requireString(source.repository, "handoff.source.repository");
  requireString(source.recordedAt, "handoff.source.recordedAt");

  const problem = requireObject(payload.problem, "handoff.problem");
  requireString(problem.previousState, "handoff.problem.previousState");
  requireString(problem.painOrRisk, "handoff.problem.painOrRisk");
  requireStringArray(problem.affectedUsers, "handoff.problem.affectedUsers");

  const decision = requireObject(payload.decision, "handoff.decision");
  requireString(decision.selectedApproach, "handoff.decision.selectedApproach");
  requireStringArray(decision.alternatives, "handoff.decision.alternatives", { allowEmpty: true });
  requireStringArray(decision.tradeoffs, "handoff.decision.tradeoffs", { allowEmpty: true });

  const implementation = requireObject(payload.implementation, "handoff.implementation");
  requireStringArray(implementation.affectedSystems, "handoff.implementation.affectedSystems");
  requireStringArray(implementation.importantContracts, "handoff.implementation.importantContracts");
  requireStringArray(payload.proofRequirements, "handoff.proofRequirements");
  requireStringArray(payload.approvalBoundaries, "handoff.approvalBoundaries", { allowEmpty: true });
  requireStringArray(payload.limitations, "handoff.limitations");
  requireString(payload.nextMilestone, "handoff.nextMilestone");

  if (!Array.isArray(payload.evidence) || payload.evidence.length === 0) {
    fail("handoff.evidence must be a non-empty array");
  }
  if (!Array.isArray(payload.claims) || payload.claims.length === 0) {
    fail("handoff.claims must be a non-empty array");
  }
  requireObject(payload.architecture, "handoff.architecture");
  requireStringArray(payload.architecture.before, "handoff.architecture.before");
  requireStringArray(payload.architecture.after, "handoff.architecture.after");
}

function projectClaim(claim, evidenceIds, index) {
  requireObject(claim, `handoff.claims[${index}]`);
  requireString(claim.id, `handoff.claims[${index}].id`);
  requireString(claim.text, `handoff.claims[${index}].text`);
  if (!CLAIM_STATUSES.has(claim.status)) {
    fail(`handoff.claims[${index}].status is not a NodeKit claim status`);
  }
  requireStringArray(claim.evidenceIds, `handoff.claims[${index}].evidenceIds`);
  for (const evidenceId of claim.evidenceIds) {
    if (!evidenceIds.has(evidenceId)) fail(`claim ${claim.id} references unknown evidence ${evidenceId}`);
  }
  requireStringArray(claim.limitations, `handoff.claims[${index}].limitations`, { allowEmpty: true });

  const projected = {
    id: claim.id,
    text: claim.text,
    status: claim.status,
    evidenceIds: [...claim.evidenceIds],
  };
  if (claim.scope !== undefined) projected.scope = requireObject(claim.scope, `handoff.claims[${index}].scope`);
  projected.limitations = [...claim.limitations];
  return projected;
}

async function projectEvidence(repoRoot, evidence, index) {
  requireObject(evidence, `handoff.evidence[${index}]`);
  const id = requireString(evidence.id, `handoff.evidence[${index}].id`);
  const kind = requireString(evidence.kind, `handoff.evidence[${index}].kind`);
  const status = requireString(evidence.status, `handoff.evidence[${index}].status`);
  if (!CLAIM_STATUSES.has(status)) fail(`handoff.evidence[${index}].status is not a NodeKit evidence status`);
  const summary = requireString(evidence.summary, `handoff.evidence[${index}].summary`);
  const hasPath = typeof evidence.path === "string" && evidence.path.length > 0;
  const hasLocation = typeof evidence.location === "string" && evidence.location.length > 0;
  if (hasPath === hasLocation) fail(`evidence ${id} must declare exactly one of path or location`);

  if (hasLocation) {
    return {
      projected: { id, kind, status, location: evidence.location, summary },
      receipt: null,
      verification: null,
    };
  }

  const absolute = resolveRepoPath(repoRoot, evidence.path, `evidence ${id}.path`);
  let bytes;
  try {
    bytes = await readFile(absolute);
  } catch (error) {
    fail(`evidence ${id} cannot be read at ${evidence.path}: ${error.message}`);
  }
  const repoPath = relativeRepoPath(repoRoot, absolute, `evidence ${id}.path`);
  const contentHash = `sha256:${sha256(canonicalBytes(repoPath, bytes))}`;
  let verification = null;

  if (evidence.verify !== undefined) {
    const verify = requireObject(evidence.verify, `evidence ${id}.verify`);
    if (verify.type !== "boolean-map") fail(`evidence ${id}.verify.type must be boolean-map`);
    let assertions;
    try {
      assertions = JSON.parse(bytes.toString("utf8"));
    } catch (error) {
      fail(`evidence ${id} is not valid JSON: ${error.message}`);
    }
    requireObject(assertions, `evidence ${id} assertions`);
    const values = Object.values(assertions);
    const passed = values.filter((entry) => entry?.ok === true).length;
    if (values.length === 0 || passed !== values.length) {
      fail(`evidence ${id} has ${passed}/${values.length} passing assertions`);
    }
    if (verify.expectedPassed !== undefined && verify.expectedPassed !== passed) {
      fail(`evidence ${id} expected ${verify.expectedPassed} passing assertions but found ${passed}`);
    }
    verification = { type: "boolean-map", passed, total: values.length };
  }

  return {
    projected: {
      id,
      kind,
      status,
      location: `repo://${repoPath}`,
      summary,
      contentHash,
      ...(verification ? { verification } : {}),
    },
    receipt: { id, path: repoPath, contentHash },
    verification,
  };
}

export async function buildNodeKitPresentProjection({ repoRoot, sourcePath, outputDirectory }) {
  const root = path.resolve(repoRoot);
  const sourceAbsolute = resolveRepoPath(root, sourcePath, "sourcePath");
  const sourceRepoPath = relativeRepoPath(root, sourceAbsolute, "sourcePath");
  let sourceBytes;
  let payload;
  try {
    sourceBytes = await readFile(sourceAbsolute);
    payload = JSON.parse(sourceBytes.toString("utf8"));
  } catch (error) {
    fail(`cannot read source handoff ${sourceRepoPath}: ${error.message}`);
  }
  validateHandoff(payload);

  const outputAbsolute = resolveRepoPath(root, outputDirectory ?? `changes/${payload.id}`, "outputDirectory");
  const outputRepoPath = relativeRepoPath(root, outputAbsolute, "outputDirectory");
  if (outputRepoPath === ".") fail("outputDirectory cannot be the repository root");

  const evidenceIds = new Set();
  for (const [index, evidence] of payload.evidence.entries()) {
    requireString(evidence?.id, `handoff.evidence[${index}].id`);
    if (evidenceIds.has(evidence.id)) fail(`handoff.evidence repeats id ${evidence.id}`);
    evidenceIds.add(evidence.id);
  }

  const projectedEvidence = [];
  const evidenceReceipts = [];
  const verificationChecks = [];
  for (const [index, evidence] of payload.evidence.entries()) {
    const result = await projectEvidence(root, evidence, index);
    projectedEvidence.push(result.projected);
    if (result.receipt) evidenceReceipts.push(result.receipt);
    if (result.verification) {
      verificationChecks.push({
        id: `evidence:${evidence.id}`,
        passed: true,
        detail: `${result.verification.passed}/${result.verification.total} assertions passed`,
      });
    }
  }

  const projectedClaims = payload.claims.map((claim, index) => projectClaim(claim, evidenceIds, index));
  if (new Set(projectedClaims.map((claim) => claim.id)).size !== projectedClaims.length) {
    fail("handoff.claims contains duplicate ids");
  }

  const change = {
    schemaVersion: CHANGE_STORY_SCHEMA_VERSION,
    id: payload.id,
    title: payload.title,
    changeType: payload.changeType,
    audience: [...payload.audience],
    presentationTier: payload.presentationTier,
    problem: {
      previousState: payload.problem.previousState,
      painOrRisk: payload.problem.painOrRisk,
      affectedUsers: [...payload.problem.affectedUsers],
    },
    decision: {
      selectedApproach: payload.decision.selectedApproach,
      alternatives: [...payload.decision.alternatives],
      tradeoffs: [...payload.decision.tradeoffs],
    },
    implementation: {
      affectedSystems: [...payload.implementation.affectedSystems],
      importantContracts: [...payload.implementation.importantContracts],
    },
    proofRequirements: [...payload.proofRequirements],
    approvalBoundaries: [...payload.approvalBoundaries],
    limitations: [...payload.limitations],
    nextMilestone: payload.nextMilestone,
  };

  const artifacts = new Map([
    ["change.yaml", yaml(change)],
    ["story/claims.json", json({
      schemaVersion: CLAIMS_SCHEMA_VERSION,
      changeId: payload.id,
      claims: projectedClaims,
    })],
    ["story/evidence-index.json", json({
      schemaVersion: EVIDENCE_INDEX_SCHEMA_VERSION,
      changeId: payload.id,
      evidence: projectedEvidence,
    })],
    ["story/architecture-diff.json", json({
      schemaVersion: ARCHITECTURE_DIFF_SCHEMA_VERSION,
      changeId: payload.id,
      before: [...payload.architecture.before],
      after: [...payload.architecture.after],
    })],
    ["story/limitations.json", json({
      schemaVersion: LIMITATIONS_SCHEMA_VERSION,
      changeId: payload.id,
      limitations: [...payload.limitations],
    })],
  ]);

  const artifactReceipts = [...artifacts.entries()].map(([artifactPath, body]) => ({
    path: artifactPath,
    schemaVersion: artifactPath === "change.yaml"
      ? CHANGE_STORY_SCHEMA_VERSION
      : JSON.parse(body).schemaVersion,
    contentHash: `sha256:${sha256(Buffer.from(body, "utf8"))}`,
  }));

  const [implementationBytes, schemaBytes] = await Promise.all([
    readFile(path.join(ADAPTER_ROOT, "bin", "nodekit-present.mjs")),
    readFile(path.join(ADAPTER_ROOT, "templates", "handoff-schema.json")),
  ]);
  const receipt = {
    schemaVersion: RECEIPT_SCHEMA_VERSION,
    adapter: {
      implementation: {
        location: "package://bin/nodekit-present.mjs",
      contentHash: `sha256:${sha256(canonicalBytes("nodekit-present.mjs", implementationBytes))}`,
      },
      sourceSchema: {
        location: "package://templates/handoff-schema.json",
        schemaVersion: HANDOFF_SCHEMA_VERSION,
        contentHash: `sha256:${sha256(canonicalBytes("handoff-schema.json", schemaBytes))}`,
      },
      command: `node bin/init.mjs present ${sourceRepoPath} --out ${outputRepoPath} --check`,
      deterministic: true,
      nodeKitContractSource: {
        repository: "HomenShum/node-platform",
        commit: NODEKIT_CONTRACT_COMMIT,
        changeStoryContract: "plugins/nodekit/skills/nodekit-present/references/change-story-contract.md",
      },
    },
    source: {
      path: sourceRepoPath,
      schemaVersion: payload.schemaVersion,
      repository: payload.source.repository,
      ...(payload.source.revision ? { revision: payload.source.revision } : {}),
      recordedAt: payload.source.recordedAt,
      ...(payload.source.pullRequests ? { pullRequests: [...payload.source.pullRequests] } : {}),
      contentHash: `sha256:${sha256(canonicalBytes(sourceRepoPath, sourceBytes))}`,
    },
    result: {
      changeId: payload.id,
      outputDirectory: outputRepoPath,
      artifacts: artifactReceipts,
      evidenceFiles: evidenceReceipts.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)),
    },
    checks: [
      { id: "source-contract", passed: true, detail: HANDOFF_SCHEMA_VERSION },
      { id: "nodekit-contract-pin", passed: true, detail: NODEKIT_CONTRACT_COMMIT },
      { id: "claim-evidence-bindings", passed: true, detail: `${projectedClaims.length} claims bound` },
      { id: "evidence-files-resolved", passed: true, detail: `${evidenceReceipts.length} local artifacts hashed` },
      ...verificationChecks,
      { id: "limitations-visible", passed: payload.limitations.length > 0, detail: `${payload.limitations.length} limitations` },
    ],
  };

  artifacts.set("evidence/tests/nodekit-present-receipt.json", json(receipt));
  return { artifacts, outputAbsolute, outputRepoPath, payload, receipt };
}

export async function exportNodeKitPresent(options) {
  const projection = await buildNodeKitPresentProjection(options);
  const mismatches = [];

  if (options.check) {
    for (const [artifactPath, expected] of projection.artifacts) {
      const target = path.join(projection.outputAbsolute, artifactPath);
      let actual;
      try {
        actual = await readFile(target, "utf8");
      } catch {
        mismatches.push(`${artifactPath} is missing`);
        continue;
      }
      if (actual.replace(/\r\n?/g, "\n") !== expected) {
        mismatches.push(`${artifactPath} does not match the deterministic projection`);
      }
    }
    if (mismatches.length > 0) fail(`proof check failed:\n- ${mismatches.join("\n- ")}`);
    return { ...projection, mode: "checked" };
  }

  for (const [artifactPath, body] of projection.artifacts) {
    const target = path.join(projection.outputAbsolute, artifactPath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body, "utf8");
  }
  return { ...projection, mode: "written" };
}
