const fs = require('fs');
const path = require('path');

// Базовое форматирование минифицированного JS
function formatMinifiedJS(content) {
  let formatted = content;
  
  // Добавляем переносы строк после точек с запятой (но не внутри строк)
  formatted = formatted.replace(/;(?![^'"]*['"][^'"]*['"])/g, ';\n');
  
  // Добавляем переносы после закрывающих скобок
  formatted = formatted.replace(/\}(?![^'"]*['"][^'"]*['"])/g, '}\n');
  
  // Добавляем переносы после открывающих фигурных скобок (но не в строках)
  formatted = formatted.replace(/\{(?![^'"]*['"][^'"]*['"])/g, '{\n');
  
  // Убираем множественные пустые строки
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // Добавляем отступы (базовая логика)
  const lines = formatted.split('\n');
  let indentLevel = 0;
  const indentSize = 2;
  
  const formattedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    
    // Уменьшаем отступ перед закрывающими скобками
    if (trimmed.startsWith('}') || trimmed.startsWith(']')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    const indented = ' '.repeat(indentLevel * indentSize) + trimmed;
    
    // Увеличиваем отступ после открывающих скобок
    if (trimmed.endsWith('{') || trimmed.endsWith('[')) {
      indentLevel++;
    }
    
    return indented;
  });
  
  return formattedLines.join('\n');
}

// Форматируем все JS файлы в директории референсов
const refsDir = path.join(__dirname, 'planplace_refs', 'constructor_code_reference');
const files = fs.readdirSync(refsDir).filter(f => f.endsWith('.js') && !f.includes('_formatted') && !f.includes('format_js'));

files.forEach(file => {
  const filePath = path.join(refsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const formatted = formatMinifiedJS(content);
  
  const outputPath = path.join(refsDir, file.replace('.js', '_formatted.js'));
  fs.writeFileSync(outputPath, formatted, 'utf8');
  console.log(`✅ Отформатирован: ${file} → ${path.basename(outputPath)}`);
});

console.log(`\n✅ Всего отформатировано файлов: ${files.length}`);
