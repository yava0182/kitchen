/**
 * Контакт соседних панелей по стыку: один источник допусков (мм) и явные измерения
 * на AABB + плоскости шва, без «подкруток» в месте вызова.
 *
 * Модель: признак соседства = зазор вдоль нормали (или по оси faceAxis в fallback) в
 * допустимом диапазоне, плюс достаточное 2D-перекрытие в плоскости шва (s/e).
 * Стык (Базис) = общая часть торцов/пластей; без перекрытия кандидата нет.
 */
import * as THREE from 'three';

/** Макс. зазор между «соприкасающимися» панелями по нормали, мм. */
export const JOINT_CONTACT_GAP_MAX_MM = 50;
/**
 * Мин. зазор: допускаем взаимопроникновение (flush / накладной фасад / пивот).
 * −8 мало для накладного фасада (бок внутри габарита по X ≈ толщину) — БМ всё равно видит стык.
 */
export const JOINT_CONTACT_GAP_MIN_MM = -20;
/** Мин. перекрытие вдоль осей шва/кромки на проекции AABB, мм. */
export const JOINT_CONTACT_OVERLAP_MIN_MM = 5;
/** Быстрый отсев кандидатов по толщине панели, мм. */
export const JOINT_THICKNESS_MIN_MM = 1;
export const JOINT_THICKNESS_MAX_MM = 50;

/**
 * @param {number} unitsMm  — мм на единицу сцены (см. UNITS_MM в constructor-clodis).
 * @returns {{ gapMax: number, gapMin: number, overlapMin: number }} в единицах сцены
 */
export function jointContactTolerancesScene(unitsMm) {
  const u = unitsMm;
  if (!(u > 0)) {
    return { gapMax: 0, gapMin: 0, overlapMin: 0 };
  }
  return {
    gapMax: JOINT_CONTACT_GAP_MAX_MM / u,
    gapMin: JOINT_CONTACT_GAP_MIN_MM / u,
    overlapMin: JOINT_CONTACT_OVERLAP_MIN_MM / u,
  };
}

/**
 * [min, max] значений u·p по p ∈ AABB, u — произвольный вектор.
 */
export function boxDotInterval(box, u) {
  if (!u || (u.x === 0 && u.y === 0 && u.z === 0)) return [0, 0];
  const nx = u.x;
  const ny = u.y;
  const nz = u.z;
  const pMin = new THREE.Vector3(
    nx >= 0 ? box.min.x : box.max.x,
    ny >= 0 ? box.min.y : box.max.y,
    nz >= 0 ? box.min.z : box.max.z
  );
  const pMax = new THREE.Vector3(
    nx >= 0 ? box.max.x : box.min.x,
    ny >= 0 ? box.max.y : box.min.y,
    nz >= 0 ? box.max.z : box.min.z
  );
  return [pMin.dot(u), pMax.dot(u)];
}

function overlap1D(a, b) {
  if (!a || !b) return 0;
  return Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0]));
}

/** Перекрытие 1D: длина + [min,max] вдоль оси (для линии стыка CAD). */
function overlap1DInterval(a, b) {
  if (!a || !b) return { len: 0, min: 0, max: 0 };
  const lo = Math.max(a[0], b[0]);
  const hi = Math.min(a[1], b[1]);
  if (!(hi > lo)) return { len: 0, min: lo, max: lo };
  return { len: hi - lo, min: lo, max: hi };
}

/**
 * Нормаль «от нас к соседу» по плоскости стыка: согласовать знак с вектором к центру соседа.
 */
export function alignJointNormalToNeighbor(nPlane, cSelf, cOther) {
  const toB = cOther.clone().sub(cSelf);
  const n = nPlane ? nPlane.clone() : new THREE.Vector3(1, 0, 0);
  if (toB.lengthSq() > 1e-12 && toB.dot(n) < 0) n.negate();
  return n;
}

/**
 * Зазор вдоль направленной нормали: min(n·B) - max(n·self) (сосед «снаружи» нашей грани).
 */
export function jointGapAlongNormal(bboxSelf, bboxOther, nUnit) {
  const [selfMin, selfMax] = boxDotInterval(bboxSelf, nUnit);
  const [bMin] = boxDotInterval(bboxOther, nUnit);
  return bMin - selfMax;
}

/**
 * Измеряет dist, перекрытия по s/e (если есть кадр) или по world-ося seam/edge.
 * @param {THREE.Box3} bboxSelf
 * @param {THREE.Box3} bboxOther
 * @param {object} p
 * @param {boolean} p.hasFrame
 * @param {THREE.Vector3} [p.nPlane]
 * @param {THREE.Vector3} [p.sDir]
 * @param {THREE.Vector3} [p.eDir]
 * @param {THREE.Vector3} p.cSelf
 * @param {string} p.faceAxis
 * @param {number} p.faceSign
 * @param {string} p.seamAx
 * @param {string} p.edgeAx
 * @param {number} p.faceCoord
 * @param {{ gapMax: number, gapMin: number }} p.tol
 * @returns {{
 *   dist: number,
 *   seamOv: number,
 *   edgeOv: number,
 *   gapInRange: boolean,
 *   seamMin?: number,
 *   seamMax?: number,
 * }}
 */
export function measureJointNeighborPair(bboxSelf, bboxOther, p) {
  const tol = p.tol;
  if (p.hasFrame && p.nPlane && p.sDir && p.eDir) {
    // lockNormal: пласть с несколькими соседями (фасад←2 бока) — нормаль грани фиксирована.
    // Иначе align к центру соседа поворачивает нормаль вбок и второй бок пропадает / линия в центре.
    let n;
    if (p.lockNormal) {
      n = p.nPlane.clone();
    } else {
      const cOther = bboxOther.getCenter(new THREE.Vector3());
      n = alignJointNormalToNeighbor(p.nPlane, p.cSelf, cOther);
    }
    if (n.lengthSq() < 1e-20) {
      return { dist: Infinity, seamOv: 0, edgeOv: 0, gapInRange: false, seamMin: 0, seamMax: 0 };
    }
    n.normalize();
    const dist = jointGapAlongNormal(bboxSelf, bboxOther, n);
    if (dist < tol.gapMin || dist > tol.gapMax) {
      return { dist, seamOv: 0, edgeOv: 0, gapInRange: false, seamMin: 0, seamMax: 0 };
    }
    const s = p.sDir.clone();
    s.normalize();
    const e = p.eDir.clone();
    e.normalize();
    const iu1 = boxDotInterval(bboxSelf, s);
    const iu2 = boxDotInterval(bboxOther, s);
    const iv1 = boxDotInterval(bboxSelf, e);
    const iv2 = boxDotInterval(bboxOther, e);
    const seamI = overlap1DInterval(iu1, iu2);
    const edgeI = overlap1DInterval(iv1, iv2);
    return {
      dist,
      seamOv: seamI.len,
      edgeOv: edgeI.len,
      gapInRange: true,
      seamMin: seamI.min,
      seamMax: seamI.max,
      edgeMin: edgeI.min,
      edgeMax: edgeI.max,
    };
  }
  const { faceAxis, faceSign, seamAx, edgeAx, faceCoord } = p;
  const nearEdge = faceSign > 0 ? bboxOther.min[faceAxis] : bboxOther.max[faceAxis];
  const dist = (nearEdge - faceCoord) * faceSign;
  if (dist < tol.gapMin || dist > tol.gapMax) {
    return { dist, seamOv: 0, edgeOv: 0, gapInRange: false, seamMin: 0, seamMax: 0 };
  }
  const seamLo = Math.max(bboxSelf.min[seamAx], bboxOther.min[seamAx]);
  const seamHi = Math.min(bboxSelf.max[seamAx], bboxOther.max[seamAx]);
  const seamOv = Math.max(0, seamHi - seamLo);
  const edgeLo = Math.max(bboxSelf.min[edgeAx], bboxOther.min[edgeAx]);
  const edgeHi = Math.min(bboxSelf.max[edgeAx], bboxOther.max[edgeAx]);
  const edgeOv = Math.max(0, edgeHi - edgeLo);
  return {
    dist,
    seamOv,
    edgeOv,
    gapInRange: true,
    seamMin: seamLo,
    seamMax: seamHi,
    edgeMin: edgeLo,
    edgeMax: edgeHi,
  };
}

/**
 * Принятие кандидата: оба 1D-перекрытия ≥ порога.
 * AABB-пересечение без перекрытия по осям шва — НЕ стык (иначе линия в пустоту).
 */
export function jointContactAcceptsCandidate(overlapMin, seamOv, edgeOv, bbox3dIntersects) {
  void bbox3dIntersects;
  return seamOv >= overlapMin && edgeOv >= overlapMin;
}
