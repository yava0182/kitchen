#!/usr/bin/env python3
"""Extract «Евровинты» / confirmat table from Bazis Фурнитура.config → readable JSON."""

from __future__ import annotations

import json
import os
import re
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG_NAME = "Фурнитура.config"
OUT_PATH = ROOT / "public" / "data" / "bazis_eurovinty_from_config.json"

SEARCH_PATTERNS = [
    "Конфирмат",
    "конфирмат",
    "Шкант",
    "шкант",
    "MINIFIX",
    "Minifix",
    "эксц",
    "Эксц",
    "Евровинт",
    "евровинт",
    "Отверстие",
    "отверстие",
    "стяжк",
    "Стяжк",
    "2S ",
    "Евровинты",
]

CLODIS_TEMPLATE_1 = {
    "templateName": "Конфирмат T-стык (бок + полка)",
    "face": {"diameter": 8, "depth": 16, "x": 8},
    "edge": {"diameter": 5, "depth": 35, "x": 16, "y": 16},
    "scheme": {"offsetFromBase": 50, "step": 32, "minOffsetOpposite": 50},
}


def f64(data: bytes, o: int) -> float | None:
    if o < 0 or o + 8 > len(data):
        return None
    v = struct.unpack_from("<d", data, o)[0]
    if v != v or abs(v) > 1e5:
        return None
    return v


def i32(data: bytes, o: int) -> int | None:
    if o < 0 or o + 4 > len(data):
        return None
    return struct.unpack_from("<i", data, o)[0]


def u16str(data: bytes, o: int, maxchars: int = 200) -> tuple[str, int]:
    chars: list[str] = []
    j = o
    while j < len(data) - 1 and len(chars) < maxchars:
        c = struct.unpack_from("<H", data, j)[0]
        if c == 0:
            return "".join(chars), j + 2
        if c < 0x20 and c not in (9, 10, 13):
            return "", o
        if 0xD800 <= c <= 0xDFFF:
            return "", o
        chars.append(chr(c))
        j += 2
    return "", o


def is_clean_name(s: str) -> bool:
    if len(s) < 3 or len(s) > 120:
        return False
    if not re.match(r"^[\w\s\*.,\-+/\(\)а-яА-ЯёЁ°]+$", s):
        return False
    readable = sum(1 for c in s if "\u0400" <= c <= "\u04FF" or c.isascii())
    return readable >= len(s) * 0.7


def is_catalog_suffix(name: str) -> bool:
    return bool(name) and name[-1] in ",$!"


def is_plausible_mm(v: float | None) -> bool:
    return v is not None and 0.5 <= v <= 120


def embedded_in_path(data: bytes, off: int) -> bool:
    window = data[max(0, off - 120) : off]
    lo = window.lower()
    return b".fr3d" in lo or b".f3d" in lo or b"\\" in window or b"/" in window


def parse_dims(name: str) -> tuple[float | None, float | None]:
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*[*xх×]\s*(\d+(?:[.,]\d+)?)", name, re.I)
    if not m:
        return None, None
    return (
        float(m.group(1).replace(",", ".")),
        float(m.group(2).replace(",", ".")),
    )


def find_config_path() -> Path:
    direct = ROOT / CONFIG_NAME
    if direct.is_file():
        return direct
    for p in ROOT.glob("*.config"):
        return p
    raise FileNotFoundError(f"No .config in {ROOT}")


def collect_name_hits(data: bytes) -> dict[int, str]:
    hits: dict[int, str] = {}
    for pattern in SEARCH_PATTERNS:
        needle = pattern.encode("utf-16-le")
        pos = 0
        while True:
            i = data.find(needle, pos)
            if i < 0:
                break
            s, _ = u16str(data, i)
            if not s.lower().startswith(pattern.lower()):
                pos = i + 2
                continue
            if not is_clean_name(s):
                pos = i + 2
                continue
            if embedded_in_path(data, i):
                pos = i + 2
                continue
            # catalog entries usually have terminator , $ !
            if not is_catalog_suffix(s) and not s.startswith("Евровинты"):
                pos = i + 2
                continue
            hits[i] = s
            pos = i + 2
    return hits


def extract_category(data: bytes, name_offset: int) -> str:
    for scan in range(name_offset - 300, name_offset, 2):
        s, _ = u16str(data, scan)
        if s.startswith("Евровинты"):
            return s.rstrip(",!").strip()
    return ""


def extract_path(data: bytes, name_offset: int, name: str) -> str | None:
    after = name_offset + len(name.encode("utf-16-le")) + 2
    for scan in range(after, after + 500, 2):
        s, _ = u16str(data, scan)
        if s and ("\\" in s or "/" in s) and (".f3d" in s.lower() or ".fr3d" in s.lower()):
            return s
    return None


def extract_row(data: bytes, off: int, name: str) -> dict:
    base = off - 256
    bolt_d, bolt_l = parse_dims(name)
    row: dict = {
        "nameOffset": off,
        "name": name.rstrip(",$!"),
        "nameRaw": name,
        "category": extract_category(data, off),
        "boltD_fromName": bolt_d,
        "boltL_fromName": bolt_l,
        "D1": f64(data, off - 72),
        "D2": f64(data, off + 296),
    }
    path = extract_path(data, off, name)
    if path:
        row["path"] = path

    # i32 fields in 640-byte window (relative to base = nameOffset - 256)
    i32_fields = {
        "H1_mm": 116,
        "H2_mm": 120,
        "H3_mm": 312,
        "PrimStep_mm": 312,
        "StartIndent_mm": 620,
        "faceOffset_mm": 252,
    }
    for label, rel in i32_fields.items():
        v = i32(data, base + rel)
        if v is not None and 0 < v <= 300:
            row[label] = v

    # extra f64 near name (experimental)
    for label, rel in [
        ("faceDepth_f64", -56),
        ("edgeDepth_f64", 88),
        ("x_face_f64", 104),
        ("y_edge_f64", 112),
        ("x_edge_f64", 120),
    ]:
        v = f64(data, off + rel)
        if v is not None and 0 < v <= 120:
            row[label] = round(v, 4)

    # round floats; drop garbage doubles (path substring artifacts)
    for k in ("D1", "D2"):
        v = row.get(k)
        if isinstance(v, float):
            row[k] = round(v, 4) if is_plausible_mm(v) else None

    # drop unset experimental zeros
    for k in list(row.keys()):
        if k.endswith("_f64") and row[k] == 0.0:
            del row[k]

    return row


def row_score(row: dict) -> tuple[int, int]:
    score = 0
    if row.get("category"):
        score += 100
    if is_catalog_suffix(row.get("nameRaw", "")):
        score += 40
    if is_plausible_mm(row.get("D1")):
        score += 30
    if is_plausible_mm(row.get("D2")):
        score += 30
    if row.get("nameOffset", 0) < 12000:
        score += 20
    return score, -row.get("nameOffset", 0)


def dedupe_rows(rows: list[dict]) -> list[dict]:
    by_norm: dict[str, dict] = {}
    for r in rows:
        key = re.sub(r"[,$\s!]+$", "", r["name"]).lower()
        prev = by_norm.get(key)
        if prev is None or row_score(r) > row_score(prev):
            by_norm[key] = r
    return sorted(by_norm.values(), key=lambda x: x["nameOffset"])


def is_euro_entry(row: dict) -> bool:
    name_l = row["name"].lower()
    keywords = (
        "конфирмат",
        "шкант",
        "minifix",
        "эксц",
        "евровинт",
        "отверстие",
        "стяж",
        "2s",
    )
    return bool(row.get("category")) or any(k in name_l for k in keywords)


def compact_table(rows: list[dict]) -> list[dict]:
    table = []
    for r in rows:
        if r["name"].startswith("Евровинты") and len(r["name"]) < 12:
            continue
        if (
            len(r["name"]) < 8
            and not r.get("D1")
            and not r.get("D2")
            and not r.get("boltD_fromName")
        ):
            continue
        table.append(
            {
                "name": r["name"],
                "category": r.get("category") or "",
                "D1": r.get("D1"),
                "D2": r.get("D2"),
                "H1_mm": r.get("H1_mm"),
                "H2_mm": r.get("H2_mm"),
                "PrimStep_mm": r.get("PrimStep_mm"),
                "StartIndent_mm": r.get("StartIndent_mm"),
                "bolt": (
                    f"{r['boltD_fromName']}×{r['boltL_fromName']}"
                    if r.get("boltD_fromName") and r.get("boltL_fromName")
                    else None
                ),
            }
        )
    return table


def best_confirmat_7x50(rows: list[dict]) -> dict | None:
    candidates = [
        r
        for r in rows
        if re.search(r"7\s*[*xх×]\s*50", r["name"], re.I) and "планк" not in r["name"].lower()
    ]
    if not candidates:
        return None
    return max(candidates, key=row_score)


def build_comparison(bm: dict | None) -> dict | None:
    if not bm:
        return None
    c = CLODIS_TEMPLATE_1
    return {
        "bazisEntry": bm["name"],
        "bazisNameOffset": bm.get("nameOffset"),
        "matchNotes": [
            "D1=8 / D2=5 — совпадает с шаблоном Clodis №1 (пласть/торец)",
            "H1_mm=35 — совпадает с глубиной торца в Clodis (35 мм)",
            "Глубина пласти (16) и x/y (8/16/16) в .config явно не найдены — только в Clodis",
            "PrimStep_mm=30 в БАЗИС vs step=32 в Clodis — близко, но не 1:1",
            "StartIndent_mm=20 в БАЗИС vs offset=50 в Clodis — поля расстановки, нужна сверка в UI БАЗИС",
        ],
        "fields": {
            "D1_face": {"bazis": bm.get("D1"), "clodis": c["face"]["diameter"]},
            "D2_edge": {"bazis": bm.get("D2"), "clodis": c["edge"]["diameter"]},
            "face_depth": {
                "bazis": bm.get("faceDepth_f64"),
                "clodis": c["face"]["depth"],
                "note": "в config не найдено явно; в Clodis = 16",
            },
            "edge_depth_H1": {"bazis": bm.get("H1_mm"), "clodis": c["edge"]["depth"]},
            "x_face": {
                "bazis": bm.get("x_face_f64"),
                "clodis": c["face"]["x"],
                "note": "в config не найдено явно; в Clodis = 8",
            },
            "x_edge_y_edge": {
                "bazis": {"x": bm.get("x_edge_f64"), "y": bm.get("y_edge_f64")},
                "clodis": {"x": c["edge"]["x"], "y": c["edge"]["y"]},
                "note": "в config не найдено явно; в Clodis x=16 y=16",
            },
            "bolt": {
                "bazis": {
                    "D": bm.get("boltD_fromName") or bm.get("H2_mm"),
                    "L": bm.get("boltL_fromName"),
                },
                "clodis_scheme_name": "Конфирмат 50 мм",
            },
            "PrimStep_mm": {"bazis": bm.get("PrimStep_mm"), "clodis": c["scheme"]["step"]},
            "StartIndent_mm": {
                "bazis": bm.get("StartIndent_mm"),
                "clodis": c["scheme"]["offsetFromBase"],
            },
        },
    }


def main() -> int:
    config_path = find_config_path()
    data = config_path.read_bytes()
    hits = collect_name_hits(data)
    rows = dedupe_rows([extract_row(data, off, name) for off, name in sorted(hits.items())])
    euro_rows = [r for r in rows if is_euro_entry(r)]
    bm = best_confirmat_7x50(euro_rows)

    out = {
        "source": config_path.name,
        "sourcePath": str(config_path),
        "sourceSize": len(data),
        "parsedAt": "2026-07-13",
        "parser": "tools/parse-furnitura-config.py",
        "fieldMap": {
            "D1": "f64 @ nameOffset - 72 (Ø отверстия в пласть, мм)",
            "D2": "f64 @ nameOffset + 296 (Ø отверстия в торец, мм)",
            "H1_mm": "i32 @ nameOffset - 140 (гипотеза: глубина торца)",
            "H2_mm": "i32 @ nameOffset - 136 (часто = Ø винта из названия)",
            "PrimStep_mm": "i32 @ nameOffset + 56 (гипотеза: шаг, мм)",
            "StartIndent_mm": "i32 @ nameOffset + 364 (гипотеза: отступ от края)",
        },
        "notes": [
            "Каталог БАЗИС — не координаты конкретного шкафа, а шаблоны крепежа.",
            "Запись с запятой в конце — основной вариант; с $ — альтернатива (толщина/пласть).",
            "Для точных x/y отверстий на детали нужен CFRN или .bprj, не .config.",
        ],
        "clodisTemplate1": CLODIS_TEMPLATE_1,
        "clodisComparison": build_comparison(bm),
        "eurovintyTable": compact_table(euro_rows),
        "entryCountAll": len(rows),
        "entryCountEuro": len(euro_rows),
        "entries": euro_rows,
        "entriesOther": [r for r in rows if not is_euro_entry(r)],
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_PATH} ({len(euro_rows)} euro entries, {len(rows)} total)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
