# -*- coding: utf-8 -*-
import re, sys, pathlib
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _repair_admin_utf8 import BUNDLE, BAK, repair_lines, FFFD

bundle = BUNDLE.read_text(encoding="utf-8")
bak = BAK.read_text(encoding="utf-8")
repaired, _ = repair_lines(bundle, [bak])
lines = repaired.splitlines()

# For each remaining confirm/alert, show +/- 8 lines of context (ASCII-heavy)
for i, l in enumerate(lines):
    if FFFD not in l:
        continue
    if "confirm" not in l and "alert" not in l and "console." not in l:
        continue
    print("=" * 60, "LINE", i)
    for j in range(max(0, i - 6), min(len(lines), i + 4)):
        mark = ">>>" if j == i else "   "
        s = lines[j]
        # collapse fffd for readability
        s2 = s.replace(FFFD, "�")
        print(f"{mark}{j}: {s2[:160]}")
