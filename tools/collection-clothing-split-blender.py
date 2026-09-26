"""
Split Collection Clothing FBX → many GLBs (props only).
Skips pack shelves/rods (wooden_Shelves, Line*).

Usage (via collection-clothing-split.ps1):
  blender -b -P collection-clothing-split-blender.py -- \\
    --input ".../Collection Clothing.fbx" --out-dir ".../collection-clothing" \\
    --maps ".../maps" --decimate 0.25
"""
from __future__ import annotations

import argparse
import importlib.util
import math
import os
import re
import sys
from pathlib import Path

from mathutils import Vector


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
    p.add_argument("--out-dir", required=True)
    p.add_argument("--maps", default="")
    p.add_argument("--decimate", type=float, default=0.25)
    p.add_argument("--jpeg-quality", type=int, default=82)
    p.add_argument(
        "--only",
        default="",
        help="Comma list of unit ids to export (empty = all)",
    )
    return p.parse_args(argv)


def _norm(s: str) -> str:
    return "".join(ch for ch in (s or "").lower() if ch.isalnum())


def _is_excluded(name: str) -> bool:
    n = _norm(name)
    if n.startswith("woodenshelves") or "woodenshelves" in n:
        return True
    if n.startswith("line") and n[4:].isdigit():
        return True
    if n in ("shape015",):
        return True
    return False


def _world_center(ob) -> Vector:
    pts = [ob.matrix_world @ v.co for v in ob.data.vertices]
    return sum(pts, Vector()) / max(len(pts), 1)


def _safe_name(s: str) -> str:
    s = re.sub(r"[^\w\-]+", "-", (s or "").strip(), flags=re.UNICODE)
    s = re.sub(r"-+", "-", s).strip("-").lower()
    return s or "prop"


def _is_hanger(name: str) -> bool:
    n = _norm(name)
    return "hanger" in n


def _is_hang_garment(name: str) -> bool:
    """Одежда на плечике (не стопка / не коробка)."""
    n = _norm(name)
    if _is_hanger(name) or _is_excluded(name):
        return False
    # folded piles / shelf clutter — handled via groups
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
    # cloth020–022 / cloth037–042 / cloth4459… are in folded groups — still hang? skip numeric cloth in groups later
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
    # hanging pants / draped cloth often named cloth#### but not in folded groups
    if n.startswith("cloth") and n[5:].isdigit():
        return True
    return False


def _collect_subtree_meshes(root):
    out = []
    stack = [root]
    while stack:
        ob = stack.pop()
        if ob.type == "MESH" and ob.data and not _is_excluded(ob.name):
            out.append(ob)
        stack.extend(list(ob.children))
    return out


def _decimate_objects(obs, ratio: float) -> None:
    import bpy

    if not (0.0 < ratio < 1.0):
        return
    for ob in obs:
        if ob.type != "MESH" or not ob.data:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        ob.select_set(True)
        bpy.context.view_layer.objects.active = ob
        mod = ob.modifiers.new(name="DecimateSplit", type="DECIMATE")
        mod.decimate_type = "COLLAPSE"
        mod.ratio = ratio
        try:
            bpy.ops.object.modifier_apply(modifier=mod.name)
        except Exception as e:
            print("DECIMATE_FAIL", ob.name, e)


def _export_selection(path: str, jpeg_quality: int) -> None:
    import bpy

    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    tmp = path + ".tmp.glb"
    if os.path.isfile(tmp):
        os.remove(tmp)
    bpy.ops.export_scene.gltf(
        filepath=tmp,
        export_format="GLB",
        use_selection=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_image_format="JPEG",
        export_jpeg_quality=int(jpeg_quality),
        export_apply=True,
    )
    if not os.path.isfile(tmp) or os.path.getsize(tmp) < 500:
        raise SystemExit(f"Export failed: {tmp}")
    if os.path.isfile(path):
        os.remove(path)
    os.replace(tmp, path)


def _select_only(obs) -> None:
    import bpy

    bpy.ops.object.select_all(action="DESELECT")
    for ob in obs:
        ob.select_set(True)
    if obs:
        bpy.context.view_layer.objects.active = obs[0]


def _ground_and_origin(obs) -> None:
    """Pivot = top of AABB (крючок), ноги на Y=0 после glTF — в Blender Z-up: min Z → 0, origin at max Z center."""
    import bpy

    if not obs:
        return
    # apply so export is clean
    _select_only(obs)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    pts = []
    for ob in obs:
        for v in ob.data.vertices:
            pts.append(ob.matrix_world @ v.co)
    if not pts:
        return
    zs = [p.z for p in pts]
    xs = [p.x for p in pts]
    ys = [p.y for p in pts]
    zmin, zmax = min(zs), max(zs)
    cx = (min(xs) + max(xs)) * 0.5
    cy = (min(ys) + max(ys)) * 0.5
    # сдвиг: пол на Z=0
    dz = -zmin
    for ob in obs:
        ob.location.z += dz
    bpy.context.view_layer.update()
    # origin в верхней точке (крючок) по центру XZ
    cursor = bpy.context.scene.cursor
    cursor.location = Vector((cx, cy, zmax + dz))
    _select_only(obs)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR", center="MEDIAN")
    # после origin объекты могут уехать — оставить как есть


def plan_units(bpy_module):
    """Return list of {id, kind, objects}."""
    bpy = bpy_module
    units = []
    used = set()

    # 1) Named EMPTY groups (shelf lifestyle)
    for ob in bpy.data.objects:
        if ob.type != "EMPTY":
            continue
        nl = ob.name.lower()
        if not nl.startswith("group_"):
            continue
        if nl in ("group_cloth_set",):
            continue
        meshes = _collect_subtree_meshes(ob)
        # drop rod lines inside slipper groups
        meshes = [m for m in meshes if not _is_excluded(m.name)]
        if not meshes:
            continue
        kind = "shoes" if ("slipper" in nl or "tamaris" in nl) else "stack"
        if "folded" in nl or "knitted" in nl:
            kind = "stack"
        uid = "shelf-" + _safe_name(ob.name)
        units.append({"id": uid, "kind": kind, "objects": meshes, "slot": "shelf"})
        for m in meshes:
            used.add(m.name)

    # 2) Solo shelf props
    solo_needles = (
        "box_white",
        "cloth_box",
        "cloth_crate",
        "crate0",
        "crate00",
        "rattan_box",
        "leather_bag",
        "drip city",
        "dripcity",
        "hat_classic",
        "rope",
    )
    for ob in bpy.data.objects:
        if ob.type != "MESH" or ob.name in used or _is_excluded(ob.name):
            continue
        nl = ob.name.lower()
        if not any(s in nl for s in solo_needles):
            continue
        kind = "bag" if ("bag" in nl or "tote" in nl) else "box"
        if "hat" in nl or nl == "rope":
            kind = "box"
        uid = "shelf-" + _safe_name(ob.name)
        units.append({"id": uid, "kind": kind, "objects": [ob], "slot": "shelf"})
        used.add(ob.name)

    # 3) Hang garments + closest free hanger
    hangers = []
    garments = []
    for ob in bpy.data.objects:
        if ob.type != "MESH" or not ob.data or ob.name in used:
            continue
        if _is_excluded(ob.name):
            continue
        if _is_hanger(ob.name):
            hangers.append(ob)
        elif _is_hang_garment(ob.name):
            garments.append(ob)

    # 3a) Целая полоса «как в сцене» (пары и порядок X сохранены) — до greedy-pair.
    # Не помечаем used: отдельные rod-* по-прежнему экспортируются.
    row_obs = list(hangers) + list(garments)
    if row_obs:
        units.append(
            {
                "id": "rod-hang-row",
                "kind": "hang",
                "objects": row_obs,
                "slot": "rod",
            }
        )
        print("ROW", "rod-hang-row", "meshes", len(row_obs))

    hanger_free = set(h.name for h in hangers)
    hanger_by = {h.name: h for h in hangers}

    def closest_hanger(g):
        gc = _world_center(g)
        best = None
        best_d = 1e18
        for hn in list(hanger_free):
            h = hanger_by[hn]
            hc = _world_center(h)
            # вдоль штанги: X + глубина Z
            d = math.sqrt((gc.x - hc.x) ** 2 + (gc.z - hc.z) ** 2 + 0.15 * (gc.y - hc.y) ** 2)
            if d < best_d:
                best_d = d
                best = hn
        if best is None or best_d > 0.55:
            return None, best_d
        return best, best_d

    # greedy: smaller garments first? sort by distance uniqueness — sort garments by x
    for g in sorted(garments, key=lambda o: _world_center(o).x):
        if g.name in used:
            continue
        hn, dist = closest_hanger(g)
        obs = [g]
        if hn:
            hanger_free.discard(hn)
            obs.append(hanger_by[hn])
            print("PAIR", g.name, "+", hn, "d", round(dist, 3))
        else:
            print("PAIR", g.name, "+ NONE", "d", round(dist, 3))
        uid = "rod-" + _safe_name(g.name)
        units.append({"id": uid, "kind": "hang", "objects": obs, "slot": "rod"})
        for o in obs:
            used.add(o.name)

    # leftover bare hangers — one template
    left_h = [hanger_by[n] for n in sorted(hanger_free)]
    if left_h:
        # take first wood/plastic only
        pick = next((h for h in left_h if "wood" in h.name.lower() or "plastic" in h.name.lower()), left_h[0])
        units.append(
            {
                "id": "rod-hanger-empty",
                "kind": "hang",
                "objects": [pick],
                "slot": "rod",
            }
        )
        print("PAIR empty hanger", pick.name)

    return units


def _fix_storage_box_materials(shelf_mod, img_index: dict) -> int:
    """
    Боксы/корзины: FBX часто даёт почти белый albedo или чужой mat (dress→shirt).
    Принудительно карта + UV tile + лёгкое затемнение, чтобы плетение читалось.
    """
    import bpy

    by_stem = shelf_mod._build_stem_index(img_index)
    # (name needle, stem, uv_scale, multiply RGB or None)
    # cloth_box: в FBX Map #84385 пустой путь — раньше ошибочно ставили pack.jpg (дерево).
    # В паке это серые тканевые короба (как на рефе), albedo = cloth_gray.
    rules = [
        ("box_white", "boxwhite", 2.0, None),
        ("cloth_box", "clothgray", 2.2, None),
        ("cloth_crate", "clothgray", 2.2, None),
        # UV 1.0 как в Max FBX — 2.0 раздувало плетение и «не доделанный» вид.
        ("rattan_box", "rattan19im", 1.0, None),
        ("crate01", "crateim01", 1.0, None),
        ("crate002", "crateim01", 1.0, None),
    ]
    n = 0
    touched = set()
    for ob in bpy.data.objects:
        if ob.type != "MESH":
            continue
        onorm = _norm(ob.name)
        rule = None
        for needle, stem, uv, mul in rules:
            if _norm(needle) in onorm or onorm.startswith(_norm(needle)):
                rule = (stem, uv, mul)
                break
        if not rule:
            continue
        stem, uv_scale, mul = rule
        hit = by_stem.get(stem) or shelf_mod._pick_albedo_stem(by_stem, stem)
        if not hit:
            print("BOX_MAP_MISS", ob.name, stem)
            continue
        for slot in ob.material_slots:
            mat = slot.material
            if not mat or mat.name in touched:
                continue
            touched.add(mat.name)
            # chrome handle stays solid
            if "chrom" in _norm(mat.name) or "crossbar" in _norm(mat.name):
                continue
            shelf_mod._set_simple_textured_mat(
                mat, hit, solid=None, uv_scale=float(uv_scale), uv_loc=(0.0, 0.0)
            )
            # knit-style Mapping for tile (reuse path in _set_simple — only knits get Mapping)
            # force Mapping for boxes:
            nt = mat.node_tree
            if nt:
                bsdf = next((x for x in nt.nodes if x.type == "BSDF_PRINCIPLED"), None)
                tex = next((x for x in nt.nodes if x.type == "TEX_IMAGE"), None)
                if bsdf and tex:
                    # ensure mapping
                    mapping = next((x for x in nt.nodes if x.type == "MAPPING"), None)
                    if mapping is None:
                        mapping = nt.nodes.new("ShaderNodeMapping")
                        uvn = next((x for x in nt.nodes if x.type == "UVMAP"), None)
                        if uvn is None:
                            uvn = nt.nodes.new("ShaderNodeUVMap")
                        for link in list(nt.links):
                            if link.to_node == tex and link.to_socket == tex.inputs.get("Vector"):
                                nt.links.remove(link)
                        nt.links.new(uvn.outputs["UV"], mapping.inputs["Vector"])
                        nt.links.new(mapping.outputs["Vector"], tex.inputs["Vector"])
                    mapping.inputs["Scale"].default_value = (uv_scale, uv_scale, 1.0)
                    if mul:
                        # multiply albedo toward readable grey-beige
                        for link in list(nt.links):
                            if link.to_node == bsdf and link.to_socket == bsdf.inputs.get("Base Color"):
                                nt.links.remove(link)
                        mix = nt.nodes.new("ShaderNodeMix")
                        mix.data_type = "RGBA"
                        mix.blend_type = "MULTIPLY"
                        mix.inputs["Factor"].default_value = 1.0
                        mix.inputs["A"].default_value = (mul[0], mul[1], mul[2], 1.0)
                        nt.links.new(tex.outputs["Color"], mix.inputs["B"])
                        nt.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
                    if "Roughness" in bsdf.inputs:
                        bsdf.inputs["Roughness"].default_value = 0.92
                    if "Metallic" in bsdf.inputs:
                        bsdf.inputs["Metallic"].default_value = 0.0
            print("BOX_FIX", ob.name, mat.name, "->", stem, "uv", uv_scale)
            n += 1
    return n


def main():
    import bpy

    shelf = _load_shelf_mod()
    args = parse_args(sys.argv)
    inp = os.path.abspath(args.input)
    out_dir = os.path.abspath(args.out_dir)
    only = {x.strip() for x in args.only.split(",") if x.strip()}

    maps_dir = shelf.find_maps_dir(inp, args.maps)
    img_index = shelf.collect_images(maps_dir)
    # не грузить bump/reflect/opacity — OOM + не albedo
    skip_sub = ("bump", "refl", "reflect", "opas", "opacity", "displacement", "displace", "normal", "nrm")
    img_index = {
        k: v
        for k, v in img_index.items()
        if not any(s in _norm(k) for s in skip_sub)
    }
    print("INPUT", inp)
    print("MAPS", maps_dir, "images", len(set(img_index.values())))
    print("OUT", out_dir)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    shelf.import_model(inp)

    # delete excluded geometry early
    for ob in list(bpy.data.objects):
        if ob.type == "MESH" and _is_excluded(ob.name):
            print("DELETE", ob.name)
            bpy.data.objects.remove(ob, do_unlink=True)

    units = plan_units(bpy)
    print("UNITS", len(units))
    for u in units:
        print(
            "UNIT",
            u["slot"],
            u["kind"],
            u["id"],
            "meshes",
            [o.name for o in u["objects"]],
        )

    if only:
        only_l = {x.lower() for x in only}
        keep = set()
        for u in units:
            if u["id"].lower() in only_l:
                for o in u["objects"]:
                    keep.add(o.name)
        for ob in list(bpy.data.objects):
            if ob.type == "MESH" and ob.name not in keep:
                bpy.data.objects.remove(ob, do_unlink=True)
        print("ONLY_KEEP", sorted(keep))

    # материалы: relink + явная привязка albedo (Collection Clothing vray_*)
    shelf.relink_missing_images(img_index)
    shelf.resize_images(1024)
    shelf.ensure_principled_from_orphan_maps(img_index)
    _fix_storage_box_materials(shelf, img_index)
    # выкинуть неиспользуемые картинки из памяти
    for img in list(bpy.data.images):
        if img.users == 0:
            bpy.data.images.remove(img)

    os.makedirs(out_dir, exist_ok=True)
    rod_dir = os.path.join(out_dir, "rod")
    shelf_dir = os.path.join(out_dir, "shelf")
    os.makedirs(rod_dir, exist_ok=True)
    os.makedirs(shelf_dir, exist_ok=True)

    manifest = []
    for u in units:
        if only and u["id"].lower() not in {x.lower() for x in only}:
            continue
        obs = [o for o in u["objects"] if o.name in bpy.data.objects]
        if not obs:
            print("SKIP_EMPTY", u["id"])
            continue
        # duplicate objects for destructive decimate/origin without breaking next units
        bpy.ops.object.select_all(action="DESELECT")
        for o in obs:
            o.select_set(True)
        bpy.context.view_layer.objects.active = obs[0]
        bpy.ops.object.duplicate(linked=False)
        dups = [o for o in bpy.context.selected_objects]
        if args.decimate > 0:
            _decimate_objects(dups, args.decimate)
        if u["slot"] == "rod":
            _ground_and_origin(dups)
        else:
            # shelf: origin bottom center
            _select_only(dups)
            bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
            pts = []
            for o in dups:
                for v in o.data.vertices:
                    pts.append(o.matrix_world @ v.co)
            if pts:
                zmin = min(p.z for p in pts)
                for o in dups:
                    o.location.z -= zmin
                bpy.context.view_layer.update()
                xs = [p.x for p in pts]
                ys = [p.y for p in pts]
                bpy.context.scene.cursor.location = Vector(
                    ((min(xs) + max(xs)) * 0.5, (min(ys) + max(ys)) * 0.5, 0.0)
                )
                _select_only(dups)
                bpy.ops.object.origin_set(type="ORIGIN_CURSOR", center="MEDIAN")

        sub = rod_dir if u["slot"] == "rod" else shelf_dir
        path = os.path.join(sub, u["id"] + ".glb")
        _select_only(dups)
        try:
            _export_selection(path, args.jpeg_quality)
            sz = os.path.getsize(path)
            print("OK", path, "bytes", sz)
            manifest.append(
                {
                    "id": u["id"],
                    "kind": u["kind"],
                    "slot": u["slot"],
                    "file": path,
                    "bytes": sz,
                    "meshes": [o.name for o in obs],
                }
            )
        finally:
            for o in dups:
                bpy.data.objects.remove(o, do_unlink=True)

    man_path = os.path.join(out_dir, "manifest.json")
    import json

    # --only: не затирать остальные unit'ы в manifest
    prev = []
    if only and os.path.isfile(man_path):
        try:
            with open(man_path, "r", encoding="utf-8") as f:
                loaded = json.load(f)
            if isinstance(loaded, list):
                prev = loaded
        except Exception as e:
            print("MANIFEST_PREV_FAIL", e)
    by_id = {str(x.get("id")): x for x in prev if isinstance(x, dict) and x.get("id")}
    for row in manifest:
        by_id[str(row["id"])] = row
    merged = list(by_id.values())
    # shelf first, then rod, stable-ish by id
    merged.sort(key=lambda r: (0 if r.get("slot") == "shelf" else 1, str(r.get("id") or "")))

    with open(man_path, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
    print("MANIFEST", man_path, "count", len(merged), "new", len(manifest))
    print("DONE")


if __name__ == "__main__":
    main()
