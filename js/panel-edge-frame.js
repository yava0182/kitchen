/**
 * Стыки/крепёж: опора на кромки 1…4 и orientation (как _build_edges в CabinetWallNode),
 * плюс matrixWorld own_object — без «толстая ось = min(mировой bbox)».
 *
 * Соответствие jointIdx (превью/Базис) ↔ номеру кромки v/h/f согласовано с
 * _jointFaceInfo + _jointOutwardNormal для осях мира, когда панель ортогональна осям.
 */
import * as THREE from 'three';

let __carcassBbox3 = null;
export function setJointCarcassContext(bbox) {
  __carcassBbox3 = bbox && !bbox.isEmpty() ? bbox : null;
}

function _normO(o) {
  if (!o) return 'f';
  const s = String(o).trim().toLowerCase();
  if (s === 'f' || s === 'frontal' || s === 'front' || s === 'face') return 'f';
  if (s === 'v' || s === 'vertical') return 'v';
  if (s === 'h' || s === 'horizontal') return 'h';
  return s;
}

export function thinAxisForOrientation(orientation) {
  const o = _normO(orientation);
  if (o === 'v') return 'x';
  if (o === 'h') return 'y';
  return 'z'; // f
}

/**
 * Какой физический торец (1–4) по _build_edges для данного jointIdx.
 */
export function jointIdxToPanelEdgeNumber(orientation, jointIdx) {
  const o = _normO(orientation);
  const j = Number(jointIdx);
  if (!Number.isFinite(j) || j < 0 || j > 3) return 1;
  if (o === 'v') {
    if (j === 0) return 2; // +Y / верх
    if (j === 1) return 1; // -Y / низ
    if (j === 2) return 3; // -Z / зад
    return 4; // +Z / перед
  }
  if (o === 'h') {
    // Горизонталь: торец → сосед. Joints 0/1 = перед/зад (±Z), joints 2/3 = лево/право (±X).
    if (j === 0) return 2; // +Z / перед
    if (j === 1) return 1; // -Z / зад
    if (j === 2) return 3; // -X / лево
    return 4;              // +X / право
  }
  if (o === 'f') {
    if (j === 0) return 2; // +Y / верх
    if (j === 1) return 1; // -Y / низ
    if (j === 2) return 3; // -X / лево
    return 4; // +X / право
  }
  return j + 1;
}

/**
 * Тип рабочей грани для jointIdx: 'plast' или 'torets'.
 * Определяется через нормаль грани и тонкую ось панели для orientation.
 */
export function panelFaceType(orientation, jointIdx) {
  const o = _normO(orientation);
  const edgeNum = jointIdxToPanelEdgeNumber(o, jointIdx);
  // unit dimensions are sufficient for normal orientation.
  const fr = _localOutwardCenterSpan(o, edgeNum, 1, 1, 1, null);
  const n = fr?.outward;
  if (!n) return 'torets';
  const thin = thinAxisForOrientation(o);
  if (Math.abs(n[thin]) > 0.999) return 'plast';
  return 'torets';
}

/**
 * В локали панели: центр «полной» грани (как make_cube по u_size), наруж. нормаль к плоскости,
 * длина шва/ребра на торце (для полосы) — max/min стороны прямоугольника грани.
 * Оси: как в _build_size — w=size.x, h=size.y, d=size.z.
 */
function _localOutwardCenterSpan(orientation, edgeNum, w, h, d, panelRoot) {
  const e = Number(edgeNum);
  let nx = 0, ny = 0, nz = 0, cx = 0, cy = 0, cz = 0;
  let spanA = 0, spanB = 0;
  const o = _normO(orientation);
  if (o === 'v') {
    if (e === 1) { nx = 0; ny = -1; nz = 0; cx = 0; cy = -h / 2; cz = 0; spanA = w; spanB = d; }
    else if (e === 2) { nx = 0; ny = 1; nz = 0; cx = 0; cy = h / 2; cz = 0; spanA = w; spanB = d; }
    else if (e === 3) { nx = 0; ny = 0; nz = -1; cx = 0; cy = 0; cz = -d / 2; spanA = w; spanB = h; }
    else { nx = 0; ny = 0; nz = 1; cx = 0; cy = 0; cz = d / 2; spanA = w; spanB = h; }
  } else if (o === 'h') {
    if (e === 1) { nx = 0; ny = 0; nz = -1; cx = 0; cy = 0; cz = -d / 2; spanA = w; spanB = h; }
    else if (e === 2) { nx = 0; ny = 0; nz = 1; cx = 0; cy = 0; cz = d / 2; spanA = w; spanB = h; }
    else if (e === 3) { nx = -1; ny = 0; nz = 0; cx = -w / 2; cy = 0; cz = 0; spanA = h; spanB = d; }
    else { nx = 1; ny = 0; nz = 0; cx = w / 2; cy = 0; cz = 0; spanA = h; spanB = d; }
  } else {
    if (e === 1) { nx = 0; ny = -1; nz = 0; cx = 0; cy = -h / 2; cz = 0; spanA = w; spanB = d; }
    else if (e === 2) { nx = 0; ny = 1; nz = 0; cx = 0; cy = h / 2; cz = 0; spanA = w; spanB = d; }
    else if (e === 3) { nx = -1; ny = 0; nz = 0; cx = -w / 2; cy = 0; cz = 0; spanA = h; spanB = d; }
    else { nx = 1; ny = 0; nz = 0; cx = w / 2; cy = 0; cz = 0; spanA = h; spanB = d; }
  }
  const outward = new THREE.Vector3(nx, ny, nz);
  const faceCenter = new THREE.Vector3(cx, cy, cz);
  // Slide/BLB (комната): own_object = BLB, геометрия сдвинута _cldBlbContentOffset —
  // центры торцов в локали own должны быть на меше, иначе крепёж «влево на size/2».
  const off = panelRoot?.userData?._cldBlbContentOffset;
  if (off && typeof off === 'object') {
    faceCenter.x += Number(off.x) || 0;
    faceCenter.y += Number(off.y) || 0;
    faceCenter.z += Number(off.z) || 0;
  }
  const seamLong = Math.max(spanA, spanB);
  const seamShort = Math.min(spanA, spanB);
  // Длинный шов вдоль long dir, тонкая кромка — вдоль seam × n (лев. тройка в локали панели)
  const spanLongIsA = spanA >= spanB;
  let u = new THREE.Vector3();
  if (o === 'v') {
    if (e === 1 || e === 2) {
      u = spanLongIsA ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
    } else {
      u = spanLongIsA ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    }
  } else if (o === 'h') {
    if (e === 1 || e === 2) {
      u = spanLongIsA ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    } else {
      u = spanLongIsA ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
    }
  } else {
    if (e === 1 || e === 2) {
      u = spanLongIsA ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
    } else {
      u = spanLongIsA ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
    }
  }
  const seamLocal = u.normalize();
  const edgeLocal = new THREE.Vector3().crossVectors(seamLocal, outward);
  if (edgeLocal.lengthSq() < 1e-18) {
    edgeLocal.set(0, 0, 1);
  } else {
    edgeLocal.normalize();
  }
  return {
    outward,
    faceCenter,
    seamLocal,
    edgeLocal,
    seamLen: seamLong,
    edgeLen: seamShort,
  };
}

function _getOwnObject(panelRoot) {
  if (!panelRoot || !panelRoot.userData) return null;
  if (panelRoot.userData.own_object) return panelRoot.userData.own_object;
  // Комната (ClodisBuilder): группа стенки без CabinetWallNode
  if (panelRoot.userData.isDetail && panelRoot.userData.__cldPivotCodes) return panelRoot;
  return null;
}

function _panelOrientationFromRoot(panelRoot) {
  return _normO(
    panelRoot?.config?.spec?.orientation ||
      panelRoot?.config?.orientation ||
      panelRoot?.userData?.__cldPanelOrientation
  );
}

/**
 * u_size: размеры «полной» панели в юнитах сцены (как u_size в wall node).
 */
function _getPanelUwhd(panelRoot) {
  const u = panelRoot?.calculated?.u_size;
  if (u && u.x > 0 && u.y > 0 && u.z > 0) {
    return { w: u.x, h: u.y, d: u.z };
  }
  let core = null;
  if (panelRoot?.children?.length) {
    for (let i = 0; i < panelRoot.children.length; i++) {
      const ch = panelRoot.children[i];
      if (ch?.isMesh && String(ch.name || '').endsWith('_core')) {
        core = ch;
        break;
      }
    }
  }
  const p = core?.geometry?.parameters;
  if (p && p.width > 0 && p.height > 0 && p.depth > 0) {
    return { w: p.width, h: p.height, d: p.depth };
  }
  return null;
}

/**
 * Наружная нормаль к торцу (jointIdx) в мире, центр грани в мире.
 * Возвращает null, если панель не подходит.
 */
export function getJointSeamOutwardAndFaceWorld(panelRoot, jointIdx) {
  const own = _getOwnObject(panelRoot);
  if (!own) return null;
  const uwhd = _getPanelUwhd(panelRoot);
  if (!uwhd) return null;
  const orientation = _panelOrientationFromRoot(panelRoot);
  const edgeNum = jointIdxToPanelEdgeNumber(orientation, jointIdx);
  const { outward, faceCenter, seamLocal, edgeLocal, seamLen, edgeLen } = _localOutwardCenterSpan(
    orientation,
    edgeNum,
    uwhd.w,
    uwhd.h,
    uwhd.d,
    panelRoot
  );
  own.updateWorldMatrix(true, true);
  // Не decompose→quaternion: при scale.x<0 отражение теряется и нормаль стыка
  // смотрит внутрь (Г-крыло). Направления — через 3×3 matrixWorld + normalize.
  const m3 = new THREE.Matrix3().setFromMatrix4(own.matrixWorld);
  const ow = outward.clone().applyMatrix3(m3);
  if (ow.lengthSq() < 1e-18) return null;
  ow.normalize();
  const fc = faceCenter.clone().applyMatrix4(own.matrixWorld);
  return { outwardWorld: ow, faceCenterWorld: fc, edgeNum, seamLen, edgeLen, orientation };
}

/**
 * Базис для полосы стыка: нормаль, вдоль шва (длинный торец), вдоль «кромки» (узкая сторона).
 * Длины seamLen/edgeLen в юнитах сцены (как u_size) — вращения инварианты; масштаб uniform на own_object.
 */
export function getJointStripeFrameWorld(panelRoot, jointIdx) {
  const own = _getOwnObject(panelRoot);
  if (!own) return null;
  const uwhd = _getPanelUwhd(panelRoot);
  if (!uwhd) return null;
  const orientation = _panelOrientationFromRoot(panelRoot);
  const edgeNum = jointIdxToPanelEdgeNumber(orientation, jointIdx);
  const { outward, faceCenter, seamLocal, edgeLocal, seamLen, edgeLen } = _localOutwardCenterSpan(
    orientation,
    edgeNum,
    uwhd.w,
    uwhd.h,
    uwhd.d,
    panelRoot
  );
  own.updateWorldMatrix(true, true);
  const m3 = new THREE.Matrix3().setFromMatrix4(own.matrixWorld);
  const worldSpan = (vLoc, len) => vLoc.clone().multiplyScalar(len).applyMatrix3(m3).length();
  const seamLenWorld = worldSpan(seamLocal, seamLen);
  const edgeLenWorld = worldSpan(edgeLocal, edgeLen);
  // Направления через matrix3 + normalize (не quaternion): сохраняет отражение scale.x<0.
  const sw = seamLocal.clone().applyMatrix3(m3);
  const ow = outward.clone().applyMatrix3(m3);
  if (sw.lengthSq() < 1e-18 || ow.lengthSq() < 1e-18) return null;
  sw.normalize();
  ow.normalize();
  // В локали edge = seam×out; в мире: sw×ow. Для makeBasis(s,e,o) нужно s×e = o → e = o×s (а не s×o).
  // При det<0 базис левый — ew из ow×sw всё ещё ортогонален паре (sw, ow).
  const ew = new THREE.Vector3().crossVectors(ow, sw);
  if (ew.lengthSq() < 1e-16) return null;
  ew.normalize();
  const fc = faceCenter.clone().applyMatrix4(own.matrixWorld);
  return {
    outwardWorld: ow,
    faceCenterWorld: fc,
    seamDirWorld: sw,
    edgeDirWorld: ew,
    seamLenWorld,
    edgeLenWorld,
    edgeNum,
    orientation,
  };
}

/**
 * Для AABB-логики: доминирующая ось + знак, если нормаль почти кратна мировым осям.
 */
export function worldOutwardToFaceAxisSign(outW) {
  if (!outW || outW.lengthSq() < 1e-18) return null;
  const o = outW.clone().normalize();
  const ax = Math.abs(o.x) >= Math.abs(o.y) && Math.abs(o.x) >= Math.abs(o.z) ? 'x' : (Math.abs(o.y) >= Math.abs(o.z) ? 'y' : 'z');
  const s = o[ax] > 0 ? 1 : -1;
  return { faceAxis: ax, faceSign: s, dominant: true };
}
