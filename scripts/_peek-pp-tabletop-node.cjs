const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '../data/bootstrap/items_get_pagination_multi.json');
const txt = fs.readFileSync(p, 'utf8');
// find a chunk around "Секция под столеш" unicode or latin type tabletop in constructor
const markers = [
  'Секция под столеш',
  '\\u0421\\u0435\\u043a\\u0446\\u0438\\u044f \\u043f\\u043e\\u0434 \\u0441\\u0442\\u043e\\u043b\\u0435\\u0448',
  '"type":"tabletop"',
  '\\"type\\":\\"tabletop\\"',
  'depth_tabletop',
];
for (const m of markers) {
  const i = txt.indexOf(m);
  console.log(m.slice(0, 40), '->', i);
  if (i >= 0) {
    console.log(txt.slice(Math.max(0, i - 80), i + 400).replace(/\n/g, ' ').slice(0, 500));
    console.log('---');
  }
}
