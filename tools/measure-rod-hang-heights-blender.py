"""
Замер высот одежды на плечиках в Collection Clothing FBX.
Класс: short / mid / long по высоте AABB (мм).

Usage:
  blender -b -P measure-rod-hang-heights-blender.py -- --input model.fbx [--out report.json]
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

from mathutils import Vector

# Пороги по высоте вещи (мм) — ориентир IKEA: рубашка ~600–800, пальто/платье ~1000+
SHORT_MAX_MM = 850
LONG_MIN_MM = 1000
PAIR_DIST_MAX = 0.05


def parse_args(argv):
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = argv[1:]
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--out", default="")
    return p.parse_args(argv)


def _norm(s: str) -> str:
    return "".join(ch for ch in (s or "").lower() if ch.isalnum())


def _is_hanger(name: str) -> bool:
    return "hanger" in (name or "").lower()


def _is_excluded(name: str) -> bool:
    n = _norm(name)
    if n.startswith("woodenshelves") or "woodenshelves" in n:
        return True
    if n.startswith("line") and n[4:].isdigit():
        return True
    if n in ("shape015",):
        return True
    return False


def _is_hang_garment(name: str) -> bool:
    if _is_hanger(name) or _is_excluded(name):
        return False
    n = _norm(name)
    skip = (
        "box",
        "crate",
        "rattan",
        "rope",
        "hat",
        "slipper",
        "sandal",
        "sole",
        "tamaris",
        "zipper",
        "plane",
        "button",
        "tag",
        "leatherbag",
        "dripcity",
        "tote",
    )
    if any(x in n for x in skip):
        return False
    hang_keys = (
        "shirt",
        "blouse",
        "dress",
        "sweater",
        "jean",
        "vest",
        "knitted",
        "lace",
        "jacket",
        "coat",
        "trouser",
        "pant",
        "suit",
    )
    if any(k in n for k in hang_keys):
        return True
    if n.startswith("cloth") and len(n) > 5:
        return True
    return False


def _world_pts(ob):
    return [ob.matrix_world @ v.co for v in ob.data.vertices]


def _world_aabb(ob):
    pts = _world_pts(ob)
    if not pts:
        return None
    xs = [p.x for p in pts]
    ys = [p.y for p in pts]
    zs = [p.z for p in pts]
    return min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)


def _top_center(ob) -> Vector:
    a = _world_aabb(ob)
    if not a:
        return Vector((0, 0, 0))
    return Vector(((a[0] + a[1]) * 0.5, (a[2] + a[3]) * 0.5, a[5]))


def _center(ob) -> Vector:
    a = _world_aabb(ob)
    if not a:
        return Vector((0, 0, 0))
    return Vector(((a[0] + a[1]) * 0.5, (a[2] + a[3]) * 0.5, (a[4] + a[5]) * 0.5))


def _pair_hanger_for_garment(garment, hangers, used_hanger_names: set):
    gt = _top_center(garment)
    ga = _world_aabb(garment)
    if not ga:
        return None, 1e18
    z0 = ga[4] + 0.70 * (ga[5] - ga[4])
    pts = [p for p in _world_pts(garment) if p.z >= z0]
    if len(pts) < 4:
        pts = _world_pts(garment)
    xs = [p.x for p in pts]
    ys = [p.y for p in pts]
    x0, x1 = min(xs), max(xs)
    y0, y1 = min(ys), max(ys)
    margin = 0.06
    best = None
    best_d = 1e18
    for h in hangers:
        if h.name in used_hanger_names:
            continue
        hc = _center(h)
        ha = _world_aabb(h)
        if not ha:
            continue
        in_xy = x0 - margin <= hc.x <= x1 + margin and y0 - margin <= hc.y <= y1 + margin
        above = ha[5] >= (ga[4] + ga[5]) * 0.5 - 0.05
        d = math.sqrt(
            (gt.x - hc.x) ** 2 + (gt.y - hc.y) ** 2 + 0.35 * (gt.z - hc.z) ** 2
        )
        if in_xy and above and d < best_d:
            best_d = d
            best = h
    if best is not None:
        return best, best_d
    return None, best_d if best_d < 1e17 else 1e18


def _height_mm(ob, unit_scale: float) -> float:
    a = _world_aabb(ob)
    if not a:
        return 0.0
    # Z-up Blender after FBX: height = Z; if scene is Y-up-ish, take max axis span
    dx = (a[1] - a[0]) * unit_scale
    dy = (a[3] - a[2]) * unit_scale
    dz = (a[5] - a[4]) * unit_scale
    # hanging garment: vertical = largest of Y/Z typically
    return max(dy, dz) * 1000.0


def _classify(h_mm: float) -> str:
    if h_mm >= LONG_MIN_MM:
        return "long"
    if h_mm <= SHORT_MAX_MM:
        return "short"
    return "mid"


def main():
    import bpy

    args = parse_args(sys.argv)
    fbx = Path(args.input)
    if not fbx.is_file():
        raise SystemExit(f"FBX not found: {fbx}")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    try:
        bpy.ops.import_scene.fbx(filepath=str(fbx), use_image_search=False)
    except TypeError:
        bpy.ops.import_scene.fbx(filepath=str(fbx))

    # Detect units: if max garment dim > 50 → already mm/cm-scale in Blender units
    meshes = [o for o in bpy.data.objects if o.type == "MESH" and o.data]
    sample = []
    for o in meshes:
        a = _world_aabb(o)
        if not a:
            continue
        sample.append(max(a[1] - a[0], a[3] - a[2], a[5] - a[4]))
    max_raw = max(sample) if sample else 1.0
    # If scene is in mm already (hundreds), unit_scale=0.001 to get meters then *1000 in _height_mm
    # _height_mm returns *1000: so pass unit_scale such that local*unit_scale = meters
    if max_raw > 50:
        unit_scale = 0.001  # Blender units ≈ mm
        unit_guess = "mm"
    elif max_raw > 3.5:
        unit_scale = 0.01  # cm
        unit_guess = "cm"
    else:
        unit_scale = 1.0  # m
        unit_guess = "m"

    hangers = [
        o
        for o in meshes
        if _is_hanger(o.name) and not _is_excluded(o.name)
    ]
    garments = [
        o
        for o in meshes
        if _is_hang_garment(o.name)
    ]
    garments.sort(key=lambda o: _center(o).x)

    used_h = set()
    rows = []
    for g in garments:
        h_mm = _height_mm(g, unit_scale)
        hanger, d = _pair_hanger_for_garment(g, hangers, used_h)
        paired = bool(hanger) and d <= PAIR_DIST_MAX
        if paired:
            used_h.add(hanger.name)
        cls = _classify(h_mm)
        row = {
            "name": g.name,
            "height_mm": round(h_mm, 1),
            "class": cls,
            "paired": paired,
            "pair_dist": round(d, 4) if d < 1e17 else None,
            "hanger": hanger.name if hanger else None,
        }
        rows.append(row)
        print(
            "ITEM",
            g.name,
            "h_mm",
            round(h_mm, 1),
            "class",
            cls,
            "paired",
            paired,
            "d",
            None if d >= 1e17 else round(d, 4),
        )

    paired_rows = [r for r in rows if r["paired"]]
    summary = {
        "unit_guess": unit_guess,
        "max_raw_extent": round(max_raw, 4),
        "thresholds_mm": {"short_max": SHORT_MAX_MM, "long_min": LONG_MIN_MM},
        "garments_total": len(rows),
        "paired_total": len(paired_rows),
        "by_class_all": {
            "short": sum(1 for r in rows if r["class"] == "short"),
            "mid": sum(1 for r in rows if r["class"] == "mid"),
            "long": sum(1 for r in rows if r["class"] == "long"),
        },
        "by_class_paired": {
            "short": sum(1 for r in paired_rows if r["class"] == "short"),
            "mid": sum(1 for r in paired_rows if r["class"] == "mid"),
            "long": sum(1 for r in paired_rows if r["class"] == "long"),
        },
        "long_paired_names": [r["name"] for r in paired_rows if r["class"] == "long"],
        "mid_paired_names": [r["name"] for r in paired_rows if r["class"] == "mid"],
        "long_unpaired_names": [
            r["name"] for r in rows if r["class"] == "long" and not r["paired"]
        ],
        "items": rows,
    }
    print("SUMMARY", json.dumps({k: v for k, v in summary.items() if k != "items"}, ensure_ascii=False))

    out = Path(args.out) if args.out else Path(__file__).resolve().parents[1] / "docs" / "rod-hang-height-measure.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print("OUT", out)


if __name__ == "__main__":
    main()
