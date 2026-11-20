/**
 * WIPED — манифест старого v0 света удалён.
 */
export const IKEA_V0_MANIFEST_SCHEMA = 'ikea-v0-manifest-wiped';
export const IKEA_V0_CACHE_BUST = '20261110-lightWipe1';
export const IKEA_V0_ACTIVE_PHASE = 0;
export const IKEA_V0_RUNBOOK = Object.freeze([]);
export const IKEA_V0_PHASES = Object.freeze([]);
export const CLD_IKEA_LIGHT_FROZEN = true;

export function auditIkeaV0Manifest() {
  return {
    schema: IKEA_V0_MANIFEST_SCHEMA,
    cacheBust: IKEA_V0_CACHE_BUST,
    activePhase: 0,
    wiped: true,
    note: 'v0 light deleted — pending Exp14 lab port',
  };
}
