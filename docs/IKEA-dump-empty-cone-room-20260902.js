/**
 * IKEA empty room — live Spot cone + room size + floor coverage (one JSON).
 * Chrome, planner, ПУСТАЯ комната, дождаться 3D. F12 Console → paste → Enter.
 * Copy JSON into chat.
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

  function vec(v) {
    if (v == null) return null;
    if (typeof v === 'object' && (v.x != null || v._x != null)) {
      return {
        x: num(v.x ?? v._x),
        y: num(v.y ?? v._y),
        z: num(v.z ?? v._z),
        w: num(v.w ?? v._w),
      };
    }
    if (typeof v?.asArray === 'function') {
      const a = v.asArray();
      return { x: num(a[0]), y: num(a[1]), z: num(a[2]), w: num(a[3]) };
    }
    return null;
  }

  function deg(rad) {
    const r = num(rad);
    return r == null ? null : +(r * 180 / Math.PI).toFixed(4);
  }

  function pickSpot(L) {
    if (!L) return null;
    const inner =
      num(L.innerAngle ?? L._inner_angle ?? L._innerAngle ?? L.inner_angle) ??
      num(L.get_inner_angle?.());
    const outer =
      num(L.outerAngle ?? L._outer_angle ?? L._outerAngle ?? L.outer_angle) ??
      num(L.get_outer_angle?.());
    const data = typeof L.getLightData === 'function' ? L.getLightData() : null;
    return {
      class: L.constructor?.name,
      intensity: num(L.intensity ?? L._intensity),
      intensityMode: L.intensityMode ?? L._intensityMode ?? null,
      position: vec(L.position || L._position || L.get_position?.()),
      direction: vec(L.direction || L._direction || L.get_direction?.()),
      innerRad: inner,
      outerRad: outer,
      innerDeg: deg(inner),
      outerDeg: deg(outer),
      range: num(L.range ?? L._range),
      getLightData: data
        ? {
            class: data.constructor?.name,
            keys: Object.getOwnPropertyNames(data).slice(0, 40),
            position: vec(data.position),
            direction: vec(data.direction),
            innerAngle: num(data.innerAngle ?? data._innerAngle),
            outerAngle: num(data.outerAngle ?? data._outerAngle),
            range: num(data.range),
          }
        : null,
    };
  }

  function readUboLights(gl) {
    if (!gl?.getBufferSubData) return { err: 'no getBufferSubData' };
    const binding = gl.getParameter(gl.UNIFORM_BUFFER_BINDING);
    const max = Math.min(24, gl.getParameter(gl.MAX_UNIFORM_BUFFER_BINDINGS) || 8);
    const blocks = [];
    for (let i = 0; i < max; i++) {
      try {
        const buf = gl.getIndexedParameter(gl.UNIFORM_BUFFER_BINDING, i);
        if (!buf) continue;
        const size = gl.getBufferParameter(buf, gl.BUFFER_SIZE);
        if (!size || size < 64 || size > 8192) continue;
        const nFloat = Math.floor(size / 4);
        const f = new Float32Array(nFloat);
        gl.bindBuffer(gl.UNIFORM_BUFFER, buf);
        gl.getBufferSubData(gl.UNIFORM_BUFFER, 0, f);
        const lamp = [f[0], f[1], f[2], f[3]];
        const isLight =
          Math.abs(f[1] - 5) < 0.2 ||
          (Math.abs(f[0]) < 0.05 && Math.abs(f[2]) < 8 && f[1] > 2);
        blocks.push({
          binding: i,
          floats: nFloat,
          isLightUbo: !!isLight,
          position_attenuation: isLight ? [f[0], f[1], f[2], f[3]] : lamp,
          direction_attenuation: nFloat > 7 ? [f[4], f[5], f[6], f[7]] : null,
          color_line_and_range: nFloat > 11 ? [f[8], f[9], f[10], f[11]] : null,
        });
      } catch (e) {
        blocks.push({ binding: i, err: e.message });
      }
    }
    try {
      if (binding) gl.bindBuffer(gl.UNIFORM_BUFFER, binding);
    } catch {}
    const light = blocks.find((b) => b.isLightUbo) || blocks[0] || null;
    if (!light || !light.position_attenuation) return { blocks: blocks.slice(0, 8) };
    const pos = light.position_attenuation;
    const dir = light.direction_attenuation;
    const col = light.color_line_and_range;
    const outerCos = num(pos?.[3]);
    const innerCos = num(dir?.[3]);
    const innerHalfDeg = innerCos != null ? +(Math.acos(Math.min(1, Math.max(-1, innerCos))) * 180 / Math.PI).toFixed(4) : null;
    const outerHalfDeg = outerCos != null ? +(Math.acos(Math.min(1, Math.max(-1, outerCos))) * 180 / Math.PI).toFixed(4) : null;
    return {
      light,
      decoded: {
        pos_m: pos ? { x: pos[0], y: pos[1], z: pos[2] } : null,
        dir: dir ? { x: dir[0], y: dir[1], z: dir[2] } : null,
        innerCos,
        outerCos,
        innerHalfDeg,
        outerHalfDeg,
        innerFullDeg: innerHalfDeg != null ? +(innerHalfDeg * 2).toFixed(4) : null,
        outerFullDeg: outerHalfDeg != null ? +(outerHalfDeg * 2).toFixed(4) : null,
        colorLineAndRange: col,
      },
    };
  }

  function meshAabb(scene) {
    const list = scene?.meshes || [];
    const arr = Array.isArray(list) ? list : [...(list || [])];
    const xs = [];
    const ys = [];
    const zs = [];
    const floors = [];
    for (const mesh of arr) {
      const name = String(mesh.name || mesh.id || '');
      const mat = String(mesh.material?.name || mesh._material?.name || '');
      const low = (name + ' ' + mat).toLowerCase();
      if (/dimension|gizmo|ui_|label|viewerui|measure|plan.?overlay/i.test(low)) continue;
      if (!/paint|wall|floor|herring|ceiling|room/i.test(low)) continue;
      let bb = null;
      try {
        bb = mesh.getBoundingInfo?.()?.boundingBox;
      } catch {}
      const mn = vec(bb?.minimumWorld || bb?.minimum);
      const mx = vec(bb?.maximumWorld || bb?.maximum);
      if (!mn || !mx) continue;
      xs.push(mn.x, mx.x);
      ys.push(mn.y, mx.y);
      zs.push(mn.z, mx.z);
      if (/floor|herring/i.test(low)) {
        floors.push({
          mesh: name.slice(0, 80),
          mat: mat.slice(0, 80),
          min: mn,
          max: mx,
        });
      }
    }
    if (!xs.length) return { floors };
    const room = {
      minX: Math.min(...xs.filter(Number.isFinite)),
      maxX: Math.max(...xs.filter(Number.isFinite)),
      minY: Math.min(...ys.filter(Number.isFinite)),
      maxY: Math.max(...ys.filter(Number.isFinite)),
      minZ: Math.min(...zs.filter(Number.isFinite)),
      maxZ: Math.max(...zs.filter(Number.isFinite)),
    };
    room.width_m = +(room.maxX - room.minX).toFixed(4);
    room.depth_m = +(room.maxZ - room.minZ).toFixed(4);
    room.height_m = +(room.maxY - room.minY).toFixed(4);
    room.halfDiag_m = +(Math.hypot(room.width_m / 2, room.depth_m / 2)).toFixed(4);
    return { room, floors: floors.slice(0, 6) };
  }

  function digPlannerRoom(core) {
    const hits = [];
    const seen = new Set();
    const q = [{ o: core, p: 'core' }];
    let n = 0;
    while (q.length && n < 8000 && hits.length < 24) {
      const { o, p } = q.shift();
      n++;
      if (!o || typeof o !== 'object' || seen.has(o)) continue;
      seen.add(o);
      let w = null;
      let d = null;
      let h = null;
      try {
        w = num(o.width ?? o._width ?? o.roomWidth ?? o.innerWidth);
        d = num(o.depth ?? o._depth ?? o.roomDepth ?? o.length ?? o._length);
        h = num(o.height ?? o._height ?? o.roomHeight);
      } catch {}
      if (w != null && d != null && w > 1 && w < 20 && d > 1 && d < 20) {
        hits.push({ path: p.slice(0, 120), class: o.constructor?.name, width_m: w, depth_m: d, height_m: h });
      }
      if (p.split('.').length > 5) continue;
      for (const k of Object.getOwnPropertyNames(o).slice(0, 40)) {
        if (/fiber|react|memoized|webkit|debug/i.test(k)) continue;
        try {
          const v = o[k];
          if (v && typeof v === 'object') q.push({ o: v, p: p + '.' + k });
        } catch {}
      }
    }
    return hits.slice(0, 12);
  }

  const core = findCore();
  if (!core?.betraktaViewer) {
    const err = { err: 'no core — дождитесь 3D пустой комнаты', href: location.href };
    console.error(err);
    return err;
  }

  const bv = core.betraktaViewer;
  const lm = bv._light_manager || bv.light_manager;
  const scene = bv.scene || bv._scene;
  const canvas = document.querySelector('canvas');
  const gl =
    canvas?.getContext('webgl2', { preserveDrawingBuffer: true }) ||
    canvas?.getContext('webgl', { preserveDrawingBuffer: true });

  let punctual = [];
  try {
    punctual = lm?.get_punctual_lights?.() || [];
    if (!Array.isArray(punctual)) punctual = [...(punctual || [])];
  } catch {}

  const aabb = meshAabb(scene);
  const ubo = readUboLights(gl);
  const spotJs = pickSpot(punctual[0] || lm?._main_light);
  const dec = ubo?.decoded || {};
  const spotY = num(dec.pos_m?.y) ?? num(spotJs?.position?.y) ?? 5;
  const floorY = aabb.floors?.[0]?.max?.y ?? aabb.room?.minY ?? 0;
  const hLamp = spotY - floorY;
  const innerHalf = (num(dec.innerHalfDeg) ?? 32.5) * Math.PI / 180;
  const outerHalf = (num(dec.outerHalfDeg) ?? 53) * Math.PI / 180;
  const innerR = Math.tan(innerHalf) * hLamp;
  const outerR = Math.tan(outerHalf) * hLamp;
  const halfDiag = aabb.room?.halfDiag_m ?? null;

  const out = {
    ok: true,
    schema: 'ikea-empty-cone-room-20260902',
    when: new Date().toISOString(),
    href: location.href,
    note: 'Empty PAX. Cone from live UBO + JS light. Room from mesh AABB. Compare innerR vs halfDiag.',
    punctualCount: punctual.length,
    spotJs,
    uboCone: dec,
    roomAabb: aabb.room || null,
    floorMeshes: aabb.floors || [],
    plannerRoomHits: digPlannerRoom(core),
    coverage: {
      spotY_m: spotY,
      floorY_m: floorY,
      lampHeight_m: +hLamp.toFixed(4),
      innerRadiusOnFloor_m: +innerR.toFixed(4),
      outerRadiusOnFloor_m: +outerR.toFixed(4),
      roomHalfDiag_m: halfDiag,
      innerCoversWholeFloor: halfDiag == null ? null : innerR >= halfDiag,
      outerCoversWholeFloor: halfDiag == null ? null : outerR >= halfDiag,
      cornerInPenumbra: halfDiag == null ? null : innerR < halfDiag && outerR >= halfDiag,
      vsSoT: {
        innerFullDeg_sot: 65,
        outerFullDeg_sot: 106,
        innerCos_sot: 0.8433914458128857,
        outerCos_sot: 0.6018150231520484,
        aabb_20260828: { width_m: 5.14, depth_m: 4.14, halfDiag_m: 3.3 },
      },
    },
  };

  const s = JSON.stringify(out, null, 2);
  console.log(s);
  try {
    copy(s);
    console.log('%c→ скопировано ikea-empty-cone-room — вставьте JSON в чат', 'color:#0a0;font-weight:bold');
  } catch {
    console.log('copy() недоступен — скопируйте JSON из лога');
  }
  window.__ikeaEmptyConeRoom = out;
  return out;
})();
