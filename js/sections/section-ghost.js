// Section ghost module - handles section placement preview
// Manages the visual ghost/preview of a section while placing it on walls

import { state } from '../utils/state.js';
import { updateMousePosition } from '../events/mouse-handler.js';
import {
  computeWallSolidSpans,
  getMinPlaceMmFromRoomConfig,
  spanToSectionPose,
  sectionPivotFromSpanOffsets,
  pickSpanAtAlong,
  alongFromRoomLocal,
  applyPlacementConstraintsToSpans,
  findWallWindowHeightProfile,
} from './wall-solid-spans.js?v=20260917-sec-win16';
import {
  resolveCornerJoint,
  resolveSectionCornerJoint,
  roomCornerLocal,
  sectionDepthWmm,
} from './corner-joint.js?v=20260923-cohabit42';
import { getWallAxes } from '../utils/wall-coords.js';
import {
  showSectionSpanChooser,
  hideSectionSpanChooser,
  clearSectionPlacementSpanState,
} from './section-span-chooser.js?v=20260917-sec-win16';
import {
  isCornerLayoutKey,
  isUShapeLayoutKey,
  cornerLayoutSide,
  cornerLayoutKeyForSide,
  spanDoorSide,
  highlightRoomLayoutCard,
  applyCornerLayoutForDoorSide,
} from './l-corner.js?v=20260917-u-a4';
import { addCabinetMarkers, removeCabinetMarkers } from '../ui/cabinet-markers.js?v=20260925-corner44y';

const GHOST_NICHE_MM = 600;
const GHOST_CORNER_GAP_MM = 50;

/** TEMP: Г-призрак углового на стыке / спец-зоне. */
function signTowardRoomCenter(uDir, corner, room) {
  const cx = (Number(room.width) || 0) / 2 - Number(corner.x);
  const cz = (Number(room.depth) || 0) / 2 - Number(corner.z);
  return cx * uDir.x + cz * uDir.z >= 0 ? 1 : -1;
}

function wallBoxRotY(wallName) {
  if (wallName === 'left') return Math.PI / 2;
  if (wallName === 'right') return -Math.PI / 2;
  if (wallName === 'front') return Math.PI;
  return 0;
}

function makeTempLArm(alongMm, heightMm, depthMm, color) {
  const geom = new THREE.BoxGeometry(alongMm, heightMm, depthMm);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.55,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.renderOrder = 999;
  mesh.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(geom),
      new THREE.LineBasicMaterial({
        color: 0xff2200,
        transparent: true,
        opacity: 1,
        depthTest: false,
      })
    )
  );
  return mesh;
}

export function hideTempLCornerGhost() {
  const g = state._tempLCornerGhost;
  if (g) g.visible = false;
}

export function disposeTempLCornerGhost() {
  const g = state._tempLCornerGhost;
  if (!g) return;
  if (g.parent) g.parent.remove(g);
  g.traverse((ch) => {
    if (ch.geometry) ch.geometry.dispose();
    if (ch.material) {
      if (Array.isArray(ch.material)) ch.material.forEach((m) => m.dispose());
      else ch.material.dispose();
    }
  });
  state._tempLCornerGhost = null;
  state._tempLCornerGhostKey = null;
}

/** Отключено: угловой ставится из catalog_44 в спец-зону, без temp-боксов. */
export function showTempLCornerGhostForJoint(_joint, _opts = {}) {
  hideTempLCornerGhost();
  disposeTempLCornerGhost();
  return false;
}

/** Отключено: см. showTempLCornerGhostForJoint. */
export function showTempLCornerGhostForSection(_section) {
  hideTempLCornerGhost();
  disposeTempLCornerGhost();
  return false;
}

/**
 * Start section placement mode
 * Creates a full-wall section and enables placement mode
 */
export function startPlacingSection() {
  if (!state.room) {
    console.error('❌ Комната не создана');
    return;
  }

  const sectionWidth = state.room.width;
  const sectionHeight = state.room.height;
  const sectionDepth = 600;

  console.log('🏗️ Начато размещение секции:', {
    width: sectionWidth,
    height: sectionHeight,
    depth: sectionDepth,
  });

  state.pendingSectionData = {
    width: sectionWidth,
    height: sectionHeight,
    depth: sectionDepth,
  };

  clearSectionPlacementSpanState();
  state.isPlacingSection = true;

  createSectionGhost(sectionWidth, sectionHeight, sectionDepth);

  const rect = state.renderer.domElement.getBoundingClientRect();
  const fakeEvent = {
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
  };
  updateSectionGhostPosition(fakeEvent);

  console.log('✅ Режим размещения секции активирован');
}

/**
 * Create a visual ghost/preview of a section
 */
export function createSectionGhost(width, height, depth, wallName = 'back') {
  const root = ensureSectionGhostRoot();
  clearSectionGhostChildren(root);
  const unit = buildSectionGhostUnit(width, height, depth, wallName);
  root.add(unit);
  root.visible = true;
  root.userData.wallName = wallName;
}

function ensureSectionGhostRoot() {
  if (state.sectionGhost?.isObject3D) return state.sectionGhost;
  const root = new THREE.Group();
  root.name = 'SectionGhostRoot';
  root.visible = true;
  root.userData.isGhost = true;
  state.scene.add(root);
  state.sectionGhost = root;
  return root;
}

function disposeObject3DTree(obj) {
  if (!obj) return;
  obj.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
      else child.material.dispose();
    }
  });
}

function clearSectionGhostChildren(root) {
  if (!root) return;
  removeCabinetMarkers('ghost');
  const kids = [...root.children];
  kids.forEach((ch) => {
    root.remove(ch);
    disposeObject3DTree(ch);
  });
}

/** Один объём призрака (заливка + рамка) в локали пивота секции. */
function buildSectionGhostUnit(width, height, depth, wallName = 'back') {
  const ghostGroup = new THREE.Group();
  ghostGroup.name = 'SectionGhostUnit';
  ghostGroup.userData.isGhost = true;
  ghostGroup.userData.wallName = wallName;

  let geometry = new THREE.BoxGeometry(width, height, depth);
  if (wallName === 'right') {
    geometry.translate(-width / 2, height / 2, depth / 2);
  } else if (wallName === 'left') {
    geometry.translate(width / 2, height / 2, -depth / 2);
  } else if (wallName === 'front') {
    geometry.translate(-width / 2, height / 2, -depth / 2);
  } else {
    geometry.translate(width / 2, height / 2, depth / 2);
  }
  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xff0000,
    linewidth: 5,
    transparent: false,
    opacity: 1.0,
  });
  const wireframe = new THREE.LineSegments(edges, lineMaterial);
  wireframe.userData.isGhostFrame = true;
  ghostGroup.add(wireframe);

  const fillMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
  });
  const fillMesh = new THREE.Mesh(geometry, fillMaterial);
  fillMesh.userData.isGhostFill = true;
  ghostGroup.add(fillMesh);
  return ghostGroup;
}

/** Красная рамка + маркеры — только после явного выбора пролёта (или один пролёт). */
function setSectionGhostFrameVisible(visible) {
  const ghost = state.sectionGhost;
  if (!ghost) return;
  ghost.traverse((child) => {
    if (child?.userData?.isGhostFrame) child.visible = !!visible;
  });
  if (!visible) {
    removeCabinetMarkers('ghost');
  }
}

function shouldShowSectionGhostFrame() {
  const spans = state.sectionPlacementSpans || [];
  if (spans.length <= 1) return true;
  return !!state.sectionPlacementSelectionLocked;
}

/**
 * Remove the section ghost from the scene
 */
export function removeSectionGhost(opts = {}) {
  if (state.sectionGhost) {
    removeCabinetMarkers('ghost');
    state.sectionGhostDivision = null;
    clearSectionGhostChildren(state.sectionGhost);
    state.scene.remove(state.sectionGhost);
    disposeObject3DTree(state.sectionGhost);
    state.sectionGhost = null;
  }
  state.sectionGhostWall = null;
  state.sectionGhostPosition = null;
  if (!opts.keepChooser) {
    clearSectionPlacementSpanState();
  }
  hideTempLCornerGhost();
  disposeTempLCornerGhost();
}

function openingsList() {
  return Array.isArray(state.roomEditOpenings) ? state.roomEditOpenings : [];
}

function currentPlacementLayoutKey() {
  return (
    state.pendingLayoutKey ||
    (window.selectedRoomLayout && window.selectedRoomLayout.key) ||
    null
  );
}

function refreshChooser(spans, allowBoth = true) {
  if (isUShapeLayoutKey(currentPlacementLayoutKey())) {
    hideSectionSpanChooser();
    return;
  }
  const locked = !!state.sectionPlacementSelectionLocked;
  const selectedIds = state.sectionPlacementSelectedIds || [];
  showSectionSpanChooser(spans, {
    selectedIds,
    placeAll: !!state.sectionPlacementPlaceAll,
    placeBridge: !!state.sectionPlacementPlaceProfile,
    selectionLocked: locked,
    allowBoth: allowBoth !== false,
    bridgeSpan: state.sectionPlacementHeightProfile || null,
    onSelect: (id) => {
      state.sectionPlacementPlaceAll = false;
      state.sectionPlacementPlaceProfile = false;
      state.sectionPlacementSelectionLocked = true;
      state.sectionPlacementSelectedIds = [id];
      applySelectedSpanToGhost();
      refreshChooser(
        state.sectionPlacementSpans || [],
        state.sectionPlacementAllowBoth !== false
      );
    },
    onSelectAll: () => {
      if (state.sectionPlacementAllowBoth === false) return;
      const placeable = (state.sectionPlacementSpans || []).filter((s) => s.placeable);
      state.sectionPlacementPlaceAll = true;
      state.sectionPlacementPlaceProfile = false;
      state.sectionPlacementSelectionLocked = true;
      state.sectionPlacementSelectedIds = placeable.map((s) => s.id);
      applySelectedSpanToGhost();
      refreshChooser(state.sectionPlacementSpans || [], true);
    },
    onSelectBridge: () => {
      if (!state.sectionPlacementHeightProfile) return;
      state.sectionPlacementPlaceAll = false;
      state.sectionPlacementPlaceProfile = true;
      state.sectionPlacementSelectionLocked = true;
      state.sectionPlacementSelectedIds = [
        ...(state.sectionPlacementHeightProfile.sourceSpanIds || []),
      ];
      applySelectedSpanToGhost();
      refreshChooser(
        state.sectionPlacementSpans || [],
        state.sectionPlacementAllowBoth !== false
      );
    },
    onConfirm: () => {
      if (!state.sectionPlacementSelectionLocked) {
        const ids = state.sectionPlacementSelectedIds || [];
        if (
          state.sectionPlacementPlaceProfile ||
          state.sectionPlacementPlaceAll ||
          ids.length
        ) {
          state.sectionPlacementSelectionLocked = true;
        }
      }
      if (typeof window.__cldConfirmPendingSectionPlacement === 'function') {
        window.__cldConfirmPendingSectionPlacement();
      }
    },
  });
}

/** Все выбранные пролёты (для «Оба пролёта» — несколько). */
function selectedSpansList() {
  const spans = state.sectionPlacementSpans || [];
  const ids = state.sectionPlacementSelectedIds || [];
  if (!ids.length) {
    const one = spans.find((s) => s.placeable);
    return one ? [one] : [];
  }
  return ids
    .map((id) => spans.find((s) => s.id === id))
    .filter((s) => s && s.placeable);
}

function wallAlongMm(room, wallName) {
  if (!room) return 0;
  return wallName === 'left' || wallName === 'right'
    ? Number(room.depth) || 0
    : Number(room.width) || 0;
}

function primaryNicheMm(wallName, pose) {
  if (!pose) return GHOST_NICHE_MM;
  if (wallName === 'left' || wallName === 'right') {
    return Number(pose.width) > 0 ? Number(pose.width) : GHOST_NICHE_MM;
  }
  return Number(pose.depth) > 0 ? Number(pose.depth) : GHOST_NICHE_MM;
}

/**
 * 50 мм на primary со стороны attached — в осях стены, не if back/front.
 */
function applyPrimaryCornerGap(wallName, pose, gapSide, gapMm) {
  if (!pose || !gapSide || !(gapMm > 0)) return pose;
  const out = { ...pose };
  if (wallName === 'back' || wallName === 'front') {
    out.width = Math.max(1, Number(pose.width) - gapMm);
    if (wallName === 'back' && gapSide === 'left') out.finalX = pose.finalX + gapMm;
    if (wallName === 'front' && gapSide === 'right') out.finalX = pose.finalX - gapMm;
    return out;
  }
  out.depth = Math.max(1, Number(pose.depth) - gapMm);
  if (wallName === 'left' && gapSide === 'back') out.finalZ = pose.finalZ - gapMm;
  if (wallName === 'right' && gapSide === 'front') out.finalZ = pose.finalZ + gapMm;
  return out;
}

/**
 * Приставка L для призрака — тот же joint, что createLinkedSectionFromJoint (§6.8.3).
 */
function attachedGhostPose(room, primaryWall, cornerSide, heightMm, nicheMm) {
  const joint = resolveCornerJoint(primaryWall, cornerSide);
  if (!joint || !room) return null;
  const niche = Number(nicheMm) > 0 ? Number(nicheMm) : GHOST_NICHE_MM;
  const h = Number(heightMm) > 0 ? Number(heightMm) : room.height;
  const attachedIsLR = joint.attached === 'left' || joint.attached === 'right';
  const wallLen = wallAlongMm(room, joint.attached);
  const along = Math.max(1, wallLen - niche);
  const offsetsCm = { left: 0, right: 0, front: 0, back: 0, bottom: 0, top: 0 };
  offsetsCm[joint.attachedTrimSide] = niche / 10;
  const piv = sectionPivotFromSpanOffsets(
    {
      wallName: joint.attached,
      spanAlongA: 0,
      spanAlongB: wallLen,
    },
    room,
    offsetsCm,
    along,
    0,
    0
  );
  if (!piv) return null;
  return {
    wallName: joint.attached,
    width: attachedIsLR ? niche : along,
    height: h,
    depth: attachedIsLR ? along : niche,
    finalX: piv.finalX,
    finalY: piv.finalY,
    finalZ: piv.finalZ,
  };
}

/** Основная + приставка для углового призрака (с зазором 5 см у угла). */
function ghostUnitsForLayout(room, wallName, layoutKey, primaryPose) {
  if (!primaryPose) {
    return [{ wallName, pose: primaryPose }];
  }

  const nicheMm = primaryNicheMm(wallName, primaryPose);
  const gap = GHOST_CORNER_GAP_MM;

  if (isUShapeLayoutKey(layoutKey)) {
    const jL = resolveCornerJoint(wallName, 'left');
    const jR = resolveCornerJoint(wallName, 'right');
    let pose = { ...primaryPose };
    if (jL) pose = applyPrimaryCornerGap(wallName, pose, jL.primaryGapSide, gap);
    if (jR) pose = applyPrimaryCornerGap(wallName, pose, jR.primaryGapSide, gap);
    const units = [{ wallName, pose }];
    const left = attachedGhostPose(room, wallName, 'left', primaryPose.height, nicheMm);
    const right = attachedGhostPose(room, wallName, 'right', primaryPose.height, nicheMm);
    if (left) units.push({ wallName: left.wallName, pose: left });
    if (right) units.push({ wallName: right.wallName, pose: right });
    return units;
  }

  const side = cornerLayoutSide(layoutKey);
  if (!side) {
    return [{ wallName, pose: primaryPose }];
  }

  const joint = resolveCornerJoint(wallName, side);
  let pose = { ...primaryPose };
  if (joint) {
    pose = applyPrimaryCornerGap(wallName, pose, joint.primaryGapSide, gap);
  }

  const units = [{ wallName, pose }];
  const attached = attachedGhostPose(
    room,
    wallName,
    side,
    primaryPose.height,
    nicheMm
  );
  if (attached) {
    units.push({ wallName: attached.wallName, pose: attached });
  }
  return units;
}

/** Один ступенчатый призрак: tall | low (подоконник) | tall — одна секция, не три. */
function buildWindowLowSlotGhostUnit(wallName, profile, roomH) {
  const ghostGroup = new THREE.Group();
  ghostGroup.name = 'SectionGhostUnit';
  ghostGroup.userData.isGhost = true;
  ghostGroup.userData.wallName = wallName;
  ghostGroup.userData.windowLowSlotGhost = true;

  const spanA = Number(profile.alongA);
  const spanB = Number(profile.alongB);
  const notchA = Number(profile.notchAlongA);
  const notchB = Number(profile.notchAlongB);
  const sillMm = Number(profile.sillMm) || 0;
  const fullH = Number(roomH) || 2500;
  const lengthMm = spanB - spanA;
  if (!(lengthMm > 1) || !(notchB > notchA) || !(sillMm > 0)) {
    return buildSectionGhostUnit(lengthMm, fullH, GHOST_NICHE_MM, wallName);
  }

  const depth = GHOST_NICHE_MM;
  const bands = [
    { u0: 0, u1: notchA - spanA, h: fullH },
    { u0: notchA - spanA, u1: notchB - spanA, h: sillMm },
    { u0: notchB - spanA, u1: lengthMm, h: fullH },
  ];

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xff0000,
    linewidth: 5,
    transparent: false,
    opacity: 1.0,
  });
  const fillMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
  });

  for (const band of bands) {
    const w = band.u1 - band.u0;
    if (w < 5 || band.h < 5) continue;
    let geometry = new THREE.BoxGeometry(w, band.h, depth);
    if (wallName === 'right') {
      geometry.translate(-w / 2, band.h / 2, depth / 2);
      geometry.translate(0, 0, band.u0);
    } else if (wallName === 'left') {
      geometry.translate(w / 2, band.h / 2, -depth / 2);
      geometry.translate(0, 0, -band.u0);
    } else if (wallName === 'front') {
      geometry.translate(-w / 2, band.h / 2, -depth / 2);
      geometry.translate(-band.u0, 0, 0);
    } else {
      geometry.translate(w / 2, band.h / 2, depth / 2);
      geometry.translate(band.u0, 0, 0);
    }
    const wireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      lineMaterial
    );
    wireframe.userData.isGhostFrame = true;
    ghostGroup.add(wireframe);
    const fillMesh = new THREE.Mesh(geometry, fillMaterial);
    fillMesh.userData.isGhostFill = true;
    ghostGroup.add(fillMesh);
  }
  return ghostGroup;
}

function applySelectedSpanToGhost() {
  if (!state.room || !state.pendingSectionData) return;
  const wallName = state.sectionPlacementWall;
  const profile = state.sectionPlacementHeightProfile;
  const layoutKeyEarly = currentPlacementLayoutKey();
  const useWindowLowSlot =
    profile &&
    !isCornerLayoutKey(layoutKeyEarly) &&
    !isUShapeLayoutKey(layoutKeyEarly) &&
    (state.sectionPlacementPlaceProfile ||
      (state.sectionPlacementPlaceAll && profile.sourceSpanIds?.length >= 2));

  if (useWindowLowSlot) {
    const roomWorldPos = new THREE.Vector3();
    state.room.group.getWorldPosition(roomWorldPos);
    const showFrame = shouldShowSectionGhostFrame();
    const roomH =
      Number(state.pendingSectionData.height) || Number(state.room.height) || 2500;
    const fullPose = spanToSectionPose(state.room, wallName, profile, roomH);
    if (!fullPose || !(fullPose.alongSize > 1)) {
      if (state.sectionGhost) state.sectionGhost.visible = false;
      return;
    }
    const sig = [
      'window-low-slot',
      profile.id,
      profile.notchAlongA,
      profile.notchAlongB,
      profile.sillMm,
      roomH,
      `${fullPose.finalX},${fullPose.finalY},${fullPose.finalZ}`,
    ].join('|');
    const root = ensureSectionGhostRoot();
    const needRebuild =
      root.userData.__cldGhostSig !== sig ||
      root.userData.wallName !== wallName ||
      root.children.length !== 1;
    if (needRebuild) {
      clearSectionGhostChildren(root);
      const unit = buildWindowLowSlotGhostUnit(wallName, profile, roomH);
      unit.position.set(
        roomWorldPos.x + fullPose.finalX,
        roomWorldPos.y + fullPose.finalY,
        roomWorldPos.z + fullPose.finalZ
      );
      root.add(unit);
      root.userData.__cldGhostSig = sig;
      root.userData.wallName = wallName;
    } else {
      const unit = root.children[0];
      if (unit) {
        unit.position.set(
          roomWorldPos.x + fullPose.finalX,
          roomWorldPos.y + fullPose.finalY,
          roomWorldPos.z + fullPose.finalZ
        );
      }
    }
    state.pendingSectionData.width = fullPose.width;
    state.pendingSectionData.height = fullPose.height;
    state.pendingSectionData.depth = fullPose.depth;
    state.pendingSectionData.span = {
      id: profile.id,
      kind: 'window-low-slot',
      alongA: profile.alongA,
      alongB: profile.alongB,
      lengthMm: profile.lengthMm,
    };
    root.visible = true;
    state.sectionGhostWall = wallName;
    state.sectionGhostPosition = root.children[0]
      ? root.children[0].position.clone()
      : new THREE.Vector3(
          roomWorldPos.x + fullPose.finalX,
          roomWorldPos.y + fullPose.finalY,
          roomWorldPos.z + fullPose.finalZ
        );
    root.updateMatrixWorld(true);
    setSectionGhostFrameVisible(showFrame);
    if (showFrame && root.children[0]) {
      addCabinetMarkers(
        'ghost',
        root.children[0],
        fullPose.width,
        fullPose.height,
        fullPose.depth,
        wallName
      );
    } else {
      removeCabinetMarkers('ghost');
    }
    return;
  }

  const spans = selectedSpansList();
  if (!wallName || !spans.length) {
    if (state.sectionGhost) state.sectionGhost.visible = false;
    return;
  }

  const roomWorldPos = new THREE.Vector3();
  state.room.group.getWorldPosition(roomWorldPos);
  const showFrame = shouldShowSectionGhostFrame();
  const layoutKey = currentPlacementLayoutKey();
  const spansRaw = state.sectionPlacementSpans || [];

  const poses = spans.map((span) => ({
    span,
    pose: spanToSectionPose(state.room, wallName, span, state.pendingSectionData.height),
  }));

  const allUnits = [];
  poses.forEach(({ span, pose }) => {
    let key = layoutKey;
    if (isCornerLayoutKey(layoutKey) && state.sectionPlacementPlaceAll) {
      const side = spanDoorSide(span, spansRaw);
      if (side) key = cornerLayoutKeyForSide(side);
    }
    if (isCornerLayoutKey(key) || isUShapeLayoutKey(key)) {
      allUnits.push(...ghostUnitsForLayout(state.room, wallName, key, pose));
    } else {
      allUnits.push({ wallName, pose });
    }
  });

  const sig = [
    layoutKey || 'straight',
    !!state.sectionPlacementPlaceAll,
    ...allUnits.map(
      ({ wallName: wn, pose: p }) =>
        `${wn}:${p.width}x${p.height}x${p.depth}@${p.finalX},${p.finalY},${p.finalZ}`
    ),
  ].join('|');

  const root = ensureSectionGhostRoot();
  const needRebuild =
    root.userData.__cldGhostSig !== sig ||
    root.userData.wallName !== wallName ||
    root.children.length !== allUnits.length;

  if (needRebuild) {
    clearSectionGhostChildren(root);
    allUnits.forEach(({ wallName: wn, pose }) => {
      const unit = buildSectionGhostUnit(pose.width, pose.height, pose.depth, wn);
      unit.position.set(
        roomWorldPos.x + pose.finalX,
        roomWorldPos.y + pose.finalY,
        roomWorldPos.z + pose.finalZ
      );
      root.add(unit);
    });
    root.userData.__cldGhostSig = sig;
    root.userData.wallName = wallName;
  } else {
    allUnits.forEach(({ pose }, i) => {
      const unit = root.children[i];
      if (!unit) return;
      unit.position.set(
        roomWorldPos.x + pose.finalX,
        roomWorldPos.y + pose.finalY,
        roomWorldPos.z + pose.finalZ
      );
    });
  }

  const first = poses[0];
  state.pendingSectionData.width = first.pose.width;
  state.pendingSectionData.height = first.pose.height;
  state.pendingSectionData.depth = first.pose.depth;
  state.pendingSectionData.span = {
    id: first.span.id,
    alongA: first.span.alongA,
    alongB: first.span.alongB,
    lengthMm: first.span.lengthMm,
    kind: first.span.kind || undefined,
    maxHeightMm: first.span.maxHeightMm,
    sillMm: first.span.sillMm,
  };

  root.visible = true;
  state.sectionGhostWall = wallName;
  state.sectionGhostPosition = root.children[0]
    ? root.children[0].position.clone()
    : new THREE.Vector3(
        roomWorldPos.x + first.pose.finalX,
        roomWorldPos.y + first.pose.finalY,
        roomWorldPos.z + first.pose.finalZ
      );
  root.updateMatrixWorld(true);

  setSectionGhostFrameVisible(showFrame);
  if (showFrame && root.children[0] && allUnits[0]) {
    addCabinetMarkers(
      'ghost',
      root.children[0],
      allUnits[0].pose.width,
      allUnits[0].pose.height,
      allUnits[0].pose.depth,
      allUnits[0].wallName
    );
  } else {
    removeCabinetMarkers('ghost');
  }

  const side = cornerLayoutSide(layoutKey);
  if (side) {
    const joint = resolveCornerJoint(wallName, side);
    const D = GHOST_NICHE_MM;
    const H = Number(first.pose.height) || Number(state.room.height) || 2400;
    showTempLCornerGhostForJoint(joint, { alongP: D * 2, depthMm: D, heightMm: H });
  } else if (!isUShapeLayoutKey(layoutKey)) {
    hideTempLCornerGhost();
  }
}

function keepSpanChooserAlive() {
  // П-образная: без chooser — не поднимать подсказку при уходе курсора со стены.
  if (isUShapeLayoutKey(currentPlacementLayoutKey())) return false;
  const spans = state.sectionPlacementSpans || [];
  const free = spans.filter((s) => s && s.placeable);
  const hasProfile = !!(
    state.sectionPlacementHeightProfile &&
    state.sectionPlacementHeightProfile.placeable
  );
  return (free.length > 1 || hasProfile) && !!state.sectionPlacementWall;
}

/**
 * Update section ghost position based on mouse movement
 */
export function updateSectionGhostPosition(event) {
  if (!state.sectionGhost || !state.room || !state.pendingSectionData) {
    return;
  }

  updateMousePosition(event);
  state.raycaster.setFromCamera(state.mouse, state.camera);

  if (!state.room || !state.room.wallPlanes) return;

  const visiblePlanes = state.room.wallPlanes.filter((p) => {
    if (p.visible === false) return false;
    const wallName = p.userData.wallName;
    if (state.room.walls && state.room.walls[wallName]) {
      return state.room.walls[wallName].visible !== false;
    }
    return true;
  });

  const intersects = state.raycaster.intersectObjects(visiblePlanes, false);

  let intersect = null;
  if (intersects.length > 0) {
    let bestDist = Infinity;
    for (let i = 0; i < intersects.length; i++) {
      const it = intersects[i];
      if (!it || !Number.isFinite(it.distance)) continue;
      if (it.distance < bestDist) {
        bestDist = it.distance;
        intersect = it;
      }
    }
  }

  if (!intersect) {
    // Курсор ушёл со стены (в т.ч. на подсказку) — не сбрасываем выбор пролётов.
    if (keepSpanChooserAlive()) {
      if (state.sectionGhost && state.sectionGhostPosition) {
        state.sectionGhost.visible = true;
      }
      refreshChooser(state.sectionPlacementSpans || []);
      return;
    }
    state.sectionGhost.visible = false;
    state.sectionGhostWall = null;
    state.sectionGhostPosition = null;
    removeCabinetMarkers('ghost');
    state.sectionGhostDivision = null;
    hideSectionSpanChooser();
    if (state.room.resetWallHighlight) state.room.resetWallHighlight();
    return;
  }

  const wallName = intersect.object.userData.wallName;
  if (!wallName || !state.room.walls || !state.room.walls[wallName]) {
    if (keepSpanChooserAlive()) {
      if (state.sectionGhost && state.sectionGhostPosition) {
        state.sectionGhost.visible = true;
      }
      refreshChooser(state.sectionPlacementSpans || []);
      return;
    }
    state.sectionGhost.visible = false;
    state.sectionGhostWall = null;
    state.sectionGhostPosition = null;
    removeCabinetMarkers('ghost');
    state.sectionGhostDivision = null;
    hideSectionSpanChooser();
    if (state.room.resetWallHighlight) state.room.resetWallHighlight();
    return;
  }

  if (state.room.highlightWall) state.room.highlightWall(wallName);

  const roomWorldPos = new THREE.Vector3();
  state.room.group.getWorldPosition(roomWorldPos);
  const localPos = intersect.point.clone().sub(roomWorldPos);
  const along = alongFromRoomLocal(wallName, localPos);

  const spansRaw = computeWallSolidSpans(state.room, wallName, openingsList(), {
    minPlaceMm: getMinPlaceMmFromRoomConfig(),
  });
  const constrained = applyPlacementConstraintsToSpans(spansRaw, {
    wallName,
    sections: state.customSections || [],
    room: state.room,
  });
  const spans = constrained.spans;
  state.sectionPlacementAllowBoth = constrained.allowBoth !== false;

  const layoutKey = currentPlacementLayoutKey();
  const isCorner = isCornerLayoutKey(layoutKey);
  const isU = isUShapeLayoutKey(layoutKey);
  const isStraight = !isCorner && !isU;

  if (isStraight) {
    state.sectionPlacementHeightProfile = findWallWindowHeightProfile(
      state.room,
      wallName,
      spans,
      openingsList(),
      { minPlaceMm: getMinPlaceMmFromRoomConfig() }
    );
  } else {
    state.sectionPlacementHeightProfile = null;
    state.sectionPlacementPlaceProfile = false;
  }

  const prevWall = state.sectionPlacementWall;
  if (prevWall && prevWall !== wallName) {
    state.sectionPlacementSelectionLocked = false;
    state.sectionPlacementPlaceAll = false;
    state.sectionPlacementPlaceProfile = false;
    state.sectionPlacementSelectedIds = [];
  }
  state.sectionPlacementSpans = spans;
  state.sectionPlacementWall = wallName;

  const placeable = spans.filter((s) => s.placeable);
  if (!placeable.length) {
    state.sectionPlacementPlaceBridge = false;
    state.sectionGhost.visible = false;
    state.sectionGhostWall = wallName;
    state.sectionGhostPosition = null;
    removeCabinetMarkers('ghost');
    if (!isU) refreshChooser(spans, state.sectionPlacementAllowBoth);
    else hideSectionSpanChooser();
    return;
  }

  // П: все свободные пролёты, без моста.
  if (isU) {
    hideSectionSpanChooser();
    state.sectionPlacementSelectionLocked = true;
    state.sectionPlacementPlaceAll = placeable.length > 1;
    state.sectionPlacementPlaceBridge = false;
    state.sectionPlacementSelectedIds = placeable.map((s) => s.id);
    applySelectedSpanToGhost();
    return;
  }

  // Один свободный пролёт и нет bridge — без chooser.
  if (placeable.length === 1 || spansRaw.length === 1) {
    state.sectionPlacementPlaceAll = false;
    state.sectionPlacementPlaceBridge = false;
    state.sectionPlacementSelectionLocked = false;
    state.sectionPlacementSelectedIds = [placeable[0].id];
    hideSectionSpanChooser();
  } else {
    if (!state.sectionPlacementSelectionLocked) {
      const hit = pickSpanAtAlong(placeable, along);
      state.sectionPlacementPlaceAll = false;
      state.sectionPlacementPlaceBridge = false;
      state.sectionPlacementSelectedIds = hit ? [hit.id] : [placeable[0].id];
    } else if (state.sectionPlacementPlaceAll) {
      state.sectionPlacementSelectedIds = placeable.map((s) => s.id);
    } else {
      const cur = state.sectionPlacementSelectedIds || [];
      const stillOk = cur.length === 1 && placeable.some((s) => s.id === cur[0]);
      if (!stillOk) {
        state.sectionPlacementSelectionLocked = false;
        const hit = pickSpanAtAlong(placeable, along);
        state.sectionPlacementSelectedIds = hit ? [hit.id] : [placeable[0].id];
      }
    }
    refreshChooser(spans, state.sectionPlacementAllowBoth);
  }

  // Угол у двери: пролёт сам выбирает левый/правый тип — каталог + pending + призрак.
  if (isCorner && !state.sectionPlacementPlaceAll && !state.sectionPlacementPlaceProfile) {
    const selId = (state.sectionPlacementSelectedIds || [])[0];
    const selSpan = spans.find((s) => s && s.id === selId) || placeable[0];
    const side = spanDoorSide(selSpan, spansRaw);
    if (side) applyCornerLayoutForDoorSide(side);
  } else if (isCorner && layoutKey) {
    highlightRoomLayoutCard(layoutKey);
  }

  applySelectedSpanToGhost();
}
