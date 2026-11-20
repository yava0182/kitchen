import fs from 'fs';
import path from 'path';

const outDir = 'D:/Clodis-Kitchen/docs/pp-dump';
fs.mkdirSync(outDir, { recursive: true });

function parseAgentJson(src) {
  let raw = fs.readFileSync(src, 'utf8');
  const m = raw.match(/```json\r?\n([\s\S]*)\r?\n```/);
  if (!m) throw new Error('no json fence in ' + src);
  return JSON.parse(m[1]);
}

const materialSrc =
  'C:/Users/Admin/.cursor/projects/d-Clodis-Kitchen/agent-tools/3d15d4a3-8338-4eee-9185-b38d69940052.txt';
const data = parseAgentJson(materialSrc);
const report = [];

for (const [k, v] of Object.entries(data)) {
  if (!k.startsWith('__full_')) continue;
  const name = k.slice(7);
  const file = path.join(outDir, `pp_${name}.json`);
  fs.writeFileSync(file, JSON.stringify(v, null, 2));
  report.push({
    k: name,
    len: Array.isArray(v) ? v.length : null,
    bytes: fs.statSync(file).size,
  });
}

// catalogs_keys — from live dump summary (kitchen-critical index)
const catalogsKeys = [
  { id: '1', name: 'Кухни', key: 'module', order: '1' },
  { id: '2', name: 'Двери кухонных модулей', key: 'door', order: '2' },
  { id: '4', name: 'Полки', key: 'shelves', order: '4' },
  { id: '5', name: 'Полкодержатели', key: 'polkaderzh', order: '5' },
  { id: '6', name: 'Петли накладные', key: 'hinges', order: '6' },
  { id: '7', name: 'Опоры', key: 'opory', order: '7' },
  { id: '8', name: 'Двери для шкафов', key: 'dveri_shkaf', order: '8' },
  { id: '9', name: 'Шкафы', key: 'korpusnaya_mebel', order: '9' },
  { id: '10', name: 'Ящики для шкафов', key: 'yashik_shkaf', order: '10' },
  { id: '11', name: 'Полки и перегородки для шкафов', key: 'polki_shkaf', order: '11' },
  { id: '12', name: 'Двери для углового модуля', key: 'doors_ugol', order: '12' },
  { id: '13', name: 'Петли угловые', key: 'petli_ugol', order: '13' },
  { id: '16', name: 'ШАБЛОНЫ КОРПУСОВ', key: 'shablony_korpusov', order: '16' },
  { id: '17', name: 'ШАБЛОНЫ КОРПУСОВ GOLA', key: 'decors', order: '17' },
  { id: '18', name: 'Сушки', key: 'Sushki', order: '18' },
  { id: '19', name: 'Профиль Gola', key: 'profil_gola', order: '19' },
  { id: '20', name: 'Духовые шкафы', key: 'duh_shkaf', order: '20' },
  { id: '21', name: 'Встроенные микроволновки', key: 'mic_vstr', order: '21' },
  { id: '22', name: 'Бутылочницы', key: 'butylochnitsy', order: '22' },
  { id: '24', name: 'Ящики', key: 'drawer_templates', order: '24' },
  { id: '25', name: 'Ящики скрытые', key: 'hidden_drawers_templates', order: '25' },
  { id: '26', name: 'Петли вкладные', key: 'putli_vkladnie', order: '26' },
  { id: '27', name: 'Петли полунакладные', key: 'petli_polunakladnye', order: '27' },
  { id: '28', name: 'Петли фальшпанельные', key: 'petli_falshpanelnye', order: '28' },
  { id: '29', name: 'Полки радиусные', key: 'c29', order: '29' },
  { id: '30', name: 'Стеновые панели', key: 'c30', order: '30' },
  { id: '31', name: 'Петли 45°', key: 'c31', order: '31' },
  { id: '32', name: 'Двери для угловой трапеции', key: 'c32', order: '32' },
  { id: '33', name: 'Полки для угловой трапеции', key: 'c33', order: '33' },
  { id: '35', name: 'Фасады карусель', key: 'c34', order: '35' },
  { id: '36', name: 'Полки (срезанные углы)', key: 'c36', order: '36' },
  { id: '38', name: 'Полки (скругленные углы)', key: 'c38', order: '38' },
  { id: '39', name: 'Полки (срезанные углы  и дверь)', key: 'c39', order: '39' },
];
fs.writeFileSync(path.join(outDir, 'pp_catalogs_keys.json'), JSON.stringify(catalogsKeys, null, 2));
report.push({ k: 'catalogs_keys', len: catalogsKeys.length });

const ds = JSON.parse(fs.readFileSync(path.join(outDir, 'pp_default_settings.json'), 'utf8'));
if (Array.isArray(ds) && ds[0] && typeof ds[0].data === 'string') {
  const parsed = JSON.parse(ds[0].data);
  fs.writeFileSync(path.join(outDir, 'pp_default_settings_parsed.json'), JSON.stringify(parsed, null, 2));
  report.push({ k: 'default_settings_parsed', keys: Object.keys(parsed) });
}

const indexPath = path.join(outDir, '_dump-index.json');
let index = { dumps: [] };
if (fs.existsSync(indexPath)) {
  try {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (_) {}
}
index.materialsPass = { at: new Date().toISOString(), report };
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
console.log(JSON.stringify(report, null, 2));
