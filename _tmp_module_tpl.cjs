const fs = require('fs');
const path = require('path');

function extractMethod(file, name) {
  const t = fs.readFileSync(file, 'utf8');
  const r2 = new RegExp(`\\n\\s*${name}\\s*\\(`, 'g');
  let m;
  let idx = -1;
  while ((m = r2.exec(t))) {
    const slice = t.slice(m.index, m.index + 200);
    if (/\)\s*\{/.test(slice)) {
      idx = m.index;
      break;
    }
  }
  if (idx < 0) return null;
  const brace = t.indexOf('{', idx);
  let i = brace;
  let depth = 0;
  for (; i < t.length; i++) {
    if (t[i] === '{') depth++;
    else if (t[i] === '}') {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    }
  }
  return { startLine: t.slice(0, idx).split(/\r?\n/).length, text: t.slice(idx + 1, i) };
}

const ref = path.join('D:', 'Копии конструктора', 'Копии Clodis-Kitchen', '1.9 крепеж ок', 'Clodis-Kitchen', 'js', 'ClodisBuilder.js');
const cur = path.join('D:', 'Clodis-Kitchen', 'js', 'ClodisBuilder.js');
for (const name of ['_moduleTemplateFromCatalogItem', '_getCatalogItemById', '_ensureCatalogFromStaticJsonSync']) {
  const r = extractMethod(ref, name);
  const c = extractMethod(cur, name);
  console.log(name, 'REF', r && r.startLine, r && r.text.length, 'CUR', c && c.startLine, c && c.text.length, r && c && r.text === c.text ? 'SAME' : 'DIFF');
  fs.writeFileSync(path.join('D:', 'Clodis-Kitchen', `_tmp_ref_${name}.js`), r ? r.text : 'NO', 'utf8');
  fs.writeFileSync(path.join('D:', 'Clodis-Kitchen', `_tmp_cur_${name}.js`), c ? c.text : 'NO', 'utf8');
}
console.log('\n===== REF _moduleTemplateFromCatalogItem =====');
console.log(fs.readFileSync(path.join('D:', 'Clodis-Kitchen', '_tmp_ref__moduleTemplateFromCatalogItem.js'), 'utf8'));
console.log('\n===== CUR _moduleTemplateFromCatalogItem =====');
console.log(fs.readFileSync(path.join('D:', 'Clodis-Kitchen', '_tmp_cur__moduleTemplateFromCatalogItem.js'), 'utf8'));
