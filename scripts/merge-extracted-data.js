/**
 * Скрипт для объединения всех извлеченных файлов в db.json
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * node scripts/merge-extracted-data.js
 * 
 * Требует наличия папки extracted/ с файлами:
 * - modules-groups.json
 * - default-settings.json
 * - material-types.json
 * - shablony-korpusov.json
 * - dveri-shkaf.json
 * - shelves.json
 * - c32.json
 * - c31.json
 * - c39.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const extractedDir = path.join(projectRoot, 'extracted');
const dbFile = path.join(projectRoot, 'db.json');

console.log('📦 Объединение извлеченных данных в db.json...\n');

// Проверяем наличие папки extracted
if (!fs.existsSync(extractedDir)) {
  console.error(`❌ Папка ${extractedDir} не найдена!`);
  console.log('\n💡 Создайте папку extracted/ и сохраните туда все JSON файлы');
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
if (!db.catalog_items) {
  db.catalog_items = [];
}

let addedCount = 0;

/**
 * Читает и парсит JSON файл
 */
function readJSONFile(filename) {
  const filePath = path.join(extractedDir, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Файл ${filename} не найден, пропускаю`);
    return null;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Ошибка чтения ${filename}:`, error.message);
    return null;
  }
}

/**
 * Извлекает данные из ответа API Clodis
 */
function extractDataFromResponse(response) {
  // Если это ответ от API (с полем result и item)
  if (response.result === 'success' && response.item) {
    const item = response.item;
    
    // Если data - это строка JSON, парсим её
    let parsedData = null;
    if (typeof item.data === 'string') {
      try {
        parsedData = JSON.parse(item.data);
      } catch (e) {
        // Если не JSON, возвращаем как есть
        return [item];
      }
    } else {
      parsedData = item.data;
    }
    
    // Если parsedData содержит params (формат Clodis)
    if (parsedData && parsedData.params && Array.isArray(parsedData.params)) {
      return parsedData.params;
    } else if (Array.isArray(parsedData)) {
      return parsedData;
    } else {
      return [item];
    }
  }
  
  // Если это массив, возвращаем как есть
  if (Array.isArray(response)) {
    return response;
  }
  
  // Если это объект с items (список элементов)
  if (response.items && Array.isArray(response.items)) {
    return response.items;
  }
  
  // Иначе возвращаем как массив с одним элементом
  return [response];
}

// 1. modules_groups
console.log('📦 Обработка modules-groups.json...');
const modulesGroupsData = readJSONFile('modules-groups.json');
if (modulesGroupsData) {
  const extracted = extractDataFromResponse(modulesGroupsData);
  if (extracted.length > 0) {
    db.modules_groups = extracted;
    console.log(`✅ modules_groups добавлен (${extracted.length} элементов)`);
    addedCount++;
  }
}

// 2. default_settings
console.log('\n📦 Обработка default-settings.json...');
const defaultSettingsData = readJSONFile('default-settings.json');
if (defaultSettingsData) {
  const extracted = extractDataFromResponse(defaultSettingsData);
  if (extracted.length > 0) {
    db.default_settings = extracted;
    console.log(`✅ default_settings добавлен (${extracted.length} элементов)`);
    addedCount++;
  }
}

// 3. material_types
console.log('\n📦 Обработка material-types.json...');
const materialTypesData = readJSONFile('material-types.json');
if (materialTypesData) {
  const extracted = extractDataFromResponse(materialTypesData);
  if (extracted.length > 0) {
    db.material_types = extracted;
    console.log(`✅ material_types добавлен (${extracted.length} элементов)`);
    addedCount++;
  }
}

// 4. Каталоги по типам
console.log('\n📋 Обработка каталогов по типам...');

const catalogTypes = [
  { file: 'shablony-korpusov.json', type: 'shablony_korpusov' },
  { file: 'dveri-shkaf.json', type: 'dveri_shkaf' },
  { file: 'shelves.json', type: 'shelves' },
  { file: 'c32.json', type: 'c32' },
  { file: 'c31.json', type: 'c31' },
  { file: 'c39.json', type: 'c39' }
];

let catalogItemsAdded = 0;

catalogTypes.forEach(({ file, type }) => {
  console.log(`  📦 Обработка ${file}...`);
  const catalogData = readJSONFile(file);
  
  if (catalogData) {
    // Извлекаем items из ответа
    let items = [];
    
    if (catalogData.items && Array.isArray(catalogData.items)) {
      items = catalogData.items;
    } else if (Array.isArray(catalogData)) {
      items = catalogData;
    } else if (catalogData.result === 'success' && catalogData.items) {
      items = catalogData.items;
    }
    
    if (items.length > 0) {
      items.forEach(item => {
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
              console.warn(`    ⚠️  Не удалось распарсить clodisJSON для элемента ${item.id}`);
            }
          }
          
          db.catalog_items.push(dbItem);
          catalogItemsAdded++;
        }
      });
      
      console.log(`    ✅ ${type}: добавлено ${catalogItemsAdded} новых элементов`);
    } else {
      console.log(`    ⚠️  ${type}: элементы не найдены в файле`);
    }
  }
});

addedCount += catalogItemsAdded;

// Сохраняем db.json
try {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), 'utf8');
  console.log(`\n✅ db.json обновлен!`);
  console.log(`📊 Всего добавлено: ${addedCount} элементов/массивов`);
  console.log(`📋 Новых элементов каталога: ${catalogItemsAdded}`);
} catch (error) {
  console.error(`❌ Ошибка сохранения db.json:`, error.message);
  process.exit(1);
}

console.log('\n✅ Готово!');

