/**
 * Превью каталога: тот же авто-стек ящиков, что в комнате (furniture-drawer-stack.js).
 */
import {
  applyDrawerStackPolicyToRoots,
  stampDrawerNoHandleFlagsInTree,
} from '../furniture/furniture-drawer-stack.js?v=20260921-phase-a';

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function readPreviewModuleVars() {
  const root = document.getElementById('constructor-root-module');
  const out = {};
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
        if (!key || key === '_wt' || Object.prototype.hasOwnProperty.call(out, key)) continue;
        const cur = Number(v.value);
        const def = Number(v.default);
        const n = Number.isFinite(cur) ? cur : (Number.isFinite(def) ? def : NaN);
        if (Number.isFinite(n)) out[key] = n;
      }
    }
  }
  if (!Number.isFinite(Number(out.h_bottom))) {
    let pk = '';
    try {
      pk = String(window.catalogItemVueApp?.item?.placementKind || '').trim();
    } catch (_) {}
    out.h_bottom =
      pk === 'wall_hung' || pk === 'wall_hung_low' || pk === 'wall_hung_high' ? 0 : 100;
  }
  if (!Number.isFinite(Number(out.h_top))) out.h_top = 0;
  if (!Number.isFinite(Number(out.tech_zone_mm))) out.tech_zone_mm = 0;

  let wt = 16;
  try {
    const payload =
      typeof window.__cldBuildMaterialsPayload === 'function'
        ? window.__cldBuildMaterialsPayload()
        : null;
    wt = num(payload?.vars?._wt, 16) || 16;
  } catch (_) {}
  out._wt = wt;
  return out;
}

function resolvePreviewDrawerStackPolicy() {
  const fromVue = window.catalogItemVueApp?.item?.drawerStack;
  if (fromVue && typeof fromVue === 'object') {
    if (typeof window.__cldCatalogDrawerStack?.normalizeDrawerStackPolicy === 'function') {
      return window.__cldCatalogDrawerStack.normalizeDrawerStackPolicy(fromVue);
    }
    return fromVue;
  }
  return null;
}

/**
 * @param {any[]} tree
 * @param {{ sectionSizeMm?: {x?:number,y?:number,z?:number}, placementKind?: string, variables?: object }} ctx
 * @returns {any[]}
 */
export function applyDrawerStackToPreviewTree(tree, ctx = {}) {
  if (!Array.isArray(tree) || !tree.length) return tree;
  const placementKind = String(ctx.placementKind || '').trim();
  // Как в комнате (furniture-drawer-stack): тумба + навес.
  const shouldPreviewStack =
    placementKind === 'standalone_floor' ||
    placementKind === 'wall_hung' ||
    placementKind === 'wall_hung_low' ||
    placementKind === 'wall_hung_high';
  if (!shouldPreviewStack) return tree;

  const policy = resolvePreviewDrawerStackPolicy();
  if (!policy || policy.enabled === false) return tree;

  const sy = num(ctx.sectionSizeMm?.y, 0);
  if (!(sy > 0)) return tree;

  const vars =
    ctx.variables && typeof ctx.variables === 'object'
      ? { ...ctx.variables }
      : readPreviewModuleVars();

  // Vue-карточка приоритетнее DOM: после фазы A h_bottom уже 0, а в дереве с диска ещё 100.
  try {
    const cv = window.catalogItemVueApp?.item?.clodisVariables;
    if (cv && typeof cv === 'object') {
      if (Number.isFinite(Number(cv.h_bottom))) vars.h_bottom = Number(cv.h_bottom);
      if (Number.isFinite(Number(cv.h_top))) vars.h_top = Number(cv.h_top);
      if (Number.isFinite(Number(cv.tech_zone_mm))) vars.tech_zone_mm = Number(cv.tech_zone_mm);
    }
  } catch (_) {}

  try {
    const cloned = JSON.parse(JSON.stringify(tree));
    const changed = applyDrawerStackPolicyToRoots(cloned, {
      policy,
      sectionSizeMm: {
        x: num(ctx.sectionSizeMm?.x, 600),
        y: sy,
        z: num(ctx.sectionSizeMm?.z, 600),
      },
      variables: vars,
      placementKind,
      forPreview: true,
    });
    if (changed && (window.__CLD_DEBUG === true || window.__CLD_PREVIEW_DRAWER_STACK_LOG)) {
      console.info('[CLD][preview-drawer-stack] applied', { count: policy.maxCount, sy, vars });
    }
    stampDrawerNoHandleFlagsInTree(cloned);
    return changed ? cloned : tree;
  } catch (e) {
    console.warn('[CLD][preview-drawer-stack] apply failed', e);
    return tree;
  }
}

window.__cldDrawerStack = { applyDrawerStackPolicyToRoots };
window.__cldApplyDrawerStackToPreviewTree = applyDrawerStackToPreviewTree;
