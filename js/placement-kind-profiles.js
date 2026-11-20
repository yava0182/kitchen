/**
 * placementKind-профили: пресеты базовых режимов + слияние с room_steps_config.placementKindProfiles.
 * IIFE для admin-new и import как side-effect в main-refactored (window.__cldPlacementKindProfiles).
 */
(function (global) {
  var PLACEMENT_KIND_BASE_PRESETS = {
    floor_in_niche: {
      behavior: {
        fixedHeight: false,
        syncHeightInSection: false,
        anchorFrontOnDepthChange: false,
        useLayoutZones: true,
        allowNicheTransition: true,
        // full = один на ячейку; пустая группа = не делит ячейку ни с кем
        zoneSlotRole: 'full',
        cohabitGroup: '',
      },
      editPopup: {
        showHeight: false,
        showDepth: true,
        showWidth: true,
        heightMinCm: null,
        heightMaxCm: null,
        depthMinCm: null,
        depthMaxCm: null,
        heightLimitText: '',
        depthLimitText: '',
      },
      hinges: { productKind: 'wardrobe' },
    },
    standalone_floor: {
      behavior: {
        fixedHeight: true,
        fixedHeightCm: null,
        syncHeightInSection: true,
        anchorFrontOnDepthChange: true,
        useLayoutZones: false,
        allowNicheTransition: true,
        zoneSlotRole: 'base',
        cohabitGroup: 'wall_column',
      },
      editPopup: {
        showHeight: true,
        showDepth: true,
        showWidth: true,
        heightMinCm: 30,
        heightMaxCm: 120,
        depthMinCm: 30,
        depthMaxCm: 70,
        heightLimitText:
          'Введённая высота выходит за допустимые пределы. Выберите значение от {MIN} до {MAX} см.',
        depthLimitText: '',
      },
      hinges: { productKind: 'pedestal' },
    },
    wall_hung: {
      behavior: {
        fixedHeight: true,
        fixedHeightCm: null,
        syncHeightInSection: false,
        anchorFrontOnDepthChange: false,
        useLayoutZones: true,
        allowNicheTransition: true,
        wallHungAnchor: 'ceiling',
        zoneSlotRole: 'upper',
        cohabitGroup: 'wall_column',
      },
      editPopup: {
        showHeight: true,
        showDepth: true,
        showWidth: true,
        heightMinCm: 30,
        heightMaxCm: 120,
        depthMinCm: 20,
        depthMaxCm: 70,
        heightLimitText:
          'Введённая высота выходит за допустимые пределы. Выберите значение от {MIN} до {MAX} см.',
        depthLimitText: '',
      },
      hinges: { productKind: 'wall_hung' },
    },
    wall_hung_low: {
      behavior: {
        fixedHeight: true,
        fixedHeightCm: null,
        syncHeightInSection: true,
        anchorFrontOnDepthChange: true,
        useLayoutZones: true,
        allowNicheTransition: true,
        wallHungAnchor: 'floor',
        zoneSlotRole: 'base',
        cohabitGroup: 'wall_column',
      },
      editPopup: {
        showHeight: true,
        showDepth: true,
        showWidth: true,
        heightMinCm: 30,
        heightMaxCm: 120,
        depthMinCm: 20,
        depthMaxCm: 70,
        heightLimitText:
          'Введённая высота выходит за допустимые пределы. Выберите значение от {MIN} до {MAX} см.',
        depthLimitText: '',
      },
      hinges: { productKind: 'wall_hung' },
    },
    wall_hung_high: {
      behavior: {
        fixedHeight: true,
        fixedHeightCm: null,
        syncHeightInSection: true,
        anchorFrontOnDepthChange: false,
        useLayoutZones: true,
        allowNicheTransition: true,
        wallHungAnchor: 'ceiling',
        zoneSlotRole: 'upper',
        cohabitGroup: 'wall_column',
      },
      editPopup: {
        showHeight: true,
        showDepth: true,
        showWidth: true,
        heightMinCm: 30,
        heightMaxCm: 120,
        depthMinCm: 20,
        depthMaxCm: 70,
        heightLimitText:
          'Введённая высота выходит за допустимые пределы. Выберите значение от {MIN} до {MAX} см.',
        depthLimitText: '',
      },
      hinges: { productKind: 'wall_hung' },
    },
    corpus_only: {
      behavior: {
        fixedHeight: false,
        syncHeightInSection: false,
        anchorFrontOnDepthChange: false,
        useLayoutZones: true,
        allowNicheTransition: false,
        zoneSlotRole: 'full',
        cohabitGroup: '',
      },
      editPopup: {
        showHeight: false,
        showDepth: true,
        showWidth: true,
        heightMinCm: null,
        heightMaxCm: null,
        depthMinCm: null,
        depthMaxCm: null,
        heightLimitText: '',
        depthLimitText: '',
      },
      hinges: { productKind: 'wardrobe' },
    },
    // Кухня: поведение как standalone_floor; отдельные id для каталога / режимов фронта.
    kitchen_base: {
      behavior: {
        fixedHeight: true,
        fixedHeightCm: null,
        syncHeightInSection: true,
        anchorFrontOnDepthChange: true,
        useLayoutZones: false,
        allowNicheTransition: true,
        zoneSlotRole: 'base',
        cohabitGroup: 'kitchen_column',
        kitchenFrontMode: 'non_gola',
      },
      editPopup: {
        showHeight: true,
        showDepth: true,
        showWidth: true,
        heightMinCm: 82,
        heightMaxCm: 92,
        depthMinCm: 40,
        depthMaxCm: 70,
        // Этап 1 Kitchen Cell: допустимая ширина ячейки/корпуса (мм→см в UI).
        widthMinCm: 30,
        widthMaxCm: 120,
        heightLimitText:
          'Введённая высота выходит за допустимые пределы. Выберите значение от {MIN} до {MAX} см (корпус 720 + опоры 100–150).',
        depthLimitText: '',
        widthLimitText:
          'Ширина выходит за допустимые пределы модуля. Выберите значение от {MIN} до {MAX} см.',
      },
      hinges: { productKind: 'kitchen_base' },
    },
    kitchen_base_corner: {
      behavior: {
        fixedHeight: true,
        fixedHeightCm: null,
        syncHeightInSection: true,
        anchorFrontOnDepthChange: true,
        useLayoutZones: false,
        allowNicheTransition: true,
        zoneSlotRole: 'base',
        cohabitGroup: 'kitchen_column',
        kitchenFrontMode: 'non_gola',
        kitchenCorner: true,
      },
      editPopup: {
        showHeight: true,
        showDepth: true,
        showWidth: true,
        showSideWallClearance: true,
        heightMinCm: 82,
        heightMaxCm: 92,
        depthMinCm: 40,
        depthMaxCm: 70,
        widthMinCm: 30,
        widthMaxCm: 120,
        heightLimitText:
          'Введённая высота выходит за допустимые пределы. Выберите значение от {MIN} до {MAX} см (корпус 720 + опоры 100–150).',
        depthLimitText: '',
        widthLimitText:
          'Ширина выходит за допустимые пределы модуля. Выберите значение от {MIN} до {MAX} см.',
      },
      hinges: { productKind: 'kitchen_base' },
    },
    kitchen_base_gola: {
      behavior: {
        fixedHeight: true,
        fixedHeightCm: null,
        syncHeightInSection: true,
        anchorFrontOnDepthChange: true,
        useLayoutZones: false,
        allowNicheTransition: true,
        zoneSlotRole: 'base',
        cohabitGroup: 'kitchen_column',
        kitchenFrontMode: 'gola',
      },
      editPopup: {
        showHeight: true,
        showDepth: true,
        showWidth: true,
        heightMinCm: 82,
        heightMaxCm: 92,
        depthMinCm: 40,
        depthMaxCm: 70,
        heightLimitText:
          'Введённая высота выходит за допустимые пределы. Выберите значение от {MIN} до {MAX} см (корпус 720 + опоры 100–150).',
        depthLimitText: '',
      },
      hinges: { productKind: 'kitchen_base' },
    },
    kitchen_tall: {
      behavior: {
        fixedHeight: false,
        syncHeightInSection: false,
        anchorFrontOnDepthChange: false,
        useLayoutZones: true,
        allowNicheTransition: true,
        zoneSlotRole: 'full',
        // kitchen_column: пенал сносит base/mid, но делит ячейку с НШ2 (top).
        cohabitGroup: 'kitchen_column',
        kitchenFrontMode: 'non_gola',
      },
      editPopup: {
        showHeight: false,
        showDepth: true,
        showWidth: true,
        heightMinCm: null,
        heightMaxCm: null,
        depthMinCm: 40,
        depthMaxCm: 70,
        heightLimitText: '',
        depthLimitText: '',
      },
      hinges: { productKind: 'kitchen_tall' },
    },
    kitchen_wall_mid: {
      behavior: {
        fixedHeight: true,
        fixedHeightCm: null,
        syncHeightInSection: true,
        anchorFrontOnDepthChange: false,
        useLayoutZones: false,
        allowNicheTransition: false,
        wallHungAnchor: 'floor',
        // mid: с НМ (base) и НШ2 (top) в одной ячейке.
        zoneSlotRole: 'mid',
        cohabitGroup: 'kitchen_column',
        kitchenFrontMode: 'non_gola',
      },
      editPopup: {
        showHeight: true,
        showDepth: true,
        showWidth: true,
        heightMinCm: 40,
        heightMaxCm: 100,
        depthMinCm: 25,
        depthMaxCm: 45,
        heightLimitText:
          'Введённая высота выходит за допустимые пределы. Выберите значение от {MIN} до {MAX} см.',
        depthLimitText: '',
      },
      hinges: { productKind: 'kitchen_wall' },
    },
    kitchen_wall_top: {
      behavior: {
        fixedHeight: true,
        fixedHeightCm: null,
        syncHeightInSection: true,
        anchorFrontOnDepthChange: false,
        useLayoutZones: false,
        allowNicheTransition: false,
        wallHungAnchor: 'floor',
        // top: 2-й ярус; низ = верх НШ1 / верх корпуса пенала.
        zoneSlotRole: 'top',
        cohabitGroup: 'kitchen_column',
        kitchenFrontMode: 'non_gola',
      },
      editPopup: {
        showHeight: true,
        showDepth: true,
        showWidth: true,
        heightMinCm: 30,
        heightMaxCm: 80,
        // НШ2: 20…70 см (не как НШ1 ≤45 — иначе карандаш режет 55→45).
        depthMinCm: 20,
        depthMaxCm: 70,
        heightLimitText:
          'Введённая высота выходит за допустимые пределы. Выберите значение от {MIN} до {MAX} см.',
        depthLimitText: '',
      },
      hinges: { productKind: 'kitchen_wall' },
    },
    kitchen_wall_corner: {
      behavior: {
        fixedHeight: true,
        fixedHeightCm: null,
        syncHeightInSection: true,
        anchorFrontOnDepthChange: true,
        useLayoutZones: true,
        allowNicheTransition: true,
        wallHungAnchor: 'floor',
        // mid: над НМУ (base) в той же спец-ячейке, как kitchen_wall_mid.
        zoneSlotRole: 'mid',
        cohabitGroup: 'kitchen_column',
        kitchenFrontMode: 'non_gola',
        kitchenCorner: true,
      },
      editPopup: {
        showHeight: true,
        showDepth: true,
        showWidth: true,
        heightMinCm: 40,
        heightMaxCm: 100,
        depthMinCm: 25,
        depthMaxCm: 45,
        heightLimitText:
          'Введённая высота выходит за допустимые пределы. Выберите значение от {MIN} до {MAX} см.',
        depthLimitText: '',
      },
      hinges: { productKind: 'kitchen_wall' },
    },
  };

  /** Профили типов размещения для kitchen-playground (Clodis-Kitchen). */
  var KITCHEN_PLACEMENT_PROFILE_IDS = {
    kitchen_base: 1,
    kitchen_base_gola: 1,
    kitchen_base_corner: 1,
    kitchen_tall: 1,
    kitchen_wall_mid: 1,
    kitchen_wall_top: 1,
    kitchen_wall_corner: 1,
  };

  /** Каталоги модулей кухни (не фасады/ящики/цоколь) — упрощённая карточка «Основных». */
  var KITCHEN_UNIT_CATALOG_TYPES = {
    catalog_1: 1,
    catalog_41: 1,
    catalog_42: 1,
    catalog_43: 1,
    catalog_44: 1,
    catalog_45: 1,
    catalog_46: 1,
    catalog_50: 1,
    catalog_51: 1,
    catalog_54: 1,
    catalog_55: 1,
  };

  var PLACEMENT_KIND_RU_LABELS = {
    // Технические baseKind (движок) — подписи для кухни, без шкафной терминологии
    floor_in_niche: 'По высоте секции (пенал)',
    standalone_floor: 'Напольный фикс. высоты (стол)',
    wall_hung: 'Навесной к потолку (legacy)',
    wall_hung_low: 'Навесной от пола',
    wall_hung_high: 'Навесной к потолку',
    corpus_only: 'Только корпус',
    kitchen_base: 'Напольный стол',
    kitchen_base_gola: 'Напольный стол (Gola)',
    kitchen_base_corner: 'Угловой напольный',
    kitchen_tall: 'Пенал',
    kitchen_wall_mid: 'Навесной 1-й ярус',
    kitchen_wall_top: 'Навесной 2-й ярус',
    kitchen_wall_corner: 'Угловой навесной',
  };

  /** Базовые режимы движка (для поля «Базовый режим» в редакторе профиля). */
  var PLACEMENT_KIND_BASE_OPTIONS = [
    { id: 'standalone_floor', label: PLACEMENT_KIND_RU_LABELS.standalone_floor },
    { id: 'floor_in_niche', label: PLACEMENT_KIND_RU_LABELS.floor_in_niche },
    { id: 'wall_hung_low', label: PLACEMENT_KIND_RU_LABELS.wall_hung_low },
    { id: 'wall_hung_high', label: PLACEMENT_KIND_RU_LABELS.wall_hung_high },
  ];

  var PLACEMENT_KIND_PRODUCT_OPTIONS = [
    { id: '', label: '— как у типа модуля —' },
    { id: 'kitchen_base', label: 'Напольный стол' },
    { id: 'kitchen_tall', label: 'Пенал' },
    { id: 'kitchen_wall', label: 'Навесной модуль' },
  ];

  var SYSTEM_PROFILE_IDS = KITCHEN_PLACEMENT_PROFILE_IDS;

  function isKitchenUnitCatalogType(adminCatalogType, itemCatalogType) {
    var a = String(adminCatalogType || '')
      .trim()
      .toLowerCase();
    var b = String(itemCatalogType || '')
      .trim()
      .toLowerCase();
    return !!(KITCHEN_UNIT_CATALOG_TYPES[a] || KITCHEN_UNIT_CATALOG_TYPES[b]);
  }

  function isLegacyWardrobePlacementKind(id) {
    var s = String(id || '').trim();
    return (
      s === 'floor_in_niche' ||
      s === 'standalone_floor' ||
      s === 'wall_hung' ||
      s === 'wall_hung_low' ||
      s === 'wall_hung_high' ||
      s === 'corpus_only'
    );
  }

  function defaultKitchenUnitPlacementKind(adminCatalogType) {
    var t = String(adminCatalogType || '')
      .trim()
      .toLowerCase();
    if (t === 'catalog_42' || t === 'catalog_43' || t === 'catalog_50') return 'kitchen_wall_mid';
    if (t === 'catalog_51') return 'kitchen_wall_top';
    if (t === 'catalog_44') return 'kitchen_base_corner';
    if (t === 'catalog_54') return 'kitchen_wall_corner';
    if (t === 'catalog_41' || t === 'catalog_48') return 'kitchen_tall';
    return 'kitchen_base';
  }

  function shallowMergeSection(base, custom) {
    var out = {};
    var bk;
    if (base) {
      for (bk in base) {
        if (Object.prototype.hasOwnProperty.call(base, bk)) out[bk] = base[bk];
      }
    }
    if (custom && typeof custom === 'object') {
      for (bk in custom) {
        if (!Object.prototype.hasOwnProperty.call(custom, bk)) continue;
        var v = custom[bk];
        if (v !== undefined && v !== null && v !== '') out[bk] = v;
      }
    }
    return out;
  }

  function isKitchenProductLine(config) {
    var cfg = config || null;
    if (cfg && String(cfg.productLine || '').trim().toLowerCase() === 'kitchen') return true;
    try {
      if (typeof global.getRoomStepsConfig === 'function') {
        var live = global.getRoomStepsConfig();
        if (live && String(live.productLine || '').trim().toLowerCase() === 'kitchen') return true;
      }
    } catch (_) {}
    return true;
  }

  function getDefaultPlacementKindProfiles(config) {
    if (!isKitchenProductLine(config)) {
      return [
        { id: 'floor_in_niche', label: 'Шкаф в нише', baseKind: 'floor_in_niche', settings: {} },
        { id: 'standalone_floor', label: 'Тумба напольная', baseKind: 'standalone_floor', settings: {} },
        {
          id: 'wall_hung_low',
          label: PLACEMENT_KIND_RU_LABELS.wall_hung_low,
          baseKind: 'wall_hung_low',
          settings: {},
        },
        {
          id: 'wall_hung_high',
          label: PLACEMENT_KIND_RU_LABELS.wall_hung_high,
          baseKind: 'wall_hung_high',
          settings: {},
        },
        {
          id: 'wall_hung',
          label: PLACEMENT_KIND_RU_LABELS.wall_hung,
          baseKind: 'wall_hung',
          settings: {},
        },
        { id: 'corpus_only', label: 'Только корпус', baseKind: 'corpus_only', settings: {} },
      ];
    }
    return [
      {
        id: 'kitchen_base',
        label: PLACEMENT_KIND_RU_LABELS.kitchen_base,
        baseKind: 'standalone_floor',
        settings: {
          frontMode: 'non_gola',
          behavior: {
            kitchenFrontMode: 'non_gola',
            kitchenCarcassOnlyHeight: true,
            cohabitGroup: 'kitchen_column',
            zoneSlotRole: 'base',
          },
          editPopup: PLACEMENT_KIND_BASE_PRESETS.kitchen_base.editPopup,
          hinges: { productKind: 'kitchen_base' },
        },
      },
      {
        id: 'kitchen_base_gola',
        label: PLACEMENT_KIND_RU_LABELS.kitchen_base_gola,
        baseKind: 'standalone_floor',
        settings: {
          frontMode: 'gola',
          behavior: {
            kitchenFrontMode: 'gola',
            kitchenCarcassOnlyHeight: true,
            cohabitGroup: 'kitchen_column',
            zoneSlotRole: 'base',
          },
          editPopup: PLACEMENT_KIND_BASE_PRESETS.kitchen_base_gola.editPopup,
          hinges: { productKind: 'kitchen_base' },
        },
      },
      {
        id: 'kitchen_base_corner',
        label: PLACEMENT_KIND_RU_LABELS.kitchen_base_corner,
        baseKind: 'standalone_floor',
        settings: {
          frontMode: 'non_gola',
          behavior: {
            kitchenFrontMode: 'non_gola',
            kitchenCarcassOnlyHeight: true,
            kitchenCorner: true,
            cohabitGroup: 'kitchen_column',
            zoneSlotRole: 'base',
          },
          editPopup: PLACEMENT_KIND_BASE_PRESETS.kitchen_base_corner.editPopup,
          hinges: { productKind: 'kitchen_base' },
        },
      },
      {
        id: 'kitchen_tall',
        label: PLACEMENT_KIND_RU_LABELS.kitchen_tall,
        baseKind: 'floor_in_niche',
        settings: {
          frontMode: 'non_gola',
          behavior: {
            kitchenFrontMode: 'non_gola',
            zoneSlotRole: 'full',
            cohabitGroup: 'kitchen_column',
          },
          editPopup: PLACEMENT_KIND_BASE_PRESETS.kitchen_tall.editPopup,
          hinges: { productKind: 'kitchen_tall' },
        },
      },
      {
        id: 'kitchen_wall_mid',
        label: PLACEMENT_KIND_RU_LABELS.kitchen_wall_mid,
        baseKind: 'wall_hung_low',
        settings: {
          behavior: {
            kitchenFrontMode: 'non_gola',
            zoneSlotRole: 'mid',
            cohabitGroup: 'kitchen_column',
          },
          editPopup: PLACEMENT_KIND_BASE_PRESETS.kitchen_wall_mid.editPopup,
          hinges: { productKind: 'kitchen_wall' },
        },
      },
      {
        id: 'kitchen_wall_top',
        label: PLACEMENT_KIND_RU_LABELS.kitchen_wall_top,
        baseKind: 'wall_hung_high',
        settings: {
          behavior: {
            kitchenFrontMode: 'non_gola',
            zoneSlotRole: 'top',
            cohabitGroup: 'kitchen_column',
          },
          editPopup: PLACEMENT_KIND_BASE_PRESETS.kitchen_wall_top.editPopup,
          hinges: { productKind: 'kitchen_wall' },
        },
      },
      {
        id: 'kitchen_wall_corner',
        label: PLACEMENT_KIND_RU_LABELS.kitchen_wall_corner,
        baseKind: 'wall_hung_low',
        settings: {
          behavior: {
            kitchenFrontMode: 'non_gola',
            kitchenCorner: true,
            zoneSlotRole: 'mid',
            cohabitGroup: 'kitchen_column',
          },
          editPopup: PLACEMENT_KIND_BASE_PRESETS.kitchen_wall_corner.editPopup,
          hinges: { productKind: 'kitchen_wall' },
        },
      },
    ];
  }

  /** Для kitchen — всегда актуальный кухонный набор (без шкафных id и старых подписей). */
  function ensureSystemPlacementKindProfiles(profiles, config) {
    var cfg = config || null;
    if (isKitchenProductLine(cfg)) {
      return getDefaultPlacementKindProfiles(cfg);
    }
    var defaults = getDefaultPlacementKindProfiles(cfg);
    var list = Array.isArray(profiles) ? profiles.slice() : [];
    var seen = {};
    for (var i = 0; i < list.length; i++) {
      var id = String((list[i] && (list[i].id != null ? list[i].id : list[i].key)) || '').trim();
      if (id) seen[id] = 1;
    }
    for (var j = 0; j < defaults.length; j++) {
      var d = defaults[j];
      var did = String(d.id || '').trim();
      if (!did || seen[did]) continue;
      list.push(JSON.parse(JSON.stringify(d)));
      seen[did] = 1;
    }
    return list;
  }

  function isSystemPlacementKindProfile(id) {
    return !!SYSTEM_PROFILE_IDS[String(id || '').trim()];
  }

  function getBasePreset(baseKind) {
    var bk = String(baseKind || 'floor_in_niche').trim();
    return PLACEMENT_KIND_BASE_PRESETS[bk] || PLACEMENT_KIND_BASE_PRESETS.floor_in_niche;
  }

  function resolvePlacementKindProfile(placementKindId, config) {
    var id = String(placementKindId || '').trim();
    if (!id) return null;

    var profile = null;
    var profiles =
      (config &&
        (config.placementKindProfiles ||
          config.placementKinds ||
          config.placementKindsProfiles)) ||
      null;
    if (Array.isArray(profiles)) {
      for (var i = 0; i < profiles.length; i++) {
        var p = profiles[i];
        var pid = String((p && (p.id != null ? p.id : p.key)) || '').trim();
        if (pid && pid === id) {
          profile = p;
          break;
        }
      }
    }

    var baseKind = String(
      (profile && (profile.baseKind != null ? profile.baseKind : profile.base != null ? profile.base : profile.basePlacementKind)) ||
        id
    ).trim();
    var preset = getBasePreset(baseKind);
    var custom =
      profile && profile.settings && typeof profile.settings === 'object' ? profile.settings : {};

    var behavior = shallowMergeSection(preset.behavior, custom.behavior);
    var editPopup = {};
    var ek;
    for (ek in preset.editPopup) {
      if (Object.prototype.hasOwnProperty.call(preset.editPopup, ek)) {
        editPopup[ek] = preset.editPopup[ek];
      }
    }
    if (custom.editPopup) {
      for (ek in custom.editPopup) {
        if (!Object.prototype.hasOwnProperty.call(custom.editPopup, ek)) continue;
        var ev = custom.editPopup[ek];
        if (ev === null || ev === '') {
          if (preset.editPopup[ek] != null && preset.editPopup[ek] !== '') {
            editPopup[ek] = preset.editPopup[ek];
          }
        } else {
          editPopup[ek] = ev;
        }
      }
    }

    var hingesCustom = custom.hinges || {};
    var hinges = {
      productKind:
        typeof hingesCustom.productKind === 'string' && hingesCustom.productKind.trim()
          ? hingesCustom.productKind.trim()
          : preset.hinges.productKind,
    };

    var carcassHeightMm = null;
    try {
      var ch = Number(
        custom.carcassHeightMm != null
          ? custom.carcassHeightMm
          : custom.rhythm && custom.rhythm.carcassHeightMm
      );
      if (ch >= 500 && ch <= 1000) carcassHeightMm = Math.round(ch);
    } catch (_) {}
    if (carcassHeightMm == null) {
      if (id === 'kitchen_base_gola') carcassHeightMm = 780;
      else if (id === 'kitchen_base' || id === 'kitchen_base_corner') carcassHeightMm = 720;
    }

    return {
      id: id,
      label:
        PLACEMENT_KIND_RU_LABELS[id] ||
        (profile && profile.label && String(profile.label).trim()) ||
        id,
      baseKind: baseKind,
      behavior: behavior,
      editPopup: editPopup,
      hinges: hinges,
      carcassHeightMm: carcassHeightMm,
      hasCustomSettings: !!(profile && profile.settings && Object.keys(profile.settings).length > 0),
    };
  }

  function resolvePlacementKindProfileForGroup(userData, config) {
    var ud = userData || {};
    var profileId =
      String(ud.__placementKindProfileId || ud.placementKind || ud.__placementKind || '').trim() ||
      'floor_in_niche';
    return resolvePlacementKindProfile(profileId, config);
  }

  function placementKindHasBehavior(placementKindId, flag, config) {
    var r = resolvePlacementKindProfile(placementKindId, config);
    return !!(r && r.behavior && r.behavior[flag] === true);
  }

  function getProfileFixedHeightMm(placementKindId, config) {
    var r = resolvePlacementKindProfile(placementKindId, config);
    if (!r || !r.behavior || r.behavior.fixedHeight !== true) return 0;
    var cm = r.behavior.fixedHeightCm;
    if (typeof cm === 'number' && cm > 0) return Math.round(cm * 10);
    return 0;
  }

  function getPlacementKindOptionsForCatalog(config) {
    var options = [];
    var profiles =
      (config &&
        (config.placementKindProfiles ||
          config.placementKinds ||
          config.placementKindsProfiles)) ||
      null;
    if (!Array.isArray(profiles) || !profiles.length) {
      profiles = getDefaultPlacementKindProfiles(config);
    } else {
      profiles = ensureSystemPlacementKindProfiles(profiles, config);
    }
    var seen = {};
    for (var i = 0; i < profiles.length; i++) {
      var p = profiles[i];
      var id = String((p && (p.id != null ? p.id : p.key)) || '').trim();
      if (!id || seen[id]) continue;
      seen[id] = 1;
      var resolved = resolvePlacementKindProfile(id, config);
      // Канонические RU-подписи важнее устаревших label из room_steps_config.
      var label =
        PLACEMENT_KIND_RU_LABELS[id] ||
        (p && p.label) ||
        (resolved && resolved.label) ||
        id;
      label = String(label).trim() || PLACEMENT_KIND_RU_LABELS[id] || id;
      if (label === id && PLACEMENT_KIND_RU_LABELS[id]) label = PLACEMENT_KIND_RU_LABELS[id];
      options.push({ id: id, label: label });
    }
    return options;
  }

  function resolveProductKindForPlacement(placementKindId, config) {
    var r = resolvePlacementKindProfile(placementKindId, config);
    if (r && r.hinges && r.hinges.productKind) return r.hinges.productKind;
    var bk = (r && r.baseKind) || placementKindId;
    var preset = getBasePreset(bk);
    return (preset.hinges && preset.hinges.productKind) || 'wardrobe';
  }

  function applyEditPopupOverridesFromProfile(editState, profile, step4Fallback) {
    if (!profile || !profile.editPopup) return editState;
    var ep = profile.editPopup;
    var out = {};
    var k;
    for (k in editState) {
      if (Object.prototype.hasOwnProperty.call(editState, k)) out[k] = editState[k];
    }
    var s4 = step4Fallback || {};

    if (ep.showHeight === true) out.showHeight = true;
    if (ep.showHeight === false) out.showHeight = false;
    if (ep.showDepth === false) out.showDepth = false;
    if (ep.showWidth === false) out.showWidth = false;
    if (ep.showWidth === true) out.showWidth = true;

    if (typeof ep.heightMinCm === 'number' && ep.heightMinCm > 0) out.heightMinCm = ep.heightMinCm;
    else if (s4.heightMinCm != null) out.heightMinCm = s4.heightMinCm;

    if (typeof ep.heightMaxCm === 'number' && ep.heightMaxCm > 0) out.heightMaxCm = ep.heightMaxCm;
    else if (s4.heightMaxCm != null) out.heightMaxCm = s4.heightMaxCm;

    if (typeof ep.depthMinCm === 'number' && ep.depthMinCm > 0) out.depthMinCm = ep.depthMinCm;
    else if (s4.depthMinCm != null) out.depthMinCm = s4.depthMinCm;

    if (typeof ep.depthMaxCm === 'number' && ep.depthMaxCm > 0) out.depthMaxCm = ep.depthMaxCm;
    else if (s4.depthMaxCm != null) out.depthMaxCm = s4.depthMaxCm;

    if (typeof ep.widthMinCm === 'number' && ep.widthMinCm > 0) out.widthMinCm = ep.widthMinCm;
    if (typeof ep.widthMaxCm === 'number' && ep.widthMaxCm > 0) out.widthMaxCm = ep.widthMaxCm;

    if (typeof ep.heightLimitText === 'string' && ep.heightLimitText.trim()) {
      out.heightLimitTextTemplate = ep.heightLimitText.trim();
    } else if (s4.heightLimitText) {
      out.heightLimitTextTemplate = s4.heightLimitText;
    }

    if (typeof ep.depthLimitText === 'string' && ep.depthLimitText.trim()) {
      out.depthLimitTextTemplate = ep.depthLimitText.trim();
    } else if (s4.depthLimitText) {
      out.depthLimitTextTemplate = s4.depthLimitText;
    }

    if (typeof ep.widthLimitText === 'string' && ep.widthLimitText.trim()) {
      out.widthLimitTextTemplate = ep.widthLimitText.trim();
    } else if (s4.widthLimitText) {
      out.widthLimitTextTemplate = s4.widthLimitText;
    }

    out.isFixedHeightModule = profile.behavior && profile.behavior.fixedHeight === true;
    out.syncHeightInSection = !(profile.behavior && profile.behavior.syncHeightInSection === false);

    return out;
  }

  /**
   * Роль в ячейке:
   * - шкаф wall_column: base | upper | full
   * - кухня kitchen_column: base | mid | top | full
   */
  var ZONE_SLOT_ROLE = {
    BASE: 'base',
    UPPER: 'upper',
    MID: 'mid',
    TOP: 'top',
    FULL: 'full',
  };

  function _normSlotRole(raw) {
    var s = String(raw || '').trim().toLowerCase();
    if (
      s === ZONE_SLOT_ROLE.BASE ||
      s === ZONE_SLOT_ROLE.UPPER ||
      s === ZONE_SLOT_ROLE.MID ||
      s === ZONE_SLOT_ROLE.TOP ||
      s === ZONE_SLOT_ROLE.FULL
    ) {
      return s;
    }
    return ZONE_SLOT_ROLE.FULL;
  }

  /** Кухня: upper (legacy) = mid. */
  function _kitchenColumnRole(role) {
    var r = _normSlotRole(role);
    if (r === ZONE_SLOT_ROLE.UPPER) return ZONE_SLOT_ROLE.MID;
    return r;
  }

  function _normCohabitGroup(raw) {
    return String(raw || '').trim();
  }

  /**
   * Спека совместности для placementKind (+ опциональный override с карточки каталога).
   * catalogItem: { zoneSlotRole?, cohabitGroup? } — комната/папка не важны.
   */
  function resolveZoneCohabitSpec(placementKindId, config, catalogItem) {
    var item = catalogItem && typeof catalogItem === 'object' ? catalogItem : null;
    var fromItemRole = item
      ? item.zoneSlotRole != null
        ? item.zoneSlotRole
        : item.zone_slot_role
      : null;
    var fromItemGroup = item
      ? item.cohabitGroup != null
        ? item.cohabitGroup
        : item.cohabit_group
      : null;

    var resolved = resolvePlacementKindProfile(placementKindId, config);
    var b = (resolved && resolved.behavior) || {};
    var role =
      fromItemRole != null && String(fromItemRole).trim() !== ''
        ? _normSlotRole(fromItemRole)
        : _normSlotRole(b.zoneSlotRole);
    var group =
      fromItemGroup != null && String(fromItemGroup).trim() !== ''
        ? _normCohabitGroup(fromItemGroup)
        : _normCohabitGroup(b.cohabitGroup);

    // Шкафной full — без группы. Кухонный пенал держит kitchen_column (НШ2 сверху).
    if (role === ZONE_SLOT_ROLE.FULL) {
      var pkFull = String(placementKindId || '').trim();
      if (pkFull === 'kitchen_tall' || group === 'kitchen_column') {
        group = 'kitchen_column';
      } else {
        group = '';
      }
    }

    return {
      role: role,
      group: group,
      placementKindId: String(placementKindId || '').trim(),
    };
  }

  function resolveZoneCohabitSpecFromUserData(userData, config) {
    var ud = userData || {};
    var profileId =
      String(ud.__placementKindProfileId || ud.placementKind || ud.__placementKind || '').trim() ||
      'floor_in_niche';
    // Кухня: роль всегда из профиля (не залипший stamp base у НШ1 после старого конфига).
    if (/^kitchen_/i.test(profileId)) {
      var fromProfile = resolveZoneCohabitSpec(profileId, config, null);
      // Подлечить stamp на модуле, чтобы UI/layout не читали устаревшее.
      try {
        ud.__zoneSlotRole = fromProfile.role;
        ud.__cohabitGroup = fromProfile.group || '';
      } catch (_) {}
      return fromProfile;
    }
    if (ud.__zoneSlotRole != null || ud.__cohabitGroup != null) {
      var role = _normSlotRole(ud.__zoneSlotRole);
      var group = role === ZONE_SLOT_ROLE.FULL ? '' : _normCohabitGroup(ud.__cohabitGroup);
      return {
        role: role,
        group: group,
        placementKindId: profileId,
      };
    }
    return resolveZoneCohabitSpec(profileId, config, null);
  }

  /**
   * Два модуля могут делить одну ячейку:
   * - kitchen_column: base|mid|top между собой; full(пенал)+top(НШ2)
   * - wall_column (шкаф): base + upper
   */
  function canCohabitInSameZone(specA, specB) {
    if (!specA || !specB) return false;
    var gA = _normCohabitGroup(specA.group);
    var gB = _normCohabitGroup(specB.group);
    if (!gA || !gB || gA !== gB) return false;
    var rA = _normSlotRole(specA.role);
    var rB = _normSlotRole(specB.role);
    if (gA === 'kitchen_column') {
      rA = _kitchenColumnRole(rA);
      rB = _kitchenColumnRole(rB);
      // Пенал + НШ2 (антресоль отдельно над корпусом).
      if (
        (rA === ZONE_SLOT_ROLE.FULL && rB === ZONE_SLOT_ROLE.TOP) ||
        (rA === ZONE_SLOT_ROLE.TOP && rB === ZONE_SLOT_ROLE.FULL)
      ) {
        return true;
      }
      if (rA === ZONE_SLOT_ROLE.FULL || rB === ZONE_SLOT_ROLE.FULL) return false;
      var ok = { base: 1, mid: 1, top: 1 };
      if (!ok[rA] || !ok[rB]) return false;
      return rA !== rB;
    }
    if (rA === ZONE_SLOT_ROLE.FULL || rB === ZONE_SLOT_ROLE.FULL) return false;
    if (rA === rB) return false;
    return (
      (rA === ZONE_SLOT_ROLE.BASE && rB === ZONE_SLOT_ROLE.UPPER) ||
      (rA === ZONE_SLOT_ROLE.UPPER && rB === ZONE_SLOT_ROLE.BASE)
    );
  }

  /**
   * При посадке pending: снести occupant?
   * — могут cohabit (в т.ч. пенал+НШ2) → нет
   * — pending/occupant full (иначе) → да
   * — иначе (та же роль / другая группа) → да (replace)
   */
  function shouldRemoveOccupantForIncoming(occupantSpec, pendingSpec) {
    if (!pendingSpec) return true;
    if (!occupantSpec) return false;
    if (canCohabitInSameZone(occupantSpec, pendingSpec)) return false;
    if (
      _normSlotRole(pendingSpec.role) === ZONE_SLOT_ROLE.FULL ||
      _normSlotRole(occupantSpec.role) === ZONE_SLOT_ROLE.FULL
    ) {
      return true;
    }
    return true;
  }

  var api = {
    PLACEMENT_KIND_RU_LABELS: PLACEMENT_KIND_RU_LABELS,
    PLACEMENT_KIND_BASE_PRESETS: PLACEMENT_KIND_BASE_PRESETS,
    PLACEMENT_KIND_BASE_OPTIONS: PLACEMENT_KIND_BASE_OPTIONS,
    PLACEMENT_KIND_PRODUCT_OPTIONS: PLACEMENT_KIND_PRODUCT_OPTIONS,
    KITCHEN_UNIT_CATALOG_TYPES: KITCHEN_UNIT_CATALOG_TYPES,
    ZONE_SLOT_ROLE: ZONE_SLOT_ROLE,
    isKitchenProductLine: isKitchenProductLine,
    isKitchenUnitCatalogType: isKitchenUnitCatalogType,
    isLegacyWardrobePlacementKind: isLegacyWardrobePlacementKind,
    defaultKitchenUnitPlacementKind: defaultKitchenUnitPlacementKind,
    getDefaultPlacementKindProfiles: getDefaultPlacementKindProfiles,
    ensureSystemPlacementKindProfiles: ensureSystemPlacementKindProfiles,
    isSystemPlacementKindProfile: isSystemPlacementKindProfile,
    getBasePreset: getBasePreset,
    resolvePlacementKindProfile: resolvePlacementKindProfile,
    resolvePlacementKindProfileForGroup: resolvePlacementKindProfileForGroup,
    placementKindHasBehavior: placementKindHasBehavior,
    getProfileFixedHeightMm: getProfileFixedHeightMm,
    getPlacementKindOptionsForCatalog: getPlacementKindOptionsForCatalog,
    resolveProductKindForPlacement: resolveProductKindForPlacement,
    applyEditPopupOverridesFromProfile: applyEditPopupOverridesFromProfile,
    resolveZoneCohabitSpec: resolveZoneCohabitSpec,
    resolveZoneCohabitSpecFromUserData: resolveZoneCohabitSpecFromUserData,
    canCohabitInSameZone: canCohabitInSameZone,
    shouldRemoveOccupantForIncoming: shouldRemoveOccupantForIncoming,
  };

  global.__cldPlacementKindProfiles = api;
})(typeof window !== 'undefined' ? window : globalThis);
