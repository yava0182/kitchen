/**
 * Список «Тип модуля» в карточке каталога — кухонные placementKind без шкафных полей.
 */
(function (global) {
  var FALLBACK_RU = {
    floor_in_niche: 'Шкаф в нише (по высоте секции)',
    standalone_floor: 'Тумба напольная (фикс. высота)',
    wall_hung: 'Навесной верхний (legacy)',
    wall_hung_low: 'Навесной нижний (к полу)',
    wall_hung_high: 'Навесной верхний (к потолку)',
    corpus_only: 'Только корпус',
    kitchen_base: 'Напольный стол',
    kitchen_base_gola: 'Напольный стол (Gola)',
    kitchen_base_corner: 'Угловой напольный',
    kitchen_tall: 'Пенал',
    kitchen_wall_mid: 'Навесной 1-й ярус',
    kitchen_wall_top: 'Навесной 2-й ярус',
    kitchen_wall_corner: 'Угловой навесной',
  };

  function api() {
    return global.__cldPlacementKindProfiles || null;
  }

  function ruLabelForPlacementKind(id) {
    var key = String(id || '').trim();
    if (!key) return '';
    var pk = api();
    if (pk && pk.PLACEMENT_KIND_RU_LABELS && pk.PLACEMENT_KIND_RU_LABELS[key]) {
      return pk.PLACEMENT_KIND_RU_LABELS[key];
    }
    return FALLBACK_RU[key] || key;
  }

  function isKitchenUnitApp(app) {
    var pk = api();
    if (!pk || typeof pk.isKitchenUnitCatalogType !== 'function') return false;
    var adminType = (app && app.catalogType) || '';
    var itemType = app && app.item ? app.item.catalog_type : '';
    return !!pk.isKitchenUnitCatalogType(adminType, itemType);
  }

  function getPlacementKindOptions(app) {
    var pk = api();
    var cfg =
      typeof global.getRoomStepsConfig === 'function' ? global.getRoomStepsConfig() : null;
    var opts = [];
    if (pk && typeof pk.getPlacementKindOptionsForCatalog === 'function') {
      var fromCfg = pk.getPlacementKindOptionsForCatalog(cfg);
      if (Array.isArray(fromCfg) && fromCfg.length) opts = fromCfg.slice();
    }
    if (!opts.length && pk && Array.isArray(pk.PLACEMENT_KIND_BASE_OPTIONS)) {
      opts = pk.PLACEMENT_KIND_BASE_OPTIONS.slice();
    }
    if (!opts.length) {
      opts = [
        { id: 'kitchen_base', label: FALLBACK_RU.kitchen_base },
        { id: 'kitchen_base_gola', label: FALLBACK_RU.kitchen_base_gola },
        { id: 'kitchen_base_corner', label: FALLBACK_RU.kitchen_base_corner },
        { id: 'kitchen_tall', label: FALLBACK_RU.kitchen_tall },
        { id: 'kitchen_wall_mid', label: FALLBACK_RU.kitchen_wall_mid },
        { id: 'kitchen_wall_top', label: FALLBACK_RU.kitchen_wall_top },
        { id: 'kitchen_wall_corner', label: FALLBACK_RU.kitchen_wall_corner },
      ];
    }

    // Для модулей кухни — только kitchen_* типы.
    if (isKitchenUnitApp(app)) {
      opts = opts.filter(function (o) {
        return String(o && o.id || '').indexOf('kitchen_') === 0;
      });
      if (!opts.length && pk && typeof pk.getDefaultPlacementKindProfiles === 'function') {
        opts = pk.getDefaultPlacementKindProfiles(cfg).map(function (p) {
          return { id: p.id, label: p.label || ruLabelForPlacementKind(p.id) };
        });
      }
    }
    return opts;
  }

  function ensureKitchenPlacementKind(app, opts) {
    if (!app || !app.item || !isKitchenUnitApp(app)) return;
    var pk = api();
    var cur = String(app.item.placementKind || '').trim();
    var known = (opts || []).some(function (o) {
      return o && o.id === cur;
    });
    var legacy =
      pk && typeof pk.isLegacyWardrobePlacementKind === 'function'
        ? pk.isLegacyWardrobePlacementKind(cur)
        : false;
    if (cur && known && !legacy) return;
    var next =
      pk && typeof pk.defaultKitchenUnitPlacementKind === 'function'
        ? pk.defaultKitchenUnitPlacementKind(app.catalogType || app.item.catalog_type)
        : 'kitchen_base';
    if (typeof app.$set === 'function') {
      app.$set(app.item, 'placementKind', next);
    } else {
      app.item.placementKind = next;
    }
    // Тип каталога комнаты = раздел (Рабочие столы / навес…), не общий «Кухни».
    var section = '';
    try {
      var tagsApi = global.__cldRoomFurnitureTags;
      if (tagsApi && typeof tagsApi.kitchenFolderKeyForPlacement === 'function') {
        section = tagsApi.kitchenFolderKeyForPlacement(
          app.item.placementKind,
          app.catalogType
        );
      }
    } catch (_) {}
    var adminType = String(app.catalogType || '').replace(/^catalog_/, '');
    var nextType = section
      ? 'catalog_' + section
      : adminType
        ? 'catalog_' + adminType
        : 'catalog_46';
    if (typeof app.$set === 'function') app.$set(app.item, 'catalog_type', nextType);
    else app.item.catalog_type = nextType;
  }

  function syncPlacementKindOptions(app) {
    if (!app) return;
    var opts = getPlacementKindOptions(app);
    ensureKitchenPlacementKind(app, opts);
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

  global.__cldDefaultPlacementKindOptions = function () {
    return getPlacementKindOptions(global.catalogItemVueApp);
  };
  global.__cldSyncCatalogPlacementKindOptions = syncPlacementKindOptions;
  global.__cldIsKitchenUnitCatalogCard = function (app) {
    return isKitchenUnitApp(app || global.catalogItemVueApp);
  };
})(typeof window !== 'undefined' ? window : globalThis);
