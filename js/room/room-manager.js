// Room manager module - handles room creation, editing, and dimension updates
// Main module for room operations

import * as THREE from 'three';
import { state, WALL_THICKNESS } from '../utils/state.js';
import { applyIkeaEmptyRoomCamera } from '../core/camera.js?v=20261109-orbitsmooth1';
import {
  updateRoomDimensionLabels,
  rebuildSectionZoneEditIconsForSection,
} from '../ui/scene-icons.js?v=20261116-dimsOff1';
import {
  mountRoomEditChrome,
  unmountRoomEditChrome,
  syncRoomEditAfterResize,
  enterKitchenShapePlanView,
} from './room-edit-toolbar.js?v=20261110-ikeaPort10';
import { reapplyRoomEditOpenings, snapshotOpeningsForReconcile, reconcileOpeningsAfterRoomChange } from './room-edit-openings.js?v=20261030-autosave2';
import {
  startPlacingSection,
  updateSectionGhostPosition,
} from '../sections/section-ghost.js?v=20261104-ghoststep1';
import { cancelSectionPlacement } from '../sections/section-manager.js?v=20261107-ucorner1';
import { computeSectionInnerBoundsU } from '../sections/section-edge-trim-insets.js?v=20261104-ghoststep1';
import {
  applyKitchenStraight600SacrificeWidths,
  applyKitchenLFreeArm600SacrificeWidths,
  isKitchenStraightBaseBandSection,
} from '../kitchen/kitchen-section-layout.js?v=20261118-overlayL6';
import {
  setKitchenBandGridsViewEnabled,
  setKitchenBandGridsViewBand,
  syncKitchenBandGridsView,
} from '../kitchen/kitchen-band-grids-view.js?v=20261116-cornerReset1';
// Свет комнаты только IKEA_PORT (boot в init). Форма комнаты свет не трогает.
import {
  KITCHEN_ROOM_TYPE,
  applyKitchenRoomShapeToRoom,
  createKitchenRoomShapeIcon,
  ensureKitchenStep1ShapesInConfig,
  footprintSpecForShape,
  getKitchenRoomShapes,
  isKitchenProductLineConfig,
  isKitchenRoomShapeKey,
  normalizeShapeOrient,
  shapeHasOrientVariants,
} from './kitchen-room-shapes.js?v=20261005-shape-orient1';
import { installKitchenRoomStepTools } from './kitchen-room-step-tools.js?v=20261010-ceiling-tiers2';
import { applyFootprintEdgeLengthCm } from './room-footprint.js?v=20261005-shape-orient1';

/**
 * Show edit room modal
 */
export function showEditRoomModal() {
  const modal = document.getElementById('edit-room-modal');
  if (!modal) return;
  
  // Set current room dimensions
  const widthInput = document.getElementById('room-width-input');
  const depthInput = document.getElementById('room-depth-input');
  const heightInput = document.getElementById('room-height-input');
  const heightSlider = document.getElementById('room-height-slider');
  
  if (widthInput && state.room) {
    widthInput.value = state.room.width / 10; // Convert mm to cm
  }
  if (depthInput && state.room) {
    depthInput.value = state.room.depth / 10;
  }
  if (heightInput && state.room) {
    heightInput.value = state.room.height / 10;
  }
  if (heightSlider && state.room) {
    heightSlider.value = state.room.height / 10;
  }
  
  // Sync slider and input for height (clamp только на change/blur — иначе набор 270 ломается).
  if (heightSlider && heightInput) {
    const newSlider = heightSlider.cloneNode(true);
    heightSlider.parentNode.replaceChild(newSlider, heightSlider);
    const newInput = heightInput.cloneNode(true);
    heightInput.parentNode.replaceChild(newInput, heightInput);

    const updatedSlider = document.getElementById('room-height-slider');
    const updatedInput = document.getElementById('room-height-input');
    const clampH = (raw) => {
      const n = parseInt(String(raw ?? '').trim(), 10);
      if (!Number.isFinite(n)) return null;
      return Math.max(200, Math.min(500, n));
    };

    updatedSlider.addEventListener('input', (e) => {
      updatedInput.value = e.target.value;
      updateRoomDimensions();
    });

    updatedInput.addEventListener('input', () => {
      const n = parseInt(String(updatedInput.value).trim(), 10);
      if (Number.isFinite(n) && n >= 200 && n <= 500) {
        updatedSlider.value = String(n);
        updateRoomDimensions();
      }
    });

    const commitHeight = () => {
      const v = clampH(updatedInput.value) ?? 250;
      updatedInput.value = String(v);
      updatedSlider.value = String(v);
      updateRoomDimensions();
    };
    updatedInput.addEventListener('change', commitHeight);
    updatedInput.addEventListener('blur', commitHeight);
  }
  
  // Размеры: bind один раз в kitchen-room-step-tools (select-all / max). Не clone.
  mountRoomEditChrome();
  window.__cldApplyRoomDimensions = updateRoomDimensions;
  updateRoomDimensionLabels();

  // Replace "Edit Room" button with "Done"
  if (window.editRoomButton) {
    const newButton = window.editRoomButton.cloneNode(true);
    window.editRoomButton.parentNode.replaceChild(newButton, window.editRoomButton);
    window.editRoomButton = newButton;
    
    window.editRoomButton.innerHTML = `<i class="fas fa-check" style="margin-right: 8px;"></i>Готово`;
    
    window.editRoomButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeEditRoomModal();
    });
  }
  
  modal.style.display = 'block';
  modal.classList.add('is-open');
  
  // Close on outside click
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeEditRoomModal();
    }
  };
}

/**
 * Close edit room modal
 */
export function closeEditRoomModal() {
  window.__cldRoomDimEditing = null;
  window.__cldApplyRoomDimensions = null;
  unmountRoomEditChrome();
  const modal = document.getElementById('edit-room-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('is-open');
  }
  
  // Show ceiling again
  if (state.room && state.room.walls && state.room.walls.ceiling) {
    state.room.walls.ceiling.visible = true;
  }
  state.room.group.traverse(child => {
    if (child.userData && child.userData.isCeiling) {
      child.visible = true;
    }
  });
  
  // Remove dimension labels + outer dim SVG ticks
  if (window.roomDimensionLabels) {
    window.roomDimensionLabels.forEach(label => {
      if (label && label.parentNode) {
        label.parentNode.removeChild(label);
      }
    });
    window.roomDimensionLabels = [];
  }
  window.__cldRoomOuterDimSegs = [];
  const outerLayer = document.getElementById('cld-room-outer-dim-lines');
  if (outerLayer) outerLayer.replaceChildren();
  
  // После 2D-плана («Сверху») обязательно вернуть 3D — иначе applyIkea
  // откажется сбивать орто-пресет (scene_ortho_preset).
  try {
    if (typeof window.__cldSetSceneViewPreset === 'function') {
      window.__cldSetSceneViewPreset('3d');
    } else {
      applyIkeaEmptyRoomCamera(state.room, state.camera, { intro: false, force3d: true });
    }
  } catch (_) {
    applyIkeaEmptyRoomCamera(state.room, state.camera, { intro: false, force3d: true });
  }
  if (state.controls && state.controls.update && state.initialCameraTarget) {
    state.controls.target.copy(state.initialCameraTarget);
    state.controls.update();
  }
  console.log('📷 Камера восстановлена в 3D');
  
  // Restore "Edit Room" button
  if (window.editRoomButton) {
    const newButton = window.editRoomButton.cloneNode(true);
    window.editRoomButton.parentNode.replaceChild(newButton, window.editRoomButton);
    window.editRoomButton = newButton;
    
    window.editRoomButton.innerHTML = `<i class="fas fa-pencil-alt" aria-hidden="true"></i>Изменить комнату`;
    
    window.editRoomButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showEditRoomModal();
    });
  }
}

/**
 * Update room dimensions based on input values
 */
/**
 * Пересобрать комнату с footprint выбранной формы кухни.
 * width/depth/height берутся из текущей Room / инпутов.
 */
/**
 * @param {string} shapeKey
 * @param {{ quiet?: boolean }} [opts] quiet=true — без сброса камеры/remount (live-drag стены)
 */
export function recreateRoomWithShape(shapeKey, opts) {
  const quiet = !!(opts && opts.quiet);
  const key = String(shapeKey || 'enclosed_rect').trim();
  if (!state.scene) return false;

  let newWidth = state.room?.width;
  let newDepth = state.room?.depth;
  let newHeight = state.room?.height;
  try {
    const widthInput = document.getElementById('room-width-input');
    const depthInput = document.getElementById('room-depth-input');
    const heightInput = document.getElementById('room-height-input');
    if (widthInput) newWidth = parseFloat(widthInput.value) * 10;
    if (depthInput) newDepth = parseFloat(depthInput.value) * 10;
    if (heightInput) newHeight = parseFloat(heightInput.value) * 10;
  } catch (_) {}
  if (!Number.isFinite(newWidth) || newWidth < 1000) newWidth = 5000;
  if (!Number.isFinite(newDepth) || newDepth < 1000) newDepth = 4000;
  if (!Number.isFinite(newHeight) || newHeight < 2000) newHeight = 2500;

  // Смена формы — сброс params; иначе сохраняем вырез/срез
  const prevKey = state.kitchenRoomShapeKey || state.room?.shapeKey;
  if (prevKey && prevKey !== key) {
    state.kitchenFootprintParams = null;
  }
  const params = state.kitchenFootprintParams || null;
  const footprint = footprintSpecForShape(key, newWidth, newDepth, params);
  state.kitchenFootprintParams = footprint.params || null;

  // До уничтожения комнаты — снимок проёмов (влазит → перенос, нет → удаление)
  let openingSnap = [];
  try {
    openingSnap = snapshotOpeningsForReconcile();
  } catch (_) {
    openingSnap = Array.isArray(state.roomEditOpenings) ? state.roomEditOpenings.slice() : [];
  }

  if (state.room && state.room.group) {
    state.scene.remove(state.room.group);
    state.room.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    });
  }

  try {
    state.room = new Room(newWidth, newDepth, newHeight, {
      footprint,
      shapeKey: key,
    });
    const roomCenterX = state.room.width / 2;
    const roomCenterZ = state.room.depth / 2;
    state.room.group.position.set(-roomCenterX, 0, -roomCenterZ);
    state.scene.add(state.room.group);
    try {
      if (typeof state.room.applyInteriorWalls === 'function') {
        state.room.applyInteriorWalls(
          Array.isArray(state.kitchenInteriorWalls) ? state.kitchenInteriorWalls : []
        );
      }
    } catch (e) {
      console.warn('[kitchen] applyInteriorWalls', e);
    }
    state.wallPlanes = state.room.wallPlanes;
    state.kitchenRoomShapeKey = key;

    state.room.applyStaticRoomAoMaterials?.();

    state.roomBounds = {
      minX: -WALL_THICKNESS / 2,
      maxX: state.room.width + WALL_THICKNESS / 2,
      minZ: -WALL_THICKNESS / 2,
      maxZ: state.room.depth + WALL_THICKNESS / 2,
    };

    if (state.room.walls && state.room.walls.ceiling) {
      state.room.walls.ceiling.visible = false;
    }

    try {
      reconcileOpeningsAfterRoomChange(openingSnap);
    } catch (e) {
      console.warn('[kitchen] reconcile openings', e);
      state.roomEditOpenings = [];
      if (typeof state.room.applyOpenings === 'function') state.room.applyOpenings([]);
      try {
        reapplyRoomEditOpenings();
      } catch (_) {}
    }

    try {
      updateRoomDimensionLabels();
    } catch (_) {}
    try {
      if (typeof window.__cldRefreshKitchenEdgeDimsPanel === 'function') {
        window.__cldRefreshKitchenEdgeDimsPanel();
      }
    } catch (_) {}
    try {
      if (typeof window.__cldRefreshKitchenCeilingSlopes === 'function') {
        window.__cldRefreshKitchenCeilingSlopes();
      }
    } catch (_) {}
    try {
      syncRoomEditAfterResize();
    } catch (_) {}
    if (quiet) {
      // Live-drag: только план-цвета + размеры, камеру не трогаем
      try {
        if (window.__cldKitchenShapePlan && typeof window.__cldApplyKitchenPlanColorsQuiet === 'function') {
          window.__cldApplyKitchenPlanColorsQuiet();
        }
      } catch (_) {}
      try {
        if (typeof window.__cldRemountKitchenWallEditSelection === 'function') {
          window.__cldRemountKitchenWallEditSelection();
        }
      } catch (_) {}
    } else {
      try {
        enterKitchenShapePlanView();
      } catch (e) {
        console.warn('[kitchen shape] plan 2d failed', e);
      }
    }

    console.warn('[kitchen shape] room rebuilt ·', key, 'segs=', footprint.segments.length, quiet ? '(quiet)' : '');
    try {
      const eng =
        typeof window !== 'undefined' ? window.__cldKitchenBaseEngine : null;
      if (eng && typeof eng.applyKitchenCeilingTiersToScene === 'function') {
        eng.applyKitchenCeilingTiersToScene();
      }
    } catch (e) {
      console.warn('[kitchen] ceiling tiers after shape rebuild', e);
    }
    // Stage5: не на quiet (restore/fixture) и не во время промежуточного rebuild UI.
    if (!quiet) {
      try {
        if (typeof window !== 'undefined' && typeof window.__cldMarkRoomDraftDirty === 'function') {
          window.__cldMarkRoomDraftDirty('room_shape');
        }
      } catch (_) {}
    }
    return true;
  } catch (error) {
    console.error('❌ recreateRoomWithShape failed', error);
    return false;
  }
}

if (typeof window !== 'undefined') {
  window.__cldRecreateRoomWithShape = recreateRoomWithShape;
  window.__cldApplyRoomDimensions = updateRoomDimensions;
  window.__cldApplyRoomEdgeLength = applyRoomEdgeLength;
}

/** Правка длины одного ребра (см) — как клик по размеру у IKEA. */
export function applyRoomEdgeLength(edgeIndex, lengthCm) {
  if (!state.room || !state.scene) return false;
  const shapeKey =
    state.kitchenRoomShapeKey ||
    state.room.shapeKey ||
    window.selectedKitchenRoomShape?.key ||
    'enclosed_rect';
  const curParams =
    state.kitchenFootprintParams ||
    state.room.footprintSpec?.params ||
    null;
  const next = applyFootprintEdgeLengthCm(
    shapeKey,
    state.room.width,
    state.room.depth,
    curParams,
    edgeIndex,
    lengthCm
  );
  if (!next) return false;

  state.kitchenFootprintParams = next.params;
  const wEl = document.getElementById('room-width-input');
  const dEl = document.getElementById('room-depth-input');
  if (wEl) wEl.value = String(Math.round(next.width / 10));
  if (dEl) dEl.value = String(Math.round(next.depth / 10));

  // Пересобрать с новыми AABB + params
  return recreateRoomWithShape(shapeKey);
}

export function updateRoomDimensions() {
  const widthInput = document.getElementById('room-width-input');
  const depthInput = document.getElementById('room-depth-input');
  const heightInput = document.getElementById('room-height-input');
  
  if (!widthInput || !depthInput || !heightInput) return;
  
  const newWidth = parseFloat(widthInput.value) * 10; // Convert cm to mm
  const newDepth = parseFloat(depthInput.value) * 10;
  const newHeight = parseFloat(heightInput.value) * 10;
  
  if (isNaN(newWidth) || isNaN(newDepth) || isNaN(newHeight)) return;
  if (newWidth < 1000 || newDepth < 1000 || newHeight < 2000) return; // Min dimensions

  const shapeKey =
    (typeof window !== 'undefined' && window.selectedKitchenRoomShape?.key) ||
    state.kitchenRoomShapeKey ||
    'enclosed_rect';

  let openingSnap = [];
  try {
    openingSnap = snapshotOpeningsForReconcile();
  } catch (_) {
    openingSnap = Array.isArray(state.roomEditOpenings) ? state.roomEditOpenings.slice() : [];
  }

  // Remove old room
  if (state.room && state.room.group) {
    state.scene.remove(state.room.group);
    // Clean up resources
    state.room.group.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
  
  // Create new room with new dimensions (+ footprint формы)
  try {
    const params = state.kitchenFootprintParams || null;
    const footprint = footprintSpecForShape(shapeKey, newWidth, newDepth, params);
    state.kitchenFootprintParams = footprint.params || null;
    state.room = new Room(newWidth, newDepth, newHeight, {
      footprint,
      shapeKey,
    });
    
    // Center room
    const roomCenterX = state.room.width / 2;
    const roomCenterZ = state.room.depth / 2;
    state.room.group.position.set(-roomCenterX, 0, -roomCenterZ);
    
    state.scene.add(state.room.group);
    try {
      if (typeof state.room.applyInteriorWalls === 'function') {
        state.room.applyInteriorWalls(
          Array.isArray(state.kitchenInteriorWalls) ? state.kitchenInteriorWalls : []
        );
      }
    } catch (e) {
      console.warn('[kitchen] applyInteriorWalls after resize', e);
    }
    state.wallPlanes = state.room.wallPlanes;
    state.room.applyStaticRoomAoMaterials?.();

    // Update room bounds
    state.roomBounds = {
      minX: -WALL_THICKNESS / 2,
      maxX: state.room.width + WALL_THICKNESS / 2,
      minZ: -WALL_THICKNESS / 2,
      maxZ: state.room.depth + WALL_THICKNESS / 2,
    };
    
    // Hide ceiling
    if (state.room.walls && state.room.walls.ceiling) {
      state.room.walls.ceiling.visible = false;
    }
    
    // Update dimension labels
    updateRoomDimensionLabels();
    try {
      if (typeof window.__cldRefreshKitchenEdgeDimsPanel === 'function') {
        window.__cldRefreshKitchenEdgeDimsPanel();
      }
    } catch (_) {}
    syncRoomEditAfterResize();
    try {
      reconcileOpeningsAfterRoomChange(openingSnap);
    } catch (e) {
      console.warn('[kitchen] reconcile openings after resize', e);
      state.roomEditOpenings = [];
      reapplyRoomEditOpenings();
    }
    
    console.log('✅ Размеры комнаты обновлены:', {
      width: newWidth + 'мм',
      depth: newDepth + 'мм',
      height: newHeight + 'мм',
      shape: shapeKey
    });
    try {
      const eng =
        typeof window !== 'undefined' ? window.__cldKitchenBaseEngine : null;
      if (eng && typeof eng.applyKitchenCeilingTiersToScene === 'function') {
        eng.applyKitchenCeilingTiersToScene();
      }
    } catch (e) {
      console.warn('[kitchen] ceiling tiers after room resize', e);
    }
    try {
      if (typeof window !== 'undefined' && typeof window.__cldMarkRoomDraftDirty === 'function') {
        window.__cldMarkRoomDraftDirty('room_dimensions');
      }
    } catch (_) {}
  } catch (error) {
    console.error('❌ Ошибка обновления размеров комнаты:', error);
  }
}

/**
 * Local photo path for a room-type card (admin «Управление комнатой 2» → image).
 * Font Awesome / shape keys are not photos.
 */
function isRoomTypePhotoSrc(val) {
  const v = String(val || '').trim();
  if (!v) return false;
  if (/^fa[- ]/i.test(v) || v.indexOf('shape:') === 0) return false;
  if (/^javascript:/i.test(v)) return false;
  return v.charAt(0) === '/' || v.indexOf('./') === 0 || /^data:image\//i.test(v);
}

function roomTypePhotoGridColumns(n) {
  if (n === 1) return 'minmax(0, 1fr)';
  if (n === 3) return 'repeat(3, minmax(0, 1fr))';
  return 'repeat(2, minmax(0, 1fr))';
}

function readRoomStepsConfigLocal() {
  try {
    const raw = localStorage.getItem('room_steps_config');
    if (raw) {
      const c = JSON.parse(raw);
      if (c && c.steps && c.steps.length) return c;
    }
  } catch (e) {}
  return null;
}

/**
 * Кухня: шаг 1 = форма пространства (IKEA), selectedRoomType всегда kitchen.
 */
function buildKitchenRoomShapeStep(container) {
  let config = readRoomStepsConfigLocal() || { productLine: 'kitchen', steps: [] };
  ensureKitchenStep1ShapesInConfig(config);
  try {
    localStorage.setItem('room_steps_config', JSON.stringify(config));
  } catch (_) {}

  const shapes = getKitchenRoomShapes(config);
  const step1 = config.steps.find((s) => Number(s?.stepId) === 1);
  let columnsPerRow = 3;
  if (step1 && (step1.columnsPerRow === 1 || step1.columnsPerRow === 2 || step1.columnsPerRow === 3)) {
    columnsPerRow = step1.columnsPerRow;
  }

  const wrap = document.createElement('div');
  wrap.className = 'kitchen-room-shapes';

  const hint = document.createElement('p');
  hint.className = 'kitchen-room-shapes__hint';
  hint.textContent = 'Выберите форму. Размеры, двери и окна — вкладки сверху; на плане кликайте размеры.';
  wrap.appendChild(hint);

  const groups = [
    { id: 'enclosed', label: 'Закрытая кухня' },
    { id: 'open', label: 'Открытая кухня' },
  ];

  const selectedKey =
    (window.selectedKitchenRoomShape && window.selectedKitchenRoomShape.key) ||
    (isKitchenRoomShapeKey(window.selectedRoomType?.key) ? window.selectedRoomType.key : '');

  const currentOrient = normalizeShapeOrient(
    state.kitchenFootprintParams && state.kitchenFootprintParams.orient
  );

  const orientsWrap = document.createElement('div');
  orientsWrap.className = 'kitchen-shape-orients';
  orientsWrap.hidden = true;
  const orientsTitle = document.createElement('div');
  orientsTitle.className = 'kitchen-shape-orients__title';
  orientsTitle.textContent = 'Вариант';
  orientsWrap.appendChild(orientsTitle);
  const orientsRow = document.createElement('div');
  orientsRow.className = 'kitchen-shape-orients__row';
  orientsWrap.appendChild(orientsRow);

  // Сразу под подсказкой — на виду при выборе формы с углами
  wrap.appendChild(orientsWrap);

  function syncOrientPicker(shapeKey, selectedOrient) {
    const key = String(shapeKey || '');
    orientsRow.replaceChildren();
    if (!shapeHasOrientVariants(key)) {
      orientsWrap.hidden = true;
      return;
    }
    orientsWrap.hidden = false;
    const sel = normalizeShapeOrient(selectedOrient);
    for (let o = 0; o < 4; o++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'kitchen-shape-orient-btn' + (o === sel ? ' selected' : '');
      btn.dataset.orient = String(o);
      btn.setAttribute('aria-label', 'Вариант ' + (o + 1));
      btn.setAttribute('aria-pressed', o === sel ? 'true' : 'false');
      btn.innerHTML =
        '<span class="kitchen-shape-orient-btn__icon">' +
        createKitchenRoomShapeIcon(key, 56, o) +
        '</span>';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        applyShapeOrient(key, o);
      });
      orientsRow.appendChild(btn);
    }
  }

  function applyShapeOrient(shapeKey, orient) {
    const o = normalizeShapeOrient(orient);
    const prev = state.kitchenFootprintParams || {};
    state.kitchenFootprintParams = { ...prev, orient: o };
    applyKitchenRoomShapeToRoom(shapeKey);
    syncOrientPicker(shapeKey, o);
    try {
      if (typeof window.__cldEnterKitchenShapePlanView === 'function') {
        window.__cldEnterKitchenShapePlanView();
      }
    } catch (_) {}
  }

  groups.forEach((g) => {
    const groupShapes = shapes.filter((s) => String(s.group || '') === g.id);
    if (!groupShapes.length) return;

    const section = document.createElement('div');
    section.className = 'kitchen-room-shapes__section';
    const h = document.createElement('div');
    h.className = 'kitchen-room-shapes__section-title';
    h.textContent = g.label;
    section.appendChild(h);

    const grid = document.createElement('div');
    grid.className = 'room-types-grid kitchen-room-shapes__grid';
    grid.style.gridTemplateColumns = roomTypePhotoGridColumns(columnsPerRow);
    grid.setAttribute('data-cols', String(columnsPerRow));

    groupShapes.forEach((shape) => {
      const item = document.createElement('div');
      item.className = 'room-type-item room-layout-card room-layout-card--scheme kitchen-room-shape-card';
      item.dataset.roomShape = shape.key;
      item.dataset.roomType = 'kitchen';
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      item.setAttribute('aria-pressed', 'false');
      item.setAttribute('aria-label', shape.name || shape.key);

      const title = String(shape.name || '').replace(/</g, '&lt;');
      const desc = String(shape.desc || '').replace(/</g, '&lt;');
      item.innerHTML =
        '<div class="room-type-icon room-layout-preview room-layout-preview--scheme">' +
        createKitchenRoomShapeIcon(shape.key, 112) +
        '<span class="room-layout-selected-indicator" aria-hidden="true"></span>' +
        '</div>' +
        '<div class="room-layout-meta">' +
        '<div class="room-type-name room-layout-name">' +
        title +
        '</div>' +
        (desc ? '<div class="room-layout-desc">' + desc + '</div>' : '') +
        '</div>';

      function selectThisShape() {
        wrap.querySelectorAll('.kitchen-room-shape-card').forEach((el) => {
          el.classList.remove('selected');
          el.setAttribute('aria-pressed', 'false');
        });
        item.classList.add('selected');
        item.setAttribute('aria-pressed', 'true');
        window.selectedRoomType = {
          ...KITCHEN_ROOM_TYPE,
          shapeKey: shape.key,
          shapeName: shape.name,
        };
        window.selectedKitchenRoomShape = {
          key: shape.key,
          name: shape.name,
          group: shape.group,
        };
        // Новая форма — orient 0; смена ключа сбрасывает params в recreate
        applyKitchenRoomShapeToRoom(shape.key);
        const o = normalizeShapeOrient(state.kitchenFootprintParams?.orient);
        syncOrientPicker(shape.key, o);
        try {
          if (typeof window.__cldEnterKitchenShapePlanView === 'function') {
            window.__cldEnterKitchenShapePlanView();
          }
        } catch (_) {}
        const nextBtn = document.getElementById('sidebar-next-btn');
        if (nextBtn) nextBtn.disabled = false;
        const floatNext = document.getElementById('cld-step-float-next');
        if (floatNext) floatNext.disabled = false;
      }

      item.addEventListener('click', selectThisShape);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectThisShape();
        }
      });

      if (selectedKey && selectedKey === shape.key) {
        item.classList.add('selected');
        item.setAttribute('aria-pressed', 'true');
        window.selectedRoomType = {
          ...KITCHEN_ROOM_TYPE,
          shapeKey: shape.key,
          shapeName: shape.name,
        };
      }

      grid.appendChild(item);
    });

    section.appendChild(grid);
    wrap.appendChild(section);
  });

  if (selectedKey) syncOrientPicker(selectedKey, currentOrient);

  container.appendChild(wrap);

  try {
    installKitchenRoomStepTools(container, wrap);
  } catch (e) {
    console.warn('[kitchen] step tools', e);
  }

  if (window.selectedRoomType && window.selectedRoomType.key === 'kitchen') {
    const nextBtn = document.getElementById('sidebar-next-btn');
    if (nextBtn && selectedKey) nextBtn.disabled = false;
  }
}

/**
 * Build room type selection step (for wizard)
 * @param {HTMLElement} container - Container element
 */
export function buildRoomTypeStep(container) {
  const config = readRoomStepsConfigLocal();
  if (isKitchenProductLineConfig(config)) {
    buildKitchenRoomShapeStep(container);
    return;
  }

  // Extracted from legacy main.js (buildRoomTypeStep)
  let roomTypes = [
    { name: 'Гостиная', icon: 'fa-couch', key: 'living-room', image: '' },
    { name: 'Спальня', icon: 'fa-bed', key: 'bedroom', image: '' },
    { name: 'Детская', icon: 'fa-child', key: 'nursery', image: '' },
    { name: 'Прихожая', icon: 'fa-door-open', key: 'hallway', image: '' },
    { name: 'Постирочная', icon: 'fa-tshirt', key: 'laundry', image: '' },
    { name: 'Балкон', icon: 'fa-home', key: 'balcony', image: '' }
  ];

  let step1 = null;
  if (config && config.steps) {
    step1 = config.steps.find(function (s) {
      return s.stepId === 1;
    }) || config.steps[0];
    if (step1 && step1.items && step1.items.length > 0) {
      roomTypes = step1.items
        .sort(function (a, b) {
          return (a.order || 0) - (b.order || 0);
        })
        .map(function (it) {
          return {
            name: it.name || 'Пункт',
            icon: it.icon || 'fa-circle',
            image: it.image || '',
            key: it.key || 'item-' + it.id,
            categoryId: it.categoryId || null
          };
        });
    }
  }

  const grid = document.createElement('div');
  grid.className = 'room-types-grid room-type-photos';

  let columnsPerRow = 2;
  if (step1 && (step1.columnsPerRow === 1 || step1.columnsPerRow === 2 || step1.columnsPerRow === 3)) {
    columnsPerRow = step1.columnsPerRow;
  }
  grid.style.gridTemplateColumns = roomTypePhotoGridColumns(columnsPerRow);
  grid.setAttribute('data-cols', String(columnsPerRow));

  roomTypes.forEach(function (roomType) {
    const item = document.createElement('div');
    item.className = 'room-type-item';
    item.dataset.roomType = roomType.key;
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-pressed', 'false');

    const title = (roomType.name || '').replace(/</g, '&lt;');
    const photoSrc = isRoomTypePhotoSrc(roomType.image) ? String(roomType.image).trim() : '';
    const imgHtml = photoSrc
      ? '<img src="' +
        photoSrc.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;') +
        '" alt="' +
        title +
        '" onerror="this.remove()">'
      : '';

    item.innerHTML =
      '<div class="room-type-image">' +
      imgHtml +
      '<span class="room-type-selected-indicator" aria-hidden="true"><i class="fas fa-check"></i></span>' +
      '</div>' +
      '<div class="room-type-name">' +
      title +
      '</div>';

    function selectThisRoomType() {
      grid
        .querySelectorAll('.room-type-item')
        .forEach(function (i) {
          i.classList.remove('selected');
          i.setAttribute('aria-pressed', 'false');
        });
      item.classList.add('selected');
      item.setAttribute('aria-pressed', 'true');
      window.selectedRoomType = roomType;
      const nextBtn = document.getElementById('sidebar-next-btn');
      if (nextBtn) nextBtn.disabled = false;
    }

    item.addEventListener('click', selectThisRoomType);
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectThisRoomType();
      }
    });

    grid.appendChild(item);
  });

  container.appendChild(grid);
}

/**
 * Build room layout selection step (for wizard)
 * @param {HTMLElement} container - Container element
 */
export function buildRoomLayoutStep(container) {
  // Карточки только на шаге 2: при пересборке панели не гасим ячейки в сцене.
  removeStraightComposePanelDom();
  // Секции спят: без раскладок прогонов — пустая комната.
  if (state.kitchenSectionsEnabled === false) {
    container.innerHTML = '';
    const note = document.createElement('p');
    note.className = 'sections-sleep-note';
    note.style.cssText = 'padding:12px 8px;opacity:0.85;line-height:1.45;margin:0;';
    note.textContent =
      'Секции обклада выключены. Комната пустая — модули к стенам без прогонов. Секции вернём отдельно, если решим.';
    container.appendChild(note);
    const nextBtn = document.getElementById('sidebar-next-btn');
    if (nextBtn) nextBtn.disabled = false;
    return;
  }
  // Extracted from legacy main.js (buildRoomLayoutStep)
  // User-facing labels only — keys/shapes unchanged.
  const LAYOUT_UI_BY_KEY = {
    'top-wall': { label: 'Прямая', desc: 'Вдоль одной стены' },
    'corner-wardrobe': { label: 'Угловая справа', desc: 'По двум стенам' },
    'top-right': { label: 'Угловая справа', desc: 'По двум стенам' },
    'corner-wardrobe-left': { label: 'Угловая слева', desc: 'По двум стенам' },
    'top-left': { label: 'Угловая слева', desc: 'По двум стенам' },
    'top-right-bottom-partition': { label: 'П-образная', desc: 'По трём стенам' },
  };

  function resolveLayoutUi(layout) {
    const mapped = LAYOUT_UI_BY_KEY[layout.key] || LAYOUT_UI_BY_KEY[layout.shape];
    if (mapped) return mapped;
    return { label: layout.name || 'Раскладка', desc: '' };
  }

  let layouts = [
    { name: 'Верхняя стена', key: 'top-wall', shape: 'top-wall' },
    { name: 'Угловой шкаф (задняя+правая)', key: 'corner-wardrobe', shape: 'top-right' },
    { name: 'Угловой шкаф (задняя+левая)', key: 'corner-wardrobe-left', shape: 'top-left' },
    {
      name: 'П-образная',
      key: 'top-right-bottom-partition',
      shape: 'top-right-bottom-partition'
    }
  ];

  const config = (() => {
    try {
      const raw = localStorage.getItem('room_steps_config');
      if (raw) {
        const c = JSON.parse(raw);
        if (c && c.steps && c.steps.length) return c;
      }
    } catch (e) {}
    return null;
  })();

  if (config && config.steps) {
    const step2 = config.steps.find(function (s) {
      return s.stepId === 2;
    });
    if (step2 && step2.items && step2.items.length > 0) {
      layouts = step2.items
        .sort(function (a, b) {
          return (a.order || 0) - (b.order || 0);
        })
        .map(function (it) {
          const icon = (it.icon || '').trim();
          const shape =
            icon.indexOf('shape:') === 0 ? icon.slice(6) : it.key || '';
          return {
            name: it.name || 'Пункт',
            key: it.key || 'item-' + it.id,
            shape: shape || 'top-wall',
            icon: icon
          };
        });

      // Старые конфиги шага 2 могут не содержать новый лейаут corner-wardrobe-left.
      // Аккуратно добавляем его рядом с corner-wardrobe, не меняя остальной порядок.
      if (!layouts.some(function (l) { return l.key === 'corner-wardrobe-left'; })) {
        var insertAfter = layouts.findIndex(function (l) {
          return l.key === 'corner-wardrobe' || l.key === 'top-right';
        });
        var newLayout = {
          name: 'Угловой шкаф (задняя+левая)',
          key: 'corner-wardrobe-left',
          shape: 'top-left',
          icon: 'shape:top-left'
        };
        if (insertAfter >= 0) {
          layouts.splice(insertAfter + 1, 0, newLayout);
        } else {
          layouts.unshift(newLayout);
        }
      }
      // П-образная: если в старом конфиге нет — добавляем после углов.
      if (!layouts.some(function (l) { return l.key === 'top-right-bottom-partition'; })) {
        var insertUAfter = layouts.findIndex(function (l) {
          return l.key === 'corner-wardrobe-left' || l.key === 'top-left';
        });
        if (insertUAfter < 0) {
          insertUAfter = layouts.findIndex(function (l) {
            return l.key === 'corner-wardrobe' || l.key === 'top-right';
          });
        }
        var uLayout = {
          name: 'П-образная',
          key: 'top-right-bottom-partition',
          shape: 'top-right-bottom-partition',
          icon: 'shape:top-right-bottom-partition'
        };
        if (insertUAfter >= 0) {
          layouts.splice(insertUAfter + 1, 0, uLayout);
        } else {
          layouts.push(uLayout);
        }
      }
    }
  }

  const tagsApi =
    typeof window !== 'undefined' ? window.__cldRoomFurnitureTags : null;
  const roomKeyForFilter =
    typeof window !== 'undefined' && window.selectedRoomType
      ? window.selectedRoomType.key
      : null;
  if (tagsApi && typeof tagsApi.filterStep2Layouts === 'function' && layouts.length > 0) {
    layouts = tagsApi.filterStep2Layouts(layouts, roomKeyForFilter, config);
  }

  // Временный debug-режим: оставляем только один прямой и два угловых пресета.
  const debugSimpleLayouts =
    typeof window !== 'undefined' &&
    (window.DEBUG_ONLY_BACK_STRAIGHT_SECTION === true ||
      window.DEBUG_SIMPLE_LAYOUTS === true);
  if (debugSimpleLayouts) {
    const allowedKeys = new Set([
      'top-wall',
      'corner-wardrobe',
      'top-right',
      'corner-wardrobe-left',
      'top-left',
      'top-right-bottom-partition',
    ]);
    layouts = layouts.filter((l) => allowedKeys.has(l.key));
  }

  const sectionTitle = document.createElement('h3');
  sectionTitle.className = 'room-layout-section-title';
  sectionTitle.textContent = 'Выберите расположение';
  container.appendChild(sectionTitle);

  const grid = document.createElement('div');
  grid.className = 'room-types-grid room-layout-grid';
  grid.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';

  function createLayoutIcon(shapeType) {
    const size = 64;
    const margin = 4;
    const wallThickness = 9;

    const outerRect = `M ${margin} ${margin} L ${size - margin} ${margin} L ${
      size - margin
    } ${size - margin} L ${margin} ${size - margin} Z`;

    let walls = '';
    let partition = '';

    switch (shapeType) {
      case 'top-wall':
        walls = `<rect x="${margin}" y="${margin}" width="${
          size - margin * 2
        }" height="${wallThickness}"/>`;
        break;
      case 'top-right':
        walls = `<rect x="${margin}" y="${margin}" width="${
          size - margin * 2
        }" height="${wallThickness}"/>
                 <rect x="${
                   size - margin - wallThickness
                 }" y="${margin}" width="${wallThickness}" height="${
          size - margin * 2
        }"/>`;
        break;
      case 'top-left':
        walls = `<rect x="${margin}" y="${margin}" width="${
          size - margin * 2
        }" height="${wallThickness}"/>
                 <rect x="${margin}" y="${margin}" width="${wallThickness}" height="${
          size - margin * 2
        }"/>`;
        break;
      case 'top-partition': {
        walls = `<rect x="${margin}" y="${margin}" width="${
          size - margin * 2
        }" height="${wallThickness}"/>`;
        const partitionMargin = (size - margin * 2) / 4;
        partition = `<rect x="${
          margin + partitionMargin
        }" y="${size / 2}" width="${
          size - margin * 2 - partitionMargin * 2
        }" height="${wallThickness}"/>`;
        break;
      }
      case 'left-bottom':
        walls = `<rect x="${margin}" y="${margin}" width="${wallThickness}" height="${
          size - margin * 2
        }"/>
                 <rect x="${margin}" y="${
          size - margin - wallThickness
        }" width="${size - margin * 2}" height="${wallThickness}"/>`;
        break;
      case 'top-left-partition': {
        walls = `<rect x="${margin}" y="${margin}" width="${
          size - margin * 2
        }" height="${wallThickness}"/>
                 <rect x="${margin}" y="${margin}" width="${wallThickness}" height="${
          size - margin * 2
        }"/>`;
        const partitionMargin2 = (size - margin * 2) / 4;
        partition = `<rect x="${
          margin + partitionMargin2
        }" y="${size / 2}" width="${
          size - margin * 2 - partitionMargin2 * 2
        }" height="${wallThickness}"/>`;
        break;
      }
      case 'top-right-bottom-partition': {
        // П-образная: задняя + левая + правая (открыта вперёд). Ключ исторический.
        walls = `<rect x="${margin}" y="${margin}" width="${
          size - margin * 2
        }" height="${wallThickness}"/>
                 <rect x="${margin}" y="${margin}" width="${wallThickness}" height="${
          size - margin * 2
        }"/>
                 <rect x="${
                   size - margin - wallThickness
                 }" y="${margin}" width="${wallThickness}" height="${
          size - margin * 2
        }"/>`;
        break;
      }
      default:
        walls = '';
    }

    return `
      <svg class="room-layout-scheme" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
        <path class="room-layout-scheme__room" d="${outerRect}" />
        <g class="room-layout-scheme__furniture">
        ${walls}
        ${partition}
        </g>
      </svg>
    `;
  }

  layouts.forEach((layout) => {
    const item = document.createElement('div');
    item.className = 'room-type-item room-layout-card';
    item.dataset.layoutType = layout.key;
    item.setAttribute('role', 'button');
    item.tabIndex = 0;
    const ui = resolveLayoutUi(layout);
    item.setAttribute('aria-label', ui.label);
    const candidates = [layout.icon, layout.image, layout.iconUrl, layout.img];
    let imgSrc = '';
    for (let ci = 0; ci < candidates.length; ci++) {
      const v = String(candidates[ci] || '').trim();
      if (!v || v.indexOf('shape:') === 0) continue;
      if (/^https?:\/\//i.test(v) || v.charAt(0) === '/') {
        imgSrc = v;
        break;
      }
    }
    const isImg = !!imgSrc;
    /** Кириллица/пробелы в /files/... — кодируем сегменты пути. */
    function encodeFilesUrl(url) {
      if (!url || /^https?:\/\//i.test(url)) return url;
      try {
        return String(url)
          .split('/')
          .map(function (seg, i) {
            if (i === 0 && seg === '') return '';
            try {
              return encodeURIComponent(decodeURIComponent(seg));
            } catch (_) {
              return encodeURIComponent(seg);
            }
          })
          .join('/');
      } catch (_) {
        return url;
      }
    }
    const previewInner = isImg
      ? '<img src="' +
        encodeFilesUrl(imgSrc).replace(/"/g, '&quot;') +
        '" alt="" class="room-layout-preview__img" decoding="async">'
      : '<div class="room-layout-preview__scheme">' +
        createLayoutIcon(layout.shape) +
        '</div>';

    item.className =
      'room-type-item room-layout-card' +
      (isImg ? ' room-layout-card--photo' : ' room-layout-card--scheme');

    if (isImg) {
      // Есть image: вся карточка = картинка, без названия/описания и без .room-type-icon.
      item.innerHTML =
        '<img src="' +
        encodeFilesUrl(imgSrc).replace(/"/g, '&quot;') +
        '" alt="" class="room-layout-card__photo" decoding="async">' +
        '<span class="room-layout-selected-indicator" aria-hidden="true"></span>';
    } else {
      const descHtml = ui.desc
        ? '<div class="room-layout-desc">' +
          String(ui.desc).replace(/</g, '&lt;') +
          '</div>'
        : '';
      item.innerHTML =
        '<div class="room-type-icon room-layout-preview room-layout-preview--scheme">' +
        previewInner +
        '</div>' +
        '<div class="room-layout-meta">' +
        '<div class="room-type-name room-layout-name">' +
        String(ui.label).replace(/</g, '&lt;') +
        '</div>' +
        descHtml +
        '</div>' +
        '<span class="room-layout-selected-indicator" aria-hidden="true"></span>';
    }

    // Клик: выбор раскладки. Для «Прямой» (top-wall) — сразу режим призрака без drag.
    item.addEventListener('click', () => {
      grid
        .querySelectorAll('.room-type-item')
        .forEach((i) => i.classList.remove('selected'));
      item.classList.add('selected');

      window.selectedRoomLayout = layout;
      state.pendingLayoutKey = layout.key;
      state._composeLayoutKey = normalizeComposeLayoutKey(layout.key);

      const nextBtn = document.getElementById('sidebar-next-btn');
      if (nextBtn) {
        nextBtn.disabled = false;
      }

      // Подсказка «выбери стену» — сразу после выбора типа (прямая / угол / П).
      showWallPickHint();

      if (layout.key === 'top-wall') {
        beginStraightClickPlace();
      } else if (
        layout.key === 'corner-wardrobe' ||
        layout.key === 'top-right' ||
        layout.key === 'corner-wardrobe-left' ||
        layout.key === 'top-left'
      ) {
        // L: тот же click-place, что у прямой (призрак без удержания ЛКМ).
        beginSectionClickPlace({ awaitCompose: false });
      }
    });

    // Drag‑placement только для П. Прямая и L — click-place (см. выше).
    item.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return;
      if (layout.key === 'top-wall') return;
      if (
        layout.key === 'corner-wardrobe' ||
        layout.key === 'top-right' ||
        layout.key === 'corner-wardrobe-left' ||
        layout.key === 'top-left'
      ) {
        return;
      }
      const isULayout = layout.key === 'top-right-bottom-partition';
      if (!isULayout) return;
      if (state.kitchenSectionsEnabled === false) {
        console.warn('[SECTIONS] layout drag blocked (sections off)', layout.key);
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      console.log('🖱️ Зажата ЛКМ на иконке раскладки', layout.key, '(drag placement, modular)');

      grid
        .querySelectorAll('.room-type-item')
        .forEach((i) => i.classList.remove('selected'));
      item.classList.add('selected');
      window.selectedRoomLayout = layout;
      state.pendingLayoutKey = layout.key;
      state.sectionClickPlaceMode = false;
      const nextBtn = document.getElementById('sidebar-next-btn');
      if (nextBtn) {
        nextBtn.disabled = false;
      }

      const canvas = state.renderer && state.renderer.domElement;
      if (!canvas || !state.room) {
        console.warn('⚠️ Невозможно начать размещение секции: нет renderer или комнаты');
        return;
      }

      let placementStarted = false;

      const handleMouseMove = (moveEvent) => {
        if (!state.room) return;

        const rect = canvas.getBoundingClientRect();
        const x = moveEvent.clientX;
        const y = moveEvent.clientY;

        const insideCanvas =
          x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

        if (insideCanvas) {
          if (!placementStarted) {
            startPlacingSection();
            placementStarted = true;
            showWallPickHint();
          }
        } else if (placementStarted && state.sectionGhost) {
          state.sectionGhost.visible = false;
        }
      };

      const handleMouseUp = (upEvent) => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        const rect = canvas.getBoundingClientRect();
        const x = upEvent.clientX;
        const y = upEvent.clientY;

        const insideCanvas =
          x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

        if (!insideCanvas && state.isPlacingSection) {
          cancelSectionPlacement();
          hideWallPickHint();
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });

    grid.appendChild(item);
  });

  container.appendChild(grid);

  // Вернулись на шаг 2 после выбора кухни — снова показать карточки.
  try {
    if (state.selectedStraightComposeId) {
      const lk = resolveComposeLayoutKey();
      if (
        (lk === 'top-wall' && findStraightSectionForComposePreview()) ||
        isLComposeLayoutKey(lk)
      ) {
        showStraightComposePanel();
      }
    }
  } catch (_) {}
}

/**
 * Click-place: клик по карточке → призрак без удержания ЛКМ.
 * awaitCompose=true только для прямой (сетка после выбора компоновки).
 * L: панель компоновок тоже после «Да», но без applyStraightComposePreview.
 */
function beginSectionClickPlace(opts) {
  if (state.kitchenSectionsEnabled === false) {
    console.warn('[SECTIONS] click-place blocked (sections off)');
    return;
  }
  if (!state.room || !state.renderer?.domElement) {
    console.warn('⚠️ Нет комнаты/canvas для click-place');
    return;
  }
  const awaitCompose = opts?.awaitCompose === true;
  const lk =
    state.pendingLayoutKey ||
    (window.selectedRoomLayout && window.selectedRoomLayout.key) ||
    state._composeLayoutKey ||
    null;
  state._composeLayoutKey = normalizeComposeLayoutKey(lk);
  state.sectionClickPlaceMode = true;
  state._awaitStraightComposeAfterPlace = awaitCompose;
  state._sectionPlaceConfirmOpen = false;
  closeSectionPlaceConfirmUi();
  startPlacingSection();
  showWallPickHint();
  // Вид сверху: чуть выше центра canvas ≈ задняя стена.
  try {
    const rect = state.renderer.domElement.getBoundingClientRect();
    updateSectionGhostPosition({
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height * 0.22,
    });
  } catch (_) {}
  console.log(
    awaitCompose
      ? '📐 Click-place прямой: призрак, ведите мышь на стену, клик — подтверждение'
      : '📐 Click-place L: призрак, ведите мышь на стену, клик — подтверждение'
  );
}

/** Прямая (top-wall): click-place + отложенная компоновка. */
function beginStraightClickPlace() {
  beginSectionClickPlace({ awaitCompose: true });
}

const WALL_PICK_HINT_ID = 'cld-wall-pick-hint';
// Как IKEA-кружок, но у нас: зажми красную секцию и води по стене.
const WALL_PICK_HINT_TEXT =
  'Зажмите и\nперемещайте,\nчтобы поставить\nсекцию на стену';

const _wallPickHintCenter = new THREE.Vector3();
const _wallPickHintBox = new THREE.Box3();
const _wallPickHintNdc = new THREE.Vector3();
let _wallPickHintRaf = 0;

function wallPickHintSvg() {
  return (
    '<svg class="cld-wall-pick-hint__icon" viewBox="0 0 128 80" aria-hidden="true" focusable="false">' +
    '<g fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M14 40 H40"/><path d="M24 30 L14 40 L24 50"/>' +
    '<path d="M114 40 H88"/><path d="M104 30 L114 40 L104 50"/>' +
    '</g>' +
    '<g fill="#fff">' +
    '<rect x="58" y="8" width="12" height="28" rx="6"/>' +
    '<path d="M46 34h36c4.4 0 8 3.6 8 8v18c0 6.6-5.4 12-12 12H50c-6.6 0-12-5.4-12-12V42c0-4.4 3.6-8 8-8z"/>' +
    '<path d="M46 40c-7 0-12 4-12 10s5 10 11 10h7V40h-6z"/>' +
    '</g>' +
    '</svg>'
  );
}

/** Мировая точка центра красного призрака / поставленной секции. */
function resolveWallPickHintWorldCenter(out) {
  const ghost = state.sectionGhost;
  if (ghost?.isObject3D && ghost.visible !== false && state.isPlacingSection) {
    try {
      ghost.updateMatrixWorld(true);
      _wallPickHintBox.setFromObject(ghost);
      if (!_wallPickHintBox.isEmpty()) {
        _wallPickHintBox.getCenter(out);
        return out;
      }
    } catch (_) {}
  }
  const id = state._wallPickHintSectionId;
  if (id != null) {
    const sec = (state.customSections || []).find(
      (s) => s && String(s.id) === String(id)
    );
    if (sec?.group?.isObject3D) {
      try {
        sec.group.updateMatrixWorld(true);
        _wallPickHintBox.setFromObject(sec.group);
        if (!_wallPickHintBox.isEmpty()) {
          _wallPickHintBox.getCenter(out);
          return out;
        }
      } catch (_) {}
    }
  }
  return null;
}

function projectWallPickHintToClient(world) {
  if (!state.camera || !world) return null;
  const host = document.getElementById('canvas-container');
  if (!host) return null;
  _wallPickHintNdc.copy(world).project(state.camera);
  if (!Number.isFinite(_wallPickHintNdc.x) || !Number.isFinite(_wallPickHintNdc.y)) {
    return null;
  }
  // За камерой / вне клипа — всё равно рисуем, если в плоскости экрана близко.
  const r = host.getBoundingClientRect();
  return {
    x: r.left + (_wallPickHintNdc.x * 0.5 + 0.5) * r.width,
    y: r.top + (-_wallPickHintNdc.y * 0.5 + 0.5) * r.height,
  };
}

function stopWallPickHintRaf() {
  if (_wallPickHintRaf) {
    cancelAnimationFrame(_wallPickHintRaf);
    _wallPickHintRaf = 0;
  }
}

/** Кружок всегда в центре секции и едет с ней влево/вправо (шаг 2). */
export function syncWallPickHintPosition() {
  const el = document.getElementById(WALL_PICK_HINT_ID);
  if (!el || !el.classList.contains('is-visible')) return;
  const step = Number(window.currentRoomStep) || 0;
  if (step !== 2) {
    hideWallPickHint();
    return;
  }
  const world = resolveWallPickHintWorldCenter(_wallPickHintCenter);
  if (!world) {
    el.style.visibility = 'hidden';
    return;
  }
  const scr = projectWallPickHintToClient(world);
  if (!scr) {
    el.style.visibility = 'hidden';
    return;
  }
  el.style.visibility = 'visible';
  el.style.left = Math.round(scr.x) + 'px';
  el.style.top = Math.round(scr.y) + 'px';
}

function ensureWallPickHintRaf() {
  if (_wallPickHintRaf) return;
  const tick = () => {
    _wallPickHintRaf = 0;
    const el = document.getElementById(WALL_PICK_HINT_ID);
    if (!el || !el.classList.contains('is-visible')) return;
    syncWallPickHintPosition();
    _wallPickHintRaf = requestAnimationFrame(tick);
  };
  _wallPickHintRaf = requestAnimationFrame(tick);
}

/** Привязать кружок к уже поставленной секции (живёт до шага 3). */
export function bindWallPickHintToSectionId(sectionId) {
  if (sectionId == null) return;
  state._wallPickHintSectionId = sectionId;
  showWallPickHint();
}

/** Кружок-навигатор: центр красной секции, ЛКМ — двигать по стене. */
export function showWallPickHint(text) {
  let el = document.getElementById(WALL_PICK_HINT_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = WALL_PICK_HINT_ID;
    el.className = 'cld-wall-pick-hint';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  const label = text != null && String(text).trim() ? String(text).trim() : WALL_PICK_HINT_TEXT;
  el.innerHTML =
    wallPickHintSvg() +
    '<p class="cld-wall-pick-hint__text">' +
    label.replace(/</g, '&lt;').replace(/\n/g, '<br>') +
    '</p>';
  el.classList.add('is-visible');
  syncWallPickHintPosition();
  ensureWallPickHintRaf();
}

export function hideWallPickHint() {
  stopWallPickHintRaf();
  state._wallPickHintSectionId = null;
  const el = document.getElementById(WALL_PICK_HINT_ID);
  if (!el) return;
  el.classList.remove('is-visible');
  window.setTimeout(() => {
    const cur = document.getElementById(WALL_PICK_HINT_ID);
    if (cur && !cur.classList.contains('is-visible')) cur.remove();
  }, 220);
}

if (typeof window !== 'undefined') {
  window.__cldShowWallPickHint = showWallPickHint;
  window.__cldHideWallPickHint = hideWallPickHint;
  window.__cldSyncWallPickHint = syncWallPickHintPosition;
  window.__cldBindWallPickHintToSectionId = bindWallPickHintToSectionId;
}

function closeSectionPlaceConfirmUi() {
  const el = document.getElementById('cld-section-place-confirm');
  if (el) el.remove();
  state._sectionPlaceConfirmOpen = false;
}

/** Диалог после клика по стене в режиме click-place. */
export function askSectionPlaceConfirm() {
  if (!state.sectionClickPlaceMode) return;
  if (state._sectionPlaceConfirmOpen) return;
  if (
    !state.isPlacingSection ||
    !state.sectionGhost?.visible ||
    !state.sectionGhostWall
  ) {
    return;
  }
  closeSectionPlaceConfirmUi();
  state._sectionPlaceConfirmOpen = true;
  // Кружок не гасим: остаётся в центре секции до шага 3.
  const overlay = document.createElement('div');
  overlay.id = 'cld-section-place-confirm';
  overlay.setAttribute('role', 'dialog');
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:100050;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);';
  const box = document.createElement('div');
  box.style.cssText =
    'background:#fff;border-radius:10px;padding:20px 22px;max-width:360px;width:90%;box-shadow:0 12px 40px rgba(0,0,0,.2);font:14px/1.4 system-ui,sans-serif;color:#222;';
  box.innerHTML =
    '<div style="font-weight:600;margin-bottom:8px;">Разместить секцию на этой стене?</div>' +
    '<div style="color:#666;font-size:13px;margin-bottom:16px;">Стена: ' +
    String(state.sectionGhostWall || '—').replace(/</g, '&lt;') +
    '</div>' +
    '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
    '<button type="button" data-act="no" style="padding:8px 14px;border:1px solid #ccc;border-radius:8px;background:#f7f7f7;cursor:pointer;">Отмена</button>' +
    '<button type="button" data-act="yes" style="padding:8px 14px;border:0;border-radius:8px;background:#ff6a00;color:#fff;font-weight:600;cursor:pointer;">Да</button>' +
    '</div>';
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const finishNo = () => {
    closeSectionPlaceConfirmUi();
    // Остаёмся в режиме выбора стены (призрак жив).
    state.sectionClickPlaceMode = true;
    showWallPickHint();
  };
  const finishYes = () => {
    closeSectionPlaceConfirmUi();
    state.sectionClickPlaceMode = false;
    let ok = false;
    if (typeof window.__cldConfirmPendingSectionPlacement === 'function') {
      ok = window.__cldConfirmPendingSectionPlacement() !== false;
    }
    if (ok) {
      // Позиция секции уже зафиксирована; ячейки прямой — после компоновки.
      state.selectedStraightComposeId = null;
      window.__cldSelectedStraightComposeId = null;
      let sid = rememberLastStraightSectionForCompose();
      if (sid == null) {
        const list = Array.isArray(state.customSections) ? state.customSections : [];
        const last = list.length ? list[list.length - 1] : null;
        if (last?.id != null) sid = last.id;
      }
      // Круг «зажмите…» — только до выбора стены. После «Да» гасим навсегда
      // (section-manager мог снова bind — перекрываем). Отмена — finishNo / show.
      hideWallPickHint();
      // Прямая: coach здесь (confirm отложил). L: confirm уже открыл — не дублировать.
      if (!document.getElementById(SECTION_SIZE_COACH_ID)) {
        showSectionSizeCoach(sid);
      }
    }
  };
  box.querySelector('[data-act="no"]')?.addEventListener('click', finishNo);
  box.querySelector('[data-act="yes"]')?.addEventListener('click', finishYes);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) finishNo();
  });
}

window.__cldAskSectionPlaceConfirm = askSectionPlaceConfirm;

const SECTION_SIZE_COACH_ID = 'cld-section-size-coach';

function closeSectionSizeCoach() {
  const el = document.getElementById(SECTION_SIZE_COACH_ID);
  if (el) el.remove();
}

function findSectionById(sectionId) {
  if (sectionId == null) return null;
  return (state.customSections || []).find(
    (s) => s && String(s.id) === String(sectionId)
  );
}

function continueAfterSectionSizeCoach() {
  closeSectionSizeCoach();
  try {
    // Прямая и L: одна панель cld-straight-compose после coach размера.
    const layoutKey = resolveComposeLayoutKey();
    if (layoutKey === 'top-wall') {
      if (findStraightSectionForComposePreview()) showStraightComposePanel();
    } else if (isLComposeLayoutKey(layoutKey)) {
      showStraightComposePanel();
    }
  } catch (e) {
    console.warn('[section-size-coach] compose after size', e);
  }
}

/**
 * После постановки на стену: «Задайте размер секции» → кнопка открывает
 * тот же showEditSectionModal, что и клик по секции. После закрытия модалки —
 * дальше (компоновка прямой).
 */
export function showSectionSizeCoach(sectionId) {
  closeSectionSizeCoach();
  const sid =
    sectionId != null
      ? sectionId
      : state._wallPickHintSectionId || state._composePreviewSectionId;
  if (sid == null) {
    continueAfterSectionSizeCoach();
    return;
  }
  state._sectionSizeCoachSectionId = sid;
  state._sectionSizeCoachAwaitCompose = true;

  const overlay = document.createElement('div');
  overlay.id = SECTION_SIZE_COACH_ID;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-labelledby', 'cld-section-size-coach-title');
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:100060;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);pointer-events:auto;';

  const box = document.createElement('div');
  box.style.cssText =
    'background:#fff;border-radius:12px;padding:22px 24px;max-width:380px;width:90%;box-shadow:0 12px 40px rgba(0,0,0,.2);font:14px/1.45 "Cera Pro",system-ui,sans-serif;color:#222;';
  box.innerHTML =
    '<div id="cld-section-size-coach-title" style="font-weight:600;font-size:17px;margin-bottom:8px;">Задайте размер секции</div>' +
    '<div style="color:#666;font-size:13px;margin-bottom:18px;">Укажите габариты и отступы секции — как при нажатии на секцию.</div>' +
    '<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;">' +
    '<button type="button" data-act="skip" style="padding:9px 14px;border:1px solid #ccc;border-radius:8px;background:#f7f7f7;cursor:pointer;">Позже</button>' +
    '<button type="button" data-act="edit" style="padding:9px 16px;border:0;border-radius:8px;background:#ff6a00;color:#fff;font-weight:600;cursor:pointer;">Задать размер</button>' +
    '</div>';
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const openEdit = () => {
    const sec = findSectionById(sid);
    closeSectionSizeCoach();
    if (!sec?.group) {
      continueAfterSectionSizeCoach();
      return;
    }
    try {
      window.activeSectionId = sec.id;
      if (typeof window.showEditSectionModal === 'function') {
        window.showEditSectionModal(sec);
      } else {
        continueAfterSectionSizeCoach();
        return;
      }
    } catch (e) {
      console.warn('[section-size-coach] open edit', e);
      continueAfterSectionSizeCoach();
      return;
    }
    // После Применить/Отмена в модалке — дальше на компоновку.
    const modal = document.getElementById('edit-section-modal');
    if (!modal) {
      continueAfterSectionSizeCoach();
      return;
    }
    const finishWhenClosed = () => {
      if (modal.style.display !== 'none') return;
      if (!state._sectionSizeCoachAwaitCompose) return;
      state._sectionSizeCoachAwaitCompose = false;
      continueAfterSectionSizeCoach();
    };
    const obs = new MutationObserver(finishWhenClosed);
    obs.observe(modal, { attributes: true, attributeFilter: ['style', 'class'] });
    // На случай мгновенного закрытия / другого пути.
    const poll = window.setInterval(() => {
      if (!state._sectionSizeCoachAwaitCompose) {
        window.clearInterval(poll);
        try {
          obs.disconnect();
        } catch (_) {}
        return;
      }
      if (modal.style.display === 'none') {
        window.clearInterval(poll);
        try {
          obs.disconnect();
        } catch (_) {}
        finishWhenClosed();
      }
    }, 200);
  };

  box.querySelector('[data-act="edit"]')?.addEventListener('click', openEdit);
  box.querySelector('[data-act="skip"]')?.addEventListener('click', () => {
    state._sectionSizeCoachAwaitCompose = false;
    continueAfterSectionSizeCoach();
  });
}

if (typeof window !== 'undefined') {
  window.__cldShowSectionSizeCoach = showSectionSizeCoach;
  window.__cldCloseSectionSizeCoach = closeSectionSizeCoach;
}

function encodeRoomFilesUrl(url) {
  if (!url || /^https?:\/\//i.test(url)) return url;
  try {
    return String(url)
      .split('/')
      .map(function (seg, i) {
        if (i === 0 && seg === '') return '';
        try {
          return encodeURIComponent(decodeURIComponent(seg));
        } catch (_) {
          return encodeURIComponent(seg);
        }
      })
      .join('/');
  } catch (_) {
    return url;
  }
}

function normalizeComposeLayoutKey(key) {
  const k = String(key || '').trim();
  if (k === 'top-right' || k === 'corner-wardrobe') return 'corner-wardrobe';
  if (k === 'top-left' || k === 'corner-wardrobe-left') {
    return 'corner-wardrobe-left';
  }
  if (k === 'top-wall') return 'top-wall';
  return k || 'top-wall';
}

function isLComposeLayoutKey(key) {
  const k = normalizeComposeLayoutKey(key);
  return k === 'corner-wardrobe' || k === 'corner-wardrobe-left';
}

/** Ключ компоновки: stash → selected → L-секция → прямая. */
function resolveComposeLayoutKey() {
  if (state._composeLayoutKey) {
    return normalizeComposeLayoutKey(state._composeLayoutKey);
  }
  const sel =
    window.selectedRoomLayout && window.selectedRoomLayout.key
      ? window.selectedRoomLayout.key
      : null;
  if (sel) {
    const n = normalizeComposeLayoutKey(sel);
    if (n === 'top-wall' || isLComposeLayoutKey(n)) return n;
  }
  const list = Array.isArray(state.customSections) ? state.customSections : [];
  for (let i = list.length - 1; i >= 0; i--) {
    const s = list[i];
    const t = String((s && s.lShape && s.lShape.type) || '').trim();
    if (t === 'corner-wardrobe' || t === 'top-right') return 'corner-wardrobe';
    if (t === 'corner-wardrobe-left' || t === 'top-left') {
      return 'corner-wardrobe-left';
    }
    const tk = String((s && s.lShape && s.lShape.typeKey) || '').trim();
    if (tk === 'corner-back-right') return 'corner-wardrobe';
    if (tk === 'corner-back-left') return 'corner-wardrobe-left';
  }
  if (findStraightSectionForComposePreview()) return 'top-wall';
  return 'top-wall';
}

/** Варианты прямой/L из room_steps_config (админка). Без второго хардкод-списка. */
function readStraightComposeVariantsFromConfig(layoutKey) {
  try {
    const want = normalizeComposeLayoutKey(layoutKey || 'top-wall');
    const raw = localStorage.getItem('room_steps_config');
    const config = raw ? JSON.parse(raw) : null;
    const step2 =
      config && Array.isArray(config.steps)
        ? config.steps.find(function (s) {
            return s.stepId === 2;
          })
        : null;
    const items = step2 && Array.isArray(step2.items) ? step2.items : [];
    const hit = items.find(function (it) {
      const k = normalizeComposeLayoutKey(it && it.key);
      const icon = String(it && it.icon ? it.icon : '').trim();
      if (want === 'top-wall') return k === 'top-wall' || icon === 'shape:top-wall';
      if (want === 'corner-wardrobe') {
        return k === 'corner-wardrobe' || icon === 'shape:top-right';
      }
      if (want === 'corner-wardrobe-left') {
        return k === 'corner-wardrobe-left' || icon === 'shape:top-left';
      }
      return false;
    });
    const variants =
      hit && Array.isArray(hit.variants) ? hit.variants.slice() : [];
    return variants
      .filter(function (v) {
        return v && (v.id || v.name);
      })
      .map(function (v, i) {
        return {
          id: String(v.id || 'v' + i),
          name: String(v.name || v.id || 'Вариант').trim(),
          image: String(v.image || v.icon || '').trim(),
          order: parseInt(v.order, 10) || i,
        };
      })
      .sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
      });
  } catch (_) {
    return [];
  }
}

/** Только UI-карточки компоновки (шаг 2). Ячейки в сцене не трогает. */
export function removeStraightComposePanelDom() {
  const el = document.getElementById('cld-straight-compose');
  if (el) el.remove();
}

/** Убрать карточки + погасить предпросмотр ячеек (сброс / уход с раскладки). */
export function hideStraightComposePanel() {
  removeStraightComposePanelDom();
  clearStraightComposePreviewVisuals();
}

function rememberLastStraightSectionForCompose() {
  const list = Array.isArray(state.customSections) ? state.customSections : [];
  for (let i = list.length - 1; i >= 0; i--) {
    const s = list[i];
    try {
      if (isKitchenStraightBaseBandSection(s)) {
        state._composePreviewSectionId = s.id;
        return s.id;
      }
    } catch (_) {}
  }
  state._composePreviewSectionId = null;
  return null;
}

function findStraightSectionForComposePreview() {
  const id = state._composePreviewSectionId;
  const list = Array.isArray(state.customSections) ? state.customSections : [];
  if (id != null) {
    const hit = list.find((s) => String(s?.id) === String(id));
    if (hit && isKitchenStraightBaseBandSection(hit)) return hit;
  }
  for (let i = list.length - 1; i >= 0; i--) {
    const s = list[i];
    if (isKitchenStraightBaseBandSection(s)) return s;
  }
  return null;
}

function composePreviewFlagsFromId(composeId) {
  const id = String(composeId || '');
  return {
    id,
    tallLeft: id === 'straight-tall-left' || id === 'straight-tall-both',
    tallRight: id === 'straight-tall-right' || id === 'straight-tall-both',
  };
}

/** Пеналы L: left/right = внешние концы пары (не угловая спец-ячейка). */
function parseLComposeTallEnds(composeId) {
  const id = String(composeId || '');
  if (id.includes('no-tall')) return { left: false, right: false };
  if (id.includes('tall-both') || id.includes('two_tall') || id.includes('two-tall')) {
    return { left: true, right: true };
  }
  if (id.includes('tall-left')) return { left: true, right: false };
  if (id.includes('tall-right')) return { left: false, right: true };
  return { left: false, right: false };
}

/**
 * На плече L tallLeft/tallRight бьют в zi0 / parts-1.
 * Ставим флаг только на свободный внешний конец (напротив special).
 */
function lArmOuterTallFlags(arm) {
  const parts = Math.max(0, Math.floor(Number(arm?.division?.parts) || 0));
  if (!(parts > 0)) return { tallLeft: false, tallRight: false };
  let specialZi = null;
  try {
    if (typeof window.__cldGetLShapeSpecialZoneIndex === 'function') {
      specialZi = window.__cldGetLShapeSpecialZoneIndex(arm);
    }
  } catch (_) {}
  if (specialZi == null || !Number.isFinite(Number(specialZi))) {
    const hostAt = arm?.division?.kitchenCornerHostAtStart;
    if (hostAt === true) return { tallLeft: false, tallRight: true };
    if (hostAt === false) return { tallLeft: true, tallRight: false };
    // Плечо без спец — внешний конец обычно «в конце» U.
    return { tallLeft: false, tallRight: true };
  }
  const zi = Math.floor(Number(specialZi));
  if (zi <= 0) return { tallLeft: false, tallRight: parts > 1 };
  if (zi >= parts - 1) return { tallLeft: parts > 1, tallRight: false };
  return { tallLeft: false, tallRight: false };
}

function findLPairForComposePreview() {
  const list = Array.isArray(state.customSections) ? state.customSections : [];
  const tryPair = (sec) => {
    if (!sec?.lShape?.pairId) return null;
    try {
      if (typeof window.__clodisGetLShapePairForSection === 'function') {
        const p = window.__clodisGetLShapePairForSection(sec.id);
        if (p?.primary && p?.attached) return p;
      }
    } catch (_) {}
    const other = list.find(
      (s) => s && String(s.id) === String(sec.lShape.pairId)
    );
    if (!other?.lShape) return null;
    const role = String(sec.lShape.role || '');
    if (role === 'back' || sec.wallName === 'back') {
      return {
        primary: sec,
        attached: other,
        primaryWall: sec.wallName || 'back',
        attachedWall: other.wallName || '',
      };
    }
    return {
      primary: other,
      attached: sec,
      primaryWall: other.wallName || 'back',
      attachedWall: sec.wallName || '',
    };
  };
  const id = state._composePreviewSectionId;
  if (id != null) {
    const hit = list.find((s) => String(s?.id) === String(id));
    const p = tryPair(hit);
    if (p) return p;
  }
  for (let i = list.length - 1; i >= 0; i--) {
    const p = tryPair(list[i]);
    if (p) return p;
  }
  return null;
}

function clearStraightComposePreviewVisuals() {
  const list = Array.isArray(state.customSections) ? state.customSections : [];
  for (const s of list) {
    if (s) s._straightComposePreview = null;
  }
  try {
    setKitchenBandGridsViewEnabled(false);
  } catch (_) {}
}

/**
 * Выбор кухни: 600+жертва → зоны секции → BASE/MID/TOP (существующие datums).
 * Мебель не создаёт; переключение идемпотентно (без дублей секций).
 */
export function applyStraightComposePreview(composeId) {
  const sec = findStraightSectionForComposePreview();
  if (!sec) {
    console.warn('[compose-preview] нет прямой секции');
    return false;
  }
  let avail = 0;
  try {
    const inner = computeSectionInnerBoundsU(sec);
    avail = Math.max(0, Math.round(Number(inner?.innerWidthU) || 0));
  } catch (_) {}
  if (!(avail > 10)) {
    const div = sec.division;
    avail = Math.round(
      (Number(div?.sectionEnd) || 0) - (Number(div?.sectionStart) || 0) ||
        Number(sec.size?.x) ||
        Number(sec.size?.z) ||
        Number(div?.freeSizeMm) ||
        0
    );
  }
  // Идемпотентно перезаписать сетку — без накопления смещений / второй формулы.
  try {
    applyKitchenStraight600SacrificeWidths(sec, avail);
  } catch (e) {
    console.warn('[compose-preview] sacrifice apply', e);
  }
  sec._awaitStraightCompose = false;
  sec._straightComposePreview = composePreviewFlagsFromId(composeId);
  state.selectedStraightComposeId = String(composeId || '');
  window.__cldSelectedStraightComposeId = state.selectedStraightComposeId;

  // Ячейки секции: kitchenBandGrids (sacrifice) + band-grids-view BASE/MID/TOP
  // (высоты — resolveTallKitchenDatumsMm). Не createSectionZones: там полный size.y.
  try {
    setKitchenBandGridsViewBand('base');
    setKitchenBandGridsViewEnabled(true);
    syncKitchenBandGridsView();
  } catch (e) {
    console.warn('[compose-preview] band view', e);
  }
  // Карандаши пустых ячеек с шага 2; с модулем — карандаш модуля (ячейка+модуль).
  try {
    window.showSectionZoneEditIcons = true;
    if (sec.id != null) rebuildSectionZoneEditIconsForSection(sec.id);
  } catch (e) {
    console.warn('[compose-preview] zone pencils', e);
  }
  console.log('[compose-preview]', {
    sectionId: sec.id,
    composeId,
    avail,
    parts: sec.division?.parts,
    widths: sec.division?.customZoneWidthsMm,
    flags: sec._straightComposePreview,
  });
  return true;
}

/**
 * L compose = тот же порядок шага 2, что у прямой (карточка → сетка).
 * Свободные плечи: 600+жертва. Спец-угол: существующие zones/Joint/CornerCell
 * (после sacrifice — пересборка, без новой архитектуры и без дублей секций).
 */
export function applyLComposePreview(composeId) {
  const pair = findLPairForComposePreview();
  if (!pair?.primary || !pair?.attached) {
    console.warn('[compose-preview-l] нет L-пары');
    return false;
  }
  const arms = [pair.primary, pair.attached];

  // 1) Joint + CornerCell сначала: host flags + спец 1050.
  //    Иначе sacrifice до Joint пишет auto-600 во все слоты и отравляет спец.
  try {
    if (typeof window.__cldEnsureJointsForLPair === 'function') {
      window.__cldEnsureJointsForLPair(pair.primary, pair.attached);
    }
    if (typeof window.__cldEnsureAllCornerCells === 'function') {
      window.__cldEnsureAllCornerCells();
    }
  } catch (e) {
    console.warn('[compose-preview-l] joint/corner first', e);
  }

  // 2) BASE: 600+жертва + спец 1050 (низ) — уже видит host/specialW.
  for (const arm of arms) {
    try {
      applyKitchenLFreeArm600SacrificeWidths(arm);
    } catch (e) {
      console.warn('[compose-preview-l] sacrifice', arm?.id, e);
    }
  }

  // 3) Place-зоны + segmentsLShape (спец низа) — как после place.
  for (const arm of arms) {
    try {
      if (typeof window.__clodisCreateSectionZones === 'function') {
        window.__clodisCreateSectionZones(arm);
      }
    } catch (e) {
      console.warn('[compose-preview-l] createSectionZones', arm?.id, e);
    }
  }

  // 4) Joint/Corner ещё раз + MID/TOP спец 600.
  try {
    if (typeof window.__cldEnsureJointsForLPair === 'function') {
      window.__cldEnsureJointsForLPair(pair.primary, pair.attached);
    }
    if (typeof window.__cldEnsureAllCornerCells === 'function') {
      window.__cldEnsureAllCornerCells();
    }
  } catch (e) {
    console.warn('[compose-preview-l] joint/corner restore', e);
  }
  for (const arm of arms) {
    try {
      applyKitchenLFreeArm600SacrificeWidths(arm);
    } catch (e) {
      console.warn('[compose-preview-l] sacrifice-upper', arm?.id, e);
    }
  }

  const want = parseLComposeTallEnds(composeId);
  const aWall = String(pair.attachedWall || pair.attached.wallName || '');
  let leftArm = pair.primary;
  let rightArm = pair.attached;
  if (aWall === 'left') {
    leftArm = pair.attached;
    rightArm = pair.primary;
  } else if (aWall === 'right') {
    leftArm = pair.primary;
    rightArm = pair.attached;
  }

  const list = Array.isArray(state.customSections) ? state.customSections : [];
  for (const s of list) {
    if (s) s._straightComposePreview = null;
  }

  const applyArmFlags = (arm, wantTall) => {
    if (!arm) return;
    const outer = lArmOuterTallFlags(arm);
    arm._awaitStraightCompose = false;
    arm._straightComposePreview = {
      id: String(composeId || ''),
      tallLeft: !!(wantTall && outer.tallLeft),
      tallRight: !!(wantTall && outer.tallRight),
    };
  };
  applyArmFlags(leftArm, want.left);
  applyArmFlags(rightArm, want.right);
  for (const arm of arms) {
    if (arm && !arm._straightComposePreview) {
      arm._straightComposePreview = {
        id: String(composeId || ''),
        tallLeft: false,
        tallRight: false,
      };
    }
  }

  state._composePreviewSectionId = pair.primary.id;
  state.selectedStraightComposeId = String(composeId || '');
  window.__cldSelectedStraightComposeId = state.selectedStraightComposeId;

  try {
    setKitchenBandGridsViewBand('base');
    setKitchenBandGridsViewEnabled(true);
    syncKitchenBandGridsView();
  } catch (e) {
    console.warn('[compose-preview-l] band view', e);
  }
  try {
    window.showSectionZoneEditIcons = true;
    for (const arm of arms) {
      if (arm?.id != null) rebuildSectionZoneEditIconsForSection(arm.id);
    }
  } catch (e) {
    console.warn('[compose-preview-l] zone pencils', e);
  }
  console.log('[compose-preview-l]', {
    composeId,
    primaryId: pair.primary.id,
    attachedId: pair.attached.id,
    want,
    primary: {
      parts: pair.primary.division?.parts,
      flags: pair.primary._straightComposePreview,
      widths: pair.primary.division?.customZoneWidthsMm,
    },
    attached: {
      parts: pair.attached.division?.parts,
      flags: pair.attached._straightComposePreview,
      widths: pair.attached.division?.customZoneWidthsMm,
    },
  });
  return true;
}

/**
 * После «Да» + coach размера: блок компоновки (прямая и L).
 * Клик → сетка BASE/MID/TOP (прямая / L), один порядок шага 2.
 */
export function showStraightComposePanel() {
  const host = document.getElementById('sidebar-content');
  if (!host) return;
  const layoutKey = resolveComposeLayoutKey();
  state._composeLayoutKey = layoutKey;
  const variants = readStraightComposeVariantsFromConfig(layoutKey);
  if (!variants.length) {
    console.warn(
      '[compose] нет variants для',
      layoutKey,
      'в room_steps_config'
    );
    return;
  }
  // Не clearStraightComposePreviewVisuals — иначе при возврате на шаг 2 гасятся ячейки.
  removeStraightComposePanelDom();

  const isStraight = layoutKey === 'top-wall';
  const aria =
    layoutKey === 'corner-wardrobe'
      ? 'Компоновка L справа'
      : layoutKey === 'corner-wardrobe-left'
        ? 'Компоновка L слева'
        : 'Компоновка прямой кухни';

  const block = document.createElement('div');
  block.id = 'cld-straight-compose';
  block.className = 'cld-straight-compose';
  block.dataset.composeLayoutKey = layoutKey;
  block.innerHTML =
    '<h3 class="cld-straight-compose__title">Как расположим кухню?</h3>' +
    '<p class="cld-straight-compose__sub">Выберите начальную компоновку</p>' +
    '<div class="cld-straight-compose__grid" role="listbox" aria-label="' +
    aria +
    '"></div>';

  const grid = block.querySelector('.cld-straight-compose__grid');
  // До выбора кухни — ничего не выделено.
  const selectedId = state.selectedStraightComposeId || null;

  variants.forEach(function (v) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className =
      'cld-straight-compose__card' +
      (selectedId && v.id === selectedId ? ' is-selected' : '');
    card.setAttribute('role', 'option');
    card.setAttribute(
      'aria-selected',
      selectedId && v.id === selectedId ? 'true' : 'false'
    );
    card.dataset.composeId = v.id;

    const imgWrap = document.createElement('div');
    imgWrap.className = 'cld-straight-compose__media';
    const imgSrc = v.image;
    if (imgSrc && (imgSrc.charAt(0) === '/' || /^https?:\/\//i.test(imgSrc))) {
      const img = document.createElement('img');
      img.src = encodeRoomFilesUrl(imgSrc);
      img.alt = v.name;
      img.decoding = 'async';
      img.loading = 'lazy';
      imgWrap.appendChild(img);
    } else {
      imgWrap.innerHTML =
        '<span class="cld-straight-compose__placeholder">нет фото</span>';
    }

    const label = document.createElement('div');
    label.className = 'cld-straight-compose__label';
    label.textContent = v.name;

    card.appendChild(imgWrap);
    card.appendChild(label);
    card.addEventListener('click', function () {
      state.selectedStraightComposeId = v.id;
      window.__cldSelectedStraightComposeId = v.id;
      grid.querySelectorAll('.cld-straight-compose__card').forEach(function (c) {
        const on = c.dataset.composeId === v.id;
        c.classList.toggle('is-selected', on);
        c.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if (isStraight) applyStraightComposePreview(v.id);
      else if (isLComposeLayoutKey(layoutKey)) applyLComposePreview(v.id);
    });
    grid.appendChild(card);
  });

  // Показать над сеткой раскладок / вверху панели шага 2.
  const layoutTitle = host.querySelector('.room-layout-section-title');
  if (layoutTitle && layoutTitle.parentNode === host) {
    host.insertBefore(block, layoutTitle);
  } else {
    host.insertBefore(block, host.firstChild);
  }
  try {
    block.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  } catch (_) {
    host.scrollTop = 0;
  }
}

window.__cldShowStraightComposePanel = showStraightComposePanel;
window.__cldHideStraightComposePanel = hideStraightComposePanel;
window.__cldRemoveStraightComposePanelDom = removeStraightComposePanelDom;
window.__cldApplyStraightComposePreview = applyStraightComposePreview;
window.__cldApplyLComposePreview = applyLComposePreview;

// Make key APIs available globally for modules that expect legacy globals
// (scene-icons.js uses global showEditRoomModal)
window.showEditRoomModal = showEditRoomModal;
