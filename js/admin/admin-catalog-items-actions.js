/**
 * admin-catalog-items-actions.js — Массовые действия в списке элементов каталога
 * Категории / Параметры / Сброс материалов / (Переменные, Копировать модули)
 * Логика полностью наша, но поведение повторяет референс.
 */
(function() {
  'use strict';

  function getCurrentCatalogType() {
    const hash = window.location.hash || '';
    const urlParams = new URLSearchParams(hash.split('?')[1] || '');
    const catalogType = urlParams.get('type');
    return catalogType || '';
  }

  function getSelectedIds() {
    const tbody = document.getElementById('catalog-items-table-body');
    if (!tbody) return [];
    const checkboxes = tbody.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes)
      .map((cb) => cb.value)
      .filter(Boolean);
  }

  function initCategoriesButton() {
    const btn = document.getElementById('catalog-items-categories-btn');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const catalogType = getCurrentCatalogType();
      if (!catalogType) {
        if (window.toastr) window.toastr.warning('Сначала откройте список элементов нужного типа через меню слева.');
        else alert('Сначала откройте список элементов нужного типа через меню слева.');
        return;
      }
      window.location.hash = '#edges-categories?type=' + encodeURIComponent(catalogType);
    });
  }

  function initParamsButton() {
    const btn = document.getElementById('catalog-items-params-btn');
    const modal = document.getElementById('catalog-items-params-modal');
    if (!btn || !modal) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const ids = getSelectedIds();
      if (!ids.length) {
        if (window.toastr) window.toastr.info('Выберите элементы в списке, а затем нажмите «Параметры».');
        else alert('Выберите элементы в списке, а затем нажмите «Параметры».');
        return;
      }
      window.__CLD_CATALOG_BULK_IDS = ids;
      ['catalog-bulk-active', 'catalog-bulk-show-spec', 'catalog-bulk-include-nested', 'catalog-bulk-show-constructor']
        .forEach((id) => {
          const el = document.getElementById(id);
          if (el) el.value = 'keep';
        });
      modal.style.display = 'flex';
    });

    const cancelBtn = document.getElementById('catalog-bulk-params-cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }

    const applyBtn = document.getElementById('catalog-bulk-params-apply-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', async () => {
        try {
          const ids = Array.isArray(window.__CLD_CATALOG_BULK_IDS) ? window.__CLD_CATALOG_BULK_IDS : [];
          if (!ids.length) {
            modal.style.display = 'none';
            return;
          }
          const catalogType = getCurrentCatalogType();
          if (!catalogType) {
            if (window.toastr) window.toastr.error('Тип каталога не определен. Откройте список элементов через меню.');
            else alert('Тип каталога не определен. Откройте список элементов через меню.');
            return;
          }
          const payload = {
            ids: ids,
            params: {
              active: (document.getElementById('catalog-bulk-active') || {}).value || 'keep',
              show_in_spec: (document.getElementById('catalog-bulk-show-spec') || {}).value || 'keep',
              include_nested: (document.getElementById('catalog-bulk-include-nested') || {}).value || 'keep',
              show_in_constructor: (document.getElementById('catalog-bulk-show-constructor') || {}).value || 'keep',
            },
          };
          const res = await fetch('/api/catalog/items_bulk_params/' + encodeURIComponent(catalogType), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + res.statusText);
          const data = await res.json();
          if (data && data.result === 'success') {
            const count = data.updated || ids.length;
            if (window.toastr) window.toastr.success('Параметры обновлены для ' + count + ' элементов');
            else alert('Параметры обновлены для ' + count + ' элементов');
            modal.style.display = 'none';
            if (typeof window.loadCatalogItems === 'function') {
              window.loadCatalogItems();
            }
          } else {
            throw new Error((data && data.error) || 'Неизвестная ошибка');
          }
        } catch (err) {
          console.error('❌ Ошибка массового обновления параметров:', err);
          if (window.toastr) window.toastr.error(err.message || 'Ошибка массового обновления параметров');
          else alert('Ошибка массового обновления параметров: ' + (err.message || err));
        }
      });
    }
  }

  function initClearListButton() {
    let btn = document.getElementById('catalog-items-clear-btn');
    if (!btn) {
      const resetBtn = document.getElementById('catalog-items-reset-materials-btn');
      if (resetBtn && resetBtn.parentNode) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'catalog-items-clear-btn';
        btn.className = 'btn btn-sm btn-danger btn-outline';
        btn.textContent = 'Очистить список';
        btn.title = 'Удалить все элементы из текущего каталога';
        btn.style.marginRight = '10px';
        resetBtn.parentNode.insertBefore(btn, resetBtn);
      } else return;
    }
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const catalogType = getCurrentCatalogType();
      if (!catalogType) {
        if (window.toastr) window.toastr.warning('Сначала откройте список элементов нужного типа через меню слева.');
        else alert('Сначала откройте список элементов нужного типа через меню слева.');
        return;
      }
      if (!confirm('Удалить ВСЕ элементы из списка «' + catalogType + '»? Это действие нельзя отменить.')) return;

      try {
        const res = await fetch('/api/catalog/items_clear/' + encodeURIComponent(catalogType), {
          method: 'POST',
        });
        if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + res.statusText);
        const data = await res.json();
        if (data && data.result === 'success') {
          if (window.toastr) window.toastr.success('Список очищен');
          else alert('Список очищен');
          if (typeof window.loadCatalogItems === 'function') {
            await window.loadCatalogItems();
          }
        } else {
          throw new Error((data && data.error) || 'Неизвестная ошибка');
        }
      } catch (err) {
        console.error('❌ Ошибка очистки каталога:', err);
        if (window.toastr) window.toastr.error(err.message || 'Ошибка очистки');
        else alert('Ошибка: ' + (err.message || err));
      }
    });
  }

  function initResetMaterialsButton() {
    const btn = document.getElementById('catalog-items-reset-materials-btn');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const ids = getSelectedIds();
      if (!ids.length) {
        if (window.toastr) window.toastr.info('Выберите элементы в списке, а затем нажмите «Сбросить материалы».');
        else alert('Выберите элементы в списке, а затем нажмите «Сбросить материалы».');
        return;
      }
      if (!confirm('Сбросить настройки материалов для ' + ids.length + ' элементов?')) return;

      const catalogType = getCurrentCatalogType();
      if (!catalogType) {
        if (window.toastr) window.toastr.error('Тип каталога не определен. Откройте список элементов через меню.');
        else alert('Тип каталога не определен. Откройте список элементов через меню.');
        return;
      }

      fetch('/api/catalog/items_reset_materials/' + encodeURIComponent(catalogType), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error('HTTP ' + res.status + ': ' + res.statusText))))
        .then((data) => {
          if (data && data.result === 'success') {
            const count = data.updated || ids.length;
            if (window.toastr) window.toastr.success('Материалы сброшены для ' + count + ' элементов');
            else alert('Материалы сброшены для ' + count + ' элементов');
            if (typeof window.loadCatalogItems === 'function') {
              window.loadCatalogItems();
            }
          } else {
            throw new Error((data && data.error) || 'Неизвестная ошибка');
          }
        })
        .catch((err) => {
          console.error('❌ Ошибка массового сброса материалов:', err);
          if (window.toastr) window.toastr.error(err.message || 'Ошибка сброса материалов');
          else alert('Ошибка сброса материалов: ' + (err.message || err));
        });
    });
  }

  function initVarsAndCopyButtons() {
    const varsBtn = document.getElementById('catalog-items-change-vars-btn');
    if (varsBtn) {
      varsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const ids = getSelectedIds();
        if (!ids.length) {
          if (window.toastr) window.toastr.info('Выберите элемент (или несколько), затем нажмите «Изменить переменные».');
          else alert('Выберите элемент (или несколько), затем нажмите «Изменить переменные».');
          return;
        }
        const catalogType = getCurrentCatalogType();
        if (!catalogType) {
          if (window.toastr) window.toastr.error('Тип каталога не определен. Откройте список элементов через меню.');
          else alert('Тип каталога не определен. Откройте список элементов через меню.');
          return;
        }
        const firstId = ids[0];
        const catalogName = document.getElementById('catalog-items-subtitle')?.textContent || 'Элемент';

        // Открываем редактор первого выделенного элемента
        if (typeof window.openCatalogItemEdit === 'function') {
          window.openCatalogItemEdit(Number(firstId), catalogType, catalogName);
        } else {
          if (window.toastr) window.toastr.error('Форма редактирования элемента недоступна.');
          else alert('Форма редактирования элемента недоступна.');
          return;
        }

        // После открытия формы пытаемся автоматически переключиться на вкладку "Переменные"
        // Делаем это с небольшим ожиданием, чтобы Vue/DOM успели инициализироваться.
        setTimeout(() => {
          try {
            const tabs = document.querySelectorAll('#catalog-item-edit .tab_menu_h li[data-tab], #catalog-item-edit .tab_menu_h li[data-tab="variables"]');
            let target = null;
            tabs.forEach((li) => {
              const tabName = li.getAttribute('data-tab') || '';
              if (tabName === 'variables') target = li;
            });
            if (target && target instanceof HTMLElement) {
              target.click();
              if (window.toastr) window.toastr.info('Открыта вкладка «Переменные» для выбранного элемента.');
            }
          } catch (err) {
            console.error('[catalog-items-actions] Не удалось автоматически переключиться на вкладку "Переменные":', err);
          }
        }, 300);
      });
    }

    const copyBtn = document.getElementById('catalog-items-copy-modules-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const ids = getSelectedIds();
        if (ids.length < 2) {
          if (window.toastr) window.toastr.info('Выберите минимум два элемента: источник и получатели, затем нажмите «Копировать модули».');
          else alert('Выберите минимум два элемента: источник и получатели, затем нажмите «Копировать модули».');
          return;
        }

        const catalogType = getCurrentCatalogType();
        if (!catalogType) {
          if (window.toastr) window.toastr.error('Тип каталога не определен. Откройте список элементов через меню.');
          else alert('Тип каталога не определен. Откройте список элементов через меню.');
          return;
        }

        const sourceId = ids[0];
        const targets = ids.slice(1);

        if (!confirm('Скопировать модуль (конструктор) из элемента ID ' + sourceId + ' в ' + targets.length + ' других элементов? Текущие модули в получателях будут перезаписаны.')) {
          return;
        }

        const payload = {
          sourceId: Number(sourceId),
          targetIds: targets.map((id) => Number(id)),
        };

        fetch('/api/catalog/items_copy_modules/' + encodeURIComponent(catalogType), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
          .then((res) => (res.ok ? res.json() : Promise.reject(new Error('HTTP ' + res.status + ': ' + res.statusText))))
          .then((data) => {
            if (data && data.result === 'success') {
              const count = data.updated || targets.length;
              if (window.toastr) window.toastr.success('Модуль скопирован в ' + count + ' элементов');
              else alert('Модуль скопирован в ' + count + ' элементов');
              if (typeof window.loadCatalogItems === 'function') {
                window.loadCatalogItems();
              }
            } else {
              throw new Error((data && data.error) || 'Неизвестная ошибка');
            }
          })
          .catch((err) => {
            console.error('❌ Ошибка массового копирования модулей:', err);
            if (window.toastr) window.toastr.error(err.message || 'Ошибка копирования модулей');
            else alert('Ошибка копирования модулей: ' + (err.message || err));
          });
      });
    }

    const copyToOtherBtn = document.getElementById('catalog-items-copy-to-other-btn');
    if (copyToOtherBtn) {
      copyToOtherBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof window.copySelectedCatalogItemsToOther === 'function') {
          window.copySelectedCatalogItemsToOther();
        } else {
          if (window.toastr) window.toastr.error('Функция копирования в другой каталог не загружена. Ctrl+F5.');
          else alert('Функция копирования в другой каталог не загружена. Ctrl+F5.');
        }
      });
    }
  }

  function init() {
    if (window.__CLD_CATALOG_ITEMS_ACTIONS_INITIALIZED) return;
    window.__CLD_CATALOG_ITEMS_ACTIONS_INITIALIZED = true;
    initCategoriesButton();
    initParamsButton();
    initClearListButton();
    initResetMaterialsButton();
    initVarsAndCopyButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

