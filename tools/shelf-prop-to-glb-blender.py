"""
Blender headless: FBX/OBJ (+ maps/) → GLB for shelf-props.
Called by shelf-prop-to-glb.ps1:

  blender --background --python tools/shelf-prop-to-glb-blender.py -- ^
    --input "C:/path/model.fbx" --output "C:/out/name.glb" [--decimate 0.2]
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
    p.add_argument("--input", required=True, help="Path to .fbx / .obj / .gltf / .glb")
    p.add_argument("--output", required=True, help="Output .glb path")
    p.add_argument(
        "--maps",
        default="",
        help="Optional textures folder (default: sibling maps/ or same dir)",
    )
    p.add_argument(
        "--decimate",
        type=float,
        default=0.0,
        help="Collapse ratio 0..1 (e.g. 0.2). 0 = no decimate",
    )
    p.add_argument("--jpeg-quality", type=int, default=82)
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
            os.path.join(d, "Texture"),
            os.path.join(d, "textures"),
            os.path.join(d, "Textures"),
            os.path.join(parent, "maps"),
            os.path.join(parent, "Maps"),
            os.path.join(parent, "texture"),
            os.path.join(parent, "Texture"),
            os.path.join(parent, "textures"),
            os.path.join(parent, "Textures"),
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
            best = cand
            best_n = n
    return best


def collect_images(maps_dir: str) -> dict:
    """basename(lower) -> full path"""
    out = {}
    if not maps_dir or not os.path.isdir(maps_dir):
        return out
    exts = {".jpg", ".jpeg", ".png", ".webp", ".tga", ".tif", ".tiff", ".bmp"}
    for root, _dirs, files in os.walk(maps_dir):
        for name in files:
            ext = os.path.splitext(name)[1].lower()
            if ext not in exts:
                continue
            full = os.path.join(root, name)
            out[name.lower()] = full
            out[os.path.splitext(name)[0].lower()] = full
    return out


def import_model(path: str) -> None:
    import bpy

    ext = os.path.splitext(path)[1].lower()
    if ext == ".fbx":
        try:
            # use_image_search: подтянуть maps рядом; пути уже сжаты препроцессом
            bpy.ops.import_scene.fbx(filepath=path, use_image_search=True)
        except Exception as e:
            # Old Max FBX 6100: Blender needs 7100+. Fall back to sibling OBJ.
            sibling = os.path.splitext(path)[0] + ".obj"
            if not os.path.isfile(sibling):
                d = os.path.dirname(path)
                objs = [
                    os.path.join(d, n)
                    for n in os.listdir(d)
                    if n.lower().endswith(".obj")
                ]
                sibling = max(objs, key=lambda p: os.path.getsize(p)) if objs else ""
            if sibling and os.path.isfile(sibling):
                print("FBX_IMPORT_FAIL", e, "→ OBJ", sibling)
                bpy.ops.wm.obj_import(filepath=sibling)
            else:
                raise
    elif ext == ".obj":
        bpy.ops.wm.obj_import(filepath=path)
    elif ext in (".gltf", ".glb"):
        bpy.ops.import_scene.gltf(filepath=path)
    else:
        raise SystemExit(f"Unsupported input: {ext}")


def relink_missing_images(img_index: dict) -> int:
    import bpy

    fixed = 0
    for img in bpy.data.images:
        fp = bpy.path.abspath(img.filepath) if img.filepath else ""
        missing = (not fp) or (not os.path.isfile(fp))
        if not missing:
            continue
        base = os.path.basename(fp or img.name).lower()
        stem = os.path.splitext(base)[0].lower()
        hit = img_index.get(base) or img_index.get(stem)
        if not hit:
            # soft match: stem contained in key or vice versa
            for k, v in img_index.items():
                if stem and (stem in k or k in stem):
                    hit = v
                    break
        if hit:
            img.filepath = hit
            img.reload()
            try:
                img.colorspace_settings.name = "sRGB"
            except Exception:
                pass
            fixed += 1
            print("RELINK", img.name, "->", hit)
    return fixed


def _norm(s: str) -> str:
    return "".join(ch for ch in (s or "").lower() if ch.isalnum())


def _build_stem_index(img_index: dict) -> dict:
    by_stem = {}
    for _k, v in img_index.items():
        stem = _norm(os.path.splitext(os.path.basename(v))[0])
        if stem:
            by_stem[stem] = v
    return by_stem


def _is_utility_map_stem(stem: str) -> bool:
    """Normal/reflect/bump/… — не albedo."""
    s = stem or ""
    hints = (
        "normal",
        "normap",
        "nrm",
        "reflect",
        "refl",
        "spec",
        "specular",
        "gloss",
        "bump",
        "height",
        "displace",
        "rough",
        "metalness",
        "metallic",
        "occlusion",
        "ambientocclusion",
        "mask",
        "holes",
    )
    # «diff» / albedo важнее, даже если в имени ещё что-то
    if any(a in s for a in ("diff", "diffuse", "albedo", "basecolor", "basecolour")):
        return False
    # leather_D / Zamsh_d / stelka_d — суффикс «d» = diffuse, не utility
    if len(s) > 2 and s.endswith("d") and not any(h in s for h in ("nrm", "normal", "refl", "spec", "bump")):
        return False
    return any(h in s for h in hints)


def _pick_albedo_stem(by_stem: dict, *needles: str):
    """Как _pick_stem, но пропускает normal/reflect."""
    for needle in needles:
        n = _norm(needle)
        cands = []
        for stem, path in by_stem.items():
            if not n or n not in stem:
                continue
            if _is_utility_map_stem(stem):
                continue
            cands.append((stem, path))
        if not cands:
            continue
        cands.sort(
            key=lambda kv: (
                0
                if any(a in kv[0] for a in ("diff", "diffuse", "albedo", "basecolor", "color"))
                or (kv[0].endswith("d") and "nrm" not in kv[0])
                else 1,
                -len(kv[0]),
            )
        )
        return cands[0][1]
    return None


def _maps_look_like_clothing(by_stem: dict) -> bool:
    """True if maps/ looks like shelf-prop clothes (knits/tees), not wood/metal architecture."""
    # Не считать cloth.jpg у туфель «одеждой» — иначе Jimmy Choo уходит в shirtwhite.
    if _maps_look_like_heels(by_stem) or _maps_look_like_footwear(by_stem):
        return False
    cloth_hints = (
        "knit",
        "tshirt",
        "shirt",
        "dress",
        "blouse",
        "denim",
        "fabric",
        "knitted",
        # Collection Clothing maps: cloth037.jpg и т.п. (heels/footwear уже отсечены выше)
        "cloth",
        "sweater",
        "vest",
        "towel",
        "jean",
    )
    arch_hints = ("wood", "metall", "metal", "plastic", "glass", "concrete", "brick")
    stems = list(by_stem.keys())
    cloth_n = sum(1 for s in stems if any(h in s for h in cloth_hints))
    arch_n = sum(1 for s in stems if any(h in s for h in arch_hints))
    return cloth_n > 0 and cloth_n >= arch_n


def _maps_look_like_footwear(by_stem: dict) -> bool:
    """Кроссовки/обувь: Sole + leather/lace/zamsh в maps/."""
    blob = " ".join(by_stem.keys())
    has_sole = "sole" in blob
    has_upper = any(k in blob for k in ("leather", "lace", "zamsh", "suede", "stelka"))
    return has_sole and has_upper


def _maps_look_like_heels(by_stem: dict) -> bool:
    """Туфли/каблуки: leather в maps, без sole и без clothing-пака (рубашки/свитера)."""
    blob = " ".join(by_stem.keys())
    if "soledif" in blob or ("sole" in blob and "leather" in blob and "lace" in blob):
        return False
    # Collection Clothing и т.п. — не heels
    if any(
        k in blob
        for k in (
            "shirt",
            "blouse",
            "jean",
            "sweater",
            "dress",
            "tshirt",
            "knit",
            "vest",
            "towel",
            "hanger",
        )
    ):
        return False
    return "leather" in blob


def _heels_material_num(mat_name: str):
    """Material #89 / Material #89.001 → 89 (не material89001)."""
    import re

    m = re.search(r"#\s*(\d+)", mat_name or "")
    if m:
        return int(m.group(1))
    m = re.search(r"material(\d+)", _norm(mat_name))
    return int(m.group(1)) if m else None


def _resolve_heels_map(mat_name: str, by_stem: dict):
    """Material #N из Max → Leather / cloth; #89 стелька; #190/#286 подошва."""
    leather = _pick_albedo_stem(by_stem, "leather")
    cloth = _pick_albedo_stem(by_stem, "cloth")
    num = _heels_material_num(mat_name)
    # Max VRayColor: светлая стелька (не путать с подошвой)
    if num == 89:
        return None, (0.933, 0.722, 0.553, 1), 1.0, (0.0, 0.0)
    # тёмная подошва / каблук
    if num in (190, 286):
        return None, (0.114, 0.02, 0.0, 1), 1.0, (0.0, 0.0)
    if num == 54 and cloth:
        return cloth, None, 1.0, (0.0, 0.0)
    if leather:
        return leather, None, 1.0, (0.0, 0.0)
    if cloth:
        return cloth, None, 1.0, (0.0, 0.0)
    return None, (0.12, 0.08, 0.06, 1), 1.0, (0.0, 0.0)


def _parse_wire_rgb(mnorm: str):
    """Max OBJ Multi/Sub wire_RRRGGGBBB → (r,g,b) 0..255."""
    if not mnorm.startswith("wire"):
        return None
    digits = mnorm[4:]
    if len(digits) != 9 or not digits.isdigit():
        return None
    return int(digits[0:3]), int(digits[3:6]), int(digits[6:9])


def _resolve_footwear_map(mat_name: str, by_stem: dict):
    """
    OBJ из старых Max часто wire_* без map_Kd; имена карт — Sole_dif / leather_D / lace_dif.
    Реальные имена из FBX (Lather, body, SD, …) тоже покрываем.
    """
    mnorm = _norm(mat_name)
    named = (
        (("lather", "leather"), ("leatherd", "leather")),
        (("body", "zamsh", "suede"), ("zamshd", "zamsh")),
        (("lace",), ("lacedif", "lace")),
        (("logof", "logo"), ("logo3", "logo")),
        (("stelka", "insole"), ("stelkad", "stelka")),
        (("strin", "string", "thread"), ("strind", "strin")),
        (("sd",), ("soledif", "sole")),
    )
    for keys, needles in named:
        if any(k in mnorm for k in keys):
            hit = _pick_albedo_stem(by_stem, *needles)
            if hit:
                return hit, None, 1.0, (0.0, 0.0)
    if mnorm == "sole" or mnorm.endswith("sole") and "sd" not in mnorm and "dif" not in mnorm:
        return None, (0.12, 0.11, 0.11, 1), 1.0, (0.0, 0.0)
    if any(k in mnorm for k in ("zhelezki", "eyelet", "metal", "hardware")):
        return None, (0.45, 0.45, 0.46, 1), 1.0, (0.0, 0.0)

    rgb = _parse_wire_rgb(mnorm)
    if rgb is not None:
        # Эталонные wire-цвета пака Lakai (и похожих Max sneakers).
        roles = (
            ((28, 89, 177), ("soledif", "sole")),
            ((113, 135, 6), ("zamshd", "zamsh")),
            ((83, 55, 55), ("leatherd", "leather")),
            ((255, 0, 0), ("lacedif", "lace")),
            ((6, 135, 113), ("strind", "strin")),
            ((0, 55, 83), None),
            ((0, 0, 0), None),
        )
        best = None
        best_d = 1e18
        for ref, needles in roles:
            d = (rgb[0] - ref[0]) ** 2 + (rgb[1] - ref[1]) ** 2 + (rgb[2] - ref[2]) ** 2
            if d < best_d:
                best_d = d
                best = needles
        if best is None:
            return None, (0.35, 0.35, 0.36, 1), 1.0, (0.0, 0.0)
        hit = _pick_albedo_stem(by_stem, *best)
        if hit:
            return hit, None, 1.0, (0.0, 0.0)
        return None, (0.55, 0.55, 0.54, 1), 1.0, (0.0, 0.0)
    return None, None, 1.0, (0.0, 0.0)


def _pick_stem(by_stem: dict, *needles: str):
    for needle in needles:
        n = _norm(needle)
        for stem, path in sorted(by_stem.items(), key=lambda kv: -len(kv[0])):
            if n and n in stem:
                return path
    return None


def _read_existing_base_color(mat):
    """RGBA from Principled Base Color if present (Max FBX solid colours)."""
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


def _resolve_map_for_material(mat_name: str, by_stem: dict, clothing_mode: bool):
    """Return (path|None, solid|None, uv_scale, uv_loc). Scales from Max FBX."""
    mnorm = _norm(mat_name)
    if clothing_mode:
        core = mnorm[4:] if mnorm.startswith("vray") else mnorm
        # Collection Clothing 2018 (vray_* → maps/)
        coll_aliases = [
            ("blouse05", "blouse05"),
            ("jeanjacket", "jeanjacket4k"),
            ("boxwhite", "boxwhite"),
            ("cloth037", "cloth037"),
            ("cloth040", "cloth04"),
            ("cloth041", "cloth041gray2"),
            ("cloth044", "cloth044"),
            ("clothbeige", "clothb"),
            ("clothblackshirt", "clothblackshirt"),
            ("clothgrey", "clothgray"),
            ("clothgray", "clothgray"),
            ("clothbox", "boxwhite"),
            ("crate", "crateim01"),
            ("graydress", "graydress"),
            ("knittedsweater", "knittedsweaterim"),
            ("blouseknitted3", "whiteknitted"),
            ("blouseknitted4", "knittedmateriall"),
            ("blouseknitted2", "knittedmateriall"),
            ("lacesweater", "knittedcloth"),
            ("leatherportfolio", "leather31"),
            ("tamarisleache", "tamaris2"),
            ("slippersgray", "tamaris2"),
            ("pacificwonderland", "pacificwonderlandbag"),
            ("dripcity", "babtext"),
            ("rattan", "rattan19im"),
            ("rope", "ropetexture2093"),
            ("shirtwhite", "shirtwhite"),
            ("shirt044", "shirt04"),
            ("shirt03", "shirt03"),
            ("shirt02", "shirt04"),
            ("shirt05", "shirt03"),
            ("shirt01", "shirtwhite"),
            ("sleeweless", "vestonhanger"),
            ("thingsblouse", "blouse05"),
            ("sweater05", "buttonsweater"),
            ("sweater06", "knittedsweaterim"),
            ("blousesweater06", "knittedsweaterim"),
            ("hatribbon", "bowlerhatribbon"),
            ("bowler", "bowlerhatribbon"),
            ("woodenshelves", "woodligned"),
            ("button", "buttonsweater"),
            ("tagnumber", "n1"),
            ("mango", "mango"),
            ("blackbox", "leather31"),
            ("dress1", "graydress"),
            ("dress2", "shirtwhite"),
            ("vest", "vestonhanger"),
            ("towel", "towelgray"),
            ("pack", "pack"),
            ("purpleshirt", "purpleshirt"),
            ("tshirtburn", "tshirtburnn"),
        ]
        for key, stem in coll_aliases:
            if key in core:
                hit = by_stem.get(stem) or _pick_albedo_stem(by_stem, stem)
                if hit:
                    return hit, None, 1.0, (0.0, 0.0)
        if any(k in core for k in ("chrom", "hanger_crossbar", "hangercrossbar")):
            return None, (0.72, 0.72, 0.73, 1), 1.0, (0.0, 0.0)
        if "whiteplastic" in core or "plastichanger" in core:
            return None, (0.93, 0.92, 0.90, 1), 1.0, (0.0, 0.0)
        if "wood" in core:
            hit = _pick_albedo_stem(by_stem, "woodligned", "woodligne", "wood")
            if hit:
                return hit, None, 1.0, (0.0, 0.0)
        if any(k in core for k in ("leather", "leache")):
            hit = _pick_albedo_stem(by_stem, "leather31", "leather", "leacherref21")
            if hit:
                return hit, None, 1.0, (0.0, 0.0)

        aliases = {
            # knits: chunkiness comes from pre-cropped sharp albedo (not UV zoom — that blurs)
            "blouseknitted3": ("whiteknitted", 1.0, (0.0, 0.0)),
            "blouseknitted4": ("knittedmateriall", 1.0, (0.0, 0.0)),
            "graydresscloth004": ("graydress", 1.0, (0.0, 0.0)),
            "graydresscloth": ("graydress", 1.0, (0.0, 0.0)),
            "tshirtbrown": ("tshirtbrown", 1.0, (0.0, 0.0)),
            "tshirtlife": ("tshirtlife", 1.0, (0.0, 0.0)),
            "tshirtoregon": ("tshirtcoast", 1.0, (0.0, 0.0)),
            "tshirt1": ("tshirtburn", 1.0, (0.0, 0.0)),
            "dress2": ("shirtwhite", 1.0, (0.0, 0.0)),
            "thingsaddition": ("shirtwhite", 1.0, (0.0, 0.0)),
            "02default": (None, 1.0, (0.0, 0.0)),
        }
        for key, (stem, scale, loc) in aliases.items():
            if key in mnorm or key in core:
                if stem is None:
                    return None, (0.18, 0.18, 0.18, 1), scale, loc
                return by_stem.get(stem), None, scale, loc
        for stem, path in sorted(by_stem.items(), key=lambda kv: -len(kv[0])):
            if not stem or _is_utility_map_stem(stem):
                continue
            if stem == core or stem in core or core in stem:
                return path, None, 1.0, (0.0, 0.0)
            if stem == mnorm or stem in mnorm or mnorm in stem:
                return path, None, 1.0, (0.0, 0.0)
        return None, None, 1.0, (0.0, 0.0)

    # Architecture / windows / generic Max packs (Wood_*, Metall*, …)
    if _maps_look_like_footwear(by_stem):
        hit, solid, scale, loc = _resolve_footwear_map(mat_name, by_stem)
        if hit is not None or solid is not None:
            return hit, solid, scale, loc
    if _maps_look_like_heels(by_stem):
        hit, solid, scale, loc = _resolve_heels_map(mat_name, by_stem)
        if hit is not None or solid is not None:
            return hit, solid, scale, loc
    if any(k in mnorm for k in ("glass", "glas", "windowglass")):
        return None, (0.72, 0.82, 0.90, 0.25), 1.0, (0.0, 0.0)
    if any(k in mnorm for k in ("metal", "metall", "chrome", "steel", "alum", "iron")):
        hit = _pick_stem(by_stem, "metall", "metal")
        if hit:
            return hit, None, 1.0, (0.0, 0.0)
        return None, (0.55, 0.55, 0.56, 1), 1.0, (0.0, 0.0)
    if any(k in mnorm for k in ("wood", "oak", "pine", "veneer")):
        hit = _pick_stem(by_stem, "wood")
        if hit:
            return hit, None, 1.0, (0.0, 0.0)
    if "plastic" in mnorm:
        # White PVC frame — solid, not wood (unless only wood maps and user wants wood look)
        return None, (0.92, 0.92, 0.91, 1), 1.0, (0.0, 0.0)
    # Кожа / сумки: Diff, не Reflect (иначе viewer «белый»).
    if any(k in mnorm for k in ("leather", "bag", "tote", "purse")):
        hit = _pick_albedo_stem(by_stem, "leatherdiff", "leather", "diff", "albedo")
        if hit:
            return hit, None, 1.0, (0.0, 0.0)
    # Ремень в Max-паках часто «09 - Default»: в Maps только Strap mask/normal — albedo = Leather Diff.
    if "09default" in mnorm or (
        "default" in mnorm
        and "03" not in mnorm
        and _pick_stem(by_stem, "strap")
        and _pick_albedo_stem(by_stem, "leatherdiff", "leather", "diff")
    ):
        hit = _pick_albedo_stem(by_stem, "leatherdiff", "leather", "diff", "albedo")
        if hit:
            return hit, None, 1.0, (0.0, 0.0)
    cands = []
    for stem, path in by_stem.items():
        if not stem:
            continue
        if not (stem == mnorm or stem in mnorm or mnorm in stem):
            continue
        if _is_utility_map_stem(stem):
            continue
        cands.append((stem, path))
    if cands:
        cands.sort(
            key=lambda kv: (
                0
                if any(a in kv[0] for a in ("diff", "diffuse", "albedo", "basecolor", "color"))
                else 1,
                -len(kv[0]),
            )
        )
        return cands[0][1], None, 1.0, (0.0, 0.0)
    # Material #2301 etc.: keep FBX colour (caller passes solid), no forced clothing map
    return None, None, 1.0, (0.0, 0.0)


def _set_simple_textured_mat(mat, image_path: str | None, solid=None, uv_scale=1.0, uv_loc=(0.0, 0.0)):
    import bpy

    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    bsdf.inputs["Roughness"].default_value = 0.85
    bsdf.inputs["Metallic"].default_value = 0.0
    # Bake mesh UVs only for mild tiling (whites). Knits use Mapping — baking
    # crushed UVs into a tiny crop and the chunky knit never looked right.
    stem = ""
    if image_path:
        stem = _norm(os.path.splitext(os.path.basename(image_path))[0])
    is_knit = stem in ("whiteknitted", "knittedmateriall")
    if is_knit:
        mat["cld_uv_scale"] = 1.0
        mat["cld_uv_loc_x"] = 0.0
        mat["cld_uv_loc_y"] = 0.0
    else:
        mat["cld_uv_scale"] = float(uv_scale)
        mat["cld_uv_loc_x"] = float(uv_loc[0])
        mat["cld_uv_loc_y"] = float(uv_loc[1])
    if image_path and os.path.isfile(image_path):
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(image_path, check_existing=True)
        try:
            tex.image.colorspace_settings.name = "sRGB"
        except Exception:
            pass
        tex.extension = "REPEAT"
        uv = nt.nodes.new("ShaderNodeUVMap")
        if is_knit and (abs(uv_scale - 1.0) > 1e-6 or abs(uv_loc[0]) > 1e-6 or abs(uv_loc[1]) > 1e-6):
            mapping = nt.nodes.new("ShaderNodeMapping")
            mapping.inputs["Scale"].default_value = (float(uv_scale), float(uv_scale), 1.0)
            mapping.inputs["Location"].default_value = (float(uv_loc[0]), float(uv_loc[1]), 0.0)
            nt.links.new(uv.outputs["UV"], mapping.inputs["Vector"])
            nt.links.new(mapping.outputs["Vector"], tex.inputs["Vector"])
            print("KNIT_MAPPING", mat.name, "scale", uv_scale, "loc", uv_loc)
        else:
            nt.links.new(uv.outputs["UV"], tex.inputs["Vector"])
        if stem == "shirtwhite":
            mix = nt.nodes.new("ShaderNodeMix")
            mix.data_type = "RGBA"
            mix.blend_type = "MULTIPLY"
            mix.inputs["Factor"].default_value = 1.0
            mix.inputs["A"].default_value = (0.88, 0.87, 0.84, 1)
            nt.links.new(tex.outputs["Color"], mix.inputs["B"])
            nt.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
        else:
            nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    else:
        bsdf.inputs["Base Color"].default_value = solid or (0.55, 0.55, 0.54, 1)


def bake_uv_scales_into_meshes() -> int:
    import bpy
    import bmesh

    changed = 0
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or not obj.data or not obj.data.uv_layers:
            continue
        me = obj.data
        scales = []
        for slot in obj.material_slots:
            mat = slot.material
            if mat and "cld_uv_scale" in mat:
                scales.append(
                    (
                        float(mat["cld_uv_scale"]),
                        float(mat.get("cld_uv_loc_x", 0.0)),
                        float(mat.get("cld_uv_loc_y", 0.0)),
                    )
                )
            else:
                scales.append((1.0, 0.0, 0.0))
        if all(s[0] == 1.0 and s[1] == 0.0 and s[2] == 0.0 for s in scales):
            continue
        bm = bmesh.new()
        bm.from_mesh(me)
        uv_layer = bm.loops.layers.uv.active
        if uv_layer is None:
            bm.free()
            continue
        for face in bm.faces:
            mi = face.material_index
            if mi < 0 or mi >= len(scales):
                continue
            sc, lx, ly = scales[mi]
            if sc == 1.0 and lx == 0.0 and ly == 0.0:
                continue
            for loop in face.loops:
                u, v = loop[uv_layer].uv
                loop[uv_layer].uv = (u * sc + lx, v * sc + ly)
        bm.to_mesh(me)
        bm.free()
        me.update()
        changed += 1
        print("UV_BAKE", obj.name, scales[0] if scales else None)
    return changed


def _first_bound_image_path(mat) -> str | None:
    """After relink_missing_images: path of first Image Texture with a real file."""
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


def ensure_principled_from_orphan_maps(img_index: dict) -> int:
    """Rebuild albedo from maps/ (Max Map #* paths are often empty)."""
    import bpy

    by_stem = _build_stem_index(img_index)
    clothing = _maps_look_like_clothing(by_stem)
    print("MAP_MODE", "clothing" if clothing else "generic", "stems", sorted(set(by_stem.keys())))
    wood = _pick_stem(by_stem, "wood")
    metal = _pick_stem(by_stem, "metall", "metal")
    bound = 0
    for mat in bpy.data.materials:
        # Prefer texture already linked on this material (after RELINK Map # → Wood_*.jpg)
        linked = None if clothing else _first_bound_image_path(mat)
        if linked and _is_utility_map_stem(_norm(os.path.splitext(os.path.basename(linked))[0])):
            # FBX часто линкует Reflect/Normal — не оставлять как albedo.
            print("IGNORE_UTILITY_LINK", mat.name, "->", linked)
            linked = None
        hit, solid, scale, loc = _resolve_map_for_material(mat.name, by_stem, clothing)
        if linked and hit is None:
            hit = linked
            solid = None
            print("BIND_RELINKED", mat.name, "->", linked)
        if hit is None and solid is None:
            if clothing:
                hit = by_stem.get("shirtwhite") or by_stem.get("whiteknitted")
                scale, loc = 2.0, (0.0, 0.0)
            else:
                solid = _read_existing_base_color(mat)
                if solid is None:
                    solid = (0.88, 0.88, 0.87, 1)
                lum = (solid[0] + solid[1] + solid[2]) / 3.0
                alpha = solid[3] if len(solid) > 3 else 1.0
                mnorm = _norm(mat.name)
                if alpha < 0.5 or lum < 0.02 or any(k in mnorm for k in ("glass", "glas")):
                    solid = (0.72, 0.82, 0.90, 0.22 if alpha >= 0.5 else max(0.08, min(alpha, 0.35)))
                    print("BIND_FALLBACK_GLASS", mat.name, "alpha", round(alpha, 3), "lum", round(lum, 3))
                elif wood and lum < 0.35:
                    hit, solid = wood, None
                    print("BIND_FALLBACK_WOOD", mat.name, "lum", round(lum, 3))
                elif metal and lum < 0.35:
                    hit, solid = metal, None
                    print("BIND_FALLBACK_METAL", mat.name)
                elif lum < 0.35:
                    solid = (0.90, 0.90, 0.89, 1)
                    print("BIND_FALLBACK_PVC", mat.name)
                else:
                    print("BIND_KEEP_COLOR", mat.name, "lum", round(lum, 3))
        _set_simple_textured_mat(mat, hit, solid=solid, uv_scale=scale, uv_loc=loc)
        if solid and len(solid) > 3 and solid[3] < 0.95 and mat.use_nodes:
            for node in mat.node_tree.nodes:
                if node.type == "BSDF_PRINCIPLED":
                    if "Alpha" in node.inputs:
                        node.inputs["Alpha"].default_value = float(solid[3])
                    break
            mat.blend_method = "BLEND"
            try:
                mat.shadow_method = "NONE"
            except Exception:
                pass
        bound += 1
        print(
            "BIND_MAT",
            mat.name,
            "->",
            hit or (("solid " + str(tuple(round(x, 3) for x in solid))) if solid else "default"),
            "uv",
            scale,
        )
    return bound


def resize_images(max_px: int = 1024) -> int:
    import bpy

    n = 0
    for img in bpy.data.images:
        try:
            w, h = int(img.size[0]), int(img.size[1])
        except Exception:
            continue
        if w <= 4 or h <= 4:
            continue
        m = max(w, h)
        if m <= max_px:
            continue
        scale = max_px / float(m)
        nw = max(1, int(round(w * scale)))
        nh = max(1, int(round(h * scale)))
        try:
            img.scale(nw, nh)
            n += 1
            print("RESIZE", img.name, f"{w}x{h}", "->", f"{nw}x{nh}")
        except Exception as e:
            print("RESIZE_FAIL", img.name, e)
    return n


def sanitize_materials_for_export() -> None:
    """Keep Mapping nodes — Max UV scales are intentional for knits."""
    return


def decimate_meshes(ratio: float) -> tuple:
    import bpy

    if not (0.0 < ratio < 1.0):
        return 0, 0
    before = after = 0
    for obj in list(bpy.context.scene.objects):
        if obj.type != "MESH" or obj.data is None:
            continue
        before += len(obj.data.polygons)
        mod = obj.modifiers.new(name="DecimateShelf", type="DECIMATE")
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


def _xy_extent_at_z_band(ob, z_lo, z_hi) -> float:
    """Размер XY у вершин в полосе Z (мир)."""
    from mathutils import Vector

    xs, ys = [], []
    mw = ob.matrix_world
    for v in ob.data.vertices:
        w = mw @ v.co
        if z_lo <= w.z <= z_hi:
            xs.append(w.x)
            ys.append(w.y)
    if len(xs) < 3:
        return 0.0
    return (max(xs) - min(xs)) * (max(ys) - min(ys))


def fix_inverted_pair_meshes() -> int:
    """
    Пара туфель = два кластера по X. Если один кластер «вверх ногами» —
    крутим ВСЕ его меши вокруг центра кластера (не по одному мешу — иначе разлетается).
    Потом: отвязать от Group, apply transform, оба кластера на min Z = 0.
    """
    import bpy
    from math import pi
    from mathutils import Matrix, Vector

    meshes = [
        ob
        for ob in bpy.data.objects
        if ob.type == "MESH" and ob.data and len(ob.data.vertices) >= 40
    ]
    if len(meshes) < 2:
        return 0

    # Снять иерархию Max Group — иначе flip/ground не доезжает до экспорта
    for ob in meshes:
        if ob.parent is not None:
            mw = ob.matrix_world.copy()
            ob.parent = None
            ob.matrix_world = mw
    bpy.context.view_layer.update()

    centers = []
    for ob in meshes:
        mw = ob.matrix_world
        pts = [mw @ v.co for v in ob.data.vertices]
        cx = sum(p.x for p in pts) / len(pts)
        centers.append((cx, ob))
    xs = sorted(c[0] for c in centers)
    mid = (xs[0] + xs[-1]) * 0.5
    groups = {0: [], 1: []}
    for cx, ob in centers:
        groups[0 if cx < mid else 1].append(ob)
    if len(groups[0]) < 1 or len(groups[1]) < 1:
        return 0

    def cluster_ratio(obs):
        pts = []
        for ob in obs:
            mw = ob.matrix_world
            for v in ob.data.vertices:
                pts.append(mw @ v.co)
        if len(pts) < 20:
            return 1.0, Vector((0, 0, 0))
        zs = [p.z for p in pts]
        zmin, zmax = min(zs), max(zs)
        span = zmax - zmin
        if span < 1e-6:
            return 1.0, sum(pts, Vector()) / len(pts)
        band = span * 0.12

        def extent(z_lo, z_hi):
            xs_, ys_ = [], []
            for p in pts:
                if z_lo <= p.z <= z_hi:
                    xs_.append(p.x)
                    ys_.append(p.y)
            if len(xs_) < 3:
                return 0.0
            return (max(xs_) - min(xs_)) * (max(ys_) - min(ys_))

        bottom = extent(zmin, zmin + band)
        top = extent(zmax - band, zmax)
        cen = sum(pts, Vector()) / len(pts)
        return bottom / max(top, 1e-9), cen

    def cluster_min_z(obs):
        zmin = 1e18
        for ob in obs:
            mw = ob.matrix_world
            for v in ob.data.vertices:
                zmin = min(zmin, (mw @ v.co).z)
        return zmin

    def translate_cluster(obs, dz):
        if abs(dz) < 1e-8:
            return
        T = Matrix.Translation(Vector((0.0, 0.0, dz)))
        for ob in obs:
            ob.matrix_world = T @ ob.matrix_world

    r0, c0 = cluster_ratio(groups[0])
    r1, c1 = cluster_ratio(groups[1])
    print("SHOE_CLUSTERS", "n0", len(groups[0]), "r0", round(r0, 3), "n1", len(groups[1]), "r1", round(r1, 3))

    flipped = 0
    if max(r0, r1) >= 1.2 and min(r0, r1) < 0.75 and max(r0, r1) / max(min(r0, r1), 1e-9) >= 1.5:
        bad_i = 0 if r0 < r1 else 1
        obs = groups[bad_i]
        pivot = c0 if bad_i == 0 else c1
        T1 = Matrix.Translation(-pivot)
        R = Matrix.Rotation(pi, 4, "X")
        T2 = Matrix.Translation(pivot)
        M = T2 @ R @ T1
        for ob in obs:
            ob.matrix_world = M @ ob.matrix_world
            print("FLIP_CLUSTER", ob.name, "cluster", bad_i)
        flipped = len(obs)
        bpy.context.view_layer.update()

    # Одна плоскость: оба кластера → min Z = 0, затем bake в меш
    bpy.context.view_layer.update()
    z0 = cluster_min_z(groups[0])
    z1 = cluster_min_z(groups[1])
    translate_cluster(groups[0], -z0)
    translate_cluster(groups[1], -z1)
    bpy.context.view_layer.update()

    bpy.ops.object.select_all(action="DESELECT")
    for ob in meshes:
        ob.select_set(True)
    if meshes:
        bpy.context.view_layer.objects.active = meshes[0]
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.update()

    print(
        "SHOE_GROUND",
        "z0",
        round(cluster_min_z(groups[0]), 5),
        "z1",
        round(cluster_min_z(groups[1]), 5),
    )
    return flipped


def _darken_heels_albedo_nodes() -> int:
    """
    Jimmy Choo: в Maps светлый leather (беж), без чёрного diffuse.
    Затемняем только leather-карты; cloth / стелька #89 не трогаем.
    Цвет: тёплый тёмно-коричневый (как Max #190), не серый уголь.
    """
    import bpy

    darkened_images = set()
    n = 0
    # тёплый чёрно-коричневый × бежевая кожа → не серый
    mul = (0.11, 0.055, 0.03)

    for mat in bpy.data.materials:
        if not mat.use_nodes or not mat.node_tree:
            continue
        num = _heels_material_num(mat.name)
        # стелька / cloth — не затемнять
        if num in (54, 89):
            continue
        nt = mat.node_tree
        bsdf = next((x for x in nt.nodes if x.type == "BSDF_PRINCIPLED"), None)
        if not bsdf:
            continue
        tex = None
        for link in list(nt.links):
            if link.to_node == bsdf and link.to_socket == bsdf.inputs.get("Base Color"):
                if link.from_node.type == "TEX_IMAGE" and link.from_node.image:
                    tex = link.from_node
                break
        if not tex:
            continue

        img = tex.image
        stem = _norm(os.path.splitext(img.name)[0])
        path_stem = _norm(os.path.splitext(os.path.basename(img.filepath or ""))[0])
        blob = stem + path_stem
        if "cloth" in blob or "stelka" in blob:
            continue
        if "leather" not in blob and "leather" not in _norm(mat.name):
            # только albedo кожи
            if num not in (30, 141, 218, 240):
                continue

        key = img.name
        if key not in darkened_images and img.pixels:
            px = list(img.pixels)
            for i in range(0, len(px), 4):
                px[i] *= mul[0]
                px[i + 1] *= mul[1]
                px[i + 2] *= mul[2]
            img.pixels = px
            img.update()
            darkened_images.add(key)
            print("HEELS_DARKEN_IMG", img.name)
            n += 1
        sock = bsdf.inputs.get("Base Color")
        if sock is not None:
            sock.default_value = (1.0, 1.0, 1.0, 1.0)
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
    relink_missing_images(img_index)
    ensure_principled_from_orphan_maps(img_index)
    bake_uv_scales_into_meshes()
    fix_inverted_pair_meshes()
    by_stem = _build_stem_index(img_index)
    if _maps_look_like_heels(by_stem):
        _darken_heels_albedo_nodes()
    sanitize_materials_for_export()
    resize_images(2048)

    faces0 = count_faces()
    if args.decimate > 0:
        b, a = decimate_meshes(args.decimate)
        print("DECIMATE", b, "->", a, "ratio", args.decimate)
    faces1 = count_faces()
    print("FACES", faces0 if args.decimate <= 0 else f"{faces0}->{faces1}")

    # write to temp then replace — avoid leaving old GLB on failed export
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
