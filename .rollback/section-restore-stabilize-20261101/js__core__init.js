// Core initialization module
// Handles Three.js scene, camera, renderer setup

import { state, ROOM_WIDTH, ROOM_DEPTH, ROOM_HEIGHT, WALL_THICKNESS } from '../utils/state.js';
import { addSceneIcons } from '../ui/scene-icons.js?v=20261031-side4b';
import { patchSectionNicheDepthWrite } from '../sections/section-depth-patch.js';
import { clearAllCustomSections } from '../sections/section-manager.js?v=20261031-zwsrc2';
import '../kitchen/kitchen-joint.js?v=20261028-vmu5';
import '../kitchen/kitchen-corner-cell.js?v=20261028-vmu5';
import '../kitchen/kitchen-base-engine.js?v=20261101-post4b-r1';
import { setupCameraControls, CAMERA_FAR_MM, CAMERA_NEAR_MAX_MM, syncCameraNearClip, applyIkeaEmptyRoomCamera, syncRoomEditPlanFrustum } from './camera.js?v=20261028-sectionsleep2';
import { setupEventListeners } from '../events/mouse-handler.js';
import {
  animate,
  initPostProcessing,
  getRoomRenderPixelRatio,
  safeComposerSetSize,
} from './renderer.js?v=20261017-plinth-clean1';
import {
  getRoomLightingPreset,
  applyRoomLightingRendererSettings,
  applyRoomLightingSceneBackground,
  applyRoomLightingPreset,
  initRoomLightingPresetGlobals,
} from './room-lighting-presets.js?v=20260829-room3';
import {
  isIkeaLightFrozen,
  isIkeaRoomLightV0,
  auditIkeaLightBlocked,
} from '../furniture/ikea-light-gate.js?v=20260907-nospeed1';
import {
  loadIkeaRoomEnvV0,
  installIkeaRoomLightV0,
  auditIkeaV0MaterialState,
  auditIkeaV0Light,
  reinitIkeaHdrAfterWebGlRestore,
} from '../furniture/ikea-room-light-v0.js?v=20261030-hdrod1';
import { auditIkeaV0Manifest } from '../furniture/ikea-v0-manifest.js?v=20260904-ikea-r3j86';
import { SOT } from '../furniture/betrakta-sot.js?v=20260913-tile-per-floor';

export async function init() {
  initRoomLightingPresetGlobals();
  const lightingPreset = getRoomLightingPreset();
  state.roomLightingPreset = lightingPreset.id;
  state.roomEnvIntensity = Number(lightingPreset.envIntensity) || 0;
  console.log('🚀 Инициализация приложения...', `[свет: ${lightingPreset.label}]`);
  console.log('  THREE:', typeof THREE);
  console.log('  Room:', typeof Room);
  console.log('  Furniture:', typeof Furniture);

  initScene();
  initCamera();
  initRenderer();
  await initEnvironment();
  initLightsLegacy();
  initRaycaster();
  initRoom();
  if (isIkeaRoomLightV0()) {
    const installed = installIkeaRoomLightV0();
    console.warn('[IKEA v0] install', installed);
    try {
      const { syncAllRoomCabinetStudio } = await import(
        '../furniture/room-cabinet-studio.js?v=20261023-room2'
      );
      const cabBound = syncAllRoomCabinetStudio(state.scene);
      if (cabBound > 0) console.warn('[IKEA v0] cabinet re-bind on init · meshes=', cabBound);
    } catch (e) {
      console.warn('[IKEA v0] cabinet re-bind on init failed', e);
    }
  }
  initPostProcessing();
  setupCameraControls();
  setupEventListeners();
  
  // Start animation loop
  animate();
  
  console.log('✅ Приложение инициализировано');
}

function initScene() {
  state.scene = new THREE.Scene();
  if (typeof window !== 'undefined') {
    window.__cldRoomScene = state.scene;
    window.__cldAppState = state;
  }
  applyRoomLightingSceneBackground(state.scene, getRoomLightingPreset());
  console.log('✅ Сцена создана');
}

function initCamera() {
  const container = document.getElementById('canvas-container');
  const aspect = container.clientWidth / container.clientHeight;
  // Dump camera fov 0.8 rad ≈ 45.84° (IKEA Babylon activeCamera.fov)
  const ikeaFovDeg = (SOT.cameraFovRad * 180) / Math.PI;
  state.camera = new THREE.PerspectiveCamera(ikeaFovDeg, aspect, CAMERA_NEAR_MAX_MM, CAMERA_FAR_MM);
  state.camera.layers.disableAll();
  state.camera.layers.enable(0);

  // Placeholder until initRoom() — dump view: (0, 1, 5.3) m look −Z.
  state.camera.position.set(0, 1000, 3300);
  state.camera.lookAt(0, 1000, 0);
  
  // Сохраняем исходную позицию камеры для восстановления после редактирования
  state.initialCameraPosition = state.camera.position.clone();
  state.initialCameraTarget = new THREE.Vector3(0, 1000, 0);

  // Unified camera rig: all interactions (rotate/pan/zoom) operate on the same target,
  // and rendering loop applies damping for smooth movement.
  state.cameraRig = {
    target: state.initialCameraTarget.clone(),
    targetDesired: state.initialCameraTarget.clone(),
    positionDesired: state.camera.position.clone(),
    damping: 0.1,
    // Колёсико: ~0.5 мм до hit; near clip = syncCameraNearClip (dynamic 0.5–10 mm).
    zoomMinDistanceMm: 0.5,
    zoomMaxDistanceMm: 30000,
    zoomExpFactor: 0.0012,
  };
  
  syncCameraNearClip(state.camera.position.distanceTo(state.cameraRig.target));
  
  console.log('✅ Камера создана');
}

function disposeRendererResources(container) {
  if (state._rendererResizeHandler) {
    window.removeEventListener('resize', state._rendererResizeHandler);
    state._rendererResizeHandler = null;
  }
  if (state.composer) {
    try {
      state.composer.dispose();
    } catch (_) {
      /* ignore */
    }
    state.composer = null;
  }
  state.saoPass = null;
  state.gtaoPass = null;
  state.n8aoPass = null;
  state.smaaPass = null;
  if (state.renderer) {
    try {
      const el = state.renderer.domElement;
      // ВАЖНО: НЕ вызывать WEBGL_lose_context.loseContext() —
      // Chrome после серии loss блокирует создание WebGL:
      // "Web page caused context loss and was blocked".
      if (el && el.parentNode) el.parentNode.removeChild(el);
      state.renderer.dispose();
    } catch (_) {
      /* ignore */
    }
    state.renderer = null;
  }
  purgeOrphanWebGLCanvases(container);
  if (state.sceneIconsContainer && container && state.sceneIconsContainer.parentNode === container) {
    try {
      container.removeChild(state.sceneIconsContainer);
    } catch (_) {
      /* ignore */
    }
  }
  state.sceneIconsContainer = null;
}

function attachRendererPageDisposal(container) {
  if (state._rendererPageDisposalAttached) return;
  state._rendererPageDisposalAttached = true;
  const dispose = () => {
    try {
      disposeRendererResources(container || document.getElementById('canvas-container'));
    } catch (_) {
      /* ignore */
    }
  };
  window.addEventListener('pagehide', dispose);
  window.addEventListener('beforeunload', dispose);
}

/** Удаляет «зависшие» canvas после сбоя инициализации. Без getContext/loseContext. */
function purgeOrphanWebGLCanvases(container) {
  const roots = [];
  if (container) roots.push(container);
  if (typeof document !== 'undefined') roots.push(document.body);
  for (const root of roots) {
    if (!root?.querySelectorAll) continue;
    root.querySelectorAll('canvas').forEach((el) => {
      if (state.renderer?.domElement === el) return;
      // Не трогаем UI-canvas вне 3D-контейнера (если не orphan в container).
      if (container && !container.contains(el) && root === document.body) return;
      try {
        el.remove();
      } catch (_) {
        /* ignore */
      }
    });
  }
}

function showWebGLBlockedOverlay(message) {
  if (typeof document === 'undefined') return;
  let el = document.getElementById('cld-webgl-blocked-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'cld-webgl-blocked-overlay';
    el.style.cssText =
      'position:fixed;inset:0;z-index:99999;background:rgba(20,24,28,0.92);color:#fff;' +
      'display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;font:16px/1.5 sans-serif;';
    document.body.appendChild(el);
  }
  el.innerHTML =
    '<div style="max-width:520px;text-align:center">' +
    '<h2 style="margin:0 0 12px;font-size:22px">Не удалось запустить 3D</h2>' +
    '<p style="margin:0 0 16px;opacity:0.9">' +
    (message || 'Браузер заблокировал WebGL для этой страницы.') +
    '</p>' +
    '<p style="margin:0 0 12px;font-size:14px;opacity:0.85"><b>F5 недостаточно</b>, если Chrome уже заблокировал WebGL.</p>' +
    '<p style="margin:0 0 12px;font-size:14px;opacity:0.85">1) Закройте <b>все</b> вкладки localhost (комната + админка с 3D-превью).<br>' +
    '2) Подождите <b>5 секунд</b>.<br>' +
    '3) Откройте <b>только</b> комнату в новой вкладке.</p>' +
    '<p style="margin:0 0 20px;font-size:14px;opacity:0.75">Настройки Chrome → Система → аппаратное ускорение — должно быть включено.</p>' +
    '<button type="button" style="padding:10px 20px;font-size:15px;cursor:pointer;border:0;border-radius:6px;background:#0d9488;color:#fff">Я закрыл Chrome — открыть комнату</button>' +
    '</div>';
  const btn = el.querySelector('button');
  if (btn) {
    btn.onclick = () => {
      try {
        delete window.__CLD_REFACTORED_INIT__;
      } catch (_) {
        window.__CLD_REFACTORED_INIT__ = false;
      }
      // Чистый вход с актуальным build-id (не Date.now — иначе снова сбивается с badge).
      window.location.href = window.location.pathname + '?v=20261005-kitchen-plan2d';
    };
  }
}

/**
 * Мягкий dispose без loseContext. При «blocked» — одна отложенная попытка.
 */
function createWebGLRendererSafe() {
  let lastError = null;
  const wantAlpha = false;
  const attempts = [
    { antialias: true },
    { antialias: false },
  ];
  const isBlockedMsg = (msg) =>
    /blocked|context loss|could not be created/i.test(String(msg || ''));

  const tryCreate = () => {
    for (let i = 0; i < attempts.length; i++) {
      const canvas = document.createElement('canvas');
      try {
        const renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: attempts[i].antialias,
          alpha: wantAlpha,
          depth: true,
          stencil: false,
          preserveDrawingBuffer: false,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
        });
        if (renderer.getContext()) {
          if (!attempts[i].antialias) {
            console.warn('⚠️ WebGLRenderer: без MSAA (экономия GPU).');
          }
          return renderer;
        }
        try {
          renderer.dispose();
        } catch (_) {}
      } catch (e) {
        lastError = e;
        if (isBlockedMsg(e?.message)) break;
      }
    }
    return null;
  };

  let renderer = tryCreate();
  if (renderer) return renderer;

  const msg = (lastError && lastError.message) || 'Не удалось создать WebGL-контекст.';
  showWebGLBlockedOverlay(msg);
  throw new Error(msg);
}

function initRenderer() {
  const container = document.getElementById('canvas-container');
  if (!container) {
    console.error('❌ initRenderer: элемент #canvas-container не найден в DOM');
    throw new Error('canvas-container не найден. Убедитесь, что index.html загружен и DOM готов.');
  }

  disposeRendererResources(container);
  attachRendererPageDisposal(container);

  state.renderer = createWebGLRendererSafe();
  try {
    const glAttrs = state.renderer.getContext()?.getContextAttributes?.();
    state._webglAntialias = !!glAttrs?.antialias;
    console.log('[RENDER] WebGL antialias:', state._webglAntialias);
  } catch (_) {}

  // Retina: до 2× — чёткость без перегрузки GPU.
  const pr = getRoomRenderPixelRatio();
  state.renderer.setPixelRatio(pr);
  state.renderer.setSize(
    Math.max(1, container.clientWidth || 0),
    Math.max(1, container.clientHeight || 0),
    false
  );

  applyRoomLightingRendererSettings(state.renderer, getRoomLightingPreset());

  updateRendererSize();
  state._rendererResizeHandler = updateRendererSize;
  window.addEventListener('resize', state._rendererResizeHandler);

  const canvas = state.renderer.domElement;
  canvas.addEventListener(
    'webglcontextlost',
    (e) => {
      e.preventDefault();
      state._webglContextLost = true;
      console.warn('⚠️ WebGL: контекст потерян (webglcontextlost).');
      showWebGLBlockedOverlay(
        'WebGL-контекст потерян при постановке мебели / Soft+Spot (память GPU). ' +
          'Не жмите F5 сразу. Закройте Chrome полностью, подождите 5 сек, откройте только комнату.'
      );
    },
    false
  );
  canvas.addEventListener(
    'webglcontextrestored',
    () => {
      // НЕ location.reload(). Пересобираем lite HDR→ODT; при провале — оверлей.
      console.warn('⚠️ WebGL: context restored — reinit lite HDR pipeline');
      try {
        const r = reinitIkeaHdrAfterWebGlRestore(state.renderer);
        if (r?.ok) {
          state._webglContextLost = false;
          try {
            document.getElementById('cld-webgl-blocked')?.remove?.();
          } catch (_) {}
          console.warn('[HDR] reinit after restore OK', r);
          return;
        }
      } catch (e) {
        console.warn('[HDR] reinit after restore failed', e?.message || e);
      }
      state._webglContextLost = true;
      showWebGLBlockedOverlay(
        'WebGL восстановился, но HDR-pipeline не поднялся. ' +
          'Закройте вкладку и откройте комнату снова (лучше без F5 на той же вкладке).'
      );
    },
    false
  );

  container.appendChild(canvas);

  // Create container for scene icons (2D overlay, fixed positions)
  const iconsContainer = document.createElement('div');
  iconsContainer.id = 'scene-icons-container';
  iconsContainer.style.position = 'absolute';
  iconsContainer.style.top = '0';
  iconsContainer.style.left = '0';
  iconsContainer.style.width = '100%';
  iconsContainer.style.height = '100%';
  iconsContainer.style.pointerEvents = 'none';
  iconsContainer.style.overflow = 'hidden';
  iconsContainer.style.zIndex = '1000';
  container.appendChild(iconsContainer);
  state.sceneIconsContainer = iconsContainer;
  window.sceneIconsContainer = iconsContainer;
  
  console.log('✅ Рендерер создан');
  console.log('✅ Контейнер для иконок создан');
}


async function initEnvironment() {
  if (!state.scene) return;
  if (isIkeaRoomLightV0()) {
    try {
      await loadIkeaRoomEnvV0();
      console.warn('[IKEA v0] env OK · phase', auditIkeaV0Manifest().activePhase);
    } catch (e) {
      console.error('[IKEA v0] env failed', e);
    }
    return;
  }
  state.roomEnvIntensity = 0;
  state.betraktaEnvShCoeffs = null;
  if (state.scene.environment) {
    state.scene.environment.dispose?.();
    state.scene.environment = null;
  }
  if ('environmentIntensity' in state.scene) state.scene.environmentIntensity = 0;
}

function updateRendererSize() {
  const container = document.getElementById('canvas-container');
  if (!container || !state.renderer) {
    return;
  }
  const width = Math.max(1, container.clientWidth || 0);
  const height = Math.max(1, container.clientHeight || 0);
  state.renderer.setPixelRatio(getRoomRenderPixelRatio());
  state.renderer.setSize(width, height, false);
  if (state.composer) {
    safeComposerSetSize(state.composer, width, height);
  }
  if (state.ssaaPass && typeof state.ssaaPass.setSize === 'function') {
    state.ssaaPass.setSize(
      width * getRoomRenderPixelRatio(),
      height * getRoomRenderPixelRatio()
    );
  }
  if (state.sceneIconsContainer) {
    state.sceneIconsContainer.style.width = width + 'px';
    state.sceneIconsContainer.style.height = height + 'px';
  }
  if (state.camera) {
    if (state.camera.isOrthographicCamera) {
      if (typeof window.__cldSyncSceneViewOrthoFrustum === 'function') {
        window.__cldSyncSceneViewOrthoFrustum();
      } else {
        syncRoomEditPlanFrustum();
      }
    } else {
      state.camera.aspect = width / height;
      state.camera.updateProjectionMatrix();
    }
  }
}

function initLightsLegacy() {
  if (!state.scene || !state.camera) return;
  const preset = getRoomLightingPreset();
  applyRoomLightingPreset(preset, { sceneBackground: false, renderer: false });
  if (isIkeaLightFrozen()) {
    if (typeof window !== 'undefined') {
      window.__cldIkeaLightFrozenAudit = () =>
        auditIkeaLightBlocked(state.scene, {
          composer: state.composer,
          sceneEnvironment: state.scene?.environment,
        });
      window.__cldIkeaV0ManifestAudit = auditIkeaV0Manifest;
      window.__cldIkeaV0AuditLight = auditIkeaV0Light;
      window.__cldIkeaV0MaterialAudit = auditIkeaV0MaterialState;
    }
    console.warn('[IKEA] v0 room light · legacy Three lights off · preset=', preset.id);
    return;
  }
  console.log(`✅ Комната: пресет «${preset.label}»`);
}

function initRaycaster() {
  state.raycaster = new THREE.Raycaster();
  state.mouse = new THREE.Vector2();
  state.clock = new THREE.Clock();
  
  console.log('✅ Raycaster инициализирован');
}

function initRoom() {
  console.log('🏗️ Создание комнаты...');
  console.log('  Размеры (мм):', {
    width: ROOM_WIDTH,
    depth: ROOM_DEPTH,
    height: ROOM_HEIGHT
  });
  
  try {
    state.room = new Room(ROOM_WIDTH, ROOM_DEPTH, ROOM_HEIGHT);
    console.log('✅ Комната создана успешно');
    console.log('  Room.group:', state.room.group);
    console.log('  Room.group.children.length:', state.room.group.children.length);
  } catch (error) {
    console.error('❌ Ошибка при создании комнаты:', error);
    alert('Ошибка при создании комнаты: ' + error.message);
    throw error;
  }

  // Center room in scene - place room so its center is at world origin (0, 0, 0)
  // Room origin (front-left-bottom) should be at (-width/2, 0, -depth/2)
  const roomCenterX = state.room.width / 2;
  const roomCenterZ = state.room.depth / 2;

  // Center room in scene - move room so its center is at (0, height/2, 0)
  state.room.group.position.set(
    -roomCenterX, // Center room horizontally: move left by half width
    0, // Floor at y=0
    -roomCenterZ // Center room depth-wise: move back by half depth
  );

  console.log('➕ Добавление комнаты в сцену...');
  state.scene.add(state.room.group);
  state.wallPlanes = state.room.wallPlanes;
  console.log('✅ Комната добавлена в сцену');
  console.log('  wallPlanes.length:', state.wallPlanes.length);

  applyIkeaEmptyRoomCamera(state.room, state.camera);

  // Добавляем иконки на сцену (как на скриншоте)
  addSceneIcons();

  // Секции спят: пустая комната (код секций сохранён).
  if (state.kitchenSectionsEnabled === false) {
    try {
      clearAllCustomSections('init_sections_off');
    } catch (e) {
      console.warn('[SECTIONS] clear on init failed', e);
    }
  }

  // Update room bounds to account for wall thickness
  state.roomBounds = {
    minX: -WALL_THICKNESS / 2,
    maxX: state.room.width + WALL_THICKNESS / 2,
    minZ: -WALL_THICKNESS / 2,
    maxZ: state.room.depth + WALL_THICKNESS / 2,
    minY: 0,
    maxY: state.room.height,
  };
  
  console.log('✅ Границы комнаты установлены');

  try {
    patchSectionNicheDepthWrite(state.scene);
  } catch (e) {
    console.warn('[room] patchSectionNicheDepthWrite failed:', e);
  }
}

export { updateRendererSize };
