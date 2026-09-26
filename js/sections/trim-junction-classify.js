/**
 * Единый словарь стыков обклада (SECTION-UNIFIED-CONTRACT + SPEC §6.7).
 *
 * Не ветвиться по wallName / типу секции: только placementKind + cohabit в зоне.
 * SideCap (needsCap) — между соседними зонами, когда роли tall↔low.
 * Колонна base+upper: для горизонтального SideCap роль зоны = low (как у нижнего).
 */
import {
  PLACEMENT_KIND,
  isLowFurniturePlacementKind,
  isTallFurniturePlacementKind,
  isWallHungHighPlacementKind,
} from './vertical-layout.js';

/** @param {string} pk */
export function isWardrobePlacementKind(pk) {
  const s = String(pk || '').trim() || PLACEMENT_KIND.FLOOR_IN_NICHE;
  return s === PLACEMENT_KIND.FLOOR_IN_NICHE || s === '';
}

/**
 * Роль зоны для горизонтального SideCap.
 * @param {string|null|undefined} pk
 * @param {string|null|undefined} cohabitPartnerPk — второй жилец той же зоны (если есть)
 * @returns {'tall'|'low'|'empty'}
 */
export function effectiveCapRole(pk, cohabitPartnerPk) {
  const a = String(pk || '').trim();
  const b = String(cohabitPartnerPk || '').trim();
  if (!a && !b) return 'empty';
  // Колонна: верхний навес + низкий → стык со шкафом как у низкого (§6.7.2).
  if (
    (isWallHungHighPlacementKind(a) && isLowFurniturePlacementKind(b)) ||
    (isLowFurniturePlacementKind(a) && isWallHungHighPlacementKind(b))
  ) {
    return 'low';
  }
  const primary = a || b;
  if (isLowFurniturePlacementKind(primary)) return 'low';
  if (isTallFurniturePlacementKind(primary) || isWardrobePlacementKind(primary)) {
    return 'tall';
  }
  return 'empty';
}

/**
 * Нужен ли SideCap 16 мм между двумя ролями зон.
 * @param {'tall'|'low'|'empty'} roleA
 * @param {'tall'|'low'|'empty'} roleB
 */
export function needsSideCapBetweenRoles(roleA, roleB) {
  return (
    (roleA === 'tall' && roleB === 'low') || (roleA === 'low' && roleB === 'tall')
  );
}

/**
 * @param {string} pkL
 * @param {string} pkR
 * @param {{ leftCohabitPk?: string|null, rightCohabitPk?: string|null }} [opts]
 * @returns {null | {
 *   needsCap: true,
 *   leftRole: string,
 *   rightRole: string,
 *   dresserSide: 'left'|'right',
 *   reason: string
 * }}
 */
export function classifyCapBetweenKinds(pkL, pkR, opts = {}) {
  const leftRole = effectiveCapRole(pkL, opts.leftCohabitPk);
  const rightRole = effectiveCapRole(pkR, opts.rightCohabitPk);
  if (needsSideCapBetweenRoles(leftRole, rightRole)) {
    // Низкий слева от шкафа → SideCap на левом торце шкафа (dresserSide='left' у niche=шкаф).
    const dresserSide = leftRole === 'low' ? 'left' : 'right';
    let reason = 'tall_low';
    if (
      isWallHungHighPlacementKind(pkL) ||
      isWallHungHighPlacementKind(pkR) ||
      isWallHungHighPlacementKind(opts.leftCohabitPk) ||
      isWallHungHighPlacementKind(opts.rightCohabitPk)
    ) {
      reason = 'hang_or_column_wardrobe';
    }
    return {
      needsCap: true,
      leftRole,
      rightRole,
      dresserSide,
      reason,
    };
  }

  // §6.7.2: оба tall — wall_hung_high | шкаф без низкого в ячейке навеса.
  // Колонна base+upper уже даёт role=low выше; здесь только high|шкаф.
  const hangLeftAlone =
    isWallHungHighPlacementKind(pkL) &&
    !isLowFurniturePlacementKind(opts.leftCohabitPk);
  const hangRightAlone =
    isWallHungHighPlacementKind(pkR) &&
    !isLowFurniturePlacementKind(opts.rightCohabitPk);
  const wardLeft =
    isWardrobePlacementKind(pkL) &&
    !isWallHungHighPlacementKind(pkL) &&
    !isLowFurniturePlacementKind(pkL);
  const wardRight =
    isWardrobePlacementKind(pkR) &&
    !isWallHungHighPlacementKind(pkR) &&
    !isLowFurniturePlacementKind(pkR);
  if ((hangLeftAlone && wardRight) || (wardLeft && hangRightAlone)) {
    return {
      needsCap: true,
      leftRole: 'tall',
      rightRole: 'tall',
      // Навес слева от шкафа → SideCap на левом торце шкафа.
      dresserSide: hangLeftAlone ? 'left' : 'right',
      reason: 'hang_wardrobe_both_tall',
    };
  }
  return null;
}

/**
 * Свободный бок верхнего навеса: соседняя зона = low (не шкаф) → накладка на боку навеса (§6.7.3).
 * Сосед пуст / шкаф → null.
 */
export function classifyHangFreeSide(hangPk, neighborPk) {
  if (!isWallHungHighPlacementKind(hangPk)) return null;
  if (!neighborPk) return null;
  if (isWardrobePlacementKind(neighborPk) && !isLowFurniturePlacementKind(neighborPk)) {
    return null;
  }
  if (!isLowFurniturePlacementKind(neighborPk)) return null;
  return { hangHighVsAdjacentLow: true };
}

/**
 * Собрать kinds зоны (1–2 жильца).
 * @param {{ placementKind?: string, cohabitPlacementKind?: string, occupants?: Array<{placementKind?: string}> }} zone
 */
export function zonePlacementKinds(zone) {
  if (!zone) return [];
  if (Array.isArray(zone.occupants) && zone.occupants.length) {
    return zone.occupants
      .map((o) => String(o?.placementKind || '').trim())
      .filter(Boolean);
  }
  const out = [];
  const a = String(zone.placementKind || '').trim();
  if (a) out.push(a);
  const b = String(zone.cohabitPlacementKind || '').trim();
  if (b) out.push(b);
  return out;
}

/**
 * Роль зоны для SideCap из модели зоны (cohabit-aware).
 */
export function zoneEffectiveCapRole(zone) {
  const kinds = zonePlacementKinds(zone);
  if (!kinds.length) return 'empty';
  return effectiveCapRole(kinds[0], kinds[1] || null);
}

/**
 * Стык двух соседних занятых зон (внутри секции или на границе ячеек ряда).
 */
export function classifyCapBetweenZones(zoneL, zoneR) {
  const kindsL = zonePlacementKinds(zoneL);
  const kindsR = zonePlacementKinds(zoneR);
  if (!kindsL.length || !kindsR.length) return null;
  return classifyCapBetweenKinds(kindsL[0], kindsR[0], {
    leftCohabitPk: kindsL[1] || null,
    rightCohabitPk: kindsR[1] || null,
  });
}
