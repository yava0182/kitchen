#ifndef _BETRAKTA_BRDF_GGX_H
#define _BETRAKTA_BRDF_GGX_H
#include <betrakta_environment_map_decl>
#include <betrakta_common>
struct GGXMaterialParameters {
vec3 albedo;
float metallic;
float roughness;
float occlusion;
};
GGXMaterialParameters createGGXMaterialParameters() {
GGXMaterialParameters material;
material.albedo = vec3(1.0);
material.metallic = 0.0;
material.roughness = 0.5;
material.occlusion = 1.0;
return material;
}
float D_GGX(float roughness, float cosTheta) {
float a2 = roughness * roughness;
float k = ((a2 - 1.0) * (cosTheta * cosTheta) + 1.0);
return a2 / (k * k * 3.1415926536);
}
float V_GGX(float NdotV, float NdotL, float linearRoughness) {
NdotL = max(0.0, NdotL);
NdotV = max(0.0, NdotV);
float GGX_V = NdotL * (NdotV * (1.0 - linearRoughness) + linearRoughness);
float GGX_L = NdotV * (NdotL * (1.0 - linearRoughness) + linearRoughness);
return 0.5 / max(0.001, GGX_V + GGX_L);
}
vec3 FresnelSchlickRoughness(float cosTheta, vec3 F0, float R90) {
return F0 + (R90 - F0) * pow(1.0 - cosTheta, 5.0);
}
vec3 bsdf (in vec3 Wi, in vec3 Wo, in ShadingPoint surface, in GGXMaterialParameters material) {
float roughness = material.roughness * material.roughness;
#ifdef BETRAKTA_FRAGMENT_SHADER_FP32_SUPPORTED
roughness = max(roughness, 0.045 * 0.045);
#else
roughness = max(roughness, 0.089 * 0.089);
#endif
vec3 H = normalize(Wi + Wo);
float VdotH = max(0.0, dot(Wo, H));
vec3 specularBsdf = vec3(D_GGX(roughness, max(0.0, dot(surface.normal, H))) * V_GGX(dot(Wi, surface.normal), dot(Wo, surface.normal), roughness));
vec3 diffuseBsdf = material.albedo.rgb / 3.1415926536;
vec3 conductorBrdf = material.albedo.rgb * specularBsdf;
vec3 F = FresnelSchlickRoughness(VdotH, vec3(0.04), max(0.04, 1.0 - roughness));
vec3 dielectricBrdf = mix(diffuseBsdf, specularBsdf, F);
return mix(dielectricBrdf, conductorBrdf, material.metallic);
}
vec2 environmentBRDFApproximation (float roughness, float NdotV) {
const vec4 c0 = vec4( -1, -0.0275, -0.572, 0.022 );
const vec4 c1 = vec4( 1, 0.0425, 1.04, -0.04 );
vec4 r = roughness * c0 + c1;
float a004 = min( r.x * r.x, exp2( -9.28 * NdotV ) ) * r.x + r.y;
vec2 AB = vec2( -1.04, 1.04 ) * a004 + r.zw;
return max(vec2(0.0), AB);
}
vec3 iblFresnel(in vec3 N, in vec3 Wo, in float roughness, in vec3 F0) {
float NdotV = max(0.0, dot(N, Wo));
vec2 envBrdf = environmentBRDFApproximation(roughness, NdotV);
vec3 F90m0 = max(vec3(1.0 - roughness), F0) - F0;
vec3 F = F0 + F90m0 * pow(1.0 - NdotV, 5.0);
vec3 FssEss = F * envBrdf.x + envBrdf.y;
float Ems = (1.0 - envBrdf.x - envBrdf.y);
vec3 Favg = F0 + (1.0 - F0) / 21.0;
vec3 FavgEms = Favg * Ems;
vec3 ms = FssEss * (FavgEms / (1.0 - FavgEms));
return FssEss + ms;
}
vec3 ibl(in vec3 Wo, in ShadingPoint surface, in GGXMaterialParameters material) {
vec3 Wi = reflect(-Wo, surface.normal);
const vec3 F0 = vec3(0.04);
vec3 X = dFdx(surface.position);
vec3 Y = dFdy(surface.position);
vec3 geometricNormal = cross(X,Y);
float Nl = length(geometricNormal);
if (Nl > 0.001) {
geometricNormal /= Nl;
}
float horizonOcclusion = clamp(1.0 + 1.1 * dot(Wi, geometricNormal), 0.0, 1.0);
horizonOcclusion *= horizonOcclusion;
vec3 iblDiffuse = getEnvironmentDiffuseIrradiance(surface.position, surface.normal) * material.albedo;
vec3 iblSpecular = horizonOcclusion * getEnvironmentSpecularIrradiance(surface.position, Wi, material.roughness);
vec3 iblDielectric = mix(iblDiffuse, iblSpecular, iblFresnel(surface.normal, Wo, material.roughness, F0));
vec3 iblConductor = iblSpecular * iblFresnel(surface.normal, Wo, material.roughness, material.albedo);
return material.occlusion * mix(iblDielectric, iblConductor, material.metallic);
}
#endif
