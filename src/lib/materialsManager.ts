// Модуль управления материалами
import { fetchCatalogData } from '../api/catalogAPI';

interface Material {
  id: number;
  name: string;
  code: string;
  icon: string;
  category: number[];
  data: {
    default: string;
    variants: {
      [key: string]: {
        name: string;
        thickness: number;
        color: string;
      };
    };
  };
}

interface Category {
  id: number;
  parent: number;
  name: string;
}

class MaterialsManager {
  private materials: Material[] = [];
  private categories: Category[] = [];
  private currentMaterialType: string = 'ldsp';
  private selectedCategoryId: number | null = null;
  private editingMaterialId: number | null = null;

  async init() {
    // Загружаем данные
    await this.loadData();
    
    // Инициализируем обработчики событий
    this.initEventHandlers();
  }

  private async loadData() {
    try {
      // Загружаем материалы и категории для ЛДСП по умолчанию
      // fetchCatalogData теперь возвращает пустой массив при ошибках, поэтому не нужно try-catch
      const materialsData = await fetchCatalogData<Material[]>('materials_ldsp_items.json');
      const categoriesData = await fetchCatalogData<Category[]>('materials_ldsp_categories.json');
      this.materials = Array.isArray(materialsData) ? materialsData : [];
      this.categories = Array.isArray(categoriesData) ? categoriesData : [];
      
      if (this.materials.length === 0) {
        console.warn('⚠️ [materialsManager] Материалы не загружены (файл не найден или пуст)');
      }
      if (this.categories.length === 0) {
        console.warn('⚠️ [materialsManager] Категории не загружены (файл не найден или пуст)');
      }
    } catch (error) {
      // Дополнительная обработка на случай других ошибок
      console.warn('⚠️ [materialsManager] Ошибка загрузки данных (используем пустые массивы):', error);
      this.materials = [];
      this.categories = [];
    }
  }

  private initEventHandlers() {
    // Открытие менеджера материалов
    const menuItem = document.querySelector('[href="#materials-manager"]');
    if (menuItem) {
      menuItem.addEventListener('click', (e) => {
        e.preventDefault();
        this.show();
      });
    }

    // Закрытие менеджера
    const closeBtn = document.getElementById('materials-manager-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Кнопка добавления материала
    const addBtn = document.getElementById('materials-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openEditModal());
    }

    // Фильтр по типу
    const typeFilter = document.getElementById('materials-type-filter') as HTMLSelectElement;
    if (typeFilter) {
      typeFilter.addEventListener('change', async (e) => {
        const target = e.target as HTMLSelectElement;
        const type = target.value || 'ldsp';
        await this.changeType(type);
      });
    }

    // Модальное окно редактирования
    this.initEditModalHandlers();
  }

  private initEditModalHandlers() {
    const modal = document.getElementById('material-edit-modal-backdrop');
    const closeBtn = document.getElementById('material-edit-modal-close');
    const cancelBtn = document.getElementById('material-edit-cancel-btn');
    const saveBtn = document.getElementById('material-edit-save-btn');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeEditModal());
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeEditModal());
    }
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveMaterial());
    }

    // Синхронизация выбора цвета
    const colorInput = document.getElementById('material-color-input') as HTMLInputElement;
    const colorText = document.getElementById('material-color-text') as HTMLInputElement;
    
    if (colorInput && colorText) {
      colorInput.addEventListener('input', (e) => {
        colorText.value = (e.target as HTMLInputElement).value;
      });
      colorText.addEventListener('input', (e) => {
        const value = (e.target as HTMLInputElement).value;
        if (/^#[0-9A-F]{6}$/i.test(value)) {
          colorInput.value = value;
        }
      });
    }

    // Загрузка категорий при изменении типа
    const typeSelect = document.getElementById('material-type-select') as HTMLSelectElement;
    if (typeSelect) {
      typeSelect.addEventListener('change', async (e) => {
        const type = (e.target as HTMLSelectElement).value;
        await this.loadCategoriesForType(type);
      });
    }
  }

  async show() {
    // ⭐ СКРЫВАЕМ ВСЕ ДРУГИЕ КОНТЕНТЫ ПЕРЕД ОТКРЫТИЕМ ПЛИТНЫХ МАТЕРИАЛОВ
    if ((window as any).AdminPanel && typeof (window as any).AdminPanel.hideAllAdminContent === 'function') {
      (window as any).AdminPanel.hideAllAdminContent();
    } else {
      // Fallback: скрываем основные контенты вручную
      const contentIds = [
        'type-elements-backdrop',
        'element-types-backdrop',
        'catalog-groups-backdrop',
        'catalog-item-edit-backdrop',
        'admin-section-container'
      ];
      contentIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.style.display = 'none';
        }
      });
    }
    
    const backdrop = document.getElementById('materials-manager-backdrop');
    if (backdrop) {
      backdrop.style.display = 'block';
      await this.render();
    }
  }

  hide() {
    const backdrop = document.getElementById('materials-manager-backdrop');
    if (backdrop) {
      backdrop.style.display = 'none';
    }
  }

  private async changeType(type: string) {
    this.currentMaterialType = type;
    this.selectedCategoryId = null;
    
    try {
      // Загружаем данные для нового типа
      const materialsData = await fetchCatalogData<Material[]>(`materials_${type}_items.json`);
      const categoriesData = await fetchCatalogData<Category[]>(`materials_${type}_categories.json`);
      this.materials = Array.isArray(materialsData) ? materialsData : [];
      this.categories = Array.isArray(categoriesData) ? categoriesData : [];
      
      if (this.materials.length === 0) {
        console.warn(`⚠️ [materialsManager] Материалы типа ${type} не загружены (файл не найден или пуст)`);
      }
      if (this.categories.length === 0) {
        console.warn(`⚠️ [materialsManager] Категории типа ${type} не загружены (файл не найден или пуст)`);
      }
      
      await this.render();
    } catch (error) {
      console.warn('⚠️ [materialsManager] Ошибка смены типа (используем пустые массивы):', error);
      // Если файл не найден, показываем пустой список
      this.materials = [];
      this.categories = [];
      await this.render();
    }
  }

  private async render() {
    this.renderCategories();
    this.renderMaterials();
  }

  private renderCategories() {
    const container = document.getElementById('materials-categories-tree');
    if (!container) return;

    container.innerHTML = '';

    // Создаем элемент "Все"
    const allItem = document.createElement('div');
    allItem.className = 'category-item';
    allItem.style.cssText = 'padding: 8px 12px; cursor: pointer; border-radius: 4px; margin-bottom: 4px;';
    allItem.textContent = 'Все материалы';
    
    if (this.selectedCategoryId === null) {
      allItem.style.background = '#007bff';
      allItem.style.color = '#fff';
    } else {
      allItem.style.background = 'transparent';
      allItem.style.color = '#333';
    }
    
    allItem.addEventListener('click', () => {
      this.selectedCategoryId = null;
      this.renderCategories();
      this.renderMaterials();
    });
    allItem.addEventListener('mouseenter', () => {
      if (this.selectedCategoryId !== null) {
        allItem.style.background = '#e9ecef';
      }
    });
    allItem.addEventListener('mouseleave', () => {
      if (this.selectedCategoryId !== null) {
        allItem.style.background = 'transparent';
      }
    });
    
    container.appendChild(allItem);

    // Рендерим дерево категорий
    this.renderCategoryTree(container, 0, 0);
  }

  private renderCategoryTree(container: HTMLElement, parentId: number, level: number) {
    const children = this.categories.filter(c => c.parent === parentId);
    
    children.forEach(category => {
      const item = document.createElement('div');
      item.className = 'category-item';
      item.style.cssText = `padding: 8px 12px; padding-left: ${12 + level * 16}px; cursor: pointer; border-radius: 4px; margin-bottom: 4px;`;
      item.textContent = category.name;
      
      if (this.selectedCategoryId === category.id) {
        item.style.background = '#007bff';
        item.style.color = '#fff';
      } else {
        item.style.background = 'transparent';
        item.style.color = '#333';
      }
      
      item.addEventListener('click', () => {
        this.selectedCategoryId = category.id;
        this.renderCategories();
        this.renderMaterials();
      });
      item.addEventListener('mouseenter', () => {
        if (this.selectedCategoryId !== category.id) {
          item.style.background = '#e9ecef';
        }
      });
      item.addEventListener('mouseleave', () => {
        if (this.selectedCategoryId !== category.id) {
          item.style.background = 'transparent';
        }
      });
      
      container.appendChild(item);
      
      // Рекурсивно рендерим дочерние категории
      this.renderCategoryTree(container, category.id, level + 1);
    });
  }

  private renderMaterials() {
    const grid = document.getElementById('materials-items-grid');
    const emptyState = document.getElementById('materials-empty-state');
    if (!grid || !emptyState) return;

    // Фильтруем материалы по выбранной категории
    let filtered = this.materials;
    if (this.selectedCategoryId !== null) {
      filtered = this.materials.filter(m => 
        m.category.includes(this.selectedCategoryId!)
      );
    }

    if (filtered.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    grid.innerHTML = '';

    filtered.forEach(material => {
      const card = this.createMaterialCard(material);
      grid.appendChild(card);
    });
  }

  private createMaterialCard(material: Material): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = 'border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #fff; cursor: pointer; transition: all 0.2s;';
    
    const variant = material.data.variants[material.data.default];
    
    card.innerHTML = `
      <div style="width: 100%; height: 150px; background: ${variant.color}; display: flex; align-items: center; justify-content: center; overflow: hidden;">
        ${material.icon ? `<img src="${material.icon}" style="width: 100%; height: 100%; object-fit: cover;">` : `<div style="font-size: 48px; color: rgba(0,0,0,0.1);">□</div>`}
      </div>
      <div style="padding: 12px;">
        <div style="font-weight: 600; font-size: 14px; color: #333; margin-bottom: 4px;">${material.name}</div>
        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">${material.code || ''}</div>
        <div style="display: flex; gap: 8px;">
          <button class="edit-material-btn" data-id="${material.id}" style="flex: 1; padding: 6px; border: 1px solid #007bff; background: #fff; color: #007bff; border-radius: 4px; font-size: 12px; cursor: pointer;">
            Изменить
          </button>
          <button class="delete-material-btn" data-id="${material.id}" style="flex: 1; padding: 6px; border: 1px solid #dc3545; background: #fff; color: #dc3545; border-radius: 4px; font-size: 12px; cursor: pointer;">
            Удалить
          </button>
        </div>
      </div>
    `;

    // Обработчики
    const editBtn = card.querySelector('.edit-material-btn');
    const deleteBtn = card.querySelector('.delete-material-btn');
    
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openEditModal(material.id);
      });
    }
    
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteMaterial(material.id);
      });
    }

    // Hover эффекты
    card.addEventListener('mouseenter', () => {
      card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      card.style.transform = 'translateY(-2px)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.boxShadow = '';
      card.style.transform = '';
    });

    return card;
  }

  private async openEditModal(materialId?: number) {
    const modal = document.getElementById('material-edit-modal-backdrop');
    const title = document.getElementById('material-edit-modal-title');
    if (!modal || !title) return;

    this.editingMaterialId = materialId || null;

    // Устанавливаем заголовок
    title.textContent = materialId ? 'Редактировать материал' : 'Добавить материал';

    // Загружаем категории для текущего типа
    await this.loadCategoriesForType(this.currentMaterialType);

    // Если редактируем, заполняем форму
    if (materialId) {
      const material = this.materials.find(m => m.id === materialId);
      if (material) {
        this.fillEditForm(material);
      }
    } else {
      this.clearEditForm();
      // Устанавливаем тип по умолчанию
      const typeSelect = document.getElementById('material-type-select') as HTMLSelectElement;
      if (typeSelect) {
        typeSelect.value = this.currentMaterialType;
      }
    }

    modal.style.display = 'flex';
  }

  private closeEditModal() {
    const modal = document.getElementById('material-edit-modal-backdrop');
    if (modal) {
      modal.style.display = 'none';
    }
    this.editingMaterialId = null;
  }

  private async loadCategoriesForType(type: string) {
    const categorySelect = document.getElementById('material-category-select');
    if (!categorySelect) return;

    try {
      const categoriesData = await fetchCatalogData<Category[]>(`materials_${type}_categories.json`);
      const categories = Array.isArray(categoriesData) ? categoriesData : [];
      
      categorySelect.innerHTML = '<option value="">Выберите категорию</option>';
      categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id.toString();
        option.textContent = cat.name;
        categorySelect.appendChild(option);
      });
      
      if (categories.length === 0) {
        console.warn(`⚠️ [materialsManager] Категории типа ${type} не загружены (файл не найден или пуст)`);
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
      categorySelect.innerHTML = '<option value="">Категории не найдены</option>';
    }
  }

  private fillEditForm(material: Material) {
    const nameInput = document.getElementById('material-name-input') as HTMLInputElement;
    const codeInput = document.getElementById('material-code-input') as HTMLInputElement;
    const typeSelect = document.getElementById('material-type-select') as HTMLSelectElement;
    const categorySelect = document.getElementById('material-category-select') as HTMLSelectElement;
    const thicknessInput = document.getElementById('material-thickness-input') as HTMLInputElement;
    const colorInput = document.getElementById('material-color-input') as HTMLInputElement;
    const colorText = document.getElementById('material-color-text') as HTMLInputElement;
    const iconInput = document.getElementById('material-icon-input') as HTMLInputElement;

    const variant = material.data.variants[material.data.default];

    if (nameInput) nameInput.value = material.name;
    if (codeInput) codeInput.value = material.code;
    if (typeSelect) typeSelect.value = this.currentMaterialType;
    if (categorySelect && material.category.length > 0) categorySelect.value = material.category[0].toString();
    if (thicknessInput) thicknessInput.value = variant.thickness.toString();
    if (colorInput) colorInput.value = variant.color;
    if (colorText) colorText.value = variant.color;
    if (iconInput) iconInput.value = material.icon;
  }

  private clearEditForm() {
    const nameInput = document.getElementById('material-name-input') as HTMLInputElement;
    const codeInput = document.getElementById('material-code-input') as HTMLInputElement;
    const typeSelect = document.getElementById('material-type-select') as HTMLSelectElement;
    const categorySelect = document.getElementById('material-category-select') as HTMLSelectElement;
    const thicknessInput = document.getElementById('material-thickness-input') as HTMLInputElement;
    const colorInput = document.getElementById('material-color-input') as HTMLInputElement;
    const colorText = document.getElementById('material-color-text') as HTMLInputElement;
    const iconInput = document.getElementById('material-icon-input') as HTMLInputElement;

    if (nameInput) nameInput.value = '';
    if (codeInput) codeInput.value = '';
    if (typeSelect) typeSelect.value = '';
    if (categorySelect) categorySelect.value = '';
    if (thicknessInput) thicknessInput.value = '16';
    if (colorInput) colorInput.value = '#D2B48C';
    if (colorText) colorText.value = '#D2B48C';
    if (iconInput) iconInput.value = '';
  }

  private async saveMaterial() {
    const nameInput = document.getElementById('material-name-input') as HTMLInputElement;
    const codeInput = document.getElementById('material-code-input') as HTMLInputElement;
    const typeSelect = document.getElementById('material-type-select') as HTMLSelectElement;
    const categorySelect = document.getElementById('material-category-select') as HTMLSelectElement;
    const thicknessInput = document.getElementById('material-thickness-input') as HTMLInputElement;
    const colorInput = document.getElementById('material-color-input') as HTMLInputElement;
    const iconInput = document.getElementById('material-icon-input') as HTMLInputElement;

    // Валидация
    if (!nameInput.value.trim()) {
      alert('Введите название материала');
      return;
    }
    if (!typeSelect.value) {
      alert('Выберите тип материала');
      return;
    }
    if (!categorySelect.value) {
      alert('Выберите категорию');
      return;
    }

    const materialData: Material = {
      id: this.editingMaterialId || Date.now(),
      name: nameInput.value.trim(),
      code: codeInput.value.trim(),
      icon: iconInput.value.trim(),
      category: [parseInt(categorySelect.value)],
      data: {
        default: 'default_variant',
        variants: {
          default_variant: {
            name: 'Стандарт',
            thickness: parseFloat(thicknessInput.value) || 16,
            color: colorInput.value
          }
        }
      }
    };

    // Сохраняем или обновляем
    if (this.editingMaterialId) {
      const index = this.materials.findIndex(m => m.id === this.editingMaterialId);
      if (index !== -1) {
        this.materials[index] = materialData;
      }
    } else {
      this.materials.push(materialData);
    }

    // Сохраняем в localStorage (или отправляем на сервер)
    this.saveToStorage();

    // Закрываем модалку и обновляем список
    this.closeEditModal();
    this.renderMaterials();

    // Уведомление
    alert(this.editingMaterialId ? 'Материал обновлен' : 'Материал добавлен');
  }

  private async deleteMaterial(materialId: number) {
    if (!confirm('Удалить материал?')) return;

    const index = this.materials.findIndex(m => m.id === materialId);
    if (index !== -1) {
      this.materials.splice(index, 1);
      this.saveToStorage();
      this.renderMaterials();
      alert('Материал удален');
    }
  }

  private saveToStorage() {
    // Сохраняем в localStorage
    const key = `materials_${this.currentMaterialType}_items`;
    localStorage.setItem(key, JSON.stringify(this.materials));
    
    // В реальном приложении здесь был бы запрос к серверу
    console.log('Материалы сохранены:', key, this.materials);
  }
}

// Создаем и экспортируем единственный экземпляр
export const materialsManager = new MaterialsManager();

// Инициализируем после загрузки DOM
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    materialsManager.init();
  });
}

