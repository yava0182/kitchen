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
  };

  var PLACEMENT_KIND_RU_LABELS = {
    floor_in_niche: 'Шкаф в нише (по высоте секции)',
    standalone_floor: 'Тумба напольная (фикс. высота)',
    wall_hung: 'Навесной верхний (legacy)',
    wall_hung_low: 'Навесной нижний (к полу)',
    wall_hung_high: 'Навесной верхний (к потолку)',
    corpus_only: 'Только корпус',
  };

  var PLACEMENT_KIND_BASE_OPTIONS = [
    { id: 'floor_in_niche', label: PLACEMENT_KIND_RU_LABELS.floor_in_niche },
    { id: 'standalone_floor', label: PLACEMENT_KIND_RU_LABELS.standalone_floor },
    { id: 'wall_hung_low', label: PLACEMENT_KIND_RU_LABELS.wall_hung_low },
    { id: 'wall_hung_high', label: PLACEMENT_KIND_RU_LABELS.wall_hung_high },
    { id: 'wall_hung', label: PLACEMENT_KIND_RU_LABELS.wall_hung },
    { id: 'corpus_only', label: PLACEMENT_KIND_RU_LABELS.corpus_only },
  ];

  var PLACEMENT_KIND_PRODUCT_OPTIONS = [
    { id: '', label: '— как у базового режима —' },
    { id: 'wardrobe', label: 'Шкаф (ниша)' },
    { id: 'pedestal', label: 'Тумба' },
    { id: 'console', label: 'Консоль' },
    { id: 'wall_hung', label: 'Навесной' },
  ];

  var SYSTEM_PROFILE_IDS = {
    floor_in_niche: 1,
    standalone_floor: 1,
    wall_hung: 1,
    wall_hung_low: 1,
    wall_hung_high: 1,
    corpus_only: 1,
  };

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

  function getDefaultPlacementKindProfiles() {
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

  /** Дописать системные профили (low/high), если в сохранённом конфиге их ещё нет. */
  function ensureSystemPlacementKindProfiles(profiles) {
    var list = Array.isArray(profiles) ? profiles.slice() : [];
    var defaults = getDefaultPlacementKindProfiles();
    var seen = {};
    for (var i = 0; i < list.length; i++) {
      var id = String((list[i] && (list[i].id != null ? list[i].id : list[i].key)) || '').trim();
      if (id) seen[id] = 1;
    }
    for (var j = 0; j < defaults.length; j++) {
      var d = defaults[j];
      var did = String(d.id || '').trim();
      if (!did || seen[did]) continue;
      // Вставляем low/high перед legacy wall_hung, остальное — в конец.
      if (did === 'wall_hung_low' || did === 'wall_hung_high') {
        var whIdx = -1;
        for (var k = 0; k < list.length; k++) {
          if (String((list[k] && list[k].id) || '').trim() === 'wall_hung') {
            whIdx = k;
            break;
          }
        }
        if (whIdx >= 0) list.splice(whIdx, 0, JSON.parse(JSON.stringify(d)));
        else list.push(JSON.parse(JSON.stringify(d)));
      } else {
        list.push(JSON.parse(JSON.stringify(d)));
      }
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

    return {
      id: id,
      label: (profile && profile.label && String(profile.label).trim()) || id,
      baseKind: baseKind,
      behavior: behavior,
      editPopup: editPopup,
      hinges: hinges,
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
      profiles = getDefaultPlacementKindProfiles();
    } else {
      profiles = ensureSystemPlacementKindProfiles(profiles);
    }
    var seen = {};
    for (var i = 0; i < profiles.length; i++) {
      var p = profiles[i];
      var id = String((p && (p.id != null ? p.id : p.key)) || '').trim();
      if (!id || seen[id]) continue;
      seen[id] = 1;
      var resolved = resolvePlacementKindProfile(id, config);
      var label =
        (resolved && resolved.label) ||
        (p && p.label) ||
        PLACEMENT_KIND_RU_LABELS[id] ||
        id;
      label = String(label).trim() || PLACEMENT_KIND_RU_LABELS[id] || id;
      // Не показывать сырой id, если в профиле забыли label.
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

    out.isFixedHeightModule = profile.behavior && profile.behavior.fixedHeight === true;
    out.syncHeightInSection = !(profile.behavior && profile.behavior.syncHeightInSection === false);

    return out;
  }

  /** Роль в ячейке: base (низ) | upper (верх) | full (один на всю высоту). */
  var ZONE_SLOT_ROLE = {
    BASE: 'base',
    UPPER: 'upper',
    FULL: 'full',
  };

  function _normSlotRole(raw) {
    var s = String(raw || '').trim().toLowerCase();
    if (s === ZONE_SLOT_ROLE.BASE || s === ZONE_SLOT_ROLE.UPPER || s === ZONE_SLOT_ROLE.FULL) {
      return s;
    }
    return ZONE_SLOT_ROLE.FULL;
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

    // full всегда без группы — не делит ячейку
    if (role === ZONE_SLOT_ROLE.FULL) group = '';

    return {
      role: role,
      group: group,
      placementKindId: String(placementKindId || '').trim(),
    };
  }

  function resolveZoneCohabitSpecFromUserData(userData, config) {
    var ud = userData || {};
    if (ud.__zoneSlotRole != null || ud.__cohabitGroup != null) {
      var role = _normSlotRole(ud.__zoneSlotRole);
      var group = role === ZONE_SLOT_ROLE.FULL ? '' : _normCohabitGroup(ud.__cohabitGroup);
      return {
        role: role,
        group: group,
        placementKindId: String(
          ud.__placementKindProfileId || ud.__placementKind || ud.placementKind || ''
        ).trim(),
      };
    }
    var profileId =
      String(ud.__placementKindProfileId || ud.placementKind || ud.__placementKind || '').trim() ||
      'floor_in_niche';
    return resolveZoneCohabitSpec(profileId, config, null);
  }

  /** Два модуля могут делить одну ячейку: одна группа, роли base+upper. */
  function canCohabitInSameZone(specA, specB) {
    if (!specA || !specB) return false;
    var gA = _normCohabitGroup(specA.group);
    var gB = _normCohabitGroup(specB.group);
    if (!gA || !gB || gA !== gB) return false;
    var rA = _normSlotRole(specA.role);
    var rB = _normSlotRole(specB.role);
    if (rA === ZONE_SLOT_ROLE.FULL || rB === ZONE_SLOT_ROLE.FULL) return false;
    if (rA === rB) return false;
    return (
      (rA === ZONE_SLOT_ROLE.BASE && rB === ZONE_SLOT_ROLE.UPPER) ||
      (rA === ZONE_SLOT_ROLE.UPPER && rB === ZONE_SLOT_ROLE.BASE)
    );
  }

  /**
   * При посадке pending: снести occupant?
   * — pending full / occupant full → да
   * — могут cohabit → нет
   * — иначе (та же роль / другая группа) → да (replace)
   */
  function shouldRemoveOccupantForIncoming(occupantSpec, pendingSpec) {
    if (!pendingSpec) return true;
    if (!occupantSpec) return false;
    if (
      _normSlotRole(pendingSpec.role) === ZONE_SLOT_ROLE.FULL ||
      _normSlotRole(occupantSpec.role) === ZONE_SLOT_ROLE.FULL
    ) {
      return true;
    }
    if (canCohabitInSameZone(occupantSpec, pendingSpec)) return false;
    return true;
  }

  var api = {
    PLACEMENT_KIND_RU_LABELS: PLACEMENT_KIND_RU_LABELS,
    PLACEMENT_KIND_BASE_PRESETS: PLACEMENT_KIND_BASE_PRESETS,
    PLACEMENT_KIND_BASE_OPTIONS: PLACEMENT_KIND_BASE_OPTIONS,
    PLACEMENT_KIND_PRODUCT_OPTIONS: PLACEMENT_KIND_PRODUCT_OPTIONS,
    ZONE_SLOT_ROLE: ZONE_SLOT_ROLE,
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
