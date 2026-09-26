    // Функции для работы с библиотекой комплектующих
    window.openAccessoryEditModal = function(accessoryId) {
      const modal = document.getElementById('accessory-edit-modal');
      const title = document.getElementById('accessory-edit-modal-title');
      const form = document.getElementById('accessory-edit-form');
      const idInput = document.getElementById('accessory-edit-id');
      const nameInput = document.getElementById('accessory-edit-name');
      const skuInput = document.getElementById('accessory-edit-sku');
      const categorySelect = document.getElementById('accessory-edit-category');
      const priceInput = document.getElementById('accessory-edit-price');
      const typeSelect = document.getElementById('accessory-edit-type');
      const visibleCheckbox = document.getElementById('accessory-edit-visible');
      const tagsInput = document.getElementById('accessory-edit-tags');
      const imagesInput = document.getElementById('accessory-edit-images');
      const descriptionInput = document.getElementById('accessory-edit-description');
      const extraInput = document.getElementById('accessory-edit-extra');
      const compositeCheckbox = document.getElementById('accessory-edit-composite');
      
      if (!modal) {
        console.error('[CLD][accessories-library] Модальное окно accessory-edit-modal не найдено!');
        return;
      }
      // Заполняем категории
      const lib = window.__cldAccessoriesLib || { types: [], items: {} };
      categorySelect.innerHTML = '<option value="">Выберите категорию</option>';
      if (lib.types && Array.isArray(lib.types)) {
        lib.types.forEach(type => {
          const option = document.createElement('option');
          option.value = type.name || type.key || '';
          option.textContent = type.name || type.key || '';
          categorySelect.appendChild(option);
        });
      }
      
      if (accessoryId) {
        // Редактирование существующего
        title.textContent = 'Редактировать комплектующее';
        idInput.value = accessoryId;
        
        // Находим комплектующее в библиотеке
        let found = null;
        if (lib.types && Array.isArray(lib.types)) {
          lib.types.forEach(type => {
            const typeKey = type.key || String(type.id);
            const items = lib.items && lib.items[typeKey] ? lib.items[typeKey] : [];
            const item = items.find(i => String(i.id) === String(accessoryId));
            if (item) {
              found = { ...item, category: type.name || type.key || '' };
            }
          });
        }
        
        if (found) {
          nameInput.value = found.name || '';
          skuInput.value = found.sku || found.article || '';
          categorySelect.value = found.category || '';
          priceInput.value = found.price || 0;
          typeSelect.value = found.type || 'Общий';
          visibleCheckbox.checked = found.visible !== false;
          if (tagsInput) tagsInput.value = found.tags || '';
          if (imagesInput) imagesInput.value = found.images || '';
          if (descriptionInput) descriptionInput.value = found.description || '';
          if (extraInput) extraInput.value = found.extra || '';
          if (compositeCheckbox) compositeCheckbox.checked = !!(found.composite || found.isComposite || found.is_composite);
        }
      } else {
        // Добавление нового
        title.textContent = 'Добавить комплектующее';
        idInput.value = '';
        form.reset();
        visibleCheckbox.checked = true;
        if (tagsInput) tagsInput.value = '';
        if (imagesInput) imagesInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
        if (extraInput) extraInput.value = '';
        if (compositeCheckbox) compositeCheckbox.checked = false;
      }
      
      modal.style.display = 'flex';
    };
    
    window.closeAccessoryEditModal = function() {
      const modal = document.getElementById('accessory-edit-modal');
      if (modal) {
        modal.style.display = 'none';
      }
    }
    
    window.saveAccessoryFromModal = function() {
      const idInput = document.getElementById('accessory-edit-id');
      const nameInput = document.getElementById('accessory-edit-name');
      const skuInput = document.getElementById('accessory-edit-sku');
      const categorySelect = document.getElementById('accessory-edit-category');
      const priceInput = document.getElementById('accessory-edit-price');
      const typeSelect = document.getElementById('accessory-edit-type');
      const visibleCheckbox = document.getElementById('accessory-edit-visible');
      const tagsInput = document.getElementById('accessory-edit-tags');
      const imagesInput = document.getElementById('accessory-edit-images');
      const descriptionInput = document.getElementById('accessory-edit-description');
      const extraInput = document.getElementById('accessory-edit-extra');
      const compositeCheckbox = document.getElementById('accessory-edit-composite');
      
      if (!nameInput.value.trim()) {
        alert('Пожалуйста, укажите название комплектующего');
        return;
      }
      
      if (!categorySelect.value) {
        alert('Пожалуйста, выберите категорию');
        return;
      }
      
      const lib = window.__cldAccessoriesLib || { types: [], items: {} };
      
      // Находим или создаем категорию
      let typeObj = lib.types.find(t => (t.name || t.key || '') === categorySelect.value);
      if (!typeObj) {
        // Создаем новую категорию
        const newId = lib.types.length > 0 ? Math.max(...lib.types.map(t => t.id || 0)) + 1 : 1;
        typeObj = {
          id: newId,
          key: categorySelect.value.toLowerCase().replace(/\s+/g, '_'),
          name: categorySelect.value
        };
        lib.types.push(typeObj);
        lib.items[typeObj.key] = [];
      }
      
      const typeKey = typeObj.key || String(typeObj.id);
      if (!lib.items[typeKey]) {
        lib.items[typeKey] = [];
      }
      
      const accessoryData = {
        name: nameInput.value.trim(),
        sku: skuInput.value.trim() || '',
        article: skuInput.value.trim() || '',
        price: parseFloat(priceInput.value) || 0,
        type: typeSelect.value || 'Общий',
        visible: visibleCheckbox.checked,
        tags: tagsInput && tagsInput.value ? tagsInput.value.trim() : '',
        images: imagesInput && imagesInput.value ? imagesInput.value.trim() : '',
        description: descriptionInput && descriptionInput.value ? descriptionInput.value.trim() : '',
        extra: extraInput && extraInput.value ? extraInput.value.trim() : '',
        composite: compositeCheckbox && compositeCheckbox.checked ? 1 : 0,
        isComposite: compositeCheckbox && compositeCheckbox.checked ? 1 : 0
      };
      
      if (idInput.value) {
        // Редактирование
        const index = lib.items[typeKey].findIndex(i => String(i.id) === String(idInput.value));
        if (index >= 0) {
          accessoryData.id = parseInt(idInput.value);
          lib.items[typeKey][index] = accessoryData;
        }
      } else {
        // Добавление нового
        const newId = lib.items[typeKey].length > 0 
          ? Math.max(...lib.items[typeKey].map(i => i.id || 0)) + 1 
          : 1;
        accessoryData.id = newId;
        lib.items[typeKey].push(accessoryData);
      }
      
      window.__cldAccessoriesLib = lib;
      closeAccessoryEditModal();
      loadAccessoriesLibrary();
    }
    
    window.deleteAccessoryFromLibrary = function(accessoryId) {
      if (!confirm('Вы уверены, что хотите удалить это комплектующее?')) {
        return;
      }
      
      const lib = window.__cldAccessoriesLib || { types: [], items: {} };
      
      if (lib.types && Array.isArray(lib.types)) {
        lib.types.forEach(type => {
          const typeKey = type.key || String(type.id);
          if (lib.items[typeKey]) {
            lib.items[typeKey] = lib.items[typeKey].filter(i => String(i.id) !== String(accessoryId));
          }
        });
      }
      
      window.__cldAccessoriesLib = lib;
      loadAccessoriesLibrary();
    }
    
    window.toggleAccessoryVisibility = function(accessoryId) {
      const lib = window.__cldAccessoriesLib || { types: [], items: {} };
      
      if (lib.types && Array.isArray(lib.types)) {
        lib.types.forEach(type => {
          const typeKey = type.key || String(type.id);
          if (lib.items[typeKey]) {
            const item = lib.items[typeKey].find(i => String(i.id) === String(accessoryId));
            if (item) {
              item.visible = !item.visible;
            }
          }
        });
      }
      
      window.__cldAccessoriesLib = lib;
      loadAccessoriesLibrary();
    }
