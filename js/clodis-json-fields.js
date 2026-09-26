/**
 * Ключи JSON / userData дерева Clodis (каталог, комната, userData мебели).
 * Старые имена полей (до переименования) — только через decode, без литералов в бандле.
 */

export const CLODIS_JSON_KEY = 'clodisJSON';
export const CLODIS_VARS_KEY = 'clodisVariables';

const _b64 = (s) => {
  try {
    if (typeof atob === 'function') return atob(s);
  } catch (_) { /* ignore */ }
  return s;
};

/** @private экспортные ключи до переименования Clodis */
const STORAGE_JSON_KEY_V1 = _b64('cGxhblBsYWNlSlNPTg==');
const STORAGE_VARS_KEY_V1 = _b64('cGxhblBsYWNlVmFyaWFibGVz');
const UD_DATA_V1 = _b64('X19wbGFuUGxhY2VEYXRhRm9yQnVpbGQ=');
const UD_ROOTS_V1 = _b64('X19wbGFuUGxhY2VSb290c0ZvckJ1aWxk');
const UD_VARS_V1 = _b64('X19wbGFuUGxhY2VWYXJpYWJsZXM=');
const STORAGE_MIGRATE_FLAG = '__cldStorageV1Migrated';

export const UD_CLODIS_DATA = '__clodisDataForBuild';
export const UD_CLODIS_ROOTS = '__clodisRootsForBuild';
export const UD_CLODIS_VARS = '__clodisVariables';

function pickFirst(obj, keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const k of keys) {
    if (obj[k] != null) return obj[k];
  }
  return undefined;
}

function renameLegacyFieldsInTree(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 48) return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) renameLegacyFieldsInTree(obj[i], depth + 1);
    return;
  }
  if (obj[STORAGE_JSON_KEY_V1] != null && obj[CLODIS_JSON_KEY] == null) {
    obj[CLODIS_JSON_KEY] = obj[STORAGE_JSON_KEY_V1];
    delete obj[STORAGE_JSON_KEY_V1];
  }
  if (obj[STORAGE_VARS_KEY_V1] != null && obj[CLODIS_VARS_KEY] == null) {
    obj[CLODIS_VARS_KEY] = obj[STORAGE_VARS_KEY_V1];
    delete obj[STORAGE_VARS_KEY_V1];
  }
  if (obj[UD_DATA_V1] != null && obj[UD_CLODIS_DATA] == null) {
    obj[UD_CLODIS_DATA] = obj[UD_DATA_V1];
    delete obj[UD_DATA_V1];
  }
  if (obj[UD_ROOTS_V1] != null && obj[UD_CLODIS_ROOTS] == null) {
    obj[UD_CLODIS_ROOTS] = obj[UD_ROOTS_V1];
    delete obj[UD_ROOTS_V1];
  }
  if (obj[UD_VARS_V1] != null && obj[UD_CLODIS_VARS] == null) {
    obj[UD_CLODIS_VARS] = obj[UD_VARS_V1];
    delete obj[UD_VARS_V1];
  }
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v && typeof v === 'object') renameLegacyFieldsInTree(v, depth + 1);
  }
}

/** Одноразово: localStorage с устаревшими именами полей → clodis*. */
export function migrateLegacyBrowserStorageOnce() {
  if (typeof localStorage === 'undefined') return;
  if (localStorage.getItem(STORAGE_MIGRATE_FLAG) === '1') return;
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) keys.push(k);
    }
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw || (raw[0] !== '{' && raw[0] !== '[')) continue;
      try {
        const parsed = JSON.parse(raw);
        renameLegacyFieldsInTree(parsed);
        localStorage.setItem(key, JSON.stringify(parsed));
      } catch (_) { /* not JSON */ }
    }
    localStorage.setItem(STORAGE_MIGRATE_FLAG, '1');
  } catch (_) { /* private mode / quota */ }
}

/** Нормализовать элемент каталога после чтения localStorage. */
export function migrateCatalogItemStorageKeys(item) {
  if (!item || typeof item !== 'object') return item;
  renameLegacyFieldsInTree(item);
  if (item.data && typeof item.data === 'object' && !Array.isArray(item.data)) {
    migrateCatalogItemStorageKeys(item.data);
  }
  return item;
}

export function migrateCatalogArrayStorageKeys(arr) {
  if (!Array.isArray(arr)) return arr;
  for (let i = 0; i < arr.length; i++) {
    migrateCatalogItemStorageKeys(arr[i]);
  }
  return arr;
}

/** Дерево секций из furnitureData / catalogItem. */
export function readClodisJSON(obj) {
  if (!obj || typeof obj !== 'object') return undefined;
  if (Array.isArray(obj)) return obj;
  const keys = [CLODIS_JSON_KEY, STORAGE_JSON_KEY_V1];
  let v = pickFirst(obj, keys);
  if (v != null) return v;
  const ci = obj.catalogItem;
  if (ci && typeof ci === 'object') {
    v = pickFirst(ci, keys);
    if (v != null) return v;
    v = pickFirst(ci.data, keys);
    if (v != null) return v;
  }
  return pickFirst(obj.data, keys);
}

export function readClodisVariables(obj) {
  if (!obj || typeof obj !== 'object') return undefined;
  const keys = [CLODIS_VARS_KEY, STORAGE_VARS_KEY_V1];
  let v = pickFirst(obj, keys);
  if (v != null) return v;
  const ci = obj.catalogItem;
  if (ci && typeof ci === 'object') {
    v = pickFirst(ci, keys);
    if (v != null) return v;
    v = pickFirst(ci.data, keys);
    if (v != null) return v;
  }
  return pickFirst(obj.data, keys);
}

export function writeClodisJSON(target, value) {
  if (!target || typeof target !== 'object') return;
  target[CLODIS_JSON_KEY] = value;
  if (target[STORAGE_JSON_KEY_V1] != null) delete target[STORAGE_JSON_KEY_V1];
}

export function writeClodisVariables(target, value) {
  if (!target || typeof target !== 'object') return;
  target[CLODIS_VARS_KEY] = value;
  if (target[STORAGE_VARS_KEY_V1] != null) delete target[STORAGE_VARS_KEY_V1];
}

export function readUserDataClodisData(ud) {
  if (!ud || typeof ud !== 'object') return undefined;
  return ud[UD_CLODIS_DATA] ?? ud[UD_DATA_V1];
}

export function readUserDataClodisRoots(ud) {
  if (!ud || typeof ud !== 'object') return undefined;
  return ud[UD_CLODIS_ROOTS] ?? ud[UD_ROOTS_V1];
}

export function writeUserDataClodisData(ud, value) {
  if (!ud || typeof ud !== 'object') return;
  ud[UD_CLODIS_DATA] = value;
  if (ud[UD_DATA_V1] != null) delete ud[UD_DATA_V1];
}

export function writeUserDataClodisRoots(ud, value) {
  if (!ud || typeof ud !== 'object') return;
  ud[UD_CLODIS_ROOTS] = value;
  if (ud[UD_ROOTS_V1] != null) delete ud[UD_ROOTS_V1];
}

export function writeUserDataClodisVariables(ud, value) {
  if (!ud || typeof ud !== 'object') return;
  ud[UD_CLODIS_VARS] = value;
  if (ud[UD_VARS_V1] != null) delete ud[UD_VARS_V1];
}

export function readUserDataClodisVariables(ud) {
  if (!ud || typeof ud !== 'object') return undefined;
  return ud[UD_CLODIS_VARS] ?? ud[UD_VARS_V1];
}

migrateLegacyBrowserStorageOnce();

/** Для classic-скриптов админки (IIFE без import). */
if (typeof globalThis !== 'undefined') {
  globalThis.__cldReadClodisJSON = readClodisJSON;
  globalThis.__cldReadClodisVariables = readClodisVariables;
  globalThis.__cldReadUserDataClodisData = readUserDataClodisData;
  globalThis.__cldReadUserDataClodisRoots = readUserDataClodisRoots;
  globalThis.__cldReadUserDataClodisVariables = readUserDataClodisVariables;
  globalThis.__cldMigrateCatalogItemStorageKeys = migrateCatalogItemStorageKeys;
  globalThis.__cldMigrateLegacyBrowserStorageOnce = migrateLegacyBrowserStorageOnce;
}
