/**
 * Админка: «Модуль Базис» — настройки экспорта CFRN (как Clodis __bazis_settings).
 */
(function () {
  'use strict';

  const LS_KEY = '__bazis_settings';

  const DEFAULTS = {
    use_clip: false,
    text_mat: false,
    use_allowance: false,
    template_accsessories: false,
  };

  function normalize(raw) {
    const s = { ...DEFAULTS, ...(raw && typeof raw === 'object' ? raw : {}) };
    if (raw && raw.useEdgeClip != null) s.use_clip = !!raw.useEdgeClip;
    if (raw && raw.textMatInPanelName != null) s.text_mat = !!raw.textMatInPanelName;
    if (raw && raw.useEdgeClip != null && raw.use_clip == null) s.use_clip = !!raw.useEdgeClip;
    if (raw && raw.textMatInPanelName != null && raw.text_mat == null) s.text_mat = !!raw.textMatInPanelName;
    s.use_clip = !!s.use_clip;
    s.text_mat = !!s.text_mat;
    s.use_allowance = !!s.use_allowance;
    s.template_accsessories = !!s.template_accsessories;
    return s;
  }

  function readLegacyRoomBazis() {
    try {
      const raw = localStorage.getItem('room_steps_config');
      if (!raw) return null;
      const cfg = JSON.parse(raw);
      if (cfg?.bazisExport && typeof cfg.bazisExport === 'object') return cfg.bazisExport;
    } catch (_) {}
    return null;
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch (_) {}
    const legacy = readLegacyRoomBazis();
    if (legacy) return normalize(legacy);
    return { ...DEFAULTS };
  }

  function saveSettings(patch) {
    const next = normalize({ ...loadSettings(), ...(patch || {}) });
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return true;
    } catch (e) {
      console.warn('[bazis-module] save failed', e);
      return false;
    }
  }

  function setToggle(id, value) {
    const el = document.getElementById(id);
    if (el) el.checked = !!value;
  }

  function readTogglesFromUI() {
    return {
      use_clip: !!document.getElementById('bazis-setting-use-clip')?.checked,
      text_mat: !!document.getElementById('bazis-setting-text-mat')?.checked,
      use_allowance: !!document.getElementById('bazis-setting-use-allowance')?.checked,
      template_accsessories: !!document.getElementById('bazis-setting-template-accessories')?.checked,
    };
  }

  function applySettingsToUI(s) {
    setToggle('bazis-setting-use-clip', s.use_clip);
    setToggle('bazis-setting-text-mat', s.text_mat);
    setToggle('bazis-setting-use-allowance', s.use_allowance);
    setToggle('bazis-setting-template-accessories', s.template_accsessories);
  }

  function loadBazisModulePage() {
    const page = document.getElementById('bazis-module');
    if (!page) return;
    const s = loadSettings();
    applySettingsToUI(s);
    const saveBtn = document.getElementById('bazis-module-save-btn');
    if (saveBtn && !saveBtn._cldBazisModuleBound) {
      saveBtn._cldBazisModuleBound = true;
      saveBtn.addEventListener('click', () => {
        if (saveSettings(readTogglesFromUI())) {
          if (typeof toastr !== 'undefined') toastr.success('Настройки модуля Базис сохранены');
          else alert('Настройки модуля Базис сохранены');
        } else if (typeof toastr !== 'undefined') toastr.error('Ошибка сохранения');
        else alert('Ошибка сохранения');
      });
    }
  }

  window.loadBazisModulePage = loadBazisModulePage;
  window.getClodisBazisSettings = loadSettings;
  window.saveClodisBazisSettings = saveSettings;
})();
