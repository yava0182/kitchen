"""
Optimize wardrobe hang-strip GLBs for room step 7 (VRAM).
Usage:
  blender --background --python tools/optimize-rod-hang-glb.py -- in.glb out.glb [decimate=0.2] [tex=1024]
"""
from __future__ import annotations

import sys
from pathlib import Path

import bpy


def parse_args(argv: list[str]) -> tuple[Path, Path, float, int]:
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    if len(argv) < 2:
        raise SystemExit("need: in.glb out.glb [decimate] [texMax]")
    src = Path(argv[0])
    dst = Path(argv[1])
    decimate = float(argv[2]) if len(argv) > 2 else 0.2
    tex_max = int(argv[3]) if len(argv) > 3 else 1024
    return src, dst, decimate, tex_max


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes):
        bpy.data.meshes.remove(block)
    for block in list(bpy.data.materials):
        bpy.data.materials.remove(block)
    for block in list(bpy.data.images):
        bpy.data.images.remove(block)


def resize_images(tex_max: int) -> None:
    for img in bpy.data.images:
        if not img.size[0] or not img.size[1]:
            continue
        w, h = int(img.size[0]), int(img.size[1])
        if max(w, h) <= tex_max:
            continue
        scale = tex_max / float(max(w, h))
        nw = max(1, int(round(w * scale)))
        nh = max(1, int(round(h * scale)))
        try:
            img.scale(nw, nh)
        except Exception as e:
            print("skip resize", img.name, e)


def apply_decimate(ratio: float) -> None:
    for obj in list(bpy.data.objects):
        if obj.type != "MESH":
            continue
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        mod = obj.modifiers.new(name="DecimateCLD", type="DECIMATE")
        mod.ratio = max(0.05, min(1.0, ratio))
        try:
            bpy.ops.object.modifier_apply(modifier=mod.name)
        except Exception as e:
            print("decimate fail", obj.name, e)
        obj.select_set(False)


def main() -> None:
    src, dst, ratio, tex_max = parse_args(sys.argv)
    if not src.is_file():
        raise SystemExit(f"missing {src}")
    clear_scene()
    bpy.ops.import_scene.gltf(filepath=str(src))
    apply_decimate(ratio)
    resize_images(tex_max)
    dst.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(dst),
        export_format="GLB",
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
    )
    print(f"OK {src.name} -> {dst}  decimate={ratio} texMax={tex_max}")


if __name__ == "__main__":
    main()
