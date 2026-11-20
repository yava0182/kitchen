/**
 * Культурный ввод см-полей:
 * фокус → выделить всё (печать заменяет);
 * сверх max → сразу clamp + красная рамка;
 * ведущие нули убираются (01 → 1, 0 остаётся 0).
 */

export const ROOM_PLAN_DIM_MIN_CM = 100;
export const ROOM_PLAN_DIM_MAX_CM = 2000;
export const ROOM_HEIGHT_MIN_CM = 200;
export const ROOM_HEIGHT_MAX_CM = 500;

export function parseDimCm(raw) {
  const s = String(raw ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function clampDimCm(n, minCm, maxCm) {
  return Math.max(minCm, Math.min(maxCm, Math.round(n)));
}

/** Видимый input по id внутри модалки секции (игнор display:none дублей). */
export function getVisibleInputById(id, root) {
  if (!id) return null;
  const scope =
    root ||
    document.getElementById('edit-section-content') ||
    document.getElementById('edit-section-modal') ||
    document;
  let list;
  try {
    list = scope.querySelectorAll('#' + CSS.escape(String(id)));
  } catch (_) {
    list = scope.querySelectorAll('[id="' + String(id).replace(/"/g, '') + '"]');
  }
  if (!list || !list.length) {
    return document.getElementById(id);
  }
  for (const el of list) {
    let hidden = false;
    let p = el;
    while (p && p !== document.body) {
      if (p instanceof HTMLElement) {
        const st = p.style?.display || '';
        if (st === 'none') {
          hidden = true;
          break;
        }
        try {
          const cs = window.getComputedStyle(p);
          if (cs.display === 'none' || cs.visibility === 'hidden') {
            hidden = true;
            break;
          }
        } catch (_) {}
      }
      p = p.parentElement;
    }
    if (!hidden) return el;
  }
  return list[list.length - 1] || list[0];
}

function setOverMaxUi(el, over, maxCm) {
  const wrap = el.closest?.('.cld-dim-control') || el.closest?.('.cld-edit-section-input-wrap') || el;
  if (over) {
    wrap.classList?.add('is-over-max');
    el.classList.add('is-over-max');
    el.title = 'Максимум ' + maxCm + ' см';
    el.setAttribute('aria-invalid', 'true');
  } else {
    wrap.classList?.remove('is-over-max');
    el.classList.remove('is-over-max');
    el.title = el.dataset.cldDimTitle || '';
    el.removeAttribute('aria-invalid');
  }
}

function selectAllNow(el) {
  try {
    el.select();
    if (typeof el.setSelectionRange === 'function') {
      const len = String(el.value ?? '').length;
      el.setSelectionRange(0, len);
    }
  } catch (_) {}
}

/**
 * Фокус/клик → всегда выделить всё (Chrome не сбрасывает selection mouseup).
 */
export function bindReplaceOnFocusInput(el) {
  if (!el) return;
  // Разрешаем переустановку на том же DOM после reopen модалки.
  if (el._cldReplaceFocusBound) return;
  el._cldReplaceFocusBound = true;

  let armSelect = false;

  const arm = () => {
    armSelect = true;
    selectAllNow(el);
    requestAnimationFrame(() => selectAllNow(el));
    window.setTimeout(() => selectAllNow(el), 0);
    window.setTimeout(() => selectAllNow(el), 16);
  };

  el.addEventListener('focus', arm);
  el.addEventListener('focusin', arm);

  el.addEventListener('mouseup', (e) => {
    if (!armSelect) return;
    e.preventDefault();
    selectAllNow(el);
  });

  el.addEventListener('click', (e) => {
    if (!armSelect) return;
    e.preventDefault();
    selectAllNow(el);
    armSelect = false;
  });

  el.addEventListener('keydown', (e) => {
    // Первая печатная / Backspace при полном select — ок; снимаем arm.
    if (e.key && e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
      armSelect = false;
    }
  });

  el.addEventListener('blur', () => {
    armSelect = false;
  });
}

/**
 * @param {HTMLInputElement} el
 * @param {{ minCm: number, maxCm: number, onLive?: (n:number)=>void, onCommit?: (n:number)=>void, force?: boolean }} opts
 */
export function bindRoomDimCmInput(el, opts) {
  if (!el) return;
  if (el.dataset.cldDimCmBound === '1' && !opts?.force) return;
  el.dataset.cldDimCmBound = '1';
  if (opts?.force) {
    el._cldReplaceFocusBound = false;
    delete el.dataset.cldDimReplaceBound;
  }

  const minCm = Number(opts.minCm);
  const maxCm = Number(opts.maxCm);
  el.min = String(minCm);
  el.max = String(maxCm);
  el.dataset.cldDimTitle = 'От ' + minCm + ' до ' + maxCm + ' см';
  el.title = el.dataset.cldDimTitle;

  const host = el.closest('.cld-dim-control') || el.parentElement;
  if (
    host &&
    !host.classList.contains('cld-dim-control--compact') &&
    !host.querySelector('.cld-dim-control__max')
  ) {
    const hint = document.createElement('span');
    hint.className = 'cld-dim-control__max';
    hint.textContent = 'макс. ' + maxCm + ' см';
    host.appendChild(hint);
  }

  bindReplaceOnFocusInput(el);

  const stripLeadingZeros = () => {
    const raw = String(el.value ?? '');
    if (!raw || raw === '0' || raw === '0.' || raw === '0,') return;
    if (/^0+[1-9]/.test(raw) || /^0{2,}$/.test(raw)) {
      const cleaned = raw.replace(/^0+/, '') || '0';
      if (cleaned !== raw) el.value = cleaned;
    }
  };

  el.addEventListener('input', () => {
    stripLeadingZeros();
    let n = parseDimCm(el.value);
    if (n == null) {
      setOverMaxUi(el, false, maxCm);
      return;
    }
    if (n > maxCm) {
      el.value = String(maxCm);
      n = maxCm;
      setOverMaxUi(el, true, maxCm);
      window.setTimeout(() => setOverMaxUi(el, false, maxCm), 600);
    } else {
      setOverMaxUi(el, false, maxCm);
    }
    if (n >= minCm && typeof opts.onLive === 'function') opts.onLive(Math.round(n));
  });

  const commit = () => {
    const n = parseDimCm(el.value);
    const v = n == null ? minCm : clampDimCm(n, minCm, maxCm);
    el.value = String(v);
    setOverMaxUi(el, false, maxCm);
    if (typeof opts.onCommit === 'function') opts.onCommit(v);
  };

  el.addEventListener('change', commit);
  el.addEventListener('blur', commit);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
      el.blur();
    }
  });
}

/**
 * Отступы секции и любые см-поля в модалке.
 */
export function installCmFieldUx(el, opts = {}) {
  if (!el) return;

  const minCm = Number.isFinite(Number(opts.minCm)) ? Number(opts.minCm) : 0;
  const allowDecimal = opts.allowDecimal !== false;

  try {
    el.type = 'text';
    el.inputMode = 'decimal';
    el.setAttribute('autocomplete', 'off');
    el.setAttribute('spellcheck', 'false');
  } catch (_) {}

  el._cldReplaceFocusBound = false;
  bindReplaceOnFocusInput(el);

  const resolveMax = () => {
    if (typeof opts.getMaxCm === 'function') {
      const m = Number(opts.getMaxCm());
      return Number.isFinite(m) ? Math.max(0, m) : Number(opts.maxCm) || 0;
    }
    const m = Number(opts.maxCm);
    return Number.isFinite(m) ? m : 9999;
  };

  const syncMeta = () => {
    const maxCm = resolveMax();
    el.min = String(minCm);
    el.max = String(maxCm);
    // Сколько цифр нужно под max (150000000 не влезет).
    const maxDigits = Math.max(1, String(Math.floor(maxCm)).length + (allowDecimal ? 2 : 0));
    el.setAttribute('maxlength', String(maxDigits + 2));
    el.dataset.cldDimTitle = 'От ' + minCm + ' до ' + maxCm + ' см';
    if (!el.classList.contains('is-over-max')) el.title = el.dataset.cldDimTitle;
    return maxCm;
  };
  syncMeta();

  const stripLeadingZeros = () => {
    let raw = String(el.value ?? '');
    if (!raw || raw === '0' || raw === '0.' || raw === '0,') return;
    if (/^0+[1-9]/.test(raw) || /^0{2,}([.,]|$)/.test(raw)) {
      const cleaned = raw.replace(/^0+/, '') || '0';
      if (cleaned !== raw) el.value = cleaned;
    }
  };

  const clampToMax = (fireCb) => {
    const maxCm = syncMeta();
    const n = parseDimCm(el.value);
    let v;
    if (n == null) v = minCm;
    else if (allowDecimal) v = Math.max(minCm, Math.min(maxCm, Math.round(n * 10) / 10));
    else v = clampDimCm(n, minCm, maxCm);
    el.value = allowDecimal ? String(v) : String(Math.round(v));
    setOverMaxUi(el, false, maxCm);
    if (fireCb && typeof opts.onClamped === 'function') opts.onClamped(v);
    return v;
  };

  // Не дублировать input-слушатели при повторном open.
  if (el._cldCmFieldInputBound) return;
  el._cldCmFieldInputBound = true;

  el.addEventListener('input', () => {
    stripLeadingZeros();
    // Только цифры / одна точка или запятая
    let raw = String(el.value ?? '');
    raw = raw.replace(/[^\d.,]/g, '');
    const parts = raw.split(/[.,]/);
    if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('');
    if (raw !== el.value) el.value = raw;

    const maxCm = syncMeta();
    let n = parseDimCm(el.value);
    if (n == null) {
      setOverMaxUi(el, false, maxCm);
      return;
    }
    if (n > maxCm) {
      el.value = String(maxCm);
      setOverMaxUi(el, true, maxCm);
      window.setTimeout(() => setOverMaxUi(el, false, maxCm), 500);
      if (typeof opts.onClamped === 'function') opts.onClamped(maxCm);
    } else {
      setOverMaxUi(el, false, maxCm);
    }
  });

  el.addEventListener('blur', () => clampToMax(true));
  el.addEventListener('change', () => clampToMax(true));
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clampToMax(true);
      el.blur();
    }
  });
}
