import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildNodeKitPresentProjection,
  exportNodeKitPresent,
  HANDOFF_SCHEMA_VERSION,
  NODEKIT_CONTRACT_COMMIT,
  RECEIPT_SCHEMA_VERSION,
} from "../bin/nodekit-present.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function fixtureHandoff(evidencePath = "evidence/assertions.json") {
  return {
    schemaVersion: HANDOFF_SCHEMA_VERSION,
    id: "fixture-change",
    title: "Fixture change",
    changeType: "feature",
    audience: ["reviewer"],
    presentationTier: 1,
    source: {
      repository: "HomenShum/Fixture",
      revision: "abc1234",
      recordedAt: "2026-07-19",
    },
    problem: {
      previousState: "The handoff was prose-only.",
      painOrRisk: "Claims were not bound to evidence.",
      affectedUsers: ["reviewers"],
    },
    decision: {
      selectedApproach: "Export a deterministic evidence-bound story.",
      alternatives: [],
      tradeoffs: ["No presentation is rendered by the adapter."],
    },
    implementation: {
      affectedSystems: ["handoff adapter"],
      importantContracts: ["nodekit.change-story/v1"],
    },
    proofRequirements: ["The assertion map passes."],
    approvalBoundaries: ["No deployment."],
    claims: [
      {
        id: "claim-fixture",
        text: "The fixture assertion passed.",
        status: "verified",
        evidenceIds: ["fixture-assertions"],
        limitations: ["Fixture scope only."],
      },
    ],
    evidence: [
      {
        id: "fixture-assertions",
        kind: "test-run",
        status: "verified",
        path: evidencePath,
        summary: "Fixture boolean assertions.",
        verify: { type: "boolean-map", expectedPassed: 1 },
      },
    ],
    architecture: {
      before: ["Prose handoff"],
      after: ["Evidence-bound Change Story"],
    },
    limitations: ["The fixture is not production evidence."],
    nextMilestone: "Pass the story to an approved presentation transport.",
  };
}

async function createFixture(t, { assertionOk = true, evidencePath } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "betterprhandoff-present-"));
  t.after(() => rm(root, { force: true, recursive: true }));
  await mkdir(path.join(root, "evidence"), { recursive: true });
  await writeFile(
    path.join(root, "evidence", "assertions.json"),
    `${JSON.stringify({ fixture: { ok: assertionOk } }, null, 2)}\n`,
  );
  await writeFile(
    path.join(root, "handoff.json"),
    `${JSON.stringify(fixtureHandoff(evidencePath), null, 2)}\n`,
  );
  return root;
}

test("existing CLI help remains available", () => {
  const result = spawnSync(process.execPath, ["bin/init.mjs", "--help"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /BetterPRHandoff/);
  assert.match(result.stdout, /present <handoff\.json>/);
});

test("existing init command still scaffolds changelog files", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "betterprhandoff-init-"));
  t.after(() => rm(root, { force: true, recursive: true }));
  const result = spawnSync(process.execPath, [path.join(repoRoot, "bin", "init.mjs"), "init"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  await Promise.all([
    readFile(path.join(root, "CHANGELOG", "README.md"), "utf8"),
    readFile(path.join(root, "CHANGELOG", "TEMPLATE.md"), "utf8"),
  ]);
});

test("real archived handoff projects into the NodeKit Change Story and Evidence Index", async () => {
  const result = await buildNodeKitPresentProjection({
    repoRoot,
    sourcePath: "submissions/nodebench-redesign/handoff.json",
    outputDirectory: "changes/nodebench-redesign-chat-sprints-1-4-v2",
  });

  assert.equal(result.artifacts.size, 6);
  assert.equal(result.receipt.schemaVersion, RECEIPT_SCHEMA_VERSION);
  assert.equal(result.receipt.adapter.nodeKitContractSource.commit, NODEKIT_CONTRACT_COMMIT);
  assert.equal(result.receipt.checks.every((check) => check.passed), true);
  assert.equal(
    result.receipt.checks.find((check) => check.id === "evidence:assertions-v2")?.detail,
    "26/26 assertions passed",
  );

  const claims = JSON.parse(result.artifacts.get("story/claims.json"));
  const evidence = JSON.parse(result.artifacts.get("story/evidence-index.json"));
  assert.equal(claims.schemaVersion, "nodekit.presentation-claims/v1");
  assert.equal(evidence.schemaVersion, "nodekit.evidence-index/v1");
  assert.equal(evidence.evidence.every((entry) => entry.location.startsWith("repo://")), true);
  assert.equal(evidence.evidence.every((entry) => entry.contentHash.startsWith("sha256:")), true);
  assert.match(result.artifacts.get("change.yaml"), /^schemaVersion: "nodekit\.change-story\/v1"/);
});

test("write and check modes are deterministic and fail on drift", async (t) => {
  const root = await createFixture(t);
  const options = {
    repoRoot: root,
    sourcePath: "handoff.json",
    outputDirectory: "changes/fixture-change",
  };

  const first = await exportNodeKitPresent(options);
  const second = await buildNodeKitPresentProjection(options);
  assert.deepEqual([...first.artifacts], [...second.artifacts]);

  const checked = await exportNodeKitPresent({ ...options, check: true });
  assert.equal(checked.mode, "checked");

  for (const file of [
    path.join(root, "handoff.json"),
    path.join(root, "evidence", "assertions.json"),
    path.join(root, "changes", "fixture-change", "story", "claims.json"),
  ]) {
    const body = await readFile(file, "utf8");
    await writeFile(file, body.replace(/\r?\n/g, "\r\n"));
  }
  const crossPlatform = await exportNodeKitPresent({ ...options, check: true });
  assert.equal(crossPlatform.mode, "checked");

  await writeFile(path.join(root, "changes", "fixture-change", "story", "claims.json"), "{}\n");
  await assert.rejects(
    () => exportNodeKitPresent({ ...options, check: true }),
    /claims\.json does not match the deterministic projection/,
  );
});

test("the adapter fails closed for false assertions and repository traversal", async (t) => {
  const falseRoot = await createFixture(t, { assertionOk: false });
  await assert.rejects(
    () => buildNodeKitPresentProjection({
      repoRoot: falseRoot,
      sourcePath: "handoff.json",
      outputDirectory: "changes/fixture-change",
    }),
    /has 0\/1 passing assertions/,
  );

  const traversalRoot = await createFixture(t, { evidencePath: "../outside.json" });
  await assert.rejects(
    () => buildNodeKitPresentProjection({
      repoRoot: traversalRoot,
      sourcePath: "handoff.json",
      outputDirectory: "changes/fixture-change",
    }),
    /must stay inside the repository/,
  );
});

test("flat NodeKit protocol manifest declares runnable lifecycle commands", async () => {
  const [manifest, packageJson] = await Promise.all([
    readFile(path.join(repoRoot, "nodekit.yaml"), "utf8"),
    readFile(path.join(repoRoot, "package.json"), "utf8").then(JSON.parse),
  ]);
  assert.match(manifest, /^schemaVersion: nodekit\.repo\/v1/m);
  assert.doesNotMatch(manifest, /^(?:apiVersion|kind|spec):/m);
  assert.match(manifest, /^commandProfile: protocol$/m);
  for (const script of ["doctor", "check", "proof"]) {
    assert.equal(typeof packageJson.scripts[script], "string");
  }
});
