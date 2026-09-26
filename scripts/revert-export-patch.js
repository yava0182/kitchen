#!/usr/bin/env node
/**
 * Откат: убирает admin-export-section-size-patch.js из admin-new.html,
 * сохраняет файл в UTF-8.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const htmlPath = path.join(__dirname, '..', 'admin-new.html');

let content = fs.readFileSync(htmlPath, 'utf8');

// Удаляем строку с patch-скриптом (все варианты)
content = content.replace(/\s*<script src="\/js\/admin\/admin-export-section-size-patch\.js"><\/script>\s*/g, '\n');
content = content.replace(/`n\s*<script src="\/js\/admin\/admin-export-section-size-patch\.js"><\/script>\s*/g, '');

fs.writeFileSync(htmlPath, content, 'utf8');
console.log('Reverted: removed admin-export-section-size-patch.js from admin-new.html');
