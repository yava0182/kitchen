/**
 * IKEA Phong / Blinn-Phong ShaderMaterial — Stage 4 + Stage 5 shadows.
 * Source: complete-fs-7 Phong + Vogel computeStaticShadow.
 * Not MeshStandardMaterial / GGX / Three PCF Soft / lab chunks.
 */

import { THREE } from './three-shared.js';
import {
  IKEA_PORT_AMBIENT,
  IKEA_PORT_DIR,
  IKEA_PORT_PHONG_SPEC_ATTEN,
  IKEA_PORT_SHADOW,
  IKEA_PORT_SPECULAR_AO,
  IKEA_PORT_GEO_AA,
} from './ikea-port-config.js';
import { ikeaPortShadowUniforms } from './ikea-port-shadow-pass.js';

/** Runtime toggle — applied to every proxy each frame (WeakMap not iterable). */
let _geometricAaEnabled = !!IKEA_PORT_GEO_AA.enabledDefault;

export function setIkeaPortGeometricAaEnabled(on) {
  _geometricAaEnabled = !!on;
  return { ok: true, enabled: _geometricAaEnabled };
}

export function isIkeaPortGeometricAaEnabled() {
  return !!_geometricAaEnabled;
}

export const IKEA_PORT_PHONG_VERTEX = /* glsl */ `
precision highp float;
precision highp int;

varying vec3 vViewPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;

  vec3 transformedNormal = normalMatrix * normal;
  vNormal = normalize(transformedNormal);
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

  gl_Position = projectionMatrix * mvPosition;
}
`;

const SHADOW_SAMPLE_COUNT = IKEA_PORT_SHADOW.sampleCount.toFixed(1);
const SHADOW_MAP_SIZE = IKEA_PORT_SHADOW.mapSize.toFixed(1);
const GOLDEN_ANGLE = IKEA_PORT_SHADOW.goldenAngle.toFixed(1);

/**
 * Fragment — Phong BRDF + dir (+ Vogel shadow) + ambient SH9 + specular IBL.
 */
export const IKEA_PORT_PHONG_FRAGMENT = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2DShadow;

varying vec3 vViewPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;

uniform vec3 diffuseColorRGB;
uniform float opacity;
uniform sampler2D map;
uniform float useMap;
/** Three map.matrix (repeat/offset/rotation) when useWorldUv=0 */
uniform mat3 mapTransform;
/** 1 = UV from world XZ * worldUvScale (dump uv0 / BM3MAT) */
uniform float useWorldUv;
uniform vec2 worldUvScale;
/**
 * 1 = sampler already returns linear (Three SRGBColorSpace upload).
 * 0 = texel is sRGB bytes → inputToLinear (dump GAMMA_INPUT).
 */
uniform float mapIsLinear;

uniform vec3 specularColorRGB;
uniform float linearShininess;

uniform vec3 ambientColor;
uniform float ambientIntensity;

uniform vec3 dirColor;
uniform float dirIntensity;
uniform vec3 dirWiWorldYup;

uniform float phongSpecularAttenuation;
uniform float uMaxMip;

uniform samplerCube environmentMap;
uniform vec4 ambientSphericalHarmonics[9];

// Specular AO on IBL (dump USE_SPECULAR_AO / specularAoIblEnabled)
uniform float uSpecularAoEnabled;
uniform float uMaterialAo;

// Geometric specular AA (dump USE_GEOMETRIC_AA)
uniform float uGeometricAaEnabled;

// Stage 5 — static shadow (shared uniforms)
uniform float uShadowEnabled;
uniform sampler2DShadow staticShadowMap;
uniform mat4 staticShadowMatrix;
uniform float shadowDarkness;
uniform float constantShadowBias;
uniform float kernelRadius;
uniform float normalStaticShadowBias;
uniform float shadowMapSize;
uniform vec3 shadowDirLightWorldYup;

const float RECIPROCAL_PI = 0.31830988618;
const float PI = 3.14159265359;
const float STATIC_SHADOWMAP_SAMPLE_COUNT = ${SHADOW_SAMPLE_COUNT};
const float STATIC_SHADOWMAP_SIZE = ${SHADOW_MAP_SIZE};

// dump: ikea-EXTRACTED-fn-computeSpecularAO / complete-fs-9
float computeSpecularAO( float NoV, float ao, float roughness ) {
  return clamp( pow( NoV + ao, exp2( -16.0 * roughness - 1.0 ) ) - 1.0 + ao, 0.0, 1.0 );
}

vec3 irradianceSH(vec3 n, vec4 iSH[9]) {
  return
      iSH[0].rgb
    + iSH[1].rgb * (n.y)
    + iSH[2].rgb * (n.z)
    + iSH[3].rgb * (n.x)
    + iSH[4].rgb * (n.y * n.x)
    + iSH[5].rgb * (n.y * n.z)
    + iSH[6].rgb * (3.0 * n.z * n.z - 1.0)
    + iSH[7].rgb * (n.z * n.x)
    + iSH[8].rgb * (n.x * n.x - n.y * n.y);
}

vec3 rgbmToLinear(in vec4 colorData) {
  vec3 prefilteredColor = colorData.rgb * (16.0 * colorData.a);
  return prefilteredColor * prefilteredColor;
}

vec3 reinhard(in vec3 color) {
  return color / (1.0 + color);
}

vec3 inputToLinear(vec3 c) {
  return pow(c, vec3(2.2));
}

// ikea-EXTRACTED-fn-vogelDiskSample.glsl.txt
vec2 vogelDiskSample(float sampleIndex, float samplesCount, float phi) {
  const float GoldenAngle = ${GOLDEN_ANGLE};
  float r = sqrt(sampleIndex + 0.5) / sqrt(samplesCount);
  float theta = sampleIndex * GoldenAngle + phi;
  float sine = sin(theta);
  float cosine = cos(theta);
  return vec2(r * cosine, r * sine);
}

// complete-fs-7
float interleavedGradientNoise(vec2 position_screen) {
  const vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
  return fract(magic.z * fract(dot(position_screen, magic.xy)));
}

// ikea-EXTRACTED-fn-computeShadowCoords.glsl.txt
bool computeShadowCoords(
  in float fixedBias,
  in float normalBias,
  in vec3 worldNormal,
  in vec3 worldPosition,
  in highp mat4 shadowMatrix,
  inout vec4 shadowCoords
) {
  vec4 normalBiasedWorldPosition = vec4(worldPosition.xyz + (worldNormal.xyz * normalBias), 1.0);
  shadowCoords = shadowMatrix * normalBiasedWorldPosition;
  shadowCoords.xyz = shadowCoords.xyz / shadowCoords.w;
  shadowCoords.z += fixedBias;
  shadowCoords.z = clamp(shadowCoords.z, 0.0, 0.9999);
  bvec4 inFrustumVec = bvec4(
    shadowCoords.x >= 0.0, shadowCoords.x <= 1.0,
    shadowCoords.y >= 0.0, shadowCoords.y <= 1.0
  );
  return all(inFrustumVec);
}

float texture2DCompare(sampler2DShadow depths, vec2 uv, float compare) {
  return texture(depths, vec3(uv, compare));
}

float computeShadowContribVogelDisk(
  in vec2 mapSize,
  in float radius,
  in sampler2DShadow shadowMap,
  in vec3 shadowCoord
) {
  float seed = interleavedGradientNoise(shadowCoord.xy) * 2.0 * PI;
  float shadowContrib = 0.0;
  for (float i = 0.0; i < STATIC_SHADOWMAP_SAMPLE_COUNT; i++) {
    shadowContrib += texture2DCompare(
      shadowMap,
      vogelDiskSample(i, STATIC_SHADOWMAP_SAMPLE_COUNT, seed) * radius / mapSize + shadowCoord.xy,
      shadowCoord.z
    );
  }
  return 1.0 - shadowContrib * (1.0 / STATIC_SHADOWMAP_SAMPLE_COUNT);
}

// ikea-EXTRACTED-fn-computeStaticShadow.glsl.txt (Vogel branch)
float computeStaticShadow(
  in float fixedBias,
  in float normalBias,
  in float radius,
  in vec3 worldNormal,
  in vec3 worldPosition,
  in highp mat4 shadowMatrix,
  in vec3 shadowDirLightDirection,
  in sampler2DShadow shadowMap
) {
  vec4 shadowCoords;
  if (!computeShadowCoords(fixedBias, normalBias, worldNormal, worldPosition, shadowMatrix, shadowCoords)) {
    return 0.0;
  }
  float shadowDotProduct = dot(worldNormal, shadowDirLightDirection);
  float shadowContrib = 0.0;
  if (shadowDotProduct > 0.001) {
    shadowContrib = computeShadowContribVogelDisk(
      vec2(STATIC_SHADOWMAP_SIZE),
      radius,
      shadowMap,
      shadowCoords.xyz
    );
  }
  return shadowContrib;
}

void main() {
  vec4 diffuseColor = vec4(diffuseColorRGB, opacity);
  if (useMap > 0.5) {
    vec2 mapUv = useWorldUv > 0.5
      ? (vWorldPosition.xz * worldUvScale)
      : (mapTransform * vec3(vUv, 1.0)).xy;
    vec4 texelColor = texture2D(map, mapUv);
    vec3 albedoTex = mapIsLinear > 0.5 ? texelColor.rgb : inputToLinear(texelColor.rgb);
    diffuseColor.rgb *= albedoTex;
    diffuseColor.a *= texelColor.a;
  }

  vec3 geometricNormal = gl_FrontFacing ? normalize(vNormal) : -normalize(vNormal);
  vec3 normal = geometricNormal;
  vec3 viewPosition = normalize(vViewPosition);

  // World normal early (needed for shadow + SH/IBL + GeoAA)
  vec3 worldNormal = normalize((vec4(normal, 0.0) * viewMatrix).xyz);
  vec3 geometricWorldNormal = worldNormal;

  // dump complete-fs-9: resolvedRoughness → linearRoughness → GEOMETRIC SPECULAR AA
  float resolvedRoughness = clamp(1.0 - linearShininess, ${IKEA_PORT_GEO_AA.minRoughness}, 1.0);
  float linearRoughness = resolvedRoughness * resolvedRoughness;
  if (uGeometricAaEnabled > 0.5) {
    vec3 du = dFdx(worldNormal);
    vec3 dv = dFdy(worldNormal);
    float variance = 0.25 * (dot(du, du) + dot(dv, dv));
    float kernelRoughness2 = min(2.0 * variance, ${IKEA_PORT_GEO_AA.kernelRoughnessCap});
    float filteredRoughness2 = clamp(linearRoughness * linearRoughness + kernelRoughness2, 0.0, 1.0);
    linearRoughness = sqrt(filteredRoughness2);
    resolvedRoughness = sqrt(linearRoughness);
  }
  float effectiveLinearShininess = clamp(1.0 - resolvedRoughness, 0.01, 1.0);
  float shininess = pow(effectiveLinearShininess, 5.0) * 10000.0;

  vec3 totalDiffuseLight = vec3(0.0);
  vec3 totalSpecularLight = vec3(0.0);

  vec3 dirVector = normalize((viewMatrix * vec4(dirWiWorldYup, 0.0)).xyz);
  float dirDiffuseWeight = max(dot(normal, dirVector), 0.0);
  vec3 lightColor = dirColor * dirIntensity;

  if (dirDiffuseWeight > 0.0) {
    float diffuseShadowAttenuation = 1.0;
    float specularShadowAttenuation = 1.0;

    if (uShadowEnabled > 0.5) {
      // dump: computeStaticShadow(..., -D, ...) ≡ Wi toward light
      float shadowContrib = computeStaticShadow(
        constantShadowBias,
        normalStaticShadowBias,
        kernelRadius,
        geometricWorldNormal,
        vWorldPosition,
        staticShadowMatrix,
        shadowDirLightWorldYup,
        staticShadowMap
      );
      // dump attenuation (exactly once — no double darkening)
      diffuseShadowAttenuation = 1.0 - shadowDarkness * shadowContrib;
      specularShadowAttenuation = 1.0 - shadowContrib;
    }

    totalDiffuseLight += lightColor * dirDiffuseWeight * diffuseShadowAttenuation;

    vec3 dirHalfVector = normalize(dirVector + viewPosition);
    float dirDotNormalHalf = max(dot(normal, dirHalfVector), 0.0);
    float dirSpecularWeight = max(pow(dirDotNormalHalf, shininess), 0.0);
    float specularNormalization = (shininess + 2.0) / 8.0;
    vec3 schlick = specularColorRGB + vec3(1.0 - specularColorRGB)
      * pow(max(1.0 - dot(dirVector, dirHalfVector), 0.0), 5.0);
    totalSpecularLight += schlick * lightColor * dirSpecularWeight * dirDiffuseWeight
      * specularNormalization * specularShadowAttenuation * phongSpecularAttenuation;
  }

  vec3 outgoingDiffuseLight = RECIPROCAL_PI * diffuseColor.rgb * totalDiffuseLight;
  vec3 outgoingSpecularLight = totalSpecularLight;

  vec3 ambient = ambientColor * ambientIntensity
    * max(irradianceSH(worldNormal.yzx, ambientSphericalHarmonics), 0.0);
  vec3 outgoingAmbientLight = ambient * diffuseColor.rgb;

  float roughness = resolvedRoughness;
  float roughnessBasedMip = clamp(pow(roughness, 0.5) * 10.0 - 2.0, 0.0, uMaxMip);
  vec3 cameraToVertex = normalize(vWorldPosition - cameraPosition);
  vec3 reflectVec = reflect(cameraToVertex, worldNormal);
  vec3 worldReflectedView = vec3(reflectVec.y, reflectVec.zx);
  vec4 prefilteredData = textureLod(environmentMap, worldReflectedView, roughnessBasedMip);
  vec3 envColor = reinhard(rgbmToLinear(prefilteredData));

  // dump: NoV = abs(dot(normal, viewVector)) + 1e-5; ao = ORM.r or 1.0
  float NoV = abs(dot(normal, viewPosition)) + 0.00001;
  float ao = uMaterialAo;
  float specularAO = 1.0;
  if (uSpecularAoEnabled > 0.5) {
    specularAO = computeSpecularAO(NoV, ao, roughness);
  }

  float refractionRatioCoef = 0.0;
  float reflectivity = 1.0;
  vec3 outgoingReflectionLight = ambientColor * ambientIntensity
    * pow(envColor, (3.0 - 2.0 * specularColorRGB) + refractionRatioCoef * 2.0)
    * specularColorRGB * specularColorRGB * reflectivity
    * specularAO;

  vec3 totalOutgoingLight = outgoingDiffuseLight + outgoingReflectionLight
    + outgoingSpecularLight + outgoingAmbientLight;

  gl_FragColor = vec4(totalOutgoingLight, diffuseColor.a);
}
`;

export function packSh9ToVec4Array(sh9) {
  const out = [];
  for (let i = 0; i < 9; i++) {
    const o = i * 3;
    out.push(new THREE.Vector4(
      sh9[o] || 0,
      sh9[o + 1] || 0,
      sh9[o + 2] || 0,
      0,
    ));
  }
  return out;
}

/**
 * @param {object} [opts]
 * @returns {THREE.ShaderMaterial}
 */
export function createIkeaPortPhongMaterial(opts = {}) {
  const shVec4 = packSh9ToVec4Array(opts.sh9 || new Float32Array(27));

  const mat = new THREE.ShaderMaterial({
    name: 'IKEA_PORT_Phong',
    vertexShader: IKEA_PORT_PHONG_VERTEX,
    fragmentShader: IKEA_PORT_PHONG_FRAGMENT,
    lights: false,
    fog: false,
    toneMapped: false,
    transparent: !!opts.transparent,
    depthWrite: opts.depthWrite !== false,
    side: opts.side != null ? opts.side : THREE.FrontSide,
    // GeoAA uses dFdx/dFdy on worldNormal (WebGL1 needs derivatives ext).
    extensions: { derivatives: true },
    uniforms: {
      diffuseColorRGB: { value: new THREE.Color(1, 1, 1) },
      opacity: { value: 1 },
      map: { value: null },
      useMap: { value: 0 },
      mapTransform: { value: new THREE.Matrix3() },
      useWorldUv: { value: 0 },
      worldUvScale: { value: new THREE.Vector2(1, 1) },
      mapIsLinear: { value: 0 },
      specularColorRGB: { value: new THREE.Color(0.04, 0.04, 0.04) },
      linearShininess: { value: 0.5 },
      ambientColor: {
        value: new THREE.Color().fromArray(IKEA_PORT_AMBIENT.color),
      },
      ambientIntensity: { value: IKEA_PORT_AMBIENT.intensity },
      dirColor: {
        value: new THREE.Color().fromArray(IKEA_PORT_DIR.color),
      },
      dirIntensity: { value: IKEA_PORT_DIR.intensity },
      dirWiWorldYup: {
        value: new THREE.Vector3().fromArray(IKEA_PORT_DIR.wiYup),
      },
      phongSpecularAttenuation: { value: IKEA_PORT_PHONG_SPEC_ATTEN },
      uMaxMip: { value: opts.maxMip != null ? opts.maxMip : 9 },
      environmentMap: { value: opts.envMap || null },
      ambientSphericalHarmonics: { value: shVec4 },
      uSpecularAoEnabled: {
        value: IKEA_PORT_SPECULAR_AO.enabledDefault ? 1 : 0,
      },
      uMaterialAo: { value: IKEA_PORT_SPECULAR_AO.aoDefault },
      uGeometricAaEnabled: {
        value: _geometricAaEnabled ? 1 : 0,
      },
      // Shared refs — shadow pass writes once, all proxies read
      uShadowEnabled: ikeaPortShadowUniforms.uShadowEnabled,
      staticShadowMap: ikeaPortShadowUniforms.staticShadowMap,
      staticShadowMatrix: ikeaPortShadowUniforms.staticShadowMatrix,
      shadowDarkness: ikeaPortShadowUniforms.shadowDarkness,
      constantShadowBias: ikeaPortShadowUniforms.constantShadowBias,
      kernelRadius: ikeaPortShadowUniforms.kernelRadius,
      normalStaticShadowBias: ikeaPortShadowUniforms.normalStaticShadowBias,
      shadowMapSize: ikeaPortShadowUniforms.shadowMapSize,
      shadowDirLightWorldYup: ikeaPortShadowUniforms.shadowDirLightWorldYup,
    },
  });

  mat.userData.ikeaPortPhong = true;
  return mat;
}
