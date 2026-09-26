import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'db.json');

/**
 * Вставка шкафов в db.json
 * 
 * Использование:
 * 1. Экспортируйте шкафы из Clodis (exportCabinetsToDB())
 * 2. Сохраните JSON в файл cabinets.json в папке scripts/
 * 3. Выполните: node scripts/insert-cabinets.js
 * 
 * Или передайте JSON напрямую через аргумент:
 * node scripts/insert-cabinets.js 'ВАШ_JSON_ЗДЕСЬ'
 */

const cabinetsFile = path.join(__dirname, 'cabinets.json');

// Проверяем, есть ли файл с шкафами
if (fs.existsSync(cabinetsFile)) {
  console.log('📦 Найден файл cabinets.json, загружаю шкафы...\n');
  
  const cabinetsData = JSON.parse(fs.readFileSync(cabinetsFile, 'utf8'));
  const cabinets = Array.isArray(cabinetsData) ? cabinetsData : cabinetsData.items || [];
  
  // Читаем текущий db.json
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  
  console.log(`📦 Текущее состояние:`);
  console.log(`   - Элементов в catalog_items: ${db.catalog_items?.length || 0}`);
  
  // Заменяем на шкафы
  db.catalog_items = cabinets;
  
  // Сохраняем
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  
  console.log(`\n✅ Заменено на ${cabinets.length} шкафов!`);
  console.log(`\n📋 Шкафы в базе:`);
  cabinets.forEach((cabinet, i) => {
    console.log(`   ${i + 1}. ${cabinet.name} (ID: ${cabinet.id})`);
  });
  
} else {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ВСТАВКА ШКАФОВ В DB.JSON                                   ║
╚══════════════════════════════════════════════════════════════╝

📋 ИНСТРУКЦИЯ:

ВАРИАНТ 1 (Через файл):
1. Экспортируйте шкафы из Clodis (exportCabinetsToDB())
2. Скопируйте JSON из консоли
3. Создайте файл scripts/cabinets.json
4. Вставьте туда скопированный JSON
5. Выполните: node scripts/insert-cabinets.js

ВАРИАНТ 2 (Вручную):
1. Экспортируйте шкафы из Clodis (exportCabinetsToDB())
2. Скопируйте JSON из консоли
3. Откройте db.json
4. Найдите массив "catalog_items"
5. ЗАМЕНИТЕ весь массив на скопированный JSON шкафов
6. Сохраните файл

📝 Пример структуры в db.json:
{
  "catalog_items": [
    {
      "id": "...",
      "name": "Шкаф ...",
      "type": "cabinet",
      "clodisJSON": [...]
    },
    ...
  ],
  "categories": [],
  ...
}

💡 Файл cabinets.json не найден. Создайте его или используйте вариант 2.
`);
}

