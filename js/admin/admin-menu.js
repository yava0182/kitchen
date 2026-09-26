/**
 * admin-menu.js — Настройки меню (menu-settings)
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  let currentMenuData = null;

  function removeMenuItem(menuId) {
    if (!currentMenuData || !currentMenuData.main_menu) return;

    function removeFromArray(arr, id) {
      for (let i = 0; i < arr.length; i++) {
        if ((arr[i].menu_id || arr[i].id) === id) {
          arr.splice(i, 1);
          return true;
        }
        if (arr[i].children && removeFromArray(arr[i].children, id)) {
          return true;
        }
      }
      return false;
    }

    removeFromArray(currentMenuData.main_menu, menuId);
  }

  function renderMenuItem(container, item, level = 0) {
    const menuItem = document.createElement('div');
    menuItem.className = 'pp-tree-item';
    menuItem.setAttribute('data-id', item.menu_id || item.id || '');
    menuItem.style.cssText = `padding: 8px; margin-bottom: 4px; margin-left: ${level * 20}px; background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; display: flex; align-items: center;`;

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = item.expanded !== false;

    let html = '';

    if (hasChildren) {
      html += `<button class="pp-tree-expand ${isExpanded ? 'pp-tree-expanded' : ''}" style="margin-right: 8px; background: none; border: none; cursor: pointer; width: 20px; text-align: center;">${isExpanded ? '▼' : '▶'}</button>`;
    } else {
      html += '<span style="width: 20px; margin-right: 8px;"></span>';
    }

    html += `<span class="pp-tree-drag" style="margin-right: 8px; cursor: move; color: #999;">☰</span>`;

    if (item.icon) {
      html += `<i class="p_icon icon ${item.icon}" style="margin-right: 8px;">📁</i>`;
    }

    html += `<span style="flex: 1;">${(item.label || item.name || 'Без названия').replace(/</g, '&lt;')}`;
    if (item.component) {
      html += ` <span style="color: #3399ff;">[Компонент]</span>`;
    }
    html += `</span>`;

    html += `<div class="pp-tree-buttons">`;
    html += `<i class="btn-danger fa fa-trash delete btn btn-outline" style="cursor: pointer; color: #dc3545;" data-menu-id="${(item.menu_id || item.id || '').toString().replace(/"/g, '&quot;')}"></i>`;
    html += `</div>`;

    menuItem.innerHTML = html;
    container.appendChild(menuItem);

    if (hasChildren) {
      const expandBtn = menuItem.querySelector('.pp-tree-expand');
      expandBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isCurrentlyExpanded = this.classList.contains('pp-tree-expanded');
        this.classList.toggle('pp-tree-expanded');
        this.textContent = isCurrentlyExpanded ? '▶' : '▼';

        const childrenContainer = menuItem.nextElementSibling;
        if (childrenContainer && childrenContainer.classList.contains('pp-tree-children')) {
          childrenContainer.style.display = isCurrentlyExpanded ? 'none' : 'block';
        }
      });
    }

    const deleteBtn = menuItem.querySelector('.delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const menuId = this.getAttribute('data-menu-id');
        if (confirm(`Удалить элемент "${(item.label || item.name || '').replace(/"/g, '&quot;')}"?`)) {
          removeMenuItem(menuId);
          menuItem.remove();
        }
      });
    }

    if (hasChildren && isExpanded) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'pp-tree-children';
      childrenContainer.style.display = 'block';
      item.children.forEach(child => {
        renderMenuItem(childrenContainer, child, level + 1);
      });
      container.appendChild(childrenContainer);
    }
  }

  async function loadMenuSettings() {
    try {
      const container = document.querySelector('#menu-settings .pp-tree-slicklist');
      if (!container) {
        return;
      }

      container.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">Загрузка меню...</div>';

      const response = await fetch('/api/menu/get_custom_menu');
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const result = await response.json();

      if (result.__custom_menu && result.__custom_menu.value) {
        let menuValue;
        try {
          menuValue = typeof result.__custom_menu.value === 'string'
            ? JSON.parse(result.__custom_menu.value)
            : result.__custom_menu.value;
        } catch (parseError) {
          console.error('❌ Ошибка парсинга JSON из value:', parseError);
          container.innerHTML = '<div style="text-align:center; padding:20px; color:#ef4444;">Ошибка парсинга данных меню</div>';
          return;
        }

        currentMenuData = menuValue;

        if (menuValue.main_menu && Array.isArray(menuValue.main_menu) && menuValue.main_menu.length > 0) {
          container.innerHTML = '';
          menuValue.main_menu.forEach(item => {
            renderMenuItem(container, item, 0);
          });
        } else {
          container.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">Меню пусто (main_menu отсутствует или пуст)</div>';
        }
      } else {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">Меню не найдено в ответе API</div>';
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки меню:', error);
      const container = document.querySelector('#menu-settings .pp-tree-slicklist');
      if (container) {
        container.innerHTML = `<div style="text-align:center; padding:20px; color:#ef4444;">Ошибка загрузки меню: ${error.message}</div>`;
      }
    }
  }

  window.saveMenuSettings = async function saveMenuSettings() {
    try {
      if (!currentMenuData) {
        alert('Нет данных для сохранения');
        return;
      }

      const formData = new FormData();
      formData.append('data', JSON.stringify({
        main_menu: currentMenuData.main_menu || [],
        top_menu_left: currentMenuData.top_menu_left || [],
        top_menu_right: currentMenuData.top_menu_right || []
      }));

      const response = await fetch('/api/menu/save_custom_menu', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.result === 'success') {
        alert('Меню успешно сохранено!');
      } else {
        alert('Ошибка сохранения меню');
        console.error('❌ Ошибка сохранения:', result);
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения меню:', error);
      alert('Ошибка сохранения меню: ' + error.message);
    }
  };

  window.loadMenuSettings = loadMenuSettings;
})();
