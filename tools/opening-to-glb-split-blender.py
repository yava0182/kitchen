"""
Split a windows/doors FBX set into one GLB per mesh (drops helper spheres).
Uses the same material binding as opening-to-glb-blender.py.
"""
from __future__ import annotations

import argparse
import importlib.util
import os
import sys


def _load_core():
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "opening-to-glb-blender.py")
    spec = importlib.util.spec_from_file_location("opening_to_glb_blender", path)
    mod = importlib.util.module_from_spec(spec)
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
    p.add_argument("--prefix", default="opening")
    p.add_argument("--kind", choices=("window", "door"), default="window")
    p.add_argument("--maps", default="")
    p.add_argument("--decimate", type=float, default=0.0)
    p.add_argument("--jpeg-quality", type=int, default=82)
    p.add_argument("--keep-helpers", action="store_true")
    return p.parse_args(argv)


def classify(sx: float, sy: float, sz: float, tris: int, kind: str) -> str:
    width_mm = sx * 1000
    height_mm = sz * 1000
    depth_mm = sy * 1000
    if kind == "door":
        if width_mm < 500:
            return "narrow"
        if height_mm < 1800:
            return "short"
        return "door"
    if depth_mm > 300 and tris < 1500:
        return "niche-frame"
    if height_mm < 600 and width_mm > 1800:
        return "horizontal-wide"
    if height_mm < 600 and width_mm > 1000:
        return "horizontal-double"
    if width_mm < 800:
        return "single-small"
    if width_mm > 2400:
        return "triple"
    if width_mm > 1800 and height_mm > 1000:
        return "double"
    if width_mm < 1500 and height_mm > 1200:
        return "tall"
    return "window"


def main():
    import bpy
    import mathutils

    conv = _load_core()
    args = parse_args(sys.argv)
    inp = os.path.abspath(args.input)
    out_dir = os.path.abspath(args.out_dir)
    if not os.path.isfile(inp):
        raise SystemExit(f"Input not found: {inp}")
    os.makedirs(out_dir, exist_ok=True)

    maps_dir = conv.find_maps_dir(inp, args.maps)
    img_index = conv.collect_images(maps_dir)
    print("INPUT", inp)
    print("MAPS", maps_dir, "images", len(set(img_index.values())))
    print("OUT_DIR", out_dir)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    conv.import_model(inp)
    if not args.keep_helpers:
        conv.drop_helper_spheres()
    conv.relink_missing_images(img_index)
    conv.bind_opening_materials(img_index)
    conv.resize_images(2048)
    if args.decimate > 0:
        conv.decimate_meshes(args.decimate)

    rows = []
    for o in list(bpy.context.scene.objects):
        if o.type != "MESH":
            continue
        mw = o.matrix_world
        corners = [mw @ mathutils.Vector(c) for c in o.bound_box]
        xs = [c.x for c in corners]
        ys = [c.y for c in corners]
        zs = [c.z for c in corners]
        sx = max(xs) - min(xs)
        sy = max(ys) - min(ys)
        sz = max(zs) - min(zs)
        rows.append(
            {
                "name": o.name,
                "sx": sx,
                "sy": sy,
                "sz": sz,
                "zmax": max(zs),
                "tris": len(o.data.polygons),
            }
        )
    rows.sort(key=lambda r: -r["zmax"])
    prefix = (args.prefix or args.kind).strip("-_")
    print("PLAN", len(rows))
    for i, r in enumerate(rows, 1):
        label = classify(r["sx"], r["sy"], r["sz"], r["tris"], args.kind)
        print(f"  {i}. {r['name']} -> {label} {r['sx']*1000:.0f}x{r['sz']*1000:.0f}mm")

    for i, r in enumerate(rows, 1):
        o = bpy.data.objects.get(r["name"])
        if not o:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.duplicate()
        dup = bpy.context.view_layer.objects.active
        mw = dup.matrix_world
        corners = [mw @ mathutils.Vector(c) for c in dup.bound_box]
        xs = [c.x for c in corners]
        ys = [c.y for c in corners]
        zs = [c.z for c in corners]
        dup.location -= mathutils.Vector(
            ((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, min(zs))
        )
        bpy.context.view_layer.update()
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        label = classify(r["sx"], r["sy"], r["sz"], r["tris"], args.kind)
        base = f"{prefix}-{i:02d}-{label}"
        dup.name = base
        bpy.ops.object.select_all(action="DESELECT")
        dup.select_set(True)
        bpy.context.view_layer.objects.active = dup
        out = os.path.join(out_dir, base + ".glb")
        bpy.ops.export_scene.gltf(
            filepath=out,
            export_format="GLB",
            use_selection=True,
            export_apply=True,
            export_texcoords=True,
            export_normals=True,
            export_materials="EXPORT",
            export_image_format="JPEG",
            export_jpeg_quality=int(args.jpeg_quality),
        )
        print("OK", base, os.path.getsize(out))
        bpy.data.objects.remove(dup, do_unlink=True)

    print("DONE", len(rows))


if __name__ == "__main__":
    main()
