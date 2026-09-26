/**
 * Вкладка «Полки» в catalog-item-edit: политика data.shelfStack для наполнения (catalog_38 / is_fill).
 */
(function () {
  'use strict';

  const DEFAULT_POLICY = Object.freeze({
    enabled: true,
    distribution: 'step',
    stepMm: 400,
    shelfThicknessMm: 16,
    bottomOffsetMm: 0,
    topOffsetMm: 0,
    mode: 'max_count',
    maxCount: 12,
    minGapMm: 50,
    fixedPositionsFromBottomMm: [],
  });

  function num(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function normalizeShelfStackPolicy(raw) {
    const p = { ...DEFAULT_POLICY, ...(raw && typeof raw === 'object' ? raw : {}) };
    p.enabled = p.enabled !== false;
    p.distribution = String(p.distribution || 'step').trim().toLowerCase();
    if (p.distribution === 'max_count' || p.distribution === 'fixed') p.distribution = 'mixed';
    if (!['step', 'even', 'even_fixed', 'mixed'].includes(p.distribution)) p.distribution = 'step';
    p.stepMm = Math.max(0, num(p.stepMm, DEFAULT_POLICY.stepMm));
    p.minGapMm = Math.max(0, num(p.minGapMm, DEFAULT_POLICY.minGapMm));
    p.shelfThicknessMm = Math.max(8, num(p.shelfThicknessMm, DEFAULT_POLICY.shelfThicknessMm));
    p.bottomOffsetMm = Math.max(0, num(p.bottomOffsetMm, DEFAULT_POLICY.bottomOffsetMm));
    p.topOffsetMm = Math.max(0, num(p.topOffsetMm, DEFAULT_POLICY.topOffsetMm));
    p.maxCount = Math.max(1, Math.floor(num(p.maxCount, DEFAULT_POLICY.maxCount)));
    p.mode = String(p.mode || 'max_count').trim().toLowerCase();
    const fixedRaw =
      p.fixedPositionsFromBottomMm ??
      p.fixedPositionsMm ??
      p.fixedSlots ??
      [];
    p.fixedPositionsFromBottomMm = Array.isArray(fixedRaw)
      ? fixedRaw
          .map((x) =>
            typeof x === 'object' ? num(x.posFromBottomMm ?? x.fromBottomMm, -1) : num(x, -1)
          )
          .filter((x) => x >= 0)
          .sort((a, b) => a - b)
      : [];
    return p;
  }

  function defaultShelfStackPolicy() {
    return normalizeShelfStackPolicy(null);
  }

  function resolveCatalogType(vueItem, catalogType) {
    return String(
      catalogType ||
        vueItem?.catalog_type ||
        document.getElementById('controller_name')?.value ||
        ''
    ).trim();
  }

  function isFillCatalogItem(vueItem) {
    const v = vueItem?.is_fill;
    return v === '1' || v === 1 || v === true;
  }

  function shouldShowShelfStackTab(vueItem, catalogType) {
    const ct = resolveCatalogType(vueItem, catalogType);
    if (ct === 'catalog_38' || ct === '38') return true;
    return isFillCatalogItem(vueItem);
  }

  function updateShelfStackTabVisibility() {
    const tabBtn = document.getElementById('catalog-item-edit-tab-shelves');
    if (!tabBtn) return;
    const vue = window.catalogItemVueApp;
    const show = vue && shouldShowShelfStackTab(vue.item, vue.catalogType);
    tabBtn.style.display = show ? '' : 'none';
    if (!show && tabBtn.classList.contains('active')) {
      const basic = document.querySelector('#catalog-item-edit .tab_menu_h li[data-tab="basic"]');
      if (basic) basic.click();
    }
  }

  function readShelfStackFromApiData(apiData) {
    if (!apiData || apiData.shelfStack == null) return null;
    return normalizeShelfStackPolicy(apiData.shelfStack);
  }

  function applyShelfStackToVueItem(vueItem, apiData, catalogType) {
    if (!vueItem || typeof vueItem !== 'object') return;
    const stored = readShelfStackFromApiData(apiData);
    if (stored) {
      vueItem.shelfStack = stored;
      return;
    }
    if (shouldShowShelfStackTab(vueItem, catalogType)) {
      vueItem.shelfStack = defaultShelfStackPolicy();
    } else {
      vueItem.shelfStack = defaultShelfStackPolicy();
    }
  }

  function mergeShelfStackIntoDataPayload(dataToSave, vueItem, catalogType, opts) {
    if (!dataToSave || !vueItem) return dataToSave;
    const force = opts && opts.force === true;
    if (!force) {
      const interior = window.__cldCatalogInteriorFill;
      if (interior && typeof interior.shouldPersistShelfStack === 'function') {
        if (!interior.shouldPersistShelfStack(vueItem)) return dataToSave;
      } else if (!shouldShowShelfStackTab(vueItem, catalogType)) {
        return dataToSave;
      }
    }
    dataToSave.shelfStack = normalizeShelfStackPolicy(vueItem.shelfStack);
    return dataToSave;
  }

  function bindShelfStackPreviewWatch(vm) {
    if (!vm || vm.__cldShelfStackPreviewWatch) return;
    vm.__cldShelfStackPreviewWatch = true;
    vm.$watch(
      () => vm.item && vm.item.shelfStack,
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
      () => {
        if (typeof window.__cldUpdateShelfStackTabVisibility === 'function') {
          window.__cldUpdateShelfStackTabVisibility();
        }
      }
    );
  }

  function getVueShelfStackOptions() {
    return {
      computed: {
        showShelfStackTab() {
          return shouldShowShelfStackTab(this.item, this.catalogType);
        },
        shelfStackMaxCountLabel() {
          const d = String(this.item?.shelfStack?.distribution || 'step');
          if (d === 'even') return 'Макс. полок (лимит)';
          if (d === 'even_fixed') return 'Количество полок';
          if (d === 'mixed') return 'Всего полок (фикс. + авто)';
          return 'Макс. полок';
        },
        shelfStackStepFieldLabel() {
          const d = String(this.item?.shelfStack?.distribution || 'step');
          if (d === 'even') return 'Мин. зазор, мм';
          return 'Шаг, мм';
        },
        shelfStackHint() {
          const d = String(this.item?.shelfStack?.distribution || 'step');
          if (d === 'step') {
            return 'Шаг от низа зоны. Пример: высота 400 мм и шаг 400 → 1 полка; 800 мм → 2 полки.';
          }
          if (d === 'even') {
            return 'Равные зазоры снизу, между полками и сверху. Число полок подбирается по высоте (не больше лимита).';
          }
          if (d === 'even_fixed') {
            return 'Ровно столько полок, сколько в поле «Количество полок» (не лимит — точное число).';
          }
          if (d === 'mixed') {
            return '«Всего полок» = фиксированные + авто. Остальные равномерно в свободных промежутках между фикс. полками.';
          }
          return '';
        },
      },
      methods: {
        resetShelfStackDefaults() {
          this.$set(this.item, 'shelfStack', defaultShelfStackPolicy());
        },
        applyShelfStackFromLoadedData(policy) {
          this.$set(this.item, 'shelfStack', normalizeShelfStackPolicy(policy));
        },
        ensureShelfFixedPositionsArray() {
          if (!this.item?.shelfStack) return;
          if (!Array.isArray(this.item.shelfStack.fixedPositionsFromBottomMm)) {
            this.$set(this.item.shelfStack, 'fixedPositionsFromBottomMm', []);
          }
        },
        addShelfFixedPosition() {
          this.ensureShelfFixedPositionsArray();
          const arr = this.item.shelfStack.fixedPositionsFromBottomMm;
          const last = arr.length ? num(arr[arr.length - 1], 0) + 400 : 400;
          arr.push(last);
          this.normalizeShelfFixedPositions();
        },
        removeShelfFixedPosition(idx) {
          this.ensureShelfFixedPositionsArray();
          const arr = this.item.shelfStack.fixedPositionsFromBottomMm;
          if (!Array.isArray(arr)) return;
          arr.splice(idx, 1);
          this.normalizeShelfFixedPositions();
        },
        normalizeShelfFixedPositions() {
          if (!this.item?.shelfStack) return;
          const arr = this.item.shelfStack.fixedPositionsFromBottomMm;
          if (!Array.isArray(arr)) {
            this.$set(this.item.shelfStack, 'fixedPositionsFromBottomMm', []);
            return;
          }
          const sorted = arr
            .map((x) => Math.round(num(x, -1)))
            .filter((x) => x >= 0)
            .sort((a, b) => a - b);
          const out = [];
          for (const pos of sorted) {
            if (!out.length || pos - out[out.length - 1] >= 24) out.push(pos);
          }
          this.$set(this.item.shelfStack, 'fixedPositionsFromBottomMm', out);
        },
      },
    };
  }

  window.__cldCatalogShelfStack = {
    DEFAULT_POLICY,
    defaultShelfStackPolicy,
    normalizeShelfStackPolicy,
    shouldShowShelfStackTab,
    readShelfStackFromApiData,
    applyShelfStackToVueItem,
    mergeShelfStackIntoDataPayload,
    getVueShelfStackOptions,
    bindShelfStackPreviewWatch,
  };
  window.__cldUpdateShelfStackTabVisibility = updateShelfStackTabVisibility;
  window.__cldBindShelfStackPreviewWatch = bindShelfStackPreviewWatch;
})();
