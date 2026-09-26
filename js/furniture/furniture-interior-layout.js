/**
 * interiorLayout.zones — разрез внутренней высоты по % и сборка полок/штанги в каждой зоне.
 */
import { parseCatalogItemDataField } from './catalog-icon-aspect.js?v=20260705-center-divider-room';
import {
  applyShelfStackPolicyToRoots,
  computeShelfLayout,
  countShelfLikeNodesInTree,
  collapseShelfTemplatesInTree,
  extractShelfStackPolicyFromCatalogItem,
  buildShelfGapDebug,
  isFullHeightShelvesOnlyLayout,
  isNestedFillCatalogModuleNode,
  isShelfModuleNode,
  logShelfCount,
  normalizeShelfStackPolicy,
  resolveCorpusCenterYMm,
  resolveShelfInteriorSpanMm,
  resolveShelfLayoutPolicy,
  resolveShelfSpanInZone,
  shouldPreserveManualShelfLayout,
} from './furniture-shelf-stack.js?v=20260709-fill-host-slot';
import {
  applyInteriorDrawerStackToRoots,
  predictDrawerTopShelfAbsY,
  predictDrawerZoneFillShelfCount,
  resolveDrawerYPositionsForZone,
} from './furniture-drawer-stack.js?v=20260907-shelf-props';
import {
  extractInteriorTemplatesFromCatalogItem,
  createDefaultShelfTemplate,
  resolveInteriorRodTemplate,
  resolveInteriorShelfTemplate,
} from './furniture-interior-templates.js?v=20260907-shelf-props';

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function cloneJson(v) {
  return JSON.parse(JSON.stringify(v));
}

function normalizeDrawerRules(raw) {
  const rr = raw && typeof raw === 'object' ? raw : {};
  const anchorRaw = String(rr.anchor || 'bottom').trim().toLowerCase();
  let anchor = 'bottom';
  if (anchorRaw === 'top' || anchorRaw === 'center') anchor = anchorRaw;
  else if (
    anchorRaw === 'below_center' ||
    anchorRaw === 'below_divider' ||
    anchorRaw === 'from_divider'
  ) {
    anchor = 'below_divider';
  }
  const count = Math.max(0, Math.floor(num(rr.count, 0)));
  const gapRaw = rr.gapMm;
  const gapMm =
    gapRaw == null || gapRaw === ''
      ? 3
      : Math.max(0, num(gapRaw, 0));
  return {
    anchor,
    offsetMm: Math.max(0, num(rr.offsetMm, 19)),
    count,
    gapMm,
    topShelfGapMm: Math.max(0, num(rr.topShelfGapMm, 26)),
    forceShelfAboveDrawers: rr.forceShelfAboveDrawers !== false,
  };
}

function normalizeLayout(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const zonesRaw = Array.isArray(raw.zones) ? raw.zones : [];
  const zones = [...zonesRaw].sort((a, b) => {
    const pa = String(a?.position || '').toLowerCase();
    const pb = String(b?.position || '').toLowerCase();
    const rank = (p) => (p === 'bottom' ? 0 : p === 'top' ? 1 : 2);
    return rank(pa) - rank(pb);
  });
  if (!zones.length) return null;
  const normalizeRodRules = (rrRaw) => {
    const rr = rrRaw && typeof rrRaw === 'object' ? rrRaw : {};
    const companionRaw = String(rr.companionMode || 'none').trim().toLowerCase();
    const companionMode =
      companionRaw === 'top_shelf' ||
      companionRaw === 'bottom_shelves' ||
      companionRaw === 'top_and_bottom'
        ? companionRaw
        : 'none';
    return {
      anchor: rr.anchor === 'bottom' ? 'bottom' : 'top',
      offsetMm: Math.max(0, num(rr.offsetMm, 80)),
      companionMode,
      topShelfGapMm: Math.max(0, num(rr.topShelfGapMm, 80)),
      bottomShelvesCount: Math.max(0, Math.min(6, Math.floor(num(rr.bottomShelvesCount, 1)))),
      bottomShelvesTopGapMm: Math.max(0, num(rr.bottomShelvesTopGapMm, 80)),
      gridShiftDownSteps: Math.max(0, Math.floor(num(rr.gridShiftDownSteps, 0))),
    };
  };
  return {
    zones: zones.map((z, i) => {
      const cRaw = String(z?.content || 'shelves').trim().toLowerCase();
      let content = 'shelves';
      if (cRaw === 'rod') content = 'rod';
      else if (cRaw === 'drawers' || cRaw === 'empty') content = 'drawers';
      return {
        id: String(z?.id || 'zone_' + i),
        name: String(z?.name || ''),
        position: String(z?.position || '').toLowerCase(),
        heightPercent: Math.max(0, num(z?.heightPercent, 0)),
        content,
        rodRules: normalizeRodRules(z?.rodRules),
        drawerRules: normalizeDrawerRules(z?.drawerRules),
      };
    }),
  };
}

export function extractInteriorLayoutFromCatalogItem(catalogItem) {
  if (!catalogItem || typeof catalogItem !== 'object') return null;
  const parsed = parseCatalogItemDataField(catalogItem);
  const raw = catalogItem.interiorLayout ?? parsed.interiorLayout ?? null;
  return normalizeLayout(raw);
}

/** Несколько зон / штанга / не 100% полки — нужна пересборка по interiorLayout, не ручная раскладка. */
export function interiorLayoutRequiresZoneRebuild(layout) {
  const L = normalizeLayout(layout);
  if (!L) return false;
  if (L.zones.length > 1) return true;
  if (L.zones.some((z) => z.content === 'rod' || z.content === 'drawers')) return true;
  const z0 = L.zones[0];
  if (z0 && z0.content === 'shelves' && num(z0.heightPercent, 100) < 100) return true;
  return false;
}

function createDefaultRodTemplate() {
  return {
    type: 'model',
    name: 'Штанга',
    spec: { id: '22', key: 'Штанга' },
    size: { x: 's:x-32', y: 16, z: 's:z' },
    pos: { x: 16, y: 0, z: 0 },
    pivot: { x: -1, y: -1, z: -1 },
    rot: { x: 0, y: 0, z: 0 },
    layout_role: 'rod',
    children: [],
  };
}

function createDefaultShelfDividerTemplate(thickness) {
  const t = Math.max(8, num(thickness, 16));
  const tpl = createDefaultShelfTemplate(t);
  tpl.size = tpl.size && typeof tpl.size === 'object' ? { ...tpl.size, y: t } : { y: t };
  tpl.sectionLayoutRole = 'zone_divider';
  return tpl;
}

/** Отступ под/над авто-полками у границы 50/50 (разделитель ставится отдельно по центру). */
function shelfZoneSplitInsets(zone, splitMm, thickness) {
  if (!(splitMm > 0)) return { bottom: 0, top: 0 };
  const t = Math.max(8, num(thickness, 16));
  const zBot = Math.max(0, num(zone?.bottomMm, 0));
  const zTop = zBot + Math.max(0, num(zone?.heightMm, 0));
  let bottom = 0;
  let top = 0;
  if (Math.abs(zTop - splitMm) < 2) top = t;
  if (Math.abs(zBot - splitMm) < 2) bottom = t;
  return { bottom, top };
}

function appendFiftyFiftyCenterDivider(out, splitMm, hBottom, thickness, shelfTpl) {
  if (!(splitMm > 0) || !Array.isArray(out)) return;
  const tpl = shelfTpl || createDefaultShelfDividerTemplate(thickness);
  const t = Math.max(8, num(thickness, num(tpl?.size?.y, 16)));
  const div = cloneJson(tpl);
  div.id = `${tpl.id || 'shelf'}__split_divider`;
  div.size = div.size && typeof div.size === 'object' ? { ...div.size, y: t } : { y: t };
  div.pos =
    div.pos && typeof div.pos === 'object'
      ? { ...div.pos, y: Math.round(hBottom + splitMm) }
      : { y: Math.round(hBottom + splitMm) };
  if (div.pos.x === undefined || div.pos.x === null || String(div.pos.x).trim() === 's:x') {
    div.pos.x = 16;
  }
  div.layout_role = 'shelf';
  div.sectionLayoutRole = 'zone_divider';
  div.pivot =
    div.pivot && typeof div.pivot === 'object'
      ? { ...div.pivot, y: 0 }
      : { x: -1, y: 0, z: -1 };
  out.push(div);
}

/** Для выбранного "Наполнения" всегда пересобираем зоны, чтобы старые полки/штанги не оставались. */
export function shouldApplyInteriorLayoutForCatalog(layout) {
  const L = normalizeLayout(layout);
  if (!L) return false;
  return L.zones.length > 0;
}

/** Комната: interiorLayout.zones + shelfStack (как превью админки). */
export function applyInteriorFillToRoomRoots(roots, opts = {}) {
  const layout = normalizeLayout(opts.layout ?? null);
  if (!shouldApplyInteriorLayoutForCatalog(layout)) return false;
  const zoneDriven = interiorLayoutRequiresZoneRebuild(layout);
  return applyInteriorLayoutToRoots(roots, {
    layout,
    policy: opts.policy ?? opts.shelfStack ?? null,
    shelfStack: opts.policy ?? opts.shelfStack ?? null,
    sectionSizeMm: opts.sectionSizeMm,
    variables: opts.variables,
    corpusLocalFill: opts.corpusLocalFill === true,
    preserveManualShelves:
      opts.preserveManualShelves !== undefined ? opts.preserveManualShelves : !zoneDriven,
    catalogItem: opts.catalogItem ?? null,
    interiorTemplates:
      opts.interiorTemplates ??
      extractInteriorTemplatesFromCatalogItem(opts.catalogItem) ??
      null,
    findCatalogItem: opts.findCatalogItem,
  });
}

function readDrawerStackPolicyFromCatalogItem(catalogItem) {
  if (!catalogItem || typeof catalogItem !== 'object') return null;
  const parsed = parseCatalogItemDataField(catalogItem);
  const raw = parsed.drawerStack ?? catalogItem.drawerStack ?? null;
  return raw && typeof raw === 'object' ? raw : null;
}

/** Высота корпуса для полок: corpus_antresol_mm (1950), не весь шкаф (2700). */
export function resolveCorpusShelfSectionSizeYMm(sectionSizeMm, variables, opts = {}) {
  const outerY = Math.max(0, num(sectionSizeMm?.y, 0));
  const corpus = Math.max(0, num(variables?.corpus_antresol_mm, 0));
  const minCorpusSpan = Math.max(100, num(opts.minCorpusSpanMm, 200));
  if (corpus > 0) {
    if (outerY <= 0 || corpus <= outerY + 1) return corpus;
    // buildModule catalog_38/29 иногда передаёт size.y=16 (толщина полки) — берём corpus.
    if (opts.preferCorpusForFill && (outerY < minCorpusSpan || corpus > outerY)) return corpus;
  }
  return outerY;
}

/** catalog_39 — наполнение антресоли (низкая секция), не корпус шкафа. */
function isAntresolFillCatalogType(catalogTypeHint, catalogItem) {
  const hint = String(catalogTypeHint || '')
    .trim()
    .toLowerCase()
    .replace(/^catalog_/, '');
  if (hint === '39') return true;
  return catalogItemTypeKey(catalogItem) === '39';
}

/** Высота слота для fill catalog_38 при сборке в комнате. */
export function resolveFillShelfSectionSizeYMm(sectionSizeMm, variables, opts = {}) {
  const outerY = Math.max(0, num(sectionSizeMm?.y, 0));
  const corpus = Math.max(0, num(variables?.corpus_antresol_mm, 0));
  if (
    opts.isFill &&
    isAntresolFillCatalogType(opts.catalogTypeHint, opts.catalogItem) &&
    outerY > 0
  ) {
    return outerY;
  }
  // Низкая fill-секция (антресоль в редакторе) — не подменять на corpus шкафа (1950).
  if (opts.isFill && outerY > 0 && outerY <= 900 && corpus > outerY) return outerY;
  if (opts.isFill && corpus > 0 && (outerY < 200 || corpus > outerY)) return corpus;
  return (
    resolveCorpusShelfSectionSizeYMm(sectionSizeMm, variables, { preferCorpusForFill: !!opts.isFill }) ||
    outerY
  );
}

function catalogItemTypeKey(catalogItem) {
  if (!catalogItem || typeof catalogItem !== 'object') return '';
  const parsed = parseCatalogItemDataField(catalogItem);
  const raw = catalogItem.catalog_type ?? catalogItem.catalogType ?? parsed.catalog_type ?? '';
  return String(raw).trim().toLowerCase().replace(/^catalog_/, '');
}

/** catalog_38/37 — наполнение; catalog_29 — только деталь «Полка», не fill-контейнер. */
function isFillPolicyCatalogItem(catalogItem, catalogTypeHint) {
  const hint = String(catalogTypeHint || '')
    .trim()
    .toLowerCase()
    .replace(/^catalog_/, '');
  if (hint === '38' || hint === '37' || hint === '39') return true;
  if (hint === '29') return false;
  const ct = catalogItemTypeKey(catalogItem);
  if (ct === '38' || ct === '37' || ct === '39') return true;
  if (ct === '29') return false;
  const parsed = parseCatalogItemDataField(catalogItem);
  return parsed.is_fill === '1' || parsed.is_fill === 1 || parsed.is_fill === true;
}

export function treeHasNestedFillCatalogModule(roots) {
  const arr = Array.isArray(roots) ? roots : roots ? [roots] : [];
  const stack = [...arr];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    const et = String(n.spec?.element_type || '').trim().toLowerCase();
    if (et === 'catalog_38' || et === 'catalog_37' || et === 'catalog_39') return true;
    if (Array.isArray(n.children)) stack.push(...n.children);
    if (Array.isArray(n.spec?.template_tree)) stack.push(...n.spec.template_tree);
  }
  return false;
}

/** Оболочки модулей, в которые вставляют catalog_38/39 (превью + слот наполнения). */
export function isShellHostCatalogType(catalogTypeHint) {
  const k = String(catalogTypeHint || '')
    .trim()
    .toLowerCase()
    .replace(/^catalog_/, '');
  return (
    k === '26' ||
    k === '27' ||
    k === '30' ||
    k === '35' ||
    k === '36' ||
    k === '37'
  );
}

export function shouldRunFillPolicyPipeline(catalogTypeHint, catalogItem, tree) {
  if (isFillPolicyCatalogItem(catalogItem, catalogTypeHint)) return true;
  if (isShellHostCatalogType(catalogTypeHint)) return true;
  const roots = Array.isArray(tree) ? tree : tree ? [tree] : [];
  return treeHasNestedFillCatalogModule(roots);
}

function resolveFillPoliciesForCatalog(catalogItem, opts = {}) {
  const shell = opts.shellCatalogItem;
  const fillInterior = extractInteriorLayoutFromCatalogItem(catalogItem);
  const shellInterior = shell ? extractInteriorLayoutFromCatalogItem(shell) : null;
  const useShellInterior = shouldApplyInteriorLayoutForCatalog(shellInterior);
  const isFill = isFillPolicyCatalogItem(catalogItem, opts.catalogTypeHint);
  const fillFullHeightShelves = isFullHeightShelvesOnlyLayout(fillInterior);

  // catalog_38 с 100% полками: зоны и политика из fill, не 50/50 оболочки SA1_5PL.
  const interiorLayout =
    opts.interiorLayout ??
    (useShellInterior && !isFill ? shellInterior : null) ??
    fillInterior ??
    shellInterior;

  const fillShelf = extractShelfStackPolicyFromCatalogItem(catalogItem);
  const shellShelf = shell ? extractShelfStackPolicyFromCatalogItem(shell) : null;
  let shelfPolicy = opts.shelfStack ?? opts.policy ?? null;
  if (!shelfPolicy) {
    // catalog_38/37/39: политика полок всегда из карточки наполнения (even/50-50),
    // не из оболочки catalog_27 со step — иначе в шкафе другие зазоры, чем в превью fill.
    if (isFill && fillShelf) {
      shelfPolicy = fillShelf;
    } else if (useShellInterior && shellShelf) {
      shelfPolicy = shellShelf;
    } else {
      shelfPolicy = fillShelf ?? shellShelf;
    }
  }

  const fillDrawer = readDrawerStackPolicyFromCatalogItem(catalogItem);
  const shellDrawer = shell ? readDrawerStackPolicyFromCatalogItem(shell) : null;
  const drawerPolicy =
    opts.drawerStack ??
    (useShellInterior && !isFill ? shellDrawer : null) ??
    fillDrawer ??
    shellDrawer;

  return { interiorLayout, shelfPolicy, drawerPolicy, isFill, fillFullHeightShelves, useShellInterior };
}

function catalogFillDebugLabel(catalogItem) {
  if (!catalogItem || typeof catalogItem !== 'object') return '(none)';
  const parsed = parseCatalogItemDataField(catalogItem);
  const name = parsed.name ?? catalogItem.name ?? '';
  const id = catalogItem.id ?? parsed.id ?? '?';
  return `${name || 'catalog'}#${id}`;
}

/**
 * catalog_27 / catalog_38 внутри корпуса: раскладка в координатах слота (y=1950, h_bottom=0),
 * чтобы 50/50 split = s:y/2 как у средней полки S_5PL.
 */
export function applyFillPoliciesToCatalogTemplateTree(templateTree, catalogItem, opts = {}) {
  if (!Array.isArray(templateTree) || !templateTree.length || !catalogItem) return templateTree;
  const resolvedPolicies = resolveFillPoliciesForCatalog(catalogItem, opts);
  const { interiorLayout, shelfPolicy, drawerPolicy, isFill, fillFullHeightShelves, useShellInterior } =
    resolvedPolicies;
  const labSection = resolveFillLabSectionSizeMm(
    templateTree,
    opts.sectionSizeMm,
    opts.variables && typeof opts.variables === 'object' ? opts.variables : {}
  );
  const sectionInputMm = {
    x: num(opts.sectionSizeMm?.x, labSection.x),
    y: num(opts.sectionSizeMm?.y, labSection.y),
    z: num(opts.sectionSizeMm?.z, labSection.z),
  };
  // Карточка наполнения: политики только от наполняемой секции, без corpus шкафа.
  const policySectionMm = isFill ? labSection : sectionInputMm;
  const syRaw = Math.max(0, num(policySectionMm.y, 0));
  const sy = isFill
    ? syRaw
    : resolveFillShelfSectionSizeYMm(sectionInputMm, opts.variables, {
        isFill,
        catalogTypeHint: opts.catalogTypeHint,
        catalogItem,
      }) || syRaw;
  if (!(sy > 0)) return templateTree;

  const before = countShelfLikeNodesInTree(templateTree);
  const shell = opts.shellCatalogItem;
  const fillShelf = extractShelfStackPolicyFromCatalogItem(catalogItem);
  const shellShelf = shell ? extractShelfStackPolicyFromCatalogItem(shell) : null;
  const ctKey = catalogItemTypeKey(catalogItem);
  const hasNestedFill = treeHasNestedFillCatalogModule(templateTree);
  // catalog_27 с вложенным catalog_38/37 — полки только во fill, не в корпусе-оболочке.
  const skipShellShelfStack = ctKey === '27' && hasNestedFill;

  logShelfCount('fillPolicies/start', {
    tag: opts.debugTag || 'buildModule',
    fillItem: catalogFillDebugLabel(catalogItem),
    shellItem: catalogFillDebugLabel(shell),
    catalogType: ctKey,
    isFill,
    sectionSizeY: sy,
    sectionSizeYRaw: syRaw,
    corpus_antresol_mm: opts.variables?.corpus_antresol_mm,
    h_bottom: opts.variables?.h_bottom,
    shelvesBefore: before,
    fillPolicy: fillShelf,
    shellPolicy: shellShelf,
    chosenPolicy: shelfPolicy,
    interiorZones: interiorLayout?.zones?.length ?? 0,
    useShellInterior,
    skipShellShelfStack,
    hasNestedFill,
  });
  const fillVars = {
    ...(opts.variables && typeof opts.variables === 'object' ? opts.variables : {}),
    h_bottom: 0,
    h_top: 0,
    tech_zone_mm: 0,
  };
  const sectionSizeMm = {
    x: num(policySectionMm.x, 600),
    y: sy,
    z: num(policySectionMm.z, 600),
  };

  const tree = JSON.parse(JSON.stringify(templateTree));
  let changed = false;

  if (isFill && shelfPolicy?.enabled !== false) {
    collapseShelfTemplatesInTree(tree);
  }

  const forceFillShelfRebuild = isFill && shelfPolicy?.enabled !== false;

  if (shouldApplyInteriorLayoutForCatalog(interiorLayout) && !skipShellShelfStack) {
    changed =
      applyInteriorFillToRoomRoots(tree, {
        layout: interiorLayout,
        policy: shelfPolicy,
        sectionSizeMm,
        variables: fillVars,
        corpusLocalFill: true,
        preserveManualShelves: forceFillShelfRebuild ? false : undefined,
        catalogItem,
        findCatalogItem: opts.findCatalogItem,
      }) || changed;
  } else if (shelfPolicy && !skipShellShelfStack) {
    const resolved = resolveShelfLayoutPolicy(shelfPolicy, {
      fullHeightShelvesOnly: isFullHeightShelvesOnlyLayout(interiorLayout),
      fiftyFiftyZone: false,
    });
    const preserveManualShelves =
      resolved?.distribution !== 'even' && resolved?.distribution !== 'even_fixed';
    logShelfCount('fillPolicies/shelf-stack', {
      tag: opts.debugTag || 'buildModule',
      fillItem: catalogFillDebugLabel(catalogItem),
      preserveManualShelves,
      resolvedDistribution: resolved?.distribution ?? null,
      sectionSizeY: sy,
    });
    changed =
      applyShelfStackPolicyToRoots(tree, {
        policy: shelfPolicy,
        interiorLayout,
        sectionSizeMm,
        variables: fillVars,
        preserveManualShelves,
        debugTag: opts.debugTag || 'fillPolicies',
      }) || changed;
  } else if (skipShellShelfStack) {
    logShelfCount('fillPolicies/skip-shell-shelf-stack', {
      tag: opts.debugTag || 'buildModule',
      fillItem: catalogFillDebugLabel(catalogItem),
      reason: 'catalog_27 shell — nested catalog_38 owns shelves',
    });
  }

  const after = countShelfLikeNodesInTree(changed ? tree : templateTree);
  const resolved = shelfPolicy
    ? resolveShelfLayoutPolicy(shelfPolicy, {
        fullHeightShelvesOnly: isFullHeightShelvesOnlyLayout(interiorLayout),
        fiftyFiftyZone: false,
      })
    : null;
  const planned =
    resolved && fillVars
      ? computeShelfLayout(
          resolveShelfInteriorSpanMm(sy, fillVars, resolved).span,
          resolved,
          num(resolved.shelfThicknessMm, 16)
        )
      : null;
  const plannedInterior = resolved && fillVars ? resolveShelfInteriorSpanMm(sy, fillVars, resolved) : null;

  logShelfCount('fillPolicies/done', {
    tag: opts.debugTag || 'buildModule',
    fillItem: catalogFillDebugLabel(catalogItem),
    changed,
    shelvesBefore: before,
    shelvesAfter: after,
    plannedModuleCount: planned?.count ?? null,
    plannedPositionsY: planned?.positionsFromBottomMm ?? null,
    ...(planned
      ? buildShelfGapDebug(
          { ...planned, spanMm: plannedInterior?.span ?? 0 },
          plannedInterior?.pivotBottomMm ?? 0
        )
      : {}),
    resolvedDistribution: resolved?.distribution ?? null,
  });

  if (drawerPolicy?.enabled !== false && interiorLayout) {
    changed =
      applyInteriorDrawerStackToRoots(tree, {
        policy: drawerPolicy,
        interiorLayout,
        sectionSizeMm,
        variables: fillVars,
        forPreview: opts.forPreview === true,
        catalogItem,
        shelfPolicy: shelfPolicy,
        interiorTemplates: extractInteriorTemplatesFromCatalogItem(catalogItem),
        findCatalogItem: opts.findCatalogItem,
      }) || changed;
  }

  return changed ? tree : templateTree;
}

/** Карточка catalog из Vue админки → формат как в комнате (data.shelfStack / interiorLayout). */
export function buildPreviewCatalogItem(vueItem, catalogTypeHint) {
  if (!vueItem || typeof vueItem !== 'object') return null;
  const ctRaw = String(
    catalogTypeHint ||
      vueItem.catalog_type ||
      vueItem.catalogType ||
      (typeof globalThis !== 'undefined' ? globalThis.catalogItemVueApp?.catalogType : '') ||
      ''
  ).trim();
  const ct = ctRaw.startsWith('catalog_') ? ctRaw : ctRaw ? `catalog_${ctRaw}` : '';
  const base =
    vueItem.data && typeof vueItem.data === 'object' && !Array.isArray(vueItem.data)
      ? { ...vueItem.data }
      : {};
  let shelfStack = vueItem.shelfStack ?? base.shelfStack ?? null;
  let interiorLayout = vueItem.interiorLayout ?? base.interiorLayout ?? null;
  const drawerStack = vueItem.drawerStack ?? base.drawerStack ?? null;
  let interiorTemplates = vueItem.interiorTemplates ?? base.interiorTemplates ?? null;
  const isFill = vueItem.is_fill ?? base.is_fill;

  if (!shelfStack || !interiorLayout || !interiorTemplates) {
    try {
      const id = String(vueItem.id ?? '').trim();
      if (id && ct) {
        const cached = globalThis.__CLD_CATALOGS_DATA?.[ct]?.items?.[id];
        if (cached) {
          const cp = parseCatalogItemDataField(cached);
          const cd = cached.data && typeof cached.data === 'object' ? cached.data : {};
          if (!shelfStack) shelfStack = cp.shelfStack ?? cached.shelfStack ?? cd.shelfStack ?? null;
          if (!interiorLayout) {
            interiorLayout = cp.interiorLayout ?? cached.interiorLayout ?? cd.interiorLayout ?? null;
          }
          if (!interiorTemplates) {
            interiorTemplates =
              cp.interiorTemplates ?? cached.interiorTemplates ?? cd.interiorTemplates ?? null;
          }
        }
      }
    } catch (_) {}
  }
  return {
    ...vueItem,
    id: vueItem.id,
    name: vueItem.name,
    catalog_type: ct,
    shelfStack,
    interiorLayout,
    drawerStack,
    interiorTemplates,
    is_fill: isFill,
    data: {
      ...base,
      shelfStack,
      interiorLayout,
      drawerStack,
      interiorTemplates,
      is_fill: isFill,
      catalog_type: ct.replace(/^catalog_/, ''),
    },
  };
}

/** Переменные слота для превью: h_bottom, corpus_antresol_mm — как в комнате. */
export function resolvePreviewFillVariables(ctx = {}) {
  const previewTree = ctx.previewTree ?? ctx.roots ?? null;
  const out = {
    h_bottom: 100,
    h_top: 0,
    tech_zone_mm: 0,
    facade_thickness_mm: 16,
    ...(ctx.variables && typeof ctx.variables === 'object' ? ctx.variables : {}),
  };
  try {
    const root =
      typeof globalThis !== 'undefined'
        ? globalThis.document?.getElementById?.('constructor-root-module')
        : null;
    const main = root?.nodeData?.variables?.main;
    if (main && typeof main === 'object') {
      for (const [k, v] of Object.entries(main)) {
        const key = String(k || '').trim();
        if (!key || key === '_wt') continue;
        const n = Number(v);
        if (Number.isFinite(n)) out[key] = n;
      }
    }
    const groups = root?.nodeData?.variables?.groups;
    if (Array.isArray(groups)) {
      for (const g of groups) {
        if (!g || g.enabled === false) continue;
        for (const v of g.vars || []) {
          if (!v || v.enabled === false) continue;
          const key = String(v.key || '').trim();
          if (!key || key === '_wt' || out[key] != null) continue;
          const cur = Number(v.value);
          const def = Number(v.default);
          const n = Number.isFinite(cur) ? cur : Number.isFinite(def) ? def : NaN;
          if (Number.isFinite(n)) out[key] = n;
        }
      }
    }
  } catch (_) {}
  const vueItem =
    ctx.vueItem ||
    (typeof globalThis !== 'undefined' ? globalThis.catalogItemVueApp?.item : null);
  const cv = vueItem?.clodisVariables;
  if (cv && typeof cv === 'object') {
    for (const [k, v] of Object.entries(cv)) {
      const key = String(k || '').trim();
      if (!key || key === '_wt') continue;
      if (out[key] != null) continue;
      const n = Number(v);
      if (Number.isFinite(n)) out[key] = n;
    }
  }
  let wt = 16;
  try {
    if (typeof globalThis !== 'undefined' && typeof globalThis.__cldBuildMaterialsPayload === 'function') {
      const payload = globalThis.__cldBuildMaterialsPayload();
      wt = num(payload?.vars?._wt, 16) || 16;
      if (payload?.vars && typeof payload.vars === 'object') {
        for (const [k, v] of Object.entries(payload.vars)) {
          if (out[k] != null) continue;
          const n = Number(v);
          if (Number.isFinite(n)) out[k] = n;
        }
      }
    }
  } catch (_) {}
  out._wt = wt;

  const catalogTypeHint = String(ctx.catalogTypeHint || ctx.catalogType || '').trim();
  const isFill = isFillPolicyCatalogItem(vueItem, catalogTypeHint);
  const isAntresolFill = isAntresolFillCatalogType(catalogTypeHint, vueItem);
  if (isFill && !isAntresolFill && !(Number(out.corpus_antresol_mm) > 200)) {
    out.corpus_antresol_mm = 1950;
  }
  return ensureWardrobeCorpusVars(out, previewTree, num(ctx.sectionSizeMm?.y, 0));
}

function moduleUsesCabinetLevelHeightSlice(item) {
  if (!item || typeof item !== 'object') return false;
  const sy = item.size?.y;
  const py = item.pos?.y ?? item.position?.y;
  const sizeIsCabinetSlice =
    typeof sy === 'string' &&
    /s:y\s*[-−+]/.test(sy) &&
    /v:\s*(h_bottom|corpus_antresol_mm|tech_zone_mm|h_top)/.test(sy);
  const posIsCabinetSlice =
    typeof py === 'string' &&
    /v:\s*(h_bottom|corpus_antresol_mm)/.test(py) &&
    !/s:y/.test(py);
  return sizeIsCabinetSlice || posIsCabinetSlice;
}

function nodeNeedsSlotFillNotReslice(node) {
  if (!node || typeof node !== 'object') return false;
  const role = String(node.layout_role ?? node.sectionLayoutRole ?? '').trim().toLowerCase();
  if (role === 'top') return true;
  const sy = node.size?.y;
  const py = node.pos?.y ?? node.position?.y;
  if (typeof sy === 'string' && /s:y\s*[-−]/.test(sy) && /v:\s*corpus_antresol_mm/.test(sy)) {
    return true;
  }
  if (
    typeof py === 'string' &&
    /v:\s*h_bottom/.test(py) &&
    /v:\s*corpus_antresol_mm/.test(py)
  ) {
    return true;
  }
  return false;
}

/**
 * Как ClodisBuilder._neutralizeNestedSlotSelfPositioning: вложенная антресоль
 * не пересчитывает срез шкафа — fill_section заполняет слот (0, s:y).
 */
export function neutralizeNestedShellSlotTree(tree) {
  if (!Array.isArray(tree) || !tree.length) return tree;
  const walk = (node) => {
    if (!node || typeof node !== 'object') return node;
    let clone = node;
    if (nodeNeedsSlotFillNotReslice(node)) {
      clone = cloneJson(node);
      if (clone.size) clone.size = { ...clone.size, y: 's:y' };
      if (clone.pos) clone.pos = { ...clone.pos, y: 0 };
      if (clone.position) clone.position = { ...clone.position, y: 0 };
    }
    if (Array.isArray(clone.children) && clone.children.length) {
      clone = { ...clone, children: clone.children.map(walk) };
    }
    return clone;
  };
  return tree.map(walk);
}

function shouldNeutralizeShellModuleTemplate(module) {
  if (!module || String(module.type || '').toLowerCase() !== 'module') return false;
  const role = String(module.layout_role ?? module.sectionLayoutRole ?? '').trim().toLowerCase();
  const et = String(module.spec?.element_type || '').trim().toLowerCase();
  if (role === 'top' || et === 'catalog_30') return true;
  return moduleUsesCabinetLevelHeightSlice(module);
}

function findSectionRoots(roots) {
  const arr = Array.isArray(roots) ? roots : roots ? [roots] : [];
  const out = [];
  const stack = [...arr];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    const t = String(n.type || '').toLowerCase();
    if (t === 'section' || t === 'fill_section') out.push(n);
    if (Array.isArray(n.children)) stack.push(...n.children);
  }
  return out.length ? out : arr.filter((n) => n && typeof n === 'object');
}

function hasNestedSectionDescendant(node) {
  if (!node || typeof node !== 'object' || !Array.isArray(node.children)) return false;
  const stack = [...node.children];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    const t = String(n.type || '').toLowerCase();
    if (t === 'section' || t === 'fill_section') return true;
    if (Array.isArray(n.children)) stack.push(...n.children);
  }
  return false;
}

/** В секции есть вложенный fill-модуль catalog_38/37 (не деталь catalog_29 «Полка»). */
function sectionHasNestedFillModule(node) {
  if (!node || typeof node !== 'object' || !Array.isArray(node.children)) return false;
  const stack = [...node.children];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    const et = String(n.spec?.element_type || '').trim().toLowerCase();
    if (et === 'catalog_38' || et === 'catalog_37' || et === 'catalog_39') return true;
    if (Array.isArray(n.children)) stack.push(...n.children);
  }
  return false;
}

export function isRodModuleNode(n) {
  if (!n || typeof n !== 'object') return false;
  const type = String(n.type || '').toLowerCase();
  if (type !== 'module' && type !== 'model') return false;
  const et = String(n.spec?.element_type || '').trim().toLowerCase();
  const id = String(n.spec?.id ?? '').trim();
  const role = String(n.layout_role ?? n.sectionLayoutRole ?? '').trim().toLowerCase();
  if (role === 'rod') return true;
  if (id === '22' || et === 'catalog_22') return true;
  return /штанг|rod|shtang/i.test(String(n.name || n.spec?.key || ''));
}

/** Индекс для укладки зон снизу вверх: bottom/низ → 0, top/верх → 1. */
function zonePhysicalStackIndex(zone, fallbackIdx = 0) {
  const pos = String(zone?.position || '').trim().toLowerCase();
  if (pos === 'bottom') return 0;
  if (pos === 'top') return 1;
  const name = String(zone?.name || '').toLowerCase();
  if (/низ|lower|bottom/.test(name)) return 0;
  if (/верх|upper|top/.test(name)) return 1;
  return 1 + Math.max(0, fallbackIdx);
}

function sortZonesBottomToTop(zones) {
  return zones
    .map((z, i) => ({ z, i }))
    .sort((a, b) => zonePhysicalStackIndex(a.z, a.i) - zonePhysicalStackIndex(b.z, b.i))
    .map(({ z }) => z);
}

/** Нормализация % → мм, зоны снизу вверх. */
export function resolveInteriorZoneSpansMm(interiorHeightMm, layout) {
  const L = normalizeLayout(layout);
  if (!L || !(interiorHeightMm > 0)) return [];
  const raw = sortZonesBottomToTop(L.zones.filter((z) => z.heightPercent > 0));
  if (!raw.length) return [];
  const sum = raw.reduce((s, z) => s + z.heightPercent, 0) || 100;
  let cursor = 0;
  return raw.map((z) => {
    const h = Math.round((interiorHeightMm * z.heightPercent) / sum);
    const bottom = cursor;
    cursor += h;
    return {
      ...z,
      bottomMm: bottom,
      heightMm: h,
      topMm: bottom + h,
    };
  });
}

function pickTemplate(children, pred) {
  if (!Array.isArray(children)) return null;
  return children.find((c) => pred(c)) || null;
}

function isZoneDividerShelfNode(n) {
  if (!n || typeof n !== 'object') return false;
  const role = String(n.layout_role ?? n.sectionLayoutRole ?? '').trim().toLowerCase();
  return role === 'zone_divider';
}

function pickShelfTemplate(children) {
  const fromRole = pickTemplate(
    children,
    (c) =>
      isShelfModuleNode(c) &&
      !isZoneDividerShelfNode(c) &&
      !isNestedFillCatalogModuleNode(c)
  );
  if (fromRole) return fromRole;
  if (!Array.isArray(children)) return null;
  return (
    children.find((c) => {
      if (!c || typeof c !== 'object') return false;
      if (isNestedFillCatalogModuleNode(c)) return false;
      const name = String(c.name || c.spec?.key || '').toLowerCase();
      return /полк|shelf/i.test(name);
    }) || null
  );
}

function isShelfWallNode(n) {
  if (!n || typeof n !== 'object') return false;
  const type = String(n.type || '').toLowerCase();
  if (type !== 'wall') return false;
  const name = String(n.name || n.spec?.key || '').toLowerCase();
  return /полк|shelf/i.test(name) && !/ящик|планк|strip|rail/i.test(name);
}

function isShelfLikeNodeForLayout(n) {
  return isShelfModuleNode(n) || isShelfWallNode(n);
}

/** Две зоны ~50/50 по настройкам interiorLayout (без расчёта мм). */
export function isFiftyFiftyInteriorLayout(layout) {
  const L = normalizeLayout(layout);
  if (!L || L.zones.length !== 2) return false;
  const p0 = num(L.zones[0].heightPercent, 0);
  const p1 = num(L.zones[1].heightPercent, 0);
  const sum = p0 + p1 || 100;
  if (Math.abs(p0 - p1) <= 1 && Math.abs(sum - 100) <= 1) return true;
  return Math.abs(p0 / sum - 0.5) < 0.02 && Math.abs(p1 / sum - 0.5) < 0.02;
}

/** Полка / разделитель в fill-секции (для нормализации и стека ящиков). */
export function isShelfLikeFillModule(n) {
  return isShelfLikeNodeForLayout(n);
}

function resolveMinEvenGridCenterStepMm(gridLines) {
  if (!Array.isArray(gridLines) || gridLines.length < 2) return 0;
  let minStep = Infinity;
  for (let i = 1; i < gridLines.length; i += 1) {
    const step = num(gridLines[i], 0) - num(gridLines[i - 1], 0);
    if (step > 0 && step < minStep) minStep = step;
  }
  return Number.isFinite(minStep) ? minStep : 0;
}

function findRodZoneInLayout(layout) {
  const L = normalizeLayout(layout);
  if (!L?.zones?.length) return null;
  return L.zones.find((z) => String(z?.content || '').toLowerCase() === 'rod') || null;
}

/** 50/50: верх — штанга, низ — ящики. */
export function isRodTopDrawersBottomFiftyFifty(layout) {
  if (!isFiftyFiftyInteriorLayout(layout)) return false;
  const L = normalizeLayout(layout);
  if (!L || L.zones.length !== 2) return false;
  const hasRod = L.zones.some((z) => String(z?.content || '').toLowerCase() === 'rod');
  const hasDrawers = L.zones.some((z) => String(z?.content || '').toLowerCase() === 'drawers');
  return hasRod && hasDrawers;
}

function resolveDefaultFiftyFiftySplitGridIndex(gridLines, defaultSplitAbs) {
  if (!Array.isArray(gridLines) || !gridLines.length) return -1;
  let centerIdx = 0;
  let minDist = Infinity;
  for (let i = 0; i < gridLines.length; i += 1) {
    const d = Math.abs(num(gridLines[i], 0) - num(defaultSplitAbs, 0));
    if (d < minDist) {
      minDist = d;
      centerIdx = i;
    }
  }
  return centerIdx;
}

function estimateDrawerOccupiedTopAbsY(interiorHeightMm, layout, hBottom, drawerH, shelfT = 16) {
  const spans = resolveInteriorZoneSpansMm(interiorHeightMm, layout);
  const zone = spans.find((z) => String(z?.content || '').toLowerCase() === 'drawers') || null;
  if (!zone) return Math.max(0, num(hBottom, 0));
  const rules = normalizeDrawerRules(zone.drawerRules);
  const resolved = resolveDrawerYPositionsForZone(zone, Math.max(40, num(drawerH, 162)), rules, hBottom, {
    interiorLayout: layout,
    interiorHeightMm,
    shelfThicknessMm: shelfT,
  });
  const positions = Array.isArray(resolved?.positions) ? resolved.positions : [];
  if (!positions.length) {
    return Math.max(0, num(hBottom, 0)) + Math.max(0, num(zone.bottomMm, 0));
  }
  const stackTop = Math.max(...positions.map((y) => num(y, 0))) + Math.max(40, num(drawerH, 162));
  if (rules.forceShelfAboveDrawers !== false && !resolved?.slotGrid) {
    return stackTop + Math.max(0, num(rules.topShelfGapMm, 26)) + Math.max(8, num(shelfT, 16));
  }
  return stackTop;
}

function resolveRodZoneHeightMm(interiorHeightMm, layout) {
  const spans = resolveInteriorZoneSpansMm(interiorHeightMm, layout);
  const rodZone = spans.find((z) => String(z?.content || '').toLowerCase() === 'rod');
  return Math.max(0, num(rodZone?.heightMm, interiorHeightMm / 2));
}

function findDrawerTopShelfAbsInTree(root) {
  if (!root || !Array.isArray(root.children)) return 0;
  const node = root.children.find((c) => {
    const role = String(c.sectionLayoutRole || c.layout_role || '').toLowerCase();
    return role === 'drawer_top_shelf';
  });
  return node ? num(node.pos?.y, 0) : 0;
}

/**
 * Верхняя зона (фикс. высота) опускается до drawer_top_shelf — она же разделитель.
 * В зазоре у крыши: доп. полка по сетке; штанга+опорная полка — внутри опущенной зоны.
 */
function resolveRodZoneSlideLayoutContext(
  interiorHeightMm,
  layout,
  hBottom,
  shelfPolicy,
  thickness,
  drawerTopShelfAbs
) {
  const drawerTop = Math.round(num(drawerTopShelfAbs, 0));
  if (!(drawerTop > 0)) return null;
  const spans = resolveInteriorZoneSpansMm(interiorHeightMm, layout);
  const geometricSplitAbs = Math.max(0, num(hBottom, 0)) + resolveZoneSplitMm(spans);
  if (drawerTop >= geometricSplitAbs - 12) return null;
  const zoneHeightMm = resolveRodZoneHeightMm(interiorHeightMm, layout);
  if (!(zoneHeightMm > 0)) return null;
  const shiftedZoneTop = drawerTop + zoneHeightMm;
  const interiorTop = Math.max(0, num(hBottom, 0)) + interiorHeightMm;
  if (!(shiftedZoneTop < interiorTop - 8)) return null;
  const gridLines = computeGlobalEvenShelfAbsYLines(
    interiorHeightMm,
    shelfPolicy,
    hBottom,
    thickness
  );
  if (!gridLines.length) return null;
  const ceilingGapLines = gridLines.filter(
    (y) => y > shiftedZoneTop + 8 && y < interiorTop - 8
  );
  if (!ceilingGapLines.length) return null;
  const ceilingGapShelfAbs = num(ceilingGapLines[ceilingGapLines.length - 1], 0);
  return {
    splitAbs: drawerTop,
    geometricSplitAbs,
    shiftedZoneTop,
    zoneHeightMm,
    ceilingGapShelfAbs,
    gridLines,
  };
}

/** @deprecated alias */
export function computeRodZoneExpansionMaxSteps(opts = {}) {
  return computeRodZoneExpansionAutoSteps(opts);
}

/** @deprecated alias */
export function computeRodContentShiftDownMaxSteps(opts = {}) {
  return computeRodZoneExpansionAutoSteps(opts);
}

/** @deprecated alias */
export function computeRodGridShiftDownMaxSteps(opts = {}) {
  return computeRodZoneExpansionAutoSteps(opts);
}

/** Активна ли вариация «зона опущена до полки над ящиками». */
export function computeRodZoneExpansionAutoSteps(opts = {}) {
  const interiorHeightMm = Math.max(0, num(opts.interiorHeightMm, 0));
  const layout = opts.layout ?? opts.interiorLayout ?? null;
  if (!(interiorHeightMm > 0) || !isRodTopDrawersBottomFiftyFifty(layout)) return 0;
  const drawerTop = predictDrawerTopShelfAbsY({
    interiorLayout: layout,
    interiorHeightMm,
    hBottom: Math.max(0, num(opts.hBottom, 0)),
    shelfThicknessMm: Math.max(8, num(opts.shelfThicknessMm, 16)),
    drawerHeightMm: Math.max(40, num(opts.drawerHeightMm, 162)),
    policy: opts.drawerPolicy ?? null,
  });
  const ctx = resolveRodZoneSlideLayoutContext(
    interiorHeightMm,
    layout,
    Math.max(0, num(opts.hBottom, 0)),
    opts.shelfPolicy ?? null,
    Math.max(8, num(opts.shelfThicknessMm, 16)),
    drawerTop
  );
  return ctx ? 1 : 0;
}

/** @deprecated alias */
export function computeRodContentShiftAutoSteps(opts = {}) {
  return computeRodZoneExpansionAutoSteps(opts);
}

function promoteDrawerTopShelfToDivider(node, thickness) {
  if (!node) return node;
  const t = Math.max(8, num(thickness, 16));
  const out = cloneJson(node);
  out.sectionLayoutRole = 'zone_divider';
  out.layout_role = out.layout_role || 'shelf';
  out.pivot =
    out.pivot && typeof out.pivot === 'object'
      ? { ...out.pivot, y: 0 }
      : { x: -1, y: 0, z: -1 };
  if (out.size && typeof out.size === 'object') out.size = { ...out.size, y: t };
  return out;
}

/** Контекст зон 50/50: split, верх/низ по content. */
export function resolveFiftyFiftyZoneContext(layout, interiorHeightMm, hBottom = 0, ctxOpts = {}) {
  if (!isFiftyFiftyInteriorLayout(layout)) return null;
  const spans = resolveInteriorZoneSpansMm(interiorHeightMm, layout);
  if (spans.length !== 2) return null;
  let splitLocal = resolveZoneSplitMm(spans);
  const splitAbs = Math.max(0, num(hBottom, 0)) + splitLocal;
  const bottomZone = spans.find((z) => num(z.bottomMm, 0) < splitLocal - 1) || null;
  const topZone = spans.find((z) => num(z.bottomMm, 0) >= splitLocal - 1) || null;
  return {
    splitLocal,
    splitAbs,
    bottomZone,
    topZone,
    topContent: String(topZone?.content || '').toLowerCase(),
    bottomContent: String(bottomZone?.content || '').toLowerCase(),
  };
}

function makeSplitDividerShelfAtY(shelfTpl, splitAbsY, thickness) {
  const tpl = shelfTpl || createDefaultShelfDividerTemplate(thickness);
  const div = cloneJson(tpl);
  const t = Math.max(8, num(thickness, num(div?.size?.y, 16)));
  div.id = `${tpl.id || 'shelf'}__split_divider`;
  div.size = div.size && typeof div.size === 'object' ? { ...div.size, y: t } : { y: t };
  div.pos =
    div.pos && typeof div.pos === 'object'
      ? { ...div.pos, y: Math.round(splitAbsY) }
      : { y: Math.round(splitAbsY) };
  if (div.pos.x === undefined || div.pos.x === null || String(div.pos.x).trim() === 's:x') {
    div.pos.x = 16;
  }
  div.layout_role = 'shelf';
  div.sectionLayoutRole = 'zone_divider';
  div.pivot =
    div.pivot && typeof div.pivot === 'object'
      ? { ...div.pivot, y: 0 }
      : { x: -1, y: 0, z: -1 };
  div.children = [];
  return div;
}

/**
 * 50/50 штанга+ящики: одна полка на split (над ящиками).
 * 50/50 полки+ящики: разделитель + полки только в верхней зоне.
 */
export function normalizeFiftyFiftySplitShelfNodes(children, ctx, opts = {}) {
  if (!ctx || !Array.isArray(children) || !children.length) return children;
  const split = Math.round(num(ctx.splitAbs, 0));
  if (!(split > 0)) return children;
  const tol = Math.max(16, num(opts.splitTolMm, 28));
  const topRod = ctx.topContent === 'rod' && ctx.bottomContent === 'drawers';
  const topShelves = ctx.topContent === 'shelves' && ctx.bottomContent === 'drawers';
  if (!topRod && !topShelves) return children;

  const nonShelves = [];
  const shelves = [];
  for (const c of children) {
    if (isShelfLikeNodeForLayout(c)) shelves.push(c);
    else nonShelves.push(c);
  }

  const nearSplit = (s) => Math.abs(num(s?.pos?.y, 0) - split) <= tol;
  const pickDividerSrc = () => {
    const byRole = shelves.find(
      (s) => String(s.sectionLayoutRole || '').toLowerCase() === 'zone_divider' && nearSplit(s)
    );
    if (byRole) return byRole;
    return shelves.find((s) => nearSplit(s)) || null;
  };

  const normalizeDivider = (src) => {
    const d = cloneJson(src);
    d.pos = d.pos && typeof d.pos === 'object' ? { ...d.pos, y: split } : { y: split };
    if (d.pos.x === undefined || d.pos.x === null || String(d.pos.x).trim() === 's:x') d.pos.x = 16;
    d.sectionLayoutRole = 'zone_divider';
    d.layout_role = d.layout_role || 'shelf';
    d.pivot =
      d.pivot && typeof d.pivot === 'object' ? { ...d.pivot, y: 0 } : { x: -1, y: 0, z: -1 };
    return d;
  };

  const kept = [];
  const dividerSrc = pickDividerSrc();
  kept.push(
    dividerSrc
      ? normalizeDivider(dividerSrc)
      : makeSplitDividerShelfAtY(opts.shelfTemplate, split, num(opts.shelfThicknessMm, 16))
  );

  const minTopShelfY = topShelves
    ? split + Math.max(72, num(opts.topZoneShelfMinOffsetMm, 96))
    : Infinity;
  const dividerId = dividerSrc?.id;
  for (const s of shelves) {
    if (dividerId && s.id === dividerId) continue;
    if (!dividerId && nearSplit(s)) continue;
    const role = String(s.sectionLayoutRole || s.layout_role || '').toLowerCase();
    if (role === 'drawer_top_shelf' || role === 'drawer_zone_fill_shelf') {
      const yTop = num(s.pos?.y, NaN);
      // Полки в нижней зоне над стеком ящиков (якорь bottom) — ниже разделителя 50/50.
      if (Number.isFinite(yTop) && yTop > 0 && yTop < split - 8) kept.push(s);
      continue;
    }
    if (topRod) {
      const yRod = num(s.pos?.y, NaN);
      if (
        (role === 'rod_top_shelf' ||
          role === 'rod_zone_fill_shelf' ||
          role === 'rod_interior_shelf') &&
        Number.isFinite(yRod) &&
        yRod > split + 8
      ) {
        kept.push(s);
      }
      continue;
    }
    if (topShelves) {
      const y = num(s.pos?.y, NaN);
      if (Number.isFinite(y) && y >= minTopShelfY) kept.push(s);
    }
  }

  const outNonShelves = topShelves ? nonShelves.filter((c) => !isRodModuleNode(c)) : nonShelves;
  return [...outNonShelves, ...kept];
}

/** Две зоны ~50/50 — разделительная полка на границе (дно/крыша половин). */
export function isFiftyFiftyZoneSplit(zoneSpans, layout) {
  if (!Array.isArray(zoneSpans) || zoneSpans.length !== 2) return false;
  const zones = layout?.zones;
  if (Array.isArray(zones) && zones.length === 2) {
    const p0 = num(zones[0].heightPercent, 0);
    const p1 = num(zones[1].heightPercent, 0);
    const sum = p0 + p1 || 100;
    if (Math.abs(p0 - p1) <= 1 && Math.abs(sum - 100) <= 1) return true;
    if (Math.abs(p0 / sum - 0.5) < 0.02 && Math.abs(p1 / sum - 0.5) < 0.02) return true;
  }
  const total = num(zoneSpans[0].heightMm, 0) + num(zoneSpans[1].heightMm, 0);
  if (!(total > 0)) return false;
  return Math.abs(num(zoneSpans[0].heightMm, 0) / total - 0.5) < 0.03;
}

function resolveZoneSplitMm(zoneSpans) {
  if (!Array.isArray(zoneSpans) || !zoneSpans.length) return 0;
  return num(zoneSpans[0].topMm, num(zoneSpans[0].heightMm, 0));
}

/**
 * Позиция разделителя от низа зоны (мм): пол верхней половины или потолок нижней.
 * @deprecated Разделитель 50/50 — appendFiftyFiftyCenterDivider + shelfZoneSplitInsets.
 */
function dividerPosFromZoneBottom(zone, splitMm, shelfThickness) {
  const zBot = Math.max(0, num(zone.bottomMm, 0));
  const zTop = zBot + Math.max(0, num(zone.heightMm, 0));
  const split = num(splitMm, -1);
  if (!(split > 0)) return null;
  if (Math.abs(zTop - split) < 2) {
    return num(zone.heightMm, 0);
  }
  if (Math.abs(zBot - split) < 2) {
    return 0;
  }
  return null;
}

function makeShelfFromTemplate(template, zone, stack, posFromBottom, pivotBottom, zoneTopY, idSuffix) {
  const d = cloneJson(template);
  d.id = `${template.id || 'shelf'}__${zone.id}_${idSuffix}`;
  d.size = d.size && typeof d.size === 'object' ? { ...d.size } : {};
  d.pos = d.pos && typeof d.pos === 'object' ? { ...d.pos } : {};
  d.size.y = stack.shelfThicknessMm;
  const anchorCenter = stack?.positionAnchor === 'center';
  const halfT = stack.shelfThicknessMm / 2;
  let y = Math.round(pivotBottom + posFromBottom);
  if (anchorCenter) {
    y = Math.max(y, Math.round(pivotBottom + halfT));
    y = Math.min(y, Math.round(zoneTopY - halfT));
    d.pivot =
      d.pivot && typeof d.pivot === 'object'
        ? { ...d.pivot, y: 0 }
        : { x: -1, y: 0, z: -1 };
  } else {
    y = Math.max(y, pivotBottom);
    y = Math.min(y, Math.round(zoneTopY - stack.shelfThicknessMm));
  }
  d.pos.y = y;
  if (!d.layout_role && !d.sectionLayoutRole) d.layout_role = 'shelf';
  return d;
}

/** Политика полок внутри зоны: mixed — фикс. позиции от низа зоны, не всего шкафа. */
function policyForShelfZone(policy, zone) {
  const p = normalizeShelfStackPolicy(policy);
  if (!p) return p;
  const zoneBottom = Math.max(0, num(zone.bottomMm, 0));
  const zoneH = Math.max(0, num(zone.heightMm, 0));
  if (p.distribution !== 'mixed' || !p.fixedPositionsFromBottomMm?.length) return p;
  const t = Math.max(8, num(p.shelfThicknessMm, 16));
  const fixed = p.fixedPositionsFromBottomMm
    .map((pos) => Math.round(num(pos, -1) - zoneBottom))
    .filter((pos) => pos >= 0 && pos <= Math.max(0, zoneH - t));
  return { ...p, fixedPositionsFromBottomMm: fixed };
}

function applyRodInZone(template, zone, rodRules, idSuffix = 'rod') {
  const d = cloneJson(template);
  d.id = `${template.id || 'rod'}__${zone?.id || 'zone'}__${idSuffix}`;
  const anchor = rodRules?.anchor === 'bottom' ? 'bottom' : 'top';
  const offset = Math.max(0, num(rodRules?.offsetMm, 80));
  d.size = d.size && typeof d.size === 'object' ? { ...d.size } : {};
  d.pos = d.pos && typeof d.pos === 'object' ? { ...d.pos } : {};
  if (anchor === 'top') {
    d.pos.y = Math.round(zone.bottomMm + zone.heightMm - offset);
  } else {
    d.pos.y = Math.round(zone.bottomMm + offset);
  }
  if (!d.layout_role && !d.sectionLayoutRole) d.layout_role = 'rod';
  // 50/50 (~50%) → короткие; 100% зона → длинные (wardrobe-5 strips).
  const hp = Math.max(0, num(zone?.heightPercent, 100));
  const hangKind = hp >= 70 ? 'long' : 'short';
  d.rodHangStripKind = hangKind;
  d.spec =
    d.spec && typeof d.spec === 'object'
      ? { ...d.spec, rodHangStripKind: hangKind }
      : { rodHangStripKind: hangKind };
  return d;
}

function buildShelfFromTemplateAtY(shelfTemplate, y, idSuffix) {
  if (!shelfTemplate) return null;
  const shelf = cloneJson(shelfTemplate);
  shelf.size = shelf.size && typeof shelf.size === 'object' ? { ...shelf.size } : {};
  shelf.pos = shelf.pos && typeof shelf.pos === 'object' ? { ...shelf.pos } : {};
  shelf.pivot = shelf.pivot && typeof shelf.pivot === 'object' ? { ...shelf.pivot } : { x: -1, y: 0, z: -1 };
  shelf.pivot.y = 0;
  shelf.id = `${shelfTemplate.id || 'shelf'}__${idSuffix}`;
  shelf.pos.y = Math.round(y);
  shelf.layout_role = 'shelf';
  return shelf;
}

function resolveReferenceShelfCentersAbs(zone, policy, thickness, hBottom) {
  void policy;
  const zoneH = Math.max(0, num(zone?.heightMm, 0));
  if (!(zoneH > 0)) return [];
  const t = Math.max(8, num(thickness, 16));
  // Для companion-полок у штанги используем эталонную сетку 5 полок (S_5PL),
  // чтобы линии всегда совпадали с соседним 5-полочным шкафом.
  const p = normalizeShelfStackPolicy({
    enabled: true,
    distribution: 'even_fixed',
    maxCount: 5,
    shelfThicknessMm: t,
    bottomOffsetMm: 0,
    topOffsetMm: 0,
  });
  if (!p?.enabled) return [];
  const zoneSpan = resolveShelfSpanInZone(zoneH, p || {});
  let span = zoneSpan.span;
  const evenDistribution = p.distribution === 'even' || p.distribution === 'even_fixed';
  if (evenDistribution) {
    span = Math.max(0, span - 2 * t);
  }
  if (!(span > 0)) return [];
  const stack = computeShelfLayout(span, p, t);
  if (!stack?.positionsFromBottomMm?.length) return [];
  // even/even_fixed: шаг считаем по чистому проёму (span-2t),
  // но центр полки привязываем к оси секции/зоны, поэтому даём +t к базовой оси.
  const evenCenterShift = evenDistribution ? t : 0;
  const absBase =
    Math.max(0, num(hBottom, 0)) +
    Math.max(0, num(zone?.bottomMm, 0)) +
    zoneSpan.insetBottomMm +
    evenCenterShift;
  return stack.positionsFromBottomMm
    .map((v) => Math.round(absBase + num(v, 0)))
    .filter((v) => Number.isFinite(v))
    .sort((a, b) => a - b);
}

function buildRodGridShiftCompanionShelves(
  shelfTemplate,
  rodNode,
  rodRules,
  shiftCtx,
  zone,
  thickness
) {
  if (!shelfTemplate || !rodNode || !shiftCtx) return [];
  const mode = String(rodRules?.companionMode || 'none').trim().toLowerCase();
  const out = [];
  const t = Math.max(8, num(thickness, num(shelfTemplate?.size?.y, 16)));
  const rodH = Math.max(8, num(rodNode?.size?.y, 16));
  const zoneAbsBottom = Math.max(0, num(zone?.bottomMm, 0));
  const zoneAbsTop = zoneAbsBottom + Math.max(0, num(zone?.heightMm, 0));
  const gap = Math.max(0, num(rodRules?.topShelfGapMm, 80));
  const splitAbs = Math.round(num(shiftCtx.splitAbs, zoneAbsBottom));
  const rodTopY = Math.round(num(shiftCtx.rodTopShelfAbs, 0));
  const gridLines = Array.isArray(shiftCtx.gridLines) ? shiftCtx.gridLines : [];

  // При сдвиге по сетке: опорная полка над штангой + полки до крышки — всегда.
  const shelfTop = buildShelfFromTemplateAtY(
    shelfTemplate,
    rodTopY,
    `${zone.id || 'zone'}__rod_top_ref`
  );
  if (shelfTop) {
    shelfTop.sectionLayoutRole = 'rod_top_shelf';
    out.push(shelfTop);
  }
  (shiftCtx.fillShelfAbsLines || []).forEach((y, i) => {
    const shelfFill = buildShelfFromTemplateAtY(
      shelfTemplate,
      y,
      `${zone.id || 'zone'}__rod_grid_above_${i + 1}`
    );
    if (shelfFill) {
      shelfFill.sectionLayoutRole = 'rod_zone_fill_shelf';
      out.push(shelfFill);
    }
  });
  const rodBottom = rodTopY - t / 2 - gap - rodH;
  rodNode.pos = rodNode.pos && typeof rodNode.pos === 'object' ? { ...rodNode.pos } : {};
  rodNode.pos.y = Math.round(
    Math.max(splitAbs + 8, Math.min(zoneAbsTop - rodH, rodBottom))
  );

  if (mode === 'bottom_shelves' || mode === 'top_and_bottom') {
    const count = Math.max(0, Math.floor(num(rodRules?.bottomShelvesCount, 1)));
    const bottomRefs = gridLines
      .filter((y) => y > splitAbs + 8 && y < rodTopY - t - 8)
      .slice(0, count);
    bottomRefs.forEach((y, i) => {
      const shelfBottom = buildShelfFromTemplateAtY(
        shelfTemplate,
        y,
        `${zone.id || 'zone'}__rod_bottom_${i + 1}`
      );
      if (shelfBottom) {
        shelfBottom.sectionLayoutRole = 'rod_interior_shelf';
        out.push(shelfBottom);
      }
    });
  }

  return out;
}

function effectiveRodCompanionMode(rodRules, fiftyFiftyRodDrawers = false) {
  const mode = String(rodRules?.companionMode || 'none').trim().toLowerCase();
  if (!fiftyFiftyRodDrawers) return mode;
  if (mode === 'none' || mode === 'top_shelf') return mode;
  return 'top_shelf';
}

/** Зона опущена: штанга+полка внутри зоны; у крыши — одна полка по сетке. */
function buildRodZoneSlideCompanionShelves(
  shelfTemplate,
  rodNode,
  rodRules,
  slideCtx,
  rodZone,
  policy,
  thickness,
  hBottom,
  fiftyFiftyRodDrawers = true
) {
  if (!shelfTemplate || !rodNode || !slideCtx) return [];
  const mode = effectiveRodCompanionMode(rodRules, fiftyFiftyRodDrawers);
  if (mode === 'none') return [];
  const out = [];
  const t = Math.max(8, num(thickness, num(shelfTemplate?.size?.y, 16)));
  const rodH = Math.max(8, num(rodNode?.size?.y, 16));
  const gap = Math.max(0, num(rodRules?.topShelfGapMm, 80));
  const zoneAbsBottom = Math.round(num(slideCtx.splitAbs, 0));
  const zoneAbsTop = Math.round(num(slideCtx.shiftedZoneTop, zoneAbsBottom));
  if (!(zoneAbsTop > zoneAbsBottom)) return [];

  const shiftedZone = {
    ...rodZone,
    bottomMm: Math.max(0, zoneAbsBottom - Math.max(0, num(hBottom, 0))),
    heightMm: Math.max(0, zoneAbsTop - zoneAbsBottom),
    topMm: zoneAbsTop,
  };
  const refs = resolveReferenceShelfCentersAbs(shiftedZone, policy, t, hBottom);

  if (mode === 'top_shelf' && refs.length) {
    const topRef = refs[refs.length - 1];
    const shelfTop = buildShelfFromTemplateAtY(
      shelfTemplate,
      topRef,
      `${rodZone.id || 'zone'}__rod_top_ref`
    );
    if (shelfTop) {
      shelfTop.sectionLayoutRole = 'rod_top_shelf';
      out.push(shelfTop);
    }
    const rodBottom = topRef - t / 2 - gap - rodH;
    rodNode.pos = rodNode.pos && typeof rodNode.pos === 'object' ? { ...rodNode.pos } : {};
    rodNode.pos.y = Math.round(
      Math.max(zoneAbsBottom + 8, Math.min(zoneAbsTop - rodH, rodBottom))
    );
  }

  const ceilingY = Math.round(num(slideCtx.ceilingGapShelfAbs, 0));
  if (ceilingY > zoneAbsTop + 8) {
    const ceilingShelf = buildShelfFromTemplateAtY(
      shelfTemplate,
      ceilingY,
      `${rodZone.id || 'zone'}__rod_ceiling_gap`
    );
    if (ceilingShelf) {
      ceilingShelf.sectionLayoutRole = 'rod_zone_ceiling_fill_shelf';
      out.push(ceilingShelf);
    }
  }

  return out;
}

function buildRodCompanionShelvesInZone(
  shelfTemplate,
  zone,
  policy,
  thickness,
  hBottom,
  rodNode,
  rodRules,
  rodShiftCtx = null,
  fiftyFiftyRodDrawers = false
) {
  if (!shelfTemplate || !rodNode) return [];
  if (rodShiftCtx?.shiftSteps > 0) {
    return buildRodGridShiftCompanionShelves(
      shelfTemplate,
      rodNode,
      rodRules,
      rodShiftCtx,
      {
        ...zone,
        bottomMm: Math.max(0, num(hBottom, 0)) + Math.max(0, num(zone?.bottomMm, 0)),
        heightMm: Math.max(
          0,
          num(zone?.topMm, num(zone?.bottomMm, 0) + num(zone?.heightMm, 0)) -
            num(rodShiftCtx.splitAbs, 0)
        ),
      },
      thickness
    );
  }
  const mode = effectiveRodCompanionMode(rodRules, fiftyFiftyRodDrawers);
  if (mode === 'none') return [];
  const out = [];
  const t = Math.max(8, num(thickness, num(shelfTemplate?.size?.y, 16)));
  const zoneAbsBottom = Math.max(0, num(hBottom, 0)) + Math.max(0, num(zone?.bottomMm, 0));
  const zoneAbsTop = zoneAbsBottom + Math.max(0, num(zone?.heightMm, 0));
  const rodH = Math.max(8, num(rodNode?.size?.y, 16));
  const refs = resolveReferenceShelfCentersAbs(zone, policy, t, hBottom);
  if (!refs.length) return [];

  if (mode === 'top_shelf') {
    const topRef = refs[refs.length - 1];
    const shelfTop = buildShelfFromTemplateAtY(
      shelfTemplate,
      topRef,
      `${zone.id || 'zone'}__rod_top_ref`
    );
    if (shelfTop) {
      shelfTop.sectionLayoutRole = 'rod_top_shelf';
      out.push(shelfTop);
    }
    // Штанга всегда под верхней полкой (pivot полки y=0, штанга ниже на topShelfGapMm).
    const gap = Math.max(0, num(rodRules?.topShelfGapMm, 80));
    const rodBottom = topRef - t / 2 - gap - rodH;
    rodNode.pos = rodNode.pos && typeof rodNode.pos === 'object' ? { ...rodNode.pos } : {};
    rodNode.pos.y = Math.round(Math.max(zoneAbsBottom, Math.min(zoneAbsTop - rodH, rodBottom)));
  }

  if (!fiftyFiftyRodDrawers && (mode === 'bottom_shelves' || mode === 'top_and_bottom')) {
    const count = Math.max(0, Math.floor(num(rodRules?.bottomShelvesCount, 1)));
    if (count > 0) {
      const bottomRefs = refs.slice(0, count);
      bottomRefs.forEach((y, i) => {
        const shelfBottom = buildShelfFromTemplateAtY(
          shelfTemplate,
          y,
          `${zone.id || 'zone'}__rod_bottom_${i + 1}`
        );
        if (shelfBottom) {
          shelfBottom.sectionLayoutRole = 'rod_interior_shelf';
          out.push(shelfBottom);
        }
      });
    }
  }

  return out;
}

/** 50/50 + even/even_fixed: один стек на всю высоту (как 100%), split = разделитель, полки в своих зонах. */
function shouldUseGlobalEvenFiftyFiftyShelfLayout(fiftyFifty, policy) {
  if (!fiftyFifty) return false;
  const p = normalizeShelfStackPolicy(policy);
  if (!p?.enabled) return false;
  return p.distribution === 'even' || p.distribution === 'even_fixed';
}

function findShelfZoneForGlobalAbsY(y, zoneSpans, splitMm, hBottom, tol) {
  const splitAbs = hBottom + splitMm;
  if (y < splitAbs - tol) {
    return (
      zoneSpans.find(
        (z) => z.content === 'shelves' && num(z.bottomMm, 0) < splitMm - 1
      ) || null
    );
  }
  if (y > splitAbs + tol) {
    return (
      zoneSpans.find(
        (z) => z.content === 'shelves' && num(z.bottomMm, 0) >= splitMm - 1
      ) || null
    );
  }
  return null;
}

/**
 * 50/50: верх полки, низ ящики/не-полки.
 */
function isMixedShelvesTopDrawersBottom5050(zoneSpans) {
  if (!Array.isArray(zoneSpans) || zoneSpans.length !== 2) return false;
  const splitLocal = resolveZoneSplitMm(zoneSpans);
  const mixedBottomDrawers = zoneSpans.some(
    (z) => z.content === 'drawers' && num(z.bottomMm, 0) < splitLocal - 1
  );
  const mixedTopShelves = zoneSpans.some(
    (z) => z.content === 'shelves' && num(z.bottomMm, 0) >= splitLocal - 1
  );
  return mixedBottomDrawers && mixedTopShelves;
}

/** Эталонная равномерная сетка на всю высоту — как «равномерно» в админке (не лимиты even_fixed). */
export function computeGlobalEvenShelfAbsYLines(interiorHeightMm, policy, hBottom = 0, thickness = 16) {
  const p = normalizeShelfStackPolicy(policy);
  const t = Math.max(8, num(thickness, num(p?.shelfThicknessMm, 16)));
  const zoneSpan = resolveShelfSpanInZone(interiorHeightMm, p || {});
  let span = zoneSpan.span;
  const edgeInset = t;
  span = Math.max(0, span - 2 * edgeInset);
  if (!(span > 0)) return [];
  const pivotBottom = Math.max(0, num(hBottom, 0)) + zoneSpan.insetBottomMm + edgeInset;
  return computeGlobalEvenReferenceGridAbsY(span, p, t, pivotBottom);
}

/** @deprecated internal alias */
function computeGlobalEvenReferenceGridAbsY(span, policy, thickness, pivotBottom) {
  const t = Math.max(8, num(thickness, 16));
  const refPolicy = normalizeShelfStackPolicy({
    enabled: true,
    distribution: 'even',
    stepMm: 290,
    maxCount: 12,
    shelfThicknessMm: t,
    minGapMm: num(policy?.minGapMm, 50),
  });
  const evenStack = computeShelfLayout(span, refPolicy, t);
  if (!evenStack?.positionsFromBottomMm?.length) return [];
  return evenStack.positionsFromBottomMm
    .map((posFromBottom) => Math.round(pivotBottom + num(posFromBottom, 0)))
    .sort((a, b) => a - b);
}

/**
 * even_fixed N при ящиках снизу: разделитель + (N−1) полок по линиям even-сетки выше split.
 * Возвращает null → fallback на even_fixed с увеличенным maxCount.
 */
function resolveMixedEvenFixedTopShelfAbsY(adminN, referenceEvenYs, splitAbs, tol) {
  const topNeeded = Math.max(0, adminN - 1);
  if (!(topNeeded > 0) || !Array.isArray(referenceEvenYs) || !referenceEvenYs.length) return null;
  const above = referenceEvenYs.filter((y) => y > splitAbs + tol);
  if (above.length < topNeeded) return null;
  return above.slice(above.length - topNeeded);
}

/**
 * 50/50 полки сверху + ящики снизу: fallback even_fixed — увеличить maxCount, пока хватает линий выше split.
 */
function resolveEvenFixedGlobalMaxCountForMixed5050(policy, span, thickness, pivotBottom, splitAbs, zoneSpans) {
  const adminN = Math.max(1, Math.floor(num(policy?.maxCount, 1)));
  if (!isMixedShelvesTopDrawersBottom5050(zoneSpans)) return adminN;

  const t = Math.max(8, num(thickness, 16));
  const tol = Math.max(12, t);
  const topNeeded = Math.max(0, adminN - 1);
  const cap = Math.max(adminN + 16, 24);

  for (let eff = adminN; eff <= cap; eff += 1) {
    const stack = computeShelfLayout(
      span,
      { ...policy, distribution: 'even_fixed', maxCount: eff },
      t
    );
    if (!stack?.positionsFromBottomMm?.length) break;
    const above = stack.positionsFromBottomMm.filter(
      (posFromBottom) => pivotBottom + num(posFromBottom, 0) > splitAbs + tol
    ).length;
    if (above >= topNeeded) return eff;
  }
  return adminN;
}

function applyShelvesGlobalEvenFiftyFifty(
  shelfTpl,
  zoneSpans,
  policy,
  thickness,
  hBottom,
  splitMm,
  layoutHeightMm
) {
  const p = normalizeShelfStackPolicy(policy);
  if (!p?.enabled || !Array.isArray(zoneSpans) || !zoneSpans.some((z) => z.content === 'shelves')) {
    return [];
  }
  const t = Math.max(8, num(thickness, num(p.shelfThicknessMm, 16)));
  const zoneSpan = resolveShelfSpanInZone(layoutHeightMm, p);
  let span = zoneSpan.span;
  const edgeInsetForEven = t;
  span = Math.max(0, span - 2 * edgeInsetForEven);
  if (!(span > 0)) return [];

  const pivotBottom = hBottom + zoneSpan.insetBottomMm + edgeInsetForEven;
  const zoneTopY = hBottom + layoutHeightMm - zoneSpan.insetTopMm;
  const splitAbs = hBottom + splitMm;
  const dividerTol = Math.max(12, t);

  // even_fixed + ящики снизу: (N−1) полок строго по линиям even-сетки (1297/1619 при N=3), не с ужатой сетки N=4.
  const mixedEvenFixed =
    p.distribution === 'even_fixed' && isMixedShelvesTopDrawersBottom5050(zoneSpans);
  if (mixedEvenFixed) {
    const adminN = Math.max(1, Math.floor(num(p.maxCount, 1)));
    const refEvenYs = computeGlobalEvenReferenceGridAbsY(span, p, t, pivotBottom);
    const topYs = resolveMixedEvenFixedTopShelfAbsY(adminN, refEvenYs, splitAbs, dividerTol);
    if (topYs?.length) {
      const topZone =
        zoneSpans.find((z) => z.content === 'shelves' && num(z.bottomMm, 0) >= splitMm - 1) ||
        null;
      const zoneKey = topZone?.id || topZone?.name || 'zone';
      const shelves = topYs
        .map((absY, i) =>
          buildShelfFromTemplateAtY(shelfTpl, absY, `global_${zoneKey}_even_${i + 1}`)
        )
        .filter(Boolean);
      shelves.sort((a, b) => num(a?.pos?.y, 0) - num(b?.pos?.y, 0));
      return shelves;
    }
  }

  let layoutPolicy = p;
  if (p.distribution === 'even_fixed') {
    const effectiveN = resolveEvenFixedGlobalMaxCountForMixed5050(
      p,
      span,
      t,
      pivotBottom,
      splitAbs,
      zoneSpans
    );
    if (effectiveN > num(p.maxCount, 0)) {
      layoutPolicy = { ...p, maxCount: effectiveN };
    }
  }
  const stack = computeShelfLayout(span, layoutPolicy, t);
  if (!stack?.positionsFromBottomMm?.length) return [];

  const shelves = [];

  stack.positionsFromBottomMm.forEach((posFromBottom, i) => {
    const absY = Math.round(pivotBottom + posFromBottom);
    if (Math.abs(absY - splitAbs) <= dividerTol) return;

    const ownerZone = findShelfZoneForGlobalAbsY(absY, zoneSpans, splitMm, hBottom, dividerTol);
    if (!ownerZone) return;

    shelves.push(
      makeShelfFromTemplate(
        shelfTpl,
        ownerZone,
        stack,
        posFromBottom,
        pivotBottom,
        zoneTopY,
        `global_${ownerZone.id || ownerZone.name || 'zone'}_${i + 1}`
      )
    );
  });

  shelves.sort((a, b) => num(a?.pos?.y, 0) - num(b?.pos?.y, 0));
  return shelves;
}

function applyShelvesInZone(template, zone, policy, thickness, floorOffsetMm, opts = {}) {
  const zoneH = Math.max(0, num(zone.heightMm, 0));
  if (!(zoneH > 0)) return [];

  const p =
    policyForShelfZone(policy, zone) ||
    normalizeShelfStackPolicy(policy || { enabled: true, distribution: 'even', maxCount: 5 });
  const t = Math.max(8, num(thickness, num(p?.shelfThicknessMm, 16)));
  const globalSplit = opts?.fiftyFiftyGlobalDivider === true;
  const splitMm = num(opts?.fiftyFiftySplitMm, 0);
  const splitInsets =
    globalSplit && splitMm > 0 ? shelfZoneSplitInsets(zone, splitMm, t) : { bottom: 0, top: 0 };

  if (!p?.enabled) return [];

  const zoneSpan = resolveShelfSpanInZone(zoneH, p || {});
  let span = zoneSpan.span;
  if (globalSplit) {
    span = Math.max(0, span - splitInsets.bottom - splitInsets.top);
  }
  if (!(span > 0)) return [];

  const zoneBottom = Math.max(0, num(zone.bottomMm, 0));
  const floor = num(floorOffsetMm, 0);
  const evenDistribution = p.distribution === 'even' || p.distribution === 'even_fixed';
  const edgeInsetForEven = evenDistribution ? t : 0;
  if (edgeInsetForEven > 0) {
    span = Math.max(0, span - 2 * edgeInsetForEven);
  }
  // even/even_fixed: позиции приходят из чистого проёма (минус 2t),
  // поэтому сдвигаем базу на t, чтобы центр был по середине секции/зоны.
  const evenCenterShift = edgeInsetForEven > 0 ? edgeInsetForEven : 0;
  const pivotBottom =
    floor + zoneBottom + zoneSpan.insetBottomMm + splitInsets.bottom + evenCenterShift;
  const zoneTopY = floor + zoneBottom + zoneH - zoneSpan.insetTopMm - splitInsets.top;

  const shelves = [];
  const stack = computeShelfLayout(span, p, t);
  if (stack?.positionsFromBottomMm?.length) {
    stack.positionsFromBottomMm.forEach((posFromBottom, i) => {
      shelves.push(
        makeShelfFromTemplate(
          template,
          zone,
          stack,
          posFromBottom,
          pivotBottom,
          zoneTopY,
          `auto_${i + 1}`
        )
      );
    });
  }

  shelves.sort((a, b) => num(a?.pos?.y, 0) - num(b?.pos?.y, 0));
  return shelves;
}

/**
 * @param {any[]} roots
 * @param {{ layout?: object, policy?: object, sectionSizeMm?: object, variables?: object }} opts
 */
export function applyInteriorLayoutToRoots(roots, opts = {}) {
  const layout = normalizeLayout(opts.layout);
  if (!layout) return false;

  const sectionSizeY = Math.max(0, num(opts.sectionSizeMm?.y, 0));
  if (!(sectionSizeY > 0)) return false;

  const policy =
    normalizeShelfStackPolicy(opts.policy || opts.shelfStack || null) ||
    (typeof globalThis.__cldCatalogShelfStack?.defaultShelfStackPolicy === 'function'
      ? globalThis.__cldCatalogShelfStack.defaultShelfStackPolicy()
      : normalizeShelfStackPolicy({ enabled: true, distribution: 'even', maxCount: 5 }));
  const vars = opts.variables && typeof opts.variables === 'object' ? opts.variables : {};
  const corpusLocal = opts.corpusLocalFill === true;
  const layoutVars = corpusLocal
    ? { ...vars, h_bottom: 0, h_top: 0, tech_zone_mm: 0 }
    : vars;
  const wt = num(vars._wt, 0) > 0 ? num(vars._wt, 16) : 16;
  const thickness = num(policy?.shelfThicknessMm, wt) || wt;

  const base = resolveShelfInteriorSpanMm(
    sectionSizeY,
    layoutVars,
    policy || { bottomOffsetMm: 0, topOffsetMm: 0 }
  );
  const layoutHeightMm = corpusLocal ? sectionSizeY : base.interiorHeightMm;
  if (!(layoutHeightMm > 0)) return false;

  const zoneSpans = resolveInteriorZoneSpansMm(layoutHeightMm, layout);
  if (!zoneSpans.length) return false;

  const zoneDriven = interiorLayoutRequiresZoneRebuild(layout);
  const hBottom = corpusLocal ? 0 : Math.max(0, num(vars.h_bottom, 0));
  const rootsArr = Array.isArray(roots) ? roots : [roots];
  let changed = false;

  const sectionRoots = findSectionRoots(rootsArr);
  const rootsToProcess = corpusLocal
    ? sectionRoots.filter((r) => !hasNestedSectionDescendant(r) && !sectionHasNestedFillModule(r))
    : sectionRoots;

  for (const root of rootsToProcess) {
    if (!Array.isArray(root.children)) continue;
    if (
      !zoneDriven &&
      opts.preserveManualShelves !== false &&
      shouldPreserveManualShelfLayout(root.children)
    ) {
      continue;
    }

    const templateOpts = {
      interiorTemplates:
        opts.interiorTemplates ??
        extractInteriorTemplatesFromCatalogItem(opts.catalogItem) ??
        null,
      treeChildren: root.children,
      findCatalogItem: opts.findCatalogItem,
      shelfThicknessMm: thickness,
    };
    const shelfTpl = resolveInteriorShelfTemplate(templateOpts);
    let rodTpl = resolveInteriorRodTemplate(templateOpts);
    const needsRod = zoneSpans.some((z) => z.content === 'rod');

    if (zoneDriven) {
      let keep = root.children.filter((c) => !isShelfLikeNodeForLayout(c) && !isRodModuleNode(c));
      const generated = [];

      if (needsRod && !rodTpl) {
        rodTpl = createDefaultRodTemplate();
      }

      const fiftyFifty =
        isFiftyFiftyZoneSplit(zoneSpans, layout) || isFiftyFiftyInteriorLayout(layout);
      const splitMm = fiftyFifty
        ? corpusLocal
          ? resolveCorpusCenterYMm(sectionSizeY)
          : resolveZoneSplitMm(zoneSpans)
        : 0;
      const shelfOpts = {
        fiftyFiftyGlobalDivider: fiftyFifty,
        fiftyFiftySplitMm: splitMm,
      };
      const useGlobalEven5050 = shouldUseGlobalEvenFiftyFiftyShelfLayout(fiftyFifty, policy);

      if (useGlobalEven5050 && shelfTpl && policy?.enabled !== false) {
        generated.push(
          ...applyShelvesGlobalEvenFiftyFifty(
            shelfTpl,
            zoneSpans,
            policy,
            thickness,
            hBottom,
            splitMm,
            layoutHeightMm
          )
        );
      }

      for (const zone of zoneSpans) {
        if (useGlobalEven5050 && zone.content === 'shelves') continue;
        if (zone.content === 'shelves' && shelfTpl && policy?.enabled !== false) {
          generated.push(
            ...applyShelvesInZone(shelfTpl, zone, policy, thickness, hBottom, shelfOpts)
          );
        } else if (zone.content === 'rod' && rodTpl) {
          const zAbs = {
            ...zone,
            bottomMm: hBottom + zone.bottomMm,
          };
          const rodNode = applyRodInZone(rodTpl, zAbs, zone.rodRules, `auto_${zone.id || 'zone'}`);
          generated.push(rodNode);
          const shelfForRod = shelfTpl || createDefaultShelfTemplate(Math.max(8, num(thickness, 16)));
          generated.push(
            ...buildRodCompanionShelvesInZone(
              shelfForRod,
              zone,
              policy,
              thickness,
              hBottom,
              rodNode,
              zone.rodRules,
              null,
              isRodTopDrawersBottomFiftyFifty(layout)
            )
          );
        }
      }

      if (fiftyFifty && splitMm > 0) {
        appendFiftyFiftyCenterDivider(generated, splitMm, hBottom, thickness, shelfTpl);
      }

      if (!generated.length) continue;

      const insertAt = root.children.findIndex((c) => isShelfLikeNodeForLayout(c) || isRodModuleNode(c));
      if (insertAt >= 0) keep.splice(insertAt, 0, ...generated);
      else keep.push(...generated);
      if (fiftyFifty) {
        const ffCtx = resolveFiftyFiftyZoneContext(layout, layoutHeightMm, hBottom, {
          shelfPolicy: policy,
          shelfThicknessMm: thickness,
          drawerHeightMm: Math.max(40, num(opts.drawerHeightMm, 162)),
        });
        if (ffCtx) {
          keep = normalizeFiftyFiftySplitShelfNodes(keep, ffCtx, {
            shelfTemplate: shelfTpl,
            shelfThicknessMm: thickness,
          });
        }
      }
      root.children = keep;
      changed = true;
      continue;
    }

    const hasWork = zoneSpans.some(
      (z) => (z.content === 'shelves' && shelfTpl) || (z.content === 'rod' && rodTpl)
    );
    if (!hasWork) continue;

    const keep = root.children.filter((c) => !isShelfLikeNodeForLayout(c) && !isRodModuleNode(c));
    const generated = [];

    if (needsRod && !rodTpl) {
      rodTpl = createDefaultRodTemplate();
    }

    const fiftyFifty =
      isFiftyFiftyZoneSplit(zoneSpans, layout) || isFiftyFiftyInteriorLayout(layout);
    const splitMm = fiftyFifty
      ? corpusLocal
        ? resolveCorpusCenterYMm(sectionSizeY)
        : resolveZoneSplitMm(zoneSpans)
      : 0;
    const shelfOpts = {
      fiftyFiftyGlobalDivider: fiftyFifty,
      fiftyFiftySplitMm: splitMm,
    };
    const useGlobalEven5050 = shouldUseGlobalEvenFiftyFiftyShelfLayout(fiftyFifty, policy);

    if (useGlobalEven5050 && shelfTpl && policy?.enabled !== false) {
      generated.push(
        ...applyShelvesGlobalEvenFiftyFifty(
          shelfTpl,
          zoneSpans,
          policy,
          thickness,
          hBottom,
          splitMm,
          layoutHeightMm
        )
      );
    }

    for (const zone of zoneSpans) {
      if (useGlobalEven5050 && zone.content === 'shelves') continue;
      if (zone.content === 'shelves' && shelfTpl && policy?.enabled !== false) {
        generated.push(
          ...applyShelvesInZone(shelfTpl, zone, policy, thickness, hBottom, shelfOpts)
        );
      } else if (zone.content === 'rod' && rodTpl) {
        const zAbs = {
          ...zone,
          bottomMm: hBottom + zone.bottomMm,
        };
          const rodNode = applyRodInZone(rodTpl, zAbs, zone.rodRules, `auto_${zone.id || 'zone'}`);
        generated.push(rodNode);
        const shelfForRod = shelfTpl || createDefaultShelfTemplate(Math.max(8, num(thickness, 16)));
        generated.push(
          ...buildRodCompanionShelvesInZone(
            shelfForRod,
            zone,
            policy,
            thickness,
            hBottom,
            rodNode,
            zone.rodRules,
            null,
            isRodTopDrawersBottomFiftyFifty(layout)
          )
        );
      }
    }

    if (fiftyFifty && splitMm > 0) {
      appendFiftyFiftyCenterDivider(generated, splitMm, hBottom, thickness, shelfTpl);
    }

    if (!generated.length) continue;
    const insertAt = root.children.findIndex((c) => isShelfLikeNodeForLayout(c) || isRodModuleNode(c));
    if (insertAt >= 0) keep.splice(insertAt, 0, ...generated);
    else keep.push(...generated);
    if (fiftyFifty) {
      const ffCtx = resolveFiftyFiftyZoneContext(layout, layoutHeightMm, hBottom, {
        shelfPolicy: policy,
        shelfThicknessMm: thickness,
        drawerHeightMm: drawerH,
      });
      if (ffCtx) {
        root.children = normalizeFiftyFiftySplitShelfNodes(keep, ffCtx, {
          shelfTemplate: shelfTpl,
          shelfThicknessMm: thickness,
        });
      } else {
    root.children = keep;
      }
    } else {
      root.children = keep;
    }
    changed = true;
  }

  return changed;
}

const FILL_CATALOG_TYPES = new Set(['catalog_27', 'catalog_38', 'catalog_37', 'catalog_29']);

function resolveNodeSizeYMm(node, fallbackY, vars = {}) {
  const raw = node?.size?.y;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return Math.max(0, num(fallbackY, 0));
    const lower = s.toLowerCase();
    if (lower === 's:y') return Math.max(0, num(fallbackY, 0));
    if (lower.includes('s:y') || /v:\s*/i.test(s)) {
      return evalSlotSizeExpr(raw, buildSlotVarCtx(fallbackY, vars));
    }
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return Math.max(0, num(fallbackY, 0));
}

function buildSlotVarCtx(sectionSizeY, vars = {}) {
  const outerY = Math.max(0, num(sectionSizeY, 0));
  return {
    outerY,
    h_bottom: Math.max(0, num(vars.h_bottom, 0)),
    h_top: Math.max(0, num(vars.h_top, 0)),
    tech_zone_mm: Math.max(0, num(vars.tech_zone_mm, 0)),
    corpus_antresol_mm: Math.max(0, num(vars.corpus_antresol_mm, 0)),
  };
}

/** size.y / s:y − v:h_bottom − v:corpus_antresol_mm … → мм слота модуля. */
export function evalSlotSizeExpr(expr, slotCtx) {
  const ctx = slotCtx && typeof slotCtx === 'object' ? slotCtx : buildSlotVarCtx(0);
  if (typeof expr === 'number' && Number.isFinite(expr) && expr > 0) return expr;
  const raw = String(expr ?? '').trim();
  if (!raw) return ctx.outerY;
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0 && !/[sv]:/i.test(raw)) return n;

  let s = raw.toLowerCase().replace(/\s+/g, '').replace(/[()]/g, '');
  if (s === 's:y') return ctx.outerY;
  if (/^v:corpus_antresol_mm$/.test(s)) {
    return ctx.corpus_antresol_mm > 0 ? ctx.corpus_antresol_mm : 1950;
  }
  if (/^v:h_bottom$/.test(s)) return ctx.h_bottom;
  if (/^v:h_top$/.test(s)) return ctx.h_top;
  if (/^v:tech_zone_mm$/.test(s)) return ctx.tech_zone_mm;

  s = s.replace(/s:y/g, String(ctx.outerY));
  s = s.replace(/v:corpus_antresol_mm/g, String(ctx.corpus_antresol_mm > 0 ? ctx.corpus_antresol_mm : 1950));
  s = s.replace(/v:h_bottom/g, String(ctx.h_bottom));
  s = s.replace(/v:h_top/g, String(ctx.h_top));
  s = s.replace(/v:tech_zone_mm/g, String(ctx.tech_zone_mm));
  if (!/^[\d+\-.]+$/.test(s)) {
    return resolveNodeSizeYMm({ size: { y: raw } }, ctx.outerY);
  }
  try {
    const v = Function(`"use strict"; return (${s})`)();
    return Math.max(0, num(v, ctx.outerY));
  } catch (_) {
    return resolveNodeSizeYMm({ size: { y: raw } }, ctx.outerY);
  }
}

export function resolveModuleSlotSizeYMm(node, sectionSizeY, vars = {}) {
  if (!node || typeof node !== 'object') return Math.max(0, num(sectionSizeY, 0));
  const slotCtx = buildSlotVarCtx(sectionSizeY, vars);
  const rawY = node.size?.y;
  const role = String(node.layout_role ?? node.sectionLayoutRole ?? '').trim().toLowerCase();

  if (rawY != null && rawY !== '') {
    return evalSlotSizeExpr(rawY, slotCtx);
  }
  if (role === 'corpus_antresol') {
    return slotCtx.corpus_antresol_mm > 0 ? slotCtx.corpus_antresol_mm : 1950;
  }
  if (role === 'top' && slotCtx.corpus_antresol_mm > 0) {
    return Math.max(0, slotCtx.outerY - slotCtx.h_bottom - slotCtx.corpus_antresol_mm - slotCtx.tech_zone_mm);
  }
  if (role === 'plinth' && slotCtx.h_bottom > 0) return slotCtx.h_bottom;
  return slotCtx.outerY;
}

function resolveNodeSizeDimMm(raw, axis, fallback) {
  const fb = Math.max(0, num(fallback, 0));
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase();
    const token = `s:${axis}`;
    if (s === token || s.includes(token)) return fb;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return fb;
}

/**
 * Лаборатория наполнения: fill_section (или section) в дереве карточки — эталон W/H/D
 * для превью и политик полок. Форма W/H/D — fallback, если в дереве s:y / нет числа.
 */
export function resolveFillLabSectionSizeMm(tree, fallbackSectionSizeMm = {}, slotVars = {}) {
  const fallback = {
    x: Math.max(0, num(fallbackSectionSizeMm?.x, 600)),
    y: Math.max(0, num(fallbackSectionSizeMm?.y, 400)),
    z: Math.max(0, num(fallbackSectionSizeMm?.z, 600)),
  };
  const roots = Array.isArray(tree) ? tree : tree ? [tree] : [];
  let target = null;
  const stack = [...roots];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    const t = String(n.type || '').toLowerCase();
    if (t === 'fill_section') {
      target = n;
      break;
    }
    if (Array.isArray(n.children)) stack.push(...n.children);
  }
  if (!target) {
    for (const n of roots) {
      if (!n || typeof n !== 'object') continue;
      const t = String(n.type || '').toLowerCase();
      if (t === 'fill_section' || t === 'section') {
        target = n;
        break;
      }
    }
  }
  if (!target) return fallback;
  return {
    x: resolveNodeSizeDimMm(target.size?.x, 'x', fallback.x),
    y: resolveNodeSizeYMm(target, fallback.y, slotVars),
    z: resolveNodeSizeDimMm(target.size?.z, 'z', fallback.z),
  };
}

function extractCatalogTemplateTree(catalogItem) {
  if (!catalogItem || typeof catalogItem !== 'object') return [];
  const parsed = parseCatalogItemDataField(catalogItem);
  const data =
    parsed && Object.keys(parsed).length
      ? { ...parsed, ...catalogItem, data: parsed }
      : catalogItem.data && typeof catalogItem.data === 'object' && !Array.isArray(catalogItem.data)
        ? catalogItem.data
        : catalogItem;
  const cs = data.constructor_structure || catalogItem.constructor_structure;
  if (cs && typeof cs === 'object') {
    if (cs.template && Array.isArray(cs.template.structure)) return cloneJson(cs.template.structure);
    if (cs.spec?.template?.tree && Array.isArray(cs.spec.template.tree)) {
      return cloneJson(cs.spec.template.tree);
    }
    if (cs.type === 'module' && Array.isArray(cs.children)) return cloneJson(cs.children);
    if (Array.isArray(cs)) return cloneJson(cs);
  }
  const fromData = data.clodisJSON ?? catalogItem.clodisJSON;
  if (Array.isArray(fromData) && fromData.length) return cloneJson(fromData);
  return [];
}

function walkClodisWithSectionContext(roots, fn, ctx = {}) {
  const arr = Array.isArray(roots) ? roots : roots ? [roots] : [];
  for (const n of arr) {
    if (!n || typeof n !== 'object') continue;
    const nextCtx = { ...ctx };
    const t = String(n.type || '').toLowerCase();
    if (t === 'section' || t === 'fill_section') {
      const sy = resolveNodeSizeYMm(n, ctx.sectionSizeY);
      if (sy > 0) nextCtx.sectionSizeY = sy;
    }
    fn(n, nextCtx);
    if (Array.isArray(n.children)) walkClodisWithSectionContext(n.children, fn, nextCtx);
  }
}

function defaultFindCatalogItem(ct, id) {
  try {
    const key = String(ct || '').startsWith('catalog_') ? String(ct) : `catalog_${ct}`;
    return globalThis.__CLD_CATALOGS_DATA?.[key]?.items?.[String(id)] || null;
  } catch (_) {
    return null;
  }
}

function treeHasLayoutRole(roots, roleKey) {
  const want = String(roleKey || '').trim().toLowerCase();
  if (!want) return false;
  const stack = Array.isArray(roots) ? [...roots] : roots ? [roots] : [];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    const r = String(n.layout_role ?? n.sectionLayoutRole ?? '').trim().toLowerCase();
    if (r === want) return true;
    if (Array.isArray(n.children)) stack.push(...n.children);
    if (Array.isArray(n.spec?.template_tree)) stack.push(...n.spec.template_tree);
  }
  return false;
}

/** Шкаф с антресолью: corpus_antresol_mm нужен и для роли corpus, не только corpus_antresol. */
function ensureWardrobeCorpusVars(vars, previewTree, sectionSizeY) {
  const out = vars && typeof vars === 'object' ? { ...vars } : {};
  const roots = Array.isArray(previewTree) ? previewTree : previewTree ? [previewTree] : [];
  const hasAntresolTop = treeHasLayoutRole(roots, 'top');
  const hasCorpusLayer =
    treeHasLayoutRole(roots, 'corpus') || treeHasLayoutRole(roots, 'corpus_antresol');
  if (hasAntresolTop && hasCorpusLayer && !(Number(out.corpus_antresol_mm) > 0)) {
    out.corpus_antresol_mm = 1950;
  }
  return out;
}

const SHELL_SLOT_CATALOG_TYPES = new Set([
  'catalog_27',
  'catalog_30',
  'catalog_35',
  'catalog_36',
  'catalog_37',
  '27',
  '30',
  '35',
  '36',
  '37',
]);

function resolveParentShellModuleSlotYMm(parentModule, vars, sectionSizeY, previewTree) {
  if (!parentModule || typeof parentModule !== 'object') return 0;
  const et = String(parentModule.spec?.element_type || '').trim().toLowerCase();
  if (!SHELL_SLOT_CATALOG_TYPES.has(et)) return 0;
  const role = String(parentModule.layout_role ?? parentModule.sectionLayoutRole ?? '')
    .trim()
    .toLowerCase();
  const rawY = parentModule.size?.y;
  const corpus = Math.max(0, num(vars?.corpus_antresol_mm, 0));
  const hasAntresolTop = treeHasLayoutRole(previewTree, 'top');

  if (et === 'catalog_27' || et === '27') {
    if (typeof rawY === 'string' && /corpus_antresol_mm/i.test(rawY)) {
      return corpus > 0 ? corpus : 1950;
    }
    if (role === 'corpus_antresol') {
      return corpus > 0 ? corpus : 1950;
    }
    if (role === 'corpus' && hasAntresolTop && corpus > 0) {
      return corpus;
    }
  }

  const outerY = resolveModuleSlotSizeYMm(parentModule, sectionSizeY, vars);
  if (et === 'catalog_27' || et === '27') {
    return (
      resolveFillShelfSectionSizeYMm({ y: outerY }, vars, { isFill: true, preferCorpusForFill: true }) ||
      outerY
    );
  }
  return outerY;
}

/**
 * Единый слот для fill-политик: секция-хост (антресоль/корпус) → оболочка-модуль → fallback.
 * Один путь для карточки наполнения, антресоли, шкафа, комнаты.
 */
export function resolveFillSlotSizeYMm(opts = {}) {
  const hostY = Math.max(0, num(opts.hostSectionSizeY, 0));
  if (hostY > 0) return hostY;
  const outerY = Math.max(0, num(opts.outerSectionSizeY, num(opts.sectionSizeY, 0)));
  const fromParent = resolveParentShellModuleSlotYMm(
    opts.parentModule,
    opts.fillVars || opts.variables,
    outerY,
    opts.previewTree
  );
  if (fromParent > 0) return fromParent;
  const slotFallback = num(opts.slotFallbackY, 0);
  if (slotFallback > 0) return slotFallback;
  return Math.max(0, num(opts.fallbackY, outerY));
}

function resolveUnifiedFillSectionYMm(sectionSizeMm, vars, catalogTypeHint, catalogItem, isFillRoot, tree) {
  if (isFillRoot) {
    const lab = resolveFillLabSectionSizeMm(tree, sectionSizeMm);
    return Math.max(0, num(lab.y, num(sectionSizeMm?.y, 400)));
  }
  if (isAntresolFillCatalogType(catalogTypeHint, catalogItem)) {
    return Math.max(0, num(sectionSizeMm?.y, 400));
  }
  return (
    resolveFillShelfSectionSizeYMm(sectionSizeMm, vars, {
      isFill: isFillRoot,
      catalogTypeHint,
      catalogItem,
    }) || num(sectionSizeMm?.y, 1950)
  );
}

function isShellCatalogType(catalogTypeHint) {
  return isShellHostCatalogType(catalogTypeHint);
}

function buildFillModuleApplyCtx(opts = {}) {
  const catalogTypeHint =
    opts.catalogTypeHint ||
    opts.catalogType ||
    (typeof globalThis !== 'undefined' ? globalThis.catalogItemVueApp?.catalogType : '') ||
    '';
  const sectionSizeMm = {
    x: num(opts.sectionSizeMm?.x, 600),
    y: num(opts.sectionSizeMm?.y, 400),
    z: num(opts.sectionSizeMm?.z, 600),
  };
  const previewTree = opts.previewTree ?? opts.roots ?? null;
  const rawVars =
    opts.variables && typeof opts.variables === 'object'
      ? opts.variables
      : resolvePreviewFillVariables({
          ...opts,
          catalogTypeHint,
          previewTree,
          sectionSizeMm,
        });
  const vars = ensureWardrobeCorpusVars(rawVars, previewTree, sectionSizeMm.y);
  const isFillRoot = isFillPolicyCatalogItem(opts.rootCatalogItem, catalogTypeHint);
  const corpusY = resolveUnifiedFillSectionYMm(
    sectionSizeMm,
    vars,
    catalogTypeHint,
    opts.rootCatalogItem,
    isFillRoot,
    opts.previewTree ?? opts.roots ?? null
  );
  return {
    sx: sectionSizeMm.x,
    sz: sectionSizeMm.z,
    sectionSizeY: sectionSizeMm.y,
    outerSectionSizeY: sectionSizeMm.y,
    corpusY,
    slotVars: { ...vars },
    fillVars: { ...vars, h_bottom: 0, h_top: 0, tech_zone_mm: 0 },
    shellCatalogItem: opts.shellCatalogItem ?? null,
    findCatalogItem: opts.findCatalogItem || defaultFindCatalogItem,
    debugTag: opts.debugTag || 'fill/unified',
    catalogTypeHint,
    forPreview: opts.forPreview,
    previewTree,
  };
}

function applyFillPolicyToNestedModuleNode(node, ctx, parentModule = null, walkCtx = {}) {
  if (!node || typeof node !== 'object') return false;
  if (String(node.type || '').toLowerCase() !== 'module') return false;
  const et = String(node.spec?.element_type || '').trim().toLowerCase();
  if (et !== 'catalog_38' && et !== 'catalog_37' && et !== 'catalog_39') return false;
  const catalogId = Number(node.spec?.id);
  if (!Number.isFinite(catalogId) || catalogId <= 0) return false;
  const findCatalogItem =
    typeof ctx.findCatalogItem === 'function' ? ctx.findCatalogItem : defaultFindCatalogItem;
  const fillItem = findCatalogItem(et, catalogId);
  if (!fillItem) return false;
  const hydratedTpl =
    Array.isArray(node.spec?.template_tree) && node.spec.template_tree.length
      ? node.spec.template_tree
      : extractCatalogTemplateTree(fillItem);
  if (!Array.isArray(hydratedTpl) || !hydratedTpl.length) return false;
  const slotY = resolveFillSlotSizeYMm({
    hostSectionSizeY: walkCtx.sectionSizeY,
    parentModule,
    fillVars: ctx.slotVars,
    variables: ctx.slotVars,
    previewTree: ctx.previewTree,
    outerSectionSizeY: ctx.outerSectionSizeY ?? ctx.sectionSizeY,
    sectionSizeY: ctx.sectionSizeY,
    slotFallbackY: walkCtx.sectionSizeY,
    fallbackY: ctx.corpusY,
  });
  const applied = applyFillPoliciesToCatalogTemplateTree(cloneJson(hydratedTpl), fillItem, {
    sectionSizeMm: { x: ctx.sx, y: slotY, z: ctx.sz },
      variables: ctx.fillVars,
      shellCatalogItem: ctx.shellCatalogItem,
    findCatalogItem,
    catalogTypeHint: et,
    debugTag: ctx.debugTag || 'preview/nested-fill',
  });
  node.spec = node.spec && typeof node.spec === 'object' ? { ...node.spec } : {};
  node.spec.template_tree = applied;
  return true;
}

function walkFillCatalogModules(nodes, ctx, visit, parentModule = null, walkCtx = {}) {
  if (!Array.isArray(nodes)) return;
  const outerY = num(ctx.outerSectionSizeY, ctx.sectionSizeY);
  const inheritedY = num(walkCtx.sectionSizeY, outerY);
  const slotVars = ctx.slotVars || ctx.fillVars || {};
  for (const n of nodes) {
    if (!n || typeof n !== 'object') continue;
    const isModule = String(n.type || '').toLowerCase() === 'module';
    let nextWalkCtx = walkCtx;
    const t = String(n.type || '').toLowerCase();
    if (t === 'section' || t === 'fill_section') {
      const sy = resolveModuleSlotSizeYMm(n, inheritedY, slotVars);
      if (sy > 0) nextWalkCtx = { ...walkCtx, sectionSizeY: sy };
    }
    if (isModule) {
      visit(n, parentModule, nextWalkCtx);
      if (Array.isArray(n.spec?.template_tree)) {
        const moduleSlotY = resolveModuleSlotSizeYMm(n, inheritedY, slotVars);
        if (shouldNeutralizeShellModuleTemplate(n)) {
    n.spec = n.spec && typeof n.spec === 'object' ? { ...n.spec } : {};
          n.spec.template_tree = neutralizeNestedShellSlotTree(n.spec.template_tree);
        }
        const innerCtx =
          moduleSlotY > 0
            ? { sectionSizeY: moduleSlotY }
            : nextWalkCtx.sectionSizeY > 0
              ? nextWalkCtx
              : walkCtx;
        walkFillCatalogModules(n.spec.template_tree, ctx, visit, n, innerCtx);
      }
    } else {
      visit(n, parentModule, nextWalkCtx);
    }
    if (Array.isArray(n.children)) {
      walkFillCatalogModules(n.children, ctx, visit, isModule ? n : parentModule, nextWalkCtx);
    }
  }
}

/** Любое дерево: каждый вложенный catalog_38/37 — свои fill-политики из карточки каталога. */
export function applyFillModulePoliciesInTree(roots, opts = {}) {
  const rootsArr = Array.isArray(roots) ? roots : roots ? [roots] : [];
  if (!rootsArr.length) return rootsArr;

  const ctx = buildFillModuleApplyCtx({ ...opts, previewTree: opts.previewTree ?? rootsArr });
  let tree;
  try {
    tree = cloneJson(rootsArr);
  } catch (_) {
    return rootsArr;
  }

  let changed = false;
  walkFillCatalogModules(tree, ctx, (node, parentModule, walkCtx) => {
    if (applyFillPolicyToNestedModuleNode(node, ctx, parentModule, walkCtx)) changed = true;
  });
  return changed ? tree : rootsArr;
}

/** @deprecated alias */
export function applyNestedFillPoliciesInPreviewTree(roots, opts = {}) {
  return applyFillModulePoliciesInTree(roots, opts);
}

/**
 * Единый конвейер наполнения для превью/комнаты:
 * 1) корневая карточка catalog_38/37 (если редактируем наполнение),
 * 2) все вложенные catalog_38/37 в дереве (корпус, шкаф, любое число fill-модулей).
 */
export function applyUnifiedFillPoliciesInTree(roots, opts = {}) {
  const rootsArr = Array.isArray(roots) ? roots : roots ? [roots] : [];
  if (!rootsArr.length) return rootsArr;

  const catalogTypeHint =
    opts.catalogTypeHint ||
    opts.catalogType ||
    (typeof globalThis !== 'undefined' ? globalThis.catalogItemVueApp?.catalogType : '') ||
    '';
  const vueItem =
    opts.catalogItem ||
    opts.rootCatalogItem ||
    (typeof globalThis !== 'undefined' ? globalThis.catalogItemVueApp?.item : null);
  const rootCatalogItem =
    opts.rootCatalogItem ?? buildPreviewCatalogItem(vueItem, catalogTypeHint);
  const isFillRoot =
    !!rootCatalogItem && isFillPolicyCatalogItem(rootCatalogItem, catalogTypeHint);
  const isShellRoot = isShellCatalogType(catalogTypeHint);

  const vars = ensureWardrobeCorpusVars(
    opts.variables && typeof opts.variables === 'object'
      ? opts.variables
      : resolvePreviewFillVariables({ ...opts, vueItem, catalogTypeHint, previewTree: rootsArr }),
    rootsArr,
    num(opts.sectionSizeMm?.y, 0)
  );
  const sectionSizeMm = {
    x: num(opts.sectionSizeMm?.x, 600),
    y: num(opts.sectionSizeMm?.y, 400),
    z: num(opts.sectionSizeMm?.z, 600),
  };
  const corpusY = resolveUnifiedFillSectionYMm(
    sectionSizeMm,
    vars,
    catalogTypeHint,
    rootCatalogItem,
    isFillRoot,
    rootsArr
  );
  const findCatalogItem = opts.findCatalogItem || defaultFindCatalogItem;
  const shellCatalogItem =
    opts.shellCatalogItem ?? (isShellRoot ? rootCatalogItem : null);

  let tree;
  try {
    tree = cloneJson(rootsArr);
  } catch (_) {
    return rootsArr;
  }

  let changed = false;

  if (isFillRoot && opts.skipRootFill !== true) {
    const applied = applyFillPoliciesToCatalogTemplateTree(tree, rootCatalogItem, {
      sectionSizeMm: { x: sectionSizeMm.x, y: corpusY, z: sectionSizeMm.z },
      variables: { ...vars, h_bottom: 0, h_top: 0, tech_zone_mm: 0 },
      shellCatalogItem,
      catalogTypeHint,
      findCatalogItem,
      debugTag: opts.debugTag || `unified/root/${catalogTypeHint || 'fill'}`,
      forPreview: opts.forPreview,
    });
    if (Array.isArray(applied) && applied.length) {
      tree = applied;
    changed = true;
  }
  }

  const nested = applyFillModulePoliciesInTree(tree, {
    ...opts,
    catalogTypeHint,
    variables: vars,
    previewTree: tree,
    // Полная высота cabinet_root (2700) — для формул s:y − h_bottom − corpus; corpusY только для корпуса.
    sectionSizeMm: { x: sectionSizeMm.x, y: sectionSizeMm.y, z: sectionSizeMm.z },
    shellCatalogItem,
    findCatalogItem,
    debugTag: opts.debugTag || `unified/nested/${catalogTypeHint || 'tree'}`,
    forPreview: opts.forPreview,
    suppressShellRootFill: opts.suppressShellRootFill === true,
  });
  if (nested !== tree) {
    tree = nested;
    changed = true;
  }

  return changed ? tree : rootsArr;
}

/**
 * Превью админки и комната — единый конвейер (applyUnifiedFillPoliciesInTree).
 */
export function applyFillPoliciesToPreviewTree(tree, ctx = {}) {
  if (!Array.isArray(tree) || !tree.length) return tree;
  const catalogTypeHint =
    ctx.catalogTypeHint ||
    ctx.catalogType ||
    (typeof globalThis !== 'undefined' ? globalThis.catalogItemVueApp?.catalogType : '') ||
    '';
  const vueItem =
    ctx.catalogItem ||
    (typeof globalThis !== 'undefined' ? globalThis.catalogItemVueApp?.item : null);
  const rootCatalogItem = buildPreviewCatalogItem(vueItem, catalogTypeHint);
  if (!rootCatalogItem && !isShellCatalogType(catalogTypeHint)) return tree;

  const applied = applyUnifiedFillPoliciesInTree(tree, {
    ...ctx,
    catalogTypeHint,
    rootCatalogItem,
    forPreview: ctx.forPreview !== false,
    findCatalogItem:
      ctx.findCatalogItem ||
      ((ct, id) => {
        try {
          const key = String(ct || '').startsWith('catalog_') ? String(ct) : `catalog_${ct}`;
          return globalThis.__CLD_CATALOGS_DATA?.[key]?.items?.[String(id)] || null;
        } catch (_) {
          return null;
        }
      }),
  });
  return Array.isArray(applied) && applied.length ? applied : tree;
}

function applyFillToNestedModulesInTemplateTree(templateTree, ctx) {
  if (!Array.isArray(templateTree) || !templateTree.length) {
    return { tree: templateTree, changed: false };
  }
  const applied = applyFillModulePoliciesInTree(templateTree, ctx);
  return { tree: applied, changed: applied !== templateTree };
}

/**
 * @deprecated Не вызывать из комнаты — запись spec.template_tree в clodis roots ломает привязку к секции.
 * Наполнение catalog_27/38 — только ClodisBuilder.buildModule + applyFillPoliciesToCatalogTemplateTree.
 */
export function applyNestedFillCatalogModulesInRoomRoots(roots, opts = {}) {
  const findCatalogItem = opts.findCatalogItem;
  if (typeof findCatalogItem !== 'function') return false;
  const rootsArr = Array.isArray(roots) ? roots : roots ? [roots] : [];
  if (!rootsArr.length) return false;

  const outerY = Math.max(0, num(opts.sectionSizeMm?.y, 0));
  const vars = opts.variables && typeof opts.variables === 'object' ? opts.variables : {};
  const corpusY = resolveCorpusShelfSectionSizeYMm(opts.sectionSizeMm, vars) || outerY;
  const shell = opts.shellCatalogItem ?? null;
  const fillVars = { ...vars, h_bottom: 0, h_top: 0, tech_zone_mm: 0 };
  const sx = num(opts.sectionSizeMm?.x, 600);
  const sz = num(opts.sectionSizeMm?.z, 600);

  let changed = false;

  walkClodisWithSectionContext(
    rootsArr,
    (node, ctx) => {
      if (String(node.type || '').toLowerCase() !== 'module') return;
      const et = String(node.spec?.element_type || '').trim().toLowerCase();
      if (!FILL_CATALOG_TYPES.has(et)) return;
      const catalogId = Number(node.spec?.id);
      if (!Number.isFinite(catalogId) || catalogId <= 0) return;

      const catalogItem = findCatalogItem(et, catalogId);
      if (!catalogItem) return;

      const sy =
        resolveNodeSizeYMm(node, ctx.sectionSizeY) ||
        corpusY ||
        Math.max(0, num(catalogItem.height, 0)) ||
        outerY;
      if (!(sy > 0)) return;

      let template = extractCatalogTemplateTree(catalogItem);
      if (!template.length) return;

      const nestedCtx = {
        findCatalogItem,
        corpusY: sy,
        sx,
        sz,
        fillVars,
        shellCatalogItem: shell,
      };
      const nested = applyFillToNestedModulesInTemplateTree(template, nestedCtx);
      template = nested.tree;
      if (nested.changed) changed = true;

      const applied = applyFillPoliciesToCatalogTemplateTree(template, catalogItem, {
        sectionSizeMm: { x: sx, y: sy, z: sz },
        variables: fillVars,
        shellCatalogItem: shell,
        findCatalogItem,
      });
      if (!Array.isArray(applied) || !applied.length) return;

      node.spec = node.spec && typeof node.spec === 'object' ? { ...node.spec } : {};
      node.spec.template_tree = applied;
      changed = true;
    },
    { sectionSizeY: corpusY || outerY }
  );

  return changed;
}

/** После стека ящиков: верхняя зона (та же высота) до drawer_top_shelf; у крыши полка+штанга. */
export function applyRodZoneLayoutAfterDrawerStack(root, opts = {}) {
  if (!root || !Array.isArray(root.children)) return false;
  const layout = opts.interiorLayout ?? null;
  const interiorHeightMm = Math.max(0, num(opts.interiorHeightMm, 0));
  if (!(interiorHeightMm > 0) || !isRodTopDrawersBottomFiftyFifty(layout)) return false;
  const hBottom = Math.max(0, num(opts.hBottom, 0));
  const thickness = Math.max(8, num(opts.shelfThicknessMm, 16));
  const drawerH = Math.max(40, num(opts.drawerHeightMm, 162));
  const policy = opts.shelfPolicy ?? null;
  const ffCtx = resolveFiftyFiftyZoneContext(layout, interiorHeightMm, hBottom, {
    shelfPolicy: policy,
    shelfThicknessMm: thickness,
    drawerHeightMm: drawerH,
  });
  const geometricSplitAbs = Math.round(num(ffCtx?.splitAbs, interiorHeightMm / 2));
  const drawerTopAbs =
    findDrawerTopShelfAbsInTree(root) ||
    predictDrawerTopShelfAbsY({
      interiorLayout: layout,
      interiorHeightMm,
      hBottom,
      shelfThicknessMm: thickness,
      drawerHeightMm: drawerH,
      policy: opts.drawerPolicy ?? null,
    });
  const slideCtx = resolveRodZoneSlideLayoutContext(
    interiorHeightMm,
    layout,
    hBottom,
    policy,
    thickness,
    drawerTopAbs
  );
  const rodZone = resolveInteriorZoneSpansMm(interiorHeightMm, layout).find(
    (z) => String(z?.content || '').toLowerCase() === 'rod'
  );
  const rodRules = findRodZoneInLayout(layout)?.rodRules ?? {};
  const companionMode = String(rodRules?.companionMode || 'none').trim().toLowerCase();
  const rodNode = root.children.find((c) => isRodModuleNode(c));
  if (!rodZone || !rodNode) return false;
  if (!slideCtx && companionMode === 'none') return false;

  const shelfTemplate =
    opts.shelfTemplate ||
    createDefaultShelfTemplate(thickness) ||
    createDefaultShelfTemplate(16);

  let drawerTopShelfNode = null;
  const keep = root.children.filter((c) => {
    if (!isShelfLikeNodeForLayout(c)) return true;
    const role = String(c.sectionLayoutRole || c.layout_role || '').toLowerCase();
    const y = num(c.pos?.y, 0);
    if (role === 'drawer_top_shelf' && slideCtx) {
      drawerTopShelfNode = c;
      return true;
    }
    if (role === 'zone_divider') return !slideCtx;
    if (role === 'drawer_top_shelf' || role === 'drawer_zone_fill_shelf') {
      return y > 0 && y < (slideCtx?.splitAbs ?? geometricSplitAbs) - 8;
    }
    if (y > geometricSplitAbs + 8) return false;
    return (
      role !== 'rod_top_shelf' &&
      role !== 'rod_zone_fill_shelf' &&
      role !== 'rod_zone_expansion_shelf' &&
      role !== 'rod_zone_ceiling_fill_shelf' &&
      role !== 'rod_interior_shelf'
    );
  });

  let newShelves = [];
  if (slideCtx) {
    newShelves = buildRodZoneSlideCompanionShelves(
      shelfTemplate,
      rodNode,
      rodRules,
      slideCtx,
      rodZone,
      policy,
      thickness,
      hBottom
    );
  } else {
    newShelves = buildRodCompanionShelvesInZone(
      shelfTemplate,
      rodZone,
      policy,
      thickness,
      hBottom,
      rodNode,
      rodRules,
      null,
      true
    );
  }

  if (!newShelves.length && !slideCtx) return false;

  if (slideCtx && drawerTopShelfNode) {
    const divIdx = keep.indexOf(drawerTopShelfNode);
    if (divIdx >= 0) {
      keep[divIdx] = promoteDrawerTopShelfToDivider(drawerTopShelfNode, thickness);
    }
  }

  const rodIdx = keep.findIndex((c) => c === rodNode);
  if (rodIdx >= 0 && newShelves.length) keep.splice(rodIdx + 1, 0, ...newShelves);
  else if (newShelves.length) keep.push(...newShelves);
  root.children = keep;
  return true;
}

/** @deprecated alias */
export function applyRodGridShiftCompanionAfterDrawerStack(root, opts = {}) {
  return applyRodZoneLayoutAfterDrawerStack(root, opts);
}

if (typeof globalThis !== 'undefined') {
  globalThis.__cldNormalizeFiftyFiftySplitShelfNodes = normalizeFiftyFiftySplitShelfNodes;
  globalThis.__cldResolveFiftyFiftyZoneContext = resolveFiftyFiftyZoneContext;
  globalThis.__cldIsFiftyFiftyInteriorLayout = isFiftyFiftyInteriorLayout;
  globalThis.__cldApplyFillPoliciesToCatalogTemplateTree = applyFillPoliciesToCatalogTemplateTree;
  globalThis.__cldApplyUnifiedFillPoliciesInTree = applyUnifiedFillPoliciesInTree;
  globalThis.__cldApplyFillModulePoliciesInTree = applyFillModulePoliciesInTree;
  globalThis.__cldApplyNestedFillPoliciesInPreviewTree = applyNestedFillPoliciesInPreviewTree;
  globalThis.__cldResolveFillShelfSectionSizeYMm = resolveFillShelfSectionSizeYMm;
  globalThis.__cldResolveFillLabSectionSizeMm = resolveFillLabSectionSizeMm;
  globalThis.__cldResolveFillSlotSizeYMm = resolveFillSlotSizeYMm;
  globalThis.__cldResolveModuleSlotSizeYMm = resolveModuleSlotSizeYMm;
  globalThis.__cldResolvePreviewFillVariables = resolvePreviewFillVariables;
  globalThis.__cldNeutralizeNestedShellSlotTree = neutralizeNestedShellSlotTree;
  globalThis.__cldIsShellHostCatalogType = isShellHostCatalogType;
  globalThis.__cldComputeRodGridShiftDownMaxSteps = computeRodGridShiftDownMaxSteps;
  globalThis.__cldComputeRodContentShiftAutoSteps = computeRodContentShiftAutoSteps;
  globalThis.__cldComputeRodZoneExpansionAutoSteps = computeRodZoneExpansionAutoSteps;
  globalThis.__cldApplyRodZoneLayoutAfterDrawerStack = applyRodZoneLayoutAfterDrawerStack;
  globalThis.__cldApplyRodGridShiftCompanionAfterDrawerStack = applyRodGridShiftCompanionAfterDrawerStack;
}
