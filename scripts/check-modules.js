import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'db.json');

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

console.log('📦 Проверка модулей в БД:\n');
console.log(`Всего элементов в catalog_items: ${db.catalog_items?.length || 0}\n`);

if (db.catalog_items) {
  // Ищем шкафы и антресоли
  const cabinets = db.catalog_items.filter(item => {
    const name = (item.name || '').toLowerCase();
    return name.includes('шкаф') || name.includes('антресоль') || name.includes('antresol');
  });
  
  console.log(`🔍 Найдено шкафов и антресолей: ${cabinets.length}\n`);
  cabinets.forEach(item => {
    console.log(`   - ID: ${item.id}`);
    console.log(`     Название: ${item.name}`);
    console.log(`     Тип: ${item.type || item.elementType || 'нет'}`);
    console.log(`     Clodis JSON: ${item.clodisJSON ? '✅ есть' : '❌ нет'}`);
    console.log('');
  });
  
  // Проверяем конкретные ID, которые запрашивает приложение
  const requestedIds = ['89', '88', '9'];
  console.log('🔍 Проверка запрашиваемых ID (89, 88, 9):\n');
  
  requestedIds.forEach(id => {
    const found = db.catalog_items.find(item => item.id === id);
    if (found) {
      console.log(`   ✅ ID ${id}: НАЙДЕН - "${found.name}"`);
      console.log(`      Тип: ${found.type || found.elementType || 'нет'}`);
      console.log(`      Clodis JSON: ${found.clodisJSON ? '✅ есть' : '❌ нет'}`);
    } else {
      console.log(`   ❌ ID ${id}: НЕ НАЙДЕН в catalog_items`);
    }
    console.log('');
  });
  
  // Показываем все ID в базе
  console.log('📋 Все ID в catalog_items:');
  db.catalog_items.forEach(item => {
    console.log(`   - ID: ${item.id} | Название: ${item.name || 'нет'}`);
  });
}

