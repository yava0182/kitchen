/**
 * ОДИН вход перед ClodisBuilder (админ-превью и room place).
 *
 * KEEP: дерево карточки, комната place, ClodisBuilder.
 * DELETE здесь: вторые повара (отдельные regex/vars только в админке).
 *
 * Угол (corner_return / NMU): только placementKind=kitchen_base_corner
 * или явный opts.corner (enabled !== false). Обычный kitchen_base — без cornerNmu.
 */

import {
  buildKitchenCornerReturnVars,
  resolveKitchenCornerVarsForCatalogCard,
} from '../kitchen/kitchen-section-layout.js?v=20261118-overlayL6';

function planTreeHasLayoutRole(roots, roleKey) {
  const want = String(roleKey || '')
    .trim()
    .toLowerCase();
  if (!want) return false;
  const stack = Array.isArray(roots) ? [...roots] : roots ? [roots] : [];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    const r = String(n.layout_role ?? n.sectionLayoutRole ?? '')
      .trim()
      .toLowerCase();
    if (r === want) return true;
    if (Array.isArray(n.children)) stack.push(...n.children);
  }
  return false;
}

/** G-шкаф без window-хелпера: роль / v:corner_g_* / имя / catalog_54#3|4. */
function detectKitchenUpperGArm(roots, item) {
  if (planTreeHasLayoutRole(roots, 'corner_g_return')) return true;
  const name = String(item?.name || item?.title || item?.data?.name || '').trim();
  if (/угловой\s*г/i.test(name) || /\bг\s*обр/i.test(name)) return true;
  const ct = String(item?.catalog_type || item?.catalogType || item?.data?.catalog_type || '')
    .replace(/^catalog_/i, '')
    .trim();
  const id = Number(item?.id ?? item?.data?.id) || 0;
  if ((ct === '54' || /54$/.test(ct)) && (id === 3 || id === 4)) return true;

  const stack = Array.isArray(roots) ? [...roots] : roots ? [roots] : [];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    if (/приставка\s*г/i.test(String(n.name || ''))) return true;
    for (const bag of [n.size, n.pos]) {
      if (!bag || typeof bag !== 'object') continue;
      for (const v of Object.values(bag)) {
        if (/v:\s*corner_g_/i.test(String(v || ''))) return true;
      }
    }
    if (Array.isArray(n.children)) stack.push(...n.children);
  }

  try {
    if (
      typeof window !== 'undefined' &&
      typeof window.__cldIsKitchenUpperGModuleData === 'function' &&
      window.__cldIsKitchenUpperGModuleData({
        constructor_structure: roots,
        name: item?.name,
        id: item?.id,
        catalog_type: item?.catalog_type || item?.catalogType,
      })
    ) {
      return true;
    }
  } catch (_) {}
  return false;
}

function isCornerPlacementKind(pk) {
  const s = String(pk || '').trim();
  // НМУ низ + ВМУ/угловой навес — один угол с corner_return.
  return s === 'kitchen_base_corner' || s === 'kitchen_wall_corner';
}

function normalizeTree(roots, kn) {
  try {
    const eng = typeof window !== 'undefined' ? window.__cldKitchenBaseEngine : null;
    if (eng && typeof eng.normalizeKitchenBaseClodisTree === 'function') {
      eng.normalizeKitchenBaseClodisTree(roots, kn || {});
    }
  } catch (_) {}
}

function applyDoorPrepare(roots, doorOpts) {
  try {
    const door =
      typeof window !== 'undefined'
        ? window.__cldFurnitureDoorLayout || window.__cldPrepareDoorLayout
        : null;
    const fn =
      door && typeof door.prepareClodisForRoomBuild === 'function'
        ? door.prepareClodisForRoomBuild
        : null;
    if (fn) return fn(roots, doorOpts);
  } catch (_) {}
  return roots;
}

/**
 * @param {object|object[]|null|undefined} rootsIn
 * @param {{
 *   variables?: Record<string, number|string>|null,
 *   widthMm?: number,
 *   item?: object|null,
 *   placementKind?: string|null,
 *   doorPrepareOpts?: object|null,
 *   kitchenNormalize?: object|null,
 *   corner?: {
 *     widthMm?: number,
 *     returnMm?: number,
 *     clearMm?: number,
 *     wallGapMm?: number,
 *     atStart?: boolean,
 *     item?: object|null,
 *     normalizeTree?: boolean,
 *     enabled?: boolean,
 *   }|null,
 * }} [opts]
 * @returns {{ roots: object|object[]|null|undefined, variables: Record<string, number|string> }}
 */
export function prepareClodisForBuild(rootsIn, opts) {
  const o = opts && typeof opts === 'object' ? opts : {};
  let roots = rootsIn;
  const variables = {
    ...(o.variables && typeof o.variables === 'object' ? o.variables : {}),
  };

  if (o.doorPrepareOpts && typeof o.doorPrepareOpts === 'object') {
    roots = applyDoorPrepare(roots, o.doorPrepareOpts);
  }

  const placementKind = String(o.placementKind || o.item?.placementKind || '').trim();
  const hasCornerRole = planTreeHasLayoutRole(roots, 'corner_return');
  const hasGArmRole = detectKitchenUpperGArm(roots, o.item || null);
  let corner = o.corner && typeof o.corner === 'object' ? { ...o.corner } : null;
  const cornerExplicitlyOff = !!(corner && corner.enabled === false);

  // Явный запрет / Г-шкаф (два рукава): никакого corner_return.
  if (cornerExplicitlyOff || hasGArmRole) {
    corner = null;
  } else if (!corner && isCornerPlacementKind(placementKind)) {
    // Как room place: kind kitchen_base_corner достаточно (дерево с приставкой опционально).
    corner = {
      widthMm: o.widthMm,
      item: o.item || null,
      normalizeTree: true,
    };
  } else if (!corner && hasCornerRole && !placementKind) {
    // Админ без kind на карточке: дерево с приставкой = угол (legacy preview).
    corner = {
      widthMm: o.widthMm,
      item: o.item || null,
      normalizeTree: true,
    };
  } else if (corner && !isCornerPlacementKind(placementKind) && placementKind) {
    // Kind = прямой НМ, а снаружи передали corner — игнор.
    if (placementKind === 'kitchen_base' || placementKind === 'kitchen_base_gola') {
      corner = null;
    }
  }

  // Г-крыло: без corner_return_*, но v:corner_g_* обязательны (иначе оболочка 0×H×0 → огрызок).
  if (hasGArmRole) {
    const fromItem =
      (o.item?.clodisVariables && typeof o.item.clodisVariables === 'object'
        ? o.item.clodisVariables
        : null) ||
      (o.item?.data?.clodisVariables && typeof o.item.data.clodisVariables === 'object'
        ? o.item.data.clodisVariables
        : null) ||
      {};
    const arm = Math.round(
      Number(variables.corner_g_arm_mm) ||
        Number(fromItem.corner_g_arm_mm) ||
        Number(o.widthMm) ||
        600
    );
    const dA = Math.round(
      Number(variables.corner_g_depth_a_mm) ||
        Number(fromItem.corner_g_depth_a_mm) ||
        300
    );
    const dB = Math.round(
      Number(variables.corner_g_depth_b_mm) ||
        Number(fromItem.corner_g_depth_b_mm) ||
        dA ||
        300
    );
    let stub = Math.round(
      Number(variables.corner_g_stub_mm) || Number(fromItem.corner_g_stub_mm) || 0
    );
    if (!(stub > 0)) stub = Math.max(50, arm - dA);
    variables.corner_g_arm_mm = arm;
    variables.corner_g_depth_a_mm = dA;
    variables.corner_g_depth_b_mm = dB;
    variables.corner_g_stub_mm = stub;
    variables.h_bottom = 0;
    variables.h_top = 0;
    if (!Number.isFinite(Number(variables.facade_thickness_mm))) {
      variables.facade_thickness_mm = 16;
    }
    try {
      const buildG =
        typeof window !== 'undefined' ? window.__cldBuildUpperGReturnVars : null;
      if (typeof buildG === 'function') {
        Object.assign(variables, buildG(arm, dA, dB));
        variables.h_bottom = 0;
        variables.h_top = 0;
      }
    } catch (_) {}
  }

  if (corner) {
    try {
      const widthMm = Math.max(
        0,
        Math.round(Number(corner.widthMm) || Number(o.widthMm) || 1050)
      );
      const item = corner.item || o.item || null;
      const isWallCorner =
        String(placementKind || '').trim() === 'kitchen_wall_corner';
      // НМУ: clear/rear из ctx. ВМУ: всегда clear=0 и wallGap=0 ДО расчёта
      // inset/return_pos — иначе свес столешки (600−40−D) даёт inset=210,
      // а обнуление только wall_gap оставляет корпус не в углу.
      let clearMm;
      let wallGapMm;
      if (isWallCorner) {
        clearMm = 0;
        wallGapMm = 0;
      } else {
        const clearRaw = Math.round(Number(corner.clearMm));
        clearMm =
          Number.isFinite(clearRaw) && clearRaw >= 0 ? clearRaw : 10;
        const gapRaw = Math.round(Number(corner.wallGapMm));
        wallGapMm =
          Number.isFinite(gapRaw) && gapRaw >= 0 ? gapRaw : clearMm;
      }
      // НМУ: return = D пола (project). ВМУ: return = D соседа-навеса (depth карточки / 350).
      let returnMm = corner.returnMm;
      if (isWallCorner && (!(Number(returnMm) > 0) || Number(returnMm) >= 460)) {
        const fromItem = Math.round(
          Number(item?.depth) || Number(item?.data?.depth) || 0
        );
        returnMm = fromItem > 0 ? fromItem : 350;
      }
      const cornerVars = resolveKitchenCornerVarsForCatalogCard({
        widthMm,
        returnMm,
        clearMm,
        wallGapMm,
        atStart: corner.atStart,
        item,
      });
      if (cornerVars && typeof cornerVars === 'object') {
        Object.assign(variables, cornerVars);
      } else {
        Object.assign(
          variables,
          buildKitchenCornerReturnVars(
            widthMm,
            corner.atStart === true,
            returnMm,
            clearMm,
            wallGapMm
          )
        );
      }
      // Оболочка слота всегда 40 (лицевая планка), и у НМУ, и у ВМУ.
      // D соседа — только в corner_return_mm (ширина приставки), не в depth_mm.
      if (!(Number(variables.corner_return_depth_mm) > 0)) {
        variables.corner_return_depth_mm = 40;
      }
      if (isWallCorner) {
        variables.corner_return_depth_mm = 40;
        variables.h_bottom = 0;
        variables.side_wall_clearance_mm = 0;
        variables.corner_return_wall_gap_mm = 0;
      }
      // SKU приставки L/R — отдельно, после приёмки уголка в админке (не flip в коде).
    } catch (_) {}
  }

  const kn =
    o.kitchenNormalize && typeof o.kitchenNormalize === 'object'
      ? { ...o.kitchenNormalize }
      : null;
  const doCornerNorm = !!(corner && corner.normalizeTree !== false);
  // kn.cornerNmu=false / Г-рукав — не затирать cornerNmu=true из doCornerNorm.
  const cornerNmuWanted =
    kn && kn.cornerNmu === false
      ? false
      : hasGArmRole
        ? false
        : doCornerNorm === true;
  // Нормализация опор (ноги → v:h_bottom) для любого кухонного kind;
  // мутации corner_return — только при cornerNmuWanted (см. engine).
  if (doCornerNorm || kn) {
    const plinth =
      Number(kn?.plinthHeightMm) > 0
        ? Number(kn.plinthHeightMm)
        : Number(variables.h_bottom) > 0
          ? Number(variables.h_bottom)
          : undefined;
    normalizeTree(roots, {
      ...(kn || {}),
      plinthHeightMm: plinth,
      cornerNmu: cornerNmuWanted,
    });
  }

  try {
    if (typeof window !== 'undefined' && window.__CLD_DEBUG_PREPARE === true) {
      console.log('[CLD][prepare] sys1', {
        placementKind,
        hasCornerRole,
        corner: !!corner,
        returnPos: variables.corner_return_pos_x,
        corpusSpan: variables.corner_corpus_span_mm,
        h_bottom: variables.h_bottom,
      });
    }
  } catch (_) {}

  return { roots, variables };
}

export function treeHasCornerReturn(roots) {
  return planTreeHasLayoutRole(roots, 'corner_return');
}

if (typeof window !== 'undefined') {
  window.__cldPrepareClodisForBuild = {
    prepareClodisForBuild,
    treeHasCornerReturn,
    isCornerPlacementKind,
  };
}
