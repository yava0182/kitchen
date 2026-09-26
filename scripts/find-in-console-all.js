/**
 * Комплексный поиск всех нужных данных в консоли браузера
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * 1. Откройте консоль браузера на Clodis
 * 2. Скопируйте и вставьте весь этот скрипт
 * 3. Выполните: findAllNeededData()
 * 4. Результаты будут в window.__foundData
 */

console.log('🔍 Загружаю скрипт для поиска всех нужных данных...\n');

/**
 * Поиск всех нужных данных
 */
function findAllNeededData() {
  console.log('🚀 Начинаю поиск всех нужных данных...\n');
  
  const results = {
    modules_groups: null,
    default_settings: null,
    material_types: null,
    catalogs_keys: null,
    global_vars: null,
    catalogs_by_key: {}
  };
  
  const foundIn = {
    modules_groups: [],
    default_settings: [],
    material_types: [],
    catalogs_keys: [],
    global_vars: []
  };
  
  // ============================================
  // 1. ПОИСК В ГЛОБАЛЬНЫХ ПЕРЕМЕННЫХ window
  // ============================================
  console.log('📦 Шаг 1: Поиск в глобальных переменных window...');
  
  // modules_groups
  const modulesGroupsPaths = [
    'window.pp.libs.modules_groups',
    'window.modules_groups',
    'window.pp.modules_groups',
    'window.pp.libs.modulesGroups',
    'modules_groups'
  ];
  
  for (const path of modulesGroupsPaths) {
    try {
      const value = eval(path);
      if (value !== undefined && value !== null) {
        results.modules_groups = value;
        foundIn.modules_groups.push(path);
        console.log(`✅ modules_groups найден в: ${path}`);
        break;
      }
    } catch (e) {}
  }
  
  // default_settings
  const defaultSettingsPaths = [
    'window.pp.defaults_data',
    'window.defaults_data',
    'window.default_settings',
    'window.pp.default_settings',
    'defaults_data',
    'default_settings'
  ];
  
  for (const path of defaultSettingsPaths) {
    try {
      const value = eval(path);
      if (value !== undefined && value !== null) {
        results.default_settings = value;
        foundIn.default_settings.push(path);
        console.log(`✅ default_settings найден в: ${path}`);
        break;
      }
    } catch (e) {}
  }
  
  // material_types
  const materialTypesPaths = [
    'window.material_types',
    'window.pp.libs.materials',
    'window.pp.material_types',
    'material_types'
  ];
  
  for (const path of materialTypesPaths) {
    try {
      const value = eval(path);
      if (value !== undefined && value !== null) {
        results.material_types = value;
        foundIn.material_types.push(path);
        console.log(`✅ material_types найден в: ${path}`);
        break;
      }
    } catch (e) {}
  }
  
  // catalogs_keys
  const catalogsKeysPaths = [
    'window.pp.libs.catalogs_info.keys',
    'window.catalogs_keys',
    'window.pp.catalogs_keys',
    'catalogs_keys'
  ];
  
  for (const path of catalogsKeysPaths) {
    try {
      const value = eval(path);
      if (value !== undefined && value !== null) {
        results.catalogs_keys = value;
        foundIn.catalogs_keys.push(path);
        console.log(`✅ catalogs_keys найден в: ${path}`);
        break;
      }
    } catch (e) {}
  }
  
  // global_vars
  const globalVarsPaths = [
    'window.pp.variables.global_vars',
    'window.pp.global_vars',
    'window.global_vars',
    'global_vars'
  ];
  
  for (const path of globalVarsPaths) {
    try {
      const value = eval(path);
      if (value !== undefined && value !== null) {
        results.global_vars = value;
        foundIn.global_vars.push(path);
        console.log(`✅ global_vars найден в: ${path}`);
        break;
      }
    } catch (e) {}
  }
  
  // ============================================
  // 2. ПОИСК В localStorage
  // ============================================
  console.log('\n💾 Шаг 2: Поиск в localStorage...');
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      
      // Ищем по ключам
      if (key && (
        key.includes('modules_groups') ||
        key.includes('default_settings') ||
        key.includes('material_types') ||
        key.includes('catalogs_keys') ||
        key.includes('global_vars')
      )) {
        try {
          const parsed = JSON.parse(value);
          if (key.includes('modules_groups') && !results.modules_groups) {
            results.modules_groups = parsed;
            foundIn.modules_groups.push(`localStorage['${key}']`);
            console.log(`✅ modules_groups найден в localStorage['${key}']`);
          }
          if (key.includes('default_settings') && !results.default_settings) {
            results.default_settings = parsed;
            foundIn.default_settings.push(`localStorage['${key}']`);
            console.log(`✅ default_settings найден в localStorage['${key}']`);
          }
          if (key.includes('material_types') && !results.material_types) {
            results.material_types = parsed;
            foundIn.material_types.push(`localStorage['${key}']`);
            console.log(`✅ material_types найден в localStorage['${key}']`);
          }
          if (key.includes('catalogs_keys') && !results.catalogs_keys) {
            results.catalogs_keys = parsed;
            foundIn.catalogs_keys.push(`localStorage['${key}']`);
            console.log(`✅ catalogs_keys найден в localStorage['${key}']`);
          }
          if (key.includes('global_vars') && !results.global_vars) {
            results.global_vars = parsed;
            foundIn.global_vars.push(`localStorage['${key}']`);
            console.log(`✅ global_vars найден в localStorage['${key}']`);
          }
        } catch (e) {}
      }
    }
  } catch (e) {
    console.log('⚠️  Ошибка чтения localStorage:', e.message);
  }
  
  // ============================================
  // 3. ПОИСК В sessionStorage
  // ============================================
  console.log('\n💾 Шаг 3: Поиск в sessionStorage...');
  
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      const value = sessionStorage.getItem(key);
      
      if (key && (
        key.includes('modules_groups') ||
        key.includes('default_settings') ||
        key.includes('material_types')
      )) {
        try {
          const parsed = JSON.parse(value);
          if (key.includes('modules_groups') && !results.modules_groups) {
            results.modules_groups = parsed;
            foundIn.modules_groups.push(`sessionStorage['${key}']`);
            console.log(`✅ modules_groups найден в sessionStorage['${key}']`);
          }
          if (key.includes('default_settings') && !results.default_settings) {
            results.default_settings = parsed;
            foundIn.default_settings.push(`sessionStorage['${key}']`);
            console.log(`✅ default_settings найден в sessionStorage['${key}']`);
          }
          if (key.includes('material_types') && !results.material_types) {
            results.material_types = parsed;
            foundIn.material_types.push(`sessionStorage['${key}']`);
            console.log(`✅ material_types найден в sessionStorage['${key}']`);
          }
        } catch (e) {}
      }
    }
  } catch (e) {
    console.log('⚠️  Ошибка чтения sessionStorage:', e.message);
  }
  
  // ============================================
  // 4. ПОИСК В pp.libs.catalogs (каталоги по типам)
  // ============================================
  console.log('\n📋 Шаг 4: Поиск каталогов по типам...');
  
  const catalogTypes = ['shablony_korpusov', 'dveri_shkaf', 'shelves', 'c32', 'c31', 'c39'];
  
  if (window.pp && window.pp.libs && window.pp.libs.catalogs) {
    catalogTypes.forEach(type => {
      if (window.pp.libs.catalogs[type]) {
        results.catalogs_by_key[type] = window.pp.libs.catalogs[type];
        console.log(`✅ ${type} найден в pp.libs.catalogs`);
      }
    });
  }
  
  // Также ищем в catalogs_by_key
  if (typeof catalogs_by_key !== 'undefined') {
    catalogTypes.forEach(type => {
      if (catalogs_by_key[type] && !results.catalogs_by_key[type]) {
        results.catalogs_by_key[type] = catalogs_by_key[type];
        console.log(`✅ ${type} найден в catalogs_by_key`);
      }
    });
  }
  
  // ============================================
  // 5. ПОИСК ВО ВСЕХ СВОЙСТВАХ window
  // ============================================
  console.log('\n🔍 Шаг 5: Глубокий поиск во всех свойствах window...');
  
  const searchTerms = ['modules', 'default', 'material', 'catalog', 'global'];
  const windowKeys = Object.keys(window);
  
  searchTerms.forEach(term => {
    const matching = windowKeys.filter(key => 
      key.toLowerCase().includes(term.toLowerCase())
    );
    
    if (matching.length > 0) {
      console.log(`📦 Найдены переменные с "${term}":`, matching.slice(0, 10));
      
      // Проверяем первые несколько
      matching.slice(0, 5).forEach(key => {
        try {
          const value = window[key];
          if (value && typeof value === 'object') {
            // Если это объект с нужными данными
            if (key.includes('modules') && key.includes('group') && !results.modules_groups) {
              results.modules_groups = value;
              foundIn.modules_groups.push(`window['${key}']`);
              console.log(`  ✅ modules_groups возможно в window['${key}']`);
            }
          }
        } catch (e) {}
      });
    }
  });
  
  // ============================================
  // 6. ИТОГИ
  // ============================================
  console.log('\n📊 ИТОГИ ПОИСКА:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const summary = {
    modules_groups: results.modules_groups ? '✅' : '❌',
    default_settings: results.default_settings ? '✅' : '❌',
    material_types: results.material_types ? '✅' : '❌',
    catalogs_keys: results.catalogs_keys ? '✅' : '❌',
    global_vars: results.global_vars ? '✅' : '❌',
    catalogs_by_key: Object.keys(results.catalogs_by_key).length > 0 ? `✅ (${Object.keys(results.catalogs_by_key).length} типов)` : '❌'
  };
  
  console.log(`modules_groups: ${summary.modules_groups}`, foundIn.modules_groups.length > 0 ? `(${foundIn.modules_groups.join(', ')})` : '');
  console.log(`default_settings: ${summary.default_settings}`, foundIn.default_settings.length > 0 ? `(${foundIn.default_settings.join(', ')})` : '');
  console.log(`material_types: ${summary.material_types}`, foundIn.material_types.length > 0 ? `(${foundIn.material_types.join(', ')})` : '');
  console.log(`catalogs_keys: ${summary.catalogs_keys}`, foundIn.catalogs_keys.length > 0 ? `(${foundIn.catalogs_keys.join(', ')})` : '');
  console.log(`global_vars: ${summary.global_vars}`, foundIn.global_vars.length > 0 ? `(${foundIn.global_vars.join(', ')})` : '');
  console.log(`catalogs_by_key: ${summary.catalogs_by_key}`);
  
  // Сохраняем результаты
  window.__foundData = results;
  window.__foundIn = foundIn;
  
  console.log('\n✅ Поиск завершен!');
  console.log('💡 Данные сохранены в:');
  console.log('   - window.__foundData - найденные данные');
  console.log('   - window.__foundIn - где найдено');
  console.log('\n📝 Для сохранения в файл используйте:');
  console.log('   saveFoundDataToFile()');
  
  return results;
}

/**
 * Сохранить найденные данные в файл
 */
function saveFoundDataToFile() {
  if (!window.__foundData) {
    console.error('❌ window.__foundData не найден');
    console.log('💡 Сначала выполните: findAllNeededData()');
    return false;
  }
  
  // Используем функцию сохранения
  if (window.saveJSONToFile) {
    return window.saveJSONToFile(window.__foundData, 'clodis-found-in-console.json');
  } else {
    // Если функция не загружена, создаем временную
    const jsonString = JSON.stringify(window.__foundData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clodis-found-in-console.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('✅ Файл clodis-found-in-console.json сохранен!');
    return true;
  }
}

/**
 * Показать все ключи localStorage
 */
function showLocalStorageKeys() {
  console.log('💾 Все ключи в localStorage:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(`  - ${key}`);
  }
}

/**
 * Показать все ключи sessionStorage
 */
function showSessionStorageKeys() {
  console.log('💾 Все ключи в sessionStorage:');
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    console.log(`  - ${key}`);
  }
}

/**
 * Показать структуру window.pp
 */
function showPPStructure() {
  if (window.pp) {
    console.log('📦 Структура window.pp:');
    console.log('  - pp.libs:', Object.keys(window.pp.libs || {}));
    console.log('  - pp.variables:', Object.keys(window.pp.variables || {}));
    console.log('  - pp:', Object.keys(window.pp).slice(0, 20));
  } else {
    console.log('❌ window.pp не найден');
  }
}

// Экспортируем функции
window.findAllNeededData = findAllNeededData;
window.saveFoundDataToFile = saveFoundDataToFile;
window.showLocalStorageKeys = showLocalStorageKeys;
window.showSessionStorageKeys = showSessionStorageKeys;
window.showPPStructure = showPPStructure;

console.log('✅ Скрипт загружен!');
console.log('\n📝 ДОСТУПНЫЕ ФУНКЦИИ:');
console.log('  - findAllNeededData() - найти все нужные данные');
console.log('  - saveFoundDataToFile() - сохранить найденные данные в файл');
console.log('  - showLocalStorageKeys() - показать все ключи localStorage');
console.log('  - showSessionStorageKeys() - показать все ключи sessionStorage');
console.log('  - showPPStructure() - показать структуру window.pp');
console.log('\n🚀 Начните с: findAllNeededData()');

