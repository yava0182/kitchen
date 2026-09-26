/**
 * Конструктор: лишние узлы «Полка» убираем — в дереве остаётся один шаблон, экземпляры только в превью.
 */
(function () {
  'use strict';

  function isShelfDomNode(el) {
    if (!el?.classList?.contains('constructor-tree-node')) return false;
    const nd = el.nodeData || {};
    if (typeof window.__cldIsFlatCatalogShelfModule === 'function') {
      return window.__cldIsFlatCatalogShelfModule({
        type: 'module',
        name: nd.name,
        spec: nd.spec,
        sectionLayoutRole: nd.sectionLayoutRole,
      });
    }
    const et = String(nd.spec?.element_type || '').trim().toLowerCase();
    const ot = String(nd.originalType || el.getAttribute('data-original-type') || '').toLowerCase();
    const nt = String(el.getAttribute('data-node-type') || '').toLowerCase();
    if (et === 'catalog_29') return /полк|shelf/i.test(String(nd.name || '')) && !/ящик|планк/i.test(String(nd.name || ''));
    if ((nt === 'module' || ot === 'module' || ot === 'element') && /полк|shelf/i.test(String(nd.name || ''))) {
      return true;
    }
    return false;
  }

  function isSectionDomNode(el) {
    if (!el?.classList?.contains('constructor-tree-node')) return false;
    const ot = String(el.nodeData?.originalType || el.getAttribute('data-original-type') || '').toLowerCase();
    const nt = String(el.getAttribute('data-node-type') || '').toLowerCase();
    return nt === 'section' || nt === 'fill_section' || ot === 'fillable_section';
  }

  function collapseShelfTemplatesInConstructorDom() {
    const policy = window.catalogItemVueApp?.item?.shelfStack;
    const stackOn = policy && policy.enabled !== false;
    if (!stackOn) return 0;

    let removed = 0;
    const sections = document.querySelectorAll('.constructor-tree-node');
    sections.forEach((sectionEl) => {
      if (!isSectionDomNode(sectionEl)) return;
      const ch = sectionEl.querySelector(':scope > .tree-node-children');
      if (!ch) return;
      const shelfNodes = Array.from(ch.children)
        .filter((c) => c.classList?.contains('constructor-tree-node'))
        .filter(isShelfDomNode);
      if (shelfNodes.length <= 1) return;
      for (let i = 1; i < shelfNodes.length; i += 1) {
        try {
          shelfNodes[i].remove();
          removed += 1;
        } catch (_) {}
      }
    });
    if (removed > 0 && typeof window.__cldCatalogInteriorFill?.scheduleInteriorFillRefresh === 'function') {
      window.__cldCatalogInteriorFill.scheduleInteriorFillRefresh();
    }
    return removed;
  }

  window.__cldCollapseShelfTemplatesInConstructorDom = collapseShelfTemplatesInConstructorDom;
})();
