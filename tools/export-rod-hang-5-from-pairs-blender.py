"""
Собрать rod-hang-5.glb из 5 пар: сначала одежду на плечико (XZ), потом шаг по центру крючков.
"""
from __future__ import annotations

import os
import shutil
from pathlib import Path

from mathutils import Vector

PAIR_IDS = [
    "rod-jean_jacket",
    "rod-shirt01",
    "rod-shirt03",
    "rod-blouse_black002",
    "rod-sweater06",
]
# Шаг между крючками (м). ~140 мм как на штанге.
HOOK_STEP_M = 0.14
# Доворот всей пары (не нужен, если 0).
FIXED_YAW_DEG = 0.0
# Только плечики → как одежда на скрине (~¾ ракурс). Отрицательный = по часовой сверху.
HANGER_YAW_TO_CLOTHES_DEG = 0.0


def _is_hanger(name: str) -> bool:
    return "hanger" in (name or "").lower()


def _world_aabb(obs):
    pts = []
    for o in obs:
        if o.type != "MESH" or not o.data:
            continue
        for v in o.data.vertices:
            pts.append(o.matrix_world @ v.co)
    if not pts:
        return None
    xs = [p.x for p in pts]
    ys = [p.y for p in pts]
    zs = [p.z for p in pts]
    return min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)


def _world_center(ob) -> Vector:
    pts = [ob.matrix_world @ v.co for v in ob.data.vertices]
    return sum(pts, Vector()) / max(len(pts), 1)


def _select_only(obs):
    import bpy

    bpy.ops.object.select_all(action="DESELECT")
    for o in obs:
        o.select_set(True)
    if obs:
        bpy.context.view_layer.objects.active = obs[0]


def _align_garments_onto_hangers(meshes):
    """Сдвинуть garment к центру hanger по X/Y (горизонт); верх к перекладине по Z (Blender Z-up)."""
    import bpy

    hangers = [o for o in meshes if _is_hanger(o.name)]
    garments = [o for o in meshes if not _is_hanger(o.name)]
    if not hangers or not garments:
        return
    h_aabb = _world_aabb(hangers)
    g_aabb = _world_aabb(garments)
    if not h_aabb or not g_aabb:
        return
    hx0, hx1, hy0, hy1, hz0, hz1 = h_aabb
    gx0, gx1, gy0, gy1, gz0, gz1 = g_aabb
    hcx = (hx0 + hx1) * 0.5
    hcy = (hy0 + hy1) * 0.5
    gcx = (gx0 + gx1) * 0.5
    gcy = (gy0 + gy1) * 0.5
    dx = hcx - gcx
    dy = hcy - gcy
    h_h = max(1e-6, hz1 - hz0)
    bar_z = hz1 - min(0.09, h_h * 0.38)
    dz = bar_z - gz1
    for g in garments:
        g.location.x += dx
        g.location.y += dy
        g.location.z += dz
    bpy.context.view_layer.update()
    print(
        "ALIGN",
        "dx",
        round(dx, 4),
        "dy",
        round(dy, 4),
        "dz",
        round(dz, 4),
        "hangers",
        [h.name for h in hangers],
        "garments",
        [g.name for g in garments],
    )


def _principal_yaw_xy(meshes) -> float:
    """Угол главной оси в плоскости XY (рад), по вершинам."""
    import math

    pts = []
    for o in meshes:
        if o.type != "MESH" or not o.data:
            continue
        for v in o.data.vertices:
            p = o.matrix_world @ v.co
            pts.append((p.x, p.y))
    if len(pts) < 8:
        return 0.0
    mx = sum(p[0] for p in pts) / len(pts)
    my = sum(p[1] for p in pts) / len(pts)
    sxx = syy = sxy = 0.0
    for x, y in pts:
        dx, dy = x - mx, y - my
        sxx += dx * dx
        syy += dy * dy
        sxy += dx * dy
    return 0.5 * math.atan2(2.0 * sxy, sxx - syy)


def _rotate_meshes_yaw_z(meshes, deg: float, pivot: Vector):
    import math
    import bpy
    from mathutils import Matrix

    if abs(deg) < 0.05 or not meshes:
        return
    R = Matrix.Rotation(math.radians(deg), 4, "Z")
    M = Matrix.Translation(pivot) @ R @ Matrix.Translation(-pivot)
    for o in meshes:
        o.matrix_world = M @ o.matrix_world
    bpy.context.view_layer.update()


def _match_hanger_yaw_to_garment(meshes):
    """Развернуть только плечики под тот же yaw, что у одежды (одежду не крутим)."""
    import math

    hangers = [o for o in meshes if _is_hanger(o.name)]
    garments = [o for o in meshes if not _is_hanger(o.name)]
    if not hangers or not garments:
        return
    gy = _principal_yaw_xy(garments)
    hy = _principal_yaw_xy(hangers)
    delta_deg = math.degrees(gy - hy)
    # нормализуем в [-90, 90]: ось плечика двусторонняя
    while delta_deg > 90:
        delta_deg -= 180
    while delta_deg < -90:
        delta_deg += 180
    aabb = _world_aabb(hangers)
    if not aabb:
        return
    pivot = Vector(((aabb[0] + aabb[1]) * 0.5, (aabb[2] + aabb[3]) * 0.5, aabb[5]))
    _rotate_meshes_yaw_z(hangers, delta_deg, pivot)
    print(
        "YAW_MATCH",
        "garment",
        round(math.degrees(gy), 1),
        "hanger_was",
        round(math.degrees(hy), 1),
        "delta",
        round(delta_deg, 1),
        [h.name for h in hangers],
    )


def _apply_fixed_yaw(meshes, deg: float):
    hangers = [o for o in meshes if _is_hanger(o.name)]
    aabb = _world_aabb(hangers if hangers else meshes)
    if not aabb:
        return
    pivot = Vector(((aabb[0] + aabb[1]) * 0.5, (aabb[2] + aabb[3]) * 0.5, aabb[5]))
    _rotate_meshes_yaw_z(meshes, deg, pivot)
    print("YAW_FIXED", deg, "deg")


def _hook_x(meshes) -> float:
    hangers = [o for o in meshes if _is_hanger(o.name)]
    if not hangers:
        aabb = _world_aabb(meshes)
        return (aabb[0] + aabb[1]) * 0.5 if aabb else 0.0
    aabb = _world_aabb(hangers)
    return (aabb[0] + aabb[1]) * 0.5


def main():
    import bpy

    repo = Path(__file__).resolve().parents[1]
    rod_dir = repo / "public" / "models" / "lifestyle-props" / "collection-clothing" / "rod"
    out = rod_dir / "rod-hang-5.glb"
    desktop = Path.home() / "Desktop" / "rod-hang-5.glb"

    bpy.ops.wm.read_factory_settings(use_empty=True)

    groups = []  # list of mesh lists
    for uid in PAIR_IDS:
        path = rod_dir / f"{uid}.glb"
        if not path.is_file():
            raise SystemExit(f"Missing: {path}")
        before = set(o.name for o in bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=str(path))
        imported = [
            o
            for o in bpy.data.objects
            if o.name not in before and o.type == "MESH" and o.data
        ]
        if not imported:
            raise SystemExit(f"No meshes from {uid}")
        _align_garments_onto_hangers(imported)
        # Плечики в тот же ракурс, что одежда (одежду не крутим).
        if abs(HANGER_YAW_TO_CLOTHES_DEG) > 0.01:
            hangers = [o for o in imported if _is_hanger(o.name)]
            aabb = _world_aabb(hangers)
            if aabb:
                pivot = Vector(
                    ((aabb[0] + aabb[1]) * 0.5, (aabb[2] + aabb[3]) * 0.5, aabb[5])
                )
                _rotate_meshes_yaw_z(hangers, HANGER_YAW_TO_CLOTHES_DEG, pivot)
                print("YAW_HANGER", HANGER_YAW_TO_CLOTHES_DEG, "deg", [h.name for h in hangers])
        if abs(FIXED_YAW_DEG) > 0.01:
            _apply_fixed_yaw(imported, FIXED_YAW_DEG)
        # apply transforms so location bake into mesh for clean layout
        _select_only(imported)
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        groups.append((uid, imported))
        print("PAIR", uid, "meshes", [o.name for o in imported])

    # Расставить по X: крючки на 0, step, 2*step...
    for i, (uid, meshes) in enumerate(groups):
        hx = _hook_x(meshes)
        target = i * HOOK_STEP_M
        dx = target - hx
        for o in meshes:
            o.location.x += dx
        bpy.context.view_layer.update()
        print("PLACE", uid, "hook", round(hx, 4), "->", round(target, 4))

    all_kept = []
    for _, meshes in groups:
        all_kept.extend(meshes)

    _select_only(all_kept)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    aabb = _world_aabb(all_kept)
    xmin, xmax, ymin, ymax, zmin, zmax = aabb
    cx = (xmin + xmax) * 0.5
    cy = (ymin + ymax) * 0.5
    for o in all_kept:
        o.location.z -= zmin
    bpy.context.view_layer.update()
    bpy.context.scene.cursor.location = Vector((cx, cy, zmax - zmin))
    _select_only(all_kept)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR", center="MEDIAN")

    keep_names = set(o.name for o in all_kept)
    for o in list(bpy.data.objects):
        if o.type == "MESH" and o.name not in keep_names:
            bpy.data.objects.remove(o, do_unlink=True)

    kept = [o for o in bpy.data.objects if o.type == "MESH"]
    print("KEEP", [o.name for o in kept])

    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = str(out) + ".tmp.glb"
    if os.path.isfile(tmp):
        os.remove(tmp)
    _select_only(kept)
    bpy.ops.export_scene.gltf(
        filepath=tmp,
        export_format="GLB",
        use_selection=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_image_format="JPEG",
        export_jpeg_quality=82,
        export_apply=True,
    )
    if not os.path.isfile(tmp) or os.path.getsize(tmp) < 500:
        raise SystemExit(f"Export failed: {tmp}")
    if out.is_file():
        out.unlink()
    os.replace(tmp, out)
    print("OK", out, "bytes", out.stat().st_size)
    try:
        shutil.copy2(out, desktop)
        print("DESKTOP", desktop, "bytes", desktop.stat().st_size)
    except Exception as e:
        print("DESKTOP_FAIL", e)
    print("DONE")


if __name__ == "__main__":
    main()
