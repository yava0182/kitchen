/**
 * Joint Engine v2 — единая точка истины для стыков (как в Bazis-Мебельщик).
 *
 * Принципы (Базис / САПР):
 *  1. Стык = общая часть торцов и/или пластей двух панелей.
 *  2. Для крепежа по схемам ищем пару «торец ↔ пласть» (и наоборот).
 *     Не сценарии «бок+полка» / «фасад+бок» — только геометрия граней.
 *  3. Ширина стыка ≈ толщина торцевой детали (edge overlap) — в Базисе
 *     «минимальная ширина стыка» отсекает HDF 3 мм от конфирмата под 16 мм.
 *  4. Визуализация/крепёж — только active-контакты торец↔пласть.
 */
import * as THREE from '/node_modules/three/build/three.module.js';
import {
  panelFaceType,
  thinAxisForOrientation,
  getJointStripeFrameWorld,
} from '/js/panel-edge-frame.js?v=20260727-blb-seam';
import {
  jointContactTolerancesScene,
  boxDotInterval,
  measureJointNeighborPair,
  alignJointNormalToNeighbor,
  JOINT_CONTACT_GAP_MAX_MM,
  JOINT_CONTACT_GAP_MIN_MM,
  JOINT_CONTACT_OVERLAP_MIN_MM,
} from '/js/joint-panel-contact.js?v=20260725-toret-plast-v3';

/* ────────────────────────────── helpers ────────────────────────────── */

function _normO(o) {
  if (!o) return 'f';
  const s = String(o).trim().toLowerCase();
  if (s === 'f' || s === 'frontal' || s === 'front' || s === 'face') return 'f';
  if (s === 'v' || s === 'vertical') return 'v';
  if (s === 'h' || s === 'horizontal') return 'h';
  return s;
}

function _panelOrientation(panelRoot) {
  // Комната: orientation на userData.__cldPanelOrientation (ClodisBuilder), не только config.
  let cur = panelRoot;
  for (let i = 0; i < 8 && cur; i++) {
    const ud = cur.userData || {};
    const raw =
      ud.__cldPanelOrientation ||
      cur.config?.spec?.orientation ||
      cur.config?.orientation ||
      null;
    if (raw != null && String(raw).trim() !== '') return _normO(raw);
    if (ud.isFacade) return 'f';
    if (ud.isSidePlank || ud.isSideOverlay) return 'v';
    cur = cur.parent;
  }
  return 'f';
}

/**
 * BBox геометрии панели в мире.
 *
 * Стратегия (как в Bazis/PolyBoard — геометрия панели = её аналитический объём,
 * а не сумма всех мешей под нодой):
 *  1) Если у узла есть `calculated.u_size` (CabinetWallNode/CabinetFacadeNode) —
 *     строим точный коробчатый bbox в локали own_object и применяем matrixWorld.
 *     Это исключает попадание дочерних аксессуаров/секций в bbox панели.
 *  2) Иначе пробуем найти меш с именем = name самой ноды (это «корневой»
 *     меш-куб панели в этой сборке).
 *  3) Иначе fallback к прежней широкой выборке всех мешей (без accessory/edges/etc).
 */
export function panelBBoxWorld(panelRoot) {
  if (!panelRoot) return null;

  // 1) Точный bbox по u_size (если доступен)
  const u = panelRoot?.calculated?.u_size;
  const own = panelRoot?.userData?.own_object;
  if (
    u &&
    Number.isFinite(u.x) && u.x > 0 &&
    Number.isFinite(u.y) && u.y > 0 &&
    Number.isFinite(u.z) && u.z > 0 &&
    own && typeof own.updateWorldMatrix === 'function'
  ) {
    own.updateWorldMatrix(true, false);
    // Меш-куб панели (BoxGeometry centered) в локали own_object сидит в ±u/2.
    // Slide/BLB: после _cldBlbContentOffset центр меша = offset (group.pos = BLB),
    // иначе bbox «на полширины» левее панели → нет контакта → CFRN без крепежа.
    const half = new THREE.Vector3(u.x / 2, u.y / 2, u.z / 2);
    const off = panelRoot.userData?._cldBlbContentOffset;
    const cx = Number(off?.x) || 0;
    const cy = Number(off?.y) || 0;
    const cz = Number(off?.z) || 0;
    const local = new THREE.Box3(
      new THREE.Vector3(-half.x + cx, -half.y + cy, -half.z + cz),
      new THREE.Vector3(half.x + cx, half.y + cy, half.z + cz),
    );
    const world = local.clone().applyMatrix4(own.matrixWorld);
    if (!world.isEmpty()) return world;
  }

  // 2) Берём меш с тем же именем, что и сама нода (главный "панельный" меш).
  const wantName = String(panelRoot?.name || '').trim().toLowerCase();
  if (wantName) {
    const box = new THREE.Box3();
    let found = false;
    panelRoot.traverse((ch) => {
      if (!ch || !ch.isMesh || !ch.geometry) return;
      const cn = String(ch.name || '').trim().toLowerCase();
      if (cn !== wantName) return;
      ch.updateWorldMatrix(true, false);
      const g = ch.geometry;
      if (!g.boundingBox) g.computeBoundingBox();
      const lb = g.boundingBox.clone().applyMatrix4(ch.matrixWorld);
      if (!found) { box.copy(lb); found = true; }
      else box.union(lb);
    });
    if (found && !box.isEmpty()) return box;
  }

  // 3) Широкий fallback: все «релевантные» меши.
  const isRelevant = (ch) => {
    if (!ch || !ch.isMesh || !ch.geometry) return false;
    if (ch.userData?.isAccessory) return false;
    if (ch.userData?.fromJointScheme || Number(ch.userData?.spec?.joint_hardware) === 1) return false;
    if (ch.userData?.isSectionVolume) return false;
    if (ch.userData?.isEdgesLines) return false;
    if (ch.userData?.isEdge) return false;
    if (ch.userData?.isEdgeNumber) return false;
    let p = ch.parent;
    for (let i = 0; i < 8 && p; i++) {
      if (p.userData?.fromJointScheme || p.userData?.isAccessory) return false;
      p = p.parent;
    }
    const n = String(ch.name || '').toLowerCase();
    if (n.includes('hole_') || n.includes('joint_preview_') || n.includes('furni_hole_')) return false;
    return true;
  };
  const box2 = new THREE.Box3();
  let any = false;
  panelRoot.traverse((ch) => {
    if (!isRelevant(ch)) return;
    ch.updateWorldMatrix(true, false);
    const g = ch.geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    const lb = g.boundingBox.clone().applyMatrix4(ch.matrixWorld);
    if (!any) { box2.copy(lb); any = true; }
    else box2.union(lb);
  });
  if (!any) {
    const o = own || panelRoot;
    box2.setFromObject(o);
    any = !box2.isEmpty();
  }
  return any && !box2.isEmpty() ? box2 : null;
}

/**
 * Тонкая ось панели в мире: единичный вектор вдоль "толщины".
 * Источник: orientation (v/h/f → x/y/z), затем прокручен через own_object.matrixWorld.
 * Если orientation отсутствует — fallback на ось мин. размера AABB.
 */
export function panelThinAxisWorld(panelRoot, bboxWorld = null) {
  const own = panelRoot?.userData?.own_object || panelRoot;
  const orient = _panelOrientation(panelRoot);
  let localByOrientation = null;
  if (orient === 'v') localByOrientation = new THREE.Vector3(1, 0, 0);
  else if (orient === 'h') localByOrientation = new THREE.Vector3(0, 1, 0);
  else if (orient === 'f') localByOrientation = new THREE.Vector3(0, 0, 1);

  // 1) Сначала пробуем фактическую тонкую ось по world AABB (более надёжно, если
  // orientation/локальный маппинг размеров отличается от ожидаемого).
  if (bboxWorld) {
    const sz = bboxWorld.getSize(new THREE.Vector3());
    const minDim = Math.min(sz.x, sz.y, sz.z);
    const relTol = 0.12;
    const absTol = Math.max(0.3 / 10, minDim * relTol);
    const isMinX = Math.abs(sz.x - minDim) <= absTol;
    const isMinY = Math.abs(sz.y - minDim) <= absTol;
    const isMinZ = Math.abs(sz.z - minDim) <= absTol;
    const nMin = (isMinX ? 1 : 0) + (isMinY ? 1 : 0) + (isMinZ ? 1 : 0);

    // Если минимум однозначный — берём его без оглядки на orientation.
    if (nMin === 1) {
      const v = new THREE.Vector3(isMinX ? 1 : 0, isMinY ? 1 : 0, isMinZ ? 1 : 0);
      return v.normalize();
    }
  }

  // 2) При неоднозначном min fallback к orientation.
  if (localByOrientation && own && typeof own.updateWorldMatrix === 'function') {
    own.updateWorldMatrix(true, false);
    const q = new THREE.Quaternion();
    own.matrixWorld.decompose(new THREE.Vector3(), q, new THREE.Vector3());
    localByOrientation.applyQuaternion(q);
    if (localByOrientation.lengthSq() > 1e-18) return localByOrientation.normalize();
  }

  // 3) Последний fallback: ось min(world AABB).
  if (bboxWorld) {
    const sz = bboxWorld.getSize(new THREE.Vector3());
    const ax = sz.x <= sz.y && sz.x <= sz.z ? 'x' : (sz.y <= sz.z ? 'y' : 'z');
    const v = new THREE.Vector3();
    v[ax] = 1;
    return v;
  }
  return new THREE.Vector3(0, 0, 1);
}

/**
 * Толщина панели (мм) по тонкой оси world AABB. Это точное значение, не min(bbox),
 * чтобы наклонные панели не путали "толщину" с короткой стороной.
 */
export function panelThicknessMm(panelRoot, bboxWorld, mmPerWorldUnit) {
  if (!bboxWorld) return 16;
  const tW = panelThinAxisWorld(panelRoot, bboxWorld);
  const [a, b] = boxDotInterval(bboxWorld, tW);
  return Math.abs(b - a) * mmPerWorldUnit;
}

/**
 * Ортонормированный базис полосы стыка из getJointStripeFrameWorld:
 * {s — вдоль шва, e — вдоль ребра, o — внешняя нормаль}.
 */
function _stripeOrthoBasis(fr) {
  const s = fr.seamDirWorld.clone().normalize();
  const e = fr.edgeDirWorld.clone();
  e.sub(s.clone().multiplyScalar(s.dot(e)));
  if (e.lengthSq() < 1e-16) return null;
  e.normalize();
  const o = new THREE.Vector3().crossVectors(s, e);
  if (o.dot(fr.outwardWorld) < 0) o.negate();
  o.normalize();
  return { s, e, o };
}

/* ──────────────────────── face type / classification ─────────────────── */

/**
 * Тип грани соседа: определяется ПО СОСЕДУ (его собственной тонкой оси), а не
 * относительно нормали хоста. Это ключ к корректному пласть-торец (PolyBoard/imos).
 *
 * @param {Object} neighborPanel - корневой узел соседа
 * @param {THREE.Box3} neighborBBox - его world AABB
 * @param {THREE.Vector3} hostOutwardWorld - нормаль наружу с хоста (на соседа)
 * @returns {'plast'|'torets'}
 */
export function neighborFaceTypeAt(neighborPanel, neighborBBox, hostOutwardWorld) {
  const tW = panelThinAxisWorld(neighborPanel, neighborBBox);
  const dot = Math.abs(hostOutwardWorld.dot(tW));
  // Грань соседа, обращённая к хосту, имеет нормаль ≈ -hostOutwardWorld.
  // Эта нормаль коллинеарна тонкой оси соседа ⇔ грань = пласть.
  return dot >= 0.78 ? 'plast' : 'torets';
}

/**
 * Тип грани хоста: panelFaceType из panel-edge-frame (по orientation+jointIdx).
 * Не зависит от соседа.
 */
export function hostFaceType(panelRoot, jointIdx) {
  return panelFaceType(_panelOrientation(panelRoot), jointIdx);
}

function _faceTypeByNormalForPanel(panelRoot, panelBBox, nWorld) {
  if (!nWorld || nWorld.lengthSq() < 1e-20) return 'torets';
  const tW = panelThinAxisWorld(panelRoot, panelBBox);
  const n = nWorld.clone().normalize();
  return Math.abs(n.dot(tW)) >= 0.78 ? 'plast' : 'torets';
}

/* ─────────────────────────── pair classification ─────────────────────── */

const PAIR = {
  TORETS_PLAST: 'torets-plast',
  PLAST_TORETS: 'plast-torets',
  TORETS_TORETS: 'torets-torets',
  PLAST_PLAST: 'plast-plast',
  UNKNOWN: 'unknown',
};

function classifyPair(host, neighbor) {
  if (!host || !neighbor) return PAIR.UNKNOWN;
  if (host === 'torets' && neighbor === 'plast') return PAIR.TORETS_PLAST;
  if (host === 'plast' && neighbor === 'torets') return PAIR.PLAST_TORETS;
  if (host === 'torets' && neighbor === 'torets') return PAIR.TORETS_TORETS;
  if (host === 'plast' && neighbor === 'plast') return PAIR.PLAST_PLAST;
  return PAIR.UNKNOWN;
}

/** Базис: крепёжный стык = торец в пласть (или пласть принимает торец). */
export function isToretsPlastPair(pair) {
  return pair === PAIR.TORETS_PLAST || pair === PAIR.PLAST_TORETS;
}

/**
 * Бонус скоринга по типу пары (Bazis: торец-пласть приоритетен).
 */
function pairBonus(pair) {
  switch (pair) {
    case PAIR.TORETS_PLAST: return 25;
    case PAIR.PLAST_TORETS: return 25; // та же геометрия с другой стороны хоста
    case PAIR.PLAST_PLAST:  return -40;
    case PAIR.TORETS_TORETS: return -40;
    default:                 return -50;
  }
}

/* ────────────────────────── candidate enumeration ────────────────────── */

/**
 * Это «панель» (wall/facade), а не секция-контейнер?
 * Секции (`Цоколь`, `Корпус шкафа`, `Шкаф 2 дв`) тоже имеют own_object и calculated.size,
 * но их не нужно сравнивать как панели — их роль чисто структурная (как у Bazis-секций).
 */
function _isPanelNode(ch) {
  if (!ch || !ch.userData) return false;
  // Комната: ClodisBuilder wall group (без CabinetWallNode)
  if (ch.userData.isDetail && ch.userData.__cldPivotCodes) {
    const dt = String(ch.userData.detailType || ch.userData.type || 'wall').toLowerCase();
    if (dt === 'wall' || dt === 'facade' || ch.userData.isBody || ch.userData.isFacade) return true;
  }
  if (!ch.userData.own_object) return false;
  if (!ch.calculated || !ch.calculated.size) return false;
  const t = String(ch?.config?.type || ch?.userData?.type || '').toLowerCase();
  if (t === 'wall' || t === 'facade') return true;
  // Доп. проверка по имени класса (CabinetWallNode/CabinetFacadeNode).
  const cn = String(ch?.constructor?.name || '');
  if (/Wall|Facade/i.test(cn)) return true;
  return false;
}

function _enumeratePanelRoots(rootGroup) {
  const out = [];
  if (!rootGroup) return out;
  rootGroup.traverse((ch) => {
    if (_isPanelNode(ch)) out.push(ch);
  });
  return out;
}

/* ─────────────────────────────── core API ────────────────────────────── */

/**
 * @typedef {Object} JointContact
 * @property {Object} hostPanel
 * @property {number} hostJointIdx
 * @property {'plast'|'torets'} hostFaceType
 * @property {THREE.Vector3} hostOutwardWorld
 * @property {THREE.Vector3} hostFaceCenterWorld
 * @property {THREE.Vector3} hostSeamDirWorld
 * @property {THREE.Vector3} hostEdgeDirWorld
 * @property {number} hostSeamLenWorld
 * @property {number} hostEdgeLenWorld
 *
 * @property {Object|null} neighborPanel
 * @property {THREE.Box3|null} neighborBBox
 * @property {'plast'|'torets'|null} neighborFaceType
 * @property {number|null} neighborThickMm
 *
 * @property {string} pair
 * @property {number} gapMm
 * @property {number} seamOverlapMm
 * @property {number} seamOverlapMinWorld  скаляр вдоль hostSeamDir (мир)
 * @property {number} seamOverlapMaxWorld
 * @property {number} edgeOverlapMm
 * @property {number} score
 * @property {boolean} active
 */

/**
 * Опции движка:
 *  - mmPerWorldUnit: мм на единицу сцены (UNITS_MM = 10 в превью, 1 в комнате/CFRN).
 *  - gapMaxMm / overlapMinMm: пороги для "active=true". Дефолты из joint-panel-contact.
 *  - acceptUnknownPair: устар.; для отладки см. acceptAnyPair.
 *  - acceptAnyPair: разрешить не-торец↔пласть (default false — как Базис для схем).
 */
function _opts(opts) {
  const mm = Number(opts?.mmPerWorldUnit);
  return {
    mmPerWorldUnit: mm > 0 ? mm : 10,
    gapMaxMm: Number(opts?.gapMaxMm) > 0 ? Number(opts.gapMaxMm) : JOINT_CONTACT_GAP_MAX_MM,
    overlapMinMm: Number(opts?.overlapMinMm) > 0 ? Number(opts.overlapMinMm) : JOINT_CONTACT_OVERLAP_MIN_MM,
    acceptUnknownPair: !!opts?.acceptUnknownPair,
    acceptAnyPair: !!opts?.acceptAnyPair || !!opts?.acceptUnknownPair,
  };
}

function _verbose() {
  if (typeof window === 'undefined') return false;
  // По умолчанию выключен. Чтобы включить отладку поиска соседей:
  // window.__CLD_JOINT_DEBUG_VERBOSE = true;
  return window.__CLD_JOINT_DEBUG_VERBOSE === true;
}

function _panelLabel(p) {
  if (!p) return '?';
  return p.name || p.userData?.own_object?.name || p.config?.name || '?';
}

/**
 * Дамп всех панелей сцены (имя, ориентация, bbox в мм, тонкая ось) — для
 * диагностики «почему детектор не находит соседа».
 */
export function debugDumpPanels(rootGroup, mmPerWorldUnit = 10) {
  const panels = _enumeratePanelRoots(rootGroup);
  const rows = panels.map((p) => {
    const bb = panelBBoxWorld(p);
    const o = _panelOrientation(p);
    const t = panelThinAxisWorld(p, bb);
    if (!bb) return { name: _panelLabel(p), orient: o, bbox: null, thin: null };
    return {
      name: _panelLabel(p),
      orient: o,
      thin: `(${t.x.toFixed(2)},${t.y.toFixed(2)},${t.z.toFixed(2)})`,
      bbox: {
        x: [Math.round(bb.min.x * mmPerWorldUnit), Math.round(bb.max.x * mmPerWorldUnit)],
        y: [Math.round(bb.min.y * mmPerWorldUnit), Math.round(bb.max.y * mmPerWorldUnit)],
        z: [Math.round(bb.min.z * mmPerWorldUnit), Math.round(bb.max.z * mmPerWorldUnit)],
      },
      thickMm: Math.round(panelThicknessMm(p, bb, mmPerWorldUnit) * 10) / 10,
    };
  });
  return rows;
}

/**
 * Главная функция: найти лучший контакт для (hostPanel, jointIdx).
 * Возвращает JointContact (даже если сосед не найден — поля neighbor* = null,
 * active = false). Это важно: потребитель сам решает, рисовать ли пустой стык.
 *
 * БМ: стык = пара граней. Торцы 0..3 — через getJointStripeFrameWorld;
 * пласти — через тонкую ось. Сосед для jointIdx может быть и на пласти
 * (пласть←торец), см. findNeighborForJoint.
 */

/** Ортонормированный базис плоскости: n = outward, t1/t2 в плоскости. */
function _planeTangents(nWorld) {
  const n = nWorld.clone().normalize();
  const ref = Math.abs(n.z) < 0.9
    ? new THREE.Vector3(0, 0, 1)
    : new THREE.Vector3(0, 1, 0);
  const t1 = ref.clone().sub(n.clone().multiplyScalar(ref.dot(n)));
  if (t1.lengthSq() < 1e-12) return null;
  t1.normalize();
  const t2 = new THREE.Vector3().crossVectors(n, t1);
  if (t2.lengthSq() < 1e-12) return null;
  t2.normalize();
  return { n, t1, t2 };
}

/**
 * Все 6 граней панели: 4 торца (jointIdx 0..3) + 2 пласти (± тонкая ось).
 * @returns {Array<{
 *   kind: 'torets'|'plast',
 *   jointIdx: number|null,
 *   faceKey: string,
 *   outwardWorld: THREE.Vector3,
 *   faceCenterWorld: THREE.Vector3,
 *   seamDirWorld: THREE.Vector3,
 *   edgeDirWorld: THREE.Vector3,
 *   seamLenWorld: number,
 *   edgeLenWorld: number,
 *   faceCoord: number,
 * }>}
 */
export function listPanelFaces(panelRoot) {
  const out = [];
  const hBBox = panelBBoxWorld(panelRoot);
  if (!hBBox) return out;

  for (let j = 0; j < 4; j++) {
    const fr = getJointStripeFrameWorld(panelRoot, j);
    if (!fr) continue;
    const basis = _stripeOrthoBasis(fr);
    if (!basis) continue;
    const ow = fr.outwardWorld.clone().normalize();
    out.push({
      kind: 'torets',
      jointIdx: j,
      faceKey: `t${j}`,
      outwardWorld: ow,
      faceCenterWorld: fr.faceCenterWorld.clone(),
      seamDirWorld: basis.s.clone(),
      edgeDirWorld: basis.e.clone(),
      seamLenWorld: Number(fr.seamLenWorld) || 0,
      edgeLenWorld: Number(fr.edgeLenWorld) || 0,
      faceCoord: fr.faceCenterWorld.dot(ow),
    });
  }

  const tW = panelThinAxisWorld(panelRoot, hBBox);
  if (!tW || tW.lengthSq() < 1e-12) return out;
  const plastNs = [tW.clone().normalize(), tW.clone().normalize().negate()];
  for (let i = 0; i < plastNs.length; i++) {
    const n = plastNs[i];
    const tang = _planeTangents(n);
    if (!tang) continue;
    const [lo, hi] = boxDotInterval(hBBox, n);
    const faceCoord = hi; // наружная пласть вдоль n
    const center = hBBox.getCenter(new THREE.Vector3());
    const faceCenter = center.clone().addScaledVector(n, faceCoord - center.dot(n));
    const i1 = boxDotInterval(hBBox, tang.t1);
    const i2 = boxDotInterval(hBBox, tang.t2);
    const len1 = Math.max(0, i1[1] - i1[0]);
    const len2 = Math.max(0, i2[1] - i2[0]);
    // Базис: линия стыка = направляющая вдоль ДЛИНЫ стыка (длинная ось в плоскости пласти).
    const seamIsT1 = len1 >= len2;
    out.push({
      kind: 'plast',
      jointIdx: null,
      faceKey: i === 0 ? 'p+' : 'p-',
      outwardWorld: n.clone(),
      faceCenterWorld: faceCenter,
      seamDirWorld: (seamIsT1 ? tang.t1 : tang.t2).clone(),
      edgeDirWorld: (seamIsT1 ? tang.t2 : tang.t1).clone(),
      seamLenWorld: seamIsT1 ? len1 : len2,
      edgeLenWorld: seamIsT1 ? len2 : len1,
      faceCoord,
    });
  }
  return out;
}

function _emptyContact(hostPanel, jointIdx, hostType, hostOutward, faceCenter, basis, frameLens) {
  return {
    hostPanel,
    hostJointIdx: jointIdx == null ? -1 : Number(jointIdx),
    hostFaceType: hostType,
    hostOutwardWorld: hostOutward.clone(),
    hostFaceCenterWorld: faceCenter.clone(),
    hostSeamDirWorld: basis.s.clone(),
    hostEdgeDirWorld: basis.e.clone(),
    hostSeamLenWorld: Number(frameLens?.seam) || 0,
    hostEdgeLenWorld: Number(frameLens?.edge) || 0,
    neighborPanel: null,
    neighborBBox: null,
    neighborFaceType: null,
    neighborThickMm: null,
    hostThickMm: null,
    toretsThickMm: null,
    plastThickMm: null,
    seamWidthMm: 0,
    pair: PAIR.UNKNOWN,
    gapMm: Infinity,
    seamOverlapMm: 0,
    seamOverlapMinWorld: 0,
    seamOverlapMaxWorld: 0,
    edgeOverlapMm: 0,
    edgeOverlapMinWorld: 0,
    edgeOverlapMaxWorld: 0,
    score: -Infinity,
    active: false,
    faceKey: null,
  };
}

function _isActiveContact(best, o) {
  if (!best) return false;
  const edgeMinMm = Math.min(o.overlapMinMm, 5);
  const flushByGap = best.gapMm >= JOINT_CONTACT_GAP_MIN_MM && best.gapMm <= 3;
  const overlapStrict = best.seamOvMm >= o.overlapMinMm && best.edgeOvMm >= edgeMinMm;
  const overlapFlush = flushByGap && best.seamOvMm >= 5 && best.edgeOvMm >= 2;
  const overlapOk = overlapStrict || overlapFlush;
  const gapOk = flushByGap || (best.gapMm >= JOINT_CONTACT_GAP_MIN_MM && best.gapMm <= o.gapMaxMm);
  // Базис / схемы крепежа: только торец ↔ пласть.
  const pairOk = o.acceptAnyPair
    ? best.pair !== PAIR.UNKNOWN
    : isToretsPlastPair(best.pair);
  return overlapOk && gapOk && pairOk;
}

/**
 * Лучший контакт на одной грани хоста (торец или пласть) среди всех панелей сцены.
 */
export function detectContactOnFace(hostPanel, face, rootGroup, opts = {}) {
  const o = _opts(opts);
  const hBBox = panelBBoxWorld(hostPanel);
  if (!hBBox || !face?.outwardWorld) return null;

  const hostOutward = face.outwardWorld.clone().normalize();
  const hostType = face.kind === 'plast'
    ? 'plast'
    : _faceTypeByNormalForPanel(hostPanel, hBBox, hostOutward);
  const basis = {
    s: face.seamDirWorld.clone().normalize(),
    e: face.edgeDirWorld.clone().normalize(),
  };
  const base = _emptyContact(
    hostPanel,
    face.jointIdx,
    hostType,
    hostOutward,
    face.faceCenterWorld,
    basis,
    { seam: face.seamLenWorld, edge: face.edgeLenWorld },
  );
  base.faceKey = face.faceKey || null;

  if (!rootGroup) return base;

  const cSelf = hBBox.getCenter(new THREE.Vector3());
  const candidates = _enumeratePanelRoots(rootGroup);
  const tol = jointContactTolerancesScene(o.mmPerWorldUnit);
  const verbose = _verbose();
  if (verbose) {
    console.log(
      `[v2.face] host="${_panelLabel(hostPanel)}" face=${face.faceKey} ${hostType} ` +
      `out=(${hostOutward.x.toFixed(2)},${hostOutward.y.toFixed(2)},${hostOutward.z.toFixed(2)}) ` +
      `candidates=${candidates.length}`,
    );
  }

  let best = null;
  let bestScore = -Infinity;

  for (const cand of candidates) {
    if (cand === hostPanel) continue;
    const cBBox = panelBBoxWorld(cand);
    if (!cBBox) continue;

    const cOtherCenter = cBBox.getCenter(new THREE.Vector3());
    const n = alignJointNormalToNeighbor(hostOutward, cSelf, cOtherCenter);
    if (n.dot(hostOutward) < 0.5) {
      if (verbose) {
        console.log(`  ✗ "${_panelLabel(cand)}" — другая сторона (n·out=${n.dot(hostOutward).toFixed(2)})`);
      }
      continue;
    }

    const m = measureJointNeighborPair(hBBox, cBBox, {
      hasFrame: true,
      nPlane: hostOutward,
      sDir: basis.s,
      eDir: basis.e,
      cSelf,
      faceAxis: 'x',
      faceSign: 1,
      seamAx: 'x',
      edgeAx: 'y',
      faceCoord: 0,
      tol,
    });
    if (!m.gapInRange) {
      if (verbose) {
        console.log(
          `  ✗ "${_panelLabel(cand)}" — gap ${(m.dist * o.mmPerWorldUnit).toFixed(1)}mm ` +
          `вне ${JOINT_CONTACT_GAP_MIN_MM}…${o.gapMaxMm}`,
        );
      }
      continue;
    }
    if (m.seamOv <= 0 && m.edgeOv <= 0) continue;

    const nFaceType = neighborFaceTypeAt(cand, cBBox, hostOutward);
    const pair = classifyPair(hostType, nFaceType);
    // Базис: для схем крепежа ищем только торец↔пласть (не угол торец-торец и не пласть-пласть).
    if (!isToretsPlastPair(pair) && !o.acceptAnyPair) {
      if (verbose) {
        console.log(`  ✗ "${_panelLabel(cand)}" — пара ${pair}, нужен торец↔пласть`);
      }
      continue;
    }
    const gapMm = m.dist * o.mmPerWorldUnit;
    const seamOvMm = m.seamOv * o.mmPerWorldUnit;
    const edgeOvMm = m.edgeOv * o.mmPerWorldUnit;
    const seamMinW = Number.isFinite(m.seamMin) ? m.seamMin : 0;
    const seamMaxW = Number.isFinite(m.seamMax) ? m.seamMax : 0;
    const edgeMinW = Number.isFinite(m.edgeMin) ? m.edgeMin : 0;
    const edgeMaxW = Number.isFinite(m.edgeMax) ? m.edgeMax : 0;
    const overlapAreaMm2 = Math.max(0, seamOvMm) * Math.max(0, edgeOvMm);

    let score = 100;
    score -= Math.abs(gapMm) * 1.5;
    score += Math.min(overlapAreaMm2 * 0.0005, 40);
    score += pairBonus(pair);

    if (verbose) {
      console.log(
        `  • "${_panelLabel(cand)}" pair=${pair} gap=${gapMm.toFixed(1)} ` +
        `ov=${seamOvMm.toFixed(0)}/${edgeOvMm.toFixed(0)} score=${score.toFixed(1)}`,
      );
    }
    if (score > bestScore) {
      bestScore = score;
      best = {
        cand,
        cBBox,
        nFaceType,
        pair,
        gapMm,
        seamOvMm,
        seamMinW,
        seamMaxW,
        edgeOvMm,
        edgeMinW,
        edgeMaxW,
        score,
      };
    }
  }

  if (!best) return base;

  const neighborThickMm = panelThicknessMm(best.cand, best.cBBox, o.mmPerWorldUnit);
  const hostThickMm = panelThicknessMm(hostPanel, hBBox, o.mmPerWorldUnit);
  const toretsThickMm = hostType === 'torets' ? hostThickMm : neighborThickMm;
  const plastThickMm = hostType === 'plast' ? hostThickMm : neighborThickMm;
  // Ширина стыка в Базисе ≈ толщина торцевой детали (перекрытие по «ребру» пятна).
  const seamWidthMm = Math.max(0, Math.min(best.edgeOvMm, toretsThickMm || best.edgeOvMm));
  return {
    ...base,
    neighborPanel: best.cand,
    neighborBBox: best.cBBox,
    neighborFaceType: best.nFaceType,
    neighborThickMm,
    hostThickMm,
    toretsThickMm,
    plastThickMm,
    seamWidthMm,
    pair: best.pair,
    gapMm: best.gapMm,
    seamOverlapMm: best.seamOvMm,
    seamOverlapMinWorld: best.seamMinW,
    seamOverlapMaxWorld: best.seamMaxW,
    edgeOverlapMm: best.edgeOvMm,
    edgeOverlapMinWorld: best.edgeMinW,
    edgeOverlapMaxWorld: best.edgeMaxW,
    score: best.score,
    active: _isActiveContact(best, o),
  };
}

/**
 * Все валидные контакты торец↔пласть на одной грани.
 * Пласть фасада: ДВА бока — нормаль грани фиксирована (lockNormal), все соседи.
 */
export function detectAllContactsOnFace(hostPanel, face, rootGroup, opts = {}) {
  const o = _opts(opts);
  const hBBox = panelBBoxWorld(hostPanel);
  if (!hBBox || !face?.outwardWorld) return [];

  const hostOutward = face.outwardWorld.clone().normalize();
  const hostType = face.kind === 'plast'
    ? 'plast'
    : _faceTypeByNormalForPanel(hostPanel, hBBox, hostOutward);
  const basis = {
    s: face.seamDirWorld.clone().normalize(),
    e: face.edgeDirWorld.clone().normalize(),
  };
  const hostThickMm = panelThicknessMm(hostPanel, hBBox, o.mmPerWorldUnit);

  if (!rootGroup) return [];

  const cSelf = hBBox.getCenter(new THREE.Vector3());
  const candidates = _enumeratePanelRoots(rootGroup);
  const tol = jointContactTolerancesScene(o.mmPerWorldUnit);
  const out = [];

  for (const cand of candidates) {
    if (cand === hostPanel) continue;
    const cBBox = panelBBoxWorld(cand);
    if (!cBBox) continue;

    const m = measureJointNeighborPair(hBBox, cBBox, {
      hasFrame: true,
      lockNormal: true,
      nPlane: hostOutward,
      sDir: basis.s,
      eDir: basis.e,
      cSelf,
      faceAxis: 'x',
      faceSign: 1,
      seamAx: 'x',
      edgeAx: 'y',
      faceCoord: 0,
      tol,
    });
    if (!m.gapInRange) continue;
    if (m.seamOv <= 0 && m.edgeOv <= 0) continue;

    const nFaceType = neighborFaceTypeAt(cand, cBBox, hostOutward);
    const pair = classifyPair(hostType, nFaceType);
    if (!isToretsPlastPair(pair) && !o.acceptAnyPair) continue;

    const gapMm = m.dist * o.mmPerWorldUnit;
    const seamOvMm = m.seamOv * o.mmPerWorldUnit;
    const edgeOvMm = m.edgeOv * o.mmPerWorldUnit;
    const best = {
      cand,
      cBBox,
      nFaceType,
      pair,
      gapMm,
      seamOvMm,
      seamMinW: Number.isFinite(m.seamMin) ? m.seamMin : 0,
      seamMaxW: Number.isFinite(m.seamMax) ? m.seamMax : 0,
      edgeOvMm,
      edgeMinW: Number.isFinite(m.edgeMin) ? m.edgeMin : 0,
      edgeMaxW: Number.isFinite(m.edgeMax) ? m.edgeMax : 0,
      score: 0,
    };
    if (!_isActiveContact(best, o)) continue;

    const neighborThickMm = panelThicknessMm(best.cand, best.cBBox, o.mmPerWorldUnit);
    const toretsThickMm = hostType === 'torets' ? hostThickMm : neighborThickMm;
    const plastThickMm = hostType === 'plast' ? hostThickMm : neighborThickMm;
    const seamWidthMm = Math.max(0, Math.min(best.edgeOvMm, toretsThickMm || best.edgeOvMm));

    const base = _emptyContact(
      hostPanel,
      face.jointIdx,
      hostType,
      hostOutward,
      face.faceCenterWorld,
      basis,
      { seam: face.seamLenWorld, edge: face.edgeLenWorld },
    );
    base.faceKey = face.faceKey || null;
    out.push({
      ...base,
      neighborPanel: best.cand,
      neighborBBox: best.cBBox,
      neighborFaceType: best.nFaceType,
      neighborThickMm,
      hostThickMm,
      toretsThickMm,
      plastThickMm,
      seamWidthMm,
      pair: best.pair,
      gapMm: best.gapMm,
      seamOverlapMm: best.seamOvMm,
      seamOverlapMinWorld: best.seamMinW,
      seamOverlapMaxWorld: best.seamMaxW,
      edgeOverlapMm: best.edgeOvMm,
      edgeOverlapMinWorld: best.edgeMinW,
      edgeOverlapMaxWorld: best.edgeMaxW,
      score: best.score,
      active: true,
    });
  }
  return out;
}

/**
 * Все стыки по граням хоста.
 * Торец: один лучший сосед (как раньше).
 * Пласть: ВСЕ соседи торцом (фасад ← два бока).
 */
export function enumerateFaceContacts(hostPanel, rootGroup, opts = {}) {
  const faces = listPanelFaces(hostPanel);
  const out = [];
  for (const face of faces) {
    if (face.kind === 'plast') {
      const many = detectAllContactsOnFace(hostPanel, face, rootGroup, opts);
      for (const c of many) out.push(c);
      continue;
    }
    const c = detectContactOnFace(hostPanel, face, rootGroup, opts);
    if (c) out.push(c);
  }
  return out;
}

export function detectJointContact(hostPanel, jointIdx, rootGroup, opts = {}) {
  const j = Number(jointIdx);
  const faces = listPanelFaces(hostPanel);
  const face = faces.find((f) => f.kind === 'torets' && f.jointIdx === j);
  if (!face) {
    // Fallback: старый путь через stripe frame, если listPanelFaces не собрал торец.
    const o = _opts(opts);
    const hBBox = panelBBoxWorld(hostPanel);
    if (!hBBox) return null;
    const frame = getJointStripeFrameWorld(hostPanel, j);
    if (!frame) return null;
    const basis = _stripeOrthoBasis(frame);
    if (!basis) return null;
    const synthetic = {
      kind: 'torets',
      jointIdx: j,
      faceKey: `t${j}`,
      outwardWorld: frame.outwardWorld,
      faceCenterWorld: frame.faceCenterWorld,
      seamDirWorld: basis.s,
      edgeDirWorld: basis.e,
      seamLenWorld: frame.seamLenWorld,
      edgeLenWorld: frame.edgeLenWorld,
      faceCoord: frame.faceCenterWorld.dot(frame.outwardWorld),
    };
    return detectContactOnFace(hostPanel, synthetic, rootGroup, opts);
  }
  return detectContactOnFace(hostPanel, face, rootGroup, opts);
}

/**
 * Сосед для стыка jointIdx (как БМ, без спецрежимов панели):
 * 1) active-контакт на торце jointIdx;
 * 2) иначе active-контакт на пласти, пятно которого лежит в сторону этого торца.
 */
function _patchCenterWorld(c) {
  if (!c?.hostFaceCenterWorld || !c?.hostSeamDirWorld || !c?.hostEdgeDirWorld) return null;
  const s = c.hostSeamDirWorld;
  const e = c.hostEdgeDirWorld;
  const midS = (Number(c.seamOverlapMinWorld) + Number(c.seamOverlapMaxWorld)) * 0.5;
  let midE;
  if (
    Number.isFinite(c.edgeOverlapMinWorld) &&
    Number.isFinite(c.edgeOverlapMaxWorld) &&
    c.edgeOverlapMaxWorld > c.edgeOverlapMinWorld
  ) {
    midE = (c.edgeOverlapMinWorld + c.edgeOverlapMaxWorld) * 0.5;
  } else {
    midE = c.hostFaceCenterWorld.dot(e);
  }
  const c0 = c.hostFaceCenterWorld.clone();
  return c0
    .clone()
    .addScaledVector(s, midS - c0.dot(s))
    .addScaledVector(e, midE - c0.dot(e));
}

/**
 * Контакт для jointIdx: торец ИЛИ пласть←торец в сторону торца.
 * Крепёж/дыры должны брать этот контакт целиком (outward/seam/overlap),
 * а не «соседа с пласти + кадр пустого торца L/R».
 */
export function resolveJointContactForIdx(hostPanel, jointIdx, rootGroup, opts = {}) {
  const forward = detectJointContact(hostPanel, jointIdx, rootGroup, opts);
  if (forward && forward.active && forward.neighborPanel) {
    return { ...forward, viaPlast: false };
  }

  const fr = getJointStripeFrameWorld(hostPanel, jointIdx);
  if (!fr?.outwardWorld) return forward || null;
  const want = fr.outwardWorld.clone().normalize();
  const hBBox = panelBBoxWorld(hostPanel);
  if (!hBBox) return forward || null;
  const center = hBBox.getCenter(new THREE.Vector3());

  const all = enumerateFaceContacts(hostPanel, rootGroup, opts);
  let best = null;
  let bestDot = -Infinity;
  for (const c of all) {
    if (!c?.active || c.hostFaceType !== 'plast' || !c.neighborPanel) continue;
    if (!isToretsPlastPair(c.pair)) continue;
    const patch = _patchCenterWorld(c);
    if (!patch) continue;
    const d = patch.sub(center);
    if (d.lengthSq() < 1e-12) continue;
    d.normalize();
    const dot = d.dot(want);
    if (dot > bestDot) {
      bestDot = dot;
      best = c;
    }
  }
  if (best && bestDot >= 0.5) {
    return {
      ...best,
      hostJointIdx: Number(jointIdx),
      viaPlast: true,
    };
  }
  return forward || null;
}

export function findNeighborForJoint(hostPanel, jointIdx, rootGroup, opts = {}) {
  const c = resolveJointContactForIdx(hostPanel, jointIdx, rootGroup, opts);
  return c && c.active && c.neighborPanel ? c.neighborPanel : null;
}

/* ───────────────────── reverse: contacts on plast faces ──────────────── */

/**
 * Контакты на пластях хоста (пласть ← торец соседа).
 * Тот же движок enumerateFaceContacts — не отдельная «магия».
 *
 * @returns {Array<{
 *   plastNormal: THREE.Vector3,
 *   plastFaceCoord: number,
 *   tangent1: THREE.Vector3,
 *   tangent2: THREE.Vector3,
 *   midOnT1: number,
 *   midOnT2: number,
 *   sizeT1: number,
 *   sizeT2: number,
 *   neighborPanel: Object,
 *   gapMm: number,
 * }>}
 */
export function detectReverseContactsOnPlasts(hostPanel, rootGroup, opts = {}) {
  const out = [];
  const all = enumerateFaceContacts(hostPanel, rootGroup, opts);
  for (const c of all) {
    if (!c?.active || c.hostFaceType !== 'plast' || !c.neighborPanel) continue;
    if (!isToretsPlastPair(c.pair)) continue;
    const t1 = c.hostSeamDirWorld.clone().normalize();
    const t2 = c.hostEdgeDirWorld.clone().normalize();
    const n = c.hostOutwardWorld.clone().normalize();
    const mid1 = (Number(c.seamOverlapMinWorld) + Number(c.seamOverlapMaxWorld)) * 0.5;
    let mid2;
    let size2 = Math.max(0, Number(c.edgeOverlapMm) || 0) / (Number(_opts(opts).mmPerWorldUnit) || 10);
    if (
      Number.isFinite(c.edgeOverlapMinWorld) &&
      Number.isFinite(c.edgeOverlapMaxWorld) &&
      c.edgeOverlapMaxWorld > c.edgeOverlapMinWorld
    ) {
      mid2 = (c.edgeOverlapMinWorld + c.edgeOverlapMaxWorld) * 0.5;
      size2 = c.edgeOverlapMaxWorld - c.edgeOverlapMinWorld;
    } else {
      mid2 = c.hostFaceCenterWorld.dot(t2);
    }
    const size1 = Math.max(
      0,
      (Number(c.seamOverlapMaxWorld) - Number(c.seamOverlapMinWorld)) ||
        (Number(c.seamOverlapMm) || 0) / (Number(_opts(opts).mmPerWorldUnit) || 10),
    );
    out.push({
      plastNormal: n,
      plastFaceCoord: c.hostFaceCenterWorld.dot(n),
      tangent1: t1,
      tangent2: t2,
      midOnT1: mid1,
      midOnT2: mid2,
      sizeT1: size1,
      sizeT2: size2,
      neighborPanel: c.neighborPanel,
      gapMm: c.gapMm,
      seamWidthMm: Number(c.seamWidthMm) || Number(c.edgeOverlapMm) || 0,
      toretsThickMm: Number(c.toretsThickMm) || 0,
      plastThickMm: Number(c.plastThickMm) || 0,
      pair: c.pair,
      contact: c,
    });
  }
  return out;
}

/**
 * Все active-стыки торец↔пласть на панели (без сценариев ролей).
 */
export function listToretsPlastContacts(hostPanel, rootGroup, opts = {}) {
  return enumerateFaceContacts(hostPanel, rootGroup, opts).filter(
    (c) => c && c.active && c.neighborPanel && isToretsPlastPair(c.pair),
  );
}

/**
 * Базис: «минимальная ширина стыка» — стык тоньше порога подсвечивается,
 * но схема крепежа на него не ставится (HDF 3 мм ≠ конфирмат под 16 мм).
 */
export function contactAllowsSchemeBySeamWidth(contact, minSeamWidthMm) {
  const minW = Number(minSeamWidthMm) || 0;
  if (!(minW > 0) || !contact) return true;
  const w =
    Number(contact.toretsThickMm) ||
    Number(contact.seamWidthMm) ||
    Number(contact.edgeOverlapMm) ||
    0;
  return w + 0.5 >= minW;
}

/* ────────────────────────────── utilities ────────────────────────────── */

/**
 * Краткое описание контакта для отладки/лейблов.
 */
export function describeContact(c) {
  if (!c) return 'null';
  if (!c.neighborPanel) {
    return `j${c.hostJointIdx}: ${c.hostFaceType}->none`;
  }
  return [
    `j${c.hostJointIdx}:`,
    `${c.hostFaceType}->${c.neighborFaceType}`,
    `gap:${c.gapMm.toFixed(1)}mm`,
    `ov:${c.seamOverlapMm.toFixed(0)}/${c.edgeOverlapMm.toFixed(0)}mm`,
    c.active ? 'ACTIVE' : 'inactive',
  ].join(' ');
}

export const JOINT_PAIR = PAIR;
