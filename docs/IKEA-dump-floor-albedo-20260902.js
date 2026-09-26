/**
 * IKEA empty room — Floor_Herringbone albedo pixels + download PNG.
 * Chrome, planner, ПУСТАЯ комната. F12 Console → paste → Enter.
 * JSON копируется в буфер; PNG качается сам (положите в public/images/textures/ikea/floor/diffuse.jpg).
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
    while (q.length && n < 40000) {
      const f = q.shift();
      n++;
      const v = f?.memoizedProps?.value;
      if (v?.betraktaViewer) return v;
      if (f?.child) q.push(f.child);
      if (f?.sibling) q.push(f.sibling);
    }
    return null;
  }

  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function texMeta(tex) {
    if (!tex) return null;
    let size = null;
    try {
      size = tex.getSize?.();
    } catch {}
    return {
      class: tex.constructor?.name,
      name: String(tex.name || tex.id || '').slice(0, 120),
      url: tex.url || tex._url || tex.name || null,
      w: size?.width ?? tex.getSize?.()?.width ?? tex._width ?? tex.width ?? null,
      h: size?.height ?? tex.getSize?.()?.height ?? tex._height ?? tex.height ?? null,
      level: num(tex.level ?? tex._level),
      gammaSpace: tex.gammaSpace ?? tex._gammaSpace ?? null,
    };
  }

  function lum255(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  const core = findCore();
  if (!core?.betraktaViewer) {
    const err = { err: 'no core — дождитесь 3D пустой комнаты', href: location.href };
    console.error(err);
    return err;
  }

  const bv = core.betraktaViewer;
  const scene = bv.scene || bv._scene;
  const eng = scene.getEngine?.() || bv.engine;
  const list = scene?.meshes || [];
  const arr = Array.isArray(list) ? list : [...(list || [])];

  let hit = null;
  for (const mesh of arr) {
    const mat = mesh.material || mesh._material;
    const matName = String(mat?.name || mat?.id || '');
    const meshName = String(mesh.name || mesh.id || '');
    if (!/Floor_Herringbone|herring|wooden.?floor|floor/i.test(matName + ' ' + meshName)) continue;
    if (!/Herringbone|wooden|Floor_/i.test(matName) && !/floor/i.test(meshName)) continue;
    const tex =
      mat.albedoTexture ||
      mat._albedo_texture ||
      mat.diffuseTexture ||
      mat._diffuseTexture ||
      mat.baseTexture;
    hit = {
      mesh: meshName.slice(0, 90),
      mat: matName.slice(0, 90),
      matClass: mat?.constructor?.name,
      rough: num(mat._roughness ?? mat.roughness),
      metal: num(mat._metallic ?? mat.metallic),
      base: mat._base_color_factor || mat.baseColor || null,
      tex: texMeta(tex),
      texObj: tex,
      matObj: mat,
    };
    if (/Herringbone/i.test(matName)) break;
  }

  if (!hit?.texObj) {
    const err = { err: 'no Floor_Herringbone albedo', href: location.href, scanned: arr.length };
    console.error(err);
    return err;
  }

  const tex = hit.texObj;
  const w = hit.tex.w || 256;
  const h = hit.tex.h || 256;
  let pixels = null;
  let readErr = null;
  try {
    const internal = tex.getInternalTexture?.() || tex._texture;
    if (eng?._readTexturePixels && internal) {
      pixels = await eng._readTexturePixels(internal, w, h);
    } else if (eng?.readTexturePixels) {
      pixels = await eng.readTexturePixels(tex, 0, 0, w, h);
    } else {
      readErr = 'no engine readTexturePixels';
    }
  } catch (e) {
    readErr = e.message;
  }

  let stats = null;
  let dataUrl = null;
  if (pixels && pixels.length >= w * h * 4) {
    let sR = 0;
    let sG = 0;
    let sB = 0;
    const n = w * h;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(w, h);
    const src = pixels;
    for (let i = 0; i < n; i++) {
      const o = i * 4;
      let r = src[o];
      let g = src[o + 1];
      let b = src[o + 2];
      let a = src[o + 3];
      if (src instanceof Float32Array) {
        r = Math.round(Math.max(0, Math.min(1, r)) * 255);
        g = Math.round(Math.max(0, Math.min(1, g)) * 255);
        b = Math.round(Math.max(0, Math.min(1, b)) * 255);
        a = Math.round(Math.max(0, Math.min(1, a)) * 255);
      }
      img.data[o] = r;
      img.data[o + 1] = g;
      img.data[o + 2] = b;
      img.data[o + 3] = a === 0 ? 255 : a;
      sR += r;
      sG += g;
      sB += b;
    }
    ctx.putImageData(img, 0, 0);
    dataUrl = canvas.toDataURL('image/png');
    const meanR = sR / n;
    const meanG = sG / n;
    const meanB = sB / n;
    stats = {
      w,
      h,
      n,
      meanRgb: [+meanR.toFixed(2), +meanG.toFixed(2), +meanB.toFixed(2)],
      meanLum255: +lum255(meanR, meanG, meanB).toFixed(2),
      meanAlbedo01: +(lum255(meanR, meanG, meanB) / 255).toFixed(4),
      vsClodisFallback: {
        note: 'our measured fallback albedo lum 0.337; IKEA parquet needs ~0.467 to hit floor center 187.6',
        ikeaTargetLum01: 0.467,
      },
    };
    try {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'ikea-floor-herringbone-albedo.png';
      a.click();
    } catch {}
  }

  const out = {
    ok: true,
    schema: 'ikea-floor-albedo-20260902',
    when: new Date().toISOString(),
    href: location.href,
    mesh: hit.mesh,
    mat: hit.mat,
    matClass: hit.matClass,
    rough: hit.rough,
    metal: hit.metal,
    tex: hit.tex,
    readErr,
    stats,
    pngDownloaded: !!dataUrl,
    note: 'PNG should download. Put as Configurator-Clodis-ThreeJS-7/public/images/textures/ikea/floor/diffuse.jpg (convert) or .png. Paste this JSON in chat (no dataUrl).',
  };

  const s = JSON.stringify(out, null, 2);
  console.log(s);
  try {
    copy(s);
    console.log('%c→ скопировано ikea-floor-albedo — JSON в чат, PNG должен скачаться', 'color:#0a0;font-weight:bold');
  } catch {
    console.log('copy() недоступен — скопируйте JSON из лога');
  }
  window.__ikeaFloorAlbedo = out;
  return out;
})();
