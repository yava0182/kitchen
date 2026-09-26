/**
 * admin-catalog-item-tabs-dimensions.js — Вкладка "Размеры" в редакторе элемента каталога
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  // Размерные лимиты (из активного шаблона) — должны быть доступны до вызова initDimensionsTab
  window.__cldGetActiveSizesLimit = window.__cldGetActiveSizesLimit || function() {
    const root = document.getElementById('constructor-root-module');
    const st = root?.nodeData;
    const templates = Array.isArray(st?.templates) ? st.templates : [];
    const selectedId = st?.selectedTemplateId || templates?.[0]?.id || null;
    const tpl = templates.find(t => String(t?.id) === String(selectedId)) || templates?.[0] || null;
    const min = (tpl?.min && typeof tpl.min === 'object') ? tpl.min : { w: 0, h: 0, d: 0 };
    const max = (tpl?.max && typeof tpl.max === 'object') ? tpl.max : { w: 0, h: 0, d: 0 };
    return {
      min_width: Number(min.w) || 0,
      min_height: Number(min.h) || 0,
      min_depth: Number(min.d) || 0,
      max_width: Number(max.w) || 0,
      max_height: Number(max.h) || 0,
      max_depth: Number(max.d) || 0,
    };
  };
  window.__cldClampSizeValue = window.__cldClampSizeValue || function(val, min, max) {
    let n = Number(val);
    if (!Number.isFinite(n)) n = 0;
    const mn = Number(min) || 0;
    const mx = Number(max) || 0;
    if (mn > 0 && n < mn) n = mn;
    if (mx > 0 && n > mx) n = mx;
    return n;
  };
  window.__cldClampMainSizeInputs = window.__cldClampMainSizeInputs || function() {
    const lim = window.__cldGetActiveSizesLimit?.() || {};
    const wIn = document.getElementById('catalog-item-width');
    const hIn = document.getElementById('catalog-item-height');
    const dIn = document.getElementById('catalog-item-depth');
    if (wIn) wIn.value = String(window.__cldClampSizeValue(wIn.value, lim.min_width, lim.max_width) || 0);
    if (hIn) hIn.value = String(window.__cldClampSizeValue(hIn.value, lim.min_height, lim.max_height) || 0);
    if (dIn) dIn.value = String(window.__cldClampSizeValue(dIn.value, lim.min_depth, lim.max_depth) || 0);
  };
  window.__cldFilterVariantsByLimits = window.__cldFilterVariantsByLimits || function() {
    const lim = window.__cldGetActiveSizesLimit?.() || {};
    const within = (v) => {
      const w = Number(v?.width);
      const h = Number(v?.height);
      const d = Number(v?.depth);
      if (!Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(d)) return false;
      if (lim.min_width > 0 && w < lim.min_width) return false;
      if (lim.max_width > 0 && w > lim.max_width) return false;
      if (lim.min_height > 0 && h < lim.min_height) return false;
      if (lim.max_height > 0 && h > lim.max_height) return false;
      if (lim.min_depth > 0 && d < lim.min_depth) return false;
      if (lim.max_depth > 0 && d > lim.max_depth) return false;
      return true;
    };
    const before = Array.isArray(window.catalogItemSizeVariants) ? window.catalogItemSizeVariants.length : 0;
    window.catalogItemSizeVariants = (window.catalogItemSizeVariants || []).filter(within);
    const after = window.catalogItemSizeVariants.length;
    return { before, after, removed: before - after, limits: lim };
  };

  function initDimensionsTab() {
    window.catalogItemSizeVariants = window.catalogItemSizeVariants || [];

    try { window.__cldClampMainSizeInputs && window.__cldClampMainSizeInputs(); } catch {}
    try { window.__cldFilterVariantsByLimits && window.__cldFilterVariantsByLimits(); } catch {}

    function updateDefaultSizeSelect() {
      const defaultSizeSelect = document.getElementById('catalog-item-edit-default-size');
      if (!defaultSizeSelect) return;

      const currentValue = defaultSizeSelect.value;
      defaultSizeSelect.innerHTML = '<option value="0x0x0">0x0x0</option>';

      (window.catalogItemSizeVariants || []).forEach((v, i) => {
        const sizeStr = `${v.width}x${v.height}x${v.depth}`;
        const option = document.createElement('option');
        option.value = sizeStr;
        option.textContent = `${v.name || 'Вариант ' + (i + 1)} (${sizeStr})`;
        defaultSizeSelect.appendChild(option);
      });

      if (currentValue && Array.from(defaultSizeSelect.options).some(opt => opt.value === currentValue)) {
        defaultSizeSelect.value = currentValue;
      }
    }

    function renderSizeVariants() {
      const variantsList = document.getElementById('catalog-item-edit-variants-list');
      if (!variantsList) return;

      try { window.__cldFilterVariantsByLimits && window.__cldFilterVariantsByLimits(); } catch {}

      if (!window.catalogItemSizeVariants || window.catalogItemSizeVariants.length === 0) {
        variantsList.innerHTML = '<div style="padding:12px; text-align:center; color:#999; font-size:12px;">Вариантов размеров пока нет</div>';
        updateDefaultSizeSelect();
        return;
      }

      variantsList.innerHTML = window.catalogItemSizeVariants.map((v, i) => `
        <div style="padding:10px; border:1px solid #e5e7eb; border-radius:6px; margin-bottom:8px; background:#f9fafb;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:600; font-size:13px; margin-bottom:4px;">${v.name || 'Без названия'}</div>
              <div style="font-size:12px; color:#666;">
                Артикул: ${v.article || '-'} | Цена: ${v.price} ₽ | Размеры: ${v.width}×${v.height}×${v.depth} мм
              </div>
            </div>
            <button type="button" class="btn btn-sm btn-outline btn-danger" data-variant-index="${i}" style="padding:4px 8px; font-size:11px;">🗑 Удалить</button>
          </div>
        </div>
      `).join('');

      variantsList.querySelectorAll('button[data-variant-index]').forEach(btn => {
        btn.addEventListener('click', function() {
          const index = parseInt(this.getAttribute('data-variant-index') || '0');
          window.catalogItemSizeVariants.splice(index, 1);
          renderSizeVariants();
        });
      });

      updateDefaultSizeSelect();
    }

    function setupVariantSizeButtons(inputId, prefix) {
      const input = document.getElementById(inputId);
      if (!input) return;

      const multiplyBtn = document.querySelector(`.${prefix}-btn-multiply`);
      if (multiplyBtn) {
        multiplyBtn.addEventListener('click', function(e) {
          e.preventDefault();
          const currentValue = parseFloat(input.value) || 0;
          input.value = String(currentValue * 2);
        });
      }

      const divideBtn = document.querySelector(`.${prefix}-btn-divide`);
      if (divideBtn) {
        divideBtn.addEventListener('click', function(e) {
          e.preventDefault();
          const currentValue = parseFloat(input.value) || 0;
          input.value = String(currentValue / 2);
        });
      }

      const addVarBtn = document.querySelector(`.${prefix}-btn-add-var`);
      if (addVarBtn) {
        addVarBtn.addEventListener('click', function(e) {
          e.preventDefault();
          console.log(`ℹ️ [${prefix}] Кнопка "Добавить переменную" - будет реализована позже`);
        });
      }

      const modeBtn = document.querySelector(`.${prefix}-btn-mode`);
      if (modeBtn) {
        let isPrettyMode = modeBtn.getAttribute('data-mode') === 'pretty';
        modeBtn.addEventListener('click', function(e) {
          e.preventDefault();
          isPrettyMode = !isPrettyMode;
          this.textContent = isPrettyMode ? '{aa}' : 'a:a';
          this.setAttribute('data-mode', isPrettyMode ? 'pretty' : 'real');
        });
      }
    }

    setupVariantSizeButtons('catalog-item-edit-variant-width', 'variant-width');
    setupVariantSizeButtons('catalog-item-edit-variant-height', 'variant-height');
    setupVariantSizeButtons('catalog-item-edit-variant-depth', 'variant-depth');

    const variantAddBtn = document.getElementById('catalog-item-edit-variant-add');
    if (variantAddBtn) {
      variantAddBtn.addEventListener('click', function() {
        const variantNameInput = document.getElementById('catalog-item-edit-variant-name');
        const variantArticleInput = document.getElementById('catalog-item-edit-variant-article');
        const variantPriceInput = document.getElementById('catalog-item-edit-variant-price');
        const variantWidthInput = document.getElementById('catalog-item-edit-variant-width');
        const variantHeightInput = document.getElementById('catalog-item-edit-variant-height');
        const variantDepthInput = document.getElementById('catalog-item-edit-variant-depth');

        if (!variantNameInput || !variantArticleInput || !variantPriceInput || !variantWidthInput || !variantHeightInput || !variantDepthInput) {
          console.error('❌ Поля варианта не найдены');
          return;
        }

        const name = variantNameInput.value.trim();
        const article = variantArticleInput.value.trim();
        const price = parseFloat(variantPriceInput.value) || 0;
        const width = parseFloat(variantWidthInput.value) || 0;
        const height = parseFloat(variantHeightInput.value) || 0;
        const depth = parseFloat(variantDepthInput.value) || 0;

        if (!name) {
          alert('Введите название варианта');
          return;
        }

        if (!window.catalogItemSizeVariants) {
          window.catalogItemSizeVariants = [];
        }

        const lim = window.__cldGetActiveSizesLimit?.() || {};
        const bad =
          (lim.min_width > 0 && width < lim.min_width) || (lim.max_width > 0 && width > lim.max_width) ||
          (lim.min_height > 0 && height < lim.min_height) || (lim.max_height > 0 && height > lim.max_height) ||
          (lim.min_depth > 0 && depth < lim.min_depth) || (lim.max_depth > 0 && depth > lim.max_depth);
        if (bad) {
          alert(`Размер варианта выходит за ограничения активного шаблона.\n\n` +
            `Ограничения (0 = без лимита):\n` +
            `Ширина: ${lim.min_width} … ${lim.max_width}\n` +
            `Высота: ${lim.min_height} … ${lim.max_height}\n` +
            `Глубина: ${lim.min_depth} … ${lim.max_depth}`);
          return;
        }

        window.catalogItemSizeVariants.push({ name, article, price, width, height, depth });
        renderSizeVariants();

        variantNameInput.value = '';
        variantArticleInput.value = '';
        variantPriceInput.value = '0';
        variantWidthInput.value = '0';
        variantHeightInput.value = '0';
        variantDepthInput.value = '0';
      });
    }

    renderSizeVariants();

    const accessoriesAddBtn = document.getElementById('catalog-item-edit-accessories-add');
    if (accessoriesAddBtn) {
      accessoriesAddBtn.addEventListener('click', function() {
        alert('Функционал "Добавить комплектующие" будет реализован позже');
      });
    }

    const dimensionsAddBtn = document.getElementById('catalog-item-edit-dimensions-add');
    if (dimensionsAddBtn) {
      dimensionsAddBtn.addEventListener('click', function() {
        alert('Функционал кнопки "Добавить" будет реализован позже');
      });
    }

    const checkArticlesBtn = document.getElementById('catalog-item-edit-check-articles');
    if (checkArticlesBtn) {
      checkArticlesBtn.addEventListener('click', function() {
        if (!window.catalogItemSizeVariants || window.catalogItemSizeVariants.length === 0) {
          alert('Нет вариантов размеров для проверки артикулов');
          return;
        }

        const articles = window.catalogItemSizeVariants
          .map(v => v.article)
          .filter(article => article && article.trim() !== '');

        const duplicates = articles.filter((article, index) => articles.indexOf(article) !== index);

        if (duplicates.length > 0) {
          const uniqueDuplicates = [...new Set(duplicates)];
          alert(`⚠️ Найдены дубликаты артикулов:\n${uniqueDuplicates.join(', ')}`);
        } else {
          alert(`✅ Проверка завершена. Найдено ${articles.length} уникальных артикулов. Дубликатов не обнаружено.`);
        }
      });
    }

    console.log('✅ Вкладка "Размеры" инициализирована');
  }

  window.initDimensionsTab = initDimensionsTab;

})();
