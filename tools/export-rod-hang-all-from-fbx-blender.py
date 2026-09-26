"""
Все пары «плечик + одежда» со штанги Collection Clothing FBX.
Только hang (без стопок/коробов/пустых плечиков). Ровный шаг крючков.

Usage:
  blender -b -P export-rod-hang-all-from-fbx-blender.py -- --input model.fbx [--maps maps]
"""
from __future__ import annotations

import argparse
import importlib.util
import math
import os
import shutil
import sys
from pathlib import Path

from mathutils import Vector

HOOK_STEP_M = 0.12
PAIR_DIST_MAX = 0.05


def _load_shelf_mod():
    here = Path(__file__).resolve().parent
    path = here / "shelf-prop-to-glb-blender.py"
    spec = importlib.util.spec_from_file_location("shelf_prop_glb", path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(mod)
    return mod


def parse_args(argv):
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = argv[1:]
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--maps", default="")
    p.add_argument("--jpeg-quality", type=int, default=82)
    p.add_argument("--step", type=float, default=HOOK_STEP_M)
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
    )
    if any(k in n for k in hang_keys):
        return True
    if n.startswith("cloth") and n[5:].isdigit():
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


def _select_only(obs):
    import bpy

    bpy.ops.object.select_all(action="DESELECT")
    for o in obs:
        o.select_set(True)
    if obs:
        bpy.context.view_layer.objects.active = obs[0]


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


def main():
    import bpy

    args = parse_args(sys.argv)
    fbx = Path(args.input)
    if not fbx.is_file():
        raise SystemExit(f"FBX not found: {fbx}")

    shelf = _load_shelf_mod()
    repo = Path(__file__).resolve().parents[1]
    rod_dir = repo / "public" / "models" / "lifestyle-props" / "collection-clothing" / "rod"
    out = rod_dir / "rod-hang-all.glb"
    out_row = rod_dir / "rod-hang-row.glb"
    desktop = Path.home() / "Desktop" / "rod-hang-all.glb"
    step = float(args.step) if args.step > 0 else HOOK_STEP_M

    maps_dir = shelf.find_maps_dir(str(fbx), args.maps)
    img_index = shelf.collect_images(maps_dir)
    skip_sub = ("bump", "refl", "reflect", "opas", "opacity", "displacement", "displace", "normal", "nrm")
    img_index = {
        k: v
        for k, v in img_index.items()
        if not any(s in _norm(k) for s in skip_sub)
    }
    print("MAPS", maps_dir, "images", len(set(img_index.values())))

    bpy.ops.wm.read_factory_settings(use_empty=True)
    try:
        bpy.ops.import_scene.fbx(filepath=str(fbx), use_image_search=True)
    except TypeError:
        bpy.ops.import_scene.fbx(filepath=str(fbx))

    for o in list(bpy.data.objects):
        if o.type == "MESH" and _is_excluded(o.name):
            bpy.data.objects.remove(o, do_unlink=True)

    n_rel = shelf.relink_missing_images(img_index)
    shelf.resize_images(1024)
    n_prin = shelf.ensure_principled_from_orphan_maps(img_index)
    print("MAT relink", n_rel, "principled", n_prin)
    for img in list(bpy.data.images):
        if img.users == 0:
            bpy.data.images.remove(img)

    hangers = [
        o
        for o in bpy.data.objects
        if o.type == "MESH" and o.data and _is_hanger(o.name) and not _is_excluded(o.name)
    ]
    garments = [
        o
        for o in bpy.data.objects
        if o.type == "MESH" and o.data and _is_hang_garment(o.name)
    ]
    garments.sort(key=lambda o: _center(o).x)
    print("FBX hangers", len(hangers), "garments", len(garments))

    used_h = set()
    pairs = []
    for g in garments:
        h, d = _pair_hanger_for_garment(g, hangers, used_h)
        if not h or d > PAIR_DIST_MAX:
            print("PAIR_SKIP", g.name, "d", round(d, 4), "h", h.name if h else None)
            continue
        used_h.add(h.name)
        pairs.append((g.name, g, h))
        print("PAIR_OK", g.name, "+", h.name, "d", round(d, 4))

    if not pairs:
        raise SystemExit("No hang pairs found")
    print("PAIRS_TOTAL", len(pairs))

    keep_objs = []
    pair_groups = []
    for gname, g, h in pairs:
        bpy.ops.object.select_all(action="DESELECT")
        g.select_set(True)
        h.select_set(True)
        bpy.context.view_layer.objects.active = g
        bpy.ops.object.duplicate(linked=False)
        dups = [o for o in bpy.context.selected_objects if o.type == "MESH"]
        pair_groups.append((gname, dups))
        keep_objs.extend(dups)

    keep_names = set(o.name for o in keep_objs)
    for o in list(bpy.data.objects):
        if o.type == "MESH" and o.name not in keep_names:
            bpy.data.objects.remove(o, do_unlink=True)

    # Ровный шаг — без дыр как в исходной сцене
    for i, (gname, meshes) in enumerate(pair_groups):
        hang = next((o for o in meshes if _is_hanger(o.name)), meshes[0])
        hook = _top_center(hang)
        target_x = i * step
        dx = target_x - hook.x
        for o in meshes:
            o.location.x += dx
        bpy.context.view_layer.update()
        print("PLACE", i, gname, "->", round(target_x, 3))

    all_kept = []
    for _, meshes in pair_groups:
        all_kept.extend(meshes)

    _select_only(all_kept)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    pts = []
    for o in all_kept:
        pts.extend(_world_pts(o))
    xs = [p.x for p in pts]
    ys = [p.y for p in pts]
    zs = [p.z for p in pts]
    zmin, zmax = min(zs), max(zs)
    cx = (min(xs) + max(xs)) * 0.5
    cy = (min(ys) + max(ys)) * 0.5
    for o in all_kept:
        o.location.z -= zmin
    bpy.context.view_layer.update()
    bpy.context.scene.cursor.location = Vector((cx, cy, zmax - zmin))
    _select_only(all_kept)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR", center="MEDIAN")

    def _export(path: Path):
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = str(path) + ".tmp.glb"
        if os.path.isfile(tmp):
            os.remove(tmp)
        _select_only(all_kept)
        bpy.ops.export_scene.gltf(
            filepath=tmp,
            export_format="GLB",
            use_selection=True,
            export_texcoords=True,
            export_normals=True,
            export_materials="EXPORT",
            export_image_format="JPEG",
            export_jpeg_quality=int(args.jpeg_quality),
            export_apply=True,
        )
        if not os.path.isfile(tmp) or os.path.getsize(tmp) < 500:
            raise SystemExit(f"Export failed: {tmp}")
        if path.is_file():
            path.unlink()
        os.replace(tmp, path)
        print("OK", path, "bytes", path.stat().st_size)

    _export(out)
    shutil.copy2(out, out_row)
    print("OK", out_row, "bytes", out_row.stat().st_size)
    try:
        shutil.copy2(out, desktop)
        print("DESKTOP", desktop, "bytes", desktop.stat().st_size)
    except Exception as e:
        print("DESKTOP_FAIL", e)
    print("DONE pairs", len(pairs), "step", step)


if __name__ == "__main__":
    main()
