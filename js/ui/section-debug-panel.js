import {
  setSectionNicheVisualsEnabled,
  setHorizontalRoleSectionsEnabled,
} from '../sections/section-manager.js';
import { reapplyDebugColorsToFurnitureParts } from '../furniture/furniture-manager.js?v=20260907-shelf-props8';
import { syncCabinetPivotDebugVisibility } from '../debug/cabinet-pivot-visibility.js';
import { state } from '../utils/state.js';

/**
 * Панель для включения отладочных визуализаций:
 * - ниши секций (wireframe/fill/pivotMarker) по кнопке
 * - шкаф по layout_role (цоколь/корпус/верх) + pivot на каждой подсекции по кнопке
 */
export function initSectionDebugPanel() {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  // Жёстко по умолчанию выключаем нишы секций.
  // Пользователь сможет включить через кнопку.
  if (typeof window !== 'undefined' && typeof window.DEBUG_COLOR_SECTIONS === 'undefined') {
    window.DEBUG_COLOR_SECTIONS = false;
  }
  if (typeof window !== 'undefined' && typeof window.DEBUG_COLOR_FURNITURE_PARTS === 'undefined') {
    window.DEBUG_COLOR_FURNITURE_PARTS = false;
  }
  if (typeof window !== 'undefined' && typeof window.DEBUG_HORIZONTAL_ROLE_SECTIONS === 'undefined') {
    window.DEBUG_HORIZONTAL_ROLE_SECTIONS = false;
  }
  if (typeof window !== 'undefined' && typeof window.DEBUG_ROOT_SECTION_PIVOTS === 'undefined') {
    window.DEBUG_ROOT_SECTION_PIVOTS = false;
  }
  if (typeof window !== 'undefined' && typeof window.DEBUG_HINGE_SECTION_VOL === 'undefined') {
    window.DEBUG_HINGE_SECTION_VOL = false;
  }
  if (typeof window !== 'undefined' && typeof window.DEBUG_L_SEAM_PIVOT === 'undefined') {
    window.DEBUG_L_SEAM_PIVOT = false;
  }

  const panel = document.createElement('div');
  panel.id = 'section-debug-panel';
  panel.style.cssText = `
    position: absolute;
    top: 110px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 12px;
    z-index: 1000;
    padding: 8px 12px;
    background: rgba(0,0,0,0.65);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `;

  const makeBtn = (id, label, borderColor, bgColor) => {
    const btn = document.createElement('button');
    btn.id = id;
    btn.textContent = label;
    btn.style.cssText = `
      padding: 8px 14px;
      border: 1px solid ${borderColor};
      background: ${bgColor};
      color: #333;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      white-space: nowrap;
    `;
    return btn;
  };

  const btnSections = makeBtn(
    'section-debug-sections',
    '',
    '#90caf9',
    '#90caf9'
  );
  const btnFurniture = makeBtn(
    'section-debug-furniture-parts',
    '',
    '#f48fb1',
    '#f48fb1'
  );
  const btnHorizontal = makeBtn(
    'section-debug-horizontal-roles',
    '',
    '#80deea',
    '#80deea'
  );
  const btnRootPivots = makeBtn(
    'section-debug-root-pivots',
    '',
    '#ffab91',
    '#ffab91'
  );
  const btnHingeVols = makeBtn(
    'section-debug-hinge-vols',
    '',
    '#c5e1a5',
    '#aed581'
  );

  function syncHingeDebugVolumes() {
    const CB = typeof window !== 'undefined' ? window.ClodisBuilder : null;
    if (!CB) return;
    if (window.DEBUG_HINGE_SECTION_VOL === true && typeof CB.refreshHingeDebugVolumesInScene === 'function') {
      CB.refreshHingeDebugVolumesInScene(state.scene);
    } else if (typeof CB.syncHingeDebugVolumesVisibility === 'function') {
      CB.syncHingeDebugVolumesVisibility(state.scene);
    }
  }

  function updateLabels() {
    const se = window.DEBUG_COLOR_SECTIONS === true;
    const fu = window.DEBUG_COLOR_FURNITURE_PARTS === true;
    const hr = window.DEBUG_HORIZONTAL_ROLE_SECTIONS === true;
    const rp = window.DEBUG_ROOT_SECTION_PIVOTS === true;
    const hv = window.DEBUG_HINGE_SECTION_VOL === true;
    btnSections.textContent = `Ниши секций: ${se ? '✓' : '✗'}`;
    btnFurniture.textContent = `Роли шкафа+pivot: ${fu ? '✓' : '✗'}`;
    btnHorizontal.textContent = `Гориз. роли секции: ${hr ? '✓' : '✗'}`;
    btnRootPivots.textContent = `Корень (bbox+pivot): ${rp ? '✓' : '✗'}`;
    btnHingeVols.textContent = `Кубы петель: ${hv ? '✓' : '✗'}`;
    btnSections.style.opacity = se ? '1' : '0.65';
    btnFurniture.style.opacity = fu ? '1' : '0.65';
    btnHorizontal.style.opacity = hr ? '1' : '0.65';
    btnRootPivots.style.opacity = rp ? '1' : '0.65';
    btnHingeVols.style.opacity = hv ? '1' : '0.65';
  }

  btnSections.addEventListener('click', () => {
    window.DEBUG_COLOR_SECTIONS = !(window.DEBUG_COLOR_SECTIONS === true);
    setSectionNicheVisualsEnabled(window.DEBUG_COLOR_SECTIONS === true);
    updateLabels();
  });

  btnFurniture.addEventListener('click', () => {
    window.DEBUG_COLOR_FURNITURE_PARTS = !(window.DEBUG_COLOR_FURNITURE_PARTS === true);
    reapplyDebugColorsToFurnitureParts();
    syncCabinetPivotDebugVisibility();
    updateLabels();
  });

  btnHorizontal.addEventListener('click', () => {
    window.DEBUG_HORIZONTAL_ROLE_SECTIONS = !(window.DEBUG_HORIZONTAL_ROLE_SECTIONS === true);
    setHorizontalRoleSectionsEnabled(window.DEBUG_HORIZONTAL_ROLE_SECTIONS === true);
    updateLabels();
  });
  
  btnRootPivots.addEventListener('click', () => {
    window.DEBUG_ROOT_SECTION_PIVOTS = !(window.DEBUG_ROOT_SECTION_PIVOTS === true);
    syncCabinetPivotDebugVisibility();
    updateLabels();
  });

  btnHingeVols.title = 'Полупрозрачные bbox секций петли (catalog_31) в комнате';
  btnHingeVols.addEventListener('click', () => {
    window.DEBUG_HINGE_SECTION_VOL = !(window.DEBUG_HINGE_SECTION_VOL === true);
    syncHingeDebugVolumes();
    updateLabels();
  });

  panel.appendChild(btnSections);
  panel.appendChild(btnFurniture);
  panel.appendChild(btnHorizontal);
  panel.appendChild(btnRootPivots);
  panel.appendChild(btnHingeVols);
  container.appendChild(panel);
  // По умолчанию скрыто; включается кнопкой «настройки секций» на сцене (scene-icons).
  panel.style.display = 'none';

  // Применяем дефолт OFF к уже существующим объектам.
  setSectionNicheVisualsEnabled(window.DEBUG_COLOR_SECTIONS === true);
  setHorizontalRoleSectionsEnabled(window.DEBUG_HORIZONTAL_ROLE_SECTIONS === true);
  syncCabinetPivotDebugVisibility();
  syncHingeDebugVolumes();

  updateLabels();
}
