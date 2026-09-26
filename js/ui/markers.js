// Markers module - manages perimeter markers and selection indicators
// Handles visual markers for selected furniture and sections

import { state } from '../utils/state.js';
import { showDeleteButton, hideDeleteButton } from './ui-helpers.js';

/**
 * Show blue perimeter marker around selected furniture
 * @param {Object} furniture - Furniture object with group and bbox
 */
export function showFurniturePerimeterMarker(furniture) {
  // В прод-версии полностью отключаем синий контур вокруг мебели.
  // На всякий случай убираем старый маркер, если он есть.
  if (state.furniturePerimeterMarker) {
    hideFurniturePerimeterMarker();
  }
  return;
}

/**
 * Hide furniture perimeter marker
 */
export function hideFurniturePerimeterMarker() {
  if (state.furniturePerimeterMarker) {
    if (state.furniturePerimeterMarker.parent) {
      state.furniturePerimeterMarker.parent.remove(state.furniturePerimeterMarker);
    } else {
      state.scene.remove(state.furniturePerimeterMarker);
    }
    if (state.furniturePerimeterMarker.geometry) state.furniturePerimeterMarker.geometry.dispose();
    if (state.furniturePerimeterMarker.material) state.furniturePerimeterMarker.material.dispose();
    state.furniturePerimeterMarker = null;
  }

  // Hide delete button
  hideDeleteButton();
}

/**
 * Get marker color for section by name
 * @param {string} sectionName - Section name
 * @returns {number} Hex color code
 */
function getSectionMarkerColor(sectionName) {
  const colorMap = {
    'Секция общая': 0xff0000, // Red
    'Корпус': 0x0000ff, // Blue
  };
  
  return colorMap[sectionName] || 0x00ff00; // Default: green
}

/**
 * Get marker color name for logging
 * @param {string} sectionName - Section name
 * @returns {string} Color name in Russian
 */
function getSectionColorName(sectionName) {
  const colorMap = {
    'Секция общая': 'красный',
    'Корпус': 'синий',
  };
  
  return colorMap[sectionName] || 'зеленый';
}

/**
 * Show section perimeter marker with appropriate color
 * @param {THREE.Group} sectionGroup - Section group
 * @param {string} sectionName - Optional section name
 * @param {boolean} isRootSection - Is this the root section (orange marker)
 */
export function showSectionPerimeterMarker(sectionGroup, sectionName = null, isRootSection = false) {
  // В прод-версии отключаем оранжево‑красно‑синие контуры секций.
  if (!sectionGroup) return;
  if (state.sectionMarkers && state.sectionMarkers[sectionGroup]) {
    hideSectionMarker(sectionGroup);
  }
  return;
}

/**
 * Hide section marker for specific section
 * @param {THREE.Group} sectionGroup - Section group
 */
export function hideSectionMarker(sectionGroup) {
  if (state.sectionMarkers[sectionGroup]) {
    const marker = state.sectionMarkers[sectionGroup];
    if (marker.parent) {
      marker.parent.remove(marker);
    } else {
      state.scene.remove(marker);
    }
    if (marker.geometry) marker.geometry.dispose();
    if (marker.material) marker.material.dispose();
    delete state.sectionMarkers[sectionGroup];
  }
}

/**
 * Hide all section markers
 */
export function hideAllSectionMarkers() {
  Object.keys(state.sectionMarkers).forEach(sectionGroup => {
    hideSectionMarker(sectionGroup);
  });
  state.sectionMarkers = {};
  state.selectedSections = [];
}

// Re-export UI helpers
export { showDeleteButton, hideDeleteButton };
