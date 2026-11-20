const fs = require('fs');
const path = 'D:/Clodis-Kitchen/js/furniture/furniture-manager.js';
let s = fs.readFileSync(path, 'utf8');

const insert = `  return { x: zoneW, y: targetHeight, z: targetDepthMm };
}

function listCatalogItemsInRoomStorage(catalogType) {
  const ct = String(catalogType || '').trim();
  if (!ct) return [];
  const key = ct.startsWith('catalog_') ? ct : 'catalog_' + ct;
  const fromDisk = () => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open(
        'GET',
        '/catalog_items/' + encodeURIComponent(key) + '.json?t=' + Date.now(),
        false
      );
      xhr.send(null);
      if (xhr.status < 200 || xhr.status >= 300) return [];
      const arr = JSON.parse(xhr.responseText);
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  };
  if (/^catalog_[45]\\d+$/i.test(key)) {
    const disk = fromDisk();
    if (disk.length) return disk;
  }
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) return arr;
    }
  } catch (_) {}
  return fromDisk();
}

function resolveKitchenCornerHandPairTargetId(ud, wantAtStart) {
  const catalogType = String(ud?.catalogType || 'catalog_44').trim() || 'catalog_44';
  const wantLeft = wantAtStart === true;
  let pair = ud?.pairedHandCatalogItemIds;
  if (!pair || !(pair.left || pair.right)) {
    const currentItem = findCatalogItemInRoomStorage(
      catalogType,
      Number(ud?.catalogItemId) || 0
    );
    pair = readPairedHandCatalogIdsFromItem(currentItem);
  }
  let targetId = wantLeft ? Number(pair.left) || 0 : Number(pair.right) || 0;
  if (targetId > 0) return { catalogType, targetId, pair };
  const items = listCatalogItemsInRoomStorage(catalogType);
  for (const it of items) {
    const id = Number(it?.id) || 0;
    if (id <= 0) continue;
    const pk = String(it?.data?.placementKind || it?.placementKind || '')
      .trim()
      .toLowerCase();
    if (pk && pk !== 'kitchen_base_corner') continue;
    if (getCatalogItemCornerAtStart(it) === wantLeft) {
      targetId = id;
      break;
    }
  }
  return { catalogType, targetId, pair };
}

/**
 * Разворот НМУ: карточка «Угловой левый» ↔ «Угловой правый» (админка), не крутить тот же SKU.
 */
export function trySwapKitchenCornerHandCatalog(group, wantAtStart, sectionData) {
  if (!group || !isKitchenCornerBaseGroup(group)) {
    return { ok: false, reason: 'not_corner' };
  }
  const ud = group.userData || (group.userData = {});
  const catalogType = String(ud.catalogType || 'catalog_44').trim() || 'catalog_44';
  const currentId = Number(ud.catalogItemId) || 0;
  if (currentId <= 0) return { ok: false, reason: 'no_catalog_id' };

  const currentItem = findCatalogItemInRoomStorage(catalogType, currentId);
  const currentAt = getCatalogItemCornerAtStart(currentItem || ud.catalogItem);
  if (currentAt === (wantAtStart === true)) {
    return { ok: true, swapped: false, fromId: currentId, toId: currentId };
  }

  const resolved = resolveKitchenCornerHandPairTargetId(ud, wantAtStart === true);
  const targetId = Number(resolved.targetId) || 0;
  if (targetId <= 0 || targetId === currentId) {
    return {
      ok: false,
      reason: 'no_pair',
      message: wantAtStart
        ? 'Нет карточки «Угловой левый» в catalog_44.'
        : 'Нет карточки «Угловой правый» в catalog_44.',
    };
  }

  const targetItem = findCatalogItemInRoomStorage(resolved.catalogType, targetId);
  if (!targetItem) return { ok: false, reason: 'pair_missing', toId: targetId };

  const furnitureData = buildFurnitureDataFromCatalogItem(
    targetItem,
    resolved.catalogType
  );
  if (!furnitureData) return { ok: false, reason: 'bad_furniture_data' };

  const clodisData = getClodisDataForBuild(furnitureData);
  if (!clodisData || clodisData.length === 0) return { ok: false, reason: 'no_clodis' };

  let dataForBuild;
  try {
    dataForBuild = JSON.parse(JSON.stringify(clodisData));
  } catch (_) {
    return { ok: false, reason: 'clone_failed' };
  }

  const placementKind = resolvePlacementKindFromFurnitureData(furnitureData);
  const { opts: doorOpts, needsPatch } = buildRoomDoorPrepareOpts(furnitureData, {
    doorLayout: ud.doorLayout,
    zoneHand: ud.zoneHand,
    doorKind: ud.doorKind,
    catalogItem: targetItem,
    placementKind,
    productKind: resolveProductKindForFurnitureData(furnitureData),
  });
  const prepared = needsPatch
    ? prepareClodisForRoomBuild(dataForBuild, doorOpts)
    : dataForBuild;

  writeUserDataClodisData(ud, prepared);
  ud.catalogItemId = targetId;
  ud.catalogItem = targetItem;
  ud.catalogName =
    (targetItem.name && String(targetItem.name).trim()) || ud.catalogName || '';
  ud.catalogType = resolved.catalogType;
  ud.pairedHandCatalogItemIds = {
    left: Number(resolved.pair?.left) || (wantAtStart ? targetId : currentId),
    right: Number(resolved.pair?.right) || (wantAtStart ? currentId : targetId),
  };
  if (!ud.pairedHandCatalogItemIds.left) {
    ud.pairedHandCatalogItemIds.left = wantAtStart ? targetId : currentId;
  }
  if (!ud.pairedHandCatalogItemIds.right) {
    ud.pairedHandCatalogItemIds.right = wantAtStart ? currentId : targetId;
  }
  ud.pairedCatalogItemIds = readPairedCatalogIdsFromItem(targetItem);
  ud.__placementKindProfileId = getRawPlacementKindFromFurnitureData(furnitureData);
  ud.__placementKind = placementKind;
  ud.__cldSkipSectionAutoRescale = clodisHasConstructorMarkers(prepared);
  ud.__kitchenCornerSideAtMinU = wantAtStart === true;

  const cellW =
    Math.round(Number(ud.__kitchenCellWidthMm) || Number(ud.customWidthMm)) || 0;
  const targetSize = {
    x: cellW > 50 ? cellW : Math.round(Number(ud.__targetSectionSizeMm?.x) || 1050),
    y: Math.round(Number(ud.__targetSectionSizeMm?.y) || 820),
    z: Math.round(
      Number(ud.__kitchenCarcassDepthMm) ||
        Number(ud.__targetSectionSizeMm?.z) ||
        550
    ),
  };
  const ok = rebuildFurnitureGroupForSectionResize(
    group,
    sectionData || null,
    targetSize,
    { force: true }
  );
  if (!ok) {
    return { ok: false, reason: 'rebuild_failed', fromId: currentId, toId: targetId };
  }

  console.warn('[CORNER-HAND] catalog swap', {
    fromId: currentId,
    toId: targetId,
    wantAtStart: wantAtStart === true,
    name: ud.catalogName,
  });
  try {
    recalcFurniturePricingAfterGeometryChange();
  } catch (_) {}
  return { ok: true, swapped: true, fromId: currentId, toId: targetId };
}

/**`;

const re =
  /  return \{ x: zoneW, y: targetHeight, z: targetDepthMm \};\r?\n\}\r?\n\r?\n\/\*\*/;
if (!re.test(s)) {
  console.error('anchor not found');
  process.exit(1);
}
s = s.replace(re, insert);
fs.writeFileSync(path, s);
console.log('ok', s.includes('trySwapKitchenCornerHandCatalog'));
