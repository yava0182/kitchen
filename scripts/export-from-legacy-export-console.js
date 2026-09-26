/**
 * Команды для выполнения в консоли браузера Clodis
 * Скопируйте и выполните эти команды по одной
 */

// 1. Проверка наличия каталога
console.log('Проверка каталогов:', Object.keys(pp.libs.catalogs || {}));

// 2. Получение модулей типа "shablony_korpusov" (используйте другое имя переменной)
const korpusModules = pp.libs.catalogs.shablony_korpusov?.items || [];
console.log('Модули корпусной мебели:', korpusModules.length);
console.log(JSON.stringify(korpusModules, null, 2));

// 3. Получение модулей типа "dveri_shkaf" (двери)
const dveriModules = pp.libs.catalogs.dveri_shkaf?.items || [];
console.log('Модули дверей:', dveriModules.length);
console.log(JSON.stringify(dveriModules, null, 2));

// 4. Получение конкретного модуля по ID (например, 89, 88, 9)
function getModuleById(id) {
  // Ищем во всех каталогах
  for (const catalogKey in pp.libs.catalogs) {
    const catalog = pp.libs.catalogs[catalogKey];
    if (catalog && catalog.items) {
      const module = catalog.items.find(item => String(item.id) === String(id));
      if (module) {
        console.log(`Модуль ${id} найден в каталоге ${catalogKey}:`, module);
        return module;
      }
    }
  }
  console.log(`Модуль ${id} не найден`);
  return null;
}

// 5. Экспорт всех модулей в удобном формате
function exportAllModules() {
  const allModules = [];
  
  for (const catalogKey in pp.libs.catalogs) {
    const catalog = pp.libs.catalogs[catalogKey];
    if (catalog && catalog.items) {
      catalog.items.forEach(item => {
        allModules.push({
          id: item.id,
          name: item.name,
          catalogKey: catalogKey,
          data: item.data || item.params || item
        });
      });
    }
  }
  
  console.log('Всего модулей:', allModules.length);
  console.log('JSON для экспорта:', JSON.stringify(allModules, null, 2));
  
  // Сохранить в буфер обмена (если поддерживается)
  if (navigator.clipboard) {
    navigator.clipboard.writeText(JSON.stringify(allModules, null, 2))
      .then(() => console.log('✅ Скопировано в буфер обмена!'))
      .catch(err => console.error('Ошибка копирования:', err));
  }
  
  return allModules;
}

// 6. Экспорт конкретных модулей по ID
function exportModulesByIds(ids) {
  const modules = [];
  
  for (const id of ids) {
    const module = getModuleById(id);
    if (module) {
      // Парсим data если это строка
      let clodisJSON = null;
      if (module.data) {
        try {
          const parsed = typeof module.data === 'string' ? JSON.parse(module.data) : module.data;
          clodisJSON = parsed.params ? [parsed.params] : (Array.isArray(parsed) ? parsed : [parsed]);
        } catch (e) {
          console.warn(`Ошибка парсинга data модуля ${id}:`, e);
        }
      }
      
      modules.push({
        id: String(id),
        name: module.name || `Модуль ${id}`,
        type: module.type || 'section',
        elementType: 'section',
        metadata: {
          name: module.name || `Модуль ${id}`,
          type: module.type || 'section',
          size: { width: 600, height: 720, depth: 300 },
          createdAt: new Date().toISOString(),
          element_type: module.element_type || null
        },
        clodisJSON: clodisJSON
      });
    }
  }
  
  console.log('Экспортировано модулей:', modules.length);
  console.log('JSON для сохранения:', JSON.stringify(modules, null, 2));
  
  // Сохранить в буфер обмена
  if (navigator.clipboard) {
    navigator.clipboard.writeText(JSON.stringify(modules, null, 2))
      .then(() => console.log('✅ Скопировано в буфер обмена!'))
      .catch(err => console.error('Ошибка копирования:', err));
  }
  
  return modules;
}

// Выполните эту команду для экспорта нужных модулей:
// exportModulesByIds(['89', '88', '9']);


