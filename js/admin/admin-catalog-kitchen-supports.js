/**
 * Карточка kitchen_base: data.kitchenSupports — какие cabinet_model допустимы по высоте.
 * Не catalog_32: там сборка «Цоколь», SKU ножки живут в Модели 3D (cabinet_model).
 */
(function () {
  'use strict';

  var HEIGHTS = [100, 120, 150];

  function defaultModelsMap() {
    var km = window.__cldKitchenManufacturing;
    if (km && typeof km.getSupportModelsByHeightMm === 'function') {
      return km.getSupportModelsByHeightMm();
    }
    return { 100: '2', 120: '79', 150: '80' };
  }

  function normalizeKitchenSupports(raw) {
    var base = defaultModelsMap();
    var src = raw && typeof raw === 'object' ? raw : {};
    var mapSrc = src.modelsByHeightMm || src.modelsByHeight || {};
    var models = {};
    HEIGHTS.forEach(function (h) {
      var v = mapSrc[h] != null ? mapSrc[h] : mapSrc[String(h)];
      if (v && typeof v === 'object') v = v.cabinetModelId ?? v.id ?? v.modelId;
      var sid = v != null && String(v).trim() !== '' ? String(v).trim() : String(base[h] || '');
      models[h] = sid;
    });
    return {
      enabled: src.enabled !== false,
      modelsByHeightMm: models,
    };
  }

  function defaultKitchenSupports() {
    return normalizeKitchenSupports(null);
  }

  function isKitchenBasePlacement(pk) {
    var s = String(pk || '').trim();
    var api = window.__cldCatalogModuleProfile;
    if (api && typeof api.isKitchenBasePlacement === 'function') {
      return !!api.isKitchenBasePlacement(s);
    }
    return s === 'kitchen_base' || s === 'kitchen_base_gola';
  }

  function shouldShowKitchenSupportsEditor(vueItem) {
    return isKitchenBasePlacement(vueItem && vueItem.placementKind);
  }

  function readKitchenSupportsFromApiData(apiData) {
    if (!apiData || apiData.kitchenSupports == null) return null;
    return normalizeKitchenSupports(apiData.kitchenSupports);
  }

  function applyKitchenSupportsToVueItem(vueItem, apiData) {
    if (!vueItem || typeof vueItem !== 'object') return;
    var stored = readKitchenSupportsFromApiData(apiData);
    if (stored) {
      vueItem.kitchenSupports = stored;
      return;
    }
    vueItem.kitchenSupports = defaultKitchenSupports();
  }

  function mergeKitchenSupportsIntoDataPayload(dataToSave, vueItem) {
    if (!dataToSave || !vueItem) return dataToSave;
    if (!shouldShowKitchenSupportsEditor(vueItem)) return dataToSave;
    dataToSave.kitchenSupports = normalizeKitchenSupports(vueItem.kitchenSupports);
    return dataToSave;
  }

  var __legOptionsCache = null;
  var __legOptionsPromise = null;

  function loadSupportCabinetModelOptions() {
    if (__legOptionsCache) return Promise.resolve(__legOptionsCache);
    if (__legOptionsPromise) return __legOptionsPromise;
    __legOptionsPromise = fetch('/api/catalog/items_get/cabinet_model', { cache: 'no-store' })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .catch(function () {
        return null;
      })
      .then(function (payload) {
        var items = Array.isArray(payload)
          ? payload
          : Array.isArray(payload && payload.items)
            ? payload.items
            : [];
        var opts = items
          .filter(function (it) {
            if (!it || it.active === 0 || it.active === '0') return false;
            var cat = String(it.category || '').toLowerCase();
            var name = String(it.name || '').toLowerCase();
            return /опор/.test(cat) || /опор/.test(name) || /support|leg|ножк/.test(name);
          })
          .map(function (it) {
            return {
              id: String(it.id),
              label: String(it.name || '') + ' (#' + it.id + ')',
              price: Number(
                (it.data && it.data.params && it.data.params.models && it.data.params.models[0]
                  ? it.data.params.models[0].price
                  : it.price) || 0
              ),
            };
          });
        if (!opts.length) {
          opts = [
            { id: '2', label: 'Опора кухонная 100 (#2)', price: 0 },
            { id: '79', label: 'Опора 120 мм (#79)', price: 0 },
            { id: '80', label: 'Опора 150 мм (#80)', price: 0 },
          ];
        }
        __legOptionsCache = opts;
        __legOptionsPromise = null;
        return opts;
      });
    return __legOptionsPromise;
  }

  function getVueKitchenSupportsOptions() {
    return {
      computed: {
        showKitchenSupportsEditor: function () {
          var show = shouldShowKitchenSupportsEditor(this.item);
          if (show && typeof this.ensureKitchenSupportOptions === 'function') {
            try {
              this.ensureKitchenSupportOptions();
            } catch (_) {}
          }
          return show;
        },
        kitchenSupportHeightsMm: function () {
          return HEIGHTS.slice();
        },
      },
      methods: {
        ensureKitchenSupportOptions: function () {
          var self = this;
          if (Array.isArray(self.kitchenSupportModelOptions) && self.kitchenSupportModelOptions.length) {
            return;
          }
          loadSupportCabinetModelOptions().then(function (opts) {
            if (self.$set) self.$set(self, 'kitchenSupportModelOptions', opts);
            else self.kitchenSupportModelOptions = opts;
          });
        },
        onKitchenSupportsChange: function () {
          if (!this.item) return;
          this.item.kitchenSupports = normalizeKitchenSupports(this.item.kitchenSupports);
        },
      },
    };
  }

  window.__cldCatalogKitchenSupports = {
    HEIGHTS: HEIGHTS,
    defaultKitchenSupports: defaultKitchenSupports,
    normalizeKitchenSupports: normalizeKitchenSupports,
    shouldShowKitchenSupportsEditor: shouldShowKitchenSupportsEditor,
    readKitchenSupportsFromApiData: readKitchenSupportsFromApiData,
    applyKitchenSupportsToVueItem: applyKitchenSupportsToVueItem,
    mergeKitchenSupportsIntoDataPayload: mergeKitchenSupportsIntoDataPayload,
    loadSupportCabinetModelOptions: loadSupportCabinetModelOptions,
    getVueKitchenSupportsOptions: getVueKitchenSupportsOptions,
  };
})();
