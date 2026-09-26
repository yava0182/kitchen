import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'db.json');

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

console.log('✅ Проверка db.json:\n');
console.log('📦 Структура:');
console.log(`   - catalog_items: ${db.catalog_items?.length || 0} элементов`);
console.log(`   - categories: ${db.categories?.length || 0}`);
console.log(`   - materials_groups: ${db.materials_groups?.length || 0}`);
console.log(`   - material_types: ${db.material_types?.length || 0}`);
console.log(`   - global_vars: ${db.global_vars ? 'есть' : 'нет'}`);
console.log(`   - default_settings: ${db.default_settings?.length || 0}`);
console.log(`   - modules_groups: ${db.modules_groups?.length || 0}`);

if (db.catalog_items && db.catalog_items.length > 0) {
  console.log('\n📋 Первые 5 элементов:');
  db.catalog_items.slice(0, 5).forEach((item, i) => {
    console.log(`   ${i + 1}. ID: ${item.id}`);
    console.log(`      Название: ${item.name}`);
    console.log(`      Тип: ${item.type}`);
    console.log(`      Категория: ${item.catalogCategory || 'нет'}`);
    console.log(`      Clodis JSON: ${item.clodisJSON ? '✅ есть' : '❌ нет'}`);
    console.log('');
  });
  
  // Проверяем типы элементов
  const types = {};
  db.catalog_items.forEach(item => {
    const type = item.type || 'unknown';
    types[type] = (types[type] || 0) + 1;
  });
  
  console.log('📊 Распределение по типам:');
  Object.entries(types).forEach(([type, count]) => {
    console.log(`   - ${type}: ${count} элементов`);
  });
  
  // Проверяем, есть ли шкафы
  const cabinets = db.catalog_items.filter(item => 
    item.type === 'cabinet' || 
    item.elementType === 'cabinet' ||
    (item.name && item.name.toLowerCase().includes('шкаф'))
  );
  
  if (cabinets.length > 0) {
    console.log(`\n✅ Найдено шкафов: ${cabinets.length}`);
  } else {
    console.log(`\n⚠️ Шкафы не найдены (возможно, это модули)`);
  }
  
} else {
  console.log('\n❌ catalog_items пуст или отсутствует!');
}

console.log('\n✅ Проверка завершена');

