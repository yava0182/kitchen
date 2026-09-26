/**
 * IKEA PAX — GL dump v6: WEBGL_debug_shaders translated source
 * Берёт уже скомпилированный program у betrakta_pbr (ACTIVE_LIGHTS=1)
 * и читает getTranslatedShaderSource — там include уже развёрнут.
 *
 * Пустая комната. F12 → вставить → JSON в чат.
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

  function snip(src, re, n = 1000) {
    if (!src) return null;
    const m = src.match(re);
    if (!m || m.index == null) return null;
    return src.slice(Math.max(0, m.index - 150), Math.min(src.length, m.index + n));
  }

  const canvas = document.querySelector('canvas');
  const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
  const dbg = gl?.getExtension?.('WEBGL_debug_shaders');
  if (!gl || !dbg) {
    const err = { err: 'no WEBGL_debug_shaders', hasGl: !!gl };
    console.error(err);
    return err;
  }

  const core = findCore();
  if (!core?.betraktaViewer) return { err: 'no betraktaViewer' };
  const bv = core.betraktaViewer;
  const scene = bv.scene || bv._scene;
  const engine = bv.engine || bv._engine || scene?.getEngine?.();
  const cache = engine?._compiledEffects || {};
  const keys = Object.keys(cache);

  const litKeys = keys.filter(
    (k) => k.startsWith('betrakta_pbr+') && /#define\s+ACTIVE_LIGHTS\s+[1-9]/.test(k)
  );
  const targetKeys = litKeys.length ? litKeys : keys.filter((k) => k.startsWith('betrakta_pbr+'));

  function findGlProgram(effect) {
    if (!effect) return null;
    const cands = [
      effect._pipelineContext?.program,
      effect._pipelineContext?._program,
      effect.program,
      effect._program,
      effect._pipelineContext?.glProgram,
    ];
    for (const p of cands) {
      if (p && (typeof p === 'object' || typeof p === 'number')) return p;
    }
    // dig
    try {
      const pc = effect._pipelineContext;
      if (!pc) return null;
      for (const k of Object.getOwnPropertyNames(pc)) {
        const v = pc[k];
        if (v && typeof v === 'object' && (v.constructor?.name === 'WebGLProgram' || gl.isProgram?.(v))) {
          return v;
        }
      }
    } catch {}
    return null;
  }

  function shadersOfProgram(program) {
    if (!program || !gl.getAttachedShaders) return [];
    try {
      return gl.getAttachedShaders(program) || [];
    } catch {
      return [];
    }
  }

  const translated = [];
  for (const k of targetKeys) {
    const effect = cache[k];
    const program = findGlProgram(effect);
    const shaders = shadersOfProgram(program);
    for (const sh of shaders) {
      let t = '';
      try {
        t = dbg.getTranslatedShaderSource(sh) || '';
      } catch {}
      if (t.length < 500) continue;
      const type = gl.getShaderParameter(sh, gl.SHADER_TYPE);
      translated.push({
        keyHead: k.slice(0, 160),
        type: type === gl.FRAGMENT_SHADER ? 'frag' : type === gl.VERTEX_SHADER ? 'vert' : String(type),
        len: t.length,
        text: t,
      });
    }
  }

  // fallback: all programs currently in use — walk materials' effects
  if (!translated.length) {
    try {
      const meshes = scene?.meshes || [];
      for (const mesh of (Array.isArray(meshes) ? meshes : []).slice(0, 50)) {
        const mat = mesh.material;
        if (!mat) continue;
        const n = String(mat.name || '');
        if (!/paint|floor|herring|010_white|ceiling/i.test(n)) continue;
        const eff = mat._effect || mat.effect || mat._materialEffect;
        const program = findGlProgram(eff);
        for (const sh of shadersOfProgram(program)) {
          let t = '';
          try {
            t = dbg.getTranslatedShaderSource(sh) || '';
          } catch {}
          if (t.length < 800) continue;
          const type = gl.getShaderParameter(sh, gl.SHADER_TYPE);
          translated.push({
            keyHead: 'mat:' + n.slice(0, 40),
            type: type === gl.FRAGMENT_SHADER ? 'frag' : 'vert',
            len: t.length,
            text: t,
          });
        }
      }
    } catch (e) {
      translated.push({ err: String(e.message || e) });
    }
  }

  translated.sort((a, b) => b.len - a.len);
  const frag = translated.find((t) => t.type === 'frag') || translated[0];
  const src = frag?.text || '';

  const out = {
    ok: true,
    purpose: 'gl-v6-translated-debug-shaders',
    when: new Date().toISOString(),
    hasDebugShaders: true,
    litKeyCount: litKeys.length,
    translatedCount: translated.length,
    top: translated.slice(0, 8).map((t) => ({
      keyHead: t.keyHead,
      type: t.type,
      len: t.len,
    })),
    fragLen: src.length,
    snips: {
      soft: snip(src, /soft|heightmap|SOFT_SHADOW|blurred|referenceHeight|sampleSoft/i),
      spot: snip(src, /spot|punctual|cone|outerAngle|innerAngle|lightDir|lights\[/i),
      atten: snip(src, /attenuat|invSquare|distance|falloff|range|intensity/i),
      lightLoop: snip(src, /for\s*\(.*ACTIVE_LIGHTS|MAX_LIGHTS|sampleLight|evaluateLight/i),
      softFactor: snip(src, /softShadow|shadowFactor|occlusion|ao\s*\*?=/i),
      exposure: snip(src, /exposure|betraktaOutput|tonemap/i),
      renderMaterial: snip(src, /renderMaterial|vec3\s+render/i),
    },
    fragHead: src ? src.slice(0, 14000) : null,
    fragMid:
      src.length > 25000
        ? src.slice(Math.floor(src.length / 2) - 5000, Math.floor(src.length / 2) + 5000)
        : null,
    fragTail: src ? src.slice(-7000) : null,
  };

  const s = JSON.stringify(out, null, 2);
  console.log(s);
  try {
    copy(s);
    console.log('%c→ буфер gl-v6 — вставьте JSON в чат', 'color:#0a0;font-weight:bold');
  } catch {}
  window.__cldIkeaGlV6 = out;
  window.__cldIkeaGlV6Frag = src || null;
  return { ok: true, fragLen: src.length, translatedCount: translated.length };
})();
