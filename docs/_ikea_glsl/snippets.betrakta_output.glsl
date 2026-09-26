#include <betrakta_color_management>
#ifndef _BETRAKTA_SHADER_MATERIAL_OUTPUT_MAGIC
#error <betrakta_output> must be included from a ShaderMaterial material!
#endif
#ifndef BETRAKTA_IGNORE_EXPOSURE
uniform float exposure;
#endif
uniform vec4 clipPlane;
void applyBetraktaClipPlane(in vec3 worldPosition) {
#if BETRAKTA_ENABLE_CLIP_PLANE == 1
float fClipDistance = dot(vec4(worldPosition, 1.0), clipPlane);
if (fClipDistance > 0.0) {
discard;
}
#endif
}
vec4 betraktaOutput(vec4 color, in vec3 worldPosition) {
applyBetraktaClipPlane(worldPosition);
#if BETRAKTA_DEPTH_ONLY == 1
return color;
#else
#ifndef BETRAKTA_IGNORE_EXPOSURE
color.xyz *= exposure;
#endif
#ifdef BETRAKTA_ENABLE_FORWARD_TONEMAPPING
color.rgb = sRGBtoRRT(color.rgb);
color.rgb = tonemapRRTtoODT(color.rgb);
color.rgb = ODTtoSRGB(color.rgb);
color.rgb = clamp(color.rgb, 0.0, 1.0);
color.rgb = pow(color.rgb, vec3(1.0 / 2.2));
#else
color.rgb = sRGBtoRRT(color.rgb);
color.rgb = ditherR11G11B10F(color.rgb);
const float value_max = 65000.0;
color.rgb = min(color.rgb, vec3(value_max));
#endif
return color;
#endif
}
vec4 betraktaOutput(vec3 color, in vec3 worldPosition) {
return betraktaOutput(vec4(color, 1.0), worldPosition);
}
