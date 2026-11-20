/**
 * IKEA_PORT lifecycle — boot / teardown / window console API.
 * Does not install lab lighting or post.
 */
import { state } from '../utils/state.js';
import {
  getClodisRenderMode,
  isIkeaPortMode,
  setClodisRenderMode,
  describeClodisRenderMode,
  CLODIS_RENDER_MODE_IKEA_PORT,
  CLODIS_RENDER_MODE_CURRENT,
} from './render-mode.js';
import {
  installIkeaPortRenderer,
  renderIkeaPortFrame,
  disposeIkeaPortRenderer,
  auditIkeaPortRenderer,
  setIkeaPortSsaoEnabled,
  isIkeaPortSsaoEnabled,
  setIkeaPortMsaaSamples,
  getIkeaPortMsaaSamples,
  setIkeaPortBloomEnabled,
  isIkeaPortBloomEnabled,
  setIkeaPortFinalEnabled,
  isIkeaPortFinalEnabled,
  setIkeaPortGeometricAaEnabled,
  isIkeaPortGeometricAaEnabled,
  setIkeaPortSkyEnabled,
  isIkeaPortSkyEnabled,
} from './ikea-port-renderer.js?v=20261118-adminWt1';
import {
  describeIkeaPortParityMaterials,
  preloadIkeaPortLiveOakMap,
} from './ikea-port-parity-materials.js?v=20261118-adminWt1';
import {
  IKEA_PORT_SPECULAR_AO,
  IKEA_PORT_GEO_AA,
  IKEA_PORT_SKY,
  IKEA_PORT_MSAA,
} from './ikea-port-config.js';

/** @type {{ booted: boolean, bootResult: object|null }} */
const _life = {
  booted: false,
  bootResult: null,
};

/**
 * Call once from init() when mode is IKEA_PORT (instead of installIkeaKitchenLighting).
 */
export function bootIkeaPortPipeline() {
  if (!isIkeaPortMode()) {
    return { ok: false, reason: 'not-ikea-port-mode', mode: getClodisRenderMode() };
  }
  if (!state.renderer || !state.scene || !state.camera) {
    return { ok: false, reason: 'no-scene-or-renderer' };
  }

  // Hard guarantees: no leftover composer / env from CURRENT if somehow present.
  try {
    state.composer = null;
    state.ssaaPass = null;
    state.gtaoPass = null;
    state.n8aoPass = null;
    state.smaaPass = null;
  } catch (_) {}
  try {
    if (state.scene.environment) {
      state.scene.environment.dispose?.();
      state.scene.environment = null;
    }
    if ('environmentIntensity' in state.scene) state.scene.environmentIntensity = 0;
  } catch (_) {}

  // Remove any Three lights that may exist (should be empty if lab never installed).
  try {
    const doomed = [];
    state.scene.traverse((o) => {
      if (o.isLight) doomed.push(o);
    });
    for (const L of doomed) {
      L.parent?.remove(L);
      L.dispose?.();
    }
    if (state.lights) state.lights = {};
  } catch (_) {}

  const installed = installIkeaPortRenderer(state.renderer);
  _life.booted = !!installed.ok;
  _life.bootResult = installed;
  try { preloadIkeaPortLiveOakMap(); } catch (_) {}

  if (typeof window !== 'undefined') {
    window.__cldIkeaPort = {
      mode: CLODIS_RENDER_MODE_IKEA_PORT,
      boot: bootIkeaPortPipeline,
      render: () => renderIkeaPortFrame(state.renderer, state.scene, state.camera),
      dispose: disposeIkeaPortPipeline,
      audit: auditIkeaPortPipeline,
      describe: describeClodisRenderMode,
      switchToCurrent: () => ({ ok: false, labRetired: true, mode: CLODIS_RENDER_MODE_IKEA_PORT }),
      switchToPort: () => setClodisRenderMode(CLODIS_RENDER_MODE_IKEA_PORT, { reload: true }),
      /** Stage 6 diagnostic: SSAO ON/OFF (IKEA_PORT only). */
      setSsao: (on) => setIkeaPortSsaoEnabled(!!on),
      getSsao: () => isIkeaPortSsaoEnabled(),
      toggleSsao: () => setIkeaPortSsaoEnabled(!isIkeaPortSsaoEnabled()),
      /** OpaqueLit beauty MSAA (dump samples=4) — зубчики. */
      setMsaa: (n) => setIkeaPortMsaaSamples(n),
      getMsaa: () => getIkeaPortMsaaSamples(),
      toggleMsaa: () => {
        const cur = getIkeaPortMsaaSamples();
        return setIkeaPortMsaaSamples(cur.want > 0 ? 0 : IKEA_PORT_MSAA.samples);
      },
      msaa: () => ({ ...IKEA_PORT_MSAA, ...getIkeaPortMsaaSamples() }),
      /** Stage 7 diagnostic: Bloom ON/OFF (IKEA_PORT only). */
      setBloom: (on) => setIkeaPortBloomEnabled(!!on),
      getBloom: () => isIkeaPortBloomEnabled(),
      toggleBloom: () => setIkeaPortBloomEnabled(!isIkeaPortBloomEnabled()),
      /** Stage 8 diagnostic: Final Uncharted2+γ+dither ON/OFF (IKEA_PORT only). */
      setFinal: (on) => setIkeaPortFinalEnabled(!!on),
      getFinal: () => isIkeaPortFinalEnabled(),
      toggleFinal: () => setIkeaPortFinalEnabled(!isIkeaPortFinalEnabled()),
      /** Geometric specular AA (зубчики) ON/OFF. */
      setGeoAa: (on) => setIkeaPortGeometricAaEnabled(!!on),
      getGeoAa: () => isIkeaPortGeometricAaEnabled(),
      toggleGeoAa: () => setIkeaPortGeometricAaEnabled(!isIkeaPortGeometricAaEnabled()),
      /** Dump Sky cube (RGBM + depth xyww) ON/OFF. */
      setSky: (on) => setIkeaPortSkyEnabled(!!on),
      getSky: () => isIkeaPortSkyEnabled(),
      toggleSky: () => setIkeaPortSkyEnabled(!isIkeaPortSkyEnabled()),
      parityMats: describeIkeaPortParityMaterials,
      specularAo: () => ({ ...IKEA_PORT_SPECULAR_AO }),
      geoAa: () => ({ ...IKEA_PORT_GEO_AA, enabled: isIkeaPortGeometricAaEnabled() }),
      sky: () => ({ ...IKEA_PORT_SKY, enabled: isIkeaPortSkyEnabled() }),
    };
  }

  console.warn('[IKEA_PORT] Stage8 boot', installed);
  return { ok: !!installed.ok, ...installed, mode: getClodisRenderMode() };
}

export function disposeIkeaPortPipeline() {
  const d = disposeIkeaPortRenderer();
  _life.booted = false;
  return d;
}

export function auditIkeaPortPipeline() {
  return {
    mode: getClodisRenderMode(),
    ikeaPort: isIkeaPortMode(),
    booted: _life.booted,
    bootResult: _life.bootResult,
    renderer: auditIkeaPortRenderer(),
    labLightingGlobal: typeof window !== 'undefined' ? !!window.__cldIkeaKitchenLighting : false,
    composer: !!state.composer,
  };
}

export { renderIkeaPortFrame, isIkeaPortMode, getClodisRenderMode };
