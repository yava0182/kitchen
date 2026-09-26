import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, '../admin-new.html');
let content = fs.readFileSync(filePath, 'utf8');

const priceSublineBlock = (prefix) => `
        <div class="ibox room2-price-subline-ibox collapsed" style="margin-bottom:20px;" data-cu-prefix="${prefix}">
          <div class="ibox-title"><h5>Строка под ценой в конструкторе</h5><div class="ibox-tools"><a class="collapse-link" href="#" title="Свернуть/развернуть"><span class="collapse-triangle">&#9654;</span></a></div></div>
          <div class="ibox-content">
            <p class="text-muted mb-2">Текст под блоком с ценой в правой панели конструктора. Галка включает или выключает показ строки.</p>
            <div class="form-group" style="margin-bottom:16px;">
              <label class="d-flex align-items-center gap-2" style="cursor:pointer;">
                <input type="checkbox" class="room2-cu-show-price-subline" data-cu-prefix="${prefix}" /> Показывать строку под ценой
              </label>
            </div>
            <div class="form-group" style="margin-bottom:16px;">
              <label>Текст строки</label>
              <input type="text" class="room2-cu-price-subline-text form-control" data-cu-prefix="${prefix}" style="max-width:600px;" placeholder="Например: Условия доставки уточняйте у менеджера" />
            </div>
            <div class="form-group" style="margin-bottom:16px;">
              <label class="d-flex align-items-center gap-2" style="cursor:pointer;">
                <input type="checkbox" class="room2-cu-show-price-subline-help" data-cu-prefix="${prefix}" /> Показывать иконку ? (справка) после текста
              </label>
            </div>
            <div class="form-group" style="margin-bottom:16px;">
              <label>Текст справки (попап при нажатии на ?)</label>
              <textarea class="room2-cu-price-subline-help-text form-control" data-cu-prefix="${prefix}" rows="4" style="max-width:600px;" placeholder="Текст подсказки для пользователя"></textarea>
            </div>
            <button type="button" class="btn btn-primary room2-cu-save-price-subline" data-cu-prefix="${prefix}"><i class="fa fa-save"></i> Сохранить строку под ценой</button>
          </div>
        </div>`;

// Add to room2-step-1 (after the first ibox closing)
const step1Old = `            <button type="button" class="btn btn-primary btn-sm ml-2" id="room2-step1-save-btn"><i class="fa fa-save"></i> Сохранить шаг 1</button>
          </div>
        </div>
      </div>
    </div>
    
    <div id="room2-step-2"`;

const step1New = `            <button type="button" class="btn btn-primary btn-sm ml-2" id="room2-step1-save-btn"><i class="fa fa-save"></i> Сохранить шаг 1</button>
          </div>
        </div>
` + priceSublineBlock('step1') + `
      </div>
    </div>
    
    <div id="room2-step-2"`;

// Add to room2-step-2 (after the save button)
const step2Old = `            <button type="button" class="btn btn-primary btn-sm ml-2" id="room2-step2-save-btn"><i class="fa fa-save"></i> Сохранить шаг 2</button>
          </div>
        </div>
      </div>
    </div>
    
    <div id="room2-step-3"`;

const step2New = `            <button type="button" class="btn btn-primary btn-sm ml-2" id="room2-step2-save-btn"><i class="fa fa-save"></i> Сохранить шаг 2</button>
          </div>
        </div>
` + priceSublineBlock('step2') + `
      </div>
    </div>
    
    <div id="room2-step-3"`;

// Add to room2-step-3 (replace the placeholder)
const step3Old = `      <div class="wrapper-content">
        <div class="ibox">
          <div class="ibox-title"><h5>Настройки шага 3</h5></div>
          <div class="ibox-content"><p class="text-muted">Содержимое и настройки шага 3.</p></div>
        </div>
      </div>
    </div>
    
    <div id="room2-step-4"`;

const step3New = `      <div class="wrapper-content">
        <div class="ibox">
          <div class="ibox-title"><h5>Настройки шага 3</h5></div>
          <div class="ibox-content"><p class="text-muted">Содержимое и настройки шага 3.</p></div>
        </div>
` + priceSublineBlock('step3') + `
      </div>
    </div>
    
    <div id="room2-step-4"`;

if (content.includes('room2-price-subline-ibox')) {
  console.log('Already added');
  process.exit(0);
}

content = content.replace(step1Old, step1New);
content = content.replace(step2Old, step2New);
content = content.replace(step3Old, step3New);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Price subline blocks added to steps 1, 2, 3');
