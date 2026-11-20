/**
 * WIPED — старый IKEA v0 room light удалён.
 * Заглушки, чтобы импорты не падали до порта света из Exp14 lab.
 * Не восстанавливать тело v0 отсюда.
 */
console.warn('[LIGHT] dead stub · room light = IKEA_PORT only');

export const IKEA_V0_SOFT_LAYER = 2;
export const IKEA_V0_SOFT_AO_SILHOUETTE_LAYER = 4;
export const IKEA_V0_SOFT_FLOOR_LAYER = 5;
export const IKEA_V0_SPOT_SHADOW_LAYER = 3;

export function bindMeshToIkeaV0() {
  return false;
}

export function syncIkeaV0MaterialsUnderRoot() {
  return 0;
}

export function syncIkeaRoomLightV0() {}

export function installIkeaRoomLightV0() {
  return { bound: 0, blocked: true, phase: 'wiped', note: 'v0 deleted — lab port next' };
}

export function rebindIkeaRoomLightV0() {
  return { bound: 0, blocked: true, phase: 'wiped' };
}

export async function loadIkeaRoomEnvV0() {}

export function resyncIkeaRoomFloorMap() {
  return false;
}

export function applyIkeaV0MeshDecorFromStep5() {
  return false;
}

export function applyIkeaV0MeshDecorFromStep5ToMesh() {
  return false;
}

export function applyIkeaV0CatalogMaterialToMesh() {
  return false;
}

export function copyIkeaV0VisualFromCoreToEdge() {
  return false;
}

export function ikeaV0BindOptsFromMaterial() {
  return {};
}

export function ikeaV0BindOptsFromCatalogParams() {
  return {};
}

export function ensureIkeaHdrPipelineReady() {
  return null;
}

export function initIkeaHdrDisplayPipeline() {
  return null;
}

export function reinitIkeaHdrAfterWebGlRestore() {
  return { ok: false, reason: 'wiped' };
}

export function isIkeaHdrDisplayActive() {
  return false;
}

if (typeof window !== 'undefined') {
  window.__cldInstallIkeaRoomLightV0 = undefined;
  window.__cldSyncIkeaRoomLightV0 = undefined;
  window.__cldIkeaV0SetLed = undefined;
  window.__cldIkeaV0GetLed = undefined;
  window.__cldEnsureIkeaHdrPipeline = undefined;
  window.__cldIsIkeaHdrDisplayActive = () => false;
}
