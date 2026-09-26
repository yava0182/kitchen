/**
 * Настройки экспорта CFRN → Bazis (ключи как Clodis __bazis_settings).
 * Админка: «Модуль Базис» → localStorage __bazis_settings.
 */

export const BAZIS_SETTINGS_LS_KEY = '__bazis_settings';

export const DEFAULT_BAZIS_EXPORT_SETTINGS = {
  use_clip: false,
  text_mat: false,
  use_allowance: false,
  template_accsessories: false,
};

function normalizeBazisSettings(raw) {
  const s = { ...DEFAULT_BAZIS_EXPORT_SETTINGS, ...(raw && typeof raw === 'object' ? raw : {}) };
  if (raw?.useEdgeClip != null) s.use_clip = !!raw.useEdgeClip;
  if (raw?.textMatInPanelName != null) s.text_mat = !!raw.textMatInPanelName;
  s.use_clip = !!s.use_clip;
  s.text_mat = !!s.text_mat;
  s.use_allowance = !!s.use_allowance;
  s.template_accsessories = !!s.template_accsessories;
  return s;
}

function readLegacyRoomBazisExport() {
  if (typeof window !== 'undefined' && typeof window.getRoomStepsConfig === 'function') {
    try {
      const cfg = window.getRoomStepsConfig();
      if (cfg?.bazisExport && typeof cfg.bazisExport === 'object') return cfg.bazisExport;
    } catch (_) {}
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('room_steps_config');
      if (raw) {
        const cfg = JSON.parse(raw);
        if (cfg?.bazisExport && typeof cfg.bazisExport === 'object') return cfg.bazisExport;
      }
    } catch (_) {}
  }
  return null;
}

export function getBazisExportSettings() {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(BAZIS_SETTINGS_LS_KEY);
      if (raw) return normalizeBazisSettings(JSON.parse(raw));
    } catch (_) {}
  }
  const legacy = readLegacyRoomBazisExport();
  if (legacy) return normalizeBazisSettings(legacy);
  return { ...DEFAULT_BAZIS_EXPORT_SETTINGS };
}

/** @deprecated room_steps_config.bazisExport — только для миграции */
export const BAZIS_EXPORT_SETTINGS_KEY = 'bazisExport';
