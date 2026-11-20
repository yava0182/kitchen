// Furniture actions module - handles furniture interactions and animations
// Main module for furniture user actions (delete, resize, animate)

import { state } from '../utils/state.js';
import { deleteSelectedFurniture } from './furniture-manager.js?v=20261106-u600g4';

// Появляется сразу при загрузке модуля — проверка фильтра консоли `[DELETE]`
console.log('[DELETE] module furniture-actions.js loaded');

function _onDeleteClick(ev) {
  console.log('[DELETE] click', ev?.type || '?');
  // deleteSelectedFurniture внутри вызывает rebuildAllTransitions()
  deleteSelectedFurniture();
}

/**
 * Initialize furniture action button handlers
 */
export function initFurnitureActions() {
  const deleteBtn = document.getElementById('delete-furniture-btn');
  if (deleteBtn) {
    // addEventListener — не затирает inline onclick; дублирующий inline убран из HTML
    deleteBtn.addEventListener('click', _onDeleteClick);
  }
  console.log('[DELETE] initFurnitureActions bound=', !!deleteBtn);
  console.log('✅ Furniture actions initialized');
}

// ========== GLB Parametric Control and Animation ==========

/**
 * Set GLB furniture size parametrically
 * @param {number} width - Width in mm
 * @param {number} height - Height in mm
 * @param {number} depth - Depth in mm
 */
export function setGLBSize(width, height, depth) {
  if (!state.furniture || !state.furniture.group || !state.furniture.group.userData.isGLB) {
    console.warn('⚠️ Мебель не является GLB или не выбрана');
    return;
  }
  
  const originalSize = state.furniture.group.userData.originalSize;
  if (!originalSize) {
    console.warn('⚠️ Оригинальные размеры не найдены');
    return;
  }
  
  // Calculate scale
  const scaleX = width / originalSize.x;
  const scaleY = height / originalSize.y;
  const scaleZ = depth / originalSize.z;
  
  // Apply scale to GLB scene (first child element)
  const gltfScene = state.furniture.group.children.find(child => child.userData && child.userData.isGLB !== undefined) || state.furniture.group.children[0];
  if (gltfScene) {
    gltfScene.scale.set(scaleX, scaleY, scaleZ);
    state.furniture.group.userData.currentScale = { x: scaleX, y: scaleY, z: scaleZ };
    
    // Update bbox
    state.furniture.bbox.setFromObject(state.furniture.group);
    
    console.log('📐 Размеры GLB изменены:', { width, height, depth });
    console.log('  Масштаб:', { scaleX, scaleY, scaleZ });
  }
}

/**
 * Play GLB animation by name
 * @param {string} animationName - Animation name
 */
export function playGLBAnimation(animationName) {
  if (!state.furnitureAnimationMixer || !state.furnitureAnimations) {
    console.warn('⚠️ Анимации не инициализированы');
    return;
  }
  
  const action = state.furnitureAnimations[animationName];
  if (!action) {
    console.warn('⚠️ Анимация не найдена:', animationName);
    console.log('Доступные анимации:', Object.keys(state.furnitureAnimations));
    return;
  }
  
  // Stop all animations
  Object.values(state.furnitureAnimations).forEach(a => a.stop());
  
  // Play selected animation
  action.reset().play();
  console.log('▶️ Воспроизведение анимации:', animationName);
}

/**
 * Stop all GLB animations
 */
export function stopGLBAnimations() {
  if (!state.furnitureAnimationMixer || !state.furnitureAnimations) return;
  
  Object.values(state.furnitureAnimations).forEach(action => action.stop());
  console.log('⏹️ Все анимации остановлены');
}

/**
 * Pause/resume GLB animation
 * @param {string} animationName - Animation name
 * @param {boolean} pause - True to pause, false to resume
 */
export function pauseGLBAnimation(animationName, pause = true) {
  if (!state.furnitureAnimations) return;
  
  const action = state.furnitureAnimations[animationName];
  if (!action) return;
  
  if (pause) {
    action.paused = true;
    console.log('⏸️ Анимация на паузе:', animationName);
  } else {
    action.paused = false;
    console.log('▶️ Анимация возобновлена:', animationName);
  }
}

/**
 * Get list of available animations
 * @returns {string[]} Array of animation names
 */
export function getGLBAnimations() {
  if (!state.furniture || !state.furniture.group || !state.furniture.group.userData.animations) {
    return [];
  }
  return state.furniture.group.userData.animations;
}

/**
 * Get current GLB furniture size
 * @returns {Object|null} Size object {x, y, z} or null
 */
export function getGLBSize() {
  if (!state.furniture || !state.furniture.group || !state.furniture.group.userData.isGLB) {
    return null;
  }
  
  const bbox = state.furniture.bbox;
  const size = bbox.max.clone().sub(bbox.min);
  
  return {
    x: size.x,
    y: size.y,
    z: size.z
  };
}

// Make functions available globally for backward compatibility
window.setGLBSize = setGLBSize;
window.playGLBAnimation = playGLBAnimation;
window.stopGLBAnimations = stopGLBAnimations;
window.pauseGLBAnimation = pauseGLBAnimation;
window.getGLBAnimations = getGLBAnimations;
window.getGLBSize = getGLBSize;
