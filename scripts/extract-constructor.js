/**
 * Extract initConstructorTab from admin-new.html to admin-constructor.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const adminPath = path.join(__dirname, '..');
const htmlPath = path.join(adminPath, 'admin-new.html');
const outPath = path.join(adminPath, 'js', 'admin', 'admin-constructor.js');

let content = fs.readFileSync(htmlPath, 'utf8');

// Find initConstructorTab block: from "function initConstructorTab()" to closing "}" before "// ===== Clodis"
const startMarker = '        // Инициализация функционала вкладки "Конструктор"\n      function initConstructorTab() {';
const endMarker = "        console.log('✅ Вкладка \"Конструктор\" инициализирована');\n      }";

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);
if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) {
  console.error('Could not find constructor block. startIdx=', startIdx, 'endIdx=', endIdx);
  process.exit(1);
}

const blockEnd = endIdx + endMarker.length;
let extracted = content.substring(startIdx, blockEnd);

// Fix sendHelpersToIframe: use window.__ppPreviewIframe (set by ensureClodisPreviewMounted in admin-new.html)
extracted = extracted.replace(
  /if \(!__ppPreviewIframe \|\| !__ppPreviewIframe\.contentWindow\) return;/,
  'const __ppPreviewIframe = window.__ppPreviewIframe || null;\n          if (!__ppPreviewIframe || !__ppPreviewIframe.contentWindow) return;'
);

// Rename function and fix indentation for module (reduce by 2 spaces)
extracted = extracted.replace(/^      function initConstructorTab\(\) \{/, '  function initConstructorTabImpl() {');
extracted = extracted.replace(/^        /gm, '    ');

// Wrap in IIFE and expose on window
const moduleContent = `/**
 * admin-constructor.js - Constructor tab (initConstructorTab, loadConstructorTreeFromJSON, getConstructorTreeJSON)
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

${extracted}

  window.initConstructorTab = initConstructorTabImpl;
})();
`;

fs.writeFileSync(outPath, moduleContent, 'utf8');
console.log('Created', outPath);

// Replace in admin-new.html with comment (initConstructorTab from admin-constructor.js)
const replacement = `        // initConstructorTab - admin-constructor.js (window.initConstructorTab)
`;

const before = content.substring(0, startIdx);
const after = content.substring(blockEnd);
const newContent = before + replacement + after;

fs.writeFileSync(htmlPath, newContent, 'utf8');
console.log('Updated admin-new.html - removed inline constructor block');

// Update initCatalogItemTabs to call window.initConstructorTab
let htmlContent = fs.readFileSync(htmlPath, 'utf8');
htmlContent = htmlContent.replace(
  /setTimeout\(\(\) => initConstructorTab\(\), 100\)/g,
  'setTimeout(() => { if (typeof window.initConstructorTab === \'function\') window.initConstructorTab(); }, 100)'
);
fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log('Updated initCatalogItemTabs to call window.initConstructorTab');
