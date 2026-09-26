import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import js_beautify from 'js-beautify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const refsDir = path.join(__dirname, 'planplace_refs');
const targetDir = path.join(__dirname, 'planplace_refs', 'constructor_code_reference');

// Список уже отформатированных файлов
const alreadyFormatted = ['main_core_v2_part13', 'main_core_v2_part18', 'main_core_v2_part19', 'main_core_v2_part20'];

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

// Основная функция
async function formatAllFiles() {
  // Убеждаемся, что целевая директория существует
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Получаем список всех файлов main_core_v2_part*.js
  const files = fs.readdirSync(refsDir)
    .filter(file => file.startsWith('main_core_v2_part') && file.endsWith('.js') && !file.includes('_formatted'))
    .sort();

  console.log(`Найдено ${files.length} файлов для форматирования:\n`);

  for (const file of files) {
    const filePath = path.join(refsDir, file);
    const fileName = path.basename(file, '.js');
    
    // Пропускаем уже отформатированные
    if (alreadyFormatted.some(name => fileName.includes(name))) {
      console.log(`⏭️  Пропускаем ${file} (уже отформатирован)`);
      continue;
    }

    console.log(`📝 Форматирую ${file}...`);
    
    const formatted = formatFile(filePath);
    
    if (formatted) {
      const targetPath = path.join(targetDir, `${fileName}_formatted.js`);
      fs.writeFileSync(targetPath, formatted, 'utf8');
      console.log(`   ✅ Сохранен: ${targetPath}\n`);
    } else {
      console.log(`   ❌ Ошибка при форматировании ${file}\n`);
    }
  }

  console.log('✅ Форматирование завершено!');
}

formatAllFiles().catch(console.error);
