/**
 * Сопоставление материалов Clodis → art/sign в CFRN для Bazis (как code в Clodis).
 * В админке у плит и кромок должен быть заполнен «Артикул» = код материала в базе Bazis.
 */

function isTemplateLockedMaterialFromUserData(ud) {
  if (typeof window !== 'undefined' && typeof window.__cldIsTemplateMaterialUserData === 'function') {
    return window.__cldIsTemplateMaterialUserData(ud);
  }
  return false;
}

function pickArticleFromItem(item) {
  if (!item || typeof item !== 'object') return '';
  const variants = item.material_variants || item.edge_variants || item.variants;
  const v0 = Array.isArray(variants) && variants.length ? variants[0] : null;
  return String(
    item.article ?? item.code ?? item.vendor_code ?? v0?.article ?? v0?.code ?? ''
  ).trim();
}

function parseEdgeIdFromSyntheticArt(art) {
  const m = String(art || '').match(/^EDGE_(\d+)_t/);
  return m ? m[1] : '';
}

async function fetchCatalogItems(catalogType) {
  try {
    const r = await fetch(`/api/catalog/items_get/${encodeURIComponent(catalogType)}`, { cache: 'no-store' });
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.items)) return data.items;
    }
  } catch (_) {}
  try {
    const r2 = await fetch(`/catalog_items/${encodeURIComponent(catalogType)}.json`, { cache: 'no-store' });
    if (r2.ok) {
      const data = await r2.json();
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.items)) return data.items;
    }
  } catch (_) {}
  return [];
}

function ingestItemsToMap(byKey, key, items) {
  const k = String(key || '').trim();
  if (!k) return;
  let idMap = byKey.get(k);
  if (!idMap) {
    idMap = new Map();
    byKey.set(k, idMap);
  }
  for (const it of items || []) {
    if (it?.id != null) idMap.set(String(it.id), it);
  }
}

async function loadMaterialsByKey() {
  const byKey = new Map();
  const lib = typeof window !== 'undefined' ? window.__cldMaterialsLib : null;
  if (lib?.itemsByKey && typeof lib.itemsByKey === 'object') {
    for (const [key, items] of Object.entries(lib.itemsByKey)) {
      ingestItemsToMap(byKey, key, items);
    }
  }

  const ext = typeof window !== 'undefined' ? window.__cldStep5Edge : null;
  if (ext && typeof ext.preloadCatalog === 'function') {
    try {
      await ext.preloadCatalog();
    } catch (_) {}
  }

  const mustHave = ['material_2', 'material_3'];
  for (const key of mustHave) {
    const map = byKey.get(key);
    if (map && map.size > 0) continue;
    const items = await fetchCatalogItems(key);
    ingestItemsToMap(byKey, key, items);
  }

  if (byKey.size === 0) {
    let keys = [];
    try {
      const r = await fetch('/api/catalog/items_get/materials_keys', { cache: 'no-store' });
      if (r.ok) {
        const data = await r.json();
        keys = Array.isArray(data) ? data : data?.items || data?.keys || [];
      }
    } catch (_) {}
    if (!keys.length) keys = [{ key: 'material_2' }, { key: 'material_3' }];
    await Promise.all(
      keys.map(async (k) => {
        const key = String(k?.key || k || '').trim();
        if (!key || (byKey.get(key)?.size ?? 0) > 0) return;
        const items = await fetchCatalogItems(key);
        ingestItemsToMap(byKey, key, items);
      }),
    );
  }

  return byKey;
}

export async function createBazisMaterialResolver() {
  const [materialsByKey, edgeItems, cabinetItems] = await Promise.all([
    loadMaterialsByKey(),
    fetchCatalogItems('butt_butts'),
    fetchCatalogItems('cabinet_model'),
  ]);

  const edgesById = new Map();
  for (const it of edgeItems) {
    if (it?.id != null) edgesById.set(String(it.id), it);
  }

  const cabinetById = new Map();
  for (const it of cabinetItems) {
    if (it?.id != null) cabinetById.set(String(it.id), it);
  }

  function findMaterialItem(matKey, matId) {
    const key = String(matKey || 'material_2').trim() || 'material_2';
    const map = materialsByKey.get(key);
    if (!map || matId == null || matId === '') return null;
    return map.get(String(matId)) || null;
  }

  function panelMatFromId(matKey, matId, decorHint) {
    if (matId == null || matId === '') return null;
    const key = String(matKey || 'material_2').trim() || 'material_2';
    const item = findMaterialItem(key, matId);
    const art = pickArticleFromItem(item);
    const hintName = String(decorHint?.name || '').trim();
    if (art) {
      return {
        art,
        name: String(item?.name || hintName || art).trim() || art,
        sign: '',
      };
    }
    const displayName = String(item?.name || hintName || '').trim();
    if (displayName) {
      return {
        art: `MAT_${key}_${matId}`,
        name: displayName,
        sign: '',
      };
    }
    return null;
  }

  function inferDecorChannel(ud) {
    if (!ud || isTemplateLockedMaterialFromUserData(ud)) return null;
    if (ud.step5DecorChannel) return String(ud.step5DecorChannel).toLowerCase();
    if (ud.isFacade === true) return 'outside';
    if (ud.isBody === true) return 'inside';
    return null;
  }

  function inferMatKeyFromUd(ud, thicknessMm) {
    const k = String(ud?.catalogMaterialKey || ud?.material_key || '').trim();
    if (k) return k;
    const t = Number(thicknessMm);
    if (Number.isFinite(t) && t > 0 && t <= 4) return 'material_3';
    return 'material_2';
  }

  function readNominalThicknessMm(ud) {
    if (!ud) return null;
    const n = Number(ud.__cldNominalThicknessMm ?? ud.facadeThicknessMm);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function findFurnitureRoot(mesh) {
    let p = mesh;
    while (p) {
      if (p.userData?.isFurniture) return p;
      p = p.parent;
    }
    return null;
  }

  function getGlobalStep5Decor(channel) {
    const ch = String(channel || '').toLowerCase();
    const sel =
      typeof window !== 'undefined' && typeof window.getStep5DecorSelection === 'function'
        ? window.getStep5DecorSelection()
        : { outside: null, inside: null };
    return ch === 'outside' ? sel.outside : ch === 'inside' ? sel.inside : null;
  }

  function resolveStep5Decor(mesh) {
    let channel = null;
    let anchorUd = null;
    let p = mesh;
    for (let i = 0; i < 20 && p; i++) {
      const ud = p.userData || {};
      const ch = inferDecorChannel(ud);
      if (ch) {
        channel = ch;
        anchorUd = ud;
        break;
      }
      p = p.parent;
    }
    if (!channel) return null;

    const root = findFurnitureRoot(mesh);
    const fud = root?.userData || {};

    const moduleDecor =
      channel === 'outside' ? fud.step5ModuleOutside : fud.step5ModuleInside;
    const wheelDecor = getGlobalStep5Decor(channel);
    const decor = moduleDecor || wheelDecor;

    const midFromDecor = (d) => {
      const mid = d?.material_id ?? d?.materialId;
      if (mid == null || mid === '') return null;
      const n = Number(mid);
      return Number.isFinite(n) && n > 0 ? n : null;
    };

    const mid =
      midFromDecor(decor) ||
      (anchorUd?.step5MaterialId != null && Number(anchorUd.step5MaterialId) > 0
        ? Number(anchorUd.step5MaterialId)
        : null);

    if (mid == null) return null;
    return { channel, materialId: mid, decor };
  }

  function resolvePanelFromMesh(mesh) {
    if (isTemplateLockedMaterialFromUserData(mesh.userData)) {
      let p = mesh;
      for (let i = 0; i < 20 && p; i++) {
        const ud = p.userData || {};
        const thickness = readNominalThicknessMm(ud);
        const matKey = inferMatKeyFromUd(ud, thickness);
        const matId = ud.catalogMaterialId ?? ud.material_id ?? ud.materialId;
        const fromTpl = panelMatFromId(matKey, matId);
        if (fromTpl) return fromTpl;
        p = p.parent;
      }
    }

    const step5 = resolveStep5Decor(mesh);
    if (step5?.materialId != null) {
      let thickness = readNominalThicknessMm(mesh.userData);
      let p = mesh.parent;
      for (let i = 0; i < 12 && p && thickness == null; i++) {
        thickness = readNominalThicknessMm(p.userData);
        p = p.parent;
      }
      const matKey = inferMatKeyFromUd(mesh.userData, thickness);
      const fromStep5 = panelMatFromId(matKey, step5.materialId, step5.decor);
      if (fromStep5) return fromStep5;
    }

    let p = mesh;
    for (let i = 0; i < 20 && p; i++) {
      const ud = p.userData || {};
      const thickness = readNominalThicknessMm(ud);
      const matKey = inferMatKeyFromUd(ud, thickness);

      const matId = ud.catalogMaterialId ?? ud.material_id ?? ud.materialId;
      const fromCatalog = panelMatFromId(matKey, matId);
      if (fromCatalog) return fromCatalog;

      if (ud.step5MaterialId != null && Number(ud.step5MaterialId) > 0) {
        const fromStored = panelMatFromId(matKey, Number(ud.step5MaterialId));
        if (fromStored) return fromStored;
      }

      p = p.parent;
    }

    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[Bazis] Материал панели не найден, LDSP_DEFAULT:', mesh?.name, mesh?.userData);
    }
    return { art: 'LDSP_DEFAULT', name: 'ЛДСП', sign: '' };
  }

  function resolveButt(butt) {
    const edgeId =
      butt?.edgeCatalogId != null && butt.edgeCatalogId !== ''
        ? String(butt.edgeCatalogId)
        : parseEdgeIdFromSyntheticArt(butt?.materialArt);
    const item = edgeId ? edgesById.get(edgeId) : null;
    const art = pickArticleFromItem(item) || String(butt?.materialArt || 'EDGE_DEFAULT').trim();
    const name = String(item?.name || butt?.materialName || 'Кромка').trim();
    const thick = Number(butt?.thickness);
    const width = Number(butt?.width);
    const t = Number.isFinite(thick) && thick > 0 ? thick : 0.5;
    const w = Number.isFinite(width) && width > 0 ? width : 0;
    const sign = `${t}/${w} ${art}`.trim();
    return { art, name, sign };
  }

  function resolveCabinetModel(specId, fallbackName) {
    const item = specId ? cabinetById.get(String(specId)) : null;
    const models = item?.data?.params?.models || item?.params?.models;
    const m0 = Array.isArray(models) && models.length ? models[0] : null;
    const art = String(m0?.code || item?.article || item?.code || '').trim();
    if (art) {
      return { art, name: String(item?.name || fallbackName || art).trim() || art, sign: '' };
    }
    if (specId) {
      return {
        art: `ACC_${specId}`,
        name: String(item?.name || fallbackName || 'Комплектующее').trim(),
        sign: '',
      };
    }
    return { art: 'ACC_DEFAULT', name: String(fallbackName || 'Комплектующее'), sign: '' };
  }

  const m2 = materialsByKey.get('material_2');
  const m3 = materialsByKey.get('material_3');
  if (typeof console !== 'undefined' && console.log) {
    console.log('[Bazis] Каталог материалов для экспорта:', {
      material_2: m2?.size ?? 0,
      material_3: m3?.size ?? 0,
      edges: edgesById.size,
    });
  }

  return { resolvePanelFromMesh, resolveButt, resolveCabinetModel, findMaterialItem };
}
