/**
 * STEP 3A/3E — live API for kitchen NM side-panel overlay.
 * Sets instance sidePanels (mode + depth), runs clearance / worktop gate, rebuilds one NM.
 */

import { state } from '../utils/state.js';
import { readUserDataClodisRoots } from '../clodis-json-fields.js';
import {
  ensureKitchenSidePanelsOnUserData,
  applyKitchenSidePanelsToUserData,
  createDefaultKitchenSidePanels,
  normalizeKitchenSidePanelSide,
  normalizeKitchenSidePanels,
} from './kitchen-side-panels-contract.js?v=20261031-side3d';
import { evaluateKitchenModuleSidePanelClearanceLive } from './kitchen-side-panels-scene-adapter.js?v=20261031-trimfix2';
import {
  isKitchenNmCarcassGroup,
  rebuildForCellWidthMm,
} from './kitchen-base-engine.js?v=20261031-side3zh';
import {
  SIDE_PANEL_OVERLAY_ID_LEFT,
  SIDE_PANEL_OVERLAY_ID_RIGHT,
  SIDE_PANEL_OVERLAY_NAME_LEFT,
  SIDE_PANEL_OVERLAY_NAME_RIGHT,
  applyKitchenSidePanelOverlayToClodisRoots,
} from './kitchen-side-panels-overlay-geometry.js?v=20261031-side3zh';

function _findSection(group) {
  const sid = group?.userData?.sectionId;
  if (sid == null || !Array.isArray(state.customSections)) return null;
  return state.customSections.find((s) => s && String(s.id) === String(sid)) || null;
}

function _currentWidthMm(group) {
  const ud = group?.userData || {};
  const w =
    Number(ud.customWidthMm) ||
    Number(ud.__kitchenCellWidthMm) ||
    Number(ud.__targetSectionSizeMm?.x) ||
    Number(ud.__initialSectionSizeMm?.x) ||
    0;
  return Math.round(w);
}

function _countOverlayMeshes(group) {
  let n = 0;
  group?.traverse?.((o) => {
    const name = String(o.name || '');
    if (name === SIDE_PANEL_OVERLAY_NAME_LEFT || name === SIDE_PANEL_OVERLAY_NAME_RIGHT) n += 1;
    if (o.userData?.cldSidePanelOverlay) n += 1;
  });
  return n;
}

function _hasOverlayMeshOnSide(group, side) {
  const wantName = side === 'right' ? SIDE_PANEL_OVERLAY_NAME_RIGHT : SIDE_PANEL_OVERLAY_NAME_LEFT;
  const wantId = side === 'right' ? SIDE_PANEL_OVERLAY_ID_RIGHT : SIDE_PANEL_OVERLAY_ID_LEFT;
  let found = false;
  group?.traverse?.((o) => {
    if (found) return;
    const name = String(o.name || '');
    if (name === wantName || name === `${wantName}_core`) found = true;
    if (o.userData?.cldSidePanelOverlaySide === side) found = true;
    if (String(o.userData?.clodisNodeId || o.userData?.id || '') === wantId) found = true;
  });
  return found;
}

function _rebuildSameWidth(group) {
  const section = _findSection(group);
  if (!section) {
    return { ok: false, reason: 'missing_section' };
  }
  const w = _currentWidthMm(group);
  if (!(w > 0)) {
    return { ok: false, reason: 'missing_width' };
  }
  const rebuilt = rebuildForCellWidthMm(group, section, w);
  return {
    ok: !!rebuilt?.ok,
    rebuild: rebuilt,
    cellWidthMm: w,
    section,
  };
}

function _humanDepthBlock(plan) {
  const reason = String(plan?.reason || '');
  if (reason === 'overlay_exceeds_worktop') {
    const max = plan.maxBackFromCarcassFrontMm;
    return max != null
      ? `Накладка не помещается под столешницу: глубина + смещение больше ${max} мм.`
      : 'Накладка не помещается под столешницу по глубине.';
  }
  if (reason === 'worktop_not_found' || reason === 'worktop_z_layout_unsupported') {
    return 'Нельзя проверить накрытие столешницей — геометрия столешки не в ожидаемом виде.';
  }
  if (reason === 'carcass_depth_unknown_for_offset') {
    return 'Неизвестна глубина корпуса — смещение накладки недоступно.';
  }
  return plan?.message || `Накладка не применена (${reason || 'depth_blocked'}).`;
}

function _precheckOverlayDepth(group, sidePanelsFull) {
  const ud = group?.userData || {};
  const rootsRaw = readUserDataClodisRoots(ud);
  if (!rootsRaw) {
    return { ok: false, reason: 'no_clodis_roots', message: 'Нет дерева модуля для проверки накладки.' };
  }
  let roots;
  try {
    roots = JSON.parse(JSON.stringify(Array.isArray(rootsRaw) ? rootsRaw : [rootsRaw]));
  } catch (_) {
    return { ok: false, reason: 'clone_failed', message: 'Не удалось проверить геометрию накладки.' };
  }
  const carcassDepthMm =
    Math.round(Number(ud.__kitchenCarcassDepthMm) || Number(ud.customDepthMm) || 0) || null;
  const res = applyKitchenSidePanelOverlayToClodisRoots(roots, {
    sidePanels: sidePanelsFull,
    carcassDepthMm,
  });
  for (const side of ['left', 'right']) {
    if (String(sidePanelsFull?.[side]?.mode || '').toLowerCase() !== 'overlay') continue;
    const plan = res.sides?.[side];
    if (plan && plan.ok === false) {
      return {
        ok: false,
        reason: plan.reason || res.reason || 'depth_blocked',
        message: _humanDepthBlock(plan),
        plan,
        applyResult: res,
      };
    }
  }
  return { ok: true, applyResult: res };
}

/**
 * Enable/disable 16 mm overlay on one side of a lower kitchen base (NM).
 * @param {object} group
 * @param {'left'|'right'} side
 * @param {boolean} enabled
 */
export function setKitchenModuleSidePanelOverlayLive(group, side, enabled) {
  return applyKitchenModuleSidePanelSideLive(group, side, {
    mode: enabled ? 'overlay' : 'standard',
  });
}

/**
 * Patch one side of sidePanels and rebuild the same cell width (no neighbor / D change).
 * Keeps depth* fields when switching to standard (only mode changes).
 * @param {object} group
 * @param {'left'|'right'} side
 * @param {object} [patch]
 */
export function applyKitchenModuleSidePanelSideLive(group, side, patch = {}) {
  const s = String(side || '')
    .trim()
    .toLowerCase();
  if (s !== 'left' && s !== 'right') {
    return { ok: false, reason: 'invalid_side' };
  }
  if (!isKitchenNmCarcassGroup(group)) {
    return { ok: false, reason: 'not_kitchen_nm' };
  }
  const ud = group.userData || (group.userData = {});
  ensureKitchenSidePanelsOnUserData(ud);
  const prevFull = JSON.parse(JSON.stringify(ud.sidePanels));
  const prevSide = prevFull[s] || { mode: 'standard' };
  const nextSide = normalizeKitchenSidePanelSide({
    ...prevSide,
    ...(patch && typeof patch === 'object' ? patch : {}),
  });

  if (nextSide.mode === 'overlay' && String(prevSide.mode || '') !== 'overlay') {
    const clearance = evaluateKitchenModuleSidePanelClearanceLive(group, s);
    if (clearance.status !== 'clear') {
      return {
        ok: false,
        reason: 'clearance_not_clear',
        clearance,
        message:
          clearance.status === 'blocked'
            ? 'Нет места для накладки: торец занят соседом или препятствием.'
            : clearance.message ||
              'Не удалось подтвердить свободное место — накладка не включена.',
      };
    }
  }

  const tentative = normalizeKitchenSidePanels({
    ...ud.sidePanels,
    [s]: nextSide,
  });
  if (nextSide.mode === 'overlay') {
    const gate = _precheckOverlayDepth(group, tentative);
    if (!gate.ok) {
      return {
        ok: false,
        reason: gate.reason,
        message: gate.message,
        plan: gate.plan || null,
      };
    }
  }

  ud.sidePanels = tentative;
  const rebuilt = _rebuildSameWidth(group);
  if (!rebuilt.ok) {
    ud.sidePanels = prevFull;
    _rebuildSameWidth(group);
    return {
      ok: false,
      reason: rebuilt.reason || 'rebuild_failed',
      message: 'Не удалось перестроить модуль.',
      sidePanels: JSON.parse(JSON.stringify(ud.sidePanels)),
    };
  }

  if (nextSide.mode === 'overlay' && !_hasOverlayMeshOnSide(group, s)) {
    ud.sidePanels = prevFull;
    _rebuildSameWidth(group);
    return {
      ok: false,
      reason: 'overlay_not_built',
      message: 'Накладка не появилась после перестроения — настройки возвращены.',
      sidePanels: JSON.parse(JSON.stringify(ud.sidePanels)),
    };
  }

  return {
    ok: true,
    side: s,
    sidePanels: JSON.parse(JSON.stringify(ud.sidePanels)),
    overlayMeshCount: _countOverlayMeshes(group),
    cellWidthMm: rebuilt.cellWidthMm,
    customWidthMm: ud.customWidthMm,
    rebuild: rebuilt.rebuild,
  };
}

/** Reset both sides to standard and rebuild. */
export function clearKitchenModuleSidePanelOverlaysLive(group) {
  if (!isKitchenNmCarcassGroup(group)) {
    return { ok: false, reason: 'not_kitchen_nm' };
  }
  const ud = group.userData || (group.userData = {});
  applyKitchenSidePanelsToUserData(ud, createDefaultKitchenSidePanels());
  const rebuilt = _rebuildSameWidth(group);
  return {
    ok: !!rebuilt.ok,
    rebuild: rebuilt.rebuild,
    overlayMeshCount: _countOverlayMeshes(group),
    sidePanels: JSON.parse(JSON.stringify(ud.sidePanels)),
    reason: rebuilt.ok ? undefined : rebuilt.reason,
  };
}

if (typeof window !== 'undefined') {
  window.__cldSetKitchenSidePanelOverlay = setKitchenModuleSidePanelOverlayLive;
  window.__cldApplyKitchenSidePanelSide = applyKitchenModuleSidePanelSideLive;
  window.__cldClearKitchenSidePanelOverlays = clearKitchenModuleSidePanelOverlaysLive;
}
