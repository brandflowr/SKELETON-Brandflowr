# sync-spec.ps1
# Syncs format spec files from SKELETON-Spec/spec → SPORE-Desktop/spec
# Run from the SKELETON-Spec root: .\sync-spec.ps1
# Dry run (preview only):          .\sync-spec.ps1 -DryRun

param(
    [switch]$DryRun,
    [string]$Destination = ""
)

$ErrorActionPreference = "Stop"

# ── Paths ─────────────────────────────────────────────────────────────────────
$scriptDir = $PSScriptRoot
$src       = Join-Path $scriptDir "spec"

# Destination: pass -Destination <path-to-SPORE-Desktop-spec-folder>, or rely on
# the default sibling-folder guesses below.
if ($Destination) {
    $dst = $Destination
} else {
    $candidates = @(
        (Join-Path $scriptDir "..\SPORE-Desktop\spec"),
        (Join-Path $scriptDir "..\theDesktopApp\spec")
    )
    $dst = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $dst) { $dst = $candidates[0] }
}

if (-not (Test-Path $src)) { Write-Error "Source not found: $src"; exit 1 }
if (-not (Test-Path $dst)) { Write-Error "Destination not found: $dst"; exit 1 }

# ── Files to sync (format spec — owned by SKELETON-Spec) ──────────────────────
$formatFiles = @(
    "skel-spec.md",
    "skel.schema.json",
    "skel-keyfile.json",
    "example.skel.json",
    "bone-spec.md",
    "bone.schema.json",
    "muscle-spec.md",
    "muscle.schema.json",
    "hook-payload.schema.json",
    "MUSCLE_AUTHORING.md",
    "OVERVIEW.md",
    "ARCHITECTURE.md",
    "TOKEN_REFERENCE.md",
    "CHANGELOG.md",
    "DECISIONS.md",
    "LLM_INTEGRATION.md",
    "x-spore.schema.json",
    "audio-map.schema.json",
    "video-map.schema.json",
    "canvas-layout.schema.json"
)

# bones/ subfolder — sync all .bone.json files
$bonesFiles = Get-ChildItem -Path (Join-Path $src "bones") -Filter "*.bone.json" |
              Select-Object -ExpandProperty Name

# muscles/ subfolder — sync all example .muscle.json manifests
$musclesFiles = @()
if (Test-Path (Join-Path $src "muscles")) {
    $musclesFiles = Get-ChildItem -Path (Join-Path $src "muscles") -Filter "*.muscle.json" |
                    Select-Object -ExpandProperty Name
}

# ── Spore-specific files (never touched by this script) ───────────────────────
$preserved = @(
    "PUNCHLIST.md",
    "BONE_BUILDER_DESIGN.md",
    "E2E_TESTING.md",
    "FIRST-RUN-ONBOARDING.md",
    "FunctionList.md"
)

# ── Helpers ───────────────────────────────────────────────────────────────────
function Sync-File($srcPath, $dstPath, $label) {
    $isNew  = -not (Test-Path $dstPath)
    $isDiff = $isNew -or ((Get-FileHash $srcPath).Hash -ne (Get-FileHash $dstPath).Hash)

    if ($isDiff) {
        $tag = if ($isNew) { "NEW  " } else { "UPDT " }
        Write-Host "  $tag $label" -ForegroundColor Cyan
        if (-not $DryRun) {
            $dstDir = Split-Path $dstPath -Parent
            if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir | Out-Null }
            Copy-Item $srcPath $dstPath -Force
        }
        return $true
    } else {
        Write-Host "  OK   $label" -ForegroundColor DarkGray
        return $false
    }
}

# ── Run ───────────────────────────────────────────────────────────────────────
$mode = if ($DryRun) { " [DRY RUN — no files written]" } else { "" }
Write-Host ""
Write-Host "SKELETON-Spec  ->  SPORE-Desktop/spec$mode" -ForegroundColor Yellow
Write-Host "src: $src"
Write-Host "dst: $dst"
Write-Host ""

$changed = 0

Write-Host "Format files:" -ForegroundColor White
foreach ($f in $formatFiles) {
    $s = Join-Path $src $f
    $d = Join-Path $dst $f
    if (Test-Path $s) {
        if (Sync-File $s $d $f) { $changed++ }
    } else {
        Write-Host "  SKIP $f (not in source)" -ForegroundColor DarkYellow
    }
}

Write-Host ""
Write-Host "bones/:" -ForegroundColor White
foreach ($f in $bonesFiles) {
    $s = Join-Path $src "bones\$f"
    $d = Join-Path $dst "bones\$f"
    if (Sync-File $s $d "bones/$f") { $changed++ }
}

Write-Host ""
Write-Host "muscles/:" -ForegroundColor White
foreach ($f in $musclesFiles) {
    $s = Join-Path $src "muscles\$f"
    $d = Join-Path $dst "muscles\$f"
    if (Sync-File $s $d "muscles/$f") { $changed++ }
}

Write-Host ""
Write-Host "Preserved (Spore-specific, not touched):" -ForegroundColor White
foreach ($f in $preserved) {
    $exists = Test-Path (Join-Path $dst $f)
    $status = if ($exists) { "  --   $f" } else { "  --   $f (not present)" }
    Write-Host $status -ForegroundColor DarkGray
}

Write-Host ""
if ($changed -eq 0) {
    Write-Host "Already in sync. Nothing to update." -ForegroundColor Green
} elseif ($DryRun) {
    Write-Host "$changed file(s) would be updated. Run without -DryRun to apply." -ForegroundColor Cyan
} else {
    Write-Host "$changed file(s) updated. Commit SPORE-Desktop to finish." -ForegroundColor Green
}
Write-Host ""
