# -*- coding: utf-8 -*-
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
b = pathlib.Path("js/admin/admin-new-bundle.js").read_text(encoding="utf-8")
p = pathlib.Path("public/js/admin/admin-new-bundle.js").read_text(encoding="utf-8")
print("bundle==public", b == p)
print("fffd bundle/public", b.count("\ufffd"), p.count("\ufffd"))
print("cyr", len(re.findall(r"[\u0400-\u04FF]", b)))
for s in [
    "Скопировано",
    "Типы элементов",
    "Дерево",
    "Каталог",
    "Секция",
    "Фасад",
    "Материал",
    "Комплектующ",
    "Цоколь",
    "layout_role",
    "hinge",
]:
    print(f"  {s}: {b.count(s)}")
print(
    "sizes current/bak/pre-fix-backup",
    pathlib.Path("js/admin/admin-new-bundle.js").stat().st_size,
    pathlib.Path("js/admin/admin-new-bundle.js.bak-before-clean1345").stat().st_size,
    pathlib.Path("js/admin/admin-new-bundle.js.bak-before-utf8fix").stat().st_size,
)
extra = pathlib.Path("js/admin/admin-new-extra-3.js").read_text(encoding="utf-8")
print("extra3 mkdir", extra.count("mkdir"), "fffd", extra.count("\ufffd"))
html = pathlib.Path("admin-new.html").read_text(encoding="utf-8")
m = re.search(r"admin-new-bundle\.js\?v=[^\"']+", html)
print("cache", m.group(0) if m else None)
print("scripts", re.findall(r"admin-new-[a-z0-9.-]+\.js\?v=[^\"']+", html))
main = pathlib.Path("js/admin/admin-new-main.js").read_text(encoding="utf-8")
print("main fffd/cyr", main.count("\ufffd"), len(re.findall(r"[\u0400-\u04FF]", main)), "loaded", "admin-new-main" in html)
