import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'db.json');

console.log('🔧 Исправление структуры db.json...');

let content = fs.readFileSync(DB_FILE, 'utf8');

// Удаляем ,"count":60} в конце
content = content.replace(/,"count":\d+\}$/, '}');

// Находим начало массива catalog_items
const catalogItemsStart = content.indexOf('"catalog_items": [');
if (catalogItemsStart === -1) {
  console.error('❌ Не найдено поле "catalog_items"');
  process.exit(1);
}

// Находим начало массива после [
const arrayStart = content.indexOf('[', catalogItemsStart) + 1;
const arrayContent = content.substring(arrayStart);

// Проверяем, начинается ли массив с {"items":[
if (arrayContent.trim().startsWith('{"items":[')) {
  console.log('⚠️ Обнаружен вложенный объект {"items":[...]}, извлекаю массив...');
  
  // Находим начало массива items
  const itemsArrayStart = arrayContent.indexOf('[') + 1;
  // Находим конец массива items (перед ],"count":)
  const itemsArrayEnd = arrayContent.lastIndexOf('],"count":') || arrayContent.lastIndexOf(']');
  
  // Извлекаем массив items
  const itemsArray = arrayContent.substring(itemsArrayStart, itemsArrayEnd);
  
  // Заменяем весь catalog_items на правильный массив
  const beforeCatalog = content.substring(0, arrayStart);
  const afterCatalog = content.substring(arrayStart + arrayContent.length);
  
  // Находим где заканчивается catalog_items
  const catalogItemsEnd = content.indexOf(']', arrayStart);
  const afterCatalogItems = content.substring(catalogItemsEnd + 1);
  
  // Собираем новый контент
  content = beforeCatalog + itemsArray + ']' + afterCatalogItems;
  
  // Удаляем ,"count":60} если осталось
  content = content.replace(/,"count":\d+\}$/, '}');
  
  fs.writeFileSync(DB_FILE, content, 'utf8');
  console.log('✅ Структура исправлена!');
}

// Проверяем результат
try {
  const db = JSON.parse(content);
  console.log(`✅ JSON валиден!`);
  console.log(`   - catalog_items: ${db.catalog_items?.length || 0} элементов`);
  
  if (db.catalog_items && db.catalog_items.length > 0) {
    console.log(`\n📋 Первые 3 элемента:`);
    db.catalog_items.slice(0, 3).forEach((item, i) => {
      console.log(`   ${i + 1}. ID: ${item.id}, Название: ${item.name || 'нет'}, Тип: ${item.type || item.element_type || 'нет'}`);
    });
  }
} catch (e) {
  console.error('❌ Ошибка парсинга JSON:', e.message);
  process.exit(1);
}

