/**
 * STEP 3A/3D: parametric side-panel overlay (16 mm) + own worktop X extend.
 * Depth: auto (= корпус) | custom (mm); depthOffsetMm — сдвиг назад от передней
 * плоскости корпуса (0 = вровень с передом корпуса). Корпус не двигаем.
 * Mutates Clodis roots only during prepare/build — not a second settings system.
 * Does not touch customZoneWidthsMm / balancer / neighbors.
 */

import { KITCHEN_SIDE_PANEL_OVERLAY_THICKNESS_MM } from './kitchen-side-panels-clearance.js?v=20261031-side2v';

export const SIDE_PANEL_OVERLAY_ID_LEFT = 'cld_side_panel_overlay_left';
export const SIDE_PANEL_OVERLAY_ID_RIGHT = 'cld_side_panel_overlay_right';
export const SIDE_PANEL_OVERLAY_NAME_LEFT = 'SidePanelOverlayLeft';
export const SIDE_PANEL_OVERLAY_NAME_RIGHT = 'SidePanelOverlayRight';

const OVERLAY_MM = KITCHEN_SIDE_PANEL_OVERLAY_THICKNESS_MM;

/**
 * @param {object|object[]|null} roots
 * @param {(n: object, ancestors: object[]) => void} fn
 */
function walkTree(roots, fn) {
  const list = Array.isArray(roots) ? roots : roots ? [roots] : [];
  const walk = (n, anc) => {
    if (!n || typeof n !== 'object') return;
    fn(n, anc);
    const next = anc.concat(n);
    if (Array.isArray(n.children)) n.children.forEach((ch) => walk(ch, next));
    const tt = n.spec && n.spec.template_tree;
    if (Array.isArray(tt)) tt.forEach((ch) => walk(ch, next));
  };
  list.forEach((n) => walk(n, []));
}

function isOverlayNode(n) {
  if (!n || typeof n !== 'object') return false;
  const id = String(n.id || '');
  if (id === SIDE_PANEL_OVERLAY_ID_LEFT || id === SIDE_PANEL_OVERLAY_ID_RIGHT) return true;
  if (n.cldSidePanelOverlay === true) return true;
  const name = String(n.name || '');
  return name === SIDE_PANEL_OVERLAY_NAME_LEFT || name === SIDE_PANEL_OVERLAY_NAME_RIGHT;
}

function isWorktopModule(n) {
  if (!n || typeof n !== 'object') return false;
  const et = String(n.spec?.element_type || '').toLowerCase();
  const lr = String(n.layout_role || n.layoutRole || '').toLowerCase();
  const name = String(n.name || '');
  if (et === 'catalog_53') return true;
  if (lr === 'top') return true;
  if (/столеш/i.test(name)) return true;
  return false;
}

function isCorpusModule(n) {
  if (!n || typeof n !== 'object') return false;
  const lr = String(n.layout_role || n.layoutRole || '').toLowerCase();
  if (lr === 'corpus') return true;
  const et = String(n.spec?.element_type || '').toLowerCase();
  if (et === 'catalog_45' || et === 'catalog_47') return true;
  return /стол рабочий|корпус/i.test(String(n.name || ''));
}

function findCabinetRoot(roots) {
  let found = null;
  walkTree(roots, (n) => {
    if (found) return;
    const lr = String(n.layout_role || n.layoutRole || '').toLowerCase();
    if (lr === 'cabinet_root' || (n.type === 'section' && Array.isArray(n.children))) {
      found = n;
    }
  });
  return found;
}

/**
 * Материал накладки = фасадный канал того же модуля (не корпус).
 * Канон комнаты: material.group g2/g3 → ClodisBuilder.cldFacadeMaterialGroup /
 * step5DecorChannel=outside → refreshFurnitureDecors берёт
 * furnitureRoot.step5ModuleOutside ?? selection.outside (тот же декор, что у фасада).
 * Цвет в sidePanels не пишем.
 */
function resolveOverlayFacadeMaterial(roots) {
  let fromFacadeBoard = null;
  walkTree(roots, (n) => {
    if (fromFacadeBoard) return;
    if (isOverlayNode(n)) return;
    const g = String(n.spec?.material?.group || n.material_group || '').toLowerCase();
    if (g !== 'g2' && g !== 'g3') return;
    if (!n.spec?.material) return;
    try {
      fromFacadeBoard = JSON.parse(JSON.stringify(n.spec.material));
    } catch (_) {
      fromFacadeBoard = { ...n.spec.material };
    }
  });
  if (fromFacadeBoard && typeof fromFacadeBoard === 'object') {
    // Накладка 16 мм → группа фасадов 16 (толщина как OVERLAY_MM; геометрию size не трогаем).
    fromFacadeBoard.group = 'g3';
    if (!fromFacadeBoard.key) fromFacadeBoard.key = 'material_2';
    return fromFacadeBoard;
  }
  return {
    group: 'g3',
    key: 'material_2',
    rotated: false,
    fixed: false,
  };
}

function stripOverlayNodes(roots) {
  walkTree(roots, (n) => {
    if (!Array.isArray(n.children) || !n.children.length) return;
    n.children = n.children.filter((ch) => !isOverlayNode(ch));
  });
}

function resetWorktopToCell(roots) {
  walkTree(roots, (n) => {
    if (!isWorktopModule(n)) return;
    n.size = n.size && typeof n.size === 'object' ? { ...n.size } : {};
    n.pos = n.pos && typeof n.pos === 'object' ? { ...n.pos } : {};
    n.size.x = 's:x';
    n.pos.x = 0;
    delete n.__cldSidePanelWorktopExtended;
  });
}

function extendWorktop(roots, leftOn, rightOn) {
  const addL = leftOn ? OVERLAY_MM : 0;
  const addR = rightOn ? OVERLAY_MM : 0;
  if (!(addL || addR)) return;
  walkTree(roots, (n) => {
    if (!isWorktopModule(n)) return;
    n.size = n.size && typeof n.size === 'object' ? { ...n.size } : {};
    n.pos = n.pos && typeof n.pos === 'object' ? { ...n.pos } : {};
    // Только X: передний/задний свес (z / pos.z) не трогаем (STEP 3D).
    n.size.x = `s:x+${addL + addR}`;
    n.pos.x = addL ? -addL : 0;
    n.__cldSidePanelWorktopExtended = { leftMm: addL, rightMm: addR };
  });
}

function resolveCorpusBand(roots) {
  let corpus = null;
  walkTree(roots, (n) => {
    if (!corpus && isCorpusModule(n)) corpus = n;
  });
  const sizeY =
    corpus?.size?.y != null
      ? corpus.size.y
      : 's:y-v:h_bottom-v:h_top-v:tech_zone_mm';
  const posY = corpus?.pos?.y != null ? corpus.pos.y : 'v:h_bottom';
  const sizeZ = corpus?.size?.z != null ? corpus.size.z : 's:z';
  return { sizeY, posY, sizeZ };
}

/**
 * Канон столешки НМ (карточка): size.z=600, pos.z=s:z+40, pivot.z=+1
 * → накрытие по Z от (s:z+40−sizeZ) до (s:z+40).
 * Макс. уход накладки назад от переда корпуса: sizeZ − frontOverhang (=560).
 * Z столешки не меняем.
 * @param {object|object[]|null} roots
 */
export function resolveWorktopOverlayZCoverMm(roots) {
  let wt = null;
  walkTree(roots, (n) => {
    if (!wt && isWorktopModule(n)) wt = n;
  });
  if (!wt) {
    return { ok: false, reason: 'worktop_not_found' };
  }
  const sizeZ = Math.round(Number(wt.size?.z));
  if (!(sizeZ > 0)) {
    return { ok: false, reason: 'worktop_size_z_not_numeric', sizeZ: wt.size?.z };
  }
  const pivotZ = Number(wt.pivot?.z);
  const posZ = String(wt.pos?.z ?? '');
  // Ожидаем pivot +1 и pos вида s:z+40 (передний свес 40).
  const frontOverhangMatch = posZ.match(/s\s*:\s*z\s*\+\s*(\d+)/i);
  if (!(pivotZ > 0) || !frontOverhangMatch) {
    return {
      ok: false,
      reason: 'worktop_z_layout_unsupported',
      pivotZ,
      posZ,
      message:
        'Столешка не в каноне pos.z=s:z+N / pivot.z=+1 — нельзя безопасно ограничить глубину накладки без смены её Z.',
    };
  }
  const frontOverhangMm = Math.round(Number(frontOverhangMatch[1]) || 0);
  const maxBackFromCarcassFrontMm = sizeZ - frontOverhangMm;
  if (!(maxBackFromCarcassFrontMm > 0)) {
    return { ok: false, reason: 'worktop_cover_non_positive', sizeZ, frontOverhangMm };
  }
  return {
    ok: true,
    worktopDepthMm: sizeZ,
    frontOverhangMm,
    maxBackFromCarcassFrontMm,
  };
}

/**
 * План глубины одной стороны.
 * Координаты: корпус pos.z=0 pivot.z=-1 → перед = s:z.
 * offsetMm>0 — сдвиг накладки назад (перед накладки = s:z − offset).
 * @param {object|null|undefined} sideCfg
 * @param {{ sizeZ: unknown }} band
 * @param {{ ok: boolean, maxBackFromCarcassFrontMm?: number, reason?: string }|null} cover
 * @param {number} carcassDepthMm
 */
function _depthExceedsCoverMessage(cover, maxBack) {
  if (cover?.noWorktop) {
    return (
      'Накладка выходит за глубину корпуса (maxBack=' +
      maxBack +
      ' мм). У навесных нет столешницы — ограничиваем корпусом.'
    );
  }
  return (
    'custom depth+offset выходит за Z-накрытие столешницы (maxBack=' +
    maxBack +
    ' мм); геометрию столешки не меняем.'
  );
}

function resolveSideDepthPlan(sideCfg, band, cover, carcassDepthMm) {
  const depthMode =
    String(sideCfg?.depthMode || 'auto')
      .trim()
      .toLowerCase() === 'custom'
      ? 'custom'
      : 'auto';
  const offsetMm = Math.max(0, Math.round(Number(sideCfg?.depthOffsetMm) || 0));
  const exceedReason = cover?.noWorktop ? 'overlay_exceeds_carcass' : 'overlay_exceeds_worktop';

  const applyAuto = () => {
    // auto: size.z = глубина корпуса; pos.z = −offset (перед = s:z − offset).
    if (offsetMm > 0) {
      const carcassD = Math.round(Number(carcassDepthMm) || 0);
      if (!(carcassD > 0)) {
        return {
          ok: false,
          reason: 'carcass_depth_unknown_for_offset',
          depthMode: 'auto',
          offsetMm,
        };
      }
      if (!cover?.ok) {
        return {
          ok: false,
          reason: cover?.reason || 'worktop_cover_unknown',
          depthMode: 'auto',
          offsetMm,
          message: cover?.message,
        };
      }
      if (carcassD + offsetMm > cover.maxBackFromCarcassFrontMm) {
        return {
          ok: false,
          reason: exceedReason,
          depthMode: 'auto',
          depthMm: carcassD,
          offsetMm,
          maxBackFromCarcassFrontMm: cover.maxBackFromCarcassFrontMm,
          message: cover?.noWorktop
            ? 'Накладка с смещением назад выходит за глубину корпуса.'
            : 'Накладка с смещением назад выходит за Z-накрытие столешницы; Z столешки не меняем.',
        };
      }
      return {
        ok: true,
        depthMode: 'auto',
        sizeZ: band.sizeZ,
        posZ: -offsetMm,
        depthMm: carcassD,
        offsetMm,
      };
    }
    return {
      ok: true,
      depthMode: 'auto',
      sizeZ: band.sizeZ,
      posZ: 0,
      depthMm: null,
      offsetMm: 0,
    };
  };

  if (depthMode !== 'custom') return applyAuto();

  const depthMm = Math.round(Number(sideCfg?.depthMm) || 0);
  if (!(depthMm > 0)) return applyAuto();

  if (!cover?.ok) {
    return {
      ok: false,
      reason: cover?.reason || 'worktop_cover_unknown',
      depthMode: 'custom',
      depthMm,
      offsetMm,
      message: cover?.message,
    };
  }
  if (depthMm + offsetMm > cover.maxBackFromCarcassFrontMm) {
    return {
      ok: false,
      reason: exceedReason,
      depthMode: 'custom',
      depthMm,
      offsetMm,
      maxBackFromCarcassFrontMm: cover.maxBackFromCarcassFrontMm,
      message: _depthExceedsCoverMessage(cover, cover.maxBackFromCarcassFrontMm),
    };
  }

  // pivot.z=-1: зад накладки в pos.z; перед = pos.z + depth = s:z − offset
  // → pos.z = s:z − depth − offset
  const backFromFront = depthMm + offsetMm;
  return {
    ok: true,
    depthMode: 'custom',
    sizeZ: depthMm,
    posZ: backFromFront === 0 ? 0 : `s:z-${backFromFront}`,
    depthMm,
    offsetMm,
  };
}

function makeOverlayWall(side, band, material, depthPlan) {
  const isLeft = side === 'left';
  return {
    type: 'wall',
    id: isLeft ? SIDE_PANEL_OVERLAY_ID_LEFT : SIDE_PANEL_OVERLAY_ID_RIGHT,
    name: isLeft ? SIDE_PANEL_OVERLAY_NAME_LEFT : SIDE_PANEL_OVERLAY_NAME_RIGHT,
    active: 1,
    visible: 1,
    cldSidePanelOverlay: true,
    cldSidePanelOverlaySide: side,
    cldSidePanelOverlayDepthMode: depthPlan.depthMode,
    cldSidePanelOverlayDepthMm: depthPlan.depthMm,
    cldSidePanelOverlayOffsetMm: depthPlan.offsetMm || 0,
    size: {
      x: OVERLAY_MM,
      y: band.sizeY,
      z: depthPlan.sizeZ,
    },
    pos: {
      x: isLeft ? -OVERLAY_MM : 's:x',
      y: band.posY,
      z: depthPlan.posZ,
    },
    pivot: {
      x: -1,
      y: -1,
      z: -1,
    },
    rot: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    spec: {
      orientation: 'v',
      side,
      detailTypeId: isLeft ? 'vertical_left' : 'vertical_right',
      material: material,
    },
    children: [],
  };
}

/**
 * Apply/remove overlay nodes from Clodis roots based on sidePanels modes.
 * @param {object|object[]|null} roots
 * @param {{
 *   sidePanels?: object|null,
 *   enabledSides?: { left?: boolean, right?: boolean },
 *   carcassDepthMm?: number|null,
 *   skipWorktopCover?: boolean
 * }} [opts]
 * @returns {object}
 */
export function applyKitchenSidePanelOverlayToClodisRoots(roots, opts = {}) {
  const sp = opts?.sidePanels && typeof opts.sidePanels === 'object' ? opts.sidePanels : null;
  const en = opts?.enabledSides && typeof opts.enabledSides === 'object' ? opts.enabledSides : null;
  const leftOn =
    en?.left === true ||
    (en?.left !== false && String(sp?.left?.mode || '').toLowerCase() === 'overlay');
  const rightOn =
    en?.right === true ||
    (en?.right !== false && String(sp?.right?.mode || '').toLowerCase() === 'overlay');
  const carcassDepthMm = Math.round(Number(opts?.carcassDepthMm) || 0);

  stripOverlayNodes(roots);
  // НМ: сброс X столешки перед возможным extend. Навесные — no-op (столешки нет).
  resetWorktopToCell(roots);

  if (!leftOn && !rightOn) {
    return { left: false, right: false, overlayMm: OVERLAY_MM };
  }

  const cabinet = findCabinetRoot(roots);
  if (!cabinet) {
    return { left: false, right: false, overlayMm: OVERLAY_MM, reason: 'no_cabinet_root' };
  }
  if (!Array.isArray(cabinet.children)) cabinet.children = [];

  const band = resolveCorpusBand(roots);
  // Навесные (НШ1/НШ2): нет столешницы — не применять worktop-cover / extend.
  // Лимит глубины+смещения = глубина корпуса (если известна).
  // Авто: если в дереве нет столешки (worktop_not_found) — тот же режим
  // (защита от старого FM/_deps без явного skipWorktopCover).
  const coverRaw = resolveWorktopOverlayZCoverMm(roots);
  const skipWorktopCover =
    opts?.skipWorktopCover === true ||
    (!coverRaw.ok && coverRaw.reason === 'worktop_not_found');
  const cover = skipWorktopCover
    ? {
        ok: true,
        noWorktop: true,
        maxBackFromCarcassFrontMm:
          carcassDepthMm > 0 ? carcassDepthMm : Number.POSITIVE_INFINITY,
      }
    : coverRaw;
  const sides = {};
  let leftBuilt = false;
  let rightBuilt = false;

  if (leftOn) {
    const plan = resolveSideDepthPlan(sp?.left, band, cover, carcassDepthMm);
    sides.left = plan;
    if (plan.ok) {
      cabinet.children.push(
        makeOverlayWall('left', band, resolveOverlayFacadeMaterial(roots), plan)
      );
      leftBuilt = true;
    }
  }
  if (rightOn) {
    const plan = resolveSideDepthPlan(sp?.right, band, cover, carcassDepthMm);
    sides.right = plan;
    if (plan.ok) {
      cabinet.children.push(
        makeOverlayWall('right', band, resolveOverlayFacadeMaterial(roots), plan)
      );
      rightBuilt = true;
    }
  }

  if (leftBuilt || rightBuilt) {
    if (!skipWorktopCover) {
      extendWorktop(roots, leftBuilt, rightBuilt);
    }
  }

  const blocked =
    (leftOn && sides.left && !sides.left.ok) || (rightOn && sides.right && !sides.right.ok);

  return {
    left: leftBuilt,
    right: rightBuilt,
    overlayMm: OVERLAY_MM,
    sides,
    worktopCover: cover,
    blocked: !!blocked,
    reason: blocked
      ? sides.left && !sides.left.ok
        ? sides.left.reason
        : sides.right?.reason
      : undefined,
  };
}
