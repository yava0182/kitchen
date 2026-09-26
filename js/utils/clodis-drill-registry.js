/**
 * Clodis: библиотека шаблонов присадки и схем крепежа (как .config схем в Базис-Мебельщик).
 * Серверный JSON — эталон managed id; локальные «свои» id вне managed не затираются.
 *
 * Переопределение URL: window.__CLODIS_DRILL_REGISTRY_URL = 'https://cdn.../registry.json';
 * База пути: window.__CLODIS_PUBLIC_BASE = '/myapp' → /myapp/data/clodis_drilling_registry.json
 */
(function (global) {
  'use strict';

  var SCHEMES_KEY = 'clodis_drill_schemes_v1';
  var TEMPLATES_KEY = 'clodis_drilling_templates_v2';
  var META_KEY = 'clodis_drill_registry_meta_v1';

  var DEFAULT_PATH = '/data/clodis_drilling_registry.json';

  function resolveUrl() {
    if (global.__CLODIS_DRILL_REGISTRY_URL) return String(global.__CLODIS_DRILL_REGISTRY_URL);
    var base = global.__CLODIS_PUBLIC_BASE != null ? String(global.__CLODIS_PUBLIC_BASE).replace(/\/+$/, '') : '';
    var path = DEFAULT_PATH.indexOf('/') === 0 ? DEFAULT_PATH : '/' + DEFAULT_PATH;
    if (!base) return path;
    return base + path;
  }

  function readLs(key) {
    try {
      var raw = global.localStorage && global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function writeLs(key, val) {
    try {
      if (global.localStorage) global.localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('[ClodisDrillRegistry] localStorage write failed', key, e);
    }
  }

  function readMeta() {
    var m = readLs(META_KEY);
    return m && typeof m === 'object' ? m : { appliedBundleVersion: 0 };
  }

  function writeMeta(m) {
    writeLs(META_KEY, m);
  }

  function asArray(x) {
    return Array.isArray(x) ? x : [];
  }

  /** Миграция шаблонов типов 2/3 на пивот «внешняя плоскость edge» (как БАЗИС). */
  function migrateTemplateCenterOrigin(t) {
    if (!t || typeof t !== 'object') return t;
    if (t._coordOrigin === 'outer_plane') return t;
    var st = Number(t.setupType != null ? t.setupType : t.currentSetupType);
    if (st !== 2 && st !== 3) {
      t._coordOrigin = 'outer_plane';
      return t;
    }
    var half = 8;
    function mapHole(h) {
      if (!h || typeof h !== 'object') return h;
      var nh = JSON.parse(JSON.stringify(h));
      if (!t._coordOrigin && st === 2 && (Number(nh.y) || 0) > 4) {
        nh.y = (Number(nh.y) || 0) - half;
      }
      return nh;
    }
    function mapList(arr) {
      return Array.isArray(arr) ? arr.map(mapHole) : arr;
    }
    if (t.holesBySetup && typeof t.holesBySetup === 'object') {
      Object.keys(t.holesBySetup).forEach(function (k) {
        t.holesBySetup[k] = mapList(t.holesBySetup[k]);
      });
    }
    if (Array.isArray(t.holes)) t.holes = mapList(t.holes);
    t._coordOrigin = 'outer_plane';
    return t;
  }

  function migrateTemplatesInStorage() {
    var cur = readLs(TEMPLATES_KEY);
    if (!Array.isArray(cur) || !cur.length) return false;
    var changed = false;
    var next = cur.map(function (t) {
      var before = JSON.stringify(t);
      migrateTemplateCenterOrigin(t);
      if (JSON.stringify(t) !== before) changed = true;
      return t;
    });
    if (changed) writeLs(TEMPLATES_KEY, next);
    return changed;
  }

  /**
   * Seed-only: если id уже есть в localStorage — НЕ трогаем (админка = источник правды).
   * С сервера/файла добираем только отсутствующие managed id.
   * Принудительная перезапись — только явная «Загрузить библиотеку» (forceOverwrite).
   */
  function mergeManaged(existing, incomingList, managedIds, forceOverwrite) {
    var managed = new Set(managedIds.map(function (x) { return Number(x); }));
    var byId = {};
    asArray(existing).forEach(function (row) {
      var id = Number(row && row.id);
      if (!Number.isFinite(id) || id <= 0) return;
      byId[id] = row;
    });
    asArray(incomingList).forEach(function (row) {
      var id = Number(row && row.id);
      if (!managed.has(id)) return;
      if (forceOverwrite || !byId[id]) {
        byId[id] = JSON.parse(JSON.stringify(row));
      }
    });
    var kept = Object.keys(byId)
      .map(function (k) { return byId[Number(k)]; })
      .filter(Boolean);
    kept.sort(function (a, b) { return Number(a.id) - Number(b.id); });
    return kept;
  }

  function applyRegistryPayload(data, opts) {
    if (!data || typeof data !== 'object') return false;
    var forceOverwrite = !!(opts && opts.forceOverwrite);
    var version = Number(data.version) || 0;
    var managedT = asArray(data.managedTemplateIds).map(Number);
    var managedS = asArray(data.managedSchemeIds).map(Number);
    var templates = asArray(data.templates);
    var schemes = asArray(data.schemes);

    var curT = readLs(TEMPLATES_KEY);
    var curS = readLs(SCHEMES_KEY);
    if (!Array.isArray(curT)) curT = [];
    if (!Array.isArray(curS)) curS = [];

    var templateManaged = managedT.length ? managedT : templates.map(function (t) { return t.id; });
    var nextT = mergeManaged(curT, templates, templateManaged, forceOverwrite);
    var schemeManaged = managedS.length ? managedS : schemes.map(function (s) { return s.id; });
    var nextS = mergeManaged(curS, schemes, schemeManaged, forceOverwrite);

    writeLs(TEMPLATES_KEY, nextT);
    writeLs(SCHEMES_KEY, nextS);
    migrateTemplatesInStorage();

    var meta = readMeta();
    meta.appliedBundleVersion = version;
    meta.lastAppliedAt = new Date().toISOString();
    meta.mergeMode = forceOverwrite ? 'overwrite' : 'seed-only';
    writeMeta(meta);
    return true;
  }

  var _cachedEnsure = null;

  function fetchRegistry() {
    var url = resolveUrl();
    return fetch(url, { cache: 'no-cache', credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + url);
        return res.json();
      })
      .then(function (data) {
        var ok = applyRegistryPayload(data, { forceOverwrite: false });
        if (ok) console.log('[ClodisDrillRegistry] seed-only (локальные схемы/шаблоны не затираем):', url, 'v=', data && data.version);
        return !!ok;
      });
  }

  function fetchRegistryForce() {
    var url = resolveUrl();
    return fetch(url, { cache: 'no-cache', credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + url);
        return res.json();
      })
      .then(function (data) {
        var ok = applyRegistryPayload(data, { forceOverwrite: true });
        if (ok) console.log('[ClodisDrillRegistry] FORCE overwrite from server:', url, 'v=', data && data.version);
        return !!ok;
      });
  }

  function ensureLoaded() {
    if (_cachedEnsure) return _cachedEnsure;
    _cachedEnsure = fetchRegistry().catch(function (err) {
      _cachedEnsure = null;
      migrateTemplatesInStorage();
      console.warn('[ClodisDrillRegistry] загрузка не удалась (останется только localStorage):', err && err.message ? err.message : err);
      return false;
    });
    return _cachedEnsure;
  }

  /** Сброс кэша ensure — после POST библиотеки из админки, чтобы повторно подтянуть файл. */
  function invalidate() {
    _cachedEnsure = null;
  }

  function getStatus() {
    return {
      url: resolveUrl(),
      meta: readMeta(),
      templateCount: asArray(readLs(TEMPLATES_KEY)).length,
      schemeCount: asArray(readLs(SCHEMES_KEY)).length,
    };
  }

  global.ClodisDrillRegistry = {
    ensureLoaded: ensureLoaded,
    invalidate: invalidate,
    applyRegistryPayload: applyRegistryPayload,
    /** Явная перезапись LS из файла/сервера (кнопка «загрузить библиотеку»). */
    forceApplyFromServer: function () {
      invalidate();
      return fetchRegistryForce();
    },
    getStatus: getStatus,
    SCHEMES_KEY: SCHEMES_KEY,
    TEMPLATES_KEY: TEMPLATES_KEY,
    META_KEY: META_KEY,
  };
})(typeof window !== 'undefined' ? window : globalThis);
