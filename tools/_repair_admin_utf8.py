# -*- coding: utf-8 -*-
"""Repair FFFD-corrupted Cyrillic in admin-new-bundle.js using bak + line/run skeletons."""
from __future__ import annotations

import difflib
import pathlib
import re
import shutil
import sys
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "js/admin/admin-new-bundle.js"
BAK = ROOT / "js/admin/admin-new-bundle.js.bak-before-clean1345"
MAIN = ROOT / "js/admin/admin-new-main.js"
PUBLIC = ROOT / "public/js/admin/admin-new-bundle.js"
HTML = ROOT / "admin-new.html"
FFFD = "\ufffd"


def norm_char(s: str) -> str:
    return re.sub(r"[^\x00-\x7f]", "\x01", s)


def norm_run(s: str) -> str:
    return re.sub(r"[^\x00-\x7f]+", "\x01", s)


def count_stats(text: str) -> dict:
    return {
        "fffd": text.count(FFFD),
        "cyr": len(re.findall(r"[\u0400-\u04FF]", text)),
        "len": len(text),
        "bad_lines": sum(1 for l in text.splitlines() if FFFD in l),
    }


def extract_quoted(text: str):
    out = []
    i = 0
    n = len(text)
    while i < n:
        c = text[i]
        if c in "'\"":
            q = c
            j = i + 1
            buf = []
            while j < n:
                ch = text[j]
                if ch == "\\" and j + 1 < n:
                    buf.append(ch)
                    buf.append(text[j + 1])
                    j += 2
                    continue
                if ch == q:
                    out.append((i, j + 1, "".join(buf), q))
                    i = j + 1
                    break
                if ch == "\n":
                    i = j + 1
                    break
                buf.append(ch)
                j += 1
            else:
                break
            continue
        i += 1
    return out


def repair_lines(bundle: str, sources: list[str]) -> tuple[str, dict]:
    """Restore corrupted lines from one or more good UTF-8 sources."""
    bl = bundle.splitlines(True)
    out = list(bl)
    stats = defaultdict(int)

    # Build global indexes from all sources
    by_char: dict[str, list[str]] = defaultdict(list)
    by_run: dict[str, list[str]] = defaultdict(list)
    src_lines_all: list[list[str]] = []
    for src in sources:
        kl = src.splitlines(True)
        src_lines_all.append(kl)
        for l in kl:
            if FFFD in l:
                continue
            by_char[norm_char(l)].append(l)
            by_run[norm_run(l)].append(l)

    def uniq(cands: list[str]) -> str | None:
        u = list(dict.fromkeys(cands))
        return u[0] if len(u) == 1 else None

    # Align against primary bak (first source)
    primary = src_lines_all[0]
    bs = [norm_char(l) for l in out]
    ks = [norm_char(l) for l in primary]
    sm = difflib.SequenceMatcher(a=ks, b=bs, autojunk=False)
    opcodes = sm.get_opcodes()

    for tag, i1, i2, j1, j2 in opcodes:
        if tag == "equal":
            for bi, ki in zip(range(j1, j2), range(i1, i2)):
                if FFFD in out[bi] and norm_char(out[bi]) == norm_char(primary[ki]):
                    out[bi] = primary[ki]
                    stats["equal_char"] += 1
        elif tag == "replace":
            local_char: dict[str, list[str]] = defaultdict(list)
            local_run: dict[str, list[str]] = defaultdict(list)
            for ki in range(i1, i2):
                local_char[norm_char(primary[ki])].append(primary[ki])
                local_run[norm_run(primary[ki])].append(primary[ki])
            for bi in range(j1, j2):
                if FFFD not in out[bi]:
                    continue
                u = uniq(local_char.get(norm_char(out[bi]), []))
                if u:
                    out[bi] = u
                    stats["hunk_char"] += 1
                    continue
                u = uniq(local_run.get(norm_run(out[bi]), []))
                if u:
                    out[bi] = u
                    stats["hunk_run"] += 1

    # Global passes
    for _ in range(2):
        tmp = []
        for l in out:
            if FFFD in l:
                u = uniq(by_char.get(norm_char(l), []))
                if u:
                    tmp.append(u)
                    stats["global_char"] += 1
                    continue
                u = uniq(by_run.get(norm_run(l), []))
                if u:
                    tmp.append(u)
                    stats["global_run"] += 1
                    continue
            tmp.append(l)
        out = tmp

    # Quoted-string repair using context + run/char norm from all sources
    good_by_full: dict[tuple, list[str]] = defaultdict(list)
    good_by_before: dict[tuple, list[str]] = defaultdict(list)
    good_by_run: dict[str, list[str]] = defaultdict(list)
    good_by_char: dict[str, list[str]] = defaultdict(list)
    CTX = 64
    for src in sources:
        for start, end, body, q in extract_quoted(src):
            if FFFD in body or not re.search(r"[\u0400-\u04FF]", body):
                continue
            before = norm_run(src[max(0, start - CTX) : start])
            after = norm_run(src[end : end + CTX])
            good_by_full[(before, after, norm_run(body))].append(body)
            good_by_before[(before, norm_run(body))].append(body)
            good_by_run[norm_run(body)].append(body)
            good_by_char[norm_char(body)].append(body)

    text = "".join(out)
    mapping: dict[str, str] = {}
    for start, end, body, q in extract_quoted(text):
        if FFFD not in body:
            continue
        before = norm_run(text[max(0, start - CTX) : start])
        after = norm_run(text[end : end + CTX])
        u = uniq(good_by_full.get((before, after, norm_run(body)), []))
        if not u:
            u = uniq(good_by_before.get((before, norm_run(body)), []))
        if not u:
            # prefer same char-norm length
            cands = list(dict.fromkeys(good_by_char.get(norm_char(body), [])))
            if len(cands) == 1:
                u = cands[0]
            else:
                same = [c for c in dict.fromkeys(good_by_run.get(norm_run(body), [])) if len(c) == len(body)]
                if len(same) == 1:
                    u = same[0]
                else:
                    run_u = uniq(good_by_run.get(norm_run(body), []))
                    u = run_u
        if u:
            mapping[body] = u

    if mapping:
        rebuilt = []
        i = 0
        n = len(text)
        while i < n:
            c = text[i]
            if c in "'\"":
                q = c
                j = i + 1
                buf = []
                while j < n:
                    ch = text[j]
                    if ch == "\\" and j + 1 < n:
                        buf.append(ch)
                        buf.append(text[j + 1])
                        j += 2
                        continue
                    if ch == q:
                        body = "".join(buf)
                        if body in mapping:
                            rebuilt.append(q + mapping[body] + q)
                            stats["string_map"] += 1
                        else:
                            rebuilt.append(q + body + q)
                        i = j + 1
                        break
                    if ch == "\n":
                        rebuilt.append(text[i : j + 1])
                        i = j + 1
                        break
                    buf.append(ch)
                    j += 1
                else:
                    rebuilt.append(text[i:])
                    break
                continue
            rebuilt.append(c)
            i += 1
        text = "".join(rebuilt)

    return text, dict(stats)


def repair_main(main_text: str, sources: list[str]) -> tuple[str, dict]:
    return repair_lines(main_text, sources)


def write_utf8(path: pathlib.Path, text: str) -> None:
    path.write_text(text, encoding="utf-8", newline="\n")


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "repair"
    bundle = BUNDLE.read_text(encoding="utf-8")
    bak = BAK.read_text(encoding="utf-8")
    print("BEFORE bundle", count_stats(bundle))
    print("SOURCE bak   ", count_stats(bak))

    if mode == "diagnose":
        repaired, stats = repair_lines(bundle, [bak])
        print("DRY stats", stats)
        print("AFTER dry", count_stats(repaired))
        bad = [(i, l) for i, l in enumerate(repaired.splitlines()) if FFFD in l]
        print("remaining lines", len(bad))
        for i, l in bad[:20]:
            print(f"  {i}: {l[:140]!r}")
        return

    # Safety backup of current corrupted files
    for path in (BUNDLE, MAIN):
        if path.exists():
            bak_path = path.with_name(path.name + ".bak-before-utf8fix")
            if not bak_path.exists():
                shutil.copy2(path, bak_path)
                print("backed up", bak_path.name)

    repaired, stats = repair_lines(bundle, [bak])
    print("repair stats", stats)
    print("AFTER bundle", count_stats(repaired))
    write_utf8(BUNDLE, repaired)

    # main.js — not loaded by admin-new.html, but still repair if corrupted
    if MAIN.exists():
        main_text = MAIN.read_text(encoding="utf-8")
        if main_text.count(FFFD):
            # Use bak + repaired bundle as sources
            sources = [bak, repaired]
            main_fixed, mstats = repair_main(main_text, sources)
            print("main stats", mstats)
            print("AFTER main", count_stats(main_fixed))
            write_utf8(MAIN, main_fixed)

    # Sync public (server serves js/admin, but keep public aligned)
    PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(BUNDLE, PUBLIC)
    print("synced", PUBLIC.relative_to(ROOT), "fffd", count_stats(PUBLIC.read_text(encoding="utf-8"))["fffd"])

    # Cache bust
    html = HTML.read_text(encoding="utf-8")
    new_html, n = re.subn(
        r"(admin-new-bundle\.js\?v=)[^\"']+",
        r"\g<1>20260919-utf8fix",
        html,
        count=1,
    )
    if n:
        write_utf8(HTML, new_html)
        print("cache bust -> 20260919-utf8fix")
    else:
        print("WARN: cache bust not found")

    final = count_stats(BUNDLE.read_text(encoding="utf-8"))
    print("FINAL", final)
    # Spot-check known strings
    t = BUNDLE.read_text(encoding="utf-8")
    for s in ("Скопировано", "Типы элементов", "Загрузка", "Цоколь"):
        print(f"  has {s!r}: {s in t}")


if __name__ == "__main__":
    main()
