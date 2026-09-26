import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'db.json');

console.log('🔄 Замена модулей на шкафы в db.json...\n');

// Читаем текущий db.json
const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

console.log(`📦 Текущее состояние:`);
console.log(`   - Модулей в catalog_items: ${db.catalog_items?.length || 0}`);

if (db.catalog_items && db.catalog_items.length > 0) {
  console.log(`\n⚠️ ВНИМАНИЕ: Сейчас в базе есть модули:`);
  db.catalog_items.forEach((item, i) => {
    console.log(`   ${i + 1}. ${item.name} (ID: ${item.id})`);
  });
}

console.log(`
📋 ИНСТРУКЦИЯ ПО ЗАМЕНЕ НА ШКАФЫ:

1. Откройте Clodis в браузере
2. Перейдите в раздел "Шкафы"
3. Откройте консоль (F12)
4. Скопируйте и вставьте скрипт: scripts/export-cabinets-from-clodis.js
5. Выполните: exportCabinetsToDB()
6. Скопируйте полученный JSON

7. Затем выполните:
   node scripts/insert-cabinets.js

Или вручную:
   - Откройте db.json
   - Замените массив "catalog_items" на скопированный JSON шкафов
   - Сохраните файл

💡 Скрипт insert-cabinets.js будет создан после экспорта шкафов.
`);

