/**
 * IKEA PAX — GL dump v5
 * 1) Развёрнутый fragment betrakta_pbr (_fragmentSourceCode / processed)
 * 2) Soft postprocess: transfer / blur / generate
 * 3) Live uniforms AO (radius, aoStrength) + Soft
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

  function snip(src, re, n = 900) {
    if (!src) return null;
    const m = src.match(re);
    if (!m || m.index == null) return null;
    return src.slice(Math.max(0, m.index - 120), Math.min(src.length, m.index + n));
  }

  function pickSrc(effect) {
    if (!effect) return null;
    const cands = [
      effect._fragmentSourceCode,
      effect.fragmentSourceCode,
      effect._processedFragmentSourceCode,
      effect._rawFragmentSourceCode,
      effect._fragmentSourceCodeBeforeMigration,
      effect._pipelineContext?._fragmentSourceCode,
      effect._pipelineContext?.fragmentSourceCode,
    ];
    let best = null;
    for (const s of cands) {
      if (typeof s === 'string' && (!best || s.length > best.length)) best = s;
    }
    // иногда исходник в program
    try {
      const names = Object.getOwnPropertyNames(effect);
      for (const k of names) {
        if (!/fragment|source|code/i.test(k)) continue;
        const v = effect[k];
        if (typeof v === 'string' && v.length > (best?.length || 0)) best = v;
      }
    } catch {}
    return best;
  }

  function definesOf(key) {
    const i = key.indexOf('@');
    return i >= 0 ? key.slice(i + 1) : '';
  }

  const core = findCore();
  if (!core?.betraktaViewer) return { err: 'no betraktaViewer' };
  const bv = core.betraktaViewer;
  const scene = bv.scene || bv._scene;
  const engine = bv.engine || bv._engine || scene?.getEngine?.();
  const cache = engine?._compiledEffects || {};
  const keys = Object.keys(cache);

  // --- PBR variants: только прямые ключи, без walk через bloom ---
  const pbrKeys = keys.filter((k) => k.startsWith('betrakta_pbr+'));
  const pbrVariants = pbrKeys.map((k) => {
    const src = pickSrc(cache[k]) || '';
    const def = definesOf(k);
    const getDef = (name) => {
      const m = def.match(new RegExp('#define\\s+' + name + '\\s+([^\\n]+)'));
      return m ? m[1].trim() : null;
    };
    return {
      keyHead: k.slice(0, 180),
      srcLen: src.length,
      ACTIVE_LIGHTS: getDef('ACTIVE_LIGHTS'),
      ACTIVE_SHADOW_LIGHTS: getDef('ACTIVE_SHADOW_LIGHTS'),
      ENABLE_SOFT_SHADOWS: getDef('ENABLE_SOFT_SHADOWS'),
      ENABLE_ENVIRONMENT_MAP: getDef('ENABLE_ENVIRONMENT_MAP'),
      ENABLE_DIRECTIONAL_LIGHT: getDef('ENABLE_DIRECTIONAL_LIGHT'),
      LIGHT_SAMPLING_METHOD: getDef('LIGHT_SAMPLING_METHOD'),
      hasRenderMaterial: /renderMaterial|betrakta_material_renderer/i.test(src),
      hasInclude: /#include\s*<betrakta_material_renderer>/i.test(src),
      hasExpandedLight: /ACTIVE_LIGHTS|punctual|coneCos|lightIntensity|for\s*\(\s*int/i.test(src) && src.length > 8000,
    };
  });

  // лучший развёрнутый PBR
  let bestPbr = null;
  let bestPbrKey = null;
  for (const k of pbrKeys) {
    const src = pickSrc(cache[k]);
    if (!src) continue;
    if (!bestPbr || src.length > bestPbr.length) {
      bestPbr = src;
      bestPbrKey = k;
    }
  }

  // вариант с ACTIVE_LIGHTS > 0 если есть
  const litKey = pbrKeys.find((k) => /#define\s+ACTIVE_LIGHTS\s+[1-9]/.test(k));
  const litSrc = litKey ? pickSrc(cache[litKey]) : null;

  // --- Soft postprocesses ---
  function pp(name) {
    const k = keys.find((x) => x.includes('postprocess+' + name));
    if (!k) return null;
    const src = pickSrc(cache[k]) || '';
    return {
      key: k.slice(0, 120),
      len: src.length,
      head: src.slice(0, 4500),
      snips: {
        blur: snip(src, /blur|gaussian|radius|sigma|kernel/i),
        height: snip(src, /height|soft|reference|plane|shadow/i),
        main: snip(src, /void main/i),
      },
    };
  }

  const softPP = {
    transfer: pp('soft_shadow_transfer_depth'),
    blur: pp('soft_shadow_blur'),
    generate: pp('soft_shadow_generate_texture'),
  };

  // --- Live uniforms: walk scene postProcesses + light manager ---
  function dumpUniforms(obj, tag, depth, seen, out) {
    if (!obj || depth > 3 || out.length > 60) return;
    if (typeof obj !== 'object') return;
    if (seen.has(obj)) return;
    try {
      seen.add(obj);
    } catch {
      return;
    }
    let keys2;
    try {
      keys2 = Object.getOwnPropertyNames(obj);
    } catch {
      return;
    }
    for (const k of keys2.slice(0, 50)) {
      if (!/ao|radius|strength|soft|blur|intensity|reference|height|uniform/i.test(k)) continue;
      let v;
      try {
        v = obj[k];
      } catch {
        continue;
      }
      const t = typeof v;
      if (t === 'number' || t === 'boolean' || t === 'string') {
        out.push({ tag: tag + '.' + k, value: v });
      } else if (t === 'object' && v) {
        // uniform bag
        if (v.value != null && (typeof v.value === 'number' || Array.isArray(v.value))) {
          out.push({ tag: tag + '.' + k + '.value', value: v.value });
        } else {
          dumpUniforms(v, tag + '.' + k, depth + 1, seen, out);
        }
      }
    }
  }

  const uni = [];
  const seenU = new WeakSet();
  try {
    const pps = scene?.postProcesses || scene?._postProcesses || [];
    const arr = Array.isArray(pps) ? pps : [...(pps || [])];
    arr.forEach((p, i) => {
      const name = p?.name || p?._name || p?.getClassName?.() || 'pp' + i;
      dumpUniforms(p, 'scenePP:' + name, 0, seenU, uni);
    });
  } catch {}
  try {
    const lm = bv._light_manager || bv.light_manager;
    dumpUniforms(lm, 'lm', 0, seenU, uni);
    const soft = lm?._soft_shadow || lm?.soft_shadow || lm?.get_soft_shadow?.();
    if (soft) dumpUniforms(soft, 'soft', 0, seenU, uni);
  } catch {}
  // materials on walls — occlusion_strength
  try {
    const meshes = scene?.meshes || [];
    for (const mesh of (Array.isArray(meshes) ? meshes : []).slice(0, 40)) {
      const mat = mesh.material;
      if (!mat) continue;
      const n = String(mat.name || '');
      if (!/paint|floor|herring|ceiling/i.test(n)) continue;
      dumpUniforms(mat, 'mat:' + n.slice(0, 40), 0, seenU, uni);
    }
  } catch {}

  const srcForSnips = (litSrc && litSrc.length > (bestPbr?.length || 0) ? litSrc : bestPbr) || '';

  const out = {
    ok: true,
    purpose: 'gl-v5-expanded+softPP+aoUniforms',
    when: new Date().toISOString(),
    pbrKeyCount: pbrKeys.length,
    pbrVariants,
    bestPbrKey: bestPbrKey ? bestPbrKey.slice(0, 200) : null,
    bestPbrLen: bestPbr?.length || 0,
    litKey: litKey ? litKey.slice(0, 200) : null,
    litLen: litSrc?.length || 0,
    stillHasIncludeOnly: /#include\s*<betrakta_material_renderer>/i.test(srcForSnips) && srcForSnips.length < 8000,
    snips: {
      soft: snip(srcForSnips, /ENABLE_SOFT|blurred_height|softShadow|soft_shadow|reference_height|SOFT_SHADOW/i),
      spot: snip(srcForSnips, /spot|punctual|coneCos|lightDir|outerAngle|innerAngle|lights\[|lightIntensity/i),
      atten: snip(srcForSnips, /attenuat|invSquare|distanceAttenuation|falloff|rangeAtten|1\.0\s*\/\s*\(/i),
      lightLoop: snip(srcForSnips, /for\s*\(\s*int[^;]+ACTIVE_LIGHTS|MAX_LIGHTS|lightCount|sampleLight/i),
      softSample: snip(srcForSnips, /sampleSoft|softShadowFactor|getSoft|heightmap/i),
      exposure: snip(srcForSnips, /betraktaOutput|exposure/i),
      renderer: snip(srcForSnips, /renderMaterial|vec3\s+renderMaterial/i),
    },
    softPP,
    uniforms: uni.slice(0, 80),
    pbrHead: srcForSnips ? srcForSnips.slice(0, 12000) : null,
    pbrMid: srcForSnips && srcForSnips.length > 20000
      ? srcForSnips.slice(Math.floor(srcForSnips.length / 2) - 4000, Math.floor(srcForSnips.length / 2) + 4000)
      : null,
    pbrTail: srcForSnips ? srcForSnips.slice(-6000) : null,
  };

  const s = JSON.stringify(out, null, 2);
  console.log(s);
  try {
    copy(s);
    console.log('%c→ буфер gl-v5 — вставьте JSON в чат', 'color:#0a0;font-weight:bold');
  } catch {}
  window.__cldIkeaGlV5 = out;
  window.__cldIkeaGlV5Pbr = srcForSnips || null;
  return {
    ok: true,
    bestPbrLen: out.bestPbrLen,
    litLen: out.litLen,
    softBlurLen: softPP.blur?.len || 0,
    uniCount: uni.length,
  };
})();
