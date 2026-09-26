/**
 * Серверный слой чтения clodisJSON / clodisVariables (+ устаревшие имена полей в JSON).
 */
'use strict';

const CLODIS_JSON_KEY = 'clodisJSON';
const CLODIS_VARS_KEY = 'clodisVariables';

const _b64 = (s) => Buffer.from(s, 'base64').toString('utf8');
const STORAGE_JSON_KEY_V1 = _b64('cGxhblBsYWNlSlNPTg==');
const STORAGE_VARS_KEY_V1 = _b64('cGxhblBsYWNlVmFyaWFibGVz');

function pickFirst(obj, keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v != null) return v;
  }
  return undefined;
}

function readClodisJSON(obj) {
  if (!obj || typeof obj !== 'object') return undefined;
  if (Array.isArray(obj)) return obj;
  const keys = [CLODIS_JSON_KEY, STORAGE_JSON_KEY_V1];
  let v = pickFirst(obj, keys);
  if (v != null) return v;
  if (obj.data && typeof obj.data === 'object') {
    v = pickFirst(obj.data, keys);
    if (v != null) return v;
  }
  return undefined;
}

function readClodisVariables(obj) {
  if (!obj || typeof obj !== 'object') return undefined;
  const keys = [CLODIS_VARS_KEY, STORAGE_VARS_KEY_V1];
  let v = pickFirst(obj, keys);
  if (v != null) return v;
  if (obj.data && typeof obj.data === 'object') {
    v = pickFirst(obj.data, keys);
    if (v != null) return v;
  }
  return undefined;
}

function hasClodisJSON(item) {
  const j = readClodisJSON(item);
  return Array.isArray(j) && j.length > 0;
}

/** body + dataField → дерево секций (как в server.js). */
function pickClodisJSONFromRecord(body, dataField) {
  let clodisJSON = readClodisJSON(body) || readClodisJSON(dataField);
  if (!clodisJSON && dataField?.params) {
    const params = Array.isArray(dataField.params) ? dataField.params : [dataField.params];
    if (params.length > 0 && params.some((p) => p && (p.type === 'section' || p.type === 'wall'))) {
      clodisJSON = params;
    }
  }
  if (
    clodisJSON == null &&
    dataField?.constructor_structure &&
    typeof dataField.constructor_structure === 'object'
  ) {
    const cs = dataField.constructor_structure;
    const derived =
      cs.template?.structure ?? cs.spec?.template?.tree ?? (Array.isArray(cs) ? cs : null);
    if (Array.isArray(derived) && derived.length > 0) clodisJSON = derived;
  }
  return clodisJSON;
}

function pickClodisVariablesFromRecord(data, it) {
  return readClodisVariables(data) ?? readClodisVariables(it) ?? null;
}

module.exports = {
  readClodisJSON,
  readClodisVariables,
  hasClodisJSON,
  pickClodisJSONFromRecord,
  pickClodisVariablesFromRecord,
};
