const fs = require('fs');
const data = JSON.parse(fs.readFileSync('catalog_items/catalog_46.json', 'utf8'));
const item = data.find((x) => String(x.id) === '3');
console.log({
  id: item.id,
  name: item.name,
  hasClodis: !!item.clodisJSON,
  clodisType: typeof item.clodisJSON,
  dataKeys: item.data ? Object.keys(item.data).slice(0, 15) : null,
  dataHasClodis: !!(item.data && item.data.clodisJSON),
});
