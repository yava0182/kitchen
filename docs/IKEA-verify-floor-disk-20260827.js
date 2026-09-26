/**
 * IKEA PAX — сверка документа floor-wash с live консолью.
 *
 * Когда: пустая комната, вид СВЕРХУ (как Customize room / plan), Chrome us/en или se/en.
 * Куда: F12 Console → вставить целиком → JSON в чат.
 *
 * Проверяет пункты из IKEA-empty-floor-wash-20260827.json:
 *  - Soft empty = heightmap 0, plane alpha 0
 *  - Spot ACTIVE_LIGHTS=1, punctual exists
 *  - Пипетка: центр пола vs угол пола (круг виден только сверху)
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

  function vec(v) {
    if (v == null) return null;
    if (typeof v === 'object' && (v.x != null || v._x != null)) {
      return { x: num(v.x ?? v._x), y: num(v.y ?? v._y), z: num(v.z ?? v._z) };
    }
    if (typeof v?.asArray === 'function') {
      const a = v.asArray();
      return { x: num(a[0]), y: num(a[1]), z: num(a[2]) };
    }
    return null;
  }

  function sampleCanvasWood() {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { err: 'no canvas' };
    const url = canvas.toDataURL('image/png');
    const img = new Image();
    return new Promise((resolve) => {
      img.onload = () => {
        const c2 = document.createElement('canvas');
        c2.width = img.width;
        c2.height = img.height;
        const ctx = c2.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const w = img.width;
        const h = img.height;
        const pick = (nx, ny) => {
          const x = Math.min(w - 1, Math.max(0, Math.floor(nx * w)));
          const y = Math.min(h - 1, Math.max(0, Math.floor(ny * h)));
          const d = ctx.getImageData(x, y, 1, 1).data;
          const lum = 0.2126 * d[0] + 0.7152 * d[1] + 0.0722 * d[2];
          return {
            x,
            y,
            rgb: [d[0], d[1], d[2]],
            hex: '#' + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join(''),
            lum: +lum.toFixed(1),
          };
        };
        const pts = {
          floor_center: pick(0.5, 0.5),
          floor_corner_bl: pick(0.22, 0.72),
          floor_corner_br: pick(0.78, 0.72),
          floor_corner_tl: pick(0.22, 0.38),
          floor_corner_tr: pick(0.78, 0.38),
          wall_mid: pick(0.5, 0.18),
          surround: pick(0.03, 0.03),
        };
        const wood = [];
        for (let gy = 0; gy <= 20; gy++) {
          for (let gx = 0; gx <= 20; gx++) {
            const nx = 0.06 + (gx / 20) * 0.88;
            const ny = 0.28 + (gy / 20) * 0.66;
            const s = pick(nx, ny);
            const [r, g, b] = s.rgb;
            const sat = Math.max(r, g, b) - Math.min(r, g, b);
            if (r > 120 && b < 200 && r > b + 12 && sat > 18) wood.push({ gx, gy, ...s });
          }
        }
        wood.sort((a, b) => a.lum - b.lum);
        const centerWood = wood.filter((p) => p.gx >= 8 && p.gx <= 12 && p.gy >= 8 && p.gy <= 12);
        const edgeWood = wood.filter((p) => p.gx <= 2 || p.gx >= 18 || p.gy <= 2 || p.gy >= 18);
        const avg = (arr) =>
          arr.length
            ? +(arr.reduce((s, p) => s + p.lum, 0) / arr.length).toFixed(1)
            : null;
        resolve({
          canvas: [w, h],
          pts,
          wood: {
            n: wood.length,
            dark: wood[0] || null,
            bright: wood[wood.length - 1] || null,
            delta: wood.length
              ? +(wood[wood.length - 1].lum - wood[0].lum).toFixed(1)
              : null,
            centerAvg: avg(centerWood),
            edgeAvg: avg(edgeWood),
            centerMinusEdge:
              centerWood.length && edgeWood.length
                ? +(avg(centerWood) - avg(edgeWood)).toFixed(1)
                : null,
          },
        });
      };
      img.onerror = () => resolve({ err: 'canvas read fail' });
      img.src = url;
    });
  }

  async function heightmapStats(ssr, eng) {
    try {
      const tex = ssr.get_blurred_heightmap?.();
      if (!tex) return { err: 'no heightmap' };
      const size = tex.getSize();
      const w = size.width;
      const h = size.height;
      const px = await eng._readTexturePixels(tex.getInternalTexture(), w, h);
      let min = Infinity;
      let max = -Infinity;
      let sum = 0;
      let nz = 0;
      for (let i = 0; i < px.length; i += 4) {
        const v = +px[i];
        sum += v;
        if (v < min) min = v;
        if (v > max) max = v;
        if (Math.abs(v) > 1e-5) nz++;
      }
      return { w, h, min, max, mean: sum / (w * h), nz };
    } catch (e) {
      return { err: e.message };
    }
  }

  async function planeStats(ssr, eng) {
    try {
      ssr.update_shadow_plane_texture?.();
      const tex = ssr._shadow_plane_target;
      const size = tex.getSize();
      const w = size.width;
      const h = size.height;
      const px = await eng._readTexturePixels(tex.getInternalTexture(), w, h);
      let aMax = 0;
      let aNz = 0;
      for (let i = 0; i < px.length; i += 4) {
        const a = +px[i + 3];
        if (a > aMax) aMax = a;
        if (a > 0.002) aNz++;
      }
      return { w, h, aMax, aNz };
    } catch (e) {
      return { err: e.message };
    }
  }

  (async () => {
    const core = findCore();
    if (!core) {
      const err = { err: 'no core — дождитесь 3D, пустая комната сверху, повторите' };
      console.error(err);
      return err;
    }

    const bv = core.betraktaViewer;
    const lm = bv._light_manager || bv.light_manager;
    const ssr = lm._soft_shadow_renderer || lm.soft_shadow_renderer;
    const scene = bv.scene || bv._scene;
    const eng = scene.getEngine();
    const spot = lm.get_punctual_lights?.()?.[0] || lm._main_light;

    let defs = null;
    try {
      for (const m of scene.meshes) {
        const mat = m.material;
        if (!/Floor_Herringbone|paint_30x30/i.test(String(mat?.name || ''))) continue;
        const fx = mat.getEffect?.() || mat._drawWrapper?.effect;
        const d = String(fx?.defines || '');
        const pick = {};
        for (const k of [
          'ACTIVE_LIGHTS',
          'ACTIVE_SHADOW_LIGHTS',
          'ENABLE_SOFT_SHADOWS',
          'ENABLE_ENVIRONMENT_MAP',
        ]) {
          const m2 = d.match(new RegExp('#define\\s+' + k + '\\s+(\\S+)'));
          pick[k] = m2 ? m2[1] : null;
        }
        defs = { mat: String(mat.name).slice(0, 80), pick };
        break;
      }
    } catch (e) {
      defs = { err: e.message };
    }

    const hm = await heightmapStats(ssr, eng);
    const plane = await planeStats(ssr, eng);
    const screen = await sampleCanvasWood();

    const docClaims = {
      softEmptyHeightmapZero: hm.nz === 0,
      softEmptyPlaneAlphaZero: plane.aNz === 0,
      spotPunctualOn: (lm.get_punctual_lights?.()?.length || 0) >= 1,
      activeLightsShader: defs?.pick?.ACTIVE_LIGHTS === '1',
      docWrongIfTopDownDiskVisible:
        'Документ писал «не жёсткий круг» — если screen.wood.centerMinusEdge > 15 при виде сверху, вывод документа неверен',
    };

    const out = {
      ok: true,
      schema: 'ikea-verify-floor-disk-20260827',
      when: new Date().toISOString(),
      url: location.href,
      note: 'Снимайте при виде СВЕРХУ (Customize room). Иначе круг не виден — это не баг.',
      spot: {
        class: spot?.constructor?.name,
        intensity: spot?.intensity ?? spot?._intensity,
        position: vec(spot?.position || spot?._position),
        direction: vec(spot?.direction || spot?._direction),
      },
      soft: {
        intensity: ssr?.intensity ?? ssr?._intensity,
        resolution: ssr?.resolution ?? ssr?._resolution,
        center: vec(ssr?.center || ssr?._tracked_center_position),
        size: vec(ssr?.size || ssr?._tracked_size),
        refH: ssr?.reference_height ?? ssr?._reference_height,
        renderMask: ssr?._render_layer_mask?.bitmap ?? ssr?._render_layer_mask,
        blockMask: ssr?._block_layer_mask?.bitmap ?? ssr?._block_layer_mask,
        heightmap: hm,
        planeTarget: plane,
      },
      shader: defs,
      screen,
      docClaims,
      compareToDoc: {
        file: 'IKEA-empty-floor-wash-20260827.json',
        stillTrue: [
          'Soft empty heightmap nz=0',
          'Soft plane alpha nz=0 on empty',
          'Spot 115 cd, dir down, ACTIVE_LIGHTS=1',
        ],
        likelyWrong: [
          '«mild wash not a hard disk» — only true from wall camera, NOT top-down',
          '«do not draw fake bright circle» — circle is real Spot cone from above',
          'floor HEX/lum from doc sampled wrong camera angle',
        ],
      },
    };

    const s = JSON.stringify(out, null, 2);
    console.log(s);
    try {
      copy(s);
      console.log('%c→ скопировано — вставьте JSON в чат', 'color:#0a0;font-weight:bold');
    } catch {
      console.log('%ccopy() недоступен — скопируйте JSON из лога', 'color:#a60');
    }
    window.__cldIkeaVerifyFloorDisk = out;
    return out;
  })();
})();
