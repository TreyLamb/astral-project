# PC-SETTINGS.md — Windows settings Trey wants kept

For Claude. Windows changes Trey made on purpose that a Windows update can quietly undo.

**Last checked:** 2026-10-23

## How to use this file

- **If `Last checked` is under 7 days old, do nothing and say nothing.**
- If it is older, run every **Check** below once, silently, then set `Last checked` to today.
  There is one date for the whole file, not one per setting.
- A check that passes gets no mention at all.
- A check that fails: run its **Fix** (only the parts that don't interrupt Trey), then tell him
  in one line what had reset and that it was put back. Anything disruptive, like restarting
  Explorer, logging out or rebooting, needs his OK first.
- **Adding a setting:** give it a heading with the date, plus **Check**, **Fix** and **Revert**
  blocks. All of them should run from a plain, non-admin PowerShell where possible.

Machine these were set on: ASUS Vivobook 16 M1607KA (`T10544790`), Windows 11 Home 26200.
If `$env:COMPUTERNAME` is different, the settings may never have been applied on this machine.
Ask before applying them there; don't treat it as drift.

---

## 1. Classic right-click menu (no "Show more options") — set 2026-10-23

Windows 11's short context menu is turned off, so the full classic menu opens directly.
Per-user (HKCU), no admin needed. Feature updates sometimes reset it.

**Check**: passes if this prints `True`:
```powershell
$k = 'HKCU:\Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\InprocServer32'
(Test-Path $k) -and ((Get-ItemProperty $k).'(default)' -eq '')
```

**Fix**: the registry write is silent; the Explorer restart is disruptive, so ask first
(or tell him it applies at next sign-in):
```powershell
$k = 'HKCU:\Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\InprocServer32'
New-Item -Path $k -Force | Out-Null
Set-ItemProperty -Path $k -Name '(default)' -Value ''
# disruptive: Stop-Process -Name explorer -Force; Start-Process explorer.exe
```

**Revert**: the key did not exist before this change, so deleting it restores the default.
Then sign out and back in:
```powershell
Remove-Item 'HKCU:\Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}' -Recurse
```

---

## 2. Lid / power button HIBERNATE, sleep becomes hibernate after 15 min — set 2026-10-29

Why: this laptop has no real sleep (S3), only Modern Standby (S0ix), and it has died in it four
times (Kernel-Power 41 on 2026-02-14, 08-13, 09-02, 10-29). 09-02 bugchecked 0x133
DPC_WATCHDOG_VIOLATION (a driver hung). On 10-29 standby tripped "Austerity Battery Drain Budget
Exceeded", then woke on a touchpad touch, then the power button (which was set to Sleep) put it
straight back under, and it never came back up. Plain hibernate from awake resumes cleanly (it did
so that same morning). Applies to the active scheme (Balanced). No admin needed.

**Check**: passes if all three lines print `2 2`, `2 2`, and two numbers greater than 0:
```powershell
$B='4f971e89-eebd-4455-a8de-9e59040e7347'
foreach ($g in '5ca83367-6e45-459f-a27b-476b1d01c936','7648efa3-dd9c-4e3e-b566-50f929386280') {
  ((powercfg /qh SCHEME_CURRENT $B $g | Select-String 'Current (AC|DC)') | % { [int]($_.Line -split ': ')[1] }) -join ' ' }
((powercfg /q SCHEME_CURRENT SUB_SLEEP HIBERNATEIDLE | Select-String 'Current (AC|DC)') | % { [int]($_.Line -split ': ')[1] }) -join ' '
```

**Fix**: silent:
```powershell
$B='4f971e89-eebd-4455-a8de-9e59040e7347'
foreach ($g in '5ca83367-6e45-459f-a27b-476b1d01c936','7648efa3-dd9c-4e3e-b566-50f929386280') {
  powercfg /setacvalueindex SCHEME_CURRENT $B $g 2; powercfg /setdcvalueindex SCHEME_CURRENT $B $g 2 }
powercfg /change hibernate-timeout-ac 15; powercfg /change hibernate-timeout-dc 15
powercfg /setactive SCHEME_CURRENT
```

**Revert**: the previous values were lid = Sleep (1), power button = Sleep (1), hibernate after = never (0):
```powershell
$B='4f971e89-eebd-4455-a8de-9e59040e7347'
foreach ($g in '5ca83367-6e45-459f-a27b-476b1d01c936','7648efa3-dd9c-4e3e-b566-50f929386280') {
  powercfg /setacvalueindex SCHEME_CURRENT $B $g 1; powercfg /setdcvalueindex SCHEME_CURRENT $B $g 1 }
powercfg /change hibernate-timeout-ac 0; powercfg /change hibernate-timeout-dc 0
powercfg /setactive SCHEME_CURRENT
```
