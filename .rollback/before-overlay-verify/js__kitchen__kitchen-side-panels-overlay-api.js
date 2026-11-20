/**
 * STEP 3A/3E/3З/3И/4A/4B/6A/column — live API for kitchen side-panels
 * (overlay / replacement / filler). Filler — только НМ.
 * 6A: пенал + nearest neighbor. Column: MID/TOP в той же zi —
 * накладка на уже оплаченную сторону без повторной компенсации (корпус = ячейка − pad).
 */

import { state } from '../utils/state.js';
import { readUserDataClodisRoots } from '../clodis-json-fields.js';
import {
  ensureKitchenSidePanelsOnUserData,
  applyKitchenSidePanelsToUserData,
  createDefaultKitchenSidePanels,
  normalizeKitchenSidePanelSide,
  normalizeKitchenSidePanels,
} from './kitchen-side-panels-contract.js?v=20261117-from179';
import { evaluateKitchenModuleSidePanelClearanceLive } from './kitchen-side-panels-scene-adapter.js?v=20261117-from179';
import {
  isKitchenNmCarcassGroup,
  isKitchenSidePanelsModuleGroup,
  isKitchenTallGroup,
  isKitchenWallMidGroup,
  isKitchenWallTopGroup,
  kitchenTallOverlayPadMm,
  getKitchenColumnOverlayPadSidesMm,
  rebuildForCellWidthMm,
  syncKitchenWallMidInZoneToWidthMm,
  syncKitchenWallTopInZoneToWidthMm,
  syncKitchenBaseInZoneToWidthMm,
  syncKitchenTallInZoneToWidthMm,
  findKitchenWallMidInSectionZone,
  findKitchenWallTopInSectionZone,
  findKitchenTallInSectionZone,
  findKitchenBaseInSectionZone,
  validateKitchenBaseCellWidthMm,
} from './kitchen-base-engine.js?v=20261117-from179';
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
} from './kitchen-side-panels-overlay-geometry.js?v=20261117-overlayFix1';
import {
  applyKitchenSidePanelReplacementAppearance,
  findKitchenStockSideWallNodes,
  hydrateKitchenSidePanelCatalogModules,
} from './kitchen-side-panels-replacement.js?v=20261117-from179';
import {
  isKitchenSidePanelFootprintSection,
  resolveKitchenBandCustomZoneWidthsMmForEdit,
  writeKitchenBandZoneWidthsMm,
  pinKitchenBandZoneWidthMm,
  ensureKitchenBandZoneGrids,
  getKitchenBandPartsForEdit,
  getKitchenBandSacrificeZoneIndex,
  setKitchenBandSacrificeZoneIndex,
  buildKitchenBandCellLayoutForSection,
  KITCHEN_BAND_CELL_MIN_MM,
} from './kitchen-section-layout.js?v=20261118-overlayL4';
import { KITCHEN_SIDE_PANEL_OVERLAY_THICKNESS_MM } from './kitchen-side-panels-clearance.js?v=20261117-from179';

function _findSection(group) {
  const sid = group?.userData?.sectionId;
  if (sid == null || !Array.isArray(state.customSections)) return null;
  return state.customSections.find((s) => s && String(s.id) === String(sid)) || null;
}

/** Пенал / MID / TOP / НМ — участник footprint (ячейка±pad, жертва). */
function _isColumnOverlayParticipant(group) {
  return (
    isKitchenTallGroup(group) ||
    isKitchenWallMidGroup(group) ||
    isKitchenWallTopGroup(group) ||
    isKitchenNmCarcassGroup(group)
  );
}

/**
 * Смена overlay у участника footprint (плательщик или наследник — по delta pad).
 */
function _columnOverlayCase(group, section, nextMode, prevMode) {
  if (!section || !isKitchenSidePanelFootprintSection(section)) return false;
  if (!_isColumnOverlayParticipant(group)) return false;
  return (
    String(nextMode || '').toLowerCase() === 'overlay' ||
    String(prevMode || '').toLowerCase() === 'overlay'
  );
}

function _overlayPadSidesFromPanels(sidePanels) {
  const t = KITCHEN_SIDE_PANEL_OVERLAY_THICKNESS_MM;
  let left = 0;
  let right = 0;
  if (String(sidePanels?.left?.mode || '').toLowerCase() === 'overlay') left = t;
  if (String(sidePanels?.right?.mode || '').toLowerCase() === 'overlay') right = t;
  return { left, right, sum: left + right };
}

function _overlayPadFromPanels(sidePanels) {
  return _overlayPadSidesFromPanels(sidePanels).sum;
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
  const pad = kitchenTallOverlayPadMm(ud);
  // Footprint-модуль с overlay: rebuild ждёт габарит ячейки (корпус+pad).
  if (
    pad > 0 &&
    (isKitchenTallGroup(group) ||
      isKitchenWallMidGroup(group) ||
      isKitchenWallTopGroup(group) ||
      isKitchenNmCarcassGroup(group))
  ) {
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
    console.warn('[SIDE-PANEL 6A] restore band widths failed', e);
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

function _syncMidTopToBaseZones(section, changedZis, baseWidths) {
  if (!section || !baseWidths) return;
  // Полная копия ширин BASE → MID/TOP (не только changed), иначе свободные ячейки
  // пересчитываются «по остатку» и вертикальная граница пенала плывёт.
  const parts = Math.max(
    1,
    getKitchenBandPartsForEdit(section, 'base') ||
      Math.floor(Number(section.division?.parts) || 0)
  );
  const full = Object.create(null);
  for (let z = 0; z < parts; z++) {
    const w = Math.round(Number(baseWidths[z] ?? baseWidths[String(z)]) || 0);
    if (w > 0) {
      full[z] = w;
      full[String(z)] = w;
    }
  }
  if (!Object.keys(full).length) return;
  for (const band of ['mid', 'top']) {
    try {
      writeKitchenBandZoneWidthsMm(section, band, full);
      const zis = Array.isArray(changedZis) && changedZis.length
        ? changedZis
        : Object.keys(full)
            .map((k) => Math.floor(Number(k)))
            .filter((z) => Number.isFinite(z) && z >= 0);
      for (const z of zis) {
        const w = Math.round(Number(full[z] ?? full[String(z)]) || 0);
        if (!(w > 0)) continue;
        if (band === 'mid' && findKitchenWallMidInSectionZone(section, z)) {
          syncKitchenWallMidInZoneToWidthMm(section, z, w);
        }
        if (band === 'top' && findKitchenWallTopInSectionZone(section, z)) {
          syncKitchenWallTopInZoneToWidthMm(section, z, w);
        }
      }
    } catch (e) {
      console.warn('[SIDE-PANEL 6A] mid/top sync', band, e);
    }
  }
}

function _invalidateSectionLayoutCache(section) {
  if (!section) return;
  try {
    delete section._layoutCache;
    delete section._layoutComputing;
  } catch (_) {}
}

function _fitGroupToZone(group, section, zi) {
  if (!group || !section || !Number.isFinite(zi)) return;
  let layoutOpt = null;
  try {
    if (isKitchenWallTopGroup(group)) {
      layoutOpt = buildKitchenBandCellLayoutForSection(section, 'top');
    } else if (isKitchenWallMidGroup(group)) {
      layoutOpt = buildKitchenBandCellLayoutForSection(section, 'mid');
    }
  } catch (_) {}
  try {
    const fn =
      typeof window !== 'undefined' ? window.__clodisFitFurnitureToSectionZone : null;
    if (typeof fn === 'function') {
      fn(group, section, zi, layoutOpt || undefined);
      return;
    }
  } catch (_) {}
  try {
    if (typeof window.__clodisUpdateFurnitureInSection === 'function') {
      window.__clodisUpdateFurnitureInSection(section);
    }
  } catch (_) {}
}

/** MID+TOP одной колонки — в свой пояс (не в BASE). */
function _fitWallStackColumn(section, zi) {
  if (!section || !Number.isFinite(zi)) return;
  const mid = findKitchenWallMidInSectionZone(section, zi);
  const top = findKitchenWallTopInSectionZone(section, zi);
  if (mid) _fitGroupToZone(mid, section, zi);
  if (top) _fitGroupToZone(top, section, zi);
}

/** Карандаши зон после накладки / компенсации — иначе пропадают у соседей. */
function _refreshSectionZonePencils(section) {
  if (!section?.id) return;
  try {
    const fn =
      typeof window !== 'undefined'
        ? window.__cldRebuildSectionZoneEditIconsForSection ||
          window.rebuildSectionZoneEditIconsForSection
        : null;
    if (typeof fn === 'function') fn(section.id);
  } catch (e) {
    console.warn('[SIDE-PANEL] rebuild zone pencils', e);
  }
}

/**
 * Пересечение по U только с нижним рядом / другим пеналом.
 * MID/TOP не блокируют: при рассинхроне поясов дают ложный отказ и откат цифр.
 */
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
    if (isKitchenWallMidGroup(obj) || isKitchenWallTopGroup(obj)) return;
    try {
      obj.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(obj);
      if (b.isEmpty()) return;
      const a0 = uAxis === 'z' ? b.min.z : b.min.x;
      const a1 = uAxis === 'z' ? b.max.z : b.max.x;
      // 2 мм — стык накладки с соседом не считать пересечением.
      if (t0 < a1 - 2 && a0 < t1 - 2) {
        hit = {
          uuid: obj.uuid,
          catalog: obj.userData.catalogName || '',
          zoneIndex: obj.userData.zoneIndex,
        };
      }
    } catch (_) {}
  });
  return hit ? { ok: false, blocker: hit } : { ok: true };
}

/** Пояс, в который пишет плательщик накладки. Пенал → BASE+MID/TOP; навес/антресоль → только MID+TOP. */
function _overlayPayerWriteBands(group) {
  if (isKitchenTallGroup(group)) return ['base', 'mid', 'top'];
  if (isKitchenWallMidGroup(group) || isKitchenWallTopGroup(group)) return ['mid', 'top'];
  return ['base'];
}

/** Текущие ширины пояса (custom или layout), мм. */
function _bandWidthsArray(section, bandId, parts) {
  const band = bandId || 'base';
  const n = Math.max(0, Math.floor(Number(parts) || 0));
  const out = new Array(n);
  let custom = null;
  try {
    custom = resolveKitchenBandCustomZoneWidthsMmForEdit(section, band);
  } catch (_) {}
  if (band === 'base' && (!custom || !Object.keys(custom).length)) {
    custom = section?.division?.customZoneWidthsMm || null;
  }
  let layoutWidths = null;
  if (band === 'base') {
    layoutWidths = section?._layoutCache?.moduleWidthsMm;
  } else {
    try {
      const bl = buildKitchenBandCellLayoutForSection(section, band);
      layoutWidths = bl?.moduleWidthsMm || null;
    } catch (_) {}
  }
  for (let z = 0; z < n; z++) {
    const c = Math.round(Number(custom?.[z] ?? custom?.[String(z)]) || 0);
    const l = Array.isArray(layoutWidths) ? Math.round(Number(layoutWidths[z]) || 0) : 0;
    let w = c > 0 ? c : l > 0 ? l : 0;
    if (!(w > 0) && band === 'base') w = _zoneWidthFromLayout(section, z);
    out[z] = w;
  }
  return out;
}

function _zoneWidthFromBand(section, bandId, zi) {
  const band = bandId || 'base';
  const parts = Math.max(
    1,
    getKitchenBandPartsForEdit(section, band) ||
      Math.floor(Number(section?.division?.parts) || 0)
  );
  const arr = _bandWidthsArray(section, band, parts);
  const w = Math.round(Number(arr[zi]) || 0);
  if (w > 0) return w;
  if (band === 'base') return _zoneWidthFromLayout(section, zi);
  return 0;
}

/** @deprecated use _bandWidthsArray(section,'base',parts) */
function _baseWidthsArray(section, parts) {
  return _bandWidthsArray(section, 'base', parts);
}

/**
 * Ближайший сосед колонки (fallback): справа → zi−1; слева → zi+1.
 * @returns {number} neighbor zi или −1
 */
function _nearestSacrificeZoneIndex(section, columnZi) {
  const parts = Math.max(
    1,
    getKitchenBandPartsForEdit(section, 'base') ||
      Math.floor(Number(section?.division?.parts) || 0)
  );
  const zi = Math.floor(Number(columnZi));
  if (!Number.isFinite(zi) || zi < 0 || zi >= parts) return -1;
  if (parts < 2) return -1;
  if (zi <= 0) return 1;
  if (zi >= parts - 1) return zi - 1;
  return zi - 1;
}

/**
 * Одна жертва на секцию: из карандаша (первый съём) или nearest + запомнить.
 * Все сужения накладок — только в неё.
 */
function _resolveOverlaySacrificeZoneIndex(section, columnZi) {
  const parts = Math.max(
    1,
    getKitchenBandPartsForEdit(section, 'base') ||
      Math.floor(Number(section?.division?.parts) || 0)
  );
  const colZi = Math.floor(Number(columnZi));
  let sac = getKitchenBandSacrificeZoneIndex(section, 'base');
  if (sac >= 0 && sac < parts && sac !== colZi) return sac;
  const nearest = _nearestSacrificeZoneIndex(section, colZi);
  if (nearest >= 0 && nearest < parts && nearest !== colZi) {
    try {
      setKitchenBandSacrificeZoneIndex(section, 'base', nearest);
    } catch (_) {}
    return nearest;
  }
  return -1;
}

/**
 * Footprint: пенал/MID/TOP — pad колонки (OR); НМ — только свой pad
 * (низ платит отдельно, верхняя накладка не делает НМ «наследником»).
 */
function _assessTallOverlayNearestNeighbor(group, section, nextSidePanels, prevSidePanels) {
  if (!_isColumnOverlayParticipant(group)) {
    return { ok: true, skipped: true, reason: 'not_column_participant' };
  }
  if (!section || !isKitchenSidePanelFootprintSection(section)) {
    return {
      ok: false,
      reason: 'not_footprint_section',
      message: 'Учёт накладок в ячейках — прямая секция или рукав L/U с сеткой.',
    };
  }
  const zi = Math.floor(Number(group.userData?.zoneIndex));
  if (!Number.isFinite(zi) || zi < 0) {
    return { ok: false, reason: 'bad_zone', message: 'Не задана ячейка модуля.' };
  }

  let writeBands = _overlayPayerWriteBands(group);
  const isNmPayer = isKitchenNmCarcassGroup(group);
  // НШ1↔НШ2: оба пояса, BASE не трогаем — пока в колонке нет пенала.
  const isWallStack =
    !isNmPayer &&
    writeBands.includes('mid') &&
    writeBands.includes('top') &&
    !writeBands.includes('base');
  // Пенал в той же zi: антресоль/навес платит → тянем всю колонку (BASE тоже).
  // Без пенала BASE не трогаем (НМ снизу не раздувается).
  const tallHere =
    !isNmPayer && isWallStack ? findKitchenTallInSectionZone(section, zi) : null;
  const wallPaysWithTall = !!(isWallStack && tallHere);
  if (wallPaysWithTall) writeBands = ['base', 'mid', 'top'];

  const widthBand = writeBands.includes('base')
    ? 'base'
    : isKitchenWallMidGroup(group)
      ? 'mid'
      : writeBands.includes('top')
        ? 'top'
        : 'mid';

  const colPrev = isNmPayer
    ? _overlayPadSidesFromPanels(prevSidePanels)
    : getKitchenColumnOverlayPadSidesMm(section, zi, {
        selfGroup: group,
        selfPanels: prevSidePanels,
      });
  const colNext = isNmPayer
    ? _overlayPadSidesFromPanels(nextSidePanels)
    : getKitchenColumnOverlayPadSidesMm(section, zi, {
        selfGroup: group,
        selfPanels: nextSidePanels,
      });

  const baseW0 = _zoneWidthFromBand(section, 'base', zi);
  const midW0 = _zoneWidthFromBand(section, 'mid', zi);
  const topW0 = _zoneWidthFromBand(section, 'top', zi);

  ensureKitchenBandZoneGrids(section);
  const parts = Math.max(
    1,
    getKitchenBandPartsForEdit(section, widthBand) ||
      getKitchenBandPartsForEdit(section, 'base') ||
      Math.floor(Number(section.division?.parts) || 0)
  );

  // Разные parts — сетку чужого пояса НЕ переписываем и parts НЕ выравниваем
  // (align MID→BASE ломал комнату). Платим совместимые пояса; модули zi — sync.
  const midParts0 = getKitchenBandPartsForEdit(section, 'mid');
  const topParts0 = getKitchenBandPartsForEdit(section, 'top');
  const bandPartsOk = (band) => {
    if (band === 'base') return true;
    const bp = band === 'mid' ? midParts0 : band === 'top' ? topParts0 : 0;
    if (!(bp > 0)) return false;
    return bp === parts;
  };
  const filteredBands = writeBands.filter(bandPartsOk);
  if (filteredBands.length) {
    writeBands = filteredBands;
  } else if (writeBands.includes('base') || widthBand === 'base') {
    writeBands = ['base'];
  } else {
    writeBands = [widthBand];
  }
  // MID≠TOP parts: из wall-stack оставляем один совместимый с widthBand.
  if ((isWallStack || wallPaysWithTall) && midParts0 > 0 && topParts0 > 0 && midParts0 !== topParts0) {
    writeBands = writeBands.filter((b) => b === 'base' || b === widthBand || bandPartsOk(b));
    if (!writeBands.length) writeBands = widthBand === 'top' ? ['top'] : ['mid'];
  }

  const midInWrite = writeBands.includes('mid');
  const topInWrite = writeBands.includes('top');

  let prevZoneMm = _zoneWidthFromBand(section, widthBand, zi);
  // Max только по поясам с той же сеткой — иначе чужой MID(9) раздувает BASE(8).
  if (isWallStack || (writeBands.includes('base') && !isNmPayer)) {
    let mx = prevZoneMm;
    if (writeBands.includes('base') && baseW0 > 0) mx = Math.max(mx, baseW0);
    if (midInWrite && midW0 > 0) mx = Math.max(mx, midW0);
    if (topInWrite && topW0 > 0) mx = Math.max(mx, topW0);
    prevZoneMm = mx;
  }
  if (!(prevZoneMm > 0)) {
    return { ok: false, reason: 'zone_width_unknown', message: 'Неизвестна ширина ячейки колонки.' };
  }
  const carcassW = Math.max(50, prevZoneMm - colPrev.sum);
  const prevPad = colPrev.sum;
  const nextPad = colNext.sum;
  const delta = nextPad - prevPad;
  const targetZoneMm = carcassW + nextPad;

  let wallNeedsAlign = false;
  if (isWallStack && !wallPaysWithTall) {
    wallNeedsAlign =
      (midInWrite && Math.abs(midW0 - targetZoneMm) > 1) ||
      (topInWrite && Math.abs(topW0 - targetZoneMm) > 1);
  }
  // Пенал: смотрим только пояса, чью сетку реально пишем.
  let tallNeedsAlign = false;
  if (!isNmPayer && writeBands.includes('base')) {
    tallNeedsAlign =
      Math.abs(baseW0 - targetZoneMm) > 1 ||
      (midInWrite && Math.abs(midW0 - targetZoneMm) > 1) ||
      (topInWrite && Math.abs(topW0 - targetZoneMm) > 1);
  }

  // Наследник: pad уже оплачен и пояса колонки уже на target — сетку не трогаем.
  if (Math.abs(delta) < 1 && !wallNeedsAlign && !tallNeedsAlign) {
    return {
      ok: true,
      skipped: true,
      targetZoneMm,
      changedZis: [],
      neighborZi: -1,
      carcassW,
      prevPad,
      nextPad,
      deltaMm: 0,
      heir: true,
      writeBands,
      widthBand,
      softBandSync: !midInWrite || !topInWrite,
    };
  }

  const neighborZi = _resolveOverlaySacrificeZoneIndex(section, zi);
  if (neighborZi < 0 || neighborZi === zi) {
    return {
      ok: false,
      reason: 'no_sacrifice_zone',
      message:
        'Нет жертвенной ячейки для компенсации накладки. Сначала задайте ширину ячейки карандашом (появится жертва) или оставьте соседнюю свободную ячейку.',
    };
  }

  const minCell = Math.max(1, Number(KITCHEN_BAND_CELL_MIN_MM) || 300);

  const planOneBand = (band) => {
    const bp = Math.max(1, getKitchenBandPartsForEdit(section, band) || parts);
    const widthsArr = _bandWidthsArray(section, band, bp);
    const curZi = Math.round(Number(widthsArr[zi]) || 0);
    if (!(curZi > 0)) {
      return { ok: false, reason: 'zone_width_unknown', band };
    }
    const dBand = Math.round(targetZoneMm - curZi);
    const nextWidthsBand = Object.create(null);
    for (let z = 0; z < bp; z++) {
      let w = Math.round(Number(widthsArr[z]) || 0);
      if (z === zi) w = targetZoneMm;
      nextWidthsBand[z] = w;
    }
    let neighPrevBand = Math.round(Number(widthsArr[neighborZi]) || 0);
    let neighNextBand = neighPrevBand;
    if (Math.abs(dBand) >= 1) {
      if (!(neighPrevBand > 0)) {
        return { ok: false, reason: 'neighbor_width_unknown', band };
      }
      neighNextBand = Math.round(neighPrevBand - dBand);
      nextWidthsBand[neighborZi] = neighNextBand;
      const occ =
        band === 'base'
          ? findKitchenBaseInSectionZone(section, neighborZi)
          : band === 'mid'
            ? findKitchenWallMidInSectionZone(section, neighborZi)
            : findKitchenWallTopInSectionZone(section, neighborZi);
      if (dBand > 0) {
        if (occ) {
          const gate = validateKitchenBaseCellWidthMm(occ, neighNextBand);
          if (!gate.ok) {
            return {
              ok: false,
              reason: gate.reason || 'neighbor_too_narrow',
              message:
                gate.message ||
                `Соседний модуль нельзя уменьшить до ${neighNextBand} мм под накладку.`,
              band,
              neighborZi,
              neighNext: neighNextBand,
            };
          }
        } else if (neighNextBand < minCell) {
          return {
            ok: false,
            reason: 'neighbor_below_min',
            message: `Соседняя ячейка стала бы ${neighNextBand} мм (мин. ${minCell} мм) — накладка не установлена.`,
            band,
            neighborZi,
            neighNext: neighNextBand,
          };
        }
      }
    }
    const sumPrev = widthsArr.reduce((s, w) => s + (Number(w) || 0), 0);
    let sumNext = 0;
    for (let z = 0; z < bp; z++) sumNext += Number(nextWidthsBand[z]) || 0;
    if (sumPrev > 0 && Math.abs(sumNext - sumPrev) > 1.5) {
      return {
        ok: false,
        reason: 'width_sum_drift',
        message: 'Внутренняя ошибка: сумма ширин ячеек не сохранилась.',
        band,
        sumPrev,
        sumNext,
      };
    }
    return {
      ok: true,
      band,
      deltaBand: dBand,
      nextWidths: nextWidthsBand,
      neighPrev: neighPrevBand,
      neighNext: neighNextBand,
    };
  };

  /** @type {Record<string, object>} */
  const nextWidthsByBand = Object.create(null);
  // Wall без пенала — только MID+TOP. С пеналом / сам пенал — writeBands (часто все три).
  const bandsToPlan = isWallStack && !wallPaysWithTall ? ['mid', 'top'] : writeBands.slice();
  let neighPrev = 0;
  let neighNext = 0;
  let nextWidths = null;
  for (const band of bandsToPlan) {
    const one = planOneBand(band);
    if (!one.ok) {
      return {
        ok: false,
        reason: one.reason || 'band_plan_failed',
        message: one.message || 'Не удалось спланировать ширины пояса под накладку.',
        band: one.band,
        neighborZi: one.neighborZi,
        neighNext: one.neighNext,
      };
    }
    nextWidthsByBand[band] = one.nextWidths;
    if (Math.abs(one.deltaBand) >= 1 || !nextWidths) {
      nextWidths = one.nextWidths;
      neighPrev = one.neighPrev;
      neighNext = one.neighNext;
    }
  }

  const neighOccBase = findKitchenBaseInSectionZone(section, neighborZi);
  const neighOccMid = findKitchenWallMidInSectionZone(section, neighborZi);
  const neighOccTop = findKitchenWallTopInSectionZone(section, neighborZi);
  const neighOcc = writeBands.includes('base')
    ? neighOccBase
    : neighOccTop || neighOccMid || null;

  if (writeBands.includes('base') && delta > 0 && neighOccMid) {
    const midGate = validateKitchenBaseCellWidthMm(neighOccMid, neighNext);
    if (!midGate.ok && midGate.reason === 'width_range') {
      return {
        ok: false,
        reason: 'mid_neighbor_too_narrow',
        message:
          midGate.message ||
          `Навесной в соседней колонке нельзя уменьшить до ${neighNext} мм.`,
        neighborZi,
        neighNext,
      };
    }
  }

  return {
    ok: true,
    zi,
    neighborZi,
    parts,
    carcassW,
    prevPad,
    nextPad,
    deltaMm: delta,
    targetZoneMm,
    neighPrev,
    neighNext,
    nextWidths,
    nextWidthsByBand,
    changedZis: [zi, neighborZi],
    neighOcc,
    writeBands,
    widthBand,
    wallStackAlign: wallNeedsAlign,
    tallColumnAlign: tallNeedsAlign || wallPaysWithTall,
    softBandSync: !midInWrite || !topInWrite,
  };
}

/**
 * STEP 6A: +pad на ячейку пенала, −pad только с ближайшего соседа.
 * Без setZoneCustomWidthMm / пропорционального balancer.
 */
function _reserveTallOverlayFootprint(group, section, nextSidePanels, prevSidePanels) {
  const plan = _assessTallOverlayNearestNeighbor(
    group,
    section,
    nextSidePanels,
    prevSidePanels
  );
  if (!plan.ok || plan.skipped) return plan;

  const {
    zi,
    neighborZi,
    carcassW,
    prevPad,
    nextPad,
    deltaMm: delta,
    targetZoneMm,
    neighPrev,
    neighNext,
    nextWidths,
    nextWidthsByBand,
    changedZis,
    neighOcc,
    writeBands: writeBandsIn,
    widthBand: widthBandIn,
  } = plan;

  const writeBands = writeBandsIn || _overlayPayerWriteBands(group);
  const widthBand = widthBandIn || (writeBands.includes('base') ? 'base' : 'top');
  const touchBase = writeBands.includes('base');
  const mapForBand = (band) =>
    nextWidthsByBand && nextWidthsByBand[band] ? nextWidthsByBand[band] : nextWidths;

  const widthsSnap = _snapshotBandWidths(section);

  try {
    for (const band of writeBands) {
      writeKitchenBandZoneWidthsMm(section, band, mapForBand(band));
    }
  } catch (e) {
    return {
      ok: false,
      reason: 'write_failed',
      message: 'Не удалось записать ширины ячеек.',
    };
  }

  _invalidateSectionLayoutCache(section);
  // Пенал: BASE → MID/TOP только если сетки совместимы (одни parts).
  // Иначе — только sync модулей в zi (без rewrite parts / без align).
  if (touchBase && isKitchenTallGroup(group)) {
    const midP = getKitchenBandPartsForEdit(section, 'mid');
    const topP = getKitchenBandPartsForEdit(section, 'top');
    const baseP = Math.max(
      1,
      getKitchenBandPartsForEdit(section, 'base') ||
        Math.floor(Number(section.division?.parts) || 0)
    );
    const gridsMatch =
      (!(midP > 0) || midP === baseP) && (!(topP > 0) || topP === baseP);
    if (gridsMatch && writeBands.includes('mid') && writeBands.includes('top')) {
      _syncMidTopToBaseZones(section, changedZis, nextWidths);
    } else {
      try {
        syncKitchenWallMidInZoneToWidthMm(section, zi, targetZoneMm);
        syncKitchenWallTopInZoneToWidthMm(section, zi, targetZoneMm);
      } catch (e) {
        console.warn('[SIDE-PANEL column] soft mid/top zi sync', e);
      }
    }
  }
  _invalidateSectionLayoutCache(section);

  try {
    for (const band of writeBands) {
      const wMap = mapForBand(band);
      const nPin = Math.round(Number(wMap?.[neighborZi]) || neighNext);
      pinKitchenBandZoneWidthMm(section, band, zi, targetZoneMm);
      if (nPin > 0) pinKitchenBandZoneWidthMm(section, band, neighborZi, nPin);
    }
  } catch (_) {}

  // Сначала жертва на затронутых поясах, потом колонка плательщика.
  try {
    if (touchBase && neighOcc) {
      const baseMap = mapForBand('base');
      const nW = Math.round(Number(baseMap?.[neighborZi]) || neighNext);
      syncKitchenBaseInZoneToWidthMm(section, neighborZi, nW);
      _fitGroupToZone(neighOcc, section, neighborZi);
    }
    if (writeBands.includes('mid')) {
      const midMap = mapForBand('mid');
      const nW = Math.round(Number(midMap?.[neighborZi]) || neighNext);
      if (nW > 0) syncKitchenWallMidInZoneToWidthMm(section, neighborZi, nW);
    }
    if (writeBands.includes('top')) {
      const topMap = mapForBand('top');
      const nW = Math.round(Number(topMap?.[neighborZi]) || neighNext);
      if (nW > 0) syncKitchenWallTopInZoneToWidthMm(section, neighborZi, nW);
    }
  } catch (e) {
    console.warn('[SIDE-PANEL column] neighbor rebuild', e);
  }
  try {
    if (touchBase) {
      // Пенал в колонке — и когда платит сам, и когда антресоль тянет BASE за ним.
      syncKitchenTallInZoneToWidthMm(section, zi, targetZoneMm);
      syncKitchenBaseInZoneToWidthMm(section, zi, targetZoneMm);
    }
    if (writeBands.includes('mid')) {
      syncKitchenWallMidInZoneToWidthMm(section, zi, targetZoneMm);
    }
    if (writeBands.includes('top')) {
      syncKitchenWallTopInZoneToWidthMm(section, zi, targetZoneMm);
    }
    // Wall-stack без BASE: сажать MID и TOP в свой пояс. Иначе — группа плательщика + стек.
    if (
      writeBands.includes('mid') &&
      writeBands.includes('top') &&
      !writeBands.includes('base')
    ) {
      _fitWallStackColumn(section, zi);
      if (neighborZi >= 0) _fitWallStackColumn(section, neighborZi);
    } else {
      _fitGroupToZone(group, section, zi);
      if (writeBands.includes('mid') || writeBands.includes('top')) {
        _fitWallStackColumn(section, zi);
        if (neighborZi >= 0) _fitWallStackColumn(section, neighborZi);
      }
    }
  } catch (e) {
    console.warn('[SIDE-PANEL column] column rebuild', e);
  }

  try {
    if (typeof window.__clodisUpdateFurnitureInSection === 'function') {
      window.__clodisUpdateFurnitureInSection(section);
    }
  } catch (_) {}

  const got = _zoneWidthFromBand(section, widthBand, zi);
  if (!(got > 0) || Math.abs(got - targetZoneMm) > 1.5) {
    _restoreBandWidths(section, widthsSnap);
    return {
      ok: false,
      reason: 'verify_failed',
      message:
        got > 0
          ? `Не удалось зафиксировать ячейку колонки ${targetZoneMm} мм (получилось ${got} мм).`
          : 'Не удалось проверить ширину ячейки колонки после компенсации.',
      targetZoneMm,
      gotMm: got,
      widthsSnap,
    };
  }

  console.log('[SIDE-PANEL column] nearest-neighbor compensate', {
    sectionId: section.id,
    columnZi: zi,
    neighborZi,
    carcassW,
    prevPad,
    nextPad,
    delta,
    targetZoneMm,
    neighPrev,
    neighNext,
    writeBands,
    payer: group.userData?.catalogName || '',
  });

  return {
    ok: true,
    targetZoneMm,
    gotMm: got,
    changedZis,
    widthsSnap,
    carcassW,
    nextPad,
    neighborZi,
    neighborWidthMm: neighNext,
    deltaMm: delta,
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
  const columnOverlayCase = _columnOverlayCase(
    group,
    section,
    nextSide.mode,
    prevSide.mode
  );

  // Вне footprint (нет сетки ячеек / не участник): clearance.
  // НМ / пенал / MID / TOP — footprint (жертва), не clearance у стены.
  if (
    nextSide.mode === 'overlay' &&
    String(prevSide.mode || '') !== 'overlay' &&
    !columnOverlayCase
  ) {
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
  if (columnOverlayCase) {
    // Единая проверка до мутации: плательщик (delta>0) или наследник (delta=0).
    const assess = _assessTallOverlayNearestNeighbor(group, section, tentative, prevFull);
    if (!assess.ok) {
      return {
        ok: false,
        reason: assess.reason || 'footprint_blocked',
        message: assess.message || 'Накладку в колонке нельзя установить.',
        sidePanels: JSON.parse(JSON.stringify(ud.sidePanels)),
        footprint: assess,
      };
    }
    ud.sidePanels = tentative;
    footprintRes = _reserveTallOverlayFootprint(group, section, tentative, prevFull);
    if (!footprintRes.ok) {
      ud.sidePanels = prevFull;
      if (footprintRes.widthsSnap) _restoreBandWidths(section, footprintRes.widthsSnap);
      _rebuildSameWidth(group);
      return {
        ok: false,
        reason: footprintRes.reason || 'compensate_failed',
        message: footprintRes.message || 'Не удалось компенсировать накладку ближайшим соседом.',
        sidePanels: JSON.parse(JSON.stringify(ud.sidePanels)),
        footprint: footprintRes,
      };
    }
  } else {
    ud.sidePanels = tentative;
  }

  const rebuilt = _rebuildSameWidth(group);
  if (!rebuilt.ok) {
    ud.sidePanels = prevFull;
    if (footprintRes?.widthsSnap) _restoreBandWidths(section, footprintRes.widthsSnap);
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
    if (footprintRes?.widthsSnap) _restoreBandWidths(section, footprintRes.widthsSnap);
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

  // Пересечение по U больше не откатывает накладку: проверка давала ложный отказ
  // и возвращала ширины ячеек (цифры «не меняются»). Стык = задача посадки в зону.
  if (columnOverlayCase && nextSide.mode === 'overlay') {
    try {
      const overlap = _tallFootprintHasUOverlap(group, section);
      if (!overlap.ok) {
        console.warn('[SIDE-PANEL column] U-overlap warn (no rollback)', overlap);
      }
    } catch (_) {}
    try {
      if (typeof window.__clodisUpdateFurnitureInSection === 'function' && section) {
        window.__clodisUpdateFurnitureInSection(section);
      }
    } catch (_) {}
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

  if (section) _refreshSectionZonePencils(section);

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
          neighborZi: footprintRes.neighborZi,
          neighborWidthMm: footprintRes.neighborWidthMm,
          deltaMm: footprintRes.deltaMm,
        }
      : null,
    rebuild: rebuilt.rebuild,
    skipWorktopCover: _skipWorktopCover(group),
    isNm: isKitchenNmCarcassGroup(group),
  };
}

/**
 * STEP 6A: проверка footprint (nearest neighbor), без применения.
 * НМ / пенал / MID / TOP в секции с сеткой; иначе skipped → clearance.
 */
export function assessKitchenTallOverlayFootprintLive(group, side, patch = {}) {
  if (!_isColumnOverlayParticipant(group)) {
    return { ok: true, skipped: true, reason: 'not_column_participant' };
  }
  const section = _findSection(group);
  if (!section || !isKitchenSidePanelFootprintSection(section)) {
    return { ok: true, skipped: true, reason: 'not_footprint_column_case' };
  }
  const ud = group.userData || {};
  const prevFull = normalizeKitchenSidePanels(ud.sidePanels || createDefaultKitchenSidePanels());
  const s = side === 'right' ? 'right' : 'left';
  const nextSide = { ...(prevFull[s] || {}), ...(patch && typeof patch === 'object' ? patch : {}) };
  const tentative = normalizeKitchenSidePanels({
    ...prevFull,
    [s]: nextSide,
  });
  return _assessTallOverlayNearestNeighbor(group, section, tentative, prevFull);
}

/** Reset both sides to standard and rebuild. */
export function clearKitchenModuleSidePanelOverlaysLive(group) {
  if (!isKitchenSidePanelsModuleGroup(group)) {
    return { ok: false, reason: 'not_kitchen_side_panels_module' };
  }
  const ud = group.userData || (group.userData = {});
  const prevFull = JSON.parse(JSON.stringify(ud.sidePanels || createDefaultKitchenSidePanels()));
  const section = _findSection(group);
  const columnCase =
    _isColumnOverlayParticipant(group) &&
    section &&
    isKitchenSidePanelFootprintSection(section);
  const defaults = createDefaultKitchenSidePanels();
  if (columnCase) {
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
  if (section) _refreshSectionZonePencils(section);
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
  window.__cldAssessKitchenTallOverlayFootprint = assessKitchenTallOverlayFootprintLive;
  window.__cldIsKitchenSidePanelsModuleGroup = isKitchenSidePanelsModuleGroup;
}
