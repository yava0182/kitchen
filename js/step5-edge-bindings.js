/**
 * Шаг 5: выбор в круге → material_id; декор, кромка и вариант толщины — из карточки material_2.
 * Визуал: текстура декора если есть; hex — только без текстуры.
 */
(function (global) {
  const __matById = new Map();
  const __edgeById = new Map();
  let __preloadPromise = null;

  function getStep5ConfigStep() {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('room_steps_config') : null;
      if (!raw) return null;
      const cfg = JSON.parse(raw);
      const steps = cfg?.steps;
      return Array.isArray(steps) ? steps.find((s) => s?.stepId === 5) || null : null;
    } catch {
      return null;
    }
  }

  function getEdgeVariantsFromItem(item) {
    if (!item) return [];
    if (Array.isArray(item.edge_variants) && item.edge_variants.length) return item.edge_variants;
    if (Array.isArray(item.variants) && item.variants.length) return item.variants;
    if (Array.isArray(item.params?.variants) && item.params.variants.length) return item.params.variants;
    return [];
  }

  function resolveEdgeVariantIndex(item, options = {}) {
    const variants = getEdgeVariantsFromItem(item);
    if (!variants.length) return 0;
    const variantId = options.variantId ?? options.edgeVariantId;
    if (variantId != null && variantId !== '') {
      const i = Number(variantId);
      if (Number.isFinite(i) && i >= 0 && i < variants.length) return i;
    }
    const pref = options.preferredThicknessMm ?? options.thicknessMm;
    if (pref != null && Number.isFinite(Number(pref))) {
      const target = Number(pref);
      let best = 0;
      let bestDiff = Infinity;
      for (let i = 0; i < variants.length; i++) {
        const t = Number(variants[i]?.thickness);
        if (!Number.isFinite(t)) continue;
        const d = Math.abs(t - target);
        if (d < bestDiff) {
          bestDiff = d;
          best = i;
        }
      }
      if (bestDiff < Infinity) return best;
    }
    for (let i = 0; i < variants.length; i++) {
      if (variants[i]?.default === true || variants[i]?.default === 1) return i;
    }
    return 0;
  }

  /** Толщина кромки (мм) по толщине плиты (мм). */
  function panelThicknessToEdgeButtMm(panelMm) {
    const p = Number(panelMm);
    if (!Number.isFinite(p)) return 0.8;
    if (p <= 16) return 0.4;
    if (p <= 18) return 2;
    return 2;
  }

  function edgeButtThicknessMm(edgeItem, variantIndex) {
    const variants = getEdgeVariantsFromItem(edgeItem);
    const v = variants[variantIndex] || null;
    if (v && Number.isFinite(Number(v.thickness))) return Number(v.thickness);
    const n = parseFloat(edgeItem?.thickness || '0.8');
    return Number.isFinite(n) ? n : 0.8;
  }

  function ingestMaterialList(list) {
    if (!Array.isArray(list)) return;
    list.forEach((it) => {
      if (it && it.id != null) __matById.set(Number(it.id), it);
    });
  }

  function ingestEdgeList(list) {
    if (!Array.isArray(list)) return;
    list.forEach((it) => {
      if (it && it.id != null) __edgeById.set(Number(it.id), it);
    });
  }

  const WHEEL_PLACEHOLDER_HEX = new Set(['#cccccc', '#ccc']);

  /** Декор шага 5: текстура/цвет только из карточки material_2 (не заглушка колеса). */
  function decorateFromMaterialCard(decor) {
    if (!decor) return decor;
    const mid = Number(decor.material_id ?? decor.materialId);
    if (!Number.isFinite(mid) || mid <= 0) return decor;
    const item = getMaterialFromCache(mid);
    if (!item) return decor;

    const texture = String(item.texture || item.icon || item.image || '').trim();
    const out = {
      ...decor,
      name: (item.name || decor.name || '').toString(),
      material_type: decor.material_type || decor.materialType || 'material_2',
      material_id: mid,
    };

    if (texture) {
      out.texture = texture;
      delete out.hex;
    } else {
      delete out.hex;
      const c = String(item.color || '').trim();
      if (/^#[0-9a-fA-F]{6}$/.test(c)) out.hex = c;
    }

    const hexLeft = String(out.hex || '').trim().toLowerCase();
    if (WHEEL_PLACEHOLDER_HEX.has(hexLeft)) delete out.hex;

    return out;
  }

  function getMaterialFromCache(materialId) {
    const id = Number(materialId);
    if (!Number.isFinite(id)) return null;
    if (__matById.has(id)) return __matById.get(id);
    const lib = global.__cldMaterialsLib;
    const list = lib?.itemsByKey?.material_2;
    if (Array.isArray(list)) {
      const found = list.find((x) => Number(x?.id) === id);
      if (found) {
        __matById.set(id, found);
        return found;
      }
    }
    return null;
  }

  function getEdgeFromCache(edgeId) {
    const id = Number(edgeId);
    if (!Number.isFinite(id)) return null;
    return __edgeById.get(id) || null;
  }

  function fetchJson(url) {
    return fetch(url, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null));
  }

  /** Подгрузка material_2 и butt_butts для синхронного resolve в комнате. */
  function preloadCatalog() {
    if (__preloadPromise) return __preloadPromise;
    ingestMaterialList(global.__cldMaterialsLib?.itemsByKey?.material_2);
    __preloadPromise = Promise.all([
      __matById.size
        ? Promise.resolve(null)
        : fetchJson('/api/catalog/items_get/material_2?t=' + Date.now()).then((data) => {
            const items = Array.isArray(data) ? data : data?.items || [];
            ingestMaterialList(items);
          }),
      fetchJson('/api/catalog/items_get/butt_butts?t=' + Date.now()).then((data) => {
        const items = Array.isArray(data) ? data : data?.items || [];
        ingestEdgeList(items);
      }),
    ]).catch(() => {});
    return __preloadPromise;
  }

  function pickEdgeIdFromMaterial(materialItem, panelThicknessMm) {
    const edgeIds = materialItem?.edge_ids || materialItem?.edgeIds || [];
    const ids = (Array.isArray(edgeIds) ? edgeIds : [])
      .map((x) => Number(x))
      .filter((x) => Number.isFinite(x) && x > 0);
    if (!ids.length) return null;
    if (ids.length === 1) return ids[0];

    const target = panelThicknessToEdgeButtMm(panelThicknessMm);
    return pickBestEdgeIdForThickness(materialItem, ids[0], target, ids);
  }

  function parseSideThicknessMm(side) {
    if (!side) return null;
    if (typeof side.thickness === 'number' && Number.isFinite(side.thickness)) return side.thickness;
    const n = parseFloat(side.thickness);
    return Number.isFinite(n) ? n : null;
  }

  /** Лучшая карточка кромки из edge_ids материала под толщину стороны шаблона (мм). */
  function pickBestEdgeIdForThickness(materialItem, fallbackEdgeId, sideThicknessMm, edgeIdsOverride) {
    const edgeIds = (Array.isArray(edgeIdsOverride) ? edgeIdsOverride : materialItem?.edge_ids || materialItem?.edgeIds || [])
      .map((x) => Number(x))
      .filter((x) => Number.isFinite(x) && x > 0);
    if (!edgeIds.length) {
      const fb = Number(fallbackEdgeId);
      return Number.isFinite(fb) && fb > 0 ? fb : null;
    }
    if (edgeIds.length === 1) return edgeIds[0];

    const target = sideThicknessMm != null && Number.isFinite(Number(sideThicknessMm))
      ? Number(sideThicknessMm)
      : null;
    if (target == null) {
      const fb = Number(fallbackEdgeId);
      return edgeIds.includes(fb) ? fb : edgeIds[0];
    }

    let bestId = edgeIds[0];
    let bestDiff = Infinity;
    for (const eid of edgeIds) {
      const edgeItem = getEdgeFromCache(eid);
      if (!edgeItem) continue;
      const vi = resolveEdgeVariantIndex(edgeItem, { preferredThicknessMm: target });
      const th = edgeButtThicknessMm(edgeItem, vi);
      const d = Math.abs(th - target);
      if (d < bestDiff) {
        bestDiff = d;
        bestId = eid;
      }
    }
    return bestId;
  }

  function resolveMergedSideEdge(step5Sample, side, materialItem) {
    const sideMm = parseSideThicknessMm(side);
    const fallbackEdgeId = step5Sample?.edge_id ?? step5Sample?.decor_id;
    const edgeIdNum = materialItem
      ? pickBestEdgeIdForThickness(materialItem, fallbackEdgeId, sideMm)
      : Number(fallbackEdgeId) || 0;
    const edgeItem = edgeIdNum ? getEdgeFromCache(edgeIdNum) : null;

    let edgeVariantId =
      step5Sample?.edge_variant_id != null && step5Sample?.edge_variant_id !== ''
        ? step5Sample.edge_variant_id
        : 0;
    if (edgeItem && sideMm != null) {
      edgeVariantId = resolveEdgeVariantIndex(edgeItem, { preferredThicknessMm: sideMm });
    }

    const variants = edgeItem ? getEdgeVariantsFromItem(edgeItem) : [];
    const variant = variants[edgeVariantId] || null;
    const variantName = (variant?.name || variant?.decor_name || '').toString().trim();

    return { edgeIdNum, edgeVariantId, variantName, edgeItem };
  }

  /**
   * @param {object} materialItem — элемент material_2
   * @param {{ panelThicknessMm?: number }} [options]
   */
  function resolveEdgeFromMaterialItem(materialItem, options = {}) {
    if (!materialItem) return null;
    const panelMm =
      options.panelThicknessMm != null
        ? Number(options.panelThicknessMm)
        : Number(materialItem.thickness) || 16;
    const edgeId = pickEdgeIdFromMaterial(materialItem, panelMm);
    if (!edgeId) return null;

    const edgeItem = getEdgeFromCache(edgeId);
    const prefButt = panelThicknessToEdgeButtMm(panelMm);
    const edgeVariantId = edgeItem
      ? resolveEdgeVariantIndex(edgeItem, { preferredThicknessMm: prefButt })
      : 0;
    const edgeThicknessMm = edgeItem ? edgeButtThicknessMm(edgeItem, edgeVariantId) : prefButt;

    const tex = String(
      materialItem.texture || materialItem.icon || materialItem.image || '',
    ).trim();

    return {
      materialType: 'material_2',
      materialId: Number(materialItem.id),
      edgeType: 'butt_butts',
      edgeId,
      edgeVariantId,
      edgeThicknessMm,
      decorTexture: tex,
      decorName: (materialItem.name || materialItem.article || '').toString(),
    };
  }

  function findWheelDecorById(decorId, step5) {
    const key = decorId != null ? String(decorId) : '';
    if (!key || !step5) return null;
    const outer = Array.isArray(step5.step5WheelOuter) ? step5.step5WheelOuter : [];
    const inner = Array.isArray(step5.step5WheelInner) ? step5.step5WheelInner : [];
    const direct =
      outer.find((c) => c && String(c.id) === key) || inner.find((c) => c && String(c.id) === key);
    if (direct) return direct;
    const m = key.match(/^m-(\d+)$/);
    if (m) {
      const mid = Number(m[1]);
      if (Number.isFinite(mid)) {
        return (
          outer.find((c) => c && Number(c.material_id ?? c.materialId) === mid) ||
          inner.find((c) => c && Number(c.material_id ?? c.materialId) === mid) ||
          null
        );
      }
    }
    const slot = key.match(/^(outer|inner)-(\d+)$/);
    if (slot) {
      const idx = Number(slot[2]) - 1;
      const wheel = slot[1] === 'inner' ? inner : outer;
      if (idx >= 0 && idx < wheel.length) return wheel[idx];
    }
    return null;
  }

  function findWheelDecorByMaterialId(materialId, step5) {
    const mid = Number(materialId);
    if (!Number.isFinite(mid) || !step5) return null;
    const outer = Array.isArray(step5.step5WheelOuter) ? step5.step5WheelOuter : [];
    const inner = Array.isArray(step5.step5WheelInner) ? step5.step5WheelInner : [];
    return (
      outer.find((c) => c && Number(c.material_id ?? c.materialId) === mid) ||
      inner.find((c) => c && Number(c.material_id ?? c.materialId) === mid) ||
      null
    );
  }

  function resolveBindingForMaterial(materialId, decorHint, options = {}) {
    const matNum = Number(materialId);
    if (!Number.isFinite(matNum)) return null;

    const materialItem = getMaterialFromCache(matNum);
    if (!materialItem) {
      preloadCatalog();
      return null;
    }

    const step5 = getStep5ConfigStep();
    const wheel = findWheelDecorByMaterialId(matNum, step5);
    const edge = resolveEdgeFromMaterialItem(materialItem, options);
    if (!edge) return null;

    const wheelTex = wheel?.texture && String(wheel.texture).trim();
    return {
      decorId: wheel?.id || decorHint?.id || null,
      materialType: edge.materialType,
      materialId: edge.materialId,
      edgeType: edge.edgeType,
      edgeId: edge.edgeId,
      edgeVariantId: edge.edgeVariantId,
      edgeThicknessMm: edge.edgeThicknessMm,
      decorName: wheel?.name || decorHint?.name || edge.decorName,
      decorTexture: wheelTex || edge.decorTexture || decorHint?.texture || null,
    };
  }

  function resolveBindingForDecorId(decorId, options = {}) {
    const step5 = getStep5ConfigStep();
    if (!step5) return null;
    const wheel = findWheelDecorById(decorId, step5);

    let materialId = wheel?.material_id ?? wheel?.materialId;
    let materialType = wheel?.material_type || wheel?.materialType || 'material_2';

    if ((materialId == null || materialId === '') && options.fallbackOutside) {
      const o = options.fallbackOutside;
      materialType = materialType || o.material_type || o.materialType || 'material_2';
      materialId = o.material_id ?? o.materialId;
    }

    const matNum = materialId != null && materialId !== '' ? Number(materialId) : null;
    if (!Number.isFinite(matNum)) return null;

    const binding = resolveBindingForMaterial(matNum, wheel, options);
    if (!binding) return null;
    return { ...binding, decorId: decorId != null ? String(decorId) : binding.decorId };
  }

  function resolveBindingForDecor(decor, options = {}) {
    if (!decor) return null;
    const mid = decor.material_id ?? decor.materialId;
    if (mid != null && mid !== '') {
      const b = resolveBindingForMaterial(mid, decor, options);
      if (b) return b;
    }
    if (decor.id) return resolveBindingForDecorId(decor.id, options);
    return null;
  }

  /** @deprecated сохранение trim/wheel edge больше не нужно */
  function syncBindingsFromWheels(step5) {
    return step5;
  }

  function makeEdgesObject(binding, options = {}) {
    if (!binding?.edgeId) return null;
    const panelMm = options.panelThicknessMm ?? options.thicknessMm;
    let resolved = binding;
    if (panelMm != null && binding.materialId) {
      const mat = getMaterialFromCache(binding.materialId);
      const refreshed = mat ? resolveEdgeFromMaterialItem(mat, { panelThicknessMm: panelMm }) : null;
      if (refreshed) resolved = { ...binding, ...refreshed };
    }
    let thickness =
      options.thicknessMm != null
        ? options.thicknessMm
        : resolved.edgeThicknessMm != null
          ? resolved.edgeThicknessMm
          : 0.8;
    const tex = (options.texture || resolved.decorTexture || '').toString().trim();
    const base = {
      enabled: true,
      thickness,
      type: 'butts',
      edge_id: String(resolved.edgeId),
      decor_id: String(resolved.edgeId),
      edge_variant_id:
        resolved.edgeVariantId != null && resolved.edgeVariantId !== ''
          ? resolved.edgeVariantId
          : 0,
    };
    if (resolved.materialId != null && resolved.materialId !== '') {
      base.material_id = Number(resolved.materialId);
    }
    if (tex) {
      base.texture = tex;
      base.icon = tex;
    }
    const out = {};
    for (let i = 1; i <= 4; i++) {
      out[i] = { ...base };
    }
    return out;
  }

  /**
   * Комната: схема кромкования из шаблона (стороны, толщины), edge_id/текстура — с шага 5.
   * edge_variant_id — по thickness стороны шаблона (0.4 / 1 мм), не по толщине плиты.
   */
  function mergeTemplateEdgesWithStep5(templateEdges, step5Edges) {
    const tpl = templateEdges && typeof templateEdges === 'object' ? templateEdges : {};
    if (!step5Edges || typeof step5Edges !== 'object') return { ...tpl };

    const step5Sample =
      step5Edges[1] ||
      step5Edges['1'] ||
      Object.values(step5Edges).find((e) => e && e.enabled !== false) ||
      null;
    if (!step5Sample) return { ...tpl };

    const tex = String(step5Sample.texture || step5Sample.icon || '').trim();
    const materialId = step5Sample.material_id ?? step5Sample.materialId;
    const materialItem =
      materialId != null && materialId !== '' ? getMaterialFromCache(Number(materialId)) : null;
    const out = {};

    for (let i = 1; i <= 4; i++) {
      const side = tpl[i] || tpl[String(i)] || null;
      if (!side || side.enabled !== true) {
        if (side) out[i] = { ...side, enabled: false };
        continue;
      }

      const merged = {
        ...side,
        enabled: true,
        type: step5Sample.type || side.type || 'butts',
      };

      const { edgeIdNum, edgeVariantId, variantName } = resolveMergedSideEdge(
        step5Sample,
        side,
        materialItem,
      );

      if (edgeIdNum) {
        merged.edge_id = String(edgeIdNum);
        merged.decor_id = String(edgeIdNum);
      } else if (step5Sample.edge_id != null && step5Sample.edge_id !== '') {
        merged.edge_id = String(step5Sample.edge_id);
        merged.decor_id = String(step5Sample.decor_id ?? step5Sample.edge_id);
      }

      merged.edge_variant_id = edgeVariantId;

      if (variantName) {
        merged.edge_name = variantName;
        merged.decor_name = variantName;
      }

      const sideColor = String(side.color ?? '').trim().toLowerCase();
      if (!sideColor || sideColor === '#ffffff' || sideColor === '#fff') {
        delete merged.color;
      }

      if (tex) {
        merged.texture = tex;
        merged.icon = tex;
        merged.normalMap = '';
        merged.roughnessMap = '';
        // Шаблон хранит color:#fff — при текстуре материала шага 5 не смешивать с белым.
        delete merged.color;
      }

      out[i] = merged;
    }

    return out;
  }

  /** Мета кромки из кэша preload (без /api), для комнаты и обклада. */
  function buildCatalogMetaFromEdgeId(edgeId, edgeTypeKey = 'butt_butts', options = {}) {
    const id = Number(edgeId) || 0;
    if (!id) return null;
    const type = String(edgeTypeKey || 'butt_butts').trim() || 'butt_butts';
    const item = getEdgeFromCache(id);
    if (!item) return null;
    const variants = getEdgeVariantsFromItem(item);
    const variantId = options.variantId ?? options.edgeVariantId;
    const vi = resolveEdgeVariantIndex(item, {
      variantId,
      preferredThicknessMm: options.preferredThicknessMm,
    });
    const v = variants[vi] || null;
    return {
      id,
      edgeType: type,
      variantId: vi,
      variant: v,
      variants,
      name: (v?.name || item?.name || `Кромка ${id}`).toString(),
      color: (item?.color || '#d4e8a0').toString().trim() || '#d4e8a0',
      thicknessMm: parseThicknessMmFromVariant(v, item),
      roughness: typeof item?.roughness === 'number' ? item.roughness : 0.55,
      metalness: typeof item?.metalness === 'number' ? item.metalness : 0.05,
      texture: (item?.texture || item?.icon || '').toString().trim() || '',
      normalMap: (item?.normalMap || '').toString().trim() || '',
      roughnessMap: (item?.roughnessMap || '').toString().trim() || '',
      stretchWidth: !!(item?.stretchWidth || item?.stretch_width),
      stretchHeight: !!(item?.stretchHeight || item?.stretch_height),
      realTextureWidth: Number(item?.realTextureWidth || item?.real_texture_width) || 256,
      realTextureHeight: Number(item?.realTextureHeight || item?.real_texture_height) || 256,
      oneSided: !!(item?.oneSided || item?.one_side),
      price: v?.price != null ? Number(v.price) : null,
      calc_type: (v?.calc_type || 'per_mp').toString(),
    };
  }

  preloadCatalog();

  global.__cldStep5Edge = {
    getStep5ConfigStep,
    findWheelDecorById,
    findWheelDecorByMaterialId,
    preloadCatalog,
    syncBindingsFromWheels,
    resolveBindingForDecorId,
    resolveBindingForDecor,
    resolveBindingForMaterial,
    resolveEdgeFromMaterialItem,
    makeEdgesObject,
    mergeTemplateEdgesWithStep5,
    decorateFromMaterialCard,
    panelThicknessToEdgeButtMm,
    buildCatalogMetaFromEdgeId,
    getEdgeItemById: getEdgeFromCache,
    ingestMaterialList,
    ingestEdgeList,
    parseSideThicknessMm,
    pickBestEdgeIdForThickness,
    resolveMergedSideEdge,
  };
})(typeof window !== 'undefined' ? window : globalThis);
