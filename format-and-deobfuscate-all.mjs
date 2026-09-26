import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import js_beautify from 'js-beautify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const refsDir = path.join(__dirname, 'planplace_refs');
const targetDir = path.join(__dirname, 'planplace_refs', 'constructor_code_reference');

// Исключаем минифицированные библиотеки и уже обработанные файлы
const excludePatterns = [
  /\.min\.js$/,
  /_deobfuscated\.js$/,
  /_formatted\.js$/,
  /^jquery/i,
  /^lodash/i,
  /^vue\.min/i,
  /^toastr/i,
  /^sweetalert/i,
];

// Функция для форматирования JS файла
function formatFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Используем js-beautify с настройками для обфусцированного кода
    const formatted = js_beautify.js(content, {
      indent_size: 2,
      indent_char: ' ',
      max_preserve_newlines: 2,
      preserve_newlines: true,
      keep_array_indentation: false,
      break_chained_methods: false,
      indent_scripts: 'normal',
      brace_style: 'collapse',
      space_before_conditional: true,
      unindent_chained_methods: false,
      wrap_line_length: 120,
      end_with_newline: true,
      e4x: false,
      indent_empty_lines: false,
      jslint_happy: false,
      space_after_anon_function: false,
      space_in_paren: false,
      space_in_empty_paren: false,
      space_after_named_function: false,
      eol: '\n'
    });
    
    return formatted;
  } catch (error) {
    console.error(`Ошибка форматирования ${filePath}:`, error.message);
    return null;
  }
}

// Функция для базовой деобфускации
function deobfuscate(content) {
  let result = content;

  // 1. Замена шестнадцатеричных чисел на десятичные
  result = result.replace(/\b0x0\b/g, '0');
  result = result.replace(/\b0x1\b/g, '1');
  result = result.replace(/\b0x2\b/g, '2');
  result = result.replace(/\b0x3\b/g, '3');
  result = result.replace(/\b0x4\b/g, '4');
  result = result.replace(/\b0x5\b/g, '5');
  result = result.replace(/\b0x6\b/g, '6');
  result = result.replace(/\b0x7\b/g, '7');
  result = result.replace(/\b0x8\b/g, '8');
  result = result.replace(/\b0x9\b/g, '9');
  result = result.replace(/\b0xa\b/gi, '10');
  result = result.replace(/\b0xb\b/gi, '11');
  result = result.replace(/\b0xc\b/gi, '12');
  result = result.replace(/\b0xd\b/gi, '13');
  result = result.replace(/\b0xe\b/gi, '14');
  result = result.replace(/\b0xf\b/gi, '15');

  // Заменяем большие hex числа
  result = result.replace(/\b0x([0-9a-fA-F]+)\b/g, (match, hex) => {
    try {
      const num = parseInt(hex, 16);
      // Не заменяем большие числа, которые могут быть цветами
      if (num > 0xFFFFFF) return match;
      return num.toString();
    } catch {
      return match;
    }
  });

  // 2. Замена !![] на true, ![] на false
  result = result.replace(/!!\[\]/g, 'true');
  result = result.replace(/!\[\]/g, 'false');

  // 3. Замена !0x1 на false, !0x0 на true
  result = result.replace(/!1\b/g, 'false');
  result = result.replace(/!0\b/g, 'true');

  // 4. Упрощение строковых индексов
  result = result.replace(/(\w+)\['length'\]/g, '$1.length');
  result = result.replace(/(\w+)\['toString'\]\(\)/g, '$1.toString()');
  result = result.replace(/(\w+)\['push'\]\(/g, '$1.push(');
  result = result.replace(/(\w+)\['forEach'\]\(/g, '$1.forEach(');
  result = result.replace(/(\w+)\['map'\]\(/g, '$1.map(');
  result = result.replace(/(\w+)\['filter'\]\(/g, '$1.filter(');
  result = result.replace(/(\w+)\['findIndex'\]\(/g, '$1.findIndex(');
  result = result.replace(/(\w+)\['split'\]\(/g, '$1.split(');
  result = result.replace(/(\w+)\['replace'\]\(/g, '$1.replace(');
  result = result.replace(/(\w+)\['constructor'\]/g, '$1.constructor');
  result = result.replace(/(\w+)\['search'\]\(/g, '$1.search(');

  // 5. Упрощение Array методов
  result = result.replace(/Array\['isArray'\]\(/g, 'Array.isArray(');
  result = result.replace(/Array\['from'\]\(/g, 'Array.from(');

  return result;
}

// Проверка, нужно ли обрабатывать файл
function shouldProcessFile(fileName) {
  // Пропускаем исключенные паттерны
  for (const pattern of excludePatterns) {
    if (pattern.test(fileName)) {
      return false;
    }
  }
  
  // Пропускаем уже обработанные
  if (fileName.includes('_deobfuscated') || fileName.includes('_formatted')) {
    return false;
  }
  
  return true;
}

// Основная функция
async function processAllFiles() {
  // Убеждаемся, что целевая директория существует
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Получаем список всех JS файлов
  const allFiles = fs.readdirSync(refsDir)
    .filter(file => file.endsWith('.js'))
    .filter(file => shouldProcessFile(file))
    .sort();

  console.log(`Найдено ${allFiles.length} файлов для обработки:\n`);
  console.log(allFiles.join(', '));
  console.log('\n');

  let processed = 0;
  let skipped = 0;

  for (const file of allFiles) {
    const filePath = path.join(refsDir, file);
    const fileName = path.basename(file, '.js');
    
    // Проверяем, существует ли уже деобфусцированная версия
    const deobfuscatedPath = path.join(targetDir, `${fileName}_deobfuscated.js`);
    if (fs.existsSync(deobfuscatedPath)) {
      console.log(`⏭️  Пропускаем ${file} (уже обработан)\n`);
      skipped++;
      continue;
    }

    try {
      console.log(`📝 Обрабатываю ${file}...`);
      
      // Шаг 1: Форматирование
      const formatted = formatFile(filePath);
      
      if (!formatted) {
        console.log(`   ❌ Ошибка при форматировании ${file}\n`);
        skipped++;
        continue;
      }
      
      // Шаг 2: Деобфускация
      const deobfuscated = deobfuscate(formatted);
      
      // Шаг 3: Сохранение
      const targetPath = path.join(targetDir, `${fileName}_deobfuscated.js`);
      fs.writeFileSync(targetPath, deobfuscated, 'utf8');
      
      const sizeKB = (fs.statSync(targetPath).size / 1024).toFixed(2);
      console.log(`   ✅ Сохранен: ${fileName}_deobfuscated.js (${sizeKB} KB)\n`);
      processed++;
      
    } catch (error) {
      console.error(`   ❌ Ошибка при обработке ${file}:`, error.message);
      skipped++;
    }
  }

  console.log(`\n✅ Обработка завершена!`);
  console.log(`   Обработано: ${processed}`);
  console.log(`   Пропущено: ${skipped}`);
}

processAllFiles().catch(console.error);
