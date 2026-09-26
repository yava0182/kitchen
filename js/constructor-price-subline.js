/**
 * Строка под ценой в конструкторе: настройки берутся из room_steps_config для каждого шага.
 * При смене шага вызывайте window.updatePriceSublineForStep(stepNumber).
 */
(function () {
  const ROOM_STEPS_CONFIG_KEY = 'room_steps_config';

  function getRoomStepsConfig() {
    try {
      var raw = localStorage.getItem(ROOM_STEPS_CONFIG_KEY);
      if (raw) {
        var c = JSON.parse(raw);
        if (c && c.steps && c.steps.length) return c;
      }
    } catch (e) {}
    return null;
  }

  function getPriceSublineForStep(stepId, config) {
    if (!config || !config.steps) return {};
    var step = config.steps.find(function (s) { return s.stepId === stepId; });
    var ps = step && step.price_subline;
    if (!ps || typeof ps !== 'object') return {};
    var out = {
      show_price_subline: !!ps.show_price_subline,
      price_subline_text: typeof ps.price_subline_text === 'string' ? ps.price_subline_text : '',
      show_price_subline_help_icon: !!ps.show_price_subline_help_icon,
      price_subline_help_text: typeof ps.price_subline_help_text === 'string' ? ps.price_subline_help_text : '',
      price_subline_help_link_text: typeof ps.price_subline_help_link_text === 'string' ? ps.price_subline_help_link_text : 'Как это работает?',
      price_subline_help_title: typeof ps.price_subline_help_title === 'string' ? ps.price_subline_help_title : 'Справка'
    };
    if (stepId === 4) {
      out.price_subline_hint_text = typeof ps.price_subline_hint_text === 'string' ? ps.price_subline_hint_text : '';
      out.price_subline_modal_text = typeof ps.price_subline_modal_text === 'string' ? ps.price_subline_modal_text : '';
    }
    return out;
  }

  function showCenteredHelpModal(title, content) {
    var overlay = document.getElementById('step4-help-modal-overlay');
    var titleEl = document.getElementById('step4-help-modal-title');
    var contentEl = document.getElementById('step4-help-modal-content');
    var okBtn = document.getElementById('step4-help-modal-ok');
    var modalEl = overlay ? overlay.querySelector('.step4-help-modal') : null;
    if (!overlay) return;
    if (modalEl) modalEl.classList.remove('step4-help-modal--module-edit');
    if (overlay) overlay.classList.remove('step4-help-modal-overlay--module-edit');
    if (titleEl) {
      titleEl.textContent = title || 'Справка';
      titleEl.style.display = '';
    }
    if (okBtn) okBtn.style.display = '';
    if (typeof window !== 'undefined') {
      window.__cldEditingModuleZone = null;
      if (typeof window.clearModuleEditFocusFog === 'function') {
        window.clearModuleEditFocusFog();
      }
      if (typeof window.syncSectionZoneEditIconsActive === 'function') {
        window.syncSectionZoneEditIconsActive();
      }
    }
    if (contentEl) {
      contentEl.textContent = '';
      contentEl.appendChild(document.createTextNode(content || ''));
    }
    overlay.style.display = 'flex';
    function closeModal() {
      overlay.style.display = 'none';
    }
    if (okBtn && !okBtn._helpModalBound) {
      okBtn._helpModalBound = true;
      okBtn.addEventListener('click', closeModal);
    }
    overlay.onclick = function(e) {
      if (e.target === overlay) closeModal();
    };
  }
  window.showCenteredHelpModal = showCenteredHelpModal;

  function applySettings(data, stepId) {
    var block = document.getElementById('price-subline-block');
    var textEl = document.getElementById('price-subline-text');
    var iconEl = document.getElementById('price-subline-help-icon');
    var linkEl = document.getElementById('price-subline-help-link');
    var popupEl = document.getElementById('price-subline-help-popup');
    if (!block) return;

    if (!data.show_price_subline || !(data.price_subline_text || '').trim()) {
      block.style.display = 'none';
      return;
    }

    block.style.display = '';
    if (textEl) textEl.textContent = data.price_subline_text || '';

    var hasHelp = data.show_price_subline_help_icon && (data.price_subline_help_text || '').trim();
    // Шаг 4: строка под ценой с ? (не ссылка); ссылка — в подсказке ниже
    var useClickableText = false;

    if (iconEl) {
      if (hasHelp && !useClickableText) {
        iconEl.style.display = '';
        iconEl.removeAttribute('title');
        if (popupEl) {
          popupEl.textContent = '';
          popupEl.appendChild(document.createTextNode(data.price_subline_help_text || ''));
          var closeTimer = null;
          function showPopup() {
            if (closeTimer) clearTimeout(closeTimer);
            closeTimer = null;
            popupEl.style.display = 'block';
          }
          function scheduleClose() {
            if (closeTimer) clearTimeout(closeTimer);
            closeTimer = setTimeout(function () { popupEl.style.display = 'none'; closeTimer = null; }, 100);
          }
          function cancelClose() {
            if (closeTimer) clearTimeout(closeTimer);
            closeTimer = null;
          }
          iconEl.onmouseenter = showPopup;
          iconEl.onmouseleave = scheduleClose;
          popupEl.onmouseenter = cancelClose;
          popupEl.onmouseleave = scheduleClose;
          iconEl.onclick = null;
        }
      } else {
        iconEl.style.display = 'none';
        iconEl.onmouseenter = null;
        iconEl.onmouseleave = null;
      }
    }

    if (linkEl) {
      if (hasHelp && useClickableText) {
        linkEl.style.display = '';
        linkEl.textContent = (data.price_subline_help_link_text || 'Как это работает?').trim() || 'Подробнее';
        linkEl.onclick = function() {
          showCenteredHelpModal(data.price_subline_help_title || 'Справка', data.price_subline_help_text || '');
        };
      } else {
        linkEl.style.display = 'none';
        linkEl.onclick = null;
      }
    }

    if (popupEl) popupEl.style.display = 'none';
  }

  function updatePriceSublineForStep(stepId) {
    var config = getRoomStepsConfig();
    var data = getPriceSublineForStep(stepId, config);
    applySettings(data, stepId);
  }

  function init() {
    var stepId = 1;
    var stepIndicator = document.querySelector('.step-indicator');
    if (stepIndicator && stepIndicator.textContent) {
      var m = stepIndicator.textContent.match(/(\d+)/);
      if (m) stepId = parseInt(m[1], 10);
    }
    updatePriceSublineForStep(stepId);
  }

  window.updatePriceSublineForStep = updatePriceSublineForStep;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
