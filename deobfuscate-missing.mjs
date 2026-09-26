import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import js_beautify from 'js-beautify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, 'planplace_refs');
const targetDir = path.join(__dirname, 'planplace_refs', 'constructor_code_reference');

// Функция для форматирования JS файла
function formatFile(content) {
  try {
    return js_beautify.js(content, {
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
  } catch (error) {
    console.error(`Ошибка форматирования:`, error.message);
    return null;
  }
}

// Функция для базовой деобфускации
function deobfuscate(content) {
  let result = content;

  // 1. Замена hex чисел на decimal
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

  result = result.replace(/\b0x([0-9a-fA-F]+)\b/g, (match, hex) => {
    try {
      const num = parseInt(hex, 16);
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

  // 5. Упрощение Array['isArray'] -> Array.isArray
  result = result.replace(/Array\['isArray'\]\(/g, 'Array.isArray(');
  result = result.replace(/Array\['from'\]\(/g, 'Array.from(');

  return result;
}

// Основная функция
function deobfuscateMissingFiles() {
  // Получаем список уже деобфусцированных файлов
  const existingFiles = fs.existsSync(targetDir) 
    ? fs.readdirSync(targetDir)
        .filter(file => file.includes('_deobfuscated.js'))
        .map(file => file.replace('_deobfuscated.js', ''))
    : [];

  // Получаем все оригинальные файлы
  const allFiles = fs.readdirSync(sourceDir)
    .filter(file => file.startsWith('main_core_v2_part') && file.endsWith('.js') && !file.includes('formatted') && !file.includes('deobfuscated'))
    .sort();

  // Находим недостающие
  const missingFiles = allFiles.filter(file => {
    const baseName = file.replace('.js', '');
    return !existingFiles.includes(baseName);
  });

  console.log(`Найдено ${missingFiles.length} недостающих файлов для деобфускации:\n`);
  console.log(missingFiles.join(', '), '\n');

  for (const file of missingFiles) {
    const filePath = path.join(sourceDir, file);
    const fileName = file.replace('.js', '');
    
    console.log(`🔧 Обрабатываю ${file}...`);
    
    try {
      // Сначала форматируем
      const originalContent = fs.readFileSync(filePath, 'utf8');
      console.log(`   📝 Форматирую...`);
      const formatted = formatFile(originalContent);
      
      if (!formatted) {
        console.log(`   ⚠️  Пропускаем форматирование, продолжаем с оригиналом`);
        const deobfuscated = deobfuscate(originalContent);
        const targetPath = path.join(targetDir, `${fileName}_deobfuscated.js`);
        fs.writeFileSync(targetPath, deobfuscated, 'utf8');
        console.log(`   ✅ Сохранен (без форматирования): ${targetPath}\n`);
        continue;
      }
      
      // Затем деобфусцируем
      console.log(`   🔓 Деобфусцирую...`);
      const deobfuscated = deobfuscate(formatted);
      
      // Сохраняем
      const targetPath = path.join(targetDir, `${fileName}_deobfuscated.js`);
      fs.writeFileSync(targetPath, deobfuscated, 'utf8');
      
      const originalSize = originalContent.length;
      const newSize = deobfuscated.length;
      const diff = ((newSize - originalSize) / originalSize * 100).toFixed(1);
      
      console.log(`   ✅ Сохранен: ${targetPath}`);
      console.log(`   📊 Размер: ${originalSize} → ${newSize} (${diff > 0 ? '+' : ''}${diff}%)\n`);
    } catch (error) {
      console.error(`   ❌ Ошибка: ${error.message}\n`);
    }
  }

  console.log('✅ Обработка недостающих файлов завершена!');
}

deobfuscateMissingFiles();
