/**
 * Betrakta / IKEA PAX — Source of Truth (консольные dump’ы).
 * Все сырые цифры dump — в МЕТРАХ (как у IKEA).
 * Наша сцена — в МИЛЛИМЕТРАХ → только через m2mm / spotIntensityForMmScene.
 *
 * Не копируем их GLSL. Повторяем поведение и числа своей реализацией.
 */

import * as THREE from 'three';

/** ikea-pure: Spot + env SH (IKEA preScaled) + Soft AO/plane — без studio/hemi/GTAO. */
export const BETRAKTA_SCHEMA = 'ikea-pure';

/** Dump: 1 unit = 1 m. У нас 1 unit = 1 mm. */
export const M_TO_MM = 1000;

export function m2mm(meters) {
  return Number(meters) * M_TO_MM;
}

export function mm2m(mm) {
  return Number(mm) / M_TO_MM;
}

/**
 * Spot 115 cd в метрах. Three Spot (decay=2): E ∝ I / r² при unit=м.
 * В мм-сцене r_mm = r_m * 1000 → I_three = I_cd * 1000², чтобы люксы совпали.
 */
export function spotIntensityForMmScene(candela) {
  return Number(candela) * M_TO_MM * M_TO_MM;
}

/** Live dump empty+cabinet 2026-08-26 */
export const SOT = Object.freeze({
  spot: Object.freeze({
    intensityCd: 115,
    y_m: 5,
    /** Empty dump (0,5,2) м — IKEA room frame: X=0 центр ширины, Z=0 задняя стена, Y пол. */
    defaultPos_m: Object.freeze({ x: 0, y: 5, z: 2 }),
    dir: Object.freeze({ x: 0, y: -1, z: 0 }),
    /**
     * Settings dump: full cone aperture 65° / 106°.
     * UBO packs HALF-angles: cos(32.5°)=0.8434, cos(53°)=0.6018 (live 2026-08-26).
     * Three Spot.angle = half-outer; shader smoothstep(outerCos, innerCos, …).
     */
    innerDeg: 65,
    outerDeg: 106,
    innerHalfDeg: 32.5,
    outerHalfDeg: 53,
    /** Exact UBO direction_attenuation.w / position_attenuation.w */
    innerCos: 0.8433914458128857,
    outerCos: 0.6018150231520484,
    /** Dump Light.range ~12.6 м — в PBR ALL-режиме range-atten ВЫКЛ (только 1/r²). */
    range_m: 12.636,
    /** UBO color_line_and_range.w = −range → ALL, без range-cutoff */
    rangeSigned_m: -12.636272196374867,
    /**
     * Empty lit PBR: LIGHT_SAMPLING_METHOD_ALL → нет LIGHT_ENABLE_RANGE_ATTENUATION.
     * Three: distance>0 даёт доп. cutoff pow2(1-pow4(d/range)) ≠ dump → distance=0.
     */
    threeDistance: 0,
    decay: 2,
    /** linear RGB dump (Spot.diffuse) — для Three Spot.color */
    colorLinear: Object.freeze([0.6181976134822835, 0.6085037131683046, 0.5937388926158431]),
    /**
     * UBO color_line_and_range.xyz (live se/en v16.3.1) — в room shader, НЕ color×115.
     * 115 cd остаётся API; упаковка в UBO уже другая.
     */
    colorLineAndRange: Object.freeze([
      39.91884375521912, 38.5546666311462, 36.52648961363465,
    ]),
    /**
     * Dump UBO screen cal = 1 for all surfaces.
     * p8z141: dropped pipette empty 0.40 / wall 1.21 / ceil 1.38 / floor 1.72 / cabinet 1.21.
     */
    screenCalEmpty: 1,
    screenCalWall: 1,
    screenCalCeiling: 1,
    screenCalFloor: 1,
    screenCalCabinet: 1,
    /** Dump: no wall spot soften — p8z10 revert p8z8/p8z9 minDist/scale. */
    wallScale: 1,
    wallMinDist2_m2: 0,
    screenMidRgb: Object.freeze([209, 209, 202]),
    /**
     * Top-down empty disk (user screenshot + pipette 2026-08-27).
     * Soft empty nz=0 → диск = Spot+IBL, не Soft plane.
     */
    floorDisk: Object.freeze({
      centerHex: '#d1ba98',
      cornerHex: '#bd9e72',
      centerLum: 187.6,
      cornerLum: 161.4,
      centerMinusCornerLum: 26.2,
    }),
    shadowNear_m: 0.5,
    shadowFar_m: 6,
    shadowMap: 4096,
    /** Live dump 2026-08-26 — BetraktaLightShadow depth bias (metre engine). */
    shadowBiasFactor: 3,
    shadowBiasUnits: 8000,
  }),
  soft: Object.freeze({
    resolution: 80,
    intensity: 1,
    referenceHeight_m: 0,
    size_m: Object.freeze({ x: 10, y: 2.7400000765919685, z: 10 }),
    centerY_m: 1.300000037997961,
    /**
     * Live GL soft_shadow_blur — 16 taps, OFFSETS/WEIGHTS fixed (blurScale null).
     * direction = (1/res, 0) или (0, 1/res); sample = uv + direction * OFFSETS[i].
     */
    blurSampleCount: 16,
    blurOffsets: Object.freeze([
      -14.359376738854206, -12.377929569488517, -10.396849318746895, -8.41608382089975,
      -6.435576703455285, -4.455269417428358, -2.4751038298192056, -0.4950160492928827,
      1.485055021558738, 3.465172537482815, 5.445401742210555, 7.425801606895373,
      9.406430666971303, 11.38734672691729, 13.368604221609049, 15.0,
    ]),
    blurWeights: Object.freeze([
      0.0025041984018900386, 0.00727113041385933, 0.01802730143570455, 0.03816459863275913,
      0.06899239816054603, 0.10650359902176183, 0.14039677865797573, 0.15804511975825483,
      0.15192860221604398, 0.12471881477578442, 0.0874287482869619, 0.05233640796478044,
      0.02675285116432407, 0.011677277520458898, 0.004352222933779603, 0.0008999506551151568,
    ]),
    /** generate: alpha = 1 - exp(-(h - refH) * intensity); UV flip X */
    planeFlipX: true,
  }),
  env: Object.freeze({
    intensity: 0.6,
    rotationDeg: 80,
    mipLevels: 8,
    localUrl: '/vendor/hdr/210701_pax_env_lowres_lowsat_2.env',
    /**
     * Live EnvironmentManager._environment_map_local_mode_settings (empty+cab 2026-08-26).
     * Specular: parallaxCorrectNormal(worldPos, R, center, size) → env sample.
     * Diffuse у IKEA = SH(N); у нас PMREM rough=1 как irradiance proxy (цифр SH в SoT нет).
     */
    localMode: Object.freeze({
      position_m: Object.freeze({ x: 0, y: 1, z: 0 }),
      size_m: Object.freeze({ x: 7.5, y: 5, z: 7.5 }),
    }),
  }),
  exposure: 2,
  cameraFovRad: 0.8,
  /**
   * Surround / пустота вокруг комнаты.
   * Screen pipette empty IKEA PAX 2026-08-26: #F2F2F0 = rgb(242,242,240).
   * Dump engineClear был ~0.95 серый (#F2F2F2) — на экране B чуть теплее (F0). SoT = пипетка IKEA.
   * scene.background = null; виден этот clear/CSS.
   */
  canvasClear: Object.freeze({ r: 242 / 255, g: 242 / 255, b: 240 / 255 }),
  canvasClearCss: '#f2f2f0',
  canvasClearHex: 0xf2f2f0,
  wall: Object.freeze({
    /** paint_30x30_white srgb (dump) */
    srgb: Object.freeze([0.9420889850360601, 0.94073073718349, 0.89243521373314]),
    /** Dump linear — pipette p8z8: calWall×1.45 достаточно; B-boost не нужен. */
    linear: Object.freeze([0.877005339, 0.874226034, 0.77851814]),
    roughness: 0.75,
    metalness: 0,
    /**
     * Live: albedo map нет; only normalTexture from new_wall_1.glb#image0.
     * normalTexture.scale = 2; tile name paint_30x30 → 300 мм.
     */
    normalUrl: '/vendor/ikea-wall/paint_30x30_white_normal.png',
    normalScale: 2,
    paintTileMm: 300,
  }),
  ceiling: Object.freeze({
    srgb: Object.freeze([0.99609375, 0.99609375, 0.99609375]),
    roughness: 0.4,
    metalness: 0,
  }),
  /**
   * Screen pipette empty PAX — сверка __cldVerifyIkeaEmptyRoom().
   * Dump структура отдельно (Spot/Soft/env 0.6).
   */
  emptyRoom: Object.freeze({
    /** Сверка только eye-level (как скрин IKEA front), не top-down / не look-up. */
    screen: Object.freeze({
      surroundRgb: Object.freeze([242, 242, 240]),
      wallMidLum: 209,
      /** Низ потолка в кадре — серый, не белый */
      ceilingMidLum: 179,
      /** Пол в кадре — ровная «пластина», без белого пятна */
      floorMidLum: 185,
      floorCornerLum: 165,
    }),
    toleranceLum: 15,
    /** dump UBO surfaceLinearScale = 1 all surfaces (no pipette cal). */
    surfaceLinearScale: Object.freeze({
      wall: 1,
      frame: 1,
      ceiling: 1,
      floor: 1,
      default: 1,
    }),
  }),
  /**
   * Floor_Herringbone dump: base_linear (1,1,1), rough 1.
   * Альбедо — текстура; tint = 1 (без screen-докрутки). p8z141 dump.
   */
  floor: Object.freeze({
    tint: Object.freeze([1, 1, 1]),
    screenTint: Object.freeze([1, 1, 1]),
    albedoSat: 1,
    roughness: 1,
    /** Dump IKEA herringbone map = 640 mm. Per-floor overrides in ROOM_FLOOR_MATERIALS.tileMm. */
    tileMm: 640,
    /** IKEA new_wooden_floor.glb → Floor_Herringbone_Medium_Wood albedo. */
    albedoUrl: '/images/textures/ikea/floor/diffuse.jpg',
    albedoFallbackUrl:
      '/images/textures/textur-gas-kvas-com-qsj7-p-tekstura-parket-yelochka-dub-svetlii-3-seamless.jpg',
    /** Боковая грань основания пола (IKEA eye-level — серая «толщина» под паркетом). */
    slab: Object.freeze({
      linear: Object.freeze([0.714, 0.702, 0.678]),
      roughness: 0.88,
    }),
  }),
  corpus: Object.freeze({
    srgb: Object.freeze([0.9982155587799926, 0.9982155587799926, 0.9672732268004894]),
    roughness: 0.35,
    metalness: 0,
  }),
  /** 011_White_Plastic — направляющие / белый пластик (IKEA dump) */
  whitePlastic: Object.freeze({
    srgb: Object.freeze([0.9982155587799926, 0.9982155587799926, 0.9672732268004894]),
    roughness: 0.6,
    metalness: 0,
  }),
  /** 004_Galvanized_Metal — IKEA PAX hardware dump 2026-08-25 */
  galvanizedMetal: Object.freeze({
    srgb: Object.freeze([0.545, 0.545, 0.545]),
    roughness: 0.35,
    metalness: 1,
  }),
  /** 006_Black_Rubber — мелкий hardware, lit PBR (не unlit) */
  rubber: Object.freeze({
    srgb: Object.freeze([0.169, 0.169, 0.169]),
    roughness: 0.65,
    metalness: 0,
  }),
  backRoughness: 0.6,
  /** 003_Backside_Furniture — dump albedo white; gray from light + rough 0.6. */
  back: Object.freeze({
    srgb: Object.freeze([1, 1, 1]),
    roughness: 0.6,
    metalness: 0,
  }),
  plasticRoughness: 0.6,
});

/** Viewport soft в мм: [minX, minZ, sizeX, sizeZ] — как dump vec4 в метрах × 1000 */
export function softViewportMmFromCenterXZ(centerXmm, centerZmm) {
  return softViewportMmFromCenterAndSize(
    centerXmm,
    centerZmm,
    SOT.soft.size_m.x,
    SOT.soft.size_m.z
  );
}

/** Viewport soft с явным size (m) — для fit bbox capture. */
export function softViewportMmFromCenterAndSize(centerXmm, centerZmm, sizeXm, sizeZm) {
  const sx = m2mm(sizeXm);
  const sz = m2mm(sizeZm);
  return {
    minX: centerXmm - sx * 0.5,
    minZ: centerZmm - sz * 0.5,
    sizeX: sx,
    sizeZ: sz,
    asArray: [centerXmm - sx * 0.5, centerZmm - sz * 0.5, sx, sz],
  };
}

/** Готовые мм-величины для Three Spot */
export const SOT_MM = Object.freeze({
  spotY: m2mm(SOT.spot.y_m),
  spotRange: m2mm(SOT.spot.range_m),
  spotIntensity: spotIntensityForMmScene(SOT.spot.intensityCd),
  shadowNear: m2mm(SOT.spot.shadowNear_m),
  shadowFar: m2mm(SOT.spot.shadowFar_m),
  shadowBiasFactor: SOT.spot.shadowBiasFactor,
  /** Dump units in m engine → mm world (÷1000). */
  shadowBiasUnitsMm: SOT.spot.shadowBiasUnits / 1000,
  softSize: Object.freeze({
    x: m2mm(SOT.soft.size_m.x),
    y: m2mm(SOT.soft.size_m.y),
    z: m2mm(SOT.soft.size_m.z),
  }),
  softCenterY: m2mm(SOT.soft.centerY_m),
  softBlurStep: 1 / SOT.soft.resolution,
});

/** Материалы шкафа / room-cabinet-studio — цифры только из SOT. */
export const BETRAKTA_PAINT = Object.freeze({
  wallColor: new THREE.Color().fromArray(SOT.wall.srgb),
  wallRoughness: SOT.wall.roughness,
  ceilingColor: new THREE.Color().fromArray(SOT.ceiling.srgb),
  ceilingRoughness: SOT.ceiling.roughness,
  corpusRoughness: SOT.corpus.roughness,
  backRoughness: SOT.backRoughness,
  plasticRoughness: SOT.plasticRoughness,
  galvanizedMetalColor: new THREE.Color().fromArray(SOT.galvanizedMetal.srgb),
  galvanizedMetalRoughness: SOT.galvanizedMetal.roughness,
  rubberColor: new THREE.Color().fromArray(SOT.rubber.srgb),
  rubberRoughness: SOT.rubber.roughness,
  doorRoughness: SOT.corpus.roughness,
  corpusColor: new THREE.Color().fromArray(SOT.corpus.srgb),
  envIntensity: SOT.env.intensity,
  spotIntensityCd: SOT.spot.intensityCd,
  spotIntensity: SOT_MM.spotIntensity,
  spotDecay: SOT.spot.decay,
  spotColor: new THREE.Color().fromArray(SOT.spot.colorLinear),
  spotWorldY: SOT_MM.spotY,
  spotInnerDeg: SOT.spot.innerHalfDeg,
  spotOuterDeg: SOT.spot.outerHalfDeg,
  spotRangeMm: SOT_MM.spotRange,
  shadowMap: SOT.spot.shadowMap,
  shadowNear: SOT_MM.shadowNear,
  shadowFar: SOT_MM.shadowFar,
  exposure: SOT.exposure,
  cameraFovDeg: (SOT.cameraFovRad * 180) / Math.PI,
});
