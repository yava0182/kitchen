#!/usr/bin/env node
/**
 * Попытка восстановить admin-new.html через перекодировку.
 * Если файл был записан в Windows-1251, читаем как Win1251 и сохраняем в UTF-8.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import iconv from 'iconv-lite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '../admin-new.html');

const buffer = fs.readFileSync(filePath);

// Пробуем Win1251 (типичная кодировка для русской Windows)
const asWin1251 = iconv.decode(buffer, 'win1251');

// Проверяем: есть ли кириллица и мало ли replacement chars
const cyrillicCount = (asWin1251.match(/[а-яёА-ЯЁ]/g) || []).length;
const replacementCount = (asWin1251.match(/\uFFFD/g) || []).length;

console.log('Cyrillic chars:', cyrillicCount, 'Replacement chars:', replacementCount);

if (cyrillicCount > 100 && replacementCount < 100) {
  fs.writeFileSync(filePath, asWin1251, 'utf8');
  console.log('Saved as UTF-8 (converted from Win1251).');
} else {
  // Пробуем как есть UTF-8 — возможно, проблема в BOM или другом
  const asUtf8 = buffer.toString('utf8');
  if (asUtf8.includes('Шаг') || asUtf8.includes('Назад')) {
    console.log('File already looks like valid UTF-8, no conversion needed.');
  } else {
    console.log('Could not auto-detect encoding. Cyrillic:', cyrillicCount, 'Replacements:', replacementCount);
    console.log('Try: restore from git (git checkout admin-new.html) or backup.');
  }
}
