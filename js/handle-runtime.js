/**
 * Runtime ручек в комнате: резолв серии (volna и др.) → cabinet_model + позиция на __door_swing.
 *
 * Договорённость по ориентации:
 * - Каталог: GLB/FBX всегда загружаются вертикально (длина профиля по Y).
 * - Вертикаль на фасаде: масштаб по Y + опционально rot из cabinet_model (админка).
 * - Горизонталь на фасаде: тот же масштаб как у вертикальной модели, затем поворот 90° (HANDLE_ROOM_HORIZONTAL_ROT_Z).
 */
(function (global) {
  'use strict';

  const HANDLES_FALLBACK = {
    volna: {
      id: 'volna',
      key: 'volna',
      name: 'Ручка Волна',
      kind: 'knob',
      sizeType: 'normal',
      noHandle: false,
      modelParams: { modelType: 'normal', modelPath: '/models/volna_1770230423546.fbx' },
      variants: [{ cabinetModelId: 3, barLengthMm: 128, maxFacadeW: 450, roles: ['kitchen', 'locker', 'wardrobe'] }],
    },
    'handle-1781380433836': {
      id: 2,
      key: 'handle-1781380433836',
      name: 'Ручка Волна',
      kind: 'knob',
      sizeType: 'normal',
      noHandle: false,
      modelParams: { modelType: 'normal', modelPath: '/models/volna_1770230423546.fbx' },
      variants: [{ cabinetModelId: 3, barLengthMm: 128, maxFacadeW: 450, roles: ['kitchen', 'locker', 'wardrobe'] }],
    },
    push: { id: 'push', kind: 'push', noHandle: true },
  };

  const DEFAULT_HANDLE_OFFSET_MM = 30;
  /** Поворот mesh при горизонтальной укладке (модель в каталоге вертикальная). */
  const HANDLE_ROOM_HORIZONTAL_ROT_Z = -Math.PI / 2;
  const DEFAULT_VERTICAL_BAR_HEIGHT_MM = 128;
  /** Тумба, комод, навесной — в правилах facades ≈ facades_main. */
  const LOW_FURNITURE_PRODUCT_KINDS = new Set(['pedestal', 'wall_hung', 'console']);
  const DEFAULT_BAR_RULES = {
    min_mm: 128,
    max_mm: 768,
    step_mm: 32,
    narrow_min_mm: 300,
    narrow_max_mm: 450,
  };

  let __catalogPromise = null;
  let __catalog = null;
  let __catalogFullPromise = null;
  let __catalogFull = null;

  function handleLog(step, data) {
    if (typeof global === 'undefined' || global.DEBUG_HANDLE_ROOM !== true) return;
    try {
      const msg = '[CLD][HANDLE] ' + String(step || '');
      if (data == null) console.log(msg);
      else console.log(msg, data);
    } catch (_) {}
  }

  handleLog('runtime ready', {
    url: typeof global !== 'undefined' && global.location ? global.location.pathname : '',
  });

  function resolveModelSizeType(series) {
    return 'normal';
  }

  function isKnobHandleSeries(series) {
    return String(series?.kind || '').trim().toLowerCase() === 'knob';
  }

  function isVerticalHandleSeries(series) {
    if (isKnobHandleSeries(series)) return true;
    const sizes = Array.isArray(series?.sizes) ? series.sizes : [];
    const s0 = sizes[0];
    const sw = Number(s0?.width) || 0;
    const sh = Number(s0?.height) || 0;
    if (sh > sw && sh >= 40) return true;
    if (sw > sh && sw >= 40) return false;
    return true;
  }

  function readSelection() {
    try {
      const raw = global.localStorage?.getItem('room_step6_handle_selection');
      const p = raw ? JSON.parse(raw) : null;
      if (p && (p.seriesId || (p.roleSlots && typeof p.roleSlots === 'object' && Object.keys(p.roleSlots).length))) {
        const modelId = p.modelId != null ? String(p.modelId).trim() : '';
        const handleItemId = Number(p.handleItemId) || 0;
        return {
          seriesId: p.seriesId ? String(p.seriesId) : '',
          finishId: p.finishId || null,
          modelId: modelId || null,
          handleItemId: handleItemId > 0 ? handleItemId : null,
          roleSlots: p.roleSlots && typeof p.roleSlots === 'object' ? p.roleSlots : {},
        };
      }
    } catch (_) {}
    if (global.roomHandleSelection?.seriesId) {
      const rh = global.roomHandleSelection;
      const modelId = rh.modelId != null ? String(rh.modelId).trim() : '';
      const handleItemId = Number(rh.handleItemId) || 0;
      return {
        seriesId: String(rh.seriesId),
        finishId: rh.finishId || null,
        modelId: modelId || null,
        handleItemId: handleItemId > 0 ? handleItemId : null,
        roleSlots: rh.roleSlots && typeof rh.roleSlots === 'object' ? rh.roleSlots : {},
      };
    }
    try {
      const cfgRaw = global.localStorage?.getItem('room_steps_config');
      const cfg = cfgRaw ? JSON.parse(cfgRaw) : null;
      const step6 = cfg?.steps?.find((s) => s.stepId === 6);
      const defId = step6?.handleDefaults?.seriesId || step6?.defaultHandleSeriesId;
      if (defId) {
        const hd = step6?.handleDefaults || {};
        const modelId = hd.modelId != null ? String(hd.modelId).trim() : '';
        const handleItemId = Number(hd.handleItemId) || 0;
        return {
          seriesId: String(defId),
          finishId: hd.finishId || null,
          modelId: modelId || null,
          handleItemId: handleItemId > 0 ? handleItemId : null,
          roleSlots: {},
        };
      }
    } catch (_) {}
    return { seriesId: 'volna', finishId: null, modelId: null, handleItemId: null, roleSlots: {} };
  }

  function buildRoleSlotKey(ctx) {
    const layoutRole = normalizeLayoutRoleKey(ctx?.layoutRole || 'facades');
    const productKind = String(ctx?.productKind || 'wardrobe').trim().toLowerCase();
    const doorKind = String(ctx?.doorKind || 'rotate').trim().toLowerCase() === 'slide' ? 'slide' : 'rotate';
    return `${layoutRole}|${productKind}|${doorKind}`;
  }

  function findRoleSlotAssignment(sel, facadeCtx) {
    const slots = sel?.roleSlots;
    if (!slots || typeof slots !== 'object') return null;
    const key = buildRoleSlotKey(facadeCtx);
    if (slots[key]) return { key, ...slots[key] };
    const lr = key.split('|')[0];
    const pk = key.split('|')[1];
    for (const dk of ['rotate', 'slide']) {
      const k2 = `${lr}|${pk}|${dk}`;
      if (slots[k2]) return { key: k2, ...slots[k2] };
    }
    for (const [k, v] of Object.entries(slots)) {
      if (k.startsWith(lr + '|')) return { key: k, ...v };
    }
    return null;
  }

  function resolveFromStep6RoleSlot(base, series, slotAssign, facadeCtx, sel) {
    if (!slotAssign || !series) return null;
    if (slotAssign.noHandle) {
      return { ...base, skip: true, reason: 'step6_role_no_handle', roleSlot: slotAssign.key };
    }
    const slotSeriesId = String(slotAssign.seriesId || sel?.seriesId || '').trim();
    const pickSel = {
      seriesId: slotSeriesId,
      modelId: slotAssign.modelId || null,
      handleItemId: slotAssign.handleItemId || null,
    };
    const userModel = resolveUserHandleInCollection(series, pickSel);
    const spec = {
      modelId: slotAssign.modelId || undefined,
      orientation: slotAssign.orientation || undefined,
      position:
        slotAssign.positionAnchor
          ? {
              anchor: slotAssign.positionAnchor,
              offsetMm:
                slotAssign.positionOffsetMm != null ? Number(slotAssign.positionOffsetMm) : 30,
            }
          : undefined,
    };
    const merged = mergeUserModelIntoSpec(spec, userModel);
    const placed = applyPlacementSpec(series, merged, facadeCtx, base.vertical);
    if (placed.skip) {
      return { ...base, skip: true, reason: placed.reason || 'step6_role_skip', roleSlot: slotAssign.key };
    }
    const pos = placed.position;
    let out = {
      ...base,
      skip: false,
      cabinetModelId: placed.cabinetModelId || base.cabinetModelId,
      vertical: placed.vertical,
      variant: placed.variant || base.variant,
      positionAnchor: pos?.anchor || null,
      positionOffsetMm: pos?.offsetMm != null ? Number(pos.offsetMm) : null,
      fromStep6RoleSlot: true,
      roleSlot: slotAssign.key,
    };
    if (userModel && !merged.sizePick && !(Array.isArray(merged.modelIds) && merged.modelIds.length)) {
      out = applyUserHandleOverride(out, userModel);
    }
    return out;
  }

  function readBarRules() {
    try {
      const cfgRaw = global.localStorage?.getItem('room_steps_config');
      const cfg = cfgRaw ? JSON.parse(cfgRaw) : null;
      const step6 = cfg?.steps?.find((s) => s.stepId === 6);
      const br = step6?.handle_bar_rules;
      if (br && typeof br === 'object') {
        return { ...DEFAULT_BAR_RULES, ...br };
      }
    } catch (_) {}
    return { ...DEFAULT_BAR_RULES };
  }

  function seriesSlug(s) {
    if (!s || typeof s !== 'object') return '';
    const key = s.key != null ? String(s.key).trim() : '';
    if (key) return key;
    const id = s.id;
    if (typeof id === 'string' && id && !/^\d+$/.test(id)) return id;
    return id != null ? String(id) : '';
  }

  function isHandleCollectionEntry(s) {
    if (!s || typeof s !== 'object') return false;
    if (Number(s.parentCollectionId) > 0) return false;
    const et = String(s.entityType || 'collection').toLowerCase();
    return et !== 'size' && et !== 'variant';
  }

  function loadHandlesCatalog() {
    if (__catalog) return Promise.resolve(__catalog);
    if (__catalogPromise) return __catalogPromise;
    __catalogPromise = fetch('/api/catalog/items_get/handles?t=' + Date.now(), { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then(async (data) => {
        if (!data || !Array.isArray(data.series)) {
          try {
            const r2 = await fetch('/catalog_items/handles.json', { cache: 'no-store' });
            if (r2.ok) data = await r2.json();
          } catch (_) {}
        }
        let series = [];
        if (Array.isArray(data)) series = data;
        else if (Array.isArray(data?.series)) series = data.series;
        else if (Array.isArray(data?.items)) series = data.items;
        __catalog = {
          series: series.filter(
            (s) => s && (s.active == null || Number(s.active) !== 0) && isHandleCollectionEntry(s)
          ),
        };
        __catalogFull = {
          series: series.filter((s) => s && (s.active == null || Number(s.active) !== 0)),
        };
        handleLog('catalog loaded', { count: __catalog.series.length, full: __catalogFull.series.length });
        __catalogPromise = null;
        try {
          global.dispatchEvent?.(new CustomEvent('handles-catalog-ready', { detail: { count: __catalog.series.length } }));
        } catch (_) {}
        return __catalog;
      })
      .catch(() => {
        __catalogPromise = null;
        __catalog = { series: [] };
        return __catalog;
      });
    return __catalogPromise;
  }

  function legacyModelCodeFromHandle(item) {
    const key = String(item?.key || '').trim();
    if (key.startsWith('handle-')) return key.slice(7);
    return key || String(item?.id || '');
  }

  function loadHandlesCatalogFull() {
    if (__catalogFull) return Promise.resolve(__catalogFull);
    if (__catalogFullPromise) return __catalogFullPromise;
    __catalogFullPromise = fetch('/api/catalog/items_get/handles?t=' + Date.now(), { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then(async (data) => {
        if (!data || !Array.isArray(data.series)) {
          try {
            const r2 = await fetch('/catalog_items/handles.json', { cache: 'no-store' });
            if (r2.ok) data = await r2.json();
          } catch (_) {}
        }
        let series = [];
        if (Array.isArray(data)) series = data;
        else if (Array.isArray(data?.series)) series = data.series;
        else if (Array.isArray(data?.items)) series = data.items;
        __catalogFull = {
          series: series.filter((s) => s && (s.active == null || Number(s.active) !== 0)),
        };
        __catalogFullPromise = null;
        return __catalogFull;
      })
      .catch(() => {
        __catalogFullPromise = null;
        __catalogFull = { series: [] };
        return __catalogFull;
      });
    return __catalogFullPromise;
  }

  function selectionMatchesSeries(series, sel) {
    if (!series || !sel?.seriesId) return false;
    const want = String(sel.seriesId).trim();
    return seriesSlug(series) === want || String(series.id) === want;
  }

  function resolveUserHandleInCollection(series, sel) {
    if (!series || !sel || !selectionMatchesSeries(series, sel)) return null;
    const modelId = String(sel.modelId || '').trim();
    if (modelId) {
      const fromModels = findSeriesModel(series, modelId);
      if (fromModels) return fromModels;
    }
    const hid = Number(sel.handleItemId) || 0;
    const fullList = Array.isArray(__catalogFull?.series) ? __catalogFull.series : [];
    let child = null;
    if (hid > 0) {
      child = fullList.find((s) => Number(s?.id) === hid) || null;
    }
    if (!child && modelId) {
      const cid = Number(series.id) || 0;
      child =
        fullList.find((s) => {
          if (Number(s?.parentCollectionId) !== cid) return false;
          return legacyModelCodeFromHandle(s) === modelId || seriesSlug(s) === modelId;
        }) || null;
    }
    if (!child) return null;
    const sizes = Array.isArray(child.sizes) ? child.sizes : [];
    const s0 = sizes[0] || {};
    const variant0 = Array.isArray(child.variants) && child.variants[0] ? child.variants[0] : null;
    return {
      id: legacyModelCodeFromHandle(child),
      cabinetModelId: Number(child.cabinetModelId) || 0,
      barLengthMm: Number(s0.width) || Number(variant0?.barLengthMm) || 0,
      modelPath: String(child?.modelParams?.modelPath || child?.modelParams?.model || '').trim() || null,
      childItem: child,
    };
  }

  function mergeUserModelIntoSpec(spec, userModel) {
    if (!userModel || !spec || spec.noHandle) return spec;
    if (spec.sizePick || (Array.isArray(spec.modelIds) && spec.modelIds.length)) return spec;
    const modelId = String(userModel.id || '').trim();
    if (!modelId) return spec;
    return { ...spec, modelId };
  }

  function applyUserHandleOverride(base, userModel) {
    if (!userModel || base?.skip) return base;
    const cabinetModelId = Number(userModel.cabinetModelId) || Number(base.cabinetModelId) || 0;
    const barLengthMm = Number(userModel.barLengthMm) || Number(base.variant?.barLengthMm) || 0;
    const modelPath = String(userModel.modelPath || base.modelPath || '').trim() || base.modelPath;
    return {
      ...base,
      skip: false,
      cabinetModelId: cabinetModelId || base.cabinetModelId,
      modelPath,
      variant: cabinetModelId
        ? { cabinetModelId, barLengthMm }
        : base.variant,
      userHandlePick: userModel,
    };
  }

  function findSeriesById(seriesId) {
    const want = String(seriesId || '').trim();
    if (!want) return null;
    const list = __catalog?.series || [];
    const fromCache = list.find(
      (s) =>
        seriesSlug(s) === want ||
        String(s.id) === want ||
        (want.startsWith('/models/') &&
          String(s?.modelParams?.modelPath || '').trim() === want) ||
        (String(s?.name || '').trim() && String(s.name).trim() === want)
    );
    if (fromCache) return fromCache;
    if (/volna/i.test(want)) {
      const volna = list.find(
        (s) =>
          /volna/i.test(seriesSlug(s)) ||
          /volna/i.test(String(s?.modelParams?.modelPath || '')) ||
          /волна/i.test(String(s?.name || ''))
      );
      if (volna) return volna;
    }
    return HANDLES_FALLBACK[want] || (/volna/i.test(want) ? HANDLES_FALLBACK.volna : null);
  }

  function pickVariant(series, productKind) {
    const variants = Array.isArray(series?.variants) ? series.variants : [];
    if (!variants.length) return null;
    const role = String(productKind || 'wardrobe').toLowerCase();
    return (
      variants.find((v) => Array.isArray(v.roles) && v.roles.map((r) => String(r).toLowerCase()).includes(role)) ||
      variants[0]
    );
  }

  function normalizeLayoutRoleKey(raw) {
    return String(raw || '')
      .trim()
      .toLowerCase()
      .replace(/-/g, '_');
  }

  /** Комната иногда передаёт standalone_floor; в placementRules — pedestal. */
  function normalizeProductKindForPlacementRules(raw) {
    const pk = String(raw || 'wardrobe').toLowerCase().trim();
    if (pk === 'standalone_floor') return 'pedestal';
    return pk || 'wardrobe';
  }

  function ruleMatchField(ruleVal, ctxVal) {
    if (ruleVal == null || (Array.isArray(ruleVal) && !ruleVal.length)) return true;
    const arr = Array.isArray(ruleVal) ? ruleVal : [ruleVal];
    const cv = String(ctxVal || '').toLowerCase();
    return arr.some((v) => String(v).toLowerCase() === cv);
  }

  /** Тумба/навесной: в каталоге часто facades_main, в правиле — facades. */
  function layoutRoleMatchesForHandle(ruleLayoutRole, ctxLayoutRole, ctxProductKind) {
    if (ruleMatchField(ruleLayoutRole, ctxLayoutRole)) return true;
    const pk = String(ctxProductKind || '').toLowerCase();
    if (!LOW_FURNITURE_PRODUCT_KINDS.has(pk)) return false;
    const ctx = normalizeLayoutRoleKey(ctxLayoutRole);
    const rules = Array.isArray(ruleLayoutRole)
      ? ruleLayoutRole
      : ruleLayoutRole != null
        ? [ruleLayoutRole]
        : [];
    const swingFacade = new Set(['facades', 'facades_main']);
    for (const r of rules) {
      const rr = normalizeLayoutRoleKey(r);
      if (!rr) continue;
      if (swingFacade.has(rr) && swingFacade.has(ctx)) return true;
    }
    return false;
  }

  function matchPlacementRule(rule, ctx) {
    if (!rule || typeof rule !== 'object') return false;
    const m = rule.match && typeof rule.match === 'object' ? rule.match : rule;
    if (!layoutRoleMatchesForHandle(m.layoutRole, ctx.layoutRole, ctx.productKind)) return false;
    if (!ruleMatchField(m.productKind, ctx.productKind)) return false;
    if (!ruleMatchField(m.doorKind, ctx.doorKind)) return false;
    return true;
  }

  function findSeriesModel(series, modelId) {
    const id = String(modelId || '').trim();
    if (!id) return null;
    const models = Array.isArray(series?.models) ? series.models : [];
    return models.find((m) => String(m?.id) === id) || null;
  }

  function pickModelBySizePick(series, rule, ctx) {
    const pick = String(rule.sizePick || '').toLowerCase();
    const ids = Array.isArray(rule.modelIds) ? rule.modelIds : [];
    const models = ids.map((id) => findSeriesModel(series, id)).filter(Boolean);
    if (!models.length) return null;
    const sorted = models.slice().sort((a, b) => (Number(b.barLengthMm) || 0) - (Number(a.barLengthMm) || 0));
    const offset = DEFAULT_HANDLE_OFFSET_MM;
    if (pick === 'fit_height') {
      const fh = Math.max(0, Number(ctx.facadeHeightMm) || 0);
      const maxFit = fh > 0 ? fh - 2 * offset : Infinity;
      for (const m of sorted) {
        const len = Number(m.barLengthMm) || 0;
        if (len > 0 && len <= maxFit && len >= 64) return m;
      }
      return sorted[sorted.length - 1] || null;
    }
    if (pick === 'fit_width') {
      const fw = Math.max(0, Number(ctx.facadeWidthMm) || 0);
      const maxFit = fw > 0 ? fw - 2 * offset : Infinity;
      for (const m of sorted) {
        const len = Number(m.barLengthMm) || 0;
        if (len > 0 && len <= maxFit && len >= 64) return m;
      }
      return sorted[sorted.length - 1] || null;
    }
    return sorted[0] || null;
  }

  function resolveOrientationFromRule(rule, series, fallbackVertical) {
    const o = String(rule?.orientation || '').toLowerCase();
    if (o === 'horizontal') return false;
    if (o === 'vertical') return true;
    if (o === 'any') return !!fallbackVertical;
    if (isKnobHandleSeries(series)) return true;
    return fallbackVertical;
  }

  function applyPlacementSpec(series, spec, ctx, fallbackVertical) {
    if (spec?.noHandle) {
      return { skip: true, reason: 'placement_no_handle', spec };
    }
    let modelRec = null;
    if (spec?.modelId) modelRec = findSeriesModel(series, spec.modelId);
    if (!modelRec && Number(spec?.cabinetModelId) > 0) {
      modelRec = {
        cabinetModelId: Number(spec.cabinetModelId),
        barLengthMm: Number(spec.barLengthMm) || 0,
      };
    }
    if (!modelRec && (spec?.sizePick || spec?.modelIds)) {
      modelRec = pickModelBySizePick(series, spec, ctx);
    }
    const vertical = resolveOrientationFromRule(spec, series, fallbackVertical);
    return {
      skip: false,
      cabinetModelId: Number(modelRec?.cabinetModelId) || 0,
      barLengthMm: Number(modelRec?.barLengthMm) || 0,
      vertical,
      position: spec?.position && typeof spec.position === 'object' ? spec.position : null,
      variant: modelRec
        ? { cabinetModelId: Number(modelRec.cabinetModelId) || 0, barLengthMm: Number(modelRec.barLengthMm) || 0 }
        : null,
      spec,
    };
  }

  /**
   * Шаг 6 = коллекция; на фасаде — placementRules / defaults (роль, тип изделия, дверь).
   */
  function resolveForFacade(seriesId, ctx) {
    const facadeCtx = {
      layoutRole: normalizeLayoutRoleKey(ctx?.layoutRole),
      productKind: normalizeProductKindForPlacementRules(ctx?.productKind),
      doorKind: String(ctx?.doorKind || 'rotate').toLowerCase() === 'slide' ? 'slide' : 'rotate',
      facadeWidthMm: Math.max(0, Number(ctx?.facadeWidthMm) || 0),
      facadeHeightMm: Math.max(0, Number(ctx?.facadeHeightMm) || 0),
    };
    const base = resolveSync(seriesId, facadeCtx.productKind);
    if (base.skip) return base;

    const series = base.series;
    const rules = Array.isArray(series?.placementRules) ? series.placementRules : [];
    for (const rule of rules) {
      if (!matchPlacementRule(rule, facadeCtx)) continue;
      const placed = applyPlacementSpec(series, rule, facadeCtx, base.vertical);
      if (placed.skip) {
        handleLog('resolveForFacade skip', { seriesId, ctx: facadeCtx, reason: placed.reason, rule });
        return { ...base, skip: true, reason: placed.reason, placementRule: rule };
      }
      const pos = placed.position;
      const out = {
        ...base,
        skip: false,
        cabinetModelId: placed.cabinetModelId || base.cabinetModelId,
        vertical: placed.vertical,
        variant: placed.variant || base.variant,
        barLengthMm: Number(placed.barLengthMm) || Number(placed.variant?.barLengthMm) || 0,
        positionAnchor: pos?.anchor || null,
        positionOffsetMm: pos?.offsetMm != null ? Number(pos.offsetMm) : null,
        positionEdgeOffsetMm: pos?.edgeOffsetMm != null ? Number(pos.edgeOffsetMm) : null,
        placementRule: rule,
        placementModelId: rule?.modelId || placed.spec?.modelId || null,
      };
      handleLog('resolveForFacade matched', {
        seriesId,
        ctx: facadeCtx,
        cabinetModelId: out.cabinetModelId,
        barLengthMm: out.barLengthMm,
        modelId: out.placementModelId,
        vertical: out.vertical,
        position: pos,
        ruleMatch: rule?.match || null,
      });
      return out;
    }

    const defs = series?.defaults;
    if (defs && typeof defs === 'object') {
      const placed = applyPlacementSpec(series, defs, facadeCtx, base.vertical);
      if (placed.skip) {
        return { ...base, skip: true, reason: 'defaults_no_handle' };
      }
      const pos = placed.position;
      const out = {
        ...base,
        skip: false,
        cabinetModelId: placed.cabinetModelId || base.cabinetModelId,
        vertical: placed.vertical,
        variant: placed.variant || base.variant,
        barLengthMm: Number(placed.barLengthMm) || Number(placed.variant?.barLengthMm) || 0,
        positionAnchor: pos?.anchor || null,
        positionOffsetMm: pos?.offsetMm != null ? Number(pos.offsetMm) : null,
        positionEdgeOffsetMm: pos?.edgeOffsetMm != null ? Number(pos.edgeOffsetMm) : null,
        fromDefaults: true,
      };
      handleLog('resolveForFacade defaults fallback', {
        seriesId,
        ctx: facadeCtx,
        vertical: out.vertical,
        cabinetModelId: out.cabinetModelId,
        position: pos,
        warning: 'no placementRule matched — check layoutRole/productKind',
      });
      return out;
    }

    handleLog('resolveForFacade no rule', {
      seriesId,
      ctx: facadeCtx,
      rulesCount: rules.length,
      baseVertical: base.vertical,
    });
    const drawerFallback = resolveDrawerPlacementFallback(series, facadeCtx, base);
    if (drawerFallback) {
      handleLog('resolveForFacade drawer fallback', {
        seriesId,
        ctx: facadeCtx,
        vertical: drawerFallback.vertical,
        cabinetModelId: drawerFallback.cabinetModelId,
        positionAnchor: drawerFallback.positionAnchor,
      });
      return drawerFallback;
    }
    return base;
  }

  /** Ящик: если в коллекции нет placementRule drawer — горизонтально, 30 мм от верха. */
  function resolveDrawerPlacementFallback(series, facadeCtx, base) {
    if (!series || base?.skip) return null;
    if (facadeCtx.layoutRole !== 'drawer') return null;
    const pk = facadeCtx.productKind;
    if (!LOW_FURNITURE_PRODUCT_KINDS.has(pk) && facadeCtx.doorKind !== 'slide') return null;

    const models = Array.isArray(series.models) ? series.models : [];
    const spec = {
      orientation: 'horizontal',
      position: { anchor: 'top_center', offsetMm: DEFAULT_HANDLE_OFFSET_MM },
    };
    if (models[0]?.id) spec.modelId = models[0].id;
    else if (Number(base.cabinetModelId) > 0) spec.cabinetModelId = base.cabinetModelId;

    const placed = applyPlacementSpec(series, spec, facadeCtx, false);
    if (placed.skip) return null;
    const pos = placed.position;
    return {
      ...base,
      skip: false,
      cabinetModelId: placed.cabinetModelId || base.cabinetModelId,
      vertical: placed.vertical,
      variant: placed.variant || base.variant,
      barLengthMm: Number(placed.barLengthMm) || Number(placed.variant?.barLengthMm) || 0,
      positionAnchor: pos?.anchor || null,
      positionOffsetMm: pos?.offsetMm != null ? Number(pos.offsetMm) : null,
      positionEdgeOffsetMm: pos?.edgeOffsetMm != null ? Number(pos.edgeOffsetMm) : null,
      fromDrawerFallback: true,
    };
  }

  /**
   * Цельная дверь: одна ручка по правилу facades_main на всю высоту полотна
   * (антресоль в каталоге noHandle — не симулируем вторую полосу).
   * @returns {Array<{ layoutRole: string, bandHeightMm: number, yOffsetMm: number, resolved: object }>}
   */
  function resolveUnifiedFacadeHandlePlacements(seriesId, ctx) {
    ctx = ctx || {};
    const fullH = Math.max(1, Number(ctx.facadeHeightMm) || 0);
    const resolved = resolveForFacade(seriesId, {
      productKind: ctx.productKind,
      doorKind: ctx.doorKind,
      layoutRole: 'facades_main',
      facadeWidthMm: Math.max(0, Number(ctx.facadeWidthMm) || 0),
      facadeHeightMm: fullH,
    });
    if (!resolved || resolved.skip) return [];
    return [
      {
        layoutRole: 'facades_main',
        bandHeightMm: fullH,
        yOffsetMm: 0,
        resolved,
      },
    ];
  }

  function resolveHandleCatalogDims(series) {
    const s0 = Array.isArray(series?.sizes) && series.sizes[0] ? series.sizes[0] : {};
    const profileHeightMm = Number(s0.height) || 0;
    const profileDepthMm = Number(s0.depth) || 0;
    const barLengthMm = Number(s0.width) || 0;
    if (isKnobHandleSeries(series)) {
      const face = Math.max(barLengthMm, profileHeightMm);
      return {
        knob: true,
        barLengthMm: 0,
        profileHeightMm: face >= 4 ? face : 0,
        profileDepthMm: profileDepthMm >= 4 ? profileDepthMm : 0,
      };
    }
    // Реф Handle + handles_catalog: width = длина скобы, height/depth = сечение (35×14 мм).
    return {
      barLengthMm: barLengthMm >= 40 ? barLengthMm : DEFAULT_VERTICAL_BAR_HEIGHT_MM,
      profileHeightMm: profileHeightMm >= 4 ? profileHeightMm : 35,
      profileDepthMm: profileDepthMm >= 4 ? profileDepthMm : 14,
    };
  }

  /**
   * Длина вертикальной скобы (мм). Реф: sizes[].width, min с высотой фасада.
   */
  function resolveHandleBarLengthMm(facadeHeightMm, series, variant, rules) {
    if (isKnobHandleSeries(series)) return 0;
    const dims = resolveHandleCatalogDims(series);
    const br = rules || DEFAULT_BAR_RULES;
    return Number(variant?.barLengthMm) || dims.barLengthMm || Number(br.min_mm) || DEFAULT_VERTICAL_BAR_HEIGHT_MM;
  }

  /**
   * Длина вертикальной скобы с учётом высоты фасада и позиции (offsetMm ≠ margin для cap).
   */
  function resolveVerticalBarFitLengthMm(catalogBarMm, facadeHeightMm, opts) {
    return Math.max(0, Number(catalogBarMm) || 0);
  }

  /** Горизонтальная скоба: фиксированная длина из каталога. */
  function resolveHorizontalBarFitLengthMm(catalogBarMm, facadeWidthMm) {
    return Math.max(0, Number(catalogBarMm) || 0);
  }

  function resolveBarHeightMm(facadeHeightMm, series, variant, rules) {
    return resolveHandleBarLengthMm(facadeHeightMm, series, variant, rules);
  }

  /** Ширина горизонтальной скобы (мм) — фиксированная из каталога. */
  function resolveBarWidthMm(facadeWidthMm, series, variant, rules) {
    if (isVerticalHandleSeries(series)) {
      const sizes = Array.isArray(series?.sizes) ? series.sizes : [];
      const sw = Number(sizes[0]?.width) || Number(sizes[0]?.depth) || 0;
      return sw >= 4 ? sw : 12;
    }
    const dims = resolveHandleCatalogDims(series);
    const br = rules || DEFAULT_BAR_RULES;
    return Number(variant?.barLengthMm) || dims.barLengthMm || Number(br.min_mm) || 128;
  }

  /** Ручки в комнате — preview-default уже с шага 4. */
  function shouldAttachHandlesInRoom() {
    const step = Number(global.currentRoomStep) || 0;
    return step >= 4;
  }

  /**
   * Разрешить ручку на фасаде в комнате.
   * catalog_28: handle.enabled 0 = ручка не вшита в шаблон (ставится на шаге 6 из коллекции).
   * Явный запрет — no_handle / no_handle_forced или enabled только до шага 6 (превью).
   */
  function isHandleEnabledOnFacade(item) {
    if (item?.no_handle_forced || item?.spec?.no_handle) return false;
    const h = item?.spec?.handle;
    if (h && typeof h === 'object') {
      if (h.no_handle === 1 || h.no_handle === true) return false;
      if (shouldAttachHandlesInRoom()) return true;
      const en = h.enabled;
      if (en === 0 || en === '0' || en === false) return false;
    }
    return true;
  }

  function resolveHandleOffsetMm(item) {
    const spec = item?.spec || {};
    const h = spec.handle;
    const raw =
      h?.offset ??
      spec.handle_offset ??
      spec.handleOffset ??
      item?.handle_offset ??
      item?.handleOffset;
    const v = raw != null ? Number(raw) : DEFAULT_HANDLE_OFFSET_MM;
    return Number.isFinite(v) && v >= 0 ? v : DEFAULT_HANDLE_OFFSET_MM;
  }

  function bboxSizeMm(root) {
    const THREE = global.THREE;
    if (!root || !THREE) return { x: 0, y: 0, z: 0 };
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return { x: 0, y: 0, z: 0 };
    const s = box.getSize(new THREE.Vector3());
    return { x: s.x, y: s.y, z: s.z };
  }

  function centerObjectAtOrigin(root) {
    const THREE = global.THREE;
    if (!root || !THREE) return;
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return;
    const c = box.getCenter(new THREE.Vector3());
    root.position.sub(c);
  }

  function stretchRootXToWidthMm(root, targetWidthMm) {
    const THREE = global.THREE;
    if (!root || !THREE || !(targetWidthMm > 0)) return bboxSizeMm(root);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return { x: 0, y: 0, z: 0 };
    const size = box.getSize(new THREE.Vector3());
    if (size.x < 1e-6) return { x: 0, y: 0, z: 0 };
    const sx = targetWidthMm / size.x;
    root.scale.x *= sx;
    root.updateMatrixWorld(true);
    centerObjectAtOrigin(root);
    return bboxSizeMm(root);
  }

  /** Ручка: масштаб по осям до мм из handles.json (до rotation.z на группе). */
  function scaleHandleToCatalogMm(root, barLengthMm, profileHeightMm, profileDepthMm) {
    const THREE = global.THREE;
    if (!root || !THREE) return bboxSizeMm(root);
    const bar = Math.max(Number(barLengthMm) || 0, 1e-6);
    const ph = Math.max(Number(profileHeightMm) || 0, 1e-6);
    const pd = Math.max(Number(profileDepthMm) || 0, 1e-6);
    root.rotation.set(0, 0, 0);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return { x: 0, y: 0, z: 0 };
    const size = box.getSize(new THREE.Vector3());
    let longA = 'x';
    let s1 = 'y';
    let s2 = 'z';
    let t1 = ph;
    let t2 = pd;
    if (size.y >= size.x && size.y >= size.z) {
      longA = 'y';
      s1 = 'x';
      s2 = 'z';
    } else if (size.z >= size.x && size.z >= size.y) {
      longA = 'z';
      s1 = 'x';
      s2 = 'y';
    }
    if (size[longA] > 1e-8) root.scale[longA] *= bar / size[longA];
    if (size[s1] > 1e-8) root.scale[s1] *= t1 / size[s1];
    if (size[s2] > 1e-8) root.scale[s2] *= t2 / size[s2];
    root.updateMatrixWorld(true);
    centerObjectAtOrigin(root);
    const out = bboxSizeMm(root);
    out.barLengthMm = bar;
    out.profileHeightMm = ph;
    out.profileDepthMm = pd;
    return out;
  }

  /** После scaleHandleToCatalogMm: горизонталь на фасаде = поворот вертикальной модели на 90°. */
  function applyRoomHandleOrientationFromVerticalCatalog(root, vertical) {
    if (!root || vertical) return bboxSizeMm(root);
    root.rotation.z = HANDLE_ROOM_HORIZONTAL_ROT_Z;
    root.updateMatrixWorld(true);
    centerObjectAtOrigin(root);
    return bboxSizeMm(root);
  }

  function stretchRootYToHeightMm(root, targetHeightMm) {
    const THREE = global.THREE;
    if (!root || !THREE || !(targetHeightMm > 0)) return bboxSizeMm(root);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return { x: 0, y: 0, z: 0 };
    const size = box.getSize(new THREE.Vector3());
    if (size.y < 1e-6) return { x: 0, y: 0, z: 0 };
    const sy = targetHeightMm / size.y;
    root.scale.y *= sy;
    root.updateMatrixWorld(true);
    centerObjectAtOrigin(root);
    return bboxSizeMm(root);
  }

  function normalizeDoorDirection(raw) {
    const d = String(raw || 'ly').toLowerCase().trim();
    if (d === 'ry' || d === 'rz') return 'right';
    if (d === 'rx' || d === 'lx') return d;
    return 'left';
  }

  /**
   * Вертикальная ручка на свободном крае. Точка отсчёта — центр ручки.
   * edgeOffsetMm — от свободного края до центра; vertOffsetMm — от низа или верха до центра.
   */
  function computeVerticalHandlePositionMm(opts, verticalAlign) {
    const w = Number(opts.facadeWidthMm) || 0;
    const h = Number(opts.facadeHeightMm) || 0;
    const d = Number(opts.thicknessMm) || 16;
    const edgeOffset = resolveHandleEdgeOffsetMm(opts);
    const vertOffset = resolveHandleVertOffsetMm(opts);
    const handleSize = opts.handleSizeMm || { x: 0, y: 0, z: 0 };
    const dims = opts.handleDims || {};
    const hd = Number(handleSize.z) || Number(dims.profileDepthMm) || 22;
    const side = normalizeDoorDirection(opts.doorDirection);
    const x = side === 'right' ? edgeOffset : w - edgeOffset;
    const align = String(verticalAlign || 'bottom').toLowerCase();
    const y =
      align === 'center' ? h / 2 : align === 'top' ? h - vertOffset : vertOffset;
    const z = d + hd / 2;
    return { x, y, z, rotationZ: 0 };
  }

  /**
   * Горизонтальная скоба — по центру ширины, сверху или снизу. Точка отсчёта — центр ручки.
   */
  function computeHorizontalBarPositionMm(opts, vAlign) {
    const w = Number(opts.facadeWidthMm) || 0;
    const h = Number(opts.facadeHeightMm) || 0;
    const d = Number(opts.thicknessMm) || 16;
    const vertOffset = resolveHandleVertOffsetMm(opts);
    const handleSize = opts.handleSizeMm || { x: 0, y: 0, z: 0 };
    const hd = Number(handleSize.z) || Number(handleSize.y) || 14;
    const x = w / 2;
    const align = String(vAlign || 'bottom').toLowerCase();
    const y = align === 'top' ? h - vertOffset : vertOffset;
    const z = d + hd / 2;
    return { x, y, z, rotationZ: 0 };
  }

  function resolveHandleVertOffsetMm(opts) {
    const v = opts.handleOffsetMm ?? opts.vertOffsetMm ?? DEFAULT_HANDLE_OFFSET_MM;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_HANDLE_OFFSET_MM;
  }

  function resolveHandleEdgeOffsetMm(opts) {
    const v =
      opts.edgeOffsetMm != null
        ? opts.edgeOffsetMm
        : opts.handleOffsetMm != null
          ? opts.handleOffsetMm
          : DEFAULT_HANDLE_OFFSET_MM;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_HANDLE_OFFSET_MM;
  }

  /** @deprecated Используйте computeHorizontalBarPositionMm; оставлено для fallback в ClodisBuilder. */
  function computeBarHandlePositionMm(opts) {
    return computeHorizontalBarPositionMm(opts, 'bottom');
  }

  /** Старый anchor center и пустой якорь → актуальные ключи (без геометрического центра фасада). */
  function normalizePlacementAnchor(rawAnchor, vertical, productKind) {
    const a = String(rawAnchor || '').toLowerCase().trim();
    const pk = String(productKind || '').toLowerCase();
    if (!a) {
      if (!vertical && LOW_FURNITURE_PRODUCT_KINDS.has(pk)) return 'top_center';
      return vertical ? 'free_edge_height_center' : 'bottom_center';
    }
    if (a === 'center') {
      if (vertical) return 'free_edge_height_center';
      if (LOW_FURNITURE_PRODUCT_KINDS.has(pk)) return 'top_center';
      return 'bottom_center';
    }
    if (a === 'free_edge_vertical_center') return 'free_edge_height_center';
    if (!vertical && a === 'free_edge_height_center') {
      return LOW_FURNITURE_PRODUCT_KINDS.has(pk) ? 'top_center' : 'bottom_center';
    }
    if (vertical && a === 'top_center' && LOW_FURNITURE_PRODUCT_KINDS.has(pk)) {
      return 'top_free_edge';
    }
    if (!vertical && a === 'bottom_free_edge') return 'bottom_center';
    if (!vertical && a === 'top_free_edge') return 'top_center';
    return a;
  }

  /** Позиция по якорю из админки (placementRules / defaults). */
  function computeHandlePositionMm(opts) {
    const vertical = !!opts.vertical;
    const productKind = String(opts.productKind || '').toLowerCase();
    const anchor = normalizePlacementAnchor(opts.positionAnchor, vertical, productKind);
    if (vertical) {
      if (anchor === 'top_free_edge') {
        return computeVerticalHandlePositionMm(opts, 'top');
      }
      if (anchor === 'free_edge_height_center') {
        return computeVerticalHandlePositionMm(opts, 'center');
      }
      return computeVerticalHandlePositionMm(opts, 'bottom');
    }
    if (anchor === 'top_center') {
      return computeHorizontalBarPositionMm(opts, 'top');
    }
    return computeHorizontalBarPositionMm(opts, 'bottom');
  }

  function readRoomStepsConfig() {
    try {
      const cfgRaw = global.localStorage?.getItem('room_steps_config');
      const cfg = cfgRaw ? JSON.parse(cfgRaw) : null;
      return cfg && typeof cfg === 'object' ? cfg : null;
    } catch (_) {
      return null;
    }
  }

  function isModelAssetPath(v) {
    const s = String(v || '').trim();
    return s.startsWith('/models/') && /\.(fbx|glb|gltf)$/i.test(s);
  }

  function inferCabinetModelIdFromPath(modelPath) {
    const p = String(modelPath || '').toLowerCase();
    if (p.indexOf('ruchka_volna') >= 0 || p.indexOf('volna_320') >= 0) return 13;
    if (p.indexOf('volna') >= 0) return 3;
    return 0;
  }

  function step6ItemModelPath(it) {
    if (!it || typeof it !== 'object') return '';
    const explicit = String(it.modelPath || it.modelUrl || '').trim();
    if (explicit) return explicit;
    const key = String(it.key || it.seriesId || '').trim();
    if (isModelAssetPath(key)) return key;
    return '';
  }

  function matchStep6Item(want, it) {
    const k = String(it?.key || it?.seriesId || it?.id || '').trim();
    const name = String(it?.name || '').trim();
    const mp = step6ItemModelPath(it);
    if (!want) return false;
    if (k === want || String(it?.id) === want || (name && name === want)) return true;
    if (mp && (mp === want || want === k)) return true;
    if (isModelAssetPath(want) && isModelAssetPath(k) && want === k) return true;
    if (isModelAssetPath(want) && mp === want) return true;
    if (
      (isModelAssetPath(want) || isModelAssetPath(k) || /volna/i.test(want)) &&
      mp &&
      /volna/i.test(mp) &&
      /volna/i.test(want)
    ) {
      return true;
    }
    return false;
  }

  /** Настройки шага 6 (админка): cabinetModelId + modelPath, даже если key = путь к FBX. */
  function readStep6ItemOverride(seriesId) {
    const want = String(seriesId || '').trim();
    if (!want) return null;
    const cfg = readRoomStepsConfig();
    const step6 = cfg?.steps?.find((s) => s.stepId === 6);
    const items = Array.isArray(step6?.items) ? step6.items : [];
    for (const it of items) {
      if (!matchStep6Item(want, it)) continue;
      const key = String(it.key || it.seriesId || '').trim();
      const modelPath = step6ItemModelPath(it);
      let cabinetModelId = Number(it.cabinetModelId) || 0;
      if (!cabinetModelId && modelPath) cabinetModelId = inferCabinetModelIdFromPath(modelPath);
      return {
        key: isModelAssetPath(key) ? '' : key,
        name: String(it.name || '').trim(),
        kind: it.kind || 'knob',
        cabinetModelId,
        modelPath,
      };
    }
    if (isModelAssetPath(want)) {
      return {
        key: '',
        name: '',
        kind: 'knob',
        cabinetModelId: inferCabinetModelIdFromPath(want),
        modelPath: want,
      };
    }
    return null;
  }

  function readStep6CabinetModelOverride(seriesId) {
    const o = readStep6ItemOverride(seriesId);
    return o?.cabinetModelId > 0 ? o.cabinetModelId : 0;
  }

  function syntheticSeriesFromStep6(step6Item, modelPath) {
    const path = String(modelPath || step6Item?.modelPath || '').trim();
    if (!path) return null;
    return {
      id: step6Item?.key || path,
      key: step6Item?.key || path,
      name: step6Item?.name || 'Ручка',
      kind: step6Item?.kind || 'knob',
      sizeType: 'normal',
      noHandle: false,
      modelParams: {
        modelType: 'normal',
        modelPath: path,
      },
    };
  }

  function resolveSync(seriesId, productKind) {
    const want = String(seriesId || '').trim();
    const step6 = readStep6ItemOverride(want);
    let series = findSeriesById(want);
    if (!series && step6?.modelPath) {
      series =
        (step6.key ? findSeriesById(step6.key) : null) ||
        syntheticSeriesFromStep6(step6, step6.modelPath);
    }
    if (!series && isModelAssetPath(want)) {
      series = syntheticSeriesFromStep6(step6 || {}, want);
    }
    if (!series || series.noHandle || series.kind === 'push') {
      handleLog('resolveSync skip', { seriesId: want, reason: 'no_handle', seriesFound: !!series, step6 });
      return { skip: true, reason: 'no_handle' };
    }
    const variant = pickVariant(series, productKind);
    let cabinetModelId = Number(variant?.cabinetModelId) || 0;
    if (!cabinetModelId) cabinetModelId = Number(series?.cabinetModelId) || 0;
    if (!cabinetModelId) cabinetModelId = Number(series?.modelParams?.cabinetModelId) || 0;
    if (!cabinetModelId && step6?.cabinetModelId > 0) cabinetModelId = step6.cabinetModelId;
    if (!cabinetModelId) cabinetModelId = readStep6CabinetModelOverride(want);
    let modelPath = String(series?.modelParams?.modelPath || series?.modelParams?.model || '').trim();
    if (!modelPath && step6?.modelPath) modelPath = step6.modelPath;
    if (!cabinetModelId && modelPath) cabinetModelId = inferCabinetModelIdFromPath(modelPath);
    if (!cabinetModelId && !modelPath) {
      handleLog('resolveSync skip', { seriesId: want, reason: 'no_model', seriesName: series.name, step6 });
      return { skip: true, reason: 'no_model' };
    }
    const sizeType = resolveModelSizeType(series);
    const vertical = isVerticalHandleSeries(series);
    const out = {
      skip: false,
      series,
      variant,
      cabinetModelId,
      modelPath,
      sizeType,
      vertical,
      kind: series.kind || 'bar',
      barRules: readBarRules(),
    };
    handleLog('resolveSync ok', {
      seriesId: want,
      name: series.name,
      cabinetModelId,
      modelPath: modelPath || null,
      sizeType,
      vertical,
      fromStep6: !!step6,
    });
    return out;
  }

  function ensureCatalogWarm() {
    loadHandlesCatalog().catch(() => {});
    loadHandlesCatalogFull().catch(() => {});
  }

  async function fetchCabinetModelItemById(id) {
    const want = String(id || '').trim();
    if (!want) return null;
    let items = [];
    try {
      const r = await fetch('/api/catalog/items_get/cabinet_model?t=' + Date.now(), { cache: 'no-store' });
      if (r.ok) {
        const p = await r.json();
        items = Array.isArray(p) ? p : Array.isArray(p?.items) ? p.items : [];
      }
    } catch (_) {}
    if (!items.length) {
      try {
        const r2 = await fetch('/catalog_items/cabinet_model.json', { cache: 'no-store' });
        if (r2.ok) {
          const local = await r2.json();
          items = Array.isArray(local) ? local : Array.isArray(local?.items) ? local.items : [];
        }
      } catch (_) {}
    }
    return items.find((it) => String(it?.id) === want) || null;
  }

  function readCabinetModelItemDims(item) {
    if (!item || typeof item !== 'object') return null;
    let modelEntry = null;
    try {
      const d = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
      const models = d?.params?.models;
      if (Array.isArray(models) && models[0]) modelEntry = models[0];
    } catch (_) {}
    const mp = modelEntry?.params && typeof modelEntry.params === 'object' ? modelEntry.params : {};
    const sc = mp.scale && typeof mp.scale === 'object' ? mp.scale : null;
    const rot = mp.rot && typeof mp.rot === 'object' ? mp.rot : null;
    const wx = Number(item.width);
    const hy = Number(item.height);
    const dz = Number(item.depth);
    return {
      id: item.id,
      name: item.name,
      sizeMm: {
        x: Number.isFinite(wx) ? wx : 0,
        y: Number.isFinite(hy) ? hy : 0,
        z: Number.isFinite(dz) ? dz : 0,
      },
      modelUrl: String(modelEntry?.model || '').trim() || null,
      catalogScaleRaw: sc ? { x: Number(sc.x), y: Number(sc.y), z: Number(sc.z) } : null,
      catalogScaleFactor:
        sc && Number(sc.x) > 0 ? { x: Number(sc.x) / 100, y: Number(sc.y) / 100, z: Number(sc.z) / 100 } : null,
      catalogRotDeg: rot ? { x: Number(rot.x), y: Number(rot.y), z: Number(rot.z), order: rot.order || 'XYZ' } : null,
    };
  }

  function cabinetModelSizeToHandlePlacement(sizeMm, facadeHeightMm, opts) {
    const wx = Number(sizeMm?.x) || 0;
    const hy = Number(sizeMm?.y) || 0;
    const dz = Number(sizeMm?.z) || 0;
    const knob =
      !!(opts && opts.knob) ||
      (Math.max(wx, hy, dz) > 0 && Math.max(wx, hy, dz) <= 80 && Math.min(wx, hy, dz) >= 4);
    if (knob) {
      return {
        knob: true,
        sizeMm: { x: wx, y: hy, z: dz },
        catalogBarMm: 0,
        barLengthMm: 0,
        profileHeightMm: wx > 0 ? wx : hy,
        profileDepthMm: dz > 0 ? dz : 14,
      };
    }
    const catalogBarMm = hy > 0 ? hy : Math.max(wx, dz);
    const fitBarMm = catalogBarMm;
    return {
      sizeMm: { x: wx, y: fitBarMm, z: dz },
      catalogBarMm,
      barLengthMm: fitBarMm,
      profileHeightMm: wx > 0 ? wx : 14,
      profileDepthMm: dz > 0 ? dz : 22,
    };
  }

  /** Кнопка: фиксированные мм из cabinet_model (без растяжения «скобы» по фасаду). */
  function scaleKnobToCabinetMm(root, sizeMm) {
    const THREE = global.THREE;
    if (!root || !THREE) return bboxSizeMm(root);
    const tx = Math.max(Number(sizeMm?.x) || 20, 1);
    const ty = Math.max(Number(sizeMm?.y) || 20, 1);
    const tz = Math.max(Number(sizeMm?.z) || 34, 1);
    root.rotation.set(0, 0, 0);
    root.scale.set(1, 1, 1);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return { x: 0, y: 0, z: 0 };
    const size = box.getSize(new THREE.Vector3());
    if (size.x > 1e-8) root.scale.x *= tx / size.x;
    if (size.y > 1e-8) root.scale.y *= ty / size.y;
    if (size.z > 1e-8) root.scale.z *= tz / size.z;
    root.updateMatrixWorld(true);
    centerObjectAtOrigin(root);
    return bboxSizeMm(root);
  }

  async function resolveHandleCabinetModelDims(cabinetModelId, facadeHeightMm) {
    const id = String(Number(cabinetModelId) || 3);
    const item = await fetchCabinetModelItemById(id);
    const rec = readCabinetModelItemDims(item);
    if (!rec?.sizeMm) {
      const fallback = cabinetModelSizeToHandlePlacement({ x: 14, y: 960, z: 22 }, facadeHeightMm);
      return {
        cabinetModelId: Number(id) || 3,
        source: 'fallback_id3',
        ...rec,
        ...fallback,
      };
    }
    const placement = cabinetModelSizeToHandlePlacement(rec.sizeMm, facadeHeightMm);
    return {
      cabinetModelId: Number(id) || 3,
      source: 'cabinet_model',
      name: rec.name,
      modelUrl: rec.modelUrl,
      catalogScaleRaw: rec.catalogScaleRaw,
      catalogScaleFactor: rec.catalogScaleFactor,
      catalogRotDeg: rec.catalogRotDeg,
      ...placement,
    };
  }

  function disposePreviewRoot(root) {
    if (!root || typeof root.traverse !== 'function') return;
    root.traverse((o) => {
      if (o.geometry && typeof o.geometry.dispose === 'function') o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m?.dispose?.());
        else if (typeof o.material.dispose === 'function') o.material.dispose();
      }
    });
  }

  /**
   * Сравнение источников размеров: cabinet_model (как опора) vs handles.json (как комната сейчас).
   * Не меняет сцену. Загружает FBX off-screen и меряет bbox обоих пайплайнов.
   */
  async function inspectHandleDimensionSources(opts) {
    const o = opts && typeof opts === 'object' ? opts : {};
    const cabinetModelId = Number(o.cabinetModelId) || 3;
    const loader = global.__cldRoomCabinetModels;
    await loadHandlesCatalog();
    const series =
      findSeriesById(o.seriesId || 'volna') ||
      findSeriesById('handle-1781380433836') ||
      (__catalog?.series || [])[0] ||
      null;
    const cmItem = await fetchCabinetModelItemById(cabinetModelId);
    const cabinetModel = readCabinetModelItemDims(cmItem);
    const handlesJson = resolveHandleCatalogDims(series);
    const barLengthMm = resolveHandleBarLengthMm(o.facadeHeightMm || 720, series, pickVariant(series, 'wardrobe'));
    const roomTargetMm = {
      x: barLengthMm,
      y: handlesJson.profileHeightMm,
      z: handlesJson.profileDepthMm,
    };

    const previews = { oporaLike: null, roomCurrent: null };

    if (loader?.resolveCabinetModel && cabinetModel?.sizeMm) {
      try {
        const rootOpora = await loader.resolveCabinetModel({
          spec: { id: String(cabinetModelId), fitToSize: true },
          sizeMm: cabinetModel.sizeMm,
        });
        if (rootOpora) {
          if (typeof loader.applyStoredCatalogRotation === 'function') {
            loader.applyStoredCatalogRotation(rootOpora);
          }
          previews.oporaLike = {
            pipeline: 'cabinet_model как опора: infer + fitToSize + catalogScale×10 + rot',
            inputSizeMm: cabinetModel.sizeMm,
            bboxMm: bboxSizeMm(rootOpora),
          };
          disposePreviewRoot(rootOpora);
        }
      } catch (e) {
        previews.oporaLike = { error: String(e?.message || e) };
      }

      try {
        const rootRoom = await loader.resolveCabinetModel({
          spec: { id: String(cabinetModelId), fitToSize: true, roomHandle: true },
          sizeMm: roomTargetMm,
        });
        if (rootRoom) {
          const afterScale = scaleHandleToCatalogMm(
            rootRoom,
            barLengthMm,
            handlesJson.profileHeightMm,
            handlesJson.profileDepthMm
          );
          previews.roomCurrent = {
            pipeline: 'комната сейчас: roomHandle (без catalogScale) + scaleHandleToCatalogMm',
            inputSizeMm: roomTargetMm,
            bboxMm: bboxSizeMm(rootRoom),
            scaleHandleResult: afterScale,
          };
          disposePreviewRoot(rootRoom);
        }
      } catch (e) {
        previews.roomCurrent = { error: String(e?.message || e) };
      }
    }

    const out = {
      cabinetModelId,
      cabinetModel,
      handlesJson: {
        barLengthMm,
        profileHeightMm: handlesJson.profileHeightMm,
        profileDepthMm: handlesJson.profileDepthMm,
        roomTargetMm,
        seriesKey: series?.key || series?.id || null,
      },
      previews,
      note:
        'cabinet_model.sizeMm — поля Ширина/Высота/Глубина в админке 3D модели. handles.json — что использует комната (шаг 6).',
    };
    handleLog('inspect cabinet_model vs handles.json', out);
    return out;
  }

  ensureCatalogWarm();

  global.__cldHandleRuntime = {
    readSelection,
    readBarRules,
    loadHandlesCatalog,
    findSeriesById,
    pickVariant,
    resolveBarWidthMm,
    resolveBarHeightMm,
    resolveHandleCatalogDims,
    resolveHandleBarLengthMm,
    resolveVerticalBarFitLengthMm,
    resolveHorizontalBarFitLengthMm,
    resolveModelSizeType,
    isKnobHandleSeries,
    isVerticalHandleSeries,
    shouldAttachHandlesInRoom,
    isHandleEnabledOnFacade,
    resolveHandleOffsetMm,
    stretchRootXToWidthMm,
    scaleHandleToCatalogMm,
    scaleKnobToCabinetMm,
    applyRoomHandleOrientationFromVerticalCatalog,
    HANDLE_ROOM_HORIZONTAL_ROT_Z,
    stretchRootYToHeightMm,
    centerObjectAtOrigin,
    bboxSizeMm,
    computeBarHandlePositionMm,
    computeHandlePositionMm,
    computeVerticalHandlePositionMm,
    normalizeLayoutRoleKey,
    normalizeProductKindForPlacementRules,
    resolveSync,
    resolveForFacade,
    resolveUnifiedFacadeHandlePlacements,
    readStep6ItemOverride,
    handleLog,
    DEFAULT_HANDLE_OFFSET_MM,
    fetchCabinetModelItemById,
    readCabinetModelItemDims,
    resolveHandleCabinetModelDims,
    cabinetModelSizeToHandlePlacement,
    inspectHandleDimensionSources,
  };

  if (typeof global !== 'undefined') {
    global.__cldInspectHandleCabinetModelDims = function (opts) {
      return inspectHandleDimensionSources(opts);
    };
  }
})(typeof window !== 'undefined' ? window : global);
