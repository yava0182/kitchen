import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const refsDir = path.join(__dirname, 'planplace_refs', 'constructor_code_reference');
const targetDir = path.join(__dirname, 'planplace_refs', 'constructor_code_reference');

// Функция для базовой деобфускации
function deobfuscate(content) {
  let result = content;

  // 1. Замена шестнадцатеричных чисел на десятичные (осторожно, чтобы не затронуть hex-коды цветов)
  // Заменяем 0x0, 0x1, 0x2, ... на 0, 1, 2, ...
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

  // Заменяем большие hex числа (0x10, 0x20, 0x100, 0x384, etc.)
  // Используем функцию для преобразования
  result = result.replace(/\b0x([0-9a-fA-F]+)\b/g, (match, hex) => {
    try {
      const num = parseInt(hex, 16);
      // Не заменяем большие числа, которые могут быть цветами (больше 0xFFFFFF)
      if (num > 0xFFFFFF) return match;
      return num.toString();
    } catch {
      return match;
    }
  });

  // 2. Замена !![] на true, ![] на false
  result = result.replace(/!!\[\]/g, 'true');
  result = result.replace(/!\[\]/g, 'false');

  // 3. Замена !0x1 на false, !0x0 на true (после замены hex)
  result = result.replace(/!1\b/g, 'false');
  result = result.replace(/!0\b/g, 'true');

  // 4. Упрощение строковых индексов для очевидных случаев
  // obj['length'] -> obj.length (но только если не в массиве литерала)
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

  // 6. Упрощение typeof -> более читаемо (ограниченно)
  // typeof obj === 'undefined' -> obj === undefined (осторожно!)

  return result;
}

// Основная функция
function deobfuscateAllFiles() {
  // Получаем все отформатированные файлы
  const formattedFiles = fs.readdirSync(refsDir)
    .filter(file => file.endsWith('_formatted.js'))
    .sort();
  
  // Получаем оригинальные файлы (если отформатированных нет)
  const originalFiles = fs.readdirSync(path.join(__dirname, 'planplace_refs'))
    .filter(file => file.startsWith('main_core_v2_part') && file.endsWith('.js') && !file.includes('formatted') && !file.includes('deobfuscated'))
    .sort();
  
  // Используем отформатированные файлы, если они есть, иначе оригинальные
  const files = formattedFiles.length > 0 ? formattedFiles : originalFiles;
  const sourceDir = formattedFiles.length > 0 ? refsDir : path.join(__dirname, 'planplace_refs');

  console.log(`Найдено ${files.length} форматированных файлов для деобфускации:\n`);

  for (const file of files) {
    const filePath = path.join(refsDir, file);
    const fileName = file.replace('_formatted.js', '');
    
    console.log(`🔧 Деобфусцирую ${file}...`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const deobfuscated = deobfuscate(content);
      
      // Сохраняем с суффиксом _deobfuscated
      const targetPath = path.join(targetDir, `${fileName}_deobfuscated.js`);
      fs.writeFileSync(targetPath, deobfuscated, 'utf8');
      
      const originalSize = content.length;
      const newSize = deobfuscated.length;
      const diff = ((newSize - originalSize) / originalSize * 100).toFixed(1);
      
      console.log(`   ✅ Сохранен: ${targetPath}`);
      console.log(`   📊 Размер: ${originalSize} → ${newSize} (${diff > 0 ? '+' : ''}${diff}%)\n`);
    } catch (error) {
      console.error(`   ❌ Ошибка: ${error.message}\n`);
    }
  }

  console.log('✅ Деобфускация завершена!');
  console.log('\n⚠️  ВАЖНО: Полная автоматическая деобфускация невозможна.');
  console.log('   - Имена переменных (d, e, f, g...) останутся как есть');
  console.log('   - Сложная логика может остаться запутанной');
  console.log('   - Для полной деобфускации нужен исходный код\n');
}

deobfuscateAllFiles();
