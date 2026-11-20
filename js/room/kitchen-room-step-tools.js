/**
 * Шаг 1 кухни: режимы как у IKEA (форма / размеры / проёмы / стиль),
 * контент — в нашей правой панели, логика — существующий room-edit.
 */

import {
  setRoomEditPanel,
  enterKitchenShapePlanView,
  prepareKitchenRoomEditCatalogs,
} from './room-edit-toolbar.js?v=20261110-ikeaPort10';
import {
  mountRoomEditOpenings,
  unmountRoomEditOpenings,
} from './room-edit-openings.js?v=20261007-passage1';
import {
  mountRoomEditObjects,
  unmountRoomEditObjects,
} from './room-edit-objects.js?v=20261007-pipes-50-10';
import { state } from '../utils/state.js';
import {
  ROOM_PLAN_DIM_MIN_CM,
  ROOM_PLAN_DIM_MAX_CM,
  ROOM_HEIGHT_MIN_CM,
  ROOM_HEIGHT_MAX_CM,
  bindRoomDimCmInput,
} from './room-dim-input.js?v=20261104-ghoststep2';

const MODES = [
  { id: 'shape', label: 'Форма' },
  { id: 'plan', label: 'План' },
  { id: 'size', label: 'Размеры' },
  { id: 'objects', label: 'Объекты' },
  { id: 'doors', label: 'Двери' },
  { id: 'windows', label: 'Окна' },
  { id: 'water', label: 'Вывод воды' },
  { id: 'style', label: 'Стиль' },
];

const PANEL_IDS = {
  size: 'cld-room-edit-panel-shape',
  objects: 'cld-room-edit-panel-objects',
  doors: 'cld-room-edit-panel-doors',
  windows: 'cld-room-edit-panel-windows',
  style: 'cld-room-edit-panel-style',
};

const PLAN_TOOLS = [
  {
    id: 'wall',
    title: 'Добавить стену',
    desc: 'Нажмите один раз, чтобы начать, и ещё раз — чтобы закончить',
  },
  {
    id: 'zone',
    title: 'Разграничить зоны',
    desc: 'Невидимая линия для зон (например, обеденная)',
  },
  {
    id: 'slope',
    title: 'Скошенный потолок',
    desc: 'Нажмите на стену и задайте размеры скоса',
  },
];

let _homeParent = null;
let _moved = [];

function ensureCeilingChip() {
  // Высота только в правой панели «Размеры» — без дубля на сцене
  const chip = document.getElementById('cld-kitchen-ceiling-chip');
  if (chip) chip.remove();
  return null;
}

function syncCeilingChipVisibility() {
  const chip = document.getElementById('cld-kitchen-ceiling-chip');
  if (chip) chip.remove();
}

function parkPanelsHome() {
  if (!_homeParent) {
    _homeParent = document.querySelector('#edit-room-modal .cld-room-edit-sidebar');
  }
  _moved.forEach(({ el, next }) => {
    if (!_homeParent) return;
    if (next && next.parentNode === _homeParent) {
      _homeParent.insertBefore(el, next);
    } else {
      _homeParent.appendChild(el);
    }
  });
  _moved = [];
}

function borrowPanel(panelId, host) {
  const el = document.getElementById(panelId);
  if (!el || !host) return;
  if (!_homeParent) {
    _homeParent = el.parentElement;
  }
  _moved.push({ el, next: el.nextSibling });
  el.hidden = false;
  host.appendChild(el);
}

/** Подписи рёбер для панели (как размеры на плане у IKEA). */
function edgeLabelForShape(shapeKey, edgeIndex, n) {
  const key = String(shapeKey || '');
  if (key === 'enclosed_notch') {
    return (
      [
        'Наружная ширина',
        'Наружная глубина',
        'Ниша — длина',
        'Ниша — глубина',
        'Внутренняя ширина',
        'Внутренняя глубина',
      ][edgeIndex] || 'Стена ' + (edgeIndex + 1)
    );
  }
  if (key === 'enclosed_chamfer') {
    return (
      [
        'Наружная ширина',
        'Правая стена',
        'Срез угла',
        'Передняя стена',
        'Левая стена',
      ][edgeIndex] || 'Стена ' + (edgeIndex + 1)
    );
  }
  if (key === 'open_protrusion') {
    return (
      [
        'Наружная ширина',
        'Правая стена',
        'Уступ — длина',
        'Уступ — глубина',
        'Проём (открыто)',
        'Левая стена',
      ][edgeIndex] || 'Стена ' + (edgeIndex + 1)
    );
  }
  const rect = ['Задняя', 'Правая', 'Передняя', 'Левая'];
  return rect[edgeIndex] || 'Стена ' + (edgeIndex + 1) + (n ? ' / ' + n : '');
}

/**
 * Во вкладке «Размеры» — список длин каждого ребра (внутренние стены Г-формы тоже).
 */
export function refreshKitchenEdgeDimsPanel() {
  const panel = document.getElementById('cld-room-edit-panel-shape');
  if (!panel) return;

  let box = document.getElementById('cld-kitchen-edge-dims');
  if (!box) {
    box = document.createElement('div');
    box.id = 'cld-kitchen-edge-dims';
    box.className = 'cld-kitchen-edge-dims';
    const filler = document.getElementById('cld-room-edit-filler-entry');
    if (filler && filler.parentNode === panel) {
      panel.insertBefore(box, filler);
    } else {
      panel.appendChild(box);
    }
  }

  const r = state.room;
  const fp = r && r.footprintSpec;
  const verts = fp && Array.isArray(fp.vertices) ? fp.vertices : null;
  const segs = fp && Array.isArray(fp.segments) ? fp.segments : null;
  const shapeKey = (fp && fp.shapeKey) || (r && r.shapeKey) || '';

  if (!verts || verts.length < 3) {
    box.hidden = true;
    box.replaceChildren();
    return;
  }

  const n = verts.length;
  const rows = [];
  for (let i = 0; i < n; i++) {
    const seg = segs && segs[i];
    if (seg && seg.open) continue;
    const a = verts[i];
    const b = verts[(i + 1) % n];
    const lenMm = Math.hypot(b.x - a.x, b.z - a.z);
    if (lenMm < 40) continue;
    const cm = Math.round(lenMm) / 10;
    rows.push({ i, cm, label: edgeLabelForShape(shapeKey, i, n) });
  }

  if (rows.length <= 4 && (shapeKey === 'enclosed_rect' || shapeKey === 'open_one_wall' || shapeKey === 'open_corner')) {
    // Прямоугольник: достаточно ширины/глубины сверху
    box.hidden = true;
    box.replaceChildren();
    return;
  }

  box.hidden = false;
  box.innerHTML =
    '<p class="cld-kitchen-edge-dims__title">Стены (как на плане)</p>' +
    '<p class="cld-kitchen-edge-dims__hint">Внутренние стороны Г-формы — здесь или кликом по размеру на плане.</p>' +
    rows
      .map((row) => {
        return (
          '<div class="cld-room-edit-field cld-kitchen-edge-dims__row">' +
          '<label for="cld-kitchen-edge-' +
          row.i +
          '">' +
          row.label +
          '</label>' +
          '<div class="cld-dim-control">' +
          '<input type="text" inputmode="decimal" id="cld-kitchen-edge-' +
          row.i +
          '" data-edge-index="' +
          row.i +
          '" value="' +
          row.cm +
          '" min="40" max="' +
          ROOM_PLAN_DIM_MAX_CM +
          '" step="1" autocomplete="off">' +
          '<span class="cld-dim-control__unit" aria-hidden="true">см</span>' +
          '</div></div>'
        );
      })
      .join('');

  box.querySelectorAll('input[data-edge-index]').forEach((inp) => {
    bindRoomDimCmInput(inp, {
      minCm: 40,
      maxCm: ROOM_PLAN_DIM_MAX_CM,
      onCommit: (cm) => {
        const ei = parseInt(inp.getAttribute('data-edge-index'), 10);
        if (!Number.isFinite(ei)) return;
        if (typeof window.__cldApplyRoomEdgeLength === 'function') {
          window.__cldApplyRoomEdgeLength(ei, cm);
        }
        requestAnimationFrame(() => refreshKitchenEdgeDimsPanel());
      },
    });
  });
}

/**
 * @param {HTMLElement} container — корень шага 1 (куда уже положили формы)
 * @param {HTMLElement} shapesWrap — блок с карточками форм
 */
export function installKitchenRoomStepTools(container, shapesWrap) {
  if (!container || !shapesWrap) return;

  parkPanelsHome();
  try {
    prepareKitchenRoomEditCatalogs();
  } catch (e) {
    console.warn('[kitchen] catalogs', e);
  }

  // Размеры: select-all на фокусе, без ведущих нулей, clamp + «макс. N см»
  const rebindKitchenRoomDims = (force = false) => {
    const applyDims = () => {
      if (typeof window.__cldApplyRoomDimensions === 'function') {
        window.__cldApplyRoomDimensions();
      }
    };
    const bindPlan = (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (force) {
        delete el.dataset.cldDimCmBound;
        delete el.dataset.cldDimReplaceBound;
      }
      try {
        el.type = 'text';
        el.inputMode = 'decimal';
        el.setAttribute('autocomplete', 'off');
      } catch (_) {}
      bindRoomDimCmInput(el, {
        force,
        minCm: ROOM_PLAN_DIM_MIN_CM,
        maxCm: ROOM_PLAN_DIM_MAX_CM,
        onLive: () => applyDims(),
        onCommit: () => applyDims(),
      });
    };
    bindPlan('room-width-input');
    bindPlan('room-depth-input');

    const slider = document.getElementById('room-height-slider');
    const heightInput = document.getElementById('room-height-input');
    if (heightInput) {
      if (force) {
        delete heightInput.dataset.cldDimCmBound;
        delete heightInput.dataset.cldDimReplaceBound;
      }
      try {
        heightInput.type = 'text';
        heightInput.inputMode = 'decimal';
        heightInput.setAttribute('autocomplete', 'off');
      } catch (_) {}
      bindRoomDimCmInput(heightInput, {
        force,
        minCm: ROOM_HEIGHT_MIN_CM,
        maxCm: ROOM_HEIGHT_MAX_CM,
        onLive: (n) => {
          if (slider) slider.value = String(n);
          applyDims();
        },
        onCommit: (n) => {
          if (slider) slider.value = String(n);
          applyDims();
        },
      });
    }
    if (slider && heightInput && slider.dataset.cldDimSliderBound !== '1') {
      slider.dataset.cldDimSliderBound = '1';
      slider.addEventListener('input', () => {
        heightInput.value = slider.value;
        applyDims();
      });
    }
  };
  rebindKitchenRoomDims(false);
  window.__cldRebindKitchenRoomDims = () => rebindKitchenRoomDims(true);

  const root = document.createElement('div');
  root.className = 'kitchen-room-step';
  root.id = 'kitchen-room-step';

  const modes = document.createElement('div');
  modes.className = 'kitchen-room-step__modes';
  modes.setAttribute('role', 'tablist');
  modes.setAttribute('aria-label', 'Редактирование комнаты');

  MODES.forEach((m) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'kitchen-room-step__mode';
    btn.dataset.mode = m.id;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', m.id === 'shape' ? 'true' : 'false');
    btn.textContent = m.label;
    modes.appendChild(btn);
  });

  const host = document.createElement('div');
  host.className = 'kitchen-room-step__host';
  host.id = 'kitchen-room-step-host';

  const shapePane = document.createElement('div');
  shapePane.className = 'kitchen-room-step__pane';
  shapePane.dataset.pane = 'shape';
  shapePane.appendChild(shapesWrap);

  const planPane = document.createElement('div');
  planPane.className = 'kitchen-room-step__pane';
  planPane.dataset.pane = 'plan';
  planPane.hidden = true;
  planPane.innerHTML =
    '<h2 class="kitchen-room-step__pane-title">Нарисовать план</h2>' +
    '<p class="kitchen-room-step__pane-hint">Выберите инструмент и разметьте план на виде сверху.</p>' +
    '<div class="kitchen-room-step__plan-list" role="list"></div>';
  const planList = planPane.querySelector('.kitchen-room-step__plan-list');
  PLAN_TOOLS.forEach((t) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'kitchen-room-step__plan-card';
    card.setAttribute('data-draw-tool', t.id);
    card.setAttribute('role', 'listitem');
    card.innerHTML =
      '<span class="kitchen-room-step__plan-card-title">' +
      t.title +
      '</span>' +
      '<span class="kitchen-room-step__plan-card-desc">' +
      t.desc +
      '</span>';
    planList.appendChild(card);
  });
  planList.addEventListener('click', (e) => {
    const card = e.target.closest('[data-draw-tool]');
    if (!card) return;
    const tool = card.getAttribute('data-draw-tool');
    try {
      if (typeof window.__cldEnterKitchenDrawMode === 'function') {
        window.__cldEnterKitchenDrawMode(tool);
      }
    } catch (_) {}
  });

  const waterPane = document.createElement('div');
  waterPane.className = 'kitchen-room-step__pane';
  waterPane.dataset.pane = 'water';
  waterPane.hidden = true;
  waterPane.innerHTML =
    '<h2 class="kitchen-room-step__pane-title">Вывод воды</h2>' +
    '<p class="kitchen-room-step__pane-hint">Выберите стену на плане, где расположен вывод воды — так задаётся сторона для раковины.</p>' +
    '<ol class="kitchen-room-step__water-steps">' +
    '<li>Наведите на белый круг у стены — появится краник</li>' +
    '<li>Кликните — стена подсветится, круг закрасится</li>' +
    '<li>Нажмите <b>OK</b> сверху — краник останется на стене</li>' +
    '</ol>';

  const borrowPane = document.createElement('div');
  borrowPane.className = 'kitchen-room-step__pane';
  borrowPane.dataset.pane = 'borrow';
  borrowPane.hidden = true;

  host.appendChild(shapePane);
  host.appendChild(planPane);
  host.appendChild(waterPane);
  host.appendChild(borrowPane);

  root.appendChild(modes);
  root.appendChild(host);

  container.appendChild(root);

  function leaveSpecialModes(nextMode) {
    if (nextMode !== 'water') {
      try {
        if (typeof window.__cldExitKitchenWaterOutletMode === 'function') {
          window.__cldExitKitchenWaterOutletMode(false);
        }
      } catch (_) {}
    }
    if (nextMode !== 'plan') {
      try {
        if (typeof window.__cldCancelKitchenDrawMode === 'function') {
          window.__cldCancelKitchenDrawMode();
        }
      } catch (_) {}
    }
  }

  function setMode(modeId) {
    const mode = MODES.some((m) => m.id === modeId) ? modeId : 'shape';
    window.__cldKitchenRoomMode = mode;

    modes.querySelectorAll('.kitchen-room-step__mode').forEach((btn) => {
      const on = btn.dataset.mode === mode;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    leaveSpecialModes(mode);
    parkPanelsHome();
    shapePane.hidden = mode !== 'shape';
    planPane.hidden = mode !== 'plan';
    waterPane.hidden = mode !== 'water';
    const borrowModes = mode !== 'shape' && mode !== 'plan' && mode !== 'water';
    borrowPane.hidden = !borrowModes;
    borrowPane.replaceChildren();

    // Скрыть доборы шкафа на кухне — не IKEA kitchen step
    const filler = document.getElementById('cld-room-edit-filler-entry');
    if (filler) filler.hidden = true;

    if (mode === 'shape' || mode === 'plan' || mode === 'water') {
      setRoomEditPanel('shape');
      try {
        unmountRoomEditOpenings();
      } catch (_) {}
      try {
        unmountRoomEditObjects();
      } catch (_) {}
    } else {
      const panelId = PANEL_IDS[mode];
      if (panelId) {
        borrowPanel(panelId, borrowPane);
        if (mode === 'size') {
          setRoomEditPanel('shape');
          try {
            refreshKitchenEdgeDimsPanel();
          } catch (_) {}
        } else setRoomEditPanel(mode === 'style' ? 'style' : mode);
      }
      if (mode === 'doors' || mode === 'windows') {
        try {
          unmountRoomEditObjects();
        } catch (_) {}
        try {
          mountRoomEditOpenings();
        } catch (_) {}
      } else if (mode === 'objects') {
        try {
          unmountRoomEditOpenings();
        } catch (_) {}
        try {
          mountRoomEditObjects();
        } catch (_) {}
      } else {
        try {
          unmountRoomEditOpenings();
        } catch (_) {}
        try {
          unmountRoomEditObjects();
        } catch (_) {}
      }
    }

    try {
      enterKitchenShapePlanView();
    } catch (_) {}

    if (mode === 'water') {
      try {
        if (typeof window.__cldEnterKitchenWaterOutletMode === 'function') {
          window.__cldEnterKitchenWaterOutletMode();
        }
      } catch (_) {}
    }

    syncCeilingChipVisibility();
  }

  modes.addEventListener('click', (e) => {
    const btn = e.target.closest('.kitchen-room-step__mode');
    if (!btn) return;
    setMode(btn.dataset.mode);
  });

  window.__cldSetKitchenRoomMode = setMode;
  window.__cldParkKitchenRoomPanels = parkPanelsHome;

  setMode(window.__cldKitchenRoomMode || 'shape');
}

export function teardownKitchenRoomStepTools() {
  parkPanelsHome();
  try {
    if (typeof window.__cldExitKitchenShapePlanView === 'function') {
      window.__cldExitKitchenShapePlanView();
    }
  } catch (_) {}
  const filler = document.getElementById('cld-room-edit-filler-entry');
  if (filler) filler.hidden = false;
  syncCeilingChipVisibility();
  try {
    unmountRoomEditOpenings();
  } catch (_) {}
  try {
    unmountRoomEditObjects();
  } catch (_) {}
  const root = document.getElementById('kitchen-room-step');
  if (root) root.remove();
}

if (typeof window !== 'undefined') {
  window.__cldInstallKitchenRoomStepTools = installKitchenRoomStepTools;
  window.__cldTeardownKitchenRoomStepTools = teardownKitchenRoomStepTools;
  window.__cldRefreshKitchenEdgeDimsPanel = refreshKitchenEdgeDimsPanel;
}
