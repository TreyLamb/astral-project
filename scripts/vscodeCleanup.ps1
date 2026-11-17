# Deletes VS Code extension versions that VS Code itself has marked obsolete but never removed
# (it only cleans up on a full restart, and a VS Code left open for weeks never gets one), plus
# cached installers for versions that are no longer installed. Runs from the AstralCanvasCapture
# scheduled task. -WhatIf lists what would go without deleting anything.
param([switch]$WhatIf)

$ext  = Join-Path $env:USERPROFILE '.vscode\extensions'
$vsix = Join-Path $env:APPDATA 'Code\CachedExtensionVSIXs'
$logDir = Join-Path $env:LOCALAPPDATA 'AstralMaintenance'
New-Item -ItemType Directory -Force $logDir | Out-Null
$log = Join-Path $logDir 'vscode-cleanup.log'
function Say($m) { $line = '{0:yyyy-MM-dd HH:mm}  {1}' -f (Get-Date), $m; Write-Output $line; if (-not $WhatIf) { Add-Content $log $line } }
function SizeOf($p) { (Get-ChildItem $p -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum }

try {
  if (-not (Test-Path $ext)) { exit 0 }
  $obsoleteFile = Join-Path $ext '.obsolete'
  $obsolete = if (Test-Path $obsoleteFile) { (Get-Content $obsoleteFile -Raw | ConvertFrom-Json).PSObject.Properties.Name } else { @() }

  $parse = { param($name) if ($name -match '^(?<id>.+?)-(?<ver>\d+\.\d+\.\d+)') { $Matches.id } }
  $installed = Get-ChildItem $ext -Directory

  # .obsolete only says "superseded", not "unloaded": a running VS Code keeps the version it started
  # with until restarted, and claude.exe runs straight out of that folder. Keep, per extension, the
  # newest version installed before VS Code started, and anything a process names on its command line.
  $codeStart = (Get-Process Code -ErrorAction SilentlyContinue | Sort-Object StartTime | Select-Object -First 1).StartTime
  $cmdlines = (Get-CimInstance Win32_Process | ForEach-Object { "$($_.ExecutablePath) $($_.CommandLine)" }) -join "`n"
  $loaded = @{}
  if ($codeStart) {
    $installed | Where-Object CreationTime -le $codeStart | Group-Object { & $parse $_.Name } | ForEach-Object {
      $loaded[($_.Group | Sort-Object CreationTime -Descending | Select-Object -First 1).Name] = $true
    }
  }

  $freed = 0
  foreach ($dir in $installed | Where-Object { $obsolete -contains $_.Name }) {
    if ($loaded[$dir.Name] -or $cmdlines.Contains($dir.Name)) { Say "kept (in use until VS Code restarts): $($dir.Name)"; continue }
    $s = SizeOf $dir.FullName
    if (-not $WhatIf) { Remove-Item $dir.FullName -Recurse -Force -Confirm:$false -ErrorAction Stop }
    $freed += $s; Say ("removed {0} ({1:N0} MB)" -f $dir.Name, ($s / 1MB))
  }

  if (Test-Path $vsix) {
    $have = @{}; Get-ChildItem $ext -Directory | ForEach-Object { $have[$_.Name] = $true }
    foreach ($c in Get-ChildItem $vsix -Force) {
      $base = $c.Name -replace '\.vsix$', ''
      if ($have[$base] -or -not (& $parse $base)) { continue }
      $s = if ($c.PSIsContainer) { SizeOf $c.FullName } else { $c.Length }
      if (-not $WhatIf) { Remove-Item $c.FullName -Recurse -Force -Confirm:$false -ErrorAction SilentlyContinue }
      $freed += $s; Say ("removed cached installer {0} ({1:N0} MB)" -f $c.Name, ($s / 1MB))
    }
  }

  Say ("done, freed {0:N2} GB{1}" -f ($freed / 1GB), $(if ($WhatIf) { ' (dry run, nothing deleted)' } else { '' }))
} catch {
  Say "error: $($_.Exception.Message)"
}
# Never fail the scheduled task over housekeeping; the Canvas capture after it matters more.
exit 0
