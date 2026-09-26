/**
 * Gate: room-betrakta-* заблокирован; активен ikea-room-light-v0.js (комната + C1 шкаф/обклад).
 * Шкаф: room-cabinet-studio.js bindMeshToIkeaV0, kind trim = cabinet.
 */
import { auditIkeaV0Manifest } from './ikea-v0-manifest.js?v=20260904-ikea-r3j86';

export const CLD_IKEA_LIGHT_PHASE = 'v0';

/** true = room-betrakta-* / installBetrakta / bindBetrakta — no-op */
export const CLD_IKEA_LIGHT_FROZEN = true;

export const CLD_IKEA_OLD_LIGHT_MODULES = Object.freeze([
  'room-betrakta-lighting.js',
  'room-betrakta-pbr.js',
  'room-betrakta-soft-ao.js',
  'room-soft-shadow.js',
]);

export const CLD_IKEA_BLOCKED_SPOT_NAME = '__cld_betrakta_spot';
export const CLD_IKEA_V0_SPOT_NAME = '__cld_ikea_v0_spot';

export function isIkeaRoomLightV0() {
  return CLD_IKEA_LIGHT_PHASE === 'v0';
}

export function isIkeaLightFrozen() {
  return CLD_IKEA_LIGHT_FROZEN;
}

export function auditIkeaLightBlocked(scene, extra = {}) {
  const lights = [];
  scene?.traverse?.((o) => {
    if (!o?.isLight) return;
    lights.push({ name: o.name || '', type: o.type });
  });

  let v0Meshes = 0;
  scene?.traverse?.((o) => {
    if (!o.isMesh || !o.material) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m) => {
      if (m.userData?.__cldIkeaV0) v0Meshes += 1;
    });
  });

  const oldSpotPresent = !!scene?.getObjectByName?.(CLD_IKEA_BLOCKED_SPOT_NAME);
  const manifest = auditIkeaV0Manifest();

  return {
    pass:
      CLD_IKEA_LIGHT_FROZEN &&
      lights.length === 0 &&
      !oldSpotPresent &&
      (v0Meshes > 0 || !scene),
    frozen: CLD_IKEA_LIGHT_FROZEN,
    phase: CLD_IKEA_LIGHT_PHASE,
    manifest,
    lights,
    v0MeshesBound: v0Meshes,
    oldSpotPresent,
    composer: !!extra.composer,
    sceneEnvironment: !!extra.sceneEnvironment,
  };
}

/** Stubs — старый bundle не грузится. */
export function installBetraktaLighting() {
  return { ok: false, blocked: true, phase: CLD_IKEA_LIGHT_PHASE };
}

export function syncBetraktaLighting() {}

export function teardownBetraktaLighting() {}
