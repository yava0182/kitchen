/**
 * STEP 3A — temporary test API (no UI).
 * Sets instance sidePanels.overlay / standard, runs live clearance, rebuilds one NM.
 */

import { state } from '../utils/state.js';
import {
  ensureKitchenSidePanelsOnUserData,
  applyKitchenSidePanelsToUserData,
  createDefaultKitchenSidePanels,
} from './kitchen-side-panels-contract.js?v=20261031-side2a';
import { evaluateKitchenModuleSidePanelClearanceLive } from './kitchen-side-panels-scene-adapter.js?v=20261031-trimfix2';
import {
  isKitchenNmCarcassGroup,
  rebuildForCellWidthMm,
} from './kitchen-base-engine.js?v=20261031-side3a';
import {
  SIDE_PANEL_OVERLAY_NAME_LEFT,
  SIDE_PANEL_OVERLAY_NAME_RIGHT,
} from './kitchen-side-panels-overlay-geometry.js?v=20261031-side3a';

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

/**
 * Enable/disable 16 mm overlay on one side of a lower kitchen base (NM).
 * @param {object} group
 * @param {'left'|'right'} side
 * @param {boolean} enabled
 */
export function setKitchenModuleSidePanelOverlayLive(group, side, enabled) {
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

  if (enabled) {
    const clearance = evaluateKitchenModuleSidePanelClearanceLive(group, s);
    if (clearance.status !== 'clear') {
      return {
        ok: false,
        reason: 'clearance_not_clear',
        clearance,
        message: 'Накладка не создаётся при blocked/unknown.',
      };
    }
    ud.sidePanels[s] = {
      ...(ud.sidePanels[s] && typeof ud.sidePanels[s] === 'object' ? ud.sidePanels[s] : {}),
      mode: 'overlay',
    };
  } else {
    ud.sidePanels[s] = {
      ...(ud.sidePanels[s] && typeof ud.sidePanels[s] === 'object' ? ud.sidePanels[s] : {}),
      mode: 'standard',
    };
  }

  const section = _findSection(group);
  if (!section) {
    return { ok: false, reason: 'missing_section', sidePanels: ud.sidePanels };
  }
  const w = _currentWidthMm(group);
  if (!(w > 0)) {
    return { ok: false, reason: 'missing_width', sidePanels: ud.sidePanels };
  }

  const rebuilt = rebuildForCellWidthMm(group, section, w);
  const overlays = _countOverlayMeshes(group);
  return {
    ok: !!rebuilt?.ok,
    rebuild: rebuilt,
    side: s,
    enabled: !!enabled,
    sidePanels: JSON.parse(JSON.stringify(ud.sidePanels)),
    overlayMeshCount: overlays,
    cellWidthMm: w,
    customWidthMm: ud.customWidthMm,
  };
}

/** Reset both sides to standard and rebuild. */
export function clearKitchenModuleSidePanelOverlaysLive(group) {
  if (!isKitchenNmCarcassGroup(group)) {
    return { ok: false, reason: 'not_kitchen_nm' };
  }
  const ud = group.userData || (group.userData = {});
  applyKitchenSidePanelsToUserData(ud, createDefaultKitchenSidePanels());
  const section = _findSection(group);
  const w = _currentWidthMm(group);
  if (!section || !(w > 0)) {
    return { ok: false, reason: 'missing_section_or_width' };
  }
  const rebuilt = rebuildForCellWidthMm(group, section, w);
  return {
    ok: !!rebuilt?.ok,
    rebuild: rebuilt,
    overlayMeshCount: _countOverlayMeshes(group),
    sidePanels: JSON.parse(JSON.stringify(ud.sidePanels)),
  };
}

if (typeof window !== 'undefined') {
  window.__cldSetKitchenSidePanelOverlay = setKitchenModuleSidePanelOverlayLive;
  window.__cldClearKitchenSidePanelOverlays = clearKitchenModuleSidePanelOverlaysLive;
}
