/**
 * Карточка kitchen_tall: data.kitchenTall — вид пенала (фасады по поясам кухни).
 * placementKind всегда kitchen_tall; вид = facadeType на карточке.
 */
(function () {
  'use strict';

  var FACADE_TYPES = [
    { id: 'doors_3', label: 'Пенал 3 двери' },
    { id: 'oven_mw', label: 'Пенал духовка + СВЧ' },
    { id: 'fridge', label: 'Пенал холодильник' },
  ];

  function defaultKitchenTall() {
    return normalizeKitchenTall(null);
  }

  function normalizeKitchenTall(raw) {
    var src = raw && typeof raw === 'object' ? raw : {};
    var type = String(src.facadeType || src.type || 'doors_3').trim();
    if (type !== 'doors_3' && type !== 'oven_mw' && type !== 'fridge') {
      type = 'doors_3';
    }
    var out = { facadeType: type };
    if (type === 'oven_mw') {
      var lower = Number(src.lowerHalfOfNmMm);
      var oven = Number(src.ovenNicheMm);
      var mw = Number(src.microwaveNicheMm);
      out.lowerHalfOfNmMm = Number.isFinite(lower) && lower > 0 ? Math.round(lower) : 360;
      out.ovenNicheMm = Number.isFinite(oven) && oven > 0 ? Math.round(oven) : 600;
      out.microwaveNicheMm = Number.isFinite(mw) && mw > 0 ? Math.round(mw) : 300;
    }
    return out;
  }

  function isKitchenTallPlacement(pk) {
    return String(pk || '').trim() === 'kitchen_tall';
  }

  function shouldShowKitchenTallEditor(vueItem) {
    return isKitchenTallPlacement(vueItem && vueItem.placementKind);
  }

  function readKitchenTallFromApiData(apiData) {
    if (!apiData || apiData.kitchenTall == null) return null;
    return normalizeKitchenTall(apiData.kitchenTall);
  }

  function applyKitchenTallToVueItem(vueItem, apiData) {
    if (!vueItem || typeof vueItem !== 'object') return;
    var stored = readKitchenTallFromApiData(apiData);
    if (stored) {
      vueItem.kitchenTall = stored;
      return;
    }
    if (isKitchenTallPlacement(vueItem.placementKind)) {
      vueItem.kitchenTall = defaultKitchenTall();
    } else if (vueItem.kitchenTall == null) {
      vueItem.kitchenTall = defaultKitchenTall();
    }
  }

  function mergeKitchenTallIntoDataPayload(dataToSave, vueItem) {
    if (!dataToSave || !vueItem) return dataToSave;
    if (!shouldShowKitchenTallEditor(vueItem)) {
      // Не затираем сохранённое, если сменили placementKind — оставляем как есть только при tall.
      return dataToSave;
    }
    dataToSave.kitchenTall = normalizeKitchenTall(vueItem.kitchenTall);
    return dataToSave;
  }

  function resolvePreview(kitchenTall) {
    var kt = normalizeKitchenTall(kitchenTall);
    var api = window.__cldKitchenManufacturing;
    if (!api || typeof api.resolveTallFacadeLayoutMm !== 'function') {
      return {
        ok: false,
        message: 'KitchenManufacturingProfile не загружен (resolveTallFacadeLayoutMm).',
        kitchenTall: kt,
      };
    }
    var r = api.resolveTallFacadeLayoutMm({
      facadeType: kt.facadeType,
      lowerHalfOfNmMm: kt.lowerHalfOfNmMm,
      ovenNicheMm: kt.ovenNicheMm,
      microwaveNicheMm: kt.microwaveNicheMm,
    });
    return r;
  }

  function getVueKitchenTallOptions() {
    return {
      computed: {
        showKitchenTallEditor: function () {
          var show = shouldShowKitchenTallEditor(this.item);
          if (show && this.item && (!this.item.kitchenTall || typeof this.item.kitchenTall !== 'object')) {
            try {
              if (this.$set) this.$set(this.item, 'kitchenTall', defaultKitchenTall());
              else this.item.kitchenTall = defaultKitchenTall();
            } catch (_) {
              this.item.kitchenTall = defaultKitchenTall();
            }
          }
          return show;
        },
        kitchenTallFacadeTypeOptions: function () {
          return FACADE_TYPES.slice();
        },
        kitchenTallPreview: function () {
          if (!this.showKitchenTallEditor || !this.item) return null;
          try {
            return resolvePreview(this.item.kitchenTall);
          } catch (e) {
            return { ok: false, message: String(e && e.message ? e.message : e) };
          }
        },
        kitchenTallPreviewFacades: function () {
          var p = this.kitchenTallPreview;
          return p && p.ok && Array.isArray(p.facades) ? p.facades : [];
        },
        kitchenTallPreviewBandsLine: function () {
          var p = this.kitchenTallPreview;
          if (!p || !p.ok || !p.bands) return '—';
          var b = p.bands;
          return (
            String(b.bandLowMm) +
            ' + ' +
            String(b.bandMidMm) +
            ' + ' +
            String(b.bandHighMm) +
            ' = ' +
            String(p.tallCarcassHeightMm) +
            ' мм'
          );
        },
        kitchenTallPreviewHorizonsLine: function () {
          var p = this.kitchenTallPreview;
          var hs = p && p.horizons;
          if (!hs || !hs.length) return '—';
          return hs
            .map(function (h) {
              return h.id + ' @ ' + h.yMm + ' мм';
            })
            .join('; ');
        },
      },
      methods: {
        onKitchenTallChange: function () {
          if (!this.item) return;
          this.item.kitchenTall = normalizeKitchenTall(this.item.kitchenTall);
        },
        kitchenTallFacadeSpanLabel: function (f) {
          if (!f) return '';
          if (Array.isArray(f.spanDatums) && f.spanDatums.length) {
            return 'span: ' + f.spanDatums.join('+');
          }
          return f.alignsTo || '';
        },
      },
    };
  }

  window.__cldCatalogKitchenTall = {
    FACADE_TYPES: FACADE_TYPES,
    defaultKitchenTall: defaultKitchenTall,
    normalizeKitchenTall: normalizeKitchenTall,
    shouldShowKitchenTallEditor: shouldShowKitchenTallEditor,
    readKitchenTallFromApiData: readKitchenTallFromApiData,
    applyKitchenTallToVueItem: applyKitchenTallToVueItem,
    mergeKitchenTallIntoDataPayload: mergeKitchenTallIntoDataPayload,
    resolvePreview: resolvePreview,
    getVueKitchenTallOptions: getVueKitchenTallOptions,
  };
})();
