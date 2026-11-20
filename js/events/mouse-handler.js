// Mouse event handling module

import { state } from '../utils/state.js';
import { onWindowResize } from '../core/renderer.js';
import { hideAllSectionMarkers, showSectionPerimeterMarker, hideDeleteButton } from '../ui/markers.js';
import { showDeleteButton } from '../ui/ui-helpers.js';
import { showEditSectionModal } from '../sections/section-manager.js?v=20261103-wdepth5';

function hasAnyFurnitureInScene() {
  if (!state.scene) return false;
  let found = false;
  state.scene.traverse((obj) => {
    if (found) return;
    if (obj?.isGroup && obj.userData?.isFurniture) found = true;
  });
  return found;
}

export function setupEventListeners() {
  window.addEventListener('resize', onWindowResize);
  if (!state.renderer?.domElement) {
    console.warn('⚠️ setupEventListeners: renderer.domElement отсутствует, пропускаем привязку кликов');
    return;
  }
  state.renderer.domElement.addEventListener('click', onMouseClick);
  // Note: mousemove is handled in camera.js
}

export function updateMousePosition(event) {
  const canvas = state.renderer?.domElement;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  state.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  state.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

export function handleRaycast() {
  // Update raycaster with current camera and mouse
  state.raycaster.setFromCamera(state.mouse, state.camera);

  // Check intersections with wall planes
  const intersects = state.raycaster.intersectObjects(state.wallPlanes, false);

  if (intersects.length > 0) {
    const intersection = intersects[0];
    const wallPlane = intersection.object;
    const wallName = wallPlane.userData.wallName;
    const position = intersection.point;

    return { intersection, wallPlane, wallName, position };
  }

  return null;
}

export function onMouseClick(event) {
  if (!state.renderer?.domElement) return;
  // Проверяем, что клик не на UI элемент
  if (event.target !== state.renderer.domElement) {
    return;
  }

  if (state.suppressNextCanvasClick) {
    state.suppressNextCanvasClick = false;
    return;
  }

  // Если идет размещение секции или мебели, клик обрабатывается в camera.js (mouseup)
  if (state.isPlacingSection || state.isPlacingFurniture) {
    return;
  }

  updateMousePosition(event);

  // Check for clicks on furniture or sections
  state.raycaster.setFromCamera(state.mouse, state.camera);

  // Клик по фасаду с петлёй (мебель из ClodisBuilder)
  try {
    const B = typeof window !== 'undefined' ? window.ClodisBuilder : null;
    if (B && typeof B.raycastToggleDoor === 'function' && state.scene) {
      const roots = [];
      state.scene.traverse((o) => {
        if (o && o.isGroup && o.userData && o.userData.isFurniture) roots.push(o);
      });
      for (let i = 0; i < roots.length; i++) {
        if (B.raycastToggleDoor(state.raycaster, roots[i])) return;
      }
    }
  } catch (_) {}

  // Проверяем клики по секциям (customSections)
  const sectionGroups = state.customSections.map(s => s.group);
  const sectionIntersects = state.raycaster.intersectObjects(sectionGroups, true);

  if (sectionIntersects.length > 0) {
    // Кликнули на секцию — как в старом ядре, сразу открываем модал редактирования
    const clickedObject = sectionIntersects[0].object;

    // Находим родительскую группу секции
    let sectionGroup = clickedObject;
    while (sectionGroup.parent && !state.customSections.find(s => s.group === sectionGroup)) {
      sectionGroup = sectionGroup.parent;
    }

    const sectionData = state.customSections.find(s => s.group === sectionGroup);
    if (sectionData) {
      const step = typeof window !== 'undefined' ? window.currentRoomStep : null;
      // Шаг 4: ± под иконками категорий работает для активной секции.
      if (typeof window !== 'undefined') {
        window.activeSectionId = sectionData.id;
        try {
          if (
            sectionData.lShape &&
            typeof window.__clodisGetLShapePairForSection === 'function' &&
            typeof window.__clodisSetLArmFocusMode === 'function'
          ) {
            const pair = window.__clodisGetLShapePairForSection(sectionData.id);
            if (pair) {
              const mode =
                String(pair.primary?.id) === String(sectionData.id)
                  ? 'primary'
                  : 'attached';
              window.__clodisSetLArmFocusMode(mode, sectionData.id);
            }
          }
        } catch (_) {}
        if (typeof window.__clodisRefreshStep4VariantDisplay === 'function') {
          try {
            window.__clodisRefreshStep4VariantDisplay(sectionData.id);
          } catch (_) {}
        }
      }
      // Шаг 5: только выбор декора по UI; клик по шкафу/секции в 3D не открывает редактирование и разметку
      if (step === 5) {
        return;
      }
      // Шаг 4: пока шкафов нет — клик по секции открывает редактирование; после появления мебели — только через иконку
      if (step === 4 && hasAnyFurnitureInScene()) {
        return;
      }

      console.log('🎯 Клик по секции, открываем редактирование:', sectionData.name);

      // Дополнительно подсвечиваем периметр секции
      hideAllSectionMarkers();
      showSectionPerimeterMarker(sectionData.group, sectionData.name, true);

      // Открываем модальное окно редактирования секции
      showEditSectionModal(sectionData);
      return;
    }
  }

  // Если кликнули не на секцию, убираем выделение
  if (state.selectedSections.length > 0) {
    hideAllSectionMarkers();
    hideDeleteButton();
  }
}

export function onMouseMove(event) {
  updateMousePosition(event);
}
