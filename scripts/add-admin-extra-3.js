#!/usr/bin/env node
/**
 * Добавляет admin-new-extra-3.js (файловый менеджер + перехват input file) в admin-new.html
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const htmlPath = path.join(__dirname, 'admin-new.html');
const needle = '<script src="/js/admin/admin-export-section-size-patch.js"></script>';
const patch = '<script src="/js/admin/admin-new-extra-3.js"></script>';
const insert = needle + '\n  ' + patch;

let content = fs.readFileSync(htmlPath, 'utf8');
if (content.includes('admin-new-extra-3.js')) {
  console.log('admin-new-extra-3.js already present.');
  process.exit(0);
}
if (!content.includes(needle)) {
  console.error('Could not find admin-export-section-size-patch.js script tag.');
  process.exit(1);
}
content = content.replace(needle, insert);
fs.writeFileSync(htmlPath, content);
console.log('Added admin-new-extra-3.js to admin-new.html');
