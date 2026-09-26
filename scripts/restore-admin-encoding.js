/**
 * Restore admin-new.html encoding.
 * Cause: fix-admin-typo.js read file (possibly Win1251) as UTF-8,
 * causing Cyrillic to become replacement chars (U+FFFD).
 * This script replaces corrupted sequences with correct Russian.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, '../admin-new.html');
const R = '\uFFFD'; // replacement character

// Replacements: [corrupted, correct] - order matters (more specific first)
const REPLACEMENTS = [
  // Step buttons
  [`>${R}${R}${R} 1</a>`, '>Шаг 1</a>'],
  [`>${R}${R}${R} 2</a>`, '>Шаг 2</a>'],
  [`>${R}${R}${R} 3</a>`, '>Шаг 3</a>'],
  [`>${R}${R}${R} 4</a>`, '>Шаг 4</a>'],
  [`>${R}${R}${R} 5</a>`, '>Шаг 5</a>'],
  [`>${R}${R}${R} 6</a>`, '>Шаг 6</a>'],
  [`>${R}${R}${R} 7</a>`, '>Шаг 7</a>'],
  [`>${R}${R}${R} 8</a>`, '>Шаг 8</a>'],
  [`>${R}${R}${R} 9</a>`, '>Шаг 9</a>'],
  // Назад (5 chars)
  [`title="${R}${R}${R}${R}${R}"`, 'title="Назад"'],
  [`</i> ${R}${R}${R}${R}${R}</a>`, '</i> Назад</a>'],
  [`>${R}${R}${R}${R}${R}</a>`, '>Выход</a>'],  // logout
  // Common phrases - use context
  [`<h2 style="margin:0;">${R}${R}${R} 1 —`, '<h2 style="margin:0;">Шаг 1 —'],
  [`<h2 style="margin:0;">${R}${R}${R} 2 —`, '<h2 style="margin:0;">Шаг 2 —'],
  [`<h2 style="margin:0;">${R}${R}${R} 3 —`, '<h2 style="margin:0;">Шаг 3 —'],
  [`<h2 style="margin:0;">${R}${R}${R} 4</h2>`, '<h2 style="margin:0;">Шаг 4</h2>'],
  [`<h2 style="margin:0;">${R}${R}${R} 5</h2>`, '<h2 style="margin:0;">Шаг 5</h2>'],
  [`<h2 style="margin:0;">${R}${R}${R} 6</h2>`, '<h2 style="margin:0;">Шаг 6</h2>'],
  [`<h2 style="margin:0;">${R}${R}${R} 7</h2>`, '<h2 style="margin:0;">Шаг 7</h2>'],
  [`<h2 style="margin:0;">${R}${R}${R} 8</h2>`, '<h2 style="margin:0;">Шаг 8</h2>'],
  [`<h2 style="margin:0;">${R}${R}${R} 9</h2>`, '<h2 style="margin:0;">Шаг 9</h2>'],
  [`<span id="room2-step3-heading-title">${R}${R}${R} 3</span>`, '<span id="room2-step3-heading-title">Шаг 3</span>'],
  // Настройки шага N
  [`<h5>${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R} 4</h5>`, '<h5>Настройки шага 4</h5>'],
  [`<h5>${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R} 5</h5>`, '<h5>Настройки шага 5</h5>'],
  [`<h5>${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R} 6</h5>`, '<h5>Настройки шага 6</h5>'],
  [`<h5>${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R} 7</h5>`, '<h5>Настройки шага 7</h5>'],
  [`<h5>${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R} 8</h5>`, '<h5>Настройки шага 8</h5>'],
  [`<h5>${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R} 9</h5>`, '<h5>Настройки шага 9</h5>'],
  // Свернуть/развернуть
  [`title="${R}${R}${R}${R}${R}${R}${R}${R}${R}/${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}"`, 'title="Свернуть/развернуть"'],
  // Шаг 1 — выбор формы, etc
  [`Шаг 1 — ${R}${R}${R} ${R}${R}${R}${R}${R}${R}${R}`, 'Шаг 1 — выбор формы'],
  [`Шаг 2 — ${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R}${R}`, 'Шаг 2 — планировки'],
  [`Шаг 3 — `, 'Шаг 3 — '],
  // Пункты шага
  [`<h5>${R}${R}${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R}${R} ${R}${R}${R}${R} ${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}</h5>`, '<h5>Пункты шага «Выбор формы»</h5>'],
  [`<h5>${R}${R}${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R}${R} ${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R}${R}</h5>`, '<h5>Пункты шага «Планировки»</h5>'],
  [`<h5>${R}${R}${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R}${R} ${R}${R}${R}${R} 3»</h5>`, '<h5>Пункты шага «Шаг 3»</h5>'],
  // Строка под ценой
  [`<h5>${R}${R}${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R} ${R}${R}${R}${R} ${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}</h5>`, '<h5>Строка под ценой в конструкторе</h5>'],
  // Title and nav (from constructor-clodis / REFERENCE)
  [`<title>Clodis - ${R}${R}${R}${R}${R}${R}${R}-${R}${R}${R}${R}${R}</title>`, '<title>Clodis - Панель-админ</title>'],
  [`<span class="nav-label">${R}${R}${R}${R}${R}${R} ${R}${R} ${R}${R}${R}${R}${R}${R}</span>`, '<span class="nav-label">Заявки на расчет</span>'],
  [`<span class="nav-label">${R}${R}${R} ${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}</span>`, '<span class="nav-label">Код конструктора</span>'],
  [`<span class="nav-label">${R}${R}${R}${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}</span>`, '<span class="nav-label">Настройки конструктора</span>'],
  [`<span class="nav-label">${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R}</span>`, '<span class="nav-label">Расчет цен</span>'],
  [`<span class="nav-label">${R}${R}${R}${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R}</span>`, '<span class="nav-label">Настройка меню</span>'],
  [`<span class="nav-label">${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}</span>`, '<span class="nav-label">Пользователи</span>'],
  [`<span class="nav-label">${R}${R}${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}</span>`, '<span class="nav-label">Глобальные переменные</span>'],
  [`<span class="nav-label">${R}${R}${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}</span>`, '<span class="nav-label">Каталог элементов</span>'],
  [`<span class="nav-label">${R}${R}${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}</span>`, '<span class="nav-label">Плитные материалы</span>'],
  [`<span class="nav-label">${R}${R}${R}${R}${R}${R}</span>`, '<span class="nav-label">Кромки</span>'],
  [`<span class="nav-label">${R}${R}${R}${R}${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R}${R}${R}${R}${R}</span>`, '<span class="nav-label">Шаблоны присадки</span>'],
  [`<span class="nav-label">${R}${R}${R}${R}${R}${R}${R}${R} 3D ${R}${R}${R}${R}${R}${R}</span>`, '<span class="nav-label">Каталог 3D моделей</span>'],
  [`<span class="nav-label">${R}${R}${R}${R}${R}${R}</span>`, '<span class="nav-label">Фасады</span>'],
  [`<span class="nav-label">${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R} ${R} ${R}${R}${R}${R}${R}${R}${R}${R}${R}</span>`, '<span class="nav-label">Комплектующие и фурнитура</span>'],
  [`<span class="nav-label">${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R}${R}</span>`, '<span class="nav-label">Расчет цен</span>'],
  [`<span class="nav-label">${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R}${R}${R}</span>`, '<span class="nav-label">Настройки помещений</span>'],
  [`<span class="nav-label">${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R}${R} ${R}${R}${R}${R}${R}${R} 2</span>`, '<span class="nav-label">Настройки помещений 2</span>'],
];

// Mojibake from wrong Win1251 decode: "пїЅ" = one replacement char
const MOJIBAKE = '\u043F\u0457\u0405'; // пїЅ

async function main() {
  let content = fs.readFileSync(filePath, 'utf8');

  // Step 1: Undo Win1251 damage - convert "пїЅ" back to replacement char
  if (content.includes(MOJIBAKE)) {
    content = content.split(MOJIBAKE).join(R);
    console.log('Converted mojibake to replacement chars');
  }

  // Step 2: Replace corrupted sequences with correct Russian
  let count = 0;
  for (const [from, to] of REPLACEMENTS) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      count++;
    }
  }
  console.log('Applied', count, 'replacements');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Saved.');
}

main().catch(console.error);
