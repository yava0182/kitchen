/**
 * window-row-trim-apply.js — фазы 3–4: applyTrimPlan по docs/WINDOW-ROW-ARCHITECTURE-PLAN.md
 *
 * Фаза 3: plinth | topPlank | sidePlank | sideOverlay → reconcile ячеек.
 * Фаза 4: heightMismatch | cap → стыки из plan (junctions модели).
 */
import { state } from '../utils/state.js';
import {
  buildWindowRowState,
  computeTrimPlan,
  setLastWindowRowTrimDiff,
  bumpWindowRowSceneRev,
  getWindowRowRef,
} from './window-row-model.js?v=20260923-cohabit38';

/** Виды обклада фазы 3 (геометрия в группе секции). */
const PHASE3_KINDS = new Set(['plinth', 'topPlank', 'sidePlank', 'sideOverlay']);

/** Виды стыков фазы 4 (геометрия в scene, transition). */
const PHASE4_KINDS = new Set(['heightMismatch', 'cap']);

/** Глубина рекурсии: apply → reconcile (разрешено). */
export let windowRowTrimApplyDepth = 0;

/** Сколько полных проходов стены выполнено — цель: один на жест (см. docs/SECTION-UNIFIED-CONTRACT.md §7). */
let _passCount = 0;

export function getWindowRowTrimPassCount() {
  return _passCount;
}

export function resetWindowRowTrimPassCount() {
  _passCount = 0;
}

export function isWindowRowTrimApplying() {
  return windowRowTrimApplyDepth > 0;
}

export function wallHasWindowRowSections(wallName) {
  if (!Array.isArray(state.customSections)) return false;
  const norm = String(wallName || '').trim().toLowerCase();
  for (const sec of state.customSections) {
    if (!sec || String(sec.wallName || '').toLowerCase() !== norm) continue;
    if (getWindowRowRef(sec)) return true;
  }
  return false;
}

/**
 * Применить план обклада к стене с окном.
 * @param {object[]} plan
 * @param {string} wallName
 * @param {object} [rowState]
 * @returns {{ created: string[], updated: string[], removed: string[], plan: object[] }}
 */
export function applyTrimPlan(plan, wallName, rowState = null) {
  const norm = String(wallName || '').trim().toLowerCase();
  const row = rowState || buildWindowRowState(norm, { skipCache: true });
  const parts = Array.isArray(plan) ? plan : [];
  const diff = { created: [], updated: [], removed: [], plan: parts };

  if (!row || !Array.isArray(state.customSections)) {
    setLastWindowRowTrimDiff(diff);
    return diff;
  }

  const byCell = new Map();
  for (const p of parts) {
    if (!p || !PHASE3_KINDS.has(p.kind)) continue;
    const id = String(p.cellId);
    if (!byCell.has(id)) byCell.set(id, []);
    byCell.get(id).push(p);
  }

  const api =
    typeof window !== 'undefined' ? window.__cldWindowRowTrimApi || null : null;

  const _t = (typeof performance !== 'undefined' ? () => performance.now() : () => Date.now());
  const tApply0 = _t();
  let msReconcile = 0;
  let msFit = 0;
  let msJn = 0;
  let fitCells = 0;

  windowRowTrimApplyDepth += 1;
  try {
    const tRec0 = _t();
    for (const cell of row.cells) {
      const sec = state.customSections.find(
        (s) => s && String(s.id) === String(cell.sectionId)
      );
      if (!sec?.group) continue;
      const cellParts = byCell.get(String(cell.sectionId)) || [];

      if (cell.isEmpty || cellParts.length === 0) {
        const before = _listFrameKeys(sec.group);
        if (api && typeof api.removeCellFrames === 'function') {
          api.removeCellFrames(sec);
        }
        for (const k of before) diff.removed.push(k);
        continue;
      }

      if (api && typeof api.reconcileCellByPlan === 'function') {
        const r = api.reconcileCellByPlan(sec, cell, cellParts);
        if (r?.removed) diff.removed.push(...r.removed);
        if (r?.updated) diff.updated.push(...r.updated);
        if (r?.created) diff.created.push(...r.created);
      } else if (api && typeof api.pruneCellByPlan === 'function') {
        const pruned = api.pruneCellByPlan(sec, cell, cellParts);
        if (pruned?.removed) diff.removed.push(...pruned.removed);
        if (pruned?.updated) diff.updated.push(...pruned.updated);
        if (pruned?.created) diff.created.push(...pruned.created);
      }
    }
    msReconcile = Math.round(_t() - tRec0);

    // После появления sideOverlay на tall — пересчитать layout/fit шкафа (не наезжать на накладку).
    const tFit0 = _t();
    for (const cell of row.cells) {
      if (!cell?.hasWardrobe) continue;
      const sec = state.customSections.find(
        (s) => s && String(s.id) === String(cell.sectionId)
      );
      if (!sec) continue;
      fitCells += 1;
      try {
        if (typeof window.__clodisComputeSectionLayout === 'function') {
          window.__clodisComputeSectionLayout(sec);
        }
        if (typeof window.__clodisUpdateFurnitureInSection === 'function') {
          window.__clodisUpdateFurnitureInSection(sec);
        }
      } catch (_) {}
    }
    msFit = Math.round(_t() - tFit0);

    // Фаза 4: стыки heightMismatch / cap из того же plan.
    const tJn0 = _t();
    const junctionParts = parts.filter((p) => p && PHASE4_KINDS.has(p.kind));
    const applyJn =
      typeof window !== 'undefined' ? window.__cldApplyWindowRowJunctionsFromPlan : null;
    if (typeof applyJn === 'function') {
      const jn = applyJn(norm, parts, row);
      if (jn?.actions?.length) {
        for (const a of jn.actions) {
          if (a?.key) diff.created.push(String(a.key));
        }
      } else if (!junctionParts.length) {
        // plan без стыков — applyJn всё равно снял старые winrow-стыки
      }
    }
    msJn = Math.round(_t() - tJn0);
  } finally {
    windowRowTrimApplyDepth -= 1;
  }

  const passTiming = {
    pass: _passCount,
    wall: norm,
    totalMs: Math.round(_t() - tApply0),
    reconcileMs: msReconcile,
    fitMs: msFit,
    fitCells,
    junctionsMs: msJn,
    cells: row.cells.length,
  };
  if (typeof window !== 'undefined') {
    window.__cldLastWindowRowPass = passTiming;
    if (window.__CLD_DEBUG_PERF === true) console.log('[WINROW-PASS]', passTiming);
  }

  setLastWindowRowTrimDiff(diff);
  return diff;
}

function _listFrameKeys(group) {
  const keys = [];
  if (!group) return keys;
  group.traverse((obj) => {
    if (obj === group) return;
    const ud = obj.userData || {};
    if (ud.windowRowTrimKey) keys.push(String(ud.windowRowTrimKey));
    else if (ud.isBottomPlank || ud.isTopPlank || ud.isSidePlank || ud.isSideOverlay) {
      keys.push(String(obj.name || obj.uuid));
    }
  });
  return keys;
}

/**
 * Полный проход стены: модель → план → apply (фаза 3 + 4).
 */
export function syncWindowRowTrimForWall(wallName) {
  const norm = String(wallName || '').trim().toLowerCase();
  if (!norm || !wallHasWindowRowSections(norm)) return null;
  _passCount += 1;
  bumpWindowRowSceneRev();
  const row = buildWindowRowState(norm, { skipCache: true });
  if (!row) return null;
  const plan = computeTrimPlan(row);
  return applyTrimPlan(plan, norm, row);
}

if (typeof window !== 'undefined') {
  window.__cldComputeWindowRowTrimPlan = computeTrimPlan;
  window.__cldApplyWindowRowTrimPlan = applyTrimPlan;
  window.__cldSyncWindowRowTrimForWall = syncWindowRowTrimForWall;
  window.__cldWindowRowTrimPassCount = getWindowRowTrimPassCount;
  window.__cldResetWindowRowTrimPassCount = resetWindowRowTrimPassCount;
}
