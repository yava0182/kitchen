#!/usr/bin/env node
/**
 * Копирует src/constructor-clodis.js → js/constructor/ (после правок в src).
 * Блокирует sync, если внутри обработчика setTemplateTree снова появляется
 * postMessage cld:clodisJSONReady (цикл admin↔iframe → зависание вкладки).
 * Явный ответ только через cld:pullClodisJSON.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const src = path.join(root, 'src', 'constructor-clodis.js');
const destDir = path.join(root, 'js', 'constructor');
const dest = path.join(destDir, 'constructor-clodis.js');

function assertNoSetTemplateTreeEcho(filePath, label) {
  const text = fs.readFileSync(filePath, 'utf8');
  const marker = "data.type === 'cld:setTemplateTree'";
  const setTreeIdx = text.indexOf(marker);
  if (setTreeIdx < 0) return;
  // До следующего top-level else if data.type (после блока setTemplateTree).
  const after = text.slice(setTreeIdx + marker.length);
  const nextType = after.search(/\n\s*\} else if \(data\.type === '/);
  const chunk = nextType >= 0 ? after.slice(0, nextType) : after.slice(0, 16000);
  if (/postMessage\(\s*\{\s*type:\s*['"]cld:clodisJSONReady['"]/.test(chunk)) {
    console.error(
      `[sync-constructor-clodis] BLOCKED: ${label} шлёт cld:clodisJSONReady внутри setTemplateTree.\n` +
        'Это возвращает цикл зависания админки. Используйте только cld:pullClodisJSON.'
    );
    process.exit(1);
  }
}

if (!fs.existsSync(src)) {
  console.error('Missing:', src);
  process.exit(1);
}

assertNoSetTemplateTreeEcho(src, 'src/constructor-clodis.js');

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);

assertNoSetTemplateTreeEcho(dest, 'js/constructor/constructor-clodis.js');

console.log('✅', path.relative(root, src), '→', path.relative(root, dest));
