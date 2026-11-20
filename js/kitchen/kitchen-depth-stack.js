/**
 * Одна плоскость стены для ВСЕХ модулей = пивот секции (не bbox меша комнаты!).
 *
 * Якорь ряда по глубине = ПЕРЕД корпуса (не зад, не «от столешки» как отдельная ось):
 *   стена → … → ПЕРЕД корпуса = W + (Dwt − 40)  (= 560 при Dwt=600)
 *   глубина корпуса D (550/510/460) не двигает перед — меняется только зазор сзади (560−D)
 *   столешка всегда вперёд от переда: торец = перед + 40 (= W+Dwt)
 * Пенал: зад = W, D = Dwt−40 → перед = тот же 560
 * НШ1: зад = W, D≈350
 */
import { state } from '../utils/state.js';
import {
  computeFurnitureCorpusLayoutWorldBBoxNoAo,
  withFurnitureDoorSwingsClosedForMeasure,
} from '../furniture/furniture-bbox.js?v=20261013-room-apply';
import {
  isKitchenBaseGroup,
  getKitchenBaseProfileIdFromGroup,
} from './kitchen-base-engine.js?v=20261104-talltopd1';
import {
  isKitchenTallPlacementKind,
  isKitchenWallMidPlacementKind,
  isKitchenWallTopPlacementKind,
} from '../sections/vertical-layout.js?v=20261104-talltopd1';
import {
  syncKitchenRunOverlaysOnWall,
  kitchenIntoRoomSign,
} from './kitchen-run-overlays.js?v=20261106-run2';

function profileIdFromGroupOrUd(groupOrUd) {
  const ud = groupOrUd?.userData || groupOrUd || {};
  return (
    getKitchenBaseProfileIdFromGroup(groupOrUd?.userData ? groupOrUd : { userData: ud }) ||
    String(ud.__placementKindProfileId || ud.placementKind || '').trim()
  );
}

/** Пенал: без стека столешки (зад = стена). НМ не трогаем. */
function isKitchenTallDepthGroup(groupOrUd) {
  const ud = groupOrUd?.userData || groupOrUd || {};
  if (String(ud.productKind || '') === 'kitchen_tall') return true;
  if (ud.__kitchenTall && typeof ud.__kitchenTall === 'object') return true;
  const profile = profileIdFromGroupOrUd(groupOrUd);
  if (isKitchenTallPlacementKind(profile)) return true;
  // hasWorktop:false только вместе с профилем пенала (не путать с НМ).
  if (ud.hasWorktop === false && isKitchenTallPlacementKind(profile)) return true;
  return false;
}

/** НШ1/НШ2: зад = плоскость ряда (rear=0), D≈350 — не стек столешки НМ. */
function isKitchenWallHungDepthGroup(groupOrUd) {
  const ud = groupOrUd?.userData || groupOrUd || {};
  const pk = String(ud.productKind || '');
  if (pk === 'kitchen_wall_mid' || pk === 'kitchen_wall_top') return true;
  const profile = profileIdFromGroupOrUd(groupOrUd);
  return (
    isKitchenWallMidPlacementKind(profile) || isKitchenWallTopPlacementKind(profile)
  );
}

/** Flush к плоскости ряда (пенал / НШ): rear=0, без front-setback столешки. */
function isKitchenFlushWallDepthGroup(groupOrUd) {
  return isKitchenTallDepthGroup(groupOrUd) || isKitchenWallHungDepthGroup(groupOrUd);
}

/** Плоскость стены ряда = пивот секции в МИРЕ (bbox мебели тоже world). */
function getSectionWallWorldCoord(section, wallName) {
  if (!section?.group) return null;
  const w = String(wallName || section.wallName || 'back').trim().toLowerCase();
  const THREE = THREE_REF();
  let wx = Number(section.group.position?.x);
  let wz = Number(section.group.position?.z);
  try {
    if (THREE && typeof section.group.getWorldPosition === 'function') {
      const wp = new THREE.Vector3();
      section.group.getWorldPosition(wp);
      wx = wp.x;
      wz = wp.z;
    }
  } catch (_) {}
  if (w === 'back' || w === 'front') {
    return Number.isFinite(wz) ? wz : null;
  }
  if (w === 'left' || w === 'right') {
    return Number.isFinite(wx) ? wx : null;
  }
  return Number.isFinite(wz) ? wz : null;
}

function km() {
  return typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
}

function THREE_REF() {
  return typeof window !== 'undefined' ? window.THREE : null;
}

/** @returns {{
 *   worktopDepthMm: number,
 *   carcassDepthMm: number,
 *   frontSetbackToCarcassMm: number,
 *   rearOverhangMm: number,
 * }} */
export function resolveKitchenDepthStack(ud) {
  const api = km();
  let worktopDepthMm =
    Number(ud?.__kitchenWorktopDepthMm) ||
    (api && typeof api.getProjectWorktopDepthMm === 'function'
      ? Number(api.getProjectWorktopDepthMm())
      : 0) ||
    600;

  // Пенал ДО clamp НМ (max 550): каталог 560 = линия переда корпуса НМ.
  if (isKitchenTallDepthGroup(ud)) {
    let tallD = Number(ud?.__kitchenCarcassDepthMm) || 0;
    const customD = Number(ud?.customDepthMm) || 0;
    const initZ = Number(ud?.__initialSectionSizeMm?.z) || 0;
    if (!(tallD > 0) && customD > 0 && customD < worktopDepthMm) tallD = customD;
    if (!(tallD > 0) && initZ > 0 && initZ < worktopDepthMm) tallD = initZ;
    if (api && typeof api.resolveTallCarcassDepthMm === 'function') {
      const td = api.resolveTallCarcassDepthMm({
        worktopDepthMm,
        preferredCarcassDepthMm: tallD > 0 ? tallD : undefined,
        carcassDepthMm: tallD > 0 ? tallD : undefined,
      });
      if (td && td.ok && Number(td.carcassDepthMm) > 0) {
        tallD = Number(td.carcassDepthMm);
        worktopDepthMm = Number(td.worktopDepthMm) || worktopDepthMm;
      }
    }
    if (!(tallD > 0)) tallD = Math.round(worktopDepthMm - 40) || 560;
    // worktopDepthMm = проектная столешка (600): для меры свеса +40, НЕ глубина пенала.
    return {
      worktopDepthMm: Math.round(worktopDepthMm),
      carcassDepthMm: Math.round(tallD),
      frontSetbackToCarcassMm: 0,
      rearOverhangMm: 0,
    };
  }

  // НШ1/НШ2: rear=0. TOP может быть shallow(~350) или deep(~560 как пенал).
  if (isKitchenWallHungDepthGroup(ud)) {
    const pk = String(ud?.productKind || '');
    const isTop =
      pk === 'kitchen_wall_top' ||
      String(ud?.__zoneSlotRole || '').toLowerCase() === 'top' ||
      String(ud?.__kitchenProfileId || '').trim() === 'kitchen_wall_top';
    let wallD = Number(ud?.__kitchenCarcassDepthMm) || 0;
    const customD = Number(ud?.customDepthMm) || 0;
    const initZ = Number(ud?.__initialSectionSizeMm?.z) || 0;
    const topMode = String(ud?.__kitchenTopDepthMode || '').trim().toLowerCase();
    const topCustom = Number(ud?.__kitchenTopCustomDepthMm) || 0;
    if (isTop && (ud?.__kitchenTopDepthUserLocked === true || topMode === 'custom')) {
      if (topCustom >= 200 && topCustom <= 700) wallD = topCustom;
      else if (customD >= 200 && customD <= 700) wallD = customD;
    } else if (isTop && topMode === 'deep') {
      // Глубокая антресоль: линия переда пенала (Dwt−40).
      if (api && typeof api.resolveTallCarcassDepthMm === 'function') {
        try {
          const td = api.resolveTallCarcassDepthMm({
            worktopDepthMm,
            preferredCarcassDepthMm: wallD > 0 ? wallD : undefined,
          });
          if (td?.ok && Number(td.carcassDepthMm) > 0) {
            wallD = Math.round(Number(td.carcassDepthMm));
          }
        } catch (_) {}
      }
      if (!(wallD > 0)) wallD = Math.round(worktopDepthMm - 40) || 560;
    } else {
      // НШ1 ≤450; НШ2 ≤700 (иначе карандаш 55 см отбрасывался → снова 350).
      const maxCustom = isTop ? 700 : 450;
      if (!(wallD > 0) && customD > 0 && customD <= maxCustom) wallD = customD;
      if (!(wallD > 0) && initZ > 0 && initZ <= maxCustom) wallD = initZ;
      if (!(wallD > 0) && api && api.getProfile) {
        try {
          const p = api.getProfile();
          const v = p && p.wall && p.wall.carcassDepthMm && p.wall.carcassDepthMm.value;
          if (Number(v) > 0) wallD = Math.round(Number(v));
        } catch (_) {}
      }
      if (!(wallD > 0)) wallD = 350;
      // Deep stamp без userLocked: до 700 (над пеналом).
      if (isTop && topMode === 'deep' && customD >= 400 && customD <= 700) {
        wallD = customD;
      }
    }
    return {
      worktopDepthMm: Math.round(worktopDepthMm),
      carcassDepthMm: Math.round(wallD),
      frontSetbackToCarcassMm: 0,
      rearOverhangMm: 0,
    };
  }

  // НМ (1.31 глубины ок + карандаш модуля): customDepthMm / stamp на группе
  // важнее project. Иначе align после карандаша затирает 460→550.
  // Перед ряда всегда W+(Dwt−40); D меняет зазор сзади.
  const customD = Number(ud?.customDepthMm) || 0;
  const initZ = Number(ud?.__initialSectionSizeMm?.z) || 0;
  let preferred = 0;
  // customDepth≈600 = столешница, не корпус
  if (customD > 0 && customD <= worktopDepthMm - 50) preferred = customD;
  if (!(preferred > 0)) preferred = Number(ud?.__kitchenCarcassDepthMm) || 0;
  if (!(preferred > 0) && initZ > 0 && initZ <= worktopDepthMm - 50) preferred = initZ;
  if (!(preferred > 0) && api && typeof api.getProjectBaseCarcassDepthMm === 'function') {
    preferred = Number(api.getProjectBaseCarcassDepthMm()) || 550;
  }
  if (!(preferred > 0)) preferred = 550;

  let carcassDepthMm = preferred;
  let frontSetback = 40;
  let rearOverhang = 10;

  if (api && typeof api.resolveBaseCarcassDepthMm === 'function') {
    const d = api.resolveBaseCarcassDepthMm({
      worktopDepthMm,
      preferredCarcassDepthMm: preferred,
    });
    if (d && d.ok) {
      worktopDepthMm = d.worktopDepthMm;
      carcassDepthMm = d.carcassDepthMm;
      frontSetback = d.frontSetbackToCarcassMm;
      rearOverhang = d.rearOverhangMm;
    }
  }

  if (!(frontSetback > 0)) frontSetback = 40;
  if (!(rearOverhang > 0)) {
    rearOverhang = Math.max(10, Math.round(worktopDepthMm - frontSetback - carcassDepthMm));
  }

  return {
    worktopDepthMm: Math.round(worktopDepthMm),
    carcassDepthMm: Math.round(carcassDepthMm),
    frontSetbackToCarcassMm: Math.round(frontSetback),
    rearOverhangMm: Math.round(rearOverhang),
  };
}

function stampStackOnUd(ud, stack) {
  if (!ud || !stack) return;
  const tall = isKitchenFlushWallDepthGroup(ud);
  ud.__kitchenCarcassDepthMm = stack.carcassDepthMm;
  ud.__kitchenFrontSetbackMm = stack.frontSetbackToCarcassMm;
  ud.__kitchenRearOverhangMm = stack.rearOverhangMm;
  if (tall) {
    ud.hasWorktop = false;
    ud.__kitchenRearOverhangMm = 0;
    ud.__kitchenFrontSetbackMm = 0;
    ud.customDepthMm = stack.carcassDepthMm;
    // Не писать carcass в __kitchenWorktopDepthMm — UI/applyWorktop путали пенал с НМ.
    if (!(Number(ud.__kitchenWorktopDepthMm) > 100)) {
      ud.__kitchenWorktopDepthMm = stack.worktopDepthMm;
    }
    return;
  }
  ud.__kitchenWorktopDepthMm = stack.worktopDepthMm;
  if (!(Number(ud.customDepthMm) > 0) || Number(ud.customDepthMm) > stack.worktopDepthMm - 50) {
    ud.customDepthMm = stack.carcassDepthMm;
  }
}

function corpusBBox(group) {
  return withFurnitureDoorSwingsClosedForMeasure(group, () =>
    computeFurnitureCorpusLayoutWorldBBoxNoAo(group, { forDepthScale: true })
  );
}

function depthCoordFromBBox(bb, wallName, which) {
  const w = String(wallName || 'back').trim().toLowerCase();
  if (w === 'back') return which === 'back' ? bb.min.z : bb.max.z;
  if (w === 'front') return which === 'back' ? bb.max.z : bb.min.z;
  if (w === 'left') return which === 'back' ? bb.min.x : bb.max.x;
  if (w === 'right') return which === 'back' ? bb.max.x : bb.min.x;
  return which === 'back' ? bb.min.z : bb.max.z;
}

function shiftGroupAlongDepth(group, wallName, delta) {
  if (!group || !Number.isFinite(delta) || Math.abs(delta) < 0.5) return false;
  const w = String(wallName || 'back').trim().toLowerCase();
  if (w === 'back' || w === 'front') group.position.z += delta;
  else if (w === 'left' || w === 'right') group.position.x += delta;
  else return false;
  group.updateMatrixWorld(true);
  return true;
}

/**
 * Индивидуальные отступы модуля (не путать со стеком столешки
 * __kitchenRearOverhangMm / __kitchenFrontSetbackMm).
 * Меняют только положение; D корпуса не трогают.
 * @returns {{ rearOffsetMm: number, frontOffsetMm: number }}
 */
export function readKitchenModuleOffsetsMm(udOrGroup) {
  const ud = udOrGroup?.userData || udOrGroup || {};
  const rear = Math.round(Number(ud.rearOffsetMm));
  const front = Math.round(Number(ud.frontOffsetMm));
  return {
    rearOffsetMm: Number.isFinite(rear) && rear > 0 ? rear : 0,
    frontOffsetMm: Number.isFinite(front) && front > 0 ? front : 0,
  };
}

/** Записать отступы (default 0). Не меняет геометрию — только stamps. */
export function writeKitchenModuleOffsetsMm(udOrGroup, rearOffsetMm, frontOffsetMm) {
  const ud = udOrGroup?.userData
    ? udOrGroup.userData || (udOrGroup.userData = {})
    : udOrGroup && typeof udOrGroup === 'object'
      ? udOrGroup
      : null;
  if (!ud) return null;
  const rear = Math.round(Number(rearOffsetMm));
  const front = Math.round(Number(frontOffsetMm));
  ud.rearOffsetMm = Number.isFinite(rear) && rear > 0 ? rear : 0;
  ud.frontOffsetMm = Number.isFinite(front) && front > 0 ? front : 0;
  return readKitchenModuleOffsetsMm(ud);
}

/**
 * После канонического depth-stack: сдвиг ряда.
 * rearOffset — от стены в комнату; frontOffset — фасад назад к стене.
 * При фиксированном D оба дают net = rear − front (один rigid shift).
 * Вызывать только один раз после абсолютного place стека — без накопления.
 */
function applyKitchenModuleOffsetsAfterStack(group, wallName, sign) {
  const ud = group?.userData || {};
  const { rearOffsetMm, frontOffsetMm } = readKitchenModuleOffsetsMm(ud);
  if (!(rearOffsetMm > 0) && !(frontOffsetMm > 0)) {
    return { applied: false, rearOffsetMm: 0, frontOffsetMm: 0, deltaMm: 0 };
  }
  const deltaMm = Math.round(rearOffsetMm - frontOffsetMm);
  const delta = sign * deltaMm;
  let moved = false;
  if (Math.abs(delta) >= 0.5) {
    moved = !!shiftGroupAlongDepth(group, wallName, delta);
  }
  return {
    applied: true,
    moved,
    rearOffsetMm,
    frontOffsetMm,
    deltaMm,
  };
}

/**
 * НМ: якорь = ПЕРЕД корпуса на W+(Dwt−40) (=560 при 600). D корпуса не двигает перед.
 * Пенал: зад = W (rear 0) → перед тот же 560 при D=560.
 */
export function enforceKitchenDepthStackOnModule(furnitureGroup, section, wallNameOpt) {
  if (!furnitureGroup || !section) {
    return { ok: false, reason: 'no_group_or_section' };
  }
  const wallName = String(
    wallNameOpt || furnitureGroup.userData?.wallName || section.wallName || 'back'
  )
    .trim()
    .toLowerCase();
  const ud = furnitureGroup.userData || (furnitureGroup.userData = {});
  const tall =
    isKitchenFlushWallDepthGroup(furnitureGroup) || isKitchenFlushWallDepthGroup(ud);
  // Одна плоскость с НМ — только пивот секции.
  const wall = getSectionWallWorldCoord(section, wallName);
  if (!Number.isFinite(Number(wall))) {
    return { ok: false, reason: 'no_wall_coord' };
  }

  const stack = resolveKitchenDepthStack(ud);
  stampStackOnUd(ud, stack);

  const sign = kitchenIntoRoomSign(wallName);
  const frontSetback = Math.max(0, Number(stack.frontSetbackToCarcassMm) || 40);
  stack.frontSetbackToCarcassMm = frontSetback;
  // Плоскость переда ряда: W + Dwt − 40 (не от зада корпуса).
  const worktopFront = Number(wall) + sign * stack.worktopDepthMm;
  const targetCarcassFront = worktopFront - sign * frontSetback;

  furnitureGroup.updateMatrixWorld(true);
  let moved = false;

  // Пенал / НШ1 / НШ2: rearOffsetMm = отступ от стены (DEPTH-3/4).
  const preOffsets = readKitchenModuleOffsetsMm(ud);
  const tallWallOff = tall ? Math.max(0, Math.round(Number(preOffsets.rearOffsetMm) || 0)) : 0;

  if (tall) {
    // Flush: зад = стена + rearOffset (абсолютно, без второго сдвига).
    ud.hasWorktop = false;
    ud.__kitchenRearOverhangMm = 0;
    stack.rearOverhangMm = 0;
    stack.frontSetbackToCarcassMm = 0;
    stampStackOnUd(ud, stack);

    const bbCorpus = corpusBBox(furnitureGroup);
    if (!bbCorpus || bbCorpus.isEmpty()) {
      return { ok: false, reason: 'empty_corpus_bbox', stack, tall: true };
    }
    const targetBack = Number(wall) + sign * tallWallOff;
    const currentBack = depthCoordFromBBox(bbCorpus, wallName, 'back');
    const d2 = targetBack - currentBack;
    if (shiftGroupAlongDepth(furnitureGroup, wallName, d2)) moved = true;

    furnitureGroup.updateMatrixWorld(true);
    const bbSafe = corpusBBox(furnitureGroup);
    if (bbSafe && !bbSafe.isEmpty()) {
      const back2 = depthCoordFromBBox(bbSafe, wallName, 'back');
      // Не ближе стены, чем targetBack (с учётом отступа).
      const pastTarget = (Number(targetBack) - back2) * sign;
      if (pastTarget > 0.5) {
        if (shiftGroupAlongDepth(furnitureGroup, wallName, sign * pastTarget)) moved = true;
      }
    }
  } else {
    // НМ: поставить ПЕРЕД на targetCarcassFront (560). Зазор сзади = следствие D.
    const bb = corpusBBox(furnitureGroup);
    if (!bb || bb.isEmpty()) {
      return { ok: false, reason: 'empty_corpus_bbox', stack };
    }
    const currentFront = depthCoordFromBBox(bb, wallName, 'front');
    const delta = targetCarcassFront - currentFront;
    moved = shiftGroupAlongDepth(furnitureGroup, wallName, delta);
  }

  // НМ: offsets после стека. Пенал/НШ — уже в targetBack (не дублировать rearOffset).
  let offsets = {
    applied: false,
    moved: false,
    rearOffsetMm: preOffsets.rearOffsetMm,
    frontOffsetMm: preOffsets.frontOffsetMm,
    deltaMm: 0,
  };
  if (!tall) {
    offsets = applyKitchenModuleOffsetsAfterStack(furnitureGroup, wallName, sign);
    if (offsets.moved) moved = true;
  } else {
    offsets = {
      applied: tallWallOff > 0 || preOffsets.frontOffsetMm > 0,
      moved: false,
      rearOffsetMm: tallWallOff,
      frontOffsetMm: preOffsets.frontOffsetMm,
      deltaMm: tallWallOff,
    };
  }

  const bb2 = corpusBBox(furnitureGroup);
  const carcassBack = depthCoordFromBBox(bb2, wallName, 'back');
  const carcassFront = depthCoordFromBBox(bb2, wallName, 'front');
  const wallGapMm = Math.round((carcassBack - Number(wall)) * sign);
  const frontSetbackMm = Math.round((worktopFront - carcassFront) * sign);
  const carcassDepthMm = Math.round(Math.abs(carcassFront - carcassBack));
  if (!tall) {
    // Стек столешки ≠ module offsets: в stamp — канонический rear без rear/frontOffset.
    const stackRear = Math.max(
      0,
      wallGapMm - (offsets.rearOffsetMm || 0) + (offsets.frontOffsetMm || 0)
    );
    stack.rearOverhangMm = stackRear;
    stampStackOnUd(ud, stack);
  }

  const result = {
    ok: true,
    moved,
    wallName,
    wallCoord: Number(wall),
    stack,
    tall,
    offsets,
    measured: {
      wallGapMm,
      frontSetbackMm,
      carcassDepthMm,
      worktopDepthMm: stack.worktopDepthMm,
      carcassFront,
      carcassBack,
      worktopFront,
      rearOffsetMm: offsets.rearOffsetMm,
      frontOffsetMm: offsets.frontOffsetMm,
      groupDepthPos:
        wallName === 'left' || wallName === 'right'
          ? furnitureGroup.position.x
          : furnitureGroup.position.z,
    },
  };

  // Только явный debug — иначе НШ/пеналы (tall) заливают консоль десятками тысяч логов.
  if (typeof window !== 'undefined' && window.__CLD_DEBUG_KITCHEN_DEPTH === true) {
    console.log('[KITCHEN-DEPTH] enforce', {
      wall: wallName,
      tall,
      moved,
      wallCoord: result.wallCoord,
      target: {
        rear: stack.rearOverhangMm,
        carcass: stack.carcassDepthMm,
        front: stack.frontSetbackToCarcassMm,
        worktop: stack.worktopDepthMm,
      },
      measured: result.measured,
    });
  }

  return result;
}

export function alignKitchenModuleBackToWall(furnitureGroup, section, wallNameOpt) {
  const r = enforceKitchenDepthStackOnModule(furnitureGroup, section, wallNameOpt);
  return !!(r && r.ok);
}

export function enforceKitchenDepthStackPlacement(furnitureGroup, section, wallNameOpt) {
  return enforceKitchenDepthStackOnModule(furnitureGroup, section, wallNameOpt);
}

function collectKitchenBasesOnWall(wallName) {
  const norm = String(wallName || '').trim().toLowerCase();
  const list = [];
  if (!state.scene) return list;
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (!isKitchenBaseGroup(obj)) return;
    let wn = String(obj.userData?.wallName || '').trim().toLowerCase();
    if (!wn) {
      const sid = obj.userData?.sectionId;
      const sec =
        sid != null && Array.isArray(state.customSections)
          ? state.customSections.find((s) => s && String(s.id) === String(sid))
          : null;
      wn = String(sec?.wallName || '').trim().toLowerCase();
      if (wn) obj.userData.wallName = wn;
    }
    if (wn !== norm) return;
    list.push(obj);
  });
  return list;
}

export function enforceKitchenDepthStackOnAllModules(wallNameOpt) {
  const wall = String(wallNameOpt || '').trim();
  if (!wall) return { ok: false, count: 0, reason: 'no_wall' };
  const modules = collectKitchenBasesOnWall(wall);
  let count = 0;
  const reports = [];
  for (const g of modules) {
    const secId = g.userData?.sectionId;
    const section =
      Array.isArray(state.customSections) &&
      state.customSections.find((s) => String(s?.id) === String(secId));
    if (!section) continue;
    const r = enforceKitchenDepthStackOnModule(g, section, wall);
    if (r?.ok) {
      count += 1;
      reports.push(r.measured);
    }
  }
  let overlays = null;
  try {
    overlays = syncKitchenRunOverlaysOnWall(wall);
  } catch (e) {
    console.warn('[KITCHEN-DEPTH] overlays sync failed', e);
  }
  return { ok: count > 0, count, reports, overlays };
}

function findWorktopFrontOnWall(wallName, sectionId) {
  if (!state.scene) return null;
  const norm = String(wallName || '').trim().toLowerCase();
  const sign = kitchenIntoRoomSign(norm);
  let best = null;
  state.scene.traverse((obj) => {
    if (!obj?.userData?.isKitchenWorktop) return;
    if (String(obj.userData?.kitchenRunOverlayWall || '').toLowerCase() !== norm) return;
    if (sectionId != null && String(obj.userData?.sectionId) !== String(sectionId)) return;
    const dwt = Number(obj.userData?.kitchenDepth?.worktopDepthMm) || 0;
    // центр меша + половина глубины в сторону комнаты = торец
    const alongZ = norm === 'back' || norm === 'front';
    const center = alongZ ? obj.position.z : obj.position.x;
    const half = (dwt > 0 ? dwt : alongZ ? obj.geometry?.parameters?.depth : obj.geometry?.parameters?.width) / 2;
    if (!Number.isFinite(center) || !Number.isFinite(half)) return;
    const front = center + sign * Math.abs(half);
    best = front;
  });
  return best;
}

/**
 * Отчёт только по геометрии. Если столешницы нет — worktopFront = wall + Dwt (цель стека).
 */
export function measureKitchenNmDepthReport(wallNameOpt) {
  const wallFilter = String(wallNameOpt || '').trim().toLowerCase();
  const modules = [];
  if (!state.scene) return { ok: false, modules, reason: 'no_scene' };

  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (!isKitchenBaseGroup(obj)) return;
    const wn = String(obj.userData?.wallName || '').toLowerCase();
    if (wallFilter && wn !== wallFilter) return;

    const secId = obj.userData?.sectionId;
    const section =
      Array.isArray(state.customSections) &&
      state.customSections.find((s) => String(s?.id) === String(secId));
    if (!section) return;

    const tallMod = isKitchenTallDepthGroup(obj);
    const wall = getSectionWallWorldCoord(section, wn);
    if (!Number.isFinite(Number(wall))) return;

    const stack = resolveKitchenDepthStack(obj.userData);
    const sign = kitchenIntoRoomSign(wn);
    const bb = corpusBBox(obj);
    if (!bb || bb.isEmpty()) return;

    const carcassBack = depthCoordFromBBox(bb, wn, 'back');
    const carcassFront = depthCoordFromBBox(bb, wn, 'front');
    const worktopFrontMesh = findWorktopFrontOnWall(wn, secId);
    const worktopFront =
      worktopFrontMesh != null
        ? worktopFrontMesh
        : Number(wall) + sign * stack.worktopDepthMm;

    const wallGapMm = Math.round((carcassBack - Number(wall)) * sign);
    const frontSetbackMm = Math.round((worktopFront - carcassFront) * sign);
    const carcassDepthMm = Math.round(Math.abs(carcassFront - carcassBack));
    const doorFront = (() => {
      const THREE = THREE_REF();
      if (!THREE) return carcassFront;
      obj.updateMatrixWorld(true);
      const full = new THREE.Box3().setFromObject(obj);
      if (full.isEmpty()) return carcassFront;
      return depthCoordFromBBox(full, wn, 'front');
    })();
    const doorProtrusionMm = Math.round((doorFront - carcassFront) * sign);
    const handleProtrusionMm = 0; // ручки в corpus-exclude; отдельный probe позже

    modules.push({
      name: obj.userData?.catalogName || obj.name || '',
      wallName: wn,
      sectionId: secId,
      // цель стека
      target: stack,
      // факт с мешей
      wallGapMm,
      carcassDepthMm,
      frontSetbackCarcassToWorktopMm: frontSetbackMm,
      doorProtrusionBeyondCarcassMm: Math.max(0, doorProtrusionMm),
      handleProtrusionBeyondDoorMm: handleProtrusionMm,
      worktopDepthMm: stack.worktopDepthMm,
      worktopFrontFromMesh: worktopFrontMesh != null,
      ok:
        Math.abs(wallGapMm - stack.rearOverhangMm) <= 1 &&
        Math.abs(frontSetbackMm - stack.frontSetbackToCarcassMm) <= 1,
    });
  });

  return { ok: modules.length > 0, modules };
}

if (typeof window !== 'undefined') {
  window.__cldKitchenDepthStack = {
    resolveKitchenDepthStack,
    enforceKitchenDepthStackOnModule,
    enforceKitchenDepthStackOnAllModules,
    measureKitchenNmDepthReport,
    alignKitchenModuleBackToWall,
    readKitchenModuleOffsetsMm,
    writeKitchenModuleOffsetsMm,
  };
  window.__cldReadKitchenModuleOffsetsMm = readKitchenModuleOffsetsMm;
  window.__cldWriteKitchenModuleOffsetsMm = writeKitchenModuleOffsetsMm;
  window.__cldSetKitchenModuleOffsetsMm = function setKitchenModuleOffsetsMm(
    group,
    rearOffsetMm,
    frontOffsetMm
  ) {
    if (!group?.userData?.isFurniture) {
      return { ok: false, reason: 'not_furniture' };
    }
    writeKitchenModuleOffsetsMm(group, rearOffsetMm, frontOffsetMm);
    const sid = group.userData.sectionId;
    const sec =
      sid != null && Array.isArray(state.customSections)
        ? state.customSections.find((s) => s && String(s.id) === String(sid))
        : null;
    if (!sec) {
      return {
        ok: false,
        reason: 'no_section',
        ...readKitchenModuleOffsetsMm(group),
        enforced: false,
      };
    }
    const wall = String(group.userData.wallName || sec.wallName || 'back')
      .trim()
      .toLowerCase();
    let enforced = null;
    try {
      enforced = enforceKitchenDepthStackOnModule(group, sec, wall);
    } catch (e) {
      return { ok: false, reason: 'enforce_failed', error: String(e) };
    }
    const off = readKitchenModuleOffsetsMm(group);
    let gotGap = Math.round(Number(enforced?.measured?.wallGapMm));
    const wantRear = Math.max(0, Math.round(Number(rearOffsetMm) || 0));
    // Если enforce не довёл щель — дожать rigid shift по миру.
    if (
      enforced?.ok &&
      Number.isFinite(gotGap) &&
      Math.abs(gotGap - wantRear) > 2
    ) {
      const sign = kitchenIntoRoomSign(wall);
      const fix = sign * (wantRear - gotGap);
      if (shiftGroupAlongDepth(group, wall, fix)) {
        group.updateMatrixWorld(true);
        const bb = corpusBBox(group);
        if (bb && !bb.isEmpty()) {
          const back = depthCoordFromBBox(bb, wall, 'back');
          const wallCoord = getSectionWallWorldCoord(sec, wall);
          gotGap = Math.round((back - Number(wallCoord)) * sign);
        }
      }
    }
    const gapOk =
      !Number.isFinite(gotGap) || wantRear <= 0 || Math.abs(gotGap - wantRear) <= 2;
    if (!(enforced && enforced.ok && gapOk)) {
      console.warn('[KITCHEN-DEPTH] set offsets enforce/gap mismatch', {
        wantRear,
        gotGap,
        enforced: enforced && enforced.ok,
        measured: enforced?.measured,
      });
      return {
        ok: false,
        reason: 'gap_mismatch',
        ...off,
        enforced: !!(enforced && enforced.ok),
        wallGapMm: gotGap,
      };
    }
    return {
      ok: true,
      ...off,
      enforced: true,
      wallGapMm: gotGap,
      measured: enforced?.measured,
    };
  };
  /** Диагностика щели пенала: __cldTallWallGap() → wallGapMm должен быть ~0 */
  window.__cldTallWallGap = function __cldTallWallGap(wallNameOpt) {
    const out = [];
    if (!state.scene) return { ok: false, reason: 'no_scene' };
    state.scene.traverse((obj) => {
      if (!obj?.isGroup || !obj.userData?.isFurniture) return;
      if (!isKitchenTallDepthGroup(obj)) return;
      const wn = String(obj.userData?.wallName || wallNameOpt || 'back').toLowerCase();
      if (wallNameOpt && wn !== String(wallNameOpt).toLowerCase()) return;
      const secId = obj.userData?.sectionId;
      const section =
        Array.isArray(state.customSections) &&
        state.customSections.find((s) => String(s?.id) === String(secId));
      const before = measureKitchenNmDepthReport(wn);
      const gapBefore = (before?.modules || []).find(
        (m) => String(m.sectionId) === String(secId)
      )?.wallGapMm;
      const r = section
        ? enforceKitchenDepthStackOnModule(obj, section, wn)
        : { ok: false, reason: 'no_section' };
      out.push({
        name: obj.userData?.catalogName,
        wall: wn,
        gapBeforeMm: gapBefore,
        gapAfterMm: r?.measured?.wallGapMm,
        tall: !!r?.tall,
        carcassDepthMm: r?.measured?.carcassDepthMm,
        wallCoord: r?.wallCoord,
      });
    });
    return { ok: out.length > 0, modules: out };
  };
}
