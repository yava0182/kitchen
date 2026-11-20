#!/usr/bin/env node
/**
 * Локальный чеклист выгрузки PP → docs/pp-dump + catalog_items.
 * Не ходит в сеть: только проверяет наличие файлов на диске.
 *
 * Usage: npm run dump:pp-checklist
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dumpDir = path.join(root, 'docs', 'pp-dump');
const catalogDir = path.join(root, 'catalog_items');

/** Kitchen-critical targets from ADMIN-PP-PARITY / pp-dump-urls */
const CRITICAL = [
  { id: 'default_settings', paths: ['docs/pp-dump/pp_default_settings.json', 'docs/pp-dump/pp_default_settings_parsed.json'] },
  { id: 'tabletop', paths: ['docs/pp-dump/pp_tabletop.json', 'catalog_items/tabletop_items.json'] },
  { id: 'tabletop_plinth', paths: ['docs/pp-dump/pp_tabletop_plinth.json'] },
  { id: 'cokol', paths: ['docs/pp-dump/pp_cokol.json', 'catalog_items/cokol_items.json'] },
  { id: 'cokol_top', paths: ['docs/pp-dump/pp_cokol_top.json'] },
  { id: 'handles', paths: ['docs/pp-dump/pp_handles.json', 'catalog_items/handles.json'] },
  { id: 'facades', paths: ['docs/pp-dump/pp_facades.json', 'catalog_items/facades.json'] },
  { id: 'materials_keys', paths: ['docs/pp-dump/pp_materials_keys.json', 'catalog_items/materials_keys.json'] },
  { id: 'butts_keys', paths: ['docs/pp-dump/pp_butts_keys.json', 'catalog_items/edges_keys.json', 'catalog_items/butt_butts.json'] },
  { id: 'shablony_korpusov', paths: ['docs/pp-dump/pp_catalog_shablony_korpusov.json', 'catalog_items/reference_catalog_shablony_korpusov.json'] },
  { id: 'catalogs_keys', paths: ['docs/pp-dump/pp_catalogs_keys.json', 'docs/pp-dump/clodis-catalogs_keys.json'] },
];

const OPTIONAL = [
  { id: 'material_ldsp', paths: ['docs/pp-dump/pp_material_ldsp.json'] },
  { id: 'material_hdf', paths: ['docs/pp-dump/pp_material_hdf.json'] },
  { id: 'material_m4', paths: ['docs/pp-dump/pp_material_m4.json'] },
  { id: 'glass', paths: ['docs/pp-dump/pp_glass.json'] },
  { id: 'butt_butts_pp', paths: ['docs/pp-dump/pp_butt_butts.json'] },
  { id: 'materials_master', paths: ['docs/pp-dump/pp_materials.json'] },
  { id: 'modules_groups', paths: ['docs/pp-dump/pp_modules_groups.json', 'catalog_items/modules_groups.json'] },
];

function existsAny(relPaths) {
  for (const rel of relPaths) {
    const abs = path.join(root, rel.replace(/\//g, path.sep));
    if (fs.existsSync(abs) && fs.statSync(abs).size > 2) return { ok: true, file: rel, bytes: fs.statSync(abs).size };
  }
  // empty array file (cokol_top []) counts as present but empty
  for (const rel of relPaths) {
    const abs = path.join(root, rel.replace(/\//g, path.sep));
    if (fs.existsSync(abs)) return { ok: true, file: rel, bytes: fs.statSync(abs).size, empty: fs.statSync(abs).size <= 2 };
  }
  return { ok: false };
}

function runGroup(title, items) {
  console.log('\n=== ' + title + ' ===');
  let pass = 0;
  let fail = 0;
  for (const item of items) {
    const r = existsAny(item.paths);
    if (r.ok) {
      pass++;
      const empty = r.empty ? ' (empty)' : '';
      console.log(`PASS  ${item.id} → ${r.file} (${r.bytes}b)${empty}`);
    } else {
      fail++;
      console.log(`MISS  ${item.id} → tried: ${item.paths.join(' | ')}`);
    }
  }
  return { pass, fail };
}

const a = runGroup('KITCHEN-CRITICAL', CRITICAL);
const b = runGroup('OPTIONAL / MATERIALS', OPTIONAL);

console.log('\n---');
console.log(`critical: ${a.pass}/${CRITICAL.length}  optional: ${b.pass}/${OPTIONAL.length}`);
console.log(`dump dir: ${dumpDir}`);
console.log(`catalog:  ${catalogDir}`);

if (a.fail > 0) {
  console.log('\nRESULT: FAIL (critical gaps)');
  process.exit(1);
}
console.log('\nRESULT: PASS (critical present)');
process.exit(0);
