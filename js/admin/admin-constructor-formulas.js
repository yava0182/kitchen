/**
 * admin-constructor-formulas.js
 * Добавляет кнопки "+{a}" для вставки формул (@section.width и т.д.) в поля размеров и позиции.
 * Подключается к admin-new.html и вызывается только при показе панели детали.
 * Не заменяет логику — только расширяет UI.
 */
(function() {
  'use strict';

  // Референс: 4 кнопки как в Clodis — +{a}, {aa}, × 2, ÷ 2
  function makeFormulaButtons(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return null;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex; gap:4px; margin-top:4px; flex-wrap:wrap;';
    const btnStyle = 'width:32px; height:28px; padding:0; font-size:11px; border:1px solid #d0d7e2; border-radius:4px; background:#fff; cursor:pointer; color:#555;';
    const addVar = document.createElement('button');
    addVar.type = 'button';
    addVar.className = 'variable-btn-add';
    addVar.setAttribute('data-field-id', fieldId);
    addVar.textContent = '+{a}';
    addVar.title = 'Добавить переменную';
    addVar.style.cssText = btnStyle + ' min-width:36px;';
    const addVar2 = document.createElement('button');
    addVar2.type = 'button';
    addVar2.className = 'variable-btn-add';
    addVar2.setAttribute('data-field-id', fieldId);
    addVar2.setAttribute('data-op', 'aa');
    addVar2.textContent = '{aa}';
    addVar2.title = 'Добавить переменную (вторая)';
    addVar2.style.cssText = btnStyle + ' min-width:36px;';
    const mul2 = document.createElement('button');
    mul2.type = 'button';
    mul2.className = 'variable-btn-op';
    mul2.setAttribute('data-field-id', fieldId);
    mul2.setAttribute('data-op', '*2');
    mul2.textContent = '× 2';
    mul2.title = 'Умножить на 2';
    mul2.style.cssText = btnStyle;
    const div2 = document.createElement('button');
    div2.type = 'button';
    div2.className = 'variable-btn-op';
    div2.setAttribute('data-field-id', fieldId);
    div2.setAttribute('data-op', '/2');
    div2.textContent = '÷ 2';
    div2.title = 'Делить на 2';
    div2.style.cssText = btnStyle;
    wrap.appendChild(addVar);
    wrap.appendChild(addVar2);
    wrap.appendChild(mul2);
    wrap.appendChild(div2);
    return wrap;
  }

  function ensureFormulaButtons() {
    const ids = [
      'catalog-constructor-property-size-x', 'catalog-constructor-property-size-y', 'catalog-constructor-property-size-z',
      'catalog-constructor-property-pos-x', 'catalog-constructor-property-pos-y', 'catalog-constructor-property-pos-z',
    ];
    ids.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (!field || field.dataset.cldFormulaBtn) return;
      const row = field.closest('div[style*="margin-bottom"]');
      if (!row) return;
      const wrap = makeFormulaButtons(fieldId);
      if (wrap) {
        row.appendChild(wrap);
        field.dataset.cldFormulaBtn = '1';
      }
    });
  }

  function showVariableDropdown(button, fieldId) {
    const existingDropdown = document.querySelector('.variable-dropdown');
    if (existingDropdown) existingDropdown.remove();

    const field = document.getElementById(fieldId);
    if (!field) return;

    function applyToken(token, op) {
      const cur = String(field.value || '').trim();
      const tok = String(token || '').trim();
      if (!tok) return;
      const next = !cur ? tok : (op === '-' ? `${cur} - ${tok}` : `${cur} + ${tok}`);
      field.value = next;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      // input event bubbles to propertiesPanel which triggers saveConstructorNodeData
      if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
    }

    const groups = [
      { title: 'Размеры родителя (родит. элемент)', items: [
        { token: '@section.width', label: 'Ширина (родит. элемент) — @section.width' },
        { token: '@section.height', label: 'Высота (родит. элемент) — @section.height' },
        { token: '@section.depth', label: 'Глубина (родит. элемент) — @section.depth' },
        { token: '@section.width / 2', label: 'Половина ширины — @section.width / 2' },
        { token: '@section.height / 2', label: 'Половина высоты — @section.height / 2' },
        { token: '@section.depth / 2', label: 'Половина глубины — @section.depth / 2' },
      ]},
      { title: 'Переменные', items: [{ token: '$wall.thickness', label: 'Толщина детали ($wall.thickness)' }]},
      { title: 'Материалы', items: [{ token: '#material.group0.thickness', label: 'Толщина материала группы 0 (#material.group0.thickness)' }]},
    ];

    const dropdown = document.createElement('div');
    dropdown.className = 'variable-dropdown';
    dropdown.style.cssText = 'position:absolute; background:white; border:1px solid #d0d7e2; border-radius:6px; box-shadow:0 6px 18px rgba(0,0,0,0.12); z-index:10000; max-height:240px; overflow-y:auto; min-width:320px;';

    groups.forEach((group, gi) => {
      const header = document.createElement('div');
      header.textContent = group.title;
      header.style.cssText = 'padding:10px 12px; font-size:12px; font-weight:700; color:#333; background:#fafafa; border-bottom:1px solid #f0f0f0;';
      dropdown.appendChild(header);
      group.items.forEach(it => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; align-items:center; gap:8px; padding:8px 12px; border-bottom:1px solid #f0f0f0;';
        const link = document.createElement('div');
        link.textContent = it.label;
        link.style.cssText = 'flex:1; font-size:12px; color:#0b5ed7; cursor:pointer; user-select:none;';
        link.onclick = () => { applyToken(it.token, '+'); dropdown.remove(); };
        const btnPlus = document.createElement('button');
        btnPlus.type = 'button';
        btnPlus.textContent = '+';
        btnPlus.style.cssText = 'width:28px; height:28px; border:1px solid #d0d7e2; border-radius:4px; background:#fff; cursor:pointer; font-weight:700;';
        btnPlus.onclick = (e) => { e.preventDefault(); e.stopPropagation(); applyToken(it.token, '+'); dropdown.remove(); };
        const btnMinus = document.createElement('button');
        btnMinus.type = 'button';
        btnMinus.textContent = '−';
        btnMinus.style.cssText = 'width:28px; height:28px; border:1px solid #d0d7e2; border-radius:4px; background:#fff; cursor:pointer; font-weight:700;';
        btnMinus.onclick = (e) => { e.preventDefault(); e.stopPropagation(); applyToken(it.token, '-'); dropdown.remove(); };
        row.appendChild(link);
        row.appendChild(btnPlus);
        row.appendChild(btnMinus);
        dropdown.appendChild(row);
      });
    });

    const rect = button.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + 2) + 'px';
    dropdown.style.left = rect.left + 'px';
    document.body.appendChild(dropdown);
    const closeHandler = (e) => {
      if (!dropdown.contains(e.target) && e.target !== button) {
        dropdown.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 0);
  }

  // Экспортируем: admin-new.html вызовет при показе панели детали
  window.__cldEnsureFormulaButtons = ensureFormulaButtons;
  window.__cldShowVariableDropdown = showVariableDropdown;

  // Применить операцию к полю (× 2, ÷ 2)
  function applyOp(fieldId, op) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    const cur = String(field.value || '').trim();
    const next = op === '*2' ? (cur ? `(${cur}) * 2` : '2') : (cur ? `(${cur}) / 2` : '0');
    field.value = next;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
  }

  // Обработчик клика — делегирование на document (надёжно ловит клики и после динамического создания кнопок)
  const boundKey = '__cldFormulasClickBound';
  if (!document[boundKey]) {
    document[boundKey] = true;
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('.variable-btn-add, .variable-btn-op');
      if (!btn) return;
      const fieldId = btn.getAttribute('data-field-id');
      if (!fieldId) return;
      e.preventDefault();
      e.stopPropagation();
      if (btn.classList.contains('variable-btn-op')) {
        const op = btn.getAttribute('data-op');
        if (op) applyOp(fieldId, op);
      } else {
        showVariableDropdown(btn, fieldId);
      }
    }, true);
  }
})();
