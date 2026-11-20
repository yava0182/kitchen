/**
 * Режим как admin transparentOutlineMode.
 * В комнате панели на IKEA v0 ShaderMaterial (fragColor.a всегда 1) —
 * opacity Three.js не работает. Поэтому при «Контуры» подменяем материал
 * панели на простой прозрачный + EdgesGeometry (как updateOutlineModes),
 * крепёж — aluminium.
 */
import { state } from '../utils/state.js';
import * as THREE from 'three';

let _xrayOn = false;

const JOINT_ALUMINIUM_COLOR = 12435135; // 0xBDBDBF — как admin
let _jointAluminiumMaterial = null;
let _xrayPanelMaterial = null;

function getJointAluminiumMaterial() {
  if (_jointAluminiumMaterial) return _jointAluminiumMaterial;
  _jointAluminiumMaterial = new THREE.MeshPhongMaterial({
    color: JOINT_ALUMINIUM_COLOR,
    specular: 0x444444,
    shininess: 40,
    side: THREE.DoubleSide,
    depthTest: true,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  _jointAluminiumMaterial.userData = { __cldJointAluminium: 1 };
  return _jointAluminiumMaterial;
}

/** Как admin transparentOutline: белые лица opacity 0.03, depthWrite off. */
function getXrayPanelMaterial() {
  if (_xrayPanelMaterial) return _xrayPanelMaterial;
  _xrayPanelMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.03,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  _xrayPanelMaterial.userData = { __cldRoomXrayPanel: 1 };
  return _xrayPanelMaterial;
}

function isFurnitureRoot(o) {
  return !!(o?.isObject3D && o.userData?.isFurniture);
}

function isUnderFurniture(o) {
  let p = o;
  for (let i = 0; i < 24 && p; i++) {
    if (p.userData?.isFurniture) return true;
    p = p.parent;
  }
  return false;
}

function meshIsJointSchemeHardware(mesh) {
  if (!mesh?.isMesh) return false;
  const ud = mesh.userData || {};
  if (ud.jointHardwareMesh || ud.joint_hardware || ud.fromJointScheme) return true;
  if (Number(ud.jointTemplateModel) === 1 || Number(ud.jointTemplateFrame) === 1) return true;
  let p = mesh;
  for (let i = 0; i < 24 && p; i++) {
    const pud = p.userData || {};
    if (pud.fromJointScheme) return true;
    if (Number(pud.joint_hardware) === 1 || Number(pud.jointTemplateModel) === 1) return true;
    if (Number(pud.spec?.joint_hardware) === 1 || Number(pud.spec?.joint_template_model) === 1) {
      return true;
    }
    if (Number(pud.spec?.joint_template_frame) === 1) return true;
    if (/Конфирм|Эксцентр|Крепёж|Крепеж/i.test(String(p.name || ''))) return true;
    p = p.parent;
  }
  return false;
}

function shouldSkipMesh(o) {
  if (!o?.isMesh || !o.material) return true;
  const ud = o.userData || {};
  if (ud.isEdgesHelper || ud.isRoomFurnitureXrayEdges) return true;
  if (ud.isSectionVolume || ud.isWallAo || ud.isContactShadow) return true;
  if (ud.furniDrillHole || ud.isHole || ud.previewOnly) return true;
  if (ud.isKitchenRunOverlay) return true;
  if (String(o.name || '').startsWith('__cld_')) return true;
  return false;
}

/** Панель корпуса/полки — не фурнитура. IKEA v0 corpus/facade/back/trim тоже панели. */
function isPanelMesh(o) {
  if (shouldSkipMesh(o)) return false;
  if (meshIsJointSchemeHardware(o)) return false;
  const ud = o.userData || {};
  if (ud.isAccessory && !ud.__cldIkeaV0Cabinet && !isIkeaPanelKind(o)) return false;
  // Ручки/петли/опоры — не панели
  if (ud.cldSupportLeg || ud.cldHingeCatalogModel || ud.cldGuideCabinetModel) return false;
  if (ud.roomHandle || ud.isHingeCabinetModelMetal) return false;
  if (isIkeaPanelKind(o)) return true;
  // Обычный LDSP wall/core без isAccessory
  if (!ud.isAccessory) return true;
  return false;
}

function isIkeaPanelKind(o) {
  const mats = Array.isArray(o.material) ? o.material : [o.material];
  for (const m of mats) {
    const kind = m?.userData?.__cldIkeaV0Kind || o.userData?.__cldIkeaV0Kind;
    if (
      kind === 'corpus' ||
      kind === 'facade' ||
      kind === 'back' ||
      kind === 'trim' ||
      kind === 'shelf' ||
      kind === 'drawer'
    ) {
      return true;
    }
    if (m?.userData?.__cldIkeaV0Cabinet) return true;
  }
  return !!o.userData?.__cldIkeaV0Cabinet;
}

function ensureEdgesHelper(mesh) {
  if (mesh.userData.__edgesHelper || !mesh.geometry) return mesh.userData.__edgesHelper || null;
  try {
    const edgesGeom = new THREE.EdgesGeometry(mesh.geometry, 1);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x111111,
      transparent: false,
      opacity: 1,
      depthTest: true,
      depthWrite: false,
      toneMapped: false,
    });
    const edges = new THREE.LineSegments(edgesGeom, lineMat);
    edges.name = '__clodis_edges_helper';
    edges.userData.isEdgesHelper = true;
    edges.userData.isRoomFurnitureXrayEdges = true;
    edges.renderOrder = 25;
    edges.visible = false;
    mesh.add(edges);
    mesh.userData.__edgesHelper = edges;
    return edges;
  } catch (_) {
    return null;
  }
}

function stashAndSetPanelXray(mesh, on) {
  const edges = ensureEdgesHelper(mesh);
  if (on) {
    if (!Object.prototype.hasOwnProperty.call(mesh.userData, '__xrayMatStash')) {
      mesh.userData.__xrayMatStash = mesh.material;
    }
    mesh.material = getXrayPanelMaterial();
    mesh.visible = true;
    if (edges) {
      edges.visible = true;
      edges.renderOrder = 25;
      if (edges.material) {
        edges.material.color?.setHex?.(0x111111);
        if ('toneMapped' in edges.material) edges.material.toneMapped = false;
        edges.material.needsUpdate = true;
      }
    }
  } else {
    if (Object.prototype.hasOwnProperty.call(mesh.userData, '__xrayMatStash')) {
      mesh.material = mesh.userData.__xrayMatStash;
      delete mesh.userData.__xrayMatStash;
    }
    if (edges) edges.visible = false;
  }
}

function stashAndSetJointAluminium(mesh, on) {
  if (on) {
    if (!Object.prototype.hasOwnProperty.call(mesh.userData, '__xrayMatStash')) {
      mesh.userData.__xrayMatStash = mesh.material;
    }
    mesh.material = getJointAluminiumMaterial();
    mesh.visible = true;
    mesh.frustumCulled = false;
    mesh.renderOrder = Math.max(Number(mesh.renderOrder) || 0, 40);
    mesh.userData.jointHardwareMesh = 1;
    mesh.userData.isAccessory = true;
  } else if (Object.prototype.hasOwnProperty.call(mesh.userData, '__xrayMatStash')) {
    mesh.material = mesh.userData.__xrayMatStash;
    delete mesh.userData.__xrayMatStash;
  }
}

function collectFurnitureRoots(scene) {
  const roots = [];
  scene.traverse((o) => {
    if (isFurnitureRoot(o)) roots.push(o);
  });
  return roots;
}

function applyOutlineModesToRoots(on) {
  const scene = state?.scene || (typeof window !== 'undefined' ? window.__cldRoomScene : null);
  if (!scene) return { panels: 0, joints: 0, accessories: 0, furnitureRoots: 0 };

  let panels = 0;
  let joints = 0;
  let accessories = 0;

  const roots = collectFurnitureRoots(scene);
  const visit = (fn) => {
    if (roots.length) {
      roots.forEach((r) => r.traverse(fn));
      return;
    }
    scene.traverse((o) => {
      if (isUnderFurniture(o) || isFurnitureRoot(o)) fn(o);
    });
  };

  visit((o) => {
    if (shouldSkipMesh(o)) return;

    if (meshIsJointSchemeHardware(o)) {
      joints += 1;
      stashAndSetJointAluminium(o, on);
      return;
    }

    if (isPanelMesh(o)) {
      panels += 1;
      stashAndSetPanelXray(o, on);
      return;
    }

    // Прочий accessory — не трогаем (опоры/ручки остаются как есть).
    if (o.userData?.isAccessory) accessories += 1;
  });

  return { panels, joints, accessories, furnitureRoots: roots.length };
}

export function getRoomFurnitureXray() {
  return !!_xrayOn;
}

export function setRoomFurnitureXray(on) {
  _xrayOn = !!on;
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('cld-room-furniture-xray', _xrayOn);
  }
  if (typeof window !== 'undefined') {
    window.outlineMode = _xrayOn;
    window.transparentOutlineMode = _xrayOn;
  }
  const stats = applyOutlineModesToRoots(_xrayOn);
  console.log('[ROOM-XRAY]', _xrayOn ? 'on (swap IKEA→transparent)' : 'off', stats);
  if (_xrayOn && stats.panels === 0) {
    console.warn('[ROOM-XRAY] panels=0 — не нашли панели для подмены материала');
  }
  if (_xrayOn && stats.joints === 0) {
    console.warn('[ROOM-XRAY] joints=0 — крепёж в сцене не найден');
  }
  return _xrayOn;
}

export function toggleRoomFurnitureXray() {
  return setRoomFurnitureXray(!_xrayOn);
}

export function refreshRoomFurnitureXray() {
  if (!_xrayOn) return false;
  applyOutlineModesToRoots(true);
  return true;
}

if (typeof window !== 'undefined') {
  window.__cldGetRoomFurnitureXray = getRoomFurnitureXray;
  window.__cldSetRoomFurnitureXray = setRoomFurnitureXray;
  window.__cldToggleRoomFurnitureXray = toggleRoomFurnitureXray;
  window.__cldRefreshRoomFurnitureXray = refreshRoomFurnitureXray;
}
