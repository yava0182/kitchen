/**
 * Карточка каталога: «Цельная дверь (корпус + антресоль)» → data.unifiedFacade.
 */
(function () {
  'use strict';

  const NICHE_PLACEMENT_KINDS = new Set(['floor_in_niche', 'corpus_only', '']);

  function parseTruthy(raw) {
    if (raw === true || raw === 1 || raw === '1') return true;
    const s = String(raw == null ? '' : raw).trim().toLowerCase();
    return s === 'true' || s === 'yes' || s === 'on';
  }

  function collectFacadeRolesFromNodes(nodes) {
    const roles = new Set();
    const walk = (arr) => {
      if (!Array.isArray(arr)) return;
      for (const n of arr) {
        if (!n || typeof n !== 'object') continue;
        const r = String(n.layout_role ?? n.sectionLayoutRole ?? '').trim();
        if (r === 'facades_main' || r === 'facades_top') roles.add(r);
        if (Array.isArray(n.children)) walk(n.children);
      }
    };
    walk(nodes);
    return roles;
  }

  function hasSplitFacadeRolesInRoots(roots) {
    if (!Array.isArray(roots) || !roots.length) return false;
    const roles = collectFacadeRolesFromNodes(roots);
    return roles.has('facades_main') && roles.has('facades_top');
  }

  function extractClodisRootsFromCatalogPayload(apiData) {
    if (!apiData || typeof apiData !== 'object') return null;
    if (Array.isArray(apiData.clodisJSON) && apiData.clodisJSON.length) {
      return apiData.clodisJSON;
    }
    const cs = apiData.constructor_structure;
    if (cs && typeof cs === 'object') {
      if (Array.isArray(cs.template?.structure) && cs.template.structure.length) {
        return cs.template.structure;
      }
      if (Array.isArray(cs.spec?.template?.tree) && cs.spec.template.tree.length) {
        return cs.spec.template.tree;
      }
      if (Array.isArray(cs.children) && cs.children.length) return cs.children;
      if (Array.isArray(cs)) return cs;
    }
    return null;
  }

  function getConstructorStructureRoots() {
    const rootModule = document.getElementById('constructor-root-module');
    const fromNodeData = rootModule?.nodeData?.clodisJSON;
    if (Array.isArray(fromNodeData) && fromNodeData.length) return fromNodeData;

    if (typeof window.getConstructorTreeJSON === 'function') {
      try {
        const cs = window.getConstructorTreeJSON();
        if (cs && typeof cs === 'object') {
          if (Array.isArray(cs.template?.structure) && cs.template.structure.length) {
            return cs.template.structure;
          }
          if (Array.isArray(cs.spec?.template?.tree) && cs.spec.template.tree.length) {
            return cs.spec.template.tree;
          }
          if (Array.isArray(cs.children) && cs.children.length) return cs.children;
        }
      } catch (_) {}
    }

    const cached = window.__cldCatalogItemClodisRoots;
    if (Array.isArray(cached) && cached.length) return cached;
    return null;
  }

  function catalogItemHasSplitFacades(vueItem) {
    if (vueItem?.hasSplitFacadeLayout === true) return true;
    const roots = getConstructorStructureRoots();
    return hasSplitFacadeRolesInRoots(roots);
  }

  function shouldShowUnifiedFacadeOption(vueItem) {
    const pk = String(vueItem?.placementKind || '').trim();
    if (pk === 'standalone_floor') return false;
    if (pk && !NICHE_PLACEMENT_KINDS.has(pk) && pk !== 'floor_in_niche') {
      return false;
    }
    return catalogItemHasSplitFacades(vueItem);
  }

  function publishCatalogClodisRoots(roots) {
    if (!Array.isArray(roots) || !roots.length) return;
    window.__cldCatalogItemClodisRoots = roots;
    const vm = window.catalogItemVueApp;
    if (!vm || !vm.item) return;
    const hasSplit = hasSplitFacadeRolesInRoots(roots);
    if (vm.item.hasSplitFacadeLayout !== hasSplit) {
      vm.$set(vm.item, 'hasSplitFacadeLayout', hasSplit);
    }
  }

  function detectSplitFacadeLayoutFromApiData(apiData) {
    const roots = extractClodisRootsFromCatalogPayload(apiData);
    if (roots) publishCatalogClodisRoots(roots);
    return hasSplitFacadeRolesInRoots(roots);
  }

  function readUnifiedFacadeFromApiData(apiData) {
    if (!apiData || typeof apiData !== 'object') return false;
    return parseTruthy(apiData.unifiedFacade);
  }

  function applyUnifiedFacadeToVueItem(vueItem, apiData, vm) {
    if (!vueItem || typeof vueItem !== 'object') return;
    const vmRef = vm || window.catalogItemVueApp;
    const hasSplit = detectSplitFacadeLayoutFromApiData(apiData);
    const unified = readUnifiedFacadeFromApiData(apiData);
    if (vmRef && typeof vmRef.$set === 'function') {
      vmRef.$set(vueItem, 'hasSplitFacadeLayout', hasSplit);
      vmRef.$set(vueItem, 'unifiedFacade', unified);
      return;
    }
    vueItem.hasSplitFacadeLayout = hasSplit;
    vueItem.unifiedFacade = unified;
  }

  function mergeUnifiedFacadeIntoDataPayload(dataToSave, vueItem) {
    if (!dataToSave || !vueItem) return dataToSave;
    if (!shouldShowUnifiedFacadeOption(vueItem)) {
      return dataToSave;
    }
    if (vueItem.unifiedFacade === true) {
      dataToSave.unifiedFacade = true;
    } else if (dataToSave.unifiedFacade != null) {
      delete dataToSave.unifiedFacade;
    }
    return dataToSave;
  }

  function getVueUnifiedFacadeOptions() {
    return {
      computed: {
        showUnifiedFacadeOption() {
          return shouldShowUnifiedFacadeOption(this.item);
        },
      },
      methods: {
        applyUnifiedFacadeFromLoadedData(flag) {
          this.$set(this.item, 'unifiedFacade', !!flag);
        },
        refreshUnifiedFacadeOptionFromTree() {
          const roots = getConstructorStructureRoots();
          if (roots) publishCatalogClodisRoots(roots);
        },
      },
    };
  }

  window.__cldCatalogUnifiedFacade = {
    parseTruthy,
    hasSplitFacadeRolesInRoots,
    extractClodisRootsFromCatalogPayload,
    catalogItemHasSplitFacades,
    shouldShowUnifiedFacadeOption,
    publishCatalogClodisRoots,
    detectSplitFacadeLayoutFromApiData,
    readUnifiedFacadeFromApiData,
    applyUnifiedFacadeToVueItem,
    mergeUnifiedFacadeIntoDataPayload,
    getVueUnifiedFacadeOptions,
  };
})();
