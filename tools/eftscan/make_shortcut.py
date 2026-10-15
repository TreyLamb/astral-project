"""Make the EFT scanner launchable like a normal app.

    python make_shortcut.py

Creates the icon (eftscan.ico) and a shortcut named "EFT Bag Scan" on your Desktop and in the Start
menu. The shortcut runs pythonw.exe (Python without a console window), so no black terminal sits in
your taskbar. To pin it: right-click the Desktop shortcut -> "Show more options" -> "Pin to taskbar"
(or drag it onto the taskbar). Run this again if Python moves or is reinstalled.
"""
import pathlib
import subprocess
import sys

from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).parent.resolve()
ICO = HERE / "eftscan.ico"
NAME = "EFT Bag Scan"


def make_icon():
    """A dark tile, a gold scan frame (four corner brackets) and a coin in the middle."""
    S = 512
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((16, 16, S - 16, S - 16), radius=96, fill=(20, 23, 26, 255), outline=(201, 178, 122, 255), width=14)
    gold, arm, w, m = (201, 178, 122, 255), 120, 26, 92
    for (x, y, dx, dy) in ((m, m, 1, 1), (S - m, m, -1, 1), (m, S - m, 1, -1), (S - m, S - m, -1, -1)):
        d.line((x, y, x + dx * arm, y), fill=gold, width=w)
        d.line((x, y, x, y + dy * arm), fill=gold, width=w)
    d.ellipse((S // 2 - 82, S // 2 - 82, S // 2 + 82, S // 2 + 82), fill=(46, 204, 113, 255), outline=(20, 23, 26, 255), width=10)
    d.ellipse((S // 2 - 36, S // 2 - 36, S // 2 + 36, S // 2 + 36), outline=(20, 23, 26, 255), width=14)
    img.save(ICO, sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])


def pythonw():
    exe = pathlib.Path(sys.executable)
    w = exe.with_name("pythonw.exe")
    if not w.exists():
        sys.exit(f"pythonw.exe not found next to {exe} - reinstall Python with the standard options.")
    return w


PS = r'''
$ws = New-Object -ComObject WScript.Shell
foreach ($dir in @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'))) {
  $lnk = $ws.CreateShortcut((Join-Path $dir '%(name)s.lnk'))
  $lnk.TargetPath = '%(py)s'
  $lnk.Arguments = '"%(script)s" run'
  $lnk.WorkingDirectory = '%(here)s'
  $lnk.IconLocation = '%(ico)s'
  $lnk.Description = 'Scan your EFT bag for live prices'
  $lnk.Save()
  Write-Output ((Join-Path $dir '%(name)s.lnk'))
}
'''


def main():
    make_icon()
    script = PS % {"name": NAME, "py": pythonw(), "script": HERE / "scanner.py", "here": HERE, "ico": ICO}
    out = subprocess.run(["powershell", "-NoProfile", "-Command", script], capture_output=True, text=True)
    if out.returncode:
        sys.exit(out.stderr or "PowerShell failed")
    print("Icon:", ICO)
    for line in out.stdout.splitlines():
        print("Shortcut:", line)
    print("\nTo pin: right-click the Desktop shortcut -> Show more options -> Pin to taskbar.")


if __name__ == "__main__":
    main()
