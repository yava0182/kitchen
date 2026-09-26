/**
 * Превью админки: единый конвейер наполнения (корень + все вложенные catalog_38/37).
 */
import {
  applyUnifiedFillPoliciesInTree,
  buildPreviewCatalogItem,
  shouldRunFillPolicyPipeline,
} from '../furniture/furniture-interior-layout.js?v=20260907-shelf-props';
import { stampDrawerNoHandleFlagsInTree } from '../furniture/furniture-drawer-stack.js?v=20260907-shelf-props';

function collapseExtraShelfDomNodes() {
  try {
    const policy = window.catalogItemVueApp?.item?.shelfStack;
    if (
      policy &&
      policy.enabled !== false &&
      typeof window.__cldCollapseShelfTemplatesInConstructorDom === 'function'
    ) {
      window.__cldCollapseShelfTemplatesInConstructorDom();
    }
  } catch (_) {}
}

function isShellTemplateCatalogType(catalogTypeHint) {
  try {
    if (typeof window.__cldIsShellHostCatalogType === 'function') {
      return window.__cldIsShellHostCatalogType(catalogTypeHint);
    }
  } catch (_) {}
  const k = String(catalogTypeHint || '')
    .trim()
    .toLowerCase()
    .replace(/^catalog_/, '');
  return k === '26' || k === '27' || k === '30' || k === '35' || k === '36' || k === '37';
}

function isFillCatalogItem(item) {
  try {
    if (!item) return false;
    if (typeof window.__cldCatalogInteriorFill?.isFillCatalogItem === 'function') {
      return window.__cldCatalogInteriorFill.isFillCatalogItem(item);
    }
    const v = item.is_fill;
    return v === 1 || v === '1' || v === true;
  } catch (_) {
    return false;
  }
}

function shouldRunPreviewFillPipeline(catalogTypeHint, item, tree) {
  try {
    return shouldRunFillPolicyPipeline(catalogTypeHint, item, tree);
  } catch (_) {
    return isShellTemplateCatalogType(catalogTypeHint) || isFillCatalogItem(item);
  }
}

function defaultFindCatalogItem(ct, id) {
  try {
    const key = String(ct || '').startsWith('catalog_') ? String(ct) : `catalog_${ct}`;
    return window.__CLD_CATALOGS_DATA?.[key]?.items?.[String(id)] || null;
  } catch (_) {
    return null;
  }
}

export function applyInteriorFillToPreviewTree(tree, ctx = {}) {
  if (!Array.isArray(tree) || !tree.length) return tree;

  const catalogTypeHint =
    ctx.catalogTypeHint ||
    ctx.catalogType ||
    window.catalogItemVueApp?.catalogType ||
    document.getElementById('controller_name')?.value ||
    '';
  const vueItem = window.catalogItemVueApp?.item || null;

  if (!shouldRunPreviewFillPipeline(catalogTypeHint, vueItem, tree)) return tree;

  if (isFillCatalogItem(vueItem)) collapseExtraShelfDomNodes();

  let result = tree;
  try {
    result =
      applyUnifiedFillPoliciesInTree(tree, {
        ...ctx,
        catalogTypeHint,
        previewTree: tree,
        sectionSizeMm: ctx.sectionSizeMm,
        rootCatalogItem: buildPreviewCatalogItem(vueItem, catalogTypeHint),
        forPreview: true,
        findCatalogItem: ctx.findCatalogItem || defaultFindCatalogItem,
      }) || tree;
  } catch (e) {
    console.warn('[CLD][preview-interior-fill] unified apply failed', e);
    return tree;
  }

  // Ящики уже в applyUnifiedFillPoliciesInTree (h_bottom=0 в fill-модуле, как в шкафу/комнате).
  // Повторный apply с h_bottom из карточки давал укладку снизу вверх и зазор >> 26 мм под полкой.

  try {
    stampDrawerNoHandleFlagsInTree(result);
  } catch (_) {}

  try {
    if (typeof window.__ppNormalizeFlatCatalogShelfModulesForPreview === 'function') {
      result = window.__ppNormalizeFlatCatalogShelfModulesForPreview(result) || result;
    }
  } catch (_) {}

  return result;
}

window.__cldApplyInteriorFillToPreviewTree = applyInteriorFillToPreviewTree;
