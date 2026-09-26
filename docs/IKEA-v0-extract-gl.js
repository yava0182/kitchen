/**
 * IKEA v0 — GLSL includes из live material (быстро, без fetch).
 * Пустая комната → F12 → Console → весь файл → Enter → copy() → Ctrl+V в чат.
 */
(() => {
  function findCore() {
    const rootEl = document.querySelector('#root') || document.body;
    const key = Object.keys(rootEl).find(
      (k) => k.startsWith('__reactContainer') || k.startsWith('__reactFiber')
    );
    let fiber = key ? rootEl[key] : null;
    if (fiber?.stateNode?.current) fiber = fiber.stateNode.current;
    const q = [fiber];
    let n = 0;
    while (q.length && n < 30000) {
      const f = q.shift();
      n++;
      const v = f?.memoizedProps?.value;
      if (v?.betraktaViewer) return v;
      if (f?.child) q.push(f.child);
      if (f?.sibling) q.push(f.sibling);
    }
    return null;
  }

  const core = findCore();
  if (!core?.betraktaViewer) {
    console.error({ err: 'no betraktaViewer' });
    return { err: 'no core' };
  }

  const scene = core.betraktaViewer.scene || core.betraktaViewer._scene;
  let store = null;
  let effectClass = null;
  let meshHit = null;

  for (const mesh of scene?.meshes || []) {
    const eff = mesh.material?.getEffect?.();
    if (!eff?.constructor?.IncludesShadersStore) continue;
    store = eff.constructor.IncludesShadersStore;
    effectClass = eff.constructor?.name;
    meshHit = mesh.name;
    break;
  }

  if (!store) {
    console.error({ err: 'no IncludesShadersStore — покрутите камеру, повторите' });
    return { err: 'no store' };
  }

  const keys = Object.keys(store);
  const pick = (re) => keys.filter((k) => re.test(k));
  const wanted = [
    ...pick(/betrakta_material_renderer/i),
    ...pick(/betrakta_output/i),
    ...pick(/betrakta_environment/i),
    ...pick(/betrakta_brdf_ggx/i),
    ...pick(/soft_shadow/i),
    ...pick(/getLightData|evaluateLight/i),
  ];
  const unique = [...new Set(wanted)];

  const snippets = {};
  for (const k of unique) {
    const src = store[k];
    if (typeof src === 'string') snippets[k] = src;
  }

  // SH uniforms с активного effect
  let shUniforms = null;
  try {
    const mesh = scene.meshes.find((m) => m.material?.getEffect?.());
    const eff = mesh?.material?.getEffect?.();
    const u = eff?._uniforms || eff?.uniforms || {};
    shUniforms = {};
    for (const k of Object.keys(u)) {
      if (!/sh|SH|irradiance|environmentMap|exposure|light/i.test(k)) continue;
      let v = u[k];
      if (v?.value != null) v = v.value;
      shUniforms[k] = v?.asArray?.() ?? (typeof v === 'number' ? v : String(v).slice(0, 80));
    }
  } catch (e) {
    shUniforms = { err: e.message };
  }

  const out = {
    ok: true,
    purpose: 'ikea-v0-extract-gl',
    when: new Date().toISOString(),
    effectClass,
    meshHit,
    storeKeyCount: keys.length,
    pickedKeys: unique,
    snippets,
    shUniforms,
  };

  const s = JSON.stringify(out, null, 2);
  window.__cldIkeaGlDump = out;
  console.log(s);
  copy(s);
  console.log('%c→ GLSL JSON в буфере — Ctrl+V в чат', 'color:#0a0;font-weight:bold');
  return out;
})();
