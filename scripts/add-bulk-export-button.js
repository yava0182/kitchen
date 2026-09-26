import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, '../admin-new.html');
let content = fs.readFileSync(filePath, 'utf8');

if (content.includes('admin-top-export-all')) {
  console.log('Bulk export button already added');
  process.exit(0);
}

content = content.replace(
  /<button type="button" class="btn btn-primary btn-sm" id="admin-top-export-settings" title="Выгрузить настройки в конструктор">\s*<i class="fa fa-upload"><\/i> Выгрузить настройки в конструктор\s*<\/button>/,
  '<button type="button" class="btn btn-primary btn-sm" id="admin-top-export-settings" title="Выгрузить текущий элемент в конструктор">\n      <i class="fa fa-upload"></i> Выгрузить настройки в конструктор\n    </button>\n    <button type="button" class="btn btn-success btn-sm" id="admin-top-export-all" title="Выгрузить все каталоги разом (модели, категории)">\n      <i class="fa fa-database"></i> Выгрузить всё в конструктор\n    </button>'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Bulk export button added');
