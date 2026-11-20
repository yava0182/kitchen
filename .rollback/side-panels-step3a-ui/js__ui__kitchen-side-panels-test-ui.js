/**
 * TEMP UI — «Тест боковин» (STEP 3A).
 * Только вызывает window.__cldSetKitchenSidePanelOverlay / clearance.
 * Удаление: убрать этот файл + import в main-refactored.js. Логику 3А не трогает.
 * Не пишет draft / localStorage / autosave.
 */

import { state } from '../utils/state.js';

const PANEL_ID = 'cld-side-panels-test-ui';
const POLL_MS = 400;

function _isNm(group) {
  if (typeof window.__cldIsKitchenNmCarcassGroup === 'function') {
    try {
      return !!window.__cldIsKitchenNmCarcassGroup(group);
    } catch (_) {}
  }
  const pk = String(
    group?.userData?.__placementKindProfileId ||
      group?.userData?.__kitchenProfileId ||
      ''
  );
  return pk === 'kitchen_base' || pk === 'kitchen_base_gola' || pk === 'kitchen_base_corner';
}

function _sideMode(group, side) {
  const m = group?.userData?.sidePanels?.[side]?.mode;
  return String(m || 'standard').toLowerCase();
}

function _clearance(group, side) {
  if (typeof window.__cldEvaluateKitchenSidePanelClearanceLive !== 'function') {
    return { status: 'unknown', reasonCode: 'no_clearance_api', message: 'API clearance не загружен.' };
  }
  try {
    return window.__cldEvaluateKitchenSidePanelClearanceLive(group, side) || {
      status: 'unknown',
      reasonCode: 'empty',
    };
  } catch (e) {
    return { status: 'unknown', reasonCode: 'clearance_error', message: String(e?.message || e) };
  }
}

function _humanClearance(c) {
  if (!c) return 'Нет данных о свободном месте.';
  if (c.status === 'clear') {
    const mm = c.availableMm != null ? ` (~${Math.round(Number(c.availableMm))} мм)` : '';
    return `Место свободно${mm}.`;
  }
  const code = String(c.reasonCode || c.adapterReasonCode || '');
  if (c.status === 'blocked' || code === 'insufficient_clearance') {
    return 'Нет места: торец занят соседом или препятствием.';
  }
  if (code === 'trim_state_unconfirmed') {
    return 'Свободное место на торце секции не подтверждено (trim).';
  }
  if (c.status === 'unknown') {
    return c.message || 'Не удалось подтвердить свободное место на этом торце.';
  }
  return c.message || `Нельзя установить (${code || c.status}).`;
}

function _ensurePanel() {
  let panel = document.getElementById(PANEL_ID);
  if (panel) return panel;

  const host = document.getElementById('canvas-container') || document.body;
  panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.setAttribute('data-cld-temp', 'side-panels-test-ui');
  panel.style.cssText = [
    'position:absolute',
    'right:16px',
    'bottom:72px',
    'z-index:1200',
    'width:280px',
    'max-width:calc(100vw - 32px)',
    'padding:10px 12px',
    'border-radius:10px',
    'background:rgba(20,24,32,0.92)',
    'color:#f3f4f6',
    'font:12px/1.35 system-ui,Segoe UI,sans-serif',
    'box-shadow:0 8px 24px rgba(0,0,0,0.35)',
    'display:none',
    'pointer-events:auto',
  ].join(';');

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
      <strong style="font-size:13px;">Тест боковин</strong>
      <span data-role="sel" style="opacity:0.75;font-size:11px;"></span>
    </div>
    <div data-role="hint" style="opacity:0.85;margin-bottom:8px;font-size:11px;"></div>
    <div style="display:flex;flex-direction:column;gap:6px;">
      <button type="button" data-side="left" style="${_btnCss()}"></button>
      <button type="button" data-side="right" style="${_btnCss()}"></button>
    </div>
    <div data-role="msg" style="margin-top:8px;font-size:11px;min-height:1.2em;color:#fde68a;"></div>
  `;

  panel.querySelectorAll('button[data-side]').forEach((btn) => {
    btn.addEventListener('click', () => _onToggle(btn.getAttribute('data-side')));
  });

  host.appendChild(panel);
  return panel;
}

function _btnCss() {
  return [
    'appearance:none',
    'border:1px solid rgba(255,255,255,0.22)',
    'background:rgba(255,255,255,0.08)',
    'color:#fff',
    'border-radius:8px',
    'padding:8px 10px',
    'cursor:pointer',
    'text-align:left',
    'font:12px/1.3 system-ui,Segoe UI,sans-serif',
  ].join(';');
}

function _selectedGroup() {
  return state.selectedFurniture?.group || null;
}

function _setMsg(text, isError) {
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;
  const el = panel.querySelector('[data-role="msg"]');
  if (!el) return;
  el.textContent = text || '';
  el.style.color = isError ? '#fecaca' : '#bbf7d0';
}

function _onToggle(side) {
  const group = _selectedGroup();
  if (!group || !_isNm(group)) {
    _setMsg('Выберите нижний кухонный модуль.', true);
    return;
  }
  if (typeof window.__cldSetKitchenSidePanelOverlay !== 'function') {
    _setMsg('API накладки не загружен. Обновите страницу (Ctrl+F5).', true);
    return;
  }

  const on = _sideMode(group, side) === 'overlay';
  const want = !on;
  const res = window.__cldSetKitchenSidePanelOverlay(group, side, want);

  if (!res?.ok) {
    if (res?.reason === 'clearance_not_clear') {
      _setMsg(_humanClearance(res.clearance), true);
    } else if (res?.reason === 'not_kitchen_nm') {
      _setMsg('Это не нижний кухонный модуль.', true);
    } else {
      _setMsg(res?.message || `Не удалось: ${res?.reason || 'ошибка'}`, true);
    }
    _refresh();
    return;
  }

  if (want) {
    _setMsg(
      `Накладка ${side === 'left' ? 'слева' : 'справа'} включена (16 мм). Столешница расширена. Не сохраняется в draft автоматически.`,
      false
    );
  } else {
    _setMsg(
      `Накладка ${side === 'left' ? 'слева' : 'справа'} выключена. Столешница восстановлена.`,
      false
    );
  }
  _refresh();
}

function _refresh() {
  const panel = _ensurePanel();
  const group = _selectedGroup();
  const sel = panel.querySelector('[data-role="sel"]');
  const hint = panel.querySelector('[data-role="hint"]');
  const btnL = panel.querySelector('button[data-side="left"]');
  const btnR = panel.querySelector('button[data-side="right"]');

  if (!group) {
    panel.style.display = 'none';
    return;
  }

  if (!_isNm(group)) {
    panel.style.display = 'block';
    if (sel) sel.textContent = 'не НМ';
    if (hint) hint.textContent = 'Выберите нижний модуль (НМ), чтобы тестировать накладки.';
    if (btnL) {
      btnL.disabled = true;
      btnL.textContent = 'Левая накладка 16 мм';
    }
    if (btnR) {
      btnR.disabled = true;
      btnR.textContent = 'Правая накладка 16 мм';
    }
    return;
  }

  panel.style.display = 'block';
  const zi = group.userData?.zoneIndex;
  if (sel) sel.textContent = zi != null ? `зона ${zi}` : 'НМ';

  const leftOn = _sideMode(group, 'left') === 'overlay';
  const rightOn = _sideMode(group, 'right') === 'overlay';
  const cL = _clearance(group, 'left');
  const cR = _clearance(group, 'right');

  if (hint) {
    const parts = [];
    parts.push(`Л: ${leftOn ? 'вкл' : 'выкл'} — ${_humanClearance(cL)}`);
    parts.push(`П: ${rightOn ? 'вкл' : 'выкл'} — ${_humanClearance(cR)}`);
    if (cL.status !== 'clear' && cR.status !== 'clear' && !leftOn && !rightOn) {
      parts.push('Ни одна сторона сейчас не имеет подтверждённого свободного места.');
    }
    hint.textContent = parts.join('\n');
    hint.style.whiteSpace = 'pre-line';
  }

  if (btnL) {
    btnL.disabled = false;
    btnL.textContent = leftOn ? 'Левая накладка 16 мм — ВЫКЛ' : 'Левая накладка 16 мм';
    btnL.style.background = leftOn ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.08)';
  }
  if (btnR) {
    btnR.disabled = false;
    btnR.textContent = rightOn ? 'Правая накладка 16 мм — ВЫКЛ' : 'Правая накладка 16 мм';
    btnR.style.background = rightOn ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.08)';
  }
}

let _timer = null;
let _lastSelKey = '';

function _tick() {
  const g = _selectedGroup();
  const key = g
    ? `${g.uuid}|${_sideMode(g, 'left')}|${_sideMode(g, 'right')}|${!!_isNm(g)}`
    : '';
  if (key !== _lastSelKey) {
    _lastSelKey = key;
    _refresh();
  } else if (g && _isNm(g)) {
    // Периодически обновлять статус clearance (соседи могли измениться).
    _refresh();
  } else {
    const panel = document.getElementById(PANEL_ID);
    if (panel && !g) panel.style.display = 'none';
  }
}

export function installKitchenSidePanelsTestUi() {
  if (typeof window === 'undefined') return;
  if (window.__cldSidePanelsTestUiInstalled) return;
  window.__cldSidePanelsTestUiInstalled = true;
  _ensurePanel();
  _refresh();
  if (_timer) clearInterval(_timer);
  _timer = setInterval(_tick, POLL_MS);
  window.__cldRefreshSidePanelsTestUi = _refresh;
}

export function uninstallKitchenSidePanelsTestUi() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
  const panel = document.getElementById(PANEL_ID);
  if (panel) panel.remove();
  try {
    delete window.__cldSidePanelsTestUiInstalled;
    delete window.__cldRefreshSidePanelsTestUi;
  } catch (_) {}
}

if (typeof window !== 'undefined') {
  window.__cldInstallKitchenSidePanelsTestUi = installKitchenSidePanelsTestUi;
  window.__cldUninstallKitchenSidePanelsTestUi = uninstallKitchenSidePanelsTestUi;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => installKitchenSidePanelsTestUi());
  } else {
    installKitchenSidePanelsTestUi();
  }
}
