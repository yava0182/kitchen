/**
 * CLODIS material → IKEA Phong uniforms adapter (Stage 4).
 * Does NOT mutate source materials. Documents explicit bridges.
 */

import { THREE } from './three-shared.js';
import { IKEA_PORT_MATERIAL_BRIDGE } from './ikea-port-config.js';
import {
  createIkeaPortPhongMaterial,
  isIkeaPortGeometricAaEnabled,
} from './ikea-port-phong-shader.js';
import {
  classifyIkeaPortMatRole,
  applyIkeaPortParityPreset,
} from './ikea-port-parity-materials.js?v=20261118-adminWt1';

/** @type {WeakMap<THREE.Material, THREE.ShaderMaterial>} */
const _proxyBySource = new WeakMap();

/**
 * Bridge MeshStandard / MeshPhysical / MeshLambert / MeshPhong / MeshBasic
 * → IKEA Phong UBO-like fields.
 *
 * Documented mapping (not eyeballed coefficients):
 * - diffuseRGB ← material.color (Three linear working color)
 * - opacity / transparent / side / depthWrite ← source
 * - map ← material.map (sRGB decode in shader)
 * - linearShininess ← clamp(1 - roughness, shininessFloor, 1)
 *   (CLODIS roughness → IKEA Phong linearShininess = 1 - roughness)
 * - specularRGB ← mix(vec3(f0Dielectric), albedo, metalness)
 *   (F0 dielectric 0.04 → metal tint; dump white boards often ~0.066 specular)
 *
 * MeshPhong: shininess [0..100+] → linearShininess = clamp(shininess/100, floor, 1)
 * MeshBasic: linearShininess=0.01, specular≈0 (unlit-ish but still receives ambient/IBL lightly)
 *
 * @param {THREE.Material} source
 * @param {THREE.ShaderMaterial} proxy
 */
export function syncIkeaPortPhongFromSource(source, proxy) {
  if (!source || !proxy?.uniforms) return;

  const u = proxy.uniforms;
  const bridge = IKEA_PORT_MATERIAL_BRIDGE;

  const color = source.color && source.color.isColor
    ? source.color
    : new THREE.Color(1, 1, 1);
  u.diffuseColorRGB.value.copy(color);

  const opacity = source.opacity != null ? source.opacity : 1;
  u.opacity.value = opacity;

  const map = source.map || null;
  u.map.value = map;
  u.useMap.value = map ? 1 : 0;

  // Map UV: Three repeat/offset/rotation via texture.matrix (when not world-UV role).
  if (u.mapTransform) {
    if (map && typeof map.updateMatrix === 'function') {
      map.updateMatrix();
      u.mapTransform.value.copy(map.matrix);
    } else {
      u.mapTransform.value.identity();
    }
  }
  if (u.useWorldUv) u.useWorldUv.value = 0;
  // Three color-managed maps (srgb / srgb-linear) → sampler linear; skip Phong pow(2.2).
  // NoColorSpace / unset → raw bytes → inputToLinear (dump GAMMA_INPUT).
  if (u.mapIsLinear) {
    const cs = map && map.colorSpace != null ? String(map.colorSpace) : '';
    const managed =
      cs === 'srgb' ||
      cs === 'srgb-linear' ||
      (THREE.SRGBColorSpace != null && map && map.colorSpace === THREE.SRGBColorSpace) ||
      (THREE.LinearSRGBColorSpace != null && map && map.colorSpace === THREE.LinearSRGBColorSpace);
    u.mapIsLinear.value = managed ? 1 : 0;
  }

  let metalness = 0;
  let roughness = 0.5;
  if ('metalness' in source && typeof source.metalness === 'number') {
    metalness = source.metalness;
  }
  if ('roughness' in source && typeof source.roughness === 'number') {
    roughness = source.roughness;
  }

  let linearShininess;
  if (source.isMeshPhongMaterial && typeof source.shininess === 'number') {
    linearShininess = THREE.MathUtils.clamp(source.shininess / 100, bridge.shininessFloor, 1);
  } else if (source.isMeshBasicMaterial) {
    linearShininess = bridge.shininessFloor;
  } else {
    linearShininess = THREE.MathUtils.clamp(1 - roughness, bridge.shininessFloor, 1);
  }
  u.linearShininess.value = linearShininess;

  const f0 = bridge.f0Dielectric;
  const spec = u.specularColorRGB.value;
  if (source.isMeshPhongMaterial && source.specular?.isColor) {
    spec.copy(source.specular);
  } else if (source.isMeshBasicMaterial) {
    spec.setRGB(0, 0, 0);
  } else {
    // mix(F0, albedo, metalness)
    spec.setRGB(
      f0 + (color.r - f0) * metalness,
      f0 + (color.g - f0) * metalness,
      f0 + (color.b - f0) * metalness,
    );
  }

  proxy.transparent = !!source.transparent || opacity < 0.999;
  proxy.opacity = opacity;
  proxy.side = source.side != null ? source.side : THREE.FrontSide;
  proxy.depthWrite = source.depthWrite !== false;
  if (source.depthTest != null) proxy.depthTest = source.depthTest;
  // ShaderMaterial: без этого Three не биндит sampler2DShadow каждый draw
  // (resetTextureUnits + skip upload → чужая текстура на unit → GL mismatch / зубья).
  proxy.uniformsNeedUpdate = true;
}

/**
 * Get or create Phong proxy for a source material.
 * @param {THREE.Material} source
 * @param {{ envMap: THREE.CubeTexture, sh9: Float32Array, maxMip: number }} assets
 * @param {THREE.Object3D} [mesh]
 * @returns {THREE.ShaderMaterial|null}
 */
export function getIkeaPortPhongProxy(source, assets, mesh) {
  if (!source || source.isShaderMaterial && source.userData?.ikeaPortPhong) {
    return source;
  }
  // Sky / other IKEA_PORT native shaders — never wrap in Phong
  if (
    source.userData?.ikeaPortSky ||
    source.userData?.ikeaPortSkipPhong ||
    mesh?.userData?.ikeaPortSky ||
    mesh?.userData?.ikeaPortSkipPhong
  ) {
    return null;
  }
  // Skip pure HUD / line / points
  if (source.isLineBasicMaterial || source.isPointsMaterial || source.isSpriteMaterial) {
    return null;
  }

  let proxy = _proxyBySource.get(source);
  if (!proxy) {
    proxy = createIkeaPortPhongMaterial({
      envMap: assets?.envMapMip0 || null,
      sh9: assets?.sh9,
      maxMip: assets?.maxMip,
      transparent: source.transparent,
      side: source.side,
      depthWrite: source.depthWrite,
    });
    _proxyBySource.set(source, proxy);
  } else if (assets?.envMapMip0 && proxy.uniforms.environmentMap.value !== assets.envMapMip0) {
    proxy.uniforms.environmentMap.value = assets.envMapMip0;
  }

  syncIkeaPortPhongFromSource(source, proxy);
  // Dump MATERIAL-UBO presets (IKEA kitchen mats) — override bridge guess.
  const role = classifyIkeaPortMatRole(mesh, source);
  applyIkeaPortParityPreset(proxy, role, source, mesh);
  // Dump ao = ORM.r or 1.0. No aoMap sample in Phong yet → 1.0 (near-identity SpecAO).
  if (proxy.uniforms?.uMaterialAo) {
    proxy.uniforms.uMaterialAo.value = 1.0;
  }
  if (proxy.uniforms?.uGeometricAaEnabled) {
    proxy.uniforms.uGeometricAaEnabled.value = isIkeaPortGeometricAaEnabled() ? 1 : 0;
  }
  return proxy;
}

/**
 * Swap mesh materials to Phong proxies for one frame; returns restore callback.
 * @param {THREE.Object3D} root
 * @param {{ envMapMip0: THREE.CubeTexture, sh9: Float32Array, maxMip: number }} assets
 * @returns {() => void}
 */
export function applyIkeaPortPhongProxies(root, assets) {
  /** @type {Array<{ mesh: THREE.Mesh, prev: any }>} */
  const stack = [];

  root.traverse((obj) => {
    if (!obj.isMesh && !obj.isSkinnedMesh) return;
    if (obj.userData?.ikeaPortSkipPhong || obj.userData?.ikeaPortSky) return;
    const mat = obj.material;
    if (!mat) return;

    if (Array.isArray(mat)) {
      const prev = mat;
      const next = mat.map((m) => getIkeaPortPhongProxy(m, assets, obj) || m);
      stack.push({ mesh: obj, prev });
      obj.material = next;
    } else {
      const proxy = getIkeaPortPhongProxy(mat, assets, obj);
      if (!proxy || proxy === mat) return;
      stack.push({ mesh: obj, prev: mat });
      obj.material = proxy;
    }
  });

  return () => {
    for (let i = stack.length - 1; i >= 0; i--) {
      const { mesh, prev } = stack[i];
      mesh.material = prev;
    }
  };
}

export function disposeIkeaPortPhongProxies() {
  // WeakMap entries GC with source mats; nothing global to dispose except
  // we cannot iterate WeakMap. Proxies die with page reload / mode switch.
}
