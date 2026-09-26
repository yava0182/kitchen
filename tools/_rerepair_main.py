# -*- coding: utf-8 -*-
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, "tools")
from _repair_admin_utf8 import BAK, MAIN, count_stats, repair_lines, write_utf8

bak = BAK.read_text(encoding="utf-8")
bundle = pathlib.Path("js/admin/admin-new-bundle.js").read_text(encoding="utf-8")
main = MAIN.read_text(encoding="utf-8")
print("main before", count_stats(main))
print("bundle now", count_stats(bundle))
fixed, stats = repair_lines(main, [bundle, bak])
print("main stats", stats)
print("main after", count_stats(fixed))
write_utf8(MAIN, fixed)

html = pathlib.Path("admin-new.html").read_text(encoding="utf-8")
m = re.search(r"admin-new-bundle\.js\?v=[^\"']+", html)
print("cache", m.group(0) if m else None)
print("main in html", "admin-new-main" in html)
