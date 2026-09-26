/**
 * admin-global-vars.js — Глобальные переменные конфигуратора
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  let globalVarsData = null;
  let globalVarsDebounceTimer = null;
  const GLOBAL_VARS_DEBOUNCE_DELAY = 500;

  async function loadGlobalVars() {
    try {
      const contentDiv = document.getElementById('global-vars-content');
      const groupSelect = document.getElementById('global-vars-group-select');

      if (!contentDiv || !groupSelect) return;

      contentDiv.innerHTML = '<div style="text-align: center; padding: 40px;"><p>Загрузка переменных...</p></div>';
      groupSelect.innerHTML = '<option value="">Загрузка...</option>';

      const timestamp = new Date().getTime();
      const apiUrl = `/api/catalog/global_vars?t=${timestamp}`;
      const response = await fetch(apiUrl, {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText}. Ответ: ${errorText}`);
      }

      const data = await response.json();

      if (!data || !data.value) {
        const contentDiv = document.getElementById('global-vars-content');
        if (contentDiv) {
          contentDiv.innerHTML = '<div style="text-align: center; padding: 40px; color: #d9534f;"><p>Ошибка: некорректные данные от сервера</p></div>';
        }
        return;
      }

      globalVarsData = data;

      if (data.value && Array.isArray(data.value)) {
        groupSelect.innerHTML = '';
        let defaultIndex = -1;

        data.value.forEach((group, index) => {
          const isActive = group.active === 1 || group.active === true;
          if (isActive) {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = group.name || `Группа ${index + 1}`;
            if (group.default) {
              option.selected = true;
              defaultIndex = index;
            }
            groupSelect.appendChild(option);
          }
        });

        if (groupSelect.value === '' && data.value.length > 0) {
          const firstActiveIndex = data.value.findIndex(g => g.active);
          if (firstActiveIndex >= 0) {
            groupSelect.value = firstActiveIndex;
            defaultIndex = firstActiveIndex;
          }
        }

        if (groupSelect.options.length === 0 && data.value.length > 0) {
          const option = document.createElement('option');
          option.value = 0;
          option.textContent = data.value[0].name || 'Группа 1';
          option.selected = true;
          groupSelect.appendChild(option);
          defaultIndex = 0;
        }

        const selectedIndex = parseInt(groupSelect.value);
        if (isNaN(selectedIndex) && defaultIndex >= 0) {
          groupSelect.value = defaultIndex;
          renderGlobalVars(defaultIndex);
        } else if (!isNaN(selectedIndex)) {
          renderGlobalVars(selectedIndex);
        } else {
          contentDiv.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;"><p>Нет доступных групп переменных</p></div>';
        }
      } else {
        contentDiv.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;"><p>Нет данных</p></div>';
      }

      groupSelect.addEventListener('change', function() {
        const selectedIndex = parseInt(this.value) || 0;
        renderGlobalVars(selectedIndex);
      });

    } catch (error) {
      console.error('❌ Ошибка загрузки глобальных переменных:', error);
      const contentDiv = document.getElementById('global-vars-content');
      const groupSelect = document.getElementById('global-vars-group-select');

      if (contentDiv) {
        contentDiv.innerHTML = `<div style="text-align: center; padding: 40px; color: #d9534f;">
          <p><strong>Ошибка загрузки данных</strong></p>
          <p style="font-size: 12px; color: #999;">${error.message}</p>
          <button type="button" class="btn btn-primary btn-sm mt-3" onclick="window.loadGlobalVars && window.loadGlobalVars()">Повторить загрузку</button>
        </div>`;
      }

      if (groupSelect) {
        groupSelect.innerHTML = '<option value="">Ошибка загрузки</option>';
      }

      globalVarsData = null;
    }
  }

  function renderGlobalVars(groupIndex) {
    const contentDiv = document.getElementById('global-vars-content');
    if (!contentDiv || !globalVarsData || !globalVarsData.value) return;

    const groups = globalVarsData.value;
    if (!Array.isArray(groups) || !groups[groupIndex]) {
      contentDiv.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;"><p>Группа не найдена</p></div>';
      return;
    }

    const group = groups[groupIndex];
    const vars = group.vars || [];

    const sortedVars = [...vars].sort((a, b) => {
      const aOrder = parseInt(a.order) || 0;
      const bOrder = parseInt(b.order) || 0;
      return aOrder - bOrder;
    });

    let html = '';

    sortedVars.forEach((v, index) => {
      html += `<div class="global-var-block" data-var-index="${index}" data-var-key="${(v.key || '').replace(/"/g, '&quot;')}" style="display: flex; margin-bottom: 20px; padding: 15px; border: 1px solid #e7eaec; border-radius: 4px; background: #fff;">`;

      html += `<div style="flex: 1; margin-right: 20px;">`;
      html += `<input type="text" class="form-control global-var-name" data-var-index="${index}" placeholder="Название переменной" value="${(v.name || '').replace(/"/g, '&quot;')}" style="width: 100%; margin-bottom: 5px; font-size: 14px;">`;
      html += `<input type="text" class="form-control global-var-key" data-var-index="${index}" placeholder="Ключ (key)" value="${(v.key || '').replace(/"/g, '&quot;')}" style="width: 100%; font-family: monospace; font-size: 12px; color: #666;">`;
      html += `</div>`;

      html += `<div style="flex: 1; display: flex; flex-direction: column; gap: 10px;">`;

      html += `<div class="form-group" style="margin-bottom: 10px;">`;
      html += `<label style="display: flex; align-items: center; gap: 10px;">`;
      html += `<span style="min-width: 120px;">Выводить в меню:</span>`;
      html += `<label class="switch" style="margin: 0;">`;
      html += `<input type="checkbox" class="global-var-show-menu" data-var-index="${index}" ${v.show_in_menu == 1 || v.show_in_menu === true ? 'checked' : ''}>`;
      html += `<span class="slider round"></span></label></label></div>`;

      html += `<div class="form-group" style="margin-bottom: 10px;">`;
      html += `<label style="display: flex; align-items: center; gap: 10px;">`;
      html += `<span style="min-width: 120px;">Тип:</span>`;
      html += `<select class="form-control global-var-type" data-var-index="${index}" style="flex: 1;">`;
      html += `<option value="number" ${v.type === 'number' ? 'selected' : ''}>Число</option>`;
      html += `<option value="boolean" ${v.type === 'boolean' ? 'selected' : ''}>Логическое</option>`;
      html += `<option value="select" ${v.type === 'select' ? 'selected' : ''}>Выбор</option>`;
      html += `<option value="text" ${v.type === 'text' || !v.type ? 'selected' : ''}>Текст</option>`;
      html += `</select></label></div>`;

      html += `<div class="form-group" style="margin-bottom: 10px;">`;
      html += `<label style="display: flex; align-items: center; gap: 10px;">`;
      html += `<span style="min-width: 120px;">Порядок:</span>`;
      html += `<input type="number" class="form-control global-var-order" data-var-index="${index}" value="${v.order || 0}" style="flex: 1;">`;
      html += `</label></div>`;

      html += `<div class="form-group" style="margin-bottom: 10px;">`;
      html += `<label style="display: flex; align-items: center; gap: 10px;">`;
      html += `<span style="min-width: 120px;">Группа:</span>`;
      html += `<input type="text" class="form-control global-var-group" data-var-index="${index}" value="${(v.group || '').replace(/"/g, '&quot;')}" style="flex: 1;">`;
      html += `</label></div>`;

      html += `<div class="form-group" style="margin-bottom: 10px; display: flex; gap: 10px;">`;
      html += `<div style="flex: 1;"><label>Мин.</label><input type="number" class="form-control global-var-min" data-var-index="${index}" value="${v.params?.min ?? ''}" placeholder="1"></div>`;
      html += `<div style="flex: 1;"><label>Макс.</label><input type="number" class="form-control global-var-max" data-var-index="${index}" value="${v.params?.max ?? ''}" placeholder=""></div>`;
      html += `<div style="flex: 1;"><label>Шаг</label><input type="number" class="form-control global-var-step" data-var-index="${index}" value="${v.params?.step ?? ''}" placeholder="1"></div>`;
      html += `</div>`;

      html += `<div class="form-group" style="margin-bottom: 10px;">`;
      html += `<label style="display: flex; align-items: center; gap: 10px;">`;
      html += `<span style="min-width: 120px;">Значение:</span>`;

      if (v.type === 'number') {
        const min = v.params?.min !== undefined ? `min="${v.params.min}"` : '';
        const max = v.params?.max !== undefined && v.params.max !== '' ? `max="${v.params.max}"` : '';
        const step = v.params?.step !== undefined ? `step="${v.params.step}"` : 'step="1"';
        html += `<input type="number" class="form-control global-var-value" data-var-index="${index}" value="${(v.value ?? '').toString().replace(/"/g, '&quot;')}" ${min} ${max} ${step} style="flex: 1;">`;
      } else if (v.type === 'boolean') {
        html += `<label class="switch" style="margin: 0;">`;
        html += `<input type="checkbox" class="global-var-value" data-var-index="${index}" ${v.value == 1 || v.value === true || v.value === '1' ? 'checked' : ''}>`;
        html += `<span class="slider round"></span></label>`;
      } else if (v.type === 'select' && v.params?.options) {
        html += `<select class="form-control global-var-value" data-var-index="${index}" style="flex: 1;">`;
        (v.params.options || []).forEach(opt => {
          html += `<option value="${(opt.value ?? '').toString().replace(/"/g, '&quot;')}" ${v.value == opt.value ? 'selected' : ''}>${(opt.name || '').replace(/</g, '&lt;')}</option>`;
        });
        html += `</select>`;
      } else {
        html += `<input type="text" class="form-control global-var-value" data-var-index="${index}" value="${(v.value ?? '').toString().replace(/"/g, '&quot;')}" style="flex: 1;">`;
      }

      html += `</label></div></div>`;

      html += `<div style="display: flex; flex-direction: column; gap: 10px; margin-left: 20px;">`;
      html += `<button type="button" class="btn btn-sm btn-info global-var-copy-btn" data-var-index="${index}" title="Копировать"><i class="fa fa-copy"></i></button>`;
      html += `<button type="button" class="btn btn-sm btn-danger global-var-delete-btn" data-var-index="${index}" title="Удалить"><i class="fa fa-trash"></i></button>`;
      html += `</div></div>`;
    });

    if (html === '') {
      html = '<div style="text-align: center; padding: 40px; color: #999;"><p>Нет переменных</p></div>';
    }

    contentDiv.innerHTML = html;
    attachGlobalVarHandlers();
  }

  function attachGlobalVarHandlers() {
    const contentDiv = document.getElementById('global-vars-content');
    if (!contentDiv) return;

    contentDiv.querySelectorAll('.global-var-name, .global-var-key, .global-var-order, .global-var-group, .global-var-min, .global-var-max, .global-var-step, .global-var-value').forEach(input => {
      input.addEventListener('input', function() { updateGlobalVarFromInput(this); });
      input.addEventListener('change', function() { updateGlobalVarFromInput(this); });
    });

    contentDiv.querySelectorAll('.global-var-show-menu, .global-var-type').forEach(input => {
      input.addEventListener('change', function() { updateGlobalVarFromInput(this); });
    });

    contentDiv.querySelectorAll('.global-var-copy-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        copyGlobalVar(parseInt(this.getAttribute('data-var-index')));
      });
    });

    contentDiv.querySelectorAll('.global-var-delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        deleteGlobalVar(parseInt(this.getAttribute('data-var-index')));
      });
    });
  }

  function updateGlobalVarFromInput(input) {
    const index = parseInt(input.getAttribute('data-var-index'));
    if (isNaN(index)) return;

    const groupSelect = document.getElementById('global-vars-group-select');
    if (!groupSelect || !globalVarsData || !globalVarsData.value) return;

    const groupIndex = parseInt(groupSelect.value) || 0;
    const group = globalVarsData.value[groupIndex];
    if (!group || !group.vars || !group.vars[index]) return;

    const varItem = group.vars[index];
    const className = input.className;

    if (className.includes('global-var-name')) varItem.name = input.value;
    else if (className.includes('global-var-key')) varItem.key = input.value;
    else if (className.includes('global-var-order')) varItem.order = parseInt(input.value) || 0;
    else if (className.includes('global-var-group')) varItem.group = input.value;
    else if (className.includes('global-var-min')) {
      if (!varItem.params) varItem.params = {};
      varItem.params.min = input.value ? parseFloat(input.value) : undefined;
    } else if (className.includes('global-var-max')) {
      if (!varItem.params) varItem.params = {};
      varItem.params.max = input.value ? parseFloat(input.value) : undefined;
    } else if (className.includes('global-var-step')) {
      if (!varItem.params) varItem.params = {};
      varItem.params.step = input.value ? parseFloat(input.value) : undefined;
    } else if (className.includes('global-var-value')) {
      varItem.value = input.type === 'checkbox' ? (input.checked ? 1 : 0) : input.value;
    } else if (className.includes('global-var-show-menu')) varItem.show_in_menu = input.checked ? 1 : 0;
    else if (className.includes('global-var-type')) {
      varItem.type = input.value;
      renderGlobalVars(groupIndex);
      return;
    }

    clearTimeout(globalVarsDebounceTimer);
    globalVarsDebounceTimer = setTimeout(() => {}, GLOBAL_VARS_DEBOUNCE_DELAY);
  }

  function copyGlobalVar(index) {
    const groupSelect = document.getElementById('global-vars-group-select');
    if (!groupSelect || !globalVarsData || !globalVarsData.value) return;

    const groupIndex = parseInt(groupSelect.value) || 0;
    const group = globalVarsData.value[groupIndex];
    if (!group || !group.vars || !group.vars[index]) return;

    const newVar = JSON.parse(JSON.stringify(group.vars[index]));
    newVar.key = newVar.key + '_copy';
    newVar.name = (newVar.name || '') + ' (копия)';
    group.vars.push(newVar);
    renderGlobalVars(groupIndex);
  }

  function deleteGlobalVar(index) {
    if (typeof Swal === 'undefined') {
      if (confirm('Удалить эту переменную?')) performDeleteGlobalVar(index);
      return;
    }
    Swal.fire({
      title: 'Удалить переменную?',
      text: 'Это действие нельзя отменить',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Да, удалить',
      cancelButtonText: 'Отмена'
    }).then((result) => { if (result.isConfirmed) performDeleteGlobalVar(index); });
  }

  function performDeleteGlobalVar(index) {
    const groupSelect = document.getElementById('global-vars-group-select');
    if (!groupSelect || !globalVarsData || !globalVarsData.value) return;

    const groupIndex = parseInt(groupSelect.value) || 0;
    const group = globalVarsData.value[groupIndex];
    if (!group || !group.vars || !group.vars[index]) return;

    group.vars.splice(index, 1);
    renderGlobalVars(groupIndex);
  }

  function addGlobalVar() {
    if (!globalVarsData || !globalVarsData.value || !Array.isArray(globalVarsData.value)) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({ icon: 'error', title: 'Ошибка', text: 'Данные не загружены. Дождитесь загрузки переменных.' });
      } else alert('Данные не загружены. Дождитесь загрузки переменных.');
      return;
    }

    const groupSelect = document.getElementById('global-vars-group-select');
    if (!groupSelect) return;

    const groupIndex = parseInt(groupSelect.value);
    if (isNaN(groupIndex) || groupIndex < 0) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({ icon: 'warning', title: 'Выберите группу', text: 'Пожалуйста, выберите группу переменных перед добавлением новой переменной.' });
      } else alert('Пожалуйста, выберите группу переменных.');
      return;
    }

    const group = globalVarsData.value[groupIndex];
    if (!group) return;

    if (!group.vars) group.vars = [];

    const newVar = {
      name: '', key: '', type: 'number', value: '', editable: 1,
      order: group.vars.length, group: '',
      params: { min: 1, max: '', step: 1 },
      show_in_menu: 0
    };
    group.vars.push(newVar);
    renderGlobalVars(groupIndex);
  }

  async function saveGlobalVars() {
    if (!globalVarsData) return;

    try {
      const response = await fetch('/api/catalog/global_vars/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globalVarsData)
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      if (typeof Swal !== 'undefined') {
        Swal.fire({ icon: 'success', title: 'Сохранено', text: 'Глобальные переменные успешно сохранены', timer: 2000, showConfirmButton: false });
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения глобальных переменных:', error);
      if (typeof Swal !== 'undefined') {
        Swal.fire({ icon: 'error', title: 'Ошибка', text: 'Не удалось сохранить глобальные переменные' });
      }
    }
  }

  window.loadGlobalVars = loadGlobalVars;
  window.saveGlobalVars = saveGlobalVars;
  window.addGlobalVar = addGlobalVar;
})();
