/**
 * Угловые ячейки Joint:
 * — низ (CornerCell) W=1050;
 * — верх (upperCornerCell) W=600, свой host — разворот не двигает низ.
 * Модуль в верх — после приёмки пустой ячейки.
 */
import { state } from '../utils/state.js';
import {
  getLShapeSpecialSnapBounds,
  rebuildAllSectionZones,
  ensureLShapeDivisionSegments,
  stretchKitchenLAttachedToRoomCorner,
  stretchKitchenUArmsToRoomCorner,
} from '../sections/section-manager.js?v=20261106-louter1';
import {
  flipJointHostSide,
  flipJointUpperHostSide,
  getJointHostSection,
  getJointOtherSection,
  getJointUpperHostSection,
  getJointUpperOtherSection,
  seatKitchenJointCorner,
  seatKitchenJointUpperCorner,
  listKitchenJoints,
  getKitchenJoint,
  findKitchenJointByModule,
  ensureJointsForLPair,
  KITCHEN_CORNER_CELL_WIDTH_MM,
  KITCHEN_UPPER_CORNER_CELL_WIDTH_MM,
  resolveKitchenUpperCornerDepthMm,
} from './kitchen-joint.js?v=20261107-ucorner12';
import { applyKitchenLFreeArm600SacrificeWidths } from './kitchen-section-layout.js?v=20261107-ucorner15';
import { sectionDepthWmm } from '../sections/corner-joint.js?v=20261028-ugrid1';
import { isUShapeBackSection } from '../sections/l-corner.js?v=20261022-bust13';

const __CC_UD = 'isKitchenCornerCellMesh';
const __UCC_UD = 'isKitchenUpperCornerCellMesh';
let __cornerCellRoots = [];

function _THREE() {
  return (typeof window !== 'undefined' && window.THREE) || null;
}

function _normWall(name) {
  const w = String(name || '').trim().toLowerCase();
  return w === 'front' || w === 'back' || w === 'left' || w === 'right' ? w : null;
}

function _dispose(obj) {
  if (!obj) return;
  obj.traverse((c) => {
    if (c.geometry) c.geometry.dispose();
    if (c.material) {
      if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
      else c.material.dispose();
    }
  });
  if (obj.parent) obj.parent.remove(obj);
}

export function clearCornerCellMeshes() {
  for (const g of __cornerCellRoots) {
    try {
      _dispose(g);
    } catch (_) {}
  }
  __cornerCellRoots = [];
  if (!state.scene) return;
  const doomed = [];
  state.scene.traverse((o) => {
    if (o?.userData?.[__CC_UD] || o?.userData?.[__UCC_UD]) doomed.push(o);
  });
  doomed.forEach((o) => {
    try {
      _dispose(o);
    } catch (_) {}
  });
}

function _cellDepthMm(host) {
  try {
    const api =
      typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
    if (api && typeof api.getProjectWorktopDepthMm === 'function') {
      const wt = Math.round(Number(api.getProjectWorktopDepthMm()) || 0);
      if (wt > 0) return wt;
    }
  } catch (_) {}
  return sectionDepthWmm(host) || 600;
}

function _cellHeightMm(host) {
  return Math.round(Number(host?.size?.y) || 820) || 820;
}

/**
 * Построить/обновить данные CornerCell на Joint и проекцию спец на host.
 */
export function ensureCornerCellOnJoint(joint) {
  if (!joint) return null;
  const host = getJointHostSection(joint);
  const other = getJointOtherSection(joint);
  if (!host || !other) return null;
  const Dmm = _cellDepthMm(host);
  const atStart =
    typeof joint.cornerCell?.atStart === 'boolean'
      ? joint.cornerCell.atStart
      : undefined;
  seatKitchenJointCorner(joint, {
    depthMm: Dmm,
    atStart,
    clearMm: 10,
    returnMm: Dmm,
  });
  try {
    ensureLShapeDivisionSegments(host.division);
    if (other.division) ensureLShapeDivisionSegments(other.division);
  } catch (_) {}
  return joint.cornerCell;
}

function _upperCellFloorYMm() {
  try {
    const api =
      typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
    if (api && typeof api.resolveKitchenWallMidPlaceSizing === 'function') {
      const s = api.resolveKitchenWallMidPlaceSizing({});
      const y = Math.round(Number(s?.floorClearanceMm) || 0);
      if (y > 0) return y;
    }
  } catch (_) {}
  return 1420;
}

function _upperCellHeightMm() {
  try {
    const api =
      typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
    if (api && typeof api.resolveKitchenWallMidPlaceSizing === 'function') {
      const s = api.resolveKitchenWallMidPlaceSizing({});
      const h = Math.round(Number(s?.carcassHeightMm) || 0);
      if (h > 0) return h;
    }
  } catch (_) {}
  return 720;
}

/** Верхняя угловая ячейка на Joint (W=600). Низ / division не трогает. */
export function ensureUpperCornerCellOnJoint(joint) {
  if (!joint) return null;
  const host = getJointUpperHostSection(joint) || getJointHostSection(joint);
  const other = getJointUpperOtherSection(joint) || getJointOtherSection(joint);
  if (!host || !other) return null;
  const atStart =
    typeof joint.upperCornerCell?.atStart === 'boolean'
      ? joint.upperCornerCell.atStart
      : undefined;
  const prevW = Math.round(Number(joint.upperCornerCell?.widthMm) || 0);
  seatKitchenJointUpperCorner(joint, {
    widthMm:
      prevW >= 300 && prevW <= 900 ? prevW : KITCHEN_UPPER_CORNER_CELL_WIDTH_MM,
    depthMm: KITCHEN_UPPER_CORNER_CELL_DEPTH_MM,
    atStart,
  });
  try {
    applyKitchenLFreeArm600SacrificeWidths(host);
    applyKitchenLFreeArm600SacrificeWidths(other);
  } catch (_) {}
  return joint.upperCornerCell;
}

/**
 * Меш одной угловой ячейки на host (W=1050 × Dwt), в углу.
 */
function _buildCornerCellMesh(THREE, joint) {
  const host = getJointHostSection(joint);
  const cc = joint.cornerCell;
  if (!host?.group || !cc || !host.division) return null;

  const wallName = _normWall(host.wallName) || 'back';
  const isAlongX = wallName === 'back' || wallName === 'front';
  const cellW = Math.round(Number(cc.widthMm) || KITCHEN_CORNER_CELL_WIDTH_MM);
  const cellD = Math.round(Number(cc.depthMm) || _cellDepthMm(host));
  const cellH = _cellHeightMm(host);
  const atStart = cc.atStart === true;
  const parts = Math.max(1, Math.floor(Number(host.division.parts) || 1));
  const zi = atStart ? 0 : parts - 1;

  let snap = null;
  try {
    snap = getLShapeSpecialSnapBounds(host.division, zi);
  } catch (_) {}
  const moduleWidth =
    snap?.moduleWidth >= 900 ? Math.round(snap.moduleWidth) : cellW;
  const zoneStart = Number.isFinite(Number(snap?.zoneStart))
    ? Number(snap.zoneStart)
    : Number(host.division.sectionStart) || 0;

  const startU =
    wallName === 'left' || wallName === 'front'
      ? zoneStart
      : zoneStart; // snap.zoneStart уже начало спец

  const geom = isAlongX
    ? new THREE.BoxGeometry(moduleWidth, cellH, cellD)
    : new THREE.BoxGeometry(cellD, cellH, moduleWidth);
  const fill = new THREE.Mesh(
    geom,
    new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    })
  );
  const wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(geom),
    new THREE.LineBasicMaterial({
      color: 0xb45309,
      transparent: true,
      opacity: 1,
      depthTest: false,
    })
  );
  fill.renderOrder = 128;
  wire.renderOrder = 129;
  const cx = isAlongX ? moduleWidth / 2 : cellD / 2;
  const cy = cellH / 2;
  const cz = isAlongX ? cellD / 2 : moduleWidth / 2;
  fill.position.set(cx, cy, cz);
  wire.position.copy(fill.position);

  const root = new THREE.Group();
  root.name = `CornerCell_${joint.cornerCellId}`;
  root.userData[__CC_UD] = true;
  root.userData.cornerCellId = joint.cornerCellId;
  root.userData.jointId = joint.jointId;
  root.userData.zoneIndex = zi;
  root.userData.sectionId = host.id;
  root.add(fill);
  root.add(wire);

  // 4 маркера только у пола (не 8 углов бокса — сверху «два пивота» = верх+низ).
  const hx = isAlongX ? moduleWidth / 2 : cellD / 2;
  const hz = isAlongX ? cellD / 2 : moduleWidth / 2;
  const yFloor = 28;
  const r = 22;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(r, 8, 6),
        new THREE.MeshBasicMaterial({
          color: 0xb45309,
          transparent: true,
          opacity: 0.95,
          depthTest: false,
          depthWrite: false,
        })
      );
      m.position.set(cx + sx * hx, yFloor, cz + sz * hz);
      m.renderOrder = 130;
      m.userData[__CC_UD] = true;
      root.add(m);
    }
  }

  const secPos = host.group.position;
  if (isAlongX) {
    const localZ = wallName === 'front' ? -cellD : 0;
    root.position.set(startU - secPos.x, 0, localZ);
  } else {
    const localX = wallName === 'right' ? -cellD : 0;
    root.position.set(localX, 0, startU - secPos.z);
  }
  host.group.add(root);
  return root;
}

/**
 * Меш верхней угловой ячейки (W=600 × D=350), на высоте навеса.
 * Цвет отличный от низа — чтобы видеть слой пирога.
 */
function _buildUpperCornerCellMesh(THREE, joint) {
  const host = getJointUpperHostSection(joint);
  const cc = joint.upperCornerCell;
  if (!host?.group || !cc || !host.division) return null;

  const wallName = _normWall(host.wallName) || 'back';
  const isAlongX = wallName === 'back' || wallName === 'front';
  const cellW = Math.round(
    Number(cc.widthMm) || KITCHEN_UPPER_CORNER_CELL_WIDTH_MM
  );
  const cellD = Math.round(
    Number(cc.depthMm) || resolveKitchenUpperCornerDepthMm()
  );
  const cellH = _upperCellHeightMm();
  const floorY = _upperCellFloorYMm();
  const atStart = cc.atStart === true;
  const parts = Math.max(1, Math.floor(Number(host.division.parts) || 1));
  const zi = atStart ? 0 : parts - 1;

  let snap = null;
  try {
    snap = getLShapeSpecialSnapBounds(host.division, zi);
  } catch (_) {}
  // Верх: W=600 своей ячейки, не moduleWidth низа (1050).
  const moduleWidth = cellW;
  const zoneStart = Number.isFinite(Number(snap?.zoneStart))
    ? Number(snap.zoneStart)
    : Number(host.division.sectionStart) || 0;
  // Привязка к углу: atStart → от zoneStart; иначе от конца спец низа − 600.
  const specialW =
    snap?.moduleWidth >= 900 ? Math.round(snap.moduleWidth) : 1050;
  const startU = atStart
    ? zoneStart
    : zoneStart + Math.max(0, specialW - cellW);

  // Диагностика: 1 логическая ячейка, 2 объёма — host (оранж) + return (фиолет).
  const root = new THREE.Group();
  root.name = `UpperCornerCell_${joint.upperCornerCellId || joint.jointId}`;
  root.userData[__UCC_UD] = true;
  root.userData.cornerCellId = joint.upperCornerCellId;
  root.userData.jointId = joint.jointId;
  root.userData.zoneIndex = zi;
  root.userData.sectionId = host.id;
  root.userData.layer = 'upper';
  root.userData.widthMm = cellW;

  const cy = cellH / 2;
  const addBox = (bw, bh, bd, ox, oy, oz, fillHex, wireHex) => {
    const geom = new THREE.BoxGeometry(bw, bh, bd);
    const fill = new THREE.Mesh(
      geom,
      new THREE.MeshBasicMaterial({
        color: fillHex,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
      })
    );
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(geom),
      new THREE.LineBasicMaterial({
        color: wireHex,
        transparent: true,
        opacity: 1,
        depthTest: false,
      })
    );
    fill.position.set(ox + bw / 2, oy + bh / 2, oz + bd / 2);
    wire.position.copy(fill.position);
    fill.renderOrder = 128;
    wire.renderOrder = 129;
    root.add(fill);
    root.add(wire);
  };

  // Пока только приставной (оранж). Г/фиолет не рисуем.
  if (isAlongX) {
    addBox(moduleWidth, cellH, cellD, 0, 0, 0, 0xf97316, 0xea580c);
  } else {
    addBox(cellD, cellH, moduleWidth, 0, 0, 0, 0xf97316, 0xea580c);
  }

  const cx = isAlongX ? moduleWidth / 2 : cellD / 2;
  const cz = isAlongX ? cellD / 2 : moduleWidth / 2;
  const hx = isAlongX ? moduleWidth / 2 : cellD / 2;
  const hz = isAlongX ? cellD / 2 : moduleWidth / 2;
  const yMark = 28;
  const r = 18;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(r, 8, 6),
        new THREE.MeshBasicMaterial({
          color: 0xea580c,
          transparent: true,
          opacity: 0.95,
          depthTest: false,
          depthWrite: false,
        })
      );
      m.position.set(cx + sx * hx, yMark, cz + sz * hz);
      m.renderOrder = 130;
      m.userData[__UCC_UD] = true;
      root.add(m);
    }
  }

  const secPos = host.group.position;
  if (isAlongX) {
    const localZ = wallName === 'front' ? -cellD : 0;
    root.position.set(startU - secPos.x, floorY, localZ);
  } else {
    const localX = wallName === 'right' ? -cellD : 0;
    root.position.set(localX, floorY, startU - secPos.z);
  }
  host.group.add(root);
  return root;
}

/** Перерисовать CornerCell при старом слое «Ячейки» (не compose-скелет). */
export function syncCornerCellMeshes() {
  const THREE = _THREE();
  clearCornerCellMeshes();
  if (state.kitchenCellsUiEnabled === false) return;
  if (!(state.showSingleZones || state.showDoubleZones)) return;
  if (!THREE || !state.scene) return;

  for (const joint of listKitchenJoints()) {
    if (!joint) continue;
    try {
      ensureCornerCellOnJoint(joint);
      const mesh = _buildCornerCellMesh(THREE, joint);
      if (mesh) __cornerCellRoots.push(mesh);
    } catch (e) {
      console.warn('[CORNER-CELL] sync mesh', e);
    }
    try {
      ensureUpperCornerCellOnJoint(joint);
      const um = _buildUpperCornerCellMesh(THREE, joint);
      if (um) __cornerCellRoots.push(um);
    } catch (e) {
      console.warn('[CORNER-CELL] sync upper mesh', e);
    }
  }
  console.warn('[CORNER-CELL] meshes', {
    joints: listKitchenJoints().length,
    roots: __cornerCellRoots.length,
  });
}

function _jointFromSectionId(sectionId, zoneIndexOpt) {
  const sid = String(sectionId || '');
  if (!sid) return null;
  const zi =
    zoneIndexOpt != null && Number.isFinite(Number(zoneIndexOpt))
      ? Math.floor(Number(zoneIndexOpt))
      : null;
  const matches = listKitchenJoints().filter((j) => {
    if (!j) return false;
    return (
      String(j.sectionAId) === sid ||
      String(j.sectionBId) === sid ||
      String(j.hostSectionId) === sid
    );
  });
  if (matches.length === 1) return matches[0];
  if (matches.length > 1 && zi != null) {
    // П на спине: zi=0 → left, zi=parts-1 → right.
    const byHand = matches.find((j) => {
      if (j.kind !== 'U') return false;
      if (zi === 0) return j.hand === 'left' || j.cornerCell?.atStart === true;
      return j.hand === 'right' || j.cornerCell?.atStart === false;
    });
    if (byHand) return byHand;
  }
  if (matches.length) return matches[0];
  // Нет Joint — L-пара или П-бандл.
  try {
    const sec = (state.customSections || []).find((s) => String(s?.id) === sid);
    if (!sec?.lShape) return null;
    const pairId = sec.lShape.pairId;
    const other =
      pairId != null
        ? (state.customSections || []).find((s) => String(s?.id) === String(pairId))
        : null;
    if (other) {
      const primary =
        sec.lShape.role && other.lShape?.role
          ? sec.lShape.role === (sec.lShape.primary || other.lShape?.primary)
            ? sec
            : other
          : sec;
      const attached = primary === sec ? other : sec;
      const created = ensureJointsForLPair(primary, attached);
      return created?.[0] || null;
    }
    // П: два Joint.
    if (
      sec.lShape.pairIdLeft != null ||
      sec.lShape.pairIdRight != null ||
      isUShapeBackSection(sec)
    ) {
      const list = state.customSections || [];
      let spine = sec;
      if (!isUShapeBackSection(sec) && sec.lShape?.uSpineId != null) {
        spine =
          list.find((s) => s && String(s.id) === String(sec.lShape.uSpineId)) || sec;
      }
      const left =
        spine.lShape?.pairIdLeft != null
          ? list.find((s) => s && String(s.id) === String(spine.lShape.pairIdLeft))
          : null;
      const right =
        spine.lShape?.pairIdRight != null
          ? list.find((s) => s && String(s.id) === String(spine.lShape.pairIdRight))
          : null;
      if (typeof window.__cldEnsureJointsForUBundle === 'function') {
        const created = window.__cldEnsureJointsForUBundle(spine, left, right) || [];
        if (zi === 0) return created.find((j) => j?.hand === 'left') || created[0] || null;
        if (created.length >= 2) {
          return created.find((j) => j?.hand === 'right') || created[1] || null;
        }
        // Плечо: sectionB = arm
        const onArm = created.find((j) => String(j?.sectionBId) === sid);
        return onArm || created[0] || null;
      }
    }
  } catch (_) {}
  return null;
}

/**
 * Разворот угловой ячейки без модуля.
 * Тот же угол комнаты → длинная сторона на другую стену.
 */
export function reorientKitchenCornerCell(sectionIdOrJoint, zoneIndexOpt) {
  let joint =
    sectionIdOrJoint && typeof sectionIdOrJoint === 'object' && sectionIdOrJoint.jointId
      ? sectionIdOrJoint
      : null;
  if (!joint) {
    joint =
      getKitchenJoint(sectionIdOrJoint) ||
      _jointFromSectionId(sectionIdOrJoint, zoneIndexOpt);
  }
  if (!joint) {
    return {
      ok: false,
      reason: 'no_joint',
      message: 'Joint угла не найден — пересоздай L/П.',
    };
  }

  const fromSec = getJointHostSection(joint);
  const fromWall = _normWall(fromSec?.wallName);

  flipJointHostSide(joint);
  const toSec = getJointHostSection(joint);
  const otherSec = getJointOtherSection(joint);
  if (!toSec || !otherSec) {
    flipJointHostSide(joint);
    return {
      ok: false,
      reason: 'missing_section',
      message: 'Секция Joint не найдена.',
    };
  }

  const toWall = _normWall(toSec.wallName);

  // Плечи до угла комнаты (L и П одинаково: trim=0).
  try {
    if (joint.kind === 'U') {
      const spine = (state.customSections || []).find(
        (s) => s && String(s.id) === String(joint.sectionAId)
      );
      if (spine && (isUShapeBackSection(spine) || spine.lShape?.type === 'u-wardrobe')) {
        stretchKitchenUArmsToRoomCorner(spine);
      }
    } else if (otherSec?.lShape) {
      const attached =
        String(toSec.id) === String(joint.sectionBId) ? toSec : otherSec;
      if (attached?.lShape) stretchKitchenLAttachedToRoomCorner(attached);
    }
  } catch (e) {
    console.warn('[CORNER-CELL] stretch', e);
  }

  // atStart только из стен нового host (как L) — не !prevAt.
  const Dmm = _cellDepthMm(toSec);
  const cc = seatKitchenJointCorner(joint, {
    depthMm: Dmm,
    clearMm: Math.round(Number(joint.cornerCell?.clearMm) || 10),
    returnMm: Dmm,
  });
  try {
    ensureLShapeDivisionSegments(toSec.division);
    if (otherSec.division) ensureLShapeDivisionSegments(otherSec.division);
  } catch (_) {}

  try {
    rebuildAllSectionZones();
  } catch (e) {
    console.warn('[CORNER-CELL] rebuild zones', e);
  }
  syncCornerCellMeshes();
  try {
    if (typeof window.__cldRebuildSectionZoneEditIconsForSection === 'function') {
      window.__cldRebuildSectionZoneEditIconsForSection(toSec.id);
      window.__cldRebuildSectionZoneEditIconsForSection(otherSec.id);
    }
  } catch (_) {}

  console.warn('[CORNER-CELL] reorient', {
    jointId: joint.jointId,
    fromWall,
    toWall,
    atStart: cc?.atStart === true,
    widthMm: cc?.widthMm,
  });

  return {
    ok: true,
    jointId: joint.jointId,
    cornerCellId: joint.cornerCellId,
    cornerCell: cc,
    fromWall,
    toWall,
    message: `Угловая ячейка вдоль «${toWall}», W=${KITCHEN_CORNER_CELL_WIDTH_MM}.`,
  };
}

/**
 * Разворот верхней угловой ячейки (слой mid, W=600).
 * Как низ: flip host → seat на другую стену. Низ (hostSide / CornerCell) не трогаем.
 */
export function reorientKitchenUpperCornerCell(sectionIdOrJoint, zoneIndexOpt) {
  let joint =
    sectionIdOrJoint && typeof sectionIdOrJoint === 'object' && sectionIdOrJoint.jointId
      ? sectionIdOrJoint
      : null;
  if (!joint) {
    joint =
      getKitchenJoint(sectionIdOrJoint) ||
      _jointFromSectionId(sectionIdOrJoint, zoneIndexOpt);
  }
  if (!joint) {
    return {
      ok: false,
      reason: 'no_joint',
      message: 'Joint угла не найден — пересоздай L/П.',
    };
  }

  ensureUpperCornerCellOnJoint(joint);
  const fromSec = getJointUpperHostSection(joint);
  const fromWall = _normWall(fromSec?.wallName);

  flipJointUpperHostSide(joint);
  const toSec = getJointUpperHostSection(joint);
  const otherSec = getJointUpperOtherSection(joint);
  if (!toSec || !otherSec) {
    flipJointUpperHostSide(joint);
    return {
      ok: false,
      reason: 'missing_section',
      message: 'Секция верхней ячейки не найдена.',
    };
  }

  const toWall = _normWall(toSec.wallName);
  const prevW = Math.round(Number(joint.upperCornerCell?.widthMm) || 0);
  const cc = seatKitchenJointUpperCorner(joint, {
    widthMm:
      prevW >= 300 && prevW <= 900 ? prevW : KITCHEN_UPPER_CORNER_CELL_WIDTH_MM,
    depthMm: KITCHEN_UPPER_CORNER_CELL_DEPTH_MM,
  });

  // MID спец 600 только на новом upper-host; чужое плечо — обычные ячейки под НШ1.
  try {
    applyKitchenLFreeArm600SacrificeWidths(toSec);
    applyKitchenLFreeArm600SacrificeWidths(otherSec);
  } catch (_) {}
  try {
    if (typeof window.__cldSyncKitchenBandGridsView === 'function') {
      window.__cldSyncKitchenBandGridsView();
    }
  } catch (_) {}

  syncCornerCellMeshes();
  try {
    if (typeof window.__cldRebuildSectionZoneEditIconsForSection === 'function') {
      window.__cldRebuildSectionZoneEditIconsForSection(toSec.id);
      window.__cldRebuildSectionZoneEditIconsForSection(otherSec.id);
    }
  } catch (_) {}

  console.warn('[CORNER-CELL] reorient upper', {
    jointId: joint.jointId,
    fromWall,
    toWall,
    atStart: cc?.atStart === true,
    widthMm: cc?.widthMm,
  });

  return {
    ok: true,
    layer: 'upper',
    jointId: joint.jointId,
    cornerCellId: joint.upperCornerCellId,
    cornerCell: cc,
    fromWall,
    toWall,
    message: `Верхняя угловая ячейка вдоль «${toWall}», W=${cc?.widthMm || KITCHEN_UPPER_CORNER_CELL_WIDTH_MM}.`,
  };
}

/** Все Joint кухни: низ + верх CornerCell + меши. */
export function ensureAllCornerCells() {
  for (const j of listKitchenJoints()) {
    try {
      ensureCornerCellOnJoint(j);
    } catch (_) {}
    try {
      ensureUpperCornerCellOnJoint(j);
    } catch (_) {}
  }
  syncCornerCellMeshes();
}

try {
  if (typeof window !== 'undefined') {
    window.__cldReorientKitchenCornerCell = reorientKitchenCornerCell;
    window.__cldReorientKitchenUpperCornerCell = reorientKitchenUpperCornerCell;
    window.__cldSyncCornerCellMeshes = syncCornerCellMeshes;
    window.__cldEnsureAllCornerCells = ensureAllCornerCells;
    window.__cldClearCornerCellMeshes = clearCornerCellMeshes;
  }
} catch (_) {}
