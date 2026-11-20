/**
 * IKEA_PORT Stage 6 — original dump SSAO (not Three SSAOPass / not lab module).
 *
 * Sources:
 *   docs/ikea-kitchen-shadow-dump/ikea-ssao-fragment.glsl
 *   docs/ikea-kitchen-shadow-dump/ikea-snippet-InitSSAOSettings.txt
 *   docs/ikea-kitchen-shadow-dump/ikea-camera-ssao.json (depthScale ortho×10)
 *
 * Pass order (IKEA): OpaqueLit HDR+depth → SSAO fullscreen → (bloom/tonemap later).
 * No LAST_POST_PROCESS / Uncharted2 here.
 */

import { THREE } from './three-shared.js';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { IKEA_PORT_SSAO, IKEA_PORT_MSAA } from './ikea-port-config.js';

const CLEAR = 0xd8dde3;

const SSAO_VS = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

function buildSsaoFs({ aoOnly }) {
  const samples = IKEA_PORT_SSAO.samplesCount;
  const mb = IKEA_PORT_SSAO.multiBounce ? '#define USE_MULTIBOUNCE' : '';
  const aoOnlyDef = aoOnly ? '#define AO_ONLY' : '';
  return /* glsl */ `
#define DL    2.399963229728653
#define EULER 2.718281828459045
#define AO_SAMPLES_COUNT ${samples}
${mb}
${aoOnlyDef}

const float uGLeftWidth = ${IKEA_PORT_SSAO.gLeftWidth.toFixed(1)};

uniform sampler2D uDiffuseMap;
uniform highp sampler2D uDepthMap;
uniform float uAoRadius;
uniform float uAoClampMin;
uniform float uNoiseAmount;
uniform vec2 uScreenSize;
uniform float uCameraNear;
uniform highp float uCameraFar;
uniform float uAoLumInfluence;
uniform float uGCenter;
uniform float uGDefaultWidth;
uniform float uDepthScaleFactor;

varying vec2 vUv;

#if defined( USE_MULTIBOUNCE )
vec3 multiBounce( float visibility, vec3 albedo )
{
  vec3 a =  2.0404 * albedo - 0.3324;
  vec3 b = -4.7951 * albedo + 0.6417;
  vec3 c =  2.7552 * albedo + 0.6903;
  vec3 v = vec3( visibility );
  return max( v, ( ( v * a + b ) * v + c ) * v );
}
#endif

vec2 random( const vec2 iUv )
{
  // ssaoNoiseEnabled=false → deterministic pattern * uNoiseAmount(0)
  vec2 halfRes = uScreenSize.xy * 0.5;
  float ff = fract( 1.0 - iUv.s * halfRes.x );
  float gg = fract( iUv.t * halfRes.y );
  vec2 noise = vec2( 0.25 * ff + 0.75 * gg, 0.75 * ff + 0.25 * gg );
  return ( noise * 2.0 - 1.0 ) * uNoiseAmount;
}

float compareDepths( const in float depth1, const in float depth2, inout int far )
{
  float gWidth = uGDefaultWidth;
  float diff = ( depth1 - depth2 ) * uDepthScaleFactor;
  if ( diff < uGCenter ) {
    gWidth = uGLeftWidth;
  } else {
    far = 1;
  }
  float dd = diff - uGCenter;
  return pow( EULER, -2.0 * ( dd * dd ) / ( gWidth * gWidth ) );
}

float linearizeDepth( float depth )
{
  return ( 2.0 * uCameraNear ) / ( uCameraFar + uCameraNear - depth * ( uCameraFar - uCameraNear ) );
}

float calcAO( float depth, float dw, float dh )
{
  vec2 vv = vec2( dw, dh );
  vec2 coord1 = vUv + uAoRadius * vv;
  vec2 coord2 = vUv - uAoRadius * vv;
  float temp1 = 0.0;
  float temp2 = 0.0;
  int far = 0;
  temp1 = compareDepths( depth, linearizeDepth( texture2D( uDepthMap, coord1 ).r ), far );
  if ( far > 0 ) {
    temp2 = compareDepths( linearizeDepth( texture2D( uDepthMap, coord2 ).r ), depth, far );
    temp1 += ( 1.0 - temp1 ) * temp2;
  }
  return temp1;
}

void main()
{
  vec2 uvNoised = random( vUv );
  float rawDepth = texture2D( uDepthMap, vUv ).r;
  float linearizedDepth = linearizeDepth( rawDepth );
  float depthClamped = clamp( linearizedDepth, uAoClampMin, 1.0 );
  float w = ( 1.0 / uScreenSize.x ) / depthClamped + ( uvNoised.x * ( 1.0 - uvNoised.x ) );
  float h = ( 1.0 / uScreenSize.y ) / depthClamped + ( uvNoised.y * ( 1.0 - uvNoised.y ) );
  float ao = 0.0;

  float zStep = 1.0 / float( AO_SAMPLES_COUNT );
  float cZ = 1.0 - zStep / 2.0;
  float cAngle = 0.0;

  for ( int i = 0; i <= AO_SAMPLES_COUNT; ++i ) {
    float r = sqrt( 1.0 - cZ );
    float pw = cos( cAngle ) * r;
    float ph = sin( cAngle ) * r;
    ao += calcAO( linearizedDepth, pw * w, ph * h );
    cZ -= zStep;
    cAngle -= DL;
  }
  ao /= float( AO_SAMPLES_COUNT );
  ao = 1.0 - ao;

  vec3 color = texture2D( uDiffuseMap, vUv ).rgb;

#if defined( USE_MULTIBOUNCE )
  vec3 coloredAo = multiBounce( ao, clamp( color, 0.0, 1.0 ) );
#else
  vec3 coloredAo = vec3( ao );
#endif

  vec3 lumcoeff = vec3( 0.299, 0.587, 0.114 );
  float lum = dot( color, lumcoeff );
  vec3 finalColor = color * mix( coloredAo, vec3( 1.0 ), vec3( lum ) * uAoLumInfluence );

#if defined( AO_ONLY )
  gl_FragColor = vec4( coloredAo, 1.0 );
#else
  gl_FragColor = vec4( finalColor, 1.0 );
#endif
}
`;
}

const COPY_FS = /* glsl */ `
uniform sampler2D tDiffuse;
varying vec2 vUv;
void main() {
  gl_FragColor = texture2D( tDiffuse, vUv );
}
`;

/** @type {{
 *   ready: boolean,
 *   enabled: boolean,
 *   beautyRT: THREE.WebGLRenderTarget|null,
 *   litHdrRT: THREE.WebGLRenderTarget|null,
 *   depthTex: THREE.DepthTexture|null,
 *   fsq: FullScreenQuad|null,
 *   copyFsq: FullScreenQuad|null,
 *   passes: number,
 *   lastError: string|null,
 *   w: number,
 *   h: number,
 *   msaaSamples: number,
 *   msaaWant: number,
 * }} */
const _s = {
  ready: false,
  enabled: IKEA_PORT_SSAO.enabledDefault,
  beautyRT: null,
  litHdrRT: null,
  depthTex: null,
  fsq: null,
  copyFsq: null,
  passes: 0,
  lastError: null,
  w: 0,
  h: 0,
  msaaSamples: 0,
  msaaWant: IKEA_PORT_MSAA.enabledDefault ? IKEA_PORT_MSAA.samples : 0,
};

function readQueryEnabled() {
  try {
    const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
    if (q.get('ikeaPortSsao') === '0' || q.get('ikeaPortSsao') === 'off') return false;
    if (q.get('ikeaPortSsao') === '1' || q.get('ikeaPortSsao') === 'on') return true;
  } catch (_) { /* ignore */ }
  return IKEA_PORT_SSAO.enabledDefault;
}

function readQueryMsaaWant() {
  try {
    const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
    const raw = q.get('ikeaPortMsaa');
    if (raw === '0' || raw === 'off') return 0;
    if (raw === 'on') return IKEA_PORT_MSAA.samples;
    if (raw != null && raw !== '') {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) return n | 0;
    }
  } catch (_) { /* ignore */ }
  return _s.msaaWant;
}

/**
 * Clamp dump samples=4 to GPU maxSamples (WebGL2).
 * @param {THREE.WebGLRenderer} renderer
 * @param {number} want
 */
function resolveMsaaSamples(renderer, want) {
  const w = Math.max(0, want | 0);
  if (w <= 0) return 0;
  const max = Math.max(0, Number(renderer?.capabilities?.maxSamples) || 0);
  if (max <= 0) return 0;
  // Prefer power-of-two-ish dump 4; never exceed GPU.
  return Math.min(w, max);
}

function ensureTargets(renderer) {
  const size = new THREE.Vector2();
  renderer.getDrawingBufferSize(size);
  const w = Math.max(1, size.x | 0);
  const h = Math.max(1, size.y | 0);
  const want = readQueryMsaaWant();
  _s.msaaWant = want;
  const samples = resolveMsaaSamples(renderer, want);
  if (_s.beautyRT && _s.w === w && _s.h === h && _s.msaaSamples === samples) return;

  disposeTargetsOnly();

  const depthTex = new THREE.DepthTexture(w, h);
  depthTex.name = 'ikeaPortBeautyDepth';
  depthTex.format = THREE.DepthFormat;
  depthTex.type = THREE.UnsignedIntType;
  depthTex.minFilter = THREE.NearestFilter;
  depthTex.magFilter = THREE.NearestFilter;
  depthTex.generateMipmaps = false;
  // Sample as .r — no compare mode (unlike shadow map)

  const rt = new THREE.WebGLRenderTarget(w, h, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    generateMipmaps: false,
    stencilBuffer: false,
    depthBuffer: true,
    depthTexture: depthTex,
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    // Dump OpaqueLit: MSAA RGBA16F RB (samples=4). Three resolves → texture for SSAO.
    samples,
  });
  rt.texture.name = 'ikeaPortBeautyColor';
  rt.texture.generateMipmaps = false;
  // Linear working color into SSAO; final display convert once at present
  if ('colorSpace' in rt.texture) rt.texture.colorSpace = THREE.NoColorSpace;

  // Post-SSAO HDR buffer (linear HalfFloat) — Stage 7 Bloom reads this; no sRGB clip.
  // No MSAA here — SSAO/Bloom are fullscreen resolves already.
  const lit = new THREE.WebGLRenderTarget(w, h, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    generateMipmaps: false,
    stencilBuffer: false,
    depthBuffer: false,
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
  });
  lit.texture.name = 'ikeaPortLitHdr';
  lit.texture.generateMipmaps = false;
  if ('colorSpace' in lit.texture) lit.texture.colorSpace = THREE.NoColorSpace;

  _s.beautyRT = rt;
  _s.litHdrRT = lit;
  _s.depthTex = depthTex;
  _s.w = w;
  _s.h = h;
  _s.msaaSamples = samples;
}

function disposeTargetsOnly() {
  try { _s.beautyRT?.dispose?.(); } catch (_) { /* ignore */ }
  try { _s.litHdrRT?.dispose?.(); } catch (_) { /* ignore */ }
  try { _s.depthTex?.dispose?.(); } catch (_) { /* ignore */ }
  _s.beautyRT = null;
  _s.litHdrRT = null;
  _s.depthTex = null;
  _s.w = 0;
  _s.h = 0;
  _s.msaaSamples = 0;
}

/**
 * Runtime MSAA for OpaqueLit beauty (зубчики). Rebuilds RT next frame.
 * @param {number|boolean} samplesOrOn — false/0 off; true → dump 4; or 2/4/8
 */
export function setIkeaPortMsaaSamples(samplesOrOn) {
  let n;
  if (samplesOrOn === true || samplesOrOn === 'on') n = IKEA_PORT_MSAA.samples;
  else if (samplesOrOn === false || samplesOrOn === 'off') n = 0;
  else n = Math.max(0, Number(samplesOrOn) | 0);
  _s.msaaWant = n;
  // Force rebuild on next ensureTargets
  disposeTargetsOnly();
  return { ok: true, want: _s.msaaWant, active: _s.msaaSamples };
}

export function getIkeaPortMsaaSamples() {
  return { want: _s.msaaWant, active: _s.msaaSamples, dump: IKEA_PORT_MSAA.samples };
}

/**
 * @returns {{ ok: boolean, enabled: boolean }}
 */
export function installIkeaPortSsao() {
  if (_s.ready) return { ok: true, enabled: _s.enabled, already: true };

  try {
    _s.enabled = readQueryEnabled();
    _s.msaaWant = IKEA_PORT_MSAA.enabledDefault ? IKEA_PORT_MSAA.samples : 0;
    // Query may override default before first ensureTargets
    _s.msaaWant = readQueryMsaaWant();

    const mat = new THREE.ShaderMaterial({
      name: 'IKEA_PORT_SSAO',
      uniforms: {
        uDiffuseMap: { value: null },
        uDepthMap: { value: null },
        uAoRadius: { value: IKEA_PORT_SSAO.aoRadius },
        uAoClampMin: { value: IKEA_PORT_SSAO.aoClampMin },
        uNoiseAmount: { value: IKEA_PORT_SSAO.noiseAmount },
        uScreenSize: { value: new THREE.Vector2(1, 1) },
        uCameraNear: { value: 100 },
        uCameraFar: { value: 100000 },
        uAoLumInfluence: { value: IKEA_PORT_SSAO.aoLumInfluence },
        uGCenter: { value: IKEA_PORT_SSAO.gCenter },
        uGDefaultWidth: { value: IKEA_PORT_SSAO.gDefaultWidth },
        uDepthScaleFactor: { value: IKEA_PORT_SSAO.depthScaleFactor },
      },
      vertexShader: SSAO_VS,
      fragmentShader: buildSsaoFs({ aoOnly: false }),
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });

    _s.fsq = new FullScreenQuad(mat);
    _s.copyFsq = new FullScreenQuad(
      new THREE.ShaderMaterial({
        name: 'IKEA_PORT_Copy',
        uniforms: { tDiffuse: { value: null } },
        vertexShader: SSAO_VS,
        fragmentShader: COPY_FS,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      }),
    );

    _s.ready = true;
    return { ok: true, enabled: _s.enabled, params: { ...IKEA_PORT_SSAO } };
  } catch (e) {
    _s.lastError = String(e?.message || e);
    return { ok: false, enabled: false, reason: _s.lastError };
  }
}

export function setIkeaPortSsaoEnabled(on) {
  _s.enabled = !!on;
  return { ok: true, enabled: _s.enabled };
}

export function isIkeaPortSsaoEnabled() {
  return !!_s.enabled;
}

/**
 * Render Phong beauty into HDR+depth RT (caller applies Phong proxies).
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {THREE.Camera} camera
 */
export function renderIkeaPortBeautyToSsaoBuffers(renderer, scene, camera) {
  if (!_s.ready) return { ok: false, reason: 'not-ready' };
  ensureTargets(renderer);

  const prevRt = renderer.getRenderTarget();
  const prevAutoClear = renderer.autoClear;
  try {
    renderer.setRenderTarget(_s.beautyRT);
    renderer.autoClear = true;
    renderer.setClearColor(CLEAR, 1);
    renderer.clear();
    renderer.render(scene, camera);
    return { ok: true, w: _s.w, h: _s.h };
  } catch (e) {
    _s.lastError = String(e?.message || e);
    return { ok: false, reason: _s.lastError };
  } finally {
    renderer.autoClear = prevAutoClear;
    renderer.setRenderTarget(prevRt);
  }
}

/**
 * Apply SSAO (or copy beauty) into linear HDR litHdrRT (not canvas — preserves HDR for Bloom).
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Camera} camera
 */
export function applyIkeaPortSsaoToLitHdr(renderer, camera) {
  if (!_s.ready || !_s.beautyRT || !_s.litHdrRT) return { ok: false, reason: 'no-beauty' };

  const prevRt = renderer.getRenderTarget();
  const prevAutoClear = renderer.autoClear;
  try {
    renderer.setRenderTarget(_s.litHdrRT);
    renderer.autoClear = true;
    renderer.setClearColor(CLEAR, 1);
    renderer.clear();

    if (_s.enabled) {
      const u = _s.fsq.material.uniforms;
      u.uDiffuseMap.value = _s.beautyRT.texture;
      u.uDepthMap.value = _s.depthTex;
      u.uScreenSize.value.set(_s.w, _s.h);
      u.uCameraNear.value = camera.near;
      u.uCameraFar.value = camera.far;
      const orthoMul = camera.isOrthographicCamera ? 10.0 : 1.0;
      u.uDepthScaleFactor.value = IKEA_PORT_SSAO.depthScaleFactor * orthoMul;
      u.uAoRadius.value = IKEA_PORT_SSAO.aoRadius;
      u.uAoClampMin.value = IKEA_PORT_SSAO.aoClampMin;
      u.uAoLumInfluence.value = IKEA_PORT_SSAO.aoLumInfluence;
      u.uGCenter.value = IKEA_PORT_SSAO.gCenter;
      u.uGDefaultWidth.value = IKEA_PORT_SSAO.gDefaultWidth;
      u.uNoiseAmount.value = IKEA_PORT_SSAO.noiseAmount;

      _s.fsq.render(renderer);
      _s.passes += 1;
      return { ok: true, mode: 'ssao', passes: _s.passes, hdr: true };
    }

    _s.copyFsq.material.uniforms.tDiffuse.value = _s.beautyRT.texture;
    _s.copyFsq.render(renderer);
    return { ok: true, mode: 'copy', passes: _s.passes, hdr: true };
  } catch (e) {
    _s.lastError = String(e?.message || e);
    return { ok: false, reason: _s.lastError };
  } finally {
    renderer.autoClear = prevAutoClear;
    renderer.setRenderTarget(prevRt);
  }
}

/** @deprecated use applyIkeaPortSsaoToLitHdr — kept name alias for Stage 6 call sites */
export function applyIkeaPortSsaoToScreen(renderer, camera) {
  return applyIkeaPortSsaoToLitHdr(renderer, camera);
}

export function getIkeaPortLitHdrTexture() {
  return _s.litHdrRT?.texture || null;
}

export function getIkeaPortLitHdrSize() {
  return { w: _s.w, h: _s.h };
}

export function disposeIkeaPortSsao() {
  disposeTargetsOnly();
  try { _s.fsq?.material?.dispose?.(); } catch (_) { /* ignore */ }
  try { _s.fsq?.dispose?.(); } catch (_) { /* ignore */ }
  try { _s.copyFsq?.material?.dispose?.(); } catch (_) { /* ignore */ }
  try { _s.copyFsq?.dispose?.(); } catch (_) { /* ignore */ }
  _s.fsq = null;
  _s.copyFsq = null;
  _s.ready = false;
  _s.passes = 0;
  return { ok: true };
}

export function auditIkeaPortSsao() {
  return {
    ready: _s.ready,
    enabled: _s.enabled,
    passes: _s.passes,
    lastError: _s.lastError,
    size: { w: _s.w, h: _s.h },
    hasBeautyRT: !!_s.beautyRT,
    hasLitHdrRT: !!_s.litHdrRT,
    hasDepthTex: !!_s.depthTex,
    msaa: {
      want: _s.msaaWant,
      active: _s.msaaSamples,
      beautyRtSamples: _s.beautyRT?.samples ?? 0,
      dump: IKEA_PORT_MSAA.samples,
      source: IKEA_PORT_MSAA.source,
    },
    hdrPreservedForBloom: true,
    notThreeSsaoPass: true,
    notLabSsao: true,
    params: { ...IKEA_PORT_SSAO },
    source: 'docs/ikea-kitchen-shadow-dump/ikea-ssao-fragment.glsl',
  };
}
