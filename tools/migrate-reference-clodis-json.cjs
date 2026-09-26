/**
 * planPlaceJSON / planPlaceVariables → clodisJSON / clodisVariables в эталонных JSON.
 * Запуск: node tools/migrate-reference-clodis-json.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TARGETS = [
  path.join(ROOT, 'catalog_items'),
].flatMap((dir) =>
  fs.readdirSync(dir)
    .filter((f) => f.startsWith('reference_') && f.endsWith('.json'))
    .map((f) => path.join(dir, f))
);

function migrateNode(obj) {
  if (!obj || typeof obj !== 'object') return 0;
  let n = 0;
  if (Array.isArray(obj)) {
    for (const item of obj) n += migrateNode(item);
    return n;
  }
  if (obj.planPlaceJSON != null && obj.clodisJSON == null) {
    obj.clodisJSON = obj.planPlaceJSON;
    n += 1;
  }
  if (obj.planPlaceVariables != null && obj.clodisVariables == null) {
    obj.clodisVariables = obj.planPlaceVariables;
    n += 1;
  }
  delete obj.planPlaceJSON;
  delete obj.planPlaceVariables;
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') n += migrateNode(v);
  }
  return n;
}

let total = 0;
for (const file of TARGETS) {
  const raw = fs.readFileSync(file, 'utf8');
  const data = JSON.parse(raw);
  const n = migrateNode(data);
  if (n > 0) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log('✓', path.relative(ROOT, file), '— полей:', n);
    total += n;
  } else {
    console.log('·', path.relative(ROOT, file), '— без изменений');
  }
}
console.log('Готово. Всего миграций:', total);
