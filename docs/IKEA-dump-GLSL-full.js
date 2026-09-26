/**
 * IKEA v0 — полный GLSL includes (БОЛЬШОЙ JSON ~150KB).
 *
 * Вариант A (live): пустая комната ikea.com → F12 → Console → целиком → Enter → copy().
 * Вариант B (offline): node docs/_extract-gl-from-dey.cjs
 *   → пишет docs/IKEA-v0-extract-gl-live-20260828.json из ikea-v1631-DEy_Xiep.js
 *   (7/8 ключей; shadowMapFragmentSoftTransparentShadow — lazy-chunk, getShadow уже в material_renderer)
 */
(() => {
  function findCore() {
    const rootEl = document.querySelector('#root') || document.body;
    const key = Object.keys(rootEl).find(
      (k) => k.startsWith('__reactFiber') || k.startsWith('__reactContainer')
    );
    let fiber = key ? rootEl[key] : null;
    if (fiber?.stateNode?.current) fiber = fiber.stateNode.current;
    const q = [fiber];
    while (q.length) {
      const f = q.shift();
      const v = f?.memoizedProps?.value;
      if (v?.betraktaViewer) return v;
      if (f?.child) q.push(f.child);
      if (f?.sibling) q.push(f.sibling);
    }
    return null;
  }

  const scene = findCore()?.betraktaViewer?.scene;
  let store = null;
  for (const mesh of scene?.meshes || []) {
    const eff = mesh.material?.getEffect?.();
    if (eff?.constructor?.IncludesShadersStore) {
      store = eff.constructor.IncludesShadersStore;
      break;
    }
  }
  if (!store) {
    console.error('no IncludesShadersStore');
    return { err: 'no store' };
  }

  const pick = [
    'betrakta_material_renderer_decl',
    'betrakta_material_renderer',
    'betrakta_output',
    'betrakta_environment_map_decl',
    'betrakta_brdf_ggx',
    'betrakta_brdf_decl',
    'betrakta_common',
    'shadowMapFragmentSoftTransparentShadow',
  ];
  const snippets = {};
  for (const k of pick) {
    if (typeof store[k] === 'string') snippets[k] = store[k];
  }

  const out = {
    ok: true,
    purpose: 'GLSL-full',
    when: new Date().toISOString(),
    storeKeyCount: Object.keys(store).length,
    pickedKeys: Object.keys(snippets),
    snippets,
  };

  const s = JSON.stringify(out, null, 2);
  window.__cldIkeaGlFull = out;
  console.log('GLSL chars:', s.length);
  console.log('Keys:', out.pickedKeys.map((k) => k + ':' + snippets[k].length).join(', '));
  try {
    copy(s);
    console.log('%c→ FULL GLSL JSON в буфере — Ctrl+V в чат', 'color:#0a0;font-weight:bold');
  } catch (e) {
    console.warn('copy failed — сохраните: download(JSON.stringify(window.__cldIkeaGlFull))');
  }
  return { ok: true, chars: s.length, keys: out.pickedKeys };
})();
