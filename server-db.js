// !!! OBSOLETE — НЕ ЗАПУСКАТЬ, НЕ ПРАВИТЬ !!!
// Канон API кухни: server.js (порт 8101 через server-dev.js).
// Этот файл — старый сервер на :3001, не используется в npm run dev:server.
// Express сервер с сохранением в БД (как в Clodis)
import { createRequire } from 'module';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import multer from 'multer';

const require = createRequire(import.meta.url);
const { hasClodisJSON, readClodisJSON } = require('./server-clodis-json-fields.cjs');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
// Определяем режим: если папка dist существует, считаем что это продакшен
const NODE_ENV = process.env.NODE_ENV || (fs.existsSync(path.join(__dirname, 'dist')) ? 'production' : 'development');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
const upload = multer();
app.use(upload.any());

// ============================================================================
// STATIC FILES (для продакшена - обслуживание собранных файлов)
// ============================================================================
const DIST_DIR = path.join(__dirname, 'dist');
const DATA_DIR = path.join(__dirname, 'public', 'data');

// Обслуживание статических файлов из dist (только в продакшене)
if (NODE_ENV === 'production' && fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  console.log('📦 Обслуживание статических файлов из:', DIST_DIR);
} else {
  // В режиме разработки обслуживаем файлы из корня проекта
  app.use(express.static(__dirname));
  console.log('📦 Обслуживание статических файлов из корня проекта (режим разработки)');
}

// Обслуживание данных из public/data (всегда)
if (fs.existsSync(DATA_DIR)) {
  app.use('/data', express.static(DATA_DIR));
  console.log('📁 Обслуживание данных из:', DATA_DIR);
}

// ============================================================================
// DATABASE CONNECTION (подключите вашу БД: MySQL, PostgreSQL, MongoDB и т.д.)
// ============================================================================

// Пример для MySQL (раскомментируйте и настройте):
/*
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'clodis',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
*/

// Временное решение: JSON файл как "БД" (для разработки)
const DB_FILE = path.join(__dirname, 'db.json');

// Инициализация "БД"
function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      catalog_items: [],
      categories: [],
      materials_groups: [],
      material_types: [],
      global_vars: { value: JSON.stringify([]) },
      default_settings: [],
      modules_groups: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    console.log('✅ Создана файловая "БД":', DB_FILE);
  }
}

initDB();

// Чтение из "БД"
function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Ошибка чтения БД:', error);
    return null;
  }
}

// Запись в "БД"
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('❌ Ошибка записи в БД:', error);
    return false;
  }
}

// ============================================================================
// API ENDPOINTS (как в Clodis)
// ============================================================================

/**
 * Проверка работы сервера
 * GET /
 */
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Сервер работает!',
    port: PORT,
    endpoints: {
      catalog: '/catalog/items_list',
      health: '/api/health'
    }
  });
});

/**
 * Проверка здоровья сервера
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  const db = readDB();
  res.json({
    status: 'ok',
    server: 'running',
    port: PORT,
    database: db ? 'connected' : 'error',
    timestamp: new Date().toISOString()
  });
});

/**
 * Получить список элементов каталога (упрощенный эндпоинт)
 * GET /api/catalog
 */
app.get('/api/catalog', (req, res) => {
  try {
    const db = readDB();
    if (!db) {
      return res.status(500).json({ error: 'Database read error' });
    }

    const items = db.catalog_items || [];
    res.json({
      status: 'ok',
      count: items.length,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type || item.element_type,
        category: item.catalogCategory || item.cabinet_tag,
        hasClodisJSON: hasClodisJSON(item)
      }))
    });
  } catch (error) {
    console.error('❌ Ошибка получения каталога:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Получить все данные для страницы редактирования каталога
 * GET /catalog/get_all_data_for_catalog_item/:materials_from_json?
 */
app.get('/catalog/get_all_data_for_catalog_item/:materials_from_json?', (req, res) => {
  try {
    const db = readDB();
    if (!db) {
      return res.status(500).json({ error: 'Database read error' });
    }

    // Возвращаем все данные для конструктора
    res.json({
      default_settings: db.default_settings || [],
      modules_groups: db.modules_groups || [],
      materials_groups: db.materials_groups || [],
      material_types: db.material_types || [],
      global_vars: db.global_vars || { value: JSON.stringify([]) },
      catalogs_keys: db.catalogs_keys || []
    });
  } catch (error) {
    console.error('❌ Ошибка получения данных каталога:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Сохранить элемент каталога
 * POST /catalog/items_save/:id
 */
app.post('/catalog/items_save/:id', (req, res) => {
  try {
    const db = readDB();
    if (!db) {
      return res.status(500).json({ result: 'error', error: 'Database read error' });
    }

    // Извлекаем данные из FormData
    const elementId = req.params.id || '0';
    const isNew = elementId === '0';
    
    // Парсим данные (как в Clodis)
    let itemData = {};
    
    // Получаем все поля из FormData
    for (const key in req.body) {
      if (key === 'category' && typeof req.body[key] === 'string') {
        itemData[key] = JSON.parse(req.body[key]);
      } else if (key === 'data' && typeof req.body[key] === 'string') {
        itemData[key] = JSON.parse(req.body[key]);
      } else {
        itemData[key] = req.body[key];
      }
    }

    // Генерируем ID для нового элемента
    const newId = isNew ? Date.now().toString() : elementId;

    // Создаем запись в БД
    const catalogItem = {
      id: newId,
      name: itemData.name || 'Элемент',
      element_type: itemData.element_type || '',
      cabinet_tag: itemData.cabinet_tag || '',
      catalog_type: itemData.catalog_type || '',
      category: itemData.category || [],
      icon: itemData.icon || '',
      data: itemData.data || {}, // Содержит params (Clodis JSON) и метаданные
      created_at: isNew ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString()
    };

    // Сохраняем в БД
    if (!db.catalog_items) {
      db.catalog_items = [];
    }

    if (isNew) {
      db.catalog_items.push(catalogItem);
      console.log('✅ Создан новый элемент каталога:', newId, catalogItem.name);
    } else {
      const index = db.catalog_items.findIndex(item => item.id === elementId);
      if (index >= 0) {
        db.catalog_items[index] = { ...db.catalog_items[index], ...catalogItem };
        console.log('✅ Обновлен элемент каталога:', elementId, catalogItem.name);
      } else {
        db.catalog_items.push(catalogItem);
        console.log('✅ Создан элемент каталога (не найден для обновления):', elementId, catalogItem.name);
      }
    }

    // Сохраняем изменения в БД
    if (!writeDB(db)) {
      return res.json({ result: 'error', error: 'Database write error' });
    }

    console.log('  📦 element_type:', catalogItem.element_type);
    console.log('  📦 cabinet_tag:', catalogItem.cabinet_tag);
    console.log('  📦 Clodis JSON:', catalogItem.data?.params?.length || 0, 'элементов');

    // Возвращаем ответ в формате Clodis
    res.json({
      result: 'success',
      id: newId,
      message: 'Элемент успешно сохранен'
    });
  } catch (error) {
    console.error('❌ Ошибка сохранения элемента каталога:', error);
    res.json({
      result: 'error',
      error: error.message
    });
  }
});

/**
 * Получить список элементов каталога
 * GET /catalog/items_list/:element_type?
 */
app.get('/catalog/items_list/:element_type?', (req, res) => {
  try {
    const db = readDB();
    if (!db) {
      return res.status(500).json({ error: 'Database read error' });
    }

    let items = db.catalog_items || [];
    
    // Фильтруем по element_type если указан
    if (req.params.element_type) {
      items = items.filter(item => item.element_type === req.params.element_type);
    }

    res.json({
      result: 'success',
      items: items
    });
  } catch (error) {
    console.error('❌ Ошибка получения списка элементов:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Получить элемент каталога по ID
 * GET /catalog/items_get/:id
 */
app.get('/catalog/items_get/:id', (req, res) => {
  try {
    const db = readDB();
    if (!db) {
      return res.status(500).json({ error: 'Database read error' });
    }

    const item = db.catalog_items?.find(item => item.id === req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Преобразуем формат catalog_items в формат Clodis (с полем data.params)
  let clodisData = null;
  const jsonTree = readClodisJSON(item);
  if (Array.isArray(jsonTree) && jsonTree.length > 0) {
    clodisData = {
      params: jsonTree
    };
  }

    // Возвращаем в формате Clodis
    const clodisItem = {
      id: item.id,
      name: item.name,
      element_type: item.elementType || item.type || item.element_type,
      cabinet_tag: item.metadata?.cabinet_tag || item.cabinet_tag,
      catalog_type: item.metadata?.catalog_type || item.catalog_type,
      category: item.metadata?.category || item.category || [],
      icon: item.metadata?.icon || item.icon || '',
      data: clodisData ? JSON.stringify(clodisData) : (item.data || '{}'),
      created_at: item.metadata?.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    res.json({
      result: 'success',
      item: clodisItem
    });
  } catch (error) {
    console.error('❌ Ошибка получения элемента:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Удалить элемент каталога
 * DELETE /catalog/items_delete/:id
 */
app.delete('/catalog/items_delete/:id', (req, res) => {
  try {
    const db = readDB();
    if (!db) {
      return res.status(500).json({ result: 'error', error: 'Database read error' });
    }

    const index = db.catalog_items?.findIndex(item => item.id === req.params.id);
    
    if (index === undefined || index < 0) {
      return res.status(404).json({ result: 'error', error: 'Item not found' });
    }

    db.catalog_items.splice(index, 1);
    
    if (!writeDB(db)) {
      return res.json({ result: 'error', error: 'Database write error' });
    }

    console.log('✅ Удален элемент каталога:', req.params.id);

    res.json({
      result: 'success',
      message: 'Элемент удален'
    });
  } catch (error) {
    console.error('❌ Ошибка удаления элемента:', error);
    res.json({ result: 'error', error: error.message });
  }
});

// ============================================================================
// SPA FALLBACK (для продакшена - все маршруты возвращают index.html)
// ============================================================================
if (NODE_ENV === 'production' && fs.existsSync(DIST_DIR)) {
  // Все остальные маршруты возвращают index.html (для SPA)
  app.get('*', (req, res) => {
    // Пропускаем API маршруты и статические файлы
    if (req.path.startsWith('/api/') || 
        req.path.startsWith('/catalog/') || 
        req.path.startsWith('/data/') ||
        req.path.includes('.')) { // Если есть расширение файла, это статический файл
      return res.status(404).json({ error: 'Not found' });
    }
    
    // Для всех остальных возвращаем index.html
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('File not found');
    }
  });
}

// ============================================================================
// SERVER START
// ============================================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`🚀 Сервер запущен на http://0.0.0.0:${PORT}`);
  console.log(`🌐 Режим: ${NODE_ENV}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📦 API Endpoints:');
  console.log(`   GET  /                          - Проверка работы сервера`);
  console.log(`   GET  /api/health                - Статус сервера и БД`);
  console.log(`   GET  /api/catalog               - Список элементов каталога`);
  console.log(`   GET  /catalog/get_all_data_for_catalog_item`);
  console.log(`   POST /catalog/items_save/:id`);
  console.log(`   GET  /catalog/items_list/:element_type?`);
  console.log(`   GET  /catalog/items_get/:id`);
  console.log(`   DELETE /catalog/items_delete/:id`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📁 База данных: ${DB_FILE}`);
  if (NODE_ENV === 'production') {
    console.log(`📦 Статические файлы: ${DIST_DIR}`);
  }
  console.log('═══════════════════════════════════════════════════════════');
  console.log('💡 Для продакшена замените файловое хранилище на MySQL/PostgreSQL');
  console.log('═══════════════════════════════════════════════════════════');
});


