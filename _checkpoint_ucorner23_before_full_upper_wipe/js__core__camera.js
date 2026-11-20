// Camera control module
// Handles camera rotation, panning, zooming

import { state } from '../utils/state.js';
import { updateMousePosition } from '../events/mouse-handler.js';
import { updateSectionGhostPosition } from '../sections/section-ghost.js?v=20261013-no-ward-gap';
import { updateFurnitureGhostPosition } from '../furniture/furniture-ghost.js?v=20261107-ucorner23';
import {
  dragFurnitureAlongWall,
  placePendingFurniture,
  cancelFurniturePlacement,
  applyEndCabinetReleaseAction,
  tryBeginFurnitureDragFromCanvas,
  finishFurnitureDragFromCanvas,
  updateFurnitureHoverHighlight,
  clearAllFurnitureHighlights,
} from '../furniture/furniture-manager.js?v=20261107-ucorner23';
import { isPendingEndCabinetModule } from '../sections/section-end-cabinet.js?v=20260917-endcab-nobridge';
import { updateRoomDimensionLabels } from '../ui/scene-icons.js?v=20261027-nmu142q';
import { getWallAxes } from '../utils/wall-coords.js';

// Минимум до точки под курсором / pivot (мм); near clip — dynamic (syncCameraNearClip).
const DEFAULT_ZOOM_MIN_DISTANCE_MM = 0.5;
const DEFAULT_ZOOM_MAX_DISTANCE_MM = 30000; // safety cap
const DEFAULT_ZOOM_EXP_FACTOR = 0.0012;     // lower = smoother wheel response
const ZOOM_TARGET_PULL = 0.88; // target тянется к hit — orbit остаётся на шкафе

/**
 * Live IKEA OrbitPlannerCamera.drag_input (2026-09-04 measure):
 *   pitch += -delta_y * 2ПЂ;  yaw += delta_x * 2ПЂ * aspect
 * where delta_x = dx/width, delta_y = dy/height в†’ rad/px = 2ПЂ / clientHeight.
 * Babylon Camera.inertia 0.9 is unused by orbit (no release coast).
 * During LMB: snap to desired (pointer follow).
 *
 * Pitch limits (ikea-v1631 OrbitPlannerCamera):
 *   MAX_PITCH = ПЂ/2 в€’ 0.01 в†’ phi в€€ [0.01, ПЂв€’0.01] in Three spherical (Y-up).
 *   ground: camera.y в‰Ґ max(0.1, 2Г—nearPlane) m в†’ 200 mm; clamp phi via acos.
 */
const IKEA_ORBIT_RAD_PER_TURN = Math.PI * 2;
/** Dump: MAX_PITCH = Math.PI/2 - 0.01 */
const IKEA_MAX_PITCH = Math.PI / 2 - 0.01;
const IKEA_PHI_MIN = Math.PI / 2 - IKEA_MAX_PITCH; // в‰€ 0.01
const IKEA_PHI_MAX = Math.PI / 2 + IKEA_MAX_PITCH; // в‰€ ПЂ в€’ 0.01
/**
 * Dump: get_ground_collision_radius = max(0.1, 2 * ALLOWED_PLANE.near), near=0.1 в†’ 0.2 m.
 * Наша сцена в мм.
 */
const IKEA_GROUND_COLLISION_RADIUS_MM = 200;

const _zoomWheelForward = new THREE.Vector3();
const _zoomWheelDirToHit = new THREE.Vector3();
const _orbitOffset = new THREE.Vector3();
const _orbitSpherical = new THREE.Spherical();

/** После ручного orbit/pan/zoom автокадр не трогает камеру (домик / пресеты вида — с force). */
function markUserCameraTouched() {
  if (typeof window === 'undefined') return;
  window.__cldUserCameraTouched = true;
}

function clearUserCameraTouched() {
  if (typeof window === 'undefined') return;
  window.__cldUserCameraTouched = false;
}

function shouldSkipAutoCameraFrame(options = {}) {
  if (options?.force === true) return false;
  if (typeof window === 'undefined') return false;
  if (window.__cldSuppressAutoCameraFrame === true) return true;
  return window.__cldUserCameraTouched === true;
}

function getRoomFloorWorldYMm() {
  try {
    if (state.room?.group) {
      const p = new THREE.Vector3();
      state.room.group.getWorldPosition(p);
      return p.y;
    }
  } catch (_) {}
  return 0;
}

/**
 * IKEA: camera = pivot в€’ offsetГ—forward; pitch в‰¤ asin((pivot.yв€’r)/offset).
 * Three spherical: eye.y = target.y + radiusГ—cos(phi) в‰Ґ floor + r в†’ phi в‰¤ acos(...).
 */
function clampOrbitPhiIkea(phi, radiusMm, targetYMm) {
  let phiMin = IKEA_PHI_MIN;
  let phiMax = IKEA_PHI_MAX;
  const g = getRoomFloorWorldYMm() + IKEA_GROUND_COLLISION_RADIUS_MM;
  const r = Math.max(1e-6, Number(radiusMm) || 0);
  const cosLim = THREE.MathUtils.clamp((g - targetYMm) / r, -1, 1);
  const phiGroundMax = Math.acos(cosLim);
  if (Number.isFinite(phiGroundMax)) {
    phiMax = Math.min(phiMax, phiGroundMax);
  }
  if (phiMax < phiMin) phiMax = phiMin;
  return Math.max(phiMin, Math.min(phiMax, phi));
}

/** Re-apply IKEA phi clamp to positionDesired (after pan / zoom). */
function clampOrbitEyeAboveGround() {
  const rig = state.cameraRig;
  if (!rig?.positionDesired || !rig?.targetDesired) return;
  _orbitOffset.subVectors(rig.positionDesired, rig.targetDesired);
  const radius = _orbitOffset.length();
  if (radius < 1e-6) return;
  _orbitSpherical.setFromVector3(_orbitOffset);
  const phi = clampOrbitPhiIkea(_orbitSpherical.phi, radius, rig.targetDesired.y);
  if (Math.abs(phi - _orbitSpherical.phi) < 1e-8) return;
  _orbitSpherical.phi = phi;
  _orbitOffset.setFromSpherical(_orbitSpherical);
  rig.positionDesired.copy(rig.targetDesired).add(_orbitOffset);
}

/** @returns {number} radians per pixel (IKEA dump) */
function getIkeaOrbitRadPerPx() {
  const h = state.renderer?.domElement?.clientHeight;
  if (Number.isFinite(h) && h > 1) return IKEA_ORBIT_RAD_PER_TURN / h;
  return IKEA_ORBIT_RAD_PER_TURN / 900;
}

/** Room clip planes (mm). Near scales with dist to target — stable depth at ~4 m, close-up ok. */
export const CAMERA_NEAR_MIN_MM = 0.5;
export const CAMERA_NEAR_MAX_MM = 10;
export const CAMERA_FAR_MM = 22000;
/** At 4000 mm в†’ near 10; at 200 mm в†’ near 0.5. */
const CAMERA_NEAR_DIST_SCALE = 0.0025;

/**
 * Dynamic near: far view в‰€10 mm (127b stable); zoom in в†’ down to 0.5 mm (no static 44k:1 ratio).
 * @returns {number|null} applied near (mm)
 */
export function syncCameraNearClip(distanceMm) {
  const cam = state.camera;
  if (!cam || !Number.isFinite(distanceMm) || distanceMm <= 0) return null;
  const near = Math.min(
    CAMERA_NEAR_MAX_MM,
    Math.max(CAMERA_NEAR_MIN_MM, distanceMm * CAMERA_NEAR_DIST_SCALE)
  );
  if (Math.abs(cam.near - near) > 1e-4) {
    cam.near = near;
    cam.updateProjectionMatrix();
  }
  return near;
}

export function getCameraNearClipAudit() {
  const cam = state.camera;
  const target = state.cameraRig?.target ?? state.cameraRig?.targetDesired;
  const dist = cam && target ? cam.position.distanceTo(target) : null;
  return {
    nearMm: cam?.near ?? null,
    farMm: cam?.far ?? null,
    distToTargetMm: dist,
    nearMinMm: CAMERA_NEAR_MIN_MM,
    nearMaxMm: CAMERA_NEAR_MAX_MM,
    nearDistScale: CAMERA_NEAR_DIST_SCALE,
  };
}

function ensureCameraRig() {
  if (!state.cameraRig) {
    const t = state.initialCameraTarget
      ? state.initialCameraTarget.clone()
      : new THREE.Vector3(0, (state.room?.height || 2500) / 2, 0);
    state.cameraRig = {
      target: t.clone(),
      targetDesired: t.clone(),
      positionDesired: state.camera?.position ? state.camera.position.clone() : new THREE.Vector3(0, 900, 3600),
      damping: 0.12,
      zoomMinDistanceMm: DEFAULT_ZOOM_MIN_DISTANCE_MM,
      zoomMaxDistanceMm: DEFAULT_ZOOM_MAX_DISTANCE_MM,
      zoomExpFactor: DEFAULT_ZOOM_EXP_FACTOR,
    };
  }
  if (!state.cameraRig.target) state.cameraRig.target = state.cameraRig.targetDesired.clone();
  if (!state.cameraRig.targetDesired) state.cameraRig.targetDesired = state.cameraRig.target.clone();
  if (!state.cameraRig.positionDesired && state.camera) state.cameraRig.positionDesired = state.camera.position.clone();
  if (!Number.isFinite(state.cameraRig.zoomMinDistanceMm)) {
    state.cameraRig.zoomMinDistanceMm = DEFAULT_ZOOM_MIN_DISTANCE_MM;
  } else if (state.cameraRig.zoomMinDistanceMm > DEFAULT_ZOOM_MIN_DISTANCE_MM) {
    state.cameraRig.zoomMinDistanceMm = DEFAULT_ZOOM_MIN_DISTANCE_MM;
  }
  if (!Number.isFinite(state.cameraRig.zoomMaxDistanceMm)) state.cameraRig.zoomMaxDistanceMm = DEFAULT_ZOOM_MAX_DISTANCE_MM;
  if (!Number.isFinite(state.cameraRig.zoomExpFactor)) state.cameraRig.zoomExpFactor = DEFAULT_ZOOM_EXP_FACTOR;
  return state.cameraRig;
}

/** Snap eye to desired — used while LMB/RMB drag (IKEA has no lag behind pointer). */
function snapCameraRigToDesired() {
  const rig = state.cameraRig;
  const cam = state.camera;
  if (!rig || !cam || !rig.positionDesired || !rig.targetDesired) return;
  rig.target.copy(rig.targetDesired);
  cam.position.copy(rig.positionDesired);
  // Up только от пресета сцены. isRoomEditTopView2d() сюда нельзя:
  // иначе «Сбоку/Прямо» получают up плана (0,0,−1) и вид «не ставится».
  cam.up.copy(getSceneViewPreset() === 'top' ? _camUpTop : _camUpY);
  cam.lookAt(rig.target);
  cam.updateMatrixWorld(true);
  if (!cam.isOrthographicCamera) {
    syncCameraNearClip(cam.position.distanceTo(rig.target));
  }
}

const _camUpY = new THREE.Vector3(0, 1, 0);
const _camUpTop = new THREE.Vector3(0, 0, -1);

function applyOrbitSphericalDelta(dTheta, dPhi) {
  const rig = ensureCameraRig();
  _orbitOffset.subVectors(rig.positionDesired, rig.targetDesired);
  _orbitSpherical.setFromVector3(_orbitOffset);
  _orbitSpherical.theta += dTheta;
  _orbitSpherical.phi += dPhi;
  const radius = Math.max(1e-6, _orbitSpherical.radius || _orbitOffset.length());
  _orbitSpherical.radius = radius;
  _orbitSpherical.phi = clampOrbitPhiIkea(_orbitSpherical.phi, radius, rig.targetDesired.y);
  _orbitOffset.setFromSpherical(_orbitSpherical);
  rig.positionDesired.copy(rig.targetDesired).add(_orbitOffset);
}

const _orbitPending = { dx: 0, dy: 0, panDx: 0, panDy: 0 };

/**
 * Per-frame: apply coalesced pointer deltas while rotating/panning; else zoom damp.
 */
export function updateCameraRigFrame(dt) {
  const rig = state.cameraRig;
  let cam = state.camera;
  if (!rig?.targetDesired || !rig?.positionDesired || !cam) return;

  // Плоские 2D-виды: без орбиты/lerp, только ortho + pan/zoom.
  if (isLockedOrthoView()) {
    cancelIkeaEmptyCameraIntro();
    if (!cam.isOrthographicCamera) {
      cam = ensureOrthoCamera();
      const m = getSceneViewPreset();
      if (m === 'front' || m === 'side') syncElevationOrthoFrustum(m, getFlatViewFocusBox());
      else syncRoomEditPlanFrustum();
    }
    setOrbitControlsEnabled(false);
    if (state.isPanning && (_orbitPending.panDx !== 0 || _orbitPending.panDy !== 0)) {
      const span = cam.isOrthographicCamera
        ? Math.max(1, (cam.top - cam.bottom) / Math.max(0.01, cam.zoom || 1))
        : cam.position.distanceTo(rig.targetDesired);
      const speed = cam.isOrthographicCamera ? span * 0.0018 : 0.02 * (span / 5);
      const forward = new THREE.Vector3();
      cam.getWorldDirection(forward);
      const right = new THREE.Vector3().crossVectors(forward, cam.up).normalize();
      const up = cam.up.clone().normalize();
      const pan = new THREE.Vector3()
        .addScaledVector(right, -_orbitPending.panDx * speed)
        .addScaledVector(up, _orbitPending.panDy * speed);
      rig.positionDesired.add(pan);
      rig.targetDesired.add(pan);
      _orbitPending.panDx = 0;
      _orbitPending.panDy = 0;
    }
    state.isRotating = false;
    _orbitPending.dx = 0;
    _orbitPending.dy = 0;
    snapCameraRigToDesired();
    return;
  }

  if (state.isRotating) {
    cancelIkeaEmptyCameraIntro();
    if (_orbitPending.dx !== 0 || _orbitPending.dy !== 0) {
      const radPerPx = getIkeaOrbitRadPerPx();
      applyOrbitSphericalDelta(-_orbitPending.dx * radPerPx, _orbitPending.dy * radPerPx);
      _orbitPending.dx = 0;
      _orbitPending.dy = 0;
    }
    snapCameraRigToDesired();
    return;
  }

  if (state.isPanning) {
    cancelIkeaEmptyCameraIntro();
    if (_orbitPending.panDx !== 0 || _orbitPending.panDy !== 0) {
      const distance = cam.position.distanceTo(rig.targetDesired);
      const speed = 0.02 * (distance / 5);
      const forward = new THREE.Vector3();
      cam.getWorldDirection(forward);
      const right = new THREE.Vector3().crossVectors(forward, cam.up).normalize();
      const up = cam.up.clone().normalize();
      const pan = new THREE.Vector3()
        .addScaledVector(right, -_orbitPending.panDx * speed)
        .addScaledVector(up, _orbitPending.panDy * speed);
      rig.positionDesired.add(pan);
      rig.targetDesired.add(pan);
      _orbitPending.panDx = 0;
      _orbitPending.panDy = 0;
      clampOrbitEyeAboveGround();
    }
    snapCameraRigToDesired();
    return;
  }

  // Intro: дальше → ближе (IKEA empty). Cap dt — иначе 1-й кадр после load α=1.
  if (rig.introActive) {
    const dtIntro = Math.min(Math.max(0.001, dt), IKEA_INTRO_DT_CAP);
    const a = Math.min(1, dtIntro * IKEA_INTRO_LERP_SPEED);
    cam.position.lerp(rig.positionDesired, a);
    rig.target.lerp(rig.targetDesired, a);
    cam.lookAt(rig.target);
    syncCameraNearClip(cam.position.distanceTo(rig.target));
    const distLeft = cam.position.distanceTo(rig.positionDesired);
    if (distLeft <= IKEA_INTRO_EPS_MM) {
      snapCameraRigToDesired();
      cancelIkeaEmptyCameraIntro();
    }
    return;
  }

  const damp = Number.isFinite(rig.damping) ? rig.damping : 0.12;
  const alpha = 1 - Math.pow(1 - Math.min(Math.max(damp, 0), 0.99), Math.max(0.001, dt * 60));
  rig.target.lerp(rig.targetDesired, alpha);
  cam.position.lerp(rig.positionDesired, alpha);
  cam.lookAt(rig.target);
  syncCameraNearClip(cam.position.distanceTo(rig.target));
}

export function cancelIkeaEmptyCameraIntro() {
  const rig = state.cameraRig;
  if (rig) rig.introActive = false;
}

export function setupCameraControls() {
  const renderer = state.renderer;
  if (!renderer || !renderer.domElement) {
    console.warn('⚠️ setupCameraControls: renderer.domElement ещё не готов, обработчики камеры не привязаны.');
    return;
  }
  
  // Mouse wheel zoom (scaled for millimeters: zoomSpeed increased 1000x)
  renderer.domElement.addEventListener('wheel', onMouseWheel);
  
  // Prevent context menu on right click (to allow panning)
  renderer.domElement.addEventListener('contextmenu', event => {
    event.preventDefault();
  });

  // Mouse down handlers (на canvas/renderer.domElement)
  console.log('[DEBUG] Camera: mousedown/mousemove/mouseup on', renderer.domElement?.tagName || 'canvas');
  renderer.domElement.addEventListener('mousedown', onMouseDown);
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('mouseup', onMouseUp);
  renderer.domElement.addEventListener('mouseleave', onMouseLeave);
}

function getClosestVisibleWallHit(event) {
  if (!state.room || !state.room.wallPlanes) return null;

  updateMousePosition(event);
  state.raycaster.setFromCamera(state.mouse, state.camera);

  const visiblePlanes = state.room.wallPlanes.filter((p) => {
    if (!p || p.visible === false) return false;
    const wn = p.userData && p.userData.wallName;
    if (wn && state.room.walls && state.room.walls[wn]) {
      return state.room.walls[wn].visible !== false;
    }
    return true;
  });

  const intersects = state.raycaster.intersectObjects(visiblePlanes, false);
  if (!intersects || intersects.length === 0) return null;

  let best = null;
  let bestDist = Infinity;
  for (let i = 0; i < intersects.length; i++) {
    const it = intersects[i];
    if (!it || !Number.isFinite(it.distance)) continue;
    if (it.distance < bestDist) {
      bestDist = it.distance;
      best = it;
    }
  }
  if (!best) return null;

  const wallName = best.object && best.object.userData ? best.object.userData.wallName : null;
  if (!wallName) return null;

  return { wallName, point: best.point };
}

function meshEligibleForZoomRaycast(mesh) {
  if (!mesh?.isMesh || mesh.visible === false) return false;
  const ud = mesh.userData || {};
  if (ud.isGhost || ud.isSectionGhost || ud.isFurnitureGhost) return false;
  if (ud.isShelfProp || ud.isRodCompanion) return false;
  if (/ghost|placeholder/i.test(String(mesh.name || '')) && !ud.isFurniture) return false;
  return true;
}

/** Raycast под курсором — шкаф / стены / пол (не pivot в центре комнаты). */
function getZoomRaycastMeshes() {
  const out = [];
  const scene = state.scene;
  if (!scene) return out;
  scene.traverse((o) => {
    if (meshEligibleForZoomRaycast(o)) out.push(o);
  });
  const room = state.room;
  if (room?.wallPlanes) {
    room.wallPlanes.forEach((p) => {
      if (p?.visible !== false) out.push(p);
    });
  }
  if (room?.floorCoating?.visible !== false && room.floorCoating) {
    out.push(room.floorCoating);
  }
  return out;
}

function isRoomEditTopView2d() {
  // Сценические «Прямо/Сбоку/3D» важнее флага room-edit 2D:
  // иначе frustum/up плана ломают elevation после действий с НМ.
  const scene = getSceneViewPreset();
  if (scene === 'front' || scene === 'side' || scene === '3d') return false;
  return !!(window.__cldRoomEditOpen && window.__cldRoomEditView !== '3d');
}

/** Сценовые орто-пресеты (кнопки вида) — без orbit, zoom как в plan 2D. */
function getSceneViewPreset() {
  return String(
    (typeof window !== 'undefined' && window.__cldSceneViewPreset) || '3d'
  )
    .trim()
    .toLowerCase();
}

function isSceneOrthoPreset() {
  const m = getSceneViewPreset();
  return m === 'top' || m === 'front' || m === 'side';
}

function isLockedOrthoView() {
  return isRoomEditTopView2d() || isSceneOrthoPreset();
}

function setCeilingVisible(visible) {
  const room = state.room;
  if (!room) return;
  if (room.walls?.ceiling) room.walls.ceiling.visible = !!visible;
  room.group?.traverse((child) => {
    if (child.userData?.isCeiling) child.visible = !!visible;
  });
}

/** Запас вокруг комнаты под наружные размеры (мм). */
const PLAN_VIEW_MARGIN_MM = 900;
const PLAN_WALL_T_MM = 100;
const ELEVATION_VIEW_MARGIN_MM = 350;

/**
 * Всегда вернуть OrthographicCamera (плоский 2D).
 * Если perspective «протекла» назад при живом backup — всё равно создаём новый ortho.
 */
function ensureOrthoCamera() {
  const cur = state.camera;
  if (cur?.isOrthographicCamera) return cur;
  if (cur?.isPerspectiveCamera) {
    state.__cldPerspCameraBackup = cur;
  }
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 100000);
  ortho.zoom = 1;
  state.camera = ortho;
  if (state.controls) {
    state.controls.object = ortho;
    state.controls.enabled = false;
  }
  return ortho;
}

function setOrbitControlsEnabled(enabled) {
  if (!state.controls) return;
  state.controls.enabled = !!enabled;
  if (enabled && state.camera) state.controls.object = state.camera;
}

/** Безопасный bbox: selectedFurniture = {group}, дети после rebuild могут быть «битыми». */
function safeBox3FromObject(obj) {
  const root =
    obj && typeof obj.updateWorldMatrix === 'function' && obj.isObject3D
      ? obj
      : obj?.group && typeof obj.group.updateWorldMatrix === 'function' && obj.group.isObject3D
        ? obj.group
        : obj?.object && typeof obj.object.updateWorldMatrix === 'function' && obj.object.isObject3D
          ? obj.object
          : null;
  if (!root) return null;
  const out = new THREE.Box3();
  let any = false;
  try {
    root.updateWorldMatrix(true, true);
  } catch (_) {
    return null;
  }
  try {
    root.traverse((o) => {
      if (!o?.isMesh || !o.geometry) return;
      if (typeof o.updateWorldMatrix !== 'function') return;
      try {
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        const gb = o.geometry.boundingBox;
        if (!gb || gb.isEmpty()) return;
        const b = gb.clone().applyMatrix4(o.matrixWorld);
        if (b.isEmpty()) return;
        if (!any) {
          out.copy(b);
          any = true;
        } else {
          out.union(b);
        }
      } catch (_) {}
    });
  } catch (_) {
    return any ? out : null;
  }
  return any && !out.isEmpty() ? out : null;
}

/** BBox мебели для плотного CAD-кадра; иначе полоса у задней стены. */
function getFlatViewFocusBox() {
  try {
    const box = new THREE.Box3();
    let found = false;
    const absorb = (obj) => {
      const b = safeBox3FromObject(obj);
      if (!b) return;
      if (!found) {
        box.copy(b);
        found = true;
      } else {
        box.union(b);
      }
    };
    if (state.selectedFurniture) absorb(state.selectedFurniture);
    state.scene?.traverse?.((o) => {
      if (o?.isGroup && o.userData?.isFurniture) absorb(o);
    });
    if (!found && state.room) {
      const r = state.room;
      const backZ = -Number(r.depth) * 0.5;
      box.min.set(-r.width * 0.35, 0, backZ);
      box.max.set(r.width * 0.35, Math.max(1200, r.height * 0.55), backZ + 900);
      found = true;
    }
    return found ? box : null;
  } catch (e) {
    console.warn('[CAMERA] getFlatViewFocusBox failed', e?.message || e);
    return null;
  }
}

/** Frustum для фронт/бок (elevation), мм — плоский CAD. */
function syncElevationOrthoFrustum(kind, focusBox = null) {
  const cam = state.camera;
  const room = state.room;
  if (!cam?.isOrthographicCamera) return;
  const margin = ELEVATION_VIEW_MARGIN_MM;
  let halfH;
  let halfAlong;
  if (focusBox && !focusBox.isEmpty()) {
    const size = focusBox.getSize(new THREE.Vector3());
    halfH = Math.max(200, size.y * 0.5 + margin);
    halfAlong =
      kind === 'side'
        ? Math.max(200, size.z * 0.5 + margin)
        : Math.max(200, size.x * 0.5 + margin);
  } else if (room) {
    halfH = room.height / 2 + margin;
    halfAlong =
      kind === 'side'
        ? room.depth / 2 + PLAN_WALL_T_MM + margin
        : room.width / 2 + PLAN_WALL_T_MM + margin;
  } else {
    halfH = 1500;
    halfAlong = 1500;
  }
  const el = state.renderer?.domElement;
  const aspect = el
    ? Math.max(0.25, el.clientWidth / Math.max(1, el.clientHeight))
    : 1.4;
  let viewH = halfH;
  let viewW = halfAlong;
  if (viewW / viewH > aspect) viewH = viewW / aspect;
  else viewW = viewH * aspect;
  cam.left = -viewW;
  cam.right = viewW;
  cam.top = viewH;
  cam.bottom = -viewH;
  cam.near = 1;
  cam.far = 100000;
  cam.updateProjectionMatrix();
}

function planHalfExtents(room) {
  const halfW = room.width / 2 + PLAN_WALL_T_MM + PLAN_VIEW_MARGIN_MM;
  const halfD = room.depth / 2 + PLAN_WALL_T_MM + PLAN_VIEW_MARGIN_MM;
  return { halfW, halfD };
}

/**
 * Ортографический план 2D: стены без перспективного «раструба» (как кантик у IKEA).
 * PerspectiveCamera сохраняем и возвращаем при выходе в 3D / закрытии редактора.
 */
function enterRoomEditPlanOrtho(room) {
  if (!state.camera || !room) return state.camera;
  const cam = ensureOrthoCamera();
  syncRoomEditPlanFrustum();
  return cam;
}

/** Восстановить PerspectiveCamera после plan/elevation ortho. */
export function exitRoomEditPlanOrtho() {
  const backup = state.__cldPerspCameraBackup;
  if (!backup) return;
  state.camera = backup;
  state.__cldPerspCameraBackup = null;
  if (state.controls) {
    state.controls.object = backup;
    state.controls.enabled = true;
  }
}

function notifySceneViewPills() {
  if (typeof window === 'undefined') return;
  try {
    window.__cldSyncSceneViewPills?.(getSceneViewPreset());
  } catch (_) {}
}

/** Пересчитать frustum орто-камеры под размер комнаты и aspect canvas. */
export function syncRoomEditPlanFrustum() {
  const cam = state.camera;
  const room = state.room;
  if (!cam || !cam.isOrthographicCamera || !room) return;
  const { halfW, halfD } = planHalfExtents(room);
  const el = state.renderer && state.renderer.domElement;
  const aspect = el
    ? Math.max(0.25, el.clientWidth / Math.max(1, el.clientHeight))
    : Math.max(0.25, Number(cam.right - cam.left) / Math.max(1e-3, cam.top - cam.bottom));
  let viewH = halfD;
  let viewW = halfW;
  if (viewW / viewH > aspect) viewH = viewW / aspect;
  else viewW = viewH * aspect;
  cam.left = -viewW;
  cam.right = viewW;
  cam.top = viewH;
  cam.bottom = -viewH;
  cam.near = 0.5;
  cam.far = 80000;
  cam.updateProjectionMatrix();
}

function onMouseWheel(event) {
  event.preventDefault();
  if (!state.camera) return;
  markUserCameraTouched();
  cancelIkeaEmptyCameraIntro();
  const rig = ensureCameraRig();

  const zoomFactor = Math.exp(event.deltaY * rig.zoomExpFactor);

  // Room-edit / сценовые орто-виды: zoom frustum (или высота для top без ortho). Без орбиты.
  if (isLockedOrthoView()) {
    if (state.camera.isOrthographicCamera) {
      let z = (Number(state.camera.zoom) || 1) / zoomFactor;
      z = Math.max(0.35, Math.min(2.8, z));
      state.camera.zoom = z;
      state.camera.updateProjectionMatrix();
      return;
    }
    const roomH = state.room && Number(state.room.height) > 0 ? state.room.height : 2500;
    const minY = Math.max(400, roomH * 0.35);
    const maxY = Math.max(minY + 200, roomH * 12);
    const tx = rig.targetDesired.x;
    const tz = rig.targetDesired.z;
    let y = Math.abs(rig.positionDesired.y - (rig.targetDesired.y || 0)) * zoomFactor;
    y = Math.max(minY, Math.min(maxY, y));
    rig.targetDesired.set(tx, 0, tz);
    rig.target.set(tx, 0, tz);
    rig.positionDesired.set(tx, y, tz);
    return;
  }
  const minDist = rig.zoomMinDistanceMm;
  const maxDist = rig.zoomMaxDistanceMm;

  updateMousePosition(event);
  state.raycaster.setFromCamera(state.mouse, state.camera);
  const hits = state.raycaster.intersectObjects(getZoomRaycastMeshes(), true);

  let dolly = 0;
  if (hits.length > 0 && Number.isFinite(hits[0].distance) && hits[0].distance > 0) {
    const hit = hits[0];
    let nextDist = hit.distance * zoomFactor;
    nextDist = Math.max(minDist, Math.min(maxDist, nextDist));
    dolly = hit.distance - nextDist;
    if (Math.abs(dolly) > 1e-6) {
      _zoomWheelDirToHit.subVectors(hit.point, rig.positionDesired).normalize();
      rig.positionDesired.addScaledVector(_zoomWheelDirToHit, dolly);
      rig.targetDesired.addScaledVector(_zoomWheelDirToHit, dolly * ZOOM_TARGET_PULL);
    }
    clampOrbitEyeAboveGround();
    return;
  }

  // Fallback: dolly вдоль взгляда (если курсор мимо геометрии).
  const offset = new THREE.Vector3().subVectors(rig.positionDesired, rig.targetDesired);
  const curDist = offset.length();
  if (!Number.isFinite(curDist) || curDist <= 0.0001) return;
  let nextDist = curDist * zoomFactor;
  nextDist = Math.max(minDist, Math.min(maxDist, nextDist));
  dolly = curDist - nextDist;
  if (Math.abs(dolly) < 1e-6) return;
  state.camera.getWorldDirection(_zoomWheelForward);
  rig.positionDesired.addScaledVector(_zoomWheelForward, dolly);
  rig.targetDesired.addScaledVector(_zoomWheelForward, dolly * ZOOM_TARGET_PULL);
  clampOrbitEyeAboveGround();
}

function onMouseDown(event) {
  if (state.isPlacingFurniture) {
    console.log('[ghost-down] isPlacingFurniture=true, button=', event.button);
  }
  if (event.button === 0) {
    // Left mouse button (ЛКМ) - rotation или размещение секции/мебели
    if (state.isPlacingSection || state.isPlacingFurniture || state.isDraggingFromCatalog) {
      // При размещении секции или мебели не вращаем камеру — размещение произойдёт при mouseup
    } else if (tryBeginFurnitureDragFromCanvas(event)) {
      // Drag already started inside tryBeginFurnitureDragFromCanvas
    } else if (isLockedOrthoView()) {
      // 2D / орто-пресеты: ЛКМ не орбитирует
    } else {
      state.isRotating = true;
      ensureCameraRig();
      _orbitPending.dx = 0;
      _orbitPending.dy = 0;
      state.previousMousePosition = { x: event.clientX, y: event.clientY };
    }
  } else if (event.button === 2) {
    // Right mouse button (ПКМ) - panning
    if (!state.isPlacingSection && !state.isPlacingFurniture) {
      state.isPanning = true;
      ensureCameraRig();
      _orbitPending.panDx = 0;
      _orbitPending.panDy = 0;
      state.previousMousePosition = { x: event.clientX, y: event.clientY };
    }
  }
}

function onMouseMove(event) {
  if (state.isDraggingFurniture && state.draggedFurniture) {
    // Drag furniture along wall (только для уже размещенной мебели при выделении)
    updateMousePosition(event);
    dragFurnitureAlongWall(event);
  } else if (state.isPlacingSection) {
    // Обновление позиции призрака секции при размещении
    updateMousePosition(event);
    updateSectionGhostPosition(event);
  } else if (state.isPlacingFurniture) {
    // Обновление позиции ghost при размещении мебели из каталога
    if (!window._ghostMoveCount) window._ghostMoveCount = 0;
    if (++window._ghostMoveCount <= 3 || window._ghostMoveCount % 50 === 0) {
      console.log('[ghost-move] isPlacingFurniture, count=', window._ghostMoveCount, 'pos=', !!state.ghostPosition, 'wall=', state.ghostWall);
    }
    updateMousePosition(event);
    updateFurnitureGhostPosition(event);
  } else if (state.isRotating && !state.isPlacingSection) {
    // Accumulate deltas — apply once per rAF (avoids N snaps when frames drop)
    if (!state.camera) return;
    markUserCameraTouched();
    _orbitPending.dx += event.clientX - state.previousMousePosition.x;
    _orbitPending.dy += event.clientY - state.previousMousePosition.y;
    state.previousMousePosition = { x: event.clientX, y: event.clientY };
  } else if (state.isPanning) {
    if (!state.camera) return;
    markUserCameraTouched();
    _orbitPending.panDx += event.clientX - state.previousMousePosition.x;
    _orbitPending.panDy += event.clientY - state.previousMousePosition.y;
    state.previousMousePosition = { x: event.clientX, y: event.clientY };
  } else {
    // Update mouse position for raycast (when not dragging)
    updateMousePosition(event);
    updateFurnitureHoverHighlight(event);
  }
}

function flushOrbitPending() {
  const rig = ensureCameraRig();
  const cam = state.camera;
  if (!cam || !rig) return;
  if (_orbitPending.dx !== 0 || _orbitPending.dy !== 0) {
    const radPerPx = getIkeaOrbitRadPerPx();
    applyOrbitSphericalDelta(-_orbitPending.dx * radPerPx, _orbitPending.dy * radPerPx);
    _orbitPending.dx = 0;
    _orbitPending.dy = 0;
  }
  if (_orbitPending.panDx !== 0 || _orbitPending.panDy !== 0) {
    const distance = cam.position.distanceTo(rig.targetDesired);
    const speed = 0.02 * (distance / 5);
    const forward = new THREE.Vector3();
    cam.getWorldDirection(forward);
    const right = new THREE.Vector3().crossVectors(forward, cam.up).normalize();
    const up = cam.up.clone().normalize();
    const pan = new THREE.Vector3()
      .addScaledVector(right, -_orbitPending.panDx * speed)
      .addScaledVector(up, _orbitPending.panDy * speed);
    rig.positionDesired.add(pan);
    rig.targetDesired.add(pan);
    _orbitPending.panDx = 0;
    _orbitPending.panDy = 0;
    clampOrbitEyeAboveGround();
  }
  snapCameraRigToDesired();
}

function onMouseUp(event) {
  if (state.isRotating || state.isPanning) {
    flushOrbitPending();
  }
  if (state.isRotating) {
    state.isRotating = false;
  }
  if (state.isPanning) {
    state.isPanning = false;
  }
  if (state.isDraggingFurniture) {
    finishFurnitureDragFromCanvas(event);
    state.suppressNextCanvasClick = true;
    state.isDraggingFurniture = false;
    state.draggedFurniture = null;
    state.dragStartMousePos = null;
    state.dragStartFurniturePos = null;
    state.dragWall = null;
    console.log('✅ Перетаскивание мебели завершено');
  } else if (state.isPlacingSection) {
    // Несколько свободных пролётов: обычно только кнопка «Поставить».
    // П-образная — без chooser: сразу ставим (сплошная или авто-мост).
    const spansOnWall = Array.isArray(state.sectionPlacementSpans)
      ? state.sectionPlacementSpans
      : [];
    const freeSpans = spansOnWall.filter((s) => s && s.placeable);
    const layoutKey =
      state.pendingLayoutKey ||
      (typeof window !== 'undefined' &&
        window.selectedRoomLayout &&
        window.selectedRoomLayout.key) ||
      null;
    const isUPlace = layoutKey === 'top-right-bottom-partition';
    if (freeSpans.length > 1 && !isUPlace) {
      return;
    }
    // Click-place (прямая / L): клик по стене → диалог, не мгновенная постановка.
    const isClickPlaceLayout =
      layoutKey === 'top-wall' ||
      layoutKey === 'corner-wardrobe' ||
      layoutKey === 'top-right' ||
      layoutKey === 'corner-wardrobe-left' ||
      layoutKey === 'top-left';
    const clickPlace = !!state.sectionClickPlaceMode && isClickPlaceLayout;
    if (clickPlace) {
      if (typeof window.__cldAskSectionPlaceConfirm === 'function') {
        window.__cldAskSectionPlaceConfirm();
      }
      return;
    }
    // L/U / drag: отпускание ЛКМ ставит секцию.
    if (typeof window.__cldConfirmPendingSectionPlacement === 'function') {
      window.__cldConfirmPendingSectionPlacement();
    }
  } else if (state.isPlacingFurniture && !state.isDraggingFromCatalog) {
    // Модуль и цель не совпали (обычный в торцевую или наоборот) — переключаем каталог.
    if (applyEndCabinetReleaseAction()) {
      state.isRotating = false;
      state.isPanning = false;
      return;
    }
    // Торцевой модуль — только если курсор над слотом (_ghostZonePlacementAllowed).
    if (
      isPendingEndCabinetModule(state.pendingFurnitureData) &&
      state._ghostZonePlacementAllowed !== false
    ) {
      placePendingFurniture();
      state.isRotating = false;
      state.isPanning = false;
      return;
    }
    // Размещение мебели при отпускании ЛКМ (не при drag из каталога — там document handler)
    const zoneInfoClick = state._pendingZoneInfo;
    const modClick = typeof window.__clodisGetPendingModuleDoorKind === 'function'
      ? window.__clodisGetPendingModuleDoorKind()
      : null;
    const canGestureClick =
      !!zoneInfoClick &&
      !!modClick &&
      zoneInfoClick.doorKind &&
      modClick !== zoneInfoClick.doorKind &&
      typeof window.__clodisZonePlaceGesturePossible === 'function' &&
      window.__clodisZonePlaceGesturePossible(
        zoneInfoClick.sectionId,
        zoneInfoClick.zoneIndex,
        modClick
      );
    // catalog_44 на спец L: не блокировать click-place (как onDragUp).
    let cornerClickOk = false;
    try {
      if (
        typeof window.__cldIsLCornerCabinetModule === 'function' &&
        window.__cldIsLCornerCabinetModule(state.pendingFurnitureData) &&
        zoneInfoClick?.sectionId != null &&
        Array.isArray(state.customSections)
      ) {
        const bay = state.customSections.find(
          (s) => s && s.id === zoneInfoClick.sectionId
        );
        const specialZi =
          bay && typeof window.__cldGetLShapeSpecialZoneIndex === 'function'
            ? window.__cldGetLShapeSpecialZoneIndex(bay)
            : null;
        if (
          bay &&
          specialZi != null &&
          Number(zoneInfoClick.zoneIndex) === Number(specialZi)
        ) {
          cornerClickOk = true;
          state._ghostZonePlacementAllowed = true;
          if (!state.ghostPosition && state.furnitureGhost) {
            state.ghostPosition = state.furnitureGhost.position.clone();
          }
          if (!state.ghostWall) {
            state.ghostWall =
              state.furnitureGhost?.userData?.wall ||
              zoneInfoClick.wallName ||
              bay.wallName ||
              null;
          }
        }
      }
    } catch (_) {}
    if (state._ghostZonePlacementAllowed === false && !canGestureClick && !cornerClickOk) {
      const switchKind = state._catalogSwitchDoorKindOnRelease;
      if (
        switchKind &&
        typeof window.__clodisAutoSwitchCatalogForZone === 'function'
      ) {
        window.__clodisAutoSwitchCatalogForZone(switchKind);
      }
      cancelFurniturePlacement();
      return;
    }
    if (canGestureClick && state.furnitureGhost) {
      state._ghostZonePlacementAllowed = true;
      if (!state.ghostPosition) {
        state.ghostPosition = state.furnitureGhost.position.clone();
      }
      if (!state.ghostWall) {
        state.ghostWall =
          state.furnitureGhost.userData?.wall || zoneInfoClick?.wallName || null;
      }
    }
    if (state.furnitureGhost && state.ghostPosition && state.ghostWall) {
      // Проверяем что стена видима (не скрыта)
      if (state.room && state.room.walls && state.room.walls[state.ghostWall] && state.room.walls[state.ghostWall].visible === false) {
        console.warn('⚠️ Стена скрыта — размещение мебели невозможно');
        cancelFurniturePlacement();
        return;
      }
      placePendingFurniture();
    } else {
      console.warn('[ghost-up] blocked — cancel. ghost=', !!state.furnitureGhost, 'pos=', !!state.ghostPosition, 'wall=', state.ghostWall);
      cancelFurniturePlacement();
    }
  }
  // Сбрасываем флаги вращения и панорамирования
  state.isRotating = false;
  state.isPanning = false;
}

function onMouseLeave() {
  if (state.isRotating || state.isPanning) flushOrbitPending();
  state.isRotating = false;
  state.isPanning = false;
  if (!state.isDraggingFurniture) {
    clearAllFurnitureHighlights();
    state._hoveredFurnitureUuid = null;
    if (state.renderer?.domElement) state.renderer.domElement.style.cursor = '';
  }
}

// Функция для установки вида сверху
export function setTopViewCamera() {
  if (typeof window !== 'undefined') window.__cldSceneViewPreset = 'top';
  const room = state.room;
  if (!room || !state.camera) return;
  const rig = ensureCameraRig();

  setCeilingVisible(false);
  cancelIkeaEmptyCameraIntro();

  // Орто-план: без перспективного наклона стен
  const cam = ensureOrthoCamera();
  if (typeof cam.clearViewOffset === 'function') {
    try {
      cam.clearViewOffset();
    } catch (_) {}
  }
  syncRoomEditPlanFrustum();
  const roomCenterX = 0;
  const roomCenterZ = 0;
  const cameraHeight = Math.max(room.height * 2, 8000);

  cam.up.copy(_camUpTop);
  cam.zoom = 1;
  rig.targetDesired.set(0, 0, 0);
  rig.positionDesired.set(roomCenterX, cameraHeight, roomCenterZ);
  setOrbitControlsEnabled(false);
  snapCameraRigToDesired();
  try {
    if (typeof window !== 'undefined' && typeof window.__cldResetIkeaHdrAccum === 'function') {
      window.__cldResetIkeaHdrAccum('scene-view-top');
    }
  } catch (_) {}

  try {
    updateRoomDimensionLabels();
  } catch (_) {}
  notifySceneViewPills();
  console.warn('[CAMERA] top ortho plan', {
    ortho: !!cam.isOrthographicCamera,
    roomEditOpen: !!(typeof window !== 'undefined' && window.__cldRoomEditOpen),
    xray: !!(typeof window !== 'undefined' && window.__cldRoomFurnitureXray),
  });
}

/**
 * Пресеты вида сцены: 3d | top | front | side.
 * 2D = настоящий OrthographicCamera (плоский CAD), не перспектива сбоку.
 */
export function setSceneViewPreset(mode) {
  const m = String(mode || '3d').trim().toLowerCase();
  const room = state.room;
  if (!room || !state.camera) return { ok: false, reason: 'no_room' };
  // Явный пресет вида — снова можно автокадрить до следующего ручного движения.
  clearUserCameraTouched();
  if (typeof window !== 'undefined') window.__cldSceneViewPreset = m;
  cancelIkeaEmptyCameraIntro();
  const rig = ensureCameraRig();

  if (m === '3d') {
    setCeilingVisible(true);
    if (typeof window !== 'undefined') window.__cldSceneViewPreset = '3d';
    exitRoomEditPlanOrtho();
    setOrbitControlsEnabled(true);
    applyIkeaEmptyRoomCamera(room, state.camera, { intro: false });
    try {
      updateRoomDimensionLabels();
    } catch (_) {}
    notifySceneViewPills();
    console.log('[CAMERA] scene view 3d', {
      persp: !!state.camera?.isPerspectiveCamera,
    });
    return { ok: true, mode: '3d' };
  }

  if (m === 'top') {
    setTopViewCamera();
    notifySceneViewPills();
    return { ok: true, mode: 'top' };
  }

  setCeilingVisible(true);
  // Новый ortho — не тащить matrix/viewOffset от плана сверху.
  if (state.camera?.isOrthographicCamera) {
    exitRoomEditPlanOrtho();
  }
  const cam = ensureOrthoCamera();
  cam.up.copy(_camUpY);
  cam.zoom = 1;
  if (typeof cam.clearViewOffset === 'function') {
    try {
      cam.clearViewOffset();
    } catch (_) {}
  }
  let focus = getFlatViewFocusBox();
  // Elevation: если фокус слишком «плоский» (только полоса у стены) — кадр по комнате.
  if (focus && !focus.isEmpty() && room) {
    const sz0 = focus.getSize(new THREE.Vector3());
    const thin =
      m === 'side' ? !(sz0.z > 200) || !(sz0.y > 200) : !(sz0.x > 200) || !(sz0.y > 200);
    if (thin) focus = null;
  }
  const center = focus
    ? focus.getCenter(new THREE.Vector3())
    : new THREE.Vector3(0, Math.max(400, room.height * 0.35), 0);
  if (!focus) {
    center.set(0, Math.max(400, room.height * 0.35), 0);
  }
  const size = focus
    ? focus.getSize(new THREE.Vector3())
    : new THREE.Vector3(room.width, room.height, room.depth);
  // Камера далеко по оси — в ortho дистанция не даёт перспективу, только near/far.
  const axisDist = Math.max(size.x, size.y, size.z, room.width || 2000, room.depth || 2000) + 8000;

  // Камера ВНУТРИ комнаты (не снаружи): иначе ortho упирается в наружную грань стены.
  const inset = 250;
  const halfW = (Number(room.width) || 4000) * 0.5;
  const halfD = (Number(room.depth) || 4000) * 0.5;
  if (m === 'front') {
    // Прямо: из комнаты на заднюю стену (−Z), фасад НМ к зрителю.
    syncElevationOrthoFrustum('front', focus);
    const eyeZ = Math.min(halfD - inset, center.z + Math.max(axisDist * 0.15, 1200));
    rig.targetDesired.set(center.x, center.y, center.z);
    rig.positionDesired.set(center.x, center.y, eyeZ);
  } else if (m === 'side') {
    // Сбоку: из комнаты слева (+X), профиль глубины НМ.
    syncElevationOrthoFrustum('side', focus);
    const eyeX = Math.max(-halfW + inset, center.x - Math.max(axisDist * 0.15, 1200));
    rig.targetDesired.set(center.x, center.y, center.z);
    rig.positionDesired.set(eyeX, center.y, center.z);
  } else {
    if (typeof window !== 'undefined') window.__cldSceneViewPreset = '3d';
    return setSceneViewPreset('3d');
  }

  // Elevation: явный Y-up до snap (не up плана сверху).
  cam.up.copy(_camUpY);
  setOrbitControlsEnabled(false);
  snapCameraRigToDesired();
  try {
    if (typeof window !== 'undefined' && typeof window.__cldResetIkeaHdrAccum === 'function') {
      window.__cldResetIkeaHdrAccum('scene-view-' + m);
    }
  } catch (_) {}
  try {
    updateRoomDimensionLabels();
  } catch (_) {}
  notifySceneViewPills();
  console.warn('[CAMERA] scene view', m, {
    ortho: !!state.camera?.isOrthographicCamera,
    pos: rig.positionDesired.toArray().map((n) => Math.round(n)),
    target: rig.targetDesired.toArray().map((n) => Math.round(n)),
    roomEditOpen: !!(typeof window !== 'undefined' && window.__cldRoomEditOpen),
    roomEditView: typeof window !== 'undefined' ? window.__cldRoomEditView : null,
    shapePlan: !!(typeof window !== 'undefined' && window.__cldKitchenShapePlan),
  });
  return { ok: true, mode: m };
}

export function getSceneViewPresetMode() {
  return getSceneViewPreset();
}

/** Пересчитать frustum при resize для текущего орто-пресета. */
export function syncSceneViewOrthoFrustum() {
  const m = getSceneViewPreset();
  if (!state.camera?.isOrthographicCamera && isLockedOrthoView()) {
    ensureOrthoCamera();
  }
  // front/side раньше room-edit top — иначе DevTools resize сбивает elevation в plan-frustum.
  if (m === 'front' || m === 'side') {
    syncElevationOrthoFrustum(m, getFlatViewFocusBox());
  } else if (m === 'top' || isRoomEditTopView2d()) {
    syncRoomEditPlanFrustum();
  }
}

/**
 * Плотный кадр на шкаф (как product close-up IKEA): заполняет кадр bbox мебели.
 * Азимут сохраняем от текущего взгляда, дистанцию — по FOV + padding.
 */
export function frameCameraToFurnitureClose(options = {}) {
  if (shouldSkipAutoCameraFrame(options)) return false;
  if (!state.camera || !state.scene) return false;
  const rig = ensureCameraRig();
  const box = new THREE.Box3();
  let any = false;
  state.scene.traverse((o) => {
    if (!(o.isGroup && o.userData?.isFurniture)) return;
    o.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(o);
    if (!b.isEmpty()) {
      box.union(b);
      any = true;
    }
  });
  if (!any || box.isEmpty()) return false;

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const look = center.clone();
  look.y = box.min.y + size.y * 0.48;

  const fov = (Number(state.camera.fov) || 42) * (Math.PI / 180);
  const aspect = Math.max(0.25, Number(state.camera.aspect) || 1);
  const pad = Number.isFinite(Number(options.padding)) ? Number(options.padding) : 1.06;
  const pull = Number.isFinite(Number(options.pull)) ? Number(options.pull) : 0.88;
  const halfH = Math.max(size.y, 200) * 0.5 * pad;
  const halfW = Math.max(size.x, 160) * 0.5 * pad;
  const distH = halfH / Math.tan(fov * 0.5);
  const distW = halfW / (Math.tan(fov * 0.5) * aspect);
  let dist = Math.max(distH, distW) * pull;
  dist = Math.max((rig.zoomMinDistanceMm || 0.5) + 2, dist);

  let dir = new THREE.Vector3().subVectors(rig.positionDesired, rig.targetDesired);
  if (dir.lengthSq() < 1e-3) {
    dir.subVectors(state.camera.position, look);
  }
  if (dir.lengthSq() < 1e-3) dir.set(0.4, 0.15, 1);
  // Чуть выравниваем по горизонту — фронтальный product-view
  dir.y *= 0.45;
  if (dir.lengthSq() < 1e-3) dir.set(0.25, 0.12, 1);
  dir.normalize();

  rig.targetDesired.copy(look);
  rig.positionDesired.copy(look).addScaledVector(dir, dist);
  if (options.instant !== false) {
    rig.target.copy(rig.targetDesired);
    state.camera.position.copy(rig.positionDesired);
    state.camera.lookAt(rig.targetDesired);
    state.camera.updateMatrixWorld?.();
  }
  if (typeof window !== 'undefined') {
    window.__cldCameraFrame = { dist: Math.round(dist), size: size.toArray().map((n) => Math.round(n)) };
  }
  syncCameraNearClip(state.camera.position.distanceTo(rig.targetDesired));
  return true;
}

/**
 * Live IKEA PAX empty camera 2026-09-02 (us/en).
 * Wrapper position was (0,0,0); pose from view matrix (column-major):
 *   cam (0, 1, 5.3) m, look в€’Z, up +Y, no pitch/yaw.
 * IKEA room dump 2026-08-28: back в‰€ z=0, opening в‰€ z=4.07 m.
 * Our room: center origin, back z=в€’depth/2, open +Z.
 */
const IKEA_EMPTY_CAM_Y_MM = 1000;
const IKEA_EMPTY_CAM_FROM_BACK_MM = 5300;
/**
 * Intro (live dump 2026-09-18 lt/ru): OrbitPlannerCamera rest _target_offset=8,
 * mid/start-like _offsetв‰€14.8 в†’ pull 14.8/8=1.85. Spring update из Console не крутится
 * (updateTicks=0) — длительность ≈1.5–2 с на глаз, не raw 4Г—10=40 (то схлопывало за 1 кадр).
 */
const IKEA_INTRO_START_PULL = 1.85;
/** ~3–3.5 с до финала (было 2.4 — «слишком быстро»). */
const IKEA_INTRO_LERP_SPEED = 1.35;
const IKEA_INTRO_DT_CAP = 1 / 30;
const IKEA_INTRO_EPS_MM = 12;

function __cldUnionSectionWorldBox(sectionData, outBox) {
  const box = outBox || new THREE.Box3();
  if (!sectionData) return box;
  const root = sectionData.group;
  if (root) {
    root.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(root);
    if (!b.isEmpty()) box.union(b);
  }
  const sid = sectionData.id != null ? String(sectionData.id) : null;
  if (sid && state.scene) {
    state.scene.traverse((obj) => {
      if (!obj?.isGroup || !obj.userData?.isFurniture) return;
      if (String(obj.userData.sectionId) !== sid) return;
      obj.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(obj);
      if (!b.isEmpty()) box.union(b);
    });
  }
  // Пустая зона: если bbox почти плоский — взять size секции.
  const size = box.getSize(new THREE.Vector3());
  if ((box.isEmpty() || size.y < 80) && sectionData.size && root?.position) {
    const sx = Math.max(200, Number(sectionData.size.x) || 800);
    const sy = Math.max(400, Number(sectionData.size.y) || 2000);
    const sz = Math.max(200, Number(sectionData.size.z) || 600);
    const p = root.position;
    const half = new THREE.Vector3(sx * 0.5, sy * 0.5, sz * 0.5);
    const wall = String(sectionData.wallName || 'back').toLowerCase();
    // Геометрия секций без поворота: размер по осям мира.
    if (wall === 'left' || wall === 'right') {
      half.set(sz * 0.5, sy * 0.5, sx * 0.5);
    }
    const min = new THREE.Vector3(p.x - half.x, Math.max(0, p.y), p.z - half.z);
    const max = new THREE.Vector3(p.x + half.x, p.y + sy, p.z + half.z);
    box.union(new THREE.Box3(min, max));
  }
  return box;
}

function __cldDistToFitBox(size, padding = 1.12, pull = 0.92) {
  const fov = (Number(state.camera?.fov) || 42) * (Math.PI / 180);
  const aspect = Math.max(0.25, Number(state.camera?.aspect) || 1);
  const halfH = Math.max(size.y, 400) * 0.5 * padding;
  const halfW = Math.max(size.x, size.z, 400) * 0.5 * padding;
  const distH = halfH / Math.tan(fov * 0.5);
  const distW = halfW / (Math.tan(fov * 0.5) * aspect);
  const rig = ensureCameraRig();
  return Math.max((rig.zoomMinDistanceMm || 0.5) + 2, Math.max(distH, distW) * pull, 2200);
}

/**
 * Maatkasten-like: L-pill в†’ camera to that arm.
 * - primary/attached: face the wall (into-room axis)
 * - overview: corner ~45В° so both arms visible
 */
export function frameCameraForLArmFocus(focusState, pair, options = {}) {
  if (shouldSkipAutoCameraFrame(options)) return false;
  if (!state.camera || !pair?.primary || !pair?.attached) return false;
  try {
    exitRoomEditPlanOrtho();
  } catch (_) {}
  const cam = state.camera;
  const rig = ensureCameraRig();
  cam.up.set(0, 1, 0);

  const mode = focusState?.mode === 'primary' || focusState?.mode === 'attached' ? focusState.mode : 'overview';
  const box = new THREE.Box3();
  let intoRoom = new THREE.Vector3(0, 0, 1);

  if (mode === 'primary' || mode === 'attached') {
    const wallSecs =
      mode === 'primary' && Array.isArray(options.primaryWallSections) && options.primaryWallSections.length
        ? options.primaryWallSections
        : null;
    if (wallSecs) {
      wallSecs.forEach((sec) => __cldUnionSectionWorldBox(sec, box));
      const wall = String(
        focusState?.primaryWall || pair.primaryWall || pair.primary?.wallName || 'back'
      ).toLowerCase();
      intoRoom.copy(getWallAxes(wall).wDir).normalize();
    } else {
      const sec = mode === 'primary' ? pair.primary : pair.attached;
      const wall = String(
        (mode === 'primary' ? pair.primaryWall : pair.attachedWall) || sec.wallName || 'back'
      ).toLowerCase();
      __cldUnionSectionWorldBox(sec, box);
      intoRoom.copy(getWallAxes(wall).wDir).normalize();
    }
  } else {
    __cldUnionSectionWorldBox(pair.primary, box);
    __cldUnionSectionWorldBox(pair.attached, box);
    const a = getWallAxes(String(pair.primaryWall || pair.primary.wallName || 'back').toLowerCase()).wDir;
    const b = getWallAxes(String(pair.attachedWall || pair.attached.wallName || 'right').toLowerCase()).wDir;
    intoRoom.copy(a).add(b);
    if (intoRoom.lengthSq() < 1e-6) intoRoom.set(0.55, 0, 0.85);
    intoRoom.normalize();
  }

  if (box.isEmpty()) return false;

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const look = center.clone();
  look.y = box.min.y + Math.max(size.y * 0.42, 700);

  // Лёгкий подъём камеры (не орто сверху)
  const elev = mode === 'overview' ? 0.18 : 0.1;
  const dir = intoRoom.clone();
  dir.y += elev;
  dir.normalize();

  // Обзор ок; плечо (лево/право/задняя) — чуть дальше, иначе слишком в упор к стене.
  let dist = __cldDistToFitBox(size, mode === 'overview' ? 1.2 : 1.28, mode === 'overview' ? 0.98 : 1.12);
  if (mode === 'overview') dist *= 1.08;
  else dist *= 1.22;

  rig.targetDesired.copy(look);
  rig.positionDesired.copy(look).addScaledVector(dir, dist);

  const instant = options.instant !== false;
  if (instant) {
    rig.target.copy(rig.targetDesired);
    cam.position.copy(rig.positionDesired);
    cam.lookAt(rig.targetDesired);
    cam.updateMatrixWorld?.(true);
  }
  syncCameraNearClip(cam.position.distanceTo(rig.targetDesired));
  if (typeof window !== 'undefined') {
    window.__cldLArmCameraFrame = {
      mode,
      dist: Math.round(dist),
      look: look.toArray().map((n) => Math.round(n)),
      pos: rig.positionDesired.toArray().map((n) => Math.round(n)),
    };
  }
  return true;
}

/**
 * Кадр на одну секцию (пролёт слева/справа от двери).
 */
export function frameCameraToSection(sectionData, options = {}) {
  if (shouldSkipAutoCameraFrame(options)) return false;
  if (!state.camera || !sectionData) return false;
  try {
    exitRoomEditPlanOrtho();
  } catch (_) {}
  const cam = state.camera;
  const rig = ensureCameraRig();
  cam.up.set(0, 1, 0);

  const box = new THREE.Box3();
  __cldUnionSectionWorldBox(sectionData, box);
  if (box.isEmpty()) return false;

  const wall = String(sectionData.wallName || 'back').toLowerCase();
  const intoRoom = getWallAxes(wall).wDir.clone().normalize();

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const look = center.clone();
  look.y = box.min.y + Math.max(size.y * 0.42, 700);

  const dir = intoRoom.clone();
  dir.y += 0.1;
  dir.normalize();

  let dist = __cldDistToFitBox(size, 1.28, 1.12);
  dist *= 1.22;

  rig.targetDesired.copy(look);
  rig.positionDesired.copy(look).addScaledVector(dir, dist);

  if (options.instant !== false) {
    rig.target.copy(rig.targetDesired);
    cam.position.copy(rig.positionDesired);
    cam.lookAt(rig.targetDesired);
    cam.updateMatrixWorld?.(true);
  }
  syncCameraNearClip(cam.position.distanceTo(rig.targetDesired));
  return true;
}

/**
 * Frame empty room like live IKEA PAX (dump view matrix, not UV fit).
 * Call after room.group is centered at origin.
 * @param {{ intro?: boolean }} [opts] intro=true — старт дальше, lerp к финалу (открытие планировщика).
 */
export function applyIkeaEmptyRoomCamera(room = state.room, camera = state.camera, opts = {}) {
  // Не сбивать плоский 2D-пресет сцены (кнопки Сверху/Прямо/Сбоку).
  // Room-edit и явный force3d / setSceneViewPreset('3d') — можно.
  const preset = getSceneViewPreset();
  const roomEditOpen = typeof window !== 'undefined' && !!window.__cldRoomEditOpen;
  if (
    !opts?.force3d &&
    !roomEditOpen &&
    (preset === 'top' || preset === 'front' || preset === 'side')
  ) {
    return { ok: false, reason: 'scene_ortho_preset', mode: preset };
  }
  // Сначала вернуть PerspectiveCamera, если были в орто-плане / elevation
  exitRoomEditPlanOrtho();
  if (typeof window !== 'undefined') window.__cldSceneViewPreset = '3d';
  setOrbitControlsEnabled(true);
  notifySceneViewPills();
  camera = state.camera;
  if (!room || !camera) return { ok: false, reason: 'no room/camera' };
  const wantIntro = opts.intro !== false;
  const d = Number(room.depth) || 4000;
  const backZ = -d * 0.5;
  const camZ = backZ + IKEA_EMPTY_CAM_FROM_BACK_MM;
  const target = new THREE.Vector3(0, IKEA_EMPTY_CAM_Y_MM, 0);
  const finalEye = new THREE.Vector3(0, IKEA_EMPTY_CAM_Y_MM, camZ);
  camera.up.set(0, 1, 0);
  camera.updateProjectionMatrix();

  const rig = ensureCameraRig();
  rig.targetDesired.copy(target);
  rig.positionDesired.copy(finalEye);
  state.initialCameraPosition = finalEye.clone();
  state.initialCameraTarget = target.clone();

  if (wantIntro) {
    const startEye = finalEye.clone();
    startEye.z = target.z + (finalEye.z - target.z) * IKEA_INTRO_START_PULL;
    camera.position.copy(startEye);
    rig.target.copy(target);
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
    rig.introActive = true;
    syncCameraNearClip(camera.position.distanceTo(target));
  } else {
    camera.position.copy(finalEye);
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
    rig.target.copy(target);
    rig.introActive = false;
    syncCameraNearClip(camera.position.distanceTo(target));
  }

  const info = {
    pos: camera.position.toArray().map((n) => Math.round(n)),
    target: target.toArray().map((n) => Math.round(n)),
    finalPos: finalEye.toArray().map((n) => Math.round(n)),
    distToBackMm: Math.round(IKEA_EMPTY_CAM_FROM_BACK_MM),
    intro: !!rig.introActive,
    elevDeg: 0,
    fov: camera.fov,
    dump: 'view (0,1,5.3)m + intro pull 1.85 (offset 14.8в†’8)',
  };
  if (typeof window !== 'undefined') window.__cldIkeaEmptyCamera = info;
  return { ok: true, ...info };
}

if (typeof window !== 'undefined') {
  window.__cldSceneViewPreset = window.__cldSceneViewPreset || '3d';
  window.__cldFrameCameraToFurnitureClose = frameCameraToFurnitureClose;
  window.__cldFrameCameraForLArmFocus = frameCameraForLArmFocus;
  window.__cldFrameCameraToSection = frameCameraToSection;
  window.__cldApplyIkeaEmptyRoomCamera = applyIkeaEmptyRoomCamera;
  window.__cldCameraNearAudit = getCameraNearClipAudit;
  window.__cldSyncRoomEditPlanFrustum = syncRoomEditPlanFrustum;
  window.__cldExitRoomEditPlanOrtho = exitRoomEditPlanOrtho;
  window.__cldSetSceneViewPreset = setSceneViewPreset;
  window.__cldGetSceneViewPreset = getSceneViewPresetMode;
  window.__cldSyncSceneViewOrthoFrustum = syncSceneViewOrthoFrustum;
  window.__cldSetZoomMinMm = (mm) => {
    const rig = ensureCameraRig();
    rig.zoomMinDistanceMm = Math.max(0.1, Number(mm) || DEFAULT_ZOOM_MIN_DISTANCE_MM);
    return rig.zoomMinDistanceMm;
  };
}
