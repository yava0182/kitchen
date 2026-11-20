/**
 * Единая вкладка «Наполнение» в catalog-item-edit.
 * Видимость: is_fill, тип каталога «Наполнение…», fill_section / наполняемая секция в дереве.
 */
(function () {
  'use strict';

  const EMPTY_PRESENCE = Object.freeze({
    drawer: false,
    shelf: false,
    rod: false,
    fillSection: false,
    any: false,
  });

  const FILL_CATALOG_KEYS = new Set(['catalog_38', 'catalog_39', '38', '39']);

  function readConstructorTree() {
    if (typeof window.getConstructorTreeJSON === 'function') {
      try {
        return window.getConstructorTreeJSON() || [];
      } catch (_) {
        return [];
      }
    }
    const root = document.getElementById('constructor-root-module');
    const raw = root?.nodeData?.clodisJSON;
    return Array.isArray(raw) ? raw : [];
  }

  function resolveCatalogType(vueItem) {
    return String(
      vueItem?.catalog_type ||
        window.catalogItemVueApp?.catalogType ||
        document.getElementById('controller_name')?.value ||
        ''
    ).trim();
  }

  function resolveCatalogName(vueItem) {
    return String(
      vueItem?.catalog_name ||
        window.catalogItemVueApp?.catalogName ||
        ''
    ).trim();
  }

  function isFillCatalogType(catalogType, catalogName) {
    const ct = String(catalogType || '').trim();
    if (FILL_CATALOG_KEYS.has(ct)) return true;
    const nm = String(catalogName || '').toLowerCase();
    if (nm.includes('наполнен')) return true;
    return false;
  }

  function isFillCatalogItem(vueItem) {
    const v = vueItem?.is_fill;
    if (v === '1' || v === 1 || v === true) return true;
    return isFillCatalogType(resolveCatalogType(vueItem), resolveCatalogName(vueItem));
  }

  function mergePresence(a, b) {
    return {
      drawer: !!(a.drawer || b.drawer),
      shelf: !!(a.shelf || b.shelf),
      rod: !!(a.rod || b.rod),
      fillSection: !!(a.fillSection || b.fillSection),
      any: !!(a.any || b.any),
    };
  }

  function scanDomInteriorFillPresence() {
    const out = { ...EMPTY_PRESENCE };
    try {
      document.querySelectorAll('.constructor-tree-node').forEach((el) => {
        const nd = el.nodeData || {};
        const ot = String(nd.originalType || el.getAttribute('data-original-type') || '').toLowerCase();
        const nodeType = String(el.getAttribute('data-node-type') || '').toLowerCase();
        if (ot === 'fillable_section' || nodeType === 'fill_section') {
          out.fillSection = true;
          out.any = true;
        }
      });
    } catch (_) {}
    return out;
  }

  /**
   * @param {any[]} tree
   * @returns {{ drawer: boolean, shelf: boolean, rod: boolean, fillSection: boolean, any: boolean }}
   */
  function scanInteriorFillPresence(tree) {
    const out = { ...EMPTY_PRESENCE };
    const stack = [...(Array.isArray(tree) ? tree : tree && typeof tree === 'object' ? [tree] : [])];
    while (stack.length) {
      const n = stack.pop();
      if (!n || typeof n !== 'object') continue;
      if (Array.isArray(n.children)) stack.push(...n.children);

      const type = String(n.type || '').toLowerCase();
      const orig = String(n.originalType || '').toLowerCase();
      const et = String(n.spec?.element_type || '').trim().toLowerCase();
      const role = String(n.layout_role ?? n.sectionLayoutRole ?? '').trim().toLowerCase();
      const id = String(n.spec?.id ?? '').trim();
      const name = String(n.name || n.spec?.key || '').toLowerCase();

      if (
        type === 'fill_section' ||
        orig === 'fillable_section' ||
        (type === 'section' && String(n.section_key || '').trim())
      ) {
        out.fillSection = true;
      }

      if (type === 'module' && (et === 'catalog_33' || role === 'drawer')) {
        out.drawer = true;
      }

      if (
        type === 'module' &&
        et === 'catalog_29' &&
        (role === 'shelf' || /полк|shelf/i.test(name))
      ) {
        out.shelf = true;
      }

      if (
        (type === 'module' || type === 'model') &&
        (et === 'catalog_22' || id === '22' || /штанг|rod|shtang/i.test(name))
      ) {
        out.rod = true;
      }
    }
    out.any = out.drawer || out.shelf || out.rod || out.fillSection;
    return out;
  }

  function resolvePresence(vueItem) {
    const fromTree = scanInteriorFillPresence(readConstructorTree());
    const fromDom = scanDomInteriorFillPresence();
    return mergePresence(fromTree, fromDom);
  }

  function shouldShowInteriorFillTab(vueItem) {
    if (isFillCatalogItem(vueItem)) return true;
    return resolvePresence(vueItem).any;
  }

  function shouldShowDrawersSection(vueItem, presence) {
    const zones = vueItem?.interiorLayout?.zones;
    if (
      Array.isArray(zones) &&
      zones.some((z) => String(z?.content || '').trim().toLowerCase() === 'drawers')
    ) {
      return true;
    }
    if (vueItem?.interiorTemplates?.drawer?.catalogId) return true;
    const p = presence || resolvePresence(vueItem);
    return !!p.drawer;
  }

  function shouldShowShelvesSection(vueItem, presence) {
    const zones = vueItem?.interiorLayout?.zones;
    if (Array.isArray(zones) && zones.some((z) => String(z?.content || '').toLowerCase() === 'shelves')) {
      return true;
    }
    const p = presence || resolvePresence(vueItem);
    if (p.shelf) return true;
    if (isFillCatalogItem(vueItem) && !p.drawer && !p.rod) return true;
    if (p.fillSection && !p.drawer && !p.rod) return true;
    return false;
  }

  function shouldShowRodSection(vueItem, presence) {
    const zones = vueItem?.interiorLayout?.zones;
    if (Array.isArray(zones) && zones.some((z) => String(z?.content || '').toLowerCase() === 'rod')) {
      return true;
    }
    return !!(presence || resolvePresence(vueItem)).rod;
  }

  function shouldPersistDrawerStack(vueItem, presence) {
    return shouldShowDrawersSection(vueItem, presence);
  }

  function shouldPersistShelfStack(vueItem, presence) {
    return shouldShowShelvesSection(vueItem, presence);
  }

  function applyFillCatalogItemDefaults(vueItem, catalogType, catalogName) {
    if (!vueItem || typeof vueItem !== 'object') return;
    if (!isFillCatalogType(catalogType || resolveCatalogType(vueItem), catalogName || resolveCatalogName(vueItem))) {
      return;
    }
    if (vueItem.is_fill !== '1' && vueItem.is_fill !== 1) {
      vueItem.is_fill = '1';
    }
    scheduleInteriorFillRefresh();
  }

  function updateInteriorFillTabVisibility() {
    const tabBtn = document.getElementById('catalog-item-edit-tab-interior-fill');
    if (!tabBtn) return;
    const vue = window.catalogItemVueApp;
    const show = vue && shouldShowInteriorFillTab(vue.item);
    tabBtn.style.display = show ? '' : 'none';
    if (!show && tabBtn.classList.contains('active')) {
      const basic = document.querySelector('#catalog-item-edit .tab_menu_h li[data-tab="basic"]');
      if (basic) basic.click();
    }
  }

  function refreshInteriorFillPresence(vm) {
    if (!vm) vm = window.catalogItemVueApp;
    if (!vm) return EMPTY_PRESENCE;
    const presence = resolvePresence(vm.item);
    if (typeof vm.$set === 'function') {
      vm.$set(vm, 'interiorFillPresence', { ...presence });
    } else {
      vm.interiorFillPresence = { ...presence };
    }
    updateInteriorFillTabVisibility();
    return presence;
  }

  let refreshTimer = null;
  function scheduleInteriorFillRefresh() {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      refreshInteriorFillPresence(window.catalogItemVueApp);
    }, 80);
  }

  function hookConstructorTreeRefresh() {
    if (window.__cldInteriorFillTreeHooked) return;
    window.__cldInteriorFillTreeHooked = true;
    const orig = window.__ppPostModuleToIframe;
    if (typeof orig === 'function') {
      window.__ppPostModuleToIframe = function (...args) {
        const r = orig.apply(this, args);
        scheduleInteriorFillRefresh();
        return r;
      };
    }
  }

  function mergeInteriorFillIntoDataPayload(dataToSave, vueItem) {
    if (!dataToSave || !vueItem) return dataToSave;
    if (typeof window.__cldCatalogInteriorLayout?.mergeInteriorLayoutIntoDataPayload === 'function') {
      window.__cldCatalogInteriorLayout.mergeInteriorLayoutIntoDataPayload(dataToSave, vueItem);
    }
    if (typeof window.__cldCatalogInteriorTemplates?.mergeInteriorTemplatesIntoDataPayload === 'function') {
      window.__cldCatalogInteriorTemplates.mergeInteriorTemplatesIntoDataPayload(dataToSave, vueItem);
    }
    const presence = resolvePresence(vueItem);
    if (
      shouldPersistDrawerStack(vueItem, presence) &&
      typeof window.__cldCatalogDrawerStack?.mergeDrawerStackIntoDataPayload === 'function'
    ) {
      window.__cldCatalogDrawerStack.mergeDrawerStackIntoDataPayload(
        dataToSave,
        vueItem,
        null,
        { force: true }
      );
    }
    if (
      shouldPersistShelfStack(vueItem, presence) &&
      typeof window.__cldCatalogShelfStack?.mergeShelfStackIntoDataPayload === 'function'
    ) {
      window.__cldCatalogShelfStack.mergeShelfStackIntoDataPayload(
        dataToSave,
        vueItem,
        null,
        { force: true }
      );
    }
    return dataToSave;
  }

  function applyInteriorFillPoliciesToVueItem(vueItem, apiData) {
    if (!vueItem || typeof vueItem !== 'object') return;
    if (typeof window.__cldCatalogInteriorLayout?.applyInteriorLayoutToVueItem === 'function') {
      window.__cldCatalogInteriorLayout.applyInteriorLayoutToVueItem(vueItem, apiData);
    }
    if (typeof window.__cldCatalogInteriorTemplates?.applyInteriorTemplatesToVueItem === 'function') {
      window.__cldCatalogInteriorTemplates.applyInteriorTemplatesToVueItem(vueItem, apiData);
    }
    if (typeof window.__cldCatalogInteriorTemplates?.prefetchAssignedTemplateCatalogs === 'function') {
      window.__cldCatalogInteriorTemplates.prefetchAssignedTemplateCatalogs(vueItem);
    }
    if (typeof window.__cldCatalogDrawerStack?.applyDrawerStackToVueItem === 'function') {
      window.__cldCatalogDrawerStack.applyDrawerStackToVueItem(vueItem, apiData, null);
    }
    if (typeof window.__cldCatalogShelfStack?.applyShelfStackToVueItem === 'function') {
      window.__cldCatalogShelfStack.applyShelfStackToVueItem(vueItem, apiData, null);
    }
    if (typeof window.__cldCatalogKitchenSupports?.applyKitchenSupportsToVueItem === 'function') {
      window.__cldCatalogKitchenSupports.applyKitchenSupportsToVueItem(vueItem, apiData);
    }
    // Фаза A: навес/тумба — h_bottom и стеки по типу (после загрузки с диска).
    if (typeof window.__cldCatalogModuleProfile?.applyModuleProfileToVueItem === 'function') {
      window.__cldCatalogModuleProfile.applyModuleProfileToVueItem(vueItem, {
        mode: 'full',
        reason: 'open',
      });
    }
  }

  function bindInteriorFillPreviewWatch(vm) {
    if (!vm || vm.__cldInteriorFillPreviewWatch) return;
    vm.__cldInteriorFillPreviewWatch = true;
    vm.$watch(
      () => [
        vm.item && vm.item.drawerStack,
        vm.item && vm.item.shelfStack,
        vm.item && vm.item.interiorLayout,
        vm.item && vm.item.interiorTemplates,
      ],
      () => {
        try {
          const ctorActive = !!document.querySelector(
            '#catalog-item-edit .tab_menu_h li[data-tab="constructor"].active'
          );
          if (!ctorActive || !window.__ppPreviewIframe) return;
        } catch (_) {
          return;
        }
        if (typeof window.__ppPostModuleToIframe === 'function') {
          window.__ppPostModuleToIframe(true);
        }
      },
      { deep: true }
    );
    vm.$watch(
      () => vm.item && vm.item.is_fill,
      () => scheduleInteriorFillRefresh()
    );
    vm.$watch(
      () => vm.catalogType,
      () => scheduleInteriorFillRefresh()
    );
  }

  function getVueInteriorFillOptions() {
    return {
      computed: {
        showInteriorFillTab() {
          return shouldShowInteriorFillTab(this.item);
        },
        showInteriorDrawersSection() {
          return shouldShowDrawersSection(this.item, this.interiorFillPresence);
        },
        showInteriorShelvesSection() {
          return shouldShowShelvesSection(this.item, this.interiorFillPresence);
        },
        showInteriorRodSection() {
          return shouldShowRodSection(this.item, this.interiorFillPresence);
        },
        showInteriorFillEmptyHint() {
          if (this.showInteriorTemplatesSection) return false;
          return (
            this.showInteriorFillTab &&
            !this.showInteriorDrawersSection &&
            !this.showInteriorShelvesSection &&
            !this.showInteriorRodSection
          );
        },
      },
      methods: {
        refreshInteriorFillFromConstructor() {
          refreshInteriorFillPresence(this);
        },
      },
    };
  }

  hookConstructorTreeRefresh();

  window.__cldCatalogInteriorFill = {
    EMPTY_PRESENCE,
    FILL_CATALOG_KEYS,
    readConstructorTree,
    scanInteriorFillPresence,
    scanDomInteriorFillPresence,
    isFillCatalogType,
    isFillCatalogItem,
    applyFillCatalogItemDefaults,
    shouldShowInteriorFillTab,
    shouldShowDrawersSection,
    shouldShowShelvesSection,
    shouldShowRodSection,
    shouldPersistDrawerStack,
    shouldPersistShelfStack,
    refreshInteriorFillPresence,
    scheduleInteriorFillRefresh,
    updateInteriorFillTabVisibility,
    mergeInteriorFillIntoDataPayload,
    applyInteriorFillPoliciesToVueItem,
    getVueInteriorFillOptions,
    bindInteriorFillPreviewWatch,
  };
  window.__cldUpdateInteriorFillTabVisibility = updateInteriorFillTabVisibility;
  window.__cldBindInteriorFillPreviewWatch = bindInteriorFillPreviewWatch;
  window.__cldRefreshInteriorFillFromConstructor = scheduleInteriorFillRefresh;
})();
