/**
 * Разворот НМУ в том же углу комнаты.
 * L и П — один канон: Joint + CornerCell (kitchen-joint.js).
 * Разворот = flip hostSide + reseat того же модуля. Без host-rebuild спины.
 */
import { state } from '../utils/state.js';
import {
  getLShapePairForSection,
  getLShapeSpecialZoneIndex,
  getLShapeSpecialSnapBounds,
  getLShapeSpecialZoneIndices,
  L_CORNER_CONFIG,
  fitFurnitureBBoxToZoneBounds,
  rebuildAllSectionZones,
  ensureLShapeDivisionSegments,
  stretchKitchenLAttachedToRoomCorner,
  stretchKitchenUArmsToRoomCorner,
} from '../sections/section-manager.js?v=20261116-lFree1';
import {
  resolveCornerJoint,
  sectionDepthWmm,
} from '../sections/corner-joint.js?v=20261028-ugrid1';
import {
  isKitchenWallCornerGroup,
  isKitchenCornerModuleGroup,
  rebuildForCellWidthMm,
} from './kitchen-base-engine.js?v=20261115-upperGTop8';
// handpair: window.__cldTrySwapKitchenCornerHandCatalog (furniture-manager)
import {
  placeKitchenModuleInCell,
  enforceKitchenDepthStackPlacement,
} from './kitchen-section-engine.js?v=20261107-ucorner12';
import {
  buildKitchenCornerReturnVars,
  resolveKitchenCornerPlaceFromProject,
  resolveKitchenCornerSpecialWidthMm,
  resolveKitchenWallCornerWidthMm,
  isKitchenSectionLayoutActive,
  applyKitchenLFreeArm600SacrificeWidths,
} from './kitchen-section-layout.js?v=20261118-overlayL6';
import {
  readUserDataClodisVariables,
  writeUserDataClodisVariables,
} from '../clodis-json-fields.js';
import { isUShapeBackSection } from '../sections/l-corner.js?v=20261022-bust13';
import {
  ensureKitchenJoint,
  findKitchenJointByModule,
  flipJointHostSide,
  applyJointReserves,
  bindModuleToJoint,
  syncJointDerivedSectionFlags,
  getJointHostSection,
  getJointOtherSection,
  getJointUpperHostSection,
  getJointUpperOtherSection,
  recomputeJointCornerCell,
  projectCornerCellOntoHostSection,
  KITCHEN_CORNER_CELL_WIDTH_MM,
  KITCHEN_UPPER_CORNER_CELL_WIDTH_MM,
  resolveKitchenUpperCornerDepthMm,
  resolveJointCatalogHandAtStart,
  findKitchenJointForSectionZone,
  seatKitchenJointCorner,
  seatKitchenJointUpperCorner,
} from './kitchen-joint.js?v=20261116-lCorner1050';

function _isUShapeKitchenCorner(section) {
  if (!section?.lShape) return false;
  try {
    if (isUShapeBackSection(section)) return true;
  } catch (_) {}
  const ls = section.lShape;
  if (ls.type === 'u-wardrobe' || section.division?.uShape === true) return true;
  if (ls.pairIdLeft != null || ls.pairIdRight != null) return true;
  try {
    const pairId = ls.pairId;
    if (pairId != null && Array.isArray(state.customSections)) {
      const other = state.customSections.find(
        (s) => s && String(s.id) === String(pairId)
      );
      if (other && isUShapeBackSection(other)) return true;
      if (other?.lShape?.type === 'u-wardrobe') return true;
      if (other?.lShape?.pairIdLeft != null || other?.lShape?.pairIdRight != null) {
        return true;
      }
    }
  } catch (_) {}
  return false;
}

function _wallRotY(wallName) {
  const w = String(wallName || '').toLowerCase();
  if (w === 'front') return Math.PI;
  if (w === 'left') return Math.PI / 2;
  if (w === 'right') return -Math.PI / 2;
  return 0;
}

function _normWall(name) {
  const w = String(name || '').trim().toLowerCase();
  return w === 'front' || w === 'back' || w === 'left' || w === 'right' ? w : null;
}

function _jointForWallPair(primaryWall, attachedWall) {
  const p = _normWall(primaryWall);
  const a = _normWall(attachedWall);
  if (!p || !a || p === a) return null;
  const typeKey = `corner-${p}-${a}`;
  if (!L_CORNER_CONFIG[typeKey]) return null;
  const jL = resolveCornerJoint(p, 'left');
  if (jL && jL.attached === a) return jL;
  const jR = resolveCornerJoint(p, 'right');
  if (jR && jR.attached === a) return jR;
  return null;
}

function _furnitureOnSection(sectionId) {
  const sid = String(sectionId || '');
  const out = [];
  if (!sid || !state.scene) return out;
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (String(obj.userData.sectionId || '') !== sid) return;
    out.push(obj);
  });
  return out;
}

function _offsetsCm(section) {
  const o = section?.offsets || {};
  return {
    left: (Number(o.leftMm) || 0) / 10,
    right: (Number(o.rightMm) || 0) / 10,
    front: (Number(o.frontMm) || 0) / 10,
    back: (Number(o.backMm) || 0) / 10,
    bottom: (Number(o.bottomMm) || 0) / 10,
    top: (Number(o.topMm) || 0) / 10,
  };
}

function _depthCm(section) {
  const wall = _normWall(section?.wallName) || 'back';
  const size = section?.size;
  if (!size) return 60;
  const mm =
    wall === 'left' || wall === 'right' ? Number(size.x) : Number(size.z);
  return (Number.isFinite(mm) && mm > 0 ? mm : 600) / 10;
}

function _setOffsetMm(section, side, mm) {
  if (!section || !side) return;
  const o = section.offsets || (section.offsets = {});
  o[`${side}Mm`] = Math.max(0, Math.round(Number(mm) || 0));
}

function _updateSection(section) {
  const upd =
    typeof window !== 'undefined' && typeof window.updateSectionSize === 'function'
      ? window.updateSectionSize
      : null;
  if (!upd || !section) return;
  try {
    upd(section, _offsetsCm(section), _depthCm(section));
  } catch (e) {
    console.warn('[CORNER-REORIENT] updateSectionSize', e);
  }
}

function _refreshMarkers(sectionIds) {
  try {
    if (typeof window.updateCabinetMarkersForSection !== 'function') return;
    for (const id of sectionIds) {
      if (id != null) window.updateCabinetMarkersForSection(id);
    }
  } catch (e) {
    console.warn('[CORNER-REORIENT] markers', e);
  }
}

function _rebuildIcons(sectionIds) {
  try {
    const rebuildIcons =
      typeof window !== 'undefined'
        ? window.__cldRebuildSectionZoneEditIconsForSection
        : null;
    if (typeof rebuildIcons !== 'function') return;
    for (const id of sectionIds) {
      if (id != null) rebuildIcons(id);
    }
  } catch (_) {}
}

function _pairOtherSection(section) {
  const pairId = section?.lShape?.pairId;
  if (pairId == null || !Array.isArray(state.customSections)) return null;
  return (
    state.customSections.find((s) => s && String(s.id) === String(pairId)) || null
  );
}

/**
 * Плоскость секции-соседа (как рабочий L freeCorner).
 * Не room.origin — пивот модуля/секции в другой СК, отсюда «оба уехали».
 */
function _adjacentWallPlane(adjacentSec) {
  const aw = _normWall(adjacentSec?.wallName);
  const p = adjacentSec?.group?.position;
  if (!aw || !p) return null;
  if (aw === 'back' || aw === 'front') return { axis: 'z', value: Number(p.z) };
  return { axis: 'x', value: Number(p.x) };
}

/** Знак «от стены в комнату» (как kitchenIntoRoomSign). */
function _intoRoomSign(wall) {
  const w = _normWall(wall);
  if (w === 'front' || w === 'right') return -1;
  return 1; // back, left
}

function _wallAxis(wall) {
  const w = _normWall(wall);
  return w === 'left' || w === 'right' ? 'x' : 'z';
}

/** Край bbox со стороны стены (не «ближайший» — иначе правый угол уезжает). */
function _bboxWallSideEdge(box, axis, wall) {
  return _intoRoomSign(wall) > 0 ? box.min[axis] : box.max[axis];
}

function _moduleLayoutBox(group) {
  group.updateMatrixWorld(true);
  try {
    const fn =
      typeof window !== 'undefined'
        ? window.__cldComputeFurnitureLayoutWorldBBoxNoAo
        : null;
    if (typeof fn === 'function') {
      const b = fn(group);
      if (b && !b.isEmpty?.()) return b;
    }
  } catch (_) {}
  return new THREE.Box3().setFromObject(group);
}

/**
 * Прижать край ячейки/шкафа к плоскости соседней стены (сторона стены, не nearest).
 */
function _alignModuleUToAdjacentCorner(group, adjacentSec) {
  const plane = _adjacentWallPlane(adjacentSec);
  const aw = _normWall(adjacentSec?.wallName);
  if (!plane || !aw || !Number.isFinite(plane.value)) return null;
  const box = _moduleLayoutBox(group);
  const uAxis = plane.axis;
  const target = plane.value;
  const edge = _bboxWallSideEdge(box, uAxis, aw);
  if (!Number.isFinite(edge)) return null;
  const delta = target - edge;
  if (!Number.isFinite(delta)) return null;
  if (Math.abs(delta) >= 0.5) {
    group.position[uAxis] += delta;
    group.updateMatrixWorld(true);
  }
  return {
    uAxis,
    target,
    edge: _intoRoomSign(aw) > 0 ? 'min' : 'max',
    delta: Math.round(delta),
  };
}

/**
 * Угол комнаты Joint: bbox ячейки (столешка) в пересечение двух стен.
 * Пивот group ≠ угол геометрии — поэтому не только position = joint.
 */
function _pinModuleBBoxToJointCorner(group, hostSec, adjacentSec) {
  const hw = _normWall(hostSec?.wallName);
  const aw = _normWall(adjacentSec?.wallName);
  const hp = hostSec?.group?.position;
  const ap = adjacentSec?.group?.position;
  if (!group || !hw || !aw || !hp || !ap) return null;
  const hostAxis = _wallAxis(hw);
  const adjAxis = _wallAxis(aw);
  const hostPlane = hostAxis === 'x' ? Number(hp.x) : Number(hp.z);
  const adjPlane = adjAxis === 'x' ? Number(ap.x) : Number(ap.z);
  if (!Number.isFinite(hostPlane) || !Number.isFinite(adjPlane)) return null;

  const box = _moduleLayoutBox(group);
  if (!box || box.isEmpty?.()) return null;
  const hostEdge = _bboxWallSideEdge(box, hostAxis, hw);
  const adjEdge = _bboxWallSideEdge(box, adjAxis, aw);
  const dHost = hostPlane - hostEdge;
  const dAdj = adjPlane - adjEdge;
  if (Math.abs(dHost) >= 0.5) group.position[hostAxis] += dHost;
  if (Math.abs(dAdj) >= 0.5) group.position[adjAxis] += dAdj;
  group.updateMatrixWorld(true);
  return {
    hostWall: hw,
    otherWall: aw,
    dHost: Math.round(dHost),
    dAdj: Math.round(dAdj),
  };
}

/** Плоскость стены = position секции-носителя (канон L freeCorner). */
function _putGroupOnSectionWallPlane(group, targetSec, wall) {
  const p = targetSec?.group?.position;
  if (!p || !group) return;
  group.position.y = p.y;
  if (wall === 'back' || wall === 'front') group.position.z = p.z;
  else group.position.x = p.x;
  group.updateMatrixWorld(true);
}

/**
 * Точка Joint = пересечение плоскостей двух секций (пивоты).
 * Убирает «отступ на глубину ячейки» после разворота.
 */
function _putGroupAtJointCorner(group, hostSec, adjacentSec) {
  const hp = hostSec?.group?.position;
  const ap = adjacentSec?.group?.position;
  if (!group || !hp || !ap) return false;
  const hw = _normWall(hostSec.wallName);
  const aw = _normWall(adjacentSec.wallName);
  if (!hw || !aw) return false;
  group.position.y = hp.y;
  if (hw === 'back' || hw === 'front') {
    group.position.z = hp.z;
    group.position.x = ap.x;
  } else {
    group.position.x = hp.x;
    group.position.z = ap.z;
  }
  group.updateMatrixWorld(true);
  return true;
}

/** Слой «Ячейки» выкл. → сажаем в геометрический угол (не в special/sectionStart). */
function _cellsUiOff() {
  if (state.kitchenCellsUiEnabled === false) return true;
  return !(state.showSingleZones || state.showDoubleZones);
}

/**
 * @param {object} [adjacentSecOpt] — соседняя стена того же joint.
 * @param {{ forceFreeCorner?: boolean }} [seatOpts]
 */
function _seatCornerModule(group, targetSec, specialZi, atStart, keep, adjacentSecOpt, seatOpts) {
  const ud = group.userData || (group.userData = {});
  const wall = targetSec.wallName || 'back';
  const sp = getLShapeSpecialSnapBounds(targetSec.division, specialZi);
  const isWall = isKitchenWallCornerGroup(group);
  // НМУ спец ~1050. ВМУ — своя верхняя ячейка (дефолт 600), не W низа.
  let cellW;
  if (isWall) {
    cellW = resolveKitchenWallCornerWidthMm(
      Number(keep.cellW) > 0 ? keep.cellW : ud
    );
  } else {
    const SPECIAL_W = resolveKitchenCornerSpecialWidthMm();
    cellW =
      keep.cellW >= 900 && keep.cellW <= 1200
        ? keep.cellW
        : sp?.moduleWidth >= 900 && sp.moduleWidth <= 1200
          ? Math.round(sp.moduleWidth)
          : SPECIAL_W;
  }
  const proj = resolveKitchenCornerPlaceFromProject();
  // ВМУ в пироге: clear/wallGap=0, return = D карточки (~350), не project rear/D низа.
  const clear = isWall
    ? 0
    : Number.isFinite(keep.clear) && keep.clear >= 0
      ? keep.clear
      : Math.max(0, Math.round(Number(proj.rearMm) || 10));
  const retX = isWall
    ? Math.round(
        Number(keep.retX) > 0
          ? keep.retX
          : Number(ud.__kitchenCornerReturnMm) ||
              Number(ud.__kitchenCarcassDepthMm) ||
              350
      )
    : keep.retX > 0
      ? keep.retX
      : Math.round(Number(proj.carcassMm) || 0) || Math.round(keep.Dmm || 560);
  const wallGap = isWall ? 0 : clear;

  ud.sectionId = targetSec.id;
  ud.zoneIndex = specialZi;
  ud.wallName = wall;
  ud.wall = wall;
  ud.__kitchenCornerSideAtMinU = atStart === true;
  ud.__kitchenSideWallClearanceMm = clear;
  ud.__kitchenCornerReturnMm = retX;
  ud.__kitchenCellWidthMm = cellW;
  ud.customWidthMm = cellW;

  try {
    const prev =
      readUserDataClodisVariables(ud) && typeof readUserDataClodisVariables(ud) === 'object'
        ? readUserDataClodisVariables(ud)
        : {};
    const cornerVars = buildKitchenCornerReturnVars(
      cellW,
      atStart === true,
      retX,
      clear,
      wallGap
    );
    writeUserDataClodisVariables(ud, {
      ...prev,
      ...cornerVars,
      corner_at_start: atStart ? 1 : 0,
    });
  } catch (_) {}

  try {
    const item = ud.catalogItem || ud.furnitureData?.catalogItem;
    if (item && typeof item === 'object') {
      item.cornerAtStart = atStart === true;
      if (!item.clodisVariables || typeof item.clodisVariables !== 'object') {
        item.clodisVariables = {};
      }
      item.clodisVariables.corner_at_start = atStart ? 1 : 0;
    }
  } catch (_) {}

  group.rotation.y = _wallRotY(wall);
  group.updateMatrixWorld(true);
  try {
    rebuildForCellWidthMm(group, targetSec, cellW);
  } catch (e) {
    console.warn('[CORNER-REORIENT] rebuild width', e);
  }

  const other =
    adjacentSecOpt && adjacentSecOpt.group
      ? adjacentSecOpt
      : _pairOtherSection(targetSec);

  // Геометрический угол Joint: ячейка bbox → обе стены (не только pivot group).
  const useFree =
    seatOpts?.forceFreeCorner === true || _cellsUiOff();
  if (useFree) {
    try {
      if (other) _putGroupAtJointCorner(group, targetSec, other);
      else _putGroupOnSectionWallPlane(group, targetSec, wall);
    } catch (e) {
      console.warn('[CORNER-REORIENT] free joint corner', e);
    }
    try {
      enforceKitchenDepthStackPlacement(group, targetSec, wall);
    } catch (e) {
      console.warn('[CORNER-REORIENT] free depth1', e);
    }
    let pin = null;
    if (other) {
      try {
        pin = _pinModuleBBoxToJointCorner(group, targetSec, other);
      } catch (e) {
        console.warn('[CORNER-REORIENT] free pin corner', e);
      }
    } else {
      try {
        _alignModuleUToAdjacentCorner(group, other);
      } catch (_) {}
    }
    try {
      enforceKitchenDepthStackPlacement(group, targetSec, wall);
    } catch (e) {
      console.warn('[CORNER-REORIENT] free depth2', e);
    }
    if (other) {
      try {
        pin = _pinModuleBBoxToJointCorner(group, targetSec, other) || pin;
      } catch (_) {}
    }
    console.warn('[CORNER-REORIENT] freeCorner seat', {
      wall,
      atStart: atStart === true,
      cellW,
      pin,
      otherWall: other?.wallName || null,
      force: seatOpts?.forceFreeCorner === true,
      pos: {
        x: Math.round(group.position.x),
        y: Math.round(group.position.y),
        z: Math.round(group.position.z),
      },
    });
    return { cellW, atStart: atStart === true, wall, freeCorner: true, pin };
  }

  // Ячейки вкл. (L): спец-слот + дожим к плоскости соседней стены joint.
  let align = null;
  try {
    placeKitchenModuleInCell(group, targetSec, specialZi, wall);
  } catch (e) {
    console.warn('[CORNER-REORIENT] place cell', e);
  }
  try {
    enforceKitchenDepthStackPlacement(group, targetSec, wall);
  } catch (e) {
    console.warn('[CORNER-REORIENT] cell depth1', e);
  }
  if (other) {
    try {
      align = _alignModuleUToAdjacentCorner(group, other);
    } catch (e) {
      console.warn('[CORNER-REORIENT] cell U-align', e);
    }
    try {
      enforceKitchenDepthStackPlacement(group, targetSec, wall);
    } catch (e) {
      console.warn('[CORNER-REORIENT] cell depth2', e);
    }
    try {
      align = _alignModuleUToAdjacentCorner(group, other) || align;
    } catch (_) {}
  }
  console.warn('[CORNER-REORIENT] cell seat', {
    wall,
    atStart: atStart === true,
    cellW,
    specialZi,
    align,
    otherWall: other?.wallName || null,
    pos: {
      x: Math.round(group.position.x),
      y: Math.round(group.position.y),
      z: Math.round(group.position.z),
    },
  });
  return { cellW, atStart: atStart === true, wall, align };
}

function _resolveUBundle(section) {
  const list = state.customSections || [];
  let spine = section;
  if (!isUShapeBackSection(section) && section.lShape?.type !== 'u-wardrobe') {
    const pid =
      section.lShape?.uSpineId ||
      section.lShape?.pairId ||
      null;
    const other =
      pid != null ? list.find((s) => s && String(s.id) === String(pid)) : null;
    if (other && (isUShapeBackSection(other) || other.lShape?.type === 'u-wardrobe')) {
      spine = other;
    }
  }
  if (!(isUShapeBackSection(spine) || spine.lShape?.type === 'u-wardrobe')) {
    return null;
  }
  const leftId = spine.lShape?.pairIdLeft;
  const rightId = spine.lShape?.pairIdRight;
  const leftArm =
    leftId != null ? list.find((s) => s && String(s.id) === String(leftId)) : null;
  const rightArm =
    rightId != null ? list.find((s) => s && String(s.id) === String(rightId)) : null;
  return { spine, leftArm, rightArm };
}

function _uHandForModule(group, bundle) {
  const ud = group.userData || {};
  if (ud.__uCornerHand === 'left' || ud.__uCornerHand === 'right') {
    return ud.__uCornerHand;
  }
  const sid = String(ud.sectionId || '');
  const zi = Number(ud.zoneIndex);

  if (bundle.rightArm && String(bundle.rightArm.id) === sid) return 'right';
  if (bundle.leftArm && String(bundle.leftArm.id) === sid) return 'left';

  if (String(bundle.spine.id) === sid) {
    const parts = Math.floor(Number(bundle.spine.division?.parts) || 0);
    if (zi === 0) return 'left';
    if (parts >= 2 && zi === parts - 1) return 'right';
    if (ud.__kitchenCornerSideAtMinU === true) return 'left';
    if (ud.__kitchenCornerSideAtMinU === false) return 'right';
  }
  return null;
}

function _syncHostMaps(spine, host) {
  const next = {
    left: host.left === 'arm' ? 'arm' : 'spine',
    right: host.right === 'arm' ? 'arm' : 'spine',
  };
  spine.lShape = spine.lShape || {};
  spine.lShape.kitchenCornerHost = next;
  spine.lShape.type = 'u-wardrobe';
  if (spine.division) {
    spine.division.uShape = true;
    spine.division.kitchenCornerHost = { ...next };
    spine.division.segmentsLShape = null;
    spine.division.segmentsLShapeBack = null;
    spine.division._segmentsEnsured = false;
  }
  spine._layoutCache = null;
  return next;
}

function _prepareArmAsCornerHost(arm, hand, spine, joint, cellWOpt) {
  if (!arm?.lShape || !joint) return;
  const typeKey = joint.typeKey;
  arm.lShape = {
    ...arm.lShape,
    pairId: spine.id,
    uSpineId: spine.id,
    hand,
    kitchenCornerHostHand: hand,
    kitchenCornerTypeKey: typeKey,
    // не затираем роль стены плеча; спец берём по kitchenCornerHostHand
  };
  if (!arm.division) return;
  arm.division.typeKey = typeKey;
  arm.division.uShape = false;
  arm.division.kitchenCornerHost = null;
  arm.division.segmentsLShape = null;
  arm.division.segmentsLShapeBack = null;
  arm.division._segmentsEnsured = false;
  const start = Number(arm.division.sectionStart);
  const end = Number(arm.division.sectionEnd);
  const span =
    Number.isFinite(start) && Number.isFinite(end) && end > start ? end - start : 0;
  const D = resolveKitchenCornerReturnMmSafe(arm) || sectionDepthWmm(spine) || 550;
  // Кухня: free = span − W спец (~1050), не span−D — иначе правый уезжает на ~полъячейки.
  const specialW = Math.max(
    D,
    Math.round(Number(cellWOpt) || 0) || resolveKitchenCornerSpecialWidthMm() || D
  );
  arm.division.cornerWidthMm = D;
  arm.division.singleWidthMm = 500;
  if (span > specialW) arm.division.freeSizeMm = Math.max(0, span - specialW);
  else if (span > D) arm.division.freeSizeMm = Math.max(0, span - D);
  arm._layoutCache = null;
}

function resolveKitchenCornerReturnMmSafe(arm) {
  try {
    const proj = resolveKitchenCornerPlaceFromProject();
    return Math.round(Number(proj.carcassMm) || 0);
  } catch (_) {
    return 0;
  }
}

function _clearArmCornerHost(arm) {
  if (!arm?.lShape) return;
  delete arm.lShape.kitchenCornerHostHand;
  delete arm.lShape.kitchenCornerTypeKey;
  if (arm.division) {
    arm.division.segmentsLShape = null;
    arm.division.segmentsLShapeBack = null;
    arm.division._segmentsEnsured = false;
    // плечо П снова без L-special typeKey спины
    if (arm.division.typeKey && String(arm.division.typeKey).startsWith('corner-')) {
      // оставим исходный type с createLinked; не трогаем сильно
    }
  }
  arm._layoutCache = null;
}

/** Приставка к стороне стыка со спиной (соседняя стена joint), не «к другому НМУ». */
function _atStartTowardAdjacent(hostWall, adjacentWall) {
  const j = _jointForWallPair(hostWall, adjacentWall);
  if (j && typeof j.cornerAtStart === 'boolean') return j.cornerAtStart === true;
  // fallback: на back левый угол = atStart
  if (hostWall === 'back') return adjacentWall === 'left';
  if (hostWall === 'front') return adjacentWall === 'right';
  if (hostWall === 'left') return adjacentWall === 'back';
  if (hostWall === 'right') return adjacentWall === 'back';
  return true;
}

/** zoneIndex-кэш для старого UI: угол ряда на host, не новая личность ячейки. */
function _bridgeZoneIndex(hostSec, atStart) {
  let zi = null;
  try {
    zi = getLShapeSpecialZoneIndex(hostSec);
  } catch (_) {}
  if (zi != null && Number.isFinite(Number(zi))) return Math.floor(Number(zi));
  const parts = Math.max(1, Math.floor(Number(hostSec?.division?.parts) || 1));
  return atStart === true ? 0 : parts - 1;
}

/**
 * Единый разворот L/П: Joint.flipHost → резервы → seat того же модуля.
 * Без ensureUShape / kitchenCornerHost / rebuild division спины.
 */
function _reorientViaJoint(group, joint, opts = {}) {
  if (!joint) {
    return { ok: false, reason: 'no_joint', message: 'Joint угла не создан.' };
  }

  const ud = group.userData || (group.userData = {});
  const sid = String(ud.sectionId || '');

  // Синхронизировать host с текущей секцией модуля (первый разворот / старые сцены).
  if (sid === String(joint.sectionAId)) {
    joint.hostSide = 'A';
    joint.hostSectionId = String(joint.sectionAId);
  } else if (sid === String(joint.sectionBId)) {
    joint.hostSide = 'B';
    joint.hostSectionId = String(joint.sectionBId);
  } else {
    return {
      ok: false,
      reason: 'bad_seat',
      message: 'Модуль не на секциях этого Joint.',
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

  // П: на целевом плече не должно быть чужих модулей (этот угол только).
  if (opts.kind === 'U' && opts.armSectionId != null) {
    if (String(toSec.id) === String(opts.armSectionId)) {
      const busy = _furnitureOnSection(toSec.id).filter((g) => g !== group);
      if (busy.length) {
        flipJointHostSide(joint);
        return {
          ok: false,
          reason: 'arm_busy',
          message: 'На этом плече П уже есть модули.',
        };
      }
    }
  }

  const toWall = _normWall(toSec.wallName);
  const otherWall = _normWall(otherSec.wallName);
  // Геометрия ячейки на новом host — только из стен (не из карточки).
  const geomAtStart = _atStartTowardAdjacent(toWall, otherWall);
  // Карточка: всегда смена левый↔правый при развороте.
  let currentHandAtStart = null;
  try {
    const nm = String(ud.catalogName || ud.catalogItem?.name || '').toLowerCase();
    if (/прав/.test(nm) && !/лев/.test(nm)) currentHandAtStart = false;
    else if (/лев/.test(nm)) currentHandAtStart = true;
  } catch (_) {}
  if (currentHandAtStart == null) {
    try {
      const cv = ud.catalogItem?.clodisVariables || ud.clodisVariables;
      const cas = cv?.corner_at_start;
      if (cas === 1 || cas === true || cas === '1') currentHandAtStart = true;
      else if (cas === 0 || cas === false || cas === '0') currentHandAtStart = false;
    } catch (_) {}
  }
  if (currentHandAtStart == null && ud.__kitchenCornerSideAtMinU != null) {
    currentHandAtStart = ud.__kitchenCornerSideAtMinU === true;
  }
  if (currentHandAtStart == null) {
    currentHandAtStart = resolveJointCatalogHandAtStart(joint) === true;
  }
  const catalogAtStart = currentHandAtStart !== true;

  const Dmm =
    sectionDepthWmm(toSec) || sectionDepthWmm(otherSec) || 560;
  const prevW = Math.round(Number(joint.cornerCell?.widthMm) || 0);
  const cellW =
    prevW >= 300 && prevW <= 1200 ? prevW : KITCHEN_CORNER_CELL_WIDTH_MM;
  const keep = {
    clear: Math.round(Number(ud.__kitchenSideWallClearanceMm)),
    retX: Math.round(Number(ud.__kitchenCornerReturnMm)),
    cellW,
    Dmm,
  };

  // Ячейка едет вместе с host: geom atStart + сброс stale на away.
  const cornerCell = seatKitchenJointCorner(joint, {
    depthMm: Dmm,
    widthMm: cellW,
    atStart: geomAtStart === true,
    clearMm: keep.clear,
    returnMm: keep.retX > 0 ? keep.retX : Dmm,
  });
  const projected = projectCornerCellOntoHostSection(joint);
  try {
    for (const s of [toSec, otherSec, fromSec]) {
      if (!s?.division) continue;
      ensureLShapeDivisionSegments(s.division);
    }
  } catch (e) {
    console.warn('[CORNER-REORIENT] ensure special segments', e);
  }
  bindModuleToJoint(group, joint);
  ud.__kitchenCellWidthMm = cellW;
  ud.customWidthMm = cellW;
  ud.__kitchenCornerCellId = joint.cornerCellId;

  // Канон B: парная карточка catalog_44 под новую руку (не geom).
  try {
    const swapFn =
      typeof window !== 'undefined'
        ? window.__cldTrySwapKitchenCornerHandCatalog
        : null;
    if (typeof swapFn !== 'function') {
      flipJointHostSide(joint);
      return {
        ok: false,
        reason: 'no_swap_fn',
        message: 'Нет swap левый/правый — перезагрузи комнату (?v=corner4).',
      };
    }
    const sw = swapFn(group, catalogAtStart === true, toSec);
    console.warn('[CORNER-REORIENT] hand catalog', {
      fromWall,
      toWall,
      geomAtStart,
      prevHand: currentHandAtStart,
      catalogAtStart,
      cellW,
      sw,
    });
    if (!sw || sw.ok === false) {
      flipJointHostSide(joint);
      return {
        ok: false,
        reason: sw?.reason || 'hand_swap_failed',
        message:
          sw?.message ||
          'Не сменилась карточка Угловой левый/правый — выгрузи catalog_44.',
      };
    }
    if (sw.swapped !== true && sw.fromId === sw.toId) {
      flipJointHostSide(joint);
      return {
        ok: false,
        reason: 'hand_not_swapped',
        message:
          'Разворот без смены левый↔правый. Проверь пару карточек catalog_44.',
      };
    }
  } catch (e) {
    console.warn('[CORNER-REORIENT] hand catalog swap', e);
    flipJointHostSide(joint);
    return {
      ok: false,
      reason: 'hand_swap_error',
      message: 'Ошибка смены левый/правый.',
    };
  }

  // Плечи до угла комнаты.
  try {
    if (joint.kind === 'U') {
      const spine =
        opts.spineSection ||
        (String(joint.sectionAId) &&
          (state.customSections || []).find(
            (s) => s && String(s.id) === String(joint.sectionAId)
          ));
      if (spine) stretchKitchenUArmsToRoomCorner(spine);
    } else {
      const attached =
        String(toSec.id) === String(joint.sectionBId) ? toSec : otherSec;
      if (attached?.lShape) stretchKitchenLAttachedToRoomCorner(attached);
    }
  } catch (e) {
    console.warn('[CORNER-REORIENT] stretch to corner', e);
  }

  // НМУ всегда внутри CornerCell на новом host (geom atStart).
  const specialZi =
    projected?.zoneIndex != null
      ? projected.zoneIndex
      : _bridgeZoneIndex(toSec, geomAtStart);
  ud.__kitchenCellWidthMm = cellW;
  ud.customWidthMm = cellW;
  const seated = _seatCornerModule(
    group,
    toSec,
    specialZi,
    geomAtStart === true,
    keep,
    otherSec,
    { forceFreeCorner: true }
  );
  bindModuleToJoint(group, joint);
  ud.__kitchenCellWidthMm = cellW;
  ud.customWidthMm = cellW;
  ud.__kitchenCornerCellId = joint.cornerCellId;
  ud.sectionId = toSec.id;
  ud.zoneIndex = specialZi;
  ud.wallName = toWall;
  ud.wall = toWall;
  try {
    rebuildForCellWidthMm(group, toSec, cellW);
  } catch (e) {
    console.warn('[CORNER-REORIENT] rebuild CornerCell W', e);
  }
  try {
    _putGroupAtJointCorner(group, toSec, otherSec);
    enforceKitchenDepthStackPlacement(group, toSec, toWall);
    _pinModuleBBoxToJointCorner(group, toSec, otherSec);
    enforceKitchenDepthStackPlacement(group, toSec, toWall);
    _pinModuleBBoxToJointCorner(group, toSec, otherSec);
  } catch (e) {
    console.warn('[CORNER-REORIENT] re-pin CornerCell', e);
  }
  ud.__uCornerSeat =
    opts.kind === 'U'
      ? String(toSec.id) === String(opts.armSectionId)
        ? 'arm'
        : 'spine'
      : null;

  try {
    rebuildAllSectionZones();
  } catch (e) {
    console.warn('[CORNER-REORIENT] rebuild zones', e);
  }
  // Ячейка (оранжевый меш) едет вместе с Joint — без этого остаётся на старом host.
  try {
    if (typeof window.__cldSyncCornerCellMeshes === 'function') {
      window.__cldSyncCornerCellMeshes();
    }
  } catch (_) {}
  _refreshMarkers([joint.sectionAId, joint.sectionBId]);
  _rebuildIcons([joint.sectionAId, joint.sectionBId]);
  try {
    if (typeof window.__cldSyncCellVolumeMeshes === 'function') {
      window.__cldSyncCellVolumeMeshes();
    }
  } catch (_) {}

  console.warn('[CORNER-REORIENT] CornerCell+NMU flip', {
    kind: joint.kind,
    hand: joint.hand,
    jointId: joint.jointId,
    cornerCellId: joint.cornerCellId,
    cornerCell,
    fromWall,
    toWall,
    hostSide: joint.hostSide,
    geomAtStart,
    catalogAtStart,
    cellW,
    seated,
  });

  return {
    ok: true,
    jointId: joint.jointId,
    cornerCellId: joint.cornerCellId,
    cornerCell,
    kind: joint.kind,
    hand: joint.hand,
    uShape: joint.kind === 'U',
    fromWall,
    toWall,
    cellW,
    message:
      joint.kind === 'U'
        ? `П (${joint.hand}): ячейка+НМУ вдоль «${toWall}».`
        : `Ячейка+НМУ развёрнуты вдоль «${toWall}», W=${cellW}.`,
  };
}

function _reorientUCorner(group, sec) {
  const bundle = _resolveUBundle(sec);
  if (!bundle?.spine) {
    return { ok: false, reason: 'no_u', message: 'П-сборка не найдена.' };
  }
  const { spine, leftArm, rightArm } = bundle;
  if (!leftArm || !rightArm) {
    return {
      ok: false,
      reason: 'incomplete_u',
      message: 'У П нет обоих плеч — пересоздай секцию.',
    };
  }

  const hand = _uHandForModule(group, bundle);
  if (hand !== 'left' && hand !== 'right') {
    return {
      ok: false,
      reason: 'bad_hand',
      message: 'Не понял, левый это угол или правый. Поставь угловой в спец-ячейку.',
    };
  }

  const arm = hand === 'left' ? leftArm : rightArm;
  const spineWall = _normWall(spine.wallName) || 'back';
  const armWall = _normWall(arm.wallName);
  if (!armWall) {
    return { ok: false, reason: 'bad_arm_wall', message: 'Стена плеча не определена.' };
  }
  if (!_jointForWallPair(armWall, spineWall) && !_jointForWallPair(spineWall, armWall)) {
    return {
      ok: false,
      reason: 'no_joint',
      message: `Разворот П (${hand}) не поддержан для стен ${spineWall}/${armWall}.`,
    };
  }

  let joint = findKitchenJointByModule(group);
  if (!joint || joint.kind !== 'U' || joint.hand !== hand) {
    joint = ensureKitchenJoint({
      kind: 'U',
      hand,
      sectionA: spine,
      sectionB: arm,
      preferHostId: group.userData?.sectionId,
    });
  }
  return _reorientViaJoint(group, joint, {
    kind: 'U',
    armSectionId: arm.id,
    spineSection: spine,
  });
}

/**
 * L: один Joint на пару primary+attached. Тот же flip, что у П.
 */
function _reorientLPair(group, sec) {
  const pair = getLShapePairForSection(sec);
  if (!pair?.primary || !pair?.attached) {
    return { ok: false, reason: 'no_pair', message: 'Нет пары L для этого угла.' };
  }
  if (_isUShapeKitchenCorner(pair.primary) || _isUShapeKitchenCorner(pair.attached)) {
    return _reorientUCorner(group, pair.primary);
  }

  const primary = pair.primary;
  const attached = pair.attached;
  const primWall = _normWall(primary.wallName);
  const attWall = _normWall(attached.wallName);
  if (!primWall || !attWall) {
    return { ok: false, reason: 'bad_walls', message: 'Не удалось определить стены угла.' };
  }
  if (!_jointForWallPair(primWall, attWall) && !_jointForWallPair(attWall, primWall)) {
    return {
      ok: false,
      reason: 'no_joint',
      message: `Разворот ${primWall}↔${attWall} не поддержан (нет joint config).`,
    };
  }

  let joint = findKitchenJointByModule(group);
  if (!joint || joint.kind !== 'L') {
    joint = ensureKitchenJoint({
      kind: 'L',
      sectionA: primary,
      sectionB: attached,
      preferHostId: group.userData?.sectionId,
    });
  }
  return _reorientViaJoint(group, joint, { kind: 'L' });
}

/**
 * ВМУ: только смена карточки левый↔правый + reseat W=600.
 * Joint/CornerCell низа не flip — нижний слой пирога независим.
 */
function _reorientWallCornerHandOnly(group, sec) {
  const ud = group.userData || (group.userData = {});
  // Геометрия угла комнаты (низ) не меняется — только рука карточки ВМУ.
  const geomAtStart =
    ud.__kitchenCornerSideAtMinU != null
      ? ud.__kitchenCornerSideAtMinU === true
      : true;
  let currentHandAtStart = null;
  try {
    const nm = String(ud.catalogName || ud.catalogItem?.name || '').toLowerCase();
    if (/прав/.test(nm) && !/лев/.test(nm)) currentHandAtStart = false;
    else if (/лев/.test(nm)) currentHandAtStart = true;
  } catch (_) {}
  if (currentHandAtStart == null) {
    try {
      const cv = ud.catalogItem?.clodisVariables || ud.clodisVariables;
      const cas = cv?.corner_at_start;
      if (cas === 1 || cas === true || cas === '1') currentHandAtStart = true;
      else if (cas === 0 || cas === false || cas === '0') currentHandAtStart = false;
    } catch (_) {}
  }
  if (currentHandAtStart == null) currentHandAtStart = geomAtStart;
  const wantAtStart = currentHandAtStart !== true;

  const cellW = resolveKitchenWallCornerWidthMm(group);
  ud.__kitchenCellWidthMm = cellW;
  ud.customWidthMm = cellW;

  try {
    const swapFn =
      typeof window !== 'undefined'
        ? window.__cldTrySwapKitchenCornerHandCatalog
        : null;
    if (typeof swapFn !== 'function') {
      return {
        ok: false,
        reason: 'no_swap_fn',
        message: 'Нет swap левый/правый — refresh ?v=vmu3.',
      };
    }
    const sw = swapFn(group, wantAtStart === true, sec);
    console.warn('[CORNER-REORIENT] wall hand catalog', {
      prevHand: currentHandAtStart,
      wantAtStart,
      geomAtStart,
      cellW,
      sw,
    });
    if (!sw || sw.ok === false) {
      return {
        ok: false,
        reason: sw?.reason || 'hand_swap_failed',
        message:
          sw?.message ||
          'Не сменилась карточка ВМУ левый/правый — выгрузи catalog_54.',
      };
    }
    if (sw.swapped !== true && sw.fromId === sw.toId) {
      return {
        ok: false,
        reason: 'hand_not_swapped',
        message:
          'Разворот без смены левый↔правый. Проверь пару карточек catalog_54.',
      };
    }
  } catch (e) {
    console.warn('[CORNER-REORIENT] wall hand catalog', e);
    return {
      ok: false,
      reason: 'hand_swap_error',
      message: 'Ошибка смены ВМУ левый/правый.',
    };
  }

  ud.__kitchenCornerSideAtMinU = geomAtStart;
  const retX = Math.round(
    Number(ud.__kitchenCornerReturnMm) ||
      Number(ud.__kitchenCarcassDepthMm) ||
      350
  );
  const specialZi =
    ud.zoneIndex != null && Number.isFinite(Number(ud.zoneIndex))
      ? Number(ud.zoneIndex)
      : getLShapeSpecialZoneIndex(sec);
  const other = _pairOtherSection(sec);
  const seated = _seatCornerModule(
    group,
    sec,
    specialZi,
    geomAtStart,
    { clear: 0, retX, cellW, Dmm: retX },
    other,
    { forceFreeCorner: true }
  );
  try {
    if (typeof window.__cldSyncCornerCellMeshes === 'function') {
      window.__cldSyncCornerCellMeshes();
    }
  } catch (_) {}
  return {
    ok: true,
    wallCorner: true,
    catalogAtStart: wantAtStart === true,
    cellW,
    seated,
    message: `ВМУ ${wantAtStart ? 'левый' : 'правый'}, W=${cellW}.`,
  };
}

/**
 * Разворот угла: НМУ — Joint+карточка; ВМУ — только карточка (низ не трогаем).
 * @param {THREE.Object3D} group — NMU или ВМУ на special
 */
export function reorientKitchenCornerModule(group) {
  if (!isKitchenSectionLayoutActive()) {
    return {
      ok: false,
      reason: 'not_kitchen',
      message: 'Разворот угла только в кухонном режиме.',
    };
  }
  if (!group || !isKitchenCornerModuleGroup(group)) {
    return {
      ok: false,
      reason: 'not_corner',
      message: 'Разворот доступен только для углового НМУ/ВМУ.',
    };
  }
  const ud = group.userData || (group.userData = {});
  const sid = ud.sectionId;
  const sec =
    sid != null && Array.isArray(state.customSections)
      ? state.customSections.find((s) => s && String(s.id) === String(sid))
      : null;
  if (!sec?.lShape) {
    return { ok: false, reason: 'no_section', message: 'Секция угла не найдена.' };
  }

  if (isKitchenWallCornerGroup(group)) {
    return _reorientWallCornerHandOnly(group, sec);
  }

  // П: seat по joint одного угла. Не звать L-путь (он ломал u-wardrobe).
  if (_isUShapeKitchenCorner(sec)) {
    return _reorientUCorner(group, sec);
  }
  return _reorientLPair(group, sec);
}

/**
 * Посадка углового шкафа в CornerCell (пустое посадочное место).
 * Левый угол → карточка «Угловой левый»; правый → «Угловой правый».
 * Геометрия seat — cornerCell.atStart (стены), не путать с рукой карточки.
 */
export function placeModuleIntoKitchenCornerCell(group, section, zoneIndex) {
  if (!group || !section) {
    return { ok: false, reason: 'no_args' };
  }
  if (!isKitchenSectionLayoutActive()) {
    return { ok: false, reason: 'not_kitchen' };
  }
  if (!isKitchenCornerModuleGroup(group)) {
    return { ok: false, reason: 'not_corner' };
  }

  let joint =
    findKitchenJointByModule(group) ||
    findKitchenJointForSectionZone(section, zoneIndex);
  if (!joint) {
    // L/П: поднять Joint с секций, если ещё не создан.
    try {
      if (typeof window.__cldEnsureAllCornerCells === 'function') {
        window.__cldEnsureAllCornerCells();
      }
    } catch (_) {}
    joint =
      findKitchenJointByModule(group) ||
      findKitchenJointForSectionZone(section, zoneIndex);
  }
  if (!joint) {
    return {
      ok: false,
      reason: 'no_joint',
      message: 'Joint угла не найден — пересоздай L/П.',
    };
  }

  const isWall = isKitchenWallCornerGroup(group);
  // Верх: и Г-обр, и приставной (ВМУ1 / Угловой навес) → одна G-ячейка.
  if (isWall) {
    try {
      if (typeof window.__cldEnsureAllCornerCells === 'function') {
        window.__cldEnsureAllCornerCells();
      }
    } catch (_) {}
    joint =
      findKitchenJointByModule(group) ||
      findKitchenJointForSectionZone(section, zoneIndex);
    if (!joint?.upperCornerCell) {
      const list =
        typeof window.__cldListKitchenJoints === 'function'
          ? window.__cldListKitchenJoints()
          : [];
      for (const j of list || []) {
        if (!j?.upperCornerCell) continue;
        if (
          String(j.sectionAId) === String(section.id) ||
          String(j.sectionBId) === String(section.id)
        ) {
          joint = j;
          break;
        }
      }
    }
    if (!joint?.upperCornerCell) {
      return { ok: false, reason: 'no_upper_g_cell' };
    }
    if (typeof window.__cldPlaceModuleIntoUpperGCell === 'function') {
      return window.__cldPlaceModuleIntoUpperGCell(group, joint, {
        rebuildArms: true,
        rebuildGeometry: true,
      });
    }
    return { ok: false, reason: 'no_upper_g_place_api' };
  }
  const host = getJointHostSection(joint) || section;
  const other = getJointOtherSection(joint);
  const Dmm = sectionDepthWmm(host) || sectionDepthWmm(other) || 560;
  // Низ CornerCell = 1050.
  const cellW =
    Math.round(Number(joint.cornerCell?.widthMm) || 0) >= 300
      ? Math.round(Number(joint.cornerCell.widthMm))
      : KITCHEN_CORNER_CELL_WIDTH_MM;
  const placeClear = Math.round(
    Number(group.userData?.__kitchenSideWallClearanceMm) || 10
  );
  const placeReturn = Dmm;
  seatKitchenJointCorner(joint, {
    depthMm: Dmm,
    widthMm: cellW,
    clearMm: placeClear,
    returnMm: placeReturn,
  });
  const geomAtStart = joint.cornerCell?.atStart === true;
  const catalogAtStart = resolveJointCatalogHandAtStart(joint) === true;
  const projected = projectCornerCellOntoHostSection(joint);
  const specialZi =
    projected?.zoneIndex != null
      ? projected.zoneIndex
      : geomAtStart
        ? 0
        : Math.max(0, Math.floor(Number(host.division?.parts) || 1) - 1);

  // Карточка под угол комнаты (левый/правый).
  try {
    const swapFn =
      typeof window !== 'undefined'
        ? window.__cldTrySwapKitchenCornerHandCatalog
        : null;
    if (typeof swapFn === 'function') {
      const sw = swapFn(group, catalogAtStart, host);
      console.warn('[CORNER-PLACE] hand catalog', {
        catalogAtStart,
        geomAtStart,
        isWall: false,
        sw,
      });
    }
  } catch (e) {
    console.warn('[CORNER-PLACE] hand catalog', e);
  }

  bindModuleToJoint(group, joint);
  const ud = group.userData || (group.userData = {});
  ud.__kitchenCornerCellId = joint.cornerCellId;
  ud.__kitchenCellWidthMm = cellW;
  ud.customWidthMm = cellW;
  ud.sectionId = host.id;
  ud.zoneIndex = specialZi;

  const keep = {
    clear: placeClear,
    retX: placeReturn,
    cellW,
    Dmm,
  };
  const seated = _seatCornerModule(
    group,
    host,
    specialZi,
    geomAtStart,
    keep,
    other,
    { forceFreeCorner: true }
  );
  bindModuleToJoint(group, joint);
  try {
    rebuildForCellWidthMm(group, host, cellW);
  } catch (_) {}
  try {
    if (other) {
      _putGroupAtJointCorner(group, host, other);
      enforceKitchenDepthStackPlacement(group, host, host.wallName);
      _pinModuleBBoxToJointCorner(group, host, other);
      enforceKitchenDepthStackPlacement(group, host, host.wallName);
      _pinModuleBBoxToJointCorner(group, host, other);
    }
  } catch (e) {
    console.warn('[CORNER-PLACE] pin', e);
  }
  try {
    if (typeof window.__cldSyncCornerCellMeshes === 'function') {
      window.__cldSyncCornerCellMeshes();
    }
  } catch (_) {}

  console.warn('[CORNER-PLACE] into CornerCell', {
    jointId: joint.jointId,
    hand: joint.hand,
    catalogAtStart,
    geomAtStart,
    cellW,
    hostWall: host.wallName,
    seated,
  });
  return {
    ok: true,
    jointId: joint.jointId,
    cornerCellId: joint.cornerCellId,
    catalogAtStart,
    geomAtStart,
    cellW,
    seated,
  };
}

try {
  if (typeof window !== 'undefined') {
    window.__cldReorientKitchenCornerModule = reorientKitchenCornerModule;
    window.__cldPlaceModuleIntoKitchenCornerCell = placeModuleIntoKitchenCornerCell;
  }
} catch (_) {}
