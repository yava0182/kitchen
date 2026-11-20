/**
 * Live API for kitchen side-panels (overlay / replacement / filler).
 * Filler — только НМ.
 * 5A/5B footprint/balancer-reserve откатан; режимы 4B сохранены.
 */

import { state } from '../utils/state.js';
import { readUserDataClodisRoots } from '../clodis-json-fields.js';
import {
  ensureKitchenSidePanelsOnUserData,
  applyKitchenSidePanelsToUserData,
  createDefaultKitchenSidePanels,
  normalizeKitchenSidePanelSide,
  normalizeKitchenSidePanels,
} from './kitchen-side-panels-contract.js?v=20261031-side4b';
import { evaluateKitchenModuleSidePanelClearanceLive } from './kitchen-side-panels-scene-adapter.js?v=20261031-side4b';
import {
  isKitchenNmCarcassGroup,
  isKitchenSidePanelsModuleGroup,
  isKitchenTallGroup,
  isKitchenWallMidGroup,
  isKitchenWallTopGroup,
  rebuildForCellWidthMm,
} from './kitchen-base-engine.js?v=20261101-restore1';
import {
  SIDE_PANEL_OVERLAY_ID_LEFT,
  SIDE_PANEL_OVERLAY_ID_RIGHT,
  SIDE_PANEL_OVERLAY_NAME_LEFT,
  SIDE_PANEL_OVERLAY_NAME_RIGHT,
  SIDE_PANEL_FILLER_ID_LEFT,
  SIDE_PANEL_FILLER_ID_RIGHT,
  SIDE_PANEL_FILLER_NAME_LEFT,
  SIDE_PANEL_FILLER_NAME_RIGHT,
  applyKitchenSidePanelOverlayToClodisRoots,
  applyKitchenSidePanelFillerToClodisRoots,
} from './kitchen-side-panels-overlay-geometry.js?v=20261031-side4b';
import {
  applyKitchenSidePanelReplacementAppearance,
  findKitchenStockSideWallNodes,
  hydrateKitchenSidePanelCatalogModules,
} from './kitchen-side-panels-replacement.js?v=20261031-side4b';

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

function _skipWorktopCover(group) {
  return (
    isKitchenWallMidGroup(group) ||
    isKitchenWallTopGroup(group) ||
    isKitchenTallGroup(group)
  );
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

function _hasFillerMeshOnSide(group, side) {
  const wantName = side === 'right' ? SIDE_PANEL_FILLER_NAME_RIGHT : SIDE_PANEL_FILLER_NAME_LEFT;
  const wantId = side === 'right' ? SIDE_PANEL_FILLER_ID_RIGHT : SIDE_PANEL_FILLER_ID_LEFT;
  let found = false;
  group?.traverse?.((o) => {
    if (found) return;
    const name = String(o.name || '');
    if (name === wantName || name === `${wantName}_core`) found = true;
    if (o.userData?.cldSidePanelFillerSide === side) found = true;
    if (String(o.userData?.clodisNodeId || o.userData?.id || '') === wantId) found = true;
  });
  return found;
}

function _precheckFillerDepth(group, sidePanelsFull) {
  const ud = group?.userData || {};
  const rootsRaw = readUserDataClodisRoots(ud);
  if (!rootsRaw) {
    return { ok: false, reason: 'no_clodis_roots', message: 'Нет дерева модуля для проверки добора.' };
  }
  let roots;
  try {
    roots = JSON.parse(JSON.stringify(Array.isArray(rootsRaw) ? rootsRaw : [rootsRaw]));
  } catch (_) {
    return { ok: false, reason: 'clone_failed', message: 'Не удалось проверить геометрию добора.' };
  }
  const carcassDepthMm =
    Math.round(Number(ud.__kitchenCarcassDepthMm) || Number(ud.customDepthMm) || 0) || null;
  const res = applyKitchenSidePanelFillerToClodisRoots(roots, {
    sidePanels: sidePanelsFull,
    carcassDepthMm,
    skipWorktopCover: _skipWorktopCover(group),
  });
  for (const side of ['left', 'right']) {
    if (String(sidePanelsFull?.[side]?.mode || '').toLowerCase() !== 'filler') continue;
    const plan = res.sides?.[side];
    if (plan && plan.ok === false) {
      return {
        ok: false,
        reason: plan.reason || res.reason || 'filler_depth_blocked',
        message: _humanDepthBlock(plan),
        plan,
        applyResult: res,
      };
    }
  }
  return { ok: true, applyResult: res };
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
  if (reason === 'overlay_exceeds_carcass') {
    const max = plan.maxBackFromCarcassFrontMm;
    return max != null
      ? `Накладка не помещается по глубине корпуса: глубина + смещение больше ${max} мм.`
      : 'Накладка выходит за глубину корпуса.';
  }
  if (reason === 'worktop_not_found' || reason === 'worktop_z_layout_unsupported') {
    return 'Нельзя проверить накрытие столешницей — геометрия столешки не в ожидаемом виде.';
  }
  if (reason === 'carcass_depth_unknown_for_offset') {
    return 'Неизвестна глубина корпуса — смещение накладки недоступно.';
  }
  if (reason === 'filler_width_required') {
    return 'Укажите ширину добора в мм.';
  }
  return plan?.message || `Боковина не применена (${reason || 'depth_blocked'}).`;
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
    skipWorktopCover: _skipWorktopCover(group),
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
 * Enable/disable 16 mm overlay on one side of a kitchen module (NM / НШ1 / НШ2).
 * @param {object} group
 * @param {'left'|'right'} side
 * @param {boolean} enabled
 */

/**
 * Enable/disable 16 mm overlay on one side of a kitchen module (NM / НШ1 / НШ2).
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
  if (!isKitchenSidePanelsModuleGroup(group)) {
    return { ok: false, reason: 'not_kitchen_side_panels_module' };
  }
  const ud = group.userData || (group.userData = {});
  ensureKitchenSidePanelsOnUserData(ud);
  const prevFull = JSON.parse(JSON.stringify(ud.sidePanels));
  const prevSide = prevFull[s] || { mode: 'standard' };
  const nextSide = normalizeKitchenSidePanelSide({
    ...prevSide,
    ...(patch && typeof patch === 'object' ? patch : {}),
  });

  if (nextSide.mode === 'filler') {
    if (!isKitchenNmCarcassGroup(group)) {
      return {
        ok: false,
        reason: 'filler_nm_only',
        message: 'Доборная планка пока только для нижнего шкафа.',
      };
    }
    const widthMm = Math.round(Number(nextSide.fillerWidthMm) || 0);
    if (!(widthMm > 0)) {
      return {
        ok: false,
        reason: 'filler_width_required',
        message: 'Укажите ширину добора в мм.',
      };
    }
    const clearance = evaluateKitchenModuleSidePanelClearanceLive(group, s, {
      requiredMm: widthMm,
    });
    if (clearance.status !== 'clear') {
      const avail =
        clearance.availableMm != null ? Math.round(Number(clearance.availableMm)) : null;
      return {
        ok: false,
        reason: 'clearance_not_clear',
        clearance,
        message:
          clearance.status === 'blocked'
            ? avail != null
              ? `Недостаточно места для добора ${widthMm} мм (доступно ${avail} мм).`
              : `Недостаточно места для добора ${widthMm} мм.`
            : clearance.message ||
              'Не удалось подтвердить свободное место — добор не установлен.',
      };
    }
  }

  const tentative = normalizeKitchenSidePanels({
    ...ud.sidePanels,
    [s]: nextSide,
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
  if (nextSide.mode === 'filler') {
    const gate = _precheckFillerDepth(group, tentative);
    if (!gate.ok) {
      return {
        ok: false,
        reason: gate.reason,
        message: gate.message,
        plan: gate.plan || null,
      };
    }
  }

  // STEP 4A: replacement — штатные бока должны быть в дереве (после hydrate).
  if (nextSide.mode === 'replacement') {
    const rootsRaw = readUserDataClodisRoots(ud);
    if (!rootsRaw) {
      return {
        ok: false,
        reason: 'no_clodis_roots',
        message: 'Нет дерева модуля для замены боковины.',
      };
    }
    let rootsCheck;
    try {
      rootsCheck = JSON.parse(JSON.stringify(Array.isArray(rootsRaw) ? rootsRaw : [rootsRaw]));
    } catch (_) {
      return {
        ok: false,
        reason: 'clone_failed',
        message: 'Не удалось проверить штатную боковину.',
      };
    }
    hydrateKitchenSidePanelCatalogModules(rootsCheck);
    const stock = findKitchenStockSideWallNodes(rootsCheck, s);
    if (!stock.length) {
      return {
        ok: false,
        reason: 'stock_side_not_found',
        message:
          'Штатная боковина в дереве не найдена — замена недоступна для этого модуля.',
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

  if (nextSide.mode === 'filler' && !_hasFillerMeshOnSide(group, s)) {
    ud.sidePanels = prevFull;
    _rebuildSameWidth(group);
    return {
      ok: false,
      reason: 'filler_not_built',
      message: 'Добор не появился после перестроения — настройки возвращены.',
      sidePanels: JSON.parse(JSON.stringify(ud.sidePanels)),
    };
  }

  let replacementAppearance = null;
  if (
    nextSide.mode === 'replacement' ||
    String(prevSide.mode || '') === 'replacement' ||
    String(ud.sidePanels?.left?.mode || '') === 'replacement' ||
    String(ud.sidePanels?.right?.mode || '') === 'replacement'
  ) {
    replacementAppearance = applyKitchenSidePanelReplacementAppearance(group, ud.sidePanels);
  }

  if (nextSide.mode === 'replacement') {
    const rootsAfter = readUserDataClodisRoots(ud);
    const stockAfter = findKitchenStockSideWallNodes(rootsAfter, s);
    const facadeOk = stockAfter.some((n) => {
      const g = String(n.spec?.material?.group || '').toLowerCase();
      return g === 'g3' || g === 'g2';
    });
    const meshOk =
      (s === 'left'
        ? replacementAppearance?.left?.meshes
        : replacementAppearance?.right?.meshes) > 0;
    if (!facadeOk && !meshOk) {
      ud.sidePanels = prevFull;
      _rebuildSameWidth(group);
      applyKitchenSidePanelReplacementAppearance(group, ud.sidePanels);
      return {
        ok: false,
        reason: 'replacement_not_applied',
        message: 'Замена боковины не применилась — настройки возвращены.',
        sidePanels: JSON.parse(JSON.stringify(ud.sidePanels)),
      };
    }
  }

  return {
    ok: true,
    side: s,
    sidePanels: JSON.parse(JSON.stringify(ud.sidePanels)),
    overlayMeshCount: _countOverlayMeshes(group),
    replacementAppearance,
    cellWidthMm: rebuilt.cellWidthMm,
    customWidthMm: ud.customWidthMm,
    kitchenCellWidthMm: ud.__kitchenCellWidthMm,
    rebuild: rebuilt.rebuild,
    skipWorktopCover: _skipWorktopCover(group),
    isNm: isKitchenNmCarcassGroup(group),
  };
}

/** Reset both sides to standard and rebuild. */
export function clearKitchenModuleSidePanelOverlaysLive(group) {
  if (!isKitchenSidePanelsModuleGroup(group)) {
    return { ok: false, reason: 'not_kitchen_side_panels_module' };
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
  window.__cldIsKitchenSidePanelsModuleGroup = isKitchenSidePanelsModuleGroup;
}