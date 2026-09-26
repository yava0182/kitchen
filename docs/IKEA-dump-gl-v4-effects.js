/**
 * IKEA PAX — GL dump v4: только engine._compiledEffects
 * Достаёт полные fragment/vertex у betrakta_pbr + ao_* + soft/heightmap.
 * Пустая комната. F12 → вставить → JSON в чат (~2 с, без ожидания).
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

  function snip(src, re, n = 700) {
    if (!src) return null;
    const m = src.match(re);
    if (!m || m.index == null) return null;
    return src.slice(Math.max(0, m.index - 100), Math.min(src.length, m.index + n));
  }

  function collectStrings(obj, out, tag, depth, seen) {
    if (!obj || depth > 4 || out.length > 80) return;
    const t = typeof obj;
    if (t === 'string') {
      if (obj.length >= 400) out.push({ tag, len: obj.length, text: obj });
      return;
    }
    if (t !== 'object') return;
    if (seen.has(obj)) return;
    try {
      seen.add(obj);
    } catch {
      return;
    }
    let keys;
    try {
      keys = Object.getOwnPropertyNames(obj);
    } catch {
      return;
    }
    const prefer = keys.filter((k) =>
      /fragment|vertex|shader|source|code|glsl|compiled|effect|pipeline/i.test(k)
    );
    const rest = keys.filter((k) => !prefer.includes(k));
    const ordered = prefer.concat(rest).slice(0, depth <= 1 ? 60 : 35);
    for (const k of ordered) {
      let v;
      try {
        v = obj[k];
      } catch {
        continue;
      }
      if (typeof v === 'string' && v.length >= 400) {
        out.push({ tag: tag + '.' + k, len: v.length, text: v });
      } else if (v && typeof v === 'object') {
        collectStrings(v, out, tag + '.' + k, depth + 1, seen);
      } else if (typeof v === 'function' && /getSource|getCompiled|fragment|vertex/i.test(k)) {
        try {
          const r = v.call(obj);
          if (typeof r === 'string' && r.length >= 400) {
            out.push({ tag: tag + '.' + k + '()', len: r.length, text: r });
          } else if (r && typeof r === 'object') {
            collectStrings(r, out, tag + '.' + k + '()', depth + 1, seen);
          }
        } catch {}
      }
    }
  }

  function score(s) {
    let sc = Math.min(s.length / 2000, 50);
    if (/ENABLE_SOFT_SHADOWS|blurred_heightmap|soft_shadow/i.test(s)) sc += 100;
    if (/BetraktaSpot|punctualLight|coneCos|lightIntensity|NUM_LIGHTS|MAX_LIGHTS/i.test(s))
      sc += 50;
    if (/betraktaOutput|exposure/i.test(s)) sc += 20;
    if (/ao_compute|sampleKernel|occlusion/i.test(s)) sc += 15;
    if (/void main\s*\(/i.test(s)) sc += 10;
    return sc;
  }

  const core = findCore();
  if (!core?.betraktaViewer) {
    const err = { err: 'no betraktaViewer' };
    console.error(err);
    return err;
  }
  const bv = core.betraktaViewer;
  const scene = bv.scene || bv._scene;
  const engine = bv.engine || bv._engine || scene?.getEngine?.();
  const cache = engine?._compiledEffects || engine?.compiledEffects || null;

  const effectKeys = cache ? Object.keys(cache) : [];
  const interesting = effectKeys.filter((k) =>
    /betrakta_pbr|soft|heightmap|shadow|ao_|bilateral|compositor|blur/i.test(k)
  );

  const blobs = [];
  const seen = new WeakSet();
  for (const k of interesting) {
    collectStrings(cache[k], blobs, 'fx:' + k.slice(0, 120), 0, seen);
  }
  // также SoftShadow manager, если есть
  try {
    const lm = bv._light_manager || bv.light_manager;
    const soft = lm?._soft_shadow || lm?.soft_shadow || lm?.get_soft_shadow?.();
    if (soft) collectStrings(soft, blobs, 'softObj', 0, seen);
  } catch {}

  // уникальные по длине+префиксу
  const uniq = [];
  const seenPref = new Set();
  for (const b of blobs) {
    const pref = b.text.slice(0, 160) + '|' + b.len;
    if (seenPref.has(pref)) continue;
    seenPref.add(pref);
    uniq.push({ ...b, score: score(b.text) });
  }
  uniq.sort((a, b) => b.score - a.score || b.len - a.len);

  const pbr = uniq.find((b) => /betrakta_pbr/i.test(b.tag) && /void main|outColor|betraktaOutput/i.test(b.text)) ||
    uniq.find((b) => /betrakta_pbr/i.test(b.tag) && b.len > 5000) ||
    uniq[0];
  const aoCompute = uniq.find((b) => /ao_compute/i.test(b.tag));
  const aoApply = uniq.find((b) => /ao_apply/i.test(b.tag));
  const softBlob = uniq.find((b) => /soft|heightmap/i.test(b.tag + b.text.slice(0, 500)));

  const src = pbr?.text || '';

  function allSnips(text) {
    return {
      soft: snip(text, /ENABLE_SOFT|blurred_height|softShadow|soft_shadow|reference_height|SOFT_SHADOW/i),
      spot: snip(text, /spot|SpotLight|punctual|lightDir|cone|outerAngle|innerAngle|lightColor|light\.|lights\[/i),
      atten: snip(text, /attenuat|invSquare|distanceAttenuation|range|candela|intensity|falloff|1\.0\s*\/\s*\(/i),
      exposure: snip(text, /exposure|betraktaOutput|tonemap/i),
      occ: snip(text, /occlusion|aoFactor|ambientOcclusion|ao\s*\*=/i),
      env: snip(text, /ibl\s*\(|irradiance|environment|specularEnv/i),
      lightLoop: snip(text, /for\s*\(\s*int\s+\w+\s*=\s*0\s*;[^)]*MAX_LIGHTS|NUM_LIGHTS|lightCount/i),
    };
  }

  const out = {
    ok: true,
    purpose: 'gl-v4-compiledEffects',
    when: new Date().toISOString(),
    effectKeyCount: effectKeys.length,
    interestingCount: interesting.length,
    interestingKeys: interesting.slice(0, 40).map((k) => k.slice(0, 140)),
    blobCount: uniq.length,
    top: uniq.slice(0, 12).map((b) => ({ tag: b.tag.slice(0, 160), len: b.len, score: b.score })),
    pbrTag: pbr?.tag?.slice(0, 160) || null,
    pbrLen: src.length,
    snips: allSnips(src),
    softSnips: softBlob ? allSnips(softBlob.text) : null,
    softTag: softBlob?.tag?.slice(0, 160) || null,
    softLen: softBlob?.len || 0,
    aoComputeHead: aoCompute ? aoCompute.text.slice(0, 3500) : null,
    aoApplyHead: aoApply ? aoApply.text.slice(0, 2500) : null,
    pbrHead: src ? src.slice(0, 10000) : null,
    pbrTail: src ? src.slice(-5000) : null,
  };

  // ключевые #define из PBR
  if (src) {
    out.defines = (src.match(/#define [A-Z0-9_]+[^\n]*/g) || [])
      .filter((d) => /LIGHT|SOFT|SHADOW|SPOT|DIR|OCC|ENV|EXPOSURE|ACTIVE|NUM_/i.test(d))
      .slice(0, 80);
  }

  const s = JSON.stringify(out, null, 2);
  console.log(s);
  try {
    copy(s);
    console.log('%c→ буфер gl-v4 — вставьте JSON в чат', 'color:#0a0;font-weight:bold');
  } catch {}
  window.__cldIkeaGlV4 = out;
  window.__cldIkeaGlV4Pbr = src || null;
  return {
    ok: true,
    blobCount: uniq.length,
    pbrLen: src.length,
    interestingCount: interesting.length,
  };
})();
