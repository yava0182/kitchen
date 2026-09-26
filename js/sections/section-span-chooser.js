/**
 * UI выбора пролётов стены при постановке секции.
 */
import { state } from '../utils/state.js';

const ROOT_ID = 'cld-section-span-chooser';

function ensureStyles() {
  if (document.getElementById('cld-section-span-chooser-css')) return;
  const style = document.createElement('style');
  style.id = 'cld-section-span-chooser-css';
  style.textContent = `
    #${ROOT_ID} {
      position: fixed;
      left: 50%;
      bottom: 28px;
      transform: translateX(-50%);
      z-index: 12000;
      display: none;
      flex-direction: column;
      gap: 8px;
      align-items: center;
      pointer-events: auto;
      font: 13px/1.35 "Segoe UI", system-ui, sans-serif;
      color: #1c1c1c;
    }
    #${ROOT_ID}.is-open { display: flex; }
    #${ROOT_ID} .cld-span-chooser-card {
      background: rgba(255,255,255,0.96);
      border: 1px solid rgba(0,0,0,0.12);
      box-shadow: 0 8px 28px rgba(0,0,0,0.18);
      border-radius: 12px;
      padding: 10px 12px;
      max-width: min(920px, calc(100vw - 24px));
    }
    #${ROOT_ID} .cld-span-chooser-title {
      font-size: 12px;
      color: #666;
      margin: 0 0 8px;
    }
    #${ROOT_ID} .cld-span-chooser-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: center;
    }
    #${ROOT_ID} .cld-span-pill {
      appearance: none;
      border: 1px solid #cfcfcf;
      background: #f7f7f5;
      color: #1c1c1c;
      border-radius: 999px;
      padding: 7px 12px;
      cursor: pointer;
      font: inherit;
    }
    #${ROOT_ID} .cld-span-pill:hover { border-color: #999; background: #fff; }
    #${ROOT_ID} .cld-span-pill.is-active {
      border-color: #2f6b45;
      background: #e8f3ec;
      box-shadow: inset 0 0 0 1px #2f6b45;
    }
    #${ROOT_ID} .cld-span-pill.is-disabled {
      opacity: 0.45;
      cursor: not-allowed;
      text-decoration: line-through;
    }
    #${ROOT_ID} .cld-span-hint {
      margin: 8px 0 0;
      font-size: 11px;
      color: #777;
      text-align: center;
    }
    #${ROOT_ID} .cld-span-confirm-row {
      display: flex;
      justify-content: center;
      margin-top: 10px;
    }
    #${ROOT_ID} .cld-span-confirm-btn {
      appearance: none;
      border: none;
      background: #2f6b45;
      color: #fff;
      border-radius: 999px;
      padding: 9px 22px;
      cursor: pointer;
      font: inherit;
      font-weight: 600;
    }
    #${ROOT_ID} .cld-span-confirm-btn:hover { background: #255a39; }
    #${ROOT_ID} .cld-span-confirm-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);
}

function getRoot() {
  ensureStyles();
  let el = document.getElementById(ROOT_ID);
  if (el) return el;
  el = document.createElement('div');
  el.id = ROOT_ID;
  el.innerHTML = `
    <div class="cld-span-chooser-card">
      <p class="cld-span-chooser-title">Куда поставить секцию на этой стене?</p>
      <div class="cld-span-chooser-row" data-row></div>
      <p class="cld-span-hint">«Вдоль стены с окном» — три секции (высокие по бокам + низкая под окном), у каждой свои отступы и ячейки. «Оба пролёта» — только два высоких.</p>
      <div class="cld-span-confirm-row" data-confirm-row>
        <button type="button" class="cld-span-confirm-btn" data-confirm>Поставить</button>
      </div>
    </div>
  `;
  document.body.appendChild(el);
  return el;
}

function spansStructureSig(spans, bridgeSpan = null) {
  const base = (spans || [])
    .map((s) => `${s.id}|${s.placeable ? 1 : 0}|${s.tooNarrow ? 1 : 0}|${s.label || ''}`)
    .join(';');
  const br = bridgeSpan
    ? `|BR:${bridgeSpan.id}|${bridgeSpan.alongA}-${bridgeSpan.alongB}|${bridgeSpan.sillMm || 0}`
    : '';
  return base + br;
}

/**
 * @param {Array} spans
 * @param {{
 *   selectedIds: string[],
 *   placeAll: boolean,
 *   placeBridge?: boolean,
 *   selectionLocked: boolean,
 *   allowBoth?: boolean,
 *   bridgeSpan?: object|null,
 *   onSelect: Function,
 *   onSelectAll: Function,
 *   onSelectBridge?: Function,
 *   onConfirm: Function
 * }} api
 */
export function showSectionSpanChooser(spans, api) {
  const root = getRoot();
  const row = root.querySelector('[data-row]');
  const confirmRow = root.querySelector('[data-confirm-row]');
  const confirmBtn = root.querySelector('[data-confirm]');
  if (!row) return;

  const placeable = (spans || []).filter((s) => s.placeable);
  const bridgeSpan = api.bridgeSpan || null;
  const hasBridge = !!(bridgeSpan && bridgeSpan.placeable);

  if (placeable.length <= 1 && !hasBridge) {
    hideSectionSpanChooser();
    root._cldSpanStructSig = '';
    return;
  }

  const structSig = spansStructureSig(spans, hasBridge ? bridgeSpan : null);
  const needRebuild = root._cldSpanStructSig !== structSig;

  if (needRebuild) {
    root._cldSpanStructSig = structSig;
    row.innerHTML = '';

    (spans || []).forEach((span) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cld-span-pill';
      btn.dataset.spanId = span.id;
      btn.textContent = span.tooNarrow ? `${span.label} (узко)` : span.label;
      if (span.tooNarrow || !span.placeable) {
        btn.classList.add('is-disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (typeof api.onSelect === 'function') api.onSelect(span.id);
        });
      }
      row.appendChild(btn);
    });

    if (placeable.length >= 2 && api.allowBoth !== false) {
      const both = document.createElement('button');
      both.type = 'button';
      both.className = 'cld-span-pill';
      both.dataset.spanId = '__all__';
      both.textContent =
        placeable.length === 2
          ? 'Оба пролёта'
          : `Все пролёты (${placeable.length})`;
      both.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof api.onSelectAll === 'function') api.onSelectAll();
      });
      row.appendChild(both);
    }

    if (hasBridge) {
      const bridgeBtn = document.createElement('button');
      bridgeBtn.type = 'button';
      bridgeBtn.className = 'cld-span-pill';
      bridgeBtn.dataset.spanId = '__window_bridge__';
      bridgeBtn.textContent = bridgeSpan.label || 'Вдоль стены с окном';
      bridgeBtn.title =
        'Три секции: высокие по бокам и низкая под подоконником — у каждой свои настройки';
      bridgeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof api.onSelectBridge === 'function') api.onSelectBridge();
      });
      row.appendChild(bridgeBtn);
    }
  }

  // Обновляем активные пилюли без пересоздания DOM (иначе клик съедается mousemove).
  const selected = new Set(api.selectedIds || []);
  row.querySelectorAll('.cld-span-pill').forEach((btn) => {
    const id = btn.dataset.spanId;
    if (id === '__all__') {
      btn.classList.toggle('is-active', !!api.placeAll && !api.placeBridge);
      return;
    }
    if (id === '__window_bridge__') {
      btn.classList.toggle('is-active', !!api.placeBridge);
      return;
    }
    btn.classList.toggle(
      'is-active',
      !api.placeAll && !api.placeBridge && selected.has(id)
    );
  });

  const hasSelection =
    !!api.placeBridge ||
    !!api.placeAll ||
    (api.selectedIds || []).some((id) => placeable.some((s) => s.id === id));

  if (confirmRow) confirmRow.hidden = false;
  if (confirmBtn) {
    confirmBtn.disabled = !hasSelection;
    confirmBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!hasSelection) return;
      if (typeof api.onConfirm === 'function') api.onConfirm();
    };
  }

  // Колбэки всегда актуальные (даже без rebuild).
  row.querySelectorAll('.cld-span-pill:not(:disabled)').forEach((btn) => {
    const id = btn.dataset.spanId;
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (id === '__all__') {
        if (typeof api.onSelectAll === 'function') api.onSelectAll();
      } else if (id === '__window_bridge__') {
        if (typeof api.onSelectBridge === 'function') api.onSelectBridge();
      } else if (typeof api.onSelect === 'function') {
        api.onSelect(id);
      }
    };
  });

  root.classList.add('is-open');
}

export function hideSectionSpanChooser() {
  const root = document.getElementById(ROOT_ID);
  if (root) {
    root.classList.remove('is-open');
    root._cldSpanStructSig = '';
  }
}

export function clearSectionPlacementSpanState() {
  state.sectionPlacementSpans = null;
  state.sectionPlacementWall = null;
  state.sectionPlacementSelectedIds = [];
  state.sectionPlacementPlaceAll = false;
  state.sectionPlacementSelectionLocked = false;
  state.sectionPlacementAllowBoth = true;
  state.sectionPlacementBridgeSpan = null;
  state.sectionPlacementPlaceBridge = false;
  state.sectionPlacementHeightProfile = null;
  state.sectionPlacementPlaceProfile = false;
  hideSectionSpanChooser();
}
