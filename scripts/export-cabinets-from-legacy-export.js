/**
 * Скрипт для экспорта данных ШКАФОВ из Clodis
 * 
 * ИНСТРУКЦИЯ:
 * 1. Откройте Clodis в браузере
 * 2. Перейдите в раздел "Шкафы" или откройте каталог шкафов
 * 3. Откройте консоль разработчика (F12)
 * 4. Скопируйте и вставьте весь этот файл в консоль
 * 5. Выполните команду: exportCabinetsToDB()
 * 6. Скопируйте результат и вставьте в db.json
 */

/**
 * Экспорт всех шкафов из Clodis
 */
function exportCabinetsToDB() {
  console.log('🚀 Начинаю экспорт шкафов из Clodis...\n');
  
  // Проверяем доступность pp объекта
  if (typeof pp === 'undefined' || !pp.libs || !pp.libs.catalogs) {
    console.error('❌ Объект pp.libs.catalogs не найден!');
    console.log('💡 Убедитесь, что вы находитесь на странице Clodis с открытым каталогом');
    return null;
  }
  
  // Ищем категорию шкафов
  const catalogKeys = Object.keys(pp.libs.catalogs);
  console.log('📋 Найденные категории каталога:', catalogKeys);
  
  // Возможные названия категории шкафов
  const cabinetKeys = catalogKeys.filter(key => 
    key.toLowerCase().includes('cabinet') || 
    key.toLowerCase().includes('шкаф') ||
    key === 'cabinets' ||
    key === 'catalog_cabinets'
  );
  
  if (cabinetKeys.length === 0) {
    console.log('⚠️ Категория шкафов не найдена автоматически');
    console.log('💡 Попробуйте найти вручную. Выполните:');
    console.log('   inspectCatalog("название_категории")');
    console.log('\n📋 Доступные категории:');
    catalogKeys.forEach(key => console.log(`   - ${key}`));
    return null;
  }
  
  console.log(`✅ Найдена категория шкафов: ${cabinetKeys.join(', ')}\n`);
  
  const allCabinets = [];
  
  // Обрабатываем каждую найденную категорию шкафов
  for (const catalogKey of cabinetKeys) {
    try {
      const catalog = pp.libs.catalogs[catalogKey];
      
      if (!catalog) {
        console.warn(`⚠️ Категория ${catalogKey} не найдена`);
        continue;
      }
      
      // Пытаемся найти элементы в разных структурах
      let items = [];
      
      if (catalog.items && Array.isArray(catalog.items)) {
        items = catalog.items;
      } else if (catalog.data && Array.isArray(catalog.data)) {
        items = catalog.data;
      } else if (catalog.modules && Array.isArray(catalog.modules)) {
        items = catalog.modules;
      } else if (typeof catalog.getAllItems === 'function') {
        items = catalog.getAllItems();
      } else {
        console.warn(`⚠️ Не удалось найти элементы в категории ${catalogKey}`);
        console.log('   Структура категории:', Object.keys(catalog));
        continue;
      }
      
      console.log(`📂 Обрабатываю категорию "${catalogKey}": ${items.length} элементов`);
      
      // Обрабатываем каждый элемент
      for (const item of items) {
        try {
          // Извлекаем данные
          let clodisJSON = null;
          let itemData = item.data || item.params || item;
          
          // Если data это строка, парсим её
          if (typeof itemData === 'string') {
            try {
              itemData = JSON.parse(itemData);
            } catch (e) {
              console.warn(`⚠️ Не удалось распарсить data для элемента ${item.id || 'unknown'}:`, e.message);
              continue;
            }
          }
          
          // Формируем clodisJSON
          if (itemData) {
            if (itemData.params) {
              clodisJSON = Array.isArray(itemData.params) ? itemData.params : [itemData.params];
            } else if (Array.isArray(itemData)) {
              clodisJSON = itemData;
            } else if (typeof itemData === 'object') {
              clodisJSON = [itemData];
            }
          }
          
          // Формируем объект для каталога
          const catalogItem = {
            id: String(item.id || item._id || `cabinet_${allCabinets.length}`),
            name: item.name || item.title || `Шкаф ${allCabinets.length + 1}`,
            type: item.type || 'cabinet',
            elementType: item.element_type || item.elementType || 'cabinet',
            catalogCategory: catalogKey,
            metadata: {
              name: item.name || item.title || `Шкаф ${allCabinets.length + 1}`,
              type: item.type || 'cabinet',
              code: item.code || null,
              category: item.category || null,
              cabinet_tag: item.cabinet_tag || null,
              catalog_type: item.catalog_type || null,
              size: item.size || { width: 600, height: 2000, depth: 500 },
              createdAt: new Date().toISOString(),
              element_type: item.element_type || item.elementType || 'cabinet'
            },
            clodisJSON: clodisJSON
          };
          
          allCabinets.push(catalogItem);
          
        } catch (itemError) {
          console.error(`❌ Ошибка обработки элемента в категории ${catalogKey}:`, itemError);
        }
      }
      
      console.log(`✅ Категория "${catalogKey}" обработана: ${allCabinets.length} элементов\n`);
      
    } catch (error) {
      console.error(`❌ Ошибка обработки категории ${catalogKey}:`, error);
    }
  }
  
  if (allCabinets.length === 0) {
    console.log('❌ Не удалось найти шкафы');
    console.log('💡 Попробуйте:');
    console.log('   1. Убедитесь, что каталог шкафов открыт');
    console.log('   2. Проверьте доступные категории: Object.keys(pp.libs.catalogs)');
    console.log('   3. Используйте: inspectCatalog("название_категории")');
    return null;
  }
  
  console.log(`\n✅ Экспортировано шкафов: ${allCabinets.length}`);
  console.log('\n📋 JSON для вставки в db.json:');
  const jsonOutput = JSON.stringify(allCabinets, null, 2);
  console.log(jsonOutput);
  
  // Копируем в буфер обмена
  if (navigator.clipboard) {
    navigator.clipboard.writeText(jsonOutput).then(() => {
      console.log('\n✅ ✅ ✅ JSON скопирован в буфер обмена!');
      console.log('📝 Теперь вставьте его в файл db.json в массив "catalog_items"');
    }).catch(err => {
      console.log('⚠️ Не удалось скопировать автоматически');
      console.log('📋 Скопируйте JSON вручную из консоли выше');
    });
  } else {
    console.log('\n📋 Скопируйте JSON вручную из консоли выше');
  }
  
  // Сохраняем в глобальную переменную
  window.exportedCabinetsData = allCabinets;
  
  return allCabinets;
}

/**
 * Проверка структуры категории
 */
function inspectCatalog(catalogKey) {
  if (typeof pp === 'undefined' || !pp.libs || !pp.libs.catalogs) {
    console.error('❌ Объект pp.libs.catalogs не найден!');
    return;
  }
  
  const catalog = pp.libs.catalogs[catalogKey];
  
  if (!catalog) {
    console.error(`❌ Категория "${catalogKey}" не найдена`);
    console.log('📋 Доступные категории:', Object.keys(pp.libs.catalogs));
    return;
  }
  
  console.log(`\n📂 Структура категории "${catalogKey}":`);
  console.log('Ключи:', Object.keys(catalog));
  
  if (catalog.items) {
    console.log(`\n📦 Элементов в catalog.items: ${catalog.items.length}`);
    if (catalog.items.length > 0) {
      console.log('Пример первого элемента:', catalog.items[0]);
    }
  }
  
  if (catalog.data) {
    console.log(`\n📦 Элементов в catalog.data: ${Array.isArray(catalog.data) ? catalog.data.length : 'не массив'}`);
  }
  
  if (catalog.modules) {
    console.log(`\n📦 Элементов в catalog.modules: ${catalog.modules.length}`);
  }
}

/**
 * Быстрый экспорт - если знаете точное название категории
 */
function quickExportCabinets(catalogKey = 'cabinets') {
  console.log(`🚀 Быстрый экспорт из категории "${catalogKey}"...\n`);
  return exportCabinetsToDB();
}

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ЭКСПОРТ ШКАФОВ ИЗ Clodis                                 ║
╚══════════════════════════════════════════════════════════════╝

📋 ИНСТРУКЦИЯ:

1. Убедитесь, что вы на странице Clodis с открытым каталогом
2. Выполните: exportCabinetsToDB()

Или если знаете название категории:
   quickExportCabinets('название_категории')

Для проверки структуры категории:
   inspectCatalog('название_категории')

🚀 НАЧНИТЕ С: exportCabinetsToDB()
`);

