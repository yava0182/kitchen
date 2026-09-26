# -*- coding: utf-8 -*-
"""Apply bak-based repair + manual map for remaining new-only Cyrillic."""
from __future__ import annotations

import pathlib
import re
import shutil
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _repair_admin_utf8 import (
    BAK,
    BUNDLE,
    FFFD,
    HTML,
    MAIN,
    PUBLIC,
    count_stats,
    repair_lines,
    write_utf8,
)

# Exact corrupt → good replacements (new code not in bak; reconstructed by ASCII skeleton + length).
MANUAL_REPLACEMENTS = [
    # Save confirms (36 FFFD / len 43) — used by save* forms
    (
        "Вы уверены, что хотите сохранить изменения?",
        "Вы уверены, что хотите сохранить изменения?",
    ),
]

# Corrupt substring → good (applied as plain text replace on remaining FFFD lines)
# Keys are built at runtime from known corrupt snippets after automated repair.


def build_manual_map(text: str) -> dict[str, str]:
    """Map remaining corrupt literals to reconstructed Russian."""
    m: dict[str, str] = {}

    # Extract the common save-confirm body if still corrupted
    for mm in re.finditer(r"confirm\('([^']*\ufffd[^']*)'\)", text):
        body = mm.group(1)
        if body.count(FFFD) == 36 and len(body) == 43:
            m[body] = "Вы уверены, что хотите сохранить изменения?"

    for mm in re.finditer(r"confirm\(`([^`]*\ufffd[^`]*)`\)", text):
        body = mm.group(1)
        # удалить «${label}»
        if "${label}" in body and body.count(" ") == 5 and "схем" not in body:
            # Вы уверены, что хотите удалить «${label}»?
            # run: 5 spaces in cyrillic words area before label... check
            good = "Вы уверены, что хотите удалить «${label}»?"
            if re.sub(r"[^\x00-\x7f]+", "\x01", body) == re.sub(r"[^\x00-\x7f]+", "\x01", good):
                m[body] = good
            elif body.count(FFFD) in (27, 28, 29):
                m[body] = good
        if "${label}" in body and body.count(FFFD) >= 30:
            good = "Вы уверены, что хотите удалить схему «${label}»?"
            if re.sub(r"[^\x00-\x7f]+", "\x01", body) == re.sub(r"[^\x00-\x7f]+", "\x01", good):
                m[body] = good
            elif "  " not in body and body.count(" ") >= 6:
                # heuristic: more words → схема
                run = re.sub(r"[^\x00-\x7f]+", "\x01", body)
                if run.count("\x01") >= 7:
                    m[body] = good

    # Alerts
    for mm in re.finditer(r"alert\('([^']*\ufffd[^']*)'\)", text):
        body = mm.group(1)
        run = re.sub(r"[^\x00-\x7f]+", "\x01", body)
        if run == re.sub(r"[^\x00-\x7f]+", "\x01", "Конструктор ещё не готов к вставке"):
            m[body] = "Конструктор ещё не готов к вставке"
        elif run == re.sub(
            r"[^\x00-\x7f]+",
            "\x01",
            "Вставлять содержимое буфера можно только под корень модуля",
        ):
            m[body] = "Вставлять содержимое буфера можно только под корень модуля"
        elif run.count("\x01") == 9:
            # longer paste restriction
            cand = "Вставлять содержимое буфера можно только в секцию или в корень модуля"
            if re.sub(r"[^\x00-\x7f]+", "\x01", cand) == run:
                m[body] = cand
            else:
                cand2 = "Вставлять содержимое буфера можно только внутрь секции или в корень модуля"
                if re.sub(r"[^\x00-\x7f]+", "\x01", cand2) == run:
                    m[body] = cand2

    for mm in re.finditer(r"confirm\('([^']*\ufffd[^']*)'\)", text):
        body = mm.group(1)
        run = re.sub(r"[^\x00-\x7f]+", "\x01", body)
        cand = "Заменить текущее дерево модуля данными из буфера?"
        if run == re.sub(r"[^\x00-\x7f]+", "\x01", cand):
            m[body] = cand

    # console.warn fragments
    for mm in re.finditer(r"console\.warn\('([^']*\ufffd[^']*)'", text):
        body = mm.group(1)
        if "[admin][drill-library] POST" in body and "failed" in body:
            # POST после удаления failed
            m[body] = "[admin][drill-library] POST после удаления failed:"
        if "iframeReady timeout" in body:
            m[body] = "[CLD][preview] iframeReady timeout — sync не ждём"
        if "remount/sync preview" in body:
            m[body] = "[Шкаф] remount/sync preview:"

    return m


# Full-line comment reconstructions (new code). Match by unique ASCII anchors.
COMMENT_BY_ANCHOR = [
    (
        "registry",
        "тонким/пустым LS",
        None,  # special
    ),
]


def fix_comments_by_anchor(text: str) -> tuple[str, int]:
    """Replace known corrupted comment lines using unique ASCII anchors."""
    lines = text.splitlines(True)
    n = 0
    # Map: if line contains these ASCII tokens and FFFD → replace whole comment content
    rules = [
        # (predicate_substrs_all, full_new_line_without_eol)
        (
            ["allowThinner", "POST", "LS", "/", "→"],
            "        // Удаление / очистка → LS стал тоньше: при allowThinner POST разрешён,",
        ),
        (
            ["reload", "seed-", "clodis_drilling_registry.json"],
            "        // а reload после seed-а возьмёт с clodis_drilling_registry.json.",
        ),
        (
            ["debounce", "F5", "seed-", "registry"],
            "          // Сразу выгрузить в файл на диск (не ждать debounce), чтобы F5 не вернул seed-копию вместо registry.",
        ),
        (
            ["allowThinner)", "allowThinner"],
            "        // но после явного удаления в админке (allowThinner) разрешаем выгрузиться,",
        ),
        (
            ["reload seed-only"],
            "        // иначе reload seed-only снова подтянет шаблоны с диска.",
        ),
        (
            ["registry", "LS"],
            "        // Не затирать полный registry на диске тонким/пустым LS —",
        ),
        (
            ["__ppPreviewIframe", "ensureClodisPreviewMounted"],
            "        // Важно: чистим и локальный __ppPreviewIframe (let из scope, из ensureClodisPreviewMounted),",
        ),
        (
            ["remove()", "iframe"],
            "        // иначе после remove() локальная переменная жива, а новый iframe не подхватится → дерево молчит.",
        ),
        (
            ["in-memory", "localStorage", "clipboard"],
            "        // Приоритет буфера: in-memory → localStorage → clipboard (clipboard часто пустой).",
        ),
        (
            ["cldPath", "children", "slice(1)"],
            "                      // cldPath хранится от children модуля (0, 0,1, …) — ему нужен slice(1).",
        ),
        (
            ["structure + variables + materials"],
            "                      // Полный JSON модуля (structure + variables + materials), чтобы буфер умел секции/детали целиком.",
        ),
        (
            ["iframe", "window", "*/"],
            "      /** Сброс iframe ссылок (локальных + window зеркал). Нужен при полном remount. */",
        ),
        (
            ["iframe", "sync", "*/"],
            "      /** Жёсткий remount превью: пересоздать iframe (если жив) и sync заново. */",
        ),
        (
            ["cld:clodisJSONReady"],
            "        // Важно: при взаимодействии из UI iframe прилетает событие cld:clodisJSONReady,",
        ),
        (
            ["DOM-", "UX"],
            '        // Не перетираем актуальный DOM из устаревшего JSON, иначе UX "ок" на мгновение разъедется.',
        ),
        (
            ["300", "400", "200", "hang"],
            "          // Иначе габарит останется с UI дефолта превью, пока на hang подтянется реальный 300×400×200.",
        ),
        (
            ["300", "400", "200"],
            "          // Сразу задаём превью с UI последних размеров 300×400×200.",
        ),
        (
            ["loadConstructorTreeFromJSON", "listener", "remount"],
            "        // Один listener на жизнь превью — живёт через remount и зовёт loadConstructorTreeFromJSON.",
        ),
        (
            ["setTemplateTree"],
            "          // Это путь данных из setTemplateTree — не пересобираем DOM (иначе мигание дерева).",
        ),
        (
            ["nodeData", "DOM"],
            "            // Не восстанавливаем nodeData в DOM раньше времени, пока в DOM ещё идёт кадр (пользователь крутит дерево)",
        ),
        (
            ["DOM-", "UI"],
            "            // Иначе при правках извне снова прилетит из UI и не пересоберётся DOM-дерево.",
        ),
        (
            ["skipTreeReload"],
            "            // Сохраняем выделение узла (секция/деталь), если активен skipTreeReload для кадра.",
        ),
        (
            ["iframe", "1.5"],
            "          // Не гоняй sync↔iframe 1.5 сек в одном кадре: iframe→дерево→sync→iframe→мерцание",
        ),
        (
            ["s:x/s:y/s:z"],
            "            // loadConstructorTreeFromJSON: сначала даём переменным из модуля s:x/s:y/s:z и размерам",
        ),
        (
            ["JSON", "iframe", "DOM"],
            "            // Иначе дерево пересобирается ещё раз из DOM и не совпадает с JSON из iframe и из буфера",
        ),
    ]

    # More specific first — sort by number of anchors desc
    rules.sort(key=lambda r: -len(r[0]))

    out = []
    for line in lines:
        if FFFD not in line:
            out.append(line)
            continue
        stripped_eol = ""
        core = line
        if core.endswith("\r\n"):
            stripped_eol = "\r\n"
            core = core[:-2]
        elif core.endswith("\n"):
            stripped_eol = "\n"
            core = core[:-1]

        replaced = False
        # Only comment / jsdoc / warn lines via rules
        if core.lstrip().startswith("//") or "/**" in core or core.lstrip().startswith("*"):
            for anchors, new_core in rules:
                if all(a in core for a in anchors):
                    # Prefer exact-ish length / same indent
                    indent = re.match(r"^(\s*)", core).group(1)
                    new_indented = new_core
                    # If new_core already has indent, use as-is; else apply
                    if not new_core.startswith(indent) and new_core.startswith(" "):
                        new_indented = new_core
                    out.append(new_indented + stripped_eol)
                    n += 1
                    replaced = True
                    break
        if not replaced:
            out.append(line)
    return "".join(out), n


def apply_literal_map(text: str, mapping: dict[str, str]) -> tuple[str, int]:
    n = 0
    for old, new in sorted(mapping.items(), key=lambda kv: -len(kv[0])):
        if old in text:
            c = text.count(old)
            text = text.replace(old, new)
            n += c
    return text, n


def main():
    bundle = BUNDLE.read_text(encoding="utf-8")
    bak = BAK.read_text(encoding="utf-8")
    print("BEFORE", count_stats(bundle))

    for path in (BUNDLE, MAIN):
        if path.exists():
            bak_path = path.with_name(path.name + ".bak-before-utf8fix")
            if not bak_path.exists():
                shutil.copy2(path, bak_path)
                print("backup", bak_path.name)

    repaired, stats = repair_lines(bundle, [bak])
    print("auto stats", stats, count_stats(repaired))

    mapping = build_manual_map(repaired)
    print("manual map size", len(mapping))
    for k, v in list(mapping.items())[:12]:
        print(" ", repr(k)[:60], "=>", repr(v)[:60])
    repaired, nmap = apply_literal_map(repaired, mapping)
    print("literal replaces", nmap, count_stats(repaired))

    repaired, ncom = fix_comments_by_anchor(repaired)
    print("comment replaces", ncom, count_stats(repaired))

    # Second pass manual for any leftover confirms/alerts
    mapping2 = build_manual_map(repaired)
    repaired, nmap2 = apply_literal_map(repaired, mapping2)
    print("manual pass2", nmap2, count_stats(repaired))

    write_utf8(BUNDLE, repaired)

    # main.js
    if MAIN.exists():
        main_text = MAIN.read_text(encoding="utf-8")
        if main_text.count(FFFD):
            main_fixed, mstats = repair_lines(main_text, [bak, repaired])
            print("main auto", mstats, count_stats(main_fixed))
            mmap = build_manual_map(main_fixed)
            main_fixed, _ = apply_literal_map(main_fixed, mmap)
            main_fixed, _ = fix_comments_by_anchor(main_fixed)
            write_utf8(MAIN, main_fixed)
            print("AFTER main", count_stats(MAIN.read_text(encoding="utf-8")))

    PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(BUNDLE, PUBLIC)
    print("synced public")

    html = HTML.read_text(encoding="utf-8")
    new_html, n = re.subn(
        r"(admin-new-bundle\.js\?v=)[^\"']+",
        r"\g<1>20260919-utf8fix",
        html,
        count=1,
    )
    if n:
        write_utf8(HTML, new_html)
        print("cache bust OK")
    else:
        print("WARN no cache bust")

    final = BUNDLE.read_text(encoding="utf-8")
    print("FINAL", count_stats(final))
    for s in (
        "Скопировано",
        "Типы элементов",
        "Загрузка",
        "Вы уверены, что хотите сохранить изменения?",
        "layout_role",
    ):
        print(f"  {s!r}: {s in final}")

    bad = [l for l in final.splitlines() if FFFD in l]
    print("remaining bad lines", len(bad))
    for l in bad[:15]:
        print(" ", repr(l[:120]))


if __name__ == "__main__":
    main()
