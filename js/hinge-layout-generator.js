/**
 * Схемы расстановки петель — общий модуль для админки, превью и ClodisBuilder.
 * Схемы: localStorage clodis_hinge_layout_schemes_v1
 * Дефолты по ролям: clodis_hinge_role_defaults_v1
 */
(function (global) {
  const HINGE_LAYOUT_SCHEMES_KEY = 'clodis_hinge_layout_schemes_v1';
  const HINGE_ROLE_DEFAULTS_KEY = 'clodis_hinge_role_defaults_v1';
  const FACADE_VARIANT_DEFAULTS_KEY = 'clodis_facade_variant_defaults_v1';

  const FACADE_LAYOUT_ROLES = ['facades', 'facades_main', 'facades_top'];
  /** Реф part7: furniture_models.hinge_facade.sizes.x (мм вдоль кромки), не Ø чашки 35. */
  const REF_HINGE_FACADE_ARM_X_MM = 11;

  function refHingeFacadeArmWidthMm() {
    return REF_HINGE_FACADE_ARM_X_MM;
  }
  const PRODUCT_KINDS = [
    { key: 'wardrobe', label: 'Шкаф (ниша)' },
    { key: 'pedestal', label: 'Тумба' },
    { key: 'console', label: 'Консоль' },
    { key: 'wall_hung', label: 'Шкаф навесной' },
    // НМ; фасады H=720 — общий пул с НШ1 (те же catalog_28), без дублирования строк.
    { key: 'kitchen_base', label: 'Кухня НМ (стол)' },
  ];

  // Ось расстановки петель определяется типом открытия фасада:
  //   swing  — распашной    → Y (петли двигаются по высоте);
  //   lift   — откидной     → X (петли по ширине, горизонтальная подвеска);
  //   solid  — цельный фасад без петель.
  const OPENS_AXIS = { swing: 'Y', lift: 'X', solid: null };
  const OPENS_LABEL = {
    swing: 'Распашной (левый)',
    'swing-left': 'Распашной левый',
    'swing-right': 'Распашной правый',
    'double-swing': 'Двустворчатый',
    lift: 'Откидной',
    solid: 'Цельный (без петель)',
  };

  // Каталог вариантов фасадов по изделию.
  // legacyRole — для совместимости с layout_role в комнате (ClodisBuilder).
  const PRODUCT_FACADE_VARIANTS = [
    { product: 'wardrobe',  variant: 'main',     opens: 'swing',      variantLabel: 'Фасад шкафа',     legacyRole: 'facades' },
    { product: 'wardrobe',  variant: 'main',     opens: 'swing-left', variantLabel: 'Фасад шкафа (левый)', legacyRole: 'facades' },
    { product: 'wardrobe',  variant: 'main',     opens: 'swing-right', variantLabel: 'Фасад шкафа (правый)', legacyRole: 'facades' },
    { product: 'wardrobe',  variant: 'main',     opens: 'double-swing', variantLabel: 'Фасад шкафа (двустворчатый)', legacyRole: 'facades' },
    { product: 'wardrobe',  variant: 'antresol', opens: 'swing',      variantLabel: 'Фасад антресоль', legacyRole: 'facades_top' },
    { product: 'wardrobe',  variant: 'antresol', opens: 'swing-left', variantLabel: 'Фасад антресоль (левый)', legacyRole: 'facades_top' },
    { product: 'wardrobe',  variant: 'antresol', opens: 'swing-right', variantLabel: 'Фасад антресоль (правый)', legacyRole: 'facades_top' },
    { product: 'wardrobe',  variant: 'antresol', opens: 'double-swing', variantLabel: 'Фасад антресоль (двустворчатый)', legacyRole: 'facades_top' },
    { product: 'wardrobe',  variant: 'antresol', opens: 'lift',  variantLabel: 'Фасад антресоль', legacyRole: 'facades_top' },
    { product: 'wardrobe',  variant: 'antresol', opens: 'solid', variantLabel: 'Фасад шкаф антресоль (цельный)', legacyRole: 'facades_top' },
    { product: 'pedestal',  variant: 'main',     opens: 'swing',         variantLabel: 'Фасад тумбы',     legacyRole: 'facades' },
    { product: 'pedestal',  variant: 'main',     opens: 'swing-left',    variantLabel: 'Фасад тумбы (левый)', legacyRole: 'facades' },
    { product: 'pedestal',  variant: 'main',     opens: 'swing-right',   variantLabel: 'Фасад тумбы (правый)', legacyRole: 'facades' },
    { product: 'pedestal',  variant: 'main',     opens: 'double-swing',  variantLabel: 'Фасад тумбы (двустворчатый)', legacyRole: 'facades' },
    { product: 'pedestal',  variant: 'main',     opens: 'lift',          variantLabel: 'Фасад тумбы',     legacyRole: 'facades_top' },
    { product: 'console',   variant: 'main',     opens: 'lift',  variantLabel: 'Фасад консоли',   legacyRole: 'facades_top' },
    { product: 'wall_hung', variant: 'main',     opens: 'swing',         variantLabel: 'Фасад шкафа навесного', legacyRole: 'facades' },
    { product: 'wall_hung', variant: 'main',     opens: 'swing-left',    variantLabel: 'Фасад шкафа навесного (левый)', legacyRole: 'facades' },
    { product: 'wall_hung', variant: 'main',     opens: 'swing-right',   variantLabel: 'Фасад шкафа навесного (правый)', legacyRole: 'facades' },
    { product: 'wall_hung', variant: 'main',     opens: 'double-swing',  variantLabel: 'Фасад шкафа навесного (двустворчатый)', legacyRole: 'facades' },
    { product: 'wall_hung', variant: 'main',     opens: 'lift',          variantLabel: 'Фасад шкафа навесного', legacyRole: 'facades_top' },
    // kitchen_base: одна полоса на корпус 720; facadeHeightMm — ключ общего пула с НШ 720.
    { product: 'kitchen_base', variant: 'main', opens: 'swing-left',    variantLabel: 'Фасад НМ 720 (левый)', legacyRole: 'facades', facadeHeightMm: 720 },
    { product: 'kitchen_base', variant: 'main', opens: 'swing-right',   variantLabel: 'Фасад НМ 720 (правый)', legacyRole: 'facades', facadeHeightMm: 720 },
    { product: 'kitchen_base', variant: 'main', opens: 'double-swing',  variantLabel: 'Фасад НМ 720 (двустворчатый)', legacyRole: 'facades', facadeHeightMm: 720 },
    // Gola 2 ящика: фасад 343 (drawerNoHandle / solid), пул catalog_28 по высоте.
    { product: 'kitchen_base', variant: 'gola_drawer', opens: 'solid', variantLabel: 'Фасад НМ Gola ящик 343', legacyRole: 'facades', facadeHeightMm: 343 },
  ];

  const FACADE_LEAF_TO_COMPOSITE_CATALOG_ID = { 8: 13, 11: 13, 7: 14, 12: 14 };
  const FACADE_COMPOSITE_DOUBLE_CATALOG_IDS = new Set([13, 14]);

  /**
   * legacy opens=swing скрываем в админке, если для той же пары product+variant
   * уже есть swing-left / swing-right (комната их и использует).
   */
  function isFacadeVariantVisibleInAdmin(meta, allVariants) {
    if (!meta || String(meta.opens || '') !== 'swing') return true;
    const list = Array.isArray(allVariants) ? allVariants : PRODUCT_FACADE_VARIANTS;
    return !list.some(
      (v) =>
        v.product === meta.product &&
        v.variant === meta.variant &&
        (v.opens === 'swing-left' || v.opens === 'swing-right')
    );
  }

  function facadeVariantsForAdminUI() {
    return PRODUCT_FACADE_VARIANTS.filter((v) =>
      isFacadeVariantVisibleInAdmin(v, PRODUCT_FACADE_VARIANTS)
    );
  }

  /**
   * Варианты с тем же facadeHeightMm (НМ 720 ↔ НШ 720 — один пул catalog_28).
   * @param {number} heightMm
   * @returns {typeof PRODUCT_FACADE_VARIANTS}
   */
  function facadeVariantsByHeightMm(heightMm) {
    const h = Math.round(Number(heightMm) || 0);
    if (!(h > 0)) return [];
    return PRODUCT_FACADE_VARIANTS.filter((v) => Math.round(Number(v.facadeHeightMm) || 0) === h);
  }

  function hingeAxisForOpens(opens) {
    const o = String(opens || '').trim().toLowerCase();
    if (o === 'double-swing' || o === 'swing-left' || o === 'swing-right' || o === 'swing') {
      return OPENS_AXIS.swing;
    }
    return OPENS_AXIS[o] || null;
  }

  function hingeAxisForRole(role) {
    const r = String(role || '').trim().toLowerCase();
    // Распашные facades_top (шкаф): Y. Откидной lift → hingeAxisForOpens('lift') === 'X'.
    if (r === 'facades' || r === 'facades_main' || r === 'facades_top') return 'Y';
    return 'Y';
  }

  /**
   * layout_role в комнате ↔ вариант в «Петли по ролям» (как section-layout-roles-catalog).
   * facades_main — фасад корпуса; facades_top — антресоль / верх; facades — на всю высоту.
   */
  function layoutRolesForVariantLookup(layoutRole) {
    const role = String(layoutRole || 'facades').trim() || 'facades';
    if (role === 'facades') return new Set(['facades']);
    if (role === 'facades_main') return new Set(['facades', 'facades_main']);
    if (role === 'facades_top') return new Set(['facades_top']);
    return new Set([role]);
  }

  function isRightDoorDirection(doorDirection, zoneHand) {
    const doorDir = String(doorDirection || '').toLowerCase();
    if (/^(r|ry|rtl|right)/.test(doorDir)) return true;
    const zh = String(zoneHand || '').toLowerCase();
    return zh === 'right' || zh === 'rtl';
  }

  /**
   * opens для «петли по ролям»: double-swing только на #13/#14 или 2+ распашных в дереве;
   * одиночная створка — swing-left/right по ry/ly аниматора (не по map 7→14).
   */
  function resolveOpensForHingeRoleLayout(opts) {
    opts = opts || {};
    if (opts.roleParamsOpens) return String(opts.roleParamsOpens).trim().toLowerCase();
    if (opts.doubleSwing) return 'double-swing';
    const role = String(opts.facadeLayoutRole || 'facades').trim();
    const right = isRightDoorDirection(opts.doorDirection, opts.zoneHand);
    if (role === 'facades_top' || role === 'facades_main' || role === 'facades') {
      return right ? 'swing-right' : 'swing-left';
    }
    return 'swing';
  }

  function explicitVariantOpensForLayoutRole(productKind, layoutRole, zoneHand, opts) {
    opts = opts || {};
    const pk = String(productKind || '').trim();
    const role = String(layoutRole || '').trim();
    const right = isRightDoorDirection(opts.doorDirection, zoneHand);
    const doubleSwing = !!opts.doubleSwing;
    if (pk === 'wardrobe' && role === 'facades_main') {
      if (doubleSwing) return { variant: 'main', opens: 'double-swing' };
      return { variant: 'main', opens: right ? 'swing-right' : 'swing-left' };
    }
    if (pk === 'wardrobe' && role === 'facades_top') {
      if (doubleSwing) return { variant: 'antresol', opens: 'double-swing' };
      return { variant: 'antresol', opens: right ? 'swing-right' : 'swing-left' };
    }
    if (pk === 'wardrobe' && role === 'facades') {
      return { variant: 'main', opens: right ? 'swing-right' : 'swing-left' };
    }
    if (pk === 'pedestal' && (role === 'facades_main' || role === 'facades')) {
      if (doubleSwing) return { variant: 'main', opens: 'double-swing' };
      return { variant: 'main', opens: right ? 'swing-right' : 'swing-left' };
    }
    if (pk === 'pedestal' && role === 'facades_top') {
      return { variant: 'main', opens: 'lift' };
    }
    if (pk === 'wall_hung' && (role === 'facades_main' || role === 'facades')) {
      if (doubleSwing) return { variant: 'main', opens: 'double-swing' };
      return { variant: 'main', opens: right ? 'swing-right' : 'swing-left' };
    }
    if (pk === 'wall_hung' && role === 'facades_top') {
      return { variant: 'main', opens: 'lift' };
    }
    // НМ / стол: facades и facades_main — одна полоса 720 (общий пул с НШ).
    if (pk === 'kitchen_base' && (role === 'facades_main' || role === 'facades')) {
      if (doubleSwing) return { variant: 'main', opens: 'double-swing' };
      return { variant: 'main', opens: right ? 'swing-right' : 'swing-left' };
    }
    return null;
  }

  function planTreeHasLayoutRole(nodes, roleKey) {
    const want = String(roleKey || '').trim().toLowerCase();
    if (!want) return false;
    const stack = Array.isArray(nodes) ? [...nodes] : nodes != null ? [nodes] : [];
    while (stack.length) {
      const n = stack.pop();
      if (!n || typeof n !== 'object') continue;
      const r = String(n.layout_role ?? n.sectionLayoutRole ?? '')
        .trim()
        .toLowerCase();
      if (r === want) return true;
      if (Array.isArray(n.children)) stack.push(...n.children);
    }
    return false;
  }

  function corpusInnerFacadeBandMm(opts) {
    const h = Math.max(0, Number(opts?.heightMm) || 0);
    const v = opts?.vars && typeof opts.vars === 'object' ? opts.vars : {};
    const hb = Math.max(0, Number(v.h_bottom) || 0);
    const ht = Math.max(0, Number(v.h_top) || 0);
    const tech = Math.max(0, Number(v.tech_zone_mm) || 0);
    return Math.max(1, h - hb - ht - tech);
  }

  function readJson(key, fallback) {
    try {
      const raw = global.localStorage && global.localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      if (global.localStorage) global.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('[hinge-layout] save failed', key, e);
    }
  }

  function ensureHingeLayoutScheme(o) {
    const s = o || {};
    return {
      id: Number(s.id) || 0,
      name: String(s.name || 'Схема петель'),
      facadeHeight: Math.max(1, Number(s.facadeHeight) || 500),
      cabinetWidth: Math.max(1, Number(s.cabinetWidth) || 800),
      cabinetDepth: Math.max(1, Number(s.cabinetDepth) || 600),
      sideThickness: Math.max(1, Number(s.sideThickness) || 16),
      facadeThickness: Math.max(1, Number(s.facadeThickness) || 16),
      facadeEdgeOffset: Math.max(0, Number(s.facadeEdgeOffset) || 1.5),
      corpusEdgeOffset: Math.max(0, Number(s.corpusEdgeOffset) || 1.5),
      hingePosX: Number(s.hingePosX) || 0,
      hingePosY: Number(s.hingePosY) || 0,
      hingePosZ: Number(s.hingePosZ) || 0,
      hingeRotX: Number(s.hingeRotX) || 0,
      hingeRotY: Number(s.hingeRotY) || 0,
      hingeRotZ: Number(s.hingeRotZ) || 0,
      topOffset: Math.max(0, Number(s.topOffset) || 100),
      bottomOffset: Math.max(0, Number(s.bottomOffset) || 100),
      middleStep: Math.max(50, Number(s.middleStep) || 450),
      minCount: Math.max(2, Math.round(Number(s.minCount) || 2)),
      threeThreshold: Math.max(300, Number(s.threeThreshold) || 900),
      drillTemplateId: Number(s.drillTemplateId ?? s.facadeTemplateId ?? s.corpusTemplateId) || 0,
      showModel3d: s.showModel3d !== false,
      seamEdge: (() => {
        const e = String(s.seamEdge || 'left').toLowerCase();
        if (e === 'right' || e === 'top' || e === 'bottom') return e;
        return 'left';
      })(),
      source: 'hinge_layouts_v1',
    };
  }

  /** Y от низа фасада, мм */
  function calcHingeLayoutPositions(layout, facadeHeightMm) {
    const l = ensureHingeLayoutScheme(layout);
    const topOffset = Math.max(0, Number(l.topOffset) || 0);
    const bottomOffset = Math.max(0, Number(l.bottomOffset) || 0);
    const middleStep = Math.max(1, Number(l.middleStep) || 450);
    const minCount = Math.max(2, Math.round(Number(l.minCount) || 2));
    const threeThreshold = Math.max(300, Number(l.threeThreshold) || 900);
    const H = Math.max(1, Number(facadeHeightMm) || l.facadeHeight || 500);
    let count = Math.max(2, minCount);
    if (H >= threeThreshold) count = Math.max(count, 3);
    const byStep = Math.floor(Math.max(0, H - topOffset - bottomOffset) / middleStep) + 2;
    count = Math.max(count, byStep);
    const yTop = Math.max(0, topOffset);
    const yBottom = Math.max(yTop + 1, H - bottomOffset);
    if (count <= 2) return [yTop, yBottom];
    return Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1);
      return Math.round(yTop + (yBottom - yTop) * t);
    });
  }

  function readHingeLayoutSchemes() {
    const arr = readJson(HINGE_LAYOUT_SCHEMES_KEY, []);
    return Array.isArray(arr) ? arr.map(ensureHingeLayoutScheme) : [];
  }

  function getHingeLayoutSchemeById(id) {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) return null;
    return readHingeLayoutSchemes().find((s) => Number(s.id) === n) || null;
  }

  const HINGE_MIDDLE_MODES = ['center', 'even', 'fromBottom', 'fromTop'];
  const HINGE_MIDDLE_DISTANCE_KINDS = ['mm', 'percent'];

  function normalizeHingeMiddleMode(mode, hingeCount) {
    const m = String(mode || '').trim();
    const count = Math.round(Number(hingeCount));
    if (count === 4) {
      if (m === 'center') return 'even';
      if (m === 'even' || m === 'fromBottom' || m === 'fromTop') return m;
      return 'even';
    }
    if (m === 'even') return 'center';
    if (m === 'fromBottom' || m === 'fromTop' || m === 'center') return m;
    return 'center';
  }

  function normalizeHingeMiddleDistanceKind(kind) {
    const k = String(kind || '').trim();
    return HINGE_MIDDLE_DISTANCE_KINDS.includes(k) ? k : 'mm';
  }

  /** Смещение средней петли от крайней (мм): фиксированное или доля зазора между крайними. */
  function resolveMiddleOffsetMm(p, start, end) {
    const span = Math.max(0, end - start);
    const raw = Math.max(0, Number(p.middleDistance) || 0);
    if (p.middleDistanceKind === 'percent') {
      const pct = Math.max(0, Math.min(100, raw));
      return (span * pct) / 100;
    }
    return raw;
  }

  const HINGE_SLOT_MODES = ['auto', 'fromBottom', 'fromTop'];

  function normalizeHingeSlot(slot) {
    const s = slot || {};
    let mode = String(s.mode || '').trim();
    if (!HINGE_SLOT_MODES.includes(mode)) mode = 'auto';
    let kind = String(s.kind || '').trim();
    if (!HINGE_MIDDLE_DISTANCE_KINDS.includes(kind)) kind = 'mm';
    let value = Math.max(0, Number(s.value) || 0);
    if (kind === 'percent') value = Math.min(100, value);
    return { mode, value, kind };
  }

  function normalizeHingeMiddleSlots(arr, count) {
    const want = Math.max(0, Math.round(Number(count) || 0) - 2);
    const src = Array.isArray(arr) ? arr : [];
    const out = [];
    for (let i = 0; i < want; i++) out.push(normalizeHingeSlot(src[i]));
    return out;
  }

  /** Превращает значение слота (мм или %) в смещение в мм относительно зазора start..end. */
  function slotOffsetMm(slot, start, end) {
    const span = Math.max(0, end - start);
    const v = Math.max(0, Number(slot?.value) || 0);
    if (slot?.kind === 'percent') {
      return (span * Math.max(0, Math.min(100, v))) / 100;
    }
    return v;
  }

  /**
   * Параметры расстановки петель для фасада изделия.
   * topOffset — отступ от верхнего края по оси петли (мм).
   * bottomOffset — отступ от нижнего края (мм).
   * hingeCount — 2…7. Крайние петли всегда по отступам.
   * Для hingeCount === 3:
   *   middleMode — 'center' (по середине между крайними),
   *                'fromBottom' (на middleDistance от нижней петли),
   *                'fromTop'    (на middleDistance от верхней петли).
   *   middleDistance — значение (мм или %, см. middleDistanceKind).
   *   middleDistanceKind — 'mm' (фикс.) или 'percent' (доля зазора между крайними петлями).
   * Для hingeCount === 4:
   *   middleMode — 'even' (равномерно), 'fromBottom' (шаг от нижней ко 2-й, 3-я посередине до верхней),
   *                'fromTop' (шаг от верхней ко 3-й, 2-я посередине до нижней).
   * Для hingeCount >= 5:
   *   middleSlots — массив длины (hingeCount - 2). Каждый слот = одна промежуточная петля
   *   (по индексу, считая снизу: slots[0] = 2-я снизу, slots[1] = 3-я и т.д.):
   *     mode  — 'auto' (равномерно), 'fromBottom' (мм/% от нижней крайней),
   *             'fromTop' (мм/% от верхней крайней).
   *     value — число (мм или % от зазора).
   *     kind  — 'mm' или 'percent'.
   *   Слоты с mode='auto' распределяются равномерно в свободных интервалах между фиксированными.
   * hasMiddle — legacy: если hingeCount не задан и hasMiddle=true → 3 петли.
   */
  function ensureHingeRoleLayoutParams(o) {
    const s = o || {};
    let hingeCount = Math.round(Number(s.hingeCount));
    if (!Number.isFinite(hingeCount) || hingeCount < 2) {
      hingeCount = s.hasMiddle ? 3 : 2;
    }
    hingeCount = Math.max(2, Math.min(7, hingeCount));
    const middleMode = normalizeHingeMiddleMode(s.middleMode, hingeCount);
    const middleDistance = Math.max(0, Number(s.middleDistance) || 0);
    const middleDistanceKind = normalizeHingeMiddleDistanceKind(s.middleDistanceKind);
    const middleSlots = normalizeHingeMiddleSlots(s.middleSlots, hingeCount);
    const pivotOff = s.doorPivotOffset;
    const parsePivot = (v, fb) => {
      if (v === null || v === undefined || v === '') return fb;
      const n = Number(v);
      return Number.isFinite(n) ? n : fb;
    };
    return {
      topOffset: Math.max(0, Number(s.topOffset) || 100),
      bottomOffset: Math.max(0, Number(s.bottomOffset) || 100),
      hingeCount,
      hasMiddle: hingeCount >= 3,
      middleMode,
      middleDistance,
      middleDistanceKind,
      middleSlots,
      facadeEdgeOffset: Math.max(0, Number(s.facadeEdgeOffset) || 1.5),
      corpusEdgeOffset: Math.max(0, Number(s.corpusEdgeOffset) || 1.5),
      doorPivotOffsetX: parsePivot(
        s.doorPivotOffsetX ?? pivotOff?.x,
        0
      ),
      doorPivotOffsetY: parsePivot(
        s.doorPivotOffsetY ?? pivotOff?.y,
        0
      ),
      doorPivotOffsetZ: parsePivot(
        s.doorPivotOffsetZ ?? pivotOff?.z,
        0
      ),
      // Якорь корпусной присадки на боке: X=0 на пласти, Z>0 внутрь от передней кромки.
      corpusMountOffsetX: parsePivot(s.corpusMountOffsetX, 0),
      corpusMountOffsetY: parsePivot(s.corpusMountOffsetY, 0),
      corpusMountOffsetZ: parsePivot(s.corpusMountOffsetZ, 0),
      drillTemplateId: Number(s.drillTemplateId ?? s.facadeTemplateId ?? s.corpusTemplateId) || 0,
      schemeId: Number(s.schemeId) || 0,
    };
  }

  /** Смещение оси распашки (мм) только из сохранённой строки «Петли по ролям»; без строки — 0. */
  function resolveDoorPivotOffsetMm(opts) {
    opts = opts || {};
    const productKind =
      String(opts.productKind || '').trim() ||
      placementKindToProductKind(opts.placementKind);
    const variant = String(opts.variant || '').trim();
    const opens = String(opts.opens || '').trim().toLowerCase();
    const role = String(opts.facadeLayoutRole || 'facades').trim() || 'facades';
    const variantsAll = readFacadeVariantDefaults();

    let variantRow = null;
    if (variant && opens) {
      variantRow =
        variantsAll.find(
          (r) => r.productKind === productKind && r.variant === variant && r.opens === opens
        ) || null;
    }
    if (!variantRow) {
      const explicit = explicitVariantOpensForLayoutRole(productKind, role, opts.zoneHand);
      if (explicit) {
        variantRow =
          variantsAll.find(
            (r) =>
              r.productKind === productKind &&
              r.variant === explicit.variant &&
              r.opens === explicit.opens
          ) || null;
      }
    }
    if (!variantRow) {
      const roleAliases = layoutRolesForVariantLookup(role);
      const matchByRole = variantsAll.filter((r) => {
        const meta = PRODUCT_FACADE_VARIANTS.find(
          (v) => v.product === r.productKind && v.variant === r.variant && v.opens === r.opens
        );
        if (!meta || r.productKind !== productKind || !roleAliases.has(meta.legacyRole)) return false;
        return isFacadeVariantVisibleInAdmin(meta, PRODUCT_FACADE_VARIANTS);
      });
      variantRow = matchByRole[0] || null;
    }
    if (!variantRow) return { x: 0, y: 0, z: 0 };
    return {
      x: Number(variantRow.doorPivotOffsetX) || 0,
      y: Number(variantRow.doorPivotOffsetY) || 0,
      z: Number(variantRow.doorPivotOffsetZ) || 0,
    };
  }

  /**
   * Смещение якоря корпусной присадки на боке (мм) из «Петли по ролям».
   * X — от внутренней пласти (0 = на пласти, + внутрь корпуса).
   * Y — доп. к расстановке top/bottom (обычно 0).
   * Z — от передней кромки бока внутрь (+ = внутрь шкафа).
   */
  function resolveCorpusMountOffsetMm(opts) {
    opts = opts || {};
    const productKind =
      String(opts.productKind || '').trim() ||
      placementKindToProductKind(opts.placementKind);
    const variant = String(opts.variant || '').trim();
    const opens = String(opts.opens || '').trim().toLowerCase();
    const role = String(opts.facadeLayoutRole || 'facades').trim() || 'facades';
    const variantsAll = readFacadeVariantDefaults();

    let variantRow = null;
    if (variant && opens) {
      variantRow =
        variantsAll.find(
          (r) => r.productKind === productKind && r.variant === variant && r.opens === opens
        ) || null;
    }
    if (!variantRow) {
      const explicit = explicitVariantOpensForLayoutRole(productKind, role, opts.zoneHand);
      if (explicit) {
        variantRow =
          variantsAll.find(
            (r) =>
              r.productKind === productKind &&
              r.variant === explicit.variant &&
              r.opens === explicit.opens
          ) || null;
      }
    }
    if (!variantRow) {
      const roleAliases = layoutRolesForVariantLookup(role);
      const matchByRole = variantsAll.filter((r) => {
        const meta = PRODUCT_FACADE_VARIANTS.find(
          (v) => v.product === r.productKind && v.variant === r.variant && v.opens === r.opens
        );
        if (!meta || r.productKind !== productKind || !roleAliases.has(meta.legacyRole)) return false;
        return isFacadeVariantVisibleInAdmin(meta, PRODUCT_FACADE_VARIANTS);
      });
      variantRow = matchByRole[0] || null;
    }
    if (!variantRow) return { x: 0, y: 0, z: 0 };
    return {
      x: Number(variantRow.corpusMountOffsetX) || 0,
      y: Number(variantRow.corpusMountOffsetY) || 0,
      z: Number(variantRow.corpusMountOffsetZ) || 0,
    };
  }

  /** Задать door_offset rotate-аниматорам (превью); 0/0/0 — убрать из дерева. */
  function applyDoorPivotOffsetToRotateAnimatorsInTree(nodes, offsetMm) {
    const ox = Number(offsetMm?.x) || 0;
    const oy = Number(offsetMm?.y) || 0;
    const oz = Number(offsetMm?.z) || 0;
    const hasOff = !!(ox || oy || oz);
    const walk = (n) => {
      if (!n || typeof n !== 'object') return;
      const t = String(n.type || '').trim().toLowerCase();
      if (t === 'animator') {
        const id = String(n.id || '').trim().toLowerCase();
        const fn = String(n.spec?.fn || '').toLowerCase();
        const isHingeAnim = id === 'hinge_animator';
        const isDoorRotate =
          fn === 'rotate' &&
          !isHingeAnim &&
          Array.isArray(n.children) &&
          n.children.some((c) => String(c?.type || '').toLowerCase() === 'facade');
        if (isDoorRotate && n.spec && typeof n.spec === 'object') {
          const nextSpec = { ...n.spec };
          if (hasOff) {
            nextSpec.door_offset = { x: ox, y: oy, z: oz };
          } else {
            delete nextSpec.door_offset;
          }
          n.spec = nextSpec;
        }
      }
      if (Array.isArray(n.children)) n.children.forEach(walk);
    };
    if (Array.isArray(nodes)) nodes.forEach(walk);
    else walk(nodes);
  }

  function drillTemplateIdFromRoleLayoutParams(p) {
    let tid = Number(p?.drillTemplateId) || 0;
    if (tid > 0) return tid;
    const sid = Number(p?.schemeId) || 0;
    if (sid > 0) {
      const sch = getHingeLayoutSchemeById(sid);
      if (sch) tid = Number(sch.drillTemplateId) || 0;
    }
    return tid;
  }

  /**
   * Расстановка count>=5 петель по middleSlots.
   * Алгоритм:
   *   1) фиксируем крайние (start, end);
   *   2) каждый слот с mode!='auto' даёт фиксированную позицию;
   *   3) подряд идущие auto-слоты заполняем равномерно между соседними фиксированными концами;
   *   4) клампим в [start, end] и при необходимости сортируем монотонно.
   */
  function calcMiddleSlotPositions(p, start, end) {
    const count = p.hingeCount;
    const slots = normalizeHingeMiddleSlots(p.middleSlots, count);
    const N = count;
    const positions = new Array(N);
    positions[0] = start;
    positions[N - 1] = end;
    for (let i = 1; i < N - 1; i++) {
      const slot = slots[i - 1];
      if (!slot || slot.mode === 'auto') continue;
      const off = slotOffsetMm(slot, start, end);
      positions[i] =
        slot.mode === 'fromTop'
          ? Math.max(start, Math.min(end, end - off))
          : Math.max(start, Math.min(end, start + off));
    }
    let i = 0;
    while (i < N) {
      if (positions[i] !== undefined) {
        i++;
        continue;
      }
      let j = i;
      while (j < N && positions[j] === undefined) j++;
      const left = positions[i - 1];
      const right = positions[j];
      const gap = j - i + 1;
      for (let k = 0; k < j - i; k++) {
        positions[i + k] = left + ((right - left) * (k + 1)) / gap;
      }
      i = j;
    }
    for (let k = 1; k < N - 1; k++) {
      if (positions[k] < positions[k - 1]) positions[k] = positions[k - 1];
      if (positions[k] > end) positions[k] = end;
    }
    return positions;
  }

  /** Позиции петель (мм от низа фасада по оси Y), равномерный шаг между краями. */
  function calcHingeRoleLayoutPositions(params, facadeDimensionMm) {
    const p = ensureHingeRoleLayoutParams(params);
    const D = Math.max(1, Number(facadeDimensionMm) || 0);
    const count = p.hingeCount;
    const start = Math.max(0, p.bottomOffset);
    const end = Math.max(start + 1, D - p.topOffset);
    if (count <= 1) return [start];
    if (count === 2) return [start, end];
    if (count === 3) {
      let mid;
      const off = resolveMiddleOffsetMm(p, start, end);
      if (p.middleMode === 'fromBottom' && off > 0) {
        mid = start + off;
      } else if (p.middleMode === 'fromTop' && off > 0) {
        mid = end - off;
      } else {
        mid = (start + end) / 2;
      }
      mid = Math.max(start, Math.min(end, mid));
      return [start, mid, end];
    }
    if (count === 4) {
      const off = resolveMiddleOffsetMm(p, start, end);
      if (p.middleMode === 'fromBottom' && off > 0) {
        const h1 = Math.max(start, Math.min(end, start + off));
        const h2 = h1 + (end - h1) / 2;
        return [start, h1, h2, end];
      }
      if (p.middleMode === 'fromTop' && off > 0) {
        const h2 = Math.max(start, Math.min(end, end - off));
        const h1 = start + (h2 - start) / 2;
        return [start, h1, h2, end];
      }
      const y0 = Math.round(start);
      const y3 = Math.round(end);
      const span = Math.max(0, y3 - y0);
      const edgeGap = Math.floor(span / 3);
      return [y0, y0 + edgeGap, y3 - edgeGap, y3];
    }
    if (count >= 5) {
      return calcMiddleSlotPositions(p, start, end);
    }
    return Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1);
      return start + (end - start) * t;
    });
  }

  function normalizeHingeRoleDefaultRow(row) {
    const productKind = String(row?.productKind || '').trim();
    const role = String(row?.role || '').trim();
    if (!productKind || !role) return null;
    const schemeId = Number(row.schemeId) || 0;
    const catalogItemId = Number(row.catalogItemId) || 0;
    if (schemeId <= 0 && catalogItemId <= 0) return null;
    return {
      productKind,
      role,
      schemeId,
      catalogItemId,
      ...ensureHingeRoleLayoutParams(row),
    };
  }

  function readHingeRoleDefaults() {
    const arr = readJson(HINGE_ROLE_DEFAULTS_KEY, []);
    if (!Array.isArray(arr)) return [];
    return arr.map(normalizeHingeRoleDefaultRow).filter(Boolean);
  }

  function saveHingeRoleDefaults(rows) {
    writeJson(HINGE_ROLE_DEFAULTS_KEY, Array.isArray(rows) ? rows : []);
  }

  function normalizeFacadeVariantRow(row) {
    if (!row) return null;
    const productKind = String(row.productKind || '').trim();
    const variant = String(row.variant || '').trim();
    const opens = String(row.opens || '').trim().toLowerCase();
    if (!productKind || !variant || !opens) return null;
    const catalogItemName = String(row.catalogItemName || row.facadeName || '').trim();
    return {
      productKind,
      variant,
      opens,
      catalogItemId: Number(row.catalogItemId) || 0,
      ...(catalogItemName ? { catalogItemName } : {}),
      ...ensureHingeRoleLayoutParams(row),
    };
  }

  function readFacadeVariantDefaults() {
    const arr = readJson(FACADE_VARIANT_DEFAULTS_KEY, []);
    if (!Array.isArray(arr)) return [];
    return arr.map(normalizeFacadeVariantRow).filter(Boolean);
  }

  function saveFacadeVariantDefaults(rows) {
    const out = (Array.isArray(rows) ? rows : []).map(normalizeFacadeVariantRow).filter(Boolean);
    writeJson(FACADE_VARIANT_DEFAULTS_KEY, out);
  }

  function findFacadeVariantDefault(productKind, variant, opens) {
    return (
      readFacadeVariantDefaults().find(
        (r) => r.productKind === productKind && r.variant === variant && r.opens === opens
      ) || null
    );
  }

  /** Дефолты: catalog_28 + отступы/шаг петель по роли */
  function readFacadeRoleDefaults() {
    const fromVariants = readFacadeVariantDefaults()
      .filter((r) => r.catalogItemId > 0 && r.opens !== 'solid')
      .map((r) => {
        const meta = PRODUCT_FACADE_VARIANTS.find(
          (v) => v.product === r.productKind && v.variant === r.variant && v.opens === r.opens
        );
        return {
          productKind: r.productKind,
          role: meta?.legacyRole || 'facades',
          variant: r.variant,
          opens: r.opens,
          catalogItemId: r.catalogItemId,
          topOffset: r.topOffset,
          bottomOffset: r.bottomOffset,
          hingeCount: r.hingeCount,
          hasMiddle: r.hasMiddle,
          middleMode: r.middleMode,
          middleDistance: r.middleDistance,
          middleDistanceKind: r.middleDistanceKind,
          middleSlots: r.middleSlots,
          facadeEdgeOffset: r.facadeEdgeOffset,
        };
      });
    if (fromVariants.length) return fromVariants;
    return readHingeRoleDefaults().filter((row) => row.catalogItemId > 0);
  }

  function saveFacadeRoleDefaults(rows) {
    const schemeRows = readHingeRoleDefaults().filter((r) => r.schemeId > 0 && !r.catalogItemId);
    const facadeRows = (Array.isArray(rows) ? rows : [])
      .map((row) =>
        normalizeHingeRoleDefaultRow({
          ...ensureHingeRoleLayoutParams(row),
          productKind: row.productKind,
          role: row.role,
          catalogItemId: Number(row.catalogItemId) || 0,
          schemeId: 0,
        })
      )
      .filter(Boolean);
    saveHingeRoleDefaults([...schemeRows, ...facadeRows]);
  }

  /**
   * Параметры расстановки петель для productKind × (variant+opens или layout_role).
   * Приоритет: новый facade-variant default → старый role default.
   * @returns {object|null}
   */
  function resolveHingeRoleLayoutParams(opts) {
    opts = opts || {};
    const productKind =
      String(opts.productKind || '').trim() ||
      placementKindToProductKind(opts.placementKind);
    const variant = String(opts.variant || '').trim();
    const opens = String(opts.opens || '').trim().toLowerCase();
    const role = String(opts.facadeLayoutRole || 'facades').trim() || 'facades';

    const variantsAll = readFacadeVariantDefaults();
    let variantRow = null;
    const catalogItemId = Number(opts.catalogItemId || opts.facadeCatalogItemId) || 0;
    const compositeParentId = FACADE_LEAF_TO_COMPOSITE_CATALOG_ID[catalogItemId] || 0;
    // Не считать #7/#8/#11/#12 double-swing только из-за map на #13/#14 — иначе смещение Y на антресоли.
    const doubleSwing =
      !!opts.doubleSwing || FACADE_COMPOSITE_DOUBLE_CATALOG_IDS.has(catalogItemId);

    if (catalogItemId > 0) {
      variantRow =
        variantsAll.find(
          (r) =>
            r.productKind === productKind && Number(r.catalogItemId) === catalogItemId
        ) || null;
    }
    // Та же карточка catalog_28 на другом продукте (навес/тумба взяли #14 антресоль шкафа):
    // берём отступы/кол-во с уже настроенной строки, не оставляем «Петля тест» на Y=0.
    if (!variantRow && catalogItemId > 0) {
      variantRow =
        variantsAll.find((r) => Number(r.catalogItemId) === catalogItemId) || null;
    }
    if (!variantRow && catalogItemId > 0 && !doubleSwing) {
      const explicitForCatalog = explicitVariantOpensForLayoutRole(
        productKind,
        role,
        opts.zoneHand,
        { doubleSwing, doorDirection: opts.doorDirection }
      );
      if (explicitForCatalog) {
        variantRow =
          variantsAll.find(
            (r) =>
              r.productKind === productKind &&
              Number(r.catalogItemId) === catalogItemId &&
              r.opens === explicitForCatalog.opens
          ) || null;
      }
    }
    if (!variantRow && compositeParentId > 0 && doubleSwing) {
      variantRow =
        variantsAll.find(
          (r) =>
            r.productKind === productKind && Number(r.catalogItemId) === compositeParentId
        ) || null;
    }
    if (!variantRow && variant && opens) {
      variantRow = variantsAll.find(
        (r) => r.productKind === productKind && r.variant === variant && r.opens === opens
      ) || null;
    }
    if (!variantRow) {
      const explicit = explicitVariantOpensForLayoutRole(productKind, role, opts.zoneHand, {
        doubleSwing,
        doorDirection: opts.doorDirection,
      });
      if (explicit) {
        variantRow =
          variantsAll.find(
            (r) =>
              r.productKind === productKind &&
              r.variant === explicit.variant &&
              r.opens === explicit.opens
          ) || null;
      }
    }
    if (!variantRow) {
      const roleAliases = layoutRolesForVariantLookup(role);
      const matchByRole = variantsAll.filter((r) => {
        const meta = PRODUCT_FACADE_VARIANTS.find(
          (v) => v.product === r.productKind && v.variant === r.variant && v.opens === r.opens
        );
        return r.productKind === productKind && meta && roleAliases.has(meta.legacyRole);
      });
      if (doubleSwing) {
        variantRow = matchByRole.find((r) => r.opens === 'double-swing') || null;
      } else {
        const explicitFb = explicitVariantOpensForLayoutRole(productKind, role, opts.zoneHand, {
          doubleSwing,
          doorDirection: opts.doorDirection,
        });
        if (explicitFb) {
          variantRow = matchByRole.find((r) => r.opens === explicitFb.opens) || null;
        }
      }
      variantRow = variantRow || matchByRole[0] || null;
    }
    if (variantRow) {
      const out = {
        ...ensureHingeRoleLayoutParams(variantRow),
        catalogItemId: variantRow.catalogItemId,
        variant: variantRow.variant,
        opens: variantRow.opens,
        schemeId: 0,
      };
      logHingeRoleVerify('resolveHingeRoleLayoutParams', {
        source: 'facadeVariantDefault',
        catalogItemId,
        compositeParentId,
        doubleSwing,
        facadeLayoutRole: role,
        variant: out.variant,
        opens: out.opens,
        hingeCount: out.hingeCount,
        topOffset: out.topOffset,
        bottomOffset: out.bottomOffset,
        middleMode: out.middleMode,
      });
      return out;
    }

    const defaults = readHingeRoleDefaults();
    const pick = (pk, r) => defaults.find((d) => d.productKind === pk && d.role === r) || null;
    const roleAliases = layoutRolesForVariantLookup(role);
    let row = null;
    for (const r of roleAliases) {
      row = pick(productKind, r);
      if (row) break;
    }
    if (!row) row = defaults.find((d) => d.productKind === productKind) || null;
    // Нет строки тумбы/навеса — не оставляем петли на Y=0: fallback на шкаф с той же ролью.
    if (!row && productKind !== 'wardrobe') {
      for (const r of roleAliases) {
        row = pick('wardrobe', r);
        if (row) break;
      }
      if (!row) row = defaults.find((d) => d.productKind === 'wardrobe') || null;
    }
    if (!row) {
      // Последний рубеж: 2×100 как в UI по умолчанию, иначе превью тумбы/навеса «ломается».
      const explicit = explicitVariantOpensForLayoutRole(productKind, role, opts.zoneHand, {
        doubleSwing,
        doorDirection: opts.doorDirection,
      });
      const opensFb =
        (explicit && explicit.opens) ||
        (role === 'facades_top' ? 'lift' : doubleSwing ? 'double-swing' : 'swing-left');
      const out = {
        ...ensureHingeRoleLayoutParams({}),
        catalogItemId,
        variant: (explicit && explicit.variant) || 'main',
        opens: opensFb,
        schemeId: 0,
      };
      logHingeRoleVerify('resolveHingeRoleLayoutParams', {
        source: 'builtinDefault',
        catalogItemId,
        productKind,
        facadeLayoutRole: role,
        opens: out.opens,
        hingeCount: out.hingeCount,
        topOffset: out.topOffset,
        bottomOffset: out.bottomOffset,
      });
      return out;
    }
    const out = {
      ...ensureHingeRoleLayoutParams(row),
      catalogItemId: row.catalogItemId,
      schemeId: row.schemeId,
    };
    logHingeRoleVerify('resolveHingeRoleLayoutParams', {
      source: 'hingeRoleDefault',
      catalogItemId,
      compositeParentId,
      doubleSwing,
      facadeLayoutRole: role,
      hingeCount: out.hingeCount,
      topOffset: out.topOffset,
      bottomOffset: out.bottomOffset,
    });
    return out;
  }

  /**
   * @param {object} params — { topOffset, bottomOffset, hasMiddle, middleDistance, facadeEdgeOffset }
   * @param {number} facadeDimensionMm — длина фасада по оси петли (Y — высота, X — ширина)
   * @param {string} [opensOrRole] — 'swing'|'lift'|'solid' или legacy role
   */
  function roleLayoutParamsToHingeAccessory(params, facadeDimensionMm, opensOrRole) {
    const p = ensureHingeRoleLayoutParams(params);
    const D = Math.max(1, Number(facadeDimensionMm) || 0);
    let axis = hingeAxisForOpens(opensOrRole);
    if (axis === null) {
      return {
        id: 'hinge_role_layout',
        name: 'Цельный фасад (без петель)',
        count: 0,
        hinges: [],
        hingeInsetTopMm: 0,
        hingeInsetBottomMm: 0,
        hingesOffset: 0,
        hingeAxis: null,
        __hingeRoleLayout: true,
        __solid: true,
      };
    }
    if (!axis) axis = hingeAxisForRole(opensOrRole);

    const positions = calcHingeRoleLayoutPositions(p, D);
    const edge = p.facadeEdgeOffset > 0 ? p.facadeEdgeOffset : p.corpusEdgeOffset;
    const drillTid = drillTemplateIdFromRoleLayoutParams(p);
    return {
      id: 'hinge_role_layout',
      name: 'Петли по роли',
      count: positions.length,
      hinges: positions.map((v) => ({ pos: String(v), from: -1, axis })),
      hingeInsetTopMm: p.topOffset,
      hingeInsetBottomMm: p.bottomOffset,
      hingesOffset: edge,
      hingeAxis: axis,
      ...(drillTid > 0
        ? { hingeFacadeDrillTemplateId: drillTid, hingeDoorDrillTemplateId: drillTid }
        : {}),
      __hingeRoleLayout: true,
    };
  }

  /**
   * @param {object} opts — productKind, placementKind, facadeLayoutRole
   * @returns {number} catalog_28 item id or 0
   */
  function resolveFacadeCatalogItemId(opts) {
    opts = opts || {};
    const productKind =
      String(opts.productKind || '').trim() ||
      placementKindToProductKind(opts.placementKind);
    const role = String(opts.facadeLayoutRole || 'facades').trim() || 'facades';
    const roleAliases = layoutRolesForVariantLookup(role);
    const defaults = readFacadeRoleDefaults();
    const exact = defaults.find(
      (d) => d.productKind === productKind && roleAliases.has(d.role)
    );
    if (exact) return exact.catalogItemId;
    if (role !== 'facades') {
      const fb = defaults.find((d) => d.productKind === productKind && d.role === 'facades');
      if (fb) return fb.catalogItemId;
    }
    const any = defaults.find((d) => d.productKind === productKind);
    return any ? any.catalogItemId : 0;
  }

  function placementKindToProductKind(placementKind) {
    const pk = String(placementKind || '').trim().toLowerCase();
    if (pk === 'standalone_floor') return 'pedestal';
    // wall_hung_low / wall_hung_high — те же навесные, что legacy wall_hung
    if (pk === 'wall_hung' || pk === 'wall_hung_low' || pk === 'wall_hung_high') {
      return 'wall_hung';
    }
    if (pk === 'corpus_only') return 'wardrobe';
    if (
      pk === 'kitchen_base' ||
      pk === 'kitchen_base_gola' ||
      pk === 'kitchen_base_corner'
    ) {
      return 'kitchen_base';
    }
    return 'wardrobe';
  }

  /**
   * @param {object} opts
   * @param {string} [opts.facadeLayoutRole]
   * @param {string} [opts.productKind]
   * @param {string} [opts.placementKind]
   * @param {number|string} [opts.specHingeLayoutId]
   * @param {number|string} [opts.catalogHingeLayoutId]
   * @param {number|string} [opts.furnitureHingeLayoutOverride]
   */
  function resolveHingeLayoutScheme(opts) {
    opts = opts || {};
    const tryId = (id) => {
      const n = Number(id);
      if (!Number.isFinite(n) || n <= 0) return null;
      return getHingeLayoutSchemeById(n);
    };

    let scheme =
      tryId(opts.furnitureHingeLayoutOverride) ||
      tryId(opts.catalogHingeLayoutId) ||
      tryId(opts.specHingeLayoutId);
    if (scheme) return scheme;

    const productKind =
      String(opts.productKind || '').trim() ||
      placementKindToProductKind(opts.placementKind);
    const role = String(opts.facadeLayoutRole || 'facades').trim() || 'facades';
    const roleAliases = layoutRolesForVariantLookup(role);
    const defaults = readHingeRoleDefaults();

    const exact = defaults.find(
      (d) => d.productKind === productKind && roleAliases.has(d.role)
    );
    if (exact) {
      if (exact.schemeId > 0) scheme = tryId(exact.schemeId);
      if (!scheme && exact.catalogItemId > 0) {
        scheme = ensureHingeLayoutScheme({
          ...ensureHingeRoleLayoutParams(exact),
          name: 'Петли по роли',
        });
      }
    }
    const rowToScheme = (row) => {
      if (!row) return null;
      if (row.schemeId > 0) return tryId(row.schemeId);
      if (row.catalogItemId > 0) {
        return ensureHingeLayoutScheme({
          ...ensureHingeRoleLayoutParams(row),
          name: 'Петли по роли',
        });
      }
      return null;
    };
    if (!scheme && role !== 'facades') {
      scheme = rowToScheme(defaults.find((d) => d.productKind === productKind && d.role === 'facades'));
    }
    if (!scheme) {
      scheme = rowToScheme(defaults.find((d) => d.productKind === productKind));
    }
    if (!scheme) {
      const all = readHingeLayoutSchemes();
      if (all.length) scheme = all[0];
    }
    return scheme || null;
  }

  function isHingeModuleTreeNode(node) {
    if (!node || typeof node !== 'object') return false;
    return (
      String(node.type || '').toLowerCase() === 'module' &&
      String(node.spec?.element_type || '').toLowerCase() === 'hinges'
    );
  }

  /** Распашной аниматор двери (не hinge_animator). */
  function isSwingDoorRotateAnimator(node) {
    if (!node || typeof node !== 'object') return false;
    if (String(node.type || '').toLowerCase() !== 'animator') return false;
    if (String(node.spec?.fn || '').toLowerCase() !== 'rotate') return false;
    if (String(node.spec?.source?.id || '').toLowerCase() === 'hinge_animator') return false;
    const ch = node.children;
    return Array.isArray(ch) && ch.some((c) => String(c?.type || '').toLowerCase() === 'facade');
  }

  function countSwingDoorAnimatorsInTree(nodes) {
    let n = 0;
    const walk = (list) => {
      if (!Array.isArray(list)) return;
      for (const node of list) {
        if (!node || typeof node !== 'object') continue;
        if (isSwingDoorRotateAnimator(node)) n += 1;
        if (Array.isArray(node.children)) walk(node.children);
        if (Array.isArray(node.spec?.template_tree)) walk(node.spec.template_tree);
      }
    };
    walk(nodes);
    return n;
  }

  /**
   * Параметры pos.x петли для одной створки: ly/ry и половина ширины при 2+ распашных аниматорах.
   */
  function resolveSiblingHingeLayoutOpts(siblings, globalOpts, treeRoot) {
    const base = globalOpts && typeof globalOpts === 'object' ? { ...globalOpts } : {};
    let doorDir = String(base.doorDirection || 'ly').toLowerCase();
    if (Array.isArray(siblings)) {
      for (const n of siblings) {
        if (!isSwingDoorRotateAnimator(n)) continue;
        doorDir = String(n.spec?.props?.direction || 'ly').toLowerCase();
        break;
      }
      if (!siblings.some(isSwingDoorRotateAnimator)) {
        const hingeTpl = siblings.find(isHingeModuleTreeNode);
        if (hingeTpl && hingeModuleRtlUsesFlipAnchor(hingeTpl)) doorDir = 'ry';
      }
    }
    let leafW = Number(base.facadeWidthMm) || 0;
    if (leafW > 0 && countSwingDoorAnimatorsInTree(treeRoot) >= 2) {
      leafW = leafW / 2;
    }
    return { ...base, doorDirection: doorDir, facadeWidthMm: leafW };
  }

  /** мм от низа/начала оси (как v() в рефе build_hinges). */
  function hingeAccessoryPosToMm(h, dimensionMm) {
    const D = Math.max(1, Number(dimensionMm) || 0);
    let pos = h?.pos != null ? String(h.pos) : '0';
    const from = h?.from != null ? Number(h.from) : -1;
    let isPct = false;
    if (pos.endsWith('%')) {
      pos = pos.slice(0, -1);
      isPct = true;
    }
    let v = parseFloat(pos) || 0;
    if (isPct) v = (v / 100) * D;
    if (from === 0) return D / 2 + v;
    if (from > 0) return D - v;
    return v;
  }

  /**
   * Реф part7 Door_new.build_hinges: BLB модуля на внутренней грани бока (doorEdge + wallT).
   * Центр корпусной чашки = doorEdge + wallT + corpusW/2 за счёт model «корпус» в catalog_31 (pos.x=0).
   *
   * Комната, catalog_31 + rot.z=180 (правая створка): pivot.x=-1, якорь на внутренней грани
   * боковины — зеркало левой (wallT), без вычитания corpusW (24 мм «внутрь»).
   *
   * hingePreviewCorpusRelPosMm — смещение из превью админки (сравнение двух сборок), в дереве
   * catalog_31 оно НЕ дублируется в pos модели; вычитать corpusRel из pos.x модуля = уход в бок (−5 мм).
   */
  function hingeModuleRtlUsesFlipAnchor(node) {
    const rz = Number(node?.rot?.z ?? node?.c_rot?.z ?? 0);
    return Math.abs(Math.abs(rz) - 180) < 0.01;
  }

  function hingeModuleRefPosXInThinFacadeShell(node, opts) {
    void node;
    opts = opts || {};
    const dir = String(opts.doorDirection || 'ly').toLowerCase();
    const isRTL = /^(r|ry|rtl|right)/.test(dir);
    const doorW = Number(opts.facadeWidthMm) || 0;
    // Накладной фасад: дверь закрывает торец бока; шов = внутренняя пласть (не кромка двери).
    const overlayT = Number(opts.overlaySideThicknessMm) || 0;
    if (overlayT > 0) {
      if (isRTL && doorW > 0) return Math.max(0, doorW - overlayT);
      return overlayT;
    }
    // Вставной / кромка шва: 0 LTR / doorW RTL.
    if (isRTL && doorW > 0) return doorW;
    return 0;
  }

  /** setupType=2 + facadeModelId в шаблоне присадки (как L-пакет в комнате). */
  function isLSeamHingeModuleNode(node) {
    if (!node || typeof node !== 'object') return false;
    const sp = node.spec && typeof node.spec === 'object' ? node.spec : {};
    const tids = [
      sp.hingeDoorDrillTemplateId,
      sp.hingeFacadeDrillTemplateId,
      sp.drillTemplateId,
      sp.drillingTemplateId,
      sp.doorDrillTemplateId,
    ]
      .map((v) => Number(v) || 0)
      .filter((n) => n > 0);
    // catalog_31 id часто = id шаблона присадки (карточка L).
    if (String(sp.element_type || '').toLowerCase() === 'hinges') {
      const mid = Number(sp.id) || 0;
      if (mid > 0) tids.push(mid);
    }
    // Присадка в дереве: spec.id = id шаблона
    const walk = (arr) => {
      if (!Array.isArray(arr)) return;
      for (const n of arr) {
        if (!n || typeof n !== 'object') continue;
        if (String(n.type || '').toLowerCase() === 'furniture' && /присадк/i.test(String(n.name || ''))) {
          const id = Number(n.spec?.id) || 0;
          if (id > 0) tids.push(id);
        }
        if (Array.isArray(n.children)) walk(n.children);
      }
    };
    walk(node.children || node.child);
    walk(sp.template_tree);
    if (!tids.length) return false;
    let list = [];
    try {
      if (typeof localStorage !== 'undefined') {
        list = JSON.parse(localStorage.getItem('clodis_drilling_templates_v2') || '[]');
      }
    } catch (_) {
      list = [];
    }
    if (!Array.isArray(list)) return false;
    for (const tid of tids) {
      const tpl = list.find((t) => Number(t?.id) === tid);
      if (!tpl) continue;
      if (Number(tpl.setupType ?? tpl.currentSetupType) === 2 && Number(tpl.facadeModelId) > 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Расстановка петель: pos.y → 0 (база по высоте слота).
   * Тонкая оболочка facades_*:
   *   pos.x — кромка шва (0 / doorW);
   *   pos.z — facadeSeamZMm (0 = тыл накладного фасада = перед бока);
   * L: pivot 0, size 0 (ноль шаблона = origin на шве).
   */
  function prepareHingeModuleForRoleLayout(node, opts) {
    if (!node || typeof node !== 'object') return;
    opts = opts || {};
    const raw = node.pos && typeof node.pos === 'object' ? node.pos : {};
    const shellD = Number(opts.facadeShellDepthMm);
    const thinFacadeShell = shellD > 0 && shellD <= 40;
    const isL = isLSeamHingeModuleNode(node);
    let z = raw.z !== undefined && raw.z !== null ? raw.z : 0;
    if (thinFacadeShell) {
      // Шов: по умолчанию тыл накладного фасада (z=0).
      // opts.facadeSeamZMm — явный override (раньше z=shellD для «фасад=оболочка»).
      const seamZ = Number(opts.facadeSeamZMm);
      z = Number.isFinite(seamZ) ? seamZ : 0;
    }
    let x = raw.x !== undefined && raw.x !== null ? raw.x : 0;
    if (thinFacadeShell) {
      x = hingeModuleRefPosXInThinFacadeShell(node, opts);
    }
    node.pos = {
      x,
      y: 0,
      z,
    };
    const overlayT = Number(opts.overlaySideThicknessMm) || 0;
    if (overlayT > 0) {
      node.spec = node.spec && typeof node.spec === 'object' ? { ...node.spec } : {};
      node.spec.cldOverlaySeamLayout = 1;
      node.spec.cldOverlaySeamXMm = overlayT;
    }
    // L-пакет: ноль шаблона = origin модуля на шве (не BLB pivot −1 / size/2).
    if (isL) {
      node.pivot = { x: 0, y: 0, z: 0 };
      // Размер карточки 50×67×150 не должен участвовать в BLB/якоре на фасаде.
      node.size = { x: 0, y: 0, z: 0 };
      if (node.spec && typeof node.spec === 'object') {
        node.spec.ref_size_mm = { x: 0, y: 0, z: 0 };
      }
    }
    if (node.position) delete node.position;
  }

  /**
   * Смещение pos модуля петли до оси hinge_animator (чашка) вдоль оси раскладки, мм.
   * Точка раскладки — центр shell (pivot 0 + превью size 35×35): ось аниматора ниже на size.y/2.
   * Важно: не округлять slot+offset (50+17.5→67.5); иначе Math.round даёт 68 и метка +1 мм (51).
   */
  function resolveHingeRoleLayoutAnchorOffsetMm(module, axisKey) {
    if (!module || typeof module !== 'object') return 0;
    const sp = module.spec && typeof module.spec === 'object' ? module.spec : {};
    const key = String(axisKey || 'y').toLowerCase() === 'x' ? 'x' : 'y';
    const stored =
      key === 'x' ? sp.hingeLayoutAnchorOffsetXMm : sp.hingeLayoutAnchorOffsetYMm;
    if (Number.isFinite(Number(stored))) return Number(stored);

    const pivot = module.pivot && typeof module.pivot === 'object' ? module.pivot : {};
    const pv = key === 'x' ? Number(pivot.x) : Number(pivot.y);
    if (!(Number.isFinite(pv) && pv === 0)) return 0;

    const size = module.size && typeof module.size === 'object' ? module.size : {};
    const ref = sp.ref_size_mm && typeof sp.ref_size_mm === 'object' ? sp.ref_size_mm : {};
    const dim =
      key === 'x'
        ? Number(size.x) || Number(ref.x) || 0
        : Number(size.y) || Number(ref.y) || 0;
    if (dim > 0 && dim <= 80) return dim / 2;

    const swingModel = sp.hingePreviewSwingModelPosMm;
    const swingAnim = sp.hingePreviewSwingPosMm;
    let off = 0;
    if (swingAnim && Number.isFinite(Number(swingAnim[key]))) off += Number(swingAnim[key]);
    if (swingModel && Number.isFinite(Number(swingModel[key]))) off += Number(swingModel[key]);
    return off;
  }

  function stripHingeModuleNodesInTree(nodes) {
    if (!Array.isArray(nodes)) return;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (isHingeModuleTreeNode(n)) {
        nodes.splice(i, 1);
        continue;
      }
      if (Array.isArray(n?.children)) stripHingeModuleNodesInTree(n.children);
      // #14/#13: петли внутри live_catalog → spec.template_tree после hydrate
      if (Array.isArray(n?.spec?.template_tree)) {
        stripHingeModuleNodesInTree(n.spec.template_tree);
      }
    }
  }

  /**
   * Размер фасада для раскладки петель — как sizeMm.h на странице «петли по ролям»:
   * высота/ширина оболочки facades_*, не вся родительская секция корпуса.
   */
  function resolveFacadeRoleHingeDimensionMm(facadeShellSize, parentSectionSize, axis) {
    const shell = facadeShellSize && typeof facadeShellSize === 'object' ? facadeShellSize : {};
    const parent =
      parentSectionSize && typeof parentSectionSize === 'object' ? parentSectionSize : {};
    const ax = String(axis || 'Y').toUpperCase();
    if (ax === 'X') {
      const sx = Number(shell.x);
      if (sx > 0) return sx;
      return Math.max(1, Number(parent.x) || 1);
    }
    const sy = Number(shell.y);
    if (sy > 0) return sy;
    return Math.max(1, Number(parent.y) || 1);
  }

  function hingeRoleVerifyEnabled() {
    if (typeof window === 'undefined') return false;
    return window.DEBUG_HINGE_ROLE_VERIFY === true || window.DEBUG_HINGE_ROOM === true;
  }

  function logHingeRoleVerify(tag, payload) {
    if (!hingeRoleVerifyEnabled()) return;
    console.warn(`[CLD][HINGE-VERIFY][${tag}]`, payload);
  }

  /**
   * Y петель (мм от низа фасада) — те же значения, что «петли по ролям».
   * Если в layoutAcc уже есть hinges[] (из calcHingeRoleLayoutPositions) — берём их,
   * иначе старый равномерный шаг по отступам (не для 4 петель: там был 584 вместо 583).
   */
  function calcIntegerRoleHingeYs(layoutAcc, doorH) {
    const hinges = Array.isArray(layoutAcc?.hinges) ? layoutAcc.hinges : [];
    const D = Math.max(1, Number(doorH) || 0);
    if (hinges.length) {
      return hinges.map((h) => Math.round(hingeAccessoryPosToMm(h, D)));
    }
    const N = Math.max(0, Math.round(Number(layoutAcc?.count) || 0));
    if (N <= 0) return [];
    const top = Number.isFinite(Number(layoutAcc?.hingeInsetTopMm))
      ? Number(layoutAcc.hingeInsetTopMm)
      : 0;
    const bottom = Number.isFinite(Number(layoutAcc?.hingeInsetBottomMm))
      ? Number(layoutAcc.hingeInsetBottomMm)
      : 0;
    const y0 = Math.round(bottom);
    const yLast = Math.round(D - top);
    if (N === 1) return [y0];
    let remaining = yLast - y0;
    const gapsCount = N - 1;
    if (!Number.isFinite(remaining) || remaining < 0) remaining = 0;
    const base = Math.floor(remaining / gapsCount);
    const rem = remaining - base * gapsCount;
    const ys = [];
    for (let i = 0; i < N; i++) {
      const plus = i < rem ? i : rem;
      ys.push(y0 + i * base + plus);
    }
    return ys;
  }

  /**
   * Дублирует каталожные module hinges в JSON по позициям из layoutAcc.hinges[].
   * Визуал и присадка — из template_tree петли (catalog_31), не из accessory GLB.
   * @returns {boolean} были ли модули петель в дереве
   */
  /**
   * Карточка double-swing (#13/#14): в админке часто 4 петли на всю створку → по 2 на каждую половину.
   */
  function layoutAccPerDoorLeafGroup(layoutAcc, dimMm, treeRoot) {
    if (!layoutAcc || !Array.isArray(layoutAcc.hinges) || !layoutAcc.hinges.length) {
      return layoutAcc;
    }
    const swingN = countSwingDoorAnimatorsInTree(treeRoot);
    if (swingN < 2) return layoutAcc;
    const opens = String(layoutAcc.__hingeRoleOpens || '').toLowerCase();
    if (opens !== 'double-swing') return layoutAcc;
    const total = Math.max(0, Math.round(Number(layoutAcc.count) || layoutAcc.hinges.length));
    if (total <= 2) return layoutAcc;
    const perLeaf = Math.max(2, Math.round(total / swingN));
    const base = layoutAcc.__hingeRoleParams
      ? ensureHingeRoleLayoutParams(layoutAcc.__hingeRoleParams)
      : ensureHingeRoleLayoutParams({
          topOffset: layoutAcc.hingeInsetTopMm,
          bottomOffset: layoutAcc.hingeInsetBottomMm,
        });
    const out = roleLayoutParamsToHingeAccessory(
      { ...base, hingeCount: perLeaf },
      dimMm,
      'double-swing'
    );
    out.__hingeRoleOpens = 'double-swing';
    out.__hingeRoleParams = layoutAcc.__hingeRoleParams || {
      hingeCount: perLeaf,
      topOffset: base.topOffset,
      bottomOffset: base.bottomOffset,
    };
    return out;
  }

  function applyRoleLayoutCatalogHingeModulesInTree(tree, layoutAcc, opts) {
    opts = opts || {};
    if (!Array.isArray(tree)) return false;
    if (layoutAcc && layoutAcc.__solid) {
      stripHingeModuleNodesInTree(tree);
      return false;
    }
    const slots = layoutAcc && Array.isArray(layoutAcc.hinges) ? layoutAcc.hinges : [];
    if (!slots.length) return false;

    const unifiedFacade = !!(layoutAcc && layoutAcc.__unifiedFacade);
    let unifiedApplied = false;

    const axis =
      opts.axis ||
      (layoutAcc && layoutAcc.hingeAxis) ||
      (slots[0] && slots[0].axis) ||
      'Y';
    const axisKey = String(axis).toUpperCase() === 'X' ? 'x' : 'y';
    const dimMm = Math.max(1, Number(opts.dimensionMm) || 0);

    let applied = false;

    const layoutSiblings = (nodes) => {
      if (!Array.isArray(nodes) || !nodes.some(isHingeModuleTreeNode)) return;
      if (unifiedFacade && !nodes.some(isSwingDoorRotateAnimator)) return;
      if (unifiedFacade && unifiedApplied) {
        for (let i = nodes.length - 1; i >= 0; i--) {
          if (isHingeModuleTreeNode(nodes[i])) nodes.splice(i, 1);
        }
        return;
      }
      const template = nodes.find(isHingeModuleTreeNode);
      if (!template) return;
      const leafOpts = resolveSiblingHingeLayoutOpts(nodes, opts, tree);
      const templateJson = JSON.parse(JSON.stringify(template));
      prepareHingeModuleForRoleLayout(templateJson, leafOpts);
      const anchorOff =
        opts.useAnchorOffset === false ? 0 : resolveHingeRoleLayoutAnchorOffsetMm(templateJson, axisKey);
      const accForLeaf = layoutAccPerDoorLeafGroup(layoutAcc, dimMm, tree);
      const slotsForLeaf =
        accForLeaf && Array.isArray(accForLeaf.hinges) ? accForLeaf.hinges : slots;
      const useIntegerRoleY =
        opts.useAnchorOffset === false &&
        axisKey === 'y' &&
        !!(accForLeaf && accForLeaf.__hingeRoleLayout);
      const hingeYsInt = useIntegerRoleY ? calcIntegerRoleHingeYs(accForLeaf, dimMm) : null;
      for (let i = nodes.length - 1; i >= 0; i--) {
        if (isHingeModuleTreeNode(nodes[i])) nodes.splice(i, 1);
      }
      const appliedSlots = [];
      slotsForLeaf.forEach((h, idx) => {
        const inst = JSON.parse(JSON.stringify(templateJson));
        inst.id = `hinge_layout_${idx}`;
        prepareHingeModuleForRoleLayout(inst, leafOpts);
        const expectedMm =
          hingeYsInt != null
            ? (hingeYsInt[idx] ?? hingeAccessoryPosToMm(h, dimMm))
            : hingeAccessoryPosToMm(h, dimMm);
        const slotMm = expectedMm + anchorOff;
        inst.pos[axisKey] = slotMm;
        inst.__hingeRoleExpectedYMm = expectedMm;
        inst.__hingeRoleTreePosYMm = slotMm;
        // Базовая высота полотна (без свеса) для якоря петли «от верха».
        if (axisKey === 'y') inst.__hingeRoleDoorHeightMm = dimMm;
        appliedSlots.push({
          idx,
          id: inst.id,
          expectedMm,
          treePosMm: slotMm,
          anchorOffMm: anchorOff,
          useIntegerRoleY: hingeYsInt != null,
        });
        nodes.push(inst);
      });
      logHingeRoleVerify('applyRoleLayoutCatalogHingeModulesInTree', {
        axis,
        dimensionMm: dimMm,
        unifiedFacade,
        leafDoorDirection: leafOpts.doorDirection,
        leafFacadeWidthMm: leafOpts.facadeWidthMm,
        useAnchorOffset: opts.useAnchorOffset !== false,
        useIntegerRoleY: hingeYsInt != null,
        hingeYsInt,
        insetTopMm: accForLeaf?.hingeInsetTopMm ?? layoutAcc?.hingeInsetTopMm,
        insetBottomMm: accForLeaf?.hingeInsetBottomMm ?? layoutAcc?.hingeInsetBottomMm,
        hingeCountLeaf: slotsForLeaf.length,
        slots: appliedSlots,
      });
      applied = true;
      if (unifiedFacade) unifiedApplied = true;
    };

    const walk = (nodes) => {
      if (!Array.isArray(nodes)) return;
      layoutSiblings(nodes);
      for (const n of nodes) {
        if (Array.isArray(n?.children)) walk(n.children);
        // Двустворчатые #13/#14: створки — live_catalog module с пустыми children;
        // после hydrate петли лежат в spec.template_tree (как у _treeHasHingeModuleNodes).
        if (Array.isArray(n?.spec?.template_tree)) walk(n.spec.template_tree);
      }
    };
    walk(tree);
    return applied;
  }

  function schemeToHingeAccessory(scheme, doorHeightMm) {
    const l = ensureHingeLayoutScheme(scheme);
    const ys = calcHingeLayoutPositions(l, doorHeightMm);
    return {
      id: 'hinge_layout_' + (l.id || '0'),
      name: l.name || 'Петля',
      count: ys.length,
      hinges: ys.map((y) => ({ pos: String(y), from: -1 })),
      hingeInsetTopMm: l.topOffset,
      hingeInsetBottomMm: l.bottomOffset,
      hingesOffset: Number(l.facadeEdgeOffset) > 0 ? l.facadeEdgeOffset : l.corpusEdgeOffset,
      hingeCabinetThicknessMm: l.sideThickness,
      hingeDoorDrillTemplateId: l.drillTemplateId || 0,
      hingeFacadeDrillTemplateId: l.drillTemplateId || 0,
      __hingeLayoutSchemeId: l.id,
    };
  }

  /**
   * Каталоги для hydrate в превью (iframe → parent.__CLD_CATALOGS_DATA).
   */
  function readPreviewCatalogsBucket() {
    try {
      if (typeof window === 'undefined') return null;
      if (window.parent && window.parent !== window && window.parent.__CLD_CATALOGS_DATA) {
        return window.parent.__CLD_CATALOGS_DATA;
      }
      return window.__CLD_CATALOGS_DATA || null;
    } catch (_) {
      return null;
    }
  }

  function resolveModuleTreeFromPreviewCatalogs(elementType, elementId) {
    const catalogs = readPreviewCatalogsBucket();
    const et = String(elementType || '').trim();
    const id = String(elementId ?? '').trim();
    if (!et || !id || !catalogs || typeof catalogs !== 'object') return null;
    const bucket = catalogs[et]?.items?.[id];
    if (!bucket) return null;
    let cs = bucket.params?.constructor_structure ?? bucket.data?.constructor_structure;
    if (typeof cs === 'string') {
      try {
        cs = JSON.parse(cs);
      } catch (_) {
        cs = null;
      }
    }
    const pickTree = (root) => {
      if (!root || typeof root !== 'object') return null;
      if (Array.isArray(root.clodisJSON) && root.clodisJSON.length) return root.clodisJSON;
      const readJson =
        typeof global !== 'undefined' && typeof global.__cldReadClodisJSON === 'function'
          ? global.__cldReadClodisJSON
          : null;
      if (readJson) {
        const fromJson = readJson(root) || readJson(root.params) || readJson(root.data);
        if (Array.isArray(fromJson) && fromJson.length) return fromJson;
      }
      const t =
        root?.template?.structure ||
        root?.spec?.template?.tree ||
        (Array.isArray(cs) ? cs : null) ||
        cs?.template?.structure ||
        cs?.spec?.template?.tree ||
        (Array.isArray(cs?.children) ? cs.children : null) ||
        null;
      return Array.isArray(t) && t.length ? t : null;
    };
    // iframe: тот же resolver, что expandCatalogModules
    try {
      if (typeof global.__cldTryResolveModuleTreeFromCatalog === 'function') {
        const viaExpand = global.__cldTryResolveModuleTreeFromCatalog(et, id, bucket?.params || bucket?.data || {});
        if (Array.isArray(viaExpand) && viaExpand.length) return viaExpand;
      }
    } catch (_) {}
    return (
      pickTree(bucket) ||
      pickTree(bucket.params) ||
      pickTree(bucket.data) ||
      pickTree(cs)
    );
  }

  /**
   * live_catalog module с пустыми children → spec.template_tree (как ClodisBuilder / «Петли по ролям»).
   * Без этого applyFacadeRoleHingeYInPreviewTree не видит петли у #14 в превью конструктора.
   */
  function hydrateLiveCatalogModulesInPreviewTree(tree) {
    if (!Array.isArray(tree) || !tree.length) return tree;
    let current;
    try {
      current = JSON.parse(JSON.stringify(tree));
    } catch (_) {
      return tree;
    }
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      const t = String(node.type || '').toLowerCase();
      if (t === 'module') {
        const ch = node.children;
        const emptyCh = !Array.isArray(ch) || ch.length === 0;
        const et = String(node.spec?.element_type || '').trim();
        const id = String(node.spec?.id ?? '').trim();
        const hasTpl =
          (Array.isArray(node.spec?.template_tree) && node.spec.template_tree.length > 0) ||
          (Array.isArray(node.spec?.templates?.[0]?.template?.tree) &&
            node.spec.templates[0].template.tree.length > 0);
        if (emptyCh && et && id && !hasTpl) {
          let tpl = resolveModuleTreeFromPreviewCatalogs(et, id);
          if ((!tpl || !tpl.length) && String(et).toLowerCase() === 'hinges') {
            const hk = String(node.spec?.hingeCatalogTypeKey || 'catalog_31').trim() || 'catalog_31';
            tpl = resolveModuleTreeFromPreviewCatalogs(hk, id);
          }
          if (Array.isArray(tpl) && tpl.length) {
            node.spec = node.spec && typeof node.spec === 'object' ? { ...node.spec } : {};
            try {
              node.spec.template_tree = JSON.parse(JSON.stringify(tpl));
            } catch (_) {
              node.spec.template_tree = tpl;
            }
          }
        }
        if (Array.isArray(node.spec?.template_tree)) {
          node.spec.template_tree.forEach(walk);
        }
      }
      if (Array.isArray(node.children)) node.children.forEach(walk);
    };
    for (let pass = 0; pass < 6; pass++) {
      const before = JSON.stringify(current);
      if (Array.isArray(current)) current.forEach(walk);
      try {
        if (JSON.stringify(current) === before) break;
      } catch (_) {
        break;
      }
    }
    // Мутируем исходное дерево на месте (caller держит ссылку moduleTemplateTree).
    if (Array.isArray(tree) && Array.isArray(current)) {
      tree.length = 0;
      for (const n of current) tree.push(n);
    }
    return tree;
  }

  /**
   * Преview-only: расстановка петель по ролям — тот же applyRoleLayoutCatalogHingeModulesInTree,
   * что «Петли по ролям» (Y + шов X накладной), после hydrate live_catalog.
   *
   * Опции: { widthMm, heightMm, depthMm, vars, placementKind, productKind }.
   * Возвращает { applied, skipped, roles }.
   */
  function applyFacadeRoleHingeYInPreviewTree(tree, opts) {
    opts = opts || {};
    if (!Array.isArray(tree)) return { applied: 0, skipped: 0, roles: [] };

    hydrateLiveCatalogModulesInPreviewTree(tree);

    const w = Number(opts.widthMm) || 0;
    const h = Number(opts.heightMm) || 0;
    const d = Number(opts.depthMm) || 0;
    const vIn = opts.vars && typeof opts.vars === 'object' ? opts.vars : {};
    const previewTree = Array.isArray(opts.tree) ? opts.tree : tree;
    const hasCorpusAntresol =
      previewTree && planTreeHasLayoutRole(previewTree, 'corpus_antresol');
    const placementKind = String(opts.placementKind || 'floor_in_niche').trim();
    const productKind =
      String(opts.productKind || '').trim() || placementKindToProductKind(placementKind);
    // Навес / тумба: не подставлять шкафный h_bottom=100 — иначе высота фасада «съезжает».
    const useWardrobeBandDefaults = productKind === 'wardrobe';
    const vars = {
      h_bottom: Number.isFinite(Number(vIn.h_bottom))
        ? Number(vIn.h_bottom)
        : useWardrobeBandDefaults
          ? 100
          : 0,
      h_top: Number.isFinite(Number(vIn.h_top)) ? Number(vIn.h_top) : 0,
      tech_zone_mm: Number.isFinite(Number(vIn.tech_zone_mm)) ? Number(vIn.tech_zone_mm) : 0,
      facade_thickness_mm: Number.isFinite(Number(vIn.facade_thickness_mm))
        ? Number(vIn.facade_thickness_mm)
        : 16,
    };
    if (
      hasCorpusAntresol &&
      Number.isFinite(Number(vIn.corpus_antresol_mm))
    ) {
      vars.corpus_antresol_mm = Number(vIn.corpus_antresol_mm);
    } else if (hasCorpusAntresol) {
      vars.corpus_antresol_mm = 1950;
    }
    const sizeCtx = { s: { x: w, y: h, z: d }, v: vars };
    const seen = { applied: 0, skipped: 0, roles: [] };

    const evalExpr = (expr) => {
      if (typeof expr === 'number' && Number.isFinite(expr)) return expr;
      let str = String(expr ?? '').trim();
      if (!str) return NaN;
      str = str
        .replace(/\bs:x\b/g, String(Number(sizeCtx.s.x) || 0))
        .replace(/\bs:y\b/g, String(Number(sizeCtx.s.y) || 0))
        .replace(/\bs:z\b/g, String(Number(sizeCtx.s.z) || 0))
        .replace(/\bv:([a-zA-Z0-9_]+)\b/g, (_, key) => {
          const val = sizeCtx.v[key];
          return Number.isFinite(Number(val)) ? String(Number(val)) : '0';
        });
      if (!/^[0-9+\-*/().\s]+$/.test(str)) return NaN;
      try {
        const n = Function('"use strict"; return (' + str + ');')();
        return Number.isFinite(Number(n)) ? Number(n) : NaN;
      } catch (_) {
        return NaN;
      }
    };

    const fallbackDimByRole = (role) => {
      if (role === 'facades_main') {
        if (hasCorpusAntresol && Number(vars.corpus_antresol_mm) > 0) {
          return Math.max(1, Number(vars.corpus_antresol_mm));
        }
        return corpusInnerFacadeBandMm({ heightMm: h, vars });
      }
      if (role === 'facades_top') {
        const ant = hasCorpusAntresol ? Math.max(0, Number(vars.corpus_antresol_mm) || 0) : 0;
        return Math.max(1, h - vars.h_bottom - ant - vars.tech_zone_mm);
      }
      return corpusInnerFacadeBandMm({ heightMm: h, vars });
    };

    const layoutForRole = (role, dimMm, catalogItemId) => {
      const params = resolveHingeRoleLayoutParams({
        productKind,
        placementKind,
        facadeLayoutRole: role,
        catalogItemId,
        facadeCatalogItemId: catalogItemId,
        doubleSwing: FACADE_COMPOSITE_DOUBLE_CATALOG_IDS.has(Number(catalogItemId) || 0),
      });
      if (!params) return null;
      const opens =
        String(params.opens || '').trim().toLowerCase() ||
        (role === 'facades_top' ? 'lift' : 'swing');
      const acc = roleLayoutParamsToHingeAccessory(
        params,
        Math.max(1, Number(dimMm) || 1),
        opens
      );
      if (acc) {
        acc.__hingeRoleOpens = opens;
        acc.__hingeRoleParams = ensureHingeRoleLayoutParams(params);
      }
      return acc;
    };

    const handleFacadeModule = (moduleNode) => {
      const role = String(moduleNode?.layout_role ?? moduleNode?.sectionLayoutRole ?? '')
        .trim()
        .toLowerCase();
      if (role !== 'facades_main' && role !== 'facades_top' && role !== 'facades') return false;
      moduleNode.spec = moduleNode.spec && typeof moduleNode.spec === 'object' ? { ...moduleNode.spec } : {};
      let tpl = Array.isArray(moduleNode.spec.template_tree) ? moduleNode.spec.template_tree : null;
      if ((!tpl || !tpl.length) && moduleNode.spec.id != null) {
        const resolved = resolveModuleTreeFromPreviewCatalogs(
          moduleNode.spec.element_type,
          moduleNode.spec.id
        );
        if (Array.isArray(resolved) && resolved.length) {
          try {
            moduleNode.spec.template_tree = JSON.parse(JSON.stringify(resolved));
          } catch (_) {
            moduleNode.spec.template_tree = resolved;
          }
          hydrateLiveCatalogModulesInPreviewTree(moduleNode.spec.template_tree);
          tpl = moduleNode.spec.template_tree;
        }
      }
      if (!tpl || !tpl.length) return false;
      const hasHinge = (() => {
        let found = false;
        const walk = (nodes) => {
          if (!Array.isArray(nodes) || found) return;
          for (const n of nodes) {
            if (isHingeModuleTreeNode(n)) {
              found = true;
              return;
            }
            if (Array.isArray(n?.children)) walk(n.children);
            if (Array.isArray(n?.spec?.template_tree)) walk(n.spec.template_tree);
          }
        };
        walk(tpl);
        return found;
      })();
      if (!hasHinge) return false;

      let dimMm = evalExpr(moduleNode.size?.y);
      if (!(dimMm > 0)) dimMm = fallbackDimByRole(role);
      const innerBand = corpusInnerFacadeBandMm({ heightMm: h, vars });
      // Clamp «полосы корпуса» — только шкаф; навес/тумба берут size.y как есть.
      if (productKind === 'wardrobe' && role === 'facades_main' && !hasCorpusAntresol) {
        if (!(dimMm > 0) || dimMm > innerBand * 1.05) dimMm = innerBand;
      } else if (role === 'facades_top' && dimMm > h) {
        dimMm = fallbackDimByRole(role);
      }
      dimMm = Math.max(1, dimMm);
      const facadeCatalogId = Number(moduleNode.spec.id) || 0;
      const layoutAcc = layoutForRole(role, dimMm, facadeCatalogId);
      if (!layoutAcc || layoutAcc.__solid) return false;
      const shellD = evalExpr(moduleNode.size?.z);
      const shellW = evalExpr(moduleNode.size?.x);
      let doorDir = 'ly';
      const walkDir = (nodes) => {
        if (!Array.isArray(nodes)) return false;
        for (const n of nodes) {
          if (isSwingDoorRotateAnimator(n)) {
            doorDir = String(n.spec?.props?.direction || 'ly').toLowerCase();
            return true;
          }
          if (Array.isArray(n?.children) && walkDir(n.children)) return true;
          if (Array.isArray(n?.spec?.template_tree) && walkDir(n.spec.template_tree)) return true;
        }
        return false;
      };
      walkDir(tpl);
      const wallT =
        Number(opts.wallThicknessMm) ||
        Number(vars._wt) ||
        Number(vars.facade_thickness_mm) ||
        16;
      const leafOpts = {
        axis: String(layoutAcc.hingeAxis || 'Y').toUpperCase() === 'X' ? 'X' : 'Y',
        dimensionMm: dimMm,
        facadeShellDepthMm: Math.max(
          1,
          Number.isFinite(shellD) && shellD > 0 ? shellD : vars.facade_thickness_mm || 16
        ),
        facadeWidthMm: Math.max(1, Number.isFinite(shellW) && shellW > 0 ? shellW : w),
        facadeSeamZMm: 0,
        doorDirection: doorDir,
        useAnchorOffset: false,
        overlaySideThicknessMm: Math.max(1, wallT),
      };
      // Как роли: оболочка фасада — тыл на торце бока (z=s:z).
      moduleNode.pos = moduleNode.pos && typeof moduleNode.pos === 'object' ? { ...moduleNode.pos } : {};
      moduleNode.pos.z = 's:z';
      moduleNode.spec.cldOverlayDoor = 1;

      const any = !!applyRoleLayoutCatalogHingeModulesInTree(tpl, layoutAcc, leafOpts);
      if (any) {
        seen.roles.push({
          role,
          dimMm,
          count: layoutAcc.hinges.length,
          productKind,
          opens: layoutAcc.__hingeRoleOpens || null,
        });
      }
      return any;
    };

    const walkTree = (nodes) => {
      if (!Array.isArray(nodes)) return;
      for (const n of nodes) {
        if (!n || typeof n !== 'object') continue;
        if (handleFacadeModule(n)) seen.applied++;
        else if (
          String(n.layout_role ?? n.sectionLayoutRole ?? '')
            .trim()
            .toLowerCase()
            .startsWith('facades')
        ) {
          seen.skipped++;
        }
        if (Array.isArray(n.children) && n.children.length) walkTree(n.children);
        if (Array.isArray(n.spec?.template_tree) && n.spec.template_tree.length) {
          walkTree(n.spec.template_tree);
        }
      }
    };

    walkTree(tree);
    return seen;
  }

  const UNIFIED_FACADE_HINGE_MERGE_TOL_MM = 25;

  /**
   * Петли цельной двери: правила facades_main + facades_top на одном полотне (без зазора на стыке).
   */
  function resolveUnifiedFacadeBandHeightsMm(opts) {
    opts = opts || {};
    const vars = opts.vars && typeof opts.vars === 'object' ? opts.vars : {};
    const fullH = Math.max(1, Number(opts.doorHeightMm) || 0);
    const mainH = Math.max(
      1,
      Number(opts.mainBandMm) || Number(vars.corpus_antresol_mm) || 0
    );
    const topFromOpts = Number(opts.topBandMm);
    const topH =
      Number.isFinite(topFromOpts) && topFromOpts > 0
        ? Math.max(1, topFromOpts)
        : Math.max(1, fullH - mainH);
    return { fullH, mainH, topH };
  }

  function buildUnifiedWardrobeHingeAccessory(opts) {
    opts = opts || {};
    const { fullH, mainH, topH } = resolveUnifiedFacadeBandHeightsMm(opts);

    const baseOpts = { ...opts, facadeLayoutRole: 'facades_main' };
    const mainCatalogId =
      Number(opts.facadeCatalogItemId) ||
      Number(opts.catalogItemId) ||
      resolveFacadeCatalogItemId({ ...baseOpts, facadeLayoutRole: 'facades_main' });
    const topCatalogId =
      Number(opts.topFacadeCatalogItemId) ||
      resolveFacadeCatalogItemId({ ...baseOpts, facadeLayoutRole: 'facades_top' });
    const mainParams = resolveHingeRoleLayoutParams({
      ...baseOpts,
      facadeLayoutRole: 'facades_main',
      facadeCatalogItemId: mainCatalogId,
      catalogItemId: mainCatalogId,
    });
    const topParams = resolveHingeRoleLayoutParams({
      ...baseOpts,
      facadeLayoutRole: 'facades_top',
      facadeCatalogItemId: topCatalogId,
      catalogItemId: topCatalogId,
    });
    if (!mainParams || !topParams) return null;

    const opens =
      mainParams.opens ||
      (typeof resolveOpensForHingeRoleLayout === 'function'
        ? resolveOpensForHingeRoleLayout({ ...baseOpts, facadeLayoutRole: 'facades_main' })
        : 'swing-left');
    const mainAcc = roleLayoutParamsToHingeAccessory(mainParams, mainH, opens);
    const topAcc = roleLayoutParamsToHingeAccessory(topParams, topH, opens);
    if (!mainAcc || !topAcc) return null;

    const mainYs = calcIntegerRoleHingeYs(mainAcc, mainH).filter((y) => y < mainH);
    const topYs = calcIntegerRoleHingeYs(topAcc, topH)
      .map((y) => y + mainH)
      .filter((y) => y >= mainH && y <= fullH);
    const allY = [...mainYs, ...topYs].sort((a, b) => a - b);
    const merged = [];
    for (const y of allY) {
      if (!merged.length || y - merged[merged.length - 1] > UNIFIED_FACADE_HINGE_MERGE_TOL_MM) {
        merged.push(y);
      }
    }
    const axis = hingeAxisForOpens(opens) || 'Y';
    return {
      ...mainAcc,
      count: merged.length,
      hinges: merged.map((v) => ({ pos: String(Math.round(v)), from: -1, axis })),
      __hingeRoleLayout: true,
      __unifiedFacade: true,
      __unifiedMainBandMm: mainH,
      __unifiedTopBandMm: topH,
      __hingeRoleOpens: opens,
      __hingeRoleParams: {
        hingeCount: merged.length,
        topOffset: mainParams.topOffset,
        bottomOffset: mainParams.bottomOffset,
        catalogItemId: mainParams.catalogItemId,
        variant: mainParams.variant,
        opens: mainParams.opens,
      },
    };
  }

  const api = {
    HINGE_LAYOUT_SCHEMES_KEY,
    HINGE_ROLE_DEFAULTS_KEY,
    FACADE_VARIANT_DEFAULTS_KEY,
    FACADE_LAYOUT_ROLES,
    PRODUCT_KINDS,
    PRODUCT_FACADE_VARIANTS,
    facadeVariantsForAdminUI,
    facadeVariantsByHeightMm,
    isFacadeVariantVisibleInAdmin,
    OPENS_AXIS,
    OPENS_LABEL,
    ensureHingeLayoutScheme,
    ensureHingeRoleLayoutParams,
    calcHingeRoleLayoutPositions,
    calcHingeLayoutPositions,
    readHingeLayoutSchemes,
    getHingeLayoutSchemeById,
    readHingeRoleDefaults,
    saveHingeRoleDefaults,
    readFacadeRoleDefaults,
    saveFacadeRoleDefaults,
    readFacadeVariantDefaults,
    saveFacadeVariantDefaults,
    findFacadeVariantDefault,
    resolveFacadeCatalogItemId,
    resolveHingeRoleLayoutParams,
    resolveOpensForHingeRoleLayout,
    isRightDoorDirection,
    resolveDoorPivotOffsetMm,
    resolveCorpusMountOffsetMm,
    countSwingDoorAnimatorsInTree,
    FACADE_LEAF_TO_COMPOSITE_CATALOG_ID,
    FACADE_COMPOSITE_DOUBLE_CATALOG_IDS,
    applyDoorPivotOffsetToRotateAnimatorsInTree,
    resolveFacadeRoleHingeDimensionMm,
    calcIntegerRoleHingeYs,
    hingeRoleVerifyEnabled,
    logHingeRoleVerify,
    roleLayoutParamsToHingeAccessory,
    isHingeModuleTreeNode,
    hingeAccessoryPosToMm,
    stripHingeModuleNodesInTree,
    prepareHingeModuleForRoleLayout,
    hingeModuleRefPosXInThinFacadeShell,
    refHingeFacadeArmWidthMm,
    REF_HINGE_FACADE_ARM_X_MM,
    resolveHingeRoleLayoutAnchorOffsetMm,
    applyRoleLayoutCatalogHingeModulesInTree,
    hingeAxisForRole,
    hingeAxisForOpens,
    placementKindToProductKind,
    resolveHingeLayoutScheme,
    schemeToHingeAccessory,
    applyFacadeRoleHingeYInPreviewTree,
    buildUnifiedWardrobeHingeAccessory,
    resolveUnifiedFacadeBandHeightsMm,
  };

  global.__cldHingeLayout = api;
})(typeof window !== 'undefined' ? window : globalThis);
