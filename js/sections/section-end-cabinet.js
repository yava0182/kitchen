/**
 * Торцевой шкаф вместо боковой накладки (явный выбор пользователя).
 * Дефолт без флага — планка/накладка как раньше.
 *
 * Контракт:
 *   sectionData.endCabinets = {
 *     left?:  EndCabEntry,
 *     right?: EndCabEntry,
 *     front?: EndCabEntry,
 *     back?:  EndCabEntry,
 *   }
 *   EndCabEntry = {
 *     mode: 'cabinet' | 'overlay',
 *     catalogType: string,
 *     itemId: number|string,
 *     widthMm: number,       // вдоль стены (= «глубина» торцевого из диалога); зазор offsets не трогаем
 *     intoRoomMm?: number,   // вглубь комнаты (= ширина модуля); обычно = глубина ряда
 *     savedGapMm?: number,   // отступ на момент выбора (справка; offset не обнуляется)
 *     furnitureUuid?: string,
 *     zoneHand?: 'left'|'right',
 *     zoneHandManual?: boolean,
 *   }
 *
 * Админка: room_steps_config.endCabinet
 */
import { state } from '../utils/state.js';
import { getSlotVerticalMetrics, getNicheCabinetSlotHeightMm } from './vertical-layout.js';

const ROOM_STEPS_CONFIG_KEY = 'room_steps_config';
const WALL_EPS_MM = 5;

export const END_CABINET_SIDES = ['left', 'right', 'front', 'back'];

/**
 * Боковая планка торцевого со стороны стены — те же размеры, что у обклада
 * обычной секции при примыкании (SIDE_PLANK_WIDTH_MM / TOP_PLANK_THICKNESS_MM
 * в section-manager.js): 50 мм видимой ширины, 16 мм толщины заподлицо с фасадом.
 */
export const END_CABINET_WALL_PLANK_WIDTH_MM = 50;
export const END_CABINET_WALL_PLANK_THICKNESS_MM = 16;
/** Толщина верхней планки ряда (TOP_PLANK_THICKNESS_MM в section-manager). */
const ROW_TOP_PLANK_THICKNESS_MM = 16;

export const DEFAULT_END_CABINET_RULE = {
  enabled: true,
  minGapMm: 100,
  maxGapMm: 1500,
  /** Каталог модулей: папка шага 3 «Управление комнатой 2», не Обклад. */
  catalogType: 'catalog_41',
  catalogCategoryId: '',
  catalogFilterTag: '',
  label: 'Торцевой шкаф',
};

/**
 * Папка шага 3 для торцевых (как «Шкафы» → catalog_26).
 * Ищем role=endCabinet, иначе key/categoryId 41, иначе имя «торцев».
 */
export function getEndCabinetStep3Folder(config) {
  const cfg = config && typeof config === 'object' ? config : readRoomStepsConfigLocal();
  const step3 = Array.isArray(cfg.steps) ? cfg.steps.find((s) => Number(s.stepId) === 3) : null;
  const items = Array.isArray(step3?.items) ? step3.items : [];
  const byRole = items.find((it) => {
    const r = String(it?.role || '').toLowerCase().replace(/[_-]/g, '');
    return r === 'endcabinet';
  });
  if (byRole) return byRole;
  const byKey = items.find((it) => {
    const key = String(it?.key || '').replace(/^catalog_/i, '').trim();
    const cat = String(it?.categoryId != null ? it.categoryId : '').replace(/^catalog_/i, '').trim();
    return key === '41' || cat === '41';
  });
  if (byKey) return byKey;
  return items.find((it) => /торцев/i.test(String(it?.name || ''))) || null;
}

export function catalogTypeFromStep3Folder(folder) {
  if (!folder) return '';
  const raw = String(folder.key || folder.categoryId || '').trim();
  if (!raw) return '';
  if (/^catalog_/i.test(raw)) return raw;
  return 'catalog_' + raw.replace(/^catalog_/i, '');
}

export function normalizeEndCabinetRule(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const minGapMm = Math.max(WALL_EPS_MM + 1, Math.round(Number(src.minGapMm) || DEFAULT_END_CABINET_RULE.minGapMm));
  let maxGapMm = Math.round(Number(src.maxGapMm) || DEFAULT_END_CABINET_RULE.maxGapMm);
  // Старый дефолт 600 мм отсекал типичные торцевые 70–90 см — поднимаем.
  if (maxGapMm === 600) maxGapMm = DEFAULT_END_CABINET_RULE.maxGapMm;
  if (!(maxGapMm >= minGapMm)) maxGapMm = minGapMm;
  const catIdRaw = src.catalogCategoryId != null ? src.catalogCategoryId : src.defaultItemId;
  return {
    enabled: src.enabled !== false,
    minGapMm,
    maxGapMm,
    catalogType: String(src.catalogType || '').trim(),
    catalogCategoryId:
      catIdRaw != null && String(catIdRaw).trim() !== '' ? String(catIdRaw).trim() : '',
    catalogFilterTag: String(src.catalogFilterTag || '').trim(),
    label: String(src.label || DEFAULT_END_CABINET_RULE.label).trim() || DEFAULT_END_CABINET_RULE.label,
  };
}

export function readRoomStepsConfigLocal() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(ROOM_STEPS_CONFIG_KEY) : null;
    if (!raw) return { steps: [] };
    const c = JSON.parse(raw);
    return c && typeof c === 'object' ? c : { steps: [] };
  } catch (_) {
    return { steps: [] };
  }
}

export function getEndCabinetRule(config) {
  const cfg = config && typeof config === 'object' ? config : readRoomStepsConfigLocal();
  const rule = normalizeEndCabinetRule(cfg.endCabinet);
  const folder = getEndCabinetStep3Folder(cfg);
  const fromStep3 = catalogTypeFromStep3Folder(folder);
  if (fromStep3) {
    rule.catalogType = fromStep3;
    if (folder?.name) rule.label = String(folder.name).trim() || rule.label;
  } else if (!rule.catalogType) {
    rule.catalogType = DEFAULT_END_CABINET_RULE.catalogType;
  }
  return rule;
}

export function ensureEndCabinets(sectionData) {
  if (!sectionData) return {};
  if (!sectionData.endCabinets || typeof sectionData.endCabinets !== 'object') {
    sectionData.endCabinets = {};
  }
  return sectionData.endCabinets;
}

export function getEndCabinetEntry(sectionData, side) {
  const map = ensureEndCabinets(sectionData);
  const e = map[side];
  return e && typeof e === 'object' ? e : null;
}

export function isEndCabinetActive(sectionData, side) {
  const e = getEndCabinetEntry(sectionData, side);
  return !!(e && e.mode === 'cabinet' && Number(e.widthMm) > 0);
}

/** Резерв ширины торцевого модуля (мм) — участвует в updateSectionSize. */
export function getEndCabinetReserveMm(sectionData, side) {
  if (!isEndCabinetActive(sectionData, side)) return 0;
  return Math.max(0, Math.round(Number(getEndCabinetEntry(sectionData, side).widthMm) || 0));
}

/**
 * На торце с торцевым шкафом не ставим SideOverlay/SidePlank ряда:
 * шов ряда↔торцевой при тумбе — TransitionSideCap (как тумба↔шкаф на прямом).
 * EndCabinetFacadeOverlay кроет фасадную плоскость торцевого отдельно.
 */
export function shouldSuppressSideTrimForEndCabinet(sectionData, side) {
  return isEndCabinetActive(sectionData, side);
}

export function gapEligibleForEndCabinet(gapMm, rule) {
  const r = normalizeEndCabinetRule(rule || getEndCabinetRule());
  if (!r.enabled) return false;
  const g = Number(gapMm) || 0;
  if (!(g > WALL_EPS_MM)) return false;
  return g >= r.minGapMm && g <= r.maxGapMm;
}

/** Какие торцы секции сейчас с зазором под накладку / торцевой. */
export function getOverlayCandidateSides(sectionData) {
  if (!sectionData) return [];
  const wall = sectionData.wallName || 'back';
  const o = sectionData.offsets || {};
  const out = [];
  if (wall === 'front' || wall === 'back') {
    if ((Number(o.leftMm) || 0) > WALL_EPS_MM) out.push('left');
    if ((Number(o.rightMm) || 0) > WALL_EPS_MM) out.push('right');
  } else if (wall === 'left' || wall === 'right') {
    if ((Number(o.frontMm) || 0) > WALL_EPS_MM) out.push('front');
    if ((Number(o.backMm) || 0) > WALL_EPS_MM) out.push('back');
  }
  return out;
}

export function sideLabelRu(side) {
  switch (side) {
    case 'left':
      return 'слева';
    case 'right':
      return 'справа';
    case 'front':
      return 'спереди';
    case 'back':
      return 'сзади';
    default:
      return side;
  }
}

/**
 * Дефолт распашки торцевого: петлевая сторона направлена к ближайшей стене.
 * zoneHand задаётся в локальных координатах шкафа до его поворота ±90°.
 */
export function resolveDefaultEndCabinetZoneHand(wallName, side) {
  const wall = String(wallName || 'back');
  if (wall === 'back') return side === 'right' ? 'right' : 'left';
  if (wall === 'front') return side === 'right' ? 'left' : 'right';
  if (wall === 'left') return side === 'back' ? 'right' : 'left';
  if (wall === 'right') return side === 'back' ? 'left' : 'right';
  return 'left';
}

export function serializeEndCabinets(sectionData) {
  const map = ensureEndCabinets(sectionData);
  const out = {};
  for (const side of END_CABINET_SIDES) {
    const e = map[side];
    if (!e || typeof e !== 'object') continue;
    if (e.mode !== 'cabinet') continue;
    out[side] = {
      mode: 'cabinet',
      catalogType: String(e.catalogType || ''),
      itemId: e.itemId != null ? e.itemId : '',
      widthMm: Math.round(Number(e.widthMm) || 0),
      intoRoomMm: Math.round(Number(e.intoRoomMm) || 0) || undefined,
      savedGapMm: Math.round(Number(e.savedGapMm != null ? e.savedGapMm : e.widthMm) || 0),
      furnitureUuid: e.furnitureUuid ? String(e.furnitureUuid) : undefined,
      zoneHand: e.zoneHand === 'right' ? 'right' : e.zoneHand === 'left' ? 'left' : undefined,
      zoneHandManual: e.zoneHandManual === true || undefined,
    };
  }
  return out;
}

function findEndCabinetFurniture(sectionData, side) {
  if (!state.scene || !sectionData?.id) return null;
  const sid = String(sectionData.id);
  let found = null;
  state.scene.traverse((obj) => {
    if (found || !obj?.userData?.isFurniture || !obj.userData?.isEndCabinet) return;
    if (String(obj.userData.sectionId) !== sid) return;
    if (String(obj.userData.endCabinetSide) !== String(side)) return;
    found = obj;
  });
  return found;
}

export function removeEndCabinetFurniture(sectionData, side) {
  const grp = findEndCabinetFurniture(sectionData, side);
  if (!grp) return false;
  try {
    if (grp.parent) grp.parent.remove(grp);
    grp.traverse((c) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose && m.dispose());
        else if (c.material.dispose) c.material.dispose();
      }
    });
  } catch (_) {}
  const e = getEndCabinetEntry(sectionData, side);
  if (e) delete e.furnitureUuid;
  return true;
}

/**
 * Глубина ряда секции (внутрь комнаты), мм — из size, не из торцевого.
 */
export function getSectionIntoRoomMm(sectionData) {
  const wallName = sectionData?.wallName || 'back';
  const size = sectionData?.size || {};
  if (wallName === 'left' || wallName === 'right') {
    return Math.max(1, Math.round(Number(size.x) || 600));
  }
  return Math.max(1, Math.round(Number(size.z) || 600));
}

/**
 * Толщина фасада основного ряда. Берём фактическую переменную уже поставленного
 * обычного шкафа; 16 мм — общий дефолт конструктора для пустой секции.
 */
export function getSectionFacadeThicknessMm(sectionData) {
  const direct = Number(
    sectionData?.facadeThicknessMm ??
      sectionData?.facade_thickness_mm ??
      sectionData?.variables?.facade_thickness_mm
  );
  if (Number.isFinite(direct) && direct > 0) return direct;

  let resolved = 0;
  try {
    state.scene?.traverse((obj) => {
      if (resolved > 0 || !obj?.userData?.isFurniture || obj.userData.isEndCabinet) return;
      if (String(obj.userData.sectionId) !== String(sectionData?.id)) return;
      const readVars =
        typeof globalThis.__cldReadUserDataClodisVariables === 'function'
          ? globalThis.__cldReadUserDataClodisVariables
          : null;
      const vars =
        readVars?.(obj.userData) ||
        obj.userData.__clodisVariables ||
        obj.userData.clodisVariables ||
        obj.userData.variables ||
        null;
      const value = Number(vars?.facade_thickness_mm);
      if (Number.isFinite(value) && value > 0) resolved = value;
    });
  } catch (_) {}
  return resolved > 0 ? resolved : 16;
}

/**
 * Насколько цоколь ряда не доходит до конца резерва торцевого: на толщину его
 * фасада. Иначе торец цоколя выйдет на переднюю пласть торцевого шкафа.
 * 0 — если торцевого с этой стороны нет.
 */
export function getEndCabinetRowPlinthInsetMm(sectionData, side) {
  const reserveMm = getEndCabinetReserveMm(sectionData, side);
  if (!(reserveMm > 0)) return 0;
  const facadeMm = Math.max(0, Math.round(getSectionFacadeThicknessMm(sectionData)));
  return Math.min(facadeMm, Math.max(0, reserveMm - 1));
}

/**
 * Мировая поза и размер слота торцевого модуля.
 * Пример: стена 3000, отступ слева 900, глубина торцевого 300 →
 *   зазор 900 остаётся, торцевой 300 с внутреннего края отступа, ряд 1800.
 * Модуль повёрнут на 90° (зеркало для left/right):
 *   - width(x) = глубина основной секции (вглубь комнаты);
 *   - depth(z) = widthMm из диалога (вдоль стены);
 *   - перед (фасад / лицевая без дверей) всегда наружу от основного ряда
 *     (на back: слева → −X, справа → +X).
 * После поворота группу snap'аем в footprint (см. snapEndCabinetGroupToSlot).
 */
export function getEndCabinetSlot(sectionData, side) {
  if (!sectionData || !state.room?.group) return null;
  const alongWallMm = getEndCabinetReserveMm(sectionData, side);
  if (!(alongWallMm > 0)) return null;

  const wallName = sectionData.wallName || 'back';
  const normalizedSide =
    wallName === 'left' || wallName === 'right'
      ? side === 'back'
        ? 'back'
        : 'front'
      : side === 'right'
        ? 'right'
        : 'left';
  const o = sectionData.offsets || {};
  const offsetLeft = Math.round(Number(o.leftMm) || 0);
  const offsetRight = Math.round(Number(o.rightMm) || 0);
  const offsetFront = Math.round(Number(o.frontMm) || 0);
  const offsetBack = Math.round(Number(o.backMm) || 0);

  // Со стороны фасадов основного ряда оставляем полосу под будущую фасадную накладку,
  // со стороны стены — полосу под боковую планку (как у обычной секции при примыкании).
  const fullIntoRoomMm = getSectionIntoRoomMm(sectionData);
  const facadeThicknessMm = Math.min(
    Math.max(0, getSectionFacadeThicknessMm(sectionData)),
    Math.max(0, fullIntoRoomMm - 1)
  );
  const wallPlankWidthMm = Math.min(
    END_CABINET_WALL_PLANK_WIDTH_MM,
    Math.max(0, fullIntoRoomMm - facadeThicknessMm - 1)
  );
  const intoRoomMm = Math.max(1, fullIntoRoomMm - facadeThicknessMm - wallPlankWidthMm);
  // Высота ровно как у обычного шкафа этого ряда: слот ниши между нижней
  // и верхней планками секции (getNicheCabinetSlotHeightMm — тот же путь,
  // что у placePendingFurnitureAsync для зоны секции).
  const nicheY = getNicheCabinetSlotHeightMm(sectionData);
  const slotMetrics = getSlotVerticalMetrics(sectionData);
  const nicheHeightMm =
    Number(nicheY) > 0
      ? Math.round(Number(nicheY))
      : Number(slotMetrics.innerHeightMm) > 0
        ? Math.round(Number(slotMetrics.innerHeightMm))
        : Number(sectionData.size?.y) || Number(state.room.height) || 2400;
  // Напольный шкаф стоит цоколем на полу (h_bottom = нижняя планка), а слот ниши —
  // объём над цоколем. Габарит модуля = цоколь + ниша, поэтому пятно слота и целевой
  // bbox торцевого считаем по этой сумме, а sectionSize (для сборки) остаётся нишей.
  const plinthMm = Math.max(0, Math.round(Number(slotMetrics.bottomPlankMm) || 0));
  const heightMm = nicheHeightMm + plinthMm;

  const sectionSize = { x: intoRoomMm, y: nicheHeightMm, z: alongWallMm };

  const roomPos = new THREE.Vector3();
  state.room.group.getWorldPosition(roomPos);
  const gap = 2;
  const roomW = Number(state.room.width) || 0;
  const roomD = Number(state.room.depth) || 0;
  // Как у обычных шкафов: логический floor-contact всегда на полу комнаты,
  // а не на нижней границе/offset секции.
  const floorY = roomPos.y;

  let position = new THREE.Vector3();
  let rotationY = 0;
  /** Мировой AABB пятна слота (куда snap'аем модуль после ±90°). */
  const footprint = {
    min: new THREE.Vector3(),
    max: new THREE.Vector3(),
  };
  const worldFootprint = { alongWallMm, intoRoomMm, heightMm };

  if (wallName === 'back') {
    // Перед наружу от ряда: left → −X (−π/2), right → +X (+π/2).
    if (side === 'left') {
      position.set(roomPos.x + offsetLeft, floorY, roomPos.z + gap);
      rotationY = -Math.PI / 2;
      footprint.min.set(roomPos.x + offsetLeft, floorY, roomPos.z + gap);
      footprint.max.set(
        roomPos.x + offsetLeft + alongWallMm,
        floorY + heightMm,
        roomPos.z + gap + intoRoomMm
      );
    } else {
      position.set(
        roomPos.x + roomW - offsetRight - alongWallMm,
        floorY,
        roomPos.z + gap
      );
      rotationY = Math.PI / 2;
      footprint.min.set(
        roomPos.x + roomW - offsetRight - alongWallMm,
        floorY,
        roomPos.z + gap
      );
      footprint.max.set(
        roomPos.x + roomW - offsetRight,
        floorY + heightMm,
        roomPos.z + gap + intoRoomMm
      );
    }
  } else if (wallName === 'front') {
    if (side === 'left') {
      position.set(
        roomPos.x + offsetLeft + alongWallMm,
        floorY,
        roomPos.z + roomD - gap
      );
      rotationY = -Math.PI / 2;
      footprint.min.set(
        roomPos.x + offsetLeft,
        floorY,
        roomPos.z + roomD - gap - intoRoomMm
      );
      footprint.max.set(
        roomPos.x + offsetLeft + alongWallMm,
        floorY + heightMm,
        roomPos.z + roomD - gap
      );
    } else {
      position.set(
        roomPos.x + roomW - offsetRight,
        floorY,
        roomPos.z + roomD - gap
      );
      rotationY = Math.PI / 2;
      footprint.min.set(
        roomPos.x + roomW - offsetRight - alongWallMm,
        floorY,
        roomPos.z + roomD - gap - intoRoomMm
      );
      footprint.max.set(
        roomPos.x + roomW - offsetRight,
        floorY + heightMm,
        roomPos.z + roomD - gap
      );
    }
  } else if (wallName === 'left') {
    const along = side === 'front' || side === 'back' ? side : 'front';
    // Перед наружу от ряда на left-стене.
    rotationY = -Math.PI / 2;
    if (along === 'front') {
      position.set(roomPos.x + gap, floorY, roomPos.z + offsetFront + alongWallMm);
      footprint.min.set(
        roomPos.x + gap,
        floorY,
        roomPos.z + offsetFront
      );
      footprint.max.set(
        roomPos.x + gap + intoRoomMm,
        floorY + heightMm,
        roomPos.z + offsetFront + alongWallMm
      );
    } else {
      position.set(
        roomPos.x + gap,
        floorY,
        roomPos.z + roomD - offsetBack
      );
      footprint.min.set(
        roomPos.x + gap,
        floorY,
        roomPos.z + roomD - offsetBack - alongWallMm
      );
      footprint.max.set(
        roomPos.x + gap + intoRoomMm,
        floorY + heightMm,
        roomPos.z + roomD - offsetBack
      );
    }
  } else if (wallName === 'right') {
    const along = side === 'front' || side === 'back' ? side : 'front';
    rotationY = Math.PI / 2;
    if (along === 'front') {
      position.set(roomPos.x + roomW, floorY, roomPos.z + offsetFront);
      footprint.min.set(
        roomPos.x + roomW - intoRoomMm,
        floorY,
        roomPos.z + offsetFront
      );
      footprint.max.set(
        roomPos.x + roomW,
        floorY + heightMm,
        roomPos.z + offsetFront + alongWallMm
      );
    } else {
      position.set(
        roomPos.x + roomW,
        floorY,
        roomPos.z + roomD - offsetBack - alongWallMm
      );
      footprint.min.set(
        roomPos.x + roomW - intoRoomMm,
        floorY,
        roomPos.z + roomD - offsetBack - alongWallMm
      );
      footprint.max.set(
        roomPos.x + roomW,
        floorY + heightMm,
        roomPos.z + roomD - offsetBack
      );
    }
  } else {
    return null;
  }

  // Полосу под боковую планку у стены уже вычли из intoRoomMm — сдвигаем пятно
  // от стены внутрь комнаты и считаем мировой бокс самой планки.
  const alongAxis = wallName === 'back' || wallName === 'front' ? 'x' : 'z';
  const depthAxis = alongAxis === 'x' ? 'z' : 'x';
  const wallAtMin = wallName === 'back' || wallName === 'left';
  const outerAtMin = alongAxis === 'x' ? normalizedSide === 'left' : normalizedSide === 'front';
  const wallCoord = wallAtMin ? footprint.min[depthAxis] : footprint.max[depthAxis];
  let wallPlank = null;

  if (wallPlankWidthMm > 0) {
    const shift = wallAtMin ? wallPlankWidthMm : -wallPlankWidthMm;
    footprint.min[depthAxis] += shift;
    footprint.max[depthAxis] += shift;
    position[depthAxis] += shift;

    const outerCoord = outerAtMin ? footprint.min[alongAxis] : footprint.max[alongAxis];
    const center = new THREE.Vector3();
    const size = { x: 0, y: 0, z: 0 };
    size[depthAxis] = wallPlankWidthMm;
    size[alongAxis] = END_CABINET_WALL_PLANK_THICKNESS_MM;
    center[depthAxis] = wallCoord + (wallAtMin ? wallPlankWidthMm / 2 : -wallPlankWidthMm / 2);
    center[alongAxis] =
      outerCoord +
      (outerAtMin
        ? END_CABINET_WALL_PLANK_THICKNESS_MM / 2
        : -END_CABINET_WALL_PLANK_THICKNESS_MM / 2);
    wallPlank = {
      center,
      size,
      widthMm: wallPlankWidthMm,
      thicknessMm: END_CABINET_WALL_PLANK_THICKNESS_MM,
      /** Полная высота секции (до верха верхней планки), не высота ниши. */
      sectionHeightMm:
        Number(sectionData.size?.y) ||
        Math.max(0, (Number(state.room?.height) || 0) - Math.round(Number(o.bottomMm) || 0) - Math.round(Number(o.topMm) || 0)),
    };
  }

  // Зарезервированная полоса facadeThicknessMm находится со стороны фасадов
  // основного ряда. Накладка лежит в той же плоскости, что эти фасады, и
  // закрывает бок торцевого шкафа на всю его длину вдоль стены.
  let facadeOverlay = null;
  if (facadeThicknessMm > 0) {
    const facadeCoord = wallAtMin ? footprint.max[depthAxis] : footprint.min[depthAxis];
    const center = new THREE.Vector3();
    const size = { x: 0, y: 0, z: 0 };
    size[alongAxis] = alongWallMm;
    size[depthAxis] = facadeThicknessMm;
    center[alongAxis] = (footprint.min[alongAxis] + footprint.max[alongAxis]) / 2;
    center[depthAxis] =
      facadeCoord + (wallAtMin ? facadeThicknessMm / 2 : -facadeThicknessMm / 2);
    facadeOverlay = {
      center,
      size,
      thicknessMm: facadeThicknessMm,
      lengthMm: alongWallMm,
      alongAxis,
      depthAxis,
    };
  }

  // Верхняя планка торцевой секции — та же фасадная планка 50×16, что у
  // основной секции, только повёрнутая вместе с торцевым шкафом. Она идёт
  // от стены до плоскости фасадов ряда и стоит над верхом корпуса.
  const topPlankHeightMm = Math.max(0, Number(slotMetrics.topPlankMm) || 0);
  let topPlank = null;
  if (topPlankHeightMm > 0) {
    // Передняя верхняя планка ряда лежит в плоскости фасадов на свою толщину
    // (addDefaultTopPlank, TOP_PLANK_THICKNESS_MM): торцевая доходит до неё, но
    // не врезается.
    const rowTopPlankThicknessMm = Math.min(
      ROW_TOP_PLANK_THICKNESS_MM,
      Math.max(0, fullIntoRoomMm - 1)
    );
    const lengthMm = Math.max(1, fullIntoRoomMm - rowTopPlankThicknessMm);
    const outerCoord = outerAtMin ? footprint.min[alongAxis] : footprint.max[alongAxis];
    const center = new THREE.Vector3();
    const size = { x: 0, y: topPlankHeightMm, z: 0 };
    size[alongAxis] = END_CABINET_WALL_PLANK_THICKNESS_MM;
    size[depthAxis] = lengthMm;
    center[alongAxis] =
      outerCoord +
      (outerAtMin
        ? END_CABINET_WALL_PLANK_THICKNESS_MM / 2
        : -END_CABINET_WALL_PLANK_THICKNESS_MM / 2);
    center[depthAxis] = wallCoord + (wallAtMin ? lengthMm / 2 : -lengthMm / 2);
    center.y = footprint.max.y + topPlankHeightMm / 2;
    topPlank = {
      center,
      size,
      heightMm: topPlankHeightMm,
      thicknessMm: END_CABINET_WALL_PLANK_THICKNESS_MM,
      widthMm: lengthMm,
      alongAxis,
      depthAxis,
    };
  }

  // Цоколь торцевой секции — та же деталь 100×16 у пола, что нижняя планка ряда,
  // только повёрнутая вместе с торцевым шкафом: утоплена от плоскости фасада
  // на толщину фасада (фасад нависает) и идёт между внутренними гранями
  // вертикалей — от боковой планки 50 мм у стены до переднего цоколя ряда.
  let plinth = null;
  if (plinthMm > 0) {
    const plinthThicknessMm = END_CABINET_WALL_PLANK_THICKNESS_MM;
    // На прямой стене нижняя планка ряда утоплена от плоскости фасада на её
    // толщину (addDefaultBottomPlank), на боковой — лежит в плоскости фасада.
    const rowPlinthRecessMm =
      wallName === 'left' || wallName === 'right' ? 0 : facadeThicknessMm;
    const lengthMm = Math.max(
      1,
      fullIntoRoomMm - wallPlankWidthMm - rowPlinthRecessMm - plinthThicknessMm
    );
    const outerCoord = outerAtMin ? footprint.min[alongAxis] : footprint.max[alongAxis];
    const inward = outerAtMin ? 1 : -1;
    const nearCoord = wallCoord + (wallAtMin ? wallPlankWidthMm : -wallPlankWidthMm);
    const center = new THREE.Vector3();
    const size = { x: 0, y: plinthMm, z: 0 };
    size[alongAxis] = plinthThicknessMm;
    size[depthAxis] = lengthMm;
    center[alongAxis] =
      outerCoord + inward * (facadeThicknessMm + plinthThicknessMm / 2);
    center[depthAxis] = nearCoord + (wallAtMin ? lengthMm / 2 : -lengthMm / 2);
    center.y = footprint.min.y + plinthMm / 2;
    plinth = {
      center,
      size,
      heightMm: plinthMm,
      thicknessMm: plinthThicknessMm,
      lengthMm,
      alongAxis,
      depthAxis,
    };
  }

  return {
    position,
    rotationY,
    sectionSize,
    footprint,
    /** @deprecated use alongWallMm */
    widthMm: alongWallMm,
    alongWallMm,
    intoRoomMm,
    fullIntoRoomMm,
    facadeThicknessMm,
    wallPlankWidthMm,
    wallPlank,
    facadeOverlay,
    topPlank,
    plinth,
    depthMm: intoRoomMm,
    /** Габарит модуля по высоте: цоколь + ниша (как у обычного шкафа ряда). */
    heightMm,
    /** Высота слота ниши (идёт в сборку как sectionSize.y). */
    nicheHeightMm,
    plinthMm,
    wallName,
    side,
    worldFootprint,
  };
}

/**
 * После scale + rotation.y (±90°) сдвинуть группу так, чтобы world-bbox
 * совпал с пятном слота (left/right зеркально). Иначе pivot шкафа уезжает в стену.
 */
export function snapEndCabinetGroupToSlot(group, slot, getWorldBBox, getFloorContactY) {
  if (!group || !slot?.footprint) return false;
  try {
    group.updateMatrixWorld(true);
    const bb =
      typeof getWorldBBox === 'function'
        ? getWorldBBox(group)
        : new THREE.Box3().setFromObject(group);
    if (!bb || bb.isEmpty?.()) return false;
    const size = bb.getSize(new THREE.Vector3());
    if (!(size.x > 1 && size.y > 1 && size.z > 1)) return false;
    const fp = slot.footprint;
    const dx = fp.min.x - bb.min.x;
    const floorContactY =
      typeof getFloorContactY === 'function' ? Number(getFloorContactY(group)) : bb.min.y;
    const dy = fp.min.y - (Number.isFinite(floorContactY) ? floorContactY : bb.min.y);
    const dz = fp.min.z - bb.min.z;
    if (![dx, dy, dz].every((v) => Number.isFinite(v))) return false;
    group.position.x += dx;
    group.position.y += dy;
    group.position.z += dz;
    group.updateMatrixWorld(true);
    return true;
  } catch (e) {
    console.warn('[END-CAB] snap to slot failed', e);
    return false;
  }
}

/**
 * Режим «торцевой»: резерв вдоль стены = глубина из диалога.
 * Отступ (зазор) НЕ обнуляется — ряд = стена − зазор − торцевой.
 */
export function setEndCabinetMode(sectionData, side, meta = {}) {
  if (!sectionData || !side) return null;
  const map = ensureEndCabinets(sectionData);
  const o = sectionData.offsets || (sectionData.offsets = {});
  const key = `${side}Mm`;
  const gapMm = Math.round(Number(o[key]) || Number(meta.savedGapMm) || 0);
  const widthMm = Math.round(Number(meta.widthMm) || 0);
  if (!(widthMm > WALL_EPS_MM)) return null;

  const rule = getEndCabinetRule();
  const intoRoomMm =
    Math.round(Number(meta.intoRoomMm) || 0) || getSectionIntoRoomMm(sectionData);
  map[side] = {
    mode: 'cabinet',
    catalogType: String(meta.catalogType || rule.catalogType || ''),
    catalogCategoryId: String(
      meta.catalogCategoryId != null ? meta.catalogCategoryId : rule.catalogCategoryId || ''
    ),
    widthMm,
    intoRoomMm,
    savedGapMm: Math.round(Number(meta.savedGapMm) || gapMm || 0),
    furnitureUuid: meta.furnitureUuid || undefined,
    pendingPlace: meta.pendingPlace !== false,
  };
  // offsets[side] не трогаем.
  return map[side];
}

export function clearEndCabinetMode(sectionData, side) {
  if (!sectionData || !side) return null;
  const map = ensureEndCabinets(sectionData);
  removeEndCabinetFurniture(sectionData, side);
  delete map[side];
  // Зазор в offsets оставляем как есть.
  return { restoreMm: 0, side };
}

/** Offsets (см) для updateSectionSize с учётом текущих sectionData.offsets. */
export function offsetsCmFromSection(sectionData) {
  const o = sectionData?.offsets || {};
  return {
    left: (Number(o.leftMm) || 0) / 10,
    right: (Number(o.rightMm) || 0) / 10,
    front: (Number(o.frontMm) || 0) / 10,
    back: (Number(o.backMm) || 0) / 10,
    bottom: (Number(o.bottomMm) || 0) / 10,
    top: (Number(o.topMm) || 0) / 10,
  };
}

export function sectionDepthCm(sectionData) {
  const wall = sectionData?.wallName || 'back';
  if (wall === 'left' || wall === 'right') {
    return (Number(sectionData?.size?.x) || 600) / 10;
  }
  return (Number(sectionData?.size?.z) || 600) / 10;
}

/** Прямая секция = front/back (v1 диалогов). */
export function isStraightWallSection(sectionData) {
  const w = sectionData?.wallName || 'back';
  return w === 'front' || w === 'back';
}

/**
 * Кандидаты на диалог торцевого по уже посчитанным offsets (см).
 * v1: только left/right на прямой секции.
 * Мост у окна (tall/bay): торцевых нет — диалог не предлагаем.
 */
export function collectEndCabinetDialogCandidates(sectionData, offsetsCm) {
  if (
    sectionData?.windowBridgeGroupId ||
    sectionData?.underWindowBay ||
    sectionData?.windowBridgeRole ||
    sectionData?.windowBridge
  ) {
    console.log('[END-CAB] skip dialogs: window bridge / under-window section');
    return [];
  }
  if (!isStraightWallSection(sectionData)) {
    console.log('[END-CAB] skip dialogs: not straight wall', sectionData?.wallName);
    return [];
  }
  const rule = getEndCabinetRule();
  if (!rule.enabled) {
    console.log('[END-CAB] skip dialogs: rule disabled');
    return [];
  }
  const out = [];
  for (const side of ['left', 'right']) {
    if (isEndCabinetActive(sectionData, side)) continue;
    const gapMm = Math.round((Number(offsetsCm?.[side]) || 0) * 10);
    if (!gapEligibleForEndCabinet(gapMm, rule)) {
      if (gapMm > WALL_EPS_MM) {
        console.log('[END-CAB] skip side', side, 'gapMm=', gapMm, 'range', rule.minGapMm, '–', rule.maxGapMm);
      }
      continue;
    }
    out.push({ side, gapMm });
  }
  console.log('[END-CAB] dialog candidates', out, 'rule', rule);
  return out;
}

function ensureEndCabinetDialogCss() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('cld-endcab-dialog-css')) return;
  const style = document.createElement('style');
  style.id = 'cld-endcab-dialog-css';
  style.textContent = `
    .cld-endcab-overlay{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10050;display:flex;align-items:center;justify-content:center;padding:16px;}
    .cld-endcab-card{background:#fff;border-radius:10px;max-width:420px;width:100%;padding:20px 22px;box-shadow:0 12px 40px rgba(0,0,0,.18);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;}
    .cld-endcab-card h3{margin:0 0 10px;font-size:17px;font-weight:700;color:#111827;}
    .cld-endcab-card p{margin:0 0 16px;font-size:14px;line-height:1.45;color:#4b5563;}
    .cld-endcab-actions{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;}
    .cld-endcab-actions button{padding:8px 14px;border-radius:6px;border:1px solid #d1d5db;background:#fff;font-size:14px;cursor:pointer;}
    .cld-endcab-actions button.primary{background:#2563eb;border-color:#2563eb;color:#fff;}
    .cld-endcab-field{margin:0 0 16px;}
    .cld-endcab-field label{display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:#374151;}
    .cld-endcab-field input{width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:15px;box-sizing:border-box;}
  `;
  document.head.appendChild(style);
}

export function promptEndCabinetYesNo({ side, gapMm, label }) {
  ensureEndCabinetDialogCss();
  const sideRu = sideLabelRu(side);
  const title = label || getEndCabinetRule().label || 'Торцевой шкаф';
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'cld-endcab-overlay';
    overlay.innerHTML = `
      <div class="cld-endcab-card" role="dialog" aria-modal="true">
        <h3>${title}</h3>
        <p>Отступ ${sideRu} ${Math.round(gapMm)}&nbsp;мм. Поставить торцевой шкаф с края этого отступа?<br>
        <span style="color:#6b7280;font-size:13px;">Зазор останется. Далее укажите глубину торцевого — сколько он займёт по ширине ряда. Ширина модуля = глубина секции.</span></p>
        <div class="cld-endcab-actions">
          <button type="button" data-act="no">Нет, накладка</button>
          <button type="button" class="primary" data-act="yes">Да</button>
        </div>
      </div>`;
    const close = (val) => {
      overlay.remove();
      resolve(val);
    };
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(false);
    });
    overlay.querySelector('[data-act="no"]').addEventListener('click', () => close(false));
    overlay.querySelector('[data-act="yes"]').addEventListener('click', () => close(true));
    document.body.appendChild(overlay);
  });
}

export function promptEndCabinetDepthCm(defaultDepthCm) {
  ensureEndCabinetDialogCss();
  const initial = Number(defaultDepthCm);
  const start = Number.isFinite(initial) && initial > 0 ? initial : 60;
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'cld-endcab-overlay';
    overlay.innerHTML = `
      <div class="cld-endcab-card" role="dialog" aria-modal="true">
        <h3>Глубина торцевого</h3>
        <p>Сколько торцевой займёт по ширине ряда с края отступа (см). Зазор не меняется. Ширина модуля = глубина основной секции.</p>
        <div class="cld-endcab-field">
          <label for="cld-endcab-depth">Глубина, см</label>
          <input id="cld-endcab-depth" type="number" min="10" step="1" value="${start}" />
        </div>
        <div class="cld-endcab-actions">
          <button type="button" data-act="cancel">Отмена</button>
          <button type="button" class="primary" data-act="ok">Применить</button>
        </div>
      </div>`;
    const input = overlay.querySelector('#cld-endcab-depth');
    const close = (val) => {
      overlay.remove();
      resolve(val);
    };
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(null);
    });
    overlay.querySelector('[data-act="cancel"]').addEventListener('click', () => close(null));
    overlay.querySelector('[data-act="ok"]').addEventListener('click', () => {
      const v = parseFloat(input.value);
      if (!Number.isFinite(v) || v < 10) {
        input.focus();
        return;
      }
      close(v);
    });
    document.body.appendChild(overlay);
    setTimeout(() => {
      try {
        input.focus();
        input.select();
      } catch (_) {}
    }, 30);
  });
}

/** Шаг 4: редактирование только глубины и стороны открывания торцевого. */
export function promptEndCabinetEdit({ depthCm, zoneHand } = {}) {
  const initialDepth = Number(depthCm);
  const initialHand = zoneHand === 'right' ? 'right' : 'left';
  const startDepth = Number.isFinite(initialDepth) && initialDepth >= 10 ? initialDepth : 60;
  return new Promise((resolve) => {
    // Используем то же окно, что карандаш обычного шкафа: справа, поверх панели.
    const overlay = document.getElementById('step4-help-modal-overlay');
    const titleEl = document.getElementById('step4-help-modal-title');
    const contentEl = document.getElementById('step4-help-modal-content');
    const okBtn = document.getElementById('step4-help-modal-ok');
    if (!overlay || !contentEl) {
      resolve(null);
      return;
    }

    const modalEl = overlay.querySelector('.step4-help-modal');
    if (modalEl) modalEl.classList.add('step4-help-modal--module-edit');
    overlay.classList.add('step4-help-modal-overlay--module-edit');
    if (titleEl) {
      titleEl.textContent = 'Настройки торцевого шкафа';
      titleEl.style.display = 'none';
    }
    if (okBtn) okBtn.style.display = 'none';
    contentEl.innerHTML = `
      <div class="cld-module-edit">
        <div class="cld-module-edit__header">
          <h3 class="cld-module-edit__title">Настройки торцевого шкафа</h3>
          <button type="button" class="cld-module-edit__close" id="step4-endcab-close-btn" aria-label="Закрыть" title="Закрыть">
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>
        <div class="cld-module-edit__body">
          <div class="cld-module-edit__field">
            <label class="cld-module-edit__label" for="step4-endcab-depth-input">Глубина модуля</label>
            <div class="cld-module-edit__input-wrap" style="margin-top:8px;">
              <input id="step4-endcab-depth-input" class="cld-module-edit__input" type="number" min="10" step="0.1" value="${startDepth}" />
              <span class="cld-module-edit__unit">см</span>
            </div>
          </div>
          <div class="cld-module-edit__field">
            <div class="cld-module-edit__label">Открывание двери</div>
            <div class="cld-module-edit__segment" style="margin-top:8px;">
              <button type="button" class="step4-module-hand-btn step4-endcab-hand-btn${initialHand === 'left' ? ' is-selected' : ''}" data-hand="left">Левая</button>
              <button type="button" class="step4-module-hand-btn step4-endcab-hand-btn${initialHand === 'right' ? ' is-selected' : ''}" data-hand="right">Правая</button>
            </div>
            <div class="cld-module-edit__hint">Петли и распашка фасада</div>
          </div>
        </div>
        <div class="cld-module-edit__footer">
          <button type="button" id="step4-endcab-save-btn" class="cld-module-edit__save">Сохранить</button>
        </div>
      </div>
    `;

    const input = contentEl.querySelector('#step4-endcab-depth-input');
    const saveBtn = contentEl.querySelector('#step4-endcab-save-btn');
    const closeBtn = contentEl.querySelector('#step4-endcab-close-btn');
    const handButtons = Array.from(contentEl.querySelectorAll('.step4-endcab-hand-btn'));
    let selectedHand = initialHand;
    const paintHands = () => {
      for (const btn of handButtons) {
        const active = btn.dataset.hand === selectedHand;
        btn.classList.toggle('is-selected', active);
        btn.style.background = '';
        btn.style.color = '';
      }
    };
    paintHands();
    handButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedHand = btn.dataset.hand === 'right' ? 'right' : 'left';
        paintHands();
      });
    });

    const close = (value) => {
      overlay.style.display = 'none';
      overlay.onclick = null;
      if (modalEl) modalEl.classList.remove('step4-help-modal--module-edit');
      overlay.classList.remove('step4-help-modal-overlay--module-edit');
      if (titleEl) titleEl.style.display = '';
      if (okBtn) okBtn.style.display = '';
      resolve(value);
    };
    overlay.onclick = (e) => {
      if (e.target === overlay) close(null);
    };
    if (closeBtn) {
      closeBtn.addEventListener('click', () => close(null));
    }
    saveBtn.addEventListener('click', () => {
      const nextDepth = parseFloat(input.value);
      if (!Number.isFinite(nextDepth) || nextDepth < 10) {
        input.focus();
        return;
      }
      close({ depthCm: nextDepth, zoneHand: selectedHand });
    });
    overlay.style.display = 'flex';
    setTimeout(() => {
      try {
        input.focus();
        input.select();
      } catch (_) {}
    }, 30);
  });
}

/** Режим каталога шага 4 после выбора торцевого. */
export function setPendingEndCabinetPlacement(payload) {
  if (typeof window === 'undefined') return;
  if (!payload) {
    window.__cldEndCabinetCatalogMode = null;
    return;
  }
  window.__cldEndCabinetCatalogMode = {
    active: true,
    sectionId: payload.sectionId,
    side: payload.side,
    catalogType: String(payload.catalogType || getEndCabinetRule().catalogType || '').trim(),
    catalogCategoryId: String(
      payload.catalogCategoryId || getEndCabinetRule().catalogCategoryId || ''
    ).trim(),
    catalogFilterTag: String(
      payload.catalogFilterTag || getEndCabinetRule().catalogFilterTag || ''
    ).trim(),
    label: payload.label || getEndCabinetRule().label,
  };
}

export function getPendingEndCabinetPlacement() {
  try {
    const m = typeof window !== 'undefined' ? window.__cldEndCabinetCatalogMode : null;
    return m && m.active ? m : null;
  } catch (_) {
    return null;
  }
}

function normalizeCatalogTypeKey(ct) {
  return String(ct || '')
    .trim()
    .replace(/^catalog_/, '');
}

/** Модуль из каталога торцевых (по типу каталога шага 3), независимо от pending. */
export function isEndCabinetCatalogModule(furnitureData) {
  const expected = normalizeCatalogTypeKey(
    getPendingEndCabinetPlacement()?.catalogType || getEndCabinetRule().catalogType
  );
  if (!expected) return false;
  const actual = normalizeCatalogTypeKey(
    furnitureData?.catalogType ??
      furnitureData?.catalogItem?.catalog_type ??
      furnitureData?.catalogItem?.catalogType ??
      ''
  );
  return !!actual && actual === expected;
}

/**
 * Тянем ли сейчас модуль из каталога торцевых для открытого слота.
 * Обычные модули при активном слоте работают как раньше (зоны, снап, растяжка).
 */
export function isPendingEndCabinetModule(furnitureData) {
  if (!getPendingEndCabinetPlacement()) return false;
  return isEndCabinetCatalogModule(furnitureData);
}

export function clearPendingEndCabinetPlacement() {
  setPendingEndCabinetPlacement(null);
  setEndCabinetSlotHighlight(false);
}

// Цвет/прозрачность как у одинарных зон секции (SectionZoneSingle).
const END_CAB_SLOT_HIGHLIGHT_COLOR = 0xffb74d;
const END_CAB_SLOT_HIGHLIGHT_FILL_OPACITY = 0.18;
const END_CAB_SLOT_HIGHLIGHT_LINE_OPACITY = 0.45;
const END_CAB_HIGHLIGHT_WIRE_NAME = 'EndCabinetSlotHighlightWire';
const END_CAB_HIGHLIGHT_BOX_NAME = 'EndCabinetHighlightBox';

/**
 * Подсветка уже стоящего торцевого шкафа: отдельная рамка по габариту, а не
 * подмена материалов корпуса (декор шага 5 переназначает материалы в любой момент).
 */
function syncPlacedEndCabinetHighlightBox(group, on) {
  if (!state.scene) return;
  const stale = [];
  state.scene.traverse((obj) => {
    if (obj?.name !== END_CAB_HIGHLIGHT_BOX_NAME) return;
    if (on && obj.userData?.__endCabHighlightFor === group?.uuid) return;
    stale.push(obj);
  });
  for (const obj of stale) {
    obj.parent?.remove(obj);
    obj.traverse((child) => {
      try {
        child.geometry?.dispose?.();
        child.material?.dispose?.();
      } catch (_) {}
    });
  }
  if (!on || !group) return;
  if (
    state.scene.children.some(
      (c) => c.name === END_CAB_HIGHLIGHT_BOX_NAME && c.userData?.__endCabHighlightFor === group.uuid
    )
  ) {
    return;
  }

  const bbox = new THREE.Box3().setFromObject(group);
  if (bbox.isEmpty()) return;
  const size = bbox.getSize(new THREE.Vector3());
  const geom = new THREE.BoxGeometry(
    Math.max(1, size.x),
    Math.max(1, size.y),
    Math.max(1, size.z)
  );
  const box = new THREE.Mesh(
    geom,
    new THREE.MeshBasicMaterial({
      color: END_CAB_SLOT_HIGHLIGHT_COLOR,
      transparent: true,
      opacity: END_CAB_SLOT_HIGHLIGHT_FILL_OPACITY,
      side: THREE.DoubleSide,
      depthTest: false,
    })
  );
  box.name = END_CAB_HIGHLIGHT_BOX_NAME;
  box.userData.__endCabHighlightFor = group.uuid;
  box.renderOrder = 999;
  box.position.copy(bbox.getCenter(new THREE.Vector3()));
  const wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(geom),
    new THREE.LineBasicMaterial({
      color: END_CAB_SLOT_HIGHLIGHT_COLOR,
      transparent: true,
      opacity: END_CAB_SLOT_HIGHLIGHT_LINE_OPACITY,
      depthTest: false,
    })
  );
  wire.name = END_CAB_HIGHLIGHT_WIRE_NAME;
  box.add(wire);
  state.scene.add(box);
}

/** Подсветка торцевого узла (заглушки слота или стоящего шкафа) при перетаскивании. */
export function setEndCabinetSlotHighlight(active, opts = {}) {
  if (!state.scene) return;
  const pending = getPendingEndCabinetPlacement();
  const sectionId = opts.sectionId != null ? opts.sectionId : pending?.sectionId;
  const side = opts.side != null ? opts.side : pending?.side;

  let placedTarget = null;
  state.scene.traverse((obj) => {
    const ud = obj?.userData;
    if (!ud?.isEndCabinet || ud.isEndCabinetSlot) return;
    if (sectionId == null) return;
    if (String(ud.sectionId) !== String(sectionId)) return;
    if (side != null && ud.endCabinetSide !== side) return;
    placedTarget = obj;
  });
  syncPlacedEndCabinetHighlightBox(placedTarget, active && !!placedTarget);

  state.scene.traverse((obj) => {
    const ud = obj?.userData;
    if (!ud?.isEndCabinetSlot) return;
    const matchesTarget =
      sectionId == null ||
      (String(ud.sectionId) === String(sectionId) && (side == null || ud.endCabinetSide === side));
    const on = active && matchesTarget;

    obj.traverse((child) => {
      if (!child?.isMesh || child.name === END_CAB_HIGHLIGHT_WIRE_NAME) return;
      if (on) {
        if (!child.userData.__endCabBaseMaterial) {
          child.userData.__endCabBaseMaterial = child.material;
          child.material = new THREE.MeshBasicMaterial({
            color: END_CAB_SLOT_HIGHLIGHT_COLOR,
            transparent: true,
            opacity: END_CAB_SLOT_HIGHLIGHT_FILL_OPACITY,
            side: THREE.DoubleSide,
            depthTest: false,
          });
        }
        if (!child.getObjectByName(END_CAB_HIGHLIGHT_WIRE_NAME)) {
          const wire = new THREE.LineSegments(
            new THREE.EdgesGeometry(child.geometry),
            new THREE.LineBasicMaterial({
              color: END_CAB_SLOT_HIGHLIGHT_COLOR,
              transparent: true,
              opacity: END_CAB_SLOT_HIGHLIGHT_LINE_OPACITY,
              depthTest: false,
            })
          );
          wire.name = END_CAB_HIGHLIGHT_WIRE_NAME;
          child.add(wire);
        }
      } else {
        const base = child.userData.__endCabBaseMaterial;
        if (base) {
          try {
            child.material?.dispose?.();
          } catch (_) {}
          child.material = base;
          delete child.userData.__endCabBaseMaterial;
        }
        const wire = child.getObjectByName(END_CAB_HIGHLIGHT_WIRE_NAME);
        if (wire) {
          child.remove(wire);
          try {
            wire.geometry?.dispose?.();
            wire.material?.dispose?.();
          } catch (_) {}
        }
      }
    });
  });
}

/**
 * Узел торцевого целиком: заглушка слота либо уже стоящий шкаф плюс его планки
 * и фасадная накладка (они лежат в группе основной секции).
 */
const END_CABINET_PART_FLAGS = [
  'isEndCabinetSlot',
  'isEndCabinet',
  'isEndCabinetWallPlank',
  'isEndCabinetTopPlank',
  'isEndCabinetPlinth',
  'isEndCabinetFacadeOverlay',
];

/** Меш принадлежит торцевому узлу (а не обычной секции, в группе которой он лежит). */
export function isEndCabinetPartObject(object) {
  let node = object;
  while (node) {
    const ud = node.userData;
    if (ud && END_CABINET_PART_FLAGS.some((flag) => ud[flag] === true)) return true;
    node = node.parent;
  }
  return false;
}

function collectEndCabinetTargets() {
  const out = [];
  if (!state.scene) return out;
  state.scene.traverse((obj) => {
    const ud = obj?.userData;
    if (!ud) return;
    if (END_CABINET_PART_FLAGS.some((flag) => ud[flag] === true)) out.push(obj);
  });
  return out;
}

function resolveEndCabinetTargetFromObject(object) {
  let node = object;
  let side = null;
  let sectionId = null;
  let group = null;
  while (node) {
    const ud = node.userData || {};
    if (side == null && END_CABINET_PART_FLAGS.some((flag) => ud[flag] === true)) {
      side = ud.endCabinetSide || null;
      group = node;
    }
    if (sectionId == null && ud.sectionId != null) sectionId = ud.sectionId;
    node = node.parent;
  }
  if (!side || sectionId == null) return null;
  const section = (state.customSections || []).find((s) => String(s?.id) === String(sectionId));
  const entry = section?.endCabinets?.[side] || {};
  const catalogType = String(
    entry.catalogType || group?.userData?.catalogType || getEndCabinetRule().catalogType || ''
  ).trim();
  return { group, sectionId, side, catalogType };
}

/**
 * Торцевой узел под курсором: цель размещения, если он ближе обычной секции.
 * Ловим не только заглушку слота, но и её планки/накладку — они закрывают слот
 * со стороны фасадов и стены.
 * @returns {{group:Object, sectionId:*, side:string, catalogType:string, distance:number}|null}
 */
export function pickEndCabinetSlotFromRaycaster(raycaster) {
  if (!raycaster) return null;
  const targets = collectEndCabinetTargets();
  if (!targets.length) return null;
  const hits = raycaster.intersectObjects(targets, true);
  for (const hit of hits) {
    const target = resolveEndCabinetTargetFromObject(hit.object);
    if (target) return { ...target, distance: hit.distance };
  }
  return null;
}

/** Каталог торцевых для конкретного слота (обычный модуль занесли в торцевую секцию). */
export function activateEndCabinetCatalogForSlot(slotInfo) {
  if (!slotInfo) return false;
  setPendingEndCabinetPlacement({
    sectionId: slotInfo.sectionId,
    side: slotInfo.side,
    catalogType: slotInfo.catalogType,
  });
  try {
    if (typeof window !== 'undefined' && typeof window.__cldOpenStep4ForEndCabinet === 'function') {
      window.__cldOpenStep4ForEndCabinet();
    }
  } catch (e) {
    console.warn('[END-CAB] open end cabinet catalog failed', e);
  }
  return true;
}

/** Обычный каталог (торцевой модуль занесли не в торцевую секцию). */
export function switchBackToRegularCatalog() {
  clearPendingEndCabinetPlacement();
  try {
    if (typeof window !== 'undefined' && typeof window.__cldOpenStep4ForRegularCatalog === 'function') {
      window.__cldOpenStep4ForRegularCatalog();
    }
  } catch (e) {
    console.warn('[END-CAB] restore regular catalog failed', e);
  }
}

if (typeof window !== 'undefined') {
  window.__cldEndCabinet = {
    getEndCabinetRule,
    isEndCabinetActive,
    getEndCabinetReserveMm,
    shouldSuppressSideTrimForEndCabinet,
    serializeEndCabinets,
    gapEligibleForEndCabinet,
    collectEndCabinetDialogCandidates,
    promptEndCabinetYesNo,
    promptEndCabinetDepthCm,
    setPendingEndCabinetPlacement,
    getPendingEndCabinetPlacement,
    clearPendingEndCabinetPlacement,
    isPendingEndCabinetModule,
    isEndCabinetCatalogModule,
    setEndCabinetSlotHighlight,
    pickEndCabinetSlotFromRaycaster,
    isEndCabinetPartObject,
    activateEndCabinetCatalogForSlot,
    switchBackToRegularCatalog,
    isStraightWallSection,
  };
}
