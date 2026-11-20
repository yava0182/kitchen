/**
 * Подсветка «пирога» НМ: полупрозрачные слои по глубине
 * (зазор у стены → корпус → фасад/свес → столешница → цоколь).
 * Вкл/выкл кнопкой на сцене; по умолчанию выключено.
 */
import { state } from '../utils/state.js';
import { isKitchenBaseGroup } from './kitchen-base-engine.js?v=20261103-wdepth5';
import {
  measureKitchenWallGapMm,
  kitchenIntoRoomSign,
} from './kitchen-run-overlays.js?v=20261027-nmu142h';

const PIE_FLAG = 'isKitchenSectionPieDebug';

const ROLE_COLORS = {
  rear_void: 0xef9a9a,
  corpus: 0xba68c8,
  front_setback: 0xffb74d,
  facades_main: 0xffa726,
  worktop: 0x81c784,
  kitchen_plinth: 0x4fc3f7,
  plinth: 0x4fc3f7,
};

const ROLE_OPACITY = {
  rear_void: 0.45,
  corpus: 0.32,
  front_setback: 0.38,
  facades_main: 0.35,
  worktop: 0.4,
  kitchen_plinth: 0.4,
  plinth: 0.35,
  default: 0.3,
};

let __enabled = false;

function THREE_REF() {
  return typeof window !== 'undefined' ? window.THREE : null;
}

function km() {
  return typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
}

function resolveDepthStack(ud) {
  const api = km();
  let worktopDepthMm =
    Number(ud?.__kitchenWorktopDepthMm) ||
    (api && typeof api.getProjectWorktopDepthMm === 'function'
      ? Number(api.getProjectWorktopDepthMm())
      : 0) ||
    600;
  // Только корпус (550/510/460). customDepth≈600 = ошибка каталога/place — не брать.
  let carcassDepthMm = Number(ud?.__kitchenCarcassDepthMm) || 0;
  const customD = Number(ud?.customDepthMm) || 0;
  const initZ = Number(ud?.__initialSectionSizeMm?.z) || 0;
  if (!(carcassDepthMm > 0) && customD > 0 && customD <= worktopDepthMm - 50) {
    carcassDepthMm = customD;
  }
  if (!(carcassDepthMm > 0) && initZ > 0 && initZ <= worktopDepthMm - 50) {
    carcassDepthMm = initZ;
  }
  if (!(carcassDepthMm > 0)) carcassDepthMm = 550;
  let frontSetback = Number(ud?.__kitchenFrontSetbackMm) || 40;
  let rearOverhang =
    Number(ud?.__kitchenRearOverhangMm) ||
    Math.max(0, worktopDepthMm - frontSetback - carcassDepthMm);
  if (!(rearOverhang > 0)) rearOverhang = 10;
  if (!(frontSetback > 0)) frontSetback = 40;
  if (api && typeof api.resolveWorktopStackDepth === 'function') {
    const st = api.resolveWorktopStackDepth({
      worktopDepthMm,
      carcassDepthMm,
    });
    if (st && st.ok) {
      worktopDepthMm = st.worktopDepthMm;
      carcassDepthMm = st.carcassDepthMm;
      frontSetback = st.frontSetbackToCarcassMm;
      rearOverhang = st.rearOverhangMm;
    }
  }
  return {
    worktopDepthMm: Math.round(worktopDepthMm),
    carcassDepthMm: Math.round(carcassDepthMm),
    frontSetbackToCarcassMm: Math.round(frontSetback),
    rearOverhangMm: Math.round(rearOverhang),
  };
}

export function isKitchenSectionPieDebugEnabled() {
  return __enabled === true;
}

function disposeObj(obj) {
  try {
    obj.traverse?.((c) => {
      c.geometry?.dispose?.();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach((m) => m?.dispose?.());
        else c.material.dispose?.();
      }
    });
    obj.parent?.remove(obj);
  } catch (_) {}
}

export function clearKitchenSectionPieDebug() {
  if (!state.scene) return;
  const toRemove = [];
  state.scene.traverse((obj) => {
    if (obj?.userData?.[PIE_FLAG]) toRemove.push(obj);
  });
  toRemove.forEach(disposeObj);
}

function roleKeyOf(obj) {
  const ud = obj?.userData || {};
  return String(ud.layoutRole || ud.layout_role || ud.sectionLayoutRole || '')
    .trim()
    .toLowerCase();
}

function addWorldBox(parent, THREE, name, role, min, max) {
  const size = new THREE.Vector3(
    Math.max(0, max.x - min.x),
    Math.max(0, max.y - min.y),
    Math.max(0, max.z - min.z)
  );
  if (!(size.x > 0.5) || !(size.y > 0.5) || !(size.z > 0.5)) return null;
  const center = new THREE.Vector3(
    (min.x + max.x) * 0.5,
    (min.y + max.y) * 0.5,
    (min.z + max.z) * 0.5
  );
  const geom = new THREE.BoxGeometry(size.x, size.y, size.z);
  const mat = new THREE.MeshBasicMaterial({
    color: ROLE_COLORS[role] ?? 0x90a4ae,
    transparent: true,
    opacity: ROLE_OPACITY[role] ?? ROLE_OPACITY.default,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.name = name;
  mesh.position.copy(center);
  mesh.renderOrder = 240;
  mesh.userData[PIE_FLAG] = true;
  mesh.userData.kitchenPieRole = role;
  parent.add(mesh);
  return mesh;
}

/**
 * Геометрический пирог по стеку глубины (видно сбоку как слои CAD).
 * Ось глубины: от стены в комнату.
 */
function addDepthStackPie(parent, THREE, furnitureGroup, section, wallName) {
  const ud = furnitureGroup.userData || {};
  const depth = resolveDepthStack(ud);
  const rear =
    Number(ud.__kitchenRearOverhangMm) ||
    depth.rearOverhangMm ||
    measureKitchenWallGapMm(furnitureGroup, section, wallName) ||
    0;
  const carcassD = Math.max(1, depth.carcassDepthMm);
  const frontSb = Math.max(0, depth.frontSetbackToCarcassMm);
  const worktopD = Math.max(carcassD + rear + frontSb, depth.worktopDepthMm);
  const worktopT = 38;
  const plinthH =
    Number(ud.hBottomMm) || Number(ud.__kitchenPlinthHeightMm) || 100;
  const carcassH =
    Number(ud.__kitchenCarcassHeightMm) ||
    Math.max(400, (Number(ud.__catalogHeightMm) || 720) - plinthH);

  furnitureGroup.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(furnitureGroup);
  if (bb.isEmpty()) return 0;

  const wn = String(wallName || 'back').toLowerCase();
  const sign = kitchenIntoRoomSign(wn);
  const alongX = wn === 'back' || wn === 'front';

  // Плоскость стены и габарит по ширине/высоте корпуса.
  let wallCoord;
  if (section?.group) {
    const p = section.group.position;
    wallCoord = alongX ? p.z : p.x;
  } else if (wn === 'back') wallCoord = bb.min.z - rear;
  else if (wn === 'front') wallCoord = bb.max.z + rear;
  else if (wn === 'left') wallCoord = bb.min.x - rear;
  else wallCoord = bb.max.x + rear;

  const widthMin = alongX ? bb.min.x : bb.min.z;
  const widthMax = alongX ? bb.max.x : bb.max.z;
  // Пол комнаты = y:0. Не брать bb.min.y — ноги/меши часто чуть уходят «под пол».
  const floorY = 0;
  const y0 = floorY;
  const yPlinth = floorY + plinthH;
  const yCorpusTop = yPlinth + carcassH;
  const yWorktopTop = yCorpusTop + worktopT;

  // Слои вдоль глубины от стены.
  const d0 = wallCoord;
  const d1 = wallCoord + sign * rear;
  const d2 = d1 + sign * carcassD;
  const d3 = d2 + sign * frontSb;
  // столешница: от стены на всю worktopD
  const dWtFar = wallCoord + sign * worktopD;

  const layer = (role, depthA, depthB, yMin, yMax) => {
    const a = Math.min(depthA, depthB);
    const b = Math.max(depthA, depthB);
    if (!(b - a > 0.5)) return;
    if (alongX) {
      addWorldBox(
        parent,
        THREE,
        `KitchenPie_${role}`,
        role,
        { x: widthMin, y: yMin, z: a },
        { x: widthMax, y: yMax, z: b }
      );
    } else {
      addWorldBox(
        parent,
        THREE,
        `KitchenPie_${role}`,
        role,
        { x: a, y: yMin, z: widthMin },
        { x: b, y: yMax, z: widthMax }
      );
    }
  };

  // 1) зазор у стены (красный)
  if (rear > 0.5) layer('rear_void', d0, d1, yPlinth, yCorpusTop);
  // 2) корпус (фиолетовый)
  layer('corpus', d1, d2, yPlinth, yCorpusTop);
  // 3) передний свес / зона фасада (оранжевый)
  if (frontSb > 0.5) layer('front_setback', d2, d3, yPlinth, yCorpusTop);
  // 4) столешница (зелёная) — на всю глубину
  layer('worktop', d0, dWtFar, yCorpusTop, yWorktopTop);
  // 5) цоколь (голубой) — под корпусом по глубине корпуса
  if (plinthH > 0.5) layer('kitchen_plinth', d1, d2, y0, yPlinth);

  return 5;
}

function collectRoleRoots(furnitureGroup) {
  /** @type {Map<string, import('three').Object3D[]>} */
  const byRole = new Map();
  if (!furnitureGroup) return byRole;
  furnitureGroup.traverse((obj) => {
    if (!obj?.isGroup && !obj?.isObject3D) return;
    const role = roleKeyOf(obj);
    if (!role || role === 'cabinet_root') return;
    const parentRole = roleKeyOf(obj.parent);
    if (parentRole === role) return;
    if (!byRole.has(role)) byRole.set(role, []);
    byRole.get(role).push(obj);
  });
  return byRole;
}

function addBoxFromWorldBBox(parent, THREE, name, role, box) {
  if (!box || box.isEmpty()) return null;
  return addWorldBox(parent, THREE, name, role, box.min, box.max);
}

function buildPieForFurniture(furnitureGroup, THREE) {
  const root = new THREE.Group();
  root.name = 'KitchenSectionPieDebug';
  root.userData[PIE_FLAG] = true;
  root.userData.furnitureUuid = furnitureGroup.uuid;

  const ud = furnitureGroup.userData || {};
  const wallName = ud.wallName || 'back';
  const section =
    Array.isArray(state.customSections) &&
    state.customSections.find((s) => s && String(s.id) === String(ud.sectionId));

  // Главное: геометрический стек (то, что видно «сбоку» как пирог).
  addDepthStackPie(root, THREE, furnitureGroup, section, wallName);

  // Дополнительно — bbox по layout_role, если роли есть в модели.
  const byRole = collectRoleRoots(furnitureGroup);
  for (const [role, nodes] of byRole) {
    if (!ROLE_COLORS[role] && !/^facades/.test(role) && role !== 'plinth') continue;
    // Стек уже рисует corpus/plinth/worktop — роли фасада можно добавить тонко.
    if (role === 'corpus' || role === 'plinth' || role === 'worktop') continue;
    const union = new THREE.Box3();
    let any = false;
    for (const n of nodes) {
      try {
        n.updateMatrixWorld(true);
        const b = new THREE.Box3().setFromObject(n);
        if (!b.isEmpty()) {
          if (!any) {
            union.copy(b);
            any = true;
          } else union.union(b);
        }
      } catch (_) {}
    }
    if (!any) continue;
    addBoxFromWorldBBox(root, THREE, `KitchenPie_role_${role}`, role, union);
  }

  root.visible = __enabled;
  return root;
}

export function syncKitchenSectionPieDebug() {
  clearKitchenSectionPieDebug();
  if (!__enabled || !state.scene) return { ok: true, count: 0 };
  const THREE = THREE_REF();
  if (!THREE) return { ok: false, reason: 'no_three' };

  let count = 0;
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (!isKitchenBaseGroup(obj)) return;
    const pie = buildPieForFurniture(obj, THREE);
    if (pie.children.length) {
      state.scene.add(pie);
      count += 1;
    }
  });
  console.log('[KITCHEN-PIE] sync', { enabled: __enabled, modules: count });
  return { ok: true, count };
}

export function setKitchenSectionPieDebugEnabled(enabled) {
  __enabled = !!enabled;
  if (typeof window !== 'undefined') {
    window.__CLD_KITCHEN_SECTION_PIE = __enabled;
  }
  if (!__enabled) {
    clearKitchenSectionPieDebug();
    return { ok: true, enabled: false, count: 0 };
  }
  const r = syncKitchenSectionPieDebug();
  return { ok: !!r?.ok, enabled: true, count: r?.count || 0 };
}

export function toggleKitchenSectionPieDebug() {
  return setKitchenSectionPieDebugEnabled(!__enabled);
}

if (typeof window !== 'undefined') {
  window.__CLD_KITCHEN_SECTION_PIE = false;
  window.__cldKitchenSectionPieDebug = {
    isEnabled: isKitchenSectionPieDebugEnabled,
    setEnabled: setKitchenSectionPieDebugEnabled,
    toggle: toggleKitchenSectionPieDebug,
    sync: syncKitchenSectionPieDebug,
    clear: clearKitchenSectionPieDebug,
  };
}
