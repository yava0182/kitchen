# Material preset card previews

Source: `public/assets/rooms/clodis_room_preview.blend` (camera/lights locked).

| Card | wall | floor | ceiling |
|------|------|-------|---------|
| light.webp | milk | lightHerringbone | white |
| warm.webp | sand | lightHerringbone | warm-white |
| natural.webp | sage | naturalHerringbone | warm-white |
| color.webp | smoky-blue | lightHerringbone | white |
| contrast.webp | graphite | lightHerringbone | white |

Floor maps in Blender:

- *Herringbone* → IKEA legacy herringbone jpg (Three.js fallback)
- lightOak → `diffuse.jpg` × `#E6D3B4` until `light-oak.webp` exists

Regenerate: `blender --background --python tools/render-room-material-presets.py`
