# easier-to-read-submissions — Windows PowerShell installer
#
# One-line install:
#   iwr https://raw.githubusercontent.com/HomenShum/easier-to-read-submissions/main/install.ps1 -useb | iex
#
# Modes:
#   -Mode user      Install to $env:USERPROFILE\.claude\skills\
#   -Mode project   Install to .\.claude\skills\ (current repo)
#   -Mode cursor    Install to .\.cursor\rules\
#   -Mode cline     Install to .\.clinerules
#   -Mode aider     Install AGENTS.md to repo root
#   -Mode generic   Install to .\agents\easier-to-read-submissions\

param(
    [string]$Mode = "auto"
)

$ErrorActionPreference = "Stop"
$RepoUrl = "https://github.com/HomenShum/easier-to-read-submissions"

# Auto-detect mode
if ($Mode -eq "auto") {
    if (Test-Path "./package.json" -PathType Leaf -ErrorAction SilentlyContinue) {
        if (Test-Path "./.cursor") { $Mode = "cursor" }
        elseif (Test-Path "./.clinerules" -PathType Leaf) { $Mode = "cline" }
        elseif (Test-Path "./.cline") { $Mode = "cline" }
        elseif (Test-Path "./.aider") { $Mode = "aider" }
        else { $Mode = "project" }
    }
    elseif (Test-Path "$env:USERPROFILE\.claude") {
        $Mode = "user"
    }
    else {
        $Mode = "generic"
    }
    Write-Host "-> Auto-detected mode: $Mode"
}

# Determine destination
$Dest = switch ($Mode) {
    "user"    { "$env:USERPROFILE\.claude\skills\easier-to-read-submissions" }
    "project" { ".\.claude\skills\easier-to-read-submissions" }
    "cursor"  { ".\.cursor\rules" }
    "cline"   { "." }
    "aider"   { "." }
    "generic" { ".\agents\easier-to-read-submissions" }
    default   { Write-Error "Bad mode: $Mode"; exit 1 }
}

Write-Host "-> Installing easier-to-read-submissions to: $Dest"

# Need git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "git not found - please install git first"
    exit 1
}

# Clone to temp
$TmpDir = New-Item -ItemType Directory -Path "$env:TEMP\easier-$(Get-Random)"
try {
    & git clone --depth 1 $RepoUrl "$TmpDir\skill" --quiet 2>&1 | Out-Null
    $Src = "$TmpDir\skill"

    if (-not (Test-Path $Dest)) {
        New-Item -ItemType Directory -Path $Dest -Force | Out-Null
    }

    switch ($Mode) {
        { $_ -in "user", "project", "generic" } {
            Copy-Item -Path "$Src\SKILL.md" -Destination $Dest -Force
            Copy-Item -Path "$Src\AGENTS.md" -Destination $Dest -Force
            $TplDest = Join-Path $Dest "templates"
            if (-not (Test-Path $TplDest)) { New-Item -ItemType Directory -Path $TplDest | Out-Null }
            Copy-Item -Path "$Src\templates\*" -Destination $TplDest -Recurse -Force
            Write-Host "OK Skill installed at $Dest"
            Write-Host "  -> Restart your agent to load the skill."
        }
        "cursor" {
            Copy-Item -Path "$Src\AGENTS.md" -Destination "$Dest\easier-to-read-submissions.md" -Force
            $TplDest = ".\.cursor\rules\templates-easier"
            if (-not (Test-Path $TplDest)) { New-Item -ItemType Directory -Path $TplDest -Force | Out-Null }
            Copy-Item -Path "$Src\templates\*" -Destination $TplDest -Recurse -Force
            Write-Host "OK Cursor rule installed."
        }
        "cline" {
            Copy-Item -Path "$Src\AGENTS.md" -Destination ".\.clinerules" -Force
            if (-not (Test-Path ".\.cline-easier-templates")) {
                New-Item -ItemType Directory -Path ".\.cline-easier-templates" | Out-Null
            }
            Copy-Item -Path "$Src\templates\*" -Destination ".\.cline-easier-templates" -Recurse -Force
            Write-Host "OK Cline rule installed at .clinerules"
        }
        "aider" {
            Copy-Item -Path "$Src\AGENTS.md" -Destination ".\AGENTS.md" -Force
            if (-not (Test-Path ".\.easier-templates")) {
                New-Item -ItemType Directory -Path ".\.easier-templates" | Out-Null
            }
            Copy-Item -Path "$Src\templates\*" -Destination ".\.easier-templates" -Recurse -Force
            Write-Host "OK AGENTS.md placed at repo root. Use with: aider --read AGENTS.md"
        }
    }
}
finally {
    Remove-Item -Path $TmpDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Bootstrap CHANGELOG/ in this repo via templates/CHANGELOG-README.md"
Write-Host "  2. Tell your agent: 'Follow AGENTS.md before every commit.'"
Write-Host "  3. See $RepoUrl for examples."
