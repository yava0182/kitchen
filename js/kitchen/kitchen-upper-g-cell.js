/**
 * MID верхняя угловая ячейка — одна цельная Г (пустое посадочное место).
 * Геометрия: два плеча 600×350, общая зона угла без дубля и без внутренней стенки.
 * Посадка модуля — kitchen-upper-g-place.js.
 */

import { state } from '../utils/state.js';
import { computeSectionInnerBoundsU } from '../sections/section-edge-trim-insets.js';
import {
  KITCHEN_UPPER_CORNER_CELL_WIDTH_MM,
  KITCHEN_UPPER_CORNER_CELL_DEPTH_MM,
  getJointUpperHostSection,
  getJointUpperOtherSection,
  listKitchenJoints,
  resolveKitchenUpperCornerDepthMm,
} from './kitchen-joint.js?v=20261116-lCorner1050';

export const UPPER_G_ARM_MM = KITCHEN_UPPER_CORNER_CELL_WIDTH_MM; // 600
export const UPPER_G_DEPTH_MM = KITCHEN_UPPER_CORNER_CELL_DEPTH_MM; // 350

const __UG_UD = 'isKitchenUpperGCell';
let __gRoots = [];

function _THREE() {
  return (typeof window !== 'undefined' && window.THREE) || null;
}

function _normWall(name) {
  const w = String(name || '')
    .trim()
    .toLowerCase();
  return w === 'front' || w === 'back' || w === 'left' || w === 'right'
    ? w
    : null;
}

/** Мировая позиция секции (секции живут в scene, не в room.group). */
function _secWorldPos(sec) {
  const g = sec?.group;
  if (!g) return { x: 0, y: 0, z: 0 };
  try {
    if (typeof g.getWorldPosition === 'function') {
      const THREE = _THREE();
      if (THREE) {
        const v = new THREE.Vector3();
        g.getWorldPosition(v);
        return { x: Number(v.x) || 0, y: Number(v.y) || 0, z: Number(v.z) || 0 };
      }
    }
  } catch (_) {}
  const p = g.position;
  return {
    x: Number(p?.x) || 0,
    y: Number(p?.y) || 0,
    z: Number(p?.z) || 0,
  };
}

/** Направление «в комнату» от стены (локальная +depth секции). */
function _intoRoomXZ(wallName) {
  const w = _normWall(wallName);
  if (w === 'back') return { x: 0, z: 1 };
  if (w === 'front') return { x: 0, z: -1 };
  if (w === 'left') return { x: 1, z: 0 };
  if (w === 'right') return { x: -1, z: 0 };
  return { x: 0, z: 1 };
}

/** Координата грани стены секции (перпендикуляр к стене). */
function _wallFaceCoord(sec, wallName) {
  const p = _secWorldPos(sec);
  const w = _normWall(wallName);
  if (w === 'back' || w === 'front') return { axis: 'z', value: p.z };
  return { axis: 'x', value: p.x };
}

/** Вдоль стены от угла к середине пролёта секции. */
function _dirAlongWallFromCorner(wallName, cornerX, cornerZ, midU) {
  const w = _normWall(wallName);
  if (w === 'back' || w === 'front') {
    return midU >= cornerX ? { x: 1, z: 0 } : { x: -1, z: 0 };
  }
  return midU >= cornerZ ? { x: 0, z: 1 } : { x: 0, z: -1 };
}

/** mid = НШ1, top = антресоль НШ2. */
function _normUpperGBand(band) {
  const b = String(band || '')
    .trim()
    .toLowerCase();
  return b === 'top' || b === 'antresol' || b === 'wall_top' ? 'top' : 'mid';
}

function _upperFloorYMm(band) {
  const b = _normUpperGBand(band);
  try {
    const api =
      typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
    if (b === 'top' && api && typeof api.resolveKitchenWallTopPlaceSizing === 'function') {
      const s = api.resolveKitchenWallTopPlaceSizing({});
      const y = Math.round(Number(s?.floorClearanceMm) || 0);
      if (y > 0) return y;
    }
    if (api && typeof api.resolveKitchenWallMidPlaceSizing === 'function') {
      const s = api.resolveKitchenWallMidPlaceSizing({});
      const y = Math.round(Number(s?.floorClearanceMm) || 0);
      if (y > 0) return y;
    }
  } catch (_) {}
  return b === 'top' ? 2140 : 1420;
}

function _upperHeightMm(band) {
  const b = _normUpperGBand(band);
  try {
    const api =
      typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
    if (b === 'top' && api && typeof api.resolveKitchenWallTopPlaceSizing === 'function') {
      const s = api.resolveKitchenWallTopPlaceSizing({});
      const h = Math.round(Number(s?.carcassHeightMm) || 0);
      if (h > 0) return h;
    }
    if (api && typeof api.resolveKitchenWallMidPlaceSizing === 'function') {
      const s = api.resolveKitchenWallMidPlaceSizing({});
      const h = Math.round(Number(s?.carcassHeightMm) || 0);
      if (h > 0) return h;
    }
  } catch (_) {}
  return b === 'top' ? 360 : 720;
}

/**
 * Мировая рамка Г: угол комнаты + оси плеч.
 * Угол = пересечение граней стен host×other (не mid секции, не room.group-local).
 * armA = host (upper-host), armB = other.
 */
export function resolveUpperGCellWorldFrame(joint, opts = {}) {
  if (!joint?.upperCornerCell) return null;
  const host = getJointUpperHostSection(joint);
  const other = getJointUpperOtherSection(joint);
  if (!host?.group || !other?.group) return null;
  const band = _normUpperGBand(opts.band || opts.upperGBand || 'mid');

  const cc = joint.upperCornerCell;
  const armMm = Math.round(Number(cc.armMm) || UPPER_G_ARM_MM);
  const depthMm = Math.round(
    Number(cc.depthMm) ||
      Number(cc.depthAMm) ||
      resolveKitchenUpperCornerDepthMm() ||
      UPPER_G_DEPTH_MM
  );
  const depthBMm = Math.round(
    Number(cc.depthBMm) || depthMm || UPPER_G_DEPTH_MM
  );

  let hostInner = null;
  let otherInner = null;
  try {
    hostInner = computeSectionInnerBoundsU(host);
  } catch (_) {
    hostInner = null;
  }
  try {
    otherInner = computeSectionInnerBoundsU(other);
  } catch (_) {
    otherInner = null;
  }
  if (!hostInner || !(Number(hostInner.innerWidthU) > 10)) return null;

  const hostWall = _normWall(host.wallName) || _normWall(cc.hostWall) || 'back';
  const otherWall =
    _normWall(other.wallName) || _normWall(cc.otherWall) || 'left';
  const atStart = cc.atStart === true;

  // Внутренний угол помещения = стык двух граней стен Joint.
  const hostFace = _wallFaceCoord(host, hostWall);
  const otherFace = _wallFaceCoord(other, otherWall);
  let cornerX;
  let cornerZ;
  if (hostFace.axis === 'x' && otherFace.axis === 'z') {
    cornerX = hostFace.value;
    cornerZ = otherFace.value;
  } else if (hostFace.axis === 'z' && otherFace.axis === 'x') {
    cornerZ = hostFace.value;
    cornerX = otherFace.value;
  } else {
    // Неортогональный стык — не должно быть у L; fallback по host.
    const hp = _secWorldPos(host);
    const hostStart = Number(hostInner.innerStartU) || 0;
    const hostEnd = hostStart + Number(hostInner.innerWidthU);
    const cornerU = atStart ? hostStart : hostEnd;
    if (hostWall === 'back' || hostWall === 'front') {
      cornerX = cornerU;
      cornerZ = hp.z;
    } else {
      cornerZ = cornerU;
      cornerX = hp.x;
    }
  }

  const hostStart = Number(hostInner.innerStartU) || 0;
  const hostEnd = hostStart + Number(hostInner.innerWidthU);
  const hostMid = (hostStart + hostEnd) / 2;
  const hostDir = _dirAlongWallFromCorner(hostWall, cornerX, cornerZ, hostMid);

  let otherDir = _intoRoomXZ(hostWall); // fallback: other вдоль = «в комнату» от host
  if (otherInner && Number(otherInner.innerWidthU) > 10) {
    const oStart = Number(otherInner.innerStartU) || 0;
    const oEnd = oStart + Number(otherInner.innerWidthU);
    const oMid = (oStart + oEnd) / 2;
    otherDir = _dirAlongWallFromCorner(otherWall, cornerX, cornerZ, oMid);
  }

  const intoH = _intoRoomXZ(hostWall);
  const intoO = _intoRoomXZ(otherWall);

  return {
    jointId: joint.jointId,
    cornerCellId: joint.upperCornerCellId,
    cornerX,
    cornerZ,
    floorY: _upperFloorYMm(band),
    heightMm: _upperHeightMm(band),
    band,
    armMm,
    depthAMm: depthMm,
    depthBMm,
    hostDir,
    otherDir,
    hostInto: intoH,
    otherInto: intoO,
    hostWall,
    otherWall,
    atStart,
    hostSectionId: host.id,
    otherSectionId: other.id,
  };
}

/**
 * Контур Г в плане (локально): u вдоль host, v вдоль other.
 * Без внутренней перегородки — один полигон из 6 точек.
 */
export function buildUpperGCellPlanPolygon(armMm, depthAMm, depthBMm) {
  const A = Math.round(Number(armMm) || UPPER_G_ARM_MM);
  const dA = Math.round(Number(depthAMm) || UPPER_G_DEPTH_MM);
  const dB = Math.round(Number(depthBMm) || UPPER_G_DEPTH_MM);
  // (0,0)=угол комнаты; +u = host arm; +v = other arm.
  return [
    { u: 0, v: 0 },
    { u: A, v: 0 },
    { u: A, v: dA },
    { u: dB, v: dA },
    { u: dB, v: A },
    { u: 0, v: A },
  ];
}

function _dispose(obj) {
  if (!obj) return;
  obj.traverse((c) => {
    if (c.geometry) c.geometry.dispose?.();
    if (c.material) {
      if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose?.());
      else c.material.dispose?.();
    }
  });
  if (obj.parent) obj.parent.remove(obj);
}

export function clearUpperGCellMeshes() {
  for (const g of __gRoots) {
    try {
      _dispose(g);
    } catch (_) {}
  }
  __gRoots = [];
  if (!state.scene) return;
  const doomed = [];
  state.scene.traverse((o) => {
    if (o?.userData?.[__UG_UD]) doomed.push(o);
  });
  doomed.forEach((o) => {
    try {
      _dispose(o);
    } catch (_) {}
  });
}

/**
 * Одна Г-ячейка: заливка + только внешний контур (без линии между плечами).
 * opts.band = mid|top (НШ1 / антресоль).
 */
export function buildUpperGCellMesh(THREE, joint, opts = {}) {
  const frame = resolveUpperGCellWorldFrame(joint, opts);
  if (!frame || !THREE) return null;

  const poly = buildUpperGCellPlanPolygon(
    frame.armMm,
    frame.depthAMm,
    frame.depthBMm
  );
  const shape = new THREE.Shape();
  shape.moveTo(poly[0].u, poly[0].v);
  for (let i = 1; i < poly.length; i++) {
    shape.lineTo(poly[i].u, poly[i].v);
  }
  shape.lineTo(poly[0].u, poly[0].v);

  const h = Math.max(50, frame.heightMm);
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: false,
  });
  // Extrude: XY = plan, Z = height. Повернём в мир позже.

  const fillMat = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
  });
  try {
    fillMat.userData = { ...(fillMat.userData || {}), ikeaPortSkipPhong: true };
  } catch (_) {}
  const fill = new THREE.Mesh(geom, fillMat);
  fill.renderOrder = 997;
  // Оверлей Г не ловит raycast — иначе НШ1 слева «прыгает» в угол.
  fill.raycast = () => {};
  try {
    fill.userData = { ...(fill.userData || {}), ikeaPortSkipPhong: true };
  } catch (_) {}

  // Внешний контур сверху (без внутренних рёбер Extrude).
  const topPts = poly.map(
    (p) => new THREE.Vector3(p.u, p.v, h)
  );
  topPts.push(topPts[0].clone());
  const botPts = poly.map((p) => new THREE.Vector3(p.u, p.v, 0));
  botPts.push(botPts[0].clone());
  const edgePositions = [];
  for (let i = 0; i < topPts.length - 1; i++) {
    edgePositions.push(topPts[i].x, topPts[i].y, topPts[i].z);
    edgePositions.push(topPts[i + 1].x, topPts[i + 1].y, topPts[i + 1].z);
    edgePositions.push(botPts[i].x, botPts[i].y, botPts[i].z);
    edgePositions.push(botPts[i + 1].x, botPts[i + 1].y, botPts[i + 1].z);
    edgePositions.push(botPts[i].x, botPts[i].y, botPts[i].z);
    edgePositions.push(topPts[i].x, topPts[i].y, topPts[i].z);
  }
  const edgeGeom = new THREE.BufferGeometry();
  edgeGeom.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(edgePositions, 3)
  );
  const wire = new THREE.LineSegments(
    edgeGeom,
    new THREE.LineBasicMaterial({
      color: 0xea580c,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
    })
  );
  wire.renderOrder = 999;

  const root = new THREE.Group();
  const bandTag = frame.band === 'top' ? 'top' : 'mid';
  root.name = `UpperGCell_${bandTag}_${frame.cornerCellId || frame.jointId}`;
  root.userData[__UG_UD] = true;
  root.userData.isKitchenUpperGCell = true;
  root.userData.ikeaPortSkipPhong = true;
  root.userData.upperGBand = bandTag;
  root.userData.cornerCellId = frame.cornerCellId;
  root.userData.jointId = frame.jointId;
  root.userData.layer = 'upper';
  root.userData.armMm = frame.armMm;
  root.userData.depthAMm = frame.depthAMm;
  root.userData.depthBMm = frame.depthBMm;
  root.add(fill);
  root.add(wire);
  wire.raycast = () => {};
  root.raycast = () => {};

  // Пивот ячейки = угол комнаты (локально 0,0,0 shape → мир corner).
  // Жёлтый шар всегда виден, когда рисуется Г — сверить с пивотом модуля.
  {
    const piv = new THREE.Mesh(
      new THREE.SphereGeometry(28, 12, 10),
      new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0.98,
        depthTest: false,
        depthWrite: false,
      })
    );
    piv.name = 'UpperGCellPivot';
    piv.position.set(0, 0, 0);
    piv.renderOrder = 1001;
    piv.userData[__UG_UD] = true;
    piv.userData.isUpperGCellPivot = true;
    piv.raycast = () => {};
    root.add(piv);
    const ax = new THREE.AxesHelper(120);
    ax.name = 'UpperGCellPivotAxes';
    ax.position.set(0, 0, 0);
    ax.renderOrder = 1002;
    ax.userData[__UG_UD] = true;
    root.add(ax);
  }

  // Локальные оси shape: +X=u (host), +Y=v (other), +Z=up.
  // Мир: corner + u*hostDir + v*otherDir, Y = floorY.
  const hx = frame.hostDir.x;
  const hz = frame.hostDir.z;
  const ox = frame.otherDir.x;
  const oz = frame.otherDir.z;

  // Базис: localX -> hostDir, localY -> otherDir, localZ -> up.
  // matrix columns = basis vectors.
  root.matrixAutoUpdate = false;
  const m = root.matrix;
  m.set(
    hx,
    ox,
    0,
    frame.cornerX,
    0,
    0,
    1,
    frame.floorY,
    hz,
    oz,
    0,
    frame.cornerZ,
    0,
    0,
    0,
    1
  );
  root.matrixWorldNeedsUpdate = true;

  // Как секции кухни: scene + мировые координаты.
  // Не room.group — иначе translation секции (уже world) даёт двойной сдвиг комнаты.
  const parent = state.scene || null;
  if (!parent) return null;
  parent.add(root);
  return root;
}

/** Перерисовать Г-ячейки Joint: mid (НШ1) и/или top (антресоль). */
export function syncUpperGCellMeshes() {
  const THREE = _THREE();
  clearUpperGCellMeshes();
  if (!THREE || !state.scene) return;
  // Режим «Ячейки» band-grids ИЛИ старый toggle зон.
  const bandOn = !!state.kitchenBandGridsView?.enabled;
  const legacyOn =
    state.kitchenCellsUiEnabled !== false &&
    !!(state.showSingleZones || state.showDoubleZones);
  if (!bandOn && !legacyOn) return;

  // Канон: Г mid+top только вместе с band-grids после компоновки шага 2.
  const hasCompose = (state.customSections || []).some(
    (s) => s && s._straightComposePreview
  );
  if (bandOn && !hasCompose) return;
  let bands = ['mid', 'top'];
  if (bandOn) {
    const b = String(state.kitchenBandGridsView?.band || '')
      .trim()
      .toLowerCase();
    // При компоновке рисуем оба яруса (как BASE/MID/TOP в syncKitchenBandGridsView).
    if (hasCompose) bands = ['mid', 'top'];
    else if (b === 'top' || b === 'antresol') bands = ['top'];
    else if (b === 'mid') bands = ['mid'];
    else if (b === 'base') bands = ['mid'];
  }

  for (const joint of listKitchenJoints()) {
    if (!joint?.upperCornerCell) continue;
    for (const band of bands) {
      try {
        const mesh = buildUpperGCellMesh(THREE, joint, { band });
        if (mesh) __gRoots.push(mesh);
      } catch (e) {
        console.warn('[UPPER-G] sync mesh', band, e);
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.__cldSyncUpperGCellMeshes = syncUpperGCellMeshes;
  window.__cldClearUpperGCellMeshes = clearUpperGCellMeshes;
  window.__cldResolveUpperGCellWorldFrame = resolveUpperGCellWorldFrame;
  window.__cldNormUpperGBand = _normUpperGBand;
}
