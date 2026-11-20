/**
 * IKEA_PORT Stage 5 — native-depth shadow map generation (2048²).
 * Not DepthRGBA pack. Not Three.js PCF Soft. Not lab shadow maps.
 *
 * Depth: DEPTH_COMPONENT / DepthTexture + sampler2DShadow compare.
 * Camera/matrix: fit to current CLODIS scene AABB along dir light (Y-up).
 */

import { THREE } from './three-shared.js';
import {
  IKEA_PORT_DIR,
  IKEA_PORT_SHADOW,
  IKEA_PORT_SHADOW_UBO0_DUMP,
} from './ikea-port-config.js';

const BIAS_MATRIX = new THREE.Matrix4().set(
  0.5, 0.0, 0.0, 0.5,
  0.0, 0.5, 0.0, 0.5,
  0.0, 0.0, 0.5, 0.5,
  0.0, 0.0, 0.0, 1.0,
);

/**
 * Vite размножает ESM при разных ?v= на одном файле. Shadow update и Phong
 * должны делить ОДИН depthTex — иначе sampler2DShadow → null → серый экран.
 * Singleton на window переживает дубли модулей.
 */
const _g = typeof window !== 'undefined' ? window : globalThis;

/** Shared uniforms consumed by IKEA_PORT_Phong (same object refs). */
export const ikeaPortShadowUniforms = _g.__CLD_IKEA_SHADOW_UNIFORMS__ || (_g.__CLD_IKEA_SHADOW_UNIFORMS__ = {
  uShadowEnabled: { value: 0 },
  staticShadowMap: { value: null },
  staticShadowMatrix: { value: new THREE.Matrix4() },
  shadowDarkness: { value: IKEA_PORT_SHADOW.darkness },
  constantShadowBias: { value: IKEA_PORT_SHADOW.constantBias },
  kernelRadius: { value: IKEA_PORT_SHADOW.kernelRadius },
  normalStaticShadowBias: { value: IKEA_PORT_SHADOW.normalBias },
  shadowMapSize: { value: IKEA_PORT_SHADOW.mapSize },
  shadowDirLightWorldYup: {
    value: new THREE.Vector3().fromArray(IKEA_PORT_DIR.wiYup),
  },
});

/** @type {{
 *   ready: boolean,
 *   rt: THREE.WebGLRenderTarget|null,
 *   depthTex: THREE.DepthTexture|null,
 *   camera: THREE.OrthographicCamera|null,
 *   depthMat: THREE.MeshBasicMaterial|null,
 *   updates: number,
 *   lastError: string|null,
 *   lastHash: string,
 *   frustum: { left:number, right:number, top:number, bottom:number, near:number, far:number }|null,
 * }} */
const _s = _g.__CLD_IKEA_SHADOW_STATE__ || (_g.__CLD_IKEA_SHADOW_STATE__ = {
  ready: false,
  rt: null,
  depthTex: null,
  camera: null,
  depthMat: null,
  updates: 0,
  lastError: null,
  lastHash: '',
  frustum: null,
});

const _box = new THREE.Box3();
const _center = new THREE.Vector3();
const _size = new THREE.Vector3();
const _lightDir = new THREE.Vector3();
const _up = new THREE.Vector3();
const _tmp = new THREE.Vector3();
const _corners = [];
for (let i = 0; i < 8; i++) _corners.push(new THREE.Vector3());

/** Floor/ceiling receive light+shadows but never cast (IKEA: no roof slab shadow on floor). */
function isFloorOrCeilingSlab(obj) {
  const ud = obj?.userData || {};
  if (ud.isCeiling || ud.isFloor || ud.isFloorCoating || ud.isFloorBase) return true;
  const role = ud.ikeaPortMatRole || ud.ikeaPortRole;
  return role === 'ceiling' || role === 'floor';
}

function isShadowCaster(obj) {
  if (!obj || (!obj.isMesh && !obj.isSkinnedMesh)) return false;
  if (!obj.visible) return false;
  if (isFloorOrCeilingSlab(obj)) return false;
  if (obj.userData?.ikeaPortNoShadow) return false;
  if (obj.userData?.ikeaPortSky || obj.userData?.ikeaPortSkipPhong) return false;
  if (obj.userData?.isHelper || obj.isCSS2DObject || obj.isCSS3DObject) return false;
  const n = String(obj.name || '');
  if (/helper|gizmo|overlay|css2d|dimension/i.test(n)) return false;
  const mat = obj.material;
  if (!mat) return false;
  const mats = Array.isArray(mat) ? mat : [mat];
  // Skip fully transparent HUD-like mats
  if (mats.every((m) => m && m.transparent && (m.opacity == null || m.opacity < 0.15))) {
    return false;
  }
  return true;
}

/**
 * Frustum fit casters — dump IKEA matrix is tight around kitchen content (meters).
 * Floor/ceiling never cast (see isShadowCaster); walls/cabinets fit the ortho.
 */
function isShadowFrustumCaster(obj) {
  return isShadowCaster(obj);
}

/**
 * Cheap scene hash so doors/moves force remap (also always-update fallback).
 * @param {THREE.Object3D} scene
 */
function sceneShadowHash(scene) {
  let n = 0;
  let h = 0;
  scene.traverse((o) => {
    if (!isShadowCaster(o)) return;
    n += 1;
    const e = o.matrixWorld.elements;
    // Sample translation + a few basis terms
    h = (h * 31 + Math.round(e[12] * 0.1)) | 0;
    h = (h * 31 + Math.round(e[13] * 0.1)) | 0;
    h = (h * 31 + Math.round(e[14] * 0.1)) | 0;
    h = (h * 31 + Math.round(e[0] * 100)) | 0;
    h = (h * 31 + Math.round(e[5] * 100)) | 0;
  });
  return `${n}:${h}`;
}

/**
 * Fit ortho camera to scene AABB along light direction (Wi toward light).
 * @param {THREE.Object3D} scene
 * @param {THREE.OrthographicCamera} camera
 */
function fitShadowCamera(scene, camera) {
  _box.makeEmpty();
  scene.traverse((o) => {
    if (!isShadowFrustumCaster(o)) return;
    if (!o.geometry) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    if (!o.geometry.boundingBox) return;
    o.updateWorldMatrix(true, false);
    _box.expandByObject(o);
  });

  // Fallback: if only floor/ceiling exist, use all casters then room-sized box.
  if (_box.isEmpty()) {
    scene.traverse((o) => {
      if (!isShadowCaster(o) || !o.geometry) return;
      o.updateWorldMatrix(true, false);
      _box.expandByObject(o);
    });
  }
  if (_box.isEmpty()) {
    _box.setFromCenterAndSize(new THREE.Vector3(0, 1000, 0), new THREE.Vector3(4000, 3000, 4000));
  }

  _box.getCenter(_center);
  _box.getSize(_size);

  _lightDir.fromArray(IKEA_PORT_DIR.wiYup).normalize();
  // Stable up not parallel to light
  _up.set(0, 1, 0);
  if (Math.abs(_lightDir.dot(_up)) > 0.95) _up.set(1, 0, 0);

  const radius = Math.max(_size.x, _size.y, _size.z) * 0.5;
  const dist = Math.max(radius * 2.5, IKEA_PORT_SHADOW.nearPlane + radius);

  camera.position.copy(_center).addScaledVector(_lightDir, dist);
  camera.up.copy(_up);
  camera.lookAt(_center);
  camera.updateMatrixWorld(true);

  // Project AABB corners into light view to set ortho frustum
  const min = _box.min;
  const max = _box.max;
  const c = _corners;
  c[0].set(min.x, min.y, min.z);
  c[1].set(min.x, min.y, max.z);
  c[2].set(min.x, max.y, min.z);
  c[3].set(min.x, max.y, max.z);
  c[4].set(max.x, min.y, min.z);
  c[5].set(max.x, min.y, max.z);
  c[6].set(max.x, max.y, min.z);
  c[7].set(max.x, max.y, max.z);

  const view = camera.matrixWorldInverse;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < 8; i++) {
    _tmp.copy(c[i]).applyMatrix4(view);
    if (_tmp.x < minX) minX = _tmp.x;
    if (_tmp.x > maxX) maxX = _tmp.x;
    if (_tmp.y < minY) minY = _tmp.y;
    if (_tmp.y > maxY) maxY = _tmp.y;
    if (_tmp.z < minZ) minZ = _tmp.z;
    if (_tmp.z > maxZ) maxZ = _tmp.z;
  }

  const pad = Math.max(50, radius * 0.05);
  camera.left = minX - pad;
  camera.right = maxX + pad;
  camera.top = maxY + pad;
  camera.bottom = minY - pad;
  // View space: camera looks down -Z; scene is in front → negative Z.
  // near/far positive distances along view.
  const zNear = Math.max(IKEA_PORT_SHADOW.nearPlane, -maxZ - pad);
  const zFar = Math.max(zNear + 10, -minZ + pad);
  camera.near = zNear;
  camera.far = zFar;
  camera.updateProjectionMatrix();

  _s.frustum = {
    left: camera.left,
    right: camera.right,
    top: camera.top,
    bottom: camera.bottom,
    near: camera.near,
    far: camera.far,
  };
}

/**
 * @returns {{ ok: boolean, reason?: string }}
 */
export function installIkeaPortShadowPass() {
  if (_s.ready) return { ok: true, already: true };

  try {
    const size = IKEA_PORT_SHADOW.mapSize;
    const depthTex = new THREE.DepthTexture(size, size);
    depthTex.name = 'ikeaPortShadowDepth';
    depthTex.format = THREE.DepthFormat;
    depthTex.type = THREE.UnsignedIntType;
    depthTex.minFilter = THREE.NearestFilter;
    depthTex.magFilter = THREE.NearestFilter;
    depthTex.generateMipmaps = false;
    // Native sampler2DShadow path (как Exp14 lab).
    depthTex.compareFunction = THREE.LessEqualCompare;

    const rt = new THREE.WebGLRenderTarget(size, size, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      generateMipmaps: false,
      stencilBuffer: false,
      depthBuffer: true,
      depthTexture: depthTex,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    });
    rt.texture.name = 'ikeaPortShadowColorUnused';
    rt.texture.generateMipmaps = false;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, IKEA_PORT_SHADOW.nearPlane, 10000);
    camera.name = 'ikeaPortShadowCam';

    const depthMat = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: true,
      depthTest: true,
      side: THREE.FrontSide,
      toneMapped: false,
    });
    depthMat.name = 'ikeaPortShadowDepthOnly';

    _s.rt = rt;
    _s.depthTex = depthTex;
    _s.camera = camera;
    _s.depthMat = depthMat;
    _s.ready = true;

    ikeaPortShadowUniforms.staticShadowMap.value = depthTex;
    ikeaPortShadowUniforms.shadowDarkness.value = IKEA_PORT_SHADOW.darkness;
    ikeaPortShadowUniforms.constantShadowBias.value = IKEA_PORT_SHADOW.constantBias;
    ikeaPortShadowUniforms.kernelRadius.value = IKEA_PORT_SHADOW.kernelRadius;
    ikeaPortShadowUniforms.normalStaticShadowBias.value = IKEA_PORT_SHADOW.normalBias;
    ikeaPortShadowUniforms.shadowMapSize.value = size;
    ikeaPortShadowUniforms.shadowDirLightWorldYup.value.fromArray(IKEA_PORT_DIR.wiYup);
    ikeaPortShadowUniforms.uShadowEnabled.value = 1;

    return { ok: true, mapSize: size, format: 'DepthFormat+UnsignedInt+LessEqualCompare' };
  } catch (e) {
    _s.lastError = String(e?.message || e);
    return { ok: false, reason: _s.lastError };
  }
}

/**
 * Render native depth shadow map from current scene; update shared matrix uniforms.
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {{ force?: boolean }} [opts]
 */
export function updateIkeaPortShadowMap(renderer, scene, opts = {}) {
  if (!_s.ready || !renderer || !scene) return { ok: false, reason: 'not-ready' };

  const hash = sceneShadowHash(scene);
  // Always update when force, or hash changed, or first frames — doors/move.
  // Also refresh every frame while Stage 5 (autoUpdate dump = true); hash still
  // logged for audit. Cost: one 2048 depth pass.
  const force = opts.force !== false; // default true every frame
  if (!force && hash === _s.lastHash && _s.updates > 0) {
    return { ok: true, skipped: true, hash };
  }

  const prevRt = renderer.getRenderTarget();
  const prevOverride = renderer.overrideMaterial;
  const prevAutoClear = renderer.autoClear;
  const prevClearColor = new THREE.Color();
  const prevClearAlpha = renderer.getClearAlpha();
  renderer.getClearColor(prevClearColor);

  /** Hide floor/ceiling for depth pass — overrideMaterial still draws every visible mesh. */
  const hiddenSlabs = [];
  scene.traverse((o) => {
    if (!o || (!o.isMesh && !o.isSkinnedMesh)) return;
    if (!isFloorOrCeilingSlab(o) || !o.visible) return;
    hiddenSlabs.push(o);
    o.visible = false;
  });

  try {
    fitShadowCamera(scene, _s.camera);

    renderer.setRenderTarget(_s.rt);
    renderer.autoClear = true;
    renderer.setClearColor(0xffffff, 1);
    renderer.clear();
    renderer.overrideMaterial = _s.depthMat;
    renderer.render(scene, _s.camera);

    // shadowMatrix = bias * proj * view  (Y-up Three space — dump Z-up was in their engine)
    const sm = ikeaPortShadowUniforms.staticShadowMatrix.value;
    sm.multiplyMatrices(_s.camera.projectionMatrix, _s.camera.matrixWorldInverse);
    sm.premultiply(BIAS_MATRIX);

    if (_s.depthTex) {
      _s.depthTex.compareFunction = THREE.LessEqualCompare;
      // Force re-apply COMPARE_REF_TO_TEXTURE on next sample bind.
      _s.depthTex.needsUpdate = true;
    }
    ikeaPortShadowUniforms.uShadowEnabled.value = 1;
    ikeaPortShadowUniforms.staticShadowMap.value = _s.depthTex;
    ikeaPortShadowUniforms.shadowDirLightWorldYup.value.fromArray(IKEA_PORT_DIR.wiYup);

    _s.lastHash = hash;
    _s.updates += 1;
    return { ok: true, updates: _s.updates, hash, frustum: _s.frustum };
  } catch (e) {
    _s.lastError = String(e?.message || e);
    ikeaPortShadowUniforms.uShadowEnabled.value = 0;
    return { ok: false, reason: _s.lastError };
  } finally {
    for (let i = 0; i < hiddenSlabs.length; i++) hiddenSlabs[i].visible = true;
    renderer.overrideMaterial = prevOverride;
    renderer.autoClear = prevAutoClear;
    renderer.setClearColor(prevClearColor, prevClearAlpha);
    renderer.setRenderTarget(prevRt);
    // После depth RT Three кэширует texture slots и на beauty не биндит
    // sampler2DShadow → GL mismatch / «зубья». Lab на части драйверов везёт;
    // Kitchen — нет. Сброс state заставляет setTexture2D реально забиндить depth.
    try {
      if (typeof renderer.resetState === 'function') renderer.resetState();
      else if (renderer.state && typeof renderer.state.reset === 'function') renderer.state.reset();
    } catch (_) { /* ignore */ }
  }
}

export function disposeIkeaPortShadowPass() {
  try { _s.rt?.dispose?.(); } catch (_) { /* ignore */ }
  try { _s.depthTex?.dispose?.(); } catch (_) { /* ignore */ }
  try { _s.depthMat?.dispose?.(); } catch (_) { /* ignore */ }
  _s.rt = null;
  _s.depthTex = null;
  _s.camera = null;
  _s.depthMat = null;
  _s.ready = false;
  _s.updates = 0;
  _s.lastHash = '';
  ikeaPortShadowUniforms.uShadowEnabled.value = 0;
  ikeaPortShadowUniforms.staticShadowMap.value = null;
  return { ok: true };
}

export function auditIkeaPortShadowPass() {
  const dump = IKEA_PORT_SHADOW_UBO0_DUMP;
  const headMatch =
    IKEA_PORT_SHADOW.darkness === 0.8 &&
    IKEA_PORT_SHADOW.constantBias === -0.0008 &&
    IKEA_PORT_SHADOW.kernelRadius === dump.kernelRadius &&
    IKEA_PORT_SHADOW.normalBias === dump.normalBias;
  const sm = ikeaPortShadowUniforms.staticShadowMatrix.value;
  return {
    ready: _s.ready,
    updates: _s.updates,
    lastError: _s.lastError,
    lastHash: _s.lastHash,
    mapSize: IKEA_PORT_SHADOW.mapSize,
    format: 'native DepthTexture DepthFormat UnsignedIntType LessEqualCompare',
    notDepthRGBA: true,
    notThreePCF: true,
    notLabShadows: true,
    params: { ...IKEA_PORT_SHADOW },
    frustum: _s.frustum,
    uShadowEnabled: ikeaPortShadowUniforms.uShadowEnabled.value,
    hasDepthTex: !!_s.depthTex,
    matrixFormula: 'bias * proj * view (Y-up mm AABB walls/furniture; floor/ceiling never cast)',
    dumpUbo0HeadMatch: headMatch,
    dumpMatrixApplied: false,
    dumpMatrixNote: dump.note,
    liveMatrixElements: sm ? Array.from(sm.elements) : null,
  };
}
