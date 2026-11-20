/**
 * IKEA_PORT Stage 7 — original dump Bloom (not UnrealBloomPass / not lab composer).
 *
 * Sources:
 *   docs/ikea-kitchen-shadow-dump/ikea-snippet-InitBloomSettings.txt
 *   docs/ikea-kitchen-shadow-dump/complete-research/gap-close/clean/final-closure/BLOOM-RGB-ZERO-PROOF.json
 *   BrightPass / COD-AW downsample / tent upsample / composite (extracted FS)
 *
 * Order: BrightPass → Down×N → Up×N → Composite(main + bloom*factor)
 * No Uncharted2 / gamma / dither here.
 */

import { THREE } from './three-shared.js';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { IKEA_PORT_BLOOM } from './ikea-port-config.js';

const VS = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const TENT_GLSL = /* glsl */ `
vec3 tentFilterUpscale( sampler2D toUpscale, vec2 baseUv, float radius ) {
  vec2 pixSize = 1.0 / vec2( textureSize( toUpscale, 0 ) );
  vec4 offset = pixSize.xyxy * vec4( 1.0, 1.0, -1.0, 0.0 ) * radius;
  vec3 res = texture2D( toUpscale, baseUv ).rgb * 4.0
    + texture2D( toUpscale, baseUv + offset.xw ).rgb * 2.0
    + texture2D( toUpscale, baseUv + offset.zw ).rgb * 2.0
    + texture2D( toUpscale, baseUv + offset.wy ).rgb * 2.0
    + texture2D( toUpscale, baseUv - offset.wy ).rgb * 2.0
    + texture2D( toUpscale, baseUv + offset.xy ).rgb * 1.0
    + texture2D( toUpscale, baseUv - offset.zy ).rgb * 1.0
    + texture2D( toUpscale, baseUv + offset.zy ).rgb * 1.0
    + texture2D( toUpscale, baseUv - offset.xy ).rgb * 1.0;
  return res * 0.0625;
}
`;

const BRIGHT_FS = /* glsl */ `
uniform sampler2D tDiffuse;
uniform float uThreshold;
uniform float uSmoothWidth;
uniform float uBloomMax;
varying vec2 vUv;
vec3 median(vec3 a, vec3 b, vec3 c) {
  return a + b + c - min(min(a, b), c) - max(max(a, b), c);
}
void main() {
  vec2 texelSize = 1.0 / vec2( textureSize( tDiffuse, 0 ) );
  vec2 uv = vUv + texelSize * 0.5;
  vec3 d = texelSize.xyx * vec3( 1.0, 1.0, 0.0 );
  vec3 s0 = texture2D( tDiffuse, uv ).rgb;
  vec3 s1 = texture2D( tDiffuse, uv - d.xz ).rgb;
  vec3 s2 = texture2D( tDiffuse, uv + d.xz ).rgb;
  vec3 s3 = texture2D( tDiffuse, uv - d.zy ).rgb;
  vec3 s4 = texture2D( tDiffuse, uv + d.zy ).rgb;
  vec3 color = median( median( s0, s1, s2 ), s3, s4 );
  color = min( color, vec3( uBloomMax ) );
  vec3 lumcoeff = vec3( 0.299, 0.587, 0.114 );
  float lum = dot( color, lumcoeff );
  float alpha = smoothstep( uThreshold, uThreshold + uSmoothWidth, lum );
  gl_FragColor = vec4( mix( vec3( 0.0 ), color, alpha ), 1.0 );
}
`;

function downscaleFS(firstStep) {
  return /* glsl */ `
uniform sampler2D tDiffuse;
varying vec2 vUv;
${firstStep ? '#define FIRST_STEP' : ''}
#if defined(FIRST_STEP)
float karis_weight( vec3 pixel ) {
  float brightness = max( max( pixel.r, pixel.g ), pixel.b );
  return 1.0 / ( brightness + 1.0 );
}
#endif
void main() {
  vec2 pixSize = 1.0 / vec2( textureSize( tDiffuse, 0 ) );
  vec3 tl = texture2D( tDiffuse, vUv + pixSize * vec2( -2.0,  2.0 ) ).rgb;
  vec3 tr = texture2D( tDiffuse, vUv + pixSize * vec2(  2.0,  2.0 ) ).rgb;
  vec3 bl = texture2D( tDiffuse, vUv + pixSize * vec2( -2.0, -2.0 ) ).rgb;
  vec3 br = texture2D( tDiffuse, vUv + pixSize * vec2(  2.0, -2.0 ) ).rgb;
  vec3 mt = texture2D( tDiffuse, vUv + pixSize * vec2(  0.0,  2.0 ) ).rgb;
  vec3 ml = texture2D( tDiffuse, vUv + pixSize * vec2( -2.0,  0.0 ) ).rgb;
  vec3 mr = texture2D( tDiffuse, vUv + pixSize * vec2(  2.0,  0.0 ) ).rgb;
  vec3 mb = texture2D( tDiffuse, vUv + pixSize * vec2(  0.0, -2.0 ) ).rgb;
  vec3 rtl = texture2D( tDiffuse, vUv + pixSize * vec2( -1.0,  1.0 ) ).rgb;
  vec3 rtr = texture2D( tDiffuse, vUv + pixSize * vec2(  1.0,  1.0 ) ).rgb;
  vec3 rbl = texture2D( tDiffuse, vUv + pixSize * vec2( -1.0, -1.0 ) ).rgb;
  vec3 rbr = texture2D( tDiffuse, vUv + pixSize * vec2(  1.0, -1.0 ) ).rgb;
  vec3 pix = texture2D( tDiffuse, vUv ).rgb;
#if defined(FIRST_STEP)
  float tl_w = karis_weight(tl); float tr_w = karis_weight(tr);
  float bl_w = karis_weight(bl); float br_w = karis_weight(br);
  float mt_w = karis_weight(mt); float ml_w = karis_weight(ml);
  float mr_w = karis_weight(mr); float mb_w = karis_weight(mb);
  float rtl_w = karis_weight(rtl); float rtr_w = karis_weight(rtr);
  float rbl_w = karis_weight(rbl); float rbr_w = karis_weight(rbr);
  float pix_w = karis_weight(pix);
  vec3 yellow = (tl*tl_w + mt*mt_w + ml*ml_w + pix*pix_w) / (tl_w + mt_w + ml_w + pix_w);
  vec3 green  = (mt*mt_w + tr*tr_w + mr*mr_w + pix*pix_w) / (mt_w + tr_w + mr_w + pix_w);
  vec3 blue   = (mr*mr_w + br*br_w + mb*mb_w + pix*pix_w) / (mr_w + br_w + mb_w + pix_w);
  vec3 purple = (mb*mb_w + bl*bl_w + ml*ml_w + pix*pix_w) / (mb_w + bl_w + ml_w + pix_w);
  vec3 red    = (rtr*rtr_w + rbr*rbr_w + rbl*rbl_w + rtl*rtl_w) / (rtr_w + rbr_w + rbl_w + rtl_w);
#else
  vec3 yellow = (tl + mt + ml + pix) * 0.25;
  vec3 green  = (mt + tr + mr + pix) * 0.25;
  vec3 blue   = (mr + br + mb + pix) * 0.25;
  vec3 purple = (mb + bl + ml + pix) * 0.25;
  vec3 red    = (rtr + rbr + rbl + rtl) * 0.25;
#endif
  gl_FragColor = vec4( 0.5 * red + 0.125 * yellow + 0.125 * green + 0.125 * blue + 0.125 * purple, 1.0 );
}
`;
}

const UPSCALLE_FS = /* glsl */ `
${TENT_GLSL}
uniform sampler2D uToUpscale;
uniform sampler2D uToSum;
varying vec2 vUv;
void main() {
  vec3 upscaledMip = tentFilterUpscale( uToUpscale, vUv, 2.0 );
  vec3 previousMip = texture2D( uToSum, vUv ).rgb;
  gl_FragColor = vec4( upscaledMip + previousMip, 1.0 );
}
`;

const COMPOSITE_FS = /* glsl */ `
${TENT_GLSL}
uniform sampler2D tDiffuse;
uniform sampler2D uBlurOverlay;
uniform float uBloomFactor;
varying vec2 vUv;
void main() {
  vec3 mainColor = texture2D( tDiffuse, vUv ).rgb;
  vec3 upsampledBloom = tentFilterUpscale( uBlurOverlay, vUv, 2.0 );
  gl_FragColor = vec4( mainColor + upsampledBloom * uBloomFactor, 1.0 );
}
`;

const COPY_FS = /* glsl */ `
uniform sampler2D tDiffuse;
varying vec2 vUv;
void main() {
  gl_FragColor = texture2D( tDiffuse, vUv );
}
`;

function makeHdrRT(w, h) {
  const rt = new THREE.WebGLRenderTarget(Math.max(1, w | 0), Math.max(1, h | 0), {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    magFilter: THREE.LinearFilter,
    minFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
    generateMipmaps: false,
  });
  if (THREE.NoColorSpace !== undefined) rt.texture.colorSpace = THREE.NoColorSpace;
  return rt;
}

function readQueryEnabled() {
  try {
    const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
    if (q.get('ikeaPortBloom') === '0' || q.get('ikeaPortBloom') === 'off') return false;
    if (q.get('ikeaPortBloom') === '1' || q.get('ikeaPortBloom') === 'on') return true;
  } catch (_) { /* ignore */ }
  return IKEA_PORT_BLOOM.enabledDefault;
}

/** @type {any} */
const _s = {
  ready: false,
  enabled: IKEA_PORT_BLOOM.enabledDefault,
  fsq: null,
  brightMat: null,
  downFirst: null,
  downNext: null,
  upMat: null,
  compMat: null,
  copyMat: null,
  brightRT: null,
  finalBloomRT: null,
  /** Full-res HDR after composite/copy — Stage 8 TM input (not canvas). */
  outRT: null,
  outW: 0,
  outH: 0,
  down: [],
  up: [],
  bw: 0,
  bh: 0,
  passes: 0,
  lastError: null,
};

/**
 * @returns {{ ok: boolean, enabled: boolean }}
 */
export function installIkeaPortBloom() {
  if (_s.ready) return { ok: true, enabled: _s.enabled, already: true };
  try {
    _s.enabled = readQueryEnabled();
    _s.brightMat = new THREE.ShaderMaterial({
      name: 'IKEA_PORT_BrightPass',
      uniforms: {
        tDiffuse: { value: null },
        uThreshold: { value: IKEA_PORT_BLOOM.threshold },
        uSmoothWidth: { value: IKEA_PORT_BLOOM.smoothWidth },
        uBloomMax: { value: IKEA_PORT_BLOOM.bloomMax },
      },
      vertexShader: VS,
      fragmentShader: BRIGHT_FS,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    _s.downFirst = new THREE.ShaderMaterial({
      name: 'IKEA_PORT_BloomDownFirst',
      uniforms: { tDiffuse: { value: null } },
      vertexShader: VS,
      fragmentShader: downscaleFS(true),
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    _s.downNext = new THREE.ShaderMaterial({
      name: 'IKEA_PORT_BloomDown',
      uniforms: { tDiffuse: { value: null } },
      vertexShader: VS,
      fragmentShader: downscaleFS(false),
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    _s.upMat = new THREE.ShaderMaterial({
      name: 'IKEA_PORT_BloomUp',
      uniforms: { uToUpscale: { value: null }, uToSum: { value: null } },
      vertexShader: VS,
      fragmentShader: UPSCALLE_FS,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    _s.compMat = new THREE.ShaderMaterial({
      name: 'IKEA_PORT_BloomComposite',
      uniforms: {
        tDiffuse: { value: null },
        uBlurOverlay: { value: null },
        uBloomFactor: { value: IKEA_PORT_BLOOM.bloomFactor },
      },
      vertexShader: VS,
      fragmentShader: COMPOSITE_FS,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    _s.copyMat = new THREE.ShaderMaterial({
      name: 'IKEA_PORT_BloomCopy',
      uniforms: { tDiffuse: { value: null } },
      vertexShader: VS,
      fragmentShader: COPY_FS,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    _s.fsq = new FullScreenQuad(_s.brightMat);
    _s.ready = true;
    return { ok: true, enabled: _s.enabled, params: { ...IKEA_PORT_BLOOM } };
  } catch (e) {
    _s.lastError = String(e?.message || e);
    return { ok: false, enabled: false, reason: _s.lastError };
  }
}

export function setIkeaPortBloomEnabled(on) {
  _s.enabled = !!on;
  return { ok: true, enabled: _s.enabled };
}

export function isIkeaPortBloomEnabled() {
  return !!_s.enabled;
}

function ensureMipTargets(fullW, fullH) {
  const bw = Math.max(1, Math.round(fullW * IKEA_PORT_BLOOM.resScale));
  const bh = Math.max(1, Math.round(fullH * IKEA_PORT_BLOOM.resScale));
  if (bw === _s.bw && bh === _s.bh && _s.brightRT) return;

  disposeMipTargets();
  _s.bw = bw;
  _s.bh = bh;
  _s.brightRT = makeHdrRT(bw, bh);
  _s.brightRT.texture.name = 'ikeaPortBright';

  let cw = bw;
  let ch = bh;
  for (let i = 0; i < IKEA_PORT_BLOOM.mips; i++) {
    cw = Math.max(1, Math.floor(cw / 2));
    ch = Math.max(1, Math.floor(ch / 2));
    const d = makeHdrRT(cw, ch);
    d.texture.name = `ikeaPortBloomDown${i}`;
    _s.down.push(d);
    if (i < IKEA_PORT_BLOOM.mips - 1) {
      const u = makeHdrRT(cw, ch);
      u.texture.name = `ikeaPortBloomUp${i}`;
      _s.up.push(u);
    }
  }
  _s.finalBloomRT = makeHdrRT(bw, bh);
  _s.finalBloomRT.texture.name = 'ikeaPortBloomFinal';
}

function disposeMipTargets() {
  try { _s.brightRT?.dispose?.(); } catch (_) { /* ignore */ }
  try { _s.finalBloomRT?.dispose?.(); } catch (_) { /* ignore */ }
  try { _s.outRT?.dispose?.(); } catch (_) { /* ignore */ }
  for (const r of _s.down) {
    try { r.dispose?.(); } catch (_) { /* ignore */ }
  }
  for (const r of _s.up) {
    try { r.dispose?.(); } catch (_) { /* ignore */ }
  }
  _s.brightRT = null;
  _s.finalBloomRT = null;
  _s.outRT = null;
  _s.outW = 0;
  _s.outH = 0;
  _s.down = [];
  _s.up = [];
  _s.bw = 0;
  _s.bh = 0;
}

function ensureOutRT(fullW, fullH) {
  const w = Math.max(1, fullW | 0);
  const h = Math.max(1, fullH | 0);
  if (_s.outRT && _s.outW === w && _s.outH === h) return;
  try { _s.outRT?.dispose?.(); } catch (_) { /* ignore */ }
  _s.outRT = makeHdrRT(w, h);
  _s.outRT.texture.name = 'ikeaPortBloomHdrOut';
  _s.outW = w;
  _s.outH = h;
}

/**
 * Apply Bloom composite (or copy) from HDR src → internal full-res HDR outRT.
 * Does NOT present to canvas (Stage 8 Uncharted2 consumes outRT).
 *
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Texture} srcHdrTexture  SSAO/lit HDR
 * @param {number} fullW
 * @param {number} fullH
 */
export function applyIkeaPortBloom(renderer, srcHdrTexture, fullW, fullH) {
  if (!_s.ready || !srcHdrTexture) return { ok: false, reason: 'not-ready' };

  const prevRt = renderer.getRenderTarget();
  const prevAutoClear = renderer.autoClear;
  try {
    renderer.autoClear = false;
    ensureOutRT(fullW, fullH);

    if (!_s.enabled) {
      _s.copyMat.uniforms.tDiffuse.value = srcHdrTexture;
      _s.fsq.material = _s.copyMat;
      renderer.setRenderTarget(_s.outRT);
      _s.fsq.render(renderer);
      return { ok: true, mode: 'copy', enabled: false, hdrOut: true };
    }

    ensureMipTargets(fullW, fullH);

    const blit = (mat, target) => {
      _s.fsq.material = mat;
      renderer.setRenderTarget(target);
      _s.fsq.render(renderer);
    };

    // BrightPass @ 0.5 res — dump formula
    _s.brightMat.uniforms.tDiffuse.value = srcHdrTexture;
    _s.brightMat.uniforms.uThreshold.value = IKEA_PORT_BLOOM.threshold;
    _s.brightMat.uniforms.uSmoothWidth.value = IKEA_PORT_BLOOM.smoothWidth;
    _s.brightMat.uniforms.uBloomMax.value = IKEA_PORT_BLOOM.bloomMax;
    blit(_s.brightMat, _s.brightRT);

    let src = _s.brightRT;
    for (let i = 0; i < _s.down.length; i++) {
      const mat = i === 0 ? _s.downFirst : _s.downNext;
      mat.uniforms.tDiffuse.value = src.texture;
      blit(mat, _s.down[i]);
      src = _s.down[i];
    }

    let bloomTex = _s.down[_s.down.length - 1].texture;
    for (let i = _s.down.length - 2; i >= 0; i--) {
      _s.upMat.uniforms.uToUpscale.value = bloomTex;
      _s.upMat.uniforms.uToSum.value = _s.down[i].texture;
      blit(_s.upMat, _s.up[i]);
      bloomTex = _s.up[i].texture;
    }
    _s.upMat.uniforms.uToUpscale.value = bloomTex;
    _s.upMat.uniforms.uToSum.value = _s.brightRT.texture;
    blit(_s.upMat, _s.finalBloomRT);

    _s.compMat.uniforms.tDiffuse.value = srcHdrTexture;
    _s.compMat.uniforms.uBlurOverlay.value = _s.finalBloomRT.texture;
    _s.compMat.uniforms.uBloomFactor.value = IKEA_PORT_BLOOM.bloomFactor;
    blit(_s.compMat, _s.outRT);

    _s.passes += 1;
    return {
      ok: true,
      mode: 'bloom',
      enabled: true,
      passes: _s.passes,
      hdrOut: true,
      note: 'BrightPass zeros when lum < threshold=5 (control kitchen OK)',
    };
  } catch (e) {
    _s.lastError = String(e?.message || e);
    return { ok: false, reason: _s.lastError };
  } finally {
    renderer.autoClear = prevAutoClear;
    renderer.setRenderTarget(prevRt);
  }
}

export function getIkeaPortBloomOutputTexture() {
  return _s.outRT?.texture || null;
}

export function getIkeaPortBloomOutputSize() {
  return { w: _s.outW, h: _s.outH };
}

export function disposeIkeaPortBloom() {
  disposeMipTargets();
  const mats = [_s.brightMat, _s.downFirst, _s.downNext, _s.upMat, _s.compMat, _s.copyMat];
  for (const m of mats) {
    try { m?.dispose?.(); } catch (_) { /* ignore */ }
  }
  try { _s.fsq?.dispose?.(); } catch (_) { /* ignore */ }
  _s.brightMat = _s.downFirst = _s.downNext = _s.upMat = _s.compMat = _s.copyMat = null;
  _s.fsq = null;
  _s.ready = false;
  _s.passes = 0;
  return { ok: true };
}

export function auditIkeaPortBloom() {
  return {
    ready: _s.ready,
    enabled: _s.enabled,
    passes: _s.passes,
    lastError: _s.lastError,
    mipSize: { w: _s.bw, h: _s.bh },
    outSize: { w: _s.outW, h: _s.outH },
    downCount: _s.down.length,
    upCount: _s.up.length,
    hasBrightRT: !!_s.brightRT,
    hasHdrOut: !!_s.outRT,
    notUnrealBloom: true,
    notLabComposer: true,
    params: { ...IKEA_PORT_BLOOM },
    expectedControlKitchen: 'BrightPass RGB≈0 (HDR max < threshold 5)',
  };
}
