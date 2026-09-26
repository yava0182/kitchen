"""
wardrobe-5 OBJ → GLB на полку.

Стопки: в сцене несколько мешей друг на друге (один wire-цвет) → один GLB-кластер.
Цвет: albedo-карта × wire RGB (без tint карты выглядят «белыми полотенцами»).

Usage:
  blender -b -P export-wardrobe5-shelf-blender.py -- ^
    --obj ".../set_14__vray.obj" --maps ".../maps" --out-dir ".../wardrobe-5/shelf"
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

from mathutils import Vector

# Кандидаты в стопки (плоские «свёртки»). Кластеризация — по XY + зазору Z.
# 011/012 в паке — не сумки, а несколько свёртков с одним wire (иначе «пустота» в галерее).
STACK_CANDIDATES = {
    "set_14_025",
    "set_14_026",
    "set_14_037",
    "set_14_038",
    "set_14_039",
    "set_14_042",
    "set_14_043",
    "set_14_062",
    "set_14_079",
    "set_14_080",
    "set_14_081",
    "set_14_106",
    "set_14_011",
    "set_14_012",
}

# Одиночные предметы
SINGLE_ITEMS = {
    "set_14_040": "hat",
    "set_14_044": "bag",
    "set_14_045": "bag",
    "set_14_052": "bag",
    "set_14_041": "box",
    "set_14_082": "box",
}

# Мягкая палитра как на рефе zeelproject (не neon wire_* из OBJ).
# Каждый ряд = одна стопка; внутри — слои снизу вверх.
STACK_PALETTES = [
    [  # set_14_025 кластер (низ) — пыльная роза / крем / серый / уголь
        (0.55, 0.42, 0.45),
        (0.82, 0.78, 0.72),
        (0.62, 0.60, 0.58),
        (0.28, 0.28, 0.30),
    ],
    [  # 026+012+037 — розовый / белый / серый / пыльная роза
        (0.78, 0.62, 0.64),
        (0.88, 0.86, 0.82),
        (0.56, 0.40, 0.38),
        (0.70, 0.66, 0.62),
    ],
    [  # 011+106 — беж / крем / светлый
        (0.93, 0.92, 0.90),
        (0.72, 0.66, 0.55),
        (0.82, 0.78, 0.72),
        (0.88, 0.86, 0.82),
    ],
    [  # 042+043 — светлые
        (0.86, 0.84, 0.80),
        (0.70, 0.68, 0.66),
    ],
    [  # 038+039+062 — верх, светлые + лёгкий цвет
        (0.80, 0.76, 0.70),
        (0.74, 0.62, 0.60),
        (0.58, 0.56, 0.54),
    ],
]
# Ткани из maps (цикл по слоям). Цвет даёт палитра × карта (печётся в JPEG).
STACK_TEX = [
    "set_14_Venice - Watercolor.jpg",  # тёмный — слой контраста
    "set_14_Poloski.jpg",
    "set_14_Tkan'_Uzor_1.jpg",
    "set_14_EMILY.jpg",
    "set_14_15Loft.jpg",
    "set_14_Tkan'_Uzor_2.jpg",
    "set_14_2.jpg",
    "set_14_Contemporary 011.jpg",
    "set_14_Pled_1.jpg",
]
KIND_TEX = {
    "hat": "set_14_dalmation-fur.jpg",
    "bag": "set_14_leather_bamp.jpg",
    "box": "set_14_15Loft.jpg",
}
# wire_* в OBJ — служебные цвета Max, не albedo. Сумки/шляпа — только мягкий tint под реф.
KIND_TINT = {
    "hat": (0.78, 0.68, 0.48),
}
# Реф zeelproject: белая сумка / пыльная роза — НЕ neon wire.
BAG_TINT = {
    "set_14_011": (0.93, 0.92, 0.90),  # белая кожа
    "set_14_012": (0.56, 0.40, 0.38),  # dusty rose
    "set_14_044": (0.48, 0.36, 0.34),
    "set_14_045": (0.50, 0.42, 0.38),
    "set_14_052": (0.52, 0.45, 0.40),
}

XY_CLUSTER_MM = 55.0
Z_GAP_MAX_MM = 40.0  # было 25 — 012 стыковался с 026/037 с запасом
TARGET_UV_SPAN = 2.2  # было 4 — слишком мелко / «мыло»
STACK_LAYER_GAP_MM = 1.5  # после посадки — без воздушной «пустоты» между слоями


def separate_loose_parts(ob) -> list:
    """Один mesh с несколькими островами → отдельные объекты (иначе «парящие» слои)."""
    import bpy
    import bmesh

    if not ob or ob.type != "MESH":
        return []
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    # count islands
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bm.verts.ensure_lookup_table()
    seen = set()
    n_islands = 0
    for v in bm.verts:
        if v.index in seen:
            continue
        n_islands += 1
        stack = [v]
        while stack:
            x = stack.pop()
            if x.index in seen:
                continue
            seen.add(x.index)
            for e in x.link_edges:
                ov = e.other_vert(x)
                if ov.index not in seen:
                    stack.append(ov)
    bm.free()
    if n_islands <= 1:
        return [ob]
    # Separate loose → selected become pieces; original may remain empty
    bpy.ops.mesh.separate(type="LOOSE")
    parts = [o for o in bpy.context.selected_objects if o.type == "MESH"]
    if not parts:
        parts = [ob]
    print("SPLIT", base_name(ob.name), "islands", n_islands, "->", len(parts))
    return parts


def pack_stack_layers_tight(obs: list, gap_mm: float = STACK_LAYER_GAP_MM):
    """Сдвинуть слои по Z так, чтобы каждый сидел на предыдущем (без воздушного зазора)."""
    import bpy

    if len(obs) < 2:
        return
    ordered = sorted(obs, key=lambda o: aabb(o)[4])
    gap = float(gap_mm)
    for i in range(1, len(ordered)):
        prev = aabb(ordered[i - 1])
        cur = aabb(ordered[i])
        want_zmin = prev[5] + gap
        dz = want_zmin - cur[4]
        if abs(dz) < 0.05:
            continue
        ordered[i].location.z += dz
    bpy.context.view_layer.update()
    for o in ordered:
        bpy.ops.object.select_all(action="DESELECT")
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)


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
    return p.parse_args(argv)


def base_name(name: str) -> str:
    return name.split(".")[0]


def aabb(ob):
    pts = [ob.matrix_world @ v.co for v in ob.data.vertices]
    xs = [p.x for p in pts]
    ys = [p.y for p in pts]
    zs = [p.z for p in pts]
    return min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)


def mesh_uv_span(ob) -> float:
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
    span = mesh_uv_span(ob)
    if span >= TARGET_UV_SPAN * 0.85:
        return 1.0
    return float(TARGET_UV_SPAN / span)


def bake_uv_scale_into_mesh(ob, scale: float) -> None:
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


def wire_rgb_from_mat(mat_name: str):
    m = re.match(r"wire_(\d{3})(\d{3})(\d{3})$", str(mat_name or ""), re.I)
    if not m:
        return (0.55, 0.55, 0.55)
    return (int(m.group(1)) / 255.0, int(m.group(2)) / 255.0, int(m.group(3)) / 255.0)


def mat_rgb_for_object(ob):
    if not ob.data.materials:
        return (0.55, 0.55, 0.55)
    mat = ob.data.materials[0]
    name = mat.name if mat else ""
    return wire_rgb_from_mat(name.split(".")[0])


def boost_tint(rgb):
    """Чуть поднимаем насыщенность, без ухода в кислотный wire."""
    r, g, b = [max(0.0, min(1.0, float(c))) for c in rgb]
    mid = (r + g + b) / 3.0
    sat = 1.15
    r = mid + (r - mid) * sat
    g = mid + (g - mid) * sat
    b = mid + (b - mid) * sat
    return (min(1.0, r), min(1.0, g), min(1.0, b))


def resolve_tex(kind: str, maps_dir: Path, stack_i: list) -> Path | None:
    if not maps_dir or not maps_dir.is_dir():
        return None
    by_name = {p.name: p for p in maps_dir.iterdir() if p.is_file()}
    if kind == "stack":
        fname = STACK_TEX[stack_i[0] % len(STACK_TEX)]
        stack_i[0] += 1
    else:
        fname = KIND_TEX.get(kind)
    if not fname:
        return None
    if fname in by_name:
        return by_name[fname]
    stem = fname.split(".")[0].lower()
    for fn, p in by_name.items():
        if stem in fn.lower():
            return p
    return None


def set_textured(ob, tex_path: Path | None, rgb, jpeg_quality: int = 82):
    """Карта без tint-ноды (glTF её теряет). Цвет допишем baseColorFactor после экспорта."""
    import bpy

    mat = bpy.data.materials.new(name=f"mat_{base_name(ob.name)}")
    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links
    for node in list(nodes):
        nodes.remove(node)
    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    bsdf.inputs["Roughness"].default_value = 0.72
    tint = boost_tint(rgb)
    # сохраним tint на объекте — patch_glb прочитает порядок мешей
    ob["cld_tint"] = [float(tint[0]), float(tint[1]), float(tint[2])]
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
        uvs = uv_scale_for_object(ob)
        bake_uv_scale_into_mesh(ob, uvs)
        print("TEX", base_name(ob.name), "->", tex_path.name, "tint", [round(c, 3) for c in tint], "uv", round(uvs, 2))
    else:
        bsdf.inputs["Base Color"].default_value = (*tint, 1.0)
        print("TEX", base_name(ob.name), "-> SOLID", [round(c, 3) for c in tint])
    ob.data.materials.clear()
    ob.data.materials.append(mat)


def patch_glb_base_color_factors(out_path: Path, tints: list[tuple]):
    """baseColorFactor × texture в рантайме Three/галерее — без Pillow."""
    import json
    import struct

    data = bytearray(out_path.read_bytes())
    if data[0:4] != b"glTF":
        raise RuntimeError(f"not glb: {out_path}")
    # chunks
    o = 12
    json_off = None
    json_len = None
    while o + 8 <= len(data):
        clen, ctype = struct.unpack_from("<I4s", data, o)
        if ctype == b"JSON":
            json_off = o + 8
            json_len = clen
            break
        o += 8 + clen
    if json_off is None:
        raise RuntimeError("no JSON chunk")
    raw = bytes(data[json_off : json_off + json_len]).rstrip(b" ")
    j = json.loads(raw)
    mats = j.get("materials") or []
    for i, mat in enumerate(mats):
        if i >= len(tints):
            break
        r, g, b = tints[i]
        pbr = mat.setdefault("pbrMetallicRoughness", {})
        pbr["baseColorFactor"] = [round(float(r), 4), round(float(g), 4), round(float(b), 4), 1.0]
    new_json = json.dumps(j, separators=(",", ":")).encode("utf-8")
    pad = (4 - (len(new_json) % 4)) % 4
    new_json = new_json + (b" " * pad)
    # rebuild glb
    bin_chunk = None
    o = 12
    while o + 8 <= len(data):
        clen, ctype = struct.unpack_from("<I4s", data, o)
        payload = bytes(data[o + 8 : o + 8 + clen])
        if ctype == b"BIN\x00":
            bin_chunk = payload
        o += 8 + clen
    out = bytearray()
    out += struct.pack("<4sII", b"glTF", 2, 0)  # length later
    out += struct.pack("<I4s", len(new_json), b"JSON")
    out += new_json
    if bin_chunk is not None:
        pad_b = (4 - (len(bin_chunk) % 4)) % 4
        bin_chunk = bin_chunk + (b"\x00" * pad_b)
        out += struct.pack("<I4s", len(bin_chunk), b"BIN\x00")
        out += bin_chunk
    struct.pack_into("<I", out, 8, len(out))
    out_path.write_bytes(out)
    print("PATCH", out_path.name, "factors", len(tints))


def cluster_stacks(by_name: dict) -> list[list]:
    """Группы мешей одной стопки: близко по XY и почти стык по Z.
    Сначала режем multi-island (011/012) на отдельные слои.
    """
    import bpy

    rows = []
    for name in STACK_CANDIDATES:
        ob = by_name.get(name)
        if not ob:
            print("MISS stack", name)
            continue
        parts = separate_loose_parts(ob)
        for pi, part in enumerate(parts):
            a = aabb(part)
            rows.append(
                {
                    "name": name if len(parts) == 1 else f"{name}#{pi}",
                    "ob": part,
                    "cx": (a[0] + a[1]) * 0.5,
                    "cy": (a[2] + a[3]) * 0.5,
                    "zmin": a[4],
                    "zmax": a[5],
                }
            )
    if not rows:
        return []
    parent = list(range(len(rows)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    def union(i, j):
        ri, rj = find(i), find(j)
        if ri != rj:
            parent[rj] = ri

    for i in range(len(rows)):
        for j in range(i + 1, len(rows)):
            a, b = rows[i], rows[j]
            dxy = ((a["cx"] - b["cx"]) ** 2 + (a["cy"] - b["cy"]) ** 2) ** 0.5
            if dxy > XY_CLUSTER_MM:
                continue
            gap = max(0.0, max(a["zmin"], b["zmin"]) - min(a["zmax"], b["zmax"]))
            if gap <= Z_GAP_MAX_MM:
                union(i, j)

    groups: dict[int, list] = {}
    for i, r in enumerate(rows):
        groups.setdefault(find(i), []).append(r)
    out = []
    for items in groups.values():
        items = sorted(items, key=lambda r: r["zmin"])
        out.append(items)
    out.sort(key=lambda g: g[0]["zmin"])
    return out


def sit_group_on_floor_mm(obs: list, pack_layers: bool = False):
    """Низ группы на Z=0, центр XY=0; scale 0.001; origin у низа."""
    import bpy

    bpy.context.view_layer.update()
    boxes = [aabb(o) for o in obs]
    xmin = min(b[0] for b in boxes)
    xmax = max(b[1] for b in boxes)
    ymin = min(b[2] for b in boxes)
    ymax = max(b[3] for b in boxes)
    zmin = min(b[4] for b in boxes)
    zmax = max(b[5] for b in boxes)
    cx = (xmin + xmax) * 0.5
    cy = (ymin + ymax) * 0.5
    for o in obs:
        o.location.x -= cx
        o.location.y -= cy
        o.location.z -= zmin
    bpy.context.view_layer.update()

    for o in obs:
        bpy.ops.object.select_all(action="DESELECT")
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    if pack_layers:
        # Ещё в мм (до scale 0.001) — схлопнуть воздушные зазоры между слоями.
        pack_stack_layers_tight(obs, gap_mm=STACK_LAYER_GAP_MM)

    boxes = [aabb(o) for o in obs]
    xmin = min(b[0] for b in boxes)
    xmax = max(b[1] for b in boxes)
    ymin = min(b[2] for b in boxes)
    ymax = max(b[3] for b in boxes)
    zmin = min(b[4] for b in boxes)
    zmax = max(b[5] for b in boxes)
    cx = (xmin + xmax) * 0.5
    cy = (ymin + ymax) * 0.5
    bpy.context.scene.cursor.location = Vector((cx, cy, zmin))
    for o in obs:
        bpy.ops.object.select_all(action="DESELECT")
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.origin_set(type="ORIGIN_CURSOR", center="MEDIAN")
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    boxes = [aabb(o) for o in obs]
    size_mm = {
        "x": round(max(b[1] for b in boxes) - min(b[0] for b in boxes), 1),
        "y": round(max(b[5] for b in boxes) - min(b[4] for b in boxes), 1),
        "z": round(max(b[3] for b in boxes) - min(b[2] for b in boxes), 1),
    }
    for o in obs:
        o.scale = (0.001, 0.001, 0.001)
    bpy.context.view_layer.update()
    return size_mm


def export_selection(obs: list, out_path: Path, jpeg_quality: int):
    import bpy

    out_path.parent.mkdir(parents=True, exist_ok=True)
    tmp = str(out_path) + ".tmp.glb"
    if os.path.isfile(tmp):
        os.remove(tmp)
    bpy.ops.object.select_all(action="DESELECT")
    for o in obs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]
    bpy.ops.export_scene.gltf(
        filepath=tmp,
        use_selection=True,
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        export_image_format="JPEG",
        export_jpeg_quality=int(jpeg_quality),
    )
    if out_path.is_file():
        out_path.unlink()
    os.replace(tmp, out_path)


def duplicate_obs(srcs: list):
    import bpy

    dups = []
    for src in srcs:
        bpy.ops.object.select_all(action="DESELECT")
        src.select_set(True)
        bpy.context.view_layer.objects.active = src
        bpy.ops.object.duplicate(linked=False)
        dup = bpy.context.selected_objects[0]
        dup.name = f"Shelf_{base_name(src.name)}"
        dups.append(dup)
    return dups


def main():
    import bpy

    args = parse_args(sys.argv)
    obj_path = Path(args.obj)
    out_dir = Path(args.out_dir)
    maps_dir = Path(args.maps) if args.maps else (obj_path.parent.parent / "maps")
    if not obj_path.is_file():
        raise SystemExit(f"OBJ missing: {obj_path}")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.wm.obj_import(filepath=str(obj_path), forward_axis="NEGATIVE_Z", up_axis="Y")

    by_name = {}
    for o in bpy.data.objects:
        if o.type != "MESH":
            continue
        by_name[base_name(o.name)] = o

    meta = []
    stack_i = [0]
    out_dir.mkdir(parents=True, exist_ok=True)

    # --- стопки кластерами ---
    clusters = cluster_stacks(by_name)
    for gi, items in enumerate(clusters):
        names = [it["name"] for it in items]
        srcs = [it["ob"] for it in items]
        dups = duplicate_obs(srcs)
        palette = STACK_PALETTES[gi % len(STACK_PALETTES)]
        tints = []
        for li, dup in enumerate(dups):
            rgb = palette[li % len(palette)]
            tex = resolve_tex("stack", maps_dir, stack_i)
            set_textured(dup, tex, rgb, args.jpeg_quality)
            tints.append(tuple(dup["cld_tint"]))
        size = sit_group_on_floor_mm(dups, pack_layers=True)
        lead = names[0].split("#")[0]
        out = out_dir / f"w5-shelf-stack-{lead}.glb"
        export_selection(dups, out, args.jpeg_quality)
        patch_glb_base_color_factors(out, tints)
        for dup in dups:
            bpy.data.objects.remove(dup, do_unlink=True)
        row = {
            "id": f"w5-stack-{lead}",
            "kind": "stack",
            "model": f"/models/lifestyle-props/wardrobe-5/shelf/{out.name}",
            "file": out.name,
            "layers": names,
            "layer_count": len(names),
            "preview_ref_mm": {
                "x": max(size["x"], 120),
                "y": max(size["y"], 40),
                "z": max(size["z"], 80),
            },
            "rgb": [round(c, 3) for c in boost_tint(palette[0])],
        }
        meta.append(row)
        print("OK STACK", names, "->", out.name, "h_mm", size["y"])

    # --- одиночные ---
    for name, kind in SINGLE_ITEMS.items():
        src = by_name.get(name)
        if not src:
            print("MISS", name)
            continue
        dups = duplicate_obs([src])
        dup = dups[0]
        if kind == "bag":
            rgb = BAG_TINT.get(name) or (0.55, 0.45, 0.40)
        else:
            rgb = KIND_TINT.get(kind) or mat_rgb_for_object(src)
        tex = resolve_tex(kind, maps_dir, stack_i)
        set_textured(dup, tex, rgb, args.jpeg_quality)
        tint = tuple(dup["cld_tint"])
        # для сумок не разгонять sat через boost_tint — иначе снова «кислота»
        if kind == "bag":
            tint = tuple(float(c) for c in rgb)
            dup["cld_tint"] = list(tint)
        size = sit_group_on_floor_mm([dup])
        out = out_dir / f"w5-shelf-{kind}-{name}.glb"
        export_selection([dup], out, args.jpeg_quality)
        patch_glb_base_color_factors(out, [tint])
        bpy.data.objects.remove(dup, do_unlink=True)
        row = {
            "id": f"w5-{kind}-{name}",
            "kind": kind,
            "model": f"/models/lifestyle-props/wardrobe-5/shelf/{out.name}",
            "file": out.name,
            "layers": [name],
            "layer_count": 1,
            "preview_ref_mm": {
                "x": max(size["x"], 120),
                "y": max(size["y"], 40),
                "z": max(size["z"], 80),
            },
            "rgb": [round(c, 3) for c in boost_tint(rgb)],
        }
        meta.append(row)
        print("OK", name, kind, out.name, "size_mm", size)

    side = out_dir / "w5-shelf-manifest.json"
    side.write_text(json.dumps({"count": len(meta), "items": meta}, indent=2), encoding="utf-8")
    print("DONE", len(meta), "->", out_dir)


if __name__ == "__main__":
    main()
