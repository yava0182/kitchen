/**
 * Вкладка «Ящики» в catalog-item-edit: политика data.drawerStack для standalone_floor.
 */
(function () {
  'use strict';

  const DEFAULT_POLICY = Object.freeze({
    enabled: true,
    minHeightMm: 120,
    maxHeightMm: 200,
    gapMm: 5,
    facadeOverhangMm: 14.5,
    bottomOffsetMm: 0,
    topOffsetMm: 0,
    mode: 'max_count',
    maxCount: 8,
  depthModelRules: [],
  });

  function num(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function normalizeDrawerStackPolicy(raw) {
    const p = { ...DEFAULT_POLICY, ...(raw && typeof raw === 'object' ? raw : {}) };
    p.enabled = p.enabled !== false;
    p.minHeightMm = Math.max(40, num(p.minHeightMm, DEFAULT_POLICY.minHeightMm));
    p.maxHeightMm = Math.max(p.minHeightMm, num(p.maxHeightMm, DEFAULT_POLICY.maxHeightMm));
    p.gapMm = Math.max(0, num(p.gapMm, DEFAULT_POLICY.gapMm));
    p.facadeOverhangMm = Math.max(0, num(p.facadeOverhangMm, DEFAULT_POLICY.facadeOverhangMm));
    p.bottomOffsetMm = Math.max(0, num(p.bottomOffsetMm, DEFAULT_POLICY.bottomOffsetMm));
    p.topOffsetMm = Math.max(0, num(p.topOffsetMm, DEFAULT_POLICY.topOffsetMm));
    p.maxCount = Math.max(1, Math.floor(num(p.maxCount, DEFAULT_POLICY.maxCount)));
    p.mode = String(p.mode || 'max_count').trim().toLowerCase();
    p.depthModelRules = normalizeDepthModelRules(p.depthModelRules);
    return p;
  }

  function normalizeDepthModelRules(raw) {
    const list = Array.isArray(raw) ? raw : [];
    return list
      .map((r, idx) => {
        const minDepthMm = Math.round(Math.max(0, num(r?.minDepthMm, 0)));
        const maxDepthMm = Math.round(Math.max(minDepthMm, num(r?.maxDepthMm, minDepthMm)));
        const drawerCatalogId = String(r?.drawerCatalogId ?? r?.catalogId ?? '').trim();
        const name = String(r?.name || '').trim();
        const order = Number.isFinite(Number(r?.order)) ? Number(r.order) : idx + 1;
        return { minDepthMm, maxDepthMm, drawerCatalogId, name, order };
      })
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.minDepthMm - b.minDepthMm;
      });
  }

  function defaultDrawerStackPolicy() {
    return normalizeDrawerStackPolicy(null);
  }

  function resolveCatalogType(vueItem, catalogType) {
    return String(
      catalogType ||
        vueItem?.catalog_type ||
        document.getElementById('controller_name')?.value ||
        ''
    ).trim();
  }

  function shouldShowDrawerNoHandleOption(catalogType) {
    const ct = String(catalogType || '').trim();
    return ct === 'catalog_33' || ct === '33';
  }

  function readDrawerNoHandleFromApiData(apiData) {
    if (!apiData || typeof apiData !== 'object') return false;
    const v = apiData.drawerNoHandle;
    return v === true || v === 1 || v === '1';
  }

  function readDrawerNoHandleFromVueItem(vueItem) {
    if (!vueItem || typeof vueItem !== 'object') return false;
    if (readDrawerNoHandleFromApiData(vueItem)) return true;
    if (vueItem.data && readDrawerNoHandleFromApiData(vueItem.data)) return true;
    return false;
  }

  /**
   * Редактирование карточки catalog_33: в дереве нет module→catalog_33,
   * но превью должно уважать галочку «Без ручки» (stamp + iframe flag).
   */
  function stampDirectCatalog33EditorPreviewNoHandle(tree, editingCatalogType, vueItem) {
    if (!readDrawerNoHandleFromVueItem(vueItem)) return tree;
    const ct = String(editingCatalogType || '').trim();
    if (ct !== 'catalog_33' && ct !== '33') return tree;
    if (!Array.isArray(tree)) return tree;
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      node.spec = node.spec && typeof node.spec === 'object' ? { ...node.spec } : {};
      node.spec.drawer_no_handle = 1;
      if (Array.isArray(node.children)) node.children.forEach(walk);
    };
    tree.forEach(walk);
    return tree;
  }

  function applyDrawerNoHandleToVueItem(vueItem, apiData) {
    if (!vueItem || typeof vueItem !== 'object') return;
    vueItem.drawerNoHandle = readDrawerNoHandleFromApiData(apiData);
  }

  function mergeDrawerNoHandleIntoDataPayload(dataToSave, vueItem, catalogType) {
    if (!dataToSave || !vueItem || !shouldShowDrawerNoHandleOption(catalogType)) return dataToSave;
    dataToSave.drawerNoHandle = vueItem.drawerNoHandle === true;
    return dataToSave;
  }

  function shouldShowDrawerStackTab(vueItem, catalogType) {
    const pk = String(vueItem?.placementKind || '').trim();
    if (
      pk === 'standalone_floor' ||
      pk === 'wall_hung' ||
      pk === 'wall_hung_low' ||
      pk === 'wall_hung_high'
    ) {
      return true;
    }
    const ct = resolveCatalogType(vueItem, catalogType);
    if (ct === 'catalog_37' || ct === '37') return true;
    return false;
  }

  function updateDrawerStackTabVisibility() {
    const tabBtn = document.getElementById('catalog-item-edit-tab-drawers');
    if (!tabBtn) return;
    const vue = window.catalogItemVueApp;
    const show = vue && shouldShowDrawerStackTab(vue.item, vue.catalogType);
    tabBtn.style.display = show ? '' : 'none';
    if (!show && tabBtn.classList.contains('active')) {
      const basic = document.querySelector('#catalog-item-edit .tab_menu_h li[data-tab="basic"]');
      if (basic) basic.click();
    }
  }

  function readDrawerStackFromApiData(apiData) {
    if (!apiData || apiData.drawerStack == null) return null;
    return normalizeDrawerStackPolicy(apiData.drawerStack);
  }

  function applyDrawerStackToVueItem(vueItem, apiData, catalogType) {
    if (!vueItem || typeof vueItem !== 'object') return;
    const stored = readDrawerStackFromApiData(apiData);
    if (stored) {
      vueItem.drawerStack = stored;
      return;
    }
    if (shouldShowDrawerStackTab(vueItem, catalogType)) {
      vueItem.drawerStack = defaultDrawerStackPolicy();
    } else {
      vueItem.drawerStack = defaultDrawerStackPolicy();
    }
  }

  function mergeDrawerStackIntoDataPayload(dataToSave, vueItem, catalogType, opts) {
    if (!dataToSave || !vueItem) return dataToSave;
    const force = opts && opts.force === true;
    if (!force) {
      const interior = window.__cldCatalogInteriorFill;
      if (interior && typeof interior.shouldPersistDrawerStack === 'function') {
        if (!interior.shouldPersistDrawerStack(vueItem)) return dataToSave;
      } else if (!shouldShowDrawerStackTab(vueItem, catalogType)) {
        return dataToSave;
      }
    }
    dataToSave.drawerStack = normalizeDrawerStackPolicy(vueItem.drawerStack);
    return dataToSave;
  }

  function bindDrawerStackPreviewWatch(vm) {
    if (!vm || vm.__cldDrawerStackPreviewWatch) return;
    vm.__cldDrawerStackPreviewWatch = true;
    vm.$watch(
      () => vm.item && vm.item.drawerStack,
      () => {
        if (!window.__ppPreviewIframe) return;
        if (typeof window.__ppPostModuleToIframe === 'function') {
          window.__ppPostModuleToIframe(true);
        }
      },
      { deep: true }
    );
    // Живое превью при смене Ш/В/Г в карточке (не только после Сохранить).
    if (!vm.__cldMainSizePreviewWatch) {
      vm.__cldMainSizePreviewWatch = true;
      vm.$watch(
        () => [vm.item && vm.item.width, vm.item && vm.item.height, vm.item && vm.item.depth],
        () => {
          if (typeof window.__CLD_SIZE_PREVIEW_SYNC_SCHEDULE === 'function') {
            window.__CLD_SIZE_PREVIEW_SYNC_SCHEDULE();
          } else if (typeof window.__ppPostModuleToIframe === 'function') {
            window.__ppPostModuleToIframe(true);
          }
        }
      );
    }
  }

  function shouldUseInteriorFillDrawerStackSimple(vueItem, catalogType) {
    const pk = String(vueItem?.placementKind || '').trim();
    // Полная форма (мин/макс высота, макс. число) — как у тумбы на полу и у навесной.
    if (
      pk === 'standalone_floor' ||
      pk === 'wall_hung' ||
      pk === 'wall_hung_low' ||
      pk === 'wall_hung_high'
    ) {
      return false;
    }
    const ct = resolveCatalogType(vueItem, catalogType);
    if (ct === 'catalog_37' || ct === '37') return false;
    return true;
  }

  function getVueDrawerStackOptions() {
    return {
      computed: {
        showDrawerStackTab() {
          return shouldShowDrawerStackTab(this.item, this.catalogType);
        },
        showDrawerNoHandleOption() {
          return shouldShowDrawerNoHandleOption(this.catalogType);
        },
        showInteriorFillDrawerStackSimple() {
          if (!this.showInteriorDrawersSection) return false;
          return shouldUseInteriorFillDrawerStackSimple(this.item, this.catalogType);
        },
      },
      methods: {
        onDrawerStackPlacementKindChange() {
          if (typeof window.__cldCatalogModuleProfile?.applyModuleProfileFromUi === 'function') {
            window.__cldCatalogModuleProfile.applyModuleProfileFromUi('placementKind');
          }
          if (typeof window.__cldUpdateDrawerStackTabVisibility === 'function') {
            window.__cldUpdateDrawerStackTabVisibility();
          }
          if (typeof window.__ppPostModuleToIframe === 'function') {
            try {
              window.__ppPostModuleToIframe(true);
            } catch (_) {}
          }
        },
        onDrawerNoHandleChange() {
          try {
            const iframe = window.__ppPreviewIframe;
            const readFn = window.__cldCatalogDrawerStack?.readDrawerNoHandleFromVueItem;
            const drawerNoHandle =
              typeof readFn === 'function'
                ? readFn(this.item)
                : this.item?.drawerNoHandle === true;
            if (iframe?.contentWindow) {
              iframe.contentWindow.postMessage(
                {
                  type: 'cld:setDrawerPreviewNoHandle',
                  drawerNoHandle,
                },
                '*'
              );
            }
          } catch (_) {}
          if (typeof window.__ppPostModuleToIframe === 'function') {
            window.__ppPostModuleToIframe();
          }
        },
        resetDrawerStackDefaults() {
          this.$set(this.item, 'drawerStack', defaultDrawerStackPolicy());
        },
        applyDrawerStackFromLoadedData(policy) {
          this.$set(this.item, 'drawerStack', normalizeDrawerStackPolicy(policy));
        },
        addDrawerDepthRule() {
          if (!this.item.drawerStack || typeof this.item.drawerStack !== 'object') {
            this.$set(this.item, 'drawerStack', defaultDrawerStackPolicy());
          }
          const rules = Array.isArray(this.item.drawerStack.depthModelRules)
            ? [...this.item.drawerStack.depthModelRules]
            : [];
          const nextOrder = rules.length ? Math.max(...rules.map((r) => Number(r.order) || 0)) + 1 : 1;
          rules.push({
            minDepthMm: 455,
            maxDepthMm: 504,
            drawerCatalogId: '',
            name: '',
            order: nextOrder,
          });
          this.$set(this.item.drawerStack, 'depthModelRules', normalizeDepthModelRules(rules));
        },
        removeDrawerDepthRule(idx) {
          const rules = Array.isArray(this.item?.drawerStack?.depthModelRules)
            ? [...this.item.drawerStack.depthModelRules]
            : [];
          if (idx < 0 || idx >= rules.length) return;
          rules.splice(idx, 1);
          this.$set(this.item.drawerStack, 'depthModelRules', normalizeDepthModelRules(rules));
        },
        normalizeDrawerDepthRules() {
          const rules = Array.isArray(this.item?.drawerStack?.depthModelRules)
            ? this.item.drawerStack.depthModelRules
            : [];
          this.$set(this.item.drawerStack, 'depthModelRules', normalizeDepthModelRules(rules));
        },
      },
    };
  }

  function readDrawerNoHandleFlagFromHit(hit) {
    if (!hit || typeof hit !== 'object') return false;
    const d = hit.data && typeof hit.data === 'object' ? hit.data : hit;
    const p = hit.params && typeof hit.params === 'object' ? hit.params : {};
    const vals = [d?.drawerNoHandle, p?.drawerNoHandle, hit.drawerNoHandle];
    return vals.some((v) => v === true || v === 1 || v === '1');
  }

  let __drawerCatalog33FlagsPromise = null;
  let __drawerCatalog33FlagsLoaded = false;

  function ingestDrawerCatalog33ApiItems(items) {
    window.__CLD_CATALOGS_DATA = window.__CLD_CATALOGS_DATA || {};
    const map = {};
    (Array.isArray(items) ? items : []).filter(Boolean).forEach((it) => {
      const d = it.data && typeof it.data === 'object' ? it.data : it;
      const id = String(it.id ?? d.id ?? '').trim();
      if (!id) return;
      const noHandle =
        readDrawerNoHandleFromApiData(d) || readDrawerNoHandleFromApiData(it);
      map[id] = {
        id,
        name: it.name || d.name || '',
        element_type: 'catalog_33',
        params: it.params || d.params || d,
        data: d,
        drawerNoHandle: noHandle,
      };
    });
    window.__CLD_CATALOGS_DATA.catalog_33 = { items: map };
    if (typeof window.__cldRefreshDrawerCatalog33Cache === 'function') {
      try {
        window.__cldRefreshDrawerCatalog33Cache();
      } catch (_) {}
    }
    return map;
  }

  /** Превью шкафа/fill: флаги catalog_33 с API (как vueItem на карточке ящика), не только localStorage. */
  function ensureDrawerCatalog33FlagsLoaded() {
    if (__drawerCatalog33FlagsLoaded && window.__CLD_CATALOGS_DATA?.catalog_33?.items) {
      return Promise.resolve(window.__CLD_CATALOGS_DATA.catalog_33.items);
    }
    if (__drawerCatalog33FlagsPromise) return __drawerCatalog33FlagsPromise;
    __drawerCatalog33FlagsPromise = fetch('/api/catalog/items_get/catalog_33?t=' + Date.now(), {
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        const items = Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload)
            ? payload
            : [];
        const map = ingestDrawerCatalog33ApiItems(items);
        __drawerCatalog33FlagsLoaded = true;
        return map;
      })
      .catch(() => {
        __drawerCatalog33FlagsLoaded = false;
        return {};
      })
      .finally(() => {
        __drawerCatalog33FlagsPromise = null;
      });
    return __drawerCatalog33FlagsPromise;
  }

  function readDrawerNoHandleByCatalogIdAdmin(drawerCatalogId) {
    if (typeof window.__cldReadDrawerNoHandleByCatalogId === 'function') {
      return !!window.__cldReadDrawerNoHandleByCatalogId(drawerCatalogId);
    }
    const id = String(drawerCatalogId || '').trim();
    if (!id) return false;
    try {
      const map = window.__CLD_CATALOGS_DATA?.catalog_33?.items;
      if (map && typeof map === 'object' && readDrawerNoHandleFlagFromHit(map[id])) return true;
    } catch (_) {}
    try {
      const raw = localStorage.getItem('catalog_33');
      const arr = raw ? JSON.parse(raw) : [];
      const hit = Array.isArray(arr) ? arr.find((it) => String(it?.id ?? '').trim() === id) : null;
      if (readDrawerNoHandleFlagFromHit(hit)) return true;
    } catch (_) {}
    return false;
  }

  function moduleDrawerShouldHaveNoHandle(node) {
    const spec = node?.spec;
    if (!spec || typeof spec !== 'object') return false;
    if (String(spec.element_type || '').trim() !== 'catalog_33') return false;
    const nh = spec.drawer_no_handle ?? spec.drawerNoHandle ?? spec.no_handle;
    if (nh === 1 || nh === true || nh === '1') return true;
    const cid = String(spec.id ?? '').trim();
    const linked = String(spec.linked_item_id ?? '').trim();
    if (cid && readDrawerNoHandleByCatalogIdAdmin(cid)) return true;
    if (linked && readDrawerNoHandleByCatalogIdAdmin(linked)) return true;
    return false;
  }

  function isFillCatalogPreviewType(catalogType) {
    const ct = String(catalogType || '').trim();
    return ct === 'catalog_38' || ct === 'catalog_39' || ct === '38' || ct === '39';
  }

  function countDrawerNoHandleModulesInTree(nodes) {
    let drawerModules = 0;
    let noHandleModules = 0;
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      if (String(node.type || '').toLowerCase() === 'module') {
        const et = String(node.spec?.element_type || '').trim();
        if (et === 'catalog_33') {
          drawerModules += 1;
          if (moduleDrawerShouldHaveNoHandle(node)) noHandleModules += 1;
        }
      }
      if (Array.isArray(node.children)) node.children.forEach(walk);
      if (Array.isArray(node.spec?.template_tree)) node.spec.template_tree.forEach(walk);
    };
    if (Array.isArray(nodes)) nodes.forEach(walk);
    return { drawerModules, noHandleModules };
  }

  /**
   * Превью iframe: global strip (__cldPreviewDrawerNoHandle) как у карточки catalog_33,
   * но для шкафа/fill — только если все catalog_33 в дереве «без ручки» (комод не трогаем).
   */
  function resolvePreviewDrawerNoHandleForPostMessage(tree, editingCatalogType, vueItem, placementKind) {
    const ct = String(editingCatalogType || '').trim();
    if (ct === 'catalog_33' || ct === '33') {
      return readDrawerNoHandleFromVueItem(vueItem);
    }
    const pk = String(vueItem?.placementKind || placementKind || '').trim();
    if (pk === 'standalone_floor') return false;
    if (!Array.isArray(tree) || !tree.length) return false;
    const { drawerModules, noHandleModules } = countDrawerNoHandleModulesInTree(tree);
    if (drawerModules > 0 && drawerModules === noHandleModules) return true;
    // catalog_38/39: в рецепте только внутренние ящики id=1 — strip по карточке catalog_33.
    if (isFillCatalogPreviewType(ct) && drawerModules > 0 && readDrawerNoHandleByCatalogIdAdmin('1')) {
      return true;
    }
    return false;
  }

  window.__cldCatalogDrawerStack = {
    DEFAULT_POLICY,
    defaultDrawerStackPolicy,
    normalizeDrawerStackPolicy,
    shouldShowDrawerStackTab,
    shouldShowDrawerNoHandleOption,
    readDrawerNoHandleFromApiData,
    readDrawerNoHandleFromVueItem,
    stampDirectCatalog33EditorPreviewNoHandle,
    applyDrawerNoHandleToVueItem,
    mergeDrawerNoHandleIntoDataPayload,
    readDrawerStackFromApiData,
    applyDrawerStackToVueItem,
    mergeDrawerStackIntoDataPayload,
    resolvePreviewDrawerNoHandleForPostMessage,
    moduleDrawerShouldHaveNoHandle,
    ensureDrawerCatalog33FlagsLoaded,
    getVueDrawerStackOptions,
    bindDrawerStackPreviewWatch,
  };
  window.__cldUpdateDrawerStackTabVisibility = updateDrawerStackTabVisibility;
})();
