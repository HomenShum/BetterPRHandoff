/**
 * Characterization tests for the `easier` CLI.
 *
 * These do not test units. Each block is a person trying to finish a job, run
 * against the real CLI in a real throwaway directory, asserting the exit code
 * and the files that actually appeared on disk. That is deliberate: this tool's
 * entire job is "make files and exit with a truthful code", so a test that
 * stubbed the filesystem would prove nothing a reader cares about.
 *
 * Written BEFORE the wave-3 refactor, to pin down behaviour that had no
 * protection at all (see promotion/PROMOTION_LOG.md defect D4). Any assertion
 * below that encodes a KNOWN defect says so, names the defect id, and is
 * expected to be flipped deliberately when that defect is fixed.
 *
 * Run: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(REPO, "bin", "init.mjs");
const CATEGORIES = ["pages", "components", "server", "db", "integrations", "scripts"];

/** Run the CLI in `cwd` exactly as a user would, with colour codes stripped. */
function easier(cwd, ...args) {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8" });
  const strip = (s) => (s || "").replace(/\x1b\[[0-9;]*m/g, "");
  return { code: r.status, out: strip(r.stdout) + strip(r.stderr) };
}

/** A throwaway directory that cleans itself up when the test block ends. */
function sandbox(fn) {
  const dir = mkdtempSync(join(tmpdir(), "easier-test-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const today = new Date().toISOString().slice(0, 10);

// ── Journey 1: a solo developer adopts the protocol in their own repo ───────

test("J1 init scaffolds the six lanes, the index and the format spec", () => {
  sandbox((dir) => {
    const r = easier(dir, "init");
    assert.equal(r.code, 0, r.out);
    assert.ok(existsSync(join(dir, "CHANGELOG", "README.md")), "master index missing");
    assert.ok(existsSync(join(dir, "CHANGELOG", "TEMPLATE.md")), "format spec missing");
    for (const c of CATEGORIES) {
      assert.ok(existsSync(join(dir, "CHANGELOG", c)), `lane dir ${c} missing`);
    }
  });
});

test("J1 init on an existing CHANGELOG refuses to clobber and still exits 0", () => {
  sandbox((dir) => {
    easier(dir, "init");
    writeFileSync(join(dir, "CHANGELOG", "README.md"), "MY OWN INDEX");
    const r = easier(dir, "init");
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /already exists/);
    assert.equal(readFileSync(join(dir, "CHANGELOG", "README.md"), "utf8"), "MY OWN INDEX");
  });
});

test("J1 add writes a dated lane file naming the surface it tracks", () => {
  sandbox((dir) => {
    easier(dir, "init");
    const r = easier(dir, "add", "components", "Button");
    assert.equal(r.code, 0, r.out);
    const body = readFileSync(join(dir, "CHANGELOG", "components", "Button.md"), "utf8");
    assert.match(body, /components\/Button/, "lane does not name its own surface");
    assert.match(
      body,
      new RegExp(`^## ${today} — Created — initial implementation$`, "m"),
      "the newest entry heading was not dated today",
    );

    // KNOWN DEFECT D7 (promotion/PROMOTION_LOG.md). The first assertion written
    // here was `!body.includes("YYYY-MM-DD —")` and it FAILED on the unmodified
    // tree: `add` substitutes only the topmost heading, so the template's two
    // sample entries ("Older entry", a second "Created") survive into the new
    // lane carrying a fake commit sha, and the topmost entry keeps a dangling
    // `**Touches**:` placeholder. Pinned at the observed count so a fix has to
    // change this number deliberately rather than by accident.
    const leftovers = body.match(/^## YYYY-MM-DD —/gm) ?? [];
    assert.equal(leftovers.length, 3, "expected 2 sample entries + 1 inside the entry-template fence");
    assert.match(body, /\*\*Touches\*\*: `<other CHANGELOG files affected>`/);
  });
});

test("J1 add refuses to overwrite an existing lane", () => {
  sandbox((dir) => {
    easier(dir, "init");
    easier(dir, "add", "components", "Button");
    const r = easier(dir, "add", "components", "Button");
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /already exists/);
  });
});

test("J1 add rejects a category that is not one of the six, and lists the six", () => {
  sandbox((dir) => {
    easier(dir, "init");
    const r = easier(dir, "add", "widgets", "Thing");
    assert.equal(r.code, 1, r.out);
    for (const c of CATEGORIES) assert.match(r.out, new RegExp(c));
  });
});

test("J1 add with no arguments prints usage and fails", () => {
  sandbox((dir) => {
    const r = easier(dir, "add");
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /Usage/);
  });
});

test("J1 the next steps init prints can be followed in the order printed (D6)", () => {
  sandbox((dir) => {
    const r = easier(dir, "init");
    const steps = r.out.split("Next steps:")[1];
    const readMe = steps.match(/\S*bootstrap-prompt\.md/)[0];
    const install = steps.indexOf("npx easier install");
    const bootstrap = steps.indexOf(readMe);
    assert.ok(install < bootstrap, "step order sends the reader to a file that does not exist yet");
    // Following the steps as printed must actually land on that file.
    easier(dir, "install", "project");
    assert.ok(existsSync(join(dir, readMe)), `init pointed at ${readMe}, which install did not create`);
  });
});

// ── Journey 2: a teammate clones the repo the first developer committed ─────

test("J2 KNOWN DEFECT D1 — add fails in a clone because git drops empty lane dirs", () => {
  sandbox((dir) => {
    easier(dir, "init");
    // Reproduce what `git clone` hands the second person: git does not track
    // empty directories, so every lane dir that never received a file is gone.
    for (const c of CATEGORIES) rmSync(join(dir, "CHANGELOG", c), { recursive: true, force: true });
    const r = easier(dir, "add", "pages", "dashboard");
    // Pinned as-is on purpose. This is defect D1 in promotion/PROMOTION_LOG.md,
    // not desired behaviour. Fixing D1 should flip this to code 0.
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /does not exist/);
  });
});

// ── Journey 4: preparing a reviewer hand-off packet ────────────────────────

test("J4 qa-init writes a valid qa.config.json and will not overwrite it", () => {
  sandbox((dir) => {
    const first = easier(dir, "qa-init");
    assert.equal(first.code, 0, first.out);
    const cfg = join(dir, "qa.config.json");
    JSON.parse(readFileSync(cfg, "utf8")); // throws if the shipped example is not valid JSON
    writeFileSync(cfg, '{"mine":true}');
    const second = easier(dir, "qa-init");
    assert.equal(second.code, 0, second.out);
    assert.equal(readFileSync(cfg, "utf8"), '{"mine":true}');
  });
});

test("J4 qa scaffolds four packet files with every placeholder substituted", () => {
  sandbox((dir) => {
    const r = easier(dir, "qa", "checkout-redesign-v1");
    assert.equal(r.code, 0, r.out);
    const packet = join(dir, "QA_DOGFOOD", "checkout-redesign-v1");
    const files = readdirSync(packet).sort();
    assert.deepEqual(files, ["README.md", "gmail-magic-resend.html", "manifest.json", "remotion-storyboard.json"]);
    for (const f of files) {
      const body = readFileSync(join(packet, f), "utf8");
      assert.ok(!body.includes("__FEATURE_ID__"), `${f} still holds __FEATURE_ID__`);
      assert.ok(!body.includes("__TITLE__"), `${f} still holds __TITLE__`);
      assert.ok(!body.includes("__DATE__"), `${f} still holds __DATE__`);
    }
    JSON.parse(readFileSync(join(packet, "manifest.json"), "utf8"));
    JSON.parse(readFileSync(join(packet, "remotion-storyboard.json"), "utf8"));
  });
});

test("J4 qa slugifies a messy feature name into a safe directory name", () => {
  sandbox((dir) => {
    const r = easier(dir, "qa", "Checkout Redesign!! v1");
    assert.equal(r.code, 0, r.out);
    assert.ok(existsSync(join(dir, "QA_DOGFOOD", "checkout-redesign-v1")));
  });
});

test("J4 qa with no feature id, and qa on an existing packet, both fail loudly", () => {
  sandbox((dir) => {
    assert.equal(easier(dir, "qa").code, 1);
    easier(dir, "qa", "feature-a");
    const repeat = easier(dir, "qa", "feature-a");
    assert.equal(repeat.code, 1, repeat.out);
    assert.match(repeat.out, /already exists/);
  });
});

// ── Journey 3: installing the protocol where the user's agent will read it ──

test("J3 install project copies the contract and every template into .claude/skills", () => {
  sandbox((dir) => {
    const r = easier(dir, "install", "project");
    assert.equal(r.code, 0, r.out);
    const dest = join(dir, ".claude", "skills", "easier-to-read-submissions");
    assert.ok(existsSync(join(dest, "SKILL.md")));
    assert.ok(existsSync(join(dest, "AGENTS.md")));
    const shipped = readdirSync(join(REPO, "templates")).sort();
    assert.deepEqual(readdirSync(join(dest, "templates")).sort(), shipped, "templates/ copy is not complete");
  });
});

test("J3 install auto-detects a git repo as a project install", () => {
  sandbox((dir) => {
    mkdirSync(join(dir, ".git"));
    const r = easier(dir, "install");
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /Auto-detected mode: project/);
    assert.ok(existsSync(join(dir, ".claude", "skills", "easier-to-read-submissions", "SKILL.md")));
  });
});

test("J3 install rejects an unknown target and lists the real ones", () => {
  sandbox((dir) => {
    const r = easier(dir, "install", "nonsense");
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /user\|project\|cursor\|cline\|aider\|generic\|auto/);
  });
});

// ── The front door: what a stranger sees when they guess ───────────────────

test("help lists every subcommand the dispatcher actually handles", () => {
  sandbox((dir) => {
    const r = easier(dir, "help");
    assert.equal(r.code, 0, r.out);
    for (const verb of ["init", "add", "qa-init", "qa", "install"]) {
      assert.match(r.out, new RegExp(`\\b${verb}\\b`));
    }
  });
});

test("an unknown command fails and shows the help instead of a stack trace", () => {
  sandbox((dir) => {
    const r = easier(dir, "entry", "CHANGELOG/components/Button.md");
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /Unknown command/);
    assert.ok(!r.out.includes("at Object."), "leaked a stack trace to the user");
  });
});

// ── The walkthrough must keep pointing at real lines ───────────────────────

test("every .tours step points at a file and line that still exists", () => {
  const toursDir = join(REPO, ".tours");
  if (!existsSync(toursDir)) return; // no tours yet: nothing to rot
  const tours = readdirSync(toursDir).filter((f) => f.endsWith(".tour"));
  assert.ok(tours.length > 0, ".tours/ exists but holds no .tour files");
  for (const t of tours) {
    const tour = JSON.parse(readFileSync(join(toursDir, t), "utf8"));
    for (const [i, step] of tour.steps.entries()) {
      if (!step.file) continue; // text-only step
      const target = join(REPO, step.file);
      assert.ok(existsSync(target), `${t} step ${i + 1} points at missing file ${step.file}`);
      const lines = readFileSync(target, "utf8").split("\n").length;
      assert.ok(
        step.line >= 1 && step.line <= lines,
        `${t} step ${i + 1} points at ${step.file}:${step.line}, which has ${lines} lines`,
      );
    }
  }
});
