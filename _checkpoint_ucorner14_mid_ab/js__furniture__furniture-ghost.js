// Furniture ghost module - handles furniture placement preview
// Manages the visual ghost/preview of furniture while placing it

import { state } from '../utils/state.js';
import { getRoomRenderPixelRatio } from '../core/renderer.js?v=20260624-ghost-perf';
import { cropCatalogIconImageToContentDataUrl, catalogScreenshotExportSize } from './catalog-icon-aspect.js?v=20260624-drag-icon-v5';

const CATALOG_DRAG_ICON_FALLBACK = { widthPx: 100, heightPx: 200 };
let _catalogDragIconEl = null;
let _catalogDragIconSize = { ...CATALOG_DRAG_ICON_FALLBACK };

function _applyCatalogDragIconSize(root, widthPx, heightPx, isLow) {
  const w = Math.max(20, Number(widthPx) || CATALOG_DRAG_ICON_FALLBACK.widthPx);
  const h = Math.max(20, Number(heightPx) || CATALOG_DRAG_ICON_FALLBACK.heightPx);
  _catalogDragIconSize = { widthPx: w, heightPx: h };
  root.style.width = `${w}px`;
  root.style.height = `${h}px`;
  root.classList.toggle('cld-catalog-drag-icon--low', !!isLow);
}

function _trimDragIconImage(inner) {
  const img = inner?.querySelector?.('img');
  if (!img) return;
  const run = () => {
    cropCatalogIconImageToContentDataUrl(img).then((url) => {
      if (!url || !_catalogDragIconEl?.contains(inner)) return;
      img.src = url;
    });
  };
  if (img.complete && img.naturalWidth > 0) run();
  else img.addEventListener('load', run, { once: true });
}

/**
 *      drag   (  ).
 */
export function showCatalogDragIcon(opts = {}) {
  removeCatalogDragIcon();
  const root = document.createElement('div');
  root.id = 'cld-catalog-drag-icon';
  root.className = 'cld-catalog-drag-icon';
  _applyCatalogDragIconSize(
    root,
    opts.widthPx,
    opts.heightPx,
    opts.isLow
  );
  const inner = document.createElement('div');
  inner.className = 'cld-catalog-drag-icon__inner';
  if (opts.sourceEl) {
    inner.innerHTML = opts.sourceEl.innerHTML;
    _trimDragIconImage(inner);
  } else if (opts.iconUrl) {
    const src = String(opts.iconUrl).replace(/"/g, '&quot;');
    inner.innerHTML =
      `<img src="${src}" alt="" onerror="this.style.display='none';var s=this.nextElementSibling;s&&(s.style.display='flex');">` +
      `<div class="cld-catalog-drag-icon__fallback" style="display:none"><i class="fas fa-cube"></i></div>`;
    _trimDragIconImage(inner);
  } else {
    const iconClass = String(opts.fontIcon || 'fa-cube').replace(/"/g, '');
    inner.innerHTML = `<i class="fas ${iconClass}"></i>`;
  }
  root.appendChild(inner);
  document.body.appendChild(root);
  _catalogDragIconEl = root;
  if (opts.event) updateCatalogDragIcon(opts.event);
}

export function updateCatalogDragIcon(event) {
  if (!_catalogDragIconEl || !event) return;
  const w = _catalogDragIconSize.widthPx;
  const h = _catalogDragIconSize.heightPx;
  _catalogDragIconEl.style.left = `${event.clientX - w / 2}px`;
  _catalogDragIconEl.style.top = `${event.clientY - h / 2}px`;
}

export function removeCatalogDragIcon() {
  if (_catalogDragIconEl) {
    _catalogDragIconEl.remove();
    _catalogDragIconEl = null;
  }
}
import {
  findSectionAtPosition,
  snapToZoneDoubleModule,
  buildZoneSnapForSection,
  getZonePivotWorldPosition,
  resolveSectionFurniturePlacement,
  getZoneDoorKind,
  TOP_PLANK_HEIGHT_MM,
  getLShapeSpecialZoneIndex,
  getLShapeSpecialZoneIndices,
  getLShapeSpecialSnapBounds,
  getLShapePairForSection,
} from '../sections/section-manager.js?v=20261103-wdepth5';
import {
  buildKitchenBandCellLayoutForSection,
  resolveKitchenUpperCornerCompanionSnap,
  isKitchenUpperCornerCompanionCandidateZone,
} from '../kitchen/kitchen-section-layout.js?v=20261107-ucorner14';
import { isUShapeBackSection } from '../sections/l-corner.js?v=20261022-bust12';
import {
  disposeTempLCornerGhost,
} from '../sections/section-ghost.js?v=20261013-no-ward-gap';
import {
  isEndCabinetCatalogModule,
  setEndCabinetSlotHighlight,
  pickEndCabinetSlotFromRaycaster,
  isEndCabinetPartObject,
  setPendingEndCabinetPlacement,
} from '../sections/section-end-cabinet.js?v=20260917-endcab-nobridge';

/** catalog_44 НМУ / catalog_54 ВМУ — только спец-ячейка L/П. */
/** Только ВМУ / catalog_54 (навесной угол). */
function isPendingWallCornerCabinet() {
  const fd = state.pendingFurnitureData;
  if (!fd) return false;
  const raw = fd?.catalogItem || fd;
  let rawPk = '';
  try {
    if (typeof window !== 'undefined' && typeof window.__cldGetRawPlacementKind === 'function') {
      rawPk = String(window.__cldGetRawPlacementKind(fd) || '').trim().toLowerCase();
    }
  } catch (_) {}
  if (!rawPk) {
    rawPk = String(
      fd?.__placementKindProfileId ||
        fd?.placementKind ||
        raw?.placementKind ||
        raw?.data?.placementKind ||
        ''
    )
      .trim()
      .toLowerCase();
  }
  if (rawPk === 'kitchen_wall_corner') return true;
  if (rawPk === 'kitchen_base_corner') return false;
  const ct = String(
    fd?.catalogType ||
      fd?.catalog_type ||
      raw?.catalog_type ||
      raw?.catalogType ||
      raw?.element_type ||
      raw?.data?.catalog_type ||
      ''
  )
    .replace(/^catalog_/i, '')
    .trim()
    .toLowerCase();
  return ct === '54';
}

/** НМУ / catalog_44 (низ угла). */
function isPendingBaseCornerCabinet() {
  if (isPendingWallCornerCabinet()) return false;
  if (typeof window !== 'undefined' && typeof window.__cldIsLCornerCabinetModule === 'function') {
    if (!window.__cldIsLCornerCabinetModule(state.pendingFurnitureData)) return false;
    return !isPendingWallCornerCabinet();
  }
  const fd = state.pendingFurnitureData;
  const raw = fd?.catalogItem || fd;
  const pk = String(
    fd?.placementKind || raw?.placementKind || raw?.data?.placementKind || ''
  )
    .trim()
    .toLowerCase();
  if (pk === 'kitchen_base_corner') return true;
  const ct = String(
    raw?.catalog_type || raw?.catalogType || fd?.catalogType || ''
  )
    .replace(/^catalog_/i, '')
    .trim();
  return ct === '44';
}

function isPendingLCornerCabinet() {
  return isPendingWallCornerCabinet() || isPendingBaseCornerCabinet();
}

/** Спец-зона угла под сторону pending (П: 0 и parts-1). */
function resolvePendingCornerSpecialZi(section) {
  if (!section) return null;
  const atStart = pendingCornerCabinetAtStart();
  const indices =
    typeof getLShapeSpecialZoneIndices === 'function'
      ? getLShapeSpecialZoneIndices(section)
      : [];
  if (Array.isArray(indices) && indices.length >= 2) {
    return atStart ? Math.min(...indices.map(Number)) : Math.max(...indices.map(Number));
  }
  if (typeof getLShapeSpecialZoneIndex === 'function') {
    return getLShapeSpecialZoneIndex(section, atStart);
  }
  return null;
}

/** Сторона pending НМУ: true=лев, false=прав (как corner_at_start). */
function pendingCornerCabinetAtStart() {
  const fd = state.pendingFurnitureData;
  const item = fd?.catalogItem || fd || {};
  let data = item.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (_) {
      data = {};
    }
  }
  const cv =
    (item.clodisVariables && typeof item.clodisVariables === 'object'
      ? item.clodisVariables
      : null) ||
    (data && typeof data === 'object' && data.clodisVariables) ||
    {};
  if (cv.corner_at_start === false || cv.corner_at_start === 0 || cv.corner_at_start === '0') {
    return false;
  }
  if (cv.corner_at_start === true || cv.corner_at_start === 1 || cv.corner_at_start === '1') {
    return true;
  }
  const nm = String(item.name || data?.name || '').toLowerCase();
  if (/прав/.test(nm) && !/лев/.test(nm)) return false;
  return true;
}

/**
 * ВМУ: snap в mid.special / upper-host (W≈600), не спец низа 1050.
 */
function resolveWallCornerCabinetLTarget(hitSection) {
  if (!hitSection?.lShape || !isPendingWallCornerCabinet()) return null;
  const sections = Array.isArray(state.customSections) ? state.customSections : [];
  let host = null;
  let midSp = -1;
  const trySec = (sec) => {
    if (!sec?.lShape || !sec.division) return false;
    const sp = Math.floor(Number(sec.kitchenBandGrids?.mid?.specialZoneIndex));
    if (!(Number.isFinite(sp) && sp >= 0)) return false;
    host = sec;
    midSp = sp;
    return true;
  };
  if (!trySec(hitSection)) {
    try {
      const pair =
        typeof getLShapePairForSection === 'function'
          ? getLShapePairForSection(hitSection)
          : null;
      if (pair?.primary && trySec(pair.primary)) {
        /* host found */
      } else if (pair?.attached) trySec(pair.attached);
    } catch (_) {}
  }
  if (!host) {
    for (const sec of sections) {
      if (trySec(sec)) break;
    }
  }
  if (!host?.division) return null;
  if (!(midSp >= 0)) {
    const atStart = pendingCornerCabinetAtStart();
    const midParts = Math.max(
      1,
      Math.floor(
        Number(host.kitchenBandGrids?.mid?.parts) || host.division.parts || 1
      )
    );
    midSp = atStart ? 0 : midParts - 1;
  }
  const wallName = host.wallName || host.division?.wallName || 'back';
  let moduleWidth = 600;
  let pivotCoord = null;
  try {
    const layout = buildKitchenBandCellLayoutForSection(host, 'mid');
    const seg = (layout?.segments || []).find(
      (s) => s && s.type === 'module' && Number(s.zoneIndex) === midSp
    );
    if (seg) {
      const a = Math.min(Number(seg.startU), Number(seg.endU));
      const b = Math.max(Number(seg.startU), Number(seg.endU));
      moduleWidth = Math.max(50, Math.round(b - a));
      pivotCoord = wallName === 'left' || wallName === 'front' ? b : a;
    }
  } catch (_) {}
  if (pivotCoord == null) {
    const snap0 = buildZoneSnapForSection(host, midSp, wallName);
    if (!snap0) return null;
    return {
      section: host,
      wallName,
      snap: { ...snap0, moduleWidth: 600, zoneIndex: midSp },
      specialZi: midSp,
      wallCorner: true,
    };
  }
  return {
    section: host,
    wallName,
    snap: { pivotCoord, zoneIndex: midSp, moduleWidth },
    specialZi: midSp,
    wallCorner: true,
  };
}

/**
 * Угловой НМ: L → одна спец; П → лев/прав по модулю.
 * ВМУ → resolveWallCornerCabinetLTarget (MID 600).
 */
function resolveCornerCabinetLTarget(section) {
  if (!section?.lShape || !isPendingLCornerCabinet()) return null;
  if (isPendingWallCornerCabinet()) {
    return resolveWallCornerCabinetLTarget(section);
  }
  let primary = section;
  try {
    if (isUShapeBackSection(section)) {
      primary = section;
    } else {
      const pairId = section.lShape.pairId;
      const other =
        pairId != null && Array.isArray(state.customSections)
          ? state.customSections.find((s) => s && String(s.id) === String(pairId))
          : null;
      if (other && isUShapeBackSection(other)) {
        primary = other;
      } else {
        const pair =
          typeof getLShapePairForSection === 'function'
            ? getLShapePairForSection(section)
            : null;
        if (pair?.primary) primary = pair.primary;
      }
    }
  } catch (_) {}
  if (!primary?.division) return null;
  try {
    if (isUShapeBackSection(primary) || primary.division.uShape === true) {
      primary.division.uShape = true;
    }
  } catch (_) {}
  const atStart = pendingCornerCabinetAtStart();
  const indices =
    typeof getLShapeSpecialZoneIndices === 'function'
      ? getLShapeSpecialZoneIndices(primary)
      : [];
  let specialZi =
    indices.length >= 2
      ? atStart
        ? Math.min(...indices)
        : Math.max(...indices)
      : getLShapeSpecialZoneIndex(primary, atStart);
  if (specialZi == null) return null;
  const wallName =
    primary.wallName || primary.division?.wallName || 'back';
  let snap = buildZoneSnapForSection(primary, specialZi, wallName);
  const sp = getLShapeSpecialSnapBounds(primary.division, specialZi);
  if (sp?.moduleWidth > 0 && Number.isFinite(sp.zoneStart)) {
    const wMm = Math.round(sp.moduleWidth);
    const pivotCoord =
      wallName === 'left' || wallName === 'front'
        ? sp.zoneStart + wMm
        : sp.zoneStart;
    snap = {
      pivotCoord,
      zoneIndex: sp.zoneIndex != null ? sp.zoneIndex : specialZi,
      moduleWidth: wMm,
    };
  }
  if (!snap || !(snap.moduleWidth > 0)) return null;
  return { section: primary, wallName, snap, specialZi };
}

/**  -        .
 *  :           .
 *          ( .   .). */
function _triggerAutoSwitchForZone(section, zoneIndex) {
  const doorKind = getZoneDoorKind(section, zoneIndex);
  if (!doorKind) return;
  const mod = getPendingModuleDoorKind();
  const specialZis =
    typeof getLShapeSpecialZoneIndices === 'function'
      ? getLShapeSpecialZoneIndices(section)
      : [];
  const specialZiOne = getLShapeSpecialZoneIndex(section);
  const onLSpecial =
    (Array.isArray(specialZis) &&
      specialZis.some((z) => Number(z) === Number(zoneIndex))) ||
    (specialZiOne != null && Number(zoneIndex) === Number(specialZiOne));
  // catalog_44/54 ↔ спец; без переключения одн./двуств.
  if (state.isPlacingFurniture && state.pendingFurnitureData && isPendingLCornerCabinet()) {
    if (onLSpecial) {
      state._catalogSwitchDoorKindOnRelease = null;
      return;
    }
    state._catalogSwitchDoorKindOnRelease = null;
    return;
  }
  if (onLSpecial && state.isPlacingFurniture && state.pendingFurnitureData) {
    //          double.
    state._catalogSwitchDoorKindOnRelease = null;
    return;
  }
  //  / : ./.        upper  base.
  if (state.isPlacingFurniture && state.pendingFurnitureData) {
    const pendingPk = resolvePlacementKind(state.pendingFurnitureData);
    if (_pendingSkipsZoneDoorKindGate(pendingPk)) {
      state._catalogSwitchDoorKindOnRelease = null;
      return;
    }
  }
  //  :  split/merge      .
  if (state.isPlacingFurniture && state.pendingFurnitureData) {
    if (
      mod &&
      mod !== doorKind &&
      typeof window.__clodisZonePlaceGesturePossible === 'function' &&
      window.__clodisZonePlaceGesturePossible(section?.id, zoneIndex, mod)
    ) {
      state._catalogSwitchDoorKindOnRelease = null;
      return;
    }
    if (!mod || mod !== doorKind) {
      state._catalogSwitchDoorKindOnRelease = doorKind;
      return;
    }
  }
  if (!isZoneCompatibleWithPendingModule(doorKind, section, zoneIndex)) {
    state._catalogSwitchDoorKindOnRelease = doorKind;
    return;
  }
  state._catalogSwitchDoorKindOnRelease = null;
  if (window.__lastAutoSwitchZoneDoorKind === doorKind) return;
  window.__lastAutoSwitchZoneDoorKind = doorKind;
  if (typeof window.__clodisAutoSwitchCatalogForZone === 'function') {
    window.__clodisAutoSwitchCatalogForZone(doorKind);
  }
}

function getPendingModuleDoorKind() {
  if (typeof window.__clodisGetPendingModuleDoorKind === 'function') {
    return window.__clodisGetPendingModuleDoorKind();
  }
  return null;
}

/**
 * Прямая (Maatkasten): призрак Single = 1 ячейка (half double), Double = 2 ячейки.
 *    singles      split  place.
 */
function applyMaatkastenStraightGhostCellSnap(
  section,
  resolvedWallName,
  hitCoord,
  snapIn,
  zoneSizeIn
) {
  let snap = snapIn;
  let zoneSize = zoneSizeIn;
  if (!section?.division || !snap) {
    return { snap, worldPos: null, zoneSize };
  }
  let moduleW = Number(snap.moduleWidth) || 0;
  const authSnap = buildZoneSnapForSection(section, snap.zoneIndex, resolvedWallName);
  if (authSnap?.moduleWidth > 0) moduleW = authSnap.moduleWidth;

  const specialIndices =
    typeof getLShapeSpecialZoneIndices === 'function'
      ? getLShapeSpecialZoneIndices(section)
      : [];
  const specialZi = getLShapeSpecialZoneIndex(section);
  const zi = Number(snap.zoneIndex);
  const isLSpecial =
    (Number.isFinite(zi) && specialIndices.includes(zi)) ||
    (specialZi != null && zi === specialZi);
  const isCorner = isPendingLCornerCabinet();
  const mod = getPendingModuleDoorKind();
  // Спец-ячейка: double = ширина S+D / половинки; полный модуль всё равно по isLSpecial.
  const zKind = isLSpecial ? 'double' : getZoneDoorKind(section, snap.zoneIndex);
  const segs = section._layoutCache?.segments;
  const parts = Math.max(0, Math.floor(Number(section.division?.parts) || 0));

  // catalog_44 / спец L/П: всегда полная ширина S+D, никогда half single.
  if (isLSpecial || (isCorner && isLSpecial)) {
    const spZiUse = Number.isFinite(zi) && specialIndices.includes(zi) ? zi : specialZi;
    const sp = getLShapeSpecialSnapBounds(section.division, spZiUse);
    const wMm = sp?.moduleWidth > 0 ? Math.round(sp.moduleWidth) : Math.round(moduleW);
    const zStart = sp?.zoneStart;
    const pivotCoord =
      Number.isFinite(zStart) && wMm > 0
        ? resolvedWallName === 'left' || resolvedWallName === 'front'
          ? zStart + wMm
          : zStart
        : authSnap?.pivotCoord ?? snap.pivotCoord;
    snap = {
      pivotCoord,
      zoneIndex: spZiUse != null ? spZiUse : zi,
      moduleWidth: wMm,
    };
    moduleW = wMm;
    if (typeof window !== 'undefined' && window.__cldLCornerVerbose === true) {
      console.log('[L-CORNER] ghost force S+D width', {
        moduleW,
        specialZi,
        S: sp?.S,
        D: sp?.D,
        isCorner,
      });
    }
  } else if (mod === 'double' && moduleW > 0) {
    // Double = ровно 2 ячейки (Maatkasten). Никогда не sum(single+double) и не 2 doubles.
    const cellW = zKind === 'double' ? moduleW / 2 : moduleW;
    const targetW = Math.round(2 * cellW);
    if (zKind === 'double' && authSnap) {
      snap = {
        pivotCoord: authSnap.pivotCoord,
        zoneIndex: zi,
        moduleWidth: Math.round(moduleW),
      };
      moduleW = Math.round(moduleW);
    } else if (zKind === 'single' && Array.isArray(segs) && parts >= 2) {
      const right = zi + 1;
      const left = zi - 1;
      const neighbor = right < parts ? right : left >= 0 ? left : null;
      if (neighbor != null) {
        const lo = Math.min(zi, neighbor);
        const segLo = segs.find((s) => s && s.type === 'module' && s.zoneIndex === lo);
        if (segLo && Number.isFinite(segLo.startU)) {
          const endU = segLo.startU + targetW;
          const pivotCoord =
            resolvedWallName === 'left' || resolvedWallName === 'front'
              ? endU
              : segLo.startU;
          snap = { pivotCoord, zoneIndex: lo, moduleWidth: targetW };
          moduleW = targetW;
        }
      }
    }
  } else if (
    !isLSpecial &&
    mod === 'single' &&
    zKind === 'double' &&
    moduleW >= 400
  ) {
    // Single на double: призрак = half под курсором (секцию не меняем до place).
    const seg = Array.isArray(segs)
      ? segs.find((s) => s && s.type === 'module' && s.zoneIndex === zi)
      : null;
    if (seg && seg.endU > seg.startU && Number.isFinite(Number(hitCoord))) {
      const mid = (seg.startU + seg.endU) / 2;
      const preferRight = Number(hitCoord) >= mid;
      const halfW = moduleW / 2;
      const halfStart = preferRight ? mid : seg.startU;
      const halfEnd = preferRight ? seg.endU : mid;
      const pivotCoord =
        resolvedWallName === 'left' || resolvedWallName === 'front'
          ? halfEnd
          : halfStart;
      snap = {
        pivotCoord,
        zoneIndex: zi,
        moduleWidth: halfW,
      };
      moduleW = halfW;
    }
  } else if (authSnap) {
    snap = {
      pivotCoord: authSnap.pivotCoord,
      zoneIndex: zi,
      moduleWidth: moduleW,
    };
  }

  const worldPos = getZonePivotWorldPosition(section, snap, resolvedWallName);
  if (zoneSize) zoneSize = { ...zoneSize, x: moduleW };
  return { snap, worldPos, zoneSize, moduleW };
}

/** Папка 50/51/42/43 → НШ1/НШ2 (даже если placementKind уже mapped в wall_hung_*). */
function _kitchenWallBandFolderId(data) {
  const ct = String(
    data?.catalogItem?.element_type ||
      data?.catalogItem?.key ||
      data?.catalogType ||
      data?.element_type ||
      data?.catalogItem?.params?.spec?.element_type ||
      data?.catalogItem?.catalog_type ||
      data?.catalogItem?.catalogType ||
      data?.catalog_type ||
      ''
  )
    .trim()
    .toLowerCase()
    .replace(/^catalog_/, '');
  if (ct === '50' || ct === '42' || ct === '43') return 'mid';
  if (ct === '51') return 'top';
  return '';
}

/** Stamp mid/top на data — place/ghost не теряют НШ1 после map→wall_hung. */
function _ensureKitchenWallBandStamp(data) {
  if (!data || typeof data !== 'object') return '';
  const cur = String(data.__kitchenWallBand || '')
    .trim()
    .toLowerCase();
  if (cur === 'mid' || cur === 'top') return cur;
  if (_isCornerCabinetGhostData(data)) return '';
  const folder = _kitchenWallBandFolderId(data);
  if (folder === 'top' || folder === 'mid') {
    data.__kitchenWallBand = folder;
    return folder;
  }
  const profile = String(
    data.__placementKindProfileId ||
      data.placementKindProfileId ||
      data?.catalogItem?.placementKind ||
      ''
  )
    .trim()
    .toLowerCase();
  if (profile === 'kitchen_wall_top') {
    data.__kitchenWallBand = 'top';
    return 'top';
  }
  if (profile === 'kitchen_wall_mid') {
    data.__kitchenWallBand = 'mid';
    return 'mid';
  }
  let dataPk = '';
  try {
    const raw = data?.catalogItem?.data ?? data?.data;
    if (typeof raw === 'string' && raw.trim()) {
      dataPk = String(JSON.parse(raw)?.placementKind || '').trim().toLowerCase();
    } else if (raw && typeof raw === 'object') {
      dataPk = String(raw.placementKind || '').trim().toLowerCase();
    }
  } catch (_) {}
  if (dataPk === 'kitchen_wall_top') {
    data.__kitchenWallBand = 'top';
    return 'top';
  }
  if (dataPk === 'kitchen_wall_mid') {
    data.__kitchenWallBand = 'mid';
    return 'mid';
  }
  return '';
}

function _isCornerCabinetGhostData(data) {
  if (!data || typeof data !== 'object') return false;
  if (
    typeof window !== 'undefined' &&
    typeof window.__cldIsLCornerCabinetModule === 'function'
  ) {
    return !!window.__cldIsLCornerCabinetModule(data);
  }
  const raw = data?.catalogItem || data;
  const pk = String(
    data?.placementKind || raw?.placementKind || raw?.data?.placementKind || ''
  )
    .trim()
    .toLowerCase();
  if (pk === 'kitchen_base_corner' || pk === 'kitchen_wall_corner') return true;
  const ct = String(
    raw?.catalog_type ||
      raw?.catalogType ||
      raw?.data?.catalog_type ||
      data?.catalogType ||
      data?.catalogItem?.element_type ||
      ''
  )
    .replace(/^catalog_/i, '')
    .trim();
  return ct === '44' || ct === '54';
}

/** НШ1/НШ2 по data (не ВМУ / не угол). */
function _isKitchenWallBandGhostData(data) {
  if (!data || typeof data !== 'object') return false;
  if (_isCornerCabinetGhostData(data)) return false;
  if (_ensureKitchenWallBandStamp(data)) return true;
  const profile = String(
    data.__placementKindProfileId || data.placementKindProfileId || ''
  )
    .trim()
    .toLowerCase();
  if (profile === 'kitchen_wall_mid' || profile === 'kitchen_wall_top') return true;
  const folder = _kitchenWallBandFolderId(data);
  if (folder) return true;
  const raw = String(getRawGhostPlacementKind(data) || '')
    .trim()
    .toLowerCase();
  if (raw === 'kitchen_wall_corner') return false;
  if (raw === 'kitchen_wall_mid' || raw === 'kitchen_wall_top') return true;
  const pk = String(resolvePlacementKind(data) || '')
    .trim()
    .toLowerCase();
  return pk === 'kitchen_wall_mid' || pk === 'kitchen_wall_top';
}

/** Для place/drag в manager: НШ1/НШ2 (stamp/папка), не ВМУ. */
export function isKitchenWallBandFurnitureData(data) {
  return _isKitchenWallBandGhostData(data);
}

function _isKitchenWallTopGhostData(data) {
  if (!_isKitchenWallBandGhostData(data)) return false;
  const stamp = String(data.__kitchenWallBand || '')
    .trim()
    .toLowerCase();
  if (stamp === 'top') return true;
  if (stamp === 'mid') return false;
  const profile = String(
    data.__placementKindProfileId || data.placementKindProfileId || ''
  )
    .trim()
    .toLowerCase();
  if (profile === 'kitchen_wall_top') return true;
  if (_kitchenWallBandFolderId(data) === 'top') return true;
  const raw = String(getRawGhostPlacementKind(data) || '')
    .trim()
    .toLowerCase();
  if (raw === 'kitchen_wall_top') return true;
  return isKitchenWallTopPlacementKind(resolvePlacementKind(data));
}

/** Габарит призрака = ячейка MID/TOP (W×H×D≈350), не секция низа. */
function _forceKitchenWallBandZoneSizeMm(zoneSize, data, section) {
  const catalog = resolveGhostCatalogSizeMm(data);
  const cx = Number(catalog.x) || 0;
  const isTop = _isKitchenWallTopGhostData(data);
  // Без sectionDepthMm: глубина секции 550–600 не должна раздувать призрак.
  const sized = isTop
    ? resolveKitchenWallTopGhostSizing(null)
    : resolveKitchenWallMidGhostSizing(null);
  const x =
    Number(zoneSize?.x) > 0
      ? Math.round(Number(zoneSize.x))
      : cx > 0
        ? Math.round(cx)
        : 600;
  const y = Math.round(
    (sized && sized.heightMm) || (isTop ? 360 : 720)
  );
  let z = Math.round((sized && sized.depthMm) || 350);
  if (!(z > 0) || z > 450) z = 350;
  return { x, y, z };
}

/** НШ1/НШ2 (не ВМУ): сырой kind + папка 50/51 — mapped wall_hung не должен ломать. */
function _isPendingKitchenWallBandModule() {
  if (isPendingLCornerCabinet()) return false;
  return _isKitchenWallBandGhostData(state.pendingFurnitureData);
}

/**
 * НШ1/НШ2 рядом с приставным ВМУ — просто разрешено (не catalog_54).
 * Угловая mid.special = ВМУ; соседняя MID = НШ1.
 */
function _allowsKitchenWallOnLSpecial(data) {
  if (!data || typeof data !== 'object') return false;
  if (isPendingLCornerCabinet()) return false;
  if (_isKitchenWallBandGhostData(data)) return true;
  const pk = String(resolvePlacementKind(data) || '')
    .trim()
    .toLowerCase();
  if (isKitchenWallMidPlacementKind(pk) || isKitchenWallTopPlacementKind(pk)) {
    return true;
  }
  if (
    pk === 'wall_hung_low' ||
    pk === 'wall_hung' ||
    pk === 'wall_hung_high'
  ) {
    return (
      !!_ensureKitchenWallBandStamp(data) || !!_kitchenWallBandFolderId(data)
    );
  }
  return false;
}

/** Угловая MID (ВМУ): индекс спец; иначе null. */
function _midCornerSpecialZi(section) {
  const midSp = Math.floor(
    Number(section?.kitchenBandGrids?.mid?.specialZoneIndex)
  );
  if (Number.isFinite(midSp) && midSp >= 0) return midSp;
  return null;
}

/** Резерв inset 390 на upper-other (не шкаф). */
function _midCornerInsetZi(section) {
  const iz = Math.floor(
    Number(section?.kitchenBandGrids?.mid?.cornerInsetZoneIndex)
  );
  if (Number.isFinite(iz) && iz >= 0) return iz;
  return null;
}

function _pendingKitchenWallMidWidthMm() {
  const fd = state.pendingFurnitureData;
  if (!fd) return 600;
  const own = Math.round(Number(fd.customWidthMm) || 0);
  if (own >= 300 && own <= 1200) return own;
  try {
    const item = fd.catalogItem || fd.item || fd;
    const w = Math.round(
      Number(item?.width) ||
        Number(item?.data?.width) ||
        Number(item?.params?.width) ||
        Number(fd.width) ||
        0
    );
    if (w >= 300 && w <= 1200) return w;
  } catch (_) {}
  return 600;
}

function _redirectOffBlockedMidZi(section, blockedZi, wallName) {
  const midParts = Math.max(
    0,
    Math.floor(Number(section?.kitchenBandGrids?.mid?.parts) || 0)
  );
  const zi = Math.floor(Number(blockedZi));
  if (!Number.isFinite(zi) || zi < 0 || !(midParts > 1)) return null;
  const neighborZi =
    zi <= 0 ? 1 : zi >= midParts - 1 ? zi - 1 : zi - 1;
  if (!(neighborZi >= 0 && neighborZi < midParts && neighborZi !== zi)) {
    return null;
  }
  // Не сажать НШ1 обратно в inset/special.
  const insetZi = _midCornerInsetZi(section);
  const midSp = _midCornerSpecialZi(section);
  if (neighborZi === insetZi || neighborZi === midSp) return null;
  const layout = buildKitchenBandCellLayoutForSection(section, 'mid');
  const seg = (layout?.segments || []).find(
    (s) => s && s.type === 'module' && Number(s.zoneIndex) === neighborZi
  );
  if (!seg) return { zoneIndex: neighborZi, moduleWidth: 600, pivotCoord: null };
  const a = Math.min(Number(seg.startU), Number(seg.endU));
  const b = Math.max(Number(seg.startU), Number(seg.endU));
  const pivotCoord =
    wallName === 'left' || wallName === 'front' ? b : a;
  return {
    zoneIndex: neighborZi,
    moduleWidth: Math.round(b - a),
    pivotCoord,
  };
}

/** НШ1 с mid.special (ВМУ host) → сосед; inset на upper-other → companion (не redirect). */
function _redirectNsh1OffMidCorner(section, zoneIndex, wallName) {
  const zi = Math.floor(Number(zoneIndex));
  if (!Number.isFinite(zi)) return null;
  const midSp = _midCornerSpecialZi(section);
  if (midSp != null && zi === midSp) {
    return _redirectOffBlockedMidZi(section, midSp, wallName);
  }
  // inset / seat: companion snap, не соседняя обычная ячейка
  return null;
}

/**
 * Snap НШ1/НШ2: MID/TOP.
 * Угол mid.special (host) → сосед; upper-other inset/seat → companion к upperCornerCell.
 */
function resolveKitchenWallBandGhostSnap(section, hitCoord, wallName) {
  if (!section || !_isPendingKitchenWallBandModule()) return null;
  const rawBand = String(
    getRawGhostPlacementKind(state.pendingFurnitureData) || ''
  )
    .trim()
    .toLowerCase();
  const stamp = String(
    state.pendingFurnitureData?.__kitchenWallBand || ''
  )
    .trim()
    .toLowerCase();
  const bandId =
    rawBand === 'kitchen_wall_top' ||
    stamp === 'top' ||
    _kitchenWallBandFolderId(state.pendingFurnitureData) === 'top'
      ? 'top'
      : 'mid';
  let bandSnap = snapHitToKitchenBandZone(
    section,
    hitCoord,
    bandId,
    wallName
  );
  if (bandSnap && bandId === 'mid') {
    if (
      isKitchenUpperCornerCompanionCandidateZone(section, bandSnap.zoneIndex)
    ) {
      const companion = resolveKitchenUpperCornerCompanionSnap(
        section,
        _pendingKitchenWallMidWidthMm(),
        wallName
      );
      if (companion) {
        return {
          pivotCoord: companion.pivotCoord,
          zoneIndex: companion.zoneIndex,
          moduleWidth: companion.moduleWidth,
          companion: true,
          upperCornerCellId: companion.upperCornerCellId,
          companionStartU: companion.startU,
          companionEndU: companion.endU,
          companionSpannedZones: companion.spannedZoneIndexes.slice(),
          companionAnchorEdge: companion.anchorEdge,
          companionInsetZoneIndex: companion.insetZoneIndex,
        };
      }
    }
    const redir = _redirectNsh1OffMidCorner(
      section,
      bandSnap.zoneIndex,
      wallName
    );
    if (redir) {
      bandSnap = {
        pivotCoord:
          redir.pivotCoord != null ? redir.pivotCoord : bandSnap.pivotCoord,
        zoneIndex: redir.zoneIndex,
        moduleWidth: redir.moduleWidth || bandSnap.moduleWidth,
      };
    }
  }
  return bandSnap;
}

/** Snap НШ1/НШ2 по MID/TOP сетке (не спец низа 1050). */
function snapHitToKitchenBandZone(section, hitCoord, bandId, wallName) {
  if (!section?.division) return null;
  let layout = null;
  try {
    layout = buildKitchenBandCellLayoutForSection(section, bandId);
  } catch (_) {
    layout = null;
  }
  if (!layout?.segments?.length) return null;
  const hit = Number(hitCoord);
  if (!Number.isFinite(hit)) return null;
  let best = null;
  let bestDist = Infinity;
  for (const seg of layout.segments) {
    if (!seg || seg.type !== 'module') continue;
    const a = Math.min(Number(seg.startU), Number(seg.endU));
    const b = Math.max(Number(seg.startU), Number(seg.endU));
    if (!(b > a)) continue;
    let d = 0;
    if (hit < a) d = a - hit;
    else if (hit > b) d = hit - b;
    if (d < bestDist) {
      bestDist = d;
      best = { zoneIndex: Number(seg.zoneIndex), startU: a, endU: b };
    }
    if (d === 0) break;
  }
  if (!best) return null;
  const pivotCoord =
    wallName === 'left' || wallName === 'front' ? best.endU : best.startU;
  return {
    pivotCoord,
    zoneIndex: best.zoneIndex,
    moduleWidth: Math.round(best.endU - best.startU),
  };
}

function isZoneCompatibleWithPendingModule(zoneDoorKind, sectionOpt, zoneIndexOpt) {
  if (!zoneDoorKind) return true;
  const sid = sectionOpt?.id ?? state._pendingZoneInfo?.sectionId;
  const zi =
    zoneIndexOpt != null ? zoneIndexOpt : state._pendingZoneInfo?.zoneIndex;
  const sec =
    sectionOpt ||
    (sid != null && Array.isArray(state.customSections)
      ? state.customSections.find((s) => s && s.id === sid)
      : null);
  const isCorner = isPendingLCornerCabinet();
  const specialZi = isCorner
    ? resolvePendingCornerSpecialZi(sec)
    : sec
      ? getLShapeSpecialZoneIndex(sec)
      : null;
  const specialZis =
    !isCorner && sec && typeof getLShapeSpecialZoneIndices === 'function'
      ? getLShapeSpecialZoneIndices(sec)
      : null;
  const onLSpecial = isCorner
    ? specialZi != null && zi != null && Number(zi) === Number(specialZi)
    : (Array.isArray(specialZis) &&
        specialZis.some((z) => Number(z) === Number(zi))) ||
      (specialZi != null && zi != null && Number(zi) === Number(specialZi));
  // catalog_44/54: только свой спец (лев/прав).
  if (isCorner) {
    return !!onLSpecial;
  }
  // НШ1/НШ2: угловая + сосед — не блокировать (обычный НШ1 в угол MID).
  if (
    onLSpecial &&
    !_allowsKitchenWallOnLSpecial(state.pendingFurnitureData)
  ) {
    return false;
  }

  const mod = getPendingModuleDoorKind();
  if (!mod) return true;
  if (mod === zoneDoorKind) return true;
  //  split/merge       .
  if (
    sid != null &&
    zi != null &&
    typeof window.__clodisZonePlaceGesturePossible === 'function' &&
    window.__clodisZonePlaceGesturePossible(sid, zi, mod)
  ) {
    return true;
  }
  return false;
}

/**
 *    .   ./.    (),
 *  ghostPosition     ;    .
 */
function _pendingZoneSection() {
  const sid = state._pendingZoneInfo?.sectionId;
  if (sid == null || !Array.isArray(state.customSections)) return null;
  return state.customSections.find((s) => s && s.id === sid) || null;
}

function _pendingZoneIsUnderWindowBay() {
  const sec = _pendingZoneSection();
  if (!sec) return false;
  if (Number(sec.fixedHeightMm) > 0) return true;
  return !!(sec.underWindowBay || sec.windowBridgeRole === 'under-window');
}

/** Тумба / навес / кухня НМ+пенал — без шкафного doorKind gate. */
function _pendingSkipsZoneDoorKindGate(pendingPk) {
  return (
    pendingPk === PLACEMENT_KIND.STANDALONE_FLOOR ||
    isWallHungPlacementKind(pendingPk) ||
    isKitchenBasePlacementKind(pendingPk) ||
    isKitchenTallPlacementKind(pendingPk) ||
    // НШ1/НШ2 / любой mid-навес рядом с ВМУ — не switch catalog по doorKind.
    _isPendingKitchenWallBandModule()
  );
}

function commitGhostSnap(worldPos, wallName, rotationY, zoneSize, afterScaleFn) {
  const zoneDoor = state._pendingZoneInfo?.doorKind;
  const underBay = _pendingZoneIsUnderWindowBay();
  const pendingPk = resolvePlacementKind(state.pendingFurnitureData);
  // Bay: только standalone; шкаф не сажаем (каталог одн./дву. не переключаем).
  if (underBay && pendingPk !== PLACEMENT_KIND.STANDALONE_FLOOR) {
    state._ghostZonePlacementAllowed = false;
    state._catalogSwitchDoorKindOnRelease = null;
    if (typeof afterScaleFn === 'function') afterScaleFn();
    if (state.furnitureGhost) {
      state.furnitureGhost.position.copy(worldPos);
      state.furnitureGhost.visible = true;
      state.furnitureGhost.userData.wall = wallName;
      state.furnitureGhost.userData.rotation = rotationY;
      if (zoneSize) state.furnitureGhost.userData.zoneSize = zoneSize;
      state.furnitureGhost.userData.placementTarget = 'section_niche';
    }
    state.ghostWall = null;
    state.ghostPosition = null;
    state.lastValidGhostPosition = null;
    state.lastValidGhostWall = null;
    return true;
  }
  // Bay / : ./.  . tall     .
  const skipDoorGate = _pendingSkipsZoneDoorKindGate(pendingPk);
  const zi = state._pendingZoneInfo;
  const secForGate =
    zi?.sectionId != null && Array.isArray(state.customSections)
      ? state.customSections.find((s) => s && s.id === zi.sectionId)
      : null;
  let canPlace =
    skipDoorGate ||
    !zoneDoor ||
    isZoneCompatibleWithPendingModule(zoneDoor, secForGate, zi?.zoneIndex);
  // НШ1/НШ2: угловая MID + сосед — всегда можно (не только ВМУ catalog_54).
  const wallBandOk = _allowsKitchenWallOnLSpecial(state.pendingFurnitureData);
  if (wallBandOk) {
    canPlace = true;
  }
  // Спец L/U низа: только НМУ. НШ1/НШ2 в угол и соседом — не резать.
  if (
    !isPendingLCornerCabinet() &&
    !wallBandOk &&
    secForGate &&
    zi?.zoneIndex != null &&
    typeof getLShapeSpecialZoneIndex === 'function'
  ) {
    const spZi = getLShapeSpecialZoneIndex(secForGate);
    const spAll =
      typeof getLShapeSpecialZoneIndices === 'function'
        ? getLShapeSpecialZoneIndices(secForGate)
        : spZi != null
          ? [spZi]
          : [];
    const ziN = Math.floor(Number(zi.zoneIndex));
    if (
      (spZi != null && ziN === Number(spZi)) ||
      (Array.isArray(spAll) && spAll.some((z) => Number(z) === ziN))
    ) {
      canPlace = false;
    }
  }
  // Угловой: без секций — свободно к стене; с секциями — только спец-ячейка.
  if (isPendingLCornerCabinet()) {
    const freeWall =
      state.kitchenSectionsEnabled === false ||
      !(state.customSections || []).length;
    if (freeWall) {
      canPlace = true;
      try {
        const prev = window.__cldLCornerLastGhostReason;
        if (prev !== 'free-wall' || window.__cldLCornerVerbose === true) {
          window.__cldLCornerLastGhostReason = 'free-wall';
          console.warn('[L-CORNER] commitGhostSnap', {
            reason: 'free-wall',
            canPlace: true,
          });
        }
      } catch (_) {}
    } else {
      let pairPrimary = null;
      try {
        if (secForGate?.lShape) {
          pairPrimary = getLShapePairForSection(secForGate)?.primary || null;
        }
      } catch (_) {}
      const specialSec = pairPrimary || secForGate;
      const specialZi = specialSec ? resolvePendingCornerSpecialZi(specialSec) : null;
      const onPrimary =
        !!specialSec &&
        !!secForGate &&
        String(specialSec.id) === String(secForGate.id);
      const onLSpecial =
        specialZi != null &&
        zi?.zoneIndex != null &&
        Number(zi.zoneIndex) === Number(specialZi) &&
        onPrimary;
      canPlace = !!onLSpecial;
      const reason = !secForGate
        ? 'no-section'
        : specialZi == null
          ? 'specialZi-null'
          : !onPrimary
            ? 'hit-attached-not-primary'
            : Number(zi?.zoneIndex) !== Number(specialZi)
              ? `zi=${zi?.zoneIndex}!==special=${specialZi}`
              : canPlace
                ? 'ok'
                : 'blocked';
      try {
        const prev = window.__cldLCornerLastGhostReason;
        if (prev !== reason || window.__cldLCornerVerbose === true) {
          window.__cldLCornerLastGhostReason = reason;
          console.warn('[L-CORNER] commitGhostSnap', {
            reason,
            canPlace,
            zoneIndex: zi?.zoneIndex ?? null,
            specialZi,
            sectionId: zi?.sectionId ?? null,
            wall: secForGate?.wallName ?? null,
            role: secForGate?.lShape?.role ?? null,
            primaryId: pairPrimary?.id ?? null,
            doorKind: zoneDoor,
          });
        }
      } catch (_) {}
    }
  }
  state._ghostZonePlacementAllowed = canPlace;
  if (!canPlace && zoneDoor) {
    state._catalogSwitchDoorKindOnRelease = zoneDoor;
  } else {
    state._catalogSwitchDoorKindOnRelease = null;
  }
  if (typeof afterScaleFn === 'function') afterScaleFn();
  if (state.furnitureGhost) {
    state.furnitureGhost.position.copy(worldPos);
    state.furnitureGhost.visible = true;
    state.furnitureGhost.userData.wall = wallName;
    state.furnitureGhost.userData.rotation = rotationY;
    if (zoneSize) state.furnitureGhost.userData.zoneSize = zoneSize;
    state.furnitureGhost.userData.placementTarget = 'section_niche';
  }
  if (canPlace) {
    state.ghostWall = wallName;
    state.ghostPosition = worldPos.clone();
    state.lastValidGhostPosition = worldPos.clone();
    state.lastValidGhostWall = wallName;
  } else if (wallBandOk) {
    // НШ1 над спец-ячейкой: не сбрасывать pivot — иначе release отменяет place.
    state.ghostWall = wallName;
    state.ghostPosition = worldPos.clone();
    state.lastValidGhostPosition = worldPos.clone();
    state.lastValidGhostWall = wallName;
    state._ghostZonePlacementAllowed = true;
  } else if (!isPendingLCornerCabinet()) {
    state.ghostWall = null;
    state.ghostPosition = null;
    state.lastValidGhostPosition = null;
    state.lastValidGhostWall = null;
  }
  // Угловой: не сбрасывать lastValid при кратком промахе — place с lastValid.
  if (typeof window !== 'undefined' && typeof window.__cldSyncGhostClodisPrebuildContext === 'function') {
    window.__cldSyncGhostClodisPrebuildContext();
  }
  return true;
}
import {
  getNicheCabinetSlotHeightMm,
  DEFAULT_BOTTOM_PLANK_MM,
  getSlotVerticalMetrics,
  refreshSectionVerticalLayout,
  computePlacementVerticalZones,
  mergeFloorNicheVariablesFromSection,
  PLACEMENT_KIND,
  isWallHungPlacementKind,
  isWallHungLowPlacementKind,
  isWallHungHighPlacementKind,
  isKitchenBasePlacementKind,
  isKitchenTallPlacementKind,
  isKitchenWallMidPlacementKind,
  isKitchenWallTopPlacementKind,
  resolveWallHungFloorClearanceMm,
} from '../sections/vertical-layout.js?v=20261010-tall-top1';

/**     ():  ; fallback    */
function nicheSlotYOrFallback(section, rawYmm, opts = {}) {
  const slot = section && getNicheCabinetSlotHeightMm(section, opts);
  if (slot != null && slot > 0) return slot;
  const topP = section?.topPlankHeight ?? TOP_PLANK_HEIGHT_MM;
  const bRaw = Number(section?.bottomPlankHeightMm);
  const bot = Number.isFinite(bRaw) && bRaw >= 0 ? bRaw : DEFAULT_BOTTOM_PLANK_MM;
  const raw = Number(rawYmm) || 0;
  return Math.max(0, raw - topP - bot);
}

/**
 *       =    (h_bottom =   )
 * +  .        ,    .
 *    (sectionSize)       .
 */
function withNichePlinthGhostBoxY(size, section, data) {
  if (!size || !section) return size;
  if (resolvePlacementKind(data) !== PLACEMENT_KIND.FLOOR_IN_NICHE) return size;
  const y = Number(size.y) || 0;
  if (!(y > 0)) return size;
  const plinth = Math.max(0, Number(getSlotVerticalMetrics(section).bottomPlankMm) || 0);
  if (!(plinth > 0)) return size;
  return { ...size, ghostBoxYMm: y + plinth };
}

/** Сырой profile id (kitchen_tall), не mapped baseKind (floor_in_niche). */
function getRawGhostPlacementKind(data) {
  if (!data || typeof data !== 'object') return '';
  // Папка 50/51 раньше card placementKind (иначе wall_hung_* ломает MID/TOP).
  {
    const folder = _kitchenWallBandFolderId(data);
    if (folder === 'top') return 'kitchen_wall_top';
    if (folder === 'mid') return 'kitchen_wall_mid';
  }
  const pick = (v) =>
    typeof v === 'string' && v.trim() && v.trim() !== 'floor_in_niche' ? v.trim() : '';
  const fromProfile =
    pick(data.__placementKindProfileId) ||
    pick(data.placementKindProfileId) ||
    pick(data?.catalogItem?.placementKind) ||
    pick(data?.catalogItem?.placement_kind);
  if (fromProfile) return fromProfile;

  const readDataPk = (raw) => {
    if (!raw) return '';
    if (typeof raw === 'object') return pick(raw.placementKind || raw.placement_kind);
    if (typeof raw === 'string' && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        return pick(parsed?.placementKind || parsed?.placement_kind);
      } catch (_) {
        return '';
      }
    }
    return '';
  };
  const fromData =
    readDataPk(data?.catalogItem?.data) ||
    readDataPk(data?.data) ||
    pick(data.placementKind);
  return fromData;
}

function resolvePlacementKind(data) {
  // Сначала сырой kitchen_* из карточки — furnitureData.placementKind часто уже mapped.
  const catalogRaw = getRawGhostPlacementKind(data);
  if (catalogRaw) return catalogRaw;

  const raw =
    data?.placementKind ||
    data?.catalogItem?.placementKind ||
    data?.catalogItem?.data?.placementKind;
  if (typeof raw === 'string' && raw.trim() && raw.trim() !== 'floor_in_niche') return raw.trim();

  const parseFrom = (v) => {
    if (typeof v === 'object' && v) {
      const pk = v.placementKind || v.placement_kind;
      return typeof pk === 'string' && pk.trim() ? pk.trim() : '';
    }
    if (typeof v !== 'string' || !v.trim()) return '';
    try {
      const parsed = JSON.parse(v);
      const pk = parsed?.placementKind || parsed?.placement_kind;
      return typeof pk === 'string' && pk.trim() ? pk.trim() : '';
    } catch (_) {
      return '';
    }
  };
  const fromCatalogData = parseFrom(data?.catalogItem?.data);
  if (fromCatalogData && fromCatalogData !== 'floor_in_niche') return fromCatalogData;
  const fromOwnData = parseFrom(data?.data);
  if (fromOwnData && fromOwnData !== 'floor_in_niche') return fromOwnData;

  // Auto-detect: cabinet_root + plinth + corpus, no top, author height <= 1200
  let clodisArr = null;
  try {
    let pp = readClodisJSON(data) ?? readClodisJSON(data?.catalogItem);
    if (typeof pp === 'string') pp = JSON.parse(pp);
    if (Array.isArray(pp) && pp.length > 0) clodisArr = pp;
    else if (pp && typeof pp === 'object') clodisArr = [pp];
  } catch (_) {}

  if (clodisArr) {
    const roleOf = (n) => String(n?.layout_role ?? n?.sectionLayoutRole ?? '').trim();
    const findRoles = (nodes) => {
      const found = new Set();
      const stack = Array.isArray(nodes) ? [...nodes] : [];
      while (stack.length) {
        const n = stack.pop();
        if (!n || typeof n !== 'object') continue;
        const r = roleOf(n);
        if (r) found.add(r);
        if (Array.isArray(n.children)) stack.push(...n.children);
      }
      return found;
    };
    const roles = findRoles(clodisArr);
    if (roles.has('wall_hung_body')) {
      const catalogH =
        Number(data?.height) ||
        Number(data?.catalogItem?.height) ||
        Number(data?.sectionSize?.y) ||
        NaN;
      if (Number.isFinite(catalogH) && catalogH > 0 && catalogH <= 1200) {
        return PLACEMENT_KIND.WALL_HUNG_LOW;
      }
      return PLACEMENT_KIND.WALL_HUNG_HIGH;
    }
    if (
      roles.has('cabinet_root') &&
      roles.has('plinth') &&
      (roles.has('corpus') || roles.has('corpus_antresol')) &&
      !roles.has('top')
    ) {
      const root = clodisArr[0];
      const authorY = Number(root?.__cldAuthorSizeMm?.y);
      const catalogH =
        Number(data?.height) ||
        Number(data?.catalogItem?.height) ||
        Number(data?.sectionSize?.y) ||
        NaN;
      const refH = Number.isFinite(authorY) && authorY > 0 ? authorY : catalogH;
      if (Number.isFinite(refH) && refH > 0 && refH <= 1200) {
        return PLACEMENT_KIND.STANDALONE_FLOOR;
      }
    }
  }

  return PLACEMENT_KIND.FLOOR_IN_NICHE;
}

function computeLayoutZonesForSection(sectionData, pendingFurnitureData) {
  if (!sectionData) return null;
  try {
    const placementKind = resolvePlacementKind(pendingFurnitureData);
    if (placementKind === PLACEMENT_KIND.STANDALONE_FLOOR) {
      return null;
    }
    refreshSectionVerticalLayout(sectionData);
    const slotMetrics = getSlotVerticalMetrics(sectionData);
    let moduleVars = extractModuleVariablesFromFurnitureData(pendingFurnitureData);
    if (placementKind !== PLACEMENT_KIND.STANDALONE_FLOOR) {
      moduleVars = mergeFloorNicheVariablesFromSection(sectionData, moduleVars);
    }

    //   ghost     (   ),
    //      furniture-manager.
    const layoutZones = computePlacementVerticalZones(slotMetrics, {
      placementKind,
      variables: moduleVars,
    });
    if (
      typeof window !== 'undefined' &&
      window.DEBUG_COLOR_FURNITURE_PARTS === true
    ) {
      const now = Date.now();
      const last = window.__cldGhostLayoutZonesLogTs || 0;
      if (now - last > 1000) {
        window.__cldGhostLayoutZonesLogTs = now;
        console.log('[GHOST][LAYOUT-ZONES]', {
          sectionId: sectionData.id,
          slotMetrics,
          moduleVars: {
            h_bottom: moduleVars?.h_bottom,
            h_top: moduleVars?.h_top,
          },
          layoutZones,
        });
      }
    }
    return layoutZones;
  } catch (_) {
    return null;
  }
}
import { readClodisJSON, readUserDataClodisRoots, readUserDataClodisData } from '../clodis-json-fields.js?v=20261008-joint-room2';
import { getClodisDataForBuild, extractSectionSizeFromFurnitureData, getDataForBuild, extractModuleVariablesFromFurnitureData } from './furniture-clodis.js?v=20261027-nmu142g';
import {
  prepareClodisForRoomBuild,
  buildRoomDoorPrepareOpts,
  resolveDoorKindFromFurnitureData,
  resolveModuleHasSwingDoor,
} from './furniture-door-layout.js?v=20261010-kitchen-base-doors';

function ghostSectionSwingNeighborZones(sectionId) {
  const rows = [];
  if (!state.scene || sectionId == null || sectionId === '') return rows;
  state.scene.traverse((o) => {
    if (!o?.userData?.isFurniture) return;
    if (String(o.userData.sectionId) !== String(sectionId)) return;
    const zi = Number(o.userData.zoneIndex);
    if (!Number.isFinite(zi)) return;
    if (String(o.userData.doorKind || '').toLowerCase() === 'double') return;
    let hasSwing = o.userData.hasSwingDoor === true;
    if (!hasSwing && o.userData.hasSwingDoor !== false) {
      const roots = readUserDataClodisRoots(o.userData) || readUserDataClodisData(o.userData);
      hasSwing = resolveModuleHasSwingDoor({ clodisRoots: roots });
    }
    if (!hasSwing) return;
    rows.push({ zoneIndex: zi, doorKind: 'single', hasSwing: true });
  });
  return rows;
}

function ghostSwingHandCtx(section, zoneIdx) {
  const rows = ghostSectionSwingNeighborZones(section?.id);
  const zi = Number(zoneIdx);
  let ord = 0;
  if (Number.isFinite(zi)) {
    for (const n of rows) {
      if (Number(n.zoneIndex) < zi) ord += 1;
    }
  }
  return {
    swingOrdinal: ord,
    swingChainLen: rows.length + 1,
  };
}
/** Y для призрака в нише: пивот секции (геометрия цоколя внутри Clodis JSON). */
function getSectionGhostFloorWorldY(section) {
  if (!section?.group) return null;
  try {
    const y = section.group.position.y;
    if (typeof window !== 'undefined' && window.DEBUG_NICHE_Y === true) {
      const vars = extractModuleVariablesFromFurnitureData(state.pendingFurnitureData);
      console.log('[NICHE-Y] ghost floor Y', {
        sectionId: section.id,
        worldY: y,
        h_bottom_mm_inModule: vars.h_bottom,
      });
    }
    return y;
  } catch (_) {
    return null;
  }
}

/**    ( sectionSize ). */
function resolveGhostCatalogSizeMm(data) {
  const stripped = data ? Object.assign({}, data, { sectionSize: null }) : null;
  return extractSectionSizeFromFurnitureData(stripped);
}

/** kitchen_base / gola / corner / НШ1 — не ниша шкафа. */
function isKitchenBaseGhostData(data) {
  const pk = resolvePlacementKind(data);
  return (
    isKitchenBasePlacementKind(pk) ||
    isKitchenTallPlacementKind(pk) ||
    isKitchenWallMidPlacementKind(pk) ||
    isKitchenWallTopPlacementKind(pk)
  );
}

function resolveKitchenTallGhostHeightMm(data) {
  try {
    const km =
      typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
    if (!km || typeof km.resolveKitchenTallPlaceSizing !== 'function') return 0;
    const item = data?.catalogItem || data;
    let kt = data?.__kitchenTall || item?.data?.kitchenTall || item?.kitchenTall || {};
    if (typeof item?.data === 'string' && item.data.trim()) {
      try {
        const parsed = JSON.parse(item.data);
        if (parsed?.kitchenTall) kt = parsed.kitchenTall;
      } catch (_) {}
    }
    kt = kt && typeof kt === 'object' ? kt : {};
    const sizing = km.resolveKitchenTallPlaceSizing({
      facadeType: kt.facadeType || 'doors_3',
      lowerHalfOfNmMm: kt.lowerHalfOfNmMm,
      ovenNicheMm: kt.ovenNicheMm,
      microwaveNicheMm: kt.microwaveNicheMm,
    });
    return sizing?.ok ? Math.round(Number(sizing.totalHeightMm) || 0) : 0;
  } catch (_) {
    return 0;
  }
}

function _sectionDepthMmForGhost(section) {
  const wallName = String(section?.wallName || 'back').toLowerCase();
  return wallName === 'left' || wallName === 'right'
    ? Math.round(Number(section?.size?.x) || 0)
    : Math.round(Number(section?.size?.z ?? section?.size?.depth) || 0);
}

/** НШ1: H/D/floorClearance из ритма + секция/проект (каталог тянется). */
function resolveKitchenWallMidGhostSizing(section) {
  try {
    const km =
      typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
    if (!km || typeof km.resolveKitchenWallMidPlaceSizing !== 'function') {
      return null;
    }
    const secD = _sectionDepthMmForGhost(section);
    const sizing = km.resolveKitchenWallMidPlaceSizing({
      sectionDepthMm: secD > 0 ? secD : undefined,
    });
    if (!sizing || !sizing.ok) return null;
    return {
      heightMm: Math.round(Number(sizing.carcassHeightMm) || 720),
      depthMm: Math.round(Number(sizing.carcassDepthMm) || 350),
      floorClearanceMm: Math.round(Number(sizing.floorClearanceMm) || 0),
    };
  } catch (_) {
    return null;
  }
}

/** НШ2: низ = верх НШ1. */
function resolveKitchenWallTopGhostSizing(section) {
  try {
    const km =
      typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
    if (!km || typeof km.resolveKitchenWallTopPlaceSizing !== 'function') {
      return null;
    }
    const secD = _sectionDepthMmForGhost(section);
    const sizing = km.resolveKitchenWallTopPlaceSizing({
      sectionDepthMm: secD > 0 ? secD : undefined,
    });
    if (!sizing || !sizing.ok) return null;
    return {
      heightMm: Math.round(Number(sizing.carcassHeightMm) || 360),
      depthMm: Math.round(Number(sizing.carcassDepthMm) || 350),
      floorClearanceMm: Math.round(Number(sizing.floorClearanceMm) || 0),
    };
  } catch (_) {
    return null;
  }
}

/** Тумба/навес: глубина (и частично ширина) из каталога. Кухня — тоже. */
function ghostUsesModuleCatalogSize(data) {
  const pk = resolvePlacementKind(data);
  // НШ1/НШ2: D из секции/проекта, не из карточки.
  if (isKitchenWallMidPlacementKind(pk) || isKitchenWallTopPlacementKind(pk)) return false;
  return (
    pk === PLACEMENT_KIND.STANDALONE_FLOOR ||
    isWallHungPlacementKind(pk) ||
    isKitchenBasePlacementKind(pk) ||
    isKitchenTallPlacementKind(pk)
  );
}

/**
 * Высота призрака: тумба/НМ/пенал/НШ1 — своя; шкаф — ниша.
 */
function resolveGhostModuleHeightMm(data, section) {
  const nicheY = nicheSlotYOrFallback(
    section,
    section?.size?.y ?? section?.size?.height
  );
  if (!data) return nicheY;
  const pk = resolvePlacementKind(data);
  if (isKitchenTallPlacementKind(pk)) {
    return (
      resolveKitchenTallGhostHeightMm(data) ||
      Number(resolveGhostCatalogSizeMm(data).y) ||
      nicheY
    );
  }
  if (_isKitchenWallBandGhostData(data)) {
    if (_isKitchenWallTopGhostData(data)) {
      const top = resolveKitchenWallTopGhostSizing(section);
      if (top && top.heightMm > 0) return top.heightMm;
      return 360;
    }
    const mid = resolveKitchenWallMidGhostSizing(section);
    if (mid && mid.heightMm > 0) return mid.heightMm;
    return 720;
  }
  if (pk === PLACEMENT_KIND.STANDALONE_FLOOR || isKitchenBasePlacementKind(pk)) {
    return (
      resolveStandaloneGhostHeightMm(data, section) ||
      Number(resolveGhostCatalogSizeMm(data).y) ||
      nicheY
    );
  }
  if (isWallHungPlacementKind(pk)) {
    const cy = Number(resolveGhostCatalogSizeMm(data).y) || 0;
    if (cy > 0) return cy;
    const h =
      Number(data?.height) ||
      Number(data?.catalogItem?.height) ||
      0;
    return h > 0 ? h : nicheY;
  }
  return nicheY;
}

/**
 *  : / = ;  =   (1- / 2-),
 *  min(, )        .
 */
function finalizeGhostZoneSizeMm(zoneSize, data, section, wallName) {
  if (!zoneSize) return zoneSize;
  const y = resolveGhostModuleHeightMm(data, section);
  const out = {
    x: Number(zoneSize.x) || 0,
    y: y > 0 ? y : Number(zoneSize.y) || 0,
    z: Number(zoneSize.z) || 0,
  };
  // НШ1/НШ2: W = ячейка, D/H из ритма (~350), НЕ глубина секции/столешки.
  if (_isKitchenWallBandGhostData(data)) {
    return _forceKitchenWallBandZoneSizeMm(out, data, section);
  }
  if (!ghostUsesModuleCatalogSize(data)) return out;
  const catalog = resolveGhostCatalogSizeMm(data);
  const cz = Number(catalog.z) || 0;
  const cx = Number(catalog.x) || 0;
  // Глубина из каталога (тумба / навес / kitchen_base / пенал).
  if (cz > 0) out.z = cz;
  // Кухня (Cell Engine): ширина = ячейка; если зона ещё не задана — каталог.
  if (isKitchenBaseGhostData(data)) {
    const pk = resolvePlacementKind(data);
    if (cx > 0 && !(out.x > 0)) out.x = cx;
    // Пенал: не схлопывать в тонкую полоску при битом zoneWidth.
    if (isKitchenTallPlacementKind(pk) && cx > 0 && out.x > 0 && out.x < 100) {
      out.x = cx;
    }
    if (!(out.y > 100) && y > 0) out.y = y;
    if (!(out.z > 100) && cz > 0) out.z = cz;
  }
  return out;
}

/**
 *  Y  :  ;    +floorClearance;     .
 */
function getGhostPivotWorldY(section, data) {
  const floorY = getSectionGhostFloorWorldY(section);
  if (floorY == null) return null;
  if (!data || !section) return floorY;
  const pk = resolvePlacementKind(data);
  // ВМУ (54): высота как НШ1 / MID — не у пола.
  if (isPendingWallCornerCabinet() || _isKitchenWallBandGhostData(data)) {
    if (_isKitchenWallTopGhostData(data) && !isPendingWallCornerCabinet()) {
      // Не ceiling-якорь шкафа: низ = верх НШ1.
      const top = resolveKitchenWallTopGhostSizing(section);
      const clr =
        top && top.floorClearanceMm > 0 ? top.floorClearanceMm : 2140;
      return floorY + Math.max(0, clr);
    }
    const mid = resolveKitchenWallMidGhostSizing(section);
    const clr =
      mid && mid.floorClearanceMm > 0
        ? mid.floorClearanceMm
        : resolveWallHungFloorClearanceMm(null, section);
    return floorY + Math.max(0, clr);
  }
  if (isWallHungLowPlacementKind(pk)) {
    try {
      refreshSectionVerticalLayout(section);
    } catch (_) {}
    // Ghost   userData    /  300.
    return floorY + Math.max(0, resolveWallHungFloorClearanceMm(null, section));
  }
  if (isWallHungHighPlacementKind(pk)) {
    try {
      refreshSectionVerticalLayout(section);
    } catch (_) {}
    const m = getSlotVerticalMetrics(section);
    const bodyH = Math.max(1, resolveGhostModuleHeightMm(data, section) || 0);
    const topY =
      floorY +
      Math.max(0, Number(m.rawHeightMm) || 0) -
      Math.max(0, Number(m.topPlankMm) || 0) -
      Math.max(0, Number(m.ceilingClearanceMm) || 0);
    return topY - bodyH;
  }
  return floorY;
}

function isProfileFixedHeightModule(data) {
  const pk = resolvePlacementKind(data);
  if (
    pk === PLACEMENT_KIND.STANDALONE_FLOOR ||
    isKitchenBasePlacementKind(pk) ||
    isKitchenTallPlacementKind(pk)
  ) {
    return true;
  }
  try {
    const cfg =
      typeof window !== 'undefined' && typeof window.getRoomStepsConfig === 'function'
        ? window.getRoomStepsConfig()
        : null;
    const api = typeof window !== 'undefined' ? window.__cldPlacementKindProfiles : null;
    if (api && typeof api.placementKindHasBehavior === 'function') {
      return api.placementKindHasBehavior(pk, 'fixedHeight', cfg);
    }
  } catch (_) {}
  return false;
}

function resolveStandaloneGhostHeightMm(data, section) {
  if (!isProfileFixedHeightModule(data)) return 0;
  const catalogType = String(
    data?.catalogType ||
      data?.catalogItem?.catalog_type ||
      data?.catalogItem?.catalogType ||
      data?.catalogItem?.type ||
      ''
  ).trim();
  const clampSlot = (h) => {
    const n = Math.round(Number(h) || 0);
    if (!(n > 0)) return 0;
    if (
      section &&
      typeof window.__cldClampStandaloneHeightToWindowSlot === 'function'
    ) {
      return Math.round(window.__cldClampStandaloneHeightToWindowSlot(section, n)) || n;
    }
    return n;
  };
  //  2:        .
  if (
    section &&
    typeof window.__cldGetWindowRowRef === 'function' &&
    window.__cldGetWindowRowRef(section) &&
    typeof window.__cldResolveWindowRowPlaceHeightMm === 'function'
  ) {
    let own = 0;
    if (typeof window.__cldGetCatalogOwnStandaloneHeightMm === 'function') {
      own = Number(window.__cldGetCatalogOwnStandaloneHeightMm(data)) || 0;
    }
    const rowH = Number(
      window.__cldResolveWindowRowPlaceHeightMm(section, catalogType || null, own)
    );
    if (rowH > 0) return clampSlot(rowH);
  }
  //   : map     .
  if (
    section &&
    catalogType &&
    typeof window.__cldGetStandaloneHeightFromMapOnlyInGroup === 'function'
  ) {
    const stored = Number(
      window.__cldGetStandaloneHeightFromMapOnlyInGroup(section, catalogType)
    );
    if (stored > 0) return clampSlot(stored);
  }
  //  map        fallback   .
  if (section && catalogType && typeof window.__cldGetStandaloneHeightFromMapOnly === 'function') {
    const stored = Number(window.__cldGetStandaloneHeightFromMapOnly(section, catalogType));
    if (stored > 0) return clampSlot(stored);
  }
  //    .
  if (
    section &&
    typeof window.__cldGetExistingStandaloneHeightInWindowAlongGroup === 'function'
  ) {
    const groupH = Number(
      window.__cldGetExistingStandaloneHeightInWindowAlongGroup(section)
    );
    if (groupH > 0) return clampSlot(groupH);
  }
  //    :    (  bay).
  if (
    section &&
    typeof window.__cldGetWindowAlongGroupSillStandaloneHeightMm === 'function'
  ) {
    const sillH = Number(window.__cldGetWindowAlongGroupSillStandaloneHeightMm(section));
    if (sillH > 0) return clampSlot(sillH);
  }
  if (typeof window.__cldGetCatalogOwnStandaloneHeightMm === 'function') {
    const own = Number(window.__cldGetCatalogOwnStandaloneHeightMm(data));
    if (own > 0) return clampSlot(own);
  }
  const pk = resolvePlacementKind(data);
  try {
    const cfg =
      typeof window !== 'undefined' && typeof window.getRoomStepsConfig === 'function'
        ? window.getRoomStepsConfig()
        : null;
    const api = typeof window !== 'undefined' ? window.__cldPlacementKindProfiles : null;
    if (api && typeof api.getProfileFixedHeightMm === 'function') {
      const ph = api.getProfileFixedHeightMm(pk, cfg);
      if (ph > 0) return clampSlot(ph);
    }
  } catch (_) {}
  //    sectionSize  
  const stripped = data ? Object.assign({}, data, { sectionSize: null }) : null;
  const catalogY = extractSectionSizeFromFurnitureData(stripped).y;
  if (catalogY > 0) return clampSlot(catalogY);
  return 0;
}

/**
 * Start furniture placement mode
 * @param {Object} furnitureData - Furniture configuration data
 */
/**
 *         .
 */
function resizeFurnitureGhostBox(ghostGroup, size, logicalSize = null) {
  const ghostMesh = ghostGroup.children.find((c) => c.isMesh && c.name === 'GhostBox');
  if (!ghostMesh) return false;
  ghostMesh.geometry.dispose();
  ghostMesh.geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  ghostMesh.position.set(size.x / 2, size.y / 2, size.z / 2);
  const logical = logicalSize || size;
  ghostGroup.userData.currentSectionSize = {
    x: logical.x,
    y: logical.y,
    z: logical.z,
  };
  if (typeof window !== 'undefined' && typeof window.__cldInvalidateGhostClodisPrebuild === 'function') {
    window.__cldInvalidateGhostClodisPrebuild();
  }
  // Ресайз короба → пересобрать Clodis под новый габарит (debounce в manager).
  if (typeof window !== 'undefined' && typeof window.__cldScheduleGhostClodisPrebuild === 'function') {
    window.__cldScheduleGhostClodisPrebuild();
  }
  return true;
}

export function startFurniturePlacement(furnitureData) {
  console.log('🚀🚀🚀 startFurniturePlacement ВЫЗВАН 🚀🚀🚀');
  // Stamp НШ1/НШ2 до любого snap — иначе mapped wall_hung + sectionSize.z=550.
  if (furnitureData && typeof furnitureData === 'object') {
    _ensureKitchenWallBandStamp(furnitureData);
  }
  state.pendingFurnitureData = furnitureData;
  state.isPlacingFurniture = true;
  state.lastValidGhostPosition = null;
  state.lastValidGhostWall = null;
  window._ghostMoveCount = 0;
  window._ghostUpdateCount = 0;

  // Пенал / НШ1: сразу H/D из ритма (не ждать hover секции).
  let initialSize = null;
  try {
    const pk = resolvePlacementKind(furnitureData);
    if (isKitchenTallPlacementKind(pk)) {
      const cat = resolveGhostCatalogSizeMm(furnitureData);
      const tallH = resolveKitchenTallGhostHeightMm(furnitureData);
      initialSize = {
        x: Math.max(1, Math.round(Number(cat.x) || Number(furnitureData?.width) || 600)),
        y: Math.max(
          1,
          Math.round(tallH || Number(cat.y) || Number(furnitureData?.height) || 2100)
        ),
        z: Math.max(1, Math.round(Number(cat.z) || Number(furnitureData?.depth) || 550)),
      };
      furnitureData.sectionSize = { ...initialSize };
      console.log('[KITCHEN-TALL] ghost start size', initialSize);
    } else if (
      isPendingWallCornerCabinet() ||
      _isKitchenWallBandGhostData(furnitureData)
    ) {
      const cat = resolveGhostCatalogSizeMm(furnitureData);
      const isTop =
        !isPendingWallCornerCabinet() && _isKitchenWallTopGhostData(furnitureData);
      const sized = isTop
        ? resolveKitchenWallTopGhostSizing(null)
        : resolveKitchenWallMidGhostSizing(null);
      initialSize = {
        x: Math.max(
          1,
          Math.round(
            isPendingWallCornerCabinet()
              ? 600
              : Number(cat.x) || Number(furnitureData?.width) || 600
          )
        ),
        y: Math.max(
          1,
          Math.round(
            (sized && sized.heightMm) || (isTop ? 360 : 720)
          )
        ),
        z: Math.max(1, Math.round((sized && sized.depthMm) || 350)),
      };
      furnitureData.sectionSize = { ...initialSize };
      console.log(
        isPendingWallCornerCabinet()
          ? '[KITCHEN-WALL-CORNER] ghost start size'
          : isTop
            ? '[KITCHEN-WALL-TOP] ghost start size'
            : '[KITCHEN-WALL-MID] ghost start size',
        initialSize,
        { floorClearanceMm: sized && sized.floorClearanceMm }
      );
    }
  } catch (e) {
    console.warn('[KITCHEN] ghost start size failed', e);
  }
  createFurnitureGhost(furnitureData, initialSize);

  if (state.renderer) {
    const pr = getRoomRenderPixelRatio();
    state.renderer.setPixelRatio(pr);
    const container = document.getElementById('canvas-container');
    if (container) {
      state.renderer.setSize(container.clientWidth, container.clientHeight, false);
    }
  }
  console.log('[ОТЛАДКА] ✅ startFurniturePlacement — isPlacingFurniture=true, ghost=', !!state.furnitureGhost);
  if (typeof window !== 'undefined' && typeof window.__cldSyncPlacementTargetPillsVisibility === 'function') {
    window.__cldSyncPlacementTargetPillsVisibility();
  }
}

function resolveGhostSlotWidthMm(zoneX, catalogX, furnitureData) {
  const zx = Number(zoneX) || 0;
  const cx = Number(catalogX) || 0;
  // НШ1/НШ2: тянется на ширину ячейки.
  if (_isKitchenWallBandGhostData(furnitureData)) {
    return zx > 0 ? zx : cx;
  }
  // Кухня НМ/пенал: ширина карточки, внутри зоны (не растягивать до зоны).
  if (isKitchenBaseGhostData(furnitureData)) {
    if (zx > 0 && cx > 0) return Math.min(zx, cx);
    return cx > 0 ? cx : zx;
  }
  // Тумба/навес: ширина слота зоны (1/2 и т.п.).
  if (ghostUsesModuleCatalogSize(furnitureData) && zx > 0) return zx;
  // Шкаф в нише: min(зона, каталог).
  if (zx > 0 && cx > 0) return Math.min(zx, cx);
  return zx > 0 ? zx : cx;
}

/**
 * Create furniture ghost for preview
 * @param {Object} furnitureData - Furniture configuration
 * @param {Object} sectionSizeOverride - Optional size override {x, y, z}
 */
export function createFurnitureGhost(
  furnitureData,
  sectionSizeOverride = null,
  layoutZones = null
) {
  // layoutZones больше не нужны для превью (без ClodisBuilder) — оставлен для совместимости API.
  void layoutZones;

  //  :       .
  if (state.furnitureGhost && sectionSizeOverride) {
    const zx = Number(sectionSizeOverride.x);
    const zy = Number(sectionSizeOverride.y);
    const zz = Number(sectionSizeOverride.z);
    if (zx > 0 && zy > 0 && zz > 0) {
      const catalogSize = extractSectionSizeFromFurnitureData(furnitureData);
      const cx = Number(catalogSize.x) > 0 ? Number(catalogSize.x) : zx;
      const boxY = Number(sectionSizeOverride.ghostBoxYMm) > 0
        ? Number(sectionSizeOverride.ghostBoxYMm)
        : zy;
      const wx = resolveGhostSlotWidthMm(zx, cx, furnitureData);
      const logical = new THREE.Vector3(wx, zy, zz);
      const size = new THREE.Vector3(logical.x, boxY, zz);
      const cur = state.furnitureGhost.userData.currentSectionSize;
      const sizeKey = `${logical.x}_${logical.y}_${logical.z}`;
      const curKey = cur ? `${cur.x}_${cur.y}_${cur.z}` : null;
      if (sizeKey === curKey) return;
      if (resizeFurnitureGhostBox(state.furnitureGhost, size, logical)) return;
    }
  }

  if (state.furnitureGhost) {
    removeFurnitureGhost(false);
  }

  // Размеры секции: из override или из данных каталога (как в legacy main.js)
  const catalogSize = extractSectionSizeFromFurnitureData(furnitureData);
  const sectionSize = sectionSizeOverride || catalogSize;
  if (sectionSizeOverride) {
    console.log('📐 Призрак масштабирован под размеры секции:', sectionSize);
  }

  //  layoutZones   (    ),   
  // из sectionSize каталога — не строим через ClodisBuilder, иначе подсекции с role
  // (corpus с pos.y = h_bottom) сдвигают bbox вверх и призрак становится огромным.
  let size;
  /**    ( )    ,    . */
  let logicalSize = null;
  // В случаях, когда layoutZones == null, bbox строить неоткуда — используем
  // "логический bbox" призрака: от (0,0,0) до (size.x,size.y,size.z).
  let bboxMin = new THREE.Vector3(0, 0, 0);
  let bboxMax = null;

  //  :      ();   min(, ).
  const zoneOk =
    sectionSizeOverride &&
    Number(sectionSizeOverride.x) > 0 &&
    Number(sectionSizeOverride.y) > 0 &&
    Number(sectionSizeOverride.z) > 0;

  if (zoneOk) {
    const zx = Number(sectionSizeOverride.x);
    const zy = Number(sectionSizeOverride.y);
    const zz = Number(sectionSizeOverride.z);
    const catalogSize = extractSectionSizeFromFurnitureData(
      furnitureData ? Object.assign({}, furnitureData, { sectionSize: null }) : null
    );
    const cx = Number(catalogSize.x) > 0 ? Number(catalogSize.x) : zx;
    const cz = Number(catalogSize.z) > 0 ? Number(catalogSize.z) : zz;
    const wx = resolveGhostSlotWidthMm(zx, cx, furnitureData);
    const boxY =
      Number(sectionSizeOverride.ghostBoxYMm) > 0
        ? Number(sectionSizeOverride.ghostBoxYMm)
        : zy;
    // НШ1/НШ2: только override/ритм (≤450), никогда каталог/секция 550–600.
    let depthMm = zz;
    if (_isKitchenWallBandGhostData(furnitureData)) {
      depthMm = zz > 0 && zz <= 450 ? zz : 350;
    } else if (ghostUsesModuleCatalogSize(furnitureData) && cz > 0) {
      depthMm = cz;
    }
    size = new THREE.Vector3(wx, boxY, depthMm);
    logicalSize = { x: wx, y: zy, z: depthMm };
    bboxMax = size.clone();
    console.log('👻 Призрак (ниша): ширина слота по X, слот по Y/Z', {
      zone: { x: zx, y: zy, z: zz },
      catalog: catalogSize,
      ghostBox: size,
      placementKind: resolvePlacementKind(furnitureData),
      wallBand: furnitureData?.__kitchenWallBand || null,
    });
  } else {
    size = new THREE.Vector3(
      Number(sectionSize.x) || 600,
      Number(sectionSize.y) || 2400,
      Number(sectionSize.z) || 600
    );
    bboxMax = size.clone();
    console.log('👻 Призрак: размер из каталога (без ClodisBuilder)', size);
  }

  // Create ghost as a group so we can add pivot marker
  const ghostGroup = new THREE.Group();
  ghostGroup.name = 'FurnitureGhost';
  ghostGroup.visible = false;
  ghostGroup.userData.isGhost = true;

  // Create box as ghost with correct dimensions
  const ghostGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const ghostMaterial = new THREE.MeshStandardMaterial({
    color: 0x00aaff, // Blue color (like IKEA)
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    emissive: 0x0066cc,
    emissiveIntensity: 0.3,
  });

  const ghostMesh = new THREE.Mesh(ghostGeometry, ghostMaterial);
  ghostMesh.name = 'GhostBox';
  // BoxGeometry      (0,0,0)
  //     ,         (0,0,0) 
  ghostMesh.position.set(size.x / 2, size.y / 2, size.z / 2);
  console.log('👻 Призрак: смещение меша для pivot в (0,0,0):', {
    bboxMin: bboxMin.clone(),
    bboxMax: bboxMax ? bboxMax.clone() : size.clone(),
    size: size,
    meshPosition: ghostMesh.position.clone()
  });
  ghostGroup.add(ghostMesh);

  // Pivot    (0,0,0),   .
  const pivotMarker = new THREE.Object3D();
  pivotMarker.name = 'PivotMarker';
  pivotMarker.position.set(0, 0, 0);
  ghostGroup.add(pivotMarker);

  state.furnitureGhost = ghostGroup;
  state.furnitureGhost.userData.currentSectionSize = logicalSize
    ? { ...logicalSize }
    : sectionSize;
  state.furnitureGhost.userData.originalFurnitureData = furnitureData;
  state.scene.add(state.furnitureGhost);

  console.log('👻 Призрак мебели создан:', size);
  if (sectionSizeOverride) {
    console.log('📐 Призрак масштабирован под размеры секции:', sectionSize);
  }
  if (typeof window !== 'undefined' && typeof window.__cldScheduleGhostClodisPrebuild === 'function') {
    window.__cldScheduleGhostClodisPrebuild();
  }
}

/**
 * Remove furniture ghost from scene
 */
export function removeFurnitureGhost(restorePixelRatio = true) {
  if (state.furnitureGhost) {
    state.scene.remove(state.furnitureGhost);
    state.furnitureGhost.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    state.furnitureGhost = null;
  }
  disposeTempLCornerGhost();
  state.ghostWall = null;
  state.ghostPosition = null;
  if (restorePixelRatio && state.renderer) {
    const pr = getRoomRenderPixelRatio();
    state.renderer.setPixelRatio(pr);
    const container = document.getElementById('canvas-container');
    if (container) {
      state.renderer.setSize(container.clientWidth, container.clientHeight, false);
    }
  }
}

/**
 * Update furniture ghost position based on mouse movement
 * This is a large function that handles wall detection, positioning, and section scaling
 * @param {MouseEvent} event - Mouse event
 */
export function updateFurnitureGhostPosition(event) {
  if (!window._ghostUpdateCount) window._ghostUpdateCount = 0;
  window._ghostUpdateCount++;
  if (event) state._lastGhostMouseEvent = event;

  try {

  // Ниже, когда успешно привязываемся к зоне секции, заполним state._pendingZoneInfo.
  state._pendingZoneInfo = null;

  const canvas = state.renderer.domElement;
  const rect = canvas.getBoundingClientRect();

  // Mouse coordinates in normalized coordinates (-1 to +1)
  state.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  state.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // Raycasting
  state.raycaster.setFromCamera(state.mouse, state.camera);

  // Get wall planes from room
  if (!state.room || !state.room.wallPlanes) {
    if (window._ghostUpdateCount <= 5) console.log('[ОТЛАДКА ghost] нет room или wallPlanes', { room: !!state.room, wallPlanes: state.room?.wallPlanes?.length });
    return;
  }

  // Only check visible walls
  const visiblePlanes = state.room.wallPlanes.filter(p => {
    if (p.visible === false) return false;
    const wallName = p.userData.wallName;
    if (state.room.walls && state.room.walls[wallName]) {
      return state.room.walls[wallName].visible !== false;
    }
    return true;
  });

  // Raycast        (, , )  
  const sectionGroups = (state.customSections || []).map(s => s.group).filter(Boolean);
  let sectionHit = null;
  if (sectionGroups.length > 0) {
    const sh = state.raycaster.intersectObjects(sectionGroups, true);
    //         ,  
    //   :       .
    sectionHit = sh.find((h) => !isEndCabinetPartObject(h.object)) || null;
  }

  //     :   ,    .
  const endCabSlotHit = pickEndCabinetSlotFromRaycaster(state.raycaster);
  const overEndCabSlot =
    !!endCabSlotHit && (!sectionHit || endCabSlotHit.distance <= sectionHit.distance);
  const draggingEndCabModule = isEndCabinetCatalogModule(state.pendingFurnitureData);

  if (overEndCabSlot || draggingEndCabModule) {
    setEndCabinetSlotHighlight(overEndCabSlot, {
      sectionId: endCabSlotHit?.sectionId,
      side: endCabSlotHit?.side,
    });
    if (state.furnitureGhost) state.furnitureGhost.visible = false;
    if (state.room?.resetWallHighlight) state.room.resetWallHighlight();
    if (state.room?.hideAllMarkers) state.room.hideAllMarkers();
    state._pendingZoneInfo = null;

    if (overEndCabSlot && draggingEndCabModule) {
      //           .
      setPendingEndCabinetPlacement({
        sectionId: endCabSlotHit.sectionId,
        side: endCabSlotHit.side,
        catalogType: endCabSlotHit.catalogType,
      });
      state._ghostZonePlacementAllowed = true;
      state._endCabReleaseAction = null;
    } else if (overEndCabSlot) {
      //           .
      state._ghostZonePlacementAllowed = false;
      state._endCabReleaseAction = { kind: 'openEndCabinetCatalog', slot: endCabSlotHit };
    } else if (sectionHit) {
      //         .
      state._ghostZonePlacementAllowed = false;
      state._endCabReleaseAction = { kind: 'openRegularCatalog' };
    } else {
      //    /   .
      state._ghostZonePlacementAllowed = false;
      state._endCabReleaseAction = null;
    }
    return;
  }
  state._endCabReleaseAction = null;
  //       :    , 
  //     ,         .
  setEndCabinetSlotHighlight(false);

  const wallIntersects = state.raycaster.intersectObjects(visiblePlanes);
  let wallIntersect = null;
  if (wallIntersects.length > 0) {
    let maxDist = -1;
    for (let i = 0; i < wallIntersects.length; i++) {
      if (wallIntersects[i].distance > maxDist) {
        maxDist = wallIntersects[i].distance;
        wallIntersect = wallIntersects[i];
      }
    }
  }

  // :  (  ),  .
  const useSection =
    sectionHit &&
    (!wallIntersect || sectionHit.distance <= wallIntersect.distance);

  if (useSection && sectionHit) {
    const hitPoint = sectionHit.point.clone();
    let section = state.customSections.find(s => {
      let obj = sectionHit.object;
      while (obj && obj !== s.group) obj = obj.parent;
      return obj === s.group;
    });
      if (section) {
      let zoneSnap = null;
      // Угловой НМ: не цепляться к attached / соседней ячейке — только спец primary.
      const cornerTarget = resolveCornerCabinetLTarget(section);
      if (cornerTarget) {
        section = cornerTarget.section;
      }
      const wallName = section.wallName || section.division?.wallName || 'back';
      const resolvedWallName = section.wallName || section.division?.wallName || wallName;
      const rotationY = wallName === 'front' ? Math.PI : wallName === 'left' ? Math.PI / 2 : wallName === 'right' ? -Math.PI / 2 : 0;
      // Всегда есть fallback — иначе NaN/undefined → призрак невидим, wall=null.
      let worldPos = hitPoint.clone();
      let zoneSize = null;
      //    snap    doorKind →  .
      if (
        state._pendingZoneInfo &&
        String(state._pendingZoneInfo.sectionId) !== String(section.id)
      ) {
        state._pendingZoneInfo = null;
      }
      if (section.division) {
        const division = section.division;
        const hitCoord = (resolvedWallName === 'front' || resolvedWallName === 'back') ? hitPoint.x : hitPoint.z;
        let snap = cornerTarget
          ? cornerTarget.snap
          : snapToZoneDoubleModule(
              hitCoord,
              division,
              resolvedWallName,
              section.id
            );
        // НШ1/НШ2 на L: зона из MID/TOP, иначе hit попадает в спец низа 1050.
        if (!cornerTarget) {
          const bandSnap = resolveKitchenWallBandGhostSnap(
            section,
            hitCoord,
            resolvedWallName
          );
          if (bandSnap) snap = bandSnap;
        }
        if (snap) {
          //  ,     ,
          //      zoneIndex.
          state._pendingZoneInfo = {
            sectionId: section.id,
            wallName: resolvedWallName,
            zoneIndex: snap.zoneIndex,
            doorKind: getZoneDoorKind(section, snap.zoneIndex),
            hitAlongMm: hitCoord,
            ...(snap.companion
              ? {
                  upperCornerCompanion: true,
                  upperCornerCellId: snap.upperCornerCellId || null,
                  companionStartU: snap.companionStartU,
                  companionEndU: snap.companionEndU,
                  companionSpannedZones: Array.isArray(
                    snap.companionSpannedZones
                  )
                    ? snap.companionSpannedZones.slice()
                    : [],
                  companionAnchorEdge: snap.companionAnchorEdge || null,
                  companionModuleWidth: snap.moduleWidth,
                }
              : {
                  upperCornerCompanion: false,
                }),
          };
          _triggerAutoSwitchForZone(section, snap.zoneIndex);
          const key = `${section.id}|${resolvedWallName}`;
          const last = window.__lastZoneGhostSnap || {};
          if (!last[key] || last[key] !== snap.zoneIndex) {
            window.__lastZoneGhostSnap = { ...(window.__lastZoneGhostSnap || {}), [key]: snap.zoneIndex };
            console.log('[ZONE-GHOST] sectionHit', {
              sectionId: section.id,
              sectionName: section.name,
              wallName: resolvedWallName,
              zoneIndex: snap.zoneIndex,
              companion: !!snap.companion,
              hitCoord,
              division: {
                sectionStart: division.sectionStart,
                sectionEnd: division.sectionEnd,
                partSize: division.partSize,
                parts: division.parts,
              },
            });
          }
        }
        if (snap) {
          const sy = resolveGhostModuleHeightMm(state.pendingFurnitureData, section);
          const depthForZone =
            resolvedWallName === 'left' || resolvedWallName === 'right'
              ? section.size.x
              : (section.size.z ?? section.size.depth);
          const wallCornerGhost =
            isPendingWallCornerCabinet() || cornerTarget?.wallCorner === true;
          let zoneSizeDraft;
          if (_isPendingKitchenWallBandModule() || wallCornerGhost) {
            const midSized = resolveKitchenWallMidGhostSizing(section);
            zoneSizeDraft = _forceKitchenWallBandZoneSizeMm(
              {
                x: wallCornerGhost
                  ? Math.min(600, snap.moduleWidth || 600)
                  : snap.moduleWidth,
                y: (midSized && midSized.heightMm) || sy || 720,
                z: (midSized && midSized.depthMm) || 350,
              },
              state.pendingFurnitureData,
              section
            );
            if (wallCornerGhost) {
              zoneSizeDraft = {
                ...zoneSizeDraft,
                x: Math.max(50, Math.round(Number(snap.moduleWidth) || 600)),
                z: Math.max(50, Math.round((midSized && midSized.depthMm) || 350)),
                y: Math.max(50, Math.round((midSized && midSized.heightMm) || 720)),
              };
            }
          } else {
            zoneSizeDraft = finalizeGhostZoneSizeMm(
              { x: snap.moduleWidth, y: sy, z: depthForZone },
              state.pendingFurnitureData,
              section,
              resolvedWallName
            );
          }
          // Угловой НМ: не давать Maatkasten half/merge сбить specialZi.
          // НШ1/НШ2: не раздувать в спец низа 1050 — ширина = ячейка MID.
          let cell = { snap, worldPos: null, zoneSize: zoneSizeDraft };
          if (
            !cornerTarget &&
            !_isPendingKitchenWallBandModule() &&
            !wallCornerGhost
          ) {
            cell = applyMaatkastenStraightGhostCellSnap(
              section,
              resolvedWallName,
              hitCoord,
              snap,
              zoneSizeDraft
            );
          }
          snap = cell.snap || snap;
          const pivotPos =
            cell.worldPos ||
            getZonePivotWorldPosition(section, snap, resolvedWallName);
          if (pivotPos && Number.isFinite(pivotPos.x) && Number.isFinite(pivotPos.z)) {
            worldPos = pivotPos.clone();
          }
          zoneSize =
            _isPendingKitchenWallBandModule() || wallCornerGhost
              ? {
                  ...zoneSizeDraft,
                  ...(cell.zoneSize || {}),
                  x: Math.max(
                    50,
                    Math.round(
                      Number(snap.moduleWidth) ||
                        Number(zoneSizeDraft?.x) ||
                        600
                    )
                  ),
                  z: Math.max(50, Math.round(Number(zoneSizeDraft?.z) || 350)),
                  y: Math.max(50, Math.round(Number(zoneSizeDraft?.y) || 720)),
                }
              : finalizeGhostZoneSizeMm(
                  cell.zoneSize || zoneSizeDraft,
                  state.pendingFurnitureData,
                  section,
                  resolvedWallName
                );
          state._pendingZoneInfo = {
            sectionId: section.id,
            wallName: resolvedWallName,
            zoneIndex: snap.zoneIndex,
            doorKind: getZoneDoorKind(section, snap.zoneIndex),
            hitAlongMm: hitCoord,
            ...(snap.companion
              ? {
                  upperCornerCompanion: true,
                  upperCornerCellId: snap.upperCornerCellId || null,
                  companionStartU: snap.companionStartU,
                  companionEndU: snap.companionEndU,
                  companionSpannedZones: Array.isArray(
                    snap.companionSpannedZones
                  )
                    ? snap.companionSpannedZones.slice()
                    : [],
                  companionAnchorEdge: snap.companionAnchorEdge || null,
                  companionModuleWidth: snap.moduleWidth,
                }
              : {
                  upperCornerCompanion: false,
                }),
          };
          _triggerAutoSwitchForZone(section, snap.zoneIndex);
          zoneSnap = snap;
        } else {
          const innerSlot = resolveSectionFurniturePlacement(section, resolvedWallName);
          worldPos = innerSlot?.position
            ? innerSlot.position.clone()
            : section.group.position.clone();
          if (innerSlot?.innerWidthMm > 0) {
            zoneSize = finalizeGhostZoneSizeMm(
              {
                x: innerSlot.innerWidthMm,
                y: resolveGhostModuleHeightMm(state.pendingFurnitureData, section),
                z: innerSlot.depthMm,
              },
              state.pendingFurnitureData,
              section,
              resolvedWallName
            );
          }
        }
      } else {
        const innerSlot = resolveSectionFurniturePlacement(section, resolvedWallName);
        worldPos = innerSlot?.position
          ? innerSlot.position.clone()
          : section.group.position.clone();
        if (innerSlot?.innerWidthMm > 0) {
          zoneSize = finalizeGhostZoneSizeMm(
            {
              x: innerSlot.innerWidthMm,
              y: resolveGhostModuleHeightMm(state.pendingFurnitureData, section),
              z: innerSlot.depthMm,
            },
            state.pendingFurnitureData,
            section,
            resolvedWallName
          );
        }
      }
      {
        const yPivot = getGhostPivotWorldY(section, state.pendingFurnitureData);
        if (yPivot != null) {
          worldPos.y = yPivot;
        } else if (state.room) {
          const rwp = new THREE.Vector3();
          state.room.group.getWorldPosition(rwp);
          worldPos.y = rwp.y;
        }
      }
      if (state.pendingFurnitureData && zoneSize?.y && zoneSize?.z) {
        state.pendingFurnitureData.sectionSize = zoneSize;
      }
      if (state.furnitureGhost) {
        state.furnitureGhost.position.copy(worldPos);
        state.furnitureGhost.rotation.y = rotationY;
        state.furnitureGhost.visible = true;
        state.furnitureGhost.userData.wall = wallName;
        state.furnitureGhost.userData.rotation = rotationY;
        state.furnitureGhost.userData.zoneSize = zoneSize || undefined;
      }
      const effSectionSize = section.size
        ? {
            ...section.size,
            y: resolveGhostModuleHeightMm(state.pendingFurnitureData, section),
          }
        : null;
      const sizeToUse = finalizeGhostZoneSizeMm(
        zoneSize || effSectionSize,
        state.pendingFurnitureData,
        section,
        resolvedWallName
      );
      if (sizeToUse) {
        const currentSectionSize = state.furnitureGhost?.userData?.currentSectionSize;
        const sizeKey = `${sizeToUse.x}_${sizeToUse.y}_${sizeToUse.z}`;
        const currentSizeKey = currentSectionSize ? `${currentSectionSize.x}_${currentSectionSize.y}_${currentSectionSize.z}` : null;
        if (sizeKey !== currentSizeKey) {
          const orig =
            state.pendingFurnitureData ||
            state.furnitureGhost?.userData?.originalFurnitureData;
          if (orig) _ensureKitchenWallBandStamp(orig);
          createFurnitureGhost(
            orig,
            withNichePlinthGhostBoxY(sizeToUse, section, state.pendingFurnitureData)
          );
          if (state.furnitureGhost) {
            state.furnitureGhost.position.copy(worldPos);
            state.furnitureGhost.visible = true;
            state.furnitureGhost.userData.rotation = rotationY;
            state.furnitureGhost.userData.zoneSize = zoneSize || undefined;
          }
        }
      }
      commitGhostSnap(worldPos, wallName, rotationY, zoneSize || undefined);
      if (state.room?.highlightWall) state.room.highlightWall(wallName);
      return;
    }
  }

  const intersect = wallIntersect;
  if (intersect) {
    const wallPlane = intersect.object;
    const wallName = wallPlane.userData.wallName;

    // Check if wall is actually visible
    if (!state.room.walls || !state.room.walls[wallName]) {
      if (state.furnitureGhost) state.furnitureGhost.visible = false;
      if (state.room && state.room.resetWallHighlight) state.room.resetWallHighlight();
      if (state.room && state.room.hideAllMarkers) state.room.hideAllMarkers();
      state.ghostWall = null;
      state.ghostPosition = null;
      return;
    }
    
    const wall = state.room.walls[wallName];
    if (wall.visible === false || !wall.visible) {
      console.warn('⚠️ Стена скрыта:', wallName);
      if (state.furnitureGhost) state.furnitureGhost.visible = false;
      if (state.room && state.room.resetWallHighlight) state.room.resetWallHighlight();
      if (state.room && state.room.hideAllMarkers) state.room.hideAllMarkers();
      state.ghostWall = null;
      state.ghostPosition = null;
      return;
    }

    // Highlight the wall
    if (state.room && state.room.highlightWall) {
      state.room.highlightWall(wallName);
    }

    // Get furniture bbox
    let bbox, extent;
    if (state.pendingFurnitureData && (state.pendingFurnitureData.type === 'glb' || state.pendingFurnitureData.type === 'savedModel')) {
      bbox = state.pendingFurnitureData.bbox || new THREE.Box3();
      extent = state.pendingFurnitureData.size || new THREE.Vector3();
    } else {
      const sectionSizeClodis = extractSectionSizeFromFurnitureData(state.pendingFurnitureData);
      extent = new THREE.Vector3(
        Number(sectionSizeClodis.x) || 600,
        Number(sectionSizeClodis.y) || 2400,
        Number(sectionSizeClodis.z) || 600
      );
      bbox = new THREE.Box3(new THREE.Vector3(0, 0, 0), extent.clone());
    }

    // Position calculation
    //   /    .
    // ВАЖНО: pivot у мебели = back-left-bottom (bbox.min -> 0 после setupPivot),
    //    extent/2   pivot  .
    //    bbox:   ""   + gap.
    const gap = 2; // 2   
    const inset = 50; // 50    
    const intersectionPoint = intersect.point.clone();

    // Get room world position
    const roomWorldPos = new THREE.Vector3();
    state.room.group.getWorldPosition(roomWorldPos);

    const localIntersectionPoint = intersectionPoint.clone().sub(roomWorldPos);

    let finalX = localIntersectionPoint.x;
    let finalZ = localIntersectionPoint.z;
    let rotationY = 0;

    //   (bbox/extent)  
    const w = extent.x;
    const h = extent.y;
    const d = extent.z;

    // Calculate position based on wall (pivot = back-left-bottom)
    switch (wallName) {
      case 'front':
        rotationY = Math.PI;
        finalX = THREE.MathUtils.clamp(
          localIntersectionPoint.x,
          inset,
          state.room.width - inset - w
        );
        finalZ = state.room.depth - gap - d;
        break;

      case 'back':
        rotationY = 0;
        finalX = THREE.MathUtils.clamp(
          localIntersectionPoint.x,
          inset,
          state.room.width - inset - w
        );
        finalZ = gap;
        break;

      case 'left':
        rotationY = Math.PI / 2;
        //     Z = w,     X = d
        finalX = gap;
        finalZ = THREE.MathUtils.clamp(
          localIntersectionPoint.z,
          inset,
          state.room.depth - inset - w
        );
        break;

      case 'right':
        rotationY = -Math.PI / 2;
        //       X = d
        finalX = state.room.width - gap - d;
        finalZ = THREE.MathUtils.clamp(
          localIntersectionPoint.z,
          inset,
          state.room.depth - inset - w
        );
        break;
    }

    const floorWorldY = roomWorldPos.y;
    const furnitureY = floorWorldY;

    // Calculate marker position
    let markerX, markerZ;
    switch (wallName) {
      case 'front':
        finalZ = state.room.depth - gap;
        markerX = finalX;
        markerZ = finalZ;
        break;
      case 'back':
        finalZ = gap;
        markerX = finalX;
        markerZ = finalZ;
        break;
      case 'left':
        finalX = gap;
        markerX = finalX;
        markerZ = finalZ;
        break;
      case 'right':
        finalX = state.room.width - gap;
        markerX = finalX;
        markerZ = finalZ;
        break;
    }

    // Update marker
    if (state.room && state.room.updateWallMarker) {
      state.room.updateWallMarker(wallName, markerX, markerZ);
      Object.keys(state.room.wallMarkers || {}).forEach(key => {
        if (key !== wallName && state.room.wallMarkers[key]) {
          state.room.wallMarkers[key].visible = false;
        }
      });
    }

    // World position
    let worldPos = new THREE.Vector3(
      finalX + roomWorldPos.x,
      furnitureY,
      finalZ + roomWorldPos.z
    );

    // Pivot-to-section snap: в секции — пивот в пивот
    let zoneSize = null;
    const sectionAtPosition = findSectionAtPosition(worldPos);
    const hasSections = (state.customSections || []).length > 0;

    let zoneSnap = null;
    if (sectionAtPosition) {
      const resolvedWallName =
        sectionAtPosition.wallName || sectionAtPosition.division?.wallName || wallName;
      //       ,   
      if (sectionAtPosition.division) {
        const division = sectionAtPosition.division;
        //      (  ),  split half  .
        const hitCoord =
          resolvedWallName === 'front' || resolvedWallName === 'back'
            ? intersectionPoint.x
            : intersectionPoint.z;
        const snap0 = snapToZoneDoubleModule(
          hitCoord,
          division,
          resolvedWallName,
          sectionAtPosition.id
        );
        let snap = snap0;
        {
          const bandSnap = resolveKitchenWallBandGhostSnap(
            sectionAtPosition,
            hitCoord,
            resolvedWallName
          );
          if (bandSnap) snap = bandSnap;
        }
        if (snap) {
          let srcHeight = resolveGhostModuleHeightMm(
            state.pendingFurnitureData,
            sectionAtPosition
          );
          //  :  clamp  sill (    ).
          if (
            resolvePlacementKind(state.pendingFurnitureData) ===
              PLACEMENT_KIND.STANDALONE_FLOOR &&
            typeof window.__cldClampStandaloneHeightToWindowSlot === 'function'
          ) {
            const clamped = Number(
              window.__cldClampStandaloneHeightToWindowSlot(sectionAtPosition, srcHeight)
            );
            if (clamped > 0) srcHeight = clamped;
          }
          const srcDepth =
            resolvedWallName === 'left' || resolvedWallName === 'right'
              ? sectionAtPosition.size.x
              : (sectionAtPosition.size.z ?? sectionAtPosition.size.depth);
          const zoneSizeDraft = _isPendingKitchenWallBandModule()
            ? _forceKitchenWallBandZoneSizeMm(
                { x: snap.moduleWidth, y: srcHeight, z: srcDepth },
                state.pendingFurnitureData,
                sectionAtPosition
              )
            : finalizeGhostZoneSizeMm(
                { x: snap.moduleWidth, y: srcHeight, z: srcDepth },
                state.pendingFurnitureData,
                sectionAtPosition,
                resolvedWallName
              );
          let cell = { snap, worldPos: null, zoneSize: zoneSizeDraft };
          if (!_isPendingKitchenWallBandModule()) {
            cell = applyMaatkastenStraightGhostCellSnap(
              sectionAtPosition,
              resolvedWallName,
              hitCoord,
              snap,
              zoneSizeDraft
            );
          } else {
            cell.worldPos = getZonePivotWorldPosition(
              sectionAtPosition,
              snap,
              resolvedWallName
            );
          }
          snap = cell.snap;
          worldPos = cell.worldPos;
          zoneSize = _isPendingKitchenWallBandModule()
            ? _forceKitchenWallBandZoneSizeMm(
                cell.zoneSize,
                state.pendingFurnitureData,
                sectionAtPosition
              )
            : finalizeGhostZoneSizeMm(
                cell.zoneSize,
                state.pendingFurnitureData,
                sectionAtPosition,
                resolvedWallName
              );
          state._pendingZoneInfo = {
            sectionId: sectionAtPosition.id,
            wallName: resolvedWallName,
            zoneIndex: snap.zoneIndex,
            doorKind: getZoneDoorKind(sectionAtPosition, snap.zoneIndex),
            hitAlongMm: hitCoord,
          };
          _triggerAutoSwitchForZone(sectionAtPosition, snap.zoneIndex);
          const key = `${sectionAtPosition.id}|${resolvedWallName}`;
          const last = window.__lastZoneGhostSnap || {};
          if (!last[key] || last[key] !== snap.zoneIndex) {
            window.__lastZoneGhostSnap = { ...(window.__lastZoneGhostSnap || {}), [key]: snap.zoneIndex };
            console.log('[ZONE-GHOST] wallPlane', {
              sectionId: sectionAtPosition.id,
              sectionName: sectionAtPosition.name,
              wallName: resolvedWallName,
              zoneIndex: snap.zoneIndex,
              hitCoord,
              worldPosBeforeSnap: worldPos.clone(),
              division: {
                sectionStart: division.sectionStart,
                sectionEnd: division.sectionEnd,
                partSize: division.partSize,
                parts: division.parts,
              },
            });
          }
          if (state.pendingFurnitureData && zoneSize?.y && zoneSize?.z) {
            state.pendingFurnitureData.sectionSize = zoneSize;
          }
          zoneSnap = snap;
        } else {
          const innerSlot = resolveSectionFurniturePlacement(sectionAtPosition, resolvedWallName);
          worldPos = innerSlot?.position
            ? innerSlot.position.clone()
            : sectionAtPosition.group.position.clone();
          if (innerSlot?.innerWidthMm > 0) {
            zoneSize = finalizeGhostZoneSizeMm(
              {
                x: innerSlot.innerWidthMm,
                y: resolveGhostModuleHeightMm(state.pendingFurnitureData, sectionAtPosition),
                z: innerSlot.depthMm,
              },
              state.pendingFurnitureData,
              sectionAtPosition,
              resolvedWallName
            );
            if (state.pendingFurnitureData && zoneSize.y && zoneSize.z) {
              state.pendingFurnitureData.sectionSize = zoneSize;
            }
          }
        }
      } else {
        const innerSlot = resolveSectionFurniturePlacement(sectionAtPosition, resolvedWallName);
        worldPos = innerSlot?.position
          ? innerSlot.position.clone()
          : sectionAtPosition.group.position.clone();
        if (innerSlot?.innerWidthMm > 0) {
          zoneSize = finalizeGhostZoneSizeMm(
            {
              x: innerSlot.innerWidthMm,
              y: resolveGhostModuleHeightMm(state.pendingFurnitureData, sectionAtPosition),
              z: innerSlot.depthMm,
            },
            state.pendingFurnitureData,
            sectionAtPosition,
            resolvedWallName
          );
          if (state.pendingFurnitureData && zoneSize.y && zoneSize.z) {
            state.pendingFurnitureData.sectionSize = zoneSize;
          }
        }
      }
    } else if (hasSections) {
      //         (  ).
      if (state.furnitureGhost) state.furnitureGhost.visible = false;
      if (state.room?.resetWallHighlight) state.room.resetWallHighlight();
      if (state.room?.hideAllMarkers) state.room.hideAllMarkers();
      state.ghostWall = null;
      state.ghostPosition = null;
      state._pendingZoneInfo = null;
      return;
    }
    // else:        (  )

    if (sectionAtPosition) {
      const yPivot = getGhostPivotWorldY(sectionAtPosition, state.pendingFurnitureData);
      if (yPivot != null) worldPos.y = yPivot;
    }

    // Update ghost
    if (state.furnitureGhost) {
      state.furnitureGhost.position.copy(worldPos);
      state.furnitureGhost.rotation.y = rotationY;
      state.furnitureGhost.visible = true;
      state.furnitureGhost.userData.wall = wallName;
      state.furnitureGhost.userData.rotation = rotationY;
      state.furnitureGhost.userData.zoneSize = zoneSize || undefined;
    }

    // Check if inside a section and scale if needed (zone or full section)
    let ghostStandaloneY = resolveGhostModuleHeightMm(
      state.pendingFurnitureData,
      sectionAtPosition
    );
    if (
      resolvePlacementKind(state.pendingFurnitureData) === PLACEMENT_KIND.STANDALONE_FLOOR &&
      sectionAtPosition &&
      typeof window.__cldClampStandaloneHeightToWindowSlot === 'function'
    ) {
      const clamped = Number(
        window.__cldClampStandaloneHeightToWindowSlot(sectionAtPosition, ghostStandaloneY)
      );
      if (clamped > 0) ghostStandaloneY = clamped;
    }
    const effSectionSize = sectionAtPosition?.size
      ? {
          ...sectionAtPosition.size,
          y: ghostStandaloneY,
        }
      : null;
    const sizeToUse = finalizeGhostZoneSizeMm(
      zoneSize || effSectionSize,
      state.pendingFurnitureData,
      sectionAtPosition,
      sectionAtPosition?.wallName || wallName
    );
    if (sizeToUse) {
      const currentSectionSize = state.furnitureGhost?.userData?.currentSectionSize;
      const sizeKey = `${sizeToUse.x}_${sizeToUse.y}_${sizeToUse.z}`;
      const currentSizeKey = currentSectionSize ? `${currentSectionSize.x}_${currentSectionSize.y}_${currentSectionSize.z}` : null;
      
      if (sizeKey !== currentSizeKey) {
        console.log('📦 ПРИЗРАК В СЕКЦИИ/ЗОНЕ! Масштабируем:', zoneSize ? 'зона (двойной модуль)' : 'секция');
        const originalFurnitureData =
          state.pendingFurnitureData ||
          state.furnitureGhost?.userData?.originalFurnitureData;
        if (originalFurnitureData) {
          _ensureKitchenWallBandStamp(originalFurnitureData);
        }
        createFurnitureGhost(
          originalFurnitureData,
          withNichePlinthGhostBoxY(
            sizeToUse,
            sectionAtPosition,
            state.pendingFurnitureData
          )
        );
        
        if (state.furnitureGhost) {
          state.furnitureGhost.position.copy(worldPos);
          state.furnitureGhost.visible = true;
          state.furnitureGhost.userData.rotation = rotationY;
          state.furnitureGhost.userData.zoneSize = zoneSize || undefined;
        }
      }
    } else {
      // Ghost not in section - use original size
      const currentSectionSize = state.furnitureGhost?.userData?.currentSectionSize;
      const originalSize = state.pendingFurnitureData?.size || { x: 600, y: 2400, z: 600 };
      const currentSizeKey = currentSectionSize ? `${currentSectionSize.x}_${currentSectionSize.y}_${currentSectionSize.z}` : null;
      const originalSizeKey = `${originalSize.x}_${originalSize.y}_${originalSize.z}`;
      
      if (currentSizeKey !== originalSizeKey) {
        console.log('📦    .   ');
        const originalFurnitureData = state.furnitureGhost?.userData?.originalFurnitureData || state.pendingFurnitureData;
        createFurnitureGhost(originalFurnitureData, null, null);
        
        if (state.furnitureGhost) {
          state.furnitureGhost.position.copy(worldPos);
          state.furnitureGhost.visible = true;
          state.furnitureGhost.userData.rotation = rotationY;
        }
      }
    }
    commitGhostSnap(worldPos, wallName, rotationY, zoneSize || undefined);
    if (window._ghostUpdateCount <= 5 || window._ghostUpdateCount % 30 === 0) {
      console.log('[ОТЛАДКА ghost] позиция установлена:', {
        wall: wallName,
        pos: state.ghostPosition,
      });
    }
  } else {
    // Fallback: raycast по секциям (когда курсор над секцией — wall planes могут не дать hit)
    const sectionGroups = (state.customSections || []).map(s => s.group).filter(Boolean);
    if (sectionGroups.length > 0) {
      const sectionHits = state.raycaster.intersectObjects(sectionGroups, true);
      if (sectionHits.length > 0) {
        const hit = sectionHits[0];
        const hitPoint = hit.point.clone();
        const section = state.customSections.find(s => {
          let obj = hit.object;
          while (obj && obj !== s.group) obj = obj.parent;
          return obj === s.group;
        });
        if (section) {
          let zoneSnap = null;
          const wallName = section.wallName || section.division?.wallName || 'back';
          const rotationY = wallName === 'front' ? Math.PI : wallName === 'left' ? Math.PI / 2 : wallName === 'right' ? -Math.PI / 2 : 0;
          let worldPos = hitPoint.clone();
          let zoneSize = null;
          if (section.division) {
            const division = section.division;
            const resolvedWallName = section.wallName || division.wallName || wallName;
            const hitCoord = (resolvedWallName === 'front' || resolvedWallName === 'back') ? hitPoint.x : hitPoint.z;
            const snap0 = snapToZoneDoubleModule(
              hitCoord,
              division,
              resolvedWallName,
              section.id
            );
            let snap = snap0;
            {
              const bandSnap = resolveKitchenWallBandGhostSnap(
                section,
                hitCoord,
                resolvedWallName
              );
              if (bandSnap) snap = bandSnap;
            }
            if (snap) {
              const sy = resolveGhostModuleHeightMm(state.pendingFurnitureData, section);
              const depthForZone =
                resolvedWallName === 'left' || resolvedWallName === 'right'
                  ? section.size.x
                  : (section.size.z ?? section.size.depth);
              const zoneSizeDraft = _isPendingKitchenWallBandModule()
                ? _forceKitchenWallBandZoneSizeMm(
                    { x: snap.moduleWidth, y: sy, z: depthForZone },
                    state.pendingFurnitureData,
                    section
                  )
                : finalizeGhostZoneSizeMm(
                    { x: snap.moduleWidth, y: sy, z: depthForZone },
                    state.pendingFurnitureData,
                    section,
                    resolvedWallName
                  );
              let cell = { snap, worldPos: null, zoneSize: zoneSizeDraft };
              if (!_isPendingKitchenWallBandModule()) {
                cell = applyMaatkastenStraightGhostCellSnap(
                  section,
                  resolvedWallName,
                  hitCoord,
                  snap,
                  zoneSizeDraft
                );
              } else {
                cell.worldPos = getZonePivotWorldPosition(
                  section,
                  snap,
                  resolvedWallName
                );
              }
              snap = cell.snap;
              worldPos = cell.worldPos;
              zoneSize = _isPendingKitchenWallBandModule()
                ? _forceKitchenWallBandZoneSizeMm(
                    cell.zoneSize,
                    state.pendingFurnitureData,
                    section
                  )
                : finalizeGhostZoneSizeMm(
                    cell.zoneSize,
                    state.pendingFurnitureData,
                    section,
                    resolvedWallName
                  );
              state._pendingZoneInfo = {
                sectionId: section.id,
                wallName: resolvedWallName,
                zoneIndex: snap.zoneIndex,
                doorKind: getZoneDoorKind(section, snap.zoneIndex),
                hitAlongMm: hitCoord,
              };
              _triggerAutoSwitchForZone(section, snap.zoneIndex);
              zoneSnap = snap;
              const key = `${section.id}|${resolvedWallName}`;
              const last = window.__lastZoneGhostSnap || {};
              if (!last[key] || last[key] !== snap.zoneIndex) {
                window.__lastZoneGhostSnap = { ...(window.__lastZoneGhostSnap || {}), [key]: snap.zoneIndex };
                console.log('[ZONE-GHOST] fallbackSectionHit', {
                  sectionId: section.id,
                  sectionName: section.name,
                  wallName: resolvedWallName,
                  zoneIndex: snap.zoneIndex,
                  hitCoord,
                  division: {
                    sectionStart: division.sectionStart,
                    sectionEnd: division.sectionEnd,
                    partSize: division.partSize,
                    parts: division.parts,
                  },
                });
              }
            } else {
              worldPos = section.group.position.clone();
            }
          } else {
            worldPos = section.group.position.clone();
          }
          {
            const yPivot = getGhostPivotWorldY(section, state.pendingFurnitureData);
            if (yPivot != null) {
              worldPos.y = yPivot;
            } else if (state.room) {
              const roomWorldPos = new THREE.Vector3();
              state.room.group.getWorldPosition(roomWorldPos);
              worldPos.y = roomWorldPos.y;
            }
          }
          commitGhostSnap(worldPos, wallName, rotationY, zoneSize || undefined);
          if (state.room?.highlightWall) state.room.highlightWall(wallName);
          return;
        }
      }
    }

    //     ,   
    if (window._ghostUpdateCount <= 5 || window._ghostUpdateCount % 50 === 0) {
      console.log('[ghost] no wall/section hit');
    }
    if (state.furnitureGhost) state.furnitureGhost.visible = false;
    if (state.room && state.room.resetWallHighlight) state.room.resetWallHighlight();
    if (state.room && state.room.hideAllMarkers) state.room.hideAllMarkers();
  }
  } catch (err) {
    console.warn('[ghost] updateFurnitureGhostPosition failed', err);
  } finally {
    if (event) updateCatalogDragIcon(event);
  }
}

if (typeof window !== 'undefined') {
  window.__cldRefreshPlacementGhost = () => {
    const ev = state._lastGhostMouseEvent;
    if (ev && state.isPlacingFurniture) updateFurnitureGhostPosition(ev);
  };
}
