/**
 * IKEA PAX — camera intro dump v2 (probe, не падает).
 * Chrome, empty room, F12 → Console → paste → Enter.
 * copy() → Ctrl+V в чат (весь JSON).
 *
 * Если камера не на bv — ищет по core + глубже + пишет bvKeys/coreKeys.
 * Replay: если найдёт _offset — отодвинет ×PULL и снимет settle.
 * Иначе всё равно снимет eye из view matrix 3.5 с (на случай cold-start).
 */
(async () => {
  const DURATION_MS = 3500;
  const SAMPLE_EVERY_MS = 33;
  const PULL = 1.85;
  const WAIT_MS = 45000;

  function findCore() {
    const rootEl = document.querySelector('#root') || document.body;
    const key = Object.keys(rootEl).find(
      (k) => k.startsWith('__reactContainer') || k.startsWith('__reactFiber')
    );
    let fiber = key ? rootEl[key] : null;
    if (fiber?.stateNode?.current) fiber = fiber.stateNode.current;
    const q = [fiber];
    let n = 0;
    while (q.length && n < 60000) {
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
    return Number.isFinite(n) ? +n : null;
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

  function eyeFromViewMatrix(m) {
    const a = m?.m || m;
    if (!a || a.length < 16) return null;
    const r00 = a[0],
      r01 = a[4],
      r02 = a[8];
    const r10 = a[1],
      r11 = a[5],
      r12 = a[9];
    const r20 = a[2],
      r21 = a[6],
      r22 = a[10];
    const tx = a[12],
      ty = a[13],
      tz = a[14];
    return {
      x: num(-(r00 * tx + r10 * ty + r20 * tz)),
      y: num(-(r01 * tx + r11 * ty + r21 * tz)),
      z: num(-(r02 * tx + r12 * ty + r22 * tz)),
    };
  }

  function safeKeys(o, n = 80) {
    try {
      return Object.getOwnPropertyNames(o).slice(0, n);
    } catch {
      return [];
    }
  }

  function digOffsetCams(roots) {
    const hits = [];
    const seen = new Set();
    const q = [];
    for (const [label, o] of roots) q.push({ o, p: label, d: 0 });
    let n = 0;
    while (q.length && n < 25000 && hits.length < 40) {
      const { o, p, d } = q.shift();
      n++;
      if (!o || typeof o !== 'object' || seen.has(o)) continue;
      seen.add(o);

      let off = null;
      let toff = null;
      try {
        off = num(o._offset ?? o.offset);
        toff = num(o._target_offset ?? o.target_offset);
      } catch {}

      const name = o.constructor?.name || '';
      const hasSetter =
        typeof o.set_offset === 'function' ||
        typeof o.set_target_offset === 'function' ||
        typeof o.setOffset === 'function';

      // любой объект с числовым offset (не текстуры)
      if (
        (off != null && off > 0.05 && off < 80) ||
        (toff != null && toff > 0.05 && toff < 80) ||
        /Orbit|PlannerCamera|CameraController|Framing/i.test(name)
      ) {
        hits.push({
          path: p.slice(0, 200),
          class: name,
          offset: off,
          target_offset: toff,
          hasSetter,
          keys: safeKeys(o, 50).filter((k) =>
            /offset|target|inertia|spring|zoom|pitch|yaw|phi|theta|position|view|matrix/i.test(k)
          ),
          ref: o,
        });
      }

      if (d >= 8) continue;
      for (const k of safeKeys(o, 60)) {
        if (/fiber|react|memoized|webkit|debug|shader|texture|buffer|wasm|audio/i.test(k)) continue;
        try {
          const v = o[k];
          if (v && typeof v === 'object') q.push({ o: v, p: p + '.' + k, d: d + 1 });
        } catch {}
      }
    }
    hits.sort((a, b) => {
      const sa =
        (a.target_offset != null ? 3 : 0) + (a.offset != null ? 2 : 0) + (a.hasSetter ? 2 : 0);
      const sb =
        (b.target_offset != null ? 3 : 0) + (b.offset != null ? 2 : 0) + (b.hasSetter ? 2 : 0);
      return sb - sa;
    });
    return hits;
  }

  function findBabylonCam(bv, core) {
    const cands = [
      bv?.camera,
      bv?._camera,
      bv?.get_camera?.(),
      bv?._engine_camera,
      bv?.engine_camera,
      bv?._babylon_camera,
      core?.camera,
      core?._camera,
    ];
    for (const c of cands) if (c) return c;
    // dig by view matrix
    const seen = new Set();
    const q = [bv, core];
    let n = 0;
    while (q.length && n < 8000) {
      const o = q.shift();
      n++;
      if (!o || typeof o !== 'object' || seen.has(o)) continue;
      seen.add(o);
      try {
        if (typeof o.getViewMatrix === 'function' || o._cached_view_matrix) return o;
      } catch {}
      for (const k of safeKeys(o, 40)) {
        if (/fiber|react|shader|texture|buffer/i.test(k)) continue;
        try {
          const v = o[k];
          if (v && typeof v === 'object') q.push(v);
        } catch {}
      }
    }
    return null;
  }

  function sample(bv, core, camHit, babylon) {
    let view = null;
    try {
      view = babylon?.getViewMatrix?.() || babylon?._cached_view_matrix || null;
    } catch {}
    const cam = camHit?.ref;
    return {
      t: +performance.now().toFixed(1),
      offset: cam ? num(cam._offset ?? cam.offset) : null,
      target_offset: cam ? num(cam._target_offset ?? cam.target_offset) : null,
      eye_view_m: eyeFromViewMatrix(view),
      eye_pos_m: vec(
        babylon?.globalPosition || babylon?.position || babylon?._globalPosition
      ),
      cam_class: camHit?.class || babylon?.constructor?.name || null,
    };
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  console.log('[CLD intro v2] waiting…');
  let core = null;
  const t0w = performance.now();
  while (performance.now() - t0w < WAIT_MS) {
    core = findCore();
    if (core?.betraktaViewer) break;
    await sleep(100);
  }
  if (!core?.betraktaViewer) {
    const err = { ok: false, err: 'no betraktaViewer' };
    console.error(err);
    return err;
  }

  const bv = core.betraktaViewer;
  const cams = digOffsetCams([
    ['bv', bv],
    ['core', core],
  ]);
  // prefer both offset + target_offset
  const best =
    cams.find((c) => c.offset != null && c.target_offset != null) ||
    cams.find((c) => c.hasSetter) ||
    cams[0] ||
    null;

  const babylon = findBabylonCam(bv, core);
  const before = sample(bv, core, best, babylon);

  let replay = { applied: false };
  if (best?.ref && before.offset != null && before.offset > 0.1) {
    const cam = best.ref;
    const pulled = +(before.offset * PULL).toFixed(4);
    try {
      if (typeof cam.set_offset === 'function') cam.set_offset(pulled);
      else if (typeof cam.setOffset === 'function') cam.setOffset(pulled);
      else cam._offset = pulled;
      const tgt = before.target_offset ?? before.offset / PULL;
      if (typeof cam.set_target_offset === 'function') cam.set_target_offset(tgt);
      else if ('_target_offset' in cam) cam._target_offset = tgt;
      replay = {
        applied: true,
        from: before.offset,
        pulled,
        target: tgt,
        pull: PULL,
        path: best.path,
      };
      console.log('[CLD intro v2] replay', replay);
    } catch (e) {
      replay = { applied: false, err: String(e) };
    }
  }

  const samples = [];
  const t0 = performance.now();
  samples.push({ ...sample(bv, core, best, babylon), phase: 't0' });
  while (performance.now() - t0 < DURATION_MS) {
    await sleep(SAMPLE_EVERY_MS);
    samples.push(sample(bv, core, best, babylon));
  }

  const first = samples[0];
  const last = samples[samples.length - 1];

  // лёгкий снимок значений по ключам bv (без циклических объектов)
  const bvPeek = {};
  for (const k of safeKeys(bv, 60)) {
    try {
      const v = bv[k];
      const t = v == null ? 'null' : typeof v;
      bvPeek[k] =
        t === 'object'
          ? { t, class: v?.constructor?.name || null }
          : t === 'function'
            ? 'fn'
            : v;
    } catch (e) {
      bvPeek[k] = 'err:' + e.message;
    }
  }

  const out = {
    ok: true,
    schema: 'ikea-camera-intro-v2-20260918',
    when: new Date().toISOString(),
    href: location.href,
    replay,
    cameraHit: best
      ? {
          path: best.path,
          class: best.class,
          offset: best.offset,
          target_offset: best.target_offset,
          hasSetter: best.hasSetter,
          keys: best.keys,
        }
      : null,
    otherHits: cams.slice(0, 12).map((c) => ({
      path: c.path,
      class: c.class,
      offset: c.offset,
      target_offset: c.target_offset,
      hasSetter: c.hasSetter,
    })),
    babylonClass: babylon?.constructor?.name || null,
    bvKeys: safeKeys(bv, 80),
    coreKeys: safeKeys(core, 80),
    bvPeek,
    before,
    first,
    last,
    deltaOffset: {
      start: first?.offset,
      end: last?.offset,
      d:
        first?.offset != null && last?.offset != null
          ? +(last.offset - first.offset).toFixed(4)
          : null,
    },
    deltaEyeZ: {
      start: first?.eye_view_m?.z ?? first?.eye_pos_m?.z,
      end: last?.eye_view_m?.z ?? last?.eye_pos_m?.z,
    },
    samples,
  };

  window.__cldIkeaCameraIntroDump = out;
  const s = JSON.stringify(out, null, 2);
  try {
    copy(s);
    console.log('%c[CLD intro v2] OK — JSON в буфере. Ctrl+V в чат.', 'color:#0a0;font-weight:bold');
  } catch {
    console.log('[CLD intro v2] OK — window.__cldIkeaCameraIntroDump');
    console.log(s);
  }
  return out;
})();
