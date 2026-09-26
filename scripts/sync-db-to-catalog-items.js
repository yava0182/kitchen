/**
 * Скрипт для синхронизации элементов из db.json в catalog_items/{type}.json
 * 
 * Использование: node scripts/sync-db-to-catalog-items.js
 * 
 * Этот скрипт находит все элементы в db.json с catalog_type и синхронизирует их
 * в соответствующие файлы catalog_items/{catalog_type}.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'db.json');
const CATALOG_ITEMS_DIR = path.join(__dirname, '..', 'catalog_items');

function safeCatalogTypeKey(type) {
  return String(type || '').replace(/[^A-Za-z0-9._-]/g, '_');
}

function ensureCatalogItemsDir() {
  if (!fs.existsSync(CATALOG_ITEMS_DIR)) {
    fs.mkdirSync(CATALOG_ITEMS_DIR, { recursive: true });
  }
}

function loadCatalogItems(type) {
  ensureCatalogItemsDir();
  const file = path.join(CATALOG_ITEMS_DIR, `${safeCatalogTypeKey(type)}.json`);
  try {
    if (!fs.existsSync(file)) return [];
    const raw = fs.readFileSync(file, 'utf8');
    if (!raw || !raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error(`❌ Ошибка чтения catalog_items для "${type}":`, e?.message || e);
    return [];
  }
}

function saveCatalogItems(type, items) {
  ensureCatalogItemsDir();
  const file = path.join(CATALOG_ITEMS_DIR, `${safeCatalogTypeKey(type)}.json`);
  try {
    fs.writeFileSync(file, JSON.stringify(Array.isArray(items) ? items : [], null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(`❌ Ошибка сохранения catalog_items для "${type}":`, e?.message || e);
    return false;
  }
}

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      console.warn('⚠️ db.json не найден');
      return null;
    }
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    console.error('❌ Ошибка чтения db.json:', e?.message || e);
    return null;
  }
}

function syncDBToCatalogItems() {
  console.log('🔄 Начинаем синхронизацию db.json → catalog_items/...\n');
  
  const db = readDB();
  if (!db) {
    console.error('❌ Не удалось прочитать db.json');
    return;
  }
  
  if (!db.catalog_items || !Array.isArray(db.catalog_items)) {
    console.log('ℹ️ В db.json нет массива catalog_items');
    return;
  }
  
  console.log(`📦 Найдено ${db.catalog_items.length} элементов в db.json\n`);
  
  // Группируем элементы по catalog_type
  const itemsByType = new Map();
  
  for (const item of db.catalog_items) {
    const catalogType = item.catalog_type || item.data?.catalog_type || '';
    if (!catalogType) {
      console.warn(`⚠️ Элемент "${item.name || item.id}" не имеет catalog_type, пропускаем`);
      continue;
    }
    
    if (!itemsByType.has(catalogType)) {
      itemsByType.set(catalogType, []);
    }
    itemsByType.get(catalogType).push(item);
  }
  
  console.log(`📋 Найдено ${itemsByType.size} типов каталогов:\n`);
  for (const [type, items] of itemsByType) {
    console.log(`  - ${type}: ${items.length} элементов`);
  }
  console.log('');
  
  // Синхронизируем каждый тип
  let totalSynced = 0;
  let totalAdded = 0;
  let totalUpdated = 0;
  
  for (const [catalogType, dbItems] of itemsByType) {
    console.log(`🔄 Синхронизируем ${catalogType}...`);
    
    const stored = loadCatalogItems(catalogType);
    const syncedItems = [...stored];
    
    for (const dbItem of dbItems) {
      const existingIndex = syncedItems.findIndex(s => Number(s?.id) === Number(dbItem.id));
      
      const syncItem = {
        id: dbItem.id,
        name: dbItem.name || 'Элемент',
        ...(dbItem.element_type ? { element_type: dbItem.element_type } : {}),
        ...(dbItem.cabinet_tag ? { cabinet_tag: dbItem.cabinet_tag } : {}),
        ...(dbItem.category && dbItem.category.length > 0 ? { category: dbItem.category } : {}),
        ...(dbItem.icon ? { icon: dbItem.icon } : {}),
        data: dbItem.data || {},
        ...(dbItem.clodisJSON ? { clodisJSON: dbItem.clodisJSON } : {}),
        ...(dbItem.show_in_constructor !== undefined ? { show_in_constructor: dbItem.show_in_constructor } : {}),
        ...(dbItem.order !== undefined ? { order: dbItem.order } : {})
      };
      
      if (existingIndex >= 0) {
        syncedItems[existingIndex] = { ...syncedItems[existingIndex], ...syncItem };
        totalUpdated++;
        console.log(`  ✅ Обновлен: "${dbItem.name}" (ID: ${dbItem.id})`);
      } else {
        syncedItems.push(syncItem);
        totalAdded++;
        console.log(`  ➕ Добавлен: "${dbItem.name}" (ID: ${dbItem.id})`);
      }
    }
    
    if (saveCatalogItems(catalogType, syncedItems)) {
      totalSynced += syncedItems.length;
      console.log(`  ✅ Сохранено ${syncedItems.length} элементов в catalog_items/${catalogType}.json\n`);
    } else {
      console.error(`  ❌ Ошибка сохранения catalog_items/${catalogType}.json\n`);
    }
  }
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Синхронизация завершена!`);
  console.log(`   Всего элементов синхронизировано: ${totalSynced}`);
  console.log(`   Добавлено новых: ${totalAdded}`);
  console.log(`   Обновлено существующих: ${totalUpdated}`);
  console.log('═══════════════════════════════════════════════════════════');
}

// Запускаем синхронизацию
syncDBToCatalogItems();
