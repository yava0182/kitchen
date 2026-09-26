/**
 * IKEA PAX — GL dump v7: ShaderStore + vendor JS (не WebGLProgram)
 * 1) Ищет IncludesShadersStore / ShaderStore с betrakta_material_renderer
 * 2) Fetch script URL’ов страницы → вырезает GLSL куски soft/spot/renderMaterial
 *
 * Пустая комната. F12 → вставить → ждать fetch (~5–15 с) → JSON в чат.
 */
(async () => {
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

  function snip(src, re, n = 1200) {
    if (!src) return null;
    const m = src.match(re);
    if (!m || m.index == null) return null;
    return src.slice(Math.max(0, m.index - 200), Math.min(src.length, m.index + n));
  }

  function score(s) {
    let sc = Math.min(s.length / 3000, 40);
    if (/ENABLE_SOFT_SHADOWS|blurred_heightmap|soft_shadow/i.test(s)) sc += 80;
    if (/renderMaterial|betrakta_material_renderer/i.test(s)) sc += 60;
    if (/coneCos|punctual|SpotLight|ACTIVE_LIGHTS/i.test(s)) sc += 40;
    if (/invSquare|attenuation|falloff/i.test(s)) sc += 20;
    return sc;
  }

  function addBlob(blobs, seen, tag, text) {
    if (typeof text !== 'string' || text.length < 400) return;
    if (!/soft|spot|light|renderMaterial|betrakta|heightmap|cone|attenuat|occlusion/i.test(text))
      return;
    const pref = text.slice(0, 120) + '|' + text.length;
    if (seen.has(pref)) return;
    seen.add(pref);
    blobs.push({ tag, len: text.length, score: score(text), text });
  }

  function walkStrings(o, tag, depth, seenObj, blobs, seenStr) {
    if (!o || depth > 4 || blobs.length > 100) return;
    if (typeof o === 'string') {
      addBlob(blobs, seenStr, tag, o);
      return;
    }
    if (typeof o !== 'object') return;
    if (seenObj.has(o)) return;
    try {
      seenObj.add(o);
    } catch {
      return;
    }
    let keys;
    try {
      keys = Object.getOwnPropertyNames(o);
    } catch {
      return;
    }
    // map-like: ShaderStore
    for (const k of keys.slice(0, 120)) {
      if (!/shader|include|fragment|vertex|betrakta|material|renderer|store|effect|glsl/i.test(k) && depth > 1)
        continue;
      let v;
      try {
        v = o[k];
      } catch {
        continue;
      }
      if (typeof v === 'string') addBlob(blobs, seenStr, tag + '.' + k, v);
      else if (v && typeof v === 'object') walkStrings(v, tag + '.' + k, depth + 1, seenObj, blobs, seenStr);
    }
  }

  const core = findCore();
  if (!core?.betraktaViewer) return { err: 'no betraktaViewer' };
  const bv = core.betraktaViewer;
  const scene = bv.scene || bv._scene;
  const engine = bv.engine || bv._engine || scene?.getEngine?.();

  const blobs = [];
  const seenObj = new WeakSet();
  const seenStr = new Set();

  // 1) known Babylon / Betrakta stores
  const storeRoots = [
    [engine, 'engine'],
    [bv, 'bv'],
    [window.BABYLON, 'BABYLON'],
    [window.Betrakta, 'Betrakta'],
    [window.ShaderStore, 'ShaderStore'],
    [engine?.__proto__, 'engineProto'],
  ];
  // Effect static?
  try {
    const Effect = engine?.constructor?.Effect || window.BABYLON?.Effect;
    if (Effect) {
      storeRoots.push([Effect.ShadersStore, 'Effect.ShadersStore']);
      storeRoots.push([Effect.IncludesShadersStore, 'Effect.IncludesShadersStore']);
      storeRoots.push([Effect, 'Effect']);
    }
  } catch {}

  for (const [obj, tag] of storeRoots) {
    if (obj) walkStrings(obj, tag, 0, seenObj, blobs, seenStr);
  }

  // 2) material effect includes / shader paths
  try {
    const meshes = scene?.meshes || [];
    for (const mesh of (Array.isArray(meshes) ? meshes : []).slice(0, 30)) {
      const mat = mesh.material;
      if (!mat) continue;
      const n = String(mat.name || '');
      if (!/paint|floor|herring|010|ceiling|betrakta/i.test(n + (mat.constructor?.name || ''))) continue;
      walkStrings(mat, 'mat:' + n.slice(0, 36), 0, seenObj, blobs, seenStr);
    }
  } catch {}

  // 3) fetch page scripts
  const scriptUrls = [
    ...new Set(
      [...document.querySelectorAll('script[src]')]
        .map((s) => s.src)
        .filter((u) => /betrakta|planner|vendor|chunk|pax|storage|addon/i.test(u))
    ),
  ].slice(0, 25);

  const fetchLog = [];
  for (const url of scriptUrls) {
    try {
      const r = await fetch(url, { credentials: 'include' });
      const text = await r.text();
      fetchLog.push({ url: url.slice(-80), status: r.status, len: text.length });
      // extract string literals that look like shader chunks
      const re =
        /betrakta_material_renderer|ENABLE_SOFT_SHADOWS|blurred_heightmap|renderMaterial\s*\(|coneCos|softShadowFactor|reference_height/gi;
      let m;
      const hits = [];
      re.lastIndex = 0;
      while ((m = re.exec(text)) && hits.length < 30) {
        hits.push(m.index);
      }
      for (const idx of hits) {
        const chunk = text.slice(Math.max(0, idx - 500), Math.min(text.length, idx + 4500));
        addBlob(blobs, seenStr, 'js:' + url.split('/').pop().slice(0, 40) + '@' + idx, chunk);
      }
      // also try to pull full include if named nearby
      const named = text.match(
        /betrakta_material_renderer["'\s:=]+(.{200,12000}?)(?=["']\s*[,;}]|betrakta_[a-z_]+["'\s:=])/is
      );
      if (named) addBlob(blobs, seenStr, 'jsNamed:renderer', named[1]);
    } catch (e) {
      fetchLog.push({ url: url.slice(-80), err: String(e.message || e) });
    }
  }

  blobs.sort((a, b) => b.score - a.score || b.len - a.len);
  const best = blobs[0];
  const softBlob = blobs.find((b) => /ENABLE_SOFT|blurred_height|softShadow|heightmap/i.test(b.text));
  const lightBlob = blobs.find((b) => /coneCos|punctual|ACTIVE_LIGHTS|sampleLight|Spot/i.test(b.text));
  const rendererBlob =
    blobs.find((b) => /renderMaterial|betrakta_material_renderer/i.test(b.text) && b.len > 2000) ||
    best;

  function pack(b) {
    if (!b) return null;
    const t = b.text;
    return {
      tag: b.tag.slice(0, 120),
      len: b.len,
      score: b.score,
      snips: {
        soft: snip(t, /ENABLE_SOFT|blurred_height|softShadow|heightmap|reference/i),
        spot: snip(t, /spot|punctual|cone|outerAngle|innerAngle|lightDir|lights\[/i),
        atten: snip(t, /attenuat|invSquare|falloff|distance|range/i),
        lightLoop: snip(t, /for\s*\(|ACTIVE_LIGHTS|MAX_LIGHTS|sampleLight|evaluateLight/i),
        softFactor: snip(t, /softShadow|shadowFactor|1\.0\s*-\s*|mix\s*\(/i),
        exposure: snip(t, /exposure|betraktaOutput/i),
        renderer: snip(t, /renderMaterial|vec3\s+render/i),
      },
      head: t.slice(0, 10000),
      tail: t.slice(-4000),
    };
  }

  const out = {
    ok: true,
    purpose: 'gl-v7-shaderStore+vendorJS',
    when: new Date().toISOString(),
    scriptUrlCount: scriptUrls.length,
    scriptUrls: scriptUrls.map((u) => u.slice(-100)),
    fetchLog,
    blobCount: blobs.length,
    top: blobs.slice(0, 12).map((b) => ({ tag: b.tag.slice(0, 100), len: b.len, score: b.score })),
    storeHit: pack(rendererBlob),
    softHit: pack(softBlob),
    lightHit: pack(lightBlob),
  };

  const s = JSON.stringify(out, null, 2);
  console.log(s);
  try {
    copy(s);
    console.log('%c→ буфер gl-v7 — вставьте JSON в чат', 'color:#0a0;font-weight:bold');
  } catch {}
  window.__cldIkeaGlV7 = out;
  return {
    ok: true,
    blobCount: blobs.length,
    bestLen: best?.len || 0,
    fetchOk: fetchLog.filter((x) => x.len).length,
  };
})();
