const fs = require('fs');
const path = require('path');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '../catalog_items/global_vars.json'), 'utf8'));
const groups = JSON.parse(raw.value);
const vars = groups[0]?.vars || [];
const keys = [
  'depth_tabletop',
  'front_countertop_overhang',
  'back_countertop',
  'tabletop',
  '_tbl',
  'thickness',
];
for (const v of vars) {
  const k = String(v.key || '');
  if (
    keys.some((x) => k.includes(x)) ||
    /tabletop|столеш|countertop|_tbl/i.test(k + (v.name || ''))
  ) {
    console.log(JSON.stringify({ key: v.key, name: v.name, type: v.type, value: v.value }, null, 0));
  }
}
