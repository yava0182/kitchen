import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'db.json');

console.log('🔄 Преобразование существующих данных в db.json...\n');

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

if (!db.catalog_items || !Array.isArray(db.catalog_items)) {
  console.error('❌ В db.json не найдено поле "catalog_items"');
  process.exit(1);
}

console.log(`📦 Найдено ${db.catalog_items.length} элементов для преобразования\n`);

const convertedItems = [];

for (const item of db.catalog_items) {
  try {
    // Парсим поле data (оно в виде строки JSON)
    let clodisJSON = null;
    if (item.data) {
      try {
        const parsedData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
        
        // Извлекаем Clodis JSON структуру
        if (parsedData.params && parsedData.params.spec) {
          clodisJSON = [parsedData.params];
        } else if (parsedData.params) {
          clodisJSON = [parsedData.params];
        } else if (parsedData.spec) {
          clodisJSON = [parsedData];
        } else {
          clodisJSON = [parsedData];
        }
      } catch (e) {
        console.warn(`⚠️ Ошибка парсинга data для модуля ${item.id}:`, e.message);
      }
    }

    const catalogItem = {
      id: String(item.id),
      name: item.name || `Элемент ${item.id}`,
      type: item.element_type || 'korpusnaya_mebel',
      elementType: item.element_type || 'korpusnaya_mebel',
      catalogCategory: item.cabinet_tag || 'korpusnaya_mebel',
      metadata: {
        name: item.name || `Элемент ${item.id}`,
        type: item.element_type || 'korpusnaya_mebel',
        code: item.code || null,
        category: item.category || null,
        cabinet_tag: item.cabinet_tag || null,
        catalog_type: item.catalog_type || null,
        size: {
          width: 600,
          height: 2000,
          depth: 600
        },
        createdAt: new Date().toISOString(),
        element_type: item.element_type || null
      },
      clodisJSON: clodisJSON
    };
    
    convertedItems.push(catalogItem);
  } catch (itemError) {
    console.error(`❌ Ошибка обработки элемента ${item.id}:`, itemError.message);
  }
}

// Обновляем db.json
db.catalog_items = convertedItems;
fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');

console.log(`✅ Преобразовано ${convertedItems.length} элементов`);
console.log(`✅ Данные сохранены в db.json\n`);

// Показываем статистику
const types = {};
convertedItems.forEach(item => {
  const type = item.type || 'unknown';
  types[type] = (types[type] || 0) + 1;
});

console.log('📊 Распределение по типам:');
Object.entries(types).forEach(([type, count]) => {
  console.log(`   - ${type}: ${count} элементов`);
});

const withClodis = convertedItems.filter(item => item.clodisJSON && item.clodisJSON.length > 0).length;
console.log(`\n✅ Элементов с Clodis JSON: ${withClodis} из ${convertedItems.length}`);

