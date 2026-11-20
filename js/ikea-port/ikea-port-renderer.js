/**
 * IKEA_PORT Stage 8 renderer —
 * Shadow → Phong HDR → SSAO → Bloom (HDR out) → Uncharted2 + γ + dither → screen
 */
import { THREE } from './three-shared.js';
import { loadIkeaPortAssets, disposeIkeaPortAssets } from './ikea-port-assets.js';
import {
  applyIkeaPortPhongProxies,
  disposeIkeaPortPhongProxies,
} from './ikea-port-material-adapter.js?v=20261118-adminWt1';
import {
  installIkeaPortShadowPass,
  updateIkeaPortShadowMap,
  disposeIkeaPortShadowPass,
  auditIkeaPortShadowPass,
} from './ikea-port-shadow-pass.js';
import {
  installIkeaPortSsao,
  disposeIkeaPortSsao,
  auditIkeaPortSsao,
  renderIkeaPortBeautyToSsaoBuffers,
  applyIkeaPortSsaoToLitHdr,
  getIkeaPortLitHdrTexture,
  getIkeaPortLitHdrSize,
  setIkeaPortSsaoEnabled,
  isIkeaPortSsaoEnabled,
  setIkeaPortMsaaSamples,
  getIkeaPortMsaaSamples,
} from './ikea-port-ssao.js';
import {
  installIkeaPortBloom,
  disposeIkeaPortBloom,
  auditIkeaPortBloom,
  applyIkeaPortBloom,
  getIkeaPortBloomOutputTexture,
  setIkeaPortBloomEnabled,
  isIkeaPortBloomEnabled,
} from './ikea-port-bloom.js';
import {
  installIkeaPortFinalImage,
  disposeIkeaPortFinalImage,
  auditIkeaPortFinalImage,
  applyIkeaPortFinalImage,
  setIkeaPortFinalEnabled,
  isIkeaPortFinalEnabled,
} from './ikea-port-final-image.js';
import {
  installIkeaPortSky,
  syncIkeaPortSky,
  disposeIkeaPortSky,
  auditIkeaPortSky,
  setIkeaPortSkyEnabled,
  isIkeaPortSkyEnabled,
} from './ikea-port-sky.js';
import {
  setIkeaPortGeometricAaEnabled,
  isIkeaPortGeometricAaEnabled,
} from './ikea-port-phong-shader.js';

const CLEAR = 0xd8dde3;

/** Vite ?v= duplicates ESM — keep one renderer runtime across module copies. */
const _g = typeof window !== 'undefined' ? window : globalThis;

/** @type {{
 *   installed: boolean,
 *   assets: import('./ikea-port-assets.js').IkeaPortAssets|null,
 *   assetsPromise: Promise<any>|null,
 *   frames: number,
 *   lastError: string|null,
 *   glErrorCount: number,
 *   lightingReady: boolean,
 *   shadowReady: boolean,
 *   ssaoReady: boolean,
 *   bloomReady: boolean,
 *   finalReady: boolean,
 *   skyReady: boolean,
 * }} */
const _state = _g.__CLD_IKEA_RENDERER_STATE__ || (_g.__CLD_IKEA_RENDERER_STATE__ = {
  installed: false,
  assets: null,
  assetsPromise: null,
  frames: 0,
  lastError: null,
  glErrorCount: 0,
  lightingReady: false,
  shadowReady: false,
  ssaoReady: false,
  bloomReady: false,
  finalReady: false,
  skyReady: false,
});

function drainGlErrors(renderer) {
  let n = 0;
  try {
    const gl = renderer?.getContext?.();
    if (!gl || typeof gl.getError !== 'function') return 0;
    let err = gl.getError();
    while (err !== gl.NO_ERROR && n < 32) {
      n += 1;
      err = gl.getError();
    }
  } catch (_) {}
  return n;
}

/**
 * @param {THREE.WebGLRenderer} renderer
 */
export function installIkeaPortRenderer(renderer) {
  if (!renderer) return { ok: false, reason: 'no-renderer' };

  try {
    renderer.shadowMap.enabled = false;
    if ('toneMapping' in renderer && THREE.NoToneMapping !== undefined) {
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.toneMappingExposure = 1;
    }
    // Final pass does γ2.2 in shader — LinearSRGB prevents second sRGB encode.
    if ('outputColorSpace' in renderer && THREE.LinearSRGBColorSpace !== undefined) {
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    }
    renderer.setClearColor(CLEAR, 1);
    if (typeof renderer.setRenderTarget === 'function') {
      renderer.setRenderTarget(null);
    }
  } catch (e) {
    _state.lastError = String(e?.message || e);
    return { ok: false, reason: 'configure-failed', error: _state.lastError };
  }

  const shadowInstall = installIkeaPortShadowPass();
  _state.shadowReady = !!shadowInstall.ok;

  const ssaoInstall = installIkeaPortSsao();
  _state.ssaoReady = !!ssaoInstall.ok;

  const bloomInstall = installIkeaPortBloom();
  _state.bloomReady = !!bloomInstall.ok;
  if (!bloomInstall.ok) {
    console.warn('[IKEA_PORT] Stage7 Bloom install failed', bloomInstall);
  }

  const finalInstall = installIkeaPortFinalImage();
  _state.finalReady = !!finalInstall.ok;
  if (!finalInstall.ok) {
    console.warn('[IKEA_PORT] Stage8 Final install failed', finalInstall);
  }

  _state.installed = true;
  _state.frames = 0;
  _state.glErrorCount = 0;
  _state.lightingReady = false;
  drainGlErrors(renderer);

  _state.assetsPromise = loadIkeaPortAssets()
    .then((assets) => {
      _state.assets = assets;
      _state.lightingReady = true;
      const skyInstall = installIkeaPortSky(assets.envMapMip0 || null);
      _state.skyReady = !!skyInstall.ok;
      if (!skyInstall.ok) {
        console.warn('[IKEA_PORT] Sky install failed', skyInstall);
      }
      console.warn('[IKEA_PORT] Stage8 ready', {
        hasCube: !!assets.envMapMip0,
        shadow: shadowInstall,
        ssao: ssaoInstall,
        bloom: bloomInstall,
        final: finalInstall,
        sky: skyInstall,
        geoAa: isIkeaPortGeometricAaEnabled(),
      });
      return assets;
    })
    .catch((err) => {
      _state.lastError = String(err?.message || err);
      console.warn('[IKEA_PORT] Stage8 asset load failed', _state.lastError);
      return null;
    });

  return {
    ok: true,
    mode: 'IKEA_PORT',
    stage: 8,
    lighting: 'Phong + SH9 + IBL + Vogel + SSAO + Bloom + Uncharted2 + γ + dither + GeoAA + Sky',
    shadow: shadowInstall,
    ssao: ssaoInstall,
    bloom: bloomInstall,
    final: finalInstall,
    geoAa: isIkeaPortGeometricAaEnabled(),
    mutatesSourceMaterials: false,
    usesMeshStandardGGX: false,
    usesThreeShadowMap: false,
    usesLabShadows: false,
    usesLabSsao: false,
    usesLabBloom: false,
    usesUnrealBloom: false,
    usesComposer: false,
    usesThreeACES: false,
    usesLabOdt: false,
  };
}

/**
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {THREE.Camera} camera
 * @returns {boolean}
 */
export function renderIkeaPortFrame(renderer, scene, camera) {
  if (!_state.installed || !renderer || !scene || !camera) return false;

  const prevAutoClear = renderer.autoClear;
  let restore = null;
  try {
    if (_state.lightingReady && _state.assets) {
      // Как Exp14 lab: shadow map всегда (и в 2D — L на плане как в лабе).
      if (_state.shadowReady) {
        updateIkeaPortShadowMap(renderer, scene, { force: true });
      }

      if (_state.skyReady) {
        syncIkeaPortSky(camera, scene);
      }

      restore = applyIkeaPortPhongProxies(scene, _state.assets);
      const prevOverride = renderer.overrideMaterial;
      renderer.overrideMaterial = null;

      if (_state.ssaoReady) {
        // 2) Phong → beauty HDR+depth
        renderIkeaPortBeautyToSsaoBuffers(renderer, scene, camera);
        // 3) SSAO → litHdr (linear HalfFloat)
        applyIkeaPortSsaoToLitHdr(renderer, camera);

        const litTex = getIkeaPortLitHdrTexture();
        const { w, h } = getIkeaPortLitHdrSize();

        if (litTex && _state.bloomReady) {
          // 4) Bloom → full-res HDR outRT (not canvas)
          applyIkeaPortBloom(renderer, litTex, w, h);
          const bloomTex = getIkeaPortBloomOutputTexture() || litTex;

          if (_state.finalReady) {
            // 5) Uncharted2 → γ → dither → screen (or diagnostic LDR if OFF)
            applyIkeaPortFinalImage(renderer, bloomTex);
          } else {
            renderer.autoClear = true;
            renderer.setRenderTarget(null);
            renderer.render(scene, camera);
          }
        } else {
          renderer.autoClear = true;
          renderer.setRenderTarget(null);
          renderer.render(scene, camera);
        }
      } else {
        renderer.autoClear = true;
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
      }

      renderer.overrideMaterial = prevOverride || null;
    } else {
      // Assets/light ещё не готовы — НЕ clear() в чёрный (иначе комната-пустота).
      // false → animate() сделает обычный renderer.render.
      return false;
    }

    _state.frames += 1;
    const errs = drainGlErrors(renderer);
    if (errs) _state.glErrorCount += errs;
    return true;
  } catch (e) {
    _state.lastError = String(e?.message || e);
    if (!_state._logged) {
      _state._logged = true;
      console.warn('[IKEA_PORT] render failed', _state.lastError);
    }
    return false;
  } finally {
    try { restore?.(); } catch (_) {}
    renderer.autoClear = prevAutoClear;
  }
}

export function disposeIkeaPortRenderer() {
  disposeIkeaPortPhongProxies();
  disposeIkeaPortSky();
  disposeIkeaPortFinalImage();
  disposeIkeaPortBloom();
  disposeIkeaPortSsao();
  disposeIkeaPortShadowPass();
  disposeIkeaPortAssets(_state.assets);
  _state.assets = null;
  _state.assetsPromise = null;
  _state.lightingReady = false;
  _state.shadowReady = false;
  _state.ssaoReady = false;
  _state.bloomReady = false;
  _state.finalReady = false;
  _state.skyReady = false;
  _state.installed = false;
  return { ok: true, disposed: true };
}

export function auditIkeaPortRenderer() {
  return {
    installed: _state.installed,
    frames: _state.frames,
    lastError: _state.lastError,
    glErrorCount: _state.glErrorCount,
    lightingReady: _state.lightingReady,
    shadowReady: _state.shadowReady,
    ssaoReady: _state.ssaoReady,
    bloomReady: _state.bloomReady,
    finalReady: _state.finalReady,
    skyReady: _state.skyReady,
    hasEnvCube: !!_state.assets?.envMapMip0,
    hasBrdfLut: !!_state.assets?.brdfLut,
    hasSh9: !!_state.assets?.sh9,
    mutatesSourceMaterials: false,
    usesComposer: false,
    usesLabLighting: false,
    usesMeshStandardGGX: false,
    usesThreeShadowMap: false,
    usesLabShadows: false,
    usesLabSsao: false,
    usesLabBloom: false,
    usesUnrealBloom: false,
    usesThreeACES: false,
    usesLabOdt: false,
    outputColorSpace: 'LinearSRGBColorSpace',
    brdf: 'Phong/Blinn-Phong (complete-fs-7)',
    geometricAa: isIkeaPortGeometricAaEnabled(),
    shadow: auditIkeaPortShadowPass(),
    ssao: auditIkeaPortSsao(),
    bloom: auditIkeaPortBloom(),
    final: auditIkeaPortFinalImage(),
    sky: auditIkeaPortSky(),
  };
}

export {
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
};
