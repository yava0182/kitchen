/**
 * Полка в дереве + interiorLayout 50/50:
 * — в DOM один шаблон «Полка»;
 * — в превью разделитель по середине + остальные по shelfStack в каждой половине.
 */
(function () {
  'use strict';

  function readInteriorLayout() {
    const raw = window.catalogItemVueApp?.item?.interiorLayout;
    if (typeof window.__cldCatalogInteriorLayout?.normalizeInteriorLayout === 'function') {
      return window.__cldCatalogInteriorLayout.normalizeInteriorLayout(raw);
    }
    return raw && typeof raw === 'object' ? raw : null;
  }

  function isFiftyFiftyLayout(layout) {
    if (typeof globalThis.__cldIsFiftyFiftyInteriorLayout === 'function') {
      return globalThis.__cldIsFiftyFiftyInteriorLayout(layout);
    }
    const L = layout || readInteriorLayout();
    if (!L || !Array.isArray(L.zones) || L.zones.length !== 2) return false;
    const p0 = Number(L.zones[0]?.heightPercent) || 0;
    const p1 = Number(L.zones[1]?.heightPercent) || 0;
    const sum = p0 + p1 || 100;
    return Math.abs(p0 - p1) <= 1 && Math.abs(sum - 100) <= 1;
  }

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
    if (et === 'catalog_29') {
      const name = String(nd.name || '').toLowerCase();
      return /полк|shelf/i.test(name) && !/ящик|планк/i.test(name);
    }
    const name = String(nd.name || '').toLowerCase();
    const ot = String(nd.originalType || el.getAttribute('data-original-type') || '').toLowerCase();
    const nt = String(el.getAttribute('data-node-type') || '').toLowerCase();
    return (nt === 'module' || ot === 'module') && /полк|shelf/i.test(name);
  }

  function normalizeShelfTemplateNode(nodeEl) {
    if (!nodeEl || !isShelfDomNode(nodeEl)) return;
    const nd = nodeEl.nodeData || {};
    nodeEl.nodeData = nd;
    nd.size = { x: 's:x-32', y: 16, z: 's:z' };
    nd.position = nd.position || { x: 16, y: 0, z: 0 };
    if (nd.position.x === undefined || nd.position.x === null || String(nd.position.x).trim() === 's:x') {
      nd.position.x = 16;
    }
    const role = String(nd.sectionLayoutRole || '').trim().toLowerCase();
    if (!role || role === 'zone_divider') {
      nd.sectionLayoutRole = 'shelf';
    }
    if (nd.spec && typeof nd.spec === 'object') {
      delete nd.spec.template_tree;
      delete nd.spec.templates;
    }
  }

  function syncPreview(force) {
    if (typeof window.__ppPostModuleToIframe === 'function') {
      window.__ppPostModuleToIframe(force === true);
    }
  }

  /** После добавления catalog_29 в дерево конструктора. */
  function onShelfModuleAddedToTree(nodeEl) {
    if (!nodeEl) return;
    normalizeShelfTemplateNode(nodeEl);
    try {
      if (typeof window.__cldCollapseShelfTemplatesInConstructorDom === 'function') {
        window.__cldCollapseShelfTemplatesInConstructorDom();
      }
    } catch (_) {}
    if (typeof window.__cldCatalogInteriorFill?.scheduleInteriorFillRefresh === 'function') {
      window.__cldCatalogInteriorFill.scheduleInteriorFillRefresh();
    }
    syncPreview(true);
  }

  /** После выбора пресета 50/50 или смены зон — пересчитать превью. */
  function onInteriorLayoutChanged() {
    try {
      if (typeof window.__cldCollapseShelfTemplatesInConstructorDom === 'function') {
        window.__cldCollapseShelfTemplatesInConstructorDom();
      }
    } catch (_) {}
    syncPreview(true);
  }

  window.__cldOnShelfModuleAddedToTree = onShelfModuleAddedToTree;
  window.__cldOnInteriorLayoutChangedForShelves = onInteriorLayoutChanged;
  window.__cldIsFiftyFiftyInteriorLayoutAdmin = isFiftyFiftyLayout;
})();
