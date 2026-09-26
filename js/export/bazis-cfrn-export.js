import { state } from '../utils/state.js';
import { STLExporter } from '/node_modules/three/examples/jsm/exporters/STLExporter.js';
import {
  getJointTemplatePlacementsUnified,
  normalizeJointHoleForFitting,
  jointTemplateHolesForSetup,
  resolveJointDrillTemplateSetupType,
  identifySetup3FaceEdgePanels,
  resolveJointSchemeStationsMm,
  jointSeamGeomLenPreferContactMm,
  jointSeamWorldPoint,
  resolveSchemeMinSeamWidthMm,
} from '../joint-fitting-resolve.js?v=20260727-drawer-holes';
import { contactAllowsSchemeBySeamWidth } from '../joint-engine-v2.js?v=20260727-ecc-export';
import { resolveContactForJointSchemeEntry } from '../joint-toret-plast-detect.js?v=20260727-ecc-export';
import { getBazisExportSettings } from './bazis-export-settings.js';
import { createBazisMaterialResolver } from './bazis-material-resolve.js';
import { setCatalogHorizontalTopVisible } from '../furniture/furniture-bbox.js?v=20260918-htop-catalog';

const BAZIS_API_KEY = 'e453ab6926db4fc3a7118f6306ecf586';
/** Комната (state.scene): 1 юнит = 1 мм (см. state.js ROOM_*). Не путать с preview constructor-clodis (UNITS_MM=10). */
const CLD_SCENE_MM = 1;

/** Крыша модуля (админка) + TransitionTopCap/AutoTop (§6.4) — в CFRN/Базис. */
function isTransitionTopOrSideExportMesh(ud) {
  if (!ud) return false;
  return !!(
    ud.isTransitionTopCap ||
    ud.isTransitionAutoTopCap ||
    ud.isTransitionSideCap ||
    ud.isTransitionHeightMismatch
  );
}

/**
 * Перед сбором CFRN: каталожная Крышка могла быть hidden (старый hide под Transition).
 * Без этого в Базисе тумбы/комоды без верха, хотя в комнате виден №15.
 */
function ensureCatalogHorizontalTopsVisibleForCfrn() {
  if (!state?.scene) return 0;
  let n = 0;
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || obj.userData?.isFurniture !== true) return;
    if (obj.userData?.isGhost || obj.userData?.isEndCabinetSlot) return;
    if (setCatalogHorizontalTopVisible(obj, true)) n += 1;
  });
  if (n > 0) console.log(`[CFRN] каталожные Крышки снова visible: ${n} модул.`);
  return n;
}

function safeNowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function getJSZip() {
  if (window.JSZip) return window.JSZip;
  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-cld-jszip="${src}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve(window.JSZip), { once: true });
        existing.addEventListener('error', () => reject(new Error(`Не удалось загрузить ${src}`)), { once: true });
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.dataset.cldJszip = src;
      s.onload = () => resolve(window.JSZip);
      s.onerror = () => reject(new Error(`Не удалось загрузить ${src}`));
      document.head.appendChild(s);
    });

  try {
    await loadScript('/node_modules/jszip/dist/jszip.min.js');
  } catch (_) {
    await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
  }

  const ctor = window.JSZip;
  if (!ctor) throw new Error('JSZip не удалось загрузить.');
  return ctor;
}

function _isVisualOnly(obj) {
  let cur = obj;
  while (cur) {
    if (cur.userData?.isVisualOnly) return true;
    cur = cur.parent;
  }
  return false;
}

/** Превью Hole_* / присадка — не плитная деталь и не STL в CFRN (иначе в Базисе «глубокие цилиндры»). */
function isUnderHolePreview(obj) {
  let p = obj;
  while (p) {
    if (p.userData?.isHole) return true;
    if (String(p.name || '').startsWith('Hole_')) return true;
    p = p.parent;
  }
  return false;
}

function matrixWorld16(obj) {
  if (!obj) return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  obj.updateMatrixWorld(true);
  const m = Array.from(obj.matrixWorld.elements);
  for (let i = 0; i < m.length; i++) {
    if (Math.abs(m[i]) < 1e-10) m[i] = 0;
  }
  return m;
}

/** Матрица CFRN из кадра шаблона стыка (O + eX/eY/eZ) — как own_object фурнитуры в рефе. */
function matrix16FromJointTemplateFrame(frame) {
  if (!frame?.O || !frame?.eX || !frame?.eY || !frame?.eZ) {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }
  const m = new THREE.Matrix4().makeBasis(
    frame.eX.clone().normalize(),
    frame.eY.clone().normalize(),
    frame.eZ.clone().normalize(),
  );
  m.setPosition(frame.O.clone());
  const arr = Array.from(m.elements);
  for (let i = 0; i < arr.length; i++) {
    if (Math.abs(arr[i]) < 1e-10) arr[i] = 0;
  }
  return arr;
}

function hingeDrillHoleFrameNode(mount) {
  const DR = typeof globalThis !== 'undefined' ? globalThis.__CLD_DRILL_RESOLVE : null;
  if (DR && typeof DR.exportFrameForMount === 'function') {
    return DR.exportFrameForMount(mount) || mount;
  }
  if (!mount || typeof mount.getObjectByName !== 'function') return mount;
  const own = mount.getObjectByName('__furniture_own');
  return own || mount;
}

/**
 * STL каталожного Model_* (опоры, направляющие, L-половины…):
 * геометрия в локали корня + matrix = matrixWorld(root).
 * Одна политика CAD single-chain — без ветки guide world+I.
 */
function catalogCabinetModelGeoAndMatrix(mesh) {
  const cabRoot = findCabinetModelRoot(mesh);
  if (!cabRoot || !mesh?.geometry) return null;
  mesh.updateMatrixWorld(true);
  cabRoot.updateMatrixWorld(true);
  const geo = mesh.geometry.clone();
  const toLocal = new THREE.Matrix4()
    .copy(cabRoot.matrixWorld)
    .invert()
    .multiply(mesh.matrixWorld);
  geo.applyMatrix4(toLocal);
  geo.computeBoundingBox();
  return {
    geo,
    matrix: matrixWorld16(cabRoot),
    frame: cabRoot,
    isLSeam: !!(
      cabRoot.userData?.fromDrillTemplateModel || mesh.userData?.fromDrillTemplateModel
    ),
  };
}

/** Matrix CFRN для присадки = own_object / __furniture_own (реф. exportToCFRN). */

function findCabinetModelRoot(obj) {
  let p = obj;
  for (let i = 0; i < 20 && p; i++) {
    if (p.userData?.isCabinetModel) return p;
    p = p.parent;
  }
  return null;
}

function isUnderCabinetModel(obj) {
  return !!findCabinetModelRoot(obj);
}

/** Серый BoxGeometry из buildModel, пока не подгрузился GLB/FBX из cabinet_model. */
function isCabinetModelPlaceholderMesh(mesh) {
  if (!mesh?.isMesh) return false;
  if (!String(mesh.name || '').startsWith('ModelPlaceholder_')) return false;
  return !!findCabinetModelRoot(mesh);
}

/**
 * Реальная геометрия из каталога (опоры, ручки, петли…) под group Model_*.
 * Петли — отдельно isCatalogHingeModelMesh; опоры и прочее — любой меш, не плейсхолдер.
 */
function isCatalogCabinetModelMesh(mesh) {
  if (!mesh?.isMesh || isCabinetModelPlaceholderMesh(mesh)) return false;
  if (isCatalogHingeModelMesh(mesh)) return true;
  const root = findCabinetModelRoot(mesh);
  if (!root) return false;
  return true;
}

function isExportableMesh(obj) {
  if (!obj || !obj.isMesh || obj.visible === false) return false;
  const ud = obj.userData || {};
  if (isUnderHolePreview(obj)) return false;
  if (ud.isUncutEdge || ud.cldSectionTrimUncut) return false;
  if (ud.isTransitionTopCapEdgeFrame) return false;
  if (isCatalogHingeModelMesh(obj)) return true;
  if (isCatalogCabinetModelMesh(obj)) return true;
  if (ud.isWallAo || ud.isContactShadow || ud.isWallPlane || ud.isCeiling) return false;
  if (ud.isEdge) return false;
  if (ud.isSectionNicheDebugPart || ud.isCornerPlankDebugMarker) return false;
  if (_isVisualOnly(obj)) return false;
  const bazis = getBazisExportSettings();
  if (bazis.template_accsessories && ud.isAccessory && isUnderCabinetModel(obj)) return true;
  if (ud.isTopPlank || ud.isBottomPlank || ud.isSidePlank || ud.isSideOverlay) return true;
  // №14/15 / HM: на scene, не под isFurniture — иначе в Базисе нет топов тумб.
  if (isTransitionTopOrSideExportMesh(ud)) return true;
  if (ud.isFurniture) return true;
  let p = obj.parent;
  while (p) {
    if (p.userData?.isFurniture) return true;
    p = p.parent;
  }
  if (ud.isShelfPlank || ud.isBackPlank) return true;
  return false;
}

function isPlank(ud) {
  return !!(ud.isTopPlank || ud.isBottomPlank || ud.isSidePlank || ud.isSideOverlay || ud.isShelfPlank || ud.isBackPlank);
}

function plankLabel(ud) {
  if (ud.isTopPlank) return 'Верхняя стенка';
  if (ud.isBottomPlank) return 'Нижняя стенка';
  if (ud.isSidePlank) return 'Боковая стенка';
  if (ud.isSideOverlay) return 'Накладка боковая';
  if (ud.isShelfPlank) return 'Полка';
  if (ud.isBackPlank) return 'Задняя стенка';
  return 'Панель';
}

function defaultPanelName(obj, ud) {
  const n = String(obj?.name || '').trim();
  if (n) return n;
  return plankLabel(ud || {});
}

/** Подпись материала для textMatInPanelName (реф. text_mat). */
function resolvePanelMaterialLabel(mesh) {
  let p = mesh;
  for (let i = 0; i < 12 && p; i++) {
    const ud = p.userData || {};
    const direct =
      String(ud.material_name || ud.materialName || ud.catalogMaterialName || '').trim();
    if (direct) return direct;
    const butts = ud.__cldButts;
    if (Array.isArray(butts) && butts.length) {
      const fromButt = String(butts[0]?.materialName || '').trim();
      if (fromButt && !/^кромка/i.test(fromButt)) return fromButt;
    }
    if (ud.isFacade && ud.step5DecorChannel === 'outside') {
      return 'Фасад';
    }
    p = p.parent;
  }
  return '';
}

function rectContour(w, h) {
  return {
    elemType: 4,
    list: [
      { elemType: 1, pos1: { x: 0, y: 0 }, pos2: { x: w, y: 0 } },
      { elemType: 1, pos1: { x: w, y: 0 }, pos2: { x: w, y: h } },
      { elemType: 1, pos1: { x: w, y: h }, pos2: { x: 0, y: h } },
      { elemType: 1, pos1: { x: 0, y: h }, pos2: { x: 0, y: 0 } },
    ],
  };
}

/** Мета паза с core / wallGroup (узел type:path в конструкторе). */
function resolvePanelGroovesMeta(mesh) {
  let p = mesh;
  for (let i = 0; i < 12 && p; i++) {
    const list = p.userData?.__cldGrooves;
    if (Array.isArray(list) && list.length) return list;
    p = p.parent;
  }
  return null;
}

function clampGrooveAxis(v, halfW, span) {
  const maxY = Math.max(halfW, (Number(span) || 0) - halfW);
  let y = Number(v);
  if (!Number.isFinite(y)) y = halfW;
  return Math.min(Math.max(y, halfW), maxY);
}

/**
 * Паз из узла path: contour = width×depth, trajectory вдоль панели.
 * offsetAlongMm — отступ от низа (ch) или от края (cw) в локали CFRN панели.
 */
function buildPathGrooveCfrn(cw, ch, grooveMeta) {
  const widthMm = Number(grooveMeta?.widthMm) || 4;
  const depthMm = Number(grooveMeta?.depthMm) || 5;
  const halfW = Math.max(0.5, widthMm / 2);
  const dz = Number(grooveMeta?.dz) || 0;
  const dz2 = Number(grooveMeta?.dz2) || 0;
  const trajOrient = String(grooveMeta?.trajOrient || 'h').toLowerCase() === 'v' ? 'v' : 'h';
  const name = String(grooveMeta?.name || 'Паз');

  let trajectory;
  if (Array.isArray(grooveMeta?.trajectory) && grooveMeta.trajectory.length >= 2) {
    const a = grooveMeta.trajectory[0];
    const b = grooveMeta.trajectory[grooveMeta.trajectory.length - 1];
    trajectory = {
      elemType: 4,
      list: [
        {
          elemType: 1,
          pos1: { x: Number(a.x) || 0, y: Number(a.y) || 0 },
          pos2: { x: Number(b.x) || 0, y: Number(b.y) || 0 },
        },
      ],
    };
  } else if (trajOrient === 'v') {
    const xOn = clampGrooveAxis(Number(grooveMeta?.offsetAlongMm) || 10, halfW, cw);
    const y0 = Math.max(0, dz);
    const y1 = Math.max(y0, (Number(ch) || 0) - Math.max(0, dz2));
    trajectory = {
      elemType: 4,
      list: [{ elemType: 1, pos1: { x: xOn, y: y0 }, pos2: { x: xOn, y: y1 } }],
    };
  } else {
    const yOn = clampGrooveAxis(Number(grooveMeta?.offsetAlongMm) || 10, halfW, ch);
    const x0 = Math.max(0, dz);
    const x1 = Math.max(x0, (Number(cw) || 0) - Math.max(0, dz2));
    trajectory = {
      elemType: 4,
      list: [{ elemType: 1, pos1: { x: x0, y: yOn }, pos2: { x: x1, y: yOn } }],
    };
  }

  return {
    name,
    sign: 'Паз',
    frontSide: grooveMeta?.frontSide === true,
    contour: rectContour(widthMm, depthMm),
    trajectory,
  };
}

function attachGroovesToTableObj(tableObj, mesh, cw, ch, panelMinY) {
  const metaList = resolvePanelGroovesMeta(mesh);
  if (!metaList || !metaList.length) return;
  const grooves = [];
  for (const g of metaList) {
    if (!g) continue;
    if (g.kind === 'path' || g.kind === 'groove' || g.kind === 'drawer_bottom') {
      grooves.push(buildPathGrooveCfrn(cw, ch, g));
    }
  }
  if (!grooves.length) return;
  tableObj.grooves = grooves;
  if (typeof window !== 'undefined' && window.__CLD_DEBUG_CFRN_EDGES) {
    console.log('[CFRN] groove', tableObj.name, {
      cw,
      ch,
      panelMinY,
      grooves: grooves.map((g) => ({
        contour: g.contour,
        trajectory: g.trajectory,
      })),
    });
  }
}

function worldBBox(mesh) {
  const geo = mesh.geometry.clone();
  geo.applyMatrix4(mesh.matrixWorld);
  geo.computeBoundingBox();
  return geo.boundingBox;
}

/**
 * Реф. exportToCFRN (part12 ~4876–4943): контур/позиция по computed.size (original_points),
 * не по bbox core после inset полосок кромки в комнате.
 */
/**
 * Номинальный размер плиты по осям мира (мм), сохранён билдером до inset кромки.
 * Берётся с core-меша или родительской группы панели.
 */
function resolveCfrnSizeMm(mesh) {
  let p = mesh;
  for (let i = 0; i < 12 && p; i++) {
    const ud = p.userData || {};
    let sz = ud.__cldCfrnSizeMm;
    if (!sz && ud.cldTrimNominalSizeMm) {
      const t = ud.cldTrimNominalSizeMm;
      sz = { x: t.w, y: t.h, z: t.d };
    }
    const w = Number(sz?.x);
    const h = Number(sz?.y);
    const d = Number(sz?.z);
    if (Number.isFinite(w) && w > 0 && Number.isFinite(h) && h > 0 && Number.isFinite(d) && d > 0) {
      return { x: w, y: h, z: d };
    }
    p = p.parent;
  }
  return null;
}

/**
 * Группа панели (wallGroup): номинальный __cldCfrnSizeMm и pivot JSON.
 * Не _core — у core есть копия sizeMm, но position = __cldCoreOffsetMm (сдвиг от кромки).
 */
function findCfrnPanelAnchor(mesh) {
  let anchor = null;
  let p = mesh;
  for (let i = 0; i < 12 && p; i++) {
    const ud = p.userData || {};
    const sz = ud.__cldCfrnSizeMm;
    const orient = ud.__cldPanelOrientation;
    if (
      sz &&
      (orient === 'v' || orient === 'h' || orient === 'f') &&
      Number(sz.x) > 0 &&
      Number(sz.y) > 0 &&
      Number(sz.z) > 0
    ) {
      anchor = p;
    }
    p = p.parent;
  }
  return anchor;
}

/** Локальный номинал BLB по сырому pivot JSON (−1 / 0 / 1 на ось). */
function blbPivotAxisExtents(size, pivotVal) {
  const s = Number(size) || 0;
  const p = Number(pivotVal);
  if (p === 1) return { min: -s, max: 0 };
  if (p === 0) return { min: -s / 2, max: s / 2 };
  return { min: 0, max: s };
}

/**
 * BLB-группа: номинал в локали anchor по pivot → matrixWorld.
 * Бок правый ящика: pivot.x=1 → X от −w до 0, не 0…w.
 */
function blbNominalWorldBBox(anchor) {
  if (!anchor) return null;
  const sz = anchor.userData?.__cldCfrnSizeMm;
  const w = Number(sz?.x);
  const h = Number(sz?.y);
  const d = Number(sz?.z);
  if (!(w > 0 && h > 0 && d > 0)) return null;
  const pv = anchor.userData?._cldBlbPivotRaw || { x: -1, y: -1, z: -1 };
  const ex = blbPivotAxisExtents(w, pv.x);
  const ey = blbPivotAxisExtents(h, pv.y);
  const ez = blbPivotAxisExtents(d, pv.z);
  anchor.updateMatrixWorld(true);
  const m = anchor.matrixWorld;
  const corners = [
    [ex.min, ey.min, ez.min],
    [ex.max, ey.min, ez.min],
    [ex.min, ey.max, ez.min],
    [ex.max, ey.max, ez.min],
    [ex.min, ey.min, ez.max],
    [ex.max, ey.min, ez.max],
    [ex.min, ey.max, ez.max],
    [ex.max, ey.max, ez.max],
  ];
  const box = new THREE.Box3();
  const p = new THREE.Vector3();
  for (const c of corners) {
    p.set(c[0], c[1], c[2]).applyMatrix4(m);
    box.expandByPoint(p);
  }
  return box.isEmpty() ? null : box;
}

/**
 * Мировой bbox тела панели (core), без полосок кромки — запасной путь.
 */
function resolvePanelBodyWorldBBox(anchor) {
  if (!anchor) return null;
  anchor.updateMatrixWorld(true);
  const box = new THREE.Box3();
  let has = false;
  anchor.traverse((o) => {
    if (!o?.isMesh || o.visible === false) return;
    const oud = o.userData || {};
    if (oud.isEdge || oud.isHole || isUnderHolePreview(o)) return;
    const isBody =
      oud.isFacade ||
      oud.isDetail ||
      /_core$/i.test(String(o.name || ''));
    if (!isBody) return;
    const gb = new THREE.Box3().setFromObject(o);
    if (gb.isEmpty()) return;
    if (!has) {
      box.copy(gb);
      has = true;
    } else {
      box.union(gb);
    }
  });
  return has ? box : null;
}

/**
 * Позиция панели в CFRN: номинальный бокс в ЛОКАЛЬНЫХ осях wallGroup (центр номинала) → matrixWorld.
 * Фасад thinShell: BLB полотна (0,0,0)…(w,h,d) в локали группы → matrixWorld.
 * Кромка сдвигает только core внутри группы; в CFRN — номинал + butts[] (allowance:0).
 */
function resolveOrientedCfrnBBox(mesh) {
  const anchor = findCfrnPanelAnchor(mesh);
  if (!anchor) return null;

  const aud = anchor.userData || {};
  // BLB (фасад thinShell, стенки slide-ящика): origin группы = BLB, не центр плиты.
  if (aud._cldBlbContentOffset) {
    const nominalBlb = blbNominalWorldBBox(anchor);
    if (nominalBlb) return nominalBlb;
    const bodyBox = resolvePanelBodyWorldBBox(anchor);
    if (bodyBox) return bodyBox;
  }

  const sz = anchor.userData.__cldCfrnSizeMm;
  const w = Number(sz.x);
  const h = Number(sz.y);
  const d = Number(sz.z);
  const localBox = new THREE.Box3(
    new THREE.Vector3(-w / 2, -h / 2, -d / 2),
    new THREE.Vector3(w / 2, h / 2, d / 2),
  );
  anchor.updateMatrixWorld(true);
  const worldBox = new THREE.Box3();
  worldBox.copy(localBox).applyMatrix4(anchor.matrixWorld);
  return worldBox;
}

/** Размер JSON + ориентация панели (с core или группы). */
function resolveCfrnMeta(mesh) {
  let p = mesh;
  for (let i = 0; i < 12 && p; i++) {
    const ud = p.userData || {};
    const orient = ud.__cldPanelOrientation;
    const sz = ud.__cldCfrnSizeMm;
    if (
      sz &&
      (orient === 'v' || orient === 'h' || orient === 'f') &&
      Number(sz.x) > 0 &&
      Number(sz.y) > 0 &&
      Number(sz.z) > 0
    ) {
      return {
        size: { x: Number(sz.x), y: Number(sz.y), z: Number(sz.z) },
        orientation: orient,
      };
    }
    p = p.parent;
  }
  return null;
}

/**
 * Реф. exportToCFRN (part12 ~4883–4898): ao.thickness = computed.size по оси ориентации
 * ('h' → size.y, 'v' → size.x, 'f' → size.z), не размер bbox core после вычитания кромки в комнате.
 */
function resolveNominalThicknessMm(mesh, bboxThicknessMm) {
  const fromUd = (ud) => {
    if (!ud) return 0;
    const n = Number(ud.__cldNominalThicknessMm);
    if (Number.isFinite(n) && n > 0) return n;
    const f = Number(ud.facadeThicknessMm);
    if (Number.isFinite(f) && f > 0) return f;
    return 0;
  };
  let t = fromUd(mesh?.userData);
  if (t > 0) return t;
  let p = mesh?.parent;
  for (let i = 0; i < 10 && p; i++) {
    t = fromUd(p.userData);
    if (t > 0) return t;
    p = p.parent;
  }
  return bboxThicknessMm;
}

// Алгоритм ориентации по рефу (main_core_v2_part12_deobfuscated.js line 4882-4910):
// 'f' (frontal, thickAxis=Z): нет ротации, контур = wx × wy
// 'v' (vertical, thickAxis=X): rot(Y, -PI/2) → local Z = world -X (thickness), local X = world +Z, local Y = world Y
// 'h' (horizontal, thickAxis=Y): rot(X, +PI/2) → local Z = world Y (thickness), local X = world X, local Y = world -Z
function buildPanelData(mesh, materials, matResolver) {
  const cfrnMeta = resolveCfrnMeta(mesh);
  const realBB = worldBBox(mesh);
  // Позиция: номинал JSON в осях группы; fallback — геометрия core (без полосок кромки, isEdge отфильтрованы).
  const bb = resolveOrientedCfrnBBox(mesh) || realBB;
  const wx = bb.max.x - bb.min.x;
  const wy = bb.max.y - bb.min.y;
  const wz = bb.max.z - bb.min.z;

  let thickAxis;
  let thickness;
  let cw;
  let ch;

  const udTrim = mesh.userData || {};
  const geomH = Number(mesh.geometry?.parameters?.height);
  const isVertSideTrim =
    !!udTrim.isSideOverlay ||
    !!udTrim.isTransitionHeightMismatch ||
    /^SideOverlay(Left|Right|Front|Back)$/.test(String(mesh.name || '')) ||
    String(mesh.name || '') === 'TransitionSideOverlayHeightMismatch';
  const useLiveVertHeight =
    isVertSideTrim &&
    (udTrim._trimmedVerticalForFurniture || udTrim._trimmedByTransition) &&
    Number.isFinite(geomH) &&
    geomH > 0;

  if (cfrnMeta) {
    const { size, orientation } = cfrnMeta;
    if (orientation === 'v') {
      thickAxis = 'x';
      thickness = resolveNominalThicknessMm(mesh, Number(size.x) || wx);
      cw = Number(size.z);
      ch = useLiveVertHeight ? geomH : Number(size.y);
    } else if (orientation === 'h') {
      thickAxis = 'y';
      thickness = resolveNominalThicknessMm(mesh, Number(size.y) || wy);
      cw = Number(size.x);
      ch = Number(size.z);
    } else {
      thickAxis = 'z';
      thickness = resolveNominalThicknessMm(mesh, Number(size.z) || wz);
      cw = Number(size.x);
      ch = Number(size.y);
    }
    if (!Number.isFinite(cw) || cw <= 0) cw = thickAxis === 'x' ? wz : thickAxis === 'y' ? wx : wx;
    if (!Number.isFinite(ch) || ch <= 0) ch = thickAxis === 'x' ? wy : thickAxis === 'y' ? wz : wy;
  } else {
    if (wz <= wx && wz <= wy) thickAxis = 'z';
    else if (wx <= wy && wx <= wz) thickAxis = 'x';
    else thickAxis = 'y';
    const bboxThickness = thickAxis === 'z' ? wz : thickAxis === 'x' ? wx : wy;
    thickness = resolveNominalThicknessMm(mesh, bboxThickness);
    cw = thickAxis === 'z' ? wx : thickAxis === 'x' ? wz : wx;
    ch = thickAxis === 'z' ? wy : thickAxis === 'x' ? wy : wz;
  }

  const q = new THREE.Quaternion();
  const origin = new THREE.Vector3();

  if (thickAxis === 'z') {
    origin.set(bb.min.x, bb.min.y, bb.min.z);
  } else if (thickAxis === 'x') {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
    origin.set(bb.max.x, bb.min.y, bb.min.z);
  } else {
    q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    origin.set(bb.min.x, bb.max.y, bb.min.z);
  }

  const mat4 = new THREE.Matrix4();
  mat4.makeRotationFromQuaternion(q);
  mat4.setPosition(origin);
  const matrix = Array.from(mat4.elements);
  for (let i = 0; i < matrix.length; i++) {
    if (Math.abs(matrix[i]) < 1e-10) matrix[i] = 0;
  }

  const ud = mesh.userData || {};
  let panelName = defaultPanelName(mesh, ud);
  if (getBazisExportSettings().text_mat) {
    const matLabel = resolvePanelMaterialLabel(mesh);
    if (matLabel) panelName = `${panelName} ${matLabel}`.trim();
  }
  const panelMat = matResolver?.resolvePanelFromMesh
    ? matResolver.resolvePanelFromMesh(mesh)
    : { art: 'LDSP_DEFAULT', name: 'ЛДСП', sign: '' };
  if (matResolver?.resolvePanelFromMesh) {
    ensureMaterialEntry(materials, panelMat.art, panelMat.name, panelMat.sign);
  }
  const tableObj = {
    objType: 2,
    name: panelName,
    position: '',
    materialArt: panelMat.art,
    materialWidth: 0,
    thickness,
    textureOrientation: 2,
    frontFace: 2,
    contour: rectContour(cw, ch),
  };
  const butts = getButtsForMesh(mesh, materials, matResolver);
  if (butts.length) tableObj.butts = butts;

  attachGroovesToTableObj(tableObj, mesh, cw, ch, bb.min.y);

  if (typeof window !== 'undefined' && window.__CLD_DEBUG_CFRN_EDGES) {
    console.log('[CFRN][export]', tableObj.name, {
      cw,
      ch,
      thickAxis,
      cfrnMeta: resolveCfrnMeta(mesh),
      butts,
      buttsCatalog: mesh.userData?.__cldButts,
      grooves: tableObj.grooves?.length || 0,
      note: 'contour=cw×ch из JSON; butt.thickness=0 чтобы Bazis не раздувал плиту',
    });
  }

  if (typeof window !== 'undefined' && window.__CLD_DUMP_CFRN_PANELS) {
    const anchor = findCfrnPanelAnchor(mesh);
    const coreOff = anchor?.userData?.__cldCoreOffsetMm || null;
    const orient = cfrnMeta?.orientation || anchor?.userData?.__cldPanelOrientation;
    const coreBB = worldBBox(mesh);
    const nominalBB = resolveOrientedCfrnBBox(mesh);
    const delta = { x: null, y: null, z: null };
    if (nominalBB && coreBB) {
      delta.x = (nominalBB.min.x - coreBB.min.x).toFixed(3);
      delta.y = (nominalBB.min.y - coreBB.min.y).toFixed(3);
      delta.z = (nominalBB.min.z - coreBB.min.z).toFixed(3);
    }
    console.log('[CFRN][panel-origin]', tableObj.name, {
      orientation: orient,
      thickAxis,
      matrixPos: { x: matrix[12], y: matrix[13], z: matrix[14] },
      coreOffsetMm: coreOff,
      blbOffset: anchor?.userData?._cldBlbContentOffset || null,
      nominalMinusCoreMin: delta,
      cfrnSizeMm: anchor?.userData?.__cldCfrnSizeMm || null,
      note:
        orient === 'f' && anchor?.userData?._cldBlbContentOffset
          ? 'фасад: позиция от BLB 0…size (JSON 1.5/s:x-3), не от _core+kromka'
          : orient === 'v'
            ? 'бок: якорь wallGroup'
            : orient === 'h'
              ? 'дно/крыша: якорь wallGroup'
              : '',
    });
  }

  return { tableObj, matrix, cw, ch, thickness, thickAxis };
}

/** Петли: меши-плейсхолдеры / каталожный GLB — опционально STL; присадка — collectAllTreeDrillFittingLeaves + tid. */
function isHingeExportMesh(mesh) {
  if (!mesh || !mesh.isMesh) return false;
  const ud = mesh.userData || {};
  if (ud.isHingeBazisExport) return true;
  let p = mesh;
  for (let i = 0; i < 12 && p; i++) {
    const pud = p.userData || {};
    if (pud.isCabinetModel && pud.isHingeBazisExport) return true;
    if (pud.isHingeBazisExport && pud.isFurniture) return true;
    p = p.parent;
  }
  const n = String(mesh.name || '').toLowerCase();
  return n.includes('furni_hinge');
}

/** Каталожная 3D-модель петли (Model_5/6) — в CFRN для сверки позиции с присадкой. */
function isCatalogHingeModelMesh(mesh) {
  if (!mesh?.isMesh) return false;
  let p = mesh;
  for (let i = 0; i < 14 && p; i++) {
    const pud = p.userData || {};
    if (pud.isCabinetModel && pud.isHingeBazisExport) return true;
    if (String(p.name || '').startsWith('Model_') && pud.isCabinetModel) {
      let q = p.parent;
      for (let j = 0; j < 8 && q; j++) {
        if (String(q.userData?.animatorId || '').toLowerCase() === 'hinge_animator') return true;
        if (q.userData?.isCatalogHingeModule) return true;
        q = q.parent;
      }
    }
    p = p.parent;
  }
  return false;
}

/**
 * Экспорт «кубиков» петель в CFRN (STL ~12×55 мм).
 * По умолчанию ВЫКЛ: в Базисе это не библиотечная петля, а мелкий меш — часто выглядит как розовый/сиреневый квадратик.
 * Нужны ориентиры по позиции — в консоли: window.__CLD_CFRN_EXPORT_HINGE_MESH = true, затем экспорт снова.
 */
function exportHingePlaceholderMeshesToCfrn() {
  return typeof window !== 'undefined' && window.__CLD_CFRN_EXPORT_HINGE_MESH === true;
}

function shouldTreatAsPanel(mesh) {
  const ud = mesh.userData || {};
  if (ud.isEdge) return false;
  if (isHingeExportMesh(mesh)) return false;
  if (isCatalogCabinetModelMesh(mesh)) return false;
  if (isCabinetModelPlaceholderMesh(mesh)) return false;
  if (isPlank(ud)) return true;
  if (isTransitionTopOrSideExportMesh(ud)) return true;
  // Для шкафа стараемся отдавать ЛДСП-детали как objType:2, иначе Bazis может трактовать как фурнитуру.
  // Важно: у дочерних мешей флаг isFurniture обычно стоит на родительской Group.
  let isFurnitureMesh = !!ud.isFurniture;
  if (!isFurnitureMesh) {
    let p = mesh.parent;
    while (p) {
      if (p.userData?.isFurniture) {
        isFurnitureMesh = true;
        break;
      }
      p = p.parent;
    }
  }
  // Явные мебельные детали от билдера тоже считаем панелями
  if (!isFurnitureMesh && !(ud.isDetail || ud.isBody || ud.detailTypeId || ud.originalType === 'detail')) {
    return false;
  }
  const bb = worldBBox(mesh);
  const wx = Math.abs(bb.max.x - bb.min.x);
  const wy = Math.abs(bb.max.y - bb.min.y);
  const wz = Math.abs(bb.max.z - bb.min.z);
  const dims = [wx, wy, wz].sort((a, b) => a - b);
  const t = dims[0];
  const m = dims[1];
  const l = dims[2];
  // Эвристика "плитной" детали: тонкая + две большие стороны.
  // Отсекаем мелкий крепеж/мусор.
  return t >= 2 && t <= 80 && m >= 40 && l >= 80;
}

function ensureMaterialEntry(materials, art, name, sign) {
  const artStr = String(art || '').trim();
  if (!artStr) return;
  const prev = materials.get(artStr);
  if (!prev) {
    materials.set(artStr, {
      art: artStr,
      name: String(name || artStr),
      sign: String(sign || ''),
    });
  } else if (sign && !prev.sign) {
    prev.sign = String(sign);
  }
}

function getButtsForMesh(mesh, materials, matResolver) {
  const sources = [mesh, mesh?.parent].filter(Boolean);
  let list = null;
  for (const src of sources) {
    const arr = src?.userData?.__cldButts;
    if (Array.isArray(arr) && arr.length) {
      list = arr;
      break;
    }
  }
  if (!list) return [];

  const exportSettings = getBazisExportSettings();

  // Реф. part12: allowance=0 — кромка не в габарит. Облачный конвертер Bazis часто всё равно
  // прибавляет butt.thickness к размеру плиты (597+1=598, 544.4+0.8=545.24) → в butts thickness:0,
  // номинал кромки только в sign материала (EDGE_7_t0_4). Сторона — elemIndex.
  const useCatalogThickInButt =
    typeof window !== 'undefined' && window.__CLD_CFRN_BUTT_USE_CATALOG_THICKNESS === true;

  return list.map((b) => {
    const catalogThick =
      Number.isFinite(Number(b.thickness)) && Number(b.thickness) > 0 ? Number(b.thickness) : 0.5;
    const geomThick = useCatalogThickInButt ? catalogThick : 0;
    const resolved = matResolver?.resolveButt
      ? matResolver.resolveButt(b)
      : null;
    let art = resolved?.art || String(b.materialArt || 'EDGE_DEFAULT');
    if (!resolved && !/_t[\d_]+$/.test(art)) {
      const m = art.match(/^EDGE_([^_]+)$/);
      if (m) art = `${art}_t${String(catalogThick).replace('.', '_')}`;
    }
    const name = resolved?.name || String(b.materialName || 'Кромка');
    const sign = resolved?.sign || `${catalogThick}/${Number(b.width || 0)} ${art}`;
    ensureMaterialEntry(materials, art, name, sign);
    return {
      elemIndex: Number.isFinite(Number(b.elemIndex)) ? Number(b.elemIndex) : 0,
      thickness: geomThick,
      width: Number.isFinite(Number(b.width)) ? Number(b.width) : 0,
      buttType: 0,
      overhang: 0,
      allowance: exportSettings.use_allowance ? catalogThick : 0,
      cutIndex: -1,
      clip: !!exportSettings.use_clip,
      materialArt: art,
    };
  });
}

function stlFromGeo(exporter, geo) {
  const mat = new THREE.MeshBasicMaterial();
  const tmpMesh = new THREE.Mesh(geo, mat);
  const wrapper = new THREE.Scene();
  wrapper.add(tmpMesh);
  wrapper.updateMatrixWorld(true);

  const result = exporter.parse(wrapper, { binary: true });
  if (result instanceof ArrayBuffer) return new Uint8Array(result);
  if (result instanceof DataView) return new Uint8Array(result.buffer);
  if (typeof result === 'string') return new TextEncoder().encode(result);
  return new Uint8Array(result);
}

function worldGeo(mesh) {
  const geo = mesh.geometry.clone();
  geo.applyMatrix4(mesh.matrixWorld);
  geo.computeBoundingBox();
  return geo;
}

// ─────────────────────────────────────────────────────────────────────────────
// Joint-fastener helpers (Конфирмат и другие схемы крепежа)
// ─────────────────────────────────────────────────────────────────────────────

function _readLS(key) {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

/** Табличное количество: ближний якорь = off от базы, дальний — по сетке step, ≥ minOpp от края. */
function _fromBaseForcedSpreadArr(seamLen, forcedCount, fromPivot, off, minOpp, stepMm) {
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

/**
 * Реплика calcSchemePositions из admin-new-bundle.js.
 * Возвращает массив позиций (мм) вдоль стыка.
 */
function _calcJointPositions(scheme, seamLen) {
  if (!scheme || seamLen <= 0) return [];
  let forcedCount = 0;
  const rules = (scheme.countRules || []).slice().sort((a, b) => a.from - b.from);
  for (const r of rules) {
    if (seamLen >= r.from && seamLen <= r.to) { forcedCount = r.count; break; }
  }
  if (scheme.schemeType === 'symmetric') {
    const off = Number(scheme.symOffset) || 50;
    if (forcedCount > 0) {
      if (forcedCount === 1) return [seamLen / 2];
      const gap = (seamLen - 2 * off) / (forcedCount - 1);
      return Array.from({ length: forcedCount }, (_, i) => off + i * gap);
    }
    if (seamLen - 2 * off <= 0) return [seamLen / 2];
    return [off, seamLen - off];
  }
  // from_base / variable (см. calcSchemePositions в admin-new-bundle.js)
  const off = Number(scheme.offsetFromBase) >= 0 ? Number(scheme.offsetFromBase) : 50;
  const step = Number(scheme.step) > 0 ? Number(scheme.step) : 32;
  const minOpp = Number(scheme.minOffsetOpposite) >= 0 ? Number(scheme.minOffsetOpposite) : 32;
  const maxPos = seamLen - minOpp;
  const minPos = minOpp;
  const fromPivot = String(scheme.base || 'back').toLowerCase() !== 'front';
  if (forcedCount > 0) {
    return _fromBaseForcedSpreadArr(seamLen, forcedCount, fromPivot, off, minOpp, step);
  }
  const arr = [];
  if (fromPivot) {
    let q = off;
    while (q <= maxPos + 0.01) {
      arr.push(q);
      q += step;
    }
  } else {
    let q = seamLen - off;
    while (q >= minPos - 0.01) {
      arr.push(q);
      q -= step;
    }
    arr.sort((a, b) => a - b);
  }
  return arr;
}

/**
 * Отображает позицию крепежа (мм от пивота вдоль шва) + тип соединения на систему координат CFRN-панели.
 *
 * Система координат панели (из buildPanelData):
 *  thickAxis='z' (f): local X = world X, local Y = world Y, Z = thickness
 *  thickAxis='x' (v): local X = world +Z, local Y = world +Y, Z = thickness (world -X)
 *  thickAxis='y' (h): local X = world +X, local Y = world -Z, Z = thickness (world -Y)
 *
 * jointIdx: 0=top(+Y), 1=bottom(-Y), 2=left(-X), 3=right(+X) — в мировых координатах.
 * seamPos: мм вдоль шва от пивота (0 = зад/пивот, как в Базисе и calcSchemePositions).
 * Returns { pos, dir } в локальных координатах панели или null если не применимо.
 */
function _jointHoleCoords(jointIdx, thickAxis, seamPos, cw, ch, thickness) {
  // Для vertical (thickAxis='x'): local X = world +Z, front = local X=cw (bb.max.z)
  // Для horizontal (thickAxis='y'): local Y = world -Z, front = local Y=0 (bb.max.z стал 0?)
  //   origin.z = bb.min.z; col1=(0,0,-1) → local Y = world-Z → Y=0 = world Z_max = front (farther Z is less Y)
  //   Нет: buildPanelData для h: origin=(bb.min.x, bb.max.y, bb.min.z), col1=(0,0,-1)=world-Z
  //   local Y=0 ↔ world Z=bb.min.z (BACK), local Y=ch ↔ world Z=bb.max.z (FRONT)
  //   So front = Y=ch, back = Y=0 for horizontal.
  // For frontal (thickAxis='z'): local X = world +X, no clear front/back axis along seam.

  // seam run along which axis (local)?
  // top(0)/bottom(1): seam is along world X
  //   v(thickAxis=x): local X=worldZ — for TOP of vertical, seam runs along world X = NOT local X
  //     actually seam for top edge of a vertical panel runs along world X (panel width = size.x = thickness ~16mm)
  //     AND along world Z (panel depth = cw). The "seamLen" stored is size.x or size.y...
  //   For simplicity: map seamPos to the longest visible dimension of the joint edge.
  // left(2)/right(3): seam along world Y (height)
  //   v: local Y = world Y ✓
  //   h: seam along world Y but horizontal panel has no real height — use local Y (depth)

  let px, py, pz; // panel-local position (entry point on edge face)
  let dx, dy, dz; // drilling direction (into the panel)

  const t2 = thickness / 2;

  if (thickAxis === 'x') {
    // local X = world +Z (depth, 0=back/пивот, cw=перед); seamPos уже от пивота
    const seam_x = seamPos;
    switch (jointIdx) {
      case 0: // top +Y edge → drill from y=ch downward
        px = seam_x; py = ch; pz = t2; dx = 0; dy = -1; dz = 0; break;
      case 1: // bottom -Y edge → drill from y=0 upward
        px = seam_x; py = 0; pz = t2; dx = 0; dy = 1; dz = 0; break;
      case 2: // left/right: шов вдоль local Y (высота), глубина — по центру local X
        px = cw / 2; py = seamPos; pz = 0; dx = 0; dy = 0; dz = 1; break;
      case 3:
        px = cw / 2; py = seamPos; pz = thickness; dx = 0; dy = 0; dz = -1; break;
      default: return null;
    }
  } else if (thickAxis === 'y') {
    // local X = world +X (width); local Y = world -Z (back=0, front=ch); Z = thickness
    const seam_y = seamPos;
    switch (jointIdx) {
      case 0: // верх/низ: шов вдоль local X, глубина — по центру local Y
        px = seamPos; py = ch / 2; pz = 0; dx = 0; dy = 0; dz = 1; break;
      case 1:
        px = seamPos; py = ch / 2; pz = thickness; dx = 0; dy = 0; dz = -1; break;
      case 2: // left -X edge → entry from x=0 going right
        px = 0; py = seam_y; pz = t2; dx = 1; dy = 0; dz = 0; break;
      case 3: // right +X edge → entry from x=cw going left
        px = cw; py = seam_y; pz = t2; dx = -1; dy = 0; dz = 0; break;
      default: return null;
    }
  } else {
    // thickAxis === 'z' (frontal 'f'): local X=worldX, local Y=worldY, Z=thickness
    switch (jointIdx) {
      case 0: // top +Y → entry at y=ch, seam along X
        px = seamPos; py = ch; pz = t2; dx = 0; dy = -1; dz = 0; break;
      case 1: // bottom -Y → entry at y=0
        px = seamPos; py = 0; pz = t2; dx = 0; dy = 1; dz = 0; break;
      case 2: // left -X → entry at x=0, seam along Y
        px = 0; py = seamPos; pz = t2; dx = 1; dy = 0; dz = 0; break;
      case 3: // right +X
        px = cw; py = seamPos; pz = t2; dx = -1; dy = 0; dz = 0; break;
      default: return null;
    }
  }

  return {
    pos: { x: px, y: py, z: pz },
    dir: { x: dx, y: dy, z: dz },
  };
}

/**
 * Нормаль стыка: от текущей панели к соседней (мир, единичная по оси).
 * Согласовано с _cfrnJointFaceInfo / constructor-clodis _jointOutwardNormal(jointIdx, bbox).
 */
function _jointOutwardNormal(jointIdx, bbox) {
  const j = Number(jointIdx);
  if (!bbox || bbox.isEmpty()) {
    switch (j) {
      case 0: return new THREE.Vector3(0, 1, 0);
      case 1: return new THREE.Vector3(0, -1, 0);
      case 2: return new THREE.Vector3(-1, 0, 0);
      case 3: return new THREE.Vector3(1, 0, 0);
      default: return new THREE.Vector3(0, 1, 0);
    }
  }
  const { faceAxis, faceSign } = _cfrnJointFaceInfo(j, bbox);
  const n = new THREE.Vector3();
  n[faceAxis] = faceSign;
  return n;
}

function _cfrnFindJointPanelRoot(mesh) {
  let cur = mesh;
  for (let i = 0; i < 12 && cur; i++) {
    if (cur.userData && cur.userData.__cldPivotCodes) return cur;
    cur = cur.parent;
  }
  return mesh?.parent || mesh;
}

function _cfrnJointFaceInfo(jointIdx, bbox) {
  const bSize = new THREE.Vector3();
  bbox.getSize(bSize);
  const minDim = Math.min(bSize.x, bSize.y, bSize.z);
  const thinAxis = Math.abs(bSize.x - minDim) < 0.0001 ? 'x'
    : Math.abs(bSize.y - minDim) < 0.0001 ? 'y' : 'z';
  let faceAxis; let faceSign;
  if (jointIdx === 0 || jointIdx === 1) {
    faceAxis = thinAxis === 'y' ? 'z' : 'y';
    faceSign = jointIdx === 0 ? 1 : -1;
  } else {
    faceAxis = thinAxis === 'x' ? 'z' : 'x';
    faceSign = jointIdx === 2 ? -1 : 1;
  }
  return { faceAxis, faceSign };
}

function _cfrnJointFaceSeamAndEdgeAxes(bbox, jointIdx) {
  const bSize = new THREE.Vector3();
  bbox.getSize(bSize);
  const { faceAxis } = _cfrnJointFaceInfo(jointIdx, bbox);
  const perps = ['x', 'y', 'z'].filter((a) => a !== faceAxis);
  const a = perps[0];
  const b = perps[1];
  const seamAx = bSize[a] >= bSize[b] ? a : b;
  const edgeAx = seamAx === a ? b : a;
  return { seamAx, edgeAx, faceAxis };
}

function _cfrnPanelPivotWorld(panelRoot) {
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

function _cfrnJointSeamPivotAtMin(bbox, seamAx, pivotWorld) {
  if (!pivotWorld) return true;
  const pv = pivotWorld[seamAx];
  const distMin = Math.abs(pv - bbox.min[seamAx]);
  const distMax = Math.abs(pv - bbox.max[seamAx]);
  return distMin <= distMax;
}

/**
 * Длина шва по геометрии панели (мм) — ось шва для jointIdx, как в превью.
 */
function _cfrnSeamGeomLenMm(panelBb, jointIdx) {
  if (!panelBb || panelBb.isEmpty()) return 0;
  const j = Number(jointIdx);
  const { seamAx } = _cfrnJointFaceSeamAndEdgeAxes(panelBb, j);
  const s = new THREE.Vector3();
  panelBb.getSize(s);
  return (s[seamAx] || 0) * CLD_SCENE_MM;
}

/**
 * Координата вдоль шва (мир): pMm — миллиметры от пивота вдоль ребра.
 * Как constructor-clodis _jointSeamCoordOnAxis: смещение = pMm / CLD_SCENE_MM в юнитах сцены, затем clamp на bbox.
 * Нельзя делать t = pMm / seamLen_из_JSON и умножать на span — при seamLen ≠ габариту получается ~48,7 вместо 50 мм.
 */
function _cfrnJointSeamCoordOnAxis(bbox, seamAx, seamLenMm, pMm, panelRoot) {
  void seamLenMm;
  const min = bbox.min;
  const max = bbox.max;
  const lo = min[seamAx];
  const hi = max[seamAx];
  const pivotW = panelRoot ? _cfrnPanelPivotWorld(panelRoot) : null;
  const pivotAtMin = _cfrnJointSeamPivotAtMin(bbox, seamAx, pivotW);
  const deltaMm = Math.max(0, Number(pMm) || 0);
  const deltaM = deltaMm / CLD_SCENE_MM;
  let raw = pivotAtMin ? lo + deltaM : hi - deltaM;
  if (raw < lo) raw = lo;
  if (raw > hi) raw = hi;
  return raw;
}

/**
 * Точка на линии стыка (мир, юниты сцены). pMm / seamLenMm — мм; ось шва и пивот — как в constructor-clodis.js.
 */
function _jointSeamPointWorldBb(bb, jointIdx, seamLenMm, pMm, panelRoot) {
  const min = bb.min;
  const max = bb.max;
  const jIdx = Number(jointIdx);
  const { seamAx, edgeAx, faceAxis } = _cfrnJointFaceSeamAndEdgeAxes(bb, jIdx);
  const { faceSign } = _cfrnJointFaceInfo(jIdx, bb);
  const facePos = faceSign > 0 ? max[faceAxis] : min[faceAxis];
  const pt = new THREE.Vector3();
  pt[faceAxis] = facePos;
  pt[seamAx] = _cfrnJointSeamCoordOnAxis(bb, seamAx, seamLenMm, pMm, panelRoot || null);
  pt[edgeAx] = (min[edgeAx] + max[edgeAx]) / 2;
  return pt;
}

/**
 * Соседняя панель вдоль нормали грани стыка (как _cfrnJointFaceInfo).
 * thicknessMm — фактически толщина в юнитах сцены (как раньше), для смещения точки сверления.
 */
function _findNeighborPanelForJoint(scene, panelMesh, jointIdx) {
  if (!scene || !panelMesh) return null;
  const bbox = new THREE.Box3().setFromObject(panelMesh);
  if (bbox.isEmpty()) return null;
  const j = Number(jointIdx);
  const outward = _jointOutwardNormal(j, bbox);
  const ax = Math.abs(outward.x) > 0.5 ? 'x' : Math.abs(outward.y) > 0.5 ? 'y' : 'z';
  const oc = outward[ax];
  const faceCoord = oc > 0 ? bbox.max[ax] : bbox.min[ax];
  const nearOfCandidate = oc > 0 ? 'min' : 'max';

  let bestThick = 1.6;
  let bestDist = Infinity;
  let bestMesh = null;
  scene.traverse((ch) => {
    if (!isExportableMesh(ch) || !ch.isMesh) return;
    if (ch === panelMesh) return;
    const ud = ch.userData || {};
    if (ud.isAccessory || ud.isSectionVolume) return;
    const cb = new THREE.Box3().setFromObject(ch);
    if (cb.isEmpty()) return;
    const nearEdge = nearOfCandidate === 'min' ? cb.min[ax] : cb.max[ax];
    const dist = (nearEdge - faceCoord) * oc;
    if (dist < -0.5 || dist > 50) return;
    const cSz = new THREE.Vector3();
    cb.getSize(cSz);
    const thick = Math.min(cSz.x, cSz.y, cSz.z);
    if (thick > 0.1 && thick < 50 && dist < bestDist) {
      bestDist = dist;
      bestThick = thick;
      bestMesh = ch;
    }
  });
  if (!bestMesh) return null;
  return { mesh: bestMesh, thicknessMm: bestThick };
}

function _bboxThickAxis(box) {
  if (!box || box.isEmpty()) return 'z';
  const sz = new THREE.Vector3();
  box.getSize(sz);
  if (sz.z <= sz.x && sz.z <= sz.y) return 'z';
  if (sz.x <= sz.y && sz.x <= sz.z) return 'x';
  return 'y';
}

function _worldPosDirToPanelLocal(worldPos, worldDir, panelMatrix16, cw, ch, thickness, eps) {
  const e = Number.isFinite(eps) ? eps : 1.0;
  const m = new THREE.Matrix4().fromArray(panelMatrix16);
  const inv = new THREE.Matrix4().copy(m).invert();
  const pos = new THREE.Vector3().copy(worldPos).applyMatrix4(inv);
  const dir = new THREE.Vector3().copy(worldDir).transformDirection(inv);
  if (dir.lengthSq() < 1e-12) return null;
  dir.normalize();
  if (pos.x < -e || pos.x > cw + e) return null;
  if (pos.y < -e || pos.y > ch + e) return null;
  if (pos.z < -e || pos.z > thickness + e) return null;
  return {
    pos: { x: pos.x, y: pos.y, z: pos.z },
    dir: { x: dir.x, y: dir.y, z: dir.z },
  };
}

/** Не отбрасывать отверстие БМ: зажать точку в объём панели. */
function _worldPosDirToPanelLocalClamped(worldPos, worldDir, panelMatrix16, cw, ch, thickness) {
  const m = new THREE.Matrix4().fromArray(panelMatrix16);
  const inv = new THREE.Matrix4().copy(m).invert();
  const pos = new THREE.Vector3().copy(worldPos).applyMatrix4(inv);
  const dir = new THREE.Vector3().copy(worldDir).transformDirection(inv);
  if (dir.lengthSq() < 1e-12) return null;
  dir.normalize();
  const cx = THREE.MathUtils.clamp(pos.x, 0, Math.max(0, Number(cw) || 0));
  const cy = THREE.MathUtils.clamp(pos.y, 0, Math.max(0, Number(ch) || 0));
  const cz = THREE.MathUtils.clamp(pos.z, 0, Math.max(0, Number(thickness) || 0));
  return {
    pos: { x: cx, y: cy, z: cz },
    dir: { x: dir.x, y: dir.y, z: dir.z },
  };
}

/** Направление сверления как в админке (шаблон присадки). */
const _CFRN_DRILL_DIR_BY_KEY = {
  x: [1, 0, 0], '-x': [-1, 0, 0],
  y: [0, 1, 0], '-y': [0, -1, 0],
  z: [0, 0, 1], '-z': [0, 0, -1],
};

function _cfrnDrillDirVecFromKey(key) {
  const k = String(key || '-z').toLowerCase();
  const arr = _CFRN_DRILL_DIR_BY_KEY[k];
  if (!arr) return new THREE.Vector3(0, 0, -1);
  return new THREE.Vector3(arr[0], arr[1], arr[2]);
}

/**
 * Сводка размеров в комнате перед CFRN (консоль: [BAZIS-SIZE]).
 * window.__cldDumpBazisExportSizes() — вручную в любой момент.
 */
export function dumpRoomBazisExportSizes() {
  if (!state?.scene) {
    console.warn('[BAZIS-SIZE][ROOM] сцена не найдена');
    return [];
  }
  state.scene.updateMatrixWorld(true);
  const report = [];
  const seen = new Set();
  state.scene.traverse((obj) => {
    if (!obj?.userData?.isFurniture || !obj.isGroup || seen.has(obj)) return;
    seen.add(obj);
    const ud = obj.userData || {};
    const box = new THREE.Box3().setFromObject(obj);
    const z = ud.__layoutZones?.zones || {};
    const panels = [];
    const panelKeys = new Set();
    obj.traverse((o) => {
      if (!o?.isMesh) return;
      let p = o;
      for (let i = 0; i < 12 && p; i++) {
        const pud = p.userData || {};
        const sz = pud.__cldCfrnSizeMm;
        if (sz && pud.__cldPanelOrientation) {
          const key = `${p.uuid}|${pud.layoutRole}|${sz.x}|${sz.y}|${sz.z}`;
          if (!panelKeys.has(key)) {
            panelKeys.add(key);
            panels.push({
              name: p.name || o.name,
              layoutRole: pud.layoutRole || '',
              orientation: pud.__cldPanelOrientation,
              cfrnSizeMm: { x: sz.x, y: sz.y, z: sz.z },
            });
          }
          break;
        }
        p = p.parent;
      }
    });
    const verticalHeights = [
      ...new Set(
        panels
          .filter((p) => p.orientation === 'v' && Number(p.cfrnSizeMm?.y) > 40)
          .map((p) => Math.round(p.cfrnSizeMm.y))
      ),
    ].sort((a, b) => a - b);
    const item = {
      uuid: obj.uuid,
      catalogName: ud.catalogName || obj.name,
      placementKind: ud.__placementKind,
      zoneIndex: ud.zoneIndex,
      sectionId: ud.sectionId,
      customHeightMm: Number(ud.customHeightMm) || 0,
      initialSectionSizeMm: ud.__initialSectionSizeMm
        ? { ...ud.__initialSectionSizeMm }
        : null,
      hBottomMm: Number(ud.hBottomMm) || 0,
      hTopCatalogMm: Number(ud.hTopCatalogMm) || 0,
      layoutZones:
        z.plinthMm != null
          ? {
              plinthMm: z.plinthMm,
              carcassMm: z.carcassMm,
              hTopMm: z.hTopMm,
              serviceMm: z.serviceMm || 0,
              totalMm:
                (Number(z.plinthMm) || 0) +
                (Number(z.carcassMm) || 0) +
                (Number(z.hTopMm) || 0) +
                (Number(z.serviceMm) || 0),
            }
          : null,
      bboxHeightMm: Math.round(box.max.y - box.min.y),
      scale: obj.scale.toArray().map((v) => Math.round(v * 1000) / 1000),
      verticalPanelHeightsMm: verticalHeights,
      panels,
    };
    report.push(item);
    console.log('[BAZIS-SIZE][ROOM] модуль', item.catalogName, {
      customHeightMm: item.customHeightMm,
      layoutZones: item.layoutZones,
      bboxHeightMm: item.bboxHeightMm,
      verticalPanelHeightsMm: item.verticalPanelHeightsMm,
      scale: item.scale,
    });
  });
  console.log('[BAZIS-SIZE][ROOM] полный отчёт', report);
  return report;
}

if (typeof window !== 'undefined') {
  window.__cldDumpBazisExportSizes = dumpRoomBazisExportSizes;
}

async function buildCFRNZip() {
  try {
    if (typeof window !== 'undefined' && window.ClodisDrillRegistry && typeof window.ClodisDrillRegistry.ensureLoaded === 'function') {
      await window.ClodisDrillRegistry.ensureLoaded();
      const st = typeof window.ClodisDrillRegistry.getStatus === 'function'
        ? window.ClodisDrillRegistry.getStatus()
        : null;
      if (st) {
        console.log('[CFRN] drill registry', {
          schemes: st.schemeCount,
          templates: st.templateCount,
          url: st.url,
        });
      }
    } else {
      console.warn(
        '[CFRN] ClodisDrillRegistry не загружен — схемы только из localStorage. ' +
          'Эксцентр (scheme id=5) может отсутствовать. Добавьте js/utils/clodis-drill-registry.js в index.html.',
      );
    }
  } catch (e) {
    console.warn('[CFRN] drill registry ensureLoaded:', e);
  }
  dumpRoomBazisExportSizes();
  const JSZipCtor = await getJSZip();
  const zip = new JSZipCtor();
  const exporter = new STLExporter();

  if (!state?.scene) throw new Error('Сцена не найдена.');
  ensureCatalogHorizontalTopsVisibleForCfrn();
  // L-пакет: чашка на двери. Закрываем ВСЕ __door_swing на сцене (не только реестр).
  const _cfrnDoorSnap = (() => {
    const saved = [];
    const closeOne = (g) => {
      const sw = g?.userData?.cldDoorSwing;
      if (!g) return;
      saved.push({
        g,
        sw,
        currentAngle: sw?.currentAngle,
        targetAngle: sw?.targetAngle,
        isOpen: sw?.isOpen,
        rx: g.rotation.x,
        ry: g.rotation.y,
        rz: g.rotation.z,
      });
      if (sw) {
        sw.currentAngle = 0;
        sw.targetAngle = 0;
        sw.isOpen = false;
        if (sw.axis === 'x') g.rotation.x = 0;
        else if (sw.axis === 'z') g.rotation.z = 0;
        else g.rotation.y = 0;
      } else {
        g.rotation.set(0, 0, 0);
      }
    };
    if (state?.scene?.traverse) {
      state.scene.traverse((o) => {
        if (o?.name === '__door_swing') closeOne(o);
      });
    }
    console.warn('[CFRN][L-SEAM] doors forced closed for export', { count: saved.length });
    return () => {
      for (const s of saved) {
        if (s.sw) {
          s.sw.currentAngle = s.currentAngle;
          s.sw.targetAngle = s.targetAngle;
          s.sw.isOpen = s.isOpen;
        }
        s.g.rotation.x = s.rx;
        s.g.rotation.y = s.ry;
        s.g.rotation.z = s.rz;
      }
    };
  })();
  try {
  state.scene.updateMatrixWorld(true);

  let matResolver = null;
  try {
    matResolver = await createBazisMaterialResolver();
  } catch (e) {
    console.warn('[CFRN] Каталог материалов для Bazis не загружен, art по умолчанию:', e);
  }

  const materials = new Map();
  materials.set('LDSP_DEFAULT', { art: 'LDSP_DEFAULT', name: 'ЛДСП Белый', sign: '' });

  const tableObjects = [];
  const tableTriangles = [];
  const tableHoles = [];
  const tableHolesDedup = new Map(); // key = `${depth}|${diameter}` -> infoIndex
  const modelObjs = [];
  const dedup = new Map();
  let tableIdx = 0;
  let exportedCount = 0;
  let stlCount = 0;
  /** @type {Array<{ name: string, cw: number, ch: number, thickness: number, sectionPath: string, furnName: string }>} */
  const cfrnPanelExportLog = [];

  function pushTableObj(obj) {
    const key = JSON.stringify(obj);
    if (dedup.has(key)) return dedup.get(key);
    const idx = tableIdx++;
    dedup.set(key, idx);
    tableObjects.push(obj);
    return idx;
  }

  function ensureMaterial(art, name, sign) {
    ensureMaterialEntry(materials, art, name, sign);
    return 1;
  }

  function getHoleInfoIndex(depthMm, diameterMm) {
    const d = Number(depthMm);
    const dia = Number(diameterMm);
    if (!Number.isFinite(d) || !Number.isFinite(dia) || d <= 0 || dia <= 0) return -1;
    const key = `${d}|${dia}`;
    if (tableHolesDedup.has(key)) return tableHolesDedup.get(key);
    const idx = tableHoles.length;
    tableHolesDedup.set(key, idx);
    tableHoles.push({ depth: d, diameter: dia });
    return idx;
  }

  function isShelfHolderAccessory(ud) {
    if (!ud) return false;
    const name = String(ud.accessoryName || '').toLowerCase();
    const sku = String(ud.accessorySku || '').toLowerCase();
    const cat = String(ud.accessoryCategory || ud.category || '').toLowerCase();
    return (
      /полкодерж/.test(name) ||
      /shelf/.test(name) ||
      /shelf/.test(sku) ||
      /shelf/.test(cat)
    );
  }

  function getOwningSectionGroup(panelMesh) {
    let p = panelMesh;
    while (p) {
      if (p.userData?.isSection) return p;
      p = p.parent;
    }
    return null;
  }

  function getShelfHolderAccessoryMeshesForPanel(panelMesh) {
    const section = getOwningSectionGroup(panelMesh);
    if (!section || typeof section.traverse !== 'function') return [];
    const out = [];
    section.traverse((o) => {
      if (!o || !o.isMesh) return;
      const ud = o.userData || {};
      if (!ud.isAccessory) return;
      if (!isShelfHolderAccessory(ud)) return;
      out.push(o);
    });
    return out;
  }

  function buildShelfHolderFittingLeaves(panelMesh, panelData) {
    // Пока поддерживаем полкодержатели на боковых планках (side planks).
    if (!panelMesh.userData?.isSidePlank) return [];
    // Ориентация полкодержателей завязана на thickAxis='x' (локальная ось X/Y/Z в buildPanelData).
    if (panelData.thickAxis !== 'x') return [];

    const accessories = getShelfHolderAccessoryMeshesForPanel(panelMesh);
    if (!accessories.length) return [];

    const out = [];

    // side left/right влияет на то, с какой стороны ставим pos.z и знак dir.z.
    const nm = String(panelMesh.name || '');
    const isLeftPlank = /left/i.test(nm) && !/right/i.test(nm);
    const zStartInterior = isLeftPlank ? 0 : panelData.thickness;
    const dirZ = isLeftPlank ? 1 : -1;

    for (const accMesh of accessories) {
      const ud = accMesh.userData || {};

      const materialArt = String(ud.accessorySku || ud.accessoryId || ud.accessoryName || 'SHELF_DEFAULT');
      ensureMaterial(materialArt, ud.accessoryName || materialArt);

      const frontOffsetMm = Number(ud.drillFrontOffsetMm ?? ud.frontOffsetMm ?? 20);
      const instanceSpacingMm = Number(ud.drillInstanceSpacingMm ?? 0);
      const drillStartMm = Number(ud.drillStartMm ?? 50);
      const drillStepMm = Number(ud.drillStepMm ?? 32);
      const drillHoleCountRaw = Number(ud.drillHoleCount ?? 0);
      const holeDiameterMm = Number(ud.drillHoleDiameterMm ?? 5);
      const holeDepthMmRaw = Number(ud.drillHoleDepthMm ?? 12);

      const holeDepthMm = Math.min(Math.abs(holeDepthMmRaw), Math.abs(panelData.thickness));
      const infoIndex = getHoleInfoIndex(holeDepthMm, holeDiameterMm);
      if (infoIndex < 0) continue;

      const xLocal =
        frontOffsetMm +
        (Number.isFinite(accMesh.userData?.instanceIndex) ? accMesh.userData.instanceIndex : 0) * instanceSpacingMm;

      // В локальных координатах panelData:
      // - local X (контурная ось) = глубина (Z мира), от bb.min.z как "передний край"
      // - local Y (контурная ось) = высота (Y мира), от bb.min.y как "низ"
      const maxX = Number(panelData.cw ?? 0);
      const maxY = Number(panelData.ch ?? 0);
      if (!Number.isFinite(xLocal) || xLocal < 0 || xLocal > maxX) continue;

      let count = drillHoleCountRaw;
      if (!Number.isFinite(count) || count <= 0) {
        // Auto count from height
        if (!Number.isFinite(drillStepMm) || drillStepMm <= 0) continue;
        count = Math.floor((maxY - drillStartMm) / drillStepMm) + 1;
      }
      count = Math.max(0, Math.floor(count));
      if (!count) continue;

      const holes = [];
      for (let i = 0; i < count; i++) {
        const yLocal = drillStartMm + i * drillStepMm;
        if (!Number.isFinite(yLocal) || yLocal < 0 || yLocal > maxY) continue;
        holes.push({
          pos: { x: xLocal, y: yLocal, z: zStartInterior },
          dir: { x: 0, y: 0, z: dirZ },
          infoIndex,
        });
      }
      if (!holes.length) continue;

      const tblObj = {
        objType: 5,
        name: ud.accessoryName || 'Полкодержатель',
        materialArt,
        holes,
      };

      const tblIdx = pushTableObj(tblObj);
      out.push({ tableIndex: tblIdx, matrix: panelData.matrix });
    }

    return out;
  }

  /**
   * CFRN: пакеты Furniture_Присадка из сцены (включая петли с tid).
   * Источник дырок = шаблон (tid), frame = mount, matrix = MW(frame).
   * Joint на панелях — отдельно (buildJointFittingLeaves).
   */
  function collectAllTreeDrillFittingLeaves() {
    const searchRoot = state.scene;
    if (!searchRoot?.traverse) return [];

    const materialArt = 'DRILL_DEFAULT';
    ensureMaterial(materialArt, 'Присадка');
    const DR = typeof globalThis !== 'undefined' ? globalThis.__CLD_DRILL_RESOLVE : null;
    if (!DR?.resolveTemplateHoles || !DR?.cfrnDrillLeafLocalPlusMw) {
      console.error('[CFRN][drill] __CLD_DRILL_RESOLVE не загружен');
      return [];
    }

    function thickCapNearMount(mount) {
      let p = mount?.parent;
      for (let i = 0; i < 16 && p; i++) {
        const t =
          Number(p.userData?.thickness) ||
          Number(p.userData?.wallThickness) ||
          Number(p.userData?.panelThickness) ||
          0;
        if (t > 0) return Math.abs(t);
        const sz = p.userData?.size;
        if (sz && typeof sz === 'object') {
          const dims = [Number(sz.x), Number(sz.y), Number(sz.z)].filter((n) => n > 0);
          if (dims.length) {
            const minD = Math.min(...dims);
            if (minD > 0 && minD <= 40) return minD;
          }
        }
        p = p.parent;
      }
      return 16;
    }

    const mounts = [];
    const seen = new Set();
    searchRoot.traverse((o) => {
      if (!o || seen.has(o.uuid)) return;
      const nm = String(o.name || '');
      const tid = Number(o.userData?.cfrnDrillTemplateId) || 0;
      const isDrillPkg =
        (nm.startsWith('Furniture_') && /присадк/i.test(nm)) ||
        (nm.startsWith('Furniture_') && tid > 0);
      if (!isDrillPkg) return;
      seen.add(o.uuid);
      mounts.push(o);
    });
    if (!mounts.length) return [];

    const allTpl = _readLS('clodis_drilling_templates_v2') || [];
    const out = [];

    for (const mount of mounts) {
      mount.updateMatrixWorld?.(true);
      const tid = Number(mount.userData?.cfrnDrillTemplateId) || 0;
      if (!(tid > 0)) {
        console.warn('[CFRN][drill] Присадка без cfrnDrillTemplateId', mount.name);
        continue;
      }
      const thickCap = thickCapNearMount(mount);
      const resolved = DR.resolveTemplateHoles(
        tid,
        0,
        (id) => allTpl.find((t) => Number(t.id) === Number(id)) || null,
        (tpl, st) => jointTemplateHolesForSetup(tpl, st),
      );
      if (resolved.empty || !resolved.holes.length) {
        console.warn('[CFRN][drill] пустой шаблон (админка → выгрузить)', {
          tid,
          mount: mount.name,
        });
        continue;
      }
      const mapped = DR.mapTemplateHolesToLocal(resolved.holes, {
        mmPerUnit: 1,
        planeAlign: false,
      });
      const localGroups = [];
      for (const raw of mapped) {
        const d = Number(raw.diameterMm);
        let dep = Number(raw.depthMm);
        if (!Number.isFinite(d) || d <= 0 || !Number.isFinite(dep) || dep <= 0) continue;
        dep = Math.min(Math.abs(dep), thickCap > 0 ? thickCap : Math.abs(dep));
        const ii = getHoleInfoIndex(dep, d);
        if (ii < 0) continue;
        const dirKey = String(raw.dirKey || '-z').toLowerCase();
        const dLoc = _cfrnDrillDirVecFromKey(dirKey);
        localGroups.push({
          pos: { x: Number(raw.x) || 0, y: Number(raw.y) || 0, z: Number(raw.z) || 0 },
          dir: { x: dLoc.x, y: dLoc.y, z: dLoc.z },
          infoIndex: ii,
        });
      }
      if (!localGroups.length) continue;

      const leaf = DR.cfrnDrillLeafLocalPlusMw(mount, localGroups, matrixWorld16);
      const label = String(mount.name || 'Присадка').replace(/^Furniture_/, '') || 'Присадка';
      out.push({
        tableIndex: pushTableObj({
          objType: 5,
          name: label,
          materialArt,
          holes: leaf.holes,
        }),
        matrix: leaf.matrix,
        mount: leaf.mount,
        dedupeKey: `furni-drill:${mount.uuid}`,
      });
    }

    return out;
  }

  /**
   * Генерирует листья CFRN для крепёжных отверстий (Конфирмат и др.) по схемам jointSchemes.
   * Данные берутся из userData.jointSchemes панели (сохранены через ClodisBuilder.buildWall).
   */
  function buildJointFittingLeaves(panelMesh, panelData) {
    // Ищем jointSchemes на меше или его предках
    let jSchemes = null;
    let cur = panelMesh;
    while (cur) {
      if (Array.isArray(cur.userData?.jointSchemes) && cur.userData.jointSchemes.length > 0) {
        jSchemes = cur.userData.jointSchemes;
        break;
      }
      cur = cur.parent;
    }
    if (!jSchemes || !jSchemes.length) return [];

    const allSchemes = _readLS('clodis_drill_schemes_v1');
    const allTemplates = _readLS('clodis_drilling_templates_v2');

    const { cw, ch, thickness, thickAxis, matrix } = panelData;
    const out = [];

    for (const jEntry of jSchemes) {
      const { jointIdx, schemeId, seamLen, schemeName } = jEntry;
      const seamSizeKey = String(jEntry.seamSizeKey || 'z');
      const facing = String(jEntry.facing || 'inside').toLowerCase() === 'outside' ? 'outside' : 'inside';

      const scheme = allSchemes.find(s => Number(s.id) === Number(schemeId));
      if (!scheme) {
        console.warn(
          '[CFRN][joint] scheme not found id=',
          schemeId,
          schemeName || '',
          '— в LS схем:',
          (allSchemes || []).map((s) => s.id),
          '. Откройте админку крепежа или дождитесь ClodisDrillRegistry.',
        );
        continue;
      }

      const template = allTemplates.find(t => Number(t.id) === Number(scheme.templateId));
      const setupType = resolveJointDrillTemplateSetupType(template, jEntry.setupType);
      const templateHoleList = template ? jointTemplateHolesForSetup(template, setupType) : [];
      // Как превью constructor-clodis: отверстия могут быть только в holesBySetup[setupType], без legacy holes[].
      if (!template || !templateHoleList.length) {
        console.warn(
          '[CFRN][joint] шаблон не найден или нет отверстий scheme=',
          schemeId,
          'templateId=',
          scheme.templateId,
          'templates in LS:',
          (allTemplates || []).map((t) => t.id),
        );
        continue;
      }

      const panelRoot = _cfrnFindJointPanelRoot(panelMesh);
      const panelBb = new THREE.Box3().setFromObject(panelMesh);
      const jIdxNum = Number(jointIdx);
      // Как превью: contactId / neighbor для synthetic jointIdx (эксцентр на пласти фасада).
      const contact = panelRoot
        ? resolveContactForJointSchemeEntry(panelRoot, jEntry, state.scene, {
            mmPerWorldUnit: CLD_SCENE_MM,
          })
        : null;
      // Базис: длина стыка = перекрытие контакта, не полный габарит панели.
      const seamGeomMm = jointSeamGeomLenPreferContactMm(
        contact,
        panelBb,
        jIdxNum,
        CLD_SCENE_MM,
        0,
      );
      if (!(seamGeomMm > 1) || !contact?.active || !contact?.neighborPanel) {
        console.warn('[CFRN][joint] нет активного стыка — пропуск', {
          panel: panelMesh.name,
          jointIdx: jIdxNum,
          contactId: jEntry.contactId || null,
          neighborName: jEntry.neighborName || null,
          schemeId,
          seamOv: contact?.seamOverlapMm,
          active: contact?.active,
        });
        continue;
      }
      const minW = resolveSchemeMinSeamWidthMm(scheme, template, setupType);
      if (!contactAllowsSchemeBySeamWidth(contact, minW)) continue;
      const seamStored = Number(seamLen);
      // CAD этап 2: тот же resolve, что комната / превью.
      const { seamLenMm: seamForScheme, positions } = resolveJointSchemeStationsMm({
        scheme,
        seamGeomMm,
        seamStoredMm: seamStored,
        authoredPositions: jEntry.positions,
      });
      if (seamForScheme <= 0 || !positions.length) continue;
      if (
        Number.isFinite(seamStored) &&
        seamStored > 0 &&
        seamGeomMm > 1 &&
        Math.abs(seamStored - seamGeomMm) > 2
      ) {
        console.log('[CFRN][joint] seamLen JSON vs геометрия — для схемы берём геом:', {
          panel: panelMesh.name,
          jointIdx: jIdxNum,
          seamStored,
          seamGeomMm,
        });
      }

      const { seamAx, faceAxis } = _cfrnJointFaceSeamAndEdgeAxes(
        panelBb,
        Number.isFinite(jIdxNum) && jIdxNum >= 0 && jIdxNum <= 3 ? jIdxNum : 0,
      );
      let outward =
        contact.hostOutwardWorld && typeof contact.hostOutwardWorld.clone === 'function'
          ? contact.hostOutwardWorld.clone().normalize()
          : _jointOutwardNormal(
              Number.isFinite(jIdxNum) && jIdxNum >= 0 && jIdxNum <= 3 ? jIdxNum : 0,
              panelBb,
            );
      const neighborRoot = contact.neighborPanel
        ? _cfrnFindJointPanelRoot(contact.neighborPanel) || contact.neighborPanel
        : null;
      let neighborBb = null;
      if (neighborRoot) {
        neighborBb = new THREE.Box3().setFromObject(neighborRoot);
        if (neighborBb.isEmpty()) neighborBb = null;
      }
      const neighborForJoint = neighborRoot
        ? {
            mesh: neighborRoot,
            thicknessMm: (() => {
              const t = Number(neighborRoot.userData?.__cldNominalThicknessMm);
              if (Number.isFinite(t) && t > 0) return t;
              if (!neighborBb) return 16;
              const s = new THREE.Vector3();
              neighborBb.getSize(s);
              return Math.min(s.x, s.y, s.z) || 16;
            })(),
          }
        : _findNeighborPanelForJoint(state.scene, panelMesh, jIdxNum);
      if (!neighborRoot && neighborForJoint?.mesh) {
        neighborBb = new THREE.Box3().setFromObject(neighborForJoint.mesh);
      }
      if (neighborForJoint?.mesh && neighborBb && !neighborBb.isEmpty()) {
        const cA = panelBb.getCenter(new THREE.Vector3());
        const cB = neighborBb.getCenter(new THREE.Vector3());
        const toNeighbor = cB.sub(cA);
        if (toNeighbor.lengthSq() > 0 && outward.dot(toNeighbor) < 0) {
          outward = outward.clone().multiplyScalar(-1);
        }
      }

      const panelThickMm = Number(thickness) || 0;
      const neighborThickForRoles = neighborForJoint ? neighborForJoint.thicknessMm : 16;
      const hostFaceType =
        contact.hostFaceType === 'plast' || contact.hostFaceType === 'torets'
          ? contact.hostFaceType
          : faceAxis === thickAxis
            ? 'plast'
            : 'torets';
      let neighborFaceType =
        contact.neighborFaceType === 'plast' || contact.neighborFaceType === 'torets'
          ? contact.neighborFaceType
          : 'torets';
      if (!contact.neighborFaceType && neighborForJoint?.mesh) {
        const nbBox = neighborBb || new THREE.Box3().setFromObject(neighborForJoint.mesh);
        const neighborThickAxis = _bboxThickAxis(nbBox);
        neighborFaceType = faceAxis === neighborThickAxis ? 'plast' : 'torets';
      }
      let targetThickMm =
        hostFaceType === 'torets' && neighborFaceType === 'plast'
          ? neighborThickForRoles
          : panelThickMm;
      let classificationThickMm = targetThickMm;
      if (setupType === 3 && neighborRoot && neighborBb && !neighborBb.isEmpty()) {
        const fe = identifySetup3FaceEdgePanels(panelRoot, neighborRoot, hostFaceType, neighborFaceType);
        if (fe?.facePanel) {
          classificationThickMm = fe.facePanel === panelRoot
            ? panelThickMm
            : neighborThickForRoles;
          targetThickMm = classificationThickMm;
        }
      }

      // БМ: параметрическая фурнитура = один objType:5 на точку схемы, отверстия в СК шаблона.
      // Панели сверлит Базис сам — не проецируем дырки на полку/бок (иначе дубли со смещением).
      const normalizedHoles = [];
      for (const hRaw of templateHoleList) {
        const h = normalizeJointHoleForFitting(hRaw);
        if (!h || h.through) continue;
        const infoIndex = getHoleInfoIndex(h.depthMm, h.diameterMm);
        if (infoIndex < 0) continue;
        normalizedHoles.push({ ...h, infoIndex });
      }
      if (!normalizedHoles.length) continue;

      const nIn = outward.clone().multiplyScalar(-1).normalize();
      const tSeam = contact.hostSeamDirWorld
        ? contact.hostSeamDirWorld.clone().normalize()
        : (() => {
            const t = new THREE.Vector3();
            t[seamAx] = 1;
            return t;
          })();
      const schemeArt = `JOINT_SCH_${schemeId}`;
      ensureMaterial(schemeArt, schemeName || `Схема крепежа #${schemeId}`);

      let posIdx = 0;
      for (const p of positions) {
        const seamW = jointSeamWorldPoint(
          panelRoot,
          jIdxNum,
          seamForScheme,
          p,
          CLD_SCENE_MM,
          contact,
        );
        if (!seamW) continue;
        const rawPlacements = getJointTemplatePlacementsUnified({
          seamWorld: seamW,
          outward,
          nInWorld: nIn,
          tSeamWorld: tSeam,
          jointIdx: jIdxNum,
          setupType,
          holes: normalizedHoles,
          panelThickMm,
          targetThickMm,
          classificationThickMm,
          mmPerWorldUnit: CLD_SCENE_MM,
          hostPanel: panelRoot,
          neighborPanel: neighborRoot,
          hostBBox: panelBb,
          neighborBBox: neighborBb,
          seamPosMm: Number(p) || 0,
          seamLenMm: seamForScheme,
          seamSizeKey,
          facing,
          hostFaceType,
          neighborFaceType,
          contact,
        });
        if (!rawPlacements.length) {
          console.warn('[CFRN][joint] пустые placements — пропуск точки', {
            panel: panelMesh.name,
            jointIdx: jIdxNum,
            contactId: jEntry.contactId || null,
            hostFaceType,
            neighborFaceType,
            setupType,
            seamPosMm: p,
          });
          continue;
        }

        const frame =
          rawPlacements[0]?.templateFrame ||
          rawPlacements[0]?.setup3Frame ||
          null;
        if (!frame?.O) {
          console.warn('[CFRN][joint] нет кадра шаблона — пропуск точки схемы', {
            panel: panelMesh.name,
            jointIdx: jIdxNum,
            seamPosMm: p,
          });
          continue;
        }

        // Отверстия в локали кадра: O + eX·x − eY·y − eZ·z (setup3TemplatePointWorld).
        const holesLocal = [];
        for (const h of normalizedHoles) {
          const dLoc = _cfrnDrillDirVecFromKey(h.dirKey);
          holesLocal.push({
            pos: {
              x: Number(h.xMm) || 0,
              y: -(Number(h.yMm) || 0),
              z: -(Number(h.zMm) || 0),
            },
            dir: { x: dLoc.x, y: dLoc.y, z: dLoc.z },
            infoIndex: h.infoIndex,
          });
        }
        if (!holesLocal.length) continue;

        posIdx += 1;
        const tblIdx = pushTableObj({
          objType: 5,
          name: `${schemeName || `Крепёж #${schemeId}`} (${posIdx})`,
          materialArt: schemeArt,
          holes: holesLocal,
        });
        out.push({
          tableIndex: tblIdx,
          matrix: matrix16FromJointTemplateFrame(frame),
          mount: panelMesh,
          dedupeKey: `joint:${schemeId}:${jIdxNum}:${Number(p) || 0}`,
        });
      }

      console.log(
        `[CFRN][joint] panel="${panelMesh.name}" jointIdx=${jIdxNum} scheme="${schemeName}" ` +
          `seam=${seamForScheme} positions=${positions.length} holesInTpl=${normalizedHoles.length} ` +
          `leaves=${posIdx} (furniture CS, как БМ параметрика)`
      );
    }

    return out;
  }

  function getSectionMeta(obj) {
    let p = obj;
    while (p) {
      const ud = p.userData || {};
      if (ud.sectionId != null) {
        const sectionId = String(ud.sectionId);
        const fromState = Array.isArray(state.customSections)
          ? state.customSections.find((s) => String(s?.id) === sectionId)
          : null;
        return {
          id: sectionId,
          name: fromState?.name || ud.sectionName || p.name || `Секция ${sectionId}`,
        };
      }
      p = p.parent;
    }
    return null;
  }
  function createContainerNode(name) {
    const sectionTableIndex = tableIdx++;
    tableObjects.push({
      objType: 7,
      name: name || 'Секция',
      isAssemblyUnit: false,
    });
    return {
      tableIndex: sectionTableIndex,
      matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      objs: [],
      __childrenByKey: new Map(),
    };
  }

  function getOrCreateChildNode(parentNode, key, name) {
    if (!parentNode.__childrenByKey) parentNode.__childrenByKey = new Map();
    if (parentNode.__childrenByKey.has(key)) return parentNode.__childrenByKey.get(key);
    const child = createContainerNode(name);
    parentNode.__childrenByKey.set(key, child);
    parentNode.objs.push(child);
    return child;
  }

  function findFurnitureRoot(obj) {
    let p = obj;
    while (p) {
      if (p.userData?.isFurniture && p.isGroup) return p;
      p = p.parent;
    }
    return null;
  }

  function getFurnitureSectionChain(mesh, furnitureRoot) {
    const chain = [];
    let p = mesh.parent;
    while (p && p !== furnitureRoot) {
      const ud = p.userData || {};
      if (ud.isSection) {
        const role = String(ud.layoutRole || '').trim();
        const nm = ud.sectionName || p.name || role || 'Секция';
        chain.push({
          key: `section:${p.uuid}`,
          name: role ? `${nm}` : nm,
        });
      }
      p = p.parent;
    }
    chain.reverse();
    return chain;
  }

  const rootNode = createContainerNode('Общая секция');
  modelObjs.push(rootNode);

  const exportedHingeLeafKeys = new Set();

  function resolveCfrnParentNodeForSceneObject(obj) {
    let parentNode = rootNode;
    const secMeta = getSectionMeta(obj);
    if (secMeta?.id) {
      parentNode = getOrCreateChildNode(
        parentNode,
        `room:${secMeta.id}`,
        secMeta.name || `Секция ${secMeta.id}`
      );
    }
    const furnRoot = findFurnitureRoot(obj);
    if (furnRoot) {
      const furnName = furnRoot.name || furnRoot.userData?.name || 'Шкаф';
      parentNode = getOrCreateChildNode(parentNode, `furniture:${furnRoot.uuid}`, furnName);
      const chain = getFurnitureSectionChain(obj, furnRoot);
      for (const item of chain) {
        parentNode = getOrCreateChildNode(parentNode, item.key, item.name);
      }
    }
    return parentNode;
  }

  let cfrnHingePlaceholderSkipLogged = false;

  state.scene.traverse((obj) => {
    if (!isExportableMesh(obj)) return;
    if (!obj.geometry || !obj.geometry.attributes?.position) return;

    const ud = obj.userData || {};
    if (isCabinetModelPlaceholderMesh(obj)) return;
    if (isHingeExportMesh(obj) && !exportHingePlaceholderMeshesToCfrn() && !isCatalogHingeModelMesh(obj)) {
      if (!cfrnHingePlaceholderSkipLogged) {
        cfrnHingePlaceholderSkipLogged = true;
        console.log(
          '[CFRN] Петли: мелкие STL-плейсхолдеры не пишем. Каталожный GLB (Model_*) — в файле для сверки. ' +
            'Все кубики: window.__CLD_CFRN_EXPORT_HINGE_MESH = true'
        );
      }
      return;
    }
    const geo = obj.geometry;
    if (!geo.boundingBox) geo.computeBoundingBox();
    const lx = geo.boundingBox.max.x - geo.boundingBox.min.x;
    const ly = geo.boundingBox.max.y - geo.boundingBox.min.y;
    const lz = geo.boundingBox.max.z - geo.boundingBox.min.z;
    if (lx < 0.01 && ly < 0.01 && lz < 0.01) return;

    let tblIdx;
    let matrix;

    let panelDataForSideHolders = null;
    if (shouldTreatAsPanel(obj)) {
      const pd = buildPanelData(obj, materials, matResolver);
      tblIdx = pushTableObj(pd.tableObj);
      matrix = pd.matrix;
      panelDataForSideHolders = pd;
      const buttIdx = (pd.tableObj.butts || []).map((b) => b.elemIndex).join(',');
      const furnRoot = findFurnitureRoot(obj);
      const sectionPath = furnRoot
        ? getFurnitureSectionChain(obj, furnRoot)
            .map((c) => c.name)
            .join(' / ')
        : '';
      cfrnPanelExportLog.push({
        name: pd.tableObj.name,
        cw: Math.round(pd.cw * 10) / 10,
        ch: Math.round(pd.ch * 10) / 10,
        thickness: Math.round(pd.thickness * 10) / 10,
        thickAxis: pd.thickAxis,
        sectionPath,
        furnName: furnRoot?.userData?.catalogName || furnRoot?.name || '',
      });
      console.log(
        `[CFRN]  panel "${pd.tableObj.name}": cw=${pd.cw.toFixed(1)} ch=${pd.ch.toFixed(1)} t=${pd.thickness.toFixed(1)}mm thickAxis=${pd.thickAxis} butts=${pd.tableObj.butts?.length || 0} elem=[${buttIdx}] pos=(${pd.matrix[12].toFixed(0)},${pd.matrix[13].toFixed(0)},${pd.matrix[14].toFixed(0)})`
      );
    } else {
      const hinge = isHingeExportMesh(obj);
      // CAD single-chain: все каталожные Model_* (включая направляющие) — local+MW.
      const cabPack = catalogCabinetModelGeoAndMatrix(obj);
      let geo;
      let cabFrameNote = '';
      if (cabPack) {
        geo = cabPack.geo;
        matrix = cabPack.matrix;
        cabFrameNote = cabPack.isLSeam ? ' [L-seam Model_* frame]' : ' [Model_* frame]';
      } else {
        geo = worldGeo(obj);
        matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
      }
      const stlData = stlFromGeo(exporter, geo);
      const stlName = `model_${stlCount}.stl`;
      zip.file(`models/${stlName}`, stlData);

      const triIdx = tableTriangles.length;
      tableTriangles.push(stlName);
      stlCount++;

      const cabRoot = cabPack?.frame || findCabinetModelRoot(obj);
      const cabSpecId = cabRoot ? String(cabRoot.userData?.modelSpecId || '').trim() : '';
      const cabLabel = cabRoot
        ? String(cabRoot.userData?.modelKey || cabRoot.name || '').replace(/^Model_/, '').trim()
        : '';
      let materialArt = hinge
        ? (String(ud.accessorySku || ud.accessoryId || '').trim() || 'HINGE_DEFAULT')
        : cabSpecId
          ? `ACC_${cabSpecId}`
          : 'ACC_DEFAULT';
      let matSign = '';
      if (cabRoot && matResolver?.resolveCabinetModel) {
        const cm = matResolver.resolveCabinetModel(cabSpecId, cabLabel);
        materialArt = cm.art;
        matSign = cm.sign;
        ensureMaterial(materialArt, cm.name, matSign);
      } else if (hinge) {
        ensureMaterial(materialArt, ud.accessoryName || obj.name || 'Петля', matSign);
      } else if (cabRoot) {
        ensureMaterial(
          materialArt,
          ud.accessoryName || cabLabel || obj.name || 'Комплектующее',
          matSign
        );
      }
      const modelName = hinge
        ? (String(ud.accessoryName || obj.name || 'Петля').trim() || 'Петля')
        : cabLabel || (obj.name || 'Деталь');
      const tblObj = { objType: 5, name: modelName, materialArt, triangleData: triIdx };
      tblIdx = pushTableObj(tblObj);

      const sx = geo.boundingBox.max.x - geo.boundingBox.min.x;
      const sy = geo.boundingBox.max.y - geo.boundingBox.min.y;
      const sz = geo.boundingBox.max.z - geo.boundingBox.min.z;
      console.log(
        `[CFRN]  model "${modelName}": ${sx.toFixed(0)}×${sy.toFixed(0)}×${sz.toFixed(0)}mm stl=${stlName} (${stlData.length} bytes)${hinge ? ' [петля]' : ''}${cabFrameNote}`
      );
      if (cabPack?.isLSeam) {
        console.log(
          `[CFRN]  Model_* frame "${modelName}" mode=local+MW tid=${cabSpecId || '-'}`,
        );
      }
    }

    const leaf = { tableIndex: tblIdx, matrix };
    let parentNode = rootNode;

    // 1) Секция комнаты (глобальная секция, где стоит шкаф)
    const secMeta = getSectionMeta(obj);
    if (secMeta?.id) {
      parentNode = getOrCreateChildNode(parentNode, `room:${secMeta.id}`, secMeta.name || `Секция ${secMeta.id}`);
    }

    // 2) Иерархия шкафа из Clodis: мебель -> подсекции (cabinet_root/plinth/corpus/facade...)
    const furnRoot = findFurnitureRoot(obj);
    if (furnRoot) {
      const furnName = furnRoot.name || furnRoot.userData?.name || 'Шкаф';
      parentNode = getOrCreateChildNode(parentNode, `furniture:${furnRoot.uuid}`, furnName);
      const chain = getFurnitureSectionChain(obj, furnRoot);
      for (const item of chain) {
        parentNode = getOrCreateChildNode(parentNode, item.key, item.name);
      }
    }

    parentNode.objs.push(leaf);
    if (panelDataForSideHolders) {
      const fittingLeaves = buildShelfHolderFittingLeaves(obj, panelDataForSideHolders);
      for (const fl of fittingLeaves) parentNode.objs.push(fl);
      // Крепёжные отверстия по схемам jointSchemes — лист под целевой панелью (как петли).
      const jointLeaves = buildJointFittingLeaves(obj, panelDataForSideHolders);
      for (const fl of jointLeaves) {
        const jointParent = fl.mount
          ? resolveCfrnParentNodeForSceneObject(fl.mount)
          : parentNode;
        const { mount: _jm, dedupeKey: _jdk, ...jLeaf } = fl;
        jointParent.objs.push(jLeaf);
      }
      // Присадка фурнитуры/петель — только collectAllTreeDrillFittingLeaves (ниже).
    }
    exportedCount++;
  });

  // Furniture_Присадка из дерева → CFRN (шаблон + MW frame).
  {
    const treeDrillLeaves = collectAllTreeDrillFittingLeaves();
    for (const fl of treeDrillLeaves) {
      const dedupeKey = fl.dedupeKey || `furni-drill:${fl.mount?.uuid || fl.tableIndex}`;
      if (exportedHingeLeafKeys.has(dedupeKey)) continue;
      exportedHingeLeafKeys.add(dedupeKey);
      const drillParent = fl.mount
        ? resolveCfrnParentNodeForSceneObject(fl.mount)
        : rootNode;
      const { mount: _fm, dedupeKey: _fdk, ...dLeaf } = fl;
      drillParent.objs.push(dLeaf);
    }
    if (treeDrillLeaves.length) {
      console.log(`[CFRN][drill] пакетов присадки: ${treeDrillLeaves.length}`);
    }
  }

  let pendingCabinetPlaceholders = 0;
  state.scene.traverse((o) => {
    if (isCabinetModelPlaceholderMesh(o) && o.visible !== false) pendingCabinetPlaceholders++;
  });
  if (pendingCabinetPlaceholders > 0) {
    console.warn(
      `[CFRN] ${pendingCabinetPlaceholders} каталожных model (опоры и т.п.) ещё не загрузили FBX/GLB — в Bazis их не будет. ` +
        'Подождите пару секунд после открытия комнаты и экспортируйте снова.'
    );
  }

  if (!exportedCount) {
    console.warn('[CFRN] Ничего не найдено, экспортирую все видимые меши...');
    state.scene.traverse((obj) => {
      if (!obj?.isMesh || obj.visible === false) return;
      const ud = obj.userData || {};
      if (ud.isWallAo || ud.isContactShadow || ud.isWallPlane || ud.isCeiling) return;
      if (ud.isSectionNicheDebugPart || ud.isCornerPlankDebugMarker) return;
      if (!obj.geometry || !obj.geometry.attributes?.position) return;

      const wGeo = worldGeo(obj);
      const stlData = stlFromGeo(exporter, wGeo);
      const stlName = `model_${stlCount}.stl`;
      zip.file(`models/${stlName}`, stlData);
      const triIdx = tableTriangles.length;
      tableTriangles.push(stlName);
      stlCount++;

      const tblObj = { objType: 5, name: obj.name || 'Деталь', materialArt: 'LDSP_DEFAULT', triangleData: triIdx };
      const tblIdx = pushTableObj(tblObj);
      rootNode.objs.push({ tableIndex: tblIdx, matrix: [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1] });
      exportedCount++;
    });
  }

  if (!exportedCount) {
    throw new Error('Нет объектов для экспорта.');
  }

  function stripRuntimeMaps(node) {
    delete node.__childrenByKey;
    if (Array.isArray(node.objs)) {
      for (const ch of node.objs) {
        if (ch && typeof ch === 'object' && Array.isArray(ch.objs)) stripRuntimeMaps(ch);
      }
    }
  }
  stripRuntimeMaps(rootNode);

  const materialsArr = [...materials.values()];
  for (const tblObj of tableObjects) {
    if (tblObj.materialArt) {
      tblObj.materialIndex = materialsArr.findIndex(m => m.art === tblObj.materialArt);
      if (tblObj.materialIndex < 0) tblObj.materialIndex = 0;
      delete tblObj.materialArt;
    }
    if (Array.isArray(tblObj.butts)) {
      for (const b of tblObj.butts) {
        if (!b || !b.materialArt) continue;
        b.materialIndex = materialsArr.findIndex(m => m.art === b.materialArt);
        if (b.materialIndex < 0) b.materialIndex = 0;
        delete b.materialArt;
      }
    }
  }

  const fileJson = {
    model: { objs: modelObjs },
    table: {
      objects: tableObjects,
      holes: tableHoles,
      materials: materialsArr,
      triangles: tableTriangles,
    },
    modelParams: {
      name: 'Clodis Export',
      art: 'EXP-' + Date.now(),
      orderName: new Date().toISOString().split('T')[0],
    },
  };

  const jsonStr = JSON.stringify(fileJson, null, 2);
  zip.file('file.json', jsonStr);

  const panelCount = tableObjects.filter(o => o.objType === 2).length;
  const modelCount = tableObjects.filter(o => o.objType === 5).length;
  const sectionCount = tableObjects.filter(o => o.objType === 7).length;
  console.log(`[CFRN] file.json: ${jsonStr.length} chars | sections(objType:7): ${sectionCount}, panels(objType:2): ${panelCount}, models(objType:5): ${modelCount}, triangles: ${tableTriangles.length}, materials: ${materialsArr.length}`);

  const byFurn = new Map();
  for (const p of cfrnPanelExportLog) {
    const k = p.furnName || '(без имени)';
    if (!byFurn.has(k)) byFurn.set(k, []);
    byFurn.get(k).push(p);
  }
  for (const [furnName, panels] of byFurn.entries()) {
    const verticalCh = [
      ...new Set(
        panels
          .filter((p) => p.thickAxis === 'v' || (p.thickAxis === 'x' && p.ch > 80))
          .map((p) => Math.round(p.ch))
      ),
    ].sort((a, b) => a - b);
    const corpusBand = panels.filter((p) => /корпус|corpus|бок|стенк/i.test(`${p.sectionPath} ${p.name}`));
    const corpusCh = [
      ...new Set(corpusBand.map((p) => Math.round(p.ch))),
    ].sort((a, b) => a - b);
    console.log('[BAZIS-SIZE][CFRN] уходит в file.json', furnName, {
      panelCount: panels.length,
      corpusBandChMm: corpusCh,
      allVerticalChMm: verticalCh,
      plinthCh: panels
        .filter((p) => /цоколь|plinth/i.test(`${p.sectionPath} ${p.name}`))
        .map((p) => Math.round(p.ch)),
      topCh: panels
        .filter((p) => /верх|top|крыш/i.test(`${p.sectionPath} ${p.name}`))
        .map((p) => Math.round(p.ch)),
    });
  }
  console.log('[BAZIS-SIZE][CFRN] все панели (ch = высота в Bazis для гориз. плит)', cfrnPanelExportLog);

  return await zip.generateAsync({ type: 'uint8array' });
  } finally {
    try {
      _cfrnDoorSnap();
      state.scene?.updateMatrixWorld?.(true);
    } catch (_) {}
  }
}

function downloadBlob(data, filename, mime = 'application/zip') {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export async function downloadCFRN() {
  try {
    console.log('[Bazis] Собираю CFRN...');
    const data = await buildCFRNZip();
    console.log('[Bazis] CFRN готов, размер:', data.length, 'байт');
    downloadBlob(data, `export_${safeNowStamp()}.cfrn`);
  } catch (e) {
    console.error('[Bazis] downloadCFRN failed:', e);
    alert('Ошибка при создании CFRN: ' + e.message);
  }
}

export async function exportToBazisCloud() {
  try {
    console.log('[Bazis] === Экспорт в Bazis Cloud ===');

    console.log('[Bazis] 1/4: Собираю CFRN...');
    const cfrnData = await buildCFRNZip();
    console.log('[Bazis] CFRN готов:', cfrnData.length, 'байт');

    console.log('[Bazis] 2/4: Отправляю на сервер (config/index.php/api/bazis_convert)...');
    const formData = new FormData();
    formData.append('convertType', '1');
    formData.append('models', new Blob([cfrnData], { type: 'application/zip' }), 'model.cfrn');

    const sendResp = await fetch('config/index.php/api/bazis_convert', {
      method: 'POST',
      body: formData,
      headers: { Apikey: BAZIS_API_KEY },
    });

    if (!sendResp.ok) {
      const errText = await sendResp.text().catch(() => '');
      throw new Error(`bazis_convert вернул ${sendResp.status}: ${errText}`);
    }

    const taskId = await sendResp.text();
    console.log('[Bazis] 3/4: Задача создана, taskId:', taskId);

    console.log('[Bazis] 4/4: Жду результат (Bazis может отдавать 400 «Task no success», пока идёт конвертация)...');
    const cleanTaskId = String(taskId).replace(/["\s]/g, '');
    const maxAttempts = 120;
    const pollDelayMs = 5000;
    for (let i = 0; i < maxAttempts; i++) {
      const checkResp = await fetch(`config/index.php/api/bazis_check_task/${cleanTaskId}`, {
        method: 'GET',
      });

      if (checkResp.status === 200) {
        const ct = (checkResp.headers.get('content-type') || '').toLowerCase();

        if (ct.includes('application/octet-stream') || ct.includes('application/zip')) {
          const blob = await checkResp.blob();
          console.log('[Bazis] Результат получен:', blob.size, 'байт, ct:', ct);
          fetch('config/index.php/bazis/bazis_decrement/', { method: 'GET' }).catch(() => {});

          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `model_${safeNowStamp()}.b3d`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
          console.log('[Bazis] B3D скачан!');
          return;
        }

        const textBody = await checkResp.text();
        const downloadUrl = String(textBody || '').trim();
        if (/^https?:\/\//i.test(downloadUrl)) {
          console.log('[Bazis] Получена ссылка:', downloadUrl);
          fetch('config/index.php/bazis/bazis_decrement/', { method: 'GET' }).catch(() => {});
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `model_${safeNowStamp()}.b3d`;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          console.log('[Bazis] B3D скачан по ссылке!');
          return;
        }

        throw new Error(`bazis_check_task: неожиданный ответ (ct=${ct}): ${downloadUrl.slice(0, 200)}`);
      }

      const errBody = await checkResp.text().catch(() => '');
      const errShort = String(errBody || '').replace(/\s+/g, ' ').slice(0, 220);
      console.log(
        `[Bazis] Попытка ${i + 1}/${maxAttempts}, status=${checkResp.status}, жду ${pollDelayMs / 1000}с…${errShort ? ` (${errShort})` : ''}`
      );
      await new Promise((r) => setTimeout(r, pollDelayMs));
    }

    throw new Error('Таймаут: результат конвертации не получен за 10 мин.');
  } catch (e) {
    console.error('[Bazis] exportToBazisCloud failed:', e);
    alert('Ошибка экспорта в Bazis: ' + e.message);
  }
}
