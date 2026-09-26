#!/usr/bin/env node
/**
 * Временно отключает admin-new-extra-3.js (удаляет script tag из admin-new.html)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const htmlPath = path.join(__dirname, 'admin-new.html');
let content = fs.readFileSync(htmlPath, 'utf8');

const lineToRemove = '<script src="/js/admin/admin-new-extra-3.js"></script>';
if (!content.includes(lineToRemove)) {
  console.log('admin-new-extra-3.js уже отключён (script tag не найден)');
  process.exit(0);
}

content = content.replace(lineToRemove.trim() + '\n', '').replace(lineToRemove.trim(), '');
content = content.replace(/\n\s*\n\s*\n/g, '\n\n'); // убираем лишние пустые строки
fs.writeFileSync(htmlPath, content);
console.log('Отключено: admin-new-extra-3.js');
