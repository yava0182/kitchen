import * as THREE from '/node_modules/three/build/three.module.js';
import { OrbitControls } from '/node_modules/three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from '/node_modules/three/examples/jsm/controls/TransformControls.js';
import { RoomEnvironment } from '/node_modules/three/examples/jsm/environments/RoomEnvironment.js';
import { RGBELoader } from '/node_modules/three/examples/jsm/loaders/RGBELoader.js';
import { RectAreaLightUniformsLib } from '/node_modules/three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { RenderPass } from '/node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import { SSAOPass } from '/node_modules/three/examples/jsm/postprocessing/SSAOPass.js';
import { OutputPass } from '/node_modules/three/examples/jsm/postprocessing/OutputPass.js';
import { CSS2DObject, CSS2DRenderer } from '/node_modules/three/examples/jsm/renderers/CSS2DRenderer.js';
import { RoundedBoxGeometry } from '/node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from '/node_modules/three/examples/jsm/loaders/FBXLoader.js';

if (typeof globalThis !== 'undefined') {
  if (!globalThis.THREE) globalThis.THREE = THREE;
  if (!globalThis.GLTFLoader) globalThis.GLTFLoader = GLTFLoader;
  if (!globalThis.FBXLoader) globalThis.FBXLoader = FBXLoader;
}

import { attachHingeHoleOutlines } from '/js/utils/hinge-hole-outlines.js';
import { isFlatCatalogShelfSpec } from '/js/furniture/furniture-flat-shelf-detect.js?v=20260703-drawer-fix';
import {
  getJointTemplatePlacementsUnified,
  resolveJointFittingRolesUnified,
  resolveJointDrillTemplateSetupType,
  resolveJointHoleTargetPanel,
  jointTemplateHolesForSetup,
  jointSeamWorldPoint,
  identifySetup3FaceEdgePanels,
  identifySetup3TemplateRoles,
  applyJointTemplateFacingFlip,
  resolveJointSchemeStationsMm,
  resolveJointSeamLenMm,
  jointSeamGeomLenPreferContactMm,
  jointSeamSegmentFromContact,
} from '/js/joint-fitting-resolve.js?v=20260727-drawer-holes';
import {
  panelParentSizeMm,
} from '/js/joint-panel-local.js?v=20260725-facade-as-detail';
import {
  cldPathCreateSectionPoints,
  cldPathShapeFromPoints,
  cldPathBuildTrajectoryMm,
  cldPathCurveFromMm,
  cldPathApplyExtrudeOrientation,
  cldPathResolveSectionSizeMm,
} from '/js/constructor/cld-path-groove.js?v=20260726-path-v3';
import {
  getJointStripeFrameWorld,
  panelFaceType,
  thinAxisForOrientation,
  setJointCarcassContext,
} from '/js/panel-edge-frame.js';
import {
  jointContactTolerancesScene,
  boxDotInterval,
  measureJointNeighborPair,
  JOINT_THICKNESS_MIN_MM,
  JOINT_THICKNESS_MAX_MM,
  JOINT_CONTACT_OVERLAP_MIN_MM,
} from '/js/joint-panel-contact.js?v=20260725-toret-plast-v6';
import {
  detectJointContact as detectJointContactV2,
  findNeighborForJoint as findNeighborForJointV2,
  detectReverseContactsOnPlasts as detectReverseContactsOnPlastsV2,
  resolveJointContactForIdx as resolveJointContactForIdxV2,
  debugDumpPanels as debugDumpPanelsV2,
  isToretsPlastPair as isToretsPlastPairV2,
  listToretsPlastContacts as listToretsPlastContactsV2,
} from '/js/joint-engine-v2.js?v=20260725-toret-plast-v6';
import {
  detectToretsAgainstPlast,
  addToretsPlastDebugRibbon,
  buildToretsPlastGroups,
  contactConditionKey,
} from '/js/joint-toret-plast-detect.js?v=20260725-toret-plast-v24';
import * as __cldBufGeomUtils from '/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  catalogScreenshotExportSize,
  cropDataUrlToCatalogIconAspect,
  normalizeCatalogIconAspect,
} from '../furniture/catalog-icon-aspect.js?v=20260621-icon-low-top';

// Референс: минимальные логи при загрузке

const app = document.getElementById('app');
const __CLD_CONTEXT = new URLSearchParams(window.location.search).get('context') || '';
if (!(app instanceof HTMLElement)) {
  throw new Error('#app not found');
}

// Embedded mode (для iframe в админке): скрываем правый UI если он есть.
try {
  const params = new URLSearchParams(window.location.search);
  const embedded = params.get('embedded') === '1';
  if (embedded) {
    const ui = document.getElementById('ui');
    if (ui) ui.style.display = 'none';
    const layout = document.querySelector('.layout');
    if (layout && layout.style) {
      layout.style.gridTemplateColumns = '1fr';
    }
    document.body.style.overflow = 'hidden';
  }
} catch {}

/** Превью в iframe админки: embedded=1 — дублируем отладочные сообщения в консоль родителя (postMessage). */
let __cldEmbeddedPreview = false;
try {
  __cldEmbeddedPreview = new URLSearchParams(window.location.search).get('embedded') === '1';
  if (__cldEmbeddedPreview && typeof window !== 'undefined') {
    // В админ-превью присадка из каталога петли; красные debug-контуры не нужны.
    window.__CLD_SHOW_HINGE_HOLE_OUTLINES = false;
  }
} catch (_) {}

function __cldShouldDrawHingeHoleOutlines() {
  // Hardcoded Ø35 overlay — off. Присадка только из шаблона tid.
  return false;
}

function __cldSafeDataForPostMessage(data) {
  if (data == null) return null;
  try {
    return JSON.parse(
      JSON.stringify(data, (_k, v) => {
        if (typeof v === 'bigint') return String(v);
        if (typeof v === 'function' || typeof v === 'symbol') return undefined;
        return v;
      })
    );
  } catch (_) {
    try {
      return { _cldNonSerializable: true, hint: String(data) };
    } catch (__) {
      return null;
    }
  }
}

function __cldPreviewBridgeLog(channel, level, msg, data) {
  try {
    const p = `[CLD][${channel}]`;
    if (level === 'warn') console.warn(p, msg, data !== undefined ? data : '');
    else console.info(p, msg, data !== undefined ? data : '');
    if (
      __cldEmbeddedPreview &&
      typeof window !== 'undefined' &&
      window.parent &&
      window.parent !== window
    ) {
      window.parent.postMessage(
        {
          type: 'cld:previewDebug',
          channel: String(channel || 'preview'),
          level: level || 'info',
          msg: String(msg || ''),
          data: __cldSafeDataForPostMessage(data === undefined ? null : data),
        },
        '*'
      );
    }
  } catch (_) {}
}

void (async () => {
  try {
    if (typeof window.ClodisDrillRegistry !== 'undefined' && typeof window.ClodisDrillRegistry.ensureLoaded === 'function') {
      await window.ClodisDrillRegistry.ensureLoaded();
    }
  } catch (e) {
    console.warn('[Clodis][constructor-clodis] drill registry:', e);
  }
})();

// Constructor constants (legacy-aligned)
// Референс использует units = 0xA (10) → 1 сцена-юнит = 10мм (1см)
const UNITS_MM = 10;
// Пользователь просил убрать "подложку" (пол) под секцией
const SHOW_FLOOR_UNDERLAY = false;

/**
 * Логи превью: только явно (иначе при каждом rebuild на локалке сотни строк → лаги вкладки).
 * Включить: `window.__CLD_DEBUG = true`, `window.__CLD_DEBUG_PREVIEW = true`,
 * или `?cldPreviewVerbose=1` на URL iframe превью.
 */
function __cldIsPreviewVerbose() {
  try {
    if (window.__CLD_DEBUG === true || window.__CLD_DEBUG_PREVIEW === true) return true;
    const q = String(window.location?.search || '');
    return /[?&]cldPreviewVerbose=1\b/.test(q);
  } catch (_) {
    return false;
  }
}

function __cldPreviewLog(tag, msg, data) {
  if (!__cldIsPreviewVerbose()) return;
  const p = `[CLD][preview][${tag}]`;
  if (data !== undefined) console.info(p, msg, data);
  else console.info(p, msg);
}

function __cldLogHingeFlatDrill(level, msg, data) {
  __cldPreviewBridgeLog('hinge-accessory-drill', level, '[flat] ' + String(msg || ''), data);
}

function __cldLogHingeAccessoryDrill(level, msg, data) {
  __cldPreviewBridgeLog('hinge-accessory-drill', level, '[accessory] ' + String(msg || ''), data);
}

function __cldIsHingeDebugEnabled() {
  try {
    // Только явный флаг: иначе на localhost каждый узел петли пишет в консоль при каждом rebuild → подвисание вкладки.
    return window.__CLD_DEBUG_HINGE === true;
  } catch (_) {
    return false;
  }
}

/** Почему не двигается/не масштабируется module-петля: вкл. `?cldHingeModule=1` или `window.__CLD_DEBUG_HINGE_MODULE=true` (консоль iframe). Логи дублируются на родителя через postMessage при embedded=1. */
function __cldIsHingeModuleLayoutDebugEnabled() {
  try {
    if (window.__CLD_DEBUG_HINGE_MODULE === true) return true;
    if (
      typeof window !== 'undefined' &&
      window.parent &&
      window.parent !== window &&
      window.parent.__CLD_DEBUG_HINGE_MODULE === true
    ) {
      return true;
    }
    const q = String(window.location?.search || '');
    return /[?&]cldHingeModule=1\b/.test(q);
  } catch (_) {
    return false;
  }
}

function __cldSpecLooksLikeCatalogHingeModule(spec) {
  if (!spec || typeof spec !== 'object') return false;
  const et = String(spec.element_type || '').toLowerCase();
  if (et === 'hinges') return true;
  return /^catalog_\d+$/.test(et);
}

function __cldLogHingeModuleLayout(msg, data) {
  if (!__cldIsHingeModuleLayoutDebugEnabled()) return;
  __cldPreviewBridgeLog('hinge-module-layout', 'info', String(msg || ''), data);
}

function __cldIsCatalogModuleShellLike(cfg) {
  if (!cfg || typeof cfg !== 'object') return false;
  if (String(cfg.type || '').toLowerCase() !== 'section') return false;
  const spec = cfg.spec && typeof cfg.spec === 'object' ? cfg.spec : null;
  if (!spec) return false;
  const et = String(spec.element_type || '').trim().toLowerCase();
  const id = String(spec.id || '').trim();
  return !!id && (/^catalog_\d+$/.test(et) || et === 'hinges');
}

function __cldIsHingeModuleSpec(spec) {
  if (!spec || typeof spec !== 'object') return false;
  const et = String(spec.element_type || '').toLowerCase().trim();
  if (et === 'hinges' || et === 'catalog_31') return true;
  if (spec.hingePreviewCabinetModelId || spec.hingePreviewCabinetCorpusModelId) return true;
  return false;
}

/** Каталожный модуль по ключу catalog_NN (или hinges): без развёрнутого дерева не должен превращаться в сплошной «коричневый куб» fill_module. */
function __cldIsCatalogLinkedModuleSpec(spec) {
  if (!spec || typeof spec !== 'object') return false;
  const et = String(spec.element_type || '').toLowerCase().trim();
  return /^catalog_\d+$/.test(et) || et === 'hinges';
}

/** Полка catalog_29 #6 / role shelf — плоский fill_module (16 мм), не section+wall. */
function __cldIsFlatCatalogShelfSpec(spec, cfg) {
  return isFlatCatalogShelfSpec(spec, cfg);
}

/** Первая h-wall с jointSchemes в дереве карточки catalog_29 (как ClodisBuilder._findCatalogShelfInnerWallNode). */
function __cldFindShelfInnerWallWithJointSchemes(tree) {
  if (!tree) return null;
  const stack = Array.isArray(tree) ? [...tree] : [tree];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    const t = String(n.type || '').toLowerCase();
    if (t === 'wall') {
      const orient = String(n.spec?.orientation || '').toLowerCase();
      const dt = String(n.spec?.detailTypeId || n.spec?.detail_type_id || '');
      const js = n.jointSchemes;
      if (
        (orient === 'h' || dt === 'horizontal_middle') &&
        Array.isArray(js) &&
        js.length > 0
      ) {
        return n;
      }
    }
    if (Array.isArray(n.children)) stack.push(...n.children);
  }
  return null;
}

/** Схемы полкодержателей с live-карточки catalog_29 (не в дереве шкафа — stub module). */
function __cldReadFlatShelfJointSchemes(cp) {
  if (!cp || typeof cp !== 'object') return null;
  if (Array.isArray(cp.jointSchemes) && cp.jointSchemes.length) {
    try {
      return JSON.parse(JSON.stringify(cp.jointSchemes));
    } catch (_) {
      return cp.jointSchemes.slice();
    }
  }
  const et = String(cp.spec?.element_type || '').trim();
  const id = cp.spec?.id;
  if (!et || id == null || id === '') return null;
  const tree = __cldTryResolveModuleTreeFromCatalog(et, id, cp.spec);
  const inner = __cldFindShelfInnerWallWithJointSchemes(tree);
  if (!inner?.jointSchemes?.length) return null;
  try {
    return JSON.parse(JSON.stringify(inner.jointSchemes));
  } catch (_) {
    return inner.jointSchemes.slice();
  }
}

function __cldNormalizeFlatCatalogShelfModuleParams(cp) {
  const d = cp && typeof cp === 'object' ? JSON.parse(JSON.stringify(cp)) : {};
  const rawY = d.size?.y;
  const yNum = Number(rawY);
  const yThin =
    Number.isFinite(yNum) && yNum > 0 && yNum < 120
      ? Math.round(yNum)
      : 16;
  d.size = {
    x: d.size?.x != null && String(d.size.x).trim() !== '' ? d.size.x : 's:x-32',
    y: yThin,
    z: d.size?.z != null && String(d.size.z).trim() !== '' ? d.size.z : 's:z',
  };
  d.pos = {
    x: d.pos?.x ?? 16,
    y: d.pos?.y ?? 0,
    z: d.pos?.z ?? 0,
  };
  d.pivot = d.pivot || { x: -1, y: -1, z: -1 };
  if (!d.layout_role && !d.sectionLayoutRole) d.layout_role = 'shelf';
  if (d.spec && typeof d.spec === 'object') {
    delete d.spec.template_tree;
    delete d.spec.templates;
    // Для стыкового превью (полкодержатель L/R) полка должна классифицироваться как h.
    if (!d.spec.orientation) d.spec.orientation = 'h';
  } else {
    d.spec = { orientation: 'h', element_type: cp?.spec?.element_type, id: cp?.spec?.id };
  }
  d.children = [];
  // PlanPlace: фурнитура не в дереве, но присадка на панели — протаскиваем схемы с карточки.
  const js = __cldReadFlatShelfJointSchemes(cp);
  if (js && js.length) d.jointSchemes = js;
  else delete d.jointSchemes;
  return d;
}

function __cldIsHingeLikeNode(cfg) {
  if (!cfg || typeof cfg !== 'object') return false;
  const name = String(cfg.name || '');
  const id = String(cfg.id || '');
  const t = String(cfg.type || '');
  const et = String(cfg.spec?.element_type || '');
  return /петл|hinge|к фасаду|к корпусу/i.test(name)
    || /hinge/i.test(id)
    || /hinge/i.test(et)
    || (t === 'animator' && id === 'hinge_animator');
}

// Референсный режим превью модуля делает так:
// - single_preview(true, obj) → fitCameraToCenteredObject(camera, obj, 1.15, controls)
// - затем опускает obj на пол: obj.position.set(0, -bboxSize.y/2, 0)
// Это даёт target=(0,0,0) и камеру по оси Z.
const FIT_PADDING = 1.15;
/** Комод/тумба на полу — чуть дальше камера, иначе куб 600×600 заполняет весь viewport. */
const FIT_PADDING_STANDALONE_FLOOR = 1.62;
/** Больше отступ для пустого embedded-превью (только размерная рамка 300×400×200). */
const FIT_PADDING_EMPTY_EMBEDDED = 1.72;
/** Превью #models3d-item-edit: одна фурнитура в кадре — крупнее стандартного 1.15, иначе «впритык». */
const FIT_PADDING_MODELS3D_GL = 2.25;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // как в референсе setClearColor(0xffffff, 1)

// Референс: PerspectiveCamera(0x37=55, aspect, near=0x1, far=0x1388=5000)
const camera = new THREE.PerspectiveCamera(55, app.clientWidth / app.clientHeight, 1, 0x1388);
camera.layers.enableAll();
const EDGE_LABELS_LAYER = 1; // номера кромок 1-4: показываем только при выборе детали
camera.layers.disable(EDGE_LABELS_LAYER);

// Рендер-пайплайн: для превью в браузере оставляем стандартный sRGB вывод,
// иначе при LinearSRGB картинка на мониторе выглядит заметно темнее.
THREE.ColorManagement.enabled = true;

/** Несколько конфигов: при отключённом GPU / «песочнице» Chrome часто падает только на части из них. */
function _createWebGLRendererWithFallback() {
  const attempts = [
    {
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
      sortObjects: true,
      failIfMajorPerformanceCaveat: false,
    },
    {
      antialias: true,
      alpha: false,
      powerPreference: 'default',
      preserveDrawingBuffer: true,
      sortObjects: true,
      failIfMajorPerformanceCaveat: false,
    },
    {
      antialias: false,
      alpha: false,
      powerPreference: 'default',
      preserveDrawingBuffer: true,
      sortObjects: true,
      failIfMajorPerformanceCaveat: false,
    },
    {
      antialias: false,
      alpha: true,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
      sortObjects: true,
      failIfMajorPerformanceCaveat: false,
    },
  ];
  for (let i = 0; i < attempts.length; i++) {
    try {
      const r = new THREE.WebGLRenderer(attempts[i]);
      const gl = r.getContext();
      if (gl) return r;
      try {
        r.dispose();
      } catch (_) {}
    } catch (e) {
      console.warn('[Clodis] WebGLRenderer: попытка', i + 1, 'не удалась:', e?.message || e);
    }
  }
  return null;
}

const _realGlRenderer = _createWebGLRendererWithFallback();
window.__cldWebGLAvailable = !!_realGlRenderer;

/** Заглушка с тем же минимальным интерфейсом, чтобы не валить весь модуль при отсутствии GL. */
function _makeWebGLRendererStub() {
  const el = document.createElement('div');
  el.className = 'cld-webgl-unavailable';
  el.setAttribute('role', 'alert');
  el.style.cssText = [
    'box-sizing:border-box',
    'width:100%',
    'height:100%',
    'min-height:120px',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'padding:20px',
    'background:linear-gradient(180deg,#e8eef3 0%,#f0f4f8 100%)',
    'color:#1e293b',
    'font-size:13px',
    'line-height:1.55',
    'text-align:center',
  ].join(';');
  el.innerHTML = [
    '<div style="max-width:420px">',
    '<strong style="display:block;margin-bottom:8px">Не удалось запустить 3D (WebGL)</strong>',
    'В Chrome: «Настройки» → «Система» → включите <strong>аппаратное ускорение</strong> и перезапустите браузер.',
    '<br><br>',
    'Если открыто по RDP или на виртуалке — включите 3D-ускорение ВМ или проверьте драйвер видеокарты.',
    '</div>',
  ].join('');
  app.appendChild(el);
  return {
    domElement: el,
    setSize() {},
    setPixelRatio() {},
    setClearColor() {},
    getContext: () => null,
    render() {},
    dispose() {},
    outputColorSpace: THREE.SRGBColorSpace,
    toneMapping: THREE.LinearToneMapping,
    toneMappingExposure: 1.3,
    shadowMap: { enabled: false, type: THREE.PCFSoftShadowMap },
  };
}

const renderer = _realGlRenderer || _makeWebGLRendererStub();

// До preload: иначе TDZ «Cannot access before initialization» рвёт IBL и ломает превью.
let _cldCatalogIconEnvMap = null;
let _cldCatalogIconEnvPromise = null;
let _cldModels3dEnvTexture = null;

if (_realGlRenderer) {
  renderer.setClearColor(0xffffff, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.LinearToneMapping;
  // Чуть повышаем экспозицию, чтобы ещё подсветить внутренности
  renderer.toneMappingExposure = 1.3;
  renderer.setSize(app.clientWidth, app.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // Как в рефе: PCFSoftShadowMap включён; тени от источников в build_light отключены
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // IBL preload — только после объявления CATALOG_ICON_* (см. конец файла). Раньше TDZ ломал весь модуль.
  if (__CLD_CONTEXT === 'models3d') {
    // For material preview we need stronger specular highlights.
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
  }
  app.appendChild(renderer.domElement);
}

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(app.clientWidth, app.clientHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.inset = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
labelRenderer.domElement.style.zIndex = '10';
app.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = false; // ближе к референсу (там update() без damping)
controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
controls.mouseButtons.MIDDLE = THREE.MOUSE.ROTATE;
controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
controls.enablePan = true;
controls.panSpeed = 0.5;

// Клик по фасаду с петлёй — открыть/закрыть (без конфликта с вращением камеры: только короткий клик)
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  _cldPointerDown = { x: e.clientX, y: e.clientY, t: performance.now() };
});
renderer.domElement.addEventListener('pointerup', (e) => {
  if (e.button !== 0 || !_cldPointerDown) {
    _cldPointerDown = null;
    return;
  }
  const dx = e.clientX - _cldPointerDown.x;
  const dy = e.clientY - _cldPointerDown.y;
  _cldPointerDown = null;
  if (Math.hypot(dx, dy) > 10) return;
  if (!rootGroup || !camera) return;

  const rect = renderer.domElement.getBoundingClientRect();
  const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  const rc = new THREE.Raycaster();
  rc.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
  const pickMeshes = [];
  rootGroup.traverse((o) => {
    if (o.isMesh && (o.userData?.cldDoorPick || o.userData?.cldDrawerPick)) pickMeshes.push(o);
  });
  if (!pickMeshes.length) return;
  const hits = rc.intersectObjects(pickMeshes, false);
  if (!hits.length) return;
  // Реф: клик по фасаду открывает ВСЕ аниматоры (фасад + петли) синхронно,
  // а не только тот swing, в который попал луч.
  // L-пакет: GLB чашки часто под Присадкой / под hinge_animator с syncBulkOpen=false
  // (после reparent в дверь) — ищем bulk-swing двери, иначе клик «мёртвый».
  let clickedSwing = null;
  let clickedSwingAny = null;
  let clickedSlideOwner = null;
  let n = hits[0].object;
  while (n) {
    const sw = n.userData?.cldDoorSwing;
    if (sw) {
      if (!clickedSwingAny) clickedSwingAny = n;
      if (sw.syncBulkOpen !== false) {
        clickedSwing = n;
        break;
      }
    }
    if (!clickedSlideOwner && n.userData?.cldSlide) {
      clickedSlideOwner = n;
      if (clickedSwing) break;
    }
    n = n.parent;
  }
  if (!clickedSwing && clickedSwingAny) {
    const g0 = _cldIframeDoorSwingGroups.find(
      (g) => g && g.parent && g.userData?.cldDoorSwing && g.userData.cldDoorSwing.syncBulkOpen !== false
    );
    clickedSwing = g0 || clickedSwingAny;
  }
  if (!clickedSwing && !clickedSlideOwner && hits[0].object.userData?.cldDoorPick) {
    clickedSwing =
      _cldIframeDoorSwingGroups.find(
        (g) => g && g.parent && g.userData?.cldDoorSwing && g.userData.cldDoorSwing.syncBulkOpen !== false
      ) || null;
  }
  let newOpen;
  if (clickedSwing) newOpen = !clickedSwing.userData.cldDoorSwing.isOpen;
  else if (clickedSlideOwner) newOpen = !clickedSlideOwner.userData.cldSlide.isOpen;
  else return;
  _cldToggleAllOpeningAnimations(newOpen);
});

// Мягкое каталожное освещение:
// 1) ровный общий фон
// 2) небосвод
// 3) очень мягкий фронтальный directional БЕЗ теней
// 4) лёгкий заполняющий cзади — почти без контраста
const ambient = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambient);

const hemi = new THREE.HemisphereLight(0xffffff, 0xd8d8d8, 0.9);
scene.add(hemi);

// Фронтальный очень мягкий свет без теней — минимальный объём, почти без теней
const dir = new THREE.DirectionalLight(0xffffff, 0.3);
// Ещё один шаг ниже и ближе к фасаду
dir.position.set(0, 4, 35);
dir.castShadow = false;
dir.target.position.set(0, 20, 0);
scene.add(dir.target);
scene.add(dir);

// Тени отключены, настройки не нужны

// Лёгкий заполняющий сверху/сзади, без теней — ещё слабее, почти без влияния на контраст
const fill = new THREE.DirectionalLight(0xffffff, 0.35);
fill.position.set(0, 14, -20);
fill.castShadow = false;
fill.target.position.set(0, 15, 0);
scene.add(fill.target);
scene.add(fill);

if (__CLD_CONTEXT === 'models3d') {
  // More contrast in models3d viewport so chrome doesn't look flat gray.
  ambient.intensity = 0.5;
  hemi.intensity = 0.55;
  dir.intensity = 1.0;
  fill.intensity = 0.8;
  _cldEnsureModels3dSceneEnv();
}

const lightingInfo = {
  source: 'studio-lighting',
  exposure: renderer.toneMappingExposure,
  ambient: ambient.intensity,
  hemisphere: hemi.intensity,
  directional: dir.intensity,
  fill: fill.intensity,
};

if (window.__CLD_DEBUG) console.log('[Clodis][constructor-clodis.js] lighting setup', lightingInfo);

// Дублируем краткий лог в родительский фрейм только при отладке
try {
  if (window.__CLD_DEBUG && window.parent && window.parent !== window) {
    window.parent.postMessage(
      {
        type: 'cld:previewLog',
        source: 'constructor-clodis.js',
        payload: lightingInfo,
      },
      '*'
    );
  }
} catch (e) {
  // ignore cross-origin / security errors
}

// ============================================
// материалы по /16 (create_material, Object_wall, make_cube)
// ============================================
const __cldTextureLoader = new THREE.TextureLoader();
const __cldTextureCache = new Map();
const __cldTexturePending = new Map();
let __cldMaterialItemsByKey = null;
let __cldMaterialItemsLoading = null;
const __cldModelKeyMaterialByIdCache = new Map();

function __cldResolveTextureUrl(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) return s;
  if (s.startsWith('/') && !s.startsWith('//') && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin + s;
  }
  return s;
}

function __cldGetTexture(url) {
  const key = __cldResolveTextureUrl(url);
  return key ? (__cldTextureCache.get(key) || null) : null;
}

function __cldEnsureTexture(url) {
  const key = __cldResolveTextureUrl(url);
  if (!key) return Promise.resolve(null);
  const cached = __cldTextureCache.get(key);
  if (cached) return Promise.resolve(cached);
  const pending = __cldTexturePending.get(key);
  if (pending) return pending;
  const p = new Promise((resolve) => {
    __cldTextureLoader.load(key,
      (tex) => {
        if (tex) {
          if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
          tex.premultiplyAlpha = false;
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          __cldTextureCache.set(key, tex);
        }
        __cldTexturePending.delete(key);
        resolve(tex || null);
      },
      undefined,
      () => {
        __cldTexturePending.delete(key);
        resolve(null);
      }
    );
  });
  __cldTexturePending.set(key, p);
  return p;
}

async function __cldEnsureMaterialItemsByKey() {
  if (__cldMaterialItemsByKey) return __cldMaterialItemsByKey;
  if (__cldMaterialItemsLoading) return __cldMaterialItemsLoading;
  __cldMaterialItemsLoading = (async () => {
    const itemsByKey = {};
    try {
      try {
        const mkmResp = await fetch('/api/catalog/items_get/model_key_material', { cache: 'no-store' });
        const mkmData = mkmResp.ok ? await mkmResp.json() : [];
        itemsByKey.model_key_material = Array.isArray(mkmData) ? mkmData : (mkmData?.items || []);
      } catch (_) {
        itemsByKey.model_key_material = [];
      }
      const keysResp = await fetch('/api/catalog/items_get/materials_keys', { cache: 'no-store' });
      const keysData = keysResp.ok ? await keysResp.json() : [];
      const keys = Array.isArray(keysData) ? keysData : (keysData?.items || []);
      for (const k of keys) {
        const id = Number(k?.id);
        if (!Number.isFinite(id) || id <= 0) continue;
        const key = `material_${id}`;
        try {
          const r = await fetch(`/api/catalog/items_get/${key}`, { cache: 'no-store' });
          const data = r.ok ? await r.json() : [];
          itemsByKey[key] = Array.isArray(data) ? data : (data?.items || []);
        } catch (_) {
          itemsByKey[key] = [];
        }
      }
    } catch (_) {}
    __cldMaterialItemsByKey = itemsByKey;
    __cldMaterialItemsLoading = null;
    return itemsByKey;
  })();
  return __cldMaterialItemsLoading;
}

function __cldGetMaterialTextureByRef(materialKey, materialId) {
  const key = String(materialKey || '').trim();
  const id = String(materialId ?? '').trim();
  if (!key || !id || !__cldMaterialItemsByKey || !Array.isArray(__cldMaterialItemsByKey[key])) return '';
  const item = __cldMaterialItemsByKey[key].find((x) => String(x?.id) === id);
  return item?.texture || item?.texture_url || item?.image || item?.icon || '';
}

function __cldFindMaterialItemByToken(token) {
  const tk = String(token ?? '').trim();
  if (!tk || !__cldMaterialItemsByKey || typeof __cldMaterialItemsByKey !== 'object') return null;
  const tl = tk.toLowerCase();
  for (const key of Object.keys(__cldMaterialItemsByKey)) {
    const arr = __cldMaterialItemsByKey[key];
    if (!Array.isArray(arr)) continue;
    const hit = arr.find((it) => {
      const id = String(it?.id ?? '').trim();
      const itemKey = String(it?.key ?? '').trim();
      const itemName = String(it?.name ?? it?.title ?? '').trim();
      return (
        id === tk ||
        itemKey === tk ||
        itemName === tk ||
        itemKey.toLowerCase() === tl ||
        itemName.toLowerCase() === tl
      );
    });
    if (hit) return hit;
  }
  return null;
}

function __cldFindIncomingModelMaterialByToken(token) {
  const tk = String(token ?? '').trim();
  if (!tk || !incomingMaterials || typeof incomingMaterials !== 'object') return null;
  if (incomingMaterials[tk]) return incomingMaterials[tk];
  const matAlias = /^material_\d+$/i.test(tk) ? tk : `material_${tk}`;
  if (incomingMaterials[matAlias]) return incomingMaterials[matAlias];
  const tl = tk.toLowerCase();
  for (const [k, v] of Object.entries(incomingMaterials)) {
    const kl = String(k || '').toLowerCase();
    if (kl === tl) return v;
    if (kl === matAlias.toLowerCase()) return v;
    const km = kl.match(/^material_(\d+)$/);
    if (km && km[1] === tk) return v;
    const vid = String(v?.id ?? '').trim();
    const vkey = String(v?.key ?? '').trim().toLowerCase();
    const vname = String(v?.name ?? '').trim().toLowerCase();
    if (vid === tk || vkey === tl || vname === tl) return v;
  }
  return null;
}

async function __cldFetchModelKeyMaterialById(idRaw) {
  const id = Number(idRaw);
  if (!Number.isFinite(id) || id <= 0) return null;
  if (__cldModelKeyMaterialByIdCache.has(id)) return __cldModelKeyMaterialByIdCache.get(id);
  let out = null;
  try {
    const r = await fetch(`/api/catalog/item_get/model_key_material/${id}?t=${Date.now()}`, { cache: 'no-cache' });
    const payload = r.ok ? await r.json() : null;
    const item = payload?.item || payload?.data?.item || payload || null;
    if (item && typeof item === 'object') {
      let d = {};
      try {
        d = item?.data ? (typeof item.data === 'string' ? JSON.parse(item.data) : item.data) : {};
      } catch (_) {
        d = {};
      }
      const p = d?.params?.params || d?.params || d || {};
      out = {
        id,
        key: String(item?.key || '').trim(),
        name: String(item?.name || item?.title || '').trim(),
        color: p?.color ?? d?.color ?? item?.color ?? item?.hex ?? null,
        metalness: p?.metalness ?? d?.metalness ?? null,
        roughness: p?.roughness ?? d?.roughness ?? null,
        transparent: p?.transparent ?? d?.transparent ?? null,
        opacity: p?.opacity ?? d?.opacity ?? null,
        map: p?.map || d?.map || item?.texture || item?.texture_url || item?.image || item?.icon || '',
        normalMap: p?.normalMap || d?.normalMap || '',
        roughnessMap: p?.roughnessMap || d?.roughnessMap || '',
      };
    }
  } catch (_) {
    out = null;
  }
  __cldModelKeyMaterialByIdCache.set(id, out);
  return out;
}

function __cldExtractModelKeyMaterialParams(item) {
  if (!item || typeof item !== 'object') return {};
  let d = {};
  try {
    if (item.data) d = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
  } catch (_) {
    d = {};
  }
  const p = d?.params?.params || d?.params || d || {};
  return {
    color: p?.color || d?.color || item?.color || item?.hex || null,
    metalness: p?.metalness ?? d?.metalness ?? null,
    roughness: p?.roughness ?? d?.roughness ?? null,
    transparent: p?.transparent ?? d?.transparent ?? null,
    opacity: p?.opacity ?? d?.opacity ?? null,
    map: p?.map || d?.map || item?.texture || item?.texture_url || item?.image || item?.icon || '',
    normalMap: p?.normalMap || d?.normalMap || '',
    roughnessMap: p?.roughnessMap || d?.roughnessMap || '',
    name: item?.name || item?.title || ''
  };
}

function __cldNormalizeMaterialColorValue(rawColor) {
  const s = String(rawColor ?? '').trim();
  if (!s) return null;
  if (/^#[0-9a-fA-F]{6}$/.test(s) || /^#[0-9a-fA-F]{3}$/.test(s)) return s;
  if (/^[0-9a-fA-F]{6}$/.test(s) || /^[0-9a-fA-F]{3}$/.test(s)) return `#${s}`;
  return s;
}

function __cldFindModelMeshMaterialConfig(meshMap, meshName) {
  if (!meshMap || typeof meshMap !== 'object') return null;
  if (meshName && meshMap[meshName]) return meshMap[meshName];
  const n = String(meshName || '').toLowerCase();
  if (!n) return null;
  for (const k of Object.keys(meshMap)) {
    const kl = String(k || '').toLowerCase();
    if (!kl) continue;
    if (kl === n || kl.includes(n) || n.includes(kl)) return meshMap[k];
  }
  return null;
}

async function __cldApplyCabinetModelMeshMaterials(root, mergedSpec, variantEntry) {
  if (!root) return;
  // Крепёж стыка: цвет только aluminium из рефа, не meshes[] каталога (часто белый).
  if (
    Number(mergedSpec?.joint_hardware) === 1 ||
    mergedSpec?.fromJointScheme ||
    root?.userData?.jointHardwareMesh
  ) {
    return;
  }
  const meshMap =
    variantEntry?.params?.meshes ||
    variantEntry?.meshes ||
    mergedSpec?.params?.meshes ||
    mergedSpec?.meshes ||
    null;
  if (!meshMap || typeof meshMap !== 'object') return;

  await __cldEnsureMaterialItemsByKey();

  const meshTargets = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    const cfg = __cldFindModelMeshMaterialConfig(meshMap, o.name || '');
    if (!cfg || typeof cfg !== 'object') return;
    const token = (__CLD_CONTEXT === 'models3d')
      ? (cfg.material_id ?? cfg.mat_id)
      : (cfg.selected ?? cfg.mat_id ?? cfg.material_id ?? cfg.mat_key ?? cfg.m ?? cfg.material ?? cfg.material_key);
    if (token == null || String(token).trim() === '') return;
    meshTargets.push({ mesh: o, token: String(token).trim() });
  });
  // Если имена мешей в GLB не совпали с keys в params.meshes (частый кейс),
  // В models3d режиме: если material_id не задан — НЕ применяем fallback.
  // Модель должна оставаться с материалом, который запечён в GLB (как в рефе).
  if (!meshTargets.length) {
    if (__CLD_CONTEXT === 'models3d') {
      return; // строго: нет material_id = нет применения материала
    }
    let fallbackToken = '';
    for (const k of Object.keys(meshMap)) {
      const cfg = meshMap[k];
      if (!cfg || typeof cfg !== 'object') continue;
      const token = (cfg.selected ?? cfg.mat_id ?? cfg.material_id ?? cfg.mat_key ?? cfg.m ?? cfg.material ?? cfg.material_key);
      if (token == null || String(token).trim() === '') continue;
      fallbackToken = String(token).trim();
      break;
    }
    if (!fallbackToken) return;
    root.traverse((o) => {
      if (!o.isMesh) return;
      meshTargets.push({ mesh: o, token: fallbackToken });
    });
    if (!meshTargets.length) return;
  }

  for (const t of meshTargets) {
    const item = __cldFindMaterialItemByToken(t.token);
    const incomingItem = __cldFindIncomingModelMaterialByToken(t.token);
    const parsed = __cldExtractModelKeyMaterialParams(item);
    const texPath = incomingItem?.map || parsed.map || '';
    const normalPath = incomingItem?.normalMap || parsed.normalMap || '';
    const roughPath = incomingItem?.roughnessMap || parsed.roughnessMap || '';
    const tex = texPath ? await __cldEnsureTexture(texPath) : null;
    const normalTex = normalPath ? await __cldEnsureTexture(normalPath) : null;
    const roughTex = roughPath ? await __cldEnsureTexture(roughPath) : null;
    const mats = Array.isArray(t.mesh.material) ? t.mesh.material : [t.mesh.material];
    mats.forEach((m) => {
      if (!m) return;
      if (tex) {
        const localTex = tex.clone();
        localTex.needsUpdate = true;
        m.map = localTex;
        m.color = new THREE.Color(0xffffff);
      } else {
        const color = incomingItem?.color || parsed.color || null;
        if (color) {
          try { m.color = new THREE.Color(color); } catch (_) {}
        }
      }
      if (normalTex) {
        const localNormalTex = normalTex.clone();
        localNormalTex.needsUpdate = true;
        m.normalMap = localNormalTex;
      }
      if (roughTex) {
        const localRoughTex = roughTex.clone();
        localRoughTex.needsUpdate = true;
        m.roughnessMap = localRoughTex;
      }
      const metalness = incomingItem?.metalness ?? parsed.metalness;
      const roughness = incomingItem?.roughness ?? parsed.roughness;
      if (metalness != null && Number.isFinite(Number(metalness))) {
        m.metalness = Math.max(0, Math.min(1, Number(metalness)));
      }
      if (roughness != null && Number.isFinite(Number(roughness))) {
        m.roughness = Math.max(0, Math.min(1, Number(roughness)));
      }
      const transparent = incomingItem?.transparent ?? parsed.transparent;
      const opacity = incomingItem?.opacity ?? parsed.opacity;
      if (transparent != null) m.transparent = !!transparent;
      if (opacity != null && Number.isFinite(Number(opacity))) {
        m.opacity = Math.max(0, Math.min(1, Number(opacity)));
      }
      // Для металлов вроде "Хром" даём более металлический отклик даже без явной texture.
      // no forced "chrome look" override: use only user material params
      m.needsUpdate = true;
    });
  }
}

function __cldResolveTextureUrlFromMaterialRef(p, groupMat) {
  // material_icon на узле — фактический декор, выбранный в карточке.
  // Lookup по material_id вторичен: id может не совпадать с иконкой/именем
  // (пример: id=8 «Белый воздушный», icon/name — «Сатин Шампанское»).
  const direct =
    p.material_icon ||
    p.materialIcon ||
    groupMat.material_icon ||
    groupMat.materialIcon ||
    groupMat.icon ||
    groupMat.image ||
    groupMat.texture ||
    '';
  const pKey = p.material_key || p.materialKey || p.spec?.material?.key || '';
  const pId = p.material_id ?? p.materialId ?? p.spec?.material?.id ?? '';
  const gKey = groupMat?.material?.key || '';
  const gId = groupMat?.material?.id ?? '';
  return (
    direct ||
    __cldGetMaterialTextureByRef(pKey, pId) ||
    __cldGetMaterialTextureByRef(gKey, gId)
  );
}

function __cldIsMaterialRotated(p) {
  return !!(
    p?.rotate ||
    p?.spec?.material?.rotated ||
    p?.material?.rotated
  );
}

// make_cube(f,g,h,i) —
function make_cube(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

function __cldNum01(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : def;
}

function __cldFindCatalogItemByKeyId(materialKey, materialId) {
  const key = String(materialKey || 'material_2').trim() || 'material_2';
  const id = Number(materialId);
  if (!Number.isFinite(id) || id <= 0) return null;
  const list = __cldMaterialItemsByKey?.[key];
  if (!Array.isArray(list)) return null;
  return list.find((it) => Number(it?.id) === id) || null;
}

function __cldApplyCatalogPbrToMaterial(mat, catalogItem) {
  if (!mat || !catalogItem) return;
  mat.roughness = __cldNum01(catalogItem.roughness, mat.roughness ?? 0.8);
  mat.metalness = __cldNum01(catalogItem.metalness, mat.metalness ?? 0);
  if (catalogItem.transparent != null || catalogItem.transparency != null) {
    mat.transparent = !!(catalogItem.transparent || catalogItem.transparency);
  }
  if (catalogItem.opacity != null && Number.isFinite(Number(catalogItem.opacity))) {
    mat.opacity = Math.max(0, Math.min(1, Number(catalogItem.opacity)));
  }
  if (catalogItem.oneSided || catalogItem.one_side) {
    mat.side = THREE.FrontSide;
  }
}

function __cldApplyTextureRepeatFromCatalog(tex, catalogItem, modelWMm, modelHMm) {
  if (!tex || !catalogItem) return;
  tex.wrapS = tex.wrapT = THREE.MirroredRepeatWrapping;
  const realW = Math.max(1, Number(catalogItem.realTextureWidth || catalogItem.textureWidth || 256));
  const realH = Math.max(1, Number(catalogItem.realTextureHeight || catalogItem.textureHeight || 256));
  const stretchW = !!(catalogItem.stretchWidth || catalogItem.stretch_width);
  const stretchH = !!(catalogItem.stretchHeight || catalogItem.stretch_height);
  tex.repeat.set(
    stretchW ? 1 : Math.max(1, modelWMm / realW),
    stretchH ? 1 : Math.max(1, modelHMm / realH),
  );
  tex.needsUpdate = true;
}

function create_material_for_wall() {
  // Как в рефе: MeshStandardMaterial даёт блики и объём (в рефе create_material по умолчанию Standard)
  // Светлый цвет для превью на белом фоне
  return new THREE.MeshStandardMaterial({
    color: 0xfdfdfd,
    side: THREE.DoubleSide,
    roughness: 0.8, // более матовый для менее контрастного вида
    metalness: 0.0, // не металл
  });
}

// Лёгкая сетка (в референсе часто рисуется отдельно; здесь оставим минимально)
const grid = new THREE.GridHelper(600, 60, 0x888888, 0xcccccc);
grid.position.y = 0.05;
grid.visible = false; // по умолчанию скрыта, чтобы не мешала как в модальном превью
scene.add(grid);

// Оси превью конструктора (legacy part16)
// f=40 (длина осей), g=1 (радиус шара) — юниты сцены (1 юнит = 10 мм)
// renderOrder=1000: поверх SectionVolume (10) и edges (11)
class ClodisAxes extends THREE.Group {
  constructor(f = 40, g = 1) {
    super();
    const RO = 1000;
    var sphere = new THREE.Mesh(new THREE.SphereGeometry(g, 16, 8), new THREE.MeshBasicMaterial({
      color: '#ffd319',
      depthTest: false,
      depthWrite: false,
      transparent: true,
    }));
    sphere.renderOrder = RO;
    this.add(sphere);
    
    var yAxis = new THREE.Mesh(new THREE.BoxGeometry(f, 0.2, 0.2), new THREE.MeshBasicMaterial({
      color: '#4eb34e',
      depthTest: false,
      depthWrite: false,
      transparent: true,
    }));
    yAxis.rotateZ(Math.PI / 2);
    yAxis.renderOrder = RO;
    yAxis.position.y = 20;
    this.add(yAxis);
    
    var xAxis = new THREE.Mesh(new THREE.BoxGeometry(f, 0.2, 0.2), new THREE.MeshBasicMaterial({
      color: '#e81b1b',
      depthTest: false,
      depthWrite: false,
      transparent: true,
    }));
    xAxis.position.x = 20;
    xAxis.renderOrder = RO;
    this.add(xAxis);
    
    var zAxis = new THREE.Mesh(new THREE.BoxGeometry(f, 0.2, 0.2), new THREE.MeshBasicMaterial({
      color: '#50baff',
      depthTest: false,
      depthWrite: false,
      transparent: true,
    }));
    zAxis.rotateY(-Math.PI / 2);
    zAxis.position.z = 20;
    zAxis.renderOrder = RO;
    this.add(zAxis);
  }
}

// axes_helper для подсветки выбранного элемента
const pp = { helpers: {} };
pp.helpers.axes_helper = new ClodisAxes();
pp.helpers.axes_helper.visible = false;
scene.add(pp.helpers.axes_helper);

// Глобальные флаги режима отображения для админки (outline / прозрачные контуры)
// Используются внешней панелью admin-new.html через iframe.contentWindow.
window.outlineMode = window.outlineMode ?? false;
window.transparentOutlineMode = window.transparentOutlineMode ?? false;

function updateOutlineModes() {
  const hasOutline = !!window.outlineMode;
  const hasTransparent = !!window.transparentOutlineMode;

  if (!rootGroup) {
    render();
    return;
  }

  const rememberBase = (mat) => {
    if (!mat) return;
    if (!mat.userData) mat.userData = {};
    if (!Object.prototype.hasOwnProperty.call(mat.userData, '__baseOpacity')) {
      mat.userData.__baseOpacity = typeof mat.opacity === 'number' ? mat.opacity : 1;
      mat.userData.__baseTransparent = !!mat.transparent;
      mat.userData.__baseWireframe = !!mat.wireframe;
      if (!Object.prototype.hasOwnProperty.call(mat.userData, '__baseColor')) {
        mat.userData.__baseColor = mat.color ? mat.color.clone() : null;
      }
      if (!Object.prototype.hasOwnProperty.call(mat.userData, '__baseMap')) {
        mat.userData.__baseMap = mat.map || null;
      }
      if (!Object.prototype.hasOwnProperty.call(mat.userData, '__baseDepthWrite')) {
        mat.userData.__baseDepthWrite = mat.depthWrite !== false;
      }
      if (!Object.prototype.hasOwnProperty.call(mat.userData, '__baseDepthTest')) {
        mat.userData.__baseDepthTest = mat.depthTest !== false;
      }
    }
  };

  const restoreBase = (mat) => {
    if (!mat?.userData || !Object.prototype.hasOwnProperty.call(mat.userData, '__baseOpacity')) return;
    mat.transparent = mat.userData.__baseTransparent;
    mat.opacity = mat.userData.__baseOpacity;
    mat.wireframe = mat.userData.__baseWireframe;
    if (mat.userData.__baseColor && mat.color) mat.color.copy(mat.userData.__baseColor);
    if (Object.prototype.hasOwnProperty.call(mat.userData, '__baseMap')) {
      mat.map = mat.userData.__baseMap;
    }
    if (Object.prototype.hasOwnProperty.call(mat.userData, '__baseDepthWrite')) {
      mat.depthWrite = !!mat.userData.__baseDepthWrite;
    }
    if (Object.prototype.hasOwnProperty.call(mat.userData, '__baseDepthTest')) {
      mat.depthTest = !!mat.userData.__baseDepthTest;
    }
    mat.needsUpdate = true;
  };

  // Панели (не accessory): контуры / прозрачный как в БМ.
  rootGroup.traverse((o) => {
    if (!o.isMesh || !o.material || o.userData.isAccessory || o.userData.isSectionVolume) return;
    if (o.userData.isEdgesHelper || o.userData.jointPreviewHole || o.userData.jointHardwareMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];

    // EdgesGeometry один раз — только внешние рёбра без диагоналей
    if (!o.userData.__edgesHelper && o.geometry) {
      const edgesGeom = new THREE.EdgesGeometry(o.geometry, 1);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x111111,
        transparent: false,
        opacity: 1,
        depthTest: true,
        depthWrite: false,
      });
      const edges = new THREE.LineSegments(edgesGeom, lineMat);
      edges.name = '__clodis_edges_helper';
      edges.userData.isEdgesHelper = true;
      edges.renderOrder = 20;
      o.add(edges);
      o.userData.__edgesHelper = edges;
    }

    const edgesHelper = o.userData.__edgesHelper;

    mats.forEach((mat) => {
      if (!mat) return;
      rememberBase(mat);

      if (!hasOutline && !hasTransparent) {
        restoreBase(mat);
        if (edgesHelper) edgesHelper.visible = false;
        o.visible = true;
      } else if (hasOutline && !hasTransparent) {
        // Контуры: непрозрачный белый + тёмные рёбра
        mat.transparent = false;
        mat.opacity = 1;
        mat.wireframe = false;
        mat.depthWrite = true;
        mat.depthTest = true;
        if (mat.color) mat.color.setHex(0xffffff);
        mat.map = null;
        mat.needsUpdate = true;
        if (edgesHelper) {
          edgesHelper.visible = true;
          if (edgesHelper.material) {
            edgesHelper.material.transparent = false;
            edgesHelper.material.opacity = 1;
            edgesHelper.material.depthTest = true;
          }
        }
        o.visible = true;
      } else if (hasTransparent) {
        // Как БМ «прозрачный»: лица почти невидимы (depthWrite off), читаются только рёбра.
        mat.transparent = true;
        mat.opacity = 0.03;
        mat.wireframe = false;
        mat.depthWrite = false;
        mat.depthTest = true;
        if (mat.color) mat.color.setHex(0xffffff);
        mat.map = null;
        mat.needsUpdate = true;
        if (edgesHelper) {
          edgesHelper.visible = true;
          edgesHelper.renderOrder = 25;
          if (edgesHelper.material) {
            edgesHelper.material.transparent = false;
            edgesHelper.material.opacity = 1;
            edgesHelper.material.color?.setHex?.(0x111111);
            edgesHelper.material.depthTest = true;
            edgesHelper.material.depthWrite = false;
            edgesHelper.material.needsUpdate = true;
          }
        }
        o.visible = true;
      }
    });
  });

  // Крепёж стыка: обычный материал (не рентген OnTop). Контуры отверстий не трогаем.
  rootGroup.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    if (o.userData?.jointPreviewHole || o.userData?.jointPreviewOrigin) return;
    if (o.userData?.jointHardwareMesh || _meshIsJointSchemeHardware(o)) {
      __cldMarkJointHardwareMeshesOnTop(o);
      return;
    }
    const isHw = !!o.userData.isAccessory;
    if (!isHw) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((mat) => {
      if (!mat) return;
      rememberBase(mat);
      if (hasTransparent) {
        if (!Object.prototype.hasOwnProperty.call(mat.userData, '__xrayDepthTest')) {
          mat.userData.__xrayDepthTest = mat.depthTest !== false;
          mat.userData.__xrayDepthWrite = mat.depthWrite !== false;
          mat.userData.__xrayTransparent = !!mat.transparent;
          mat.userData.__xrayOpacity = typeof mat.opacity === 'number' ? mat.opacity : 1;
        }
        mat.depthTest = true;
        mat.depthWrite = true;
        mat.transparent = false;
        if (typeof mat.opacity === 'number' && mat.opacity < 0.9) mat.opacity = 1;
        mat.needsUpdate = true;
        o.renderOrder = Math.max(Number(o.renderOrder) || 0, 30);
      } else if (Object.prototype.hasOwnProperty.call(mat.userData || {}, '__xrayDepthTest')) {
        mat.depthTest = !!mat.userData.__xrayDepthTest;
        mat.depthWrite = !!mat.userData.__xrayDepthWrite;
        mat.transparent = !!mat.userData.__xrayTransparent;
        mat.opacity = mat.userData.__xrayOpacity;
        delete mat.userData.__xrayDepthTest;
        delete mat.userData.__xrayDepthWrite;
        delete mat.userData.__xrayTransparent;
        delete mat.userData.__xrayOpacity;
        mat.needsUpdate = true;
      }
    });
  });

  // Viz-группа стыков пересобирается ниже — уплотнение отверстий после _renderJointMarkers.

  if (hasSchemesOrJointViz()) {
    try {
      _renderJointMarkers();
    } catch (_) {}
  } else {
    _applyTransparentJointVizDepth();
  }

  // Цветной вид: крепёж с обычным depth (шляпка = серый кружок на плоскости).
  try {
    _reapplyJointSchemeHardwareOnTop();
  } catch (_) {}

  render();
}

function hasSchemesOrJointViz() {
  return Object.keys(_jointSchemesStore || {}).length > 0
    || _jointActiveInfo != null
    || !!(_jointSelected && _jointSelected.nodePath != null);
}

function render() {
  if (rootGroup && !rootGroup.userData._opaquePatched) {
    // Не затирать режим контуров/прозрачности БМ при первом кадре.
    if (!window.outlineMode && !window.transparentOutlineMode) {
      rootGroup.traverse((o) => {
        if (o.isMesh && o.material && !o.userData.isAccessory && !o.userData.isSectionVolume) {
          const m = Array.isArray(o.material) ? o.material : [o.material];
          m.forEach((mat) => {
            if (mat) { mat.transparent = false; mat.opacity = 1; }
          });
        }
      });
    }
    rootGroup.userData._opaquePatched = true;
  }
  if (_cldCatalogIconShotActive) {
    _cldRenderCatalogIconFrame();
  } else {
    renderer.render(scene, camera);
  }
  if (!_cldCatalogIconShotActive) {
    labelRenderer.render(scene, camera);
  }
}

function onResize() {
  const { clientWidth, clientHeight } = app;
  if (clientWidth <= 0 || clientHeight <= 0) return;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
  labelRenderer.setSize(clientWidth, clientHeight);
  render();
}
window.addEventListener('resize', onResize);

function disposeObject(root) {
  root.traverse((obj) => {
    if (obj instanceof CSS2DObject) {
      const el = obj.element;
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    const anyObj = obj;
    if (anyObj.geometry && anyObj.geometry.dispose) anyObj.geometry.dispose();
    if (anyObj.material) {
      const mats = Array.isArray(anyObj.material) ? anyObj.material : [anyObj.material];
      mats.forEach((m) => m && m.dispose && m.dispose());
    }
  });
}

function mm(n) {
  const v = Number(n);
  return Math.max(0, Number.isFinite(v) ? v : 0);
}

let rootGroup = null;
let dimsGroup = null;
// Группа размерных меток петель (ось Y от низа фасада) для страницы «Петли по ролям».
let hingeMarkersGroup = null;
let __hingeMarkersEnabled = false;
let __hingeMarkersAxis = 'Y';
let __hingeMarkersMeasure = 'anchor';
/** Превью «Петли по ролям»: дерево уже с раскладкой — не strip / не re-Y. */
let __cldHingeRolePreview = false;
/** Превью ролей с виртуальным боком — шов бок×фасад; dock к «голому» фасаду не нужен. */
let __cldHingeRoleVirtualSide = false;
/**
 * Превью «Петли по ролям»: белый LDSP на белом clearColor сливается («прозрачный»).
 * Фон как у viewport модалки — серо-голубой, полотно читается.
 */
function __cldApplyHingeRolePreviewSceneStyle() {
  if (!__cldHingeRolePreview) return;
  const bg = 0xd8dee6;
  try {
    if (scene) scene.background = new THREE.Color(bg);
    if (renderer && typeof renderer.setClearColor === 'function') {
      renderer.setClearColor(bg, 1);
    }
  } catch (_) {}
  window.transparentOutlineMode = false;
  if (!window.outlineMode && typeof updateOutlineModes === 'function') {
    try {
      updateOutlineModes();
    } catch (_) {}
  }
}
// Как в референсе на первом экране: только размеры, без корпуса
let showModule = false;
// Текущее дерево модуля (spec.template.tree), приходит от админки через postMessage
let moduleTemplateTree = null;

// Входные vars/materials из админки (переустанавливаются через postMessage)
let incomingVars = null;
let incomingMaterials = null;
function __cldTryResolveModuleTreeFromCatalog(elementType, elementId, spec) {
  const et = String(elementType || '').trim();
  const id = String(elementId || '').trim();
  if (!et || !id) return null;

  // Как __cldGetCatalogItemParams: сначала parent (админка), иначе сам iframe (embedded превью).
  let catalogs = null;
  try {
    if (typeof window !== 'undefined') {
      if (window.parent && window.parent.__CLD_CATALOGS_DATA) {
        catalogs = window.parent.__CLD_CATALOGS_DATA;
      } else if (window.__CLD_CATALOGS_DATA) {
        catalogs = window.__CLD_CATALOGS_DATA;
      }
    }
  } catch (_) {
    try {
      catalogs = typeof window !== 'undefined' && window.__CLD_CATALOGS_DATA ? window.__CLD_CATALOGS_DATA : null;
    } catch (_e) {
      catalogs = null;
    }
  }
  if (!catalogs || typeof catalogs !== 'object') return null;

  const resolveFromItem = (it) => {
    if (!it || typeof it !== 'object') return null;
    let params = it.params;
    if (typeof params === 'string') {
      try { params = JSON.parse(params); } catch (_) { params = null; }
    }
    if (!params || typeof params !== 'object') params = {};
    let data = it.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (_) { data = null; }
    }
    if (!data || typeof data !== 'object') data = {};

    const pickTreeFromRoot = (root) => {
      if (!root || typeof root !== 'object') return null;
      const readJson =
        typeof globalThis !== 'undefined' && typeof globalThis.__cldReadClodisJSON === 'function'
          ? globalThis.__cldReadClodisJSON
          : (o) => (Array.isArray(o?.clodisJSON) ? o.clodisJSON : null);
      const pp =
        readJson(root) ||
        readJson(root.params);
      if (Array.isArray(pp) && pp.length > 0) return pp;
      const t =
        root?.template?.structure
        || root?.spec?.template?.tree
        || root?.params?.constructor_structure?.children
        || root?.params?.constructor_structure
        || root?.constructor_structure?.children
        || root?.constructor_structure
        || root?.params?.template?.tree
        || root?.params?.templates?.[0]?.template?.tree
        || root?.template?.tree
        || root?.template_tree
        || null;
      if (Array.isArray(t) && t.length > 0) return t;
      if (t && typeof t === 'object' && Array.isArray(t.children)) return t.children;
      return null;
    };
    const roots = [it, params, data, { ...data, ...params }];
    for (const root of roots) {
      const t = pickTreeFromRoot(root);
      if (t) return t;
    }
    return null;
  };

  const pickCatalogItem = (items) => {
    if (!items) return null;
    return Array.isArray(items)
      ? items.find((x) => String(x?.id ?? '') === id)
      : items[id];
  };

  // element_type hinges: карточка часто в hingeCatalogTypeKey / catalog_31, а не в buckets['hinges'].
  if (et === 'hinges') {
    const sk = spec && typeof spec === 'object' ? spec : null;
    const tryKeys = [];
    const hk = sk ? String(sk.hingeCatalogTypeKey || '').trim() : '';
    if (hk) tryKeys.push(hk);
    if (!tryKeys.includes('catalog_31')) tryKeys.push('catalog_31');
    if (!tryKeys.includes('hinges')) tryKeys.push('hinges');
    for (const k of tryKeys) {
      const treeH = resolveFromItem(pickCatalogItem(catalogs?.[k]?.items));
      if (treeH) return treeH;
    }
  }

  // 1) Прямой ключ element_type (catalog_33, catalog_29, …)
  const items = catalogs?.[et]?.items;
  if (items) {
    const hit = Array.isArray(items)
      ? items.find((x) => String(x?.id ?? '') === id)
      : items[id];
    const tree = resolveFromItem(hit);
    if (tree) {
      if (et === 'catalog_32') __cldFixPlinthLegDepthExprs(tree);
      return tree;
    }
  }

  // Глобальный перебор всех каталогов по id УДАЛЁН: у карточек часто id "1","2" —
  // подставлялось чужое дерево (другой каталог), превью падало или исчезало.
  // Для петель отдельная логика выше (hingeCatalogTypeKey / catalog_31 / hinges).
  return null;
}

/**
 * Реф. Clodis: узел петли в JSON — `type: "module"` + `spec.element_type: "hinges"` без лишней обёртки.
 * В каталоге (catalog_31) шаблон часто начинается с одной секции «Петли накладные», которая только группирует
 * две подсекции (фасад/корпус). Снимаем её, чтобы в дереве и при разворачивании были сразу две секции.
 */
function __cldUnwrapHingeModuleTemplateRoot(tpl, elementType) {
  const et = String(elementType || '').toLowerCase();
  if (et !== 'hinges' || !Array.isArray(tpl) || tpl.length === 0) return tpl;

  let out = tpl;
  let guard = 0;
  while (
    out.length === 1 &&
    out[0] &&
    out[0].type === 'section' &&
    Array.isArray(out[0].children) &&
    out[0].children.length > 0 &&
    guard < 6
  ) {
    guard += 1;
    const root = out[0];
    const ch = root.children;
    const nm = String(root.name || '').toLowerCase();
    const allSections = ch.every((c) => c && (c.type === 'section' || c.type === 'fill_section'));
    if (ch.length >= 2 && (allSections || /петл|hinge/i.test(nm))) {
      out = ch;
      continue;
    }
    if (ch.length === 1 && /петл|hinge/i.test(nm)) {
      out = ch;
      continue;
    }
    break;
  }
  return out;
}

/** params записи каталога (cabinet_model / hinges и т.д.) по id; preferKey — например catalog_31. */
function __cldGetCatalogItemParamsById(preferKey, itemId) {
  const id = String(itemId || '').trim();
  if (!id) return null;
  let catalogs = null;
  try {
    catalogs =
      typeof window !== 'undefined' && window.parent && window.parent.__CLD_CATALOGS_DATA
        ? window.parent.__CLD_CATALOGS_DATA
        : typeof window !== 'undefined' && window.__CLD_CATALOGS_DATA
          ? window.__CLD_CATALOGS_DATA
          : null;
  } catch (_) {
    catalogs = null;
  }
  if (!catalogs || typeof catalogs !== 'object') return null;

  const paramsFromHit = (hit) => {
    if (!hit || typeof hit !== 'object') return null;
    let params = hit.params;
    if (typeof params === 'string') {
      try {
        params = JSON.parse(params);
      } catch (_) {
        params = null;
      }
    }
    if (!params || typeof params !== 'object') params = {};
    let data = hit.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (_) {
        data = null;
      }
    }
    if (data && typeof data === 'object' && data.params && typeof data.params === 'object') {
      return { ...data.params, ...params };
    }
    return params && typeof params === 'object' ? params : null;
  };

  const pk = String(preferKey || '').trim();
  if (pk) {
    const items = catalogs[pk]?.items;
    if (items) {
      const hit = Array.isArray(items) ? items.find((x) => String(x?.id ?? '') === id) : items[id];
      const p = paramsFromHit(hit);
      if (p) return p;
    }
  }
  for (const key of Object.keys(catalogs)) {
    const items = catalogs[key]?.items;
    if (!items) continue;
    const hit = Array.isArray(items) ? items.find((x) => String(x?.id ?? '') === id) : items[id];
    const p = paramsFromHit(hit);
    if (p) return p;
  }
  return null;
}

/** Полная запись каталога по id: name/size/children/params (из window.__CLD_CATALOGS_DATA). */
function __cldGetCatalogItemDataById(preferKey, itemId) {
  const id = String(itemId || '').trim();
  if (!id) return null;
  let catalogs = null;
  try {
    catalogs =
      typeof window !== 'undefined' && window.parent && window.parent.__CLD_CATALOGS_DATA
        ? window.parent.__CLD_CATALOGS_DATA
        : typeof window !== 'undefined' && window.__CLD_CATALOGS_DATA
          ? window.__CLD_CATALOGS_DATA
          : null;
  } catch (_) {
    catalogs = null;
  }
  if (!catalogs || typeof catalogs !== 'object') return null;

  const normalizeHit = (hit) => {
    if (!hit || typeof hit !== 'object') return null;
    let data = hit.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (_) {
        data = null;
      }
    }
    let params = hit.params;
    if (typeof params === 'string') {
      try {
        params = JSON.parse(params);
      } catch (_) {
        params = null;
      }
    }
    if (!params || typeof params !== 'object') params = {};
    if (!data || typeof data !== 'object') data = {};
    return {
      name: hit.name || data.name || '',
      size: data.size || params.size || { x: 0, y: 0, z: 0 },
      children: Array.isArray(data.children) ? data.children : [],
      params: { ...(data.params && typeof data.params === 'object' ? data.params : {}), ...params },
    };
  };

  const pk = String(preferKey || '').trim();
  if (pk) {
    const items = catalogs[pk]?.items;
    if (items) {
      const hit = Array.isArray(items) ? items.find((x) => String(x?.id ?? '') === id) : items[id];
      const out = normalizeHit(hit);
      if (out) return out;
    }
  }
  for (const key of Object.keys(catalogs)) {
    const items = catalogs[key]?.items;
    if (!items) continue;
    const hit = Array.isArray(items) ? items.find((x) => String(x?.id ?? '') === id) : items[id];
    const out = normalizeHit(hit);
    if (out) return out;
  }
  return null;
}

function __cldTryRefMmFromCatalogParams(params) {
  if (!params || typeof params !== 'object') return null;
  const rs = params.ref_size_mm || params.refSizeMm;
  if (rs && typeof rs === 'object') {
    const x = Number(rs.x);
    const y = Number(rs.y);
    const z = Number(rs.z);
    if ([x, y, z].every((n) => Number.isFinite(n) && n > 0)) return { x, y, z };
  }
  const mm = params.size;
  if (mm && typeof mm === 'object') {
    const parse = (v) => {
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
      const s = String(v ?? '')
        .replace(/s:[xyz]/gi, '')
        .replace(/@section\.[a-z]+/gi, '')
        .replace(',', '.');
      const n = parseFloat(s);
      return Number.isFinite(n) && n > 0 ? n : NaN;
    };
    const x = parse(mm.x);
    const y = parse(mm.y);
    const z = parse(mm.z);
    if ([x, y, z].every((n) => Number.isFinite(n) && n > 0)) return { x, y, z };
  }
  return null;
}

/**
 * Габарит GLB петли: ref из каталога cabinet_model, не слот секции.
 * Пропуск узлов-заглушек «Присадка»: только facade/furniture с именем «присадк…» и предок «Петли…» / hinges,
 * либо spec.cld_skip_mesh — иначе furniture «Присадка» с drill id в каталоге строит отверстия как раньше.
 */
function __cldAncestorChainHasHingeTemplateContext(parentNode) {
  let p = parentNode;
  for (let g = 0; g < 24 && p; g++) {
    const cfg = p.config && typeof p.config === 'object' ? p.config : {};
    const nm = String(cfg.name || '').toLowerCase();
    if (/петл|hinge/i.test(nm)) return true;
    if (String(cfg.spec?.element_type || '').toLowerCase() === 'hinges') return true;
    p = p.userData && p.userData.parent;
  }
  return false;
}

function __cldIsHingeCatalogDrillPlaceholderNode(cfg, parentNode) {
  if (!cfg || typeof cfg !== 'object') return false;
  const t = String(cfg.type || '').toLowerCase();
  if (t !== 'facade' && t !== 'furniture') return false;
  const n = String(cfg.name || '').toLowerCase();
  if (!/присадк/.test(n)) return false;
  if (cfg.spec && cfg.spec.cld_skip_mesh === true) return true;
  // Для узлов type:furniture под петлей строим hole-детей (референсная присадка),
  // поэтому НЕ режем их по ancestor-context без явного cld_skip_mesh.
  if (t === 'furniture') return false;
  return __cldAncestorChainHasHingeTemplateContext(parentNode);
}

function __cldHingeGltfRefMmFromSpecAndCatalog(spLike, slotMm) {
  const sp = spLike && typeof spLike === 'object' ? spLike : {};
  const slot = slotMm && typeof slotMm === 'object' ? slotMm : { x: 50, y: 50, z: 20 };
  const rx = Number(sp.ref_size_mm?.x ?? sp.refSizeMm?.x);
  const ry = Number(sp.ref_size_mm?.y ?? sp.refSizeMm?.y);
  const rz = Number(sp.ref_size_mm?.z ?? sp.refSizeMm?.z);
  if (Number.isFinite(rx) && rx > 0 && Number.isFinite(ry) && ry > 0 && Number.isFinite(rz) && rz > 0) {
    return { x: rx, y: ry, z: rz };
  }
  const cmId = String(sp.hingePreviewCabinetModelId || sp.id || '').trim();
  const catKey = String(sp.hingeCatalogTypeKey || '').trim();
  const catParams = cmId ? __cldGetCatalogItemParamsById(catKey || null, cmId) : null;
  const fromCat = __cldTryRefMmFromCatalogParams(catParams);
  if (fromCat) return fromCat;
  // Слот секции ≠ размер петли: иначе GLB растягивается на всю дверь (как на скрине).
  const sx = Number(slot.x) || 50;
  const sy = Number(slot.y) || 50;
  const sz = Number(slot.z) || 20;
  if (sz > 40 || sx > 120 || sy > 200) {
    return {
      x: Math.min(Math.max(24, sx * 0.2), 80),
      y: Math.min(Math.max(40, sy * 0.2), 120),
      z: Math.min(Math.max(10, sz * 0.12), 24),
    };
  }
  return { x: sx, y: sy, z: sz };
}

// Крепёж стыков (данные из админки) + подсветка торцов в превью
let _jointSchemesStore = {}; // { [nodePath]: jointSchemeEntry[] }
let _jointVizGroup = null; // временные пятна стыков (режим расстановки) — на scene
let _jointPanelVizList = []; // отверстия схем — дети own_object панелей (ездят с аниматором)
let _jointActiveInfo = null; // { nodePath, allJointIdxs, seamLenMm?, potentialJointIdxs?, seamLenByJointIdx?, ... }
/** Выделенный в дереве админки стык (подсветка в 3D). */
let _jointSelected = null; // { nodePath, jointIdx, contactId?, schemeId?, frameIndex? } | null

function _clearJointPanelVizAll() {
  for (const g of _jointPanelVizList) {
    try {
      if (g?.parent) g.parent.remove(g);
      if (g) disposeObject(g);
    } catch (_) {}
  }
  _jointPanelVizList = [];
  try {
    rootGroup?.traverse?.((o) => {
      const old = o?.userData?.__clodis_joint_panel_viz;
      if (!old) return;
      try {
        if (old.parent) old.parent.remove(old);
        disposeObject(old);
      } catch (_) {}
      delete o.userData.__clodis_joint_panel_viz;
    });
  } catch (_) {}
}

/**
 * Группа отверстий на панели (own_object) — едут с slide/rotate.
 * Базис: пласть и торец — разные детали → get-or-create (очистка только в _clearJointPanelVizAll).
 */
function _ensurePanelJointViz(panelRoot) {
  const own = panelRoot?.userData?.own_object || panelRoot;
  if (!own) return null;
  const existing = own.userData?.__clodis_joint_panel_viz;
  if (existing && existing.parent === own) {
    if (!_jointPanelVizList.includes(existing)) _jointPanelVizList.push(existing);
    return existing;
  }
  if (existing) {
    try {
      if (existing.parent) existing.parent.remove(existing);
      disposeObject(existing);
    } catch (_) {}
    delete own.userData.__clodis_joint_panel_viz;
    _jointPanelVizList = _jointPanelVizList.filter((g) => g !== existing);
  }
  const g = new THREE.Group();
  g.name = '__clodis_joint_panel_viz';
  g.userData.jointPanelViz = 1;
  own.add(g);
  own.userData.__clodis_joint_panel_viz = g;
  _jointPanelVizList.push(g);
  return g;
}

/** world → локаль own_object панели (дыры/контуры едут с ящиком). */
function _jointWorldToPanelLocal(panelRoot, worldPos, worldDir) {
  const own = panelRoot?.userData?.own_object || panelRoot;
  if (!own) {
    return {
      pos: worldPos?.clone?.() || new THREE.Vector3(),
      dir: worldDir?.clone?.()?.normalize?.() || new THREE.Vector3(0, 1, 0),
    };
  }
  own.updateWorldMatrix(true, true);
  const inv = new THREE.Matrix4().copy(own.matrixWorld).invert();
  const pos = (worldPos?.clone?.() || new THREE.Vector3()).applyMatrix4(inv);
  const dir = worldDir
    ? worldDir.clone().transformDirection(inv).normalize()
    : new THREE.Vector3(0, 1, 0);
  return { pos, dir };
}

function _jointSelectedMatchesEntry(panelPath, schemeEntry) {
  if (!_jointSelected || !schemeEntry) return false;
  const sp = String(_jointSelected.nodePath || '').trim();
  const pp = String(panelPath || '').trim();
  if (!sp || !pp) return false;
  const pathOk =
    sp === pp ||
    sp === `0,${pp}` ||
    pp === `0,${sp}` ||
    (sp.startsWith('0,') && sp.slice(2) === pp) ||
    (pp.startsWith('0,') && pp.slice(2) === sp);
  if (!pathOk) return false;
  const cid = schemeEntry.contactId != null ? String(schemeEntry.contactId) : '';
  const selCid = _jointSelected.contactId != null ? String(_jointSelected.contactId) : '';
  // Главный ключ — contactId (левый/правый стык). Без него легко подсветить «чужую» сторону.
  if (selCid) return !!cid && cid === selCid;
  if (cid && !selCid) return false;
  const j = Number(schemeEntry.jointIdx);
  const sj = Number(_jointSelected.jointIdx);
  if (!Number.isFinite(j) || !Number.isFinite(sj) || j !== sj) return false;
  const sid = Number(schemeEntry.schemeId) || 0;
  const ssid = Number(_jointSelected.schemeId) || 0;
  if (sid > 0 && ssid > 0 && sid !== ssid) return false;
  return true;
}

function _jointSelectedMatchesStation(frameIndex) {
  if (!_jointSelected) return false;
  const fi = Number(_jointSelected.frameIndex);
  if (!Number.isFinite(fi)) return true; // строка «Крепёж» — все станции стыка
  return Number(frameIndex) === fi;
}

/** Группы распашных фасадов (анимация в iframe-превью). */
let _cldIframeDoorSwingGroups = [];
/** Реф pp.engine.animator_state.slide: выдвижные группы (`own_object` аниматора fn:slide). */
let _cldIframeSlideGroups = [];

function _cldReadDrawerNoHandleFromCatalogId(catalogId) {
  const id = String(catalogId || '').trim();
  if (!id) return false;
  try {
    const raw = localStorage.getItem('catalog_33');
    const arr = raw ? JSON.parse(raw) : [];
    const hit = Array.isArray(arr) ? arr.find((it) => String(it?.id ?? '').trim() === id) : null;
    if (!hit || typeof hit !== 'object') return false;
    const d = hit.data && typeof hit.data === 'object' ? hit.data : hit;
    const vals = [d?.drawerNoHandle, hit.drawerNoHandle];
    return vals.some((v) => v === true || v === 1 || v === '1');
  } catch (_) {
    return false;
  }
}

function _cldReadDrawerNoHandleFromSpec(spec) {
  if (!spec || typeof spec !== 'object') return false;
  const nh = spec.drawer_no_handle ?? spec.drawerNoHandle;
  return nh === 1 || nh === true || nh === '1';
}

/** Как ClodisBuilder: catalog_33 без ручки → userData на модуле и потомках (превью iframe). */
function _cldApplyDrawerNoHandleToCatalogModuleNode(node) {
  if (!node || typeof node !== 'object') return;
  const spec = node.config?.spec;
  if (!spec || typeof spec !== 'object') return;
  if (String(spec.element_type || '').toLowerCase() !== 'catalog_33') return;
  const cid = String(spec.id ?? '').trim();
  const linkedId = String(spec.linked_item_id ?? '').trim();
  const noHandle =
    _cldReadDrawerNoHandleFromSpec(spec) ||
    (cid && _cldReadDrawerNoHandleFromCatalogId(cid)) ||
    (linkedId && _cldReadDrawerNoHandleFromCatalogId(linkedId));
  if (!noHandle) return;
  const catalogId = cid || linkedId;
  node.config.spec = { ...spec, drawer_no_handle: 1 };
  node.userData.cldDrawerCatalogId = catalogId;
  node.userData.cldDrawerNoHandle = true;
  node.traverse((o) => {
    o.userData.cldDrawerCatalogId = catalogId;
    o.userData.cldDrawerNoHandle = true;
  });
}

/** Ключ сборки ящика: главный slide + внутренний slide направляющих (catalog_34). */
function _cldDrawerSlideAssemblyKey(own) {
  let n = own.parent;
  while (n) {
    const cfg = n.userData?.params || n.config;
    if (cfg && typeof cfg === 'object') {
      const lr = String(cfg.layout_role ?? cfg.sectionLayoutRole ?? '').toLowerCase();
      const et = String(cfg.spec?.element_type || '').toLowerCase();
      if (lr === 'drawer' || et === 'catalog_33') return n.uuid;
    }
    n = n.parent;
  }
  return own.parent?.uuid || own.uuid;
}

/** Синхронизация slide направляющих с главным slide ящика (реф ClodisBuilder._finalizeDrawerSlideAssemblies). */
function _finalizeDrawerSlideAssembliesForPreview() {
  const slides = _cldIframeSlideGroups.filter((g) => g?.parent && g.userData?.cldSlide);
  if (slides.length < 2) return;
  const assemblies = new Map();
  for (const own of slides) {
    const key = _cldDrawerSlideAssemblyKey(own);
    if (!assemblies.has(key)) assemblies.set(key, []);
    assemblies.get(key).push(own);
  }
  for (const group of assemblies.values()) {
    if (group.length < 2) continue;
    group.sort(
      (a, b) =>
        (Number(a.userData.cldSlide?.travelU) || 999) - (Number(b.userData.cldSlide?.travelU) || 999)
    );
    const master = group[0];
    const mSl = master.userData.cldSlide;
    if (!mSl) continue;
    for (let i = 1; i < group.length; i++) {
      const sl = group[i].userData.cldSlide;
      if (!sl) continue;
      sl.slideMaster = master;
      sl.travelU = mSl.travelU;
      sl.syncBulkOpen = false;
    }
  }
}

function _cldApplySlideOwnPosition(own, sl) {
  const cur = sl.currentOffset ?? 0;
  const ax = sl.axis;
  own.position.x = sl.base.x + (ax === 'x' ? cur * sl.sign : 0);
  own.position.y = sl.base.y + (ax === 'y' ? cur * sl.sign : 0);
  own.position.z = sl.base.z + (ax === 'z' ? cur * sl.sign : 0);
}
/** Режим скриншота каталога: держать все swing в превью распахнутыми (URL doorsOpen=1 или cld:setPreviewDoorsOpen). */
let __cldPreviewDoorsOpen = false;
try {
  const __du = new URLSearchParams(window.location.search);
  if (__du.get('doorsOpen') === '1' || __du.get('doors_open') === '1') __cldPreviewDoorsOpen = true;
} catch (_) {}
let _cldPointerDown = null;

let __cldPreviewDrawerHandlePass = 0;

function _cldTruthyDrawerNoHandle(v) {
  return v === true || v === 1 || v === '1';
}

function _cldApplyPreviewDrawerNoHandleStampToRoot() {
  if (!_cldTruthyDrawerNoHandle(__cldPreviewDrawerNoHandle) || !rootGroup) return;
  rootGroup.traverse((o) => {
    o.userData.cldDrawerNoHandle = true;
  });
  if (typeof globalThis.__cldStripDrawerHandlesFromRoot === 'function') {
    globalThis.__cldStripDrawerHandlesFromRoot(rootGroup);
  }
}

function _cldPreviewDrawerHandleOpts() {
  const pk = __cldPreviewPlacementKind === 'standalone_floor' ? 'pedestal' : 'wardrobe';
  return {
    previewMode: true,
    drawerNoHandle: _cldTruthyDrawerNoHandle(__cldPreviewDrawerNoHandle),
    productKind: pk,
    placementKind: __cldPreviewPlacementKind,
    toSceneUnits: (mm) => mm / UNITS_MM,
  };
}

async function _cldRunPreviewDrawerHandles() {
  if (!__cldEmbeddedPreview || !rootGroup) return null;
  if (typeof globalThis.__cldAttachDrawerHandlesToRoot !== 'function') return null;
  const pass = ++__cldPreviewDrawerHandlePass;
  const res = await globalThis.__cldAttachDrawerHandlesToRoot(rootGroup, _cldPreviewDrawerHandleOpts());
  if (pass !== __cldPreviewDrawerHandlePass) return res;
  if (res?.attached > 0) render();
  return res;
}

function _cldSchedulePreviewDrawerHandles() {
  if (!__cldEmbeddedPreview || !rootGroup) return;
  if (_cldTruthyDrawerNoHandle(__cldPreviewDrawerNoHandle)) {
    if (typeof globalThis.__cldStripDrawerHandlesFromRoot === 'function') {
      globalThis.__cldStripDrawerHandlesFromRoot(rootGroup);
      render();
    }
    if (typeof globalThis.__cldBumpDrawerHandleAttachGeneration === 'function') {
      globalThis.__cldBumpDrawerHandleAttachGeneration();
    }
    return;
  }
  _cldRunPreviewDrawerHandles().catch(() => {});
  setTimeout(() => {
    _cldRunPreviewDrawerHandles().catch(() => {});
  }, 700);
}

if (typeof globalThis !== 'undefined' && !globalThis.__cldPreviewDrawerCatalogHook) {
  globalThis.__cldPreviewDrawerCatalogHook = true;
  try {
    globalThis.addEventListener?.('handles-catalog-ready', () => {
      if (_cldTruthyDrawerNoHandle(__cldPreviewDrawerNoHandle)) {
        if (typeof globalThis.__cldStripDrawerHandlesFromRoot === 'function' && rootGroup) {
          globalThis.__cldStripDrawerHandlesFromRoot(rootGroup);
          render();
        }
        return;
      }
      _cldSchedulePreviewDrawerHandles();
    });
  } catch (_) {}
}

function _cldApplyPreviewDoorsOpenToSwings() {
  if (!__cldPreviewDoorsOpen) return;
  for (let i = _cldIframeDoorSwingGroups.length - 1; i >= 0; i--) {
    const g = _cldIframeDoorSwingGroups[i];
    if (!g || !g.parent) continue;
    const sw = g.userData?.cldDoorSwing;
    if (!sw) continue;
    if (sw.syncBulkOpen === false) continue;
    const ang = sw.maxAngle;
    sw.isOpen = true;
    sw.targetAngle = ang;
    sw.currentAngle = ang;
    if (sw.axis === 'y') g.rotation.y = ang;
    else if (sw.axis === 'x') g.rotation.x = ang;
    else if (sw.axis === 'z') g.rotation.z = ang;
  }
  for (let i = _cldIframeSlideGroups.length - 1; i >= 0; i--) {
    const own = _cldIframeSlideGroups[i];
    if (!own || !own.parent) continue;
    const sl = own.userData?.cldSlide;
    if (!sl || sl.syncBulkOpen === false || sl.slideMaster) continue;
    const t = sl.travelU;
    sl.isOpen = true;
    sl.targetOffset = t;
    sl.currentOffset = t;
    own.position.x = sl.base.x + (sl.axis === 'x' ? t * sl.sign : 0);
    own.position.y = sl.base.y + (sl.axis === 'y' ? t * sl.sign : 0);
    own.position.z = sl.base.z + (sl.axis === 'z' ? t * sl.sign : 0);
  }
}

/** Синхронное открытие/закрытие дверей и ящиков в iframe (реф: один клик — все аниматоры). */
function _cldToggleAllOpeningAnimations(newOpen) {
  for (const g of _cldIframeDoorSwingGroups) {
    if (!g || !g.parent) continue;
    const sw = g.userData?.cldDoorSwing;
    if (!sw) continue;
    if (sw.syncBulkOpen === false) continue;
    sw.isOpen = newOpen;
    sw.targetAngle = newOpen ? sw.maxAngle : 0;
  }
  for (const own of _cldIframeSlideGroups) {
    if (!own || !own.parent) continue;
    const sl = own.userData?.cldSlide;
    if (!sl || sl.syncBulkOpen === false || sl.slideMaster) continue;
    sl.isOpen = newOpen;
    sl.targetOffset = newOpen ? sl.travelU : 0;
  }
}

// ── Превью каталога 3D моделей (admin #models3d-item-edit → postMessage cld:loadModel) ──
let _m3PreviewRoot = null;
/** Счётчик async cld:loadModel — устаревшие GLB/FBX не монтируем (иначе «старые» копии при повороте/перезагрузке). */
let _m3LoadGen = 0;
/** URL последней загрузки — для разрешения preview_ref при cld:setModelTransform */
let _m3LastModelUrl = '';
/** null = подгонка под рамку превью; иначе тот же эталон, что у __prepareHingeGltfClone */
let _m3PreviewRefSizeMm = null;
/** params модели из админки (preview_ref_mm и т.д.) */
let _m3LastModelParams = null;
/** glTF asset (generator/units) для превью — нужен при повторной подгонке */
let _m3LastGltfAssetMeta = null;
let _m3LastUserTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
};
/** Авто-вешалки на штанге в превью #models3d-item-edit (карточка #22). */
let _m3RodCompanionsPayload = null;
let _m3RodCompanionsSpawnEpoch = 0;
/** Скоба-ручка: длина = ref.y, сечение = ref.x × ref.z (как cabinet_model width/height/depth). */
let _m3HandleBarFit = false;

function _m3ClearRodCompanions() {
  if (!_m3PreviewRoot) return;
  const remove = [];
  _m3PreviewRoot.children.forEach((ch) => {
    if (String(ch.name || '').startsWith('rod_companion_')) remove.push(ch);
  });
  remove.forEach((ch) => {
    _m3PreviewRoot.remove(ch);
    disposeObject(ch);
  });
}

async function _m3SpawnRodCompanionsPreview() {
  if (__CLD_CONTEXT !== 'models3d') return;
  _m3ClearRodCompanions();
  const raw = _m3RodCompanionsPayload;
  const api = typeof globalThis !== 'undefined' ? globalThis.__cldRodCompanions : null;
  if (!raw?.enabled || !_m3PreviewRoot?.children?.length || !api?.spawnRodCompanionsIntoOwnObject) return;

  const config = api.parseRodCompanionsPayload(raw);
  if (!config?.enabled) return;

  const epoch = ++_m3RodCompanionsSpawnEpoch;
  const rodMesh = _m3PreviewRoot.children.find(
    (c) => !String(c.name || '').startsWith('rod_companion_')
  );
  if (!rodMesh) return;

  const previewW = Number(state.w) || 0;
  const loaderApi = typeof globalThis !== 'undefined' ? globalThis.__cldRoomCabinetModels : null;

  try {
    const libMap = await __ensureCabinetModelLibraryMap();
    if (epoch !== _m3RodCompanionsSpawnEpoch) return;
    await api.spawnRodCompanionsIntoOwnObject({
      rodGroup: _m3PreviewRoot,
      rodMesh,
      rodWidthMm: previewW,
      config,
      catalogMap: libMap,
      THREE,
      unitsMm: UNITS_MM,
      epoch,
      isEpochStale: () => epoch !== _m3RodCompanionsSpawnEpoch,
      loadAsset: __loadCabinetModelAssetRootOnce,
      prepareRoot: (tpl, ms, ent, sm) => {
        if (loaderApi && typeof loaderApi.prepareCabinetModelRoot === 'function') {
          return loaderApi.prepareCabinetModelRoot(tpl, ms, ent, sm);
        }
        return tpl.clone(true);
      },
      applyMaterials: async (prepared, ms, ent) => {
        const shelfApi = typeof globalThis !== 'undefined' ? globalThis.__cldShelfProps : null;
        if (ms?.isRodCompanion && shelfApi?.applyShelfPropFabricLook) {
          if (shelfApi.waitForTextureMaps) await shelfApi.waitForTextureMaps(prepared, 8000);
          shelfApi.applyShelfPropFabricLook(prepared, THREE, ms?.fabric_tint || ms?.fabricTint, 'rod');
          return;
        }
        return __cldApplyCabinetModelMeshMaterials(prepared, ms, ent);
      },
    });
    if (epoch !== _m3RodCompanionsSpawnEpoch) return;
    __cameraWasAutoFitted = false;
    _fitPreviewCameraCombined();
    __cameraWasAutoFitted = true;
    render();
  } catch (_) {}
}

function _disposeM3Preview() {
  if (_m3PreviewRoot) {
    scene.remove(_m3PreviewRoot);
    disposeObject(_m3PreviewRoot);
    _m3PreviewRoot = null;
  }
  _m3LastModelUrl = '';
  _m3PreviewRefSizeMm = null;
  _m3LastModelParams = null;
  _m3LastGltfAssetMeta = null;
  _m3RodCompanionsPayload = null;
  _m3RodCompanionsSpawnEpoch++;
  _m3HandleBarFit = false;
}

/** Макс. протяжённость glTF-сцены в «сырых» единицах файла (часто м, иногда мм). */
function _m3PreviewRawMaxExtent(content) {
  if (!content) return 1e-8;
  content.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(content);
  const size = box.getSize(new THREE.Vector3());
  let maxD = Math.max(size.x, size.y, size.z);
  if (maxD > 1e-6) return maxD;
  // setFromObject иногда даёт пустой ящик (скин/инстансы) — считаем по геометриям
  maxD = 0;
  content.updateWorldMatrix(true, true);
  content.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const g = o.geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    if (!g.boundingBox || g.boundingBox.isEmpty()) return;
    o.updateWorldMatrix(true, false);
    const b = new THREE.Box3().copy(g.boundingBox).applyMatrix4(o.matrixWorld);
    const s = b.getSize(new THREE.Vector3());
    maxD = Math.max(maxD, s.x, s.y, s.z);
  });
  return Math.max(maxD, 1e-8);
}

/** Bright studio IBL for models3d editor. Metalness=1 has no diffuse without env. */
function _cldCreateModels3dStudioEnvTexture() {
  if (!_realGlRenderer) return null;
  if (_cldModels3dEnvTexture) return _cldModels3dEnvTexture;
  try {
    const envScene = new THREE.Scene();
    const addWall = (w, h, color, x, y, z, rotX, rotY) => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
      );
      mesh.position.set(x, y, z);
      mesh.rotation.set(rotX || 0, rotY || 0, 0);
      envScene.add(mesh);
    };
    addWall(8, 8, 0xf2f2f0, 0, 0, -4, 0, 0);
    addWall(8, 8, 0xe6e6e4, 0, 0, 4, 0, Math.PI);
    addWall(8, 8, 0xeeeeec, -4, 0, 0, 0, Math.PI / 2);
    addWall(8, 8, 0xffffff, 4, 0, 0, 0, -Math.PI / 2);
    addWall(8, 8, 0xffffff, 0, 4, 0, Math.PI / 2, 0);
    addWall(8, 8, 0xc4c4c0, 0, -4, 0, -Math.PI / 2, 0);
    const windowPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 3.4),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    windowPanel.position.set(3.55, 1.15, -1.1);
    windowPanel.rotation.y = -Math.PI / 2;
    envScene.add(windowPanel);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const rt = pmrem.fromScene(envScene, 0.04);
    pmrem.dispose();
    envScene.traverse((o) => {
      try { o.geometry?.dispose?.(); } catch (_) {}
      try { o.material?.dispose?.(); } catch (_) {}
    });
    _cldModels3dEnvTexture = rt.texture;
    return _cldModels3dEnvTexture;
  } catch (e) {
    console.warn('[CLD][models3d] studio env failed', e);
    return null;
  }
}

function _cldEnsureModels3dSceneEnv() {
  if (__CLD_CONTEXT !== 'models3d' || !_realGlRenderer) return null;
  const tex = _cldCreateModels3dStudioEnvTexture();
  if (tex) scene.environment = tex;
  return tex;
}

function _cldBindModels3dPreviewEnv(root) {
  const tex = _cldEnsureModels3dSceneEnv();
  if (!root) return;
  root.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m) => {
      if (!m || !(m.isMeshStandardMaterial || m.isMeshPhysicalMaterial)) return;
      if (tex) m.envMap = tex;
      m.envMapIntensity = 1;
      m.needsUpdate = true;
    });
  });
}

/** Чтобы превью не «пропадало»: полностью прозрачные/чужие слои из каталога. */
function _normalizeM3PreviewDrawables(root) {
  if (!root) return;
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.visible = true;
    o.frustumCulled = false;
    o.layers.set(0);
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((mat) => {
      if (!mat) return;
      const op = Number(mat.opacity);
      if (Number.isFinite(op) && op < 0.2) mat.opacity = 1;
      mat.transparent = false;
      mat.depthWrite = true;
      mat.side = THREE.DoubleSide;
    });
  });
}

/**
 * GLB/FBX из SketchUp/Blender часто содержат камеры, лампы и пустые Object3D с
 * позициями в десятках/сотнях мм. `Box3.setFromObject` (а через него — авто‑фит камеры,
 * `_refitM3PreviewInner` и т.п.) их учитывает и «раздувает» итоговый bbox в разы,
 * даже когда сами меши правильного размера. Чистим: оставляем только меши и группы,
 * содержащие меши, без потери иерархии скейлов/трансформов.
 */
function _stripM3PreviewNonMeshes(root) {
  if (!root) return 0;
  const toRemove = [];
  let kept = 0;
  root.traverse((o) => {
    if (o === root) return;
    if (o.isMesh) {
      kept++;
      return;
    }
    if (o.isLight || o.isCamera || o.isBone || o.isHelper || o.isLineSegments || o.isLine || o.isPoints || o.isSprite) {
      toRemove.push(o);
      return;
    }
    // Empty / Group: если внутри нет ни одной Mesh — удалить, иначе оставить
    let hasMeshInside = false;
    o.traverse((c) => {
      if (c !== o && c.isMesh) hasMeshInside = true;
    });
    if (!hasMeshInside) toRemove.push(o);
  });
  for (const o of toRemove) {
    if (o.parent) o.parent.remove(o);
  }
  return kept;
}

/**
 * Более стабильный world-AABB для glTF:
 * setFromObject(root) иногда занижает bbox (скины/инстансы), из-за чего scale завышается.
 */
function __computeRobustWorldBox(root) {
  const box = new THREE.Box3();
  let hasAny = false;
  if (!root) return { box, hasAny: false };
  root.updateWorldMatrix(true, true);
  root.traverse((o) => {
    if (!o?.isMesh || !o.geometry) return;
    const g = o.geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    if (!g.boundingBox || g.boundingBox.isEmpty()) return;
    o.updateWorldMatrix(true, false);
    const b = new THREE.Box3().copy(g.boundingBox).applyMatrix4(o.matrixWorld);
    if (!hasAny) {
      box.copy(b);
      hasAny = true;
    } else {
      box.union(b);
    }
  });
  if (!hasAny) {
    box.setFromObject(root);
    hasAny = !box.isEmpty();
  }
  return { box, hasAny };
}

/**
 * Только центрирование GLB вокруг локального (0,0,0), без скейла.
 * CabinetModel — модель «как есть»; size узла — только bbox/pivot/хелперы.
 */
function __gltfRootCenterOnlyKeepScale(root) {
  if (!root) return;
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.updateMatrixWorld(true);
  const { box, hasAny } = __computeRobustWorldBox(root);
  if (!hasAny) return;
  const c = box.getCenter(new THREE.Vector3());
  root.position.set(-c.x, -c.y, -c.z);
}

/**
 * Выровнять longest AABB-ось меша на +X (длина конфирмата в furniture-frame рефа / rot.z=±90).
 */
/**
 * Реф (part2): aluminium_material = MeshPhongMaterial color 12435135 (серый «алюминий»).
 * Им красят мебель/петли/конфирматы — шляпка читается на ЛДСП, не белый GLB и не рентген.
 */
const __CLD_JOINT_ALUMINIUM_COLOR = 12435135; // 0xBDBDBF
let __cldJointAluminiumMaterial = null;
function __cldGetJointAluminiumMaterial() {
  if (__cldJointAluminiumMaterial) return __cldJointAluminiumMaterial;
  // Реф part2 aluminium 12435135; чуть темнее specular — шляпка читается на светлом ЛДСП.
  __cldJointAluminiumMaterial = new THREE.MeshPhongMaterial({
    color: __CLD_JOINT_ALUMINIUM_COLOR,
    specular: 0x444444,
    shininess: 40,
    side: THREE.DoubleSide,
    depthTest: true,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  __cldJointAluminiumMaterial.userData = __cldJointAluminiumMaterial.userData || {};
  __cldJointAluminiumMaterial.userData.__cldJointAluminium = 1;
  return __cldJointAluminiumMaterial;
}

/**
 * Крепёж стыка: aluminium + depthTest (как в рефе).
 * Не OnTop/depthTest:false — иначе «рентген» сквозь ЛДСП вместо серой шляпки на плоскости.
 * Видимость шляпки — за счёт смещения модели в шаблоне (jointModelVisualOffsetMm).
 */
function __cldMarkJointHardwareMeshesOnTop(root) {
  if (!root || typeof root.traverse !== 'function') return;
  const alum = __cldGetJointAluminiumMaterial();
  root.traverse((o) => {
    if (!o?.isMesh) return;
    o.visible = true;
    o.frustumCulled = false;
    o.renderOrder = Math.max(Number(o.renderOrder) || 0, 10);
    o.userData = o.userData || {};
    o.userData.jointHardwareMesh = 1;
    o.userData.isAccessory = true;
    // Один shared aluminium — как bim_keys.al / aluminium_material в рефе.
    if (Array.isArray(o.material)) {
      o.material = o.material.map(() => alum);
    } else {
      o.material = alum;
    }
  });
  // Камеру здесь НЕ трогаем: MarkOnTop вызывается из selectNode / reapply на каждый клик в дереве.
}

/** Меш принадлежит крепежу стыка (модель / furniture fromJointScheme). */
function _meshIsJointSchemeHardware(mesh) {
  if (!mesh) return false;
  if (mesh.userData?.jointHardwareMesh) return true;
  let p = mesh;
  for (let i = 0; i < 24 && p; i++) {
    const cfg = p.config;
    if (cfg) {
      if (cfg.fromJointScheme) return true;
      if (Number(cfg.spec?.joint_hardware) === 1) return true;
      if (Number(cfg.spec?.joint_template_model) === 1 && Number(cfg.spec?.from_drill_template) === 1) {
        const parentCfg = p.userData?.parent?.config;
        if (parentCfg?.fromJointScheme || Number(parentCfg?.spec?.joint_hardware) === 1) return true;
      }
    }
    p = p.parent;
  }
  return false;
}

/** Пометить GLB крепежа стыка: материал как в рефе (не рентген). */
function _reapplyJointSchemeHardwareOnTop() {
  if (!rootGroup || typeof rootGroup.traverse !== 'function') return;
  rootGroup.traverse((node) => {
    const cfg = node?.config;
    if (!cfg) return;
    const parentCfg = node?.userData?.parent?.config;
    const jointHw =
      Number(cfg?.spec?.joint_hardware) === 1 ||
      !!cfg?.fromJointScheme ||
      !!parentCfg?.fromJointScheme ||
      Number(parentCfg?.spec?.joint_hardware) === 1;
    if (!jointHw) return;
    const own = node.userData?.own_object;
    if (own) __cldMarkJointHardwareMeshesOnTop(own);
    const kids = node.userData?.cabinet_child_nodes || [];
    for (const ch of kids) {
      if (ch?.userData?.own_object) __cldMarkJointHardwareMeshesOnTop(ch.userData.own_object);
    }
  });
  rootGroup.traverse((o) => {
    if (!o?.isMesh) return;
    if (!_meshIsJointSchemeHardware(o)) return;
    __cldMarkJointHardwareMeshesOnTop(o);
  });
}

function __gltfRootAlignLongAxisToX(root) {
  __gltfRootAlignLongAxisTo(root, 'x');
}

/** Повернуть корень так, чтобы длинная ось AABB стала targetAxis ('x'|'y'|'z'). */
function __gltfRootAlignLongAxisTo(root, targetAxis = 'x') {
  if (!root) return;
  const target = String(targetAxis || 'x').toLowerCase();
  if (target !== 'x' && target !== 'y' && target !== 'z') return;
  root.updateMatrixWorld(true);
  const { box, hasAny } = __computeRobustWorldBox(root);
  if (!hasAny) return;
  const size = box.getSize(new THREE.Vector3());
  let axis = 'x';
  if (size.y >= size.x && size.y >= size.z) axis = 'y';
  else if (size.z >= size.x && size.z >= size.y) axis = 'z';
  if (axis === target) return;
  // Приводим текущую длинную ось → X, затем X → target.
  if (axis === 'y') root.rotateZ(-Math.PI / 2);
  else if (axis === 'z') root.rotateY(Math.PI / 2);
  root.updateMatrixWorld(true);
  if (target === 'x') return;
  if (target === 'y') root.rotateZ(Math.PI / 2);
  else if (target === 'z') root.rotateY(-Math.PI / 2);
  root.updateMatrixWorld(true);
}

/** Нон-uniform вписать AABB объекта точно в заданный размер в его текущих единицах. */
function __gltfRootNonUniformFitToSize(root, targetSize) {
  if (!root || !targetSize) return;
  root.position.set(0, 0, 0);
  root.updateMatrixWorld(true);
  const { box, hasAny } = __computeRobustWorldBox(root);
  if (!hasAny) return;
  const size = box.getSize(new THREE.Vector3());
  const sx = Math.max(size.x, 1e-8);
  const sy = Math.max(size.y, 1e-8);
  const sz = Math.max(size.z, 1e-8);
  const tx = Math.max(Number(targetSize.x) || 0, 1e-6);
  const ty = Math.max(Number(targetSize.y) || 0, 1e-6);
  const tz = Math.max(Number(targetSize.z) || 0, 1e-6);
  // box уже включает текущий scale объекта (у wrapper это 1 / UNITS_MM),
  // поэтому применяем коэффициент поверх него, а не затираем scale.
  root.scale.multiply(new THREE.Vector3(tx / sx, ty / sy, tz / sz));
  root.updateMatrixWorld(true);
  const { box: box2, hasAny: hasAny2 } = __computeRobustWorldBox(root);
  if (!hasAny2) return;
  const c = box2.getCenter(new THREE.Vector3());
  root.position.set(-c.x, -c.y, -c.z);
}

/**
 * Масштаб и центр GLB под эталонный бокс (мм).
 * Равномерный scale: вписываем AABB меша в параллелепипед refSizeMm (как зелёный хелпер узла).
 * Раньше брали max(mesh)=max(ref) — при 50×67×150 целевой «макс» был 150 мм, и узкая сторона
 * (50 мм) не ограничивала масштаб → петля вылезала по ширине; при кубе 100³ это не бросалось в глаза.
 */
function __gltfRootScaleAndCenterToRefMm(root, refSizeMm) {
  if (!root || !refSizeMm) return;
  root.scale.set(1, 1, 1);
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.updateMatrixWorld(true);
  const { box, hasAny } = __computeRobustWorldBox(root);
  if (!hasAny) return;
  const size = new THREE.Vector3();
  box.getSize(size);
  const sx = Math.max(size.x, 1e-8);
  const sy = Math.max(size.y, 1e-8);
  const sz = Math.max(size.z, 1e-8);
  const rx = Math.max(Number(refSizeMm.x) || 0, 1e-6);
  const ry = Math.max(Number(refSizeMm.y) || 0, 1e-6);
  const rz = Math.max(Number(refSizeMm.z) || 0, 1e-6);
  const ux = mmToU(rx);
  const uy = mmToU(ry);
  const uz = mmToU(rz);
  const s = Math.min(ux / sx, uy / sy, uz / sz);
  if (Number.isFinite(s) && s > 0) {
    root.scale.setScalar(s);
    root.updateMatrixWorld(true);
    const { box: box2, hasAny: hasAny2 } = __computeRobustWorldBox(root);
    if (!hasAny2) return;
    const c = box2.getCenter(new THREE.Vector3());
    root.position.set(-c.x, -c.y, -c.z);
  }
}

/**
 * Равномерно подгоняет уже промасштабированный корень под ref (мм → юниты сцены),
 * не обнуляя текущий scale (нужно после {@link __cldInferFileToSceneScaleFactor}).
 */
function __gltfRootMultiplyUniformScaleToRefMm(root, refSizeMm) {
  if (!root || !refSizeMm) return;
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.updateMatrixWorld(true);
  const { box, hasAny } = __computeRobustWorldBox(root);
  if (!hasAny) return;
  const size = new THREE.Vector3();
  box.getSize(size);
  const sx = Math.max(size.x, 1e-8);
  const sy = Math.max(size.y, 1e-8);
  const sz = Math.max(size.z, 1e-8);
  const rx = Math.max(Number(refSizeMm.x) || 0, 1e-6);
  const ry = Math.max(Number(refSizeMm.y) || 0, 1e-6);
  const rz = Math.max(Number(refSizeMm.z) || 0, 1e-6);
  const ux = mmToU(rx);
  const uy = mmToU(ry);
  const uz = mmToU(rz);
  const s = Math.min(ux / sx, uy / sy, uz / sz);
  if (Number.isFinite(s) && s > 0) {
    root.scale.multiplyScalar(s);
    root.updateMatrixWorld(true);
    const { box: box2, hasAny: hasAny2 } = __computeRobustWorldBox(root);
    if (!hasAny2) return;
    const c = box2.getCenter(new THREE.Vector3());
    root.position.set(-c.x, -c.y, -c.z);
  }
}

/**
 * Скоба-ручка в превью админки: ref.x=ширина, ref.y=длина, ref.z=глубина (как handle-runtime).
 * Длинная ось меша → ref.y; две короткие → ref.x и ref.z.
 */
function __gltfRootScaleBarHandleToRefMm(root, refSizeMm) {
  if (!root || !refSizeMm) return;
  const barU = mmToU(Math.max(Number(refSizeMm.y) || 0, 1e-6));
  const phU = mmToU(Math.max(Number(refSizeMm.x) || 0, 1e-6));
  const pdU = mmToU(Math.max(Number(refSizeMm.z) || 0, 1e-6));
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.updateMatrixWorld(true);
  const { box, hasAny } = __computeRobustWorldBox(root);
  if (!hasAny) return;
  const size = new THREE.Vector3();
  box.getSize(size);
  let longA = 'x';
  let s1 = 'y';
  let s2 = 'z';
  let t1 = phU;
  let t2 = pdU;
  if (size.y >= size.x && size.y >= size.z) {
    longA = 'y';
    s1 = 'x';
    s2 = 'z';
  } else if (size.z >= size.x && size.z >= size.y) {
    longA = 'z';
    s1 = 'x';
    s2 = 'y';
  }
  if (size[longA] > 1e-8) root.scale[longA] *= barU / size[longA];
  if (size[s1] > 1e-8) root.scale[s1] *= t1 / size[s1];
  if (size[s2] > 1e-8) root.scale[s2] *= t2 / size[s2];
  root.updateMatrixWorld(true);
  const { box: box2, hasAny: hasAny2 } = __computeRobustWorldBox(root);
  if (!hasAny2) return;
  const c = box2.getCenter(new THREE.Vector3());
  root.position.set(-c.x, -c.y, -c.z);
}

/**
 * Переводит «сырые» координаты файла в юниты сцены движка (1 юнит = UNITS_MM мм).
 * glTF по спецификации — метры; CAD часто пишет миллиметры числами.
 * Явно: cabinet_model.params.import_linear_unit = 'mm' | 'm' | 'cm' | 'scene'.
 */
function __cldInferFileToSceneScaleFactor(root, spec, assetMeta) {
  const sp = spec && typeof spec === 'object' ? spec : {};
  const raw =
    sp.import_linear_unit ??
    sp.importLinearUnit ??
    sp.linear_unit ??
    sp.asset_linear_unit ??
    sp.assetLinearUnit;
  const u = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (u === 'mm' || u === 'millimeter' || u === 'millimeters') return 1 / UNITS_MM;
  if (u === 'm' || u === 'meter' || u === 'meters' || u === 'metre') return 1000 / UNITS_MM;
  if (u === 'cm' || u === 'centimeter' || u === 'centimeters') return 10 / UNITS_MM;
  if (u === 'scene' || u === 'native' || u === 'unit' || u === 'units') return 1;

  root.updateMatrixWorld(true);
  const { box, hasAny } = __computeRobustWorldBox(root);
  if (!hasAny) return 1 / UNITS_MM;
  const size = box.getSize(new THREE.Vector3());
  const M = Math.max(size.x, size.y, size.z);

  // Не вешаться на generator (SimLab/SketchUp): после правильного экспорта в метрах
  // габарит ~0.01…3 м, а «сырые мм» в буфере дают M десятки–сотни (петля ~62, рельс ~320).
  // Раньше SimLab всегда шли в ветку «как мм» → метрический GLB получал лишний /10 и
  // дальше fitToSize/preview_ref_mm раздували модель обратно.
  void assetMeta;

  // Метры (канон glTF 2.0): типичный кухонный модуль / фурнитура после compose < ~3.5 м.
  if (M <= 3.5) return 1000 / UNITS_MM;
  // Координаты в миллиметрах (CAD) — десятки…тысячи.
  return 1 / UNITS_MM;
}

/**
 * Как у {@link CabinetModelNode._build_spec}: перевод единиц файла → сцена и множитель из каталога
 * (`params.scale` в формате админки: 100 = 100%). Без этого превью #models3d и конструктор расходятся.
 */
function _m3ApplyImportAndCatalogScaleToPreviewContent(content, modelParams, assetMeta) {
  if (!content) return;
  content.scale.set(1, 1, 1);
  content.position.set(0, 0, 0);
  content.rotation.set(0, 0, 0);
  content.updateMatrixWorld(true);
  const mp = modelParams && typeof modelParams === 'object' ? modelParams : {};

  let rawMax = 0;
  try {
    const { box: rawBox, hasAny: rawHas } = __computeRobustWorldBox(content);
    if (rawHas) {
      const sz = rawBox.getSize(new THREE.Vector3());
      rawMax = Math.max(sz.x, sz.y, sz.z);
    }
  } catch (_) {}

  const imp = __cldInferFileToSceneScaleFactor(content, mp, assetMeta);
  content.scale.setScalar(imp);
  content.updateMatrixWorld(true);
  const catSc = __cldCabinetModelCatalogScaleVec({ params: mp });
  if (catSc) {
    content.scale.multiply(catSc);
    content.updateMatrixWorld(true);
  }

  try {
    const { box: finalBox, hasAny: finalHas } = __computeRobustWorldBox(content);
    let finalMm = null;
    let finalU = null;
    if (finalHas) {
      const fsz = finalBox.getSize(new THREE.Vector3());
      finalU = {
        x: Math.round(fsz.x * 10000) / 10000,
        y: Math.round(fsz.y * 10000) / 10000,
        z: Math.round(fsz.z * 10000) / 10000,
      };
      finalMm = {
        x: Math.round(fsz.x * UNITS_MM * 100) / 100,
        y: Math.round(fsz.y * UNITS_MM * 100) / 100,
        z: Math.round(fsz.z * UNITS_MM * 100) / 100,
      };
    }
    const cs = catSc ? `(${catSc.x}, ${catSc.y}, ${catSc.z})` : 'null';
    const fmm = finalMm ? `${finalMm.x}x${finalMm.y}x${finalMm.z}mm` : 'n/a';
    const fu = finalU ? `${finalU.x}x${finalU.y}x${finalU.z}u` : 'n/a';
    // eslint-disable-next-line no-console
    console.log(
      `[CLD][m3preview] scale chain: rawFileMax=${rawMax}; imp=${imp}; catScale=${cs}; final=${fmm} (${fu}); UNITS_MM=${UNITS_MM}`
    );
    if (Number.isFinite(rawMax) && rawMax > 0 && finalU) {
      const eff = Math.max(finalU.x, finalU.y, finalU.z) / rawMax;
      // eslint-disable-next-line no-console
      console.log(`[CLD][m3preview] effective scale (final_u / raw) = ${eff}`);
    }
  } catch (_) {}
}

/**
 * Подгонка превью модели cabinet_model в админке.
 *
 * Раньше у этой функции была «зашитая» нормализация под 85 % максимальной стороны рамки —
 * она всегда растягивала модель к рамке (720/600/600), из‑за чего любые правки в SketchUp
 * и каталожный `params.scale` не были видны: импорт давал 60 мм, потом fit‑to‑frame
 * множил обратно до ~610 мм. Теперь поведение совпадает с конструктором
 * ({@link CabinetModelNode._build_spec}): применяем импорт единиц + каталожный масштаб
 * и **только центрируем**. Если в каталоге указан `preview_ref_mm` — вписываем в этот бокс.
 */
function _fitM3PreviewModelContent(content, modelParams, assetMeta) {
  if (!content) return;
  const mp = modelParams !== undefined && modelParams !== null ? modelParams : _m3LastModelParams;
  const am = assetMeta !== undefined ? assetMeta : _m3LastGltfAssetMeta;

  content.scale.set(1, 1, 1);
  content.position.set(0, 0, 0);
  content.rotation.set(0, 0, 0);
  content.updateMatrixWorld(true);
  _m3ApplyImportAndCatalogScaleToPreviewContent(content, mp, am);

  if (_m3PreviewRefSizeMm && typeof _m3PreviewRefSizeMm === 'object') {
    if (_m3HandleBarFit) {
      __gltfRootScaleBarHandleToRefMm(content, _m3PreviewRefSizeMm);
    } else {
      __gltfRootMultiplyUniformScaleToRefMm(content, _m3PreviewRefSizeMm);
    }
    return;
  }

  content.updateMatrixWorld(true);
  const { box, hasAny } = __computeRobustWorldBox(content);
  if (!hasAny) return;
  const c = box.getCenter(new THREE.Vector3());
  content.position.set(-c.x, -c.y, -c.z);
}

function _m3ResolvePreviewRefMm(modelParams, url, messagePreviewRefMm) {
  if (messagePreviewRefMm && typeof messagePreviewRefMm === 'object') {
    const x = Number(messagePreviewRefMm.x);
    const y = Number(messagePreviewRefMm.y);
    const z = Number(messagePreviewRefMm.z);
    if (x > 0 && y > 0 && z > 0) return { x, y, z };
  }
  const p = modelParams || {};
  if (p.preview_ref_mm && typeof p.preview_ref_mm === 'object') {
    const x = Number(p.preview_ref_mm.x);
    const y = Number(p.preview_ref_mm.y);
    const z = Number(p.preview_ref_mm.z);
    if (x > 0 && y > 0 && z > 0) return { x, y, z };
  }
  void url;
  return null;
}

function _applyM3PreviewUserTransform(transform) {
  if (!_m3PreviewRoot) return;
  const t = transform || {};
  const p = t.position || {};
  const r = t.rotation || {};
  const s = t.scale || {};
  const sx = Number(s.x);
  const sy = Number(s.y);
  const sz = Number(s.z);
  _m3PreviewRoot.scale.set(
    Number.isFinite(sx) && sx !== 0 ? sx : 1,
    Number.isFinite(sy) && sy !== 0 ? sy : 1,
    Number.isFinite(sz) && sz !== 0 ? sz : 1
  );
  _m3PreviewRoot.position.set(
    mmToU(Number(p.x) || 0),
    mmToU(Number(p.y) || 0),
    mmToU(Number(p.z) || 0)
  );
  _m3PreviewRoot.rotation.set(
    THREE.MathUtils.degToRad(Number(r.x) || 0),
    THREE.MathUtils.degToRad(Number(r.y) || 0),
    THREE.MathUtils.degToRad(Number(r.z) || 0)
  );
}

function _refitM3PreviewInner() {
  if (!_m3PreviewRoot || !_m3PreviewRoot.children.length) return;
  const content = _m3PreviewRoot.children[0];
  // Подгонка по AABB (setFromObject) в мировых координатах. Если на родителе уже стоит user scale (0.1 и т.д.),
  // bbox занижается → __gltfRootScaleAndCenterToRefMm завышает scale на мешах и «съедает» масштаб через ~секунду
  // после cld:setMaterials / cld:setSize (оба вызывают rebuild → сюда).
  _m3PreviewRoot.position.set(0, 0, 0);
  _m3PreviewRoot.rotation.set(0, 0, 0);
  _m3PreviewRoot.scale.set(1, 1, 1);
  _m3PreviewRoot.updateMatrixWorld(true);
  _fitM3PreviewModelContent(content, _m3LastModelParams, _m3LastGltfAssetMeta);
  _applyM3PreviewUserTransform(_m3LastUserTransform);
  _m3SpawnRodCompanionsPreview().catch(() => {});
}

/** Смонтировать загруженный корень (GLTF scene или FBX Group) в сцену превью каталога 3D. */
function _mountM3PreviewContent(content, modelParams, assetMeta, loadGen) {
  if (!content) return;
  if (loadGen != null && loadGen !== _m3LoadGen) {
    try {
      disposeObject(content);
    } catch (_) {}
    return;
  }
  // На случай гонки двух load: предыдущий корень мог уже попасть в scene.
  if (_m3PreviewRoot) {
    try {
      scene.remove(_m3PreviewRoot);
      disposeObject(_m3PreviewRoot);
    } catch (_) {}
    _m3PreviewRoot = null;
  }
  _m3LastGltfAssetMeta = assetMeta != null ? assetMeta : null;
  _m3PreviewRoot = new THREE.Group();
  _m3PreviewRoot.name = '__cld_cabinet_model_preview';
  const meshCount = _stripM3PreviewNonMeshes(content);
  _normalizeM3PreviewDrawables(content);
  _m3PreviewRoot.add(content);
  // eslint-disable-next-line no-console
  console.log(`[CLD][m3preview] stripped non-mesh nodes; meshes kept=${meshCount}`);
  _fitM3PreviewModelContent(content, modelParams, assetMeta);
  _applyM3PreviewUserTransform(_m3LastUserTransform);
  _m3SpawnRodCompanionsPreview().catch(() => {});
  scene.add(_m3PreviewRoot);
  _cldBindModels3dPreviewEnv(_m3PreviewRoot);
  __cameraWasAutoFitted = false;
  _fitPreviewCameraCombined();
  __cameraWasAutoFitted = true;
  const meshNames = [];
  content.traverse((o) => {
    if (o.isMesh) meshNames.push(o.name || `mesh_${meshNames.length}`);
  });
  try {
    window.parent?.postMessage({ type: 'cld:modelLoaded' }, '*');
    if (meshNames.length) {
      window.parent?.postMessage({ type: 'cld:modelMeshes', meshes: meshNames }, '*');
    }
    _m3PreviewRoot.updateMatrixWorld(true);
    const { box: wb, hasAny } = __computeRobustWorldBox(_m3PreviewRoot);
    if (!hasAny) return;
    const sz = wb.getSize(new THREE.Vector3());
    if (sz.x > 1e-6 || sz.y > 1e-6 || sz.z > 1e-6) {
      const q = (n) => Math.round(Number(n) * UNITS_MM * 100) / 100;
      window.parent?.postMessage(
        {
          type: 'cld:modelBBoxMm',
          min: [q(wb.min.x), q(wb.min.y), q(wb.min.z)],
          max: [q(wb.max.x), q(wb.max.y), q(wb.max.z)],
        },
        '*'
      );
      const rs = _m3PreviewRoot.scale;
      // eslint-disable-next-line no-console
      console.log(
        `[CLD][m3preview] mounted world bbox = ${q(sz.x)}x${q(sz.y)}x${q(sz.z)}mm; root.scale=(${rs.x}, ${rs.y}, ${rs.z})`
      );
    }
  } catch (_) {}
  render();
}

async function _applyM3PreviewMaterialsNow() {
  if (!_m3PreviewRoot || !_m3LastModelParams || !_m3PreviewRoot.children.length) return;
  const meshMap = _m3LastModelParams?.meshes;
  const hasMeshMap = !!(meshMap && typeof meshMap === 'object');
  await __cldEnsureMaterialItemsByKey();

  const content = _m3PreviewRoot.children[0];
  const tasks = [];
  content.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    const cfg = hasMeshMap ? __cldFindModelMeshMaterialConfig(meshMap, o.name || '') : null;
    if (!cfg || typeof cfg !== 'object') return;
    // В models3d: только material_id. Если не задан — пропускаем (оставляем материал из GLB, как в рефе).
    const token = (__CLD_CONTEXT === 'models3d')
      ? (cfg.material_id ?? cfg.mat_id)
      : (cfg.selected ?? cfg.mat_id ?? cfg.material_id ?? cfg.mat_key ?? cfg.m ?? cfg.material ?? cfg.material_key);
    if (token == null || String(token).trim() === '') return;
    tasks.push({ mesh: o, token: String(token).trim() });
  });

  if (!tasks.length && hasMeshMap) {
    // В models3d режиме: если material_id не задан — НЕ применяем fallback.
    // Модель должна оставаться с материалом, который запечён в GLB (как в рефе).
    if (__CLD_CONTEXT === 'models3d') {
      _cldBindModels3dPreviewEnv(_m3PreviewRoot);
      render();
      return; // строго: нет material_id = нет применения материала
    }
    // Same behavior as cabinet model render path: if mesh names don't match, apply first valid token to all.
    let fallbackToken = '';
    for (const k of Object.keys(meshMap)) {
      const cfg = meshMap[k];
      if (!cfg || typeof cfg !== 'object') continue;
      const token = (cfg.selected ?? cfg.mat_id ?? cfg.material_id ?? cfg.mat_key ?? cfg.m ?? cfg.material ?? cfg.material_key);
      if (token == null || String(token).trim() === '') continue;
      fallbackToken = String(token).trim();
      break;
    }
    if (!fallbackToken) return;
    content.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      tasks.push({ mesh: o, token: fallbackToken });
    });
  }
  // Hard fallback is allowed only outside strict models3d mode.
  // In models3d strict mode we must not invent material mapping.
  if (!tasks.length && !hasMeshMap && __CLD_CONTEXT !== 'models3d' && incomingMaterials && typeof incomingMaterials === 'object') {
    const firstKey = Object.keys(incomingMaterials).find((k) => String(k || '').trim() !== '');
    if (firstKey) {
      content.traverse((o) => {
        if (!o.isMesh || !o.material) return;
        tasks.push({ mesh: o, token: String(firstKey).trim() });
      });
    }
  }
  if (!tasks.length) {
    _cldBindModels3dPreviewEnv(_m3PreviewRoot);
    return;
  }

  let __loggedFirstMaterialPayload = false;
  for (const t of tasks) {
    const cfg = hasMeshMap ? __cldFindModelMeshMaterialConfig(meshMap, t.mesh?.name || '') : null;
    let incomingItem = null;
    let parsed = {};
    if (__CLD_CONTEXT === 'models3d') {
      const idFromCfg =
        Number(cfg?.material_id ?? cfg?.mat_id);
      const idFromToken = Number(String(t.token).replace(/^material_/i, ''));
      const strictId = Number.isFinite(idFromCfg) && idFromCfg > 0 ? idFromCfg : (Number.isFinite(idFromToken) && idFromToken > 0 ? idFromToken : 0);
      if (!strictId) {
        console.warn('[CLD][models3d-material-apply] strict mode: no model_key_material id for mesh', {
          mesh: t.mesh?.name || '(unnamed)',
          token: t.token,
          cfg: cfg || null,
        });
        continue;
      }
      incomingItem =
        __cldFindIncomingModelMaterialByToken(String(strictId)) ||
        __cldFindIncomingModelMaterialByToken(t.token) ||
        (await __cldFetchModelKeyMaterialById(strictId));
      if (!incomingItem) {
        console.warn('[CLD][models3d-material-apply] strict mode: material card not found', {
          mesh: t.mesh?.name || '(unnamed)',
          materialId: strictId,
        });
        continue;
      }
    } else {
    const item = __cldFindMaterialItemByToken(t.token);
      incomingItem = __cldFindIncomingModelMaterialByToken(t.token);
      parsed = __cldExtractModelKeyMaterialParams(item);
    }
    const texPath = incomingItem?.map || parsed.map || '';
    const normalPath = incomingItem?.normalMap || parsed.normalMap || '';
    const roughPath = incomingItem?.roughnessMap || parsed.roughnessMap || '';
    if (!__loggedFirstMaterialPayload) {
      __loggedFirstMaterialPayload = true;
      console.info('[CLD][models3d-material-apply] sample payload', {
        mesh: t.mesh?.name || '(unnamed)',
        token: t.token,
        incoming: incomingItem || null,
        parsed: parsed || null,
        texPath,
        normalPath,
        roughPath,
        hasUV: !!t.mesh?.geometry?.attributes?.uv,
        uvCount: t.mesh?.geometry?.attributes?.uv?.count || 0,
      });
    }
    const tex = texPath ? await __cldEnsureTexture(texPath) : null;
    if (texPath && !tex) {
      console.warn('[CLD][models3d-material-apply] texture failed', {
        mesh: t.mesh?.name || '(unnamed)',
        texPath,
      });
    }
    const normalTex = normalPath ? await __cldEnsureTexture(normalPath) : null;
    const roughTex = roughPath ? await __cldEnsureTexture(roughPath) : null;
    let mats = Array.isArray(t.mesh.material) ? t.mesh.material.slice() : [t.mesh.material];
    mats = mats.map((m) => {
      if (!m) return null;
      // Some imported formats keep non-standard shaders/materials that ignore color/metalness updates.
      // For models3d editor we force Standard material to guarantee visible result in preview.
      if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) return m;
      const std = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 1,
      });
      std.name = m.name || std.name;
      return std;
    });
    t.mesh.material = Array.isArray(t.mesh.material) ? mats : mats[0];
    mats.forEach((m) => {
      if (!m) return;
      const color = __cldNormalizeMaterialColorValue(incomingItem?.color || parsed.color || '#ffffff');
      const chromeHint = /chrom|chrome|хром/i.test(String(t.token || ''))
        || /chrom|chrome|хром/i.test(String(incomingItem?.name || parsed?.name || ''));
      const metalness = incomingItem?.metalness ?? parsed.metalness;
      const roughness = incomingItem?.roughness ?? parsed.roughness;
      if (metalness != null && Number.isFinite(Number(metalness))) m.metalness = Math.max(0, Math.min(1, Number(metalness)));
      if (roughness != null && Number.isFinite(Number(roughness))) m.roughness = Math.max(0, Math.min(1, Number(roughness)));
      const transparent = incomingItem?.transparent ?? parsed.transparent;
      const opacity = incomingItem?.opacity ?? parsed.opacity;
      if (transparent != null) m.transparent = !!transparent;
      if (opacity != null && Number.isFinite(Number(opacity))) m.opacity = Math.max(0, Math.min(1, Number(opacity)));
      if (tex) {
        const local = tex.clone();
        local.needsUpdate = true;
        m.map = local;
        try { m.color = new THREE.Color(0xffffff); } catch (_) {}
      } else {
        m.map = null;
        try { m.color = new THREE.Color(color || '#ffffff'); } catch (_) {}
      }
      if (normalTex) {
        const localN = normalTex.clone();
        localN.needsUpdate = true;
        m.normalMap = localN;
      } else {
        m.normalMap = null;
      }
      if (roughTex) {
        const localR = roughTex.clone();
        localR.needsUpdate = true;
        m.roughnessMap = localR;
      } else {
        m.roughnessMap = null;
      }
      // Strict mode keeps params exactly from model_key_material card, no visual overrides.
      // no forced "chrome look" override: use only user material params
      if (__CLD_CONTEXT === 'models3d') m.envMapIntensity = 1;
      if (window.__CLD_DEBUG_MATERIALS) {
        console.log('[CLD][models3d-material-apply]', {
          mesh: t.mesh?.name || '(unnamed)',
          token: t.token,
          color,
          chromeHint,
          hasMap: !!texPath,
          hasUV: !!t.mesh?.geometry?.attributes?.uv,
          uvCount: t.mesh?.geometry?.attributes?.uv?.count || 0,
          metalness: m.metalness,
          roughness: m.roughness,
        });
      }
      m.needsUpdate = true;
    });
  }
  console.info('[CLD][models3d-material-apply] done', { meshes: tasks.length, hasMeshMap, strict: __CLD_CONTEXT === 'models3d' });
  _cldBindModels3dPreviewEnv(_m3PreviewRoot);
  render();
}

function _postM3PreviewLoadError(url, err) {
  console.error('[CLD][models3d preview] model load failed:', url, err);
  try {
    window.parent?.postMessage(
      {
        type: 'cld:modelLoadError',
        url,
        message: String(err?.message || err || 'load error'),
      },
      '*'
    );
  } catch (_) {}
}

function _previewFitPadding() {
  const treeEmpty =
    !Array.isArray(moduleTemplateTree) || moduleTemplateTree.length === 0;
  if (__cldEmbeddedPreview && (!rootGroup || treeEmpty)) {
    return FIT_PADDING_EMPTY_EMBEDDED;
  }
  if (
    __cldEmbeddedPreview &&
    __cldPreviewPlacementKind === 'standalone_floor' &&
    rootGroup &&
    state.h > 0 &&
    state.h <= 1200
  ) {
    return FIT_PADDING_STANDALONE_FLOOR;
  }
  return FIT_PADDING;
}

/** Камера: модуль ИЛИ (размеры + превью GLB), как в админке 3D моделей. */
function _fitPreviewCameraCombined() {
  const pad = _previewFitPadding();
  if (rootGroup) {
    fitCameraToCenteredObject(camera, rootGroup, pad, controls);
    controls.update();
    return;
  }
  const box = new THREE.Box3();
  let has = false;
  const expand = (obj) => {
    if (!obj) return;
    obj.updateMatrixWorld(true);
    const { box: rb, hasAny } = __computeRobustWorldBox(obj);
    const b = rb;
    if (hasAny && b && !b.isEmpty()) {
      if (!has) {
        box.copy(b);
        has = true;
      } else {
        box.union(b);
      }
    }
  };
  // Фурнитура (направляющие, петли): рамка 600×720×600 съедает модель в кадре — фокус на GLB.
  if (__CLD_CONTEXT === 'models3d' && _m3PreviewRoot) {
    expand(_m3PreviewRoot);
    if (has) {
      const size = box.getSize(new THREE.Vector3());
      const c = box.getCenter(new THREE.Vector3());
      const gw = Math.max(size.x, 1e-3);
      const gh = Math.max(size.y, 1e-3);
      const gd = Math.max(size.z, 1e-3);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(gw, gh, gd));
      mesh.position.copy(c);
      fitCameraToCenteredObject(camera, mesh, FIT_PADDING_MODELS3D_GL, controls);
      mesh.geometry.dispose();
      controls.update();
      return;
    }
    has = false;
    box.makeEmpty();
  }
  expand(dimsGroup);
  expand(_m3PreviewRoot);
  if (!has) return;
  const size = box.getSize(new THREE.Vector3());
  const c = box.getCenter(new THREE.Vector3());
  const gw = Math.max(size.x, 1e-3);
  const gh = Math.max(size.y, 1e-3);
  const gd = Math.max(size.z, 1e-3);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(gw, gh, gd));
  mesh.position.copy(c);
  fitCameraToCenteredObject(camera, mesh, pad, controls);
  mesh.geometry.dispose();
  controls.update();
}

// Debug toggles (can be set in DevTools on preview iframe):
//   window.__CLD_DEBUG_MATERIALS = true
//   window.__CLD_SHOW_HINGE_HOLE_OUTLINES = false  — скрыть красные контуры отверстий петель (по умолчанию показаны)
//   Петля в accessories: hingeFacadeDrillTemplateId / hingeDoorDrillTemplateId — id шаблона присадки (LS clodis_drilling_templates_v2) для CFRN; modelUrl — визуал GLB.
window.__CLD_DEBUG_MATERIALS = window.__CLD_DEBUG_MATERIALS ?? false;

function templateTreeHasWalls(tree) {
  if (!Array.isArray(tree)) return false;
  const stack = [...tree];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    if (n.type === 'wall') return true;
    if (Array.isArray(n.children)) stack.push(...n.children);
  }
  return false;
}

/**
 * Жесткая сверка JSON с эталоном петли из референса (без автопочинки):
 * - animator.spec.fn === 'rotate'
 * - animator содержит child type:model и type:furniture
 * - соседняя section с model содержит type:furniture
 */
function __cldValidateRefHingeTree(tree) {
  if (!Array.isArray(tree)) return;
  const walk = (node, path) => {
    if (!node || typeof node !== 'object') return;
    const label = String(node.name || node.type || '?');
    const p = path ? `${path} > ${label}` : label;
    const ch = Array.isArray(node.children) ? node.children : [];

    if (node.type === 'animator') {
      const hasModel = ch.some((c) => c && c.type === 'model');
      if (hasModel) {
        const fn = String(node?.spec?.fn || '').trim();
        if (fn !== 'rotate') {
          console.error(`[CLD][ref-validation] ${p}: spec.fn должно быть "rotate", сейчас "${fn || '(пусто)'}".`);
        }
        if (!ch.some((c) => c && c.type === 'furniture')) {
          console.error(`[CLD][ref-validation] ${p}: отсутствует дочерний type "furniture" (присадка как в рефе).`);
        }
      }
    }

    if (node.type === 'section') {
      const animator = ch.find((c) => c && c.type === 'animator');
      const animatorHasModel = !!(animator && Array.isArray(animator.children) && animator.children.some((c) => c && c.type === 'model'));
      if (animatorHasModel) {
        const siblingSections = ch.filter((c) => c && c.type === 'section');
        siblingSections.forEach((sec) => {
          const secChildren = Array.isArray(sec.children) ? sec.children : [];
          const hasModel = secChildren.some((c) => c && c.type === 'model');
          if (!hasModel) return;
          const hasFurniture = secChildren.some((c) => c && c.type === 'furniture');
          if (!hasFurniture) {
            console.error(
              `[CLD][ref-validation] ${p} > ${sec.name || 'Секция'}: рядом с model "к корпусу" должен быть type "furniture" (как в рефе).`
            );
          }
        });
      }
    }

    ch.forEach((c) => walk(c, p));
  };
  tree.forEach((n) => walk(n, ''));
}

/** Кэш загруженных корней GLB для петель (один URL → один шаблон для clone). */
const __hingeGltfRootPromises = new Map();

function __resolveHingeGltfUrl(acc) {
  if (!acc || typeof acc !== 'object') return '';
  const u = acc.modelUrl || acc.glbUrl || acc.glb || acc.model3d || '';
  return typeof u === 'string' ? u.trim() : '';
}

function __resolveHingeGltfUrlFacade(acc) {
  if (!acc || typeof acc !== 'object') return '';
  const u = acc.modelUrlFacade || acc.glbUrlFacade || '';
  return typeof u === 'string' ? u.trim() : '';
}

function __loadHingeGltfRootOnce(url) {
  if (!url) return Promise.resolve(null);
  if (__hingeGltfRootPromises.has(url)) return __hingeGltfRootPromises.get(url);
  const loader = new GLTFLoader();
  const p = new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        try {
          if (gltf.scene) {
            gltf.scene.userData = gltf.scene.userData || {};
            gltf.scene.userData.__cldGltfAsset = gltf.asset || null;
          }
        } catch (_) {}
        resolve(gltf.scene);
      },
      undefined,
      (err) => {
        console.warn('[CLD] hinge GLB load error:', url, err);
        resolve(null);
      }
    );
  });
  __hingeGltfRootPromises.set(url, p);
  return p;
}

// ── Каталог furniture (Clodis pp.libs.furniture): spec.id → params, size, children (hole nodes) ──
let __cldFurnitureCatalogMap = null;
let __cldFurnitureCatalogPromise = null;

function __ensureFurnitureCatalog() {
  if (__cldFurnitureCatalogMap) return Promise.resolve(__cldFurnitureCatalogMap);
  if (__cldFurnitureCatalogPromise) return __cldFurnitureCatalogPromise;
  __cldFurnitureCatalogPromise = fetch('/api/catalog/items_get/furniture', { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : { items: [] }))
    .then(payload => {
      const map = Object.create(null);
      const items = Array.isArray(payload?.items) ? payload.items : [];
      for (const it of items) {
        const id = String(it?.id ?? '').trim();
        if (!id) continue;
        let parsed = {};
        try { parsed = typeof it.data === 'string' ? JSON.parse(it.data) : (it.data || {}); } catch (_) {}
        map[id] = {
          name: it.name || parsed.name || '',
          size: parsed.size || { x: 0, y: 0, z: 0 },
          children: Array.isArray(parsed.children) ? parsed.children : [],
          params: parsed.params || {},
        };
      }
      __cldFurnitureCatalogMap = map;
      try {
        if (typeof window !== 'undefined') window.__CLD_FURNITURE_CATALOG_MAP = map;
      } catch (_) {}
      console.log('[CLD] furniture catalog loaded, items:', Object.keys(map).length);
      return map;
    })
    .catch(e => {
      console.warn('[CLD] furniture catalog load failed:', e);
      __cldFurnitureCatalogMap = Object.create(null);
      try {
        if (typeof window !== 'undefined') window.__CLD_FURNITURE_CATALOG_MAP = __cldFurnitureCatalogMap;
      } catch (_) {}
      return __cldFurnitureCatalogMap;
    });
  return __cldFurnitureCatalogPromise;
}

function _getFurnitureCatalogItem(specId) {
  if (!__cldFurnitureCatalogMap) return null;
  return __cldFurnitureCatalogMap[String(specId)] || null;
}

// Pre-load on init (non-blocking)
__ensureFurnitureCatalog();
console.log('[CLD] constructor-clodis.js loaded (debug build children v2)');
console.log('[CLD][ref-validation] constructor-clodis validator loaded v=20260415-hole-helpers-v10-only-green-on-select');

/** Цепочка выбора дерева → 3D. Фильтр: `[CLD-SEL]`. Включить подробно: `?cldSel=1` или `window.__CLD_DEBUG_SELECTION=true` */
let __cldSelLogLastSig = '';
function __cldSelLog(payload, opts) {
  try {
    const verbose =
      (typeof window !== 'undefined' &&
        (window.__CLD_DEBUG_SELECTION === true || /[?&]cldSel=1\b/.test(String(window.location?.search || '')))) ||
      (opts && opts.force);
    if (!verbose) return;
    const sig = `${payload.step}|${payload.path}|${payload.nodeType}|${payload.via || ''}`;
    if (payload.step === 'postMessage' && sig === __cldSelLogLastSig) return;
    if (payload.step === 'postMessage') __cldSelLogLastSig = sig;
    const row = { src: 'constructor-clodis', ...payload };
    console.log('[CLD-SEL]', row);
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'cld:selectionDebug', ...row }, '*');
    }
  } catch (_) {}
}

// ── Каталог cabinet_model (Clodis models3d_lib): spec.id узла type:model → params.models[].model ──
let __cldCabinetModelLibInjected = null;
let __cldCabinetModelLibMapPromise = null;

function __setCabinetModelLibraryInjected(items) {
  __cldCabinetModelLibInjected = items && typeof items === 'object' ? items : null;
  __cldCabinetModelLibMapPromise = null;
}

function __ensureCabinetModelLibraryMap() {
  if (__cldCabinetModelLibInjected) {
    return Promise.resolve(__cldCabinetModelLibInjected);
  }
  const loaderApi = typeof globalThis !== 'undefined' ? globalThis.__cldRoomCabinetModels : null;
  if (loaderApi && typeof loaderApi.ensureCabinetModelLibraryMap === 'function') {
    return loaderApi.ensureCabinetModelLibraryMap();
  }
  if (__cldCabinetModelLibMapPromise) return __cldCabinetModelLibMapPromise;
  __cldCabinetModelLibMapPromise = fetch('/api/catalog/items_get/cabinet_model', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : { items: [] }))
    .then((payload) => {
      const map = Object.create(null);
      const items = Array.isArray(payload?.items) ? payload.items : [];
      for (const it of items) {
        const id = String(it?.id ?? '').trim();
        if (!id) continue;
        let params = it.params;
        if (!params && it.data != null) {
          try {
            const d = typeof it.data === 'string' ? JSON.parse(it.data) : it.data;
            params = d?.params || d;
          } catch (_) {
            params = {};
          }
        }
        map[id] = { params: params && typeof params === 'object' ? params : {} };
      }
      return map;
    })
    .catch(() => Object.create(null));
  return __cldCabinetModelLibMapPromise;
}

/**
 * Подтягиваем hingeFacadeDrillTemplateId / hingeDoorDrillTemplateId с карточки каталога петли (как в рефе),
 * если в clodis spec их нет — иначе превью не знает id шаблонов в clodis_drilling_templates_v2.
 */
function __cldFetchHingeCatalogDrillOverlay(specFlat) {
  const sp = specFlat && typeof specFlat === 'object' ? specFlat : {};
  const productId = String(sp.id || '').trim();
  if (!productId) return Promise.resolve(null);
  const ctrls = [];
  const k = String(sp.hingeCatalogTypeKey || '').trim();
  if (k) ctrls.push(k);
  if (!ctrls.includes('hinges')) ctrls.push('hinges');
  const unique = [...new Set(ctrls)];
  const tryOne = (controller) =>
    fetch(
      `/api/catalog/item/${encodeURIComponent(controller)}/${encodeURIComponent(productId)}?t=${Date.now()}`,
      { cache: 'no-store' }
    ).then((r) => (r.ok ? r.json() : null));
  return (async () => {
    for (const c of unique) {
      try {
        const item = await tryOne(c);
        if (!item) continue;
        let params = item.params;
        if ((!params || typeof params !== 'object') && item.data != null) {
          try {
            const d = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
            params = d?.params || d || {};
          } catch (_) {
            params = {};
          }
        }
        if (!params || typeof params !== 'object') continue;
        const out = {};
        const posId = (v) => {
          const n = Number(v);
          return Number.isFinite(n) && n > 0 ? n : 0;
        };
        let f = posId(params.hingeFacadeDrillTemplateId);
        let d = posId(params.hingeDoorDrillTemplateId);
        if (f) out.hingeFacadeDrillTemplateId = f;
        if (d) out.hingeDoorDrillTemplateId = d;
        if (!out.hingeFacadeDrillTemplateId || !out.hingeDoorDrillTemplateId) {
          const ordered = [];
          const models = Array.isArray(params.models) ? params.models : [];
          for (const m of models) {
            const mp = m?.params;
            if (!mp || typeof mp !== 'object') continue;
            const vf = posId(mp.hingeFacadeDrillTemplateId);
            const vd = posId(mp.hingeDoorDrillTemplateId);
            const vt = posId(mp.drillTemplateId);
            if (vf) ordered.push(vf);
            if (vd) ordered.push(vd);
            if (vt) ordered.push(vt);
          }
          const uniq = [...new Set(ordered)];
          if (!out.hingeFacadeDrillTemplateId && uniq[0]) out.hingeFacadeDrillTemplateId = uniq[0];
          if (!out.hingeDoorDrillTemplateId && uniq[1]) out.hingeDoorDrillTemplateId = uniq[1];
        }
        if (Object.keys(out).length) {
          __cldLogHingeFlatDrill('info', 'hinge catalog API: drill ids', { controller: c, productId, ...out });
          return out;
        } else {
          __cldLogHingeFlatDrill('info', 'hinge catalog API: full response (no drill ids found)', {
            controller: c,
            productId,
            hasParams: !!params,
            paramsKeys: params ? Object.keys(params) : [],
            modelsCount: Array.isArray(params?.models) ? params.models.length : 0,
            sampleModelParams: params?.models?.[0]?.params ? Object.keys(params.models[0].params) : null,
          });
        }
      } catch (e) {
        __cldLogHingeFlatDrill('warn', 'hinge catalog API fetch failed', {
          controller: c,
          productId,
          err: String(e?.message || e),
        });
      }
    }
    __cldLogHingeFlatDrill('info', 'hinge catalog API: no drill ids in card', { productId, tried: unique });
    return null;
  })();
}

function __resolveAssetUrlForModel(path) {
  const s = String(path || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  try {
    return new URL(s.startsWith('/') ? s : `/${s}`, window.location.origin).href;
  } catch (_) {
    return s;
  }
}

/**
 * `params.models[].params.scale` в каталоге cabinet_model.
 *
 * Реф (`_load_model`): применяет значение литерально — там нет авто-определения единиц,
 * и `scale = 100` для obj‑в‑метрах = 1000 мм/м ÷ UNITS_MM(10) — единственный путь
 * перевести вершины в юниты сцены.
 *
 * У нас единицы файла уже учитываются `__cldInferFileToSceneScaleFactor` (mm/m). Чтобы
 * каталожный `params.scale` не дублировал юнитный множитель, трактуем его **как процент**
 * относительно админской формы: поле «Масштаб» = 1 (что админка сохраняет как 100) даёт
 * множитель 1.0 поверх авто‑определения. Это совпадает с тем, что пользователь видит и
 * правит в форме (`scale.value = stored / 100`, `stored = value × 100`).
 */
function __cldCabinetModelCatalogScaleVec(entry) {
  const sc = entry?.params && typeof entry.params === 'object' ? entry.params.scale : null;
  if (!sc || typeof sc !== 'object') return null;
  const sx = Number(sc.x);
  const sy = Number(sc.y);
  const sz = Number(sc.z);
  if (!Number.isFinite(sx) || !Number.isFinite(sy) || !Number.isFinite(sz)) return null;
  if (sx <= 0 || sy <= 0 || sz <= 0) return null;
  return new THREE.Vector3(sx / 100, sy / 100, sz / 100);
}

/** Как CabinetModel._get_model в рефе: выбор варианта по min/max и размеру узла (мм). */
function __pickCabinetModelVariant(spec, sizeMm) {
  const models = spec?.models;
  if (!Array.isArray(models) || !models.length) return null;
  const hx = Number(sizeMm?.x) || 0;
  const hy = Number(sizeMm?.y) || 0;
  const hz = Number(sizeMm?.z) || 0;
  const okLo = (m, v) => !Number.isFinite(m) || m === 0 || m <= -1e8 || v >= m;
  const okHi = (m, v) => !Number.isFinite(m) || m === 0 || m >= 1e8 || v <= m;
  for (const j of models) {
    if (!j || typeof j !== 'object') continue;
    const minx = Number(j.min_x);
    const maxx = Number(j.max_x);
    const miny = Number(j.min_y);
    const maxy = Number(j.max_y);
    const minz = Number(j.min_z);
    const maxz = Number(j.max_z);
    if (okLo(minx, hx) && okHi(maxx, hx) && okLo(miny, hy) && okHi(maxy, hy) && okLo(minz, hz) && okHi(maxz, hz)) {
      return j;
    }
  }
  return models[0];
}

const __cabinetModelAssetRootPromises = new Map();

function __loadCabinetModelAssetRootOnce(url) {
  if (!url) return Promise.resolve(null);
  if (__cabinetModelAssetRootPromises.has(url)) return __cabinetModelAssetRootPromises.get(url);
  const lower = url.toLowerCase();
  let p;
  if (lower.endsWith('.fbx')) {
    p = new Promise((resolve) => {
      new FBXLoader().load(
        url,
        (obj) => resolve(obj),
        undefined,
        (err) => {
          console.warn('[CLD] cabinet_model FBX load error:', url, err);
          resolve(null);
        }
      );
    });
  } else {
    p = new Promise((resolve) => {
      new GLTFLoader().load(
        url,
        (gltf) => {
          try {
            if (gltf.scene) {
              gltf.scene.userData = gltf.scene.userData || {};
              gltf.scene.userData.__cldGltfAsset = gltf.asset || null;
            }
          } catch (_) {}
          resolve(gltf.scene);
        },
        undefined,
        (err) => {
          console.warn('[CLD] cabinet_model GLB load error:', url, err);
          resolve(null);
        }
      );
    });
  }
  __cabinetModelAssetRootPromises.set(url, p);
  return p;
}

/** Положительный bbox в мм из объекта `{x,y,z}` — иначе `null`. */
function __cldReadPositiveRefMm3(v) {
  if (!v || typeof v !== 'object') return null;
  const x = Number(v.x);
  const y = Number(v.y);
  const z = Number(v.z);
  if (Number.isFinite(x) && x > 0 && Number.isFinite(y) && y > 0 && Number.isFinite(z) && z > 0) {
    return { x, y, z };
  }
  return null;
}

/**
 * GLB петли: приводим единицы файла к сцене (UNITS_MM), затем либо вписываем в явный ref (мм),
 * либо только центрируем — как у cabinet_model без `preview_ref_mm`.
 *
 * Раньше всегда вписывали в жёсткий бокс 12×55×12 / 11×55×4 мм — из‑за этого масштаб в SketchUp
 * не менялся в превью, в отличие от направляющих.
 *
 * Опции в данных аксессуара (JSON):
 * - `hingePreviewFitStandard: true` — прежнее поведение (бокс корпусной/фасадной половины).
 * - `hingeDoorPreviewRefMm` / `hingeFacadePreviewRefMm` / `hingePreviewRefMm` / `ref_size_mm` — явный bbox мм.
 */
function __prepareHingeGltfClone(template, refSizeMm) {
  const g = template.clone(true);
  g.rotation.set(0, 0, 0);
  g.position.set(0, 0, 0);
  g.scale.set(1, 1, 1);
  g.updateMatrixWorld(true);
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  const assetMeta = template.userData && template.userData.__cldGltfAsset;
  const imp = __cldInferFileToSceneScaleFactor(g, {}, assetMeta);
  g.scale.setScalar(imp);
  g.updateMatrixWorld(true);
  const ref = __cldReadPositiveRefMm3(refSizeMm);
  if (ref) {
    __gltfRootMultiplyUniformScaleToRefMm(g, ref);
  } else {
    __gltfRootCenterOnlyKeepScale(g);
  }
  g.userData.isAccessory = true;
  g.userData.isFurniture = true;
  return g;
}

/**
 * Метки для CFRN/Bazis (bazis-cfrn-export.js isHingeExportMesh).
 * hingePart: 'facade' | 'door' — к какой половине относятся шаблоны hingeFacadeDrillTemplateId / hingeDoorDrillTemplateId.
 */
function __tagHingeMeshesForBazisExport(root, acc, openingIsLTR, hingePart) {
  if (!root || !acc) return;
  const sku = String(acc.sku || acc.article || acc.id || '').trim() || 'HINGE_DEFAULT';
  const nm = String(acc.name || 'Петля');
  const fTid = Number(acc.hingeFacadeDrillTemplateId);
  const dTid = Number(acc.hingeDoorDrillTemplateId);
  let drillTid = 0;
  if (hingePart === 'facade' && Number.isFinite(fTid) && fTid > 0) drillTid = fTid;
  if (hingePart === 'door' && Number.isFinite(dTid) && dTid > 0) drillTid = dTid;
  root.userData.isHingeBazisExport = true;
  root.userData.accessorySku = sku;
  root.userData.accessoryName = nm;
  if (typeof openingIsLTR === 'boolean') root.userData.hingeOpeningIsLTR = openingIsLTR;
  root.userData._drillTemplateLocalMmPerUnit = UNITS_MM;
  if (drillTid > 0) root.userData.cfrnDrillTemplateId = drillTid;
  root.traverse((o) => {
    if (o.isMesh) {
      o.userData.isHingeBazisExport = true;
      o.userData.accessorySku = sku;
      o.userData.accessoryName = nm;
      if (typeof openingIsLTR === 'boolean') o.userData.hingeOpeningIsLTR = openingIsLTR;
      o.userData._drillTemplateLocalMmPerUnit = UNITS_MM;
      if (drillTid > 0) o.userData.cfrnDrillTemplateId = drillTid;
    }
  });
}

function mmToU(mmValue) {
  return mmValue / UNITS_MM;
}
function uToMm(uValue) {
  return uValue * UNITS_MM;
}

// ===== Совместимость синтаксиса (clean-room подготовка) =====
// Сейчас код поддерживает референсный синтаксис Clodis (s:x, v:_wt, g:g0.thickness, m:default.size.z).
// Чтобы безопасно перейти на свой синтаксис, добавляем НОРМАЛИЗАЦИЮ:
// - новый синтаксис (@section.width, $wall.thickness, #material.group0.thickness, %material.default.size.z)
//   преобразуем в старый, не ломая существующий код.
function normalizeExpressionSyntax(exprStr) {
  let s = String(exprStr ?? '').trim();
  if (!s) return s;

  // $size.(x|y|z) -> s:(x|y|z)  (наш будущий "короткий" синтаксис)
  s = s.replace(/\$size\.x\b/g, 's:x');
  s = s.replace(/\$size\.y\b/g, 's:y');
  s = s.replace(/\$size\.z\b/g, 's:z');

  // @section.(width|height|depth) -> s:(x|y|z)
  s = s.replace(/@section\.width\b/g, 's:x');
  s = s.replace(/@section\.height\b/g, 's:y');
  s = s.replace(/@section\.depth\b/g, 's:z');
  // Частая опечатка в шаблонах: widt → width
  s = s.replace(/@section\.widt\b/gi, 's:x');

  // @root.(width|height|depth) -> s:r(x|y|z)
  s = s.replace(/@root\.width\b/g, 's:rx');
  s = s.replace(/@root\.height\b/g, 's:ry');
  s = s.replace(/@root\.depth\b/g, 's:rz');

  // $wall.thickness, $back.offset -> v:_wt, v:_bwo
  s = s.replace(/\$wall\.thickness\b/g, 'v:_wt');
  s = s.replace(/\$back\.offset\b/g, 'v:_bwo');
  // $front.offset -> v:_tfo (front offset, как в референсе v:_tfo)
  s = s.replace(/\$front\.offset\b/g, 'v:_tfo');

  // #material.group0.thickness -> g:g0.thickness
  // #material.group0.size.z   -> g:g0.size.z
  s = s.replace(/#material\.group(\d+)\.([A-Za-z0-9_.]+)\b/g, (_m, g, rest) => `g:g${g}.${rest}`);

  // %material.default.size.z -> m:default.size.z
  // %material.current.size.z -> m:current.size.z
  s = s.replace(/%material\.(default|current)\.([A-Za-z0-9_.]+)\b/g, (_m, k, rest) => `m:${k}.${rest}`);

  return s;
}

function normalizeOrientation(o) {
  if (!o) return 'f';
  const s = String(o).trim().toLowerCase();
  if (!s) return 'f';
  if (s === 'f' || s === 'frontal' || s === 'front' || s === 'face') return 'f';
  if (s === 'v' || s === 'vertical') return 'v';
  if (s === 'h' || s === 'horizontal') return 'h';
  return s; // fallback (если появятся новые значения)
}

// Совместимость структуры шаблона:
// - старое: config.spec.template.tree (Clodis)
// - новое: config.template.structure (Clodis)
function getTemplateChildrenFromConfig(config) {
  if (!config || typeof config !== 'object') return null;
  const modern = config.template?.structure;
  if (Array.isArray(modern)) return modern;
  const legacy = config.spec?.template?.tree;
  if (Array.isArray(legacy)) return legacy;
  return null;
}

function ensureTemplateStructureOnConfig(config) {
  if (!config || typeof config !== 'object') return null;
  config.template = config.template || {};
  if (!Array.isArray(config.template.structure)) config.template.structure = [];
  // Поддерживаем и legacy поле, чтобы старые части админки/логики не ломались
  config.spec = config.spec || {};
  config.spec.template = config.spec.template || {};
  if (!Array.isArray(config.spec.template.tree)) config.spec.template.tree = config.template.structure;
  return config.template.structure;
}

// ===== Система выражений для динамических значений =====
// ВРЕМЕННО: используем синтаксис как в референсе для совместимости
// Референс: s:x, v:_wt, g:g0.thickness, m:default.size.z
// Соответствие: см. REFERENCE_MAPPING.md
// TODO: позже можно изменить на свой синтаксис ($size.x, $var._wt и т.д.)
function tokenizeExpr(src) {
  const s = String(src ?? '').trim();
  if (!s) return [];
  // Референс синтаксис: s:, v:, g:, m: с точками (g:g0.thickness, m:default.size.z)
  // Референс: также поддерживается s.z, s.x, s.y (с точкой) как s:z, s:x, s:y
  const re = /\s*([()+\-*/]|(?:s|v|g|m):[A-Za-z0-9_.]+|s\.[xyz]|\d+(?:\.\d+)?)\s*/g;
  const out = [];
  let m;
  let idx = 0;
  while ((m = re.exec(s))) {
    out.push(m[1]);
    idx = re.lastIndex;
  }
  if (idx < s.length) return null; // unknown token
  return out;
}

// ЛОГИКА Clodis: функция для получения значения из вложенного объекта по пути (аналог utils.nested_object.get)
function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

// Референс: функция для получения значения переменной/выражения (аналог conv2num)
// ВРЕМЕННО: используем синтаксис референса (s:x, v:_wt) для совместимости
// 
// СООТВЕТСТВИЕ СИНТАКСИСОВ:
// Референс Clodis → Наш код
// s:x, s:y, s:z → ctx.sizes.x, ctx.sizes.y, ctx.sizes.z (размеры секции)
// v:_wt, v:_bwo → ctx.vars._wt, ctx.vars._bwo (переменные)
// g:g0.thickness → ctx.materials.g0 (материалы групп)
// m:default.size.z → ctx.materials.default.size.z (материалы)
function resolveVariableValue(exprStr, ctx) {
  if (!exprStr || typeof exprStr !== 'string') return 0;
  const s = exprStr.trim();
  if (!s) return 0;
  
  const firstChar = s[0];
  
  switch (firstChar) {
    case 's': // Референс: s:x, s:y, s:z, s:rx, s:ry, s:rz (размеры секции)
      // СООТВЕТСТВИЕ: s:x → ctx.sizes.x (размер секции по X)
      // СООТВЕТСТВИЕ: s:y → ctx.sizes.y (размер секции по Y)
      // СООТВЕТСТВИЕ: s:z → ctx.sizes.z (размер секции по Z)
      // Референс: также поддерживается s.z (с точкой) как s:z
      {
        const rest = s.substring(2);
        if (rest === 'x' || rest === 'y' || rest === 'z') {
          return Number(ctx?.sizes?.[rest] ?? 0);
        }
        // Референс: s:rx, s:ry, s:rz - размеры root секции
        // СООТВЕТСТВИЕ: s:rx → ctx.root_sizes.x (размер root секции по X)
        if (rest.startsWith('r') && (rest[1] === 'x' || rest[1] === 'y' || rest[1] === 'z')) {
          const axis = rest[1];
          return Number(ctx?.root_sizes?.[axis] ?? ctx?.sizes?.[axis] ?? 0);
        }
      }
      break;
      
    case 'v': // Референс: v:_wt, v:_bwo и т.д. (переменные)
      // СООТВЕТСТВИЕ: v:_wt → ctx.vars._wt (толщина стенки)
      // СООТВЕТСТВИЕ: v:_bwo → ctx.vars._bwo (отступ нижней стенки)
      // СООТВЕТСТВИЕ: v:_tfo → ctx.vars._tfo (отступ верхнего фронта)
      {
        const varName = s.substring(2);
        const varValue = ctx?.vars?.[varName];
        if (varValue != null) {
          // Если переменная - объект с value, берём value
          if (typeof varValue === 'object' && 'value' in varValue) {
            return Number(varValue.value ?? 0);
          }
          return Number(varValue ?? 0);
        }
      }
      break;
      
    case 'g': // Референс: g:g0.thickness, g:g0.size.z (материалы групп)
      // СООТВЕТСТВИЕ: g:g0.thickness → ctx.materials.g0 (толщина материала группы g0)
      // СООТВЕТСТВИЕ: g:g0.size.z → ctx.materials.g0.size.z (размер материала группы g0)
      {
        // Формат: g:g0.thickness или g:g0.size.z
        const rest = s.substring(2); // "g0.thickness" или "g0.size.z"
        const parts = rest.split('.');
        if (parts.length >= 2) {
          const groupKey = parts[0]; // "g0"
          const propertyPath = parts.slice(1).join('.'); // "thickness" или "size.z"
          
          const materialGroup = ctx?.materials?.[groupKey];
          if (!materialGroup) return 0;
          
          // Референс: для thickness получаем из material.variant_id
          if (propertyPath === 'thickness') {
            // Clean-room: если у группы есть явная thickness — используем её,
            // иначе падаем на vars._wt (глобальная толщина стенок).
            if (materialGroup && materialGroup.thickness != null) {
              return Number(materialGroup.thickness ?? 0);
            }
            return Number(ctx?.vars?._wt ?? 16);
          }
          
          // Для других свойств используем getNestedValue
          return Number(getNestedValue(materialGroup, propertyPath) ?? 0);
        }
      }
      break;
      
    case 'm': // Референс: m:default.size.z, m:current.size.z (материалы)
      // СООТВЕТСТВИЕ: m:default.size.z → ctx.materials.default.size.z (размер материала по умолчанию)
      // СООТВЕТСТВИЕ: m:current.size.z → ctx.materials.default.variants[default].size.z (размер текущего варианта)
      {
        // Формат: m:default.size.z или m:current.size.z
        const rest = s.substring(2);
        if (rest.includes('current')) {
          // Референс: m:default.current.size.z -> ищем в materials['default']::0.size.z
          const parts = rest.split('.current.');
          if (parts.length === 2) {
            const materialKey = parts[0]; // "default"
            const propertyPath = parts[1]; // "size.z"
            const material = ctx?.materials?.[materialKey];
            if (material && material.variants && material.default !== undefined) {
              const variant = material.variants[material.default];
              return Number(getNestedValue(variant, propertyPath) ?? 0);
            }
          }
        } else {
          // m:default.size.z
          const parts = rest.split('.');
          if (parts.length >= 2) {
            const materialKey = parts[0];
            const propertyPath = parts.slice(1).join('.');
            const material = ctx?.materials?.[materialKey];
            return Number(getNestedValue(material, propertyPath) ?? 0);
          }
        }
      }
      break;
  }
  
  // Если не распознано, пытаемся распарсить как число
  const num = parseFloat(s);
  return Number.isFinite(num) ? num : 0;
}

function evalExpr(expr, ctx) {
  if (typeof expr === 'number') return expr;
  if (expr == null) return 0;
  let s = String(expr).trim();
  if (!s) return 0;

  // Strip Clodis-style prefixes: "size.x = s:x - 3" → "s:x - 3", "pos.y = 25" → "25"
  s = s.replace(/^(?:size|pos|pivot|rot)\.[xyz]\s*=\s*/i, '');

  // Совместимость: приводим новый синтаксис к референсному ДО парсинга/токенизации
  s = normalizeExpressionSyntax(s);
  
  // Референс: поддерживаем s.z, s.x, s.y (с точкой) как s:z, s:x, s:y
  // СООТВЕТСТВИЕ: s.z → s:z, s.x → s:x, s.y → s:y
  s = s.replace(/^s\.([xyz])$/, 's:$1');
  
  // fast path: single token (число или простая переменная)
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
  
  // Проверяем простые выражения без операторов (референс синтаксис: s:, v:, g:, m:)
  const simpleMatch = /^(s|v|g|m):[A-Za-z0-9_.]+$/.test(s);
  if (simpleMatch) {
    return resolveVariableValue(s, ctx);
  }

  const tokens = tokenizeExpr(s);
  if (!tokens) return 0;

  // shunting-yard to RPN (стандартный алгоритм)
  const prec = { '+': 1, '-': 1, '*': 2, '/': 2 };
  const out = [];
  const op = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    // Референс синтаксис: s:x, v:_wt, g:g0.thickness, также s.z, s.x, s.y (с точкой)
    if (/^\d+(\.\d+)?$/.test(t) || /^(s|v|g|m):[A-Za-z0-9_.]+$/.test(t) || /^s\.[xyz]$/.test(t)) {
      out.push(t);
      continue;
    }
    if (t === '(') {
      op.push(t);
      continue;
    }
    if (t === ')') {
      while (op.length && op[op.length - 1] !== '(') out.push(op.pop());
      if (op.length && op[op.length - 1] === '(') op.pop();
      continue;
    }
    if (t in prec) {
      // unary minus: transform "-X" to "0 X -"
      const prev = tokens[i - 1];
      const isUnary = i === 0 || prev === '(' || prev in prec;
      if (t === '-' && isUnary) out.push('0');
      while (op.length && op[op.length - 1] in prec && prec[op[op.length - 1]] >= prec[t]) out.push(op.pop());
      op.push(t);
      continue;
    }
    return 0;
  }
  while (op.length) out.push(op.pop());

  // eval RPN
  const st = [];
  for (const t of out) {
    if (/^\d+(\.\d+)?$/.test(t)) {
      st.push(Number(t));
      continue;
    }
    // Референс синтаксис: s:x, v:_wt, g:g0.thickness, также s.z, s.x, s.y (с точкой)
    if (/^(s|v|g|m):[A-Za-z0-9_.]+$/.test(t) || /^s\.[xyz]$/.test(t)) {
      // Референс: s.z → s:z, s.x → s:x, s.y → s:y
      const normalized = t.replace(/^s\.([xyz])$/, 's:$1');
      st.push(resolveVariableValue(normalized, ctx));
      continue;
    }
    if (t in prec) {
      const b = st.pop();
      const a = st.pop();
      const av = Number.isFinite(a) ? a : 0;
      const bv = Number.isFinite(b) ? b : 0;
      switch (t) {
        case '+':
          st.push(av + bv);
          break;
        case '-':
          st.push(av - bv);
          break;
        case '*':
          st.push(av * bv);
          break;
        case '/':
          st.push(bv === 0 ? 0 : av / bv);
          break;
      }
    }
  }
  const res = st.pop();
  return Number.isFinite(res) ? res : 0;
}

const defParams = {
  module: {
    type: 'module',
    name: 'Module',
    helpers_visible: 0, // Референс: корневая секция — helpers скрыты
    size: { x: 300, y: 400, z: 200 },
    pos: { x: 0, y: 0, z: 0 },
    rot: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    pivot: { x: 0, y: 0, z: 0 },
    // Новый контейнер дерева (clean-room): template.structure
    // Совместимость поддерживаем через getTemplateChildrenFromConfig()/ensureTemplateStructureOnConfig().
    template: { structure: [] },
    spec: { template: { tree: [] } },
    children: [],
  },
  section: {
    type: 'section',
    name: 'Section',
    helpers_visible: 1, // Референс: секция — helpers видны при выборе
    active: 1,
    visible: 1,
    size: { x: '$size.x', y: '$size.y', z: '$size.z' },
    pos: { x: 0, y: 0, z: 0 },
    rot: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    // РЕФЕРЕНС: pivot секции (-1,-1,-1) = нижний левый задний угол, как в constructor.ts:1140-1142
    pivot: { x: -1, y: -1, z: -1 },
    spec: {},
    children: [],
  },
  // : def_cabinet_fill_section .
  // Наполняемая секция — контейнер-слот в шаблоне модуля: дети «впрыскиваются»
  // через spec.fill_content[section_key].children при load_templates.
  // Семантика 1:1 с CabinetFillSection: type='fill_section', spec { show_sizes:0, replace:0,
  // step_axes:{x,y,z=1}, invert:{0,0,0} }, fill:{}.
  fill_section: {
    type: 'fill_section',
    name: 'Fill Section',
    helpers_visible: 1,
    active: 1,
    visible: 1,
    size: { x: '$size.x', y: '$size.y', z: '$size.z' },
    pos: { x: 0, y: 0, z: 0 },
    rot: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    pivot: { x: -1, y: -1, z: -1 },
    spec: {
      show_sizes: 0,
      replace: 0,
      step_axes: { x: 1, y: 1, z: 1 },
      invert: { x: 0, y: 0, z: 0 },
    },
    fill: {},
    children: [],
  },
  facade: {
    type: 'facade',
    name: 'Фасад',
    helpers_visible: 1, // показывать маркер pivot (оси) при выборе
    active: 1,
    visible: 1,
    size: { x: '@section.width', y: '@section.height', z: 16 },
    // Референс: default pos (0,0,0), для direction '-z' ставит фасад на грань +Z секции = задняя грань (прижимается к задней)
    pos: { x: 0, y: 0, z: 0 },
    pivot: { x: -1, y: -1, z: -1 },
    rot: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    spec: { orientation: 'f', direction: '-z' },
    children: [],
  },
  wall: {
    type: 'wall',
    name: 'Wall',
    helpers_visible: 1, // Референс: деталь — helpers видны при выборе
    active: 1,
    visible: 1,
    // Совместимость: можно задавать и референсные s:/v:, и наш новый синтаксис.
    // normalizeExpressionSyntax() приведёт новый синтаксис к референсному.
    size: { x: '@section.width', y: '@section.height', z: '$wall.thickness' },
    pos: { x: 0, y: 0, z: 0 },
    rot: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    // РЕФЕРЕНС: pivot у wall по умолчанию (-1,-1,-1), но в шаблонах часто переопределяется
    // (например, верхняя полка: y=1, передняя панель: z=1, правая стенка: x=1).
    pivot: { x: -1, y: -1, z: -1 },
    spec: { side: 'back' }, // back/front/left/right
    children: [],
  },
  path: {
    type: 'path',
    name: 'Паз',
    helpers_visible: 1,
    active: 1,
    visible: 1,
    // Реф def_cabinet_path: x=глубина, y=ширина; orientation v, direction z
    size: { x: 10, y: 10, z: 0 },
    pos: { x: 0, y: 10, z: 0 },
    rot: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    pivot: { x: -1, y: -1, z: -1 },
    spec: {
      orientation: 'v',
      direction: 'z',
      type: 'common',
      type_params: {},
      dz: 0,
      dz_2: 0,
    },
    children: [],
  },
  fill_module: {
    type: 'module',
    name: 'Fill Module',
    helpers_visible: 1, // Референс: модули дверей должны показывать pivot при выделении (как фасады)
    active: 1,
    visible: 1,
    // Референс: модули (двери, полки) обычно имеют конкретные размеры из JSON
    // Если size.z не задан, используем дефолтную толщину (16мм как у фасада)
    size: { x: '@section.width', y: '@section.height', z: 16 },
    pos: { x: 0, y: 0, z: 0 },
    rot: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    pivot: { x: -1, y: -1, z: -1 },
    spec: {},
    children: [],
  },
  // Реф: class Module extends CabinetSection — каталожный module остаётся type:'module',
  // template_tree → children, подсветка через CabinetSection._build_helpers при выборе.
  catalog_module: {
    type: 'module',
    name: 'Catalog Module',
    helpers_visible: 1,
    active: 1,
    visible: 1,
    size: { x: 's:x', y: 's:y', z: 's:z' },
    pos: { x: 0, y: 0, z: 0 },
    rot: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    pivot: { x: -1, y: -1, z: -1 },
    spec: {},
    children: [],
  },
  // Clodis: узел type model — 3D из каталога cabinet_model (spec.id → models[].model)
  // У дочернего model внутри animator: spec.swingAttach 'fixed'|'cabinet' — половина на корпус (не вращается с дверью).
  // : — def_cabinet_model: size 100³, не s:x (свой габарит, не родитель).
  model: {
    type: 'model',
    name: 'Model',
    helpers_visible: 1,
    active: 1,
    visible: 1,
    size: { x: 100, y: 100, z: 100 },
    pos: { x: 0, y: 0, z: 0 },
    rot: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    pivot: { x: -1, y: -1, z: -1 },
    spec: { id: '', key: '', swingAttach: '' },
    children: [],
  },
  // Clodis: hole — отверстие/присадка (CabinetHole в референсе)
  hole: {
    type: 'hole',
    name: 'Hole',
    helpers_visible: 0,
    active: 1,
    visible: 1,
    size: { x: 35, y: 35, z: 12 },
    pos: { x: 0, y: 0, z: 0 },
    rot: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    pivot: { x: -1, y: -1, z: -1 },
    spec: { direction: '-z', global: 1, key: '' },
    children: [],
  },
  // Clodis: furniture — контейнер фурнитуры (CabinetFurniture в референсе), дети hole загружаются из каталога по spec.id
  furniture: {
    type: 'furniture',
    name: 'Furniture',
    helpers_visible: 0,
    active: 1,
    visible: 1,
    size: { x: 12, y: 12, z: 8 },
    pos: { x: 0, y: 0, z: 0 },
    rot: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    pivot: { x: -1, y: -1, z: -1 },
    spec: { id: '', swingAttach: '' },
    children: [],
  },
  // Clodis: animator — def_cabinet_animator: размеры по умолчанию не s:* секции, а явные мм;
  // spec.fn по умолчанию slide; для двери с кликом в iframe задайте spec.fn rotate (+ props.deg / direction).
  animator: {
    type: 'animator',
    name: 'Animator',
    helpers_visible: 1, // как секция: зелёный объём при выборе в дереве
    active: 1,
    visible: 1,
    size: { x: 600, y: 360, z: 530 },
    pos: { x: 0, y: 0, z: 0 },
    rot: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    pivot: { x: -1, y: -1, z: -1 },
    spec: {
      fn: 'slide',
      is_open: 0,
      group: '',
      props: { deg: 0, ext_percent: 70, direction: 'f' },
      source: { id: '', fixed: [] },
    },
    children: [],
  },
};

function deepMerge(a, b) {
  const out = Array.isArray(a) ? [...a] : { ...(a || {}) };
  if (!b) return out;
  for (const k of Object.keys(b)) {
    const bv = b[k];
    const av = out[k];
    if (bv && typeof bv === 'object' && !Array.isArray(bv) && av && typeof av === 'object' && !Array.isArray(av)) {
      out[k] = deepMerge(av, bv);
    } else {
      out[k] = bv;
    }
  }
  return out;
}

/**
 * Shell модуля пирога уже сдвинут (pos.y соседей). Внутри catalog_27/30 не дублировать v:h_bottom.
 */
/**
 * Распашной аниматор двери: rotate + дочерний type:facade.
 * id «hinge_animator» у двери в админке не отменяет — отличаем по детям, не по id.
 */
function __cldIsDoorRotateAnimatorConfig(n) {
  if (!n || typeof n !== 'object') return false;
  if (String(n.type || '').trim().toLowerCase() !== 'animator') return false;
  if (String(n.spec?.fn || '').toLowerCase() !== 'rotate') return false;
  const ch = n.children;
  return Array.isArray(ch) && ch.some((c) => String(c?.type || '').toLowerCase() === 'facade');
}

/**
 * Накладной шов как в «Петли по ролям»: animator на тыле тонкой оболочки (z=0), дверь закрыта.
 * НЕ реф-inset `s:z + t/2` — в оболочке 16 мм он уводит ось/полотно и ломает клик-анимацию в шкафу.
 */
function __cldApplyOverlayFacadeDoorSeamLikeRoles(nodes) {
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    if (__cldIsDoorRotateAnimatorConfig(n)) {
      n.spec = n.spec && typeof n.spec === 'object' ? { ...n.spec } : {};
      n.spec.is_open = 0;
      n.pos = n.pos && typeof n.pos === 'object' ? { ...n.pos, z: 0 } : { x: 0, y: 0, z: 0 };
      if (n.spec.door_offset && typeof n.spec.door_offset === 'object') {
        n.spec = {
          ...n.spec,
          door_offset: { ...n.spec.door_offset, z: 0 },
        };
      }
      if (n.interaction && typeof n.interaction === 'object') {
        n.interaction = { ...n.interaction, auto_rotation: 0 };
      }
      n.size = n.size && typeof n.size === 'object' ? { ...n.size } : {};
      if (n.size.z == null || n.size.z === '' || n.size.z === 's:z') {
        n.size.z = 'v:facade_thickness_mm';
      }
      for (const ch of n.children || []) {
        if (!ch || String(ch.type || '').toLowerCase() !== 'facade') continue;
        ch.pos = ch.pos && typeof ch.pos === 'object' ? { ...ch.pos } : { x: 0, y: 0, z: 0 };
        // Тыл полотна у шва (z=0 оболочки); не −t/2 от inset-рефа.
        if (
          ch.pos.z === 's:z' ||
          (typeof ch.pos.z === 'string' && /s\s*:\s*z/i.test(ch.pos.z)) ||
          ch.pos.z == null
        ) {
          ch.pos.z = 0;
        }
        if (ch.size && typeof ch.size === 'object') {
          ch.size = { ...ch.size, z: ch.size.z ?? 'v:facade_thickness_mm' };
        }
      }
    }
    if (Array.isArray(n.children)) n.children.forEach(walk);
    if (Array.isArray(n.spec?.template_tree)) n.spec.template_tree.forEach(walk);
  };
  if (Array.isArray(nodes)) nodes.forEach(walk);
  else walk(nodes);
}

/**
 * @deprecated inset-реф для тонкой оболочки ломал шкаф vs роли. Оставлен как alias на overlay.
 */
function __cldApplyRefFacadeDoorMountInThinShell(nodes) {
  __cldApplyOverlayFacadeDoorSeamLikeRoles(nodes);
}

function __cldFixFacadeInnerPanelPosZ(nodes) {
  const isPreviewPosZ = (pz) => {
    if (pz === 's:z') return true;
    if (typeof pz === 'string') {
      const s = String(pz).trim();
      if (/^\s*s\s*:\s*z\s*$/i.test(s)) return true;
      if (/s\s*:\s*z\s*-\s*v\s*:\s*facade_thickness/i.test(s)) return true;
    }
    return false;
  };
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    const t = String(n.type || '').trim().toLowerCase();
    if (t === 'facade' || t === 'facades') {
      if (n.pos && typeof n.pos === 'object' && isPreviewPosZ(n.pos.z)) {
        n.pos = { ...n.pos, z: 0 };
      }
    }
    if (t === 'animator') {
      const isHingeAnim =
        String(n.id || '').trim().toLowerCase() === 'hinge_animator' &&
        !__cldIsDoorRotateAnimatorConfig(n);
      const isDoorRotate = __cldIsDoorRotateAnimatorConfig(n);
      if (isHingeAnim || isDoorRotate) {
        if (n.pos && typeof n.pos === 'object' && isPreviewPosZ(n.pos.z)) {
          n.pos = { ...n.pos, z: 0 };
        }
        if (n.spec && typeof n.spec === 'object' && n.spec.door_offset) {
          n.spec = { ...n.spec, door_offset: { ...n.spec.door_offset, z: 0 } };
        }
      }
    }
    if (t === 'module') {
      const et = String(n.spec?.element_type || '').toLowerCase();
      if (et === 'hinges' && n.pos && typeof n.pos === 'object') {
        const pz = n.pos.z;
        if (typeof pz === 'number' && pz !== 0) {
          n.pos = { ...n.pos, z: 0 };
        }
      }
    }
    if (Array.isArray(n.children)) n.children.forEach(walk);
  };
  if (Array.isArray(nodes)) nodes.forEach(walk);
  else walk(nodes);
}

function __cldNormalizeCatalogTemplateForPyramidShell(childrenClone, outerRole) {
  if (!Array.isArray(childrenClone) || !outerRole) return;
  const role = String(outerRole).trim().toLowerCase();
  if (role === 'facades' || role === 'facades_main' || role === 'facades_top') {
    // Как «Петли по ролям»: шов z=0 на тонкой оболочке (не inset s:z+t/2).
    __cldApplyOverlayFacadeDoorSeamLikeRoles(childrenClone);
    __cldFixFacadeInnerPanelPosZ(childrenClone);
    // Внутренняя секция catalog_28 с size.z = s:z (глубина шкафа) даёт отлёт петель по Z/X ~600 мм.
    for (const node of childrenClone) {
      if (!node || typeof node !== 'object') continue;
      const t = String(node.type || '').toLowerCase();
      if (t !== 'section' && t !== 'fill_section') continue;
      node.size = node.size && typeof node.size === 'object' ? { ...node.size } : {};
      const sz = node.size.z;
      const isFullDepthZ =
        sz === undefined ||
        sz === null ||
        sz === 's:z' ||
        (typeof sz === 'string' && /^\s*s\s*:\s*z\s*$/i.test(String(sz).trim()));
      if (isFullDepthZ) node.size.z = 'v:facade_thickness_mm';
      break;
    }
    return;
  }
  if (!['plinth', 'corpus_antresol', 'top'].includes(role)) return;

  const isPyramidOffsetExpr = (v) => {
    if (v === undefined || v === null) return false;
    const s = String(v).trim();
    if (!s || s === '0') return false;
    return /v:\s*h_bottom|v:\s*corpus_antresol|corpus_antresol_mm|v:\s*h_top|v:\s*tech_zone/i.test(s)
      || /h_bottom\s*\+|corpus_antresol/i.test(s);
  };

  for (const node of childrenClone) {
    if (!node || typeof node !== 'object') continue;
    const t = String(node.type || '').toLowerCase();
    if (t !== 'section' && t !== 'fill_section') continue;

    node.pos = node.pos && typeof node.pos === 'object' ? { ...node.pos } : { x: 0, y: 0, z: 0 };
    node.size = node.size && typeof node.size === 'object' ? { ...node.size } : {};

    if (isPyramidOffsetExpr(node.pos.y)) node.pos.y = 0;

    if (role === 'top') {
      node.pos.y = 0;
      if (isPyramidOffsetExpr(node.size.y)) node.size.y = 's:y';
    } else if (role === 'corpus_antresol') {
      node.pos.y = 0;
      if (isPyramidOffsetExpr(node.size.y)) node.size.y = 's:y';
    } else if (role === 'plinth') {
      node.pos.y = 0;
    }
    break;
  }
  if (role === 'plinth') __cldFixPlinthLegDepthExprs(childrenClone);
}

/**
 * catalog_32: только починка битых legacy-шаблонов (396, s:x в pos.z).
 * Не трогаем pos/pivot из редактора — иначе в шкафу затираются z=20, 0+s:z-10 и т.п.
 */
function __cldFixPlinthLegDepthExprs(rootNode) {
  const models = [];
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    if (String(n.type || '').toLowerCase() === 'model') models.push(n);
    if (Array.isArray(n.children)) n.children.forEach(walk);
  };
  if (Array.isArray(rootNode)) rootNode.forEach(walk);
  else walk(rootNode);

  for (const m of models) {
    m.pos = m.pos && typeof m.pos === 'object' ? { ...m.pos } : {};
    const px = m.pos.x;
    const pz = m.pos.z;

    if (pz === 396 || String(pz).trim() === '396') {
      m.pos.z = '0+s:z-20';
      continue;
    }

    if (typeof pz === 'string' && /\bs\.?x\b/i.test(String(pz)) && !/\bs\.?z\b/i.test(String(pz))) {
      m.pos.z = String(pz).replace(/\bs\.x\b/gi, 's:z').replace(/\bs:x\b/gi, 's:z');
    }
    // pos.x не трогаем: левые 0, правые 0+s:x-20 задаёт пользователь в catalog_32.
  }
}

class CabinetNode extends THREE.Group {
  constructor(params = {}, parentParams = { root: null, parent: null, path: '0', local_parent: null }) {
    super();
    this.userData.parent_params = parentParams;
    this.userData.add_params = {};
    this.userData.after_rebuild_callbacks = [];
    this._build_struct();
    this._main(params);
  }

  // Совместимость структуры данных: новый доступ через this.config / this.calculated,
  // при этом старые this.userData.params / this.userData.computed продолжают работать.
  get config() {
    return this.userData.params;
  }
  set config(v) {
    this.userData.params = v;
  }
  get calculated() {
    return this.userData.computed;
  }
  set calculated(v) {
    this.userData.computed = v;
  }

  // Совместимость имён методов: новые имена вызывают старые, чтобы ничего не ломать.
  buildStructure() { return this._build_struct(); }
  buildParams(params) { return this._build_params(params); }
  buildComputed() { return this._build_computed(); }
  buildContext() { return this._build_comp_obj(); }
  calculateDimensions() { return this._build_size(); }
  computePosition() { return this._build_pos(); }
  calculatePivot() { return this._build_pivot(); }
  buildGeometry() { return this._build_spec(); }
  buildChildren() { return this._build_children(); }

  _resolveEventHandler(eventName) {
    if (!eventName || typeof eventName !== 'string') return null;
    try {
      const w = (typeof window !== 'undefined') ? window : null;
      if (!w) return null;
      const fromParts = w.pp?.events?.parts?.[eventName];
      if (typeof fromParts === 'function') return fromParts;
      const fromCabinet = w.pp?.events?.cabinet?.[eventName];
      if (typeof fromCabinet === 'function') return fromCabinet;
      const fromCabinetEvents = w.cabinet_events?.[eventName];
      if (typeof fromCabinetEvents === 'function') return fromCabinetEvents;
      const fromGlobal = w[eventName];
      if (typeof fromGlobal === 'function') return fromGlobal;
    } catch (_) {}
    return null;
  }

  _invokeNodeEvent(eventKey, explicitEventName = '', payload = {}) {
    const eventName = explicitEventName || this.config?.events?.[eventKey];
    if (!eventName || typeof eventName !== 'string') return;
    const fn = this._resolveEventHandler(eventName);
    if (typeof fn !== 'function') return;
    try {
      fn({
        ...payload,
        eventKey,
        eventName,
        node: this,
        params: this.config || {},
      });
    } catch (err) {
      console.warn(`[CLD][events] "${eventKey}" failed for "${this.config?.name || this.config?.type || 'node'}":`, err);
    }
  }

  _build_struct() {
    this.userData.struct = {};
    this.userData.own_object = new THREE.Group();
    this.userData.own_object.name = '__own_object';
    this.userData.struct[this.userData.own_object.name] = this.userData.own_object;
    this.userData.children = this.userData.own_object.children;
    this.add(this.userData.own_object);
    // Референс: группа helpers (кромки, оси) — видимость через helpers_visible
    // Группа __helpers создаётся пустой; контент (зелёный куб + рёбра) добавляет _build_helpers.
    this.userData.helpers = new THREE.Group();
    this.userData.helpers.name = '__helpers';
    this.userData.helpers.visible = false;
    this.add(this.userData.helpers);
  }

  _hide_helpers() {
    if (this.userData.helpers) this.userData.helpers.visible = false;
  }

  _show_helpers() {
    if (this.userData.helpers) this.userData.helpers.visible = true;
  }

  _make_root() {
    this.userData.is_root = true;
    this.userData.root = this;
    this.userData.path = '0';
    this.userData.parts_by_path = {};
    this.userData.params_hash = {};
    for (const k of Object.keys(item_types)) {
      this.userData.parts_by_path[k] = {};
      this.userData.params_hash[k] = [];
    }
  }

  _main(params) {
    this._before_params(params);
    this._build_params(params);
    this._build_computed();
    this._build_comp_obj();
    this._before_build();
    this._build();
    this._after_build();
  }

  _before_params(params) {
    this.userData.class = this.constructor.name;
    this.temp_type = this.constructor.name;
    if (!params.type) params.type = 'section';
    this._invokeNodeEvent('on_before_params', params?.events?.on_before_params, { params });
  }

  _build_params(params) {
    const type = params.type;
    // Референс: для модулей внутри секции дефолты уже применены в _build_children из fill_module
    // Если params уже содержит size.z как конкретное значение (не выражение типа '@section.depth'),
    // значит это fill_module и дефолты уже применены - не применяем их повторно
    let merged;
    if (type === 'module' && params.size && params.size.z) {
      const sizeZ = params.size.z;
      // Если size.z это число или строка-число (не выражение), значит это fill_module с уже примененными дефолтами
      const isNumeric = typeof sizeZ === 'number' || (typeof sizeZ === 'string' && /^\d+(\.\d+)?$/.test(String(sizeZ).trim()));
      if (isNumeric) {
        // Дефолты уже применены в _build_children, используем params как есть
        // Только добавляем недостающие поля из fill_module дефолтов (но значения из params имеют приоритет)
        merged = deepMerge(defParams['fill_module'] || {}, params);
      } else {
        // Это root module или модуль с выражениями - применяем module дефолты
        merged = deepMerge(defParams[type] || {}, params);
      }
    } else {
      merged = deepMerge(defParams[type] || {}, params);
    }
    this.name = merged.name || type;

    // active из админки/JSON может прийти как "0"/"1" (строка) — для if (config.active) строка "0" считается включённой.
    if (Object.prototype.hasOwnProperty.call(merged, 'active')) {
      const a = merged.active;
      const inactive =
        a === false ||
        a === 0 ||
        a === '0' ||
        (typeof a === 'string' && a.trim().toLowerCase() === 'false');
      merged.active = inactive ? 0 : 1;
    }
    
    // ⭐ ВАЖНО: edges должны передаваться явно, так как deepMerge может не правильно обработать вложенные объекты
    if (params.edges && type === 'wall') {
      merged.edges = params.edges;
    }
    // material_icon — явно сохраняем из params (выбор материала в админке)
    if (type === 'wall') {
      if (params.material_icon || params.materialIcon) {
        merged.material_icon = params.material_icon || params.materialIcon;
        merged.materialIcon = merged.material_icon;
      }
    }

    this.config = merged;
    const pp = this.userData.parent_params || {};
    if (pp.root) {
      this.userData.root = pp.root;
      this.userData.path = pp.path;
      this.userData.parent = pp.parent;
      this.userData.local_parent = pp.local_parent;
    } else {
      this._make_root();
      this.userData.parent = this;
      this.userData.local_parent = null;
    }
  }

  _build_computed() {
    this.calculated = {
      size: new THREE.Vector3(),
      pos: new THREE.Vector3(),
      rot: new THREE.Vector3(),
      scale: new THREE.Vector3(1, 1, 1),
      u_size: new THREE.Vector3(),
    };
  }

  _build_comp_obj() {
    const p = this.config || {};
    const isRoot = !!this.userData.is_root;
    
    // ЛОГИКА Clodis: если root_size уже установлен в _build_computed (для ModuleRootNode) - используем его
    if (this.calculated.c_object?.root_size) {
      // root_size уже установлен, обновляем только parent_size, vars и materials
      const parentSizeMm = isRoot
        ? this.calculated.size.clone()
        : this.userData.parent?.userData?.computed?.size || new THREE.Vector3();
      const vars = (this.userData.root && this.userData.root.userData && this.userData.root.userData.vars) || {};
      const materials = this.userData.root?.userData?.computed?.materials || {};
      this.calculated.c_object.parent_size = parentSizeMm;
      this.calculated.c_object.vars = vars;
      this.calculated.c_object.materials = materials;
      return;
    }
    
    // ЛОГИКА Clodis: для не-root элементов берём root_size из root.computed.size
    const parentSizeMm = isRoot
      ? new THREE.Vector3(Number(p.size?.x ?? 0), Number(p.size?.y ?? 0), Number(p.size?.z ?? 0))
      : this.userData.parent?.userData?.computed?.size || new THREE.Vector3();
    const rootSizeMm = this.userData.root?.userData?.computed?.size || parentSizeMm;
    const vars = (this.userData.root && this.userData.root.userData && this.userData.root.userData.vars) || {};
    // ЛОГИКА Clodis: materials хранятся в root.computed.materials
    const materials = this.userData.root?.userData?.computed?.materials || {};
    this.calculated.c_object = {
      parent_size: parentSizeMm,
      root_size: rootSizeMm,
      vars,
      materials,
    };
  }

  _resetOwn() {
    this.userData._ownRebuildEpoch = (this.userData._ownRebuildEpoch || 0) + 1;
    const h = this.userData.own_object;
    if (!h) return;
    // Референс: перед сборкой сбрасываем трансформы own_object
    h.position.set(0, 0, 0);
    h.rotation.set(0, 0, 0);
    h.scale.set(1, 1, 1);
    // remove children + dispose
    for (let i = h.children.length - 1; i >= 0; i--) {
      const ch = h.children[i];
      h.remove(ch);
      disposeObject(ch);
    }
  }

  _resetSelf() {
    // Для не-root элементов референс позиционирует this.position; сбрасываем на всякий случай
    this.position.set(0, 0, 0);
    this.rotation.set(0, 0, 0);
    this.scale.set(1, 1, 1);
  }

  _sizeExprOrDefault(axis) {
    const p = this.config || {};
    const raw = p.size?.[axis];
    if (raw === undefined || raw === null || (typeof raw === 'string' && String(raw).trim() === '')) {
      const def = defParams[p.type]?.size?.[axis];
      if (def !== undefined && def !== null && String(def).trim() !== '') return def;
      return `s:${axis}`;
    }
    return raw;
  }

  _build_size() {
    const p = this.config;
    const c = this.calculated.c_object;
    
    // Вложенные секции/детали должны считать s:x/s:y/s:z от текущей секции (parent_size),
    // иначе при многоуровневом дереве размеры "разъезжаются".
    const sectionSize = c.parent_size || c.root_size || new THREE.Vector3();
    
    const ctx = {
      sizes: {
        x: sectionSize.x || 0,
        y: sectionSize.y || 0,
        z: sectionSize.z || 0,
      },
      vars: c.vars || {},
    };
    const sx = evalExpr(this._sizeExprOrDefault('x'), ctx);
    const sy = evalExpr(this._sizeExprOrDefault('y'), ctx);
    const sz = evalExpr(this._sizeExprOrDefault('z'), ctx);
    this.calculated.size.set(sx, sy, sz);
    this.calculated.u_size.set(mmToU(sx), mmToU(sy), mmToU(sz));
    if (__cldIsHingeModuleLayoutDebugEnabled() && __cldIsCatalogModuleShellLike(p)) {
      __cldLogHingeModuleLayout('_build_size: shell вычислен', {
        name: p.name,
        path: this.userData?.path || '',
        sizeExpr: p.size,
        evalSizeMm: { x: sx, y: sy, z: sz },
        parentSizeMm: {
          x: Number(sectionSize.x) || 0,
          y: Number(sectionSize.y) || 0,
          z: Number(sectionSize.z) || 0,
        },
      });
    }
  }

  _build_pos() {
    const p = this.config;
    const c = this.calculated.c_object;
    const parentSize = c.parent_size || new THREE.Vector3();
    const sectionSize = c.parent_size || c.root_size || new THREE.Vector3();
    const ctx = {
      sizes: { x: sectionSize.x, y: sectionSize.y, z: sectionSize.z },
      vars: c.vars || {},
    };
    const px = evalExpr(p.pos?.x ?? 0, ctx);
    const py = evalExpr(p.pos?.y ?? 0, ctx);
    const pz = evalExpr(p.pos?.z ?? 0, ctx);
    this.calculated.pos.set(px, py, pz);

    // как в референсе: (-parent_size/2 + pos)/units
    const ux = (-parentSize.x / 2 + px) / UNITS_MM;
    const uy = (-parentSize.y / 2 + py) / UNITS_MM;
    const uz = (-parentSize.z / 2 + pz) / UNITS_MM;

    // Референс: логи убраны после отладки

    if (this.userData.is_root) {
      this.userData.own_object.position.set(ux, py / UNITS_MM, uz);
    } else {
      this.position.set(ux, uy, uz);
    }
    if (__cldIsHingeModuleLayoutDebugEnabled() && __cldIsCatalogModuleShellLike(p)) {
      __cldLogHingeModuleLayout('_build_pos: shell вычислен', {
        name: p.name,
        path: this.userData?.path || '',
        posExpr: p.pos,
        evalPosMm: { x: px, y: py, z: pz },
        evalPosUnits: { x: ux, y: uy, z: uz },
        parentSizeMm: {
          x: Number(parentSize.x) || 0,
          y: Number(parentSize.y) || 0,
          z: Number(parentSize.z) || 0,
        },
      });
    }

    // Debug: почему не двигается присадка в превью (включать в консоли iframe).
    try {
      if (typeof window !== 'undefined' && window.__CLD_DEBUG_FURNI_POS === true) {
        const t = String(p?.type || '');
        if (t === 'furniture' || t === 'hole') {
          console.log('[CLD][pos-debug]', {
            type: t,
            name: p?.name || '',
            id: p?.id || '',
            path: this.userData?.path || '',
            posExpr: p?.pos,
            posMm: { x: px, y: py, z: pz },
            posUnits: { x: ux, y: uy, z: uz },
            parentSizeMm: { x: parentSize.x, y: parentSize.y, z: parentSize.z },
          });
        }
      }
    } catch (_) {}
  }

  _build_rot() {
    // Референс: rotateX/Y/Z(-deg2rad(angle)) на own_object
    const p = this.config || {};
    const c = this.calculated.c_object;
    const sectionSize = c.parent_size || c.root_size || new THREE.Vector3();
    const ctx = {
      sizes: { x: sectionSize.x, y: sectionSize.y, z: sectionSize.z },
      vars: c.vars || {},
    };
    const rx = evalExpr(p.rot?.x ?? 0, ctx);
    const ry = evalExpr(p.rot?.y ?? 0, ctx);
    const rz = evalExpr(p.rot?.z ?? 0, ctx);
    this.calculated.rot.set(rx, ry, rz);

    const h = this.userData.own_object;
    if (!h) return;
    h.rotation.set(0, 0, 0);
    h.rotateX(-THREE.MathUtils.degToRad(rx));
    h.rotateY(-THREE.MathUtils.degToRad(ry));
    h.rotateZ(-THREE.MathUtils.degToRad(rz));
  }

  _build_scale() {
    // Референс: scale = comp2(scale.*) и set на own_object
    const p = this.config || {};
    const c = this.calculated.c_object;
    const sectionSize = c.parent_size || c.root_size || new THREE.Vector3();
    const ctx = {
      sizes: { x: sectionSize.x, y: sectionSize.y, z: sectionSize.z },
      vars: c.vars || {},
    };
    const sx = evalExpr(p.scale?.x ?? 1, ctx);
    const sy = evalExpr(p.scale?.y ?? 1, ctx);
    const sz = evalExpr(p.scale?.z ?? 1, ctx);
    this.calculated.scale.set(sx, sy, sz);
    const h = this.userData.own_object;
    if (!h) return;
    h.scale.set(sx, sy, sz);
  }

  _conv_pivot(pivot, sizeMm) {
    // еренс conv_pivot: return -f * g / 2 (:563-582)
    let pv = pivot;
    if (typeof pivot === 'string') {
      switch (pivot) {
        case 'left': pv = -1; break;
        case 'top': pv = 1; break;
        case 'right': pv = 1; break;
        case 'bottom': pv = -1; break;
        case 'center': pv = 0; break;
        default: pv = Number(pivot);
      }
    }
    const n = Number.isFinite(pv) ? Number(pv) : 0;
    return (-n * Number(sizeMm || 0)) / 2; // ВАЖНО: минус перед n!
  }

  _build_pivot() {
    // Референс: translateX/Y/Z(conv_pivot(pivot, size))
    const p = this.config || {};
    const size = this.calculated.size || new THREE.Vector3();
    const h = this.userData.own_object;
    if (!h) return;

    // Референс: conv_pivot возвращает -pivot * size / 2
    const px = this._conv_pivot(p.pivot?.x ?? 0, size.x);
    const py = this._conv_pivot(p.pivot?.y ?? 0, size.y);
    const pz = this._conv_pivot(p.pivot?.z ?? 0, size.z);

    h.translateX(px / UNITS_MM);
    h.translateY(py / UNITS_MM);
    h.translateZ(pz / UNITS_MM);

    // Каркас (helpers) должен совпадать с мешем — копируем transform из own_object
    const helpers = this.userData.helpers;
    if (helpers) {
      helpers.position.copy(h.position);
      helpers.rotation.copy(h.rotation);
      helpers.scale.copy(h.scale);
    }
  }

  _build_c_rot() {
    // Референс: дополнительный поворот (c_rot) применяют после pivot
    const p = this.config || {};
    const c = this.calculated.c_object;
    const sectionSize = c.parent_size || c.root_size || new THREE.Vector3();
    const ctx = {
      sizes: { x: sectionSize.x, y: sectionSize.y, z: sectionSize.z },
      vars: c.vars || {},
    };
    const crx = evalExpr(p.c_rot?.x ?? 0, ctx);
    const cry = evalExpr(p.c_rot?.y ?? 0, ctx);
    const crz = evalExpr(p.c_rot?.z ?? 0, ctx);
    const h = this.userData.own_object;
    if (!h) return;
    h.rotateX(-THREE.MathUtils.degToRad(crx));
    h.rotateY(-THREE.MathUtils.degToRad(cry));
    h.rotateZ(-THREE.MathUtils.degToRad(crz));
    // Синхронизируем helpers с own_object (каркас должен совпадать с мешем)
    const helpers = this.userData.helpers;
    if (helpers) {
      helpers.rotation.copy(h.rotation);
    }
  }

  _before_build() {
    this._invokeNodeEvent('on_before_build');
  }

  _build_spec() {}

  _build_children() {
    const root = this.userData.root;
    const p = this.config;
    if ((window.__CLD_DEBUG_TREE_BUILD || window.__CLD_DEBUG_FURNI_HOLES) && (p?.type === 'furniture' || p?.type === 'hole')) {
      console.log('[CLD][children] enter', {
        parentType: p?.type,
        parentName: p?.name,
        parentPath: this.userData?.path || '',
        hasChildren: Array.isArray(p?.children) ? p.children.length : null,
      });
    }
    // источник детей как в референсе: root module берёт spec.template.tree
    let childrenParams = p.children || [];
    if (root && root.userData.is_root && this.userData.is_root && p.type === 'module') {
      childrenParams = getTemplateChildrenFromConfig(p) || [];
      // Реф load_templates: для корневого module spec.fill_content раскладывается
      // в section/fill_section по section_key (один раз, через флаг fill_content_expanded).
      if (p.spec && p.spec.fill_content && !p.spec.fill_content_expanded) {
        __cldExpandFillContent(childrenParams, p.spec.fill_content);
        p.spec.fill_content_expanded = 1;
      }
    }

    // Каталожный модуль: если среди детей есть type:'module' с spec.template_tree,
    // разворачиваем его template_tree прямо в список детей, чтобы секции/стенки/фасады
    // строились корректно (иначе пустой children и ничего не рендерится).
    childrenParams = this._expandCatalogModules(childrenParams);

    /** Для секций: логические дети (CabinetNode), нужны reparent петли → __animator_swing. */
    this.userData.cabinet_child_nodes = [];

    for (let i = 0; i < childrenParams.length; i++) {
      const cp = childrenParams[i];
      if (!cp || !cp.type) continue;
      const path = (this.userData.path || '0') + ',' + i;
      
      // Реф: вложенный module — Module extends CabinetSection (каталог) или fill_module (двери/опоры).
      let Ctor = item_types[cp.type];
      let nodeParams = { ...cp };
      if (cp.type === 'module' && !this.userData.is_root) {
        if (__cldIsFlatCatalogShelfSpec(cp.spec, cp)) {
          Ctor = item_types['fill_module'] || CabinetFillNode;
          nodeParams = __cldNormalizeFlatCatalogShelfModuleParams(cp);
          nodeParams.type = 'module';
        } else if (__cldIsCatalogLinkedModuleSpec(cp.spec)) {
          Ctor = CatalogModuleNode;
          nodeParams = deepMerge(defParams.catalog_module || {}, cp);
          nodeParams.type = 'module';
        } else {
          Ctor = item_types['fill_module'] || CabinetFillNode;
          nodeParams = deepMerge(defParams['fill_module'] || {}, cp);
          nodeParams.type = 'module';
        }
      }

      // Админка хранит position/anchor/rotation; движок — pos/pivot/rot.
      // anchor из UI всегда важнее старого pivot (кнопки «Точка отсчёта»).
      if (nodeParams.position && !nodeParams.pos) {
        nodeParams.pos = nodeParams.position;
        delete nodeParams.position;
      }
      if (nodeParams.anchor) {
        nodeParams.pivot = nodeParams.anchor;
        delete nodeParams.anchor;
      }
      if (nodeParams.rotation && !nodeParams.rot) {
        nodeParams.rot = nodeParams.rotation;
        delete nodeParams.rotation;
      }
      
      if (!Ctor) {
        if (window.__CLD_DEBUG_FURNI_HOLES || window.__CLD_DEBUG_TREE_BUILD) {
          console.warn('[CLD][children] missing ctor for type=' + cp.type, {
            parentType: p?.type,
            parentName: p?.name,
            parentPath: this.userData?.path || '',
            childIdx: i,
            childType: cp.type,
            childName: cp.name,
            childSpec: cp.spec,
          });
        }
        continue;
      }
      
      const node = new Ctor(nodeParams, {
        root,
        parent: this,
        local_parent: this.userData.is_root ? this : this.userData.local_parent,
        path,
      });
      if (window.__CLD_DEBUG_FURNI_HOLES || window.__CLD_DEBUG_TREE_BUILD) {
        if (cp.type === 'hole' || p?.type === 'furniture') {
          console.log('[CLD][children] created', {
            parentType: p?.type,
            parentName: p?.name,
            parentPath: this.userData?.path || '',
            childType: cp.type,
            childName: cp.name,
            childPath: path,
            childSpec: cp.spec,
          });
        }
      }
      node.userData.path = path;
      if (Array.isArray(nodeParams.jointSchemes) && nodeParams.jointSchemes.length) {
        node.userData.jointSchemes = nodeParams.jointSchemes;
        if (node.config && typeof node.config === 'object') {
          node.config.jointSchemes = nodeParams.jointSchemes;
        }
      }
      if (root && root.userData.parts_by_path && root.userData.parts_by_path[cp.type]) {
        root.userData.parts_by_path[cp.type][path] = node;
        root.userData.params_hash[cp.type].push(cp);
      }
      this.userData.cabinet_child_nodes.push(node);
      this.userData.own_object.add(node);
    }
  }

  _expandCatalogModules(childrenParams) {
    if (!Array.isArray(childrenParams)) return childrenParams;

    const normalizeFields = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.position && !node.pos) { node.pos = node.position; delete node.position; }
      if (node.anchor) { node.pivot = node.anchor; delete node.anchor; }
      if (node.rotation && !node.rot) { node.rot = node.rotation; delete node.rotation; }
      if (Array.isArray(node.children)) node.children.forEach(normalizeFields);
    };

    // API иногда дублирует дочерние узлы секций как плоские братья.
    // Убираем такие дубли по id.
    const dedupChildren = (nodes) => {
      if (!Array.isArray(nodes) || nodes.length === 0) return nodes;
      const idsInSections = new Set();
      const collect = (arr) => {
        if (!Array.isArray(arr)) return;
        arr.forEach((n) => {
          const t = String(n?.type || '').toLowerCase();
          // Каталожные шаблоны часто дают один и тот же id (напр. hinge_animator) дверному аниматору
          // и аниматору внутри «Петли…» — иначе прямой ребёнок-секция не section выкидывается как «дубликат» и пропадает дверь.
          if (n?.id && t !== 'animator' && t !== 'facade') idsInSections.add(n.id);
          collect(n.children);
        });
      };
      nodes.filter(n => (n.type === 'section' || n.type === 'fill_section') && Array.isArray(n.children))
        .forEach(s => collect(s.children));
      if (idsInSections.size === 0) return nodes;
      const out = nodes.filter(n => {
        if (!n) return false;
        if (n.type === 'section' || n.type === 'fill_section') return true;
        return !n.id || !idsInSections.has(n.id);
      });
      out.forEach(n => { if (Array.isArray(n.children)) n.children = dedupChildren(n.children); });
      return out;
    };

    const result = [];
    for (const cp of childrenParams) {
      if (!cp) continue;
      if (cp.type === 'module' && __cldIsModuleInactiveFlag(cp.active)) continue;
      if (cp.type === 'module' && __cldShouldSkipFillCatalogLiveExpand(cp)) {
        const stub = JSON.parse(JSON.stringify(cp));
        stub.children = Array.isArray(cp.children) ? cp.children : [];
        if (stub.spec && typeof stub.spec === 'object') {
          delete stub.spec.template_tree;
          delete stub.spec.templates;
        }
        normalizeFields(stub);
        result.push(stub);
        continue;
      }
      // Вложенный module: если в JSON уже есть children (снимок из редактора), не подменять
      // деревом из каталога — иначе теряются правки внутри (spec.door_offset и т.п.).
      if (cp.type === 'module' && Array.isArray(cp.children) && cp.children.length > 0) {
        if (__cldIsHingeModuleLayoutDebugEnabled() && __cldSpecLooksLikeCatalogHingeModule(cp.spec)) {
          __cldLogHingeModuleLayout(
            'expandCatalogModules: module имеет непустой children → дерево из каталога НЕ подставляем (ранний выход)',
            {
              name: cp.name,
              element_type: cp.spec?.element_type,
              catalogId: cp.spec?.id,
              childrenLen: cp.children.length,
              pos: cp.pos,
              size: cp.size,
              pivot: cp.pivot,
            }
          );
        }
        const normalized = JSON.parse(JSON.stringify(cp));
        normalizeFields(normalized);
        // Реф load_templates: fill_content раскладывается по section_key один раз.
        // Здесь делаем то же при «снимке из редактора» (children уже непустой):
        // если в spec.fill_content есть данные для какой-то fill_section/section,
        // вставляем их перед собственными детьми (unshift). Флаг fill_content_expanded
        // оставляем как индикатор, что повторно не надо.
        if (
          normalized &&
          normalized.spec &&
          normalized.spec.fill_content &&
          !normalized.spec.fill_content_expanded &&
          Array.isArray(normalized.children)
        ) {
          __cldExpandFillContent(normalized.children, normalized.spec.fill_content);
          normalized.spec.fill_content_expanded = 1;
        }
        if (Array.isArray(normalized.children)) normalized.children = dedupChildren(normalized.children);
        result.push(normalized);
        continue;
      }
      let tplFromSpec = null;
      if (__cldIsFlatCatalogShelfSpec(cp.spec, cp)) {
        tplFromSpec = null;
      } else if (Array.isArray(cp.spec?.template_tree) && cp.spec.template_tree.length > 0) {
        tplFromSpec = cp.spec.template_tree;
      } else if (
        Array.isArray(cp.spec?.templates?.[0]?.template?.tree) &&
        cp.spec.templates[0].template.tree.length > 0
      ) {
        tplFromSpec = cp.spec.templates[0].template.tree;
      } else if (cp.type === 'module') {
        // Реф Clodis: для module берём template_tree из карточки каталога по ключу spec.element_type
        // (для петель ключ может быть 'hinges' или динамический 'catalog_31' — в обоих случаях работает
        // прямой lookup и фоллбэк по всем каталогам внутри __cldTryResolveModuleTreeFromCatalog).
        if (!__cldShouldSkipFillCatalogLiveExpand(cp)) {
          tplFromSpec = __cldTryResolveModuleTreeFromCatalog(cp.spec?.element_type, cp.spec?.id, cp.spec);
        }
      }
      if (__cldIsHingeModuleLayoutDebugEnabled() && cp.type === 'module' && __cldSpecLooksLikeCatalogHingeModule(cp.spec)) {
        __cldLogHingeModuleLayout('expandCatalogModules: входящий module (до обёртки shell)', {
          name: cp.name,
          element_type: cp.spec?.element_type,
          hingeCatalogTypeKey: cp.spec?.hingeCatalogTypeKey,
          catalogId: cp.spec?.id,
          pos: cp.pos,
          size: cp.size,
          pivot: cp.pivot,
          rot: cp.rot,
          scale: cp.scale,
          templateFromSpecLen: tplFromSpec ? tplFromSpec.length : null,
          hasCatalogLookupParent:
            !!(typeof window !== 'undefined' && window.parent && window.parent.__CLD_CATALOGS_DATA),
        });
      }
      if (cp.type === 'module' && tplFromSpec) {
        // Реф load_templates + Module extends CabinetSection: template_tree → module.children,
        // узел остаётся type:'module' (не section-shell); подсветка — CabinetSection._build_helpers.
        const childrenClone = tplFromSpec.map((tplChild) => {
          const expanded = JSON.parse(JSON.stringify(tplChild));
          normalizeFields(expanded);
          if (Array.isArray(expanded.children)) expanded.children = dedupChildren(expanded.children);
          return expanded;
        });
        const outerPyramidRole = cp.layout_role ?? cp.sectionLayoutRole ?? '';
        if (String(cp.spec?.element_type || '').toLowerCase() === 'catalog_28') {
          // catalog_28 = фасад: тот же накладной шов, что «Петли по ролям».
          __cldApplyOverlayFacadeDoorSeamLikeRoles(childrenClone);
        }
        __cldNormalizeCatalogTemplateForPyramidShell(childrenClone, outerPyramidRole);
        if (cp.spec && cp.spec.fill_content && !cp.spec.fill_content_expanded) {
          __cldExpandFillContent(childrenClone, cp.spec.fill_content);
        }
        const specRest = cp.spec && typeof cp.spec === 'object' ? { ...cp.spec } : {};
        delete specRest.template_tree;
        delete specRest.templates;
        if (specRest.fill_content) specRest.fill_content_expanded = 1;

        const defPivot = { x: -1, y: -1, z: -1 };
        const pvIn = cp.pivot && typeof cp.pivot === 'object' ? cp.pivot : {};
        const modulePivot = {
          x: pvIn.x !== undefined && pvIn.x !== null ? pvIn.x : defPivot.x,
          y: pvIn.y !== undefined && pvIn.y !== null ? pvIn.y : defPivot.y,
          z: pvIn.z !== undefined && pvIn.z !== null ? pvIn.z : defPivot.z,
        };

        const moduleNode = JSON.parse(JSON.stringify(cp));
        moduleNode.type = 'module';
        moduleNode.name = cp.name || 'catalog_module';
        moduleNode.active = cp.active ?? 1;
        moduleNode.visible = cp.visible ?? 1;
        moduleNode.helpers_visible = cp.helpers_visible ?? 1;
        moduleNode.size = {
          x: cp.size?.x ?? 's:x',
          y: cp.size?.y ?? 's:y',
          z: cp.size?.z ?? 's:z',
        };
        moduleNode.pos = { x: cp.pos?.x ?? 0, y: cp.pos?.y ?? 0, z: cp.pos?.z ?? 0 };
        moduleNode.rot = cp.rot || { x: 0, y: 0, z: 0 };
        moduleNode.scale = cp.scale || { x: 1, y: 1, z: 1 };
        moduleNode.pivot = modulePivot;
        moduleNode.spec = specRest;
        moduleNode.children = childrenClone;
        const shellRole = String(cp.layout_role ?? cp.sectionLayoutRole ?? '').trim().toLowerCase();
        if (shellRole) {
          moduleNode.layout_role = shellRole;
          moduleNode.sectionLayoutRole = shellRole;
        }
        if (__cldIsHingeModuleLayoutDebugEnabled() && __cldSpecLooksLikeCatalogHingeModule(cp.spec)) {
          __cldLogHingeModuleLayout('expandCatalogModules: module + template_tree children (реф)', {
            moduleName: cp.name,
            modulePos: cp.pos,
            moduleSize: cp.size,
            childrenLen: Array.isArray(moduleNode.children) ? moduleNode.children.length : 0,
          });
        }
        normalizeFields(moduleNode);
        if (Array.isArray(moduleNode.children)) moduleNode.children = dedupChildren(moduleNode.children);
        result.push(moduleNode);
      } else {
        if (
          __cldIsHingeModuleLayoutDebugEnabled() &&
          cp.type === 'module' &&
          __cldSpecLooksLikeCatalogHingeModule(cp.spec)
        ) {
          __cldLogHingeModuleLayout('expandCatalogModules: module остался без template_tree (идёт как есть)', {
            name: cp.name,
            element_type: cp.spec?.element_type,
            catalogId: cp.spec?.id,
            pos: cp.pos,
            size: cp.size,
            pivot: cp.pivot,
            rot: cp.rot,
            hasCatalogLookupParent:
              !!(typeof window !== 'undefined' && window.parent && window.parent.__CLD_CATALOGS_DATA),
          });
        }
        result.push(cp);
      }
    }
    return result;
  }

  /** Открывание: поле accessory.opening перекрывает spec.opening фасада. */
  _resolveHingeOpening(acc) {
    const a = String(acc?.opening || '').toLowerCase().trim();
    const s = String(this.config?.spec?.opening || '').toLowerCase();
    return a || s;
  }

  /** Вертикаль петель: либо acc.hinges[{pos,from}], либо авто по count с отступами от низа/верха (мм). */
  _resolveHingeYPositionsMm(acc, doorHeightMm, count) {
    const hinges = acc && acc.hinges;
    const top = Number(acc?.hingeInsetTopMm);
    const bottom = Number(acc?.hingeInsetBottomMm);
    const OFF_TOP = Number.isFinite(top) && top >= 0 ? top : 120;
    const OFF_BOT = Number.isFinite(bottom) && bottom >= 0 ? bottom : 120;
    if (Array.isArray(hinges) && hinges.length) {
      return hinges.map(h => {
        let pos = h.pos != null ? String(h.pos) : '0';
        const from = h.from != null ? Number(h.from) : -1;
        let isPct = false;
        if (pos.endsWith('%')) { pos = pos.slice(0, -1); isPct = true; }
        let v = parseFloat(pos) || 0;
        if (isPct) v = v / 100 * doorHeightMm;
        if (from === 0) return doorHeightMm / 2 + v;
        if (from > 0) return doorHeightMm - v;
        return v;
      });
    }
    const n = Math.max(1, count || 2);
    if (n === 1) return [OFF_TOP];
    if (n === 2) return [OFF_TOP, doorHeightMm - OFF_BOT];
    const ps = [OFF_TOP];
    const gap = (doorHeightMm - OFF_TOP - OFF_BOT) / (n - 1);
    for (let i = 1; i < n - 1; i++) ps.push(OFF_TOP + i * gap);
    ps.push(doorHeightMm - OFF_BOT);
    return ps;
  }

  _buildHingesForFacade(acc) {
    // Старая BLB-петля из accessories отключена — только catalog_31 / шаблон Bazis.
    void acc;
    return;
    const count = Number(acc.count) || 2;
    const sz = this.calculated.size || new THREE.Vector3();
    const doorH = sz.y;
    const glbEarly = __resolveHingeGltfUrl(acc);
    const glbEarlyF = __resolveHingeGltfUrlFacade(acc);
    if (!Number.isFinite(doorH) || doorH <= 0) {
      const sectionSizeMm = {
        x: Number.isFinite(sz.x) && sz.x > 0 ? sz.x : 50,
        y: Number.isFinite(sz.y) && sz.y > 0 ? sz.y : 67,
        z: Number.isFinite(sz.z) && sz.z > 0 ? sz.z : 20,
      };
      if (glbEarly || glbEarlyF) {
        __cldPreviewLog('hinge', 'Высота узла для петли некорректна — показываем GLB упрощённо (проверьте размер секции/детали)', {
          doorH,
          size: { x: sz.x, y: sz.y, z: sz.z },
          accName: acc?.name,
          url: !!(glbEarly || glbEarlyF),
        });
        this._buildGenericAccessoryGltf(acc, sectionSizeMm, 0, glbEarly || glbEarlyF);
      } else {
        __cldPreviewLog('hinge', 'Петля пропущена: нет высоты (doorH) и нет modelUrl/glb', {
          doorH,
          size: { x: sz.x, y: sz.y, z: sz.z },
          accName: acc?.name,
        });
      }
      return;
    }

    const opening = this._resolveHingeOpening(acc);
    const isLTR = opening !== 'right' && opening !== 'rtl';

    const hingeDoorSz = { x: 12, y: 55, z: 12 };
    const hingeFacadeSz = { x: 11, y: 55, z: 4 };
    const fitStd =
      acc.hingePreviewFitStandard === true ||
      acc.hinge_preview_fit_standard === 1 ||
      acc.hingePreviewFitStandard === 1;
    let hingeDoorRefMm = null;
    let hingeFacadeRefMm = null;
    if (fitStd) {
      hingeDoorRefMm = hingeDoorSz;
      hingeFacadeRefMm = hingeFacadeSz;
    } else {
      hingeDoorRefMm =
        __cldReadPositiveRefMm3(acc.hingeDoorPreviewRefMm) ||
        __cldReadPositiveRefMm3(acc.hingePreviewRefMm) ||
        __cldReadPositiveRefMm3(acc.ref_size_mm);
      hingeFacadeRefMm =
        __cldReadPositiveRefMm3(acc.hingeFacadePreviewRefMm) || hingeDoorRefMm;
    }
    const cabinetThickness = 16;

    const hingeDx = Number(acc.hingeOffsetXMm);
    const hingeDy = Number(acc.hingeOffsetYMm);
    const hingeDz = Number(acc.hingeOffsetZMm);
    const offX = Number.isFinite(hingeDx) ? hingeDx : 0;
    const offY = Number.isFinite(hingeDy) ? hingeDy : 0;
    const offZ = Number.isFinite(hingeDz) ? hingeDz : 0;
    const cabT = Number(acc.hingeCabinetThicknessMm);
    const cabThick = Number.isFinite(cabT) && cabT > 0 ? cabT : cabinetThickness;
    const hoMm = Number(acc.hingesOffset);
    const stackMm =
      Number.isFinite(cabT) && cabT > 0
        ? cabT
        : Number.isFinite(hoMm) && hoMm > 0
          ? hoMm
          : cabinetThickness;
    const rotExtra = Number.isFinite(Number(acc.hingeRotZDeg))
      ? THREE.MathUtils.degToRad(Number(acc.hingeRotZDeg))
      : 0;
    const rotYDegNum = Number(acc.hingeRotYDeg);
    const rotYRadExtra = Number.isFinite(rotYDegNum)
      ? THREE.MathUtils.degToRad(rotYDegNum)
      : null;

    const yPositions = this._resolveHingeYPositionsMm(acc, doorH, count);
    const glbMain = __resolveHingeGltfUrl(acc);
    const glbFacade = __resolveHingeGltfUrlFacade(acc);

    const placeHingePlaceholderBoxes = () => {
      const mat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 });
      for (const yMm of yPositions) {
        const inward = isLTR ? 1 : -1;
        const edgeX = isLTR ? -sz.x / 2 : sz.x / 2;
        const py = yMm - doorH / 2;
        const rotZ = (isLTR ? Math.PI : 0) + rotExtra;

        const gD = new THREE.BoxGeometry(mmToU(hingeDoorSz.x), mmToU(hingeDoorSz.y), mmToU(hingeDoorSz.z));
        const mD = new THREE.Mesh(gD, mat);
        mD.name = 'furni_hinge_door';
        mD.userData.isAccessory = true;
        mD.userData.isFurniture = true;
        __tagHingeMeshesForBazisExport(mD, acc, isLTR, 'door');
        mD.position.set(
          mmToU(edgeX + inward * (stackMm + hingeDoorSz.x / 2) + offX),
          mmToU(py + offY),
          mmToU(-hingeDoorSz.z / 2 + offZ)
        );
        mD.rotation.z = rotZ;
        if (rotYRadExtra != null) mD.rotation.y = rotYRadExtra;
        this.userData.own_object.add(mD);
        if (__cldShouldDrawHingeHoleOutlines()) {
          attachHingeHoleOutlines(mD, { kind: 'door', mmToScene: 1 / UNITS_MM });
        }

        const gF = new THREE.BoxGeometry(mmToU(hingeFacadeSz.x), mmToU(hingeFacadeSz.y), mmToU(hingeFacadeSz.z));
        const mF = new THREE.Mesh(gF, mat);
        mF.name = 'furni_hinge_facade';
        mF.userData.isAccessory = true;
        mF.userData.isFurniture = true;
        __tagHingeMeshesForBazisExport(mF, acc, isLTR, 'facade');
        const facadeThickness = sz.z || 16;
        mF.position.set(
          mmToU(edgeX + inward * hingeFacadeSz.x / 2 + offX),
          mmToU(py + offY),
          mmToU(-facadeThickness / 2 - hingeFacadeSz.z / 2 + offZ)
        );
        mF.rotation.z = rotZ;
        if (rotYRadExtra != null) mF.rotation.y = rotYRadExtra;
        this.userData.own_object.add(mF);
        if (__cldShouldDrawHingeHoleOutlines()) {
          attachHingeHoleOutlines(mF, { kind: 'facade', mmToScene: 1 / UNITS_MM });
        }
      }
    };

    if (glbMain || glbFacade) {
      const epoch = this.userData._ownRebuildEpoch || 0;
      const own = this.userData.own_object;
      const userScale = Number(acc.hingeModelScale);
      const scaleMul = Number.isFinite(userScale) && userScale > 0 ? userScale : 1;
      const rotXDegNum = Number(acc.hingeRotXDeg);
      const rotXRadGlb = Number.isFinite(rotXDegNum)
        ? THREE.MathUtils.degToRad(rotXDegNum)
        : Math.PI / 2;
      const rotYRadGlb = Number.isFinite(rotYDegNum)
        ? THREE.MathUtils.degToRad(rotYDegNum)
        : -Math.PI / 2;
      const placePrepared = (prepared, pxMm, pyMm, pzMm, rotZ, holeKind) => {
        if (!prepared || !own) return;
        __tagHingeMeshesForBazisExport(prepared, acc, isLTR, holeKind);
        if (scaleMul !== 1) prepared.scale.multiplyScalar(scaleMul);
        prepared.position.set(
          mmToU(pxMm + offX),
          mmToU(pyMm + offY),
          mmToU(pzMm + offZ)
        );
        prepared.rotation.order = 'YXZ';
        prepared.rotation.x = rotXRadGlb;
        prepared.rotation.y = rotYRadGlb;
        prepared.rotation.z = rotZ + rotExtra;
        own.add(prepared);
        if (
          __cldShouldDrawHingeHoleOutlines() &&
          (holeKind === 'facade' || holeKind === 'door')
        ) {
          attachHingeHoleOutlines(prepared, { kind: holeKind, mmToScene: 1 / UNITS_MM });
        }
      };
      const run = async () => {
        const [tplMain, tplF] = await Promise.all([
          glbMain ? __loadHingeGltfRootOnce(glbMain) : Promise.resolve(null),
          glbFacade ? __loadHingeGltfRootOnce(glbFacade) : Promise.resolve(null),
        ]);
        if ((this.userData._ownRebuildEpoch || 0) !== epoch) return;
        let placed = 0;
        for (const yMm of yPositions) {
          const inward = isLTR ? 1 : -1;
          const edgeX = isLTR ? -sz.x / 2 : sz.x / 2;
          const py = yMm - doorH / 2;
          const rotZ = isLTR ? Math.PI : 0;
          if (tplMain) {
            const px = edgeX + inward * (stackMm + hingeDoorSz.x / 2);
            const pz = -hingeDoorSz.z / 2;
            placePrepared(__prepareHingeGltfClone(tplMain, hingeDoorRefMm), px, py, pz, rotZ, 'door');
            placed++;
          }
          if (tplF) {
            const facadeThickness = sz.z || 16;
            const px = edgeX + inward * hingeFacadeSz.x / 2;
            const pz = -facadeThickness / 2 - hingeFacadeSz.z / 2;
            placePrepared(__prepareHingeGltfClone(tplF, hingeFacadeRefMm), px, py, pz, rotZ, 'facade');
            placed++;
          }
        }
        if (placed === 0) placeHingePlaceholderBoxes();
      };
      run().catch((e) => {
        console.warn('[CLD] hinge GLB:', e);
        if ((this.userData._ownRebuildEpoch || 0) !== epoch) return;
        placeHingePlaceholderBoxes();
      });
      return;
    }

    placeHingePlaceholderBoxes();
  }

  /**
   * GLB/FBX комплектующего, если в названии нет «петл»/hinge (ветка _buildHingesForFacade их обрабатывает).
   * Нужен для превью, когда modelUrl задан, а имя — «Накладная часть» и т.п.
   */
  _buildGenericAccessoryGltf(acc, sectionSizeMm, instanceIndex, urlRaw) {
    const url = __resolveAssetUrlForModel(String(urlRaw || '').trim());
    if (!url) {
      __cldPreviewLog('gltf', 'Пустой URL после resolve', { accName: acc?.name, urlRaw });
      return;
    }
    __cldPreviewLog('gltf', 'Загрузка комплектующего', { url, accName: acc?.name });
    const own = this.userData.own_object;
    if (!own) return;
    const epoch = this.userData._ownRebuildEpoch || 0;
    const rx = Number(acc.ref_size_mm?.x ?? acc.refSizeMm?.x);
    const ry = Number(acc.ref_size_mm?.y ?? acc.refSizeMm?.y);
    const rz = Number(acc.ref_size_mm?.z ?? acc.refSizeMm?.z);
    const refMm = {
      x: Number.isFinite(rx) && rx > 0 ? rx : 50,
      y: Number.isFinite(ry) && ry > 0 ? ry : 67,
      z: Number.isFinite(rz) && rz > 0 ? rz : 20,
    };
    const userScale = Number(acc.hingeModelScale);
    const scaleMul = Number.isFinite(userScale) && userScale > 0 ? userScale : 1;
    const posMm = {
      x: instanceIndex * 45,
      y: -sectionSizeMm.y / 2 + refMm.y / 2,
      z: 0,
    };
    __loadCabinetModelAssetRootOnce(url).then((tpl) => {
      if ((this.userData._ownRebuildEpoch || 0) !== epoch) return;
      if (!tpl) {
        __cldPreviewLog('gltf', 'Модель не загрузилась (404/CORS/формат)', { url, accName: acc?.name });
        return;
      }
      __cldPreviewLog('gltf', 'Модель в сцене', { url, accName: acc?.name });
      const root = tpl.clone(true);
      root.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          o.userData.isAccessory = true;
        }
      });
      root.scale.set(1, 1, 1);
      root.position.set(0, 0, 0);
      root.rotation.set(0, 0, 0);
      root.updateMatrixWorld(true);
      const assetMeta = tpl.userData && tpl.userData.__cldGltfAsset;
      const imp = __cldInferFileToSceneScaleFactor(root, acc, assetMeta);
      root.scale.setScalar(imp);
      root.updateMatrixWorld(true);
      __gltfRootMultiplyUniformScaleToRefMm(root, refMm);
      if (scaleMul !== 1) root.scale.multiplyScalar(scaleMul);
      root.position.set(mmToU(posMm.x), mmToU(posMm.y), mmToU(posMm.z));
      root.name = String(acc.name || 'accessory_gltf').replace(/\s+/g, '_');
      own.add(root);
      try {
        render();
      } catch (_) {}
    });
  }

  _build_accessories() {
    const p = this.config;
    const accessories = p.accessories || [];
    if (!Array.isArray(accessories) || accessories.length === 0) return;

    const sectionSize = this.calculated.size || new THREE.Vector3();
    const sectionSizeMm = { x: sectionSize.x, y: sectionSize.y, z: sectionSize.z };
    const nodePath = this.userData?.path ?? '?';
    const nodeType = this.config?.type ?? '?';

    accessories.forEach((acc, index) => {
      if (!acc) return;
      const idStr = acc.id != null ? String(acc.id).trim() : '';
      if (!idStr && !String(acc.name || '').trim()) return;
      const accName = acc.name || `Комплектующее #${acc.id}`;
      const nameLower = accName.toLowerCase();
      const glbMain = __resolveHingeGltfUrl(acc);
      const glbFacade = __resolveHingeGltfUrlFacade(acc);
      __cldPreviewLog('accessory', 'Комплектующее', {
        nodePath,
        nodeType,
        name: accName,
        hingeNamed: nameLower.includes('петл') || nameLower.includes('hinge'),
        hasModelUrl: !!(glbMain || glbFacade),
      });

      if (nameLower.includes('петл') || nameLower.includes('hinge')) {
        // Реф: если петля добавлена как flat-module (type:module spec.element_type:"hinges"),
        // то аксессуарные петли на фасаде не строим. Иначе получаем "вторую петлю" по центру двери
        // (from:0 → doorH/2), и визуально половинки "разъезжаются" по Y.
        if (acc.__cldPreferCatalogHingeModule === true) return;
        try {
          const sec = __cldFindAncestorCabinetSectionNode(this.userData?.parent || null);
          if (sec && __cldSectionHasDirectHingeModule(sec)) return;
        } catch (_) {}
        this._buildHingesForFacade(acc);
        return;
      }

      if (glbMain || glbFacade) {
        const count = Math.max(1, Number(acc.count) || 1);
        const u = glbMain || glbFacade;
        for (let i = 0; i < count; i++) {
          this._buildGenericAccessoryGltf(acc, sectionSizeMm, index * 20 + i, u);
        }
        return;
      }

      const count = Number(acc.count || 1);
      for (let i = 0; i < count; i++) {
        const accessoryMesh = this._createAccessoryMesh(acc, sectionSizeMm, i);
        if (accessoryMesh) {
          this.userData.own_object.add(accessoryMesh);
        }
      }
    });
  }

  _createAccessoryMesh(acc, sectionSizeMm, instanceIndex = 0) {
    const accName = acc.name || `Комплектующее #${acc.id}`;
    const accId = String(acc.id || '');
    
    // Размеры placeholder для комплектующих (как в ClodisBuilder)
    let size = { x: 500, y: 30, z: 25 }; // По умолчанию: направляющая 500x30x25мм
    
    const nameLower = (accName || '').toLowerCase();
    if (nameLower.includes('направляющ') || nameLower.includes('rail') || nameLower.includes('slide')) {
      // Направляющая: длина = ширина секции, ширина/высота небольшие
      size = {
        x: sectionSizeMm.x * 0.9, // 90% ширины секции
        y: 30, // 30мм высота
        z: 25  // 25мм глубина
      };
    } else if (nameLower.includes('ручк') || nameLower.includes('handle')) {
      // Ручка: делаем более реалистичную "скобу" простым бруском.
      size = { x: 128, y: 20, z: 22 };
    } else if (nameLower.includes('полкодерж') || nameLower.includes('shelf')) {
      size = { x: 20, y: 20, z: 50 }; // Полкодержатель: вертикальный
    }
    
    // Позиция: размещаем комплектующие внутри секции
    // В локальных координатах секции: центр секции = (0,0,0), размеры от -size/2 до +size/2
    let posMm = { x: 0, y: 0, z: 0 };
    if (nameLower.includes('направляющ') || nameLower.includes('rail') || nameLower.includes('slide')) {
      // Направляющая: внизу секции, по центру по ширине и глубине
      posMm = {
        x: 0, // центр по ширине (секция центрирована)
        y: -sectionSizeMm.y / 2 + size.y / 2, // внизу секции
        z: 0  // центр по глубине
      };
    } else if (nameLower.includes('ручк') || nameLower.includes('handle')) {
      // Ручка: если есть spec.handle_offset / spec.opening — ставим на фасад логично.
      // NOTE: сюда попадают и фасады, и секции, но настройки ручки ожидаем на фасаде.
      const p = this.config || {};
      const off = Number(p?.spec?.handle_offset ?? p?.spec?.handleOffset ?? 30) || 30; // мм от верхнего края
      const opening = String(p?.spec?.opening || '').toLowerCase(); // left/right/up/down
      const sideInset = 40; // мм от бокового края (простая разумная константа)
      const frontInset = 6; // мм "выступ" ручки вперед

      // Ставим по высоте: от верхнего края вниз на off
      const yTop = sectionSizeMm.y / 2;
      const y = yTop - off;

      // По ширине: на противоположную сторону от петель
      const xLeft = -sectionSizeMm.x / 2 + sideInset;
      const xRight = sectionSizeMm.x / 2 - sideInset;
      let x = 0;
      if (opening === 'left') x = xRight;
      else if (opening === 'right') x = xLeft;
      else x = xRight; // по умолчанию как дверь "правая ручка"

      // По глубине: чуть "перед" плоскостью фасада.
      const zFront = sectionSizeMm.z / 2 + frontInset;

      posMm = { x, y, z: zFront };
    }
    else {
      // Остальные: размещаем по центру с небольшим смещением для разных экземпляров
      posMm = {
        x: instanceIndex * 50, // горизонтальное смещение
        y: -sectionSizeMm.y / 2 + size.y / 2 + instanceIndex * 20, // вертикальное смещение от низа
        z: 0
      };
    }
    
    // Создаём placeholder (Box) в юнитах сцены
    const geometry = new THREE.BoxGeometry(
      mmToU(size.x),
      mmToU(size.y),
      mmToU(size.z)
    );
    const material = new THREE.MeshStandardMaterial({
      color: 0x00aaff, // Синий цвет для комплектующих
      metalness: 0.5,
      roughness: 0.4,
      transparent: true,
      opacity: 0.8
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `Accessory_${accId}_${accName.replace(/\s+/g, '_')}`;
    // Позиция в локальных координатах секции (в юнитах сцены)
    mesh.position.set(
      mmToU(posMm.x),
      mmToU(posMm.y),
      mmToU(posMm.z)
    );
    
    // Сохраняем данные комплектующего в userData
    mesh.userData.isAccessory = true;
    mesh.userData.accessoryId = accId;
    mesh.userData.accessoryName = accName;
    mesh.userData.accessorySku = acc.sku || acc.article || '';
    mesh.userData.instanceIndex = instanceIndex;
    
    return mesh;
  }

  _build() {
    this._resetSelf();
    this._resetOwn();
    this.calculateDimensions();
    this.computePosition();
    this._build_rot();
    this._build_scale();
    this.calculatePivot();
    this._build_c_rot();
    if (this.config.active) this.buildGeometry();
    // Debug: trace children building for furniture/holes
    if (window.__CLD_DEBUG_TREE_BUILD || window.__CLD_DEBUG_FURNI_HOLES) {
      const p = this.config || {};
      if (p.type === 'furniture' || p.type === 'hole') {
        console.log('[CLD][_build] before buildChildren', {
          type: p.type,
          name: p.name,
          path: this.userData?.path || '',
          childrenCount: Array.isArray(p.children) ? p.children.length : null,
        });
      }
    }
    try {
      this.buildChildren();
    } catch (e) {
      const p = this.config || {};
      console.error('[CLD][_build] buildChildren FAILED', {
        type: p.type,
        name: p.name,
        path: this.userData?.path || '',
        err: e,
      });
      throw e;
    }
    this._build_accessories();
  }

  _after_build() {
    this._invokeNodeEvent('on_after_build');
    try {
      _cldApplyDrawerNoHandleToCatalogModuleNode(this);
    } catch (_) {}
    // Совместимость с референсом: можно дергать вручную при drag-end в интеграциях.
    this.userData.onDragEnd = () => this._invokeNodeEvent('on_drag_end');
    // Референс: helpers скрыты по умолчанию, показываются только при выборе через selectNode
    if (this.userData.helpers) {
      this.userData.helpers.visible = false;
    }
  }
}

/** Полупрозрачный зелёный объём + контур в helpers (секция, аниматор и т.п.). */
function cldAddSectionStyleVolumeHelpers(node, uSize, meshName = 'SectionVolume') {
  const helpers = node.userData?.helpers;
  if (!helpers || !uSize || !uSize.x || !uSize.y || !uSize.z) return;

  const geom = new THREE.BoxGeometry(uSize.x, uSize.y, uSize.z);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x96c296, // фирменный бледно-зелёный как у остальных helper-кубов
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.name = meshName;
  mesh.userData.isSectionVolume = true;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.position.set(0, 0, 0);
  mesh.renderOrder = 10;
  helpers.add(mesh);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geom),
    new THREE.LineBasicMaterial({ color: 0x000000, depthTest: false })
  );
  edges.position.set(0, 0, 0);
  edges.userData.isEdgesLines = true;
  edges.renderOrder = 11;
  helpers.add(edges);
  node.userData.edges_lines = edges;
}

/** Пересборка helper-объёма (например hole) — убрать старый зелёный куб перед добавлением нового. */
function cldClearHelpersVolume(node) {
  const helpers = node.userData?.helpers;
  if (!helpers) return;
  while (helpers.children.length) {
    const ch = helpers.children[0];
    helpers.remove(ch);
    disposeObject(ch);
  }
  node.userData.edges_lines = null;
}

/**
 * Стрелка направления сверления — CabinetHole._build_spec
 * merge(CylinderGeometry шток + ConeGeometry наконечник), ориентация по direction.
 */
function cldBuildHoleDirectionArrowMesh(dir, uRealSize) {
  const urs = uRealSize;
  const j = urs?.z ?? 0;
  if (!j || j <= 0) return null;
  const m = 0.3 * j;
  const coneR = 1 / UNITS_MM;
  const shaftR = 0.1 / UNITS_MM;
  const u = 0.7 * j;
  const v = new THREE.ConeGeometry(coneR, m, 16);
  const w = new THREE.CylinderGeometry(shaftR, shaftR, u, 8);
  switch (dir) {
    case 'x':
      w.rotateZ(Math.PI / 2).rotateZ(-Math.PI).translate(-urs.z / 2 - m / 2, 0, 0);
      v.rotateZ(Math.PI / 2).rotateZ(-Math.PI).translate(-urs.z / 2 + u / 2, 0, 0);
      break;
    case '-x':
      w.rotateZ(-Math.PI / 2).rotateZ(-Math.PI).translate(urs.z / 2 + m / 2, 0, 0);
      v.rotateZ(-Math.PI / 2).rotateZ(-Math.PI).translate(urs.z / 2 - u / 2, 0, 0);
      break;
    case 'y':
      w.translate(0, -urs.z / 2 - m / 2, 0);
      v.translate(0, -urs.z / 2 + u / 2, 0);
      break;
    case '-y':
      w.rotateZ(-Math.PI).translate(0, urs.z / 2 + m / 2, 0);
      v.rotateZ(-Math.PI).translate(0, urs.z / 2 - u / 2, 0);
      break;
    case 'z':
      w.rotateX(Math.PI / 2).translate(0, 0, -urs.z / 2 - m / 2);
      v.rotateX(Math.PI / 2).translate(0, 0, -urs.z / 2 + u / 2);
      break;
    case '-z':
    default:
      w.rotateX(-Math.PI / 2).translate(0, 0, urs.z / 2 + m / 2);
      v.rotateX(-Math.PI / 2).translate(0, 0, urs.z / 2 - u / 2);
      break;
  }
  const mergeFn = __cldBufGeomUtils.mergeGeometries || __cldBufGeomUtils.mergeBufferGeometries;
  const merged = typeof mergeFn === 'function' ? mergeFn([w, v]) : null;
  if (!merged) return null;
  const mat = new THREE.MeshBasicMaterial({
    color: 0x111111,
    transparent: true,
    opacity: 0.92,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(merged, mat);
  mesh.name = 'hole_direction_arrow';
  mesh.userData.type = 'hole_direction_arrow';
  mesh.renderOrder = 18;
  mesh.visible = false;
  return mesh;
}

/**
 * СК шаблона присадки (admin makeHoleObj): стрелка от точки входа (0) вдоль dir + маркер входа.
 * own_object отверстия = точка входа; цилиндр уже сдвинут на dir×depth/2.
 */
function cldBuildHoleTemplateEntryArrowGroup(dir, heightU, radiusU) {
  const depth = Number(heightU) || 0;
  const r = Math.max(Number(radiusU) || 0, 0.01);
  if (!(depth > 0)) return null;
  const dv = _DRILL_DIR_VEC[dir] || _DRILL_DIR_VEC['-z'];
  const drillDir = new THREE.Vector3(dv[0], dv[1], dv[2]).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), drillDir);
  const group = new THREE.Group();
  group.name = 'hole_direction_arrow';
  group.userData.type = 'hole_direction_arrow';
  group.userData.holeTemplateEntry = 1;

  const arrowMat = new THREE.MeshBasicMaterial({
    color: 0x111111,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    opacity: 0.92,
  });
  const coneH = Math.max(r * 1.0, depth * 0.14);
  const shaftR = Math.max(r * 0.32, depth * 0.07) / 5;
  const shaftLen = Math.max(depth - coneH, depth * 0.25);

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(shaftR, shaftR, shaftLen, 10), arrowMat);
  shaft.renderOrder = 42;
  shaft.quaternion.copy(quat);
  shaft.position.set(
    drillDir.x * (shaftLen / 2),
    drillDir.y * (shaftLen / 2),
    drillDir.z * (shaftLen / 2),
  );
  group.add(shaft);

  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(r * 0.65, shaftR * 5.0), coneH, 16),
    arrowMat,
  );
  cone.renderOrder = 42;
  cone.quaternion.copy(quat);
  cone.position.set(
    drillDir.x * (shaftLen + coneH / 2),
    drillDir.y * (shaftLen + coneH / 2),
    drillDir.z * (shaftLen + coneH / 2),
  );
  group.add(cone);

  // Точка входа на торце цилиндра (origin отверстия).
  const entryR = Math.max(r * 0.22, 0.4 / UNITS_MM);
  const entry = new THREE.Mesh(
    new THREE.SphereGeometry(entryR, 14, 12),
    new THREE.MeshBasicMaterial({
      color: 0x111111,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.95,
    }),
  );
  entry.name = 'hole_entry_point';
  entry.userData.type = 'hole_entry_point';
  entry.renderOrder = 43;
  entry.position.set(0, 0, 0);
  group.add(entry);

  group.visible = true;
  return group;
}

function __cldIsFacadeLikeNode(node) {
  const t = String(node?.config?.type || '').toLowerCase();
  return t === 'facade';
}

function __cldFindOwnOutsideFacadeBranch(node) {
  const chain = [];
  let p = node?.userData?.parent_params?.parent || null;
  while (p) {
    chain.push(p);
    p = p?.userData?.parent_params?.parent || null;
  }
  let seenFacadeLike = false;
  for (const a of chain) {
    if (__cldIsFacadeLikeNode(a)) {
      seenFacadeLike = true;
      continue;
    }
    if (!seenFacadeLike) continue;
    const own = a?.userData?.own_object || null;
    if (own) return own;
  }
  return null;
}

function __cldResolveCorpusOwnForAnimatorSwing(animatorNode) {
  const animOwn = animatorNode?.userData?.own_object;
  const viaBranch = __cldFindOwnOutsideFacadeBranch(animatorNode);
  if (viaBranch && viaBranch !== animOwn) return viaBranch;
  const par = animatorNode?.userData?.parent_params?.parent;
  const parOwn = par?.userData?.own_object;
  if (parOwn && parOwn !== animOwn) return parOwn;
  return null;
}

function __cldIsHingeNodeConfig(cfg) {
  if (!cfg || typeof cfg !== 'object') return false;
  return String(cfg.spec?.element_type || '').toLowerCase() === 'hinges';
}

function __cldChildrenConfigHasHingeModule(children) {
  if (!Array.isArray(children)) return false;
  return children.some((ch) => {
    if (!ch) return false;
    const et = String(ch.spec?.element_type || '').toLowerCase();
    if (et !== 'hinges') return false;
    const t = String(ch.type || '').toLowerCase();
    return t === 'module' || t === 'section' || t === 'fill_section';
  });
}

/** Секция с прямым дочерним module spec.element_type hinges (каталожная петля в JSON). */
function __cldSectionHasDirectHingeModule(sectionNode) {
  const kids = sectionNode?.userData?.cabinet_child_nodes;
  if (!Array.isArray(kids)) return false;
  return kids.some((ch) => {
    if (!ch) return false;
    if (String(ch.config?.type || '').toLowerCase() !== 'module') return false;
    return String(ch.config?.spec?.element_type || '').toLowerCase() === 'hinges';
  });
}

/** Первый предок с `userData.cldDoorSwing` (обычно `__animator` двери). */
function __cldAncestorObjectWithDoorSwingFrom(fromObj) {
  let o = fromObj && fromObj.parent;
  while (o) {
    if (o.userData?.cldDoorSwing) return o;
    o = o.parent;
  }
  return null;
}

// Логика «петля в фасад» (reparent в swing/carcase) полностью удалена по запросу.

class CabinetSectionNode extends CabinetNode {
  // Реф: CabinetSection._build_spec пустой — геометрия секции только в _build_helpers.
  // Исключение: виртуальный бок в превью «Петли по ролям» — обычная непрозрачная панель
  // (как стенка). Ghost (transparent + depthWrite:false) ломал depth у фасада → «стекло».
  _build_spec() {
    if (Number(this.config?.spec?.cldVirtualSidewall) !== 1) return;
    const size = this.calculated?.size;
    const uSize = this.calculated?.u_size;
    const own = this.userData?.own_object;
    if (!own || !size || !uSize) return;
    if (!Number(size.x) || !Number(size.y) || !Number(size.z)) return;
    const mat = create_material_for_wall();
    mat.color.setHex(0xd4d8de);
    mat.transparent = false;
    mat.opacity = 1;
    mat.depthWrite = true;
    const mesh = make_cube(uSize.x, uSize.y, uSize.z, mat);
    mesh.name = '__virtual_sidewall';
    mesh.userData.cldVirtualSidewall = 1;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    own.add(mesh);
  }

  /**
   * : CabinetSection._build_helpers .
   * Полупрозрачный зелёный куб + чёрные рёбра, transform = own_object.
   */
  _build_helpers() {
    const comp = this.calculated || {};
    const size = comp.size;
    if (!size || !Number(size.x) || !Number(size.y) || !Number(size.z)) return;

    if (!this.userData.helpers) {
      this.userData.helpers = new THREE.Group();
      this.userData.helpers.name = '__helpers';
      this.add(this.userData.helpers);
    }
    cldClearHelpersVolume(this);

    const uSize = comp.u_size || new THREE.Vector3(
      mmToU(size.x),
      mmToU(size.y),
      mmToU(size.z)
    );
    cldAddSectionStyleVolumeHelpers(this, uSize, 'SectionVolume');

    const own = this.userData.own_object;
    if (own) {
      this.userData.helpers.position.copy(own.position);
      this.userData.helpers.rotation.copy(own.rotation);
      this.userData.helpers.scale.copy(own.scale);
    }
  }

  _show_helpers() {
    this._build_helpers();
    if (this.userData.helpers) this.userData.helpers.visible = true;
  }

  /**
   * Ищет среди прямых children JSON аниматор rotate с дочерним facade и возвращает толщину фасада (мм),
   * если она ≤ 64. Иначе 0 (без вмешательства).
   */
  _cldFacadeThicknessFromAnimator() {
    const p = this.config || {};
    const ch = p.children;
    if (!Array.isArray(ch)) return 0;
    for (const c of ch) {
      if (!c || String(c.type || '').toLowerCase() !== 'animator') continue;
      const spec = c.spec || {};
      if (String(spec.fn || '').toLowerCase() !== 'rotate') continue;
      const ach = c.children;
      if (!Array.isArray(ach)) continue;
      for (const ac of ach) {
        if (!ac || String(ac.type || '').toLowerCase() !== 'facade') continue;
        const fz = ac.size?.z;
        if (fz == null) continue;
        const c2 = this.calculated.c_object;
        const ss = c2?.parent_size || c2?.root_size || new THREE.Vector3();
        const ctx = { sizes: { x: ss.x || 0, y: ss.y || 0, z: ss.z || 0 }, vars: c2?.vars || {} };
        const val = evalExpr(fz, ctx);
        if (Number.isFinite(val) && val > 0 && val <= 64) return val;
      }
    }
    return 0;
  }

  /**
   * Секция-обёртка каталожного фасада с аниматором: если size.z выходит из шкафа (=s:z),
   * пересчитываем на толщину фасада, чтобы pivot и s:z для дочерних совпадали с превью элемента.
   *
   * Реф: если рядом с аниматором есть hinge-модуль (element_type: "hinges"), секция сохраняет
   * полный размер s:z — только аниматор авто-фронт-флашится. Иначе хинж-слот становится 16мм,
   * и hingePreviewSwingPosMm / reparent к swing-группе ломаются.
   */
  _build_size() {
    super._build_size();
    if (this.userData.is_root) return;
    const ft = this._cldFacadeThicknessFromAnimator();
    if (ft <= 0) return;
    const p = this.config || {};
    const shellRole = String(p.layout_role ?? p.sectionLayoutRole ?? '').trim().toLowerCase();
    const isFacadeShellRole =
      shellRole === 'facades' || shellRole === 'facades_main' || shellRole === 'facades_top';
    // 1.257: для петель-стабильности используем «прямые дети», а не расширенный hasHingeModule.
    const hasHingeSibling =
      Array.isArray(p.children) &&
      p.children.some(
        (ch) =>
          ch &&
          String(ch.type || '').toLowerCase() === 'module' &&
          String(ch.spec?.element_type || '').toLowerCase() === 'hinges'
      );
    const dz = Number(this.calculated.size?.z) || 0;
    const parentZ = Number(this.calculated.c_object?.parent_size?.z) || 0;

    // Не фасадные секции: возвращаемся к 1.257-логике (не ломать петли).
    if (!isFacadeShellRole) {
      if (hasHingeSibling) return;
      if (dz > 64 && parentZ > 80) {
        this.calculated.size.z = ft;
        this.calculated.u_size.z = mmToU(ft);
      }
      return;
    }

    // Фасадные секции: даём thin-shell глубину под facade_thickness.
    // Хардкора под hinge catalog-секции убираем, чтобы hinge-модуль не ресайзился.
    if (hasHingeSibling && ft > 0 && ft <= 64) {
      this.calculated.size.z = ft;
      this.calculated.u_size.z = mmToU(ft);
      return;
    }
    if (dz > 64 && parentZ > 80) {
      this.calculated.size.z = ft;
      this.calculated.u_size.z = mmToU(ft);
    }
  }

  /**
   * Тонкая секция каталожного фасада (≈16 мм) внутри глубокого корпуса: автоприжатие к переднему поясу.
   */
  _build_pos() {
    const p = this.config || {};
    const c = this.calculated.c_object;
    const parentSize = c.parent_size || new THREE.Vector3();
    const sectionSize = c.parent_size || c.root_size || new THREE.Vector3();
    const shellRole = String(p.layout_role ?? p.sectionLayoutRole ?? '').trim().toLowerCase();
    const isFacadeShellRole =
      shellRole === 'facades' || shellRole === 'facades_main' || shellRole === 'facades_top';
    const isCatalog28Shell = String(p.spec?.element_type || '').toLowerCase() === 'catalog_28';
    const isFacadeCabinetShell = isFacadeShellRole || isCatalog28Shell;
    const rootDepthZ = Number(c.root_size?.z) || 0;
    const nicheDepthZ =
      isFacadeCabinetShell && rootDepthZ > 64 ? rootDepthZ : Number(sectionSize.z) || 0;
    // pos.z в JSON: «s:z - v:facade_thickness_mm» — s:z это глубина cabinet_root (root), не 16мм оболочки.
    const ctx = {
      sizes: {
        x: sectionSize.x,
        y: sectionSize.y,
        z: nicheDepthZ,
      },
      vars: c.vars || {},
    };

    const px = evalExpr(p.pos?.x ?? 0, ctx);
    const py = evalExpr(p.pos?.y ?? 0, ctx);

    let pzRaw = p.pos?.z;
    const dz = Number(this.calculated.size?.z) || 0;
    const pzNum = pzRaw === undefined || pzRaw === null ? NaN : Number(pzRaw);
    const pzIsDefault =
      pzRaw === undefined ||
      pzRaw === null ||
      pzRaw === 0 ||
      pzRaw === '0' ||
      (typeof pzRaw === 'string' && pzRaw.trim() === '') ||
      (Number.isFinite(pzNum) && pzNum === 0);

    const thickParent = nicheDepthZ > 80 || (Number(parentSize.z) || 0) > 80;
    const thinSection = dz > 0 && dz <= 64;
    const skipAuto = !!(p.spec && p.spec._cldDisableFrontFlush);
    // Прямой hinge-module среди детей оболочки (редко); вложенная петля в catalog_28 — не блокирует pos.z оболочки.
    const hasHingeSibling = Array.isArray(p.children) &&
      p.children.some((ch) =>
        ch &&
        String(ch.type || '').toLowerCase() === 'module' &&
        String(ch.spec?.element_type || '').toLowerCase() === 'hinges'
      );

    if (
      !skipAuto &&
      !hasHingeSibling &&
      thinSection &&
      thickParent &&
      pzIsDefault &&
      !this.userData.is_root
    ) {
      pzRaw = nicheDepthZ - dz;
    }

    let pz = evalExpr(pzRaw ?? 0, ctx);
    // Реф: comp2 «s:z» = parent_size.
    // Накладной как «Петли по ролям»: тыл двери на торце бока (pz = parentDepth),
    // полотно ВПЕРЕД — без врезки в объём бока (старый inset: pz = parentDepth − dz).
    const parentDepthZ = Number(parentSize.z) || 0;
    if (isFacadeCabinetShell && thinSection && parentDepthZ > 64) {
      pz = parentDepthZ;
    } else if (isFacadeCabinetShell && thinSection && parentDepthZ > 0 && parentDepthZ <= 64) {
      const frontPz = Math.max(0, parentDepthZ - dz);
      if (pz > frontPz + 0.5) pz = frontPz;
    } else if (isFacadeCabinetShell && rootDepthZ > 64 && !thinSection && dz > 64) {
      const frontPz = Math.max(0, rootDepthZ - Math.min(dz, Number(c.vars?.facade_thickness_mm) || 16));
      if (pz + dz < rootDepthZ - 0.5) pz = frontPz;
    }
    this.calculated.pos.set(px, py, pz);

    const ux = (-parentSize.x / 2 + px) / UNITS_MM;
    const uy = (-parentSize.y / 2 + py) / UNITS_MM;
    const uz = (-parentSize.z / 2 + pz) / UNITS_MM;

    if (this.userData.is_root) {
      this.userData.own_object.position.set(ux, py / UNITS_MM, uz);
    } else {
      this.position.set(ux, uy, uz);
    }
  }

  _build() {
    super._build();
    this._setupHingeModuleSwingReparent();
  }

  /**
   * ( Door_new.build_hinges): половина на корпусе остаётся в системе
   * координат корпуса/секции; половина на полотне — в вращающейся группе двери.
   * Каталог петли (catalog_31): под модулем две ветки — `hinge_animator` (фасадная
   * половина + ось) и секция с «Петля накладная корпус». Раньше сюда attach-или весь
   * модуль — корпусная часть ошибочно ехала с фасадом. Переносим только узлы
   * CabinetAnimatorNode с id `hinge_animator`; без них — фолбэк attach всего модуля.
   */
  _setupHingeModuleSwingReparent() {
    const kids = this.userData?.cabinet_child_nodes;
    if (!Array.isArray(kids) || kids.length < 2) return;

    let animatorObj = null;
    // Сначала ищем __door_swing двери (rotate+facade), не hinge_animator.
    for (const k of kids) {
      if (!k || !(k instanceof CabinetAnimatorNode)) continue;
      const own = k.userData?.own_object;
      const swing = own?.getObjectByName('__door_swing');
      if (swing?.userData?.cldDoorSwing) {
        animatorObj = swing;
        break;
      }
    }
    if (!animatorObj) {
      for (const k of kids) {
        if (!k || !(k instanceof CabinetAnimatorNode)) continue;
        if (_cldIsHingeCupAnimatorNode(k)) continue;
        const own = k.userData?.own_object;
        const swing = own?.getObjectByName('__door_swing');
        if (swing?.userData?.cldDoorSwing) {
          animatorObj = swing;
          break;
        }
        const ao = k.userData?.animator_object;
        if (ao && ao.userData?.cldDoorSwing) {
          animatorObj = ao;
          break;
        }
      }
    }
    if (!animatorObj) return;

    for (const k of kids) {
      if (!k) continue;
      if (!__cldIsHingeNodeConfig(k.config)) continue;

      const hingeSwingRoots = [];
      k.traverse((obj) => {
        if (!_cldIsHingeCupAnimatorNode(obj)) return;
        hingeSwingRoots.push(obj);
      });

      if (hingeSwingRoots.length) {
        for (const sub of hingeSwingRoots) {
          if (sub.parent !== animatorObj) animatorObj.attach(sub);
          // Реф: внутри уже вращающейся двери внутренняя ось петли (deg=90 ly)
          // НЕ должна крутиться повторно — иначе фасадная половина отлетает на 90°
          // относительно корпусной. Гасим её здесь, после reparent.
          const subAo = sub.userData?.animator_object;
          const sw = subAo?.userData?.cldDoorSwing;
          if (sw) {
            sw.syncBulkOpen = false;
            sw.isOpen = false;
            sw.targetAngle = 0;
            sw.currentAngle = 0;
            if (sw.axis === 'y') subAo.rotation.y = 0;
            else if (sw.axis === 'x') subAo.rotation.x = 0;
            else if (sw.axis === 'z') subAo.rotation.z = 0;
          }
        }
      } else {
        if (k.parent === animatorObj) continue;
        animatorObj.attach(k);
      }
    }
  }
}

/**
 * : CabinetFillSection — наполняемая секция.
 * Отличия от обычной CabinetSection:
 *  - `_before_params`: автогенерация `section_key` (если не задан),
 *    и при `spec.replace=1` оставляем только последний `module`-ребёнок
 *    (старые варианты «заполнения» вытесняются новым).
 *  - drag-area (`show_drag_area` / `hide_drag_area`) — UI наполнения,
 *    в превью без режима редактирования он не нужен и не реализуется.
 *  - `_build_sizes` / `_after_build` в рефе пустые: подписи размеров и события
 *    on_after_build для fill_section не вызываются. Эту тишину достигаем тем,
 *    что не переопределяем эти методы — наша база и так не строит размеры внутри
 *    секции, а событие on_after_build безопасно (если не задано, не вызывается).
 */
/** Реф: class Module extends CabinetSection — каталожный module, подсветка при выборе как у секции. */
class CatalogModuleNode extends CabinetSectionNode {}

class CabinetFillSectionNode extends CabinetSectionNode {
  _before_params(params) {
    super._before_params(params);
    if (!params.type) params.type = 'fill_section';
    if (!params.section_key) {
      params.section_key = String(Date.now()) + Math.random().toString(36).slice(2, 11);
    }
    // Реф: spec.replace + несколько `module`-детей → оставляем только последний.
    // Списки `wall` / `section` / `facade` остаются нетронутыми (как в рефе фильтр
    // применяется только к `module`).
    const spec = params.spec;
    const replace = !!(spec && (spec.replace === 1 || spec.replace === '1' || spec.replace === true));
    if (replace && Array.isArray(params.children) && params.children.length > 0) {
      const moduleIndices = [];
      for (let i = 0; i < params.children.length; i++) {
        const ch = params.children[i];
        if (ch && String(ch.type || '').toLowerCase() === 'module') moduleIndices.push(i);
      }
      if (moduleIndices.length > 1) {
        const keepIdx = moduleIndices[moduleIndices.length - 1];
        params.children = params.children.filter(
          (ch, idx) => !ch || String(ch.type || '').toLowerCase() !== 'module' || idx === keepIdx
        );
      }
    }
  }
}

/**
 * : load_templates — для каждого модуля
 * walk_params_tree обходит поддерево и для каждого узла type === 'section' |
 * 'fill_section' с непустым `section_key` подставляет `spec.fill_content[key].children`
 * в начало `children` (unshift), один раз (`fill_content_expanded=1`).
 * Этот хелпер делает то же на чистом JSON-уровне, до создания Node-узлов.
 */
function __cldExpandFillContent(treeArr, fillContent) {
  if (!Array.isArray(treeArr) || treeArr.length === 0) return;
  if (!fillContent || typeof fillContent !== 'object') return;
  if (!Object.keys(fillContent).length) return;
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    const t = String(node.type || '').toLowerCase();
    const key = node.section_key;
    if ((t === 'section' || t === 'fill_section') && key) {
      const entry = fillContent[key];
      const injected = entry && Array.isArray(entry.children) ? entry.children : null;
      if (injected && injected.length) {
        if (!Array.isArray(node.children)) node.children = [];
        let copy;
        try { copy = JSON.parse(JSON.stringify(injected)); } catch (_) { copy = injected.slice(); }
        node.children.unshift(...copy);
      }
    }
    if (Array.isArray(node.children)) node.children.forEach(walk);
  };
  treeArr.forEach(walk);
}

class CabinetWallNode extends CabinetNode {
  _build_size() {
    const p = this.config;
    const c = this.calculated.c_object;
    const ctx = {
      sizes: {
        x: c.parent_size?.x ?? c.root_size?.x ?? p.size.x,
        y: c.parent_size?.y ?? c.root_size?.y ?? p.size.y,
        z: c.parent_size?.z ?? c.root_size?.z ?? p.size.z,
      },
      vars: c.vars || {},
      materials: c.materials || {},
    };
    
    // Толщина: сначала из группы материала конкретной детали, иначе vars._wt, иначе 16мм.
    const groupKey = p.material_group || p.materialGroup || p.spec?.material_group;
    let groupThickness =
      groupKey && ctx.materials && ctx.materials[groupKey] && ctx.materials[groupKey].thickness != null
        ? Number(ctx.materials[groupKey].thickness)
        : null;
    // Fallback для g1 если payload не передал толщину (задняя стенка ЛХДФ всегда 3мм)
    if (!Number.isFinite(groupThickness) && groupKey === 'g1') groupThickness = 3;
    // g2 (фасады) — без хардкода, используем vars._wt (16 или выбор пользователя)
    const thickness = (Number.isFinite(groupThickness) ? groupThickness : null) ?? (Number(ctx.vars._wt) || 16);
    if (groupKey === 'g1' && window.__CLD_DEBUG) {
      console.log('[CLD][thickness] g1 толщина', { groupThickness, finalThickness: thickness });
    }
    
    // Референс: вычисляем базовые размеры из шаблона
    const templateSizeX = evalExpr(p.size.x, ctx);
    const templateSizeY = evalExpr(p.size.y, ctx);
    const templateSizeZ = evalExpr(p.size.z, ctx);
    
    // Референс: получаем orientation из spec
    const orientation = normalizeOrientation(p.spec?.orientation);
    
    // еренс: пересчёт размеров на основе orientation (:103674-103683)
    let sizeX, sizeY, sizeZ;
    switch (orientation) {
      case 'h': // horizontal
        sizeX = templateSizeX;
        sizeY = thickness;
        sizeZ = templateSizeZ;
        break;
      case 'v': // vertical
        sizeX = thickness;
        sizeY = templateSizeY;
        sizeZ = templateSizeZ;
        break;
      case 'f': // frontal
      default:
        sizeX = templateSizeX;
        sizeY = templateSizeY;
        sizeZ = thickness;
        break;
    }
    
    // Референс: сохраняем size (для геометрии) и u_size
    this.calculated.size.set(sizeX, sizeY, sizeZ);
    this.calculated.u_size.set(mmToU(sizeX), mmToU(sizeY), mmToU(sizeZ));

    // Реф wall real_size (part19 / main ~103663): face-оси для паза/траектории.
    // v: x=size.z, y=size.y, z=size.x(толщина); h: x=size.x, y=size.z, z=size.y; f: = size.
    const real = new THREE.Vector3();
    switch (orientation) {
      case 'h':
        real.set(sizeX, sizeZ, sizeY);
        break;
      case 'v':
        real.set(sizeZ, sizeY, sizeX);
        break;
      default:
        real.set(sizeX, sizeY, sizeZ);
        break;
    }
    this.calculated.real_size = real;
    this.calculated.u_real_size = real.clone().divideScalar(UNITS_MM);

    this.userData.__cldNominalThicknessMm = thickness;
    this.userData.__cldPanelOrientation = orientation;
    if (orientation === 'v') {
      this.userData.__cldCfrnSizeMm = { x: sizeX, y: sizeY, z: sizeZ };
    } else if (orientation === 'h') {
      this.userData.__cldCfrnSizeMm = { x: sizeX, y: sizeY, z: sizeZ };
    } else {
      this.userData.__cldCfrnSizeMm = { x: sizeX, y: sizeY, z: sizeZ };
    }

    if (__cldIsHingeDebugEnabled() && __cldIsHingeLikeNode(p)) {
      console.info('[CLD][hinge][size]', {
        type: p.type || this.constructor.name,
        name: p.name || '',
        id: p.id || '',
        sizeExpr: p.size,
        sizeMm: { x: sizeX, y: sizeY, z: sizeZ },
        parentSizeMm: { x: parentSize.x, y: parentSize.y, z: parentSize.z },
        sectionSizeMm: { x: sectionSize.x, y: sectionSize.y, z: sectionSize.z },
        path: this.userData?.path || '',
      });
    }
  }

  /** Референс: size_without_butts — возвращает core-размеры и сдвиг панели при наличии кромок */
  _getEdgeInsets() {
    const p = this.config || {};
    const edges = p.edges || {};
    const orientation = normalizeOrientation(p.spec?.orientation);
    const uSize = this.calculated.u_size || new THREE.Vector3();
    let inset1 = 0, inset2 = 0, inset3 = 0, inset4 = 0;
    for (let i = 1; i <= 4; i++) {
      const ed = edges[i] || {};
      if (ed.enabled && (ed.decor_id || ed.decor_name || ed.edge_id || ed.edge_name)) {
        const et = (typeof ed.thickness === 'number' ? ed.thickness : parseFloat(ed.thickness || '0.8')) || 0.8;
        const u = mmToU(et);
        if (i === 1) inset1 = u;
        else if (i === 2) inset2 = u;
        else if (i === 3) inset3 = u;
        else inset4 = u;
      }
    }
    if (inset1 === 0 && inset2 === 0 && inset3 === 0 && inset4 === 0) return null;
    const w = uSize.x, h = uSize.y, d = uSize.z;
    let cw, ch, cd, ox, oy, oz;
    // Панель: от -full/2+inset до +full/2-inset, центр = (inset_min - inset_max)/2
    if (orientation === 'v') {
      cw = w;
      ch = Math.max(0.001, h - inset1 - inset2);
      cd = Math.max(0.001, d - inset3 - inset4);
      ox = 0;
      oy = (inset1 - inset2) / 2;
      oz = (inset3 - inset4) / 2;
    } else if (orientation === 'h') {
      cw = Math.max(0.001, w - inset3 - inset4);
      ch = h;
      cd = Math.max(0.001, d - inset1 - inset2);
      ox = (inset3 - inset4) / 2;
      oy = 0;
      oz = (inset1 - inset2) / 2;
    } else {
      cw = Math.max(0.001, w - inset3 - inset4);
      ch = Math.max(0.001, h - inset1 - inset2);
      cd = d;
      ox = (inset3 - inset4) / 2;
      oy = (inset1 - inset2) / 2;
      oz = 0;
    }
    return { coreW: cw, coreH: ch, coreD: cd, offsetX: ox, offsetY: oy, offsetZ: oz };
  }


  _build_spec() {
    // Object_wall  — make_cube(w,h,d, create_material(D))
    const uSize = this.calculated.u_size || new THREE.Vector3();
    if (!uSize.x || !uSize.y || !uSize.z) return;

    const insets = this._getEdgeInsets();
    const cw = insets ? insets.coreW : uSize.x;
    const ch = insets ? insets.coreH : uSize.y;
    const cd = insets ? insets.coreD : uSize.z;
    const ox = insets ? insets.offsetX : 0;
    const oy = insets ? insets.offsetY : 0;
    const oz = insets ? insets.offsetZ : 0;

    const p = this.config || {};
    const groupKey = p.material_group || p.materialGroup || p.spec?.material_group || 'g0';
    const groupMat = this.userData.root?.userData?.computed?.materials?.[groupKey] || {};
    const texUrl = __cldResolveTextureUrlFromMaterialRef(p, groupMat);
    const matKey = p.material_key || p.materialKey || groupMat?.material?.key || 'material_2';
    const matId = p.material_id ?? p.materialId ?? groupMat?.material?.id;
    const sxMm = Math.max(1, uToMm(cw));
    const szMm = Math.max(1, uToMm(cd));

    const mat = create_material_for_wall();

    const applyCatalogMaps = async (catalogItem) => {
      if (!catalogItem) return;
      __cldApplyCatalogPbrToMaterial(mat, catalogItem);
      const normUrl = (catalogItem.normalMap || '').toString().trim();
      const roughUrl = (catalogItem.roughnessMap || '').toString().trim();
      const normalTex = normUrl ? await __cldEnsureTexture(normUrl) : null;
      const roughTex = roughUrl ? await __cldEnsureTexture(roughUrl) : null;
      if (normalTex) {
        const n = normalTex.clone();
        n.needsUpdate = true;
        mat.normalMap = n;
      }
      if (roughTex) {
        const r = roughTex.clone();
        r.needsUpdate = true;
        mat.roughnessMap = r;
      }
      const colorStr = (catalogItem.color || '').toString().trim();
      if (!mat.map && colorStr && /^#([0-9a-fA-F]{6})$/.test(colorStr)) {
        mat.color.set(colorStr);
      }
      mat.needsUpdate = true;
    };

    const applyTexture = (tex, catalogItem) => {
      if (!tex) return;
      const localTex = tex.clone();
      localTex.needsUpdate = true;
      mat.color.setHex(0xffffff);
      if (catalogItem) {
        __cldApplyTextureRepeatFromCatalog(localTex, catalogItem, sxMm, szMm);
      } else {
        localTex.repeat.set(Math.max(1, sxMm / 500), Math.max(1, szMm / 500));
      }
      if (__cldIsMaterialRotated(p)) {
        localTex.center.set(0.5, 0.5);
        localTex.rotation = Math.PI / 2;
      } else {
        localTex.rotation = 0;
      }
      mat.map = localTex;
      if (!catalogItem) {
        mat.transparent = false;
        mat.opacity = 1;
      }
      mat.needsUpdate = true;
    };

    const runMaterialVisuals = async () => {
      await __cldEnsureMaterialItemsByKey().catch(() => {});
      const catalogItem = __cldFindCatalogItemByKeyId(matKey, matId);
      if (catalogItem) __cldApplyCatalogPbrToMaterial(mat, catalogItem);
      const resolved = __cldResolveTextureUrlFromMaterialRef(p, groupMat);
      if (resolved) {
        const cached = __cldGetTexture(resolved);
        if (cached) applyTexture(cached, catalogItem);
        else await __cldEnsureTexture(resolved).then((t) => applyTexture(t, catalogItem));
      } else if (catalogItem) {
        const colorStr = (catalogItem.color || '').toString().trim();
        if (colorStr && /^#([0-9a-fA-F]{6})$/.test(colorStr)) mat.color.set(colorStr);
      }
      await applyCatalogMaps(catalogItem);
    };

    runMaterialVisuals();
    if (
      (!texUrl || !__cldGetTexture(texUrl)) &&
      ((p.material_id != null && p.material_id !== '') || (groupMat?.material?.id != null && groupMat?.material?.id !== ''))
    ) {
      __cldEnsureMaterialItemsByKey().then(() => runMaterialVisuals()).catch(() => {});
    }
    const mesh = make_cube(cw, ch, cd, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(ox, oy, oz);
    mesh.name = p.name || 'wall';
    this.userData.own_object.add(mesh);

    const geom = mesh.geometry;
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geom),
      new THREE.LineBasicMaterial({
        color: 0x333333,
        depthTest: false,
      })
    );
    edges.position.set(ox, oy, oz);
    edges.userData.isEdgesLines = true;
    this.userData.own_object.add(edges);
    this.userData.edges_lines = edges;

    this._build_edges();
  }
  
  _build_edges() {
    // Референс: удаляем старые номера кромок и edge visuals
    const oldLabels = [];
    const scan = (g) => { if (g) g.traverse((c) => { if (c.userData?.isEdgeNumber) oldLabels.push(c); }); };
    scan(this.userData.helpers);
    scan(this.userData.helpers_edges);
    scan(this.userData.own_object);
    oldLabels.forEach((label) => {
      if (label.parent) label.parent.remove(label);
      if (label.element && label.element.parentNode) label.element.parentNode.removeChild(label.element);
    });
    
    const oldEdges = [];
    const scanEdges = (g) => { if (g) g.traverse((c) => { if (c.userData?.isEdge) oldEdges.push(c); }); };
    scanEdges(this.userData.helpers);
    scanEdges(this.userData.helpers_edges);
    scanEdges(this.userData.own_object);
    oldEdges.forEach((edge) => {
      if (edge.parent) edge.parent.remove(edge);
      if (edge.geometry) edge.geometry.dispose();
      if (edge.material) edge.material.dispose();
    });
    
    const p = this.config || {};
    const edges = p.edges || {};
    const hasAnyEdge = Object.keys(edges).some(k => edges[k]?.enabled);
    const edgeNumbering = p.edge_numbering !== false && p.spec?.show_index !== false;
    if (!hasAnyEdge && !edgeNumbering) return;

    const uSize = this.calculated.u_size || new THREE.Vector3();
    if (!uSize.x || !uSize.y || !uSize.z) return;
    
    const orientation = normalizeOrientation(p.spec?.orientation);
    const w = uSize.x;
    const h = uSize.y;
    const d = uSize.z;
    // Референс: панель уменьшена на толщину кромок — полоски стыкуются flush, без overlap
    const edgeInset = 0;

    for (let edgeNum = 1; edgeNum <= 4; edgeNum++) {
      const edgeData = edges[edgeNum] || {};
      const isEnabled = !!edgeData.enabled;
      // Референс: полоска кромки только если выбрана конкретная кромка через "Выбрать"
      const hasSelectedDecor = !!(edgeData.decor_id || edgeData.decor_name || edgeData.edge_id || edgeData.edge_name);

      // 1) Видимая кромка (полоска) — внутри секции, на срезе торца
      if (isEnabled && hasSelectedDecor) {
        // Толщина кромки в миллиметрах -> в юниты сцены, как в рефе
        const edgeMm = (typeof edgeData.thickness === 'number'
          ? edgeData.thickness
          : parseFloat(edgeData.thickness || '0.8')) || 0.8;
        const edgeThickness = Math.max(mmToU(edgeMm), 0.002);
        const useRounded = edgeMm > 0 && edgeMm <= 2 && !!RoundedBoxGeometry;
        const edgeRadius = useRounded ? edgeThickness : 0;
        const edgeGeomThickness = useRounded ? edgeThickness * 2 : edgeThickness;
        const makeEdgeGeom = (tw, th, td) => {
          if (useRounded && RoundedBoxGeometry) {
            try {
              const r = edgeRadius; // требуемый радиус
              return new RoundedBoxGeometry(tw, th, td, 2, Math.max(r, 0.0001));
            } catch (_) {
              return new THREE.BoxGeometry(tw, th, td);
            }
          }
          return new THREE.BoxGeometry(tw, th, td);
        };

        let edgeGeom = null;
        let edgePos = null;

        // Позиционирование: центр полоски ВНУТРИ границы (face - thickness/2 - inset)
        switch (orientation) {
          case 'v': // vertical
            if (edgeNum === 1) { // Bottom edge
              edgeGeom = makeEdgeGeom(w, edgeGeomThickness, d);
              edgePos = new THREE.Vector3(0, -h / 2 + edgeGeomThickness / 2 + edgeInset, 0);
            } else if (edgeNum === 2) { // Top edge
              edgeGeom = makeEdgeGeom(w, edgeGeomThickness, d);
              edgePos = new THREE.Vector3(0, h / 2 - edgeGeomThickness / 2 - edgeInset, 0);
            } else if (edgeNum === 3) { // Back edge
              edgeGeom = makeEdgeGeom(w, h, edgeGeomThickness);
              edgePos = new THREE.Vector3(0, 0, -d / 2 + edgeGeomThickness / 2 + edgeInset);
            } else if (edgeNum === 4) { // Front edge
              edgeGeom = makeEdgeGeom(w, h, edgeGeomThickness);
              edgePos = new THREE.Vector3(0, 0, d / 2 - edgeGeomThickness / 2 - edgeInset);
            }
            break;
          case 'h': // horizontal
            // Горизонтальная деталь (полка/дно/крышка): кромка по периметру в плоскости XZ,
            // а не "верх/низ" (иначе номера 1/2 схлопываются в центре на тонких деталях).
            if (edgeNum === 1) { // Back edge
              edgeGeom = makeEdgeGeom(w, h, edgeGeomThickness);
              edgePos = new THREE.Vector3(0, 0, -d / 2 + edgeGeomThickness / 2 + edgeInset);
            } else if (edgeNum === 2) { // Front edge
              edgeGeom = makeEdgeGeom(w, h, edgeGeomThickness);
              edgePos = new THREE.Vector3(0, 0, d / 2 - edgeGeomThickness / 2 - edgeInset);
            } else if (edgeNum === 3) { // Left edge
              edgeGeom = makeEdgeGeom(edgeGeomThickness, h, d);
              edgePos = new THREE.Vector3(-w / 2 + edgeGeomThickness / 2 + edgeInset, 0, 0);
            } else if (edgeNum === 4) { // Right edge
              edgeGeom = makeEdgeGeom(edgeGeomThickness, h, d);
              edgePos = new THREE.Vector3(w / 2 - edgeGeomThickness / 2 - edgeInset, 0, 0);
            }
            break;
          case 'f': // frontal
          default:
            if (edgeNum === 1) { // Bottom edge
              edgeGeom = makeEdgeGeom(w, edgeGeomThickness, d);
              edgePos = new THREE.Vector3(0, -h / 2 + edgeGeomThickness / 2 + edgeInset, 0);
            } else if (edgeNum === 2) { // Top edge
              edgeGeom = makeEdgeGeom(w, edgeGeomThickness, d);
              edgePos = new THREE.Vector3(0, h / 2 - edgeGeomThickness / 2 - edgeInset, 0);
            } else if (edgeNum === 3) { // Left edge
              edgeGeom = makeEdgeGeom(edgeGeomThickness, h, d);
              edgePos = new THREE.Vector3(-w / 2 + edgeGeomThickness / 2 + edgeInset, 0, 0);
            } else if (edgeNum === 4) { // Right edge
              edgeGeom = makeEdgeGeom(edgeGeomThickness, h, d);
              edgePos = new THREE.Vector3(w / 2 - edgeGeomThickness / 2 - edgeInset, 0, 0);
            }
            break;
        }

        if (edgeGeom && edgePos) {
          let edgeColor = 0xffffff;
          if (typeof edgeData.color === 'string') {
            const c = edgeData.color.trim();
            const m = /^#([0-9a-fA-F]{6})$/.exec(c);
            if (m) edgeColor = parseInt(m[1], 16);
          }
          const edgeTextureUrl = edgeData.texture || edgeData.icon || '';
          const edgeMat = new THREE.MeshStandardMaterial({
            color: edgeColor,
            roughness: __cldNum01(edgeData.roughness, 0.8),
            metalness: __cldNum01(edgeData.metalness, 0),
            transparent: !!(edgeData.transparent || edgeData.transparency),
            opacity:
              edgeData.opacity != null && Number.isFinite(Number(edgeData.opacity))
                ? Math.max(0, Math.min(1, Number(edgeData.opacity)))
                : 1,
            side: edgeData.oneSided || edgeData.one_side ? THREE.FrontSide : THREE.DoubleSide,
            depthTest: true,
            depthWrite: true,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
          });
          const edgeRepeatItem = {
            realTextureWidth: edgeData.realTextureWidth || edgeData.real_texture_width || 256,
            realTextureHeight: edgeData.realTextureHeight || edgeData.real_texture_height || 256,
            stretchWidth: edgeData.stretchWidth || edgeData.stretch_width,
            stretchHeight: edgeData.stretchHeight || edgeData.stretch_height,
          };
          const applyEdgeMaps = (tex, normalTex, roughTex) => {
            if (tex) {
              const localTex = tex.clone();
              localTex.needsUpdate = true;
              const sxMm = Math.max(1, uToMm(w));
              const syMm = Math.max(1, uToMm(h));
              if (edgeData.stretchWidth != null || edgeData.realTextureWidth != null) {
                __cldApplyTextureRepeatFromCatalog(localTex, edgeRepeatItem, sxMm, syMm);
              } else {
                localTex.repeat.set(Math.max(1, sxMm / 500), Math.max(1, syMm / 500));
              }
              edgeMat.map = localTex;
              edgeMat.color.set(0xffffff);
            }
            if (normalTex) {
              const n = normalTex.clone();
              n.needsUpdate = true;
              edgeMat.normalMap = n;
            }
            if (roughTex) {
              const r = roughTex.clone();
              r.needsUpdate = true;
              edgeMat.roughnessMap = r;
            }
            edgeMat.needsUpdate = true;
          };
          if (edgeTextureUrl) {
            const normalUrl = (edgeData.normalMap || '').toString().trim();
            const roughUrl = (edgeData.roughnessMap || '').toString().trim();
            const texP = __cldEnsureTexture(edgeTextureUrl);
            const normP = normalUrl ? __cldEnsureTexture(normalUrl) : Promise.resolve(null);
            const roughP = roughUrl ? __cldEnsureTexture(roughUrl) : Promise.resolve(null);
            Promise.all([texP, normP, roughP]).then(([tex, normalTex, roughTex]) => {
              applyEdgeMaps(tex, normalTex, roughTex);
            });
          }
          const edgeMesh = new THREE.Mesh(edgeGeom, edgeMat);
          edgeMesh.position.copy(edgePos);
          edgeMesh.renderOrder = 10;
          edgeMesh.userData.isEdge = true;
          edgeMesh.userData.edgeNumber = edgeNum;
          this.userData.own_object.add(edgeMesh);
        }
      }

      // 2) Номер кромки — только если edgeNumbering включен
      if (!edgeNumbering) continue;
      const labelDiv = document.createElement('div');
      labelDiv.textContent = String(edgeNum);
      if (isEnabled) {
        labelDiv.style.color = '#21ba45';
        labelDiv.style.border = '2px solid #21ba45';
      } else {
        labelDiv.style.color = '#111111';
        labelDiv.style.border = '2px solid #555555';
      }
      labelDiv.style.fontSize = '16px';
      labelDiv.style.fontWeight = 'bold';
      labelDiv.style.textAlign = 'center';
      labelDiv.style.background = 'rgba(255, 255, 255, 0.9)';
      labelDiv.style.borderRadius = '50%';
      labelDiv.style.width = '24px';
      labelDiv.style.height = '24px';
      labelDiv.style.lineHeight = '24px';
      labelDiv.style.pointerEvents = 'none';
      
      const label = new CSS2DObject(labelDiv);
      const labelOffset = 0.02;
      if (orientation === 'h') {
        // Для горизонтали — номера по периметру (XZ)
        if (edgeNum === 1) label.position.set(0, 0, -d / 2 - labelOffset); // back
        else if (edgeNum === 2) label.position.set(0, 0, d / 2 + labelOffset); // front
        else if (edgeNum === 3) label.position.set(-w / 2 - labelOffset, 0, 0); // left
        else if (edgeNum === 4) label.position.set(w / 2 + labelOffset, 0, 0); // right
      } else {
        if (edgeNum === 1) {
          label.position.set(0, -h / 2 - labelOffset, 0);
        } else if (edgeNum === 2) {
          label.position.set(0, h / 2 + labelOffset, 0);
        } else if (edgeNum === 3) {
          if (orientation === 'v') label.position.set(0, 0, -d / 2 - labelOffset);
          else label.position.set(-w / 2 - labelOffset, 0, 0);
        } else if (edgeNum === 4) {
          if (orientation === 'v') label.position.set(0, 0, d / 2 + labelOffset);
          else label.position.set(w / 2 + labelOffset, 0, 0);
        }
      }
      label.userData.isEdgeNumber = true;
      label.userData.edgeNumber = edgeNum;
      label.layers.set(EDGE_LABELS_LAYER);
      // Референс: helpers_edges НЕ добавляем в сцену при создании — только при выборе детали.
      // Иначе CSS2DRenderer обходит их и управляет element.style.display сам, расходясь с нашей логикой.
      if (!this.userData.helpers_edges) {
        this.userData.helpers_edges = new THREE.Group();
        this.userData.helpers_edges.name = '__helpers_edges';
        // Не добавляем в helpers — добавляем только в _show_helpers_edges
      }
      this.userData.helpers_edges.add(label);
    }
  }
}

// еренс: — _show_helpers_edges / _hide_helpers_edges только для деталей
// Референс: remove(helpers_edges) — объект физически убирается из дерева сцены.
// CSS2DRenderer не обходит helpers_edges, когда их нет в дереве. У нас visible=false оставлял объект в сцене.
CabinetWallNode.prototype._show_helpers_edges = function() {
  const edges = this.userData.helpers_edges;
  if (!edges) return;
  const parent = this.userData.helpers;
  if (parent && !edges.parent) parent.add(edges);
};

CabinetWallNode.prototype._hide_helpers_edges = function() {
  const edges = this.userData.helpers_edges;
  if (!edges) return;
  // Референс: remove() — объект убирается из дерева. Плюс явно удаляем DOM-элементы
  // (CSS2DRenderer может оставлять их в контейнере после remove из сцены).
  edges.traverse((obj) => {
    if (obj.element && obj.element.parentNode) obj.element.parentNode.removeChild(obj.element);
  });
  if (edges.parent) edges.parent.remove(edges);
};

CabinetWallNode.prototype._hide_helpers = function() {
  if (this.userData.helpers) this.userData.helpers.visible = false;
  this._hide_helpers_edges && this._hide_helpers_edges();
};

// Фасад (цоколь, топ) — фронтальная панель
class CabinetFacadeNode extends CabinetNode {
  _build_size() {
    const p = this.config;
    const c = this.calculated.c_object;
    const ctx = {
      sizes: {
        x: c.parent_size?.x ?? c.root_size?.x ?? p.size.x,
        y: c.parent_size?.y ?? c.root_size?.y ?? p.size.y,
        z: c.parent_size?.z ?? c.root_size?.z ?? p.size.z,
      },
      vars: c.vars || {},
      materials: c.materials || {},
    };
    
    // Толщина фасада: всегда 16мм (как в EmbeddedClodisBuilder)
    const thickness = 16;
    
    // Вычисляем размеры из шаблона
    const templateSizeX = evalExpr(p.size.x, ctx);
    const templateSizeY = evalExpr(p.size.y, ctx);
    const templateSizeZ = evalExpr(p.size.z, ctx);
    
    // Проверяем поворот: для топа rot.x = 90
    const rotX = parseFloat(p.rot?.x || '0');
    const isTop = rotX === 90;
    
    let sizeX, sizeY, sizeZ;
    if (isTop) {
      // Топ: после поворота на 90° вокруг X
      // size.x = ширина (не меняется)
      // size.y = s:z+16 = глубина панели (после поворота станет depth)
      // size.z = s:z = высота панели (после поворота станет height, но используем thickness)
      // Геометрия ДО поворота: BoxGeometry(size.x, size.y, thickness)
      sizeX = templateSizeX;
      sizeY = templateSizeY; // s:z+16
      sizeZ = thickness; // 16мм
    } else {
      // Вертикальный фасад (цоколь): size.x = ширина, size.y = высота, толщина = 16мм
      sizeX = templateSizeX;
      sizeY = templateSizeY;
      sizeZ = thickness;
    }
    
    this.calculated.size.set(sizeX, sizeY, sizeZ);
    this.calculated.u_size.set(mmToU(sizeX), mmToU(sizeY), mmToU(sizeZ));
    // Реф: frontal real_size = size
    this.calculated.real_size = new THREE.Vector3(sizeX, sizeY, sizeZ);
    this.calculated.u_real_size = this.calculated.real_size.clone().divideScalar(UNITS_MM);

    // Фасад всегда frontal — иначе стыки L/R мапятся как у стойки v (перед/зад).
    if (!p.spec || typeof p.spec !== 'object') p.spec = {};
    p.spec.orientation = 'f';
    const orientation = 'f';
    this.userData.__cldPanelOrientation = orientation;
    this.userData.__cldNominalThicknessMm = thickness;
    this.userData.isFacade = true;
  }

  _build_spec() {
    const uSize = this.calculated.u_size || new THREE.Vector3();
    if (!uSize.x || !uSize.y || !uSize.z) return;

    const p = this.config || {};
    if (__cldIsHingeCatalogDrillPlaceholderNode(p, this.userData.parent)) {
      return;
    }
    const rotX = parseFloat(p.rot?.x || '0');
    const isTop = rotX === 90;

    // Материал фасада: группа g2 / material_group + icon / spec.material (как в карточке).
    const groupKey =
      p.material_group ||
      p.materialGroup ||
      p.spec?.material_group ||
      p.spec?.material?.group ||
      'g2';
    const groupMat = this.userData.root?.userData?.computed?.materials?.[groupKey] || {};
    const texUrl = __cldResolveTextureUrlFromMaterialRef(p, groupMat);
    const matKey =
      p.material_key ||
      p.materialKey ||
      p.spec?.material?.key ||
      groupMat?.material?.key ||
      'material_2';
    const matId =
      p.material_id ?? p.materialId ?? p.spec?.material?.id ?? groupMat?.material?.id;
    const sxMm = Math.max(1, uToMm(uSize.x));
    const szMm = Math.max(1, uToMm(uSize.z));

    const mat = new THREE.MeshStandardMaterial({
      color: 0xaaa090,
      metalness: 0,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });

    const applyCatalogMaps = async (catalogItem) => {
      if (!catalogItem) return;
      __cldApplyCatalogPbrToMaterial(mat, catalogItem);
      const normUrl = (catalogItem.normalMap || '').toString().trim();
      const roughUrl = (catalogItem.roughnessMap || '').toString().trim();
      const normalTex = normUrl ? await __cldEnsureTexture(normUrl) : null;
      const roughTex = roughUrl ? await __cldEnsureTexture(roughUrl) : null;
      if (normalTex) {
        const n = normalTex.clone();
        n.needsUpdate = true;
        mat.normalMap = n;
      }
      if (roughTex) {
        const r = roughTex.clone();
        r.needsUpdate = true;
        mat.roughnessMap = r;
      }
      const colorStr = (catalogItem.color || '').toString().trim();
      if (!mat.map && colorStr && /^#([0-9a-fA-F]{6})$/.test(colorStr)) {
        mat.color.set(colorStr);
      }
      mat.needsUpdate = true;
    };

    const applyTexture = (tex, catalogItem) => {
      if (!tex) return;
      const localTex = tex.clone();
      localTex.needsUpdate = true;
      mat.color.setHex(0xffffff);
      if (catalogItem) __cldApplyTextureRepeatFromCatalog(localTex, catalogItem, sxMm, szMm);
      else localTex.repeat.set(Math.max(1, sxMm / 500), Math.max(1, szMm / 500));
      if (__cldIsMaterialRotated(p)) {
        localTex.center.set(0.5, 0.5);
        localTex.rotation = Math.PI / 2;
      } else {
        localTex.rotation = 0;
      }
      mat.map = localTex;
      mat.needsUpdate = true;
    };

    const runFacadeMaterialVisuals = async () => {
      await __cldEnsureMaterialItemsByKey().catch(() => {});
      const catalogItem = __cldFindCatalogItemByKeyId(matKey, matId);
      const iconDriven = !!(p.material_icon || p.materialIcon);
      // Не тянуть color/opacity из catalog id, если на узле уже задан material_icon
      // (иначе id=8 «Белый» затирает «Сатин» с иконки до белого на белом фоне).
      if (catalogItem && !iconDriven) __cldApplyCatalogPbrToMaterial(mat, catalogItem);
      else if (catalogItem && iconDriven) {
        mat.roughness = __cldNum01(catalogItem.roughness, mat.roughness ?? 0.8);
        mat.metalness = __cldNum01(catalogItem.metalness, mat.metalness ?? 0);
      }
      const resolved = __cldResolveTextureUrlFromMaterialRef(p, groupMat);
      if (resolved) {
        const cached = __cldGetTexture(resolved);
        if (cached) applyTexture(cached, iconDriven ? null : catalogItem);
        else await __cldEnsureTexture(resolved).then((t) => applyTexture(t, iconDriven ? null : catalogItem));
      } else if (catalogItem && !iconDriven) {
        const colorStr = (catalogItem.color || '').toString().trim();
        if (colorStr && /^#([0-9a-fA-F]{6})$/.test(colorStr)) mat.color.set(colorStr);
      }
      if (!iconDriven) await applyCatalogMaps(catalogItem);
    };

    runFacadeMaterialVisuals();
    if (
      (!texUrl || !__cldGetTexture(texUrl)) &&
      ((p.material_id != null && p.material_id !== '') || (groupMat?.material?.id != null && groupMat?.material?.id !== ''))
    ) {
      __cldEnsureMaterialItemsByKey().then(() => runFacadeMaterialVisuals()).catch(() => {});
    }

    const insets = this._getEdgeInsets();
    const cw = insets ? insets.coreW : uSize.x;
    const ch = insets ? insets.coreH : uSize.y;
    const cd = insets ? insets.coreD : uSize.z;
    const ox = insets ? insets.offsetX : 0;
    const oy = insets ? insets.offsetY : 0;
    const oz = insets ? insets.offsetZ : 0;

    const mesh = make_cube(cw, ch, cd, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(ox, oy, oz);
    mesh.name = p.name || 'facade';
    this.userData.own_object.add(mesh);

    const geom = mesh.geometry;
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geom),
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    edges.position.set(ox, oy, oz);
    edges.userData.isEdgesLines = true;
    this.userData.own_object.add(edges);
    this.userData.edges_lines = edges;

    this._build_edges();
  }

  // еренс: CabinetSection._build_direction
  // Референс: direction берется из spec.direction напрямую (строка 3654: x = spec.direction)
  // Преобразование direction в зависимости от parentOrientation делается в _build_pos через switch
  // Этот метод больше не используется в _build_pos, но оставляем для совместимости
  _build_direction() {
    const p = this.config || {};
    return p.spec?.direction || '-z'; // по умолчанию передняя грань
  }

  // pos.z в данных = расстояние от задней стенки (0 = зад, s:z = перед).
  // Используем простую формулу (-parentSize/2 + pos)/UNITS — как в ClodisBuilder (комната),
  // чтобы превью и комната показывали одинаково.
  _build_pos() {
    const p = this.config;
    const c = this.calculated.c_object;
    const parentSize = c.parent_size || new THREE.Vector3();
    const sectionSize = c.parent_size || c.root_size || new THREE.Vector3();
    const ctx = {
      sizes: { x: sectionSize.x, y: sectionSize.y, z: sectionSize.z },
      vars: c.vars || {},
    };

    const px = evalExpr(p.pos?.x ?? 0, ctx);
    const py = evalExpr(p.pos?.y ?? 0, ctx);
    const pz = evalExpr(p.pos?.z ?? 0, ctx);
    this.calculated.pos.set(px, py, pz);

    const ux = (-parentSize.x / 2 + px) / UNITS_MM;
    const uy = (-parentSize.y / 2 + py) / UNITS_MM;
    const uz = (-parentSize.z / 2 + pz) / UNITS_MM;

    this.position.set(ux, uy, uz);
  }

  // Референс: pivot = задняя левая нижняя (-1,-1,-1). В рефе так явно задано в CabinetPath
  // ( 3629–3640): g['pivot'] = { x: -1, y: -1, z: -1 }.
  // При постановке в пустую секцию эта точка совпадает с началом координат секции (0,0,0).
  _build_pivot() {
    const p = this.config || {};
    const size = this.calculated.size || new THREE.Vector3();
    const h = this.userData.own_object;
    if (!h) return;

    const dir = this._build_direction();
    // Таблица: [pivotX, pivotY, pivotZ, sizeForX, sizeForY, sizeForZ].
    // Для '-z' (фасад на передней грани): pivot = задняя левая нижняя = (-1, -1, -1)
    const table = {
      'x': [-1, 0, 0, size.z, size.y, size.x],
      '-x': [1, 0, 0, size.z, size.y, size.x],
      'y': [0, -1, 0, size.x, size.z, size.y],
      '-y': [0, 1, 0, size.x, size.z, size.y],
      'z': [0, 0, -1, size.x, size.y, size.z],
      '-z': [-1, -1, -1, size.x, size.y, size.z], // задняя левая нижняя
      'default': [-1, -1, -1, size.x, size.y, size.z],
    };
    const row = table[dir] || table['default'];
    const [pivotX, pivotY, pivotZ, sizeX, sizeY, sizeZ] = row;

    const px = this._conv_pivot(pivotX, sizeX);
    const py = this._conv_pivot(pivotY, sizeY);
    const pz = this._conv_pivot(pivotZ, sizeZ);

    h.translateX(px / UNITS_MM);
    h.translateY(py / UNITS_MM);
    h.translateZ(pz / UNITS_MM);

    const helpers = this.userData.helpers;
    if (helpers) {
      helpers.position.copy(h.position);
      helpers.rotation.copy(h.rotation);
      helpers.scale.copy(h.scale);
    }
  }

  // ⭐ ВАЖНО: Переопределяем _build() для фасадов, чтобы pivot применялся ДО поворота
  // Референс: EmbeddedClodisBuilder.applyTransform применяет pivot перед rotation
  _build() {
    this._resetSelf();
    this._resetOwn();
    this.calculateDimensions();
    this.computePosition();
    this._build_scale();
    // ⭐ КРИТИЧНО: pivot ДО поворота для правильного позиционирования топа
    this.calculatePivot();
    this._build_rot();
    this._build_c_rot();
    if (this.config.active) this.buildGeometry();
    this.buildChildren();
    this._build_accessories();
    this._setupHingeDoorSwingIfNeeded();
  }

  /** Распашной фасад с петлёй: группа вращения вокруг оси (hingesOffset как в Clodis). */
  _setupHingeDoorSwingIfNeeded() {
    const accs = this.config?.accessories;
    if (!Array.isArray(accs) || !accs.length) return;
    const acc = accs.find(
      (a) =>
        a &&
        (/петл|hinge/i.test(String(a.name || '')) ||
          /hinge/i.test(String(a.id || '')) ||
          /hinge/i.test(String(a.sku || a.article || '')))
    );
    if (!acc) return;

    const own = this.userData.own_object;
    if (!own || own.getObjectByName('__door_swing')) return;

    const sz = this.calculated.size;
    const uu = this.calculated.u_size;
    if (!sz || sz.x <= 0 || !uu) return;

    const opening = this._resolveHingeOpening(acc);
    const isTop = opening === 'top' || opening === 'simple_top';
    const isBottom = opening === 'bottom' || opening === 'simple_bottom';
    const isLTR = opening !== 'right' && opening !== 'rtl';

    const hoMm = Number(acc.hingesOffset);
    const hoU = mmToU(Number.isFinite(hoMm) && hoMm > 0 ? hoMm : 16);
    const uw = uu.x;
    const uh = uu.y;

    let pivotX = 0;
    let pivotY = 0;
    let pivotZ = 0;
    let axis = 'y';
    let maxAngle = isLTR ? Math.PI / 2 : -Math.PI / 2;

    if (isTop) {
      axis = 'x';
      maxAngle = -Math.PI / 2 * 0.92;
      pivotY = uh / 2 - hoU / 2;
    } else if (isBottom) {
      axis = 'x';
      maxAngle = Math.PI / 2 * 0.92;
      pivotY = -uh / 2 + hoU / 2;
    } else {
      pivotX = isLTR ? -uw / 2 + hoU / 2 : uw / 2 - hoU / 2;
    }

    const swing = new THREE.Group();
    swing.name = '__door_swing';
    swing.userData.cldDoorSwing = {
      axis,
      maxAngle,
      isOpen: false,
      currentAngle: 0,
      targetAngle: 0,
    };

    swing.position.set(pivotX, pivotY, pivotZ);

    const ch = [...own.children];
    ch.forEach((c) => {
      own.remove(c);
      c.position.x -= pivotX;
      c.position.y -= pivotY;
      c.position.z -= pivotZ;
      swing.add(c);
    });
    own.add(swing);

    swing.traverse((o) => {
      if (o.isMesh && !o.userData?.isAccessory) {
        o.userData.cldDoorPick = true;
      }
    });

    _cldIframeDoorSwingGroups.push(swing);
  }
}

CabinetFacadeNode.prototype._getEdgeInsets = CabinetWallNode.prototype._getEdgeInsets;
CabinetFacadeNode.prototype._build_edges = CabinetWallNode.prototype._build_edges;

CabinetFacadeNode.prototype._show_helpers_edges = CabinetWallNode.prototype._show_helpers_edges;
CabinetFacadeNode.prototype._hide_helpers_edges = CabinetWallNode.prototype._hide_helpers_edges;

CabinetFacadeNode.prototype._hide_helpers = function() {
  if (this.userData.helpers) this.userData.helpers.visible = false;
  this._hide_helpers_edges && this._hide_helpers_edges();
};

// Заполнитель (двери, опоры) — дочерний модуль секции
class CabinetFillNode extends CabinetNode {
  _build_size() {
    const p = this.config;
    const c = this.calculated.c_object;
    
    // Для вложенных секций модули должны считать s:* от текущей секции (parent_size).
    const parentSize = c.parent_size || new THREE.Vector3();
    const sectionSize = c.parent_size || c.root_size || parentSize;
    
    const ctx = {
      sizes: {
        x: sectionSize.x || 0,
        y: sectionSize.y || 0,
        z: sectionSize.z || 0,
      },
      vars: c.vars || {},
      materials: c.materials || {},
    };
    
    // Размеры из шаблона (как есть) - могут быть выражения типа '@section.width'
    const sizeX = evalExpr(p.size.x, ctx);
    const sizeY = evalExpr(p.size.y, ctx);
    const sizeZ = evalExpr(p.size.z, ctx);
    
    // Логирование для отладки плоских модулей
    if (window.__CLD_DEBUG_MODULES || sizeZ < 1 || sizeZ > 1000) {
      console.warn('[CLD][CabinetFillNode._build_size] Размер модуля:', p.name || 'module', {
        sizeX,
        sizeY,
        sizeZ,
        p_size: p.size,
        p_size_z_type: typeof p.size.z,
        p_size_z_value: p.size.z,
        evalExpr_result_z: sizeZ,
        rootSize: { x: sectionSize.x, y: sectionSize.y, z: sectionSize.z },
        parentSize: { x: parentSize.x, y: parentSize.y, z: parentSize.z },
        ctx_sizes: ctx.sizes,
        calculated_c_object: c
      });
    }
    
    this.calculated.size.set(sizeX, sizeY, sizeZ);
    this.calculated.u_size.set(mmToU(sizeX), mmToU(sizeY), mmToU(sizeZ));
  }

  // Референс: модули используют direction из spec или дефолт 'z'
  // Модули дверей отправляются как фасады и обрабатываются CabinetFacadeNode
  _build_direction() {
    const p = this.config || {};
    const isHingeModule = __cldIsHingeModuleSpec(p.spec);
    if (isHingeModule) {
      return p.spec?.direction || '-z';
    }
    const parentOrientation = this.userData.parent?.userData?.params?.spec?.orientation ||
      this.userData.parent?.config?.spec?.orientation || 'f';
    let direction = p.spec?.direction || 'z';

    if (parentOrientation === 'v') {
      switch (direction) {
        case 'x': direction = 'z'; break;
        case '-x': direction = '-z'; break;
        case 'y': direction = 'y'; break;
        case '-y': direction = '-y'; break;
        case 'z': direction = 'x'; break;
        case '-z': direction = '-x'; break;
      }
    } else if (parentOrientation === 'h') {
      switch (direction) {
        case 'x': direction = 'x'; break;
        case '-x': direction = '-x'; break;
        case 'y': direction = 'z'; break;
        case '-y': direction = '-z'; break;
        case 'z': direction = 'y'; break;
        case '-z': direction = '-y'; break;
      }
    }

    return direction;
  }

  // Референс: модули (полки, топ, накладка) используют простую формулу позиционирования
  // Модули дверей (element_type: "dveri_shkaf") отправляются как type: 'facade' и обрабатываются CabinetFacadeNode
  _build_pos() {
    const p = this.config;
    const c = this.calculated.c_object;
    const parentSize = c.parent_size || new THREE.Vector3();
    const sectionSize = c.parent_size || c.root_size || new THREE.Vector3();
    const ctx = {
      sizes: { x: sectionSize.x, y: sectionSize.y, z: sectionSize.z },
      vars: c.vars || {},
    };

    const px = evalExpr(p.pos?.x ?? 0, ctx);
    const py = evalExpr(p.pos?.y ?? 0, ctx);
    const pz = evalExpr(p.pos?.z ?? 0, ctx);
    this.calculated.pos.set(px, py, pz);

    const ux = (-parentSize.x / 2 + px) / UNITS_MM;
    const uy = (-parentSize.y / 2 + py) / UNITS_MM;
    const uz = (-parentSize.z / 2 + pz) / UNITS_MM;

    this.position.set(ux, uy, uz);

    if (__cldIsHingeDebugEnabled() && __cldIsHingeLikeNode(p)) {
      console.info('[CLD][hinge][pos]', {
        type: p.type || this.constructor.name,
        name: p.name || '',
        id: p.id || '',
        dir: this._build_direction(),
        posExpr: p.pos,
        posMm: { x: px, y: py, z: pz },
        posUnits: { x: ux, y: uy, z: uz },
        parentSizeMm: { x: parentSize.x, y: parentSize.y, z: parentSize.z },
        path: this.userData?.path || '',
      });
    }

    if (window.__CLD_DEBUG_MODULES) {
      console.log('[CLD][CabinetFillNode._build_pos]', p.name || 'module', {
        pos_mm: { x: px, y: py, z: pz },
        pos_units: { x: ux, y: uy, z: uz },
        parentSize_mm: { x: parentSize.x, y: parentSize.y, z: parentSize.z },
        size_mm: this.calculated.size
      });
    }
  }

  // Референс: CabinetSection._build_pivot (part19 ~2752) — pivot зависит от direction
  // Для hinges мы используем ту же таблицу, что и фасады/стенки, но с direction из spec.
  _build_pivot() {
    const p = this.config || {};
    const size = this.calculated.size || new THREE.Vector3();
    const h = this.userData.own_object;
    if (!h) return;

    const isHingeModule = __cldIsHingeModuleSpec(p.spec);
    const rawPivot = p.pivot && typeof p.pivot === 'object' ? p.pivot : null;
    const hasExplicitPivot =
      !!rawPivot &&
      (rawPivot.x !== undefined || rawPivot.y !== undefined || rawPivot.z !== undefined);

    const dir = this._build_direction();
    const table = {
      'x': [-1, 0, 0, size.z, size.y, size.x],
      '-x': [1, 0, 0, size.z, size.y, size.x],
      'y': [0, -1, 0, size.x, size.z, size.y],
      '-y': [0, 1, 0, size.x, size.z, size.y],
      'z': [0, 0, -1, size.x, size.y, size.z],
      '-z': [-1, -1, -1, size.x, size.y, size.z],
      'default': isHingeModule ? [-1, -1, -1, size.x, size.y, size.z] : [0, 0, 0, size.x, size.y, size.z]
    };
    const row = table[dir] || table['default'];
    let [pivotX, pivotY, pivotZ, sizeForX, sizeForY, sizeForZ] = row;

    if (hasExplicitPivot) {
      const pxRaw = Number(rawPivot.x);
      const pyRaw = Number(rawPivot.y);
      const pzRaw = Number(rawPivot.z);
      if (Number.isFinite(pxRaw)) pivotX = pxRaw;
      if (Number.isFinite(pyRaw)) pivotY = pyRaw;
      if (Number.isFinite(pzRaw)) pivotZ = pzRaw;
      sizeForX = size.x;
      sizeForY = size.y;
      sizeForZ = size.z;
    }

    const px = this._conv_pivot(pivotX, sizeForX);
    const py = this._conv_pivot(pivotY, sizeForY);
    const pz = this._conv_pivot(pivotZ, sizeForZ);

    h.translateX(px / UNITS_MM);
    h.translateY(py / UNITS_MM);
    h.translateZ(pz / UNITS_MM);

    const helpers = this.userData.helpers;
    if (helpers) {
      helpers.position.copy(h.position);
      helpers.rotation.copy(h.rotation);
      helpers.scale.copy(h.scale);
    }

    if (__cldIsHingeDebugEnabled() && __cldIsHingeLikeNode(p)) {
      console.info('[CLD][hinge][pivot]', {
        name: p.name || '',
        dir,
        pivotSource: hasExplicitPivot ? 'explicit' : 'direction-table',
        pivot: { x: pivotX, y: pivotY, z: pivotZ },
        sizeFor: { x: sizeForX, y: sizeForY, z: sizeForZ },
        translated: { x: px, y: py, z: pz }
      });
    }
  }

  _build_spec() {
    const uSize = this.calculated.u_size || new THREE.Vector3();
    if (!uSize.x || !uSize.y || !uSize.z) return;

    const p = this.config || {};
    // Реф Clodis: для module с element_type:'hinges' геометрию собирает движок из template_tree
    // (его подставляет _expandCatalogModules через __cldTryResolveModuleTreeFromCatalog).
    // Свой "куб-плейсхолдер" сюда не рисуем — иначе появляется лишний коричневый/чёрный бокс.
    const isHingeModule = __cldIsHingeModuleSpec(p.spec);
    if (isHingeModule) return;
    // Вложенный catalog_* (не hinges): без template_tree не рисуем коричневый куб — иначе «один короб».
    // Петли в каталоге часто идут как catalog_7 / catalog_34: __cldIsHingeModuleSpec не срабатывает,
    // но __cldIsHingeLikeNode ловит имя/spec — иначе ранний return убивает меш; остаётся разворот или запасной куб.
    if (__cldIsCatalogLinkedModuleSpec(p.spec) && String(p.spec?.id || '').trim()) {
      if (!__cldIsHingeLikeNode(p) && !__cldIsFlatCatalogShelfSpec(p.spec, p)) return;
    }

    const isFlatShelfPreview = __cldIsFlatCatalogShelfSpec(p.spec, p);
    const mat = isFlatShelfPreview
      ? create_material_for_wall()
      : new THREE.MeshStandardMaterial({
          color: 0x8b7355,
          metalness: 0.1,
          roughness: 0.8,
        });

    const mesh = make_cube(uSize.x, uSize.y, uSize.z, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = p.name || 'fill';
    this.userData.own_object.add(mesh);

    const geom = mesh.geometry;
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geom),
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    edges.userData.isEdgesLines = true;
    this.userData.own_object.add(edges);
    this.userData.edges_lines = edges;
  }

  /** Куб-подсветка выбранного module в дереве (без влияния на геометрию). */
  _build_helpers() {
    const comp = this.calculated || {};
    const size = comp.size;
    if (!size || !Number(size.x) || !Number(size.y) || !Number(size.z)) return;
    if (!this.userData.helpers) {
      this.userData.helpers = new THREE.Group();
      this.userData.helpers.name = '__helpers';
      this.add(this.userData.helpers);
    }
    cldClearHelpersVolume(this);
    const uSize = comp.u_size || new THREE.Vector3(mmToU(size.x), mmToU(size.y), mmToU(size.z));
    cldAddSectionStyleVolumeHelpers(this, uSize, 'ModuleVolume');
    const own = this.userData.own_object;
    if (own && this.userData.helpers) {
      this.userData.helpers.position.copy(own.position);
      this.userData.helpers.rotation.copy(own.rotation);
      this.userData.helpers.scale.copy(own.scale);
    }
  }

  _show_helpers() {
    this._build_helpers();
    if (this.userData.helpers) this.userData.helpers.visible = true;
  }
}

CabinetFillNode.prototype._hide_helpers = function() {
  if (this.userData.helpers) this.userData.helpers.visible = false;
};

/** Clodis type: model — GLB/FBX из каталога cabinet_model (spec.id → params.models[].model). */
class CabinetModelNode extends CabinetNode {
  buildGeometry() {
    // Крепёж стыка (реф furniture): без зелёного volume-хелпера.
    const hv = this.config?.helpers_visible;
    const jointHw =
      Number(this.config?.spec?.joint_hardware) === 1 ||
      !!this.config?.fromJointScheme ||
      !!this.userData?.parent?.config?.fromJointScheme;
    if (hv !== 0 && hv !== '0' && !jointHw) {
      cldAddSectionStyleVolumeHelpers(this, this.calculated.u_size || new THREE.Vector3(), 'ModelVolume');
    }
    return this._build_spec();
  }

  _addModelPlaceholder() {
    const uSize = this.calculated.u_size;
    if (!uSize?.x || !uSize?.y || !uSize?.z) return;
    const mat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.35, roughness: 0.45 });
    const mesh = make_cube(uSize.x, uSize.y, uSize.z, mat);
    mesh.name = 'cabinet_model_placeholder';
    mesh.userData.isAccessory = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.userData.own_object.add(mesh);
  }

  _build_spec() {
    const uSize = this.calculated.u_size;
    const jointTemplateModel =
      Number(this.config?.spec?.joint_template_model) === 1 ||
      this.config?.spec?.jointTemplateModel === true;
    if ((!uSize?.x || !uSize?.y || !uSize?.z) && !jointTemplateModel) return;
    const szMm = {
      x: uToMm(Number(uSize?.x) || 0),
      y: uToMm(Number(uSize?.y) || 0),
      z: uToMm(Number(uSize?.z) || 0),
    };
    const epoch = this.userData._ownRebuildEpoch || 0;
    __ensureCabinetModelLibraryMap().then((map) => {
      if ((this.userData._ownRebuildEpoch || 0) !== epoch) return;
      const baseSpec = { ...(this.config.spec || {}) };
      const id = baseSpec.id != null ? String(baseSpec.id).trim() : '';
      let mergedSpec = baseSpec;
      if (id && map && map[id] && map[id].params) {
        mergedSpec = deepMerge(map[id].params, baseSpec);
      }
      const entry = __pickCabinetModelVariant(mergedSpec, szMm);
      const urlRaw = entry?.model || mergedSpec.modelUrl || mergedSpec.model || '';
      const url = __resolveAssetUrlForModel(String(urlRaw || '').trim());
      if (!url) {
        this._addModelPlaceholder();
        _appendDrillTemplateHolePreviewToOwnObject(this.userData.own_object, mergedSpec, {
          kind: 'model',
          name: this.config?.name,
          note: 'placeholder',
        });
        return;
      }
      __loadCabinetModelAssetRootOnce(url).then((tpl) => {
        if ((this.userData._ownRebuildEpoch || 0) !== epoch) return;
        if (!tpl) {
          this._addModelPlaceholder();
          _appendDrillTemplateHolePreviewToOwnObject(this.userData.own_object, mergedSpec, {
            kind: 'model',
            name: this.config?.name,
            note: 'load-fail',
          });
          return;
        }
        const loaderApi =
          typeof globalThis !== 'undefined' ? globalThis.__cldRoomCabinetModels : null;
        let root;
        let preparedMesh = null;
        if (loaderApi && typeof loaderApi.prepareCabinetModelRoot === 'function') {
          const prepared = loaderApi.prepareCabinetModelRoot(tpl, mergedSpec, entry, szMm);
          preparedMesh = prepared;
          const jointHw =
            Number(mergedSpec?.joint_hardware) === 1 ||
            !!this.config?.fromJointScheme ||
            !!this.userData?.parent?.config?.fromJointScheme;
          const fromJointSchemeHw =
            !!this.config?.fromJointScheme ||
            !!this.userData?.parent?.config?.fromJointScheme;
          const templateModel =
            Number(mergedSpec?.joint_template_model) === 1 ||
            mergedSpec?.jointTemplateModel === true;
          if (jointHw && !templateModel && prepared) {
            // Реф: длина шурупа по локальному X furniture; rot.z±90 крутит в полку/дно.
            // Catalog rot.y=90 не применяем.
            try { delete prepared.userData._cldCatalogRot; } catch (_) {}
            __gltfRootAlignLongAxisTo(prepared, 'x');
          }
          // prepared собран в мм (как в комнате): и scale, и position в мм.
          // Оборачиваем в группу UNITS_MM, чтобы позиция центрирования тоже масштабировалась.
          const wrapper = new THREE.Group();
          wrapper.scale.setScalar(1 / UNITS_MM);
          wrapper.add(prepared);
          wrapper.updateMatrixWorld(true);
          if (jointHw && !templateModel) {
            const sx = Number(this.config?.size?.x) || 50;
            const sy = Number(this.config?.size?.y) || 7;
            const sz = Number(this.config?.size?.z) || 7;
            __gltfRootNonUniformFitToSize(wrapper, {
              x: mmToU(sx),
              y: mmToU(sy),
              z: mmToU(sz),
            });
          }
          // Крепёж стыка: aluminium как в рефе (не белый GLB / не рентген).
          if (jointHw && (!templateModel || fromJointSchemeHw)) {
            __cldMarkJointHardwareMeshesOnTop(wrapper);
          }
          root = wrapper;
        } else {
          root = tpl.clone(true);
          preparedMesh = root;
          root.traverse((o) => {
            if (o.isMesh) {
              o.castShadow = true;
              o.receiveShadow = true;
              o.userData.isAccessory = true;
            }
          });
          const __readVec3 = (v) => {
            if (!v || typeof v !== 'object') return null;
            const x = Number(v.x);
            const y = Number(v.y);
            const z = Number(v.z);
            if (Number.isFinite(x) && x > 0 && Number.isFinite(y) && y > 0 && Number.isFinite(z) && z > 0) {
              return { x, y, z };
            }
            return null;
          };
          const refMm =
            __readVec3(mergedSpec.preview_ref_mm) ||
            __readVec3(mergedSpec.ref_size_mm) ||
            __readVec3(entry && entry.preview_ref_mm) ||
            null;
          const fitToSize =
            mergedSpec.fitToSize === true ||
            mergedSpec.fit_to_size === 1 ||
            (mergedSpec.resizable && Number(mergedSpec.resizable.enabled) === 1);
          root.scale.set(1, 1, 1);
          root.position.set(0, 0, 0);
          root.rotation.set(0, 0, 0);
          root.updateMatrixWorld(true);
          const assetMeta = tpl.userData && tpl.userData.__cldGltfAsset;
          const imp = __cldInferFileToSceneScaleFactor(root, mergedSpec, assetMeta);
          root.scale.setScalar(imp);
          root.updateMatrixWorld(true);
          if (refMm) {
            __gltfRootMultiplyUniformScaleToRefMm(root, refMm);
          } else if (fitToSize) {
            __gltfRootMultiplyUniformScaleToRefMm(root, szMm);
          } else {
            __gltfRootCenterOnlyKeepScale(root);
          }
          const catSc = __cldCabinetModelCatalogScaleVec(entry);
          if (catSc && (catSc.x !== 1 || catSc.y !== 1 || catSc.z !== 1)) {
            root.scale.multiply(catSc);
            root.updateMatrixWorld(true);
            __gltfRootCenterOnlyKeepScale(root);
          }
        }
        const jointHwFinal =
          Number(mergedSpec?.joint_hardware) === 1 ||
          !!this.config?.fromJointScheme ||
          !!this.userData?.parent?.config?.fromJointScheme;
        const fromJointSchemeHwFinal =
          !!this.config?.fromJointScheme ||
          !!this.userData?.parent?.config?.fromJointScheme;
        // joint_template_model = GLB из шаблона присадки (петля L/пласть).
        // Ему нужен обычный depth: иначе «просвечивает» сквозь фасад/декор.
        // Крепёж стыка (fromJointScheme) — в толще панели: OnTop своим цветом вместо cyan-маркеров.
        const templateModelFinal =
          Number(mergedSpec?.joint_template_model) === 1 ||
          mergedSpec?.jointTemplateModel === true ||
          !!mergedSpec?.hingePart ||
          !!this.config?.spec?.hingePart;
        const markJointHwOnTop =
          jointHwFinal &&
          (fromJointSchemeHwFinal ||
            Number(mergedSpec?.joint_hardware) === 1 ||
            !templateModelFinal);
        // Материалы каталога, затем aluminium для крепежа стыка (реф bim_keys.al) —
        // иначе __cldApplyCabinetModelMeshMaterials снова красит GLB в белый.
        const afterModelMats = () => {
          if (markJointHwOnTop) __cldMarkJointHardwareMeshesOnTop(root);
          try {
            _reapplyJointSchemeHardwareOnTop();
          } catch (_) {}
          try {
            render();
          } catch (_) {}
        };
        __cldApplyCabinetModelMeshMaterials(root, mergedSpec, entry)
          .then(afterModelMats)
          .catch(afterModelMats);
        root.name = this.config.name || 'cabinet_model';
        this.userData.own_object.add(root);
        // После R_place + attach фасада на hinge_animator GLB грузится позже —
        // мечи чашки должны ловить клик распашки.
        if (
          Number(mergedSpec?.from_drill_template) === 1 &&
          String(mergedSpec?.hingePart || this.config?.spec?.hingePart || '') === 'facade'
        ) {
          root.traverse((o) => {
            if (!o?.isMesh) return;
            o.userData = o.userData || {};
            o.userData.cldDoorPick = true;
          });
        }
        // У крепежа стыка отверстия уже рисует joint_preview — не дублируем drill-template на GLB.
        if (!jointHwFinal) {
          _appendDrillTemplateHolePreviewToOwnObject(this.userData.own_object, mergedSpec, {
            kind: 'model',
            name: this.config?.name,
          });
        }

        const rodApi = typeof globalThis !== 'undefined' ? globalThis.__cldRodCompanions : null;
        const entryParams =
          (entry && entry.params && typeof entry.params === 'object' ? entry.params : null);
        const companionsCfg =
          rodApi && typeof rodApi.parseRodCompanionsConfig === 'function'
            ? rodApi.parseRodCompanionsConfig(mergedSpec, entryParams)
            : null;
        // enabled → плечики; preview_only больше не блокирует (и в превью, и в комнате).
        if (companionsCfg?.enabled) {
          const spawnEpoch = this.userData._ownRebuildEpoch || 0;
          const rodGroupForCompanions = root;
          const rodWidthMm = Number(szMm.x) || 0;
          __ensureCabinetModelLibraryMap()
            .then((libMap) => {
              if ((this.userData._ownRebuildEpoch || 0) !== spawnEpoch) return 0;
              if (!rodApi?.spawnRodCompanionsIntoOwnObject) return 0;
              return rodApi.spawnRodCompanionsIntoOwnObject({
                rodGroup: rodGroupForCompanions,
                rodMesh: preparedMesh,
                rodWidthMm,
                config: companionsCfg,
                catalogMap: libMap,
                THREE,
                unitsMm: UNITS_MM,
                markPreviewOnly: false,
                epoch: spawnEpoch,
                isEpochStale: () => (this.userData._ownRebuildEpoch || 0) !== spawnEpoch,
                loadAsset: __loadCabinetModelAssetRootOnce,
                prepareRoot: (tpl2, ms, ent, sm) => {
                  if (loaderApi && typeof loaderApi.prepareCabinetModelRoot === 'function') {
                    return loaderApi.prepareCabinetModelRoot(tpl2, ms, ent, sm);
                  }
                  return tpl2.clone(true);
                },
                applyMaterials: async (prepared, ms, ent) => {
                  const shelfApi =
                    typeof globalThis !== 'undefined' ? globalThis.__cldShelfProps : null;
                  if (ms?.isRodCompanion && shelfApi?.applyShelfPropFabricLook) {
                    if (shelfApi.waitForTextureMaps) {
                      await shelfApi.waitForTextureMaps(prepared, 8000);
                    }
                    shelfApi.applyShelfPropFabricLook(
                      prepared,
                      THREE,
                      ms?.fabric_tint || ms?.fabricTint,
                      'rod',
                    );
                    return;
                  }
                  return __cldApplyCabinetModelMeshMaterials(prepared, ms, ent);
                },
              });
            })
            .then(() => {
              try {
                render();
              } catch (_) {}
            })
            .catch(() => {});
        }
      });
    });
  }
}

/**
 * Позиция в превью карточки для СК шаблона присадки — __CLD_DRILL_RESOLVE
 * (Three Y↑ = −Yмм шаблона, Z к камере = −Zмм).
 */
function _drillTemplateLocalPosUnits(xMm, yMm, zMm) {
  const DR = globalThis.__CLD_DRILL_RESOLVE;
  if (DR && typeof DR.drillTemplateLocalPos === 'function') {
    return DR.drillTemplateLocalPos(xMm, yMm, zMm, UNITS_MM);
  }
  return {
    x: mmToU(Number(xMm) || 0),
    y: mmToU(-(Number(yMm) || 0)),
    z: mmToU(-(Number(zMm) || 0)),
  };
}

CabinetModelNode.prototype._build_size = CabinetFillNode.prototype._build_size;
CabinetModelNode.prototype._build_pos = function _cldJointTemplateModelBuildPos() {
  const parentCfg = this.userData?.parent?.config;
  const fromDrillTpl =
    Number(this.config?.spec?.from_drill_template) === 1 ||
    Number(parentCfg?.spec?.drill_template_local_cs) === 1;
  const jointTpl =
    Number(this.config?.spec?.joint_template_model) === 1 ||
    !!this.config?.fromJointScheme ||
    !!parentCfg?.fromJointScheme;
  // Стык / шаблон присадки: pos мм как в превью сверловки (x, −y, −z), без BLB.
  if (fromDrillTpl || jointTpl) {
    const live = jointTpl
      ? _liveJointModelVisualOffsetFromModelConfig(this.config, parentCfg, this)
      : null;
    const c = this.calculated.c_object;
    const sectionSize = c.parent_size || c.root_size || new THREE.Vector3();
    const ctx = {
      sizes: { x: sectionSize.x, y: sectionSize.y, z: sectionSize.z },
      vars: c.vars || {},
    };
    const px = live ? live.x : evalExpr(this.config?.pos?.x ?? 0, ctx);
    const py = live ? live.y : evalExpr(this.config?.pos?.y ?? 0, ctx);
    const pz = live ? live.z : evalExpr(this.config?.pos?.z ?? 0, ctx);
    this.calculated.pos.set(px, py, pz);
    const u = _drillTemplateLocalPosUnits(px, py, pz);
    this.position.set(u.x, u.y, u.z);
    return;
  }
  return CabinetFillNode.prototype._build_pos.call(this);
};
CabinetModelNode.prototype._build_rot = function _cldJointTemplateModelBuildRot() {
  const parentCfg = this.userData?.parent?.config;
  const liveRot = _liveJointTemplateModelRotDeg(this.config, parentCfg, this);
  if (liveRot) {
    const rx = Number(liveRot.x) || 0;
    const ry = Number(liveRot.y) || 0;
    const rz = Number(liveRot.z) || 0;
    this.calculated.rot.set(rx, ry, rz);
    const h = this.userData.own_object;
    if (h) {
      h.rotation.set(0, 0, 0);
      h.rotateX(-THREE.MathUtils.degToRad(rx));
      h.rotateY(-THREE.MathUtils.degToRad(ry));
      h.rotateZ(-THREE.MathUtils.degToRad(rz));
    }
    return;
  }
  return CabinetNode.prototype._build_rot.call(this);
};
CabinetModelNode.prototype._build_pivot = function _cldDrillTemplateModelBuildPivot() {
  const parentCfg = this.userData?.parent?.config;
  const fromDrillTpl =
    Number(this.config?.spec?.from_drill_template) === 1 ||
    Number(parentCfg?.spec?.drill_template_local_cs) === 1;
  const jointTpl =
    Number(this.config?.spec?.joint_template_model) === 1 ||
    !!this.config?.fromJointScheme ||
    !!parentCfg?.fromJointScheme;
  if (fromDrillTpl || jointTpl) {
    // Origin GLB = точка шаблона / вход отверстия + offset; FillNode direction-pivot не применяем.
    if (this.userData.own_object) {
      this.userData.own_object.position.set(0, 0, 0);
    }
    return;
  }
  return CabinetFillNode.prototype._build_pivot.call(this);
};
CabinetModelNode.prototype._build_direction = CabinetFillNode.prototype._build_direction;
CabinetModelNode.prototype._hide_helpers = function() {
  if (this.userData.helpers) this.userData.helpers.visible = false;
};

/**
 * Clodis type: hole — отверстие (CabinetHole в референсе).
 * Рисует CylinderGeometry с direction-зависимыми трансформами геометрии и pivot.
 * class CabinetHole .
 */
class CabinetHoleNode extends CabinetNode {
  _build_children() {} // holes have no children (ref: line 2630)

  _build_direction() {
    const parentOrientation = this.userData?.parent?.config?.spec?.orientation || 'f';
    let dir = this.config?.spec?.direction || '-z';
    if (parentOrientation === 'v') {
      const m = { x:'z', '-x':'-z', y:'y', '-y':'-y', z:'x', '-z':'-x' };
      dir = m[dir] || dir;
    } else if (parentOrientation === 'h') {
      const m = { x:'x', '-x':'-x', y:'z', '-y':'-z', z:'y', '-z':'-y' };
      dir = m[dir] || dir;
    }
    return dir;
  }

  _build_size() {
    const p = this.config;
    const c = this.calculated.c_object;
    const ctx = {
      sizes: { x: c.parent_size?.x || 0, y: c.parent_size?.y || 0, z: c.parent_size?.z || 0 },
      vars: c.vars || {},
    };
    const sx = evalExpr(p.size?.x ?? 0, ctx);
    const sz = evalExpr(p.size?.z ?? 0, ctx);
    // Ref: real_size.x = size.x, real_size.y = size.x (circle), real_size.z = size.z
    this.calculated.real_size = new THREE.Vector3(sx, sx, sz);
    const dir = this._build_direction();
    const size = this.calculated.size;
    // Ref: direction-dependent size swizzle (part19:2688-2701)
    if (dir === 'x' || dir === '-x') {
      size.set(sz, sx, sx);
    } else if (dir === 'y' || dir === '-y') {
      size.set(sx, sz, sx);
    } else {
      size.set(sx, sx, sz);
    }
    this.calculated.u_size = size.clone().divideScalar(UNITS_MM);
    this.calculated.u_real_size = this.calculated.real_size.clone().divideScalar(UNITS_MM);
  }

  _build_pos() {
    const p = this.config;
    const c = this.calculated.c_object;
    const ctx = {
      sizes: { x: c.parent_size?.x || 0, y: c.parent_size?.y || 0, z: c.parent_size?.z || 0 },
      vars: c.vars || {},
    };
    const posX = evalExpr(p.pos?.x ?? 0, ctx);
    const posY = evalExpr(p.pos?.y ?? 0, ctx);
    const posZ = evalExpr(p.pos?.z ?? 0, ctx);
    this.calculated.pos.set(posX, posY, posZ);

    // Отверстия шаблона присадки на Furniture: точка (x,y,z) мм = origin шаблона
    // (как _addLocalDrillHoleMeshes / комната). Не panel BLB / global Z.
    const parentLocalCs =
      Number(this.userData?.parent?.config?.spec?.drill_template_local_cs) === 1;
    const holeLocal =
      Number(this.config?.spec?.drill_template_local) === 1 || parentLocalCs;
    if (holeLocal) {
      const u = _drillTemplateLocalPosUnits(posX, posY, posZ);
      this.position.set(u.x, u.y, u.z);
      if (window.__CLD_DEBUG_FURNI_HOLES) {
        console.log('[CLD][hole][pos][drill-template-local]', {
          path: this.userData?.path || '',
          posMm: { x: posX, y: posY, z: posZ },
          appliedLikeAdminPreview: { x: posX, y: -posY, z: -posZ },
          worldPosU: {
            x: this.position.x,
            y: this.position.y,
            z: this.position.z,
          },
        });
      }
      return;
    }

    const ps = c.parent_size || new THREE.Vector3();
    const rs = this.calculated.real_size || this.calculated.size;
    const isGlobal = this.config?.spec?.global == 1;
    const dir = this._build_direction();
    let j, k, l;
    // Ref: CabinetHole._build_pos (part19:2791-2835) — direction-dependent positioning
    switch (dir) {
      case 'x':
        j = (isGlobal ? (-ps.x / 2 + posZ + rs.z / 2) : -ps.x / 2) / UNITS_MM;
        k = (-ps.y / 2 + posY) / UNITS_MM;
        l = (-ps.z / 2 + posX) / UNITS_MM;
        break;
      case '-x':
        j = (isGlobal ? (ps.x / 2 + posZ - rs.z / 2) : ps.x / 2) / UNITS_MM;
        k = (-ps.y / 2 + posY) / UNITS_MM;
        l = (-ps.z / 2 + posX) / UNITS_MM;
        break;
      case 'y':
        k = (isGlobal ? (-ps.y / 2 + posZ + rs.z / 2) : -ps.y / 2) / UNITS_MM;
        j = (-ps.x / 2 + posX) / UNITS_MM;
        l = (-ps.z / 2 + posY) / UNITS_MM;
        break;
      case '-y':
        k = (isGlobal ? (ps.y / 2 + posZ - rs.z / 2) : ps.y / 2) / UNITS_MM;
        j = (-ps.x / 2 + posX) / UNITS_MM;
        l = (-ps.z / 2 + posY) / UNITS_MM;
        break;
      case 'z':
        l = (isGlobal ? (-ps.z / 2 + posZ + rs.z / 2) : -ps.z / 2) / UNITS_MM;
        j = (-ps.x / 2 + posX) / UNITS_MM;
        k = (-ps.y / 2 + posY) / UNITS_MM;
        break;
      case '-z':
      default:
        l = (isGlobal ? (ps.z / 2 + posZ - rs.z / 2) : ps.z / 2) / UNITS_MM;
        j = (-ps.x / 2 + posX) / UNITS_MM;
        k = (-ps.y / 2 + posY) / UNITS_MM;
        break;
    }
    this.position.set(j, k, l);
    if (window.__CLD_DEBUG_FURNI_HOLES) {
      console.log('[CLD][hole][pos]', {
        path: this.userData?.path || '',
        dir,
        isGlobal,
        posMm: { x: posX, y: posY, z: posZ },
        parentSizeMm: { x: ps.x, y: ps.y, z: ps.z },
        realSizeMm: { x: rs.x, y: rs.y, z: rs.z },
        worldPosU: { x: j, y: k, z: l },
      });
    }
  }

  _build_pivot() {
    const parentLocalCs =
      Number(this.userData?.parent?.config?.spec?.drill_template_local_cs) === 1;
    const holeLocal =
      Number(this.config?.spec?.drill_template_local) === 1 || parentLocalCs;
    // В СК шаблона точка отверстия = вход; half-depth pivot панели не сдвигаем
    // (иначе хелперы уезжают от GLB, у которого origin на точке шаблона).
    if (holeLocal) return;

    const dir = this._build_direction();
    const rs = this.calculated.real_size || this.calculated.size;
    const h = this.userData.own_object;
    if (!h) return;
    // Ref: CabinetHole._build_pivot direction table (part19:2757-2764)
    const table = {
      'x':  [-1, 0, 0, rs.z, rs.y, rs.x],
      '-x': [1, 0, 0, rs.z, rs.y, rs.x],
      'y':  [0, -1, 0, rs.x, rs.z, rs.y],
      '-y': [0, 1, 0, rs.x, rs.z, rs.y],
      'z':  [0, 0, -1, rs.x, rs.y, rs.z],
      '-z': [0, 0, 1, rs.x, rs.y, rs.z],
    };
    const row = table[dir] || table['-z'];
    const [pX, pY, pZ, sX, sY, sZ] = row;
    const px = this._conv_pivot(pX, sX);
    const py = this._conv_pivot(pY, sY);
    const pz = this._conv_pivot(pZ, sZ);
    h.translateX(px / UNITS_MM);
    h.translateY(py / UNITS_MM);
    h.translateZ(pz / UNITS_MM);
  }

  _isDrillTemplateLocalHole() {
    const parentLocalCs =
      Number(this.userData?.parent?.config?.spec?.drill_template_local_cs) === 1;
    return (
      Number(this.config?.spec?.drill_template_local) === 1 || parentLocalCs
    );
  }

  _build_spec() {
    const rs = this.calculated.real_size;
    if (!rs || !rs.x || !rs.z) return;
    const urs = this.calculated.u_real_size;
    const radius = rs.x / 2 / UNITS_MM;
    const height = rs.z / UNITS_MM;
    const dir = this._build_direction();
    const holeLocal = this._isDrillTemplateLocalHole();
    // depthTest off — только «голый» шаблон/карточка петли (иначе цилиндры тонут в GLB).
    // В шкафу/ролях с фасадом и боком — обычный depth, иначе присадка «рентгенит» сквозь декор.
    const underFacadeShell = _cldNodeUnderThinFacadeShell(this);
    const holesOnTop =
      holeLocal &&
      !__cldHingeRolePreview &&
      !__cldHingeRoleVirtualSide &&
      !underFacadeShell;
    const geom = new THREE.CylinderGeometry(radius, radius, height, 32);
    const mesh = new THREE.Mesh(
      geom,
      new THREE.MeshBasicMaterial({
        // СК шаблона: фирменный зелёный как HoleVolume helpers (раньше так видели присадку).
        color: holeLocal ? 0x96c296 : 0x7b1fa2,
        transparent: true,
        opacity: holeLocal ? 0.55 : 0.25,
        depthTest: !holesOnTop,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    mesh.name = 'hole_cylinder';
    mesh.userData.isAccessory = true;
    mesh.renderOrder = holesOnTop ? 40 : 15;

    if (holeLocal) {
      // 1:1 admin makeHoleObj: quat(up→dir) + центр на dir*depth/2.
      // Legacy part19 rotate/translate давал обратный знак оси (X под чашкой / Y у Ø5).
      const dv = _DRILL_DIR_VEC[dir] || _DRILL_DIR_VEC['-z'];
      const drillDir = new THREE.Vector3(dv[0], dv[1], dv[2]).normalize();
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), drillDir);
      mesh.position.set(
        drillDir.x * (height / 2),
        drillDir.y * (height / 2),
        drillDir.z * (height / 2)
      );
      mesh.visible = true;
      // Контур цилиндра как в шаблоне присадки (EdgesGeometry).
      if (this.userData.hole_cylinder_edges) {
        try {
          this.userData.own_object.remove(this.userData.hole_cylinder_edges);
          disposeObject(this.userData.hole_cylinder_edges);
        } catch (_) {}
        this.userData.hole_cylinder_edges = null;
      }
      try {
        const cylEdges = new THREE.EdgesGeometry(geom, 32);
        const cylLines = new THREE.LineSegments(
          cylEdges,
          new THREE.LineBasicMaterial({
            color: 0x3d5c3d,
            transparent: true,
            opacity: 0.62,
            depthTest: !holesOnTop,
            depthWrite: false,
          }),
        );
        cylLines.name = 'hole_cylinder_edges';
        cylLines.quaternion.copy(mesh.quaternion);
        cylLines.position.copy(mesh.position);
        cylLines.renderOrder = holesOnTop ? 41 : 16;
        this.userData.hole_cylinder_edges = cylLines;
        this.userData.own_object.add(cylLines);
      } catch (_) {
        this.userData.hole_cylinder_edges = null;
      }
    } else {
      // Ref: CabinetHole._build_spec direction transforms (part19:2841-2873)
      switch (dir) {
        case 'x':
          geom.rotateZ(Math.PI / 2).translate(-urs.z / 2, 0, 0); break;
        case '-x':
          geom.rotateZ(-Math.PI / 2).translate(urs.z / 2, 0, 0); break;
        case 'y':
          geom.translate(0, -urs.z / 2, 0); break;
        case '-y':
          geom.translate(0, urs.z / 2, 0); break;
        case 'z':
          geom.rotateX(Math.PI / 2).translate(0, 0, -urs.z / 2); break;
        case '-z':
          geom.rotateX(-Math.PI / 2).translate(0, 0, urs.z / 2); break;
      }
      mesh.visible = false; // legacy: подсветка helper-кубом при выборе
      if (this.userData.hole_cylinder_edges) {
        try {
          this.userData.own_object.remove(this.userData.hole_cylinder_edges);
          disposeObject(this.userData.hole_cylinder_edges);
        } catch (_) {}
      }
      this.userData.hole_cylinder_edges = null;
    }
    this.userData.hole_cylinder = mesh;
    this.userData.own_object.add(mesh);
    if (window.__CLD_DEBUG_FURNI_HOLES) {
      console.log('[CLD][hole][spec]', {
        path: this.userData?.path || '',
        dir,
        holeLocal,
        realSizeMm: { x: rs.x, y: rs.y, z: rs.z },
        radiusU: radius,
        heightU: height,
        meshLocalPos: {
          x: mesh.position.x,
          y: mesh.position.y,
          z: mesh.position.z,
        },
      });
    }

    // Зелёный HoleVolume — как раньше при выборе «Присадка».
    // Для СК шаблона куб ставим в центр цилиндра (dir×depth/2), не в точку входа.
    const uSize = this.calculated.u_size || new THREE.Vector3();
    cldClearHelpersVolume(this);
    if (uSize.x > 0 && uSize.y > 0 && uSize.z > 0) {
      cldAddSectionStyleVolumeHelpers(this, uSize, 'HoleVolume');
      if (holeLocal && this.userData.helpers) {
        this.userData.helpers.position.copy(mesh.position);
      }
    }

    // Реф: стрелка направления (cone + cylinder), по умолчанию скрыта — как part19 + show_helpers у родителя furniture.
    // СК шаблона: как admin makeHoleObj — стрелка + точка входа от origin (всегда видны).
    if (this.userData.arrow) {
      try {
        this.userData.own_object.remove(this.userData.arrow);
        disposeObject(this.userData.arrow);
      } catch (_) {}
      this.userData.arrow = null;
    }
    if (holeLocal) {
      const arrow = cldBuildHoleTemplateEntryArrowGroup(dir, height, radius);
      if (arrow) {
        this.userData.arrow = arrow;
        this.userData.own_object.add(arrow);
      }
    } else {
      const arrow = cldBuildHoleDirectionArrowMesh(dir, urs);
      if (arrow) {
        this.userData.arrow = arrow;
        this.userData.own_object.add(arrow);
      }
    }
  }

  _show_helpers() {
    super._show_helpers();
    // При выборе отверстия/фурнитуры стрелка направления должна быть видна.
    if (this.userData.arrow) this.userData.arrow.visible = true;
    if (this.userData.hole_cylinder && this._isDrillTemplateLocalHole()) {
      this.userData.hole_cylinder.visible = true;
    }
    if (this.userData.hole_cylinder_edges && this._isDrillTemplateLocalHole()) {
      this.userData.hole_cylinder_edges.visible = true;
    }
    __cldSelLog({
      step: 'CabinetHoleNode._show_helpers',
      path: this.userData?.path || '',
      arrowVisible: this.userData.arrow?.visible,
      helpersVisible: this.userData.helpers?.visible,
    });
  }

  _hide_helpers() {
    super._hide_helpers();
    const holeLocal = !!this._isDrillTemplateLocalHole();
    // СК шаблона: цилиндр + стрелка/точка входа как в admin preview — всегда видны.
    if (this.userData.arrow) this.userData.arrow.visible = holeLocal;
    if (this.userData.hole_cylinder) {
      this.userData.hole_cylinder.visible = holeLocal;
    }
    if (this.userData.hole_cylinder_edges) {
      this.userData.hole_cylinder_edges.visible = holeLocal;
    }
  }
}

/**
 * Узел «Паз» (type:path) — как CabinetPath в рефе (part19).
 * pivot всегда {-1,-1,-1}; позиция (смещение по плоскости/глубине) — из свойств.
 * size.x = глубина в материал, size.y = ширина паза (подписи рефа).
 */
class CabinetPathNode extends CabinetNode {
  _build_children() {}

  _evalPathCtx() {
    const c = this.calculated?.c_object || {};
    return {
      sizes: {
        x: c.parent_size?.x || 0,
        y: c.parent_size?.y || 0,
        z: c.parent_size?.z || 0,
      },
      vars: c.vars || {},
    };
  }

  _evalPathNum(v, fb = 0) {
    const n = Number(evalExpr(v ?? fb, this._evalPathCtx()));
    return Number.isFinite(n) ? n : fb;
  }

  /** Реф CabinetPath._build_size — angle / dx_angle / common. */
  _build_size() {
    const p = this.config || {};
    const parent = this.userData?.parent;
    const parentReal = parent?.calculated?.real_size;
    const parentSize = parentReal || parent?.calculated?.size || this.calculated?.c_object?.parent_size || {};
    // Реф: толщина панели = real_size.z (для v это size.x)
    const parentThickZ = Number(parentReal?.z ?? parentSize.z) || 0;
    const resolved = cldPathResolveSectionSizeMm(
      p.spec || {},
      p.size || {},
      parentThickZ,
      (v) => this._evalPathNum(v, 0),
    );
    this.calculated.size.set(resolved.x, resolved.y, resolved.z);
    this.calculated.u_size.set(
      mmToU(resolved.x),
      mmToU(resolved.y),
      mmToU(Math.max(resolved.z, 0.001)),
    );
  }

  /** Реф CabinetPath._build_pivot: всегда (−1,−1,−1); только own_object, helpers без сдвига. */
  _build_pivot() {
    const p = this.config || {};
    p.pivot = { x: -1, y: -1, z: -1 };
    this.config.pivot = p.pivot;
    const size = this.calculated.size || new THREE.Vector3();
    const h = this.userData.own_object;
    if (!h) return;
    h.position.set(0, 0, 0);
    h.rotation.set(0, 0, 0);
    h.scale.set(1, 1, 1);
    const px = this._conv_pivot(-1, size.x);
    const py = this._conv_pivot(-1, size.y);
    const pz = this._conv_pivot(-1, size.z);
    h.translateX(px / UNITS_MM);
    h.translateY(py / UNITS_MM);
    h.translateZ(pz / UNITS_MM);
    // Реф part19: helpers паза НЕ копируют pivot own_object (wire остаётся в локали узла).
    // Сдвиг helpers = size/2 + Extrude без −size/2 → двойной уезд / «чёрное пятно».
    const helpers = this.userData.helpers;
    if (helpers) {
      helpers.position.set(0, 0, 0);
      helpers.rotation.set(0, 0, 0);
      helpers.scale.set(1, 1, 1);
    }
  }

  /** Реф: у path helpers не синхронизируем с own_object (pivot только на solid). */
  _build_c_rot() {
    const p = this.config || {};
    const c = this.calculated?.c_object || {};
    const sectionSize = c.parent_size || c.root_size || new THREE.Vector3();
    const ctx = {
      sizes: { x: sectionSize.x, y: sectionSize.y, z: sectionSize.z },
      vars: c.vars || {},
    };
    const crx = evalExpr(p.c_rot?.x ?? 0, ctx);
    const cry = evalExpr(p.c_rot?.y ?? 0, ctx);
    const crz = evalExpr(p.c_rot?.z ?? 0, ctx);
    const h = this.userData.own_object;
    if (!h) return;
    if (crx) h.rotateX(-THREE.MathUtils.degToRad(crx));
    if (cry) h.rotateY(-THREE.MathUtils.degToRad(cry));
    if (crz) h.rotateZ(-THREE.MathUtils.degToRad(crz));
  }

  /**
   * Реф CabinetPath._build_pos: pos + orientation/direction паза относительно родителя.
   */
  _build_pos() {
    const p = this.config || {};
    const c = this.calculated.c_object;
    const parent = this.userData?.parent;
    // Реф: half-extents / формула позиции — geometry size (c_object.parent_size);
    // reverse и толщина w — real_size || size.
    const parentSize = c.parent_size || parent?.calculated?.size || new THREE.Vector3();
    const parentReal =
      parent?.calculated?.real_size ||
      parent?.calculated?.size ||
      parentSize;
    const ctx = this._evalPathCtx();
    let px = Number(evalExpr(p.pos?.x ?? 0, ctx)) || 0;
    let py = Number(evalExpr(p.pos?.y ?? 0, ctx)) || 0;
    let pz = Number(evalExpr(p.pos?.z ?? 0, ctx)) || 0;

    const pathOrient = String(p.spec?.orientation || 'h').toLowerCase() === 'v' ? 'v' : 'h';
    const dir = String(p.spec?.direction || '-z').toLowerCase();
    const parentOrient = String(
      parent?.userData?.__cldPanelOrientation ||
        parent?.config?.spec?.orientation ||
        'f',
    ).toLowerCase();
    const parentThickZ = Number(parentReal?.z) || 0;

    if (pathOrient === 'h') {
      px = 0;
      if (p.spec?.reverse) {
        py = (Number(parentReal?.y) || 0) - (Number(evalExpr(p.pos?.y ?? 0, ctx)) || 0);
      }
    } else {
      py = 0;
      if (p.spec?.reverse) {
        px = (Number(parentReal?.x) || 0) - (Number(evalExpr(p.pos?.x ?? 0, ctx)) || 0);
      }
    }

    this.calculated.pos.set(px, py, pz);

    let ux = 0;
    let uy = 0;
    let uz = 0;
    const psx = Number(parentSize.x) || 0;
    const psy = Number(parentSize.y) || 0;
    const psz = Number(parentSize.z) || 0;

    switch (parentOrient) {
      case 'h':
        if (dir === 'z') {
          ux = (-psx / 2 + px) / UNITS_MM;
          uy = (-psy / 2 + pz) / UNITS_MM;
          uz = (-psz / 2 + py) / UNITS_MM;
        } else {
          ux = (-psx / 2 + px) / UNITS_MM;
          uy = (-psy / 2 - pz + parentThickZ) / UNITS_MM;
          uz = (-psz / 2 + py) / UNITS_MM;
        }
        break;
      case 'v':
        if (dir === 'z') {
          ux = (-psx / 2 + pz) / UNITS_MM;
          uy = (-psy / 2 + py) / UNITS_MM;
          uz = (-psz / 2 + px) / UNITS_MM;
        } else {
          ux = (-psx / 2 - pz + parentThickZ) / UNITS_MM;
          uy = (-psy / 2 + py) / UNITS_MM;
          uz = (-psz / 2 + px) / UNITS_MM;
        }
        break;
      default:
        if (dir === 'z') {
          ux = (-psx / 2 + px) / UNITS_MM;
          uy = (-psy / 2 + py) / UNITS_MM;
          uz = (-psz / 2 + pz) / UNITS_MM;
        } else {
          ux = (-psx / 2 + px) / UNITS_MM;
          uy = (-psy / 2 + py) / UNITS_MM;
          uz = (-psz / 2 - pz + parentThickZ) / UNITS_MM;
        }
        break;
    }
    this.position.set(ux, uy, uz);
  }

  _parentPanelOrient() {
    const parent = this.userData?.parent;
    return String(
      parent?.userData?.__cldPanelOrientation ||
        parent?.config?.spec?.orientation ||
        'f',
    ).toLowerCase();
  }

  /** Реф trajectory: real_size || size (у v: x = глубина грани, не толщина). */
  _parentSizeMm() {
    const parent = this.userData?.parent;
    const s =
      parent?.calculated?.real_size ||
      parent?.calculated?.size ||
      this.calculated?.c_object?.parent_size ||
      {};
    return {
      x: Number(s.x) || 0,
      y: Number(s.y) || 0,
      z: Number(s.z) || 0,
    };
  }

  /** Реф Extrude translate: c_object.parent_size = geometry size панели. */
  _parentGeomSizeMm() {
    const parent = this.userData?.parent;
    const s =
      parent?.calculated?.size ||
      this.calculated?.c_object?.parent_size ||
      {};
    return {
      x: Number(s.x) || 0,
      y: Number(s.y) || 0,
      z: Number(s.z) || 0,
    };
  }

  /** Реф _create_shape + p_shapes.common. */
  _create_shape() {
    const p = this.config || {};
    const size = this.calculated?.size || new THREE.Vector3(5, 4, 0);
    const points = cldPathCreateSectionPoints(
      p.spec || {},
      size.x,
      size.y,
      (v) => this._evalPathNum(v, 0),
    );
    this.calculated.path_points = points;
    return cldPathShapeFromPoints(points, UNITS_MM, THREE);
  }

  /** Реф _build_trajectory → CurvePath. */
  _build_trajectory() {
    const p = this.config || {};
    const parentSize = this._parentSizeMm();
    const pathOrient = String(p.spec?.orientation || 'h').toLowerCase() === 'v' ? 'v' : 'h';
    const dir = String(p.spec?.direction || '-z').toLowerCase();
    const parentOrient = this._parentPanelOrient();
    const dz = this._evalPathNum(p.spec?.dz ?? 0, 0);
    const dz2 = this._evalPathNum(p.spec?.dz_2 ?? p.spec?.dz2 ?? 0, 0);

    // Явная trajectory в spec (редко) — как в рефе.
    const trajSpec = p.spec?.trajectory;
    let displayMm;
    let extrudeMm;
    if (Array.isArray(trajSpec) && trajSpec.length >= 2) {
      displayMm = trajSpec.map(
        (D) =>
          new THREE.Vector3(
            this._evalPathNum(D.x, 0),
            this._evalPathNum(D.y, 0),
            0,
          ),
      );
      extrudeMm = displayMm;
    } else if (trajSpec && trajSpec.pos1 && trajSpec.pos2) {
      displayMm = [
        new THREE.Vector3(
          this._evalPathNum(trajSpec.pos1.x, 0),
          this._evalPathNum(trajSpec.pos1.y, 0),
          0,
        ),
        new THREE.Vector3(
          this._evalPathNum(trajSpec.pos2.x, 0),
          this._evalPathNum(trajSpec.pos2.y, 0),
          0,
        ),
      ];
      extrudeMm = displayMm;
    } else {
      const built = cldPathBuildTrajectoryMm({
        parentSizeMm: parentSize,
        parentOrient,
        pathOrient,
        direction: dir,
        dz,
        dz2,
        THREE,
      });
      displayMm = built.displayMm;
      extrudeMm = built.extrudeMm;
    }
    this.calculated.trajectory = displayMm;
    return cldPathCurveFromMm(extrudeMm, UNITS_MM, THREE);
  }

  _makeExtrudeGeometry() {
    const shape = this._create_shape();
    const curve = this._build_trajectory();
    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 20,
      bevelEnabled: false,
      extrudePath: curve,
    });
    const p = this.config || {};
    const pathOrient = String(p.spec?.orientation || 'h').toLowerCase() === 'v' ? 'v' : 'h';
    const dir = String(p.spec?.direction || '-z').toLowerCase();
    cldPathApplyExtrudeOrientation(geo, {
      THREE,
      parentOrient: this._parentPanelOrient(),
      pathOrient,
      direction: dir,
      parentSizeMm: this._parentGeomSizeMm(),
      unitsMm: UNITS_MM,
    });
    return geo;
  }

  _normalizeGrooveMeta() {
    const p = this.config || {};
    const size = this.calculated?.size || new THREE.Vector3(5, 4, 0);
    const pathOrient = String(p.spec?.orientation || 'h').toLowerCase() === 'v' ? 'v' : 'h';
    const ox = this._evalPathNum(p.pos?.x ?? 0, 0);
    const oy = this._evalPathNum(p.pos?.y ?? 0, 0);
    const offsetAlongMm = pathOrient === 'v' ? ox : oy;
    const traj = Array.isArray(this.calculated?.trajectory)
      ? this.calculated.trajectory.map((v) => ({
          x: Number(v.x) || 0,
          y: Number(v.y) || 0,
          z: Number(v.z) || 0,
        }))
      : null;
    return {
      kind: 'path',
      name: String(p.name || 'Паз'),
      pathType: String(p.spec?.type || 'common'),
      widthMm: Number(size.y) > 0 ? Number(size.y) : 4,
      depthMm: Number(size.x) > 0 ? Number(size.x) : 5,
      offsetAlongMm: Number.isFinite(offsetAlongMm) ? offsetAlongMm : 10,
      trajOrient: pathOrient,
      direction: String(p.spec?.direction || '-z'),
      dz: this._evalPathNum(p.spec?.dz ?? 0, 0),
      dz2: this._evalPathNum(p.spec?.dz_2 ?? p.spec?.dz2 ?? 0, 0),
      frontSide: p.spec?.frontSide === true,
      trajectory: traj,
      sectionPoints: Array.isArray(this.calculated?.path_points)
        ? this.calculated.path_points
        : null,
      posMm: {
        x: ox,
        y: oy,
        z: this._evalPathNum(p.pos?.z ?? 0, 0),
      },
    };
  }

  _stampParentGrooves(meta) {
    let wall = this.userData?.parent;
    for (let i = 0; i < 8 && wall; i++) {
      const t = String(wall.config?.type || '').toLowerCase();
      const hasOrient = !!wall.userData?.__cldPanelOrientation;
      if (t === 'wall' || t === 'facade' || hasOrient) {
        const stamp = (obj) => {
          if (!obj?.userData) return;
          const list = Array.isArray(obj.userData.__cldGrooves)
            ? obj.userData.__cldGrooves.filter((g) => !(g && g.kind === 'path' && g.name === meta.name))
            : [];
          list.push(meta);
          obj.userData.__cldGrooves = list;
        };
        stamp(wall);
        if (typeof wall.traverse === 'function') {
          wall.traverse((ch) => {
            if (ch.isMesh && /_core$/i.test(String(ch.name || ''))) stamp(ch);
          });
        }
        return wall;
      }
      wall = wall.userData?.parent || wall.parent;
    }
    return null;
  }

  /** Реф _build_helpers: Extrude + WireframeGeometry (cyan). */
  _buildPathHelper() {
    const helpers = this.userData.helpers;
    if (!helpers) return;

    for (let i = helpers.children.length - 1; i >= 0; i--) {
      const ch = helpers.children[i];
      if (ch?.userData?.pathGrooveHelper) {
        helpers.remove(ch);
        if (ch.geometry) ch.geometry.dispose?.();
        if (ch.material) ch.material.dispose?.();
      }
    }

    let geo;
    try {
      geo = this._makeExtrudeGeometry();
    } catch (e) {
      console.warn('[CLD][path] extrude helper failed', e);
      return;
    }

    const edges = new THREE.LineSegments(
      new THREE.WireframeGeometry(geo),
      new THREE.LineBasicMaterial({
        color: 0x33aaff,
        transparent: true,
        opacity: 1,
        depthTest: false,
      }),
    );
    edges.name = 'path_groove_helper_edges';
    edges.renderOrder = 20;
    edges.userData.pathGrooveHelper = true;
    edges.userData.is_helper = true;
    edges.visible = true;
    helpers.add(edges);
    helpers.visible = Number(this.config?.helpers_visible) !== 0;
    this.userData.path_helper_edges = edges;
    geo.dispose?.();
  }

  /** Реф _build_spec: solid Extrude в own_object (visible:false) + relative_points. */
  _build_spec() {
    const own = this.userData.own_object;
    if (own) {
      for (let i = own.children.length - 1; i >= 0; i--) {
        const ch = own.children[i];
        if (ch?.userData?.pathGrooveSolid) {
          own.remove(ch);
          ch.geometry?.dispose?.();
          ch.material?.dispose?.();
        }
      }
    }

    let geo;
    try {
      geo = this._makeExtrudeGeometry();
    } catch (e) {
      console.warn('[CLD][path] extrude solid failed', e);
      const meta = this._normalizeGrooveMeta();
      this.userData.__cldPathGroove = meta;
      this._stampParentGrooves(meta);
      this._buildPathHelper();
      return;
    }

    // Реф: translate(-size.x/2, -size.y/2, 0) после ориентаций — для own_object mesh.
    const sx = Number(this.calculated?.size?.x) || 0;
    const sy = Number(this.calculated?.size?.y) || 0;
    geo.translate(-sx / 2 / UNITS_MM, -sy / 2 / UNITS_MM, 0);

    const mat = new THREE.MeshBasicMaterial({
      color: 0x33aaff,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'path_groove_solid';
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.visible = false;
    mesh.userData.pathGrooveSolid = true;
    if (own) own.add(mesh);
    this.userData.path_solid = mesh;

    const meta = this._normalizeGrooveMeta();
    this.userData.__cldPathGroove = meta;
    this._stampParentGrooves(meta);
    this._buildPathHelper();
  }

  _build_helpers() {
    if (!this.userData.helpers) {
      this.userData.helpers = new THREE.Group();
      this.userData.helpers.name = '__helpers';
      this.add(this.userData.helpers);
    }
    this._buildPathHelper();
  }

  _show_helpers() {
    super._show_helpers();
    if (this.userData.helpers) this.userData.helpers.visible = true;
    if (this.userData.path_helper_edges) this.userData.path_helper_edges.visible = true;
  }

  _hide_helpers() {
    super._hide_helpers();
    if (Number(this.config?.helpers_visible) === 0) {
      if (this.userData.helpers) this.userData.helpers.visible = false;
    }
  }
}

class CabinetFurnitureNode extends CabinetNode {
  _resolveDrillTemplateIdWithAncestors() {
    // Refs: CabinetFurniture ищет по f['spec']['id'].
    // L-пакет: drillTemplateId / spec.id = id шаблона присадки (setupType=2).
    const spec = this.config?.spec || {};
    const candidates = [
      Number(spec.drillTemplateId || 0),
      Number(spec.drillingTemplateId || 0),
      Number(spec.templateId || 0),
      Number(spec.id || 0),
    ].filter((n) => Number.isFinite(n) && n > 0);

    const templates = _lsDrillTemplatesArr();
    const DR = globalThis.__CLD_DRILL_RESOLVE;
    if (DR && typeof DR.pickDrillTemplateIdFromCandidates === 'function') {
      const filtered = candidates.filter((specId) => {
        if (String(spec.id) === '3' && specId === 3 && !spec.drillTemplateId) return false;
        return true;
      });
      const tid = DR.pickDrillTemplateIdFromCandidates(filtered, templates);
      if (tid > 0) {
        const tpl = templates.find((t) => Number(t?.id) === tid);
        const isL =
          Number(tpl?.currentSetupType ?? tpl?.setupType) === 2 &&
          (Number(tpl?.facadeModelId) > 0 || Number(tpl?.corpusModelId) > 0);
        return {
          tid,
          via: isL ? 'spec.id/L-seam' : 'spec.id',
          candidates: [{ id: tid, via: 'spec.id' }],
        };
      }
    } else {
      for (const specId of candidates) {
        if (String(spec.id) === '3' && specId === 3 && !spec.drillTemplateId) continue;
        const tpl = templates.find((t) => Number(t?.id) === specId);
        if (!tpl) continue;
        const isL =
          Number(tpl.currentSetupType ?? tpl.setupType) === 2 &&
          (Number(tpl.facadeModelId) > 0 || Number(tpl.corpusModelId) > 0);
        if (tpl && Array.isArray(tpl.holes) && tpl.holes.length > 0) {
          return {
            tid: specId,
            via: 'spec.id',
            candidates: [{ id: specId, via: 'spec.id' }],
          };
        }
        if (tpl && tpl.holesBySetup && typeof tpl.holesBySetup === 'object') {
          const any = Object.values(tpl.holesBySetup).some((a) => Array.isArray(a) && a.length);
          if (any || isL) {
            return {
              tid: specId,
              via: isL ? 'spec.id/L-seam' : 'spec.id/holesBySetup',
              candidates: [{ id: specId, via: 'spec.id' }],
            };
          }
        }
        if (isL) {
          return {
            tid: specId,
            via: 'spec.id/L-seam',
            candidates: [{ id: specId, via: 'spec.id' }],
          };
        }
      }
    }

    const specId = Number(spec.id || 0);
    // scheme id -> templateId
    if (specId > 0) {
      const schemes = _lsJointSchemesArr();
      const sch = schemes.find((s) => Number(s?.id) === specId);
      const templateId = Number(sch?.templateId || 0);
      if (templateId > 0) {
        return {
          tid: templateId,
          via: `scheme(${specId})->template(${templateId})`,
          candidates: [{ id: templateId, via: 'scheme.templateId' }],
        };
      }
    }

    return { tid: 0, via: 'no-template-found', candidates: [] };
  }

  _before_build() {
    super._before_build();
    if (__cldIsHingeCatalogDrillPlaceholderNode(this.config, this.userData.parent)) {
      return;
    }

    const spec = this.config?.spec || {};
    const specId = spec.id;
    const dbg = window.__CLD_DEBUG_FURNI === true; // иначе спам в консоль на каждой сборке → лаги на фасадах
    const dbgBase = {
      path: this.userData?.path || '',
      name: this.config?.name || '',
      specId: specId,
      parent: this.userData?.parent?.config?.name || this.userData?.parent?.name || '',
    };
    if (dbg) console.log('[CLD][furniture][before_build] start', dbgBase);

    const kidsHaveHoles = (arr) =>
      Array.isArray(arr) &&
      arr.some((c) => c && String(c.type || '').toLowerCase() === 'hole');

    // Уже есть hole-дети в дереве — как в рефе, не перетираем.
    // Но 3D из шаблона (корпус + фасад L) всё равно подмешиваем, если model ещё нет.
    if (kidsHaveHoles(this.config.children)) {
      const resolvedTidKeep = this._resolveDrillTemplateIdWithAncestors();
      const tidKeep = resolvedTidKeep.tid;
      if (tidKeep) {
        const templatesKeep = _lsDrillTemplatesArr();
        const tplRawKeep = templatesKeep.find((t) => Number(t?.id) === tidKeep);
        const nodeSetupTypeKeep = Number(
          tplRawKeep?.currentSetupType ??
            tplRawKeep?.setupType ??
            this.config?.spec?.setupType ??
            this.config?.setupType ??
            this.config?.spec?.setup_type ??
            3
        );
        const tplKeep = _getDrillTemplateHolesInfoByTemplateId(tidKeep, nodeSetupTypeKeep);
        const hasModel = (this.config.children || []).some(
          (c) => c && String(c.type || '').toLowerCase() === 'model'
        );
        const modelsKeep = _drillTemplateModelChildrenFromInfo(tplKeep);
        if (modelsKeep.length && !hasModel) {
          this.config.children = [...(this.config.children || []), ...modelsKeep];
        }
      }
      if (dbg) console.log('[CLD][furniture][before_build] keep-existing-hole-children', {
        ...dbgBase,
        childrenCount: this.config.children.length,
      });
      return;
    }

    // Clodis: spec.id = id шаблона присадки (clodis_drilling_templates_v2).
    // Сначала LS — иначе fallback на catalog_31/любой каталог с тем же id подставляет чужие children
    // без type:hole → хелперы пустые при «типе выбран».
    const resolvedTid = this._resolveDrillTemplateIdWithAncestors();
    const tid = resolvedTid.tid;
    if (tid) {
      if (dbg) {
        console.log('[CLD][furniture][before_build] drill-template-resolved', {
          ...dbgBase,
          templateId: tid,
          via: resolvedTid.via,
        });
      }
      const templatesLs = _lsDrillTemplatesArr();
      const tplRaw = templatesLs.find((t) => Number(t?.id) === tid);
      const nodeSetupType = Number(
        tplRaw?.currentSetupType ??
          tplRaw?.setupType ??
          this.config?.spec?.setupType ??
          this.config?.setupType ??
          this.config?.spec?.setup_type ??
          3
      );
      const tplInfo = _getDrillTemplateHolesInfoByTemplateId(tid, nodeSetupType);
      const holes = tplInfo.holes || [];
      const modelChildrenFromTpl = _drillTemplateModelChildrenFromInfo(tplInfo);
      const cmId = Number(tplInfo.corpusModelId) || Number(tplInfo.cabinetModelId) || 0;
      if (holes.length) {
        const children = holes.map((h) => {
          const part = _cldClassifyLSeamHoleHingePart(h, tplInfo);
          return {
            type: 'hole',
            name: h.name || 'Hole',
            active: 1,
            size: {
              x: String(h.diameterMm ?? h.diameter ?? 0),
              y: String(h.diameterMm ?? h.diameter ?? 0),
              z: String(h.depthMm ?? h.depth ?? 0),
            },
            pos: {
              x: String(h.xMm ?? h.x ?? 0),
              y: String(h.yMm ?? h.y ?? 0),
              z: String(h.zMm ?? h.z ?? 0),
            },
            // СК шаблона: pivot панели не нужен — позиция = мм шаблона (как room / drill preview).
            pivot: { x: 0, y: 0, z: 0 },
            spec: {
              direction: h.dirKey || h.direction || '-z',
              global: 0,
              drill_template_local: 1,
              mountSide: h.mountSide || 'auto',
              hostPanel: h.hostPanel || 'auto',
              hingeDrillPart: part,
            },
          };
        });
        if (modelChildrenFromTpl.length) children.push(...modelChildrenFromTpl);
        this.config.children = children;

        // Size 0 → СК отверстий = мм шаблона (как в админ-превью / реф def_cabinet_furniture).
        // Дерево важнее LS: setup_type на узле Присадки не должен затираться чужим setupType шаблона.
        const setupFromTree =
          Number(
            this.config?.spec?.setup_type ??
              this.config?.spec?.setupType ??
              this.config?.setupType,
          ) || 0;
        const setupTypeResolved = setupFromTree || Number(tplInfo.setupType) || Number(nodeSetupType) || 0;
        const parentTypeExpand = String(this.userData?.parent?.config?.type || '').toLowerCase();
        const isLSeamTpl =
          setupTypeResolved === 2 && (Number(tplInfo.facadeModelId) || 0) > 0;
        const isSingleFace = _cldIsSingleFaceDrillSetup(setupTypeResolved);

        this.config.spec = {
          ...(this.config.spec && typeof this.config.spec === 'object' ? this.config.spec : {}),
          drill_template_local_cs: 1,
          setup_type: setupTypeResolved || undefined,
          setupType: setupTypeResolved || undefined,
        };
        this.config.size = { x: '0', y: '0', z: '0' };

        _cldEnsureFurnitureInstancePivot(
          this.config,
          this.userData?.parent?.config,
          setupTypeResolved,
        );
        if (isSingleFace) {
          // Дефолт рефа при добавлении; не затираем явный ненулевой pos пользователя.
          const px0 = this.config.pos?.x;
          const py0 = this.config.pos?.y;
          const pz0 = this.config.pos?.z;
          const posLooksDefault =
            (px0 == null || px0 === '' || px0 === 0 || px0 === '0') &&
            (py0 == null || py0 === '' || py0 === 0 || py0 === '0') &&
            (pz0 == null || pz0 === '' || pz0 === 0 || pz0 === '0');
          if (posLooksDefault || !this.config.pos) {
            this.config.pos = { x: 0, y: 0, z: 0 };
          }
        }
        if (isLSeamTpl) {
          this.config.pos = { x: 0, y: 0, z: 0 };
        }

        if (dbg) {
          console.log('[CLD][furniture][before_build] source=localStorageTemplate', {
            ...dbgBase,
            templateId: tid,
            templateName: tplInfo.templateName || '(unknown)',
            setupType: setupTypeResolved,
            holesRawCount: holes.length,
            childrenCount: this.config.children.length,
            cabinetModelId: cmId || 0,
            facadeModelId: Number(tplInfo.facadeModelId) || 0,
            size: this.config.size,
            pivot: this.config.pivot,
            pos: this.config.pos,
            parentType: parentTypeExpand,
            drill_template_local_cs: 1,
          });
        }
        return;
      }
      // Только 3D из шаблона (без отверстий в LS) — всё равно ставим model(и).
      if (modelChildrenFromTpl.length) {
        this.config.children = modelChildrenFromTpl;
        const setupTypeResolved2 = Number(tplInfo.setupType) || Number(nodeSetupType) || 0;
        this.config.spec = {
          ...(this.config.spec && typeof this.config.spec === 'object' ? this.config.spec : {}),
          drill_template_local_cs: 1,
          setup_type: setupTypeResolved2 || undefined,
          setupType: setupTypeResolved2 || undefined,
        };
        this.config.size = { x: '0', y: '0', z: '0' };
        _cldEnsureFurnitureInstancePivot(
          this.config,
          this.userData?.parent?.config,
          setupTypeResolved2,
        );
        if (_cldIsSingleFaceDrillSetup(setupTypeResolved2)) {
          this.config.pos = this.config.pos || { x: 0, y: 0, z: 0 };
        }
        if (
          setupTypeResolved2 === 2 &&
          (Number(tplInfo.facadeModelId) || 0) > 0
        ) {
          this.config.pos = { x: 0, y: 0, z: 0 };
        }
        if (dbg) {
          console.log('[CLD][furniture][before_build] source=localStorageTemplate-model-only', {
            ...dbgBase,
            templateId: tid,
            cabinetModelId: cmId,
            facadeModelId: Number(tplInfo.facadeModelId) || 0,
          });
        }
        return;
      }
      if (dbg) {
        console.log('[CLD][furniture][before_build] template-has-no-holes', {
          ...dbgBase,
          tid,
          templateName: tplInfo.templateName,
        });
      }
    }

    // Реф: только библиотека furniture (не catalog_31 / чужие каталоги с тем же id).
    let usedCatalog = false;
    if (specId) {
      const catalogItem = _getFurnitureCatalogItem(specId);
      if (catalogItem?.children?.length) {
        this.config.children = JSON.parse(JSON.stringify(catalogItem.children));
        if (catalogItem.size) {
          this.config.size = { ...(this.config.size || {}), ...catalogItem.size };
        }
        usedCatalog = true;
        if (dbg) {
          console.log('[CLD][furniture][before_build] source=catalog', {
            ...dbgBase,
            childrenCount: this.config.children.length,
            size: this.config.size,
            catalogHasChildren: true,
          });
        }
      } else if (catalogItem) {
        if (dbg) {
          console.log('[CLD][furniture][before_build] catalog-entry-exists-but-no-children', {
            ...dbgBase,
            catalogKeys: Object.keys(catalogItem),
          });
        }
      }
      if (!kidsHaveHoles(this.config.children)) {
        const fallbackCatalogItem = __cldGetCatalogItemDataById('furniture', specId);
        if (fallbackCatalogItem?.children?.length) {
          this.config.children = JSON.parse(JSON.stringify(fallbackCatalogItem.children));
          if (fallbackCatalogItem.size) {
            this.config.size = { ...(this.config.size || {}), ...fallbackCatalogItem.size };
          }
          usedCatalog = true;
          if (dbg) {
            console.log('[CLD][furniture][before_build] source=windowCatalogData.furniture', {
              ...dbgBase,
              childrenCount: this.config.children.length,
              size: this.config.size,
            });
          }
        }
      }
    }

    if (!tid && dbg) {
      console.log('[CLD][furniture][before_build] no-drill-template', {
        ...dbgBase,
        specKeys: Object.keys(spec),
        configKeys: Object.keys(this.config || {}),
        tidVia: resolvedTid.via || '(none)',
        tidCandidates: (resolvedTid.candidates || []).map((x) => `${x.via}:${x.id}`),
        usedCatalog,
        childrenCount: Array.isArray(this.config.children) ? this.config.children.length : 0,
      });
    }
  }

  _build_spec() {
    // Реф: общий бокс на весь furniture не рисуем — подсветка по каждому CabinetHole (part13 show_helpers).

    // Как в референсе: CabinetFurniture._build_spec пустой.
    // Отладочную визуализацию отверстий включаем только при явном флаге.
    let dbg = false;
    try {
      dbg = typeof window !== 'undefined' && window.__CLD_DEBUG_FURNI_HOLES === true;
    } catch (_) {}
    if (!dbg) return;

    const children = this.config?.children || [];
    if (children.length === 0) return;

    console.log('[CLD][furniture][_build_spec][debug] creating holes directly, count=', children.length);

    children.forEach((childSpec, i) => {
      if (childSpec.type !== 'hole') return;

      const rs = new THREE.Vector3(
        Number(childSpec.size?.x || 35),
        Number(childSpec.size?.x || 35),
        Number(childSpec.size?.z || 12)
      );
      const urs = rs.clone().divideScalar(UNITS_MM);
      const radius = rs.x / 2 / UNITS_MM;
      const height = rs.z / UNITS_MM;
      const dir = childSpec.spec?.direction || '-z';

      const geom = new THREE.CylinderGeometry(radius, radius, height, 32);
      switch (dir) {
        case 'x': geom.rotateZ(Math.PI / 2).translate(-urs.z / 2, 0, 0); break;
        case '-x': geom.rotateZ(-Math.PI / 2).translate(urs.z / 2, 0, 0); break;
        case 'y': geom.translate(0, -urs.z / 2, 0); break;
        case '-y': geom.translate(0, urs.z / 2, 0); break;
        case 'z': geom.rotateX(Math.PI / 2).translate(0, 0, -urs.z / 2); break;
        case '-z':
        default: geom.rotateX(-Math.PI / 2).translate(0, 0, urs.z / 2); break;
      }

      const mat = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.95,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.name = `hole_direct_${i}`;
      mesh.userData.isAccessory = true;
      mesh.renderOrder = 20;

      const pos = childSpec.pos || {};
      mesh.position.set(
        Number(pos.x || 0) / UNITS_MM,
        Number(pos.y || 0) / UNITS_MM,
        Number(pos.z || 0) / UNITS_MM
      );

      this.userData.own_object.add(mesh);

      const box = make_cube(
        urs.x * 1.1,
        urs.y * 1.1,
        urs.z * 1.1,
        new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.15, depthTest: false })
      );
      box.name = `hole_box_${i}`;
      box.renderOrder = 19;
      box.position.copy(mesh.position);
      this.userData.own_object.add(box);
    });
  }

  /**
   * : show_helpers — для CabinetFurniture перебирать детей CabinetHole
   * arrow.visible = true и hole._show_helpers() (куб каждого отверстия).
   */
  _show_helpers() {
    super._show_helpers();
    const kids = this.userData.cabinet_child_nodes || [];
    const holes = kids.filter((c) => c && String(c.config?.type || '').toLowerCase() === 'hole');
    __cldSelLog({
      step: 'CabinetFurnitureNode._show_helpers',
      path: this.userData?.path,
      childCount: kids.length,
      holeCount: holes.length,
      willHighlightHoles: holes.length > 0,
    });
    for (const ch of kids) {
      if (!ch || String(ch.config?.type || '').toLowerCase() !== 'hole') continue;
      if (typeof ch._show_helpers === 'function') ch._show_helpers();
      // Включаем после _show_helpers hole-узла, чтобы не перезатиралось локальной логикой.
      if (ch.userData?.arrow) ch.userData.arrow.visible = true;
      if (ch.userData?.hole_cylinder && typeof ch._isDrillTemplateLocalHole === 'function' && ch._isDrillTemplateLocalHole()) {
        ch.userData.hole_cylinder.visible = true;
      }
    }
  }

  _hide_helpers() {
    super._hide_helpers();
    const kids = this.userData.cabinet_child_nodes || [];
    for (const ch of kids) {
      if (!ch || String(ch.config?.type || '').toLowerCase() !== 'hole') continue;
      if (ch.userData?.arrow) ch.userData.arrow.visible = false;
      if (typeof ch._hide_helpers === 'function') ch._hide_helpers();
    }
  }

  /**
   * L-пакет в превью: в карточке — СК шаблона присадки (без R_place);
   * на thin facade / роли — R_place + detach как для шкафа.
   */
  _after_build() {
    super._after_build();
    this._finalizeLSeamPackagePreviewAssembly();
  }

  _finalizeLSeamPackagePreviewAssembly() {
    const kids = this.userData?.cabinet_child_nodes;
    if (!Array.isArray(kids) || !kids.length) return;

    const tid = Number(this.config?.spec?.drillTemplateId || this.config?.spec?.id) || 0;
    const tpl =
      tid > 0 ? _lsDrillTemplatesArr().find((t) => Number(t?.id) === tid) : null;
    const setupType = Number(tpl?.currentSetupType ?? tpl?.setupType) || 0;
    const isLPackage =
      setupType === 2 && (Number(tpl?.facadeModelId) || 0) > 0;
    if (!isLPackage) return;

    const models = kids.filter((k) => {
      if (!k || String(k.config?.type || '').toLowerCase() !== 'model') return false;
      return Number(k.config?.spec?.from_drill_template) === 1;
    });
    if (!models.length) return;
    const hasFacade = models.some((m) => m.config?.spec?.hingePart === 'facade');
    const hasCorpus = models.some((m) => m.config?.spec?.hingePart === 'corpus');
    if (!(hasCorpus && hasFacade)) return;

    const own = this.userData?.own_object;
    if (!own) return;

    const underThin = _cldNodeUnderThinFacadeShell(this);
    // Накладной шов (роли/шкаф): origin уже на внутренней пласти — dock к кромке двери ломает.
    let overlaySeam = false;
    let p = this.userData?.parent;
    for (let i = 0; i < 12 && p; i++) {
      const sp = p.config?.spec;
      if (Number(sp?.cldOverlaySeamLayout) === 1 || Number(sp?.cldOverlaySeamXMm) > 0) {
        overlaySeam = true;
        break;
      }
      p = p.userData?.parent;
    }

    // Карточка / превью элемента: СК как в админ-превью шаблона присадки (оба GLB + отверстия).
    // R_place + detach — только когда пакет садится на фасад шкафа/ролей (тонкая оболочка).
    const needCabinetPlace =
      underThin ||
      !!__cldHingeRolePreview ||
      !!__cldHingeRoleVirtualSide ||
      overlaySeam;

    this.userData = this.userData || {};
    this.userData.cldHingeLSeamPackage = true;

    if (!needCabinetPlace) {
      // Голая карточка: СК = шаблон. Без R_place и без detach на hinge_animator —
      // иначе фасад в СК аниматора, корпус на Присадке → разлёт (как уже ловили).
      // Распашка фасада на карточке — отдельный шаг (нужен общий origin аниматора/Присадки).
      try {
        own.quaternion.identity();
        own.rotation.set(0, 0, 0);
        if (own.userData) delete own.userData.cldLSeamRPlaceApplied;
      } catch (_) {}
      this.userData.cldLSeamRPlaceEdge = 'template_cs';
      this.userData.cldLSeamSkipCabinetPlace = true;
      this.userData.cldLSeamFacadeOnDoorSwing = false;
      console.warn('[CLD][L-SEAM] template CS (card, no detach)', {
        furniture: this.config?.name,
        templateId: tid,
        models: models.length,
      });
      return;
    }

    let animDir = 'ly';
    const parent = this.userData?.parent;
    const siblings = parent?.userData?.cabinet_child_nodes;
    if (Array.isArray(siblings)) {
      for (const s of siblings) {
        if (!_cldIsHingeCupAnimatorNode(s)) continue;
        const props = s.config?.spec?.props || {};
        animDir = String(props.direction || s.config?.spec?.opening || 'ly');
        break;
      }
    }

    const edge = _cldApplyLSeamTemplatePlacementRotation(own, animDir);
    this.userData.cldLSeamRPlaceEdge = edge;
    if (underThin && !__cldHingeRoleVirtualSide && !overlaySeam) {
      // Только door-only / без бока: R_place уводит корпус в −X в пустоту.
      _cldDockLSeamPackageToThinFacadeSeam(this, edge);
      const self = this;
      const redo = () => {
        try {
          _cldDockLSeamPackageToThinFacadeSeam(self, edge);
        } catch (_) {}
      };
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => requestAnimationFrame(redo));
      }
      setTimeout(redo, 200);
      setTimeout(redo, 800);
    }
    // Как в комнате: чашка на hinge_animator. Retry — sibling animator может собраться позже.
    const selfFurni = this;
    const redoDetach = () => {
      try {
        _cldDetachLSeamFacadeModelsToHingeAnimator(selfFurni, models);
      } catch (_) {}
    };
    const moved = _cldDetachLSeamFacadeModelsToHingeAnimator(this, models);
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => requestAnimationFrame(redoDetach));
    }
    setTimeout(redoDetach, 50);
    setTimeout(redoDetach, 300);
    console.warn('[CLD][L-SEAM] R_place', {
      furniture: this.config?.name,
      templateId: tid,
      edge,
      animDir,
      underThinFacade: underThin,
      overlaySeam,
      facadeToAnimator: moved,
      hingeRolePreview: __cldHingeRolePreview,
      hingeRoleVirtualSide: __cldHingeRoleVirtualSide,
    });
  }
}

/**
 * L-пакет (iframe): фасадные model-дети Присадки → own hinge_animator (world-поза через attach).
 * Корпус остаётся на Присадке. Дверь с id hinge_animator + type:facade — не цель.
 */
function _cldIsHingeCupAnimatorNode(node) {
  if (!(node instanceof CabinetAnimatorNode)) return false;
  if (String(node.config?.id || '').toLowerCase() !== 'hinge_animator') return false;
  const kids = node.userData?.cabinet_child_nodes;
  if (Array.isArray(kids) && kids.some((c) => c && String(c.config?.type || '').toLowerCase() === 'facade')) {
    return false;
  }
  const cfgKids = node.config?.children;
  if (
    Array.isArray(cfgKids) &&
    cfgKids.some((c) => c && String(c.type || '').toLowerCase() === 'facade')
  ) {
    return false;
  }
  return true;
}

/** Отверстие L-пакета на полотне (едет с дверью), не корпусные. */
function _cldIsLSeamFacadeSwingHoleNode(node) {
  if (!node) return false;
  const t = String(node.config?.type || '').toLowerCase();
  const isHole =
    t === 'hole' ||
    (typeof CabinetHoleNode !== 'undefined' && node instanceof CabinetHoleNode) ||
    !!node.userData?.isHole ||
    /^Hole_/i.test(String(node.name || ''));
  if (!isHole) return false;
  const spec = node.config?.spec || node.userData?.holeSpec || {};
  const host = String(spec.hostPanel || spec.mountSide || '').toLowerCase().trim();
  if (
    host === 'door' ||
    host === 'corpus' ||
    host === 'horizontal' ||
    host === 'horiz' ||
    host === 'h' ||
    host === 'body'
  ) {
    return false;
  }
  if (host === 'facade' || host === 'vertical' || host === 'vert' || host === 'v') {
    return true;
  }
  const part = String(
    spec.hingeDrillPart ||
      spec.hingePart ||
      node.userData?.hingeDrillPart ||
      node.userData?.hingePart ||
      ''
  ).toLowerCase();
  if (part === 'facade') return true;
  if (part === 'door' || part === 'corpus') return false;
  const dir = String(spec.direction || spec.dirKey || '').toLowerCase().trim();
  if (dir === 'x' || dir === '-x') return true;
  if (dir === 'y' || dir === '-y') return false;
  return false;
}

function _cldDetachLSeamFacadeModelsToHingeAnimator(furnitureNode, facadeOrAllModels) {
  if (!furnitureNode || typeof THREE === 'undefined') return 0;
  const models = Array.isArray(facadeOrAllModels) ? facadeOrAllModels : [];
  const facades = models.filter(
    (m) => m && String(m.config?.spec?.hingePart || '').toLowerCase() === 'facade'
  );

  let anim = null;
  const parent = furnitureNode.userData?.parent;
  const siblings = parent?.userData?.cabinet_child_nodes;
  if (Array.isArray(siblings)) {
    for (const s of siblings) {
      if (!_cldIsHingeCupAnimatorNode(s)) continue;
      anim = s;
      break;
    }
  }
  if (!anim) {
    let mod = parent;
    for (let i = 0; i < 8 && mod && !anim; i++) {
      const kids = mod.userData?.cabinet_child_nodes;
      if (Array.isArray(kids)) {
        for (const s of kids) {
          if (!_cldIsHingeCupAnimatorNode(s)) continue;
          anim = s;
          break;
        }
      }
      if (!anim && typeof mod.traverse === 'function') {
        mod.traverse((o) => {
          if (anim) return;
          if (!_cldIsHingeCupAnimatorNode(o)) return;
          anim = o;
        });
      }
      mod = mod.userData?.parent || null;
    }
  }
  if (!anim) return 0;

  const target = anim.userData?.own_object || anim.userData?.animator_object || anim;
  if (!target) return 0;

  // Фасадные дырки шаблона — под Присадкой (фикс); чашка уже на animator → дырки не крутятся.
  const facadeHoles = [];
  const seenHole = new Set();
  const pushHole = (h) => {
    if (!h || seenHole.has(h)) return;
    seenHole.add(h);
    facadeHoles.push(h);
  };
  const kids = furnitureNode.userData?.cabinet_child_nodes;
  if (Array.isArray(kids)) {
    for (const k of kids) {
      if (_cldIsLSeamFacadeSwingHoleNode(k)) pushHole(k);
    }
  }
  if (typeof furnitureNode.traverse === 'function') {
    furnitureNode.traverse((o) => {
      if (_cldIsLSeamFacadeSwingHoleNode(o)) pushHole(o);
    });
  }

  if (!facades.length && !facadeHoles.length) return 0;

  const underTarget = (obj) => {
    let p = obj;
    while (p) {
      if (p === target || p === anim) return true;
      p = p.parent;
    }
    return false;
  };

  let moved = 0;
  const attachKeepWorld = (obj) => {
    if (!obj || underTarget(obj)) return;
    try {
      obj.updateMatrixWorld?.(true);
      target.updateMatrixWorld?.(true);
      target.attach(obj);
      moved += 1;
    } catch (_) {}
  };
  for (const f of facades) attachKeepWorld(f);
  for (const h of facadeHoles) attachKeepWorld(h);

  if (moved) {
    const markPick = (root) => {
      if (!root || typeof root.traverse !== 'function') return;
      root.traverse((o) => {
        if (!o?.isMesh) return;
        o.userData = o.userData || {};
        o.userData.cldDoorPick = true;
      });
    };
    for (const f of facades) markPick(f);
    for (const h of facadeHoles) markPick(h);
    markPick(anim.userData?.animator_object);
  }
  return moved;
}

/**
 * L-пакет: отверстие → фасад (вертикаль) или корпус (горизонталь).
 * СК шаблона setupType=2: X = N_facade (вертикаль), Y = N_body (горизонталь).
 * Направление сверления задаёт деталь: ±X → вертикаль (едет), ±Y → горизонталь (стоит).
 * hostPanel — только явный override из админки; радиус/Ø-эвристики не используем.
 */
function _cldNormalizeHoleHostPanel(raw) {
  const DR = globalThis.__CLD_DRILL_RESOLVE;
  if (DR && typeof DR.normalizeHoleHostPanel === 'function') {
    return DR.normalizeHoleHostPanel(raw);
  }
  return 'auto';
}

function _cldClassifyLSeamHoleHingePart(hole, tplInfo) {
  const DR = globalThis.__CLD_DRILL_RESOLVE;
  if (DR && typeof DR.classifyLSeamHoleHingePart === 'function') {
    return DR.classifyLSeamHoleHingePart(hole, tplInfo);
  }
  return 'corpus';
}

/**
 * L-пакет (setupType=2): R_place — thin wrappers → __CLD_DRILL_RESOLVE (этап 4).
 */
function _cldLSeamEdgeFromAnimatorDirection(dir) {
  const DR = globalThis.__CLD_DRILL_RESOLVE;
  if (DR && typeof DR.lSeamEdgeFromAnimatorDirection === 'function') {
    return DR.lSeamEdgeFromAnimatorDirection(dir);
  }
  return 'left';
}

function _cldLSeamTplToCabinetEdgeCfg(edge) {
  const DR = globalThis.__CLD_DRILL_RESOLVE;
  if (DR && typeof DR.lSeamTplToCabinetEdgeCfg === 'function') {
    return DR.lSeamTplToCabinetEdgeCfg(edge);
  }
  return { nf: [0, 0, -1], nb: [1, 0, 0], s: [0, -1, 0] };
}

function _cldLSeamTplToCabinetMatrix4(edge = 'left') {
  const place = globalThis.__cldLSeamPlacement;
  if (place && typeof place.matrix4 === 'function') {
    const m = place.matrix4(edge);
    if (m) return m;
  }
  const ec = _cldLSeamTplToCabinetEdgeCfg(edge);
  return new THREE.Matrix4().set(
    ec.nf[0],
    ec.nb[0],
    ec.s[0],
    0,
    ec.nf[1],
    ec.nb[1],
    ec.s[1],
    0,
    ec.nf[2],
    ec.nb[2],
    ec.s[2],
    0,
    0,
    0,
    0,
    1
  );
}

/** Применить R_place к Object3D (own_object Присадки). */
function _cldApplyLSeamTemplatePlacementRotation(obj, edgeOrDir = 'left') {
  const DR = globalThis.__CLD_DRILL_RESOLVE;
  if (DR && typeof DR.applyLSeamTemplatePlacementRotation === 'function') {
    return DR.applyLSeamTemplatePlacementRotation(obj, edgeOrDir);
  }
  const place = globalThis.__cldLSeamPlacement;
  if (place && typeof place.applyToObject === 'function' && place.applyToObject !== _cldApplyLSeamTemplatePlacementRotation) {
    return place.applyToObject(obj, edgeOrDir);
  }
  return null;
}

try {
  // Fallback только если cld-drill-resolve ещё не выставил API (не затирать канон).
  if (
    typeof globalThis !== 'undefined' &&
    !(
      globalThis.__cldLSeamPlacement &&
      typeof globalThis.__cldLSeamPlacement.applyToObject === 'function'
    )
  ) {
    globalThis.__cldLSeamPlacement = {
      edgeFromDir: _cldLSeamEdgeFromAnimatorDirection,
      matrix4: _cldLSeamTplToCabinetMatrix4,
      applyToObject: _cldApplyLSeamTemplatePlacementRotation,
    };
  }
} catch (_) {}

/** Превью ролей / facades_*: оболочка ≤40 мм — R_place ломает уже «дверную» СК. */
function _cldNodeUnderThinFacadeShell(node) {
  let p = node;
  for (let i = 0; i < 16 && p; i++) {
    const sz =
      p?.calculated?.size ||
      p?.calculated?.c_object?.size ||
      (p?.config?.size && typeof p.config.size === 'object' ? p.config.size : null);
    let z = Number(sz?.z);
    if (!Number.isFinite(z) || z <= 0) {
      const raw = p?.config?.size?.z;
      if (typeof raw === 'number') z = raw;
      else if (typeof raw === 'string' && /^-?\d+(\.\d+)?$/.test(raw.trim())) z = Number(raw);
    }
    if (Number.isFinite(z) && z > 0 && z <= 40) return true;
    p = p.userData?.parent || null;
  }
  return false;
}

/**
 * Thin-facade (роли): после R_place корпус уходит в −X в пустоту → «отлет» от фасада.
 * Шов = world-позиция module-own (не Присадки после предыдущего dock — иначе уезжает вправо).
 * Сдвигаем furniture own так, чтобы bbox касался шва.
 */
function _cldDockLSeamPackageToThinFacadeSeam(furnitureNode, edgeOrDir) {
  if (!furnitureNode || typeof THREE === 'undefined') return;
  if (!_cldNodeUnderThinFacadeShell(furnitureNode)) return;
  const own = furnitureNode.userData?.own_object;
  if (!own) return;

  const edge =
    edgeOrDir === 'left' ||
    edgeOrDir === 'right' ||
    edgeOrDir === 'top' ||
    edgeOrDir === 'bottom'
      ? edgeOrDir
      : _cldLSeamEdgeFromAnimatorDirection(edgeOrDir);

  let mod = furnitureNode;
  for (let i = 0; i < 12 && mod; i++) {
    if (__cldIsHingeModuleSpec(mod.config?.spec)) break;
    mod = mod.userData?.parent || null;
  }
  const seamObj =
    (mod && __cldIsHingeModuleSpec(mod.config?.spec) && (mod.userData?.own_object || mod)) ||
    own;

  own.updateMatrixWorld(true);
  seamObj.updateMatrixWorld?.(true);
  const box = new THREE.Box3().setFromObject(own);
  if (!box || box.isEmpty()) return;

  const seam = new THREE.Vector3();
  if (typeof seamObj.getWorldPosition === 'function') seamObj.getWorldPosition(seam);
  else seam.copy(own.getWorldPosition(new THREE.Vector3()));

  const shiftWorld = new THREE.Vector3();
  if (edge === 'left') {
    shiftWorld.x = seam.x - box.max.x;
    shiftWorld.z = seam.z - box.max.z;
  } else if (edge === 'right') {
    shiftWorld.x = seam.x - box.min.x;
    shiftWorld.z = seam.z - box.max.z;
  } else if (edge === 'top') {
    shiftWorld.y = seam.y - box.min.y;
    shiftWorld.z = seam.z - box.max.z;
  } else if (edge === 'bottom') {
    shiftWorld.y = seam.y - box.max.y;
    shiftWorld.z = seam.z - box.max.z;
  } else {
    return;
  }

  const shiftMm = {
    x: shiftWorld.x * UNITS_MM,
    y: shiftWorld.y * UNITS_MM,
    z: shiftWorld.z * UNITS_MM,
  };
  if (Math.abs(shiftMm.x) < 0.5 && Math.abs(shiftMm.y) < 0.5 && Math.abs(shiftMm.z) < 0.5) {
    return;
  }

  const parent = own.parent;
  if (!parent) return;
  parent.updateMatrixWorld(true);
  const w0 = own.getWorldPosition(new THREE.Vector3());
  const w1 = w0.clone().add(shiftWorld);
  const l0 = parent.worldToLocal(w0.clone());
  const l1 = parent.worldToLocal(w1.clone());
  own.position.x += l1.x - l0.x;
  own.position.y += l1.y - l0.y;
  own.position.z += l1.z - l0.z;
  own.updateMatrixWorld(true);
  own.userData = own.userData || {};
  own.userData.cldLSeamThinDockMm = shiftMm;
  console.warn('[CLD][L-SEAM] dock thin→seam', { edge, shiftMm });
}

// CabinetFurniture в референсе наследует поведение от CabinetSection (не от FillNode).
// В clean-room коде это соответствует CabinetSectionNode.
CabinetFurnitureNode.prototype._build_size = CabinetSectionNode.prototype._build_size;
CabinetFurnitureNode.prototype._cldFacadeThicknessFromAnimator =
  CabinetSectionNode.prototype._cldFacadeThicknessFromAnimator;
CabinetFurnitureNode.prototype._build_direction =
  CabinetSectionNode.prototype._build_direction || CabinetFillNode.prototype._build_direction;

/**
 * Одна линия посадки присадки (Базис Face / PlanPlace тип 1–4):
 *   origin_шаблона = якорь_на_хосте × parentSize/2 + pos
 * Хост любой: section / wall / model — меняется только кто даёт size/СК.
 * Тип 2 (L) и схемы стыка сюда не входят.
 * Источник правды: js/cld-drill-resolve.js (__CLD_DRILL_RESOLVE).
 */
function _cldIsSingleFaceDrillSetup(setupType) {
  const DR = globalThis.__CLD_DRILL_RESOLVE;
  if (DR && typeof DR.isSingleFaceDrillSetup === 'function') {
    return DR.isSingleFaceDrillSetup(setupType);
  }
  const st = Number(setupType) || 0;
  return st === 1 || st === 4;
}

function _cldFurniturePivotLooksSet(pivot) {
  const DR = globalThis.__CLD_DRILL_RESOLVE;
  if (DR && typeof DR.pivotLooksAuthored === 'function') {
    return DR.pivotLooksAuthored(pivot);
  }
  return !!(
    pivot &&
    typeof pivot === 'object' &&
    (pivot.x != null || pivot.y != null || pivot.z != null)
  );
}

function _cldHostAnchorOriginMm(pivot, posMm, parentSizeMm, defaultPiv) {
  const DR = globalThis.__CLD_DRILL_RESOLVE;
  if (DR && typeof DR.hostAnchorOriginMm === 'function') {
    return DR.hostAnchorOriginMm(pivot, posMm, parentSizeMm, defaultPiv);
  }
  const d = Number.isFinite(Number(defaultPiv)) ? Number(defaultPiv) : -1;
  const ax = Number(pivot?.x);
  const ay = Number(pivot?.y);
  const az = Number(pivot?.z);
  const pivX = Number.isFinite(ax) ? ax : d;
  const pivY = Number.isFinite(ay) ? ay : d;
  const pivZ = Number.isFinite(az) ? az : d;
  const sx = Number(parentSizeMm?.x) || 0;
  const sy = Number(parentSizeMm?.y) || 0;
  const sz = Number(parentSizeMm?.z) || 0;
  const px = Number(posMm?.x) || 0;
  const py = Number(posMm?.y) || 0;
  const pz = Number(posMm?.z) || 0;
  return {
    x: pivX * sx * 0.5 + px,
    y: pivY * sy * 0.5 + py,
    z: pivZ * sz * 0.5 + pz,
  };
}

/** Init pivot инстанса: не затирать UI; дефолт один раз. */
function _cldEnsureFurnitureInstancePivot(config, parentConfig, setupType) {
  if (!config || typeof config !== 'object') return;
  const parentType = String(parentConfig?.type || '').toLowerCase();
  if (_cldFurniturePivotLooksSet(config.pivot)) return;
  if (_cldIsSingleFaceDrillSetup(setupType)) {
    const pp = parentConfig?.pivot;
    config.pivot =
      pp && typeof pp === 'object'
        ? {
            x: Number.isFinite(Number(pp.x)) ? Number(pp.x) : -1,
            y: Number.isFinite(Number(pp.y)) ? Number(pp.y) : -1,
            z: Number.isFinite(Number(pp.z)) ? Number(pp.z) : -1,
          }
        : { x: -1, y: -1, z: -1 };
    return;
  }
  if (parentType === 'wall') {
    config.pivot = { x: -1, y: -1, z: -1 };
    return;
  }
  // model / animator / section: ноль шаблона = origin хоста, пока пользователь не задал якорь.
  config.pivot = { x: 0, y: 0, z: 0 };
}

/**
 * Хост присадки — через __CLD_DRILL_RESOLVE.resolveFurnitureDrillPlacement
 * (комната = превью; model без 1/4 → сырой pos).
 * Стык joint_template_frame: pos = мм в локали own_object панели (= worldEntry), БЕЗ BLB.
 */
CabinetFurnitureNode.prototype._build_pos = function _cldFurnitureHostLocalBuildPos() {
  const p = this.config || {};
  const jointFrame =
    !!p.fromJointScheme && Number(p.spec?.joint_template_frame) === 1;
  const c = this.calculated?.c_object || {};
  const parentSize = c.parent_size || new THREE.Vector3();
  const sectionSize = c.parent_size || c.root_size || new THREE.Vector3();
  const ctx = {
    sizes: { x: sectionSize.x, y: sectionSize.y, z: sectionSize.z },
    vars: c.vars || {},
  };
  let px = evalExpr(p.pos?.x ?? 0, ctx);
  let py = evalExpr(p.pos?.y ?? 0, ctx);
  let pz = evalExpr(p.pos?.z ?? 0, ctx);

  if (jointFrame) {
    // Актуальный кадр с worldEntry → host-local мм (без ±parentSize/2).
    const frame = _liveJointTemplateFrameForFurniture(this);
    if (frame?.pos) {
      px = Number(frame.pos.x) || 0;
      py = Number(frame.pos.y) || 0;
      pz = Number(frame.pos.z) || 0;
      p.pos = { x: px, y: py, z: pz };
    }
    if (this.calculated?.pos) this.calculated.pos.set(px, py, pz);
    this.position.set(px / UNITS_MM, py / UNITS_MM, pz / UNITS_MM);
    return;
  }

  if (this.calculated?.pos) this.calculated.pos.set(px, py, pz);

  const localCs = Number(p.spec?.drill_template_local_cs) === 1;
  const setupType = Number(
    p.spec?.setup_type ?? p.spec?.setupType ?? p.setupType ?? 0,
  );
  const parentType = String(this.userData?.parent?.config?.type || '').toLowerCase();

  if (!localCs) {
    return CabinetSectionNode.prototype._build_pos.call(this);
  }

  const DR = globalThis.__CLD_DRILL_RESOLVE;
  if (!DR || typeof DR.resolveFurnitureDrillPlacement !== 'function') {
    console.error('[CLD][DRILL] __CLD_DRILL_RESOLVE не загружен');
    return CabinetSectionNode.prototype._build_pos.call(this);
  }
  const place = DR.resolveFurnitureDrillPlacement({
    setupTypeFromTree: setupType,
    setupTypeFromTemplate: setupType,
    facadeModelId: Number(p.spec?.facadeModelId ?? p.facadeModelId) || 0,
    underModelHost: parentType === 'model',
    parentType,
    pivot: p.pivot,
    posMm: { x: px, y: py, z: pz },
    parentSizeMm: {
      x: Number(parentSize.x) || 0,
      y: Number(parentSize.y) || 0,
      z: Number(parentSize.z) || 0,
    },
  });
  if (
    place.useHostAnchor ||
    place.isSingleFace ||
    place.isLSeam ||
    parentType === 'model' ||
    parentType === 'wall'
  ) {
    const o = place.originMm || { x: px, y: py, z: pz };
    this.position.set(o.x / UNITS_MM, o.y / UNITS_MM, o.z / UNITS_MM);
    return;
  }
  return CabinetSectionNode.prototype._build_pos.call(this);
};

CabinetFurnitureNode.prototype._build_pivot = function _cldFurnitureHostLocalBuildPivot() {
  const p = this.config || {};
  const jointFrame =
    !!p.fromJointScheme && Number(p.spec?.joint_template_frame) === 1;
  if (jointFrame) {
    // Якорь = worldEntry; size=0 — own_object в нуле, без BLB-pivot панели.
    if (this.userData.own_object) {
      this.userData.own_object.position.set(0, 0, 0);
    }
    return;
  }
  const localCs = Number(p.spec?.drill_template_local_cs) === 1;
  const setupType = Number(
    p.spec?.setup_type ?? p.spec?.setupType ?? p.setupType ?? 0,
  );
  const parentType = String(this.userData?.parent?.config?.type || '').toLowerCase();
  // size=0: own_object не сдвигаем — origin уже в _build_pos (host-anchor / model pos).
  if (localCs && (_cldIsSingleFaceDrillSetup(setupType) || parentType === 'model' || parentType === 'wall')) {
    if (this.userData.own_object) {
      this.userData.own_object.position.set(0, 0, 0);
    }
    return;
  }
  return CabinetSectionNode.prototype._build_pivot.call(this);
};

/**
 * Дочерний узел animator: не попадает в __animator_swing — остаётся «на корпусе» (как половина петли в рефе).
 * Для slide-ящика: та же семантика — крепление к корпусу (рельса к стойке), выдвижная часть остаётся под own_object.
 * Задаётся spec.swingAttach / spec.slideAttach: fixed|cabinet|corpus|body или именем (*корпус*, *каркас*, …).
 */
function __animatorChildIsFixedToCarcase(childObj) {
  const p =
    childObj && typeof childObj.config === 'object'
      ? childObj.config
      : childObj?.userData?.params;
  if (!p || typeof p !== 'object') return false;
  const spec = p.spec || {};
  const attach = String(
    spec.swingAttach || spec.swing_role || spec.slideAttach || spec.slide_role || ''
  )
    .toLowerCase()
    .trim();
  if (['fixed', 'cabinet', 'corpus', 'body', 'carcase', 'корпус'].includes(attach)) return true;
  if (['swing', 'door', 'facade', 'фасад', 'drawer', 'ящик', 'run', 'runner', 'basket', 'корзина'].includes(attach))
    return false;
  const name = String(p.name || '').toLowerCase();
  if (/(фасад|двер|door|swing)/i.test(name) && !/(корпус|каркас)/i.test(name)) return false;
  if (/(корпус|каркас|к\s*корпус|к\s*каркас|на\s*корпус|cabinet|carcase)/i.test(name)) return true;
  // Направляющие: половина к корпусу (реф — рельса к стойке; бегунок с ящиком едет вперёд).
  if (/(направляющ|направл|guide\s*rail|telescop|runner)/i.test(name)) {
    if (/(ящик|корзин|полк|выдвиж|бегун|middle|средн|внутр)/i.test(name)) return false;
    if (/(корпус|каркас|стойк|бок|стенк|mount|монтаж|креп|фикс|к\s*шкаф|к\s*корпус)/i.test(name)) return true;
  }
  const et = String(spec.element_type || '').toLowerCase();
  const cid = String(spec.id ?? '').trim();
  if (et === 'catalog_29' && cid === '3') return true;
  if (/планк.*креп|креп[её]жн.*планк|креп[её]жные/i.test(name)) return true;
  return false;
}

/** own_object ближайшего предка-section (корпус для крепления рельсы). */
function __cldFindAncestorSectionCabinetOwn(fromNode) {
  let n = fromNode?.userData?.parent;
  while (n) {
    const t = String(n.config?.type || n.userData?.params?.type || '').toLowerCase();
    if (t === 'section' && n.userData?.own_object) return n.userData.own_object;
    const next = n.userData?.parent;
    if (!next || next === n) break;
    n = next;
  }
  return null;
}

/**
 * Части slide-аниматора, помеченные как «к корпусу», переносим на own_object секции,
 * чтобы при выдвижении own_object они не ехали вместе с ящиком (как hinge_door в рефе).
 */
function __cldReparentSlideFixedPartsToCarcase(animatorNode) {
  const own = animatorNode.userData?.own_object;
  if (!own) return;
  const corpusOwn = __cldFindAncestorSectionCabinetOwn(animatorNode);
  if (!corpusOwn || corpusOwn === own) return;
  const toReparent = [];
  own.updateMatrixWorld(true);
  own.traverse((o) => {
    if (!(o instanceof CabinetNode) || o === own) return;
    if (!__animatorChildIsFixedToCarcase(o)) return;
    const par = o.parent;
    if (par instanceof CabinetNode && __animatorChildIsFixedToCarcase(par)) return;
    let a = o.parent;
    let underOwn = false;
    while (a) {
      if (a === own) {
        underOwn = true;
        break;
      }
      a = a.parent;
    }
    if (!underOwn) return;
    toReparent.push(o);
  });
  for (const o of toReparent) {
    if (o.parent === corpusOwn) continue;
    try {
      corpusOwn.attach(o);
    } catch (_) {}
  }
}

/** layout_role оболочки фасада вверх по дереву Three (для resolveDoorPivotOffsetMm). */
function __cldFindLayoutRoleNearNode(start) {
  let p = start;
  for (let i = 0; i < 24 && p; i++) {
    const cfg = p.config || p.userData?.config || null;
    const lr = String(
      cfg?.layout_role ??
        cfg?.sectionLayoutRole ??
        p.userData?.layoutRole ??
        p.userData?.layout_role ??
        ''
    ).trim();
    if (lr) return lr;
    p = p.parent;
  }
  return '';
}

/**
 * Ось распашки фасада в превью шкафа = как в комнате (Петли по ролям).
 * Модалка ролей: door_offset уже из формы в дереве (__cldHingeRolePreview).
 */
function __cldResolvePreviewFacadeDoorPivotOffsetMm(opts) {
  opts = opts || {};
  const animOff = opts.animDoorOffset;
  const fromSpec = {
    x: animOff && typeof animOff === 'object' ? Number(animOff.x) || 0 : 0,
    y: animOff && typeof animOff === 'object' ? Number(animOff.y) || 0 : 0,
    z: animOff && typeof animOff === 'object' ? Number(animOff.z) || 0 : 0,
  };
  if (typeof __cldHingeRolePreview !== 'undefined' && __cldHingeRolePreview) {
    return { ...fromSpec, __source: 'hinge-role-preview-tree' };
  }
  const gen = typeof window !== 'undefined' ? window.__cldHingeLayout : null;
  if (!gen || typeof gen.resolveDoorPivotOffsetMm !== 'function') {
    return { ...fromSpec, __source: 'spec-door_offset' };
  }
  let layoutRole = String(opts.layoutRole || '').trim();
  if (!layoutRole) {
    layoutRole =
      __cldFindLayoutRoleNearNode(opts.facadeNode) ||
      __cldFindLayoutRoleNearNode(opts.animatorNode) ||
      'facades';
  }
  const dirBody = String(opts.dirBody || '').toLowerCase();
  const opening = String(opts.opening || '').toLowerCase();
  let zoneHand = opts.zoneHand;
  if (!zoneHand) {
    if (
      opening === 'right' ||
      opening === 'rtl' ||
      dirBody === 'ry' ||
      dirBody === 'rz'
    ) {
      zoneHand = 'right';
    } else {
      zoneHand = 'left';
    }
  }
  const placementKind = String(
    opts.placementKind ||
      (typeof __cldPreviewPlacementKind !== 'undefined' ? __cldPreviewPlacementKind : '') ||
      'floor_in_niche'
  );
  const productKind =
    String(opts.productKind || '').trim() ||
    (gen.placementKindToProductKind
      ? gen.placementKindToProductKind(placementKind)
      : '') ||
    (placementKind === 'standalone_floor' ? 'pedestal' : 'wardrobe');
  try {
    const off = gen.resolveDoorPivotOffsetMm({
      facadeLayoutRole: layoutRole,
      productKind,
      placementKind,
      zoneHand,
    });
    const resolved = {
      x: Number(off.x) || 0,
      y: Number(off.y) || 0,
      z: Number(off.z) || 0,
      __source: 'hinge-role-defaults',
      __layoutRole: layoutRole,
      __zoneHand: zoneHand,
    };
    if (typeof window !== 'undefined' && window.DEBUG_FACADE_DOOR) {
      try {
        console.info('[CLD][DOOR-OFFSET][preview]', resolved);
      } catch (_) {}
    }
    return resolved;
  } catch (_) {
    return { ...fromSpec, __source: 'spec-door_offset-fallback' };
  }
}

/**
 * Clodis type: animator — оболочка вращения (шаблон петли: children = model «к фасаду» + furniture, …).
 * Реф.: CabinetAnimator._build_struct — группа __animator между узлом и own_object; вращение в Clodis на animator_object.
 * Здесь own_object переносится под animator_object; поворот двери — на animator_object (как pp.engine.animator_state.rotate).
 */
class CabinetAnimatorNode extends CabinetSectionNode {
  _build_struct() {
    super._build_struct();
    const own = this.userData.own_object;
    const ao = new THREE.Group();
    ao.name = '__animator';
    this.userData.animator_object = ao;
    this.userData.ani_children = ao;
    this.userData.struct[own.name] = ao;
    this.add(ao);
    ao.add(own);
  }

  // Реф: CabinetAnimator extends CabinetSection — куб только при _show_helpers (выбор в дереве).

  /**
   * В админке часто приходит size.z = "s:z" у аниматора при том, что фасад тонкий (16 мм).
   * Пивот и вращение должны считаться по глубине фасада, иначе ось уезжает «в корпус».
   */
  _build_size() {
    const p = this.config || {};
    const spec = p.spec || {};
    const fn = String(spec.fn || '').toLowerCase();
    const c = this.calculated.c_object;
    const parentSize = c.parent_size || new THREE.Vector3();
    const sectionSize = c.parent_size || c.root_size || parentSize;
    const ctx = {
      sizes: {
        x: sectionSize.x || 0,
        y: sectionSize.y || 0,
        z: sectionSize.z || 0,
      },
      vars: c.vars || {},
      materials: c.materials || {},
    };

    const sizeX = evalExpr(p.size?.x ?? 's:x', ctx);
    const sizeY = evalExpr(p.size?.y ?? 's:y', ctx);
    let sizeZ = evalExpr(p.size?.z ?? 's:z', ctx);

    if (fn === 'rotate' && Array.isArray(p.children)) {
      const fac = p.children.find(
        (ch) => ch && String(ch.type || '').toLowerCase() === 'facade'
      );
      if (fac && fac.size && fac.size.z != null) {
        const fz = evalExpr(fac.size.z, ctx);
        if (Number.isFinite(fz) && fz > 0 && fz <= 64) {
          sizeZ = fz;
        }
      }
    }

    this.calculated.size.set(sizeX, sizeY, sizeZ);
    this.calculated.u_size.set(mmToU(sizeX), mmToU(sizeY), mmToU(sizeZ));
  }

  /**
   * Тонкий rotate-аниматор в глубокой секции: как у тонкой секции — к переднему поясу (см. CabinetSectionNode._build_pos).
   */
  _build_pos() {
    const p = this.config || {};
    const spec = p.spec || {};
    const fn = String(spec.fn || '').toLowerCase();
    const c = this.calculated.c_object;
    const parentSize = c.parent_size || new THREE.Vector3();
    const sectionSize = c.parent_size || c.root_size || new THREE.Vector3();
    const hasFacadeChild =
      Array.isArray(p.children) &&
      p.children.some((ch) => ch && String(ch.type || '').toLowerCase() === 'facade');

    // 1.259: thin-shell глубина — для door/rotate с facade-child (id hinge_animator у двери не отменяет).
    const useFacadeRoleDepthLogic = fn === 'rotate' && hasFacadeChild;

    const rootDepthZ = Number(c.root_size?.z) || 0;
    const parentDepthZ = Number(parentSize.z) || 0;
    const insideThinShell = useFacadeRoleDepthLogic && parentDepthZ > 0 && parentDepthZ <= 64;

    // Реф: s:z = parent_size. Внутри оболочки 16 мм нельзя подставлять root 600 — иначе pz≈584 и дверь «отлетает».
    const evalDepthZ = useFacadeRoleDepthLogic
      ? (insideThinShell
          ? parentDepthZ
          : (rootDepthZ > 64 ? rootDepthZ : Number(sectionSize.z) || 0))
      : Number(sectionSize.z) || 0;

    const ctx = {
      sizes: { x: sectionSize.x, y: sectionSize.y, z: evalDepthZ },
      vars: c.vars || {},
    };

    const px = evalExpr(p.pos?.x ?? 0, ctx);
    const py = evalExpr(p.pos?.y ?? 0, ctx);

    let pzRaw = p.pos?.z;
    const dz = Number(this.calculated.size?.z) || 0;
    const pzNum = pzRaw === undefined || pzRaw === null ? NaN : Number(pzRaw);
    const pzIsDefault =
      pzRaw === undefined ||
      pzRaw === null ||
      pzRaw === 0 ||
      pzRaw === '0' ||
      (typeof pzRaw === 'string' && pzRaw.trim() === '') ||
      (Number.isFinite(pzNum) && pzNum === 0);

    const thinAnimator = dz > 0 && dz <= 64;
    const skipAuto = !!(spec._cldDisableFrontFlush);

    if (fn === 'rotate' && !skipAuto && thinAnimator && pzIsDefault && !this.userData.is_root) {
      if (useFacadeRoleDepthLogic) {
        const thickParent = !insideThinShell && (evalDepthZ > 80 || parentDepthZ > 80);
        if (thickParent) pzRaw = evalDepthZ - dz;
        else if (insideThinShell) pzRaw = parentDepthZ - dz;
      } else {
        // 1.257: hinge_animator / прочие — pz = sectionSize.z - dz при автоприжатии к переднему поясу.
        const thickParent = (Number(parentSize.z) || 0) > 80;
        if (thickParent) pzRaw = sectionSize.z - dz;
      }
    }

    let pz = evalExpr(pzRaw ?? 0, ctx);
    if (useFacadeRoleDepthLogic) {
      // Явные реф-формулы «s:z + t/2» не затираем — только автоприжатие по умолчанию.
      if (fn === 'rotate' && thinAnimator && insideThinShell && pzIsDefault) {
        const frontPz = Math.max(0, parentDepthZ - dz);
        if (pz + dz > parentDepthZ + 0.5 || pz > frontPz + 0.5) pz = frontPz;
      } else if (fn === 'rotate' && rootDepthZ > 64 && parentDepthZ > 64) {
        const frontPz = Math.max(0, rootDepthZ - dz);
        if (pz + dz < rootDepthZ - 0.5) pz = frontPz;
      }
    }
    this.calculated.pos.set(px, py, pz);

    const ux = (-parentSize.x / 2 + px) / UNITS_MM;
    const uy = (-parentSize.y / 2 + py) / UNITS_MM;
    const uz = (-parentSize.z / 2 + pz) / UNITS_MM;

    this.position.set(ux, uy, uz);
  }

  _build() {
    this._resetSelf();
    this._resetOwn();
    this.calculateDimensions();
    this.computePosition();
    this._build_rot();
    this._build_scale();
    this.calculatePivot();
    this._build_c_rot();
    if (this.config.active) this.buildGeometry();
    this.buildChildren();
    this._setupAnimatorSwingIfNeeded();
    this._setupAnimatorSlideIfNeeded();
    this._build_accessories();
  }

  /**
   * : pp.engine.animator_state.slide — сдвигает own_object.position
   * по оси на size[ось]/units * ext_percent/100 * sign(direction). Направления l/r→x,
   * f→z, t/b→y (как в animations.slide).
   */
  _setupAnimatorSlideIfNeeded() {
    const p = this.config || {};
    const spec = p.spec || {};
    const fn = String(spec.fn || 'slide').toLowerCase();
    if (fn !== 'slide') return;
    if (!Array.isArray(p.children) || !p.children.length) return;

    const own = this.userData?.own_object;
    const ao = this.userData?.animator_object;
    if (!own || !ao) return;

    const props = spec.props || {};
    const extRaw = props.ext_percent ?? props.extPercent;
    let extPct = Number(extRaw);
    if (!Number.isFinite(extPct) || extPct <= 0) extPct = 70;
    extPct = Math.min(Math.max(extPct, 1), 100);

    const dirStr = String(props.direction || 'f').toLowerCase().trim();
    const dir = dirStr.charAt(0) || 'f';
    const axisByDir = { l: 'x', r: 'x', f: 'z', t: 'y', b: 'y' };
    const signByDir = { l: -1, r: 1, f: 1, t: 1, b: -1 };
    const axis = axisByDir[dir] || 'z';
    const sign = signByDir[dir] ?? 1;

    const sz = this.calculated.size;
    const sizeMm =
      axis === 'x' ? Number(sz.x) || 0 : axis === 'y' ? Number(sz.y) || 0 : Number(sz.z) || 0;
    const travelU = mmToU(Math.abs(sizeMm)) * (extPct / 100);
    if (travelU < 1e-5) return;

    __cldReparentSlideFixedPartsToCarcase(this);

    const base = new THREE.Vector3(own.position.x, own.position.y, own.position.z);
    const sl = {
      axis,
      sign,
      base,
      travelU,
      isOpen: false,
      currentOffset: 0,
      targetOffset: 0,
      syncBulkOpen: true,
    };
    own.userData.cldSlide = sl;

    const isOpenInit =
      !__cldPreviewDoorsOpen &&
      (Number(spec.is_open) === 1 || spec.is_open === true);
    if (isOpenInit) {
      sl.isOpen = true;
      sl.targetOffset = travelU;
      sl.currentOffset = travelU;
      own.position.x = base.x + (axis === 'x' ? travelU * sign : 0);
      own.position.y = base.y + (axis === 'y' ? travelU * sign : 0);
      own.position.z = base.z + (axis === 'z' ? travelU * sign : 0);
    }

    own.traverse((o) => {
      if (!o.isMesh) return;
      o.userData.cldDrawerPick = true;
    });
    _cldIframeSlideGroups.push(own);
  }

  _setupAnimatorSwingIfNeeded() {
    const spec = this.config?.spec || {};
    const fn = String(spec.fn || 'slide').toLowerCase();
    if (fn !== 'rotate') return;

    const ao = this.userData.animator_object;
    if (!ao) return;

    const own = this.userData.own_object;
    const ckn = this.userData?.cabinet_child_nodes;
    const hasFacadeChild = Array.isArray(ckn) && ckn.some(
      (c) => c && String(c.config?.type || '').toLowerCase() === 'facade'
    );
    // Реф каталога (catalog_31): `hinge_animator` — rotate с дочерним `model` «Петля накладная фасад»,
    // не `type: facade`. Без этого ветки cldDoorSwing не вешается и фасадная половина в превью не ходит.
    const isHingeCatalogAnimator =
      String(this.config?.id || '').toLowerCase() === 'hinge_animator';

    if (!hasFacadeChild && !isHingeCatalogAnimator) return;

    const props = spec.props || {};
    const degRaw = Number(props.deg);
    let degAbs = Number.isFinite(degRaw) ? Math.min(Math.abs(degRaw), 175) : 90;
    if (degAbs < 1e-6) degAbs = 90;

    const facadeNode = hasFacadeChild
      ? ckn.find((c) => c && String(c.config?.type || '').toLowerCase() === 'facade')
      : null;
    const opening = String(
      props.opening || spec.opening || facadeNode?.config?.spec?.opening || ''
    ).toLowerCase();
    const isTop = opening === 'top' || opening === 'simple_top';
    const isBottom = opening === 'bottom' || opening === 'simple_bottom';

    const dirRaw = String(
      props.direction || (isTop ? 'lx' : isBottom ? 'rx' : 'ly')
    )
      .toLowerCase()
      .trim();
    const axisByDir = { rx: 'x', lx: 'x', ry: 'y', ly: 'y', rz: 'z', lz: 'z' };
    const signByDir = { rx: 1, lx: -1, ry: 1, ly: -1, rz: 1, lz: -1 };
    const dirNeg = dirRaw.startsWith('-');
    const dirBody = dirNeg ? dirRaw.slice(1) : dirRaw;
    const axis = axisByDir[dirBody] || 'y';
    const dirSign = (signByDir[dirBody] ?? -1) * (dirNeg ? -1 : 1);
    const openScale = isTop || isBottom ? 0.92 : 1;
    const maxAngle = THREE.MathUtils.degToRad(degAbs) * dirSign * openScale;

    // Фасад шкафа: ось как в комнате — «Петли по ролям» (resolveDoorPivotOffsetMm).
    // Модалка ролей (__cldHingeRolePreview): door_offset уже из формы в дереве.
    // catalog_31 hinge_animator: только spec.door_offset (ниже).
    const animOff = spec.door_offset;
    const doorOffsetMm = isHingeCatalogAnimator
      ? {
          x: animOff && typeof animOff === 'object' ? Number(animOff.x) || 0 : 0,
          y: animOff && typeof animOff === 'object' ? Number(animOff.y) || 0 : 0,
          z: animOff && typeof animOff === 'object' ? Number(animOff.z) || 0 : 0,
          __source: 'spec-door_offset',
        }
      : __cldResolvePreviewFacadeDoorPivotOffsetMm({
          animDoorOffset: animOff,
          facadeNode,
          animatorNode: this,
          dirBody,
          opening,
        });
    const odx = Number(doorOffsetMm.x) || 0;
    const ody = Number(doorOffsetMm.y) || 0;
    const odz = Number(doorOffsetMm.z) || 0;

    // Фасадная дверь: ось из direction (ly/ry/…), как ClodisBuilder._trySetupAnimatorRotate.
    if (hasFacadeChild && own && facadeNode && own.children.includes(facadeNode)) {
      if (own.getObjectByName('__door_swing')) return;

      const sz = facadeNode.calculated?.size;
      const w = Number(sz?.x) || 0;
      const h = Number(sz?.y) || 0;
      const d = Number(sz?.z) || 16;
      if (w < 1 || h < 1) return;

      const ho = 16;
      const wu = mmToU(w);
      const hu = mmToU(h);
      const du = mmToU(d);
      const hou = mmToU(ho);
      const fp = facadeNode.position;

      let pivotX = fp.x;
      let pivotY = fp.y;
      let pivotZ = fp.z;
      if (axis === 'y') {
        if (dirBody === 'ly' || dirBody === 'lz') pivotX = fp.x + hou / 2;
        else if (dirBody === 'ry' || dirBody === 'rz') pivotX = fp.x + wu - hou / 2;
        pivotZ = fp.z;
      } else if (axis === 'x') {
        if (isTop || dirBody === 'lx') pivotY = fp.y + hu - hou / 2;
        else if (isBottom || dirBody === 'rx') pivotY = fp.y + hou / 2;
      } else if (axis === 'z') {
        if (dirBody === 'lz') pivotZ = fp.z + hou / 2;
        else if (dirBody === 'rz') pivotZ = fp.z + du - hou / 2;
      }

      const swingPx = pivotX + mmToU(odx);
      const swingPy = pivotY + mmToU(ody);
      const swingPz = pivotZ + mmToU(odz);

      const swing = new THREE.Group();
      swing.name = '__door_swing';
      swing.userData.cldDoorSwing = {
        axis,
        maxAngle,
        isOpen: false,
        currentAngle: 0,
        targetAngle: 0,
        syncBulkOpen: true,
      };
      swing.userData.cldDoorDirection = dirBody;
      swing.userData._cldPreviewDoorOffsetMm = { x: odx, y: ody, z: odz };
      swing.userData._cldPreviewDoorOffsetSource = doorOffsetMm.__source || '';
      swing.position.set(swingPx, swingPy, swingPz);

      own.remove(facadeNode);
      facadeNode.position.x -= swingPx;
      facadeNode.position.y -= swingPy;
      facadeNode.position.z -= swingPz;
      swing.add(facadeNode);
      own.add(swing);

      const isOpenInit =
        !__cldPreviewDoorsOpen &&
        (Number(spec.is_open) === 1 || spec.is_open === true);
      if (isOpenInit) {
        swing.userData.cldDoorSwing.isOpen = true;
        swing.userData.cldDoorSwing.targetAngle = maxAngle;
        swing.userData.cldDoorSwing.currentAngle = maxAngle;
        swing.rotation[axis] = maxAngle;
      }

      swing.traverse((o) => {
        if (!o.isMesh) return;
        if (o.name === '__cld_door_axis_marker') return;
        o.userData.cldDoorPick = true;
      });

      const showAxisMarker =
        typeof window !== 'undefined' && window.__CLD_DEBUG_DOOR_AXIS_MARKER === true;
      if (showAxisMarker) {
        const prevMarker = swing.getObjectByName('__cld_door_axis_marker');
        if (prevMarker) swing.remove(prevMarker);
        const axisDot = new THREE.Mesh(
          new THREE.SphereGeometry(mmToU(10), 16, 12),
          new THREE.MeshBasicMaterial({
            color: 0xc800ff,
            depthTest: false,
            depthWrite: false,
            transparent: true,
            opacity: 0.98,
          })
        );
        axisDot.name = '__cld_door_axis_marker';
        axisDot.renderOrder = 1000;
        axisDot.userData.axisDoorOffsetMm = { ...doorOffsetMm };
        axisDot.userData.cldDoorAxisFromFacadeSpec = true;
        swing.add(axisDot);
      }

      _cldIframeDoorSwingGroups.push(swing);
      return;
    }

    // catalog_31 hinge_animator: сдвиг оси через door_offset на animator_object (без facade-child).
    const _isNonZeroOff = (o) =>
      o && typeof o === 'object' && (Number(o.x) || Number(o.y) || Number(o.z));
    if (own && _isNonZeroOff(animOff)) {
      const ux = mmToU(odx);
      const uy = mmToU(ody);
      const uz = mmToU(odz);
      if (ux || uy || uz) {
        ao.position.x += ux;
        ao.position.y += uy;
        ao.position.z += uz;
        own.position.x -= ux;
        own.position.y -= uy;
        own.position.z -= uz;
      }
    }

    const initialRot = ao.rotation.clone();
    const hingeDirSign = (signByDir[dirBody] ?? -1) * (dirNeg ? -1 : 1);
    const hingeMaxAngle =
      (initialRot[axis] + THREE.MathUtils.degToRad(degAbs)) * hingeDirSign;
    const nestedInOtherSwing =
      isHingeCatalogAnimator && !!__cldAncestorObjectWithDoorSwingFrom(this);
    ao.userData.cldDoorSwing = {
      axis,
      maxAngle: hingeMaxAngle,
      initialRot: { x: initialRot.x, y: initialRot.y, z: initialRot.z },
      isOpen: false,
      currentAngle: 0,
      targetAngle: 0,
      syncBulkOpen: nestedInOtherSwing ? false : true,
    };

    const isOpenInitHinge =
      !__cldPreviewDoorsOpen &&
      (Number(spec.is_open) === 1 || spec.is_open === true);
    if (isOpenInitHinge) {
      ao.userData.cldDoorSwing.isOpen = true;
      ao.userData.cldDoorSwing.targetAngle = hingeMaxAngle;
      ao.userData.cldDoorSwing.currentAngle = hingeMaxAngle;
      ao.rotation[axis] = hingeMaxAngle;
    }

    ao.traverse((o) => {
      if (!o.isMesh) return;
      if (o.name === '__cld_door_axis_marker') return;
      o.userData.cldDoorPick = true;
    });

    _cldIframeDoorSwingGroups.push(ao);
  }
}

// _build_size / _build_pos — свои методы у CabinetAnimatorNode (тонкий фасад vs s:z в JSON).
// Реф.: CabinetAnimator extends CabinetSection — pivot как conv_pivot(params.pivot, size), без таблицы direction модуля.
// CabinetFillNode._build_pivot даёт дефолт direction 'z' и ломает ось вращения двери в шкафу.
CabinetAnimatorNode.prototype._build_pivot = CabinetNode.prototype._build_pivot;
CabinetAnimatorNode.prototype._build_direction = CabinetFillNode.prototype._build_direction;

class ModuleRootNode extends CabinetNode {
  _build_computed() {
    super._build_computed();
    // ЛОГИКА Clodis: для root сразу задаём root_size (мм) из params.size ДО _build_comp_obj
    // чтобы дочерние элементы могли использовать его в evalExpr('s:x')
    const p = this.config || {};
    const rootSizeX = Number(p.size?.x ?? 0);
    const rootSizeY = Number(p.size?.y ?? 0);
    const rootSizeZ = Number(p.size?.z ?? 0);
    this.calculated.size.set(rootSizeX, rootSizeY, rootSizeZ);
    
    // ЛОГИКА Clodis: устанавливаем root_size в c_object сразу чтобы дочерние элементы могли его использовать
    // Референс: также инициализируем materials для поддержки выражений g:g0.thickness
    if (!this.calculated.c_object) {
      this.calculated.c_object = {
        parent_size: new THREE.Vector3(),
        root_size: new THREE.Vector3(rootSizeX, rootSizeY, rootSizeZ),
        vars: {},
        materials: {},
      };
    } else {
      this.calculated.c_object.root_size.set(rootSizeX, rootSizeY, rootSizeZ);
      if (!this.calculated.c_object.materials) {
        this.calculated.c_object.materials = {};
      }
    }
    
    // Референс: инициализируем materials в computed для поддержки g:g0 выражений
    if (!this.calculated.materials) {
      this.calculated.materials = {
        g0: {
          // Дефолтная группа материалов корпуса
          material: {
            key: 'material_2',
            id: 0,
            variant_id: 0,
          },
          thickness: 16,
        },
      };
    }

    // Если админка передала материалы — используем их как источники толщин/материалов групп
    if (incomingMaterials && typeof incomingMaterials === 'object') {
      this.calculated.materials = { ...(this.calculated.materials || {}), ...(incomingMaterials || {}) };
    }

    // Дублируем в c_object.materials, чтобы дочерние элементы видели материалы в evalExpr()
    this.calculated.c_object.materials = this.calculated.materials || {};

  }

  _build_params(params) {
    super._build_params(params);
    // vars как в референсе (v:*) — минимальный набор для старта
    if (!this.userData.vars) {
      this.userData.vars = {
        _wt: 16, // thickness walls (мм)
        _bwo: 0, // back wall offset (мм) — подключим позже
        _tfo: 0, // front offset (мм) — подключим позже
      };
    }

    // Если админка передала vars — применяем поверх дефолтов
    if (incomingVars && typeof incomingVars === 'object') {
      this.userData.vars = { ...(this.userData.vars || {}), ...(incomingVars || {}) };
    }

  }
}

// Реестр типов (как pp.engine.item_types)
const item_types = {
  module: ModuleRootNode,
  section: CabinetSectionNode,
  // Реф: pp.engine.item_types['fill_section'] = CabinetFillSection.
  // Без этой записи в превью узлы type:'fill_section' молча отбрасывались в _build_children
  // (см. ветку «missing ctor»), и любое наполнение, опирающееся на них, не рендерилось.
  fill_section: CabinetFillSectionNode,
  wall: CabinetWallNode,
  facade: CabinetFacadeNode,
  fill_module: CabinetFillNode,
  model: CabinetModelNode,
  furniture: CabinetFurnitureNode,
  hole: CabinetHoleNode,
  path: CabinetPathNode,
  groove: CabinetPathNode,
  animator: CabinetAnimatorNode,
};

function defaultTemplateTree() {
  // Минимальный старт как в превью: :corpus -> :walls -> 4 стенки
  // Референсная логика по Z:
  // - back wall: z = v:_bwo
  // - front wall: z = s:z - v:_bwo - v:_tfo
  return [
    {
      type: 'section',
      name: ':corpus',
      active: 1,
      size: { x: '$size.x', y: '$size.y', z: '$size.z' },
      pos: { x: 0, y: 0, z: 0 },
      children: [
        {
          type: 'section',
          name: ':walls',
          active: 1,
          size: { x: '$size.x', y: '$size.y', z: '$size.z' },
          children: [
            { type: 'wall', name: ':back_wall', active: 1, pos: { x: 0, y: 0, z: 'v:_bwo' }, spec: { side: 'back' } },
            { type: 'wall', name: ':front_wall', active: 1, pos: { x: 0, y: 0, z: 's:z - v:_bwo - v:_tfo' }, spec: { side: 'front' } },
            { type: 'wall', name: ':left_wall', active: 1, spec: { side: 'left' } },
            { type: 'wall', name: ':right_wall', active: 1, spec: { side: 'right' } },
          ],
        },
      ],
    },
  ];
}

/** В дереве есть крепёж стыка (GLB) — нужен ракурс, где видны бока, не только фасад. */
function _previewRootHasJointHardware(object3d) {
  if (!object3d || typeof object3d.traverse !== 'function') return false;
  let found = false;
  object3d.traverse((o) => {
    if (found) return;
    if (o?.userData?.jointHardwareMesh) {
      found = true;
      return;
    }
    if (o?.config?.fromJointScheme) found = true;
  });
  return found;
}

function fitCameraToCenteredObject(cameraObj, object3d, padding, orbit) {
  // Реф main_core_v2_part1 fitCameraToCenteredObject: камера на +Z к объекту.
  // Смотрим на центр мирового bbox (а не на object3d.position — иначе высокий шкаф
  // визуально «вылезает» из кадра, когда геометрия не симметрична вокруг origin узла).
  const box = new THREE.Box3();
  box.setFromObject(object3d);
  if (box.isEmpty()) return;

  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);

  const pad = padding !== undefined && padding !== 0 ? Number(padding) : FIT_PADDING;
  const padSafe = Number.isFinite(pad) && pad > 1 ? pad : FIT_PADDING;

  const vFov = cameraObj.fov * (Math.PI / 180);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * cameraObj.aspect);

  const halfX = Math.max(size.x / 2, 1e-6);
  const halfY = Math.max(size.y / 2, 1e-6);
  const distH = halfX / Math.tan(hFov / 2);
  const distV = halfY / Math.tan(vFov / 2);
  let dist = Math.max(distH, distV) * padSafe;
  dist += Math.max(size.z, 1e-6) * 0.12;

  cameraObj.position.set(center.x, center.y, center.z + dist);

  const span = Math.max(size.length(), dist * 2, 1);
  cameraObj.far = Math.max(cameraObj.far || 0, span * 4);
  cameraObj.updateProjectionMatrix();

  if (orbit) {
    orbit.target.copy(center);
    orbit.maxDistance = Math.max(dist * 5, span * 3);
    orbit.update();
  }
}

function createModuleRoot(sizeMm) {
  // Для admin-preview не подставляем дефолтный каркас до прихода реального дерева,
  // иначе пользователь видит «сплошной короб», который исчезает после первого клика в дереве.
  // [] — явно пустое дерево (пользователь удалил всё) и тоже не требует fallback.
  const tree =
    Array.isArray(moduleTemplateTree) && moduleTemplateTree.length > 0
      ? moduleTemplateTree
      : [];

  const params = deepMerge(defParams.module, {
    type: 'module',
    name: 'Module',
    size: { x: mm(sizeMm.w), y: mm(sizeMm.h), z: mm(sizeMm.d) },
    // В референсе root own_object центрируется: own_object.position = (-size/2 + pos)/units => pos = size/2
    pos: { x: mm(sizeMm.w) / 2, y: 0, z: mm(sizeMm.d) / 2 },
    // Новый формат: template.structure, legacy: spec.template.tree (указывает на тот же массив)
    template: { structure: tree },
    spec: { template: { tree } },
  });
  const mod = new ModuleRootNode(params, { root: null, parent: null, local_parent: null, path: '0' });
  mod.name = '__clodis_module_root';
  return mod;
}

function makeLabel(text) {
  const div = document.createElement('div');
  div.textContent = text;
  div.style.fontFamily = 'Arial, sans-serif';
  div.style.fontSize = '13px';
  div.style.color = '#111';
  div.style.background = 'rgba(255,255,255,0.9)';
  div.style.border = '1px solid rgba(0,0,0,0.12)';
  div.style.borderRadius = '8px';
  div.style.padding = '4px 8px';
  div.style.whiteSpace = 'nowrap';
  div.style.boxShadow = '0 2px 10px rgba(0,0,0,0.10)';
  return new CSS2DObject(div);
}

function makeArrowGeometry(width, height, dir /* 'left' | 'right' */) {
  // Clean-room реализация формы из референса (make_arrow):
  // left:  [-l,0] [l,-m] [l,m]
  // right: [-l,-m] [l,0] [-l,m]
  const l = width / 2;
  const m = height / 2;
  let k;
  if (dir === 'left') {
    k = new Float32Array([-l, 0, 0, l, -m, 0, l, m, 0]);
  } else {
    k = new Float32Array([-l, -m, 0, l, 0, 0, -l, m, 0]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(k, 3));
  geo.computeVertexNormals();
  return geo;
}

function makeSizesObjLikeReference({
  width,
  length,
  middleLinePosition,
  lineThickness,
  arrowWidth,
  arrowHeight,
  arrowScale = 1,
  color = 0x111111,
}) {
  // Аналог Sizes_obj: линии = PlaneGeometry, стрелки = треугольные меши (left/right)
  const g = new THREE.Group();
  g.name = '__clodis_sizes_obj';

  const mat = new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide,
    depthTest: true,
  });

  // left_line / right_line: (lineThickness x length)
  const lineGeo = new THREE.PlaneGeometry(lineThickness, length);
  const leftLine = new THREE.Mesh(lineGeo, mat);
  const rightLine = new THREE.Mesh(lineGeo, mat);
  leftLine.renderOrder = 900;
  rightLine.renderOrder = 900;

  // middle_line: (width - lineThickness) x lineThickness
  const midGeo = new THREE.PlaneGeometry(Math.max(0, width - lineThickness), lineThickness);
  const midLine = new THREE.Mesh(midGeo, mat);
  midLine.renderOrder = 900;

  leftLine.position.set(-width / 2 + lineThickness / 2, length / 2, 0);
  rightLine.position.set(width / 2 - lineThickness / 2, length / 2, 0);
  midLine.position.set(0, middleLinePosition, 0);

  g.add(leftLine, rightLine, midLine);

  // arrows
  const leftArrow = new THREE.Mesh(makeArrowGeometry(arrowWidth, arrowHeight, 'left'), mat);
  const rightArrow = new THREE.Mesh(makeArrowGeometry(arrowWidth, arrowHeight, 'right'), mat);
  leftArrow.renderOrder = 901;
  rightArrow.renderOrder = 901;

  leftArrow.position.set(-width / 2 + (arrowWidth / 2) * arrowScale, middleLinePosition, 0);
  rightArrow.position.set(width / 2 - (arrowWidth / 2) * arrowScale, middleLinePosition, 0);
  leftArrow.scale.set(arrowScale, arrowScale, 1);
  rightArrow.scale.set(arrowScale, arrowScale, 1);

  g.add(leftArrow, rightArrow);

  return g;
}

function addRefStyleDimension(group, { axis, sizeMm }) {
  // Параметры как в референсе Sizes_obj + def_cabinet_size:
  // line_pos=0x50(80мм), length=0x64(100мм), line_thickness=1мм,
  // arrow_width=0x3c(60мм), arrow_height=0x14(20мм).
  const middleLinePosition = mmToU(80);
  const length = mmToU(100);
  const lineThickness = mmToU(1);
  const arrowWidth = mmToU(60);
  const arrowHeight = mmToU(20);

  const w = mmToU(sizeMm.w);
  const h = mmToU(sizeMm.h);
  const d = mmToU(sizeMm.d);

  // Sizes_obj рисуется в локальной плоскости XY:
  // - основная размерная ось = X (от -width/2 до +width/2)
  // - вынос = Y (от 0 до length)
  let widthU = w;
  let origin = new THREE.Vector3(0, -h / 2, -d / 2);
  let dir = new THREE.Vector3(1, 0, 0);
  let perp = new THREE.Vector3(0, -1, 0); // вниз от корпуса (как x1 в референсе)
  let labelText = `${Math.round(sizeMm.w)} мм`;

  if (axis === 'y') {
    widthU = h;
    origin = new THREE.Vector3(w / 2, 0, -d / 2);
    dir = new THREE.Vector3(0, 1, 0);
    perp = new THREE.Vector3(1, 0, 0); // вправо от корпуса
    labelText = `${Math.round(sizeMm.h)} мм`;
  } else if (axis === 'z') {
    widthU = d;
    origin = new THREE.Vector3(-w / 2, -h / 2, 0);
    dir = new THREE.Vector3(0, 0, 1);
    perp = new THREE.Vector3(-1, 0, 0); // влево от корпуса
    labelText = `${Math.round(sizeMm.d)} мм`;
  }

  const sizesObj = makeSizesObjLikeReference({
    width: widthU,
    length,
    middleLinePosition,
    lineThickness,
    arrowWidth,
    arrowHeight,
    arrowScale: 1,
    color: 0x111111,
  });

  // Ориентация: локальные X/Y -> (dir/perp) в мире
  const normal = new THREE.Vector3().crossVectors(dir, perp).normalize();
  const m = new THREE.Matrix4().makeBasis(dir.clone().normalize(), perp.clone().normalize(), normal);
  sizesObj.quaternion.setFromRotationMatrix(m);
  sizesObj.position.copy(origin);
  group.add(sizesObj);

  // Подпись (в референсе это меш-цифры; здесь оставляем CSS2D, но позицию делаем как у них: +15мм от линии)
  const lbl = makeLabel(labelText);
  lbl.position.set(0, middleLinePosition + mmToU(15), 0);
  sizesObj.add(lbl);
}

function createDimensions(size) {
  const g = new THREE.Group();
  g.name = '__clodis_dimensions';
  g.userData.isDimensions = true;
  addRefStyleDimension(g, { axis: 'x', sizeMm: size });
  addRefStyleDimension(g, { axis: 'y', sizeMm: size });
  addRefStyleDimension(g, { axis: 'z', sizeMm: size });

  return g;
}

function __resolveDimsNodeByPath() {
  if (_dimsAnchorPath == null || _dimsAnchorPath === '') return null;
  const path = String(_dimsAnchorPath);
  if (path === '0' && rootGroup) return rootGroup;
  return window.CLDDBG?.engine?.getNodeByPath(path) || null;
}

/**
 * Размерные подписи: для выбранного узла — его calculated.size (мм) и привязка к helpers
 * (вместе с зелёным объёмом и поворотом каталога); иначе — габариты модуля из cld:setSize (state).
 */
function resolveDimsTarget() {
  const st = state || { w: 300, h: 400, d: 200 };
  const attachRoot = rootGroup || scene;
  const node = __resolveDimsNodeByPath();
  if (!node || !node.calculated?.size) {
    return { w: st.w, h: st.h, d: st.d, attachParent: attachRoot };
  }
  const sz = node.calculated.size;
  const wx = Number(sz.x);
  const wy = Number(sz.y);
  const wz = Number(sz.z);
  if (![wx, wy, wz].every((n) => Number.isFinite(n) && n > 0)) {
    return { w: st.w, h: st.h, d: st.d, attachParent: attachRoot };
  }
  const h = node.userData?.helpers;
  return { w: wx, h: wy, d: wz, attachParent: h || attachRoot };
}

function disposeDimsGroup() {
  if (!dimsGroup) return;
  if (dimsGroup.parent) dimsGroup.parent.remove(dimsGroup);
  disposeObject(dimsGroup);
  dimsGroup = null;
}

function mountDimensionsGroup() {
  disposeDimsGroup();
  if (!showDims) return;
  const t = resolveDimsTarget();
  const parent = t.attachParent || scene;
  if (!parent) return;
  dimsGroup = createDimensions({ w: t.w, h: t.h, d: t.d });
  parent.add(dimsGroup);
}

/**
 * Метки реальных позиций петель относительно фасада (мм от низа/левого края).
 * Используются в превью «Петли по ролям» для проверки расстояний после расстановки.
 *
 * @returns {Array<{node: object, posMm: {x:number,y:number,z:number}}>} список найденных петель
 */
function __cldCollectHingeNodesInRoot() {
  const out = [];
  if (!rootGroup) return out;
  rootGroup.traverse((obj) => {
    if (!obj || typeof obj !== 'object') return;
    const cfg = obj.config;
    if (!cfg) return;
    const sp = cfg.spec;
    if (!sp || typeof sp !== 'object') return;
    if (!__cldIsHingeModuleSpec(sp) && !__cldSpecLooksLikeCatalogHingeModule(sp)) return;
    const t = String(cfg.type || '').toLowerCase();
    if (t === 'section' && !__cldIsCatalogModuleShellLike(cfg)) return;
    if (t !== 'section' && t !== 'module') return;
    out.push(obj);
  });
  return out;
}

/** Точка для размерных меток: hinge_animator (ось / чашка), не центр превью-бокса модуля. */
function __cldResolveHingeMarkerAnchorObject(hingeNode) {
  if (!hingeNode) return null;
  if (__hingeMarkersMeasure === 'module') {
    return hingeNode.userData?.own_object || hingeNode;
  }
  let animNode = null;
  hingeNode.traverse((obj) => {
    if (!(obj instanceof CabinetAnimatorNode)) return;
    if (String(obj.config?.id || '').toLowerCase() !== 'hinge_animator') return;
    animNode = obj;
  });
  if (animNode) {
    const ao = animNode.userData?.animator_object;
    if (ao) return ao;
    if (animNode.userData?.own_object) return animNode.userData.own_object;
  }
  let modelObj = null;
  hingeNode.traverse((obj) => {
    if (!obj || typeof obj !== 'object') return;
    const cfg = obj.config;
    if (!cfg || String(cfg.type || '').toLowerCase() !== 'model') return;
    const nm = String(cfg.name || '');
    if (!/фасад|facade|накладн|swing/i.test(nm)) return;
    const o = obj.userData?.own_object;
    if (o) modelObj = o;
  });
  if (modelObj) return modelObj;
  return hingeNode.userData?.own_object || hingeNode;
}

function disposeHingeMarkersGroup() {
  if (!hingeMarkersGroup) return;
  if (hingeMarkersGroup.parent) hingeMarkersGroup.parent.remove(hingeMarkersGroup);
  disposeObject(hingeMarkersGroup);
  hingeMarkersGroup = null;
}

function mountHingeMarkersGroup() {
  disposeHingeMarkersGroup();
  if (!__hingeMarkersEnabled) return;
  if (!rootGroup) return;
  const hinges = __cldCollectHingeNodesInRoot();
  if (!hinges.length) return;

  const axis = String(__hingeMarkersAxis || 'Y').toUpperCase() === 'X' ? 'X' : 'Y';
  const facadeW = Math.max(1, Number(state?.w) || 1);
  const facadeH = Math.max(1, Number(state?.h) || 1);
  const facadeD = Math.max(1, Number(state?.d) || 1);

  const group = new THREE.Group();
  group.name = '__cld_hinge_role_markers';
  group.userData.isHingeMarkers = true;

  rootGroup.updateMatrixWorld(true);
  const positions = [];

  for (const node of hinges) {
    const own = __cldResolveHingeMarkerAnchorObject(node);
    if (!own) continue;
    own.updateMatrixWorld(true);
    const wp = own.getWorldPosition(new THREE.Vector3());
    const local = rootGroup.worldToLocal(wp.clone());
    // rootGroup own_object pivot = (-1,-1,-1): локальный 0 совпадает с центром модуля
    // (в createModuleRoot pos = (w/2,0,d/2)). Чтобы получить мм от нижнего/левого
    // края фасада, переходим через центр (mm = local*UNITS_MM).
    const yMmFromCenter = local.y * UNITS_MM;
    const xMmFromCenter = local.x * UNITS_MM;
    const yMmFromBottom = yMmFromCenter + facadeH / 2;
    const xMmFromLeft = xMmFromCenter + facadeW / 2;
    positions.push({ local, yMmFromBottom, xMmFromLeft });
  }

  if (!positions.length) return;

  const sortKey = axis === 'X' ? 'xMmFromLeft' : 'yMmFromBottom';
  positions.sort((a, b) => a[sortKey] - b[sortKey]);

  // Метка-цифра у каждой петли (на фронт-плоскости фасада, чуть правее/ниже самой петли).
  const halfW = facadeW / 2 / UNITS_MM;
  const halfH = facadeH / 2 / UNITS_MM;
  const labelOffsetU = mmToU(55);
  const chainOffsetU = mmToU(110);
  const avgLocalX =
    positions.reduce((s, p) => s + Number(p.local.x || 0), 0) / positions.length;
  const hingeSideSign = avgLocalX >= 0 ? 1 : -1;
  const hingeFrontZ =
    positions.reduce((s, p) => s + Number(p.local.z || 0), 0) / positions.length + mmToU(2);
  const hingeDimLineX = hingeSideSign * (halfW + labelOffsetU);
  const hingeChainLineX = hingeSideSign * (halfW + chainOffsetU);
  const hingeChainLineY = -halfH - chainOffsetU;

  for (const p of positions) {
    const lblText =
      axis === 'X'
        ? `X ${Math.round(p.xMmFromLeft)} мм`
        : `Y ${Math.round(p.yMmFromBottom)} мм`;
    const lbl = makeLabel(lblText);
    if (axis === 'Y') {
      lbl.position.set(hingeDimLineX, p.local.y, hingeFrontZ);
    } else {
      lbl.position.set(p.local.x, -halfH - labelOffsetU, hingeFrontZ);
    }
    group.add(lbl);

    // Тонкая поперечная риска на стороне фасада до выноски.
    const tickGeo = new THREE.PlaneGeometry(
      axis === 'Y' ? labelOffsetU : mmToU(2),
      axis === 'Y' ? mmToU(2) : labelOffsetU
    );
    const tickMat = new THREE.MeshBasicMaterial({
      color: 0xff7a00,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });
    const tick = new THREE.Mesh(tickGeo, tickMat);
    tick.renderOrder = 950;
    if (axis === 'Y') {
      tick.position.set((p.local.x + hingeDimLineX) / 2, p.local.y, hingeFrontZ + 0.001);
    } else {
      tick.position.set(p.local.x, (p.local.y - halfH - labelOffsetU) / 2, hingeFrontZ + 0.001);
    }
    group.add(tick);
  }

  // Цепочка размеров между точками (включая края фасада).
  const dimAxisStart = axis === 'X' ? 0 : 0;
  const dimAxisEnd = axis === 'X' ? facadeW : facadeH;
  const chain = [
    dimAxisStart,
    ...positions.map((p) => (axis === 'X' ? p.xMmFromLeft : p.yMmFromBottom)),
    dimAxisEnd,
  ];

  for (let i = 0; i < chain.length - 1; i++) {
    const a = chain[i];
    const b = chain[i + 1];
    const segMm = b - a;
    if (!Number.isFinite(segMm) || segMm <= 0.5) continue;
    const segU = mmToU(segMm);
    const sizes = makeSizesObjLikeReference({
      width: segU,
      length: mmToU(20),
      middleLinePosition: mmToU(10),
      lineThickness: mmToU(0.6),
      arrowWidth: mmToU(20),
      arrowHeight: mmToU(8),
      arrowScale: 1,
      color: 0xff7a00,
    });
    if (axis === 'Y') {
      const cy = mmToU(a + segMm / 2) - halfH;
      sizes.position.set(hingeChainLineX, cy, hingeFrontZ);
      // Локальная плоскость линии: dir = +Y, perp = +X
      const dir = new THREE.Vector3(0, 1, 0);
      const perp = new THREE.Vector3(hingeSideSign, 0, 0);
      const normal = new THREE.Vector3().crossVectors(dir, perp).normalize();
      const m = new THREE.Matrix4().makeBasis(dir, perp, normal);
      sizes.quaternion.setFromRotationMatrix(m);
    } else {
      const cx = mmToU(a + segMm / 2) - halfW;
      sizes.position.set(cx, hingeChainLineY, hingeFrontZ);
      const dir = new THREE.Vector3(1, 0, 0);
      const perp = new THREE.Vector3(0, -1, 0);
      const normal = new THREE.Vector3().crossVectors(dir, perp).normalize();
      const m = new THREE.Matrix4().makeBasis(dir, perp, normal);
      sizes.quaternion.setFromRotationMatrix(m);
    }
    group.add(sizes);

    const segLbl = makeLabel(`${Math.round(segMm)}`);
    if (axis === 'Y') {
      segLbl.position.set(
        hingeChainLineX + hingeSideSign * mmToU(12),
        mmToU(a + segMm / 2) - halfH,
        hingeFrontZ
      );
    } else {
      segLbl.position.set(
        mmToU(a + segMm / 2) - halfW,
        hingeChainLineY - mmToU(12),
        hingeFrontZ
      );
    }
    group.add(segLbl);
  }

  rootGroup.add(group);
  hingeMarkersGroup = group;
}

function setHingeMarkersEnabled(on, axis, measure) {
  __hingeMarkersEnabled = !!on;
  if (axis) {
    const a = String(axis).toUpperCase();
    if (a === 'X' || a === 'Y') __hingeMarkersAxis = a;
  }
  if (measure) {
    const m = String(measure).trim().toLowerCase();
    __hingeMarkersMeasure = m === 'module' ? 'module' : 'anchor';
  }
  if (__hingeMarkersEnabled) mountHingeMarkersGroup();
  else disposeHingeMarkersGroup();
  render();
}

function applySinglePreviewCameraLikeReference() {
  // single_preview: модуль; иначе — размерная рамка ± превью GLB (каталог 3D моделей).
  _fitPreviewCameraCombined();
}

let _cldCatalogIconPreviewSession = null;
let _cldCatalogIconLightingApplyGen = 0;

async function _cldReapplyCatalogIconLightingPreserveView() {
  if (!_cldCatalogIconPreviewSession?.catalogIconShot) return false;
  const gen = ++_cldCatalogIconLightingApplyGen;
  const userCamPos = camera.position.clone();
  const userCamTarget = controls ? controls.target.clone() : null;
  const userFov = camera.fov;

  _cldRestoreCatalogIconLighting(_cldCatalogIconPreviewSession.catalogIconLighting);
  if (_cldCatalogIconTransformControls) {
    _cldCatalogIconTransformControls.detach();
    _cldCatalogIconTransformControls.visible = false;
  }

  rootGroup.updateMatrixWorld(true);
  const corpusBox = _cldCorpusIconBoundingBox(rootGroup).box;
  const lookAt = userCamTarget
    ? userCamTarget.clone()
    : corpusBox.getCenter(new THREE.Vector3());
  const tuning = _cldGetCatalogIconTuning();

  const lighting = await _cldApplyCatalogIconLighting(
    lookAt,
    userCamPos,
    corpusBox.getSize(new THREE.Vector3()),
    {
      showLightGizmos: tuning.showIconLightGizmos !== 0,
    }
  );
  if (gen !== _cldCatalogIconLightingApplyGen) return false;

  _cldCatalogIconPreviewSession.catalogIconLighting = lighting;
  camera.position.copy(userCamPos);
  camera.fov = userFov;
  camera.updateProjectionMatrix();
  if (controls && userCamTarget) {
    controls.target.copy(userCamTarget);
    controls.update();
  }
  return true;
}

// Сброс камеры для панели админки: возвращает дефолтный ракурс превью
function resetCameraToDefault() {
  if (_cldCatalogIconPreviewSession) {
    _cldExitCatalogIconPreview();
  }
  if (_cldCatalogIconShotActive) {
    _cldCatalogIconShotActive = false;
  }
  applySinglePreviewCameraLikeReference();
  __cameraWasAutoFitted = true;
}

// Дефолты как в constructor-clodis-preview.html (wantSize: 300×400×200)
let state = { w: 300, h: 400, d: 200 };
let showDims = true;
let lastSelectedPath = null;
/** Узел, для которого показываем размерные линии (path из userData); иначе — габариты модуля из state. */
let _dimsAnchorPath = null;
let lastSelectedNodeType = 'section';
// Источник выделения: tree|rebuild|other.
// Для присадки (furniture/hole) выделение оставляем только от клика по дереву.
let _lastSelectionSource = 'other';
// Референс: global_options.mode === 'edges' — линии кромок всегда видны, номера 1-4 только при выборе детали
let edgesMode = true;
let __cameraWasAutoFitted = false;
let __cldPreviewPlacementKind = 'floor_in_niche';
let __cldPreviewSuppressFillExpand = false;
let __cldPreviewDrawerNoHandle = false;
let __cldPreviewEditingCatalogType = '';
let __cldPreviewEditingCatalogItemId = '';

function __cldIsFillCatalogElementType(et) {
  const k = String(et || '').trim().toLowerCase();
  return k === 'catalog_38' || k === 'catalog_39' || k === '38' || k === '39';
}

function __cldIsModuleInactiveFlag(active) {
  return active === 0 || active === '0' || active === false;
}

/** Превью шаблона корпуса: ссылка catalog_38 — только если в дереве есть снимок, не live-подтягивание. */
function __cldShouldSkipFillCatalogLiveExpand(cp) {
  if (!cp || cp.type !== 'module') return false;
  const spec = cp.spec && typeof cp.spec === 'object' ? cp.spec : {};
  const et = String(spec.element_type || '').trim();
  if (!__cldIsFillCatalogElementType(et)) return false;
  if (__cldPreviewSuppressFillExpand) return true;
  if (spec.live_catalog === false || spec.live_catalog === 0 || spec.live_catalog === '0') return true;
  if (spec.preview_link_only === 1 || spec.preview_link_only === true) return true;
  return false;
}
let __cldLastTemplateTreeSyncTs = 0;
let __cldEnvRebuildFallbackTimer = null;

function __cldMarkEnvChangedForRebuild() {
  // В embedded-потоке админка шлёт setVars/setMaterials и затем setTemplateTree.
  // Если делать rebuild на каждом сообщении, получаем 2-3 пересборки подряд.
  if (!__cldEmbeddedPreview) {
    rebuild();
    return;
  }
  if (__cldEnvRebuildFallbackTimer) clearTimeout(__cldEnvRebuildFallbackTimer);
  __cldEnvRebuildFallbackTimer = setTimeout(() => {
    __cldEnvRebuildFallbackTimer = null;
    const age = Date.now() - (__cldLastTemplateTreeSyncTs || 0);
    // Если templateTree так и не пришёл — всё равно применяем vars/materials.
    if (age > 220) rebuild();
  }, 240);
}

function __cldDedupTemplateTree(nodes) {
  if (!Array.isArray(nodes)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of nodes) {
    if (!raw || typeof raw !== 'object') continue;
    const n = { ...raw };
    const key = n.id
      ? `id:${String(n.id)}`
      : `anon:${String(n.type || '')}:${String(n.name || '')}:${out.length}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (Array.isArray(n.children)) n.children = __cldDedupTemplateTree(n.children);
    out.push(n);
  }
  return out;
}

/** Референс: edges_mode_traverse — линии кромок только у выбранного узла и его потомков.
 * Clodis: edges_mode вызывает traverse на own_object выбранного объекта — рёбра только у него. */
function isDescendantOf(node, ancestor) {
  let n = node;
  while (n) {
    if (n === ancestor) return true;
    n = n.parent;
  }
  return false;
}

function applyEdgesModeVisibility(root, mode, selectedNode, nodeType) {
  if (!root) return;
  const sectionSelected = nodeType === 'section'; // модуль без названия или секция
  root.traverse((node) => {
    const el = node.userData?.edges_lines;
    if (!el) return;
    // CabinetFillSectionNode наследует CabinetSectionNode и тоже считается «секцией»
    // в логике подсветки рёбер: иначе у наполняемой секции включается ветка «деталь».
    const ctorName = node.constructor?.name;
    const isSection = ctorName === 'CabinetSectionNode' || ctorName === 'CabinetFillSectionNode';
    if (isSection) {
      el.visible = !!mode && sectionSelected && selectedNode === node;
    } else {
      // Референс: детали — рёбра только у выбранной детали или у деталей внутри выбранной секции
      el.visible = !!mode && (
        (sectionSelected && selectedNode && isDescendantOf(node, selectedNode)) ||
        (!sectionSelected && node === selectedNode)
      );
    }
  });
}

/** BBox только по геометрии Mesh (без раздувания от лишних потомков). */
function _jointPanelBBox(panelObj) {
  if (!panelObj) return null;
  const box = new THREE.Box3();
  let any = false;
  const isJointRelevantMesh = (ch) => {
    if (!ch || !ch.isMesh || !ch.geometry) return false;
    if (ch.userData?.isAccessory) return false;
    if (ch.userData?.isSectionVolume) return false;
    if (ch.userData?.isEdgesLines) return false;
    if (ch.userData?.isEdge) return false;
    if (ch.userData?.isEdgeNumber) return false;
    const n = String(ch.name || '').toLowerCase();
    if (n.includes('hole_') || n.includes('joint_preview_') || n.includes('furni_hole_')) return false;
    // Фантомные «Крепёж»-стенки не участвуют в bbox стыка.
    if (/^крепёж\s*:/i.test(String(ch.userData?.detailName || ch.userData?.wallName || ''))) return false;
    return true;
  };
  panelObj.traverse((ch) => {
    if (!isJointRelevantMesh(ch)) return;
    ch.updateWorldMatrix(true);
    const g = ch.geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    const lb = g.boundingBox.clone().applyMatrix4(ch.matrixWorld);
    if (!any) { box.copy(lb); any = true; }
    else box.union(lb);
  });
  if (!any) {
    const own = panelObj.userData?.own_object;
    if (own) box.setFromObject(own);
    else box.setFromObject(panelObj);
    any = !box.isEmpty();
  }
  return any && !box.isEmpty() ? box : null;
}

function _jointStripeOrthoBasis(fr) {
  const s = fr.seamDirWorld.clone();
  s.normalize();
  let e = fr.edgeDirWorld.clone();
  e.sub(s.clone().multiplyScalar(s.dot(e)));
  if (e.lengthSq() < 1e-16) return null;
  e.normalize();
  const o = new THREE.Vector3().crossVectors(s, e);
  if (o.dot(fr.outwardWorld) < 0) o.negate();
  o.normalize();
  return { s, e, o };
}

/**
 * Подсветка стыка вдоль линии шва (торец/ребро, как в Базисе — не заливка всей пласти).
 * bazisActive / bazisPotential — режим «крепёж на стыке»: фиолетовый активный набор, зелёный остальные торцы.
 * thinBase — тонкий оранжевый для уже назначенного крепежа.
 * emphasize — устар.; для дерева используйте bazisActive.
 * jointIdx: 0 Top(+Y), 1 Bottom(-Y), 2 Left(-X), 3 Right(+X)
 *
 * Базис: линия стыка = общая часть двух панелей. Без active-контакта с перекрытием — не рисуем.
 */
function _addJointTorcFrameStripes(group, bbox, jointIdx, color, opacity, opts) {
  return; /* SEAM-CLEAN-NOOP */
  // dead code below kept for reference only

  const bazisActive = !!(opts && opts.bazisActive);
  const bazisPotential = !!(opts && opts.bazisPotential);
  const emphasize = !!(opts && opts.emphasize) && !bazisActive && !bazisPotential;
  const thinBase = !!(opts && opts.thinBase) && !emphasize && !bazisActive && !bazisPotential;
  const panelRoot = opts && opts.panelRoot;
  const bSize = bbox.getSize(new THREE.Vector3());
  const { min, max } = bbox;

  const frame = panelRoot ? getJointStripeFrameWorld(panelRoot, jointIdx) : null;
  const frBasis = frame ? _jointStripeOrthoBasis(frame) : null;

  const { faceAxis, faceSign } = _jointFaceInfo(jointIdx, bbox, panelRoot);
  const facePos = faceSign > 0 ? max[faceAxis] : min[faceAxis];

  const faceOut = new THREE.Vector3();
  faceOut[faceAxis] = faceSign;

  const addOrientedBox = (seamL, rib, t, bump, ro, mat, centerWorld = null) => {
    if (!frBasis || !frame || seamL <= 1e-9) return false;
    const { s, e, o } = frBasis;
    const baseC = centerWorld || frame.faceCenterWorld;
    const c = baseC.clone().add(o.clone().multiplyScalar(bump + 0.5 * t));
    const seamExact = Math.max(0.001, Number(seamL) || 0.001);
    const ribExact = Math.max(0.001, Number(frame.edgeLenWorld) || rib);
    const geom = new THREE.BoxGeometry(seamExact, ribExact, t);
    const m4 = new THREE.Matrix4();
    m4.makeBasis(s, e, o);
    const msh = new THREE.Mesh(geom, mat);
    msh.setRotationFromMatrix(m4);
    msh.position.copy(c);
    msh.renderOrder = ro;
    group.add(msh);
    return true;
  };

  // Линия стыка только по отрезку контакта (overlap), никогда по всему торцу панели.
  let seamSeg = null;
  if (panelRoot && typeof detectJointContactV2 === 'function') {
    const contact = detectJointContactV2(panelRoot, jointIdx, rootGroup, { mmPerWorldUnit: UNITS_MM });
    if (
      contact &&
      contact.active &&
      contact.neighborPanel &&
      !contact.neighborPanel?.userData?.__soloJointNeighbor
    ) {
      seamSeg = jointSeamSegmentFromContact(contact, UNITS_MM);
    }
  }
  if (!seamSeg || !(seamSeg.seamLenWorld > 1e-9)) {
    return;
  }

  if (bazisActive || bazisPotential || thinBase || emphasize) {
    const minSz = Math.min(bSize.x, bSize.y, bSize.z);
    let ribbonMmCap;
    let ribbonFrac;
    let ribbonFloor;
    let t;
    let bump;
    let ro;
    if (thinBase) {
      ribbonMmCap = 4.2;
      ribbonFrac = 0.1;
      ribbonFloor = 0.1;
      t = 0.00125;
      bump = 0.028;
      ro = 5;
    } else if (bazisPotential) {
      ribbonMmCap = 4.8;
      ribbonFrac = 0.12;
      ribbonFloor = 0.14;
      t = 0.002;
      bump = 0.062;
      ro = 9;
    } else if (emphasize) {
      ribbonMmCap = 9;
      ribbonFrac = 0.26;
      ribbonFloor = 0.22;
      t = 0.004;
      bump = 0.12;
      ro = 9;
    } else {
      ribbonMmCap = 7.5;
      ribbonFrac = 0.17;
      ribbonFloor = 0.14;
      t = 0.003;
      bump = 0.1;
      ro = 11;
    }
    const ribbon = Math.max(ribbonFloor, Math.min(ribbonMmCap / UNITS_MM, minSz * ribbonFrac));
    const op = Math.min(1, opacity);
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: op,
      depthTest: false, depthWrite: false, side: THREE.DoubleSide,
    });
    if (addOrientedBox(seamSeg.seamLenWorld, ribbon, t, bump, ro, mat, seamSeg.centerWorld)) {
      return;
    }
    // Fallback AABB только на длину overlap (не полный край).
    const { seamAx, edgeAx } = _jointFaceSeamAndEdgeAxes(bbox, jointIdx, panelRoot);
    const ox = faceOut.x * bump;
    const oy = faceOut.y * bump;
    const oz = faceOut.z * bump;
    const sz = { x: 0, y: 0, z: 0 };
    sz[seamAx] = seamSeg.seamLenWorld;
    sz[edgeAx] = ribbon;
    sz[faceAxis] = t;
    const p = {
      x: seamSeg.centerWorld.x,
      y: seamSeg.centerWorld.y,
      z: seamSeg.centerWorld.z,
    };
    p[faceAxis] = facePos;
    const m = new THREE.Mesh(new THREE.BoxGeometry(sz.x, sz.y, sz.z), mat);
    m.position.set(p.x + ox, p.y + oy, p.z + oz);
    m.renderOrder = ro;
    group.add(m);
    return;
  }

  // Остальные режимы (тонкая базовая подсветка без флагов) — тоже только overlap.
  const minSz = Math.min(bSize.x, bSize.y, bSize.z);
  const ribbon = Math.max(0.22, Math.min(9 / UNITS_MM, minSz * 0.26));
  const t = 0.0028;
  const bump = 0.072;
  const op = Math.min(1, opacity);
  const mat = new THREE.MeshBasicMaterial({
    color, transparent: op < 0.999, opacity: op,
    depthTest: false, depthWrite: false, side: THREE.DoubleSide,
  });
  if (addOrientedBox(seamSeg.seamLenWorld, ribbon, t, bump, 5, mat, seamSeg.centerWorld)) return;
  const ox = faceOut.x * bump;
  const oy = faceOut.y * bump;
  const oz = faceOut.z * bump;
  const { seamAx, edgeAx } = _jointFaceSeamAndEdgeAxes(bbox, jointIdx, panelRoot);
  const sz = { x: 0, y: 0, z: 0 };
  sz[seamAx] = seamSeg.seamLenWorld;
  sz[edgeAx] = ribbon;
  sz[faceAxis] = t;
  const p = {
    x: seamSeg.centerWorld.x,
    y: seamSeg.centerWorld.y,
    z: seamSeg.centerWorld.z,
  };
  p[faceAxis] = facePos;
  const m = new THREE.Mesh(new THREE.BoxGeometry(sz.x, sz.y, sz.z), mat);
  m.position.set(p.x + ox, p.y + oy, p.z + oz);
  m.renderOrder = 5;
  group.add(m);
}

/** localStorage: схемы крепежа (как в admin-new-bundle) */
/** localStorage текущего окна, иначе parent (embedded iframe иногда видит пустой store). */
function _lsReadJsonArr(key) {
  const tryStore = (store) => {
    try {
      const raw = store?.getItem?.(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (_) {
      return null;
    }
  };
  let arr = tryStore(typeof localStorage !== 'undefined' ? localStorage : null);
  if (arr && arr.length) return arr;
  try {
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      arr = tryStore(window.parent.localStorage);
      if (arr && arr.length) return arr;
    }
  } catch (_) {}
  return arr || [];
}

/**
 * Кеш на один rebuild(): поиск панели стыка + LS схем/шаблонов.
 * Без этого каждый CabinetModelNode при _build_pos/_build_rot снова
 * парсит LS и обходит родителей (hang ~10–20с на карточке с крепежом).
 */
let __cldJointPanelByFurn = null;
let __cldLsDrillSchemesCache = null;
let __cldLsDrillTemplatesCache = null;
let __cldLsDrillSchemesById = null;
let __cldLsDrillTemplatesById = null;
let __cldLiveJointTplByModel = null;
let __cldJointFrameByFurn = null;
let __cldEnrichJointEntryCache = null;

function __cldClearJointLiveCaches() {
  __cldJointPanelByFurn = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  __cldLsDrillSchemesCache = null;
  __cldLsDrillTemplatesCache = null;
  __cldLsDrillSchemesById = null;
  __cldLsDrillTemplatesById = null;
  __cldLiveJointTplByModel = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  __cldJointFrameByFurn = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  __cldEnrichJointEntryCache = new Map();
}

function _lsJointSchemesArr() {
  // Тот же ключ LS, что _lsDrillSchemesArr — один кеш на rebuild (иначе JSON.parse на каждый enrich).
  return _lsDrillSchemesArr();
}

/** Позиции по умолчанию (offset 50 / step 32), если схема не найдена в LS. */
function _defaultJointPositionsMm(seamLen) {
  const L = Number(seamLen) || 0;
  if (L <= 0) return [];
  const off = 50;
  const step = 32;
  const minOpp = 50;
  if (L < off + minOpp) return [L / 2];
  const positions = [];
  for (let pos = off; pos <= L - minOpp + 0.01; pos += step) positions.push(pos);
  if (!positions.length) return [L / 2];
  return positions;
}

/** Табличное количество: ближний якорь = off от базы, дальний — по сетке step, ≥ minOpp от края. */
function _fromBaseForcedSpreadPositionsMm(seamLen, forcedCount, fromPivot, off, minOpp, stepMm) {
  const step = Number(stepMm) > 0 ? Number(stepMm) : 32;
  const n = forcedCount;
  if (n <= 0) return [];
  let lo;
  let hi;
  if (fromPivot) {
    lo = off;
    const maxHi = seamLen - minOpp;
    hi = lo + Math.floor((maxHi - lo) / step) * step;
  } else {
    hi = seamLen - off;
    lo = hi - Math.floor((hi - minOpp) / step) * step;
  }
  if (hi < lo - 0.01) {
    return n >= 1 ? [seamLen / 2] : [];
  }
  if (n === 1) return [seamLen / 2];
  if (n === 2) return lo <= hi ? [lo, hi] : [hi, lo];
  const gap = (hi - lo) / (n - 1);
  return Array.from({ length: n }, (_, i) => lo + i * gap);
}

/** Расчёт позиций крепежа вдоль шва (как calcSchemePositions в admin-new-bundle.js). */
function _calcJointSchemePositionsMm(scheme, seamLen) {
  if (!scheme || seamLen <= 0) return { positions: [], count: 0, mode: '' };
  let forcedCount = 0;
  const rules = (scheme.countRules || []).slice().sort((a, b) => a.from - b.from);
  for (const rule of rules) {
    if (seamLen >= rule.from && seamLen <= rule.to) {
      forcedCount = rule.count;
      break;
    }
  }
  const off = Number(scheme.offsetFromBase) >= 0 ? Number(scheme.offsetFromBase) : 50;
  const step = Number(scheme.step) > 0 ? Number(scheme.step) : 32;
  const minOpp = Number(scheme.minOffsetOpposite) >= 0 ? Number(scheme.minOffsetOpposite) : 32;
  const symOff = Number(scheme.symOffset) >= 0 ? Number(scheme.symOffset) : 50;

  if (scheme.schemeType === 'symmetric') {
    if (forcedCount > 0) {
      const positions = [];
      if (forcedCount === 1) positions.push(seamLen / 2);
      else {
        const gap = (seamLen - 2 * symOff) / (forcedCount - 1);
        for (let i = 0; i < forcedCount; i++) positions.push(symOff + i * gap);
      }
      return { positions, count: positions.length, mode: 'symmetric-forced' };
    }
    if (seamLen - 2 * symOff <= 0) return { positions: [seamLen / 2], count: 1, mode: 'symmetric-center' };
    return { positions: [symOff, seamLen - symOff], count: 2, mode: 'symmetric-2' };
  }

  const maxPos = seamLen - minOpp;
  const minPos = minOpp;
  const fromPivot = String(scheme.base || 'back').toLowerCase() !== 'front';
  if (forcedCount > 0) {
    const positions = _fromBaseForcedSpreadPositionsMm(seamLen, forcedCount, fromPivot, off, minOpp, step);
    return { positions, count: positions.length, mode: 'from-base-forced' };
  }
  const positions = [];
  if (fromPivot) {
    let pos = off;
    while (pos <= maxPos + 0.01) {
      positions.push(pos);
      pos += step;
    }
  } else {
    let pos = seamLen - off;
    while (pos >= minPos - 0.01) {
      positions.push(pos);
      pos -= step;
    }
    positions.sort((a, b) => a - b);
  }
  return { positions, count: positions.length, mode: 'from-base' };
}

function _enrichJointEntryFromLs(j) {
  const sid = Number(j?.schemeId);
  const cacheKey =
    sid +
    '|' +
    String(j?.jointIdx ?? '') +
    '|' +
    String(j?.contactId ?? '') +
    '|' +
    String(j?.templateId ?? '') +
    '|' +
    String(j?.facing ?? '') +
    '|' +
    (Array.isArray(j?.positions) ? j.positions.join(',') : '');
  if (__cldEnrichJointEntryCache && __cldEnrichJointEntryCache.has(cacheKey)) {
    return __cldEnrichJointEntryCache.get(cacheKey);
  }
  const sch = sid ? _lsDrillSchemeById(sid) : null;
  const seam = Number(j.seamLen) || 0;
  // Только явно сохранённые positions. Не печём из stamp seamLen карточки полки
  // (191 мм при depth 200) — иначе в шкафу 600 отступы «как на полке», не как в шаблоне+геометрии.
  // Станции считаются при отрисовке по geom seam (как applyJointFittingHoles в комнате).
  const storedPos = Array.isArray(j.positions)
    ? j.positions.map(Number).filter((n) => Number.isFinite(n))
    : [];
  const facing = String(j.facing || 'inside').toLowerCase() === 'outside' ? 'outside' : 'inside';
  const out = {
    jointIdx: Number(j.jointIdx),
    schemeId: sid,
    schemeName: String(j.schemeName || sch?.name || ''),
    templateId: Number(j.templateId) || Number(sch?.templateId) || 0,
    setupType: Number(j.setupType) || 0,
    seamLen: seam,
    seamSizeKey: String(j.seamSizeKey || ''),
    hostFaceType: j.hostFaceType || null,
    neighborFaceType: j.neighborFaceType || null,
    contactId: j.contactId != null ? String(j.contactId) : null,
    neighborName: j.neighborName || null,
    conditionKey: j.conditionKey || null,
    facing,
    positions: storedPos,
    count: storedPos.length,
    cabinetModelId:
      Number(j.cabinetModelId) ||
      Number(sch?.cabinetModelId) ||
      0,
  };
  if (__cldEnrichJointEntryCache) __cldEnrichJointEntryCache.set(cacheKey, out);
  return out;
}

/** Длина шва CAD: перекрытие контакта (линия стыка), не полный край панели/секции. */
function _jointSeamLenGeomMm(panelRoot, bbox, jIdx, contact, frameOpt) {
  const fr = frameOpt || getJointStripeFrameWorld(panelRoot, jIdx);
  return jointSeamGeomLenPreferContactMm(
    contact,
    bbox,
    jIdx,
    UNITS_MM,
    Number(fr?.seamLenWorld) || 0,
  );
}

/**
 * CAD этап 2: станции схемы — общий resolveJointSchemeStationsMm (комната / CFRN / превью).
 */
function _jointResolveSchemeStationsMm(schemeEntry, seamGeomMm) {
  const sid = Number(schemeEntry?.schemeId);
  const sch = (_lsJointSchemesArr() || []).find((s) => Number(s.id) === sid) || null;
  const { seamLenMm, positions } = resolveJointSchemeStationsMm({
    scheme: sch,
    seamGeomMm,
    seamStoredMm: Number(schemeEntry?.seamLen) || 0,
    authoredPositions: schemeEntry?.positions,
  });
  if (positions.length) return positions;
  // LS пуст / схема не найдена — всё равно показать по отступам-дефолту на живом шве.
  const seam = seamLenMm || resolveJointSeamLenMm(seamGeomMm, Number(schemeEntry?.seamLen) || 0);
  if (seam <= 0) return [];
  if (sch) {
    const calc = _calcJointSchemePositionsMm(sch, seam);
    if (calc?.positions?.length) return calc.positions;
  }
  return _defaultJointPositionsMm(seam);
}

function _walkTemplateTreeJointPaths(items, basePath, out) {
  if (!Array.isArray(items)) return;
  items.forEach((item, i) => {
    // Пути как в движке iframe: ModuleRoot = «0», дети — 0,0 / 0,0,0 / …
    // (совпадает с domPathToIframePath из админки). Не использовать base '' —
    // иначе «0,0» это полка в DOM, но секция в iframe → крепёж после save пропадает.
    const path = (basePath === '' || basePath == null) ? String(i) : `${basePath},${i}`;
    const t = String(item?.type || '').toLowerCase();
    // wall / facade / flat-module — все панели, на которые вешают jointSchemes.
    // Без facade эксцентрики ящика есть в JSON, но отверстия в превью не появляются.
    if (
      item &&
      (t === 'wall' || t === 'facade' || t === 'module') &&
      Array.isArray(item.jointSchemes) &&
      item.jointSchemes.length > 0
    ) {
      out[path] = item.jointSchemes.map((j) => _enrichJointEntryFromLs(j));
    }
    // Flat-полка: если схем ещё нет на stub — добрать с карточки (после sync без normalize).
    if (
      item &&
      t === 'module' &&
      __cldIsFlatCatalogShelfSpec(item.spec, item) &&
      !(Array.isArray(item.jointSchemes) && item.jointSchemes.length)
    ) {
      const js = __cldReadFlatShelfJointSchemes(item);
      if (js && js.length) {
        out[path] = js.map((j) => _enrichJointEntryFromLs(j));
      }
    }
    if (item && Array.isArray(item.children) && item.children.length) {
      _walkTemplateTreeJointPaths(item.children, path, out);
    }
  });
}

/** После rebuild подтягиваем jointSchemes из clodisJSON (moduleTemplateTree) — иначе маркеры пустые до ручного postMessage. */
function _hydrateJointSchemesStoreFromTemplateTree() {
  const next = {};
  if (Array.isArray(moduleTemplateTree) && moduleTemplateTree.length > 0) {
    _walkTemplateTreeJointPaths(moduleTemplateTree, '0', next);
  }
  // Flat-полки: normalize ставит jointSchemes на 3D-узел, но не в сырой moduleTemplateTree.
  // Без этого прохода в превью шкафа «нет полкодержателей», хотя в комнате они есть.
  if (rootGroup && typeof rootGroup.traverse === 'function') {
    rootGroup.traverse((o) => {
      if (!o) return;
      const path = String(o.userData?.path || '').trim();
      if (!path || next[path]) return;
      let schemes = o.userData?.jointSchemes || o.config?.jointSchemes;
      if (!(Array.isArray(schemes) && schemes.length)) {
        const cfg = o.config || o.userData?.params;
        if (cfg && __cldIsFlatCatalogShelfSpec(cfg.spec, cfg)) {
          schemes = __cldReadFlatShelfJointSchemes(cfg);
          if (Array.isArray(schemes) && schemes.length) {
            o.userData.jointSchemes = schemes;
            if (o.config) o.config.jointSchemes = schemes;
          }
        }
      }
      if (!(Array.isArray(schemes) && schemes.length)) return;
      next[path] = schemes.map((j) => _enrichJointEntryFromLs(j));
    });
  }
  _jointSchemesStore = next;
  try {
    const keys = Object.keys(next);
    const pts = keys.reduce((n, k) => n + (next[k] || []).reduce((m, e) => m + (e.positions?.length || 0), 0), 0);
    console.log('[CLD-JOINT][iframe] hydrate jointSchemes from tree+scene', { paths: keys, totalHolePoints: pts });
  } catch (_) {}
}
function _lsDrillTemplatesArr() {
  if (__cldLsDrillTemplatesCache) return __cldLsDrillTemplatesCache;
  __cldLsDrillTemplatesCache = _lsReadJsonArr('clodis_drilling_templates_v2');
  return __cldLsDrillTemplatesCache;
}
function _lsDrillSchemesArr() {
  if (__cldLsDrillSchemesCache) return __cldLsDrillSchemesCache;
  __cldLsDrillSchemesCache = _lsReadJsonArr('clodis_drill_schemes_v1');
  return __cldLsDrillSchemesCache;
}

function _lsDrillSchemeById(schemeId) {
  const id = Number(schemeId) || 0;
  if (!id) return null;
  if (!__cldLsDrillSchemesById) {
    __cldLsDrillSchemesById = new Map();
    for (const s of _lsDrillSchemesArr()) {
      const sid = Number(s?.id);
      if (sid) __cldLsDrillSchemesById.set(sid, s);
    }
  }
  return __cldLsDrillSchemesById.get(id) || null;
}

function _lsDrillTemplateById(tplId) {
  const id = Number(tplId) || 0;
  if (!id) return null;
  if (!__cldLsDrillTemplatesById) {
    __cldLsDrillTemplatesById = new Map();
    for (const t of _lsDrillTemplatesArr()) {
      const tid = Number(t?.id);
      if (tid) __cldLsDrillTemplatesById.set(tid, t);
    }
  }
  return __cldLsDrillTemplatesById.get(id) || null;
}

function _liveJointFacingForPanelEntry(panel, schemeId, jointIdx) {
  if (!panel) return 'inside';
  const panelPath = String(panel.userData?.path || '').trim();
  const rawSchemes =
    (panelPath && _jointSchemesStore[panelPath]) ||
    panel.config?.jointSchemes ||
    [];
  if (!Array.isArray(rawSchemes) || !rawSchemes.length) return 'inside';
  const entry = rawSchemes
    .map((j) => _enrichJointEntryFromLs(j))
    .find((j) => Number(j.jointIdx) === Number(jointIdx) && Number(j.schemeId) === Number(schemeId));
  const f = String(entry?.facing || 'inside').toLowerCase();
  return f === 'outside' || f === '180' ? 'outside' : 'inside';
}

function _findJointPanelForModelNode(modelNode) {
  const furn = modelNode?.userData?.parent;
  if (!furn) return null;
  return _findJointPanelForFurnitureNode(furn);
}

/** Смещение 3D model в СК шаблона (как превью: pos −1,0,0). Facing — в furniture templateFrame. */
function _liveJointResolveTemplateForModel(cfg, parentCfg, modelNode) {
  if (__cldLiveJointTplByModel && modelNode && __cldLiveJointTplByModel.has(modelNode)) {
    return __cldLiveJointTplByModel.get(modelNode);
  }
  const schemeId = Number(cfg?.schemeId) || Number(parentCfg?.schemeId) || 0;
  const scheme = schemeId ? _lsDrillSchemeById(schemeId) : null;
  let tplId =
    Number(scheme?.templateId) ||
    Number(cfg?.templateId) ||
    Number(parentCfg?.templateId) ||
    0;
  // Схема на детали (Install), но может отсутствовать в clodis_drill_schemes_v1 iframe.
  // Обход родителей как в 1.345 (schemeId || modelNode); hang закрыт break parent===self в _findJointPanel*.
  if (!tplId && (schemeId || modelNode)) {
    const panel =
      _findJointPanelForModelNode(modelNode) ||
      _findJointPanelForFurnitureNode(modelNode?.userData?.parent || modelNode);
    const raw =
      panel?.userData?.jointSchemes ||
      panel?.config?.jointSchemes ||
      [];
    const ent = (Array.isArray(raw) ? raw : []).find((j) => {
      if (schemeId && Number(j.schemeId) === schemeId) return true;
      if (cfg?.contactId != null && j.contactId != null && String(j.contactId) === String(cfg.contactId)) {
        return true;
      }
      if (
        parentCfg?.contactId != null &&
        j.contactId != null &&
        String(j.contactId) === String(parentCfg.contactId)
      ) {
        return true;
      }
      return false;
    });
    tplId = Number(ent?.templateId) || 0;
  }
  const tpl = tplId ? _lsDrillTemplateById(tplId) : null;
  if (__cldLiveJointTplByModel && modelNode) {
    __cldLiveJointTplByModel.set(modelNode, tpl);
  }
  return tpl;
}

function _liveJointModelVisualOffsetFromModelConfig(cfg, parentCfg, modelNode) {
  const isTemplateModel =
    Number(cfg?.spec?.joint_template_model) === 1 || cfg?.spec?.jointTemplateModel;
  if (!isTemplateModel) return null;
  const fromJoint =
    !!cfg?.fromJointScheme ||
    !!parentCfg?.fromJointScheme ||
    Number(cfg?.spec?.joint_hardware) === 1;
  if (!fromJoint) return null;
  const tpl = _liveJointResolveTemplateForModel(cfg, parentCfg, modelNode);
  if (!tpl) return null;
  // Как превью шаблона присадки: корпус ← jointModelVisualOffsetMm, фасад ← facadeModelVisualOffsetMm.
  const part = String(cfg?.spec?.hingePart || '').toLowerCase();
  if (part === 'facade') {
    return _normalizeJointModelVisualOffsetMm(tpl.facadeModelVisualOffsetMm);
  }
  return _resolveJointModelVisualOffsetMm(tpl);
}

/** rot из шаблона присадки (как превью сверловки). */
function _liveJointTemplateModelRotDeg(cfg, parentCfg, modelNode) {
  if (!(Number(cfg?.spec?.joint_template_model) === 1 || cfg?.spec?.jointTemplateModel)) return null;
  const tpl = _liveJointResolveTemplateForModel(cfg, parentCfg, modelNode);
  if (!tpl) return null;
  const part = String(cfg?.spec?.hingePart || '').toLowerCase();
  const rotSrc =
    part === 'facade' ? tpl.facadeModelVisualRotDeg : tpl.jointModelVisualRotDeg;
  const base = _normalizeJointModelVisualOffsetMm(rotSrc);
  // Facing «Снаружи» уже в templateFrame (eY/eZ negate) — не дублируем rot.x 180.
  return { x: base.x, y: base.y, z: base.z };
}

function _jointGhostPreviewActive() {
  return !!(typeof window !== 'undefined' && window.transparentOutlineMode);
}

/** localStorage: конструктор крепежа (вкладка "Создание крепежа"). */
function _lsFastenersBuilderItemsArr() {
  try {
    let raw = typeof localStorage !== 'undefined' ? localStorage.getItem('clodis_fasteners_builder_v2') : null;
    if (!raw) raw = typeof localStorage !== 'undefined' ? localStorage.getItem('clodis_fasteners_builder_v1') : null;
    const data = raw ? JSON.parse(raw) : null;
    const types = Array.isArray(data?.types) ? data.types : [];
    const out = [];
    for (const t of types) {
      const items = Array.isArray(t?.items) ? t.items : [];
      for (const i of items) {
        out.push({
          typeId: String(t?.id || ''),
          typeName: String(t?.name || ''),
          typeKey: String(t?.typeKey || ''),
          itemId: String(i?.id || ''),
          itemName: String(i?.name || ''),
          schemeType: String(i?.schemeType || 'bm_type_1'),
          schemeVariant: String(i?.schemeVariant || 'v1'),
          rows: Array.isArray(i?.rows) ? i.rows : [],
        });
      }
    }
    return out;
  } catch (_) {
    return [];
  }
}

/** BM-строки -> отверстия шаблона присадки. Поддержка всех 13 типов по typeKey. */
function _bmRowsToTemplateRawHoles(rows, schemeType, schemeVariant, typeKey) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const out = [];
  const vSign = String(schemeVariant || 'v1') === 'v2' ? -1 : 1;
  const st = String(schemeType || 'bm_type_1');
  const tk = String(typeKey || '').toLowerCase();

  rows.forEach((r, idx) => {
    const row = r && typeof r === 'object' ? r : {};
    const v = (k) => Number(row[k] || row[k.toLowerCase()] || 0);
    const x = v('x'), y = v('y'), d = v('d'), h = v('h');
    const d1 = v('d1'), h1 = v('h1'), d2 = v('d2'), h2 = v('h2'), a = v('a');
    const ySigned = vSign * y, aSigned = vSign * a;

    const pushHole = ({ name, diameter, depth, xMm, yMm, zMm, mountSide, coordBase, through }) => {
      if (!(Number(diameter) > 0)) return;
      if (!through && !(Number(depth) > 0)) return;
      out.push({
        id: `${idx + 1}-${out.length + 1}`, name,
        diameter: Number(diameter), depth: through ? 999 : Number(depth),
        direction: '-z',
        x: Number(xMm) || 0, y: Number(yMm) || 0, z: Number(zMm) || 0,
        mountSide: String(mountSide || 'auto'), coordBase: String(coordBase || 'auto'),
        through: !!through,
      });
    };

    // --- single-panel types ---
    if (tk === 'blind_holes' || tk === 'pushers') {
      pushHole({ name: `${tk} #${idx+1}`, diameter: d, depth: h, xMm: 0, yMm: 0, zMm: 0, mountSide: 'face', coordBase: 'from_face' });
      return;
    }
    if (tk === 'through_holes') {
      pushHole({ name: `through #${idx+1}`, diameter: d, depth: 0, xMm: 0, yMm: 0, zMm: 0, mountSide: 'face', coordBase: 'from_face', through: true });
      return;
    }
    if (tk === 'knob_handles') {
      pushHole({ name: `knob #${idx+1}`, diameter: d, depth: h || 20, xMm: 0, yMm: 0, zMm: 0, mountSide: 'face', coordBase: 'from_face' });
      return;
    }
    if (tk === 'bar_handles') {
      pushHole({ name: `bar-L #${idx+1}`, diameter: d, depth: h || 20, xMm: -(a / 2), yMm: 0, zMm: 0, mountSide: 'face', coordBase: 'from_face' });
      pushHole({ name: `bar-R #${idx+1}`, diameter: d1, depth: h || 20, xMm: a / 2, yMm: 0, zMm: 0, mountSide: 'face', coordBase: 'from_face' });
      return;
    }

    // --- L-joint types ---
    if (tk === 'eurovinty' || tk === 'screws') {
      pushHole({ name: `${tk} edge #${idx+1}`, diameter: d1, depth: h, xMm: 0, yMm: 0, zMm: 0, mountSide: 'edge', coordBase: 'from_face' });
      if (d2 > 0) pushHole({ name: `${tk} face #${idx+1}`, diameter: d2, depth: h1, xMm: 0, yMm: 0, zMm: 0, mountSide: 'face', coordBase: 'from_seam' });
      return;
    }
    if (tk === 'nails') {
      pushHole({ name: `nail #${idx+1}`, diameter: d1, depth: h, xMm: 0, yMm: 0, zMm: 0, mountSide: 'face', coordBase: 'from_face' });
      return;
    }
    if (tk === 'dowels') {
      pushHole({ name: `dowel edge #${idx+1}`, diameter: d, depth: h1, xMm: 0, yMm: ySigned, zMm: 0, mountSide: 'edge', coordBase: 'from_face' });
      pushHole({ name: `dowel face #${idx+1}`, diameter: d, depth: h2, xMm: 0, yMm: ySigned, zMm: 0, mountSide: 'face', coordBase: 'from_seam' });
      return;
    }
    if (tk === 'shelf_supports') {
      pushHole({ name: `shelf #${idx+1}`, diameter: d, depth: h, xMm: 0, yMm: ySigned, zMm: 0, mountSide: 'edge', coordBase: 'from_face' });
      return;
    }
    if (tk === 'corners') {
      if (d > 0) pushHole({ name: `corner #${idx+1}`, diameter: d, depth: h, xMm: 0, yMm: 0, zMm: 0, mountSide: 'face', coordBase: 'from_face' });
      return;
    }
    if (tk === 'hinges') {
      pushHole({ name: `hinge cup #${idx+1}`, diameter: d, depth: h, xMm: x, yMm: ySigned, zMm: 0, mountSide: 'face', coordBase: 'from_seam' });
      if (d1 > 0 && h1 > 0) {
        pushHole({ name: `hinge screw-1 #${idx+1}`, diameter: d1, depth: h1, xMm: x, yMm: ySigned, zMm: 0, mountSide: 'face', coordBase: 'from_seam' });
      }
      return;
    }

    // --- ties (default, most complex) ---
    if (tk === 'ties' || st === 'bm_type_1' || !tk) {
      pushHole({ name: `edge #${idx+1}`, diameter: d1, depth: h1, xMm: 0, yMm: ySigned, zMm: 0, mountSide: 'edge', coordBase: 'from_face' });
      pushHole({ name: `face #${idx+1}`, diameter: d2, depth: h2, xMm: x, yMm: ySigned, zMm: aSigned, mountSide: 'face', coordBase: 'from_seam' });
      if (d > 0 && h > 0) {
        pushHole({ name: `aux #${idx+1}`, diameter: d, depth: h, xMm: h, yMm: ySigned, zMm: aSigned, mountSide: 'edge', coordBase: 'from_face' });
      }
      return;
    }

    // fallback for legacy bm_type_2 / bm_type_3
    if (st === 'bm_type_2') {
      pushHole({ name: `face-1 #${idx+1}`, diameter: d1, depth: h1, xMm: Math.max(0, x - h * 0.5), yMm: ySigned, zMm: aSigned, mountSide: 'face', coordBase: 'from_seam' });
      pushHole({ name: `face-2 #${idx+1}`, diameter: d2, depth: h2, xMm: x, yMm: ySigned, zMm: 0, mountSide: 'face', coordBase: 'from_seam' });
      return;
    }
    if (st === 'bm_type_3') {
      pushHole({ name: `edge-1 #${idx+1}`, diameter: d1, depth: h1, xMm: 0, yMm: ySigned, zMm: 0, mountSide: 'edge', coordBase: 'from_face' });
      pushHole({ name: `edge-2 #${idx+1}`, diameter: d2, depth: h2, xMm: 0, yMm: ySigned, zMm: 0, mountSide: 'edge', coordBase: 'from_face' });
      return;
    }
  });
  return out;
}

/** Ключи направления — __CLD_DRILL_RESOLVE.DRILL_DIR_VEC (этап 4). */
const _DRILL_DIR_VEC =
  (typeof globalThis !== 'undefined' &&
    globalThis.__CLD_DRILL_RESOLVE &&
    globalThis.__CLD_DRILL_RESOLVE.DRILL_DIR_VEC) || {
    x: [1, 0, 0],
    '-x': [-1, 0, 0],
    y: [0, 1, 0],
    '-y': [0, -1, 0],
    z: [0, 0, 1],
    '-z': [0, 0, -1],
  };

/** CabinetHole._build_direction() (ref): remap template direction by panel orientation (v/h/f). */
function _cabinetHoleRemapDirection(dirKey, orientationFlag) {
  const g = String(dirKey || '-z').toLowerCase();
  const f = String(orientationFlag || 'f').toLowerCase();
  if (!['x', '-x', 'y', '-y', 'z', '-z'].includes(g)) return '-z';

  if (f === 'v') {
    switch (g) {
      case 'x': return 'z';
      case '-x': return '-z';
      case 'z': return 'x';
      case '-z': return '-x';
      case 'y': return 'y';
      case '-y': return '-y';
    }
  }

  if (f === 'h') {
    switch (g) {
      case 'x': return 'x';
      case '-x': return '-x';
      case 'y': return 'z';
      case '-y': return '-z';
      case 'z': return 'y';
      case '-z': return '-y';
    }
  }

  return g;
}

/** ref: conv_pivot */
function _convPivotRef(pivotCode, sizeDim) {
  let f = pivotCode;
  if (typeof f === 'string') {
    switch (f) {
      case 'left':
      case 'bottom':
        f = -1;
        break;
      case 'top':
      case 'right':
        f = 1;
        break;
      case 'center':
        f = 0;
        break;
    }
  }
  const n = Number(f);
  if (!Number.isFinite(n)) return 0;
  return (-n * sizeDim) / 2;
}

/**
 * ref: CabinetHole._build_pos (furniture parent), returns local position (scene units) + swapped real_pos fields.
 * We always treat joint preview as "furniture child" (n=true in ref).
 */
function _cabinetHoleBuildPosRefUnits(parentSizeMm, posMm, realSizeMm, dirRemapped, globalFlag) {
  const px = Number(posMm?.x) || 0;
  const py = Number(posMm?.y) || 0;
  const pz = Number(posMm?.z) || 0;
  const rx = Number(realSizeMm?.x) || 0;
  const ry = Number(realSizeMm?.y) || 0;
  const rz = Number(realSizeMm?.z) || 0;

  const psx = Number(parentSizeMm?.x) || 0;
  const psy = Number(parentSizeMm?.y) || 0;
  const psz = Number(parentSizeMm?.z) || 0;

  const g = globalFlag ? 1 : 0;
  const u = UNITS_MM;

  let j;
  let k;
  let l;
  const realPos = { x: px, y: py, z: pz };

  switch (dirRemapped) {
    case 'x':
      j = g === 1 ? (-psx / 2 + pz + rz / 2) / u : -psx / 2 / u;
      k = (-psy / 2 + py) / u;
      l = (-psz / 2 + px) / u;
      realPos.z = px;
      realPos.x = pz;
      break;
    case '-x':
      j = g === 1 ? (psx / 2 + pz + -rz / 2) / u : psx / 2 / u;
      k = (-psy / 2 + py) / u;
      l = (-psz / 2 + px) / u;
      realPos.z = px;
      realPos.x = pz;
      break;
    case 'y':
      k = g === 1 ? (-psy / 2 + pz + rz / 2) / u : -psy / 2 / u;
      j = (-psx / 2 + px) / u;
      l = (-psz / 2 + py) / u;
      realPos.y = pz;
      realPos.z = py;
      break;
    case '-y':
      k = g === 1 ? (psy / 2 + pz + -rz / 2) / u : psy / 2 / u;
      j = (-psx / 2 + px) / u;
      l = (-psz / 2 + py) / u;
      realPos.y = pz;
      realPos.z = py;
      break;
    case 'z':
      l = g === 1 ? (-psz / 2 + pz + rz / 2) / u : -psz / 2 / u;
      j = (-psx / 2 + px) / u;
      k = (-psy / 2 + py) / u;
      break;
    case '-z':
      l = g === 1 ? (psz / 2 + pz + -rz / 2) / u : psz / 2 / u;
      j = (-psx / 2 + px) / u;
      k = (-psy / 2 + py) / u;
      break;
    default:
      j = px / u;
      k = py / u;
      l = pz / u;
      break;
  }

  return { j, k, l, realPos };
}

/** ref: CabinetHole._build_pivot translation in own_object local space (scene units) */
function _cabinetHoleBuildPivotTranslationUnits(realSizeMm, dirRemapped) {
  const rx = Number(realSizeMm?.x) || 0;
  const ry = Number(realSizeMm?.y) || 0;
  const rz = Number(realSizeMm?.z) || 0;
  const u = UNITS_MM;

  const table = {
    x: [-1, 0, 0, rz, ry, rx],
    '-x': [1, 0, 0, rz, ry, rx],
    y: [0, -1, 0, rx, rz, ry],
    '-y': [0, 1, 0, rx, rz, ry],
    z: [0, 0, -1, rx, ry, rz],
    '-z': [0, 0, 1, rx, ry, rz],
  };
  const row = table[dirRemapped] || [0, 0, 0, rx, ry, rz];
  const pivotX = _convPivotRef(row[0], row[3]);
  const pivotY = _convPivotRef(row[1], row[4]);
  const pivotZ = _convPivotRef(row[2], row[5]);
  return new THREE.Vector3(pivotX / u, pivotY / u, pivotZ / u);
}

/** Нормализация массива отверстий из записи шаблона (админка → превью / стыки). */
function _normalizeDrillTemplateRawHoles(raw, logPrefix) {
  if (!Array.isArray(raw)) return [];
  const holes = raw
    .map((h, i) => {
      if (!h || typeof h !== 'object') return null;
      const through = !!(h.through || h.isThrough || h.thru);
      const d = Number(
        h.diameter ?? h.diameterMm ?? h.dia ?? h.D ?? h.drillDiameter ?? h.drill_diameter ?? h.size
      );
      let dep = Number(
        h.depth ?? h.depthMm ?? h.length ?? h.h ?? h.L ?? h.drillDepth ?? h.drill_depth ?? h.maxDepth
      );
      if (!Number.isFinite(d) || d <= 0) {
        if (__cldIsPreviewVerbose()) {
          console.warn(logPrefix + ' отверстие отфильтровано (нет Ø):', h);
        }
        return null;
      }
      if (through) {
        if (!Number.isFinite(dep) || dep <= 0) dep = 220;
      } else if (!Number.isFinite(dep) || dep <= 0) {
        if (__cldIsPreviewVerbose()) {
          console.warn(logPrefix + ' отверстие отфильтровано (нет глубины):', h);
        }
        return null;
      }
      const depthMm = through ? Math.min(dep, 220) : Math.min(dep, 120);
      const dirKey = String(h.direction || '-z').toLowerCase();
      const gRaw = h.global;
      const global =
        gRaw === 1 || gRaw === '1' ? 1
          : gRaw === 0 || gRaw === '0' ? 0
            : undefined;
      return {
        name: String(h.name || `отв.${i + 1}`),
        diameterMm: d,
        depthMm,
        xMm: Number(h.x ?? h.xMm ?? 0) || 0,
        yMm: Number(h.y ?? h.yMm ?? 0) || 0,
        zMm: Number(h.z ?? h.zMm ?? 0) || 0,
        dirKey,
        coordBase: String(h.coordBase || 'auto').toLowerCase(),
        mountSide: String(h.mountSide || 'auto').toLowerCase(),
        hostPanel: _cldNormalizeHoleHostPanel(h.hostPanel ?? h.host_panel),
        through,
        global,
      };
    })
    .filter(Boolean);
  return holes;
}

/** Отверстия по числовому id шаблона (без схемы стыка) — для узла furniture в дереве. */
/**
 * Model-дети из шаблона присадки: корпус (cabinet/corpus) + фасад для L-пакета.
 */
function _drillTemplateModelChildrenFromInfo(tplInfo) {
  if (!tplInfo || typeof tplInfo !== 'object') return [];
  const out = [];
  const corpusId = Number(tplInfo.corpusModelId) || Number(tplInfo.cabinetModelId) || 0;
  if (corpusId > 0) {
    const off = tplInfo.jointModelVisualOffsetMm || {};
    out.push({
      type: 'model',
      name: tplInfo.corpusModelName || tplInfo.cabinetModelName || `Model_${corpusId}`,
      active: 1,
      size: { x: '1', y: '1', z: '1' },
      pos: {
        x: String(Number(off.x) || 0),
        y: String(Number(off.y) || 0),
        z: String(Number(off.z) || 0),
      },
      pivot: { x: 0, y: 0, z: 0 },
      // Ориентация — только из карточки cabinet_model (loader applyCatalogEntryTransform).
      rot: { x: 0, y: 0, z: 0 },
      c_rot: { x: 0, y: 0, z: 0 },
      spec: {
        id: String(corpusId),
        joint_template_model: 1,
        joint_hardware: 1,
        from_drill_template: 1,
        hingePart: 'corpus',
      },
      children: [],
    });
  }
  const facadeId = Number(tplInfo.facadeModelId) || 0;
  const setupType = Number(tplInfo.setupType) || 0;
  if (setupType === 2 && facadeId > 0) {
    const fOff = tplInfo.facadeModelVisualOffsetMm || {};
    out.push({
      type: 'model',
      name: tplInfo.facadeModelName || `Facade_${facadeId}`,
      active: 1,
      size: { x: '1', y: '1', z: '1' },
      pos: {
        x: String(Number(fOff.x) || 0),
        y: String(Number(fOff.y) || 0),
        z: String(Number(fOff.z) || 0),
      },
      pivot: { x: 0, y: 0, z: 0 },
      rot: { x: 0, y: 0, z: 0 },
      c_rot: { x: 0, y: 0, z: 0 },
      spec: {
        id: String(facadeId),
        joint_template_model: 1,
        joint_hardware: 1,
        from_drill_template: 1,
        hingePart: 'facade',
      },
      children: [],
    });
  }
  return out;
}

function _getDrillTemplateHolesInfoByTemplateId(templateId, setupType = 3) {
  const tid = Number(templateId);
  if (!Number.isFinite(tid) || tid <= 0) {
    return { templateName: '', templateId: 0, holes: [] };
  }
  const templates = _lsDrillTemplatesArr();
  const tpl = templates.find((t) => Number(t.id) === tid);
  if (!tpl) {
    __cldPreviewLog('furni-drill', 'шаблон присадки не найден в localStorage', { templateId: tid });
    return { templateName: '', templateId: tid, holes: [] };
  }

  // Support per-setupType holes (admin editor v18+).
  // If the requested setupType has no holes, fallback to the first non-empty setup to avoid empty preview.
  let raw = [];
  const stKey = String(setupType);
  const hbs = tpl.holesBySetup && typeof tpl.holesBySetup === 'object' ? tpl.holesBySetup : null;
  if (hbs && Array.isArray(hbs[stKey])) {
    raw = hbs[stKey];
    __cldPreviewLog('furni-drill', 'шаблон + setupType → holesBySetup', {
      templateId: tpl.id,
      name: tpl.name,
      setupType: setupType,
      count: raw.length,
    });
  }
  if ((!Array.isArray(raw) || raw.length === 0) && hbs) {
    const firstNonEmpty = Object.keys(hbs).find((k) => Array.isArray(hbs[k]) && hbs[k].length > 0);
    if (firstNonEmpty) {
      raw = hbs[firstNonEmpty];
      __cldPreviewLog('furni-drill', 'шаблон fallback → first non-empty holesBySetup', {
        templateId: tpl.id,
        name: tpl.name,
        requestedSetupType: setupType,
        fallbackSetupType: firstNonEmpty,
        count: raw.length,
      });
    }
  }
  if (!Array.isArray(raw) || raw.length === 0) {
    raw = Array.isArray(tpl.holes) ? tpl.holes : [];
    __cldPreviewLog('furni-drill', 'шаблон → holes (legacy)', {
      templateId: tpl.id,
      name: tpl.name,
      count: raw.length,
    });
  }

  const holes = _normalizeDrillTemplateRawHoles(raw, '[CLD-FURNI]');
  const cabinetModelId = Number(tpl.cabinetModelId) || 0;
  const corpusModelId = Number(tpl.corpusModelId) || cabinetModelId || 0;
  return {
    templateName: tpl.name || '',
    templateId: tpl.id,
    holes,
    setupType: Number(tpl.currentSetupType ?? tpl.setupType ?? setupType) || setupType,
    jointModelVisualOffsetMm: _resolveJointModelVisualOffsetMm(tpl),
    facadeModelVisualOffsetMm: _normalizeJointModelVisualOffsetMm(tpl.facadeModelVisualOffsetMm),
    jointModelVisualRotDeg: _normalizeJointModelVisualOffsetMm(tpl.jointModelVisualRotDeg),
    facadeModelVisualRotDeg: _normalizeJointModelVisualOffsetMm(tpl.facadeModelVisualRotDeg),
    cabinetModelId,
    cabinetModelName: String(tpl.cabinetModelName || ''),
    corpusModelId,
    corpusModelName: String(tpl.corpusModelName || tpl.cabinetModelName || ''),
    facadeModelId: Number(tpl.facadeModelId) || 0,
    facadeModelName: String(tpl.facadeModelName || ''),
  };
}

/**
 * Цилиндры отверстий в локальной системе узла (мм → сцена): точка (x,y,z) — начало,
 * ось — direction из шаблона. То же соглашение, что у крепёжного превью.
 */
function _addLocalDrillHoleMeshes(parent, holeList, materialSolid, materialThrough) {
  if (!parent || !Array.isArray(holeList) || !holeList.length) return;
  const group = new THREE.Group();
  group.name = '__furni_drill_holes';
  const planeAnchorByDir = {};
  for (const hole of holeList) {
    const dirKey = _DRILL_DIR_VEC[hole.dirKey] ? hole.dirKey : '-z';
    const cur = planeAnchorByDir[dirKey];
    if (!cur || (Number(hole.diameterMm) || 0) > cur.diameterMm) {
      // Как admin placeDrillPreview / CabinetHole local CS: (x, −y, −z).
      const u = _drillTemplateLocalPosUnits(hole.xMm, hole.yMm, hole.zMm);
      planeAnchorByDir[dirKey] = {
        diameterMm: Number(hole.diameterMm) || 0,
        startLocal: new THREE.Vector3(u.x, u.y, u.z),
      };
    }
  }
  for (const hole of holeList) {
    const dirKey = _DRILL_DIR_VEC[hole.dirKey] ? hole.dirKey : '-z';
    const dv = _DRILL_DIR_VEC[dirKey] || [0, 0, -1];
    const drillDir = new THREE.Vector3(dv[0], dv[1], dv[2]).normalize();
    const depthCap = hole.through ? 220 : 120;
    const depthMm = Math.min(hole.depthMm, depthCap);
    const r = Math.max((hole.diameterMm / 2) / UNITS_MM, 0.12);
    const h = depthMm / UNITS_MM;
    const uPos = _drillTemplateLocalPosUnits(hole.xMm, hole.yMm, hole.zMm);
    const startLocal = new THREE.Vector3(uPos.x, uPos.y, uPos.z);
    const anchor = planeAnchorByDir[dirKey]?.startLocal;
    if (anchor) {
      // Keep all holes with the same direction on one entry plane
      // (plane of the largest hole, usually the 35mm cup).
      const along = startLocal.clone().sub(anchor).dot(drillDir);
      startLocal.addScaledVector(drillDir, -along);
    }
    if (__cldIsPreviewVerbose()) {
      console.log('[furni-drill] hole', hole.name,
        '| Ømm:', hole.diameterMm, 'depthMm:', depthMm,
        '| dir:', dirKey, '→', dv,
        '| templateXYZ mm:', hole.xMm, hole.yMm, hole.zMm,
        '| startLocal (admin YZ):', startLocal.x.toFixed(3), startLocal.y.toFixed(3), startLocal.z.toFixed(3),
        '| drillDir:', drillDir.x.toFixed(3), drillDir.y.toFixed(3), drillDir.z.toFixed(3),
        '| h(scene):', h.toFixed(4));
    }
    const mat = hole.through && materialThrough ? materialThrough : materialSolid;
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 22, 1), mat);
    cyl.quaternion.setFromUnitVectors(_jointYAxis, drillDir.clone());
    cyl.position.copy(startLocal).addScaledVector(drillDir, h / 2);
    if (__cldIsPreviewVerbose()) {
      console.log('[furni-drill]   → center:', cyl.position.x.toFixed(3), cyl.position.y.toFixed(3), cyl.position.z.toFixed(3));
    }
    cyl.renderOrder = 13;
    cyl.name = `furni_hole_${hole.name}`;
    cyl.userData.isAccessory = true;
    cyl.userData.furniDrillHole = true;
    group.add(cyl);
  }
  parent.add(group);
}

/** true — добавлены цилиндры отверстий (шаблон из localStorage). */
function _appendDrillTemplateHolePreviewToOwnObject(parent, spec, logLabel) {
  const tid = _resolveSpecDrillTemplateId(spec);
  if (!tid) return false;
  const tplInfo = _getDrillTemplateHolesInfoByTemplateId(tid);
  const holeList = tplInfo.holes || [];
  if (!holeList.length) return false;
  const matHole = new THREE.MeshBasicMaterial({
    color: 0x7b1fa2,
    transparent: true,
    opacity: 0.9,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const matThrough = new THREE.MeshBasicMaterial({
    color: 0xff9800,
    transparent: true,
    opacity: 0.85,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  _addLocalDrillHoleMeshes(parent, holeList, matHole, matThrough);
  const meta =
    logLabel && typeof logLabel === 'object'
      ? logLabel
      : { label: logLabel };
  __cldPreviewLog('furni-drill', 'drill preview', {
    ...meta,
    templateId: tplInfo.templateId,
    templateName: tplInfo.templateName,
    n: holeList.length,
  });
  return true;
}

/** Положительный id шаблона присадки из params cabinet_model (без fallback на spec.id — это id 3D-модели). */
function _cldPositiveDrillTemplateField(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function __cldDrillTemplateIdsFromCabinetLikeParams(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const pick = _cldPositiveDrillTemplateField;
  const out = {};
  let f = pick(obj.hingeFacadeDrillTemplateId);
  let d = pick(obj.hingeDoorDrillTemplateId);
  if (f) out.hingeFacadeDrillTemplateId = f;
  if (d) out.hingeDoorDrillTemplateId = d;
  if (out.hingeFacadeDrillTemplateId && out.hingeDoorDrillTemplateId) return out;
  const ordered = [];
  const models = Array.isArray(obj.models) ? obj.models : [];
  for (const m of models) {
    const mp = m?.params;
    if (!mp || typeof mp !== 'object') continue;
    const vf = pick(mp.hingeFacadeDrillTemplateId);
    const vd = pick(mp.hingeDoorDrillTemplateId);
    const vt =
      pick(mp.drillTemplateId) ||
      pick(mp.drillingTemplateId) ||
      pick(mp.templateId) ||
      pick(mp.drilling_template_id);
    if (vf) ordered.push(vf);
    if (vd) ordered.push(vd);
    if (vt) ordered.push(vt);
  }
  const uniq = [...new Set(ordered)];
  if (!out.hingeFacadeDrillTemplateId && uniq[0]) out.hingeFacadeDrillTemplateId = uniq[0];
  if (!out.hingeDoorDrillTemplateId && uniq[1]) out.hingeDoorDrillTemplateId = uniq[1];
  return out;
}

function __cldHingeFlatMergedSpec(moduleConfig) {
  const p = moduleConfig && typeof moduleConfig === 'object' ? moduleConfig : {};
  const spec = p.spec && typeof p.spec === 'object' ? { ...p.spec } : {};
  const pickFirst = (...vals) => {
    for (const v of vals) {
      const n = _cldPositiveDrillTemplateField(v);
      if (n) return n;
    }
    return 0;
  };
  const fac = pickFirst(
    spec.hingeFacadeDrillTemplateId,
    p.hingeFacadeDrillTemplateId,
    spec.hinge_facade_drill_template_id,
    p.hinge_facade_drill_template_id,
    spec.drillTemplateId,
    p.drillTemplateId,
    spec.drillingTemplateId,
    p.drillingTemplateId,
    spec.templateId,
    p.templateId,
    spec.drilling_template_id,
    p.drilling_template_id,
  );
  const door = pickFirst(
    spec.hingeDoorDrillTemplateId,
    p.hingeDoorDrillTemplateId,
    spec.hinge_door_drill_template_id,
    p.hinge_door_drill_template_id,
    spec.doorDrillTemplateId,
    p.doorDrillTemplateId,
    spec.door_drill_template_id,
    p.door_drill_template_id,
  );
  const out = { ...spec };
  if (fac) out.hingeFacadeDrillTemplateId = fac;
  if (door) out.hingeDoorDrillTemplateId = door;
  return out;
}

function __cldAppendHingeFlatDrillPreviews(own, flatSpec, mergeSwing, mergeCorpus) {
  if (!own) {
    __cldLogHingeFlatDrill('warn', 'skip: no own_object');
    return;
  }
  const spRaw = flatSpec && typeof flatSpec === 'object' ? { ...flatSpec } : {};
  const sp = __cldHingeFlatMergedSpec({ type: 'module', spec: spRaw, ...spRaw });
  const ms0 = mergeSwing && typeof mergeSwing === 'object' ? mergeSwing : null;
  const mc0 = mergeCorpus && typeof mergeCorpus === 'object' ? mergeCorpus : null;
  const ms = ms0 ? { ...ms0, ...__cldDrillTemplateIdsFromCabinetLikeParams(ms0) } : null;
  const mc = mc0 ? { ...mc0, ...__cldDrillTemplateIdsFromCabinetLikeParams(mc0) } : null;
  const facT =
    _cldPositiveDrillTemplateField(sp.hingeFacadeDrillTemplateId) ||
    _cldPositiveDrillTemplateField(ms?.hingeFacadeDrillTemplateId) ||
    _cldPositiveDrillTemplateField(ms?.drillTemplateId) ||
    _cldPositiveDrillTemplateField(ms?.drillingTemplateId) ||
    _cldPositiveDrillTemplateField(ms?.templateId) ||
    _cldPositiveDrillTemplateField(ms?.drilling_template_id);
  const corpT =
    _cldPositiveDrillTemplateField(sp.hingeDoorDrillTemplateId) ||
    (mc
      ? _cldPositiveDrillTemplateField(mc.hingeDoorDrillTemplateId) ||
        _cldPositiveDrillTemplateField(mc.drillTemplateId) ||
        _cldPositiveDrillTemplateField(mc.drillingTemplateId) ||
        _cldPositiveDrillTemplateField(mc.templateId) ||
        _cldPositiveDrillTemplateField(mc.drilling_template_id)
      : 0) ||
    (!mc && ms ? _cldPositiveDrillTemplateField(ms.hingeDoorDrillTemplateId) : 0);

  __cldLogHingeFlatDrill('info', 'resolve template ids', {
    hingePreviewCabinetModelId: sp.hingePreviewCabinetModelId,
    hingePreviewCabinetCorpusModelId: sp.hingePreviewCabinetCorpusModelId,
    spHingeFacadeDrill: sp.hingeFacadeDrillTemplateId,
    spHingeDoorDrill: sp.hingeDoorDrillTemplateId,
    swingDrill: ms
      ? {
          drillTemplateId: ms.drillTemplateId,
          hingeFacadeDrillTemplateId: ms.hingeFacadeDrillTemplateId,
          hingeDoorDrillTemplateId: ms.hingeDoorDrillTemplateId,
        }
      : null,
    corpusDrill: mc
      ? {
          drillTemplateId: mc.drillTemplateId,
          hingeDoorDrillTemplateId: mc.hingeDoorDrillTemplateId,
        }
      : null,
    resolvedFacadeTemplateId: facT || null,
    resolvedCorpusTemplateId: corpT || null,
  });

  let okFac = false;
  let okCorp = false;
  if (facT) {
    okFac = _appendDrillTemplateHolePreviewToOwnObject(own, { drillTemplateId: facT }, { kind: 'hinge_flat', part: 'facade' });
    __cldLogHingeFlatDrill(okFac ? 'info' : 'warn', 'facade drill append', { templateId: facT, ok: okFac });
    if (!okFac) {
      const inf = _getDrillTemplateHolesInfoByTemplateId(facT);
      __cldLogHingeFlatDrill('warn', 'facade: нет отверстий в шаблоне или шаблон не найден в LS', {
        templateId: facT,
        templateName: inf.templateName,
        holeCount: Array.isArray(inf.holes) ? inf.holes.length : 0,
        lsKey: 'clodis_drilling_templates_v2',
      });
    }
  } else {
    __cldLogHingeFlatDrill('warn', 'facade: no drill template id (проверьте spec / cabinet_model.params)', {
      hint: 'Задайте hingeFacadeDrillTemplateId на элементе или drillTemplateId у записи cabinet_model для половины «фасад».',
    });
  }
  if (corpT && corpT !== facT) {
    okCorp = _appendDrillTemplateHolePreviewToOwnObject(
      own,
      { drillTemplateId: corpT },
      { kind: 'hinge_flat', part: 'corpus' },
    );
    __cldLogHingeFlatDrill(okCorp ? 'info' : 'warn', 'corpus drill append', { templateId: corpT, ok: okCorp });
    if (!okCorp) {
      const inf = _getDrillTemplateHolesInfoByTemplateId(corpT);
      __cldLogHingeFlatDrill('warn', 'corpus: нет отверстий в шаблоне или шаблон не найден в LS', {
        templateId: corpT,
        templateName: inf.templateName,
        holeCount: Array.isArray(inf.holes) ? inf.holes.length : 0,
        lsKey: 'clodis_drilling_templates_v2',
      });
    }
  } else if (corpT && corpT === facT) {
    __cldLogHingeFlatDrill('info', 'corpus: тот же templateId что и фасад — второй набор отверстий не дублируем', { templateId: corpT });
  } else if (
    !corpT &&
    (mc || (sp.hingePreviewCabinetCorpusModelId != null && String(sp.hingePreviewCabinetCorpusModelId).trim() !== ''))
  ) {
    __cldLogHingeFlatDrill('warn', 'corpus: нет id шаблона присадки при наличии половины «корпус»', {
      hingePreviewCabinetCorpusModelId: sp.hingePreviewCabinetCorpusModelId,
      hint: 'Задайте drillTemplateId у cabinet_model корпуса или hingeDoorDrillTemplateId в каталоге петли.',
    });
  }

  if (!facT && !corpT) {
    __cldLogHingeFlatDrill('warn', 'присадка не добавлена: нет ни одного id шаблона (localStorage clodis_drilling_templates_v2 + drillTemplateId в cabinet_model / hinge*DrillTemplateId в каталоге)');
  }
}

try {
  if (__cldEmbeddedPreview) {
    __cldLogHingeAccessoryDrill(
      'info',
      'constructor-clodis загружен в iframe; фильтр консоли родителя: [CLD][hinge-accessory-drill]',
      { hint: 'Логи плоской петли — префикс [flat] в тексте сообщения' },
    );
  }
} catch (_) {}

function _resolveSpecDrillTemplateId(spec) {
  if (!spec || typeof spec !== 'object') return 0;
  // Важно: spec.id у model = id 3D-модели (например 5/6 у петли), а НЕ id шаблона присадки.
  const a = spec.drillTemplateId ?? spec.drillingTemplateId ?? spec.templateId ?? spec.drilling_template_id;
  const n = Number(a);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

try {
  if (typeof window !== 'undefined') {
    window.__CLD_DRILLING_API = {
      resolveTemplateId: _resolveSpecDrillTemplateId,
      getHolesByTemplateId: _getDrillTemplateHolesInfoByTemplateId,
    };
  }
} catch (_) {}

/** Схема + все отверстия из привязанного шаблона (ваш сохранённый конфирмат).
 * setupTypeOverride — из jointSchemes.setupType (при «Установить» в админке) или из шаблона. */
/**
 * Отверстия шаблона присадки по schemeId.
 * opts.templateId — из jointSchemes на детали (если схемы нет в LS iframe — всё равно рисуем/спавним).
 */
function _getSchemeTemplateHoles(schemeId, setupTypeOverride, opts = {}) {
  const schemes = _lsJointSchemesArr();
  const sid = Number(schemeId);
  let sch = schemes.find((s) => Number(s.id) === sid) || null;
  const fallbackTplId = Number(opts?.templateId) || 0;
  const fallbackCmId = Number(opts?.cabinetModelId) || 0;
  if (!sch && fallbackTplId > 0) {
    // Схема есть на детали (Install), но в clodis_drill_schemes_v1 iframe её нет —
    // не обнулять крепёж: берём templateId/cabinetModelId из записи стыка.
    sch = {
      id: sid,
      name: String(opts?.schemeName || ''),
      templateId: fallbackTplId,
      cabinetModelId: fallbackCmId,
    };
  }
  if (!sch) {
    console.warn('[CLD-JOINT][iframe] схема не найдена schemeId=', schemeId, 'все id:', schemes.map(s => s.id));
    return { schemeName: '', templateName: '', templateId: 0, setupType: 3, holes: [] };
  }
  const templates = _lsDrillTemplatesArr();
  const tplId = Number(sch.templateId) || fallbackTplId;
  const tpl = templates.find((t) => Number(t.id) === tplId);
  if (!tpl) {
    console.warn('[CLD-JOINT][iframe] шаблон не найден templateId=', tplId,
      'схема', sch.name, 'все templateId шаблонов:', templates.map(t => t.id),
      '— отверстия не выдумываем (как БМ: схема → шаблон из библиотеки)');
    return {
      schemeName: sch.name || String(opts?.schemeName || ''),
      templateName: '',
      templateId: tplId,
      setupType: Number(setupTypeOverride) || 3,
      holes: [],
      jointModelVisualOffsetMm: null,
      jointModelVisualRotDeg: null,
      cabinetModelId: fallbackCmId || Number(sch.cabinetModelId) || 0,
      cabinetModelName: '',
    };
  }

  const setupType = resolveJointDrillTemplateSetupType(tpl, setupTypeOverride);
  const setupKey = String(setupType);

  let raw = jointTemplateHolesForSetup(tpl, setupType);
  if (__cldIsPreviewVerbose()) {
    console.log('[CLD-JOINT][iframe] holesBySetup/setupType', {
      template: tpl.name,
      setupType,
      setupKey,
      count: raw.length,
      override: setupTypeOverride,
    });
  }

  // Если в шаблоне нет отверстий — пробуем взять описание из "Создание крепежа" (BM-вкладка).
  if (!Array.isArray(raw) || raw.length === 0) {
    const allBm = _lsFastenersBuilderItemsArr();
    const byId = String(tpl?.bmFastenerItemId || '').trim();
    const byName = String(tpl?.bmFastenerName || tpl?.name || '').trim().toLowerCase();
    let bmItem = null;
    if (byId) bmItem = allBm.find((x) => String(x.itemId) === byId) || null;
    if (!bmItem && byName) bmItem = allBm.find((x) => String(x.itemName || '').trim().toLowerCase() === byName) || null;
    if (bmItem && Array.isArray(bmItem.rows) && bmItem.rows.length > 0) {
      raw = _bmRowsToTemplateRawHoles(bmItem.rows, bmItem.schemeType, bmItem.schemeVariant, bmItem.typeKey);
      if (__cldIsPreviewVerbose()) {
        console.log('[CLD-JOINT][iframe] holes from BM fasteners builder', {
          schemeId: sid,
          templateId: tpl.id,
          bmItemId: bmItem.itemId,
          bmTypeKey: bmItem.typeKey,
          bmItemName: bmItem.itemName,
          schemeType: bmItem.schemeType,
          schemeVariant: bmItem.schemeVariant,
          rows: bmItem.rows.length,
          holes: raw.length,
        });
      }
    }
  }

  const holes = _normalizeDrillTemplateRawHoles(raw, '[CLD-JOINT][iframe]');
  if (!holes.length) {
    console.warn('[CLD-JOINT][iframe] в шаблоне нет отверстий — превью фурнитуры пустое', {
      schemeId: sid,
      scheme: sch.name,
      templateId: tpl?.id,
      template: tpl?.name,
      setupType,
      bmFastenerItemId: tpl?.bmFastenerItemId,
    });
  } else if (__cldIsPreviewVerbose()) {
    console.log('[CLD-JOINT][iframe] отверстий в шаблоне присадки (не число крепежей):', holes.length, 'из', raw.length);
  }
  return {
    schemeName: sch.name || String(opts?.schemeName || ''),
    templateName: tpl.name || '',
    templateId: Number(tpl.id) || 0,
    setupType,
    holes,
    jointModelVisualOffsetMm: _resolveJointModelVisualOffsetMm(tpl),
    jointModelVisualRotDeg: tpl?.jointModelVisualRotDeg || null,
    cabinetModelId: Number(tpl.cabinetModelId) || Number(sch.cabinetModelId) || fallbackCmId || 0,
    cabinetModelName: String(tpl.cabinetModelName || sch.cabinetModelName || ''),
  };
}

/** Тонкая ось по габариту меша (аналог buildWall: v → thinX, h → thinY, f → thinZ). */
function _bboxPanelKind(bbox) {
  const s = bbox.getSize(new THREE.Vector3());
  const ax = s.x * UNITS_MM;
  const ay = s.y * UNITS_MM;
  const az = s.z * UNITS_MM;
  const ord = [
    { k: 'thinX', v: ax },
    { k: 'thinY', v: ay },
    { k: 'thinZ', v: az },
  ].sort((a, b) => a.v - b.v);
  const a0 = ord[0].v;
  const a1 = ord[1].v;
  const a2 = ord[2].v;
  if (a0 > 0 && a0 < a1 * 0.35 && a0 < a2 * 0.35) return ord[0].k;
  return 'generic';
}

/**
 * Точка на шве + простой ортонормированный базис шаблона (X/Y/Z как в UI).
 * Смещение отверстия: (x·eX - y·eY - z·eZ) / UNITS_MM — как в админ-превью.
 *
 * Минимальная и стабильная система координат для стыка.
 */
function _jointDrillTemplateFrame(bbox, jointIdx, seamLenMm, pMm, setupType = 3, panelRoot = null, seamSizeKey = '') {
  // Чистая версия — только seam point + базис грани (шов, поперечник, нормаль).
  // Никаких thinX/thinY специальных случаев и CabinetHole-математики.
  const seamPt = _jointSeamPoint(bbox, jointIdx, seamLenMm, pMm, panelRoot, seamSizeKey);
  const { tSeam, tCross, nIn } = _jointFaceBasis(bbox, jointIdx, seamLenMm, panelRoot);
      return {
    base: seamPt,
    eX: tSeam.clone(),   // вдоль шва
    eY: tCross.clone(),  // в плоскости грани
    eZ: nIn.clone(),     // нормаль внутрь панели
  };
}

/**
 * Базис стыка: tSeam — вдоль шва, tCross — вторая ось в плоскости грани, nIn — внутрь панели.
 */
function _jointFaceBasis(bbox, jointIdx, seamLenMm, panelRoot) {
  void seamLenMm;
  const { min, max } = bbox;
  const mx = (min.x + max.x) / 2;
  const my = (min.y + max.y) / 2;
  const mz = (min.z + max.z) / 2;
  const { faceAxis, faceSign } = _jointFaceInfo(jointIdx, bbox, panelRoot);
  const { seamAx } = _jointFaceSeamAndEdgeAxes(bbox, jointIdx, panelRoot);
  const nIn = new THREE.Vector3();
  nIn[faceAxis] = -faceSign;
  const tSeam = new THREE.Vector3();
  tSeam[seamAx] = 1;
  const tCross = new THREE.Vector3().crossVectors(nIn, tSeam).normalize();
  return { nIn, tSeam, tCross, mx, my, mz, seamAx, faceAxis };
}

/** Направление сверла в осях шаблона (eX,eY,eZ) → мир. */
function _templateDirWorldFromFrame(dirKey, eX, eY, eZ) {
  const arr = _DRILL_DIR_VEC[dirKey] || _DRILL_DIR_VEC['-z'];
  return new THREE.Vector3()
    .addScaledVector(eX, arr[0])
    .addScaledVector(eY, arr[1])
    .addScaledVector(eZ, arr[2])
    .normalize();
}

/** Точка входа сверла на грани панели (мир), t ∈ [0,1] по длине шва */
function _jointWorldEntryForSeam(bbox, jointIdx, seamLenMm, pMm, panelRoot) {
  return _jointSeamPoint(bbox, jointIdx, seamLenMm, pMm, panelRoot);
}

const _jointYAxis = new THREE.Vector3(0, 1, 0);

/**
 * Ось толщины «пласти» в мире: у плоского листа в ортогональном шкафу — это ось
 * минимального габарита world AABB. Жёстко v/h/f → x/y/z нельзя: при повороте
 * детали толщина в мире сидит на другой оси, чем в локали _build_size.
 * Неоднозначный min (куб/шум) — подсказка из spec.orientation.
 */
function _jointThinAxisFromPanel(panelRoot, bbox) {
  if (!bbox) {
    if (panelRoot) {
      const o = normalizeOrientation(panelRoot.config?.spec?.orientation || panelRoot.config?.orientation);
      if (o === 'v') return 'x';
      if (o === 'h') return 'y';
      if (o === 'f') return 'z';
    }
    return 'z';
  }
  const bSize = bbox.getSize(new THREE.Vector3());
  const minDim = Math.min(bSize.x, bSize.y, bSize.z);
  const relTol = 0.12;
  const absTol = Math.max(0.3 / UNITS_MM, minDim * relTol);
  const axMin = bSize.x <= bSize.y && bSize.x <= bSize.z
    ? 'x'
    : bSize.y <= bSize.z
      ? 'y'
      : 'z';
  const dEq = (a) => Math.abs(bSize[a] - minDim) <= absTol;
  const nEq = (dEq('x') ? 1 : 0) + (dEq('y') ? 1 : 0) + (dEq('z') ? 1 : 0);
  if (nEq === 1) {
    if (dEq('x')) return 'x';
    if (dEq('y')) return 'y';
    return 'z';
  }
  if (panelRoot) {
    const o = normalizeOrientation(panelRoot.config?.spec?.orientation || panelRoot.config?.orientation);
    if (o === 'v') return 'x';
    if (o === 'h') return 'y';
    if (o === 'f') return 'z';
  }
  return axMin;
}

function _panelOrientation(panelRoot) {
  return normalizeOrientation(panelRoot?.config?.spec?.orientation || panelRoot?.config?.orientation);
}

function _faceTypeByAxisForPanel(panelRoot, axis) {
  const thin = thinAxisForOrientation(_panelOrientation(panelRoot));
  return axis === thin ? 'plast' : 'torets';
}

function _panelThinAxisWorld(panelRoot) {
  const own = panelRoot?.userData?.own_object;
  if (!own) return null;
  const thin = thinAxisForOrientation(_panelOrientation(panelRoot));
  const v = new THREE.Vector3(
    thin === 'x' ? 1 : 0,
    thin === 'y' ? 1 : 0,
    thin === 'z' ? 1 : 0
  );
  own.updateWorldMatrix(true, true);
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  own.matrixWorld.decompose(p, q, s);
  v.applyQuaternion(q);
  if (v.lengthSq() < 1e-20) return null;
  return v.normalize();
}

function _faceTypeByNormalForPanel(panelRoot, nWorld) {
  if (!panelRoot || !nWorld || nWorld.lengthSq() < 1e-20) return 'torets';
  const tW = _panelThinAxisWorld(panelRoot);
  if (!tW) return 'torets';
  const n = nWorld.clone().normalize();
  // Нормаль почти параллельна тонкой оси => пласть, иначе торец.
  return Math.abs(n.dot(tW)) >= 0.78 ? 'plast' : 'torets';
}

function _dominantAxis(v) {
  if (!v) return null;
  const a = v.clone();
  if (a.lengthSq() < 1e-20) return null;
  a.normalize();
  const ax = Math.abs(a.x);
  const ay = Math.abs(a.y);
  const az = Math.abs(a.z);
  if (ax >= ay && ax >= az) return 'x';
  if (ay >= az) return 'y';
  return 'z';
}

/** Нормаль стыка: от текущей панели к соседней. */
/**
 * Orientation-aware joint face mapping.
 * Returns { faceAxis: 'x'|'y'|'z', faceSign: 1|-1 }.
 * Avoids placing торец joints on the thin (пласть) axis.
 * panelRoot: тонкая ось из orientation (v/h/f), иначе эвристика min(bbox).
 */
function _jointFaceInfo(jointIdx, bbox, panelRoot) {
  void bbox;
  void panelRoot;
  const j = Number(jointIdx);
  if (j === 0) return { faceAxis: 'y', faceSign: 1 };   // top
  if (j === 1) return { faceAxis: 'y', faceSign: -1 };  // bottom
  if (j === 2) return { faceAxis: 'x', faceSign: -1 };  // left
  return { faceAxis: 'x', faceSign: 1 };                // right
}

/**
 * На плоскости торцевой грани стыка: шов — вдоль более длинной стороны, edge — короткой.
 * Работает для любой ориентации; конкретная грань определяется _jointFaceInfo → getJointSeamOutwardAndFaceWorld.
 */
function _jointFaceSeamAndEdgeAxes(bbox, jointIdx, panelRoot) {
  const bSize = bbox.getSize(new THREE.Vector3());
  const { faceAxis } = _jointFaceInfo(jointIdx, bbox, panelRoot);
  const perps = ['x', 'y', 'z'].filter((a) => a !== faceAxis);
  const a = perps[0];
  const b = perps[1];
  const seamAx = bSize[a] >= bSize[b] ? a : b;
  const edgeAx = seamAx === a ? b : a;
  return { seamAx, edgeAx, faceAxis };
}

function _jointOutwardNormal(jointIdx, bbox, panelRoot) {
  void panelRoot;
  const { faceAxis, faceSign } = _jointFaceInfo(jointIdx, bbox, panelRoot);
  const n = new THREE.Vector3();
  n[faceAxis] = faceSign;
  return n;
}

/**
 * Угол панели у пивота (коды −1/1 по осям геометрии core, как evaluatePivot в ClodisBuilder) в мире.
 */
function _cldPanelPivotWorld(panelRoot) {
  if (!panelRoot || typeof panelRoot.traverse !== 'function') return null;
  let codes = null;
  let core = null;
  panelRoot.traverse((ch) => {
    if (ch.userData && ch.userData.__cldPivotCodes && !codes) {
      codes = { ...ch.userData.__cldPivotCodes };
    }
    if (ch.isMesh && typeof ch.name === 'string' && ch.name.endsWith('_core') && !core) core = ch;
  });
  if (!core || !core.geometry) return null;
  if (!codes) codes = { x: -1, y: -1, z: -1 };
  core.updateWorldMatrix(true);
  const p = core.geometry.parameters || {};
  const w = p.width ?? 0;
  const h = p.height ?? 0;
  const d = p.depth ?? 0;
  const lx = codes.x === 1 ? w / 2 : codes.x === -1 ? -w / 2 : 0;
  const ly = codes.y === 1 ? h / 2 : codes.y === -1 ? -h / 2 : 0;
  const lz = codes.z === 1 ? d / 2 : codes.z === -1 ? -d / 2 : 0;
  const v = new THREE.Vector3(lx, ly, lz);
  v.add(core.position);
  v.applyMatrix4(core.matrixWorld);
  return v;
}

/** Какой конец отрезка шва на оси seamAx ближе к пивоту (true → координата 0 шва = bbox.min[seamAx]). */
function _jointSeamPivotAtMin(bbox, seamAx, pivotWorld) {
  if (!pivotWorld) return true;
  const pv = pivotWorld[seamAx];
  const distMin = Math.abs(pv - bbox.min[seamAx]);
  const distMax = Math.abs(pv - bbox.max[seamAx]);
  return distMin <= distMax;
}

/**
 * Ключ размера из шаблона детали (size.x/y/z в конструкторе) → ось мира вдоль линии шва.
 * Должен совпадать с _jointSeamSizeKey в admin-new-bundle.js для v/h/f.
 */
function _templateSeamKeyToWorldAxis(orientation, seamSizeKey) {
  const sk = String(seamSizeKey || '').toLowerCase();
  const o = String(orientation || 'h').toLowerCase();
  if (!['x', 'y', 'z'].includes(sk)) return null;
  if (o === 'v') {
    if (sk === 'y') return 'y';
    if (sk === 'z') return 'z';
    return null;
  }
  if (o === 'h') {
    if (sk === 'x') return 'x';
    if (sk === 'z') return 'z';
    return null;
  }
  if (o === 'f') {
    if (sk === 'x') return 'x';
    if (sk === 'y') return 'y';
    return null;
  }
  return null;
}

/** Ось шва в мире: по seamSizeKey из админки, иначе эвристика «длинная сторона грани». */
function _jointWorldSeamAxisFromTemplate(panelRoot, jointIdx, bbox, seamSizeKey) {
  const orient = String(
    panelRoot?.config?.spec?.orientation || panelRoot?.config?.orientation || 'h'
  ).toLowerCase();
  const wAx = _templateSeamKeyToWorldAxis(orient, seamSizeKey);
  const { faceAxis } = _jointFaceInfo(jointIdx, bbox, panelRoot);
  if (wAx && wAx !== faceAxis) {
    const perps = ['x', 'y', 'z'].filter((a) => a !== faceAxis);
    if (perps.includes(wAx)) return wAx;
  }
  return _jointFaceSeamAndEdgeAxes(bbox, jointIdx, panelRoot).seamAx;
}

const _JOINT_SEAM_FALLBACK_KEY = ['x', 'x', 'y', 'y'];
function _jointSeamSizeKeyFromOrientation(jointIdx, orientation) {
  const o = String(orientation || '').toLowerCase();
  const j = Number(jointIdx);
  const tb = j === 0 || j === 1;
  const lr = j === 2 || j === 3;
  if (o === 'v') {
    if (tb) return 'z';
    if (lr) return 'y';
  } else if (o === 'h') {
    if (tb) return 'x';
    if (lr) return 'z';
  } else if (o === 'f') {
    if (tb) return 'x';
    if (lr) return 'y';
  }
  return _JOINT_SEAM_FALLBACK_KEY[j] || 'x';
}

/**
 * Координата вдоль seamAx (мир): pMm — мм от пивота вдоль шва.
 * Долю t = pMm / seamLenMm считаем по длине стыка из схемы; смещение в мире — t * (seamLenMm мм), не t * габарит bbox
 * (иначе шаги между крепежами не совпадают с таблицей/админкой). Зажимаем в пределы ребра на мешу.
 */
function _jointSeamCoordOnAxis(bbox, seamAx, seamLenMm, pMm, panelRoot) {
  const { min, max } = bbox;
  const s = bbox.getSize(new THREE.Vector3());
  const spanM = s[seamAx];
  const seamLenGeomMm = spanM * UNITS_MM;
  const seamRefMm = Number(seamLenMm) > 0 ? Number(seamLenMm) : seamLenGeomMm;
  const t = seamRefMm > 0.001 ? Math.max(0, Math.min(1, pMm / seamRefMm)) : 0;
  const spanAlongSeamM = seamRefMm / UNITS_MM;
  const pivotW = panelRoot ? _cldPanelPivotWorld(panelRoot) : null;
  const pivotAtMin = _jointSeamPivotAtMin(bbox, seamAx, pivotW);
  const lo = min[seamAx];
  const hi = max[seamAx];
  const deltaM = t * spanAlongSeamM;
  let raw = pivotAtMin ? lo + deltaM : hi - deltaM;
  if (raw < lo) raw = lo;
  if (raw > hi) raw = hi;
  return raw;
}

/** Точка на стыковой грани (по шву, pMm от пивота / от края контакта). */
function _jointSeamPoint(bbox, jointIdx, seamLenMm, pMm, panelRoot, seamSizeKey, contact = null) {
  void bbox;
  void seamSizeKey;
  const pt = panelRoot
    ? jointSeamWorldPoint(panelRoot, jointIdx, seamLenMm, pMm, UNITS_MM, contact)
    : null;
  if (pt) return pt;
  const { min, max } = bbox;
  const { faceAxis, faceSign } = _jointFaceInfo(jointIdx, bbox, panelRoot);
  const seamAx = _jointWorldSeamAxisFromTemplate(panelRoot, jointIdx, bbox, seamSizeKey);
  const perps = ['x', 'y', 'z'].filter((a) => a !== faceAxis);
  const edgeAx = perps.find((a) => a !== seamAx) || perps[0];
  const fallback = new THREE.Vector3();
  fallback[faceAxis] = faceSign > 0 ? max[faceAxis] : min[faceAxis];
  fallback[edgeAx] = (min[edgeAx] + max[edgeAx]) / 2;
  fallback[seamAx] = _jointSeamCoordOnAxis(bbox, seamAx, seamLenMm, pMm, panelRoot);
  return fallback;
}

/** Толщина соседней панели: обход rootGroup, ищем ближайшую стенку вдоль нормали стыка. */
function _findNeighborThicknessMm(bbox, jointIdx, panelRoot) {
  const c = detectJointContactV2(panelRoot, jointIdx, rootGroup, { mmPerWorldUnit: UNITS_MM });
  if (c && c.active && Number.isFinite(c.neighborThickMm) && c.neighborThickMm > 0) {
    return c.neighborThickMm;
  }
  return _jointPanelThicknessMm(panelRoot, bbox);
}

function _jointContactFrame(panelRoot, bbox, jointIdx) {
  const jFrame = getJointStripeFrameWorld(panelRoot, jointIdx);
  const frB = jFrame ? _jointStripeOrthoBasis(jFrame) : null;
  const base = _jointFaceInfo(jointIdx, bbox, panelRoot);
  const seam = _jointFaceSeamAndEdgeAxes(bbox, jointIdx, panelRoot);
  const faceCoord = base.faceSign > 0 ? bbox.max[base.faceAxis] : bbox.min[base.faceAxis];
  if (!jFrame || !frB) {
    return {
      hasFrame: false,
      nPlane: null,
      sDir: null,
      eDir: null,
      faceAxis: base.faceAxis,
      faceSign: base.faceSign,
      seamAx: seam.seamAx,
      edgeAx: seam.edgeAx,
      faceCoord,
    };
  }
  const nPlane = jFrame.outwardWorld.clone().normalize();
  const sDir = frB.s.clone().normalize();
  const eDir = frB.e.clone().normalize();
  return {
    hasFrame: true,
    nPlane,
    sDir,
    eDir,
    faceAxis: base.faceAxis,
    faceSign: base.faceSign,
    seamAx: seam.seamAx,
    edgeAx: seam.edgeAx,
    faceCoord,
  };
}

function _measureJointCandidate(panelRoot, bbox, jointIdx, neighborPanel, neighborBBox, tol) {
  const cSelf = bbox.getCenter(new THREE.Vector3());
  const cf = _jointContactFrame(panelRoot, bbox, jointIdx);
  const m = measureJointNeighborPair(bbox, neighborBBox, {
    hasFrame: cf.hasFrame,
    nPlane: cf.nPlane,
    sDir: cf.sDir,
    eDir: cf.eDir,
    cSelf,
    faceAxis: cf.faceAxis,
    faceSign: cf.faceSign,
    seamAx: cf.seamAx,
    edgeAx: cf.edgeAx,
    faceCoord: cf.faceCoord,
    tol,
  });
  return { m, cf };
}

function _resolveBestJointContact(panelRoot, bbox, jointIdx) {
  void bbox;
  return detectJointContactV2(panelRoot, jointIdx, rootGroup, { mmPerWorldUnit: UNITS_MM });
}

/**
 * Сосед для стыка jointIdx — один resolve в joint-engine-v2:
 * торец jointIdx ИЛИ пласть←торец, пятно которого в сторону этого торца.
 */
function _findNeighborPanelRootForJoint(panelRoot, bbox, jointIdx) {
  void bbox;
  return findNeighborForJointV2(panelRoot, jointIdx, rootGroup, { mmPerWorldUnit: UNITS_MM });
}

/** Полоса на торце jointIdx только если контакт торец↔пласть на этом торце. */
function _hasActiveToretsContact(panelRoot, jointIdx) {
  const c = detectJointContactV2(panelRoot, jointIdx, rootGroup, { mmPerWorldUnit: UNITS_MM });
  return !!(
    c &&
    c.active &&
    c.neighborPanel &&
    isToretsPlastPairV2(c.pair) &&
    Number(c.seamOverlapMm) >= JOINT_CONTACT_OVERLAP_MIN_MM
  );
}

function _intervalOverlapMid(a, b) {
  const lo = Math.max(a[0], b[0]);
  const hi = Math.min(a[1], b[1]);
  if (hi <= lo) return null;
  return { lo, hi, len: hi - lo, mid: (lo + hi) * 0.5 };
}

/**
 * Reverse lookup (как в Базис-Мебельщик):
 * для каждой пласти активной панели ищем перпендикулярные панели,
 * чей торец лежит в той же плоскости и пересекается по 2D-AABB.
 *
 * Семантика: пласть = грань вдоль тонкой оси панели (2 штуки на панель).
 * Торец соседа = ближняя грань соседа вдоль той же оси, что и нормаль пласти.
 * Стык = совпадение этих двух плоскостей с малым допуском + перекрытие 2D AABB.
 */
function _renderReverseContactsOnPlasts(group, activePanel, activeBBox) {
  void activeBBox;
  if (!group || !activePanel) return;
  const patches = detectReverseContactsOnPlastsV2(activePanel, rootGroup, { mmPerWorldUnit: UNITS_MM });
  if (typeof window !== 'undefined' && window.__CLD_DEBUG_JOINT_AXES === true) {
    const pName = activePanel.name || activePanel.userData?.own_object?.name || '?';
    console.log(`[JOINT-REVERSE] active="${pName}" found ${patches.length} contact patch(es)`);
  }
  for (const p of patches) {
    const offset = 0.08;
    const t = 0.003;
    const c = new THREE.Vector3()
      .addScaledVector(p.tangent1, p.midOnT1)
      .addScaledVector(p.tangent2, p.midOnT2)
      .addScaledVector(p.plastNormal, p.plastFaceCoord + offset);
    const m4 = new THREE.Matrix4();
    m4.makeBasis(p.tangent1, p.tangent2, p.plastNormal);
    const geom = new THREE.BoxGeometry(p.sizeT1, p.sizeT2, t);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.78,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.setRotationFromMatrix(m4);
    mesh.position.copy(c);
    mesh.renderOrder = 12;
    group.add(mesh);

    // Дополнительно: подсветить ТОРЕЦ соседа, который упирается в нашу пласть.
    // Bazis-стиль: пара видна с обеих сторон (на нашей пласти и на торце соседа).
    const neighbor = p.neighborPanel;
    const neighborBBox = neighbor ? _jointPanelBBox(neighbor) : null;
    if (neighbor && neighborBBox) {
      // У соседа находим jointIdx (0..3), чей torets смотрит в нашу пласть.
      let bestJ = -1;
      let bestDot = -1;
      const wantOutward = p.plastNormal.clone().negate(); // от соседа к нам
      for (let nj = 0; nj < 4; nj++) {
        const fr = getJointStripeFrameWorld(neighbor, nj);
        if (!fr) continue;
        const d = fr.outwardWorld.clone().normalize().dot(wantOutward);
        if (d > bestDot) {
          bestDot = d;
          bestJ = nj;
        }
      }
      if (bestJ >= 0 && bestDot > 0.7) {
        _addJointTorcFrameStripes(group, neighborBBox, bestJ, 0xc084fc, 0.85, {
          bazisActive: true,
          panelRoot: neighbor,
        });
      }
    }
  }
}

function _jointContactDebugInfo(panelRoot, bbox, jointIdx, neighborPanel) {
  void bbox;
  const c = detectJointContactV2(panelRoot, jointIdx, rootGroup, { mmPerWorldUnit: UNITS_MM });
  if (!c || !c.neighborPanel) return null;
  if (neighborPanel && neighborPanel !== c.neighborPanel) return null;
  const axis = _dominantAxis(c.hostOutwardWorld) || 'x';
  return {
    myType: c.hostFaceType,
    neighborType: c.neighborFaceType,
    axis,
    distMm: c.gapMm,
    seamMm: c.seamOverlapMm,
    edgeMm: c.edgeOverlapMm,
    active: c.active,
  };
}

function _addJointContactDiagnosticLabel(group, panelRoot, bbox, jointIdx, neighborPanel, colorHex = '#22d3ee') {
  const info = neighborPanel ? _jointContactDebugInfo(panelRoot, bbox, jointIdx, neighborPanel) : null;
  const c = _jointFaceCenterWorld(bbox, jointIdx, panelRoot).clone();
  const n = _jointOutwardNormal(jointIdx, bbox, panelRoot).normalize();
  c.addScaledVector(n, 0.08);
  const el = document.createElement('div');
  el.style.font = '11px/1.2 monospace';
  el.style.padding = '3px 6px';
  el.style.borderRadius = '4px';
  el.style.border = `1px solid ${colorHex}`;
  el.style.background = 'rgba(15,23,42,0.78)';
  el.style.color = '#e2e8f0';
  el.style.pointerEvents = 'none';
  if (!info) {
    const myType = panelFaceType(_panelOrientation(panelRoot), jointIdx);
    el.textContent = `j${jointIdx}: ${myType}->none`;
  } else {
    el.textContent = `j${jointIdx}: ${info.myType}->${info.neighborType} ax:${info.axis} gap:${info.distMm.toFixed(1)} ov:${info.seamMm.toFixed(1)}/${info.edgeMm.toFixed(1)}mm`;
  }
  const lbl = new CSS2DObject(el);
  lbl.position.copy(c);
  lbl.userData.cannotSelect = true;
  group.add(lbl);
}

/** Локальный BBox геометрии узла (без учета детей-аксессуаров). */
function _jointPanelLocalBox(panelNode) {
  const own = panelNode?.userData?.own_object;
  if (!own) return new THREE.Box3(new THREE.Vector3(-8,-1000,-300), new THREE.Vector3(8,1000,300));
  if (panelNode.userData._cldLocalBox) return panelNode.userData._cldLocalBox;

  const box = new THREE.Box3();
  let any = false;
  own.traverse(ch => {
    if (ch.isMesh && ch.geometry && !ch.userData.isAccessory && !ch.userData.isSectionVolume) {
      if (!ch.geometry.boundingBox) ch.geometry.computeBoundingBox();
      const lb = ch.geometry.boundingBox.clone().applyMatrix4(ch.matrix);
      if (!any) { box.copy(lb); any = true; }
      else box.union(lb);
    }
  });
  if (!any) {
    const s = panelNode.calculated?.size || new THREE.Vector3(16, 2000, 600);
    box.set(new THREE.Vector3(-s.x/2,-s.y/2,-s.z/2), new THREE.Vector3(s.x/2,s.y/2,s.z/2));
  }
  panelNode.userData._cldLocalBox = box;
  return box;
}

function _jointPanelThicknessMm(panelRoot, bbox) {
  const fromBBox = (() => {
    if (!bbox) return 16;
    const s = bbox.getSize(new THREE.Vector3());
    return Math.min(s.x, s.y, s.z) * UNITS_MM;
  })();

  const cSize = panelRoot?.calculated?.size;
  const calcDims = [
    Number(cSize?.x),
    Number(cSize?.y),
    Number(cSize?.z),
  ].filter((v) => Number.isFinite(v) && v > 0);
  const fromCalculated = calcDims.length ? Math.min(...calcDims) : NaN;

  const varsWt =
    Number(panelRoot?.calculated?.c_object?.vars?._wt) ||
    Number(rootGroup?.userData?.vars?._wt) ||
    NaN;

  // Референсно у корпуса толщина берется из vars/materials (обычно 16),
  // world-bbox на наклонных деталях может завышать "толщину".
  if (Number.isFinite(varsWt) && varsWt > 0) return varsWt;
  if (Number.isFinite(fromCalculated) && fromCalculated > 0) return fromCalculated;
  return fromBBox;
}

/**
 * Локальная ось длины цилиндра hole_cylinder после геометрических transform в CabinetHoleNode._build_spec
 * (совпадает с направлением сверления в локале меша до matrixWorld).
 */
function _jointHoleGeomLocalBoreAxis(resolvedDir) {
  const d = String(resolvedDir || '-z').toLowerCase();
  switch (d) {
    case 'x': return new THREE.Vector3(1, 0, 0);
    case '-x': return new THREE.Vector3(-1, 0, 0);
    case 'y': return new THREE.Vector3(0, 1, 0);
    case '-y': return new THREE.Vector3(0, -1, 0);
    case 'z': return new THREE.Vector3(0, 0, 1);
    case '-z':
    default: return new THREE.Vector3(0, 0, -1);
  }
}

/**
 * Направление сверления в мире для стыка — как в js/export/bazis-cfrn-export.js buildJointFittingLeaves:
 * пласть (x < толщина) → +outward в соседа; торец → −outward в эту панель.
 */
function _jointDrillDirWorldCfrn(isFaceHole, outwardNormal) {
  const o = outwardNormal.clone().normalize();
  return isFaceHole ? o : o.clone().multiplyScalar(-1);
}

/**
 * Угловые координаты 0…parent_size (оси панели X,Y,Z) → поля config.pos отверстия (как в CabinetHole._build_pos).
 * Для dir x/-x: pos.x → ось панели Z, pos.y → Y, pos.z → X; для y/-y: pos.x→X, pos.y→Z, pos.z→Y; для z — совпадает с осями.
 * Важно: для отрицательных направлений (-x, -y, -z) референс считает pos.z от max-грани, поэтому вычитаем размер.
 */
function _jointPanelCornerMmToHolePosMm(ax, ay, az, dir, sizeMm) {
  const sx = Number(sizeMm?.x) || 0;
  const sy = Number(sizeMm?.y) || 0;
  const sz = Number(sizeMm?.z) || 0;

  switch (dir) {
    case 'x':
      return { x: az, y: ay, z: ax };
    case '-x':
      return { x: az, y: ay, z: ax - sx };
    case 'y':
      return { x: ax, y: az, z: ay };
    case '-y':
      return { x: ax, y: az, z: ay - sy };
    case 'z':
      return { x: ax, y: ay, z: az };
    case '-z':
    default:
      return { x: ax, y: ay, z: az - sz };
  }
}

/**
 * ЕДИНЫЙ ДВИЖОК СТЫКОВЫХ ОТВЕРСТИЙ (1:1 с логикой шаблонов).
 * Строит базис стыка (Frame) и переводит x,y,z и dirKey шаблона в мировые координаты.
 */
function _getJointTemplatePlacements(
  panelRoot,
  bbox,
  jointIdx,
  seamLenMm,
  pMm,
  template,
  outwardOverride = null,
  options = {}
) {
  const outward = (outwardOverride && outwardOverride.lengthSq() > 0)
    ? outwardOverride.clone().normalize()
    : _jointOutwardNormal(jointIdx, bbox, panelRoot);
  const nIn = outward.clone().multiplyScalar(-1).normalize();
  const tSeamFallback = _jointFaceBasis(bbox, jointIdx, seamLenMm, panelRoot).tSeam;
  const tSeamWorld = (options.tSeamWorld && options.tSeamWorld.lengthSq() > 0)
    ? options.tSeamWorld.clone().normalize()
    : tSeamFallback;
  const holeList = template.holes || [];
  const panelThickMm = _jointPanelThicknessMm(panelRoot, bbox);
  const neighborPanel = options.neighborPanel || null;
  const neighborBBox = options.neighborBBox || null;
  const neighborThickMm = neighborPanel ? _jointPanelThicknessMm(neighborPanel, neighborBBox) : 16;
  const hostFaceType = options.hostFaceType || null;
  const neighborFaceType = options.neighborFaceType || null;
  const setupType = Number(template.setupType ?? template.setup_type ?? 3);
  let targetThickMm =
    hostFaceType === 'torets' && neighborFaceType === 'plast'
      ? neighborThickMm
      : panelThickMm;
  let classificationThickMm = targetThickMm;
  if (setupType === 3 && neighborPanel) {
    const fe = identifySetup3FaceEdgePanels(panelRoot, neighborPanel, hostFaceType, neighborFaceType);
    if (fe?.facePanel) {
      classificationThickMm = _jointPanelThicknessMm(
        fe.facePanel,
        fe.facePanel === panelRoot ? bbox : neighborBBox,
      );
      targetThickMm = classificationThickMm;
    }
  }
  return getJointTemplatePlacementsUnified({
    seamWorld: _jointSeamPoint(
      bbox,
      jointIdx,
      seamLenMm,
      pMm,
      panelRoot,
      options.seamSizeKey,
      options.contact || null,
    ),
    outward,
    nInWorld: nIn,
    tSeamWorld,
    jointIdx,
    setupType,
    holes: holeList,
    panelThickMm,
    targetThickMm: Number(options.targetThickMm) > 0 ? Number(options.targetThickMm) : targetThickMm,
    classificationThickMm: Number(options.classificationThickMm) > 0 ? Number(options.classificationThickMm) : classificationThickMm,
    mmPerWorldUnit: UNITS_MM,
    hostPanel: panelRoot,
    neighborPanel,
    hostBBox: bbox,
    neighborBBox,
    seamPosMm: Number(pMm) || 0,
    seamLenMm: Number(seamLenMm) || 0,
    hostFaceType,
    neighborFaceType,
    seamSizeKey: String(options.seamSizeKey || 'z'),
    facing: String(options.facing || 'inside').toLowerCase() === 'outside' ? 'outside' : 'inside',
    templateFlipDeg: Number(options.templateFlipDeg) || 0,
    contact: options.contact || null,
  });
}

/**
 * Единый узел крепежа на стыке: на вход схема+шаблон, на выход готовые размещения отверстий.
 * Важно: формат выхода стабильный для превью/экспорта (worldEntry, worldDir, targetPanel, boreLenMm).
 */
function _resolveJointFittingNodePlacements(
  panelRoot,
  bbox,
  neighborPanel,
  neighborBBox,
  jointIdx,
  seamLenMm,
  pMm,
  tplInfo,
  outward,
  tSeamWorld,
  seamSizeKey,
  contactFaceTypes = null,
  contact = null,
) {
  const panelThickMm = _jointPanelThicknessMm(panelRoot, bbox);
  const neighborThickMm = neighborPanel ? _jointPanelThicknessMm(neighborPanel, neighborBBox) : 16;
  const hostFaceType = contactFaceTypes?.hostFaceType
    || _faceTypeByAxisForPanel(panelRoot, _jointFaceInfo(jointIdx, bbox, panelRoot).faceAxis);
  const neighborFaceType = contactFaceTypes?.neighborFaceType
    || (neighborPanel
      ? _faceTypeByAxisForPanel(neighborPanel, _jointFaceInfo(jointIdx, bbox, panelRoot).faceAxis)
      : 'torets');
  const setupType = Number(tplInfo?.setupType ?? tplInfo?.setup_type ?? 3);
  let targetThickMm =
    hostFaceType === 'torets' && neighborFaceType === 'plast'
      ? neighborThickMm
      : panelThickMm;
  let classificationThickMm = targetThickMm;
  const setup3FaceEdge = (setupType === 3 && neighborPanel)
    ? identifySetup3FaceEdgePanels(panelRoot, neighborPanel, hostFaceType, neighborFaceType)
    : null;
  if (setup3FaceEdge?.facePanel) {
    classificationThickMm = _jointPanelThicknessMm(
      setup3FaceEdge.facePanel,
      setup3FaceEdge.facePanel === panelRoot ? bbox : neighborBBox,
    );
    targetThickMm = classificationThickMm;
  }
  const raw = _getJointTemplatePlacements(
    panelRoot,
    bbox,
    jointIdx,
    seamLenMm,
    pMm,
    tplInfo,
    outward,
    {
      targetThickMm,
      classificationThickMm,
      tSeamWorld,
      seamSizeKey: String(seamSizeKey || '').trim() || undefined,
      neighborPanel,
      neighborBBox,
      hostFaceType,
      neighborFaceType,
      facing: contactFaceTypes?.facing || 'inside',
      contact,
    }
  );
  const merged = resolveJointFittingRolesUnified({
    rawPlacements: raw,
    outward,
    panelThickMm,
    neighborThickMm,
    classificationThickMm,
    templateName: tplInfo?.templateName,
    schemeName: tplInfo?.schemeName,
    mmPerWorldUnit: UNITS_MM,
    setupType,
    hostPanel: panelRoot,
    neighborPanel,
    hostBBox: bbox,
    neighborBBox,
    hostFaceType,
    neighborFaceType,
  });
  return merged.map((p) => {
    const targetPanel = resolveJointHoleTargetPanel({
      setupType,
      isFace: p.isFace,
      hostPanel: panelRoot,
      neighborPanel,
      roles: p.setup3Roles,
      faceEdge: p.setup3FaceEdge || setup3FaceEdge,
      holeHostPanel: p?.hole?.hostPanel ?? p?.hole?.host_panel,
      mountSide: p?.hole?.mountSide ?? p?.hole?.mount_side,
    });
    const targetIsHost = targetPanel === panelRoot;
    return {
      ...p,
      targetPanel,
      targetBBox: targetIsHost ? bbox : (neighborBBox || bbox),
    };
  });
}

/**
 * @deprecated Виртуальный сосед рисовал крепёж «в пустоту». Базис: стык только при двух панелях.
 * Оставлено на случай отладки; превью/комната больше не вызывают.
 */
function _makeSoloPreviewNeighbor(panelRoot, bbox, jointIdx, outward, neighborThickMm = 16) {
  const frame = panelRoot ? getJointStripeFrameWorld(panelRoot, jointIdx) : null;
  const basis = frame ? _jointStripeOrthoBasis(frame) : null;
  if (!frame || !basis) return null;
  const thickW = Math.max((Number(neighborThickMm) || 16) / UNITS_MM, 0.001);
  const seamL = Math.max(Number(frame.seamLenWorld) || 0, bbox ? (() => {
    const s = bbox.getSize(new THREE.Vector3());
    return Math.max(s.x, s.y, s.z) * 0.5;
  })() : 0.1, 0.05);
  const edgeL = Math.max(Number(frame.edgeLenWorld) || 0, 0.05);
  const o = (outward && outward.lengthSq() > 0)
    ? outward.clone().normalize()
    : basis.o.clone();
  const center = frame.faceCenterWorld.clone().addScaledVector(o, thickW * 0.5);
  const corners = [];
  for (const ds of [-1, 1]) {
    for (const de of [-1, 1]) {
      for (const dt of [-1, 1]) {
        corners.push(
          center.clone()
            .addScaledVector(basis.s, ds * seamL * 0.5)
            .addScaledVector(basis.e, de * edgeL * 0.5)
            .addScaledVector(o, dt * thickW * 0.5),
        );
      }
    }
  }
  const neighborBBox = new THREE.Box3().setFromPoints(corners);
  const hostOrient = _panelOrientation(panelRoot);
  const nbOrient = (hostOrient === 'h' || hostOrient === 'f') ? 'v' : 'h';
  const neighborPanel = new THREE.Group();
  neighborPanel.name = '__solo_joint_neighbor';
  neighborPanel.config = { orientation: nbOrient, name: '__solo_joint_neighbor' };
  neighborPanel.userData = { orientation: nbOrient, __soloJointNeighbor: true };
  return { neighborPanel, neighborBBox, neighborThickMm: Number(neighborThickMm) || 16 };
}

/** Стыковое превью: ИСПОЛЬЗУЕТ ЕДИНЫЙ ДВИЖОК. */
function _shouldShowJointTemplateOriginMarker(tplInfo) {
  // По умолчанию скрыто — как в PlanPlace (видны отверстия/фурнитура, не оси шаблона).
  // Включить: window.__CLD_DEBUG_JOINT_ORIGIN = true
  return typeof window !== 'undefined' && window.__CLD_DEBUG_JOINT_ORIGIN === true;
}

/**
 * Уже стоит 3D-фурнитура по этой записи jointSchemes —
 * яркие cyan/violet цилиндры превью не рисуем (видна модель своим цветом).
 */
function _panelHasInstalledJointHardware(panelRoot, schemeEntry) {
  if (!panelRoot || !schemeEntry) return false;
  const cid = schemeEntry.contactId != null ? String(schemeEntry.contactId) : '';
  const jIdx = Number(schemeEntry.jointIdx);
  const schemeId = Number(schemeEntry.schemeId) || 0;
  let found = false;
  const matchCfg = (cfg) => {
    if (!cfg?.fromJointScheme) return false;
    if (cid && cfg.contactId != null) return String(cfg.contactId) === cid;
    if (!Number.isFinite(jIdx) || cfg.jointIdx == null) return false;
    if (Number(cfg.jointIdx) !== jIdx) return false;
    if (schemeId > 0 && Number(cfg.schemeId) > 0 && Number(cfg.schemeId) !== schemeId) return false;
    return true;
  };
  _walkCabinetChildNodes(panelRoot, (node) => {
    if (found || !node || node === panelRoot) return;
    if (matchCfg(node.config) || matchCfg(node.userData?.params)) found = true;
  });
  // Подстраховка: furniture мог ещё не попасть в cabinet_child_nodes после rebuild.
  if (!found && typeof panelRoot.traverse === 'function') {
    panelRoot.traverse((o) => {
      if (found || !o || o === panelRoot) return;
      if (matchCfg(o.config) || matchCfg(o.userData?.params)) found = true;
    });
  }
  return found;
}

/** Маркер (0,0,0) шаблона на стыке: сфера + оси eX/eY/eZ как в превью присадки админки. */
function _addJointTemplateOriginMarker(group, setup3Frame, jointIdx, pMm) {
  if (!group || !setup3Frame?.O) return;
  const O = setup3Frame.O;
  const axisLen = 55 / UNITS_MM;
  const r = 4 / UNITS_MM;

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(r, 14, 12),
    new THREE.MeshBasicMaterial({
      color: 0xff6600,
      depthTest: false,
      depthWrite: false,
    }),
  );
  sphere.position.copy(O);
  sphere.renderOrder = 22;
  sphere.name = `joint_preview_origin_j${jointIdx}_p${pMm}`;
  sphere.userData.isAccessory = true;
  sphere.userData.jointPreviewOrigin = true;
  sphere.userData.cannotSelect = true;
  group.add(sphere);

  const axes = [
    [setup3Frame.eX, 0xe74c3c, 'eX'],
    [setup3Frame.eY, 0x27ae60, 'eY'],
    [setup3Frame.eZ, 0x3498db, 'eZ'],
  ];
  for (const [axis, color, label] of axes) {
    if (!axis || axis.lengthSq() < 1e-18) continue;
    const dir = axis.clone().normalize();
    const headL = axisLen * 0.2;
    const headW = axisLen * 0.12;
    const arrow = new THREE.ArrowHelper(dir, O, axisLen, color, headL, headW);
    arrow.name = `joint_preview_origin_axis_${label}_j${jointIdx}_p${pMm}`;
    arrow.userData.jointPreviewOrigin = true;
    arrow.userData.cannotSelect = true;
    arrow.renderOrder = 21;
    group.add(arrow);
  }
}

function _jointIdxSafeForStripe(jIdx, contact = null) {
  const hj = Number(contact?.hostJointIdx);
  if (Number.isFinite(hj) && hj >= 0 && hj <= 3) return hj;
  const j = Number(jIdx);
  if (Number.isFinite(j) && j >= 0 && j <= 3) return j;
  return 0;
}

/**
 * Контакт для схемы: сначала по contactId/соседу из detectToretsAgainstPlast,
 * иначе legacy resolveJointContactForIdx (jointIdx 0..3),
 * иначе zip synthetic jointIdx ↔ контакты (старые JSON без contactId).
 */
function _resolveContactForJointSchemeEntry(panelRoot, schemeEntry) {
  if (!panelRoot || !schemeEntry) return null;
  const contacts = detectToretsAgainstPlast(panelRoot, rootGroup, { mmPerWorldUnit: UNITS_MM });
  const cid = schemeEntry.contactId != null ? String(schemeEntry.contactId) : '';
  if (cid) {
    const hit = contacts.find((c) => String(c.id) === cid);
    if (hit) return { ...hit, active: true, viaPlast: hit.hostFaceType === 'plast' };
  }
  const nb = String(schemeEntry.neighborName || '').trim();
  const cond = String(schemeEntry.conditionKey || '').trim();
  if (nb || cond) {
    const hit = contacts.find((c) => {
      if (nb && String(c.neighborName || '') !== nb) return false;
      if (cond && contactConditionKey(c) !== cond) return false;
      return true;
    });
    if (hit) return { ...hit, active: true, viaPlast: hit.hostFaceType === 'plast' };
  }
  const jIdx = Number(schemeEntry.jointIdx);
  if (Number.isFinite(jIdx) && jIdx >= 0 && jIdx <= 3) {
    return resolveJointContactForIdxV2(panelRoot, jIdx, rootGroup, { mmPerWorldUnit: UNITS_MM });
  }
  // Старые сохранения: только synthetic jointIdx + schemeId, без contactId.
  // Сопоставляем записи одной схемы с контактами по сортировке имени соседа.
  if (Number.isFinite(jIdx) && jIdx > 3 && contacts.length) {
    const panelPath = String(panelRoot.userData?.path || '').trim();
    const rawSchemes =
      (panelPath && _jointSchemesStore[panelPath]) ||
      panelRoot.config?.jointSchemes ||
      panelRoot.userData?.jointSchemes ||
      [];
    const sameScheme = (Array.isArray(rawSchemes) ? rawSchemes : [])
      .filter((s) => Number(s.schemeId) === Number(schemeEntry.schemeId))
      .slice()
      .sort((a, b) => Number(a.jointIdx) - Number(b.jointIdx));
    const sortedContacts = contacts
      .slice()
      .sort((a, b) =>
        String(a.neighborName || '').localeCompare(String(b.neighborName || ''), 'ru'),
      );
    const i = sameScheme.findIndex(
      (s) =>
        Number(s.jointIdx) === jIdx &&
        Number(s.schemeId) === Number(schemeEntry.schemeId),
    );
    if (i >= 0 && i < sortedContacts.length) {
      const hit = sortedContacts[i];
      return { ...hit, active: true, viaPlast: hit.hostFaceType === 'plast' };
    }
    if (sameScheme.length === 1 && sortedContacts.length === 1) {
      const hit = sortedContacts[0];
      return { ...hit, active: true, viaPlast: hit.hostFaceType === 'plast' };
    }
  }
  return null;
}

function _addJointHolePreviews(group, bbox, schemeEntry, panelRoot, opts = {}) {
  if (!group || !bbox || !schemeEntry || !panelRoot) return;
  // Цветной вид: только 3D-модели крепежа. Контуры отверстий — только в прозрачном режиме.
  if (!window.transparentOutlineMode) return;
  const jIdx = Number(schemeEntry.jointIdx);
  const contact = _resolveContactForJointSchemeEntry(panelRoot, schemeEntry);
  // Базис: крепёж только на реальном стыке (общая часть панелей).
  const canPreview =
    contact &&
    contact.active !== false &&
    contact.neighborPanel &&
    !contact.neighborPanel?.userData?.__soloJointNeighbor &&
    isToretsPlastPairV2(contact.pair) &&
    Number(contact.seamOverlapMm) >= JOINT_CONTACT_OVERLAP_MIN_MM;

  if (!canPreview) {
    if (__cldEmbeddedPreview || (typeof window !== 'undefined' && window.__CLD_DEBUG_JOINT === true)) {
      console.warn('[CLD-JOINT][iframe] нет реального стыка — превью крепежа пропущено', {
        jointIdx: jIdx,
        contactId: schemeEntry.contactId || null,
        schemeId: schemeEntry.schemeId,
        panel: panelRoot?.config?.name || panelRoot?.name,
        gapMm: contact?.gapMm,
        seamOv: contact?.seamOverlapMm,
        pair: contact?.pair,
      });
    }
    return;
  }

  const neighborPanel = contact.neighborPanel;
  const neighborBBox = contact.neighborBBox || _jointPanelBBox(neighborPanel);
  if (!neighborBBox) return;
  const outward = contact.hostOutwardWorld?.clone?.()?.normalize?.() || new THREE.Vector3(0, 0, 1);
  const tSeamWorld = contact.hostSeamDirWorld?.clone?.()?.normalize?.() || new THREE.Vector3(0, 1, 0);
  const hostFaceType = contact.hostFaceType || 'torets';
  const neighborFaceType = contact.neighborFaceType || 'plast';

  const schemeId = Number(schemeEntry.schemeId);
  const tplInfo = _getSchemeTemplateHoles(schemeId, schemeEntry.setupType, {
    templateId: schemeEntry.templateId,
    schemeName: schemeEntry.schemeName,
    cabinetModelId: schemeEntry.cabinetModelId,
  });
  if (!tplInfo || !Array.isArray(tplInfo.holes) || !tplInfo.holes.length) return;

  // Мин. ширину стыка НЕ проверяем в превью/установке — резала эксцентр (Ø бочонка)
  // при торце 16 мм. Порог только в карточке схемы, если позже включим явно.

  const seamGeomMm =
    Number(contact.seamOverlapMm) > 1
      ? Number(contact.seamOverlapMm)
      : _jointSeamLenGeomMm(panelRoot, bbox, Number.isFinite(jIdx) ? jIdx : 0, contact, null);
  if (!(seamGeomMm > 1)) return;
  const seamStored = Number(schemeEntry.seamLen) || 0;
  const seamLenMm = resolveJointSeamLenMm(seamGeomMm, seamStored) || 1;
  const positions = _jointResolveSchemeStationsMm(schemeEntry, seamGeomMm);
  if (!positions.length) return;

  const ghost = _jointGhostPreviewActive();
  const panelPath = String(
    opts?.panelPath || panelRoot?.userData?.path || '',
  ).trim();
  const entrySelected = _jointSelectedMatchesEntry(panelPath, schemeEntry);
  const installed = !!opts?.templateStyle || _panelHasInstalledJointHardware(panelRoot, schemeEntry);
  // Расстановка до Install — цветные face/edge; иначе мягкий каркас цилиндра (БМ / прозрачный вид).
  const useDiagColors = !installed && !!opts?.activePlacement;

  const makeHoleLineMat = (selected) =>
    new THREE.LineBasicMaterial({
      color: selected ? 0xd946ef : 0x555555,
      transparent: true,
      opacity: selected ? 0.72 : 0.38,
      depthTest: true,
      depthWrite: false,
    });
  const makeHoleFillMat = (selected, isFace) => {
    if (useDiagColors) {
      return new THREE.MeshBasicMaterial({
        color: selected ? 0xe879f9 : isFace ? (ghost ? 0xa78bfa : 0x7c3aed) : ghost ? 0x67e8f9 : 0x22d3ee,
        transparent: true,
        opacity: selected ? 0.4 : ghost ? 0.35 : 0.45,
        depthTest: !installed,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
    }
    // Прозрачный вид: заливка читается (пласть+торец), каркас не теряется.
    return new THREE.MeshBasicMaterial({
      color: selected ? 0xe879f9 : 0x444444,
      transparent: true,
      opacity: selected ? 0.22 : 0.12,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  };

  /** Кольцо (LineLoop) в плоскости, перпендикулярной dir. */
  const addCircleLoop = (parent, origin, dir, radius, selected, renderOrder) => {
    const segs = 28;
    const pts = [];
    const n = dir.clone().normalize();
    const tmp = Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const u = new THREE.Vector3().crossVectors(n, tmp).normalize();
    const v = new THREE.Vector3().crossVectors(n, u).normalize();
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      pts.push(
        origin
          .clone()
          .addScaledVector(u, Math.cos(a) * radius)
          .addScaledVector(v, Math.sin(a) * radius),
      );
    }
    const loop = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(pts),
      makeHoleLineMat(selected),
    );
    loop.renderOrder = renderOrder;
    loop.userData.isAccessory = true;
    loop.userData.jointPreviewHole = true;
    parent.add(loop);
    return loop;
  };

  // В placements уходит исходный jointIdx (в т.ч. 534) — resolveEdgeJointIdx сам клампит 0..3.
  const jForPlace = Number.isFinite(jIdx) ? Number(jIdx) : 0;
  positions.forEach((pMm, stationIdx) => {
    const stationSelected = entrySelected && _jointSelectedMatchesStation(stationIdx);
    const resolved = _resolveJointFittingNodePlacements(
      panelRoot,
      bbox,
      neighborPanel,
      neighborBBox,
      jForPlace,
      seamLenMm,
      Number(pMm) || 0,
      tplInfo,
      outward,
      tSeamWorld,
      schemeEntry.seamSizeKey,
      {
        hostFaceType,
        neighborFaceType,
        facing: schemeEntry.facing || 'inside',
      },
      contact,
    );
    if (_shouldShowJointTemplateOriginMarker(tplInfo)) {
      const frame = resolved.find((h) => h?.setup3Frame?.O)?.setup3Frame;
      if (frame) {
        let markerParent = group;
        let frameForMarker = frame;
        if (opts?.localToPanel) {
          const faceTarget =
            resolved.find((h) => h?.isFace)?.targetPanel
            || resolved[0]?.targetPanel
            || panelRoot;
          markerParent = _ensurePanelJointViz(faceTarget) || group;
          const O = _jointWorldToPanelLocal(faceTarget, frame.O, null).pos;
          const eX = frame.eX
            ? _jointWorldToPanelLocal(faceTarget, null, frame.eX).dir
            : null;
          const eY = frame.eY
            ? _jointWorldToPanelLocal(faceTarget, null, frame.eY).dir
            : null;
          const eZ = frame.eZ
            ? _jointWorldToPanelLocal(faceTarget, null, frame.eZ).dir
            : null;
          frameForMarker = { O, eX, eY, eZ };
        }
        _addJointTemplateOriginMarker(markerParent, frameForMarker, jForPlace, Number(pMm) || 0);
      }
    }
    for (const hole of resolved) {
      const boreLenMm = Number(hole.boreLenMm) > 0 ? Number(hole.boreLenMm) : Number(hole.depth) || 16;
      const boreLen = boreLenMm / UNITS_MM;
      const radiusScale = stationSelected ? 1.12 : ghost && useDiagColors ? 1.25 : 1;
      const radius = Math.max((Number(hole.diameter) || 8) / (2 * UNITS_MM), 0.1) * radiusScale;
      let dir = hole.worldDir.clone().normalize();
      let entry = hole.worldEntry.clone();
      // localToPanel: локаль own_object панели пласть/торец — едут с slide ящика.
      let vizParent = group;
      if (opts?.localToPanel) {
        const targetPanel = hole.targetPanel || panelRoot;
        vizParent = _ensurePanelJointViz(targetPanel) || group;
        const loc = _jointWorldToPanelLocal(targetPanel, entry, dir);
        entry = loc.pos;
        dir = loc.dir;
      }
      const exit = entry.clone().addScaledVector(dir, boreLen);
      const center = entry.clone().addScaledVector(dir, boreLen * 0.5);
      const cylGeo = new THREE.CylinderGeometry(radius, radius, Math.max(boreLen, 0.1), 24, 1, true);
      const cyl = new THREE.Mesh(cylGeo, makeHoleFillMat(stationSelected, !!hole.isFace));
      cyl.quaternion.setFromUnitVectors(_jointYAxis, dir);
      cyl.position.copy(center);
      cyl.renderOrder = stationSelected ? 36 : useDiagColors ? 13 : 14;
      cyl.name = `joint_preview_hole_j${jForPlace}`;
      cyl.userData.isAccessory = true;
      cyl.userData.jointPreviewHole = true;
      cyl.userData.jointIdx = jForPlace;
      cyl.userData.frameIndex = stationIdx;
      cyl.userData.holeKind = hole.isFace ? 'face' : 'edge';
      if (schemeEntry.contactId != null) cyl.userData.contactId = String(schemeEntry.contactId);
      vizParent.add(cyl);

      // Каркас цилиндра: рёбра + торцевые окружности (как контур присадки в БМ).
      try {
        const edgeMat = makeHoleLineMat(stationSelected);
        const cylLines = new THREE.LineSegments(new THREE.EdgesGeometry(cylGeo, 15), edgeMat);
        cylLines.quaternion.copy(cyl.quaternion);
        cylLines.position.copy(cyl.position);
        cylLines.renderOrder = cyl.renderOrder + 1;
        cylLines.userData.isAccessory = true;
        cylLines.userData.jointPreviewHole = true;
        vizParent.add(cylLines);
        addCircleLoop(vizParent, entry, dir, radius, stationSelected, cyl.renderOrder + 2);
        addCircleLoop(vizParent, exit, dir, radius, stationSelected, cyl.renderOrder + 2);
        // 4 образующие — цилиндр читается даже без заливки.
        const n = dir.clone().normalize();
        const tmp = Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
        const u = new THREE.Vector3().crossVectors(n, tmp).normalize();
        const v = new THREE.Vector3().crossVectors(n, u).normalize();
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2;
          const off = u.clone().multiplyScalar(Math.cos(a) * radius).add(v.clone().multiplyScalar(Math.sin(a) * radius));
          const gen = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([entry.clone().add(off), exit.clone().add(off)]),
            edgeMat,
          );
          gen.renderOrder = cyl.renderOrder + 1;
          gen.userData.isAccessory = true;
          gen.userData.jointPreviewHole = true;
          vizParent.add(gen);
        }
      } catch (_) {}
    }
  });
}

/**
 * Позы furniture = тот же templateFrame, что у отверстий (eX/eY/eZ), не setFromUnitVectors
 * по одной оси — иначе roll «на 90°» относительно шаблона.
 * Model child: jointModelVisualRotDeg из шаблона присадки (как в превью сверловки).
 */
function _jointHardwareModelAxisLocal(tplHint) {
  if (_tplLooksEccentricDrill(tplHint)) return new THREE.Vector3(0, -1, 0);
  return new THREE.Vector3(1, 0, 0);
}

function _jointHardwareModelPivot(tplHint) {
  if (_tplLooksEccentricDrill(tplHint)) return { x: 0, y: 1, z: 0 };
  return { x: 0, y: 0, z: 0 };
}

/** rot furniture: базис шаблона → локаль host (own_object). */
function _jointFurnitureRotDegFromHole(hole, invHost, tplHint) {
  const tf = hole?.templateFrame || hole?.setup3Frame;
  if (tf?.eX && tf?.eY && tf?.eZ && invHost) {
    const eX = tf.eX.clone().normalize().transformDirection(invHost).normalize();
    const eY = tf.eY.clone().normalize().transformDirection(invHost).normalize();
    const eZ = tf.eZ.clone().normalize().transformDirection(invHost).normalize();
    if (eX.lengthSq() > 1e-12 && eY.lengthSq() > 1e-12 && eZ.lengthSq() > 1e-12) {
      return _eulerDegFromTemplateBasisLocal(eX, eY, eZ);
    }
  }
  const axisLocal = _jointHardwareModelAxisLocal(tplHint);
  const dir =
    hole?.worldDir && hole.worldDir.lengthSq() > 1e-12
      ? hole.worldDir.clone().normalize().transformDirection(invHost).normalize()
      : new THREE.Vector3(0, -1, 0);
  return _eulerDegAlignLocalAxisToDir(dir, axisLocal);
}

function _eulerDegAlignLocalAxisToDir(dirLocal, axisLocal) {
  const d = dirLocal && dirLocal.lengthSq() > 1e-12
    ? dirLocal.clone().normalize()
    : new THREE.Vector3(0, -1, 0);
  const axis =
    axisLocal && axisLocal.lengthSq() > 1e-12
      ? axisLocal.clone().normalize()
      : new THREE.Vector3(0, -1, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(axis, d);
  const e = new THREE.Euler().setFromQuaternion(q, 'XYZ');
  return {
    x: Math.round((-THREE.MathUtils.radToDeg(e.x)) * 1000) / 1000,
    y: Math.round((-THREE.MathUtils.radToDeg(e.y)) * 1000) / 1000,
    z: Math.round((-THREE.MathUtils.radToDeg(e.z)) * 1000) / 1000,
  };
}

/** @deprecated имя — см. _eulerDegAlignLocalAxisToDir */
function _eulerDegAlignLocalNegYToDir(dirLocal) {
  return _eulerDegAlignLocalAxisToDir(dirLocal, new THREE.Vector3(0, -1, 0));
}

function _jointHardwareContactCtx(panelRoot, bbox, jIdx, schemeEntry, opts = {}) {
  void opts;
  const contact = _resolveContactForJointSchemeEntry(panelRoot, schemeEntry) ||
    (Number.isFinite(Number(jIdx)) && Number(jIdx) >= 0 && Number(jIdx) <= 3
      ? resolveJointContactForIdxV2(panelRoot, Number(jIdx), rootGroup, { mmPerWorldUnit: UNITS_MM })
      : null);
  const canPreview =
    contact &&
    contact.active !== false &&
    contact.neighborPanel &&
    !contact.neighborPanel?.userData?.__soloJointNeighbor &&
    isToretsPlastPairV2(contact.pair) &&
    Number(contact.seamOverlapMm) >= JOINT_CONTACT_OVERLAP_MIN_MM;

  if (!canPreview) return null;

  const neighborBBox = contact.neighborBBox || _jointPanelBBox(contact.neighborPanel);
  if (!neighborBBox) return null;
  const jSafe = _jointIdxSafeForStripe(jIdx, contact);
  const frTorets = getJointStripeFrameWorld(panelRoot, jSafe);
  const outward =
    contact.hostOutwardWorld?.clone?.()?.normalize?.() ||
    frTorets?.outwardWorld?.clone?.()?.normalize?.() ||
    new THREE.Vector3(0, 0, 1);
  const tSeam =
    contact.hostSeamDirWorld?.clone?.()?.normalize?.() ||
    frTorets?.seamDirWorld?.clone?.()?.normalize?.() ||
    new THREE.Vector3(0, 1, 0);
  const seamGeomMm =
    Number(contact.seamOverlapMm) > 1
      ? Number(contact.seamOverlapMm)
      : _jointSeamLenGeomMm(panelRoot, bbox, jSafe, contact, null);
  if (!(seamGeomMm > 1)) return null;
  const seamStored = Number(schemeEntry.seamLen) || 0;

  // Без фильтра мин. ширины — иначе эксцентр на пласти 16 мм не встаёт.

  return {
    neighborPanel: contact.neighborPanel,
    neighborBBox,
    outward,
    tSeamWorld: tSeam,
    hostFaceType: contact.hostFaceType || 'torets',
    neighborFaceType: contact.neighborFaceType || 'plast',
    seamLenMm: resolveJointSeamLenMm(seamGeomMm, seamStored) || 1,
    contact,
    viaPlast: contact.hostFaceType === 'plast' || !!contact.viaPlast,
  };
}

function _holeLooksFace(h) {
  if (!h) return false;
  if (h.isFace === true) return true;
  if (h.isFace === false) return false;
  const kind = String(h.holeKind || '').toLowerCase();
  if (kind === 'face' || kind === 'plast') return true;
  if (kind === 'edge' || kind === 'torets') return false;
  const side = String(h?.hole?.mountSide || h?.hole?.mount_side || '').toLowerCase();
  return side === 'face' || side === 'plast';
}

function _holeLooksEdge(h) {
  if (!h) return false;
  if (h.isFace === false) return true;
  if (h.isFace === true) return false;
  const kind = String(h.holeKind || '').toLowerCase();
  if (kind === 'edge' || kind === 'torets') return true;
  if (kind === 'face' || kind === 'plast') return false;
  const side = String(h?.hole?.mountSide || h?.hole?.mount_side || '').toLowerCase();
  return side === 'edge' || side === 'torets';
}

/**
 * Якорь 3D furniture на панели, куда ставят схему.
 * Face на соседней полке даёт worldDir вверх/вниз → модель «торчком», пока cyan на фасаде горизонтальны.
 * Поэтому сначала отверстия на host (targetPanel === panelRoot).
 */
function _pickJointHardwareHole(resolved, panelRoot, tplHint = null) {
  if (!Array.isArray(resolved) || !resolved.length) return null;
  const withPose = resolved.filter((h) => h?.worldEntry && h?.worldDir);
  if (!withPose.length) return null;

  const onHost = panelRoot
    ? withPose.filter((h) => h.targetPanel === panelRoot)
    : [];
  const pool = onHost.length ? onHost : withPose;

  const pickFace = (arr) => arr.find((h) => _holeLooksFace(h));
  const pickEdge = (arr) => arr.find((h) => _holeLooksEdge(h));

  if (_tplLooksEccentricDrill(tplHint)) {
    // Эксцентрик: face-бочонок на ЭТОЙ панели; иначе edge на host (шток / как cyan на фасаде).
    return (
      pickFace(pool) ||
      pickEdge(pool) ||
      pickFace(withPose) ||
      pickEdge(withPose) ||
      pool[0]
    );
  }

  // Конфирмат: edge (торец) — ось как у cyan-цилиндра на стойке/фасаде.
  return (
    pickEdge(pool) ||
    pickEdge(withPose) ||
    pickFace(pool) ||
    pool[0] ||
    withPose.slice().sort(
      (a, b) =>
        (Number(b.boreLenMm) || Number(b.depth) || 0) -
        (Number(a.boreLenMm) || Number(a.depth) || 0),
    )[0]
  );
}

function _eulerDegFromTemplateBasisLocal(eX, eY, eZ) {
  const m = new THREE.Matrix4().makeBasis(
    eX.clone().normalize(),
    eY.clone().normalize(),
    eZ.clone().normalize(),
  );
  const q = new THREE.Quaternion().setFromRotationMatrix(m);
  const e = new THREE.Euler().setFromQuaternion(q, 'XYZ');
  return {
    x: Math.round((-THREE.MathUtils.radToDeg(e.x)) * 1000) / 1000,
    y: Math.round((-THREE.MathUtils.radToDeg(e.y)) * 1000) / 1000,
    z: Math.round((-THREE.MathUtils.radToDeg(e.z)) * 1000) / 1000,
  };
}

function _normalizeJointModelVisualOffsetMm(v) {
  const o = v && typeof v === 'object' ? v : {};
  return {
    x: Number.isFinite(Number(o.x)) ? Number(o.x) : 0,
    y: Number.isFinite(Number(o.y)) ? Number(o.y) : 0,
    z: Number.isFinite(Number(o.z)) ? Number(o.z) : 0,
  };
}

function _tplLooksEccentricDrill(tpl) {
  if (!tpl) return false;
  const nameLow = String(tpl.name || tpl.article || '').toLowerCase();
  if (nameLow.includes('эксцентр') || nameLow.includes('eccentric') || nameLow.includes('eks')) return true;
  const holes = [];
  if (tpl.holesBySetup && typeof tpl.holesBySetup === 'object') {
    for (const k of Object.keys(tpl.holesBySetup)) {
      if (Array.isArray(tpl.holesBySetup[k])) holes.push(...tpl.holesBySetup[k]);
    }
  }
  if (Array.isArray(tpl.holes)) holes.push(...tpl.holes);
  return holes.some((h) => {
    const side = String(h?.mountSide || h?.mount_side || '').toLowerCase();
    const isFace = side === 'face' || side === 'plast' || side === 'auto' || side === '';
    const d = Number(h?.diameterMm ?? h?.diameter) || 0;
    return isFace && d >= 12;
  });
}

/** Смещение 3D из шаблона: только сохранённое (без автодефолта — origin GLB = вход штока). */
function _resolveJointModelVisualOffsetMm(tpl) {
  return _normalizeJointModelVisualOffsetMm(tpl?.jointModelVisualOffsetMm);
}

function _mergeJointModelOffsetMm(camOff, visualOff) {
  const base = camOff || { x: 0, y: 0, z: 0 };
  const vis = _normalizeJointModelVisualOffsetMm(visualOff);
  return {
    x: Math.round(((Number(base.x) || 0) + vis.x) * 100) / 100,
    y: Math.round(((Number(base.y) || 0) + vis.y) * 100) / 100,
    z: Math.round(((Number(base.z) || 0) + vis.z) * 100) / 100,
  };
}

/**
 * Отверстие-бочонок (эксцентрик): face Ø≥12 или face Ø≥10 при x>2.
 * В рефе furniture на якоре стойки; смещение бочонка — в child model.
 */
function _pickJointTemplateCamHoleOffsetMm(holes) {
  const face = (Array.isArray(holes) ? holes : []).filter((h) => {
    const side = String(h.mountSide || h.mount_side || '').toLowerCase();
    return side === 'face' || side === 'plast';
  });
  const byDiam = (a, b) =>
    (Number(b.diameterMm ?? b.diameter) || 0) - (Number(a.diameterMm ?? a.diameter) || 0);
  const cam =
    face.filter((h) => (Number(h.diameterMm ?? h.diameter) || 0) >= 12).sort(byDiam)[0] ||
    face
      .filter((h) => {
        const d = Number(h.diameterMm ?? h.diameter) || 0;
        const x = Number(h.xMm ?? h.x) || 0;
        return d >= 10 && x > 2;
      })
      .sort(byDiam)[0];
  if (!cam) return null;
  return {
    x: Number(cam.xMm ?? cam.x) || 0,
    y: Number(cam.yMm ?? cam.y) || 0,
    z: Number(cam.zMm ?? cam.z) || 0,
  };
}

/** Торец стойки (конфирмат): mountSide edge или |x|≥12 — как cyan edge-цилиндр. */
function _pickJointEdgeHoleOffsetMm(holes) {
  const arr = Array.isArray(holes) ? holes : [];
  let hole =
    arr.find((h) => String(h.mountSide || h.mount_side || '').toLowerCase() === 'edge') || null;
  if (!hole) {
    hole =
      arr.find((h) => Math.abs(Number(h.xMm ?? h.x) || 0) >= 12) ||
      arr[1] ||
      arr[0] ||
      null;
  }
  if (!hole) return null;
  return {
    x: Number(hole.xMm ?? hole.x) || 0,
    y: Number(hole.yMm ?? hole.y) || 0,
    z: Number(hole.zMm ?? hole.z) || 0,
  };
}

/**
 * Якорь 3D = то же отверстие, что визуально «носит» крепёж:
 * эксцентрик → face-бочонок (cyan face); конфирмат → edge (cyan edge).
 * Координаты в локали furniture frame шаблона — как у отверстий в tpl.
 */
function _pickJointModelAnchorHoleOffsetMm(holes, tplHint) {
  const cam = _pickJointTemplateCamHoleOffsetMm(holes);
  if (cam && _tplLooksEccentricDrill(tplHint)) return cam;
  return _pickJointEdgeHoleOffsetMm(holes) || cam || { x: 0, y: 0, z: 0 };
}

/**
 * THREE-родитель cabinet-детей = panel.own_object (_build_children), не panelRoot.
 * frame.pos/rot считаем в этой СК, иначе pivot фасада (−1) уносит 3D от cyan.
 */
function _jointPanelChildLocalInvMatrix(panelRoot) {
  if (!panelRoot) return new THREE.Matrix4();
  panelRoot.updateWorldMatrix(true, true);
  const host = panelRoot.userData?.own_object || panelRoot;
  if (host !== panelRoot && typeof host.updateWorldMatrix === 'function') {
    host.updateWorldMatrix(true, true);
  }
  return new THREE.Matrix4().copy(host.matrixWorld).invert();
}

/**
 * Frame type:furniture — 1:1 с превью шаблона присадки.
 * Якорь = O кадра (как оранжевая сфера в шаблоне), не worldEntry отверстия.
 * Model child: jointModelVisualOffsetMm / RotDeg от O (как поля смещения в шаблоне).
 * Присадка (cyan) остаётся на worldEntry — визуально GLB тянется к отверстию как в мокапе.
 */
function _computeJointTemplateLocalFrames(panelRoot, schemeEntries) {
  const bbox = _jointPanelBBox(panelRoot);
  if (!panelRoot || !bbox || bbox.isEmpty()) return [];
  panelRoot.updateWorldMatrix(true, true);
  const invHost = _jointPanelChildLocalInvMatrix(panelRoot);
  const out = [];

  for (const schemeEntry of schemeEntries || []) {
    const jIdxRaw = Number(schemeEntry.jointIdx);
    const hasContact = !!(schemeEntry.contactId || schemeEntry.neighborName);
    if (!Number.isFinite(jIdxRaw) && !hasContact) continue;
    const ctx = _jointHardwareContactCtx(panelRoot, bbox, jIdxRaw, schemeEntry, {
      requireRealContact: true,
    });
    if (!ctx) continue;
    const positions = _jointResolveSchemeStationsMm(schemeEntry, ctx.seamLenMm);
    if (!positions.length) continue;
    const tplInfo = _getSchemeTemplateHoles(schemeEntry.schemeId, schemeEntry.setupType, {
      templateId: schemeEntry.templateId,
      schemeName: schemeEntry.schemeName,
      cabinetModelId: schemeEntry.cabinetModelId,
    });
    if (!tplInfo?.holes?.length) continue;

    const setupType = Number(tplInfo.setupType) || Number(schemeEntry.setupType) || 3;
    const modelOffBase = _resolveJointModelVisualOffsetMm({
      jointModelVisualOffsetMm: tplInfo.jointModelVisualOffsetMm,
    });
    const modelRotBase = _normalizeJointModelVisualOffsetMm(tplInfo.jointModelVisualRotDeg);
    const furniturePivot = { x: 0, y: 0, z: 0 };
    const modelPivot = { x: 0, y: 0, z: 0 };

    positions.forEach((pMm, pi) => {
      const resolved = _resolveJointFittingNodePlacements(
        panelRoot,
        bbox,
        ctx.neighborPanel,
        ctx.neighborBBox,
        Number.isFinite(jIdxRaw) ? jIdxRaw : 0,
        ctx.seamLenMm,
        Number(pMm) || 0,
        tplInfo,
        ctx.outward,
        ctx.tSeamWorld,
        schemeEntry.seamSizeKey,
        {
          hostFaceType: ctx.hostFaceType,
          neighborFaceType: ctx.neighborFaceType,
          facing: schemeEntry.facing || 'inside',
        },
        ctx.contact || null,
      );
      if (!resolved?.length) return;
      // O кадра — как в редакторе шаблона; rot/kind — с отверстия-носителя крепежа.
      const framed =
        resolved.find((h) => h?.templateFrame?.O || h?.setup3Frame?.O) ||
        _pickJointHardwareHole(resolved, panelRoot, tplInfo);
      if (!framed) return;
      const tf = framed.templateFrame || framed.setup3Frame;
      if (!tf?.O) return;
      const hole = _pickJointHardwareHole(resolved, panelRoot, tplInfo) || framed;

      const originLocalU = tf.O.clone().applyMatrix4(invHost);
      const pos = {
        x: Math.round(originLocalU.x * UNITS_MM * 100) / 100,
        y: Math.round(originLocalU.y * UNITS_MM * 100) / 100,
        z: Math.round(originLocalU.z * UNITS_MM * 100) / 100,
      };
      const rot = _jointFurnitureRotDegFromHole(hole, invHost, tplInfo);

      out.push({
        jointIdx: Number.isFinite(jIdxRaw) ? jIdxRaw : 0,
        contactId: schemeEntry.contactId != null ? String(schemeEntry.contactId) : null,
        neighborName: schemeEntry.neighborName || null,
        seamPosMm: Number(pMm) || 0,
        index: pi,
        pos,
        rot,
        pivot: furniturePivot,
        modelPivot,
        setupType,
        fromTemplateFrame: true,
        furnitureAnchor: 'template_O',
        hostLocalMm: 1,
        modelOffsetMm: modelOffBase,
        modelRotDeg: modelRotBase,
        fromHole: false,
        holeKind: hole.isFace ? 'face' : 'edge',
      });
    });
  }
  return out;
}

/** parent_size для joint furniture pos — 1:1 с CabinetNode._build_comp_obj / _build_pos. */
function _jointPanelParentSizeMmForBuildPos(panelRoot, bbox) {
  const computed = panelRoot?.userData?.computed?.size;
  if (computed && Number(computed.x) > 0 && Number(computed.y) > 0 && Number(computed.z) > 0) {
    return { x: Number(computed.x), y: Number(computed.y), z: Number(computed.z) };
  }
  const cs = panelRoot?.calculated?.size;
  if (cs && Number(cs.x) > 0 && Number(cs.y) > 0 && Number(cs.z) > 0) {
    return { x: Number(cs.x), y: Number(cs.y), z: Number(cs.z) };
  }
  return panelParentSizeMm(panelRoot, bbox, UNITS_MM);
}

function _findJointPanelForFurnitureNode(furnNode) {
  if (!furnNode) return null;
  if (__cldJointPanelByFurn && __cldJointPanelByFurn.has(furnNode)) {
    return __cldJointPanelByFurn.get(furnNode);
  }
  let p = furnNode?.userData?.parent;
  let found = null;
  // Root cabinet: userData.parent = this (sentinel). Без break — бесконечный while → hang вкладки.
  while (p) {
    const path = String(p.userData?.path || '').trim();
    if (path && Array.isArray(_jointSchemesStore[path]) && _jointSchemesStore[path].length) {
      found = p;
      break;
    }
    const cfg = p.config;
    if (Array.isArray(cfg?.jointSchemes) && cfg.jointSchemes.length) {
      found = p;
      break;
    }
    const t = String(cfg?.type || '').toLowerCase();
    if (t === 'wall' || t === 'detail' || t === 'facade') {
      found = p;
      break;
    }
    const next = p.userData?.parent;
    if (!next || next === p) break;
    p = next;
  }
  if (__cldJointPanelByFurn) __cldJointPanelByFurn.set(furnNode, found);
  return found;
}

/** Актуальный frame furniture (pos/rot) из jointSchemes + facing — как для маркеров присадки. */
function _liveJointTemplateFrameForFurniture(furnNode) {
  // Кешируем только успешный кадр. null нельзя — иначе первый build до стыков
  // навсегда оставляет baked pos, а присадка (_renderJointMarkers) уже живая.
  if (__cldJointFrameByFurn && furnNode && __cldJointFrameByFurn.has(furnNode)) {
    const cached = __cldJointFrameByFurn.get(furnNode);
    if (cached) return cached;
  }
  const cfg = furnNode?.config;
  if (!cfg?.fromJointScheme) return null;
  if (Number(cfg.spec?.joint_template_frame) !== 1) return null;
  const schemeId = Number(cfg.schemeId) || 0;
  const jointIdx = Number(cfg.jointIdx);
  const contactId = cfg.contactId != null ? String(cfg.contactId) : '';
  const seamPosMm = Number(cfg.seamPosMm);
  const frameIndex = Number(cfg.frameIndex ?? cfg.index);
  if (!schemeId || (!Number.isFinite(jointIdx) && !contactId)) return null;

  const panel = _findJointPanelForFurnitureNode(furnNode);
  if (!panel) return null;
  const panelPath = String(panel.userData?.path || '').trim();
  const rawSchemes =
    (panelPath && _jointSchemesStore[panelPath]) ||
    panel.config?.jointSchemes ||
    [];
  if (!Array.isArray(rawSchemes) || !rawSchemes.length) return null;

  const entry = rawSchemes
    .map((j) => _enrichJointEntryFromLs(j))
    .find((j) => {
      if (Number(j.schemeId) !== schemeId) return false;
      if (contactId && j.contactId != null && String(j.contactId) === contactId) return true;
      return Number.isFinite(jointIdx) && Number(j.jointIdx) === jointIdx;
    });
  if (!entry) return null;

  const frames = _computeJointTemplateLocalFrames(panel, [entry]);
  if (!frames.length) return null;

  let result = null;
  if (Number.isFinite(frameIndex) && frames[frameIndex]) result = frames[frameIndex];

  if (!result && Number.isFinite(seamPosMm)) {
    let best = null;
    let bestD = Infinity;
    for (const fr of frames) {
      const d = Math.abs((Number(fr.seamPosMm) || 0) - seamPosMm);
      if (d < bestD) {
        bestD = d;
        best = fr;
      }
    }
    if (best && bestD < 2) result = best;
  }

  if (!result) {
    const pos = cfg.pos || cfg.position || {};
    const px = Number(pos.x) || 0;
    const py = Number(pos.y) || 0;
    const pz = Number(pos.z) || 0;
    let best = null;
    let bestD = Infinity;
    for (const fr of frames) {
      if (contactId && fr.contactId && String(fr.contactId) !== contactId) continue;
      if (!contactId && Number.isFinite(jointIdx) && Number(fr.jointIdx) !== jointIdx) continue;
      const d = Math.hypot(
        (Number(fr.pos?.x) || 0) - px,
        (Number(fr.pos?.y) || 0) - py,
        (Number(fr.pos?.z) || 0) - pz
      );
      if (d < bestD) {
        bestD = d;
        best = fr;
      }
    }
    result = best || frames[0] || null;
  }

  if (result && __cldJointFrameByFurn && furnNode) {
    __cldJointFrameByFurn.set(furnNode, result);
  }
  return result;
}

function _walkCabinetChildNodes(node, fn) {
  if (!node || typeof fn !== 'function') return;
  fn(node);
  const kids = node.userData?.cabinet_child_nodes || [];
  for (const ch of kids) _walkCabinetChildNodes(ch, fn);
}

/** После cld:setJointSchemes — pos/rot furniture + child model (facing = flip y/z + rot.x 180). */
function _rebuildJointSchemeModelsOnPanel(panelPath) {
  const pkey = String(panelPath || '').trim();
  if (!pkey) return 0;
  const panel = window.CLDDBG?.engine?.getNodeByPath(pkey);
  if (!panel) return 0;
  // Стыки уже есть — сбросить ранний null/устаревший кадр, иначе 3D остаётся на baked pos.
  _walkCabinetChildNodes(panel, (node) => {
    try {
      __cldJointFrameByFurn?.delete?.(node);
    } catch (_) {}
  });
  let n = 0;
  _walkCabinetChildNodes(panel, (node) => {
    const cfg = node.config;
    if (!cfg?.fromJointScheme) return;
    if (Number(cfg.spec?.joint_template_frame) !== 1) return;
    const frame = _liveJointTemplateFrameForFurniture(node);
    if (frame?.pos) {
      cfg.pos = {
        x: Number(frame.pos.x) || 0,
        y: Number(frame.pos.y) || 0,
        z: Number(frame.pos.z) || 0,
      };
      if (cfg.position) {
        cfg.position.x = cfg.pos.x;
        cfg.position.y = cfg.pos.y;
        cfg.position.z = cfg.pos.z;
      }
    }
    if (frame?.pivot) cfg.pivot = { ...frame.pivot };
    if (typeof node._build_pos === 'function') node._build_pos();
    if (typeof node._build_rot === 'function') node._build_rot();
    n += 1;
  });
  _walkCabinetChildNodes(panel, (node) => {
    const cfg = node.config;
    if (Number(cfg?.spec?.joint_template_model) !== 1) return;
    if (typeof node._build_pos === 'function') node._build_pos();
    if (typeof node._build_rot === 'function') node._build_rot();
    if (typeof node._build_pivot === 'function') node._build_pivot();
    n += 1;
  });
  return n;
}

const _cldCabinetNodeBuildRot = CabinetNode.prototype._build_rot;
/** furniture rot — только якорь шаблона (без facing); разворот на child model. */
CabinetFurnitureNode.prototype._build_rot = function _cldJointFurnitureBaseRot() {
  const cfg = this.config || {};
  if (cfg.fromJointScheme && Number(cfg.spec?.joint_template_frame) === 1) {
    const frame = _liveJointTemplateFrameForFurniture(this);
    if (frame?.rot) {
      const rx = Number(frame.rot.x) || 0;
      const ry = Number(frame.rot.y) || 0;
      const rz = Number(frame.rot.z) || 0;
      this.calculated.rot.set(rx, ry, rz);
      const h = this.userData.own_object;
      if (h) {
        h.rotation.set(0, 0, 0);
        h.rotateX(-THREE.MathUtils.degToRad(rx));
        h.rotateY(-THREE.MathUtils.degToRad(ry));
        h.rotateZ(-THREE.MathUtils.degToRad(rz));
      }
      return;
    }
  }
  return _cldCabinetNodeBuildRot.call(this);
};

function _computeJointHardwareLocalPoses(panelRoot, schemeEntries, modelLenMm = 50, modelCrossMm = 7) {
  const bbox = _jointPanelBBox(panelRoot);
  if (!panelRoot || !bbox || bbox.isEmpty()) return [];
  panelRoot.updateWorldMatrix(true, true);
  const invHost = _jointPanelChildLocalInvMatrix(panelRoot);
  const lenMm = Math.max(1, Number(modelLenMm) || 50);
  const crossMm = Math.max(1, Number(modelCrossMm) || 7);
  const out = [];

  for (const schemeEntry of schemeEntries || []) {
    const jIdx = Number(schemeEntry.jointIdx);
    if (!Number.isFinite(jIdx)) continue;
    const ctx = _jointHardwareContactCtx(panelRoot, bbox, jIdx, schemeEntry, {
      requireRealContact: true,
    });
    if (!ctx) continue;
    const positions = _jointResolveSchemeStationsMm(schemeEntry, ctx.seamLenMm);
    if (!positions.length) continue;
    const tplInfo = _getSchemeTemplateHoles(schemeEntry.schemeId, schemeEntry.setupType, {
      templateId: schemeEntry.templateId,
      schemeName: schemeEntry.schemeName,
      cabinetModelId: schemeEntry.cabinetModelId,
    });
    if (!tplInfo?.holes?.length) continue;
    // Поза furniture — host-local мм; pivot 0.
    const pivot = { x: 0, y: 0, z: 0 };

    positions.forEach((pMm, pi) => {
      const resolved = _resolveJointFittingNodePlacements(
        panelRoot,
        bbox,
        ctx.neighborPanel,
        ctx.neighborBBox,
        jIdx,
        ctx.seamLenMm,
        Number(pMm) || 0,
        tplInfo,
        ctx.outward,
        ctx.tSeamWorld,
        schemeEntry.seamSizeKey,
        {
          hostFaceType: ctx.hostFaceType,
          neighborFaceType: ctx.neighborFaceType,
          facing: schemeEntry.facing || 'inside',
        },
        ctx.contact || null,
      );
      if (!resolved?.length) return;
      const hole = _pickJointHardwareHole(resolved, panelRoot, tplInfo);
      if (!hole) return;

      const entryLocalU = hole.worldEntry.clone().applyMatrix4(invHost);
      const pos = {
        x: Math.round(entryLocalU.x * UNITS_MM * 100) / 100,
        y: Math.round(entryLocalU.y * UNITS_MM * 100) / 100,
        z: Math.round(entryLocalU.z * UNITS_MM * 100) / 100,
      };

      const rot = _jointFurnitureRotDegFromHole(hole, invHost, tplInfo);
      const size = { w: crossMm, h: lenMm, d: crossMm };

      out.push({
        jointIdx: jIdx,
        seamPosMm: Number(pMm) || 0,
        index: pi,
        pos,
        rot,
        pivot,
        size,
        fromHole: true,
        holeKind: hole.isFace ? 'face' : 'edge',
      });
    });
  }
  return out;
}

/** Центр торцевой грани стыка jointIdx в мире (середина прямоугольника грани по bbox). */
function _jointFaceCenterWorld(bbox, jointIdx, panelRoot) {
  const { faceAxis, faceSign } = _jointFaceInfo(jointIdx, bbox, panelRoot);
  const { seamAx, edgeAx } = _jointFaceSeamAndEdgeAxes(bbox, jointIdx, panelRoot);
  const { min, max } = bbox;
  const v = new THREE.Vector3();
  v[faceAxis] = faceSign > 0 ? max[faceAxis] : min[faceAxis];
  v[seamAx] = (min[seamAx] + max[seamAx]) / 2;
  v[edgeAx] = (min[edgeAx] + max[edgeAx]) / 2;
  return v;
}

/**
 * Один малый шаг отладки: window.__CLD_DEBUG_JOINT_AXES = true
 * window.__CLD_DEBUG_JOINT_ORIGIN = true — маркер (0,0,0) шаблона (для конфирмата включён всегда).
 * Малиновая стрелка — наруж. нормаль стыка (к соседу, после согласования с центрами);
 * циан — ось мин. габарита AABB соседа (грубая ось толщины, если панель осевая в мире).
 * Совпадение/расхождение смотрите визуально (параллельны = хорошо для T-стыка).
 */
function _addJointDebugAxesArrows(group, panelRoot, bbox, jointIdx) {
  const jIdx = Number(jointIdx);
  if (!group || !bbox || !panelRoot || !Number.isFinite(jIdx)) return;
  const neighborPanel = _findNeighborPanelRootForJoint(panelRoot, bbox, jIdx);
  const neighborBBox = neighborPanel ? _jointPanelBBox(neighborPanel) : null;
  if (neighborPanel && neighborPanel.updateWorldMatrix) neighborPanel.updateWorldMatrix(true, true);

  let outward = _jointOutwardNormal(jIdx, bbox, panelRoot);
  if (neighborBBox && !neighborBBox.isEmpty()) {
    const cA = bbox.getCenter(new THREE.Vector3());
    const cB = neighborBBox.getCenter(new THREE.Vector3());
    const toNeighbor = cB.sub(cA);
    if (toNeighbor.lengthSq() > 0 && outward.dot(toNeighbor) < 0) outward = outward.clone().multiplyScalar(-1);
  }
  const center = _jointFaceCenterWorld(bbox, jIdx, panelRoot);
  const dirOut = outward.clone().normalize();
  const len = 45 / UNITS_MM;
  const headL = len * 0.22;
  const headW = len * 0.14;
  const seamArrow = new THREE.ArrowHelper(dirOut, center, len, 0xff00ff, headL, headW);
  seamArrow.name = '__cld_dbg_joint_seam_out';
  seamArrow.userData.cannotSelect = true;
  group.add(seamArrow);

  if (neighborBBox && !neighborBBox.isEmpty()) {
    const ns = neighborBBox.getSize(new THREE.Vector3());
    const th = Math.min(ns.x, ns.y, ns.z);
    let thinAx = 'x';
    if (Math.abs(ns.x - th) < 1e-6) thinAx = 'x';
    else if (Math.abs(ns.y - th) < 1e-6) thinAx = 'y';
    else thinAx = 'z';
    const t = new THREE.Vector3();
    t[thinAx] = 1;
    if (t.dot(dirOut) < 0) t.negate();
    const thickArrow = new THREE.ArrowHelper(t, center, len, 0x00ffff, headL, headW);
    thickArrow.name = '__cld_dbg_joint_neighbor_thin';
    thickArrow.userData.cannotSelect = true;
    group.add(thickArrow);
  }
}

/**
 * Подсветить грань соседа, обращённую к нашей грани с jointIdx=j.
 * Только через те же кадры joints 0–3 (getJointStripeFrameWorld), что и хост.
 * Если соседняя грань — пласть (торец→пласть), среди 0–3 кадра нет → полоса
 * соседа не рисуется; линия стыка остаётся на торце хоста (где есть контакт).
 */
function _addNeighborFaceHighlight(group, hostPanel, jointIdx, color = 0x4ade80, opacity = 0.85) {
  const fr = getJointStripeFrameWorld(hostPanel, jointIdx);
  if (!fr) return;
  const nb = _findNeighborPanelRootForJoint(hostPanel, _jointPanelBBox(hostPanel), jointIdx);
  if (!nb) return;
  const nbBBox = _jointPanelBBox(nb);
  if (!nbBBox) return;
  const wantOutward = fr.outwardWorld.clone().negate().normalize();
  let bestNJ = -1;
  let bestDot = -1;
  for (let nj = 0; nj < 4; nj++) {
    const f2 = getJointStripeFrameWorld(nb, nj);
    if (!f2) continue;
    const d = f2.outwardWorld.clone().normalize().dot(wantOutward);
    if (d > bestDot) {
      bestDot = d;
      bestNJ = nj;
    }
  }
  if (bestNJ < 0 || bestDot < 0.7) return;
  _addJointTorcFrameStripes(group, nbBBox, bestNJ, color, opacity, {
    bazisActive: true,
    panelRoot: nb,
  });
}

/**
 * Мировая ось стыка (X/Y/Z) по индексу торца на панели:
 * берём направление наружу из getJointStripeFrameWorld и выбираем доминирующую ось.
 */
function _getJointWorldAxis(panelRoot, jointIdx) {
  const fr = getJointStripeFrameWorld(panelRoot, jointIdx);
  if (!fr) return null;
  const o = fr.outwardWorld.clone().normalize();
  const ax = Math.abs(o.x), ay = Math.abs(o.y), az = Math.abs(o.z);
  if (ax >= ay && ax >= az) return 'x';
  if (ay >= ax && ay >= az) return 'y';
  return 'z';
}

/**
 * Reverse-контакты на пластях (как пласть-торец в Bazis), окрашенные по оси:
 * axisToColor['x'|'y'|'z'] = { color, active }. Контакты, ось которых не в карте,
 * не рисуются.
 *
 * Используется в режиме «Расстановка крепежа», где админка делит торцы панели
 * на группы по парам (одна ось — одна группа): активная группа фиолетовая,
 * потенциальная (следующая) — зелёная.
 */
function _renderReverseContactsByAxis(group, hostPanel, hostBBox, axisToColor) {
  if (!group || !hostPanel || !hostBBox || !axisToColor) return;
  const patches = detectReverseContactsOnPlastsV2(hostPanel, rootGroup, { mmPerWorldUnit: UNITS_MM });
  if (!patches.length) return;
  const center = hostBBox.getCenter(new THREE.Vector3());
  for (const p of patches) {
    const cWorld = new THREE.Vector3()
      .addScaledVector(p.tangent1, p.midOnT1)
      .addScaledVector(p.tangent2, p.midOnT2)
      .addScaledVector(p.plastNormal, p.plastFaceCoord);
    const d = new THREE.Vector3().subVectors(cWorld, center);
    const ax = Math.abs(d.x), ay = Math.abs(d.y), az = Math.abs(d.z);
    let axis = 'z';
    if (ax >= ay && ax >= az) axis = 'x';
    else if (ay >= ax && ay >= az) axis = 'y';
    const conf = axisToColor[axis];
    if (!conf) continue;
    const { color, active } = conf;
    const opacity = active ? 0.78 : 0.5;

    // Пятно на нашей пласти
    const offset = 0.08;
    const t = 0.003;
    const pos = cWorld.clone().add(p.plastNormal.clone().multiplyScalar(offset));
    const m4 = new THREE.Matrix4();
    m4.makeBasis(p.tangent1, p.tangent2, p.plastNormal);
    const geom = new THREE.BoxGeometry(p.sizeT1, p.sizeT2, t);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.setRotationFromMatrix(m4);
    mesh.position.copy(pos);
    mesh.renderOrder = 12;
    group.add(mesh);

    // Стрипа на торце соседа
    const neighbor = p.neighborPanel;
    const neighborBBox = neighbor ? _jointPanelBBox(neighbor) : null;
    if (neighbor && neighborBBox) {
      const wantOutward = p.plastNormal.clone().negate().normalize();
      let bestJ = -1, bestDot = -1;
      for (let nj = 0; nj < 4; nj++) {
        const fr = getJointStripeFrameWorld(neighbor, nj);
        if (!fr) continue;
        const dot = fr.outwardWorld.clone().normalize().dot(wantOutward);
        if (dot > bestDot) { bestDot = dot; bestJ = nj; }
      }
      if (bestJ >= 0 && bestDot > 0.7) {
        _addJointTorcFrameStripes(group, neighborBBox, bestJ, color, active ? 0.92 : 0.55, {
          bazisActive: active,
          bazisPotential: !active,
          panelRoot: neighbor,
        });
      }
    }
  }
}

/** Этап 1: подсветка торец↔пласть (gap≈0) + отверстия схем. */
function _renderJointMarkers() {
  if (_jointVizGroup) {
    if (_jointVizGroup.parent) _jointVizGroup.parent.remove(_jointVizGroup);
    disposeObject(_jointVizGroup);
    _jointVizGroup = null;
  }
  _clearJointPanelVizAll();
  const hasSchemes =
    Object.keys(_jointSchemesStore).length > 0 ||
    (() => {
      let n = 0;
      rootGroup?.traverse?.((o) => {
        const js = o?.userData?.jointSchemes || o?.config?.jointSchemes;
        if (Array.isArray(js) && js.length) n += 1;
      });
      return n > 0;
    })();
  const hasActive = _jointActiveInfo != null;
  if (!rootGroup || (!hasSchemes && !hasActive)) return;

  _jointVizGroup = new THREE.Group();
  _jointVizGroup.name = '__clodis_joint_viz';
  scene.add(_jointVizGroup);

  const resolvePanel = (nodePath) => {
    const tryPath = (p) => {
      if (p == null || p === '') return null;
      return window.CLDDBG?.engine?.getNodeByPath(String(p).trim()) || null;
    };
    let o = tryPath(nodePath);
    if (!o && lastSelectedPath && lastSelectedPath !== '0') o = tryPath(lastSelectedPath);
    if (!o && nodePath != null) {
      const s = String(nodePath).trim();
      if (s.startsWith('0,')) o = tryPath(s.slice(2));
      else if (s && s !== '0') o = tryPath('0,' + s);
    }
    return o;
  };

  // Store + панели сцены (facade мог не попасть в walk до фикса — подстраховываем).
  const schemeEntriesByPath = { ..._jointSchemesStore };
  if (rootGroup && typeof rootGroup.traverse === 'function') {
    rootGroup.traverse((o) => {
      const path = String(o?.userData?.path || '').trim();
      if (!path || schemeEntriesByPath[path]) return;
      const raw = o.userData?.jointSchemes || o.config?.jointSchemes;
      if (!Array.isArray(raw) || !raw.length) return;
      schemeEntriesByPath[path] = raw.map((j) => _enrichJointEntryFromLs(j));
      if (!_jointSchemesStore[path]) _jointSchemesStore[path] = schemeEntriesByPath[path];
    });
  }

  for (const [nodePath, schemes] of Object.entries(schemeEntriesByPath)) {
    // Базис: 3D-фурнитура и сверление из одной станции на стыке (не старый baked pos).
    try {
      if (Array.isArray(schemes) && schemes.length) {
        _rebuildJointSchemeModelsOnPanel(String(nodePath).trim());
      }
    } catch (_) {}
    const panel = resolvePanel(nodePath);
    if (panel && typeof panel.updateWorldMatrix === 'function') panel.updateWorldMatrix(true, true);
    const bbox = _jointPanelBBox(panel);
    if (!bbox) continue;
    // Отверстия — дети own_object панелей (ездят с аниматором ящика), не мир ленты.
    for (const entry of schemes) {
      const hasScheme = entry && Number(entry.schemeId) > 0;
      const hasIdx = Number.isFinite(Number(entry.jointIdx));
      const hasContact = !!(entry?.contactId || entry?.neighborName);
      if (hasScheme && (hasIdx || hasContact)) {
        const installed = _panelHasInstalledJointHardware(panel, entry);
        _addJointHolePreviews(_jointVizGroup, bbox, entry, panel, {
          templateStyle: installed || !hasActive,
          activePlacement: !!hasActive && !installed,
          panelPath: nodePath,
          localToPanel: true,
        });
      }
    }
  }

  if (_jointActiveInfo?.nodePath != null) {
    const panel = resolvePanel(_jointActiveInfo.nodePath);
    if (panel && typeof panel.updateWorldMatrix === 'function') panel.updateWorldMatrix(true, true);
    if (panel) {
      const contacts = detectToretsAgainstPlast(panel, rootGroup, { mmPerWorldUnit: UNITS_MM });
      const groups = buildToretsPlastGroups(contacts);
      let activeKey = String(
        _jointActiveInfo.activeGroupKey || _jointActiveInfo.activeAxis || '',
      ).toLowerCase();
      if (!activeKey && groups.length) activeKey = String(groups[0].key || '');
      // Активная группа — строго по contactIds (не по «всем vertical»).
      let activeGroup = groups.find((g) => String(g.key).toLowerCase() === activeKey) || null;
      if (!activeGroup && groups.length) activeGroup = groups[0];
      const activeIds = new Set((activeGroup?.contactIds || []).map(String));
      const COLOR_ACTIVE = 0xd946ef; // выбранные — фиолетовые
      const COLOR_IDLE = 0x22c55e; // не выбранные — зелёные (как на фасаде)
      try {
        if (pp?.helpers?.axes_helper) pp.helpers.axes_helper.visible = false;
        rootGroup?.traverse?.((ch) => {
          if (typeof ch._hide_helpers_edges === 'function') ch._hide_helpers_edges();
        });
      } catch (_) {}
      console.log('[CLD-TORET-PLAST]', {
        panel: panel?.config?.name || panel?.name,
        count: contacts.length,
        activeKey: activeGroup?.key || activeKey,
        activeNeighbors: (activeGroup?.contacts || []).map((c) => c.neighborName),
        groups: groups.map((g) => ({
          key: g.key,
          count: g.count,
          name: g.name,
          neighbors: (g.contacts || []).map((c) => c.neighborName),
        })),
        contacts: contacts.map((c) => ({
          id: c.id,
          pair: c.pair,
          hostFace: c.hostFaceType,
          neighbor: c.neighborName,
          conditionKey: contactConditionKey(c),
          gapMm: Number(c.gapMm.toFixed(2)),
          seamMm: Math.round(c.seamOverlapMm),
          edgeMm: Math.round(c.edgeOverlapMm),
        })),
      });
      // Все стыки видны: выбранные фиолетовые, остальные зелёные.
      let drawn = 0;
      for (const c of contacts) {
        const isActive = activeIds.has(String(c.id));
        const color = isActive ? COLOR_ACTIVE : COLOR_IDLE;
        if (addToretsPlastDebugRibbon(_jointVizGroup, c, UNITS_MM, color, { active: isActive })) {
          drawn += 1;
        }
      }
      if (!drawn) {
        console.warn('[CLD-TORET-PLAST] нет пятен', {
          activeKey: activeGroup?.key,
          total: contacts.length,
        });
      }
    }
  }
  _applyTransparentJointVizDepth();
  _applySelectedJointHardwareHighlight();
  try {
    _reapplyJointSchemeHardwareOnTop();
  } catch (_) {}
}

/** Снять магента-подсветку с крепежа (выбор в дереве). */
function _clearSelectedJointHardwareHighlight() {
  if (!rootGroup || typeof rootGroup.traverse !== 'function') return;
  rootGroup.traverse((o) => {
    if (!o?.isMesh || !o.userData?.__jointSelHighlight) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((mat) => {
      if (!mat?.userData) return;
      if (mat.userData.__selEmissiveSaved && mat.emissive) {
        mat.emissive.copy(mat.userData.__selEmissiveSaved);
      }
      if (
        mat.userData.__selEmissiveIntensity != null &&
        typeof mat.emissiveIntensity === 'number'
      ) {
        mat.emissiveIntensity = mat.userData.__selEmissiveIntensity;
      }
      if (mat.userData.__selColorSaved && mat.color) {
        mat.color.copy(mat.userData.__selColorSaved);
      }
      delete mat.userData.__selEmissiveSaved;
      delete mat.userData.__selEmissiveIntensity;
      delete mat.userData.__selColorSaved;
      mat.needsUpdate = true;
    });
    delete o.userData.__jointSelHighlight;
  });
}

/** Подсветить 3D-крепёж выбранной строки «Крепёж» / furniture (как магента в БМ). */
function _applySelectedJointHardwareHighlight() {
  _clearSelectedJointHardwareHighlight();
  if (!_jointSelected?.nodePath || !rootGroup) return;
  const tryPath = (p) => {
    if (p == null || p === '') return null;
    return window.CLDDBG?.engine?.getNodeByPath(String(p).trim()) || null;
  };
  let panel = tryPath(_jointSelected.nodePath);
  if (!panel) {
    const s = String(_jointSelected.nodePath).trim();
    if (s.startsWith('0,')) panel = tryPath(s.slice(2));
    else panel = tryPath(`0,${s}`);
  }
  if (!panel) return;
  const selCid = _jointSelected.contactId != null ? String(_jointSelected.contactId) : '';
  const selJ = Number(_jointSelected.jointIdx);
  const selSid = Number(_jointSelected.schemeId) || 0;
  const selFrame = Number(_jointSelected.frameIndex);
  let firstOwn = null;
  const tintMesh = (mesh) => {
    if (!mesh?.isMesh || !mesh.material) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((mat) => {
      if (!mat) return;
      if (!mat.userData) mat.userData = {};
      if (mat.emissive) {
        if (!mat.userData.__selEmissiveSaved) mat.userData.__selEmissiveSaved = mat.emissive.clone();
        if (typeof mat.emissiveIntensity === 'number' && mat.userData.__selEmissiveIntensity == null) {
          mat.userData.__selEmissiveIntensity = mat.emissiveIntensity;
        }
        mat.emissive.setHex(0xc026d3);
        if (typeof mat.emissiveIntensity === 'number') mat.emissiveIntensity = Math.max(mat.emissiveIntensity, 0.65);
      } else if (mat.color) {
        if (!mat.userData.__selColorSaved) mat.userData.__selColorSaved = mat.color.clone();
        mat.color.setHex(0xe879f9);
      }
      mat.needsUpdate = true;
    });
    mesh.userData.__jointSelHighlight = 1;
    mesh.renderOrder = Math.max(Number(mesh.renderOrder) || 0, 45);
  };
  const visit = (node) => {
    if (!node || node === panel) return;
    const cfg = node.config || node.userData?.params || {};
    if (!cfg.fromJointScheme) return;
    let ok = false;
    if (selCid) {
      ok = cfg.contactId != null && String(cfg.contactId) === selCid;
    } else if (Number.isFinite(selJ) && cfg.jointIdx != null && Number(cfg.jointIdx) === selJ) {
      if (selSid > 0 && Number(cfg.schemeId) > 0 && Number(cfg.schemeId) !== selSid) ok = false;
      else ok = true;
    }
    if (ok && Number.isFinite(selFrame)) {
      const fi = cfg.frameIndex != null ? Number(cfg.frameIndex) : NaN;
      if (Number.isFinite(fi) && fi !== selFrame) ok = false;
    }
    if (!ok) return;
    const own = node.userData?.own_object;
    if (own) {
      if (!firstOwn) firstOwn = own;
      own.traverse((o) => {
        if (o.isMesh) tintMesh(o);
      });
    }
  };
  _walkCabinetChildNodes(panel, visit);
  if (firstOwn && pp?.helpers?.axes_helper) {
    try {
      firstOwn.updateMatrixWorld(true);
      const wp = new THREE.Vector3();
      firstOwn.getWorldPosition(wp);
      pp.helpers.axes_helper.position.copy(wp);
      pp.helpers.axes_helper.visible = true;
      pp.helpers.axes_helper.updateMatrixWorld(true);
    } catch (_) {}
  }
}

/** В режиме прозрачности БМ отверстия стыков читаются поверх почти невидимых панелей. */
function _applyTransparentJointVizDepth() {
  if (!window.transparentOutlineMode) return;
  const visit = (root) => {
    if (!root || typeof root.traverse !== 'function') return;
    root.traverse((o) => {
      if (!o.isMesh && !o.isLineSegments && !o.isLine && !o.isLineLoop) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((mat) => {
        if (!mat) return;
        mat.depthTest = true;
        mat.depthWrite = false;
        // Не уплотняем контуры — оставляем мягкую opacity из _addJointHolePreviews.
        mat.needsUpdate = true;
      });
      o.renderOrder = Math.max(Number(o.renderOrder) || 0, 28);
    });
  };
  visit(_jointVizGroup);
  for (const g of _jointPanelVizList) visit(g);
}

function rebuild() {
  // Подложка под секцией (отключена по просьбе пользователя)
  if (SHOW_FLOOR_UNDERLAY) {
    // no-op: left for future toggle
  }

  // Wait for furniture catalog before building tree (holes depend on it)
  if (!__cldFurnitureCatalogMap) {
    __ensureFurnitureCatalog().then(() => rebuild());
    return;
  }

  __cldClearJointLiveCaches();

  disposeDimsGroup();
  disposeHingeMarkersGroup();
  if (rootGroup) {
    scene.remove(rootGroup);
    disposeObject(rootGroup);
    rootGroup = null;
  }
  setJointCarcassContext(null);
  _cldIframeDoorSwingGroups.length = 0;
  _cldIframeSlideGroups.length = 0;

  if (showModule) {
    rootGroup = createModuleRoot(state);
    rootGroup.position.set(0, 0, 0);
    scene.add(rootGroup);
    setJointCarcassContext(new THREE.Box3().setFromObject(rootGroup));
    applyEdgesModeVisibility(rootGroup, edgesMode, null, null);
    // Референс: helpers_edges не в сцене при создании — сбрасываем на всякий случай
    hide_helpers_all();

    // Референс: после rebuild применяем последний выбранный helper и selectNode если он был.
    // Размерные линии вешаем после selectNode — иначе подписи берут state (каталог W×H×D), а не выбранную деталь.
    if (lastSelectedPath) {
      setTimeout(() => {
        // Реф 9.1.152: path "0" не выбирает root-объект в iframe.
        // В дереве root остаётся выбранным, но в 3D это эквивалентно "общему" состоянию без root-helper.
        const node = lastSelectedPath === '0' ? null : window.CLDDBG?.engine?.getNodeByPath(lastSelectedPath);
        _lastSelectionSource = 'rebuild';
        selectNode(node, lastSelectedNodeType);
      }, 0);
    } else {
      _dimsAnchorPath = null;
      if (showDims) mountDimensionsGroup();
    }
  } else {
    // Референс: если модуль скрыт - скрываем helper, но НЕ сбрасываем lastSelectedPath
    pp.helpers.axes_helper.visible = false;
    if (showDims) mountDimensionsGroup();
  }

  if (_m3PreviewRoot) {
    _refitM3PreviewInner();
  }

  // Не сбрасываем ракурс при каждом изменении: авто-fit только при первом build.
  // Возврат в дефолтный ракурс делается вручную через resetCameraToDefault (иконка "домик").
  if (!__cameraWasAutoFitted) {
    applySinglePreviewCameraLikeReference();
    __cameraWasAutoFitted = true;
  }
  // После rebuild — восстанавливаем режим контуров (если был активен) и маркеры стыков
  if (__cldHingeRolePreview) {
    __cldApplyHingeRolePreviewSceneStyle();
  } else if (window.outlineMode || window.transparentOutlineMode) {
    updateOutlineModes();
  }
  _hydrateJointSchemesStoreFromTemplateTree();
  _cldApplyPreviewDoorsOpenToSwings();
  _finalizeDrawerSlideAssembliesForPreview();
  try {
    _renderJointMarkers();
  } catch (e) {
    console.warn('[CLD-JOINT] _renderJointMarkers failed', e);
  }
  // Цветной вид: updateOutlineModes не вызывался — всё равно поднять 3D-крепёж поверх ЛДСП.
  try {
    _reapplyJointSchemeHardwareOnTop();
  } catch (_) {}
  if (__hingeMarkersEnabled) mountHingeMarkersGroup();
  _cldApplyPreviewDrawerNoHandleStampToRoot();
  _cldSchedulePreviewDrawerHandles();
  render();
}

function setSize(wMm, hMm, dMm) {
  const prev = state || { w: 0, h: 0, d: 0 };
  state = { w: mm(wMm), h: mm(hMm), d: mm(dMm) };
  // При изменении габаритов превью снова делаем авто-fit камеры.
  // Раньше в embedded пропускали сброс флага — тогда батч cld:setTemplateTree+sizeMm (без отдельного setSize)
  // оставлял камеру от «первого маленького» кадра, и высокий шкаф обрезался.
  if (prev.w !== state.w || prev.h !== state.h || prev.d !== state.d) {
    __cameraWasAutoFitted = false;
  }
  rebuild();
}

function toggleDims(on) {
  showDims = !!on;
  rebuild();
}

function toggleModule(on) {
  const wasOn = showModule;
  showModule = !!on;
  // Референс: если модуль выключается - скрываем helper, но НЕ сбрасываем lastSelectedPath
  // чтобы при включении снова применить его
  if (!showModule && wasOn) {
    pp.helpers.axes_helper.visible = false;
  }
  rebuild();
}

// Функция show_helpers точно (:4028-4043)
// Референс: показываем helper только если объект существует в сцене
function showAxesHelper(path) {
  // Референс: запоминаем path для применения после rebuild
  lastSelectedPath = path;
  
  // Референс: если rootGroup не существует - просто запоминаем path, не показываем
  if (!rootGroup) return;
  
  _applyAxesHelper(path);
}

// Внутренняя функция применения helper (вызывается после rebuild если есть lastSelectedPath)
function _applyAxesHelper(path) {
  if (!rootGroup || !path) return;
  // Режим крепежа стыков: только пятна торец↔пласть, без RGB-осей.
  if (_jointActiveInfo?.nodePath != null) {
    pp.helpers.axes_helper.visible = false;
    return;
  }

  const a5 = window.CLDDBG.engine.getNodeByPath(path);
  if (!a5) {
    pp.helpers.axes_helper.visible = false;
    return;
  }

  // еренс: точно как в:4033
  a5.updateMatrixWorld(true);
  const wp = a5.getWorldPosition(new THREE.Vector3());
  pp.helpers.axes_helper.position.copy(wp);
  pp.helpers.axes_helper.visible = true;
  pp.helpers.axes_helper.updateMatrixWorld(true);
}

// Функция hide_helpers точно (:4026)
function hide_helpers() {
  pp.helpers.axes_helper.visible = false;
  lastSelectedPath = null; // Референс: сбрасываем сохранённый path
  _dimsAnchorPath = null;
  if (showDims && rootGroup) mountDimensionsGroup();
}

// ===== Управление видимостью как в референсе (helpers_visible, hide/show_helpers) =====
function hide_helpers_all() {
  if (!rootGroup) return;
  rootGroup.traverse(child => {
    if (child._hide_helpers) child._hide_helpers();
    if (child._hide_helpers_edges) child._hide_helpers_edges();
  });
  pp.helpers.axes_helper.visible = false;
}

function show_helpers_for_node(node, nodeType) {
  if (!node || !node._show_helpers) return;
  node._show_helpers();
  node.updateMatrixWorld(true);
  const wp = node.getWorldPosition(new THREE.Vector3());
  pp.helpers.axes_helper.position.copy(wp);
  pp.helpers.axes_helper.visible = true;
  pp.helpers.axes_helper.updateMatrixWorld(true);
}

function selectNode(node, nodeType) {
  if (!rootGroup) return;
  const nodeCfgType = String(node?.config?.type || node?.userData?.params?.type || '').toLowerCase();
  const isDrillNode = nodeCfgType === 'furniture' || nodeCfgType === 'hole';
  __cldSelLog({
    step: 'selectNode',
    nodeTypeArg: nodeType,
    nodeCfgType,
    isDrillNode,
    lastSelectionSource: _lastSelectionSource,
    ctor: node?.constructor?.name,
  });
  if (isDrillNode && _lastSelectionSource !== 'tree') {
    __cldSelLog({ step: 'selectNode early-return', reason: 'drill non-tree' });
    hide_helpers_all();
    _dimsAnchorPath = null;
    if (showDims) mountDimensionsGroup();
    render();
    return;
  }

  if (node && node.userData && node.userData.path != null && node.userData.path !== '') {
    _dimsAnchorPath = String(node.userData.path);
  } else {
    _dimsAnchorPath = null;
  }

  applyEdgesModeVisibility(rootGroup, edgesMode, node, nodeType);
  hide_helpers_all();

  const showEdges = edgesMode && nodeType === 'detail' && node?._show_helpers_edges;
  if (showEdges) {
    camera.layers.enable(EDGE_LABELS_LAYER);
    node._show_helpers_edges();
  } else {
    camera.layers.disable(EDGE_LABELS_LAYER);
  }

  const allowRootSectionHelpers =
    __cldEmbeddedPreview &&
    node?.userData?.is_root &&
    String(node?.config?.type || '').toLowerCase() === 'section';
  if (node && (!node.userData?.is_root || allowRootSectionHelpers) && node._show_helpers) {
    const hv = node.config?.helpers_visible;
    const jointHw =
      Number(node.config?.spec?.joint_hardware) === 1 ||
      !!node.config?.fromJointScheme;
    // furniture/hole: helpers_visible:0 = без зелёного куба контейнера, но hole-кубы+стрелки
    // при выборе в дереве обязательны (реф CabinetFurniture.show_helpers → CabinetHole).
    const isFurniOrHole = nodeCfgType === 'furniture' || nodeCfgType === 'hole';
    if (isFurniOrHole && !jointHw) {
      show_helpers_for_node(node, nodeCfgType === 'furniture' ? 'furniture' : nodeType);
      __cldSelLog({
        step: 'selectNode furniture/hole helpers (ignore helpers_visible=0)',
        ctor: node.constructor?.name,
        cfgType: nodeCfgType,
        helpers_visible: hv,
        holeKids: (node.userData?.cabinet_child_nodes || []).filter(
          (c) => c && String(c.config?.type || '').toLowerCase() === 'hole'
        ).length,
      });
    } else if (hv === 0 || hv === '0' || jointHw) {
      // Реф: зелёный volume не показываем (helpers_visible:0).
      // Оси — да: иначе узел 7×50 мм в толще панели не найти (видны только подписи мм).
      if (jointHw && node) {
        try {
          node.updateMatrixWorld(true);
          const wp = node.getWorldPosition(new THREE.Vector3());
          pp.helpers.axes_helper.position.copy(wp);
          pp.helpers.axes_helper.visible = true;
          pp.helpers.axes_helper.updateMatrixWorld(true);
          // Подсветка GLB поверх панели при выборе (узел model или furniture→дети)
          const own = node.userData?.own_object;
          if (own) __cldMarkJointHardwareMeshesOnTop(own);
          const kids = node.userData?.cabinet_child_nodes || [];
          for (const ch of kids) {
            if (ch?.userData?.own_object) __cldMarkJointHardwareMeshesOnTop(ch.userData.own_object);
          }
        } catch (_) {}
        __cldSelLog({ step: 'selectNode joint hardware: axes only (no volume)' });
      } else {
        __cldSelLog({ step: 'selectNode skip helpers (helpers_visible=0 / joint hardware)' });
      }
    } else {
      show_helpers_for_node(node, nodeType);
      __cldSelLog({
        step: 'selectNode after show_helpers_for_node',
        ctor: node.constructor?.name,
        cfgType: node.config?.type,
        helpersGroupVisible: node.userData?.helpers?.visible,
        arrowVisible: node.userData?.arrow?.visible,
      });
    }
  } else {
    camera.layers.disable(EDGE_LABELS_LAYER);
    __cldSelLog({
      step: 'selectNode skip show_helpers',
      reason: !node ? 'no node' : node.userData?.is_root ? 'is_root' : '!_show_helpers',
    });
  }
  
  if (showDims) mountDimensionsGroup();
  _renderJointMarkers();
  try {
    _reapplyJointSchemeHardwareOnTop();
  } catch (_) {}
  render();
}

// Экспортируем selectNode в глобальную область для доступа из admin-new.html
window.selectNode = selectNode;

window.CLDDBG = {
  setEdgesMode(on) {
    edgesMode = !!on;
    if (rootGroup) {
      const n = lastSelectedPath && lastSelectedPath !== '0' ? this.engine?.getNodeByPath(lastSelectedPath) : null;
      selectNode(n, lastSelectedNodeType);
    }
  },
  status() {
    return {
      sizeMm: { ...state },
      hasRoot: !!rootGroup,
      hasDims: !!dimsGroup,
      sceneChildren: scene.children.map((o) => o.name || o.type),
    };
  },
  fitLikeReference() {
    applySinglePreviewCameraLikeReference();
    render();
  },
  ref: { unitsMm: UNITS_MM, fitPadding: FIT_PADDING },
  // API-хуки под будущие модалки/вкладку "Конструктор"
  engine: {
    getRoot() {
      return rootGroup || null;
    },
    getVars() {
      return rootGroup?.userData?.vars ? { ...rootGroup.userData.vars } : {};
    },
    setVar(key, valueMm) {
      if (!rootGroup) return;
      rootGroup.userData.vars = rootGroup.userData.vars || {};
      rootGroup.userData.vars[String(key)] = Number(valueMm) || 0;
      rebuild();
    },
    getNodeByPath(path) {
      if (!rootGroup) {
        __cldSelLog({ step: 'getNodeByPath', err: 'no rootGroup' });
        return null;
      }
      const p = String(path);
      const pb = rootGroup.userData?.parts_by_path || {};
      for (const type of Object.keys(pb)) {
        const hit = pb[type]?.[p];
        if (hit) {
          __cldSelLog({
            step: 'getNodeByPath',
            via: 'parts_by_path',
            path: p,
            bucket: type,
            ctor: hit.constructor?.name,
            cfgType: hit.config?.type,
          });
          return hit;
        }
      }
      // Fallback: узел мог не попасть в parts_by_path (рассинхрон индексов DOM/дерева) —
      // ищем по userData.path на всех CabinetNode (как в рефе get_child_by_path).
      let found = null;
      rootGroup.traverse((obj) => {
        if (found) return;
        const op = obj.userData && obj.userData.path != null ? String(obj.userData.path) : '';
        if (op === p && obj.config && typeof obj.config.type === 'string') {
          found = obj;
        }
      });
      __cldSelLog({
        step: 'getNodeByPath',
        via: found ? 'traverse-fallback' : 'MISS',
        path: p,
        ctor: found?.constructor?.name,
        cfgType: found?.config?.type,
      });
      return found;
    },
    show_helpers(path) {
      showAxesHelper(path);
    },
    hide_helpers() {
      hide_helpers();
    },
    // Добавление ребёнка в template.tree по path родителя (для конструктора).
    // Сейчас работает только для root template.tree (как в референсе в модуле).
    addChild(parentPath, childParams) {
      if (!rootGroup) return false;
      const pp = String(parentPath || '0');
      if (pp !== '0') return false;
      const cfg = rootGroup.config;
      const tree = ensureTemplateStructureOnConfig(cfg);
      if (!Array.isArray(tree)) return false;
      tree.push(childParams);
      rebuild();
      return true;
    },
    setTemplateTree(tree) {
      // Позволяем задавать дерево даже когда модуль скрыт (showModule=false).
      moduleTemplateTree = Array.isArray(tree) ? tree : [];
      rebuild();
      return true;
    },
  },
  setSize(w, h, d) {
    setSize(w, h, d);
  },
  toggleDims(on) {
    toggleDims(on);
  },
  toggleModule(on) {
    showModule = !!on;
    rebuild();
  },
  rebuild() {
    rebuild();
  },
};

window.addEventListener('message', (ev) => {
  const data = ev && ev.data;
  if (!data || typeof data !== 'object') return;
  
  // Референс: логируем только важные сообщения
  if (data.type === 'cld:setSize' && data.sizeMm) {
    const s = data.sizeMm;
    setSize(Number(s.w), Number(s.h), Number(s.d));
  } else if (data.type === 'cld:setDebug' && data.flags && typeof data.flags === 'object') {
    // Отладочные флаги из админки (embedded): включаем логи в iframe
    if (typeof data.flags.materials === 'boolean') {
      window.__CLD_DEBUG_MATERIALS = data.flags.materials;
    }
  } else if (data.type === 'cld:toggleDims') {
    toggleDims(!!data.on);
  } else if (data.type === 'cld:toggleModule') {
    toggleModule(!!data.on);
  } else if (data.type === 'cld:setHingeRoleMarkers') {
    // Из админки «Петли по ролям»: показать/скрыть размерные метки реальных позиций петель.
    setHingeMarkersEnabled(!!data.on, data.axis, data.measure);
  } else if (data.type === 'cld:setDrawerPreviewNoHandle') {
    __cldPreviewDrawerNoHandle = _cldTruthyDrawerNoHandle(data.drawerNoHandle);
    if (typeof globalThis.__cldBumpDrawerHandleAttachGeneration === 'function') {
      globalThis.__cldBumpDrawerHandleAttachGeneration();
    }
    if (__cldPreviewDrawerNoHandle) {
      _cldApplyPreviewDrawerNoHandleStampToRoot();
      _cldSchedulePreviewDrawerHandles();
    } else {
      _cldSchedulePreviewDrawerHandles();
    }
    render();
  } else if (data.type === 'cld:setTemplateTree') {
    if (__cldEmbeddedPreview) {
      _cldExitCatalogIconPreview();
    }
    const prevW = state.w;
    const prevH = state.h;
    const prevD = state.d;
    const prevTreeEmpty =
      !Array.isArray(moduleTemplateTree) || moduleTemplateTree.length === 0;
    const nextPlacementKind =
      String(data.placementKind || '').trim() || 'floor_in_niche';
    const placementKindChanged = nextPlacementKind !== __cldPreviewPlacementKind;
    __cldPreviewPlacementKind = nextPlacementKind;
    __cldPreviewSuppressFillExpand = data.suppressFillExpand === true;
    __cldPreviewDrawerNoHandle = _cldTruthyDrawerNoHandle(data.drawerNoHandle);
    __cldPreviewEditingCatalogType = String(data.previewCatalogType || '').trim();
    __cldPreviewEditingCatalogItemId = String(data.previewCatalogItemId || '').trim();
    __cldHingeRolePreview = data.hingeRolePreview === true;
    __cldHingeRoleVirtualSide = data.hingeRoleVirtualSide === true;
    __cldApplyHingeRolePreviewSceneStyle();
    if (typeof globalThis.__cldBumpDrawerHandleAttachGeneration === 'function') {
      globalThis.__cldBumpDrawerHandleAttachGeneration();
    }
    if (__cldPreviewDrawerNoHandle && rootGroup) {
      _cldApplyPreviewDrawerNoHandleStampToRoot();
    }
    // Совместимость: массив (clodisJSON) или объект (legacy template.structure / spec.template.tree)
    let incoming = Array.isArray(data.structure) ? data.structure : (Array.isArray(data.tree) ? data.tree : null);
    if (incoming == null && data.structure && typeof data.structure === 'object') {
      const arr = data.structure.template?.structure ?? data.structure.spec?.template?.tree;
      if (Array.isArray(arr)) incoming = arr;
    }
    // Размер может прийти вместе с деревом (батч из админки) — применяем до rebuild,
    // чтобы не запускать отдельный setSize/rebuild циклом выше.
    let sizeMmChanged = false;
    if (data.sizeMm && typeof data.sizeMm === 'object') {
      const sw = Number(data.sizeMm.w);
      const sh = Number(data.sizeMm.h);
      const sd = Number(data.sizeMm.d);
      if (Number.isFinite(sw) && Number.isFinite(sh) && Number.isFinite(sd)) {
        const nw = mm(sw);
        const nh = mm(sh);
        const nd = mm(sd);
        sizeMmChanged = nw !== prevW || nh !== prevH || nd !== prevD;
        state = { w: nw, h: nh, d: nd };
      }
    }
    moduleTemplateTree = Array.isArray(incoming) ? __cldDedupTemplateTree(incoming) : [];
    try {
      if (typeof globalThis.__cldStampDrawerNoHandleFlagsInTree === 'function') {
        globalThis.__cldStampDrawerNoHandleFlagsInTree(moduleTemplateTree);
      }
    } catch (_) {}
    const nextTreeEmpty = moduleTemplateTree.length === 0;
    // Авто-fit только при смене габаритов / пусто↔дерево / placement — не на каждый setTemplateTree
    // (иначе клик в дереве → save → push tree → камера «в дом»).
    if (sizeMmChanged || prevTreeEmpty !== nextTreeEmpty || placementKindChanged) {
      __cameraWasAutoFitted = false;
    }
    __cldLastTemplateTreeSyncTs = Date.now();
    __cldValidateRefHingeTree(moduleTemplateTree);
    // Превью-only: петли по Y по ролям facades_main/_top (X/Z из template не трогаем).
    // «Петли по ролям» уже разложили модули в admin — не перераскладывать и не strip.
    try {
      const gen = typeof window !== 'undefined' ? window.__cldHingeLayout : null;
      if (
        !__cldHingeRolePreview &&
        gen &&
        typeof gen.applyFacadeRoleHingeYInPreviewTree === 'function' &&
        Array.isArray(moduleTemplateTree) &&
        moduleTemplateTree.length > 0
      ) {
        const varsForHinge = { ...(incomingVars || {}) };
        const placementKind =
          String(data.placementKind || '').trim() || 'floor_in_niche';
        const productKindHint =
          typeof window.__cldHingeLayout?.placementKindToProductKind === 'function'
            ? window.__cldHingeLayout.placementKindToProductKind(placementKind)
            : 'wardrobe';
        // Шкаф: дефолт h_bottom=100. Навес/тумба — 0, иначе фасад «висит» и петли не как в ролях.
        if (!Number.isFinite(Number(varsForHinge.h_bottom))) {
          varsForHinge.h_bottom = productKindHint === 'wardrobe' ? 100 : 0;
        }
        if (!Number.isFinite(Number(varsForHinge.h_top))) varsForHinge.h_top = 0;
        if (!Number.isFinite(Number(varsForHinge.tech_zone_mm))) varsForHinge.tech_zone_mm = 0;
        if (!Number.isFinite(Number(varsForHinge.facade_thickness_mm))) varsForHinge.facade_thickness_mm = 16;
        const res = gen.applyFacadeRoleHingeYInPreviewTree(moduleTemplateTree, {
          widthMm: state.w,
          heightMm: state.h,
          depthMm: state.d,
          vars: varsForHinge,
          placementKind,
          productKind: productKindHint,
          tree: moduleTemplateTree,
          wallThicknessMm:
            Number(varsForHinge._wt) ||
            Number(incomingMaterials?.g0?.thickness) ||
            Number(varsForHinge.facade_thickness_mm) ||
            16,
        });
        // Одна цепочка с «Петли по ролям»: модули оставляем (Y/X шва уже в дереве).
        if (window.__CLD_DEBUG_HINGE_ROLE || (res && (res.applied > 0 || res.skipped > 0))) {
          console.warn('[CLD][preview-hinge-role-Y] applied', res);
        }
      } else if (__cldHingeRolePreview) {
        console.warn('[CLD][preview] hingeRolePreview: keep catalog hinge modules (no strip/re-Y)');
      }
    } catch (e) {
      console.error('[CLD][preview-hinge-role-Y] error', e);
    }
    if (Array.isArray(moduleTemplateTree) && moduleTemplateTree.length > 0) showModule = true;
    else if (Array.isArray(moduleTemplateTree) && moduleTemplateTree.length === 0) showModule = false;
    if (__cldIsPreviewVerbose()) {
      let accN = 0;
      let urlN = 0;
      let totalNodes = 0;
      const walk = (arr) => {
        if (!Array.isArray(arr)) return;
        for (const n of arr) {
          if (!n) continue;
          totalNodes += 1;
          const ac = n.accessories;
          if (Array.isArray(ac)) {
            accN += ac.length;
            ac.forEach((a) => {
              if (a && (a.modelUrl || a.glbUrl || a.glb || a.model3d || a.modelUrlFacade)) urlN++;
            });
          }
          if (Array.isArray(n.children)) walk(n.children);
        }
      };
      walk(moduleTemplateTree);
      __cldPreviewLog('tree', 'cld:setTemplateTree', {
        roots: moduleTemplateTree.length,
        totalNodes,
        accessoriesTotal: accN,
        accessoriesWithFileUrl: urlN,
      });
    }
    // Не сбрасываем авто-fit при каждом апдейте дерева — ракурс сохраняется (домик = resetCameraToDefault).
    rebuild();
    // Не эхоить clodisJSON обратно в админку после setTemplateTree (цикл → зависание).
    // Явный pull: cld:pullClodisJSON (см. ниже).
  } else if (data.type === 'cld:pullClodisJSON') {
    // Только по запросу админки (requestId). Никогда не слать после setTemplateTree.
    const requestId = data.requestId != null ? String(data.requestId) : '';
    const payload = {
      type: 'cld:clodisJSONReady',
      clodisJSON: Array.isArray(moduleTemplateTree) ? moduleTemplateTree : [],
      requestId,
      pull: true,
    };
    try {
      if (ev.source && typeof ev.source.postMessage === 'function') {
        ev.source.postMessage(payload, '*');
      } else if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
      }
    } catch (_) {}
  } else if (data.type === 'cld:setVars' && data.vars && typeof data.vars === 'object') {
    incomingVars = { ...(data.vars || {}) };
    // Жёсткая гарантия для role-формул секций (plinth/corpus/top):
    // если админка не передала отступы, не даём v:h_bottom / v:h_top стать undefined.
    if (!Number.isFinite(Number(incomingVars.h_bottom))) incomingVars.h_bottom = 100;
    if (!Number.isFinite(Number(incomingVars.h_top))) incomingVars.h_top = 0;
    if (!Number.isFinite(Number(incomingVars.facade_thickness_mm))) incomingVars.facade_thickness_mm = 16;
    // В clean-room превью выражения v:* вычисляются через window.clodis.variables.global_vars.
    // Поэтому синхронизируем пришедшие из админки переменные в vars_hash, чтобы v:h_top работал.
    try {
      const idx = window?.clodis?.variables?.selected_index;
      const gvars = window?.clodis?.variables?.global_vars;
      if (typeof idx === 'number' && Array.isArray(gvars) && gvars[idx]) {
        const varSet = gvars[idx];
        if (!varSet.vars_hash) varSet.vars_hash = {};
        for (const [k, v] of Object.entries(incomingVars || {})) {
          const key = String(k);
          const num = Number(v);
          if (!Number.isFinite(num)) continue;
          // В getGlobalVar/expr ожидается структура { value: <number> }.
          varSet.vars_hash[key] = { key, value: num };
        }
      }
    } catch (_) {}

    // Важно: g:g0.thickness вычисляется через clodis.libs.materials_groups.g0.thickness.
    // Админка часто пробрасывает толщину как vars._wt, поэтому синхронизируем и сюда.
    try {
      const incomingTh = Number(incomingVars?._wt);
      if (Number.isFinite(incomingTh) && incomingTh > 0) {
        const libs = window?.clodis?.libs || window?.pp?.libs;
        if (libs) {
          libs.materials_groups = libs.materials_groups || {};
          libs.materials_groups.g0 = libs.materials_groups.g0 || { name: 'g0', material: null, default: false };
          libs.materials_groups.g0.thickness = incomingTh;
        }
      }
    } catch (_) {}

    __cldMarkEnvChangedForRebuild();
  } else if (data.type === 'cld:setMaterials' && data.materials && typeof data.materials === 'object') {
    incomingMaterials = { ...(data.materials || {}) };
    try {
      __cldModelKeyMaterialByIdCache.clear();
    } catch (_) {}
    // models3d editor sends current params.meshes together with setMaterials.
    // Without syncing this map, iframe keeps stale mesh->material bindings from the first load.
    if (data.modelParams && typeof data.modelParams === 'object') {
      _m3LastModelParams = data.modelParams;
    }
    if (window.__CLD_DEBUG_MATERIALS) {
      console.log('[CLD][materials] received from admin:', Object.keys(incomingMaterials));
    }
    // Важно: выражения вида g:g0.thickness вычисляются через getMaterialGroup(),
    // а он читает толщину из window.clodis.libs.materials_groups.
    // Поэтому синхронизируем incomingMaterials туда, чтобы g:g0.thickness не становился 0.
    try {
      const libs = window?.clodis?.libs || window?.pp?.libs;
      if (libs && typeof libs === 'object') {
        libs.materials_groups = libs.materials_groups || {};
        for (const [groupKey, groupVal] of Object.entries(incomingMaterials || {})) {
          const th = Number(groupVal?.thickness);
          if (!Number.isFinite(th)) continue;
          libs.materials_groups[groupKey] = libs.materials_groups[groupKey] || { name: '', material: null, default: false };
          libs.materials_groups[groupKey].thickness = th;
        }
      }
    } catch (_) {}
    if (window.__CLD_DEBUG) console.log('[CLD][thickness] cld:setMaterials', { g0: incomingMaterials?.g0?.thickness });
    _applyM3PreviewMaterialsNow().catch(() => {});
    if (__CLD_CONTEXT === 'models3d') {
      // В редакторе 3D-модели применяем материал напрямую к текущему preview-root без rebuild:
      // rebuild пересобирает сцену и может визуально откатывать только что назначенные материалы.
      render();
    } else {
      __cldMarkEnvChangedForRebuild();
    }
  } else if (data.type === 'cld:setCabinetModelLibrary' && data.items && typeof data.items === 'object') {
    // Родитель может передать { [id]: { params } } без fetch (как models3d_lib в рефе).
    __setCabinetModelLibraryInjected(data.items);
    __cldMarkEnvChangedForRebuild();
  } else if (data.type === 'cld:showHelpers' && data.path) {
    lastSelectedPath = String(data.path);
    if (rootGroup && window.selectNode) {
      const path = String(data.path);
      const node = path === '0' ? null : window.CLDDBG?.engine?.getNodeByPath(path);
      const kids = node?.userData?.cabinet_child_nodes;
      const holeN = Array.isArray(kids) ? kids.filter((c) => c && String(c.config?.type || '').toLowerCase() === 'hole').length : 0;
      const sceneType = String(node?.config?.type || '').toLowerCase();
      const hasHoles = holeN > 0;
      const pick =
        (node && node._show_helpers_edges ? 'detail' : null) ||
        (hasHoles && sceneType === 'furniture' ? 'furniture' : null) ||
        sceneType || data.nodeType || 'section';
      lastSelectedNodeType = pick;
      _lastSelectionSource = 'tree';
      __cldSelLog({
        step: 'cld:showHelpers resolved',
        path,
        sceneType,
        hasHoles,
        pick,
      });
      window.selectNode(node, pick);
    } else {
      showAxesHelper(String(data.path));
    }
  } else if (data.type === 'cld:hideHelpers') {
    // Референс: скрытие axes_helper точно как в референсе
    hide_helpers();
  } else if (data.type === 'cld:setEdgesMode') {
    edgesMode = !!data.on;
    if (window.selectNode && rootGroup) {
      const node = lastSelectedPath && lastSelectedPath !== '0' ? window.CLDDBG?.engine?.getNodeByPath(lastSelectedPath) : null;
      const nodeType = lastSelectedNodeType;
      window.selectNode(node, nodeType);
    }
  } else if (data.type === 'cld:selectNode' || data.type === 'cld:selectNodeByPath') {
    __cldSelLog({
      step: 'postMessage',
      msgType: data.type,
      path: data.path,
      nodeType: data.nodeType,
      domNodeType: data.domNodeType,
      hasRootGroup: !!rootGroup,
    });
    if (data.path != null) lastSelectedPath = String(data.path);
    if (typeof data.edgesMode === 'boolean') edgesMode = data.edgesMode;
    _lastSelectionSource = 'tree';
    if (window.selectNode && rootGroup) {
      let node = null;
      
      if (data.path && data.path !== '0') {
        node = window.CLDDBG.engine.getNodeByPath(data.path);
        const kids = node?.userData?.cabinet_child_nodes;
        const holeN = Array.isArray(kids) ? kids.filter((c) => c && String(c.config?.type || '').toLowerCase() === 'hole').length : 0;
        __cldSelLog({
          step: 'after resolve path',
          path: data.path,
          found: !!node,
          ctor: node?.constructor?.name,
          cfgType: node?.config?.type,
          nodeTypeFromDom: data.nodeType,
          cabinet_child_nodes: Array.isArray(kids) ? kids.length : 0,
          holeChildren: holeN,
          hasHelpers: !!node?.userData?.helpers,
          hasArrow: !!node?.userData?.arrow,
          helpersVisible: node?.userData?.helpers?.visible,
        });
        if (node) {
          // Дерево админки шлёт nodeType «facade»/«detail», а в JSON/сцене присадка — type: furniture (реф).
          // Для присадки с holes используем 'furniture' чтобы _show_helpers каскадировал на hole children.
          const sceneType = String(node.config?.type || '').toLowerCase();
          const hasHoles = holeN > 0;
          const isCatalogPyramidShell =
            __cldIsCatalogLinkedModuleSpec(node.config?.spec) &&
            ['plinth', 'corpus_antresol', 'top'].includes(
              String(node.config?.layout_role ?? node.config?.sectionLayoutRole ?? '').toLowerCase()
            ) &&
            (sceneType === 'section' || sceneType === 'module');
          const pick =
            (node._show_helpers_edges ? 'detail' : null) ||
            (hasHoles && sceneType === 'furniture' ? 'furniture' : null) ||
            (isCatalogPyramidShell ? 'section' : null) ||
            sceneType ||
            data.nodeType ||
            'section';
          lastSelectedNodeType = pick === 'module' && sceneType === 'section' ? 'section' : pick;
          __cldSelLog({
            step: 'selectNode type pick',
            sceneType: sceneType || '(empty)',
            fromDom: data.nodeType,
            hasHoles,
            pick: lastSelectedNodeType,
            willShowHoles: hasHoles && pick === 'furniture',
          });
          window.selectNode(node, lastSelectedNodeType);
        } else {
          lastSelectedNodeType = data.nodeType || 'section';
          window.selectNode(null);
        }
      } else if (data.path === '0' || data.nodeId === null) {
        lastSelectedNodeType = 'section';
        window.selectNode(null);
      }
    } else {
      __cldSelLog({ step: 'postMessage skip', reason: !window.selectNode ? 'no selectNode' : 'no rootGroup' });
    }
  } else if (data.type === 'cld:setJointSchemes') {
    // Сохраняем схемы крепежа для узла и перерисовываем маркеры + оранжевые рёбра.
    // Если nodePath не передан (null/'') — fallback на lastSelectedPath (как в setActiveJoint).
    let path = data.nodePath;
    if (path == null || path === '') {
      path = (lastSelectedPath && lastSelectedPath !== '0') ? lastSelectedPath : null;
    }
    const schArr = data.jointSchemes;
    const holePts = Array.isArray(schArr)
      ? schArr.reduce((n, e) => n + (Array.isArray(e.positions) ? e.positions.length : 0), 0)
      : 0;
    console.log('[CLD-JOINT][iframe] cld:setJointSchemes', {
      incomingPath: data.nodePath,
      resolvedPath: path,
      lastSelectedPath,
      schemes: schArr?.length ?? 0,
      totalHolePoints: holePts,
      first: schArr?.[0],
    });
    if (path != null) {
      const pkey = String(path).trim();
      if (Array.isArray(data.jointSchemes) && data.jointSchemes.length > 0) {
        // Сливаем в store: несколько деталей могут иметь крепёж одновременно (как после загрузки JSON).
        _jointSchemesStore[pkey] = data.jointSchemes;
      } else {
        delete _jointSchemesStore[pkey];
      }
    } else {
      console.warn('[CLD-JOINT][iframe] path=null — setJointSchemes пропущен (store не очищаем)');
    }
    if (path != null) {
      try {
        const rebuilt = _rebuildJointSchemeModelsOnPanel(String(path).trim());
        if (rebuilt > 0) {
          console.log('[CLD-JOINT][iframe] model facing sync', { path, rebuilt });
        }
      } catch (e) {
        console.warn('[CLD-JOINT][iframe] furniture rot sync failed', e);
      }
    }
    _renderJointMarkers();
    render();
  } else if (data.type === 'cld:computeJointTemplateFrames') {
    const requestId = data.requestId || '';
    let path = data.nodePath;
    if (path == null || path === '') {
      path = (lastSelectedPath && lastSelectedPath !== '0') ? lastSelectedPath : null;
    }
    let frames = [];
    try {
      const panel = path != null
        ? (window.CLDDBG?.engine?.getNodeByPath(String(path).trim()) || null)
        : null;
      const entries = Array.isArray(data.jointSchemes) ? data.jointSchemes : [];
      if (panel && entries.length) {
        frames = _computeJointTemplateLocalFrames(panel, entries);
      }
    } catch (e) {
      console.warn('[CLD-JOINT][iframe] computeJointTemplateFrames failed', e);
      frames = [];
    }
    try {
      if (ev.source && typeof ev.source.postMessage === 'function') {
        ev.source.postMessage({ type: 'cld:jointTemplateFrames', requestId, frames }, '*');
      }
    } catch (_) {}
  } else if (data.type === 'cld:computeJointHardwarePoses') {
    const requestId = data.requestId || '';
    let path = data.nodePath;
    if (path == null || path === '') {
      path = (lastSelectedPath && lastSelectedPath !== '0') ? lastSelectedPath : null;
    }
    let poses = [];
    try {
      const panel = path != null
        ? (window.CLDDBG?.engine?.getNodeByPath(String(path).trim()) || null)
        : null;
      const entries = Array.isArray(data.jointSchemes) ? data.jointSchemes : [];
      const lenMm = Number(data.modelLenMm) > 0 ? Number(data.modelLenMm) : 50;
      const crossMm = Number(data.modelCrossMm) > 0 ? Number(data.modelCrossMm) : 7;
      if (panel && entries.length) {
        poses = _computeJointHardwareLocalPoses(panel, entries, lenMm, crossMm);
      }
      console.log('[CLD-JOINT][iframe] computeJointHardwarePoses v=joint-fix-reload', {
        path,
        requestId,
        entries: entries.length,
        poses: poses.length,
        first: poses[0],
      });
    } catch (e) {
      console.warn('[CLD-JOINT][iframe] computeJointHardwarePoses failed', e);
      poses = [];
    }
    try {
      if (ev.source && typeof ev.source.postMessage === 'function') {
        ev.source.postMessage({ type: 'cld:jointHardwarePoses', requestId, poses }, '*');
      }
    } catch (_) {}
  } else if (data.type === 'cld:setSelectedJoint') {
    if (data.nodePath == null || data.nodePath === '') {
      _jointSelected = null;
    } else {
      const np = String(data.nodePath).trim();
      const ji = Number(data.jointIdx);
      _jointSelected = {
        nodePath: np,
        jointIdx: Number.isFinite(ji) ? ji : NaN,
        ...(data.contactId != null && String(data.contactId)
          ? { contactId: String(data.contactId) }
          : {}),
        ...(Number(data.schemeId) > 0 ? { schemeId: Number(data.schemeId) } : {}),
        ...(Number.isFinite(Number(data.frameIndex)) ? { frameIndex: Number(data.frameIndex) } : {}),
      };
    }
    _renderJointMarkers();
    render();
  } else if (data.type === 'cld:toggleDoors') {
    const openMaybe = data.open;
    const instant = data.instant === true;
    let nextOpen;
    if (openMaybe === true) nextOpen = true;
    else if (openMaybe === false) nextOpen = false;
    else {
      const g0 = _cldIframeDoorSwingGroups.find((g) => g && g.parent && g.userData?.cldDoorSwing?.syncBulkOpen !== false);
      const s0 = g0?.userData?.cldDoorSwing;
      if (s0) nextOpen = !s0.isOpen;
      else {
        const o0 = _cldIframeSlideGroups.find((o) => o && o.parent && o.userData?.cldSlide?.syncBulkOpen !== false);
        const sl0 = o0?.userData?.cldSlide;
        nextOpen = sl0 ? !sl0.isOpen : true;
      }
    }
    for (const g of _cldIframeDoorSwingGroups) {
      if (!g || !g.parent) continue;
      const sw = g.userData?.cldDoorSwing;
      if (!sw) continue;
      if (sw.syncBulkOpen === false) continue;
      const ang = nextOpen ? sw.maxAngle : 0;
      sw.isOpen = nextOpen;
      sw.targetAngle = ang;
      if (instant) {
        sw.currentAngle = ang;
        if (sw.axis === 'y') g.rotation.y = ang;
        else if (sw.axis === 'x') g.rotation.x = ang;
        else if (sw.axis === 'z') g.rotation.z = ang;
      }
    }
    for (const own of _cldIframeSlideGroups) {
      if (!own || !own.parent) continue;
      const sl = own.userData?.cldSlide;
      if (!sl || sl.syncBulkOpen === false || sl.slideMaster) continue;
      const t = nextOpen ? sl.travelU : 0;
      sl.isOpen = nextOpen;
      sl.targetOffset = t;
      if (instant) {
        sl.currentOffset = t;
        own.position.x = sl.base.x + (sl.axis === 'x' ? t * sl.sign : 0);
        own.position.y = sl.base.y + (sl.axis === 'y' ? t * sl.sign : 0);
        own.position.z = sl.base.z + (sl.axis === 'z' ? t * sl.sign : 0);
      }
    }
    render();
  } else if (data.type === 'cld:setPreviewDoorsOpen') {
    __cldPreviewDoorsOpen = !!data.open;
    _cldApplyPreviewDoorsOpenToSwings();
    render();
  } else if (data.type === 'cld:setActiveJoint') {
    // Обновляем информацию об активных стыках → фиолетовые плашки.
    // Если nodePath не передан — используем lastSelectedPath как фолбэк.
    if (data.nodePath === null || data.nodePath === undefined) {
      _jointActiveInfo = null;
    } else {
      const resolvedPath = data.nodePath !== '' ? data.nodePath
        : (lastSelectedPath && lastSelectedPath !== '0' ? lastSelectedPath : null);
      _jointActiveInfo = resolvedPath
        ? {
            nodePath: resolvedPath,
            activeJointIdx: data.activeJointIdx ?? 0,
            allJointIdxs: data.allJointIdxs || null,
            appliedJoints: data.appliedJoints || [],
            seamLenMm: Number(data.seamLenMm) > 0 ? Number(data.seamLenMm) : undefined,
            potentialJointIdxs: Array.isArray(data.potentialJointIdxs) ? data.potentialJointIdxs : null,
            displayMode: String(data.displayMode || ''),
            activeAxis: String(data.activeAxis || data.activeGroupKey || '').toLowerCase() || null,
            activeGroupKey: String(data.activeGroupKey || data.activeAxis || '').toLowerCase() || null,
            activeContactId: data.activeContactId != null ? String(data.activeContactId) : null,
            seamLenByJointIdx:
              data.seamLenByJointIdx && typeof data.seamLenByJointIdx === 'object' ? data.seamLenByJointIdx : null,
          }
        : null;
    }
    try {
      console.log('[CLD-JOINT][iframe] setActiveJoint', {
        nodePath: _jointActiveInfo?.nodePath || null,
        activeAxis: _jointActiveInfo?.activeAxis || null,
        allJointIdxs: _jointActiveInfo?.allJointIdxs || null,
      });
    } catch (_) {}
    if (_jointActiveInfo?.nodePath != null && pp?.helpers?.axes_helper) {
      pp.helpers.axes_helper.visible = false;
    }
    _renderJointMarkers();
    render();
  } else if (data.type === 'cld:querySeamContacts') {
    // Этап 1: торец↔пласть, зазор ≈ 0; группы — вертикальные → горизонтальные.
    const reqId = data.reqId != null ? data.reqId : null;
    const resolvePanel = (nodePath) => {
      const tryPath = (p) => {
        if (p == null || p === '') return null;
        return window.CLDDBG?.engine?.getNodeByPath(String(p).trim()) || null;
      };
      let o = tryPath(nodePath);
      if (!o && lastSelectedPath && lastSelectedPath !== '0') o = tryPath(lastSelectedPath);
      if (!o && nodePath != null) {
        const s = String(nodePath).trim();
        if (s.startsWith('0,')) o = tryPath(s.slice(2));
        else if (s && s !== '0') o = tryPath(`0,${s}`);
      }
      return o;
    };
    const domPath = data.nodePath != null ? String(data.nodePath).trim() : '';
    const panel = resolvePanel(domPath);
    if (panel && typeof panel.updateWorldMatrix === 'function') panel.updateWorldMatrix(true, true);
    const contacts = panel ? detectToretsAgainstPlast(panel, rootGroup, { mmPerWorldUnit: UNITS_MM }) : [];
    const groupsRaw = buildToretsPlastGroups(contacts);
    const payload = {
      type: 'cld:seamContacts',
      reqId,
      nodePath: domPath,
      contacts: contacts.map((c) => ({
        id: c.id,
        pair: c.pair,
        neighborName: c.neighborName,
        gapMm: c.gapMm,
        seamLenMm: c.seamOverlapMm,
        seamWidthMm: c.seamWidthMm,
        toretsThickMm: c.toretsThickMm,
        plastThickMm: c.plastThickMm,
        hostFaceType: c.hostFaceType,
        neighborFaceType: c.neighborFaceType,
        seamAxis: c.seamAxis,
        groupKey: c.groupKey || (c.seamAxis === 'y' ? 'vertical' : 'horizontal'),
        conditionKey: c.conditionKey || null,
        hostJointIdx: c.hostJointIdx,
        groupAxis: c.groupKey || c.seamAxis,
      })),
      groups: groupsRaw.map((g) => ({
        key: g.key,
        axis: g.axis,
        name: g.name,
        count: g.count,
        hostFaceType: g.hostFaceType,
        contactIds: g.contactIds,
        slots: [...new Set(
          (g.contacts || [])
            .map((c) => Number(c.hostJointIdx))
            .filter((n) => Number.isFinite(n) && n >= 0),
        )],
      })),
    };
    try {
      if (event.source && event.source.postMessage) event.source.postMessage(payload, '*');
      else if (window.parent && window.parent !== window) window.parent.postMessage(payload, '*');
    } catch (e) {
      console.warn('[CLD-TORET-PLAST] query reply failed', e);
    }
  } else if (data.type === 'cld:loadModel') {
    if (__CLD_CONTEXT === 'models3d') {
      console.warn(
        '[CLD][ref-validation] Вы в context=models3d (редактор одной 3D модели): сюда не приходит петлевой template tree, проверки animator/model/furniture не выполняются.'
      );
    }
    const url = String(data.modelPath || '').trim();
    const tr = data.transform || {};
    const modelParams = tr.modelParams && typeof tr.modelParams === 'object' ? tr.modelParams : {};
    _m3LastUserTransform = {
      position: {
        x: Number(tr.position?.x) || 0,
        y: Number(tr.position?.y) || 0,
        z: Number(tr.position?.z) || 0,
      },
      rotation: {
        x: Number(tr.rotation?.x) || 0,
        y: Number(tr.rotation?.y) || 0,
        z: Number(tr.rotation?.z) || 0,
      },
      scale: {
        x: Number(tr.scale?.x) || 1,
        y: Number(tr.scale?.y) || 1,
        z: Number(tr.scale?.z) || 1,
      },
    };
    _disposeM3Preview();
    const loadGen = ++_m3LoadGen;
    _m3LastModelUrl = url;
    _m3PreviewRefSizeMm = _m3ResolvePreviewRefMm(modelParams, url, data.previewRefMm);
    _m3LastModelParams = modelParams;
    _m3HandleBarFit = data.handleBarFit === true || data.handle_bar_fit === true;
    _m3RodCompanionsPayload =
      data.rodCompanions && typeof data.rodCompanions === 'object' ? data.rodCompanions : null;
    if (!url) {
      render();
      return;
    }
    const pathLower = url.replace(/#.*/, '').split('?')[0].toLowerCase();
    if (pathLower.endsWith('.fbx')) {
      new FBXLoader().load(
        url,
        (fbx) => {
          _mountM3PreviewContent(fbx, modelParams, null, loadGen);
          if (loadGen === _m3LoadGen) _applyM3PreviewMaterialsNow().catch(() => {});
        },
        undefined,
        (err) => {
          if (loadGen !== _m3LoadGen) return;
          _postM3PreviewLoadError(url, err);
          render();
        }
      );
      return;
    }
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        _mountM3PreviewContent(gltf.scene, modelParams, gltf.asset, loadGen);
        if (loadGen === _m3LoadGen) _applyM3PreviewMaterialsNow().catch(() => {});
      },
      undefined,
      (err) => {
        if (loadGen !== _m3LoadGen) return;
        _postM3PreviewLoadError(url, err);
        render();
      }
    );
  } else if (data.type === 'cld:previewRodCompanions') {
    _m3RodCompanionsPayload =
      data.rodCompanions && typeof data.rodCompanions === 'object' ? data.rodCompanions : null;
    if (_m3PreviewRoot && _m3PreviewRoot.children.length) {
      _m3SpawnRodCompanionsPreview().catch(() => {});
    } else {
      _m3ClearRodCompanions();
      render();
    }
  } else if (data.type === 'cld:clearModel') {
    _disposeM3Preview();
    __cameraWasAutoFitted = false;
    _fitPreviewCameraCombined();
    __cameraWasAutoFitted = true;
    render();
  } else if (data.type === 'cld:setModelTransform') {
    const tr = data.transform || {};
    const modelParams =
      (tr.modelParams && typeof tr.modelParams === 'object' && tr.modelParams) ||
      (data.modelParams && typeof data.modelParams === 'object' && data.modelParams) ||
      {};
    _m3LastUserTransform = {
      position: {
        x: Number(tr.position?.x) || 0,
        y: Number(tr.position?.y) || 0,
        z: Number(tr.position?.z) || 0,
      },
      rotation: {
        x: Number(tr.rotation?.x) || 0,
        y: Number(tr.rotation?.y) || 0,
        z: Number(tr.rotation?.z) || 0,
      },
      scale: {
        x: Number(tr.scale?.x) || 1,
        y: Number(tr.scale?.y) || 1,
        z: Number(tr.scale?.z) || 1,
      },
    };
    _m3PreviewRefSizeMm = _m3ResolvePreviewRefMm(modelParams, _m3LastModelUrl, data.previewRefMm);
    _m3LastModelParams = modelParams;
    if (data.handleBarFit === true || data.handle_bar_fit === true) {
      _m3HandleBarFit = true;
    }
    if (data.rodCompanions && typeof data.rodCompanions === 'object') {
      _m3RodCompanionsPayload = data.rodCompanions;
    }
    if (_m3PreviewRoot && _m3PreviewRoot.children.length) {
      _refitM3PreviewInner();
      __cameraWasAutoFitted = false;
      _fitPreviewCameraCombined();
      __cameraWasAutoFitted = true;
    } else {
      _applyM3PreviewUserTransform(_m3LastUserTransform);
    }
    render();
  }
});

// Один ready родителю (без повторных NeedModule/ретраев — они вешали админку).
try {
  window.parent && window.parent.postMessage({ type: 'cld:iframeReady', version: 'clodis-preview-v1' }, '*');
} catch (_) {}

const wEl = document.getElementById('w');
const hEl = document.getElementById('h');
const dEl = document.getElementById('d');
const showEl = document.getElementById('showDims');
const applyEl = document.getElementById('apply');
const resetEl = document.getElementById('reset');

function readInputs() {
  return {
    w: mm(wEl ? parseFloat(wEl.value) : state.w),
    h: mm(hEl ? parseFloat(hEl.value) : state.h),
    d: mm(dEl ? parseFloat(dEl.value) : state.d),
  };
}

if (applyEl) {
  applyEl.addEventListener('click', () => {
    const s = readInputs();
    showDims = !!(showEl && showEl.checked);
    setSize(s.w, s.h, s.d);
  });
}

if (resetEl) {
  resetEl.addEventListener('click', () => {
    state = { w: 300, h: 400, d: 200 };
    showDims = true;
    if (wEl) wEl.value = String(state.w);
    if (hEl) hEl.value = String(state.h);
    if (dEl) dEl.value = String(state.d);
    if (showEl) showEl.checked = true;
    rebuild();
  });
}

if (showEl) {
  showEl.addEventListener('change', () => {
    toggleDims(!!showEl.checked);
  });
}

/** Каталожный скрин: фронт (без 3/4), узкий FOV, наполнение по центру кадра. */
const CATALOG_ICON_FOV_DEG = 20;
/** >1 — дальше от корпуса; 1.18–1.25 чтобы высокий шкаф не обрезался сверху/снизу. */
const CATALOG_ICON_CAM_PADDING = 1.58;
/** Точка взгляда — геометрический центр корпуса (не смещение вверх). */
const CATALOG_ICON_LOOK_Y_FRAC = 0.5;

function _cldNodeLayoutRole(o) {
  const cfg = o?.userData?.config || o?.config;
  return String(cfg?.layout_role ?? cfg?.sectionLayoutRole ?? '').trim().toLowerCase();
}

function _cldNodeDisplayName(o) {
  const cfg = o?.userData?.config || o?.config;
  return String(cfg?.name ?? o?.name ?? '').trim().toLowerCase();
}

function _cldIsPlinthOrSupportObject(o) {
  if (!o) return false;
  const role = _cldNodeLayoutRole(o);
  if (role === 'plinth') return true;
  const nm = _cldNodeDisplayName(o);
  if (/цоколь|plinth|опор|ножк|support/.test(nm)) return true;
  const type = String((o.userData?.config || o?.config)?.type ?? '').toLowerCase();
  if (type === 'fill_module' && /опор|ножк/.test(nm)) return true;
  return false;
}

function _cldHidePlinthAndSupportsForIcon() {
  const hidden = [];
  if (!rootGroup) return hidden;
  const hide = (o) => {
    if (o && o.visible) {
      hidden.push(o);
      o.visible = false;
    }
  };
  const walkTree = (nodes, parentPath, parentPlinth) => {
    if (!Array.isArray(nodes)) return;
    nodes.forEach((n, i) => {
      if (!n || typeof n !== 'object') return;
      const role = String(n.layout_role ?? n.sectionLayoutRole ?? '').toLowerCase();
      const path = parentPath ? `${parentPath},${i}` : String(i);
      const inPlinth = parentPlinth || role === 'plinth';
      const nm = String(n.name ?? '').toLowerCase();
      if (inPlinth || /опор|цоколь|plinth|ножк/.test(nm)) {
        const obj = window.CLDDBG?.engine?.getNodeByPath?.(path);
        if (obj) hide(obj);
      }
      const ch = n.children;
      if (Array.isArray(ch) && ch.length) walkTree(ch, path, inPlinth);
    });
  };
  try {
    walkTree(moduleTemplateTree, '0', false);
  } catch (_) {}
  rootGroup.traverse((o) => {
    if (!o.visible || !_cldIsPlinthOrSupportObject(o)) return;
    hide(o);
  });
  return hidden;
}

/** Угол распашки на иконке каталога (фиксированный, как у Matkasten). */
const CATALOG_ICON_DOOR_OPEN_DEG = 110;

function _cldMeshUnderSwingGroup(o) {
  if (!o) return false;
  for (let n = o; n; n = n.parent) {
    if (_cldIframeDoorSwingGroups.includes(n)) return true;
  }
  return false;
}

/** Bbox корпуса/наполнения без цоколя и без фасадов (камера и пол — по нему). */
function _cldCorpusIconBoundingBox(targetObject) {
  const box = new THREE.Box3();
  let has = false;
  if (!targetObject) return { box, has };
  targetObject.traverse((o) => {
    if (!o.visible || !o.isMesh) return;
    if (_cldIsPlinthOrSupportObject(o) || _cldMeshUnderSwingGroup(o)) return;
    const cfg = o?.userData?.config || o?.config;
    const type = String(cfg?.type ?? '').toLowerCase();
    if (type === 'facade') return;
    const b = new THREE.Box3().setFromObject(o);
    if (b.isEmpty()) return;
    if (!has) {
      box.copy(b);
      has = true;
    } else {
      box.union(b);
    }
  });
  if (!has) {
    const fallback = new THREE.Box3();
    let fbHas = false;
    targetObject.traverse((o) => {
      if (!o.visible || !o.isMesh) return;
      const b = new THREE.Box3().setFromObject(o);
      if (b.isEmpty()) return;
      if (!fbHas) {
        fallback.copy(b);
        fbHas = true;
      } else {
        fallback.union(b);
      }
    });
    return { box: fallback, has: fbHas };
  }
  return { box, has };
}

/** Bbox для клипа теней/артефактов скрина — с фасадами (корпусный bbox их не включает). */
function _cldIconShotVisualBoundingBox(targetObject) {
  const box = new THREE.Box3();
  let has = false;
  if (!targetObject) return { box, has };
  targetObject.traverse((o) => {
    if (!o.visible || !o.isMesh) return;
    if (_cldIsPlinthOrSupportObject(o)) return;
    if (_cldSkipCatalogIconWhitewashMesh(o)) return;
    const b = new THREE.Box3().setFromObject(o);
    if (b.isEmpty()) return;
    if (!has) {
      box.copy(b);
      has = true;
    } else {
      box.union(b);
    }
  });
  return { box, has };
}

/** Камера: без распашки — фасады ящиков в visual bbox (corpus их не включает → срез сверху). */
function _cldCatalogIconCameraFitBox(targetObject, corpusBox) {
  if (!targetObject || !corpusBox || corpusBox.isEmpty()) return corpusBox;
  if (_cldModuleHasSwingDoorsForIcon()) return corpusBox;
  const visual = _cldIconShotVisualBoundingBox(targetObject);
  if (!visual.has || visual.box.isEmpty()) return corpusBox;
  return visual.box;
}

function _cldModuleHasSwingDoorsForIcon() {
  return _cldIframeDoorSwingGroups.some(
    (g) => g?.parent && g.userData?.cldDoorSwing && g.userData.cldDoorSwing.syncBulkOpen !== false
  );
}

function _cldSnapshotSwingDoorStates() {
  return _cldIframeDoorSwingGroups
    .map((g) => {
      const sw = g?.userData?.cldDoorSwing;
      if (!g || !sw) return null;
      return {
        g,
        axis: sw.axis,
        isOpen: sw.isOpen,
        targetAngle: sw.targetAngle,
        currentAngle: sw.currentAngle,
      };
    })
    .filter(Boolean);
}

function _cldRestoreSwingDoorStates(snaps) {
  for (const s of snaps || []) {
    const sw = s.g?.userData?.cldDoorSwing;
    if (!sw) continue;
    sw.isOpen = s.isOpen;
    sw.targetAngle = s.targetAngle;
    sw.currentAngle = s.currentAngle;
    const ang = s.currentAngle;
    if (s.axis === 'y') s.g.rotation.y = ang;
    else if (s.axis === 'x') s.g.rotation.x = ang;
    else if (s.axis === 'z') s.g.rotation.z = ang;
  }
}

/** Только распашка на фикс. угол (110°); ящики не выдвигаем. */
function _cldApplyCatalogIconSwingDoorsOpen() {
  const deg =
    Number(window.__cldCatalogIconDoorDeg) > 0
      ? Math.min(Number(window.__cldCatalogIconDoorDeg), 175)
      : CATALOG_ICON_DOOR_OPEN_DEG;
  const iconRad = THREE.MathUtils.degToRad(deg);
  for (const g of _cldIframeDoorSwingGroups) {
    if (!g?.parent) continue;
    const sw = g.userData?.cldDoorSwing;
    if (!sw || sw.syncBulkOpen === false) continue;
    const sign = (sw.maxAngle || iconRad) >= 0 ? 1 : -1;
    const ang = iconRad * sign;
    sw.isOpen = true;
    sw.targetAngle = ang;
    sw.currentAngle = ang;
    if (sw.axis === 'y') g.rotation.y = ang;
    else if (sw.axis === 'x') g.rotation.x = ang;
    else if (sw.axis === 'z') g.rotation.z = ang;
  }
}

function _cldHideCatalogScreenshotOverlays() {
  const hidden = [];
  const stash = (obj) => {
    if (obj && obj.visible) {
      hidden.push(obj);
      obj.visible = false;
    }
  };
  stash(dimsGroup);
  stash(_jointVizGroup);
  for (const g of _jointPanelVizList) stash(g);
  stash(hingeMarkersGroup);
  if (rootGroup) {
    rootGroup.traverse((o) => {
      if (!o.visible) return;
      if (o.name === '__clodis_joint_panel_viz') {
        hidden.push(o);
        o.visible = false;
        return;
      }
      if (o.name === '__cld_door_axis_marker') {
        hidden.push(o);
        o.visible = false;
        return;
      }
      if (
        o.name === '__clodis_dimensions' ||
        o.name === '__clodis_sizes_obj' ||
        o.userData?.isDimensions
      ) {
        hidden.push(o);
        o.visible = false;
      }
    });
  }
  return hidden;
}

function _cldRestoreCatalogScreenshotOverlays(hidden) {
  for (const o of hidden || []) {
    if (o) o.visible = true;
  }
}

function _cldAlignRootGroupBottomOnFloor(corpusBox) {
  if (!rootGroup) return null;
  const saved = rootGroup.position.clone();
  rootGroup.updateMatrixWorld(true);
  const box =
    corpusBox && !corpusBox.isEmpty()
      ? corpusBox
      : _cldCorpusIconBoundingBox(rootGroup).box;
  if (box && !box.isEmpty()) {
    rootGroup.position.y -= box.min.y;
    rootGroup.updateMatrixWorld(true);
  }
  return saved;
}

function _cldFitCatalogIconCamera(targetObject, corpusBox) {
  if (!targetObject || !camera) return;
  const tuning = _cldGetCatalogIconTuning();
  targetObject.updateMatrixWorld(true);
  let box = corpusBox;
  if (!box || box.isEmpty()) {
    const fb = _cldCorpusIconBoundingBox(targetObject);
    if (!fb.has || fb.box.isEmpty()) return;
    box = fb.box;
  }
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const lookAt = new THREE.Vector3(
    center.x,
    box.min.y + size.y * tuning.lookYFrac,
    center.z
  );

  const vFov = THREE.MathUtils.degToRad(tuning.fovDeg);
  const aspect = Math.max(camera.aspect || 1, 0.25);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const halfX = Math.max(size.x / 2, 1e-6);
  const halfY = Math.max(size.y / 2, 1e-6);
  const doorExtraX = _cldModuleHasSwingDoorsForIcon()
    ? size.x * 0.42 * (tuning.doorOpenDeg / 120)
    : 0;
  const distH = (halfX + doorExtraX) / Math.tan(hFov / 2);
  const distV = halfY / Math.tan(vFov / 2);
  let dist = Math.max(distH, distV) * tuning.camPadding;
  dist += Math.max(size.z, 1e-6) * 0.1;

  camera.position.set(lookAt.x, lookAt.y, lookAt.z + dist);
  camera.lookAt(lookAt);
  if (controls) {
    controls.target.copy(lookAt);
    controls.update();
  }
  camera.fov = tuning.fovDeg;
  camera.far = Math.max(camera.far || 0, dist * 6, size.length() * 4);
  camera.updateProjectionMatrix();
}

/** Активен каталожный кадр — без CSS2D размеров. */
let _cldCatalogIconShotActive = false;
let _cldCatalogIconComposer = null;
let _cldCatalogIconSsaoPass = null;

/** Дефолты каталожного скрина — studio packshot (IBL + 3-point), правки через DEV-панель. */
const CATALOG_ICON_STUDIO_HDR_LOCAL = '/vendor/hdr/studio_small_09_1k.hdr';
const CATALOG_ICON_STUDIO_HDR_CDN =
  'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr';

const CATALOG_ICON_TUNING_DEFAULTS = {
  /** studio = packshot (IBL + 3-point), window = пасмурное окно, legacy = ручные ползунки */
  lightingModel: 'studio',
  exposure: 1.05,
  toneMappingMode: 2,
  /** Студийный key / fill / rim (legacy units, _useLegacyLights) */
  studioKey: 0.26,
  studioFill: 0.13,
  studioRim: 0.12,
  studioTop: 0.09,
  studioInner: 0.36,
  studioInnerRange: 3.8,
  studioInnerDecay: 1.45,
  /** 0 = point в центре; 1 = с камеры в нишу (равно для любых полок) */
  studioInnerEven: 0.86,
  studioLowFill: 0.08,
  studioLowFillOn: 0,
  studioBackFill: 0.08,
  studioBackFillOn: 0,
  /** Softbox в проёме — мягкий свет внутрь (интенсивность, не лм) */
  studioOpening: 1.58,
  studioOpeningOn: 1,
  /** 0 = point в центре корпуса; 1 = directional с камеры */
  studioInnerFromCamera: 0,
  iconAmbient: 0.055,
  hemiFill: 0.11,
  hemiGroundGray: 222,
  cavityBackFrac: 0.44,
  /** Вкл/выкл источников (1 = on) — мощность в ползунках ниже сохраняется */
  iconAmbientOn: 1,
  hemiFillOn: 1,
  studioKeyOn: 1,
  studioFillOn: 1,
  studioRimOn: 1,
  studioTopOn: 1,
  studioInnerOn: 1,
  windowLumens: 0,
  windowColor: 0xc8d8e8,
  windowWidthMm: 1800,
  windowHeightMm: 1400,
  windowOffsetX: 0.52,
  windowOffsetY: 0.1,
  windowOffsetZ: 0.62,
  roomBounce: 0,
  ceilingLumens: 0,
  cavityBounceLux: 0,
  topKey: 0,
  cavityDirect: 0,
  daylightKey: 0,
  cavitySpot: 0,
  rimFill: 0,
  sideKey: 0,
  innerKey: 0,
  innerCamFill: 0,
  shelfTopKey: 0,
  cavityFill: 0,
  innerBack: 0,
  whiteRoughness: 0.66,
  doorRoughness: 0.66,
  shelfRoughness: 0.66,
  corpusRoughness: 0.66,
  whiteEnvIntensity: 0.26,
  doorEnvIntensity: 0.26,
  corpusEnvIntensity: 0.26,
  /** Matte white packshot — один цвет на фасад, корпус, полки, задник, кромку (эксперимент) */
  doorColor: 0xffffff,
  interiorShelfColor: 0xffffff,
  interiorPanelColor: 0xffffff,
  interiorBackColor: 0xffffff,
  iconEdgeColor: 0xffffff,
  interiorCorpusGray: 255,
  interiorShelfGray: 255,
  interiorPanelGray: 255,
  interiorBackGray: 255,
  iconEdgeGray: 255,
  edgeRoughness: 0.66,
  edgeEnvIntensity: 0.26,
  useIconLdspTexture: 0,
  iconTextureRepeatMm: 380,
  iconEdgeTextureRepeatMm: 120,
  shelfContactShadow: 0,
  /** Полоска под нижним торцом фасада ящика (только export, не полноразмерные двери) */
  drawerFrontShadow: 0,
  shelfShadowOpacity: 0.1,
  shelfShadowMm: 7,
  useIconSsao: 1,
  ssaoKernelRadius: 23,
  ssaoMaxDistance: 0.031,
  ssaoMinDistance: 0.00028,
  iconFogDensity: 0,
  useInteriorEdges: 0,
  useSceneEnvironment: 1,
  keepAoMap: 0,
  aoMapIntensity: 1.1,
  shelfAoMul: 1.32,
  fovDeg: 20,
  camPadding: 1.58,
  lookYFrac: 0.5,
  doorOpenDeg: 110,
  contentFill: 1.07,
  renderScale: 3,
  shadowLift: 0,
  /** Unsharp после downscale (только PNG export, не live-превью) */
  thumbnailClarity: 0.3,
  /** DEV: сферы + оси перемещения источников в live-превью иконки */
  showIconLightGizmos: 1,
};

/** Усиление света/AO только при makeScreenshot (мелкий PNG), не в DEV-превью. */
const CATALOG_ICON_THUMBNAIL_EXPORT_PATCH = {
  studioTop: 0.06,
  studioOpening: 1.38,
  studioInner: 0.32,
  studioInnerEven: 0.78,
  studioKey: 0.3,
  studioFill: 0.13,
  iconAmbient: 0.045,
  hemiFill: 0.085,
  hemiGroundGray: 222,
  corpusEnvIntensity: 0.26,
  whiteEnvIntensity: 0.26,
  doorEnvIntensity: 0.26,
  edgeEnvIntensity: 0.26,
  ssaoKernelRadius: 30,
  ssaoMaxDistance: 0.019,
  ssaoMinDistance: 0.0002,
  interiorBackColor: 0xffffff,
  interiorBackGray: 255,
  interiorShelfColor: 0xffffff,
  interiorPanelColor: 0xffffff,
  iconEdgeColor: 0xffffff,
  thumbnailClarity: 0.5,
  exposure: 0.97,
  renderScale: 4,
  shelfContactShadow: 0,
  drawerFrontShadow: 1,
  shelfShadowOpacity: 0.15,
  shelfShadowMm: 4,
};

let _cldCatalogIconThumbnailExport = false;

function _cldEnsureCatalogIconComposer(w, h, tuning) {
  if (!_cldCatalogIconComposer) {
    _cldCatalogIconComposer = new EffectComposer(renderer);
    _cldCatalogIconComposer.addPass(new RenderPass(scene, camera));
    _cldCatalogIconSsaoPass = new SSAOPass(scene, camera, w, h, 32);
    _cldCatalogIconSsaoPass.minDistance = 0.001;
    _cldCatalogIconComposer.addPass(_cldCatalogIconSsaoPass);
    _cldCatalogIconComposer.addPass(new OutputPass());
  }
  _cldCatalogIconComposer.setSize(w, h);
  if (_cldCatalogIconSsaoPass) {
    _cldCatalogIconSsaoPass.setSize(w, h);
    _cldCatalogIconSsaoPass.kernelRadius = Number(tuning.ssaoKernelRadius) || 23;
    _cldCatalogIconSsaoPass.maxDistance = Number(tuning.ssaoMaxDistance) || 0.031;
    _cldCatalogIconSsaoPass.minDistance = Number(tuning.ssaoMinDistance) || 0.00028;
  }
  return _cldCatalogIconComposer;
}

function _cldRenderCatalogIconFrame() {
  const tuning = _cldGetCatalogIconTuning();
  if (!tuning.useIconSsao || !renderer?.domElement || renderer.domElement.tagName !== 'CANVAS') {
    renderer.render(scene, camera);
    return;
  }
  try {
    const w = Math.max(1, renderer.domElement.width);
    const h = Math.max(1, renderer.domElement.height);
    _cldEnsureCatalogIconComposer(w, h, tuning).render();
  } catch (e) {
    console.warn('[Clodis][catalog-icon] SSAO fallback:', e);
    renderer.render(scene, camera);
  }
}

function _cldApplyCatalogIconToneMapping(tuning) {
  const mode = Number(tuning.toneMappingMode);
  if (mode === 2) renderer.toneMapping = THREE.ACESFilmicToneMapping;
  else if (mode === 1) renderer.toneMapping = THREE.ReinhardToneMapping;
  else renderer.toneMapping = THREE.LinearToneMapping;
  renderer.toneMappingExposure = tuning.exposure;
}

function _cldGetCatalogIconTuning() {
  const patch = window.__cldCatalogIconTuning;
  let tuning =
    !patch || typeof patch !== 'object'
      ? { ...CATALOG_ICON_TUNING_DEFAULTS }
      : { ...CATALOG_ICON_TUNING_DEFAULTS, ...patch };
  if (_cldCatalogIconThumbnailExport) {
    tuning = { ...tuning, ...CATALOG_ICON_THUMBNAIL_EXPORT_PATCH };
  }
  return tuning;
}

/** @deprecated читать через _cldGetCatalogIconTuning() */
const CATALOG_ICON_LIGHT = CATALOG_ICON_TUNING_DEFAULTS;
const CATALOG_ICON_WHITE_COLOR = 0xffffff;

function _cldCatalogIconRoomEnvFallback(pmrem) {
  const room = new RoomEnvironment();
  const tex = pmrem.fromScene(room, 0.04).texture;
  if (typeof room.dispose === 'function') room.dispose();
  return tex;
}

function _cldLoadCatalogIconHdrTexture(url) {
  const loader = new RGBELoader();
  loader.setDataType(THREE.HalfFloatType);
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (hdr) => {
        hdr.mapping = THREE.EquirectangularReflectionMapping;
        resolve(hdr);
      },
      undefined,
      reject
    );
  });
}

/** Студийный IBL для каталожного скрина (кэш + fallback RoomEnvironment). */
async function _cldEnsureCatalogIconStudioEnvMap() {
  if (_cldCatalogIconEnvMap) return _cldCatalogIconEnvMap;
  if (_cldCatalogIconEnvPromise) return _cldCatalogIconEnvPromise;

  _cldCatalogIconEnvPromise = (async () => {
    const tuning = _cldGetCatalogIconTuning();
    if (!tuning.useSceneEnvironment || !renderer || renderer.domElement?.tagName !== 'CANVAS') {
      return null;
    }

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();

    let hdr = null;
    try {
      hdr = await _cldLoadCatalogIconHdrTexture(CATALOG_ICON_STUDIO_HDR_LOCAL);
    } catch (localErr) {
      console.warn('[Clodis][catalog-icon] local HDR failed, trying CDN:', localErr);
      try {
        hdr = await _cldLoadCatalogIconHdrTexture(CATALOG_ICON_STUDIO_HDR_CDN);
      } catch (cdnErr) {
        console.warn('[Clodis][catalog-icon] CDN HDR failed, RoomEnvironment:', cdnErr);
      }
    }

    if (hdr) {
      _cldCatalogIconEnvMap = pmrem.fromEquirectangular(hdr).texture;
      hdr.dispose();
      pmrem.dispose();
      return _cldCatalogIconEnvMap;
    }

    try {
      _cldCatalogIconEnvMap = _cldCatalogIconRoomEnvFallback(pmrem);
    } catch (e) {
      console.warn('[Clodis][catalog-icon] RoomEnvironment:', e);
      _cldCatalogIconEnvMap = null;
    } finally {
      pmrem.dispose();
    }
    return _cldCatalogIconEnvMap;
  })();

  try {
    return await _cldCatalogIconEnvPromise;
  } finally {
    _cldCatalogIconEnvPromise = null;
  }
}

function _cldCatalogIconMeshConfig(o) {
  for (let n = o; n; n = n.parent) {
    const cfg = n.userData?.config || n.config;
    if (cfg && typeof cfg === 'object') return cfg;
  }
  return null;
}

function _cldCatalogIconSurfaceRole(o) {
  if (o?.userData?.isEdge) return 'edge';
  if (_cldMeshUnderSwingGroup(o)) return 'door';
  const cfg = _cldCatalogIconMeshConfig(o);
  if (cfg) {
    const type = String(cfg.type ?? '').toLowerCase();
    if (type === 'facade') return 'door';
    const name = String(cfg.name ?? o.name ?? '').toLowerCase();
    const ori = normalizeOrientation(cfg.spec?.orientation ?? cfg.orientation);
    if (ori === 'h' || /bottom|дно|h_bottom|:bottom|полк|shelf|переклад|полка/i.test(name)) {
      return 'shelf';
    }
    if (ori === 'f' || /back|задн|_bwo|back_wall/i.test(name)) return 'back';
    return 'panel';
  }
  o.updateWorldMatrix?.(true, true);
  const box = new THREE.Box3().setFromObject(o);
  const s = box.getSize(new THREE.Vector3());
  const dims = [s.x, s.y, s.z].sort((a, b) => a - b);
  if (dims[2] > 1e-6 && dims[0] / dims[2] < 0.2) {
    const thin = dims[0];
    if (s.y <= thin * 1.15) return 'shelf';
    if (s.z <= thin * 1.15) return 'back';
  }
  return 'panel';
}

function _cldCatalogIconGrayToHex(gray) {
  const g = Math.max(0, Math.min(255, Math.round(Number(gray) || 240)));
  return (g << 16) | (g << 8) | g;
}

function _cldCatalogIconResolveHexOrGray(colorHex, gray, fallbackGray) {
  const hex = Number(colorHex);
  if (Number.isFinite(hex) && hex > 0) return hex;
  return _cldCatalogIconGrayToHex(gray ?? fallbackGray);
}

function _cldCatalogIconSurfaceColor(role, tuning) {
  if (role === 'door') {
    return _cldCatalogIconResolveHexOrGray(tuning.doorColor, null, 255);
  }
  if (role === 'edge') {
    return _cldCatalogIconResolveHexOrGray(
      tuning.iconEdgeColor,
      tuning.iconEdgeGray ?? tuning.interiorEdgeGray,
      255
    );
  }
  if (role === 'back') {
    return _cldCatalogIconResolveHexOrGray(
      tuning.interiorBackColor,
      tuning.interiorBackGray ?? tuning.interiorCorpusGray,
      248
    );
  }
  if (role === 'shelf') {
    return _cldCatalogIconResolveHexOrGray(
      tuning.interiorShelfColor,
      tuning.interiorShelfGray ?? tuning.interiorCorpusGray,
      248
    );
  }
  if (role === 'panel') {
    return _cldCatalogIconResolveHexOrGray(
      tuning.interiorPanelColor,
      tuning.interiorPanelGray ?? tuning.interiorCorpusGray,
      248
    );
  }
  return _cldCatalogIconGrayToHex(tuning.interiorCorpusGray ?? 248);
}

function _cldCatalogIconSurfaceRoughness(role, tuning) {
  if (role === 'edge') {
    return Number(tuning.edgeRoughness ?? tuning.corpusRoughness ?? tuning.whiteRoughness) || 0.42;
  }
  if (role === 'door') return Number(tuning.doorRoughness) || 0.58;
  if (role === 'shelf') {
    return Number(tuning.shelfRoughness ?? tuning.corpusRoughness ?? tuning.whiteRoughness) || 0.6;
  }
  return Number(tuning.corpusRoughness ?? tuning.whiteRoughness) || 0.58;
}

function _cldCatalogIconSurfaceEnvIntensity(role, tuning) {
  if (role === 'door') return Number(tuning.doorEnvIntensity) || 1.0;
  if (role === 'edge') return Number(tuning.edgeEnvIntensity ?? tuning.corpusEnvIntensity) || 0.62;
  return Number(tuning.corpusEnvIntensity ?? tuning.whiteEnvIntensity) || 0.32;
}

let _cldCatalogIconLdspBaseTexture = null;
let _cldRectAreaLightReady = false;

function _cldEnsureRectAreaLightSupport() {
  if (_cldRectAreaLightReady) return;
  RectAreaLightUniformsLib.init();
  _cldRectAreaLightReady = true;
}

function _cldGetIconLightingModel(tuning = _cldGetCatalogIconTuning()) {
  return String(tuning.lightingModel || 'studio');
}

function _cldUsesWindowIconLighting(tuning = _cldGetCatalogIconTuning()) {
  return _cldGetIconLightingModel(tuning) === 'window';
}

function _cldUsesLegacyIconLighting(tuning = _cldGetCatalogIconTuning()) {
  return _cldGetIconLightingModel(tuning) === 'legacy';
}

function _cldUsesStudioIconLighting(tuning = _cldGetCatalogIconTuning()) {
  const m = _cldGetIconLightingModel(tuning);
  return m !== 'window' && m !== 'legacy';
}

function _cldCatalogIconSourceOn(tuning, onKey) {
  if (!tuning || onKey == null) return true;
  if (!Object.prototype.hasOwnProperty.call(tuning, onKey)) return true;
  return Number(tuning[onKey]) !== 0;
}

/** Светлая ЛДСП: микрорельеф + едва заметные горизонтальные полосы (как на фото шкафа). */
function _cldEnsureCatalogIconLdspTexture() {
  if (_cldCatalogIconLdspBaseTexture) return _cldCatalogIconLdspBaseTexture;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#f3f2ef';
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  const data = img.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 8;
    data[i] = Math.max(0, Math.min(255, data[i] + n));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);

  ctx.strokeStyle = 'rgba(0,0,0,0.028)';
  ctx.lineWidth = 1;
  for (let y = 6; y < size; y += 10) {
    ctx.beginPath();
    ctx.moveTo(0, y + (Math.random() - 0.5) * 0.6);
    ctx.lineTo(size, y + (Math.random() - 0.5) * 0.6);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = Math.min(8, renderer?.capabilities?.getMaxAnisotropy?.() || 4);
  _cldCatalogIconLdspBaseTexture = tex;
  return tex;
}

function _cldCatalogIconTextureClone(baseTex, repeatU, repeatV) {
  if (!baseTex) return null;
  const t = baseTex.clone();
  t.repeat.set(Math.max(repeatU, 0.5), Math.max(repeatV, 0.5));
  t.needsUpdate = true;
  return t;
}

function _cldCatalogIconUnifiedTextureRepeat(corpusSize, tuning) {
  const tileMm = Math.max(120, Number(tuning.iconTextureRepeatMm) || 380);
  const tileU = mmToU(tileMm);
  const sx = Math.max(corpusSize?.x || mmToU(500), tileU);
  const sy = Math.max(corpusSize?.y || mmToU(2000), tileU);
  const sz = Math.max(corpusSize?.z || mmToU(500), tileU);
  return {
    u: Math.max(sx / tileU, 1),
    v: Math.max(Math.max(sy, sz) / tileU, 1),
  };
}

/** Тайл ЛДСП по габаритам одной детали (кромка, узкая полоса). */
function _cldCatalogIconMeshTextureRepeat(mesh, tuning) {
  const tileMm = Math.max(40, Number(tuning.iconEdgeTextureRepeatMm ?? tuning.iconTextureRepeatMm) || 120);
  const tileU = mmToU(tileMm);
  const box = new THREE.Box3().setFromObject(mesh);
  const s = box.getSize(new THREE.Vector3());
  const dims = [s.x, s.y, s.z].sort((a, b) => b - a);
  const spanU = Math.max(dims[0], tileU);
  const spanV = Math.max(dims[1], tileU * 0.5);
  return {
    u: Math.max(spanU / tileU, 0.5),
    v: Math.max(spanV / tileU, 0.5),
  };
}

function _cldIsCatalogIconLineOverlay(o) {
  if (!o) return false;
  const ud = o.userData || {};
  return !!(
    ud.isEdgesLines ||
    ud.isEdgesHelper ||
    o.name === '__clodis_edges_helper' ||
    o.name === '__cld_catalog_icon_edges'
  );
}

function _cldHideCatalogIconEdgeHelpers() {
  const hidden = [];
  if (!rootGroup) return hidden;
  const stash = (obj) => {
    if (!obj?.visible) return;
    hidden.push({ obj, visible: true });
    obj.visible = false;
  };
  rootGroup.traverse((o) => {
    if (!o.visible) return;
    if (o.userData?.__cldCatalogIconShelfShadow) return;
    if (o.userData?.__edgesHelper) stash(o.userData.__edgesHelper);
    if (o.userData?.edges_lines) stash(o.userData.edges_lines);
    if (o.name === '__clodis_sizes_obj' || o.userData?.isDimensions) {
      stash(o);
      return;
    }
    if (o.isLineSegments || o.isLine || _cldIsCatalogIconLineOverlay(o)) {
      stash(o);
    }
  });
  return hidden;
}

function _cldRestoreCatalogIconEdgeHelpers(hidden) {
  for (const s of hidden || []) {
    if (s?.obj) s.obj.visible = s.visible;
  }
}

function _cldIsCatalogIconTechnicalMesh(o) {
  if (!o) return false;
  const ud = o.userData || {};
  if (ud.isHole || ud.furniDrillHole || ud.isHingeDebugVolume || ud.isHingeBazisExport) {
    return true;
  }
  if (ud.isEdgeNumber) return true;
  const nm = String(o.name ?? '').toLowerCase();
  if (/полкодерж|shelf.?pin|shelf.?support|отверст|drill|hinge.?hole|furni_hinge|петл/i.test(nm)) {
    return true;
  }
  const cfg = ud.config || o.config || {};
  const type = String(cfg.type ?? '').toLowerCase();
  if (type === 'hole' || type === 'drill') return true;
  return false;
}

function _cldHideCatalogIconTechnicalMeshes() {
  const hidden = [];
  if (!rootGroup) return hidden;
  rootGroup.traverse((o) => {
    if (!o.visible || !_cldIsCatalogIconTechnicalMesh(o)) return;
    hidden.push(o);
    o.visible = false;
  });
  return hidden;
}

function _cldRestoreCatalogIconHiddenMeshes(hidden) {
  for (const o of hidden || []) {
    if (o) o.visible = true;
  }
}

function _cldCatalogIconMeshQualifiesForDrawerShadow(o, box, s, topY, bottomY) {
  if (s.y > mmToU(290)) return false;
  if (s.y < mmToU(52)) return false;
  if (s.y < s.x * 0.28) return false;
  const cfg = _cldCatalogIconMeshConfig(o);
  const layoutRole = String(cfg?.layout_role ?? '').toLowerCase();
  if (
    layoutRole === 'drawer' ||
    layoutRole === 'drawer_front' ||
    layoutRole === 'facade_drawer'
  ) {
    return true;
  }
  if (topY != null && bottomY != null && topY > bottomY + 1e-6) {
    const rel = (box.min.y - bottomY) / (topY - bottomY);
    if (rel > 0.86 && s.y < mmToU(100)) return false;
  }
  return true;
}

function _cldApplyCatalogIconShelfContactShadows(root, tuning, corpusBox) {
  if (!root) return [];
  const shelfOn = !!tuning.shelfContactShadow;
  const drawerOn = !!tuning.drawerFrontShadow;
  if (!shelfOn && !drawerOn) return [];
  const frontZ =
    corpusBox && !corpusBox.isEmpty() ? corpusBox.max.z : null;
  const topY =
    corpusBox && !corpusBox.isEmpty() ? corpusBox.max.y : null;
  const bottomY =
    corpusBox && !corpusBox.isEmpty() ? corpusBox.min.y : null;
  const saved = [];
  const opacity = Math.min(0.18, Math.max(0.05, Number(tuning.shelfShadowOpacity) || 0.1));
  const lipMm = Math.max(3, Number(tuning.shelfShadowMm) || 7);
  const lipU = mmToU(lipMm);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x1a2838,
    transparent: true,
    opacity,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    if (_cldSkipCatalogIconWhitewashMesh(o) || _cldMeshUnderSwingGroup(o)) return;
    const role = _cldCatalogIconSurfaceRole(o);
    if (role === 'shelf' && !shelfOn) return;
    if (role === 'door' && !drawerOn) return;
    if (role !== 'shelf' && role !== 'door') return;
    const box = new THREE.Box3().setFromObject(o);
    if (box.isEmpty()) return;
    const s = box.getSize(new THREE.Vector3());
    if (topY != null && box.min.y > topY + mmToU(0.5)) return;
    if (frontZ != null && box.max.z < frontZ - mmToU(14)) return;
    if (role === 'shelf') {
      if (s.y > mmToU(32) || s.z > mmToU(22)) return;
    }
    if (role === 'door') {
      if (!_cldCatalogIconMeshQualifiesForDrawerShadow(o, box, s, topY, bottomY)) return;
    }
    const lipY = box.min.y - lipU * 0.42;
    if (topY != null && lipY > topY - mmToU(10)) return;

    const c = box.getCenter(new THREE.Vector3());
    const w = Math.max(s.x * 0.9, mmToU(80));

    // Мягкая полоска под передним торцом полки / фасада ящика (стык как в IKEA).
    const lip = new THREE.Mesh(new THREE.PlaneGeometry(w, lipU), mat);
    lip.position.set(c.x, box.min.y - lipU * 0.42, box.max.z - mmToU(0.45));
    lip.renderOrder = 5;
    lip.userData.__cldCatalogIconShelfShadow = true;
    root.add(lip);
    saved.push(lip);
  });
  return saved;
}

function _cldRestoreCatalogIconShelfShadows(saved) {
  for (const lip of saved || []) {
    lip.parent?.remove(lip);
    lip.geometry?.dispose();
    lip.material?.dispose();
  }
}

function _cldEnsureCatalogIconEdgesHelper(mesh) {
  if (!mesh?.isMesh || !mesh.geometry) return null;
  if (!mesh.userData.__edgesHelper) {
    const edgesGeom = new THREE.EdgesGeometry(mesh.geometry, 12);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x999999,
      transparent: true,
      opacity: 0.45,
      depthTest: true,
    });
    const edges = new THREE.LineSegments(edgesGeom, lineMat);
    edges.name = '__clodis_edges_helper';
    edges.userData.isEdgesHelper = true;
    mesh.add(edges);
    mesh.userData.__edgesHelper = edges;
  }
  return mesh.userData.__edgesHelper;
}

function _cldApplyCatalogIconInteriorEdges(root, tuning) {
  if (!root || !tuning.useInteriorEdges) return [];
  const saved = [];
  root.traverse((o) => {
    if (!o.isMesh || _cldSkipCatalogIconWhitewashMesh(o)) return;
    if (_cldMeshUnderSwingGroup(o)) return;
    if (_cldCatalogIconSurfaceRole(o) === 'door') return;
    const edges = _cldEnsureCatalogIconEdgesHelper(o);
    if (!edges?.material) return;
    saved.push({
      edges,
      visible: edges.visible,
      color: edges.material.color.getHex(),
      opacity: edges.material.opacity,
    });
    edges.material.color.setHex(0x999999);
    edges.material.opacity = Number(tuning.interiorEdgeOpacity) || 0.42;
    edges.visible = true;
  });
  return saved;
}

function _cldRestoreCatalogIconInteriorEdges(saved) {
  for (const s of saved || []) {
    if (!s?.edges?.material) continue;
    s.edges.visible = s.visible;
    s.edges.material.color.setHex(s.color);
    s.edges.material.opacity = s.opacity;
  }
}

function _cldSkipCatalogIconWhitewashMesh(o) {
  if (!o?.isMesh) return true;
  const ud = o.userData || {};
  if (ud.isEdgesHelper || o.name === '__clodis_edges_helper') return true;
  if (_cldIsPlinthOrSupportObject(o)) return true;
  const cfg = ud.config || o.config || {};
  const type = String(cfg.type ?? '').toLowerCase();
  const matKey = String(cfg.material ?? cfg.material_key ?? cfg.mat ?? '').toLowerCase();
  if (type === 'glass' || matKey.includes('glass') || matKey.includes('стекл')) return true;
  if (ud.isHingeDebugVolume || ud.isHingeBazisExport || ud.isHole || ud.furniDrillHole) return true;
  return false;
}

function _cldShouldCatalogIconShadowMesh(o) {
  if (!o?.isMesh || !o.visible) return false;
  if (_cldIsPlinthOrSupportObject(o)) return false;
  const ud = o.userData || {};
  if (ud.isEdgesHelper || o.name === '__clodis_edges_helper') return false;
  if (ud.isHingeDebugVolume || ud.isHingeBazisExport || ud.isHole || ud.furniDrillHole) return false;
  if (_cldMeshUnderSwingGroup(o)) return true;
  return !_cldSkipCatalogIconWhitewashMesh(o);
}

function _cldApplyCatalogIconShadowFlags(root) {
  const saved = [];
  if (!root) return saved;
  root.traverse((o) => {
    if (!_cldShouldCatalogIconShadowMesh(o)) return;
    saved.push({ o, castShadow: o.castShadow, receiveShadow: o.receiveShadow });
    o.castShadow = true;
    o.receiveShadow = true;
  });
  return saved;
}

function _cldRestoreCatalogIconShadowFlags(saved) {
  for (const s of saved || []) {
    if (!s?.o) continue;
    s.o.castShadow = s.castShadow;
    s.o.receiveShadow = s.receiveShadow;
  }
}

function _cldApplyCatalogIconMaterialTuning(root, corpusSize) {
  const tuning = _cldGetCatalogIconTuning();
  const saved = [];
  if (!root) return saved;
  const texRepeat = _cldCatalogIconUnifiedTextureRepeat(corpusSize, tuning);
  root.traverse((o) => {
    if (_cldSkipCatalogIconWhitewashMesh(o) || !o.material) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m) => {
      if (!m.isMeshStandardMaterial && !m.isMeshPhysicalMaterial) return;
      saved.push({
        m,
        color: m.color.clone(),
        emissive: m.emissive.clone(),
        map: m.map,
        normalMap: m.normalMap,
        roughnessMap: m.roughnessMap,
        metalnessMap: m.metalnessMap,
        aoMap: m.aoMap,
        metalness: m.metalness,
        roughness: m.roughness,
        envMapIntensity: m.envMapIntensity,
        aoMapIntensity: m.aoMapIntensity,
      });
      const role = _cldCatalogIconSurfaceRole(o);
      m.color.setHex(_cldCatalogIconSurfaceColor(role, tuning));
      m.emissive.setHex(0x000000);
      let iconMapClone = null;
      if (tuning.useIconLdspTexture && role !== 'door' && role !== 'edge') {
        const base = _cldEnsureCatalogIconLdspTexture();
        const repeat = role === 'edge'
          ? _cldCatalogIconMeshTextureRepeat(o, tuning)
          : texRepeat;
        iconMapClone = _cldCatalogIconTextureClone(base, repeat.u, repeat.v);
        m.map = iconMapClone;
      } else {
        m.map = null;
      }
      m.normalMap = null;
      m.roughnessMap = null;
      m.metalnessMap = null;
      if (!tuning.keepAoMap) m.aoMap = null;
      m.metalness = 0;
      m.roughness = _cldCatalogIconSurfaceRoughness(role, tuning);
      m.envMapIntensity = _cldCatalogIconSurfaceEnvIntensity(role, tuning);
      if (tuning.keepAoMap && m.aoMap) {
        const base = Number(tuning.aoMapIntensity) || 1;
        if (role === 'shelf') {
          m.aoMapIntensity = base * (Number(tuning.shelfAoMul) || 1.32);
        } else if (role === 'back') {
          m.aoMapIntensity = base * 0.88;
        } else {
          m.aoMapIntensity = base;
        }
      }
      saved[saved.length - 1].iconMapClone = iconMapClone;
      m.needsUpdate = true;
    });
  });
  return saved;
}

function _cldRestoreCatalogIconMaterialTuning(saved) {
  for (const s of saved || []) {
    if (!s?.m) continue;
    if (s.color) s.m.color.copy(s.color);
    if (s.emissive) s.m.emissive.copy(s.emissive);
    s.m.map = s.map ?? null;
    s.m.normalMap = s.normalMap ?? null;
    s.m.roughnessMap = s.roughnessMap ?? null;
    s.m.metalnessMap = s.metalnessMap ?? null;
    s.m.aoMap = s.aoMap ?? null;
    if (s.metalness != null) s.m.metalness = s.metalness;
    if (s.roughness != null) s.m.roughness = s.roughness;
    if (s.envMapIntensity != null) s.m.envMapIntensity = s.envMapIntensity;
    if (s.aoMapIntensity != null) s.m.aoMapIntensity = s.aoMapIntensity;
    if (s.iconMapClone && s.iconMapClone !== s.map) {
      s.iconMapClone.dispose();
    }
    s.m.needsUpdate = true;
  }
}

const CATALOG_ICON_LIGHT_GIZMO_COLORS = {
  ambient: 0x9e9e9e,
  hemi: 0x6eb5ff,
  key: 0xffb74d,
  fill: 0xfff176,
  rim: 0x4dd0e1,
  top: 0xffffff,
  inner: 0xea80fc,
  innerPt: 0xce93d8,
  lowFill: 0xaed581,
  backFill: 0xffcc80,
  opening: 0xfff59d,
  window: 0x90caf9,
  ceiling: 0xfff9c4,
  bounce: 0xb39ddb,
  default: 0xff5252,
};

let _cldCatalogIconTransformControls = null;
let _cldCatalogIconLightDebug = null;
let _cldCatalogIconLightGizmoPickBound = false;

function _cldCatalogIconLightGizmoColor(name) {
  return CATALOG_ICON_LIGHT_GIZMO_COLORS[name] || CATALOG_ICON_LIGHT_GIZMO_COLORS.default;
}

function _cldCatalogIconLightHasPosition(light) {
  return !!(
    light?.isDirectionalLight ||
    light?.isPointLight ||
    light?.isSpotLight ||
    light?.isRectAreaLight
  );
}

function _cldUpdateCatalogIconLightGizmoLine(helper) {
  const line = helper?.userData?.__cldIconLightLine;
  const light = helper?.userData?.__cldIconLight;
  if (!line || !light?.target) return;
  const pos = line.geometry.attributes.position;
  if (!pos) return;
  pos.setXYZ(0, helper.position.x, helper.position.y, helper.position.z);
  pos.setXYZ(1, light.target.position.x, light.target.position.y, light.target.position.z);
  pos.needsUpdate = true;
  line.geometry.computeBoundingSphere();
}

function _cldEnsureCatalogIconTransformControls() {
  if (_cldCatalogIconTransformControls) return _cldCatalogIconTransformControls;
  const tc = new TransformControls(camera, renderer.domElement);
  tc.setMode('translate');
  tc.setSize(0.8);
  tc.addEventListener('dragging-changed', (ev) => {
    if (controls) controls.enabled = !ev.value;
  });
  tc.addEventListener('objectChange', () => {
    const helper = tc.object;
    const light = helper?.userData?.__cldIconLight;
    if (!light) return;
    light.position.copy(helper.position);
    if (light.isDirectionalLight && light.target) {
      _cldUpdateCatalogIconLightGizmoLine(helper);
    }
    _cldRenderCatalogIconFrame();
  });
  scene.add(tc);
  _cldCatalogIconTransformControls = tc;
  return tc;
}

function _cldOnCatalogIconLightGizmoPick(ev) {
  if (!_cldCatalogIconShotActive || !_cldCatalogIconLightDebug?.pickables?.length) return;
  const rect = renderer.domElement.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((ev.clientX - rect.left) / rect.width) * 2 - 1,
    -((ev.clientY - rect.top) / rect.height) * 2 + 1
  );
  const ray = new THREE.Raycaster();
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(_cldCatalogIconLightDebug.pickables, false);
  if (!hits.length) return;
  const helper = hits[0].object;
  if (!helper.userData?.__cldIconLightDraggable) return;
  const tc = _cldEnsureCatalogIconTransformControls();
  tc.attach(helper);
  tc.visible = true;
  ev.preventDefault();
  ev.stopPropagation();
}

function _cldBindCatalogIconLightGizmoPick() {
  if (_cldCatalogIconLightGizmoPickBound || !renderer?.domElement) return;
  renderer.domElement.addEventListener('pointerdown', _cldOnCatalogIconLightGizmoPick, true);
  _cldCatalogIconLightGizmoPickBound = true;
}

function _cldUnbindCatalogIconLightGizmoPick() {
  if (!_cldCatalogIconLightGizmoPickBound || !renderer?.domElement) return;
  renderer.domElement.removeEventListener('pointerdown', _cldOnCatalogIconLightGizmoPick, true);
  _cldCatalogIconLightGizmoPickBound = false;
}

function _cldDisposeCatalogIconLightDebug() {
  if (_cldCatalogIconTransformControls) {
    _cldCatalogIconTransformControls.detach();
    _cldCatalogIconTransformControls.visible = false;
  }
  _cldUnbindCatalogIconLightGizmoPick();
  const dbg = _cldCatalogIconLightDebug;
  if (dbg?.group?.parent) dbg.group.parent.remove(dbg.group);
  for (const o of dbg?.disposables || []) {
    o.geometry?.dispose?.();
    if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
    else o.material?.dispose?.();
  }
  _cldCatalogIconLightDebug = null;
}

function _cldConvertCatalogIconGlobalLightsForGizmos(grp, span, lookAt) {
  const ambients = [];
  const hemis = [];
  grp.traverse((o) => {
    if (o.isAmbientLight && !o.userData.__cldIconGizmoProxy) ambients.push(o);
    if (o.isHemisphereLight && !o.userData.__cldIconGizmoProxy) hemis.push(o);
  });

  for (const amb of ambients) {
    const intens = amb.intensity;
    if (intens <= 0) continue;
    amb.intensity = 0;
    const pl = new THREE.PointLight(0xffffff, intens, span * 16, 1.6);
    pl.position.set(
      lookAt.x - span * 0.42,
      lookAt.y + span * 0.35,
      lookAt.z + span * 0.55
    );
    pl.userData.__cldIconLightName = 'ambient';
    pl.userData.__cldIconGizmoProxy = true;
    grp.add(pl);
  }

  for (const hm of hemis) {
    const intens = hm.intensity;
    if (intens <= 0) continue;
    hm.intensity = 0;
    const pl = new THREE.PointLight(0xe8f2ff, intens * 1.4, span * 16, 1.5);
    pl.position.set(lookAt.x, lookAt.y + span * 0.55, lookAt.z + span * 0.35);
    pl.userData.__cldIconLightName = 'hemi';
    pl.userData.__cldIconGizmoProxy = true;
    grp.add(pl);
  }
}

function _cldAttachCatalogIconLightDebug(lightGrp, span, lookAt) {
  _cldDisposeCatalogIconLightDebug();
  const group = new THREE.Group();
  group.name = '__cld_catalog_icon_light_gizmos';
  const disposables = [];
  const pickables = [];
  const radius = Math.max(span * 0.035, mmToU(28));
  const addMarker = (light, name, position) => {
    const color = _cldCatalogIconLightGizmoColor(name);
    const helper = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 20, 20),
      new THREE.MeshBasicMaterial({
        color,
        depthTest: false,
        transparent: true,
        opacity: 0.92,
      })
    );
    helper.position.copy(position);
    helper.renderOrder = 1200;
    helper.userData.__cldIconLight = light || null;
    helper.userData.__cldIconLightName = name;
    helper.userData.__cldIconLightDraggable = true;
    group.add(helper);
    disposables.push(helper);
    pickables.push(helper);

    if (light?.isDirectionalLight && light.target) {
      const lineGeom = new THREE.BufferGeometry().setFromPoints([
        helper.position.clone(),
        light.target.position.clone(),
      ]);
      const line = new THREE.Line(
        lineGeom,
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55, depthTest: false })
      );
      line.renderOrder = 1199;
      helper.userData.__cldIconLightLine = line;
      group.add(line);
      disposables.push(line);
    }
    return helper;
  };

  lightGrp.traverse((o) => {
    if ((o.isAmbientLight || o.isHemisphereLight) && o.intensity <= 0) return;
    if (o.isAmbientLight || o.isHemisphereLight) return;
    if (!_cldCatalogIconLightHasPosition(o)) return;
    const name = o.userData.__cldIconLightName || o.type;
    addMarker(o, name, o.position.clone());
  });

  scene.add(group);
  _cldCatalogIconLightDebug = { group, disposables, pickables };
  _cldBindCatalogIconLightGizmoPick();
  return _cldCatalogIconLightDebug;
}

function _cldSetCatalogIconLightGizmosVisible(visible) {
  if (_cldCatalogIconLightDebug?.group) {
    _cldCatalogIconLightDebug.group.visible = !!visible;
  }
  if (_cldCatalogIconTransformControls && !visible) {
    _cldCatalogIconTransformControls.detach();
    _cldCatalogIconTransformControls.visible = false;
  }
}

function _cldCatalogIconResolveOpeningIntensity(tuning, openW, openH) {
  const direct = Number(tuning.studioOpening);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const legacyLm = Number(tuning.studioOpeningPower);
  if (!Number.isFinite(legacyLm) || legacyLm <= 0) return 0;
  const tmp = new THREE.RectAreaLight(0xffffff, 1, openW, openH);
  tmp.power = legacyLm;
  return tmp.intensity;
}

async function _cldApplyCatalogIconLighting(lookAt, cameraPos, corpusSize, options = {}) {
  const tuning = _cldGetCatalogIconTuning();
  const saved = {
    ambient: ambient.intensity,
    hemi: hemi.intensity,
    dir: dir.intensity,
    fill: fill.intensity,
    exposure: renderer.toneMappingExposure,
    toneMapping: renderer.toneMapping,
    hemiGround: hemi.groundColor.clone(),
    sceneEnv: scene.environment,
    sceneBackground: scene.background,
    sceneFog: scene.fog,
    shadowMapEnabled: renderer.shadowMap.enabled,
    shadowMapType: renderer.shadowMap.type,
    useLegacyLights: renderer._useLegacyLights,
    shadowFlags: [],
    interiorEdges: _cldApplyCatalogIconInteriorEdges(rootGroup, tuning),
    shelfShadows: _cldApplyCatalogIconShelfContactShadows(
      rootGroup,
      tuning,
      _cldIconShotVisualBoundingBox(rootGroup).box
    ),
    materialTuning: _cldApplyCatalogIconMaterialTuning(rootGroup, corpusSize),
  };

  ambient.intensity = 0;
  hemi.intensity = 0;
  dir.intensity = 0;
  fill.intensity = 0;

  const envMap = _cldCatalogIconSourceOn(tuning, 'useSceneEnvironment')
    ? await _cldEnsureCatalogIconStudioEnvMap()
    : null;
  scene.environment = envMap || null;
  scene.background = new THREE.Color(CATALOG_ICON_WHITE_COLOR);
  const fogDensity = Number(tuning.iconFogDensity);
  if (fogDensity > 0) {
    scene.fog = new THREE.FogExp2(0xf6f6f6, fogDensity);
  } else {
    scene.fog = null;
  }

  renderer.shadowMap.enabled = false;
  const lightingModel = _cldGetIconLightingModel(tuning);
  renderer._useLegacyLights = lightingModel !== 'window';
  _cldApplyCatalogIconToneMapping(tuning);

  const grp = new THREE.Group();
  grp.name = '__cld_catalog_icon_lights';
  const cx = lookAt.x;
  const cy = lookAt.y;
  const cz = lookAt.z;
  const span = Math.max(
    corpusSize?.x || 600,
    corpusSize?.y || 2000,
    corpusSize?.z || 600,
    400
  );
  const depthZ = Math.max(corpusSize?.z || mmToU(500), mmToU(120));
  const backY = cy;
  const backZ = cz - depthZ * (Number(tuning.cavityBackFrac) || 0.46);
  const cavityMidZ = cz - depthZ * 0.22;

  const aimDirLight = (light, x, y, z, tx, ty, tz) => {
    const t = new THREE.Object3D();
    t.position.set(tx ?? cx, ty ?? cy, tz ?? cz);
    light.position.set(x, y, z);
    grp.add(t);
    light.target = t;
    grp.add(light);
  };

  if (_cldUsesWindowIconLighting(tuning)) {
    _cldEnsureRectAreaLightSupport();

    const winW = mmToU(Number(tuning.windowWidthMm) || 1800);
    const winH = mmToU(Number(tuning.windowHeightMm) || 1400);
    const windowLight = new THREE.RectAreaLight(
      Number(tuning.windowColor) || 0xc8d8e8,
      1,
      winW,
      winH
    );
    windowLight.power = Number(tuning.windowLumens) || 2600;
    windowLight.position.set(
      cx + span * (Number(tuning.windowOffsetX) || 0.52),
      cy + span * (Number(tuning.windowOffsetY) || 0.1),
      cz + span * (Number(tuning.windowOffsetZ) || 0.62)
    );
    windowLight.lookAt(cx, cy, cavityMidZ);
    grp.add(windowLight);

    const roomBounce = Number(tuning.roomBounce) || 0;
    if (roomBounce > 0) {
      grp.add(new THREE.HemisphereLight(0xb8cce0, 0x6e757c, roomBounce));
    }

    const ceilingLm = Number(tuning.ceilingLumens) || 0;
    if (ceilingLm > 0) {
      const ceiling = new THREE.PointLight(0xfff9f2, 1, span * 10, 2);
      ceiling.power = ceilingLm;
      ceiling.position.set(cx, cy + span * 1.05, cz);
      grp.add(ceiling);
    }

    const bounceLux = Number(tuning.cavityBounceLux) || 0;
    if (bounceLux > 0 && cameraPos) {
      const bounce = new THREE.DirectionalLight(0xe8eef5, bounceLux);
      aimDirLight(bounce, cameraPos.x, cameraPos.y, cameraPos.z, cx, backY, backZ);
    }
  } else if (_cldUsesStudioIconLighting(tuning)) {
    const amb = Number(tuning.iconAmbient) || 0;
    if (_cldCatalogIconSourceOn(tuning, 'iconAmbientOn') && amb > 0) {
      const ambLight = new THREE.AmbientLight(0xffffff, amb);
      ambLight.userData.__cldIconLightName = 'ambient';
      grp.add(ambLight);
    }

    const hemi = Number(tuning.hemiFill) || 0;
    if (_cldCatalogIconSourceOn(tuning, 'hemiFillOn') && hemi > 0) {
      const groundHex = _cldCatalogIconGrayToHex(Number(tuning.hemiGroundGray) || 192);
      const hemiLight = new THREE.HemisphereLight(0xf5f7ff, groundHex, hemi);
      hemiLight.userData.__cldIconLightName = 'hemi';
      grp.add(hemiLight);
    }

    const openW = Math.max(corpusSize?.x || mmToU(400), mmToU(120)) * 0.94;
    const openH = Math.max(corpusSize?.y || mmToU(2000), mmToU(200)) * 0.96;
    const openingInt = _cldCatalogIconResolveOpeningIntensity(tuning, openW, openH);
    if (_cldCatalogIconSourceOn(tuning, 'studioOpeningOn') && openingInt > 0) {
      _cldEnsureRectAreaLightSupport();
      const opening = new THREE.RectAreaLight(0xfffaf5, openingInt, openW, openH);
      opening.position.set(cx, cy, cz + depthZ * 0.52);
      opening.lookAt(cx, cy, cavityMidZ);
      opening.userData.__cldIconLightName = 'opening';
      grp.add(opening);
    }

    const key = Number(tuning.studioKey) || 0;
    if (_cldCatalogIconSourceOn(tuning, 'studioKeyOn') && key > 0) {
      const keyLight = new THREE.DirectionalLight(0xfff9f2, key);
      keyLight.userData.__cldIconLightName = 'key';
      aimDirLight(
        keyLight,
        cx,
        cy + span * 0.38,
        cz + span * 0.66,
        lookAt.x,
        lookAt.y,
        lookAt.z
      );
    }

    const fill = Number(tuning.studioFill) || 0;
    if (_cldCatalogIconSourceOn(tuning, 'studioFillOn') && fill > 0) {
      const fillLight = new THREE.DirectionalLight(0xffffff, fill);
      fillLight.userData.__cldIconLightName = 'fill';
      aimDirLight(
        fillLight,
        cx + span * 0.42,
        cy + span * 0.28,
        cz + span * 0.55,
        lookAt.x,
        lookAt.y,
        lookAt.z
      );
    }

    const backFill = Number(tuning.studioBackFill) || 0;
    if (_cldCatalogIconSourceOn(tuning, 'studioBackFillOn') && backFill > 0) {
      const backFillLight = new THREE.DirectionalLight(0xfff8f2, backFill);
      backFillLight.userData.__cldIconLightName = 'backFill';
      aimDirLight(
        backFillLight,
        cx,
        cy + span * 0.35,
        cz + span * 0.52,
        cx,
        backY,
        backZ
      );
    }

    const rim = Number(tuning.studioRim) || 0;
    if (_cldCatalogIconSourceOn(tuning, 'studioRimOn') && rim > 0) {
      const rimLight = new THREE.DirectionalLight(0xdce4f0, rim);
      rimLight.userData.__cldIconLightName = 'rim';
      aimDirLight(
        rimLight,
        cx + span * 0.1,
        cy + span * 0.25,
        cz - span * 0.75,
        cx,
        cy,
        cz
      );
    }

    const top = Number(tuning.studioTop) || 0;
    if (_cldCatalogIconSourceOn(tuning, 'studioTopOn') && top > 0) {
      const topLight = new THREE.DirectionalLight(0xffffff, top);
      topLight.userData.__cldIconLightName = 'top';
      aimDirLight(
        topLight,
        cx,
        cy + span * 0.95,
        cz + span * 0.22,
        lookAt.x,
        lookAt.y,
        lookAt.z
      );
    }

    const inner = Number(tuning.studioInner ?? tuning.cavityDirect) || 0;
    if (_cldCatalogIconSourceOn(tuning, 'studioInnerOn') && inner > 0) {
      const innerFromCamera = Number(tuning.studioInnerFromCamera) === 1;
      const innerEvenRaw = Number(tuning.studioInnerEven);
      const innerEven = Number.isFinite(innerEvenRaw) ? Math.min(1, Math.max(0, innerEvenRaw)) : 0.92;

      if (innerFromCamera && cameraPos) {
        const innerLight = new THREE.DirectionalLight(0xffffff, inner);
        innerLight.userData.__cldIconLightName = 'inner';
        aimDirLight(innerLight, cameraPos.x, cameraPos.y, cameraPos.z, cx, backY, backZ);
      } else if (cameraPos && innerEven >= 1) {
        const innerDir = new THREE.DirectionalLight(0xfff9f5, inner);
        innerDir.userData.__cldIconLightName = 'inner';
        aimDirLight(
          innerDir,
          cameraPos.x,
          cameraPos.y,
          cameraPos.z,
          lookAt.x,
          lookAt.y,
          lookAt.z
        );
      } else if (cameraPos && innerEven > 0 && innerEven < 1) {
        const dirPart = inner * innerEven;
        const ptPart = inner * (1 - innerEven);
        if (dirPart > 0) {
          const innerDir = new THREE.DirectionalLight(0xfff9f5, dirPart);
          innerDir.userData.__cldIconLightName = 'inner';
          aimDirLight(
            innerDir,
            cameraPos.x,
            cameraPos.y,
            cameraPos.z,
            lookAt.x,
            lookAt.y,
            lookAt.z
          );
        }
        if (ptPart > 0) {
          const innerRange = span * (Number(tuning.studioInnerRange) || 3.4);
          const innerDecay = Number(tuning.studioInnerDecay) || 1.6;
          const cavityPt = new THREE.PointLight(0xfff9f5, ptPart, innerRange, innerDecay);
          cavityPt.position.set(lookAt.x, lookAt.y, lookAt.z);
          cavityPt.userData.__cldIconLightName = 'innerPt';
          grp.add(cavityPt);
        }
      } else {
        const innerRange = span * (Number(tuning.studioInnerRange) || 3.4);
        const innerDecay = Number(tuning.studioInnerDecay) || 1.6;
        const cavityPt = new THREE.PointLight(0xfff9f5, inner, innerRange, innerDecay);
        cavityPt.position.set(lookAt.x, lookAt.y, lookAt.z);
        cavityPt.userData.__cldIconLightName = 'inner';
        grp.add(cavityPt);
      }
    }

    const lowFill = Number(tuning.studioLowFill) || 0;
    if (_cldCatalogIconSourceOn(tuning, 'studioLowFillOn') && lowFill > 0) {
      const lowFillLight = new THREE.DirectionalLight(0xfff6f0, lowFill);
      lowFillLight.userData.__cldIconLightName = 'lowFill';
      aimDirLight(
        lowFillLight,
        cx,
        cy - span * 0.38,
        cz + span * 0.48,
        cx,
        cy - span * 0.06,
        cavityMidZ
      );
    }
  } else {
    const iconLightColor = 0xfff8f4;

    if (tuning.iconAmbient > 0) {
      grp.add(new THREE.AmbientLight(0xffffff, tuning.iconAmbient));
    }

    if (tuning.hemiFill > 0) {
      const ground = Number(tuning.hemiGroundGray) || 0xb4b4b4;
      grp.add(new THREE.HemisphereLight(0xf4f6ff, ground, tuning.hemiFill));
    }

    const topIntensity = Number(tuning.topKey ?? tuning.shelfTopKey) || 0;
    if (topIntensity > 0) {
      const top = new THREE.DirectionalLight(iconLightColor, topIntensity);
      aimDirLight(
        top,
        cx,
        cy + span * (Number(tuning.topKeyY) || 1.05),
        cz + span * 0.12,
        cx,
        cy,
        cavityMidZ
      );
    }

    const cavityDirect = Number(tuning.cavityDirect ?? tuning.innerCamFill) || 0;
    if (cavityDirect > 0 && cameraPos) {
      const into = new THREE.DirectionalLight(iconLightColor, cavityDirect);
      aimDirLight(into, cameraPos.x, cameraPos.y, cameraPos.z, cx, backY, backZ);
    }
  }

  if (_cldUsesLegacyIconLighting(tuning) && tuning.daylightKey > 0) {
    const day = new THREE.DirectionalLight(0xfff6ee, Number(tuning.daylightKey) || 0.55);
    const src = cameraPos
      ? new THREE.Vector3(
        cameraPos.x + span * (Number(tuning.daylightX) || -0.1),
        cameraPos.y + span * (Number(tuning.daylightY) || 0.28),
        cameraPos.z + span * (Number(tuning.daylightZ) || 0.06)
      )
      : new THREE.Vector3(cx, cy + span * 0.42, cz + span * 0.85);
    aimDirLight(day, src.x, src.y, src.z, cx, backY, backZ);
  }

  const aimDirLightLegacy = (light, x, y, z) => {
    aimDirLight(light, x, y, z, cx, cy, cz);
  };

  if (_cldUsesLegacyIconLighting(tuning) && tuning.innerKey > 0) {
    const inner = new THREE.DirectionalLight(0xffffff, tuning.innerKey);
    aimDirLightLegacy(
      inner,
      cx,
      cy + span * (Number(tuning.innerKeyY) || 0.84),
      cz + span * (Number(tuning.innerKeyZ) || 0.5)
    );
  }

  if (_cldUsesLegacyIconLighting(tuning) && tuning.sideKey > 0) {
    const side = new THREE.DirectionalLight(0xffffff, tuning.sideKey);
    aimDirLightLegacy(
      side,
      cx + span * (Number(tuning.sideKeyX) || 0.55),
      cy + span * (Number(tuning.sideKeyY) || 0.48),
      cz + span * (Number(tuning.sideKeyZ) || 0.85)
    );
  }

  if (_cldUsesLegacyIconLighting(tuning) && tuning.innerBack > 0) {
    const back = new THREE.DirectionalLight(0xffffff, tuning.innerBack);
    aimDirLightLegacy(back, cx, cy + span * 0.35, cz - span * 0.9);
  }

  if (_cldUsesLegacyIconLighting(tuning) && tuning.cavityFill > 0) {
    const cavity = new THREE.DirectionalLight(0xffffff, tuning.cavityFill);
    aimDirLightLegacy(cavity, cx, cy + span * 0.42, cz - span * 0.92);
  }

  if (_cldUsesLegacyIconLighting(tuning) && tuning.shelfTopKey > 0) {
    const top = new THREE.DirectionalLight(0xffffff, tuning.shelfTopKey);
    aimDirLightLegacy(top, cx, cy + span * 0.88, cz + span * 0.42);
  }

  if (_cldUsesLegacyIconLighting(tuning) && tuning.innerCamFill > 0 && cameraPos) {
    const camFill = new THREE.DirectionalLight(0xffffff, tuning.innerCamFill);
    camFill.position.copy(cameraPos);
    const t = new THREE.Object3D();
    t.position.set(cx, cy, cz);
    grp.add(t);
    camFill.target = t;
    grp.add(camFill);
  }

  if (_cldUsesLegacyIconLighting(tuning) && tuning.cavitySpot > 0 && cameraPos) {
    const spotDist = span * 6;
    const spot = new THREE.SpotLight(
      0xffffff,
      Number(tuning.cavitySpot) || 0.34,
      spotDist,
      Number(tuning.cavitySpotAngle) || 0.62,
      Number(tuning.cavitySpotPenumbra) || 0.55,
      1
    );
    spot.castShadow = false;
    spot.position.copy(cameraPos);
    const cavityTarget = new THREE.Object3D();
    cavityTarget.position.set(cx, backY, backZ);
    grp.add(cavityTarget);
    spot.target = cavityTarget;
    grp.add(spot);
  }

  if (_cldUsesLegacyIconLighting(tuning) && tuning.rimFill > 0 && cameraPos) {
    const rim = new THREE.DirectionalLight(0xffffff, tuning.rimFill);
    rim.position.copy(cameraPos);
    const t = new THREE.Object3D();
    t.position.set(cx, cy, cz);
    grp.add(t);
    rim.target = t;
    grp.add(rim);
  }

  scene.add(grp);
  const showGizmos = !!options.showLightGizmos && tuning.showIconLightGizmos !== 0;
  let lightDebug = null;
  if (showGizmos) {
    _cldConvertCatalogIconGlobalLightsForGizmos(grp, span, lookAt);
    lightDebug = _cldAttachCatalogIconLightDebug(grp, span, lookAt);
  }
  return { saved, grp, lightDebug };
}

function _cldRestoreCatalogIconLighting(state) {
  if (!state) return;
  _cldDisposeCatalogIconLightDebug();
  const { saved, grp } = state;
  ambient.intensity = saved.ambient;
  hemi.intensity = saved.hemi;
  dir.intensity = saved.dir;
  fill.intensity = saved.fill;
  renderer.toneMappingExposure = saved.exposure;
  if (saved.toneMapping != null) renderer.toneMapping = saved.toneMapping;
  if (saved.hemiGround) hemi.groundColor.copy(saved.hemiGround);
  scene.environment = saved.sceneEnv ?? null;
  if (saved.sceneBackground != null) scene.background = saved.sceneBackground;
  scene.fog = saved.sceneFog ?? null;
  _cldRestoreCatalogIconShadowFlags(saved.shadowFlags);
  renderer.shadowMap.enabled = saved.shadowMapEnabled;
  if (saved.shadowMapType != null) renderer.shadowMap.type = saved.shadowMapType;
  if (saved.useLegacyLights != null) renderer._useLegacyLights = saved.useLegacyLights;
  _cldRestoreCatalogIconMaterialTuning(saved.materialTuning);
  _cldRestoreCatalogIconInteriorEdges(saved.interiorEdges);
  _cldRestoreCatalogIconShelfShadows(saved.shelfShadows);
  if (grp?.parent) grp.parent.remove(grp);
}

async function _cldApplyCatalogIconShotState(options = {}) {
  const resize = options.resize || null;
  const tuning = _cldGetCatalogIconTuning();
  window.__cldCatalogIconDoorDeg = tuning.doorOpenDeg;

  const state = {
    camPos: camera.position.clone(),
    camTarget: controls ? controls.target.clone() : null,
    camFov: camera.fov,
    camNear: camera.near,
    camFar: camera.far,
    camAspect: camera.aspect,
    rendererW: renderer.domElement.width,
    rendererH: renderer.domElement.height,
    rootPos: rootGroup ? rootGroup.position.clone() : null,
    doorSnaps: _cldSnapshotSwingDoorStates(),
    previewDoorsOpen: __cldPreviewDoorsOpen,
    catalogIconShot: !!(rootGroup && typeof THREE !== 'undefined'),
    hiddenOverlays: null,
    hiddenPlinth: null,
    hiddenTechnical: null,
    hiddenEdgeHelpers: null,
    catalogIconLighting: null,
    doorsOpenedForShot: false,
    resized: !!resize,
  };

  if (!state.catalogIconShot) return state;

  _cldCatalogIconShotActive = true;
  _cldCatalogIconThumbnailExport = !!resize;

  state.hiddenOverlays = _cldHideCatalogScreenshotOverlays();
  state.hiddenPlinth = _cldHidePlinthAndSupportsForIcon();
  state.hiddenTechnical = _cldHideCatalogIconTechnicalMeshes();
  state.hiddenEdgeHelpers = _cldHideCatalogIconEdgeHelpers();

  rootGroup.updateMatrixWorld(true);
  let { box: corpusBox } = _cldCorpusIconBoundingBox(rootGroup);
  state.rootPos = _cldAlignRootGroupBottomOnFloor(corpusBox) || state.rootPos;
  rootGroup.updateMatrixWorld(true);
  corpusBox = _cldCorpusIconBoundingBox(rootGroup).box;

  state.doorsOpenedForShot = _cldModuleHasSwingDoorsForIcon();
  if (state.doorsOpenedForShot) {
    _cldApplyCatalogIconSwingDoorsOpen();
  }

  if (resize) {
    renderer.setSize(resize.w, resize.h, false);
    camera.aspect = resize.w / resize.h;
  }

  _cldFitCatalogIconCamera(rootGroup, _cldCatalogIconCameraFitBox(rootGroup, corpusBox));
  const lookAt = controls
    ? controls.target.clone()
    : corpusBox.getCenter(new THREE.Vector3());
  state.catalogIconLighting = await _cldApplyCatalogIconLighting(
    lookAt,
    camera.position,
    corpusBox.getSize(new THREE.Vector3()),
    {
      showLightGizmos: options.showLightGizmos !== false && !resize && tuning.showIconLightGizmos !== 0,
    }
  );

  if (controls) controls.update();
  return state;
}

function _cldRestoreCatalogIconShotState(state) {
  if (!state?.catalogIconShot) return;
  _cldRestoreCatalogIconLighting(state.catalogIconLighting);
  if (state.resized) {
    renderer.setSize(state.rendererW, state.rendererH, false);
    camera.aspect = state.camAspect;
  }
  camera.position.copy(state.camPos);
  camera.fov = state.camFov;
  camera.near = state.camNear;
  camera.far = state.camFar;
  camera.updateProjectionMatrix();
  if (controls && state.camTarget) {
    controls.target.copy(state.camTarget);
    controls.update();
  }
  if (rootGroup && state.rootPos) {
    rootGroup.position.copy(state.rootPos);
    rootGroup.updateMatrixWorld(true);
  }
  _cldRestoreSwingDoorStates(state.doorSnaps);
  __cldPreviewDoorsOpen = state.previewDoorsOpen;
  _cldRestoreCatalogScreenshotOverlays(state.hiddenOverlays);
  _cldRestoreCatalogScreenshotOverlays(state.hiddenPlinth);
  _cldRestoreCatalogIconHiddenMeshes(state.hiddenTechnical);
  _cldRestoreCatalogIconEdgeHelpers(state.hiddenEdgeHelpers);
  _cldCatalogIconShotActive = false;
  _cldCatalogIconThumbnailExport = false;
}

async function _cldRefreshCatalogIconPreview(options = {}) {
  const preserveView = options.preserveView === true;

  if (preserveView && _cldCatalogIconPreviewSession?.catalogIconShot) {
    const ok = await _cldReapplyCatalogIconLightingPreserveView();
    if (ok) _cldRenderCatalogIconFrame();
    return;
  }

  if (_cldCatalogIconPreviewSession) {
    _cldRestoreCatalogIconShotState(_cldCatalogIconPreviewSession);
    _cldCatalogIconPreviewSession = null;
  }
  _cldCatalogIconPreviewSession = await _cldApplyCatalogIconShotState();
  _cldRenderCatalogIconFrame();
}

function _cldExitCatalogIconPreview() {
  if (!_cldCatalogIconPreviewSession) return;
  _cldRestoreCatalogIconShotState(_cldCatalogIconPreviewSession);
  _cldCatalogIconPreviewSession = null;
  renderer.render(scene, camera);
}

// Каталожный скрин: реф make_icon + crop tall/low.
async function makeScreenshot() {
  let shotState = null;
  const savedPreviewSession = _cldCatalogIconPreviewSession;

  const postScreenshotMessage = (payload) => {
    if (!window.parent || window.parent === window) return;
    try {
      window.parent.postMessage(
        { source: 'constructor-clodis', ...payload },
        '*'
      );
    } catch (_) {}
  };

  try {
    if (!renderer || !scene || !camera) {
      postScreenshotMessage({ type: 'cld:screenshotReady', error: 'no-renderer' });
      return;
    }
    if (!window.__cldWebGLAvailable || renderer.domElement?.tagName !== 'CANVAS') {
      postScreenshotMessage({ type: 'cld:screenshotReady', error: 'no-webgl' });
      return;
    }

    const iconAspect = normalizeCatalogIconAspect(window.__cldScreenshotIconAspect || 'tall');
    const exportSize = catalogScreenshotExportSize(iconAspect);
    _cldCatalogIconThumbnailExport = true;
    const tuning = _cldGetCatalogIconTuning();
    const renderScale = Math.max(2, Math.min(4, Number(tuning.renderScale) || 3));
    const renderW = Math.max(exportSize.w * renderScale, 400);
    const renderH = Math.max(exportSize.h * renderScale, 400);

    if (savedPreviewSession) {
      _cldRestoreCatalogIconShotState(savedPreviewSession);
      _cldCatalogIconPreviewSession = null;
    }

    shotState = await _cldApplyCatalogIconShotState({
      resize: { w: renderW, h: renderH },
      showLightGizmos: false,
    });
    const doorsOpenedForShot = !!shotState.doorsOpenedForShot;

    await _cldRunPreviewDrawerHandles();
    if (typeof globalThis.__cldAwaitDrawerHandleLoads === 'function') {
      await globalThis.__cldAwaitDrawerHandleLoads(4000);
    }

    _cldRenderCatalogIconFrame();
    const rawDataUrl = renderer.domElement.toDataURL('image/png');
    if (!rawDataUrl || rawDataUrl.length < 64) {
      postScreenshotMessage({ type: 'cld:screenshotReady', error: 'empty-canvas' });
      return;
    }
    const dataUrl = await cropDataUrlToCatalogIconAspect(rawDataUrl, iconAspect, {
      contentFill: tuning.contentFill,
      shadowLift: tuning.shadowLift,
      thumbnailClarity: tuning.thumbnailClarity,
    });
    if (!dataUrl || dataUrl.length < 64) {
      postScreenshotMessage({ type: 'cld:screenshotReady', error: 'empty-crop' });
      return;
    }

    postScreenshotMessage({
      type: 'cld:screenshotReady',
      dataUrl,
      smartFit: shotState.catalogIconShot,
      iconAspect,
      doorsOpenedForShot,
    });
  } catch (e) {
    console.error('[Clodis][constructor-clodis] makeScreenshot error', e);
    postScreenshotMessage({
      type: 'cld:screenshotReady',
      error: e?.message || String(e),
    });
  } finally {
    _cldCatalogIconThumbnailExport = false;
    if (shotState) {
      try {
        _cldRestoreCatalogIconShotState(shotState);
      } catch (restoreErr) {
        console.error('[Clodis][constructor-clodis] makeScreenshot restore error', restoreErr);
      }
    }
    if (!_cldCatalogIconShotActive) {
      try {
        renderer.render(scene, camera);
      } catch (_) {}
    }
  }
}

function _updateCldIframeDoorSwingAnimations() {
  const speed = 0.07; // в 2 раза медленнее
  for (let i = _cldIframeDoorSwingGroups.length - 1; i >= 0; i--) {
    const g = _cldIframeDoorSwingGroups[i];
    if (!g || !g.parent) {
      _cldIframeDoorSwingGroups.splice(i, 1);
      continue;
    }
    const sw = g.userData?.cldDoorSwing;
    if (!sw) continue;
    const tgt = sw.targetAngle ?? 0;
    let cur = sw.currentAngle ?? 0;
    const da = tgt - cur;
    if (Math.abs(da) < 0.002) {
      cur = tgt;
    } else {
      cur += da * speed;
    }
    sw.currentAngle = cur;
    if (sw.axis === 'y') g.rotation.y = cur;
    else if (sw.axis === 'x') g.rotation.x = cur;
    else if (sw.axis === 'z') g.rotation.z = cur;
  }
}

function _updateCldIframeSlideAnimations() {
  const speed = 0.1;
  for (let i = _cldIframeSlideGroups.length - 1; i >= 0; i--) {
    const own = _cldIframeSlideGroups[i];
    if (!own || !own.parent) {
      _cldIframeSlideGroups.splice(i, 1);
      continue;
    }
    const sl = own.userData?.cldSlide;
    if (!sl) continue;
    if (sl.slideMaster) {
      const m = sl.slideMaster.userData?.cldSlide;
      if (m) {
        sl.isOpen = !!m.isOpen;
        const ratio = m.travelU > 0 ? (m.currentOffset ?? 0) / m.travelU : 0;
        sl.currentOffset = (sl.travelU ?? 0) * ratio;
        _cldApplySlideOwnPosition(own, sl);
      }
      continue;
    }
    const tgt = sl.targetOffset ?? 0;
    let cur = sl.currentOffset ?? 0;
    const da = tgt - cur;
    if (Math.abs(da) < 0.002) {
      cur = tgt;
    } else {
      cur += da * speed;
    }
    sl.currentOffset = cur;
    _cldApplySlideOwnPosition(own, sl);
  }
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  _updateCldIframeDoorSwingAnimations();
  _updateCldIframeSlideAnimations();
  render();
}

rebuild();
animate();

// Студийный IBL — после всех const/let каталожной иконки (не в init renderer).
if (_realGlRenderer) {
  _cldEnsureCatalogIconStudioEnvMap().catch((e) => {
    console.warn('[Clodis][catalog-icon] studio IBL preload:', e);
  });
}

// Экспорт API в window для управления из админки (iframe.contentWindow)
window.resetCameraToDefault = resetCameraToDefault;
window.updateOutlineModes = updateOutlineModes;
window.__cldReapplyJointHardwareOnTop = _reapplyJointSchemeHardwareOnTop;
window.__cldRenderJointMarkers = function __cldRenderJointMarkers() {
  try {
    _hydrateJointSchemesStoreFromTemplateTree();
    _renderJointMarkers();
    try {
      _reapplyJointSchemeHardwareOnTop();
    } catch (_) {}
    render();
  } catch (e) {
    console.warn('[CLD-JOINT][iframe] __cldRenderJointMarkers failed', e);
  }
};
window.makeScreenshot = makeScreenshot;
window.__cldCatalogIconTuningDefaults = () => JSON.parse(JSON.stringify(CATALOG_ICON_TUNING_DEFAULTS));
window.__cldGetCatalogIconTuning = _cldGetCatalogIconTuning;
window.__cldSetCatalogIconTuning = (patch) => {
  const base = window.__cldCatalogIconTuning && typeof window.__cldCatalogIconTuning === 'object'
    ? window.__cldCatalogIconTuning
    : {};
  window.__cldCatalogIconTuning = { ...base, ...patch };
};
window.__cldResetCatalogIconTuning = () => {
  delete window.__cldCatalogIconTuning;
};
window.__cldRefreshCatalogIconPreview = _cldRefreshCatalogIconPreview;
window.__cldExitCatalogIconPreview = _cldExitCatalogIconPreview;
window.__cldSetCatalogIconLightGizmosVisible = _cldSetCatalogIconLightGizmosVisible;

