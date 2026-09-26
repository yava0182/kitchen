"""
Export exactly 5 hangers + paired garments from rod-hang-row.glb.

Usage:
  blender -b -P export-rod-hang-5-blender.py
"""
from __future__ import annotations

import math
import os
import shutil

import bpy
from mathutils import Vector

ROOT = r"D:\Configurator-Clodis-ThreeJS-24\Configurator-Clodis-ThreeJS-7"
SOURCE_GLB = os.path.join(
    ROOT,
    "public",
    "models",
    "lifestyle-props",
    "collection-clothing",
    "rod",
    "rod-hang-row.glb",
)
OUT_GLB = os.path.join(
    ROOT,
    "public",
    "models",
    "lifestyle-props",
    "collection-clothing",
    "rod",
    "rod-hang-5.glb",
)
DESKTOP_COPY = r"C:\Users\Admin\Desktop\rod-hang-5.glb"
JPEG_QUALITY = 82
HANGER_COUNT = 5


def _world_center(ob) -> Vector:
    pts = [ob.matrix_world @ v.co for v in ob.data.vertices]
    return sum(pts, Vector()) / max(len(pts), 1)


def _scene_max_dim() -> float:
    pts = []
    for ob in bpy.data.objects:
        if ob.type != "MESH" or not ob.data:
            continue
        for v in ob.data.vertices:
            pts.append(ob.matrix_world @ v.co)
    if not pts:
        return 1.0
    xs = [p.x for p in pts]
    ys = [p.y for p in pts]
    zs = [p.z for p in pts]
    return max(max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs))


def _is_hanger(name: str) -> bool:
    return "hanger" in (name or "").lower()


def _select_only(obs) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    for ob in obs:
        ob.select_set(True)
    if obs:
        bpy.context.view_layer.objects.active = obs[0]


def _ground_and_origin(obs) -> None:
    """Pivot = top-center of AABB (hook), min Z → 0."""
    if not obs:
        return
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
    dz = -zmin
    for ob in obs:
        ob.location.z += dz
    bpy.context.view_layer.update()
    cursor = bpy.context.scene.cursor
    cursor.location = Vector((cx, cy, zmax + dz))
    _select_only(obs)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR", center="MEDIAN")


def _export_selection(path: str) -> None:
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
        export_jpeg_quality=JPEG_QUALITY,
        export_apply=True,
    )
    if not os.path.isfile(tmp) or os.path.getsize(tmp) < 500:
        raise SystemExit(f"Export failed: {tmp}")
    if os.path.isfile(path):
        os.remove(path)
    os.replace(tmp, path)


def _pair_distance(hanger, garment) -> float:
    hc = _world_center(hanger)
    gc = _world_center(garment)
    return math.sqrt((gc.x - hc.x) ** 2 + (gc.z - hc.z) ** 2)


def main() -> None:
    if not os.path.isfile(SOURCE_GLB):
        raise SystemExit(f"Source GLB not found: {SOURCE_GLB}")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=SOURCE_GLB)

    meshes = [ob for ob in bpy.data.objects if ob.type == "MESH" and ob.data]
    hangers = [ob for ob in meshes if _is_hanger(ob.name)]
    garments = [ob for ob in meshes if not _is_hanger(ob.name)]

    print("IMPORT", "hangers", len(hangers), "garments", len(garments))

    max_dim = _scene_max_dim()
    pair_threshold = 600.0 if max_dim > 10.0 else 0.6
    print("UNITS", "max_dim", round(max_dim, 3), "threshold", pair_threshold)

    hangers.sort(key=lambda o: _world_center(o).x, reverse=True)
    selected_hangers = hangers[:HANGER_COUNT]
    if len(selected_hangers) < HANGER_COUNT:
        raise SystemExit(f"Only {len(selected_hangers)} hangers found, need {HANGER_COUNT}")

    print(
        "SELECTED_HANGERS",
        [h.name for h in selected_hangers],
    )

    unused_garments = list(garments)
    keep = []
    pairs = []

    for hanger in selected_hangers:
        best = None
        best_d = 1e18
        for g in unused_garments:
            d = _pair_distance(hanger, g)
            if d < best_d:
                best_d = d
                best = g
        keep.append(hanger)
        if best is not None and best_d <= pair_threshold:
            keep.append(best)
            unused_garments.remove(best)
            pairs.append((hanger.name, best.name, round(best_d, 3)))
            print("PAIR", hanger.name, "+", best.name, "d", round(best_d, 3))
        else:
            pairs.append((hanger.name, None, round(best_d, 3)))
            print("PAIR", hanger.name, "+ NONE", "d", round(best_d, 3))

    keep_names = {ob.name for ob in keep}
    for ob in list(bpy.data.objects):
        if ob.type == "MESH" and ob.name not in keep_names:
            bpy.data.objects.remove(ob, do_unlink=True)

    print("KEEP", sorted(keep_names))

    _ground_and_origin(keep)
    _select_only(keep)
    _export_selection(OUT_GLB)
    sz = os.path.getsize(OUT_GLB)
    print("OK", OUT_GLB, "bytes", sz)

    try:
        shutil.copy2(OUT_GLB, DESKTOP_COPY)
        print("COPY", DESKTOP_COPY, "bytes", os.path.getsize(DESKTOP_COPY))
    except Exception as e:
        print("COPY_FAIL", DESKTOP_COPY, e)

    print("DONE")


if __name__ == "__main__":
    main()
