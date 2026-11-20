/**
 * Stage3: автосохранение черновика + модалка «Продолжить / Начать новый».
 * Сериализация — только через ikea-room-fixture (Stage2). Без второго формата.
 */
import {
  ROOM_DRAFT_LS_KEY,
  saveRoomDraft,
  loadRoomDraft,
  clearRoomSceneForNewProject,
  isEmptyRoomFixture,
  readRoomDraftRaw,
} from '../furniture/ikea-room-fixture.js?v=20261030-autosave1';
import { goToRoomStepByNumber } from '../ui/room-steps.js';

export const ROOM_DRAFT_PREV_LS_KEY = 'clodis_room_draft_prev_v2';

/** @typedef {'booting'|'awaiting_choice'|'restoring'|'editing'|'saving'|'error'} RoomDraftPhase */

const DEBOUNCE_MS = 1500;
const STATUS_OK_MS = 2200;

/** @type {RoomDraftPhase} */
let phase = 'booting';
let dirty = false;
let debounceTimer = null;
let statusHideTimer = null;
let installed = false;
let choiceResolved = false;
/** После Continue — не звать load повторно. */
let restoredThisSession = false;

function setPhase(next) {
  phase = next;
  if (typeof window !== 'undefined') {
    window.__cldRoomDraftPhase = phase;
  }
}

export function getRoomDraftPhase() {
  return phase;
}

function canAutosave() {
  return phase === 'editing' && choiceResolved;
}

function showStatus(kind, text) {
  if (typeof document === 'undefined') return;
  let el = document.getElementById('cld-room-draft-status');
  if (!el) {
    el = document.createElement('div');
    el.id = 'cld-room-draft-status';
    el.setAttribute('role', 'status');
    el.style.cssText = [
      'position:fixed',
      'bottom:28px',
      'right:16px',
      'z-index:30050',
      'font:600 13px/1.3 "Cera Pro",Arial,sans-serif',
      'padding:10px 14px',
      'border-radius:12px',
      'box-shadow:0 8px 24px rgba(0,0,0,.12)',
      'pointer-events:none',
      'opacity:0',
      'transition:opacity .2s ease',
      'max-width:min(320px,calc(100vw - 32px))',
    ].join(';');
    document.body.appendChild(el);
  }
  if (statusHideTimer) {
    clearTimeout(statusHideTimer);
    statusHideTimer = null;
  }
  if (kind === 'saving') {
    el.style.background = '#fff';
    el.style.color = '#222';
    el.style.border = '1px solid rgba(34,34,34,.08)';
  } else if (kind === 'ok') {
    el.style.background = '#E8F5E9';
    el.style.color = '#1B5E20';
    el.style.border = '1px solid rgba(27,94,32,.15)';
  } else {
    el.style.background = '#FFEBEE';
    el.style.color = '#B71C1C';
    el.style.border = '1px solid rgba(183,28,28,.18)';
  }
  el.textContent = text;
  el.style.opacity = '1';
  if (kind !== 'saving') {
    statusHideTimer = setTimeout(() => {
      el.style.opacity = '0';
    }, STATUS_OK_MS);
  }
}

function hideStatusSoon() {
  const el = document.getElementById('cld-room-draft-status');
  if (!el) return;
  if (statusHideTimer) clearTimeout(statusHideTimer);
  statusHideTimer = setTimeout(() => {
    el.style.opacity = '0';
  }, 400);
}

function readPrevDraftRaw() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ROOM_DRAFT_PREV_LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.kind !== 'ikea-room-fixture') return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

function writePrevDraft(fixture) {
  if (!fixture || typeof localStorage === 'undefined') {
    return { ok: false, reason: 'no_fixture' };
  }
  try {
    const json = JSON.stringify(fixture);
    localStorage.setItem(ROOM_DRAFT_PREV_LS_KEY, json);
    const back = localStorage.getItem(ROOM_DRAFT_PREV_LS_KEY);
    if (back !== json) {
      return { ok: false, reason: 'prev_verify_failed' };
    }
    return { ok: true, key: ROOM_DRAFT_PREV_LS_KEY };
  } catch (e) {
    return { ok: false, reason: 'storage_error', error: String(e?.message || e) };
  }
}

function removeCurrentDraftKey() {
  try {
    localStorage.removeItem(ROOM_DRAFT_LS_KEY);
  } catch (_) {}
}

/** Синхронный flush (pagehide). Не трогает UI toast при silent. */
export function flushRoomDraftAutosave(opts = {}) {
  const silent = opts.silent === true;
  const force = opts.force === true;
  if (!force && !canAutosave()) {
    return { ok: false, reason: 'phase_blocked', phase };
  }
  if (!dirty && !force) {
    return { ok: false, reason: 'not_dirty' };
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  const prevPhase = phase;
  setPhase('saving');
  if (!silent) showStatus('saving', 'Сохранение…');
  let result;
  try {
    result = saveRoomDraft({ forceEmpty: false });
  } catch (e) {
    result = { ok: false, reason: 'save_threw', error: String(e?.message || e) };
  }
  if (result?.ok) {
    dirty = false;
    setPhase('editing');
    if (!silent) showStatus('ok', 'Проект сохранён');
    return result;
  }
  // empty_overwrite_blocked при пустой сцене — не ошибка пользователя
  if (result?.reason === 'empty_overwrite_blocked' || result?.reason === 'not_dirty') {
    dirty = false;
    setPhase(prevPhase === 'saving' ? 'editing' : prevPhase);
    if (!silent) hideStatusSoon();
    return result;
  }
  setPhase('error');
  if (!silent) showStatus('error', 'Не удалось сохранить');
  // вернуть editing чтобы можно было повторить
  setTimeout(() => {
    if (phase === 'error') setPhase('editing');
  }, 50);
  return result;
}

function scheduleAutosave(reason) {
  if (!canAutosave()) return;
  dirty = true;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    flushRoomDraftAutosave({ silent: false });
  }, DEBOUNCE_MS);
  if (typeof window !== 'undefined') {
    window.__cldRoomDraftLastDirtyReason = reason || null;
  }
}

/** Вызывать после значимого завершения правки. */
export function markRoomDraftDirty(reason) {
  if (!canAutosave()) return false;
  scheduleAutosave(reason || 'edit');
  return true;
}

function ensureChoiceModalDom() {
  let overlay = document.getElementById('cld-room-draft-choice-overlay');
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.id = 'cld-room-draft-choice-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'cld-room-draft-choice-title');
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:30000',
    'display:none',
    'align-items:center',
    'justify-content:center',
    'background:rgba(0,0,0,.4)',
    'padding:24px',
  ].join(';');
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.14);
      border:1px solid rgba(34,34,34,.06);width:440px;max-width:min(440px,calc(100vw - 48px));
      padding:24px;font-family:'Cera Pro',Arial,sans-serif;color:#222;">
      <h3 id="cld-room-draft-choice-title" style="margin:0 0 12px;font-size:18px;font-weight:600;">
        Продолжить работу над проектом?
      </h3>
      <p id="cld-room-draft-choice-meta" style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#555;"></p>
      <button type="button" id="cld-room-draft-btn-continue" class="cld-room-draft-choice-btn"
        style="width:100%;padding:12px 20px;margin:0 0 10px;background:#FF9F1C;color:#222;border:none;
        border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;">
        Продолжить проект
      </button>
      <button type="button" id="cld-room-draft-btn-new" class="cld-room-draft-choice-btn"
        style="width:100%;padding:12px 20px;background:#fff;color:#222;border:1px solid rgba(34,34,34,.16);
        border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;">
        Начать новый проект
      </button>
    </div>`;
  document.body.appendChild(overlay);
  return overlay;
}

function hideChoiceModal() {
  const overlay = document.getElementById('cld-room-draft-choice-overlay');
  if (overlay) overlay.style.display = 'none';
}

async function onContinueProject() {
  if (restoredThisSession) {
    hideChoiceModal();
    choiceResolved = true;
    setPhase('editing');
    return;
  }
  const btnC = document.getElementById('cld-room-draft-btn-continue');
  const btnN = document.getElementById('cld-room-draft-btn-new');
  if (btnC) btnC.disabled = true;
  if (btnN) btnN.disabled = true;
  setPhase('restoring');
  hideChoiceModal();
  try {
    const result = await loadRoomDraft();
    if (!result?.ok) {
      setPhase('error');
      showStatus('error', 'Не удалось восстановить проект');
      choiceResolved = true;
      setPhase('editing');
      return;
    }
    restoredThisSession = true;
    dirty = false;
    choiceResolved = true;
    setPhase('editing');
    showStatus('ok', 'Проект восстановлен');
  } catch (e) {
    setPhase('error');
    showStatus('error', 'Не удалось восстановить проект');
    choiceResolved = true;
    setPhase('editing');
  }
}

async function onNewProject() {
  const current = readRoomDraftRaw();
  if (current && !isEmptyRoomFixture(current)) {
    const backed = writePrevDraft(current);
    if (!backed.ok) {
      setPhase('error');
      showStatus('error', 'Не удалось сохранить копию проекта');
      return;
    }
  }
  removeCurrentDraftKey();
  hideChoiceModal();
  try {
    clearRoomSceneForNewProject();
  } catch (e) {
    console.warn('[room-draft] clear scene', e);
  }
  try {
    goToRoomStepByNumber(1);
  } catch (_) {}
  dirty = false;
  restoredThisSession = false;
  choiceResolved = true;
  setPhase('editing');
  showStatus('ok', 'Новый проект');
}

function showChoiceModal(inspect) {
  const overlay = ensureChoiceModalDom();
  const meta = document.getElementById('cld-room-draft-choice-meta');
  if (meta) {
    const sec = inspect?.sections ?? 0;
    const furn = inspect?.furniture ?? 0;
    const when = inspect?.exportedAt
      ? new Date(inspect.exportedAt).toLocaleString()
      : '';
    meta.textContent = when
      ? `Сохранено: ${when}. Секций: ${sec}, модулей: ${furn}.`
      : `Секций: ${sec}, модулей: ${furn}.`;
  }
  const btnC = document.getElementById('cld-room-draft-btn-continue');
  const btnN = document.getElementById('cld-room-draft-btn-new');
  if (btnC) {
    btnC.onclick = () => {
      onContinueProject();
    };
  }
  if (btnN) {
    btnN.onclick = () => {
      onNewProject();
    };
  }
  overlay.style.display = 'flex';
  setPhase('awaiting_choice');
  choiceResolved = false;
}

/** Техническое восстановление резервного черновика. */
export async function restoreRoomDraftPrev() {
  const prev = readPrevDraftRaw();
  if (!prev || isEmptyRoomFixture(prev)) {
    return { ok: false, reason: 'no_prev' };
  }
  try {
    localStorage.setItem(ROOM_DRAFT_LS_KEY, JSON.stringify(prev));
  } catch (e) {
    return { ok: false, reason: 'storage_error', error: String(e?.message || e) };
  }
  setPhase('restoring');
  choiceResolved = true;
  const result = await loadRoomDraft();
  if (result?.ok) {
    restoredThisSession = true;
    dirty = false;
    setPhase('editing');
  } else {
    setPhase('error');
  }
  return result;
}

function attachLifecycleFlush() {
  if (typeof window === 'undefined') return;
  const flush = () => {
    if (!canAutosave() || !dirty) return;
    flushRoomDraftAutosave({ silent: true });
  };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}

/**
 * Boot gate после init + optional ikeaFixture restore.
 * @param {{ skipChoice?: boolean }} [opts]
 */
export async function bootRoomDraftAutosave(opts = {}) {
  if (installed) return { ok: true, already: true };
  installed = true;
  setPhase('booting');
  attachLifecycleFlush();

  if (typeof window !== 'undefined') {
    window.__cldMarkRoomDraftDirty = markRoomDraftDirty;
    window.__cldFlushRoomDraftAutosave = flushRoomDraftAutosave;
    window.__cldRestoreRoomDraftPrev = restoreRoomDraftPrev;
    window.__cldRoomDraftPrevKey = ROOM_DRAFT_PREV_LS_KEY;
    window.__cldGetRoomDraftPhase = getRoomDraftPhase;
  }

  if (opts.skipChoice) {
    choiceResolved = true;
    restoredThisSession = true;
    setPhase('editing');
    return { ok: true, skippedChoice: true, reason: 'ikea_fixture_or_forced' };
  }

  const raw = readRoomDraftRaw();
  const hasDraft = !!(raw && !isEmptyRoomFixture(raw));
  const inspect = {
    ok: !!raw,
    empty: !raw || isEmptyRoomFixture(raw),
    sections: Array.isArray(raw?.sections) ? raw.sections.length : 0,
    furniture: Array.isArray(raw?.furniture) ? raw.furniture.length : 0,
    exportedAt: raw?.exportedAt ?? null,
    key: ROOM_DRAFT_LS_KEY,
  };

  if (!hasDraft) {
    choiceResolved = true;
    setPhase('editing');
    return { ok: true, choice: 'none', inspect };
  }

  showChoiceModal(inspect);
  return { ok: true, choice: 'awaiting', inspect };
}

export function installRoomDraftAutosaveConsole() {
  if (typeof window === 'undefined') return;
  window.__cldBootRoomDraftAutosave = bootRoomDraftAutosave;
  window.__cldMarkRoomDraftDirty = markRoomDraftDirty;
  window.__cldFlushRoomDraftAutosave = flushRoomDraftAutosave;
  window.__cldRestoreRoomDraftPrev = restoreRoomDraftPrev;
  window.__cldInspectRoomDraftPrev = () => {
    const prev = readPrevDraftRaw();
    return {
      ok: !!prev,
      key: ROOM_DRAFT_PREV_LS_KEY,
      empty: !prev || isEmptyRoomFixture(prev),
      collectProbe: prev ? null : null,
      rawStep: prev?.step ?? null,
      sections: Array.isArray(prev?.sections) ? prev.sections.length : 0,
      furniture: Array.isArray(prev?.furniture) ? prev.furniture.length : 0,
      exportedAt: prev?.exportedAt ?? null,
    };
  };
}
