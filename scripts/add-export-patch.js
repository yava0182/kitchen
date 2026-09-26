#!/usr/bin/env node
/**
 * Добавляет admin-export-section-size-patch.js в admin-new.html после admin-new-bundle.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const htmlPath = path.join(__dirname, '..', 'admin-new.html');
const needle = '<script src="/js/admin/admin-new-bundle.js"></script>';
const patch = '<script src="/js/admin/admin-export-section-size-patch.js"></script>';
const insert = needle + '\n  ' + patch;

let content = fs.readFileSync(htmlPath, 'utf8');
if (content.includes('admin-export-section-size-patch.js')) {
  console.log('Patch already present.');
  process.exit(0);
}
if (!content.includes(needle)) {
  console.error('Could not find admin-new-bundle.js script tag.');
  process.exit(1);
}
content = content.replace(needle, insert);
fs.writeFileSync(htmlPath, content);
console.log('Added admin-export-section-size-patch.js to admin-new.html');
