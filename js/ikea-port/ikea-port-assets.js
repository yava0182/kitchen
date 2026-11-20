/**
 * Original IKEA IBL assets for IKEA_PORT (independent of lab modules).
 * Cubemap: public/ikea-kitchen-ibl/default/{mip}/m{mip}_{face}.rgbm
 * SH9: default/sh.json
 * BRDF LUT: BRDF_LUT.png (loaded for completeness; Phong Stage 4 does not sample it)
 */

import { THREE } from './three-shared.js';
import {
  IKEA_PORT_ASSET_BASE,
  IKEA_PORT_CUBE_FACES,
} from './ikea-port-config.js';

/** @type {Promise<IkeaPortAssets>|null} */
let _loadPromise = null;

/**
 * @typedef {Object} IkeaPortAssets
 * @property {THREE.CubeTexture} envMapMip0
 * @property {THREE.Texture} brdfLut
 * @property {Float32Array} sh9
 * @property {number} maxMip
 * @property {number} mipCount
 */

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`[IKEA_PORT] failed ${url}`));
    img.src = url;
  });
}

function parseSh9(json) {
  const raw = json && (json.SH || json.sh || json);
  const out = new Float32Array(27);
  if (!Array.isArray(raw) || raw.length < 27) {
    console.warn('[IKEA_PORT] sh.json missing/short — zeros');
    return out;
  }
  for (let i = 0; i < 27; i++) out[i] = Number(raw[i]) || 0;
  return out;
}

/**
 * Build RGBM CubeTexture with mip chain (same layout as dump / public assets).
 * @param {number} mipCount
 * @returns {Promise<THREE.CubeTexture>}
 */
async function buildRgbmCube(mipCount) {
  const levels = [];
  for (let m = 0; m < mipCount; m++) {
    const faces = await Promise.all(
      IKEA_PORT_CUBE_FACES.map((f) =>
        loadImage(`${IKEA_PORT_ASSET_BASE}/${m}/m${m}_${f}.rgbm`),
      ),
    );
    levels.push(faces);
  }
  const cube = new THREE.CubeTexture(levels[0]);
  cube.name = 'ikeaPortEnvRgbm';
  cube.mapping = THREE.CubeReflectionMapping;
  cube.generateMipmaps = false;
  cube.minFilter = THREE.LinearMipmapLinearFilter;
  cube.magFilter = THREE.LinearFilter;
  cube.wrapS = THREE.ClampToEdgeWrapping;
  cube.wrapT = THREE.ClampToEdgeWrapping;
  cube.colorSpace = THREE.NoColorSpace;
  cube.format = THREE.RGBAFormat;
  cube.type = THREE.UnsignedByteType;
  cube.mipmaps = levels.slice(1).map((faces) => ({ image: faces }));
  cube.needsUpdate = true;
  return cube;
}

async function buildBrdfLut() {
  const img = await loadImage('/ikea-kitchen-ibl/BRDF_LUT.png');
  const tex = new THREE.Texture(img);
  tex.name = 'ikeaPortBrdfLut';
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  tex.flipY = false;
  tex.needsUpdate = true;
  return tex;
}

/**
 * @returns {Promise<IkeaPortAssets>}
 */
export function loadIkeaPortAssets() {
  if (_loadPromise) return _loadPromise;
  _loadPromise = (async () => {
    const desc = await fetch(`${IKEA_PORT_ASSET_BASE}/desc.json`)
      .then((r) => (r.ok ? r.json() : { mipCount: 7 }))
      .catch(() => ({ mipCount: 7 }));
    const mipCount = Math.max(1, Number(desc.mipCount) || 7);
    const maxMip = mipCount - 1;

    const [envMapMip0, brdfLut, shJson] = await Promise.all([
      buildRgbmCube(mipCount),
      buildBrdfLut(),
      fetch(`${IKEA_PORT_ASSET_BASE}/sh.json`).then((r) => {
        if (!r.ok) throw new Error(`sh.json HTTP ${r.status}`);
        return r.json();
      }),
    ]);

    return {
      envMapMip0,
      brdfLut,
      sh9: parseSh9(shJson),
      maxMip,
      mipCount,
    };
  })().catch((err) => {
    _loadPromise = null;
    throw err;
  });
  return _loadPromise;
}

export function disposeIkeaPortAssets(assets) {
  if (!assets) return;
  try { assets.envMapMip0?.dispose?.(); } catch (_) { /* ignore */ }
  try { assets.brdfLut?.dispose?.(); } catch (_) { /* ignore */ }
}
