/**
 * Список «Тип размещения» в карточке каталога — из room_steps_config.placementKindProfiles.
 * Подписи только на русском (без standalone_floor в интерфейсе).
 */
(function (global) {
  var FALLBACK_RU = {
    floor_in_niche: 'Шкаф в нише (по высоте секции)',
    standalone_floor: 'Тумба напольная (фикс. высота)',
    wall_hung: 'Навесной верхний (legacy)',
    wall_hung_low: 'Навесной нижний (к полу)',
    wall_hung_high: 'Навесной верхний (к потолку)',
    corpus_only: 'Только корпус',
  };

  function ruLabelForPlacementKind(id) {
    var key = String(id || '').trim();
    if (!key) return '';
    var api = global.__cldPlacementKindProfiles;
    if (api && api.PLACEMENT_KIND_RU_LABELS && api.PLACEMENT_KIND_RU_LABELS[key]) {
      return api.PLACEMENT_KIND_RU_LABELS[key];
    }
    return FALLBACK_RU[key] || key;
  }

  function getPlacementKindOptions() {
    var api = global.__cldPlacementKindProfiles;
    var cfg =
      typeof global.getRoomStepsConfig === 'function' ? global.getRoomStepsConfig() : null;
    if (api && typeof api.getPlacementKindOptionsForCatalog === 'function') {
      var fromCfg = api.getPlacementKindOptionsForCatalog(cfg);
      if (Array.isArray(fromCfg) && fromCfg.length) return fromCfg;
    }
    if (api && Array.isArray(api.PLACEMENT_KIND_BASE_OPTIONS) && api.PLACEMENT_KIND_BASE_OPTIONS.length) {
      return api.PLACEMENT_KIND_BASE_OPTIONS.slice();
    }
    return [
      { id: 'floor_in_niche', label: FALLBACK_RU.floor_in_niche },
      { id: 'standalone_floor', label: FALLBACK_RU.standalone_floor },
      { id: 'wall_hung_low', label: FALLBACK_RU.wall_hung_low },
      { id: 'wall_hung_high', label: FALLBACK_RU.wall_hung_high },
      { id: 'wall_hung', label: FALLBACK_RU.wall_hung },
      { id: 'corpus_only', label: FALLBACK_RU.corpus_only },
    ];
  }

  function syncPlacementKindOptions(app) {
    if (!app) return;
    var opts = getPlacementKindOptions();
    var cur = String((app.item && app.item.placementKind) || '').trim();
    if (cur && !opts.some(function (o) {
      return o.id === cur;
    })) {
      opts = [{ id: cur, label: ruLabelForPlacementKind(cur) }].concat(opts);
    }
    if (typeof app.$set === 'function') {
      app.$set(app, 'placementKindOptions', opts);
    } else {
      app.placementKindOptions = opts;
    }
  }

  function patchOpenCatalogItemEdit() {
    var fn = global.openCatalogItemEdit;
    if (!fn || fn.__cldPkSelectPatched) return false;
    global.openCatalogItemEdit = function () {
      var result = fn.apply(this, arguments);
      setTimeout(function () {
        syncPlacementKindOptions(global.catalogItemVueApp);
      }, 0);
      return result;
    };
    global.openCatalogItemEdit.__cldPkSelectPatched = true;
    return true;
  }

  function patchVueMounted() {
    var app = global.catalogItemVueApp;
    if (!app || app.__cldPkSelectMountedPatched) return;
    app.__cldPkSelectMountedPatched = true;
    syncPlacementKindOptions(app);
  }

  function init() {
    patchOpenCatalogItemEdit();
    patchVueMounted();
    if (global.catalogItemVueApp) {
      syncPlacementKindOptions(global.catalogItemVueApp);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  global.addEventListener('load', init);

  var tries = 0;
  var timer = setInterval(function () {
    init();
    if (global.openCatalogItemEdit && global.openCatalogItemEdit.__cldPkSelectPatched) {
      clearInterval(timer);
    } else if (++tries > 60) {
      clearInterval(timer);
    }
  }, 200);

  global.__cldDefaultPlacementKindOptions = getPlacementKindOptions;
  global.__cldSyncCatalogPlacementKindOptions = syncPlacementKindOptions;
})(typeof window !== 'undefined' ? window : globalThis);
