# IKEA Betrakta PBR Soft + Spot — agent extract 2026-08-26

Source: `planner-3d~…-DEy_Xiep.js` (~2.88 MB) via live PAX planner in Cursor browser.
ShaderStore.IncludesShadersStore key contains `betrakta_material_renderer` body (~14k).

## Soft AO in PBR (walls/floor materials)

Applies to **IBL only**, then Spot/punctual are **added without AO multiply**.

```glsl
float ao = 1.0;
#if ENABLE_SOFT_SHADOWS == 1
{
  vec2 ssUv = (surface.position.xz - blurredHeightmapViewport.xy) / blurredHeightmapViewport.zw;
  ssUv = clamp(ssUv, 0.0, 1.0);
  ssUv.y = 1.0 - ssUv.y;
  float softShadowValue = texture(blurred_heightmap, ssUv).r; // world Y height
  float nt = surface.normal.y * 0.5 + 0.5;
  float k = mix(0.01, 2.5, nt * nt);
  ao *= 0.4 + 0.6 * exp(-k * max(0.0, softShadowValue - surface.position.y - 0.0));
  ao *= ao;
  const float intensity = 1.0;
  ao = mix(1.0, ao, intensity);
  if (ssUv.x == 0.0 || ssUv.x == 1.0 || ssUv.y == 0.0 || ssUv.y == 1.0) ao = 0.0;
}
#endif
vec3 result = ao * ibl(Wo, surface, material);
// then += evaluateLight(...)  — NO ao *
```

Notes:
- `softShadowValue` is height (from transfer_depth → blur), not a shadow factor 0..1.
- Vertical walls (`normal.y≈0`) → `nt≈0.5` → `k≈mix(0.01,2.5,0.25)≈0.63`.
- Floors (`normal.y≈1`) → `k=2.5` (stronger contact).
- Soft plane on floor is a **separate** postprocess (`1-exp(-dh*intensity)`), not this block.

## Spot / punctual `getLightData` (empty room uses LIGHT_SAMPLING_METHOD_ALL → no range atten)

```glsl
vec3 L = lights[index].positionAttenuation.xyz - surface.position;
float ld2 = dot(L, L);
L /= sqrt(ld2);
float attenuation = dot(surface.normal, L)
  * smoothstep(
      lights[index].positionAttenuation.w,   // outer cone cos
      lights[index].directionAttenuation.w,  // inner cone cos
      -dot(lights[index].directionAttenuation.xyz, L)
    );
// ALL sampling: no LIGHT_ENABLE_RANGE_ATTENUATION
attenuation *= 1.0 / ld2;
direction = L;
intensity = lights[index].colorLineAndRange.xyz * max(0.0, attenuation);
intensity *= getShadow(...); // if shadow light
```

`evaluateLight` = `bsdf(L,Wo,surface,material) * intensity`.

### Live UBO pack (se/en v16.3.1, 2026-08-26) — B3.1

Settings dump still says **65° / 106°** (full aperture). UBO stores **half-angles**:

| Field | Value | Meaning |
|-------|-------|---------|
| `position_attenuation.w` | `cos(53°)` ≈ 0.6018 | outer half of 106° |
| `direction_attenuation.w` | `cos(32.5°)` ≈ 0.8434 | inner half of 65° |
| `color_line_and_range.xyz` | ≈ (39.92, 38.55, 36.53) | **not** `colorLinear × 115` |
| `color_line_and_range.w` | −12.636 | signed −range → ALL (no range atten) |

Clodis B3.1: room shader uses these UBO numbers; Three `Spot.angle` = 53°.

## Soft plane generate (postprocess) — already from gl-v5

```glsl
float h = texture(sourceTexture, vec2(1.0 - vUV.x, vUV.y)).r;
float dh = max(0.0, h - referenceHeight);
float alpha = 1.0 - exp(-dh * intensity);
gl_FragColor = vec4(0, 0, 0, alpha);
```

Live: `referenceHeight=0`, `intensity=1`. Blur: 16 taps fixed OFFSETS/WEIGHTS.

## Implication for Clodis empty-room Spot hotspot

Harsh Spot wash ≠ missing Soft AO on walls (AO only dims IBL).
Gap (closed 2026-08-26 B3.1): settings 65°/106° are **full aperture**; UBO packs **half-angles**
`cos(32.5°)=0.8434`, `cos(53°)=0.6018`. Using `cos(106°)<0` lit the whole lower hemisphere.
`color_line_and_range.xyz ≈ (39.92, 38.55, 36.53)` — **not** `colorLinear×115`; `w=−range` → ALL.

## Wall paint material (live 2026-08-26)

- `paint_30x30_white`: **no albedo map**; `baseColorFactor` linear (0.877, 0.874, 0.779); rough 0.75.
- **normalTexture only** from `…/materials/room/wall/new_wall_1.glb#image0`, `scale=2`, tile name → 300 mm.
- Clodis B3.2a: local `vendor/ikea-wall/paint_30x30_white_normal.png`, world-UV / 300 mm.

## Phase plan (fixed)

See `.cursor/rules/betrakta-ikea-phases-cab.mdc` — **C → A → B**, criterion = IKEA dump.

- **C (spotC1):** `Spot.distance = 0` (pure 1/r²), cone via angle/penumbra from 65°/106°, 115 cd, decay 2.
- **A:** Soft plane `1-exp` + blur 16 (after C ok).
- **B:** Soft AO on IBL only (after A ok).
