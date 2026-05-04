#!/usr/bin/env node
/**
 * easier-to-read-submissions — repo bootstrap CLI
 *
 * Subcommands:
 *   init                    Scaffold CHANGELOG/ + TEMPLATE.md in current dir
 *   add <category> <slug>   Create a new lane file (category: pages|components|server|db|integrations|scripts)
 *   qa-init                 Scaffold qa.config.json from the example template
 *   entry <lane-file>       Prepend a new entry to a lane (interactive)
 *   install [target]        Install the skill (target: user|project|cursor|cline|aider|generic)
 *   help
 *
 * Usage:
 *   npx @homenshum/easier-to-read-submissions init
 *   npx easier init
 *   npx easier add components Button
 *   npx easier install cursor
 */

import { mkdir, writeFile, readFile, access, copyFile, readdir, stat } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dirname, "..");
const TPL_DIR = join(PKG_ROOT, "templates");

const args = process.argv.slice(2);
const cmd = args[0] || "help";

const C = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

function help() {
  console.log(`
${C.bold("easier-to-read-submissions")} — make every commit easier to read

${C.bold("Subcommands:")}
  ${C.cyan("init")}                          Scaffold CHANGELOG/ in the current repo
  ${C.cyan("add <category> <slug>")}         Create a new lane file
                                  (category: pages|components|server|db|integrations|scripts)
  ${C.cyan("qa-init")}                       Scaffold qa.config.json (Phase 5 / QA packet)
  ${C.cyan("install [target]")}              Install the skill where your agent reads it
                                  (target: user|project|cursor|cline|aider|generic|auto)
  ${C.cyan("help")}                          This help

${C.bold("Examples:")}
  npx easier init
  npx easier add components Button
  npx easier add db users
  npx easier qa-init
  npx easier install cursor

${C.bold("Docs:")}  https://github.com/HomenShum/easier-to-read-submissions
`);
}

async function pathExists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    if (entry.isDirectory()) await copyDir(s, d);
    else await copyFile(s, d);
  }
}

// ───────────────────────────── init ─────────────────────────────

async function init() {
  const cwd = process.cwd();
  const cl = join(cwd, "CHANGELOG");

  if (await pathExists(cl)) {
    console.log(C.yellow(`! CHANGELOG/ already exists at ${cl}`));
    console.log(C.dim("  Skipping scaffold to avoid clobbering existing lanes."));
    console.log(C.dim("  Use `npx easier add <category> <slug>` to add new lane files."));
    return;
  }

  console.log(C.green("→ Scaffolding CHANGELOG/ for"), C.bold(cwd));

  for (const sub of ["pages", "components", "server", "db", "integrations", "scripts"]) {
    await mkdir(join(cl, sub), { recursive: true });
  }

  // Copy master README + TEMPLATE
  await copyFile(join(TPL_DIR, "CHANGELOG-README.md"), join(cl, "README.md"));
  await copyFile(join(TPL_DIR, "CHANGELOG-TEMPLATE.md"), join(cl, "TEMPLATE.md"));

  console.log(C.green("✓"), "CHANGELOG/README.md created (master index)");
  console.log(C.green("✓"), "CHANGELOG/TEMPLATE.md created (format spec)");
  console.log(C.green("✓"), "Subdirs: pages/ components/ server/ db/ integrations/ scripts/");
  console.log("");
  console.log(C.bold("Next steps:"));
  console.log(`  1. Edit ${C.cyan("CHANGELOG/README.md")} to list your repo's lanes`);
  console.log(`  2. Bootstrap from git history: see ${C.cyan(".claude/skills/easier-to-read-submissions/templates/bootstrap-prompt.md")}`);
  console.log(`     OR: ${C.cyan("npx easier add pages tabs-index-inbox")} to create lanes one at a time`);
  console.log(`  3. Install the skill so your agent picks it up: ${C.cyan("npx easier install")}`);
}

// ───────────────────────────── add ─────────────────────────────

async function addLane() {
  const [category, ...slugParts] = args.slice(1);
  const slug = slugParts.join("-");

  if (!category || !slug) {
    console.error(C.red("✗ Usage: npx easier add <category> <slug>"));
    console.error(C.dim("  Example: npx easier add components Button"));
    console.error(C.dim("  Categories: pages | components | server | db | integrations | scripts"));
    process.exit(1);
  }

  const validCategories = ["pages", "components", "server", "db", "integrations", "scripts"];
  if (!validCategories.includes(category)) {
    console.error(C.red(`✗ Bad category: ${category}`));
    console.error(C.dim(`  Must be one of: ${validCategories.join(", ")}`));
    process.exit(1);
  }

  const cwd = process.cwd();
  const dir = join(cwd, "CHANGELOG", category);
  if (!(await pathExists(dir))) {
    console.error(C.red(`✗ ${dir} does not exist`));
    console.error(C.dim(`  Run \`npx easier init\` first to scaffold CHANGELOG/`));
    process.exit(1);
  }

  const target = join(dir, `${slug}.md`);
  if (await pathExists(target)) {
    console.error(C.red(`✗ ${target} already exists`));
    process.exit(1);
  }

  // Read lane template and personalize
  const tpl = await readFile(join(TPL_DIR, "lane.md"), "utf8");
  const today = new Date().toISOString().slice(0, 10);
  const personalized = tpl
    .replace("<relative/path/to/file>", `${category}/${slug}`)
    .replace("YYYY-MM-DD — Short imperative title (most recent)", `${today} — Created — initial implementation`)
    .replace(
      /What changed and \*\*why\*\*[^\n]*\n[^\n]*/,
      `First entry. Replace this with a description of what this surface does today and why it was created.`
    );

  await writeFile(target, personalized);
  console.log(C.green("✓"), `Created ${C.cyan(target.replace(cwd + "/", ""))}`);
  console.log(C.dim(`  Edit it now — the placeholder entry needs a real description.`));
}

// ───────────────────────────── qa-init ─────────────────────────────

async function qaInit() {
  const cwd = process.cwd();
  const target = join(cwd, "qa.config.json");

  if (await pathExists(target)) {
    console.log(C.yellow(`! qa.config.json already exists at ${target}`));
    console.log(C.dim("  Edit it directly, or delete and re-run."));
    return;
  }

  await copyFile(join(TPL_DIR, "qa-states.example.json"), target);
  console.log(C.green("✓"), `Created ${C.cyan("qa.config.json")} from the QA packet example`);
  console.log("");
  console.log(C.bold("Edit it now:"));
  console.log(`  - Replace ${C.cyan("feature.id")} with your slug (e.g. ${C.dim("myapp.thing.v1")})`);
  console.log(`  - Replace ${C.cyan("previewUrlTemplate")} with your dev URL or PR preview URL`);
  console.log(`  - Replace ${C.cyan("states[]")} with your real test lanes`);
  console.log(`  - Replace ${C.cyan("personas{}")} with your real personas (or remove)`);
  console.log("");
  console.log(C.bold("Then:"));
  console.log(`  - Generate a packet with Parity Studio: ${C.cyan("npx parity-studio qa-packet --feature <id>")}`);
  console.log(`  - Or roll your own generator that conforms to ${C.cyan("templates/qa-packet-schema.json")}`);
  console.log(`  - Email-resend with: ${C.cyan("npx parity-studio qa-send --to you@example.com")}`);
  console.log("");
  console.log(C.dim("  Schema + protocol docs: https://github.com/HomenShum/easier-to-read-submissions"));
  console.log(C.dim("  Generator integration:   See INTEGRATIONS.md in this skill"));
}

// ───────────────────────────── install ─────────────────────────────

async function install() {
  const target = args[1] || "auto";
  const cwd = process.cwd();
  const home = process.env.HOME || process.env.USERPROFILE;

  const targets = {
    user: join(process.env.CLAUDE_CONFIG_DIR || join(home, ".claude"), "skills", "easier-to-read-submissions"),
    project: join(cwd, ".claude", "skills", "easier-to-read-submissions"),
    cursor: join(cwd, ".cursor", "rules"),
    cline: cwd,
    aider: cwd,
    generic: join(cwd, "agents", "easier-to-read-submissions"),
  };

  let mode = target;
  if (mode === "auto") {
    if (existsSync(join(cwd, ".cursor"))) mode = "cursor";
    else if (existsSync(join(cwd, ".clinerules")) || existsSync(join(cwd, ".cline"))) mode = "cline";
    else if (existsSync(join(cwd, ".aider")) || existsSync(join(cwd, ".aider.conf.yml"))) mode = "aider";
    else if (existsSync(join(cwd, ".git"))) mode = "project";
    else if (existsSync(join(home, ".claude"))) mode = "user";
    else mode = "generic";
    console.log(C.dim(`→ Auto-detected mode: ${mode}`));
  }

  const dest = targets[mode];
  if (!dest) {
    console.error(C.red(`✗ Bad target: ${mode}. Use: user|project|cursor|cline|aider|generic|auto`));
    process.exit(1);
  }

  console.log(C.green("→ Installing to:"), dest);

  if (mode === "user" || mode === "project" || mode === "generic") {
    await mkdir(dest, { recursive: true });
    await copyFile(join(PKG_ROOT, "SKILL.md"), join(dest, "SKILL.md"));
    await copyFile(join(PKG_ROOT, "AGENTS.md"), join(dest, "AGENTS.md"));
    await copyDir(TPL_DIR, join(dest, "templates"));
  } else if (mode === "cursor") {
    await mkdir(dest, { recursive: true });
    await copyFile(join(PKG_ROOT, "AGENTS.md"), join(dest, "easier-to-read-submissions.md"));
    await copyDir(TPL_DIR, join(dest, "templates-easier"));
  } else if (mode === "cline") {
    await copyFile(join(PKG_ROOT, "AGENTS.md"), join(cwd, ".clinerules"));
    await copyDir(TPL_DIR, join(cwd, ".cline-easier-templates"));
  } else if (mode === "aider") {
    await copyFile(join(PKG_ROOT, "AGENTS.md"), join(cwd, "AGENTS.md"));
    await copyDir(TPL_DIR, join(cwd, ".easier-templates"));
  }

  console.log(C.green("✓"), "Installed.");
  console.log("");
  console.log(C.bold("Next steps:"));
  console.log(`  1. Tell your agent: "${C.cyan("Follow AGENTS.md (or SKILL.md) before every commit")}"`);
  console.log(`  2. Bootstrap your CHANGELOG: ${C.cyan("npx easier init")}`);
  console.log(`  3. Try it on your next commit.`);
}

// ───────────────────────────── dispatch ─────────────────────────────

(async () => {
  try {
    if (cmd === "init") await init();
    else if (cmd === "add") await addLane();
    else if (cmd === "qa-init") await qaInit();
    else if (cmd === "install") await install();
    else if (cmd === "--help" || cmd === "-h" || cmd === "help") help();
    else {
      console.error(C.red(`✗ Unknown command: ${cmd}`));
      help();
      process.exit(1);
    }
  } catch (e) {
    console.error(C.red("✗ FATAL:"), e?.message || e);
    process.exit(1);
  }
})();
