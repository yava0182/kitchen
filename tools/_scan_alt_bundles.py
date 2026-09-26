# -*- coding: utf-8 -*-
import re, pathlib, sys
sys.stdout.reconfigure(encoding="utf-8")
paths = [
    "js/admin/admin-new-bundle-r4.js",
    "_cmp_1343/admin-new-bundle.1343.js",
    "dist/js/admin/admin-new-bundle.js",
    "public/js/admin/admin-new-bundle-r4.js",
]
for p in paths:
    path = pathlib.Path(p)
    if not path.exists():
        print(p, "MISSING")
        continue
    t = path.read_text(encoding="utf-8")
    print(
        p,
        "fffd",
        t.count("\ufffd"),
        "cyr",
        len(re.findall(r"[\u0400-\u04FF]", t)),
        "allowThinner",
        t.count("allowThinner"),
        "size",
        path.stat().st_size,
    )
    for pat in (
        r"confirm\('([^']+)'\)",
        r"confirm\(`([^`]+)`\)",
    ):
        for m in re.finditer(pat, t):
            if re.search(r"[\u0400-\u04FF]", m.group(1)):
                print("  confirm:", m.group(1)[:100])
                break
    # allowThinner comment nearby
    idx = t.find("allowThinner")
    if idx > 0:
        snip = t[max(0, idx - 200) : idx + 200]
        if "\ufffd" not in snip and re.search(r"[\u0400-\u04FF]", snip):
            print("  allowThinner context OK")
        elif "\ufffd" in snip:
            print("  allowThinner context has FFFD")
        else:
            print("  allowThinner context no cyr")
