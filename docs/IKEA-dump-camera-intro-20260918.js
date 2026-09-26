/**
 * IKEA PAX — dump въезда камеры (OrbitPlannerCamera offset settle).
 * Chrome, свой браузер (не Cursor), empty room us/en.
 * F12 → Console → вставить весь файл → Enter → дождаться JSON → copy() / Ctrl+V в чат.
 *
 * Как поймать въезд:
 *  A) Надёжно (рекомендую): дождаться полной загрузки → вставить → скрипт сам
 *     отодвинет offset и запишет settle (тот же spring, что zoom).
 *  B) Холодный старт: Ctrl+Shift+R → как только Console жива, сразу Enter
 *     (если вставили заранее — не сработает после reload; вставляйте ПОСЛЕ появления canvas).
 */
(async () => {
  const DURATION_MS = 3500;
  const SAMPLE_EVERY_MS = 33; // ~30 Hz
  const PULL = 1.85; // во сколько раз отодвинуть _offset от текущего (replay)
  const WAIT_VIEWER_MS = 45000;

  function findCore() {
    const rootEl = document.querySelector('#root') || document.body;
    const key = Object.keys(rootEl).find(
      (k) => k.startsWith('__reactContainer') || k.startsWith('__reactFiber')
    );
    let fiber = key ? rootEl[key] : null;
    if (fiber?.stateNode?.current) fiber = fiber.stateNode.current;
    const q = [fiber];
    let n = 0;
    while (q.length && n < 50000) {
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
    // column-major 4x4: eye ≈ -R^T * t
    const a = m?.m || m;
    if (!a || a.length < 16) return null;
    const r00 = a[0], r01 = a[4], r02 = a[8];
    const r10 = a[1], r11 = a[5], r12 = a[9];
    const r20 = a[2], r21 = a[6], r22 = a[10];
    const tx = a[12], ty = a[13], tz = a[14];
    return {
      x: num(-(r00 * tx + r10 * ty + r20 * tz)),
      y: num(-(r01 * tx + r11 * ty + r21 * tz)),
      z: num(-(r02 * tx + r12 * ty + r22 * tz)),
    };
  }

  function digCameras(root) {
    const hits = [];
    const seen = new Set();
    const q = [{ o: root, p: 'bv' }];
    let n = 0;
    while (q.length && n < 12000 && hits.length < 16) {
      const { o, p } = q.shift();
      n++;
      if (!o || typeof o !== 'object' || seen.has(o)) continue;
      seen.add(o);
      let score = 0;
      const hasOffset = '_offset' in o || 'offset' in o;
      const hasTargetOff = '_target_offset' in o || 'target_offset' in o;
      const name = o.constructor?.name || '';
      if (hasOffset) score += 2;
      if (hasTargetOff) score += 3;
      if (/Orbit|Planner|Camera/i.test(name)) score += 2;
      if (typeof o.set_offset === 'function' || typeof o.set_target_offset === 'function') score += 2;
      if (score >= 3) {
        hits.push({
          path: p.slice(0, 160),
          class: name,
          score,
          offset: num(o._offset ?? o.offset),
          target_offset: num(o._target_offset ?? o.target_offset),
          keys: Object.getOwnPropertyNames(o).filter((k) =>
            /offset|target|inertia|spring|zoom|pitch|yaw|phi|theta|position/i.test(k)
          ).slice(0, 40),
          ref: o,
        });
      }
      if (p.split('.').length > 6) continue;
      let keys = [];
      try {
        keys = Object.getOwnPropertyNames(o).slice(0, 50);
      } catch {
        continue;
      }
      for (const k of keys) {
        if (/fiber|react|memoized|webkit|debug|shader|texture|buffer/i.test(k)) continue;
        try {
          const v = o[k];
          if (v && typeof v === 'object') q.push({ o: v, p: p + '.' + k });
        } catch {}
      }
    }
    hits.sort((a, b) => b.score - a.score);
    return hits;
  }

  function sampleOne(bv, camHit) {
    const cam = camHit?.ref;
    const babylon =
      bv.camera ||
      bv._camera ||
      bv.get_camera?.() ||
      bv._engine_camera ||
      null;
    let view = null;
    try {
      view = babylon?.getViewMatrix?.() || babylon?._cached_view_matrix || null;
    } catch {}
    const eyeVM = eyeFromViewMatrix(view);
    const pos = vec(babylon?.globalPosition || babylon?.position || babylon?._globalPosition);
    return {
      t: +performance.now().toFixed(1),
      offset: cam ? num(cam._offset ?? cam.offset) : null,
      target_offset: cam ? num(cam._target_offset ?? cam.target_offset) : null,
      eye_view_m: eyeVM,
      eye_pos_m: pos,
      cam_class: camHit?.class || null,
    };
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  console.log('[CLD intro] waiting for betraktaViewer…');
  let core = null;
  const tWait0 = performance.now();
  while (performance.now() - tWait0 < WAIT_VIEWER_MS) {
    core = findCore();
    if (core?.betraktaViewer) break;
    await sleep(100);
  }
  if (!core?.betraktaViewer) {
    const err = { ok: false, err: 'no betraktaViewer — откройте empty PAX и дождитесь 3D' };
    console.error(err);
    return err;
  }

  const bv = core.betraktaViewer;
  const cams = digCameras(bv);
  const best = cams[0] || null;
  if (!best) {
    const err = {
      ok: false,
      err: 'OrbitPlannerCamera not found — пришлите Object.keys вокруг viewer',
      bvKeys: Object.getOwnPropertyNames(bv).slice(0, 60),
    };
    console.error(err);
    return err;
  }

  const cam = best.ref;
  const before = sampleOne(bv, best);
  const startOffset = before.offset;
  const startTarget = before.target_offset;

  // Replay: отодвинуть текущий offset, оставить target — spring/lerp как zoom settle.
  let replay = { applied: false };
  if (startOffset != null && startOffset > 0.1) {
    const pulled = +(startOffset * PULL).toFixed(4);
    try {
      if (typeof cam.set_offset === 'function') cam.set_offset(pulled);
      else cam._offset = pulled;
      // target остаётся финальным (или текущий target_offset)
      if (startTarget != null) {
        if (typeof cam.set_target_offset === 'function') cam.set_target_offset(startTarget);
        else cam._target_offset = startTarget;
      }
      replay = { applied: true, from: startOffset, pulled, target: startTarget, pull: PULL };
      console.log('[CLD intro] replay pull', replay);
    } catch (e) {
      replay = { applied: false, err: String(e) };
    }
  }

  const samples = [];
  const t0 = performance.now();
  samples.push({ ...sampleOne(bv, best), phase: 't0' });

  while (performance.now() - t0 < DURATION_MS) {
    await sleep(SAMPLE_EVERY_MS);
    samples.push(sampleOne(bv, best));
  }

  const first = samples[0];
  const last = samples[samples.length - 1];
  const out = {
    ok: true,
    schema: 'ikea-camera-intro-20260918',
    when: new Date().toISOString(),
    href: location.href,
    note:
      'Replay pull×' +
      PULL +
      ' на _offset → settle. Если cold-start: вставьте сразу после canvas и пришлите samples без replay.',
    durationMs: DURATION_MS,
    sampleEveryMs: SAMPLE_EVERY_MS,
    cameraHit: {
      path: best.path,
      class: best.class,
      score: best.score,
      keys: best.keys,
    },
    otherCameraHits: cams.slice(1, 5).map((c) => ({
      path: c.path,
      class: c.class,
      score: c.score,
      offset: c.offset,
      target_offset: c.target_offset,
    })),
    replay,
    before,
    first,
    last,
    deltaOffset: {
      start: first?.offset,
      end: last?.offset,
      d: first?.offset != null && last?.offset != null ? +(last.offset - first.offset).toFixed(4) : null,
    },
    samples,
  };

  window.__cldIkeaCameraIntroDump = out;
  try {
    copy(JSON.stringify(out, null, 2));
    console.log('[CLD intro] OK — JSON в буфере (copy). Ctrl+V в чат.');
  } catch {
    console.log('[CLD intro] OK — window.__cldIkeaCameraIntroDump ; скопируйте вручную:');
    console.log(JSON.stringify(out, null, 2));
  }
  return out;
})();
