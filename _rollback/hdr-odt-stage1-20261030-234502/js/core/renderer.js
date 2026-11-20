// Renderer — прямой canvas, без composer.

import { state } from '../utils/state.js';
import { updateAllSceneIcons } from '../ui/scene-icons.js?v=20261027-nmu142q';
import { updateHingeRoleMarkerScreenPositions } from '../furniture/hinge-role-markers-room.js?v=20260613-hinge-cup-y-align';
import {
  syncCameraNearClip,
  syncRoomEditPlanFrustum,
  syncSceneViewOrthoFrustum,
  updateCameraRigFrame,
} from './camera.js?v=20261017-plinth-clean1';
import { getRoomLightingPreset } from './room-lighting-presets.js?v=20260829-room3';
import {
  syncIkeaRoomLightV0,
  renderIkeaRoomLightV0,
  resizeIkeaHdrDisplayPipeline,
  isIkeaHdrDisplayActive,
} from '../furniture/ikea-room-light-v0.js?v=20261008-xray11';
import { isIkeaRoomLightV0 } from '../furniture/ikea-light-gate.js?v=20260907-nospeed1';

const ROOM_QUALITY_PROFILES = {
  normal: { minPr: 1, maxPr: 1.5, maxMp: 6 },
  /**
   * IKEA HDR: several HalfFloat RTs + MSAA. High DPR caused GL_OUT_OF_MEMORY /
   * "context loss and was blocked" on Windows Chrome. Cap pixels, not light SoT.
   */
  ikea: { minPr: 1, maxPr: 1.25, maxMp: 4 },
  hq: { minPr: 1, maxPr: 2, maxMp: 8 },
  ultra: { minPr: 1.5, maxPr: 2, maxMp: 10 },
};

function __num(value) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export function getRoomRenderQuality() {
  return isIkeaRoomLightV0() ? 'ikea' : 'normal';
}

function __roomRenderLimits() {
  const profile = ROOM_QUALITY_PROFILES[getRoomRenderQuality()] ?? ROOM_QUALITY_PROFILES.normal;
  return {
    maxMp: __num(window.__cldRoomMaxFramebufferMP) || profile.maxMp,
    minPr: profile.minPr,
    maxPr: profile.maxPr,
  };
}

function __roomViewportSize() {
  const container = document.getElementById('canvas-container');
  return {
    width: Math.max(1, container?.clientWidth || window.innerWidth || 1280),
    height: Math.max(1, container?.clientHeight || window.innerHeight || 720),
  };
}

export function getRoomRenderPixelRatio() {
  const dpr = window.devicePixelRatio || 1;
  const { width, height } = __roomViewportSize();
  /** Placement only — IKEA does not drop DPR on orbit (caused look pop / perceived zasvet). */
  if (state.isPlacingFurniture || state.isDraggingFromCatalog) {
    return Math.min(dpr, 1);
  }
  const { maxMp, minPr, maxPr } = __roomRenderLimits();
  let pr = Math.min(Math.max(dpr, minPr), maxPr);
  const mp = (width * height * pr * pr) / (1024 * 1024);
  if (mp > maxMp) {
    pr = Math.sqrt((maxMp * 1024 * 1024) / (width * height));
    pr = Math.max(minPr, Math.min(pr, maxPr));
  }
  return pr;
}

/** No-op: orbit keeps settled DPR (IKEA). Kept so animate() call stays valid. */
export function syncOrbitCanvasPerf() {}

export function getRoomRenderStats() {
  const { width, height } = __roomViewportSize();
  const pr = getRoomRenderPixelRatio();
  const rw = Math.round(width * pr);
  const rh = Math.round(height * pr);
  return {
    quality: getRoomRenderQuality(),
    cssWidth: width,
    cssHeight: height,
    pixelRatio: pr,
    renderWidth: rw,
    renderHeight: rh,
    megapixels: (rw * rh) / (1024 * 1024),
    ssaaLevel: 0,
  };
}

export function getRoomSsaaSampleLevel() {
  return 0;
}

export function safeComposerSetSize(_composer, _width, _height) {}

export function initPostProcessing() {
  state.composer = null;
  state.ssaaPass = null;
  state.gtaoPass = null;
  state.n8aoPass = null;
  state.smaaPass = null;
  console.warn('[RENDER] direct canvas · no composer · preset=', getRoomLightingPreset()?.id);
}

export function animate() {
  requestAnimationFrame(animate);
  if (state._webglContextLost || !state.renderer || !state.scene || !state.camera) return;
  try {
    const gl = state.renderer.getContext?.();
    if (gl && typeof gl.isContextLost === 'function' && gl.isContextLost()) {
      state._webglContextLost = true;
      return;
    }
  } catch (_) {
    state._webglContextLost = true;
    return;
  }

  const dt = state.clock ? state.clock.getDelta() : 0.016;
  syncOrbitCanvasPerf();
  if (state.cameraRig?.targetDesired && state.cameraRig?.positionDesired) {
    updateCameraRigFrame(dt);
  } else if (state.camera && state.cameraRig?.target) {
    syncCameraNearClip(state.camera.position.distanceTo(state.cameraRig.target));
  }

  // Cutaway стен/потолка — каждый кадр (в т.ч. во время orbit/pan), как силуэт у IKEA.
  state.room?.updateWallVisibility?.(state.camera);
  if (!(state.isRotating || state.isPanning)) {
    state.furnitureAnimationMixer?.update(dt);
    try {
      window.ClodisBuilder?.updateDoorSwingAnimations?.(dt);
    } catch (_) {}
    updateAllSceneIcons();
    updateHingeRoleMarkerScreenPositions();
  }
  try {
    if (isIkeaRoomLightV0()) syncIkeaRoomLightV0();
    if (isIkeaRoomLightV0() && isIkeaHdrDisplayActive()) {
      renderIkeaRoomLightV0(state.renderer, state.scene, state.camera);
    } else {
      state.renderer.render(state.scene, state.camera);
    }
  } catch (e) {
    // Не ставить _webglContextLost на любую ошибку кадра —
    // иначе после rebuild/xray сцена навсегда «засвечена»/пустая до reload.
    if (!animate._abortLogged) {
      animate._abortLogged = true;
      console.warn('[RENDER] frame aborted', e?.message || e, e);
    }
    try {
      const gl = state.renderer?.getContext?.();
      if (gl && typeof gl.isContextLost === 'function' && gl.isContextLost()) {
        state._webglContextLost = true;
      }
    } catch (_) {}
  }
}

export function onWindowResize() {
  const container = document.getElementById('canvas-container');
  if (!container || !state.renderer || !state.camera) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (state.camera.isOrthographicCamera) {
    if (typeof syncSceneViewOrthoFrustum === 'function') syncSceneViewOrthoFrustum();
    else syncRoomEditPlanFrustum();
  } else {
    state.camera.aspect = width / height;
    state.camera.updateProjectionMatrix();
  }
  state.renderer.setPixelRatio(getRoomRenderPixelRatio());
  state.renderer.setSize(width, height, false);
  if (isIkeaHdrDisplayActive()) {
    resizeIkeaHdrDisplayPipeline(state.renderer.domElement.width, state.renderer.domElement.height);
  }
  if (state.sceneIconsContainer) {
    state.sceneIconsContainer.style.width = `${width}px`;
    state.sceneIconsContainer.style.height = `${height}px`;
  }
}

if (typeof window !== 'undefined') {
  window.__cldGetRoomRenderStats = getRoomRenderStats;
  window.__cldGetRoomRenderQuality = getRoomRenderQuality;
  window.__cldGetRoomRenderPixelRatio = getRoomRenderPixelRatio;
}
