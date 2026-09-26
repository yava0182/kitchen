/**
 * Скрипт для извлечения данных из Clodis через API
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * 1. Откройте консоль браузера на сайте Clodis (например, /constructor/)
 * 2. Скопируйте и вставьте этот скрипт
 * 3. Выполните функции для извлечения нужных данных
 */

// Базовый URL Clodis (измените на ваш)
const BASE_URL = window.location.origin;

/**
 * Извлечь default_settings
 */
async function extractDefaultSettings() {
  try {
    const response = await fetch(`${BASE_URL}/catalog/items_get/default_settings`);
    const data = await response.json();
    console.log('📦 default_settings:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Ошибка извлечения default_settings:', error);
    return null;
  }
}

/**
 * Извлечь modules_groups
 */
async function extractModulesGroups() {
  try {
    const response = await fetch(`${BASE_URL}/catalog/items_get/modules_groups`);
    const data = await response.json();
    console.log('📦 modules_groups:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Ошибка извлечения modules_groups:', error);
    return null;
  }
}

/**
 * Извлечь material_types
 */
async function extractMaterialTypes() {
  try {
    const response = await fetch(`${BASE_URL}/catalog/items_get/material_types`);
    const data = await response.json();
    console.log('📦 material_types:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Ошибка извлечения material_types:', error);
    return null;
  }
}

/**
 * Извлечь все данные через get_all_data_for_catalog_item
 */
async function extractAllCatalogData() {
  try {
    const response = await fetch(`${BASE_URL}/catalog/get_all_data_for_catalog_item/1`);
    const data = await response.json();
    console.log('📦 Все данные каталога:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Ошибка извлечения всех данных:', error);
    return null;
  }
}

/**
 * Извлечь модули по element_type
 * @param {string} elementType - Тип элемента (например, "shablony_korpusov", "dveri_shkaf", "shelves")
 */
async function extractModulesByType(elementType) {
  try {
    // Сначала получаем список всех элементов
    const listResponse = await fetch(`${BASE_URL}/catalog/items_list/${elementType}`);
    const listData = await listResponse.json();
    
    if (!listData.items || !Array.isArray(listData.items)) {
      console.warn(`⚠️ Нет элементов типа ${elementType}`);
      return [];
    }
    
    console.log(`📋 Найдено ${listData.items.length} элементов типа ${elementType}`);
    
    // Загружаем детали каждого элемента
    const modules = [];
    for (const item of listData.items) {
      try {
        const itemResponse = await fetch(`${BASE_URL}/catalog/items_get/${item.id}`);
        const itemData = await itemResponse.json();
        if (itemData.item) {
          modules.push(itemData.item);
          console.log(`✅ Загружен модуль ${item.id}: ${item.name}`);
        }
      } catch (err) {
        console.warn(`⚠️ Ошибка загрузки модуля ${item.id}:`, err);
      }
    }
    
    console.log(`📦 Всего загружено ${modules.length} модулей типа ${elementType}:`, JSON.stringify(modules, null, 2));
    return modules;
  } catch (error) {
    console.error(`❌ Ошибка извлечения модулей типа ${elementType}:`, error);
    return [];
  }
}

/**
 * Извлечь все критичные данные одним вызовом
 */
async function extractAllCriticalData() {
  console.log('🚀 Начинаю извлечение всех критичных данных...\n');
  
  const results = {
    default_settings: null,
    modules_groups: null,
    material_types: null,
    shablony_korpusov: [],
    dveri_shkaf: [],
    shelves: [],
    c32: [],
    c31: [],
    c39: []
  };
  
  // Извлекаем настройки и группы
  console.log('📦 Извлекаю default_settings...');
  results.default_settings = await extractDefaultSettings();
  
  console.log('\n📦 Извлекаю modules_groups...');
  results.modules_groups = await extractModulesGroups();
  
  console.log('\n📦 Извлекаю material_types...');
  results.material_types = await extractMaterialTypes();
  
  // Извлекаем модули по типам
  const moduleTypes = ['shablony_korpusov', 'dveri_shkaf', 'shelves', 'c32', 'c31', 'c39'];
  
  for (const type of moduleTypes) {
    console.log(`\n📦 Извлекаю модули типа ${type}...`);
    results[type] = await extractModulesByType(type);
  }
  
  console.log('\n✅ Извлечение завершено!');
  console.log('📊 Результаты:', JSON.stringify(results, null, 2));
  
  return results;
}

// Экспортируем функции в глобальную область
window.extractDefaultSettings = extractDefaultSettings;
window.extractModulesGroups = extractModulesGroups;
window.extractMaterialTypes = extractMaterialTypes;
window.extractAllCatalogData = extractAllCatalogData;
window.extractModulesByType = extractModulesByType;
window.extractAllCriticalData = extractAllCriticalData;

console.log('✅ Скрипт загружен! Доступные функции:');
console.log('  - extractDefaultSettings()');
console.log('  - extractModulesGroups()');
console.log('  - extractMaterialTypes()');
console.log('  - extractAllCatalogData()');
console.log('  - extractModulesByType("shablony_korpusov")');
console.log('  - extractAllCriticalData() - извлечет все критичные данные');

