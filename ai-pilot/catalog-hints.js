/**
 * Локальные подсказки из файлов каталога (read-only).
 * Не меняет каталог и не трогает конструктор.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FILL_OPTIONS } from './intent-schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_DIR = path.join(__dirname, '..', 'catalog_items');

function readJsonSafe(file, fallback) {
  try {
    const p = path.join(CATALOG_DIR, file);
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

export function getCatalogHints() {
  const handlesDoc = readJsonSafe('handles.json', { series: [] });
  const series = Array.isArray(handlesDoc.series) ? handlesDoc.series : [];
  const handleCollections = series
    .filter((s) => s && (s.active === 1 || s.active === true || s.active == null))
    .slice(0, 40)
    .map((s) => ({
      id: s.id,
      key: s.key || null,
      name: s.name || s.key || `collection_${s.id}`,
      kind: s.kind || null,
      modelsCount: Array.isArray(s.models) ? s.models.length : 0,
    }));

  const groups = readJsonSafe('modules_groups.json', []);
  const moduleGroups = (Array.isArray(groups) ? groups : [])
    .filter((g) => g && (g.active === 1 || g.active === true || g.active == null))
    .map((g) => ({ id: g.id, name: g.name || `group_${g.id}`, order: g.order ?? 0 }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const facades = readJsonSafe('facades.json', null);
  let facadesCount = 0;
  if (Array.isArray(facades)) facadesCount = facades.length;
  else if (facades && Array.isArray(facades.items)) facadesCount = facades.items.length;
  else if (facades && Array.isArray(facades.series)) facadesCount = facades.series.length;

  return {
    source: 'catalog_items (read-only)',
    fillOptions: FILL_OPTIONS,
    handleCollections,
    moduleGroups,
    facadesCount,
    tips: [
      'Ручки: выберите коллекцию из списка или «без ручек» (handles=none).',
      'Наполнение: rail / shelves / drawers / pants / shoes / antresol.',
      'Глубина ниши по умолчанию 600 мм, если не указана.',
      'GPT позже улучшит разбор фраз; мастер и mock уже дают тот же JSON.',
    ],
  };
}
