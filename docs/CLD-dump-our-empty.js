/**
 * Наш localhost empty — что реально в сцене (сравнить с IKEA JSON).
 * localhost:8012 → F12 Console → вставить.
 */
(() => {
  const THREE = window.THREE;
  const scene = window.state?.scene || window.__cldState?.scene;
  const renderer = window.state?.renderer;
  const room = window.state?.room;
  const lights = [];
  scene?.traverse((o) => {
    if (o?.isLight) {
      lights.push({
        name: o.name,
        type: o.type,
        intensity: o.intensity,
        pos: o.position?.toArray?.(),
        target: o.target?.position?.toArray?.(),
        angle: o.angle,
        penumbra: o.penumbra,
        distance: o.distance,
        decay: o.decay,
        castShadow: o.castShadow,
      });
    }
  });
  const out = {
    ok: true,
    purpose: 'cld-empty',
    schema: window.__cldBetraktaSot && 'see __cldBetraktaCleanGate',
    gate: typeof window.__cldBetraktaCleanGate === 'function' ? window.__cldBetraktaCleanGate() : null,
    softVol: window.__cldBetraktaSoftVol || null,
    renderer: renderer
      ? {
          toneMapping: renderer.toneMapping,
          exposure: renderer.toneMappingExposure,
          outputColorSpace: renderer.outputColorSpace,
        }
      : null,
    camera: window.state?.camera
      ? { fov: window.state.camera.fov, pos: window.state.camera.position.toArray() }
      : null,
    envInt: scene?.environmentIntensity,
    bg: scene?.background,
    lights,
    room: room
      ? {
          w: room.width,
          h: room.height,
          d: room.depth,
          wallColor: room.wallInners?.back?.material?.color?.getHexString?.(),
          wallRough: room.wallInners?.back?.material?.roughness,
          ceilColor: room.walls?.ceiling?.material?.color?.getHexString?.(),
          ceilRough: room.walls?.ceiling?.material?.roughness,
          floorType: room.floorCoating?.material?.type,
        }
      : null,
  };
  const s = JSON.stringify(out, null, 2);
  console.log(s);
  try {
    copy(s);
  } catch {}
  window.__cldOurEmpty = out;
  return out;
})();
