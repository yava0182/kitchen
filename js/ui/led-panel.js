/**
 * Панель внутренней LED-подсветки шкафов: кнопка сверху над сценой + выпадающие настройки.
 * Работает только через window.__cldIkeaV0SetLed (ikea-room-light-v0.js), остальной UI не трогает.
 * Значения пишутся либо в общие настройки, либо в root.userData.ledConfig выбранного шкафа —
 * тот же формат потом заполняет админка.
 */

const PANEL_ID = 'cld-led-panel';
const BTN_ID = 'cld-led-btn';

const MODE_LABELS = [
  ['vertical', 'Вертикально'],
  ['horizontal', 'Под полкой'],
  ['under', 'Под шкафом'],
];
const SIDE_LABELS = [
  ['both', 'Обе'],
  ['left', 'Левая'],
  ['right', 'Правая'],
];

/**
 * Яркость в панели 0–100 % → intensity = (v/100)² · MAX. Квадрат: внутри шкафа рабочий диапазон
 * 0.05–0.3 (≈15–30 %), под навесным нужно 1–3 — один ползунок покрывает оба.
 */
const INTENSITY_MAX = 3;
const pctToIntensity = (v) => (v / 100) ** 2 * INTENSITY_MAX;
const intensityToPct = (i) => Math.round(Math.sqrt(Math.max(0, i) / INTENSITY_MAX) * 100);

const ui = {
  target: 'all',
  kelvin: 3500,
};

function getState() {
  return window.__CLD_STATE_SINGLETON__ || null;
}

function selectedRoot() {
  let o = getState()?.selectedFurniture?.group || null;
  while (o && !o.userData?.isFurniture && o.parent) o = o.parent;
  return o?.userData?.isFurniture ? o : null;
}

/** Цвет по температуре (аппроксимация Tanner Helland) → линейный RGB, максимум = 1. */
function kelvinToLinearRgb(k) {
  const t = k / 100;
  let r;
  let g;
  let b;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  const lin = [r, g, b].map((v) => Math.pow(Math.min(255, Math.max(0, v)) / 255, 2.2));
  const m = Math.max(...lin, 1e-6);
  return lin.map((v) => +(v / m).toFixed(4));
}

function currentConfig() {
  const get = window.__cldIkeaV0GetLed;
  if (typeof get !== 'function') return null;
  return get(ui.target === 'selected' ? selectedRoot() : null);
}

function apply(patch) {
  const set = window.__cldIkeaV0SetLed;
  if (typeof set !== 'function') return;
  if (ui.target === 'selected') {
    const root = selectedRoot();
    if (!root) {
      refresh();
      return;
    }
    set(patch, root);
  } else {
    set(patch);
  }
  refresh();
}

function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'style') Object.assign(n.style, v);
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  });
  children.forEach((c) => n.append(c));
  return n;
}

function segmented(name, options, onPick) {
  const wrap = el('div', { class: 'cld-led-seg', 'data-name': name });
  options.forEach(([value, label]) => {
    wrap.append(
      el('button', { type: 'button', 'data-value': value, onclick: () => onPick(value) }, [label])
    );
  });
  return wrap;
}

function slider(name, label, min, max, step, unit, onInput) {
  const out = el('span', { class: 'cld-led-val' });
  const input = el('input', { type: 'range', min, max, step, 'data-name': name });
  input.addEventListener('input', () => {
    out.textContent = `${input.value}${unit}`;
    onInput(+input.value);
  });
  return el('label', { class: 'cld-led-row' }, [
    el('span', { class: 'cld-led-lbl' }, [label]),
    input,
    out,
  ]);
}

function injectStyles() {
  if (document.getElementById('cld-led-style')) return;
  const css = `
#${PANEL_ID}{position:absolute;top:68px;right:300px;width:280px;z-index:30;background:#fff;
  border:1px solid #ddd;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.14);padding:14px 14px 10px;
  font:13px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#222;display:none}
#${PANEL_ID}.open{display:block}
#${PANEL_ID} h4{margin:0 0 10px;font-size:14px;font-weight:600;display:flex;justify-content:space-between;align-items:center}
#${PANEL_ID} .cld-led-sec{margin:10px 0 4px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.04em}
#${PANEL_ID} .cld-led-seg{display:flex;background:#f3f3f3;border-radius:8px;padding:2px;gap:2px}
#${PANEL_ID} .cld-led-seg button{flex:1;border:0;background:transparent;border-radius:6px;padding:6px 4px;
  font:inherit;font-size:12px;cursor:pointer;color:#444}
#${PANEL_ID} .cld-led-seg button.on{background:#fdf0dc;color:#111;font-weight:600}
#${PANEL_ID} .cld-led-row{display:grid;grid-template-columns:86px 1fr 52px;align-items:center;gap:6px;margin:6px 0}
#${PANEL_ID} .cld-led-row input{width:100%;accent-color:#f5a623}
#${PANEL_ID} .cld-led-val{text-align:right;font-variant-numeric:tabular-nums;color:#555;font-size:12px}
#${PANEL_ID} .cld-led-switch{border:0;border-radius:16px;padding:5px 12px;font:inherit;font-size:12px;cursor:pointer}
#${PANEL_ID} .cld-led-switch.on{background:#f5a623;color:#fff}
#${PANEL_ID} .cld-led-switch.off{background:#eee;color:#555}
#${PANEL_ID} .cld-led-hint{font-size:11px;color:#a0522d;margin-top:4px;min-height:14px}
#${PANEL_ID} .cld-led-reset{margin-top:8px;border:0;background:none;color:#888;font:inherit;font-size:12px;cursor:pointer;padding:0}
#${BTN_ID}.on{color:#f5a623 !important;opacity:1 !important}
`;
  document.head.append(el('style', { id: 'cld-led-style' }, [css]));
}

let panel = null;
let btn = null;

function buildPanel(host) {
  const toggle = el('button', {
    type: 'button',
    class: 'cld-led-switch on',
    'data-name': 'enabled',
    onclick: () => {
      const cfg = currentConfig();
      apply({ enabled: !(cfg?.enabled ?? true) });
    },
  });
  panel = el('div', { id: PANEL_ID, role: 'dialog', 'aria-label': 'Подсветка шкафа' }, [
    el('h4', {}, ['Подсветка внутри', toggle]),
    el('div', { class: 'cld-led-sec' }, ['Применить к']),
    segmented('target', [['all', 'Все шкафы'], ['selected', 'Выбранный']], (v) => {
      ui.target = v;
      refresh();
    }),
    el('div', { class: 'cld-led-hint', 'data-name': 'hint' }),
    el('div', { class: 'cld-led-sec' }, ['Профиль']),
    segmented('mode', MODE_LABELS, (v) => apply({ mode: v })),
    el('div', { 'data-name': 'sides-wrap', style: { marginTop: '6px' } }, [
      segmented('sides', SIDE_LABELS, (v) => apply({ sides: v })),
    ]),
    el('div', { class: 'cld-led-sec' }, ['Свет']),
    slider('intensity', 'Яркость', 0, 100, 1, ' %', (v) => apply({ intensity: pctToIntensity(v) })),
    slider('beamDeg', 'Угол луча', 20, 170, 5, '°', (v) => apply({ beamDeg: v })),
    slider('kelvin', 'Цвет', 2700, 6500, 100, ' K', (v) => {
      ui.kelvin = v;
      apply({ color: kelvinToLinearRgb(v) });
    }),
    slider('emission', 'Свечение', 0, 40, 1, '', (v) => apply({ emission: v })),
    el('div', { class: 'cld-led-sec' }, ['Положение']),
    slider('insetMm', 'От фасада', 10, 560, 5, ' мм', (v) => apply({ insetMm: v })),
    slider('widthMm', 'Ширина', 6, 30, 1, ' мм', (v) => apply({ widthMm: v })),
    el('button', {
      type: 'button',
      class: 'cld-led-reset',
      onclick: () => {
        const set = window.__cldIkeaV0SetLed;
        const root = ui.target === 'selected' ? selectedRoot() : null;
        if (root) set(null, root);
        else if (typeof window.__cldIkeaV0GetLedDefaults === 'function') set(window.__cldIkeaV0GetLedDefaults());
        refresh();
      },
    }, ['Сбросить']),
  ]);
  host.append(panel);
}

function setSeg(name, value) {
  panel.querySelectorAll(`.cld-led-seg[data-name="${name}"] button`).forEach((b) => {
    b.classList.toggle('on', b.dataset.value === value);
  });
}

function setSlider(name, value, unit) {
  const input = panel.querySelector(`input[data-name="${name}"]`);
  if (!input || document.activeElement === input) return;
  input.value = value;
  input.parentElement.querySelector('.cld-led-val').textContent = `${input.value}${unit}`;
}

function refresh() {
  if (!panel) return;
  const cfg = currentConfig();
  setSeg('target', ui.target);
  const hint = panel.querySelector('[data-name="hint"]');
  hint.textContent =
    ui.target === 'selected' && !selectedRoot() ? 'Выберите шкаф на сцене' : '';
  if (!cfg) return;
  const toggle = panel.querySelector('[data-name="enabled"]');
  toggle.textContent = cfg.enabled ? 'Включена' : 'Выключена';
  toggle.className = `cld-led-switch ${cfg.enabled ? 'on' : 'off'}`;
  btn?.classList.toggle('on', !!cfg.enabled);
  setSeg('mode', cfg.mode);
  setSeg('sides', cfg.sides);
  panel.querySelector('[data-name="sides-wrap"]').style.display = cfg.mode === 'vertical' ? '' : 'none';
  setSlider('intensity', intensityToPct(cfg.intensity), ' %');
  setSlider('beamDeg', Math.round(cfg.beamDeg), '°');
  setSlider('kelvin', ui.kelvin, ' K');
  setSlider('emission', Math.round(cfg.emission), '');
  setSlider('insetMm', Math.round(cfg.insetMm), ' мм');
  setSlider('widthMm', Math.round(cfg.widthMm), ' мм');
}

function mount() {
  const host = window.sceneIconsContainer;
  if (!host || typeof window.__cldIkeaV0SetLed !== 'function') return false;
  if (document.getElementById(BTN_ID)) return true;
  injectStyles();
  btn = el(
    'div',
    {
      id: BTN_ID,
      role: 'button',
      title: 'Подсветка внутри шкафа',
      'aria-label': 'Подсветка внутри шкафа',
      style: {
        position: 'absolute',
        top: '20px',
        right: '420px',
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        background: 'white',
        border: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        color: '#333',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        cursor: 'pointer',
        pointerEvents: 'auto',
        zIndex: 30,
      },
      onclick: (e) => {
        e.stopPropagation();
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) refresh();
      },
    },
    [el('i', { class: 'fas fa-lightbulb', 'aria-hidden': 'true' })]
  );
  host.append(btn);
  buildPanel(host);
  panel.style.pointerEvents = 'auto';
  ['pointerdown', 'wheel', 'mousedown', 'touchstart'].forEach((t) =>
    panel.addEventListener(t, (e) => e.stopPropagation())
  );
  refresh();
  return true;
}

(function waitMount() {
  if (mount()) return;
  setTimeout(waitMount, 500);
})();
