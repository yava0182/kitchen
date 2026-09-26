// @ts-nocheck
/**
 * API для работы с каталогом материалов и элементов (Clodis style)
 */
import { API_BASE_URL } from '../config/apiConfig';

export interface MaterialKey {
  key: string;
  name: string;
  description: string;
  default_thickness: number;
  order: number;
}

export interface MaterialGroup {
  key: string;
  name: string;
  material: string;
  thickness: number;
  default: boolean;
}

export interface Category {
  id: number;
  parent: number;
  name: string;
  code: string;
  order: number;
  children?: Category[];
}

export interface MaterialItem {
  id: number;
  name: string;
  code: string;
  categories: number[];
  color: string;
  texture: string | null;
  thickness: number;
  density: number;
  price_per_m2: number;
  active: boolean;
  order: number;
}

export interface CatalogKey {
  key: string;
  name: string;
  description: string;
  icon: string;
  order: number;
}

export interface GlobalVar {
  key: string;
  name: string;
  value: number | string;
  type: string;
  unit?: string;
}

export interface GlobalVarSet {
  name: string;
  default: boolean;
  vars: GlobalVar[];
}

/**
 * Класс для работы с API каталога
 */
class CatalogAPI {
  private baseUrl: string = '/data';

  /**
   * Загружает JSON файл
   */
  private async fetchJSON<T>(path: string, defaultValue: T = [] as any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}/${path}`, {
        // ⭐ ИСПРАВЛЕНО: Добавляем заголовки, чтобы браузер не показывал ошибки в консоли
        cache: 'no-cache'
      });
    if (!response.ok) {
        // ⭐ ИСПРАВЛЕНО: Используем console.debug вместо console.warn - это не критично
        console.debug(`ℹ️ [catalogAPI] Файл не найден: ${path}, используем значение по умолчанию`);
        return defaultValue;
    }
    return await response.json();
    } catch (error) {
      // ⭐ ИСПРАВЛЕНО: Используем console.debug вместо console.warn - это не критично
      console.debug(`ℹ️ [catalogAPI] Ошибка загрузки ${path}, используем значение по умолчанию`);
      return defaultValue;
    }
  }

  /**
   * Загружает все данные каталога одним вызовом
   */
  async getAllCatalogData() {
    try {
      const [
        materialsKeys,
        materialsGroups,
        catalogsKeys,
        globalVars,
        ldspCategories,
        ldspItems
      ] = await Promise.all([
        this.fetchJSON<MaterialKey[]>('materials_keys.json'),
        this.fetchJSON<MaterialGroup[]>('materials_groups.json'),
        this.fetchJSON<CatalogKey[]>('catalogs_keys.json'),
        this.fetchJSON<GlobalVarSet[]>('global_vars.json'),
        this.fetchJSON<Category[]>('materials_ldsp_categories.json'),
        this.fetchJSON<MaterialItem[]>('materials_ldsp_items.json')
      ]);

      return {
        materials_keys: materialsKeys,
        materials_groups: materialsGroups,
        catalogs_keys: catalogsKeys,
        global_vars: globalVars,
        materials: {
          ldsp: {
            categories: ldspCategories,
            items: ldspItems
          }
        }
      };
    } catch (error) {
      // ⭐ ИСПРАВЛЕНО: Не пробрасываем ошибку, возвращаем пустые данные
      console.debug('ℹ️ [catalogAPI] Ошибка загрузки данных каталога, используем пустые значения');
      return {
        materials_keys: [],
        materials_groups: [],
        catalogs_keys: [],
        global_vars: [],
        materials: {
          ldsp: {
            categories: [],
            items: []
          }
        }
      };
    }
  }

  /**
   * Загружает типы материалов
   */
  async getMaterialsKeys(): Promise<MaterialKey[]> {
    return this.fetchJSON<MaterialKey[]>('materials_keys.json');
  }

  /**
   * Загружает группы материалов
   */
  async getMaterialsGroups(): Promise<MaterialGroup[]> {
    return this.fetchJSON<MaterialGroup[]>('materials_groups.json');
  }

  /**
   * Загружает категории для конкретного типа материала
   */
  async getMaterialCategories(materialKey: string): Promise<Category[]> {
    return this.fetchJSON<Category[]>(`materials_${materialKey}_categories.json`);
  }

  /**
   * Загружает элементы для конкретного типа материала
   */
  async getMaterialItems(materialKey: string): Promise<MaterialItem[]> {
    return this.fetchJSON<MaterialItem[]>(`materials_${materialKey}_items.json`);
  }

  /**
   * Загружает типы каталожных элементов
   */
  async getCatalogsKeys(): Promise<CatalogKey[]> {
    return this.fetchJSON<CatalogKey[]>('catalogs_keys.json');
  }

  /**
   * Загружает глобальные переменные
   */
  async getGlobalVars(): Promise<GlobalVarSet[]> {
    return this.fetchJSON<GlobalVarSet[]>('global_vars.json');
  }

  /**
   * Строит дерево категорий из плоского массива
   */
  buildCategoryTree(categories: Category[]): Category[] {
    const categoryMap = new Map<number, Category>();
    const rootCategories: Category[] = [];

    // Создаем карту всех категорий
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Строим дерево
    categories.forEach(cat => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parent === 0) {
        rootCategories.push(category);
      } else {
        const parent = categoryMap.get(cat.parent);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(category);
        }
      }
    });

    return rootCategories;
  }

  /**
   * Получает путь к категории (хлебные крошки)
   */
  getCategoryPath(categories: Category[], categoryId: number): string[] {
    const categoryMap = new Map<number, Category>();
    categories.forEach(cat => categoryMap.set(cat.id, cat));

    const path: string[] = [];
    let current = categoryMap.get(categoryId);

    while (current) {
      path.unshift(current.name);
      if (current.parent === 0) break;
      current = categoryMap.get(current.parent);
    }

    return path;
  }

  /**
   * Сохраняет JSON модуля на сервер (как в Clodis - через FormData)
   */
  async saveModuleJSONClodisStyle(
    name: string, 
    json: any, 
    elementId?: string,
    metadata?: any
  ): Promise<{ result: string; id?: string; filePath?: string; fileName?: string; error?: string }> {
    try {
      // Формируем FormData как в Clodis
      const formData = new FormData();
      
      // Добавляем метаданные
      if (metadata) {
        for (const key of Object.keys(metadata)) {
          if (key === 'data') continue;
          if (key === 'category' && Array.isArray(metadata[key])) {
            formData.append(key, JSON.stringify(metadata[key]));
          } else {
            formData.append(key, metadata[key]);
          }
        }
      }
      
      // В Clodis данные приходят в поле 'data' как JSON строка с полем params
      const dataObj = {
        ...metadata,
        params: json // Clodis JSON массив
      };
      formData.append('data', JSON.stringify(dataObj));
      formData.append('name', name);
      
      // URL как в Clodis: /catalog/items_save/:id
      const id = elementId && elementId !== '0' ? elementId : '0';
      const url = `${API_BASE_URL}/catalog/items_save/${id}`;
      
      let response: Response;
      try {
        response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      } catch (fetchError: any) {
        // Если сервер недоступен, это нормально - просто пробрасываем ошибку
        throw fetchError;
      }

      if (!response.ok) {
        try {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
        } catch (parseError) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const result = await response.json();
      return result;
    } catch (error) {
      // Не логируем - это нормально, если сервер не запущен
      return {
        result: 'error',
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  }

  /**
   * Сохраняет JSON модуля на сервер (старый метод для обратной совместимости)
   */
  async saveModuleJSON(name: string, json: any, elementId?: string): Promise<{ success: boolean; filePath?: string; fileName?: string; error?: string }> {
    const result = await this.saveModuleJSONClodisStyle(name, json, elementId);
    return {
      success: result.result === 'success',
      filePath: result.filePath,
      fileName: result.fileName,
      error: result.error
    };
  }

  /**
   * Получает список сохраненных модулей
   */
  async getModulesList(): Promise<{ modules: Array<{ name: string; path: string; size: number; modified: Date }> }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/modules/list`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      // Не логируем - это нормально, если сервер не запущен
      return { modules: [] };
    }
  }

  /**
   * Загружает модуль с сервера
   */
  async loadModuleJSON(fileName: string): Promise<{ json?: any; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/modules/load/${fileName}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      // Не логируем - это нормально, если сервер не запущен
      return {
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  }
}

// Экспортируем singleton instance
export const catalogAPI = new CatalogAPI();

/**
 * Утилита для загрузки данных каталога (для обратной совместимости)
 */
export async function fetchCatalogData<T>(filename: string): Promise<T> {
  try {
    const response = await fetch(`/data/${filename}`);
    
    if (!response.ok) {
      // Если файл не найден, возвращаем пустой массив вместо ошибки
      if (response.status === 404) {
        // Не логируем - это нормально, если файл не найден
        return [] as T;
      }
      throw new Error(`Failed to fetch ${filename}: ${response.status} ${response.statusText}`);
    }
    
    // Проверяем content-type перед парсингом
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      // Если получили HTML вместо JSON (например, страницу 404), возвращаем пустой массив
      const text = await response.text();
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        // Не логируем - это нормально
        return [] as T;
      }
      throw new Error(`Expected JSON but got ${contentType} for ${filename}`);
    }
    
    return await response.json();
  } catch (error) {
    // Если ошибка парсинга JSON (например, получили HTML), возвращаем пустой массив
    if (error instanceof SyntaxError) {
      // Не логируем - это нормально
      return [] as T;
    }
    // Для других ошибок пробрасываем дальше
    throw error;
  }
}

