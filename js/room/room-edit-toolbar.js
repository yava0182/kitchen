/**
 * Room-edit chrome: IKEA-like rail + panels.
 * Doors: catalog click → place centered on far wall; drag in 2D.
 * 2D: wheel zoom in/out (height only), no orbit.
 *
 * Catalog source: room_steps_config.roomEdit
 *   { doors: [{id,name,group,thumb,kind,defaultWidthCm,defaultHeightCm}], windows: [...],
 *     materials: { walls:[], floors:[], ceilings:[] } }
 */

import { state } from '../utils/state.js';
import { setTopViewCamera, applyIkeaEmptyRoomCamera } from '../core/camera.js?v=20261110-ikeaPort10';
import { updateRoomDimensionLabels } from '../ui/scene-icons.js?v=20261027-nmu142q';
import {
  mountRoomEditOpenings,
  unmountRoomEditOpenings,
  setSelectedDoorCatalog,
  setSelectedWindowCatalog,
  onRoomEditPanelChanged,
  reapplyRoomEditOpenings,
} from './room-edit-openings.js?v=20261030-autosave2';
import {
  reapplyRoomEditObjects,
  onRoomEditObjectsPanelChanged,
} from './room-edit-objects.js?v=20261030-autosave2';
import {
  mountKitchenWallEdit,
  unmountKitchenWallEdit,
} from './kitchen-wall-edit.js?v=20261005-draw-wall4';
import {
  mountKitchenDrawModeUi,
  unmountKitchenDrawModeUi,
  setKitchenPlanToolbarVisible,
} from './kitchen-room-draw-mode.js?v=20261006-ikea-slope26';
import {
  mountKitchenWaterOutlet,
  unmountKitchenWaterOutlet,
} from './kitchen-water-outlet.js?v=20261007-no-topbar1';
import {
  DEFAULT_ROOM_EDIT_MATERIALS,
  mountRoomEditMaterials,
  unmountRoomEditMaterials,
  onRoomEditMaterialsPanelChanged,
  reapplyRoomEditMaterials,
  bindStyleCards,
  renderRoomMaterialsCatalog,
} from './room-edit-materials.js?v=20260913-oak-dark';

const PANELS = ['shape', 'objects', 'doors', 'windows', 'style'];

/** Дефолт дверей КЛОДИС (свои GLB) + проход без полотна (IKEA «Проход»). */
const DEFAULT_DOORS = [
  {
    id: 're-door-clodis-fluted',
    name: 'Дверь фрезерованная',
    group: 'Межкомнатные двери',
    thumb: '/models/doors/thumbs/clodis_door_fluted.svg',
    modelUrl: '/models/doors/clodis_door_fluted.glb',
    defaultWidthCm: 95,
    defaultHeightCm: 207,
    kind: 'interior',
  },
  {
    id: 're-door-passage',
    name: 'Проход',
    group: 'Проёмы',
    thumb: '/models/doors/thumbs/clodis_passage.svg',
    modelUrl: '',
    defaultWidthCm: 90,
    defaultHeightCm: 210,
    kind: 'opening',
  },
];

/** Дефолт окон, если в room_steps_config.roomEdit.windows пусто (админка ещё не сохраняла). */
const DEFAULT_WINDOWS = [
  {
    id: 're-win-plastic-01-triple',
    name: 'Окно тройное',
    group: 'Пластиковые',
    thumb: '',
    modelUrl: '/models/windows/set-of-plastic-windows-01-01-triple.glb',
    defaultWidthCm: 264,
    defaultHeightCm: 153,
    defaultSillCm: 90,
  },
  {
    id: 're-win-plastic-02-double',
    name: 'Окно двухстворчатое',
    group: 'Пластиковые',
    thumb: '',
    modelUrl: '/models/windows/set-of-plastic-windows-01-02-double.glb',
    defaultWidthCm: 214,
    defaultHeightCm: 153,
    defaultSillCm: 90,
  },
  {
    id: 're-win-plastic-03-small',
    name: 'Окно маленькое',
    group: 'Пластиковые',
    thumb: '',
    modelUrl: '/models/windows/set-of-plastic-windows-01-03-single-small.glb',
    defaultWidthCm: 66,
    defaultHeightCm: 51,
    defaultSillCm: 120,
  },
  {
    id: 're-win-plastic-04-tall',
    name: 'Окно высокое',
    group: 'Пластиковые',
    thumb: '',
    modelUrl: '/models/windows/set-of-plastic-windows-01-04-tall.glb',
    defaultWidthCm: 132,
    defaultHeightCm: 153,
    defaultSillCm: 90,
  },
  {
    id: 're-win-plastic-05-h-double',
    name: 'Окно горизонтальное',
    group: 'Пластиковые',
    thumb: '',
    modelUrl: '/models/windows/set-of-plastic-windows-01-05-horizontal-double.glb',
    defaultWidthCm: 143,
    defaultHeightCm: 44,
    defaultSillCm: 120,
  },
  {
    id: 're-win-plastic-07-h-wide',
    name: 'Окно широкое низкое',
    group: 'Пластиковые',
    thumb: '',
    modelUrl: '/models/windows/set-of-plastic-windows-01-07-horizontal-wide.glb',
    defaultWidthCm: 214,
    defaultHeightCm: 44,
    defaultSillCm: 120,
  },
];

function readRoomEditConfig() {
  try {
    const raw = localStorage.getItem('room_steps_config');
    const cfg = raw ? JSON.parse(raw) : null;
    if (cfg && cfg.roomEdit && typeof cfg.roomEdit === 'object') {
      const re = cfg.roomEdit;
      if (!Array.isArray(re.doors) || !re.doors.length) {
        re.doors = DEFAULT_DOORS.map((d) => Object.assign({}, d));
      } else {
        const hasFluted = re.doors.some(
          (d) => d && String(d.modelUrl || '').indexOf('clodis_door_fluted') !== -1
        );
        if (!hasFluted) {
          re.doors = DEFAULT_DOORS.filter((d) => d.kind !== 'opening')
            .map((d) => Object.assign({}, d))
            .concat(re.doors);
        }
        const hasPassage = re.doors.some(
          (d) => d && (d.id === 're-door-passage' || d.kind === 'opening')
        );
        if (!hasPassage) {
          const passage = DEFAULT_DOORS.find((d) => d.kind === 'opening');
          if (passage) re.doors = re.doors.concat([Object.assign({}, passage)]);
        }
      }
      if (!Array.isArray(re.windows) || !re.windows.length) {
        re.windows = DEFAULT_WINDOWS.map((w) => Object.assign({}, w));
      } else {
        // Убрать битые старые карточки; подтянуть пластиковый набор, если его ещё нет
        re.windows = re.windows.filter((w) => {
          if (!w) return false;
          const url = String(w.modelUrl || '');
          if (w.id === 're-windows-tall-04') return false;
          if (url.indexOf('plastic-window-') !== -1) return false;
          return true;
        });
        const hasPlastic = re.windows.some(
          (w) => w && String(w.modelUrl || '').indexOf('set-of-plastic-windows-01-') !== -1
        );
        if (!hasPlastic) {
          re.windows = DEFAULT_WINDOWS.map((w) => Object.assign({}, w)).concat(re.windows);
        }
        if (!re.windows.length) {
          re.windows = DEFAULT_WINDOWS.map((w) => Object.assign({}, w));
        }
      }
      if (!re.materials || typeof re.materials !== 'object') {
        re.materials = {};
      }
      if (!Array.isArray(re.materials.walls) || !re.materials.walls.length) {
        re.materials.walls = DEFAULT_ROOM_EDIT_MATERIALS.walls.map((m) => Object.assign({}, m));
      }
      if (!Array.isArray(re.materials.floors) || !re.materials.floors.length) {
        re.materials.floors = DEFAULT_ROOM_EDIT_MATERIALS.floors.map((m) => Object.assign({}, m));
      }
      if (!Array.isArray(re.materials.ceilings) || !re.materials.ceilings.length) {
        re.materials.ceilings = DEFAULT_ROOM_EDIT_MATERIALS.ceilings.map((m) => Object.assign({}, m));
      }
      return re;
    }
  } catch (_) {}
  return {
    doors: DEFAULT_DOORS.map((d) => Object.assign({}, d)),
    windows: DEFAULT_WINDOWS.map((w) => Object.assign({}, w)),
    materials: {
      walls: DEFAULT_ROOM_EDIT_MATERIALS.walls.map((m) => Object.assign({}, m)),
      floors: DEFAULT_ROOM_EDIT_MATERIALS.floors.map((m) => Object.assign({}, m)),
      ceilings: DEFAULT_ROOM_EDIT_MATERIALS.ceilings.map((m) => Object.assign({}, m)),
    },
  };
}

function itemsOf(list) {
  return Array.isArray(list) ? list.filter((it) => it && (it.name || it.id || it.thumb || it.hex)) : [];
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function groupItems(items) {
  const groups = [];
  const map = new Map();
  items.forEach((it) => {
    const key = String(it.group || '').trim() || '';
    if (!map.has(key)) {
      const g = { title: key, items: [] };
      map.set(key, g);
      groups.push(g);
    }
    map.get(key).items.push(it);
  });
  return groups;
}

function cardHtml(it, kind, surface) {
  const name = escapeHtml(it.name || it.id || '');
  const id = escapeHtml(it.id || '');
  const hexRaw = /^#?[0-9a-fA-F]{3,8}$/.test(String(it.hex || ''))
    ? (String(it.hex).charAt(0) === '#' ? it.hex : '#' + it.hex)
    : '';
  const data =
    ' data-kind="' +
    escapeHtml(kind || '') +
    '" data-id="' +
    id +
    '" data-name="' +
    name +
    '" data-door-kind="' +
    escapeHtml(it.kind || 'interior') +
    '" data-w="' +
    escapeHtml(it.defaultWidthCm != null ? it.defaultWidthCm : '') +
    '" data-h="' +
    escapeHtml(it.defaultHeightCm != null ? it.defaultHeightCm : '') +
    '" data-sill="' +
    escapeHtml(it.defaultSillCm != null ? it.defaultSillCm : '') +
    '" data-surface="' +
    escapeHtml(surface || '') +
    '" data-hex="' +
    escapeHtml(hexRaw) +
    '" data-thumb="' +
    escapeHtml(it.thumb || '') +
    '" data-model-url="' +
    escapeHtml(it.modelUrl || '') +
    '"';
  const isMaterial = kind === 'style';
  const cardClass = isMaterial
    ? 'cld-room-edit-card cld-material-card'
    : 'cld-room-edit-card';
  let previewInner;
  if (it.thumb) {
    previewInner =
      '<img class="cld-room-edit-card-thumb" alt="" src="' +
      escapeHtml(it.thumb) +
      '">';
  } else {
    const hex = /^#?[0-9a-fA-F]{3,8}$/.test(String(it.hex || ''))
      ? (String(it.hex).charAt(0) === '#' ? it.hex : '#' + it.hex)
      : '#e8e8e8';
    previewInner =
      '<span class="cld-room-edit-card-swatch" style="background:' +
      escapeHtml(hex) +
      '"></span>';
  }
  const preview =
    '<span class="cld-room-edit-card-preview">' + previewInner + '</span>';
  const nameHtml = isMaterial
    ? '<div class="cld-room-edit-card-name"><span class="cld-room-edit-card-name__text">' +
      name +
      '</span></div>'
    : '<div class="cld-room-edit-card-name">' + name + '</div>';
  return (
    '<button type="button" class="' +
    cardClass +
    '"' +
    data +
    '>' +
    preview +
    nameHtml +
    '</button>'
  );
}

function catalogHtml(items, emptyText, kind, surface) {
  if (!items.length) {
    return '<p class="cld-room-edit-empty">' + escapeHtml(emptyText) + '</p>';
  }
  const isMaterial = kind === 'style';
  const groups = groupItems(items);
  return groups
    .map((g) => {
      let head = '';
      if (isMaterial) {
        head =
          '<div class="cld-style-subgroup__head">' +
          (g.title
            ? '<h4 class="cld-style-subgroup__title">' + escapeHtml(g.title) + '</h4>'
            : '<span class="cld-style-subgroup__title cld-style-subgroup__title--empty" aria-hidden="true"></span>') +
          '<div class="cld-style-row-nav" hidden>' +
          '<button type="button" class="cld-style-row-nav__btn" data-dir="-1" aria-label="Предыдущие материалы">' +
          '<i class="fas fa-chevron-left" aria-hidden="true"></i></button>' +
          '<button type="button" class="cld-style-row-nav__btn" data-dir="1" aria-label="Следующие материалы">' +
          '<i class="fas fa-chevron-right" aria-hidden="true"></i></button>' +
          '</div></div>';
      } else if (g.title) {
        head = '<h3 class="cld-room-edit-group-title">' + escapeHtml(g.title) + '</h3>';
      }
      return (
        '<section class="cld-room-edit-group' +
        (isMaterial ? ' cld-style-subgroup' : '') +
        '">' +
        head +
        '<div class="cld-room-edit-grid' +
        (isMaterial ? ' cld-style-row' : '') +
        '">' +
        g.items.map(function (it) {
          return cardHtml(it, kind, surface);
        }).join('') +
        '</div></section>'
      );
    })
    .join('');
}

function fillCatalogPanels() {
  const cfg = readRoomEditConfig() || {};
  const doorsEl = document.getElementById('cld-room-edit-catalog-doors');
  const windowsEl = document.getElementById('cld-room-edit-catalog-windows');
  const styleEl = document.getElementById('cld-room-edit-catalog-style');
  if (doorsEl) {
    doorsEl.innerHTML = catalogHtml(
      itemsOf(cfg.doors),
      'Каталог дверей задаётся в админке.',
      'door'
    );
  }
  if (windowsEl) {
    windowsEl.innerHTML = catalogHtml(
      itemsOf(cfg.windows),
      'Каталог окон задаётся в админке.',
      'window'
    );
  }
  if (styleEl) {
    renderRoomMaterialsCatalog(styleEl);
  }
  bindDoorCards();
  bindWindowCards();
  bindStyleCards();
}

/** Каталоги дверей/окон/стиля без открытия модалки (шаг 1 кухни). */
export function prepareKitchenRoomEditCatalogs() {
  fillCatalogPanels();
  try {
    mountRoomEditMaterials();
  } catch (_) {}
}

function bindDoorCards() {
  document.querySelectorAll('#cld-room-edit-catalog-doors .cld-room-edit-card').forEach((card) => {
    card.addEventListener('click', () => {
      const w = parseFloat(card.getAttribute('data-w'));
      const h = parseFloat(card.getAttribute('data-h'));
      setSelectedDoorCatalog({
        id: card.getAttribute('data-id') || '',
        name: card.getAttribute('data-name') || '',
        kind: card.getAttribute('data-door-kind') || 'interior',
        defaultWidthCm: Number.isFinite(w) ? w : 90,
        defaultHeightCm: Number.isFinite(h) ? h : 210,
        thumb: (card.querySelector('img') && card.querySelector('img').getAttribute('src')) || '',
        modelUrl: card.getAttribute('data-model-url') || '',
      });
      document.querySelectorAll('#cld-room-edit-catalog-doors .cld-room-edit-card').forEach((c) => {
        c.classList.toggle('is-selected', c === card);
      });
    });
  });
}

function bindWindowCards() {
  document.querySelectorAll('#cld-room-edit-catalog-windows .cld-room-edit-card').forEach((card) => {
    card.addEventListener('click', () => {
      const w = parseFloat(card.getAttribute('data-w'));
      const h = parseFloat(card.getAttribute('data-h'));
      const sill = parseFloat(card.getAttribute('data-sill'));
      setSelectedWindowCatalog({
        id: card.getAttribute('data-id') || '',
        name: card.getAttribute('data-name') || '',
        defaultWidthCm: Number.isFinite(w) ? w : 120,
        defaultHeightCm: Number.isFinite(h) ? h : 120,
        defaultSillCm: Number.isFinite(sill) ? sill : 90,
        hasWindowsill: true,
        thumb: (card.querySelector('img') && card.querySelector('img').getAttribute('src')) || '',
        modelUrl: card.getAttribute('data-model-url') || '',
      });
      document.querySelectorAll('#cld-room-edit-catalog-windows .cld-room-edit-card').forEach((c) => {
        c.classList.toggle('is-selected', c === card);
      });
    });
  });
}

export function setRoomEditPanel(id) {
  const panel = PANELS.includes(id) ? id : 'shape';
  window.__cldRoomEditPanel = panel;
  PANELS.forEach((p) => {
    const el = document.getElementById('cld-room-edit-panel-' + p);
    if (el) el.hidden = p !== panel;
    const btn = document.querySelector('.cld-room-edit-rail-btn[data-panel="' + p + '"]');
    if (btn) {
      const on = p === panel;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  });
  onRoomEditPanelChanged();
  onRoomEditObjectsPanelChanged();
  onRoomEditMaterialsPanelChanged();
}

function hideDimensionLabels() {
  (window.roomDimensionLabels || []).forEach((label) => {
    if (label) label.style.display = 'none';
  });
}

function showDimensionLabels() {
  (window.roomDimensionLabels || []).forEach((label) => {
    if (label) label.style.display = '';
  });
}

function keepCeilingHidden() {
  const room = state.room;
  if (!room) return;
  if (room.walls && room.walls.ceiling) room.walls.ceiling.visible = false;
  if (room.group) {
    room.group.traverse((child) => {
      if (child.userData && child.userData.isCeiling) child.visible = false;
    });
  }
}

export function setRoomEditViewMode(mode) {
  const next = mode === '3d' ? '3d' : '2d';
  window.__cldRoomEditView = next;
  document.querySelectorAll('.cld-room-edit-view-btn').forEach((btn) => {
    const on = btn.getAttribute('data-view') === next;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  if (next === '2d') {
    setTopViewCamera();
    updateRoomDimensionLabels();
    showDimensionLabels();
    if (window.__cldKitchenShapePlan) applyPlanWallColors(true);
  } else {
    // force3d: иначе __cldSceneViewPreset остаётся 'top' → isLockedOrthoView
    // каждый кадр возвращает ortho (кнопка 3D горит, а вид снова «2D»).
    try {
      if (typeof window !== 'undefined') window.__cldSceneViewPreset = '3d';
    } catch (_) {}
    applyIkeaEmptyRoomCamera(state.room, state.camera, { intro: false, force3d: true });
    keepCeilingHidden();
    hideDimensionLabels();
    const layer = document.getElementById('cld-room-outer-dim-lines');
    if (layer) layer.replaceChildren();
    if (window.__cldKitchenShapePlan) applyPlanWallColors(false);
  }
  if (state.room && typeof state.room.updateWallVisibility === 'function' && state.camera) {
    state.room.updateWallVisibility(state.camera);
  }
  // Пересобрать подсветку стены / размеры / gizmo под 2D|3D
  reapplyRoomEditOpenings();
  reapplyRoomEditObjects();
  try {
    if (typeof window.__cldSyncKitchenCeilingSlopeViewVisibility === 'function') {
      window.__cldSyncKitchenCeilingSlopeViewVisibility();
    }
  } catch (_) {}
}

function onRailClick(e) {
  const btn = e.currentTarget;
  const panel = btn.getAttribute('data-panel');
  if (panel) setRoomEditPanel(panel);
}

function onViewClick(e) {
  const view = e.currentTarget.getAttribute('data-view');
  if (!view) return;
  clearShapePlanIntroTimer(); // ручной выбор отменяет авто 3D→2D
  setRoomEditViewMode(view);
  if (window.__cldKitchenShapePlan) applyPlanWallColors(view === '2d');
}

function getFillerTargetSection() {
  if (window.editingSection?.group) return window.editingSection;
  if (window.editingFillerSection?.group) return window.editingFillerSection;
  const secs = Array.isArray(state.customSections) ? state.customSections.filter((s) => s?.group) : [];
  return secs.length ? secs[secs.length - 1] : null;
}

function formatFillerCm(mm) {
  const n = Number(mm);
  if (!Number.isFinite(n)) return '5';
  const cm = n / 10;
  return Number.isInteger(cm) ? String(cm) : cm.toFixed(1).replace(/\.0$/, '');
}

export function syncRoomEditFillerButtons() {
  const wrap = document.getElementById('cld-room-edit-filler-entry');
  if (!wrap) return;
  const sec = getFillerTargetSection();
  const has = !!sec;
  const vals = { left: 50, right: 50, top: 50 };
  const editable = { left: true, right: true, top: true };
  if (has && typeof window.getSectionFillerUiMm === 'function') {
    try {
      const ui = window.getSectionFillerUiMm(sec);
      if (ui) {
        vals.left = ui.leftMm;
        vals.right = ui.rightMm;
        vals.top = ui.topMm;
      }
    } catch (_) {}
  } else if (sec?.filler) {
    vals.left = Number(sec.filler.leftMm) || 50;
    vals.right = Number(sec.filler.rightMm) || 50;
    vals.top = Number(sec.filler.topMm ?? sec.topPlankHeight) || 50;
  }
  if (has && typeof window.getSectionFillerEditableFields === 'function') {
    try {
      const ed = window.getSectionFillerEditableFields(sec);
      if (ed) {
        editable.left = !!ed.left;
        editable.right = !!ed.right;
        editable.top = !!ed.top;
      }
    } catch (_) {}
  }
  const setVal = (id, mm) => {
    const el = document.getElementById(id);
    if (el) el.textContent = formatFillerCm(mm);
  };
  setVal('cld-filler-val-left', vals.left);
  setVal('cld-filler-val-right', vals.right);
  setVal('cld-filler-val-top', vals.top);
  const showBtn = (focus, on) => {
    const btn = wrap.querySelector(`.cld-filler-entry__btn[data-filler-focus="${focus}"]`);
    if (!btn) return;
    btn.hidden = !on;
    btn.disabled = !has || !on;
    btn.title = !has
      ? 'Сначала поставьте секцию на стену'
      : !on
        ? 'На этом торце накладка (отступ > 5 мм) — ширину планки не задаём'
        : '';
  };
  showBtn('left', has && editable.left);
  showBtn('right', has && editable.right);
  showBtn('top', has && editable.top);
  wrap.hidden = has && !editable.left && !editable.right && !editable.top;
}

function onFillerEntryClick(e) {
  const btn = e.currentTarget;
  const focus = btn.getAttribute('data-filler-focus') || 'left';
  const sec = getFillerTargetSection();
  if (!sec) {
    alert('Сначала поставьте секцию на стену (шаг 2 — раскладка).');
    return;
  }
  if (typeof window.showSectionFillerModal === 'function') {
    window.showSectionFillerModal(sec, { focus });
  }
}

function bindRoomEditFillerButtons() {
  document.querySelectorAll('#cld-room-edit-filler-entry .cld-filler-entry__btn').forEach((btn) => {
    btn.removeEventListener('click', onFillerEntryClick);
    btn.addEventListener('click', onFillerEntryClick);
  });
  syncRoomEditFillerButtons();
}

export function mountRoomEditChrome() {
  const modal = document.getElementById('edit-room-modal');
  const viewbar = document.getElementById('cld-room-edit-viewbar');
  window.__cldRoomEditOpen = true;
  window.__cldRoomEditSetPanel = setRoomEditPanel;
  document.body.classList.add('cld-room-edit-open');
  if (modal) modal.classList.add('is-open');
  if (viewbar) viewbar.classList.add('is-open');
  fillCatalogPanels();
  setRoomEditPanel(window.__cldRoomEditPanel || 'shape');
  setRoomEditViewMode('2d');
  mountRoomEditOpenings();
  mountRoomEditMaterials();
  document.querySelectorAll('.cld-room-edit-rail-btn').forEach((btn) => {
    btn.removeEventListener('click', onRailClick);
    btn.addEventListener('click', onRailClick);
  });
  document.querySelectorAll('.cld-room-edit-view-btn').forEach((btn) => {
    btn.removeEventListener('click', onViewClick);
    btn.addEventListener('click', onViewClick);
  });
  bindRoomEditFillerButtons();
}

export function unmountRoomEditChrome() {
  window.__cldRoomEditOpen = false;
  window.__cldRoomDimEditing = null;
  unmountRoomEditOpenings();
  unmountRoomEditMaterials();
  const modal = document.getElementById('edit-room-modal');
  const viewbar = document.getElementById('cld-room-edit-viewbar');
  window.__cldRoomEditOpen = false;
  window.__cldRoomEditView = null;
  window.__cldRoomEditSetPanel = null;
  const layer = document.getElementById('cld-room-outer-dim-lines');
  if (layer) layer.replaceChildren();
  document.body.classList.remove('cld-room-edit-open');
  if (modal) modal.classList.remove('is-open');
  if (viewbar) viewbar.classList.remove('is-open');
  // Закрыть панель планок, если открыта поверх.
  try {
    const filler = document.getElementById('section-filler-modal');
    if (filler) filler.style.display = 'none';
    window.editingFillerSection = null;
  } catch (_) {}
  // Не оставляем орто «Сверху» после Готово — 3D выставит closeEditRoomModal.
  try {
    if (typeof window.__cldExitRoomEditPlanOrtho === 'function') {
      window.__cldExitRoomEditPlanOrtho();
    }
  } catch (_) {}
}

if (typeof window !== 'undefined') {
  window.__cldSyncRoomEditFillerButtons = syncRoomEditFillerButtons;
}

export function syncRoomEditAfterResize() {
  if (!window.__cldRoomEditOpen) return;
  if (window.__cldRoomEditView === '3d') {
    keepCeilingHidden();
    hideDimensionLabels();
  } else {
    // Не сбивать сценические «Прямо/Сбоку» в top после правок НМ / rebuild.
    const scene = String(window.__cldSceneViewPreset || '')
      .trim()
      .toLowerCase();
    if (scene !== 'front' && scene !== 'side') {
      setTopViewCamera();
    }
  }
  reapplyRoomEditMaterials();
}

/** Стиль стен для 2D-плана (IKEA: светло-серый контур + плоский material). */
function applyPlanWallColors(is2d) {
  const room = state.room;
  if (!room?.walls) return;
  const PLAN_FILL = 0xb8b8b2;

  const paintFlat = (mesh) => {
    if (!mesh?.material || mesh.userData?.isWallProxy) return;
    if (is2d) {
      if (mesh.userData._planMatBackup) {
        if (mesh.material?.color?.setHex) mesh.material.color.setHex(PLAN_FILL);
        return;
      }
      mesh.userData._planMatBackup = mesh.material;
      mesh.material = new THREE.MeshBasicMaterial({
        color: PLAN_FILL,
        side: mesh.material.side != null ? mesh.material.side : THREE.DoubleSide,
      });
    } else if (mesh.userData._planMatBackup) {
      const cur = mesh.material;
      mesh.material = mesh.userData._planMatBackup;
      delete mesh.userData._planMatBackup;
      if (cur && cur !== mesh.material) cur.dispose?.();
    } else if (typeof window.applyIkeaWallPaintToStandardMaterial === 'function' && mesh.material?.isMeshStandardMaterial) {
      window.applyIkeaWallPaintToStandardMaterial(mesh.material);
    } else if (mesh.material?.color && typeof mesh.material.color.setHex === 'function') {
      mesh.material.color.setHex(0xf1f0e4);
    }
  };

  Object.keys(room.walls).forEach((name) => {
    if (name === 'ceiling' || name === '__ring') return;
    paintFlat(room.walls[name]);
  });
  paintFlat(room._polygonWallRing);

  const inners = room.wallInners || {};
  Object.keys(inners).forEach((name) => {
    const mesh = inners[name];
    if (!mesh) return;
    mesh.visible = !is2d;
  });
}

/** Только цвета плана после quiet-rebuild (без setTopViewCamera). */
export function applyKitchenPlanColorsQuiet() {
  if (!window.__cldKitchenShapePlan) return;
  applyPlanWallColors(true);
  keepCeilingHidden();
  if (state.room && typeof state.room.updateWallVisibility === 'function' && state.camera) {
    state.room.updateWallVisibility(state.camera);
  }
}

if (typeof window !== 'undefined') {
  window.__cldApplyKitchenPlanColorsQuiet = applyKitchenPlanColorsQuiet;
}

/** Таймер автопереключения 3D → 2D при входе в шаг «Форма кухни». */
let shapePlanIntroTimer = 0;

function clearShapePlanIntroTimer() {
  if (shapePlanIntroTimer) {
    clearTimeout(shapePlanIntroTimer);
    shapePlanIntroTimer = 0;
  }
}

/**
 * Шаг 1 «Форма кухни»: старт в 3D, через 2 с — орто-план 2D.
 * Лишний chrome прячется классом body.cld-kitchen-shape-step.
 */
export function enterKitchenShapePlanView() {
  clearShapePlanIntroTimer();
  window.__cldKitchenShapePlan = true;
  window.__cldRoomEditOpen = true;
  document.body.classList.add('cld-room-edit-open', 'cld-kitchen-shape-step');

  const viewbar = document.getElementById('cld-room-edit-viewbar');
  if (viewbar) {
    viewbar.classList.add('is-open');
    viewbar.querySelectorAll('.cld-room-edit-view-btn').forEach((btn) => {
      btn.removeEventListener('click', onViewClick);
      btn.addEventListener('click', onViewClick);
    });
  }

  // Не открываем edit-room-modal — панели живут в правой колонке шага 1
  const modal = document.getElementById('edit-room-modal');
  if (modal) modal.classList.remove('is-open');

  if (window.editRoomButton) {
    window.editRoomButton.style.display = 'none';
  }

  const chip = document.getElementById('cld-kitchen-ceiling-chip');
  if (chip) chip.remove();

  // Сразу 2D-план (без 3D→2D через 2с — давало белый блик/прыжок при возврате на шаг 1).
  setRoomEditViewMode('2d');

  try {
    mountKitchenWallEdit();
  } catch (e) {
    console.warn('[kitchen wall edit] mount failed', e);
  }
  try {
    // Тулбар Форма/План/Вывод воды скрыт — те же пункты во вкладках справа
    mountKitchenDrawModeUi();
    setKitchenPlanToolbarVisible(false);
  } catch (e) {
    console.warn('[kitchen draw mode] mount failed', e);
  }
  try {
    mountKitchenWaterOutlet();
  } catch (e) {
    console.warn('[kitchen water outlet] mount failed', e);
  }
  try {
    if (typeof window.__cldRefreshKitchenZonesLayer === 'function') {
      window.__cldRefreshKitchenZonesLayer();
    }
  } catch (_) {}
  try {
    if (typeof window.__cldRefreshKitchenCeilingSlopes === 'function') {
      window.__cldRefreshKitchenCeilingSlopes();
    }
  } catch (_) {}
}

export function exitKitchenShapePlanView() {
  if (!window.__cldKitchenShapePlan) return;
  clearShapePlanIntroTimer();
  window.__cldKitchenShapePlan = false;
  document.body.classList.remove('cld-kitchen-shape-step');
  applyPlanWallColors(false);
  try {
    unmountKitchenWallEdit();
  } catch (_) {}
  try {
    unmountKitchenDrawModeUi();
  } catch (_) {}
  try {
    unmountKitchenWaterOutlet();
  } catch (_) {}

  try {
    if (typeof window.__cldTeardownKitchenRoomStepTools === 'function') {
      // панели вернём при уходе со шага 1 через goToStep; здесь только chip
    }
  } catch (_) {}
  const chip = document.getElementById('cld-kitchen-ceiling-chip');
  if (chip) chip.remove();

  if (window.editRoomButton) {
    window.editRoomButton.style.display = '';
  }

  // Если открыт полный редактор комнаты — не трогаем его
  const modal = document.getElementById('edit-room-modal');
  if (modal && modal.classList.contains('is-open')) return;

  window.__cldRoomEditOpen = false;
  window.__cldRoomEditView = null;
  document.body.classList.remove('cld-room-edit-open');
  const viewbar = document.getElementById('cld-room-edit-viewbar');
  if (viewbar) viewbar.classList.remove('is-open');
  const layer = document.getElementById('cld-room-outer-dim-lines');
  if (layer) layer.replaceChildren();

  try {
    if (typeof window.__cldSetSceneViewPreset === 'function') {
      window.__cldSetSceneViewPreset('3d');
    } else if (typeof window.__cldExitRoomEditPlanOrtho === 'function') {
      window.__cldExitRoomEditPlanOrtho();
      applyIkeaEmptyRoomCamera(state.room, state.camera, { intro: false, force3d: true });
    } else {
      applyIkeaEmptyRoomCamera(state.room, state.camera, { intro: false, force3d: true });
    }
  } catch (_) {
    try {
      applyIkeaEmptyRoomCamera(state.room, state.camera, { intro: false, force3d: true });
    } catch (_) {}
  }
}

if (typeof window !== 'undefined') {
  window.__cldEnterKitchenShapePlanView = enterKitchenShapePlanView;
  window.__cldExitKitchenShapePlanView = exitKitchenShapePlanView;
  window.__cldSetRoomEditViewMode = setRoomEditViewMode;
}
