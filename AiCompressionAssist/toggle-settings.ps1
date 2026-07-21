# toggle-settings.ps1 — swap between hook-on and hook-off settings files.
#
# Usage (from any directory):
#   cd c:\Users\PCT\Projects\astral-project
#   .\AiCompressionAssist\toggle-settings.ps1
#
# Swaps:
#   .claude/settings.json          <--> .claude/settings.json.disabled
#
# After running, restart Claude Code for the change to take effect.

$projectRoot = Split-Path -Parent $PSScriptRoot
$active = Join-Path $projectRoot ".claude" "settings.json"
$disabled = Join-Path $projectRoot ".claude" "settings.json.disabled"

if (-not (Test-Path $active) -and -not (Test-Path $disabled)) {
  Write-Host "ERROR: neither settings.json nor settings.json.disabled found in .claude/" -ForegroundColor Red
  exit 1
}

# Swap
$tmp = Join-Path $projectRoot ".claude" "settings.json.tmp"
if (Test-Path $active) { Rename-Item $active $tmp }
if (Test-Path $disabled) { Rename-Item $disabled $active }
if (Test-Path $tmp) { Rename-Item $tmp $disabled }

# Show which is now active
$activeContent = Get-Content $active | ConvertFrom-Json
$hasHook = $activeContent.hooks.PostToolUse.Count -gt 0

if ($hasHook) {
  Write-Host "✓ HOOK IS ON" -ForegroundColor Green
  Write-Host "  Compression hook is enabled."
  Write-Host "  Restart Claude Code to pick up the change."
} else {
  Write-Host "⊘ HOOK IS OFF" -ForegroundColor Yellow
  Write-Host "  Compression hook is disabled."
  Write-Host "  Restart Claude Code to pick up the change."
}

Write-Host ""
Write-Host "Active: $active"
Write-Host "Backup: $disabled"
