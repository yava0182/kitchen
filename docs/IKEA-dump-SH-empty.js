/**
 * IKEA v0 — SH: SphericalPolynomial → diffuseSH_L00…L22 (preScaled UBO layout).
 * Пустая комната → F12 → Console → весь файл → Enter → copy() → Ctrl+V в чат.
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

  const rgb = (c) => {
    if (!c) return null;
    if (typeof c.r === 'number') return [+c.r, +c.g, +c.b];
    if (typeof c.x === 'number') return [+c.x, +c.y, +c.z];
    if (Array.isArray(c)) return c.slice(0, 3).map(Number);
    if (typeof c.asArray === 'function') return [...c.asArray()].slice(0, 3).map(Number);
    return null;
  };

  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul3s = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const vec4 = (a) => [a[0], a[1], a[2], 0];

  /** Babylon SphericalPolynomial → 9× RGB (Three/Babylon SH order). */
  function polyToSh9(poly) {
    try {
      const SH = window.BABYLON?.SphericalHarmonics;
      if (SH?.FromPolynomial) {
        const sh = SH.FromPolynomial(poly);
        return sh.coefficients.map((c) => rgb(c));
      }
    } catch (e) {
      /* fall through */
    }

    const x = rgb(poly.x) || [0, 0, 0];
    const y = rgb(poly.y) || [0, 0, 0];
    const z = rgb(poly.z) || [0, 0, 0];
    const xx = rgb(poly.xx) || [0, 0, 0];
    const yy = rgb(poly.yy) || [0, 0, 0];
    const zz = rgb(poly.zz) || [0, 0, 0];
    const xy = rgb(poly.xy) || [0, 0, 0];
    const yz = rgb(poly.yz) || [0, 0, 0];
    const zx = rgb(poly.zx) || [0, 0, 0];
    const h0 = rgb(poly._harmonics);

    // Inverse of Babylon FromHarmonics (v7 layout)
    const c0 = h0 || add3(add3(xx, yy), zz);
    const c1 = y;
    const c2 = z;
    const c3 = x;
    const c4 = xy;
    const c5 = yz;
    const c6 = sub3(sub3(mul3s(zz, 3), xx), yy);
    const c7 = zx;
    const c8 = sub3(xx, yy);
    return [c0, c1, c2, c3, c4, c5, c6, c7, c8];
  }

  /** Three raw SH → IKEA preScaled (betrakta-env-sh.js / DEy_Xiep). */
  function toIkeaPrescaled(sh9) {
    const s = [
      0.886227,
      2 * 0.511664,
      2 * 0.511664,
      2 * 0.511664,
      2 * 0.429043,
      2 * 0.429043,
      0.743125 / 3,
      2 * 0.429043,
      0.429043,
    ];
    return sh9.map((c, i) => mul3s(c, s[i]));
  }

  function toUboNames(scaled9) {
    return {
      diffuseSH_L00: vec4(scaled9[0]),
      diffuseSH_L1_1: vec4(scaled9[1]),
      diffuseSH_L10: vec4(scaled9[2]),
      diffuseSH_L11: vec4(scaled9[3]),
      diffuseSH_L2_2: vec4(scaled9[4]),
      diffuseSH_L2_1: vec4(scaled9[5]),
      diffuseSH_L20: vec4(scaled9[6]),
      diffuseSH_L21: vec4(scaled9[7]),
      diffuseSH_L22: vec4(scaled9[8]),
    };
  }

  const core = findCore();
  const bv = core?.betraktaViewer;
  const scene = bv?.scene || bv?._scene;
  if (!scene) {
    console.error({ err: 'no betraktaViewer scene' });
    return { err: 'no scene' };
  }

  const lm = bv?.light_manager || bv?._light_manager;
  const lmEnv = lm?._environment || lm?.environment;
  const envTex =
    lmEnv?.texture ||
    lmEnv?._texture ||
    lmEnv?._environment_texture ||
    scene.environmentTexture ||
    scene._environmentTexture;

  let poly =
    envTex?.sphericalPolynomial ||
    envTex?._sphericalPolynomial ||
    lmEnv?.spherical_polynomial ||
    lmEnv?._spherical_polynomial ||
    null;

  if (!poly) {
    const irr = envTex?._irradianceMap || envTex?._sphericalHarmonics;
    if (irr && irr.x != null) poly = irr;
  }

  const paths = {};

  if (poly) {
    paths.polynomial = {
      x: rgb(poly.x),
      y: rgb(poly.y),
      z: rgb(poly.z),
      xx: rgb(poly.xx),
      yy: rgb(poly.yy),
      zz: rgb(poly.zz),
      xy: rgb(poly.xy),
      yz: rgb(poly.yz),
      zx: rgb(poly.zx),
      _harmonics: rgb(poly._harmonics),
    };
    const sh9 = polyToSh9(poly);
    const scaled = toIkeaPrescaled(sh9);
    paths.sh9_raw = sh9;
    paths.sh9_ikeaPrescaled = scaled;
    paths.diffuseSH_ubo = toUboNames(scaled);
    paths.conversion = window.BABYLON?.SphericalHarmonics?.FromPolynomial
      ? 'BABYLON.FromPolynomial'
      : 'manual_inverse';
  } else {
    paths.polyErr = 'no sphericalPolynomial on env texture';
  }

  // env intensity × rotation (для sanity)
  try {
    paths.envMeta = {
      intensity: lmEnv?.intensity ?? lmEnv?._intensity ?? null,
      rotation: lmEnv?.rotation ?? lmEnv?._rotation ?? null,
      url: lmEnv?.url ?? lmEnv?._url ?? envTex?.url ?? null,
    };
  } catch {}

  // sanity: irradiance at +Y (wall normal up) ≈ L00 + L10
  if (paths.diffuseSH_ubo) {
    const u = paths.diffuseSH_ubo;
    const nUp = [
      u.diffuseSH_L00[0] + u.diffuseSH_L10[0],
      u.diffuseSH_L00[1] + u.diffuseSH_L10[1],
      u.diffuseSH_L00[2] + u.diffuseSH_L10[2],
    ];
    paths.sanity_irradiance_nUp = nUp;
  }

  const out = {
    ok: !!paths.diffuseSH_ubo,
    purpose: 'SH-empty',
    when: new Date().toISOString(),
    note: 'diffuseSH_ubo = derived from live SphericalPolynomial; paste full JSON',
    paths,
  };

  const s = JSON.stringify(out, null, 2);
  window.__cldIkeaShDump = out;
  console.log(s);
  try {
    copy(s);
    console.log('%c→ SH JSON в буфере — Ctrl+V в чат', 'color:#0a0;font-weight:bold');
  } catch (e) {
    console.warn('copy failed:', e.message);
  }
  return out;
})();
