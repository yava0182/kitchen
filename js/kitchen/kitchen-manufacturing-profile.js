/**
 * KitchenManufacturingProfile — единый черновик размерной сетки кухни (CLODIS).
 * Эталон: docs/kitchen_configurator_research_cursor.md
 *
 * Статусы чисел: source_example | project_default | manufacturer_required | appliance_required
 * Не хардкодить «европейский стандарт» — nobilia/Schüller/Nolte только как сравнительные семейства.
 */
(function (global) {
  'use strict';

  var PROFILE_URL = '/data/kitchen_manufacturing_profile.json';
  var LS_KEY = 'cld_kitchen_manufacturing_profile';
  var PROJECT_LS_KEY = 'cld_kitchen_project_state';
  var ETALON = 'docs/kitchen_configurator_research_cursor.md';
  /** Три высоты опор ряда — не три артикула корпуса. */
  var SUPPORT_HEIGHTS_MM = [100, 120, 150];
  var DEFAULT_SUPPORT_MM = 100;
  /**
   * Реестр SKU опор (cabinet_model.id) по высоте — производство / BOM.
   * Карточка модуля может сузить/переопределить через data.kitchenSupports.
   * Не путать с catalog_32 (сборка «Цоколь»), там живут модули-сборки, не ножки.
   */
  var DEFAULT_SUPPORT_CABINET_MODEL_IDS = {
    100: '2',
    120: '79',
    150: '80',
  };
  /** Информационные высоты корпуса для шага 3 (факт — из артикула). */
  var INFO_CARCASS_NON_GOLA_MM = 720;
  var INFO_CARCASS_GOLA_MM = 780;
  /**
   * Дефолт mid (верх НМ → низ НШ1). Факт — из room_steps_config.kitchenRhythm
   * с вилкой min/max; в проекте можно переопределить в допуске.
   */
  var INFO_BAND_MID_MM = 600;
  var INFO_BAND_MID_MIN_MM = 560;
  var INFO_BAND_MID_MAX_MM = 650;

  /**
   * Глубина НМ: столешница секции ведёт.
   * Спереди всегда −40; сзади ≥10 (можно больше).
   * max = Dwt − 40 − 10; min — пока 150 (тест; позже из «Управление комнатой 2»).
   * Preset-сетка 550/510/460 — только ориентир/legacy, не жёсткий выбор.
   */
  var BASE_CARCASS_DEPTHS_MM = [550, 510, 460];
  var MIN_BASE_CARCASS_DEPTH_MM = 150;
  var DEFAULT_WORKTOP_DEPTH_MM = 600;
  var FRONT_SETBACK_TO_CARCASS_MM = 40;
  var REAR_OVERHANG_MIN_MM = 10;

  /** Встроенный fallback, если JSON ещё не подтянут. */
  function getBuiltinDraftProfile() {
    return {
      id: 'clodis_draft',
      version: 2,
      status: 'project_default',
      requiresApproval: true,
      label: 'CLODIS kitchen draft (nobilia-like, не лицензия)',
      etalonDoc: ETALON,
      referenceFamily: {
        id: 'nobilia_like',
        status: 'source_example',
        note: 'Только ориентир сетки; не каталог nobilia и не финальные размеры CLODIS.',
        sources: ['S1'],
      },
      units: 'mm',
      base: {
        carcassHeightsMm: [
          { value: 720, status: 'project_default', frontMode: 'non_gola' },
          { value: 792, status: 'project_default', frontMode: 'any' },
          {
            value: 780,
            status: 'project_default',
            frontMode: 'gola',
            note: 'CLODIS Gola: корпус 780 + опоры 100/120/150. Не 864 nobilia.',
          },
        ],
        carcassDepthsMm: [
          { value: 550, status: 'project_default', note: 'Ориентир: при столешнице 600 дефолт = 600−40−10.' },
          { value: 510, status: 'source_example' },
          { value: 460, status: 'source_example' },
        ],
        minCarcassDepthMm: { value: 150, status: 'project_default', note: 'Тест; позже из управления комнатой 2.' },
        /** @deprecated use continuous range; оставлено для старых читателей */
        carcassDepthMm: { value: 550, status: 'project_default' },
        note: 'Глубина НМ: свободно min…(Dwt−40−10); спереди всегда −40, сзади ≥10.',
      },
      wall: {
        carcassDepthMm: { value: 350, status: 'project_default' },
        carcassHeightsMm: [
          { value: 360, status: 'source_example' },
          { value: 576, status: 'source_example' },
          { value: 720, status: 'project_default' },
          { value: 792, status: 'source_example' },
          { value: 864, status: 'source_example' },
        ],
      },
      tall: {
        carcassDepthMm: {
          value: 560,
          status: 'project_default',
          note:
            'Вплотную к стене (rear=0). Перед = перед корпуса НМ (Dwt−40); столешка выпирает +40. Не 550 из стека НМ.',
        },
        /**
         * CLODIS: высота пенала = сумма горизонтальных поясов кухни (не готовая сетка nobilia).
         * Антресоль (2-й ярус НШ) — отдельно, не внутри этого корпуса.
         */
        bandModel: {
          status: 'project_default',
          formula:
            'bandLow(NM) + bandMid(fixed NM_top→НШ1_bottom) + bandHigh(НШ1) = tallCarcass; clearance = bandMid − worktopTh',
          bandLowMm: {
            value: 720,
            golaValue: 780,
            status: 'project_default',
            note:
              'Высота корпуса НМ без опор. non_gola=720; gola=780 (INFO_CARCASS_GOLA_MM). Нижняя дверь пенала без техзазоров.',
          },
          worktopThicknessMm: { value: 38, status: 'manufacturer_required' },
          /**
           * Ритм колонки: mid ФИКСИРОВАН от верха корпуса НМ до низа НШ1.
           * Столешка лежит внутри mid; clearance = bandMid − thickness (не наоборот).
           * Пенал / низ навеса не прыгают при смене 38↔12.
           */
          bandMidMm: {
            value: 600,
            locked: true,
            status: 'project_default',
            note:
              'LOCKED: верх НМ → низ НШ1 = всегда 600 (INFO_BAND_MID_MM). Столешка внутри; не менять.',
          },
          clearanceAboveWorktopMm: {
            value: 562,
            status: 'project_default',
            note: 'Производное: bandMid − worktopThickness (600−38). Не задавать как якорь ритма.',
          },
          bandHighMm: {
            value: 720,
            status: 'project_default',
            note: 'Legacy НШ1. Тест «в потолок»: pick из 860/920/960.',
          },
          bandTopMm: {
            value: 360,
            status: 'project_default',
            note: 'Legacy НШ2. Тест «в потолок»: ровно половина НШ1 (430/460/480).',
          },
          /** Стандарт 1-го яруса (тест в потолок). НШ2 = half. */
          wallTier1StandardMm: [960, 920, 860],
          kitchenToCeiling: true,
          antresolSeparate: true,
        },
        facadeTypes: {
          doors_3: {
            id: 'doors_3',
            label: 'Пенал 3 двери',
            note: 'Низ=НМ, mid=фикс. от верха НМ до НШ1 (столешка внутри), верх=НШ1.',
          },
          oven_mw: {
            id: 'oven_mw',
            label: 'Пенал духовка + СВЧ',
            lowerHalfOfNmMm: { value: 360, status: 'project_default' },
            ovenNicheMm: { value: 600, status: 'appliance_required' },
            microwaveNicheMm: { value: 300, status: 'appliance_required' },
            note: '360 / 600 / ~300 / остаток верха; ниши сверять по SKU.',
          },
          fridge: {
            id: 'fridge',
            label: 'Пенал холодильник',
            note: 'Низ=НМ (720); средняя+верхняя полосы — одна дверь.',
          },
        },
        carcassHeightsMm: [
          { value: 2016, status: 'source_example', note: 'nobilia-like ориентир; не норматив CLODIS' },
          { value: 2088, status: 'source_example' },
          { value: 2160, status: 'source_example', note: 'legacy catalog height; CLODIS считает от поясов' },
          { value: 2232, status: 'source_example' },
        ],
        note:
          'CLODIS: tallCarcass = пояса кухни. Сетка nobilia — только source_example. К потолку — CeilingFiller, не подрезка корпуса.',
      },
      plinth: {
        heightsMm: [
          { value: 100, status: 'project_default', note: 'Черновик. Три высоты опор стола, не шкала шкафа.' },
          { value: 120, status: 'project_default' },
          { value: 150, status: 'project_default' },
        ],
        /** cabinet_model.id по высоте — цена/GLB берутся из карточки 3D-модели. */
        supportModelsByHeightMm: {
          100: { cabinetModelId: '2', status: 'project_default' },
          120: { cabinetModelId: '79', status: 'project_default' },
          150: { cabinetModelId: '80', status: 'project_default' },
        },
        setbackMm: { value: null, status: 'manufacturer_required' },
        note:
          'Высота опоры = v:h_bottom. SKU ножки = cabinet_model (не catalog_32). Корпус не уменьшается. Планка цоколя — отдельная деталь позже.',
      },
      worktop: {
        thicknessesMm: [{ value: 38, status: 'manufacturer_required' }],
        depthMm: { value: DEFAULT_WORKTOP_DEPTH_MM, status: 'project_default' },
        /** От переда столешницы до переда корпуса НМ — всегда 40 мм. */
        frontSetbackToCarcassMm: {
          value: FRONT_SETBACK_TO_CARCASS_MM,
          status: 'project_default',
        },
        /** Мин. свес/зазор столешницы сзади относительно корпуса. */
        rearOverhangMinMm: {
          value: REAR_OVERHANG_MIN_MM,
          status: 'project_default',
        },
        frontOverhangMm: {
          value: FRONT_SETBACK_TO_CARCASS_MM,
          status: 'project_default',
          note: 'Синоним frontSetbackToCarcassMm (корпус утоплен на 40 от переда столешницы).',
        },
        backOverhangMm: {
          value: REAR_OVERHANG_MIN_MM,
          status: 'project_default',
        },
      },
      clearances: {
        backsplashClearanceMm: { value: null, status: 'manufacturer_required' },
        rearServiceVoidMm: { value: null, status: 'manufacturer_required' },
        installationAllowanceMm: {
          value: null,
          status: 'manufacturer_required',
          note: 'Монтажный зазор к потолку; не резать корпус под потолок автоматически.',
        },
      },
      /**
       * Доборы §3.1 — отдельные сущности, не часть корпуса.
       * Каталожные ширины nobilia (100/200/230) — только source_example.
       */
      fillers: {
        ceiling: {
          defaultPlane: 'flushWithFront',
          planeNote: 'Ориентир Schüller frontbündige Deckenblenden [S16]; технология подрезки — manufacturer_required.',
          materialSources: ['carcass', 'front'],
          blankHeightExamplesMm: {
            status: 'manufacturer_required',
            note: 'Высота заготовки утверждает производство после замера; не копировать чужой каталог.',
          },
        },
        wall: {
          defaultPlane: 'flushWithFront',
          materialSources: ['carcass', 'front'],
          blankWidthExamplesMm: [
            {
              value: 100,
              status: 'source_example',
              source: 'S15',
              note: 'nobilia base/wall filler blank — не видимая ширина после подгонки CLODIS.',
            },
            {
              value: 200,
              status: 'source_example',
              source: 'S15',
              note: 'nobilia base/wall filler blank — не норматив CLODIS.',
            },
            {
              value: 230,
              status: 'source_example',
              source: 'S15',
              note: 'nobilia tall filler blank — не норматив CLODIS.',
            },
          ],
          sealNote:
            'U-образный уплотнитель nobilia не переносить в BOM CLODIS автоматически.',
        },
      },
      frontModes: {
        non_gola: {
          id: 'non_gola',
          label: 'С ручками / без Gola',
          variants: ['handle', 'edge_pull', 'integrated_front_pull', 'push_to_open', 'finger_overhang'],
          facadeHeightRule: 'full_carcass_minus_gaps',
          note: 'Высоты фасадов не уменьшаются на ширину профиля Gola.',
        },
        gola: {
          id: 'gola',
          label: 'Профиль Gola',
          system: {
            supplier: null,
            series: null,
            sku: null,
            status: 'manufacturer_required',
            note: 'Сечение и выборка — только из PDF артикула (Scilm/Volpato и т.п.).',
          },
          carcassHeightMm: {
            value: 780,
            status: 'project_default',
            note: 'CLODIS: корпус НМ Gola = 780; в комнате + опоры проекта.',
          },
          milling: {
            toolDiameterMm: 6,
            cornerRadiusMm: 3,
            slotLengthFromFrontMm: 27,
            cutDepthMm: 16,
            L: {
              slotHeightMm: 57.5,
              note: 'Верх боковины под столешницей.',
            },
            C: {
              slotHeightMm: 73.5,
              centerYFromCarcassBottomMm: 360,
              profileRef: 'Boyard RP050',
              note: 'Между ящиками; центр паза на 360 мм от низа корпуса.',
            },
            twoDrawerFacades: {
              count: 2,
              facadeHeightMm: 343,
              carcassHeightMm: 780,
              note:
                'Модуль Gola с 2 ящиками: каждый фасад 343 мм; центр C = 360; сверху зона L.',
            },
            note: 'Пазы L+C на боковинах под фрезу Ø6 → CFRN. Ширина ≥6, углы R=3 (чертёж C: R4).',
          },
          carcassHeightDeltaExampleMm: {
            value: 60,
            status: 'project_default',
            note: 'CLODIS: 780−720=60 мм под L-профиль; не 72 nobilia.',
          },
          roles: {
            topUnderWorktop: 'L_or_equivalent',
            betweenFacadeRows: 'C_or_equivalent',
            verticalTall: 'vertical_edge_or_between',
          },
        },
      },
      placementRoles: {
        kitchen_base: {
          id: 'kitchen_base',
          label: 'Стол рабочий напольный',
          baseKind: 'standalone_floor',
          defaultFrontMode: 'non_gola',
        },
        kitchen_base_gola: {
          id: 'kitchen_base_gola',
          label: 'Стол рабочий напольный (Gola)',
          baseKind: 'standalone_floor',
          defaultFrontMode: 'gola',
        },
        kitchen_tall: {
          id: 'kitchen_tall',
          label: 'Пенал',
          baseKind: 'floor_in_niche',
          defaultFrontMode: 'non_gola',
          phase: 'tall_bands',
          note: 'Высота от поясов НМ+(столешка+зазор)+НШ1; глубина = корпус НМ; столешки нет.',
        },
        kitchen_wall_mid: {
          id: 'kitchen_wall_mid',
          label: 'Навесной 1-й ярус (НШ1)',
          baseKind: 'wall_hung_low',
          phase: 'wall_mid',
          note:
            'H=bandHigh (в потолок: 860/920/960). Низ = plinth+low+mid. D≈350. Flush.',
        },
        kitchen_wall_top: {
          id: 'kitchen_wall_top',
          label: 'Навесной 2-й ярус (НШ2)',
          baseKind: 'wall_hung_high',
          phase: 'wall_top',
          note:
            'H=bandTop (в потолок: H1/2). Низ = plinth+low+mid+high. D≈350. Flush. Роль top.',
        },
      },
    };
  }

  var _profile = null;

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function getProfile() {
    if (_profile) return _profile;
    try {
      var raw = global.localStorage && global.localStorage.getItem(LS_KEY);
      if (raw) {
        _profile = JSON.parse(raw);
        return _profile;
      }
    } catch (e) {}
    _profile = getBuiltinDraftProfile();
    return _profile;
  }

  function setProfile(profile, persist) {
    _profile = profile || getBuiltinDraftProfile();
    if (persist !== false && global.localStorage) {
      try {
        global.localStorage.setItem(LS_KEY, JSON.stringify(_profile));
      } catch (e) {}
    }
    return _profile;
  }

  function mm(v, fallback) {
    var n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function snapSupportHeightMm(v) {
    var n = Math.round(mm(v, DEFAULT_SUPPORT_MM));
    if (SUPPORT_HEIGHTS_MM.indexOf(n) >= 0) return n;
    var best = SUPPORT_HEIGHTS_MM[0];
    for (var i = 1; i < SUPPORT_HEIGHTS_MM.length; i++) {
      if (Math.abs(SUPPORT_HEIGHTS_MM[i] - n) < Math.abs(best - n)) best = SUPPORT_HEIGHTS_MM[i];
    }
    return best;
  }

  function normalizeSupportModelsMap(raw) {
    var out = {};
    var src = raw && typeof raw === 'object' ? raw : {};
    SUPPORT_HEIGHTS_MM.forEach(function (h) {
      var entry = src[h] != null ? src[h] : src[String(h)];
      var id =
        entry && typeof entry === 'object'
          ? entry.cabinetModelId ?? entry.id ?? entry.modelId
          : entry;
      var sid = id != null && String(id).trim() !== '' ? String(id).trim() : null;
      if (sid) out[h] = sid;
      else if (DEFAULT_SUPPORT_CABINET_MODEL_IDS[h]) out[h] = DEFAULT_SUPPORT_CABINET_MODEL_IDS[h];
    });
    return out;
  }

  /** Карта высота→cabinet_model.id из профиля производства (+ дефолты). */
  function getSupportModelsByHeightMm() {
    var profile = getProfile();
    var fromProfile =
      profile && profile.plinth && profile.plinth.supportModelsByHeightMm
        ? profile.plinth.supportModelsByHeightMm
        : null;
    return normalizeSupportModelsMap(fromProfile || DEFAULT_SUPPORT_CABINET_MODEL_IDS);
  }

  /**
   * Резолв SKU опоры для высоты.
   * @param {number} plinthMm
   * @param {object|null} moduleSupports — data.kitchenSupports с карточки модуля (опционально)
   */
  function resolveSupportCabinetModelBinding(plinthMm, moduleSupports) {
    var h = snapSupportHeightMm(plinthMm);
    var base = getSupportModelsByHeightMm();
    var modMap = null;
    if (moduleSupports && typeof moduleSupports === 'object') {
      if (moduleSupports.enabled === false) {
        return {
          heightMm: h,
          modelId: String(base[h] || DEFAULT_SUPPORT_CABINET_MODEL_IDS[h] || '2'),
          name: 'Опора ' + h + ' мм',
          source: 'disabled',
          enabled: false,
        };
      }
      modMap = moduleSupports.modelsByHeightMm || moduleSupports.modelsByHeight || null;
    }
    var merged = Object.assign({}, base);
    if (modMap && typeof modMap === 'object') {
      var normalizedMod = normalizeSupportModelsMap(modMap);
      Object.keys(normalizedMod).forEach(function (k) {
        merged[k] = normalizedMod[k];
      });
    }
    var modelId = String(merged[h] || DEFAULT_SUPPORT_CABINET_MODEL_IDS[h] || '2');
    var names = { 100: 'Опора кухонная 100', 120: 'Опора 120 мм', 150: 'Опора 150 мм' };
    return {
      heightMm: h,
      modelId: modelId,
      name: names[h] || 'Опора ' + h + ' мм',
      key: names[h] || 'Опора ' + h + ' мм',
      source: modMap ? 'module+profile' : 'profile',
      enabled: true,
      modelsByHeightMm: merged,
    };
  }

  function getMinBaseCarcassDepthMm() {
    try {
      var p = getProfile && getProfile();
      var v =
        p &&
        p.base &&
        p.base.minCarcassDepthMm &&
        p.base.minCarcassDepthMm.value != null
          ? Number(p.base.minCarcassDepthMm.value)
          : MIN_BASE_CARCASS_DEPTH_MM;
      if (Number.isFinite(v) && v > 0) return Math.round(v);
    } catch (_) {}
    return MIN_BASE_CARCASS_DEPTH_MM;
  }

  function getBaseCarcassDepthOptionsMm() {
    return BASE_CARCASS_DEPTHS_MM.slice();
  }

  /**
   * Диапазон НМ при столешнице: [min … Dwt−40−10].
   * default = max (свесы ровно 40 / 10).
   */
  function getBaseCarcassDepthBoundsMm(worktopDepthMm) {
    var dwt = Math.round(
      mm(
        worktopDepthMm != null ? worktopDepthMm : getProjectWorktopDepthMm(),
        DEFAULT_WORKTOP_DEPTH_MM
      )
    );
    var minCarcass = getMinBaseCarcassDepthMm();
    var maxCarcass = dwt - FRONT_SETBACK_TO_CARCASS_MM - REAR_OVERHANG_MIN_MM;
    var ok = maxCarcass >= minCarcass;
    return {
      ok: ok,
      worktopDepthMm: dwt,
      minMm: minCarcass,
      maxMm: maxCarcass,
      defaultMm: ok ? maxCarcass : minCarcass,
      frontSetbackToCarcassMm: FRONT_SETBACK_TO_CARCASS_MM,
      rearOverhangMinMm: REAR_OVERHANG_MIN_MM,
    };
  }

  /**
   * Legacy: пресеты 550/510/460, которые ещё влезают.
   * Основной UI — непрерывный диапазон getBaseCarcassDepthBoundsMm.
   */
  function getAllowedBaseCarcassDepthsMm(worktopDepthMm) {
    var bounds = getBaseCarcassDepthBoundsMm(worktopDepthMm);
    if (!bounds.ok) return [];
    return getBaseCarcassDepthOptionsMm().filter(function (c) {
      return c >= bounds.minMm && c <= bounds.maxMm;
    });
  }

  function getWorktopDepthDefaults() {
    var minCarcass = getMinBaseCarcassDepthMm();
    return {
      defaultWorktopDepthMm: DEFAULT_WORKTOP_DEPTH_MM,
      frontSetbackToCarcassMm: FRONT_SETBACK_TO_CARCASS_MM,
      rearOverhangMinMm: REAR_OVERHANG_MIN_MM,
      minCarcassDepthMm: minCarcass,
      minWorktopDepthMm: minCarcass + FRONT_SETBACK_TO_CARCASS_MM + REAR_OVERHANG_MIN_MM,
      carcassDepthsMm: getBaseCarcassDepthOptionsMm(),
    };
  }

  /**
   * Корпус при столешнице: max = Dwt − 40 − 10; min = MIN (сейчас 150).
   * Без preferred → дефолт max. preferred в карандаше — любой в [min, max].
   * Спереди всегда 40; сзади = Dwt − 40 − carcass (≥ 10).
   */
  function resolveBaseCarcassDepthMm(opts) {
    var o = opts || {};
    var bounds = getBaseCarcassDepthBoundsMm(
      o.worktopDepthMm != null ? o.worktopDepthMm : getProjectWorktopDepthMm()
    );
    var dwt = bounds.worktopDepthMm;
    if (!(dwt > 0)) {
      return {
        ok: false,
        reason: 'bad_worktop_depth',
        worktopDepthMm: dwt,
      };
    }
    if (!bounds.ok) {
      return {
        ok: false,
        reason: 'worktop_too_shallow',
        worktopDepthMm: dwt,
        maxCarcassDepthMm: bounds.maxMm,
        minCarcassDepthMm: bounds.minMm,
        frontSetbackToCarcassMm: FRONT_SETBACK_TO_CARCASS_MM,
        rearOverhangMinMm: REAR_OVERHANG_MIN_MM,
        message:
          'Столешница слишком мелкая: нужен корпус ≥ ' +
          bounds.minMm +
          ' мм при свесах 40/10 (мин. столешница ' +
          (bounds.minMm + FRONT_SETBACK_TO_CARCASS_MM + REAR_OVERHANG_MIN_MM) +
          ' мм).',
      };
    }

    var preferred =
      o.preferredCarcassDepthMm != null ? Math.round(mm(o.preferredCarcassDepthMm, 0)) : null;
    var carcass = bounds.defaultMm;
    var snappedPreferred = false;
    if (preferred != null && preferred > 0) {
      if (preferred > bounds.maxMm) {
        carcass = bounds.maxMm;
        snappedPreferred = true;
      } else if (preferred < bounds.minMm) {
        carcass = bounds.minMm;
        snappedPreferred = true;
      } else {
        carcass = preferred;
      }
    }

    var rearOverhang = dwt - FRONT_SETBACK_TO_CARCASS_MM - carcass;
    return {
      ok: true,
      worktopDepthMm: dwt,
      carcassDepthMm: carcass,
      maxCarcassDepthMm: bounds.maxMm,
      minCarcassDepthMm: bounds.minMm,
      frontSetbackToCarcassMm: FRONT_SETBACK_TO_CARCASS_MM,
      rearOverhangMm: rearOverhang,
      rearOverhangMinMm: REAR_OVERHANG_MIN_MM,
      snappedPreferred: snappedPreferred,
      rule: 'min…(Dwt-40-10); front=40 fixed; rear>=10',
    };
  }

  /** Проверка пары столешница + корпус (свесы 40 / ≥10, корпус ≥ min). */
  function resolveWorktopStackDepth(opts) {
    var o = opts || {};
    var dwt = Math.round(mm(o.worktopDepthMm, DEFAULT_WORKTOP_DEPTH_MM));
    var carcass = Math.round(mm(o.carcassDepthMm, 0));
    var front = FRONT_SETBACK_TO_CARCASS_MM;
    var rearMin = REAR_OVERHANG_MIN_MM;
    var minCarcass = getMinBaseCarcassDepthMm();
    if (!(dwt > 0) || !(carcass > 0)) {
      return { ok: false, reason: 'bad_dims', worktopDepthMm: dwt, carcassDepthMm: carcass };
    }
    if (carcass < minCarcass) {
      return {
        ok: false,
        reason: 'carcass_too_shallow',
        worktopDepthMm: dwt,
        carcassDepthMm: carcass,
        minCarcassDepthMm: minCarcass,
        message: 'Глубина НМ меньше минимума ' + minCarcass + ' мм.',
      };
    }
    var rear = dwt - front - carcass;
    if (rear < rearMin) {
      return {
        ok: false,
        reason: 'rear_overhang_too_small',
        worktopDepthMm: dwt,
        carcassDepthMm: carcass,
        frontSetbackToCarcassMm: front,
        rearOverhangMm: rear,
        rearOverhangMinMm: rearMin,
        maxCarcassDepthMm: dwt - front - rearMin,
        message: 'Сзади меньше ' + rearMin + ' мм при свесе спереди ' + front + ' мм.',
      };
    }
    return {
      ok: true,
      worktopDepthMm: dwt,
      carcassDepthMm: carcass,
      frontSetbackToCarcassMm: front,
      rearOverhangMm: rear,
      rearOverhangMinMm: rearMin,
      minCarcassDepthMm: minCarcass,
      maxCarcassDepthMm: dwt - front - rearMin,
    };
  }

  function isKitchenBasePlacementKind(pk) {
    var s = String(pk || '').trim();
    return s === 'kitchen_base' || s === 'kitchen_base_gola';
  }

  /**
   * Состояние проекта кухни (не SKU).
   * plinthHeightMm один на весь нижний ряд — смена поднимает все столы, корпус не меняется.
   * worktopDepthMm ведёт глубину; baseCarcassDepthMm — resolved дискрет.
   */
  function normalizeProjectDepthFields(raw) {
    var dwt = Math.round(
      mm(
        raw && raw.worktopDepthMm != null ? raw.worktopDepthMm : DEFAULT_WORKTOP_DEPTH_MM,
        DEFAULT_WORKTOP_DEPTH_MM
      )
    );
    if (!(dwt > 0)) dwt = DEFAULT_WORKTOP_DEPTH_MM;
    var preferred =
      raw && raw.baseCarcassDepthMm != null ? raw.baseCarcassDepthMm : raw && raw.preferredCarcassDepthMm;
    var resolved = resolveBaseCarcassDepthMm({
      worktopDepthMm: dwt,
      preferredCarcassDepthMm: preferred,
    });
    return {
      worktopDepthMm: dwt,
      baseCarcassDepthMm: resolved.ok
        ? resolved.carcassDepthMm
        : getMinBaseCarcassDepthMm(),
      depthResolve: resolved,
    };
  }

  function getRoomStepsConfigSafe() {
    try {
      if (typeof global.getRoomStepsConfig === 'function') {
        var c = global.getRoomStepsConfig();
        if (c && typeof c === 'object') return c;
      }
    } catch (_) {}
    try {
      var raw = global.localStorage && global.localStorage.getItem('room_steps_config');
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (_) {}
    return null;
  }

  /** Вилка mid из Упр.комнатой 2 → kitchenRhythm.bandMidMm. */
  function getKitchenRhythmBandMidSpec() {
    var cfg = getRoomStepsConfigSafe();
    var bm =
      cfg && cfg.kitchenRhythm && cfg.kitchenRhythm.bandMidMm
        ? cfg.kitchenRhythm.bandMidMm
        : null;
    var def = Math.round(mm(bm && bm.default, INFO_BAND_MID_MM));
    var min = Math.round(mm(bm && bm.min, INFO_BAND_MID_MIN_MM));
    var max = Math.round(mm(bm && bm.max, INFO_BAND_MID_MAX_MM));
    if (!(def > 0)) def = INFO_BAND_MID_MM;
    if (!(min > 0)) min = INFO_BAND_MID_MIN_MM;
    if (!(max > 0)) max = INFO_BAND_MID_MAX_MM;
    if (min > max) {
      var t = min;
      min = max;
      max = t;
    }
    if (def < min) def = min;
    if (def > max) def = max;
    return {
      default: def,
      min: min,
      max: max,
      label:
        (bm && bm.label && String(bm.label).trim()) ||
        'Верх корпуса НМ → низ НШ1',
    };
  }

  function clampBandMidMm(val) {
    var spec = getKitchenRhythmBandMidSpec();
    var n = Math.round(Number(val) || 0);
    if (!(n > 0)) return spec.default;
    if (n < spec.min) return spec.min;
    if (n > spec.max) return spec.max;
    return n;
  }

  /**
   * Корпус НМ из типа размещения (Упр.комнатой 2 → placementKindProfiles.settings.carcassHeightMm).
   * Надёжный путь: только kitchen_base / kitchen_base_gola (и corner).
   */
  function getCarcassHeightMmFromPlacementKind(placementKindId) {
    var id = String(placementKindId || '').trim();
    if (!id) return null;
    var cfg = getRoomStepsConfigSafe();
    var profiles =
      (cfg && (cfg.placementKindProfiles || cfg.placementKinds)) || null;
    if (Array.isArray(profiles)) {
      for (var i = 0; i < profiles.length; i++) {
        var p = profiles[i];
        var pid = String((p && (p.id != null ? p.id : p.key)) || '').trim();
        if (pid !== id) continue;
        var h = Math.round(
          Number(
            p &&
              p.settings &&
              (p.settings.carcassHeightMm != null
                ? p.settings.carcassHeightMm
                : p.settings.rhythm && p.settings.rhythm.carcassHeightMm)
          ) || 0
        );
        if (h >= 500 && h <= 1000) return h;
      }
    }
    try {
      var api = global.__cldPlacementKindProfiles;
      if (api && typeof api.resolvePlacementKindProfile === 'function') {
        var r = api.resolvePlacementKindProfile(id, cfg);
        var rh = Math.round(Number(r && r.carcassHeightMm) || 0);
        if (rh >= 500 && rh <= 1000) return rh;
      }
    } catch (_) {}
    if (id === 'kitchen_base_gola') return INFO_CARCASS_GOLA_MM;
    if (id === 'kitchen_base' || id === 'kitchen_base_corner') {
      return INFO_CARCASS_NON_GOLA_MM;
    }
    return null;
  }

  function getBandLowPlacementKindForMode(frontMode) {
    var mode = frontMode === 'gola' ? 'gola' : 'non_gola';
    var cfg = getRoomStepsConfigSafe();
    var map =
      cfg &&
      cfg.kitchenRhythm &&
      cfg.kitchenRhythm.bandLowFromPlacementKind
        ? cfg.kitchenRhythm.bandLowFromPlacementKind
        : null;
    if (map && map[mode]) return String(map[mode]).trim();
    return mode === 'gola' ? 'kitchen_base_gola' : 'kitchen_base';
  }

  function normalizeProjectBandMidMm(raw) {
    if (raw == null || raw === '' || raw === false) return null;
    var n = Math.round(Number(raw) || 0);
    if (!(n > 0)) return null;
    return clampBandMidMm(n);
  }

  function getKitchenProjectState() {
    try {
      var raw = global.localStorage && global.localStorage.getItem(PROJECT_LS_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          var depth = normalizeProjectDepthFields(parsed);
          return {
            plinthHeightMm: snapSupportHeightMm(parsed.plinthHeightMm),
            frontMode: parsed.frontMode === 'gola' ? 'gola' : 'non_gola',
            worktopDepthMm: depth.worktopDepthMm,
            baseCarcassDepthMm: depth.baseCarcassDepthMm,
            bandMidMm: normalizeProjectBandMidMm(parsed.bandMidMm),
          };
        }
      }
    } catch (e) {}
    var d0 = normalizeProjectDepthFields({});
    return {
      plinthHeightMm: DEFAULT_SUPPORT_MM,
      frontMode: 'non_gola',
      worktopDepthMm: d0.worktopDepthMm,
      baseCarcassDepthMm: d0.baseCarcassDepthMm,
      bandMidMm: null,
    };
  }

  function mirrorKitchenProjectToRuntime(next) {
    try {
      global.__cldKitchenProject = {
        frontMode: next.frontMode,
        plinthHeightMm: next.plinthHeightMm,
        worktopDepthMm: next.worktopDepthMm,
        baseCarcassDepthMm: next.baseCarcassDepthMm,
        bandMidMm: next.bandMidMm != null ? next.bandMidMm : null,
        kitchenSystem: next.frontMode === 'gola' ? 'gola' : 'standard',
      };
    } catch (e) {}
    try {
      var st =
        global.__CLD_STATE_SINGLETON__ ||
        (global.state && global.state.customSections != null ? global.state : null);
      if (st && typeof st === 'object') {
        st.kitchenProject = {
          frontMode: next.frontMode,
          plinthHeightMm: next.plinthHeightMm,
          worktopDepthMm: next.worktopDepthMm,
          baseCarcassDepthMm: next.baseCarcassDepthMm,
          bandMidMm: next.bandMidMm != null ? next.bandMidMm : null,
          kitchenSystem: next.frontMode === 'gola' ? 'gola' : 'standard',
        };
      }
    } catch (e2) {}
  }

  function setKitchenProjectState(patch, persist) {
    var cur = getKitchenProjectState();
    var mergedDepth = {
      worktopDepthMm:
        patch && patch.worktopDepthMm != null ? patch.worktopDepthMm : cur.worktopDepthMm,
      baseCarcassDepthMm:
        patch && patch.baseCarcassDepthMm != null
          ? patch.baseCarcassDepthMm
          : patch && patch.preferredCarcassDepthMm != null
            ? patch.preferredCarcassDepthMm
            : // если меняем только столешницу — не тащим старый корпус (авто max)
              patch && patch.worktopDepthMm != null
              ? undefined
              : cur.baseCarcassDepthMm,
    };
    var depth = normalizeProjectDepthFields(mergedDepth);
    var bandMidNext = cur.bandMidMm;
    if (patch && Object.prototype.hasOwnProperty.call(patch, 'bandMidMm')) {
      bandMidNext =
        patch.bandMidMm == null || patch.bandMidMm === ''
          ? null
          : normalizeProjectBandMidMm(patch.bandMidMm);
    }
    var next = {
      plinthHeightMm: snapSupportHeightMm(
        patch && patch.plinthHeightMm != null ? patch.plinthHeightMm : cur.plinthHeightMm
      ),
      frontMode:
        patch && patch.frontMode != null
          ? patch.frontMode === 'gola'
            ? 'gola'
            : 'non_gola'
          : cur.frontMode,
      worktopDepthMm: depth.worktopDepthMm,
      baseCarcassDepthMm: depth.baseCarcassDepthMm,
      bandMidMm: bandMidNext,
    };
    if (persist !== false && global.localStorage) {
      try {
        global.localStorage.setItem(PROJECT_LS_KEY, JSON.stringify(next));
      } catch (e) {}
    }
    mirrorKitchenProjectToRuntime(next);
    return next;
  }

  /** Восстановление из projectData / fixture (не только LS). */
  function hydrateKitchenProjectFromSave(data, persist) {
    if (!data || typeof data !== 'object') return getKitchenProjectState();
    var src = data.kitchenProject || data.kitchen || data;
    return setKitchenProjectState(
      {
        plinthHeightMm: src.plinthHeightMm != null ? src.plinthHeightMm : src.plinth,
        frontMode:
          src.frontMode != null
            ? src.frontMode
            : src.kitchenSystem === 'gola' || src.system === 'gola'
              ? 'gola'
              : src.kitchenSystem === 'standard' || src.system === 'standard'
                ? 'non_gola'
                : undefined,
        worktopDepthMm:
          src.worktopDepthMm != null ? src.worktopDepthMm : src.worktopDepth,
        baseCarcassDepthMm:
          src.baseCarcassDepthMm != null
            ? src.baseCarcassDepthMm
            : src.carcassDepthMm,
        bandMidMm: Object.prototype.hasOwnProperty.call(src, 'bandMidMm')
          ? src.bandMidMm
          : undefined,
      },
      persist !== false
    );
  }

  function getKitchenProjectForSave() {
    var s = getKitchenProjectState();
    var out = {
      frontMode: s.frontMode,
      plinthHeightMm: s.plinthHeightMm,
      worktopDepthMm: s.worktopDepthMm,
      baseCarcassDepthMm: s.baseCarcassDepthMm,
      kitchenSystem: s.frontMode === 'gola' ? 'gola' : 'standard',
    };
    if (s.bandMidMm != null) out.bandMidMm = s.bandMidMm;
    return out;
  }

  function getProjectWorktopDepthMm() {
    return getKitchenProjectState().worktopDepthMm;
  }

  function setProjectWorktopDepthMm(mmVal) {
    return setKitchenProjectState({ worktopDepthMm: mmVal }).worktopDepthMm;
  }

  function getProjectBaseCarcassDepthMm() {
    return getKitchenProjectState().baseCarcassDepthMm;
  }

  /** Явно выбрать корпус (только ≤ max для текущей столешницы). */
  function setProjectBaseCarcassDepthMm(mmVal) {
    return setKitchenProjectState({ baseCarcassDepthMm: mmVal }).baseCarcassDepthMm;
  }

  /** Информационный стек для шага 3 (без столешницы). */
  function getStep3KitchenStackInfo(frontModeOpt, plinthOpt) {
    var s = getKitchenProjectState();
    var mode =
      frontModeOpt === 'gola' || frontModeOpt === 'non_gola'
        ? frontModeOpt
        : s.frontMode;
    var plinth = snapSupportHeightMm(
      plinthOpt != null ? plinthOpt : s.plinthHeightMm
    );
    var carcass = mode === 'gola' ? INFO_CARCASS_GOLA_MM : INFO_CARCASS_NON_GOLA_MM;
    return {
      frontMode: mode,
      kitchenSystem: mode === 'gola' ? 'gola' : 'standard',
      carcassHeightMm: carcass,
      plinthHeightMm: plinth,
      totalHeightMm: carcass + plinth,
      worktopIncluded: false,
      note: 'Информационный расчёт. Факт — из каталожного артикула.',
    };
  }

  /**
   * Gola: отдельные SKU kitchen_base_gola (780 + пазы). Ordinary kitchen_base = 720.
   * Отдельный SKU / флаг golaReady больше не блокирует UI.
   */
  function isGolaCatalogReady() {
    return true;
  }

  /** Нужный placement для нижних столов при текущей системе. */
  function getPreferredKitchenBasePlacementKind() {
    return getKitchenProjectState().frontMode === 'gola'
      ? 'kitchen_base_gola'
      : 'kitchen_base';
  }

  function getProjectPlinthHeightMm() {
    return getKitchenProjectState().plinthHeightMm;
  }

  function setProjectPlinthHeightMm(mmVal) {
    return setKitchenProjectState({ plinthHeightMm: mmVal }).plinthHeightMm;
  }

  /**
   * Размеры размещения стола: высота в каталоге = корпус; в комнате = корпус + опора проекта.
   * Глубина Z = resolved carcass (550/510/460) от столешницы проекта, не 600 и не legacy 560.
   */
  function resolveKitchenBasePlaceSizing(opts) {
    var o = opts || {};
    var carcassH = mm(o.carcassHeightMm, null);
    if (carcassH == null || carcassH <= 0) {
      return { ok: false, reason: 'missing_carcass_height' };
    }
    var plinth = snapSupportHeightMm(
      o.plinthHeightMm != null ? o.plinthHeightMm : getProjectPlinthHeightMm()
    );
    var depth = resolveBaseCarcassDepthMm({
      worktopDepthMm:
        o.worktopDepthMm != null ? o.worktopDepthMm : getProjectWorktopDepthMm(),
      preferredCarcassDepthMm:
        o.preferredCarcassDepthMm != null
          ? o.preferredCarcassDepthMm
          : o.carcassDepthMm != null
            ? o.carcassDepthMm
            : getProjectBaseCarcassDepthMm(),
    });
    if (!depth.ok) {
      return {
        ok: false,
        reason: depth.reason || 'depth_resolve_failed',
        depth: depth,
      };
    }
    return {
      ok: true,
      carcassHeightMm: Math.round(carcassH),
      plinthHeightMm: plinth,
      totalHeightMm: Math.round(carcassH) + plinth,
      h_bottom: plinth,
      worktopDepthMm: depth.worktopDepthMm,
      carcassDepthMm: depth.carcassDepthMm,
      frontSetbackToCarcassMm: depth.frontSetbackToCarcassMm,
      rearOverhangMm: depth.rearOverhangMm,
      rule: 'one_sku_carcass_plus_project_plinth_and_worktop_depth',
      note:
        'Корпус H+опоры; глубина Z = корпус НМ от столешницы (40 спереди / ≥10 сзади).',
    };
  }

  /**
   * Размерная цепочка низа (§2 эталона).
   * worktopTopY = finishedFloorY + plinthHeight + baseCarcassHeight + worktopThickness
   */
  function computeBaseStackMm(input) {
    var p = getProfile();
    var floorY = mm(input && input.finishedFloorY, 0);
    var plinth = mm(input && input.plinthHeight, null);
    var carcass = mm(input && input.baseCarcassHeight, null);
    var worktop = mm(input && input.worktopThickness, null);
    var frontMode = String((input && input.frontMode) || 'non_gola').trim() || 'non_gola';

    var missing = [];
    if (plinth == null) missing.push('plinthHeight');
    if (carcass == null) missing.push('baseCarcassHeight');
    if (worktop == null) missing.push('worktopThickness');

    var plinthY0 = floorY;
    var plinthY1 = missing.length ? null : floorY + plinth;
    var carcassY0 = plinthY1;
    var carcassY1 = missing.length ? null : plinthY1 + carcass;
    var worktopTopY = missing.length ? null : carcassY1 + worktop;

    return {
      ok: missing.length === 0,
      missing: missing,
      frontMode: frontMode,
      profileId: p.id,
      profileStatus: p.status,
      finishedFloorY: floorY,
      plinthHeight: plinth,
      baseCarcassHeight: carcass,
      worktopThickness: worktop,
      layers: {
        plinth: { y0: plinthY0, y1: plinthY1, height: plinth },
        carcass: { y0: carcassY0, y1: carcassY1, height: carcass },
        worktop: { y0: carcassY1, y1: worktopTopY, height: worktop },
      },
      worktopTopY: worktopTopY,
      formula:
        'worktopTopY = finishedFloorY + plinthHeight + baseCarcassHeight + worktopThickness',
    };
  }

  /**
   * НШ1: ритм от верха НМ (bandMid фикс.), не от толщины столешки.
   * floorClearance = plinth + bandLow + bandMid
   * wallUnitBottomY = finishedFloorY + floorClearance
   * (= worktopTopY + (bandMid − worktopTh) при той же столешке)
   */
  function resolveKitchenWallMidPlaceSizing(opts) {
    var o = opts || {};
    var bands = resolveTallKitchenBandsMm(o);
    if (!bands.ok) {
      return { ok: false, reason: bands.reason || 'bands_failed', bands: bands };
    }
    var plinth = Math.round(
      mm(o.plinthHeightMm != null ? o.plinthHeightMm : getProjectPlinthHeightMm(), 100)
    );
    // «В потолок»: H из подбора 860/920/960 (уже в bands при roomH).
    var wallH = Math.round(bands.bandHighMm);
    var floorClearance = plinth + Math.round(bands.bandLowMm) + Math.round(bands.bandMidMm);
    var p = getProfile();
    // Глубина — из комнаты (секция / project wall), не из карточки каталога.
    // Каталог НШ «тянется» под sectionSize.z при place.
    var wallDepth = 350;
    if (p && p.wall && p.wall.carcassDepthMm) {
      wallDepth = Math.round(mm(p.wall.carcassDepthMm.value, 350));
    }
    if (o.sectionDepthMm != null && Number(o.sectionDepthMm) > 0) {
      var secD = Math.round(mm(o.sectionDepthMm, wallDepth));
      if (secD >= 200 && secD <= 450) wallDepth = secD;
    } else if (o.carcassDepthMm != null && Number(o.carcassDepthMm) > 0) {
      // Явный override (UI секции / rebuild), не catalog depth. НШ1: max 450.
      var ovD = Math.round(mm(o.carcassDepthMm, wallDepth));
      if (ovD >= 200 && ovD <= 450) wallDepth = ovD;
    }
    wallH = Math.round(bands.bandHighMm);
    return {
      ok: true,
      productKind: 'kitchen_wall_mid',
      wallUnitHeightMm: wallH,
      carcassHeightMm: wallH,
      totalHeightMm: wallH,
      plinthHeightMm: 0,
      projectPlinthHeightMm: plinth,
      floorClearanceMm: floorClearance,
      carcassDepthMm: wallDepth,
      rearOverhangMm: 0,
      frontSetbackToCarcassMm: 0,
      hasWorktop: false,
      bandLowMm: bands.bandLowMm,
      bandMidMm: bands.bandMidMm,
      bandHighMm: bands.bandHighMm,
      bandTopMm: bands.bandTopMm,
      ceilingTiers: bands.ceilingTiers || null,
      worktopThicknessMm: bands.worktopThicknessMm,
      clearanceAboveWorktopMm: bands.clearanceAboveWorktopMm,
      rule:
        bands.ceilingTiers && bands.ceilingTiers.applied
          ? 'wall_mid_to_ceiling_pick'
          : 'wall_mid_from_nm_top_band',
      formula:
        'floorClearance = plinth + bandLow + bandMid; H = bandHigh (to-ceiling pick or legacy); D = section/project wall',
    };
  }

  /**
   * НШ2: низ = верх НШ1 = plinth + low + mid + high.
   * H = bandTop; при «в потолок» = bandHigh/2 (430/460/480).
   */
  function resolveKitchenWallTopPlaceSizing(opts) {
    var o = opts || {};
    var bands = resolveTallKitchenBandsMm(o);
    if (!bands.ok) {
      return { ok: false, reason: bands.reason || 'bands_failed', bands: bands };
    }
    var plinth = Math.round(
      mm(o.plinthHeightMm != null ? o.plinthHeightMm : getProjectPlinthHeightMm(), 100)
    );
    var p = getProfile();
    var bandTop = 360;
    if (bands.bandTopMm != null && Number(bands.bandTopMm) > 0) {
      bandTop = Math.round(Number(bands.bandTopMm));
    } else if (p && p.tall && p.tall.bandModel && p.tall.bandModel.bandTopMm) {
      bandTop = Math.round(mm(p.tall.bandModel.bandTopMm.value, 360));
    }
    if (o.bandTopMm != null && Number(o.bandTopMm) > 0) {
      bandTop = Math.round(mm(o.bandTopMm, bandTop));
    }
    if (bandTop < 200) bandTop = 200;
    if (bandTop > 900) bandTop = 900;
    var floorClearance =
      plinth +
      Math.round(bands.bandLowMm) +
      Math.round(bands.bandMidMm) +
      Math.round(bands.bandHighMm);
    var wallDepth = 350;
    if (p && p.wall && p.wall.carcassDepthMm) {
      wallDepth = Math.round(mm(p.wall.carcassDepthMm.value, 350));
    }
    // НШ2: 200…700 (shallow~350, deep~560, custom карандаш до 70 см).
    if (o.sectionDepthMm != null && Number(o.sectionDepthMm) > 0) {
      var secDTop = Math.round(mm(o.sectionDepthMm, wallDepth));
      if (secDTop >= 200 && secDTop <= 700) wallDepth = secDTop;
    } else if (o.carcassDepthMm != null && Number(o.carcassDepthMm) > 0) {
      var ovDTop = Math.round(mm(o.carcassDepthMm, wallDepth));
      if (ovDTop >= 200 && ovDTop <= 700) wallDepth = ovDTop;
    }
    return {
      ok: true,
      productKind: 'kitchen_wall_top',
      wallUnitHeightMm: bandTop,
      carcassHeightMm: bandTop,
      totalHeightMm: bandTop,
      plinthHeightMm: 0,
      projectPlinthHeightMm: plinth,
      floorClearanceMm: floorClearance,
      carcassDepthMm: wallDepth,
      rearOverhangMm: 0,
      frontSetbackToCarcassMm: 0,
      hasWorktop: false,
      bandLowMm: bands.bandLowMm,
      bandMidMm: bands.bandMidMm,
      bandHighMm: bands.bandHighMm,
      bandTopMm: bandTop,
      ceilingTiers: bands.ceilingTiers || null,
      rule:
        bands.ceilingTiers && bands.ceilingTiers.applied
          ? 'wall_top_to_ceiling_half'
          : 'wall_top_above_nsh1',
      formula:
        'floorClearance = plinth + low + mid + high; H = bandTop (= high/2 при в потолок)',
    };
  }

  /**
   * Верхний ряд. Предпочтительно от ритма НМ (bandMid);
   * legacy: worktopTopY + backsplashClearance.
   */
  function computeWallStackMm(input) {
    var o = input || {};
    // Новый путь: от верха НМ (фикс. mid).
    if (
      o.fromNmBands === true ||
      (o.plinthHeight != null && o.bandLowMm != null && o.bandMidMm != null)
    ) {
      var plinthB = Math.round(mm(o.plinthHeight != null ? o.plinthHeight : getProjectPlinthHeightMm(), 100));
      var lowB = Math.round(mm(o.bandLowMm, INFO_CARCASS_NON_GOLA_MM));
      var midB = resolveNmBandMidMm(o);
      var wallHB = Math.round(mm(o.wallUnitHeight != null ? o.wallUnitHeight : o.bandHighMm, 720));
      var floorY = mm(o.finishedFloorY, 0) || 0;
      var bottomB = floorY + plinthB + lowB + midB;
      return {
        ok: true,
        missing: [],
        fromNmBands: true,
        finishedFloorY: floorY,
        plinthHeight: plinthB,
        bandLowMm: lowB,
        bandMidMm: midB,
        floorClearanceMm: plinthB + lowB + midB,
        wallUnitHeight: wallHB,
        wallUnitBottomY: bottomB,
        wallUnitTopY: bottomB + wallHB,
        formula:
          'wallUnitBottomY = finishedFloorY + plinth + bandLow + bandMid; H = bandHigh',
      };
    }
    var worktopTopY = mm(o.worktopTopY, null);
    var clearance = mm(o.backsplashClearance, null);
    var wallH = mm(o.wallUnitHeight, null);
    var missing = [];
    if (worktopTopY == null) missing.push('worktopTopY');
    if (clearance == null) missing.push('backsplashClearance');
    if (wallH == null) missing.push('wallUnitHeight');
    var bottom = missing.length ? null : worktopTopY + clearance;
    var top = missing.length ? null : bottom + wallH;
    return {
      ok: missing.length === 0,
      missing: missing,
      worktopTopY: worktopTopY,
      backsplashClearance: clearance,
      wallUnitHeight: wallH,
      wallUnitBottomY: bottom,
      wallUnitTopY: top,
      formula:
        'legacy: wallUnitBottomY = worktopTopY + backsplashClearance',
    };
  }

  /**
   * CeilingFiller (§3.1) — отдельная панель, не подрезка корпуса.
   * visibleHeight может отличаться на концах ряда (клиновидный добор при разном потолке).
   */
  function makeCeilingFiller(input) {
    var o = input || {};
    var h0 = mm(o.visibleHeightStartMm, null);
    var h1 = mm(o.visibleHeightEndMm, h0);
    var blank = mm(o.blankHeightMm, null);
    var plane = o.plane === 'recessed' ? 'recessed' : 'flushWithFront';
    var materialSource = o.materialSource === 'front' ? 'front' : 'carcass';
    var needsSiteMeasure = o.needsSiteMeasure !== false;
    if (blank == null && h0 != null && h1 != null) {
      blank = Math.max(h0, h1);
    }
    return {
      kind: 'CeilingFiller',
      visibleHeightStartMm: h0,
      visibleHeightEndMm: h1,
      blankHeightMm: blank,
      plane: plane,
      materialSource: materialSource,
      fitContour: o.fitContour || (needsSiteMeasure ? 'nominal_pending_site_measure' : 'fitted'),
      price: o.price != null ? o.price : null,
      needsSiteMeasure: needsSiteMeasure,
      note:
        needsSiteMeasure
          ? 'Размер добора уточняется после замера'
          : 'Размер зафиксирован по замеру',
      status: 'manufacturer_required',
      sources: ['S15', 'S16'],
    };
  }

  /**
   * WallFiller (§3.1) — боковой добор; blank ≠ обязательная видимая ширина после подгонки.
   */
  function makeWallFiller(input) {
    var o = input || {};
    var side = o.side === 'right' ? 'right' : 'left';
    var visible = mm(o.visibleWidthMm, null);
    var blank = mm(o.blankWidthMm, null);
    var height = mm(o.heightMm, null);
    var plane = o.plane === 'recessed' ? 'recessed' : 'flushWithFront';
    var materialSource = o.materialSource === 'front' ? 'front' : 'carcass';
    var needsSiteMeasure = o.needsSiteMeasure !== false;
    return {
      kind: 'WallFiller',
      side: side,
      visibleWidthMm: visible,
      blankWidthMm: blank,
      heightMm: height,
      plane: plane,
      materialSource: materialSource,
      fitContour: o.fitContour || (needsSiteMeasure ? 'nominal_pending_site_measure' : 'fitted'),
      price: o.price != null ? o.price : null,
      needsSiteMeasure: needsSiteMeasure,
      note:
        needsSiteMeasure
          ? 'Размер добора уточняется после замера'
          : 'Размер зафиксирован по замеру',
      status: 'manufacturer_required',
      sources: ['S15'],
      sealNote:
        'Не копировать U-профиль nobilia в BOM CLODIS без утверждения производства.',
    };
  }

  function isKitchenTallPlacementKind(pk) {
    return String(pk || '').trim() === 'kitchen_tall';
  }

  function _tallBandModelFromProfile() {
    var p = getProfile();
    return (p && p.tall && p.tall.bandModel) || {};
  }

  /**
   * Верх НМ → низ НШ1.
   * Приоритет: opts → project.bandMidMm (в вилке) → kitchenRhythm.default → 600.
   */
  function resolveNmBandMidMm(opts) {
    var o = opts || {};
    if (o.bandMidMm != null && Number(o.bandMidMm) > 0) {
      return clampBandMidMm(o.bandMidMm);
    }
    try {
      var st = getKitchenProjectState();
      if (st.bandMidMm != null && Number(st.bandMidMm) > 0) {
        return clampBandMidMm(st.bandMidMm);
      }
    } catch (_) {}
    return getKitchenRhythmBandMidSpec().default;
  }

  /**
   * bandLow = корпус НМ без опор.
   * Источник правды: placementKind kitchen_base / kitchen_base_gola → settings.carcassHeightMm.
   * Приоритет: opts → сцена → профиль типа → fallback 720/780.
   */
  function resolveNmBandLowFromScene() {
    try {
      var st =
        global.__CLD_STATE_SINGLETON__ ||
        (global.state && global.state.scene ? global.state : null);
      var scene = st && st.scene;
      if (!scene || typeof scene.traverse !== 'function') return null;
      var counts = Object.create(null);
      scene.traverse(function (obj) {
        if (!obj || !obj.isGroup || !obj.userData || !obj.userData.isFurniture) return;
        var ud = obj.userData;
        var pk = String(
          ud.__placementKindProfileId || ud.placementKind || ''
        ).trim();
        if (
          pk !== 'kitchen_base' &&
          pk !== 'kitchen_base_gola' &&
          pk !== 'kitchen_base_corner'
        ) {
          return;
        }
        if (String(ud.productKind || '') === 'kitchen_tall') return;
        var h = Math.round(Number(ud.__kitchenCarcassHeightMm) || 0);
        if (!(h >= 500 && h <= 1000)) return;
        counts[h] = (counts[h] || 0) + 1;
      });
      var best = null;
      var bestN = 0;
      Object.keys(counts).forEach(function (key) {
        var n = counts[key];
        var h = Number(key);
        if (n > bestN || (n === bestN && best != null && h < best)) {
          bestN = n;
          best = h;
        }
      });
      return best != null && best > 0 ? best : null;
    } catch (_) {
      return null;
    }
  }

  function resolveNmBandLowMm(opts) {
    var o = opts || {};
    if (o.bandLowMm != null && Number(o.bandLowMm) > 0) {
      return Math.round(mm(o.bandLowMm, INFO_CARCASS_NON_GOLA_MM));
    }
    if (o.baseCarcassHeightMm != null && Number(o.baseCarcassHeightMm) > 0) {
      return Math.round(mm(o.baseCarcassHeightMm, INFO_CARCASS_NON_GOLA_MM));
    }
    var pkHint = String(o.placementKind || o.profileId || '').trim();
    if (pkHint === 'kitchen_base_gola' || pkHint === 'kitchen_base' || pkHint === 'kitchen_base_corner') {
      var fromPk = getCarcassHeightMmFromPlacementKind(pkHint);
      if (fromPk != null) return fromPk;
    }
    if (o.frontMode === 'gola' || o.frontMode === 'non_gola') {
      var pkMode = getBandLowPlacementKindForMode(o.frontMode);
      var fromMode = getCarcassHeightMmFromPlacementKind(pkMode);
      if (fromMode != null) return fromMode;
    }
    // Стоящие НМ важнее флага проекта.
    var fromScene = resolveNmBandLowFromScene();
    if (fromScene != null && fromScene > 0) return fromScene;
    var mode = 'non_gola';
    try {
      mode = getKitchenProjectState().frontMode === 'gola' ? 'gola' : 'non_gola';
    } catch (_) {}
    var pk = getBandLowPlacementKindForMode(mode);
    var fromCfg = getCarcassHeightMmFromPlacementKind(pk);
    if (fromCfg != null) return fromCfg;
    return mode === 'gola' ? INFO_CARCASS_GOLA_MM : INFO_CARCASS_NON_GOLA_MM;
  }

  /** Стандарт НШ1 (мм); НШ2 = H/2. Крупнее → первыми при подборе «в потолок». */
  var WALL_TIER1_STANDARD_MM = [960, 920, 860];

  function getRoomHeightMm(opts) {
    var o = opts || {};
    if (o.roomHeightMm != null && Number(o.roomHeightMm) > 0) {
      return Math.round(Number(o.roomHeightMm));
    }
    try {
      var st =
        global.__CLD_STATE_SINGLETON__ ||
        (global.state && global.state.room ? global.state : null);
      var h = st && st.room ? Number(st.room.height) : 0;
      if (h > 0) return Math.round(h);
    } catch (_) {}
    return 0;
  }

  /**
   * Тест: кухня в потолок.
   * НШ1 ∈ {860,920,960}, НШ2 = НШ1/2.
   * Берём наибольшую пару, у которой верх НШ2 ≤ высота комнаты (не выше).
   * Ниже — можно; выше — нельзя.
   */
  function resolveKitchenWallTiersToCeilingMm(opts) {
    var o = opts || {};
    var plinth = Math.round(
      mm(o.plinthHeightMm != null ? o.plinthHeightMm : getProjectPlinthHeightMm(), 100)
    );
    var bandLow = resolveNmBandLowMm(o);
    var bandMid = resolveNmBandMidMm(o);
    var roomH = getRoomHeightMm(o);
    var below = plinth + bandLow + bandMid;
    var avail = roomH > 0 ? roomH - below : 0;
    var standards = WALL_TIER1_STANDARD_MM.slice();
    try {
      var bm = _tallBandModelFromProfile();
      if (Array.isArray(bm.wallTier1StandardMm) && bm.wallTier1StandardMm.length) {
        standards = bm.wallTier1StandardMm
          .map(function (x) {
            return Math.round(Number(x) || 0);
          })
          .filter(function (x) {
            return x >= 400 && x <= 1200;
          })
          .sort(function (a, b) {
            return b - a;
          });
      }
    } catch (_) {}
    if (!standards.length) standards = WALL_TIER1_STANDARD_MM.slice();

    var picked = null;
    var i;
    for (i = 0; i < standards.length; i++) {
      var h1 = standards[i];
      var h2 = Math.round(h1 / 2);
      if (!(roomH > 0) || h1 + h2 <= avail) {
        picked = {
          bandHighMm: h1,
          bandTopMm: h2,
          fits: !(roomH > 0) || h1 + h2 <= avail,
        };
        break;
      }
    }
    if (!picked) {
      var h1s = standards[standards.length - 1];
      var h2s = Math.round(h1s / 2);
      picked = { bandHighMm: h1s, bandTopMm: h2s, fits: false };
    }

    var stackTop = below + picked.bandHighMm + picked.bandTopMm;
    var slack = roomH > 0 ? roomH - stackTop : null;
    return {
      ok: true,
      kitchenToCeiling: true,
      roomHeightMm: roomH || null,
      plinthHeightMm: plinth,
      bandLowMm: bandLow,
      bandMidMm: bandMid,
      bandHighMm: picked.bandHighMm,
      bandTopMm: picked.bandTopMm,
      wallTierStackMm: picked.bandHighMm + picked.bandTopMm,
      belowWallMm: below,
      stackTopFromFloorMm: stackTop,
      slackToCeilingMm: slack,
      fitsUnderCeiling: picked.fits !== false && (slack == null || slack >= 0),
      standardsTier1Mm: standards.slice(),
      standardsTier2Mm: standards.map(function (h) {
        return Math.round(h / 2);
      }),
      rule: 'wall_tiers_to_ceiling_pick_largest_pair',
      formula:
        'pick max H1 in {860,920,960} s.t. plinth+low+mid+H1+H1/2 <= roomH; H2=H1/2',
    };
  }

  function isKitchenToCeilingMode(opts) {
    var o = opts || {};
    if (o.kitchenToCeiling === false) return false;
    if (o.kitchenToCeiling === true) return true;
    try {
      var bm = _tallBandModelFromProfile();
      if (bm && bm.kitchenToCeiling === false) return false;
    } catch (_) {}
    return true;
  }

  /**
   * Датамы кухни (не фасады!) → высота корпуса пенала.
   * low = корпус НМ; mid = столешка + зазор до НШ; high = НШ1.
   * Горизонты корпуса — на стыках датамов (Y от низа корпуса, без опор).
   * Alias: resolveTallKitchenBandsMm (старое имя).
   */
  function resolveTallKitchenDatumsMm(opts) {
    var o = opts || {};
    var bm = _tallBandModelFromProfile();
    var bandLow = resolveNmBandLowMm(o);
    var worktopTh = Math.round(
      mm(
        o.worktopThicknessMm != null
          ? o.worktopThicknessMm
          : bm.worktopThicknessMm && bm.worktopThicknessMm.value,
        38
      )
    );
    // LOCKED: mid всегда 600 от верха НМ до низа НШ1 (столешка внутри).
    var bandMid = resolveNmBandMidMm(o);
    if (worktopTh >= bandMid) {
      worktopTh = Math.max(0, bandMid - 1);
    }
    var clearance = bandMid - worktopTh;
    var bandHigh = Math.round(
      mm(
        o.bandHighMm != null
          ? o.bandHighMm
          : o.wallMidHeightMm != null
            ? o.wallMidHeightMm
            : bm.bandHighMm && bm.bandHighMm.value,
        720
      )
    );

    var missing = [];
    if (!(bandLow > 0)) missing.push('bandLowMm');
    if (!(bandMid > 0)) missing.push('bandMidMm');
    if (!(bandHigh > 0)) missing.push('bandHighMm');

    var tallCarcassHeight = bandLow + bandMid + bandHigh;
    var datums = [
      {
        id: 'low',
        index: 0,
        heightMm: bandLow,
        y0Mm: 0,
        y1Mm: bandLow,
        layoutRole: 'tall_band_low',
        alignsTo: 'nm_carcass',
      },
      {
        id: 'mid',
        index: 1,
        heightMm: bandMid,
        y0Mm: bandLow,
        y1Mm: bandLow + bandMid,
        layoutRole: 'tall_band_mid',
        alignsTo: 'nm_top_to_wall_mid_bottom',
      },
      {
        id: 'high',
        index: 2,
        heightMm: bandHigh,
        y0Mm: bandLow + bandMid,
        y1Mm: tallCarcassHeight,
        layoutRole: 'tall_band_high',
        alignsTo: 'wall_mid',
      },
    ];
    var horizons = [
      {
        id: 'horizon_low_mid',
        yMm: bandLow,
        between: ['low', 'mid'],
        note: 'Горизонт на стыке датамов low/mid',
      },
      {
        id: 'horizon_mid_high',
        yMm: bandLow + bandMid,
        between: ['mid', 'high'],
        note: 'Горизонт на стыке датамов mid/high',
      },
    ];

    // Тест «в потолок»: high/top из 860/920/960 + half. Только если пара ≤ roomH (не выше).
    var ceilingTiers = null;
    var bandTopMm = null;
    if (
      isKitchenToCeilingMode(o) &&
      o.bandHighMm == null &&
      o.wallMidHeightMm == null
    ) {
      ceilingTiers = resolveKitchenWallTiersToCeilingMm({
        plinthHeightMm: o.plinthHeightMm,
        bandLowMm: bandLow,
        bandMidMm: bandMid,
        roomHeightMm: getRoomHeightMm(o),
      });
      if (
        ceilingTiers &&
        ceilingTiers.ok &&
        ceilingTiers.roomHeightMm > 0 &&
        ceilingTiers.fitsUnderCeiling
      ) {
        bandHigh = Math.round(ceilingTiers.bandHighMm);
        bandTopMm = Math.round(ceilingTiers.bandTopMm);
        tallCarcassHeight = bandLow + bandMid + bandHigh;
        datums[2].heightMm = bandHigh;
        datums[2].y1Mm = tallCarcassHeight;
        ceilingTiers.applied = true;
      } else if (ceilingTiers) {
        // Ни одна пара не влазит (напр. room 2500) — legacy 720/360, не выше потолка стандартами.
        ceilingTiers.applied = false;
        ceilingTiers.usedLegacyFallback = true;
        bandTopMm = Math.round(
          mm(bm.bandTopMm && bm.bandTopMm.value, 360)
        );
      }
    }

    return {
      ok: missing.length === 0,
      missing: missing,
      bandLowMm: bandLow,
      bandMidMm: bandMid,
      bandHighMm: bandHigh,
      bandTopMm: bandTopMm,
      ceilingTiers: ceilingTiers,
      worktopThicknessMm: worktopTh,
      clearanceAboveWorktopMm: clearance,
      tallCarcassHeightMm: tallCarcassHeight,
      datums: datums,
      horizons: horizons,
      antresolSeparate: true,
      formula: 'datums low+mid+high = tallCarcass; horizons on datum joints',
      rule: 'CLODIS_kitchen_datums_not_facades',
      status: 'project_default',
    };
  }

  /** @deprecated имя; используйте resolveTallKitchenDatumsMm */
  function resolveTallKitchenBandsMm(opts) {
    return resolveTallKitchenDatumsMm(opts);
  }

  /**
   * Раскладка фасадов пенала по типу (без техзазоров между дверями — следующий слой).
   * types: doors_3 | oven_mw | fridge
   */
  function resolveTallFacadeLayoutMm(opts) {
    var o = opts || {};
    var bands = resolveTallKitchenDatumsMm(o);
    if (!bands.ok) {
      return {
        ok: false,
        reason: 'bad_bands',
        missing: bands.missing,
        bands: bands,
        datums: bands.datums,
      };
    }

    var type = String(o.facadeType || o.type || 'doors_3').trim() || 'doors_3';
    var p = getProfile();
    var typeCfg =
      (p && p.tall && p.tall.facadeTypes && p.tall.facadeTypes[type]) || null;
    var carcass = bands.tallCarcassHeightMm;
    var facades = [];
    var warnings = [];
    var applianceRequired = [];

    if (type === 'doors_3') {
      facades = [
        {
          id: 'low',
          role: 'door',
          heightMm: bands.bandLowMm,
          spanDatums: ['low'],
          alignsTo: 'nm_carcass',
        },
        {
          id: 'mid',
          role: 'door',
          heightMm: bands.bandMidMm,
          spanDatums: ['mid'],
          alignsTo: 'worktop_plus_clearance',
        },
        {
          id: 'high',
          role: 'door',
          heightMm: bands.bandHighMm,
          spanDatums: ['high'],
          alignsTo: 'wall_mid',
        },
      ];
    } else if (type === 'oven_mw') {
      var lowerHalf = Math.round(
        mm(
          o.lowerHalfOfNmMm != null
            ? o.lowerHalfOfNmMm
            : typeCfg && typeCfg.lowerHalfOfNmMm && typeCfg.lowerHalfOfNmMm.value,
          Math.round(bands.bandLowMm / 2)
        )
      );
      var oven = Math.round(
        mm(
          o.ovenNicheMm != null
            ? o.ovenNicheMm
            : typeCfg && typeCfg.ovenNicheMm && typeCfg.ovenNicheMm.value,
          600
        )
      );
      var mw = Math.round(
        mm(
          o.microwaveNicheMm != null
            ? o.microwaveNicheMm
            : typeCfg && typeCfg.microwaveNicheMm && typeCfg.microwaveNicheMm.value,
          300
        )
      );
      applianceRequired.push('ovenNicheMm', 'microwaveNicheMm');
      var used = lowerHalf + oven + mw;
      var top = carcass - used;
      if (top < 50) {
        return {
          ok: false,
          reason: 'oven_mw_overflow',
          message:
            'Сумма 360/духовка/СВЧ больше корпуса пенала. Уменьшите ниши или увеличьте пояса.',
          bands: bands,
          lowerHalfOfNmMm: lowerHalf,
          ovenNicheMm: oven,
          microwaveNicheMm: mw,
          tallCarcassHeightMm: carcass,
        };
      }
      facades = [
        {
          id: 'low_half',
          role: 'door',
          heightMm: lowerHalf,
          spanDatums: ['low'],
          spanNote: 'Часть датама low (не весь пояс)',
          alignsTo: 'half_nm',
        },
        {
          id: 'oven',
          role: 'appliance_niche',
          heightMm: oven,
          spanDatums: null,
          alignsTo: 'oven',
          status: 'appliance_required',
        },
        {
          id: 'microwave',
          role: 'appliance_niche',
          heightMm: mw,
          spanDatums: null,
          alignsTo: 'microwave',
          status: 'appliance_required',
        },
        {
          id: 'high',
          role: 'door',
          heightMm: top,
          spanDatums: ['high'],
          spanNote: 'Остаток до верха корпуса',
          alignsTo: 'rest_to_wall_mid_top',
        },
      ];
      warnings.push({
        level: 'needs_review',
        code: 'appliance_niches_draft',
        message: 'Ниши духовки/СВЧ — черновик; сверить по SKU прибора.',
      });
    } else if (type === 'fridge') {
      facades = [
        {
          id: 'low',
          role: 'door',
          heightMm: bands.bandLowMm,
          spanDatums: ['low'],
          alignsTo: 'nm_carcass',
        },
        {
          id: 'upper',
          role: 'door',
          heightMm: bands.bandMidMm + bands.bandHighMm,
          spanDatums: ['mid', 'high'],
          alignsTo: 'mid_plus_wall_mid',
          note: 'Одна дверь на два датама mid+high; горизонт mid/high внутри остаётся.',
        },
      ];
      warnings.push({
        level: 'needs_review',
        code: 'fridge_sku_required',
        message: 'Высоты ниши холодильника уточнять по SKU; раскладка фасадов — проектный черновик.',
      });
    } else {
      return {
        ok: false,
        reason: 'unknown_facade_type',
        message: 'Неизвестный тип пенала: ' + type + '. Допустимо: doors_3 | oven_mw | fridge.',
        bands: bands,
      };
    }

    var sum = 0;
    for (var i = 0; i < facades.length; i++) sum += facades[i].heightMm;
    if (sum !== carcass) {
      warnings.push({
        level: 'advisory',
        code: 'facade_sum_vs_carcass',
        message: 'Σ фасадов ' + sum + ' ≠ корпус ' + carcass + ' (без техзазоров).',
        sumFacadesMm: sum,
        tallCarcassHeightMm: carcass,
      });
    }

    var depth =
      o.carcassDepthMm != null
        ? Math.round(mm(o.carcassDepthMm, 560))
        : p && p.tall && p.tall.carcassDepthMm
          ? Math.round(mm(p.tall.carcassDepthMm.value, 560))
          : 560;

    return {
      ok: true,
      facadeType: type,
      label: (typeCfg && typeCfg.label) || type,
      bands: bands,
      datums: bands.datums,
      horizons: bands.horizons,
      facades: facades,
      tallCarcassHeightMm: carcass,
      carcassDepthMm: depth,
      hasWorktop: false,
      antresolSeparate: true,
      techGapsIncluded: false,
      applianceRequired: applianceRequired,
      warnings: warnings,
      formula:
        'datums = kitchen rhythm; facades.spanDatums may cover 1+ datums; horizons on joints',
      status: 'project_default',
      productionSpecAllowed: false,
    };
  }

  /** Высота корпуса пенала из датамов. */
  function computeTallCarcassHeightFromBandsMm(opts) {
    var bands = resolveTallKitchenDatumsMm(opts);
    return {
      ok: bands.ok,
      tallCarcassHeightMm: bands.tallCarcassHeightMm,
      bands: bands,
      datums: bands.datums,
    };
  }

  /**
   * layoutZones для пенала: plinth + 3 датама.
   * Роли секций: tall_band_low / tall_band_mid / tall_band_high.
   * Горизонты — детали на y = horizon*.yMm от низа корпуса (+ plinth в комнате).
   */
  function resolveTallLayoutZonesMm(opts) {
    var o = opts || {};
    var datums = resolveTallKitchenDatumsMm(o);
    var plinth = snapSupportHeightMm(
      o.plinthHeightMm != null ? o.plinthHeightMm : getProjectPlinthHeightMm()
    );
    if (!datums.ok) {
      return {
        ok: false,
        reason: 'bad_datums',
        missing: datums.missing,
        datums: datums,
      };
    }
    var facade = null;
    if (o.facadeType || o.includeFacades === true) {
      facade = resolveTallFacadeLayoutMm(o);
    }
    var carcass = datums.tallCarcassHeightMm;
    return {
      ok: true,
      version: 1,
      placementKind: 'kitchen_tall',
      innerMm: carcass,
      zones: {
        plinthMm: plinth,
        tallBandLowMm: datums.bandLowMm,
        tallBandMidMm: datums.bandMidMm,
        tallBandHighMm: datums.bandHighMm,
        carcassMm: carcass,
        hTopMm: 0,
        serviceMm: 0,
        horizonLowMidYMm: plinth + datums.bandLowMm,
        horizonMidHighYMm: plinth + datums.bandLowMm + datums.bandMidMm,
      },
      datums: datums.datums,
      horizons: datums.horizons.map(function (h) {
        return {
          id: h.id,
          yFromCarcassBottomMm: h.yMm,
          yFromFloorMm: plinth + h.yMm,
          between: h.between,
        };
      }),
      facadeLayout: facade && facade.ok ? facade : null,
      totalHeightMm: plinth + carcass,
      meta: {
        note: 'kitchen_tall: datums drive band heights; facades span separately',
      },
    };
  }

  /**
   * Глубина пенала (не стек НМ wall+10+корпус+40).
   *
   *   стена ──[rear 0]── пенал (560) ── перед ═══ перед корпуса НМ
   *                                      └──[+40]── торец столешницы
   *
   * При Dwt=600: перед НМ = 10+550 = 560 = глубина пенала вплотную к стене.
   * Каталог 560 правильный; resolveBaseCarcassDepthMm (max 550) сюда НЕ звать.
   */
  function resolveTallCarcassDepthMm(opts) {
    var o = opts || {};
    var dwt = Math.round(
      mm(o.worktopDepthMm != null ? o.worktopDepthMm : getProjectWorktopDepthMm(), 600)
    );
    if (!(dwt > 0)) dwt = 600;
    var frontSetback = FRONT_SETBACK_TO_CARCASS_MM;
    // Линия переда корпуса НМ от стены = Dwt − 40 (столешка выпирает на 40).
    var nmCarcassFrontFromWallMm = Math.round(dwt - frontSetback);
    var preferred =
      o.preferredCarcassDepthMm != null
        ? Math.round(mm(o.preferredCarcassDepthMm, 0))
        : o.carcassDepthMm != null
          ? Math.round(mm(o.carcassDepthMm, 0))
          : 0;
    if (!(preferred > 0)) preferred = pTallDepthFallback_();
    // Каталог/профиль; если пусто или явно «как столешка» (≥Dwt) — геометрическое 560.
    var carcassDepthMm = preferred;
    if (!(carcassDepthMm > 0) || carcassDepthMm >= dwt) {
      carcassDepthMm = nmCarcassFrontFromWallMm;
    }
    if (carcassDepthMm < 400) carcassDepthMm = nmCarcassFrontFromWallMm;
    return {
      ok: true,
      carcassDepthMm: Math.round(carcassDepthMm),
      worktopDepthMm: dwt,
      rearOverhangMm: 0,
      frontSetbackToCarcassMm: 0,
      nmCarcassFrontFromWallMm: nmCarcassFrontFromWallMm,
      worktopOverhangBeyondTallFrontMm: frontSetback,
      rule: 'tall_flush_wall_front_aligns_nm_carcass_front',
    };
  }

  /** Посадка пенала: высота = опоры + датамы; глубина = каталог/560 (линия переда НМ). */
  function resolveKitchenTallPlaceSizing(opts) {
    var o = opts || {};
    var zones = resolveTallLayoutZonesMm(o);
    if (!zones.ok) {
      return { ok: false, reason: zones.reason || 'tall_zones_failed', zones: zones };
    }
    var depth = resolveTallCarcassDepthMm(o);
    var carcassDepthMm = depth.ok ? depth.carcassDepthMm : pTallDepthFallback_();
    return {
      ok: true,
      plinthHeightMm: zones.zones.plinthMm,
      tallCarcassHeightMm: zones.zones.carcassMm,
      totalHeightMm: zones.totalHeightMm,
      h_bottom: zones.zones.plinthMm,
      carcassDepthMm: carcassDepthMm,
      hasWorktop: false,
      rearOverhangMm: 0,
      frontSetbackToCarcassMm: 0,
      nmCarcassFrontFromWallMm: depth.nmCarcassFrontFromWallMm,
      worktopOverhangBeyondTallFrontMm: depth.worktopOverhangBeyondTallFrontMm,
      layoutZones: zones,
      datums: zones.datums,
      horizons: zones.horizons,
      facadeType: o.facadeType || null,
      rule: 'kitchen_tall_datums_flush_wall_front_eq_nm',
      depthRule: depth.rule,
    };
  }

  function pTallDepthFallback_() {
    var p = getProfile();
    return p && p.tall && p.tall.carcassDepthMm
      ? Math.round(mm(p.tall.carcassDepthMm.value, 560))
      : 560;
  }

  /**
   * Цепочка колонны к потолку (§3.1).
   * plinth + tallCarcass + optionalTopUnit + installationClearance + ceilingFiller
   *   = measuredCeilingHeightAtPosition
   *
   * Корпус остаётся на одном уровне; добор впитывает разницу потолка по концам ряда.
   * Запрещено автоматически уменьшать утверждённую высоту корпуса.
   *
   * Опционально: facadeType / fromKitchenBands → tallCarcassHeight из поясов CLODIS
   * (не ломает вызовы с явным tallCarcassHeight).
   */
  function computeTallStackWithCeilingFillerMm(input) {
    var floorY = mm(input && input.finishedFloorY, 0);
    var plinth = mm(input && input.plinthHeight, null);
    var tall = mm(input && input.tallCarcassHeight, null);
    var topUnit = mm(input && input.topUnitCarcassHeight, 0) || 0;
    var install = mm(input && input.installationClearance, null);
    var ceilStart = mm(input && input.ceilingHeightStartMm, null);
    var ceilEnd = mm(input && input.ceilingHeightEndMm, ceilStart);

    // Opt-in: высота корпуса из поясов кухни (явный tallCarcassHeight важнее).
    var facadeLayout = null;
    var bandsMeta = null;
    if (
      tall == null &&
      input &&
      (input.fromKitchenBands === true || input.facadeType != null)
    ) {
      facadeLayout = resolveTallFacadeLayoutMm(input);
      if (facadeLayout && facadeLayout.ok) {
        tall = facadeLayout.tallCarcassHeightMm;
        bandsMeta = facadeLayout.bands;
      }
    }

    var missing = [];
    if (plinth == null) missing.push('plinthHeight');
    if (tall == null) missing.push('tallCarcassHeight');
    if (install == null) missing.push('installationClearance');
    if (ceilStart == null) missing.push('ceilingHeightStartMm');

    var plinthY1 = plinth == null ? null : floorY + plinth;
    var tallY1 = plinthY1 == null || tall == null ? null : plinthY1 + tall;
    var carcassTopY = tallY1 == null ? null : tallY1 + topUnit;

    var fillerStart =
      missing.length || carcassTopY == null || install == null
        ? null
        : ceilStart - (carcassTopY + install);
    var fillerEnd =
      missing.length || carcassTopY == null || install == null || ceilEnd == null
        ? null
        : ceilEnd - (carcassTopY + install);

    var slopeMmPerRun = null;
    if (ceilStart != null && ceilEnd != null) {
      slopeMmPerRun = ceilEnd - ceilStart;
    }

    var ok = missing.length === 0 && fillerStart != null && fillerEnd != null;
    var blocking = [];
    if (ok && (fillerStart < 0 || fillerEnd < 0)) {
      blocking.push({
        level: 'blocking',
        code: 'ceiling_too_low_for_carcass',
        message:
          'Потолок ниже верха колонны + монтажный зазор. Не подрезать корпус — сменить высоту/состав ряда или уточнить замер.',
        basis: ETALON + ' §3.1',
        fillerStartMm: fillerStart,
        fillerEndMm: fillerEnd,
      });
      ok = false;
    }

    var ceilingFiller =
      fillerStart == null || fillerEnd == null
        ? null
        : makeCeilingFiller({
            visibleHeightStartMm: Math.max(0, fillerStart),
            visibleHeightEndMm: Math.max(0, fillerEnd),
            blankHeightMm: Math.max(0, fillerStart, fillerEnd),
            plane: (input && input.ceilingFillerPlane) || 'flushWithFront',
            materialSource: (input && input.ceilingFillerMaterial) || 'carcass',
            needsSiteMeasure: !(input && input.siteMeasured === true),
          });

    return {
      ok: ok && blocking.length === 0,
      missing: missing,
      blocking: blocking,
      finishedFloorY: floorY,
      plinthHeight: plinth,
      tallCarcassHeight: tall,
      topUnitCarcassHeight: topUnit,
      installationClearance: install,
      ceilingHeightStartMm: ceilStart,
      ceilingHeightEndMm: ceilEnd,
      ceilingSlopeDeltaMm: slopeMmPerRun,
      kitchenBands: bandsMeta,
      facadeLayout: facadeLayout,
      layers: {
        plinth: {
          y0: floorY,
          y1: plinthY1,
          height: plinth,
        },
        tallCarcass: {
          y0: plinthY1,
          y1: tallY1,
          height: tall,
        },
        topUnit: topUnit
          ? {
              y0: tallY1,
              y1: carcassTopY,
              height: topUnit,
            }
          : null,
        installationClearance: {
          y0: carcassTopY,
          y1: carcassTopY == null || install == null ? null : carcassTopY + install,
          height: install,
        },
        ceilingFiller: ceilingFiller
          ? {
              y0Start: carcassTopY == null || install == null ? null : carcassTopY + install,
              y0End: carcassTopY == null || install == null ? null : carcassTopY + install,
              y1Start: ceilStart,
              y1End: ceilEnd,
              heightStartMm: ceilingFiller.visibleHeightStartMm,
              heightEndMm: ceilingFiller.visibleHeightEndMm,
            }
          : null,
      },
      carcassTopY: carcassTopY,
      ceilingFiller: ceilingFiller,
      formula:
        'plinth + tallCarcass + optionalTopUnit + installationClearance + ceilingFiller = measuredCeilingHeightAtPosition',
      rule: 'carcass_level_fixed_fillers_absorb_ceiling_delta',
    };
  }

  /**
   * Прямой ряд колонн: боковые + верхний доборы, два замера потолка (§3.1 приоритет).
   */
  function buildStraightTallRunWithFillers(opts) {
    var o = opts || {};
    var frontMode = String(o.frontMode || 'non_gola').trim() || 'non_gola';
    var p = getProfile();
    var defaultTall =
      p.tall && p.tall.carcassHeightsMm && p.tall.carcassHeightsMm[2]
        ? p.tall.carcassHeightsMm[2].value
        : 2160;
    var defaultDepth =
      p.tall && p.tall.carcassDepthMm ? p.tall.carcassDepthMm.value : 560;

    var stack = computeTallStackWithCeilingFillerMm({
      finishedFloorY: o.finishedFloorY,
      plinthHeight: o.plinthHeight,
      tallCarcassHeight: o.tallCarcassHeight != null ? o.tallCarcassHeight : defaultTall,
      topUnitCarcassHeight: o.topUnitCarcassHeight,
      installationClearance: o.installationClearance,
      ceilingHeightStartMm: o.ceilingHeightStartMm,
      ceilingHeightEndMm: o.ceilingHeightEndMm,
      ceilingFillerPlane: o.ceilingFillerPlane,
      ceilingFillerMaterial: o.ceilingFillerMaterial,
      siteMeasured: o.siteMeasured,
    });

    var modules = Array.isArray(o.modules) ? o.modules : [];
    var totalWidth = 0;
    for (var i = 0; i < modules.length; i++) {
      totalWidth += mm(modules[i] && modules[i].widthMm, 0);
    }

    var leftFiller =
      o.leftWallFiller === false
        ? null
        : makeWallFiller(
            Object.assign(
              {
                side: 'left',
                heightMm: stack.tallCarcassHeight,
                visibleWidthMm: mm(o.leftWallFillerWidthMm, 100),
                blankWidthMm: mm(o.leftWallFillerBlankMm, mm(o.leftWallFillerWidthMm, 100)),
                materialSource: o.wallFillerMaterial || 'carcass',
                needsSiteMeasure: !(o.siteMeasured === true),
              },
              o.leftWallFiller && typeof o.leftWallFiller === 'object' ? o.leftWallFiller : {}
            )
          );
    var rightFiller =
      o.rightWallFiller === false
        ? null
        : makeWallFiller(
            Object.assign(
              {
                side: 'right',
                heightMm: stack.tallCarcassHeight,
                visibleWidthMm: mm(o.rightWallFillerWidthMm, 100),
                blankWidthMm: mm(o.rightWallFillerBlankMm, mm(o.rightWallFillerWidthMm, 100)),
                materialSource: o.wallFillerMaterial || 'carcass',
                needsSiteMeasure: !(o.siteMeasured === true),
              },
              o.rightWallFiller && typeof o.rightWallFiller === 'object' ? o.rightWallFiller : {}
            )
          );

    var fillersWidth =
      (leftFiller && leftFiller.visibleWidthMm ? leftFiller.visibleWidthMm : 0) +
      (rightFiller && rightFiller.visibleWidthMm ? rightFiller.visibleWidthMm : 0);

    var warnings = [];
    if (stack.blocking && stack.blocking.length) {
      warnings = warnings.concat(stack.blocking);
    }
    if (!stack.ok && stack.missing.length) {
      warnings.push({
        level: 'needs_review',
        code: 'incomplete_tall_stack',
        message: 'Не заданы: ' + stack.missing.join(', '),
        basis: ETALON + ' §3.1',
      });
    }
    if (stack.ceilingSlopeDeltaMm != null && Math.abs(stack.ceilingSlopeDeltaMm) > 0.5) {
      warnings.push({
        level: 'advisory',
        code: 'ceiling_slope_absorbed_by_filler',
        message:
          'Потолок отличается на концах ряда на ' +
          Math.round(stack.ceilingSlopeDeltaMm) +
          ' мм — корпуса на одном уровне, клиновидный CeilingFiller.',
        basis: ETALON + ' §3.1',
      });
    }
    if (
      (leftFiller && leftFiller.needsSiteMeasure) ||
      (rightFiller && rightFiller.needsSiteMeasure) ||
      (stack.ceilingFiller && stack.ceilingFiller.needsSiteMeasure)
    ) {
      warnings.push({
        level: 'advisory',
        code: 'filler_needs_site_measure',
        message: 'Размер добора уточняется после замера',
        basis: ETALON + ' §3.1',
      });
    }
    if (o.checkDoorSwingAgainstWall === true) {
      var wallClear = leftFiller
        ? leftFiller.visibleWidthMm
        : rightFiller
          ? rightFiller.visibleWidthMm
          : 0;
      if (wallClear != null && wallClear < 50) {
        warnings.push({
          level: 'needs_review',
          code: 'door_swing_vs_wall',
          message:
            'Малый боковой добор — проверить полный ход двери/ручки/Gola; увеличить WallFiller или ограничить угол.',
          basis: ETALON + ' §3.1 / S17',
        });
      }
    }
    if (frontMode === 'gola') {
      var gola = p.frontModes && p.frontModes.gola;
      if (!gola || !gola.system || !gola.system.sku) {
        warnings.push({
          level: 'advisory',
          code: 'gola_sku_missing',
          message: 'Gola без артикула серии — 3D-концепт, не производство.',
          basis: ETALON + ' §4',
        });
      }
    }

    var awaitingApproval = [
      'tall_carcass_grid',
      'installation_clearance',
      'ceiling_filler_blank_and_fix',
      'wall_filler_blank_and_seal',
      'filler_material_carcass_vs_front',
      'door_lift_angle_stop_near_ceiling',
    ];

    return {
      kind: 'kitchen_straight_tall_run_with_fillers',
      version: 1,
      placementRole: 'kitchen_tall',
      frontMode: frontMode,
      profileId: p.id,
      profileStatus: p.status,
      etalonDoc: ETALON,
      stack: stack,
      run: {
        layout: 'straight',
        modules: modules,
        modulesWidthMm: totalWidth,
        fillersWidthMm: fillersWidth,
        totalWidthMm: totalWidth + fillersWidth,
        carcassDepthMm: mm(o.carcassDepthMm, defaultDepth),
      },
      fillers: {
        top: stack.ceilingFiller,
        left: leftFiller,
        right: rightFiller,
      },
      roomMeasures: {
        ceilingHeightStartMm: stack.ceilingHeightStartMm,
        ceilingHeightEndMm: stack.ceilingHeightEndMm,
        ceilingSlopeDeltaMm: stack.ceilingSlopeDeltaMm,
        wallDeviationMm: mm(o.wallDeviationMm, null),
        installationAllowanceMm: stack.installationClearance,
        siteMeasured: !!o.siteMeasured,
      },
      gola: frontMode === 'gola' ? { enabled: true, system: p.frontModes.gola.system } : null,
      warnings: warnings,
      awaitingManufacturerApproval: awaitingApproval,
      productionSpecAllowed: false,
      serializable: true,
    };
  }

  /** Вертикальный срез прямого низа: модули + столешница + цоколь + режим фронта. */
  function buildStraightBaseRunState(opts) {
    var o = opts || {};
    var frontMode = String(o.frontMode || 'non_gola').trim() || 'non_gola';
    var placementRole = frontMode === 'gola' ? 'kitchen_base_gola' : 'kitchen_base';
    var stack = computeBaseStackMm({
      finishedFloorY: o.finishedFloorY,
      plinthHeight: o.plinthHeight,
      baseCarcassHeight: o.baseCarcassHeight,
      worktopThickness: o.worktopThickness,
      frontMode: frontMode,
    });
    var modules = Array.isArray(o.modules) ? o.modules : [];
    var totalWidth = 0;
    for (var i = 0; i < modules.length; i++) {
      totalWidth += mm(modules[i] && modules[i].widthMm, 0);
    }
    var warnings = [];
    if (!stack.ok) {
      warnings.push({
        level: 'needs_review',
        code: 'incomplete_stack',
        message: 'Не заданы: ' + stack.missing.join(', '),
        basis: ETALON + ' §2',
      });
    }
    if (frontMode === 'gola') {
      var gola = getProfile().frontModes && getProfile().frontModes.gola;
      if (!gola || !gola.system || !gola.system.sku) {
        warnings.push({
          level: 'advisory',
          code: 'gola_sku_missing',
          message: 'Gola без артикула серии — 3D-концепт, не производство.',
          basis: ETALON + ' §4',
        });
      }
    }
    return {
      kind: 'kitchen_straight_base_run',
      version: 1,
      placementRole: placementRole,
      frontMode: frontMode,
      profileId: getProfile().id,
      profileStatus: getProfile().status,
      etalonDoc: ETALON,
      stack: stack,
      run: {
        layout: 'straight',
        modules: modules,
        totalWidthMm: totalWidth,
        carcassDepthMm: mm(
          o.carcassDepthMm,
          getProfile().base && getProfile().base.carcassDepthMm
            ? getProfile().base.carcassDepthMm.value
            : 560
        ),
      },
      gola: frontMode === 'gola' ? { enabled: true, system: getProfile().frontModes.gola.system } : null,
      warnings: warnings,
      serializable: true,
    };
  }

  function serializeRun(state) {
    return JSON.stringify(state || buildStraightBaseRunState({}), null, 2);
  }

  async function loadProfileFromServer() {
    try {
      var res = await fetch(PROFILE_URL + '?ts=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var json = await res.json();
      return setProfile(json, true);
    } catch (e) {
      return setProfile(getBuiltinDraftProfile(), false);
    }
  }

  function audit() {
    var p = getProfile();
    var sample = buildStraightBaseRunState({
      frontMode: 'non_gola',
      plinthHeight: 120,
      baseCarcassHeight: 720,
      worktopThickness: 38,
      modules: [{ id: 'demo', widthMm: 600 }],
    });
    var golaSample = buildStraightBaseRunState({
      frontMode: 'gola',
      plinthHeight: 150,
      baseCarcassHeight: 864,
      worktopThickness: 38,
      modules: [{ id: 'demo-gola', widthMm: 600 }],
    });
    // Контрольный пример §3.1: разный потолок на концах → клиновидный CeilingFiller
    // (явный tallCarcassHeight — legacy path, без изменения поведения).
    var tallSample = buildStraightTallRunWithFillers({
      frontMode: 'non_gola',
      plinthHeight: 100,
      tallCarcassHeight: 2160,
      installationClearance: 20,
      ceilingHeightStartMm: 2500,
      ceilingHeightEndMm: 2530,
      leftWallFillerWidthMm: 100,
      rightWallFillerWidthMm: 100,
      modules: [
        { id: 'tall-a', widthMm: 600, kind: 'tall_storage' },
        { id: 'tall-b', widthMm: 600, kind: 'tall_oven' },
      ],
      checkDoorSwingAgainstWall: true,
      siteMeasured: false,
    });
    // CLODIS пояса: 720 + (38+560) + 720 = 2038; три типа фасадов.
    var tallBands = resolveTallKitchenBandsMm({});
    var tallDoors3 = resolveTallFacadeLayoutMm({ facadeType: 'doors_3' });
    var tallOvenMw = resolveTallFacadeLayoutMm({ facadeType: 'oven_mw' });
    var tallFridge = resolveTallFacadeLayoutMm({ facadeType: 'fridge' });
    var report = {
      ok: true,
      etalonDoc: ETALON,
      profileId: p.id,
      profileStatus: p.status,
      requiresApproval: !!p.requiresApproval,
      roles: Object.keys(p.placementRoles || {}),
      sampleNonGolaWorktopTopY: sample.stack.worktopTopY,
      sampleGolaWorktopTopY: golaSample.stack.worktopTopY,
      formula: sample.stack.formula,
      warningsDemo: golaSample.warnings,
      tallFillers: {
        formula: tallSample.stack.formula,
        ok: tallSample.stack.ok,
        carcassTopY: tallSample.stack.carcassTopY,
        ceilingFillerStartMm: tallSample.fillers.top && tallSample.fillers.top.visibleHeightStartMm,
        ceilingFillerEndMm: tallSample.fillers.top && tallSample.fillers.top.visibleHeightEndMm,
        leftWallFillerMm: tallSample.fillers.left && tallSample.fillers.left.visibleWidthMm,
        rightWallFillerMm: tallSample.fillers.right && tallSample.fillers.right.visibleWidthMm,
        totalWidthMm: tallSample.run.totalWidthMm,
        warnings: tallSample.warnings,
        awaitingManufacturerApproval: tallSample.awaitingManufacturerApproval,
        productionSpecAllowed: tallSample.productionSpecAllowed,
      },
      tallBandsClodis: {
        ok: tallBands.ok,
        tallCarcassHeightMm: tallBands.tallCarcassHeightMm,
        bands: {
          low: tallBands.bandLowMm,
          mid: tallBands.bandMidMm,
          high: tallBands.bandHighMm,
        },
        doors_3: tallDoors3.ok
          ? tallDoors3.facades.map(function (f) {
              return f.heightMm;
            })
          : null,
        oven_mw: tallOvenMw.ok
          ? tallOvenMw.facades.map(function (f) {
              return f.heightMm;
            })
          : null,
        fridge: tallFridge.ok
          ? tallFridge.facades.map(function (f) {
              return f.heightMm;
            })
          : null,
      },
    };
    if (typeof console !== 'undefined' && console.log) {
      console.log('[KitchenManufacturingProfile] audit', report);
    }
    return report;
  }

  // Синхронизировать runtime-зеркало при загрузке модуля.
  try {
    mirrorKitchenProjectToRuntime(getKitchenProjectState());
  } catch (eMirror) {}

  var api = {
    ETALON: ETALON,
    PROFILE_URL: PROFILE_URL,
    LS_KEY: LS_KEY,
    PROJECT_LS_KEY: PROJECT_LS_KEY,
    SUPPORT_HEIGHTS_MM: SUPPORT_HEIGHTS_MM,
    DEFAULT_SUPPORT_CABINET_MODEL_IDS: DEFAULT_SUPPORT_CABINET_MODEL_IDS,
    BASE_CARCASS_DEPTHS_MM: BASE_CARCASS_DEPTHS_MM,
    MIN_BASE_CARCASS_DEPTH_MM: MIN_BASE_CARCASS_DEPTH_MM,
    DEFAULT_WORKTOP_DEPTH_MM: DEFAULT_WORKTOP_DEPTH_MM,
    FRONT_SETBACK_TO_CARCASS_MM: FRONT_SETBACK_TO_CARCASS_MM,
    REAR_OVERHANG_MIN_MM: REAR_OVERHANG_MIN_MM,
    INFO_CARCASS_NON_GOLA_MM: INFO_CARCASS_NON_GOLA_MM,
    INFO_CARCASS_GOLA_MM: INFO_CARCASS_GOLA_MM,
    INFO_BAND_MID_MM: INFO_BAND_MID_MM,
    INFO_BAND_MID_MIN_MM: INFO_BAND_MID_MIN_MM,
    INFO_BAND_MID_MAX_MM: INFO_BAND_MID_MAX_MM,
    getKitchenRhythmBandMidSpec: getKitchenRhythmBandMidSpec,
    getCarcassHeightMmFromPlacementKind: getCarcassHeightMmFromPlacementKind,
    getBandLowPlacementKindForMode: getBandLowPlacementKindForMode,
    clampBandMidMm: clampBandMidMm,
    resolveNmBandLowMm: resolveNmBandLowMm,
    resolveNmBandMidMm: resolveNmBandMidMm,
    getBuiltinDraftProfile: getBuiltinDraftProfile,
    getProfile: getProfile,
    setProfile: setProfile,
    loadProfileFromServer: loadProfileFromServer,
    snapSupportHeightMm: snapSupportHeightMm,
    getSupportModelsByHeightMm: getSupportModelsByHeightMm,
    resolveSupportCabinetModelBinding: resolveSupportCabinetModelBinding,
    normalizeSupportModelsMap: normalizeSupportModelsMap,
    getMinBaseCarcassDepthMm: getMinBaseCarcassDepthMm,
    getBaseCarcassDepthOptionsMm: getBaseCarcassDepthOptionsMm,
    getBaseCarcassDepthBoundsMm: getBaseCarcassDepthBoundsMm,
    getAllowedBaseCarcassDepthsMm: getAllowedBaseCarcassDepthsMm,
    getWorktopDepthDefaults: getWorktopDepthDefaults,
    resolveBaseCarcassDepthMm: resolveBaseCarcassDepthMm,
    resolveTallCarcassDepthMm: resolveTallCarcassDepthMm,
    resolveWorktopStackDepth: resolveWorktopStackDepth,
    isKitchenBasePlacementKind: isKitchenBasePlacementKind,
    isKitchenTallPlacementKind: isKitchenTallPlacementKind,
    resolveTallKitchenDatumsMm: resolveTallKitchenDatumsMm,
    resolveTallKitchenBandsMm: resolveTallKitchenBandsMm,
    resolveTallFacadeLayoutMm: resolveTallFacadeLayoutMm,
    computeTallCarcassHeightFromBandsMm: computeTallCarcassHeightFromBandsMm,
    resolveTallLayoutZonesMm: resolveTallLayoutZonesMm,
    resolveKitchenTallPlaceSizing: resolveKitchenTallPlaceSizing,
    resolveKitchenWallMidPlaceSizing: resolveKitchenWallMidPlaceSizing,
    resolveKitchenWallTopPlaceSizing: resolveKitchenWallTopPlaceSizing,
    resolveKitchenWallTiersToCeilingMm: resolveKitchenWallTiersToCeilingMm,
    WALL_TIER1_STANDARD_MM: WALL_TIER1_STANDARD_MM,
    getRoomHeightMm: getRoomHeightMm,
    isKitchenToCeilingMode: isKitchenToCeilingMode,
    getKitchenProjectState: getKitchenProjectState,
    setKitchenProjectState: setKitchenProjectState,
    hydrateKitchenProjectFromSave: hydrateKitchenProjectFromSave,
    getKitchenProjectForSave: getKitchenProjectForSave,
    getStep3KitchenStackInfo: getStep3KitchenStackInfo,
    isGolaCatalogReady: isGolaCatalogReady,
    getPreferredKitchenBasePlacementKind: getPreferredKitchenBasePlacementKind,
    getProjectPlinthHeightMm: getProjectPlinthHeightMm,
    setProjectPlinthHeightMm: setProjectPlinthHeightMm,
    getProjectWorktopDepthMm: getProjectWorktopDepthMm,
    setProjectWorktopDepthMm: setProjectWorktopDepthMm,
    getProjectBaseCarcassDepthMm: getProjectBaseCarcassDepthMm,
    setProjectBaseCarcassDepthMm: setProjectBaseCarcassDepthMm,
    resolveKitchenBasePlaceSizing: resolveKitchenBasePlaceSizing,
    computeBaseStackMm: computeBaseStackMm,
    computeWallStackMm: computeWallStackMm,
    makeCeilingFiller: makeCeilingFiller,
    makeWallFiller: makeWallFiller,
    computeTallStackWithCeilingFillerMm: computeTallStackWithCeilingFillerMm,
    buildStraightBaseRunState: buildStraightBaseRunState,
    buildStraightTallRunWithFillers: buildStraightTallRunWithFillers,
    serializeRun: serializeRun,
    audit: audit,
  };

  global.__cldKitchenManufacturing = api;
  if (typeof global.__cldKitchenProfileAudit !== 'function') {
    global.__cldKitchenProfileAudit = audit;
  }

  return api;
})(typeof window !== 'undefined' ? window : globalThis);
