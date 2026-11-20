/**
 * TEMP UI — «Тест боковин» / кнопка «Боковины» (STEP 3A).
 * Только window.__cldSetKitchenSidePanelOverlay + clearance.
 * Удаление: этот файл + import в main-refactored.js.
 * Не пишет draft / localStorage / autosave. Не трогает геометрию.
 */

import { state } from '../utils/state.js';

const BTN_ID = 'cld-side-panels-test-btn';
const SLOT_ID = 'cld-side-panels-test-slot';
const PANEL_ID = 'cld-side-panels-test-ui';
const POLL_MS = 500;

/** @type {object|null} */
let _pickedGroup = null;
let _panelOpen = false;
let _timer = null;

function _isNm(group) {
  if (!group?.userData?.isFurniture) return false;
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

function _listNm() {
  const out = [];
  const scene = state.scene;
  if (!scene || typeof scene.traverse !== 'function') return out;
  scene.traverse((o) => {
    if (_isNm(o)) out.push(o);
  });
  out.sort((a, b) => Number(a.userData?.zoneIndex || 0) - Number(b.userData?.zoneIndex || 0));
  return out;
}

function _activeGroup() {
  if (_pickedGroup && _pickedGroup.parent && _isNm(_pickedGroup)) return _pickedGroup;
  const sel = state.selectedFurniture?.group;
  if (sel && _isNm(sel)) {
    _pickedGroup = sel;
    return sel;
  }
  return null;
}

function _sideMode(group, side) {
  return String(group?.userData?.sidePanels?.[side]?.mode || 'standard').toLowerCase();
}

function _clearance(group, side) {
  if (typeof window.__cldEvaluateKitchenSidePanelClearanceLive !== 'function') {
    return {
      status: 'unknown',
      reasonCode: 'no_clearance_api',
      message: 'API clearance не загружен.',
    };
  }
  try {
    return (
      window.__cldEvaluateKitchenSidePanelClearanceLive(group, side) || {
        status: 'unknown',
        reasonCode: 'empty',
      }
    );
  } catch (e) {
    return {
      status: 'unknown',
      reasonCode: 'clearance_error',
      message: String(e?.message || e),
    };
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

function _labelNm(g) {
  const zi = g?.userData?.zoneIndex;
  const w = g?.userData?.customWidthMm || g?.userData?.__kitchenCellWidthMm || '?';
  return zi != null ? `НМ зона ${zi} · ${w} мм` : `НМ · ${w} мм`;
}

function _ensureChrome() {
  let slot = document.getElementById(SLOT_ID);
  if (!slot) {
    slot = document.createElement('div');
    slot.id = SLOT_ID;
    slot.className = 'kitchen-manage-slot is-visible';
    slot.setAttribute('data-cld-temp', 'side-panels-test-ui');
    slot.style.display = 'flex';
    slot.hidden = false;
    const after = document.getElementById('cld-kitchen-manage-slot');
    if (after?.parentElement) {
      after.parentElement.insertBefore(slot, after.nextSibling);
    } else {
      const price = document.querySelector('.price-row');
      if (price?.parentElement) price.parentElement.insertBefore(slot, price.nextSibling);
      else document.body.appendChild(slot);
    }
  } else {
    slot.hidden = false;
    slot.style.display = 'flex';
    slot.classList.add('is-visible');
  }

  let btn = document.getElementById(BTN_ID);
  if (!btn) {
    btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.className = 'kitchen-manage-slot__btn';
    btn.setAttribute('data-cld-temp', 'side-panels-test-ui');
    btn.innerHTML = `<i class="fas fa-columns" aria-hidden="true"></i><span>Боковины</span>`;
    btn.title = 'Тест боковых накладок 16 мм';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      _setPanelOpen(!_panelOpen);
    });
    slot.appendChild(btn);
  }

  let panel = document.getElementById(PANEL_ID);
  if (!panel) {
    panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.setAttribute('data-cld-temp', 'side-panels-test-ui');
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Тест боковин');
    panel.style.cssText = [
      'display:none',
      'flex-direction:column',
      'gap:8px',
      'width:100%',
      'padding:10px 12px',
      'border:1px solid #E8E8E8',
      'border-radius:12px',
      'background:#fff',
      'color:#222',
      'font:12px/1.35 "Cera Pro",Arial,sans-serif',
      'box-sizing:border-box',
    ].join(';');
    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <strong style="font-size:13px;">Тест боковин</strong>
        <button type="button" data-role="close" aria-label="Закрыть"
          style="border:0;background:transparent;font-size:18px;line-height:1;cursor:pointer;color:#666;">×</button>
      </div>
      <label style="display:flex;flex-direction:column;gap:4px;font-size:11px;color:#555;">
        Нижний модуль
        <select data-role="pick" style="height:36px;border:1px solid #E8E8E8;border-radius:8px;padding:0 8px;font:12px/1.2 inherit;"></select>
      </label>
      <div data-role="hint" style="font-size:11px;color:#555;white-space:pre-line;"></div>
      <button type="button" data-side="left" class="kitchen-manage-slot__btn" style="height:auto;min-height:40px;padding:8px 10px;"></button>
      <button type="button" data-side="right" class="kitchen-manage-slot__btn" style="height:auto;min-height:40px;padding:8px 10px;"></button>
      <div data-role="msg" style="font-size:11px;min-height:1.2em;color:#9a3412;"></div>
      <div style="font-size:10px;color:#888;">Временно. Не сохраняется в draft автоматически.</div>
    `;
    panel.querySelector('[data-role="close"]')?.addEventListener('click', () => _setPanelOpen(false));
    panel.querySelector('[data-role="pick"]')?.addEventListener('change', (ev) => {
      const uuid = String(ev.target.value || '');
      const found = _listNm().find((g) => g.uuid === uuid) || null;
      _pickedGroup = found;
      if (found) {
        try {
          state.selectedFurniture = { group: found };
        } catch (_) {}
      }
      _refreshPanelBody();
    });
    panel.querySelectorAll('button[data-side]').forEach((b) => {
      b.addEventListener('click', () => _onToggle(b.getAttribute('data-side')));
    });
    slot.appendChild(panel);
  }

  return { slot, btn, panel };
}

function _setPanelOpen(open) {
  _panelOpen = !!open;
  const { btn, panel } = _ensureChrome();
  btn.classList.toggle('is-active', _panelOpen);
  btn.setAttribute('aria-expanded', _panelOpen ? 'true' : 'false');
  panel.style.display = _panelOpen ? 'flex' : 'none';
  if (_panelOpen) _refreshPanelBody();
}

function _setMsg(text, isError) {
  const panel = document.getElementById(PANEL_ID);
  const el = panel?.querySelector('[data-role="msg"]');
  if (!el) return;
  el.textContent = text || '';
  el.style.color = isError ? '#9a3412' : '#166534';
}

function _onToggle(side) {
  const group = _activeGroup();
  if (!group) {
    _setMsg('Сначала выберите нижний модуль в списке выше.', true);
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
    if (res?.reason === 'clearance_not_clear') _setMsg(_humanClearance(res.clearance), true);
    else if (res?.reason === 'not_kitchen_nm') _setMsg('Это не нижний кухонный модуль.', true);
    else _setMsg(res?.message || `Не удалось: ${res?.reason || 'ошибка'}`, true);
    _refreshPanelBody();
    return;
  }
  _setMsg(
    want
      ? `Накладка ${side === 'left' ? 'слева' : 'справа'} включена (16 мм).`
      : `Накладка ${side === 'left' ? 'слева' : 'справа'} выключена.`,
    false
  );
  _refreshPanelBody();
}

function _refreshPanelBody() {
  const { panel, btn } = _ensureChrome();
  if (!panel) return;

  // Кнопка всегда видна, пока слот на месте.
  btn.style.display = 'inline-flex';

  const list = _listNm();
  const pick = panel.querySelector('[data-role="pick"]');
  const hint = panel.querySelector('[data-role="hint"]');
  const btnL = panel.querySelector('button[data-side="left"]');
  const btnR = panel.querySelector('button[data-side="right"]');

  if (pick) {
    const cur = _activeGroup()?.uuid || '';
    const opts = list
      .map(
        (g) =>
          `<option value="${g.uuid}"${g.uuid === cur ? ' selected' : ''}>${_escape(
            _labelNm(g)
          )}</option>`
      )
      .join('');
    pick.innerHTML =
      `<option value="">${list.length ? '— выберите НМ —' : 'Нет нижних модулей на сцене'}</option>` +
      opts;
    if (cur) pick.value = cur;
  }

  const group = _activeGroup();
  if (!group) {
    if (hint) {
      hint.textContent = list.length
        ? 'Выберите нижний модуль в списке, затем сторону накладки.'
        : 'На сцене нет нижних кухонных модулей.';
    }
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

  const leftOn = _sideMode(group, 'left') === 'overlay';
  const rightOn = _sideMode(group, 'right') === 'overlay';
  const cL = _clearance(group, 'left');
  const cR = _clearance(group, 'right');

  if (hint) {
    const parts = [
      `Л: ${leftOn ? 'вкл' : 'выкл'} — ${_humanClearance(cL)}`,
      `П: ${rightOn ? 'вкл' : 'выкл'} — ${_humanClearance(cR)}`,
    ];
    if (cL.status !== 'clear' && cR.status !== 'clear' && !leftOn && !rightOn) {
      parts.push('Ни одна сторона сейчас не имеет подтверждённого свободного места.');
    }
    hint.textContent = parts.join('\n');
  }

  if (btnL) {
    btnL.disabled = false;
    btnL.textContent = leftOn ? 'Левая накладка 16 мм — ВЫКЛ' : 'Левая накладка 16 мм';
  }
  if (btnR) {
    btnR.disabled = false;
    btnR.textContent = rightOn ? 'Правая накладка 16 мм — ВЫКЛ' : 'Правая накладка 16 мм';
  }
}

function _escape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function _tick() {
  _ensureChrome();
  // Подхватить клик по шкафу в сцене → selectedFurniture.
  const sel = state.selectedFurniture?.group;
  if (sel && _isNm(sel) && sel !== _pickedGroup) {
    _pickedGroup = sel;
    if (_panelOpen) _refreshPanelBody();
  }
  if (_panelOpen) _refreshPanelBody();
}

export function installKitchenSidePanelsTestUi() {
  if (typeof window === 'undefined') return;
  if (window.__cldSidePanelsTestUiInstalled) {
    _ensureChrome();
    return;
  }
  window.__cldSidePanelsTestUiInstalled = true;
  _ensureChrome();
  if (_timer) clearInterval(_timer);
  _timer = setInterval(_tick, POLL_MS);
  window.__cldRefreshSidePanelsTestUi = () => {
    _ensureChrome();
    if (_panelOpen) _refreshPanelBody();
  };
  window.__cldOpenSidePanelsTestUi = () => _setPanelOpen(true);
}

export function uninstallKitchenSidePanelsTestUi() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
  document.getElementById(PANEL_ID)?.remove();
  document.getElementById(BTN_ID)?.remove();
  document.getElementById(SLOT_ID)?.remove();
  try {
    delete window.__cldSidePanelsTestUiInstalled;
    delete window.__cldRefreshSidePanelsTestUi;
    delete window.__cldOpenSidePanelsTestUi;
  } catch (_) {}
}

if (typeof window !== 'undefined') {
  window.__cldInstallKitchenSidePanelsTestUi = installKitchenSidePanelsTestUi;
  window.__cldUninstallKitchenSidePanelsTestUi = uninstallKitchenSidePanelsTestUi;
  const boot = () => installKitchenSidePanelsTestUi();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  // Поздний mount: слот кухни появляется после шагов.
  setTimeout(boot, 800);
  setTimeout(boot, 2500);
}
