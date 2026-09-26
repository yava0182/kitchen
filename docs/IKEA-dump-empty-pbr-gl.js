/**
 * IKEA PAX — EMPTY: сырой fragment стены из WebGL (пятно Spot живёт здесь).
 *
 * Когда: пустая комната PAX, стены видны.
 * Как: вставить → чуть повернуть камеру 1 раз → JSON в чат.
 * Ищем в шейдере: cone, inverse-square, ENABLE_SOFT_SHADOWS, exposure.
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
        if (typeof source === 'string' && source.length > 4000) {
          const isFrag = /gl_FragColor|out vec4|betrakta|ENABLE_SOFT/i.test(source);
          if (isFrag && /ENABLE_SOFT_SHADOWS|SPOT|punctual|blurred/i.test(source)) {
            captured.push(source);
          }
        }
      } catch {}
      return fn.call(this, shader, source);
    };
  }
  proto.shaderSource = wrap(orig);
  if (proto2 && orig2) proto2.shaderSource = wrap(orig2);

  function finish() {
    proto.shaderSource = orig;
    if (proto2 && orig2) proto2.shaderSource = orig2;
    const src = captured.sort((a, b) => b.length - a.length)[0] || '';
    function snip(re, n = 500) {
      const m = src.match(re);
      if (!m || m.index == null) return null;
      return src.slice(Math.max(0, m.index - 60), Math.min(src.length, m.index + n));
    }
    const defs = (src.match(/#define [A-Z0-9_]+[^\n]*/g) || []).filter((d) =>
      /SOFT|SPOT|DIR|LIGHT|EXPOSURE|SHADOW|ENV|OCCLU|ACTIVE/i.test(d)
    );
    const out = {
      ok: true,
      purpose: 'empty-pbr-gl',
      when: new Date().toISOString(),
      captured: captured.length,
      len: src.length,
      defines: defs.slice(0, 50),
      snips: {
        soft: snip(/ENABLE_SOFT_SHADOWS|blurred_heightmap|softH/i),
        spot: snip(/spot|coneCos|innerAngle|outerAngle|lightDir/i),
        atten: snip(/inv.?square|attenuation|distance2|rangeAtten|candela/i),
        exposure: snip(/exposure|tonemap|betraktaOutput/i),
        occ: snip(/occlusion|ao\s*\*?=/i),
      },
    };
    const s = JSON.stringify(out, null, 2);
    console.log(s);
    try {
      copy(s);
      console.log('%c→ в буфере — вставьте в чат', 'color:#0a0;font-weight:bold');
    } catch {}
    window.__cldIkeaEmptyPbrGl = out;
    return out;
  }

  console.log('%cПоверните комнату мышкой 1 раз, через 2с сниму шейдер', 'color:#08c');
  setTimeout(finish, 2000);
  return { hooked: true };
})();
