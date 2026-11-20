/**
 * !!! DEAD MIRROR — НЕ ПРАВИТЬ, НЕ ЗАПУСКАТЬ !!!
 * Канон сервера: D:\Clodis-Kitchen\server.js (+ server-dev.js → import server.js).
 * Этот файл в public/ — устаревшая копия; правки сюда не попадают в API :8101.
 *
 * Express сервер для работы с каталогом модулей и админ-панелью
 *
 * Основные функции:
 * - Сохранение и загрузка JSON модулей (как в Clodis)
 * - API для управления типами элементов каталога (catalogs_keys)
 * - API для админ-панели (настройки, меню, заявки)
 * - Раздача статических файлов
 */

import { createRequire } from 'module';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import multer from 'multer';
import { registerAiPilotRoutes } from './ai-pilot/register-routes.js';

const require = createRequire(import.meta.url);
const {
  pickClodisJSONFromRecord,
  pickClodisVariablesFromRecord,
  readClodisJSON: readClodisJSONFromRecord,
} = require('./server-clodis-json-fields.cjs');

// ============================================
// Настройка переменных окружения
// ============================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const _startMs = Date.now();

// Обработка необработанных ошибок — чтобы сервер не падал молча
process.on('uncaughtException', (err) => {
  console.error('❌ [uncaughtException]', err?.message || err);
  console.error(err?.stack || '');
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [unhandledRejection]', reason);
});

const app = express();
// Порт кухни: 8101 для dev:all (Vite на 8100 проксирует /api сюда).
// Без PORT — тоже 8101, чтобы npm start не занял 8000 шкафов.
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8101;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Пути к директориям и файлам
const MODULES_DIR = path.join(__dirname, 'modules');
const PROJECTS_DIR = path.join(__dirname, 'projects'); // Полные проекты (project_settings, camera, room, objects[])
const CATALOGS_KEYS_FILE = path.join(__dirname, 'catalogs_keys.json');
const MATERIALS_KEYS_FILE = path.join(__dirname, 'catalog_items', 'materials_keys.json');
const EDGES_KEYS_FILE = path.join(__dirname, 'catalog_items', 'edges_keys.json');
const CATALOG_ITEMS_DIR = path.join(__dirname, 'catalog_items');
const MATERIAL_ICONS_DIR = path.join(__dirname, 'public', 'common_assets', 'images', 'materials');
const MODELS_3D_DIR = path.join(__dirname, 'public', 'models');
/** Стартовые JSON/CSS/JS админки (нейтральный путь). */
const BOOTSTRAP_DIR = path.join(__dirname, 'data', 'bootstrap');
const CLODIS_VENDOR_DIR = path.join(__dirname, 'vendor', 'clodis');

// ============================================
// Preview data (для view_mode) — ленивая загрузка, не при старте
// ============================================
const BOOTSTRAP_SETTINGS_JSON = path.join(BOOTSTRAP_DIR, 'get_settings_ajax.json');
const CONSTRUCTOR_UI_SETTINGS_FILE = path.join(__dirname, 'constructor_ui_settings.json');
const ROOM_FURNITURE_BY_ROOM_FILE = path.join(__dirname, 'room_furniture_by_room.json');
const ROOM_STEPS_CONFIG_FILE = path.join(__dirname, 'room_steps_config.json');
let __previewSettingsCache = null;
function getPreviewSettings() {
  if (__previewSettingsCache !== null) return __previewSettingsCache;
  try {
    if (fs.existsSync(BOOTSTRAP_SETTINGS_JSON)) {
      const raw = fs.readFileSync(BOOTSTRAP_SETTINGS_JSON, 'utf8');
      const parsed = JSON.parse(raw);
      __previewSettingsCache = {
        settings: parsed?.settings || parsed?.settings_common || parsed?.constructor_settings || null,
        kitchen_models: parsed?.kitchen_models || null
      };
    } else {
      __previewSettingsCache = { settings: null, kitchen_models: null };
    }
  } catch (e) {
    console.warn('⚠️ Failed to parse preview reference settings JSON:', e?.message || e);
    __previewSettingsCache = { settings: null, kitchen_models: null };
  }
  return __previewSettingsCache;
}

/** Устаревшие имена JSON-полей — server-clodis-json-fields.cjs (base64). */
// ============================================
// Middleware
// ============================================

// CORS для разрешения кросс-доменных запросов
app.use(cors());

// Парсинг JSON и URL-encoded данных
app.use((req, res, next) => {
  if (req.path.startsWith('/config/index.php/')) return next();
  express.json({ limit: '50mb' })(req, res, next);
});
app.use((req, res, next) => {
  if (req.path.startsWith('/config/index.php/')) return next();
  express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
});

// Настройка Multer для обработки FormData (как в Clodis)
// fileFilter: пересобираем originalname из latin1→utf8, т.к. busboy по умолчанию
// декодирует filename как latin1, а браузеры отправляют UTF-8.
const upload = multer({
  fileFilter(req, file, cb) {
    try {
      file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    } catch (_) { /* оставляем как есть */ }
    cb(null, true);
  }
});
app.use((req, res, next) => {
  if (req.path.startsWith('/config/index.php/')) return next();
  const ct = String(req.headers['content-type'] || '').toLowerCase();
  if (!ct.includes('multipart/form-data')) return next();
  upload.any()(req, res, next);
});

// Middleware для правильных MIME типов для статических файлов
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.type('application/javascript');
    // Dev: JS модули кухни/конструктора не кэшировать (иначе Ctrl+F5 на HTML не помогает).
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  } else if (req.path.endsWith('.json')) {
    res.type('application/json');
  } else if (req.path.endsWith('.css')) {
    res.type('text/css');
  } else if (req.path.endsWith('.html')) {
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
  next();
});

// Корень / и index.html — без кэша (bust внутри HTML иначе не подхватывается)
app.get(['/', '/index.html'], (req, res, next) => {
  const filePath = path.join(__dirname, 'index.html');
  if (!fs.existsSync(filePath)) return next();
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return res.sendFile(filePath);
});

// ============================================
// index-refactored.html — рефакторенная версия (модули)
// Ранний маршрут, чтобы не перехватывался другими
// ============================================
app.get('/index-refactored.html', (req, res) => {
  const filePath = path.join(__dirname, 'index-refactored.html');
  if (fs.existsSync(filePath)) {
    res.set('Content-Type', 'text/html; charset=utf-8');
    return res.sendFile(filePath);
  }
  res.status(404).send('index-refactored.html not found');
});

// admin-new.html — явно с charset для корректной кириллицы
app.get('/admin-new.html', (req, res) => {
  const filePath = path.join(__dirname, 'admin-new.html');
  if (fs.existsSync(filePath)) {
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.sendFile(filePath);
  }
  res.status(404).send('admin-new.html not found');
});

// Админ-бандл — без кэша (часто правится при отладке превью)
app.get('/js/admin/admin-new-bundle.js', (req, res) => {
  const filePath = path.join(__dirname, 'js', 'admin', 'admin-new-bundle.js');
  if (fs.existsSync(filePath)) {
    res.set('Content-Type', 'application/javascript; charset=utf-8');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.sendFile(filePath);
  }
  res.status(404).send('admin-new-bundle.js not found');
});

// ============================================
// БАЗА ДАННЫХ (db.json) — для админки admin-new.html
// Создаём контент в админке → комната использует для пользователей
// ============================================
const DB_FILE = path.join(__dirname, 'db.json');

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
    console.log('✅ Создана БД для админки:', DB_FILE);
  }
}
initDB();

function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Ошибка чтения БД:', error);
    return null;
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('❌ Ошибка записи в БД:', error);
    return false;
  }
}

// API для админки (admin-new.html)
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

app.get('/api/catalog', (req, res) => {
  try {
    const db = readDB();
    if (!db) return res.status(500).json({ error: 'Database read error' });
    const items = db.catalog_items || [];
    res.json({
      status: 'ok',
      count: items.length,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type || item.element_type,
        category: item.catalogCategory || item.cabinet_tag,
        hasClodisJSON: !!(item.clodisJSON && item.clodisJSON.length > 0)
      }))
    });
  } catch (error) {
    console.error('❌ Ошибка каталога:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/catalog/get_all_data_for_catalog_item/:materials_from_json?', (req, res) => {
  try {
    const db = readDB();
    if (!db) return res.status(500).json({ error: 'Database read error' });
    res.json({
      default_settings: db.default_settings || [],
      modules_groups: db.modules_groups || [],
      materials_groups: db.materials_groups || [],
      material_types: db.material_types || [],
      global_vars: db.global_vars || { value: JSON.stringify([]) },
      catalogs_keys: db.catalogs_keys || []
    });
  } catch (error) {
    console.error('❌ Ошибка get_all_data:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/catalog/items_save/:id?', (req, res) => {
  try {
    const db = readDB();
    if (!db) return res.json({ result: 'error', error: 'Database read error' });
    const elementId = (req.params.id !== undefined ? req.params.id : '0');
    const isNew = elementId === '0';
    let itemData = {};
    for (const key in req.body) {
      if (key === 'category' && typeof req.body[key] === 'string') itemData[key] = JSON.parse(req.body[key]);
      else if (key === 'data' && typeof req.body[key] === 'string') itemData[key] = JSON.parse(req.body[key]);
      else itemData[key] = req.body[key];
    }
    const newId = isNew ? Date.now().toString() : elementId;
    const catalogItem = {
      id: newId,
      name: itemData.name || 'Элемент',
      element_type: itemData.element_type || '',
      cabinet_tag: itemData.cabinet_tag || '',
      catalog_type: itemData.catalog_type || '',
      category: itemData.category || [],
      icon: itemData.icon || '',
      data: itemData.data || {},
      clodisJSON:
        readClodisJSONFromRecord(itemData) ||
        itemData.data?.params,
      updated_at: new Date().toISOString()
    };
    if (!db.catalog_items) db.catalog_items = [];
    if (isNew) {
      db.catalog_items.push(catalogItem);
      console.log('✅ Создан элемент каталога:', newId, catalogItem.name);
    } else {
      const idx = db.catalog_items.findIndex(item => item.id === elementId);
      if (idx >= 0) {
        db.catalog_items[idx] = { ...db.catalog_items[idx], ...catalogItem };
        console.log('✅ Обновлен элемент:', elementId);
      } else {
        db.catalog_items.push(catalogItem);
      }
    }
    if (!writeDB(db)) return res.json({ result: 'error', error: 'Database write error' });
    
    // ⭐ ВАЖНО: Синхронизируем с файловым хранилищем catalog_items/{catalog_type}.json
    // чтобы элемент был виден в админке через /api/catalog/items_get/:type
    if (catalogItem.catalog_type) {
      try {
        const catalogType = catalogItem.catalog_type;
        const items = loadCatalogItems(catalogType);
        const existingIndex = items.findIndex(it => Number(it?.id) === Number(newId));
        
        // Преобразуем формат из db.json в формат catalog_items (убираем catalog_type из верхнего уровня)
        const syncItem = {
          id: catalogItem.id,
          name: catalogItem.name,
          ...(catalogItem.element_type ? { element_type: catalogItem.element_type } : {}),
          ...(catalogItem.cabinet_tag ? { cabinet_tag: catalogItem.cabinet_tag } : {}),
          ...(catalogItem.category && catalogItem.category.length > 0 ? { category: catalogItem.category } : {}),
          ...(catalogItem.icon ? { icon: catalogItem.icon } : {}),
          data: catalogItem.data || {},
          ...(catalogItem.clodisJSON ? { clodisJSON: catalogItem.clodisJSON } : {}),
          ...(catalogItem.show_in_constructor !== undefined ? { show_in_constructor: catalogItem.show_in_constructor } : {}),
          ...(catalogItem.order !== undefined ? { order: catalogItem.order } : {})
        };
        
        if (existingIndex >= 0) {
          items[existingIndex] = { ...items[existingIndex], ...syncItem };
          console.log(`🔄 Синхронизирован элемент в catalog_items/${catalogType}.json (обновлен):`, newId);
        } else {
          items.push(syncItem);
          console.log(`🔄 Синхронизирован элемент в catalog_items/${catalogType}.json (добавлен):`, newId);
        }
        
        saveCatalogItems(catalogType, items);
        console.log(`✅ Элемент "${catalogItem.name}" синхронизирован в catalog_items/${catalogType}.json`);
      } catch (syncError) {
        console.warn('⚠️ Не удалось синхронизировать элемент в catalog_items:', syncError?.message || syncError);
        // Не прерываем сохранение, т.к. элемент уже сохранён в db.json
      }
    }
    
    res.json({ result: 'success', id: newId, message: 'Элемент сохранен' });
  } catch (error) {
    console.error('❌ Ошибка сохранения:', error);
    res.json({ result: 'error', error: error.message });
  }
});

app.get('/catalog/items_list/:element_type?', (req, res) => {
  try {
    const db = readDB();
    if (!db) return res.status(500).json({ error: 'Database read error' });
    let items = db.catalog_items || [];
    if (req.params.element_type) {
      items = items.filter(item => item.element_type === req.params.element_type);
    }
    res.json({ result: 'success', items });
  } catch (error) {
    console.error('❌ Ошибка items_list:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/catalog/items_get/:id', (req, res) => {
  try {
    const db = readDB();
    if (!db) return res.status(500).json({ error: 'Database read error' });
    const item = db.catalog_items?.find(item => item.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    let clodisData = null;
    if (item.clodisJSON && Array.isArray(item.clodisJSON) && item.clodisJSON.length > 0) {
      clodisData = { params: item.clodisJSON };
    }
    const clodisItem = {
      id: item.id,
      name: item.name,
      element_type: item.elementType || item.type || item.element_type,
      cabinet_tag: item.metadata?.cabinet_tag || item.cabinet_tag,
      catalog_type: item.metadata?.catalog_type || item.catalog_type,
      category: item.metadata?.category || item.category || [],
      icon: item.metadata?.icon || item.icon || '',
      data: clodisData ? JSON.stringify(clodisData) : (item.data || '{}'),
      clodisJSON: item.clodisJSON,
      created_at: item.metadata?.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    res.json({ result: 'success', item: clodisItem });
  } catch (error) {
    console.error('❌ Ошибка items_get:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/catalog/items_delete/:id', (req, res) => {
  try {
    const db = readDB();
    if (!db) return res.json({ result: 'error', error: 'Database read error' });
    const index = db.catalog_items?.findIndex(item => item.id === req.params.id);
    if (index === undefined || index < 0) return res.status(404).json({ result: 'error', error: 'Item not found' });
    db.catalog_items.splice(index, 1);
    if (!writeDB(db)) return res.json({ result: 'error', error: 'Database write error' });
    console.log('✅ Удален элемент:', req.params.id);
    res.json({ result: 'success', message: 'Элемент удален' });
  } catch (error) {
    console.error('❌ Ошибка удаления:', error);
    res.json({ result: 'error', error: error.message });
  }
});

// ============================================
// Фолбэк для icons.json (legacy preview)
// ============================================
// Движок запрашивает /common_assets/fonts/icons/new/fonts/icons.json для инициализации иконок
app.get(/^\/common_assets\/fonts\/.*\/icons\.json$/i, (req, res) => {
  // Отдаём минимальный валидный JSON (пустой объект или базовую структуру)
  return res.status(200).json({});
});

// ============================================
// API: available_data — ленивая загрузка (~2 МБ), не при старте
// ============================================
const BOOTSTRAP_CATALOG_DATA_FILE = path.join(BOOTSTRAP_DIR, 'get_all_data_for_catalog_item.json');
let __fullReferenceDataCache = null;
function getFullReferenceData() {
  if (__fullReferenceDataCache !== null) return __fullReferenceDataCache;
  try {
    const rawData = fs.readFileSync(BOOTSTRAP_CATALOG_DATA_FILE, 'utf8');
    __fullReferenceDataCache = JSON.parse(rawData);
  } catch (err) {
    console.error('❌ Ошибка загрузки данных из референса:', err.message);
    __fullReferenceDataCache = {};
  }
  return __fullReferenceDataCache;
}

app.get(/\/api\/available_data/i, (req, res) => res.sendFile(BOOTSTRAP_CATALOG_DATA_FILE));

app.post(/\/api\/available_data/i, async (req, res) => {
  const requestedData = req.body || {};
  const data = getFullReferenceData();
  if (requestedData.urls) return res.status(200).json(data);
  const responseData = {};
  const dataMap = {
    'materials': 'facades', 'glass_materials': 'model_key_material', 'facade_sets': 'cabinet_model',
    'handles': 'handles', 'accessories': 'furniture', 'kitchen_models': 'cabinet_model',
    'cokol': 'cokol', 'cokol_top': 'cokol_top', 'cornice': 'cornice',
    'tabletop': 'tabletop', 'tabletop_plinth': 'tabletop_plinth',
  };
  Object.keys(requestedData).forEach(key => {
    if (requestedData[key] === true) {
      const dataKey = dataMap[key] || key;
      responseData[key] = data[dataKey] || { categories: [], items: [] };
    }
  });
  return res.status(200).json(responseData);
});

app.get(/\/api\/available_data_files/i, (req, res) => res.sendFile(BOOTSTRAP_CATALOG_DATA_FILE));

app.post(/\/api\/available_data_files/i, async (req, res) => {
  // Движок ожидает URLS (пути к файлам), а НЕ сами данные!
  // Возвращаем структуру { urls: { materials: "/path/to/materials.json", ... } }
  const urls = {};
  const requestedData = req.body || {};
  
  // Генерируем URLs для всех запрошенных типов данных
  Object.keys(requestedData).forEach(key => {
    if (requestedData[key] === true) {
      urls[key] = `/common_assets/data/${key}.json`;
    }
  });
  
  return res.status(200).json({ urls });
});

// ============================================
// Фолбэк для lng_front.php (языковой файл)
// ============================================
app.get(/\/config\/lng_front\.php/i, (req, res) => {
  return res.status(200).json({});
});

app.post(/\/config\/lng_front\.php/i, (req, res) => {
  return res.status(200).json({});
});

// ============================================
// Эндпоинты для preview_data/* (view_mode добавляет префикс preview_data/)
// ВАЖНО: Эти эндпоинты должны быть ВЫШЕ общего regex route для preview_*.json!
// ============================================
app.get('/common_assets/data/preview_data/materials.json', (req, res) => {
  const data = getFullReferenceData().facades || { categories: [], items: [] };
  return res.status(200).json(data);
});

app.get('/common_assets/data/preview_data/handles.json', (req, res) => {
  const data = getFullReferenceData().handles || { categories: [], items: [] };
  return res.status(200).json(data);
});

app.get('/common_assets/data/preview_data/accessories.json', (req, res) => {
  const data = getFullReferenceData().furniture || { categories: [], items: [] };
  return res.status(200).json(data);
});

app.get('/common_assets/data/preview_data/glass_materials.json', (req, res) => {
  const data = getFullReferenceData().model_key_material || { categories: [], items: [] };
  return res.status(200).json(data);
});

app.get('/common_assets/data/preview_data/facade_sets.json', (req, res) => {
  const data = getFullReferenceData().cabinet_model || { categories: [], items: [] };
  return res.status(200).json(data);
});

app.get('/common_assets/data/preview_data/tabletop.json', (req, res) => {
  const data = getFullReferenceData().tabletop || { categories: [], items: [] };
  return res.status(200).json(data);
});

app.get('/common_assets/data/preview_data/cokol.json', (req, res) => {
  const data = getFullReferenceData().cokol || { categories: [], items: [] };
  return res.status(200).json(data);
});

app.get('/common_assets/data/preview_data/*.json', (req, res) => res.status(200).json({ categories: [], items: [] }));

// ============================================
// Фолбэки для preview_*.json (view_mode) - СТАРЫЕ пути
// ============================================
// Движок в view_mode обращается к /common_assets/data/preview_*...json
// В нашем проекте этих файлов нет, поэтому отдаём валидный JSON (минимальный), чтобы не было 404.
app.get(/^\/common_assets\/data\/preview_.*\.json$/i, (req, res) => {
  const p = req.path.toLowerCase();
  const preview = getPreviewSettings();
  if (p.includes('constructor_settings')) return res.status(200).json(preview.settings || {});
  if (p.includes('kitchen_models')) return res.status(200).json(preview.kitchen_models || []);
  return res.status(200).json([]);
});

// ============================================
// Фолбэки для /common_assets/data/*.json (view_mode переписывает пути)
// ============================================
// Движок в view_mode переписывает urls: data/*.json → /common_assets/data/*.json
// Создаём МИНИМАЛЬНЫЕ моки с реальными данными для инициализации движка
const dataFileMockStructure = { 
  categories: [
    { id: 1, name: 'Основная категория', parent: 0, active: 1 }
  ], 
  items: [
    { 
      id: 1, 
      category: 1, 
      name: 'Материал по умолчанию', 
      code: 'DEFAULT_MAT',
      params: { color: '#ffffff' },
      add_params: {},
      price: 0
    }
  ] 
};

const facadeSetsMinimalMock = [
  { 
    id: 1, 
    name: 'Набор фасадов по умолчанию', 
    active: 1, 
    has_side: 0,
    model: '',
    icon: ''
  }
];

const handlesCatalogMock = {
  categories: [],
  items: [
    {
      id: 1,
      category: 0,
      name: 'Ручка по умолчанию',
      code: 'DEFAULT_HANDLE',
      type: 'normal',
      params: {},
      price: 0
    }
  ]
};


// ============================================
// Обычные эндпоинты (без preview_data)
// ============================================
app.get('/common_assets/data/materials.json', (req, res) => {
  const data = getFullReferenceData().facades || { categories: [], items: [] };
  return res.status(200).json(data);
});

// ============================================
// Простое API для фасадов (по данным из референса getFullReferenceData().facades)
// Не связано с админкой и конструктором, используется только для вспомогательных UI.
// ============================================
app.get('/api/facades', (req, res) => {
  try {
    const data = getFullReferenceData().facades || { categories: [], items: [] };
    return res.status(200).json(data);
  } catch (error) {
    console.error('❌ /api/facades error:', error?.message || error);
    return res.status(500).json({ error: 'facades_read_error' });
  }
});

app.get('/api/facades/:id', (req, res) => {
  try {
    const data = getFullReferenceData().facades || { categories: [], items: [] };
    const id = req.params.id;
    const items = Array.isArray(data.items) ? data.items : [];
    const item = items.find((it) => String(it?.id) === String(id));
    if (!item) {
      return res.status(404).json({ error: 'facade_not_found' });
    }
    return res.status(200).json(item);
  } catch (error) {
    console.error('❌ /api/facades/:id error:', error?.message || error);
    return res.status(500).json({ error: 'facade_read_error' });
  }
});

app.get('/common_assets/data/accessories.json', (req, res) => {
  const data = getFullReferenceData().furniture || { categories: [], items: [] };
  return res.status(200).json(data);
});

app.get('/common_assets/data/glass_materials.json', (req, res) => {
  const data = getFullReferenceData().model_key_material || { categories: [], items: [] };
  return res.status(200).json(data);
});

app.get('/common_assets/data/facade_categories.json', (req, res) => {
  const categories = getFullReferenceData().facades?.categories || [];
  return res.status(200).json(categories);
});

app.get('/common_assets/data/facade_sets.json', (req, res) => {
  const data = getFullReferenceData().cabinet_model || { categories: [], items: [] };
  return res.status(200).json(data.items || []);
});

app.get('/common_assets/data/kitchen_templates.json', (req, res) => res.status(200).json([]));

app.get('/common_assets/data/tech_catalog.json', (req, res) => res.status(200).json(dataFileMockStructure));

app.get('/common_assets/data/comms_catalog.json', (req, res) => res.status(200).json(dataFileMockStructure));

app.get('/common_assets/data/interior_catalog.json', (req, res) => res.status(200).json(dataFileMockStructure));

app.get('/common_assets/data/kitchen_models.json', (req, res) => {
  const data = getFullReferenceData().cabinet_model || { categories: [], items: [] };
  return res.status(200).json(data.items || []);
});

app.get('/common_assets/data/handles.json', (req, res) => {
  const data = getFullReferenceData().handles || { categories: [], items: [] };
  return res.status(200).json(data);
});

app.get('/common_assets/data/prices.json', (req, res) => res.status(200).json([]));

app.get('/common_assets/data/sections.json', (req, res) => res.status(200).json([]));

app.get('/common_assets/data/built_in_models_common.json', (req, res) => res.status(200).json([]));

app.get('/common_assets/data/project_settings.json', (req, res) => res.status(200).json({}));

app.get('/common_assets/data/cokol.json', (req, res) => {
  const data = getFullReferenceData().cokol || { categories: [], items: [] };
  return res.status(200).json(data);
});

app.get('/common_assets/data/cokol_top.json', (req, res) => {
  const data = getFullReferenceData().cokol_top || { categories: [], items: [] };
  return res.status(200).json(data);
});

app.get('/common_assets/data/cornice.json', (req, res) => {
  const data = getFullReferenceData().cornice || { categories: [], items: [] };
  return res.status(200).json(data);
});

app.get('/common_assets/data/tabletop.json', (req, res) => {
  const data = getFullReferenceData().tabletop || { categories: [], items: [] };
  return res.status(200).json(data);
});

app.get('/common_assets/data/tabletop_plinth.json', (req, res) => {
  const data = getFullReferenceData().tabletop_plinth || { categories: [], items: [] };
  return res.status(200).json(data);
});

app.get('/common_assets/data/furniture.json', (req, res) => {
  const data = getFullReferenceData().furniture || { categories: [], items: [] };
  return res.status(200).json(data);
});

// ============================================
// Моки для data/*.json (отдельные файлы материалов, аксессуаров и т.д.)
// ============================================
// Движок запрашивает data/materials.json, data/accessories.json и т.д.
// Каждый файл должен вернуть структуру { categories: [], items: [] }
const dataFileMock = { categories: [], items: [] };

app.get('/data/materials.json', (req, res) => res.status(200).json(dataFileMock));

app.get('/data/accessories.json', (req, res) => res.status(200).json(dataFileMock));

app.get('/data/glass_materials.json', (req, res) => res.status(200).json(dataFileMock));

app.get('/data/facade_categories.json', (req, res) => res.status(200).json([]));

app.get('/data/facade_sets.json', (req, res) => res.status(200).json([]));

app.get('/data/kitchen_templates.json', (req, res) => res.status(200).json([]));

app.get('/data/tech_catalog.json', (req, res) => res.status(200).json(dataFileMock));

app.get('/data/comms_catalog.json', (req, res) => res.status(200).json(dataFileMock));

app.get('/data/interior_catalog.json', (req, res) => res.status(200).json(dataFileMock));

app.get('/data/kitchen_models.json', (req, res) => res.status(200).json(getPreviewSettings().kitchen_models || []));

app.get('/data/handles.json', (req, res) => res.status(200).json(dataFileMock));

app.get('/data/prices.json', (req, res) => res.status(200).json([]));

app.get('/data/sections.json', (req, res) => res.status(200).json([]));

app.get('/data/built_in_models_common.json', (req, res) => res.status(200).json([]));

// Каталоги конструктора — отдаём реальные файлы из public/data/
app.get('/data/catalogs_keys.json', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'data', 'catalogs_keys.json');
  if (fs.existsSync(filePath)) return res.sendFile(filePath);
  return res.status(200).json([]);
});
app.get('/data/catalogs_items.json', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'data', 'catalogs_items.json');
  if (fs.existsSync(filePath)) return res.sendFile(filePath);
  return res.status(200).json({});
});

app.get('/data/clodis_drilling_registry.json', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'data', 'clodis_drilling_registry.json');
  if (fs.existsSync(filePath)) return res.sendFile(filePath);
  return res.status(404).json({ error: 'clodis_drilling_registry.json not found' });
});

/**
 * Библиотека присадки (как схемы крепежа .config в Базис-Мебельщик):
 * GET — то же, что /data/clodis_drilling_registry.json
 * POST — админка выгружает все шаблоны+схемы из LS на сервер.
 */
function drillRegistryFilePath() {
  return path.join(__dirname, 'public', 'data', 'clodis_drilling_registry.json');
}
app.get('/api/drill/registry', (req, res) => {
  const filePath = drillRegistryFilePath();
  if (fs.existsSync(filePath)) return res.sendFile(filePath);
  return res.status(404).json({ error: 'clodis_drilling_registry.json not found' });
});
app.post('/api/drill/registry', (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ ok: false, error: 'Ожидается JSON-объект библиотеки присадки' });
    }
    const templates = Array.isArray(body.templates) ? body.templates : [];
    const schemes = Array.isArray(body.schemes) ? body.schemes : [];
    const allowEmpty = body.allowEmpty === true || body.allowEmpty === 1 || body.allowEmpty === '1';
    if (!templates.length && !schemes.length && !allowEmpty) {
      return res.status(400).json({ ok: false, error: 'Пустая библиотека: нет templates и schemes' });
    }
    const managedTemplateIds = Array.isArray(body.managedTemplateIds) && body.managedTemplateIds.length
      ? body.managedTemplateIds.map(Number).filter((n) => n > 0)
      : templates.map((t) => Number(t && t.id)).filter((n) => n > 0);
    const managedSchemeIds = Array.isArray(body.managedSchemeIds) && body.managedSchemeIds.length
      ? body.managedSchemeIds.map(Number).filter((n) => n > 0)
      : schemes.map((s) => Number(s && s.id)).filter((n) => n > 0);
    const payload = {
      version: Number(body.version) > 0 ? Number(body.version) : Date.now(),
      managedTemplateIds,
      managedSchemeIds,
      templates,
      schemes,
      updatedAt: new Date().toISOString(),
      _note: body._note || body._cadSingleChainNote || 'Выгружено из админки (библиотека присадки, как схемы крепежа в БМ)',
    };
    const filePath = drillRegistryFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
    console.log(
      `✅ [api/drill/registry] сохранено templates=${templates.length} schemes=${schemes.length} version=${payload.version}`,
    );
    return res.json({
      ok: true,
      version: payload.version,
      templateCount: templates.length,
      schemeCount: schemes.length,
      managedTemplateIds,
      managedSchemeIds,
      updatedAt: payload.updatedAt,
    });
  } catch (e) {
    console.error('❌ [api/drill/registry] POST:', e);
    return res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

// Фолбэк для остальных data/*.json
app.get('/data/*.json', (req, res) => {
  console.log(`🔍 Запрос ${req.path} (фолбэк)`);
  return res.status(200).json([]);
});

// ============================================
// Раздача статических файлов
// ============================================

// На проде не отдаём dev-реф (папки остаются в репозитории для разработки).
app.use((req, res, next) => {
  if (!IS_PRODUCTION) return next();
  const p = String(req.path || '').replace(/\\/g, '/').toLowerCase();
  const blocked = [
    '/constructor_code_reference',
    '/reference_b3d',
    '/js/reference/reference-catalog-overlay',
    'constructor-clodis-preview.html',
    '/vendor/main_core_v2.js',
    '/vendor/planplace_',
    '/vendor/facade-item-edit-ref.html',
    '/main_i_v.js',
    '/src/',
  ];
  if (blocked.some((b) => p.includes(b))) {
    return res.status(404).end();
  }
  next();
});

// "Vendor" route: нейтральный URL для локальных библиотек.
// Сейчас указывает на vendor (для разработки), чтобы не светить /vendor в рантайме.
// На финальной чистке достаточно перенести файлы в public/vendor и поменять путь ниже.
app.use('/data/bootstrap', express.static(BOOTSTRAP_DIR));
app.use('/vendor/clodis', express.static(CLODIS_VENDOR_DIR));
app.use('/vendor', express.static(path.join(__dirname, 'vendor')));

// Перехватываем запросы к шрифтам из style_v2.css, чтобы не было 404 на glyphicons
app.get(/\/vendor\/fonts\/.*\.(woff2?|ttf|eot|svg)$/i, (req, res) => {
  console.log('⚠️ [MOCK font] Запрос реф. шрифта:', req.url);
  const ext = path.extname(req.url).toLowerCase();
  let contentType = 'font/woff2';
  if (ext === '.woff') contentType = 'font/woff';
  else if (ext === '.ttf') contentType = 'font/ttf';
  else if (ext === '.eot') contentType = 'application/vnd.ms-fontobject';
  else if (ext === '.svg') contentType = 'image/svg+xml';

  res.set('Content-Type', contentType);
  // Возвращаем пустой буфер — браузеру достаточно "есть файл", нам визуально иконки glyphicons не нужны
  return res.status(200).send(Buffer.from([]));
});

app.use(express.static(__dirname)); // Корневая директория (включая html/js)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Глушим sourcemap-запросы из референтного движка Clodis,
// чтобы в консоли не сыпались 404 на *.css.map / *.js.map
app.get(/\/clodis\/.*\.(css|js)\.map$/i, (req, res) => {
  console.log('⚠️ [MOCK sourcemap] Запрос карты исходников:', req.url);
  res.set('Content-Type', 'application/json; charset=utf-8');
  return res.status(200).send('{}');
});

// Маршруты для доступа к данным и изображениям из public/
app.use('/data', express.static(path.join(__dirname, 'public/data')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// Маршрут для скомпилированных TypeScript файлов
app.use('/dist', express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Маршрут для исходных TypeScript файлов
app.use('/src', express.static(path.join(__dirname, 'src')));

// ⭐ Нужен для ESM импортов вида /node_modules/three/...
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Дополнительная статика, чтобы убрать 404 на иконки/плейсхолдеры из референса
const FILES_ROOT_DIR = path.join(__dirname, 'public/files');
app.use('/files', express.static(FILES_ROOT_DIR));
// Шрифты (Cera Pro и др.) для заголовков конструктора — положите .woff2/.woff в public/fonts/
app.use('/fonts', express.static(path.join(__dirname, 'public/fonts')));
// 3D модели (загруженные через «Загрузить» в форме редактирования 3D модели)
app.use('/models', express.static(MODELS_3D_DIR));

// ============================================
// Fallback для auto_icons (убираем 404 в админке)
// ============================================
// В референсе иконки могут отсутствовать; для clean-room достаточно плейсхолдера.
app.get('/files/auto_icons/:catalog/:name', (req, res, next) => {
  const filePath = path.join(__dirname, 'public', 'files', 'auto_icons', req.params.catalog, req.params.name);
  if (fs.existsSync(filePath)) return res.sendFile(filePath);
  return res.sendFile(path.join(__dirname, 'public', 'files', 'auto_icons', 'placeholder.png'));
});

// ============================================
// Простейший файловый менеджер для админки
// (дерево /files: список, загрузка, создание папок, удаление)
// ============================================

const COMMON_ASSETS_DIR = path.join(__dirname, 'public', 'common_assets');

function safeFilesPath(rawPath, useCommonAssets = false) {
  const rel = (rawPath || '').replace(/\\/g, '/').replace(/^\/+/, '').trim();
  const baseDir = useCommonAssets ? COMMON_ASSETS_DIR : FILES_ROOT_DIR;
  const full = path.normalize(path.join(baseDir, rel));
  if (!full.startsWith(baseDir)) {
    throw new Error('Недопустимый путь');
  }
  const urlPrefix = useCommonAssets ? '/common_assets' : '/files';
  return { rel, full, urlPrefix };
}

/** Единое разрешение пути файлового менеджера (list / upload / delete / mkdir). */
function resolveFilesManagerTarget(rawPath) {
  const pathStr = (rawPath || '').toString().replace(/\\/g, '/').replace(/^\/+/, '').trim();
  const useCommonAssets = pathStr.startsWith('common_assets') || pathStr.startsWith('common_assets/');
  const useModels = pathStr === 'models' || pathStr.startsWith('models/');

  if (useModels) {
    const modelsRel = pathStr.replace(/^models\/?/, '') || '';
    const base = path.resolve(MODELS_3D_DIR);
    const full = path.resolve(MODELS_3D_DIR, modelsRel);
    const relToBase = path.relative(base, full);
    if (relToBase.startsWith('..') || path.isAbsolute(relToBase)) {
      throw new Error('Недопустимый путь');
    }
    const rel = relToBase.replace(/\\/g, '/') || '';
    return {
      rel,
      full,
      urlPrefix: '/models',
      effectivePath: rel ? `models/${rel}` : 'models',
    };
  }

  const fp = safeFilesPath(useCommonAssets ? pathStr.replace(/^common_assets\/?/, '') : pathStr, useCommonAssets);
  return {
    rel: fp.rel,
    full: path.resolve(fp.full),
    urlPrefix: fp.urlPrefix,
    effectivePath: useCommonAssets ? (fp.rel ? `common_assets/${fp.rel}` : 'common_assets') : fp.rel,
  };
}

/**
 * Кириллица → латиница (для имён загружаемых файлов: предсказуемые URL, без сюрпризов на Windows/прокси).
 * В самом каталоге товаров название может оставаться по-русски; это только физическое имя на диске.
 */
function transliterateCyrillicToLatin(str) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
    і: 'i', ї: 'i', є: 'e', ґ: 'g',
    ў: 'u',
    ђ: 'dj', ј: 'j', љ: 'lj', њ: 'nj', ћ: 'c', џ: 'dz',
  };
  let out = '';
  for (const c of str) {
    const lo = c.toLowerCase();
    const rep = map[lo];
    if (rep !== undefined) {
      out += c === c.toUpperCase() && lo !== c ? rep.toUpperCase() : rep;
    } else {
      out += c;
    }
  }
  return out;
}

/**
 * Безопасное имя файла без расширения: транслит + только [a-z0-9._-].
 */
function sanitizeUploadBaseName(rawBase, fallback = 'file', maxLen = 160) {
  let s = String(rawBase || '').normalize('NFC');
  s = transliterateCyrillicToLatin(s);
  s = s.replace(/[\u0000-\u001F\u007F<>:"/\\|?*]/g, '_');
  s = s.replace(/^\.+/, '').trim();
  s = s.replace(/\s+/g, '_');
  s = s.replace(/[^a-zA-Z0-9._-]/g, '_');
  s = s.replace(/_{2,}/g, '_').replace(/^[\s._-]+|[\s._-]+$/g, '');
  s = s.toLowerCase();
  if (!s) return fallback;
  if (s.length > maxLen) s = s.slice(0, maxLen).replace(/_+$/, '');
  return s;
}

app.get('/api/files/list', (req, res) => {
  try {
    const rawPath = (req.query.path || '').toString();
    const { rel, full, urlPrefix, effectivePath } = resolveFilesManagerTarget(rawPath);
    const parentParts = effectivePath.split('/').filter(Boolean);
    parentParts.pop();
    const parent = parentParts.length ? parentParts.join('/') : '';
    if (!fs.existsSync(full)) {
      return res.json({ path: effectivePath, parent: '', items: [] });
    }
    const entries = fs.readdirSync(full, { withFileTypes: true });
    const items = entries.map((ent) => {
      const entryPath = path.join(full, ent.name);
      const stat = fs.statSync(entryPath);
      const isDir = ent.isDirectory();
      const relPart = [rel, ent.name].filter(Boolean).join('/');
      const url = isDir ? null : (urlPrefix + '/' + relPart).replace(/\\/g, '/');
      return {
        name: ent.name,
        type: isDir ? 'dir' : 'file',
        size: isDir ? 0 : stat.size,
        mtime: stat.mtimeMs,
        url,
        ext: isDir ? null : path.extname(ent.name).toLowerCase(),
      };
    }).sort((a, b) => {
      // Сначала папки, потом файлы, по имени
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name, 'ru');
    });

    return res.json({ path: effectivePath, parent, items });
  } catch (e) {
    console.error('❌ /api/files/list error:', e);
    return res.status(500).json({ error: 'Ошибка чтения каталога' });
  }
});

app.post('/api/files/mkdir', express.json(), (req, res) => {
  try {
    const body = req.body || {};
    const basePath = (body.path || '').toString();
    let name = (body.name || '').toString().normalize('NFC').trim();
    name = name.replace(/[\u0000-\u001F\u007F<>:"/\\|?*]/g, '_').replace(/^\.+/, '').replace(/\.+$/, '').trim();
    if (!name) return res.status(400).json({ error: 'Не указано имя папки' });
    if (name === '.' || name === '..') {
      return res.status(400).json({ error: 'Недопустимое имя папки' });
    }

    const targetPath = [basePath, name].filter(Boolean).join('/');
    const { full } = resolveFilesManagerTarget(targetPath);
    if (!fs.existsSync(full)) {
      fs.mkdirSync(full, { recursive: true });
    }
    return res.json({ ok: true, name, path: targetPath.replace(/\\/g, '/') });
  } catch (e) {
    console.error('❌ /api/files/mkdir error:', e);
    return res.status(500).json({ error: e.message || 'Ошибка создания папки' });
  }
});

app.post('/api/files/upload', (req, res) => {
  try {
    const bodyFields = req.body || {};
    const targetRelPath = (bodyFields.path || '').toString();
    if (!targetRelPath) {
      return res.status(400).json({ error: 'Не указана папка назначения (path)' });
    }
    const { rel, full, urlPrefix } = resolveFilesManagerTarget(targetRelPath);

    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ error: 'Файлы не переданы' });
    }
    if (!fs.existsSync(full)) {
      fs.mkdirSync(full, { recursive: true });
    }

    const saved = files.map((file) => {
      const originalName = file.originalname || file.fieldname || 'file.bin';
      const ext = path.extname(originalName);
      const rawBase = path.basename(originalName, ext);
      const safeBase = sanitizeUploadBaseName(rawBase, 'file', 160);
      console.log(`📁 Upload: original="${originalName}" rawBase="${rawBase}" → safe="${safeBase}"`);
      const fileName = `${safeBase}_${Date.now()}${ext}`;
      const destPath = path.join(full, fileName);
      fs.writeFileSync(destPath, file.buffer);
      const webPath = `${urlPrefix}/${[rel, fileName].filter(Boolean).join('/')}`.replace(/\\/g, '/');
      console.log(`📁 Upload saved: ${destPath} → ${webPath}`);
      return { name: fileName, url: webPath };
    });

    return res.json({ ok: true, files: saved });
  } catch (e) {
    console.error('❌ /api/files/upload error:', e);
    return res.status(500).json({ error: e?.message || 'Ошибка загрузки файла' });
  }
});

app.post('/api/files/delete', express.json(), (req, res) => {
  try {
    const body = req.body || {};
    const target = (body.path || '').toString().trim();
    if (!target) {
      return res.status(400).json({ error: 'Не указан path' });
    }
    const { full } = resolveFilesManagerTarget(target);
    if (!fs.existsSync(full)) {
      console.warn('⚠️ /api/files/delete: not found', full, 'requested', target);
      return res.status(404).json({ error: 'Файл не найден на диске', path: target, full });
    }
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      fs.rmSync(full, { recursive: true, force: true });
    } else {
      fs.unlinkSync(full);
    }
    console.log('🗑️ /api/files/delete ok:', full);
    return res.json({ ok: true, deleted: true, path: target });
  } catch (e) {
    console.error('❌ /api/files/delete error:', e);
    return res.status(500).json({ error: e?.message || 'Ошибка удаления' });
  }
});

// Переименование (для кнопки ✏️ в файловом менеджере)
app.post('/api/files/rename', express.json(), (req, res) => {
  try {
    const body = req.body || {};
    const target = (body.path || '').toString();
    const newNameRaw = (body.newName || body.name || '').toString();
    if (!target) return res.status(400).json({ error: 'Не указан путь' });
    if (!newNameRaw) return res.status(400).json({ error: 'Не указано новое имя' });

    const useCommonAssets = target.startsWith('common_assets') || target.startsWith('common_assets/');
    const useModels = target === 'models' || target.startsWith('models/');

    // Определяем базовую директорию так же, как в /api/files/list
    let relOld;
    let fullOld;
    if (useModels) {
      const modelsRel = target.replace(/^models\/?/, '') || '';
      fullOld = path.normalize(path.join(MODELS_3D_DIR, modelsRel));
      if (!fullOld.startsWith(MODELS_3D_DIR)) fullOld = MODELS_3D_DIR;
      relOld = path.relative(MODELS_3D_DIR, fullOld).replace(/\\/g, '/') || '';
      if (relOld.startsWith('..')) relOld = '';
    } else {
      const fp = safeFilesPath(useCommonAssets ? target.replace(/^common_assets\/?/, '') : target, useCommonAssets);
      relOld = fp.rel;
      fullOld = fp.full;
    }

    const statOld = fs.existsSync(fullOld) ? fs.statSync(fullOld) : null;
    if (!statOld) return res.status(404).json({ error: 'Объект не найден' });

    const dirFull = path.dirname(fullOld);
    const oldExt = path.extname(fullOld); // для файлов

    let finalName = '';
    if (statOld.isDirectory()) {
      // Для папки имя без расширений
      finalName = sanitizeUploadBaseName(newNameRaw, path.basename(fullOld), 160);
    } else {
      // Для файла: сохраняем расширение старого файла
      const newExt = path.extname(newNameRaw);
      const extToUse = newExt || oldExt || '';
      const newBase = newExt ? path.basename(newNameRaw, newExt) : newNameRaw;
      const safeBase = sanitizeUploadBaseName(newBase, path.basename(fullOld, oldExt), 160);
      finalName = `${safeBase}${extToUse ? extToUse : ''}`;
    }

    if (!finalName) return res.status(400).json({ error: 'Некорректное новое имя' });

    const fullNew = path.join(dirFull, finalName);
    if (fs.existsSync(fullNew)) return res.status(409).json({ error: 'Файл с таким именем уже существует' });

    fs.renameSync(fullOld, fullNew);
    return res.json({ ok: true, name: finalName });
  } catch (e) {
    console.error('❌ /api/files/rename error:', e);
    return res.status(500).json({ error: 'Ошибка переименования' });
  }
});

// ⭐ ВАЖНО: Моки для несуществующих файлов ДО express.static, чтобы перехватывать запросы
// Перехватываем запросы к .fbx, .jpg, .png, .json которых нет
app.get(/\/common_assets\/(models|images|fonts|tests)\/.*\.(fbx|jpg|png|json|woff|woff2|ttf)$/i, (req, res, next) => {
  const ext = path.extname(req.url).toLowerCase();
  
  // Проверяем, существует ли файл
  const filePath = path.join(__dirname, 'public/common_assets', req.path.replace('/common_assets/', ''));
  if (fs.existsSync(filePath)) {
    // Файл существует, пропускаем дальше к express.static
    console.log(`✅ [MOCK] Файл существует, пропускаем к express.static: ${req.url}`);
    return next();
  }
  
  console.log(`⚠️ [MOCK] Файл НЕ существует, возвращаем мок: ${req.url}`);
  console.log(`   Проверяемый путь: ${filePath}`);
  
  // Возвращаем мок файл соответствующего типа
  if (ext === '.fbx') {
    // ⭐ МИНИМАЛЬНЫЙ ВАЛИДНЫЙ FBX файл (ASCII FBX 7.4)
    const minimalFBX = `; FBX 7.4.0 project file
; Created by Mock Server
; ----------------------------------------------------

FBXHeaderExtension:  {
    FBXHeaderVersion: 1003
    FBXVersion: 7400
}

GlobalSettings:  {
    Version: 1000
}

Documents:  {
    Count: 1
    Document:  {
        Name: "EmptyScene"
        RootNode: 0
    }
}

References:  {
}

Definitions:  {
    Version: 100
    Count: 0
}

Objects:  {
    Version: 100
    Count: 0
}

Connections:  {
    Version: 100
    Count: 0
}

; End of file
`;
    const buffer = Buffer.from(minimalFBX, 'utf8');
    console.log(`   ✅ Возвращаем мок FBX, размер: ${buffer.length} байт (${(buffer.length / 1024).toFixed(2)} кБ)`);
    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Length', buffer.length.toString());
    return res.send(buffer);
  } else if (ext === '.jpg' || ext === '.png') {
    // Прозрачный 1x1 PNG
    const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    res.set('Content-Type', ext === '.jpg' ? 'image/jpeg' : 'image/png');
    return res.send(transparentPng);
  } else if (ext === '.json') {
    // Пустой JSON объект
    return res.json({});
  } else if (ext === '.woff' || ext === '.woff2' || ext === '.ttf') {
    // Пустой шрифт
    res.set('Content-Type', 'font/' + ext.slice(1));
    return res.send(Buffer.from([]));
  } else {
    return res.status(200).send('');
  }
});

// Fallback для /common_assets/assets/... (иконки фасадов и прочие ассеты из рефа)
// Если реального файла нет, подставляем плейсхолдер, чтобы не было 404
app.get(/\/common_assets\/assets\/.*\.(jpg|jpeg|png|svg)$/i, (req, res, next) => {
  const relPath = req.path.replace('/common_assets/', '');
  const filePath = path.join(__dirname, 'public/common_assets', relPath);

  if (fs.existsSync(filePath)) {
    console.log(`✅ [MOCK assets] Файл существует, отдаём как есть: ${req.url}`);
    return res.sendFile(filePath);
  }

  console.log(`⚠️ [MOCK assets] Файл НЕ существует, отдаём плейсхолдер: ${req.url}`);

  // Пробуем использовать общий плейсхолдер из public/files/auto_icons/placeholder.png
  const placeholderPath = path.join(__dirname, 'public', 'files', 'auto_icons', 'placeholder.png');
  if (fs.existsSync(placeholderPath)) {
    res.set('Content-Type', 'image/png');
    return res.sendFile(placeholderPath);
  }

  // На крайний случай — прозрачный 1x1 PNG
  const transparentPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  res.set('Content-Type', 'image/png');
  return res.send(transparentPng);
});

app.use('/common_assets', express.static(path.join(__dirname, 'public/common_assets')));

// Фолбэк для отсутствующих иконок авто-генерации
app.get('/files/auto_icons/:file', (req, res) => {
  const requested = path.join(__dirname, 'public/files/auto_icons', req.params.file);
  const fallback = path.join(__dirname, 'public/files/auto_icons', 'placeholder.png');
  const target = fs.existsSync(requested) ? requested : fallback;
  res.sendFile(target);
});

// ============================================
// Загрузка иконок материалов (упрощённый upload, как в рефе)
// ============================================

app.post('/api/upload/material_icon', (req, res) => {
  try {
    const files = req.files || [];
    const file = files.find(f => f.fieldname === 'file') || files[0];
    if (!file) {
      return res.status(400).json({ error: 'Файл не передан' });
    }

    const originalName = file.originalname || 'icon.png';
    const ext = (path.extname(originalName) || '.png').toLowerCase();
    const allowedExt = ['.png', '.jpg', '.jpeg', '.webp'];
    if (!allowedExt.includes(ext)) {
      return res.status(400).json({ error: 'Допустимы только изображения (png, jpg, jpeg, webp)' });
    }

    const safeBase = sanitizeUploadBaseName(path.basename(originalName, ext), 'material_icon', 160);
    const fileName = `${safeBase}_${Date.now()}${ext}`;
    const targetPath = path.join(MATERIAL_ICONS_DIR, fileName);

    fs.writeFileSync(targetPath, file.buffer);
    const url = `/common_assets/images/materials/${fileName}`;
    console.log('💾 Загружена иконка материала:', targetPath, 'url:', url);

    return res.status(200).json({ url });
  } catch (e) {
    console.error('❌ Ошибка загрузки иконки материала:', e?.message || e);
    return res.status(500).json({ error: 'Ошибка загрузки файла' });
  }
});

// Загрузка иконок шагов комнаты (Управление комнатой)
const ROOM_ICONS_DIR = path.join(FILES_ROOT_DIR, 'room_icons');
app.post('/api/upload/room_icon', (req, res) => {
  try {
    const files = req.files || [];
    const file = req.file || files.find(f => f.fieldname === 'file') || files[0];
    if (!file) {
      console.warn('⚠️ room_icon: нет файла. req.files.length=', (req.files || []).length, 'Content-Type:', req.headers['content-type']);
      return res.status(400).json({ error: 'Файл не передан' });
    }
    const originalName = file.originalname || 'icon.png';
    const ext = (path.extname(originalName) || '.png').toLowerCase();
    const allowedExt = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
    if (!allowedExt.includes(ext)) {
      return res.status(400).json({ error: 'Допустимы только изображения (png, jpg, jpeg, webp, gif)' });
    }
    if (!fs.existsSync(ROOM_ICONS_DIR)) {
      fs.mkdirSync(ROOM_ICONS_DIR, { recursive: true });
    }
    const safeBase = sanitizeUploadBaseName(path.basename(originalName, ext), 'room_icon', 160);
    const fileName = `${safeBase}_${Date.now()}${ext}`;
    const targetPath = path.join(ROOM_ICONS_DIR, fileName);
    fs.writeFileSync(targetPath, file.buffer);
    const url = `/files/room_icons/${fileName}`.replace(/\\/g, '/');
    console.log('💾 Загружена иконка шага комнаты:', url);
    return res.status(200).json({ url, files: [{ name: fileName, url }] });
  } catch (e) {
    console.error('❌ Ошибка загрузки иконки комнаты:', e?.message || e);
    return res.status(500).json({ error: 'Ошибка загрузки файла' });
  }
});

// ============================================
// Загрузка 3D моделей
// ============================================
const MODELS_3D_EXT = ['.glb', '.gltf', '.obj', '.fbx', '.stl'];

// GET — чтобы проверить, что endpoint доступен (ответ 405 = нужен POST)
app.get('/api/upload/model_3d', (req, res) => {
  res.status(405).json({ error: 'Используйте POST для загрузки 3D модели' });
});

function handleModelUpload(targetDir, urlPrefix, req, res) {
  try {
    const files = req.files || [];
    const file = files.find(f => f.fieldname === 'file') || files[0];
    if (!file) {
      return res.status(400).json({ error: 'Файл не передан' });
    }

    const originalName = file.originalname || 'model.glb';
    const ext = (path.extname(originalName) || '').toLowerCase();
    if (!MODELS_3D_EXT.includes(ext)) {
      return res.status(400).json({
        error: `Допустимые форматы: ${MODELS_3D_EXT.join(', ')}. Получено: ${ext || 'нет расширения'}`,
      });
    }

    const safeBase = sanitizeUploadBaseName(path.basename(originalName, ext), 'model', 160);
    const fileName = `${safeBase}_${Date.now()}${ext}`;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const targetPath = path.join(targetDir, fileName);
    fs.writeFileSync(targetPath, file.buffer);

    const url = `${urlPrefix}/${fileName}`;
    console.log('💾 Загружена 3D модель:', targetPath, 'url:', url);
    return res.status(200).json({ url });
  } catch (e) {
    console.error('❌ Ошибка загрузки 3D модели:', e?.message || e);
    return res.status(500).json({ error: 'Ошибка загрузки файла' });
  }
}

// Загрузка 3D модели для общего каталога 3D моделей
app.post('/api/upload/model_3d', (req, res) => {
  console.log('📤 POST /api/upload/model_3d — запрос получен');
  handleModelUpload(MODELS_3D_DIR, '/models', req, res);
});

// Загрузка 3D моделей фасадов (fbx и др.) в подкаталог /models/facades
const FACADE_MODELS_DIR = path.join(MODELS_3D_DIR, 'facades');

app.post('/api/upload/facade_model', (req, res) => {
  console.log('📤 POST /api/upload/facade_model — запрос получен');
  handleModelUpload(FACADE_MODELS_DIR, '/models/facades', req, res);
});

// ============================================
// Инициализация директорий
// ============================================

// Создаем папку для модулей, если её нет
if (!fs.existsSync(MODULES_DIR)) {
  fs.mkdirSync(MODULES_DIR, { recursive: true });
  console.log('✅ Создана папка для модулей:', MODULES_DIR);
}

// Создаем папку для иконок материалов, если её нет
if (!fs.existsSync(MATERIAL_ICONS_DIR)) {
  fs.mkdirSync(MATERIAL_ICONS_DIR, { recursive: true });
  console.log('✅ Создана папка для иконок материалов:', MATERIAL_ICONS_DIR);
}

// Создаем папку для 3D моделей, если её нет
if (!fs.existsSync(MODELS_3D_DIR)) {
  fs.mkdirSync(MODELS_3D_DIR, { recursive: true });
  console.log('✅ Создана папка для 3D моделей:', MODELS_3D_DIR);
}

// ============================================
// Вспомогательные функции для работы с catalogs_keys
// ============================================

/**
 * Загружает типы элементов каталога из файла catalogs_keys.json
 * Если файл не существует или поврежден, создает новый с начальными данными
 * 
 * @returns {Array} Массив объектов с типами элементов {id, name, order, active}
 */
function loadCatalogsKeys() {
  try {
    if (fs.existsSync(CATALOGS_KEYS_FILE)) {
      const fileData = fs.readFileSync(CATALOGS_KEYS_FILE, 'utf8');
      
      if (!fileData || fileData.trim() === '') {
        console.warn('⚠️ Файл catalogs_keys.json пустой, используем начальные данные');
      } else {
        const data = JSON.parse(fileData);
        if (Array.isArray(data)) {
          console.log('📖 Загружены типы элементов из файла:', data.length, 'элементов');
          return data;
        } else {
          console.error('❌ Файл catalogs_keys.json не содержит массив, используем начальные данные');
        }
      }
    } else {
      console.log('📝 Файл catalogs_keys.json не существует, создадим с начальными данными');
    }
  } catch (error) {
    console.error('❌ Ошибка чтения файла catalogs_keys.json:', error.message);
    console.error('   Stack:', error.stack);
  }
  
  // Начальные mock данные, если файл не существует или поврежден
  const defaultData = [
    { id: 1, name: 'Кухни', order: 1, active: 1 },
    { id: 2, name: 'Двери кухонных модулей', order: 2, active: 1 },
    { id: 4, name: 'Полки', order: 3, active: 1 },
    { id: 5, name: 'Полкодержатели', order: 4, active: 1 },
    { id: 6, name: 'Петли накладные', order: 5, active: 1 },
    { id: 7, name: 'Опоры', order: 6, active: 1 },
    { id: 8, name: 'Двери для шкафов', order: 7, active: 1 },
    { id: 9, name: 'Шкафы', order: 8, active: 1 },
    { id: 10, name: 'Ящики для шкафов', order: 9, active: 1 },
    { id: 11, name: 'Полки и перегородки для шкафов', order: 10, active: 1 },
    { id: 12, name: 'Двери для углового модуля', order: 11, active: 1 },
    { id: 13, name: 'Петли угловые', order: 12, active: 1 },
    { id: 16, name: 'ШАБЛОНЫ КОРПУСОВ', order: 13, active: 1 },
    { id: 17, name: 'ШАБЛОНЫ КОРПУСОВ GOLA', order: 14, active: 1 },
    { id: 18, name: 'Сушки', order: 15, active: 1 },
    { id: 19, name: 'Профиль Gola', order: 16, active: 1 },
    { id: 20, name: 'Духовые шкафы', order: 17, active: 1 },
    { id: 21, name: 'Встроенные микроволновки', order: 18, active: 1 },
    { id: 22, name: 'Бутылочницы', order: 19, active: 1 },
    { id: 24, name: 'Ящики', order: 20, active: 1 }
  ];
  
  // Сохраняем начальные данные в файл
  saveCatalogsKeys(defaultData);
  return defaultData;
}

/**
 * Сохраняет типы элементов каталога в файл catalogs_keys.json
 * 
 * @param {Array} data - Массив объектов с типами элементов
 * @returns {boolean} true если успешно сохранено, false в случае ошибки
 */
function saveCatalogsKeys(data) {
  try {
    if (!Array.isArray(data)) {
      console.error('❌ Данные для сохранения не являются массивом:', typeof data);
      return false;
    }
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(CATALOGS_KEYS_FILE, jsonData, 'utf8');
    console.log('💾 Типы элементов сохранены в файл:', data.length, 'элементов');
    return true;
  } catch (error) {
    console.error('❌ Ошибка сохранения файла catalogs_keys.json:', error.message);
    console.error('   Stack:', error.stack);
    return false;
  }
}

function normalizeModulesGroupId(value) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseCatalogTypeIdList(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const x of raw) {
    const n = parseInt(x, 10);
    if (Number.isFinite(n) && n > 0 && !out.includes(n)) out.push(n);
  }
  return out;
}

/** Привязка типов каталога (catalogs_keys) к группе modules_groups. */
function assignCatalogTypesToGroup(groupId, typeIds) {
  const gid = normalizeModulesGroupId(groupId);
  if (!gid) return false;
  const ids = parseCatalogTypeIdList(typeIds);
  const catalogTypes = loadCatalogsKeys();
  let changed = false;
  for (const t of catalogTypes) {
    if (!t || typeof t !== 'object') continue;
    const tid = parseInt(t.id, 10);
    if (!Number.isFinite(tid)) continue;
    const shouldAssign = ids.includes(tid);
    const current = normalizeModulesGroupId(t.modules_group_id);
    if (shouldAssign && current !== gid) {
      t.modules_group_id = gid;
      changed = true;
    } else if (!shouldAssign && current === gid) {
      delete t.modules_group_id;
      changed = true;
    }
  }
  if (changed) saveCatalogsKeys(catalogTypes);
  return changed;
}

function clearCatalogTypesForGroup(groupId) {
  return assignCatalogTypesToGroup(groupId, []);
}

function getCatalogTypeIdsForGroup(groupId) {
  const gid = normalizeModulesGroupId(groupId);
  if (!gid) return [];
  return loadCatalogsKeys()
    .filter((t) => normalizeModulesGroupId(t?.modules_group_id) === gid)
    .map((t) => parseInt(t.id, 10))
    .filter((n) => Number.isFinite(n));
}

function parseCatalogGroupRequestData(req) {
  if (!req || !req.body) return {};
  if (req.body.data) {
    return typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
  }
  return req.body;
}

function mergeCatalogTypeItem(existing, data, itemId) {
  return {
    id: itemId,
    key: data?.key != null && data.key !== '' ? data.key : existing?.key || `catalog_${itemId}`,
    name: data?.name || existing?.name || '',
    order: parseInt(data?.order, 10) || 0,
    active: data?.active == '1' || data?.active === 1 ? 1 : 0,
  };
}

// ============================================
// Простое файловое хранилище элементов каталога (clean-room)
// ============================================
function safeCatalogTypeKey(type) {
  // Разрешаем только буквы/цифры/._- чтобы не было path traversal
  return String(type || '').replace(/[^A-Za-z0-9._-]/g, '_');
}

function ensureCatalogItemsDir() {
  try {
    if (!fs.existsSync(CATALOG_ITEMS_DIR)) fs.mkdirSync(CATALOG_ITEMS_DIR, { recursive: true });
  } catch (e) {
    console.error('❌ Не удалось создать папку catalog_items:', e?.message || e);
  }
}

function catalogItemsFilePath(type) {
  const key = safeCatalogTypeKey(type);
  return path.join(CATALOG_ITEMS_DIR, `${key}.json`);
}

function loadCatalogItems(type) {
  ensureCatalogItemsDir();
  const file = catalogItemsFilePath(type);
  try {
    if (!fs.existsSync(file)) return [];
    const raw = fs.readFileSync(file, 'utf8');
    if (!raw || !raw.trim()) return [];
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : [];
    return ensureCatalogItemsIds(type, items);
  } catch (e) {
    console.error(`❌ Ошибка чтения catalog_items для "${type}":`, e?.message || e);
    return [];
  }
}

/** item.data как объект (в т.ч. JSON-строка) + поля верхнего уровня. */
function unwrapCatalogItemData(it) {
  if (!it || typeof it !== 'object') return {};
  let parsed = it.data;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch (_) {
      parsed = null;
    }
  }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return { ...it, ...parsed, data: parsed };
  }
  return it;
}

function pickIconAspectFromCatalogRecord(it) {
  const data = unwrapCatalogItemData(it);
  const raw = data.iconAspect ?? it?.iconAspect;
  if (raw == null || String(raw).trim() === '') return null;
  return raw === 'low' || raw === 'short' ? 'low' : 'tall';
}

function saveCatalogItems(type, items) {
  ensureCatalogItemsDir();
  const file = catalogItemsFilePath(type);
  try {
    fs.writeFileSync(file, JSON.stringify(Array.isArray(items) ? items : [], null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(`❌ Ошибка сохранения catalog_items для "${type}":`, e?.message || e);
    return false;
  }
}

function normalizeCatalogItemField(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function catalogTypeNeedsDuplicateGuard(type) {
  const t = String(type || '');
  return /^material_/i.test(t) || /^butt_/i.test(t);
}

function pickCatalogItemNameArticle(record) {
  const data = unwrapCatalogItemData(record);
  const article = data.article ?? data.code ?? data.vendor_code ?? record?.article ?? record?.code ?? '';
  return {
    name: data.name ?? record?.name ?? '',
    article,
  };
}

function findCatalogItemDuplicate(items, { name, article, excludeId }) {
  const nName = normalizeCatalogItemField(name);
  const nArticle = normalizeCatalogItemField(article);
  const exId = excludeId != null ? Number(excludeId) : NaN;

  for (const it of Array.isArray(items) ? items : []) {
    if (!it || typeof it !== 'object') continue;
    const id = Number(it.id);
    if (isFinite(exId) && exId > 0 && id === exId) continue;
    const picked = pickCatalogItemNameArticle(it);
    const niName = normalizeCatalogItemField(picked.name);
    const niArticle = normalizeCatalogItemField(picked.article);

    if (nArticle && niArticle === nArticle) {
      return { field: 'article', item: it, existingName: picked.name, existingArticle: picked.article };
    }
    if (nName && niName === nName && nArticle === niArticle) {
      return { field: 'name', item: it, existingName: picked.name, existingArticle: picked.article };
    }
  }
  return null;
}

function catalogItemKindLabel(type) {
  return /^butt_/i.test(String(type || '')) ? 'Кромка' : 'Материал';
}

function buildCatalogDuplicateError(catalogType, duplicate, payload) {
  const kind = catalogItemKindLabel(catalogType);
  const existingId = duplicate?.item?.id;
  const existingName = duplicate?.existingName || duplicate?.item?.name || '';
  if (duplicate?.field === 'article') {
    const article = (payload?.article ?? '').toString().trim();
    return `${kind} с артикулом «${article}» уже существует (ID ${existingId}, «${existingName}»).`;
  }
  const name = (payload?.name ?? '').toString().trim();
  return `${kind} «${name}» уже существует (ID ${existingId}).`;
}

/** Каталог серий ручек: catalog_items/handles.json → { categories, series } */
function handlesCatalogFilePath() {
  return path.join(CATALOG_ITEMS_DIR, 'handles.json');
}

function loadHandlesCatalog() {
  ensureCatalogItemsDir();
  const file = handlesCatalogFilePath();
  let data = { categories: [], series: [] };
  try {
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8') || '{}');
      if (Array.isArray(parsed)) {
        data.series = parsed;
      } else if (parsed && typeof parsed === 'object') {
        data.categories = Array.isArray(parsed.categories) ? parsed.categories : [];
        data.series = Array.isArray(parsed.series) ? parsed.series : (Array.isArray(parsed.items) ? parsed.items : []);
      }
    }
  } catch (e) {
    console.error('❌ Ошибка чтения handles.json:', e?.message || e);
  }
  return ensureHandlesSeriesShape(data);
}

function saveHandlesCatalog(data) {
  ensureCatalogItemsDir();
  const file = handlesCatalogFilePath();
  try {
    const payload = {
      categories: Array.isArray(data?.categories) ? data.categories : [],
      series: Array.isArray(data?.series) ? data.series : [],
    };
    fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('❌ Ошибка сохранения handles.json:', e?.message || e);
    return false;
  }
}

function getHandleSeriesSlug(item) {
  if (!item || typeof item !== 'object') return '';
  const key = item.key != null ? String(item.key).trim() : '';
  if (key) return key;
  const id = item.id;
  if (typeof id === 'string' && id && !/^\d+$/.test(id)) return id;
  return id != null ? String(id) : '';
}

function ensureHandlesSeriesShape(data) {
  if (!data || typeof data !== 'object') data = { categories: [], series: [] };
  if (!Array.isArray(data.categories)) data.categories = [];
  if (!Array.isArray(data.series)) data.series = [];
  let changed = false;
  let maxNum = 0;
  for (const s of data.series) {
    const n = Number(s?.id);
    if (Number.isFinite(n) && n > 0 && n > maxNum) maxNum = Math.floor(n);
  }
  const seenKeys = new Set();
  for (const s of data.series) {
    if (!s || typeof s !== 'object') continue;
    let slug = getHandleSeriesSlug(s);
    if (!slug) {
      slug = 'series-' + (maxNum + 1);
      s.key = slug;
      changed = true;
    } else if (!s.key) {
      s.key = slug;
      changed = true;
    }
    if (typeof s.id === 'string' && !/^\d+$/.test(s.id)) {
      maxNum += 1;
      s.id = maxNum;
      changed = true;
    } else if (!Number.isFinite(Number(s.id)) || Number(s.id) <= 0) {
      maxNum += 1;
      s.id = maxNum;
      changed = true;
    }
    if (seenKeys.has(slug)) {
      let suffix = 2;
      let next = slug + '-' + suffix;
      while (seenKeys.has(next)) { suffix += 1; next = slug + '-' + suffix; }
      s.key = next;
      changed = true;
      slug = next;
    }
    seenKeys.add(slug);
    if (s.active == null) { s.active = 1; changed = true; }
    if (s.order == null) { s.order = Number(s.id) * 100; changed = true; }
  }
  if (changed) saveHandlesCatalog(data);
  return data;
}

function nextHandleSeriesId(series) {
  const arr = Array.isArray(series) ? series : [];
  const maxId = arr.length ? Math.max(...arr.map((s) => Number(s?.id) || 0)) : 0;
  return maxId + 1;
}

function findHandleSeriesById(data, itemId) {
  const idNum = Number(itemId);
  if (!Number.isFinite(idNum) || idNum <= 0) return null;
  return (data?.series || []).find((s) => Number(s?.id) === idNum) || null;
}

function getHandleCategoryName(data, categoryId) {
  const cid = Number(categoryId);
  if (!Number.isFinite(cid)) return '';
  const cat = (data?.categories || []).find((c) => Number(c?.id) === cid);
  return cat ? String(cat.name || '') : '';
}

function mergeHandleSeriesPayload(existing, body) {
  const prev = existing && typeof existing === 'object' ? { ...existing } : {};
  const out = { ...prev, ...(body && typeof body === 'object' ? body : {}) };
  if (body?.name != null) out.name = String(body.name).trim();
  if (body?.icon != null) out.icon = String(body.icon).trim();
  if (body?.order != null) out.order = Number(body.order) || 0;
  if (body?.active != null) out.active = body.active === true || body.active === 1 || body.active === '1' ? 1 : 0;
  if (body?.kind != null) out.kind = String(body.kind).trim();
  if (body?.categoryId != null) out.categoryId = Number(body.categoryId) || null;
  if (body?.cabinetModelId != null) out.cabinetModelId = Number(body.cabinetModelId) || 0;
  if (body?.sizeType != null) out.sizeType = String(body.sizeType).trim();
  if (body?.noHandle != null) out.noHandle = !!(body.noHandle === true || body.noHandle === 1 || body.noHandle === '1');
  if (body?.hideSizesInCatalog != null) {
    out.hideSizesInCatalog = !!(body.hideSizesInCatalog === true || body.hideSizesInCatalog === 1 || body.hideSizesInCatalog === '1');
  }
  if (body?.modelParams != null && typeof body.modelParams === 'object') {
    out.modelParams = { ...(out.modelParams && typeof out.modelParams === 'object' ? out.modelParams : {}), ...body.modelParams };
  }
  if (Array.isArray(body?.sizes)) out.sizes = body.sizes;
  if (Array.isArray(body?.variants)) out.variants = body.variants;
  if (Array.isArray(body?.finishes)) out.finishes = body.finishes;
  if (Array.isArray(body?.models)) out.models = body.models;
  if (body?.defaults != null && typeof body.defaults === 'object') out.defaults = body.defaults;
  if (Array.isArray(body?.placementRules)) out.placementRules = body.placementRules;
  if (body?.entityType != null) out.entityType = String(body.entityType).trim() || 'collection';
  else if (!out.entityType) out.entityType = 'collection';
  if (body?.parentCollectionId != null) out.parentCollectionId = Number(body.parentCollectionId) || null;
  const keyRaw = body?.key != null ? String(body.key).trim() : '';
  if (keyRaw) out.key = keyRaw;
  else if (!out.key) out.key = getHandleSeriesSlug(out) || ('series-' + (out.id || Date.now()));
  if (Array.isArray(out.variants) && out.variants[0] && body?.cabinetModelId != null) {
    out.variants[0] = { ...out.variants[0], cabinetModelId: Number(body.cabinetModelId) || 0 };
  } else if (!Array.isArray(out.variants) || !out.variants.length) {
    const cabId = Number(body?.cabinetModelId ?? out.cabinetModelId) || 0;
    if (cabId > 0 || out.kind === 'bar') {
      out.variants = [{
        cabinetModelId: cabId,
        barLengthMm: 128,
        maxFacadeW: 450,
        roles: ['kitchen', 'locker', 'wardrobe'],
      }];
    }
  }
  return out;
}

function nextCatalogItemId(items) {
  const maxId = Array.isArray(items) && items.length > 0 ? Math.max(...items.map((it) => Number(it?.id) || 0)) : 0;
  return maxId + 1;
}

// Гарантируем уникальные/ненулевые ID элементов (чтобы редактирование работало для старых/импортированных данных)
function ensureCatalogItemsIds(type, items) {
  if (!Array.isArray(items)) return [];
  let changed = false;

  // считаем встречаемость id (чтобы не “перенумеровывать” всё подряд)
  const counts = new Map();
  let maxId = 0;
  for (const it of items) {
    const n = Number(it?.id) || 0;
    if (n > 0) {
      counts.set(n, (counts.get(n) || 0) + 1);
      if (n > maxId) maxId = n;
    }
  }

  // вторым проходом: проставляем id только там, где id отсутствует (<=0) или это ДУБЛЬ (все кроме первого)
  const seen = new Set();
  for (const it of items) {
    const n = Number(it?.id) || 0;
    if (n > 0 && (counts.get(n) || 0) === 1) {
      // уникальный id — оставляем
      seen.add(n);
      continue;
    }

    if (n > 0 && (counts.get(n) || 0) > 1) {
      // дубль: первый оставляем, остальные перенумеровываем
      if (!seen.has(n)) {
        seen.add(n);
        continue;
      }
    }

    // id отсутствует или это повтор дубля — назначаем новый
    maxId += 1;
    it.id = maxId;
    changed = true;
    seen.add(maxId);
  }

  if (changed) {
    const ok = saveCatalogItems(type, items);
    if (ok) {
      console.log(`🔧 catalog_items/${type}.json — id восстановлены, всего: ${items.length}`);
    }
  }
  return items;
}

// ============================================
// API Endpoints для работы с модулями
// ============================================

/**
 * POST /catalog/items_save/:id? - Сохранение JSON модуля (как в Clodis через FormData)
 * 
 * Поддерживает два формата:
 * - FormData (как в Clodis): поля name, id, data (JSON строка с params)
 * - JSON (для обратной совместимости): {name, json, elementId}
 */
app.post('/catalog/items_save/:id?', (req, res) => {
  try {
    let name, json, elementId, metadata;
    
    // Проверяем формат данных: FormData или JSON
    const isFormData = req.headers['content-type']?.includes('multipart/form-data') || 
                       (req.body && req.body.data && typeof req.body.data === 'string');
    
    if (isFormData) {
      // FormData (как в Clodis)
      name = req.body.name;
      elementId = req.params.id || req.body.id || '0';
      
      // В Clodis данные приходят в поле 'data' как JSON строка
      if (req.body.data) {
        const dataObj = typeof req.body.data === 'string' 
          ? JSON.parse(req.body.data) 
          : req.body.data;
        json = dataObj.params || dataObj; // params содержит Clodis JSON
        metadata = dataObj;
      } else {
        // Если нет data, пробуем получить json напрямую
        json = req.body.json ? (typeof req.body.json === 'string' ? JSON.parse(req.body.json) : req.body.json) : null;
      }
    } else {
      // JSON (для обратной совместимости)
      ({ name, json, elementId } = req.body);
      elementId = req.params.id || elementId || '0';
    }

    if (!name || !json) {
      return res.json({ 
        result: 'error', 
        error: 'Требуются поля: name, data (с params) или json' 
      });
    }

    // Создаем безопасное имя файла
    const safeName = name.replace(/[^a-zа-яё0-9]/gi, '_').toLowerCase();
    const fileName = elementId && elementId !== '0'
      ? `${safeName}_${elementId}.json`
      : `${safeName}_${Date.now()}.json`;
    const filePath = path.join(MODULES_DIR, fileName);

    // Сохраняем JSON файл (только Clodis JSON из params, как в референсе)
    const clodisJSON = Array.isArray(json) ? json : (json.children || [json]);
    fs.writeFileSync(filePath, JSON.stringify(clodisJSON, null, 2), 'utf8');

    console.log('✅ Модуль сохранен (как в Clodis):', filePath);
    console.log('  📦 name:', name);
    console.log('  📦 elementId:', elementId);
    console.log('  📦 JSON элементов:', clodisJSON.length);

    // Возвращаем ответ в формате Clodis
    res.json({
      result: 'success',
      id: elementId !== '0' ? elementId : Date.now().toString(),
      message: 'Модуль успешно сохранен',
      filePath: filePath,
      fileName: fileName
    });
  } catch (error) {
    console.error('❌ Ошибка сохранения модуля:', error);
    res.json({ 
      result: 'error', 
      error: error.message 
    });
  }
});

// Старый endpoint для обратной совместимости
app.post('/api/modules/save', (req, res) => {
  req.url = '/catalog/items_save/0';
  return app._router.handle(req, res);
});

// ============================================
// API Endpoints для работы с проектами (полными, не модулями)
// Референс: save_scene_new / load_project в Clodis
// ============================================

/**
 * POST /api/projects/save - Сохранение полного проекта (project_settings, camera, room, objects[])
 * Body: { name, projectData }
 * projectData: полный JSON проекта как в get_save_data_new (project_settings, camera, room, objects[])
 */
app.post('/api/projects/save', (req, res) => {
  try {
    const { name, projectData } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ 
        result: 'error', 
        error: 'Не указано имя проекта' 
      });
    }
    
    if (!projectData || typeof projectData !== 'object') {
      return res.status(400).json({ 
        result: 'error', 
        error: 'Неверный формат данных проекта' 
      });
    }

    // Создаём папку projects если её нет
    if (!fs.existsSync(PROJECTS_DIR)) {
      fs.mkdirSync(PROJECTS_DIR, { recursive: true });
    }

    // Генерируем ID проекта если его нет
    if (!projectData.project_settings) {
      projectData.project_settings = {};
    }
    if (!projectData.project_settings.project_id) {
      projectData.project_settings.project_id = Date.now();
    }

    const projectId = projectData.project_settings.project_id;
    
    // Формат имени файла: name_projectId.json
    const safeName = name.replace(/[^a-zA-Z0-9а-яА-Я\s_-]/g, '').replace(/\s+/g, '_');
    const fileName = `${safeName}_${projectId}.json`;
    const filePath = path.join(PROJECTS_DIR, fileName);

    // Обновляем даты
    projectData.date_updated = new Date().toISOString();
    if (!projectData.date_created) {
      projectData.date_created = projectData.date_updated;
    }

    // Сохраняем проект
    fs.writeFileSync(filePath, JSON.stringify(projectData, null, 2), 'utf8');
    
    console.log(`✅ [POST /api/projects/save] Проект сохранён: ${fileName}`);
    
    res.json({ 
      result: 'success',
      id: String(projectId),
      fileName: fileName,
      filePath: filePath
    });
  } catch (error) {
    console.error('❌ Ошибка сохранения проекта:', error);
    res.status(500).json({ 
      result: 'error',
      error: error.message 
    });
  }
});

/**
 * GET /api/projects/load/:fileName - Загрузка полного проекта
 * fileName: имя файла проекта (например: project_1234567890.json)
 */
app.get('/api/projects/load/:fileName', (req, res) => {
  try {
    const fileName = req.params.fileName;
    
    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({ 
        result: 'error', 
        error: 'Не указано имя файла' 
      });
    }

    const filePath = path.join(PROJECTS_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        result: 'error', 
        error: 'Проект не найден' 
      });
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const projectData = JSON.parse(content);
    
    console.log(`✅ [GET /api/projects/load/${fileName}] Проект загружен`);
    
    res.json({ 
      result: 'success',
      project: projectData 
    });
  } catch (error) {
    console.error('❌ Ошибка загрузки проекта:', error);
    res.status(500).json({ 
      result: 'error',
      error: error.message 
    });
  }
});

/**
 * GET /api/projects/list - Список всех проектов
 */
app.get('/api/projects/list', (req, res) => {
  try {
    if (!fs.existsSync(PROJECTS_DIR)) {
      return res.json({ 
        result: 'success',
        projects: [] 
      });
    }

    const files = fs.readdirSync(PROJECTS_DIR)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(PROJECTS_DIR, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const projectData = JSON.parse(content);
          const stats = fs.statSync(filePath);
          
          // Извлекаем ID из имени файла
          const match = file.match(/^(.+)_(\d+)\.json$/);
          const projectId = match ? match[2] : '0';
          const name = match ? match[1].replace(/_/g, ' ') : file.replace('.json', '');
          
          return {
            id: projectId,
            name: name,
            fileName: file,
            version: projectData.version || 'unknown',
            date_created: projectData.date_created || stats.birthtime.toISOString(),
            date_updated: projectData.date_updated || stats.mtime.toISOString(),
            objects_count: Array.isArray(projectData.objects) ? projectData.objects.length : 0
          };
        } catch (parseError) {
          console.warn(`⚠️ Ошибка парсинга проекта ${file}:`, parseError);
          return null;
        }
      })
      .filter(item => item !== null);

    console.log(`✅ [GET /api/projects/list] Возвращено ${files.length} проектов`);
    
    res.json({ 
      result: 'success',
      projects: files 
    });
  } catch (error) {
    console.error('❌ Ошибка получения списка проектов:', error);
    res.status(500).json({ 
      result: 'error',
      error: error.message 
    });
  }
});

/**
 * GET /catalog/items_list/ - Получение списка всех элементов каталога
 * 
 * Возвращает массив элементов с информацией:
 * - id, name, type, element_type
 * - created_at, updated_at
 * - data.params (Clodis JSON)
 */
app.get('/catalog/items_list/', (req, res) => {
  try {
    if (!fs.existsSync(MODULES_DIR)) {
      return res.json({ 
        result: 'success',
        items: [] 
      });
    }

    const files = fs.readdirSync(MODULES_DIR)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(MODULES_DIR, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const json = JSON.parse(content);
          const stats = fs.statSync(filePath);
          
          // Извлекаем ID из имени файла (формат: name_id.json)
          const match = file.match(/^(.+)_(\d+)\.json$/);
          const elementId = match ? match[2] : '0';
          const name = match ? match[1].replace(/_/g, ' ') : file.replace('.json', '');
          
          // Формируем ответ в формате Clodis
          return {
            id: elementId,
            name: name,
            type: 'section',
            element_type: 'section',
            created_at: stats.birthtime.toISOString(),
            updated_at: stats.mtime.toISOString(),
            data: {
              params: Array.isArray(json) ? json : (json.children || [json])
            }
          };
        } catch (parseError) {
          console.warn(`⚠️ Ошибка парсинга файла ${file}:`, parseError);
          return null;
        }
      })
      .filter(item => item !== null);

    console.log(`✅ [GET /catalog/items_list/] Возвращено ${files.length} элементов`);
    
    res.json({ 
      result: 'success',
      items: files 
    });
  } catch (error) {
    console.error('❌ Ошибка получения списка элементов каталога:', error);
    res.status(500).json({ 
      result: 'error',
      error: error.message 
    });
  }
});

// Старые endpoints для обратной совместимости

app.get('/api/modules/list', (req, res) => {
  try {
    if (!fs.existsSync(MODULES_DIR)) {
      return res.json({ modules: [] });
    }

    const files = fs.readdirSync(MODULES_DIR)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(MODULES_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          modified: stats.mtime
        };
      });

    res.json({ modules: files });
  } catch (error) {
    console.error('❌ Ошибка получения списка модулей:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/modules/load/:fileName', (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join(MODULES_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json({ json });
  } catch (error) {
    console.error('❌ Ошибка загрузки модуля:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/modules/delete/:fileName', (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join(MODULES_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    fs.unlinkSync(filePath);
    console.log('✅ Модуль удален:', filePath);

    res.json({ success: true, message: 'Модуль удален' });
  } catch (error) {
    console.error('❌ Ошибка удаления модуля:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// API Endpoints для админ-панели
// ============================================

/**
 * GET /api/settings/get_settings - Получение основных параметров системы
 * 
 * Возвращает настройки: order_mail, site_url, address_line, logo и т.д.
 * Пока возвращает mock данные (в продакшене - из БД)
 */
app.get('/api/settings/get_settings', (req, res) => {
  try {
    console.log('🔍 Запрос настроек /api/settings/get_settings');
    
    const settingsPath = path.join(BOOTSTRAP_DIR, 'get_settings_ajax.json');
    
    console.log('🔍 Путь к файлу настроек:', settingsPath);
    console.log('🔍 Файл существует?', fs.existsSync(settingsPath));
    
    if (fs.existsSync(settingsPath)) {
      try {
        const fileContent = fs.readFileSync(settingsPath, 'utf8');
        const fileData = JSON.parse(fileContent);
        console.log('✅ Файл настроек прочитан, размер:', fileContent.length, 'байт');
        
        // Файл get_settings_ajax.json содержит данные конструктора, а не основные параметры
        // account_settings.js ожидает основные параметры (order_mail, site_url и т.д.)
        // Возвращаем mock данные для основных параметров
        const settingsData = {
          order_mail: '',
          site_url: '',
          address_line: '',
          logo: '',
          logo_top: '',
          vk_appid: '',
          interface: '2',
          data: JSON.stringify({
            order_mail: '',
            site_url: '',
            address_line: '',
            logo: '',
            logo_top: '',
            vk_appid: '',
            interface: '2'
          })
        };
        
        console.log('✅ Возвращаем основные параметры (mock данные)');
        res.json(settingsData);
      } catch (parseError) {
        console.error('❌ Ошибка парсинга файла настроек:', parseError);
        throw parseError;
      }
    } else {
      console.warn('⚠️ Файл настроек не найден, возвращаем mock данные');
      res.json({
        order_mail: '',
        site_url: '',
        address_line: '',
        logo: '',
        logo_top: '',
        vk_appid: '',
        interface: '2',
        data: JSON.stringify({
          order_mail: '',
          site_url: '',
          address_line: '',
          logo: '',
          logo_top: '',
          vk_appid: '',
          interface: '2'
        })
      });
    }
  } catch (error) {
    console.error('❌ Ошибка получения настроек:', error);
    console.error('Стек ошибки:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/settings/update_settings/ - Сохранение основных параметров системы
 * 
 * Данные могут приходить в поле 'data' как JSON строка (как в Clodis)
 */
app.post('/api/settings/update_settings/', (req, res) => {
  try {
    let settingsData;
    
    // В Clodis данные приходят в поле 'data' как JSON строка
    if (req.body.data) {
      settingsData = typeof req.body.data === 'string' 
        ? JSON.parse(req.body.data) 
        : req.body.data;
    } else {
      settingsData = req.body;
    }
    
    console.log('✅ Сохранение основных параметров:', settingsData);
    
    // TODO: Сохранить в БД или файл (пока просто возвращаем success)
    res.json({ 
      result: 'success', 
      message: 'Настройки успешно сохранены',
      data: settingsData
    });
  } catch (error) {
    console.error('❌ Ошибка сохранения настроек:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// API: настройки UI конструктора (строка под ценой, иконка ? и попап)
// ============================================
const defaultConstructorUiSettings = {
  show_price_subline: false,
  price_subline_text: '',
  show_price_subline_help_icon: false,
  price_subline_help_text: ''
};

function readConstructorUiSettings() {
  try {
    if (fs.existsSync(CONSTRUCTOR_UI_SETTINGS_FILE)) {
      const raw = fs.readFileSync(CONSTRUCTOR_UI_SETTINGS_FILE, 'utf8');
      const data = JSON.parse(raw);
      return { ...defaultConstructorUiSettings, ...data };
    }
  } catch (e) {
    console.warn('⚠️ constructor_ui_settings read failed:', e?.message);
  }
  return { ...defaultConstructorUiSettings };
}

function writeConstructorUiSettings(data) {
  fs.writeFileSync(CONSTRUCTOR_UI_SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/constructor_ui_settings', (req, res) => {
  try {
    res.json(readConstructorUiSettings());
  } catch (e) {
    console.error('❌ GET /api/constructor_ui_settings:', e);
    res.status(500).json({ error: e?.message || 'read_error' });
  }
});

app.post('/api/constructor_ui_settings', (req, res) => {
  try {
    const body = req.body || {};
    const current = readConstructorUiSettings();
    const next = {
      show_price_subline: !!body.show_price_subline,
      price_subline_text: typeof body.price_subline_text === 'string' ? body.price_subline_text : (current.price_subline_text || ''),
      show_price_subline_help_icon: !!body.show_price_subline_help_icon,
      price_subline_help_text: typeof body.price_subline_help_text === 'string' ? body.price_subline_help_text : (current.price_subline_help_text || '')
    };
    writeConstructorUiSettings(next);
    res.json({ result: 'success', data: next });
  } catch (e) {
    console.error('❌ POST /api/constructor_ui_settings:', e);
    res.status(500).json({ error: e?.message || 'write_error' });
  }
});

function readRoomFurnitureByRoomFile() {
  try {
    if (fs.existsSync(ROOM_FURNITURE_BY_ROOM_FILE)) {
      const raw = fs.readFileSync(ROOM_FURNITURE_BY_ROOM_FILE, 'utf8');
      const data = JSON.parse(raw);
      return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    }
  } catch (e) {
    console.warn('⚠️ room_furniture_by_room read failed:', e?.message);
  }
  return {};
}

function writeRoomFurnitureByRoomFile(data) {
  const payload = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  fs.writeFileSync(ROOM_FURNITURE_BY_ROOM_FILE, JSON.stringify(payload, null, 2), 'utf8');
}

app.get('/api/room_furniture_by_room', (req, res) => {
  try {
    res.json(readRoomFurnitureByRoomFile());
  } catch (e) {
    console.error('❌ GET /api/room_furniture_by_room:', e);
    res.status(500).json({ error: e?.message || 'read_error' });
  }
});

app.post('/api/room_furniture_by_room', (req, res) => {
  try {
    const body = req.body || {};
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'invalid_body' });
    }
    writeRoomFurnitureByRoomFile(body);
    res.json({ result: 'success', data: body });
  } catch (e) {
    console.error('❌ POST /api/room_furniture_by_room:', e);
    res.status(500).json({ error: e?.message || 'write_error' });
  }
});

function readRoomStepsConfigFile() {
  try {
    if (fs.existsSync(ROOM_STEPS_CONFIG_FILE)) {
      const raw = fs.readFileSync(ROOM_STEPS_CONFIG_FILE, 'utf8');
      const data = JSON.parse(raw);
      return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
    }
  } catch (e) {
    console.warn('⚠️ room_steps_config read failed:', e?.message);
  }
  return null;
}

function writeRoomStepsConfigFile(data) {
  const payload = data && typeof data === 'object' && !Array.isArray(data) ? data : { steps: [] };
  fs.writeFileSync(ROOM_STEPS_CONFIG_FILE, JSON.stringify(payload, null, 2), 'utf8');
}

/** Конфиг шагов комнаты (pillSets, section_division, price_subline…) — «Управление комнатой 2». */
app.get('/api/room_steps_config', (req, res) => {
  try {
    const data = readRoomStepsConfigFile();
    res.json(data || { steps: [] });
  } catch (e) {
    console.error('❌ GET /api/room_steps_config:', e);
    res.status(500).json({ error: e?.message || 'read_error' });
  }
});

app.post('/api/room_steps_config', (req, res) => {
  try {
    const body = req.body || {};
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'invalid_body' });
    }
    writeRoomStepsConfigFile(body);
    res.json({ result: 'success', data: body });
  } catch (e) {
    console.error('❌ POST /api/room_steps_config:', e);
    res.status(500).json({ error: e?.message || 'write_error' });
  }
});

// ============================================
// API Endpoints для меню
// ============================================

/**
 * GET /api/menu/get_custom_menu - Получение структуры кастомного меню
 * 
 * Возвращает структуру меню из файла или пустую структуру
 */
app.get('/api/menu/get_custom_menu', (req, res) => {
  try {
    const menuPath = path.join(BOOTSTRAP_DIR, 'get_custom_menu_ajax.json');
    
    console.log('🔍 Запрос меню, путь к файлу:', menuPath);
    console.log('🔍 __dirname:', __dirname);
    console.log('🔍 Файл существует?', fs.existsSync(menuPath));
    
    if (fs.existsSync(menuPath)) {
      const fileContent = fs.readFileSync(menuPath, 'utf8');
      const menuData = JSON.parse(fileContent);
      console.log('✅ Меню загружено из файла, размер:', fileContent.length, 'байт');
      res.json(menuData);
    } else {
      console.warn('⚠️ Файл меню не найден, возвращаем пустое меню');
      res.json({ 
        __custom_menu: {
          id: "3",
          name: "",
          key: "__custom_menu",
          value: JSON.stringify({
            main_menu: [],
            top_menu_left: [],
            top_menu_right: []
          }),
          type: ""
        }
      });
    }
  } catch (error) {
    console.error('❌ Ошибка получения меню:', error);
    console.error('Стек ошибки:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/menu/save_custom_menu - Сохранение структуры кастомного меню
 * 
 * Данные могут приходить в поле 'data' как JSON строка (как в Clodis)
 */
app.post('/api/menu/save_custom_menu', (req, res) => {
  try {
    let menuData;
    
    if (req.body.data) {
      menuData = typeof req.body.data === 'string' 
        ? JSON.parse(req.body.data) 
        : req.body.data;
    } else {
      menuData = req.body;
    }
    
    console.log('✅ Сохранение меню:', menuData);
    
    // TODO: Сохранить в БД или файл (пока просто возвращаем success)
    res.json({ 
      result: 'success', 
      message: 'Меню успешно сохранено',
      data: menuData
    });
  } catch (error) {
    console.error('❌ Ошибка сохранения меню:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// API Endpoints для заявок на расчет
// ============================================

/**
 * GET /api/clients_orders/list - Получение списка заявок на расчет
 * 
 * Возвращает список заявок с информацией: order_number, client_name, email, phone, comment, date, price, status
 * Пока возвращает mock данные (в продакшене - из БД)
 */
app.get('/api/clients_orders/list', (req, res) => {
  try {
    console.log('🔍 Запрос списка заявок');
    
    // Mock данные для разработки (в продакшене - из БД)
    const mockOrders = [
      {
        id: 1,
        order_number: 'ORD-001',
        client_name: 'Иванов Иван Иванович',
        email: 'ivanov@example.com',
        phone: '+7 (999) 123-45-67',
        comment: 'Кухня 3 метра, белый цвет',
        date: new Date('2025-01-06').toLocaleDateString('ru-RU'),
        price: 125000,
        status: 'new'
      },
      {
        id: 2,
        order_number: 'ORD-002',
        client_name: 'Петрова Мария Сергеевна',
        email: 'petrova@example.com',
        phone: '+7 (999) 234-56-78',
        comment: 'Шкаф-купе в спальню',
        date: new Date('2025-01-05').toLocaleDateString('ru-RU'),
        price: 89000,
        status: 'processing'
      },
      {
        id: 3,
        order_number: 'ORD-003',
        client_name: 'Сидоров Петр Александрович',
        email: 'sidorov@example.com',
        phone: '+7 (999) 345-67-89',
        comment: 'Гардеробная комната',
        date: new Date('2025-01-04').toLocaleDateString('ru-RU'),
        price: 156000,
        status: 'completed'
      }
    ];
    
    console.log('✅ Возвращаем список заявок, количество:', mockOrders.length);
    res.json({ 
      result: 'success',
      data: mockOrders,
      count: mockOrders.length
    });
  } catch (error) {
    console.error('❌ Ошибка получения списка заявок:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// API Endpoints для каталога элементов
// ============================================

/**
 * GET /api/catalog/items_get/modules_groups - Получение списка групп
 * 
 * ВАЖНО: Этот маршрут должен быть зарегистрирован ДО универсального /api/catalog/items_get/:type
 * чтобы Express правильно обработал точное совпадение
 */
app.get('/api/catalog/items_get/modules_groups', (req, res) => {
  try {
    console.log('🔍 [СПЕЦИФИЧНЫЙ] Запрос списка групп (специфичный endpoint)');
    console.log('🔍 [СПЕЦИФИЧНЫЙ] URL:', req.url);
    console.log('🔍 [СПЕЦИФИЧНЫЙ] Path:', req.path);
    console.log('📁 Путь к файлу:', MODULES_GROUPS_FILE);
    console.log('📁 Файл существует?', fs.existsSync(MODULES_GROUPS_FILE));
    
    const groups = loadModulesGroups();
    console.log('✅ [СПЕЦИФИЧНЫЙ] Загружено групп из файла:', groups.length);
    console.log('📋 [СПЕЦИФИЧНЫЙ] Группы:', JSON.stringify(groups, null, 2));
    
    // Проверяем, что это массив
    if (!Array.isArray(groups)) {
      console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: loadModulesGroups вернул не массив!', typeof groups);
      return res.status(500).json({ error: 'Неверный формат данных' });
    }
    
    // Возвращаем массив напрямую (не объект с items)
    console.log('✅ [СПЕЦИФИЧНЫЙ] Возвращаем массив из', groups.length, 'элементов');
    res.json(groups);
  } catch (error) {
    console.error('❌ Ошибка получения списка групп:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/catalog/items_get/:type - Получение элементов каталога по типу
 * 
 * Примеры:
 * - /api/catalog/items_get/catalogs_keys - возвращает типы элементов каталога
 * - /api/catalog/items_get/catalog_module - возвращает элементы конкретного типа
 * 
 * Для catalogs_keys возвращает упрощенный формат: [{id, name}]
 * Для других типов возвращает: {items: [...], count: number}
 */
app.get('/api/catalog/items_get/:type', (req, res) => {
  try {
    const type = req.params.type;
    console.log('🔍 [УНИВЕРСАЛЬНЫЙ] Запрос элементов каталога, тип:', type);
    console.log('🔍 [УНИВЕРСАЛЬНЫЙ] URL:', req.url);
    console.log('🔍 [УНИВЕРСАЛЬНЫЙ] Path:', req.path);
    
    // Для catalogs_keys возвращаем типы элементов из файла
    if (type === 'catalogs_keys') {
      const catalogTypes = loadCatalogsKeys();
      console.log('✅ Возвращаем типы элементов (catalogs_keys), количество:', catalogTypes.length);
      // Возвращаем упрощенный формат для таблицы (id, key, name)
      const simplified = catalogTypes.map(item => ({
        id: item.id,
        key: item.key || `catalog_${item.id}`,
        name: item.name,
        order: item.order ?? 0,
        active: item.active ?? 1,
      }));
      res.json(simplified);
      return;
    }
    
    // Для materials_keys возвращаем материалы из файла
    if (type === 'materials_keys') {
      const materials = loadMaterialsKeys();
      console.log('✅ Возвращаем материалы (materials_keys), количество:', materials.length);
      res.json(materials);
      return;
    }
    
    // Для materials_groups возвращаем группы материалов из файла (как modules_groups)
    if (type === 'materials_groups') {
      const groups = loadCatalogItems('materials_groups');
      console.log('✅ Возвращаем группы материалов (materials_groups), количество:', groups.length);
      res.json(Array.isArray(groups) ? groups : []);
      return;
    }

    // Для edges_keys возвращаем наборы кромок из файла
    if (type === 'edges_keys') {
      const edges = loadEdgesKeys();
      console.log('✅ Возвращаем наборы кромок (edges_keys), количество:', edges.length);
      res.json(edges);
      return;
    }
    
    // Фасады: читаем ТОЛЬКО из локального facades.json, без автозаполнения из reference.
    if (type === 'facades') {
      const items = loadCatalogItems('facades');
      console.log('✅ Возвращаем фасады (facades), количество:', items.length);
      res.json({ items, count: items.length });
      return;
    }

    // Серии ручек: catalog_items/handles.json — объект { categories, series }.
    if (type === 'handles') {
      const data = loadHandlesCatalog();
      res.json({
        items: data.series,
        series: data.series,
        categories: data.categories,
        count: data.series.length,
      });
      return;
    }
    
    // ВАЖНО: Для modules_groups НЕ должны попадать сюда, т.к. есть специфичный маршрут выше
    // Но на всякий случай обрабатываем здесь тоже
    if (type === 'modules_groups') {
      console.warn('⚠️ [УНИВЕРСАЛЬНЫЙ] Запрос modules_groups попал в универсальный маршрут! Должен использоваться специфичный!');
      const groups = loadModulesGroups();
      console.log('✅ Возвращаем группы (modules_groups) через универсальный маршрут, количество:', groups.length);
      console.log('📋 Группы:', JSON.stringify(groups, null, 2));
      // Возвращаем массив напрямую (не объект с items)
      res.json(groups);
      return;
    }
    
    // ВАЖНО: Для modules_groups НЕ используем loadCatalogItems, т.к. у них своя функция loadModulesGroups
    // которая уже обработана выше. Если мы дошли сюда с type='modules_groups', значит что-то не так.
    if (type === 'modules_groups') {
      console.error('❌ [УНИВЕРСАЛЬНЫЙ] КРИТИЧЕСКАЯ ОШИБКА: modules_groups попал в loadCatalogItems!');
      console.error('❌ [УНИВЕРСАЛЬНЫЙ] Это не должно происходить, т.к. есть специфичный маршрут выше!');
      const groups = loadModulesGroups();
      return res.json(groups); // Возвращаем массив напрямую
    }
    
    // 1) Сначала пробуем отдать сохранённые в нашем файловом хранилище элементы этого типа
    let stored = loadCatalogItems(type);
    
    // Для catalog_*: sync из db.json ТОЛЬКО если локальный файл пуст (или ?force_db_sync=1).
    // Раньше merge шёл на КАЖДЫЙ items_get + JSON.stringify всего дерева clodisJSON и
    // частая перезапись *.json — из‑за этого список в админке висел 10–15с («Загрузка...»).
    const forceDbSync = String(req.query.force_db_sync || '') === '1';
    if (/^catalog_/i.test(type) && (forceDbSync || !Array.isArray(stored) || stored.length === 0)) {
      try {
        const db = readDB();
        if (db && db.catalog_items && Array.isArray(db.catalog_items)) {
          const dbItems = db.catalog_items.filter(item => {
            const itemCatalogType = item.catalog_type || item.data?.catalog_type || '';
            return itemCatalogType === type;
          });
          
          if (dbItems.length > 0) {
            console.log(`🔄 db sync для "${type}" (force=${forceDbSync ? 1 : 0}, fileEmpty=${!(stored && stored.length)}), db=${dbItems.length}`);

            // Файл — источник истины для админки. db.json только ДОБАВЛЯЕТ/обновляет по id.
            const byId = new Map();
            for (const s of Array.isArray(stored) ? stored : []) {
              const sid = Number(s?.id);
              if (Number.isFinite(sid) && sid > 0) byId.set(sid, s);
            }
            let changed = false;
            for (const dbItem of dbItems) {
              const id = Number(dbItem.id);
              if (!(Number.isFinite(id) && id > 0)) continue;
              const existing = byId.get(id);
              if (existing) {
                const nextClodis = readClodisJSONFromRecord(dbItem);
                const merged = {
                  ...existing,
                  catalog_type: type,
                  name: dbItem.name || existing.name,
                  ...(dbItem.element_type ? { element_type: dbItem.element_type } : {}),
                  ...(dbItem.cabinet_tag ? { cabinet_tag: dbItem.cabinet_tag } : {}),
                  ...(dbItem.category && dbItem.category.length > 0 ? { category: dbItem.category } : {}),
                  ...(dbItem.icon ? { icon: dbItem.icon } : {}),
                  data: dbItem.data || existing.data || {},
                  ...(nextClodis ? { clodisJSON: nextClodis } : {}),
                  ...(dbItem.show_in_constructor !== undefined
                    ? { show_in_constructor: dbItem.show_in_constructor }
                    : {}),
                  ...(dbItem.order !== undefined ? { order: dbItem.order } : {}),
                };
                // Лёгкое сравнение — без JSON.stringify всего модуля (clodisJSON может быть МБ).
                const touched =
                  merged.name !== existing.name ||
                  merged.icon !== existing.icon ||
                  merged.order !== existing.order ||
                  merged.show_in_constructor !== existing.show_in_constructor ||
                  merged.element_type !== existing.element_type ||
                  merged.cabinet_tag !== existing.cabinet_tag ||
                  (nextClodis && nextClodis !== existing.clodisJSON &&
                    JSON.stringify(nextClodis) !== JSON.stringify(existing.clodisJSON));
                if (touched) {
                  byId.set(id, merged);
                  changed = true;
                }
              } else {
                byId.set(id, {
                  id,
                  catalog_type: type,
                  name: dbItem.name || 'Элемент',
                  ...(dbItem.element_type ? { element_type: dbItem.element_type } : {}),
                  ...(dbItem.cabinet_tag ? { cabinet_tag: dbItem.cabinet_tag } : {}),
                  ...(dbItem.category && dbItem.category.length > 0 ? { category: dbItem.category } : {}),
                  ...(dbItem.icon ? { icon: dbItem.icon } : {}),
                  data: dbItem.data || {},
                  ...(readClodisJSONFromRecord(dbItem)
                    ? { clodisJSON: readClodisJSONFromRecord(dbItem) }
                    : {}),
                  ...(dbItem.show_in_constructor !== undefined
                    ? { show_in_constructor: dbItem.show_in_constructor }
                    : {}),
                  ...(dbItem.order !== undefined ? { order: dbItem.order } : {}),
                });
                changed = true;
              }
            }
            const mergedList = Array.from(byId.values()).sort(
              (a, b) => Number(a.id) - Number(b.id)
            );
            if (changed) {
              saveCatalogItems(type, mergedList);
              console.log(
                `✅ Merge db.json→файл для "${type}": было ${(stored && stored.length) || 0}, стало ${mergedList.length}`
              );
            }
            stored = mergedList;
          }
        }
      } catch (syncError) {
        console.warn(`⚠️ Ошибка синхронизации db.json для типа "${type}":`, syncError?.message || syncError);
      }
    }
    
    if (Array.isArray(stored) && stored.length > 0) {
      // Специальный случай: server-side пагинация и фильтрация для материалов 3D моделей (model_key_material)
      if (type === 'model_key_material') {
        const qRaw = (req.query.q || '').toString().trim().toLowerCase();
        const catRaw = (req.query.category || '').toString().trim();
        const page = parseInt((req.query.page || '1').toString(), 10) || 1;
        const perPage = parseInt((req.query.per_page || req.query.perPage || '20').toString(), 10) || 20;

        let filtered = stored;

        if (qRaw) {
          filtered = filtered.filter((it) => {
            const name = (it?.name || '').toString().toLowerCase();
            const idStr = String(it?.id ?? '');
            return name.includes(qRaw) || idStr.includes(qRaw);
          });
        }

        if (catRaw) {
          const normCat = catRaw;
          filtered = filtered.filter((it) => {
            const c = it?.category;
            if (Array.isArray(c)) return (c[0] ?? '').toString() === normCat;
            if (typeof c === 'string') {
              const trimmed = c.trim();
              if (!trimmed || trimmed === '[]') return normCat === '';
              if (trimmed[0] === '[') {
                try {
                  const parsed = JSON.parse(trimmed);
                  if (Array.isArray(parsed)) return (parsed[0] ?? '').toString() === normCat;
                } catch (_) {
                  return false;
                }
              }
              return trimmed === normCat;
            }
            return (c ?? '').toString() === normCat;
          });
        }

        const total = filtered.length;
        const start = (page - 1) * perPage;
        const items = filtered.slice(start, start + perPage);

        console.log(`✅ Возвращаем model_key_material (page=${page}, perPage=${perPage}), всего: ${total}, на странице: ${items.length}`);
        return res.json({ items, count: total });
      }

      console.log(`✅ Возвращаем сохранённые элементы для типа "${type}", количество:`, stored.length);
      return res.json({ items: stored, count: stored.length });
    }

    // Для типов материалов (material_*) и кромок (butt_*) по логике админки новый тип должен начинаться с ПУСТОГО списка.
    // Поэтому, если нет локальных данных, не подмешиваем mock из референса, а отдаем пустой список.
    if (/^material_/i.test(type)) {
      console.log(`ℹ️ Тип "${type}" (materials) не имеет локальных элементов, возвращаем пустой список без mock-данных`);
      return res.json({ items: [], count: 0 });
    }
    // То же самое — специально для материалов 3D моделей (model_key_material):
    // по умолчанию список должен быть пустым, пока пользователь сам не наполнит его.
    if (type === 'model_key_material') {
      console.log('ℹ️ Тип "model_key_material" не имеет локальных элементов, возвращаем пустой список без mock-данных');
      return res.json({ items: [], count: 0 });
    }
    if (/^butt_/i.test(type)) {
      console.log(`ℹ️ Тип "${type}" (edges) не имеет локальных элементов, возвращаем пустой список без mock-данных`);
      return res.json({ items: stored, count: (stored || []).length });
    }
    // Для catalog_* — если локальный список пуст, не подставлять mock из референса
    if (/^catalog_/i.test(type)) {
      console.log(`ℹ️ Тип "${type}" (каталог) не имеет локальных элементов, возвращаем пустой список`);
      return res.json({ items: [], count: 0 });
    }
    // Модели цоколя: пустой список, без mock из items_get_pagination_multi.json
    if (type === 'cokol_items' || type === 'cokol_categories') {
      const list = Array.isArray(stored) ? stored : [];
      return res.json({ items: list, count: list.length });
    }

    // Для других типов - проверяем, не это ли список элементов каталога
    // По референсу: /catalog/items_get/{controller_name} возвращает {items: [...], count: 88}
    
    // Попробуем загрузить из файла items_get_pagination_multi.json (если есть данные для этого типа)
    const itemsFile = path.join(BOOTSTRAP_DIR, 'items_get_pagination_multi.json');
    if (fs.existsSync(itemsFile)) {
      try {
        const fileData = fs.readFileSync(itemsFile, 'utf8');
        const itemsData = JSON.parse(fileData);
        
        // Если есть items в файле, возвращаем их (для всех типов пока одинаковые mock данные)
        // В реальности нужно фильтровать по типу (controller_name)
        if (itemsData.items && Array.isArray(itemsData.items)) {
          console.log(`✅ Возвращаем элементы каталога для типа "${type}", количество:`, itemsData.items.length);
          res.json({
            items: itemsData.items,
            count: itemsData.count || itemsData.items.length
          });
          return;
        }
      } catch (error) {
        console.error('❌ Ошибка чтения items_get_pagination_multi.json:', error.message);
      }
    }
    
    // Если файла нет или ошибка - возвращаем пустой массив
    console.log('⚠️ Тип элементов не обработан, возвращаем пустой массив');
    res.json({ items: [], count: 0 });
  } catch (error) {
    console.error('❌ Ошибка получения элементов каталога:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/catalog/categories_get/:name - Категории для конструктора/админки
 * Поддерживает: butts_keys, material_ldsp, catalog_module и т.д.
 */
/** Модули конструктора без своего categories_*.json — те же рубрики, что у «Шкафы» (catalog_26). */
const CATALOG_CATEGORIES_FALLBACK = {
  catalog_27: 'catalog_26',
  catalog_28: 'catalog_26',
  catalog_29: 'catalog_26',
  catalog_30: 'catalog_26',
  catalog_31: 'catalog_26',
  catalog_32: 'catalog_26',
  catalog_33: 'catalog_26',
  catalog_34: 'catalog_26',
};

function loadCategories(type) {
  const file = path.join(CATALOG_ITEMS_DIR, `categories_${type}.json`);
  try {
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf8');
      const data = JSON.parse(raw || '[]');
      return Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.warn('⚠️ Ошибка загрузки категорий:', e?.message);
  }
  return [];
}

function loadCategoriesWithFallback(type) {
  if (type === 'handles') {
    const data = loadHandlesCatalog();
    if (data.categories.length > 0) return data.categories;
  }
  const direct = loadCategories(type);
  if (direct.length > 0) return direct;
  const fb = CATALOG_CATEGORIES_FALLBACK[type];
  if (fb) {
    const fromParent = loadCategories(fb);
    if (fromParent.length > 0) {
      console.log(`ℹ️ categories_get/${type}: используем категории из ${fb}`);
      return fromParent;
    }
  }
  return [];
}

function saveCategories(type, data) {
  const file = path.join(CATALOG_ITEMS_DIR, `categories_${type}.json`);
  try {
    if (!fs.existsSync(CATALOG_ITEMS_DIR)) fs.mkdirSync(CATALOG_ITEMS_DIR, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(Array.isArray(data) ? data : [], null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('❌ Ошибка сохранения категорий:', e);
    return false;
  }
}

/**
 * Одна секция cabinet_root по размерам — если в файле каталога нет сохранённого дерева конструктора.
 * Без этого export_all отфильтровывает элемент → в localStorage пусто и модуль «пропадает» из шага 4.
 */
function buildMinimalClodisJSONForExport(widthMm, heightMm, depthMm, itemId) {
  const x = Math.max(1, Math.round(Number(widthMm) || 600));
  const y = Math.max(1, Math.round(Number(heightMm) || 2400));
  const z = Math.max(1, Math.round(Number(depthMm) || 600));
  const sid = itemId != null && String(itemId).trim() !== '' ? String(itemId) : 'noid';
  return [
    {
      type: 'section',
      id: 'cld_export_fallback_' + sid + '_' + x + '_' + y + '_' + z,
      name: 'Секция',
      originalType: 'section',
      hide_when_filled: false,
      active: true,
      article: '',
      children: [],
      accessories: [],
      size: { x, y, z },
      position: { x: 0, y: 0, z: 0 },
      anchor: { x: -1, y: -1, z: -1 },
      rotation: { x: 0, y: 0, z: 0 },
      layout_role: 'cabinet_root',
      comments: '',
      events: {},
    },
  ];
}

/**
 * GET /api/catalog/export_all_for_constructor - Массовая выгрузка всех каталогов в формате для localStorage
 * Возвращает { catalogs: { catalog_1: [...], ... }, categories: { catalog_1: [...], ... } }
 */
app.get('/api/catalog/export_all_for_constructor', (req, res) => {
  try {
    const catalogTypes = loadCatalogsKeys();
    const catalogs = {};
    const categories = {};
    const catalogTypeKeys = (catalogTypes || [])
      .map(t => (t.key || t.id ? `catalog_${t.id}` : null))
      .filter(Boolean);
    for (const typeKey of catalogTypeKeys) {
      if (typeKey === 'catalogs_keys') continue;
      const items = loadCatalogItems(typeKey);
      if (!Array.isArray(items) || items.length === 0) continue;
      const rawType = typeKey.replace(/^catalog_/, '');
      const list = items.map(it => {
        const data = unwrapCatalogItemData(it);
        const cs = data.constructor_structure || it.constructor_structure;
        let clodisJSON = [];
        // Как админка: children = канон. template/spec/clodisJSON могут отставать.
        if (cs) {
          if (cs.type === 'module' && Array.isArray(cs.children) && cs.children.length) {
            clodisJSON = cs.children;
          } else if (Array.isArray(cs.children) && cs.children.length) {
            clodisJSON = cs.children;
          } else if (cs.template && Array.isArray(cs.template.structure) && cs.template.structure.length) {
            clodisJSON = cs.template.structure;
          } else if (cs.spec && cs.spec.template && Array.isArray(cs.spec.template.tree)) {
            clodisJSON = cs.spec.template.tree;
          } else if (Array.isArray(cs)) {
            clodisJSON = cs;
          }
        }
        // JSON сохраняется в разных форматах: clodisJSON, data.params, или data как массив (вкладка JSON)
        if (clodisJSON.length === 0) {
          const ppj =
            readClodisJSONFromRecord(data) ?? readClodisJSONFromRecord(it);
          if (Array.isArray(ppj) && ppj.length > 0) {
            clodisJSON = ppj;
            console.log(`✅ [export_all_for_constructor] Найден clodisJSON для "${data.name ?? it.name}" из ${data.clodisJSON ? 'data.clodisJSON' : 'it.clodisJSON'}, длина: ${ppj.length}`);
          } else if (data.params) {
            const params = Array.isArray(data.params) ? data.params : [data.params];
            if (params.length > 0 && params.some(p => p && (p.type === 'section' || p.type === 'wall'))) {
              clodisJSON = params;
              console.log(`✅ [export_all_for_constructor] Найден clodisJSON для "${data.name ?? it.name}" из data.params, длина: ${params.length}`);
            }
          } else if (Array.isArray(data) && data.length > 0 && data.some(p => p && (p.type === 'section' || p.type === 'wall'))) {
            clodisJSON = data;
            console.log(`✅ [export_all_for_constructor] Найден clodisJSON для "${it.name}" из data (массив), длина: ${data.length}`);
          } else if (typeof data === 'object' && (data.type === 'section' || data.type === 'wall')) {
            clodisJSON = [data];
            console.log(`✅ [export_all_for_constructor] Найден clodisJSON для "${it.name}" из data (объект)`);
          } else {
            console.warn(`⚠️ [export_all_for_constructor] НЕ найден clodisJSON для "${data.name ?? it.name}" (ID: ${it.id ?? data.id})`);
            console.warn(`  Проверка: it.clodisJSON = ${it.clodisJSON ? 'есть' : 'нет'}, data.clodisJSON = ${data.clodisJSON ? 'есть' : 'нет'}, data.params = ${data.params ? 'есть' : 'нет'}`);
          }
        }
        const showIn = data.show_in_constructor ?? it.show_in_constructor ?? '1';
        const w = parseInt(data.width ?? it.width ?? 0, 10) || 600;
        const h = parseInt(data.height ?? it.height ?? 0, 10) || 2400;
        const d = parseInt(data.depth ?? it.depth ?? 0, 10) || 600;
        const params = { sectionSize: { x: w, y: h, z: d } };
        let effectivePlan = clodisJSON;
        if (!Array.isArray(effectivePlan) || effectivePlan.length === 0) {
          effectivePlan = buildMinimalClodisJSONForExport(w, h, d, it.id ?? data.id);
          console.warn(
            `⚠️ [export_all_for_constructor] «${data.name ?? it.name}» (id ${it.id}): нет clodisJSON — подставлен каркас по размерам ${w}×${h}×${d}. Сохраните конструктор в админке для полной геометрии.`
          );
        }
        // URL иконки модуля: берём из разных возможных мест, если указано.
        const icon =
          (data && typeof data === 'object' && (data.icon || data.icon_url)) ||
          (it && (it.icon || it.icon_url)) ||
          null;
        const roomTags = data.roomTags ?? it.roomTags;
        const doorKind = data.doorKind ?? it.doorKind;
        const placementKind = data.placementKind ?? it.placementKind;
        const clodisVariables = pickClodisVariablesFromRecord(data, it);
        const pairedCatalogItemIds =
          data.pairedCatalogItemIds ?? it.pairedCatalogItemIds;
        const doorVariantGroup = data.doorVariantGroup ?? it.doorVariantGroup;
        const iconAspectRaw = pickIconAspectFromCatalogRecord(it);
        const out = {
          id: it.id ?? data.id,
          name: data.name ?? it.name ?? '',
          clodisJSON: effectivePlan,
          params,
          show_in_constructor: showIn,
          showInRoom: showIn === '1' || showIn === true,
          category: data.category ?? it.category,
          width: w,
          height: h,
          depth: d,
          ...(icon ? { icon } : {}),
        };
        if (roomTags && typeof roomTags === 'object') out.roomTags = roomTags;
        if (doorKind === 'single' || doorKind === 'double') out.doorKind = doorKind;
        if (placementKind) out.placementKind = placementKind;
        if (clodisVariables && typeof clodisVariables === 'object') {
          out.clodisVariables = clodisVariables;
        }
        if (pairedCatalogItemIds && typeof pairedCatalogItemIds === 'object') {
          out.pairedCatalogItemIds = pairedCatalogItemIds;
        }
        if (doorVariantGroup) out.doorVariantGroup = doorVariantGroup;
        if (iconAspectRaw) out.iconAspect = iconAspectRaw;
        const placementKindOut = data.placementKind ?? it.placementKind;
        if (!iconAspectRaw && placementKindOut === 'standalone_floor') {
          const h = parseInt(data.height ?? it.height ?? 0, 10) || 0;
          if (h > 0 && h <= 1200) out.iconAspect = 'low';
        }
        const drawerNoHandle =
          data.drawerNoHandle === true ||
          data.drawerNoHandle === 1 ||
          data.drawerNoHandle === '1' ||
          it.drawerNoHandle === true ||
          it.drawerNoHandle === 1 ||
          it.drawerNoHandle === '1';
        if (drawerNoHandle) {
          out.drawerNoHandle = true;
          const baseData =
            data && typeof data === 'object' && !Array.isArray(data) ? { ...data } : {};
          out.data = { ...baseData, drawerNoHandle: true };
        }
        if (data.drawerStack && typeof data.drawerStack === 'object') {
          out.drawerStack = data.drawerStack;
        }
        if (data.shelfStack && typeof data.shelfStack === 'object') {
          out.shelfStack = data.shelfStack;
        }
        if (data.interiorLayout && typeof data.interiorLayout === 'object') {
          out.interiorLayout = data.interiorLayout;
        }
        if (data.interiorTemplates && typeof data.interiorTemplates === 'object') {
          out.interiorTemplates = data.interiorTemplates;
        }
        return out;
      });
      // Всегда отдаём ключ (даже []) — иначе клиент не делает setItem и в localStorage вечно лежит старый массив.
      catalogs[typeKey] = list;
      const cats = loadCategoriesWithFallback(typeKey);
      if (cats.length > 0) {
        categories[typeKey] = cats;
      }
    }
    res.json({ catalogs, categories });
  } catch (e) {
    console.error('❌ export_all_for_constructor:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/catalog/categories_get/:name', (req, res) => {
  try {
    const name = req.params.name;
    console.log('🔍 Запрос категорий, name:', name);

    const stored = loadCategoriesWithFallback(name);
    if (stored.length > 0) {
      return res.json(stored);
    }

    const refPath = path.join(BOOTSTRAP_DIR, `categories_get_${name}.json`);
    if (fs.existsSync(refPath)) {
      const raw = fs.readFileSync(refPath, 'utf8');
      const data = JSON.parse(raw);
      return res.json(Array.isArray(data) ? data : (data.items || data));
    }

    res.json([]);
  } catch (error) {
    console.error('❌ Ошибка выдачи категорий:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/category_add/:type - Добавление категории (по референсу Clodis)
 * type: butts_keys, material_ldsp, catalog_module и т.д.
 * body: name, parent (id или null), description
 */
app.post('/api/catalog/category_add/:type', (req, res) => {
  try {
    const type = req.params.type;
    const data = req.body;
    const name = (data.name || '').toString().trim();
    const parent = data.parent === null || data.parent === '' || data.parent === undefined ? null : parseInt(data.parent) || null;
    const description = (data.description || '').toString().trim();

    if (!name) {
      return res.json('empty_name');
    }

    const categories = loadCategories(type);
    const maxId = categories.length > 0 ? Math.max(...categories.map(c => c.id || 0)) : 0;
    const newCat = {
      id: maxId + 1,
      name: name || 'Без названия',
      parent: parent,
      description: description,
      active: 1,
      iconAspect:
        data.iconAspect === 'low' || data.iconAspect === 'short' ? 'low' : 'tall',
    };
    categories.push(newCat);

    if (saveCategories(type, categories)) {
      res.json({ result: 'success', item: newCat });
    } else {
      res.status(500).json({ error: 'Ошибка сохранения' });
    }
  } catch (error) {
    console.error('❌ Ошибка category_add:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/category_edit/:type - Редактирование категории
 * body: id, name?, parent?, description?, active?
 */
app.post('/api/catalog/category_edit/:type', (req, res) => {
  try {
    const type = req.params.type;
    const data = req.body;
    const id = parseInt(data.id);
    if (!id) return res.status(400).json({ error: 'id обязателен' });
    const categories = loadCategories(type);
    const idx = categories.findIndex(c => (c.id || 0) === id);
    if (idx < 0) return res.status(404).json({ error: 'Категория не найдена' });
    if (data.name !== undefined) categories[idx].name = (data.name || '').toString().trim() || categories[idx].name;
    if (data.parent !== undefined) categories[idx].parent = data.parent === null || data.parent === '' ? null : parseInt(data.parent) || categories[idx].parent;
    if (data.description !== undefined) categories[idx].description = (data.description || '').toString().trim();
    if (data.active !== undefined) categories[idx].active = data.active === 1 || data.active === true || data.active === '1' ? 1 : 0;
    if (data.iconAspect !== undefined) {
      categories[idx].iconAspect =
        data.iconAspect === 'low' || data.iconAspect === 'short' ? 'low' : 'tall';
    }
    if (saveCategories(type, categories)) res.json({ result: 'success', item: categories[idx] });
    else res.status(500).json({ error: 'Ошибка сохранения' });
  } catch (error) {
    console.error('❌ Ошибка category_edit:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/category_delete/:type - Удаление категории
 * body: id. Если есть дочерние — удаляет только если move_children_to указан (id родителя).
 */
app.post('/api/catalog/category_delete/:type', (req, res) => {
  try {
    const type = req.params.type;
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const id = parseInt(body.id, 10);
    if (!id || isNaN(id)) return res.status(400).json({ error: 'id обязателен' });
    const categories = loadCategories(type);
    const children = categories.filter(c => (c.parent || null) === id);
    const moveTo = body.move_children_to !== undefined ? parseInt(body.move_children_to, 10) : null;
    if (children.length > 0 && moveTo === undefined) {
      return res.json({ error: 'has_children', count: children.length });
    }
    const next = categories.filter(c => (c.id || 0) !== id);
    if (children.length > 0) {
      const newParent = (moveTo === null || moveTo === undefined) ? null : moveTo;
      next.forEach(c => { if ((c.parent || null) === id) c.parent = newParent; });
    }
    if (saveCategories(type, next)) res.json({ result: 'success' });
    else res.status(500).json({ error: 'Ошибка сохранения' });
  } catch (error) {
    console.error('❌ Ошибка category_delete:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/catalog/item/catalogs_keys/:id - Получение одного типа элемента по ID
 */
app.get('/api/catalog/item/catalogs_keys/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    console.log('🔍 Запрос типа элемента по ID:', itemId);
    
    const catalogTypes = loadCatalogsKeys();
    const item = catalogTypes.find(t => t.id === itemId);
    
    if (item) {
      console.log('✅ Найден тип элемента:', item);
      res.json(item);
    } else {
      console.log('⚠️ Тип элемента не найден, ID:', itemId);
      res.status(404).json({ error: 'Тип элемента не найден' });
    }
  } catch (error) {
    console.error('❌ Ошибка получения типа элемента:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/item_add/catalogs_keys/ - Добавление нового типа элемента
 * 
 * Данные могут приходить в поле 'data' как JSON строка (как в Clodis)
 * Обязательные поля: name, order, active
 */
app.post('/api/catalog/item_add/catalogs_keys/', (req, res) => {
  try {
    console.log('➕ Добавление нового типа элемента');
    console.log('📦 Данные запроса (req.body):', JSON.stringify(req.body, null, 2));
    
    // В Clodis данные приходят в поле 'data' как JSON строка
    let data;
    try {
      if (req.body.data) {
        data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
      } else {
        data = req.body;
      }
    } catch (parseError) {
      console.error('❌ Ошибка парсинга данных:', parseError.message);
      return res.status(400).json({ error: `Ошибка парсинга данных: ${parseError.message}` });
    }
    
    console.log('📋 Распарсенные данные:', JSON.stringify(data, null, 2));
    
    // Загружаем существующие данные из файла
    let catalogTypes;
    try {
      catalogTypes = loadCatalogsKeys();
      if (!Array.isArray(catalogTypes)) {
        throw new Error('loadCatalogsKeys вернул не массив');
      }
    } catch (loadError) {
      console.error('❌ Ошибка загрузки данных из файла:', loadError.message);
      return res.status(500).json({ error: `Ошибка загрузки данных: ${loadError.message}` });
    }
    
    // Генерируем новый ID (находим максимальный ID и добавляем 1)
    const maxId = catalogTypes.length > 0 ? Math.max(...catalogTypes.map(item => item.id || 0)) : 0;
    const newId = maxId + 1;
    
    const newItem = mergeCatalogTypeItem(null, data, newId);
    
    console.log('✅ Создан новый тип элемента:', newItem);
    
    // Добавляем новый элемент в массив
    catalogTypes.push(newItem);
    
    // Сортируем по order
    catalogTypes.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Сохраняем в файл
    try {
      if (saveCatalogsKeys(catalogTypes)) {
        res.json({ 
          result: 'success',
          item: newItem,
          message: 'Тип элемента успешно добавлен'
        });
      } else {
        console.error('❌ saveCatalogsKeys вернул false');
        res.status(500).json({ error: 'Ошибка сохранения в файл' });
      }
    } catch (saveError) {
      console.error('❌ Ошибка при сохранении в файл:', saveError.message);
      console.error('   Stack:', saveError.stack);
      res.status(500).json({ error: `Ошибка сохранения: ${saveError.message}` });
    }
  } catch (error) {
    console.error('❌ Ошибка добавления типа элемента:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/item_edit/catalogs_keys/:id - Редактирование типа элемента
 * 
 * Данные могут приходить в поле 'data' как JSON строка (как в Clodis)
 * Обязательные поля: name, order, active
 */
app.post('/api/catalog/item_edit/catalogs_keys/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    console.log('✏️ Редактирование типа элемента, ID:', itemId);
    console.log('📦 Данные запроса (req.body):', req.body);
    
    // В Clodis данные приходят в поле 'data' как JSON строка
    let data;
    if (req.body.data) {
      data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
    } else {
      data = req.body;
    }
    
    console.log('📋 Распарсенные данные:', data);
    
    // Загружаем существующие данные из файла
    const catalogTypes = loadCatalogsKeys();
    
    // Находим индекс элемента для обновления
    const itemIndex = catalogTypes.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Тип элемента не найден' });
    }
    
    // Обновляем элемент (сохраняем key при отсутствии в data)
    const existing = catalogTypes[itemIndex];
    const updatedItem = mergeCatalogTypeItem(existing, data, itemId);
    catalogTypes[itemIndex] = updatedItem;
    
    // Сортируем по order
    catalogTypes.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    console.log('✅ Обновлен тип элемента:', updatedItem);
    
    // Сохраняем в файл
    if (saveCatalogsKeys(catalogTypes)) {
      res.json({ 
        result: 'success',
        item: updatedItem,
        message: 'Тип элемента успешно обновлен'
      });
    } else {
      res.status(500).json({ error: 'Ошибка сохранения в файл' });
    }
  } catch (error) {
    console.error('❌ Ошибка редактирования типа элемента:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/catalog/item_delete/catalogs_keys/:id - Удаление типа элемента
 */
app.delete('/api/catalog/item_delete/catalogs_keys/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    console.log('🗑️ Удаление типа элемента, ID:', itemId);
    
    // Загружаем существующие данные из файла
    const catalogTypes = loadCatalogsKeys();
    
    // Находим индекс элемента для удаления
    const itemIndex = catalogTypes.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Тип элемента не найден' });
    }
    
    const deletedItem = catalogTypes.splice(itemIndex, 1)[0];

    console.log('✅ Удален тип элемента:', deletedItem);
    
    // Сохраняем в файл
    if (saveCatalogsKeys(catalogTypes)) {
      res.json({ 
        result: 'success',
        message: 'Тип элемента успешно удален',
        deletedItem: deletedItem
      });
    } else {
      res.status(500).json({ error: 'Ошибка сохранения в файл' });
    }
  } catch (error) {
    console.error('❌ Ошибка удаления типа элемента:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Вспомогательные функции для работы с edges_keys
// ============================================

function loadEdgesKeys() {
  try {
    if (fs.existsSync(EDGES_KEYS_FILE)) {
      const fileData = fs.readFileSync(EDGES_KEYS_FILE, 'utf8');
      if (!fileData || fileData.trim() === '') {
        const defaultData = [{ id: 1, name: 'Набор по умолчанию', key: 'butts', order: 0, active: 1 }];
        saveEdgesKeys(defaultData);
        return defaultData;
      }
      const parsed = JSON.parse(fileData);
      return Array.isArray(parsed) ? parsed : [];
    }
    const defaultData = [{ id: 1, name: 'Набор по умолчанию', key: 'butts', order: 0, active: 1 }];
    saveEdgesKeys(defaultData);
    return defaultData;
  } catch (error) {
    console.error('❌ Ошибка загрузки edges_keys:', error);
    return [{ id: 1, name: 'Набор по умолчанию', key: 'butts', order: 0, active: 1 }];
  }
}

function saveEdgesKeys(data) {
  try {
    const dataDir = path.dirname(EDGES_KEYS_FILE);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(EDGES_KEYS_FILE, JSON.stringify(Array.isArray(data) ? data : [], null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('❌ Ошибка сохранения edges_keys:', error);
    return false;
  }
}

// ============================================
// Вспомогательные функции для работы с materials_keys
// ============================================

/**
 * Загружает материалы из файла materials_keys.json
 * По аналогии с loadCatalogsKeys
 */
function loadMaterialsKeys() {
  try {
    if (fs.existsSync(MATERIALS_KEYS_FILE)) {
      const fileData = fs.readFileSync(MATERIALS_KEYS_FILE, 'utf8');
      
      if (!fileData || fileData.trim() === '') {
        console.log('📂 Файл materials_keys.json пуст, создаем дефолтные данные');
        const defaultData = [];
        saveMaterialsKeys(defaultData);
        return defaultData;
      }
      
      const parsed = JSON.parse(fileData);
      if (!Array.isArray(parsed)) {
        console.warn('⚠️ materials_keys.json не является массивом, создаем новый');
        const defaultData = [];
        saveMaterialsKeys(defaultData);
        return defaultData;
      }
      
      console.log('📂 Загружено материалов из файла:', parsed.length);
      return parsed;
    } else {
      console.log('📂 Файл materials_keys.json не существует, создаем дефолтные данные');
      const defaultData = [];
      saveMaterialsKeys(defaultData);
      return defaultData;
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки материалов:', error);
    const defaultData = [];
    saveMaterialsKeys(defaultData);
    return defaultData;
  }
}

/**
 * Сохраняет материалы в файл materials_keys.json
 * По аналогии с saveCatalogsKeys
 */
function saveMaterialsKeys(data) {
  try {
    // Создаем директорию если её нет
    const dataDir = path.dirname(MATERIALS_KEYS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const jsonData = JSON.stringify(Array.isArray(data) ? data : [], null, 2);
    fs.writeFileSync(MATERIALS_KEYS_FILE, jsonData, 'utf8');
    console.log('💾 Материалы сохранены в файл:', MATERIALS_KEYS_FILE);
    return true;
  } catch (error) {
    console.error('❌ Ошибка сохранения материалов:', error);
    return false;
  }
}

// ============================================
// API Endpoints для материалов (materials_keys)
// ============================================

/**
 * GET /api/catalog/items_get/materials_keys - Получение списка материалов
 */
app.get('/api/catalog/items_get/materials_keys', (req, res) => {
  try {
    console.log('🔍 Запрос списка материалов');
    const materials = loadMaterialsKeys();
    console.log('✅ Возвращаем материалы, количество:', materials.length);
    res.json(materials);
  } catch (error) {
    console.error('❌ Ошибка получения материалов:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/catalog/item/materials_keys/:id - Получение одного материала по ID
 */
app.get('/api/catalog/item/materials_keys/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    console.log('🔍 Запрос материала по ID:', itemId);
    
    const materials = loadMaterialsKeys();
    const item = materials.find(t => t.id === itemId);
    
    if (item) {
      console.log('✅ Найден материал:', item);
      res.json(item);
    } else {
      console.log('⚠️ Материал не найден, ID:', itemId);
      res.status(404).json({ error: 'Материал не найден' });
    }
  } catch (error) {
    console.error('❌ Ошибка получения материала:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/item_add/materials_keys/ - Добавление нового материала
 */
app.post('/api/catalog/item_add/materials_keys/', (req, res) => {
  try {
    console.log('➕ Добавление нового материала');
    console.log('📦 Данные запроса:', JSON.stringify(req.body, null, 2));
    
    let data;
    if (req.body.data) {
      data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
    } else {
      data = req.body;
    }
    
    const materials = loadMaterialsKeys();
    const maxId = materials.length > 0 ? Math.max(...materials.map(item => item.id || 0)) : 0;
    const newId = maxId + 1;
    
    const newItem = {
      id: newId,
      name: data.name || '',
      key: (data.key || '').toString().trim() || undefined,
      edges_set: (data.edges_set || data.edgesSet || 'butts').toString(),
      edge_in_menu: data.edge_in_menu == 1 || data.edgeInMenu == 1 ? 1 : 0,
      order: data.order !== undefined ? parseInt(data.order) || 0 : 0,
      active: data.active !== undefined ? (data.active == '1' || data.active === 1 ? 1 : 0) : 1
    };
    
    materials.push(newItem);
    materials.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    if (saveMaterialsKeys(materials)) {
      res.json({ 
        result: 'success',
        item: newItem,
        message: 'Материал успешно добавлен'
      });
    } else {
      res.status(500).json({ error: 'Ошибка сохранения в файл' });
    }
  } catch (error) {
    console.error('❌ Ошибка добавления материала:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Алиас /api/catalog/item_get/:type/:id → /api/catalog/item/:type/:id
 *
 * В некоторых частях админки (например, admin-models3d-materials.js) используется старый путь item_get.
 * Чтобы не переписывать фронтенд, добавляем совместимый маршрут.
 */
app.get('/api/catalog/item_get/:type/:id', (req, res) => {
  const { type, id } = req.params;
  req.url = `/api/catalog/item/${encodeURIComponent(type)}/${encodeURIComponent(String(id))}`;
  return app._router.handle(req, res);
});

/**
 * POST /api/catalog/item_edit/materials_keys/:id - Редактирование материала
 */
app.post('/api/catalog/item_edit/materials_keys/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    console.log('✏️ Редактирование материала, ID:', itemId);
    
    let data;
    if (req.body.data) {
      data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
    } else {
      data = req.body;
    }
    
    const materials = loadMaterialsKeys();
    const itemIndex = materials.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Материал не найден' });
    }
    
    const existing = materials[itemIndex];
    const updatedItem = {
      id: itemId,
      name: data.name || '',
      key: (data.key || '').toString().trim() || existing.key,
      edges_set: (data.edges_set || data.edgesSet || 'butts').toString(),
      edge_in_menu: data.edge_in_menu == 1 || data.edgeInMenu == 1 ? 1 : 0,
      order: data.order !== undefined ? parseInt(data.order) || 0 : (existing.order ?? 0),
      active: data.active !== undefined ? (data.active == '1' || data.active === 1 ? 1 : 0) : (existing.active ?? 1)
    };
    
    materials[itemIndex] = updatedItem;
    materials.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    if (saveMaterialsKeys(materials)) {
      res.json({ 
        result: 'success',
        item: updatedItem,
        message: 'Материал успешно обновлен'
      });
    } else {
      res.status(500).json({ error: 'Ошибка сохранения в файл' });
    }
  } catch (error) {
    console.error('❌ Ошибка редактирования материала:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/catalog/item_delete/materials_keys/:id - Удаление материала
 */
app.delete('/api/catalog/item_delete/materials_keys/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    console.log('🗑️ Удаление материала, ID:', itemId);
    
    const materials = loadMaterialsKeys();
    const itemIndex = materials.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Материал не найден' });
    }
    
    const deletedItem = materials.splice(itemIndex, 1)[0];
    
    if (saveMaterialsKeys(materials)) {
      res.json({ 
        result: 'success',
        message: 'Материал успешно удален',
        item: deletedItem
      });
    } else {
      res.status(500).json({ error: 'Ошибка сохранения в файл' });
    }
  } catch (error) {
    console.error('❌ Ошибка удаления материала:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// API Endpoints для наборов кромок (edges_keys)
// ============================================

app.get('/api/catalog/items_get/edges_keys', (req, res) => {
  try {
    const edges = loadEdgesKeys();
    res.set('Cache-Control', 'no-store');
    res.json(edges);
  } catch (error) {
    console.error('❌ Ошибка получения edges_keys:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/catalog/item/edges_keys/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const edges = loadEdgesKeys();
    const item = edges.find(t => t.id === itemId);
    if (item) res.json(item);
    else res.status(404).json({ error: 'Набор кромок не найден' });
  } catch (error) {
    console.error('❌ Ошибка получения edges_key:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/catalog/item_add/edges_keys/', (req, res) => {
  try {
    let data = req.body.data ? (typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data) : req.body;
    const name = (data.name || '').toString().trim();
    if (!name) return res.json('empty_name');
    const edges = loadEdgesKeys();
    const maxId = edges.length > 0 ? Math.max(...edges.map(item => item.id || 0)) : 0;
    let key = (data.key || '').toString().trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!key) key = `butt_${maxId + 1}`;
    if (['butts', 'butt'].includes(key.toLowerCase())) return res.json('reserved_key');
    if (edges.some(e => (e.key || '').toLowerCase() === key.toLowerCase())) return res.json('key_exists');
    const newItem = { id: maxId + 1, name, key, order: 0, active: 1 };
    edges.push(newItem);
    edges.sort((a, b) => (a.order || 0) - (b.order || 0));
    if (saveEdgesKeys(edges)) {
      res.json({ result: 'success', item: newItem, message: 'Набор кромок успешно добавлен' });
    } else {
      res.status(500).json({ error: 'Ошибка сохранения в файл' });
    }
  } catch (error) {
    console.error('❌ Ошибка добавления edges_key:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/catalog/item_edit/edges_keys/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    let data = req.body.data ? (typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data) : req.body;
    const name = (data.name || '').toString().trim();
    if (!name) return res.json('empty_name');
    const edges = loadEdgesKeys();
    const itemIndex = edges.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return res.status(404).json({ error: 'Набор кромок не найден' });
    const existing = edges[itemIndex];
    const updatedItem = {
      id: itemId,
      name,
      key: existing.key,
      order: existing.order ?? 0,
      active: existing.active ?? 1
    };
    edges[itemIndex] = updatedItem;
    edges.sort((a, b) => (a.order || 0) - (b.order || 0));
    if (saveEdgesKeys(edges)) {
      res.json({ result: 'success', item: updatedItem, message: 'Набор кромок успешно обновлен' });
    } else {
      res.status(500).json({ error: 'Ошибка сохранения в файл' });
    }
  } catch (error) {
    console.error('❌ Ошибка редактирования edges_key:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/catalog/item_delete/edges_keys/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const edges = loadEdgesKeys();
    const itemIndex = edges.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return res.status(404).json({ error: 'Набор кромок не найден' });
    const deletedItem = edges.splice(itemIndex, 1)[0];
    if (saveEdgesKeys(edges)) {
      res.json({ result: 'success', message: 'Набор кромок успешно удален', item: deletedItem });
    } else {
      res.status(500).json({ error: 'Ошибка сохранения в файл' });
    }
  } catch (error) {
    console.error('❌ Ошибка удаления edges_key:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// API Endpoints для групп (modules_groups)
// ============================================

/**
 * DELETE /api/catalog/item_delete/modules_groups/:id - Удаление группы
 * 
 * ВАЖНО: Регистрируется сразу после catalogs_keys для правильного порядка маршрутов
 */
app.delete('/api/catalog/item_delete/modules_groups/:id', (req, res) => {
  console.log('🔍 DELETE запрос получен:', req.method, req.url, req.path);
  console.log('🔍 Параметры:', req.params);
  console.log('🔍 ID из параметров:', req.params.id);
  try {
    const itemId = parseInt(req.params.id);
    console.log('🗑️ Удаление группы, ID:', itemId);
    
    const groups = loadModulesGroups();
    const itemIndex = groups.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      console.error('❌ Группа не найдена, ID:', itemId);
      console.log('📋 Текущие группы:', groups);
      return res.status(404).json({ error: 'Группа не найдена' });
    }
    
    const deletedItem = groups.splice(itemIndex, 1)[0];
    
    console.log('✅ Удалена группа:', deletedItem);
    console.log('📋 Осталось групп после удаления:', groups.length);
    console.log('📋 Оставшиеся группы:', groups);
    
    if (saveModulesGroups(groups)) {
      clearCatalogTypesForGroup(itemId);
      console.log('💾 Группы сохранены в файл, количество:', groups.length);
      // Проверяем, что файл действительно обновился
      const verifyGroups = loadModulesGroups();
      console.log('🔍 Проверка после удаления: загружено групп из файла:', verifyGroups.length);
      console.log('🔍 Проверка: удаленный элемент отсутствует?', !verifyGroups.some(g => g.id === itemId));
      
      if (verifyGroups.some(g => g.id === itemId)) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Удаленный элемент все еще присутствует в файле!');
        res.status(500).json({ error: 'Ошибка: элемент не был удален из файла' });
        return;
      }
      
      res.json({ 
        result: 'success',
        message: 'Группа успешно удалена',
        deletedItem: deletedItem
      });
    } else {
      console.error('❌ Ошибка сохранения групп в файл при удалении');
      res.status(500).json({ error: 'Ошибка сохранения в файл' });
    }
  } catch (error) {
    console.error('❌ Ошибка удаления группы:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Функции для работы с файлом modules_groups.json
 * 
 * ВАЖНО: Используем тот же путь, что и для других элементов каталога (catalog_items)
 * для единообразия с catalogs_keys
 */
const MODULES_GROUPS_FILE = path.join(__dirname, 'catalog_items', 'modules_groups.json');

function loadModulesGroups() {
  try {
    console.log('📂 loadModulesGroups: проверка файла', MODULES_GROUPS_FILE);
    if (fs.existsSync(MODULES_GROUPS_FILE)) {
      const data = fs.readFileSync(MODULES_GROUPS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      console.log('📂 loadModulesGroups: загружено из файла, элементов:', Array.isArray(parsed) ? parsed.length : 'не массив');
      return parsed;
    } else {
      console.log('📂 loadModulesGroups: файл не существует, используем дефолтные данные');
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки групп:', error);
    console.error('❌ Stack trace:', error.stack);
  }
  
  // Дефолтные данные (по аналогии с catalogs_keys)
  const defaultData = [
    { id: 1, name: 'Группа 1', order: 0, active: 1 },
    { id: 2, name: 'Группа 2', order: 1, active: 1 }
  ];
  
  // Создаем директорию если её нет
  const dataDir = path.dirname(MODULES_GROUPS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Сохраняем дефолтные данные
  saveModulesGroups(defaultData);
  return defaultData;
}

function saveModulesGroups(data) {
  try {
    const dataDir = path.dirname(MODULES_GROUPS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(MODULES_GROUPS_FILE, jsonData, 'utf8');
    
    // Синхронная проверка, что файл действительно записался
    const verifyData = fs.readFileSync(MODULES_GROUPS_FILE, 'utf8');
    const parsed = JSON.parse(verifyData);
    console.log('💾 Файл сохранен, проверка: записано элементов:', parsed.length, 'из', data.length);
    
    if (parsed.length !== data.length) {
      console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Количество элементов не совпадает после сохранения!');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка сохранения групп:', error);
    console.error('❌ Stack trace:', error.stack);
    return false;
  }
}

/**
 * POST /api/catalog/item_add/modules_groups/ - Добавление новой группы
 */
app.post('/api/catalog/item_add/modules_groups/', (req, res) => {
  try {
    console.log('➕ Добавление новой группы');
    console.log('📦 Данные запроса (req.body):', req.body);
    
    let data;
    try {
      data = parseCatalogGroupRequestData(req);
    } catch (parseError) {
      return res.status(400).json({ error: `Ошибка парсинга данных: ${parseError.message}` });
    }
    
    console.log('📋 Распарсенные данные:', data);
    
    const groups = loadModulesGroups();
    
    // Генерируем новый ID
    const newId = groups.length > 0 ? Math.max(...groups.map(g => g.id || 0)) + 1 : 1;
    
    const newGroup = {
      id: newId,
      name: data.name || '',
      order: parseInt(data.order) || 0,
      active: data.active == '1' || data.active === 1 ? 1 : 0
    };
    
    groups.push(newGroup);
    
    // Сортируем по order
    groups.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    console.log('✅ Добавлена новая группа:', newGroup);
    console.log('📋 Всего групп после добавления:', groups.length);
    
    if (saveModulesGroups(groups)) {
      if (data.catalog_type_ids !== undefined) {
        assignCatalogTypesToGroup(newId, parseCatalogTypeIdList(data.catalog_type_ids));
      }
      // Проверяем, что данные действительно сохранились
      const verifyGroups = loadModulesGroups();
      console.log('🔍 Проверка после добавления: загружено групп из файла:', verifyGroups.length);
      console.log('🔍 Проверка: новый элемент присутствует?', verifyGroups.some(g => g.id === newId));
      
      const assigned = getCatalogTypeIdsForGroup(newId);
      res.json({ 
        result: 'success',
        item: {
          ...newGroup,
          catalog_type_ids: assigned,
        },
        assigned_count: assigned.length,
        message: 'Группа успешно добавлена'
      });
    } else {
      console.error('❌ Ошибка сохранения в файл при добавлении');
      res.status(500).json({ error: 'Ошибка сохранения в файл' });
    }
  } catch (error) {
    console.error('❌ Ошибка добавления группы:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/catalog/item/modules_groups/:id - Получение одной группы по ID
 */
app.get('/api/catalog/item/modules_groups/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    console.log('🔍 Запрос группы, ID:', itemId);
    
    const groups = loadModulesGroups();
    const group = groups.find(g => g.id === itemId);
    
    if (!group) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }
    
    console.log('✅ Группа найдена:', group);
    res.json({
      ...group,
      catalog_type_ids: getCatalogTypeIdsForGroup(itemId),
    });
  } catch (error) {
    console.error('❌ Ошибка получения группы:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/modules_groups/:id/assign_types — привязка типов каталога к группе
 */
app.post('/api/catalog/modules_groups/:id/assign_types', (req, res) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    if (!Number.isFinite(itemId) || itemId <= 0) {
      return res.status(400).json({ error: 'Некорректный id группы' });
    }
    const groups = loadModulesGroups();
    if (!groups.some((g) => parseInt(g.id, 10) === itemId)) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }
    let body = req.body || {};
    if (body.data && typeof body.data === 'string') {
      try {
        body = JSON.parse(body.data);
      } catch (_) {}
    }
    const typeIds = parseCatalogTypeIdList(
      body.catalog_type_ids ?? body.type_ids ?? body.types ?? []
    );
    assignCatalogTypesToGroup(itemId, typeIds);
    const assigned = getCatalogTypeIdsForGroup(itemId);
    res.json({
      result: 'success',
      group_id: itemId,
      catalog_type_ids: assigned,
      assigned_count: assigned.length,
    });
  } catch (error) {
    console.error('❌ Ошибка assign_types для группы:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/item_edit/modules_groups/:id - Редактирование группы
 */
app.post('/api/catalog/item_edit/modules_groups/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    console.log('✏️ Редактирование группы, ID:', itemId);
    console.log('📦 Данные запроса (req.body):', req.body);
    
    let data;
    try {
      data = parseCatalogGroupRequestData(req);
    } catch (parseError) {
      return res.status(400).json({ error: `Ошибка парсинга данных: ${parseError.message}` });
    }
    
    console.log('📋 Распарсенные данные:', data);
    
    const groups = loadModulesGroups();
    const itemIndex = groups.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }
    
    const updatedItem = {
      id: itemId,
      name: data.name || '',
      order: parseInt(data.order) || 0,
      active: data.active == '1' || data.active === 1 ? 1 : 0
    };
    
    groups[itemIndex] = updatedItem;
    groups.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    console.log('✅ Обновлена группа:', updatedItem);
    
    if (saveModulesGroups(groups)) {
      if (data.catalog_type_ids !== undefined) {
        assignCatalogTypesToGroup(itemId, parseCatalogTypeIdList(data.catalog_type_ids));
      }
      const assigned = getCatalogTypeIdsForGroup(itemId);
      res.json({ 
        result: 'success',
        item: {
          ...updatedItem,
          catalog_type_ids: assigned,
        },
        assigned_count: assigned.length,
        message: 'Группа успешно обновлена'
      });
    } else {
      res.status(500).json({ error: 'Ошибка сохранения в файл' });
    }
  } catch (error) {
    console.error('❌ Ошибка редактирования группы:', error);
    res.status(500).json({ error: error.message });
  }
});


// ============================================
// API Endpoints для комплектующих (accessories)
// ============================================

/**
 * GET /api/accessories/list - Получение списка комплектующих
 * 
 * Возвращает список комплектующих для модального окна выбора
 */
app.get('/api/accessories/list', (req, res) => {
  try {
    console.log('🔍 Запрос списка комплектующих');
    
    // Используем данные из референса (furniture)
    const accessoriesData = getFullReferenceData().furniture || { categories: [], items: [] };
    const items = accessoriesData.items || [];
    
    // Преобразуем в формат для таблицы
    const formattedItems = items.map(item => ({
      id: item.id || 0,
      name: item.name || '',
      article: item.code || '',
      category: item.category_name || (item.category ? String(item.category) : ''),
      price: item.price || 0
    }));
    
    console.log('✅ Возвращаем список комплектующих, количество:', formattedItems.length);
    res.json(formattedItems);
  } catch (error) {
    console.error('❌ Ошибка получения списка комплектующих:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Универсальные API Endpoints для элементов каталога
// ============================================

/**
 * GET /api/catalog/item/:type/:id - Получение одного элемента каталога по типу и ID
 * 
 * Универсальный эндпоинт для получения элемента любого типа каталога
 */
app.get('/api/catalog/item/:type/:id', (req, res) => {
  try {
    const catalogType = req.params.type;
    const itemId = parseInt(req.params.id);
    console.log(`🔍 Запрос элемента каталога, тип: ${catalogType}, ID: ${itemId}`);
    
    // Для catalogs_keys используем существующую логику
    if (catalogType === 'catalogs_keys') {
      const catalogTypes = loadCatalogsKeys();
      const item = catalogTypes.find(t => t.id === itemId);
      
      if (item) {
        console.log('✅ Найден тип элемента:', item);
        res.json(item);
      } else {
        console.log('⚠️ Тип элемента не найден, ID:', itemId);
        res.status(404).json({ error: 'Элемент не найден' });
      }
      return;
    }
    
    // Для других типов: читаем из нашего файлового хранилища
    if (catalogType === 'handles') {
      if (itemId === 0) {
        return res.json({
          id: 0,
          key: '',
          name: '',
          icon: '',
          order: 100,
          active: 1,
          kind: 'bar',
          categoryId: null,
          cabinetModelId: 0,
          variants: [],
        });
      }
      const data = loadHandlesCatalog();
      const found = findHandleSeriesById(data, itemId);
      if (found) return res.json(found);
      return res.status(404).json({ error: 'Серия ручек не найдена' });
    }

    const items = loadCatalogItems(catalogType);
    if (itemId === 0) {
      // Режим "создание нового" — возвращаем пустой шаблон
      const emptyItem = {
        id: 0,
        name: '',
        catalog_type: catalogType,
        order: 0,
        active: 1,
        show_in_spec: 1,
        include_nested: 1,
        show_in_constructor: 1,
        category: [],
        icon: '',
        module_group: 'bottom',
        drag_type: 'top',
        stick_type: 'common',
        is_fill: 0,
        no_intersections: 0,
        width: 300,
        height: 400,
        depth: 200,
        constructor_structure: null,
      };
      console.log('✅ Возвращаем пустой шаблон элемента (id=0):', emptyItem);
      return res.json(emptyItem);
    }

    const found = Array.isArray(items) ? items.find((it) => Number(it?.id) === itemId) : null;
    if (found) {
      console.log('✅ Найден элемент в хранилище:', { id: found.id, type: catalogType, name: found.name });
      return res.json(found);
    }

    // Фолбэк: старое поведение (mock), чтобы админка не падала при неизвестном ID
    const mockItem = {
      id: itemId,
      name: `Элемент ${catalogType} #${itemId}`,
      catalog_type: catalogType,
      order: 0,
      active: 1,
      show_in_spec: 1,
      include_nested: 1,
      show_in_constructor: 1,
      category: [],
      icon: '',
      module_group: 'bottom',
      drag_type: 'top',
      stick_type: 'common',
      is_fill: 0,
      no_intersections: 0
    };
    
    console.log('✅ Возвращаем mock данные для элемента:', mockItem);
    res.json(mockItem);
  } catch (error) {
    console.error('❌ Ошибка получения элемента каталога:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/item_add/:type/ - Добавление нового элемента каталога
 * 
 * Универсальный эндпоинт для добавления элемента любого типа каталога
 */
app.post('/api/catalog/item_add/:type/', (req, res) => {
  try {
    const catalogType = req.params.type;
    console.log(`➕ Добавление нового элемента каталога, тип: ${catalogType}`);
    console.log('📦 Данные запроса:', JSON.stringify(req.body, null, 2));
    
    // Для catalogs_keys используем существующую логику
    if (catalogType === 'catalogs_keys') {
      // Перенаправляем на существующий эндпоинт
      req.url = '/api/catalog/item_add/catalogs_keys/';
      return app._router.handle(req, res);
    }
    
    // В Clodis данные приходят в поле 'data' как JSON строка с объектом {params: {...}},
    // а метаданные элемента (name, category, order, active и т.п.) — на верхнем уровне.
    // Раньше мы теряли эти метаданные, оставляя только распарсенный data. Теперь сохраняем их вместе.
    const body = req.body && typeof req.body === 'object' ? { ...req.body } : {};
    let dataField = null;
    if (Object.prototype.hasOwnProperty.call(body, 'data')) {
      try {
        dataField = typeof body.data === 'string' ? JSON.parse(body.data) : body.data;
      } catch (e) {
        console.warn('⚠️ Не удалось распарсить поле data, сохраняем как есть:', e);
        dataField = body.data;
      }
      delete body.data;
    }
    
    // Если иконка пришла только внутри data, поднимаем её на верхний уровень,
    // чтобы она сохранялась как item.icon и корректно читалась формой/конструктором.
    if (dataField && typeof dataField === 'object' && dataField.icon) {
      body.icon = dataField.icon;
    }
    if (dataField && typeof dataField === 'object' && dataField.iconAspect) {
      body.iconAspect =
        dataField.iconAspect === 'low' || dataField.iconAspect === 'short' ? 'low' : 'tall';
    }
    // Название из формы (Основные параметры) — приоритет над data.name.
    const formName = body.name != null ? String(body.name).trim() : '';
    if (dataField && typeof dataField === 'object' && dataField.name != null && String(dataField.name).trim() !== '') {
      body.name = String(dataField.name).trim();
    }
    if (formName) body.name = formName;
    
    // ⭐ ВАЖНО: Извлекаем clodisJSON из разных мест и сохраняем на верхнем уровне элемента
    // для правильной работы export_all_for_constructor
    let clodisJSON = pickClodisJSONFromRecord(body, dataField);

    try {
      const __countJointRows = (nodes) => {
        if (!Array.isArray(nodes)) return 0;
        let n = 0;
        for (const x of nodes) {
          if (!x || typeof x !== 'object') continue;
          if (Array.isArray(x.jointSchemes)) n += x.jointSchemes.length;
          if (Array.isArray(x.children)) n += __countJointRows(x.children);
        }
        return n;
      };
      const cs0 = dataField && dataField.constructor_structure;
      if (cs0 && typeof cs0 === 'object') {
        const tpl = cs0.template && Array.isArray(cs0.template.structure) ? cs0.template.structure : null;
        const ch = Array.isArray(cs0.children) ? cs0.children : null;
        const pp = dataField.clodisJSON;
        console.log('[CLD-SAVE-JOINT] server item_add входящий payload:', {
          catalogType,
          jointRowsInTemplate: tpl ? __countJointRows(tpl) : -1,
          jointRowsInChildren: ch ? __countJointRows(ch) : -1,
          jointRowsInClodisJSON: Array.isArray(pp) ? __countJointRows(pp) : -1,
        });
      }
    } catch (e) {
      console.warn('[CLD-SAVE-JOINT] server item_add log:', e && e.message);
    }
    
    // TODO: В продакшене сохранять в БД по типу каталога
    // Сейчас: сохраняем в файловое хранилище
    if (catalogType === 'handles') {
      const data = loadHandlesCatalog();
      const newId = nextHandleSeriesId(data.series);
      const bodyKey = (body.key || body.seriesId || '').toString().trim();
      const newItem = mergeHandleSeriesPayload({
        id: newId,
        key: bodyKey || ('handle-' + newId),
        name: body.name || 'Новая серия ручек',
        order: body.order != null ? Number(body.order) : newId * 100,
        active: 1,
        kind: body.kind || 'bar',
        categoryId: body.categoryId != null ? Number(body.categoryId) : null,
        icon: body.icon || '',
      }, body);
      newItem.id = newId;
      data.series.push(newItem);
      if (!saveHandlesCatalog(data)) {
        return res.status(500).json({ error: 'Ошибка сохранения handles.json' });
      }
      return res.json({ result: 'success', item: newItem, message: 'Серия ручек добавлена' });
    }

    const items = loadCatalogItems(catalogType);
    if (catalogTypeNeedsDuplicateGuard(catalogType)) {
      const duplicate = findCatalogItemDuplicate(items, {
        name: body.name,
        article: body.article,
        excludeId: 0,
      });
      if (duplicate) {
        const error = buildCatalogDuplicateError(catalogType, duplicate, body);
        console.warn(`⚠️ Дубликат при добавлении ${catalogType}:`, duplicate);
        return res.status(409).json({ result: 'duplicate', error, duplicate: { id: duplicate.item?.id, field: duplicate.field } });
      }
    }
    const newId = nextCatalogItemId(items);
    const nextCs =
      (dataField && dataField.constructor_structure && typeof dataField.constructor_structure === 'object')
        ? dataField.constructor_structure
        : (body && body.constructor_structure && typeof body.constructor_structure === 'object')
          ? body.constructor_structure
          : null;
    const newItem = {
      catalog_type: catalogType,
      ...body,
      ...(dataField != null ? { data: dataField } : {}),
      ...(nextCs ? { constructor_structure: nextCs } : {}),
      ...(clodisJSON != null ? { clodisJSON: clodisJSON } : {}),
      id: newId,
    };
    const savedAspect = pickIconAspectFromCatalogRecord(newItem);
    if (savedAspect) newItem.iconAspect = savedAspect;
    
    items.push(newItem);
    saveCatalogItems(catalogType, items);

    console.log('✅ Элемент добавлен и сохранён:', { id: newItem.id, type: catalogType, name: newItem.name });
    res.json({
      result: 'success',
      item: newItem,
      message: 'Элемент успешно добавлен'
    });
  } catch (error) {
    console.error('❌ Ошибка добавления элемента каталога:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/item_update/:type/:id - алиас для редактирования элемента каталога
 *
 * В UI (admin-new.html / admin-models3d-list.js) исторически используется item_update.
 * Реальная реализация — /api/catalog/item_edit/:type/:id.
 */
app.post('/api/catalog/item_update/:type/:id/', (req, res) => {
  const { type, id } = req.params;
  req.url = `/api/catalog/item_edit/${encodeURIComponent(type)}/${encodeURIComponent(String(id))}`;
  return app._router.handle(req, res);
});
app.post('/api/catalog/item_update/:type/:id', (req, res) => {
  const { type, id } = req.params;
  req.url = `/api/catalog/item_edit/${encodeURIComponent(type)}/${encodeURIComponent(String(id))}`;
  return app._router.handle(req, res);
});

/**
 * POST /api/catalog/item_edit/:type/:id - Редактирование элемента каталога
 * 
 * Универсальный эндпоинт для редактирования элемента любого типа каталога
 */
app.post('/api/catalog/item_edit/:type/:id', (req, res) => {
  try {
    const catalogType = req.params.type;
    const itemId = parseInt(req.params.id);
    console.log(`✏️ Редактирование элемента каталога, тип: ${catalogType}, ID: ${itemId}`);
    console.log('📦 Данные запроса:', JSON.stringify(req.body, null, 2));
    
    // Для catalogs_keys используем существующую логику
    if (catalogType === 'catalogs_keys') {
      // Перенаправляем на существующий эндпоинт
      req.url = `/api/catalog/item_edit/catalogs_keys/${itemId}`;
      return app._router.handle(req, res);
    }
    
    // В Clodis данные приходят в поле 'data' как JSON строка с {params: {...}},
    // а метаданные лежат на верхнем уровне. Сохраняем и то, и другое.
    const body = req.body && typeof req.body === 'object' ? { ...req.body } : {};
    let dataField = null;
    if (Object.prototype.hasOwnProperty.call(body, 'data')) {
      try {
        dataField = typeof body.data === 'string' ? JSON.parse(body.data) : body.data;
      } catch (e) {
        console.warn('⚠️ Не удалось распарсить поле data при редактировании, сохраняем как есть:', e);
        dataField = body.data;
      }
      delete body.data;
    }
    
    // Если иконка пришла только внутри data, поднимаем её на верхний уровень,
    // чтобы она сохранялась как item.icon и корректно читалась формой/конструктором.
    if (dataField && typeof dataField === 'object' && dataField.icon) {
      body.icon = dataField.icon;
    }
    if (dataField && typeof dataField === 'object' && dataField.iconAspect) {
      body.iconAspect =
        dataField.iconAspect === 'low' || dataField.iconAspect === 'short' ? 'low' : 'tall';
    }
    // Название из формы (Основные параметры) — приоритет над data.name.
    const formName = body.name != null ? String(body.name).trim() : '';
    if (dataField && typeof dataField === 'object' && dataField.name != null && String(dataField.name).trim() !== '') {
      body.name = String(dataField.name).trim();
    }
    if (formName) body.name = formName;
    
    // ⭐ ВАЖНО: Извлекаем clodisJSON из разных мест и сохраняем на верхнем уровне элемента
    // для правильной работы export_all_for_constructor
    let clodisJSON = pickClodisJSONFromRecord(body, dataField);

    try {
      const __countJointRows = (nodes) => {
        if (!Array.isArray(nodes)) return 0;
        let n = 0;
        for (const x of nodes) {
          if (!x || typeof x !== 'object') continue;
          if (Array.isArray(x.jointSchemes)) n += x.jointSchemes.length;
          if (Array.isArray(x.children)) n += __countJointRows(x.children);
        }
        return n;
      };
      const cs0 = dataField && dataField.constructor_structure;
      if (cs0 && typeof cs0 === 'object') {
        const tpl = cs0.template && Array.isArray(cs0.template.structure) ? cs0.template.structure : null;
        const ch = Array.isArray(cs0.children) ? cs0.children : null;
        const pp = dataField.clodisJSON;
        console.log('[CLD-SAVE-JOINT] server item_edit входящий payload:', {
          catalogType,
          itemId,
          jointRowsInTemplate: tpl ? __countJointRows(tpl) : -1,
          jointRowsInChildren: ch ? __countJointRows(ch) : -1,
          jointRowsInClodisJSON: Array.isArray(pp) ? __countJointRows(pp) : -1,
        });
      }
    } catch (e) {
      console.warn('[CLD-SAVE-JOINT] server log:', e && e.message);
    }
    
    // TODO: В продакшене обновлять в БД по типу и ID
    // Сейчас: обновляем/создаём в файловое хранилище
    if (catalogType === 'handles') {
      const data = loadHandlesCatalog();
      const idx = data.series.findIndex((s) => Number(s?.id) === itemId);
      const prev = idx >= 0 ? data.series[idx] : null;
      const updatedItem = mergeHandleSeriesPayload(prev || { id: itemId }, { ...body, id: itemId });
      updatedItem.id = itemId;
      if (idx >= 0) data.series[idx] = updatedItem;
      else data.series.push(updatedItem);
      if (!saveHandlesCatalog(data)) {
        return res.status(500).json({ error: 'Ошибка сохранения handles.json' });
      }
      return res.json({ result: 'success', item: updatedItem, message: 'Серия ручек обновлена' });
    }

    const items = loadCatalogItems(catalogType);
    const idx = Array.isArray(items) ? items.findIndex((it) => Number(it?.id) === itemId) : -1;
    if (catalogTypeNeedsDuplicateGuard(catalogType)) {
      const duplicate = findCatalogItemDuplicate(items, {
        name: body.name,
        article: body.article,
        excludeId: itemId,
      });
      if (duplicate) {
        const error = buildCatalogDuplicateError(catalogType, duplicate, body);
        console.warn(`⚠️ Дубликат при редактировании ${catalogType} id=${itemId}:`, duplicate);
        return res.status(409).json({ result: 'duplicate', error, duplicate: { id: duplicate.item?.id, field: duplicate.field } });
      }
    }
    const prevCs = idx >= 0 ? items[idx]?.constructor_structure : null;
    const prevData =
      idx >= 0 && items[idx]?.data && typeof items[idx].data === 'object' && !Array.isArray(items[idx].data)
        ? items[idx].data
        : {};
    const nextCs =
      (dataField && dataField.constructor_structure && typeof dataField.constructor_structure === 'object')
        ? dataField.constructor_structure
        : (body && body.constructor_structure && typeof body.constructor_structure === 'object')
          ? body.constructor_structure
          : (prevCs && typeof prevCs === 'object' ? prevCs : null);
    // Админка — источник: whitelist из формы НЕ должен затирать остальные ключи data.*
    // (материалы, vars, наши плюшки). Новые поля из payload перекрывают старые.
    const mergedData =
      dataField != null && typeof dataField === 'object' && !Array.isArray(dataField)
        ? { ...prevData, ...dataField }
        : dataField != null
          ? dataField
          : Object.keys(prevData).length
            ? prevData
            : undefined;
    const updatedItem = {
      catalog_type: catalogType,
      ...(items[idx] || {}),
      ...body,
      ...(mergedData !== undefined ? { data: mergedData } : {}),
      ...(nextCs ? { constructor_structure: nextCs } : {}),
      ...(clodisJSON != null ? { clodisJSON: clodisJSON } : {}),
      id: itemId,
    };
    const savedAspect = pickIconAspectFromCatalogRecord(updatedItem);
    if (savedAspect) updatedItem.iconAspect = savedAspect;
    if (idx >= 0) {
      items[idx] = updatedItem;
    } else {
      items.push(updatedItem);
    }
    saveCatalogItems(catalogType, items);
    
    console.log('✅ Элемент обновлен и сохранён:', { id: updatedItem.id, type: catalogType, name: updatedItem.name });
    res.json({
      result: 'success',
      item: updatedItem,
      message: 'Элемент успешно обновлен'
    });
  } catch (error) {
    console.error('❌ Ошибка редактирования элемента каталога:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/propagate_element - Пропагация изменений элемента во все модули,
 * которые ссылаются на него (spec.id + spec.element_type).
 *
 * body: { source_type: "catalog_28", source_id: 1 }
 *
 * Логика: обходим все catalog_* файлы, ищем в constructor_structure / clodis_structure
 * узлы type:"facade"|"module" с spec.id === source_id && spec.element_type === source_type,
 * подменяем их pos/size/pivot/rot/edges/spec из свежего шаблона.
 */
app.post('/api/catalog/propagate_element', (req, res) => {
  try {
    const body = req.body || {};
    const sourceType = String(body.source_type || '').trim();
    const sourceId = String(body.source_id ?? '').trim();
    if (!sourceType || !sourceId) {
      return res.json({ result: 'noop', message: 'source_type/source_id not provided' });
    }

    const sourceItems = loadCatalogItems(sourceType);
    const sourceItem = sourceItems.find(it => String(it?.id) === sourceId);
    if (!sourceItem) {
      return res.json({ result: 'noop', message: 'source item not found' });
    }

    const cs = sourceItem?.params?.constructor_structure
      || sourceItem?.data?.constructor_structure
      || sourceItem?.constructor_structure
      || null;

    const findFacadeInTree = (nodes) => {
      if (!Array.isArray(nodes)) return null;
      for (const n of nodes) {
        if (!n || typeof n !== 'object') continue;
        const t = String(n.type || '').toLowerCase();
        if (t === 'facade' || t === 'wall') return n;
        const ch = findFacadeInTree(n.children);
        if (ch) return ch;
      }
      return null;
    };
    let tplTree = null;
    if (Array.isArray(cs)) tplTree = cs;
    else if (cs && Array.isArray(cs.children)) tplTree = cs.children;
    const freshNode = findFacadeInTree(tplTree);

    if (!freshNode) {
      return res.json({ result: 'noop', message: 'no facade/wall in source template' });
    }

    ensureCatalogItemsDir();
    const dir = path.join(__dirname, 'catalog_items');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_'));
    let totalUpdated = 0;

    const patchNode = (node) => {
      if (!node || typeof node !== 'object') return false;
      let changed = false;
      const t = String(node.type || '').toLowerCase();
      const specId = String(node?.spec?.id ?? '').trim();
      const specET = String(node?.spec?.element_type ?? '').trim();
      if ((t === 'facade' || t === 'module' || t === 'wall') && specId === sourceId && specET === sourceType) {
        if (freshNode.size) node.size = JSON.parse(JSON.stringify(freshNode.size));
        if (freshNode.pos) node.pos = JSON.parse(JSON.stringify(freshNode.pos));
        if (freshNode.pivot) node.pivot = JSON.parse(JSON.stringify(freshNode.pivot));
        if (freshNode.rot) node.rot = JSON.parse(JSON.stringify(freshNode.rot));
        if (freshNode.edges) node.edges = JSON.parse(JSON.stringify(freshNode.edges));
        if (freshNode.edge_numbering !== undefined) node.edge_numbering = freshNode.edge_numbering;
        if (freshNode.spec) {
          const keepId = node.spec?.id;
          const keepET = node.spec?.element_type;
          const keepLC = node.spec?.live_catalog;
          node.spec = JSON.parse(JSON.stringify(freshNode.spec));
          if (keepId) node.spec.id = keepId;
          if (keepET) node.spec.element_type = keepET;
          if (keepLC) node.spec.live_catalog = keepLC;
        }
        if (freshNode.material_id) node.material_id = freshNode.material_id;
        if (freshNode.material_key) node.material_key = freshNode.material_key;
        if (freshNode.material_group) node.material_group = freshNode.material_group;
        if (freshNode.material_name) node.material_name = freshNode.material_name;
        if (freshNode.material_icon) node.material_icon = freshNode.material_icon;
        changed = true;
      }
      if (Array.isArray(node.children)) {
        for (const ch of node.children) {
          if (patchNode(ch)) changed = true;
        }
      }
      return changed;
    };

    for (const file of files) {
      const catType = file.replace('.json', '');
      if (catType === sourceType.replace('catalog_', '')) continue;
      const items = loadCatalogItems(catType);
      let fileChanged = false;
      for (const item of items) {
        const structures = [
          item?.params?.constructor_structure,
          item?.params?.clodis_structure,
          item?.constructor_structure,
          item?.clodis_structure,
        ];
        for (const struct of structures) {
          if (!struct) continue;
          const arr = Array.isArray(struct) ? struct : (Array.isArray(struct.children) ? struct.children : null);
          if (!arr) continue;
          for (const node of arr) {
            if (patchNode(node)) {
              fileChanged = true;
              totalUpdated++;
            }
          }
        }
      }
      if (fileChanged) {
        saveCatalogItems(catType, items);
      }
    }

    console.log(`🔄 propagate_element: ${sourceType}/${sourceId} → обновлено ${totalUpdated} узлов`);
    res.json({ result: 'success', updated: totalUpdated });
  } catch (e) {
    console.error('❌ propagate_element error:', e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/catalog/items_clear/:type - Полная очистка списка элементов каталога
 */
app.post('/api/catalog/items_clear/:type', (req, res) => {
  try {
    const catalogType = req.params.type;
    if (/^catalogs_keys|modules_groups$/i.test(catalogType)) {
      return res.status(400).json({ error: 'Очистка этого типа недоступна' });
    }
    // Бэкап перед очисткой, чтобы можно было восстановить данные
    try {
      const existing = loadCatalogItems(catalogType);
      if (Array.isArray(existing) && existing.length > 0) {
        ensureCatalogItemsDir();
        const backupsDir = path.join(CATALOG_ITEMS_DIR, '_backups');
        if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
        const safeType = safeCatalogTypeKey(catalogType);
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupsDir, `${safeType}.${stamp}.json`);
        fs.writeFileSync(backupPath, JSON.stringify(existing, null, 2), 'utf8');
        console.log(`🗄️ Бэкап "${catalogType}" перед очисткой: ${backupPath}`);
      }
    } catch (backupErr) {
      console.warn('⚠️ Не удалось сделать бэкап перед очисткой:', backupErr?.message || backupErr);
    }
    saveCatalogItems(catalogType, []);
    console.log(`🧹 Каталог "${catalogType}" очищен`);
    res.json({ result: 'success', message: 'Список очищен' });
  } catch (e) {
    console.error('❌ items_clear:', e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * DELETE /api/catalog/item_delete/:type/:id - Удаление элемента каталога
 *
 * Универсальный эндпоинт для удаления элемента любого типа каталога.
 * Важно: специфичные маршруты (например, catalogs_keys) могут переопределять логику.
 */
app.delete('/api/catalog/item_delete/:type/:id', (req, res) => {
  try {
    const catalogType = req.params.type;
    const itemId = parseInt(req.params.id);
    console.log(`🗑️ Удаление элемента каталога, тип: ${catalogType}, ID: ${itemId}`);

    // Для catalogs_keys используем существующую логику
    if (catalogType === 'catalogs_keys') {
      req.url = `/api/catalog/item_delete/catalogs_keys/${itemId}`;
      return app._router.handle(req, res);
    }

    // Для modules_groups используем существующую логику
    if (catalogType === 'modules_groups') {
      req.url = `/api/catalog/item_delete/modules_groups/${itemId}`;
      return app._router.handle(req, res);
    }

    // Для остальных типов удаляем через файловое хранилище
    if (catalogType === 'handles') {
      const data = loadHandlesCatalog();
      const idx = data.series.findIndex((s) => Number(s?.id) === itemId);
      if (idx === -1) return res.status(404).json({ error: 'Серия ручек не найдена' });
      const deletedItem = data.series.splice(idx, 1)[0];
      if (!saveHandlesCatalog(data)) {
        return res.status(500).json({ error: 'Ошибка сохранения handles.json' });
      }
      return res.json({ result: 'success', message: 'Серия ручек удалена', item: deletedItem });
    }

    const items = loadCatalogItems(catalogType);
    const idx = Array.isArray(items) ? items.findIndex((it) => Number(it?.id) === itemId) : -1;
    if (idx === -1) {
      return res.status(404).json({ error: 'Элемент не найден' });
    }

    const deletedItem = items.splice(idx, 1)[0];
    if (!saveCatalogItems(catalogType, items)) {
      return res.status(500).json({ error: 'Ошибка сохранения в файл' });
    }

    res.json({
      result: 'success',
      message: 'Элемент успешно удален',
      item: deletedItem
    });
  } catch (error) {
    console.error('❌ Ошибка удаления элемента каталога:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/items_bulk_params/:type
 * Массовое обновление базовых параметров элементов каталога:
 * active, show_in_spec, include_nested, show_in_constructor
 *
 * body: {
 *   ids: [1,2,3],
 *   params: {
 *     active: 'keep' | '1' | '0',
 *     show_in_spec: 'keep' | '1' | '0',
 *     include_nested: 'keep' | '1' | '0',
 *     show_in_constructor: 'keep' | '1' | '0'
 *   }
 * }
 */
app.post('/api/catalog/items_bulk_params/:type', (req, res) => {
  try {
    const catalogType = req.params.type;
    const body = req.body || {};
    const idsRaw = body.ids;
    const params = body.params || {};

    if (!Array.isArray(idsRaw) || idsRaw.length === 0) {
      return res.status(400).json({ error: 'Список элементов (ids) пуст' });
    }

    const ids = idsRaw
      .map((id) => Number(id))
      .filter((n) => Number.isFinite(n));

    if (!ids.length) {
      return res.status(400).json({ error: 'Не удалось распознать идентификаторы элементов' });
    }

    const items = loadCatalogItems(catalogType);
    if (!Array.isArray(items) || !items.length) {
      return res.json({ result: 'success', updated: 0 });
    }

    const normalizeFlag = (val) => {
      if (val === undefined || val === null || val === '' || val === 'keep') return null;
      if (val === true || val === '1' || val === 1) return 1;
      if (val === false || val === '0' || val === 0) return 0;
      return null;
    };

    const activeFlag = normalizeFlag(params.active);
    const showSpecFlag = normalizeFlag(params.show_in_spec);
    const includeNestedFlag = normalizeFlag(params.include_nested);
    const showConstructorFlag = normalizeFlag(params.show_in_constructor);

    if (
      activeFlag === null &&
      showSpecFlag === null &&
      includeNestedFlag === null &&
      showConstructorFlag === null
    ) {
      return res.status(400).json({ error: 'Не указано ни одного параметра для изменения' });
    }

    let updatedCount = 0;
    const updatedItems = items.map((it) => {
      if (!it || !ids.includes(Number(it.id))) return it;
      const updated = { ...it };
      if (activeFlag !== null) updated.active = activeFlag;
      if (showSpecFlag !== null) updated.show_in_spec = showSpecFlag;
      if (includeNestedFlag !== null) updated.include_nested = includeNestedFlag;
      if (showConstructorFlag !== null) updated.show_in_constructor = showConstructorFlag;
      updatedCount += 1;
      return updated;
    });

    if (updatedCount > 0) {
      saveCatalogItems(catalogType, updatedItems);
    }

    res.json({
      result: 'success',
      updated: updatedCount
    });
  } catch (error) {
    console.error('❌ Ошибка массового обновления параметров:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/items_reset_materials/:type
 * Массовый сброс настроек материалов для указанных элементов каталога.
 *
 * body: { ids: [1,2,3] }
 *
 * Сбрасывает:
 * - top-level поля materials_overrides и material_groups (если есть)
 * - внутри constructor_structure (если есть) тоже удаляет эти поля
 */
app.post('/api/catalog/items_reset_materials/:type', (req, res) => {
  try {
    const catalogType = req.params.type;
    const body = req.body || {};
    const idsRaw = body.ids;

    if (!Array.isArray(idsRaw) || idsRaw.length === 0) {
      return res.status(400).json({ error: 'Список элементов (ids) пуст' });
    }

    const ids = idsRaw
      .map((id) => Number(id))
      .filter((n) => Number.isFinite(n));

    if (!ids.length) {
      return res.status(400).json({ error: 'Не удалось распознать идентификаторы элементов' });
    }

    const items = loadCatalogItems(catalogType);
    if (!Array.isArray(items) || !items.length) {
      return res.json({ result: 'success', updated: 0 });
    }

    let updatedCount = 0;
    const updatedItems = items.map((it) => {
      if (!it || !ids.includes(Number(it.id))) return it;
      const updated = { ...it };

      // Удаляем top-level overrides
      if (updated.materials_overrides) {
        delete updated.materials_overrides;
      }
      if (updated.material_groups) {
        delete updated.material_groups;
      }

      // Если структура конструктора лежит в constructor_structure, чистим и там
      if (updated.constructor_structure && typeof updated.constructor_structure === 'object') {
        if (updated.constructor_structure.materials_overrides) {
          delete updated.constructor_structure.materials_overrides;
        }
        if (updated.constructor_structure.material_groups) {
          delete updated.constructor_structure.material_groups;
        }
      }

      updatedCount += 1;
      return updated;
    });

    if (updatedCount > 0) {
      saveCatalogItems(catalogType, updatedItems);
    }

    res.json({
      result: 'success',
      updated: updatedCount
    });
  } catch (error) {
    console.error('❌ Ошибка массового сброса материалов:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/items_copy_modules/:type
 * Массовое копирование модуля (конструктора) из одного элемента в другие.
 *
 * body: {
 *   sourceId: number,
 *   targetIds: number[]
 * }
 *
 * Копируются поля, отвечающие за структуру модуля:
 * - data (JSON с params/clodis-структурой)
 * - constructor_structure (если используется clean-room конструктор)
 * - clodisJSON (если сохранён отдельно)
 * - materials_overrides, material_groups (настройки материалов)
 */
app.post('/api/catalog/items_copy_modules/:type', (req, res) => {
  try {
    const catalogType = req.params.type;
    const body = req.body || {};
    const sourceId = Number(body.sourceId);
    const targetIdsRaw = body.targetIds;

    if (!Number.isFinite(sourceId) || sourceId <= 0) {
      return res.status(400).json({ error: 'Некорректный sourceId' });
    }

    if (!Array.isArray(targetIdsRaw) || !targetIdsRaw.length) {
      return res.status(400).json({ error: 'Список targetIds пуст' });
    }

    const targetIds = targetIdsRaw
      .map((id) => Number(id))
      .filter((n) => Number.isFinite(n) && n > 0 && n !== sourceId);

    if (!targetIds.length) {
      return res.status(400).json({ error: 'Нет валидных целевых элементов' });
    }

    const items = loadCatalogItems(catalogType);
    if (!Array.isArray(items) || !items.length) {
      return res.status(404).json({ error: 'Элементы каталога не найдены' });
    }

    const source = items.find((it) => Number(it?.id) === sourceId);
    if (!source) {
      return res.status(404).json({ error: 'Источник не найден' });
    }

    const fieldsToCopy = ['data', 'constructor_structure', 'clodisJSON', 'materials_overrides', 'material_groups'];

    let updatedCount = 0;
    const updatedItems = items.map((it) => {
      if (!it || !targetIds.includes(Number(it.id))) return it;
      const updated = { ...it };
      fieldsToCopy.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(source, field)) {
          const value = source[field];
          if (value && typeof value === 'object') {
            // Глубокая копия для объектов/массивов
            try {
              updated[field] = JSON.parse(JSON.stringify(value));
            } catch {
              updated[field] = value;
            }
          } else {
            updated[field] = value;
          }
        } else if (Object.prototype.hasOwnProperty.call(updated, field)) {
          // Если у источника поля нет, а у цели есть — очищаем
          delete updated[field];
        }
      });
      updatedCount += 1;
      return updated;
    });

    if (updatedCount > 0) {
      saveCatalogItems(catalogType, updatedItems);
    }

    res.json({
      result: 'success',
      updated: updatedCount
    });
  } catch (error) {
    console.error('❌ Ошибка массового копирования модулей:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// API: Глобальные переменные (global_vars)
// ============================================

const GLOBAL_VARS_FILE = path.join(__dirname, 'catalog_items', 'global_vars.json');

/**
 * Функции для работы с файлом global_vars.json
 */

function saveGlobalVars(data) {
  try {
    const dataDir = path.dirname(GLOBAL_VARS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(GLOBAL_VARS_FILE, jsonData, 'utf8');
    
    // Синхронная проверка, что файл действительно записался
    const verifyData = fs.readFileSync(GLOBAL_VARS_FILE, 'utf8');
    const parsed = JSON.parse(verifyData);
    console.log('💾 Файл global_vars.json сохранен');
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка сохранения глобальных переменных:', error);
    return false;
  }
}

function loadGlobalVars() {
  try {
    console.log('📂 loadGlobalVars: проверка файла', GLOBAL_VARS_FILE);
    if (fs.existsSync(GLOBAL_VARS_FILE)) {
      const data = fs.readFileSync(GLOBAL_VARS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      console.log('📂 loadGlobalVars: загружено из файла');
      return parsed;
    } else {
      console.log('📂 loadGlobalVars: файл не существует, используем дефолтные данные из референса');
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки глобальных переменных:', error);
  }
  
  // Дефолтные данные из референса (get_global_vars.json)
  // Загружаем из референса, если файл существует
  const BOOTSTRAP_GLOBAL_VARS_FILE = path.join(BOOTSTRAP_DIR, 'get_global_vars.json');
  let defaultData = null;
  
  try {
    if (fs.existsSync(BOOTSTRAP_GLOBAL_VARS_FILE)) {
      const refData = fs.readFileSync(BOOTSTRAP_GLOBAL_VARS_FILE, 'utf8');
      defaultData = JSON.parse(refData);
      console.log('📂 Загружены данные глобальных переменных из референса');
    }
  } catch (error) {
    console.warn('⚠️ Не удалось загрузить данные из референса:', error.message);
  }
  
  // Если не удалось загрузить из референса, используем минимальные дефолтные данные
  if (!defaultData) {
    defaultData = {
      id: "1",
      name: "",
      key: "__global_vars",
      value: JSON.stringify([{
        name: "",
        key: "__default_vars",
        active: 1,
        default: 1,
        vars: []
      }]),
      type: "json"
    };
  }
  
  // Создаем директорию если её нет
  const dataDir = path.dirname(GLOBAL_VARS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Сохраняем дефолтные данные
  saveGlobalVars(defaultData);
  return defaultData;
}

/**
 * GET /api/catalog/global_vars - Получение глобальных переменных
 */
app.get('/api/catalog/global_vars', (req, res) => {
  try {
    console.log('🔍 Запрос глобальных переменных');
    const globalVars = loadGlobalVars();
    console.log('📦 Загружены данные:', {
      id: globalVars.id,
      key: globalVars.key,
      valueType: typeof globalVars.value,
      valueIsArray: Array.isArray(globalVars.value)
    });
    
    // Парсим value если это JSON строка
    let parsedValue = globalVars.value;
    if (typeof parsedValue === 'string') {
      try {
        parsedValue = JSON.parse(parsedValue);
        console.log('✅ value распарсен как JSON, количество групп:', Array.isArray(parsedValue) ? parsedValue.length : 'не массив');
      } catch (e) {
        console.warn('⚠️ Не удалось распарсить value как JSON:', e.message);
      }
    }
    
    const response = {
      ...globalVars,
      value: parsedValue
    };
    
    console.log('📤 Отправляем ответ:', {
      id: response.id,
      key: response.key,
      valueIsArray: Array.isArray(response.value),
      groupsCount: Array.isArray(response.value) ? response.value.length : 0
    });
    
    res.json(response);
  } catch (error) {
    console.error('❌ Ошибка получения глобальных переменных:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/global_vars/save - Сохранение изменений глобальных переменных
 */
app.post('/api/catalog/global_vars/save', (req, res) => {
  try {
    console.log('💾 Сохранение глобальных переменных');
    console.log('📦 Данные запроса:', JSON.stringify(req.body, null, 2));
    
    let data = req.body;
    
    // Если value - массив, преобразуем в JSON строку
    if (data.value && Array.isArray(data.value)) {
      data.value = JSON.stringify(data.value);
    }
    
    const saved = saveGlobalVars(data);
    
    if (saved) {
      console.log('✅ Глобальные переменные сохранены');
      res.json({
        result: 'success',
        message: 'Глобальные переменные успешно сохранены'
      });
    } else {
      res.status(500).json({ error: 'Ошибка сохранения' });
    }
  } catch (error) {
    console.error('❌ Ошибка сохранения глобальных переменных:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// МОКИ ПЕРЕМЕЩЕНЫ ВЫШЕ (перед express.static для /common_assets)
// ============================================

// ============================================
// Bazis Cloud proxy (CFRN → B3D конвертация)
// ============================================
const BAZIS_CLOUD = 'https://cloud.bazissoft.ru/api-cloud-tasks-public';
const BAZIS_APIKEY = 'e453ab6926db4fc3a7118f6306ecf586';
const BAZIS_CONVERT_TIMEOUT_MS = 180000;
const BAZIS_CONVERT_RETRYABLE_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNABORTED',
  'EPIPE',
  'UND_ERR_SOCKET',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
  'UND_ERR_CONNECT_TIMEOUT',
]);

function isRetryableBazisConvertError(error) {
  const code = String(error?.code || error?.cause?.code || '').toUpperCase();
  return BAZIS_CONVERT_RETRYABLE_CODES.has(code);
}

app.post('/config/index.php/api/bazis_convert', (req, res) => {
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', async () => {
    try {
      const rawBody = Buffer.concat(chunks);
      console.log(`[Bazis proxy] bazis_convert: received ${rawBody.length} bytes, forwarding...`);

      const contentType = req.headers['content-type'] || '';
      const { default: nodeFetch } = await import('node-fetch');
      let resp = null;
      let lastErr = null;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`[Bazis proxy] bazis_convert: attempt ${attempt}/2, ct=${contentType}, bytes=${rawBody.length}`);
          resp = await nodeFetch(`${BAZIS_CLOUD}/tasks/model-convert?convertType=1`, {
            method: 'POST',
            body: rawBody,
            headers: {
              'Content-Type': contentType,
              'Apikey': BAZIS_APIKEY,
            },
            signal: AbortSignal.timeout(BAZIS_CONVERT_TIMEOUT_MS),
          });
          break;
        } catch (err) {
          lastErr = err;
          const code = err?.code || err?.cause?.code || 'UNKNOWN';
          console.error(`[Bazis proxy] bazis_convert attempt ${attempt}/2 failed:`, code, err?.message || err);
          if (attempt >= 2 || !isRetryableBazisConvertError(err)) throw err;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (!resp) throw lastErr || new Error('Bazis proxy: no response received');

      const body = await resp.text();
      console.log(`[Bazis proxy] bazis_convert → ${resp.status}: ${body.substring(0, 300)}`);
      res.status(resp.status).type(resp.headers.get('content-type') || 'text/plain').send(body);
    } catch (e) {
      console.error('[Bazis proxy] bazis_convert error:', e);
      res.status(500).send('Proxy error: ' + (e.message || e));
    }
  });
});

app.get('/config/index.php/api/bazis_check_task/:taskId', async (req, res) => {
  try {
    const { default: nodeFetch } = await import('node-fetch');
    const resp = await nodeFetch(`${BAZIS_CLOUD}/tasks/${req.params.taskId}/download-result`, {
      method: 'GET',
      headers: { Apikey: BAZIS_APIKEY },
    });

    if (resp.status === 200) {
      const buf = Buffer.from(await resp.arrayBuffer());
      const hex = buf.subarray(0, 8).toString('hex');
      console.log(`[Bazis proxy] check_task ${req.params.taskId} → 200, ${buf.length} bytes, hex=${hex}`);
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="model.b3d"',
        'Content-Length': buf.length,
      });
      res.end(buf);
      return;
    }

    const body = await resp.text();
    console.log(`[Bazis proxy] check_task ${req.params.taskId} → ${resp.status}: ${body.substring(0, 200)}`);
    res.status(resp.status).type('text/plain').send(body);
  } catch (e) {
    console.error('[Bazis proxy] check_task error:', e);
    res.status(500).send('Proxy error: ' + (e.message || e));
  }
});

/** b3d → CFRN (Bazis convertType=0), зеркало export CFRN→b3d */
app.post('/config/index.php/api/bazis_convert_b3d', (req, res) => {
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', async () => {
    try {
      const rawBody = Buffer.concat(chunks);
      console.log(`[Bazis proxy] bazis_convert_b3d: received ${rawBody.length} bytes, forwarding...`);

      const contentType = req.headers['content-type'] || '';
      const { default: nodeFetch } = await import('node-fetch');
      let resp = null;
      let lastErr = null;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          resp = await nodeFetch(`${BAZIS_CLOUD}/tasks/model-convert?convertType=0`, {
            method: 'POST',
            body: rawBody,
            headers: {
              'Content-Type': contentType,
              Apikey: BAZIS_APIKEY,
            },
            signal: AbortSignal.timeout(BAZIS_CONVERT_TIMEOUT_MS),
          });
          break;
        } catch (err) {
          lastErr = err;
          if (attempt >= 2 || !isRetryableBazisConvertError(err)) throw err;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (!resp) throw lastErr || new Error('Bazis proxy: no response received');

      const body = await resp.text();
      console.log(`[Bazis proxy] bazis_convert_b3d → ${resp.status}: ${body.substring(0, 300)}`);
      res.status(resp.status).type(resp.headers.get('content-type') || 'text/plain').send(body);
    } catch (e) {
      console.error('[Bazis proxy] bazis_convert_b3d error:', e);
      res.status(500).send('Proxy error: ' + (e.message || e));
    }
  });
});

app.get('/config/index.php/bazis/bazis_decrement/', async (req, res) => {
  res.json({ status: 'success', current_value: 999, bazis_active: '1' });
});

app.get('/config/index.php/bazis/bazis_get_count/', async (req, res) => {
  res.json({ status: 'success', current_value: 999, bazis_active: '1' });
});

// ============================================
// AI Pilot (изолировано — НЕ трогает конструктор/комнату)
// ============================================
registerAiPilotRoutes(app);

// ============================================
// Запуск сервера
// ============================================
const _beforeListenMs = Date.now() - _startMs;
console.log(`⏱️ Загрузка модуля и регистрация маршрутов: ${_beforeListenMs} мс`);

app.listen(PORT, '0.0.0.0', () => {
  const _totalMs = Date.now() - _startMs;
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`🚀 ЕДИНЫЙ СЕРВЕР запущен на http://localhost:${PORT} (всего ${_totalMs} мс)`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📦 КОМНАТА (для пользователей):');
  console.log(`   http://localhost:${PORT}/`);
  console.log(`   http://localhost:${PORT}/index-refactored.html`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('⚙️ АДМИНКА (создание контента):');
  console.log(`   http://localhost:${PORT}/admin-new.html`);
  console.log(`🤖 AI Pilot (вне конструктора): http://localhost:${PORT}/ai-pilot.html`);
  console.log(`📁 Модули: ${MODULES_DIR}`);
  console.log(`📁 БД админки: ${DB_FILE}`);
  console.log('📤 Загрузка 3D моделей: POST http://localhost:' + PORT + '/api/upload/model_3d');
  console.log('═══════════════════════════════════════════════════════════');
  // Предзагрузка референса в фоне — админка не подвисает на первом запросе
  setImmediate(() => {
    try {
      getFullReferenceData();
      console.log('📂 Референс-данные предзагружены в фоне');
    } catch (e) {
      console.warn('⚠️ Фоновая предзагрузка референса:', e?.message || e);
    }
  });
});
