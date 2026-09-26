"""
wardrobe-5 OBJ → rod-hang-short.glb + rod-hang-long.glb
Как collection-clothing: пара = одежда + плечико + крючок (в OBJ крючок отдельный меш!).

Usage:
  blender -b -P export-wardrobe5-rod-hang-blender.py -- --obj path.obj --maps maps --out-dir rod/
"""
from __future__ import annotations

import argparse
import math
import os
import shutil
import sys
from pathlib import Path

from mathutils import Vector

SHORT_MAX_MM = 800
LONG_MIN_MM = 850
# Шаг крючков вдоль штанги (профиль: плечи вдоль Z, тонкие по X).
STEP_MM = 120.0
# 0 = профиль вдоль штанги (как collection FBX strip). ±90 = лицом к дверце, но ~400 мм ширины лезут в бока узкой секции.
FACE_YAW_DEG = 0.0

GARMENT_TEX = {
    "set_14_001": "set_14_Contemporary 011.jpg",
    "set_14_002": "set_14_EMILY.jpg",
    "set_14_003": "set_14_Tkan'_Uzor_2.jpg",
    "set_14_004": "set_14_Tkan'_Uzor_1.jpg",
    "set_14_005": "set_14_leather_bamp.jpg",
    "set_14_006": "set_14_15Loft.jpg",
    "set_14_007": "set_14_dalmation-fur.jpg",
    "set_14_008": "set_14_Pled_1.jpg",
    "set_14_009": "set_14_Poloski.jpg",
    "set_14_010": "set_14_Venice - Watercolor.jpg",
    "set_14_013": "set_14_2.jpg",
    "set_14_014": "set_14_Contemporary 011.jpg",
    "set_14_015": "set_14_EMILY.jpg",
    "set_14_016": "set_14_Poloski.jpg",
    "set_14_017": "set_14_15Loft.jpg",
    "set_14_094": "set_14_2.jpg",
}

# OBJ потерял VRay UVW tiling. Цель: ~TARGET_UV_SPAN повторов по острову (как в паке).
TARGET_UV_SPAN = 4.0


def mesh_uv_span(ob) -> float:
    """Макс. span UV0 (U или V). Без UV → 1."""
    me = ob.data
    if not me.uv_layers:
        return 1.0
    uv = me.uv_layers.active
    if not uv or not uv.data:
        return 1.0
    us = [d.uv.x for d in uv.data]
    vs = [d.uv.y for d in uv.data]
    if not us:
        return 1.0
    return max(max(us) - min(us), max(vs) - min(vs), 1e-4)


def uv_scale_for_object(ob) -> float:
    """Если UV уже «длинные» (тайл в меше) — не трогаем; если ~0–1 — умножаем."""
    span = mesh_uv_span(ob)
    if span >= TARGET_UV_SPAN * 0.85:
        return 1.0
    return float(TARGET_UV_SPAN / span)


def parse_args(argv):
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = argv[1:]
    p = argparse.ArgumentParser()
    p.add_argument("--obj", required=True)
    p.add_argument("--maps", default="")
    p.add_argument("--out-dir", required=True)
    p.add_argument("--jpeg-quality", type=int, default=82)
    p.add_argument("--step-mm", type=float, default=STEP_MM)
    return p.parse_args(argv)


def aabb(ob):
    pts = [ob.matrix_world @ v.co for v in ob.data.vertices]
    if not pts:
        return None
    xs = [p.x for p in pts]
    ys = [p.y for p in pts]
    zs = [p.z for p in pts]
    return min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)


def center(ob):
    a = aabb(ob)
    return Vector(((a[0] + a[1]) * 0.5, (a[2] + a[3]) * 0.5, (a[4] + a[5]) * 0.5))


def top_center(ob):
    a = aabb(ob)
    return Vector(((a[0] + a[1]) * 0.5, (a[2] + a[3]) * 0.5, a[5]))


def size_xyz(ob):
    a = aabb(ob)
    return (a[1] - a[0], a[3] - a[2], a[5] - a[4])


def select_only(obs):
    import bpy

    bpy.ops.object.select_all(action="DESELECT")
    for o in obs:
        o.select_set(True)
    if obs:
        bpy.context.view_layer.objects.active = obs[0]


def base_name(name: str) -> str:
    n = name.split(".")[0]
    if n.startswith("Hanger_"):
        n = n[len("Hanger_") :]
    return n


def classify_objects(meshes):
    """В wardrobe-5 OBJ: плечико и крючок — разные меши (в collection они слиты)."""
    hangers = []
    hooks = []
    garments = []
    for o in meshes:
        dx, dy, dz = size_xyz(o)
        verts = len(o.data.vertices)
        dims = sorted([dx, dy, dz])
        # Крючок: ~5×50×80, ~252 verts
        if 150 <= verts <= 400 and dims[0] < 12 and 40 <= dims[1] <= 90 and 60 <= dims[2] <= 100:
            hooks.append(o)
            continue
        # Плечико (дерево без крючка): ~15×105×387, ~570 verts
        # Не путать с тонкими планками (24 verts, ~10×12×358).
        if 400 <= verts <= 800 and dims[0] < 25 and 80 <= dims[1] <= 130 and 300 <= dims[2] <= 450:
            hangers.append(o)
            continue
        if max(dx, dy, dz) > 1500 and min(dx, dy) > 400:
            continue
        if max(dy, dz) >= 550 and verts >= 2000 and dims[0] > 40:
            garments.append(o)
    return hangers, hooks, garments


def _alive(ob) -> bool:
    """После join() меш-объект уничтожается — нельзя трогать .name у мёртвой ссылки."""
    try:
        _ = ob.name
        return True
    except ReferenceError:
        return False


def pair_hook_to_hanger(hanger, hooks, used_hooks: set):
    ht = top_center(hanger)
    ha = aabb(hanger)
    best = None
    best_d = 1e18
    # чистим мёртвые ссылки после предыдущих join
    live = []
    for hk in hooks:
        if not _alive(hk):
            continue
        live.append(hk)
        if hk.name in used_hooks:
            continue
        hc = center(hk)
        # крючок над перекладиной плечика
        if hc.z < ha[4] - 20:
            continue
        d = math.sqrt((ht.x - hc.x) ** 2 + (ht.y - hc.y) ** 2 + (ht.z - hc.z) ** 2)
        if d < best_d:
            best_d = d
            best = hk
    hooks[:] = live
    if best is None or best_d > 120:
        return None, best_d
    used_hooks.add(best.name)
    return best, best_d


def join_hanger_and_hook(hanger, hook, hooks_list):
    """Один меш Hanger_* как в collection (тело+крючок)."""
    import bpy

    hook_name = hook.name
    select_only([hanger, hook])
    bpy.context.view_layer.objects.active = hanger
    bpy.ops.object.join()
    # hook уничтожен join'ом — убрать из списка живых
    hooks_list[:] = [hk for hk in hooks_list if _alive(hk) and hk.name != hook_name]
    hanger.name = f"Hanger_{base_name(hanger.name)}"
    return hanger


def pair_all(garments, hangers, hooks):
    used_h = set()
    used_hk = set()
    pairs = []
    # hooks — мутабельный список: после join мёртвые убираем
    hooks = list(hooks)
    for g in sorted(garments, key=lambda o: center(o).x):
        gt = top_center(g)
        ga = aabb(g)
        best = None
        best_d = 1e18
        for h in hangers:
            if not _alive(h) or h.name in used_h:
                continue
            hc = center(h)
            d = math.sqrt((gt.x - hc.x) ** 2 + (gt.y - hc.y) ** 2 + 0.25 * (gt.z - hc.z) ** 2)
            in_xy = ga[0] - 80 <= hc.x <= ga[1] + 80 and ga[2] - 80 <= hc.y <= ga[3] + 80
            if in_xy and d < best_d:
                best_d = d
                best = h
        if best is None or best_d > 200:
            print("PAIR_SKIP", g.name, "d", round(best_d, 1))
            continue
        used_h.add(best.name)
        hook, hd = pair_hook_to_hanger(best, hooks, used_hk)
        if hook is None:
            print("HOOK_MISS", g.name, "+", best.name, "d", round(hd, 1))
        else:
            print("HOOK_OK", best.name, "+", hook.name, "d", round(hd, 1))
            best = join_hanger_and_hook(best, hook, hooks)
        _gx, gy, gz = size_xyz(g)
        h_mm = max(gy, gz)
        # после join высота плечика должна включать крючок (~+80 мм по Z)
        hx, hy, hz = size_xyz(best)
        print(
            "HANGER_SIZE",
            best.name,
            "mm",
            [round(hx, 1), round(hy, 1), round(hz, 1)],
            "verts",
            len(best.data.vertices),
        )
        pairs.append((g, best, h_mm))
        print("PAIR_OK", g.name, "+", best.name, "h_mm", round(h_mm, 1), "d", round(best_d, 1))
    return pairs


def bake_uv_scale_into_mesh(ob, scale: float) -> None:
    """Запечь тайлинг в UV — надёжнее, чем Mapping в glTF (KHR_texture_transform)."""
    if abs(float(scale) - 1.0) < 1e-3:
        return
    me = ob.data
    if not me.uv_layers:
        return
    uv = me.uv_layers.active
    if not uv:
        return
    s = float(scale)
    for d in uv.data:
        d.uv.x *= s
        d.uv.y *= s


def apply_textures(maps_dir: Path, garments, hangers, hooks):
    import bpy

    if not maps_dir.is_dir():
        print("NO_MAPS", maps_dir)
        return 0
    by_name = {p.name: p for p in maps_dir.iterdir() if p.is_file()}
    n = 0

    def set_tex(ob, tex_path: Path | None, solid_rgb=None, metallic=0.0):
        nonlocal n
        mat = bpy.data.materials.new(name=f"mat_{base_name(ob.name)}_{n}")
        mat.use_nodes = True
        nt = mat.node_tree
        nodes = nt.nodes
        links = nt.links
        for node in list(nodes):
            nodes.remove(node)
        out = nodes.new("ShaderNodeOutputMaterial")
        bsdf = nodes.new("ShaderNodeBsdfPrincipled")
        links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
        if tex_path and tex_path.is_file():
            img = bpy.data.images.load(str(tex_path), check_existing=True)
            if max(img.size) > 1024:
                img.scale(1024, 1024)
            try:
                img.colorspace_settings.name = "sRGB"
            except Exception:
                pass
            tex = nodes.new("ShaderNodeTexImage")
            tex.image = img
            tex.extension = "REPEAT"
            links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
            n += 1
        elif solid_rgb:
            bsdf.inputs["Base Color"].default_value = (*solid_rgb, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.45 if metallic > 0.2 else 0.65
        bsdf.inputs["Metallic"].default_value = float(metallic)
        ob.data.materials.clear()
        ob.data.materials.append(mat)

    for g in garments:
        key = base_name(g.name)
        fname = GARMENT_TEX.get(key)
        path = by_name.get(fname) if fname else None
        if path is None and fname:
            stem = fname.split(".")[0].lower()
            for fn, p in by_name.items():
                if stem in fn.lower():
                    path = p
                    break
        span0 = mesh_uv_span(g)
        uvs = uv_scale_for_object(g) if path else 1.0
        bake_uv_scale_into_mesh(g, uvs)
        set_tex(g, path, solid_rgb=(0.55, 0.55, 0.55) if path is None else None)
        print(
            "TEX",
            key,
            "->",
            path.name if path else "SOLID",
            "uv_span0",
            round(span0, 3),
            "bake_scale",
            round(uvs, 2),
            "uv_span1",
            round(mesh_uv_span(g), 3),
        )

    for h in hangers:
        set_tex(h, None, solid_rgb=(0.72, 0.55, 0.38))
    for hk in hooks:
        set_tex(hk, None, solid_rgb=(0.75, 0.75, 0.78), metallic=0.85)  # chrome hook
    print("TEX_ASSIGNED", n)
    return n


def orient_pair_hook_up(g, h):
    """Крючок (верх плечика) в origin; высота +Z. Как collection после FBX."""
    import bpy

    hook = top_center(h)
    for o in (g, h):
        o.location.x -= hook.x
        o.location.y -= hook.y
        o.location.z -= hook.z
    bpy.context.view_layer.update()
    select_only([g, h])
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    if abs(FACE_YAW_DEG) > 0.01:
        yaw = math.radians(FACE_YAW_DEG)
        for o in (g, h):
            o.rotation_euler[2] += yaw
        bpy.context.view_layer.update()
        select_only([g, h])
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        hook = top_center(h)
        for o in (g, h):
            o.location.x -= hook.x
            o.location.y -= hook.y
            o.location.z -= hook.z
        bpy.context.view_layer.update()
        select_only([g, h])
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def pack_and_export(bpy, pairs, out_path: Path, step_mm: float, jpeg_quality: int):
    if not pairs:
        raise SystemExit(f"No pairs for {out_path.name}")

    pair_groups = []
    for g, h, _hmm in pairs:
        bpy.ops.object.select_all(action="DESELECT")
        g.select_set(True)
        h.select_set(True)
        bpy.context.view_layer.objects.active = g
        bpy.ops.object.duplicate(linked=False)
        dups = [o for o in bpy.context.selected_objects if o.type == "MESH"]
        hd = next((o for o in dups if "hanger" in o.name.lower()), None)
        gd = next((o for o in dups if o is not hd), None)
        if hd is None or gd is None:
            gd = next((o for o in dups if len(o.data.vertices) > 2000), dups[0])
            hd = next((o for o in dups if o != gd), dups[-1])
        if "hanger" not in hd.name.lower():
            hd.name = f"Hanger_{base_name(hd.name)}"
        orient_pair_hook_up(gd, hd)
        pair_groups.append((gd, hd))

    for i, (gd, hd) in enumerate(pair_groups):
        hook = top_center(hd)
        target_x = i * step_mm
        dx = target_x - hook.x
        for o in (gd, hd):
            o.location.x += dx
        bpy.context.view_layer.update()
        print("PLACE", i, base_name(gd.name), "->", round(target_x, 1))

    all_kept = []
    for gd, hd in pair_groups:
        all_kept.extend([gd, hd])

    select_only(all_kept)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    pts = []
    for o in all_kept:
        pts.extend([o.matrix_world @ v.co for v in o.data.vertices])
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
    select_only(all_kept)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR", center="MEDIAN")
    select_only(all_kept)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # Как collection-clothing: mesh мм + node scale 0.001 (не apply).
    for o in all_kept:
        o.scale = (0.001, 0.001, 0.001)
    bpy.context.view_layer.update()

    out_path.parent.mkdir(parents=True, exist_ok=True)
    tmp = str(out_path) + ".tmp.glb"
    if os.path.isfile(tmp):
        os.remove(tmp)
    select_only(all_kept)
    bpy.ops.export_scene.gltf(
        filepath=tmp,
        export_format="GLB",
        use_selection=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_image_format="JPEG",
        export_jpeg_quality=int(jpeg_quality),
        export_apply=False,
    )
    if not os.path.isfile(tmp) or os.path.getsize(tmp) < 500:
        raise SystemExit(f"Export failed: {tmp}")
    if out_path.is_file():
        out_path.unlink()
    os.replace(tmp, out_path)
    print("OK", out_path, "bytes", out_path.stat().st_size, "pairs", len(pairs))

    for o in list(all_kept):
        bpy.data.objects.remove(o, do_unlink=True)


def main():
    import bpy

    args = parse_args(sys.argv)
    obj_path = Path(args.obj)
    if not obj_path.is_file():
        raise SystemExit(f"OBJ not found: {obj_path}")
    out_dir = Path(args.out_dir)
    maps = Path(args.maps) if args.maps else obj_path.parent.parent / "maps"

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.wm.obj_import(filepath=str(obj_path))

    meshes = [o for o in bpy.data.objects if o.type == "MESH" and o.data and o.data.vertices]
    hangers, hooks, garments = classify_objects(meshes)
    print("HANGERS", len(hangers), "HOOKS", len(hooks), "GARMENTS", len(garments))
    apply_textures(maps, garments, hangers, hooks)

    pairs = pair_all(garments, hangers, hooks)
    print("PAIRS_TOTAL", len(pairs))

    short = [(g, h, hm) for g, h, hm in pairs if hm <= SHORT_MAX_MM]
    longp = [(g, h, hm) for g, h, hm in pairs if hm >= LONG_MIN_MM]
    short.sort(key=lambda t: center(t[0]).x)
    longp.sort(key=lambda t: center(t[0]).x)
    print("SHORT", len(short), [round(t[2], 1) for t in short])
    print("LONG", len(longp), [round(t[2], 1) for t in longp])

    pack_and_export(bpy, short, out_dir / "rod-hang-short.glb", float(args.step_mm), int(args.jpeg_quality))
    pack_and_export(bpy, longp, out_dir / "rod-hang-long.glb", float(args.step_mm), int(args.jpeg_quality))

    desktop = Path.home() / "Desktop"
    for name in ("rod-hang-short.glb", "rod-hang-long.glb"):
        src = out_dir / name
        try:
            shutil.copy2(src, desktop / name)
            print("DESKTOP", desktop / name, src.stat().st_size)
        except Exception as e:
            print("DESKTOP_FAIL", name, e)
    print("DONE")


if __name__ == "__main__":
    main()
