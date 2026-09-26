/**
 * Скрипт для преобразования данных в db.json в правильный формат
 * 
 * Использование:
 * node scripts/fix-db-format.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'db.json');

console.log('🔄 Преобразование db.json в правильный формат...\n');

try {
  // Читаем текущий db.json
  const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  
  // Если данные в неправильном формате (есть "items" вместо "catalog_items")
  if (data.items && !data.catalog_items) {
    console.log(`📦 Найдено ${data.items.length} элементов в поле "items"`);
    
    // Преобразуем каждый элемент
    const catalogItems = data.items.map(item => {
      // Парсим data если это строка
      let clodisJSON = null;
      if (item.data) {
        try {
          const parsed = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
          // Извлекаем params из parsed
          if (parsed.params) {
            clodisJSON = [parsed.params];
          } else {
            clodisJSON = [parsed];
          }
        } catch(e) {
          console.warn(`⚠️ Ошибка парсинга data для модуля ${item.id}:`, e.message);
          clodisJSON = null;
        }
      }
      
      // Формируем объект в правильном формате
      return {
        id: String(item.id),
        name: item.name || `Модуль ${item.id}`,
        type: item.element_type || 'module',
        elementType: item.element_type || 'module',
        catalogCategory: 'module',
        metadata: {
          name: item.name || `Модуль ${item.id}`,
          type: item.element_type || 'module',
          code: item.code || null,
          category: item.category || null,
          cabinet_tag: item.cabinet_tag || null,
          catalog_type: item.catalog_type || null,
          size: {
            width: 600,
            height: 720,
            depth: 300
          },
          createdAt: new Date().toISOString(),
          element_type: item.element_type || null
        },
        clodisJSON: clodisJSON
      };
    });
    
    // Создаем правильную структуру
    const newData = {
      catalog_items: catalogItems,
      categories: data.categories || [],
      materials_groups: data.materials_groups || [],
      material_types: data.material_types || [],
      global_vars: data.global_vars || { value: JSON.stringify([]) },
      default_settings: data.default_settings || [],
      modules_groups: data.modules_groups || []
    };
    
    // Сохраняем обратно
    fs.writeFileSync(DB_FILE, JSON.stringify(newData, null, 2), 'utf8');
    
    console.log(`✅ Преобразовано ${catalogItems.length} элементов`);
    console.log(`✅ Данные сохранены в поле "catalog_items"`);
    console.log(`\n📋 Структура db.json:`);
    console.log(`   - catalog_items: ${catalogItems.length} элементов`);
    console.log(`   - categories: ${newData.categories.length} элементов`);
    console.log(`   - materials_groups: ${newData.materials_groups.length} элементов`);
    console.log(`\n✅ Готово!`);
    
  } else if (data.catalog_items) {
    console.log(`✅ db.json уже в правильном формате`);
    console.log(`   - catalog_items: ${data.catalog_items.length} элементов`);
  } else {
    console.log(`⚠️ Неизвестный формат данных в db.json`);
    console.log(`   Найдены поля:`, Object.keys(data));
  }
  
} catch (error) {
  console.error('❌ Ошибка:', error.message);
  process.exit(1);
}

