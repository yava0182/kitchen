/**
 * @deprecated Используйте applyFillPoliciesToPreviewTree через admin-clodis-preview-interior-fill.js.
 * Оставлен для совместимости — делегирует в единую функцию с комнатой.
 */
import { applyFillPoliciesToPreviewTree } from '../furniture/furniture-interior-layout.js?v=20260907-shelf-props';

export function applyShelfStackToPreviewTree(tree, ctx = {}) {
  if (!Array.isArray(tree) || !tree.length) return tree;
  const catalogTypeHint =
    ctx.catalogTypeHint ||
    ctx.catalogType ||
    window.catalogItemVueApp?.catalogType ||
    '';
  try {
    return (
      applyFillPoliciesToPreviewTree(tree, {
        ...ctx,
        catalogTypeHint,
        forPreview: true,
      }) || tree
    );
  } catch (e) {
    console.warn('[CLD][preview-shelf-stack] unified apply failed', e);
    return tree;
  }
}

window.__cldApplyShelfStackToPreviewTree = applyShelfStackToPreviewTree;
