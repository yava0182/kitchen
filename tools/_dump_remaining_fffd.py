# -*- coding: utf-8 -*-
"""Dump remaining FFFD lines after dry repair and propose reconstructions."""
import re, sys, pathlib
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _repair_admin_utf8 import BUNDLE, BAK, repair_lines, FFFD, norm_run, count_stats

bundle = BUNDLE.read_text(encoding="utf-8")
bak = BAK.read_text(encoding="utf-8")
repaired, stats = repair_lines(bundle, [bak])
print("stats", stats, count_stats(repaired))

# All confirms in bak
print("=== bak confirms with cyr ===")
for m in re.finditer(r"confirm\((['`])([^'`]+)\1\)", bak):
    if re.search(r"[\u0400-\u04FF]", m.group(2)):
        print(repr(m.group(0)[:120]))

print("=== remaining bad lines (full) ===")
for i, l in enumerate(repaired.splitlines()):
    if FFFD not in l:
        continue
    print(f"\nLINE {i} len={len(l)} fffd={l.count(FFFD)}")
    print(repr(l))
    # show run skeleton
    print("RUN:", norm_run(l))

# Candidate phrases by length match for the common confirm
candidates = [
    "Вы уверены, что хотите удалить элемент?",
    "Вы уверены, что хотите удалить этот элемент?",
    "Вы уверены, что хотите удалить комплектующее?",
    "Вы уверены, что хотите удалить это комплектующее?",
    "Вы уверены, что хотите удалить запись?",
    "Вы уверены, что хотите удалить схему?",
    "Вы уверены, что хотите удалить раздел?",
]
# extract one corrupt body
m = re.search(r"confirm\('([^']+)'\)", repaired)
if m:
    body = m.group(1)
    print("\nTARGET body len", len(body), "fffd", body.count(FFFD), repr(body))
    print("TARGET run", norm_run(body))
    for c in candidates:
        print(f"  cand len={len(c)} run_eq={norm_run(c)==norm_run(body)} char_eq={len(c)==len(body)} {c!r}")
