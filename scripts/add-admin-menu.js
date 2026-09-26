#!/usr/bin/env node
/**
 * Добавляет admin-menu.js в admin-new.html (loadMenuSettings нужен бандлу)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const htmlPath = path.join(__dirname, 'admin-new.html');
const needle = '<script src="/js/admin/admin-groups.js"></script>';
const patch = '<script src="/js/admin/admin-menu.js"></script>';
const insert = needle + '\n  ' + patch;

let content = fs.readFileSync(htmlPath, 'utf8');
if (content.includes('admin-menu.js')) {
  console.log('admin-menu.js already present.');
  process.exit(0);
}
if (!content.includes(needle)) {
  console.error('Could not find admin-groups.js script tag.');
  process.exit(1);
}
content = content.replace(needle, insert);
fs.writeFileSync(htmlPath, content);
console.log('Added admin-menu.js to admin-new.html');
