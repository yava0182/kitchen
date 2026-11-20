/**
 * CLODIS render mode gate (Exp14).
 * Only IKEA_PORT remains — old lab CURRENT path retired (2026-11-09).
 * URL flags kept for compatibility; they no longer switch back to lab light.
 */

/** @typedef {'CURRENT' | 'IKEA_PORT'} ClodisRenderMode */

export const CLODIS_RENDER_MODE_CURRENT = 'CURRENT';
export const CLODIS_RENDER_MODE_IKEA_PORT = 'IKEA_PORT';

const QUERY_KEYS = Object.freeze(['clodisRenderMode', 'ikeaPort']);

/**
 * @param {string|null|undefined} raw
 * @returns {ClodisRenderMode}
 */
export function normalizeClodisRenderMode(_raw) {
  return CLODIS_RENDER_MODE_IKEA_PORT;
}

/**
 * @returns {ClodisRenderMode}
 */
export function readClodisRenderModeFromUrl() {
  return CLODIS_RENDER_MODE_IKEA_PORT;
}

/** Boot-time mode (frozen after first read unless reload). */
let _mode = null;

/**
 * @returns {ClodisRenderMode}
 */
export function getClodisRenderMode() {
  if (_mode == null) _mode = readClodisRenderModeFromUrl();
  return _mode;
}

export function isIkeaPortMode() {
  return getClodisRenderMode() === CLODIS_RENDER_MODE_IKEA_PORT;
}

export function isCurrentRenderMode() {
  return getClodisRenderMode() === CLODIS_RENDER_MODE_CURRENT;
}

/**
 * Lab CURRENT retired — always stay on IKEA_PORT.
 * @param {ClodisRenderMode|string} [_requested]
 * @param {{ reload?: boolean }} [opts]
 */
export function setClodisRenderMode(_requested, opts = {}) {
  const next = CLODIS_RENDER_MODE_IKEA_PORT;
  if (typeof window === 'undefined') {
    _mode = next;
    return { ok: true, mode: next, reloaded: false, labRetired: true };
  }
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('clodisRenderMode', 'IKEA_PORT');
    url.searchParams.set('ikeaPort', '1');
    const reload = opts.reload !== false;
    if (reload) {
      window.location.replace(url.toString());
      return { ok: true, mode: next, reloaded: true, labRetired: true };
    }
    _mode = next;
    return { ok: true, mode: next, reloaded: false, labRetired: true };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

export function describeClodisRenderMode() {
  return {
    mode: getClodisRenderMode(),
    ikeaPort: isIkeaPortMode(),
    queryKeys: QUERY_KEYS,
    default: CLODIS_RENDER_MODE_IKEA_PORT,
    labRetired: true,
  };
}

if (typeof window !== 'undefined') {
  window.__cldGetClodisRenderMode = getClodisRenderMode;
  window.__cldSetClodisRenderMode = setClodisRenderMode;
  window.__cldIsIkeaPortMode = isIkeaPortMode;
}
