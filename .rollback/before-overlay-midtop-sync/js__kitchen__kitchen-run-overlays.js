/**
 * Kitchen run overlays.
 * Столешка-прогон: ВЫКЛ (доски модуля).
 * Лицевой цоколь-прогон: ВКЛ — соседние НМ/пеналы → одна лента (раскрой хлыста — отдельно).
 */
import { state } from '../utils/state.js';
import {
  isKitchenBaseGroup,
  getKitchenBaseProfileIdFromGroup,
  isKitchenNmCarcassGroup,
  isKitchenWallMidGroup,
  isKitchenWallTopGroup,
  isKitchenWallCornerGroup,
} from './kitchen-base-engine.js?v=20261104-talltopd1';
import {
  isKitchenTallPlacementKind,
  isKitchenWallMidPlacementKind,
  isKitchenWallTopPlacementKind,
} from '../sections/vertical-layout.js?v=20261104-talltopd1';
import {
  computeFurnitureCorpusLayoutWorldBBoxNoAo,
  withFurnitureDoorSwingsClosedForMeasure,
} from '../furniture/furniture-bbox.js?v=20261104-talltopd1';

const OVERLAY_WALL_KEY = 'kitchenRunOverlayWall';
const OVERLAY_BUILD = '20261118-plinthSafe1';
/** false = не лепить KitchenWorktop, не глушить доски столешки модуля. */
const KITCHEN_RUN_OVERLAYS_ENABLED = false;
/** true = одна лицевая лента цоколя на непрерывный ряд НМ/пенал. */
const KITCHEN_PLINTH_RUN_ENABLED = true;
/** Соседство по U: зазор ≤ этого = один прогон (мм). */
const PLINTH_RUN_GAP_TOL_MM = 5;

/** Было: прятали доску модуля под оверлей. Оставлено no-op на случай старых вызовов. */
function hideModuleCountertopBoards(_group) {
  void _group;
}

/** Вернуть доски столешки, спрятанные старым оверлеем. */
function restoreModuleCountertopBoards(group) {
  if (!group || typeof group.traverse !== 'function') return 0;
  let n = 0;
  group.traverse((o) => {
    if (!o?.isMesh) return;
    if (!o.userData?.__cldHiddenByKitchenWorktopOverlay) return;
    o.visible = true;
    delete o.userData.__cldHiddenByKitchenWorktopOverlay;
    n += 1;
  });
  return n;
}

function restoreModuleCountertopBoardsOnWall(wallName) {
  const norm = String(wallName || '').trim().toLowerCase();
  if (!norm || !state.scene) return 0;
  let n = 0;
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (String(obj.userData?.wallName || '').toLowerCase() !== norm) return;
    n += restoreModuleCountertopBoards(obj);
  });
  return n;
}

function isModulePlinthObject(obj) {
  if (!obj) return false;
  const ud = obj.userData || {};
  if (ud.isModulePlinthBoard) return true;
  const it = ud.cldBuildItem;
  const t = String(
    it?.type || ud.itemType || ud.detailType || ud.originalType || ''
  ).toLowerCase();
  if (t === 'plinth' || t === 'cokol') return true;
  if (/^цокол/i.test(String(obj.name || ''))) return true;
  return false;
}

/** Спрятать лицевые доски цоколя модуля под прогонную ленту. */
function hideModulePlinthBoards(group) {
  if (!group || typeof group.traverse !== 'function') return 0;
  let n = 0;
  group.traverse((o) => {
    if (!isModulePlinthObject(o)) return;
    if (o.userData?.__cldHiddenByKitchenPlinthRun) return;
    o.userData = o.userData || {};
    o.userData.__cldHiddenByKitchenPlinthRun = true;
    o.userData.__cldPlinthWasVisible = o.visible !== false;
    o.visible = false;
    n += 1;
  });
  return n;
}

function restoreModulePlinthBoards(group) {
  if (!group || typeof group.traverse !== 'function') return 0;
  let n = 0;
  group.traverse((o) => {
    if (!o?.userData?.__cldHiddenByKitchenPlinthRun) return;
    o.visible = o.userData.__cldPlinthWasVisible !== false;
    delete o.userData.__cldHiddenByKitchenPlinthRun;
    delete o.userData.__cldPlinthWasVisible;
    n += 1;
  });
  return n;
}

function restoreModulePlinthBoardsOnWall(wallName) {
  const norm = String(wallName || '').trim().toLowerCase();
  if (!norm || !state.scene) return 0;
  let n = 0;
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (String(obj.userData?.wallName || '').toLowerCase() !== norm) return;
    n += restoreModulePlinthBoards(obj);
  });
  return n;
}

const WORKTOP_THICKNESS_DEFAULT = 38;
const PLINTH_PANEL_THICKNESS_MM = 16;
/**
 * Смещение лицевого цоколя вглубь от переда корпуса (мм).
 * Как в админке catalog_32: pos.z = s:z - 16, pivot.z = +1, size.z = 16.
 */
const PLINTH_FRONT_INSET_MM = 16;
/** Белый LDSP дефолт (модель цоколя / material_2). */
const PLINTH_DEFAULT_COLOR = 0xffffff;

/** Кэш материала столешки из catalog tabletop_items */
let _ttMatCache = { key: '', mat: null, thick: 0 };

function km() {
  return typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
}

function THREE_REF() {
  return typeof window !== 'undefined' ? window.THREE : null;
}

function isTallUd(ud) {
  if (String(ud?.productKind || '') === 'kitchen_tall') return true;
  if (ud?.__kitchenTall && typeof ud.__kitchenTall === 'object') return true;
  const profile =
    getKitchenBaseProfileIdFromGroup({ userData: ud || {} }) ||
    String(ud?.__placementKindProfileId || '').trim();
  return isKitchenTallPlacementKind(profile);
}

function resolveDepthStack(ud) {
  const api = km();
  let worktopDepthMm =
    Number(ud?.__kitchenWorktopDepthMm) ||
    (api && typeof api.getProjectWorktopDepthMm === 'function'
      ? Number(api.getProjectWorktopDepthMm())
      : 0) ||
    600;

  // Пенал: 560 к стене, не clamp НМ 550.
  if (isTallUd(ud)) {
    let tallD = Number(ud?.__kitchenCarcassDepthMm) || 0;
    const customD = Number(ud?.customDepthMm) || 0;
    if (!(tallD > 0) && customD > 0 && customD < worktopDepthMm) tallD = customD;
    if (api && typeof api.resolveTallCarcassDepthMm === 'function') {
      const td = api.resolveTallCarcassDepthMm({
        worktopDepthMm,
        preferredCarcassDepthMm: tallD > 0 ? tallD : undefined,
      });
      if (td?.ok && Number(td.carcassDepthMm) > 0) tallD = Number(td.carcassDepthMm);
    }
    if (!(tallD > 0)) tallD = Math.round(worktopDepthMm - 40) || 560;
    return {
      worktopDepthMm: Math.round(tallD),
      carcassDepthMm: Math.round(tallD),
      frontSetbackToCarcassMm: 0,
      rearOverhangMm: 0,
    };
  }

  // Корпус НМ = линейка проекта (460/510/550), не D из карточки.
  let preferred = 0;
  if (api && typeof api.getProjectBaseCarcassDepthMm === 'function') {
    preferred = Number(api.getProjectBaseCarcassDepthMm()) || 0;
  }
  if (!(preferred > 0)) preferred = Number(ud?.__kitchenCarcassDepthMm) || 0;
  const customD = Number(ud?.customDepthMm) || 0;
  const initZ = Number(ud?.__initialSectionSizeMm?.z) || 0;
  if (!(preferred > 0) && customD > 0 && customD <= worktopDepthMm - 50) preferred = customD;
  if (!(preferred > 0) && initZ > 0 && initZ <= worktopDepthMm - 50) preferred = initZ;
  if (!(preferred > 0)) preferred = 550;

  let carcassDepthMm = preferred;
  let frontSetback = Number(ud?.__kitchenFrontSetbackMm) || 40;
  let rearOverhang = Number(ud?.__kitchenRearOverhangMm) || 0;

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
  } else if (api && typeof api.resolveWorktopStackDepth === 'function') {
    const st = api.resolveWorktopStackDepth({
      worktopDepthMm,
      carcassDepthMm: preferred,
    });
    if (st && st.ok) {
      worktopDepthMm = st.worktopDepthMm;
      carcassDepthMm = st.carcassDepthMm;
      frontSetback = st.frontSetbackToCarcassMm;
      rearOverhang = st.rearOverhangMm;
    }
  }
  if (!(rearOverhang > 0)) {
    rearOverhang = Math.max(10, Math.round(worktopDepthMm - frontSetback - carcassDepthMm));
  }
  if (!(frontSetback > 0)) frontSetback = 40;
  return {
    worktopDepthMm: Math.round(worktopDepthMm),
    carcassDepthMm: Math.round(carcassDepthMm),
    frontSetbackToCarcassMm: Math.round(frontSetback),
    rearOverhangMm: Math.round(rearOverhang),
  };
}

function worktopThicknessMm() {
  if (_ttMatCache.thick > 0) return _ttMatCache.thick;
  const api = km();
  try {
    const p = api && typeof api.getProfile === 'function' ? api.getProfile() : null;
    const t = Number(p?.worktop?.thicknessesMm?.[0]?.value);
    if (t > 0) return Math.round(t);
  } catch (_) {}
  return WORKTOP_THICKNESS_DEFAULT;
}

/** Первая активная модель столешки → map + thickness (мм). */
function readTabletopCatalogDecor() {
  try {
    const lib =
      (typeof window !== 'undefined' && window.__cldTabletopItems) ||
      (typeof window !== 'undefined' && window.global_data?.tabletop?.lib) ||
      null;
    let items = Array.isArray(lib) ? lib : null;
    if (!items && typeof window !== 'undefined' && Array.isArray(window.__cldCatalogCache?.tabletop_items)) {
      items = window.__cldCatalogCache.tabletop_items;
    }
    if (!Array.isArray(items) || !items.length) return null;
    const it = items.find((x) => Number(x?.active) !== 0) || items[0];
    if (!it) return null;
    const map =
      it?.params?.mat_params?.params?.map ||
      it?.icon ||
      '';
    const v = Array.isArray(it?.params?.variants) ? it.params.variants[0] : null;
    const thick = Math.round(Number(v?.thickness) || 0);
    return { map: String(map || '').trim(), thick, id: it.id || it.name || '' };
  } catch (_) {
    return null;
  }
}

function ensureTabletopMaterial(THREE, onReady) {
  const decor = readTabletopCatalogDecor();
  const mapUrl = decor?.map || '';
  const thick = decor?.thick > 0 ? decor.thick : 0;
  if (thick > 0) _ttMatCache.thick = thick;
  const key = (mapUrl || 'solid') + ':basic';
  if (_ttMatCache.mat && _ttMatCache.key === key) {
    onReady(_ttMatCache.mat.clone());
    return;
  }
  // Комната: IKEA Soft/Spot, обычных THREE.Light нет.
  // MeshStandard без lights = чёрная плита (баг «столешка чёрная»). MeshBasic видит map.
  const base = new THREE.MeshBasicMaterial({
    color: mapUrl ? 0xffffff : 0xd4c4a8,
  });
  if (!mapUrl || !THREE.TextureLoader) {
    _ttMatCache = { key, mat: base, thick: _ttMatCache.thick };
    onReady(base.clone());
    return;
  }
  const loader = new THREE.TextureLoader();
  loader.load(
    mapUrl,
    (tex) => {
      try {
        if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.MirroredRepeatWrapping;
        tex.needsUpdate = true;
      } catch (_) {}
      base.map = tex;
      base.needsUpdate = true;
      _ttMatCache = { key, mat: base, thick: _ttMatCache.thick };
      onReady(base.clone());
    },
    undefined,
    () => {
      const solid = new THREE.MeshBasicMaterial({ color: 0xd4c4a8 });
      _ttMatCache = { key: 'solid:basic', mat: solid, thick: _ttMatCache.thick };
      onReady(solid.clone());
    }
  );
}

/** Подтянуть tabletop_items, если ещё не в кэше. */
function ensureTabletopItemsLoaded(done) {
  if (readTabletopCatalogDecor()) {
    done();
    return;
  }
  fetch('/catalog_items/tabletop_items.json?t=' + Date.now())
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      const arr = Array.isArray(data) ? data : data?.items;
      if (Array.isArray(arr) && typeof window !== 'undefined') {
        window.__cldTabletopItems = arr;
        if (!window.__cldCatalogCache) window.__cldCatalogCache = {};
        window.__cldCatalogCache.tabletop_items = arr;
      }
      done();
    })
    .catch(() => done());
}

function plinthHeightMm(ud) {
  const api = km();
  const fromUd =
    Number(ud?.hBottomMm) || Number(ud?.__kitchenPlinthHeightMm) || 0;
  if (fromUd > 0) return Math.round(fromUd);
  if (api && typeof api.getProjectPlinthHeightMm === 'function') {
    return Math.round(Number(api.getProjectPlinthHeightMm()) || 100);
  }
  return 100;
}

/** Знак «от стены в комнату» по оси глубины. */
export function kitchenIntoRoomSign(wallName) {
  const w = String(wallName || 'back').trim().toLowerCase();
  if (w === 'back') return +1;
  if (w === 'front') return -1;
  if (w === 'left') return +1;
  if (w === 'right') return -1;
  return +1;
}

/** Плоскость стены (мм) → целевая плоскость спинки корпуса (+ rear overhang). */
export function kitchenCarcassBackTargetFromWall(wallCoord, wallName, rearOverhangMm) {
  const sign = kitchenIntoRoomSign(wallName);
  const rear = Math.max(0, Number(rearOverhangMm) || 0);
  return Number(wallCoord) + sign * rear;
}

function disposeMesh(obj) {
  try {
    obj.geometry?.dispose?.();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m?.dispose?.());
      else obj.material.dispose?.();
    }
    obj.parent?.remove(obj);
  } catch (_) {}
}

/** Есть ли у модуля доска цоколя из админки (type:plinth/cokol). */
function carrierHasModulePlinthBoard(g) {
  if (!g || typeof g.traverse !== 'function') return false;
  let found = false;
  g.traverse((obj) => {
    if (found || !obj) return;
    if (isModulePlinthObject(obj)) found = true;
  });
  return found;
}

function runHasModulePlinthBoard(run) {
  if (!Array.isArray(run)) return false;
  return run.some((r) => carrierHasModulePlinthBoard(r?.g));
}

/** v1: угловой НМУ не входит в прогон — доски модуля остаются. */
function isKitchenPlinthCornerSkipGroup(group) {
  if (!group) return true;
  if (typeof isKitchenWallCornerGroup === 'function' && isKitchenWallCornerGroup(group)) {
    return true;
  }
  const ud = group.userData || {};
  if (ud.__kitchenCornerSideAtMinU != null) return true;
  const profile = String(
    getKitchenBaseProfileIdFromGroup(group) ||
      ud.__placementKindProfileId ||
      ud.productKind ||
      ''
  ).toLowerCase();
  if (profile === 'kitchen_base_corner' || profile === 'kitchen_wall_corner') {
    return true;
  }
  if (profile.includes('corner') && !profile.includes('wall_mid')) return true;
  return false;
}

/** Носитель лицевого цоколя: НМ или пенал (не навес, не угол v1). */
export function isKitchenPlinthCarrierGroup(group) {
  if (!isKitchenBaseGroup(group)) return false;
  if (isKitchenPlinthCornerSkipGroup(group)) return false;
  if (isKitchenWallMidGroup(group)) return false;
  if (isKitchenWallTopGroup(group)) return false;
  const profile = getKitchenBaseProfileIdFromGroup(group);
  if (isKitchenWallMidPlacementKind(profile) || isKitchenWallTopPlacementKind(profile)) {
    return false;
  }
  if (isKitchenTallBarrierGroup(group)) return true;
  return isKitchenNmCarcassGroup(group);
}

function collectPlinthCarriersOnWall(wallName) {
  return collectKitchenGroupsOnWall(wallName).filter(isKitchenPlinthCarrierGroup);
}

/** Непрерывные прогоны по U (зазор ≤ tol). Span = корпус (moduleWallSpanU). */
function splitContiguousPlinthRuns(carriers, THREE, useZ, gapTolMm) {
  const spans = [];
  for (const g of carriers) {
    const sp = moduleWallSpanU(g, THREE, useZ);
    if (!sp || !(sp.maxU > sp.minU)) continue;
    spans.push({ g, ...sp });
  }
  spans.sort((a, b) => a.minU - b.minU || a.maxU - b.maxU);
  if (!spans.length) return [];
  const tol = Number.isFinite(gapTolMm) ? gapTolMm : PLINTH_RUN_GAP_TOL_MM;
  const runs = [];
  let cur = [spans[0]];
  for (let i = 1; i < spans.length; i++) {
    const prev = cur[cur.length - 1];
    const next = spans[i];
    const gap = next.minU - prev.maxU;
    if (gap <= tol) {
      cur.push(next);
    } else {
      runs.push(cur);
      cur = [next];
    }
  }
  runs.push(cur);
  return runs;
}

function pickPlinthRunDepth(run) {
  if (!Array.isArray(run) || !run.length) return null;
  for (const c of run) {
    if (c?.g && !isKitchenTallBarrierGroup(c.g) && isKitchenNmCarcassGroup(c.g)) {
      return resolveDepthStack(c.g.userData || {});
    }
  }
  return resolveDepthStack(run[0]?.g?.userData || {});
}

function sectionWallCoordForCarrier(g, wallName, useZ) {
  const sid = String(g?.userData?.sectionId ?? '');
  const sec =
    Array.isArray(state.customSections) &&
    state.customSections.find((s) => String(s?.id) === sid);
  if (sec?.group?.position) {
    return useZ ? sec.group.position.x : sec.group.position.z;
  }
  return null;
}

/** Столешка модуля — не корпус (иначе Столешница_core уезжает в sample цоколя). */
function isModuleCountertopLikeObject(o) {
  if (!o) return false;
  const ud = o.userData || {};
  if (ud.isModuleCountertopBoard === true || ud.cldKitchenCountertop === true) return true;
  if (ud.isKitchenWorktop === true) return true;
  if (ud.__cldTabletopAdmin) return true;
  const t = String(ud.type || ud.originalType || ud.detailType || '').toLowerCase();
  if (t === 'countertop' || t === 'tabletop') return true;
  if (/столеш|KitchenWorktop|countertop|tabletop/i.test(String(o.name || ''))) return true;
  let p = o.parent;
  for (let i = 0; i < 8 && p; i++) {
    const pud = p.userData || {};
    if (pud.cldKitchenCountertop === true || pud.isKitchenWorktop === true) return true;
    const pt = String(pud.type || pud.originalType || '').toLowerCase();
    if (pt === 'countertop' || pt === 'tabletop') return true;
    if (/столеш|KitchenWorktop/i.test(String(p.name || ''))) return true;
    p = p.parent;
  }
  return false;
}

/**
 * Материал ленты с корпуса (когда включим выбор цоколя).
 * Сейчас прогон берёт белый дефолт — см. _placePlinthRunsOnWall.
 * MeshBasic + color/map — в комнате Soft без Light Standard часто чёрный.
 */
function sampleCorpusBodyMaterial(group, THREE) {
  if (!group || !THREE || typeof group.traverse !== 'function') return null;
  let best = null;
  let bestArea = 0;
  group.traverse((o) => {
    if (!o?.isMesh || !o.material) return;
    const ud = o.userData || {};
    if (isModulePlinthObject(o)) return;
    if (isModuleCountertopLikeObject(o)) return;
    if (ud.isFacade === true) return;
    if (ud.isEdge || ud.isEdgeStrip) return;
    if (ud.isKitchenRunOverlay) return;
    const isBody =
      ud.isBody === true ||
      (String(o.name || '').includes('_core') && !isModuleCountertopLikeObject(o));
    if (!isBody) return;
    const src = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!src) return;
    // Не тащить map столешки, если флаг на материале.
    if (src.userData?.__cldTabletopAdmin) return;
    let area = 0;
    try {
      o.geometry?.computeBoundingBox?.();
      const bb = o.geometry?.boundingBox;
      if (bb) {
        const sx = Math.max(0.001, bb.max.x - bb.min.x);
        const sy = Math.max(0.001, bb.max.y - bb.min.y);
        const sz = Math.max(0.001, bb.max.z - bb.min.z);
        area = sx * sy * sz;
      }
    } catch (_) {
      area = 1;
    }
    if (area >= bestArea) {
      bestArea = area;
      best = src;
    }
  });
  if (!best) return null;
  const mat = new THREE.MeshBasicMaterial({
    color: PLINTH_DEFAULT_COLOR,
  });
  try {
    if (best.color && typeof best.color.clone === 'function') {
      mat.color.copy(best.color);
    } else if (best.color != null) {
      mat.color.set(best.color);
    }
    if (best.map) {
      mat.map = best.map;
      mat.color.setHex(0xffffff);
    }
    mat.needsUpdate = true;
  } catch (_) {}
  return mat;
}

export function clearKitchenRunOverlaysOnWall(wallName) {
  if (!state.scene) return 0;
  const norm = String(wallName || '').trim().toLowerCase();
  const toRemove = [];
  state.scene.traverse((obj) => {
    if (!obj?.userData?.isKitchenRunOverlay) return;
    if (String(obj.userData?.[OVERLAY_WALL_KEY] || '').toLowerCase() !== norm) return;
    toRemove.push(obj);
  });
  toRemove.forEach(disposeMesh);
  return toRemove.length;
}

/** Пенал на стене — барьер столешки (НМ не меняем). */
function isKitchenTallBarrierGroup(group) {
  if (!isKitchenBaseGroup(group)) return false;
  const ud = group?.userData || {};
  if (String(ud.productKind || '') === 'kitchen_tall') return true;
  if (ud.__kitchenTall && typeof ud.__kitchenTall === 'object') return true;
  if (ud.hasWorktop === false && isKitchenTallPlacementKind(getKitchenBaseProfileIdFromGroup(group))) {
    return true;
  }
  return isKitchenTallPlacementKind(getKitchenBaseProfileIdFromGroup(group));
}

/** НМ-носитель столешки/цоколя = только рабочий стол (не пенал, не НШ1/ВМУ). */
export function isKitchenWorktopCarrierGroup(group) {
  if (!isKitchenBaseGroup(group)) return false;
  if (isKitchenTallBarrierGroup(group)) return false;
  if (isKitchenWallMidGroup(group)) return false;
  if (isKitchenWallTopGroup(group)) return false;
  if (typeof isKitchenWallCornerGroup === 'function' && isKitchenWallCornerGroup(group)) {
    return false;
  }
  const profile = getKitchenBaseProfileIdFromGroup(group);
  if (isKitchenWallMidPlacementKind(profile) || isKitchenWallTopPlacementKind(profile)) {
    return false;
  }
  return isKitchenNmCarcassGroup(group);
}

function collectKitchenGroupsOnWall(wallName) {
  const norm = String(wallName || '').trim().toLowerCase();
  const list = [];
  if (!state.scene) return list;
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (!isKitchenBaseGroup(obj)) return;
    if (String(obj.userData?.wallName || '').toLowerCase() !== norm) return;
    list.push(obj);
  });
  return list;
}

function collectKitchenBasesOnWall(wallName) {
  return collectKitchenGroupsOnWall(wallName).filter(isKitchenWorktopCarrierGroup);
}

function collectKitchenTallBarriersOnWall(wallName) {
  return collectKitchenGroupsOnWall(wallName).filter(isKitchenTallBarrierGroup);
}

/** Ширина = корпус/ячейка НМ, не раздутый setFromObject (опоры/служебное). */
function moduleCorpusWorldBBox(grp, THREE) {
  grp.updateMatrixWorld(true);
  const corpus = withFurnitureDoorSwingsClosedForMeasure(grp, () =>
    computeFurnitureCorpusLayoutWorldBBoxNoAo(grp)
  );
  if (corpus && !corpus.isEmpty()) return corpus;
  return new THREE.Box3().setFromObject(grp);
}

/** Ширина ячейки из userData, если есть (мм). */
function moduleCellWidthMm(grp) {
  const ud = grp?.userData || {};
  const candidates = [
    ud.customWidthMm,
    ud.__kitchenCellWidthMm,
    ud.__zoneWidthMm,
    ud.zoneWidthMm,
    ud.__initialSectionSizeMm?.x,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (n > 50 && n < 5000) return Math.round(n);
  }
  return 0;
}

/** U-интервал корпуса модуля вдоль стены (мм, world). */
function moduleWallSpanU(grp, THREE, useZ) {
  const bb = moduleCorpusWorldBBox(grp, THREE);
  if (bb.isEmpty()) return null;
  let gMinU = useZ ? bb.min.z : bb.min.x;
  let gMaxU = useZ ? bb.max.z : bb.max.x;
  let corpusW = gMaxU - gMinU;
  const cellW = moduleCellWidthMm(grp);
  const mid =
    Number.isFinite(gMinU) && Number.isFinite(gMaxU) ? (gMinU + gMaxU) / 2 : 0;
  const ud = grp?.userData || {};
  const isCorner =
    ud.__kitchenCornerSideAtMinU != null ||
    String(ud.__placementKindProfileId || ud.productKind || '').includes('corner') ||
    /(^|_)44$/.test(String(ud.catalogType || ud.__catalogType || ''));
  // Ячейка НМ — источник истины по ширине. Bbox часто раздут крепежом (±300 baked).
  // Угловой: корпус/bbox часто уже ноги без приставки → столешка должна быть на всю ячейку;
  // до стены (clear/rear) дотягивает expandCornerWorktopSpanU.
  if (cellW > 50 && (isCorner || !(corpusW > 50) || corpusW > cellW + 8)) {
    if (isCorner && ud.__kitchenCornerSideAtMinU === true) {
      // угол на min-U: ячейка от корпуса.max − cellW … корпуса.max (или mid±),
      // лучше: max держим, min = max − cellW
      const anchorMax = Number.isFinite(gMaxU) ? gMaxU : mid + cellW / 2;
      gMaxU = anchorMax;
      gMinU = anchorMax - cellW;
    } else if (isCorner && ud.__kitchenCornerSideAtMinU === false) {
      const anchorMin = Number.isFinite(gMinU) ? gMinU : mid - cellW / 2;
      gMinU = anchorMin;
      gMaxU = anchorMin + cellW;
    } else {
      gMinU = mid - cellW / 2;
      gMaxU = mid + cellW / 2;
    }
  }
  if (!(gMaxU > gMinU)) return null;
  return { minU: gMinU, maxU: gMaxU, topY: bb.max.y, bb };
}

/** cornerAtStart: угол на меньшем world-U (левая/задняя сторона прогона). */
const CORNER_AT_MIN_U = {
  'corner-back-right': false,
  'corner-back-left': true,
  'corner-right-front': false,
  'corner-right-back': true,
  'corner-front-left': false,
  'corner-front-right': true,
  'corner-left-front': false,
  'corner-left-back': true,
};

function cornerTypeKey(section) {
  const t = String(section?.division?.typeKey || section?.lShape?.type || '');
  return t in CORNER_AT_MIN_U ? t : '';
}

function isCornerCarrier(item, section) {
  const ud = item?.g?.userData || {};
  // ВМУ (верх пирога) — не носитель столешки низа.
  if (typeof isKitchenWallCornerGroup === 'function' && isKitchenWallCornerGroup(item?.g)) {
    return false;
  }
  const pk0 = String(ud.__placementKindProfileId || ud.__placementKind || '').toLowerCase();
  if (pk0 === 'kitchen_wall_corner') return false;
  if (ud.__kitchenCornerSideAtMinU != null) return true;
  const pk = String(
    ud.productKind || ud.__placementKindProfileId || ud.__placementKind || ''
  );
  if (pk === 'kitchen_wall_corner') return false;
  if (pk === 'kitchen_base_corner' || (pk.includes('corner') && !pk.includes('wall'))) return true;
  const ct = String(ud.catalogType || ud.__catalogType || '');
  if (/(^|_)44$/.test(ct) || ct === '44') return true;
  const name = String(ud.catalogName || ud.moduleName || ud.name || '').toLowerCase();
  if (name.includes('углов')) return true;
  const typeKey = cornerTypeKey(section);
  if (!typeKey) return false;
  const parts = Math.floor(Number(section?.division?.parts) || 0);
  const zi = Number(ud.zoneIndex);
  if (!(parts > 0) || !Number.isFinite(zi)) return false;
  const specialZi = CORNER_AT_MIN_U[typeKey] ? 0 : parts - 1;
  return zi === specialZi;
}

function cornerAtMinU(ud, section) {
  // П-спина: сторона только от zoneIndex (0=лев/min, end=прав/max).
  // Иначе stamp/meta от «левого» спец ломает правый — столешка не доходит до стены.
  const div = section?.division;
  if (div?.uShape === true) {
    const zi = Number(ud?.zoneIndex);
    const parts = Math.floor(Number(div.parts) || 0);
    if (Number.isFinite(zi) && zi === 0) return true;
    if (parts >= 2 && Number.isFinite(zi) && zi === parts - 1) return false;
  }
  if (ud?.__kitchenCornerSideAtMinU != null) {
    return ud.__kitchenCornerSideAtMinU === true;
  }
  const typeKey = cornerTypeKey(section);
  if (typeKey) return CORNER_AT_MIN_U[typeKey] === true;
  return false;
}

/** Внутренняя плоскость боковой стены в том же world-U, что и прогон. */
function sideWallInnerWorldU(runWall, atMin) {
  const room = state.room;
  if (!room) return null;
  const ox = Number(room.group?.position?.x) || 0;
  const oz = Number(room.group?.position?.z) || 0;
  const w = Number(room.width) || 0;
  const d = Number(room.depth) || 0;
  if (!(w > 0) || !(d > 0)) return null;
  const norm = String(runWall || '').toLowerCase();
  if (norm === 'back' || norm === 'front') {
    return atMin ? ox : ox + w;
  }
  if (norm === 'left' || norm === 'right') {
    return atMin ? oz : oz + d;
  }
  return null;
}

/**
 * Столешка углового: до внутренней плоскости боковой стены.
 * Корпус/ячейка стоят на 10 мм внутри — ячейка этот зазор не закрывает.
 * @returns {{ minU: number, maxU: number }|null}
 */
function expandCornerWorktopSpanU(item, section, wallName) {
  if (!item || !isCornerCarrier(item, section)) return null;
  const ud = item.g?.userData || {};
  let minU = item.minU;
  let maxU = item.maxU;
  if (!(maxU > minU)) return null;
  const atMin = cornerAtMinU(ud, section);
  // П: выровнять stamp со стороной зоны (правый больше не «как левый»).
  if (section?.division?.uShape === true && item.g?.userData) {
    item.g.userData.__kitchenCornerSideAtMinU = atMin;
  }
  const wallU = sideWallInnerWorldU(wallName, atMin);
  const clear = Math.max(0, Math.round(Number(ud.__kitchenSideWallClearanceMm) || 10));
  if (wallU != null && Number.isFinite(wallU)) {
    if (atMin) minU = Math.min(minU, wallU);
    else maxU = Math.max(maxU, wallU);
  } else if (atMin) {
    minU -= clear;
  } else {
    maxU += clear;
  }
  if (!(maxU > minU)) return null;
  return { minU, maxU };
}

/**
 * Разбить носители столешки на прогоны.
 * Пенал рвёт ряд только если mid НМ попадает в U-ячейку пенала (не раздутый bbox).
 */
function splitCarriersIntoRuns(carriers, barriers, THREE, useZ) {
  const carrierSpans = [];
  for (const g of carriers) {
    const sp = moduleWallSpanU(g, THREE, useZ);
    if (!sp) continue;
    carrierSpans.push({ g, ...sp });
  }
  carrierSpans.sort((a, b) => a.minU - b.minU || a.maxU - b.maxU);

  const barrierSpans = [];
  for (const g of barriers) {
    const sp = moduleWallSpanU(g, THREE, useZ);
    if (!sp) continue;
    barrierSpans.push(sp);
  }
  barrierSpans.sort((a, b) => a.minU - b.minU);

  if (!carrierSpans.length) return [];
  if (!barrierSpans.length) return [carrierSpans];

  const runs = [];
  let cur = [];
  for (const c of carrierSpans) {
    const mid = (c.minU + c.maxU) / 2;
    // Только mid внутри ячейки пенала — не «crosses» по раздутому bbox.
    const blocked = barrierSpans.some((b) => mid >= b.minU - 0.5 && mid <= b.maxU + 0.5);
    if (blocked) continue;

    if (cur.length) {
      const last = cur[cur.length - 1];
      const gapBlocked = barrierSpans.some(
        (b) => last.maxU < b.minU && b.maxU < c.minU
      );
      if (gapBlocked) {
        runs.push(cur);
        cur = [];
      }
    }
    cur.push(c);
  }
  if (cur.length) runs.push(cur);
  return runs;
}

/**
 * Одна лицевая лента цоколя на прогон (world).
 * Outer face = перед корпуса; H = project/module plinth; W = span прогона.
 */
function addKitchenPlinthMesh(THREE, opts) {
  const o = opts && typeof opts === 'object' ? opts : {};
  const norm = String(o.wallName || '').toLowerCase();
  const minU = Number(o.minU);
  const maxU = Number(o.maxU);
  const wallCoord = Number(o.wallCoord);
  const depth = o.depth;
  const h = Math.max(1, Math.round(Number(o.plinthHeightMm) || 100));
  const thick = Math.max(1, Math.round(Number(o.thicknessMm) || PLINTH_PANEL_THICKNESS_MM));
  if (!THREE || !state.scene || !depth) return false;
  if (!(maxU > minU) || !Number.isFinite(wallCoord)) return false;

  const sign = kitchenIntoRoomSign(norm);
  const useZ = norm === 'left' || norm === 'right';
  const rear = Math.max(0, Number(depth.rearOverhangMm) || 0);
  const carcass = Math.max(1, Number(depth.carcassDepthMm) || 550);
  const inset = Math.max(0, Number(PLINTH_FRONT_INSET_MM) || 0);
  // Outer face flush with carcass front, then inset into carcass.
  const frontOuter = wallCoord + sign * (rear + carcass - inset);
  const centerDepth = frontOuter - sign * (thick / 2);
  const spanU = maxU - minU;
  const centerU = (minU + maxU) / 2;
  const centerY = h / 2;

  let geom;
  let pos;
  if (useZ) {
    geom = new THREE.BoxGeometry(thick, h, spanU);
    pos = new THREE.Vector3(centerDepth, centerY, centerU);
  } else {
    geom = new THREE.BoxGeometry(spanU, h, thick);
    pos = new THREE.Vector3(centerU, centerY, centerDepth);
  }

  const mat =
    o.material ||
    sampleCorpusBodyMaterial(o.sourceGroup, THREE) ||
    new THREE.MeshBasicMaterial({ color: PLINTH_DEFAULT_COLOR });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.name = 'KitchenPlinthRun';
  mesh.userData.isKitchenRunOverlay = true;
  mesh.userData.isKitchenPlinthRun = true;
  mesh.userData[OVERLAY_WALL_KEY] = norm;
  mesh.userData.plinthHeightMm = h;
  mesh.userData.thicknessMm = thick;
  mesh.userData.spanU = spanU;
  mesh.userData.kitchenDepth = depth;
  mesh.renderOrder = 1;
  mesh.position.copy(pos);
  state.scene.add(mesh);
  return true;
}

/**
 * Собрать прогоны → спрятать доски модулей → одна лента на прогон.
 * Углы L/U не трогаем (не в carriers).
 */
function _placePlinthRunsOnWall(THREE, norm, carriers) {
  if (!KITCHEN_PLINTH_RUN_ENABLED) return 0;
  const useZ = norm === 'left' || norm === 'right';
  const runs = splitContiguousPlinthRuns(
    carriers,
    THREE,
    useZ,
    PLINTH_RUN_GAP_TOL_MM
  );
  let plinths = 0;
  for (const run of runs) {
    if (!run?.length) continue;
    let minU = Infinity;
    let maxU = -Infinity;
    for (const c of run) {
      if (c.minU < minU) minU = c.minU;
      if (c.maxU > maxU) maxU = c.maxU;
      hideModulePlinthBoards(c.g);
    }
    if (!(maxU > minU)) continue;

    const depth = pickPlinthRunDepth(run);
    if (!depth) continue;
    const wallCoord = sectionWallCoordForCarrier(run[0].g, norm, useZ);
    if (wallCoord == null || !Number.isFinite(Number(wallCoord))) continue;

    const h = plinthHeightMm(run[0].g?.userData || {});
    // Дефолт = белый ЛДСП (как доска модуля / угол). Выбор цвета цоколя — позже.
    // Раньше sampleCorpusBodyMaterial хватал Столешница_core → текстура столешки на ленте.
    const material = new THREE.MeshBasicMaterial({ color: PLINTH_DEFAULT_COLOR });
    const ok = addKitchenPlinthMesh(THREE, {
      wallName: norm,
      minU,
      maxU,
      wallCoord: Number(wallCoord),
      depth,
      plinthHeightMm: h,
      thicknessMm: PLINTH_PANEL_THICKNESS_MM,
      material,
      sourceGroup: run[0].g,
    });
    if (ok) {
      plinths += 1;
      console.log('[KITCHEN-OVERLAY] plinth-run', {
        build: OVERLAY_BUILD,
        wall: norm,
        modules: run.length,
        spanU: Math.round(maxU - minU),
        h,
        carcassDepthMm: depth.carcassDepthMm,
        fromCorpus: false,
        defaultWhite: true,
      });
    }
  }
  return plinths;
}

/**
 * Синхронизировать столешницу по НМ на стене.
 * Одна плита на модуль (не склейка соседних). Стек глубины — resolveDepthStack.
 * Пенал не несёт столешку.
 */
function _placeWorktopsOnWall(THREE, norm, carriers, matTop, wtThick) {
  const useZ = norm === 'left' || norm === 'right';
  const sign = kitchenIntoRoomSign(norm);
  let worktops = 0;

  for (const g of carriers) {
    const ud = g.userData || {};
    // Явный отказ в карточке/place — без столешки (как пенал).
    if (ud.hasWorktop === false) continue;

    const sid = String(ud.sectionId ?? '_');
    const sec =
      Array.isArray(state.customSections) &&
      state.customSections.find((s) => String(s?.id) === sid);
    // Столешка по глубине — от пивота секции (стек Dwt), не от bbox.
    let wallCoord = null;
    if (sec?.group?.position) {
      wallCoord = useZ ? sec.group.position.x : sec.group.position.z;
    }
    if (wallCoord == null) continue;

    const sp = moduleWallSpanU(g, THREE, useZ);
    if (!sp || !(sp.maxU > sp.minU) || !(sp.topY > 0)) continue;

    let wtMin = sp.minU;
    let wtMax = sp.maxU;
    const expWt = expandCornerWorktopSpanU({ g, ...sp }, sec, norm);
    if (expWt) {
      wtMin = expWt.minU;
      wtMax = expWt.maxU;
    }
    if (!(wtMax > wtMin)) continue;

    const depth = resolveDepthStack(ud);
    const dwt = depth.worktopDepthMm;
    const spanU = wtMax - wtMin;
    const centerU = (wtMin + wtMax) / 2;
    const topCenterDepth = wallCoord + sign * (dwt / 2);
    const topY = sp.topY + wtThick / 2;

    let topGeom;
    let topPos;
    if (useZ) {
      topGeom = new THREE.BoxGeometry(dwt, wtThick, spanU);
      topPos = new THREE.Vector3(topCenterDepth, topY, centerU);
    } else {
      topGeom = new THREE.BoxGeometry(spanU, wtThick, dwt);
      topPos = new THREE.Vector3(centerU, topY, topCenterDepth);
    }
    hideModuleCountertopBoards(g);
    const topMesh = new THREE.Mesh(topGeom, matTop.clone());
    topMesh.name = 'KitchenWorktop';
    topMesh.userData.isKitchenRunOverlay = true;
    topMesh.userData.isKitchenWorktop = true;
    topMesh.userData[OVERLAY_WALL_KEY] = norm;
    topMesh.userData.sectionId = sid;
    topMesh.userData.furnitureId = ud.id || ud.furnitureId || null;
    topMesh.userData.kitchenDepth = depth;
    topMesh.userData.worktopThicknessMm = wtThick;
    topMesh.renderOrder = 2;
    topMesh.position.copy(topPos);
    state.scene.add(topMesh);
    worktops += 1;

    console.log('[KITCHEN-OVERLAY] module', {
      build: OVERLAY_BUILD,
      sid,
      wall: norm,
      spanU: Math.round(spanU),
      wtMin: Math.round(wtMin),
      wtMax: Math.round(wtMax),
      perModule: true,
      hasModulePlinth: carrierHasModulePlinthBoard(g),
      worktopDepthMm: dwt,
      carcassDepthMm: depth.carcassDepthMm,
      rearOverhangMm: depth.rearOverhangMm,
      plinthHeightMm: plinthHeightMm(ud),
      thick: wtThick,
    });
  }
  return worktops;
}

export function syncKitchenRunOverlaysOnWall(wallName) {
  const THREE = THREE_REF();
  if (!THREE || !state.scene) {
    return { ok: false, reason: 'no_scene' };
  }
  const wall = String(wallName || '').trim();
  const norm = wall.toLowerCase();
  if (!norm) return { ok: false, reason: 'no_wall' };

  // Снять старые overlay + вернуть доски модулей, затем собрать заново.
  const cleared = clearKitchenRunOverlaysOnWall(wall);
  const restoredWt = restoreModuleCountertopBoardsOnWall(wall);
  const restoredPl = restoreModulePlinthBoardsOnWall(wall);
  const carriers = collectKitchenBasesOnWall(wall);
  const talls = collectKitchenTallBarriersOnWall(wall);
  const plinthCarriers = collectPlinthCarriersOnWall(wall);
  const plinths = _placePlinthRunsOnWall(THREE, norm, plinthCarriers);

  if (!KITCHEN_RUN_OVERLAYS_ENABLED) {
    console.log('[KITCHEN-OVERLAY] sync', {
      build: OVERLAY_BUILD,
      wall: norm,
      worktopOverlay: false,
      plinthRun: KITCHEN_PLINTH_RUN_ENABLED,
      cleared,
      restoredWt,
      restoredPl,
      modules: carriers.length,
      plinthCarriers: plinthCarriers.length,
      plinths,
      talls: talls.length,
    });
    void talls;
    void splitCarriersIntoRuns;
    void runHasModulePlinthBoard;
    void hideModuleCountertopBoards;
    return {
      ok: true,
      disabled: !KITCHEN_PLINTH_RUN_ENABLED,
      modules: carriers.length,
      worktops: 0,
      plinths,
      talls: talls.length,
      cleared,
      restored: restoredWt + restoredPl,
    };
  }

  const fallbackMat = new THREE.MeshBasicMaterial({
    color: 0xd4c4a8,
  });
  let worktops = _placeWorktopsOnWall(
    THREE,
    norm,
    carriers,
    fallbackMat,
    worktopThicknessMm()
  );

  ensureTabletopItemsLoaded(() => {
    ensureTabletopMaterial(THREE, (mat) => {
      if (!state.scene || !mat) return;
      clearKitchenRunOverlaysOnWall(wall);
      restoreModulePlinthBoardsOnWall(wall);
      const againPl = collectPlinthCarriersOnWall(wall);
      _placePlinthRunsOnWall(THREE, norm, againPl);
      const again = collectKitchenBasesOnWall(wall);
      _placeWorktopsOnWall(THREE, norm, again, mat, worktopThicknessMm());
    });
  });

  void talls;
  void splitCarriersIntoRuns;
  void runHasModulePlinthBoard;

  return {
    ok: true,
    modules: carriers.length,
    worktops,
    plinths,
    talls: talls.length,
  };
}

/** Зазор спинка↔стена для одного модуля (мм). */
export function measureKitchenWallGapMm(furnitureGroup, section, wallNameOpt) {
  const THREE = THREE_REF();
  if (!THREE || !furnitureGroup || !section) return null;
  const wn = wallNameOpt || section.wallName || 'back';
  const wall =
    wn === 'left' || wn === 'right'
      ? section.group?.position?.x
      : section.group?.position?.z;
  if (!Number.isFinite(Number(wall))) return null;
  furnitureGroup.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(furnitureGroup);
  if (bb.isEmpty()) return null;
  let back;
  if (wn === 'back') back = bb.min.z;
  else if (wn === 'front') back = bb.max.z;
  else if (wn === 'left') back = bb.min.x;
  else back = bb.max.x;
  const sign = kitchenIntoRoomSign(wn);
  return Math.round((back - Number(wall)) * sign);
}

if (typeof window !== 'undefined') {
  window.__cldKitchenRunOverlays = {
    enabled: KITCHEN_RUN_OVERLAYS_ENABLED,
    plinthRunEnabled: KITCHEN_PLINTH_RUN_ENABLED,
    build: OVERLAY_BUILD,
    syncKitchenRunOverlaysOnWall,
    clearKitchenRunOverlaysOnWall,
    isKitchenPlinthCarrierGroup,
    measureKitchenWallGapMm,
    kitchenCarcassBackTargetFromWall,
    kitchenIntoRoomSign,
  };
}
