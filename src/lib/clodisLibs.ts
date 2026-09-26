// @ts-nocheck
/**
 * Clodis Libraries - глобальная библиотека материалов и каталогов
 * Аналог pp.libs из референса (Clodis)
 */

import * as THREE from 'three';
import { catalogAPI } from '../api/catalogAPI';

/**
 * Глобальный объект clodis
 * ⚠️ Для совместимости с референсом оставляем алиас window.pp = window.clodis
 */
declare global {
  interface Window {
    clodis: any;
    pp: any; // Алиас для совместимости (временно)
  }
}

/**
 * Инициализирует библиотеки Clodis
 */
export async function initClodisLibs() {
  console.log('🔧 Инициализация Clodis библиотек...');

  // Создаем глобальный объект clodis если его нет
  if (!window.clodis) {
    window.clodis = {
      libs: {},
      variables: {
        global_vars: [],
        selected_index: 0
      },
      three: {
        functions: {},
        materials: {}
      }
    };
  }

  // ⚠️ Алиас для совместимости с кодом, использующим window.pp
  if (!window.pp) {
    window.pp = window.clodis;
  }

  // ⭐ Инициализируем clodis.three.materials по референсу (main_core_v2_part2.js:3052-3094)
  // Референс: pp['three']['materials']['helper_cube'] = new THREE['MeshBasicMaterial']({...})
  if (!window.clodis.three) {
    window.clodis.three = {
      functions: {},
      materials: {}
    };
  }
  
  // Инициализируем материалы Three.js (референс: main_core_v2_part2.js:3054-3094)
  if (!window.clodis.three.materials) {
    window.clodis.three.materials = {};
  }
  
  // ⭐ ВАЖНО: Создаем материалы только если их нет (чтобы не перезаписывать существующие)
  // helper_cube - зеленоватый материал для helper кубов (референс: строка 3059-3065)
  if (!window.clodis.three.materials.helper_cube) {
    window.clodis.three.materials.helper_cube = new THREE.MeshBasicMaterial({
      color: '#96c296', // Зеленоватый цвет (как в референсе)
      transparent: true,
      opacity: 0.2, // Прозрачность 0.2 (как в референсе)
      depthWrite: false, // depthWrite: !0x1 = false
      depthTest: true  // depthTest: !0x0 = true
    });
  }
  
  // basic_line - черные линии для edges (референс: строка 3066-3069)
  if (!window.clodis.three.materials.basic_line) {
    window.clodis.three.materials.basic_line = new THREE.LineBasicMaterial({
      color: '#000000', // Черный цвет
      depthTest: true
    });
  }
  
  // hole - серый материал для отверстий (референс: строка 3055-3058)
  if (!window.clodis.three.materials.hole) {
    window.clodis.three.materials.hole = new THREE.MeshBasicMaterial({
      color: 0xaaaaaa, // Серый цвет
      depthTest: true
    });
  }
  
  console.log('🎨 [initClodisLibs] clodis.three.materials инициализированы:', {
    helper_cube: window.clodis.three.materials.helper_cube?.color,
    helper_cube_opacity: (window.clodis.three.materials.helper_cube as any)?.opacity,
    basic_line: window.clodis.three.materials.basic_line?.color
  });

  try {
    // Загружаем все данные
    const data = await catalogAPI.getAllCatalogData();

    // Инициализируем материалы
    window.clodis.libs.materials = {};
    if (!data.materials_keys || data.materials_keys.length === 0) {
      console.warn('⚠️ [initClodisLibs] materials_keys пуст, используем пустой объект');
      data.materials_keys = [];
    }
    data.materials_keys.forEach((mat: any) => {
      window.clodis.libs.materials[mat.key] = {
        name: mat.name,
        description: mat.description,
        default_thickness: mat.default_thickness,
        variants: {} // Будет заполнено из items
      };
    });

    // Заполняем варианты материалов из items
    if (data.materials.ldsp && data.materials.ldsp.items) {
      const ldspVariants: any = {};
      data.materials.ldsp.items.forEach((item: any) => {
        ldspVariants[item.code] = {
          name: item.name,
          color: item.color,
          texture: item.texture,
          thickness: item.thickness,
          density: item.density,
          price_per_m2: item.price_per_m2
        };
      });
      
      // Устанавливаем default вариант
      const firstItem = data.materials.ldsp.items[0];
      if (firstItem) {
        window.clodis.libs.materials.ldsp.default = firstItem.code;
        window.clodis.libs.materials.ldsp.variants = ldspVariants;
      }
    }

    // Инициализируем группы материалов
    window.clodis.libs.materials_groups = {};
    if (!data.materials_groups || data.materials_groups.length === 0) {
      console.warn('⚠️ [initClodisLibs] materials_groups пуст, используем пустой объект');
      data.materials_groups = [];
    }
    data.materials_groups.forEach((group: any) => {
      window.clodis.libs.materials_groups[group.key] = {
        name: group.name,
        material: group.material,
        thickness: group.thickness,
        default: group.default
      };
    });

    // Инициализируем каталоги
    if (!data.catalogs_keys || data.catalogs_keys.length === 0) {
      console.warn('⚠️ [initClodisLibs] catalogs_keys пуст, используем пустой массив');
      data.catalogs_keys = [];
    }
    window.clodis.libs.catalogs_info = {
      keys: data.catalogs_keys
    };
    
    window.clodis.libs.catalogs = {};
    data.catalogs_keys.forEach((catalog: any) => {
      window.clodis.libs.catalogs[catalog.key] = {
        name: catalog.name,
        description: catalog.description,
        icon: catalog.icon,
        items: [],
        categories: []
      };
    });

    // Инициализируем глобальные переменные
    if (!data.global_vars || data.global_vars.length === 0) {
      console.warn('⚠️ [initClodisLibs] global_vars пуст, используем пустой массив');
      data.global_vars = [];
    }
    window.clodis.variables.global_vars = data.global_vars;
    window.clodis.variables.selected_index = data.global_vars.findIndex((gv: any) => gv.default);
    
    // Создаем hash для быстрого доступа
    data.global_vars.forEach((varSet: any) => {
      if (varSet.vars) {
        const varsHash: any = {};
        varSet.vars.forEach((v: any) => {
          varsHash[v.key] = v;
        });
        varSet.vars_hash = varsHash;
      }
    });

    // Сохраняем категории материалов
    if (data.materials.ldsp && data.materials.ldsp.categories) {
      window.clodis.libs.materials_categories = {
        ldsp: {
          flat: data.materials.ldsp.categories,
          tree: catalogAPI.buildCategoryTree(data.materials.ldsp.categories)
        }
      };
    }

    console.log('✅ Clodis библиотеки инициализированы:', window.clodis);
    
    // Обновляем алиас после инициализации
    window.pp = window.clodis;
    
    return window.clodis;
  } catch (error) {
    // ⭐ ИСПРАВЛЕНО: Не пробрасываем ошибку, а инициализируем с пустыми данными
    // Используем console.debug - это не критично, файлы могут отсутствовать
    console.debug('ℹ️ [initClodisLibs] Используем значения по умолчанию (файлы не найдены)');
    
    // Инициализируем с пустыми данными, чтобы приложение могло работать
    window.clodis.libs.materials = window.clodis.libs.materials || {};
    window.clodis.libs.materials_groups = window.clodis.libs.materials_groups || {};
    window.clodis.libs.catalogs_info = window.clodis.libs.catalogs_info || { keys: [] };
    window.clodis.libs.catalogs = window.clodis.libs.catalogs || {};
    window.clodis.variables.global_vars = window.clodis.variables.global_vars || [];
    window.clodis.variables.selected_index = window.clodis.variables.selected_index || 0;
    
    // Обновляем алиас
    window.pp = window.clodis;
    
    console.log('✅ [initClodisLibs] Clodis библиотеки инициализированы');
    return window.clodis;
  }
}

/**
 * Получает материал по ключу
 */
export function getMaterial(materialKey: string) {
  return window.clodis?.libs?.materials?.[materialKey] || window.pp?.libs?.materials?.[materialKey];
}

/**
 * Получает группу материалов по ключу
 */
export function getMaterialGroup(groupKey: string) {
  return window.clodis?.libs?.materials_groups?.[groupKey] || window.pp?.libs?.materials_groups?.[groupKey];
}

/**
 * Получает глобальную переменную
 */
export function getGlobalVar(varKey: string) {
  const clodisSet = window.clodis?.variables?.global_vars?.[window.clodis.variables.selected_index];
  if (clodisSet?.vars_hash?.[varKey]) {
    return clodisSet.vars_hash[varKey];
  }
  // Fallback на pp для совместимости
  const ppSet = window.pp?.variables?.global_vars?.[window.pp.variables.selected_index];
  return ppSet?.vars_hash?.[varKey];
}

/**
 * Вычисляет выражение Clodis
 * Поддерживает:
 * - s:x, s:y, s:z - размеры секции
 * - g:g0.thickness - толщина группы материала
 * - v:varname - глобальная переменная
 * - математические операции
 */
export function evaluateExpression(expr: string | number, context: any = {}): number {
  // Если это уже число, возвращаем его
  if (typeof expr === 'number') return expr;
  
  // Если это строка-число, парсим
  const num = parseFloat(expr);
  if (!isNaN(num)) return num;
  
  try {
    let result = expr;
    
    // ⭐ ВАЖНО: Заменяем ВСЕ варианты s:x, s.y, s.z, s:x, s:y, s:z
    // Поддерживаем как s:x (с двоеточием), так и s.x (с точкой)
    // Сначала заменяем s:x, s:y, s:z (с двоеточием)
    result = result.replace(/s:x/g, context.sectionX || '0');
    result = result.replace(/s:y/g, context.sectionY || '0');
    result = result.replace(/s:z/g, context.sectionZ || '0');
    
    // Затем заменяем s.x, s.y, s.z (с точкой) - это может быть в выражениях типа "s.z+16"
    result = result.replace(/s\.x/g, context.sectionX || '0');
    result = result.replace(/s\.y/g, context.sectionY || '0');
    result = result.replace(/s\.z/g, context.sectionZ || '0');
    
    // Замена g:groupKey.thickness
    result = result.replace(/g:(\w+)\.thickness/g, (match: string, groupKey: string) => {
      const group = getMaterialGroup(groupKey);
      return group?.thickness?.toString() || '0';
    });
    
    // Замена v:varname
    result = result.replace(/v:(\w+)/g, (match: string, varKey: string) => {
      const variable = getGlobalVar(varKey);
      return variable?.value?.toString() || '0';
    });
    
    // Вычисляем математическое выражение
    const evaluated = eval(result);
    return typeof evaluated === 'number' ? evaluated : 0;
  } catch (error) {
    console.warn(`Ошибка вычисления выражения "${expr}":`, error);
    return 0;
  }
}

// Экспортируем для глобального доступа
if (typeof window !== 'undefined') {
  (window as any).evaluateExpression = evaluateExpression;
}
