/**
 * IKEA PAX — EMPTY шаг 2: сырой Betrakta PBR fragment из WebGL.
 * Нужен, если шаг 1 (ALL-empty) дал shaderSnips: null.
 *
 * Как: вставить → сразу чуть покрутить камеру → через 3 с JSON в чат.
 */
(() => {
  const gl =
    document.querySelector('canvas')?.getContext('webgl2') ||
    document.querySelector('canvas')?.getContext('webgl');
  if (!gl) return { err: 'no gl' };

  const proto = WebGLRenderingContext.prototype;
  const proto2 = window.WebGL2RenderingContext?.prototype;
  const orig = proto.shaderSource;
  const orig2 = proto2?.shaderSource;
  const captured = [];

  function wrap(fn) {
    return function (shader, source) {
      try {
        if (typeof source === 'string' && source.length > 3000) {
          if (/ENABLE_SOFT|betrakta|punctual|SPOT|blurred_height/i.test(source)) {
            captured.push(source);
          }
        }
      } catch {}
      return fn.call(this, shader, source);
    };
  }
  proto.shaderSource = wrap(orig);
  if (proto2 && orig2) proto2.shaderSource = wrap(orig2);

  function snip(src, re, n = 520) {
    const m = src.match(re);
    if (!m || m.index == null) return null;
    return src.slice(Math.max(0, m.index - 70), Math.min(src.length, m.index + n));
  }

  function finish() {
    proto.shaderSource = orig;
    if (proto2 && orig2) proto2.shaderSource = orig2;
    const src = captured.sort((a, b) => b.length - a.length)[0] || '';
    const defs = (src.match(/#define [A-Z0-9_]+[^\n]*/g) || []).filter((d) =>
      /SOFT|SPOT|DIR|LIGHT|EXPOSURE|SHADOW|ENV|OCCLU|ACTIVE/i.test(d)
    );
    const out = {
      ok: true,
      purpose: 'ALL-empty-gl',
      when: new Date().toISOString(),
      captured: captured.length,
      len: src.length,
      defines: defs.slice(0, 60),
      snips: {
        soft: snip(src, /ENABLE_SOFT_SHADOWS|blurred_heightmap|softH|reference_height/i),
        spot: snip(src, /spot|coneCos|innerAngle|outerAngle|lightDir/i),
        atten: snip(src, /inv.?square|attenuation|distance2|rangeAtten|candela/i),
        exposure: snip(src, /exposure|tonemap|betraktaOutput/i),
        occ: snip(src, /occlusion|ao\s*\*?=/i),
        env: snip(src, /environment|irradiance|ibl/i),
      },
    };
    const s = JSON.stringify(out, null, 2);
    console.log(s);
    try {
      copy(s);
      console.log('%c→ буфер GL — вставьте в чат', 'color:#0a0;font-weight:bold');
    } catch {}
    window.__cldIkeaAllEmptyGl = out;
    return out;
  }

  console.log('%cПоверните комнату мышкой, жду 3с…', 'color:#08c;font-weight:bold');
  setTimeout(finish, 3000);
  return { hooked: true };
})();
