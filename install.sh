#!/usr/bin/env bash
# easier-to-read-submissions — universal installer (macOS / Linux / Git Bash on Windows)
#
# One-line install:
#   curl -fsSL https://raw.githubusercontent.com/HomenShum/easier-to-read-submissions/main/install.sh | bash
#
# Modes:
#   --user           Install to ~/.claude/skills/ (default if $CLAUDE_CONFIG_DIR or ~/.claude exists)
#   --project        Install to ./.claude/skills/ (current repo, shared with team)
#   --cursor         Install to ./.cursor/rules/ (Cursor IDE)
#   --cline          Install to ./.clinerules (Cline)
#   --aider          Install AGENTS.md to repo root + add to .aider/ if present
#   --generic        Install AGENTS.md + templates/ to ./agents/easier-to-read-submissions/
#
# Auto-detects environment if no flag is passed. Override with $EASIER_INSTALL_MODE.

set -euo pipefail

REPO_URL="https://github.com/HomenShum/easier-to-read-submissions"
RAW_BASE="https://raw.githubusercontent.com/HomenShum/easier-to-read-submissions/main"
MODE="${EASIER_INSTALL_MODE:-auto}"

# Parse flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --user)    MODE=user; shift ;;
    --project) MODE=project; shift ;;
    --cursor)  MODE=cursor; shift ;;
    --cline)   MODE=cline; shift ;;
    --aider)   MODE=aider; shift ;;
    --generic) MODE=generic; shift ;;
    -h|--help)
      sed -n '2,18p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "Unknown flag: $1" >&2; exit 1 ;;
  esac
done

# Auto-detect mode
if [[ "$MODE" == "auto" ]]; then
  if [[ -f "./package.json" || -d "./.git" ]]; then
    # In a repo — prefer project install
    if [[ -d "./.cursor" ]]; then MODE=cursor
    elif [[ -f "./.clinerules" || -d "./.cline" ]]; then MODE=cline
    elif [[ -f "./.aider.conf.yml" || -d "./.aider" ]]; then MODE=aider
    else MODE=project
    fi
  elif [[ -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}" ]]; then
    MODE=user
  else
    MODE=generic
  fi
  echo "→ Auto-detected mode: $MODE"
fi

# Determine target paths
case "$MODE" in
  user)
    DEST="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills/easier-to-read-submissions"
    ;;
  project)
    DEST="./.claude/skills/easier-to-read-submissions"
    ;;
  cursor)
    DEST="./.cursor/rules"
    ;;
  cline)
    DEST="./.clinerules"
    ;;
  aider)
    DEST="."
    ;;
  generic)
    DEST="./agents/easier-to-read-submissions"
    ;;
  *)
    echo "Bad mode: $MODE" >&2; exit 1
    ;;
esac

echo "→ Installing easier-to-read-submissions to: $DEST"

# Need git for full install (skill + templates), curl for fallback
if command -v git >/dev/null 2>&1; then
  TMPDIR=$(mktemp -d)
  trap 'rm -rf "$TMPDIR"' EXIT
  git clone --depth 1 "$REPO_URL" "$TMPDIR/skill" >/dev/null 2>&1
  SRC="$TMPDIR/skill"
else
  echo "✗ git not found — please install git first" >&2
  exit 1
fi

# Copy based on mode
mkdir -p "$DEST"
case "$MODE" in
  user|project|generic)
    # Full install
    cp "$SRC/SKILL.md" "$DEST/" 2>/dev/null || true
    cp "$SRC/AGENTS.md" "$DEST/" 2>/dev/null || true
    mkdir -p "$DEST/templates"
    cp -r "$SRC/templates/." "$DEST/templates/" 2>/dev/null || true
    echo "✓ Skill installed at $DEST"
    echo "  → Restart Claude Code (or your agent) to load the skill."
    ;;
  cursor)
    # Cursor reads .cursor/rules/*.md as context
    cp "$SRC/AGENTS.md" "$DEST/easier-to-read-submissions.md"
    mkdir -p "$DEST/templates-easier"
    cp -r "$SRC/templates/." "$DEST/templates-easier/"
    echo "✓ Cursor rule installed at $DEST/easier-to-read-submissions.md"
    echo "  → Cursor will pick it up on next chat."
    ;;
  cline)
    # Cline reads .clinerules (single file)
    cp "$SRC/AGENTS.md" ".clinerules"
    mkdir -p ".cline-easier-templates"
    cp -r "$SRC/templates/." ".cline-easier-templates/"
    echo "✓ Cline rule installed at .clinerules"
    echo "  → Cline will pick it up on next session."
    ;;
  aider)
    # Aider reads files via --read flag, drop AGENTS.md at repo root
    cp "$SRC/AGENTS.md" "./AGENTS.md"
    mkdir -p "./.easier-templates"
    cp -r "$SRC/templates/." "./.easier-templates/"
    echo "✓ AGENTS.md placed at repo root."
    echo "  → Use with: aider --read AGENTS.md"
    ;;
esac

echo ""
echo "Next steps:"
echo "  1. Bootstrap CHANGELOG/ in this repo: npx @homenshum/easier-to-read init  (if available)"
echo "     OR copy templates/CHANGELOG-README.md and CHANGELOG-TEMPLATE.md to ./CHANGELOG/ manually."
echo "  2. Tell your agent: \"Follow AGENTS.md before every commit.\""
echo "  3. See $REPO_URL for examples."
