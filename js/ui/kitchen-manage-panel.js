/**
 * Шаг 3/4 кухни: «Управление кухней» в правой панели под ценой.
 * Вкладка «Система» — параметры на всю кухню. Модуль — через карандаш.
 */
import { isKitchenProductLineConfig } from '../room/kitchen-room-shapes.js?v=20261005-kitchen-plan2d';
import {
  mountKitchenProjectControls,
  syncKitchenProjectControlsUi,
} from './kitchen-step3-setup.js?v=20261030-kitchen-gs7';

const SLOT_ID = 'cld-kitchen-manage-slot';
const BTN_ID = 'cld-kitchen-manage-btn';
const PANEL_ID = 'cld-kitchen-manage-panel';

/** @type {{ id: string, label: string, ready: boolean }[]} */
const TABS = [
  { id: 'system', label: 'Система', ready: true },
  // Сюда добавлять вкладки на всю кухню (не модуль).
];

let slot = null;
let btn = null;
let panel = null;
let activeTab = 'system';
let roomStepsConfig = null;

function getRoomStepsConfigSafe() {
  if (roomStepsConfig) return roomStepsConfig;
  if (typeof window.getRoomStepsConfig === 'function') {
    try {
      return window.getRoomStepsConfig();
    } catch (_) {}
  }
  return null;
}

function isKitchenUi() {
  return isKitchenProductLineConfig(getRoomStepsConfigSafe());
}

function currentStep() {
  return typeof window !== 'undefined' ? Number(window.currentRoomStep) || 0 : 0;
}

function shouldShow() {
  if (!isKitchenUi()) return false;
  const step = currentStep();
  return step === 3 || step === 4;
}

function setOpen(open) {
  if (!panel || !btn) return;
  panel.classList.toggle('is-open', !!open);
  panel.setAttribute('aria-hidden', open ? 'false' : 'true');
  btn.classList.toggle('is-active', !!open);
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) syncKitchenProjectControlsUi(panel);
}

function selectTab(tabId) {
  activeTab = tabId;
  if (!panel) return;
  panel.querySelectorAll('[data-kitchen-manage-tab]').forEach((el) => {
    const on = el.getAttribute('data-kitchen-manage-tab') === tabId;
    el.classList.toggle('is-active', on);
    el.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  panel.querySelectorAll('[data-kitchen-manage-pane]').forEach((el) => {
    const on = el.getAttribute('data-kitchen-manage-pane') === tabId;
    el.hidden = !on;
  });
  if (tabId === 'system') syncKitchenProjectControlsUi(panel);
}

function removeSceneLeftovers() {
  // Старая кнопка на сцене (если осталась с предыдущего билда).
  const sceneBtn = document.querySelector(
    `#scene-icons-container #${BTN_ID}, .scene-icons-container #${BTN_ID}, .scene-icon-kitchen-manage`,
  );
  if (sceneBtn && sceneBtn.id === BTN_ID && sceneBtn.parentElement !== slot) {
    sceneBtn.remove();
  }
  const scenePanel = document.querySelector(
    `#scene-icons-container #${PANEL_ID}, .scene-icons-container #${PANEL_ID}`,
  );
  if (scenePanel && scenePanel.parentElement !== slot) {
    scenePanel.remove();
  }
}

function buildPanel(host) {
  if (document.getElementById(PANEL_ID)?.parentElement === host) {
    panel = document.getElementById(PANEL_ID);
    return panel;
  }
  document.getElementById(PANEL_ID)?.remove();

  panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.className = 'kitchen-manage-panel';
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'Управление кухней');
  panel.setAttribute('aria-hidden', 'true');

  const tabsHtml = TABS.map(
    (t) =>
      `<button type="button" class="kitchen-manage-panel__tab${t.id === activeTab ? ' is-active' : ''}"` +
      ` role="tab" data-kitchen-manage-tab="${t.id}" aria-selected="${t.id === activeTab ? 'true' : 'false'}"` +
      `${t.ready ? '' : ' disabled'}>${t.label}</button>`,
  ).join('');

  panel.innerHTML =
    `<div class="kitchen-manage-panel__head">` +
    `<div class="kitchen-manage-panel__title">Управление кухней</div>` +
    `<button type="button" class="kitchen-manage-panel__close" data-kitchen-manage-close aria-label="Закрыть">×</button>` +
    `</div>` +
    `<div class="kitchen-manage-panel__tabs" role="tablist" aria-label="Разделы кухни">${tabsHtml}</div>` +
    `<div class="kitchen-manage-panel__body">` +
    `<div class="kitchen-manage-panel__pane" data-kitchen-manage-pane="system" role="tabpanel"></div>` +
    `</div>` +
    `<p class="kitchen-manage-panel__hint">Параметры всей кухни. Настройки модуля — через карандаш на шкафу.</p>`;

  const systemPane = panel.querySelector('[data-kitchen-manage-pane="system"]');
  mountKitchenProjectControls(systemPane, getRoomStepsConfigSafe());

  panel.querySelectorAll('[data-kitchen-manage-tab]').forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      selectTab(tabBtn.getAttribute('data-kitchen-manage-tab'));
    });
  });
  panel.querySelector('[data-kitchen-manage-close]')?.addEventListener('click', () => setOpen(false));

  host.appendChild(panel);
  selectTab(activeTab);
  return panel;
}

function buildButton(host) {
  if (document.getElementById(BTN_ID)?.parentElement === host) {
    btn = document.getElementById(BTN_ID);
    return btn;
  }
  document.getElementById(BTN_ID)?.remove();

  btn = document.createElement('button');
  btn.id = BTN_ID;
  btn.type = 'button';
  btn.className = 'kitchen-manage-slot__btn';
  btn.title = 'Управление кухней';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', PANEL_ID);
  btn.innerHTML =
    `<i class="fas fa-sliders-h" aria-hidden="true"></i><span>Управление кухней</span>`;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!panel?.classList.contains('is-open'));
  });
  host.appendChild(btn);
  return btn;
}

export function syncKitchenManageVisibility() {
  if (!slot) slot = document.getElementById(SLOT_ID);
  if (!slot) return;
  const show = shouldShow();
  slot.hidden = !show;
  slot.classList.toggle('is-visible', show);
  if (btn) btn.style.display = show ? 'inline-flex' : 'none';
  if (!show) setOpen(false);
}

/** После Continue / hydrate — подтянуть selected в панели «Управление кухней». */
export function syncKitchenManagePanelFromProject() {
  if (!panel) {
    panel = document.getElementById(PANEL_ID);
  }
  if (!panel) return false;
  syncKitchenProjectControlsUi(panel);
  return true;
}

/**
 * @param {object|null} [cfg] room_steps_config
 * @returns {boolean}
 */
export function installKitchenManageUi(cfg) {
  roomStepsConfig = cfg || getRoomStepsConfigSafe();
  slot = document.getElementById(SLOT_ID);
  if (!slot) return false;

  removeSceneLeftovers();

  if (!isKitchenProductLineConfig(roomStepsConfig)) {
    syncKitchenManageVisibility();
    return false;
  }

  if (document.getElementById(BTN_ID)?.parentElement === slot && document.getElementById(PANEL_ID)?.parentElement === slot) {
    btn = document.getElementById(BTN_ID);
    panel = document.getElementById(PANEL_ID);
    // Панель уже есть (HMR / повторный install) — пересобрать «Система», иначе старый DOM без новых контролов.
    const systemPane = panel.querySelector('[data-kitchen-manage-pane="system"]');
    if (systemPane) mountKitchenProjectControls(systemPane, roomStepsConfig);
    syncKitchenManageVisibility();
    return true;
  }

  buildButton(slot);
  buildPanel(slot);
  syncKitchenManageVisibility();
  return true;
}

function waitInstall(attempt) {
  const n = Number(attempt) || 0;
  if (installKitchenManageUi()) return;
  if (n >= 40) return;
  setTimeout(() => waitInstall(n + 1), 250);
}

if (typeof window !== 'undefined') {
  window.__cldInstallKitchenManageUi = installKitchenManageUi;
  window.__cldSyncKitchenManageVisibility = syncKitchenManageVisibility;
  window.__cldSyncKitchenManagePanelFromProject = syncKitchenManagePanelFromProject;
  waitInstall(0);
}
