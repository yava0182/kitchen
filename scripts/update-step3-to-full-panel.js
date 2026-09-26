import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, '../admin-new.html');
let content = fs.readFileSync(filePath, 'utf8');

const step3FullPanel = `    <div id="room2-step-3" class="admin-page">
      <div class="page-heading" style="display:flex;align-items:center;gap:12px;">
        <a href="#room2-right-panel-page" class="btn btn-white btn-sm room2-back-to-list" data-page="room2-right-panel-page" title="Назад"><i class="fa fa-arrow-left"></i> Назад</a>
        <h2 style="margin:0;">Шаг 3 — <span id="room2-step3-heading-title">Шаг 3</span></h2>
      </div>
      <div class="wrapper-content">
        <div class="ibox">
          <div class="ibox-title"><h5>Пункты шага «Шаг 3»</h5></div>
          <div class="ibox-content">
            <p class="form-text text-muted mb-3">Настройте пункты шага. Укажите название, иконку (shape: или Font Awesome) и при необходимости категорию.</p>
            <div class="form-group row mb-2">
              <label class="col-sm-3 col-form-label">Название шага</label>
              <div class="col-sm-6">
                <input type="text" id="room2-step3-title" class="form-control form-control-sm" placeholder="Напр. Шаг 3">
              </div>
            </div>
            <div class="form-group row mb-3">
              <label class="col-sm-4 col-form-label">Картинок в строке (сетка)</label>
              <div class="col-sm-4">
                <select id="room2-step3-columns" class="form-control form-control-sm">
                  <option value="1">1 — одна картинка в строке</option>
                  <option value="2" selected>2 — две картинки в строке</option>
                </select>
              </div>
            </div>
            <p class="mb-2"><strong>Пункты:</strong> <span id="room2-step3-items-count" class="text-muted">0</span></p>
            <input type="file" id="room2-step3-icon-upload" accept="image/*" style="display:none;">
            <div id="room2-step3-items" class="border rounded p-3 mb-3" style="background:#fafafa; max-height: 420px; overflow-y: auto;"></div>
            <button type="button" class="btn btn-outline-primary btn-sm" id="room2-step3-add-btn"><i class="fa fa-plus"></i> Добавить иконку</button>
            <button type="button" class="btn btn-primary btn-sm ml-2" id="room2-step3-save-btn"><i class="fa fa-save"></i> Сохранить шаг 3</button>
          </div>
        </div>

        <div class="ibox room2-price-subline-ibox collapsed" style="margin-bottom:20px;" data-cu-prefix="step3">
          <div class="ibox-title"><h5>Строка под ценой в конструкторе</h5><div class="ibox-tools"><a class="collapse-link" href="#" title="Свернуть/развернуть"><span class="collapse-triangle">&#9654;</span></a></div></div>
          <div class="ibox-content">
            <p class="text-muted mb-2">Текст под блоком с ценой в правой панели конструктора. Галка включает или выключает показ строки.</p>
            <div class="form-group" style="margin-bottom:16px;">
              <label class="d-flex align-items-center gap-2" style="cursor:pointer;">
                <input type="checkbox" class="room2-cu-show-price-subline" data-cu-prefix="step3" /> Показывать строку под ценой
              </label>
            </div>
            <div class="form-group" style="margin-bottom:16px;">
              <label>Текст строки</label>
              <input type="text" class="room2-cu-price-subline-text form-control" data-cu-prefix="step3" style="max-width:600px;" placeholder="Например: Условия доставки уточняйте у менеджера" />
            </div>
            <div class="form-group" style="margin-bottom:16px;">
              <label class="d-flex align-items-center gap-2" style="cursor:pointer;">
                <input type="checkbox" class="room2-cu-show-price-subline-help" data-cu-prefix="step3" /> Показывать иконку ? (справка) после текста
              </label>
            </div>
            <div class="form-group" style="margin-bottom:16px;">
              <label>Текст справки (попап при нажатии на ?)</label>
              <textarea class="room2-cu-price-subline-help-text form-control" data-cu-prefix="step3" rows="4" style="max-width:600px;" placeholder="Текст подсказки для пользователя"></textarea>
            </div>
            <button type="button" class="btn btn-primary room2-cu-save-price-subline" data-cu-prefix="step3"><i class="fa fa-save"></i> Сохранить строку под ценой</button>
          </div>
        </div>
      </div>
    </div>`;

// Match from start of room2-step-3 to start of room2-step-4
const step3Regex = /<div id="room2-step-3" class="admin-page">[\s\S]*?<div id="room2-step-4"/;
if (!step3Regex.test(content)) {
  console.error('Could not find step 3 block');
  process.exit(1);
}
content = content.replace(step3Regex, step3FullPanel + '\n    \n    <div id="room2-step-4" class="admin-page">');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Step 3 updated to full panel');
