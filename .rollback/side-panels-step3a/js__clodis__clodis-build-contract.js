/**
 * Контракт системного кухонного конструктора (admin ≡ room).
 *
 * 1. Правила проекта: plinthHeightMm → v:h_bottom / vysota_cokolya (не секрет на SKU).
 * 2. Поведение только по placementKind (kitchen_base / kitchen_base_corner / tall / wall_*).
 * 3. Геометрия: дерево карточки → prepareClodisForBuild → ClodisBuilder.
 * 4. Угол: kitchen_base_corner (НМУ) + kitchen_wall_corner (ВМУ); не «на каждый шкаф».
 * 5. Цоколь: доски type:plinth/cokol из модуля; рядный overlay-цоколь не дублирует.
 * 6. Столешка: пока одна плита на НМ (не прогон); стек глубины Dwt сохранён; в карточку — следующий шаг.
 *
 * Room не имеет права после prepare двигать pos/size досок «для красоты».
 */

import { prepareClodisForBuild, treeHasCornerReturn } from './clodis-prepare-for-build.js?v=20261027-nmu142g';

export const CLD_BUILD_CONTRACT = {
  version: '20261025-vmu9',
  prepareEntry: 'prepareClodisForBuild',
  builder: 'ClodisBuilder',
  cornerPlacementKind: 'kitchen_base_corner',
  plinthFromModuleBoards: true,
  runOverlayPlinth: false,
};

export function isCornerKitchenPlacementKind(pk) {
  const s = String(pk || '').trim();
  // НМУ низ + ВМУ навес — оба угла с corner_return (иначе preview: corner.enabled=false).
  return s === 'kitchen_base_corner' || s === 'kitchen_wall_corner';
}

/**
 * Единый вход для кухни: vars проекта + дерево + kind.
 * @param {object} args
 * @returns {{ roots, variables, meta }}
 */
export function prepareKitchenModuleForBuild(args) {
  const a = args && typeof args === 'object' ? args : {};
  const placementKind = String(a.placementKind || '').trim();
  const isCorner = isCornerKitchenPlacementKind(placementKind);
  const plinth =
    Number(a.plinthHeightMm) > 0
      ? Number(a.plinthHeightMm)
      : Number(a.variables?.h_bottom) > 0
        ? Number(a.variables.h_bottom)
        : undefined;

  // Угол включается типом kitchen_base_corner; ctx (ширина/return) опционален.
  const cornerOpts = isCorner
    ? {
        ...(a.corner && typeof a.corner === 'object' ? a.corner : {}),
        enabled: a.corner && a.corner.enabled === false ? false : true,
        normalizeTree: a.corner?.normalizeTree !== false,
      }
    : { enabled: false };

  // Мутации дерева cornerNmu (корпус/цоколь → span+inset) — только НМУ низ.
  // ВМУ тоже угол (vars), но без NMU-нормализации корпуса стола.
  const isNmuCorner = placementKind === 'kitchen_base_corner';
  const prepared = prepareClodisForBuild(a.roots, {
    variables: a.variables || {},
    widthMm: a.widthMm,
    item: a.item || null,
    placementKind,
    doorPrepareOpts: a.doorPrepareOpts || null,
    kitchenNormalize: {
      plinthHeightMm: plinth,
      kitchenSupports: a.kitchenSupports || null,
      cornerNmu: isNmuCorner,
      ...(a.kitchenNormalize && typeof a.kitchenNormalize === 'object'
        ? a.kitchenNormalize
        : {}),
    },
    corner: cornerOpts,
  });

  return {
    roots: prepared.roots,
    variables: prepared.variables,
    meta: {
      placementKind,
      isCorner,
      hasCornerReturn: treeHasCornerReturn(prepared.roots),
      plinthHeightMm: Number(prepared.variables?.h_bottom) || plinth || null,
      contract: CLD_BUILD_CONTRACT.version,
    },
  };
}

/** Debug: сравнить два набора vars после prepare (админ vs room). */
export function diffPrepareVariables(adminVars, roomVars) {
  const a = adminVars && typeof adminVars === 'object' ? adminVars : {};
  const b = roomVars && typeof roomVars === 'object' ? roomVars : {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const changed = [];
  for (const k of keys) {
    const va = a[k];
    const vb = b[k];
    if (String(va) !== String(vb)) changed.push({ key: k, admin: va, room: vb });
  }
  return { ok: changed.length === 0, changed };
}

if (typeof window !== 'undefined') {
  window.__cldBuildContract = {
    CLD_BUILD_CONTRACT,
    isCornerKitchenPlacementKind,
    prepareKitchenModuleForBuild,
    diffPrepareVariables,
  };
}
