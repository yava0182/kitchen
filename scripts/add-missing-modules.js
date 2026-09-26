import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'db.json');

console.log('🔧 Добавление отсутствующих модулей в БД...\n');

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

// Создаем заглушки для отсутствующих модулей
const missingModules = [
  {
    id: '89',
    name: 'Шаблон корпуса 89',
    type: 'shablony_korpusov',
    elementType: 'shablony_korpusov',
    catalogCategory: 'shablony_korpusov',
    metadata: {
      name: 'Шаблон корпуса 89',
      type: 'shablony_korpusov',
      size: { width: 600, height: 2000, depth: 600 },
      createdAt: new Date().toISOString()
    },
    clodisJSON: [{
      type: 'section',
      name: 'Секция',
      size: { x: 's:x', y: 's:y', z: 's:z' },
      pos: { x: 0, y: 0, z: 0 },
      pivot: { x: -1, y: -1, z: -1 },
      children: []
    }]
  },
  {
    id: '88',
    name: 'Шаблон корпуса 88 (антресоль)',
    type: 'shablony_korpusov',
    elementType: 'shablony_korpusov',
    catalogCategory: 'shablony_korpusov',
    metadata: {
      name: 'Шаблон корпуса 88 (антресоль)',
      type: 'shablony_korpusov',
      size: { width: 600, height: 400, depth: 600 },
      createdAt: new Date().toISOString()
    },
    clodisJSON: [{
      type: 'section',
      name: 'Антресоль',
      size: { x: 's:x', y: 's:y', z: 's:z' },
      pos: { x: 0, y: 0, z: 0 },
      pivot: { x: -1, y: -1, z: -1 },
      children: []
    }]
  },
  {
    id: '9',
    name: 'Дверь шкафа',
    type: 'dveri_shkaf',
    elementType: 'dveri_shkaf',
    catalogCategory: 'dveri_shkaf',
    metadata: {
      name: 'Дверь шкафа',
      type: 'dveri_shkaf',
      size: { width: 600, height: 2000, depth: 16 },
      createdAt: new Date().toISOString()
    },
    clodisJSON: [{
      type: 'facade',
      name: 'Дверь',
      size: { x: 's:x', y: 's:y', z: 's:z' },
      pos: { x: 0, y: 0, z: 's:z-16' },
      pivot: { x: -1, y: -1, z: -1 },
      spec: {
        id: '9',
        element_type: 'dveri_shkaf',
        group: 'auto',
        type: 'full'
      }
    }]
  }
];

// Проверяем, какие модули уже есть
const existingIds = db.catalog_items.map(item => item.id);
const toAdd = missingModules.filter(module => !existingIds.includes(module.id));

if (toAdd.length === 0) {
  console.log('✅ Все модули уже есть в БД');
} else {
  console.log(`📦 Добавляю ${toAdd.length} модулей:\n`);
  toAdd.forEach(module => {
    console.log(`   - ID: ${module.id} | ${module.name}`);
    db.catalog_items.push(module);
  });
  
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  console.log(`\n✅ Модули добавлены в БД`);
  console.log(`📊 Теперь в БД: ${db.catalog_items.length} элементов`);
}

