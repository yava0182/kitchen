/**
 * IKEA v0 — pipette v3 (короткий, window capture, START в Console).
 * F12 → Console → вставить ЦЕЛИКОМ от (() => до })();
 * Кликать по 3D комнате СЛЕВА, не по Console.
 */
(() => {
  console.log('%c▶ IKEA pipette v3 START', 'color:#0f0;font-size:16px;font-weight:bold');
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    console.error('нет canvas');
    return;
  }
  console.log('canvas size:', canvas.width, 'x', canvas.height);

  let gl = null;
  try {
    const root = document.querySelector('#root') || document.body;
    const key = Object.keys(root).find(
      (k) => k.startsWith('__reactFiber') || k.startsWith('__reactContainer')
    );
    let f = key ? root[key] : null;
    if (f?.stateNode?.current) f = f.stateNode.current;
    const q = [f];
    while (q.length) {
      const n = q.shift();
      const v = n?.memoizedProps?.value;
      if (v?.betraktaViewer) {
        const e = v.betraktaViewer.engine || v.betraktaViewer._engine;
        gl = e?._gl;
        break;
      }
      if (n?.child) q.push(n.child);
      if (n?.sibling) q.push(n.sibling);
    }
  } catch (e) {
    console.warn('engine walk:', e.message);
  }
  if (!gl) gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) {
    console.error('нет GL');
    return;
  }

  const labels = ['surround', 'wall mid', 'floor mid', 'floor corner'];
  let step = 0;
  const samples = [];

  const hex = (r, g, b) =>
    '#' +
    [r, g, b].map((v) => (v | 0).toString(16).padStart(2, '0')).join('').toUpperCase();
  const lum = (r, g, b) => Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);

  function readAt(x, y, done) {
    const buf = new Uint8Array(4);
    const gy = canvas.height - 1 - y;
    const tryRead = () => {
      try {
        gl.readPixels(x, gy, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      } catch (e) {
        console.warn('readPixels:', e.message);
      }
      done(buf[0], buf[1], buf[2]);
    };
    requestAnimationFrame(() => requestAnimationFrame(tryRead));
  }

  function onWinClick(ev) {
    if (step >= 4) return;
    const hit = document.elementFromPoint(ev.clientX, ev.clientY);
    if (hit !== canvas && !canvas.contains(hit)) {
      console.warn('⚠ клик мимо 3D — жми по комнате слева');
      return;
    }
    const r = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(canvas.width - 1, Math.floor((ev.clientX - r.left) * (canvas.width / r.width))));
    const y = Math.max(0, Math.min(canvas.height - 1, Math.floor((ev.clientY - r.top) * (canvas.height / r.height))));

    readAt(x, y, (R, G, B) => {
      const row = {
        label: labels[step],
        hex: hex(R, G, B),
        lum: lum(R, G, B),
        rgb: [R, G, B],
        xy: [x, y],
      };
      samples.push(row);
      console.log(`${step + 1}/4 ${row.label}: ${row.hex} lum=${row.lum} rgb=${row.rgb}`);
      step++;
      if (step >= 4) {
        window.removeEventListener('click', onWinClick, true);
        const out = { ok: true, purpose: 'pipette-empty', when: new Date().toISOString(), samples };
        window.__cldIkeaPipette = out;
        const s = JSON.stringify(out, null, 2);
        console.log(s);
        try {
          copy(s);
          console.log('%c✓ JSON в буфере — Ctrl+V в чат', 'color:#0f0;font-weight:bold');
        } catch (e) {
          console.warn('copy failed — скопируйте JSON из console.log выше');
        }
      } else {
        console.log(`→ ${step + 1}/4: ${labels[step]}`);
      }
    });
  }

  window.addEventListener('click', onWinClick, true);
  console.log('%cКликните 4 раза по 3D (слева):', 'color:#0f0;font-weight:bold');
  console.log('  1 surround  2 wall mid  3 floor mid  4 floor corner');
})();
