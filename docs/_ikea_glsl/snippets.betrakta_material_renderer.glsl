#ifndef _BETRAKTA_BASE_MATERIAL_RENDERER_MAGIC
#error <betrakta_material_renderer> must be included from a BetraktaBaseMaterial shader!
#endif
#include <betrakta_material_renderer_decl>
#include <betrakta_common>
#include <betrakta_brdf_decl>
#include <betrakta_environment_map_decl>
#if LIGHT_SAMPLING_METHOD == LIGHT_SAMPLING_METHOD_TILED
#define LIGHT_ENABLE_RANGE_ATTENUATION
#endif
#if ENABLE_SOFT_SHADOWS == 1
uniform mediump sampler2D blurred_heightmap;
uniform vec4 blurredHeightmapViewport;
#endif
#if LIGHT_SAMPLING_METHOD == LIGHT_SAMPLING_METHOD_INSTANCE_DATA
flat varying ivec4 vLightIndices;
#endif
#if LIGHT_SAMPLING_METHOD == LIGHT_SAMPLING_METHOD_TILED
uniform lowp usampler2D lightTiles;
#endif
struct Light {
vec4 positionAttenuation;
vec4 directionAttenuation;
vec4 colorLineAndRange;
vec4 shadowAtlasViewportAndBias;
mat4 shadowViewProjection;
};
uniform LightUniformBuffer {
vec4 directionalLightDirectionLightCount;
vec4 directionalLightColor_InverseShadowResolution;
vec4 directionalLightShadowAtlasViewportAndBias;
mat4 directionalLightShadowViewProjection;
vec4 ambientLightColor0;
vec4 ambientLightColor1;
vec4 diffuseSH_L00;
vec4 diffuseSH_L1_1;
vec4 diffuseSH_L10;
vec4 diffuseSH_L11;
vec4 diffuseSH_L2_2;
vec4 diffuseSH_L2_1;
vec4 diffuseSH_L20;
vec4 diffuseSH_L21;
vec4 diffuseSH_L22;
vec4 environmentMapRotationX;
vec4 environmentMapRotationY;
vec4 environmentMapRotationZ;
vec4 environmentMapCenter;
vec4 environmentMapSize;
Light lights[MAX_LIGHTS];
};
vec3 parallaxCorrectNormal( vec3 vertexPos, vec3 origVec, vec3 cubePos, vec3 cubeSize ) {
vec3 invOrigVec = vec3(1.) / origVec;
vec3 halfSize = cubeSize * 0.5;
vec3 intersecAtMaxPlane = (cubePos + halfSize - vertexPos) * invOrigVec;
vec3 intersecAtMinPlane = (cubePos - halfSize - vertexPos) * invOrigVec;
vec3 largestIntersec = max(intersecAtMaxPlane, intersecAtMinPlane);
float distance = min(min(largestIntersec.x, largestIntersec.y), largestIntersec.z);
vec3 intersectPositionWS = vertexPos + origVec * distance;
return intersectPositionWS - cubePos;
}
mat3 getEnvironmentMapRotationMatrix() {
return mat3(
environmentMapRotationX.xyz,
environmentMapRotationY.xyz,
environmentMapRotationZ.xyz
);
}
uniform vec2 shadowSamplingJitter;
mat2 getShadowSampleRotationMatrix() {
const vec2 alpha = 1.0 / vec2(1.324717958, 1.324717958*1.324717958);
float I = fract(alpha.x * gl_FragCoord.x + alpha.y * gl_FragCoord.y + shadowSamplingJitter.x);
const float pi = 3.1415926536;
float angle = 2.0 * pi * I;
return mat2(
cos(angle), sin(angle),
-sin(angle), cos(angle)
);
}
float getShadow(in ShadingPoint surface, in mat4 shadowViewProjection, in vec4 shadowAtlasViewportAndBias);
float getLineLightSpecularMRP(vec3 fragmentPositionW, vec3 lineA, vec3 lineB, vec3 R) {
vec3 positionToLineA = lineA - fragmentPositionW;
vec3 lineAtoLineB = lineB - lineA;
float tNum = dot(R, lineA) * dot(lineAtoLineB, R) + dot(lineAtoLineB, fragmentPositionW) * dot(R, R) - dot(R, fragmentPositionW) * dot(lineAtoLineB, R) - dot(lineAtoLineB, lineA) * dot(R, R);
float tDenom = dot(lineAtoLineB, lineAtoLineB) * dot(R, R) - dot(lineAtoLineB, R) * dot(lineAtoLineB, R);
float t = clamp((tNum / tDenom), 0.0, 1.0);
return t;
}
float getLineLightDiffuseMRP(in vec3 vPositionW, in vec3 pointA, in vec3 pointB) {
vec3 lineDirection = pointB - pointA;
float lineLength = length(lineDirection);
lineDirection /= lineLength;
float t = dot(vPositionW - pointA, lineDirection) / lineLength;
return t;
}
vec2 getClampedMRP(in vec3 vPositionW, in vec3 normalW, in vec3 pointA, in vec3 pointB) {
vec3 horizonAdjustedLineA = pointA;
vec3 horizonAdjustedLineB = pointB;
vec3 positionToLineA = pointA - vPositionW;
vec3 positionToLineB = pointB - vPositionW;
vec3 lineAtoLineB = pointB - pointA;
vec2 lineABRangeT = vec2(0.0, 1.0);
if ((dot(positionToLineA, normalW) > 0.0) != (dot(positionToLineB, normalW) > 0.0))
{
float t = -dot(positionToLineA, normalW) / dot(lineAtoLineB, normalW);
vec3 intersectionPoint = pointA + t * lineAtoLineB;
if (dot(positionToLineA, normalW) > 0.0)
{
horizonAdjustedLineB = intersectionPoint;
lineABRangeT.y = t;
}
else
{
horizonAdjustedLineA = intersectionPoint;
lineABRangeT.x = t;
}
}
return lineABRangeT;
}
void calculateLineLight(
in ShadingPoint surface, in vec3 Wo,
in vec3 lightPositionA, in vec3 lightPositionB,
in vec3 lightDirection, in float lightOuterAngle,
in bool hardSideCutoff, in vec4 clipPlane,
in float range,
out float outAttenuation, out vec3 outDirectionToLight
) {
vec3 R = reflect(-Wo, surface.normal);
vec2 lightAttenuationAngles = vec2(lightOuterAngle, cos(0.0));
float diffuseMRP_t = getLineLightDiffuseMRP(surface.position, lightPositionA, lightPositionB);
float specularMRP_t = getLineLightSpecularMRP(surface.position, lightPositionA, lightPositionB, R);
vec2 lineABRangeT = getClampedMRP(surface.position, surface.normal, lightPositionA, lightPositionB);
vec3 lineAtoLineB = lightPositionB - lightPositionA;
vec3 specularMRP = lightPositionA + lineAtoLineB * clamp(specularMRP_t, lineABRangeT.x, lineABRangeT.y);
vec3 diffuseMRP = lightPositionA + lineAtoLineB * clamp(diffuseMRP_t, lineABRangeT.x, lineABRangeT.y);
vec3 L_specular = specularMRP - surface.position;
float Ld2_specular = dot(L_specular, L_specular);
L_specular /= sqrt(max(0.01, Ld2_specular));
outDirectionToLight = L_specular;
vec3 L_diffuse = diffuseMRP - surface.position;
float clipPlaneCutoff = (dot(diffuseMRP, clipPlane.xyz) - clipPlane.w) < dot(L_diffuse, clipPlane.xyz) ? 0.0 : 1.0;
float Ld2_diffuse = dot(L_diffuse, L_diffuse);
L_diffuse /= sqrt(max(0.01, Ld2_diffuse));
float cosTheta = dot(surface.normal, L_diffuse);
float attenuation = cosTheta * smoothstep(lightAttenuationAngles.x, lightAttenuationAngles.y, dot(L_diffuse, -lightDirection));
#ifdef LIGHT_ENABLE_RANGE_ATTENUATION
attenuation *= max(min(1.0 - (Ld2_diffuse / (range * range)) * (Ld2_diffuse / (range * range)), 1.0), 0.0) / Ld2_diffuse;
#else
attenuation *= 1.0 / Ld2_diffuse;
#endif
if (hardSideCutoff && (diffuseMRP_t <= 0.0 || diffuseMRP_t >= 1.0)) {
attenuation *= 0.0;
}
attenuation *= clipPlaneCutoff;
outAttenuation = attenuation;
}
#if ENABLE_ENVIRONMENT_MAP == 1
uniform highp samplerCube environmentMap;
uniform float environmentMapIntensity, environmentMapMipLevels;
vec3 computeEnvironmentIrradiance(vec3 normal) {
return diffuseSH_L00.xyz
+ diffuseSH_L1_1.xyz * (normal.y)
+ diffuseSH_L10.xyz * (normal.z)
+ diffuseSH_L11.xyz * (normal.x)
+ diffuseSH_L2_2.xyz * (normal.y * normal.x)
+ diffuseSH_L2_1.xyz * (normal.y * normal.z)
+ diffuseSH_L20.xyz * ((3.0 * normal.z * normal.z) - 1.0)
+ diffuseSH_L21.xyz * (normal.z * normal.x)
+ diffuseSH_L22.xyz * (normal.x * normal.x - (normal.y * normal.y));
}
#endif
uniform highp sampler2DShadow shadowMapAtlas;
uniform mat4 inverseViewProjection;
uniform vec2 inverseViewportSize;
vec3 evaluateLight(in int index, in ShadingPoint surface, in MaterialParameters material, in vec3 Wo);
#if BETRAKTA_DEPTH_ONLY == 1
vec3 renderMaterial(in ShadingPoint surface, in MaterialParameters material) {
return surface.normal * 0.5 + 0.5;
}
#else
vec3 renderMaterial(in ShadingPoint surface, in MaterialParameters material) {
vec4 projectedCameraPosition = inverseViewProjection * vec4(gl_FragCoord.xy * inverseViewportSize * 2.0 - 1.0, -1.0, 1.0);
vec3 cameraPosition = projectedCameraPosition.xyz / projectedCameraPosition.w;
vec3 Wo = normalize(cameraPosition - surface.position);
vec3 pcfOffset = vec3(directionalLightColor_InverseShadowResolution.w, directionalLightColor_InverseShadowResolution.w, 0.0);
float ao = 1.0;
#if ENABLE_SOFT_SHADOWS == 1
{
vec2 ssUv = (surface.position.xz - blurredHeightmapViewport.xy) / blurredHeightmapViewport.zw;
ssUv = clamp(ssUv, 0.0, 1.0);
ssUv.y = 1.0 - ssUv.y;
float softShadowValue = texture(blurred_heightmap, ssUv).r;
float nt = surface.normal.y * 0.5 + 0.5;
float k = mix(0.01, 2.5, nt * nt);
ao *= 0.4 + 0.6 * exp(-k * max(0.0, softShadowValue - surface.position.y - 0.0));
ao *= ao;
const float intensity = 1.0;
ao = mix(1.0, ao, intensity);
if (ssUv.x == 0.0 || ssUv.x == 1.0 || ssUv.y == 0.0 || ssUv.y == 1.0) ao = 0.0;
}
#endif
vec3 result = ao * ibl(Wo, surface, material);
#if ENABLE_DIRECTIONAL_LIGHT == 1
{
float directionalLightDot = -dot(directionalLightDirectionLightCount.rgb, surface.normal);
if (directionalLightDot > 0.0) {
float shadow = 1.0;
if (directionalLightShadowAtlasViewportAndBias.z > 0.0)
{
shadow = getShadow(surface, directionalLightShadowViewProjection, directionalLightShadowAtlasViewportAndBias);
}
vec3 lightIntensity = directionalLightDot * shadow * directionalLightColor_InverseShadowResolution.rgb;
result += bsdf(-directionalLightDirectionLightCount.rgb, Wo, surface, material) * lightIntensity;
}
}
#endif
#if defined(ACTIVE_LIGHTS) && ACTIVE_LIGHTS > 0
#if LIGHT_SAMPLING_METHOD == LIGHT_SAMPLING_METHOD_ALL
for (int i = 0; i < ACTIVE_LIGHTS; i++) {
result += evaluateLight(i, surface, material, Wo);
}
#elif LIGHT_SAMPLING_METHOD == LIGHT_SAMPLING_METHOD_INSTANCE_DATA
for (int i = 0; i < 4; i++) {
int index = vLightIndices[i];
if (index < 0) break;
result += evaluateLight(index, surface, material, Wo);
}
#elif LIGHT_SAMPLING_METHOD == LIGHT_SAMPLING_METHOD_TILED
ivec2 tileUV = ivec2(gl_FragCoord.xy) / ivec2(BETRAKTA_LIGHT_TILE_SIZE);
tileUV.x *= BETRAKTA_LIGHT_TILE_QUADRUPLES;
for (int i = 0; i < BETRAKTA_LIGHT_TILE_QUADRUPLES; i++) {
ivec4 indices = ivec4(texelFetch(lightTiles, tileUV + ivec2(i, 0), 0));
for (int j = 0; j < 4; j++) {
int index = indices[j];
if (index == 255) break;
result += evaluateLight(index, surface, material, Wo);
}
}
#else
#error Unknown light sampling method: LIGHT_SAMPLING_METHOD
#endif
#endif
return result;
}
#endif
vec3 getEnvironmentDiffuseIrradiance(vec3 worldPosition, vec3 worldNormal) {
#if ENABLE_ENVIRONMENT_MAP == 1
return computeEnvironmentIrradiance(getEnvironmentMapRotationMatrix() * worldNormal) * environmentMapIntensity;
#else
const float pi = 3.1415926536;
return 1.0 / 6.0 * ((2.0 * -worldNormal.y + 3.0) * ambientLightColor0.xyz + (2.0 * worldNormal.y + 3.0) * ambientLightColor1.xyz);
#endif
}
vec3 getEnvironmentSpecularIrradiance(vec3 worldPosition, vec3 direction, float perceptual_roughness) {
#if ENABLE_ENVIRONMENT_MAP == 1
vec3 N = parallaxCorrectNormal(worldPosition, direction, environmentMapCenter.xyz, environmentMapSize.xyz);
return textureCubeLodEXT(environmentMap, getEnvironmentMapRotationMatrix() * N, perceptual_roughness * environmentMapMipLevels).rgb * environmentMapIntensity;
#else
return mix(
mix(ambientLightColor0.xyz, ambientLightColor1.xyz, direction.y * 0.5 + 0.5),
mix(ambientLightColor0.xyz, ambientLightColor1.xyz, 0.5),
perceptual_roughness * (1.0 - abs(direction.y))
);
#endif
}
float getShadow(in ShadingPoint surface, in mat4 shadowViewProjection, in vec4 shadowAtlasViewportAndBias) {
float shadow = 1.0;
vec3 pcfOffset = vec3(directionalLightColor_InverseShadowResolution.w, directionalLightColor_InverseShadowResolution.w, 0.0);
vec4 shadowProjected = shadowViewProjection * vec4(surface.position, 1.0);
shadowProjected.xyz /= shadowProjected.w;
shadowProjected.xy = shadowProjected.xy * 0.5 + 0.5;
if (
shadowProjected.w >= 0.0 &&
clamp(shadowProjected.xy, 0.0, 1.0) == shadowProjected.xy &&
shadowProjected.z >= -1.0
) {
shadowProjected.xy = (shadowProjected.xy * shadowAtlasViewportAndBias.z) + shadowAtlasViewportAndBias.xy;
shadowProjected.z = min(1.0, shadowProjected.z * 0.5 + 0.5 - shadowAtlasViewportAndBias.w);
#ifdef BETRAKTA_LOW_QUALITY_SHADOWS
shadow = texture(shadowMapAtlas, shadowProjected.xyz + vec3(0.5 * shadowSamplingJitter * pcfOffset.xy, 0.0));
#else
mat2 sampleRotationMatrix = getShadowSampleRotationMatrix();
shadow = texture(shadowMapAtlas, shadowProjected.xyz + pcfOffset * vec3(sampleRotationMatrix * vec2(-0.707, -0.707), 1));
shadow += texture(shadowMapAtlas, shadowProjected.xyz + pcfOffset * vec3(sampleRotationMatrix * vec2(0.707, -0.707), 1));
shadow += texture(shadowMapAtlas, shadowProjected.xyz + pcfOffset * vec3(sampleRotationMatrix * vec2(0.0, 0.707), 1));
shadow *= 0.333;
#endif
}
return shadow;
}
void getLightData(in int index, in ShadingPoint surface, in vec3 Wo, out vec3 direction, out vec3 intensity) {
#if LIGHT_SAMPLING_METHOD == LIGHT_SAMPLING_METHOD_ALL || LIGHT_SAMPLING_METHOD == LIGHT_SAMPLING_METHOD_TILED
bool isLineLight = index < ACTIVE_LINE_LIGHTS;
#else
bool isLineLight = lights[index].colorLineAndRange.w > 0.0;
#endif
bool hasShadow = !isLineLight;
float range = abs(lights[index].colorLineAndRange.w);
if (!isLineLight) {
vec3 L = lights[index].positionAttenuation.xyz - surface.position;
float ld2 = dot(L, L);
L /= sqrt(ld2);
float attenuation = dot(surface.normal, L) * smoothstep(lights[index].positionAttenuation.w, lights[index].directionAttenuation.w, -dot(lights[index].directionAttenuation.xyz, L));
#ifdef LIGHT_ENABLE_RANGE_ATTENUATION
attenuation *= max(min(1.0 - (ld2 / (range * range)) * (ld2 / (range * range)), 1.0), 0.0) / ld2;
#else
attenuation *= 1.0 / ld2;
#endif
direction = L;
intensity = lights[index].colorLineAndRange.xyz * max(0.0, attenuation);
if (hasShadow) {
intensity *= getShadow(surface, lights[index].shadowViewProjection, lights[index].shadowAtlasViewportAndBias);
}
} else {
vec3 lightPositionA = lights[index].positionAttenuation.xyz;
vec3 lightPositionB = lights[index].shadowViewProjection[0].xyz;
vec3 lightDirection = lights[index].directionAttenuation.xyz;
float lightOuterAngle = lights[index].positionAttenuation.w;
vec2 lightAttenuation = vec2(lightOuterAngle, cos(0.0));
bool hardSideCutoff = lights[index].directionAttenuation.w > 0.0;
vec4 clipPlane = lights[index].shadowAtlasViewportAndBias.xyzw;
float attenuation;
vec3 direction;
calculateLineLight(
surface, Wo, lightPositionA, lightPositionB, lightDirection, lightOuterAngle, hardSideCutoff, clipPlane, range,
attenuation, direction
);
intensity = lights[index].colorLineAndRange.xyz * max(0.0, attenuation);
}
}
vec3 evaluateLight(in int index, in ShadingPoint surface, in MaterialParameters material, in vec3 Wo) {
vec3 L, intensity;
getLightData(index, surface, Wo, L, intensity);
return bsdf(L, Wo, surface, material) * intensity;
}
