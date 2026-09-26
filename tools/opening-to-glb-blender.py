"""
Blender headless: FBX/OBJ (+ maps/) → GLB for room openings (windows / doors).

Called by opening-to-glb.ps1:

  blender --background --python tools/opening-to-glb-blender.py -- ^
    --input "C:/path/model.fbx" --output "C:/out/name.glb" [--maps C:/path/maps]
"""
from __future__ import annotations

import argparse
import os
import sys


def parse_args(argv):
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = argv[1:]
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--output", required=True)
    p.add_argument("--maps", default="")
    p.add_argument("--decimate", type=float, default=0.0)
    p.add_argument("--jpeg-quality", type=int, default=82)
    p.add_argument(
        "--drop-helpers",
        action="store_true",
        default=True,
        help="Remove UV-sphere helpers (pink Max dummies)",
    )
    p.add_argument("--keep-helpers", action="store_true", help="Do not drop helper spheres")
    return p.parse_args(argv)


def _dir_image_count(path: str) -> int:
    if not path or not os.path.isdir(path):
        return 0
    exts = {".jpg", ".jpeg", ".png", ".webp", ".tga", ".tif", ".tiff", ".bmp"}
    n = 0
    for root, _dirs, files in os.walk(path):
        for name in files:
            if os.path.splitext(name)[1].lower() in exts:
                n += 1
    return n


def find_maps_dir(model_path: str, override: str) -> str:
    d = os.path.dirname(os.path.abspath(model_path))
    parent = os.path.dirname(d)
    cands = []
    if override and os.path.isdir(override):
        cands.append(override)
    cands.extend(
        [
            os.path.join(d, "maps"),
            os.path.join(d, "Maps"),
            os.path.join(d, "texture"),
            os.path.join(d, "textures"),
            os.path.join(parent, "maps"),
            os.path.join(parent, "Maps"),
            os.path.join(parent, "texture"),
            os.path.join(parent, "textures"),
            d,
            parent,
        ]
    )
    best = d
    best_n = -1
    seen = set()
    for cand in cands:
        if not cand or cand in seen or not os.path.isdir(cand):
            continue
        seen.add(cand)
        n = _dir_image_count(cand)
        if n > best_n:
            best, best_n = cand, n
    return best


def collect_images(maps_dir: str) -> dict:
    out = {}
    if not maps_dir or not os.path.isdir(maps_dir):
        return out
    exts = {".jpg", ".jpeg", ".png", ".webp", ".tga", ".tif", ".tiff", ".bmp"}
    for root, _dirs, files in os.walk(maps_dir):
        for name in files:
            if os.path.splitext(name)[1].lower() not in exts:
                continue
            full = os.path.join(root, name)
            out[name.lower()] = full
            out[os.path.splitext(name)[0].lower()] = full
    return out


def import_model(path: str) -> None:
    import bpy

    ext = os.path.splitext(path)[1].lower()
    if ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=path)
    elif ext == ".obj":
        bpy.ops.wm.obj_import(filepath=path)
    elif ext in (".gltf", ".glb"):
        bpy.ops.import_scene.gltf(filepath=path)
    else:
        raise SystemExit(f"Unsupported input: {ext}")


def _norm(s: str) -> str:
    return "".join(ch for ch in (s or "").lower() if ch.isalnum())


def _build_stem_index(img_index: dict) -> dict:
    by_stem = {}
    for _k, v in img_index.items():
        stem = _norm(os.path.splitext(os.path.basename(v))[0])
        if stem:
            by_stem[stem] = v
    return by_stem


def _pick_stem(by_stem: dict, *needles: str):
    for needle in needles:
        n = _norm(needle)
        for stem, path in sorted(by_stem.items(), key=lambda kv: -len(kv[0])):
            if n and n in stem:
                return path
    return None


def relink_missing_images(img_index: dict) -> int:
    """
    Fix broken Max paths like .../maps/Wood_3.jpg → local maps/Wood_3.jpg.
    Do NOT invent Wood for anonymous Map #N (glass often has dummy Map slots).
    """
    import bpy

    fixed = 0
    for img in bpy.data.images:
        fp = bpy.path.abspath(img.filepath) if img.filepath else ""
        missing = (not fp) or (not os.path.isfile(fp))
        if not missing:
            continue
        # Prefer basename from broken path or image name (Wood_3.jpg / Metall1.jpg)
        candidates = []
        if fp:
            candidates.append(os.path.basename(fp))
        if img.name:
            candidates.append(img.name)
            # "Map #186" stays; "Wood_3.jpg" / "Wood_3" may appear in name
            candidates.append(os.path.splitext(img.name)[0])
        hit = None
        for cand in candidates:
            key = cand.lower().replace("\\", "/").split("/")[-1]
            stem = os.path.splitext(key)[0]
            hit = img_index.get(key) or img_index.get(stem)
            if hit:
                break
            # path fragment .../maps/Wood_3.jpg
            for k, v in img_index.items():
                if stem and stem == k:
                    hit = v
                    break
            if hit:
                break
        if not hit:
            # Anonymous Map #178 etc. — leave unlinked (bind step decides glass vs solid)
            print("RELINK_SKIP", img.name, "fp=", fp or "(empty)")
            continue
        img.filepath = hit
        img.reload()
        try:
            img.colorspace_settings.name = "sRGB"
        except Exception:
            pass
        fixed += 1
        print("RELINK", img.name, "->", hit)
    return fixed


def _read_existing_base_color(mat):
    if not mat or not getattr(mat, "use_nodes", False) or not mat.node_tree:
        return None
    for node in mat.node_tree.nodes:
        if node.type != "BSDF_PRINCIPLED":
            continue
        sock = node.inputs.get("Base Color")
        if not sock:
            return None
        v = sock.default_value
        try:
            return (float(v[0]), float(v[1]), float(v[2]), float(v[3]) if len(v) > 3 else 1.0)
        except Exception:
            return None
    return None


def _first_bound_image_path(mat) -> str | None:
    import bpy

    if not mat or not getattr(mat, "use_nodes", False) or not mat.node_tree:
        return None
    for node in mat.node_tree.nodes:
        if node.type != "TEX_IMAGE" or not node.image:
            continue
        fp = bpy.path.abspath(node.image.filepath) if node.image.filepath else ""
        if fp and os.path.isfile(fp):
            return fp
    return None


def _set_principled(mat, image_path: str | None, solid=None, metallic=0.0, roughness=0.55):
    import bpy

    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    bsdf.inputs["Roughness"].default_value = float(roughness)
    bsdf.inputs["Metallic"].default_value = float(metallic)
    if image_path and os.path.isfile(image_path):
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(image_path, check_existing=True)
        try:
            tex.image.colorspace_settings.name = "sRGB"
        except Exception:
            pass
        tex.extension = "REPEAT"
        uv = nt.nodes.new("ShaderNodeUVMap")
        nt.links.new(uv.outputs["UV"], tex.inputs["Vector"])
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    else:
        rgba = solid or (0.90, 0.90, 0.89, 1.0)
        bsdf.inputs["Base Color"].default_value = rgba
        if len(rgba) > 3 and rgba[3] < 0.95:
            if "Alpha" in bsdf.inputs:
                bsdf.inputs["Alpha"].default_value = float(rgba[3])
            mat.blend_method = "BLEND"
            try:
                mat.shadow_method = "NONE"
            except Exception:
                pass


def _is_metal_file(path: str) -> bool:
    n = _norm(os.path.splitext(os.path.basename(path or ""))[0])
    return "metal" in n or "metall" in n


def _is_wood_file(path: str) -> bool:
    n = _norm(os.path.splitext(os.path.basename(path or ""))[0])
    return "wood" in n


def bind_opening_materials(img_index: dict) -> int:
    """
    maps/ for this pack: Wood_1..5 (frame finishes) + Metall1 (fittings).
    Glass has NO map — near-black Max materials are glass (ignore dummy Map # slots).
    """
    import bpy

    by_stem = _build_stem_index(img_index)
    print("MAP_MODE opening stems", sorted(set(by_stem.keys())))
    n = 0
    for mat in bpy.data.materials:
        mnorm = _norm(mat.name)
        base = _read_existing_base_color(mat) or (0.88, 0.88, 0.87, 1.0)
        lum = (base[0] + base[1] + base[2]) / 3.0
        alpha = base[3] if len(base) > 3 else 1.0
        linked = _first_bound_image_path(mat)

        hit = None
        solid = None
        metalness = 0.0
        rough = 0.55

        # 1) Glass: near-black / named glass — never put Wood on panes
        if (
            alpha < 0.5
            or lum < 0.05
            or any(k in mnorm for k in ("glass", "glas", "windowglass"))
        ):
            solid = (0.70, 0.82, 0.92, 0.18)
            metalness, rough = 0.0, 0.04
            print("BIND_GLASS", mat.name, "lum", round(lum, 3), "ignored_tex", bool(linked))
        # 2) Explicit plastic colour variants (Plastic1..5) — keep FBX colour
        elif "plastic" in mnorm or "pvc" in mnorm:
            solid = base if lum > 0.02 else (0.92, 0.92, 0.91, 1.0)
            rough = 0.45
            print("BIND_PLASTIC", mat.name, "rgb", tuple(round(x, 3) for x in solid[:3]))
        # 3) Linked Metall*
        elif linked and _is_metal_file(linked):
            hit = linked
            metalness, rough = 0.85, 0.35
            print("BIND_METAL", mat.name, "->", os.path.basename(linked))
        # 4) Linked Wood* only if material is not glass-dark (mid/light grey = frame finish)
        elif linked and _is_wood_file(linked) and lum >= 0.2:
            hit = linked
            rough = 0.6
            print("BIND_WOOD", mat.name, "->", os.path.basename(linked))
        # 5) Dark gasket / rubber (0.05–0.2) without maps
        elif lum < 0.25:
            solid = (0.12, 0.12, 0.12, 1.0)
            rough = 0.7
            print("BIND_GASKET", mat.name, "lum", round(lum, 3))
        # 6) Light frame without map — keep colour
        else:
            solid = base
            print("BIND_KEEP", mat.name, "lum", round(lum, 3))

        _set_principled(mat, hit, solid=solid, metallic=metalness, roughness=rough)
        n += 1
        print(
            "BIND_MAT",
            mat.name,
            "->",
            hit or ("solid " + str(tuple(round(x, 3) for x in (solid or (0, 0, 0, 1))))),
        )
    return n


def drop_helper_spheres() -> int:
    """Remove Max wire-helper UV spheres (~equal XYZ, ~960 tris)."""
    import bpy
    import mathutils

    removed = 0
    for obj in list(bpy.context.scene.objects):
        if obj.type != "MESH" or not obj.data:
            continue
        mw = obj.matrix_world
        corners = [mw @ mathutils.Vector(c) for c in obj.bound_box]
        xs = [c.x for c in corners]
        ys = [c.y for c in corners]
        zs = [c.z for c in corners]
        sx, sy, sz = max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)
        tris = len(obj.data.polygons)
        if tris < 2000 and abs(sx - sy) < 0.05 and abs(sy - sz) < 0.05 and abs(sx - sz) < 0.05:
            print("DROP_HELPER", obj.name, "tris", tris)
            bpy.data.objects.remove(obj, do_unlink=True)
            removed += 1
    return removed


def resize_images(max_px: int = 2048) -> int:
    import bpy

    n = 0
    for img in bpy.data.images:
        try:
            w, h = int(img.size[0]), int(img.size[1])
        except Exception:
            continue
        if w <= 4 or h <= 4 or max(w, h) <= max_px:
            continue
        scale = max_px / float(max(w, h))
        nw = max(1, int(round(w * scale)))
        nh = max(1, int(round(h * scale)))
        try:
            img.scale(nw, nh)
            n += 1
            print("RESIZE", img.name, f"{w}x{h}", "->", f"{nw}x{nh}")
        except Exception as e:
            print("RESIZE_FAIL", img.name, e)
    return n


def decimate_meshes(ratio: float) -> tuple:
    import bpy

    if not (0.0 < ratio < 1.0):
        return 0, 0
    before = after = 0
    for obj in list(bpy.context.scene.objects):
        if obj.type != "MESH" or obj.data is None:
            continue
        before += len(obj.data.polygons)
        mod = obj.modifiers.new(name="DecimateOpening", type="DECIMATE")
        mod.decimate_type = "COLLAPSE"
        mod.ratio = ratio
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        obj.select_set(False)
        after += len(obj.data.polygons)
    return before, after


def count_faces() -> int:
    import bpy

    n = 0
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH" and obj.data is not None:
            n += len(obj.data.polygons)
    return n


def main():
    import bpy

    args = parse_args(sys.argv)
    inp = os.path.abspath(args.input)
    out = os.path.abspath(args.output)
    if not os.path.isfile(inp):
        raise SystemExit(f"Input not found: {inp}")
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)

    maps_dir = find_maps_dir(inp, args.maps)
    img_index = collect_images(maps_dir)
    print("INPUT", inp)
    print("MAPS", maps_dir, "images", len(set(img_index.values())))
    print("OUTPUT", out)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    import_model(inp)
    if args.drop_helpers and not args.keep_helpers:
        drop_helper_spheres()
    relink_missing_images(img_index)
    bind_opening_materials(img_index)
    resize_images(2048)

    faces0 = count_faces()
    if args.decimate > 0:
        b, a = decimate_meshes(args.decimate)
        print("DECIMATE", b, "->", a, "ratio", args.decimate)
    faces1 = count_faces()
    print("FACES", faces0 if args.decimate <= 0 else f"{faces0}->{faces1}")

    tmp = out + ".tmp.glb"
    if os.path.isfile(tmp):
        os.remove(tmp)
    bpy.ops.export_scene.gltf(
        filepath=tmp,
        export_format="GLB",
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_image_format="JPEG",
        export_jpeg_quality=int(args.jpeg_quality),
    )
    if not os.path.isfile(tmp) or os.path.getsize(tmp) < 1000:
        raise SystemExit(f"Export failed or too small: {tmp}")
    if os.path.isfile(out):
        os.remove(out)
    os.replace(tmp, out)
    print("OK", out, "bytes", os.path.getsize(out))


if __name__ == "__main__":
    main()
