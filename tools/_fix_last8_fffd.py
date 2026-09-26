# -*- coding: utf-8 -*-
import re
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")

text = pathlib.Path("js/admin/admin-new-bundle.js").read_text(encoding="utf-8")
lines = text.splitlines()

# Remaining FFFD line index -> replacement (full line without EOL)
FIXES = {
    19717: "        // Буфер копирования дерева конструктора (между вкладками админки).",
    20374: "                        alert('Вставлять содержимое буфера можно только в корень или секцию');",
    35220: "        // Не гоняй в iframe старый кадр снова, пока идёт ответ или правка из iframe (петля sync)",
    35225: "        // а обратно дерево может пересобрать наше актуальное DOM-дерево в устаревшую структуру/размеры.",
    35226: '        // Не перетираем актуальный DOM из устаревшего JSON, иначе UX "ок" на мгновение разъедется.',
    35855: "      // Для внешнего кода/обвязки: оба имени ссылаются на одну синхронизирующую функцию превью",
    35874: "        // Ссылка в DOM iframe (после смены превью) — не живая, чистим перед viewport.",
    35978: "            // Не тащим старый DOM под свежий JSON (иначе на секунду дерево мигнёт назад).",
}

for i, new in FIXES.items():
    old = lines[i]
    assert "\ufffd" in old, (i, old)
    print(f"fix {i}:")
    print("  old:", repr(old[:100]))
    print("  new:", repr(new[:100]))
    lines[i] = new

out = "\n".join(lines) + "\n"
pathlib.Path("js/admin/admin-new-bundle.js").write_text(out, encoding="utf-8", newline="\n")
# sync public
pathlib.Path("public/js/admin/admin-new-bundle.js").write_text(out, encoding="utf-8", newline="\n")

fffd = out.count("\ufffd")
cyr = len(re.findall(r"[\u0400-\u04FF]", out))
bad = sum(1 for l in lines if "\ufffd" in l)
print("FINAL fffd", fffd, "cyr", cyr, "bad_lines", bad)
for s in ("Скопировано", "Типы элементов", "Цоколь", "layout_role"):
    print(s, s in out)
