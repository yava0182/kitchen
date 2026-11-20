/**
 * IKEA_PORT Stage 4 — explicit lighting config (not lab globals).
 * Sources: docs/ikea-kitchen-shadow-dump live UBO + public/ikea-kitchen-ibl.
 */

/** Ambient from light UBO binding 0 (live capture). */
export const IKEA_PORT_AMBIENT = Object.freeze({
  color: Object.freeze([1, 1, 1]),
  intensity: 0.665697,
});

/**
 * Directional from light UBO:
 * dumpD = directionalLightDirectionShadowmapIndex.xyz (Z-up GPU)
 * wiYup = toward-light in Three Y-up = (-D.x, -D.z, D.y) remap used in lab notes;
 * live dump: D=(0.408249, 0.408248, -0.816496), Wi=(-0.408249, 0.816496, 0.408248)
 */
export const IKEA_PORT_DIR = Object.freeze({
  color: Object.freeze([1, 1, 1]),
  intensity: 3.144638,
  /** Z-up direction as stored in UBO (used as -D → light vector in Phong FS). */
  dumpD: Object.freeze([0.408249, 0.408248, -0.816496]),
  /** Y-up toward-light for Three viewMatrix path. */
  wiYup: Object.freeze([-0.408249, 0.816496, 0.408248]),
});

/** Phong FS constant (complete-fs-7). */
export const IKEA_PORT_PHONG_SPEC_ATTEN = 0.035;

/**
 * CLODIS MeshStandard → IKEA Phong UBO fields (documented bridge, not eyeballed).
 * linearShininess = clamp(1 - roughness, 0.01, 1)
 * specularRGB = mix(F0_dielectric, albedo, metalness) with F0_dielectric=0.04
 * (matches common F0→Phong specular tint; dump white boards often ~0.066 specular).
 */
export const IKEA_PORT_MATERIAL_BRIDGE = Object.freeze({
  f0Dielectric: 0.04,
  shininessFloor: 0.01,
});

export const IKEA_PORT_ASSET_BASE = '/ikea-kitchen-ibl/default';

export const IKEA_PORT_CUBE_FACES = Object.freeze([
  'px', 'nx', 'py', 'ny', 'pz', 'nz',
]);

/** desc.json mipCount=7 → max lod index 6. */
export const IKEA_PORT_CUBE_MAX_MIP = 6;

/**
 * Stage 5 — static shadow (dump settings + complete-fs-7 Vogel).
 * Sources: shadow-settings-extract.json, ikea-EXTRACTED-fn-*.glsl.txt
 */
export const IKEA_PORT_SHADOW = Object.freeze({
  mapSize: 2048,
  sampleCount: 16,
  goldenAngle: 2.4,
  darkness: 0.8,
  constantBias: -0.0008,
  kernelRadius: 2,
  normalBias: 30,
  nearPlane: 100,
});

/**
 * Dump ubFSShadowMapEnvironment (live_ubo0 size80) — std140 head.
 * floats[0..3] = darkness, bias, kernelRadius, normalBias
 * floats[4..19] = mat4 staticShadowMatrix (column-major) for IKEA kitchen in **meters**.
 * That mat4 is scene-specific — NOT applied to CLODIS mm. Kept as SoT sample + layout proof.
 * Source: docs/.../live_ubo0_s80_*.json ; gapClose E_shadowMatrix COMPLETE.
 */
export const IKEA_PORT_SHADOW_UBO0_DUMP = Object.freeze({
  sizeBytes: 80,
  darkness: 0.800000011920929,
  constantBias: -0.0007999999797903001,
  kernelRadius: 2,
  normalBias: 30,
  /** Column-major mat4 from IKEA live kitchen (meters) — reference only. */
  staticShadowMatrixColMajor: Object.freeze([
    0.0001330971426796168,
    -0.000027168374799657613,
    0.00006075036071706563,
    0,
    5.840849180184515e-13,
    0.00013584175030700862,
    0.00006075025521568023,
    0,
    0.00006654868047917262,
    0.00005433665864984505,
    -0.00012150052498327568,
    0,
    0.3963356614112854,
    0.4530848264694214,
    0.6451026201248169,
    1,
  ]),
  note: 'CLODIS regenerates mat4 via bias*proj*view on mm AABB (furniture+walls); dump mat4 is IKEA meters layout',
});

/**
 * Stage 6 — SSAO (InitSSAOSettings + ikea-ssao-fragment.glsl).
 * depthScale: 1000 * (ortho?10:1) per ikea-camera-ssao.json.
 */
export const IKEA_PORT_SSAO = Object.freeze({
  enabledDefault: true,
  aoRadius: 1.5,
  aoClampMin: 0.2,
  aoLumInfluence: 1.0,
  gCenter: 0.4,
  gDefaultWidth: 10.0,
  gLeftWidth: 0.4,
  depthScaleFactor: 1000.0,
  noiseEnabled: false,
  noiseAmount: 0.0,
  samplesCount: 16,
  multiBounce: true,
});

/**
 * OpaqueLit beauty MSAA — dump READBACK: color RB samples=4, RGBA16F.
 * Three WebGL2 RT.samples → resolve to texture before SSAO reads color+depth.
 * Silhouette зубчики: GeoAA alone is specular-only; this is edge AA.
 * Override: ?ikeaPortMsaa=0|2|4|8
 */
export const IKEA_PORT_MSAA = Object.freeze({
  enabledDefault: true,
  samples: 4,
  source: 'READBACK-EVIDENCE OpaqueLit RENDERBUFFER samples=4 RGBA16F',
});

/**
 * Stage 7 — Bloom (InitBloomSettings + dump Bright/Down/Up/Composite).
 * Control kitchen HDR max≈1.03 < threshold 5 → BrightPass RGB=0 is correct.
 */
export const IKEA_PORT_BLOOM = Object.freeze({
  enabledDefault: true,
  threshold: 5,
  smoothWidth: 0.01,
  bloomMax: 50,
  bloomFactor: 0.016,
  mips: 5,
  resScale: 0.5,
});

/**
 * Stage 8 — Uncharted2 + gamma + dither (complete-fs-7 toneMap / linearToOutput / dither).
 * whiteScale = 1 / Uncharted2(11.2) = 1.3790642466494378
 * Order: toneMap → linearToOutput(γ 2.2) → dither. No Three ACES / double sRGB.
 */
export const IKEA_PORT_FINAL = Object.freeze({
  enabledDefault: true,
  A: 0.15,
  B: 0.5,
  C: 0.1,
  D: 0.2,
  E: 0.02,
  F: 0.3,
  whitePoint: 11.2,
  whiteScale: 1.3790642466494378,
  exposureBias: 3.0,
  gammaFactor: 2.2,
  /** Pre-scale before Uncharted2 — dump toneMap(originalColor) has none → 1.0 */
  inputExposure: 1.0,
});

/**
 * Specular AO on IBL (Init* specularAoIblEnabled=true).
 * Formula: saturate(pow(NoV+ao, exp2(-16*roughness-1)) - 1 + ao)
 * Source: ikea-EXTRACTED / complete-fs-9 computeSpecularAO (Frostbite).
 * ao = ORM.r or 1.0 when no aoMap (fixture usually 1.0 → near identity).
 */
export const IKEA_PORT_SPECULAR_AO = Object.freeze({
  enabledDefault: true,
  aoDefault: 1.0,
  source: 'computeSpecularAO Frostbite; specularAoIblEnabled=true',
});

/**
 * Geometric specular AA (USE_GEOMETRIC_AA) — complete-fs-9.
 * Softens specular/IBL aliasing on silhouette & curved edges («зубчики»).
 */
export const IKEA_PORT_GEO_AA = Object.freeze({
  enabledDefault: true,
  /** min(2*variance, 0.18) cap from dump */
  kernelRoughnessCap: 0.18,
  minRoughness: 0.002,
  source: 'complete-fs-9 GEOMETRIC SPECULAR AA dFdx/dFdy worldNormal',
});

/**
 * SkyRenderer (program A.Sky) — cube + depth xyww.
 * blendingCoeff default 1 (full env); diffuseColor loading tint.
 * Cube is RGBM (same as IBL mip0), not RGBE.
 */
export const IKEA_PORT_SKY = Object.freeze({
  // Dump Sky exists, but IBL mip0 as skybox paints «шляпу» (розетки/плинтус/город)
  // into empty pixels above ceiling. Keep OFF; ON only via __cldIkeaPort.setSky(true).
  enabledDefault: false,
  blendingCoeff: 1.0,
  diffuseColor: Object.freeze([1, 1, 1]),
  isRGBE: false,
  isRGBM: true,
  source: 'ikea-EXTRACTED-program-Sky-VS/FS + RGBM env mip0',
});
