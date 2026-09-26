// Zone debug panel - временные кнопки для включения/выключения двойных и одинарных зон
// Важно для отладки

import { state } from '../utils/state.js';
import { updateZoneVisibility } from '../sections/section-manager.js';

/**
 * Инициализировать панель отладки зон (кнопки над сценой)
 */
export function initZoneDebugPanel() {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  // По умолчанию зоны выключены; пользователь включает кнопками при необходимости.
  state.showDoubleZones = false;
  state.showSingleZones = false;

  const panel = document.createElement('div');
  panel.id = 'zone-debug-panel';
  panel.style.cssText = `
    position: absolute;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 12px;
    z-index: 1000;
    padding: 8px 12px;
    background: rgba(0,0,0,0.7);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `;

  const btnDouble = document.createElement('button');
  btnDouble.textContent = 'Двухдверные';
  btnDouble.id = 'zone-debug-double';
  btnDouble.style.cssText = `
    padding: 8px 14px;
    border: 1px solid #ffd54f;
    background: #ffd54f;
    color: #333;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
  `;
  updateDoubleBtn();

  const btnSingle = document.createElement('button');
  btnSingle.textContent = 'Однодверные';
  btnSingle.id = 'zone-debug-single';
  btnSingle.style.cssText = `
    padding: 8px 14px;
    border: 1px solid #ffb74d;
    background: #ffb74d;
    color: #333;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
  `;
  updateSingleBtn();

  function updateDoubleBtn() {
    btnDouble.textContent = state.showDoubleZones ? 'Двухдверные ✓' : 'Двухдверные ✗';
    btnDouble.style.opacity = state.showDoubleZones ? '1' : '0.5';
  }
  function updateSingleBtn() {
    btnSingle.textContent = state.showSingleZones ? 'Однодверные ✓' : 'Однодверные ✗';
    btnSingle.style.opacity = state.showSingleZones ? '1' : '0.5';
  }

  btnDouble.addEventListener('click', () => {
    state.showDoubleZones = !state.showDoubleZones;
    updateZoneVisibility();
    updateDoubleBtn();
  });

  btnSingle.addEventListener('click', () => {
    state.showSingleZones = !state.showSingleZones;
    updateZoneVisibility();
    updateSingleBtn();
  });

  panel.appendChild(btnDouble);
  panel.appendChild(btnSingle);
  container.appendChild(panel);
  // По умолчанию скрыто; включается кнопкой «настройки секций» на сцене (scene-icons).
  panel.style.display = 'none';

  console.log('✅ Zone debug panel initialized');
}
