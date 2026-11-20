/**
 * Режим экономии GPU/RAM для комнаты.
 * По умолчанию ВКЛ на Windows — HDR MSAA HalfFloat RT → Chrome «Out of Memory».
 * Выключить HQ: ?hq=1 или window.__cldRoomLowMem = false
 * Включить явно: ?lowmem=1
 *
 * Контракт display (этап 1 HDR/ODT):
 * - production всегда HDR RT → ODT → sRGB (HQ или lite);
 * - lowmem/oom survivor = lite HDR+ODT, не LDR-bypass;
 * - LDR только диагностика (?spotDiskDebug) или аварийный fallback с warn.
 */
export function isRoomLowMemMode() {
  if (typeof window === 'undefined') return true;
  try {
    const q = String(window.location?.search || '');
    if (/[?&]hq=1\b/.test(q) || /[?&]lowmem=0\b/.test(q)) {
      window.__cldRoomLowMem = false;
      return false;
    }
    if (/[?&]lowmem=1\b/.test(q)) {
      window.__cldRoomLowMem = true;
      return true;
    }
    if (window.__cldRoomLowMem === false) return false;
    if (window.__cldRoomLowMem === true) return true;
    if (sessionStorage.getItem('cld_room_oom') === '1') return true;
  } catch (_) {}
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  return /Windows/i.test(ua);
}

export function markRoomOomSurvivor() {
  try {
    sessionStorage.setItem('cld_room_oom', '1');
    if (typeof window !== 'undefined') window.__cldRoomLowMem = true;
  } catch (_) {}
}

export function clearRoomOomSurvivor() {
  try {
    sessionStorage.removeItem('cld_room_oom');
  } catch (_) {}
}
