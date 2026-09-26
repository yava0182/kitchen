/**
 * Скрипт для экспорта ВСЕЙ базы данных каталога из Clodis
 * 
 * ИНСТРУКЦИЯ:
 * 1. Откройте Clodis в браузере
 * 2. Откройте консоль разработчика (F12)
 * 3. Скопируйте и вставьте весь этот файл в консоль
 * 4. Выполните команду: exportAllCatalogToDB()
 * 5. Дождитесь завершения (может занять несколько минут)
 * 6. Скопируйте результат из консоли
 * 7. Вставьте в файл db.json в поле "catalog_items"
 */

/**
 * Экспорт всех элементов из всех категорий каталога
 */
function exportAllCatalogToDB() {
  console.log('🚀 Начинаю экспорт всей базы данных каталога...');
  console.log('⏳ Это может занять несколько минут, пожалуйста подождите...');
  
  const allCatalogItems = [];
  const categories = Object.keys(pp.libs.catalogs || {});
  
  console.log(`📦 Найдено категорий: ${categories.length}`);
  console.log('📋 Категории:', categories);
  
  let totalItems = 0;
  let processedCategories = 0;
  
  // Обходим все категории
  for (const catalogKey of categories) {
    try {
      const catalog = pp.libs.catalogs[catalogKey];
      
      if (!catalog) {
        console.warn(`⚠️ Категория ${catalogKey} не найдена`);
        continue;
      }
      
      // Проверяем разные возможные структуры
      const items = catalog.items || catalog.data || catalog.modules || [];
      
      if (!Array.isArray(items) || items.length === 0) {
        console.log(`⏭️ Категория ${catalogKey}: элементов нет`);
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
              // Если не JSON, оставляем как есть
              console.warn(`⚠️ Не удалось распарсить data для элемента ${item.id || 'unknown'}:`, e.message);
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
            id: String(item.id || item._id || `unknown_${totalItems}`),
            name: item.name || item.title || `Элемент ${catalogKey}_${totalItems}`,
            type: item.type || catalogKey,
            elementType: item.element_type || item.elementType || 'section',
            catalogCategory: catalogKey,
            metadata: {
              name: item.name || item.title || `Элемент ${catalogKey}_${totalItems}`,
              type: item.type || catalogKey,
              size: item.size || { width: 600, height: 720, depth: 300 },
              createdAt: new Date().toISOString(),
              element_type: item.element_type || item.elementType || null,
              description: item.description || null
            },
            clodisJSON: clodisJSON
          };
          
          allCatalogItems.push(catalogItem);
          totalItems++;
          
        } catch (itemError) {
          console.error(`❌ Ошибка обработки элемента в категории ${catalogKey}:`, itemError);
        }
      }
      
      processedCategories++;
      console.log(`✅ Категория "${catalogKey}" обработана: ${items.length} элементов`);
      
    } catch (categoryError) {
      console.error(`❌ Ошибка обработки категории ${catalogKey}:`, categoryError);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 РЕЗУЛЬТАТЫ ЭКСПОРТА:');
  console.log('='.repeat(60));
  console.log(`✅ Обработано категорий: ${processedCategories} из ${categories.length}`);
  console.log(`✅ Всего элементов экспортировано: ${totalItems}`);
  console.log('\n📋 JSON для вставки в db.json (поле "catalog_items"):');
  console.log('='.repeat(60));
  
  // Выводим JSON
  const jsonOutput = JSON.stringify(allCatalogItems, null, 2);
  console.log(jsonOutput);
  
  // Пытаемся скопировать в буфер обмена
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(jsonOutput)
      .then(() => {
        console.log('\n✅ ✅ ✅ JSON скопирован в буфер обмена!');
        console.log('📝 Теперь вставьте его в файл db.json в поле "catalog_items"');
      })
      .catch(err => {
        console.warn('⚠️ Не удалось скопировать в буфер обмена:', err);
        console.log('📋 Скопируйте JSON вручную из консоли выше');
      });
  } else {
    console.log('\n📋 Скопируйте JSON вручную из консоли выше');
  }
  
  // Также сохраняем в глобальную переменную для удобства
  window.exportedCatalogData = allCatalogItems;
  console.log('\n💾 Данные также сохранены в window.exportedCatalogData');
  
  return allCatalogItems;
}

/**
 * Экспорт только конкретных категорий (для тестирования)
 */
function exportCategories(categoryNames) {
  console.log(`🚀 Экспорт категорий: ${categoryNames.join(', ')}`);
  
  const allCatalogItems = [];
  
  for (const catalogKey of categoryNames) {
    const catalog = pp.libs.catalogs[catalogKey];
    if (!catalog) {
      console.warn(`⚠️ Категория ${catalogKey} не найдена`);
      continue;
    }
    
    const items = catalog.items || catalog.data || catalog.modules || [];
    console.log(`📂 Категория "${catalogKey}": ${items.length} элементов`);
    
    for (const item of items) {
      let clodisJSON = null;
      let itemData = item.data || item.params || item;
      
      if (typeof itemData === 'string') {
        try {
          itemData = JSON.parse(itemData);
        } catch (e) {
          console.warn(`⚠️ Ошибка парсинга для ${item.id}:`, e.message);
        }
      }
      
      if (itemData) {
        if (itemData.params) {
          clodisJSON = Array.isArray(itemData.params) ? itemData.params : [itemData.params];
        } else if (Array.isArray(itemData)) {
          clodisJSON = itemData;
        } else if (typeof itemData === 'object') {
          clodisJSON = [itemData];
        }
      }
      
      allCatalogItems.push({
        id: String(item.id || `unknown_${allCatalogItems.length}`),
        name: item.name || `Элемент ${catalogKey}`,
        type: item.type || catalogKey,
        elementType: item.element_type || 'section',
        catalogCategory: catalogKey,
        metadata: {
          name: item.name || `Элемент ${catalogKey}`,
          type: item.type || catalogKey,
          size: item.size || { width: 600, height: 720, depth: 300 },
          createdAt: new Date().toISOString(),
          element_type: item.element_type || null
        },
        clodisJSON: clodisJSON
      });
    }
  }
  
  console.log(`✅ Экспортировано: ${allCatalogItems.length} элементов`);
  console.log('JSON:', JSON.stringify(allCatalogItems, null, 2));
  
  return allCatalogItems;
}

/**
 * Проверка структуры каталога (для отладки)
 */
function inspectCatalog(categoryName) {
  const catalog = pp.libs.catalogs[categoryName];
  if (!catalog) {
    console.log(`❌ Категория "${categoryName}" не найдена`);
    return;
  }
  
  console.log(`📂 Структура категории "${categoryName}":`);
  console.log('Ключи:', Object.keys(catalog));
  console.log('Полный объект:', catalog);
  
  if (catalog.items) {
    console.log(`\n📦 Элементов: ${catalog.items.length}`);
    if (catalog.items.length > 0) {
      console.log('Пример первого элемента:', catalog.items[0]);
    }
  }
}

// Инструкции
console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ЭКСПОРТ ВСЕЙ БАЗЫ ДАННЫХ КАТАЛОГА ИЗ Clodis            ║
╚══════════════════════════════════════════════════════════════╝

📋 ДОСТУПНЫЕ КОМАНДЫ:

1. exportAllCatalogToDB()
   → Экспортирует ВСЕ элементы из ВСЕХ категорий
   → Может занять несколько минут
   → Результат будет в консоли и в буфере обмена

2. exportCategories(['module', 'door', 'shelves'])
   → Экспортирует только указанные категории
   → Полезно для тестирования

3. inspectCatalog('module')
   → Показывает структуру конкретной категории
   → Полезно для отладки

📝 ПОСЛЕ ЭКСПОРТА:
1. Скопируйте JSON из консоли
2. Откройте файл db.json в проекте
3. Вставьте скопированный массив в поле "catalog_items"
4. Сохраните файл

🚀 НАЧНИТЕ С: exportAllCatalogToDB()
`);

