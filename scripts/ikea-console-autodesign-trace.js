/**
 * IKEA Kitchen — трассировка «Выбрать готовый вариант» (AutoDesign).
 *
 * КАК ЗАПУСТИТЬ
 * 1) Открой https://kitchen.planner.ikea.com/… → задай комнату → дойди до шага
 *    «Выбрать готовый вариант» (или встань ПЕРЕД «Продолжить» после вывода воды).
 * 2) F12 → Console → вверху выбери frame `Kitchen` / `ikea-prod.by.me`
 *    (НЕ верхний kitchen.planner.ikea.com).
 * 3) Вставь этот файл целиком, Enter.
 * 4) Переключай варианты 1…N и жми «Продолжить» если ещё не на шаге.
 * 5) В консоли: window.__CLD_AD.dump()  → скопируй JSON мне.
 *
 * Что ловит:
 *  - fetch / XHR (URL + кусок body/response)
 *  - клики по кнопкам вариантов
 *  - объекты приложения: linearManager, solutions, waterSupply, furniture
 */

(function ikeaAutoDesignTrace() {
  'use strict';

  if (window.__CLD_AD && window.__CLD_AD._alive) {
    console.warn('[CLD-AD] already running — window.__CLD_AD.dump()');
    return window.__CLD_AD;
  }

  const KEY =
    /autodesign|auto.?design|solution|template|linear|water.?suppl|water.?inlet|water.?outlet|sink|layout|proposition|best.?solution|furniture|appliance|metod/i;

  const log = [];
  const startedAt = Date.now();

  function push(kind, data) {
    const row = {
      t: Date.now() - startedAt,
      kind,
      ...(typeof data === 'object' && data ? data : { data }),
    };
    log.push(row);
    if (log.length > 800) log.shift();
    try {
      console.log('%c[CLD-AD] ' + kind, 'color:#1565c0', row);
    } catch (_) {}
    return row;
  }

  function clip(s, n) {
    if (s == null) return null;
    const t = typeof s === 'string' ? s : safeJson(s);
    if (t == null) return null;
    return t.length > n ? t.slice(0, n) + '…' : t;
  }

  function safeJson(v) {
    try {
      return JSON.stringify(v);
    } catch (_) {
      try {
        return String(v);
      } catch (e) {
        return null;
      }
    }
  }

  function summarize(obj, depth, seen) {
    depth = depth == null ? 0 : depth;
    seen = seen || new Set();
    if (obj == null) return obj;
    if (typeof obj !== 'object') return obj;
    if (seen.has(obj)) return '[Circular]';
    if (depth > 3) return '[…]';
    seen.add(obj);
    if (Array.isArray(obj)) {
      return obj.slice(0, 12).map((x) => summarize(x, depth + 1, seen));
    }
    const out = {};
    const keys = Object.keys(obj).slice(0, 40);
    keys.forEach((k) => {
      try {
        const v = obj[k];
        if (typeof v === 'function') out[k] = '[fn]';
        else if (v && typeof v === 'object') out[k] = summarize(v, depth + 1, seen);
        else out[k] = v;
      } catch (_) {
        out[k] = '[err]';
      }
    });
    return out;
  }

  function findApp(root) {
    const w = root || window;
    try {
      if (w.byMe && w.byMe.app) return w.byMe.app;
    } catch (_) {}
    const keys = Object.getOwnPropertyNames(w);
    for (let i = 0; i < keys.length; i++) {
      try {
        const v = w[keys[i]];
        if (!v || typeof v !== 'object') continue;
        if (v.viewer && v.level) return v;
        if (v._app && v._app.viewer) return v._app;
        if (v.app && v.app.viewer) return v.app;
      } catch (_) {}
    }
    return null;
  }

  function scanApp(app) {
    if (!app) return { found: false };
    const hit = {
      found: true,
      ctor: app.constructor && app.constructor.name,
      keys: Object.keys(app).slice(0, 80),
      linearManager: null,
      solutions: null,
      water: null,
      furnitureCount: null,
      levelWalls: null,
    };
    try {
      const lm = app._linearManager || app.linearManager || (app._app && app._app._linearManager);
      if (lm) {
        hit.linearManager = {
          type: lm.constructor && lm.constructor.name,
          keys: Object.keys(lm).slice(0, 40),
          methods: Object.getOwnPropertyNames(Object.getPrototypeOf(lm) || {})
            .filter((n) => typeof lm[n] === 'function')
            .slice(0, 40),
        };
      }
    } catch (e) {
      hit.linearManager = { err: String(e.message || e) };
    }
    try {
      const sols =
        app.solutions ||
        app._solutions ||
        app.autoDesignSolutions ||
        (app._uiController && app._uiController.solutions);
      if (sols) hit.solutions = summarize(sols);
    } catch (e) {
      hit.solutions = { err: String(e.message || e) };
    }
    try {
      const level = app.level || (app.getLevel && app.getLevel());
      if (level && typeof level.getWalls === 'function') {
        const walls = level.getWalls() || [];
        hit.levelWalls = walls.length;
      }
    } catch (_) {}
    try {
      const furn =
        (app.level && app.level.getFurniture && app.level.getFurniture()) ||
        (app.level && app.level.furniture);
      if (furn) hit.furnitureCount = Array.isArray(furn) ? furn.length : Object.keys(furn).length;
    } catch (_) {}
    // поиск water / supply по ключам
    try {
      const blob = safeJson(summarize(app));
      if (blob && /water/i.test(blob)) {
        hit.waterHint = clip(blob.match(/.{0,40}water.{0,80}/i)?.[0], 160);
      }
    } catch (_) {}
    return hit;
  }

  // —— network hooks ——
  const _fetch = window.fetch;
  if (typeof _fetch === 'function') {
    window.fetch = function hookedFetch(input, init) {
      const url = typeof input === 'string' ? input : input && input.url;
      const method = (init && init.method) || 'GET';
      const body = init && init.body;
      const interesting = KEY.test(String(url || '')) || KEY.test(String(body || ''));
      if (interesting) {
        push('fetch:req', {
          url: clip(url, 240),
          method,
          body: clip(body, 500),
        });
      }
      return _fetch.apply(this, arguments).then((res) => {
        if (!interesting && !KEY.test(res.url || '')) return res;
        const clone = res.clone();
        clone
          .text()
          .then((txt) => {
            if (KEY.test(txt) || interesting) {
              push('fetch:res', {
                url: clip(res.url || url, 240),
                status: res.status,
                sample: clip(txt, 800),
              });
            }
          })
          .catch(() => {});
        return res;
      });
    };
  }

  const XO = XMLHttpRequest.prototype.open;
  const XS = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__cldUrl = url;
    this.__cldMethod = method;
    return XO.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    const url = this.__cldUrl || '';
    const interesting = KEY.test(String(url)) || KEY.test(String(body || ''));
    if (interesting) {
      push('xhr:req', {
        url: clip(url, 240),
        method: this.__cldMethod,
        body: clip(body, 500),
      });
    }
    this.addEventListener('load', function () {
      try {
        const txt = this.responseText || '';
        if (interesting || KEY.test(txt)) {
          push('xhr:res', {
            url: clip(url, 240),
            status: this.status,
            sample: clip(txt, 800),
          });
        }
      } catch (_) {}
    });
    return XS.apply(this, arguments);
  };

  // —— UI clicks (варианты 1…N) ——
  document.addEventListener(
    'click',
    (e) => {
      const el = e.target && e.target.closest ? e.target.closest('button, [role="button"], a') : null;
      if (!el) return;
      const label = (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 80);
      if (!label) return;
      if (/^\d+$/.test(label) || /вариант|solution|layout|продолжить|continue|ok/i.test(label)) {
        push('ui:click', {
          label,
          id: el.id || null,
          cls: clip(el.className, 120),
        });
        // снимок приложения после клика
        setTimeout(() => {
          push('app:scan', scanApp(findApp(window)));
        }, 400);
      }
    },
    true
  );

  const api = {
    _alive: true,
    log,
    dump() {
      const app = findApp(window);
      const payload = {
        at: new Date().toISOString(),
        href: location.href,
        events: log.slice(),
        appScan: scanApp(app),
      };
      console.log('[CLD-AD] DUMP — скопируй объект ниже');
      console.log(payload);
      try {
        copy(JSON.stringify(payload, null, 2));
        console.log('[CLD-AD] JSON скопирован в clipboard (если copy() доступен)');
      } catch (_) {}
      return payload;
    },
    scan() {
      return scanApp(findApp(window));
    },
    stop() {
      window.fetch = _fetch;
      XMLHttpRequest.prototype.open = XO;
      XMLHttpRequest.prototype.send = XS;
      api._alive = false;
      push('stop', {});
    },
  };

  window.__CLD_AD = api;
  push('boot', { href: location.href, app: scanApp(findApp(window)) });
  console.log(
    '%c[CLD-AD] tracer ON — кликай варианты 1…N, потом window.__CLD_AD.dump()',
    'color:#0a0;font-weight:bold'
  );
  return api;
})();
