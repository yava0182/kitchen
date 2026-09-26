"""
Render «Готовые сочетания» from clodis_room_preview.blend.

Catalog IDs (room-edit-materials.js):
  light:    milk + lightHerringbone + white
  warm:     sand + lightHerringbone + warm-white
  natural:  sage + naturalHerringbone + warm-white
  color:    smoky-blue + lightOak + white
  contrast: back smoky-blue / sides milk + lightHerringbone + white

Does NOT move camera / lights / window geometry.
Optional: CLODIS_PRESET=color|contrast|...
"""
from __future__ import annotations

import os
import sys

import bpy

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BLEND = os.path.join(ROOT, "public", "assets", "rooms", "clodis_room_preview.blend")
OUT_DIR = os.path.join(ROOT, "public", "assets", "material-presets")
LEGACY_HERRINGBONE = os.path.join(
    ROOT,
    "public",
    "images",
    "textures",
    "ikea",
    "floor",
    "ee604ccf7d4ed0ec53b5d8cf0032e707.jpg",
)
OAK_STANDIN = os.path.join(
    ROOT, "public", "images", "textures", "ikea", "floor", "diffuse.jpg"
)

PRESETS = [
    {
        "id": "light",
        "wall": (0xF2 / 255, 0xEF / 255, 0xE8 / 255),
        "ceiling": (0xF5 / 255, 0xF5 / 255, 0xF2 / 255),
        "floor_id": "lightHerringbone",
        "floor_hex": (0xE0 / 255, 0xD0 / 255, 0xB0 / 255),
        "floor_mode": "herringbone",
        "wall_neutralize": 0.6,
    },
    {
        "id": "warm",
        "wall": (0xD9 / 255, 0xC7 / 255, 0xAE / 255),
        "ceiling": (0xEE / 255, 0xEA / 255, 0xE2 / 255),
        "floor_id": "lightHerringbone",
        "floor_hex": (0xE0 / 255, 0xD0 / 255, 0xB0 / 255),
        "floor_mode": "herringbone",
        "wall_neutralize": 0.0,
    },
    {
        "id": "natural",
        "wall": (0xAE / 255, 0xB8 / 255, 0xA7 / 255),
        "ceiling": (0xEE / 255, 0xEA / 255, 0xE2 / 255),
        "floor_id": "naturalHerringbone",
        "floor_hex": (0xC9 / 255, 0xA6 / 255, 0x6B / 255),
        "floor_mode": "herringbone",
        "wall_neutralize": 0.0,
    },
    {
        "id": "color",
        "wall": (0xAA / 255, 0xB9 / 255, 0xBF / 255),  # smoky-blue
        "ceiling": (0xF5 / 255, 0xF5 / 255, 0xF2 / 255),
        "floor_id": "lightHerringbone",
        "floor_hex": (0xE0 / 255, 0xD0 / 255, 0xB0 / 255),
        "floor_mode": "herringbone",
        "wall_neutralize": 0.0,
    },
    {
        "id": "contrast",
        # BackWall = Main (smoky-blue); Left/Right/Front = Side (milk)
        "wall": (0xAA / 255, 0xB9 / 255, 0xBF / 255),  # fallback / Main
        "wall_main": (0xAA / 255, 0xB9 / 255, 0xBF / 255),  # smoky-blue
        "wall_side": (0xF2 / 255, 0xEF / 255, 0xE8 / 255),  # milk
        "ceiling": (0xF5 / 255, 0xF5 / 255, 0xF2 / 255),
        "floor_id": "lightHerringbone",
        "floor_hex": (0xE0 / 255, 0xD0 / 255, 0xB0 / 255),
        "floor_mode": "herringbone",
        "wall_neutralize": 0.0,
    },
]

WALL_MATS = ("ClodisPreview_Wall_Main", "ClodisPreview_Wall_Side")
CEILING_MAT = "ClodisPreview_Ceiling"
FLOOR_MAT = "Clodis_Real_Herringbone"


def srgb_to_linear(c: float) -> float:
    c = float(c)
    if c <= 0.04045:
        return c / 12.92
    return ((c + 0.055) / 1.055) ** 2.4


def hex_to_linear_rgb(hex_rgb01):
    return tuple(srgb_to_linear(c) for c in hex_rgb01)


def neutralize_srgb(hex_rgb01, amount: float):
    r, g, b = hex_rgb01
    y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return (
        r + (y - r) * amount,
        g + (y - g) * amount,
        b + (y - b) * amount,
    )


def open_blend():
    if not os.path.isfile(BLEND):
        raise FileNotFoundError(BLEND)
    bpy.ops.wm.open_mainfile(filepath=BLEND)
    print("Opened", BLEND)
    print("Camera", bpy.context.scene.camera.name if bpy.context.scene.camera else None)


def rebuild_paint(mat_name, hex_rgb01, roughness=0.86, neutralize=0.0):
    mat = bpy.data.materials.get(mat_name)
    if not mat:
        print("WARN missing", mat_name)
        return
    rgb_s = neutralize_srgb(hex_rgb01, neutralize) if neutralize > 0 else hex_rgb01
    rgb_l = hex_to_linear_rgb(rgb_s)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (rgb_l[0], rgb_l[1], rgb_l[2], 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.04
    elif "Specular" in bsdf.inputs:
        bsdf.inputs["Specular"].default_value = 0.04
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.0
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    mat.diffuse_color = (rgb_s[0], rgb_s[1], rgb_s[2], 1.0)
    print("  paint", mat_name, "srgb", tuple(round(c, 3) for c in rgb_s))


def set_floor_map(image_path, hex_rgb01, mix_fac=0.92):
    mat = bpy.data.materials.get(FLOOR_MAT)
    if not mat:
        raise RuntimeError("missing floor mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    tex = nt.nodes.new("ShaderNodeTexImage")
    uv = nt.nodes.new("ShaderNodeUVMap")
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = mix_fac
    mix.inputs["B"].default_value = (hex_rgb01[0], hex_rgb01[1], hex_rgb01[2], 1.0)

    if not os.path.isfile(image_path):
        raise FileNotFoundError(image_path)
    tex.image = bpy.data.images.load(image_path, check_existing=True)
    tex.interpolation = "Smart"

    nt.links.new(uv.outputs["UV"], tex.inputs["Vector"])
    nt.links.new(tex.outputs["Color"], mix.inputs["A"])
    nt.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.72
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.12
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    print("  floor map", os.path.basename(image_path), "tint", tuple(round(c, 3) for c in hex_rgb01))


def apply_preset(p):
    neut = float(p.get("wall_neutralize") or 0)
    wall_main = p.get("wall_main") or p["wall"]
    wall_side = p.get("wall_side") or p["wall"]
    rebuild_paint("ClodisPreview_Wall_Main", wall_main, 0.86, neutralize=neut)
    rebuild_paint("ClodisPreview_Wall_Side", wall_side, 0.86, neutralize=neut)
    rebuild_paint(CEILING_MAT, p["ceiling"], 0.62, neutralize=min(0.3, neut))
    if p["floor_mode"] == "herringbone":
        set_floor_map(LEGACY_HERRINGBONE, p["floor_hex"], 0.88)
    else:
        set_floor_map(OAK_STANDIN, p["floor_hex"], 0.75)


def setup_render():
    scene = bpy.context.scene
    if scene.render.engine != "CYCLES":
        scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = max(64, int(scene.cycles.samples or 64))
    scene.cycles.use_denoising = True
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.film_transparent = False
    if not scene.camera:
        cam = bpy.data.objects.get("ClodisPreviewCamera")
        if cam:
            scene.camera = cam
    if not scene.camera:
        raise RuntimeError("ClodisPreviewCamera missing")
    if hasattr(scene.view_settings, "view_transform"):
        try:
            scene.view_settings.view_transform = "Standard"
        except Exception:
            pass
    print("Render", scene.render.resolution_x, "x", scene.render.resolution_y)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    open_blend()
    setup_render()
    only = (os.environ.get("CLODIS_PRESET") or "").strip().lower()
    for p in PRESETS:
        if only and p["id"] != only:
            continue
        print("Preset", p["id"], p["floor_id"])
        apply_preset(p)
        png = os.path.join(OUT_DIR, "_tmp_" + p["id"] + ".png")
        bpy.context.scene.render.filepath = png
        bpy.ops.render.render(write_still=True)
        print(" saved", png)
    print("DONE")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("FATAL", e)
        import traceback

        traceback.print_exc()
        sys.exit(1)
