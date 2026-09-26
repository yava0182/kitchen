/**
 * Скрипт для добавления извлеченных данных в db.json
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * node scripts/add-missing-data-to-db.js clodis-missing-data.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Получаем путь к файлу с данными
const dataFile = process.argv[2] || path.join(projectRoot, 'clodis-missing-data.json');
const dbFile = path.join(projectRoot, 'db.json');

console.log('📦 Добавление недостающих данных в db.json...\n');

// Читаем файл с данными
if (!fs.existsSync(dataFile)) {
  console.error(`❌ Файл ${dataFile} не найден!`);
  console.log('\n💡 ИСПОЛЬЗОВАНИЕ:');
  console.log('   node scripts/add-missing-data-to-db.js <путь-к-файлу-с-данными.json>');
  console.log('\n   Или поместите файл clodis-missing-data.json в корень проекта');
  process.exit(1);
}

let missingData;
try {
  const dataContent = fs.readFileSync(dataFile, 'utf8');
  missingData = JSON.parse(dataContent);
  console.log('✅ Файл с данными прочитан');
} catch (error) {
  console.error(`❌ Ошибка чтения файла ${dataFile}:`, error.message);
  process.exit(1);
}

// Читаем db.json
let db;
try {
  const dbContent = fs.readFileSync(dbFile, 'utf8');
  db = JSON.parse(dbContent);
  console.log('✅ db.json прочитан');
} catch (error) {
  console.error(`❌ Ошибка чтения db.json:`, error.message);
  process.exit(1);
}

// Инициализируем поля, если их нет
if (!db.modules_groups) {
  db.modules_groups = [];
}
if (!db.default_settings) {
  db.default_settings = [];
}
if (!db.material_types) {
  db.material_types = [];
}

let addedCount = 0;

// Добавляем modules_groups
if (missingData.modules_groups) {
  const data = missingData.modules_groups;
  
  // Если это ответ от API (с полем result и item)
  if (data.result === 'success' && data.item) {
    const item = data.item;
    // Если data - это строка JSON, парсим её
    let parsedData = null;
    if (typeof item.data === 'string') {
      try {
        parsedData = JSON.parse(item.data);
      } catch (e) {
        console.warn('⚠️ Не удалось распарсить item.data');
      }
    } else {
      parsedData = item.data;
    }
    
    // Если parsedData содержит params (формат Clodis)
    if (parsedData && parsedData.params) {
      db.modules_groups = parsedData.params;
      console.log(`✅ modules_groups добавлен (${parsedData.params.length} элементов)`);
      addedCount++;
    } else if (Array.isArray(parsedData)) {
      db.modules_groups = parsedData;
      console.log(`✅ modules_groups добавлен (${parsedData.length} элементов)`);
      addedCount++;
    } else {
      // Сохраняем как есть
      db.modules_groups = [item];
      console.log(`✅ modules_groups добавлен (1 элемент)`);
      addedCount++;
    }
  } else if (Array.isArray(data)) {
    db.modules_groups = data;
    console.log(`✅ modules_groups добавлен (${data.length} элементов)`);
    addedCount++;
  } else {
    db.modules_groups = [data];
    console.log(`✅ modules_groups добавлен (1 элемент)`);
    addedCount++;
  }
}

// Добавляем default_settings
if (missingData.default_settings) {
  const data = missingData.default_settings;
  
  if (data.result === 'success' && data.item) {
    const item = data.item;
    let parsedData = null;
    if (typeof item.data === 'string') {
      try {
        parsedData = JSON.parse(item.data);
      } catch (e) {
        console.warn('⚠️ Не удалось распарсить item.data');
      }
    } else {
      parsedData = item.data;
    }
    
    if (parsedData && parsedData.params) {
      db.default_settings = parsedData.params;
      console.log(`✅ default_settings добавлен (${parsedData.params.length} элементов)`);
      addedCount++;
    } else if (Array.isArray(parsedData)) {
      db.default_settings = parsedData;
      console.log(`✅ default_settings добавлен (${parsedData.length} элементов)`);
      addedCount++;
    } else {
      db.default_settings = [item];
      console.log(`✅ default_settings добавлен (1 элемент)`);
      addedCount++;
    }
  } else if (Array.isArray(data)) {
    db.default_settings = data;
    console.log(`✅ default_settings добавлен (${data.length} элементов)`);
    addedCount++;
  } else {
    db.default_settings = [data];
    console.log(`✅ default_settings добавлен (1 элемент)`);
    addedCount++;
  }
}

// Добавляем material_types
if (missingData.material_types) {
  const data = missingData.material_types;
  
  if (data.result === 'success' && data.item) {
    const item = data.item;
    let parsedData = null;
    if (typeof item.data === 'string') {
      try {
        parsedData = JSON.parse(item.data);
      } catch (e) {
        console.warn('⚠️ Не удалось распарсить item.data');
      }
    } else {
      parsedData = item.data;
    }
    
    if (parsedData && parsedData.params) {
      db.material_types = parsedData.params;
      console.log(`✅ material_types добавлен (${parsedData.params.length} элементов)`);
      addedCount++;
    } else if (Array.isArray(parsedData)) {
      db.material_types = parsedData;
      console.log(`✅ material_types добавлен (${parsedData.length} элементов)`);
      addedCount++;
    } else {
      db.material_types = [item];
      console.log(`✅ material_types добавлен (1 элемент)`);
      addedCount++;
    }
  } else if (Array.isArray(data)) {
    db.material_types = data;
    console.log(`✅ material_types добавлен (${data.length} элементов)`);
    addedCount++;
  } else {
    db.material_types = [data];
    console.log(`✅ material_types добавлен (1 элемент)`);
    addedCount++;
  }
}

// Добавляем каталоги по типам в catalog_items
if (missingData.catalogs_by_type && Object.keys(missingData.catalogs_by_type).length > 0) {
  console.log('\n📋 Добавление каталогов по типам в catalog_items...');
  
  if (!db.catalog_items) {
    db.catalog_items = [];
  }
  
  let catalogItemsAdded = 0;
  
  Object.keys(missingData.catalogs_by_type).forEach(type => {
    const catalogData = missingData.catalogs_by_type[type];
    
    if (catalogData && catalogData.items && Array.isArray(catalogData.items)) {
      catalogData.items.forEach(item => {
        // Проверяем, нет ли уже такого элемента
        const exists = db.catalog_items.some(existing => existing.id === item.id);
        
        if (!exists) {
          // Конвертируем в формат db.json
          const dbItem = {
            id: item.id,
            name: item.name || '',
            type: item.element_type || type,
            elementType: item.element_type || type,
            catalogCategory: item.catalog_type || type,
            metadata: {
              name: item.name || '',
              type: item.element_type || type,
              code: item.code || null,
              category: item.category ? JSON.stringify(item.category) : '[]',
              cabinet_tag: item.cabinet_tag || null,
              catalog_type: item.catalog_type || null,
              icon: item.icon || '',
              createdAt: item.created_at || new Date().toISOString(),
              element_type: item.element_type || type
            },
            clodisJSON: null
          };
          
          // Парсим clodisJSON из item.data
          if (item.data) {
            try {
              const dataObj = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
              if (dataObj && dataObj.params && Array.isArray(dataObj.params)) {
                dbItem.clodisJSON = dataObj.params;
              } else if (Array.isArray(dataObj)) {
                dbItem.clodisJSON = dataObj;
              }
            } catch (e) {
              console.warn(`⚠️ Не удалось распарсить clodisJSON для элемента ${item.id}`);
            }
          }
          
          db.catalog_items.push(dbItem);
          catalogItemsAdded++;
        }
      });
      
      console.log(`  ✅ ${type}: добавлено ${catalogItemsAdded} элементов`);
    }
  });
  
  addedCount += catalogItemsAdded;
}

// Сохраняем db.json
try {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), 'utf8');
  console.log(`\n✅ db.json обновлен!`);
  console.log(`📊 Всего добавлено: ${addedCount} элементов/массивов`);
} catch (error) {
  console.error(`❌ Ошибка сохранения db.json:`, error.message);
  process.exit(1);
}

console.log('\n✅ Готово!');

