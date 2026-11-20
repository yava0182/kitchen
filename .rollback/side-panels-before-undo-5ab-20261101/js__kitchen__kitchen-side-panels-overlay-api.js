/**
 * STEP 3A/3E/3З/3И/4A/4B/5A — live API for kitchen side-panels
 * (overlay / replacement / filler). Filler — только НМ.
 * STEP 5A: пенал в прямой секции — габарит корпуса+накладки через
 * существующий setZoneCustomWidthMm / _balanceCustomZoneWidthsAfterEdit.
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
  kitchenTallOverlayPadMm,
  kitchenModuleOverlayPadMm,
  getKitchenBaseWidthLimitsMm,
  rebuildForCellWidthMm,
  syncKitchenWallMidInZoneToWidthMm,
  syncKitchenWallTopInZoneToWidthMm,
  findKitchenWallMidInSectionZone,
  findKitchenWallTopInSectionZone,
} from './kitchen-base-engine.js?v=20261101-side5b3';
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
import {
  isKitchenStraightBaseBandSection,
  resolveKitchenBandCustomZoneWidthsMmForEdit,
  writeKitchenBandZoneWidthsMm,
} from './kitchen-section-layout.js?v=20261031-zwsrc2';
import { KITCHEN_SIDE_PANEL_OVERLAY_THICKNESS_MM } from './kitchen-side-panels-clearance.js?v=20261031-side2v';

function _findSection(group) {
  const sid = group?.userData?.sectionId;
  if (sid == null || !Array.isArray(state.customSections)) return null;
  return state.customSections.find((s) => s && String(s.id) === String(sid)) || null;
}

function _overlayPadFromPanels(sidePanels) {
  if (!sidePanels || typeof sidePanels !== 'object') return 0;
  const t = KITCHEN_SIDE_PANEL_OVERLAY_THICKNESS_MM;
  let pad = 0;
  if (String(sidePanels.left?.mode || '').toLowerCase() === 'overlay') pad += t;
  if (String(sidePanels.right?.mode || '').toLowerCase() === 'overlay') pad += t;
  return pad;
}

/**
 * Ширина корпуса пенала (без накладок).
 * sidePanelsOpt — снимок, от которого считать pad (важно: до записи tentative).
 */
function _tallCarcassWidthMm(group, sidePanelsOpt) {
  const ud = group?.userData || {};
  const pad =
    sidePanelsOpt != null
      ? _overlayPadFromPanels(sidePanelsOpt)
      : kitchenTallOverlayPadMm(ud);
  const cell = Math.round(Number(ud.__kitchenCellWidthMm) || 0);
  const custom = Math.round(Number(ud.customWidthMm) || 0);
  if (pad > 0 && cell > pad) return cell - pad;
  if (custom > 0) return custom;
  if (cell > 0) return Math.max(50, cell - pad);
  const t =
    Math.round(Number(ud.__targetSectionSizeMm?.x) || 0) ||
    Math.round(Number(ud.__initialSectionSizeMm?.x) || 0);
  return t > 0 ? Math.max(50, t - pad) : 0;
}

function _currentWidthMm(group) {
  const ud = group?.userData || {};
  // 5A/5B: при overlay customWidthMm = корпус; rebuild ждёт ширину ячейки.
  const pad = kitchenModuleOverlayPadMm(ud);
  if (pad > 0) {
    const cell = Math.round(Number(ud.__kitchenCellWidthMm) || 0);
    if (cell > 0) return cell;
    const custom = Math.round(Number(ud.customWidthMm) || 0);
    if (custom > 0) return custom + pad;
  }
  const w =
    Number(ud.customWidthMm) ||
    Number(ud.__kitchenCellWidthMm) ||
    Number(ud.__targetSectionSizeMm?.x) ||
    Number(ud.__initialSectionSizeMm?.x) ||
    0;
  return Math.round(w);
}

/** 5B: НМ/НШ — накладка внутри ячейки (корпус жмётся), секцию не расширяем. */
function _nmOrWallWithinCellOverlayCase(group) {
  if (isKitchenTallGroup(group)) return false;
  return (
    isKitchenNmCarcassGroup(group) ||
    isKitchenWallMidGroup(group) ||
    isKitchenWallTopGroup(group)
  );
}

function _cellWidthForWithinCellOverlay(group) {
  const ud = group?.userData || {};
  const pad = kitchenModuleOverlayPadMm(ud);
  const cell = Math.round(Number(ud.__kitchenCellWidthMm) || 0);
  if (cell > 0) return cell;
  const custom = Math.round(Number(ud.customWidthMm) || 0);
  if (custom > 0) return pad > 0 ? custom + pad : custom;
  return _currentWidthMm(group);
}

/**
 * Проверка: ячейка вмещает корпус−pad (мин. ширина профиля).
 * @returns {{ ok: boolean, reason?: string, message?: string, carcassMm?: number, cellMm?: number }}
 */
function _validateWithinCellOverlayFit(group, nextSidePanels) {
  const cellMm = _cellWidthForWithinCellOverlay(group);
  const nextPad = _overlayPadFromPanels(nextSidePanels);
  if (!(nextPad > 0)) return { ok: true, cellMm, carcassMm: cellMm };
  const carcassMm = cellMm - nextPad;
  const lim = getKitchenBaseWidthLimitsMm(group);
  if (carcassMm < lim.minMm) {
    return {
      ok: false,
      reason: 'overlay_carcass_too_narrow',
      message: `Накладка не помещается в ячейку ${cellMm} мм: корпус стал бы ${carcassMm} мм (мин. ${lim.minMm} мм). Секцию не удлиняем.`,
      cellMm,
      carcassMm,
      minMm: lim.minMm,
      nextPad,
    };
  }
  return { ok: true, cellMm, carcassMm, nextPad };
}

/** Bbox мебельных мешей (без PivotMarker / debug), ось U секции. */
function _moduleFurnitureBoxU(group, uAxis) {
  if (!group || !window.THREE) return null;
  const THREE = window.THREE;
  const box = new THREE.Box3();
  let any = false;
  group.updateMatrixWorld(true);
  group.traverse((o) => {
    if (!o?.isMesh) return;
    const n = String(o.name || '');
    if (/^PivotMarker/i.test(n) || /helper|debug/i.test(n)) return;
    if (!o.geometry) return;
    try {
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const b = o.geometry.boundingBox;
      if (!b || b.isEmpty()) return;
      const w = b.clone().applyMatrix4(o.matrixWorld);
      if (!any) {
        box.copy(w);
        any = true;
      } else {
        box.union(w);
      }
    } catch (_) {}
  });
  if (!any || box.isEmpty()) return null;
  return {
    a0: uAxis === 'z' ? box.min.z : box.min.x,
    a1: uAxis === 'z' ? box.max.z : box.max.x,
  };
}

/**
 * Full bbox модуля не должен выходить за outer U секции (только если модуль в секции).
 * Within-cell (5B): если stamps ячейка=корпус+pad — габарит по длине = ячейка, bbox-хелперы не режем.
 */
function _moduleExceedsSectionU(group, section, opts = {}) {
  if (!group || !section || !state.scene || !window.THREE) return { ok: true };
  if (opts.withinCell && _overlayFootprintStampsOk(group).ok) {
    // Корпус+накладки+столешка сведены к ширине ячейки — за секцию по длине не выходят.
    return { ok: true, skipped: 'within_cell_stamps' };
  }
  let bounds;
  try {
    bounds =
      typeof window.__clodisComputeSectionInnerBoundsU === 'function'
        ? window.__clodisComputeSectionInnerBoundsU(section)
        : null;
  } catch (_) {
    bounds = null;
  }
  const u0 =
    Number(bounds?.outerMinU) ||
    Number(section.division?.sectionStart) ||
    null;
  const u1 =
    Number(bounds?.outerMaxU) ||
    Number(section.division?.sectionEnd) ||
    null;
  if (!(Number.isFinite(u0) && Number.isFinite(u1) && u1 > u0)) return { ok: true };
  const wallName = String(section.wallName || section.division?.wallName || 'back').toLowerCase();
  const uAxis = wallName === 'left' || wallName === 'right' ? 'z' : 'x';
  try {
    const span = _moduleFurnitureBoxU(group, uAxis);
    if (!span) return { ok: true };
    const { a0, a1 } = span;
    const eps = 1.25;
    // Stub / не посажен: bbox не пересекает секцию — не считаем выходом.
    if (!(a1 > u0 + eps && a0 < u1 - eps)) return { ok: true };
    if (a0 < u0 - eps || a1 > u1 + eps) {
      return {
        ok: false,
        reason: 'outside_section',
        message: 'Деталь выходит за границу секции по длине — изменение отменено.',
        u0,
        u1,
        a0,
        a1,
      };
    }
  } catch (_) {}
  return { ok: true };
}

/** 5B: после overlay stamps ячейка = корпус + pad (иначе столешка снова вылезет). */
function _overlayFootprintStampsOk(group) {
  const ud = group?.userData || {};
  const pad = kitchenModuleOverlayPadMm(ud);
  if (!(pad > 0)) return { ok: true };
  const cell = Math.round(Number(ud.__kitchenCellWidthMm) || 0);
  const carcass = Math.round(Number(ud.customWidthMm) || 0);
  if (!(cell > 0 && carcass > 0)) return { ok: true };
  if (Math.abs(cell - (carcass + pad)) > 1) {
    return {
      ok: false,
      reason: 'overlay_stamp_mismatch',
      message: `Сбой ширины: ячейка ${cell} ≠ корпус ${carcass} + накладки ${pad}.`,
      cell,
      carcass,
      pad,
    };
  }
  return { ok: true, cell, carcass, pad };
}

function _restoreSidePanelsAndWidth(group, prevFull, prevCell, prevCustom) {
  const ud = group?.userData || (group.userData = {});
  ud.sidePanels = prevFull;
  if (prevCell > 0) ud.__kitchenCellWidthMm = prevCell;
  if (prevCustom > 0) ud.customWidthMm = prevCustom;
  else if (prevCell > 0) ud.customWidthMm = prevCell;
  delete ud.__kitchenOverlayPadMm;
  if (isKitchenTallGroup(group) && kitchenModuleOverlayPadMm(ud) <= 0) {
    delete ud.__kitchenTallOverlayPadMm;
  }
  _rebuildSameWidth(group);
}

function _cloneWidths(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const out = Object.create(null);
  for (const [k, v] of Object.entries(obj)) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) out[k] = Math.round(n);
  }
  return out;
}

function _zoneWidthFromLayout(section, zi) {
  try {
    const layout =
      typeof window.__clodisComputeSectionLayout === 'function'
        ? window.__clodisComputeSectionLayout(section)
        : null;
    const w = Math.round(Number(layout?.moduleWidthsMm?.[zi]) || 0);
    if (w > 0) return w;
  } catch (_) {}
  const c = section?.division?.customZoneWidthsMm;
  const fromDiv = Math.round(Number(c?.[zi] ?? c?.[String(zi)]) || 0);
  if (fromDiv > 0) return fromDiv;
  try {
    const base = resolveKitchenBandCustomZoneWidthsMmForEdit(section, 'base');
    const fromBase = Math.round(Number(base?.[zi] ?? base?.[String(zi)]) || 0);
    if (fromBase > 0) return fromBase;
  } catch (_) {}
  return 0;
}

function _snapshotBandWidths(section) {
  const snap = {
    division: _cloneWidths(section?.division?.customZoneWidthsMm),
    divisionSource: section?.division?.customZoneWidthsSource || null,
    base: null,
    mid: null,
    top: null,
    baseSource: null,
    midSource: null,
    topSource: null,
  };
  try {
    snap.base = _cloneWidths(resolveKitchenBandCustomZoneWidthsMmForEdit(section, 'base'));
    snap.mid = _cloneWidths(resolveKitchenBandCustomZoneWidthsMmForEdit(section, 'mid'));
    snap.top = _cloneWidths(resolveKitchenBandCustomZoneWidthsMmForEdit(section, 'top'));
    snap.baseSource = section?.kitchenBandGrids?.base?.customZoneWidthsSource || null;
    snap.midSource = section?.kitchenBandGrids?.mid?.customZoneWidthsSource || null;
    snap.topSource = section?.kitchenBandGrids?.top?.customZoneWidthsSource || null;
  } catch (_) {}
  return snap;
}

function _restoreBandWidths(section, snap) {
  if (!section || !snap) return;
  try {
    if (snap.division) {
      section.division.customZoneWidthsMm = { ...snap.division };
    } else if (section.division) {
      delete section.division.customZoneWidthsMm;
    }
    if (snap.divisionSource) {
      section.division.customZoneWidthsSource = snap.divisionSource;
    }
    if (snap.base) writeKitchenBandZoneWidthsMm(section, 'base', snap.base);
    if (snap.mid) writeKitchenBandZoneWidthsMm(section, 'mid', snap.mid);
    if (snap.top) writeKitchenBandZoneWidthsMm(section, 'top', snap.top);
    if (section.kitchenBandGrids?.base && snap.baseSource) {
      section.kitchenBandGrids.base.customZoneWidthsSource = snap.baseSource;
    }
    if (section.kitchenBandGrids?.mid && snap.midSource) {
      section.kitchenBandGrids.mid.customZoneWidthsSource = snap.midSource;
    }
    if (section.kitchenBandGrids?.top && snap.topSource) {
      section.kitchenBandGrids.top.customZoneWidthsSource = snap.topSource;
    }
  } catch (e) {
    console.warn('[SIDE-PANEL 5A] restore band widths failed', e);
  }
  try {
    if (typeof window.__clodisSetZoneCustomWidthMm === 'function') {
      // Trigger layout+sync from restored base widths without changing edited cell:
      // re-apply current tall zone width from snap.
    }
  } catch (_) {}
  try {
    if (typeof window.__clodisUpdateFurnitureInSection === 'function') {
      window.__clodisUpdateFurnitureInSection(section);
    }
  } catch (_) {}
}

function _setZoneWidthViaExistingBalancer(sectionId, zi, widthMm) {
  const fn =
    typeof window !== 'undefined' ? window.__clodisSetZoneCustomWidthMm : null;
  if (typeof fn !== 'function') {
    return { ok: false, reason: 'no_set_zone_api' };
  }
  fn(sectionId, zi, widthMm);
  return { ok: true };
}

function _syncMidTopToBaseZones(section, changedZis, baseWidths) {
  if (!section || !changedZis?.length || !baseWidths) return;
  for (const band of ['mid', 'top']) {
    try {
      const prev = resolveKitchenBandCustomZoneWidthsMmForEdit(section, band) || {};
      const next = { ...prev };
      let touched = false;
      for (const z of changedZis) {
        const w = Math.round(Number(baseWidths[z] ?? baseWidths[String(z)]) || 0);
        if (!(w > 0)) continue;
        next[z] = w;
        next[String(z)] = w;
        touched = true;
      }
      if (!touched) continue;
      writeKitchenBandZoneWidthsMm(section, band, next);
      for (const z of changedZis) {
        const w = Math.round(Number(next[z] ?? next[String(z)]) || 0);
        if (!(w > 0)) continue;
        if (band === 'mid' && findKitchenWallMidInSectionZone(section, z)) {
          syncKitchenWallMidInZoneToWidthMm(section, z, w);
        }
        if (band === 'top' && findKitchenWallTopInSectionZone(section, z)) {
          syncKitchenWallTopInZoneToWidthMm(section, z, w);
        }
      }
    } catch (e) {
      console.warn('[SIDE-PANEL 5A] mid/top sync', band, e);
    }
  }
}

/** Реальные пересечения по U после перераспределения (full bbox). */
function _tallFootprintHasUOverlap(group, section) {
  if (!group || !section || !state.scene || !window.THREE) return { ok: true };
  const THREE = window.THREE;
  const wallName = String(section.wallName || section.division?.wallName || 'back').toLowerCase();
  const uAxis = wallName === 'left' || wallName === 'right' ? 'z' : 'x';
  group.updateMatrixWorld(true);
  const tallBox = new THREE.Box3().setFromObject(group);
  if (tallBox.isEmpty()) return { ok: true };
  const t0 = uAxis === 'z' ? tallBox.min.z : tallBox.min.x;
  const t1 = uAxis === 'z' ? tallBox.max.z : tallBox.max.x;
  const sid = String(section.id);
  let hit = null;
  state.scene.traverse((obj) => {
    if (hit) return;
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (obj === group) return;
    if (String(obj.userData.sectionId) !== sid) return;
    if (obj.userData.isEndCabinet || obj.userData.isEndCabinetSlot) return;
    if (obj.userData.isGhost || obj.userData.isGhostClodisPrebuild) return;
    try {
      obj.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(obj);
      if (b.isEmpty()) return;
      const a0 = uAxis === 'z' ? b.min.z : b.min.x;
      const a1 = uAxis === 'z' ? b.max.z : b.max.x;
      if (t0 < a1 - 0.75 && a0 < t1 - 0.75) {
        hit = { uuid: obj.uuid, catalog: obj.userData.catalogName || '' };
      }
    } catch (_) {}
  });
  return hit ? { ok: false, blocker: hit } : { ok: true };
}

/**
 * STEP 5A: выделить/вернуть мм под overlay пенала существующим balancer'ом.
 * @returns {{ ok: boolean, reason?: string, message?: string, targetZoneMm?: number, changedZis?: number[] }}
 */
function _reserveTallOverlayFootprint(group, section, nextSidePanels, prevSidePanels) {
  if (!isKitchenTallGroup(group)) {
    return { ok: true, skipped: true, reason: 'not_tall' };
  }
  if (!section || !isKitchenStraightBaseBandSection(section)) {
    return {
      ok: false,
      reason: 'not_straight_section',
      message: 'Учёт накладок в ячейках — только прямая секция.',
    };
  }
  const zi = Math.floor(Number(group.userData?.zoneIndex));
  if (!Number.isFinite(zi) || zi < 0) {
    return { ok: false, reason: 'bad_zone', message: 'Не задана ячейка пенала.' };
  }
  // Корпус только от prevSidePanels — иначе после записи tentative pad уже в ud и
  // carcassW ложно становится (cell−nextPad), target схлопывается в старую ячейку.
  const carcassW = _tallCarcassWidthMm(group, prevSidePanels);
  if (!(carcassW > 0)) {
    return { ok: false, reason: 'bad_carcass_width', message: 'Неизвестна ширина корпуса пенала.' };
  }
  const nextPad = _overlayPadFromPanels(nextSidePanels);
  const targetZoneMm = carcassW + nextPad;
  const prevZoneMm =
    _zoneWidthFromLayout(section, zi) || carcassW + _overlayPadFromPanels(prevSidePanels);
  if (Math.abs(targetZoneMm - prevZoneMm) < 1) {
    return { ok: true, skipped: true, targetZoneMm, changedZis: [] };
  }

  const widthsSnap = _snapshotBandWidths(section);
  const prevBase = widthsSnap.base || widthsSnap.division || {};
  // Равные ячейки без custom: prevBase пуст — сравниваем с layout до setZone.
  const prevLayoutWidths = (() => {
    try {
      const lc = section._layoutCache?.moduleWidthsMm;
      if (Array.isArray(lc) && lc.length) return lc.map((w) => Math.round(Number(w) || 0));
    } catch (_) {}
    return null;
  })();

  const setRes = _setZoneWidthViaExistingBalancer(section.id, zi, targetZoneMm);
  if (!setRes.ok) {
    return {
      ok: false,
      reason: setRes.reason || 'balancer_unavailable',
      message: 'Нет API перераспределения ячеек.',
    };
  }

  const got = _zoneWidthFromLayout(section, zi);
  if (!(got > 0) || Math.abs(got - targetZoneMm) > 1.5) {
    _restoreBandWidths(section, widthsSnap);
    try {
      if (typeof window.__clodisSetZoneCustomWidthMm === 'function' && prevZoneMm > 0) {
        window.__clodisSetZoneCustomWidthMm(section.id, zi, prevZoneMm);
      }
    } catch (_) {}
    return {
      ok: false,
      reason: 'redistribute_failed',
      message:
        got > 0
          ? `Не удалось выделить ${targetZoneMm} мм под пенал с накладкой (получилось ${got} мм). Соседи не могут отдать миллиметры.`
          : 'Не удалось перераспределить ячейки под накладку.',
      targetZoneMm,
      gotMm: got,
    };
  }

  const newBase =
    _cloneWidths(resolveKitchenBandCustomZoneWidthsMmForEdit(section, 'base')) ||
    _cloneWidths(section.division?.customZoneWidthsMm) ||
    {};
  const changedZis = [];
  const parts = Math.max(
    1,
    Math.floor(Number(section.division?.parts) || Object.keys(newBase).length || 0)
  );
  for (let z = 0; z < parts; z++) {
    const aCustom = Math.round(Number(prevBase[z] ?? prevBase[String(z)]) || 0);
    const aLayout = prevLayoutWidths ? Math.round(Number(prevLayoutWidths[z]) || 0) : 0;
    const a = aCustom > 0 ? aCustom : aLayout;
    const b = Math.round(Number(newBase[z] ?? newBase[String(z)]) || 0);
    if (a > 0 && b > 0 && Math.abs(a - b) >= 1) changedZis.push(z);
    else if (z === zi && Math.abs(b - targetZoneMm) <= 1.5) changedZis.push(z);
  }
  _syncMidTopToBaseZones(section, changedZis, newBase);

  return {
    ok: true,
    targetZoneMm,
    gotMm: got,
    changedZis,
    widthsSnap,
    carcassW,
    nextPad,
  };
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
  const prevCell = Math.round(Number(ud.__kitchenCellWidthMm) || 0);
  const prevCustom = Math.round(Number(ud.customWidthMm) || 0);
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

  const section = _findSection(group);
  const tallStraightOverlayCase =
    isKitchenTallGroup(group) &&
    section &&
    isKitchenStraightBaseBandSection(section) &&
    (nextSide.mode === 'overlay' || String(prevSide.mode || '') === 'overlay');
  const withinCellOverlayCase =
    _nmOrWallWithinCellOverlayCase(group) &&
    (nextSide.mode === 'overlay' || String(prevSide.mode || '') === 'overlay');

  // 5B НМ/НШ: накладка внутри ячейки (корпус = ячейка−pad) — не требовать зазор
  // снаружи ячейки; проверяем, что корпус не станет уже минимума.
  if (
    nextSide.mode === 'overlay' &&
    String(prevSide.mode || '') !== 'overlay' &&
    withinCellOverlayCase
  ) {
    const fit = _validateWithinCellOverlayFit(group, tentative);
    if (!fit.ok) {
      return {
        ok: false,
        reason: fit.reason || 'overlay_carcass_too_narrow',
        message: fit.message,
        fit,
      };
    }
  } else if (
    nextSide.mode === 'overlay' &&
    String(prevSide.mode || '') !== 'overlay' &&
    !tallStraightOverlayCase
  ) {
    // Прочие (не 5A/5B within-cell): прежняя clearance до включения.
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

  let footprintRes = null;
  if (tallStraightOverlayCase) {
    // sidePanels до setZone: syncTall видит pad и не раздувает корпус.
    ud.sidePanels = tentative;
    footprintRes = _reserveTallOverlayFootprint(group, section, tentative, prevFull);
    if (!footprintRes.ok) {
      _restoreSidePanelsAndWidth(group, prevFull, prevCell, prevCustom);
      return {
        ok: false,
        reason: footprintRes.reason || 'redistribute_failed',
        message: footprintRes.message || 'Не удалось перераспределить ячейки под накладку.',
        sidePanels: JSON.parse(JSON.stringify(ud.sidePanels)),
        footprint: footprintRes,
      };
    }
  } else {
    ud.sidePanels = tentative;
  }

  const rebuilt = _rebuildSameWidth(group);
  if (!rebuilt.ok) {
    if (footprintRes?.widthsSnap) {
      _restoreBandWidths(section, footprintRes.widthsSnap);
      try {
        const prevZone =
          _tallCarcassWidthMm({ userData: { ...ud, sidePanels: prevFull } }, prevFull) +
          _overlayPadFromPanels(prevFull);
        if (typeof window.__clodisSetZoneCustomWidthMm === 'function' && prevZone > 0) {
          window.__clodisSetZoneCustomWidthMm(section.id, Math.floor(Number(ud.zoneIndex)), prevZone);
        }
      } catch (_) {}
    }
    _restoreSidePanelsAndWidth(group, prevFull, prevCell, prevCustom);
    return {
      ok: false,
      reason: rebuilt.reason || 'rebuild_failed',
      message: 'Не удалось перестроить модуль.',
      sidePanels: JSON.parse(JSON.stringify(ud.sidePanels)),
    };
  }

  if (nextSide.mode === 'overlay' && !_hasOverlayMeshOnSide(group, s)) {
    if (footprintRes?.widthsSnap) {
      _restoreBandWidths(section, footprintRes.widthsSnap);
      try {
        const prevZone =
          _tallCarcassWidthMm({ userData: { ...ud, sidePanels: prevFull } }, prevFull) +
          _overlayPadFromPanels(prevFull);
        if (typeof window.__clodisSetZoneCustomWidthMm === 'function' && prevZone > 0) {
          window.__clodisSetZoneCustomWidthMm(section.id, Math.floor(Number(ud.zoneIndex)), prevZone);
        }
      } catch (_) {}
    }
    _restoreSidePanelsAndWidth(group, prevFull, prevCell, prevCustom);
    return {
      ok: false,
      reason: 'overlay_not_built',
      message: 'Накладка не появилась после перестроения — настройки возвращены.',
      sidePanels: JSON.parse(JSON.stringify(ud.sidePanels)),
    };
  }

  if (nextSide.mode === 'filler' && !_hasFillerMeshOnSide(group, s)) {
    _restoreSidePanelsAndWidth(group, prevFull, prevCell, prevCustom);
    return {
      ok: false,
      reason: 'filler_not_built',
      message: 'Добор не появился после перестроения — настройки возвращены.',
      sidePanels: JSON.parse(JSON.stringify(ud.sidePanels)),
    };
  }

  if (withinCellOverlayCase || tallStraightOverlayCase) {
    const stamps = _overlayFootprintStampsOk(group);
    if (!stamps.ok) {
      if (footprintRes?.widthsSnap) _restoreBandWidths(section, footprintRes.widthsSnap);
      _restoreSidePanelsAndWidth(group, prevFull, prevCell, prevCustom);
      return {
        ok: false,
        reason: stamps.reason,
        message: stamps.message,
        sidePanels: JSON.parse(JSON.stringify(ud.sidePanels)),
        stamps,
      };
    }
  }

  if (tallStraightOverlayCase && nextSide.mode === 'overlay') {
    const overlap = _tallFootprintHasUOverlap(group, section);
    if (!overlap.ok) {
      if (footprintRes?.widthsSnap) {
        _restoreBandWidths(section, footprintRes.widthsSnap);
        try {
          const prevZone =
            _tallCarcassWidthMm({ userData: { ...ud, sidePanels: prevFull } }, prevFull) +
            _overlayPadFromPanels(prevFull);
          if (typeof window.__clodisSetZoneCustomWidthMm === 'function' && prevZone > 0) {
            window.__clodisSetZoneCustomWidthMm(
              section.id,
              Math.floor(Number(ud.zoneIndex)),
              prevZone
            );
          }
        } catch (_) {}
      }
      _restoreSidePanelsAndWidth(group, prevFull, prevCell, prevCustom);
      return {
        ok: false,
        reason: 'overlap_after_redistribute',
        message: 'После перераспределения осталось пересечение модулей — накладка не применена.',
        sidePanels: JSON.parse(JSON.stringify(ud.sidePanels)),
        overlap,
      };
    }
  }

  // 5B: посаженный модуль не должен выходить за U секции (корпус+накладки+столешка).
  if (
    section &&
    (withinCellOverlayCase || tallStraightOverlayCase) &&
    (nextSide.mode === 'overlay' || String(prevSide.mode || '') === 'overlay')
  ) {
    const bounds = _moduleExceedsSectionU(group, section, {
      withinCell: !!withinCellOverlayCase,
    });
    if (!bounds.ok) {
      if (footprintRes?.widthsSnap) _restoreBandWidths(section, footprintRes.widthsSnap);
      _restoreSidePanelsAndWidth(group, prevFull, prevCell, prevCustom);
      return {
        ok: false,
        reason: bounds.reason || 'outside_section',
        message: bounds.message || 'Выход за границу секции — изменение отменено.',
        sidePanels: JSON.parse(JSON.stringify(ud.sidePanels)),
        bounds,
      };
    }
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
    tallCarcassWidthMm: isKitchenTallGroup(group) ? _tallCarcassWidthMm(group) : null,
    tallOverlayPadMm: isKitchenTallGroup(group) ? kitchenTallOverlayPadMm(ud) : 0,
    footprint: footprintRes
      ? {
          targetZoneMm: footprintRes.targetZoneMm,
          gotMm: footprintRes.gotMm,
          changedZis: footprintRes.changedZis,
          carcassW: footprintRes.carcassW,
          nextPad: footprintRes.nextPad,
        }
      : null,
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
  const prevFull = JSON.parse(JSON.stringify(ud.sidePanels || createDefaultKitchenSidePanels()));
  const section = _findSection(group);
  const tallStraight =
    isKitchenTallGroup(group) && section && isKitchenStraightBaseBandSection(section);
  const defaults = createDefaultKitchenSidePanels();
  if (tallStraight) {
    ud.sidePanels = normalizeKitchenSidePanels(defaults);
    const foot = _reserveTallOverlayFootprint(group, section, defaults, prevFull);
    if (!foot.ok) {
      ud.sidePanels = prevFull;
      _rebuildSameWidth(group);
      return {
        ok: false,
        reason: foot.reason || 'redistribute_failed',
        message: foot.message || 'Не удалось вернуть мм после снятия накладок.',
        sidePanels: JSON.parse(JSON.stringify(ud.sidePanels)),
      };
    }
  } else {
    applyKitchenSidePanelsToUserData(ud, defaults);
  }
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
