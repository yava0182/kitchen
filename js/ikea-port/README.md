# js/ikea-port — isolated IKEA render path (Exp14)

Default app mode remains **CURRENT** (lab lighting).

| Module | Role |
|--------|------|
| `render-mode.js` | `CLODIS_RENDER_MODE = CURRENT \| IKEA_PORT` |
| `ikea-port-config.js` | Light / bridge / IBL / shadow constants |
| `ikea-port-assets.js` | RGBM cubemap + SH9 + BRDF LUT |
| `ikea-port-phong-shader.js` | Phong ShaderMaterial + Vogel shadow sample |
| `ikea-port-shadow-pass.js` | Native depth 2048 shadow map + camera |
| `ikea-port-ssao.js` | Dump SSAO → linear litHdr RT |
| `ikea-port-bloom.js` | Bright / Down / Up / Composite → HDR outRT |
| `ikea-port-final-image.js` | Uncharted2 + γ2.2 + dither → screen |
| `ikea-port-material-adapter.js` | CLODIS mats → Phong uniforms (no mutate) |
| `ikea-port-renderer.js` | Frame: shadow → Phong → SSAO → Bloom → Final |
| `ikea-port-lifecycle.js` | Boot / dispose / console API |

Activate: `?clodisRenderMode=IKEA_PORT` or `?ikeaPort=1`  
Switch: `window.__cldSetClodisRenderMode('CURRENT'|'IKEA_PORT')` (reload)

- Stage 3: `docs/IKEA-PORT-STAGE3-ISOLATION.md`
- Stage 4: `docs/IKEA-PORT-STAGE4-LIGHTING.md`
- Stage 5: `docs/IKEA-PORT-STAGE5-SHADOWS.md`
- Stage 6: `docs/IKEA-PORT-STAGE6-SSAO.md`
- Stage 7: `docs/IKEA-PORT-STAGE7-BLOOM.md`
- Stage 8: `docs/IKEA-PORT-STAGE8-FINAL-IMAGE.md`
- Stage 9: `docs/IKEA-PORT-STAGE9-ACCEPTANCE.md`
- Stage 10: `docs/IKEA-PORT-STAGE10-VISUAL-COMPARISON.md`
- Stage 11: `docs/IKEA-PORT-STAGE11-BROWSER-COMPARISON.md`

SSAO: `__cldIkeaPort.toggleSsao()` · `?ikeaPortSsao=0`  
Bloom: `__cldIkeaPort.toggleBloom()` · `?ikeaPortBloom=0`  
Final: `__cldIkeaPort.toggleFinal()` · `?ikeaPortFinal=0`  
(Control kitchen: BrightPass RGB≈0 is expected — HDR < threshold 5.)
