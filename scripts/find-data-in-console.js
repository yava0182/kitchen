/**
 * Скрипт для поиска данных в глобальных переменных Clodis
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * 1. Откройте консоль браузера на сайте Clodis (/constructor/)
 * 2. Скопируйте и вставьте этот скрипт
 * 3. Выполните функции для поиска данных
 */

console.log('🔍 Поиск данных в глобальных переменных Clodis...\n');

/**
 * Найти modules_groups
 */
function findModulesGroups() {
  console.log('📦 Ищу modules_groups...');
  
  // Вариант 1: pp.libs.modules_groups
  if (window.pp && window.pp.libs && window.pp.libs.modules_groups) {
    console.log('✅ Найдено в pp.libs.modules_groups:');
    console.log(JSON.stringify(window.pp.libs.modules_groups, null, 2));
    return window.pp.libs.modules_groups;
  }
  
  // Вариант 2: Глобальная переменная modules_groups
  if (typeof modules_groups !== 'undefined') {
    console.log('✅ Найдено в глобальной переменной modules_groups:');
    console.log(JSON.stringify(modules_groups, null, 2));
    return modules_groups;
  }
  
  // Вариант 3: В window
  if (window.modules_groups) {
    console.log('✅ Найдено в window.modules_groups:');
    console.log(JSON.stringify(window.modules_groups, null, 2));
    return window.modules_groups;
  }
  
  console.log('❌ modules_groups не найдено');
  return null;
}

/**
 * Найти default_settings
 */
function findDefaultSettings() {
  console.log('📦 Ищу default_settings...');
  
  // Вариант 1: defaults_data
  if (typeof defaults_data !== 'undefined') {
    console.log('✅ Найдено в defaults_data:');
    console.log(JSON.stringify(defaults_data, null, 2));
    return defaults_data;
  }
  
  // Вариант 2: В window
  if (window.defaults_data) {
    console.log('✅ Найдено в window.defaults_data:');
    console.log(JSON.stringify(window.defaults_data, null, 2));
    return window.defaults_data;
  }
  
  // Вариант 3: В pp
  if (window.pp && window.pp.defaults_data) {
    console.log('✅ Найдено в pp.defaults_data:');
    console.log(JSON.stringify(window.pp.defaults_data, null, 2));
    return window.pp.defaults_data;
  }
  
  console.log('❌ default_settings не найдено');
  return null;
}

/**
 * Найти material_types
 */
function findMaterialTypes() {
  console.log('📦 Ищу material_types...');
  
  // Вариант 1: Глобальная переменная material_types
  if (typeof material_types !== 'undefined') {
    console.log('✅ Найдено в глобальной переменной material_types:');
    console.log(JSON.stringify(material_types, null, 2));
    return material_types;
  }
  
  // Вариант 2: В window
  if (window.material_types) {
    console.log('✅ Найдено в window.material_types:');
    console.log(JSON.stringify(window.material_types, null, 2));
    return window.material_types;
  }
  
  // Вариант 3: В pp.libs.materials
  if (window.pp && window.pp.libs && window.pp.libs.materials) {
    console.log('✅ Найдено в pp.libs.materials (ключи):');
    const keys = Object.keys(window.pp.libs.materials);
    console.log('Ключи материалов:', keys);
    return keys;
  }
  
  console.log('❌ material_types не найдено');
  return null;
}

/**
 * Найти каталоги элементов по типу
 */
function findCatalogsByType(elementType) {
  console.log(`📦 Ищу каталог элементов типа ${elementType}...`);
  
  // Вариант 1: catalogs_by_key
  if (typeof catalogs_by_key !== 'undefined' && catalogs_by_key[elementType]) {
    console.log(`✅ Найдено в catalogs_by_key[${elementType}]:`);
    console.log(JSON.stringify(catalogs_by_key[elementType], null, 2));
    return catalogs_by_key[elementType];
  }
  
  // Вариант 2: В window
  if (window.catalogs_by_key && window.catalogs_by_key[elementType]) {
    console.log(`✅ Найдено в window.catalogs_by_key[${elementType}]:`);
    console.log(JSON.stringify(window.catalogs_by_key[elementType], null, 2));
    return window.catalogs_by_key[elementType];
  }
  
  // Вариант 3: В pp.libs.catalogs
  if (window.pp && window.pp.libs && window.pp.libs.catalogs && window.pp.libs.catalogs[elementType]) {
    console.log(`✅ Найдено в pp.libs.catalogs[${elementType}]:`);
    console.log(JSON.stringify(window.pp.libs.catalogs[elementType], null, 2));
    return window.pp.libs.catalogs[elementType];
  }
  
  console.log(`❌ Каталог ${elementType} не найден`);
  return null;
}

/**
 * Найти все доступные глобальные переменные
 */
function findAllGlobalVariables() {
  console.log('🔍 Ищу все глобальные переменные, связанные с каталогом...\n');
  
  const found = {};
  
  // Проверяем window.pp
  if (window.pp) {
    console.log('📦 window.pp найден:');
    console.log('  - pp.libs:', Object.keys(window.pp.libs || {}));
    console.log('  - pp.variables:', Object.keys(window.pp.variables || {}));
    
    if (window.pp.libs) {
      found.pp_libs = Object.keys(window.pp.libs);
    }
    if (window.pp.variables) {
      found.pp_variables = Object.keys(window.pp.variables);
    }
  }
  
  // Ищем все переменные, содержащие ключевые слова
  const keywords = ['modules', 'catalog', 'material', 'default', 'group', 'type'];
  const allVars = Object.keys(window);
  
  keywords.forEach(keyword => {
    const matching = allVars.filter(v => 
      v.toLowerCase().includes(keyword.toLowerCase())
    );
    if (matching.length > 0) {
      found[keyword] = matching;
      console.log(`📦 Переменные с "${keyword}":`, matching);
    }
  });
  
  // Проверяем специфичные переменные
  const specificVars = [
    'modules_groups', 'defaults_data', 'material_types',
    'catalogs_by_key', 'catalogs_keys', 'materials_groups',
    'global_vars', 'catalogs_keys_hash'
  ];
  
  specificVars.forEach(varName => {
    if (typeof window[varName] !== 'undefined') {
      found[varName] = typeof window[varName];
      console.log(`✅ ${varName} найден (тип: ${typeof window[varName]})`);
    }
  });
  
  console.log('\n📊 Найденные переменные:', JSON.stringify(found, null, 2));
  return found;
}

/**
 * Извлечь все данные одним вызовом
 */
function extractAllDataFromConsole() {
  console.log('🚀 Начинаю извлечение всех данных из консоли...\n');
  
  const results = {
    modules_groups: null,
    default_settings: null,
    material_types: null,
    shablony_korpusov: null,
    dveri_shkaf: null,
    shelves: null,
    c32: null,
    c31: null,
    c39: null,
    global_vars: null,
    catalogs_keys: null
  };
  
  // Извлекаем основные данные
  results.modules_groups = findModulesGroups();
  console.log('');
  
  results.default_settings = findDefaultSettings();
  console.log('');
  
  results.material_types = findMaterialTypes();
  console.log('');
  
  // Извлекаем каталоги по типам
  const moduleTypes = ['shablony_korpusov', 'dveri_shkaf', 'shelves', 'c32', 'c31', 'c39'];
  moduleTypes.forEach(type => {
    results[type] = findCatalogsByType(type);
    console.log('');
  });
  
  // Извлекаем глобальные переменные
  if (window.pp && window.pp.variables && window.pp.variables.global_vars) {
    results.global_vars = window.pp.variables.global_vars;
    console.log('✅ global_vars найден в pp.variables.global_vars');
  }
  
  // Извлекаем ключи каталогов
  if (window.pp && window.pp.libs && window.pp.libs.catalogs_info && window.pp.libs.catalogs_info.keys) {
    results.catalogs_keys = window.pp.libs.catalogs_info.keys;
    console.log('✅ catalogs_keys найден в pp.libs.catalogs_info.keys');
  }
  
  console.log('\n✅ Извлечение завершено!');
  console.log('📊 Результаты:', JSON.stringify(results, null, 2));
  
  return results;
}

// Экспортируем функции
window.findModulesGroups = findModulesGroups;
window.findDefaultSettings = findDefaultSettings;
window.findMaterialTypes = findMaterialTypes;
window.findCatalogsByType = findCatalogsByType;
window.findAllGlobalVariables = findAllGlobalVariables;
window.extractAllDataFromConsole = extractAllDataFromConsole;

console.log('✅ Скрипт загружен! Доступные функции:');
console.log('  - findAllGlobalVariables() - найти все переменные');
console.log('  - findModulesGroups() - найти группы модулей');
console.log('  - findDefaultSettings() - найти настройки по умолчанию');
console.log('  - findMaterialTypes() - найти типы материалов');
console.log('  - findCatalogsByType("shablony_korpusov") - найти каталог по типу');
console.log('  - extractAllDataFromConsole() - извлечь все данные');

