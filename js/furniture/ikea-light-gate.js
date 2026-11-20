/**
 * WIPED — старый свет комнаты снят. Lab порт — отдельной задачей.
 */
export const CLD_IKEA_LIGHT_PHASE = 'wiped';
export const CLD_IKEA_LIGHT_FROZEN = true;

export const CLD_IKEA_OLD_LIGHT_MODULES = Object.freeze([
  'room-betrakta-lighting.js',
  'room-betrakta-pbr.js',
  'room-betrakta-soft-ao.js',
  'room-soft-shadow.js',
  'ikea-room-light-v0.js',
]);

export const CLD_IKEA_BLOCKED_SPOT_NAME = '__cld_betrakta_spot';
export const CLD_IKEA_V0_SPOT_NAME = '__cld_ikea_v0_spot';

export function isIkeaRoomLightV0() {
  return false;
}

export function isIkeaLightFrozen() {
  return true;
}

export function auditIkeaLightBlocked(scene, extra = {}) {
  const lights = [];
  scene?.traverse?.((o) => {
    if (!o?.isLight) return;
    lights.push({ name: o.name || '', type: o.type });
  });
  return {
    pass: lights.length === 0,
    frozen: true,
    phase: CLD_IKEA_LIGHT_PHASE,
    wiped: true,
    lights,
    v0MeshesBound: 0,
    oldSpotPresent: false,
    composer: !!extra.composer,
    sceneEnvironment: !!extra.sceneEnvironment,
  };
}

export function installBetraktaLighting() {
  return { ok: false, blocked: true, phase: CLD_IKEA_LIGHT_PHASE, wiped: true };
}

export function syncBetraktaLighting() {}

export function teardownBetraktaLighting() {}
