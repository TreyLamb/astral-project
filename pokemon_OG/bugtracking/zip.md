This is the code to run in CLI to zip our workspace as long as you haven't renamed folders;




$root = "c:\Users\PCT\Projects\astral-project"; $stamp = Get-Date -Format "yyyyMMdd_HHmm"; & "C:\Program Files\WinRAR\WinRAR.exe" a -r -ep1 -afzip -ibck "$root\pokemon_backup_$stamp.zip" "$root\src\pages\pokered_page" "$root\public\pokered" "$root\pokemon_OG"; Write-Host "Saved: pokemon_backup_$stamp.zip"

(Switched to WinRAR.exe with -afzip 2026-06-30: Compress-Archive looked like
the fix for the mislabeled-RAR problem (-ep1 era, see below), but its recursive
folder enumeration silently SKIPS hidden items — it was dropping the hidden
`pokemon_OG\PokeRed_OG\.git` folder (34 files, ~23MB of packed git history for
the disassembly source), which is the entire reason output dropped from ~24MB
to ~2.3MB. That folder isn't lost project content, just git history, but the
goal is a full faithful copy, not a curated one.
`Rar.exe` (console-only tool) can't create real ZIP format at all — only
`WinRAR.exe` (same install, GUI binary, but fully scriptable headless via
-ibck) supports -afzip. Combined with -r (recurses into hidden folders by
default) and -ep1 (strips the absolute path so top level is still clean
pokered_page\, pokered\, pokemon_OG\), this produces a genuine PK-format zip —
verified via .NET ZipFile — with the full ~24MB content including the hidden
.git folder.

Earlier history of this command, in case something breaks again:
1. Original `Rar.exe a -r` (no -ep1): stored the FULL absolute path inside the
   archive (Users\PCT\Projects\astral-project\... nested for every file).
2. Added -ep1: fixed the path nesting, but `Rar.exe` always writes RAR-format
   data regardless of the ".zip" extension you give it — every "zip" was
   actually a mislabeled RAR file, which is why it corrupted in real-zip-only
   tools.
3. Switched to Compress-Archive: real zip, clean paths, but silently dropped
   the hidden .git folder (~23MB gap, see above).
4. Current: WinRAR.exe -afzip -ep1 -r -ibck — real zip, clean paths, full
   content including hidden folders. This is the one to trust going forward.)




claude " as long as the 3 parent folders keep their names (pokered_page, pokered, pokemon_OG), the command is always safe. It only cares about those 3 paths, nothing inside them matters.

If you ever do rename a parent folder, it's a one-word fix in the command."