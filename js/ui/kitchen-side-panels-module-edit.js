/**
 * STEP 3E/3З/3И/4A/4B — «Боковины» в карточке модуля.
 * filler — только НМ (fillerEnabled).
 */

import {
  ensureKitchenSidePanelsOnUserData,
  normalizeKitchenSidePanels,
} from '../kitchen/kitchen-side-panels-contract.js?v=20261031-side4b';

/**
 * @param {object|null|undefined} ud
 */
export function readSidePanelsForModuleEdit(ud) {
  if (!ud || typeof ud !== 'object') {
    return normalizeKitchenSidePanels(null);
  }
  ensureKitchenSidePanelsOnUserData(ud);
  return normalizeKitchenSidePanels(ud.sidePanels);
}

function _esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {string} mode
 * @param {{ replacementEnabled?: boolean, fillerEnabled?: boolean }} flags
 */
function _normUiMode(mode, flags) {
  const m = String(mode || 'standard').toLowerCase();
  if (m === 'overlay') return 'overlay';
  if (m === 'replacement' && flags.replacementEnabled) return 'replacement';
  if (m === 'filler' && flags.fillerEnabled) return 'filler';
  return 'standard';
}

function _sideBlockHtml(side, label, sp, flags) {
  const mode = _normUiMode(sp?.mode, flags);
  const depthMode =
    String(sp?.depthMode || 'auto').toLowerCase() === 'custom' ? 'custom' : 'auto';
  const depthMm = sp?.depthMm > 0 ? Math.round(Number(sp.depthMm)) : '';
  const offsetMm = Math.max(0, Math.round(Number(sp?.depthOffsetMm) || 0));
  const fillerW = sp?.fillerWidthMm > 0 ? Math.round(Number(sp.fillerWidthMm)) : '';
  const depthExtraHidden = mode === 'overlay' || mode === 'filler' ? '' : ' hidden';
  const fillerWidthHidden = mode === 'filler' ? '' : ' hidden';
  const customHidden = depthMode === 'custom' ? '' : ' hidden';
  const depthLabel = mode === 'filler' ? 'Глубина добора' : 'Глубина накладки';
  const replBtn = flags.replacementEnabled
    ? `<button type="button" class="step4-module-hand-btn${mode === 'replacement' ? ' is-selected' : ''}" data-cld-sp-mode="replacement">В цвет фасада (замена боковины)</button>`
    : '';
  const fillerBtn = flags.fillerEnabled
    ? `<button type="button" class="step4-module-hand-btn${mode === 'filler' ? ' is-selected' : ''}" data-cld-sp-mode="filler">Доборная планка</button>`
    : '';
  return `
    <div class="cld-side-panels-side" data-cld-side="${side}">
      <div class="cld-module-edit__label" style="margin-top:10px;">${_esc(label)}</div>
      <div class="cld-module-edit__segment cld-side-panels-mode" style="margin-top:8px;flex-wrap:wrap;" role="group" aria-label="${_esc(label)}">
        <button type="button" class="step4-module-hand-btn${mode === 'standard' ? ' is-selected' : ''}" data-cld-sp-mode="standard">Обычная</button>
        ${replBtn}
        ${fillerBtn}
        <button type="button" class="step4-module-hand-btn${mode === 'overlay' ? ' is-selected' : ''}" data-cld-sp-mode="overlay">Накладка 16 мм</button>
      </div>
      <div class="cld-side-panels-filler-width"${fillerWidthHidden}>
        <div class="cld-module-edit__label-row" style="margin-top:10px;">
          <label class="cld-module-edit__label" for="step4-sp-${side}-filler-width-mm">Ширина добора</label>
        </div>
        <div class="cld-module-edit__input-wrap">
          <input id="step4-sp-${side}-filler-width-mm" class="cld-module-edit__input" type="number" step="1" min="10" max="200" value="${_esc(fillerW)}" data-cld-sp-filler-width-mm />
          <span class="cld-module-edit__unit">мм</span>
        </div>
        <div class="cld-module-edit__hint">По направлению бокового зазора. Не больше свободного места.</div>
      </div>
      <div class="cld-side-panels-extra"${depthExtraHidden}>
        <div class="cld-module-edit__label" style="margin-top:10px;">${_esc(depthLabel)}</div>
        <div class="cld-module-edit__segment cld-side-panels-depth-mode" style="margin-top:8px;" role="group">
          <button type="button" class="step4-module-hand-btn${depthMode === 'auto' ? ' is-selected' : ''}" data-cld-sp-depth-mode="auto">По корпусу</button>
          <button type="button" class="step4-module-hand-btn${depthMode === 'custom' ? ' is-selected' : ''}" data-cld-sp-depth-mode="custom">Своя</button>
        </div>
        <div class="cld-side-panels-custom"${customHidden}>
          <div class="cld-module-edit__label-row" style="margin-top:10px;">
            <label class="cld-module-edit__label" for="step4-sp-${side}-depth-mm">Собственная глубина</label>
          </div>
          <div class="cld-module-edit__input-wrap">
            <input id="step4-sp-${side}-depth-mm" class="cld-module-edit__input" type="number" step="1" min="100" max="600" value="${_esc(depthMm)}" data-cld-sp-depth-mm />
            <span class="cld-module-edit__unit">мм</span>
          </div>
        </div>
        <div class="cld-module-edit__label-row" style="margin-top:10px;">
          <label class="cld-module-edit__label" for="step4-sp-${side}-offset-mm">Смещение назад</label>
        </div>
        <div class="cld-module-edit__input-wrap">
          <input id="step4-sp-${side}-offset-mm" class="cld-module-edit__input" type="number" step="1" min="0" max="200" value="${_esc(offsetMm)}" data-cld-sp-offset-mm />
          <span class="cld-module-edit__unit">мм</span>
        </div>
        <div class="cld-module-edit__hint">0 = вровень с передней плоскостью корпуса. Больше — сдвиг назад. Корпус не двигается.</div>
      </div>
    </div>
  `;
}

/**
 * @param {object} sidePanels normalized
 * @param {{ replacementEnabled?: boolean, fillerEnabled?: boolean }} [opts]
 */
export function buildKitchenSidePanelsModuleEditHtml(sidePanels, opts = {}) {
  const sp = normalizeKitchenSidePanels(sidePanels);
  const flags = {
    replacementEnabled: opts?.replacementEnabled === true,
    fillerEnabled: opts?.fillerEnabled === true,
  };
  return `
    <div class="cld-module-edit__field cld-side-panels-edit" id="step4-side-panels-edit"
      data-cld-sp-replacement="${flags.replacementEnabled ? '1' : '0'}"
      data-cld-sp-filler="${flags.fillerEnabled ? '1' : '0'}">
      <div class="cld-module-edit__label" style="font-size:15px;">Боковины</div>
      <div class="cld-module-edit__hint">Накладка 16 мм. Место берётся перераспределением соседних ячеек (прямая или рукав L/U); корпус не уменьшается. Replacement/добор — без смены сетки.</div>
      ${_sideBlockHtml('left', 'Левая боковина', sp.left, flags)}
      ${_sideBlockHtml('right', 'Правая боковина', sp.right, flags)}
      <div class="cld-module-edit__hint cld-side-panels-msg" id="step4-side-panels-msg" style="color:#B94A48;min-height:1.2em;" hidden></div>
    </div>
  `;
}

function _setMsg(text, isError) {
  const el = document.getElementById('step4-side-panels-msg');
  if (!el) return;
  const t = String(text || '').trim();
  if (!t) {
    el.hidden = true;
    el.textContent = '';
    return;
  }
  el.hidden = false;
  el.textContent = t;
  el.style.color = isError ? '#B94A48' : '#A3A3A3';
}

function _parseModeAttr(raw, flags) {
  const m = String(raw || '').toLowerCase();
  if (m === 'overlay') return 'overlay';
  if (m === 'replacement' && flags.replacementEnabled) return 'replacement';
  if (m === 'filler' && flags.fillerEnabled) return 'filler';
  return 'standard';
}

function _syncSideDom(sideRoot, sideCfg, flags) {
  if (!sideRoot) return;
  const mode = _normUiMode(sideCfg?.mode, flags);
  const depthMode =
    String(sideCfg?.depthMode || 'auto').toLowerCase() === 'custom' ? 'custom' : 'auto';
  sideRoot.querySelectorAll('[data-cld-sp-mode]').forEach((btn) => {
    btn.classList.toggle('is-selected', btn.getAttribute('data-cld-sp-mode') === mode);
  });
  sideRoot.querySelectorAll('[data-cld-sp-depth-mode]').forEach((btn) => {
    btn.classList.toggle(
      'is-selected',
      btn.getAttribute('data-cld-sp-depth-mode') === depthMode
    );
  });
  const fillerWrap = sideRoot.querySelector('.cld-side-panels-filler-width');
  if (fillerWrap) fillerWrap.hidden = mode !== 'filler';
  const extra = sideRoot.querySelector('.cld-side-panels-extra');
  if (extra) extra.hidden = !(mode === 'overlay' || mode === 'filler');
  const custom = sideRoot.querySelector('.cld-side-panels-custom');
  if (custom) custom.hidden = depthMode !== 'custom';
  const depthInput = sideRoot.querySelector('[data-cld-sp-depth-mm]');
  if (depthInput && sideCfg?.depthMm > 0) {
    depthInput.value = String(Math.round(Number(sideCfg.depthMm)));
  }
  const offInput = sideRoot.querySelector('[data-cld-sp-offset-mm]');
  if (offInput) {
    offInput.value = String(Math.max(0, Math.round(Number(sideCfg?.depthOffsetMm) || 0)));
  }
  const fillerInput = sideRoot.querySelector('[data-cld-sp-filler-width-mm]');
  if (fillerInput && sideCfg?.fillerWidthMm > 0) {
    fillerInput.value = String(Math.round(Number(sideCfg.fillerWidthMm)));
  }
}

/**
 * @param {{ getGroup: () => object|null }} opts
 */
export function bindKitchenSidePanelsModuleEdit(opts) {
  const root = document.getElementById('step4-side-panels-edit');
  if (!root || root._cldSpBound) return;
  root._cldSpBound = true;
  const getGroup = typeof opts?.getGroup === 'function' ? opts.getGroup : () => null;
  const flags = {
    replacementEnabled: root.getAttribute('data-cld-sp-replacement') === '1',
    fillerEnabled: root.getAttribute('data-cld-sp-filler') === '1',
  };

  const applySide = (side, patch) => {
    const g = getGroup();
    if (!g) {
      _setMsg('Модуль не найден.', true);
      return false;
    }
    const fn =
      typeof window !== 'undefined' ? window.__cldApplyKitchenSidePanelSide : null;
    if (typeof fn !== 'function') {
      _setMsg('API боковин не загружен — обновите страницу (?v=).', true);
      return false;
    }
    const res = fn(g, side, patch);
    const sideRoot = root.querySelector(`[data-cld-side="${side}"]`);
    if (!res?.ok) {
      _setMsg(res?.message || res?.reason || 'Не удалось применить боковину.', true);
      const sp = readSidePanelsForModuleEdit(g.userData);
      _syncSideDom(sideRoot, sp[side], flags);
      return false;
    }
    _setMsg('');
    _syncSideDom(sideRoot, res.sidePanels?.[side], flags);
    const other = side === 'left' ? 'right' : 'left';
    _syncSideDom(
      root.querySelector(`[data-cld-side="${other}"]`),
      res.sidePanels?.[other],
      flags
    );
    try {
      if (typeof window.__cldMarkRoomDraftDirty === 'function') {
        window.__cldMarkRoomDraftDirty('module_side_panels');
      }
    } catch (_) {}
    return true;
  };

  root.querySelectorAll('.cld-side-panels-side').forEach((sideRoot) => {
    const side = sideRoot.getAttribute('data-cld-side');
    if (side !== 'left' && side !== 'right') return;

    sideRoot.querySelectorAll('[data-cld-sp-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = _parseModeAttr(btn.getAttribute('data-cld-sp-mode'), flags);
        const patch = { mode };
        if (mode === 'filler') {
          const inp = sideRoot.querySelector('[data-cld-sp-filler-width-mm]');
          const v = Math.round(Number(inp?.value) || 0);
          if (v > 0) patch.fillerWidthMm = v;
          else {
            _setMsg('Укажите ширину добора в мм.', true);
            return;
          }
        }
        applySide(side, patch);
      });
    });

    sideRoot.querySelectorAll('[data-cld-sp-depth-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const depthMode =
          btn.getAttribute('data-cld-sp-depth-mode') === 'custom' ? 'custom' : 'auto';
        const g = getGroup();
        const cur = readSidePanelsForModuleEdit(g?.userData)?.[side];
        const mode =
          String(cur?.mode || '').toLowerCase() === 'filler' ? 'filler' : 'overlay';
        const patch = { mode, depthMode };
        if (mode === 'filler' && cur?.fillerWidthMm > 0) {
          patch.fillerWidthMm = Math.round(Number(cur.fillerWidthMm));
        }
        if (depthMode === 'custom') {
          const inp = sideRoot.querySelector('[data-cld-sp-depth-mm]');
          const v = Math.round(Number(inp?.value) || 0);
          const fallback =
            Math.round(Number(g?.userData?.__kitchenCarcassDepthMm) || 0) || 510;
          patch.depthMm = v > 0 ? v : fallback;
          if (inp && !(v > 0)) inp.value = String(patch.depthMm);
        }
        applySide(side, patch);
      });
    });

    const depthInput = sideRoot.querySelector('[data-cld-sp-depth-mm]');
    if (depthInput) {
      const commitDepth = () => {
        const v = Math.round(Number(depthInput.value) || 0);
        if (!(v > 0)) {
          _setMsg('Укажите глубину в мм.', true);
          return;
        }
        const g = getGroup();
        const cur = readSidePanelsForModuleEdit(g?.userData)?.[side];
        const mode =
          String(cur?.mode || '').toLowerCase() === 'filler' ? 'filler' : 'overlay';
        const patch = { mode, depthMode: 'custom', depthMm: v };
        if (mode === 'filler' && cur?.fillerWidthMm > 0) {
          patch.fillerWidthMm = Math.round(Number(cur.fillerWidthMm));
        }
        applySide(side, patch);
      };
      depthInput.addEventListener('change', commitDepth);
      depthInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commitDepth();
        }
      });
    }

    const offInput = sideRoot.querySelector('[data-cld-sp-offset-mm]');
    if (offInput) {
      const commitOff = () => {
        const v = Math.max(0, Math.round(Number(offInput.value) || 0));
        offInput.value = String(v);
        const g = getGroup();
        const cur = readSidePanelsForModuleEdit(g?.userData)?.[side];
        const mode =
          String(cur?.mode || '').toLowerCase() === 'filler' ? 'filler' : 'overlay';
        const patch = { mode, depthOffsetMm: v };
        if (mode === 'filler' && cur?.fillerWidthMm > 0) {
          patch.fillerWidthMm = Math.round(Number(cur.fillerWidthMm));
        }
        applySide(side, patch);
      };
      offInput.addEventListener('change', commitOff);
      offInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commitOff();
        }
      });
    }

    const fillerInput = sideRoot.querySelector('[data-cld-sp-filler-width-mm]');
    if (fillerInput) {
      const commitFiller = () => {
        const v = Math.round(Number(fillerInput.value) || 0);
        if (!(v > 0)) {
          _setMsg('Укажите ширину добора в мм.', true);
          return;
        }
        applySide(side, { mode: 'filler', fillerWidthMm: v });
      };
      fillerInput.addEventListener('change', commitFiller);
      fillerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commitFiller();
        }
      });
    }
  });
}
