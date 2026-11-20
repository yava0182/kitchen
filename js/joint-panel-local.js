/**
 * Setup 3: шаблон (мм) → world через блок furniture на панели (как PlanPlace / CabinetFurniture).
 * Схема расстановки задаёт только станцию вдоль шва (pos.z / seamSizeKey);
 * pos.x, pos.y, rot — по типу стыка (jointIdx + orientation стойки).
 */
import * as THREE from 'three';
import { panelThinAxisWorld, panelThicknessMm } from '/js/joint-engine-v2.js';

/** ref: CabinetHole._build_direction */
export function remapCabinetHoleDirection(dirKey, orientationFlag) {
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
      default: return g;
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
      default: return g;
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
      case 'bottom': f = -1; break;
      case 'top':
      case 'right': f = 1; break;
      case 'center': f = 0; break;
      default: break;
    }
  }
  const n = Number(f);
  if (!Number.isFinite(n)) return 0;
  return (-n * sizeDim) / 2;
}

/** ref: CabinetHole._build_pos (furniture child, global=1) */
export function cabinetHoleBuildPosRefUnits(parentSizeMm, posMm, realSizeMm, dirRemapped, globalFlag, mmPerWorldUnit) {
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
  const u = Number(mmPerWorldUnit) > 0 ? Number(mmPerWorldUnit) : 10;

  let j;
  let k;
  let l;

  switch (dirRemapped) {
    case 'x':
      j = g === 1 ? (-psx / 2 + pz + rz / 2) / u : -psx / 2 / u;
      k = (-psy / 2 + py) / u;
      l = (-psz / 2 + px) / u;
      break;
    case '-x':
      j = g === 1 ? (psx / 2 + pz + -rz / 2) / u : psx / 2 / u;
      k = (-psy / 2 + py) / u;
      l = (-psz / 2 + px) / u;
      break;
    case 'y':
      k = g === 1 ? (-psy / 2 + pz + rz / 2) / u : -psy / 2 / u;
      j = (-psx / 2 + px) / u;
      l = (-psz / 2 + py) / u;
      break;
    case '-y':
      k = g === 1 ? (psy / 2 + pz + -rz / 2) / u : psy / 2 / u;
      j = (-psx / 2 + px) / u;
      l = (-psz / 2 + py) / u;
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

  return { j, k, l };
}

/** ref: CabinetHole._build_pivot */
export function cabinetHoleBuildPivotTranslationUnits(realSizeMm, dirRemapped, mmPerWorldUnit) {
  const rx = Number(realSizeMm?.x) || 0;
  const ry = Number(realSizeMm?.y) || 0;
  const rz = Number(realSizeMm?.z) || 0;
  const u = Number(mmPerWorldUnit) > 0 ? Number(mmPerWorldUnit) : 10;

  const table = {
    x: [-1, 0, 0, rz, ry, rx],
    '-x': [1, 0, 0, rz, ry, rx],
    y: [0, -1, 0, rx, rz, ry],
    '-y': [0, 1, 0, rx, rz, ry],
    z: [0, 0, -1, rx, ry, rz],
    '-z': [0, 0, 1, rx, ry, rz],
  };
  const row = table[dirRemapped] || [0, 0, 0, rx, ry, rz];
  return new THREE.Vector3(
    _convPivotRef(row[0], row[3]) / u,
    _convPivotRef(row[1], row[4]) / u,
    _convPivotRef(row[2], row[5]) / u,
  );
}

function _drillIntoLocalVec(dirRemapped) {
  switch (dirRemapped) {
    case 'x': return new THREE.Vector3(1, 0, 0);
    case '-x': return new THREE.Vector3(-1, 0, 0);
    case 'y': return new THREE.Vector3(0, 1, 0);
    case '-y': return new THREE.Vector3(0, -1, 0);
    case 'z': return new THREE.Vector3(0, 0, 1);
    case '-z': return new THREE.Vector3(0, 0, -1);
    default: return new THREE.Vector3(0, 0, 1);
  }
}

function _panelOrientation(panelRoot) {
  const o = String(
    panelRoot?.userData?.__cldPanelOrientation ||
    panelRoot?.config?.spec?.orientation ||
    panelRoot?.config?.orientation ||
    ''
  ).trim().toLowerCase();
  if (o === 'v' || o === 'vertical') return 'v';
  if (o === 'h' || o === 'horizontal') return 'h';
  if (o === 'f' || o === 'frontal' || o === 'front' || o === 'face') return 'f';
  return o || 'f';
}

export function panelParentSizeMm(panel, bbox, mmPerWorldUnit) {
  const cfrn = panel?.userData?.__cldCfrnSizeMm;
  if (cfrn && Number(cfrn.x) > 0 && Number(cfrn.y) > 0 && Number(cfrn.z) > 0) {
    return { x: Number(cfrn.x), y: Number(cfrn.y), z: Number(cfrn.z) };
  }
  const cs = panel?.calculated?.size;
  if (cs && Number(cs.x) > 0 && Number(cs.y) > 0 && Number(cs.z) > 0) {
    return { x: Number(cs.x), y: Number(cs.y), z: Number(cs.z) };
  }
  if (!bbox || bbox.isEmpty()) return { x: 16, y: 100, z: 100 };

  const u = Number(mmPerWorldUnit) > 0 ? Number(mmPerWorldUnit) : 10;
  const sz = bbox.getSize(new THREE.Vector3());
  const wx = sz.x * u;
  const wy = sz.y * u;
  const wz = sz.z * u;
  const thick = panelThicknessMm(panel, bbox, u);
  const o = _panelOrientation(panel);

  if (o === 'v') {
    const rest = [wx, wy, wz].filter((d) => Math.abs(d - thick) > 0.5).sort((a, b) => b - a);
    return { x: thick, y: rest[0] || wy, z: rest[1] || rest[0] || wz };
  }
  if (o === 'h') {
    const rest = [wx, wy, wz].filter((d) => Math.abs(d - thick) > 0.5).sort((a, b) => b - a);
    return { x: rest[0] || wx, y: thick, z: rest[1] || rest[0] || wz };
  }
  const rest = [wx, wy, wz].filter((d) => Math.abs(d - thick) > 0.5).sort((a, b) => b - a);
  return { x: rest[0] || wx, y: rest[1] || rest[0] || wy, z: thick };
}

/**
 * jointIdx схемы на полке (h) / фасаде (f) → jointIdx якоря на стойке (v).
 * Низ полки/фасада (1) стыкуется с верхом стойки (0). L/R без зеркала.
 */
export function mapJointIdxForStandAnchor(hostOrientation, hostJointIdx, hostIsStand) {
  const j = Number(hostJointIdx);
  if (hostIsStand) return j;
  const ho = String(hostOrientation || '').toLowerCase();
  if (ho === 'h' || ho === 'f') {
    if (j === 1) return 0;
    if (j === 0) return 1;
  }
  return j;
}

function _applySeamToPosMm(pos, seamSizeKey, seamPosMm) {
  const seam = Number(seamPosMm) || 0;
  const key = String(seamSizeKey || 'z').toLowerCase();
  if (key === 'x') pos.x = seam;
  else if (key === 'y') pos.y = seam;
  else pos.z = seam;
  return pos;
}

/**
 * Якорь furniture на стойке (мм в parent_size панели) — по PlanPlace JSON.
 * seamPosMm приходит из jointSchemes / calcJointSchemePositions.
 */
export function buildSetup3FurnitureAnchor({
  standOrientation,
  anchorJointIdx,
  seamPosMm,
  seamSizeKey,
  parentSizeMm,
  standThickMm,
}) {
  const orient = String(standOrientation || 'v').toLowerCase();
  const thick = Number(standThickMm) > 0 ? Number(standThickMm) : 16;
  const half = thick / 2;
  const sx = Number(parentSizeMm?.x) || 0;
  const sy = Number(parentSizeMm?.y) || 0;
  const j = Number(anchorJointIdx);

  const posMm = { x: half, y: 0, z: 0 };
  const rotDeg = { x: 0, y: 0, z: 0 };

  if (orient === 'v') {
    posMm.x = half;
    if (j === 0) {
      posMm.y = sy + thick;
      rotDeg.z = 90;
    } else if (j === 1) {
      posMm.y = -thick;
      rotDeg.z = -90;
    } else if (j === 2) {
      posMm.x = -thick;
      posMm.y = sy / 2;
      rotDeg.z = 0;
    } else if (j === 3) {
      posMm.x = sx + thick;
      posMm.y = sy / 2;
      rotDeg.z = 180;
    }
  } else if (orient === 'h') {
    posMm.x = half;
    if (j === 0) {
      posMm.y = sy + thick;
      rotDeg.z = 90;
    } else if (j === 1) {
      posMm.y = -thick;
      rotDeg.z = -90;
    }
  } else if (orient === 'f') {
    posMm.z = half;
    if (j === 2) {
      posMm.x = -thick;
      rotDeg.z = 0;
    } else if (j === 3) {
      posMm.x = sx + thick;
      rotDeg.x = 180;
      rotDeg.z = -180;
    }
  }

  _applySeamToPosMm(posMm, seamSizeKey, seamPosMm);
  return { posMm, rotDeg };
}

/** ref CabinetSection._build_rot: отрицательные градусы */
function _rotateTemplateOffsetMm(offsetMm, rotDeg) {
  const m = new THREE.Matrix4();
  const e = new THREE.Euler(
    -THREE.MathUtils.degToRad(Number(rotDeg?.x) || 0),
    -THREE.MathUtils.degToRad(Number(rotDeg?.y) || 0),
    -THREE.MathUtils.degToRad(Number(rotDeg?.z) || 0),
    'XYZ',
  );
  m.makeRotationFromEuler(e);
  return new THREE.Vector3(
    Number(offsetMm?.x) || 0,
    Number(offsetMm?.y) || 0,
    Number(offsetMm?.z) || 0,
  ).applyMatrix4(m);
}

function _panelOwnObject(panel) {
  return panel?.userData?.own_object || panel;
}

function _panelLocalToWorld(panel, localUnits) {
  const own = _panelOwnObject(panel);
  if (!own) return localUnits.clone();
  own.updateWorldMatrix(true, true);
  return localUnits.clone().applyMatrix4(own.matrixWorld);
}

function _standConfirmatDirWorld(standPanel, standBBox, shelfPanel, shelfBBox) {
  const own = _panelOwnObject(standPanel);
  if (!own) return new THREE.Vector3(1, 0, 0);
  own.updateWorldMatrix(true, true);
  const q = new THREE.Quaternion();
  own.matrixWorld.decompose(new THREE.Vector3(), q, new THREE.Vector3());
  // v-стойка: толщина по локальной +X (как BoxGeometry в buildWall).
  let dir = new THREE.Vector3(1, 0, 0).applyQuaternion(q).normalize();
  if (shelfPanel && shelfBBox && !shelfBBox.isEmpty() && standBBox && !standBBox.isEmpty()) {
    const toShelf = shelfBBox.getCenter(new THREE.Vector3()).sub(standBBox.getCenter(new THREE.Vector3()));
    if (toShelf.lengthSq() > 1e-18 && dir.dot(toShelf) < 0) dir.negate();
  }
  return dir;
}

function _confirmatDirWorld(standPanel, standBBox, shelfPanel, shelfBBox, dirRemapped, mmPerWorldUnit) {
  const orient = String(
    standPanel?.userData?.__cldPanelOrientation ||
    standPanel?.config?.spec?.orientation ||
    standPanel?.config?.orientation ||
    'v'
  ).toLowerCase();
  if (orient === 'v' && (dirRemapped === 'x' || dirRemapped === '-x')) {
    const towardShelf = _standConfirmatDirWorld(standPanel, standBBox, shelfPanel, shelfBBox);
    // Реф: знак direction после _build_direction; −x = против +x (от полки / наружу).
    return dirRemapped === '-x' ? towardShelf.clone().negate() : towardShelf;
  }
  const thin = panelThinAxisWorld(standPanel, standBBox).clone();
  if (shelfPanel && shelfBBox && !shelfBBox.isEmpty() && standBBox && !standBBox.isEmpty()) {
    const toShelf = shelfBBox.getCenter(new THREE.Vector3()).sub(standBBox.getCenter(new THREE.Vector3()));
    if (toShelf.lengthSq() > 1e-18 && thin.dot(toShelf) < 0) thin.negate();
  } else {
    const own = _panelOwnObject(standPanel);
    own.updateWorldMatrix(true, true);
    const q = new THREE.Quaternion();
    own.matrixWorld.decompose(new THREE.Vector3(), q, new THREE.Vector3());
    thin.copy(_drillIntoLocalVec(dirRemapped).applyQuaternion(q));
  }
  return thin.normalize();
}

/**
 * Setup 3: отверстие через виртуальный furniture на стойке.
 * Станция вдоль шва — только в furniture.pos (из схемы); hole — координаты шаблона.
 */
export function setup3HolePlacementViaFurnitureWorld({
  standPanel,
  standBBox,
  shelfPanel = null,
  shelfBBox = null,
  furnitureAnchor,
  hole,
  isFace,
  mmPerWorldUnit,
}) {
  if (!standPanel || !hole || !furnitureAnchor) return null;

  const u = Number(mmPerWorldUnit) > 0 ? Number(mmPerWorldUnit) : 10;
  const dirKey = String(hole.dirKey ?? hole.direction ?? 'x').toLowerCase();
  const orient = _panelOrientation(standPanel);
  const dirRemapped = remapCabinetHoleDirection(dirKey, orient === 'v' || orient === 'h' ? orient : 'v');

  const tplX = Number(hole.xMm ?? hole.x) || 0;
  const tplY = Number(hole.yMm ?? hole.y) || 0;
  const tplZ = Number(hole.zMm ?? hole.z) || 0;
  const off = _rotateTemplateOffsetMm({ x: tplX, y: tplY, z: tplZ }, furnitureAnchor.rotDeg);
  const posMm = {
    x: furnitureAnchor.posMm.x + off.x,
    y: furnitureAnchor.posMm.y + off.y,
    z: furnitureAnchor.posMm.z + off.z,
  };

  const diameter = Number(hole.diameterMm ?? hole.diameter) || 8;
  const depth = Number(hole.depthMm ?? hole.depth) || 16;
  const realSizeMm = { x: diameter, y: diameter, z: depth };
  const parentSize = panelParentSizeMm(standPanel, standBBox, u);

  const gRaw = hole.global;
  const globalFlag = gRaw === 0 || gRaw === '0' ? 0 : 1;

  const { j, k, l } = cabinetHoleBuildPosRefUnits(
    parentSize, posMm, realSizeMm, dirRemapped, globalFlag, u,
  );
  const pivot = cabinetHoleBuildPivotTranslationUnits(realSizeMm, dirRemapped, u);
  const localEntry = new THREE.Vector3(j, k, l).add(pivot);
  const worldEntry = _panelLocalToWorld(standPanel, localEntry);
  const worldDir = _confirmatDirWorld(
    standPanel, standBBox, shelfPanel, shelfBBox, dirRemapped, u,
  );

  return {
    worldEntry,
    worldDir,
    isFace,
    dirRemapped,
    parentSize,
    posMm,
    furnitureAnchor,
    setup3FurnitureRef: true,
  };
}

/** @deprecated Используйте setup3HolePlacementViaFurnitureWorld */
export function setup3HolePlacementWorld(opts) {
  return setup3HolePlacementViaFurnitureWorld({
    standPanel: opts.targetPanel,
    standBBox: opts.targetBBox,
    furnitureAnchor: {
      posMm: {
        x: (Number(opts.standThickMm) || 16) / 2,
        y: 0,
        z: Number(opts.seamPosMm) || 0,
      },
      rotDeg: { x: 0, y: 0, z: 90 },
    },
    hole: opts.hole,
    isFace: opts.isFace,
    mmPerWorldUnit: opts.mmPerWorldUnit,
  });
}

/** @deprecated seamPos только в furniture.pos */
export function setup3TemplateToPanelPosMm({ xMm, yMm, zMm, seamPosMm }) {
  const seam = Number(seamPosMm) || 0;
  return {
    x: seam + (Number(zMm) || 0),
    y: -(Number(yMm) || 0),
    z: Number(xMm) || 0,
  };
}
