/**
 * Настройки UI конструктора: строка под ценой, иконка ?, попап.
 * Загружает/сохраняет через /api/constructor_ui_settings.
 */
(function () {
  const CONTAINER_ID = 'constructor-ui-price-subline-settings';
  const API = '/api/constructor_ui_settings';

  function getContainer() {
    let el = document.getElementById(CONTAINER_ID);
    if (el) return el;
    const page = document.getElementById('constructor-settings');
    if (!page) return null;
    const wrapper = page.querySelector('.wrapper-content');
    if (!wrapper) return null;
    el = document.createElement('div');
    el.id = CONTAINER_ID;
    el.innerHTML =
      '<div class="ibox" style="margin-bottom:20px;">' +
      '  <div class="ibox-title"><h5>Строка под ценой в конструкторе</h5></div>' +
      '  <div class="ibox-content">' +
      '    <div class="form-group" style="margin-bottom:16px;">' +
      '      <label class="d-flex align-items-center gap-2" style="cursor:pointer;">' +
      '        <input type="checkbox" id="cu-show-price-subline" /> Показывать строку под ценой' +
      '      </label>' +
      '    </div>' +
      '    <div class="form-group" style="margin-bottom:16px;">' +
      '      <label>Текст строки</label>' +
      '      <input type="text" id="cu-price-subline-text" class="form-control" style="max-width:600px;" placeholder="Например: Условия доставки уточняйте у менеджера" />' +
      '    </div>' +
      '    <div class="form-group" style="margin-bottom:16px;">' +
      '      <label class="d-flex align-items-center gap-2" style="cursor:pointer;">' +
      '        <input type="checkbox" id="cu-show-price-subline-help" /> Показывать иконку ? (справка)' +
      '      </label>' +
      '    </div>' +
      '    <div class="form-group" style="margin-bottom:16px;">' +
      '      <label>Текст справки (попап при нажатии на ?)</label>' +
      '      <textarea id="cu-price-subline-help-text" class="form-control" rows="4" style="max-width:600px;" placeholder="Текст подсказки для пользователя"></textarea>' +
      '    </div>' +
      '    <button type="button" class="btn btn-primary" id="cu-save-price-subline">Сохранить</button>' +
      '  </div>' +
      '</div>';
    wrapper.insertBefore(el, wrapper.firstChild);
    return el;
  }

  function loadSettings() {
    fetch(API)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var c = getContainer();
        if (!c) return;
        var cb1 = document.getElementById('cu-show-price-subline');
        var cb2 = document.getElementById('cu-show-price-subline-help');
        var t1 = document.getElementById('cu-price-subline-text');
        var t2 = document.getElementById('cu-price-subline-help-text');
        if (cb1) cb1.checked = !!data.show_price_subline;
        if (cb2) cb2.checked = !!data.show_price_subline_help_icon;
        if (t1) t1.value = data.price_subline_text || '';
        if (t2) t2.value = data.price_subline_help_text || '';
      })
      .catch(function (e) { console.error('constructor-ui-settings load:', e); });
  }

  function saveSettings() {
    var payload = {
      show_price_subline: !!document.getElementById('cu-show-price-subline').checked,
      price_subline_text: (document.getElementById('cu-price-subline-text') || {}).value || '',
      show_price_subline_help_icon: !!document.getElementById('cu-show-price-subline-help').checked,
      price_subline_help_text: (document.getElementById('cu-price-subline-help-text') || {}).value || ''
    };
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .then(function () {
        if (window.toastr) window.toastr.success('Настройки сохранены');
        else alert('Настройки сохранены');
      })
      .catch(function (e) {
        console.error('constructor-ui-settings save:', e);
        if (window.toastr) window.toastr.error('Ошибка сохранения');
        else alert('Ошибка сохранения');
      });
  }

  function init() {
    getContainer();
    loadSettings();
    var btn = document.getElementById('cu-save-price-subline');
    if (btn) btn.addEventListener('click', saveSettings);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // При переключении на страницу «Настройки конструктора» подгрузить форму и данные
  function onHashChange() {
    if (window.location.hash === '#constructor-settings') {
      setTimeout(function () {
        getContainer();
        loadSettings();
        var btn = document.getElementById('cu-save-price-subline');
        if (btn && !btn._bound) { btn._bound = true; btn.addEventListener('click', saveSettings); }
      }, 100);
    }
  }
  window.addEventListener('hashchange', onHashChange);
})();
