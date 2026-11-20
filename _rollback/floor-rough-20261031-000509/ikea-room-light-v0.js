/**
 * IKEA v0 room light — один модуль, один shader bind.
 * Фаза 6: dump UBO screenCal=1 (p8z141 — без pipette cal).
 */
import * as THREE from 'three';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { state } from '../utils/state.js';
import {
  isRoomLowMemMode,
  markRoomOomSurvivor,
} from '../core/room-lowmem.js?v=20261030-hdrod1';
import { SOT, SOT_MM, M_TO_MM, m2mm, softViewportMmFromCenterAndSize } from './betrakta-sot.js?v=20260913-tile-per-floor';
import { IKEA_V0_ACTIVE_PHASE, IKEA_V0_CACHE_BUST, IKEA_V0_RUNBOOK, auditIkeaV0Manifest } from './ikea-v0-manifest.js?v=20261030-kdir1';

/** IKEA SoftShadow render_layer_mask = 2 (cabinet corpus/facade/back). */
const SOFT_LAYER = 2;
export const IKEA_V0_SOFT_LAYER = SOFT_LAYER;
/** Layer 4 = optional soft AO silhouette (off for section trim). */
const SOFT_AO_SILHOUETTE_LAYER = 4;
export const IKEA_V0_SOFT_AO_SILHOUETTE_LAYER = SOFT_AO_SILHOUETTE_LAYER;
/** IKEA SoftShadow block_layer_mask = 32 → exclude layer 5 from height pass (floor contact only). */
const SOFT_BLOCK_LAYER = 5;
const SOFT_BLOCK_LAYER_MASK = 1 << SOFT_BLOCK_LAYER;
/** Layer 5 = trim/обклад floor contact only — not wall Soft AO heightmap. */
const SOFT_FLOOR_LAYER = 5;
export const IKEA_V0_SOFT_FLOOR_LAYER = SOFT_FLOOR_LAYER;
/** C1: Three Spot SM off on meshes; phase 7+ = Betrakta atlas in shader. */
const SPOT_SHADOW_LAYER = 3;
export const IKEA_V0_SPOT_SHADOW_LAYER = SPOT_SHADOW_LAYER;
/** IKEA dump layerMask 3: 90458221 frame (010/003/hardware) + shelf modules; not trim/placeholders. */
/** Cabinet boards only — metal/plastic hinges must NOT enter depth hide/show (leaf names are Mesh1). */
const SPOT_SHADOW_CAST_KINDS = new Set(['corpus', 'back', 'facade']);
const SPOT_SHADOW_FRAME_HARDWARE_KINDS = new Set(['metal', 'plastic', 'rubber']);
/**
 * Live PAX 2026-09-04: TexturePacker 2048, allocation 1024² tile (viewport≈0.499).
 * 512 мазало контакт на кухне во всю стену — вернули dump 1024.
 * Если на Windows Chrome снова OOM / context lost после расстановки — 512.
 */
const SPOT_SHADOW_MAP_SIZE = 1024;
/** Dump getShadow → 0 in umbra; IBL fills. Floor>0 washed shelf bands vs IKEA. */
const SPOT_SHADOW_SPOT_FLOOR = 0;
/** Bump when shader/uniform schema changes — forces cabinet material rebind. */
const IKEA_V0_SHADER_REV = 57;

/** Dump occlusion_strength = 1 на 010_White и 003_Backside_Furniture (2026-09-04). */
const CAVITY_OCC_STRENGTH = 1;
/** Внешние грани оболочки лежат на AABB; полость начинается на толщину плиты глубже. */
const CAVITY_INSIDE_MARGIN_MM = 8;
/** Ящик полости = каркас: dump-материалы с occ-картой (010 корпус/полки, 003 зад). */
const CAVITY_BODY_KINDS = new Set(['corpus', 'back']);
/** Фасад/дверь/обклад вне слоя: у проёма form factor вырожден (deviation ikea-r3j71). */
const CAVITY_OCC_KINDS = new Set(['corpus', 'back']);
/** Допуск от грани отсека до лицевой грани боковины, где видна полоса диффузора. */
const LED_FACE_OFFSET_MM = 9;
/** Ширина полосы у кромки фасада, где фасад принимает тень Spot (контур). */
const FACADE_SHADOW_RIM_MM = 40;
/** Albedo белого ЛДСП для переотражения внутри отсека. */
const LED_BOUNCE_RHO = 0.7;
/**
 * Подсветка по умолчанию. На шкаф переопределяется root.userData.ledConfig (тот же формат):
 *   enabled   — есть ли профиль;
 *   mode      — 'vertical' (в боковинах) | 'horizontal' (под полками/крышкой) | 'under' (под дном навесного);
 *   beamDeg   — угол луча профиля по полуспаду, 120 = матовый рассеиватель, 30–60 = линза;
 *   insetMm   — от фронта корпуса до оси профиля, мм;
 *   widthMm   — видимая ширина диффузора, мм;
 *   sides     — 'both' | 'left' | 'right' (слева/справа, стоя перед фасадом);
 *   intensity — сила света ленты (I на метр, в единицах Spot);
 *   emission  — яркость самого диффузора;
 *   color     — [r,g,b] линейный.
 */
const LED_DEFAULTS = Object.freeze({
  enabled: true,
  mode: 'vertical',
  beamDeg: 120,
  insetMm: 40,
  widthMm: 12,
  sides: 'both',
  intensity: 0.15,
  emission: 14,
  color: [1.0, 0.9, 0.76],
});
/**
 * Общие на страницу: Vite HMR / разные ?v= поднимают вторую копию модуля, старая продолжает
 * sync каждые 200 мс и затирала настройки панели своими.
 */
const _ledTune = (globalThis.__cldLedTune ||= { ...LED_DEFAULTS, color: [...LED_DEFAULTS.color] });
const LED_MODES = ['vertical', 'horizontal', 'under'];
/** Отрезков на интеграл линии: φ-замена гладкая, 12 хватает и для луча 30°. */
const LED_LINE_SAMPLES = 12;
/** Профилей под навесными на сцену (общий uniform-массив). */
const LED_UNDER_MAX = 6;
/** Один набор объектов на все материалы: обновление под-шкафных профилей — одна запись. */
const _ledUnderU = (globalThis.__cldLedUnderU ||= {
  ledUnderCount: { value: 0 },
  ledUnderA: { value: Array.from({ length: LED_UNDER_MAX }, () => new THREE.Vector3()) },
  ledUnderB: { value: Array.from({ length: LED_UNDER_MAX }, () => new THREE.Vector3()) },
  ledUnderColor: { value: Array.from({ length: LED_UNDER_MAX }, () => new THREE.Vector3()) },
  ledUnderEmission: { value: Array.from({ length: LED_UNDER_MAX }, () => new THREE.Vector3()) },
  ledUnderHalfW: { value: new Array(LED_UNDER_MAX).fill(6) },
  ledUnderBeamM: { value: new Array(LED_UNDER_MAX).fill(1) },
});

function ledBeamExponent(beamDeg) {
  const half = (Math.min(170, Math.max(20, beamDeg)) * Math.PI) / 360;
  return Math.log(0.5) / Math.log(Math.cos(half));
}
/** Пересчёт бокса не чаще, чем раз в 200 мс — как Soft throttle r3j64 (был hang на rAF). */
const CAVITY_REBUILD_MIN_MS = 200;
/**
 * Потолок albedo полости в сумме переотражений. 010_White даёт luma≈0.988, при нём затенение
 * почти исчезает; полость несёт кромки, зазоры и фурнитуру, поэтому эффективное albedo ниже.
 * ЕДИНСТВЕННАЯ ручка яркости интерьера: ниже — темнее, 0.99 — почти плоско.
 */
const CAVITY_INTERREFLECT_MAX = 0.95;
/**
 * Пипетка live PAX 2026-09-04, оба рендера приведены к общей опоре (стена: у них 211, у нас
 * 218 — мы на 7.7% ярче в линейном):
 *   внутренний бок и задник = 175 РОВНО по всей глубине, верх полки = 216..229,
 *   полоса стыка ~18 px до 154; у нас было 207→126 по боку, задник 188.
 * Ската по глубине у них нет: occlusion — запечённая карта при strength 1, внутри каркаса
 * почти постоянная, тёмные только складки в стыках плит. Form factor проёма по построению
 * даёт монотонный скат и у переднего торца всегда выходит на полную яркость (при rho 0.99
 * это 192→234), то есть ровных 175 не даёт ни при каком rho — отсюда серый смаз по боку.
 * Уровень полости — константа, но зависит от нормали: у них верх полки ярче вертикали в
 * 1.87 раза, наш IBL сам даёт лишь 1.11. Цель по нашей шкале: вертикаль 178, верх полки 234.
 */
/**
 * Cavity tune — saved from on-screen UI 2026-09-05 (user: «сохрани, ещё подправлю»).
 * level/levelUp 1 = без плоского затемнения полости; crease 0.6 / 121 мм — стык бок↔зад;
 * white 1 = dump albedo; gain 1.49 = отклонение от dump (ярче «белого»).
 */
const CAVITY_INTERIOR_LEVEL = 1;
const CAVITY_INTERIOR_LEVEL_UP = 1;
const CAVITY_CREASE_MIN = 0.6;
const CAVITY_CREASE_WIDTH_MM = 121;
const CAVITY_CABINET_WHITE = 1;
const CAVITY_CABINET_GAIN = 1.49;
/**
 * Периметральное AO кромки панели — аналог их фаски с бейком.
 * Dump 2026-09-07 (docs/IKEA-dump-door-gap-20260907.js): дверь PAX 495×2294×16 мм при
 * 1156 вершинах — простая плита это 24 вершины, значит профиль кромки смоделирован;
 * плюс occlusion_sampler при occlusion_strength 1. Каркас 500 → щель между створками ≈ 5 мм.
 * Пипетка их кадра: провал в стыке 9–19 ед. при ширине 2–3 px, РОВНЫЙ по всей высоте, тогда
 * как освещённость полотна меняется по высоте на 40 ед. Постоянство и означает бейк по
 * кромке, а не тень от света — поэтому cabinetGain на стык и не влиял.
 * Бейк под параметрическую панель невозможен, поэтому величину считаем аналитически по
 * расстоянию до собственной кромки: та же подстановка, что уже принята для полости корпуса
 * (см. deviations ikea-r3j71 — их image0 запечён под модель, у нас analytic).
 * Наш замер до слоя: провал 2.6–4.0 ед.
 */
const PANEL_EDGE_AO_MIN = 0.72;
const PANEL_EDGE_AO_WIDTH_SIDE_MM = 8;
const PANEL_EDGE_AO_WIDTH_TOP_MM = 8;
/** Кромку темним у деталей, которые видны снаружи: фасад, дверь, обклад. */
const PANEL_EDGE_AO_KINDS = new Set(['facade', 'door', 'trim']);
/**
 * Комната темнее дампа по просьбе пользователя: pre-ODT множитель на поверхности комнаты.
 * Дамп даёт surfaceLinearScale = 1, отклонение задокументировано в манифесте (ikea-room-dim-080).
 */
const ROOM_DIM_SCALE = 0.8;
/**
 * Догоняется в консоли через __cldIkeaV0SetCavityLevel() / панель Cavity.
 */
const _cavityTune = {
  level: CAVITY_INTERIOR_LEVEL,
  levelUp: CAVITY_INTERIOR_LEVEL_UP,
  creaseMin: CAVITY_CREASE_MIN,
  creaseWidthMm: CAVITY_CREASE_WIDTH_MM,
  white: CAVITY_CABINET_WHITE,
  gain: CAVITY_CABINET_GAIN,
  edgeMin: PANEL_EDGE_AO_MIN,
  edgeWidthSideMm: PANEL_EDGE_AO_WIDTH_SIDE_MM,
  edgeWidthTopMm: PANEL_EDGE_AO_WIDTH_TOP_MM,
  roomDim: ROOM_DIM_SCALE,
};
/** Пересчёт кэша кромки на меше: ширина в object units зависит от ползунков. */
let _panelEdgeAoRev = 1;
/** Максимум перекрывающих плит на ось проёма — размер массива в шейдере. */
const CAVITY_BLOCK_MAX = 12;
/**
 * Радиус ядра в текселях. У IKEA 2, но на карте 4096 — их тексель в мире вчетверо мельче
 * нашей карты 1024, так что 2 здесь мажет umbra от полок внутри корпуса сильнее их.
 */
const SPOT_SHADOW_PCF_SCALE = 1;
/** Shadow cam vertical FOV ≈ Spot outer full aperture (106°), not 170 (wall→few texels). */
const SPOT_SHADOW_FOV_DEG = 106;
const SPOT_SHADOW_PIPELINE_VER = 38;
/** IKEA dump: shelf/drawer/accessory = own SceneAssetInstance, not merged into frame. */
const SPOT_SHADOW_MODULE_CAST_ROLES = new Set([
  'shelf',
  'zone_divider',
  'drawer',
  'drawer_internal',
]);

/** GPU-uploaded 1×1 compare depth — never bind null/incomplete sampler2DShadow. */
let _fallbackSpotShadowDepth = null;
function getFallbackSpotShadowDepth(renderer) {
  if (_fallbackSpotShadowDepth) return _fallbackSpotShadowDepth;
  const t = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
  t.compareFunction = THREE.LessEqualCompare;
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  if (renderer) {
    const rt = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true, stencilBuffer: false });
    rt.depthTexture = t;
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(rt);
    renderer.clear(false, true, false);
    renderer.setRenderTarget(prev);
    rt.dispose();
  }
  _fallbackSpotShadowDepth = t;
  return t;
}

function spotShadowMapUniformValue() {
  return _spotShadowState?.mapTexture ?? getFallbackSpotShadowDepth(state.renderer);
}

function rebindSpotShadowMapOnScene() {
  const tex = spotShadowMapUniformValue();
  const scene = state.scene;
  if (!scene || !tex) return;
  scene.traverse((o) => {
    if (!o.isMesh || !o.material?.uniforms?.spotShadowMap) return;
    o.material.uniforms.spotShadowMap.value = tex;
  });
}
const SOFT_RES = SOT.soft.resolution;
/**
 * Scene mm → metres (*0.001), then / size.y so RT max ~0.8 (dump withCabinet 0.806).
 * IKEA PBR: that .r minus surface.y metres → umbra stays white (IBL).
 * p8z120 wrote raw metres (~2.36) → AO crushed the carcass.
 */
const SOFT_HEIGHT_NORM_Y_M = SOT.soft.size_m.y;
/** Footprint edge fade (m) — soft contact, not hard bbox cut. */
const SOFT_PLANE_FOOTPRINT_FADE_M = 0.12;
/** Dump soft plane generate intensity 1 — no ×2 (p8z129c made floor black under cabinet with height in metres). */
const SOFT_PLANE_CONTACT_STRENGTH = 1;
/** Soft plane pipeline ver — bump when capture/transfer/blur GLSL changes (force RT rebuild). */
const SOFT_PIPELINE_VER = 33;
/** Soft capture is heavy (proxy meshes + depth + blur). Never rebuild every rAF. */
const SOFT_CAPTURE_MIN_INTERVAL_MS = 320;
/** IKEA dump soft box = 10×10 m @ Spot.xz — one viewport for walls + corpus/back. */
const SOFT_VIEWPORT_DUMP_MAX_M = SOT.soft.size_m.x;
const ENV_ROT_DEG = 80;
const ENV_INTENSITY = SOT.env.intensity;
const ENV_MAP_MIP_LEVELS = SOT.env.mipLevels;
const ENV_CENTER_M = SOT.env.localMode.position_m;
const ENV_SIZE_M = SOT.env.localMode.size_m;
const ENV_CDN_URL =
  'https://www.ikea.com/addon-app/storageone/assets/generic/envmaps/210701_pax_env_lowres_lowsat_2.env';
/** Phases 0–5: linear ×1; phase 6: betraktaOutput exposure from SOT (dump = 2). */
const EXPOSURE_PRE_OUTPUT = 1;
const EXPOSURE_POST = SOT.exposure;
/** Dump UBO screen cal = 1 (p8z141). */
const SCREEN_CAL_EMPTY = SOT.spot.screenCalEmpty;
const MM_TO_M = 0.001;
/** paint_30x30 normal tile 300 mm — IKEA new_wall_1.glb#image0. */
const WALL_PLASTER_TILE_M = SOT.wall.paintTileMm * MM_TO_M;
const WALL_NORMAL_FALLBACK_URL = '/images/textures/ikea/wall/normal.png';
/** Floor_Herringbone tile 640 mm (dump). */
const FLOOR_MAP_TILE_M = SOT.floor.tileMm * MM_TO_M;

/**
 * Live UBO diffuseSH_L00…L22 — LightUniformBuffer binding 0, float 36…71 (2026-09-02).
 * Порядок как в betrakta computeEnvironmentIrradiance: L00, L1_1, L10, L11, L2_2, L2_1, L20, L21, L22.
 * Прежние значения были нашей реконструкцией sh9_ikeaPrescaled из sphericalPolynomial —
 * L00 завышен ×2.66, L20 с перевёрнутым знаком (стены шли 234 вместо 209).
 */
const SH_PRESCALED = [
  [0.519988, 0.517323, 0.518659],
  [0.035078, 0.034241, 0.033133],
  [0.000837, 0.000895, 0.00039],
  [0.050163, 0.050425, 0.051813],
  [-0.032435, -0.032923, -0.033912],
  [0.00088, 0.001054, 0.001205],
  [-0.003888, -0.003861, -0.003815],
  [-0.001966, -0.002148, -0.001994],
  [0.038332, 0.038533, 0.038782],
];
/**
 * Кухня IKEA: ubFSEnvironment.ambientSphericalHarmonics[9] из
 * docs/ikea-kitchen-shadow-dump/kitchen-light-ubo-20261029181958.json (len 1844).
 * Их irradianceSH — тот же полином, что computeEnvironmentIrradiance (L00, ny, nz, nx, …).
 * vec4.w в дампе = 0, в шейдер идёт только rgb. A/B: __cldIkeaV0ShSource('kitchen'|'pax').
 */
const SH_KITCHEN = [
  [0.644675, 0.644675, 0.644675],
  [0.102486, 0.102486, 0.102486],
  [-0.040844, -0.040844, -0.040844],
  [0.040277, 0.040277, 0.040277],
  [0.013728, 0.013728, 0.013728],
  [0.007652, 0.007652, 0.007652],
  [0.005665, 0.005665, 0.005665],
  [0.01242, 0.01242, 0.01242],
  [0.031901, 0.031901, 0.031901],
];
/** По умолчанию PAX — канон комнаты. Кухня только через панель / консоль. */
let _shSource = 'pax';
/**
 * Эксперимент Kitchen Directional. Default = PAX Spot.
 * Wi = −D после Z-up→Y-up (дамп GPU 2026-10-30). Не THREE.DirectionalLight.
 */
const KITCHEN_DIR_WI = Object.freeze({ x: -0.408249, y: 0.816496, z: 0.408248 });
const KITCHEN_DIR_INTENSITY = 3.144638;
const KITCHEN_DIR_SHADOW_NEAR_MM = 100;
let _punctualMode = 'pax-spot';

function isKitchenDirMode() {
  return _punctualMode === 'kitchen-dir';
}

function activeShRows() {
  return _shSource === 'kitchen' ? SH_KITCHEN : SH_PRESCALED;
}

const VERT = /* glsl */ `
out vec3 vWorldNormal;
out vec3 vWorldPos;
out vec3 vObjPos;
out vec3 vObjNormal;
out vec2 vUv;

void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  /**
   * Кромка панели считается в её собственном object space: bbox геометрии статичен и не
   * зависит от того, где стоит шкаф в комнате, поэтому матрицы в фрагмент передавать не нужно.
   */
  vObjPos = position;
  vObjNormal = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform vec3 diffuse;
uniform float roughness;
uniform float metalness;
uniform float envMapIntensity;
uniform float exposure;
uniform float screenCal;
uniform float betraktaOutputEnabled;
/** Phase 6d: 1 = write dump HDR FB (×exposure → sRGBtoRRT → dither); 0 = LDR/display. */
uniform float hdrFramebufferWrite;
uniform float hasAlbedoMap;
uniform sampler2D albedoMap;
/** Floor herringbone: world XZ / tileM (IKEA 640 mm) — ShaderMaterial ignores texture.repeat. */
uniform float floorMapWorldUv;
uniform float floorMapTileM;
uniform float floorAlbedoTintEnabled;
uniform vec3 floorAlbedoTint;
uniform float floorAlbedoSat;
uniform mat3 envRot;
uniform vec3 shCoeffs[9];

/** Dump positions in meters; vWorldPos stays mm — convert once in main(). */
uniform vec3 spotPosM;
uniform vec3 spotDir;
uniform vec3 spotColorUbo;
uniform float spotCosOuter;
uniform float spotCosInner;
uniform float spotEnabled;
/** Empty room: soften Spot on vertical surfaces (IKEA flat walls, no ceiling hotspot). */
uniform float spotWallScale;
uniform float spotWallMinDist2;
/** Kitchen Directional experiment — 0 = PAX Spot (default). Never both. */
uniform float kitchenDirEnabled;
uniform vec3 kitchenDirWi;
uniform vec3 kitchenDirColor;
uniform float kitchenDirIntensity;

/** Phase 3+ — soft plane floor (dump A). */
uniform float softPlaneEnabled;
uniform sampler2D softPlaneMap;
uniform vec4 softPlaneViewportM;
/** Layer-2 bbox XZ meters (minX, minZ, maxX, maxZ) — contact only inside. */
uniform vec4 softPlaneFootprintM;
uniform float softPlaneContactStrength;

/** Phase 4+ — Soft AO on IBL only (dump B). */
uniform float softAoEnabled;
uniform sampler2D blurredHeightmap;
uniform vec4 blurredHeightmapViewportM;

/** Phase 5+ — IBL specular env (dump ibl GGX dielectric). */
uniform float iblSpecEnabled;
/** p8z142: 1 = dump fresnel mix; <1 on walls reduces grazing spec wash on wallSide. */
uniform float iblSpecSurfaceScale;
/** p8z143: diffuse SH only — spot unchanged; ceiling < wall for wallCeilDelta. */
uniform float iblDiffuseSurfaceScale;
/** p8z143: pre-ODT headroom per surface (screenCal=1; IKEA wall ~209). */
uniform float surfaceLinearScale;
uniform samplerCube environmentMap;
uniform float envMapMipLevels;
uniform vec3 envMapCenterM;
uniform vec3 envMapSizeM;
/** IKEA renderMaterial: inverseViewProjection × gl_FragCoord → camera position. */
uniform mat4 inverseViewProjection;
uniform vec2 inverseViewportSize;
uniform vec3 cameraPosM;

/** IKEA wall cone: outer corpus/back AABB trapezoid on inner walls (not atlas, not Soft AO). */
uniform float wallConeEnabled;
uniform float wallConeCount;
uniform vec3 wallConeMin[4];
uniform vec3 wallConeMax[4];
uniform float wallConeIblMix;

/** Phase 7 — Spot shadow atlas (IKEA getShadow, ACTIVE_SHADOW_LIGHTS). */
uniform float spotShadowEnabled;
uniform float spotShadowReceive;
uniform mat4 spotShadowViewProj;
uniform vec4 spotShadowAtlasViewportBias;
uniform highp sampler2DShadow spotShadowMap;
uniform vec2 spotShadowInvSize;
uniform float spotShadowPcfScale;
uniform vec2 shadowSamplingJitter;
/** Cabinet corpus/back: min Spot in umbra (IBL fill — IKEA lighter shelf shadows). */
uniform float spotShadowSpotFloor;
/** 1 = floor shows Spot-only LDR (debug disk cone); bypasses HDR/TAA/ODT. */
uniform float debugSpotDisk;
/** Internal probe only (__cldIkeaV0RrtDiskProbe) — not URL spotDiskDebug. */
uniform float spotAttGpuProbe;
uniform float spotLinearGpuProbe;
uniform float floorTotalLinearGpuProbe;
uniform float floorAlbedoGpuProbe;

/** Wall paint_30x30 — normal map from IKEA new_wall_1.glb (300 mm tile). */
uniform float wallPlasterEnabled;
uniform float wallPlasterTileM;
uniform sampler2D wallNormalMap;
uniform float wallNormalMapEnabled;
uniform float wallNormalScale;

/**
 * IKEA material.occlusion — dump betrakta_gltf_ggx:
 *   occlusion = 1 + occlusionStrength * (occlusionTexture.r - 1)   (:1179)
 * и множит ТОЛЬКО ibl: occlusion * mix(iblDielectric, iblConductor, metallic)  (:1080).
 * PAX везёт запечённую AO каркаса (image0, одна на 010_White и 003_Backside, от наполнения
 * не зависит). У параметрического корпуса такой карты нет — occlusionTexture.r считается
 * аналитически: плоский уровень полости плюс складки в стыках плит, то есть ровно тот
 * характер, что показала пипетка их бейка (см. CAVITY_INTERIOR_LEVEL).
 */
uniform float cavityOccEnabled;
uniform float cavityOccStrength;
uniform mat4 cavityWorldToLocal;
uniform vec3 cavityBoxMin;
uniform vec3 cavityBoxMax;
uniform float cavityFrontAxis;
uniform float cavityFrontSign;
/** Потолок эффективного albedo полости для суммы переотражений (1 = совсем без затенения). */
uniform float cavityInterreflectMax;
/**
 * Яркость корпуса поверх дампа. 1 = как у IKEA. Нужна потому, что осветлять затенением больше
 * нечем: occ режется в clamp(0,1), при level 1 затенения нет вовсе, а albedo 010_White уже
 * ~0.996 — выше «белого» модель не пускает физически. Множитель в линейном HDR до вывода,
 * поэтому уходит в тонмап, а не в жёсткий клип. У комнаты остаётся 1: ставится только на шкаф.
 */
uniform float cabinetGain;
/**
 * Плоский уровень полости и складка в стыках — замена ската form factor (пипетка IKEA:
 * бок ровный по всей глубине, тень только в стыке). Up-грань светлее вертикали.
 */
uniform float cavityInteriorLevel;
uniform float cavityInteriorLevelUp;
uniform float cavityCreaseMin;
uniform float cavityCreaseWidthMm;
/**
 * Плиты, перекрывающие полость: свет через полку и стойку не идёт, поэтому проём для точки
 * ограничен её отсеком, а не всем шкафом. Позиции по двум осям плоскости проёма.
 */
uniform float cavityBlockA[12];
uniform float cavityBlockB[12];
uniform int cavityBlockACount;
uniform int cavityBlockBCount;
/** LED-профиль в боковинах отсека (вертикально у фасада): полоса-эмиттер + мягкий свет в отсеке. */
uniform float ledEnabled;
uniform float ledIntensity;
uniform float ledEmission;
uniform vec3 ledColor;
uniform float ledInsetMm;
uniform float ledHalfWidthMm;
/** x — левая боковина отсека, y — правая (со стороны фасада). */
uniform vec2 ledSides;
/** 0 — вертикально в боковинах, 1 — горизонтально под полкой, 2 — под дном (только мировые отрезки). */
uniform float ledMode;
/** Показатель cos^m кривой силы света; m = 1 при луче 120°. */
uniform float ledBeamM;
/** Профили под навесными шкафами — общие для сцены, в мм мира. */
uniform int ledUnderCount;
uniform vec3 ledUnderA[${LED_UNDER_MAX}];
uniform vec3 ledUnderB[${LED_UNDER_MAX}];
uniform vec3 ledUnderColor[${LED_UNDER_MAX}];
uniform vec3 ledUnderEmission[${LED_UNDER_MAX}];
uniform float ledUnderHalfW[${LED_UNDER_MAX}];
uniform float ledUnderBeamM[${LED_UNDER_MAX}];
/**
 * Периметральное AO кромки панели: у IKEA у полотна смоделирована фаска и по ней лёг бейк,
 * из-за чего стык створок читается ровной тёмной линией независимо от освещённости.
 * Box и ширина полосы — в object space панели, поэтому одна геометрия работает на любой
 * параметрической плите без веток по имени детали.
 */
uniform float panelEdgeAoEnabled;
uniform float panelShadowRimEnabled;
uniform vec3 panelShadowRimObj;
uniform vec3 panelBoxMin;
uniform vec3 panelBoxMax;
uniform vec3 panelEdgeWidthObj;
uniform float panelEdgeAoMin;

in vec3 vWorldNormal;
in vec3 vWorldPos;
in vec3 vObjPos;
in vec3 vObjNormal;
in vec2 vUv;

out vec4 fragColor;

vec3 computeEnvironmentIrradiance(vec3 normal) {
  return shCoeffs[0]
    + shCoeffs[1] * (normal.y)
    + shCoeffs[2] * (normal.z)
    + shCoeffs[3] * (normal.x)
    + shCoeffs[4] * (normal.y * normal.x)
    + shCoeffs[5] * (normal.y * normal.z)
    + shCoeffs[6] * ((3.0 * normal.z * normal.z) - 1.0)
    + shCoeffs[7] * (normal.z * normal.x)
    + shCoeffs[8] * (normal.x * normal.x - (normal.y * normal.y));
}

/** Dump getLightData — L + colorLineAndRange.xyz × attenuation (UBO, not Lambert). */
void evalSpotLightData(vec3 surfacePosM, vec3 n, out vec3 L, out vec3 intensity) {
  L = vec3(0.0, 1.0, 0.0);
  intensity = vec3(0.0);
  if (spotEnabled < 0.5) return;
  vec3 Lvec = spotPosM - surfacePosM;
  float ld2 = max(dot(Lvec, Lvec), 1e-8);
  if (abs(n.y) < 0.35 && spotWallMinDist2 > 0.001) {
    ld2 = max(ld2, spotWallMinDist2);
  }
  L = Lvec * inversesqrt(ld2);
  float attenuation = dot(n, L)
    * smoothstep(spotCosOuter, spotCosInner, -dot(spotDir, L));
  attenuation *= 1.0 / ld2;
  if (abs(n.y) < 0.35 && spotWallScale > 0.001 && spotWallScale < 0.999) {
    attenuation *= spotWallScale;
  }
  intensity = spotColorUbo * max(0.0, attenuation);
}

/**
 * Kitchen sun: Wi from dump (toward light). N·L once here.
 * evaluateSpotBsdf uses NdotL only inside Smith V_GGX, not as Lambert.
 * No cone, no 1/r², no wallScale.
 */
void evalDirLightData(vec3 n, out vec3 L, out vec3 intensity) {
  L = normalize(kitchenDirWi);
  intensity = vec3(0.0);
  if (kitchenDirEnabled < 0.5) return;
  float nl = max(0.0, dot(n, L));
  intensity = kitchenDirColor * kitchenDirIntensity * nl;
}

/** betrakta_brdf_ggx — evaluateLight = bsdf(L,Wo) × intensity. */
float D_GGX(float roughness, float cosTheta) {
  float a2 = roughness * roughness;
  float k = ((a2 - 1.0) * (cosTheta * cosTheta) + 1.0);
  return a2 / (k * k * 3.1415926536);
}

float V_GGX(float NdotV, float NdotL, float linearRoughness) {
  NdotL = max(0.0, NdotL);
  NdotV = max(0.0, NdotV);
  float GGX_V = NdotL * (NdotV * (1.0 - linearRoughness) + linearRoughness);
  float GGX_L = NdotV * (NdotL * (1.0 - linearRoughness) + linearRoughness);
  return 0.5 / max(0.001, GGX_V + GGX_L);
}

vec3 FresnelSchlickRoughness(float cosTheta, vec3 F0, float R90) {
  return F0 + (R90 - F0) * pow(1.0 - cosTheta, 5.0);
}

vec3 evaluateSpotBsdf(vec3 Wi, vec3 Wo, vec3 n, vec3 albedo, float perceptualRoughness, float metallic) {
  float alpha = perceptualRoughness * perceptualRoughness;
  alpha = max(alpha, 0.045 * 0.045);
  vec3 H = normalize(Wi + Wo);
  float VdotH = max(0.0, dot(Wo, H));
  float NdotH = max(0.0, dot(n, H));
  float NdotL = max(0.0, dot(n, Wi));
  float NdotV = max(0.0, dot(n, Wo));
  vec3 specularBsdf = vec3(D_GGX(alpha, NdotH) * V_GGX(NdotV, NdotL, alpha));
  vec3 diffuseBsdf = albedo / 3.1415926536;
  vec3 conductorBrdf = albedo * specularBsdf;
  vec3 F = FresnelSchlickRoughness(VdotH, vec3(0.04), max(0.04, 1.0 - perceptualRoughness));
  vec3 dielectricBrdf = mix(diffuseBsdf, specularBsdf, F);
  return mix(dielectricBrdf, conductorBrdf, metallic);
}

float softPlaneFootprintMask(vec2 xzM) {
  if (softPlaneFootprintM.z <= softPlaneFootprintM.x) return 0.0;
  if (softPlaneFootprintM.w <= softPlaneFootprintM.y) return 0.0;
  float pad = ${SOFT_PLANE_FOOTPRINT_FADE_M.toFixed(4)};
  float inX = smoothstep(softPlaneFootprintM.x - pad, softPlaneFootprintM.x + pad, xzM.x)
    * (1.0 - smoothstep(softPlaneFootprintM.z - pad, softPlaneFootprintM.z + pad, xzM.x));
  float inZ = smoothstep(softPlaneFootprintM.y - pad, softPlaneFootprintM.y + pad, xzM.y)
    * (1.0 - smoothstep(softPlaneFootprintM.w - pad, softPlaneFootprintM.w + pad, xzM.y));
  return inX * inZ;
}

float sampleSoftPlaneAlpha(vec2 xzM) {
  float mask = softPlaneFootprintMask(xzM);
  if (mask < 0.001) return 0.0;
  vec2 ssUv = (xzM - softPlaneViewportM.xy) / softPlaneViewportM.zw;
  ssUv.y = 1.0 - ssUv.y;
  ssUv.x = 1.0 - ssUv.x;
  if (ssUv.x < 0.0 || ssUv.x > 1.0 || ssUv.y < 0.0 || ssUv.y > 1.0) return 0.0;
  float a = texture(softPlaneMap, ssUv).a;
  /** Dump: alpha = 1-exp(-h_m); composite linear *= (1-alpha). Clamp — strength must not push >1. */
  return min(1.0, a * mask * softPlaneContactStrength);
}

/** Trapezoid beside carcass: darkest at top corners, wider/softer toward floor (IKEA PAX screen). */
float wallCabinetCone(vec3 posM, vec3 n) {
  if (wallConeEnabled < 0.5 || wallConeCount < 0.5) return 1.0;
  if (abs(n.y) > 0.35) return 1.0;
  float lit = 1.0;
  for (int i = 0; i < 4; i++) {
    if (float(i) >= wallConeCount) break;
    vec3 bmin = wallConeMin[i];
    vec3 bmax = wallConeMax[i];
    float h = max(0.05, bmax.y - bmin.y);
    if (posM.y > bmax.y + 0.04 || posM.y < bmin.y - 0.08) continue;
    float ty = clamp((bmax.y - posM.y) / h, 0.0, 1.0);
    float coneW = mix(0.065, 0.40, pow(ty, 0.75));
    bool alongX = abs(n.z) >= abs(n.x);
    float outside = 0.0;
    if (alongX) {
      outside = max(bmin.x - posM.x, posM.x - bmax.x);
      float zc = 0.5 * (bmin.z + bmax.z);
      float halfD = 0.5 * (bmax.z - bmin.z) + 0.30;
      if (abs(posM.z - zc) > halfD) continue;
    } else {
      outside = max(bmin.z - posM.z, posM.z - bmax.z);
      float xc = 0.5 * (bmin.x + bmax.x);
      float halfW = 0.5 * (bmax.x - bmin.x) + 0.30;
      if (abs(posM.x - xc) > halfW) continue;
    }
    if (outside <= 0.0) continue;
    float a = 1.0 - smoothstep(0.0, coneW, outside);
    a = pow(a, 1.22);
    a *= mix(1.0, 0.40, ty);
    lit = min(lit, 1.0 - 0.88 * a);
  }
  return lit;
}

vec2 wallPlasterUv(vec3 posM, vec3 n) {
  vec3 an = abs(n);
  if (an.x >= an.y && an.x >= an.z) return posM.yz / wallPlasterTileM;
  if (an.y >= an.z) return posM.xz / wallPlasterTileM;
  return posM.xy / wallPlasterTileM;
}

vec3 applyWallPlasterNormal(vec3 n, vec3 posM) {
  if (wallPlasterEnabled < 0.5 || wallPlasterTileM < 0.01) return n;
  if (wallNormalMapEnabled < 0.5) return n;
  vec2 uv = wallPlasterUv(posM, n);
  vec3 mapN = texture(wallNormalMap, uv).xyz * 2.0 - 1.0;
  mapN.xy *= wallNormalScale;
  vec3 dpdx = dFdx(posM);
  vec3 dpdy = dFdy(posM);
  vec3 t = normalize(dpdx - n * dot(n, dpdx));
  vec3 b = normalize(cross(n, t));
  return normalize(mat3(t, b, n) * mapN);
}

/**
 * Порт фильтра теней кухонного планировщика IKEA (их бандл, USE_SHADOWMAP_TYPE_PCF_VOGEL):
 * vogelDiskSample + interleavedGradientNoise, staticShadowMapSampleCount = 16,
 * shadowMapKernelRadius = 2. Их исходник: docs/ikea-kitchen-shadow-dump/ikea-static-shadow.glsl.
 * Три выборки, которые были здесь до этого, давали ступенчатый край на стене.
 */
const float SPOT_SHADOW_VOGEL_SAMPLES = 16.0;

vec2 vogelDiskSample(float sampleIndex, float samplesCount, float phi) {
  const float GoldenAngle = 2.4;
  float r = sqrt(sampleIndex + 0.5) / sqrt(samplesCount);
  float theta = sampleIndex * GoldenAngle + phi;
  return vec2(r * cos(theta), r * sin(theta));
}

float interleavedGradientNoise(vec2 position_screen) {
  const vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
  return fract(magic.z * fract(dot(position_screen, magic.xy)));
}

float getSpotShadow(vec3 worldPosMm) {
  if (spotShadowEnabled < 0.5) return 1.0;
  float shadow = 1.0;
  vec3 pcfOffset = vec3(spotShadowInvSize.x * spotShadowPcfScale, spotShadowInvSize.y * spotShadowPcfScale, 0.0);
  vec4 shadowProjected = spotShadowViewProj * vec4(worldPosMm, 1.0);
  shadowProjected.xyz /= shadowProjected.w;
  shadowProjected.xy = shadowProjected.xy * 0.5 + 0.5;
  if (
    shadowProjected.w >= 0.0 &&
    clamp(shadowProjected.xy, 0.0, 1.0) == shadowProjected.xy &&
    shadowProjected.z >= -1.0
  ) {
    shadowProjected.xy =
      shadowProjected.xy * spotShadowAtlasViewportBias.z + spotShadowAtlasViewportBias.xy;
    float compareZ =
      min(1.0, shadowProjected.z * 0.5 + 0.5 - spotShadowAtlasViewportBias.w);
    vec2 uv = shadowProjected.xy;
    const float twoPi = 6.2831853072;
    /** Фаза диска — их interleavedGradientNoise от координаты в карте. Слагаемое
     *  shadowSamplingJitter: у нас кадры копятся, и остаточная корреляция усредняется. */
    float phi = interleavedGradientNoise(uv) * twoPi + shadowSamplingJitter.x * twoPi;
    shadow = 0.0;
    for (float i = 0.0; i < SPOT_SHADOW_VOGEL_SAMPLES; i += 1.0) {
      vec2 offset = vogelDiskSample(i, SPOT_SHADOW_VOGEL_SAMPLES, phi) * pcfOffset.xy;
      shadow += texture(spotShadowMap, vec3(uv + offset, compareZ));
    }
    shadow *= 1.0 / SPOT_SHADOW_VOGEL_SAMPLES;
  }
  return shadow;
}

float computeSoftAoIbl(vec3 posM, vec3 n, vec2 xzM) {
  if (softAoEnabled < 0.5) return 1.0;
  vec2 rawUv = (xzM - blurredHeightmapViewportM.xy) / blurredHeightmapViewportM.zw;
  vec2 ssUv = clamp(rawUv, 0.0, 1.0);
  ssUv.y = 1.0 - ssUv.y;
  /** Dump Soft AO — no n.y skip, bias 0 (IKEA-betrakta-pbr-soft-spot-sot-20260826). */
  float softShadowValue = texture(blurredHeightmap, ssUv).r;
  float nt = n.y * 0.5 + 0.5;
  float k = mix(0.01, 2.5, nt * nt);
  float ao = 1.0;
  ao *= 0.4 + 0.6 * exp(-k * max(0.0, softShadowValue - posM.y - 0.0));
  ao *= ao;
  const float aoIntensity = 1.0;
  ao = mix(1.0, ao, aoIntensity);
  if (ssUv.x == 0.0 || ssUv.x == 1.0 || ssUv.y == 0.0 || ssUv.y == 1.0) ao = 0.0;
  return ao;
}

vec3 parallaxCorrectNormal(vec3 vertexPos, vec3 origVec, vec3 cubePos, vec3 cubeSize) {
  vec3 invOrigVec = vec3(1.0) / origVec;
  vec3 halfSize = cubeSize * 0.5;
  vec3 intersecAtMaxPlane = (cubePos + halfSize - vertexPos) * invOrigVec;
  vec3 intersecAtMinPlane = (cubePos - halfSize - vertexPos) * invOrigVec;
  vec3 largestIntersec = max(intersecAtMaxPlane, intersecAtMinPlane);
  float distance = min(min(largestIntersec.x, largestIntersec.y), largestIntersec.z);
  vec3 intersectPositionWS = vertexPos + origVec * distance;
  return intersectPositionWS - cubePos;
}

vec3 sampleEnvironmentSpecular(vec3 worldPosM, vec3 Wi, float perceptualRoughness) {
  vec3 N = parallaxCorrectNormal(worldPosM, Wi, envMapCenterM, envMapSizeM);
  N = normalize(envRot * N);
  float lod = perceptualRoughness * envMapMipLevels;
  return textureLod(environmentMap, N, lod).rgb * envMapIntensity;
}

vec2 environmentBRDFApproximation(float perceptualRoughness, float NdotV) {
  const vec4 c0 = vec4(-1.0, -0.0275, -0.572, 0.022);
  const vec4 c1 = vec4(1.0, 0.0425, 1.04, -0.04);
  vec4 r = perceptualRoughness * c0 + c1;
  float a004 = min(r.x * r.x, exp2(-9.28 * NdotV)) * r.x + r.y;
  vec2 AB = vec2(-1.04, 1.04) * a004 + r.zw;
  return max(vec2(0.0), AB);
}

vec3 iblFresnel(vec3 N, vec3 Wo, float perceptualRoughness, vec3 F0) {
  float NdotV = max(0.0, dot(N, Wo));
  vec2 envBrdf = environmentBRDFApproximation(perceptualRoughness, NdotV);
  vec3 F90m0 = max(vec3(1.0 - perceptualRoughness), F0) - F0;
  vec3 F = F0 + F90m0 * pow(1.0 - NdotV, 5.0);
  vec3 FssEss = F * envBrdf.x + envBrdf.y;
  float Ems = 1.0 - envBrdf.x - envBrdf.y;
  vec3 Favg = F0 + (1.0 - F0) / 21.0;
  vec3 FavgEms = Favg * Ems;
  vec3 ms = FssEss * (FavgEms / (1.0 - FavgEms));
  return FssEss + ms;
}

float computeHorizonOcclusion(vec3 posM, vec3 Wi) {
  vec3 X = dFdx(posM);
  vec3 Y = dFdy(posM);
  vec3 geometricNormal = cross(X, Y);
  float Nl = length(geometricNormal);
  if (Nl > 0.001) geometricNormal /= Nl;
  float horizonOcclusion = clamp(1.0 + 1.1 * dot(Wi, geometricNormal), 0.0, 1.0);
  return horizonOcclusion * horizonOcclusion;
}

/** Dump betrakta_material_renderer — per-pixel Wo (not uniform cameraPosM). */
vec3 computeWoFromFragCoord(vec3 surfacePosMm) {
  vec4 projectedCameraPosition = inverseViewProjection * vec4(
    gl_FragCoord.xy * inverseViewportSize * 2.0 - vec2(1.0),
    -1.0,
    1.0
  );
  vec3 cameraPosMm = projectedCameraPosition.xyz / max(projectedCameraPosition.w, 1e-6);
  vec3 wo = cameraPosMm - surfacePosMm;
  float wl = length(wo);
  if (wl < 1e-6) {
    return normalize(cameraPosM * ${(1 / MM_TO_M).toFixed(1)} - surfacePosMm);
  }
  return wo / wl;
}

vec3 computeIblCore(vec3 posM, vec3 n, vec3 nEnv, vec3 albedo, float ao, float metalness, vec3 Wo) {
  /** Phase < 5: spec env off — metal иначе чёрный (diffuse×(1-metalness)=0). До iblSpec — lit diffuse. */
  float metalForDiffuse = metalness * step(0.5, iblSpecEnabled);
  vec3 diffuseAlbedo = albedo * (1.0 - metalForDiffuse);
  /**
   * Без 1/π: shCoeffs дампа — preScaled SH, т.е. уже яркость, а не облучённость.
   * Проверено измерением: потолок освещён только IBL (Spot смотрит вниз), и он
   * даёт 192 при SoT 179 — в допуске. С делением на π потолок ушёл в 114, шкаф
   * потемнел. Не добавлять albedo/π сюда повторно.
   */
  vec3 iblDiffuse = computeEnvironmentIrradiance(nEnv) * envMapIntensity * diffuseAlbedo * iblDiffuseSurfaceScale;
  if (iblSpecEnabled < 0.5) return iblDiffuse * ao;
  /** Floor herringbone rough=1: spec mip≈diffuse; fresnel→1 raw spec blew ODT (r3j). */
  if (metalness < 0.5 && roughness >= 0.999) return iblDiffuse * ao;
  vec3 Wi = reflect(-Wo, n);
  float horizonOcclusion = computeHorizonOcclusion(posM, Wi);
  vec3 iblSpecular = horizonOcclusion * sampleEnvironmentSpecular(posM, Wi, roughness);
  vec3 F0 = mix(vec3(0.04), albedo, metalness);
  vec3 fresnel = iblFresnel(n, Wo, roughness, F0);
  vec3 specMix = fresnel * min(iblSpecSurfaceScale, 1.0);
  /** IKEA ibl dielectric: mix(diffuse, spec) — spec must not bypass albedo at rough≈1 (floor herringbone). */
  vec3 iblDielectric = mix(iblDiffuse, iblSpecular * diffuseAlbedo, specMix);
  vec3 iblConductor = iblSpecular * fresnel;
  vec3 iblLit = mix(iblDielectric, iblConductor, metalness);
  return iblLit * ao;
}

/** Dump betrakta_color_management — ACES input / inverse (RRT pack). */
vec3 sRGBtoRRT(vec3 linear) {
  const mat3 ACESInputMatrix = mat3(
    vec3(0.59719, 0.07600, 0.02840),
    vec3(0.35458, 0.90834, 0.13383),
    vec3(0.04823, 0.01566, 0.83777)
  );
  return ACESInputMatrix * linear;
}

vec3 RRTtoSRGB(vec3 rrt) {
  const mat3 inverseACESInputMatrix = mat3(
    vec3(1.764740972036125, -0.1470278520323784, -0.03633683011844868),
    vec3(-0.6757776782442766, 1.1602515117121115, -0.1624364369102432),
    vec3(-0.08896329379184853, -0.013223659679733168, 1.1987732670286917)
  );
  return inverseACESInputMatrix * rrt;
}

/** Dump ditherR11G11B10F — betrakta_color_management (before HDR FB write). */
float betraktaR2(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}
vec3 ditherR11G11B10F(vec3 color) {
  float dither = betraktaR2(gl_FragCoord.xy) * 2.0 - 1.0;
  vec3 quantum = exp2(floor(log2(max(color, vec3(1e-6)))) - vec3(6.0, 6.0, 5.0));
  return color + quantum * dither;
}

/**
 * Dump HDR FB (#else): ×exposure → sRGBtoRRT → ditherR11G11B10F → min(65000).
 * screenCal dump UBO = 1 (p8z141). LDR fallback: linear × exposure.
 */
vec3 betraktaOutputColor(vec3 linearHdr) {
  if (betraktaOutputEnabled < 0.5) return linearHdr * screenCal;
  if (hdrFramebufferWrite < 0.5) {
    return linearHdr * screenCal * exposure;
  }
  vec3 color = linearHdr * exposure * screenCal;
  color = sRGBtoRRT(color);
  color = ditherR11G11B10F(color);
  return min(color, vec3(65000.0));
}

/** ShaderMaterial: SRGBColorSpace maps are not auto-decoded — must convert before lighting. */
vec3 mapSampleLinear(vec2 uv) {
  vec3 srgb = texture(albedoMap, uv).rgb;
  bvec3 cutoff = lessThan(srgb, vec3(0.04045));
  vec3 lower = srgb / vec3(12.92);
  vec3 higher = pow((srgb + vec3(0.055)) / vec3(1.055), vec3(2.4));
  return mix(higher, lower, cutoff);
}

vec3 cavitySafeNormalize(vec3 v) {
  float l = length(v);
  return l > 1e-9 ? v / l : vec3(0.0);
}

/**
 * НЕ ВЫЗЫВАЕТСЯ с r3j75: модель полости перешла на плоский уровень + складки (пипетка IKEA
 * показала бок ровным по всей глубине, см. CAVITY_INTERIOR_LEVEL). Оставлено как готовая
 * реализация однократного отражения, если вернёмся к ff-скату.
 *
 * Lambert form factor: доля полусферы над (p, n), закрытая четырёхугольником проёма.
 * Формула по рёбрам верна только для полигона ЦЕЛИКОМ над касательной плоскостью, поэтому
 * сначала обрезаем его по горизонту dot(n, r) >= 0 (Sutherland–Hodgman, 4 → до 5 вершин).
 * Без обрезки высокий проём давал у горизонтальных поверхностей ровно 0 (часть ниже горизонта
 * вычитала часть выше) — r3j71: чёрные верх и низ полок. Модуль снимает зависимость от обхода.
 */
float cavityApertureFormFactor(vec3 p, vec3 n, vec3 q0, vec3 q1, vec3 q2, vec3 q3) {
  vec3 src[4];
  src[0] = q0 - p;
  src[1] = q1 - p;
  src[2] = q2 - p;
  src[3] = q3 - p;
  vec3 poly[5];
  int cnt = 0;
  for (int i = 0; i < 4; i++) {
    vec3 a = src[i];
    vec3 b = src[i == 3 ? 0 : i + 1];
    float da = dot(n, a);
    float db = dot(n, b);
    if (da >= 0.0 && cnt < 5) {
      poly[cnt] = a;
      cnt++;
    }
    if ((da >= 0.0) != (db >= 0.0) && cnt < 5) {
      poly[cnt] = mix(a, b, da / (da - db));
      cnt++;
    }
  }
  if (cnt < 3) return 0.0;
  float f = 0.0;
  for (int i = 0; i < cnt; i++) {
    vec3 a = poly[i];
    vec3 b = poly[i + 1 == cnt ? 0 : i + 1];
    f += acos(clamp(dot(cavitySafeNormalize(a), cavitySafeNormalize(b)), -1.0, 1.0))
      * dot(n, cavitySafeNormalize(cross(a, b)));
  }
  return clamp(abs(f) / 6.283185307179586, 0.0, 1.0);
}

/** Грань внутри полости шкафа (не внешняя оболочка) — та же проверка shell, что в occlusion. */
bool cabinetCavityInteriorFace(vec3 posMm, vec3 nWorld) {
  if (cavityOccEnabled < 0.5) return false;
  vec3 p = (cavityWorldToLocal * vec4(posMm, 1.0)).xyz;
  vec3 n = cavitySafeNormalize(mat3(cavityWorldToLocal) * nWorld);
  if (dot(n, n) < 0.5) return false;
  if (any(lessThan(p, cavityBoxMin)) || any(greaterThan(p, cavityBoxMax))) return false;
  float margin = ${CAVITY_INSIDE_MARGIN_MM.toFixed(1)};
  vec3 shell = step(p - cavityBoxMin, vec3(margin)) * step(n, vec3(-0.5))
    + step(cavityBoxMax - p, vec3(margin)) * step(vec3(0.5), n);
  return max(max(shell.x, shell.y), shell.z) < 0.5;
}

/**
 * Внутренняя стенка отсека: прямой свет Spot доходит только сквозь открытый фронт. Луч к лампе
 * пересекаем с плоскостью проёма — полки не участвуют (нет полос), а верх/боковины корпуса
 * закрывают свет как в жизни.
 */
float cabinetCavityOpeningLit(vec3 posMm) {
  if (cavityOccEnabled < 0.5) return 1.0;
  vec3 p = (cavityWorldToLocal * vec4(posMm, 1.0)).xyz;
  vec3 l = (cavityWorldToLocal * vec4(spotPosM * 1000.0, 1.0)).xyz;
  vec3 mask = cavityFrontAxis < 0.5 ? vec3(1.0, 0.0, 0.0)
    : (cavityFrontAxis < 1.5 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0));
  float front = dot(cavityFrontSign > 0.0 ? cavityBoxMax : cavityBoxMin, mask);
  float dA = dot(l - p, mask);
  if (dA * cavityFrontSign <= 1e-3) return 0.0;
  float tf = (front - dot(p, mask)) / dA;
  if (tf >= 1.0) return 1.0;
  vec3 q = p + (l - p) * max(tf, 0.0);
  vec3 dm = min(q - cavityBoxMin, cavityBoxMax - q) - ${CAVITY_INSIDE_MARGIN_MM.toFixed(1)};
  dm = mix(dm, vec3(1e6), mask);
  float s = min(dm.x, min(dm.y, dm.z));
  return smoothstep(-12.0, 12.0, s);
}

/**
 * Освещённость от отрезка-источника q(s) = base + s·t, s ∈ [s0, s1] (мм), излучающего в
 * полупространство e с кривой силы света I(θ) = cos^m θ (m из угла луча; m = 1 — ламберт,
 * 120°). Замена u = D·tan φ делает подынтегральное гладким: dE = I(θ)·cosR / D · dφ.
 * Пределы режутся горизонтом приёмника. Нормировка (m+1)/2 держит поток при сужении луча.
 * Результат в единицах I на метр длины (координаты в мм → м).
 */
float ledLineIrradiance(vec3 p, vec3 n, vec3 base, vec3 t, float s0, float s1, vec3 e, float m) {
  vec3 c = (base - p) * 0.001;
  float ct = dot(c, t);
  vec3 dPerp = c - t * ct;
  float cosEN = -dot(dPerp, e);
  if (cosEN <= 0.0) return 0.0;
  float D2 = max(dot(dPerp, dPerp), 1e-6);
  float D = sqrt(D2);
  float nd = dot(n, dPerp);
  float nh = dot(n, t);
  float u0 = s0 * 0.001 + ct;
  float u1 = s1 * 0.001 + ct;
  if (abs(nh) > 1e-4) {
    float uz = -nd / nh;
    if (nh > 0.0) u0 = max(u0, uz);
    else u1 = min(u1, uz);
  } else if (nd <= 0.0) {
    return 0.0;
  }
  if (u1 <= u0) return 0.0;
  float p0 = atan(u0 / D);
  float p1 = atan(u1 / D);
  float dp = (p1 - p0) / ${LED_LINE_SAMPLES}.0;
  float cosE0 = cosEN / D;
  float acc = 0.0;
  for (int k = 0; k < ${LED_LINE_SAMPLES}; k++) {
    float ph = p0 + (float(k) + 0.5) * dp;
    float cp = cos(ph);
    float sp = sin(ph);
    float cosTheta = cosE0 * cp;
    float cosR = (nd * cp + D * nh * sp) / D;
    acc += pow(max(cosTheta, 0.0), m) * max(cosR, 0.0);
  }
  return acc * dp / D * (m + 1.0) * 0.5;
}

/**
 * LED в боковинах отсека: отсек ищется так же, как в cabinetCavityOcclusion (плиты-блокировщики),
 * поэтому свет не проходит сквозь полки и стойки. Две вертикальные ленты — у левой и правой
 * грани отсека на ledInsetMm от фронта; сторона и параметры — из ledConfig шкафа.
 */
vec3 cabinetLedRadiance(vec3 posMm, vec3 nWorld, vec3 albedo) {
  if (ledEnabled < 0.5 || cavityOccEnabled < 0.5 || ledMode > 1.5) return vec3(0.0);
  vec3 p = (cavityWorldToLocal * vec4(posMm, 1.0)).xyz;
  vec3 n = cavitySafeNormalize(mat3(cavityWorldToLocal) * nWorld);
  if (dot(n, n) < 0.5) return vec3(0.0);
  float margin = ${CAVITY_INSIDE_MARGIN_MM.toFixed(1)};
  if (any(lessThan(p, cavityBoxMin)) || any(greaterThan(p, cavityBoxMax))) return vec3(0.0);
  vec3 shell = step(p - cavityBoxMin, vec3(margin)) * step(n, vec3(-0.5))
    + step(cavityBoxMax - p, vec3(margin)) * step(vec3(0.5), n);
  if (max(max(shell.x, shell.y), shell.z) > 0.5) return vec3(0.0);
  vec3 mask;
  vec3 ax1;
  vec3 ax2;
  if (cavityFrontAxis < 0.5) {
    mask = vec3(1.0, 0.0, 0.0);
    ax1 = vec3(0.0, 1.0, 0.0);
    ax2 = vec3(0.0, 0.0, 1.0);
  } else if (cavityFrontAxis < 1.5) {
    mask = vec3(0.0, 1.0, 0.0);
    ax1 = vec3(1.0, 0.0, 0.0);
    ax2 = vec3(0.0, 0.0, 1.0);
  } else {
    mask = vec3(0.0, 0.0, 1.0);
    ax1 = vec3(1.0, 0.0, 0.0);
    ax2 = vec3(0.0, 1.0, 0.0);
  }
  float pa = dot(p, ax1);
  float pb = dot(p, ax2);
  float aLo = dot(cavityBoxMin, ax1) + margin;
  float aHi = dot(cavityBoxMax, ax1) - margin;
  float bLo = dot(cavityBoxMin, ax2) + margin;
  float bHi = dot(cavityBoxMax, ax2) - margin;
  for (int i = 0; i < 12; i++) {
    if (i >= cavityBlockACount) break;
    float v = cavityBlockA[i];
    if (v < pa) aLo = max(aLo, v);
    else aHi = min(aHi, v);
  }
  for (int i = 0; i < 12; i++) {
    if (i >= cavityBlockBCount) break;
    float v = cavityBlockB[i];
    if (v < pb) bLo = max(bLo, v);
    else bHi = min(bHi, v);
  }
  if (aHi - aLo < 1.0 || bHi - bLo < 1.0) return vec3(0.0);
  vec3 upLocal = cavitySafeNormalize(mat3(cavityWorldToLocal) * vec3(0.0, 1.0, 0.0));
  bool ax1Up = abs(dot(ax1, upLocal)) > abs(dot(ax2, upLocal));
  vec3 wAx = ax1Up ? ax2 : ax1;
  vec3 hAx = ax1Up ? ax1 : ax2;
  float wLo = ax1Up ? bLo : aLo;
  float wHi = ax1Up ? bHi : aHi;
  float hLo = ax1Up ? aLo : bLo;
  float hHi = ax1Up ? aHi : bHi;
  float off = ${LED_FACE_OFFSET_MM.toFixed(1)};
  if (hHi - hLo < 1.0) return vec3(0.0);
  float frontCoord = dot(cavityFrontSign > 0.0 ? cavityBoxMax : cavityBoxMin, mask);
  float backCoord = dot(cavityFrontSign > 0.0 ? cavityBoxMin : cavityBoxMax, mask);
  float depthMm = abs(frontCoord - backCoord);
  float insetMm = clamp(ledInsetMm, ledHalfWidthMm + 2.0, max(depthMm - ledHalfWidthMm - 2.0, ledHalfWidthMm + 2.0));
  float ledD = frontCoord - cavityFrontSign * insetMm;
  vec3 frontDir = mask * cavityFrontSign;
  float pw = dot(p, wAx);
  float ph = dot(p, hAx);
  float pd = dot(p, mask);
  float sumE = 0.0;
  float stripLenM = 0.0;
  if (ledMode < 0.5) {
    /** Вертикальный профиль в боковинах; лево/право со стороны фасада: right = up × front. */
    vec3 rightLocal = cross(upLocal, frontDir);
    bool loIsLeft = dot(wAx, rightLocal) > 0.0;
    float onLo = loIsLeft ? ledSides.x : ledSides.y;
    float onHi = loIsLeft ? ledSides.y : ledSides.x;
    if (onLo < 0.5 && onHi < 0.5) return vec3(0.0);
    float nw = dot(n, wAx);
    if (abs(pd - ledD) < ledHalfWidthMm) {
      if ((onLo > 0.5 && nw > 0.7 && pw - wLo < off + 6.0) || (onHi > 0.5 && nw < -0.7 && wHi - pw < off + 6.0)) {
        return ledColor * ledEmission;
      }
    }
    for (int s = 0; s < 2; s++) {
      float on = s == 0 ? onLo : onHi;
      if (on < 0.5) continue;
      float sw = s == 0 ? wLo : wHi;
      vec3 e = wAx * (s == 0 ? 1.0 : -1.0);
      stripLenM += (hHi - hLo) * 0.001;
      sumE += ledLineIrradiance(p, n, wAx * sw + mask * ledD, hAx, hLo, hHi, e, ledBeamM);
    }
  } else {
    /** Горизонтальный профиль под потолком отсека (под полкой/крышкой), светит вниз. */
    bool hUp = dot(hAx, upLocal) > 0.0;
    float hTop = hUp ? hHi : hLo;
    vec3 e = hAx * (hUp ? -1.0 : 1.0);
    float nTop = dot(n, e);
    if (abs(pd - ledD) < ledHalfWidthMm && nTop > 0.7 && abs(ph - hTop) < off + 6.0) {
      return ledColor * ledEmission;
    }
    stripLenM = (wHi - wLo) * 0.001;
    sumE = ledLineIrradiance(p, n, hAx * hTop + mask * ledD, wAx, wLo, wHi, e, ledBeamM);
  }
  /**
   * Переотражение белого отсека (интегрирующая сфера): E = Φρ / (A·(1-ρ) + A_open),
   * Φ = π·I·L — поток ламбертовой линии; открытый фронт — поглотитель.
   */
  float wM = (wHi - wLo) * 0.001;
  float hM = (hHi - hLo) * 0.001;
  float dM = depthMm * 0.001;
  float aOpen = wM * hM;
  float aWalls = 2.0 * (wM * dM + hM * dM) + wM * hM;
  float rho = ${LED_BOUNCE_RHO.toFixed(3)};
  float eFill = 3.1415926536 * stripLenM * rho / max(aWalls * (1.0 - rho) + aOpen, 1e-4);
  return albedo / 3.1415926536 * ledColor * (ledIntensity * (sumE + eFill));
}

/**
 * Профиль под дном навесного шкафа: мировые отрезки, светят вниз на всё, что ниже
 * (столешница, стена, нижние модули). Нижняя грань дна у полосы — сам диффузор.
 */
vec3 underCabinetLedRadiance(vec3 posMm, vec3 nWorld, vec3 albedo) {
  vec3 sum = vec3(0.0);
  for (int i = 0; i < ${LED_UNDER_MAX}; i++) {
    if (i >= ledUnderCount) break;
    vec3 a = ledUnderA[i];
    vec3 b = ledUnderB[i];
    vec3 ab = b - a;
    float len = length(ab);
    if (len < 1.0) continue;
    vec3 t = ab / len;
    vec3 e = vec3(0.0, -1.0, 0.0);
    float s = dot(posMm - a, t);
    vec3 perp = posMm - a - t * s;
    if (nWorld.y < -0.7 && abs(perp.y) < 3.0 && length(perp) < ledUnderHalfW[i] && s > 0.0 && s < len) {
      sum += ledUnderEmission[i];
      continue;
    }
    if (posMm.y > a.y - 1.0) continue;
    float E = ledLineIrradiance(posMm, nWorld, a, t, 0.0, len, e, ledUnderBeamM[i]);
    sum += albedo / 3.1415926536 * ledUnderColor[i] * E;
  }
  return sum;
}

/** Dump-слот occlusion для параметрического корпуса: уровень полости + складки в стыках. */
float cabinetCavityOcclusion(vec3 posMm, vec3 nWorld) {
  if (cavityOccEnabled < 0.5) return 1.0;
  vec3 p = (cavityWorldToLocal * vec4(posMm, 1.0)).xyz;
  vec3 n = cavitySafeNormalize(mat3(cavityWorldToLocal) * nWorld);
  if (dot(n, n) < 0.5) return 1.0;
  float margin = ${CAVITY_INSIDE_MARGIN_MM.toFixed(1)};
  /** Вне бокса полости нет: выехавший ящик светится полностью (поведение r3j73). */
  if (any(lessThan(p, cavityBoxMin)) || any(greaterThan(p, cavityBoxMax))) return 1.0;
  /**
   * Внешние грани оболочки лежат на AABB, но отбраковывать их по одному расстоянию нельзя.
   * Порог margin рассчитан на плиту 16 мм, а задник — HDF тоньше margin, поэтому под порог
   * попадала и его ВНУТРЕННЯЯ грань: весь задник выходил из слоя с occlusion 1. Отсюда и
   * отсутствие на нём складок от бока и полок — при creaseMin 0.3 и ширине 300 мм он оставался
   * идеально ровным (проверка ручкой r3j75). Грань внешняя только если лежит у грани бокса
   * И нормаль смотрит наружу через ЭТУ ЖЕ грань — тогда толщина плиты не участвует вовсе.
   */
  vec3 shell = step(p - cavityBoxMin, vec3(margin)) * step(n, vec3(-0.5))
    + step(cavityBoxMax - p, vec3(margin)) * step(vec3(0.5), n);
  if (max(max(shell.x, shell.y), shell.z) > 0.5) return 1.0;
  vec3 mask;
  vec3 ax1;
  vec3 ax2;
  if (cavityFrontAxis < 0.5) {
    mask = vec3(1.0, 0.0, 0.0);
    ax1 = vec3(0.0, 1.0, 0.0);
    ax2 = vec3(0.0, 0.0, 1.0);
  } else if (cavityFrontAxis < 1.5) {
    mask = vec3(0.0, 1.0, 0.0);
    ax1 = vec3(1.0, 0.0, 0.0);
    ax2 = vec3(0.0, 0.0, 1.0);
  } else {
    mask = vec3(0.0, 0.0, 1.0);
    ax1 = vec3(1.0, 0.0, 0.0);
    ax2 = vec3(0.0, 1.0, 0.0);
  }
  /** Отсек точки: от бокса внутрь до ближайших перекрывающих плит с каждой стороны. */
  float pa = dot(p, ax1);
  float pb = dot(p, ax2);
  /** Границы полости, а не оболочки: складку мерим от внутренней грани плиты, иначе полоса
   *  в углу начинается на толщину плиты раньше и выходит слабее (175→165 вместо 175→154). */
  float aLo = dot(cavityBoxMin, ax1) + margin;
  float aHi = dot(cavityBoxMax, ax1) - margin;
  float bLo = dot(cavityBoxMin, ax2) + margin;
  float bHi = dot(cavityBoxMax, ax2) - margin;
  for (int i = 0; i < 12; i++) {
    if (i >= cavityBlockACount) break;
    float v = cavityBlockA[i];
    if (v < pa) aLo = max(aLo, v);
    else aHi = min(aHi, v);
  }
  for (int i = 0; i < 12; i++) {
    if (i >= cavityBlockBCount) break;
    float v = cavityBlockB[i];
    if (v < pb) bLo = max(bLo, v);
    else bHi = min(bHi, v);
  }
  if (aHi - aLo < 1.0 || bHi - bLo < 1.0) return 1.0;
  /**
   * Уровень полости плоский, затемняют только складки — расстояние до ближайшей плиты отсека
   * по каждой из трёх осей. Своя плоскость исключается весом 1 - |dot(n, axis)|: точка на боку
   * лежит НА плите ax-пары и от неё темнеть не должна, но с задником и полками образует стык —
   * вертикальная полоса в углу бок-задник берётся именно из складки по mask.
   */
  float backCoord = dot(cavityFrontSign > 0.0 ? cavityBoxMin : cavityBoxMax, mask)
    + cavityFrontSign * margin;
  float w = max(cavityCreaseWidthMm, 1.0);
  float cA = mix(cavityCreaseMin, 1.0, clamp(min(pa - aLo, aHi - pa) / w, 0.0, 1.0));
  float cB = mix(cavityCreaseMin, 1.0, clamp(min(pb - bLo, bHi - pb) / w, 0.0, 1.0));
  float cBack = mix(cavityCreaseMin, 1.0, clamp(abs(dot(p, mask) - backCoord) / w, 0.0, 1.0));
  float crease = mix(1.0, cA, 1.0 - abs(dot(n, ax1)))
    * mix(1.0, cB, 1.0 - abs(dot(n, ax2)))
    * mix(1.0, cBack, 1.0 - abs(dot(n, mask)));
  /** Верх полки у них ярче вертикали в 1.87 раза, IBL сам даёт 1.11 — разницу несёт уровень. */
  vec3 upLocal = cavitySafeNormalize(mat3(cavityWorldToLocal) * vec3(0.0, 1.0, 0.0));
  float level = mix(cavityInteriorLevel, cavityInteriorLevelUp, clamp(dot(n, upLocal), 0.0, 1.0));
  float occ = level * crease;
  return clamp(1.0 + cavityOccStrength * (occ - 1.0), 0.0, 1.0);
}

/**
 * Затемнение у собственной кромки панели. Грань определяем по доминирующей оси нормали в
 * object space, расстояние мерим по двум осям, лежащим В этой грани: ось нормали исключена,
 * иначе расстояние равнялось бы половине толщины плиты и полоса залила бы панель целиком.
 * Так одна формула работает и на фасаде, и на обкладе, и на плите любого размера.
 */
/**
 * Фасад: 1 у кромки → 0 к середине (полоса FACADE_SHADOW_RIM_MM). Тень Spot на фасаде берётся
 * только в этой полосе — контур от корпуса остаётся, а полки за фасадом не проступают.
 */
float panelShadowRim() {
  if (panelShadowRimEnabled < 0.5) return 1.0;
  vec3 an = abs(vObjNormal);
  float amax = max(an.x, max(an.y, an.z));
  if (amax < 1e-4) return 1.0;
  vec3 inFace = 1.0 - step(amax - 1e-4, an);
  vec3 d = min(vObjPos - panelBoxMin, panelBoxMax - vObjPos);
  vec3 t = clamp(d / max(panelShadowRimObj, vec3(1e-6)), 0.0, 1.0);
  vec3 tf = mix(vec3(1.0), t, inFace);
  float tMin = min(tf.x, min(tf.y, tf.z));
  return 1.0 - smoothstep(0.0, 1.0, tMin);
}

float panelEdgeOcclusion() {
  if (panelEdgeAoEnabled < 0.5) return 1.0;
  vec3 an = abs(vObjNormal);
  float amax = max(an.x, max(an.y, an.z));
  if (amax < 1e-4) return 1.0;
  vec3 inFace = 1.0 - step(amax - 1e-4, an);
  vec3 d = min(vObjPos - panelBoxMin, panelBoxMax - vObjPos);
  vec3 t = clamp(d / max(panelEdgeWidthObj, vec3(1e-6)), 0.0, 1.0);
  /** Оси вне грани не участвуют — им ставим 1, чтобы не влияли на min. */
  vec3 tf = mix(vec3(1.0), t, inFace);
  float tMin = min(tf.x, min(tf.y, tf.z));
  return mix(panelEdgeAoMin, 1.0, tMin);
}

void main() {
  vec3 n = normalize(vWorldNormal);

  vec3 albedo = diffuse;
  vec3 posM = vWorldPos * ${MM_TO_M.toFixed(6)};
  bool useFloorMap = floorMapWorldUv > 0.5;
  bool useMeshMap = !useFloorMap && hasAlbedoMap > 0.5;
  if (useFloorMap || useMeshMap) {
    vec2 mapUv = vUv;
    if (useFloorMap) {
      vec2 uvWorld = posM.xz / floorMapTileM;
      mapUv = fract(uvWorld);
      mapUv.y = 1.0 - mapUv.y;
    }
    albedo *= mapSampleLinear(mapUv);
    if (useFloorMap && floorAlbedoSat < 0.999) {
      float luma = dot(albedo, vec3(0.2126, 0.7152, 0.0722));
      albedo = mix(vec3(luma), albedo, floorAlbedoSat);
    }
    if (floorAlbedoTintEnabled > 0.5) {
      albedo *= floorAlbedoTint;
    }
  }
  if (floorAlbedoGpuProbe > 0.5) {
    if (floorMapWorldUv > 0.5) {
      float albLum = dot(albedo, vec3(0.2126, 0.7152, 0.0722));
      fragColor = vec4(vec3(clamp(albLum, 0.0, 1.0)), 1.0);
      return;
    }
    fragColor = vec4(vec3(0.0), 1.0);
    return;
  }
  if (wallPlasterEnabled > 0.5) {
    n = applyWallPlasterNormal(n, posM);
  }
  vec3 nEnv = normalize(envRot * n);
  vec3 Wo = computeWoFromFragCoord(vWorldPos);
  if (n.y > 0.9) {
    vec3 camMm = cameraPosM / ${MM_TO_M.toFixed(6)};
    Wo = normalize(camMm - vWorldPos);
  }
  float ao = computeSoftAoIbl(posM, n, posM.xz);
  /** Dump: occlusion множит ibl рядом с Soft AO и не касается Spot (:1080). */
  ao *= cabinetCavityOcclusion(vWorldPos, n);
  /** Кромка идёт в тот же канал occlusion: у IKEA это один occlusion_sampler, не второй свет. */
  ao *= panelEdgeOcclusion();
  float spotSh = 1.0;
  /**
   * Корпус/задник (receive 2): внутренние боковины и задник отсека тень Spot не берут — там
   * cavity occlusion. Снаружи тень есть (контур), но точка выборки сдвинута по нормали на
   * ~1.5 текселя атласа: иначе полки за 16 мм плитой просвечивали полосами наружу.
   */
  bool spotShadowCorpus = spotShadowReceive > 1.5 && spotShadowReceive < 2.5;
  bool spotShadowSkipVertical = spotShadowCorpus && abs(n.y) < 0.7
    && cabinetCavityInteriorFace(vWorldPos, n);
  vec3 spotShadowPos = vWorldPos;
  if (spotShadowCorpus && kitchenDirEnabled < 0.5) {
    float texelMm = distance(vWorldPos, spotPosM * 1000.0)
      * ${(2 * Math.tan((SPOT_SHADOW_FOV_DEG * Math.PI) / 360)).toFixed(4)} * spotShadowInvSize.x;
    spotShadowPos += n * (texelMm * 1.5);
  }
  if (spotShadowReceive > 0.5 && !spotShadowSkipVertical) {
    spotSh = getSpotShadow(spotShadowPos);
    if (spotShadowSpotFloor > 0.001) {
      spotSh = mix(spotShadowSpotFloor, 1.0, spotSh);
    }
  }
  vec3 ibl = computeIblCore(posM, n, nEnv, albedo, ao, metalness, Wo);
  float metalForSpot = metalness * step(0.5, iblSpecEnabled);
  vec3 spotAlbedo = albedo * (1.0 - metalForSpot);
  vec3 spotL;
  vec3 spotIntensity;
  vec3 spot;
  if (kitchenDirEnabled > 0.5) {
    evalDirLightData(n, spotL, spotIntensity);
    spot = evaluateSpotBsdf(spotL, Wo, n, spotAlbedo, roughness, metalForSpot) * spotIntensity;
  } else {
    evalSpotLightData(posM, n, spotL, spotIntensity);
    spot = evaluateSpotBsdf(spotL, Wo, n, spotAlbedo, roughness, metalForSpot) * spotIntensity;
  }
  if (spotShadowReceive > 2.5) {
    spotSh = mix(1.0, spotSh, panelShadowRim());
  }
  if (spotShadowReceive > 0.5 && !spotShadowSkipVertical) {
    spot *= spotSh;
  } else if (spotShadowSkipVertical) {
    spot *= cabinetCavityOpeningLit(vWorldPos);
  }
  vec3 linear = ibl + spot + cabinetLedRadiance(vWorldPos, n, albedo)
    + underCabinetLedRadiance(vWorldPos, n, albedo);
  linear *= surfaceLinearScale;
  /** Phase 3 floor: dump soft plane darkens final linear (p8z64 clean; was spot-only). */
  if (softPlaneEnabled > 0.5) {
    linear *= (1.0 - sampleSoftPlaneAlpha(posM.xz));
  }
  if (spotAttGpuProbe > 0.5) {
    if (floorMapWorldUv > 0.5) {
      vec3 spotLProbe;
      vec3 spotIntensityProbe;
      evalSpotLightData(posM, n, spotLProbe, spotIntensityProbe);
      float attProbe = length(spotIntensityProbe) / max(length(spotColorUbo), 1e-6);
      fragColor = vec4(vec3(clamp(attProbe, 0.0, 1.0)), 1.0);
      return;
    }
    fragColor = vec4(vec3(0.0), 1.0);
    return;
  }
  if (floorTotalLinearGpuProbe > 0.5) {
    if (floorMapWorldUv > 0.5) {
      float totalLum = dot(linear, vec3(0.2126, 0.7152, 0.0722));
      fragColor = vec4(vec3(clamp(totalLum * 120.0, 0.0, 1.0)), 1.0);
      return;
    }
    fragColor = vec4(vec3(0.0), 1.0);
    return;
  }
  if (spotLinearGpuProbe > 0.5) {
    if (floorMapWorldUv > 0.5) {
      vec3 spotLProbe;
      vec3 spotIntensityProbe;
      evalSpotLightData(posM, n, spotLProbe, spotIntensityProbe);
      vec3 spotProbe = evaluateSpotBsdf(spotLProbe, Wo, n, spotAlbedo, roughness, metalForSpot) * spotIntensityProbe;
      float spotLumProbe = dot(spotProbe, vec3(0.2126, 0.7152, 0.0722));
      fragColor = vec4(vec3(clamp(spotLumProbe * 120.0, 0.0, 1.0)), 1.0);
      return;
    }
    fragColor = vec4(vec3(0.0), 1.0);
    return;
  }
  if (debugSpotDisk > 0.5) {
    if (floorMapWorldUv > 0.5) {
      /** Cone attenuation 0–1 (evalSpotLightData), not spot×gain — avoids LDR clip. */
      float att = length(spotIntensity) / max(length(spotColorUbo), 1e-6);
      float v = pow(clamp(att, 0.0, 1.0), 0.55);
      fragColor = vec4(vec3(v), 1.0);
      return;
    }
    fragColor = vec4(vec3(0.12), 1.0);
    return;
  }
  fragColor = vec4(betraktaOutputColor(linear * cabinetGain), 1.0);
}
`;

let _envRot = null;
let _shUniform = null;
let _spotPosWorldMm = null;
let _spotPosM = null;
let _softViewportM = null;
let _softFloorViewportM = null;
let _softViewportMeta = null;
let _softFloorViewportMeta = null;
let _softFootprintM = null;
let _bound = false;
let _softState = null;
let _envSpecState = null;
let _cameraPosM = null;
const _inverseViewProjection = new THREE.Matrix4();
const _inverseViewportSize = new THREE.Vector2();
const _drawingBufferSize = new THREE.Vector2();
const _uvProjScratch = new THREE.Vector3();
const _camDirScratch = new THREE.Vector3();
let _spotShadowState = null;
/** Текущая фаза поворота 3-tap ядра теней — см. spotShadowJitterPhase(). */
let _spotShadowJitterPhase = 0;
/** Spot-disk diagnostic — floor=Spot only, LDR, no HDR/TAA/ODT. */
let _debugSpotDisk = false;
/**
 * Soft AO выключен с 2026-10-29. Heightmap 80² на фиксированный бокс 10 м = 125 мм/тексель,
 * блюр до ±15 текселей: выборка идёт по xzM сверху вниз, направления света в формуле нет,
 * поэтому вокруг шкафа ложился симметричный фартук на метр-полтора и читался как тень от
 * створки. В настройках кухни IKEA такого слоя нет — наружное затенение у них SSAO (радиус 1.5).
 * Кнопка «Soft AO» на сцене возвращает слой для сравнения.
 */
const SOFT_AO_ENABLED_DEFAULT = false;
let _debugSoftAoOff = !SOFT_AO_ENABLED_DEFAULT;
/** probeIkeaV0DisplayPath: one frame LDR without debug visuals. */
let _forceLdrProbe = false;
/** Probe frames render to canvas — bypass hdrDownRt readback (was reading display ~244 as albedo). */
let _forceCanvasPipette = false;
/** spotLinearGpuProbe / floorTotalLinearGpuProbe frag scale — probe read divides by this. */
const SPOT_LINEAR_GPU_PROBE_SCALE = 120;
const FLOOR_TOTAL_LINEAR_GPU_PROBE_SCALE = 120;
const _wallConeMin = [0, 1, 2, 3].map(() => new THREE.Vector3());
const _wallConeMax = [0, 1, 2, 3].map(() => new THREE.Vector3());
let _wallConeCount = 0;
let _wallNormalTex = null;
let _wallNormalTexReady = false;
/** Phase 6d: float HDR RT + deferred ODT display blit (IKEA deferredTonemap). */
let _hdrState = null;
/** MSAA×2 — ×4 float HDR RTs OOM on many Windows GPUs (was ×4; ×8 killed context, p8z21). */
const HDR_MSAA_SAMPLES = 2;
/** No extra SS — canvas DPR already scales; SS×1.25 stacked with MSAA blew VRAM. */
const HDR_SS_SCALE = 1;
const HDR_MAX_MP = 4;
const HDR_PIPELINE_VER = 'p8z33-orbit-lo';
/** IKEA AccumulationBuffer.DEFAULT_ACCUMULATION_FRAME_COUNT (DEy_Xiep). */
const ACCUM_FRAME_COUNT = 16;
const ACCUM_JITTER_MULTIPLIER = 1;
/** Invalidate finished TAA buffer after camera moved > 2 mm or ~0.25° (room units mm). */
const ACCUM_CAM_RESET_POS_MM = 2;
const ACCUM_CAM_RESET_ROT = 0.004;
/** Per-frame motion gate: while zoom/orbit/damp moves — no jitter, no multi-pose blend. */
const ACCUM_MOTION_POS_MM = 0.5;
const ACCUM_MOTION_ROT = 0.0008;
const ACCUM_MOTION_FOV = 0.002;
const _accumCamPos = new THREE.Vector3();
const _accumCamQuat = new THREE.Quaternion();
const _prevFrameCamPos = new THREE.Vector3();
const _prevFrameCamQuat = new THREE.Quaternion();
let _prevFrameFov = 0;
let _prevFrameAspect = 0;
let _prevFrameCamValid = false;
const _surroundGamma = new THREE.Vector3();
const _hdrSurroundClear = new THREE.Color();
let _hdrSurroundClearRrtReady = false;
const _fxaaResolution = new THREE.Vector2();

function haltonSeq(base, index) {
  let result = 0;
  let f = 1;
  let i = index;
  while (i > 0) {
    f /= base;
    result += (i % base) * f;
    i = Math.floor(i / base);
  }
  return result;
}

/** IKEA initialize_halton_2_3 — JitterSampleType.halton_2_3_16. */
function buildHaltonJitterSamples(count) {
  const samples = [];
  for (let i = 0; i < count; i += 1) {
    samples.push({
      x: (haltonSeq(2, i + 1) - 0.5) * 2,
      y: (haltonSeq(3, i + 1) - 0.5) * 2,
    });
  }
  samples.sort((a, b) => a.x * a.x + a.y * a.y - (b.x * b.x + b.y * b.y));
  return samples;
}

function surroundGammaRgb() {
  const c = new THREE.Color(SOT.canvasClearHex);
  _surroundGamma.set(
    Math.pow(c.r, 1 / 2.2),
    Math.pow(c.g, 1 / 2.2),
    Math.pow(c.b, 1 / 2.2)
  );
  return _surroundGamma;
}

/** ACES fitted ODT path — same as HDR_TONEMAP_GLSL (JS for clear inverse). */
function tonemapRrtToSrgbChannels(rr, gg, bb) {
  const fit = (x) => {
    const a = x * (x + 0.0245786) - 0.000090537;
    const b = x * (0.983729 * x + 0.432951) + 0.238081;
    return a / b;
  };
  const odtR = fit(rr);
  const odtG = fit(gg);
  const odtB = fit(bb);
  return [
    1.60475 * odtR - 0.53108 * odtG - 0.07367 * odtB,
    -0.10208 * odtR + 1.10813 * odtG - 0.00605 * odtB,
    -0.00327 * odtR - 0.07276 * odtG + 1.07602 * odtB,
  ];
}

/** JS mirror of the encode in hdrRrtToDisplaySrgb — plain gamma 2.2, per dump betrakta_common. */
function _displayGammaEncode01(v) {
  return Math.max(0, Math.min(1, v)) ** (1 / 2.2);
}

function _displayGammaDecode01(s) {
  return Math.max(0, Math.min(1, s)) ** 2.2;
}

/**
 * HDR clear must be RRT so MSAA blends geo↔surround; depth hard-cut killed silhouette AA.
 * Solve display(RRT) ≈ screen #F2F2F0. Target is decoded once so the loop stays in ODT
 * space — iterating against the encoded value converges far slower (gamma flattens the step).
 */
function ensureHdrSurroundClearRrt() {
  if (_hdrSurroundClearRrtReady) return _hdrSurroundClear;
  const target = [242 / 255, 242 / 255, 240 / 255].map((s) => _displayGammaDecode01(s));
  const rrt = [0.95, 0.95, 0.93];
  // Clear sits on the ACES shoulder where d(odt)/d(rrt) ≈ 0.02, so relaxation needs
  // hundreds of steps. Runs once per resize — iterate on the residual, not a step count.
  for (let i = 0; i < 4096; i += 1) {
    const out = tonemapRrtToSrgbChannels(rrt[0], rrt[1], rrt[2]);
    let worst = 0;
    for (let c = 0; c < 3; c += 1) {
      const err = target[c] - out[c];
      worst = Math.max(worst, Math.abs(err));
      rrt[c] = Math.max(0, rrt[c] + err * 0.9);
    }
    if (worst < 1e-6) break;
  }
  _hdrSurroundClear.setRGB(rrt[0], rrt[1], rrt[2]);
  if ('colorSpace' in _hdrSurroundClear) {
    _hdrSurroundClear.colorSpace = THREE.LinearSRGBColorSpace;
  }
  _hdrSurroundClearRrtReady = true;
  return _hdrSurroundClear;
}

function resetIkeaHdrAccumulation(reason = 'manual') {
  if (!_hdrState) return;
  _hdrState.accumIndex = 0;
  _hdrState.jitterIndex = 0;
  _hdrState.accumReady = false;
  _hdrState.accumResetReason = reason;
  _hdrState.camAnchor = null;
  _hdrState.needsAccClear = true;
}

function shouldResetIkeaHdrAccum(camera) {
  if (!_hdrState?.camAnchor || !camera || !_hdrState.accumReady) return false;
  const a = _hdrState.camAnchor;
  _accumCamPos.copy(camera.position);
  if (_accumCamPos.distanceTo(a.position) > ACCUM_CAM_RESET_POS_MM) return true;
  _accumCamQuat.copy(camera.quaternion);
  if (1 - Math.abs(_accumCamQuat.dot(a.quaternion)) > ACCUM_CAM_RESET_ROT) return true;
  if (Math.abs((camera.fov ?? 0) - (a.fov ?? 0)) > 0.01) return true;
  if (Math.abs((camera.aspect ?? 0) - (a.fovAspect ?? 0)) > 0.0005) return true;
  return false;
}

/**
 * Frame-to-frame camera motion (zoom / orbit / damp).
 * While moving, TAA must not blend poses or apply Halton jitter — causes "swim".
 */
function detectIkeaHdrCameraMotion(camera) {
  if (!camera) return false;
  const fov = camera.fov ?? 0;
  const aspect = camera.aspect ?? 0;
  if (!_prevFrameCamValid) {
    _prevFrameCamPos.copy(camera.position);
    _prevFrameCamQuat.copy(camera.quaternion);
    _prevFrameFov = fov;
    _prevFrameAspect = aspect;
    _prevFrameCamValid = true;
    return false;
  }
  _accumCamPos.copy(camera.position);
  const moved =
    _accumCamPos.distanceTo(_prevFrameCamPos) > ACCUM_MOTION_POS_MM ||
    1 - Math.abs(camera.quaternion.dot(_prevFrameCamQuat)) > ACCUM_MOTION_ROT ||
    Math.abs(fov - _prevFrameFov) > ACCUM_MOTION_FOV ||
    Math.abs(aspect - _prevFrameAspect) > 0.0005;
  _prevFrameCamPos.copy(camera.position);
  _prevFrameCamQuat.copy(camera.quaternion);
  _prevFrameFov = fov;
  _prevFrameAspect = aspect;
  return moved;
}

/** Drag / door anim / placement — scene moves, camera may not. TAA must pause. */
function isIkeaHdrDoorAnimationMotion() {
  try {
    return !!window.ClodisBuilder?.isDoorAnimationActive?.();
  } catch (_) {
    return false;
  }
}

function isIkeaHdrSceneInteractionMotion() {
  return !!(
    state.isDraggingFurniture ||
    state.isPlacingFurniture ||
    state.isDraggingFromCatalog ||
    state.isPlacingSection ||
    isIkeaHdrDoorAnimationMotion()
  );
}

function storeIkeaHdrCamAnchor(camera) {
  if (!_hdrState || !camera || !_hdrState.accumReady) return;
  _hdrState.camAnchor = {
    position: camera.position.clone(),
    quaternion: camera.quaternion.clone(),
    fov: camera.fov,
    fovAspect: camera.aspect,
  };
}

/** Сценические CAD-орто (Сверху/Прямо/Сбоку): jitter ломает OrthographicCamera → пустой кадр. */
function isSceneCadOrthoView() {
  const p =
    typeof window !== 'undefined'
      ? String(window.__cldSceneViewPreset || '')
          .trim()
          .toLowerCase()
      : '';
  return p === 'top' || p === 'front' || p === 'side';
}

function applyIkeaProjectionJitter(camera, renderer) {
  if (!_hdrState || _hdrState.accumIndex >= ACCUM_FRAME_COUNT) return;
  if (_hdrState.motionActive) return;
  /** Plan view: Halton jitter smears radial Spot disk (Δ 19→7). IKEA disk = low-freq cone. */
  if (isTopDownCamera(camera) || isSceneCadOrthoView() || camera?.isOrthographicCamera) return;
  const sample = _hdrState.jitterSamples[_hdrState.jitterIndex];
  const { w, h } = hdrFramebufferSize(renderer);
  camera.setViewOffset(
    w,
    h,
    sample.x * 0.5 * ACCUM_JITTER_MULTIPLIER,
    sample.y * 0.5 * ACCUM_JITTER_MULTIPLIER,
    w,
    h
  );
  _hdrState.viewOffsetActive = true;
}

function restoreIkeaProjection(camera) {
  if (!_hdrState?.viewOffsetActive) return;
  camera.clearViewOffset();
  _hdrState.viewOffsetActive = false;
}

function hdrFramebufferSize(renderer) {
  let w = Math.max(1, Math.floor((renderer.domElement.width || 1) * HDR_SS_SCALE));
  let h = Math.max(1, Math.floor((renderer.domElement.height || 1) * HDR_SS_SCALE));
  const mp = (w * h) / (1024 * 1024);
  if (mp > HDR_MAX_MP) {
    const s = Math.sqrt((HDR_MAX_MP * 1024 * 1024) / (w * h));
    w = Math.max(1, Math.floor(w * s));
    h = Math.max(1, Math.floor(h * s));
  }
  return { w, h };
}

function presentFramebufferSize(renderer) {
  return {
    w: Math.max(1, Math.floor(renderer.domElement.width || 1)),
    h: Math.max(1, Math.floor(renderer.domElement.height || 1)),
  };
}

const HDR_DISPLAY_VERT = /* glsl */ `
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const HDR_TONEMAP_GLSL = /* glsl */ `
vec3 tonemapRRTtoODT(vec3 rrt) {
  vec3 a = rrt * (rrt + 0.0245786) - 0.000090537;
  vec3 b = rrt * (0.983729 * rrt + 0.4329510) + 0.238081;
  return a / b;
}

vec3 ODTtoSRGB(vec3 odt) {
  const mat3 ACESOutputMatrix = mat3(
    vec3(1.60475, -0.10208, -0.00327),
    vec3(-0.53108, 1.10813, -0.07276),
    vec3(-0.07367, -0.00605, 1.07602)
  );
  return ACESOutputMatrix * odt;
}

vec3 hdrRrtToAccumGamma(vec3 rrt) {
  vec3 srgb = ODTtoSRGB(tonemapRRTtoODT(rrt));
  srgb = clamp(srgb, 0.0, 1.0);
  return pow(srgb, vec3(1.0 / 2.2));
}

/**
 * RRT accum → display. ODTtoSRGB is a gamut matrix only; the encode is plain gamma 2.2.
 * Dump betrakta_common: ODTtoSRGB → clamp → pow(1.0 / 2.2), not the piecewise sRGB curve.
 */
vec3 hdrRrtToDisplaySrgb(vec3 rrt) {
  vec3 odt = clamp(ODTtoSRGB(tonemapRRTtoODT(rrt)), 0.0, 1.0);
  return pow(odt, vec3(1.0 / 2.2));
}
`;

function hdrAccumSupportsRrtSpace(renderer) {
  if (!renderer?.capabilities?.isWebGL2) return false;
  try {
    return renderer.extensions.has('EXT_color_buffer_float');
  } catch (_) {
    return false;
  }
}

function hdrAccumRenderTargetOptions(renderer) {
  if (hdrAccumSupportsRrtSpace(renderer)) {
    return {
      type: THREE.FloatType,
      format: THREE.RGBAFormat,
      depthBuffer: false,
      stencilBuffer: false,
    };
  }
  return {
    type: THREE.UnsignedByteType,
    format: THREE.RGBAFormat,
    colorSpace: THREE.NoColorSpace,
    depthBuffer: false,
    stencilBuffer: false,
  };
}

function hdrAccumFragmentShader(accumRrtSpace) {
  if (accumRrtSpace) {
    return HDR_ACCUM_FRAG_RRT;
  }
  return HDR_ACCUM_FRAG_LEGACY;
}

/** p8z30: TAA blends RRT (pre-ODT). Tonemap once at blit — avoids shoulder clip killing Spot disk. */
const HDR_ACCUM_FRAG_RRT = /* glsl */ `
precision highp float;
uniform sampler2D currentHdr;
uniform sampler2D previousAcc;
uniform float accumulationBlend;
in vec2 vUv;
out vec4 fragColor;

void main() {
  vec3 currentRrt = texture(currentHdr, vUv).rgb;
  vec3 previousRrt = texture(previousAcc, vUv).rgb;
  fragColor = vec4(mix(previousRrt, currentRrt, accumulationBlend), 1.0);
}
`;

/** Fallback when float accum RT unavailable — legacy gamma TAA (p8z29). */
const HDR_ACCUM_FRAG_LEGACY = /* glsl */ `
precision highp float;
uniform sampler2D currentHdr;
uniform sampler2D previousAcc;
uniform float accumulationBlend;
in vec2 vUv;
out vec4 fragColor;

${HDR_TONEMAP_GLSL}

void main() {
  vec3 currentGamma = hdrRrtToAccumGamma(texture(currentHdr, vUv).rgb);
  vec4 previous = texture(previousAcc, vUv);
  fragColor = vec4(mix(previous.rgb, currentGamma, accumulationBlend), 1.0);
}
`;

const HDR_RESOLVE_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D hdrMap;
in vec2 vUv;
out vec4 fragColor;
void main() {
  fragColor = vec4(texture(hdrMap, vUv).rgb, 1.0);
}
`;

/** IKEA ThinFXAAPostProcess — FXAA at canvas pixel size (after HDR downscale). */
const HDR_DISPLAY_FRAG = FXAAShader.fragmentShader.replace(
  'const float edgeDetectionQuality = .2;',
  'const float edgeDetectionQuality = .05;'
);

const HDR_BLIT_COPY_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tex;
in vec2 vUv;
out vec4 fragColor;
void main() {
  fragColor = vec4(texture(tex, vUv).rgb, 1.0);
}
`;

const HDR_BLIT_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tex;
in vec2 vUv;
out vec4 fragColor;

${HDR_TONEMAP_GLSL}

void main() {
  vec3 rrt = texture(tex, vUv).rgb;
  fragColor = vec4(hdrRrtToDisplaySrgb(rrt), 1.0);
}
`;

let _wallNormalLoadStarted = false;
let _flatNormalDummyTex = null;

function flatNormalDummyTex() {
  if (_flatNormalDummyTex) return _flatNormalDummyTex;
  const data = new Uint8Array([128, 128, 255, 255]);
  const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  _flatNormalDummyTex = tex;
  return tex;
}

function loadWallNormalTexture() {
  if (_wallNormalTexReady && _wallNormalTex) return _wallNormalTex;
  if (!_wallNormalLoadStarted) {
    _wallNormalLoadStarted = true;
  const loader = new THREE.TextureLoader();
  const bindTex = (tex) => {
      tex.needsUpdate = false;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
      promoteMapImageToRgbaCanvas(tex);
      if (!mapGpuUploadReady(tex)) return;
      prepareSrgbMapForCustomShader(tex);
      tex.needsUpdate = true;
      _wallNormalTex = tex;
    _wallNormalTexReady = true;
    syncWallNormalUniformsOnScene();
  };
    loader.load(
    SOT.wall.normalUrl,
    bindTex,
    undefined,
    () => {
      loader.load(WALL_NORMAL_FALLBACK_URL, bindTex);
    }
  );
  }
  return flatNormalDummyTex();
}

function syncWallNormalUniformsOnScene() {
  const scene = state.scene;
  if (!scene) return;
  const tex = _wallNormalTex;
  scene.traverse((o) => {
    if (!o.isMesh || !o.material?.uniforms?.wallNormalMap) return;
    o.material.uniforms.wallNormalMap.value = tex;
    if (o.material.uniforms.wallNormalMapEnabled) {
      const on =
        (o.material.userData.__cldIkeaV0Kind === 'wall' ||
          o.material.userData.__cldIkeaV0Kind === 'frame') &&
        _wallNormalTexReady;
      o.material.uniforms.wallNormalMapEnabled.value = on ? 1 : 0;
    }
  });
}

/** Babylon .env specular is RGBD (rgb / alpha), not RGBE 2^(a-128).
 *  Dump helperFunctions: fromRGBD(rgbd) = rgbd.rgb * (1.0 / rgbd.a). */
function decodeRgbdToLinear(r, g, b, a) {
  if (a <= 0) return [0, 0, 0];
  const invA = 255 / a;
  return [(r / 255) * invA, (g / 255) * invA, (b / 255) * invA];
}

/** Babylon .env magic — environmentTextureTools.ts MagicBytes. */
const BABYLON_ENV_MAGIC = Object.freeze([0x86, 0x16, 0x87, 0x96, 0xf6, 0xd6, 0x96, 0x36]);

/** Parse null-terminated JSON manifest after magic (v1/v2 IKEA .env). */
function parseBabylonEnvManifest(buffer) {
  const view = new DataView(buffer);
  let pos = 0;
  for (let i = 0; i < BABYLON_ENV_MAGIC.length; i += 1) {
    if (view.getUint8(pos++) !== BABYLON_ENV_MAGIC[i]) {
      throw new Error('env: not babylon .env magic');
    }
  }
  let manifestString = '';
  let charCode = 0;
  while (pos < view.byteLength && (charCode = view.getUint8(pos++))) {
    manifestString += String.fromCharCode(charCode);
  }
  const manifest = JSON.parse(manifestString);
  const binaryDataPosition = pos;
  const imageType =
    manifest.version >= 2 && manifest.imageType ? manifest.imageType : 'image/png';
  return { manifest, binaryDataPosition, imageType };
}

let _envDecodeCanvas = null;

async function decodeRgbdImageBytesToFloatFace(imageBytes, mimeType) {
  const blob = new Blob([imageBytes], { type: mimeType || 'image/png' });
  const bitmap = await createImageBitmap(blob);
  const w = bitmap.width;
  const h = bitmap.height;
  if (!_envDecodeCanvas) {
    _envDecodeCanvas = document.createElement('canvas');
  }
  _envDecodeCanvas.width = w;
  _envDecodeCanvas.height = h;
  const ctx = _envDecodeCanvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();
  const img = ctx.getImageData(0, 0, w, h);
  const pxCount = w * h;
  const data = new Float32Array(pxCount * 4);
  for (let i = 0; i < pxCount; i += 1) {
    const o = i * 4;
    const rgb = decodeRgbdToLinear(img.data[o], img.data[o + 1], img.data[o + 2], img.data[o + 3]);
    data[o] = rgb[0];
    data[o + 1] = rgb[1];
    data[o + 2] = rgb[2];
    data[o + 3] = 1;
  }
  return { data, width: w, height: h };
}

/**
 * Live IKEA .env v1 — magic + JSON + PNG/WebP RGBD mipmaps (not uint32 JSON length).
 * Specular mip0 ×6 faces → THREE.CubeTexture linear HDR; mips generated in Three.
 */
async function parseBabylonEnvSpecCubeFromBuffer(buffer) {
  const u8 = new Uint8Array(buffer);
  const { manifest, binaryDataPosition, imageType } = parseBabylonEnvManifest(buffer);
  const spec = manifest.specular;
  if (!spec?.mipmaps?.length) throw new Error('env: no specular mipmaps');
  const width = manifest.width;
  if (!width || width < 1) throw new Error('env: invalid width');
  const mipmapsCount = Math.round(Math.log2(width)) + 1;
  const expectedMaps = 6 * mipmapsCount;
  if (spec.mipmaps.length !== expectedMaps) {
    throw new Error(`env: mipmaps ${spec.mipmaps.length} != ${expectedMaps}`);
  }
  const faceImages = [];
  for (let face = 0; face < 6; face += 1) {
    const imageInfo = spec.mipmaps[face];
    const start = binaryDataPosition + imageInfo.position;
    const end = start + imageInfo.length;
    const pngBytes = u8.subarray(start, end);
    const faceData = await decodeRgbdImageBytesToFloatFace(pngBytes, imageType);
    /** CubeTexture faces must be DataTexture — three checks image[0].isDataTexture,
     *  иначе texSubImage2D получает {data,w,h} как TexImageSource → Overload resolution failed ×6. */
    const faceTex = new THREE.DataTexture(
      faceData.data,
      faceData.width,
      faceData.height,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    faceTex.needsUpdate = true;
    faceImages.push(faceTex);
  }
  const cube = new THREE.CubeTexture(faceImages);
  cube.format = THREE.RGBAFormat;
  cube.type = THREE.FloatType;
  cube.mapping = THREE.CubeReflectionMapping;
  cube.colorSpace = THREE.LinearSRGBColorSpace;
  cube.generateMipmaps = true;
  cube.minFilter = THREE.LinearMipmapLinearFilter;
  cube.magFilter = THREE.LinearFilter;
  cube.needsUpdate = true;
  return cube;
}

async function fetchEnvArrayBuffer() {
  const urls = [SOT.env.localUrl, ENV_CDN_URL];
  let lastErr = null;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.arrayBuffer();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('env fetch failed');
}

async function loadIkeaEnvSpecCube() {
  if (IKEA_V0_ACTIVE_PHASE < 5) return null;
  if (_envSpecState?.ready) return _envSpecState.cube;
  try {
    const buffer = await fetchEnvArrayBuffer();
    const cube = await parseBabylonEnvSpecCubeFromBuffer(buffer);
    _envSpecState = { ready: true, cube, error: null };
    console.log('[IKEA v0] env spec cube loaded · size', cube.image[0]?.image?.width);
    syncIblSpecUniformsOnScene();
    if (state.room) resyncIkeaRoomFloorMap(state.room);
    return cube;
  } catch (e) {
    _envSpecState = { ready: false, cube: null, error: String(e?.message || e) };
    console.warn('[IKEA v0] env spec load failed:', _envSpecState.error);
    return null;
  }
}

function screenCalUniformValue() {
  return SCREEN_CAL_EMPTY;
}

function screenCalForKind(_kind) {
  /** Dump UBO = 1 all surfaces — no per-kind pipette cal (p8z141). */
  return screenCalUniformValue();
}

function exposureUniformValue() {
  return IKEA_V0_ACTIVE_PHASE >= 6 ? EXPOSURE_POST : EXPOSURE_PRE_OUTPUT;
}

function betraktaOutputUniformValue() {
  return IKEA_V0_ACTIVE_PHASE >= 6 ? 1 : 0;
}

function cameraUniforms() {
  return {
    inverseViewProjection: { value: _inverseViewProjection.clone() },
    inverseViewportSize: { value: _inverseViewportSize.clone() },
    cameraPosM: { value: _cameraPosM?.clone() ?? new THREE.Vector3(0, 2, 5) },
  };
}

/** IKEA renderMaterial: inverseViewProjection × gl_FragCoord → per-pixel Wo. */
/** Cached IKEA mats for camera uniforms — full traverse every rAF stalled orbit with cabinet. */
let _camUniformMats = [];
let _camUniformMatsAtMs = -1e9;
const CAM_UNIFORM_MATS_REFRESH_MS = 500;

function refreshCamUniformMats(scene, force = false) {
  const now = performance.now();
  if (!force && _camUniformMats.length && now - _camUniformMatsAtMs < CAM_UNIFORM_MATS_REFRESH_MS) {
    return _camUniformMats;
  }
  const mats = [];
  scene.traverse((o) => {
    if (!o.isMesh || !o.material?.userData?.__cldIkeaV0) return;
    if (!o.material.uniforms?.inverseViewProjection) return;
    // После rebuild/xray старые материалы disposed — не трогать.
    if (o.material.disposed || o.material.uniforms.inverseViewProjection.value == null) return;
    mats.push(o.material);
  });
  _camUniformMats = mats;
  _camUniformMatsAtMs = now;
  return mats;
}

/** Сброс кэша camera-uniforms после rebuild мебели / Contours. */
export function invalidateIkeaCamUniformMats() {
  _camUniformMats = [];
  _camUniformMatsAtMs = -1e9;
}

/** Call after bind/unbind cabinet mats so orbit camera sync stays current. */
export function invalidateIkeaV0CamUniformMatCache() {
  _camUniformMats = [];
  _camUniformMatsAtMs = -1e9;
}

export function syncCameraUniformsOnScene(
  camera = state.camera,
  renderer = state.renderer,
  opts = {}
) {
  if (!state.scene || !camera) return;
  camera.updateMatrixWorld(true);
  if (typeof camera.updateProjectionMatrix === 'function' && camera.projectionMatrixNeedsUpdate) {
    camera.updateProjectionMatrix();
  }
  _inverseViewProjection.copy(camera.matrixWorld).multiply(camera.projectionMatrixInverse);
  if (renderer) {
    const hdrPass = opts.hdrPass === true;
    let vpW = 1;
    let vpH = 1;
    if (Number.isFinite(opts.vpW) && Number.isFinite(opts.vpH) && opts.vpW > 0 && opts.vpH > 0) {
      vpW = opts.vpW;
      vpH = opts.vpH;
    } else if (hdrPass && _hdrState?.rtW && _hdrState?.rtH) {
      vpW = _hdrState.rtW;
      vpH = _hdrState.rtH;
    } else {
      renderer.getDrawingBufferSize(_drawingBufferSize);
      vpW = _drawingBufferSize.x;
      vpH = _drawingBufferSize.y;
    }
    _inverseViewportSize.set(1 / Math.max(1, vpW), 1 / Math.max(1, vpH));
  }
  if (!_cameraPosM) _cameraPosM = new THREE.Vector3();
  _cameraPosM.copy(camera.position).multiplyScalar(MM_TO_M);
  const mats = refreshCamUniformMats(state.scene, opts.forceMatRefresh === true);
  for (let i = 0; i < mats.length; i++) {
    const mat = mats[i];
    if (!mat || mat.disposed) continue;
    const u = mat.uniforms;
    if (!u?.inverseViewProjection?.value || !u?.inverseViewportSize?.value) continue;
    try {
      u.inverseViewProjection.value.copy(_inverseViewProjection);
      u.inverseViewportSize.value.copy(_inverseViewportSize);
      if (u.cameraPosM?.value) u.cameraPosM.value.copy(_cameraPosM);
    } catch (_) {
      // Материал мог умереть между traverse и copy — сбросим кэш.
      invalidateIkeaCamUniformMats();
    }
  }
}

function emptyRoomSurfaceScaleForKind(kind, key) {
  const block = SOT.emptyRoom?.[key];
  if (!block) return 1;
  if (kind === 'wall' || kind === 'frame') return block.wall ?? 1;
  if (kind === 'ceiling') return block.ceiling ?? 1;
  if (kind === 'floor' || kind === 'floorSlab') return block.floor ?? 1;
  return block.default ?? 1;
}

function iblSpecSurfaceScaleForKind(kind) {
  return emptyRoomSurfaceScaleForKind(kind, 'iblSpecSurfaceScale');
}

function iblDiffuseSurfaceScaleForKind(kind) {
  return emptyRoomSurfaceScaleForKind(kind, 'iblDiffuseSurfaceScale');
}

/**
 * Отклонение от дампа по прямой просьбе пользователя (7 сен 2026): комната ~10% темнее.
 * Дамп даёт surfaceLinearScale = 1 на всех поверхностях, поэтому betrakta-sot.js остаётся
 * дамп-верным, а экранная докрутка живёт здесь. Крутится живьём: __cldIkeaV0SetRoomDim(x)
 * или ползунком «room — комната темнее» в панели подбора.
 * Только поверхности комнаты; шкаф (corpus/facade/back/trim/door) не затрагивается —
 * у него свои ручки white / gain.
 */
let _roomDimScale = ROOM_DIM_SCALE;

const ROOM_DIM_KINDS = new Set(['wall', 'frame', 'ceiling', 'floor', 'floorSlab']);

function surfaceLinearScaleForKind(kind) {
  const base = emptyRoomSurfaceScaleForKind(kind, 'surfaceLinearScale');
  return ROOM_DIM_KINDS.has(kind) ? base * _roomDimScale : base;
}

/**
 * Живая настройка затемнения комнаты. Uniform ставится на bind, поэтому обходим сцену.
 * @param {number} scale 1 = дамп, 0.9 = на 10% темнее
 */
export function setIkeaV0RoomDim(scale) {
  const v = Number(scale);
  if (!Number.isFinite(v)) return { ok: false, reason: 'bad scale', roomDim: _roomDimScale };
  _roomDimScale = Math.max(0.5, Math.min(1.5, v));
  _cavityTune.roomDim = _roomDimScale;
  let materials = 0;
  state.scene?.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m) => {
      const kind = m?.userData?.__cldIkeaV0Kind;
      if (!kind || !m.uniforms?.surfaceLinearScale) return;
      m.uniforms.surfaceLinearScale.value = surfaceLinearScaleForKind(kind);
      materials += 1;
    });
  });
  return { ok: true, roomDim: _roomDimScale, materials, dimmedKinds: [...ROOM_DIM_KINDS] };
}

/** IKEA empty room: ceiling + floor are diffuse-only (no env spec lobe / glossy streak). */
function iblSpecEnabledForKind(kind) {
  const ready = IKEA_V0_ACTIVE_PHASE >= 5 && _envSpecState?.ready && _envSpecState.cube;
  if (!ready) return 0;
  if (kind === 'ceiling' || kind === 'floor' || kind === 'floorSlab') return 0;
  return 1;
}

function iblSpecUniforms(kind = 'wall') {
  return {
    iblSpecEnabled: { value: iblSpecEnabledForKind(kind) },
    iblSpecSurfaceScale: { value: iblSpecSurfaceScaleForKind(kind) },
    iblDiffuseSurfaceScale: { value: iblDiffuseSurfaceScaleForKind(kind) },
    surfaceLinearScale: { value: surfaceLinearScaleForKind(kind) },
    environmentMap: { value: _envSpecState?.cube ?? null },
    envMapMipLevels: { value: ENV_MAP_MIP_LEVELS },
    envMapCenterM: {
      value: new THREE.Vector3(ENV_CENTER_M.x, ENV_CENTER_M.y, ENV_CENTER_M.z),
    },
    envMapSizeM: {
      value: new THREE.Vector3(ENV_SIZE_M.x, ENV_SIZE_M.y, ENV_SIZE_M.z),
    },
  };
}

function syncIblSpecUniformsOnScene() {
  if (IKEA_V0_ACTIVE_PHASE < 5 || !state.scene) return;
  const ready = _envSpecState?.ready && _envSpecState.cube;
  state.scene.traverse((o) => {
    if (!o.isMesh || !o.material?.userData?.__cldIkeaV0) return;
    const u = o.material.uniforms;
    if (!u?.environmentMap) return;
    u.environmentMap.value = ready ? _envSpecState.cube : null;
    if (u.iblSpecEnabled) {
      u.iblSpecEnabled.value = iblSpecEnabledForKind(o.material.userData.__cldIkeaV0Kind);
    }
    if (u.iblSpecSurfaceScale) {
      u.iblSpecSurfaceScale.value = iblSpecSurfaceScaleForKind(
        o.material.userData.__cldIkeaV0Kind
      );
    }
    if (u.iblDiffuseSurfaceScale) {
      u.iblDiffuseSurfaceScale.value = iblDiffuseSurfaceScaleForKind(
        o.material.userData.__cldIkeaV0Kind
      );
    }
    if (u.surfaceLinearScale) {
      u.surfaceLinearScale.value = surfaceLinearScaleForKind(
        o.material.userData.__cldIkeaV0Kind
      );
    }
  });
}

function syncHdrFramebufferWriteOnScene(value) {
  if (!state.scene) return;
  const v = value ? 1 : 0;
  const mats = refreshCamUniformMats(state.scene);
  for (let i = 0; i < mats.length; i++) {
    const u = mats[i].uniforms?.hdrFramebufferWrite;
    if (u) u.value = v;
  }
}

export function isIkeaHdrDisplayActive() {
  if (_debugSpotDisk || _forceLdrProbe) return false;
  return IKEA_V0_ACTIVE_PHASE >= 6 && !!_hdrState?.ready;
}

function debugSpotDiskUniformValue() {
  return _debugSpotDisk ? 1 : 0;
}

export function isIkeaV0DebugSpotDiskActive() {
  return _debugSpotDisk;
}

/** Floor = Spot-only LDR — proves cone in shader (bypasses HDR/TAA/ODT). */
export function setIkeaV0DebugSpotDisk(on) {
  _debugSpotDisk = !!on;
  if (_debugSpotDisk) {
    console.warn(
      '[IKEA v0] spotDiskDebug ON — диагностика Spot, не IKEA. Уберите ?spotDiskDebug=1 для обычной комнаты.'
    );
  }
  syncDebugSpotDiskOnScene();
  if (_debugSpotDisk) {
    console.warn(
      '[IKEA v0] spotDiskDebug ON — диагностика Spot, не IKEA. Уберите ?spotDiskDebug=1 для нормальной комнаты.'
    );
    resetIkeaHdrAccumulation('spot-disk-debug');
  }
  const renderer = state.renderer;
  const scene = state.scene;
  const camera = state.camera;
  if (renderer && scene && camera) {
    syncCameraUniformsOnScene(camera, renderer);
    renderer.setRenderTarget(null);
    renderer.setClearColor(SOT.canvasClearHex, 1);
    renderer.render(scene, camera);
  }
  return {
    active: _debugSpotDisk,
    hdrBypass: !isIkeaHdrDisplayActive(),
    vizMode: 'attenuation-cone',
    usage:
      'top-down floor: bright disk = Spot cone OK; walls gray; off = __cldIkeaV0DebugSpotDisk(false)',
  };
}

/**
 * Soft AO вкл/выкл на живой сцене — диагностика источника размытия.
 * Soft AO у нас = heightmap 80² на фиксированный бокс 10×10 м (125 мм/тексель, блюр до ±15
 * текселей). В настройках кухни IKEA такого слоя нет: у них мягкость даёт SSAO (радиус 1.5).
 */
export function setIkeaV0SoftAoOff(off = true) {
  _debugSoftAoOff = !!off;
  const scene = state.scene;
  if (scene) {
    scene.traverse((o) => {
      const u = o.isMesh ? o.material?.uniforms : null;
      if (!u?.softAoEnabled || !o.material?.userData?.__cldIkeaV0) return;
      u.softAoEnabled.value = ikeaV0SoftAoEnabledForMaterial(o.material);
    });
  }
  resetIkeaHdrAccumulation('soft-ao-debug');
  let affected = 0;
  scene?.traverse((o) => {
    if (o.isMesh && o.material?.uniforms?.softAoEnabled?.value > 0) affected += 1;
  });
  return {
    softAoOff: _debugSoftAoOff,
    materialsWithSoftAoOn: affected,
    softResolution: SOT.soft.resolution,
    softBoxM: SOT.soft.size_m.x,
    mmPerTexel: (SOT.soft.size_m.x * 1000) / SOT.soft.resolution,
    usage: 'вернуть: __cldIkeaV0SoftAoOff(false); нужен поворот камеры для перерисовки',
  };
}

/** Радиус ядра тени на живой сцене — IKEA держит 2 на карте 4096, мы 1 на 1024. */
export function setIkeaV0ShadowPcfScale(scale) {
  const v = Math.max(0, Number(scale) || 0);
  let n = 0;
  state.scene?.traverse((o) => {
    const u = o.isMesh ? o.material?.uniforms : null;
    if (!u?.spotShadowPcfScale) return;
    u.spotShadowPcfScale.value = v;
    n += 1;
  });
  resetIkeaHdrAccumulation('shadow-pcf-scale');
  return { pcfScale: v, materials: n, mapSize: SPOT_SHADOW_MAP_SIZE };
}

/** Пресет позиции лампы на живой сцене — тень должна выйти из-под шкафов. */
export function setIkeaV0SpotPosPreset(index) {
  const n = SPOT_POS_PRESETS.length;
  _spotPosPresetIndex = (((Number(index) || 0) % n) + n) % n;
  syncSpotUniformsOnScene();
  updateSpotShadowMap(true);
  syncSpotShadowUniformsOnScene();
  resetIkeaHdrAccumulation('spot-pos-preset');
  const d = currentSpotDir();
  return {
    index: _spotPosPresetIndex,
    preset: activeSpotPosM(),
    spotPosM: _spotPosM?.toArray?.().map((v) => +v.toFixed(3)) ?? null,
    dir: [+d.x.toFixed(3), +d.y.toFixed(3), +d.z.toFixed(3)],
    casterInstanceCount: _spotShadowState?.casterInstanceCount ?? null,
  };
}

const SHADOW_AB_PANEL_ID = 'ikea-v0-shadow-ab';
/** Сравнение слоёв затенения кнопками на сцене — чтобы не набирать в консоли. */
export function showIkeaV0ShadowAbUI(show = true) {
  if (typeof document === 'undefined') return { ok: false, reason: 'no document' };
  const existing = document.getElementById(SHADOW_AB_PANEL_ID);
  if (show === false) {
    existing?.remove();
    return { ok: true, visible: false };
  }
  if (existing && !existing.querySelector('[data-ikea-punctual]')) {
    existing.remove();
  } else if (existing) return { ok: true, visible: true };

  const host =
    document.getElementById('scene-icons-container') ||
    document.getElementById('canvas-container') ||
    document.body;

  const root = document.createElement('div');
  root.id = SHADOW_AB_PANEL_ID;
  root.style.cssText = [
    'position:absolute',
    'left:16px',
    'bottom:90px',
    'z-index:10050',
    'display:flex',
    'flex-direction:column',
    'gap:6px',
    'padding:10px',
    'width:190px',
    'background:rgba(255,255,255,.95)',
    'border:1px solid #ddd',
    'border-radius:10px',
    'box-shadow:0 4px 12px rgba(0,0,0,.18)',
    'font:12px/1.3 system-ui,Segoe UI,sans-serif',
    'color:#222',
    'user-select:none',
  ].join(';');

  const title = document.createElement('div');
  title.textContent = 'Тени — сравнение';
  title.style.cssText = 'font-weight:700;margin-bottom:2px';
  root.appendChild(title);

  const mkBtn = (label) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.style.cssText = [
      'padding:7px 9px',
      'border:1px solid #ccc',
      'border-radius:7px',
      'background:#f7f7f7',
      'cursor:pointer',
      'font:600 12px/1.2 system-ui,Segoe UI,sans-serif',
      'text-align:left',
    ].join(';');
    root.appendChild(b);
    return b;
  };

  const btnSoft = mkBtn('');
  const syncSoftLabel = () => {
    btnSoft.textContent = _debugSoftAoOff ? 'Soft AO: ВЫКЛ' : 'Soft AO: вкл';
    btnSoft.style.background = _debugSoftAoOff ? '#ffe0b2' : '#f7f7f7';
  };
  syncSoftLabel();
  btnSoft.addEventListener('click', () => {
    const r = setIkeaV0SoftAoOff(!_debugSoftAoOff);
    syncSoftLabel();
    console.log('[тени] Soft AO', r);
  });

  const scales = [1, 2, 4];
  const btnScale = mkBtn('');
  const currentScale = () => {
    let v = SPOT_SHADOW_PCF_SCALE;
    state.scene?.traverse((o) => {
      const u = o.isMesh ? o.material?.uniforms : null;
      if (u?.spotShadowPcfScale) v = u.spotShadowPcfScale.value;
    });
    return v;
  };
  const syncScaleLabel = () => {
    btnScale.textContent = 'Радиус тени: ' + currentScale();
  };
  syncScaleLabel();
  btnScale.addEventListener('click', () => {
    const i = scales.indexOf(currentScale());
    const next = scales[(i + 1) % scales.length];
    console.log('[тени] радиус', setIkeaV0ShadowPcfScale(next));
    syncScaleLabel();
  });

  const btnSh = mkBtn('');
  const syncShLabel = () => {
    btnSh.textContent = _shSource === 'kitchen' ? 'SH: кухня IKEA' : 'SH: PAX';
    btnSh.style.background = _shSource === 'kitchen' ? '#c8e6c9' : '#f7f7f7';
  };
  syncShLabel();
  btnSh.addEventListener('click', () => {
    console.log('[тени] SH', setIkeaV0ShSource(_shSource === 'kitchen' ? 'pax' : 'kitchen'));
    syncShLabel();
  });

  const btnPunctual = mkBtn('');
  btnPunctual.setAttribute('data-ikea-punctual', '1');
  const syncPunctualLabel = () => {
    btnPunctual.textContent = isKitchenDirMode() ? 'Свет: IKEA Kitchen Dir' : 'Свет: PAX Spot';
    btnPunctual.style.background = isKitchenDirMode() ? '#c8e6c9' : '#f7f7f7';
  };
  syncPunctualLabel();
  btnPunctual.addEventListener('click', () => {
    const next = isKitchenDirMode() ? 'pax-spot' : 'kitchen-dir';
    console.log('[тени] punctual', setIkeaV0PunctualMode(next));
    syncPunctualLabel();
  });

  const btnLight = mkBtn('');
  const syncLightLabel = () => {
    btnLight.textContent = 'Свет: ' + activeSpotPosM().name;
  };
  syncLightLabel();
  btnLight.addEventListener('click', () => {
    console.log('[тени] свет', setIkeaV0SpotPosPreset(_spotPosPresetIndex + 1));
    syncLightLabel();
  });

  const btnProbe = mkBtn('Замер в консоль');
  btnProbe.addEventListener('click', () => {
    console.log('[тени] замер', probeIkeaV0SpotShadow());
  });

  const hint = document.createElement('div');
  hint.textContent = 'После нажатия чуть поверни камеру — кадр копится.';
  hint.style.cssText = 'color:#666;font-weight:400';
  root.appendChild(hint);

  host.appendChild(root);
  return { ok: true, visible: true, host: host.id || 'body' };
}

function syncDebugSpotDiskOnScene() {
  if (!state.scene) return;
  const v = debugSpotDiskUniformValue();
  state.scene.traverse((o) => {
    if (!o.isMesh || !o.material?.uniforms?.debugSpotDisk) return;
    o.material.uniforms.debugSpotDisk.value = v;
  });
}

/** 0=off, 1=att, 2=spot linear, 3=total linear, 4=floor albedo lum (probe only). */
function syncSpotGpuProbeOnScene(mode = 0) {
  if (!state.scene) return;
  const att = mode === 1 ? 1 : 0;
  const linear = mode === 2 ? 1 : 0;
  const totalLinear = mode === 3 ? 1 : 0;
  const albedoProbe = mode === 4 ? 1 : 0;
  state.scene.traverse((o) => {
    if (!o.isMesh || !o.material?.uniforms) return;
    const u = o.material.uniforms;
    if (u.spotAttGpuProbe) u.spotAttGpuProbe.value = att;
    if (u.spotLinearGpuProbe) u.spotLinearGpuProbe.value = linear;
    if (u.floorTotalLinearGpuProbe) u.floorTotalLinearGpuProbe.value = totalLinear;
    if (u.floorAlbedoGpuProbe) u.floorAlbedoGpuProbe.value = albedoProbe;
  });
}

function maybeInitSpotDiskDebugFromUrl() {
  if (typeof window === 'undefined') return;
  try {
    const q = new URLSearchParams(window.location.search);
    const v = q.get('spotDiskDebug');
    if (v === '1' || v === 'true') setIkeaV0DebugSpotDisk(true);
    else if (v === '0' || v === 'false') setIkeaV0DebugSpotDisk(false);
  } catch (_) {}
}

export function resizeIkeaHdrDisplayPipeline(width, height) {
  if (!_hdrState?.ready) return;
  const renderer = state?.renderer;
  if (_hdrState.lite) {
    const present = renderer
      ? presentFramebufferSize(renderer)
      : { w: Math.max(1, Math.floor(width)), h: Math.max(1, Math.floor(height)) };
    _hdrState.rtOrbitLo?.setSize(present.w, present.h);
    _hdrState.downRt?.setSize(present.w, present.h);
    _hdrState.accRtA?.setSize(present.w, present.h);
    _hdrState.accRtB?.setSize(present.w, present.h);
    _hdrState.rtW = present.w;
    _hdrState.rtH = present.h;
    _hdrState.presentW = present.w;
    _hdrState.presentH = present.h;
    resetIkeaHdrAccumulation('resize');
    return;
  }
  if (!_hdrState?.rt) return;
  if (renderer) {
    const sz = hdrFramebufferSize(renderer);
    const present = presentFramebufferSize(renderer);
    _hdrState.rt.setSize(sz.w, sz.h);
    _hdrState.rtW = sz.w;
    _hdrState.rtH = sz.h;
    _hdrState.rtResolved?.setSize(sz.w, sz.h);
    _hdrState.rtOrbit?.setSize(sz.w, sz.h);
    _hdrState.rtOrbitLo?.setSize(present.w, present.h);
    _hdrState.accRtA?.setSize(sz.w, sz.h);
    _hdrState.accRtB?.setSize(sz.w, sz.h);
    _hdrState.downRt?.setSize(present.w, present.h);
    _hdrState.presentW = present.w;
    _hdrState.presentH = present.h;
    resetIkeaHdrAccumulation('resize');
    return;
  }
  const w = Math.max(1, Math.floor(width));
  const h = Math.max(1, Math.floor(height));
  _hdrState.rt.setSize(w, h);
  _hdrState.rtW = w;
  _hdrState.rtH = h;
  _hdrState.rtResolved?.setSize(w, h);
  _hdrState.rtOrbit?.setSize(w, h);
  _hdrState.rtOrbitLo?.setSize(w, h);
  _hdrState.accRtA?.setSize(w, h);
  _hdrState.accRtB?.setSize(w, h);
  _hdrState.downRt?.setSize(w, h);
  _hdrState.presentW = w;
  _hdrState.presentH = h;
  resetIkeaHdrAccumulation('resize');
}

function makeHdrFullscreenScene(fragmentShader, uniforms, vertexShader = HDR_DISPLAY_VERT, glsl3 = true) {
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
  });
  if (glsl3) mat.glslVersion = THREE.GLSL3;
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  mesh.frustumCulled = false;
  scene.add(mesh);
  return { mat, scene, cam };
}

/**
 * lowmem: один HalfFloat @ canvas + ODT blit.
 * Без MSAA / TAA / downscale / FXAA — свет как IKEA, VRAM в разы меньше.
 */
function disposeIkeaHdrState() {
  if (!_hdrState) return;
  try {
    _hdrState.rt?.dispose?.();
    _hdrState.rtResolved?.dispose?.();
    _hdrState.rtOrbit?.dispose?.();
    _hdrState.rtOrbitLo?.dispose?.();
    _hdrState.downRt?.dispose?.();
    _hdrState.accRtA?.dispose?.();
    _hdrState.accRtB?.dispose?.();
    _hdrState.displayMat?.dispose?.();
    _hdrState.blitMat?.dispose?.();
    _hdrState.accumMat?.dispose?.();
    _hdrState.resolveMat?.dispose?.();
  } catch (_) {}
  _hdrState = null;
}

function initIkeaHdrLitePipeline(renderer) {
  if (!renderer) return null;
  const present = presentFramebufferSize(renderer);
  if (
    _hdrState?.ready &&
    _hdrState.lite === true &&
    _hdrState.presentW === present.w &&
    _hdrState.presentH === present.h &&
    _hdrState.blitMat
  ) {
    return _hdrState;
  }
  disposeIkeaHdrState();
  _forceLdrProbe = false;

  const rtOrbitLo = new THREE.WebGLRenderTarget(present.w, present.h, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    colorSpace: THREE.LinearSRGBColorSpace,
    depthBuffer: true,
    stencilBuffer: false,
    samples: 0,
  });
  rtOrbitLo.texture.minFilter = THREE.LinearFilter;
  rtOrbitLo.texture.magFilter = THREE.LinearFilter;
  rtOrbitLo.texture.generateMipmaps = false;
  const orbitLoDepth = new THREE.DepthTexture(present.w, present.h, THREE.UnsignedIntType);
  orbitLoDepth.format = THREE.DepthFormat;
  rtOrbitLo.depthTexture = orbitLoDepth;

  const accumRrtSpace = hdrAccumSupportsRrtSpace(renderer);
  const blitPass = makeHdrFullscreenScene(
    accumRrtSpace ? HDR_BLIT_FRAG : HDR_BLIT_COPY_FRAG,
    { tex: { value: rtOrbitLo.texture } }
  );

  /** RGBA8 @ canvas + FXAA — без него lowmem рисует края лесенкой. */
  const downRt = new THREE.WebGLRenderTarget(present.w, present.h, {
    type: THREE.UnsignedByteType,
    format: THREE.RGBAFormat,
    colorSpace: THREE.NoColorSpace,
    depthBuffer: false,
    stencilBuffer: false,
  });
  downRt.texture.minFilter = THREE.LinearFilter;
  downRt.texture.magFilter = THREE.LinearFilter;
  downRt.texture.generateMipmaps = false;
  _fxaaResolution.set(1 / Math.max(1, present.w), 1 / Math.max(1, present.h));
  const displayPass = makeHdrFullscreenScene(
    HDR_DISPLAY_FRAG,
    {
      tDiffuse: { value: downRt.texture },
      resolution: { value: _fxaaResolution.clone() },
    },
    FXAAShader.vertexShader,
    false
  );

  /** Settled TAA без MSAA: 2× HalfFloat @ canvas (не Float — экономия VRAM). */
  const accOpts = accumRrtSpace
    ? { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: false, stencilBuffer: false }
    : hdrAccumRenderTargetOptions(renderer);
  const accRtA = new THREE.WebGLRenderTarget(present.w, present.h, accOpts);
  const accRtB = new THREE.WebGLRenderTarget(present.w, present.h, accOpts);
  [accRtA, accRtB].forEach((t) => {
    t.texture.minFilter = THREE.LinearFilter;
    t.texture.magFilter = THREE.LinearFilter;
    t.texture.generateMipmaps = false;
  });
  const accumPass = makeHdrFullscreenScene(hdrAccumFragmentShader(accumRrtSpace), {
    currentHdr: { value: rtOrbitLo.texture },
    previousAcc: { value: accRtB.texture },
    accumulationBlend: { value: 1 },
  });

  _hdrState = {
    ready: true,
    lite: true,
    pipelineVer: HDR_PIPELINE_VER + '-lite',
    accumRrtSpace,
    msaaSamples: 0,
    ssScale: 1,
    accumFrames: 0,
    rtW: present.w,
    rtH: present.h,
    presentW: present.w,
    presentH: present.h,
    rt: null,
    rtResolved: null,
    rtOrbit: null,
    rtOrbitLo,
    accumIndex: 0,
    jitterIndex: 0,
    jitterSamples: buildHaltonJitterSamples(ACCUM_FRAME_COUNT),
    accPing: 0,
    accRtA,
    accRtB,
    downRt,
    resolveMat: null,
    resolveScene: null,
    resolveCam: null,
    accumMat: accumPass.mat,
    accumScene: accumPass.scene,
    accumCam: accumPass.cam,
    displayMat: displayPass.mat,
    displayScene: displayPass.scene,
    displayCam: displayPass.cam,
    blitMat: blitPass.mat,
    blitScene: blitPass.scene,
    blitCam: blitPass.cam,
    accumReady: false,
    latestAccRt: null,
    singleFrameResolvedReady: false,
    camAnchor: null,
    accumResetReason: 'lite-init',
    needsAccClear: true,
    viewOffsetActive: false,
    motionActive: false,
    sceneInteraction: false,
  };
  syncHdrFramebufferWriteOnScene(0);
  syncExposureUniformsOnScene();
  if (!initIkeaHdrLitePipeline._logged) {
    initIkeaHdrLitePipeline._logged = true;
    console.warn(
      '[IKEA v0] lowmem lite HDR: canvas HalfFloat + ODT (без MSAA/TAA). Полный HQ: ?hq=1'
    );
  }
  return _hdrState;
}

function isHdrOomLikeError(err) {
  return /out of memory|OOM|insufficient|context lost|GL_OUT_OF_MEMORY|lossy/i.test(
    String(err?.message || err || '')
  );
}

/** HQ fail / OOM → lite HDR+ODT (не LDR). */
function fallBackToIkeaHdrLite(renderer, reason) {
  console.warn('[HDR] fallback → lite ODT:', reason);
  try {
    markRoomOomSurvivor();
  } catch (_) {}
  disposeIkeaHdrState();
  try {
    return initIkeaHdrLitePipeline(renderer);
  } catch (e) {
    console.error('[HDR] lite init failed', e?.message || e);
    disposeIkeaHdrState();
    return null;
  }
}

/**
 * После webglcontextrestored: пересобрать lite HDR (RT/материалы GPU-битые).
 * Не location.reload — только pipeline.
 */
export function reinitIkeaHdrAfterWebGlRestore(renderer = state.renderer) {
  if (!renderer || IKEA_V0_ACTIVE_PHASE < 6) return { ok: false, reason: 'no renderer/phase' };
  disposeIkeaHdrState();
  try {
    markRoomOomSurvivor();
  } catch (_) {}
  state._webglContextLost = false;
  const s = initIkeaHdrLitePipeline(renderer);
  syncHdrFramebufferWriteOnScene(0);
  syncExposureUniformsOnScene();
  if (typeof window !== 'undefined') {
    window.__cldIkeaHdrPipeline = s?.lite ? 'lite' : s?.ready ? 'hq' : 'none';
  }
  return { ok: !!s?.ready, lite: !!s?.lite, pipeline: s?.pipelineVer || null };
}

export function ensureIkeaHdrPipelineReady(renderer = state.renderer) {
  if (IKEA_V0_ACTIVE_PHASE < 6 || !renderer) return null;
  if (_hdrState?.ready) return _hdrState;
  return initIkeaHdrDisplayPipeline(renderer);
}

export function initIkeaHdrDisplayPipeline(renderer) {
  if (IKEA_V0_ACTIVE_PHASE < 6 || !renderer) return null;
  // Windows Chrome: полный HDR (MSAA×2 + TAA×2 + down + FXAA) → OOM.
  // lowmem: один HalfFloat @ canvas + ODT blit — тот же свет, без пересвета и без Aw Snap.
  if (isRoomLowMemMode()) {
    return initIkeaHdrLitePipeline(renderer);
  }
  if (
    _hdrState?.ready &&
    !_hdrState.lite &&
    _hdrState.pipelineVer === HDR_PIPELINE_VER &&
    _hdrState.msaaSamples === HDR_MSAA_SAMPLES &&
    _hdrState.ssScale === HDR_SS_SCALE &&
    _hdrState.accumFrames === ACCUM_FRAME_COUNT
  ) {
    return _hdrState;
  }
  disposeIkeaHdrState();

  try {
  const { w, h } = hdrFramebufferSize(renderer);
  const present = presentFramebufferSize(renderer);
  const rt = new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    colorSpace: THREE.LinearSRGBColorSpace,
    depthBuffer: true,
    stencilBuffer: false,
    samples: HDR_MSAA_SAMPLES,
  });
  rt.texture.minFilter = THREE.LinearFilter;
  rt.texture.magFilter = THREE.LinearFilter;
  rt.texture.generateMipmaps = false;
  const depthTexture = new THREE.DepthTexture(w, h, THREE.UnsignedIntType);
  depthTexture.format = THREE.DepthFormat;
  rt.depthTexture = depthTexture;

  const rtResolved = new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    colorSpace: THREE.LinearSRGBColorSpace,
    depthBuffer: false,
    stencilBuffer: false,
    samples: 0,
  });
  rtResolved.texture.minFilter = THREE.LinearFilter;
  rtResolved.texture.magFilter = THREE.LinearFilter;
  rtResolved.texture.generateMipmaps = false;

  /** Orbit/pan: same shaders/light, no MSAA×4 / TAA — kills mid-drag hitch with cabinet. */
  const rtOrbit = new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    colorSpace: THREE.LinearSRGBColorSpace,
    depthBuffer: true,
    stencilBuffer: false,
    samples: 0,
  });
  rtOrbit.texture.minFilter = THREE.LinearFilter;
  rtOrbit.texture.magFilter = THREE.LinearFilter;
  rtOrbit.texture.generateMipmaps = false;
  const orbitDepth = new THREE.DepthTexture(w, h, THREE.UnsignedIntType);
  orbitDepth.format = THREE.DepthFormat;
  rtOrbit.depthTexture = orbitDepth;

  /** IKEA interactive: canvas-res HDR (no SS) + ODT blit — same exposure, fewer pixels. */
  const rtOrbitLo = new THREE.WebGLRenderTarget(present.w, present.h, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    colorSpace: THREE.LinearSRGBColorSpace,
    depthBuffer: true,
    stencilBuffer: false,
    samples: 0,
  });
  rtOrbitLo.texture.minFilter = THREE.LinearFilter;
  rtOrbitLo.texture.magFilter = THREE.LinearFilter;
  rtOrbitLo.texture.generateMipmaps = false;
  const orbitLoDepth = new THREE.DepthTexture(present.w, present.h, THREE.UnsignedIntType);
  orbitLoDepth.format = THREE.DepthFormat;
  rtOrbitLo.depthTexture = orbitLoDepth;

  const accumRrtSpace = hdrAccumSupportsRrtSpace(renderer);
  const accOpts = hdrAccumRenderTargetOptions(renderer);
  const accRtA = new THREE.WebGLRenderTarget(w, h, accOpts);
  const accRtB = new THREE.WebGLRenderTarget(w, h, accOpts);
  accRtA.texture.minFilter = THREE.LinearFilter;
  accRtA.texture.magFilter = THREE.LinearFilter;
  accRtB.texture.minFilter = THREE.LinearFilter;
  accRtB.texture.magFilter = THREE.LinearFilter;

  const downOpts = {
    type: THREE.UnsignedByteType,
    format: THREE.RGBAFormat,
    colorSpace: THREE.NoColorSpace,
    depthBuffer: false,
    stencilBuffer: false,
  };
  const downRt = new THREE.WebGLRenderTarget(present.w, present.h, downOpts);
  downRt.texture.minFilter = THREE.LinearFilter;
  downRt.texture.magFilter = THREE.LinearFilter;

  const resolvePass = makeHdrFullscreenScene(HDR_RESOLVE_FRAG, {
    hdrMap: { value: rt.texture },
  });

  const accumPass = makeHdrFullscreenScene(
    hdrAccumFragmentShader(accumRrtSpace),
    {
    currentHdr: { value: rtResolved.texture },
    previousAcc: { value: accRtB.texture },
    accumulationBlend: { value: 1 },
    }
  );

  _fxaaResolution.set(1 / Math.max(1, present.w), 1 / Math.max(1, present.h));
  const displayPass = makeHdrFullscreenScene(
    HDR_DISPLAY_FRAG,
    {
      tDiffuse: { value: downRt.texture },
      resolution: { value: _fxaaResolution.clone() },
    },
    FXAAShader.vertexShader,
    false
  );

  const blitPass = makeHdrFullscreenScene(
    accumRrtSpace ? HDR_BLIT_FRAG : HDR_BLIT_COPY_FRAG,
    {
    tex: { value: accRtA.texture },
    }
  );

  _hdrState = {
    ready: true,
    pipelineVer: HDR_PIPELINE_VER,
    accumRrtSpace,
    msaaSamples: rt.samples,
    ssScale: HDR_SS_SCALE,
    accumFrames: ACCUM_FRAME_COUNT,
    rtW: w,
    rtH: h,
    presentW: present.w,
    presentH: present.h,
    rt,
    rtResolved,
    rtOrbit,
    rtOrbitLo,
    accumIndex: 0,
    jitterIndex: 0,
    jitterSamples: buildHaltonJitterSamples(ACCUM_FRAME_COUNT),
    accPing: 0,
    accRtA,
    accRtB,
    downRt,
    resolveMat: resolvePass.mat,
    resolveScene: resolvePass.scene,
    resolveCam: resolvePass.cam,
    accumMat: accumPass.mat,
    accumScene: accumPass.scene,
    accumCam: accumPass.cam,
    displayMat: displayPass.mat,
    displayScene: displayPass.scene,
    displayCam: displayPass.cam,
    blitMat: blitPass.mat,
    blitScene: blitPass.scene,
    blitCam: blitPass.cam,
    accumReady: false,
    latestAccRt: null,
    singleFrameResolvedReady: false,
    camAnchor: null,
    accumResetReason: 'init',
    needsAccClear: true,
    viewOffsetActive: false,
    motionActive: false,
    sceneInteraction: false,
  };
  syncHdrFramebufferWriteOnScene(0);
  syncExposureUniformsOnScene();
  console.log(
    '[IKEA v0] HDR MSAA×' +
      rt.samples +
      ' resolve + accum×' +
      ACCUM_FRAME_COUNT +
      ' + downscale + FXAA@canvas ·',
    w,
    'x',
    h,
    '→',
    present.w,
    'x',
    present.h
  );
  return _hdrState;
  } catch (e) {
    return fallBackToIkeaHdrLite(renderer, e?.message || e);
  }
}

/**
 * Interactive orbit/pan — IKEA-like:
 * - same HDR write + ODT blit (no zasvet)
 * - TAA off / no MSAA×4
 * - scene at canvas res (not SS HDR) + blit straight to canvas (no FXAA)
 * Soft/Spot not rebuilt (sync skipped while dragging).
 */
function renderIkeaHdrOrbitInteractive(renderer, scene, camera) {
  const rtLo = _hdrState?.rtOrbitLo;
  if (!rtLo || !_hdrState.blitMat) return false;

  if (_hdrState.accumIndex > 0 || _hdrState.accumReady) {
    resetIkeaHdrAccumulation('orbit');
  }
  _hdrState.motionActive = true;
  _hdrState.cameraMoving = true;
  detectIkeaHdrCameraMotion(camera);

  const prevTarget = renderer.getRenderTarget();
  const prevAutoClear = renderer.autoClear;
  const prevClear = new THREE.Color();
  renderer.getClearColor(prevClear);
  const prevClearAlpha = renderer.getClearAlpha();

  const vpW = Math.max(1, rtLo.width);
  const vpH = Math.max(1, rtLo.height);
  syncCameraUniformsOnScene(camera, renderer, { hdrPass: true, vpW, vpH });
  syncHdrFramebufferWriteOnScene(1);

  renderer.setRenderTarget(rtLo);
  renderer.setClearColor(ensureHdrSurroundClearRrt(), 1);
  renderer.autoClear = true;
  renderer.clear(true, true, false);
  renderer.render(scene, camera);

  /** Same ODT as settled blit — directly to canvas (IKEA keeps output path). */
  _hdrState.blitMat.uniforms.tex.value = rtLo.texture;
  syncHdrFramebufferWriteOnScene(0);
  const liteFxaa = _hdrState.lite && _hdrState.downRt && _hdrState.displayMat;
  if (liteFxaa) {
    renderer.setRenderTarget(_hdrState.downRt);
    renderer.autoClear = true;
    renderer.clear(true, true, false);
    renderer.render(_hdrState.blitScene, _hdrState.blitCam);
    _hdrState.displayMat.uniforms.tDiffuse.value = _hdrState.downRt.texture;
    _hdrState.displayMat.uniforms.resolution.value.set(
      1 / Math.max(1, _hdrState.presentW),
      1 / Math.max(1, _hdrState.presentH)
    );
  }
  renderer.setRenderTarget(null);
  renderer.setClearColor(SOT.canvasClearHex, 1);
  renderer.autoClear = true;
  renderer.clear(true, true, false);
  if (liteFxaa) {
    renderer.render(_hdrState.displayScene, _hdrState.displayCam);
  } else {
    renderer.render(_hdrState.blitScene, _hdrState.blitCam);
  }

  renderer.setClearColor(prevClear, prevClearAlpha);
  renderer.setRenderTarget(prevTarget);
  renderer.autoClear = prevAutoClear;
  return true;
}

/**
 * lowmem settled: canvas HDR + Halton jitter TAA (без MSAA) → ODT → FXAA.
 * Jitter keeps cycling after accumReady — otherwise the 1/16 EMA drifts back to aliased frames.
 */
function renderIkeaHdrLiteSettled(renderer, scene, camera) {
  const s = _hdrState;
  const rtLo = s?.rtOrbitLo;
  if (!rtLo || !s.accumMat || !s.accRtA || !s.accRtB || !s.downRt || !s.displayMat) {
    return renderIkeaHdrOrbitInteractive(renderer, scene, camera);
  }
  const doorAnimating = isIkeaHdrDoorAnimationMotion();
  const sceneInteraction = isIkeaHdrSceneInteractionMotion();
  const cameraMoving = detectIkeaHdrCameraMotion(camera);
  if (state.isRotating || state.isPanning || sceneInteraction || cameraMoving) {
    return renderIkeaHdrOrbitInteractive(renderer, scene, camera);
  }
  s.motionActive = false;
  s.sceneInteraction = false;
  s.doorAnimating = doorAnimating;
  s.cameraMoving = false;

  const prevTarget = renderer.getRenderTarget();
  const prevAutoClear = renderer.autoClear;
  const prevClear = new THREE.Color();
  renderer.getClearColor(prevClear);
  const prevClearAlpha = renderer.getClearAlpha();

  if (s.needsAccClear) {
    const accClear = s.accumRrtSpace ? ensureHdrSurroundClearRrt() : 0x000000;
    renderer.autoClear = true;
    renderer.setClearColor(accClear, 1);
    renderer.setRenderTarget(s.accRtA);
    renderer.clear(true, true, false);
    renderer.setRenderTarget(s.accRtB);
    renderer.clear(true, true, false);
    s.needsAccClear = false;
  }

  const vpW = Math.max(1, rtLo.width);
  const vpH = Math.max(1, rtLo.height);
  if (
    !isTopDownCamera(camera) &&
    !isSceneCadOrthoView() &&
    !camera?.isOrthographicCamera
  ) {
    const sample = s.jitterSamples[s.jitterIndex];
    camera.setViewOffset(
      vpW,
      vpH,
      sample.x * 0.5 * ACCUM_JITTER_MULTIPLIER,
      sample.y * 0.5 * ACCUM_JITTER_MULTIPLIER,
      vpW,
      vpH
    );
    s.viewOffsetActive = true;
  }
  syncCameraUniformsOnScene(camera, renderer, { hdrPass: true, vpW, vpH });
  syncHdrFramebufferWriteOnScene(1);
  renderer.setRenderTarget(rtLo);
  renderer.setClearColor(ensureHdrSurroundClearRrt(), 1);
  renderer.autoClear = true;
  renderer.clear(true, true, false);
  renderer.render(scene, camera);
  restoreIkeaProjection(camera);

  const blend = 1 / (1 + Math.min(s.accumIndex, ACCUM_FRAME_COUNT - 1));
  const readAcc = s.accPing ? s.accRtB : s.accRtA;
  const writeAcc = s.accPing ? s.accRtA : s.accRtB;
  s.accumMat.uniforms.currentHdr.value = rtLo.texture;
  s.accumMat.uniforms.previousAcc.value = readAcc.texture;
  s.accumMat.uniforms.accumulationBlend.value = blend;
  renderer.setRenderTarget(writeAcc);
  renderer.render(s.accumScene, s.accumCam);
  s.latestAccRt = writeAcc;
  s.accPing = 1 - s.accPing;
  s.accumIndex = Math.min(s.accumIndex + 1, ACCUM_FRAME_COUNT);
  s.jitterIndex = (s.jitterIndex + 1) % ACCUM_FRAME_COUNT;
  s.accumReady = s.accumIndex >= ACCUM_FRAME_COUNT;

  syncHdrFramebufferWriteOnScene(0);
  s.blitMat.uniforms.tex.value = writeAcc.texture;
  renderer.setRenderTarget(s.downRt);
  renderer.clear(true, true, false);
  renderer.render(s.blitScene, s.blitCam);

  s.displayMat.uniforms.tDiffuse.value = s.downRt.texture;
  s.displayMat.uniforms.resolution.value.set(1 / Math.max(1, s.presentW), 1 / Math.max(1, s.presentH));
  renderer.setRenderTarget(null);
  renderer.setClearColor(SOT.canvasClearHex, 1);
  renderer.clear(true, true, false);
  renderer.render(s.displayScene, s.displayCam);

  renderer.setClearColor(prevClear, prevClearAlpha);
  renderer.setRenderTarget(prevTarget);
  renderer.autoClear = prevAutoClear;
  return true;
}

/** Phase 6d + p8z28: surround RRT clear + TAA settled + downscale + FXAA@canvas. */
export function renderIkeaRoomLightV0(renderer, scene, camera, hdrFramebufferWriteOverride = null) {
  if (!renderer || !scene || !camera) return false;
  if (isWebGlContextLost(renderer)) {
    state._webglContextLost = true;
    return false;
  }
  try {
    // Диагностика Spot-disk — намеренный LDR; не production path.
    if (_debugSpotDisk || _forceLdrProbe) {
      syncCameraUniformsOnScene(camera, renderer);
      renderer.render(scene, camera);
      return false;
    }

    if (!isIkeaHdrDisplayActive()) {
      ensureIkeaHdrPipelineReady(renderer);
    }
    if (!isIkeaHdrDisplayActive()) {
      console.warn(
        '[HDR] pipeline unavailable after ensure — emergency canvas (no ODT). Check GPU / ?hq=1.'
      );
      syncCameraUniformsOnScene(camera, renderer);
      renderer.render(scene, camera);
      return false;
    }

    if (_hdrState?.lite) {
      return renderIkeaHdrLiteSettled(renderer, scene, camera);
    }
    /** mid-drag: canvas-res HDR + ODT blit (без MSAA/TAA). */
    if ((state.isRotating || state.isPanning) && _hdrState?.rtOrbitLo) {
      return renderIkeaHdrOrbitInteractive(renderer, scene, camera);
    }

    const doorAnimating = isIkeaHdrDoorAnimationMotion();
    const sceneInteraction = isIkeaHdrSceneInteractionMotion();
    const cameraMoving = detectIkeaHdrCameraMotion(camera);
    const motionActive = sceneInteraction || cameraMoving;
    if (motionActive) {
      if (_hdrState.accumIndex > 0 || _hdrState.accumReady) {
        resetIkeaHdrAccumulation(
          doorAnimating ? 'door' : sceneInteraction ? 'scene' : 'motion'
        );
      }
    } else if (shouldResetIkeaHdrAccum(camera)) {
      resetIkeaHdrAccumulation('camera');
    }
    _hdrState.motionActive = motionActive;
    _hdrState.sceneInteraction = sceneInteraction;
    _hdrState.doorAnimating = doorAnimating;
    _hdrState.cameraMoving = cameraMoving;

  const prevTarget = renderer.getRenderTarget();
  const prevAutoClear = renderer.autoClear;
  const prevClear = new THREE.Color();
  renderer.getClearColor(prevClear);
  const prevClearAlpha = renderer.getClearAlpha();

  if (_hdrState.needsAccClear) {
    const accClear = _hdrState.accumRrtSpace ? ensureHdrSurroundClearRrt() : 0x000000;
    const accClearAlpha = 1;
    renderer.setRenderTarget(_hdrState.accRtA);
    renderer.setClearColor(accClear, accClearAlpha);
    renderer.autoClear = true;
    renderer.clear(true, true, false);
    renderer.setRenderTarget(_hdrState.accRtB);
    renderer.setClearColor(accClear, accClearAlpha);
    renderer.clear(true, true, false);
    _hdrState.needsAccClear = false;
  }

  applyIkeaProjectionJitter(camera, renderer);
  syncCameraUniformsOnScene(camera, renderer, { hdrPass: true });
  /** Spot/floor maps are view-independent — skip mid-orbit (was full traverse hitch). */
  if (!(state.isRotating || state.isPanning)) {
    syncSpotUniformsOnScene();
    ensureFloorIkeaMapBound(state.room);
  }

  syncHdrFramebufferWriteOnScene(
    hdrFramebufferWriteOverride != null ? hdrFramebufferWriteOverride : 1
  );
  renderer.setRenderTarget(_hdrState.rt);
  renderer.setClearColor(ensureHdrSurroundClearRrt(), 1);
  renderer.autoClear = true;
  renderer.clear(true, true, false);
  renderer.render(scene, camera);

  restoreIkeaProjection(camera);

  // Unbind MSAA RT → Three.js resolves multisample → rt.texture sampleable.
  renderer.setRenderTarget(null);
  _hdrState.resolveMat.uniforms.hdrMap.value = _hdrState.rt.texture;
  renderer.setRenderTarget(_hdrState.rtResolved);
  renderer.autoClear = true;
  renderer.clear(true, true, false);
  renderer.render(_hdrState.resolveScene, _hdrState.resolveCam);

  // Motion: replace buffer with current pose only (blend=1). Settled: IKEA mix 1/(1+i).
  const effectiveIndex = motionActive
    ? 0
    : Math.min(_hdrState.accumIndex, ACCUM_FRAME_COUNT - 1);
  const blend = 1 / (1 + effectiveIndex);
  const readAcc = _hdrState.accPing ? _hdrState.accRtB : _hdrState.accRtA;
  const writeAcc = _hdrState.accPing ? _hdrState.accRtA : _hdrState.accRtB;

  _hdrState.accumMat.uniforms.currentHdr.value = _hdrState.rtResolved.texture;
  _hdrState.accumMat.uniforms.previousAcc.value = readAcc.texture;
  _hdrState.accumMat.uniforms.accumulationBlend.value = blend;

  renderer.setRenderTarget(writeAcc);
  renderer.autoClear = true;
  renderer.clear(true, true, false);
  renderer.render(_hdrState.accumScene, _hdrState.accumCam);

  const latestAcc = writeAcc;
  _hdrState.latestAccRt = latestAcc;
  _hdrState.accPing = 1 - _hdrState.accPing;
  if (motionActive) {
    _hdrState.accumIndex = 0;
    _hdrState.jitterIndex = 0;
    _hdrState.accumReady = false;
  } else {
    _hdrState.accumIndex = Math.min(_hdrState.accumIndex + 1, ACCUM_FRAME_COUNT);
    _hdrState.jitterIndex = (_hdrState.jitterIndex + 1) % ACCUM_FRAME_COUNT;
    _hdrState.accumReady = _hdrState.accumIndex >= ACCUM_FRAME_COUNT;
    storeIkeaHdrCamAnchor(camera);
  }

  // HDR accum (RRT) → tonemap at blit → canvas-res downscale, then FXAA at final pixel size.
  _hdrState.blitMat.uniforms.tex.value = latestAcc.texture;
  renderer.setRenderTarget(_hdrState.downRt);
  renderer.autoClear = true;
  renderer.clear(true, true, false);
  renderer.render(_hdrState.blitScene, _hdrState.blitCam);

  _hdrState.displayMat.uniforms.tDiffuse.value = _hdrState.downRt.texture;
  _hdrState.displayMat.uniforms.resolution.value.set(
    1 / Math.max(1, _hdrState.presentW),
    1 / Math.max(1, _hdrState.presentH)
  );
  syncHdrFramebufferWriteOnScene(0);
  renderer.setRenderTarget(null);
  renderer.setClearColor(SOT.canvasClearHex, 1);
  renderer.autoClear = true;
  renderer.clear(true, true, false);
  renderer.render(_hdrState.displayScene, _hdrState.displayCam);

  renderer.setClearColor(prevClear, prevClearAlpha);
  renderer.setRenderTarget(prevTarget);
  renderer.autoClear = prevAutoClear;
  return true;
  } catch (e) {
    try {
      renderer.setRenderTarget(null);
    } catch (_) {}
    if (isWebGlContextLost(renderer)) {
      state._webglContextLost = true;
      disposeIkeaHdrState();
      if (!renderIkeaRoomLightV0._abortLogged) {
        renderIkeaRoomLightV0._abortLogged = true;
        console.warn('[HDR] context lost mid-frame — wait webglcontextrestored');
      }
      return false;
    }
    if (isHdrOomLikeError(e) && !renderIkeaRoomLightV0._oomFallbackTried) {
      renderIkeaRoomLightV0._oomFallbackTried = true;
      const lite = fallBackToIkeaHdrLite(renderer, e?.message || e);
      if (lite?.ready) {
        try {
          return renderIkeaHdrLiteSettled(renderer, scene, camera);
        } catch (e2) {
          console.warn('[HDR] lite settle after OOM failed', e2?.message || e2);
        }
      }
    }
    if (!renderIkeaRoomLightV0._abortLogged) {
      renderIkeaRoomLightV0._abortLogged = true;
      console.warn('[IKEA v0] render aborted', e?.message || e);
    }
    return false;
  }
}

function buildSoftBlurFrag() {
  const offs = SOT.soft.blurOffsets;
  const wts = SOT.soft.blurWeights;
  const taps = offs
    .map(
      (o, i) =>
        `  sum += texture2D(source, vUv + direction * ${o.toFixed(10)}) * ${wts[i].toFixed(10)};`
    )
    .join('\n');
  return /* glsl */ `
uniform sampler2D source;
uniform vec2 direction;
varying vec2 vUv;
void main() {
  vec4 sum = vec4(0.0);
${taps}
  gl_FragColor = sum;
}
`;
}

/** p8z129/134: IKEA soft_shadow_transfer_depth — depth + invVP → world Y metres (dump DEy_Xiep). */
function buildSoftTransferDepthFrag() {
  const mmToM = MM_TO_M.toFixed(8);
  return /* glsl */ `
uniform sampler2D depthTexture;
uniform mat4 inverseViewProjectionMatrix;
varying vec2 vUv;

void main() {
  float depth = texture2D(depthTexture, vUv).r;
  if (depth >= 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec3 P = vec3(vUv, depth) * 2.0 - 1.0;
  vec4 reprojected = inverseViewProjectionMatrix * vec4(P, 1.0);
  reprojected.xyz /= reprojected.w;
  /** Dump: gl_FragColor = vec4(reprojected.y,0,0,1) — metres, not /size.y. */
  float yM = max(reprojected.y * ${mmToM}, 0.0);
  gl_FragColor = vec4(yM, 0.0, 0.0, 1.0);
}
`;
}

function makeSoftDepthRenderTarget(res) {
  const depthTexture = new THREE.DepthTexture(res, res);
  depthTexture.format = THREE.DepthFormat;
  depthTexture.type = THREE.UnsignedIntType;
  const rt = new THREE.WebGLRenderTarget(res, res, {
    depthTexture,
    depthBuffer: true,
  });
  return { rt, depthTexture };
}

/**
 * Soft height — dump Soft AO uses world Y metres; top-down highest Y wins (IKEA depth→transfer).
 * Opaque + depthTest: camera above → nearest fragment = max Y (MAX blend left float RT empty
 * for top PlaneGeometry quads — r3j57: proxies 152 / quads 74 / raw nz still 28).
 */
function createSoftHeightCaptureMaterial() {
  const mmToM = MM_TO_M.toFixed(8);
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    depthTest: true,
    depthWrite: true,
    lights: false,
    toneMapped: false,
    fog: false,
    transparent: false,
    blending: THREE.NoBlending,
    vertexShader: /* glsl */ `
varying float vWorldYM;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldYM = max(wp.y * ${mmToM}, 0.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,
    fragmentShader: /* glsl */ `
varying float vWorldYM;
void main() {
  gl_FragColor = vec4(vWorldYM, 0.0, 0.0, 1.0);
}
`,
  });
}

/** Kept for audit / dump compare — not used in Soft AO path after p8z137. */
function createSoftDepthCaptureMaterial() {
  return new THREE.MeshDepthMaterial({
    side: THREE.DoubleSide,
  });
}

const SOFT_POST_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

function makeFullscreenPass(fragmentShader, uniforms) {
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: SOFT_POST_VERT,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  const sc = new THREE.Scene();
  sc.add(mesh);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  return { scene: sc, camera: cam, material: mat };
}

function makeSoftHeightRenderTarget(res) {
  return new THREE.WebGLRenderTarget(res, res, {
    type: THREE.FloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
  });
}

function initSoftPlanePipeline(renderer) {
  if (_softState?.ready && _softState.version === SOFT_PIPELINE_VER) return _softState;
  if (_softState) {
    _softState.rtHeight?.dispose?.();
    _softState.rtBlurH?.dispose?.();
    _softState.rtBlurV?.dispose?.();
    _softState.rtAlpha?.dispose?.();
    _softState.blurPassH?.material?.dispose?.();
    _softState.blurPassV?.material?.dispose?.();
    _softState.rtDepth?.dispose?.();
    _softState.depthTexture?.dispose?.();
    _softState.transferPass?.material?.dispose?.();
    _softState.generatePass?.material?.dispose?.();
    _softState.copyPass?.material?.dispose?.();
    _softState.depthCaptureOverride?.dispose?.();
    _softState.heightCaptureOverride?.dispose?.();
    _softState.emptyAlphaTex?.dispose?.();
    _softState.emptyHeightTex?.dispose?.();
    if (_softState.captureScene) {
      while (_softState.captureScene.children.length) {
        _softState.captureScene.remove(_softState.captureScene.children[0]);
      }
    }
    _softState = null;
  }
  const res = SOFT_RES;
  const blurFrag = buildSoftBlurFrag();
  const transferFrag = buildSoftTransferDepthFrag();
  const { rt: rtDepth, depthTexture } = makeSoftDepthRenderTarget(res);
  const rtHeight = makeSoftHeightRenderTarget(res);
  const rtBlurH = makeSoftHeightRenderTarget(res);
  const rtBlurV = makeSoftHeightRenderTarget(res);
  const rtAlpha = new THREE.WebGLRenderTarget(res, res, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  });

  const generateFrag = /* glsl */ `
uniform sampler2D heightMap;
uniform float referenceHeight;
uniform float intensity;
varying vec2 vUv;
void main() {
  vec2 uv = vec2(1.0 - vUv.x, vUv.y);
  /** Dump soft_shadow_generate_texture: h = texture.r (same units as PBR AO). */
  float h = texture2D(heightMap, uv).r;
  float alpha = 1.0 - exp(-max(0.0, h - referenceHeight) * intensity);
  gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
}
`;

  const invViewProjection = new THREE.Matrix4();
  const transferPass = makeFullscreenPass(transferFrag, {
    depthTexture: { value: depthTexture },
    inverseViewProjectionMatrix: { value: invViewProjection },
  });
  const blurPassH = makeFullscreenPass(blurFrag, {
    source: { value: rtHeight.texture },
    direction: { value: new THREE.Vector2(1 / res, 0) },
  });
  const blurPassV = makeFullscreenPass(blurFrag, {
    source: { value: rtBlurH.texture },
    direction: { value: new THREE.Vector2(0, 1 / res) },
  });
  const copyFrag = /* glsl */ `
uniform sampler2D source;
varying vec2 vUv;
void main() {
  gl_FragColor = texture2D(source, vUv);
}
`;
  const copyPass = makeFullscreenPass(copyFrag, {
    source: { value: rtHeight.texture },
  });
  const generatePass = makeFullscreenPass(generateFrag, {
    heightMap: { value: rtBlurV.texture },
    referenceHeight: { value: SOT.soft.referenceHeight_m },
    intensity: { value: SOT.soft.intensity },
  });

  const emptyData = new Uint8Array([0, 0, 0, 0]);
  const emptyAlphaTex = new THREE.DataTexture(emptyData, 1, 1, THREE.RGBAFormat);
  emptyAlphaTex.needsUpdate = true;
  const emptyHeightData = new Uint8Array([0, 0, 0, 255]);
  const emptyHeightTex = new THREE.DataTexture(emptyHeightData, 1, 1, THREE.RGBAFormat);
  emptyHeightTex.needsUpdate = true;

  const halfX = m2mm(SOT.soft.size_m.x) * 0.5;
  const halfZ = m2mm(SOT.soft.size_m.z) * 0.5;
  const orthoCam = new THREE.OrthographicCamera(-halfX, halfX, halfZ, -halfZ, 10, 50000);
  orthoCam.layers.set(SOFT_LAYER);
  // p8z44: no layer-4 trim in height capture (full-wall plank inflated blur footprint).

  const depthCaptureOverride = createSoftDepthCaptureMaterial();
  const heightCaptureOverride = createSoftHeightCaptureMaterial();

  _softState = {
    ready: true,
    version: SOFT_PIPELINE_VER,
    renderer,
    rtDepth,
    depthTexture,
    rtHeight,
    rtBlurH,
    rtBlurV,
    rtAlpha,
    transferPass,
    invViewProjection,
    blurPassH,
    blurPassV,
    copyPass,
    generatePass,
    orthoCam,
    depthCaptureOverride,
    heightCaptureOverride,
    emptyAlphaTex,
    emptyHeightTex,
    alphaTexture: emptyAlphaTex,
    heightMapTexture: emptyHeightTex,
    lastCasterCount: 0,
    lastHeightCaptureCount: 0,
    lastCaptureProxyCount: 0,
    lastCaptureTopQuadCount: 0,
    heightRtFloat: true,
    /** Isolated scene — Soft height without main-graph layer/frustum quirks. */
    captureScene: new THREE.Scene(),
  };
  return _softState;
}

/** Layer-2 furniture OR layer-5 trim — soft plane floor footprint. */
function meshContributesSoftFloorContact(o) {
  if (!o?.isMesh) return false;
  const m = o.layers.mask;
  return !!(m & (1 << SOFT_LAYER)) || !!(m & (1 << SOFT_FLOOR_LAYER));
}

/** Layer-2 height silhouette — IKEA dump layerMask 3: corpus/back + shelf/drawer modules. */
function ikeaV0KindFromMesh(o) {
  return o?.material?.userData?.__cldIkeaV0Kind ?? null;
}

function meshOnSoftLayer2(o) {
  return !!(o?.layers?.mask & (1 << SOFT_LAYER));
}

/** Layer 5 only (trim floor contact) — IKEA block_layer_mask 32, not height silhouette. */
function meshOnSoftFloorLayerOnly(o) {
  const m = o?.layers?.mask ?? 0;
  return !!(m & SOFT_BLOCK_LAYER_MASK) && !(m & (1 << SOFT_LAYER));
}

/** IKEA Soft height casters: horizontal shelf/drawer boards (dump model80–96 on mask 3). */
function meshIsSoftHeightShelfModule(o) {
  if (!o?.isMesh) return false;
  if (meshSpotShadowIsShelfLike(o)) return true;
  if (meshSpotShadowIsDrawerLike(o)) return true;
  if (meshSpotShadowHorizontalShelfCaster(o)) return true;
  let p = o;
  for (let i = 0; i < 24 && p; i++) {
    const lr = String(p.userData?.layoutRole || '').toLowerCase();
    if (SPOT_SHADOW_MODULE_CAST_ROLES.has(lr)) return true;
    if (p.userData?.isFlatCatalogShelf) return true;
    p = p.parent;
  }
  return false;
}

function meshContributesSoftHeightCapture(o) {
  if (!o?.isMesh) return false;
  if (!meshOnSoftLayer2(o)) return false;
  if (meshOnSoftFloorLayerOnly(o)) return false;
  if (meshIsSectionTrimSoft(o)) return false;
  const kind = ikeaV0KindFromMesh(o);
  const shelfMod = meshIsSoftHeightShelfModule(o);
  if (kind !== 'corpus' && kind !== 'back' && !shelfMod) return false;
  const ud = o.userData || {};
  if (ud.isEdge === true && !ud.isUncutEdge && !ud.cldSectionTrimUncut) return false;
  if (ud.isVisualOnly || ud.previewOnly) return false;
  return true;
}

const _softCaptureBox = new THREE.Box3();
const _softCaptureSize = new THREE.Vector3();

/**
 * Soft height — dump Soft ortho → depth → transfer_depth → blur (no CPU roof stamp).
 * Live Soft: pre-blur nz≈170 max≈0.73; blurred nz≈1178 max≈0.28 (IKEA 2026-09-04).
 */
function captureSoftHeightmap(renderer, scene, soft, vp, includeTrimFloor) {
  syncSoftOrthoCamera(soft.orthoCam, vp.centerXmm, vp.centerZmm, vp.sizeXm, vp.sizeZm);
  soft.orthoCam.layers.mask = 0xffffffff;

  const softBit = 1 << SOFT_LAYER;
  const floorBit = 1 << SOFT_FLOOR_LAYER;
  const depthMat = soft.depthCaptureOverride || soft.heightCaptureOverride;
  const captureScene = soft.captureScene;
  while (captureScene.children.length) {
    const ch = captureScene.children[0];
    captureScene.remove(ch);
    if (ch.userData?.__cldSoftTopQuad) ch.geometry?.dispose?.();
  }

  captureScene.position.set(0, 0, 0);
  captureScene.rotation.set(0, 0, 0);
  captureScene.scale.set(1, 1, 1);
  captureScene.matrixAutoUpdate = true;

  const proxies = [];
  scene.updateMatrixWorld(true);
  scene.traverse((o) => {
    if (!o?.isMesh || o.visible === false || !o.geometry) return;
    const m = o.layers?.mask ?? 0;
    if (!(m & softBit) && !(includeTrimFloor && m & floorBit)) return;
    if (meshIsSectionTrimSoft(o) && !(includeTrimFloor && m & floorBit)) return;
    o.updateWorldMatrix(true, false);

    const proxy = new THREE.Mesh(o.geometry, depthMat);
    proxy.frustumCulled = false;
    proxy.matrixAutoUpdate = false;
    proxy.matrix.copy(o.matrixWorld);
    proxy.matrixWorld.copy(o.matrixWorld);
    proxy.matrixWorldNeedsUpdate = false;
    captureScene.add(proxy);
    proxies.push(proxy);
  });
  soft.lastCaptureProxyCount = proxies.length;
  soft.lastCaptureTopQuadCount = 0;
  captureScene.updateMatrixWorld(true);

  const prevTarget = renderer.getRenderTarget();
  const prevClear = new THREE.Color();
  renderer.getClearColor(prevClear);
  const prevClearAlpha = renderer.getClearAlpha();
  renderer.setClearColor(0x000000, 1);
  renderer.setRenderTarget(soft.rtDepth);
  renderer.clear(true, true, true);
  try {
    renderer.render(captureScene, soft.orthoCam);
    soft.invViewProjection
      .multiplyMatrices(soft.orthoCam.projectionMatrix, soft.orthoCam.matrixWorldInverse)
      .invert();
    soft.transferPass.material.uniforms.depthTexture.value = soft.depthTexture;
    soft.transferPass.material.uniforms.inverseViewProjectionMatrix.value = soft.invViewProjection;
    blitPass(renderer, soft.transferPass, soft.rtHeight);
  } finally {
    for (let i = 0; i < proxies.length; i++) {
      const p = proxies[i];
      captureScene.remove(p);
      if (p.userData?.__cldSoftTopQuad) p.geometry?.dispose?.();
      p.geometry = null;
      p.material = null;
    }
    configureSoftOrthoLayers(soft.orthoCam, includeTrimFloor);
    renderer.setClearColor(prevClear, prevClearAlpha);
    renderer.setRenderTarget(prevTarget);
  }

  blitPass(renderer, soft.blurPassH, soft.rtBlurH, {
    source: soft.rtHeight.texture,
  });
  blitPass(renderer, soft.blurPassV, soft.rtBlurV, {
    source: soft.rtBlurH.texture,
  });
  /** GPU height only — Soft AO roof stamp removed (r3j65/r3j66). Live blur max≈0.28. */
  return soft.rtBlurV.texture;
}

/** Full-wall обклад must not drive capture-fit extent (else 5 m slab → blur kills nzMax). */
function meshIsSectionTrimSoft(o) {
  let p = o;
  for (let i = 0; i < 20 && p; i++) {
    if (p.userData?.sectionTrimUsesOutsideDecor === true) return true;
    if (p.userData?.isFurniture === true) return false;
    p = p.parent;
  }
  return false;
}

/** Layer-2 casters world XZ bbox (m) for floor contact mask — pad for blur edge.
 *  Per furniture root (not expandByObject on every soft mesh) — place lag with N cabinets. */
function resolveSoftLayerCastersFootprintWorldM(scene, padMm = 120) {
  if (!scene) return new THREE.Vector4(0, 0, 0, 0);
  const box = new THREE.Box3();
  const tmp = new THREE.Box3();
  let any = false;
  scene.traverse((o) => {
    if (o?.userData?.isFurniture === true && !o.parent?.userData?.isFurniture) {
      tmp.setFromObject(o);
      if (tmp.isEmpty()) return;
      if (!any) {
        box.copy(tmp);
        any = true;
      } else box.union(tmp);
      return;
    }
    if (!o?.isMesh || !meshOnSoftFloorLayerOnly(o)) return;
    tmp.setFromObject(o);
    if (tmp.isEmpty()) return;
    if (!any) {
      box.copy(tmp);
      any = true;
    } else box.union(tmp);
  });
  if (!any || box.isEmpty()) return new THREE.Vector4(0, 0, 0, 0);
  const pad = padMm * MM_TO_M;
  return new THREE.Vector4(
    box.min.x * MM_TO_M - pad,
    box.min.z * MM_TO_M - pad,
    box.max.x * MM_TO_M + pad,
    box.max.z * MM_TO_M + pad
  );
}
function softViewportDumpDefault(spotFallback) {
  return {
    centerXmm: spotFallback?.x ?? 0,
    centerZmm: spotFallback?.z ?? 0,
    sizeXm: SOFT_VIEWPORT_DUMP_MAX_M,
    sizeZm: SOFT_VIEWPORT_DUMP_MAX_M,
    mode: 'dump-10x10',
  };
}

function isFiniteSoftViewport(vp) {
  return (
    vp &&
    Number.isFinite(vp.centerXmm) &&
    Number.isFinite(vp.centerZmm) &&
    Number.isFinite(vp.sizeXm) &&
    Number.isFinite(vp.sizeZm) &&
    vp.sizeXm > 0.01 &&
    vp.sizeZm > 0.01
  );
}

/** Wall + corpus/back Soft AO — IKEA dump 10×10 @ Spot.xz (one SoftShadow box). */
function resolveSoftViewportForWallAo(_scene) {
  const spotFallback = {
    x: _spotPosWorldMm?.x ?? 0,
    z: _spotPosWorldMm?.z ?? 0,
  };
  return softViewportDumpDefault(spotFallback);
}

/**
 * Floor soft plane — same dump 10×10 as Soft AO (IKEA one SoftShadow box).
 * p8z63 clean: no separate capture-fit-floor.
 */
function resolveSoftViewportForFloor(_scene) {
  const spotFallback = {
    x: _spotPosWorldMm?.x ?? 0,
    z: _spotPosWorldMm?.z ?? 0,
  };
  return softViewportDumpDefault(spotFallback);
}

function applySoftViewport(centerXmm, centerZmm, sizeXm, sizeZm) {
  const sx = Number.isFinite(sizeXm) && sizeXm > 0.01 ? sizeXm : SOFT_VIEWPORT_DUMP_MAX_M;
  const sz = Number.isFinite(sizeZm) && sizeZm > 0.01 ? sizeZm : SOFT_VIEWPORT_DUMP_MAX_M;
  const cx = Number.isFinite(centerXmm) ? centerXmm : 0;
  const cz = Number.isFinite(centerZmm) ? centerZmm : 0;
  const vpMm = softViewportMmFromCenterAndSize(cx, cz, sx, sz);
  _softViewportM = new THREE.Vector4(
    vpMm.minX * MM_TO_M,
    vpMm.minZ * MM_TO_M,
    vpMm.sizeX * MM_TO_M,
    vpMm.sizeZ * MM_TO_M
  );
  return vpMm;
}

function applySoftFloorViewport(centerXmm, centerZmm, sizeXm, sizeZm) {
  const sx = Number.isFinite(sizeXm) && sizeXm > 0.01 ? sizeXm : SOFT_VIEWPORT_DUMP_MAX_M;
  const sz = Number.isFinite(sizeZm) && sizeZm > 0.01 ? sizeZm : SOFT_VIEWPORT_DUMP_MAX_M;
  const cx = Number.isFinite(centerXmm) ? centerXmm : 0;
  const cz = Number.isFinite(centerZmm) ? centerZmm : 0;
  const vpMm = softViewportMmFromCenterAndSize(cx, cz, sx, sz);
  _softFloorViewportM = new THREE.Vector4(
    vpMm.minX * MM_TO_M,
    vpMm.minZ * MM_TO_M,
    vpMm.sizeX * MM_TO_M,
    vpMm.sizeZ * MM_TO_M
  );
  return vpMm;
}

function configureSoftOrthoLayers(orthoCam, includeTrimFloor) {
  orthoCam.layers.mask = 0;
  orthoCam.layers.enable(SOFT_LAYER);
  /** IKEA block_layer_mask=32 — layer 5 only when floor soft plane alpha pass. */
  if (includeTrimFloor) orthoCam.layers.enable(SOFT_FLOOR_LAYER);
}

function countSoftFloorContactCasters(scene) {
  if (!scene) return 0;
  let n = 0;
  scene.traverse((o) => {
    if (meshContributesSoftFloorContact(o)) n += 1;
  });
  return n;
}

function countSoftHeightCaptureMeshes(scene) {
  if (!scene) return 0;
  let n = 0;
  scene.traverse((o) => {
    if (meshContributesSoftHeightCapture(o)) n += 1;
  });
  return n;
}

function countSoftLayer2AllMeshes(scene) {
  if (!scene) return 0;
  let n = 0;
  scene.traverse((o) => {
    if (o?.isMesh && o.layers.mask & (1 << SOFT_LAYER)) n += 1;
  });
  return n;
}

function countSoftLayerCasters(scene) {
  return countSoftFloorContactCasters(scene);
}

/**
 * Soft height — dump SoftShadowRenderer camera (DEy_Xiep):
 * view = inverse(basis X=(1,0,0) Y=(0,0,-1) Z=(0,-1,0) @ soft center);
 * ortho (±size.x/2, ±size.z/2, near=-size.y/2, far=+size.y/2).
 * NOT high lookAt — that left only vertical silhouettes (raw nz≈28–32).
 */
function syncSoftOrthoCamera(orthoCam, centerXmm, centerZmm, sizeXm, sizeZm) {
  const sx = Number.isFinite(sizeXm) && sizeXm > 0.01 ? sizeXm : SOFT_VIEWPORT_DUMP_MAX_M;
  const sz = Number.isFinite(sizeZm) && sizeZm > 0.01 ? sizeZm : SOFT_VIEWPORT_DUMP_MAX_M;
  const cx = Number.isFinite(centerXmm) ? centerXmm : 0;
  const cz = Number.isFinite(centerZmm) ? centerZmm : 0;
  const halfX = m2mm(sx) * 0.5;
  const halfZ = m2mm(sz) * 0.5;
  const halfY = m2mm(SOT.soft.size_m.y) * 0.5;
  const cy = m2mm(SOT.soft.centerY_m);

  orthoCam.left = -halfX;
  orthoCam.right = halfX;
  orthoCam.top = halfZ;
  orthoCam.bottom = -halfZ;
  orthoCam.near = -halfY;
  orthoCam.far = halfY;
  orthoCam.matrixAutoUpdate = false;
  orthoCam.matrix.makeBasis(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(0, -1, 0)
  );
  orthoCam.matrix.setPosition(cx, cy, cz);
  orthoCam.matrix.decompose(orthoCam.position, orthoCam.quaternion, orthoCam.scale);
  orthoCam.matrixWorld.copy(orthoCam.matrix);
  orthoCam.matrixWorldInverse.copy(orthoCam.matrixWorld).invert();
  orthoCam.updateProjectionMatrix();
}

function blitPass(renderer, pass, target, extraUniforms) {
  if (extraUniforms) {
    Object.entries(extraUniforms).forEach(([k, v]) => {
      pass.material.uniforms[k].value = v;
    });
  }
  const prevClear = new THREE.Color();
  renderer.getClearColor(prevClear);
  const prevClearAlpha = renderer.getClearAlpha();
  renderer.setClearColor(0x000000, 1);
  renderer.setRenderTarget(target);
  renderer.clear(true, false, false);
  renderer.render(pass.scene, pass.camera);
  renderer.setClearColor(prevClear, prevClearAlpha);
}

function isWebGlContextLost(renderer = state.renderer) {
  if (state._webglContextLost) return true;
  try {
    const gl = renderer?.getContext?.();
    return !!(gl && typeof gl.isContextLost === 'function' && gl.isContextLost());
  } catch (_) {
    return true;
  }
}

function softAoHeightmapForKind(_kind) {
  if (!_softState) return null;
  /** IKEA dump: one SoftShadow heightmap @ 10×10 — corpus/back same RT as walls. */
  return _softState.heightMapTexture ?? null;
}

function softAoViewportForKind(_kind) {
  return _softViewportM;
}

function updateSoftPlanePipeline(force = false) {
  if (IKEA_V0_ACTIVE_PHASE < 3) return null;
  if (state._cldPauseLifestyleGpu) return _softState;
  const renderer = state.renderer;
  const scene = state.scene;
  if (!renderer || !scene || isWebGlContextLost(renderer)) return null;

  const soft = initSoftPlanePipeline(renderer);
  const now = performance.now();
  if (
    !force &&
    soft._lastCaptureMs > 0 &&
    now - soft._lastCaptureMs < SOFT_CAPTURE_MIN_INTERVAL_MS &&
    soft.heightMapTexture
  ) {
    return soft;
  }
  /** Orbit/pan hitch: Soft rebuild mid-drag felt like stuttering cabinet. */
  if (
    !force &&
    (state.isRotating || state.isPanning) &&
    soft.heightMapTexture
  ) {
    return soft;
  }
  soft._lastCaptureMs = now;

  const vpWall = resolveSoftViewportForWallAo(scene);
  const vpFloor = resolveSoftViewportForFloor(scene);
  applySoftViewport(vpWall.centerXmm, vpWall.centerZmm, vpWall.sizeXm, vpWall.sizeZm);
  applySoftFloorViewport(vpFloor.centerXmm, vpFloor.centerZmm, vpFloor.sizeXm, vpFloor.sizeZm);
  _softViewportMeta = vpWall;
  _softFloorViewportMeta = vpFloor;
  _softFootprintM = resolveSoftLayerCastersFootprintWorldM(scene);

  const floorCasterCount = countSoftFloorContactCasters(scene);
  const heightCaptureCount = countSoftHeightCaptureMeshes(scene);
  soft.lastCasterCount = floorCasterCount;
  soft.lastHeightCaptureCount = heightCaptureCount;

  const prevTarget = renderer.getRenderTarget();
  const prevAutoClear = renderer.autoClear;
  const prevShadowEnabled = renderer.shadowMap.enabled;
  const prevShadowAutoUpdate = renderer.shadowMap.autoUpdate;

  if (floorCasterCount === 0 && heightCaptureCount === 0) {
    soft.alphaTexture = soft.emptyAlphaTex;
    soft.heightMapTexture = soft.emptyHeightTex;
    _softFootprintM = new THREE.Vector4(0, 0, 0, 0);
    renderer.setRenderTarget(prevTarget);
    renderer.autoClear = prevAutoClear;
    return soft;
  }

  scene.updateMatrixWorld(true);
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.autoUpdate = false;
  renderer.autoClear = true;
  const prevClear = new THREE.Color();
  renderer.getClearColor(prevClear);
  const prevClearAlpha = renderer.getClearAlpha();
  renderer.setClearColor(0x000000, 1);

  const captureHeight = (vp, includeTrimFloor) =>
    captureSoftHeightmap(renderer, scene, soft, vp, includeTrimFloor);

  /** 1) Floor soft plane — layer2 furniture + layer5 trim. */
  if (floorCasterCount > 0) {
    captureHeight(vpFloor, true);
    blitPass(renderer, soft.generatePass, soft.rtAlpha, {
      heightMap: soft.rtBlurV.texture,
    });
    soft.alphaTexture = soft.rtAlpha.texture;
  } else {
    soft.alphaTexture = soft.emptyAlphaTex;
  }

  /** IKEA dump: one heightmap 10×10 — layer-2 corpus/back + walls in same pass. */
  if (heightCaptureCount > 0) {
    soft.heightMapTexture = captureHeight(vpWall, false);
  } else {
    soft.heightMapTexture = soft.emptyHeightTex;
  }
  _softHeightSampleCache = null;

  renderer.setClearColor(prevClear, prevClearAlpha);
  renderer.shadowMap.enabled = prevShadowEnabled;
  renderer.shadowMap.autoUpdate = prevShadowAutoUpdate;
  renderer.setRenderTarget(prevTarget);
  renderer.autoClear = prevAutoClear;
  return soft;
}

/** Phase 3: floor contact only — gated; walls/cabinet never composite (IKEA plane ≠ soft AO). */
function ikeaV0SoftPlaneCompositeReady() {
  if (IKEA_V0_ACTIVE_PHASE < 3) return false;
  const soft = _softState;
  if (!soft?.ready) return false;
  if ((soft.lastCasterCount ?? 0) <= 0) return false;
  if (soft.alphaTexture === soft.emptyAlphaTex) return false;
  return true;
}

/** Phase 3: floor only when layer-2 casters + atlas ready. */
function softPlaneEnabledForKind(kind) {
  return ikeaV0SoftPlaneCompositeReady() && kind === 'floor' ? 1 : 0;
}

/** Phase 4 dump B: Soft AO on IBL — walls/floor + cabinet (IKEA-betrakta-pbr-soft-spot-sot). */
function ikeaV0SoftAoEnabledForKind(kind) {
  if (IKEA_V0_ACTIVE_PHASE < 4) return 0;
  if (_debugSoftAoOff) return 0;
  if (
    kind === 'wall' ||
    kind === 'frame' ||
    kind === 'ceiling' ||
    kind === 'floor' ||
    kind === 'corpus' ||
    kind === 'back' ||
    kind === 'facade'
  ) {
    return _softState?.heightMapTexture ? 1 : 0;
  }
  return 0;
}

function ikeaV0SoftAoEnabledForMaterial(mat) {
  if (!mat?.userData?.__cldIkeaV0) return 0;
  return ikeaV0SoftAoEnabledForKind(mat.userData.__cldIkeaV0Kind);
}

function softAoUniforms(kind) {
  const on = ikeaV0SoftAoEnabledForKind(kind);
  const vp = softAoViewportForKind(kind);
  return {
    softAoEnabled: { value: on },
    blurredHeightmap: { value: softAoHeightmapForKind(kind) },
    blurredHeightmapViewportM: {
      value: vp?.clone() ?? new THREE.Vector4(-5, -5, 10, 10),
    },
  };
}

/**
 * Spot atlas getShadow — walls/frame + cabinet corpus/back/facade when room phase 7 (IKEA dump).
 * Trim/door: no receive (section trim / swing door).
 */
function spotShadowReceiveForMaterial(mat) {
  if (!mat?.userData?.__cldIkeaV0) return 0;
  if (IKEA_V0_ACTIVE_PHASE < 7) return 0;
  const kind = mat.userData.__cldIkeaV0Kind;
  if (kind === 'trim' || kind === 'door') return 0;
  if (kind === 'wall' || kind === 'frame') return 1;
  if (mat.userData.__cldIkeaV0Cabinet) {
    /** 3 = тень только у кромки фасада (panelShadowRim): полки за фасадом не проступают. */
    if (kind === 'facade') return 3;
    /** 2 = снаружи тень со сдвигом по нормали, внутренние вертикальные грани отсека без тени (см. шейдер). */
    if (kind === 'corpus' || kind === 'back') return 2;
    return 0;
  }
  return 0;
}

function spotShadowSpotFloorForKind(kind) {
  if (IKEA_V0_ACTIVE_PHASE < 7) return 0;
  if (kind === 'corpus' || kind === 'back') return SPOT_SHADOW_SPOT_FLOOR;
  return 0;
}

/** Incomplete / 404 image → texSubImage2D Overload resolution failed → context lost. */
function isTextureGpuUploadReady(map) {
  if (!map) return false;
  const img = map.image;
  if (!img) return false;
  if (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) {
    return img.width > 0 && img.height > 0;
  }
  if (typeof HTMLImageElement !== 'undefined' && img instanceof HTMLImageElement) {
    return img.complete === true && img.naturalWidth > 0 && img.naturalHeight > 0;
  }
  if (typeof HTMLCanvasElement !== 'undefined' && img instanceof HTMLCanvasElement) {
    return img.width > 0 && img.height > 0;
  }
  if (img.width > 0 && img.height > 0) return true;
  return false;
}

/**
 * JPG = RGBFormat; WebGL2 sRGB decode only on RGBA. Custom shader: NoColorSpace + mapSampleLinear.
 * Не ставить needsUpdate каждый sync — битый/404 map → texSubImage2D crash.
 */
export function prepareSrgbMapForCustomShader(map) {
  if (!map) return map;
  const already =
    map.userData.__cldIkeaV0MapManualSrgb === true && map.colorSpace === THREE.NoColorSpace;
  map.colorSpace = THREE.NoColorSpace;
  map.userData.__cldIkeaV0MapManualSrgb = true;
  if (!already && isTextureGpuUploadReady(map)) {
    /** WebGL2: RGB JPG texSubImage2D fails — upload only after floor JPG→RGBA canvas. */
    if (!map.isDataTexture && !map.userData.__cldIkeaV0RgbaCanvas) {
      return map;
    }
    map.needsUpdate = true;
  }
  return map;
}

/** Room.js async floor load — re-apply map after JPG onLoad (иначе SRGB сбрасывается). */
export function resyncIkeaRoomFloorMap(room = state.room, mapOverride = null) {
  const mesh = room?.floorCoating;
  if (!mesh?.isMesh) return { ok: false, reason: 'no floorCoating' };
  const mat = mesh.material;
  if (!mat?.userData?.__cldIkeaV0 || !mat.uniforms?.albedoMap) {
    return { ok: false, reason: 'floor not ikea-bound yet', pendingMap: !!(mapOverride || room?.floorTexture) };
  }
  const tex =
    mapOverride ||
    mat.uniforms.albedoMap.value ||
    room?.floorTexture ||
    null;
  if (!tex) return { ok: false, reason: 'no floor texture ref' };
  if (!tex.isDataTexture) tex.needsUpdate = false;
  if (room && !room.floorTexture) room.floorTexture = tex;
  if (!isTextureGpuUploadReady(tex)) {
    applyMapToIkeaV0Material(mat, tex);
    return { ok: false, ready: false, reason: 'floor map loading', pendingMap: true };
  }
  applyMapToIkeaV0Material(mat, tex);
  syncIblSpecUniformsOnScene();
  const ready = isTextureGpuUploadReady(tex);
  return {
    ok: ready && mat.uniforms.hasAlbedoMap.value > 0.5,
    hasAlbedoMap: mat.uniforms.hasAlbedoMap.value,
    hasMap: mat.uniforms.hasAlbedoMap.value,
    ready,
    url: tex.image?.src?.slice?.(-64) ?? null,
  };
}

function floorMapUniforms(kind) {
  const on = kind === 'floor';
  const tint = SOT.floor.screenTint ?? [1, 1, 1];
  const tintActive =
    on &&
    (Math.abs(tint[0] - 1) > 0.001 ||
      Math.abs(tint[1] - 1) > 0.001 ||
      Math.abs(tint[2] - 1) > 0.001);
  const sat = SOT.floor.albedoSat ?? 1;
  return {
    floorMapWorldUv: { value: on ? 1 : 0 },
    floorMapTileM: { value: FLOOR_MAP_TILE_M },
    floorAlbedoTintEnabled: { value: tintActive ? 1 : 0 },
    floorAlbedoTint: { value: new THREE.Vector3(tint[0], tint[1], tint[2]) },
    floorAlbedoSat: { value: on ? sat : 1 },
  };
}

/** drawImage-safe sources only — skip DataTexture {data,w,h} and incomplete HTMLImage. */
function isDrawableImageSource(img) {
  if (!img) return false;
  if (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) {
    return img.width > 0 && img.height > 0;
  }
  if (typeof HTMLCanvasElement !== 'undefined' && img instanceof HTMLCanvasElement) {
    return img.width > 0 && img.height > 0;
  }
  if (typeof HTMLImageElement !== 'undefined' && img instanceof HTMLImageElement) {
    return img.complete === true && img.naturalWidth > 0 && img.naturalHeight > 0;
  }
  return false;
}

/** WebGL2 custom shader: JPG/RGB → RGBA canvas before texSubImage2D. */
function promoteMapImageToRgbaCanvas(map) {
  if (!map?.image || map.userData.__cldIkeaV0RgbaCanvas) return map;
  if (map.isDataTexture) return map;
  const img = map.image;
  if (!isDrawableImageSource(img)) return map;
  if (typeof HTMLCanvasElement !== 'undefined' && img instanceof HTMLCanvasElement) {
    map.format = THREE.RGBAFormat;
    map.userData.__cldIkeaV0RgbaCanvas = true;
    return map;
  }
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return map;
  try {
    ctx.drawImage(img, 0, 0);
  } catch (_) {
    return map;
  }
  map.image = canvas;
  map.format = THREE.RGBAFormat;
  map.userData.__cldIkeaV0RgbaCanvas = true;
  return map;
}

function mapGpuUploadReady(map) {
  if (!map || !isTextureGpuUploadReady(map)) return false;
  if (map.isDataTexture) return true;
  return map.userData.__cldIkeaV0RgbaCanvas === true;
}

/** @deprecated alias */
function isFloorMapDrawableSource(img) {
  return isDrawableImageSource(img);
}

/** @deprecated alias */
function ensureFloorMapRgbaImage(map) {
  return promoteMapImageToRgbaCanvas(map);
}

/** @deprecated alias */
function floorMapGpuUploadReady(map) {
  return mapGpuUploadReady(map);
}

function prepareAlbedoMapForGpuUpload(map) {
  if (!map) return false;
  if (map.isDataTexture) {
    prepareSrgbMapForCustomShader(map);
    map.needsUpdate = true;
    return true;
  }
  map.needsUpdate = false;
  if (!isTextureGpuUploadReady(map)) return false;
  promoteMapImageToRgbaCanvas(map);
  if (!mapGpuUploadReady(map)) return false;
  prepareSrgbMapForCustomShader(map);
  map.needsUpdate = true;
  return true;
}

function configureFloorMapTexture(map) {
  if (!map) return map;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  /** World XZ / tileM in shader — Room.js repeat must not scale UV again. */
  map.repeat.set(1, 1);
  map.offset.set(0, 0);
  map.flipY = false;
  if (!prepareAlbedoMapForGpuUpload(map)) return map;
  const maxAniso = state.renderer?.capabilities?.getMaxAnisotropy?.() ?? 16;
  map.anisotropy = Math.min(16, maxAniso);
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.generateMipmaps = true;
  uploadFloorMapToGpu(map);
  return map;
}

function wallPlasterUniforms(kind) {
  const on = kind === 'wall' || kind === 'frame';
  return {
    wallPlasterEnabled: { value: on ? 1 : 0 },
    wallPlasterTileM: { value: WALL_PLASTER_TILE_M },
    wallNormalMap: { value: loadWallNormalTexture() },
    wallNormalMapEnabled: { value: on && _wallNormalTexReady ? 1 : 0 },
    wallNormalScale: { value: SOT.wall.normalScale },
  };
}

function wallConeUniforms(_kind) {
  return {
    wallConeEnabled: { value: 0 },
    wallConeCount: { value: 0 },
    wallConeMin: { value: [0, 1, 2, 3].map(() => new THREE.Vector3()) },
    wallConeMax: { value: [0, 1, 2, 3].map(() => new THREE.Vector3()) },
    wallConeIblMix: { value: 0 },
  };
}

function syncWallConeUniformsOnScene() {
  /* frozen — IKEA dump: wall stripe = soft heightmap AO on IBL only, no wallCabinetCone */
}

function applyWallConeUniformsToMaterial(mat) {
  if (!mat?.uniforms) return;
  const u = mat.uniforms;
  if (u.wallConeEnabled) u.wallConeEnabled.value = 0;
  if (u.wallConeCount) u.wallConeCount.value = 0;
  if (u.wallConeIblMix) u.wallConeIblMix.value = 0;
}

function softPlaneUniforms(kind) {
  return {
    softPlaneEnabled: { value: softPlaneEnabledForKind(kind) },
    softPlaneMap: { value: _softState?.alphaTexture ?? null },
    softPlaneViewportM: {
      value: _softViewportM?.clone() ?? new THREE.Vector4(-5, -5, 10, 10),
    },
    softPlaneFootprintM: {
      value: _softFootprintM?.clone() ?? new THREE.Vector4(0, 0, 0, 0),
    },
    softPlaneContactStrength: { value: SOFT_PLANE_CONTACT_STRENGTH },
  };
}

function spotShadowUniforms(opts = {}) {
  return {
    /** Off until atlas rendered AND cabinet casters exist (empty room = phase 6 spot). */
    spotShadowEnabled: { value: 0 },
    /** World 1 walls/frame + world 2 corpus/back — IKEA getShadow; trim/facade off. */
    spotShadowReceive: { value: spotShadowReceiveForMaterial({ userData: { __cldIkeaV0: true, __cldIkeaV0Cabinet: !!opts.cabinet, __cldIkeaV0Kind: opts.kind } }) },
    spotShadowViewProj: { value: new THREE.Matrix4() },
    /** Live PAX: single Spot tile fills map (1024); bias.w = ndc_bias dump 0. */
    spotShadowAtlasViewportBias: { value: new THREE.Vector4(0, 0, 1, 0) },
    spotShadowMap: { value: spotShadowMapUniformValue() },
    spotShadowInvSize: {
      value: new THREE.Vector2(1 / SPOT_SHADOW_MAP_SIZE, 1 / SPOT_SHADOW_MAP_SIZE),
    },
    spotShadowPcfScale: { value: SPOT_SHADOW_PCF_SCALE },
    shadowSamplingJitter: { value: new THREE.Vector2(0, 0) },
    spotShadowSpotFloor: {
      value: spotShadowSpotFloorForKind(opts.kind),
    },
  };
}

function mergeLedConfig(base, opts) {
  const out = { ...base, color: [...base.color] };
  if (!opts || typeof opts !== 'object') return out;
  if (opts.enabled != null) out.enabled = !!opts.enabled;
  if (LED_MODES.includes(opts.mode)) out.mode = opts.mode;
  if (Number.isFinite(+opts.beamDeg)) out.beamDeg = Math.min(170, Math.max(20, +opts.beamDeg));
  if (Number.isFinite(+opts.insetMm)) out.insetMm = Math.max(0, +opts.insetMm);
  if (Number.isFinite(+opts.widthMm)) out.widthMm = Math.max(2, +opts.widthMm);
  if (opts.sides === 'both' || opts.sides === 'left' || opts.sides === 'right') out.sides = opts.sides;
  if (Number.isFinite(+opts.intensity)) out.intensity = Math.max(0, +opts.intensity);
  if (Number.isFinite(+opts.emission)) out.emission = Math.max(0, +opts.emission);
  if (Array.isArray(opts.color) && opts.color.length === 3) out.color = opts.color.map(Number);
  return out;
}

function resolveLedConfig(root) {
  return mergeLedConfig(_ledTune, root?.userData?.ledConfig);
}

function applyLedUniforms(u, cfg) {
  if (!u?.ledEnabled) return;
  u.ledEnabled.value = cfg.enabled ? 1 : 0;
  u.ledIntensity.value = cfg.intensity;
  u.ledEmission.value = cfg.emission;
  u.ledColor.value.setRGB(...cfg.color);
  if (u.ledInsetMm) u.ledInsetMm.value = cfg.insetMm;
  if (u.ledHalfWidthMm) u.ledHalfWidthMm.value = cfg.widthMm * 0.5;
  if (u.ledSides) u.ledSides.value.set(cfg.sides !== 'right' ? 1 : 0, cfg.sides !== 'left' ? 1 : 0);
  if (u.ledMode) u.ledMode.value = Math.max(0, LED_MODES.indexOf(cfg.mode));
  if (u.ledBeamM) u.ledBeamM.value = ledBeamExponent(cfg.beamDeg);
}

const _ledUnderLocal = new THREE.Vector3();
const _ledUnderUp = new THREE.Vector3();
const _ledUnderLocalToWorld = new THREE.Matrix4();

/** Отрезок профиля под дном шкафа в мире: по ширине, на insetMm от фронта, чуть ниже дна. */
function ledUnderSegmentForCavity(cavity, cfg) {
  _ledUnderLocalToWorld.copy(cavity.worldToLocal).invert();
  _ledUnderUp.set(0, 1, 0).transformDirection(cavity.worldToLocal);
  const up = [Math.abs(_ledUnderUp.x), Math.abs(_ledUnderUp.y), Math.abs(_ledUnderUp.z)];
  const upAxis = up.indexOf(Math.max(...up));
  const upSign = [_ledUnderUp.x, _ledUnderUp.y, _ledUnderUp.z][upAxis] >= 0 ? 1 : -1;
  const fa = cavity.axis;
  if (upAxis === fa) return null;
  const wa = 3 - fa - upAxis;
  const key = ['x', 'y', 'z'];
  const front = cavity.sign > 0 ? cavity.max[key[fa]] : cavity.min[key[fa]];
  const depth = cavity.max[key[fa]] - cavity.min[key[fa]];
  const inset = Math.min(Math.max(cfg.insetMm, cfg.widthMm * 0.5 + 2), Math.max(depth - cfg.widthMm * 0.5 - 2, 2));
  const bottom = upSign > 0 ? cavity.min[key[upAxis]] - 0.5 : cavity.max[key[upAxis]] + 0.5;
  const ends = [cavity.min[key[wa]] + CAVITY_INSIDE_MARGIN_MM, cavity.max[key[wa]] - CAVITY_INSIDE_MARGIN_MM];
  return ends.map((w) => {
    _ledUnderLocal.set(0, 0, 0);
    _ledUnderLocal.setComponent(fa, front - cavity.sign * inset);
    _ledUnderLocal.setComponent(upAxis, bottom);
    _ledUnderLocal.setComponent(wa, w);
    return _ledUnderLocal.clone().applyMatrix4(_ledUnderLocalToWorld);
  });
}

function writeLedUnderUniforms(list) {
  const u = _ledUnderU;
  const n = Math.min(list.length, LED_UNDER_MAX);
  u.ledUnderCount.value = n;
  for (let i = 0; i < n; i++) {
    const { a, b, cfg } = list[i];
    u.ledUnderA.value[i].copy(a);
    u.ledUnderB.value[i].copy(b);
    u.ledUnderColor.value[i].set(...cfg.color).multiplyScalar(cfg.intensity);
    u.ledUnderEmission.value[i].set(...cfg.color).multiplyScalar(cfg.emission);
    u.ledUnderHalfW.value[i] = cfg.widthMm * 0.5;
    u.ledUnderBeamM.value[i] = ledBeamExponent(cfg.beamDeg);
  }
}

/**
 * Консоль / админка:
 *   __cldIkeaV0SetLed({ insetMm: 80 })            — всем шкафам (значения по умолчанию);
 *   __cldIkeaV0SetLed({ sides: 'left' }, root)    — одному шкафу (пишет root.userData.ledConfig);
 *   __cldIkeaV0SetLed(null, root)                 — сбросить шкаф к общим настройкам.
 */
export function setIkeaV0Led(opts = {}, root = null) {
  if (root) {
    root.userData = root.userData || {};
    if (opts === null) delete root.userData.ledConfig;
    else root.userData.ledConfig = { ...(root.userData.ledConfig || {}), ...opts };
  } else if (opts) {
    Object.assign(_ledTune, mergeLedConfig(_ledTune, opts));
  }
  syncCabinetCavityOcclusionOnScene(true);
  resetIkeaHdrAccumulation('led');
  return root ? resolveLedConfig(root) : { ..._ledTune, color: [..._ledTune.color] };
}

export function getIkeaV0Led(root = null) {
  return root ? resolveLedConfig(root) : { ..._ledTune, color: [..._ledTune.color] };
}

export function getIkeaV0LedDefaults() {
  return { ...LED_DEFAULTS, color: [...LED_DEFAULTS.color] };
}

/** Off до первого пересчёта полости — пустая комната и стены живут без occlusion. */
function cavityOcclusionUniforms() {
  return {
    cavityOccEnabled: { value: 0 },
    cavityOccStrength: { value: CAVITY_OCC_STRENGTH },
    cavityWorldToLocal: { value: new THREE.Matrix4() },
    cavityBoxMin: { value: new THREE.Vector3() },
    cavityBoxMax: { value: new THREE.Vector3() },
    cavityFrontAxis: { value: 2 },
    cavityFrontSign: { value: 1 },
    cavityInterreflectMax: { value: CAVITY_INTERREFLECT_MAX },
    cabinetGain: { value: _cavityTune.gain },
    cavityInteriorLevel: { value: _cavityTune.level },
    cavityInteriorLevelUp: { value: _cavityTune.levelUp },
    cavityCreaseMin: { value: _cavityTune.creaseMin },
    cavityCreaseWidthMm: { value: _cavityTune.creaseWidthMm },
    panelEdgeAoEnabled: { value: 0 },
    panelBoxMin: { value: new THREE.Vector3() },
    panelBoxMax: { value: new THREE.Vector3() },
    panelEdgeWidthObj: { value: new THREE.Vector3() },
    panelEdgeAoMin: { value: _cavityTune.edgeMin },
    panelShadowRimEnabled: { value: 0 },
    panelShadowRimObj: { value: new THREE.Vector3() },
    cavityBlockA: { value: new Array(CAVITY_BLOCK_MAX).fill(0) },
    cavityBlockB: { value: new Array(CAVITY_BLOCK_MAX).fill(0) },
    cavityBlockACount: { value: 0 },
    cavityBlockBCount: { value: 0 },
    ledEnabled: { value: _ledTune.enabled ? 1 : 0 },
    ledIntensity: { value: _ledTune.intensity },
    ledEmission: { value: _ledTune.emission },
    ledColor: { value: new THREE.Color(..._ledTune.color) },
    ledInsetMm: { value: _ledTune.insetMm },
    ledHalfWidthMm: { value: _ledTune.widthMm * 0.5 },
    ledSides: {
      value: new THREE.Vector2(_ledTune.sides !== 'right' ? 1 : 0, _ledTune.sides !== 'left' ? 1 : 0),
    },
    ledMode: { value: Math.max(0, LED_MODES.indexOf(_ledTune.mode)) },
    ledBeamM: { value: ledBeamExponent(_ledTune.beamDeg) },
    ..._ledUnderU,
  };
}

function panelOrientationForMesh(mesh) {
  const ud = mesh?.userData || {};
  if (ud.__cldPanelOrientation) return ud.__cldPanelOrientation;
  let p = mesh?.parent;
  for (let i = 0; i < 6 && p; i++) {
    const po = p.userData?.__cldPanelOrientation;
    if (po) return po;
    p = p.parent;
  }
  return '';
}

/** Horizontal shelf board — IKEA tnparnmc6q57 (1 mesh per SceneAssetInstance). */
function meshSpotShadowIsShelfLike(mesh) {
  if (!mesh?.isMesh) return false;
  const ud = mesh.userData || {};
  if (ud.isFlatCatalogShelf) return true;
  /** layoutRole often on Module_/section group, not on Geom3D/Mesh1 leaf. */
  let p = mesh;
  for (let i = 0; i < 24 && p; i++) {
    const pud = p.userData || {};
    if (pud.isFlatCatalogShelf) return true;
    const lr = String(pud.layoutRole || '').toLowerCase();
    if (lr === 'shelf' || lr === 'zone_divider') return true;
    p = p.parent;
  }
  const nm = String(ud.detailName || mesh.name || '').toLowerCase();
  if (/полкодерж|shelf.?pin|планк|кромк|edge/.test(nm)) return false;
  if (/полк|shelf/.test(nm)) return true;
  return false;
}

/** Drawer / drawer_internal module boards — also cast onto back (IKEA dump). */
function meshSpotShadowIsDrawerLike(mesh) {
  if (!mesh?.isMesh) return false;
  let p = mesh;
  for (let i = 0; i < 24 && p; i++) {
    const lr = String(p.userData?.layoutRole || '').toLowerCase();
    if (lr === 'drawer' || lr === 'drawer_internal') return true;
    p = p.parent;
  }
  const nm = String(mesh.userData?.detailName || mesh.name || '').toLowerCase();
  return /ящик|drawer/.test(nm);
}

/**
 * IKEA shelf SceneAssetInstance = catalog GLB board (not parametric BoxGeometry).
 * Parametric Полка blocked in meshSpotShadowParametricHorizontalBlocked (p8z136).
 */
function meshSpotShadowHorizontalShelfCaster(mesh) {
  if (!mesh?.isMesh) return false;
  const ud = mesh.userData || {};
  if (ud.isEdge === true && !ud.isUncutEdge && !ud.cldSectionTrimUncut) return false;
  if (ud.isVisualOnly || ud.previewOnly) return false;
  if (panelOrientationForMesh(mesh) !== 'h' || ud.isDetail !== true) return false;
  if (ud.isBody === true) return false;
  return meshUnderCatalogModel(mesh) || !!ud.isFlatCatalogShelf;
}

/** @deprecated alias */
function meshSpotShadowHorizontalShelfBoard(mesh) {
  return meshSpotShadowHorizontalShelfCaster(mesh);
}

/** Thin in Y vs XZ — parametric lid/shelf/deck when __cldPanelOrientation missing. */
function meshIsHorizontallyDominant(mesh) {
  if (!mesh?.isMesh) return false;
  _spotShadowCastBbox.setFromObject(mesh);
  if (_spotShadowCastBbox.isEmpty()) return false;
  const s = _spotShadowCastBbox.getSize(_spotShadowCastWp);
  const minXZ = Math.min(s.x, s.z);
  return s.y > 1 && minXZ > 1 && s.y < minXZ * 0.35;
}

/**
 * Parametric top/bottom/deck — filled XZ occluder; IKEA GLB uses thin 010 primitives, not one lid mesh.
 * p8z127b: exclude from frame atlas; shelves are NOT lids (see meshSpotShadowIsShelfLike).
 */
function meshSpotShadowIsFrameHorizontalOccluder(mesh) {
  if (!mesh?.isMesh) return false;
  if (meshSpotShadowIsShelfLike(mesh)) return false;
  if (meshSpotShadowHorizontalShelfCaster(mesh)) return false;
  if (mesh.userData?.isBody !== true) return false;
  if (panelOrientationForMesh(mesh) === 'h') return true;
  return meshIsHorizontallyDominant(mesh);
}

/**
 * Block thick frame lids from spot atlas. Shelves CAST like IKEA tnparn (dump).
 * Lids/decks stay out — filled XZ ≠ thin GLB primitives.
 */
function meshSpotShadowParametricHorizontalBlocked(mesh) {
  if (!mesh?.isMesh) return false;
  if (meshSpotShadowIsShelfLike(mesh)) return false;
  const lr = String(
    mesh.userData?.layoutRole || mesh.parent?.userData?.layoutRole || ''
  ).toLowerCase();
  if (SPOT_SHADOW_MODULE_CAST_ROLES.has(lr)) return false;
  if (meshSpotShadowIsFrameHorizontalOccluder(mesh)) return true;
  if (!meshIsParametricCore(mesh)) return false;
  const nm = String(mesh.name || '').toLowerCase();
  if (/крыш|deck|lid|крышка|топ/.test(nm) && meshIsHorizontallyDominant(mesh)) return true;
  return false;
}

function findAncestorSpotShadowCastModule(mesh) {
  let p = mesh?.parent;
  for (let i = 0; i < 48 && p; i++) {
    const ud = p.userData || {};
    const lr = String(ud.layoutRole || '').toLowerCase();
    if (SPOT_SHADOW_MODULE_CAST_ROLES.has(lr)) return p;
    if (ud.isFlatCatalogShelf) return p;
    p = p.parent;
  }
  return null;
}

function findAncestorIsFurniture(mesh) {
  let p = mesh?.parent;
  for (let i = 0; i < 48 && p; i++) {
    if (p.userData?.isFurniture) return p;
    p = p.parent;
  }
  return null;
}

function meshSpotShadowHardwareOnFurnitureFrame(_mesh) {
  /** r3j70: hardware never Spot-casts — depth pass hid hinge Mesh1 leaves. */
  return false;
}

/** Hinge/handle GLB — leaf names are Mesh1/Geom3D, not "hinge". */
function meshIsHingeOrHardwareRoot(mesh) {
  let p = mesh;
  for (let i = 0; i < 48 && p; i++) {
    const ud = p.userData || {};
    if (
      ud.isHingeCabinetModelMetal ||
      ud.cldHingeCatalogModel ||
      ud.isCatalogHingeModule ||
      ud.hingePart === 'corpus' ||
      ud.hingePart === 'facade' ||
      ud.isHandle === true ||
      ud.isHinge === true
    ) {
      return true;
    }
    const nm = String(p.name || '');
    if (/^furni_hinge_/i.test(nm)) return true;
    if (/петл|hinge/i.test(nm) && (ud.isCabinetModel || ud.isAccessory)) return true;
    if (ud.isFurniture === true) break;
    p = p.parent;
  }
  return false;
}

function meshIsParametricCore(mesh) {
  return String(mesh?.name || '').includes('_core');
}

function meshUnderCatalogModel(mesh) {
  let p = mesh?.parent;
  for (let i = 0; i < 32 && p; i++) {
    if (p.userData?.isCabinetModel) return true;
    p = p.parent;
  }
  return false;
}

const _spotShadowCastWp = new THREE.Vector3();
const _spotShadowCastBbox = new THREE.Box3();
const _kitchenShadowBox = new THREE.Box3();
const _kitchenShadowSphere = new THREE.Sphere();
const _kitchenShadowRay = new THREE.Vector3();

function kitchenDirRayTravel() {
  return _kitchenShadowRay.set(-KITCHEN_DIR_WI.x, -KITCHEN_DIR_WI.y, -KITCHEN_DIR_WI.z);
}

/** IKEA static sun ortho from bounding sphere, CLODIS mm / Y-up. Matrix from dump is not copied. */
function configureKitchenDirShadowCamera(cam, castMeshes) {
  _kitchenShadowBox.makeEmpty();
  if (state.room?.group) _kitchenShadowBox.expandByObject(state.room.group);
  if (Array.isArray(castMeshes)) {
    for (let i = 0; i < castMeshes.length; i++) {
      const m = castMeshes[i];
      if (m) _kitchenShadowBox.expandByObject(m);
    }
  }
  if (_kitchenShadowBox.isEmpty() && state.room) {
    const w = state.room.width || 5000;
    const d = state.room.depth || 4000;
    const h = state.room.height || 2600;
    _kitchenShadowBox.set(new THREE.Vector3(0, 0, 0), new THREE.Vector3(w, h, d));
    if (state.room.group) _kitchenShadowBox.applyMatrix4(state.room.group.matrixWorld);
  }
  _kitchenShadowBox.getBoundingSphere(_kitchenShadowSphere);
  const radius = Math.max(10, _kitchenShadowSphere.radius);
  const r = 1.01 * radius;
  const near = KITCHEN_DIR_SHADOW_NEAR_MM;
  const far = 2 * r + near;
  cam.left = -r;
  cam.right = r;
  cam.top = r;
  cam.bottom = -r;
  cam.near = near;
  cam.far = far;
  const D = kitchenDirRayTravel();
  cam.up.set(0, 1, 0);
  cam.position.copy(_kitchenShadowSphere.center).addScaledVector(D, -(radius + near));
  cam.lookAt(_kitchenShadowSphere.center);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
}

function meshBBoxVolumeMm3(mesh) {
  if (!mesh?.isMesh) return 0;
  _spotShadowCastBbox.setFromObject(mesh);
  if (_spotShadowCastBbox.isEmpty()) return 0;
  const s = _spotShadowCastBbox.getSize(_spotShadowCastWp);
  return s.x * s.y * s.z;
}

/** IKEA shelf/accessory instance = 1 mesh in depth pass. */
function pickRepresentativeCastMeshes(meshes) {
  if (!meshes?.length) return [];
  if (meshes.length === 1) return meshes;
  const cores = meshes.filter((m) => meshIsParametricCore(m));
  if (cores.length === 1) return cores;
  if (cores.length > 1) {
    cores.sort((a, b) => meshBBoxVolumeMm3(b) - meshBBoxVolumeMm3(a));
    return [cores[0]];
  }
  let best = meshes[0];
  let bestV = meshBBoxVolumeMm3(best);
  for (let i = 1; i < meshes.length; i++) {
    const v = meshBBoxVolumeMm3(meshes[i]);
    if (v > bestV) {
      best = meshes[i];
      bestV = v;
    }
  }
  return [best];
}

/** Dedupe parametric splits — one cast mesh per world position + kind. */
function dedupeFrameCastMeshes(meshes) {
  const seen = new Set();
  const out = [];
  for (const m of meshes) {
    m.getWorldPosition(_spotShadowCastWp);
    const kind = m.material?.userData?.__cldIkeaV0Kind || '';
    const orient = panelOrientationForMesh(m) || '';
    const lr = String(m.userData?.layoutRole || m.parent?.userData?.layoutRole || '');
    const key = [
      kind,
      orient,
      lr,
      Math.round(_spotShadowCastWp.x),
      Math.round(_spotShadowCastWp.y),
      Math.round(_spotShadowCastWp.z),
    ].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}

function spotShadowCastInstanceIsDedicatedModule(inst) {
  if (!inst) return false;
  const ud = inst.userData || {};
  if (ud.isFurniture) return false;
  if (ud.isCabinetModel) return true;
  if (ud.isFlatCatalogShelf) return true;
  const lr = String(ud.layoutRole || '').toLowerCase();
  return SPOT_SHADOW_MODULE_CAST_ROLES.has(lr);
}

/**
 * IKEA shadow_casters = SceneAssetInstance (catalog GLB root), not flat mesh list.
 * p8z127b: shelf → Module_; frame hardware → isFurniture bucket; accessory GLB stays own instance.
 */
function resolveSpotShadowCastInstance(mesh) {
  if (!mesh?.isMesh) return null;

  if (meshSpotShadowHorizontalShelfBoard(mesh)) {
    return findAncestorSpotShadowCastModule(mesh) || mesh;
  }

  let cabinetModel = null;
  let flatShelf = null;
  let castModule = null;
  let furniture = null;
  let p = mesh.parent;
  for (let i = 0; i < 48 && p; i++) {
    const ud = p.userData || {};
    if (!castModule) {
      const lr = String(ud.layoutRole || '').toLowerCase();
      /** r3j67: any shelf/drawer group — not only name Module_* (Geom3D leaves). */
      if (SPOT_SHADOW_MODULE_CAST_ROLES.has(lr) || ud.isFlatCatalogShelf) {
        castModule = p;
      }
    }
    if (!flatShelf && ud.isFlatCatalogShelf) flatShelf = p;
    if (!cabinetModel && ud.isCabinetModel) cabinetModel = p;
    if (!furniture && ud.isFurniture) furniture = p;
    p = p.parent;
  }

  if (castModule) return castModule;
  if (flatShelf) return flatShelf;
  if (meshSpotShadowHardwareOnFurnitureFrame(mesh) && furniture) return furniture;
  if (cabinetModel) return cabinetModel;
  if (furniture) return furniture;
  return null;
}

/**
 * Frame shell — IKEA 90458221 dump: vertical 010/003 + hardware on frame instance;
 * parametric horizontal isBody lid/deck out (filled XZ); shelves = Module_ instances.
 * r3j66: shelf-like boards on furniture root also cast (IKEA separate instances; we may nest under isFurniture).
 */
function meshSpotShadowCastEnabledForFrameShell(mesh) {
  if (meshSpotShadowParametricHorizontalBlocked(mesh)) return false;
  if (mesh.userData?.isEdge === true && !mesh.userData?.isUncutEdge) return false;
  const kind = mesh.material?.userData?.__cldIkeaV0Kind;
  if (
    (meshSpotShadowIsShelfLike(mesh) || meshSpotShadowIsDrawerLike(mesh)) &&
    meshSpotShadowShelfBoardCastable(mesh)
  ) {
    return kind === 'corpus' || kind === 'back' || kind === 'plastic' || kind === 'facade';
  }
  const frameKind =
    kind === 'corpus' ||
    kind === 'back';
  if (!frameKind) return false;
  const ud = mesh.userData || {};
  if (ud.spotShadowCaster === false || ud.isVisualOnly) return false;
  const nm = String(mesh.name || '');
  if (/ModelPlaceholder|hinge|петл|Hinge|накладн|ручк|handle/i.test(nm)) return false;
  if (meshIsHingeOrHardwareRoot(mesh)) return false;
  if (meshUnderCatalogModel(mesh)) return true;
  return meshIsParametricCore(mesh);
}

/** Shelf board that should appear in Spot atlas (IKEA model87–91 style). */
function meshSpotShadowShelfBoardCastable(mesh) {
  if (!mesh?.isMesh) return false;
  const ud = mesh.userData || {};
  if (ud.spotShadowCaster === false || ud.isVisualOnly || ud.previewOnly) return false;
  if (ud.isEdge === true && !ud.isUncutEdge && !ud.cldSectionTrimUncut) return false;
  if (meshSpotShadowHorizontalShelfBoard(mesh)) return true;
  if (meshIsParametricCore(mesh) && (panelOrientationForMesh(mesh) === 'h' || meshIsHorizontallyDominant(mesh))) {
    return true;
  }
  /** Geom3D/Mesh1 under layoutRole shelf — often isBody board without _core / orientation. */
  if (
    (meshSpotShadowIsShelfLike(mesh) || meshSpotShadowIsDrawerLike(mesh)) &&
    (ud.isBody === true ||
      ud.isDetail === true ||
      panelOrientationForMesh(mesh) === 'h' ||
      meshIsHorizontallyDominant(mesh))
  ) {
    return true;
  }
  if (panelOrientationForMesh(mesh) === 'h' || meshIsHorizontallyDominant(mesh)) return true;
  return false;
}

function meshSpotShadowCastEnabled(mesh, kind) {
  if (!SPOT_SHADOW_CAST_KINDS.has(kind)) return false;
  if (mesh.userData?.spotShadowCaster === false) return false;
  if (meshIsHingeOrHardwareRoot(mesh)) return false;
  if (meshSpotShadowParametricHorizontalBlocked(mesh)) return false;
  const inst = resolveSpotShadowCastInstance(mesh);
  if (!inst) return false;
  if (meshIsHingeOrHardwareRoot(inst)) return false;
  if (inst.isMesh && meshSpotShadowHorizontalShelfBoard(inst)) return true;
  if (inst.userData?.isFurniture && !spotShadowCastInstanceIsDedicatedModule(inst)) {
    return meshSpotShadowCastEnabledForFrameShell(mesh);
  }
  /** Module_ shelf/drawer: IKEA = 1 board — catalog GLB or Geom3D/Mesh1 under layoutRole. */
  if (spotShadowCastInstanceIsDedicatedModule(inst)) {
    if (meshIsHingeOrHardwareRoot(mesh) || meshIsHingeOrHardwareRoot(inst)) return false;
    if (meshSpotShadowIsShelfLike(mesh) || meshSpotShadowIsDrawerLike(mesh)) {
      return meshSpotShadowShelfBoardCastable(mesh);
    }
    const lr = String(inst.userData?.layoutRole || '').toLowerCase();
    if (inst.userData?.isFlatCatalogShelf || SPOT_SHADOW_MODULE_CAST_ROLES.has(lr)) {
      return meshSpotShadowShelfBoardCastable(mesh);
    }
    /** Other isCabinetModel accessories (hinges/handles) — do not depth-toggle. */
    return false;
  }
  return true;
}

function spotShadowCastBucketUsesModulePick(root, meshes) {
  if (spotShadowCastInstanceIsDedicatedModule(root)) return true;
  if (root?.userData?.isFurniture) return false;
  if (meshSpotShadowHorizontalShelfBoard(root)) return true;
  return meshes.some((m) => meshSpotShadowHorizontalShelfBoard(m));
}

/** Instance buckets for depth pass — dump SceneAssetInstance, not per-mesh flat list. */
function collectSpotShadowCastBuckets(scene) {
  const buckets = new Map();
  if (!scene) return buckets;
  scene.traverse((o) => {
    if (!o.isMesh || !o.material?.userData?.__cldIkeaV0Cabinet) return;
    const kind = o.material.userData.__cldIkeaV0Kind;
    if (!meshSpotShadowCastEnabled(o, kind)) return;
    const inst = resolveSpotShadowCastInstance(o);
    if (!inst) return;
    o.userData.__cldSpotShadowCastInstanceUuid = inst.uuid;
    const key = inst.uuid;
    if (!buckets.has(key)) buckets.set(key, { root: inst, meshes: [] });
    buckets.get(key).meshes.push(o);
  });
  buckets.forEach((b) => {
    if (spotShadowCastBucketUsesModulePick(b.root, b.meshes)) {
      b.meshes = pickRepresentativeCastMeshes(b.meshes);
    } else {
      b.meshes = b.meshes.filter((m) =>
        meshSpotShadowCastEnabledForFrameShell(m)
      );
      b.meshes = dedupeFrameCastMeshes(b.meshes);
    }
  });
  buckets.forEach((b) => {
    b.meshes = b.meshes.filter((m) => {
      const kind = m.material?.userData?.__cldIkeaV0Kind;
      return meshSpotShadowCastEnabled(m, kind);
    });
  });
  for (const [key, b] of [...buckets.entries()]) {
    if (!b.meshes.length) buckets.delete(key);
  }
  return buckets;
}

function countSpotShadowCasters(scene) {
  let n = 0;
  collectSpotShadowCastBuckets(scene).forEach((b) => {
    n += b.meshes.length;
  });
  return n;
}

function countSpotShadowCastInstances(scene) {
  const buckets = collectSpotShadowCastBuckets(scene);
  return { instanceCount: buckets.size, instances: [...buckets.keys()] };
}

function initSpotShadowPipeline(renderer) {
  if (_spotShadowState?.ready && _spotShadowState.version === SPOT_SHADOW_PIPELINE_VER) {
    return _spotShadowState;
  }
  _spotShadowState?.rt?.dispose?.();
  if (_spotShadowState?.mapTexture && _spotShadowState.mapTexture !== _fallbackSpotShadowDepth) {
    _spotShadowState.mapTexture.dispose?.();
  }
  _spotShadowState?.depthMaterial?.dispose?.();
  const depthTexture = new THREE.DepthTexture(
    SPOT_SHADOW_MAP_SIZE,
    SPOT_SHADOW_MAP_SIZE,
    THREE.UnsignedIntType
  );
  depthTexture.compareFunction = THREE.LessEqualCompare;
  /** LINEAR + compare = hardware PCF per tap (dump Babylon usePercentageCloserFiltering). */
  depthTexture.minFilter = THREE.LinearFilter;
  depthTexture.magFilter = THREE.LinearFilter;
  const rt = new THREE.WebGLRenderTarget(SPOT_SHADOW_MAP_SIZE, SPOT_SHADOW_MAP_SIZE, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: true,
    stencilBuffer: false,
  });
  rt.depthTexture = depthTexture;
  /** Shadow pass uses scene mm units; near/far from dump 0.5/6 m. */
  const camera = new THREE.PerspectiveCamera(
    SPOT_SHADOW_FOV_DEG,
    1,
    m2mm(SOT.spot.shadowNear_m),
    m2mm(SOT.spot.shadowFar_m)
  );
  camera.layers.set(SPOT_SHADOW_LAYER);
  const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 100, 8000);
  orthoCamera.layers.set(SPOT_SHADOW_LAYER);
  /**
   * Dump bias factor=3 units=8000 (metre). mm scene: units÷1000; FrontSide — no back-face double depth.
   */
  /**
   * Dump bias factor=3 units=8000 (metre). mm scene: units÷1000; FrontSide — no back-face double depth.
   * REVERTED p8z75: normal cull in depth pass broke atlas (objectNormal) → getShadow=1 everywhere.
   */
  const depthMaterial = new THREE.MeshDepthMaterial({
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: SOT.spot.shadowBiasFactor,
    polygonOffsetUnits: SOT_MM.shadowBiasUnitsMm,
  });
  _spotShadowState = {
    ready: true,
    rt,
    mapTexture: depthTexture,
    camera,
    orthoCamera,
    viewProj: new THREE.Matrix4(),
    depthMaterial,
    mapRendered: false,
    casterCount: 0,
    lastBakeMs: 0,
    version: SPOT_SHADOW_PIPELINE_VER,
  };
  if (renderer) {
    const prevTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(rt);
    renderer.clear(false, true, false);
    renderer.setRenderTarget(prevTarget);
  }
  rebindSpotShadowMapOnScene();
  return _spotShadowState;
}

function applySpotShadowCasterLayers(mesh, kind) {
  mesh.layers.enable(0);
  if (meshSpotShadowCastEnabled(mesh, kind) && IKEA_V0_ACTIVE_PHASE >= 7) {
    mesh.layers.enable(SPOT_SHADOW_LAYER);
  } else {
    mesh.layers.disable(SPOT_SHADOW_LAYER);
  }
}

function spotShadowCasterSignatureFromBuckets(buckets, spotPos, mode = 'pax-spot') {
  const parts = [
    mode,
    Math.round(spotPos.x),
    Math.round(spotPos.y),
    Math.round(spotPos.z),
  ];
  const keys = [...buckets.keys()].sort();
  for (const key of keys) {
    const b = buckets.get(key);
    parts.push(key, b.meshes.length);
    for (const m of b.meshes) {
      m.getWorldPosition(_spotShadowCastWp);
      parts.push(
        Math.round(_spotShadowCastWp.x),
        Math.round(_spotShadowCastWp.y),
        Math.round(_spotShadowCastWp.z)
      );
    }
  }
  return parts.join('|');
}

function updateSpotShadowMap(force = false) {
  if (IKEA_V0_ACTIVE_PHASE < 7) return;
  const renderer = state.renderer;
  const scene = state.scene;
  if (!renderer || !scene || !_spotPosWorldMm) return;
  /** View orbit does not move Spot — keep last atlas (avoids collect+depth mid-drag). */
  if (
    !force &&
    (state.isRotating || state.isPanning) &&
    _spotShadowState?.mapRendered
  ) {
    return;
  }
  const ss = initSpotShadowPipeline(renderer);
  scene.updateMatrixWorld(true);
  const buckets = collectSpotShadowCastBuckets(scene);
  const allCastMeshes = [];
  buckets.forEach((b) => {
    allCastMeshes.push(...b.meshes);
  });
  const sig = spotShadowCasterSignatureFromBuckets(
    buckets,
    _spotPosWorldMm,
    _punctualMode
  );
  const cacheHit = !force && ss.mapRendered && ss.casterSignature === sig;

  let cam;
  if (isKitchenDirMode()) {
    cam = ss.orthoCamera;
    if (!cacheHit) configureKitchenDirShadowCamera(cam, allCastMeshes);
  } else {
    cam = ss.camera;
    cam.position.copy(_spotPosWorldMm);
    /** Цель — центр пола комнаты: при боковой лампе взгляд строго вниз уводил кухню из фрустума. */
    const camTarget = spotAimFloorCenterWorldMm(state.room);
    if (camTarget) cam.lookAt(camTarget);
    else cam.lookAt(_spotPosWorldMm.x, 0, _spotPosWorldMm.z);
    cam.updateMatrixWorld(true);
    cam.updateProjectionMatrix();
  }
  ss.viewProj.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);

  scene.traverse((o) => {
    if (!o.isMesh || !o.material?.userData?.__cldIkeaV0Cabinet) return;
    const kind = o.material.userData.__cldIkeaV0Kind;
    applySpotShadowCasterLayers(o, kind);
  });
  ss.casterMeshCount = allCastMeshes.length;
  ss.casterCount = allCastMeshes.length;
  ss.casterInstanceCount = buckets.size;
  ss.casterInstanceIds = [...buckets.keys()];
  if (cacheHit) return;

  ss.casterSignature = sig;

  /** Re-entrancy (onBeforeRender → syncSpot) must not nest another hide/show pass. */
  if (ss._depthPassActive) return;
  ss._depthPassActive = true;

  const prevTarget = renderer.getRenderTarget();
  const prevOverride = scene.overrideMaterial;
  const prevAutoClear = renderer.autoClear;
  const visBackup = new Map();
  const bakeT0 = performance.now();
  /** Always clear atlas (far = lit). Incomplete compare-tex → WebGL skips all ikea draws. */
  try {
    renderer.setRenderTarget(ss.rt);
    renderer.autoClear = false;
    renderer.clear(false, true, false);
    if (allCastMeshes.length > 0) {
      scene.overrideMaterial = ss.depthMaterial;
      allCastMeshes.forEach((m) => visBackup.set(m, m.visible));
      allCastMeshes.forEach((m) => {
        m.visible = false;
      });
      buckets.forEach(({ meshes }) => {
        scene.overrideMaterial = ss.depthMaterial;
        meshes.forEach((m) => {
          m.visible = true;
        });
        renderer.render(scene, cam);
        meshes.forEach((m) => {
          m.visible = false;
        });
      });
    }
    ss.mapRendered = true;
    ss.lastBakeMs = performance.now() - bakeT0;
    ss.lastBakeMode = _punctualMode;
  } finally {
    visBackup.forEach((v, m) => {
      m.visible = v;
    });
    scene.overrideMaterial = prevOverride;
    renderer.autoClear = prevAutoClear;
    renderer.setRenderTarget(prevTarget);
    ss._depthPassActive = false;
  }
}

/**
 * Emergency: Spot depth pass hid casters (frame sides/back) and failed to restore.
 * Shelves/doors stay visible because they often are not in the caster list.
 */
export function restoreIkeaV0CabinetMeshVisibility(scene = state.scene) {
  if (!scene) return { ok: false, reason: 'no scene' };
  const restored = [];
  const underFurniture = (o) => {
    let p = o;
    for (let i = 0; i < 48 && p; i++) {
      if (p.userData?.isFurniture === true) return true;
      if (p.material?.userData?.__cldIkeaV0Cabinet) return true;
      p = p.parent;
    }
    return false;
  };
  scene.traverse((o) => {
    if (!o?.isObject3D) return;
    if (!underFurniture(o)) return;
    if (o.visible === false) {
      o.visible = true;
      restored.push({
        name: o.name || o.uuid,
        kind: o.material?.userData?.__cldIkeaV0Kind || null,
        isBody: !!o.userData?.isBody,
        isMesh: !!o.isMesh,
      });
    }
    if (o.isMesh && o.layers) o.layers.enable(0);
  });
  return {
    ok: true,
    restoredCount: restored.length,
    restored: restored.slice(0, 80),
    note: 'r3j68: unhide meshes stuck after Spot atlas depth pass',
  };
}

/**
 * Фаза поворота 3-tap ядра — своя на каждый кадр накопления (van der Corput по 16 кадрам).
 * При постоянной фазе TAA усредняет один и тот же экранный дизер: три выборки так и остаются
 * тремя, край тени на стене ступенчатый. Вне накопления фаза 0 — иначе край мерцал бы.
 */
function spotShadowJitterPhase() {
  if (!isIkeaHdrDisplayActive()) return 0;
  let i = (_hdrState?.jitterIndex ?? 0) % ACCUM_FRAME_COUNT;
  let phase = 0;
  let denom = 2;
  while (i > 0) {
    phase += (i & 1) / denom;
    i >>= 1;
    denom *= 2;
  }
  return phase;
}

function applySpotShadowUniformsToMaterial(mat, mesh = null) {
  if (!mat?.uniforms || IKEA_V0_ACTIVE_PHASE < 7) return;
  const u = mat.uniforms;
  if (u.shadowSamplingJitter) u.shadowSamplingJitter.value.x = _spotShadowJitterPhase;
  const ss = _spotShadowState;
  const kind = mat.userData?.__cldIkeaV0Kind;
  if (u.spotShadowEnabled) {
    const on =
      IKEA_V0_ACTIVE_PHASE >= 7 &&
      !!ss?.mapTexture &&
      !!ss?.mapRendered &&
      (ss?.casterInstanceCount ?? 0) > 0;
    u.spotShadowEnabled.value = on ? 1 : 0;
  }
  if (u.spotShadowReceive) {
    u.spotShadowReceive.value = spotShadowReceiveForMaterial(mat);
  }
  if (u.spotShadowSpotFloor) {
    u.spotShadowSpotFloor.value = spotShadowSpotFloorForKind(kind);
  }
  if (u.spotShadowViewProj && ss?.viewProj) u.spotShadowViewProj.value.copy(ss.viewProj);
  if (u.spotShadowMap) u.spotShadowMap.value = spotShadowMapUniformValue();
}

function syncSpotShadowUniformsOnScene() {
  if (IKEA_V0_ACTIVE_PHASE < 7) return;
  updateSpotShadowMap();
  const scene = state.scene;
  if (!scene) return;
  _spotShadowJitterPhase = spotShadowJitterPhase();
  scene.traverse((o) => {
    if (!o.isMesh || !o.material?.userData?.__cldIkeaV0) return;
    applySpotShadowUniformsToMaterial(o.material, o);
  });
}

const _cavityBodyBox = new THREE.Box3();
const _cavityBackBox = new THREE.Box3();
const _cavityMeshBox = new THREE.Box3();
const _cavityMeshMatrix = new THREE.Matrix4();
const _cavityWorldToLocal = new THREE.Matrix4();
const _cavityBodyCenter = new THREE.Vector3();
const _cavityBackCenter = new THREE.Vector3();
const _cavitySize = new THREE.Vector3();
let _cavityLastBuildMs = -1e9;
let _cavityLastStats = null;

/** Вложенные группы секций тоже несут isFurniture — полость считаем от внешнего корня. */
function isTopFurnitureRoot(o) {
  if (!o?.userData?.isFurniture) return false;
  for (let p = o.parent; p; p = p.parent) {
    if (p.userData?.isFurniture) return false;
  }
  return true;
}

/** AABB меша в системе корня шкафа — точный при любом повороте группы (не world AABB). */
function cavityMeshLocalBox(mesh, worldToLocal, out) {
  const geom = mesh.geometry;
  if (!geom) return null;
  if (!geom.boundingBox) geom.computeBoundingBox();
  if (!geom.boundingBox) return null;
  _cavityMeshMatrix.multiplyMatrices(worldToLocal, mesh.matrixWorld);
  return out.copy(geom.boundingBox).applyMatrix4(_cavityMeshMatrix);
}

/** Заглушки модулей до подгрузки GLB — не плиты каркаса, в бокс полости не входят. */
function cavityMeshIsPlaceholder(mesh) {
  const ud = mesh.userData || {};
  if (ud.isVisualOnly || ud.isModulePlaceholder) return true;
  return /^(Module|Model)Placeholder_/i.test(String(mesh.name || ''));
}

/**
 * Открытая сторона для шкафа без задней стенки (открытый стеллаж): проём смотрит в комнату.
 * Тот же факт, что даёт задняя стенка — шкаф стоит у стены и открыт внутрь помещения.
 */
function cavityFrontFromRoom(root, body) {
  const room = state.room;
  if (!room?.group) return null;
  const roomCenter = roomFloorCenterWorldMm(room);
  if (!roomCenter) return null;
  const bodyCenterWorld = body.getCenter(new THREE.Vector3()).applyMatrix4(root.matrixWorld);
  const toRoom = new THREE.Vector3(
    roomCenter.x - bodyCenterWorld.x,
    0,
    roomCenter.z - bodyCenterWorld.z
  );
  if (toRoom.lengthSq() < 1) return null;
  toRoom.applyMatrix3(new THREE.Matrix3().setFromMatrix4(_cavityWorldToLocal));
  /** Шкаф не опрокинут: глубина лежит в локальной XZ, вертикаль не рассматриваем. */
  const axis = Math.abs(toRoom.x) >= Math.abs(toRoom.z) ? 0 : 2;
  const comp = axis === 0 ? toRoom.x : toRoom.z;
  if (Math.abs(comp) < 1e-6) return null;
  return { axis, sign: comp >= 0 ? 1 : -1, source: 'room-center' };
}

const _cavityBoardSize = new THREE.Vector3();
const _cavityBoxSize = new THREE.Vector3();
const CAVITY_AXIS_KEYS = ['x', 'y', 'z'];

/**
 * Перекрывающие плиты по геометрии, без имён и ролей: плита тонкая по своей оси и при этом
 * перекрывает полость по второй оси проёма и по глубине. Полка так даёт границу отсека,
 * а задняя стенка (тонкая по оси проёма) блокировщиком не становится.
 */
function cavityBlockersFromBoards(boards, body, axis) {
  const frontKey = CAVITY_AXIS_KEYS[axis];
  const inPlane = CAVITY_AXIS_KEYS.filter((_, i) => i !== axis);
  body.getSize(_cavityBoxSize);
  const lists = [[], []];
  boards.forEach((bb) => {
    bb.getSize(_cavityBoardSize);
    for (let k = 0; k < 2; k++) {
      const thin = inPlane[k];
      const wide = inPlane[1 - k];
      const t = _cavityBoardSize[thin];
      if (t >= _cavityBoardSize[wide] || t >= _cavityBoardSize[frontKey]) continue;
      if (_cavityBoardSize[wide] < _cavityBoxSize[wide] * 0.5) continue;
      if (_cavityBoardSize[frontKey] < _cavityBoxSize[frontKey] * 0.5) continue;
      lists[k].push((bb.min[thin] + bb.max[thin]) * 0.5);
    }
  });
  return lists.map((list) => {
    const uniq = [];
    list
      .sort((a, b) => a - b)
      .forEach((v) => {
        if (!uniq.length || Math.abs(uniq[uniq.length - 1] - v) > 4) uniq.push(v);
      });
    return uniq.slice(0, 12);
  });
}

/**
 * Полость шкафа: AABB каркаса (dump-материалы 010/003) в системе корня + открытая сторона.
 * Открытую сторону берём от задней стенки — её тонкая ось это глубина, знак от зада к корпусу.
 * Поворот группы для этого не нужен, и каркас у IKEA тоже собран вокруг 003_Backside.
 */
function computeCabinetCavity(root) {
  root.updateWorldMatrix(true, false);
  _cavityWorldToLocal.copy(root.matrixWorld).invert();
  const body = _cavityBodyBox.makeEmpty();
  const back = _cavityBackBox.makeEmpty();
  const mats = [];
  const boards = [];
  root.traverse((o) => {
    if (!o.isMesh || o.visible === false) return;
    const ud = o.material?.userData;
    if (!ud?.__cldIkeaV0 || !ud.__cldIkeaV0Cabinet) return;
    const kind = ud.__cldIkeaV0Kind;
    if (cavityMeshIsPlaceholder(o)) return;
    if (CAVITY_OCC_KINDS.has(kind) && !mats.includes(o.material)) mats.push(o.material);
    if (!CAVITY_BODY_KINDS.has(kind)) return;
    /** Выдвинутый ящик уезжает за корпус и раздувал бокс — проём уходил вперёд, интерьер темнел. */
    if (meshSpotShadowIsDrawerLike(o)) return;
    const bb = cavityMeshLocalBox(o, _cavityWorldToLocal, _cavityMeshBox);
    if (!bb || bb.isEmpty()) return;
    boards.push(bb.clone());
    body.union(bb);
    if (kind === 'back') back.union(bb);
  });
  if (!mats.length) return { mats, cavity: null, reason: 'no cabinet mats' };
  if (body.isEmpty()) return { mats, cavity: null, reason: 'no body' };
  let axis;
  let sign;
  let source;
  if (!back.isEmpty()) {
    back.getSize(_cavitySize);
    axis = 2;
    if (_cavitySize.x <= _cavitySize.y && _cavitySize.x <= _cavitySize.z) axis = 0;
    else if (_cavitySize.y <= _cavitySize.x && _cavitySize.y <= _cavitySize.z) axis = 1;
    const backKey = axis === 0 ? 'x' : axis === 1 ? 'y' : 'z';
    body.getCenter(_cavityBodyCenter);
    back.getCenter(_cavityBackCenter);
    sign = _cavityBodyCenter[backKey] - _cavityBackCenter[backKey] >= 0 ? 1 : -1;
    source = 'back-panel';
  } else {
    /** Открытый стеллаж без задней стенки — сторона от размещения, а не угадана. */
    const fromRoom = cavityFrontFromRoom(root, body);
    if (!fromRoom) return { mats, cavity: null, reason: 'no back panel, no room anchor' };
    axis = fromRoom.axis;
    sign = fromRoom.sign;
    source = fromRoom.source;
  }
  const key = axis === 0 ? 'x' : axis === 1 ? 'y' : 'z';
  body.getSize(_cavitySize);
  if (_cavitySize[key] < CAVITY_INSIDE_MARGIN_MM * 4) {
    return { mats, cavity: null, reason: 'body too shallow' };
  }
  const [blockA, blockB] = cavityBlockersFromBoards(boards, body, axis);
  return {
    mats,
    cavity: {
      min: body.min.clone(),
      max: body.max.clone(),
      axis,
      sign,
      worldToLocal: _cavityWorldToLocal.clone(),
      depthMm: Math.round(_cavitySize[key]),
      source,
      blockA,
      blockB,
    },
  };
}

function syncCabinetCavityOcclusionOnScene(force = false) {
  const scene = state.scene;
  if (!scene || IKEA_V0_ACTIVE_PHASE < 4) return null;
  const now = performance.now();
  if (!force && now - _cavityLastBuildMs < CAVITY_REBUILD_MIN_MS) return _cavityLastStats;
  _cavityLastBuildMs = now;
  const roots = [];
  scene.traverse((o) => {
    if (isTopFurnitureRoot(o)) roots.push(o);
  });
  let cabinets = 0;
  let materialsOn = 0;
  let materialsOff = 0;
  const skipped = [];
  const cavities = [];
  const underList = [];
  roots.forEach((root) => {
    const { mats, cavity, reason } = computeCabinetCavity(root);
    if (!mats.length) return;
    if (cavity) {
      const cfg = resolveLedConfig(root);
      if (cfg.enabled && cfg.mode === 'under') {
        const seg = ledUnderSegmentForCavity(cavity, cfg);
        if (seg) underList.push({ a: seg[0], b: seg[1], cfg });
      }
    }
    cabinets += 1;
    if (!cavity && reason) skipped.push({ root: root.name || root.uuid, reason });
    if (cavity) {
      cavities.push({
        axis: cavity.axis,
        sign: cavity.sign,
        depthMm: cavity.depthMm,
        source: cavity.source,
      });
    }
    const ledCfg = resolveLedConfig(root);
    mats.forEach((mat) => {
      const u = mat.uniforms;
      if (!u?.cavityOccEnabled) return;
      applyLedUniforms(u, ledCfg);
      if (!cavity) {
        u.cavityOccEnabled.value = 0;
        materialsOff += 1;
        return;
      }
      u.cavityOccEnabled.value = 1;
      u.cavityOccStrength.value = CAVITY_OCC_STRENGTH;
      if (u.cavityInteriorLevel) {
        u.cavityInteriorLevel.value = _cavityTune.level;
        u.cavityInteriorLevelUp.value = _cavityTune.levelUp;
        u.cavityCreaseMin.value = _cavityTune.creaseMin;
        u.cavityCreaseWidthMm.value = _cavityTune.creaseWidthMm;
      }
      u.cavityWorldToLocal.value.copy(cavity.worldToLocal);
      u.cavityBoxMin.value.copy(cavity.min);
      u.cavityBoxMax.value.copy(cavity.max);
      u.cavityFrontAxis.value = cavity.axis;
      u.cavityFrontSign.value = cavity.sign;
      if (u.cavityBlockA) {
        for (let i = 0; i < CAVITY_BLOCK_MAX; i++) {
          u.cavityBlockA.value[i] = cavity.blockA[i] ?? 0;
          u.cavityBlockB.value[i] = cavity.blockB[i] ?? 0;
        }
        u.cavityBlockACount.value = Math.min(cavity.blockA.length, CAVITY_BLOCK_MAX);
        u.cavityBlockBCount.value = Math.min(cavity.blockB.length, CAVITY_BLOCK_MAX);
      }
      materialsOn += 1;
    });
  });
  writeLedUnderUniforms(underList);
  scene.traverse((o) => {
    const u = o.isMesh ? o.material?.uniforms : null;
    if (!u?.ledUnderCount || u.ledUnderCount === _ledUnderU.ledUnderCount) return;
    for (const k of Object.keys(_ledUnderU)) u[k] = _ledUnderU[k];
  });
  _cavityLastStats = {
    ok: true,
    furnitureRoots: roots.length,
    cabinets,
    materialsOn,
    materialsOff,
    cavities: cavities.slice(0, 8),
    skipped: skipped.slice(0, 8),
    strength: CAVITY_OCC_STRENGTH,
    marginMm: CAVITY_INSIDE_MARGIN_MM,
    kinds: [...CAVITY_OCC_KINDS],
    tune: { ..._cavityTune },
  };
  return _cavityLastStats;
}

/**
 * Кэш кромки на меше: bbox геометрии статичен, а ширину полосы переводим из мм в object units
 * через мировой масштаб оси — иначе на отмасштабированной плите полоса разъезжается.
 * Вертикальность оси берём из её направления в комнате, чтобы верх/низ полотна настраивался
 * отдельно от бокового стыка створок.
 */
function panelEdgeAoCacheFor(mesh) {
  const cached = mesh.userData.__cldPanelEdgeAo;
  if (cached && cached.rev === _panelEdgeAoRev) return cached;
  const geo = mesh.geometry;
  if (!geo) return null;
  if (!geo.boundingBox) geo.computeBoundingBox();
  const bb = geo.boundingBox;
  if (!bb) return null;
  mesh.updateWorldMatrix(true, false);
  const e = mesh.matrixWorld.elements;
  const widthObj = new THREE.Vector3();
  const rimObj = new THREE.Vector3();
  for (let i = 0; i < 3; i++) {
    const cx = e[i * 4];
    const cy = e[i * 4 + 1];
    const cz = e[i * 4 + 2];
    const len = Math.hypot(cx, cy, cz);
    const vertical = len > 1e-6 && Math.abs(cy / len) > 0.7;
    const mm = vertical ? _cavityTune.edgeWidthTopMm : _cavityTune.edgeWidthSideMm;
    widthObj.setComponent(i, mm / Math.max(len, 1e-6));
    rimObj.setComponent(i, FACADE_SHADOW_RIM_MM / Math.max(len, 1e-6));
  }
  const next = {
    rev: _panelEdgeAoRev,
    min: bb.min.clone(),
    max: bb.max.clone(),
    widthObj,
    rimObj,
  };
  mesh.userData.__cldPanelEdgeAo = next;
  return next;
}

/**
 * Пишется на каждый draw через onBeforeRender: материал может быть общим на несколько плит,
 * и тогда единственная запись «за кадр» дала бы всем панелям bbox последней из них.
 */
function writePanelEdgeAoUniforms(mat, mesh) {
  const u = mat?.uniforms;
  if (!u?.panelEdgeAoEnabled) return;
  const kind = mat.userData?.__cldIkeaV0Kind;
  /** Window/door GLB profiles are not flat boards — bbox edge band breaks into dashes. */
  const cache =
    PANEL_EDGE_AO_KINDS.has(kind) && !mesh?.userData?.isRoomOpeningLeaf
      ? panelEdgeAoCacheFor(mesh)
      : null;
  if (u.panelShadowRimEnabled) u.panelShadowRimEnabled.value = cache ? 1 : 0;
  if (!cache) {
    u.panelEdgeAoEnabled.value = 0;
    return;
  }
  u.panelEdgeAoEnabled.value = _cavityTune.edgeMin >= 0.999 ? 0 : 1;
  u.panelBoxMin.value.copy(cache.min);
  u.panelBoxMax.value.copy(cache.max);
  u.panelEdgeWidthObj.value.copy(cache.widthObj);
  if (u.panelShadowRimObj && cache.rimObj) u.panelShadowRimObj.value.copy(cache.rimObj);
  u.panelEdgeAoMin.value = _cavityTune.edgeMin;
}

function ensurePanelEdgeAoHook(mesh) {
  if (!mesh?.isMesh || mesh.userData.__cldPanelEdgeAoHook) return;
  mesh.userData.__cldPanelEdgeAoHook = true;
  const prev = mesh.onBeforeRender;
  mesh.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
    writePanelEdgeAoUniforms(material, this);
    if (typeof prev === 'function') {
      prev.call(this, renderer, scene, camera, geometry, material, group);
    }
  };
}

/**
 * Подбор периметрального AO кромки. Цель по пипетке: провал в стыке створок 9–19 ед., как у
 * IKEA (наш до слоя 2.6–4.0). Сойдётесь на числах — переносим в PANEL_EDGE_AO_* и в манифест.
 */
export function setIkeaV0PanelEdgeAo(edgeMin, widthSideMm, widthTopMm) {
  if (Number.isFinite(edgeMin)) _cavityTune.edgeMin = Math.max(0, Math.min(1, edgeMin));
  if (Number.isFinite(widthSideMm)) _cavityTune.edgeWidthSideMm = Math.max(0, widthSideMm);
  if (Number.isFinite(widthTopMm)) _cavityTune.edgeWidthTopMm = Math.max(0, widthTopMm);
  _panelEdgeAoRev += 1;
  resetIkeaHdrAccumulation('panel-edge-ao');
  return {
    edgeMin: _cavityTune.edgeMin,
    edgeWidthSideMm: _cavityTune.edgeWidthSideMm,
    edgeWidthTopMm: _cavityTune.edgeWidthTopMm,
    kinds: [...PANEL_EDGE_AO_KINDS],
  };
}

export function auditIkeaV0CabinetOcclusion() {
  return syncCabinetCavityOcclusionOnScene(true) ?? { ok: false, reason: 'phase < 4 or no scene' };
}

/**
 * Калибровка уровня полости по пипетке без нового билда: цель — вертикаль 178, верх полки 234
 * при стене 218. Уровень выведен из JPEG (±8 уровней), поэтому ручка нужна.
 * Значение, на котором сойдётся, переносим в CAVITY_INTERIOR_LEVEL* и в deviations манифеста.
 */
export function setIkeaV0CavityLevel(level, levelUp, creaseMin, creaseWidthMm) {
  if (Number.isFinite(level)) _cavityTune.level = level;
  if (Number.isFinite(levelUp)) _cavityTune.levelUp = levelUp;
  if (Number.isFinite(creaseMin)) _cavityTune.creaseMin = creaseMin;
  if (Number.isFinite(creaseWidthMm)) _cavityTune.creaseWidthMm = creaseWidthMm;
  const scene = state.scene;
  let materials = 0;
  scene?.traverse((o) => {
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    mats.forEach((mat) => {
      const u = mat?.uniforms;
      if (!u?.cavityInteriorLevel) return;
      u.cavityInteriorLevel.value = _cavityTune.level;
      u.cavityInteriorLevelUp.value = _cavityTune.levelUp;
      u.cavityCreaseMin.value = _cavityTune.creaseMin;
      u.cavityCreaseWidthMm.value = _cavityTune.creaseWidthMm;
      materials += 1;
    });
  });
  resetIkeaHdrAccumulation('cavity-level');
  return { ..._cavityTune, materials };
}

/**
 * Общая белизна шкафа одной ручкой: множитель на linear albedo dump-материалов корпуса.
 * 1 = дамп как есть. База запоминается на материале, иначе повторные вызовы перемножались бы.
 * Это ручка подбора, а не новый слой: сойдётесь на числе — перенесём в SOT/каталог.
 */
/**
 * Яркость шкафа выше «белого без затенения»: множитель линейного HDR на материалах корпуса.
 * ЭТО ОТКЛОНЕНИЕ ОТ ДАМПА — у IKEA такой ручки нет, 1 = их уровень. Выше 1 шкаф становится
 * ярче стены, и это уже не IKEA. Материалы, созданные ПОСЛЕ подбора (добавили модуль), придут
 * с 1 — тогда дёрнуть слайдер ещё раз.
 */
export function setIkeaV0CabinetGain(gain) {
  const mul = Number.isFinite(gain) ? Math.max(0, gain) : 1;
  _cavityTune.gain = mul;
  const scene = state.scene;
  let materials = 0;
  scene?.traverse((o) => {
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    mats.forEach((mat) => {
      if (!mat?.userData?.__cldIkeaV0Cabinet || !mat.uniforms?.cabinetGain) return;
      mat.uniforms.cabinetGain.value = mul;
      materials += 1;
    });
  });
  resetIkeaHdrAccumulation('cabinet-gain');
  return { gain: mul, materials };
}

export function setIkeaV0CabinetWhite(white) {
  const mul = Number.isFinite(white) ? Math.max(0, white) : 1;
  _cavityTune.white = mul;
  const scene = state.scene;
  let materials = 0;
  scene?.traverse((o) => {
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    mats.forEach((mat) => {
      const ud = mat?.userData;
      const u = mat?.uniforms;
      if (!ud?.__cldIkeaV0Cabinet || !u?.diffuse?.value?.isVector3) return;
      if (!ud.__cldIkeaV0BaseDiffuse) ud.__cldIkeaV0BaseDiffuse = u.diffuse.value.clone();
      u.diffuse.value.copy(ud.__cldIkeaV0BaseDiffuse).multiplyScalar(mul).clampScalar(0, 1);
      materials += 1;
    });
  });
  resetIkeaHdrAccumulation('cabinet-white');
  return { white: mul, materials };
}

const CAVITY_TUNE_PANEL_ID = 'cld-ikea-cavity-tune';

/**
 * Временная кнопка в верхнем ряду иконок (свёрнута). Клик — слайдеры.
 * __cldIkeaV0CavityTuneUI() | __cldIkeaV0CavityTuneUI(false) | ?cavityTune=1
 */
export function showIkeaV0CavityTuneUI(show = true) {
  if (typeof document === 'undefined') return { ok: false, reason: 'no document' };
  const existing = document.getElementById(CAVITY_TUNE_PANEL_ID);
  if (show === false) {
    existing?.remove();
    return { ok: true, visible: false, expanded: false, ..._cavityTune };
  }

  const host =
    document.getElementById('scene-icons-container') ||
    document.getElementById('canvas-container') ||
    document.body;

  let root = existing;
  if (!root) {
    root = document.createElement('div');
    root.id = CAVITY_TUNE_PANEL_ID;
    root.style.cssText = [
      'position:absolute',
      'top:20px',
      'right:320px',
      'z-index:10050',
      'pointer-events:auto',
      'font:12px/1.35 system-ui,Segoe UI,sans-serif',
      'color:#222',
      'user-select:none',
    ].join(';');

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'scene-icon-top-right scene-icon-cavity-tune';
    toggle.title = 'Cavity tune (IKEA occlusion)';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.style.cssText = [
      'width:40px',
      'height:40px',
      'padding:0',
      'border-radius:8px',
      'background:white',
      'border:1px solid #ddd',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'font-size:16px',
      'color:#333',
      'box-shadow:0 2px 4px rgba(0,0,0,0.15)',
      'cursor:pointer',
      'opacity:0.95',
    ].join(';');
    toggle.innerHTML = '<i class="fas fa-adjust" aria-hidden="true"></i>';

    const dropdown = document.createElement('div');
    dropdown.dataset.role = 'cavity-dropdown';
    dropdown.hidden = true;
    dropdown.style.cssText = [
      'position:absolute',
      'top:48px',
      'right:0',
      'width:260px',
      'padding:10px 12px 12px',
      'background:rgba(255,255,255,.96)',
      'border:1px solid #ccc',
      'border-radius:8px',
      'box-shadow:0 4px 16px rgba(0,0,0,.18)',
    ].join(';');

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:600;margin:0 0 6px;';
    title.textContent = 'Свет — подбор (временная)';
    dropdown.appendChild(title);

    const hint = document.createElement('div');
    hint.style.cssText = 'color:#666;margin:0 0 8px;font-size:11px;';
    hint.textContent =
      'Шкаф: бок темнее → level ↓ · угол слабее → crease ↑ · белее «белого» только gain · ' +
      'стык створок глубже → edge ↓. Комната: room ↓ темнее, 1 = дамп IKEA';
    dropdown.appendChild(hint);

    const rows = [
      /**
       * Выше 1 у level/levelUp/crease/white потолка нет физически: occ режется в clamp(0,1),
       * а albedo — в clampScalar(0,1). Осветлять сверх этого умеет только gain.
       */
      { key: 'level', label: 'level — бок/зад', min: 0.2, max: 1, step: 0.01, digits: 2 },
      { key: 'levelUp', label: 'levelUp — верх полок', min: 0.4, max: 1, step: 0.01, digits: 2 },
      { key: 'creaseMin', label: 'crease — угол бок↔зад', min: 0.3, max: 1, step: 0.01, digits: 2 },
      { key: 'creaseWidthMm', label: 'width — ширина мм', min: 10, max: 300, step: 1, digits: 0 },
      { key: 'white', label: 'white — белизна корпуса', min: 0.6, max: 1, step: 0.005, digits: 3 },
      { key: 'gain', label: 'gain — яркость (не IKEA)', min: 1, max: 2, step: 0.01, digits: 2 },
      /** Кромка фасада: цель по пипетке IKEA — провал в стыке створок 9–19 ед. */
      { key: 'edgeMin', label: 'edge — кромка фасада', min: 0.3, max: 1, step: 0.01, digits: 2 },
      { key: 'edgeWidthSideMm', label: 'edge side — стык створок, мм', min: 0, max: 40, step: 1, digits: 0 },
      { key: 'edgeWidthTopMm', label: 'edge top — верх/низ, мм', min: 0, max: 40, step: 1, digits: 0 },
      /** Комната: отклонение от дампа (surfaceLinearScale = 1), 1 = дамп. */
      { key: 'roomDim', label: 'room — комната темнее', min: 0.5, max: 1, step: 0.01, digits: 2 },
    ];
    const fmt = (row, n) => Number(n).toFixed(row.digits);
    const valueEls = {};
    const applyFromUi = () => {
      setIkeaV0CavityLevel(
        Number(valueEls.level.dataset.val),
        Number(valueEls.levelUp.dataset.val),
        Number(valueEls.creaseMin.dataset.val),
        Number(valueEls.creaseWidthMm.dataset.val)
      );
      setIkeaV0CabinetWhite(Number(valueEls.white.dataset.val));
      setIkeaV0CabinetGain(Number(valueEls.gain.dataset.val));
      setIkeaV0PanelEdgeAo(
        Number(valueEls.edgeMin.dataset.val),
        Number(valueEls.edgeWidthSideMm.dataset.val),
        Number(valueEls.edgeWidthTopMm.dataset.val)
      );
      setIkeaV0RoomDim(Number(valueEls.roomDim.dataset.val));
    };

    for (const row of rows) {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'margin:0 0 8px;';
      const lab = document.createElement('div');
      lab.style.cssText = 'display:flex;justify-content:space-between;margin:0 0 2px;';
      const name = document.createElement('span');
      name.textContent = row.label;
      const val = document.createElement('span');
      val.style.cssText = 'font-variant-numeric:tabular-nums;color:#111;';
      const start = _cavityTune[row.key];
      val.textContent = fmt(row, start);
      val.dataset.val = String(start);
      valueEls[row.key] = val;
      lab.appendChild(name);
      lab.appendChild(val);
      const input = document.createElement('input');
      input.type = 'range';
      input.min = String(row.min);
      input.max = String(row.max);
      input.step = String(row.step);
      input.value = String(start);
      input.style.cssText = 'width:100%;margin:0;';
      input.oninput = () => {
        const n = Number(input.value);
        val.textContent = fmt(row, n);
        val.dataset.val = String(n);
        applyFromUi();
      };
      wrap.appendChild(lab);
      wrap.appendChild(input);
      dropdown.appendChild(wrap);
    }

    const btnCss =
      'width:100%;margin-top:6px;padding:6px 8px;border:1px solid #bbb;border-radius:6px;' +
      'background:#f6f6f6;cursor:pointer;font:12px system-ui,sans-serif;';
    const cavityCmd = () =>
      `__cldIkeaV0SetCavityLevel(${_cavityTune.level}, ${_cavityTune.levelUp}, ` +
      `${_cavityTune.creaseMin}, ${_cavityTune.creaseWidthMm}); ` +
      `__cldIkeaV0SetCabinetWhite(${_cavityTune.white}); ` +
      `__cldIkeaV0SetCabinetGain(${_cavityTune.gain}); ` +
      `__cldIkeaV0SetPanelEdgeAo(${_cavityTune.edgeMin}, ` +
      `${_cavityTune.edgeWidthSideMm}, ${_cavityTune.edgeWidthTopMm}); ` +
      `__cldIkeaV0SetRoomDim(${_cavityTune.roomDim})`;

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Сохранить';
    saveBtn.title = 'Пишет текущие цифры в Console';
    saveBtn.style.cssText = btnCss + 'background:#333;color:#fff;border-color:#222;font-weight:600;';
    saveBtn.onclick = (e) => {
      e.stopPropagation();
      const snap = {
        savedAt: new Date().toISOString(),
        level: _cavityTune.level,
        levelUp: _cavityTune.levelUp,
        creaseMin: _cavityTune.creaseMin,
        creaseWidthMm: _cavityTune.creaseWidthMm,
        white: _cavityTune.white,
        gain: _cavityTune.gain,
        edgeMin: _cavityTune.edgeMin,
        edgeWidthSideMm: _cavityTune.edgeWidthSideMm,
        edgeWidthTopMm: _cavityTune.edgeWidthTopMm,
        roomDim: _cavityTune.roomDim,
        cmd: cavityCmd(),
      };
      window.__cldIkeaV0CavityTuneSaved = snap;
      console.warn('[CLD][CAVITY-TUNE] Сохранено (слайдеры → консоль)', snap);
      console.log(snap.cmd);
      saveBtn.textContent = 'В консоли ✓';
      setTimeout(() => {
        saveBtn.textContent = 'Сохранить';
      }, 1400);
    };
    dropdown.appendChild(saveBtn);

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.textContent = 'Скопировать команду';
    copyBtn.style.cssText = btnCss;
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      const cmd = cavityCmd();
      try {
        if (typeof copy === 'function') copy(cmd);
        else navigator.clipboard?.writeText?.(cmd);
      } catch (_) {}
      console.log(cmd);
      copyBtn.textContent = 'Скопировано';
      setTimeout(() => {
        copyBtn.textContent = 'Скопировать команду';
      }, 1200);
    };
    dropdown.appendChild(copyBtn);

    const setExpanded = (open) => {
      dropdown.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.style.background = open ? '#333' : 'white';
      toggle.style.color = open ? '#fff' : '#333';
      root.dataset.expanded = open ? '1' : '0';
    };

    toggle.onclick = (e) => {
      e.stopPropagation();
      setExpanded(dropdown.hidden);
    };

    root.appendChild(toggle);
    root.appendChild(dropdown);
    root._cldSetExpanded = setExpanded;
    host.appendChild(root);
  }

  if (show === 'expand' || show === 1) {
    root._cldSetExpanded?.(true);
  } else {
    root._cldSetExpanded?.(false);
  }

  return {
    ok: true,
    visible: true,
    expanded: root.dataset.expanded === '1',
    ..._cavityTune,
  };
}

function syncSoftUniformsOnScene() {
  const scene = state.scene;
  if (!scene || IKEA_V0_ACTIVE_PHASE < 3) return;
  const alphaTex = _softState?.alphaTexture ?? null;
  scene.traverse((o) => {
    if (!o.isMesh || !o.material?.userData?.__cldIkeaV0) return;
    const u = o.material.uniforms;
    if (u?.softPlaneMap) u.softPlaneMap.value = alphaTex;
    if (u?.softPlaneViewportM && _softFloorViewportM) {
      u.softPlaneViewportM.value.copy(_softFloorViewportM);
    } else if (u?.softPlaneViewportM && _softViewportM) {
      u.softPlaneViewportM.value.copy(_softViewportM);
    }
    if (u?.softPlaneFootprintM && _softFootprintM) u.softPlaneFootprintM.value.copy(_softFootprintM);
    const kind = o.material.userData.__cldIkeaV0Kind;
    if (u?.softPlaneEnabled) u.softPlaneEnabled.value = softPlaneEnabledForKind(kind);
    if (IKEA_V0_ACTIVE_PHASE >= 4) {
      if (u?.blurredHeightmap) u.blurredHeightmap.value = softAoHeightmapForKind(kind);
      const vp = softAoViewportForKind(kind);
      if (u?.blurredHeightmapViewportM && vp) {
        u.blurredHeightmapViewportM.value.copy(vp);
      }
      if (u?.softAoEnabled) u.softAoEnabled.value = ikeaV0SoftAoEnabledForMaterial(o.material);
    }
  });
}

function envRotMat3Y(deg) {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return new THREE.Matrix3().set(c, 0, s, 0, 1, 0, -s, 0, c);
}

function shUniformFromDump() {
  return activeShRows().map((rgb) => new THREE.Vector3(rgb[0], rgb[1], rgb[2]));
}

function syncShUniformsOnScene() {
  _shUniform = shUniformFromDump();
  const scene = state.scene;
  if (!scene) return;
  scene.traverse((o) => {
    const sh = o.isMesh ? o.material?.uniforms?.shCoeffs?.value : null;
    if (!Array.isArray(sh) || sh.length < 9) return;
    for (let i = 0; i < 9; i++) {
      if (sh[i]?.isVector3) sh[i].fromArray(_shUniform[i].toArray());
    }
  });
}

/** A/B диффузного IBL: 'pax' (по умолчанию) | 'kitchen'. Spot/тени/exposure не трогает. */
export function setIkeaV0ShSource(source = 'pax') {
  _shSource = source === 'kitchen' ? 'kitchen' : 'pax';
  syncShUniformsOnScene();
  resetIkeaHdrAccumulation('sh-source');
  return {
    source: _shSource,
    l00: activeShRows()[0],
    usage: "PAX: __cldIkeaV0ShSource('pax'); кухня: __cldIkeaV0ShSource('kitchen')",
  };
}

/** A/B punctual: 'pax-spot' (default) | 'kitchen-dir'. SH / exposure / HDR не трогает. */
export function setIkeaV0PunctualMode(mode = 'pax-spot') {
  _punctualMode = mode === 'kitchen-dir' ? 'kitchen-dir' : 'pax-spot';
  syncSpotUniformsOnScene();
  updateSpotShadowMap(true);
  syncSpotShadowUniformsOnScene();
  resetIkeaHdrAccumulation('punctual-mode');
  return {
    mode: _punctualMode,
    kitchenDirEnabled: isKitchenDirMode() ? 1 : 0,
    wi: [KITCHEN_DIR_WI.x, KITCHEN_DIR_WI.y, KITCHEN_DIR_WI.z],
    intensity: KITCHEN_DIR_INTENSITY,
    lastBakeMs: _spotShadowState?.lastBakeMs ?? null,
    usage: "PAX: __cldIkeaV0PunctualMode('pax-spot'); кухня: __cldIkeaV0PunctualMode('kitchen-dir')",
  };
}

/**
 * Позиция света — канон сменён 2026-10-29 по решению пользователя в чате.
 * SoT PAX даёт (0,5,2) м, почти над кухней: тень от шкафа идёт вниз и к задней стене,
 * то есть прячется под собственным днищем и за корпусом — снаружи её не видно совсем.
 * У кухни IKEA свет боковой (от окна), поэтому тень выходит на столешницу и на пол.
 * SOT не правим, это дамп PAX; активный пресет берётся отсюда, кнопка на сцене их листает.
 */
const SPOT_POS_PRESETS = Object.freeze([
  Object.freeze({ name: 'сбоку слева', x: -2.6, y: 4.2, z: 2.6 }),
  Object.freeze({ name: 'сбоку справа', x: 2.6, y: 4.2, z: 2.6 }),
  Object.freeze({ name: 'SoT PAX сверху', x: 0, y: 5, z: 2 }),
]);
let _spotPosPresetIndex = 0;
/** Направление конуса в мире — от лампы на центр пола комнаты (иначе кухня вне конуса). */
let _spotDirWorld = null;

function activeSpotPosM() {
  return SPOT_POS_PRESETS[_spotPosPresetIndex] ?? SPOT_POS_PRESETS[0];
}

function currentSpotDir() {
  return _spotDirWorld ?? SOT.spot.dir;
}

/** Цель лампы и камеры тени — центр пола как THREE.Vector3 (roomFloorCenterWorldMm даёт литерал). */
function spotAimFloorCenterWorldMm(room) {
  if (!room?.group) return null;
  return room.group.localToWorld(
    new THREE.Vector3(room.width / 2, 0, room.depth / 2)
  );
}

function resolveSpotPositionWorldMm(room) {
  const p = activeSpotPosM();
  /** X центр комнаты + сдвиг пресета, Y пол, Z от задней стены (Room local z=0). */
  const localMm = new THREE.Vector3(
    room.width / 2 + m2mm(p.x),
    m2mm(p.y),
    m2mm(p.z)
  );
  const world = room.group.localToWorld(localMm.clone());
  const target = spotAimFloorCenterWorldMm(room);
  _spotDirWorld = target
    ? target.clone().sub(world).normalize()
    : new THREE.Vector3(SOT.spot.dir.x, SOT.spot.dir.y, SOT.spot.dir.z).normalize();
  return world;
}

function expectedSpotWorldZMm(room) {
  return m2mm(activeSpotPosM().z) - room.depth / 2;
}

function kitchenDirUniforms() {
  return {
    kitchenDirEnabled: { value: isKitchenDirMode() ? 1 : 0 },
    kitchenDirWi: {
      value: new THREE.Vector3(KITCHEN_DIR_WI.x, KITCHEN_DIR_WI.y, KITCHEN_DIR_WI.z),
    },
    kitchenDirColor: { value: new THREE.Vector3(1, 1, 1) },
    kitchenDirIntensity: { value: KITCHEN_DIR_INTENSITY },
  };
}

function spotUniforms() {
  const dir = currentSpotDir();
  /** World meters for default 5×4 m room (spot Z world = 0, not local 2). */
  const fallbackM = new THREE.Vector3(0, SOT.spot.defaultPos_m.y, 0);
  const spotOn = IKEA_V0_ACTIVE_PHASE >= 2 && !isKitchenDirMode() ? 1 : 0;
  return {
    spotPosM: { value: _spotPosM?.clone() ?? fallbackM },
    spotDir: { value: new THREE.Vector3(dir.x, dir.y, dir.z).normalize() },
    spotColorUbo: {
      value: new THREE.Vector3(
        SOT.spot.colorLineAndRange[0],
        SOT.spot.colorLineAndRange[1],
        SOT.spot.colorLineAndRange[2]
      ),
    },
    spotCosInner: { value: SOT.spot.innerCos },
    spotCosOuter: { value: SOT.spot.outerCos },
    spotEnabled: { value: spotOn },
    spotWallScale: { value: SOT.spot.wallScale ?? 1 },
    spotWallMinDist2: { value: SOT.spot.wallMinDist2_m2 ?? 0 },
    ...kitchenDirUniforms(),
  };
}

function srgbTripletToLinearVec3(srgb) {
  const c = new THREE.Color(srgb[0], srgb[1], srgb[2]);
  c.convertSRGBToLinear();
  return new THREE.Vector3(c.r, c.g, c.b);
}

function linearAlbedoFromSot(kind) {
  if (kind === 'wall' || kind === 'frame') {
    const w = SOT.wall.screenLinear ?? SOT.wall.linear;
    return new THREE.Vector3(w[0], w[1], w[2]);
  }
  if (kind === 'ceiling') {
    return srgbTripletToLinearVec3(SOT.ceiling.srgb);
  }
  if (kind === 'floorSlab') {
    const s = SOT.floor.slab.linear;
    return new THREE.Vector3(s[0], s[1], s[2]);
  }
  if (kind === 'corpus' || kind === 'facade' || kind === 'trim' || kind === 'door') {
    return srgbTripletToLinearVec3(SOT.corpus.srgb);
  }
  if (kind === 'back') {
    /**
     * Dump 003_Backside_Furniture: base_linear [1,1,1] × diffuseTexture #image2 (PAX GLB).
     * Текстуры у нас нет, а [1,1,1] без неё означает «текстура чисто белая» — HDF таким не
     * бывает, и задник выходил нейтральным пятном ХОЛОДНЕЕ тёплого 010_White каркаса.
     * Граница по дампу: задник не может быть светлее каркаса → берём 010_White до дампа image2.
     * Roughness 0.6 из SOT.back не меняем.
     */
    return srgbTripletToLinearVec3(SOT.corpus.srgb);
  }
  if (kind === 'plastic') {
    return srgbTripletToLinearVec3(SOT.whitePlastic.srgb);
  }
  if (kind === 'metal') {
    return srgbTripletToLinearVec3(SOT.galvanizedMetal.srgb);
  }
  if (kind === 'rubber') {
    return srgbTripletToLinearVec3(SOT.rubber.srgb);
  }
  return new THREE.Vector3(1, 1, 1);
}

function roughnessForKind(kind) {
  if (kind === 'floor') return SOT.floor.roughness;
  if (kind === 'floorSlab') return SOT.floor.slab.roughness ?? SOT.floor.roughness;
  if (kind === 'ceiling') return SOT.ceiling.roughness;
  if (kind === 'back') return SOT.back.roughness ?? SOT.backRoughness;
  if (kind === 'plastic') return SOT.whitePlastic.roughness;
  if (kind === 'metal') return SOT.galvanizedMetal.roughness;
  if (kind === 'rubber') return SOT.rubber.roughness;
  if (kind === 'corpus' || kind === 'facade' || kind === 'trim' || kind === 'door') {
    return SOT.corpus.roughness;
  }
  return SOT.wall.roughness;
}

function metalnessForKind(kind, opts = {}) {
  if (opts.metalness != null && Number.isFinite(Number(opts.metalness))) {
    return Math.max(0, Math.min(1, Number(opts.metalness)));
  }
  if (kind === 'metal') return SOT.galvanizedMetal.metalness;
  return 0;
}

/**
 * Builder / step-5 fallback white — not a real grey/wood finish.
 * Hex is parsed as 8-bit sRGB (ColorManagement would store linear and miss #f5f5f5).
 * RGB path covers THREE.Color / uniforms already in working space.
 */
function isBuilderFlatWhiteRgb(r, g, b) {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  return mn >= 0.88 && mx - mn <= 0.09;
}

function srgbBytesFromCssHex(hex) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function isBuilderFlatWhiteHex(hex) {
  if (hex == null || hex === '') return false;
  const bytes = srgbBytesFromCssHex(hex);
  if (bytes) {
    const mn = Math.min(bytes.r, bytes.g, bytes.b);
    const mx = Math.max(bytes.r, bytes.g, bytes.b);
    return mn >= 240 && mx - mn <= 16;
  }
  try {
    const c = new THREE.Color(hex);
    return isBuilderFlatWhiteRgb(c.r, c.g, c.b);
  } catch {
    return false;
  }
}

/** Панели шкафа с dump-albedo: обклад/дно шага 5 приходили #fff и убивали тёплый 010_White. */
const BUILDER_WHITE_DUMP_PANEL_KINDS = new Set(['corpus', 'facade', 'back', 'trim', 'door']);

function skipBuilderWhiteOnDumpPanel(kind, opts = {}) {
  if (!BUILDER_WHITE_DUMP_PANEL_KINDS.has(kind)) return false;
  // White catalog tint (#fff × map) still has to be dump 010_White / 003, not (1,1,1).
  if (opts.diffuseLinear?.isVector3) {
    const v = opts.diffuseLinear;
    return isBuilderFlatWhiteRgb(v.x, v.y, v.z);
  }
  if (opts.color?.isColor) {
    return isBuilderFlatWhiteRgb(opts.color.r, opts.color.g, opts.color.b);
  }
  return false;
}

function diffuseFromBindOpts(kind, opts = {}) {
  if (skipBuilderWhiteOnDumpPanel(kind, opts)) return linearAlbedoFromSot(kind);
  if (opts.diffuseLinear?.isVector3) return opts.diffuseLinear.clone();
  if (opts.color?.isColor) {
    const c = opts.color.clone();
    c.convertSRGBToLinear();
    return new THREE.Vector3(c.r, c.g, c.b);
  }
  return linearAlbedoFromSot(kind);
}

let _floorWhiteFallbackTex = null;

function floorWhiteFallbackTex() {
  if (_floorWhiteFallbackTex) return _floorWhiteFallbackTex;
  const data = new Uint8Array([255, 255, 255, 255]);
  const tex = new THREE.DataTexture(data, 1, 1);
  tex.needsUpdate = true;
  prepareSrgbMapForCustomShader(tex);
  _floorWhiteFallbackTex = tex;
  return tex;
}

function uploadFloorMapToGpu(map) {
  if (!map || !state.renderer?.initTexture) return;
  if (!mapGpuUploadReady(map)) return;
  try {
    state.renderer.initTexture(map);
  } catch (_) {}
}

function applyMapToIkeaV0Material(mat, map) {
  if (!mat?.uniforms) return;
  const isFloor = mat.userData?.__cldIkeaV0Kind === 'floor';
  const u = mat.uniforms;
  if (isFloor) {
    const bindFloorTex = (tex) => {
      if (tex?.isDataTexture) {
        prepareSrgbMapForCustomShader(tex);
        u.hasAlbedoMap.value = 1;
        u.albedoMap.value = tex;
        mat.map = tex;
        uploadFloorMapToGpu(tex);
        return;
      }
      configureFloorMapTexture(tex);
      const bound = mapGpuUploadReady(tex) ? tex : floorWhiteFallbackTex();
      u.hasAlbedoMap.value = 1;
      u.albedoMap.value = bound;
      mat.map = bound;
      uploadFloorMapToGpu(bound);
    };
  if (map && isTextureGpuUploadReady(map)) {
      bindFloorTex(map);
    return;
  }
    bindFloorTex(floorWhiteFallbackTex());
    if (!map) return;
    const img = map.image;
    const bindWhenReady = () => {
      if (!isTextureGpuUploadReady(map) || !mat.uniforms) return;
      bindFloorTex(map);
    };
    if (img && typeof img.addEventListener === 'function' && !map.userData.__cldIkeaV0MapLoadHook) {
      map.userData.__cldIkeaV0MapLoadHook = true;
      img.addEventListener('load', bindWhenReady, { once: true });
      img.addEventListener(
        'error',
        () => {
          if (!mat.uniforms) return;
          bindFloorTex(floorWhiteFallbackTex());
        },
        { once: true }
      );
    }
    if (isTextureGpuUploadReady(map)) bindWhenReady();
    return;
  }
  if (map && isTextureGpuUploadReady(map)) {
    if (!prepareAlbedoMapForGpuUpload(map)) {
      u.hasAlbedoMap.value = 0;
      u.albedoMap.value = null;
      mat.map = null;
      return;
    }
    u.hasAlbedoMap.value = 1;
    u.albedoMap.value = map;
    mat.map = map;
    uploadFloorMapToGpu(map);
    return;
  }
  u.hasAlbedoMap.value = 0;
  u.albedoMap.value = null;
  mat.map = null;
  if (!map) return;
  const img = map.image;
  if (img && typeof img.addEventListener === 'function' && !map.userData.__cldIkeaV0MapLoadHook) {
    map.userData.__cldIkeaV0MapLoadHook = true;
    const bindWhenReady = () => {
      if (!isTextureGpuUploadReady(map) || !mat.uniforms) return;
      if (!prepareAlbedoMapForGpuUpload(map)) return;
      mat.uniforms.hasAlbedoMap.value = 1;
      mat.uniforms.albedoMap.value = map;
      mat.map = map;
      uploadFloorMapToGpu(map);
    };
    img.addEventListener('load', bindWhenReady, { once: true });
    img.addEventListener(
      'error',
      () => {
        if (!mat.uniforms) return;
        mat.uniforms.hasAlbedoMap.value = 0;
        mat.uniforms.albedoMap.value = null;
        mat.map = null;
      },
      { once: true }
    );
  }
}

function syncOneIkeaV0MaterialUniforms(mat, mesh = null) {
  if (!mat?.userData?.__cldIkeaV0 || !mat.uniforms) return;
  const kind = mat.userData.__cldIkeaV0Kind;
  if (mesh && PANEL_EDGE_AO_KINDS.has(kind)) {
    ensurePanelEdgeAoHook(mesh);
    writePanelEdgeAoUniforms(mat, mesh);
  }
  const exp = exposureUniformValue();
  const cal = screenCalForKind(kind);
  if (mat.uniforms.exposure) mat.uniforms.exposure.value = exp;
  if (mat.uniforms.screenCal) mat.uniforms.screenCal.value = cal;
  if (mat.uniforms.betraktaOutputEnabled) {
    mat.uniforms.betraktaOutputEnabled.value = betraktaOutputUniformValue();
  }
  if (mat.uniforms.hdrFramebufferWrite) {
    mat.uniforms.hdrFramebufferWrite.value = 0;
  }
  if (mat.uniforms.spotEnabled) {
    mat.uniforms.spotEnabled.value =
      IKEA_V0_ACTIVE_PHASE >= 2 && !isKitchenDirMode() ? 1 : 0;
  }
  if (mat.uniforms.kitchenDirEnabled) {
    mat.uniforms.kitchenDirEnabled.value = isKitchenDirMode() ? 1 : 0;
  }
  if (mat.uniforms.kitchenDirWi) {
    mat.uniforms.kitchenDirWi.value.set(KITCHEN_DIR_WI.x, KITCHEN_DIR_WI.y, KITCHEN_DIR_WI.z);
  }
  if (mat.uniforms.kitchenDirColor) mat.uniforms.kitchenDirColor.value.set(1, 1, 1);
  if (mat.uniforms.kitchenDirIntensity) {
    mat.uniforms.kitchenDirIntensity.value = KITCHEN_DIR_INTENSITY;
  }
  if (mat.uniforms.spotPosM && _spotPosM) mat.uniforms.spotPosM.value.copy(_spotPosM);
  if (IKEA_V0_ACTIVE_PHASE >= 3) {
    if (mat.uniforms.softPlaneEnabled) {
      mat.uniforms.softPlaneEnabled.value = softPlaneEnabledForKind(kind);
    }
    if (mat.uniforms.softPlaneMap) mat.uniforms.softPlaneMap.value = _softState?.alphaTexture ?? null;
    if (mat.uniforms.softPlaneViewportM && _softFloorViewportM) {
      mat.uniforms.softPlaneViewportM.value.copy(_softFloorViewportM);
    } else if (mat.uniforms.softPlaneViewportM && _softViewportM) {
      mat.uniforms.softPlaneViewportM.value.copy(_softViewportM);
    }
    if (mat.uniforms.softPlaneFootprintM && _softFootprintM) {
      mat.uniforms.softPlaneFootprintM.value.copy(_softFootprintM);
    }
  }
  if (IKEA_V0_ACTIVE_PHASE >= 4) {
    if (mat.uniforms.blurredHeightmap) {
      mat.uniforms.blurredHeightmap.value = softAoHeightmapForKind(kind);
    }
    const vp = softAoViewportForKind(kind);
    if (mat.uniforms.blurredHeightmapViewportM && vp) {
      mat.uniforms.blurredHeightmapViewportM.value.copy(vp);
    }
    if (mat.uniforms.softAoEnabled) {
      mat.uniforms.softAoEnabled.value = ikeaV0SoftAoEnabledForMaterial(mat);
    }
  }
  applySpotShadowUniformsToMaterial(mat, mesh);
  applyWallConeUniformsToMaterial(mat);
  if (mat.uniforms.surfaceLinearScale) {
    mat.uniforms.surfaceLinearScale.value = surfaceLinearScaleForKind(kind);
  }
  if (IKEA_V0_ACTIVE_PHASE >= 5 && mat.uniforms.environmentMap) {
    const ready = _envSpecState?.ready && _envSpecState.cube;
    mat.uniforms.environmentMap.value = ready ? _envSpecState.cube : null;
    if (mat.uniforms.iblSpecEnabled) {
      mat.uniforms.iblSpecEnabled.value = iblSpecEnabledForKind(kind);
    }
    if (mat.uniforms.iblSpecSurfaceScale) {
      mat.uniforms.iblSpecSurfaceScale.value = iblSpecSurfaceScaleForKind(kind);
    }
    if (mat.uniforms.iblDiffuseSurfaceScale) {
      mat.uniforms.iblDiffuseSurfaceScale.value = iblDiffuseSurfaceScaleForKind(kind);
    }
  }
  if (mat.uniforms.inverseViewProjection) {
    mat.uniforms.inverseViewProjection.value.copy(_inverseViewProjection);
    mat.uniforms.inverseViewportSize.value.copy(_inverseViewportSize);
    if (mat.uniforms.cameraPosM && _cameraPosM) mat.uniforms.cameraPosM.value.copy(_cameraPosM);
  }
  if (mat.uniforms.debugSpotDisk) {
    mat.uniforms.debugSpotDisk.value = debugSpotDiskUniformValue();
  }
  if (mat.uniforms.spotAttGpuProbe) mat.uniforms.spotAttGpuProbe.value = 0;
  if (mat.uniforms.spotLinearGpuProbe) mat.uniforms.spotLinearGpuProbe.value = 0;
  if (mat.uniforms.floorTotalLinearGpuProbe) mat.uniforms.floorTotalLinearGpuProbe.value = 0;
  if (mat.uniforms.floorAlbedoGpuProbe) mat.uniforms.floorAlbedoGpuProbe.value = 0;
  if (kind === 'floor') ensureFloorIkeaMapBound(state.room);
}

function ikeaV0MaterialNeedsRebind(mat) {
  if (!mat?.userData?.__cldIkeaV0) return true;
  if (mat.userData.__cldIkeaV0ShaderRev !== IKEA_V0_SHADER_REV) return true;
  if (!mat.uniforms?.iblDiffuseSurfaceScale || !mat.uniforms?.surfaceLinearScale) return true;
  if (!mat.uniforms?.debugSpotDisk) return true;
  if (!mat.uniforms?.panelEdgeAoEnabled) return true;
  if (!mat.uniforms?.spotAttGpuProbe || !mat.uniforms?.spotLinearGpuProbe) return true;
  if (!mat.uniforms?.floorTotalLinearGpuProbe) return true;
  if (!mat.uniforms?.floorAlbedoGpuProbe) return true;
  if (!mat.uniforms?.albedoMap || !mat.uniforms?.hasAlbedoMap) return true;
  if (!mat.uniforms?.kitchenDirEnabled || !mat.uniforms?.kitchenDirWi) return true;
  return false;
}

/** Floor always samples albedoMap in shader — bind herringbone or 1×1 white fallback. */
function ensureFloorIkeaMapBound(room = state.room) {
  const mat = room?.floorCoating?.material;
  const u = mat?.uniforms;
  if (!mat?.userData?.__cldIkeaV0 || !u?.albedoMap) return { ok: false };
  const tex = room?.floorTexture || u.albedoMap.value || mat.map || null;
  if (!tex) return { ok: false };
  const gpuReady = mapGpuUploadReady(tex);
  if (gpuReady && u.albedoMap.value === tex && (u.hasAlbedoMap?.value ?? 0) > 0.5) {
    return { ok: true, hasAlbedoMap: u.hasAlbedoMap.value, reused: true };
  }
  applyMapToIkeaV0Material(mat, tex);
  return {
    ok: mapGpuUploadReady(tex) && (u.hasAlbedoMap?.value ?? 0) > 0.5,
    hasAlbedoMap: u.hasAlbedoMap?.value ?? null,
    reused: false,
  };
}

function createIkeaV0Material(kind, opts = {}) {
  const sh = _shUniform || shUniformFromDump();
  const uniforms = {
    diffuse: { value: diffuseFromBindOpts(kind, opts) },
    roughness: {
      value: opts.roughness != null ? opts.roughness : roughnessForKind(kind),
    },
    metalness: { value: metalnessForKind(kind, opts) },
    envMapIntensity: { value: ENV_INTENSITY },
    exposure: { value: exposureUniformValue() },
    screenCal: { value: screenCalForKind(kind) },
    betraktaOutputEnabled: { value: betraktaOutputUniformValue() },
    hdrFramebufferWrite: { value: 0 },
    hasAlbedoMap: { value: 0 },
    albedoMap: { value: null },
    envRot: { value: _envRot || envRotMat3Y(ENV_ROT_DEG) },
    shCoeffs: { value: sh },
    ...spotUniforms(),
    ...softPlaneUniforms(kind),
    ...softAoUniforms(kind),
    ...cameraUniforms(),
    ...iblSpecUniforms(kind),
    ...spotShadowUniforms({ ...opts, kind }),
    ...cavityOcclusionUniforms(),
    ...wallConeUniforms(kind),
    ...wallPlasterUniforms(kind),
    ...floorMapUniforms(kind),
    debugSpotDisk: { value: debugSpotDiskUniformValue() },
    spotAttGpuProbe: { value: 0 },
    spotLinearGpuProbe: { value: 0 },
    floorTotalLinearGpuProbe: { value: 0 },
    floorAlbedoGpuProbe: { value: 0 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    extensions: { derivatives: true },
    glslVersion: THREE.GLSL3,
    side: opts.side ?? THREE.FrontSide,
    polygonOffset: !!opts.polygonOffset,
    polygonOffsetFactor: opts.polygonOffsetFactor ?? 0,
    polygonOffsetUnits: opts.polygonOffsetUnits ?? 0,
  });
  mat.userData.__cldIkeaV0 = true;
  mat.userData.__cldIkeaV0Kind = kind;
  mat.userData.__cldIkeaV0Phase = IKEA_V0_ACTIVE_PHASE;
  mat.userData.__cldIkeaV0Cabinet = !!opts.cabinet;
  mat.userData.__cldCabinetHardware = !!opts.cabinetHardware;
  mat.userData.__cldIkeaV0ShaderRev = IKEA_V0_SHADER_REV;
  if (opts.map) applyMapToIkeaV0Material(mat, opts.map);
  if (kind === 'floor' && state.room) ensureFloorIkeaMapBound(state.room);
  return mat;
}

/** Phase 7 — мебель / обклад: тот же ikea v0 shader + layer 2 (soft casters). */
export function ikeaV0BindOptsFromMaterial(material, kind) {
  const m = Array.isArray(material) ? material[0] : material;
  if (!m) return {};
  if (m.userData?.__cldIkeaV0 && m.uniforms) {
    return {
      side: m.side ?? THREE.FrontSide,
      diffuseLinear: m.uniforms.diffuse.value.clone(),
      map: m.uniforms.hasAlbedoMap?.value > 0.5 ? m.uniforms.albedoMap.value : null,
      roughness: m.uniforms.roughness?.value,
    };
  }
  const opts = { side: m.side ?? THREE.FrontSide };
  /** Interior view of open cabinet: corpus/back faces camera as backfaces if FrontSide. */
  if (kind === 'facade' || kind === 'trim' || kind === 'corpus' || kind === 'back') {
    opts.side = THREE.DoubleSide;
  }
  if (m.map) opts.map = m.map;
  else if (m.color?.isColor) opts.color = m.color.clone();
  if (m.roughness != null && Number.isFinite(Number(m.roughness))) {
    opts.roughness = Math.max(0, Math.min(1, Number(m.roughness)));
  }
  if (m.metalness != null && Number.isFinite(Number(m.metalness))) {
    opts.metalness = Math.max(0, Math.min(1, Number(m.metalness)));
  }
  return opts;
}

/** model_key_material → bind opts (цвет/roughness/metalness с карточки админки). */
export function ikeaV0BindOptsFromCatalogParams(params) {
  if (!params || typeof params !== 'object') return {};
  const opts = {};
  if (params.color) {
    try {
      opts.color = new THREE.Color(params.color);
    } catch (_) {}
  }
  if (params.roughness != null && Number.isFinite(Number(params.roughness))) {
    opts.roughness = Math.max(0, Math.min(1, Number(params.roughness)));
  }
  if (params.metalness != null && Number.isFinite(Number(params.metalness))) {
    opts.metalness = Math.max(0, Math.min(1, Number(params.metalness)));
  }
  return opts;
}

/** Phase 7b — кромка ← core: те же diffuse/map/roughness (IKEA 010_White faces). */
export function copyIkeaV0VisualFromCoreToEdge(edgeMesh, coreMesh, kind = 'corpus') {
  if (!edgeMesh?.isMesh || !coreMesh?.isMesh || !coreMesh.material) return false;
  const opts = ikeaV0BindOptsFromMaterial(coreMesh.material, kind);
  opts.side = THREE.DoubleSide;
  if (opts.roughness == null) opts.roughness = roughnessForKind(kind);
  const ok = bindMeshToIkeaV0(edgeMesh, kind, opts);
  if (ok) {
    edgeMesh.userData.cldClonedBodyMaterial = true;
    edgeMesh.userData.cldCorpusBodyEdge = true;
  }
  return ok;
}

/** Шаг 5: декор на уже привязанный ikea v0 (ShaderMaterial — не MeshStandard.color). */
export function applyIkeaV0MeshDecorFromStep5(material, opts = {}) {
  const m = Array.isArray(material) ? material[0] : material;
  if (!m?.userData?.__cldIkeaV0 || !m.uniforms) return false;
  const { colorHex, previewHex, map, roughness, metalness } = opts;
  const kind = m.userData.__cldIkeaV0Kind;
  /** White fixture = dump albedo (010_White / 003_Backside). Textured / цветной шаг 5 не трогаем. */
  if (BUILDER_WHITE_DUMP_PANEL_KINDS.has(kind) && !map) {
    const hex = colorHex || previewHex;
    if (!hex || isBuilderFlatWhiteHex(hex)) {
      applyMapToIkeaV0Material(m, null);
      m.uniforms.diffuse.value.copy(linearAlbedoFromSot(kind));
      if (roughness != null && m.uniforms.roughness) m.uniforms.roughness.value = roughness;
      if (metalness != null && m.uniforms.metalness) m.uniforms.metalness.value = metalness;
      m.userData.__cldIkeaV0Step5Decor = true;
      syncOneIkeaV0MaterialUniforms(m);
      return true;
    }
  }
  if (map) {
    applyMapToIkeaV0Material(m, map);
    if (BUILDER_WHITE_DUMP_PANEL_KINDS.has(kind) && isBuilderFlatWhiteHex(colorHex || '#ffffff')) {
      m.uniforms.diffuse.value.copy(linearAlbedoFromSot(kind));
    } else {
      const c = new THREE.Color(colorHex || '#ffffff');
      c.convertSRGBToLinear();
      m.uniforms.diffuse.value.set(c.r, c.g, c.b);
    }
  } else {
    const hex = colorHex || previewHex;
    if (hex) {
      applyMapToIkeaV0Material(m, null);
      if (BUILDER_WHITE_DUMP_PANEL_KINDS.has(kind) && isBuilderFlatWhiteHex(hex)) {
        m.uniforms.diffuse.value.copy(linearAlbedoFromSot(kind));
      } else {
        const c = new THREE.Color(hex);
        c.convertSRGBToLinear();
        m.uniforms.diffuse.value.set(c.r, c.g, c.b);
      }
    }
  }
  if (roughness != null && m.uniforms.roughness) m.uniforms.roughness.value = roughness;
  if (metalness != null && m.uniforms.metalness) m.uniforms.metalness.value = metalness;
  m.userData.__cldIkeaV0Step5Decor = true;
  syncOneIkeaV0MaterialUniforms(m);
  return true;
}

const __cldCatalogMapPromises = new Map();

function resolveCatalogMapUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  if (raw.startsWith('/')) return raw;
  return '/' + raw.replace(/^\.?\//, '');
}

function loadCatalogAlbedoMapOnce(url) {
  const u = resolveCatalogMapUrl(url);
  if (!u) return Promise.resolve(null);
  if (__cldCatalogMapPromises.has(u)) return __cldCatalogMapPromises.get(u);
  const p = new Promise((resolve) => {
    try {
      const loader = new THREE.TextureLoader();
      loader.load(
        u,
        (tex) => {
          try {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.needsUpdate = true;
          } catch (_) {}
          resolve(tex);
        },
        undefined,
        () => resolve(null),
      );
    } catch (_) {
      resolve(null);
    }
  });
  __cldCatalogMapPromises.set(u, p);
  return p;
}

/** Фурнитура: catalog model_key_material → ikea v0 uniforms (как step5 для корпуса). */
export function applyIkeaV0CatalogMaterialToMesh(mesh, params, _kind) {
  if (!mesh?.isMesh || !params) return false;
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const m0 = mats[0];
  const mapFromStd = m0?.map && !m0?.userData?.__cldIkeaV0 ? m0.map : null;
  const mapFromIkea =
    m0?.userData?.__cldIkeaV0 && m0.uniforms?.hasAlbedoMap?.value > 0.5
      ? m0.uniforms.albedoMap.value
      : null;
  const mapFromParamTex = params.map?.isTexture ? params.map : null;
  const mapUrl =
    typeof params.map === 'string' && params.map.trim() && !params.map?.isTexture
      ? String(params.map).trim()
      : '';
  let map = mapFromIkea || mapFromStd || mapFromParamTex || null;
  const colorHex = params.color ? String(params.color).trim() : null;
  const roughness =
    params.roughness != null && Number.isFinite(Number(params.roughness))
      ? Math.max(0, Math.min(1, Number(params.roughness)))
      : undefined;
  const metalness =
    params.metalness != null && Number.isFinite(Number(params.metalness))
      ? Math.max(0, Math.min(1, Number(params.metalness)))
      : undefined;

  const paint = (resolvedMap) => {
    let ok = false;
    for (const m of mats) {
      if (!m?.userData?.__cldIkeaV0) continue;
      if (
        applyIkeaV0MeshDecorFromStep5(m, {
          colorHex: colorHex || (resolvedMap ? '#ffffff' : undefined),
          map: resolvedMap,
          roughness,
          metalness,
        })
      ) {
        m.userData.__cldIkeaV0CatalogMaterial = true;
        ok = true;
      }
    }
    return ok;
  };

  if (!map && mapUrl) {
    // Сначала цвет с карточки (не GLB-оранжевый), карту — когда догрузится.
    const painted = paint(null);
    loadCatalogAlbedoMapOnce(mapUrl).then((tex) => {
      if (!tex || !mesh?.material) return;
      paint(tex);
    });
    return painted;
  }
  return paint(map);
}

export function applyIkeaV0MeshDecorFromStep5ToMesh(mesh, opts = {}) {
  if (!mesh?.isMesh || !mesh.material) return false;
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  let ok = false;
  for (const m of mats) {
    if (applyIkeaV0MeshDecorFromStep5(m, opts)) ok = true;
  }
  return ok;
}

/** Корпус/фасад/обклад — декор шага 5 в uniforms; re-bind не сбрасывает (как IKEA BetraktaPBR). */
const IKEA_V0_DECOR_KINDS = new Set(['corpus', 'facade', 'trim', 'back']);
/** Петли/направляющие/ручки GLB — цвет с model_key_material; re-bind не сбрасывает. */
const IKEA_V0_HARDWARE_KINDS = new Set(['metal', 'plastic', 'rubber']);

/** Layer 0 = camera. Layer 2 = floor+AO corpus. Layer 5 = trim floor only. */
function applySoftCasterLayers(mesh, opts) {
  mesh.layers.enable(0);
  if (opts.softCaster === false) mesh.layers.disable(SOFT_LAYER);
  else mesh.layers.enable(SOFT_LAYER);
  if (opts.softAoSilhouette) mesh.layers.enable(SOFT_AO_SILHOUETTE_LAYER);
  else mesh.layers.disable(SOFT_AO_SILHOUETTE_LAYER);
  if (opts.softFloorCaster) mesh.layers.enable(SOFT_FLOOR_LAYER);
  else mesh.layers.disable(SOFT_FLOOR_LAYER);
}

export function bindMeshToIkeaV0(mesh, kind, opts = {}) {
  if (!mesh?.isMesh || !kind || IKEA_V0_ACTIVE_PHASE < 1) return false;

  const old = mesh.material;
  /** Open-cabinet view: бок/зад normals face out — FrontSide culls the inner plast. */
  const side =
    kind === 'corpus' || kind === 'back' || kind === 'facade' || kind === 'trim'
      ? THREE.DoubleSide
      : opts.side ?? old?.side ?? THREE.FrontSide;
  const bindOpts = {
    ...opts,
    side,
    cabinet: true,
    polygonOffset: old?.polygonOffset,
    polygonOffsetFactor: old?.polygonOffsetFactor,
    polygonOffsetUnits: old?.polygonOffsetUnits,
  };

  if (old?.userData?.__cldIkeaV0 && old.userData.__cldIkeaV0Kind === kind && !ikeaV0MaterialNeedsRebind(old)) {
    const hasExplicitVisual =
      bindOpts.diffuseLinear?.isVector3 ||
      bindOpts.color?.isColor ||
      bindOpts.map !== undefined ||
      bindOpts.forceVisual === true;
    const corpusWhiteNoMap =
      kind === 'corpus' &&
      !(old.uniforms.hasAlbedoMap?.value > 0.5) &&
      old.uniforms.diffuse?.value &&
      isBuilderFlatWhiteRgb(
        old.uniforms.diffuse.value.x,
        old.uniforms.diffuse.value.y,
        old.uniforms.diffuse.value.z
      );
    const preserveStep5Decor =
      IKEA_V0_DECOR_KINDS.has(kind) &&
      !!old.userData?.__cldIkeaV0Step5Decor &&
      !hasExplicitVisual &&
      !corpusWhiteNoMap;
    const preserveCatalogHardware =
      IKEA_V0_HARDWARE_KINDS.has(kind) &&
      !!old.userData?.__cldIkeaV0CatalogMaterial &&
      !hasExplicitVisual;
    if (!preserveStep5Decor && !preserveCatalogHardware) {
      old.uniforms.diffuse.value.copy(diffuseFromBindOpts(kind, bindOpts));
      if (old.uniforms.roughness) {
        old.uniforms.roughness.value =
          bindOpts.roughness != null ? bindOpts.roughness : roughnessForKind(kind);
      }
      if (old.uniforms.metalness) {
        old.uniforms.metalness.value =
          bindOpts.metalness != null ? bindOpts.metalness : metalnessForKind(kind, bindOpts);
      }
      if (bindOpts.map !== undefined) {
        applyMapToIkeaV0Material(old, bindOpts.map);
      }
    }
    syncOneIkeaV0MaterialUniforms(old, mesh);
    old.side = side;
    applySoftCasterLayers(mesh, bindOpts);
    applySpotShadowCasterLayers(mesh, kind);
    invalidateIkeaV0CamUniformMatCache();
    return true;
  }

  const mat = createIkeaV0Material(kind, bindOpts);
  if (bindOpts.roughness != null && mat.uniforms?.roughness) {
    mat.uniforms.roughness.value = bindOpts.roughness;
  }
  if (bindOpts.metalness != null && mat.uniforms?.metalness) {
    mat.uniforms.metalness.value = bindOpts.metalness;
  }
  mesh.material = mat;
  if (old && old !== mat && !old.userData?.__cldIkeaV0) old.dispose?.();
  applySoftCasterLayers(mesh, bindOpts);
  applySpotShadowCasterLayers(mesh, kind);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  syncOneIkeaV0MaterialUniforms(mat, mesh);
  invalidateIkeaV0CamUniformMatCache();
  return true;
}

export function syncIkeaV0MaterialsUnderRoot(root) {
  if (!root) return 0;
  let n = 0;
  root.traverse((o) => {
    if (!o.isMesh || !o.material?.userData?.__cldIkeaV0) return;
    syncOneIkeaV0MaterialUniforms(o.material, o);
    n += 1;
  });
  return n;
}

function detectRoomMeshKind(mesh, room) {
  if (!mesh?.isMesh || !room) return null;
  if (mesh === room.floorCoating) return 'floor';
  if (mesh === room.floorBase) return 'floorSlab';
  if (mesh === room.walls?.ceiling || mesh.userData?.isCeiling) return 'ceiling';
  // скошенный потолок — тот же wall-шейдер (штукатурка + spot), не frame/plan-flat
  if (mesh.userData?.isKitchenCeilingSlope || mesh.userData?.isKitchenCeilingSlopePart) {
    return 'wall';
  }
  const inners = room.wallInners || {};
  if (Object.values(inners).includes(mesh)) return 'wall';
  const frames = room.walls || {};
  if (Object.values(frames).includes(mesh)) return 'frame';
  const coatMap = room.floorCoating?.material?.map;
  if (coatMap && mesh.material?.map === coatMap) return 'floor';
  return null;
}

function bindRoomMesh(mesh, room) {
  const kind = detectRoomMeshKind(mesh, room);
  if (!kind) return false;
  // Плоские стены полигона на плане (IKEA-контур) — без v0 frame-шейдера
  // (скос потолка — исключение: ему нужен wall-шейдер)
  if (
    !mesh.userData?.isKitchenCeilingSlope &&
    !mesh.userData?.isKitchenCeilingSlopePart &&
    (mesh.userData?.cldPlanFlatWall || mesh.userData?.isPolygonWallStrip)
  ) {
    return false;
  }

  const old = mesh.material;
  if (old?.userData?.__cldIkeaV0 && !ikeaV0MaterialNeedsRebind(old)) {
    syncOneIkeaV0MaterialUniforms(old, mesh);
    return false;
  }

  const side = old?.side ?? THREE.FrontSide;
  const opts = {
    side,
    polygonOffset: old?.polygonOffset,
    polygonOffsetFactor: old?.polygonOffsetFactor,
    polygonOffsetUnits: old?.polygonOffsetUnits,
  };

  if (kind === 'floor') {
    const srcMap = old?.map || room.floorTexture || null;
    if (srcMap && isTextureGpuUploadReady(srcMap)) {
      configureFloorMapTexture(srcMap);
      opts.map = srcMap;
    }
    if (srcMap && room) room.floorTexture = srcMap;
  }

  const mat = createIkeaV0Material(kind, opts);
  if (kind === 'floor') {
    applyMapToIkeaV0Material(mat, room.floorTexture || old?.map || null);
  }
  mesh.material = mat;
  if (old && old !== mat) old.dispose?.();
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return true;
}

function bindRoomGroup(room) {
  if (!room?.group) return 0;
  let n = 0;
  room.group.traverse((o) => {
    if (bindRoomMesh(o, room)) n += 1;
  });
  invalidateIkeaV0CamUniformMatCache();
  return n;
}

function syncExposureUniformsOnScene() {
  if (!state.scene) return;
  const exp = exposureUniformValue();
  const outOn = betraktaOutputUniformValue();
  state.scene.traverse((o) => {
    if (!o.isMesh || !o.material?.userData?.__cldIkeaV0) return;
    const u = o.material.uniforms;
    if (u?.exposure) u.exposure.value = exp;
    if (u?.screenCal) {
      u.screenCal.value = screenCalForKind(o.material.userData.__cldIkeaV0Kind);
    }
    if (u?.betraktaOutputEnabled) u.betraktaOutputEnabled.value = outOn;
    if (u?.hdrFramebufferWrite) u.hdrFramebufferWrite.value = 0;
  });
}

function syncSpotUniformsOnScene() {
  const scene = state.scene;
  const room = state.room;
  if (!scene || !room?.group) return;
  _spotPosWorldMm = resolveSpotPositionWorldMm(room);
  _spotPosM = _spotPosWorldMm.clone().multiplyScalar(MM_TO_M);
  const dir = currentSpotDir();
  const spotOn = IKEA_V0_ACTIVE_PHASE >= 2 && !isKitchenDirMode() ? 1 : 0;
  const kitchenOn = isKitchenDirMode() ? 1 : 0;
  const color = SOT.spot.colorLineAndRange;
  scene.traverse((o) => {
    if (!o.isMesh || !o.material?.userData?.__cldIkeaV0) return;
    const u = o.material.uniforms;
    if (u?.spotPosM) u.spotPosM.value.copy(_spotPosM);
    if (u?.spotEnabled) u.spotEnabled.value = spotOn;
    if (u?.spotDir) u.spotDir.value.set(dir.x, dir.y, dir.z).normalize();
    if (u?.spotColorUbo) u.spotColorUbo.value.set(color[0], color[1], color[2]);
    if (u?.spotCosInner) u.spotCosInner.value = SOT.spot.innerCos;
    if (u?.spotCosOuter) u.spotCosOuter.value = SOT.spot.outerCos;
    if (u?.spotWallScale) u.spotWallScale.value = SOT.spot.wallScale ?? 1;
    if (u?.spotWallMinDist2) u.spotWallMinDist2.value = SOT.spot.wallMinDist2_m2 ?? 0;
    if (u?.kitchenDirEnabled) u.kitchenDirEnabled.value = kitchenOn;
    if (u?.kitchenDirWi) {
      u.kitchenDirWi.value.set(KITCHEN_DIR_WI.x, KITCHEN_DIR_WI.y, KITCHEN_DIR_WI.z);
    }
    if (u?.kitchenDirColor) u.kitchenDirColor.value.set(1, 1, 1);
    if (u?.kitchenDirIntensity) u.kitchenDirIntensity.value = KITCHEN_DIR_INTENSITY;
  });
}

export async function loadIkeaRoomEnvV0() {
  if (!state.scene) return;
  _envRot = envRotMat3Y(ENV_ROT_DEG);
  _shUniform = shUniformFromDump();
  state.roomEnvIntensity = ENV_INTENSITY;
  if (state.scene.environment) {
    state.scene.environment.dispose?.();
    state.scene.environment = null;
  }
  if ('environmentIntensity' in state.scene) state.scene.environmentIntensity = 0;
  if (IKEA_V0_ACTIVE_PHASE >= 5) {
    await loadIkeaEnvSpecCube();
  }
}

export function installIkeaRoomLightV0() {
  if (IKEA_V0_ACTIVE_PHASE < 1) return { bound: 0, phase: IKEA_V0_ACTIVE_PHASE };
  const room = state.room;
  if (!room) return { bound: 0, phase: IKEA_V0_ACTIVE_PHASE };

  if (!_shUniform) _shUniform = shUniformFromDump();
  if (!_envRot) _envRot = envRotMat3Y(ENV_ROT_DEG);
  _spotPosWorldMm = resolveSpotPositionWorldMm(room);
  _spotPosM = _spotPosWorldMm.clone().multiplyScalar(MM_TO_M);

  if (IKEA_V0_ACTIVE_PHASE >= 3 && state.renderer) {
    initSoftPlanePipeline(state.renderer);
    const vpWall = resolveSoftViewportForWallAo(state.scene);
    applySoftViewport(vpWall.centerXmm, vpWall.centerZmm, vpWall.sizeXm, vpWall.sizeZm);
    _softViewportMeta = vpWall;
  }
  if (IKEA_V0_ACTIVE_PHASE >= 7 && state.renderer) {
    getFallbackSpotShadowDepth(state.renderer);
    initSpotShadowPipeline(state.renderer);
  }
  if (IKEA_V0_ACTIVE_PHASE >= 6 && state.renderer) {
    initIkeaHdrDisplayPipeline(state.renderer);
  }

  const bound = bindRoomGroup(room);
  resyncIkeaRoomFloorMap(room);
  _bound = bound > 0;
  syncSpotUniformsOnScene();
  syncWallConeUniformsOnScene();
  loadWallNormalTexture();
  if (IKEA_V0_ACTIVE_PHASE >= 7 && state.renderer) {
    syncSpotShadowUniformsOnScene();
  }
  if (bound > 0 && state.scene) {
    state.scene.traverse((o) => {
      if (o.isMesh && o.material?.userData?.__cldIkeaV0) {
        syncOneIkeaV0MaterialUniforms(o.material, o);
      }
    });
  }
  if (IKEA_V0_ACTIVE_PHASE >= 3) {
    updateSoftPlanePipeline();
    syncSoftUniformsOnScene();
  }

  if (state.renderer) state.renderer.setClearColor(SOT.canvasClearHex, 1);
  /** Dump: scene.background = null; surround = clear #F2F2F0 only. */
  if (state.scene) state.scene.background = null;

  maybeInitSpotDiskDebugFromUrl();

  const expZ = expectedSpotWorldZMm(room);
  console.log(
    `[IKEA v0] phase ${IKEA_V0_ACTIVE_PHASE} bind · meshes=${bound} · spot world mm`,
    _spotPosWorldMm.toArray().map((v) => Math.round(v)),
    `· spotM`,
    _spotPosM.toArray().map((v) => +v.toFixed(3)),
    `(expect world Z≈${Math.round(expZ)}; local Z=${m2mm(SOT.spot.defaultPos_m.z)} from back wall)`
  );
  return {
    bound,
    phase: IKEA_V0_ACTIVE_PHASE,
    spotPosWorldMm: _spotPosWorldMm.toArray(),
    spotPosM: _spotPosM.toArray(),
  };
}

export function syncIkeaRoomLightV0() {
  if (!state.scene || IKEA_V0_ACTIVE_PHASE < 1) return;
  if (state._cldPauseLifestyleGpu) return;
  if (isWebGlContextLost(state.renderer)) {
    state._webglContextLost = true;
    return;
  }
  /** Orbit/pan: only view uniforms. Spot atlas / Soft / cavity are world-fixed — mid-drag
   *  traverses + depth depth caused cabinet-room stutter (r3j81). */
  if (state.isRotating || state.isPanning) return;

  syncCameraUniformsOnScene();

  syncSpotUniformsOnScene();
  syncExposureUniformsOnScene();
  syncWallConeUniformsOnScene();
  ensureFloorIkeaMapBound(state.room);
  if (IKEA_V0_ACTIVE_PHASE >= 7) syncSpotShadowUniformsOnScene();
  if (IKEA_V0_ACTIVE_PHASE >= 4) syncCabinetCavityOcclusionOnScene();
  if (IKEA_V0_ACTIVE_PHASE >= 3) {
    try {
      updateSoftPlanePipeline();
      syncSoftUniformsOnScene();
    } catch (e) {
      if (isWebGlContextLost(state.renderer)) state._webglContextLost = true;
      if (!syncIkeaRoomLightV0._softAbortLogged) {
        syncIkeaRoomLightV0._softAbortLogged = true;
        console.warn('[IKEA v0] soft sync aborted', e?.message || e);
      }
    }
  }
  syncDebugSpotDiskOnScene();
}

export function auditIkeaV0MaterialState() {
  const scene = state.scene;
  if (!scene) return { ok: false, reason: 'no scene' };
  let ikea = 0;
  let ikeaCabinet = 0;
  let basic = 0;
  let spotOn = 0;
  scene.traverse((o) => {
    if (!o.isMesh || !o.material || o.visible === false) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m) => {
      if (m.visible === false) return;
      if (m.userData?.__cldIkeaV0) {
        ikea += 1;
        if (m.userData.__cldIkeaV0Cabinet) ikeaCabinet += 1;
        if (m.uniforms?.spotEnabled?.value > 0) spotOn += 1;
      } else if (m.isMeshBasicMaterial) basic += 1;
    });
  });
  const lights = [];
  scene.traverse((o) => {
    if (o.isLight) lights.push(o.type);
  });
  const room = state.room;
  const expZ = room ? expectedSpotWorldZMm(room) : null;
  const spotZ = _spotPosWorldMm?.z ?? null;
  const spotZOk =
    expZ == null || spotZ == null ? null : Math.abs(spotZ - expZ) < 2;
  const spotOk = IKEA_V0_ACTIVE_PHASE < 2 ? spotOn === 0 : spotOn === ikea && ikea > 0;
  const softOk =
    IKEA_V0_ACTIVE_PHASE < 3 ||
    (_softState?.ready && _softState.alphaTexture != null);
  let softAoRoom = 0;
  let ikeaRoom = 0;
  if (IKEA_V0_ACTIVE_PHASE >= 4) {
    scene.traverse((o) => {
      if (!o.isMesh || !o.material?.userData?.__cldIkeaV0) return;
      if (o.material.userData.__cldIkeaV0Cabinet) return;
      const kind = o.material.userData.__cldIkeaV0Kind;
      if (kind !== 'wall' && kind !== 'frame' && kind !== 'ceiling') return;
      ikeaRoom += 1;
      if (o.material.uniforms?.softAoEnabled?.value > 0) softAoRoom += 1;
    });
  }
  const softAoOk =
    IKEA_V0_ACTIVE_PHASE < 4 ||
    _debugSoftAoOff ||
    (softAoRoom === ikeaRoom && ikeaRoom > 0 && _softState?.heightMapTexture);
  const iblSpecOk = IKEA_V0_ACTIVE_PHASE < 5 || !!(_envSpecState?.ready && _envSpecState.cube);
  let floorIbl = null;
  let wallIbl = null;
  let ceilingIbl = null;
  if (IKEA_V0_ACTIVE_PHASE >= 5 && room) {
    const fu = room.floorCoating?.material?.uniforms;
    floorIbl = fu?.iblSpecEnabled?.value ?? null;
    const wi = Object.values(room.wallInners || {}).find((m) => m?.material?.userData?.__cldIkeaV0);
    wallIbl = wi?.material?.uniforms?.iblSpecEnabled?.value ?? null;
    const cu = room.walls?.ceiling?.material?.uniforms;
    ceilingIbl = cu?.iblSpecEnabled?.value ?? null;
  }
  const floorIblOk =
    IKEA_V0_ACTIVE_PHASE < 5 ||
    (floorIbl === 0 && ceilingIbl === 0 && wallIbl === 1);
  const exposureOk =
    IKEA_V0_ACTIVE_PHASE < 6 ||
    (exposureUniformValue() === EXPOSURE_POST &&
      betraktaOutputUniformValue() === 1 &&
      (isIkeaHdrDisplayActive()
        ? screenCalUniformValue() === SCREEN_CAL_EMPTY
        : screenCalUniformValue() === SCREEN_CAL_EMPTY));
  return {
    ok: ikea > 0 && spotOk && spotZOk !== false && lights.length === 0 && softOk && softAoOk && iblSpecOk && floorIblOk && exposureOk,
    phase: IKEA_V0_ACTIVE_PHASE,
    ikeaMaterials: ikea,
    ikeaCabinetMaterials: ikeaCabinet,
    meshBasicLeft: basic,
    spotEnabledCount: spotOn,
    lights,
    envIntensity: ENV_INTENSITY,
    exposure: exposureUniformValue(),
    exposurePost: EXPOSURE_POST,
    screenCalEmpty: screenCalUniformValue(),
    betraktaOutput: betraktaOutputUniformValue() > 0,
    hdrFloatFb: isIkeaHdrDisplayActive(),
    perPixelWo: true,
    spotPosWorldMm: _spotPosWorldMm?.toArray?.() ?? null,
    spotPosM: _spotPosM?.toArray?.() ?? null,
    spotWorldZExpectedMm: expZ,
    spotWorldZOk: spotZOk,
    softPlaneReady: _softState?.ready ?? false,
    softCasterCount: _softState?.lastCasterCount ?? null,
    softViewportM: _softViewportM?.toArray?.() ?? null,
    softAoEnabledCount: IKEA_V0_ACTIVE_PHASE >= 4 ? softAoRoom : null,
    softAoRoomMaterials: IKEA_V0_ACTIVE_PHASE >= 4 ? ikeaRoom : null,
    heightMapReady: !!_softState?.heightMapTexture,
    wallConeCount: 0,
    wallConeFrozen: true,
    spotShadowReady: !!(_spotShadowState?.mapTexture && IKEA_V0_ACTIVE_PHASE >= 7),
    spotShadowMapSize: IKEA_V0_ACTIVE_PHASE >= 7 ? SPOT_SHADOW_MAP_SIZE : null,
    iblSpecReady: !!(_envSpecState?.ready && _envSpecState.cube),
    iblSpecError: _envSpecState?.error ?? null,
    floorIblEnabled: floorIbl,
    wallIblEnabled: wallIbl,
    ceilingIblEnabled: ceilingIbl,
    floorIblOk,
  };
}

/** Probe getLightData at room center (meters) — сверка ld2/units в Console. */
export function probeIkeaV0SpotAttenuation() {
  const room = state.room;
  if (!room || !_spotPosM) return { ok: false, reason: 'no room or spot' };
  const spot = _spotPosM;
  const albedo = SOT.wall.linear[0];
  const color = SOT.spot.colorLineAndRange[0];
  const outer = SOT.spot.outerCos;
  const inner = SOT.spot.innerCos;
  const dir = currentSpotDir();

  function evalAt(label, pointM, normal) {
    const lx = spot.x - pointM.x;
    const ly = spot.y - pointM.y;
    const lz = spot.z - pointM.z;
    const ld2 = lx * lx + ly * ly + lz * lz;
    const d = Math.sqrt(ld2);
    const Lx = lx / d;
    const Ly = ly / d;
    const Lz = lz / d;
    const cosAxis = -(dir.x * Lx + dir.y * Ly + dir.z * Lz);
    const t = Math.max(0, Math.min(1, (cosAxis - outer) / (inner - outer)));
    const cone = t * t * (3 - 2 * t);
    const ndotl = Math.max(0, normal.x * Lx + normal.y * Ly + normal.z * Lz);
    const att = (ndotl * cone) / ld2;
    const spotLin = color * att * (albedo / Math.PI);
    return { label, ld2: +ld2.toFixed(3), att: +att.toFixed(4), spotLinear: +spotLin.toFixed(3) };
  }

  return {
    ok: true,
    spotPosM: spot.toArray(),
    spotPosWorldMm: _spotPosWorldMm.toArray(),
    expectedWorldZMm: expectedSpotWorldZMm(room),
    samples: [
      evalAt('back_wall_center', { x: 0, y: 1.25, z: -2 }, { x: 0, y: 0, z: 1 }),
      evalAt('left_wall_front', { x: -2.5, y: 1.25, z: 2 }, { x: 1, y: 0, z: 0 }),
    ],
    note: 'wrong_z probe uses spot at (0,5,2) vs correct (0,5,0) — side blowout if Z=local',
    wrongSpotZ2: (() => {
      const spotWrong = { x: 0, y: 5, z: 2 };
      const lx = spotWrong.x - -2.5;
      const ly = spotWrong.y - 1.25;
      const lz = spotWrong.z - 2;
      const ld2 = lx * lx + ly * ly + lz * lz;
      const d = Math.sqrt(ld2);
      const Lx = lx / d;
      const Ly = ly / d;
      const Lz = lz / d;
      const cosAxis = -(dir.y * Ly);
      const t = Math.max(0, Math.min(1, (cosAxis - outer) / (inner - outer)));
      const cone = t * t * (3 - 2 * t);
      const ndotl = Math.max(0, Lx);
      return { ld2: +ld2.toFixed(3), spotLinear: +(color * (ndotl * cone) / ld2 * (albedo / Math.PI)).toFixed(3) };
    })(),
  };
}

/** Eye-level pipette — raycast picks wall axis (p8z145: wallSide was back wall → Δ~0). */
const _PIPETTE_PICK_SPECS = Object.freeze({
  wallMid: Object.freeze({ pxn: 0.5, pyn: 0.42, preferKind: 'wall', preferWallAxis: 'z' }),
  wallBackLow: Object.freeze({ pxn: 0.5, pyn: 0.55, preferKind: 'wall', preferWallAxis: 'z' }),
  wallSide: Object.freeze({ pxn: 0.12, pyn: 0.45, preferKind: 'wall', preferWallAxis: 'x' }),
  ceilingMid: Object.freeze({ pxn: 0.5, pyn: 0.12, preferKind: 'ceiling', preferWallAxis: null }),
  floorMid: Object.freeze({ pxn: 0.5, pyn: 0.78, preferKind: 'floor', preferWallAxis: null }),
  floorCorner: Object.freeze({ pxn: 0.08, pyn: 0.88, preferKind: 'floor', preferWallAxis: null }),
  surroundL: Object.freeze({ pxn: 0.03, pyn: 0.5, preferKind: null, preferWallAxis: null }),
});

const _RADIANCE_SPLIT_PICKS = _PIPETTE_PICK_SPECS;

/** Task 1 — IKEA cabinet interior pipette (IKEA-cdp-full-gapfill-20260830 pipetteCabinetAuto). */
const IKEA_CABINET_PIPETTE_REF = Object.freeze({
  back: Object.freeze({ lum: 170, tol: 8, dumpLabel: 'back panel', dumpUv: [0.58, 0.42] }),
  shelfTop: Object.freeze({ lum: 177, tol: 8, dumpLabel: 'shelf top front', dumpUv: [0.55, 0.48] }),
  sideCorner: Object.freeze({ lum: 198, tol: 12, dumpLabel: 'side-shelf corner', dumpUv: [0.48, 0.5] }),
  interiorMid: Object.freeze({
    lum: 213,
    tol: 12,
    dumpLabel: 'cabinet interior mid',
    dumpUv: [0.56, 0.45],
  }),
});

/** p8z107 PASS — fixture camera + delta; frozen p8z108 (no grid search). */
const IKEA_CABINET_PIPETTE_CAMERA_DELTA = Object.freeze({
  ey: 0.32,
  sx: 0,
  sz: -0.1,
  tx: -0.16,
  ty: -0.08,
  tz: 0.06,
});

let _softHeightSampleCache = null;

function _readBlurredHeightGrid() {
  if (_softHeightSampleCache) return _softHeightSampleCache;
  const soft = _softState;
  const renderer = state.renderer;
  if (!soft?.ready || !soft.rtBlurV || !renderer || IKEA_V0_ACTIVE_PHASE < 3) return null;
  const w = SOFT_RES;
  const h = SOFT_RES;
  const buf = new Float32Array(w * h * 4);
  try {
    updateSoftPlanePipeline(true);
    renderer.readRenderTargetPixels(soft.rtBlurV, 0, 0, w, h, buf);
  } catch (_) {
    return null;
  }
  _softHeightSampleCache = { w, h, buf };
  return _softHeightSampleCache;
}

function _sampleBlurredHeightAtXzM(xzM) {
  const soft = _softState;
  /** Empty room: GPU samples emptyHeightTex (h=0) — not stale rtBlurV from last cabinet pass. */
  if (soft?.heightMapTexture === soft?.emptyHeightTex) return 0;
  const vp = _softViewportM;
  if (!vp) return 0;
  const grid = _readBlurredHeightGrid();
  if (!grid) return 0;
  let u = (xzM.x - vp.x) / vp.z;
  let v = (xzM.y - vp.y) / vp.w;
  u = Math.max(0, Math.min(1, u));
  v = 1.0 - Math.max(0, Math.min(1, v));
  const { w, h, buf } = grid;
  const px = Math.min(w - 1, Math.max(0, Math.floor(u * w)));
  const py = Math.min(h - 1, Math.max(0, Math.floor(v * h)));
  return buf[(py * w + px) * 4];
}

/** JS mirror of computeSoftAoIbl — pipette softAo was only the enabled flag. */
function _computeSoftAoIblJs(posM, normal) {
  if (IKEA_V0_ACTIVE_PHASE < 4) return 1;
  const soft = _softState;
  if (soft?.heightMapTexture === soft?.emptyHeightTex) return 1;
  const vp = _softViewportM;
  if (vp) {
    let u = (posM.x - vp.x) / vp.z;
    let v = (posM.z - vp.y) / vp.w;
    u = Math.max(0, Math.min(1, u));
    v = Math.max(0, Math.min(1, v));
    /** GPU shader: clamped UV on viewport edge → ao=0. */
    if (u === 0 || u === 1 || v === 0 || v === 1) return 0;
  }
  const h = _sampleBlurredHeightAtXzM({ x: posM.x, y: posM.z });
  const nt = normal.y * 0.5 + 0.5;
  const k = 0.01 + (2.5 - 0.01) * nt * nt;
  let ao = 0.4 + 0.6 * Math.exp(-k * Math.max(0, h - posM.y));
  ao *= ao;
  return +ao.toFixed(4);
}

function _readScreenPixelLum(renderer, pxn, pyn) {
  const sample = _readPipettePixel(renderer, pxn, pyn);
  if (!sample) return null;
  const { readSource, bufferW, bufferH, ...rest } = sample;
  return rest;
}

function _pipetteBufferSize() {
  if (isIkeaHdrDisplayActive() && _hdrState?.downRt) {
    return {
      w: Math.max(1, _hdrState.downRt.width),
      h: Math.max(1, _hdrState.downRt.height),
    };
  }
  const c = state.renderer?.domElement;
  return {
    w: Math.max(1, c?.width ?? 1),
    h: Math.max(1, c?.height ?? 1),
  };
}

/**
 * Pipette color read — HDR path uses downRt (tonemap gamma), not canvas readPixels.
 * Canvas + preserveDrawingBuffer:false often returns stale/clear (p8z145–146 all Δ=0).
 */
function _readPipettePixel(renderer, pxn, pyn, pxBuf = null) {
  const px = pxBuf || new Uint8Array(4);
  if (!_forceCanvasPipette && isIkeaHdrDisplayActive() && _hdrState?.downRt) {
    const { w, h } = _pipetteBufferSize();
    const x = Math.max(0, Math.min(w - 1, Math.floor(pxn * (w - 1))));
    const y = Math.max(0, Math.min(h - 1, Math.floor(pyn * (h - 1))));
    try {
      renderer.readRenderTargetPixels(_hdrState.downRt, x, h - 1 - y, 1, 1, px);
      const lum = Math.round(0.2126 * px[0] + 0.7152 * px[1] + 0.0722 * px[2]);
      const hex = `#${[px[0], px[1], px[2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
      return {
        r: px[0],
        g: px[1],
        b: px[2],
        lum,
        hex,
        pxn: +pxn.toFixed(4),
        pyn: +pyn.toFixed(4),
        readSource: 'hdrDownRt',
        bufferW: w,
        bufferH: h,
      };
    } catch (_) {
      /* fall through to canvas */
    }
  }
  const c = renderer.domElement;
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  if (!gl) return null;
  renderer.setRenderTarget(null);
  const w = c.width;
  const h = c.height;
  const x = Math.max(0, Math.min(w - 1, Math.floor(pxn * (w - 1))));
  const y = Math.max(0, Math.min(h - 1, Math.floor(pyn * (h - 1))));
  gl.readPixels(x, h - 1 - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const lum = Math.round(0.2126 * px[0] + 0.7152 * px[1] + 0.0722 * px[2]);
  const hex = `#${[px[0], px[1], px[2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  return {
    r: px[0],
    g: px[1],
    b: px[2],
    lum,
    hex,
    pxn: +pxn.toFixed(4),
    pyn: +pyn.toFixed(4),
    readSource: 'canvas',
    bufferW: w,
    bufferH: h,
  };
}

function _collectCabinetPickTargets(scene) {
  const out = [];
  scene?.traverse?.((o) => {
    if (!o?.isMesh || !o.material?.userData?.__cldIkeaV0Cabinet) return;
    out.push(o);
  });
  return out;
}

function _isIkeaFixtureActive() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('ikeaFixture') === '1';
}

function _backupCameraView(camera, controls) {
  return {
    position: camera?.position?.clone?.() || null,
    target: controls?.target?.clone?.() || null,
  };
}

function _restoreCameraView(camera, controls, backup) {
  if (!camera || !backup?.position) return;
  camera.position.copy(backup.position);
  if (controls?.target && backup.target) {
    controls.target.copy(backup.target);
    controls.update?.();
  } else if (backup.target) {
    camera.lookAt(backup.target);
  }
  camera.updateMatrixWorld(true);
}

function _applyCabinetPipetteCameraDelta(camera, controls, fixturePos, fixtureTarget, size, halfY, delta) {
  const pos = fixturePos.clone().add(
    new THREE.Vector3(size.x * delta.sx, halfY * delta.ey, size.z * delta.sz)
  );
  const target = fixtureTarget.clone().add(
    new THREE.Vector3(size.x * delta.tx, halfY * delta.ty, size.z * delta.tz)
  );
  camera.position.copy(pos);
  if (controls?.target) {
    controls.target.copy(target);
    controls.update?.();
  } else {
    camera.lookAt(target);
  }
  camera.updateMatrixWorld(true);
}

/**
 * Pipette-only interior view — dump UV stable (IKEA pipetteCabinetAuto), not user orbit.
 * p8z108: frozen fixture delta from p8z107 PASS (back 172 / shelf 174 / corner 194).
 */
export function applyIkeaCabinetPipetteCamera(
  scene = state.scene,
  camera = state.camera,
  controls = state.controls
) {
  if (!scene || !camera) return { ok: false };
  const box = new THREE.Box3();
  let meshN = 0;
  scene.traverse((o) => {
    if (!o?.isMesh || !o.material?.userData?.__cldIkeaV0Cabinet) return;
    if (o.material.userData.__cldIkeaV0Kind === 'trim') return;
    box.expandByObject(o);
    meshN += 1;
  });
  if (meshN === 0 || box.isEmpty()) return { ok: false };
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const halfY = size.y * 0.5;
  /**
   * Fixture-equivalent base (ikea_light_fixture_ikea_v0_cab.json camera y=920 z=4100).
   * p8z130 canonical was too close → flat ~185 at all dump UVs.
   */
  const frontGapMm = Math.max(size.z * 6, 5500);
  const fixturePos = new THREE.Vector3(center.x, 920, center.z + frontGapMm);
  const fixtureTarget = center.clone();
  const pick = IKEA_CABINET_PIPETTE_CAMERA_DELTA;
  _applyCabinetPipetteCameraDelta(camera, controls, fixturePos, fixtureTarget, size, halfY, pick);
  return { ok: true, pick, frozen: true, canonicalBase: 'fixture-y920-front' };
}

function _cabinetHitFromIntersection(h, camera, pxn, pyn) {
  let n = h.face.normal.clone().transformDirection(h.object.matrixWorld).normalize();
  const toCam = new THREE.Vector3().subVectors(camera.position, h.point).normalize();
  if (n.dot(toCam) < 0) n.negate();
  const posM = h.point.clone().multiplyScalar(MM_TO_M);
  const mat = h.object.material;
  const kind = mat?.userData?.__cldIkeaV0Kind ?? null;
  const u = mat?.uniforms;
  const posM3 = { x: posM.x, y: posM.y, z: posM.z };
  const normal3 = { x: n.x, y: n.y, z: n.z };
  return {
    kind,
    mesh: h.object.name || null,
    orient: panelOrientationForMesh(h.object),
    posM: [+posM.x.toFixed(4), +posM.y.toFixed(4), +posM.z.toFixed(4)],
    normal: [+n.x.toFixed(4), +n.y.toFixed(4), +n.z.toFixed(4)],
    distance: h.distance,
    pxn,
    pyn,
    spotReceive: u?.spotShadowReceive?.value ?? null,
    softAo: u?.softAoEnabled?.value ?? null,
    softAoComputed: _computeSoftAoIblJs(posM3, normal3),
  };
}

function _cabinetPipetteAcceptHit(key, hit) {
  if (!hit?.kind) return false;
  if (key === 'interiorMid') return hit.kind === 'corpus' || hit.kind === 'back';
  if (key === 'back') return _cabinetHitIsBackLike(hit);
  if (key === 'shelfTop') return _cabinetHitIsShelfTop(hit);
  if (key === 'sideCorner') {
    return _cabinetHitIsSideVertical(hit) || _cabinetHitIsShelfTop(hit);
  }
  return false;
}

/** IKEA pipetteCabinetAuto — ray at dump UV, first surface matching acceptor. */
function _cabinetPipetteHitAtDumpUv(camera, targets, ref, key) {
  const pxn = ref.dumpUv?.[0];
  const pyn = ref.dumpUv?.[1];
  if (!Number.isFinite(pxn) || !Number.isFinite(pyn)) return null;
  const along = _raycastCabinetSurfacesAlongRay(camera, targets, pxn, pyn);
  if (key === 'sideCorner') {
    const side = along.find((h) => _cabinetHitIsSideVertical(h));
    if (side) return side;
    return along.find((h) => _cabinetHitIsShelfTop(h) && h.normal[1] > 0) ?? null;
  }
  if (key === 'interiorMid') {
    return along.find((h) => _cabinetPipetteAcceptHit(key, h)) ?? null;
  }
  if (key === 'shelfTop') {
    const topUp = along.find((h) => _cabinetHitIsShelfTop(h) && h.normal[1] > 0);
    if (topUp) return topUp;
    return along.find((h) => _cabinetHitIsShelfTop(h)) ?? null;
  }
  return along.find((h) => _cabinetPipetteAcceptHit(key, h)) ?? null;
}

function _cabinetHitDumpUvDist2(hit, ref) {
  const ux = ref.dumpUv?.[0] ?? 0.5;
  const uy = ref.dumpUv?.[1] ?? 0.5;
  const dx = hit.pxn - ux;
  const dy = hit.pyn - uy;
  return dx * dx + dy * dy;
}

function _cabinetHitIsBackLike(hit) {
  if (!hit) return false;
  if (hit.kind === 'back') return true;
  if (hit.kind !== 'corpus') return false;
  return Math.abs(hit.normal[1]) < 0.35 && Math.abs(hit.normal[2]) > 0.55;
}

function _cabinetHitIsSideVertical(hit) {
  if (!hit || hit.kind !== 'corpus') return false;
  return Math.abs(hit.normal[1]) < 0.35 && Math.abs(hit.normal[0]) > 0.55;
}

function _cabinetHitIsShelfTop(hit) {
  if (!hit || hit.kind !== 'corpus') return false;
  return Math.abs(hit.normal[1]) > 0.65;
}

function _raycastCabinetSurfacesAlongRay(camera, targets, pxn, pyn) {
  const rc = new THREE.Raycaster();
  rc.setFromCamera(new THREE.Vector2(pxn * 2 - 1, -(pyn * 2 - 1)), camera);
  const hits = rc.intersectObjects(targets, true);
  if (!hits.length) return [];
  return hits.map((h) => _cabinetHitFromIntersection(h, camera, pxn, pyn));
}

function _scanCabinetInteriorRayHits(camera, targets) {
  const backs = [];
  const shelfTops = [];
  const sideVerts = [];
  for (let py = 0.28; py <= 0.72; py += 0.01) {
    for (let px = 0.36; px <= 0.72; px += 0.01) {
      const along = _raycastCabinetSurfacesAlongRay(camera, targets, px, py);
      for (const hit of along) {
        if (!hit?.kind) continue;
        if (_cabinetHitIsBackLike(hit)) backs.push(hit);
        if (_cabinetHitIsShelfTop(hit)) shelfTops.push(hit);
        if (_cabinetHitIsSideVertical(hit)) sideVerts.push(hit);
      }
    }
  }
  const pickBack = () => {
    if (!backs.length) return null;
    backs.sort((a, b) => b.distance - a.distance || Math.abs(a.pxn - 0.55) - Math.abs(b.pxn - 0.55));
    return backs[0];
  };
  const pickShelfTop = () => {
    if (!shelfTops.length) return null;
    shelfTops.sort((a, b) => b.posM[1] - a.posM[1] || a.pyn - b.pyn);
    const upper = shelfTops.filter((h) => h.pyn < 0.58);
    const pool = upper.length ? upper : shelfTops;
    return pool[Math.floor(pool.length * 0.35)];
  };
  const pickSideCorner = () => {
    if (!sideVerts.length) return null;
    const ref = IKEA_CABINET_PIPETTE_REF.sideCorner;
    sideVerts.sort(
      (a, b) =>
        _cabinetHitDumpUvDist2(a, ref) - _cabinetHitDumpUvDist2(b, ref) ||
        b.posM[1] - a.posM[1]
    );
    return sideVerts[0];
  };
  return {
    back: pickBack(),
    shelfTop: pickShelfTop(),
    sideCorner: pickSideCorner(),
    scanCounts: { backs: backs.length, shelfTops: shelfTops.length, sideVerts: sideVerts.length },
  };
}

function _cabinetPipetteSampleEntry(key, hit, renderer, ref) {
  if (!hit) {
    return { ok: false, key, reason: 'ray miss — orbit cabinet front-open into view', ref };
  }
  const pxn = ref.dumpUv?.[0];
  const pyn = ref.dumpUv?.[1];
  const screen =
    Number.isFinite(pxn) && Number.isFinite(pyn)
      ? _readScreenPixelLum(renderer, pxn, pyn)
      : _readScreenPixelLum(renderer, hit.pxn, hit.pyn);
  if (!screen) return { ok: false, key, reason: 'readPixels failed', ref };
  const delta = screen.lum - ref.lum;
  return {
    ok: Math.abs(delta) <= ref.tol,
    key,
    dumpLabel: ref.dumpLabel,
    targetLum: ref.lum,
    tolerance: ref.tol,
    delta,
    screen,
    hit: {
      mesh: hit.mesh,
      kind: hit.kind,
      orient: hit.orient,
      posM: hit.posM,
      normal: hit.normal,
      spotReceive: hit.spotReceive,
      softAo: hit.softAo,
      softAoComputed: hit.softAoComputed ?? null,
    },
  };
}

/**
 * Task 1 gate — cabinet interior screen pipette vs IKEA dump lum (phase 1 getShadow baseline).
 * Ctrl+F5 → __cldIkeaV0CabinetInteriorPipette() (auto pipette camera; ?ikeaFixture=1 optional)
 */
export function probeIkeaV0CabinetInteriorPipette() {
  const renderer = state.renderer;
  const scene = state.scene;
  const camera = state.camera;
  const controls = state.controls;
  if (!renderer || !scene || !camera) return { ok: false, reason: 'no renderer/scene/camera' };
  _softHeightSampleCache = null;
  const camBackup = _backupCameraView(camera, controls);
  let pipetteCameraApplied = false;
  let pipetteCameraPick = null;
  const applied = applyIkeaCabinetPipetteCamera(scene, camera, controls);
  pipetteCameraApplied = applied?.ok === true;
  pipetteCameraPick = applied ?? null;
  syncCameraUniformsOnScene(camera, renderer);
  syncSpotShadowUniformsOnScene();
  if (isIkeaHdrDisplayActive()) {
    renderIkeaRoomLightV0(renderer, scene, camera);
  } else {
    renderer.render(scene, camera);
  }
  const targets = _collectCabinetPickTargets(scene);
  if (!targets.length) {
    _restoreCameraView(camera, controls, camBackup);
    return { ok: false, reason: 'no cabinet meshes — open ?ikeaFixture=1 or place PAX' };
  }
  const hits = _scanCabinetInteriorRayHits(camera, targets);
  const dumpHits = {
    back:
      _cabinetPipetteHitAtDumpUv(camera, targets, IKEA_CABINET_PIPETTE_REF.back, 'back') ||
      hits.back,
    shelfTop:
      _cabinetPipetteHitAtDumpUv(camera, targets, IKEA_CABINET_PIPETTE_REF.shelfTop, 'shelfTop') ||
      hits.shelfTop,
    sideCorner:
      _cabinetPipetteHitAtDumpUv(
        camera,
        targets,
        IKEA_CABINET_PIPETTE_REF.sideCorner,
        'sideCorner'
      ) || hits.sideCorner,
    interiorMid:
      _cabinetPipetteHitAtDumpUv(
        camera,
        targets,
        IKEA_CABINET_PIPETTE_REF.interiorMid,
        'interiorMid'
      ) || null,
  };
  const samples = {
    back: _cabinetPipetteSampleEntry('back', dumpHits.back, renderer, IKEA_CABINET_PIPETTE_REF.back),
    shelfTop: _cabinetPipetteSampleEntry(
      'shelfTop',
      dumpHits.shelfTop,
      renderer,
      IKEA_CABINET_PIPETTE_REF.shelfTop
    ),
    sideCorner: _cabinetPipetteSampleEntry(
      'sideCorner',
      dumpHits.sideCorner,
      renderer,
      IKEA_CABINET_PIPETTE_REF.sideCorner
    ),
    interiorMid: _cabinetPipetteSampleEntry(
      'interiorMid',
      dumpHits.interiorMid,
      renderer,
      IKEA_CABINET_PIPETTE_REF.interiorMid
    ),
  };
  const pass =
    samples.back.ok === true && samples.shelfTop.ok === true && samples.sideCorner.ok === true;
  let nextKnob = null;
  if (!pass) {
    if (samples.back.ok === false && samples.back.screen?.lum != null) {
      if (samples.back.screen.lum < 155) {
        nextKnob = 'getShadow umbra too dark on back — tune atlas/casters only (not Soft AO)';
      } else if (samples.back.screen.lum > samples.back.targetLum + samples.back.tolerance) {
        nextKnob = 'back too bright vs IKEA — spot shelf casters shadow on back (dump getShadow)';
      }
    } else if (
      samples.interiorMid?.ok === false &&
      samples.interiorMid.hit?.softAoComputed != null &&
      samples.interiorMid.hit.softAoComputed < 0.92
    ) {
      nextKnob = 'corpus gray — Soft AO IBL crush (softAoComputed < 0.92); check transfer_depth nzMax';
    } else if (
      samples.shelfTop.ok === false &&
      samples.shelfTop.screen?.lum != null &&
      samples.shelfTop.screen.lum < 165
    ) {
      nextKnob =
        'shelf top dark — Soft AO heightmap on +Y (check softAoComputed / blurNzMax) or spot atlas horizontal casters';
    } else if (samples.sideCorner.ok === false) {
      const cl = samples.sideCorner.screen?.lum;
      const tl = samples.sideCorner.targetLum;
      if (cl != null && cl < tl - samples.sideCorner.tolerance) {
        nextKnob =
          'corner too dark vs IKEA — dump path IBL×AO + Spot×getShadow (no contact floor)';
      } else {
        nextKnob = 'corner lum mismatch — dumpUv [0.48,0.5] side-shelf hit';
      }
    } else {
      nextKnob = 'lum too bright vs IKEA — reduce spot or check exposure/cal on cabinet only';
    }
  }
  _restoreCameraView(camera, controls, camBackup);
  if (pipetteCameraApplied) syncCameraUniformsOnScene(camera, renderer);
  return {
    ok: pass,
    task: 'T1-getShadow-pipette',
    roomPhase: IKEA_V0_ACTIVE_PHASE,
    cacheBust: IKEA_V0_CACHE_BUST,
    pipetteCameraApplied,
    pipetteCameraPick,
    scanCounts: hits.scanCounts,
    ikeaRef: IKEA_CABINET_PIPETTE_REF,
    samples,
    passCriteria: 'back 170±8, shelf 177±8, corner 198±12 (dump pipetteCabinetAuto)',
    nextKnobIfFail: nextKnob,
    note: pass
      ? 'Pipette PASS — full stack getShadow + Soft AO vs IKEA dump'
      : 'Pipette FAIL — one knob per nextKnobIfFail (room phase 7 = both IKEA layers)',
  };
}

/**
 * Task 1 diagnostic — pipette lum at dump UV (atlas path, dump: no contact floors).
 * Ctrl+F5 ikeaFixture=1 → __cldIkeaV0CabinetAtlasSplit()
 */
export function probeIkeaV0CabinetAtlasSplit() {
  const pipette = probeIkeaV0CabinetInteriorPipette();
  const keys = ['back', 'shelfTop', 'sideCorner'];
  const split = {};
  for (const k of keys) {
    const s = pipette.samples?.[k];
    const hit = s?.hit;
    split[k] = {
      lum: s?.screen?.lum ?? null,
      targetLum: s?.targetLum ?? null,
      delta: s?.delta ?? null,
      ok: s?.ok ?? null,
      dumpUv: IKEA_CABINET_PIPETTE_REF[k]?.dumpUv ?? null,
      normal: hit?.normal ?? null,
      mesh: hit?.mesh ?? null,
    };
  }
  return {
    ok: pipette.ok === true,
    pipetteOk: pipette.ok,
    cacheBust: IKEA_V0_CACHE_BUST,
    ikeaShaderRev: IKEA_V0_SHADER_REV,
    split,
    note: 'IKEA: getShadow×Spot + SoftAO×IBL only — no contact floors in dump',
  };
}

function _v3(x, y, z) {
  return { x, y, z };
}

function _v3FromTri(t) {
  return _v3(t[0], t[1], t[2]);
}

function _dot3(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function _len3(v) {
  return Math.sqrt(_dot3(v, v));
}

function _norm3(v) {
  const l = _len3(v) || 1;
  return _v3(v.x / l, v.y / l, v.z / l);
}

function _add3(a, b) {
  return _v3(a.x + b.x, a.y + b.y, a.z + b.z);
}

function _sub3(a, b) {
  return _v3(a.x - b.x, a.y - b.y, a.z - b.z);
}

function _mul3s(s, v) {
  return _v3(s * v.x, s * v.y, s * v.z);
}

function _mul3(a, b) {
  return _v3(a.x * b.x, a.y * b.y, a.z * b.z);
}

function _clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function _smoothstep(edge0, edge1, x) {
  const t = _clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function _applyEnvRotY(n, deg) {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return _v3(c * n.x + s * n.z, n.y, -s * n.x + c * n.z);
}

function _computeEnvironmentIrradianceJs(n) {
  const nx = n.x;
  const ny = n.y;
  const nz = n.z;
  const out = [0, 0, 0];
  for (let c = 0; c < 3; c += 1) {
    const sh = activeShRows().map((row) => row[c]);
    out[c] =
      sh[0] +
      sh[1] * ny +
      sh[2] * nz +
      sh[3] * nx +
      sh[4] * (ny * nx) +
      sh[5] * (ny * nz) +
      sh[6] * (3 * nz * nz - 1) +
      sh[7] * (nz * nx) +
      sh[8] * (nx * nx - ny * ny);
  }
  return out;
}

function _fresnelSchlickRoughnessJs(cosTheta, f0, r90) {
  const f = f0 + (r90 - f0) * (1 - cosTheta) ** 5;
  return [f, f, f];
}

function _dGgxJs(roughness, cosTheta) {
  const a2 = roughness * roughness;
  const k = (a2 - 1) * (cosTheta * cosTheta) + 1;
  return a2 / (k * k * Math.PI);
}

function _vGgxJs(nDotV, nDotL, linearRoughness) {
  const nL = Math.max(0, nDotL);
  const nV = Math.max(0, nDotV);
  const ggxV = nL * (nV * (1 - linearRoughness) + linearRoughness);
  const ggxL = nV * (nL * (1 - linearRoughness) + linearRoughness);
  return 0.5 / Math.max(0.001, ggxV + ggxL);
}

function _evaluateSpotBsdfJs(Wi, Wo, n, albedo, perceptualRoughness, metallic) {
  let alpha = perceptualRoughness * perceptualRoughness;
  alpha = Math.max(alpha, 0.045 * 0.045);
  const H = _norm3(_add3(Wi, Wo));
  const vDotH = Math.max(0, _dot3(Wo, H));
  const nDotH = Math.max(0, _dot3(n, H));
  const nDotL = Math.max(0, _dot3(n, Wi));
  const nDotV = Math.max(0, _dot3(n, Wo));
  const spec = _dGgxJs(alpha, nDotH) * _vGgxJs(nDotV, nDotL, alpha);
  const specularBsdf = _v3(spec, spec, spec);
  const diffuseBsdf = _mul3s(1 / Math.PI, albedo);
  const F = _fresnelSchlickRoughnessJs(vDotH, 0.04, Math.max(0.04, 1 - perceptualRoughness));
  const dielectric = _add3(
    _mul3(diffuseBsdf, _v3(1 - F[0], 1 - F[1], 1 - F[2])),
    _mul3(specularBsdf, _v3(F[0], F[1], F[2]))
  );
  const conductor = _mul3(albedo, specularBsdf);
  const m = metallic;
  return _v3(
    dielectric.x * (1 - m) + conductor.x * m,
    dielectric.y * (1 - m) + conductor.y * m,
    dielectric.z * (1 - m) + conductor.z * m
  );
}

function _evalSpotLightDataJs(posM, n, spotPosM) {
  const Lvec = _sub3(spotPosM, posM);
  let ld2 = _dot3(Lvec, Lvec);
  const wallMinDist2 = SOT.spot.wallMinDist2_m2 ?? 0;
  if (Math.abs(n.y) < 0.35 && wallMinDist2 > 0.001) {
    ld2 = Math.max(ld2, wallMinDist2);
  }
  const L = _mul3s(1 / Math.sqrt(ld2), Lvec);
  const dir = currentSpotDir();
  let att =
    _dot3(n, L) *
    _smoothstep(SOT.spot.outerCos, SOT.spot.innerCos, -_dot3(dir, L));
  att /= ld2;
  const wallScale = SOT.spot.wallScale ?? 1;
  if (Math.abs(n.y) < 0.35 && wallScale > 0.001 && wallScale < 0.999) {
    att *= wallScale;
  }
  const c = SOT.spot.colorLineAndRange;
  const attClamped = Math.max(0, att);
  return {
    L,
    intensity: _v3(c[0] * attClamped, c[1] * attClamped, c[2] * attClamped),
    ld2,
    att: attClamped,
  };
}

function _linearAlbedoForKindJs(kind) {
  if (kind === 'wall' || kind === 'frame') return [...SOT.wall.linear];
  if (kind === 'ceiling') {
    const c = new THREE.Color(SOT.ceiling.srgb[0], SOT.ceiling.srgb[1], SOT.ceiling.srgb[2]);
    c.convertSRGBToLinear();
    return [c.r, c.g, c.b];
  }
  if (kind === 'floorSlab') {
    const s = SOT.floor.slab?.linear;
    return s ? [...s] : [0.714, 0.702, 0.678];
  }
  if (kind === 'floor') return [1, 1, 1];
  return [1, 1, 1];
}

function _srgbByteToLinear(byte) {
  const s = byte / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

let _floorMapCanvasCache = null;

function _auditFloorTextureStatus() {
  const room = state.room;
  const mat = room?.floorCoating?.material;
  const tex =
    mat?.uniforms?.albedoMap?.value ||
    room?.floorTexture ||
    room?.floorCoating?.material?.map;
  const img = tex?.image;
  const w = img?.width || img?.naturalWidth || 0;
  const h = img?.height || img?.naturalHeight || 0;
  const ready = w > 0 && h > 0 && isTextureGpuUploadReady(tex);
  return {
    ready,
    hasMapUniform: !!(mat?.uniforms?.hasAlbedoMap?.value > 0.5),
    hasMapValue: mat?.uniforms?.hasAlbedoMap?.value ?? null,
    hasAlbedoMap: mat?.uniforms?.hasAlbedoMap?.value ?? null,
    mapBound: !!mat?.uniforms?.albedoMap?.value,
    mapGpuReady: isTextureGpuUploadReady(mat?.uniforms?.albedoMap?.value),
    url: img?.src?.slice?.(-72) ?? SOT.floor.albedoUrl,
    size: ready ? [w, h] : null,
    probeAlbedoWithoutMap: [1, 1, 1],
    ikeaNote:
      'Dump Floor_Herringbone: base (1,1,1) × herringbone albedo map — без JPG пол белый → ODT clip',
  };
}

function _floorMapAlbedoLinearAtPosM(posM) {
  const room = state.room;
  const tex =
    room?.floorCoating?.material?.uniforms?.albedoMap?.value ||
    room?.floorTexture ||
    room?.floorCoating?.material?.map;
  const img = tex?.image;
  const w = img?.width || img?.naturalWidth;
  const h = img?.height || img?.naturalHeight;
  if (!w || !h) return [1, 1, 1];
  if (!_floorMapCanvasCache || _floorMapCanvasCache.src !== img) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [1, 1, 1];
    ctx.drawImage(img, 0, 0, w, h);
    _floorMapCanvasCache = { src: img, ctx, w, h };
  }
  const { ctx, w: cw, h: ch } = _floorMapCanvasCache;
  const tile = FLOOR_MAP_TILE_M;
  const u = ((((posM.x / tile) % 1) + 1) % 1);
  const v = ((((posM.z / tile) % 1) + 1) % 1);
  const px = Math.min(cw - 1, Math.max(0, Math.floor(u * cw)));
  const py = Math.min(ch - 1, Math.max(0, Math.floor((1 - v) * ch)));
  const d = ctx.getImageData(px, py, 1, 1).data;
  return [_srgbByteToLinear(d[0]), _srgbByteToLinear(d[1]), _srgbByteToLinear(d[2])];
}

function _albedoTripletForSurfaceJs(kind, posM) {
  const base = _linearAlbedoForKindJs(kind);
  if (kind !== 'floor') return base;
  const mapRgb = _floorMapAlbedoLinearAtPosM(posM);
  return base.map((v, i) => v * mapRgb[i]);
}

function _reflectJs(I, N) {
  const d = 2 * _dot3(I, N);
  return _sub3(I, _mul3s(d, N));
}

function _parallaxCorrectNormalJs(vertexPos, origVec, cubePos, cubeSize) {
  const inv = _v3(1 / origVec.x, 1 / origVec.y, 1 / origVec.z);
  const half = _mul3s(0.5, cubeSize);
  const toMax = _sub3(_add3(cubePos, half), vertexPos);
  const toMin = _sub3(_sub3(cubePos, half), vertexPos);
  const interMax = _mul3(toMax, inv);
  const interMin = _mul3(toMin, inv);
  const largest = _v3(
    Math.max(interMax.x, interMin.x),
    Math.max(interMax.y, interMin.y),
    Math.max(interMax.z, interMin.z)
  );
  const distance = Math.min(largest.x, largest.y, largest.z);
  const hit = _add3(vertexPos, _mul3s(distance, origVec));
  return _sub3(hit, cubePos);
}

function _environmentBRDFApproxJs(perceptualRoughness, nDotV) {
  const c0 = [-1, -0.0275, -0.572, 0.022];
  const c1 = [1, 0.0425, 1.04, -0.04];
  const r = c0.map((v, i) => perceptualRoughness * v + c1[i]);
  const a004 = Math.min(r[0] * r[0], 2 ** (-9.28 * nDotV)) * r[0] + r[1];
  const abX = -1.04 * a004 + r[2];
  const abY = 1.04 * a004 + r[3];
  return [Math.max(0, abX), Math.max(0, abY)];
}

function _iblFresnelJs(N, Wo, roughness, F0) {
  const nDotV = Math.max(0, _dot3(N, Wo));
  const envBrdf = _environmentBRDFApproxJs(roughness, nDotV);
  const f90m0 = Math.max(1 - roughness, F0) - F0;
  const F = F0 + f90m0 * (1 - nDotV) ** 5;
  const fssEss = F * envBrdf[0] + envBrdf[1];
  const ems = 1 - envBrdf[0] - envBrdf[1];
  const favg = F0 + (1 - F0) / 21;
  const favgEms = favg * ems;
  const ms = fssEss * (favgEms / (1 - favgEms));
  return fssEss + ms;
}

function _sampleEnvironmentSpecularJs(posM, Wi, roughness) {
  if (IKEA_V0_ACTIVE_PHASE < 5 || !_envSpecState?.ready) return [0, 0, 0];
  const cubePos = _v3(ENV_CENTER_M.x, ENV_CENTER_M.y, ENV_CENTER_M.z);
  const cubeSize = _v3(ENV_SIZE_M.x, ENV_SIZE_M.y, ENV_SIZE_M.z);
  const N = _parallaxCorrectNormalJs(posM, Wi, cubePos, cubeSize);
  const nEnv = _norm3(_applyEnvRotY(N, ENV_ROT_DEG));
  const lod = roughness * ENV_MAP_MIP_LEVELS;
  const irr = _computeEnvironmentIrradianceJs(nEnv);
  const spec = irr.map((v) => v * ENV_INTENSITY);
  if (lod < ENV_MAP_MIP_LEVELS - 0.5) {
    const sharp = irr.map((v) => v * ENV_INTENSITY * (1 - lod / ENV_MAP_MIP_LEVELS));
    return sharp;
  }
  return spec;
}

function _computeIblCoreJs(posM, n, albedoTri, roughness, metalness, Wo, kind, ao = 1) {
  const nEnv = _norm3(_applyEnvRotY(n, ENV_ROT_DEG));
  const iblDiffuseScale = iblDiffuseSurfaceScaleForKind(kind);
  const irr = _computeEnvironmentIrradianceJs(nEnv);
  const iblDiffuse = irr.map((v, i) => v * ENV_INTENSITY * albedoTri[i] * iblDiffuseScale);
  const iblTotal = iblDiffuse.map((v) => v * ao);
  /** Spec env cube — GPU only; JS SH proxy mixed gray into warm floor and lied on Δ. */
  return {
    iblDiffuse,
    iblSpecular: null,
    iblTotal,
    iblSpecGpuOnly: IKEA_V0_ACTIVE_PHASE >= 5 && !!_envSpecState?.ready,
  };
}

function _roughnessForKindJs(kind) {
  if (kind === 'ceiling') return SOT.ceiling.roughness;
  if (kind === 'floor') return SOT.floor.roughness;
  return SOT.wall.roughness;
}

function _lumRgb(rgb) {
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function _roundRgb(rgb, digits = 4) {
  return rgb.map((v) => +v.toFixed(digits));
}

function _brRgb(rgb) {
  return rgb[2] / Math.max(rgb[0], 1e-6);
}

function _linearToSrgb255(rgb) {
  const toSrgb = (v) => {
    const x = Math.max(0, v);
    const s = x <= 0.0031308 ? x * 12.92 : 1.055 * x ** (1 / 2.4) - 0.055;
    return Math.round(_clamp01(s) * 255);
  };
  return [toSrgb(rgb[0]), toSrgb(rgb[1]), toSrgb(rgb[2])];
}

/** Rows, not GLSL columns: each row must sum to 1 (neutral gray stays neutral). */
const ACES_INPUT_ROWS = [
  [0.59719, 0.35458, 0.04823],
  [0.076, 0.90834, 0.01566],
  [0.0284, 0.13383, 0.83777],
];

const ACES_OUTPUT_ROWS = [
  [1.764740972036125, -0.6757776782442766, -0.08896329379184853],
  [-0.1470278520323784, 1.1602515117121115, -0.013223659679733168],
  [-0.03633683011844868, -0.1624364369102432, 1.1987732670286917],
];

function _acesMatRowsMul(m, v) {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}

function _acesInputRgb(rgb) {
  return _acesMatRowsMul(ACES_INPUT_ROWS, rgb);
}

function _acesOutputRgb(rrt) {
  return _acesMatRowsMul(ACES_OUTPUT_ROWS, rrt);
}

function _collectIkeaRoomPickTargets(scene) {
  const out = [];
  scene?.traverse?.((o) => {
    if (!o?.isMesh || !o.material?.userData?.__cldIkeaV0) return;
    if (o.material.userData.__cldIkeaV0Cabinet) return;
    out.push(o);
  });
  return out;
}

function _faceNormalFromHit(hit, camera) {
  let n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
  const toCam = new THREE.Vector3().subVectors(camera.position, hit.point).normalize();
  if (n.dot(toCam) < 0) n.negate();
  return n;
}

function _normalMatchesWallAxis(n, axis) {
  if (!axis) return true;
  if (Math.abs(n.y) > 0.35) return false;
  if (axis === 'x') return Math.abs(n.x) > Math.abs(n.z);
  if (axis === 'z') return Math.abs(n.z) >= Math.abs(n.x);
  return true;
}

function _raycastPipettePick(camera, targets, pxn, pyn, preferKind = null, preferWallAxis = null) {
  const rc = new THREE.Raycaster();
  rc.setFromCamera(new THREE.Vector2(pxn * 2 - 1, -(pyn * 2 - 1)), camera);
  let hits = rc.intersectObjects(targets, false);
  if (!hits.length) return null;
  if (preferKind) {
    const preferred = hits.filter(
      (hit) => hit.object.material?.userData?.__cldIkeaV0Kind === preferKind
    );
    if (preferred.length) hits = preferred;
  }
  if (preferWallAxis) {
    const axisHits = hits.filter((hit) => {
      const kind = hit.object.material?.userData?.__cldIkeaV0Kind;
      if (kind !== 'wall' && kind !== 'frame') return false;
      return _normalMatchesWallAxis(_faceNormalFromHit(hit, camera), preferWallAxis);
    });
    if (axisHits.length) hits = axisHits;
  }
  const kindRank = (k) => {
    if (k === 'wall') return 0;
    if (k === 'ceiling') return 1;
    if (k === 'floor') return 2;
    if (k === 'frame') return 8;
    return 5;
  };
  hits.sort((a, b) => {
    const ka = a.object.material?.userData?.__cldIkeaV0Kind ?? 'other';
    const kb = b.object.material?.userData?.__cldIkeaV0Kind ?? 'other';
    const dr = kindRank(ka) - kindRank(kb);
    return dr !== 0 ? dr : a.distance - b.distance;
  });
  const h = hits[0];
  const n = _faceNormalFromHit(h, camera);
  const posM = h.point.clone().multiplyScalar(MM_TO_M);
  const kind = h.object.material?.userData?.__cldIkeaV0Kind ?? 'wall';
  return {
    kind,
    mesh: h.object.name || null,
    wallName: h.object.userData?.wallName ?? null,
    posM: _v3(+posM.x.toFixed(4), +posM.y.toFixed(4), +posM.z.toFixed(4)),
    normal: _v3(+n.x.toFixed(4), +n.y.toFixed(4), +n.z.toFixed(4)),
    seedUv: { pxn, pyn },
  };
}

/**
 * Pipette reads framebuffer at ray seed UV — NOT 3D→screen project (occlusion/surround bug p8z145).
 * Side wall: scan left until ray hits |nx|>|nz|.
 */
function _resolvePipetteUv(camera, targets, spec) {
  const tryAt = (pxn, pyn) =>
    _raycastPipettePick(
      camera,
      targets,
      pxn,
      pyn,
      spec.preferKind ?? null,
      spec.preferWallAxis ?? null
    );

  let pxn = spec.pxn;
  let pyn = spec.pyn;
  let hit = tryAt(pxn, pyn);

  if (spec.preferKind === 'ceiling') {
    const xs = [0.5, 0.46, 0.54];
    for (const x of xs) {
      for (let y = 0.06; y <= 0.2; y += 0.008) {
        const h = tryAt(x, y);
        if (h?.kind === 'ceiling' && h.normal.y < -0.35) {
          pxn = x;
          pyn = y;
          hit = h;
          break;
        }
      }
      if (hit?.kind === 'ceiling' && hit.normal.y < -0.35) break;
    }
  }

  if (spec.preferWallAxis === 'x') {
    const y = spec.pyn;
    for (let x = 0.04; x <= 0.24; x += 0.012) {
      const h = tryAt(x, y);
      if (h && h.kind === 'wall' && (h.wallName === 'left' || h.wallName === 'right') && Math.abs(h.normal.x) > Math.abs(h.normal.z)) {
        pxn = x;
        pyn = y;
        hit = h;
        break;
      }
    }
  }

  if (spec.preferKind === 'floor' && spec.pxn < 0.15) {
    const candidates = [
      [0.08, 0.88],
      [0.06, 0.9],
      [0.1, 0.85],
    ];
    for (const [fx, fy] of candidates) {
      const h = tryAt(fx, fy);
      if (h?.kind === 'floor') {
        pxn = fx;
        pyn = fy;
        hit = h;
        break;
      }
    }
  }

  return { pxn, pyn, hit };
}

function _pipetteReadPixel(renderer, pxBuf, pxn, pyn) {
  return _readPipettePixel(renderer, pxn, pyn, pxBuf);
}

function _pipetteSampleFromSpec(renderer, pxBuf, camera, targets, spec) {
  const resolved = _resolvePipetteUv(camera, targets, spec);
  const sample = _pipetteReadPixel(renderer, pxBuf, resolved.pxn, resolved.pyn);
  if (!sample) return { lum: 0, hex: '#000000', readSource: 'fail' };
  const hit = resolved.hit;
  if (!hit) return sample;
  return {
    ...sample,
    hit: {
      kind: hit.kind,
      mesh: hit.mesh,
      wallName: hit.wallName,
      normal: hit.normal,
      posM: hit.posM,
      seedUv: hit.seedUv,
      readUv: { pxn: resolved.pxn, pyn: resolved.pyn },
    },
  };
}

function _worldMmToCanvasUv(camera, pointMm) {
  _uvProjScratch.set(pointMm.x, pointMm.y, pointMm.z);
  _uvProjScratch.project(camera);
  return {
    pxn: Math.max(0, Math.min(1, (_uvProjScratch.x + 1) * 0.5)),
    pyn: Math.max(0, Math.min(1, (-_uvProjScratch.y + 1) * 0.5)),
  };
}

function isTopDownCamera(camera) {
  const room = state.room;
  if (!camera || !room) return false;
  camera.updateMatrixWorld(true);
  camera.getWorldDirection(_camDirScratch);
  const roomH = room.height || 2500;
  return camera.position.y > roomH * 0.55 && _camDirScratch.y < -0.45;
}

/** Floor center in world mm (room.group is offset so center ≈ world origin). */
function roomFloorCenterWorldMm(room = state.room) {
  if (!room?.group) return _v3(0, 0, 0);
  const local = new THREE.Vector3(room.width / 2, 0, room.depth / 2);
  const w = room.group.localToWorld(local.clone());
  return _v3(w.x, w.y, w.z);
}

/**
 * Room meshes fully above the floor plane occlude a plan view (ceiling slab).
 * Geometric rule, no name/kind branches: bbox entirely above floor top and below camera.
 * Walls/frames start at floor level (min.y ≈ floor) → never hidden.
 */
function _hideRoomMeshesAbovePlanView(scene, camera) {
  const hidden = [];
  if (!scene || !camera) return hidden;
  const rooms = [];
  let floorTopY = null;
  scene.traverse?.((o) => {
    if (!o?.isMesh || !o.material?.userData?.__cldIkeaV0) return;
    if (o.material.userData.__cldIkeaV0Cabinet) return;
    o.updateWorldMatrix(true, false);
    if (!o.geometry?.boundingBox) o.geometry?.computeBoundingBox?.();
    if (!o.geometry?.boundingBox) return;
    const bb = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
    rooms.push({ mesh: o, bb });
    if (o.material.userData.__cldIkeaV0Kind === 'floor') {
      floorTopY = floorTopY == null ? bb.max.y : Math.max(floorTopY, bb.max.y);
    }
  });
  if (floorTopY == null) return hidden;
  const camY = camera.position.y;
  for (const { mesh, bb } of rooms) {
    if (!mesh.visible) continue;
    if (bb.min.y <= floorTopY + 1) continue;
    if (bb.min.y >= camY) continue;
    mesh.visible = false;
    hidden.push(mesh);
  }
  return hidden;
}

/**
 * Top-down camera for floor disk audit (Δ~26 lum center vs corner).
 * Returns saved pose — call restore on `saved` after probe.
 */
export function applyIkeaFloorDiskAuditCamera(room = state.room, camera = state.camera, opts = {}) {
  if (!room || !camera) return { ok: false, reason: 'no room/camera' };
  const saved = {
    position: camera.position.clone(),
    quaternion: camera.quaternion.clone(),
    up: camera.up.clone(),
    hidden: [],
  };
  const center = roomFloorCenterWorldMm(room);
  const cx = center.x;
  const cz = center.z;
  /**
   * Fixed 5500 mm framed only the middle of a 5000×4000 floor: the corners fell outside the
   * frustum, _worldMmToCanvasUv clamped them to the screen edge and the profile silently read
   * the surround (242) and UI (255). Height must fit the whole floor, camera up = -z so screen
   * Y spans depth and screen X spans width.
   */
  let y = Math.max((room.height || 2500) * 2.2, 5500);
  if (camera.isPerspectiveCamera) {
    const halfV = Math.tan((camera.fov * Math.PI) / 360);
    const aspect = camera.aspect || 1;
    const needDepth = room.depth / 2 / Math.max(1e-6, halfV);
    const needWidth = room.width / 2 / Math.max(1e-6, halfV * aspect);
    y = Math.max(y, Math.max(needDepth, needWidth) * 1.12);
  }
  camera.position.set(cx, y, cz);
  camera.up.set(0, 0, -1);
  camera.lookAt(cx, 0, cz);
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  const renderer = opts.renderer ?? state.renderer;
  const scene = opts.scene ?? state.scene;
  if (opts.hideAbovePlan !== false) {
    saved.hidden = _hideRoomMeshesAbovePlanView(scene, camera);
  }
  if (opts.render !== false && renderer && scene) {
    resetIkeaHdrAccumulation('floor-disk-camera');
    syncCameraUniformsOnScene(camera, renderer);
    if (isIkeaHdrDisplayActive()) {
      const frames = ACCUM_FRAME_COUNT + 2;
      for (let i = 0; i < frames; i += 1) {
        renderIkeaRoomLightV0(renderer, scene, camera);
      }
    } else {
      renderer.render(scene, camera);
    }
  }
  return {
    ok: true,
    saved,
    positionMm: [Math.round(cx), Math.round(y), Math.round(cz)],
    lookAtMm: [Math.round(cx), 0, Math.round(cz)],
    topDown: isTopDownCamera(camera),
    hiddenAbovePlan: saved.hidden.length,
    note: 'plan view world mm — judge floorDisk.displayDelta vs IKEA ~26',
  };
}

export function restoreIkeaFloorDiskAuditCamera(saved, camera = state.camera) {
  if (!saved || !camera) return false;
  camera.position.copy(saved.position);
  camera.quaternion.copy(saved.quaternion);
  camera.up.copy(saved.up);
  camera.updateProjectionMatrix();
  if (saved.hidden) {
    for (const mesh of saved.hidden) mesh.visible = true;
    saved.hidden.length = 0;
  }
  return true;
}

function _renderIkeaFrameSettled(renderer, scene, camera) {
  if (isIkeaHdrDisplayActive()) {
    resetIkeaHdrAccumulation('display-path-audit');
    const frames = ACCUM_FRAME_COUNT + 2;
    for (let i = 0; i < frames; i += 1) {
      renderIkeaRoomLightV0(renderer, scene, camera);
    }
    return 'hdr';
  }
  syncCameraUniformsOnScene(camera, renderer);
  renderer.render(scene, camera);
  return 'ldr';
}

/** IKEA top-down disk SoT — radial profile lum (screenshot 2026-08-27). */
const IKEA_RADIAL_DISK_REF = Object.freeze([
  { r: 0.0, lum: 187.6 },
  { r: 0.15, lum: 186.3 },
  { r: 0.3, lum: 183.4 },
  { r: 0.45, lum: 179.2 },
  { r: 0.6, lum: 175.3 },
  { r: 0.75, lum: 172.0 },
  { r: 0.9, lum: 170.0 },
]);

const FLOOR_DISK_RADIAL_R = Object.freeze([0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9]);
const FLOOR_DISK_RADIAL_SAMPLES = 16;
/** Radial profile: rings to the floor half-diagonal, dense angles so corner rings keep samples. */
const FLOOR_DISK_PROFILE_STEPS = 12;
const FLOOR_DISK_PROFILE_SAMPLES = 64;
/** Keep ring samples off the wall/skirting seam where the pipette catches the wall. */
const FLOOR_DISK_EDGE_INSET_MM = 60;

function _medianOf(values) {
  if (!values?.length) return null;
  const s = values.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function _floorDiskAnchorMm() {
  const c = roomFloorCenterWorldMm();
  return { x: c.x, z: c.z };
}

function _floorDiskMaxRadiusMm() {
  const room = state.room;
  if (!room) return 0;
  const cx = room.width / 2;
  const cz = room.depth / 2;
  return Math.max(1, Math.min(cx, room.width - cx, cz, room.depth - cz) * 0.92);
}

function _floorWorldMmAtRadial(normR, angleTurn) {
  const { x, z } = _floorDiskAnchorMm();
  const r = normR * _floorDiskMaxRadiusMm();
  const a = angleTurn * Math.PI * 2;
  return _v3(x + Math.cos(a) * r, 1, z + Math.sin(a) * r);
}

/**
 * Anchor→corner distance. _floorDiskMaxRadiusMm is the inradius (largest ring fully on the
 * floor) — at 5000×4000 it stops at 1840 mm, so the profile never left the flat middle while
 * IKEA's disk falls all the way to 3202 mm. Rings past the inradius keep only the angles that
 * still land on the floor; _sampleFloorDiskRing already drops the rest via the floor pick.
 */
function _floorDiskProfileMaxRadiusMm() {
  const room = state.room;
  if (!room) return 0;
  return Math.max(1, Math.hypot(room.width / 2, room.depth / 2));
}

function _floorWorldMmAtRadiusMm(radiusMm, angleTurn) {
  const { x, z } = _floorDiskAnchorMm();
  const a = angleTurn * Math.PI * 2;
  return _v3(x + Math.cos(a) * radiusMm, 1, z + Math.sin(a) * radiusMm);
}

/** Corner azimuths must be in the angle set or the outermost rings sample nothing. */
function _floorDiskProfileAngleTurns(samples) {
  const room = state.room;
  const turns = [];
  for (let i = 0; i < samples; i += 1) turns.push(i / samples);
  if (room) {
    const base = Math.atan2(room.depth / 2, room.width / 2) / (Math.PI * 2);
    for (const t of [base, 0.5 - base, 0.5 + base, 1 - base]) turns.push(t);
  }
  return turns.sort((a, b) => a - b);
}

/** JS mirror of hdrRrtToDisplaySrgb — ODT gamut matrix, then gamma 2.2, then lum on bytes. */
function _displayLumFromOdtSrgbTriplet(srgb) {
  const encoded = srgb.map((c) => _displayGammaEncode01(c));
  return Math.round(_lumRgb(encoded) * 255);
}

/** Gray linear total (pre-exposure) → display lum after exposure×2 + ODT (matches hdrRrtToDisplaySrgb). */
function inverseDisplayLumToLinearTotal(targetLum255) {
  const target = Math.max(0, Math.min(255, targetLum255)) / 255;
  let lo = 0;
  let hi = 2;
  for (let i = 0; i < 48; i += 1) {
    const mid = (lo + hi) / 2;
    const lum = _probeAfterOutputLum([mid, mid, mid], 'floor') / 255;
    if (lum < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function buildIkeaV0LinearLevelAudit(linearSplit, pipetteScreen) {
  const ikeaCenter = SOT.spot?.floorDisk?.centerLum ?? 187.6;
  const ikeaCorner = SOT.spot?.floorDisk?.cornerLum ?? 161.4;
  const targetCenterLinear = inverseDisplayLumToLinearTotal(ikeaCenter);
  const targetCornerLinear = inverseDisplayLumToLinearTotal(ikeaCorner);
  const centerLinear = linearSplit?.floorSpotCenter?.metrics?.totalLum ?? null;
  const cornerLinear = linearSplit?.floorSpotCorner?.metrics?.totalLum ?? null;
  const displayCenter = pipetteScreen?.centerUnderSpot?.lum ?? null;
  const displayCorner = pipetteScreen?.roomCorner?.lum ?? null;
  const linearDelta =
    centerLinear != null && cornerLinear != null ? centerLinear - cornerLinear : null;
  const displayDelta =
    displayCenter != null && displayCorner != null ? displayCenter - displayCorner : null;
  const targetLinearDelta = targetCenterLinear - targetCornerLinear;
  const rrtMedianCenter = pipetteScreen?.rrtMedianLum ?? null;

  return {
    ikeaScreenTarget: { center: ikeaCenter, corner: ikeaCorner, delta: ikeaCenter - ikeaCorner },
    inverseOdtLinearTarget: {
      center: +targetCenterLinear.toFixed(4),
      corner: +targetCornerLinear.toFixed(4),
      delta: +targetLinearDelta.toFixed(4),
    },
    jsLinearAtPicks: {
      center: centerLinear != null ? +centerLinear.toFixed(4) : null,
      corner: cornerLinear != null ? +cornerLinear.toFixed(4) : null,
      delta: linearDelta != null ? +linearDelta.toFixed(4) : null,
    },
    pipetteDisplay: {
      center: displayCenter,
      corner: displayCorner,
      delta: displayDelta,
    },
    excessLinearCenterPct:
      centerLinear != null && targetCenterLinear > 0
        ? +(((centerLinear - targetCenterLinear) / targetCenterLinear) * 100).toFixed(1)
        : null,
    excessDisplayCenterPct:
      displayCenter != null
        ? +(((displayCenter - ikeaCenter) / ikeaCenter) * 100).toFixed(1)
        : null,
    odtShoulder: displayCenter != null && displayCenter >= 235,
    verdict:
      displayCenter != null && displayCenter >= 235
        ? 'Пол в ODT shoulder (display≥235). Δ display сжимается: нужен ниже linear ИЛИ больше spot-контраст в linear.'
        : linearDelta != null && linearDelta < targetLinearDelta * 0.7
          ? 'Linear Δ меньше IKEA inverse-target — упор в Spot cone / IBL fill, не blit.'
          : 'Linear уровень близок к inverse-target — сверить pipette точки.',
    note:
      'inverseOdtLinearTarget = серый linear total до exposure; jsLinearAtPicks = top-down picks; rrtMedian optional.',
    rrtMedianCenter,
  };
}

function _jsOdtLumFromRrtTriplet(rr, gg, bb) {
  return _displayLumFromOdtSrgbTriplet(tonemapRrtToSrgbChannels(rr, gg, bb));
}

/** JS mirror of betraktaOutputColor HDR FB write (×exposure → sRGBtoRRT). */
function _linearRgbToRrtPack(linearRgb, kind = 'floor') {
  const pre = linearRgb.map((v) => v * exposureUniformValue() * screenCalForKind(kind));
  const rrt = _acesInputRgb(pre);
  return {
    preExposure: _roundRgb(pre),
    rrt: _roundRgb(rrt),
    rrtLum: +_lumRgb(rrt).toFixed(6),
    displayLum: _probeAfterOutputLum(linearRgb, kind),
  };
}

function _sampleSoftPlaneAlphaJs(posM) {
  if (IKEA_V0_ACTIVE_PHASE < 3 || !ikeaV0SoftPlaneCompositeReady()) return 0;
  const vp = _softFloorViewportM || _softViewportM;
  const fp = _softFootprintM;
  if (!vp || !fp) return 0;
  const mask = _softPlaneFootprintMaskJs(posM.x, posM.z, fp);
  if (mask < 0.001) return 0;
  let u = (posM.x - vp.x) / vp.z;
  let v = (posM.z - vp.y) / vp.w;
  u = Math.max(0, Math.min(1, u));
  v = Math.max(0, Math.min(1, v));
  if (u === 0 || u === 1 || v === 0 || v === 1) return 0;
  const tex = _softState?.alphaTexture;
  if (!tex || tex === _softState?.emptyAlphaTex) return 0;
  const h = _sampleSoftAlphaAtUvJs(1 - u, 1 - v);
  const strength = SOFT_PLANE_CONTACT_STRENGTH;
  return Math.min(1, h * mask * strength);
}

function _softPlaneFootprintMaskJs(xzX, xzZ, fp) {
  const pad = 0.02;
  const inX =
    _smoothstepJs(fp.x - pad, fp.x + pad, xzX) *
    (1 - _smoothstepJs(fp.z - pad, fp.z + pad, xzX));
  const inZ =
    _smoothstepJs(fp.y - pad, fp.y + pad, xzZ) *
    (1 - _smoothstepJs(fp.w - pad, fp.w + pad, xzZ));
  return inX * inZ;
}

function _smoothstepJs(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / Math.max(1e-6, edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

let _softAlphaCanvasCache = null;

function _sampleSoftAlphaAtUvJs(u, v) {
  const tex = _softState?.alphaTexture;
  const img = tex?.image;
  const w = img?.width || img?.naturalWidth;
  const h = img?.height || img?.naturalHeight;
  if (!w || !h) return 0;
  const px = Math.min(w - 1, Math.max(0, Math.floor(u * w)));
  const py = Math.min(h - 1, Math.max(0, Math.floor(v * h)));
  if (tex.isDataTexture && tex.image?.data) {
    const o = (py * w + px) * 4;
    return tex.image.data[o + 3] / 255;
  }
  if (!_softAlphaCanvasCache || _softAlphaCanvasCache.src !== img) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 0;
    try {
      ctx.drawImage(img, 0, 0, w, h);
    } catch (_) {
      return 0;
    }
    _softAlphaCanvasCache = { src: img, ctx, w, h };
  }
  const d = _softAlphaCanvasCache.ctx.getImageData(px, py, 1, 1).data;
  return d[3] / 255;
}

function _floorRrtReadbackSample(renderer, camera, pxBuf, posMm, spotPosM, gpuExtras = null, readUv = null) {
  const targets = _collectIkeaRoomPickTargets(state.scene);
  const resolved =
    readUv ||
    _resolveFloorDiskReadUv(camera, targets, posMm);
  const pxn = resolved.pxn;
  const pyn = resolved.pyn;
  const surface = {
    posM: { x: posMm.x * MM_TO_M, y: posMm.y * MM_TO_M, z: posMm.z * MM_TO_M },
    normal: { x: 0, y: 1, z: 0 },
    kind: 'floor',
  };
  const jsSplit = _computeRadianceSplitAtSurface(surface, camera, spotPosM);
  const totalRgb = [
    jsSplit.linear.total[0],
    jsSplit.linear.total[1],
    jsSplit.linear.total[2],
  ];
  const jsPack = _linearRgbToRrtPack(totalRgb, 'floor');

  const accumRrt = _readAccumRrtTripletAtPxn(renderer, pxn, pyn);
  const resolvedRrt = _readResolvedRrtTripletAtPxn(renderer, pxn, pyn);
  const pipette = _readPipettePixel(renderer, pxn, pyn, pxBuf);

  const accumDisplayLum = accumRrt
    ? _jsOdtLumFromRrtTriplet(accumRrt[0], accumRrt[1], accumRrt[2])
    : null;
  const resolvedDisplayLum = resolvedRrt
    ? _jsOdtLumFromRrtTriplet(resolvedRrt[0], resolvedRrt[1], resolvedRrt[2])
    : null;
  const accumRrtLum = accumRrt ? +_lumRgb(accumRrt).toFixed(6) : null;
  const resolvedRrtLum = resolvedRrt ? +_lumRgb(resolvedRrt).toFixed(6) : null;

  const gpuLinearFromAccum = accumRrt
    ? _gpuLinearPreExposureFromHdrTriplet(accumRrt, 'floor', true)
    : null;
  const gpuLinear =
    gpuExtras?.linearPreExposure &&
    gpuExtras?.linearTotalLum != null &&
    gpuExtras.linearTotalLum > 1e-5
      ? gpuExtras.linearPreExposure
      : gpuLinearFromAccum;
  const gpuLinearLum =
    gpuExtras?.linearTotalLum ??
    (gpuLinear ? +_lumRgb(gpuLinear).toFixed(6) : null);
  const gpuSpotLinearLum = gpuExtras?.spotLinearLum ?? null;
  const gpuIblLinearLum =
    gpuLinearLum != null && gpuSpotLinearLum != null
      ? +(Math.max(0, gpuLinearLum - gpuSpotLinearLum).toFixed(6))
      : null;

  return {
    worldMm: { x: Math.round(posMm.x), y: Math.round(posMm.y), z: Math.round(posMm.z) },
    screenUv: { pxn: +pxn.toFixed(4), pyn: +pyn.toFixed(4) },
    readUv: { pxn: +pxn.toFixed(4), pyn: +pyn.toFixed(4), planViewDirect: !!resolved.planViewDirect },
    js: {
      linearTotal: jsSplit.linear.total,
      linearTotalLum: jsSplit.metrics.totalLum,
      iblLinearLum: jsSplit.metrics.iblLum,
      spotLinearLum: jsSplit.metrics.spotLum,
      spotShare: jsSplit.metrics.spotShare,
      albedoLum: jsSplit.metrics.albedoLum,
      softAo: jsSplit.linear.ao,
      gpuAlbedoLum: gpuExtras?.gpuAlbedoLum ?? null,
      iblNote: jsSplit.linear.iblNote,
      rrtPack: jsPack,
      displayLum: jsSplit.afterOutput.lum,
    },
    gpu: {
      linearPreExposure: gpuLinear ? _roundRgb(gpuLinear) : null,
      linearTotalLum: gpuLinearLum,
      spotLinearLum: gpuSpotLinearLum,
      iblLinearLum: gpuIblLinearLum,
      accumRrt: accumRrt ? _roundRgb(accumRrt) : null,
      accumRrtLum,
      accumDisplayLum,
      resolvedRrt: resolvedRrt ? _roundRgb(resolvedRrt) : null,
      resolvedRrtLum,
      resolvedDisplayLum,
      pipetteDisplayLum: pipette?.lum ?? null,
      pipetteSource: pipette?.readSource ?? null,
    },
    gap: {
      linearGpuOverJs:
        gpuLinearLum != null && jsSplit.metrics.totalLum > 0
          ? +(gpuLinearLum / jsSplit.metrics.totalLum).toFixed(3)
          : null,
      spotLinearGpuOverJs:
        gpuSpotLinearLum != null && jsSplit.metrics.spotLum > 0
          ? +(gpuSpotLinearLum / jsSplit.metrics.spotLum).toFixed(3)
          : null,
      iblLinearGpuOverJs:
        gpuIblLinearLum != null && jsSplit.metrics.iblLum > 0
          ? +(gpuIblLinearLum / jsSplit.metrics.iblLum).toFixed(3)
          : null,
      rrtResolvedOverJs:
        resolvedRrtLum != null && jsPack.rrtLum > 0
          ? +(resolvedRrtLum / jsPack.rrtLum).toFixed(3)
          : null,
      rrtAccumOverJs:
        accumRrtLum != null && jsPack.rrtLum > 0
          ? +(accumRrtLum / jsPack.rrtLum).toFixed(3)
          : null,
      pipetteMinusJsDisplay:
        pipette?.lum != null ? pipette.lum - jsSplit.afterOutput.lum : null,
      pipetteMinusOdtFromAccum:
        pipette?.lum != null && accumDisplayLum != null
          ? pipette.lum - accumDisplayLum
          : null,
      pipetteMinusOdtFromResolved:
        pipette?.lum != null && resolvedDisplayLum != null
          ? pipette.lum - resolvedDisplayLum
          : null,
    },
  };
}

function _verdictFloorRrtReadback(center, corner, floorUniforms = null) {
  const ratio = center?.gap?.rrtResolvedOverJs;
  const linearRatio = center?.gap?.linearGpuOverJs;
  const spotRatio = center?.gap?.spotLinearGpuOverJs;
  const iblRatio = center?.gap?.iblLinearGpuOverJs;
  const pipVsJs = center?.gap?.pipetteMinusJsDisplay;
  const pipVsAccum = center?.gap?.pipetteMinusOdtFromAccum;
  const deltaJs = (center?.js?.displayLum ?? 0) - (corner?.js?.displayLum ?? 0);
  const deltaPip =
    (center?.gpu?.pipetteDisplayLum ?? 0) - (corner?.gpu?.pipetteDisplayLum ?? 0);
  const roughGpu = floorUniforms?.roughness;
  const roughJs = floorUniforms?.jsRoughnessForKind;

  let plainLanguage = 'Сверка center/corner JS linear→RRT vs GPU readback.';
  let lossStage = 'unknown';

  if (linearRatio != null && linearRatio >= 0.85 && linearRatio <= 1.15) {
    lossStage = 'JS linear≈GPU linear HDR readback';
    plainLanguage =
      'Linear совпадает — расхождение display только в RRT/ODT/TAA, не в shader radiance.';
  } else if (linearRatio != null && linearRatio > 1.15) {
    if (iblRatio != null && iblRatio > 1.5 && (spotRatio == null || spotRatio < 1.2)) {
      lossStage = 'GPU IBL >> JS — roughness/iblSpec/uniform drift';
      plainLanguage =
        roughGpu != null && roughJs != null && roughGpu < roughJs - 0.01
          ? `GPU roughness=${roughGpu} < JS ${roughJs} — IBL spec path включён на GPU, JS diffuse-only.`
          : 'GPU IBL ярче JS — сверить iblDiffuseSurfaceScale / env / albedo map на GPU.';
    } else if (spotRatio != null && spotRatio > 1.5) {
      lossStage = 'GPU Spot >> JS — Wo/UBO/BSDF drift';
      plainLanguage = 'Spot linear на GPU выше JS — Wo, spotPosM или BSDF.';
    } else {
      lossStage = 'GPU linear > JS — shader term missing in JS mirror';
      plainLanguage =
        'GPU linear HDR ярче JS — сверять floor shader vs _computeRadianceSplitAtSurface.';
    }
  } else if (ratio != null && ratio >= 0.85 && ratio <= 1.15) {
    lossStage = 'JS linear≈GPU RRT; gap на display = ODT shoulder / TAA / pipette path';
    plainLanguage =
      'GPU RRT ≈ JS pack. Pipette ярче JS ODT — смотреть TAA accum и shoulder, не Spot UBO.';
  } else if (ratio != null && ratio > 1.15) {
    lossStage = 'GPU RRT > JS linear pack — shader term missing in JS mirror';
    plainLanguage =
      'GPU пишет в RRT ярче JS (IBL spec? uniform drift). Сверять floor shader vs _computeRadianceSplitAtSurface.';
  } else if (ratio != null && ratio < 0.85) {
    lossStage = 'JS overestimates linear vs GPU RRT';
    plainLanguage = 'JS linear pack выше GPU RRT — Wo/BSDF или albedo sample на GPU ниже.';
  }

  if (pipVsAccum != null && Math.abs(pipVsAccum) <= 3 && pipVsJs != null && pipVsJs > 20) {
    if (linearRatio == null || linearRatio < 1.5) {
      lossStage = 'pipette ≈ ODT(accum RRT); JS display mirror занижен';
      plainLanguage =
        'Pipette совпадает с ODT(GPU RRT). JS afterOutput.lum занижает — не «лишний» GPU gain.';
    }
  }

  return {
    lossStage,
    plainLanguage,
    linearGpuOverJs: linearRatio,
    spotLinearGpuOverJs: spotRatio,
    iblLinearGpuOverJs: iblRatio,
    rrtResolvedOverJs: ratio,
    displayDeltaJs: deltaJs,
    displayDeltaPipette: deltaPip,
    ikeaTargetDelta: SOT.spot?.floorDisk?.centerMinusCornerLum ?? 26.2,
  };
}

/**
 * Top-down floor center/corner: JS linear→RRT pack vs GPU rtResolved + accum + pipette.
 * __cldIkeaV0FloorRrtReadback()
 */
export function probeIkeaV0FloorRrtReadback(opts = {}) {
  const prep = _prepareFloorDiskProbeScene({ topDown: opts.topDown !== false });
  if (!prep.ok) return prep;
  ensureFloorIkeaMapBound(state.room);
  if (!_spotPosM) {
    if (prep.savedCam?.saved) restoreIkeaFloorDiskAuditCamera(prep.savedCam.saved, prep.camera);
    return { ok: false, reason: 'no spot' };
  }

  const { renderer, camera, savedCam, pxBuf, targets } = prep;
  const spotPosM = _v3(_spotPosM.x, _spotPosM.y, _spotPosM.z);
  const centerSurf = _floorSurfaceUnderSpotCenterMm();
  const centerMm = centerSurf?.posMm ?? _floorWorldMmAtRadial(0, 0);
  const centerReadUv = _resolveFloorDiskReadUv(camera, targets, centerMm);
  const cornerSurf = _floorSurfaceDiskCornerMm(camera, spotPosM);
  const cornerMm = cornerSurf
    ? cornerSurf.posMm
    : null;
  const cornerReadUv = cornerMm ? _resolveFloorDiskReadUv(camera, targets, cornerMm) : null;

  const linearFrameOk = _renderIkeaHdrOneFrameLinearNoAccum(renderer, state.scene, camera);
  const centerLinearTri = _readGpuLinearPreExposureAtPxn(
    renderer,
    centerReadUv.pxn,
    centerReadUv.pyn,
    'floor',
    false
  );
  const cornerLinearTri = cornerReadUv
    ? _readGpuLinearPreExposureAtPxn(
        renderer,
        cornerReadUv.pxn,
        cornerReadUv.pyn,
        'floor',
        false
      )
    : null;

  _renderIkeaFrameSettled(renderer, state.scene, camera);

  const centerGpuExtras = {
    spotLinearLum: null,
    gpuAlbedoLum: null,
  };
  const cornerGpuExtras = null;

  _renderSpotGpuProbeFrame(renderer, state.scene, camera, 4);
  centerGpuExtras.gpuAlbedoLum = _readGpuAlbedoProbeAtPxn(
    renderer,
    camera,
    pxBuf,
    centerMm,
    centerReadUv
  )?.albedoLum;
  _renderSpotGpuProbeFrame(renderer, state.scene, camera, 2);
  centerGpuExtras.spotLinearLum = _readGpuSpotLinearProbeAtPxn(
    renderer,
    camera,
    pxBuf,
    centerMm,
    centerReadUv
  )?.spotLinearLum;
  const cornerSpotProbe =
    cornerMm && cornerReadUv
      ? _readGpuSpotLinearProbeAtPxn(renderer, camera, pxBuf, cornerMm, cornerReadUv)
      : null;

  _renderIkeaFrameSettled(renderer, state.scene, camera);

  let centerSettled = _floorRrtReadbackSample(
    renderer,
    camera,
    pxBuf,
    centerMm,
    spotPosM,
    centerGpuExtras,
    centerReadUv
  );
  let cornerSettled = cornerMm
    ? _floorRrtReadbackSample(
        renderer,
        camera,
        pxBuf,
        cornerMm,
        spotPosM,
        cornerSpotProbe
          ? { spotLinearLum: cornerSpotProbe.spotLinearLum ?? null }
          : null,
        cornerReadUv
      )
    : null;

  const singleFrameOk = _renderIkeaHdrSingleFrameAccum(renderer, state.scene, camera);
  const centerResolvedPxn = centerReadUv.pxn;
  const centerResolvedPyn = centerReadUv.pyn;
  const singleFrameRrt = _readAccumRrtTripletAtPxn(renderer, centerResolvedPxn, centerResolvedPyn);
  const singleFrameRrtLum = singleFrameRrt ? +_lumRgb(singleFrameRrt).toFixed(6) : null;
  const singleFrameDisplayLum = singleFrameRrt
    ? _jsOdtLumFromRrtTriplet(singleFrameRrt[0], singleFrameRrt[1], singleFrameRrt[2])
    : null;

  if (centerSettled?.gpu && singleFrameRrt) {
    centerSettled.gpu.resolvedRrt = _roundRgb(singleFrameRrt);
    centerSettled.gpu.resolvedRrtLum = singleFrameRrtLum;
    centerSettled.gpu.resolvedDisplayLum = singleFrameDisplayLum;
    centerSettled.gap.rrtResolvedOverJs =
      singleFrameRrtLum != null && centerSettled.js.rrtPack.rrtLum > 0
        ? +(singleFrameRrtLum / centerSettled.js.rrtPack.rrtLum).toFixed(3)
        : null;
    centerSettled.gap.pipetteMinusOdtFromResolved =
      centerSettled.gpu.pipetteDisplayLum != null && singleFrameDisplayLum != null
        ? centerSettled.gpu.pipetteDisplayLum - singleFrameDisplayLum
        : null;
  }
  if (cornerSettled?.gpu && cornerMm && cornerReadUv) {
    const cornerPxn = cornerReadUv.pxn;
    const cornerPyn = cornerReadUv.pyn;
    const cornerSingleRrt = _readAccumRrtTripletAtPxn(renderer, cornerPxn, cornerPyn);
    if (cornerSingleRrt) {
      const cornerSingleLum = +_lumRgb(cornerSingleRrt).toFixed(6);
      cornerSettled.gpu.resolvedRrt = _roundRgb(cornerSingleRrt);
      cornerSettled.gpu.resolvedRrtLum = cornerSingleLum;
      cornerSettled.gpu.resolvedDisplayLum = _jsOdtLumFromRrtTriplet(
        cornerSingleRrt[0],
        cornerSingleRrt[1],
        cornerSingleRrt[2]
      );
      cornerSettled.gap.rrtResolvedOverJs =
        cornerSingleLum > 0 && cornerSettled.js.rrtPack.rrtLum > 0
          ? +(cornerSingleLum / cornerSettled.js.rrtPack.rrtLum).toFixed(3)
          : null;
    }
  }

  if (savedCam?.saved) {
    restoreIkeaFloorDiskAuditCamera(savedCam.saved, camera);
    syncCameraUniformsOnScene(camera, renderer);
    if (isIkeaHdrDisplayActive()) renderIkeaRoomLightV0(renderer, state.scene, camera);
    else renderer.render(state.scene, camera);
  }

  const floorGpuUniforms = _auditFloorGpuUniforms();
  const verdict = _verdictFloorRrtReadback(centerSettled, cornerSettled, floorGpuUniforms);

  return {
    ok: true,
    cacheBust: IKEA_V0_CACHE_BUST,
    topDown: prep.topDown,
    hdrActive: prep.hdrActive,
    accumReady: prep.accumReady,
    linearFrameOk,
    singleFrameResolved: singleFrameOk,
    floorGpuUniforms,
    center: centerSettled,
    corner: cornerSettled,
    summary: {
      centerWorldMm: centerSettled.worldMm,
      jsLinearLum: centerSettled.js.linearTotalLum,
      jsIblLum: centerSettled.js.iblLinearLum,
      jsSpotLum: centerSettled.js.spotLinearLum,
      jsSoftAo: centerSettled.js.softAo,
      jsAlbedoLum: centerSettled.js.albedoLum,
      gpuAlbedoLum: centerSettled.js.gpuAlbedoLum,
      gpuLinearLum: centerSettled.gpu.linearTotalLum,
      gpuIblLum: centerSettled.gpu.iblLinearLum,
      gpuSpotLum: centerSettled.gpu.spotLinearLum,
      linearGpuOverJs: centerSettled.gap.linearGpuOverJs,
      spotLinearGpuOverJs: centerSettled.gap.spotLinearGpuOverJs,
      iblLinearGpuOverJs: centerSettled.gap.iblLinearGpuOverJs,
      jsRrtLum: centerSettled.js.rrtPack.rrtLum,
      jsDisplayLum: centerSettled.js.displayLum,
      gpuAccumRrtLum: centerSettled.gpu.accumRrtLum,
      gpuResolvedRrtLum: centerSettled.gpu.resolvedRrtLum,
      gpuPipetteLum: centerSettled.gpu.pipetteDisplayLum,
      odtFromAccumRrt: centerSettled.gpu.accumDisplayLum,
      odtFromResolvedRrt: centerSettled.gpu.resolvedDisplayLum,
      rrtGpuOverJs: centerSettled.gap.rrtResolvedOverJs,
      pipetteMinusJsDisplay: centerSettled.gap.pipetteMinusJsDisplay,
      pipetteMinusOdtAccum: centerSettled.gap.pipetteMinusOdtFromAccum,
    },
    verdict,
    usage:
      'top-down empty → __cldIkeaV0FloorRrtReadback() — JS vs GPU linear split + RRT readback + pipette',
  };
}

function _readRenderTargetTripletAtPxn(renderer, rt, pxn, pyn, rtW, rtH) {
  if (!renderer || !rt) return null;
  const gl = renderer.getContext?.();
  if (gl?.finish) gl.finish();
  const w = rtW || rt.width;
  const h = rtH || rt.height;
  const x = Math.max(0, Math.min(w - 1, Math.floor(pxn * (w - 1))));
  const y = Math.max(0, Math.min(h - 1, Math.floor(pyn * (h - 1))));
  const buf = new Float32Array(4);
  try {
    renderer.readRenderTargetPixels(rt, x, h - 1 - y, 1, 1, buf);
  } catch (_) {
    return null;
  }
  if (!Number.isFinite(buf[0])) return null;
  return [buf[0], buf[1], buf[2]];
}

/** hdrFramebufferWrite=0 → triplet is linear×exposure×screenCal; =1 → RRT (ACES input). */
function _gpuLinearPreExposureFromHdrTriplet(tri, kind = 'floor', isRrtSpace = true) {
  if (!tri) return null;
  const denom = exposureUniformValue() * screenCalForKind(kind);
  if (denom < 1e-9) return null;
  if (!isRrtSpace) {
    return tri.map((v) => v / denom);
  }
  const pre = _acesOutputRgb(tri);
  return pre.map((v) => v / denom);
}

/** @deprecated — use _gpuLinearPreExposureFromHdrTriplet */
function _gpuLinearPreExposureFromResolvedTriplet(tri, kind = 'floor') {
  return _gpuLinearPreExposureFromHdrTriplet(tri, kind, true);
}

function _resolveFloorDiskReadUv(camera, targets, posMm) {
  const floorHit = _pipetteFloorAtWorldMm(state.renderer, new Uint8Array(4), camera, targets, posMm);
  if (floorHit?.readUv) {
    return {
      pxn: floorHit.readUv.pxn,
      pyn: floorHit.readUv.pyn,
      ok: floorHit.ok !== false,
      planViewDirect: !!floorHit.planViewDirect,
    };
  }
  const screenUv = _worldMmToCanvasUv(camera, posMm);
  return {
    pxn: Math.max(0.005, Math.min(0.995, screenUv.pxn)),
    pyn: Math.max(0.005, Math.min(0.995, screenUv.pyn)),
    ok: false,
    planViewDirect: false,
  };
}

function _readProbeCanvasPixel(renderer, pxn, pyn, pxBuf = null) {
  const px = pxBuf || new Uint8Array(4);
  const gl = renderer?.getContext?.();
  if (gl?.finish) gl.finish();
  renderer.setRenderTarget(null);
  const size = new THREE.Vector2();
  renderer.getDrawingBufferSize(size);
  const w = Math.max(1, size.x);
  const h = Math.max(1, size.y);
  const x = Math.max(0, Math.min(w - 1, Math.floor(pxn * (w - 1))));
  const y = Math.max(0, Math.min(h - 1, Math.floor(pyn * (h - 1))));
  gl.readPixels(x, h - 1 - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const lum = Math.round(0.2126 * px[0] + 0.7152 * px[1] + 0.0722 * px[2]);
  return {
    r: px[0],
    g: px[1],
    b: px[2],
    lum,
    pxn: +pxn.toFixed(4),
    pyn: +pyn.toFixed(4),
    readSource: 'canvas-probe',
    bufferW: w,
    bufferH: h,
  };
}

function _readGpuLinearPreExposureAtPxn(renderer, pxn, pyn, kind = 'floor', isRrtSpace = false) {
  const tri = _readResolvedRrtTripletAtPxn(renderer, pxn, pyn);
  return _gpuLinearPreExposureFromHdrTriplet(tri, kind, isRrtSpace);
}

function _readGpuTotalLinearProbeAtPxn(renderer, camera, pxBuf, posMm) {
  const uv = _worldMmToCanvasUv(camera, posMm);
  const pxn = Math.max(0.005, Math.min(0.995, uv.pxn));
  const pyn = Math.max(0.005, Math.min(0.995, uv.pyn));
  const px = _readPipettePixel(renderer, pxn, pyn, pxBuf);
  if (!px) return null;
  const totalLum = px.r / (255 * FLOOR_TOTAL_LINEAR_GPU_PROBE_SCALE);
  return {
    pxn: +pxn.toFixed(4),
    pyn: +pyn.toFixed(4),
    totalLinearLum: +totalLum.toFixed(6),
  };
}

function _readGpuAlbedoProbeAtPxn(renderer, camera, pxBuf, posMm, readUv = null) {
  const uv =
    readUv ||
    _resolveFloorDiskReadUv(camera, _collectIkeaRoomPickTargets(state.scene), posMm);
  const pxn = uv.pxn;
  const pyn = uv.pyn;
  const px = _readProbeCanvasPixel(renderer, pxn, pyn, pxBuf);
  if (!px) return null;
  const albLum = px.r / 255;
  return {
    pxn: +pxn.toFixed(4),
    pyn: +pyn.toFixed(4),
    albedoLum: +albLum.toFixed(6),
  };
}

function _readGpuSpotLinearProbeAtPxn(renderer, camera, pxBuf, posMm, readUv = null) {
  const uv =
    readUv ||
    _resolveFloorDiskReadUv(camera, _collectIkeaRoomPickTargets(state.scene), posMm);
  const pxn = uv.pxn;
  const pyn = uv.pyn;
  const px = _readProbeCanvasPixel(renderer, pxn, pyn, pxBuf);
  if (!px) return null;
  const spotLum = px.r / (255 * SPOT_LINEAR_GPU_PROBE_SCALE);
  return {
    pxn: +pxn.toFixed(4),
    pyn: +pyn.toFixed(4),
    spotLinearLum: +spotLum.toFixed(6),
  };
}

/** One HDR frame (linear×exposure, no RRT) → rtResolved readback (not RRT accum). */
function _renderIkeaHdrSingleFrameLinearAccum(renderer, scene, camera) {
  return _renderIkeaHdrOneFrameLinearNoAccum(renderer, scene, camera);
}

function _readGpuLinearPreExposureFromAccumPxn(renderer, pxn, pyn, kind = 'floor') {
  const tri = _readAccumRrtTripletAtPxn(renderer, pxn, pyn);
  return _gpuLinearPreExposureFromHdrTriplet(tri, kind, true);
}

/** One settled HDR frame → float accum RRT (bypasses half-float rtResolved readback). */
function _renderIkeaHdrSingleFrameAccum(renderer, scene, camera) {
  if (!isIkeaHdrDisplayActive() || !_hdrState?.latestAccRt) return false;
  resetIkeaHdrAccumulation('single-frame-accum-readback');
  syncIkeaRoomLightV0();
  syncCameraUniformsOnScene(camera, renderer);
  syncHdrFramebufferWriteOnScene(1);
  renderIkeaRoomLightV0(renderer, scene, camera);
  return true;
}

function _readAccumRrtTripletAtPxn(renderer, pxn, pyn) {
  const rt = _hdrState?.latestAccRt;
  if (!rt || !_hdrState?.accumRrtSpace) return null;
  return _readRenderTargetTripletAtPxn(renderer, rt, pxn, pyn, _hdrState.rtW, _hdrState.rtH);
}

function _readResolvedRrtTripletAtPxn(renderer, pxn, pyn) {
  const rt = _hdrState?.rtResolved;
  if (!rt) return null;
  return _readRenderTargetTripletAtPxn(renderer, rt, pxn, pyn, _hdrState.rtW, _hdrState.rtH);
}

/** One HDR frame → rtResolved (no TAA). For disk probe — isolates hdrFramebufferWrite. */
function _renderIkeaHdrOneFrameNoAccum(renderer, scene, camera) {
  if (!isIkeaHdrDisplayActive() || !_hdrState?.rt) return false;
  const prevTarget = renderer.getRenderTarget();
  const prevAutoClear = renderer.autoClear;
  syncIkeaRoomLightV0();
  syncCameraUniformsOnScene(camera, renderer);
  syncHdrFramebufferWriteOnScene(1);
  renderer.setRenderTarget(_hdrState.rt);
  renderer.setClearColor(ensureHdrSurroundClearRrt(), 1);
  renderer.autoClear = true;
  renderer.clear(true, true, false);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  _hdrState.resolveMat.uniforms.hdrMap.value = _hdrState.rt.texture;
  renderer.setRenderTarget(_hdrState.rtResolved);
  renderer.autoClear = true;
  renderer.clear(true, true, false);
  renderer.render(_hdrState.resolveScene, _hdrState.resolveCam);
  syncHdrFramebufferWriteOnScene(0);
  renderer.setRenderTarget(prevTarget);
  renderer.autoClear = prevAutoClear;
  _hdrState.singleFrameResolvedReady = true;
  return true;
}

function _auditFloorGpuUniforms(hdrWriteSnapshot = null) {
  const mat = state.room?.floorCoating?.material;
  const u = mat?.uniforms;
  if (!mat?.userData?.__cldIkeaV0 || !u) {
    return { ok: false, reason: 'floor not ikea-bound' };
  }
  const spotC = u.spotColorUbo?.value;
  const spotD = u.spotDir?.value;
  const diff = u.diffuse?.value;
  return {
    ok: true,
    spotEnabled: u.spotEnabled?.value ?? null,
    hdrFramebufferWrite: hdrWriteSnapshot ?? u.hdrFramebufferWrite?.value ?? null,
    betraktaOutputEnabled: u.betraktaOutputEnabled?.value ?? null,
    mapBound: u.albedoMap?.value ? true : false,
    mapGpuReady: isTextureGpuUploadReady(u.albedoMap?.value),
    hasAlbedoMap: u.hasAlbedoMap?.value ?? null,
    hasMap: u.hasAlbedoMap?.value ?? null,
    exposure: u.exposure?.value ?? null,
    screenCal: u.screenCal?.value ?? null,
    surfaceLinearScale: u.surfaceLinearScale?.value ?? null,
    iblDiffuseSurfaceScale: u.iblDiffuseSurfaceScale?.value ?? null,
    iblSpecEnabled: u.iblSpecEnabled?.value ?? null,
    iblSpecSurfaceScale: u.iblSpecSurfaceScale?.value ?? null,
    roughness: u.roughness?.value ?? null,
    metalness: u.metalness?.value ?? null,
    diffuseLinear: diff ? [diff.x, diff.y, diff.z].map((v) => +v.toFixed(4)) : null,
    envMapIntensity: u.envMapIntensity?.value ?? null,
    softPlaneEnabled: u.softPlaneEnabled?.value ?? null,
    softAoEnabled: u.softAoEnabled?.value ?? null,
    spotShadowReceive: u.spotShadowReceive?.value ?? null,
    spotPosM: u.spotPosM?.value?.toArray?.().map((v) => +v.toFixed(4)) ?? null,
    spotDir: spotD ? [spotD.x, spotD.y, spotD.z].map((v) => +v.toFixed(4)) : null,
    spotColorUbo: spotC ? [spotC.x, spotC.y, spotC.z].map((v) => +v.toFixed(4)) : null,
    spotCosInner: u.spotCosInner?.value ?? null,
    spotCosOuter: u.spotCosOuter?.value ?? null,
    floorMapWorldUv: u.floorMapWorldUv?.value ?? null,
    jsRoughnessForKind: _roughnessForKindJs('floor'),
    ikeaShaderRev: mat.userData.__cldIkeaV0ShaderRev ?? null,
  };
}

function _jsSpotAttProbeAtPosMm(posMm, spotPosM, camera = state.camera) {
  const surface = _surfaceFromFloorMm(posMm);
  const { posM, normal } = surface;
  const spotData = _evalSpotLightDataJs(posM, normal, spotPosM);
  const albedoTri = _albedoTripletForSurfaceJs('floor', posM);
  const albedo = _v3(albedoTri[0], albedoTri[1], albedoTri[2]);
  const camMm = camera.position;
  const Wo = _norm3(_sub3(camMm, posMm));
  const bsdf = _evaluateSpotBsdfJs(
    spotData.L,
    Wo,
    normal,
    albedo,
    SOT.floor.roughness,
    0
  );
  const spotRgb = [
    spotData.intensity.x * bsdf.x,
    spotData.intensity.y * bsdf.y,
    spotData.intensity.z * bsdf.z,
  ];
  const cone = -_dot3(currentSpotDir(), spotData.L);
  return {
    posMm: [Math.round(posMm.x), Math.round(posMm.y), Math.round(posMm.z)],
    ld2: +spotData.ld2.toFixed(4),
    att: +spotData.att.toFixed(6),
    nDotL: +_dot3(normal, spotData.L).toFixed(4),
    cone: +cone.toFixed(4),
    spotLum: +_lumRgb(spotRgb).toFixed(6),
    intensityLum: +_lumRgb([spotData.intensity.x, spotData.intensity.y, spotData.intensity.z]).toFixed(6),
  };
}

function _jsSpotAttProbeRing(spotPosM, normR, camera = state.camera) {
  const samples = [];
  for (let i = 0; i < FLOOR_DISK_RADIAL_SAMPLES; i += 1) {
    samples.push(
      _jsSpotAttProbeAtPosMm(_floorWorldMmAtRadial(normR, i / FLOOR_DISK_RADIAL_SAMPLES), spotPosM, camera)
    );
  }
  const attMed = _medianOf(samples.map((s) => s.att));
  const spotLumMed = _medianOf(samples.map((s) => s.spotLum));
  return { normR, attMedian: attMed, spotLumMedian: spotLumMed, samples: samples.slice(0, 3) };
}

function _renderSpotGpuProbeFrame(renderer, scene, camera, mode) {
  syncIkeaRoomLightV0();
  syncCameraUniformsOnScene(camera, renderer);
  syncSpotGpuProbeOnScene(mode);
  const prevLdr = _forceLdrProbe;
  const prevClear = new THREE.Color();
  renderer.getClearColor(prevClear);
  const prevClearAlpha = renderer.getClearAlpha();
  _forceLdrProbe = true;
  renderer.setRenderTarget(null);
  renderer.setClearColor(0x000000, 1);
  renderer.autoClear = true;
  renderer.clear(true, true, false);
  renderer.render(scene, camera);
  _forceLdrProbe = prevLdr;
  syncSpotGpuProbeOnScene(0);
  renderer.setClearColor(prevClear, prevClearAlpha);
}

function _gpuSpotProbeRing(renderer, camera, pxBuf, normR, mode) {
  const vals = [];
  const hits = [];
  for (let i = 0; i < FLOOR_DISK_RADIAL_SAMPLES; i += 1) {
    const posMm = _floorWorldMmAtRadial(normR, i / FLOOR_DISK_RADIAL_SAMPLES);
    const uv = _worldMmToCanvasUv(camera, posMm);
    const pxn = Math.max(0.005, Math.min(0.995, uv.pxn));
    const pyn = Math.max(0.005, Math.min(0.995, uv.pyn));
    const px = _readPipettePixel(renderer, pxn, pyn, pxBuf);
    if (!px) continue;
    const v =
      mode === 1 ? px.r / 255 : px.r / (255 * SPOT_LINEAR_GPU_PROBE_SCALE);
    vals.push(v);
    hits.push({ pxn: +pxn.toFixed(4), pyn: +pyn.toFixed(4), rawR: px.r, value: +v.toFixed(6) });
  }
  return {
    normR,
    median: vals.length ? +(_medianOf(vals).toFixed(6)) : null,
    sampleCount: vals.length,
    hits: hits.slice(0, 3),
  };
}

/** HDR FB linear (hdrFramebufferWrite=0) — total linear×exposure, no RRT. */
function _renderIkeaHdrOneFrameLinearNoAccum(renderer, scene, camera) {
  if (!isIkeaHdrDisplayActive() || !_hdrState?.rt) return false;
  const prevTarget = renderer.getRenderTarget();
  const prevAutoClear = renderer.autoClear;
  syncIkeaRoomLightV0();
  syncCameraUniformsOnScene(camera, renderer);
  syncSpotUniformsOnScene();
  syncHdrFramebufferWriteOnScene(0);
  renderer.setRenderTarget(_hdrState.rt);
  renderer.setClearColor(0x000000, 1);
  renderer.autoClear = true;
  renderer.clear(true, true, false);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  _hdrState.resolveMat.uniforms.hdrMap.value = _hdrState.rt.texture;
  renderer.setRenderTarget(_hdrState.rtResolved);
  renderer.autoClear = true;
  renderer.clear(true, true, false);
  renderer.render(_hdrState.resolveScene, _hdrState.resolveCam);
  renderer.setRenderTarget(prevTarget);
  renderer.autoClear = prevAutoClear;
  return true;
}

function _sampleFloorDiskRingLinearHdr(renderer, camera, normR) {
  const lums = [];
  for (let i = 0; i < FLOOR_DISK_RADIAL_SAMPLES; i += 1) {
    const posMm = _floorWorldMmAtRadial(normR, i / FLOOR_DISK_RADIAL_SAMPLES);
    const uv = _worldMmToCanvasUv(camera, posMm);
    const pxn = Math.max(0.005, Math.min(0.995, uv.pxn));
    const pyn = Math.max(0.005, Math.min(0.995, uv.pyn));
    const tri = _readResolvedRrtTripletAtPxn(renderer, pxn, pyn);
    if (tri) lums.push(_lumRgb(tri));
  }
  return {
    normR,
    linearMedianLum: lums.length ? +(_medianOf(lums).toFixed(6)) : null,
    sampleCount: lums.length,
  };
}

function _sampleFloorDiskRingByProject(renderer, camera, pxBuf, normR, samples = FLOOR_DISK_RADIAL_SAMPLES) {
  const displayLums = [];
  const resolvedRrtLums = [];
  const accumRrtLums = [];
  const hits = [];
  for (let i = 0; i < samples; i += 1) {
    const posMm = _floorWorldMmAtRadial(normR, i / samples);
    const uv = _worldMmToCanvasUv(camera, posMm);
    const pxn = Math.max(0.005, Math.min(0.995, uv.pxn));
    const pyn = Math.max(0.005, Math.min(0.995, uv.pyn));
    const display = _readPipettePixel(renderer, pxn, pyn, pxBuf);
    if (display?.lum != null) displayLums.push(display.lum);
    const resolved = _readResolvedRrtTripletAtPxn(renderer, pxn, pyn);
    if (resolved) resolvedRrtLums.push(_lumRgb(resolved));
    const accum = _readAccumRrtTripletAtPxn(renderer, pxn, pyn);
    if (accum) accumRrtLums.push(_lumRgb(accum));
    hits.push({ posMm, pxn: +pxn.toFixed(4), pyn: +pyn.toFixed(4), displayLum: display?.lum ?? null });
  }
  return {
    normR,
    sampleCount: hits.length,
    displayMedian: _medianOf(displayLums),
    resolvedRrtMedianLum: resolvedRrtLums.length ? +(_medianOf(resolvedRrtLums).toFixed(6)) : null,
    accumRrtMedianLum: accumRrtLums.length ? +(_medianOf(accumRrtLums).toFixed(6)) : null,
    hits,
  };
}

function _prepareFloorDiskProbeScene(opts = {}) {
  const renderer = state.renderer;
  const scene = state.scene;
  const camera = state.camera;
  const room = state.room;
  if (!renderer || !scene || !camera || !room) {
    return { ok: false, reason: 'no renderer/scene/room' };
  }
  const useTopDown = opts.topDown !== false;
  let savedCam = null;
  if (useTopDown) {
    savedCam = applyIkeaFloorDiskAuditCamera(room, camera);
  }
  const renderMode = _renderIkeaFrameSettled(renderer, scene, camera);
  const targets = _collectIkeaRoomPickTargets(scene);
  const pxBuf = new Uint8Array(4);
  return {
    ok: true,
    renderer,
    scene,
    camera,
    room,
    savedCam,
    renderMode,
    targets,
    pxBuf,
    hdrActive: isIkeaHdrDisplayActive(),
    accumReady: !!_hdrState?.accumReady,
    accumRrtSpace: !!_hdrState?.accumRrtSpace,
    topDown: isTopDownCamera(camera),
  };
}

function _sampleFloorDiskRing(
  renderer,
  camera,
  targets,
  pxBuf,
  normR,
  samples = FLOOR_DISK_RADIAL_SAMPLES,
  opts = {}
) {
  const displayLums = [];
  const rrtLums = [];
  const rrtOdtLums = [];
  const displayR = [];
  const displayG = [];
  const displayB = [];
  const hits = [];
  const explicitR = opts.radiusMm != null;
  const radiusMm = explicitR ? opts.radiusMm : normR * _floorDiskMaxRadiusMm();
  const angleTurns = opts.angleTurns ?? Array.from({ length: samples }, (_, i) => i / samples);
  const room = state.room;
  const anchor = _floorDiskAnchorMm();
  const halfW = room ? room.width / 2 - FLOOR_DISK_EDGE_INSET_MM : Infinity;
  const halfD = room ? room.depth / 2 - FLOOR_DISK_EDGE_INSET_MM : Infinity;
  for (const turn of angleTurns) {
    const posMm = _floorWorldMmAtRadiusMm(radiusMm, turn);
    /** Past the inradius most angles leave the floor rectangle and land on a wall, which
     *  reads as white — a ring point outside the floor is not a floor sample. */
    if (Math.abs(posMm.x - anchor.x) > halfW || Math.abs(posMm.z - anchor.z) > halfD) continue;
    /** Off-frustum points get clamped to the screen edge downstream and would read the
     *  surround or UI as if it were floor — drop them instead of reporting a fake sample. */
    const rawUv = _worldMmToCanvasUv(camera, posMm);
    if (
      rawUv == null ||
      rawUv.pxn < 0.01 ||
      rawUv.pxn > 0.99 ||
      rawUv.pyn < 0.01 ||
      rawUv.pyn > 0.99
    ) {
      continue;
    }
    const floorHit = _pipetteFloorAtWorldMm(renderer, pxBuf, camera, targets, posMm);
    if (!floorHit?.ok) continue;
    const pxn = floorHit.readUv?.pxn ?? floorHit.screenUv?.pxn;
    const pyn = floorHit.readUv?.pyn ?? floorHit.screenUv?.pyn;
    if (pxn == null || pyn == null) continue;
    const display = _readPipettePixel(renderer, pxn, pyn, pxBuf);
    if (display?.lum != null) displayLums.push(display.lum);
    if (display?.r != null) {
      displayR.push(display.r);
      displayG.push(display.g);
      displayB.push(display.b);
    }
    const rrt = _readAccumRrtTripletAtPxn(renderer, pxn, pyn);
    if (rrt) {
      rrtLums.push(_lumRgb(rrt));
      rrtOdtLums.push(_jsOdtLumFromRrtTriplet(rrt[0], rrt[1], rrt[2]));
    }
    hits.push({ posMm, pxn: +pxn.toFixed(4), pyn: +pyn.toFixed(4), displayLum: display?.lum ?? null });
  }
  const rgbMedian =
    displayR.length > 0
      ? [_medianOf(displayR), _medianOf(displayG), _medianOf(displayB)].map((v) => Math.round(v))
      : null;
  return {
    normR,
    radiusMm: Math.round(radiusMm),
    sampleCount: hits.length,
    angleCount: angleTurns.length,
    displayMedian: _medianOf(displayLums),
    displayRgbMedian: rgbMedian,
    rrtMedianLum: rrtLums.length ? +(_medianOf(rrtLums).toFixed(6)) : null,
    rrtOdtMedianLum: _medianOf(rrtOdtLums),
    displayLums,
    rrtOdtLums,
    hits,
  };
}

/**
 * IKEA-style radial disk profile — median lum per ring on floor (top-down).
 * __cldIkeaV0RadialDiskProfile()
 */
export function probeIkeaV0RadialDiskProfile(opts = {}) {
  const ctx = _prepareFloorDiskProbeScene(opts);
  if (!ctx.ok) return ctx;
  const { renderer, camera, targets, pxBuf, savedCam } = ctx;
  const profileMaxMm = _floorDiskProfileMaxRadiusMm();
  const angleTurns = _floorDiskProfileAngleTurns(FLOOR_DISK_PROFILE_SAMPLES);
  const rings = [];
  for (let i = 0; i < FLOOR_DISK_PROFILE_STEPS; i += 1) {
    const radiusMm = (profileMaxMm * i) / (FLOOR_DISK_PROFILE_STEPS - 1);
    rings.push(
      _sampleFloorDiskRing(renderer, camera, targets, pxBuf, radiusMm / profileMaxMm, 0, {
        radiusMm,
        angleTurns: i === 0 ? [0] : angleTurns,
      })
    );
  }
  if (opts.restoreCamera !== false && savedCam?.saved) {
    restoreIkeaFloorDiskAuditCamera(savedCam.saved, camera);
    syncCameraUniformsOnScene(camera, renderer);
    if (isIkeaHdrDisplayActive()) renderIkeaRoomLightV0(renderer, state.scene, camera);
    else renderer.render(state.scene, camera);
  }
  const center = rings[0];
  /** Outermost ring with real coverage — the very last one can lose every angle to the pick. */
  const far = [...rings].reverse().find((r) => r.sampleCount > 0) ?? rings[rings.length - 1];
  const displayDelta =
    center?.displayMedian != null && far?.displayMedian != null
      ? +(center.displayMedian - far.displayMedian).toFixed(2)
      : null;
  const rrtOdtDelta =
    center?.rrtOdtMedianLum != null && far?.rrtOdtMedianLum != null
      ? center.rrtOdtMedianLum - far.rrtOdtMedianLum
      : null;
  const ikeaTarget = SOT.spot?.floorDisk?.centerMinusCornerLum ?? 26.2;
  const refCenter = IKEA_RADIAL_DISK_REF[0]?.lum ?? 187.6;
  const refFar = IKEA_RADIAL_DISK_REF[IKEA_RADIAL_DISK_REF.length - 1]?.lum ?? 170;
  return {
    ok: true,
    cacheBust: IKEA_V0_CACHE_BUST,
    phase: IKEA_V0_ACTIVE_PHASE,
    topDown: ctx.topDown,
    hdrActive: ctx.hdrActive,
    renderMode: ctx.renderMode,
    accumReady: ctx.accumReady,
    spotPosWorldMm: _spotPosWorldMm
      ? [_spotPosWorldMm.x, _spotPosWorldMm.y, _spotPosWorldMm.z].map((v) => Math.round(v))
      : null,
    floorDiskMaxRadiusMm: Math.round(_floorDiskMaxRadiusMm()),
    profileMaxRadiusMm: Math.round(profileMaxMm),
    farRingRadiusMm: far?.radiusMm ?? null,
    samplesPerRing: FLOOR_DISK_PROFILE_SAMPLES,
    ikeaReference: {
      radialProfileLum: IKEA_RADIAL_DISK_REF,
      centerMinusCornerLum: ikeaTarget,
      centerLum: refCenter,
      cornerLum: refFar,
      source: 'docs/IKEA-empty-floor-disk-topdown-20260827.json',
    },
    rings,
    summary: {
      displayCenterMedian: center?.displayMedian ?? null,
      displayFarMedian: far?.displayMedian ?? null,
      displayCenterMinusFar: displayDelta,
      rrtOdtCenterMedian: center?.rrtOdtMedianLum ?? null,
      rrtOdtFarMedian: far?.rrtOdtMedianLum ?? null,
      rrtOdtCenterMinusFar: rrtOdtDelta,
      ikeaTargetDelta: ikeaTarget,
      displayOk: displayDelta != null && displayDelta >= 18,
    },
    verdict: {
      diskVisibleInRadialMedian:
        (displayDelta != null && displayDelta >= 12) || (rrtOdtDelta != null && rrtOdtDelta >= 12),
      note:
        'Median по кольцу (не single-pixel corner). Кольца идут до полудиагонали пола; за инрадиусом остаются только углы, попавшие на пол — смотреть sampleCount и radiusMm.',
    },
    usage: 'top-down empty room → __cldIkeaV0RadialDiskProfile()',
  };
}

/**
 * RRT accum readback vs display vs JS linear — где теряется disk Δ.
 * __cldIkeaV0RrtDiskProbe()
 */
export function probeIkeaV0RrtDiskProbe(opts = {}) {
  const renderer = state.renderer;
  const scene = state.scene;
  const camera = state.camera;
  const room = state.room;
  if (!renderer || !scene || !camera || !room) {
    return { ok: false, reason: 'no renderer/scene/room' };
  }
  const useTopDown = opts.topDown !== false;
  let savedCam = null;
  if (useTopDown) {
    savedCam = applyIkeaFloorDiskAuditCamera(room, camera);
  }
  const pxBuf = new Uint8Array(4);
  const targets = _collectIkeaRoomPickTargets(scene);

  const spotPosM = _spotPosM ? _v3(_spotPosM.x, _spotPosM.y, _spotPosM.z) : null;
  let spotAttProbe = null;
  if (spotPosM) {
    const jsCenter = _jsSpotAttProbeRing(spotPosM, 0, camera);
    const jsFar = _jsSpotAttProbeRing(spotPosM, 0.9, camera);
    _renderSpotGpuProbeFrame(renderer, scene, camera, 1);
    const gpuAttCenter = _gpuSpotProbeRing(renderer, camera, pxBuf, 0, 1);
    const gpuAttFar = _gpuSpotProbeRing(renderer, camera, pxBuf, 0.9, 1);
    _renderSpotGpuProbeFrame(renderer, scene, camera, 2);
    const gpuSpotCenter = _gpuSpotProbeRing(renderer, camera, pxBuf, 0, 2);
    const gpuSpotFar = _gpuSpotProbeRing(renderer, camera, pxBuf, 0.9, 2);
    const jsAttDelta =
      jsCenter.attMedian != null && jsFar.attMedian != null
        ? +(jsCenter.attMedian - jsFar.attMedian).toFixed(6)
        : null;
    const jsSpotLumDelta =
      jsCenter.spotLumMedian != null && jsFar.spotLumMedian != null
        ? +(jsCenter.spotLumMedian - jsFar.spotLumMedian).toFixed(6)
        : null;
    const gpuAttDelta =
      gpuAttCenter.median != null && gpuAttFar.median != null
        ? +(gpuAttCenter.median - gpuAttFar.median).toFixed(6)
        : null;
    const gpuSpotLumDelta =
      gpuSpotCenter.median != null && gpuSpotFar.median != null
        ? +(gpuSpotCenter.median - gpuSpotFar.median).toFixed(6)
        : null;
    spotAttProbe = {
      uniforms: _auditFloorGpuUniforms(),
      js: { center: jsCenter, far: jsFar, attDelta: jsAttDelta, spotLumDelta: jsSpotLumDelta },
      gpu: {
        att: { center: gpuAttCenter, far: gpuAttFar, delta: gpuAttDelta },
        spotLinear: { center: gpuSpotCenter, far: gpuSpotFar, delta: gpuSpotLumDelta },
      },
      interpret:
        gpuAttDelta != null && gpuAttDelta > 0.001
          ? gpuSpotLumDelta != null && gpuSpotLumDelta > 0.0005
            ? 'GPU evalSpotLightData+BSDF OK — смотреть HDR/RRT pack'
            : 'GPU att OK, BSDF/spotLinear=0 — Wo/albedo/roughness на GPU'
          : jsSpotLumDelta != null && jsSpotLumDelta > 0.01
            ? 'GPU evalSpotLightData flat — uniform/spotEnabled на GPU'
            : jsAttDelta != null && jsAttDelta > 0.001
              ? 'att округлён; смотреть spotLumDelta / display'
              : 'JS spotLum flat — сверка spotPosM / room corners',
    };
  }

  /** A) single frame → rtResolved (Spot must appear here if GPU shader OK). */
  _renderIkeaHdrOneFrameNoAccum(renderer, scene, camera);
  const singleCenter = _sampleFloorDiskRingByProject(renderer, camera, pxBuf, 0);
  const singleFar = _sampleFloorDiskRingByProject(renderer, camera, pxBuf, 0.9);
  const singleResolvedDelta =
    singleCenter.resolvedRrtMedianLum != null && singleFar.resolvedRrtMedianLum != null
      ? +(singleCenter.resolvedRrtMedianLum - singleFar.resolvedRrtMedianLum).toFixed(6)
      : null;

  _renderIkeaHdrOneFrameLinearNoAccum(renderer, scene, camera);
  const linearCenter = _sampleFloorDiskRingLinearHdr(renderer, camera, 0);
  const linearFar = _sampleFloorDiskRingLinearHdr(renderer, camera, 0.9);
  const singleLinearDelta =
    linearCenter.linearMedianLum != null && linearFar.linearMedianLum != null
      ? +(linearCenter.linearMedianLum - linearFar.linearMedianLum).toFixed(6)
      : null;

  /** B) TAA settled (18 frames) — what display path uses. */
  const renderMode = _renderIkeaFrameSettled(renderer, scene, camera);
  const topDownDuringProbe = isTopDownCamera(camera);
  const centerRing = _sampleFloorDiskRing(renderer, camera, targets, pxBuf, 0);
  const farRing = _sampleFloorDiskRing(renderer, camera, targets, pxBuf, 0.9);
  const floorGpuUniforms = _auditFloorGpuUniforms();
  let jsLinear = null;
  if (spotPosM) {
    const centerSurf = _floorSurfaceUnderSpotCenterMm();
    const farSurf = _floorSurfaceDiskCornerMm(camera, spotPosM);
    const cSplit = centerSurf
      ? _computeRadianceSplitAtSurface(centerSurf, camera, spotPosM)
      : null;
    const fSplit = farSurf ? _computeRadianceSplitAtSurface(farSurf, camera, spotPosM) : null;
    if (cSplit && fSplit) {
      jsLinear = {
        centerTotalLum: cSplit.metrics?.totalLum,
        farTotalLum: fSplit.metrics?.totalLum,
        centerMinusFarLinear: +(
          (cSplit.metrics?.totalLum ?? 0) - (fSplit.metrics?.totalLum ?? 0)
        ).toFixed(4),
        centerJsOdtLum: cSplit.afterOutput?.lum,
        farJsOdtLum: fSplit.afterOutput?.lum,
        centerMinusFarJsOdt:
          (cSplit.afterOutput?.lum ?? 0) - (fSplit.afterOutput?.lum ?? 0),
        centerSpotLum: cSplit.metrics?.spotLum,
        farSpotLum: fSplit.metrics?.spotLum,
      };
    }
  }
  if (opts.restoreCamera !== false && savedCam?.saved) {
    restoreIkeaFloorDiskAuditCamera(savedCam.saved, camera);
    syncCameraUniformsOnScene(camera, renderer);
    if (isIkeaHdrDisplayActive()) renderIkeaRoomLightV0(renderer, state.scene, camera);
    else renderer.render(state.scene, camera);
  }
  const displayDelta =
    centerRing.displayMedian != null && farRing.displayMedian != null
      ? centerRing.displayMedian - farRing.displayMedian
      : null;
  const rrtLumDelta =
    centerRing.rrtMedianLum != null && farRing.rrtMedianLum != null
      ? +(centerRing.rrtMedianLum - farRing.rrtMedianLum).toFixed(6)
      : null;
  const rrtOdtDelta =
    centerRing.rrtOdtMedianLum != null && farRing.rrtOdtMedianLum != null
      ? centerRing.rrtOdtMedianLum - farRing.rrtOdtMedianLum
      : null;
  const ikeaTarget = SOT.spot?.floorDisk?.centerMinusCornerLum ?? 26.2;
  let lossStage = 'unknown';
  if (spotAttProbe?.gpu?.att?.delta != null && spotAttProbe.gpu.att.delta < 0.001 && (spotAttProbe?.js?.attDelta ?? 0) > 0.001) {
    lossStage = 'GPU evalSpotLightData — uniform/spotEnabled (JS att OK, GPU att flat)';
  } else if ((spotAttProbe?.gpu?.spotLinear?.delta ?? 0) > 0.0005 && (singleResolvedDelta ?? 0) < 0.005) {
    lossStage = 'HDR RRT pack — GPU spot linear OK, rtResolved flat';
  } else if ((singleLinearDelta ?? 0) > 0.02 && (singleResolvedDelta ?? 0) < 0.005) {
    lossStage = 'sRGBtoRRT / betraktaOutputColor';
  } else if (jsLinear?.centerMinusFarLinear > 0.05 && (singleResolvedDelta ?? 0) < 0.005) {
    lossStage = 'GPU hdrFramebufferWrite — JS spot OK, rtResolved flat (shader/uniform)';
  } else if ((singleResolvedDelta ?? 0) >= 0.02 && (displayDelta ?? 0) < 5) {
    lossStage = 'TAA accum or blit/downRt';
  } else if (jsLinear?.centerMinusFarJsOdt >= 10 && (singleResolvedDelta ?? 0) < 0.01) {
    lossStage = 'hdrFramebufferWrite or RRT pack';
  } else if ((jsLinear?.centerMinusFarLinear ?? 0) < 0.05) {
    lossStage = 'spot+IBL linear (shader/UBO)';
  } else {
    lossStage = 'multi-stage — see chain table';
  }
  return {
    ok: true,
    cacheBust: IKEA_V0_CACHE_BUST,
    phase: IKEA_V0_ACTIVE_PHASE,
    hdrActive: isIkeaHdrDisplayActive(),
    accumReady: !!_hdrState?.accumReady,
    accumRrtSpace: !!_hdrState?.accumRrtSpace,
    hdrPipelineVer: HDR_PIPELINE_VER,
    topDown: topDownDuringProbe,
    renderMode,
    floorGpuUniforms,
    spotAttProbe,
    singleFrame: {
      centerRing: singleCenter,
      farRing: singleFar,
      resolvedRrtCenterMinusFar: singleResolvedDelta,
      linearHdrCenterMinusFar: singleLinearDelta,
      linearCenter,
      linearFar,
      note: '1 frame — RRT vs linear HDR (write=0) vs spotAttProbe.gpu',
    },
    centerRing,
    farRing,
    jsLinear,
    deltas: {
      displayMedian: displayDelta,
      rrtLinearLum: rrtLumDelta,
      rrtJsOdtMedian: rrtOdtDelta,
      singleFrameResolvedRrt: singleResolvedDelta,
      singleFrameLinearHdr: singleLinearDelta,
      gpuAttDelta: spotAttProbe?.gpu?.att?.delta ?? null,
      gpuSpotLinearDelta: spotAttProbe?.gpu?.spotLinear?.delta ?? null,
      jsLinearTotal: jsLinear?.centerMinusFarLinear ?? null,
      jsMirrorOdt: jsLinear?.centerMinusFarJsOdt ?? null,
      ikeaTarget,
    },
    chain: [
      { stage: 'A2 GPU evalSpot att', delta: spotAttProbe?.gpu?.att?.delta, unit: '0-1' },
      { stage: 'A3 GPU spot linear', delta: spotAttProbe?.gpu?.spotLinear?.delta, unit: 'linear' },
      { stage: 'A4 JS shader linear total', delta: jsLinear?.centerMinusFarLinear, unit: 'linear' },
      { stage: 'B JS mirror ODT', delta: jsLinear?.centerMinusFarJsOdt, unit: 'lum255' },
      { stage: 'C GPU linear HDR 1-frame', delta: singleLinearDelta, unit: 'linear' },
      { stage: 'D GPU rtResolved RRT 1-frame', delta: singleResolvedDelta, unit: 'rrtLinear' },
      { stage: 'E HDR accum RRT median (TAA×18)', delta: rrtLumDelta, unit: 'rrtLinear' },
      { stage: 'F RRT→JS ODT median', delta: rrtOdtDelta, unit: 'lum255' },
      { stage: 'G display downRt median', delta: displayDelta, unit: 'lum255' },
    ],
    verdict: {
      lossStage,
      ikeaTargetDelta: ikeaTarget,
      gpuSpotInHdrFb: (singleResolvedDelta ?? 0) >= 0.02,
      jsSpotOk: (jsLinear?.centerMinusFarLinear ?? 0) >= 0.05,
      gpuMatchesJs:
        singleResolvedDelta != null &&
        jsLinear?.centerMinusFarLinear != null &&
        singleResolvedDelta >= jsLinear.centerMinusFarLinear * 0.5,
      displayMatchesRrtOdt:
        displayDelta != null &&
        rrtOdtDelta != null &&
        Math.abs(displayDelta - rrtOdtDelta) <= 4,
      plainLanguage:
        spotAttProbe?.interpret ??
        ((singleResolvedDelta ?? 0) < 0.005 && (jsLinear?.centerMinusFarLinear ?? 0) > 0.05
          ? 'JS видит Spot, GPU HDR FB — нет. Ищем uniform/shader на GPU, не ODT.'
          : (singleResolvedDelta ?? 0) >= 0.02
            ? 'Spot в GPU HDR есть; смотреть TAA/blit если display плоский.'
            : 'Spot слаб везде — сверка UBO с IKEA dump.'),
    },
    usage: 'top-down → __cldIkeaV0RrtDiskProbe() — смотреть chain[] где Δ падает',
  };
}

/**
 * Display path audit: linear vs ODT, eye vs top-down, HDR vs LDR bypass.
 * __cldIkeaV0DisplayPath() — ответ «может ли движок IKEA».
 */
export function probeIkeaV0DisplayPath() {
  const renderer = state.renderer;
  const scene = state.scene;
  const camera = state.camera;
  const room = state.room;
  if (!renderer || !scene || !camera || !room || !_spotPosM) {
    return { ok: false, reason: 'no renderer/scene/room/spot' };
  }
  const spotPosM = _v3(_spotPosM.x, _spotPosM.y, _spotPosM.z);
  let linearSplitEye = null;
  try {
    linearSplitEye = _radianceSplitFloorSpotSamples(camera, spotPosM);
  } catch (e) {
    linearSplitEye = { ok: false, error: String(e?.message ?? e) };
  }
  const eyePipette = probeIkeaV0PipetteCompare();
  const eyeFloorDelta =
    (eyePipette.samples?.floorMid?.lum ?? 0) - (eyePipette.samples?.floorCorner?.lum ?? 0);
  const tgt = SOT.emptyRoom?.screen ?? {};

  const camTop = applyIkeaFloorDiskAuditCamera(room, camera);
  let linearSplitTopDown = null;
  try {
    linearSplitTopDown = _radianceSplitFloorSpotSamples(camera, spotPosM);
  } catch (e) {
    linearSplitTopDown = { ok: false, error: String(e?.message ?? e) };
  }
  const hdrModeTop = _renderIkeaFrameSettled(renderer, scene, camera);
  const topDownHdr = probeIkeaV0PipetteCompare();

  _forceLdrProbe = true;
  syncDebugSpotDiskOnScene();
  _renderIkeaFrameSettled(renderer, scene, camera);
  const topDownLdr = probeIkeaV0PipetteCompare();
  _forceLdrProbe = false;
  syncDebugSpotDiskOnScene();

  restoreIkeaFloorDiskAuditCamera(camTop.saved, camera);
  syncCameraUniformsOnScene(camera, renderer);
  if (isIkeaHdrDisplayActive()) {
    renderIkeaRoomLightV0(renderer, scene, camera);
  } else {
    renderer.render(scene, camera);
  }

  const diskHdr = topDownHdr.floorDisk ?? null;
  const diskLdr = topDownLdr.floorDisk ?? null;
  const ikeaDiskTarget = SOT.spot?.floorDisk?.centerMinusCornerLum ?? 26.2;
  const eyeTargetDelta = (tgt.floorMidLum ?? 185) - (tgt.floorCornerLum ?? 165);

  const floorTex = _auditFloorTextureStatus();
  const linDelta = linearSplitTopDown?.floorSpotDelta?.centerMinusCornerLumLinear ?? 0;
  const spotLumDelta = linearSplitTopDown?.floorSpotDelta?.spotLumDelta ?? 0;
  const odtDelta = linearSplitTopDown?.floorSpotDelta?.centerMinusCornerLumDisplay ?? 0;
  const linearLevelAudit = buildIkeaV0LinearLevelAudit(
    linearSplitTopDown,
    diskHdr?.screen ?? topDownHdr?.floorDisk?.screen ?? null
  );
  const spotMathOk = spotLumDelta >= 0.03 || linDelta >= 0.08;
  const eyeOk = Math.abs(eyeFloorDelta - eyeTargetDelta) <= (SOT.emptyRoom?.toleranceLum ?? 15);
  const topHdrDelta =
    diskHdr?.displayDelta != null && diskHdr.displayDelta > 0
      ? diskHdr.displayDelta
      : diskHdr?.linearDisplayDelta ?? diskHdr?.displayDelta ?? null;
  const topLdrDelta =
    diskLdr?.displayDelta != null && diskLdr.displayDelta > 0
      ? diskLdr.displayDelta
      : diskLdr?.linearDisplayDelta ?? diskLdr?.displayDelta ?? null;

  return {
    ok: true,
    cacheBust: IKEA_V0_CACHE_BUST,
    phase: IKEA_V0_ACTIVE_PHASE,
    hdrActive: isIkeaHdrDisplayActive(),
    verdict: {
      engineCanMatchIkea: spotMathOk && eyeOk,
      spotShaderOk: spotMathOk,
      eyeLevelFloorOk: eyeOk,
      topDownDiskHdrDelta: topHdrDelta,
      topDownDiskLdrDelta: topLdrDelta,
      floorMapReady: floorTex.ready && floorTex.hasMapValue > 0.5,
      ikeaTopDownTarget: ikeaDiskTarget,
      ikeaEyeDeltaTarget: eyeTargetDelta,
      summary: spotMathOk
        ? eyeOk
          ? 'Spot+IBL в linear OK; eye-level пол ≈ IKEA (пластина без белого пятна). Top-down disk — сверка displayDelta.'
          : 'Spot OK; eye-level пол вне допуска — калибровка exposure/ODT eye picks.'
        : spotLumDelta >= 0.03
          ? 'Spot cone OK (spotLumDelta); display disk blocked by ODT clip if screen≥245.'
          : 'Spot cone слабый в linear — искать UBO/pos, не display.',
      notPlanPlace:
        'PlanPlace: PointLight 190 + Ambient 0.6 — яркое пятно. IKEA dump: одна Spot + IBL, eye-level без белого пятна.',
    },
    linear: linearSplitTopDown?.floorSpotDelta ?? null,
    linearEye: linearSplitEye?.floorSpotDelta ?? null,
    linearLevelAudit,
    floorTexture: floorTex,
    odtCompression: {
      linearDelta: linDelta,
      jsMirrorDisplayDelta: odtDelta,
      compressionNote:
        'HDR blit p8z31: ODT→sRGB без pow(1/2.2). LDR bypass = linear×exposure (не ODT) — сравнивать только с jsMirrorDisplayDelta.',
    },
    eyeLevel: {
      floorMidLum: eyePipette.samples?.floorMid?.lum,
      floorCornerLum: eyePipette.samples?.floorCorner?.lum,
      delta: eyeFloorDelta,
      ikeaTarget: eyeTargetDelta,
      soTNote: SOT.emptyRoom?.screen
        ? 'IKEA eye: ровная пластина, без белого пятна (floorMid/floorCorner)'
        : null,
    },
    topDown: {
      camera: camTop.positionMm,
      hdr: { mode: hdrModeTop, floorDisk: diskHdr },
      ldrBypass: { floorDisk: diskLdr },
    },
    usage: 'applyIkeaFloorDiskAuditCamera() + Ctrl+F5; __cldVerifyIkeaEmptyRoom() eye; top-down judge displayDelta',
  };
}

function _roomFloorCornersMm() {
  const room = state.room;
  if (!room?.group) return [];
  const w = room.width;
  const d = room.depth;
  const locals = [
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(w, 1, 0),
    new THREE.Vector3(0, 1, d),
    new THREE.Vector3(w, 1, d),
  ];
  return locals.map((local) => {
    const world = room.group.localToWorld(local.clone());
    return _v3(world.x, world.y, world.z);
  });
}

function _farthestFloorCornerMm(fromMm) {
  const corners = _roomFloorCornersMm();
  if (!corners.length || !fromMm) return null;
  let best = corners[0];
  let bestD2 = -1;
  for (const c of corners) {
    const dx = c.x - fromMm.x;
    const dz = c.z - fromMm.z;
    const d2 = dx * dx + dz * dz;
    if (d2 > bestD2) {
      bestD2 = d2;
      best = c;
    }
  }
  return best;
}

function _surfaceFromFloorMm(posMm) {
  return {
    kind: 'floor',
    mesh: 'floor-world',
    wallName: null,
    posM: _v3(posMm.x * MM_TO_M, posMm.y * MM_TO_M, posMm.z * MM_TO_M),
    posMm,
    normal: _v3(0, 1, 0),
  };
}

/** Synthetic floor hit under Spot XZ (dump disk = cone + 1/r² on horizontal floor). */
function _floorSurfaceUnderSpotMm(offsetXm = 0, offsetZm = 0) {
  const spotMm = _spotPosWorldMm;
  if (!spotMm) return null;
  const posMm = _v3(
    spotMm.x + offsetXm * M_TO_MM,
    1,
    spotMm.z + offsetZm * M_TO_MM
  );
  return _surfaceFromFloorMm(posMm);
}

function _floorSurfaceUnderSpotCenterMm() {
  return _floorSurfaceUnderSpotMm(0, 0);
}

function _floorSurfaceFarthestCornerMm() {
  const spotMm = _spotPosWorldMm;
  if (!spotMm) return null;
  const corner = _farthestFloorCornerMm(spotMm);
  return corner ? _surfaceFromFloorMm(corner) : null;
}

function _floorDiskCornerSurfacesMm() {
  return _roomFloorCornersMm().map((posMm) => ({ posMm, surface: _surfaceFromFloorMm(posMm) }));
}

/** IKEA disk corner = min total linear lum among 4 room corners (spot falloff + albedo). */
function _floorSurfaceDiskCornerMm(camera, spotPosM) {
  const corners = _roomFloorCornersMm();
  if (!corners.length || !spotPosM) return null;
  let bestMm = null;
  let bestTotal = Infinity;
  for (const posMm of corners) {
    const surface = _surfaceFromFloorMm(posMm);
    const split = _computeRadianceSplitAtSurface(surface, camera, spotPosM);
    const total = split.metrics?.totalLum ?? Infinity;
    if (total < bestTotal) {
      bestTotal = total;
      bestMm = posMm;
    }
  }
  if (bestMm) return _surfaceFromFloorMm(bestMm);
  const fallback = _farthestFloorCornerMm(_spotPosWorldMm);
  return fallback ? _surfaceFromFloorMm(fallback) : null;
}

function _floorSurfaceDarkestCornerMm(camera, spotPosM) {
  return _floorSurfaceDiskCornerMm(camera, spotPosM);
}

function _pipetteDarkestFloorCorner(renderer, pxBuf, camera, targets) {
  const corners = _floorDiskCornerSurfacesMm();
  let best = null;
  for (const { posMm } of corners) {
    const sample = _pipetteFloorAtWorldMm(renderer, pxBuf, camera, targets, posMm);
    if (!sample?.ok) continue;
    if (!best || (sample.lum ?? 0) < (best.lum ?? 255)) best = { ...sample, worldMm: posMm };
  }
  return best;
}

/** Top-down disk center = max screen lum in grid under Spot XZ (IKEA radial peak). */
function _pipetteBrightestUnderSpot(renderer, pxBuf, camera, targets, radiusMm = 1200, steps = 5) {
  const spotMm = _spotPosWorldMm;
  if (!spotMm) return null;
  let best = null;
  const half = steps > 1 ? radiusMm : 0;
  for (let ix = 0; ix < steps; ix += 1) {
    for (let iz = 0; iz < steps; iz += 1) {
      const fx = steps === 1 ? 0 : (ix / (steps - 1)) * 2 - 1;
      const fz = steps === 1 ? 0 : (iz / (steps - 1)) * 2 - 1;
      const posMm = _v3(spotMm.x + fx * half, 1, spotMm.z + fz * half);
      const sample = _pipetteFloorAtWorldMm(renderer, pxBuf, camera, targets, posMm);
      if (!sample?.ok) continue;
      if (!best || (sample.lum ?? 0) > (best.lum ?? -1)) best = { ...sample, worldMm: posMm };
    }
  }
  return best;
}

/** Synthetic floor hit at brightest total lum in grid under Spot (linear probe). */
function _floorSurfaceBrightestUnderSpotMm(camera, spotPosM, radiusMm = 1200, steps = 5) {
  const spotMm = _spotPosWorldMm;
  if (!spotMm || !spotPosM) return _floorSurfaceUnderSpotCenterMm();
  let bestSurf = null;
  let bestTotal = -Infinity;
  const half = steps > 1 ? radiusMm : 0;
  for (let ix = 0; ix < steps; ix += 1) {
    for (let iz = 0; iz < steps; iz += 1) {
      const fx = steps === 1 ? 0 : (ix / (steps - 1)) * 2 - 1;
      const fz = steps === 1 ? 0 : (iz / (steps - 1)) * 2 - 1;
      const surf = _floorSurfaceUnderSpotMm(fx * half, fz * half);
      if (!surf) continue;
      const split = _computeRadianceSplitAtSurface(surf, camera, spotPosM);
      const total = split.metrics?.totalLum ?? -Infinity;
      if (total > bestTotal) {
        bestTotal = total;
        bestSurf = surf;
      }
    }
  }
  return bestSurf ?? _floorSurfaceUnderSpotCenterMm();
}

function _radianceSplitFloorSpotSamples(camera, spotPosM, renderer = null, pxBuf = null) {
  const picks = {
    floorSpotCenter: _floorSurfaceBrightestUnderSpotMm(camera, spotPosM),
    floorSpotCorner: _floorSurfaceDarkestCornerMm(camera, spotPosM),
  };
  const targets = renderer ? _collectIkeaRoomPickTargets(state.scene) : null;
  const out = {};
  for (const [label, surface] of Object.entries(picks)) {
    if (!surface) {
      out[label] = { ok: false, reason: 'no spot' };
      continue;
    }
    const split = _computeRadianceSplitAtSurface(surface, camera, spotPosM);
    const screenUv = _worldMmToCanvasUv(
      camera,
      _v3(surface.posMm.x, surface.posMm.y, surface.posMm.z)
    );
    let screenRead = null;
    if (renderer && targets) {
      screenRead = _pipetteFloorAtWorldMm(
        renderer,
        pxBuf || new Uint8Array(4),
        camera,
        targets,
        surface.posMm
      );
    }
    out[label] = {
      ok: true,
      synthetic: true,
      screenUv,
      screenRead,
      ...split,
      ikeaDiskTarget: label === 'floorSpotCenter' ? SOT.spot?.floorDisk?.centerLum : SOT.spot?.floorDisk?.cornerLum,
    };
  }
  if (out.floorSpotCenter?.ok && out.floorSpotCorner?.ok) {
    const centerOut = out.floorSpotCenter.afterOutput?.lum ?? 0;
    const cornerOut = out.floorSpotCorner.afterOutput?.lum ?? 0;
    const centerSpot = out.floorSpotCenter.metrics?.spotLum ?? 0;
    const cornerSpot = out.floorSpotCorner.metrics?.spotLum ?? 0;
    const centerAlb = out.floorSpotCenter.metrics?.albedoLum ?? 0;
    const cornerAlb = out.floorSpotCorner.metrics?.albedoLum ?? 0;
    const centerScreen = out.floorSpotCenter.screenRead?.lum ?? null;
    const cornerScreen = out.floorSpotCorner.screenRead?.lum ?? null;
    const spotLumDelta = +(centerSpot - cornerSpot).toFixed(4);
    const totalLinearDelta = +(
      (out.floorSpotCenter.metrics?.totalLum ?? 0) -
      (out.floorSpotCorner.metrics?.totalLum ?? 0)
    ).toFixed(4);
    const screenDelta =
      centerScreen != null && cornerScreen != null ? centerScreen - cornerScreen : null;
    out.floorSpotDelta = {
      linearSpotShareCenter: out.floorSpotCenter.metrics?.spotShare,
      linearSpotShareCorner: out.floorSpotCorner.metrics?.spotShare,
      spotLumDelta,
      spotShaderOk: spotLumDelta >= 0.03,
      albedoLumCenter: +centerAlb.toFixed(4),
      albedoLumCorner: +cornerAlb.toFixed(4),
      albedoInvertsTotal: totalLinearDelta < 0 && spotLumDelta > 0,
      centerMinusCornerLumLinear: totalLinearDelta,
      centerMinusCornerLumDisplay: centerOut - cornerOut,
      screenLumCenter: centerScreen,
      screenLumCorner: cornerScreen,
      screenDisplayDelta: screenDelta,
      odtClipSuspect:
        centerScreen != null &&
        cornerScreen != null &&
        centerScreen >= 245 &&
        cornerScreen >= 245 &&
        Math.abs(screenDelta ?? 0) <= 2,
      ikeaTargetCenterMinusCorner: SOT.spot?.floorDisk?.centerMinusCornerLum ?? 26.2,
      note:
        'spotLumDelta = cone (OK if >0). corner = min total lum among 4 corners (IKEA disk). screenΔ needs lum <245.',
    };
  }
  return out;
}

/** World mm on floor — far corner (front-left origin) for disk falloff. */
function _floorRoomCornerMm() {
  return _farthestFloorCornerMm(_spotPosWorldMm);
}

function _pipetteFloorAtWorldMm(renderer, pxBuf, camera, targets, pointMm) {
  const screenUv = _worldMmToCanvasUv(camera, pointMm);
  const pxn = Math.max(0.005, Math.min(0.995, screenUv.pxn));
  const pyn = Math.max(0.005, Math.min(0.995, screenUv.pyn));
  const topDown = isTopDownCamera(camera);
  const hit = _raycastPipettePick(camera, targets, pxn, pyn, 'floor', null);
  if (!topDown && (!hit || hit.kind !== 'floor')) {
    return {
      ok: false,
      reason: 'floorRayMiss',
      screenUv,
      readUv: { pxn, pyn },
      worldMm: pointMm,
      hitKind: hit?.kind ?? null,
    };
  }
  const sample = _pipetteReadPixel(renderer, pxBuf, pxn, pyn);
  const floorHit =
    hit?.kind === 'floor'
      ? hit
      : {
          kind: 'floor',
          posM: { x: pointMm.x * MM_TO_M, y: pointMm.y * MM_TO_M, z: pointMm.z * MM_TO_M },
          normal: { x: 0, y: 1, z: 0 },
          seedUv: { pxn, pyn },
        };
  return {
    ok: true,
    screenUv,
    readUv: { pxn, pyn },
    worldMm: pointMm,
    hit: floorHit,
    planViewDirect: topDown && hit?.kind !== 'floor',
    ...sample,
  };
}

function _pipetteAtWorldMm(renderer, pxBuf, camera, targets, pointMm) {
  return _pipetteFloorAtWorldMm(renderer, pxBuf, camera, targets, pointMm);
}

function _auditFloorDiskWorld(renderer, pxBuf, camera, targets, spotPosM) {
  const centerSurf = _floorSurfaceUnderSpotCenterMm();
  const cornerSurf = _floorSurfaceDarkestCornerMm(camera, spotPosM);
  const cornerMm = cornerSurf?.posMm ?? null;
  const linear = _radianceSplitFloorSpotSamples(camera, spotPosM);
  const topDown = isTopDownCamera(camera);
  const centerPx = topDown
    ? (centerSurf?.posMm
        ? _pipetteFloorAtWorldMm(renderer, pxBuf, camera, targets, centerSurf.posMm)
        : null) ||
      _pipetteBrightestUnderSpot(renderer, pxBuf, camera, targets)
    : centerSurf?.posMm
      ? _pipetteFloorAtWorldMm(renderer, pxBuf, camera, targets, centerSurf.posMm)
      : null;
  const cornerPx = cornerMm
    ? _pipetteDarkestFloorCorner(renderer, pxBuf, camera, targets) ||
      _pipetteFloorAtWorldMm(renderer, pxBuf, camera, targets, cornerMm)
    : _pipetteDarkestFloorCorner(renderer, pxBuf, camera, targets);
  const linearDisplayDelta = linear?.floorSpotDelta?.centerMinusCornerLumDisplay ?? null;
  const displayDelta =
    centerPx?.ok && cornerPx?.ok ? (centerPx.lum ?? 0) - (cornerPx.lum ?? 0) : null;
  return {
    topDownCamera: topDown,
    spotPosWorldMm: _spotPosWorldMm
      ? [_spotPosWorldMm.x, _spotPosWorldMm.y, _spotPosWorldMm.z].map((v) => Math.round(v))
      : null,
    ikeaTargetDelta: SOT.spot?.floorDisk?.centerMinusCornerLum ?? 26.2,
    displayDelta,
    linearDisplayDelta,
    displayOk:
      (displayDelta != null && displayDelta >= 18) ||
      (linearDisplayDelta != null && linearDisplayDelta >= 18),
    linear: linear?.floorSpotDelta ?? null,
    screen: {
      centerUnderSpot: centerPx,
      roomCorner: cornerPx,
    },
    note: topDown
      ? 'topDown: max lum grid under Spot vs darkest corner (IKEA radial peak)'
      : 'eye-level: linearDisplayDelta always valid; rotate plan view for screen displayDelta',
  };
}

function _auditLinearSplitAtHits(samples, camera, spotPosM) {
  const out = {};
  for (const label of ['wallMid', 'wallSide', 'floorMid', 'floorCorner']) {
    const hit = samples[label]?.hit;
    if (!hit?.posM || !hit?.normal) continue;
    const surface = {
      kind: hit.kind,
      posM: hit.posM,
      normal: hit.normal,
    };
    const split = _computeRadianceSplitAtSurface(surface, camera, spotPosM);
    out[label] = {
      afterOutputLum: split.afterOutput?.lum,
      spotShare: split.metrics?.spotShare,
      iblLum: split.metrics?.iblLum,
      spotLum: split.metrics?.spotLum,
      totalLum: split.metrics?.totalLum,
    };
  }
  if (out.wallMid && out.wallSide) {
    out.wallSideDeltaLinear = +(
      (out.wallMid.totalLum ?? 0) - (out.wallSide.totalLum ?? 0)
    ).toFixed(4);
    out.wallSideDeltaDisplay = (out.wallMid.afterOutputLum ?? 0) - (out.wallSide.afterOutputLum ?? 0);
    out.note =
      'wallSideDeltaDisplay from JS ODT mirror — if << wallSideDelta pipette, IBL spec on screen flattens side wall';
  }
  const center = _floorSurfaceUnderSpotCenterMm();
  const corner = _floorSurfaceDarkestCornerMm(camera, spotPosM);
  if (center && corner) {
    const cSplit = _computeRadianceSplitAtSurface(center, camera, spotPosM);
    const kSplit = _computeRadianceSplitAtSurface(corner, camera, spotPosM);
    out.floorSpotCenter = {
      afterOutputLum: cSplit.afterOutput?.lum,
      spotShare: cSplit.metrics?.spotShare,
      totalLum: cSplit.metrics?.totalLum,
    };
    out.floorSpotCorner = {
      afterOutputLum: kSplit.afterOutput?.lum,
      spotShare: kSplit.metrics?.spotShare,
      totalLum: kSplit.metrics?.totalLum,
    };
    out.floorDiskDeltaDisplay =
      (cSplit.afterOutput?.lum ?? 0) - (kSplit.afterOutput?.lum ?? 0);
    out.floorDiskDeltaLinear = +(
      (cSplit.metrics?.totalLum ?? 0) - (kSplit.metrics?.totalLum ?? 0)
    ).toFixed(4);
  }
  return out;
}

function _probeAfterOutputLum(linearRgb, kind) {
  const pre = linearRgb.map(
    (v) => v * exposureUniformValue() * screenCalForKind(kind)
  );
  const rrt = _acesInputRgb(pre);
  return _displayLumFromOdtSrgbTriplet(
    tonemapRrtToSrgbChannels(rrt[0], rrt[1], rrt[2])
  );
}

function _computeRadianceSplitAtSurface(surface, camera, spotPosM) {
  const { posM, normal, kind } = surface;
  const albedoTri = _albedoTripletForSurfaceJs(kind, posM);
  const albedo = _v3(albedoTri[0], albedoTri[1], albedoTri[2]);
  const roughness = _roughnessForKindJs(kind);
  const camMm = camera.position;
  const posMm = _v3(posM.x / MM_TO_M, posM.y / MM_TO_M, posM.z / MM_TO_M);
  const Wo = _norm3(_sub3(camMm, posMm));

  const ao =
    ikeaV0SoftAoEnabledForKind(kind) > 0 ? _computeSoftAoIblJs(posM, normal) : 1;
  const iblCore = _computeIblCoreJs(posM, normal, albedoTri, roughness, 0, Wo, kind, ao);
  const ibl = iblCore.iblTotal;
  const iblDiffuse = iblCore.iblDiffuse;

  const spotData = _evalSpotLightDataJs(posM, normal, spotPosM);
  const bsdf = _evaluateSpotBsdfJs(spotData.L, Wo, normal, albedo, roughness, 0);
  const spotRgb = [
    spotData.intensity.x * bsdf.x,
    spotData.intensity.y * bsdf.y,
    spotData.intensity.z * bsdf.z,
  ];
  const linScale = surfaceLinearScaleForKind(kind);
  let total = ibl.map((v, i) => (v + spotRgb[i]) * linScale);
  if (softPlaneEnabledForKind(kind) > 0) {
    const planeA = _sampleSoftPlaneAlphaJs(posM);
    const mul = Math.max(0, 1 - planeA);
    total = total.map((v) => v * mul);
  }

  const displayLum = _probeAfterOutputLum(total, kind);

  const iblLum = _lumRgb(ibl);
  const iblDiffuseLum = _lumRgb(iblDiffuse);
  const spotLum = _lumRgb(spotRgb);
  const totalLum = _lumRgb(total);
  return {
    surface,
    spotProbe: {
      ld2: +spotData.ld2.toFixed(4),
      att: +spotData.att.toFixed(6),
      nDotL: +_dot3(normal, spotData.L).toFixed(4),
    },
    linear: {
      ibl: _roundRgb(ibl),
      iblDiffuse: _roundRgb(iblDiffuse),
      spot: _roundRgb(spotRgb),
      total: _roundRgb(total),
      ao,
      albedo: _roundRgb(albedoTri),
      iblIncludesSpec: !!iblCore.iblSpecGpuOnly,
      iblNote: iblCore.iblSpecGpuOnly
        ? 'probe = SH diffuse × albedo; IBL spec + GGX spec on GPU (phase 5+)'
        : 'phase < 5 or no env cube',
    },
    metrics: {
      iblLum: +iblLum.toFixed(4),
      iblDiffuseLum: +iblDiffuseLum.toFixed(4),
      spotLum: +spotLum.toFixed(4),
      albedoLum: +_lumRgb(albedoTri).toFixed(4),
      totalLum: +totalLum.toFixed(4),
      spotShare: +(spotLum / Math.max(totalLum, 1e-6)).toFixed(4),
      brTotal: +_brRgb(total).toFixed(4),
      brIbl: +_brRgb(ibl).toFixed(4),
      brSpot: +_brRgb(spotRgb).toFixed(4),
    },
    afterOutput: {
      lum: displayLum,
      linearPreExposure: _roundRgb(
        total.map((v) => v * exposureUniformValue() * screenCalForKind(kind))
      ),
    },
  };
}

/**
 * Read-only: IBL vs Spot linear split at pipette ray hits (JS mirror of shader).
 * Ctrl+F5 → шаг 2 empty room → __cldIkeaV0RadianceSplit()
 */
export function probeIkeaV0RadianceSplit() {
  const renderer = state.renderer;
  const scene = state.scene;
  const camera = state.camera;
  if (!renderer || !scene || !camera || !_spotPosM) {
    return { ok: false, reason: 'no renderer/scene/spot' };
  }
  if (isIkeaHdrDisplayActive()) {
    resetIkeaHdrAccumulation('radiance-split');
    const frames = ACCUM_FRAME_COUNT + 2;
    for (let i = 0; i < frames; i += 1) {
    renderIkeaRoomLightV0(renderer, scene, camera);
    }
  } else {
    syncCameraUniformsOnScene(camera, renderer);
    renderer.render(scene, camera);
  }

  const pipette = probeIkeaV0PipetteCompare();
  const targets = _collectIkeaRoomPickTargets(scene);
  const spotPosM = _v3(_spotPosM.x, _spotPosM.y, _spotPosM.z);
  const samples = {};
  for (const [label, uv] of Object.entries(_RADIANCE_SPLIT_PICKS)) {
    const surface = _raycastPipettePick(
      camera,
      targets,
      uv.pxn,
      uv.pyn,
      uv.preferKind ?? null,
      uv.preferWallAxis ?? null
    );
    if (!surface) {
      samples[label] = { ok: false, reason: 'ray miss' };
      continue;
    }
    const split = _computeRadianceSplitAtSurface(surface, camera, spotPosM);
    const screen = pipette.samples?.[label] ?? null;
    samples[label] = {
      ok: true,
      uv,
      screen,
      ...split,
      screenVsProbeLum: screen
        ? Math.round((split.afterOutput.lum ?? 0) - screen.lum)
        : null,
    };
  }

  const wm = samples.wallMid;
  let diagnosis = null;
  if (wm?.ok) {
    const olive = wm.metrics.brTotal < 0.92;
    const spotHeavy = wm.metrics.spotShare > 0.35;
    diagnosis = olive && spotHeavy
      ? 'olive likely from warm Spot linear (high spotShare + low B/R)'
      : olive
        ? 'olive with low spotShare — check IBL chroma / albedo / output path'
        : spotHeavy
          ? 'spot dominates luminance but B/R neutral'
          : 'split within neutral range at wallMid';
  }

  let floorSpot = null;
  try {
    const camTop = applyIkeaFloorDiskAuditCamera(state.room, camera);
    if (isIkeaHdrDisplayActive()) {
      resetIkeaHdrAccumulation('radiance-split-disk');
      for (let i = 0; i < ACCUM_FRAME_COUNT + 2; i += 1) {
        renderIkeaRoomLightV0(renderer, scene, camera);
      }
    }
    floorSpot = _radianceSplitFloorSpotSamples(camera, spotPosM, renderer, new Uint8Array(4));
    restoreIkeaFloorDiskAuditCamera(camTop.saved, camera);
    if (isIkeaHdrDisplayActive()) {
      renderIkeaRoomLightV0(renderer, scene, camera);
    } else {
      renderer.render(scene, camera);
    }
  } catch (err) {
    floorSpot = { ok: false, error: String(err?.message ?? err) };
  }

  const floorTex = _auditFloorTextureStatus();
  const spotDelta = floorSpot?.floorSpotDelta ?? null;
  const spotConeOk = (spotDelta?.spotLumDelta ?? 0) >= 0.03;
  const screenClip = !!spotDelta?.odtClipSuspect;
  const verdict = {
    spotConeOk,
    spotLumDelta: spotDelta?.spotLumDelta ?? null,
    screenDisplayDelta: spotDelta?.screenDisplayDelta ?? null,
    odtClipSuspect: screenClip,
    floorTextureReady: floorTex.ready,
    ikeaTopDownTargetDelta: SOT.spot?.floorDisk?.centerMinusCornerLum ?? 26.2,
    summary: !floorTex.ready
      ? 'Floor_Herringbone JPG не загружен — albedo=(1,1,1), пол в ODT shoulder (~247). Spot cone может быть OK.'
      : spotConeOk && screenClip
        ? 'Spot cone OK (spotLumDelta>0); display Δ=0 — absolute lum слишком высокий (ODT clip), не «нет света».'
        : spotConeOk
          ? 'Spot cone OK; сверка screenDisplayDelta vs IKEA ~26.'
          : 'Spot cone слабый — UBO/pos, не display.',
  };

  return {
    ok: true,
    cacheBust: IKEA_V0_CACHE_BUST,
    phase: IKEA_V0_ACTIVE_PHASE,
    spotPosM: _spotPosM.toArray().map((v) => +v.toFixed(4)),
    perPixelWo: true,
    verdict,
    floorTexture: floorTex,
    samples,
    floorSpot,
    ikeaRef: {
      wallMid: { lum: 212, br: 0.972, hex: '#d5d4cf', note: 'IKEA empty pipette 2026-08-30' },
      floorDisk: SOT.spot?.floorDisk ?? null,
      wallSideCornerDelta: 8,
      note: 'floorSpot = synthetic hits under Spot XZ (top-down disk); eye picks in samples',
    },
    diagnosis,
    usage: 'Compare metrics.brTotal vs ikeaRef; floorSpot.floorSpotDelta vs ikea disk Δ~26',
  };
}

/** Сверка реализованных слоёв v0 с IKEA dump (код / структура). */
export function auditIkeaV0CodeCompare() {
  const phase = IKEA_V0_ACTIVE_PHASE;
  const ikeaSpot = {
    pos_m: SOT.spot.defaultPos_m,
    dir: SOT.spot.dir,
    colorLine: SOT.spot.colorLineAndRange.slice(0, 3),
    innerCos: SOT.spot.innerCos,
    outerCos: SOT.spot.outerCos,
    attenuation: 'N·L × smoothstep(outer,inner,-dir·L) / ld²',
    diffuseBsdf: 'albedo / π',
    units: 'meters',
  };
  const oursSpot = {
    pos_m: _spotPosM?.toArray?.() ?? null,
    posPreset: activeSpotPosM().name,
    dir: [currentSpotDir().x, currentSpotDir().y, currentSpotDir().z],
    colorLine: SOT.spot.colorLineAndRange.slice(0, 3),
    innerCos: SOT.spot.innerCos,
    outerCos: SOT.spot.outerCos,
    attenuation: 'evalSpotLightData + evaluateSpotBsdf — IKEA evaluateLight',
    diffuseBsdf: 'albedo / π in FRAG',
    units: 'spotPosM world meters',
  };
  const ikeaSoft = {
    pipeline: ['transfer_depth', 'blur_16tap_H', 'blur_16tap_V', 'generate_plane'],
    resolution: SOT.soft.resolution,
    intensity: SOT.soft.intensity,
    referenceHeight_m: SOT.soft.referenceHeight_m,
    formula: 'alpha = 1 - exp(-max(0,h-refH)*intensity)',
    composite: 'floor darkening × (1-alpha)',
    emptyRoom: 'heightmap nz=0 → alpha=0',
    blurScale: null,
    planeFlipX: SOT.soft.planeFlipX,
    renderLayerMask: 2,
  };
  const oursSoft = {
    pipeline: _softState?.ready ? ikeaSoft.pipeline : null,
    resolution: SOFT_RES,
    intensity: SOT.soft.intensity,
    referenceHeight_m: SOT.soft.referenceHeight_m,
    formula: 'same in generatePass GLSL',
    composite: 'floor linear × (1-alpha); Soft AO dump clamp',
    emptyRoom: `casterCount=${_softState?.lastCasterCount ?? 0} → emptyAlphaTex`,
    blurOffsets: SOT.soft.blurOffsets.length,
    planeFlipX: true,
    renderLayer: SOFT_LAYER,
  };
  return {
    phase,
    layers: [
      {
        id: 0,
        key: 'canvas',
        ikea: { background: null, screenHex: SOT.canvasClearCss },
        ours: { background: SOT.canvasClearCss, exposurePost: EXPOSURE_POST },
        match: true,
        note: 'surround #F2F2F0; betraktaOutput phase 6',
      },
      {
        id: 1,
        key: 'ibl',
        ikea: { sh: 'preScaled SH9', envIntensity: 0.6, rotDeg: 80 },
        ours: { sh: 'SH_PRESCALED dump', envMapIntensity: ENV_INTENSITY, rotDeg: ENV_ROT_DEG },
        match: phase >= 1,
      },
      {
        id: 2,
        key: 'spot',
        ikea: ikeaSpot,
        ours: oursSpot,
        match: phase >= 2 && (_spotPosWorldMm ? Math.abs(_spotPosWorldMm.z - (expectedSpotWorldZMm(state.room) ?? 0)) < 2 : null),
      },
      {
        id: 3,
        key: 'softPlane',
        ikea: ikeaSoft,
        ours: oursSoft,
        match: phase >= 3 && (_softState?.ready ?? false),
      },
      {
        id: 4,
        key: 'softAo',
        ikea: {
          target: 'IBL only',
          notSpot: true,
          formula: 'ao *= 0.4+0.6*exp(-k*max(0,h-y)); ao²; mix intensity 1',
          k: 'mix(0.01, 2.5, nt²), nt = n.y*0.5+0.5',
          sampler: 'dump: .r nzMax 0.806 vs y_m (posM = mm×0.001)',
        },
        ours: {
          target: 'IBL only',
          notSpot: true,
          formula: 'computeSoftAoIbl in FRAG',
          heightMap: _softState?.heightMapTexture ? 'rtBlurV or emptyHeightTex' : null,
          softAoEnabled: phase >= 4,
        },
        match: phase >= 4 && (_softState?.heightMapTexture != null),
      },
      {
        id: 5,
        key: 'iblSpec',
        ikea: {
          ibl: 'mix(diffuse, specular, iblFresnel)',
          specSample: 'textureLod × envMapIntensity',
          parallax: 'parallaxCorrectNormal center/size',
          horizon: 'dFdx geometricNormal occlusion',
        },
        ours: {
          iblSpecEnabled: IKEA_V0_ACTIVE_PHASE >= 5 && _envSpecState?.ready,
          envMap: _envSpecState?.cube ? 'babylon .env spec cube' : _envSpecState?.error,
          mipLevels: ENV_MAP_MIP_LEVELS,
          centerM: [ENV_CENTER_M.x, ENV_CENTER_M.y, ENV_CENTER_M.z],
        },
        match: IKEA_V0_ACTIVE_PHASE >= 5 && !!_envSpecState?.ready,
      },
      {
        id: 6,
        key: 'exposure',
        ikea: {
          exposure: 2,
          forwardTonemap: false,
          output: 'sRGBtoRRT + ditherR11G11B10F + min(65000) → HDR FB',
        },
        ours: {
          exposure: exposureUniformValue(),
          screenCalEmpty: screenCalUniformValue(),
          betraktaOutput: betraktaOutputUniformValue() > 0,
          forwardTonemap: false,
          ldrAdapter: 'RRT pack + RRTtoSRGB → linear frag; Three outputColorSpace srgb',
        },
        match:
          IKEA_V0_ACTIVE_PHASE >= 6 &&
          exposureUniformValue() === EXPOSURE_POST &&
          screenCalUniformValue() === SCREEN_CAL_EMPTY,
      },
    ],
    blocked: ['Hemi', 'Ambient', '2nd Spot', 'room-betrakta-*', 'shadow map on walls'],
  };
}

/** Runbook: фазы 0–7 vs dump + light audit (для автономной сверки). */
export function auditIkeaV0PhaseRunbook() {
  const manifest = auditIkeaV0Manifest();
  const light = auditIkeaV0Light();
  const code = auditIkeaV0CodeCompare();
  const active = IKEA_V0_ACTIVE_PHASE;
  const steps = IKEA_V0_RUNBOOK.map((step) => ({
    ...step,
    enabled: step.id <= active,
    current: step.id === active,
  }));
  return {
    ok: light.ok !== false,
    cacheBust: IKEA_V0_CACHE_BUST,
    activePhase: active,
    dumpOrder: manifest.dumpOrder,
    steps,
    lightAudit: light,
    codeCompare: code,
    note: 'Dump-only — scales=1; visual эталон IKEA PAX empty',
  };
}

export function probeIkeaV0SoftHeightmapStats() {
  if (IKEA_V0_ACTIVE_PHASE < 3) {
    return { ok: false, reason: 'phase < 3', phase: IKEA_V0_ACTIVE_PHASE };
  }
  const renderer = state.renderer;
  const soft = _softState;
  if (!renderer || !soft?.ready) {
    return { ok: false, reason: 'soft pipeline not ready' };
  }
  updateSoftPlanePipeline(true);
  const tex = soft.heightMapTexture;
  const probeRt = soft.rtBlurV;
  const floorCasters = soft.lastCasterCount ?? 0;
  const heightCaptureCount = soft.lastHeightCaptureCount ?? floorCasters;
  const layer2AllMeshes = countSoftLayer2AllMeshes(state.scene);
  if (!tex || heightCaptureCount === 0) {
    return {
      ok: heightCaptureCount === 0,
      casterCount: floorCasters,
      heightCaptureCount,
      nzMax: 0,
      nzMean: 0,
      note: 'no layer-2 casters → empty heightmap (expected empty room)',
    };
  }
  const w = SOFT_RES;
  const h = SOFT_RES;
  const readFloat = soft.heightRtFloat === true;
  const buf = readFloat ? new Float32Array(w * h * 4) : new Uint8Array(w * h * 4);
  try {
    if (tex === soft.emptyHeightTex) {
      return {
        ok: false,
        casterCount: floorCasters,
        heightCaptureCount,
        nzMax: 0,
        nzMean: 0,
        reason: 'emptyHeightTex bound',
      };
    }
    renderer.readRenderTargetPixels(probeRt, 0, 0, w, h, buf);
  } catch (e) {
    return {
      ok: false,
      casterCount: floorCasters,
      heightCaptureCount,
      error: String(e?.message || e),
    };
  }
  let rawMax = 0;
  let rawNz = 0;
  try {
    const rawRt = soft.rtHeight;
    const raw = new Float32Array(w * h * 4);
    renderer.readRenderTargetPixels(rawRt, 0, 0, w, h, raw);
    for (let i = 0; i < w * h; i++) {
      const v = raw[i * 4];
      if (v > 1e-6) rawNz += 1;
      if (v > rawMax) rawMax = v;
    }
  } catch (_) {}
  let sum = 0;
  let max = 0;
  let nz = 0;
  for (let i = 0; i < w * h; i++) {
    const v = readFloat ? buf[i * 4] : buf[i * 4] / 255;
    if (v > 1e-6) nz += 1;
    sum += v;
    if (v > max) max = v;
  }
  const mean = sum / (w * h);
  const ikeaRef = {
    nzMean: 0.0074,
    nzMax: 0.281,
    nzPixels: 1190,
    rawNz: 170,
    rawMax: 0.73,
    totalPixels: 6400,
    note: 'IKEA CDP 2026-09-04 with cabinet: blurred get_blurred; raw≈_postprocess_target_backbuffer',
  };
  const ikeaCompare = {
    nzMeanOk: mean <= 0.15 || mean <= 2.5,
    nzPixelsOk: nz >= 800,
    nzMaxOk: max >= 0.2,
    rawNzOk: rawNz >= 100,
    tooWide: nz > 3000,
    tooNarrow: nz < 200,
    hint:
      rawNz < 100
        ? 'raw height sparse — horizontals not in Soft capture (IKEA raw nz≈170)'
        : max < 0.2
          ? 'blur peak low vs IKEA ~0.28'
          : null,
  };
  return {
    ok: rawNz >= 100 && nz >= 800,
    casterCount: floorCasters,
    heightCaptureCount,
    layer2AllMeshes,
    captureChain: 'dump-10x10',
    nzPixels: nz,
    nzMax: +max.toFixed(4),
    nzMaxM: +max.toFixed(4),
    nzMean: +mean.toFixed(6),
    resolution: SOFT_RES,
    readMode: readFloat ? 'float' : 'byte',
    viewportM: _softViewportM?.toArray?.() ?? null,
    viewportMeta: _softViewportMeta,
    ikeaRef,
    ikeaCompare,
    rawHeight: { nzPixels: rawNz, nzMax: +rawMax.toFixed(4), stage: 'rtHeight-pre-blur' },
    lastCaptureProxyCount: soft.lastCaptureProxyCount ?? null,
    lastCaptureTopQuadCount: soft.lastCaptureTopQuadCount ?? null,
    cacheBust: IKEA_V0_CACHE_BUST,
    softPipelineVer: SOFT_PIPELINE_VER,
    note: 'IKEA Soft: compare raw nz to ~170, blurred nz to ~1190 (not empty-room 1598); no Soft stamp',
  };
}

/**
 * Soft AO scale check — dump formula max(0, h - pos.y).
 * If h < pos.y on back → softAoComputed=1 (no darken) even when blurNz looks “OK”.
 */
export function probeIkeaV0SoftAoScale() {
  updateSoftPlanePipeline(true);
  const pipette = probeIkeaV0CabinetInteriorPipette();
  const hm = probeIkeaV0SoftHeightmapStats();
  const back = pipette.samples?.back?.hit ?? null;
  const mid = pipette.samples?.interiorMid?.hit ?? null;
  const hit = back || mid;
  const posY = hit?.posM?.[1] ?? null;
  const h =
    hit?.posM != null
      ? _sampleBlurredHeightAtXzM({ x: hit.posM[0], y: hit.posM[2] })
      : null;
  const delta = h != null && posY != null ? +(h - posY).toFixed(4) : null;
  const softAo =
    hit && h != null && posY != null
      ? _computeSoftAoIblJs(
          { x: hit.posM[0], y: hit.posM[1], z: hit.posM[2] },
          { x: hit.normal[0], y: hit.normal[1], z: hit.normal[2] }
        )
      : hit?.softAoComputed ?? null;
  let diagnosis = 'no back/interior hit — place cabinet + run pipette camera';
  if (hit && h != null && posY != null) {
    if (delta > 0.05 && softAo != null && softAo < 0.95) {
      diagnosis =
        'Soft AO active (h>pos.y) — rare on mid back; IKEA blur max≈0.28 so usually Spot getShadow darkens back';
    } else if (delta <= 0) {
      diagnosis =
        'OK expected: h<=pos.y → Soft AO≈1 on mid back (IKEA blur max≈0.28). Interior depth = Spot getShadow, not Soft stamp.';
    } else {
      diagnosis = 'WARN: h > pos.y but softAo still high — check softAoEnabled / UV edge clamp';
    }
  }
  return {
    ok: true,
    cacheBust: IKEA_V0_CACHE_BUST,
    softPipelineVer: SOFT_PIPELINE_VER,
    diagnosis,
    hitKind: hit?.kind ?? null,
    posM: hit?.posM ?? null,
    heightmapYm: h != null ? +h.toFixed(4) : null,
    posYm: posY != null ? +posY.toFixed(4) : null,
    heightMinusPosY: delta,
    softAoComputed: softAo,
    softAoEnabled: hit?.softAo ?? null,
    rawNz: hm?.rawHeight?.nzPixels ?? null,
    rawMax: hm?.rawHeight?.nzMax ?? null,
    blurNz: hm?.nzPixels ?? null,
    blurMax: hm?.nzMax ?? null,
    stampRemoved: true,
    formula: 'ao *= 0.4+0.6*exp(-k*max(0,h-pos.y)); ao*=ao',
    ikeaNote: 'back~150–170 = Spot getShadow; Soft AO not the back channel',
  };
}

export function auditIkeaV0SoftPlane() {
  if (IKEA_V0_ACTIVE_PHASE < 3) {
    return { ok: false, reason: 'phase < 3', phase: IKEA_V0_ACTIVE_PHASE };
  }
  return {
    ok: !!_softState?.ready,
    phase: IKEA_V0_ACTIVE_PHASE,
    resolution: SOFT_RES,
    referenceHeight_m: SOT.soft.referenceHeight_m,
    intensity: SOT.soft.intensity,
    size_m: SOT.soft.size_m,
    centerY_m: SOT.soft.centerY_m,
    viewportM: _softViewportM?.toArray?.() ?? null,
    casterCount: _softState?.lastCasterCount ?? 0,
    emptyRoomAlphaExpected: 0,
    pipelineSteps: ['depth_layer2', 'transfer_depth', 'blurH', 'blurV', 'generate', 'floor_composite'],
    ikeaDumpRef: 'IKEA-soft-shadow-sot-gl-v5.json',
  };
}

export function auditIkeaV0SoftAo() {
  if (IKEA_V0_ACTIVE_PHASE < 4) {
    return { ok: false, reason: 'phase < 4', phase: IKEA_V0_ACTIVE_PHASE };
  }
  return {
    ok: !!_softState?.heightMapTexture,
    phase: IKEA_V0_ACTIVE_PHASE,
    target: 'IBL only',
    spotUsesAo: false,
    formula: '0.4+0.6*exp(-k*max(0,h-y)); ao²; intensity=1',
    kRange: [0.01, 2.5],
    viewportM: _softViewportM?.toArray?.() ?? null,
    casterCount: _softState?.lastCasterCount ?? 0,
    emptyRoomAoExpected: 1,
    note: 'heightmap nz=0 → ao=1 on walls; corners need casters in layer 2',
    ikeaDumpRef: 'IKEA-betrakta-pbr-soft-spot-sot-20260826.md',
  };
}

export function auditIkeaV0IblSpec() {
  if (IKEA_V0_ACTIVE_PHASE < 5) {
    return { ok: false, reason: 'phase < 5', phase: IKEA_V0_ACTIVE_PHASE };
  }
  return {
    ok: !!(_envSpecState?.ready && _envSpecState.cube),
    phase: IKEA_V0_ACTIVE_PHASE,
    envLoaded: !!_envSpecState?.ready,
    error: _envSpecState?.error ?? null,
    mipLevels: ENV_MAP_MIP_LEVELS,
    centerM: [ENV_CENTER_M.x, ENV_CENTER_M.y, ENV_CENTER_M.z],
    sizeM: [ENV_SIZE_M.x, ENV_SIZE_M.y, ENV_SIZE_M.z],
    spotUsesSpec: false,
    note: 'subtle sheen on walls/floor; needs .env fetch',
    ikeaDumpRef: 'betrakta_brdf_ggx ibl() + getEnvironmentSpecularIrradiance',
  };
}

export function rebindIkeaRoomLightV0() {
  const room = state.room;
  if (!room?.group) return { bound: 0 };
  let n = 0;
  room.group.traverse((o) => {
    if (!o.isMesh) return;
    const kind = detectRoomMeshKind(o, room);
    if (!kind) return;
    if (bindRoomMesh(o, room)) n += 1;
    else if (o.material?.userData?.__cldIkeaV0) n += 1;
  });
  syncSpotUniformsOnScene();
  syncSoftUniformsOnScene();
  syncIblSpecUniformsOnScene();
  syncExposureUniformsOnScene();
  return { bound: n, shaderRev: IKEA_V0_SHADER_REV };
}

export function probeIkeaV0PipetteCompare() {
  const st = state;
  const renderer = st?.renderer;
  const scene = st?.scene;
  const camera = st?.camera;
  if (!renderer || !scene || !camera) return { ok: false, reason: 'no renderer/scene' };
  if (isIkeaHdrDisplayActive()) {
    resizeIkeaHdrDisplayPipeline(renderer.domElement.width, renderer.domElement.height);
    resetIkeaHdrAccumulation('pipette');
    const frames = ACCUM_FRAME_COUNT + 2;
    for (let i = 0; i < frames; i++) {
    renderIkeaRoomLightV0(renderer, scene, camera);
    }
  } else {
    renderer.render(scene, camera);
  }
  const px = new Uint8Array(4);
  const targets = _collectIkeaRoomPickTargets(scene);
  const tgt = SOT.emptyRoom?.screen ?? {};
  const tol = SOT.emptyRoom?.toleranceLum ?? 15;
  const samples = {};
  for (const [label, spec] of Object.entries(_PIPETTE_PICK_SPECS)) {
    samples[label] = _pipetteSampleFromSpec(renderer, px, camera, targets, spec);
  }
  const lums = Object.values(samples).map((s) => s.lum);
  const uniformReadSuspect =
    lums.length > 2 && Math.max(...lums) - Math.min(...lums) <= 2;
  const wallOk = Math.abs(samples.wallMid.lum - (tgt.wallMidLum ?? 209)) <= tol;
  const floorOk = Math.abs(samples.floorMid.lum - (tgt.floorMidLum ?? 185)) <= tol;
  const ceilOk = Math.abs(samples.ceilingMid.lum - (tgt.ceilingMidLum ?? 179)) <= tol;
  const wallSideDeltaEye = samples.wallMid.lum - samples.wallSide.lum;
  const wallCeilDelta = samples.wallMid.lum - samples.ceilingMid.lum;
  const floorCornerDelta = samples.floorMid.lum - (samples.floorCorner?.lum ?? samples.floorMid.lum);
  const topDown = isTopDownCamera(camera);
  const wallSideDelta = topDown ? null : wallSideDeltaEye;
  const spotPosM = _spotPosM
    ? _v3(_spotPosM.x, _spotPosM.y, _spotPosM.z)
    : null;
  let floorDisk = null;
  let linearSplit = null;
  if (spotPosM) {
    try {
      floorDisk = _auditFloorDiskWorld(renderer, px, camera, targets, spotPosM);
    } catch (e) {
      floorDisk = { ok: false, error: String(e?.message ?? e) };
    }
    try {
      linearSplit = _auditLinearSplitAtHits(samples, camera, spotPosM);
    } catch (e) {
      linearSplit = { ok: false, error: String(e?.message ?? e) };
    }
  }
  const floorDiskDelta =
    floorDisk?.displayDelta ??
    floorDisk?.linearDisplayDelta ??
    linearSplit?.floorDiskDeltaDisplay ??
    floorCornerDelta;
  const floorDiskOk =
    (floorDisk?.displayOk ?? false) ||
    (floorDisk?.linearDisplayDelta ?? 0) >= 18 ||
    (linearSplit?.floorDiskDeltaDisplay ?? 0) >= 18 ||
    (floorDisk?.linear?.centerMinusCornerLumLinear ?? 0) >= 0.12;
  const okBreakdown = {
    topDownCamera: topDown,
    wallLevel: topDown ? null : wallOk,
    floorLevel: floorOk,
    ceilingLevel: topDown ? null : ceilOk,
    wallSideGradient: topDown ? null : wallSideDeltaEye >= 18,
    wallCeilGradient: topDown ? null : wallCeilDelta >= 18 && wallCeilDelta <= 38,
    floorDisk,
  };
  const okNote = topDown
    ? `plan view — wallSideDelta N/A (was ${wallSideDeltaEye}); judge floorDiskDelta vs IKEA ~26`
    : wallOk && floorOk && ceilOk && wallSideDeltaEye < 18
      ? 'levels OK — only wallSideGradient (Spot wash back vs left) below IKEA ~28'
      : null;
  return {
    ok: topDown
      ? floorDiskOk
      : wallOk &&
        floorOk &&
        ceilOk &&
        samples.wallMid.lum < 250 &&
        wallSideDeltaEye >= 18 &&
        wallCeilDelta >= 18 &&
        wallCeilDelta <= 38,
    okNote,
    topDownCamera: topDown,
    okBreakdown,
    floorDisk,
    floorDiskDelta,
    floorDiskOk,
    linearSplit,
    cacheBust: typeof window !== 'undefined' ? window.__cldIkeaV0ManifestAudit?.()?.cacheBust : null,
    screenCalEmpty: screenCalUniformValue(),
    samples,
    targets: tgt,
    toleranceLum: tol,
    wallOk,
    floorOk,
    ceilOk,
    wallSideDelta,
    wallCeilDelta,
    floorCornerDelta,
    measuredLum: {
      wallMid: samples.wallMid?.lum ?? null,
      wallSide: samples.wallSide?.lum ?? null,
      ceilingMid: samples.ceilingMid?.lum ?? null,
      floorMid: samples.floorMid?.lum ?? null,
      floorCorner: samples.floorCorner?.lum ?? null,
    },
    ceilingHit: samples.ceilingMid?.hit ?? null,
    wallSideOk: topDown ? null : wallSideDeltaEye >= 18,
    wallCeilOk: topDown ? null : wallCeilDelta >= 18 && wallCeilDelta <= 38,
    uniformReadSuspect,
    pipetteReadSource: samples.wallMid?.readSource ?? null,
    accumReady: !!_hdrState?.accumReady,
    ikeaTarget: { wallSideDelta: 28, wallCeilDelta: 30 },
    ikeaRef: { wallMidLum: 213, floorMidLum: 178, note: 'Cursor browser 2026-08-28' },
  };
}

export function probeIkeaV0BuildVersion() {
  const manifest = auditIkeaV0Manifest();
  return {
    cacheBust: manifest.cacheBust ?? IKEA_V0_CACHE_BUST,
    cabinetLight: manifest.cabinetLight ?? null,
    activePhase: IKEA_V0_ACTIVE_PHASE,
    softPipelineVer: _softState?.version ?? null,
    spotPipelineVer: _spotShadowState?.version ?? null,
    debugSpotDisk: _debugSpotDisk,
    shaderRev: IKEA_V0_SHADER_REV,
  };
}

export function auditIkeaV0Exposure() {
  if (IKEA_V0_ACTIVE_PHASE < 6) {
    return { ok: false, reason: 'phase < 6', phase: IKEA_V0_ACTIVE_PHASE };
  }
  const hdr = isIkeaHdrDisplayActive();
  const calOk = screenCalUniformValue() === SCREEN_CAL_EMPTY;
  return {
    ok:
      exposureUniformValue() === EXPOSURE_POST &&
      betraktaOutputUniformValue() === 1 &&
      calOk &&
      hdr,
    phase: IKEA_V0_ACTIVE_PHASE,
    subPhase: hdr ? '6d-hdr' : '6g',
    exposureLinear: EXPOSURE_POST,
    screenCalBase: screenCalUniformValue(),
    screenCalEmptyLdr: SCREEN_CAL_EMPTY,
    screenCalFloor: SOT.spot.screenCalFloor,
    screenCalCabinet: SOT.spot.screenCalCabinet,
    hdrFloatFb: hdr,
    hdrMsaaSamples: _hdrState?.rt?.samples ?? 0,
    hdrSsScale: _hdrState?.ssScale ?? 0,
    hdrRtSize: _hdrState?.rtW && _hdrState?.rtH ? [_hdrState.rtW, _hdrState.rtH] : null,
    accumFrames: ACCUM_FRAME_COUNT,
    accumIndex: _hdrState?.accumIndex ?? 0,
    accumReady: !!_hdrState?.accumReady,
    accumJitterIndex: _hdrState?.jitterIndex ?? 0,
    hdrPipelineVer: HDR_PIPELINE_VER,
    hdrMsaaResolve: !!_hdrState?.rtResolved,
    displayFxaa: true,
    forwardTonemap: false,
    betraktaOutput: true,
    pipeline: hdr
      ? _hdrState?.accumRrtSpace
        ? 'MSAA(clear=surround RRT)→TAA×16 RRT→tonemap@blit→FXAA@canvas'
        : 'MSAA(clear=surround RRT)→TAA×16 γ→FXAA@canvas (legacy accum)'
      : 'LDR linear×cal×exposure',
    accumRrtSpace: !!_hdrState?.accumRrtSpace,
    cameraMoving: !!_hdrState?.cameraMoving,
    doorAnimating: !!_hdrState?.doorAnimating,
    sceneInteraction: !!_hdrState?.sceneInteraction,
    motionActive: !!_hdrState?.motionActive,
    hdrSurroundClearRrt: true,
    screenTargets: SOT.emptyRoom?.screen ?? null,
    ikeaDumpRef: 'betraktaOutput #else; IKEA renderToFloat live 2026-08-30',
  };
}

export function auditIkeaV0Spot() {
  const m = auditIkeaV0MaterialState();
  const pass =
    m.ok &&
    (IKEA_V0_ACTIVE_PHASE < 2 || (m.spotEnabledCount > 0 && m.spotWorldZOk !== false));
  return { pass, ...m };
}

export function auditIkeaV0Light() {
  const spot = auditIkeaV0Spot();
  const soft = auditIkeaV0SoftAo();
  return {
    pass: spot.pass && soft.ok !== false,
    phase: IKEA_V0_ACTIVE_PHASE,
    spot,
    soft,
  };
}

export function auditIkeaV0Cabinet() {
  const scene = state.scene;
  let cabinet = 0;
  let trim = 0;
  let layer2 = 0;
  let softAoOnCabinet = 0;
  let spotReceiveOnCabinet = 0;
  let spotCastOnCabinet = 0;
  let spotCastInstances = 0;
  let corpusBackMeshes = 0;
  let corpusBackReceive = 0;
  const instIds = new Set();
  scene?.traverse?.((o) => {
    if (!o?.isMesh || !o.material?.userData?.__cldIkeaV0) return;
    const ud = o.material.userData;
    if (!ud.__cldIkeaV0Cabinet) return;
    cabinet += 1;
    if (ud.__cldIkeaV0Kind === 'trim') trim += 1;
    if (ud.__cldIkeaV0Kind === 'corpus' || ud.__cldIkeaV0Kind === 'back') {
      corpusBackMeshes += 1;
      if (o.material.uniforms?.spotShadowReceive?.value > 0) corpusBackReceive += 1;
    }
    if (o.layers.mask & (1 << SOFT_LAYER)) layer2 += 1;
    if (o.material.uniforms?.softAoEnabled?.value > 0) softAoOnCabinet += 1;
    if (o.material.uniforms?.spotShadowReceive?.value > 0) spotReceiveOnCabinet += 1;
    if (o.layers.mask & (1 << SPOT_SHADOW_LAYER)) {
      spotCastOnCabinet += 1;
      const iu = o.userData?.__cldSpotShadowCastInstanceUuid;
      if (iu) instIds.add(iu);
    }
  });
  spotCastInstances = instIds.size;
  let trimOnLayer2 = 0;
  scene?.traverse?.((o) => {
    if (!o?.isMesh || o.material?.userData?.__cldIkeaV0Kind !== 'trim') return;
    if (o.layers.mask & (1 << SOFT_LAYER)) trimOnLayer2 += 1;
  });
  let trimOnLayer4 = 0;
  scene?.traverse?.((o) => {
    if (!o?.isMesh || o.material?.userData?.__cldIkeaV0Kind !== 'trim') return;
    if (o.layers.mask & (1 << SOFT_AO_SILHOUETTE_LAYER)) trimOnLayer4 += 1;
  });
  let trimOnSoftFloor = 0;
  scene?.traverse?.((o) => {
    if (!o?.isMesh || o.material?.userData?.__cldIkeaV0Kind !== 'trim') return;
    if (o.layers.mask & (1 << SOFT_FLOOR_LAYER)) trimOnSoftFloor += 1;
  });
  const expectSoftAo = IKEA_V0_ACTIVE_PHASE >= 4;
  const expectSpotReceive = IKEA_V0_ACTIVE_PHASE >= 7;
  return {
    ok:
      cabinet > 0 &&
      trimOnLayer2 === 0 &&
      trimOnLayer4 === 0 &&
      (trim === 0 || trimOnSoftFloor > 0) &&
      (expectSoftAo ? softAoOnCabinet > 0 : softAoOnCabinet === 0) &&
      (expectSpotReceive ? spotReceiveOnCabinet > 0 : spotReceiveOnCabinet === 0),
    phase: IKEA_V0_ACTIVE_PHASE >= 7 ? 'p7-atlas' : `p${IKEA_V0_ACTIVE_PHASE}`,
    roomPhase: IKEA_V0_ACTIVE_PHASE,
    cabinet,
    trim,
    layer2,
    trimOnLayer4,
    trimOnSoftFloor,
    softAoOnCabinet,
    spotReceiveOnCabinet,
    spotCastOnCabinet,
    spotCastInstances,
    corpusBackMeshes,
    corpusBackReceive,
    ikeaShaderRev: IKEA_V0_SHADER_REV,
    ikeaRefCastInstances: 15,
    spotShadowAtlas: IKEA_V0_ACTIVE_PHASE >= 7,
    spotShadowMapReady: !!(
      _spotShadowState?.mapRendered && (_spotShadowState?.casterInstanceCount ?? 0) > 0
    ),
    spotShadowPipelineVer: _spotShadowState?.version ?? null,
    trimOnLayer2,
    fixIfSpotReceiveZero:
      cabinet === 0
        ? 'Ctrl+F5 then __cldSyncAllRoomCabinetStudio() — no IKEA bind on furniture'
        : corpusBackMeshes === 0
          ? 'no corpus/back kinds — check detectCabinetMeshKind'
          : corpusBackReceive === 0 && IKEA_V0_ACTIVE_PHASE < 7
            ? 'room phase 7 required for getShadow on corpus/back'
            : corpusBackReceive === 0
              ? '__cldSyncAllRoomCabinetStudio() then orbit camera to refresh atlas'
              : null,
    note: 'p8z117: dump path — getShadow×Spot + SoftAO×IBL; no contact floors',
  };
}

export function probeIkeaV0FloorSoftAlpha() {
  if (IKEA_V0_ACTIVE_PHASE < 3) {
    return { ok: false, reason: 'phase < 3', phase: IKEA_V0_ACTIVE_PHASE };
  }
  const renderer = state.renderer;
  const soft = _softState;
  if (!renderer || !soft?.ready) {
    return { ok: false, reason: 'soft pipeline not ready' };
  }
  updateSoftPlanePipeline(true);
  if (soft.alphaTexture === soft.emptyAlphaTex || (soft.lastCasterCount ?? 0) === 0) {
    return {
      ok: true,
      alphaMax: 0,
      note: 'no floor casters — emptyAlphaTex',
      doubleComposite: false,
    };
  }
  const w = SOFT_RES;
  const h = SOFT_RES;
  const buf = new Uint8Array(w * h * 4);
  try {
    renderer.readRenderTargetPixels(soft.rtAlpha, 0, 0, w, h, buf);
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
  let maxA = 0;
  let nzA = 0;
  for (let i = 0; i < w * h; i++) {
    const a = buf[i * 4 + 3] / 255;
    if (a > 1e-4) nzA += 1;
    if (a > maxA) maxA = a;
  }
  return {
    ok: maxA > 0 && maxA <= 0.45,
    alphaMax: +maxA.toFixed(4),
    nzAlphaPixels: nzA,
    ikeaRef: { alphaMaxSubtle: 0.15, alphaMaxHard: 0.45 },
    tooDark: maxA > 0.55,
    doubleComposite: false,
    compositePath: 'floor FRAG: linear *= (1 - sampleSoftPlaneAlpha); once; spotShadowReceive=0',
    footprintM: _softFootprintM?.toArray?.() ?? null,
    casterCount: soft.lastCasterCount ?? 0,
    hint:
      maxA > 0.55
        ? 'floor alpha too high — transfer_depth: check depth>=1 discard + invVP'
        : null,
  };
}

export function probeIkeaV0FloorContact() {
  const room = state.room;
  const fp = _softFootprintM?.clone?.() ?? null;
  let floorSoftOn = false;
  let floorSpotReceive = null;
  state.scene?.traverse?.((o) => {
    if (!o.isMesh || o.material?.userData?.__cldIkeaV0Kind !== 'floor') return;
    const u = o.material.uniforms;
    if (u?.softPlaneEnabled?.value > 0) floorSoftOn = true;
    if (u?.spotShadowReceive) floorSpotReceive = u.spotShadowReceive.value;
  });
  const frontZm = room ? (room.depth * 0.85 + (room.group?.position?.z ?? 0)) * MM_TO_M : null;
  const underCabZm = fp ? (fp.y + fp.w) * 0.5 : null;
  return {
    cause:
      'Soft plane was dimming spot via blurred heightmap alpha everywhere; p7r gates by cabinet bbox XZ',
    floorSoftPlaneOn: floorSoftOn,
    floorSpotShadowReceive: floorSpotReceive,
    footprintM: fp?.toArray?.() ?? null,
    casterCount: _softState?.lastCasterCount ?? 0,
    viewportM: _softViewportM?.toArray?.() ?? null,
    sampleFrontFloorInsideFootprint:
      frontZm != null && fp
        ? frontZm >= fp.y && frontZm <= fp.w
        : null,
    ok: !floorSoftOn || (fp != null && fp.z > fp.x && frontZm != null && frontZm > fp.w),
  };
}

export function probeIkeaV0InteriorShadow() {
  const scene = state.scene;
  if (!scene) return { ok: false, reason: 'no scene' };
  let back = null;
  let backTemplate = 0;
  let backKind = 0;
  let shelfH = null;
  let side = null;
  let softAoOn = 0;
  let spotReceiveOn = 0;
  scene.traverse((o) => {
    if (!o?.isMesh || !o.material?.userData?.__cldIkeaV0Cabinet) return;
    const kind = o.material.userData.__cldIkeaV0Kind;
    const u = o.material.uniforms;
    if (u?.softAoEnabled?.value > 0) softAoOn += 1;
    if (u?.spotShadowReceive?.value > 0) spotReceiveOn += 1;
    const sample = {
      name: o.name,
      kind,
      spotFloor: u?.spotShadowSpotFloor?.value ?? null,
      spotReceive: u?.spotShadowReceive?.value ?? null,
      softAo: u?.softAoEnabled?.value ?? null,
      orient: panelOrientationForMesh(o),
    };
    if (kind === 'back') backKind += 1;
    if (o.userData?.cldUseTemplateMaterial) backTemplate += 1;
    if (kind === 'back' && !back) {
      const d = u?.diffuse?.value;
      back = {
        ...sample,
        diffuseLinear: d ? [+d.x.toFixed(4), +d.y.toFixed(4), +d.z.toFixed(4)] : null,
        roughness: u?.roughness?.value ?? null,
      };
    }
    if (kind === 'corpus' && panelOrientationForMesh(o) === 'h' && !shelfH) shelfH = sample;
    if (kind === 'corpus' && panelOrientationForMesh(o) !== 'h' && !side) side = sample;
  });
  const ss = _spotShadowState;
  const hm = probeIkeaV0SoftHeightmapStats();
  const pipette = probeIkeaV0CabinetInteriorPipette();
  return {
    ok:
      pipette.ok === true &&
      spotReceiveOn > 0 &&
      (IKEA_V0_ACTIVE_PHASE < 4 || softAoOn > 0),
    task1Pipette: pipette,
    roomPhase: IKEA_V0_ACTIVE_PHASE,
    spotFloor: SPOT_SHADOW_SPOT_FLOOR,
    backKindCount: backKind,
    backTemplateMeshCount: backTemplate,
    softAoOnCabinetMeshes: softAoOn,
    spotReceiveOnCabinetMeshes: spotReceiveOn,
    heightCaptureCount: _softState?.lastHeightCaptureCount ?? null,
    heightmap: hm?.ok != null ? { ok: hm.ok, nzMax: hm.nzMax, nzPixels: hm.nzPixels, mode: hm.viewportMeta?.mode } : null,
    casterInstanceCount: ss?.casterInstanceCount ?? null,
    samples: { back, shelfH, side },
    note: 'IKEA dump: getShadow + Soft AO on corpus/back — __cldIkeaV0CabinetInteriorPipette()',
  };
}

export function probeIkeaV0ShelfShadowAudit() {
  const pipette = probeIkeaV0CabinetInteriorPipette();
  const spot = probeIkeaV0SpotShadow();
  const hm = probeIkeaV0SoftHeightmapStats();
  const shelfHit = pipette.samples?.shelfTop?.hit ?? null;
  const horizontalCasters = (spot.casterNames ?? []).filter((nm) => {
    const n = String(nm).toLowerCase();
    return /полк|shelf|дно|ящик|drawer|deck|lid|крыш|top|bottom|дно/i.test(n);
  });
  const parametricShelfCasters = (spot.casterNames ?? []).filter((nm) =>
    /полка_core/i.test(String(nm))
  );
  const softAoOnTop = shelfHit?.softAoComputed ?? null;
  const heightAtShelf = shelfHit?.posM
    ? _sampleBlurredHeightAtXzM({ x: shelfHit.posM[0], y: shelfHit.posM[2] })
    : null;
  const posYm = shelfHit?.posM?.[1] ?? null;
  const heightDiff = heightAtShelf != null && posYm != null ? +(heightAtShelf - posYm).toFixed(4) : null;
  const diagnosis =
    softAoOnTop != null && softAoOnTop < 0.92 && (shelfHit?.normal?.[1] ?? 0) > 0.65
      ? 'FAIL: Soft AO crushes +Y shelf top'
      : (hm?.nzMax ?? 0) < 0.45
        ? 'FAIL: Soft height blur nzMax still sparse — shelves not filling footprint'
        : parametricShelfCasters.length === 0
          ? 'WARN: no Полка_core in spot atlas — IKEA tnparn shelves cast (p8z138)'
          : 'PASS: soft height filled + shelf spot casters (dump Soft AO + getShadow, no face skips)';
  return {
    ok: diagnosis.startsWith('PASS'),
    cacheBust: IKEA_V0_CACHE_BUST,
    shaderRev: IKEA_V0_SHADER_REV,
    spotPipelineVer: SPOT_SHADOW_PIPELINE_VER,
    softPipelineVer: SOFT_PIPELINE_VER,
    diagnosis,
    shelfTopPipette: pipette.samples?.shelfTop ?? null,
    softAoOnShelfTop: softAoOnTop,
    shelfNormalY: shelfHit?.normal?.[1] ?? null,
    heightmapYmAtShelfXz: heightAtShelf,
    posMYm: posYm,
    heightDiffYm: heightDiff,
    spotCasterCount: spot.casterMeshCount ?? spot.casterCount ?? null,
    spotCasterInstances: spot.casterInstanceCount ?? null,
    parametricShelfCasters,
    horizontalCasterNames: horizontalCasters,
    heightmapNzMax: hm?.nzMax ?? null,
    revertedLayers: {
      contactFloors: 'removed p8z116',
      shelfBandContact: 'removed p8z114',
      parametricShelfSpotCast: 'removed p8z134 (was p8z132 kostyl)',
      wallCone: 'frozen off',
    },
    ikeaPath: 'between-shelf bands = Spot getShadow; Soft AO IBL only (blur max≈0.28); Soft stamp removed r3j66',
    note: 'Ctrl+F5 r3j66 → __cldIkeaV0SpotShadowProbe(); shelf names in casterNames; back pipette ~150–170',
  };
}

export function probeIkeaV0SpotShadow() {
  const ss = _spotShadowState;
  const dm = ss?.depthMaterial;
  const names = [];
  collectSpotShadowCastBuckets(state.scene).forEach((b) => {
    b.meshes.forEach((m) => names.push(m.name || m.uuid));
  });
  return {
    ok: IKEA_V0_ACTIVE_PHASE >= 7 && !!ss?.mapTexture && !!ss?.mapRendered && (ss?.casterInstanceCount ?? 0) > 0,
    punctualMode: _punctualMode,
    lastBakeMs: ss?.lastBakeMs ?? null,
    lastBakeMode: ss?.lastBakeMode ?? null,
    casterCount: ss?.casterMeshCount ?? ss?.casterCount ?? 0,
    casterMeshCount: ss?.casterMeshCount ?? ss?.casterCount ?? 0,
    casterInstanceCount: ss?.casterInstanceCount ?? null,
    casterNames: names,
    ikeaRefCasterInstances: 15,
    active: IKEA_V0_ACTIVE_PHASE >= 7,
    mapSize: SPOT_SHADOW_MAP_SIZE,
    fovDeg: SPOT_SHADOW_FOV_DEG,
    nearMm: m2mm(SOT.spot.shadowNear_m),
    farMm: m2mm(SOT.spot.shadowFar_m),
    units: 'mm',
    compare: 'LEQUAL',
    sampler: 'sampler2DShadow',
    version: ss?.version ?? null,
    spotFloor: SPOT_SHADOW_SPOT_FLOOR,
    pcfScale: SPOT_SHADOW_PCF_SCALE,
    jitterPhase: _spotShadowJitterPhase,
    jitterIndex: _hdrState?.jitterIndex ?? null,
    accumIndex: _hdrState?.accumIndex ?? null,
    polygonOffset: dm
      ? { factor: dm.polygonOffsetFactor, units: dm.polygonOffsetUnits }
      : null,
    dumpBias: { factor: SOT.spot.shadowBiasFactor, units: SOT.spot.shadowBiasUnits },
    depthSide: dm?.side === THREE.FrontSide ? 'FrontSide' : dm?.side,
    note: 'Phase 7 getShadow atlas — not Three mesh.receiveShadow',
  };
}

/**
 * Сверка состояния сразу после загрузки комнаты vs IKEA empty dump (ALL-empty / v0-empty).
 * Запуск: Ctrl+F5 → шаг 2 → __cldIkeaV0RoomLoadAudit()
 */
export function auditIkeaV0RoomLoad() {
  const scene = state.scene;
  const room = state.room;
  const renderer = state.renderer;
  const camera = state.camera;
  if (!scene || !room || !renderer) {
    return { ok: false, reason: 'scene/room/renderer missing — дождитесь init()' };
  }

  const ikeaDump = {
    ambientIntensity: 0,
    punctualCount: 1,
    spotPosLocal_m: SOT.spot.defaultPos_m,
    spotDir: SOT.spot.dir,
    spotColorLine: SOT.spot.colorLineAndRange.slice(0, 3),
    softCenter_m: { x: 0, y: SOT.soft.centerY_m, z: SOT.spot.defaultPos_m.z },
    softSize_m: SOT.soft.size_m,
    softRefH_m: SOT.soft.referenceHeight_m,
    softRenderMask: 2,
    exposure: SOT.exposure,
    sceneBackground: null,
    surroundHex: SOT.canvasClearCss,
    envIntensity: SOT.env.intensity,
    cameraFovRad: SOT.cameraFovRad,
    wallLinear: SOT.wall.linear,
    floorTint: SOT.floor.tint,
    heightmapEmpty: true,
  };

  const lights = [];
  scene.traverse((o) => {
    if (o.isLight) lights.push(o.type);
  });

  let ikeaMeshes = 0;
  let basicVisible = 0;
  const meshKinds = [];
  scene.traverse((o) => {
    if (!o.isMesh || o.visible === false) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m) => {
      if (m.visible === false) return;
      if (m.userData?.__cldIkeaV0) {
        ikeaMeshes += 1;
        meshKinds.push(m.userData.__cldIkeaV0Kind);
      } else if (m.isMeshBasicMaterial) basicVisible += 1;
    });
  });

  const floorMesh = room.floorCoating;
  const floorMap = floorMesh?.material?.uniforms?.albedoMap?.value ?? null;
  const floorMapCs = floorMap?.colorSpace ?? floorMap?.encoding ?? null;
  const floorManualSrgb = !!floorMap?.userData?.__cldIkeaV0MapManualSrgb;

  const clearHex = (() => {
    try {
      const c = new THREE.Color();
      renderer.getClearColor(c);
      return `#${c.getHexString()}`;
    } catch {
      return null;
    }
  })();

  const spotWorldMm = _spotPosWorldMm?.toArray?.() ?? null;
  const spotWorldM = _spotPosM?.toArray?.() ?? null;
  const expZ = expectedSpotWorldZMm(room);

  const checks = {
    noThreeLights: lights.length === 0,
    sceneBackgroundNull: scene.background === null,
    clearSurround:
      clearHex?.toLowerCase() === SOT.canvasClearCss ||
      clearHex?.toLowerCase() === '#f2f2f0',
    ikeaMeshesBound: ikeaMeshes >= 9,
    noBasicVisible: basicVisible === 0,
    spotWorldZ: spotWorldMm ? Math.abs(spotWorldMm[2] - expZ) < 2 : false,
    spotWorldY: spotWorldMm ? Math.abs(spotWorldMm[1] - m2mm(SOT.spot.y_m)) < 2 : false,
    floorMapNoColorSpace:
      !floorMap || floorMapCs === 'no-color-space' || floorMapCs === 3000,
    floorMapManualSrgb: !floorMap || floorManualSrgb,
    shReady: !!_shUniform,
    softPipelineReady: IKEA_V0_ACTIVE_PHASE < 3 || !!_softState?.ready,
    heightmapEmpty: (_softState?.lastHeightCaptureCount ?? 0) === 0,
    envNotThreePmrem: !scene.environment,
    phase: IKEA_V0_ACTIVE_PHASE,
  };

  const fails = Object.entries(checks)
    .filter(([k, v]) => v === false && k !== 'phase')
    .map(([k]) => k);

  const cameraFovDeg = camera?.fov ?? null;
  const ikeaFovDeg = THREE.MathUtils.radToDeg(SOT.cameraFovRad);

  return {
    ok: fails.length === 0,
    fails,
    ikeaDumpRef: 'IKEA-dump-v0-empty.js + ALL-empty-live-20260828',
    ours: {
      initOrder: 'initScene→camera→renderer→env→lights→room→installIkeaRoomLightV0',
      ikeaMeshes,
      meshKinds,
      basicVisible,
      lights,
      sceneBackground: scene.background,
      clearHex,
      spotWorldMm,
      spotWorldM,
      spotExpectedWorldZMm: expZ,
      softViewportM: _softViewportM?.toArray?.() ?? null,
      softCasterCount: _softState?.lastCasterCount ?? 0,
      floorMapUrl: floorMap?.image?.src?.slice?.(-60) ?? null,
      floorMapColorSpace: floorMapCs,
      floorMapManualSrgb: floorManualSrgb,
      cameraFovDeg: cameraFovDeg != null ? +cameraFovDeg.toFixed(1) : null,
      iblSpecReady: !!(_envSpecState?.ready && _envSpecState.cube),
      iblSpecError: _envSpecState?.error ?? null,
    },
    ikeaDump,
    notes: [
      cameraFovDeg != null && Math.abs(cameraFovDeg - ikeaFovDeg) > 2
        ? `camera FOV ${cameraFovDeg}° ≠ dump ${ikeaFovDeg.toFixed(1)}° (SOT.cameraFovRad 0.8)`
        : null,
      'floor JPG onLoad → __cldResyncIkeaRoomFloorMap (Room.js)',
      'room resize → installIkeaRoomLightV0 (room-manager p8r)',
    ].filter(Boolean),
  };
}

function auditIkeaV0TextureUpload() {
  const issues = [];
  const scan = (tex, label) => {
    if (!tex?.isTexture) return;
    if (tex.isDataTexture) return;
    if (!isTextureGpuUploadReady(tex)) return;
    if (!mapGpuUploadReady(tex)) {
      issues.push({
        label,
        format: tex.format,
        rgbaCanvas: !!tex.userData?.__cldIkeaV0RgbaCanvas,
        needsUpdate: !!tex.needsUpdate,
      });
    }
  };
  const room = state.room;
  scan(room?.floorTexture, 'room.floorTexture');
  scan(room?.floorCoating?.material?.uniforms?.albedoMap?.value, 'floor.albedoMap');
  scan(_wallNormalTex, 'wallNormal');
  return { ok: issues.length === 0, issues };
}

if (typeof window !== 'undefined') {
  window.__cldBuildVersion = probeIkeaV0BuildVersion;
  window.__cldIkeaV0CopyJson = (obj) => {
    const s = JSON.stringify(obj, null, 2);
    if (typeof copy === 'function') copy(s);
    else console.log(s);
    return s;
  };
  window.__cldPrepareIkeaV0Map = prepareSrgbMapForCustomShader;
  window.__cldResyncIkeaRoomFloorMap = (mapOrRoom, mapOverride) => {
    if (mapOrRoom?.floorCoating) return resyncIkeaRoomFloorMap(mapOrRoom, mapOverride);
    return resyncIkeaRoomFloorMap(state.room, mapOrRoom);
  };
  window.__cldIkeaFloorMapStatus = _auditFloorTextureStatus;
  window.__cldIkeaV0TextureUploadAudit = auditIkeaV0TextureUpload;
  window.__cldIkeaV0RoomLoadAudit = auditIkeaV0RoomLoad;
  window.__cldIkeaV0AuditLight = auditIkeaV0Light;
  window.__cldIkeaV0CabinetAudit = auditIkeaV0Cabinet;
  /** Alias — в чате ошибочно называли AuditCabinet вместо CabinetAudit. */
  window.__cldIkeaV0AuditCabinet = auditIkeaV0Cabinet;
  window.__cldIkeaV0SoftHeightProbe = probeIkeaV0SoftHeightmapStats;
  window.__cldIkeaV0SoftAoScaleProbe = probeIkeaV0SoftAoScale;
  window.__cldIkeaV0FloorSoftAlphaProbe = probeIkeaV0FloorSoftAlpha;
  window.__cldIkeaV0FloorContactProbe = probeIkeaV0FloorContact;
  window.__cldIkeaV0CabinetInteriorPipette = probeIkeaV0CabinetInteriorPipette;
  window.__cldIkeaV0CabinetAtlasSplit = probeIkeaV0CabinetAtlasSplit;
  window.__cldApplyIkeaCabinetPipetteCamera = applyIkeaCabinetPipetteCamera;
  window.__cldIkeaV0InteriorShadowProbe = probeIkeaV0InteriorShadow;
  window.__cldIkeaV0ShelfShadowAudit = probeIkeaV0ShelfShadowAudit;
  window.__cldIkeaV0SpotShadowProbe = probeIkeaV0SpotShadow;
  window.__cldIkeaV0SoftAoOff = setIkeaV0SoftAoOff;
  window.__cldIkeaV0ShadowPcfScale = setIkeaV0ShadowPcfScale;
  window.__cldIkeaV0SpotPosPreset = setIkeaV0SpotPosPreset;
  window.__cldIkeaV0ShSource = setIkeaV0ShSource;
  window.__cldIkeaV0PunctualMode = setIkeaV0PunctualMode;
  window.__cldIkeaV0ShadowAbUI = showIkeaV0ShadowAbUI;
  try {
    const mountAb = (tries = 0) => {
      if (
        !document.getElementById('scene-icons-container') &&
        !document.getElementById('canvas-container') &&
        tries < 40
      ) {
        setTimeout(() => mountAb(tries + 1), 50);
        return;
      }
      showIkeaV0ShadowAbUI(true);
    };
    mountAb();
  } catch (_) {}
  window.__cldIkeaV0RestoreCabinetVisibility = restoreIkeaV0CabinetMeshVisibility;
  window.__cldIkeaV0SpotProbe = probeIkeaV0SpotAttenuation;
  window.__cldIkeaV0CodeCompare = auditIkeaV0CodeCompare;
  window.__cldIkeaV0Runbook = auditIkeaV0PhaseRunbook;
  window.__cldIkeaV0SoftPlaneAudit = auditIkeaV0SoftPlane;
  window.__cldIkeaV0SoftAoAudit = auditIkeaV0SoftAo;
  window.__cldIkeaV0CabinetOcclusionAudit = auditIkeaV0CabinetOcclusion;
  window.__cldIkeaV0SetCavityLevel = setIkeaV0CavityLevel;
  window.__cldIkeaV0SetCabinetWhite = setIkeaV0CabinetWhite;
  window.__cldIkeaV0SetCabinetGain = setIkeaV0CabinetGain;
  window.__cldIkeaV0SetRoomDim = setIkeaV0RoomDim;
  window.__cldResetIkeaHdrAccum = resetIkeaHdrAccumulation;
  window.__cldReinitIkeaHdrAfterWebGlRestore = reinitIkeaHdrAfterWebGlRestore;
  window.__cldEnsureIkeaHdrPipeline = ensureIkeaHdrPipelineReady;
  window.__cldIsIkeaHdrDisplayActive = isIkeaHdrDisplayActive;
  window.__cldInvalidateIkeaCamUniformMats = invalidateIkeaCamUniformMats;
  window.__cldIkeaV0SetPanelEdgeAo = setIkeaV0PanelEdgeAo;
  window.__cldIkeaV0SetLed = setIkeaV0Led;
  window.__cldIkeaV0GetLed = getIkeaV0Led;
  window.__cldIkeaV0GetLedDefaults = getIkeaV0LedDefaults;
  window.__cldIkeaV0CavityTuneUI = showIkeaV0CavityTuneUI;
  try {
    const q = new URLSearchParams(location.search);
    const open = q.get('cavityTune') === '1';
    const mount = (tries = 0) => {
      if (!document.getElementById('scene-icons-container') && tries < 40) {
        setTimeout(() => mount(tries + 1), 50);
        return;
      }
      showIkeaV0CavityTuneUI(open ? 'expand' : true);
    };
    mount();
  } catch (_) {}
  window.__cldIkeaV0IblSpecAudit = auditIkeaV0IblSpec;
  window.__cldIkeaV0ExposureAudit = auditIkeaV0Exposure;
  window.__cldIkeaV0DisplayPath = probeIkeaV0DisplayPath;
  window.__cldIkeaV0RadialDiskProfile = probeIkeaV0RadialDiskProfile;
  window.__cldIkeaV0RrtDiskProbe = probeIkeaV0RrtDiskProbe;
  window.__cldIkeaV0FloorRrtReadback = probeIkeaV0FloorRrtReadback;
  window.__cldIkeaV0FloorDiskCamera = applyIkeaFloorDiskAuditCamera;
  window.__cldIkeaV0ResetAccum = () => resetIkeaHdrAccumulation('console');
  window.__cldIkeaV0PipetteCompare = probeIkeaV0PipetteCompare;
  /** Alias — в SoT/чате как __cldVerifyIkeaEmptyRoom. */
  window.__cldVerifyIkeaEmptyRoom = probeIkeaV0PipetteCompare;
  window.__cldIkeaV0RebindRoom = rebindIkeaRoomLightV0;
  window.__cldIkeaV0RadianceSplit = probeIkeaV0RadianceSplit;
  window.__cldIkeaV0DebugSpotDisk = setIkeaV0DebugSpotDisk;
  window.__cldIkeaV0SetPhase = () => {
    console.warn('[IKEA v0] __cldIkeaV0SetPhase blocked — меняй IKEA_V0_ACTIVE_PHASE в manifest + согласие в чате');
    return IKEA_V0_ACTIVE_PHASE;
  };
}
