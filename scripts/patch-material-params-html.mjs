#!/usr/bin/env node
/**
 * Патч: добавляет блок «Варианты / Цена» во вкладку Параметры редактора материала.
 * Запуск: node scripts/patch-material-params-html.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, '..', 'admin-new.html');

const BLOCK_TO_INSERT = `
                      <!-- Варианты / Цена (расчёт по рефу Clodis) -->
                      <div class="form-group row" style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <label class="col-sm-2 col-form-label">Варианты / Цена</label>
                        <div class="col-sm-10">
                          <div class="row" style="margin-bottom: 12px;">
                            <div class="col-sm-3">
                              <label class="col-form-label" style="font-size: 12px; color: #666;">Тип расчёта</label>
                              <select id="material-calculation-type" class="form-control form-control-sm">
                                <option value="per_m2">р/м²</option>
                                <option value="per_mp">р/м.п</option>
                              </select>
                            </div>
                            <div class="col-sm-3">
                              <label class="col-form-label" style="font-size: 12px; color: #666;">Ввод цен</label>
                              <select id="material-price-input-type" class="form-control form-control-sm">
                                <option value="manual">Ручной ввод</option>
                                <option value="import">Импорт</option>
                              </select>
                            </div>
                            <div class="col-sm-3">
                              <label class="col-form-label" style="font-size: 12px; color: #666;">Цена (руб)</label>
                              <input type="number" id="material-price-per-m2" class="form-control form-control-sm" placeholder="3500" min="0" step="0.01" value="">
                            </div>
                          </div>
                        </div>
                      </div>
`;

const SEARCH = /(<textarea class="form-control" id="material-item-description"[^>]*><\/textarea>\s*<\/div>\s*<\/div>)(\s*<\/div>)/;
const REPLACE = `$1${BLOCK_TO_INSERT}$2`;

try {
  let html = fs.readFileSync(htmlPath, 'utf8');
  if (html.includes('id="material-price-per-m2"')) {
    console.log('Блок уже добавлен, пропуск.');
    process.exit(0);
  }
  html = html.replace(SEARCH, REPLACE);
  if (!html.includes('id="material-price-per-m2"')) {
    // fallback: поиск по другому паттерну (разная кодировка placeholder)
    const altSearch = /id="material-item-description"[^>]*>[\s\S]*?<\/textarea>\s*<\/div>\s*<\/div>\s*<\/div>/;
    const match = html.match(altSearch);
    if (match) {
      const insertPos = html.indexOf(match[0]) + match[0].length - 7; // перед </div></div>
      html = html.slice(0, insertPos) + BLOCK_TO_INSERT + html.slice(insertPos);
    }
  }
  fs.writeFileSync(htmlPath, html);
  console.log('Патч применён: admin-new.html');
} catch (e) {
  console.error('Ошибка:', e.message);
  process.exit(1);
}
