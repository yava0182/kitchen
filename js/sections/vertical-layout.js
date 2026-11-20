/**
 * Вертикальные «уровни» слота (ниша в комнате) и расчёт зон под модуль.
 * Планки (верх/низ) могут позже задаваться из админки — читаем с sectionData.
 *
 * @see furniture-manager placePendingFurniture — params.layoutZones
 */

/** Дефолты совпадают с section-manager (TOP_PLANK_HEIGHT_MM / BOTTOM_PLANK_HEIGHT_MM). */
export const DEFAULT_TOP_PLANK_MM = 50;
export const DEFAULT_BOTTOM_PLANK_MM = 100;
/** Толщина крышки корпуса (ЛДСП), мм — справочно; в зоны не подставляем сами. */
export const DEFAULT_MODULE_TOP_MM = 16;

/**
 * v:h_top строго из каталога (админка). Не подставлять 16 мм для standalone:
 * у тумбы/комода крышка уже в корпусе (sides s:y−32), а h_top в JSON = 0.
 * Иначе комната ужимает корпус и ломает зазор фасад↔крыша относительно превью.
 */
export function resolveModuleHTopMm(variables, _placementKind) {
  return Math.max(0, Number(variables?.h_top) || 0);
}

/**
 * Точка над нижней планкой ниши (для будущих уровней). Сейчас мебель ставят по пивоту секции:
 * подъём на bottomPlankMm дублировал отступ с v:h_bottom и давал зазор ~100 мм + недобор по высоте.
 */
export function getNicheInteriorFloorWorldPosition(sectionData) {
  const g = sectionData && sectionData.group;
  if (!g || typeof THREE === 'undefined') return null;
  const bpRaw = Number(sectionData.bottomPlankHeightMm);
  const h =
    Number.isFinite(bpRaw) && bpRaw >= 0 ? bpRaw : DEFAULT_BOTTOM_PLANK_MM;
  g.updateMatrixWorld(true);
  const p = new THREE.Vector3(0, h, 0);
  g.localToWorld(p);
  return p;
}

/** Профиль слота: какие вертикальные смыслы доступны (админка позже). */
export const VERTICAL_SLOT_PROFILE = {
  FLOOR_TWO_ZONE: 'floor_two_zone', // цокольная зона + корпус (напольный шкаф в нише)
  WALL_HUNG_SINGLE: 'wall_hung_single', // один объём корпуса (навес)
};

/**
 * Как модель использует слот (каталог / cabinet.data).
 * Навес:
 *   wall_hung_low  — нижний (к полу): фикс. высота каталога, топ как у тумбы
 *   wall_hung_high — верхний (к потолку): фикс. высота, якорь сверху + потолочная планка
 *   wall_hung      — legacy alias → high
 */
export const PLACEMENT_KIND = {
  FLOOR_IN_NICHE: 'floor_in_niche',
  WALL_HUNG: 'wall_hung',
  WALL_HUNG_LOW: 'wall_hung_low',
  WALL_HUNG_HIGH: 'wall_hung_high',
  CORPUS_ONLY: 'corpus_only',
  STANDALONE_FLOOR: 'standalone_floor',
  /** Кухня: стол рабочий. В комнате садится как низ; опоры — параметр проекта кухни, не 3 SKU. */
  KITCHEN_BASE: 'kitchen_base',
  KITCHEN_BASE_GOLA: 'kitchen_base_gola',
  /** Кухня: пенал — тянется по высоте секции, как шкаф в нише. */
  KITCHEN_TALL: 'kitchen_tall',
};

export function isKitchenBasePlacementKind(pk) {
  const s = String(pk || '').trim();
  return (
    s === PLACEMENT_KIND.KITCHEN_BASE ||
    s === PLACEMENT_KIND.KITCHEN_BASE_GOLA ||
    s === 'kitchen_base_corner'
  );
}

/** Угловой НМУ — отдельный тип, не ветка внутри обычного kitchen_base. */
export function isKitchenCornerPlacementKind(pk) {
  return String(pk || '').trim() === 'kitchen_base_corner';
}

/** Прямой НМ (без угла). */
export function isKitchenStraightBasePlacementKind(pk) {
  const s = String(pk || '').trim();
  return s === PLACEMENT_KIND.KITCHEN_BASE || s === PLACEMENT_KIND.KITCHEN_BASE_GOLA;
}

export function isKitchenTallPlacementKind(pk) {
  return String(pk || '').trim() === PLACEMENT_KIND.KITCHEN_TALL;
}

export function isKitchenWallMidPlacementKind(pk) {
  const s = String(pk || '').trim();
  return s === 'kitchen_wall_mid' || s === 'kitchen_wall_corner';
}

export function isKitchenWallTopPlacementKind(pk) {
  return String(pk || '').trim() === 'kitchen_wall_top';
}

export function isWallHungPlacementKind(pk) {
  const s = String(pk || '').trim();
  return (
    s === PLACEMENT_KIND.WALL_HUNG ||
    s === PLACEMENT_KIND.WALL_HUNG_LOW ||
    s === PLACEMENT_KIND.WALL_HUNG_HIGH ||
    isKitchenWallMidPlacementKind(s) ||
    isKitchenWallTopPlacementKind(s)
  );
}

/** Нижний навес / тумба / кухонный стол: низкий обклад, AutoTop на корпусе, без потолочной №1. */
export function isLowFurniturePlacementKind(pk) {
  const s = String(pk || '').trim();
  return (
    s === PLACEMENT_KIND.STANDALONE_FLOOR ||
    s === PLACEMENT_KIND.WALL_HUNG_LOW ||
    isKitchenBasePlacementKind(s) ||
    isKitchenWallMidPlacementKind(s)
  );
}

export function isWallHungLowPlacementKind(pk) {
  const s = String(pk || '').trim();
  return s === PLACEMENT_KIND.WALL_HUNG_LOW || isKitchenWallMidPlacementKind(s);
}

export function isWallHungHighPlacementKind(pk) {
  const s = String(pk || '').trim();
  // kitchen_wall_top (НШ2) — НЕ сюда: низ от датамов (floorClearance), не от потолка.
  return s === PLACEMENT_KIND.WALL_HUNG || s === PLACEMENT_KIND.WALL_HUNG_HIGH;
}

/** Высокий: пенал / антресоль — цельная верхняя планка и стыки как у высокого ряда. */
export function isTallFurniturePlacementKind(pk) {
  const s = String(pk || '').trim() || PLACEMENT_KIND.FLOOR_IN_NICHE;
  return (
    s === PLACEMENT_KIND.FLOOR_IN_NICHE ||
    isKitchenTallPlacementKind(s) ||
    isWallHungHighPlacementKind(s)
  );
}

/** Пара шкаф/верхний навес ↔ тумба/нижний навес — SideCap 16 мм + TopCap. */
export function isTallLowJunctionPair(leftKind, rightKind) {
  return (
    (isTallFurniturePlacementKind(leftKind) &&
      isLowFurniturePlacementKind(rightKind)) ||
    (isLowFurniturePlacementKind(leftKind) &&
      isTallFurniturePlacementKind(rightKind))
  );
}

/** Цоколь №3 под модулем: только напольные. Навес — без цоколя. */
export function needsFloorPlinthPlacementKind(pk) {
  return !isWallHungPlacementKind(pk);
}

/**
 * Стек ящиков по высоте корпуса (как тумба): standalone + навес с drawerStack.
 * Не путать с interior-fill шкафа (зоны наполнения).
 */
export function isCorpusDrawerStackPlacementKind(pk) {
  const s = String(pk || '').trim();
  return (
    s === PLACEMENT_KIND.STANDALONE_FLOOR ||
    isKitchenBasePlacementKind(s) ||
    isWallHungPlacementKind(s)
  );
}

export const DEFAULT_WALL_HUNG_FLOOR_CLEARANCE_MM = 300;
export const DEFAULT_WALL_HUNG_CEILING_CLEARANCE_MM = 0;

/**
 * Отступ навеса от пола (мм): override модуля → секция → дефолт 300.
 * @param {object|null} udOrGroup — userData или группа с userData
 * @param {object|null} sectionData
 */
export function resolveWallHungFloorClearanceMm(udOrGroup, sectionData) {
  const ud = udOrGroup?.userData || udOrGroup || {};
  const fromModule = Number(ud.customFloorClearanceMm);
  if (Number.isFinite(fromModule) && fromModule >= 0) return fromModule;
  const fromSec = Number(sectionData?.wallHungFloorClearanceMm);
  if (Number.isFinite(fromSec) && fromSec >= 0) return fromSec;
  return DEFAULT_WALL_HUNG_FLOOR_CLEARANCE_MM;
}

/**
 * Высота слота под шкаф (мм): между нижней и верхней планками ниши.
 * Совпадает с sectionSize.y при размещении в комнате.
 */
export function getNicheCabinetSlotHeightMm(section, opts = {}) {
  if (!section || !section.size) return null;
  const h = getSlotVerticalMetrics(section, opts).innerHeightMm;
  return h > 0 ? h : null;
}

/**
 * Метрики слота по данным секции комнаты (без модуля).
 * innerHeightMm — высота между нижней и верхней планкой (raw − top − bottom).
 * opts.alongMm — для U у окна: высота полосы (под подоконником ≤ sill).
 */
export function getSlotVerticalMetrics(sectionData, opts = {}) {
  if (!sectionData || !sectionData.size) {
    return {
      rawHeightMm: 0,
      topPlankMm: DEFAULT_TOP_PLANK_MM,
      bottomPlankMm: DEFAULT_BOTTOM_PLANK_MM,
      innerHeightMm: 0,
      profile: VERTICAL_SLOT_PROFILE.FLOOR_TWO_ZONE,
      floorClearanceMm: DEFAULT_WALL_HUNG_FLOOR_CLEARANCE_MM,
      ceilingClearanceMm: DEFAULT_WALL_HUNG_CEILING_CLEARANCE_MM,
    };
  }
  const sz = sectionData.size;
  let rawHeight =
    typeof sz.y === 'number' ? sz.y : Number(sz.height) || 0;

  if (Number.isFinite(opts.alongMm) && sectionData.windowBridge) {
    const wb = sectionData.windowBridge;
    const bands = Array.isArray(wb.heightBands) ? wb.heightBands : null;
    let bandH = null;
    if (bands) {
      for (let i = 0; i < bands.length; i++) {
        const b = bands[i];
        const a = Number(b.alongA);
        const bb = Number(b.alongB);
        if (
          Number.isFinite(a) &&
          Number.isFinite(bb) &&
          opts.alongMm >= a - 0.5 &&
          opts.alongMm <= bb + 0.5
        ) {
          const h = Number(b.heightMm);
          if (h > 0) {
            bandH = h;
            break;
          }
        }
      }
    }
    if (bandH == null) {
      const nA = Number(wb.notchAlongA);
      const nB = Number(wb.notchAlongB);
      const sill = Number(wb.sillMm);
      if (
        Number.isFinite(nA) &&
        Number.isFinite(nB) &&
        Number.isFinite(sill) &&
        sill > 0 &&
        opts.alongMm >= nA - 0.5 &&
        opts.alongMm <= nB + 0.5
      ) {
        bandH = sill;
      }
    }
    if (bandH != null && bandH > 0) rawHeight = bandH;
  }

  const topPlankMm = Number(sectionData.topPlankHeight);
  const top =
    Number.isFinite(topPlankMm) && topPlankMm >= 0
      ? topPlankMm
      : DEFAULT_TOP_PLANK_MM;
  const bottomPlankMmRaw = Number(sectionData.bottomPlankHeightMm);
  const bottomPlankMm =
    Number.isFinite(bottomPlankMmRaw) && bottomPlankMmRaw >= 0
      ? bottomPlankMmRaw
      : DEFAULT_BOTTOM_PLANK_MM;
  const innerHeightMm = Math.max(0, rawHeight - top - bottomPlankMm);
  const profile =
    sectionData.verticalLayoutProfile || VERTICAL_SLOT_PROFILE.FLOOR_TWO_ZONE;
  const floorClearanceRaw = Number(sectionData.wallHungFloorClearanceMm);
  const floorClearanceMm =
    Number.isFinite(floorClearanceRaw) && floorClearanceRaw >= 0
      ? floorClearanceRaw
      : DEFAULT_WALL_HUNG_FLOOR_CLEARANCE_MM;
  const ceilingClearanceRaw = Number(sectionData.wallHungCeilingClearanceMm);
  const ceilingClearanceMm =
    Number.isFinite(ceilingClearanceRaw) && ceilingClearanceRaw >= 0
      ? ceilingClearanceRaw
      : DEFAULT_WALL_HUNG_CEILING_CLEARANCE_MM;

  return {
    rawHeightMm: rawHeight,
    topPlankMm: top,
    bottomPlankMm,
    innerHeightMm,
    profile,
    floorClearanceMm,
    ceilingClearanceMm,
  };
}

/**
 * Обновить sectionData.verticalLayout (кэш для админки/отладки; пересчитывается при изменении секции).
 */
export function refreshSectionVerticalLayout(sectionData) {
  if (!sectionData) return;
  const m = getSlotVerticalMetrics(sectionData);
  sectionData.verticalLayout = {
    version: 1,
    profile: m.profile,
    rawHeightMm: m.rawHeightMm,
    topPlankMm: m.topPlankMm,
    bottomPlankMm: m.bottomPlankMm,
    innerHeightMm: m.innerHeightMm,
    wallHungFloorClearanceMm: m.floorClearanceMm,
    wallHungCeilingClearanceMm: m.ceilingClearanceMm,
  };
}

/**
 * Зоны под конкретную вставку модуля (переменные уже смержены, в т.ч. дефолты h_bottom/h_top из extract).
 * В комнате ClodisBuilder читает zones.* и подставляет высоты в подсекции по layout_role (plinth/corpus/top).
 * Опционально corpus_body_mm: фиксированный корпус; остаток inner − tech_zone_mm — зона top (антресоль).
 */
/**
 * Фиксированная высота «первого уровня» корпуса (мм), не зависящая от высоты ниши.
 * Если > 0: carcassMm = min(значение, inner), остаток inner уходит в зону top (антресоль).
 * Задаётся в variables.main каталога: corpus_body_mm (или corpus_fixed_mm / h_corpus_body).
 */
export function getCorpusFixedBodyMmFromVariables(variables) {
  if (!variables || typeof variables !== 'object') return 0;
  const raw =
    variables.corpus_body_mm ??
    variables.corpus_fixed_mm ??
    variables.h_corpus_body;
  const n = Math.max(0, Number(raw) || 0);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Техзона над антресолью (layout_role service), мм из variables.main:
 * tech_zone_mm | h_service | service_zone_mm
 */
export function getTechZoneMmFromVariables(variables) {
  if (!variables || typeof variables !== 'object') return 0;
  const raw =
    variables.tech_zone_mm ??
    variables.h_service ??
    variables.service_zone_mm;
  const n = Math.max(0, Number(raw) || 0);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Высота зоны «корпус — антресоль», мм: variables.corpus_antresol_mm (в каталоге фикс 1950).
 */
export function getCorpusAntresolSplitMmFromVariables(variables) {
  if (!variables || typeof variables !== 'object') return 0;
  const raw = variables.corpus_antresol_mm;
  const n = Math.max(0, Number(raw) || 0);
  return Number.isFinite(n) ? n : 0;
}

/**
 * LEGACY шкафная ниша — в Clodis-Kitchen отключена.
 * Кухня: h_bottom = project plinth (kitchen-base-engine), не bottomPlank секции.
 * Функция оставлена как no-op, чтобы старые call sites не падали.
 */
export function mergeFloorNicheVariablesFromSection(sectionData, variables) {
  const base =
    variables && typeof variables === 'object' && !Array.isArray(variables)
      ? { ...variables }
      : {};
  return base;
}

export function computePlacementVerticalZones(slotMetrics, options = {}) {
  const placementKind =
    options.placementKind || PLACEMENT_KIND.FLOOR_IN_NICHE;
  const variables = options.variables || {};
  const inner = Math.max(0, slotMetrics.innerHeightMm || 0);

  const hBottom = Math.max(0, Number(variables.h_bottom) || 0);
  const hTop = Math.max(0, Number(variables.h_top) || 0);

  if (isWallHungPlacementKind(placementKind)) {
    const floorClearance = Math.max(0, Number(slotMetrics.floorClearanceMm) || 0);
    const ceilingClearance = Math.max(
      0,
      Number(slotMetrics.ceilingClearanceMm) || 0
    );
    const raw = Math.max(0, Number(slotMetrics.rawHeightMm) || 0);
    const topPlank = Math.max(0, Number(slotMetrics.topPlankMm) || 0);
    const catalogH = Math.max(
      0,
      Number(options.catalogHeightMm) ||
        Number(variables.corpus_body_mm) ||
        Number(variables.body_mm) ||
        0
    );

    // Нижний навес: фикс. высота каталога, якорь от пола + clearance.
    if (isWallHungLowPlacementKind(placementKind)) {
      const bodyMm = Math.max(0, (catalogH > 0 ? catalogH : Math.max(0, inner - hTop)) - hTop);
      return {
        version: 1,
        placementKind,
        slotProfile: VERTICAL_SLOT_PROFILE.WALL_HUNG_SINGLE,
        innerMm: inner,
        floorClearanceMm: floorClearance,
        ceilingClearanceMm: ceilingClearance,
        zones: {
          bodyMm,
          hTopMm: hTop,
          floorClearanceMm: floorClearance,
          ceilingClearanceMm: ceilingClearance,
        },
        meta: {
          note:
            'Навес нижний: bodyMm ≈ catalogH − h_top; низ = floor + floorClearance; топ как у тумбы',
        },
      };
    }

    // Верхний навес (и legacy wall_hung): фикс. каталог под потолочной планкой.
    // Если высоты каталога нет — fallback на прежний «на всю нишу» (legacy).
    if (catalogH > 0) {
      const bodyMm = Math.max(0, catalogH - hTop);
      return {
        version: 1,
        placementKind,
        slotProfile: VERTICAL_SLOT_PROFILE.WALL_HUNG_SINGLE,
        innerMm: inner,
        floorClearanceMm: floorClearance,
        ceilingClearanceMm: ceilingClearance,
        zones: {
          bodyMm,
          hTopMm: hTop,
          floorClearanceMm: floorClearance,
          ceilingClearanceMm: ceilingClearance,
        },
        meta: {
          note:
            'Навес верхний: bodyMm = catalogH − h_top; верх = raw − topPlank − ceilingClearance',
        },
      };
    }

    const spanMm = Math.max(0, raw - topPlank - floorClearance - ceilingClearance);
    const bodyMm = Math.max(0, spanMm - hTop);
    return {
      version: 1,
      placementKind,
      slotProfile: VERTICAL_SLOT_PROFILE.WALL_HUNG_SINGLE,
      innerMm: inner,
      floorClearanceMm: floorClearance,
      ceilingClearanceMm: ceilingClearance,
      zones: {
        bodyMm,
        hTopMm: hTop,
        floorClearanceMm: floorClearance,
        ceilingClearanceMm: ceilingClearance,
      },
      meta: {
        note:
          'Навес legacy (без catalogH): bodyMm = raw − topPlank − clearances − h_top',
      },
    };
  }

  if (placementKind === PLACEMENT_KIND.CORPUS_ONLY) {
    const bodyMm = Math.max(0, inner - hTop);
    return {
      version: 1,
      placementKind,
      slotProfile: slotMetrics.profile,
      innerMm: inner,
      floorClearanceMm: slotMetrics.floorClearanceMm,
      zones: {
        bodyMm,
        hTopMm: hTop,
      },
      meta: {
        note: 'Только корпус по высоте inner − h_top',
      },
    };
  }

  // Напольный шкаф: цоколь стоит НА ПОЛУ (y=0..plinthMm), совмещён с нижней планкой ниши.
  // Высота «полезного» объёма над цоколем = inner (между планками ниши): carcassMm + hTopMm + serviceMm = inner.
  // Режим A (по умолчанию): carcassMm = inner − h_top (каталог), hTopMm = h_top.
  // Режим B (антресоль): corpus_body_mm > 0 → carcassMm = min(corpus_body_mm, innerMid), hTopMm = innerMid − carcassMm.
  // Техзона (service): tech_zone_mm забирает высоту сверху inner; под корпус/антресоль остаётся innerMid = inner − serviceMm.
  const bottomPlankMm = Number(slotMetrics.bottomPlankMm);
  const plinthMm = hBottom;
  const corpusFixed = getCorpusFixedBodyMmFromVariables(variables);
  const techRequested = getTechZoneMmFromVariables(variables);
  const serviceMm = Math.min(Math.max(0, techRequested), inner);
  const innerMid = Math.max(0, inner - serviceMm);
  let carcassMm;
  let hTopMm;
  let verticalSplit;
  if (corpusFixed > 0) {
    carcassMm = Math.min(corpusFixed, innerMid);
    hTopMm = Math.max(0, innerMid - carcassMm);
    verticalSplit =
      serviceMm > 0 ? 'fixed_corpus_antresol_service' : 'fixed_corpus_antresol';
  } else {
    carcassMm = Math.max(0, innerMid - hTop);
    hTopMm = hTop;
    verticalSplit =
      serviceMm > 0 ? 'carcass_plus_catalog_h_top_service' : 'carcass_plus_catalog_h_top';
  }

  const antSplit = getCorpusAntresolSplitMmFromVariables(variables);
  let carcassAntresolMm = 0;
  let carcassMainMm = carcassMm;
  if (antSplit > 0) {
    carcassAntresolMm = Math.min(antSplit, carcassMm);
    carcassMainMm = Math.max(0, carcassMm - carcassAntresolMm);
  }

  return {
    version: 1,
    placementKind: PLACEMENT_KIND.FLOOR_IN_NICHE,
    slotProfile: slotMetrics.profile,
    innerMm: inner,
    zones: {
      plinthMm,
      carcassMm,
      carcassMainMm,
      carcassAntresolMm,
      hTopMm,
      serviceMm,
      bottomPlankMm,
    },
    meta: {
      note:
        'plinthMm/carcassMm/carcassMainMm/carcassAntresolMm/hTopMm/serviceMm — мм; роли corpus / corpus_antresol.',
      verticalSplit,
      corpusFixedBodyMm: corpusFixed > 0 ? corpusFixed : undefined,
      techZoneMm: serviceMm > 0 ? serviceMm : undefined,
      corpusAntresolSplitMm: antSplit > 0 ? antSplit : undefined,
    },
  };
}

/**
 * Тумба на полу: зоны из фактической высоты модуля (customHeightMm / sectionSize.y),
 * не из высоты ниши секции — иначе CFRN/Базис остаётся со старым corpus (напр. 500 при 600 мм).
 */
export function computeStandaloneFloorLayoutZones(totalHeightMm, variables, placementKind) {
  const sy = Math.max(0, Number(totalHeightMm) || 0);
  const hb = Math.max(0, Number(variables?.h_bottom) || 0);
  const pk = placementKind || PLACEMENT_KIND.STANDALONE_FLOOR;
  const ht = resolveModuleHTopMm(variables, pk);
  const tech = getTechZoneMmFromVariables(variables || {});
  const inner = Math.max(0, sy - hb - tech);
  const carcassMm = Math.max(0, inner - ht);
  return {
    version: 1,
    placementKind: pk,
    innerMm: inner,
    zones: {
      plinthMm: hb,
      carcassMm,
      hTopMm: ht,
      serviceMm: tech,
    },
    meta: { note: 'standalone_floor: totalHeight − h_bottom − h_top − tech' },
  };
}
