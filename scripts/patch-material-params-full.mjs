#!/usr/bin/env node
/**
 * Патч: полная вкладка «Параметры» по референсу Clodis — Кромка + Варианты
 * Запуск: node scripts/patch-material-params-full.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, '..', 'admin-new.html');

const FULL_PARAMS_TAB = `                    <div class="form-group row" style="display:none;">
                      <label class="col-sm-2 col-form-label">Толщина (мм)</label>
                      <div class="col-sm-10"><input type="number" id="material-thickness" class="form-control" value="16" min="0"></div>
                    </div>
                    <div class="form-group row" style="display:none;">
                      <label class="col-sm-2 col-form-label">Группа</label>
                      <div class="col-sm-10"><select id="material-group" class="form-control"><option value="">Не задано</option></select></div>
                    </div>
                    <div class="form-group row" style="display:none;">
                      <label class="col-sm-2 col-form-label">Описание</label>
                      <div class="col-sm-10"><textarea class="form-control" id="material-item-description" rows="2"></textarea></div>
                    </div>
                    <div class="form-group row">
                      <label class="col-sm-2 col-form-label">Кромка</label>
                      <div class="col-sm-10">
                        <div class="row" style="margin-bottom: 12px;">
                          <div class="col-sm-6">
                            <label class="col-form-label" style="font-size: 12px; color: #666;">Набор кромок</label>
                            <select id="material-edge-set" class="form-control form-control-sm">
                              <option value="">Набор по умолчанию</option>
                            </select>
                          </div>
                          <div class="col-sm-6">
                            <label class="col-form-label" style="font-size: 12px; color: #666;">Выберите материал</label>
                            <div class="d-flex align-items-center gap-2">
                              <a href="#" id="material-edge-select-link" class="text-primary" style="font-size: 14px;">Выбрать</a>
                              <button type="button" id="material-edge-edit-btn" class="btn btn-sm btn-success" title="Редактировать"><i class="fa fa-edit"></i></button>
                              <button type="button" id="material-edge-delete-btn" class="btn btn-sm btn-danger" title="Удалить"><i class="fa fa-trash"></i></button>
                            </div>
                            <div id="material-edge-list" style="margin-top: 8px; min-height: 24px;"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="form-group row" style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                      <label class="col-sm-2 col-form-label">Варианты</label>
                      <div class="col-sm-10">
                        <div class="row" style="margin-bottom: 10px;">
                          <div class="col-sm-2"><label class="col-form-label" style="font-size: 12px;">Название</label><input type="text" id="material-variant-name" class="form-control form-control-sm" placeholder="Дуб Гудзон бискотти"></div>
                          <div class="col-sm-2"><label class="col-form-label" style="font-size: 12px;">Артикул</label><input type="text" id="material-variant-article" class="form-control form-control-sm" placeholder="K527"></div>
                          <div class="col-sm-2"><label class="col-form-label" style="font-size: 12px;">Длина, мм</label><input type="number" id="material-variant-length" class="form-control form-control-sm" value="2800"></div>
                          <div class="col-sm-2"><label class="col-form-label" style="font-size: 12px;">Ширина, мм</label><input type="number" id="material-variant-width" class="form-control form-control-sm" value="2070"></div>
                          <div class="col-sm-2"><label class="col-form-label" style="font-size: 12px;">Толщина, мм</label><input type="number" id="material-variant-thickness" class="form-control form-control-sm" value="16"></div>
                        </div>
                        <div class="row" style="margin-bottom: 10px;">
                          <div class="col-sm-2"><label class="col-form-label" style="font-size: 12px;">Тип расчёта</label><select id="material-calculation-type" class="form-control form-control-sm"><option value="per_m2">р/м²</option><option value="per_mp">р/м.п</option></select></div>
                          <div class="col-sm-2"><label class="col-form-label" style="font-size: 12px;">Ввод цен</label><select id="material-price-input-type" class="form-control form-control-sm"><option value="manual">Ручной ввод</option><option value="import">Импорт</option></select></div>
                          <div class="col-sm-2"><label class="col-form-label" style="font-size: 12px;">Цена (руб)</label><input type="number" id="material-price-per-m2" class="form-control form-control-sm" placeholder="3500" min="0" step="0.01" value=""></div>
                          <div class="col-sm-2 d-flex align-items-end"><button type="button" id="material-variant-add-btn" class="btn btn-primary btn-sm">Добавить</button></div>
                        </div>
                        <div id="material-variants-list" style="margin-top: 12px;"></div>
                      </div>
                    </div>
`;

function findMatchingClose(html, startPos) {
  let depth = 1;
  let pos = startPos;
  while (depth > 0 && pos < html.length) {
    const nextOpen = html.indexOf('<div', pos);
    const nextClose = html.indexOf('</div>', pos);
    if (nextClose === -1) return -1;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + 4;
    } else {
      depth--;
      pos = nextClose + 6;
      if (depth === 0) return nextClose + 6;
    }
  }
  return -1;
}

try {
  let html = fs.readFileSync(htmlPath, 'utf8');
  const tabIdx = html.indexOf('id="mat-item-tab-params"');
  if (tabIdx === -1) {
    console.error('mat-item-tab-params не найден');
    process.exit(1);
  }
  const roleIdx = html.indexOf('role="tabpanel"', tabIdx);
  const contentStart = html.indexOf('>', roleIdx) + 1;
  const contentEnd = findMatchingClose(html, contentStart);
  if (contentEnd === -1) {
    console.error('Не найден конец tab-pane');
    process.exit(1);
  }
  html = html.slice(0, contentStart) + '\n' + FULL_PARAMS_TAB + '\n                    ' + html.slice(contentEnd - 6);
  fs.writeFileSync(htmlPath, html);
  console.log('Патч применён: полная вкладка Параметры (Кромка + Варианты)');
} catch (e) {
  console.error('Ошибка:', e.message);
  process.exit(1);
}
