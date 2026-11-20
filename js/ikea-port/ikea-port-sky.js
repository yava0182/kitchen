/**
 * IKEA_PORT Sky — dump program A.Sky (cube, depth xyww).
 * Sources: ikea-EXTRACTED-program-Sky-VS/FS.glsl.txt
 * Cube = same RGBM env mip0 as Phong IBL (not RGBE).
 */

import { THREE } from './three-shared.js';
import { IKEA_PORT_SKY } from './ikea-port-config.js';

const SKY_VERT = /* glsl */ `
varying vec3 vTexCoord;
void main() {
  vTexCoord = position;
  vec4 projectedPosition = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  // dump: force depth = 1
  gl_Position = projectedPosition.xyww;
}
`;

const SKY_FRAG = /* glsl */ `
precision highp float;
varying vec3 vTexCoord;
uniform samplerCube uCubeMap;
uniform vec3 uDiffuseColor;
uniform float uBlendingCoeff;
uniform float uIsRGBM;

vec3 inputToLinear(vec3 c) {
  return pow(c, vec3(2.2));
}

vec3 rgbmToLinear(vec4 colorData) {
  vec3 prefilteredColor = colorData.rgb * (16.0 * colorData.a);
  return prefilteredColor * prefilteredColor;
}

void main() {
  // dump swizzle: (x, z, -y)
  vec4 texelColor = textureCube(uCubeMap, vec3(vTexCoord.x, vTexCoord.z, -vTexCoord.y));
  vec3 texelLinear;
  if (uIsRGBM > 0.5) {
    texelLinear = rgbmToLinear(texelColor);
  } else {
    texelLinear = inputToLinear(texelColor.rgb);
  }
  vec3 color = mix(uDiffuseColor, texelLinear, uBlendingCoeff);
  // HDR beauty path — no toneMap here (final pass does Uncharted2)
  gl_FragColor = vec4(color, 1.0);
}
`;

/** @type {{ mesh: THREE.Mesh|null, enabled: boolean, ready: boolean }} */
const _sky = {
  mesh: null,
  enabled: !!IKEA_PORT_SKY.enabledDefault,
  ready: false,
};

/**
 * @param {THREE.CubeTexture|null} envCube
 * @returns {{ ok: boolean, reason?: string }}
 */
export function installIkeaPortSky(envCube) {
  if (!envCube) return { ok: false, reason: 'no-env-cube' };
  if (_sky.mesh) {
    if (_sky.mesh.material?.uniforms?.uCubeMap) {
      _sky.mesh.material.uniforms.uCubeMap.value = envCube;
    }
    _sky.ready = true;
    return { ok: true };
  }

  const geom = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.ShaderMaterial({
    name: 'IKEA_PORT_Sky',
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    side: THREE.BackSide, // dump CullFaceFront on outward cube ≡ BackSide in Three
    depthWrite: false,
    depthTest: true,
    fog: false,
    toneMapped: false,
    uniforms: {
      uCubeMap: { value: envCube },
      uDiffuseColor: {
        value: new THREE.Color().fromArray(IKEA_PORT_SKY.diffuseColor),
      },
      uBlendingCoeff: { value: IKEA_PORT_SKY.blendingCoeff },
      uIsRGBM: { value: IKEA_PORT_SKY.isRGBM ? 1 : 0 },
    },
  });
  mat.userData.ikeaPortSky = true;

  const mesh = new THREE.Mesh(geom, mat);
  mesh.name = 'IKEA_PORT_Sky';
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  mesh.userData.ikeaPortSky = true;
  mesh.userData.ikeaPortSkipPhong = true;
  mesh.userData.ikeaPortNoShadow = true;
  mesh.scale.setScalar(1);
  _sky.mesh = mesh;
  _sky.ready = true;
  return { ok: true };
}

/**
 * Keep sky centered on camera (dump setPositionXYZ(camera)).
 * @param {THREE.Camera} camera
 * @param {THREE.Scene} scene
 */
export function syncIkeaPortSky(camera, scene) {
  if (!_sky.ready || !_sky.mesh || !_sky.enabled) return;
  if (_sky.mesh.parent !== scene) {
    scene.add(_sky.mesh);
  }
  if (camera?.position) {
    _sky.mesh.position.copy(camera.position);
  }
  _sky.mesh.visible = true;
}

export function setIkeaPortSkyEnabled(on) {
  _sky.enabled = !!on;
  if (_sky.mesh) _sky.mesh.visible = _sky.enabled;
  return { ok: true, enabled: _sky.enabled };
}

export function isIkeaPortSkyEnabled() {
  return !!_sky.enabled;
}

export function disposeIkeaPortSky() {
  if (_sky.mesh) {
    _sky.mesh.parent?.remove(_sky.mesh);
    _sky.mesh.geometry?.dispose?.();
    _sky.mesh.material?.dispose?.();
    _sky.mesh = null;
  }
  _sky.ready = false;
}

export function auditIkeaPortSky() {
  return {
    ready: _sky.ready,
    enabled: _sky.enabled,
    hasMesh: !!_sky.mesh,
    params: { ...IKEA_PORT_SKY },
    depthHack: 'gl_Position.xyww',
    cubeSwizzle: '(x,z,-y)',
    notLabSky: true,
  };
}
