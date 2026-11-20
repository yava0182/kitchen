/**
 * IKEA_PORT Stage 8 — Uncharted2 + gamma 2.2 + ScreenSpaceDither (final GPU pass).
 *
 * Sources (dump only, no new IKEA audit):
 *   docs/ikea-kitchen-shadow-dump/complete-research/complete-fs-5-sh_bloom_dither_uncharted.glsl.txt
 *   complete-fs-7 / complete-fs-9 / complete-fs-11 (same A..F / toneMap / linearToOutput / dither)
 *
 * Order (IKEA): toneMap → linearToOutput(γ) → dither → screen
 * Not used: Three ACES / Reinhard / FilmicToneMapping / lab ODT / composer.
 */

import { THREE } from './three-shared.js';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { IKEA_PORT_FINAL } from './ikea-port-config.js';

const VS = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/**
 * Original dump helpers (complete-fs-5 / fs-7).
 * saturateFP16 → clamp to FP16 range (denominator guard as in dump).
 */
const FINAL_FS = /* glsl */ `
uniform sampler2D tHdr;
uniform float uEnabled;
uniform float uA;
uniform float uB;
uniform float uC;
uniform float uD;
uniform float uE;
uniform float uF;
uniform float uExposureBias;
uniform float uWhiteScale;
uniform float uGammaFactor;
uniform float uInputExposure;

varying vec2 vUv;

vec3 saturateFP16( in vec3 v ) {
  return clamp( v, 0.0, 65504.0 );
}

vec3 Uncharted2Tonemap( in vec3 x ) {
  vec3 denominator = saturateFP16( ( x * ( uA * x + uB ) + uD * uF ) );
  return ( ( x * ( uA * x + uC * uB ) + uD * uE ) / max( denominator, vec3( 1e-6 ) ) ) - uE / uF;
}

vec3 toneMap( in vec3 originalColor ) {
  // Dump: temp = exposureBias * Uncharted2(originalColor); return temp * whiteScale
  vec3 temp = uExposureBias * Uncharted2Tonemap( originalColor );
  return temp * vec3( uWhiteScale );
}

vec3 linearToOutput( in vec3 a ) {
  vec3 linearColor = pow( max( a, vec3( 0.0 ) ), vec3( 1.0 / uGammaFactor ) );
  return clamp( linearColor, 0.0, 1.0 );
}

// https://www.shadertoy.com/view/MslGR8 — dump ScreenSpaceDither
vec3 ScreenSpaceDither( vec2 vScreenPos ) {
  vec3 vDither = vec3( dot( vec2( 171.0, 231.0 ), vScreenPos.xy ) );
  vDither.rgb = fract( vDither.rgb / vec3( 103.0, 71.0, 97.0 ) );
  return vDither.rgb / 255.0;
}

vec3 dither( in vec3 inputColor ) {
  return inputColor + ScreenSpaceDither( gl_FragCoord.xy );
}

void main() {
  vec3 hdr = texture2D( tHdr, vUv ).rgb * uInputExposure;

  if ( uEnabled < 0.5 ) {
    // Diagnostic LDR present only — does not mutate source HDR RTs.
    // Soft Reinhard-ish clamp so HDR is visible without Uncharted2 / IKEA γ / exposureBias.
    vec3 soft = hdr / ( vec3( 1.0 ) + hdr );
    gl_FragColor = vec4( clamp( soft, 0.0, 1.0 ), 1.0 );
    return;
  }

  vec3 toneMapped = toneMap( hdr );
  toneMapped = linearToOutput( toneMapped );
  toneMapped = dither( toneMapped );
  gl_FragColor = vec4( toneMapped, 1.0 );
}
`;

function readQueryEnabled() {
  try {
    const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
    if (q.get('ikeaPortFinal') === '0' || q.get('ikeaPortFinal') === 'off') return false;
    if (q.get('ikeaPortFinal') === '1' || q.get('ikeaPortFinal') === 'on') return true;
  } catch (_) { /* ignore */ }
  return IKEA_PORT_FINAL.enabledDefault;
}

/** @type {any} */
const _s = {
  ready: false,
  enabled: IKEA_PORT_FINAL.enabledDefault,
  fsq: null,
  mat: null,
  passes: 0,
  lastError: null,
  lastMode: null,
};

export function isIkeaPortFinalEnabled() {
  return !!_s.enabled;
}

export function setIkeaPortFinalEnabled(on) {
  _s.enabled = !!on;
  if (_s.mat) _s.mat.uniforms.uEnabled.value = _s.enabled ? 1 : 0;
  return _s.enabled;
}

export function installIkeaPortFinalImage() {
  try {
    _s.enabled = readQueryEnabled();
    _s.mat = new THREE.ShaderMaterial({
      uniforms: {
        tHdr: { value: null },
        uEnabled: { value: _s.enabled ? 1 : 0 },
        uA: { value: IKEA_PORT_FINAL.A },
        uB: { value: IKEA_PORT_FINAL.B },
        uC: { value: IKEA_PORT_FINAL.C },
        uD: { value: IKEA_PORT_FINAL.D },
        uE: { value: IKEA_PORT_FINAL.E },
        uF: { value: IKEA_PORT_FINAL.F },
        uExposureBias: { value: IKEA_PORT_FINAL.exposureBias },
        uWhiteScale: { value: IKEA_PORT_FINAL.whiteScale },
        uGammaFactor: { value: IKEA_PORT_FINAL.gammaFactor },
        uInputExposure: { value: IKEA_PORT_FINAL.inputExposure },
      },
      vertexShader: VS,
      fragmentShader: FINAL_FS,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    _s.fsq = new FullScreenQuad(_s.mat);
    _s.ready = true;
    _s.passes = 0;
    _s.lastError = null;
    return {
      ok: true,
      enabled: _s.enabled,
      params: { ...IKEA_PORT_FINAL },
      notThreeACES: true,
      notLabOdt: true,
    };
  } catch (e) {
    _s.lastError = String(e?.message || e);
    _s.ready = false;
    return { ok: false, reason: _s.lastError };
  }
}

/**
 * Final present: HDR texture → Uncharted2+γ+dither (ON) or diagnostic LDR (OFF) → canvas.
 * Does not write into / mutate the HDR source RT.
 *
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Texture} hdrTexture  Bloom out / lit HDR
 */
export function applyIkeaPortFinalImage(renderer, hdrTexture) {
  if (!_s.ready || !hdrTexture) return { ok: false, reason: 'not-ready' };

  const prevRt = renderer.getRenderTarget();
  const prevAutoClear = renderer.autoClear;
  const prevOutput = renderer.outputColorSpace;
  try {
    // Shader already does γ2.2 — force Linear so Three does not encode sRGB again.
    if (THREE.LinearSRGBColorSpace !== undefined) {
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    }

    _s.mat.uniforms.tHdr.value = hdrTexture;
    _s.mat.uniforms.uEnabled.value = _s.enabled ? 1 : 0;
    _s.mat.uniforms.uA.value = IKEA_PORT_FINAL.A;
    _s.mat.uniforms.uB.value = IKEA_PORT_FINAL.B;
    _s.mat.uniforms.uC.value = IKEA_PORT_FINAL.C;
    _s.mat.uniforms.uD.value = IKEA_PORT_FINAL.D;
    _s.mat.uniforms.uE.value = IKEA_PORT_FINAL.E;
    _s.mat.uniforms.uF.value = IKEA_PORT_FINAL.F;
    _s.mat.uniforms.uExposureBias.value = IKEA_PORT_FINAL.exposureBias;
    _s.mat.uniforms.uWhiteScale.value = IKEA_PORT_FINAL.whiteScale;
    _s.mat.uniforms.uGammaFactor.value = IKEA_PORT_FINAL.gammaFactor;
    _s.mat.uniforms.uInputExposure.value = IKEA_PORT_FINAL.inputExposure;

    renderer.autoClear = true;
    renderer.setRenderTarget(null);
    renderer.clear();
    _s.fsq.material = _s.mat;
    _s.fsq.render(renderer);

    _s.passes += 1;
    _s.lastMode = _s.enabled ? 'uncharted2-gamma-dither' : 'diagnostic-ldr';
    return {
      ok: true,
      mode: _s.lastMode,
      enabled: _s.enabled,
      passes: _s.passes,
      gammaInShader: true,
      threeOutputColorSpace: 'LinearSRGBColorSpace',
      doubleGamma: false,
      doubleExposure: false,
      inputExposure: IKEA_PORT_FINAL.inputExposure,
      exposureBias: IKEA_PORT_FINAL.exposureBias,
      mutatedHdrSource: false,
    };
  } catch (e) {
    _s.lastError = String(e?.message || e);
    return { ok: false, reason: _s.lastError };
  } finally {
    renderer.autoClear = prevAutoClear;
    renderer.setRenderTarget(prevRt);
    try {
      if (prevOutput != null) renderer.outputColorSpace = prevOutput;
    } catch (_) { /* ignore */ }
  }
}

export function disposeIkeaPortFinalImage() {
  try { _s.mat?.dispose?.(); } catch (_) { /* ignore */ }
  try { _s.fsq?.dispose?.(); } catch (_) { /* ignore */ }
  _s.mat = null;
  _s.fsq = null;
  _s.ready = false;
  _s.passes = 0;
  return { ok: true };
}

export function auditIkeaPortFinalImage() {
  return {
    ready: _s.ready,
    enabled: _s.enabled,
    passes: _s.passes,
    lastError: _s.lastError,
    lastMode: _s.lastMode,
    params: { ...IKEA_PORT_FINAL },
    order: 'toneMap → linearToOutput(γ2.2) → dither → screen',
    notThreeACES: true,
    notThreeReinhard: true,
    notThreeFilmic: true,
    notLabOdt: true,
    notComposer: true,
    doubleGammaGuard: 'LinearSRGBColorSpace + shader γ once',
    doubleExposureGuard: 'inputExposure=1.0; exposureBias only inside toneMap',
  };
}
