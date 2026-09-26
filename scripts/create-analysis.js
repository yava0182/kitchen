#!/usr/bin/env node
/**
 * Скрипт для быстрого создания файлов анализа референса
 * 
 * Использование:
 *   node scripts/create-analysis.js <component-name>
 * 
 * Пример:
 *   node scripts/create-analysis.js catalog_item
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Получаем имя компонента из аргументов
const componentName = process.argv[2];

if (!componentName) {
  console.error('❌ Ошибка: не указано имя компонента');
  console.log('\nИспользование:');
  console.log('  node scripts/create-analysis.js <component-name>');
  console.log('\nПример:');
  console.log('  node scripts/create-analysis.js catalog_item');
  process.exit(1);
}

// Нормализуем имя компонента
const normalizedName = componentName
  .toLowerCase()
  .replace(/[^a-z0-9_]/g, '_')
  .replace(/_+/g, '_');

// Создаём имена файлов
const analysisFileName = `${normalizedName.toUpperCase()}_REFERENCE_ANALYSIS.md`;
const planFileName = `${normalizedName.toUpperCase()}_IMPLEMENTATION_PLAN.md`;

// Пути к файлам
const docsDir = path.join(projectRoot, 'docs');
const analysisDir = path.join(docsDir, 'analysis');
const plansDir = path.join(docsDir, 'plans');

// Создаём директории если их нет
[analysisDir, plansDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Создана директория: ${dir}`);
  }
});

// Читаем шаблоны
const templateAnalysisPath = path.join(docsDir, 'TEMPLATE_REFERENCE_ANALYSIS.md');
const templatePlanPath = path.join(docsDir, 'TEMPLATE_IMPLEMENTATION_PLAN.md');

if (!fs.existsSync(templateAnalysisPath) || !fs.existsSync(templatePlanPath)) {
  console.error('❌ Ошибка: шаблоны не найдены');
  console.log('Убедитесь что существуют:');
  console.log(`  - ${templateAnalysisPath}`);
  console.log(`  - ${templatePlanPath}`);
  process.exit(1);
}

// Читаем шаблоны
const templateAnalysis = fs.readFileSync(templateAnalysisPath, 'utf8');
const templatePlan = fs.readFileSync(templatePlanPath, 'utf8');

// Заменяем плейсхолдеры
const analysisContent = templateAnalysis
  .replace(/\[НАЗВАНИЕ КОМПОНЕНТА\]/g, componentName)
  .replace(/\[COMPONENT\]/g, normalizedName.toUpperCase())
  .replace(/\[filename\]/g, normalizedName)
  .replace(/\[дата\]/g, new Date().toISOString().split('T')[0]);

const planContent = templatePlan
  .replace(/\[НАЗВАНИЕ КОМПОНЕНТА\]/g, componentName)
  .replace(/\[COMPONENT\]/g, normalizedName.toUpperCase())
  .replace(/\[дата\]/g, new Date().toISOString().split('T')[0]);

// Пути к новым файлам
const analysisFilePath = path.join(analysisDir, analysisFileName);
const planFilePath = path.join(plansDir, planFileName);

// Проверяем существование
if (fs.existsSync(analysisFilePath)) {
  console.warn(`⚠️  Файл уже существует: ${analysisFilePath}`);
  console.log('Пропускаем создание файла анализа...');
} else {
  fs.writeFileSync(analysisFilePath, analysisContent, 'utf8');
  console.log(`✅ Создан файл анализа: ${analysisFilePath}`);
}

if (fs.existsSync(planFilePath)) {
  console.warn(`⚠️  Файл уже существует: ${planFilePath}`);
  console.log('Пропускаем создание файла плана...');
} else {
  fs.writeFileSync(planFilePath, planContent, 'utf8');
  console.log(`✅ Создан файл плана: ${planFilePath}`);
}

// Проверяем наличие референсного файла
const referenceDir = path.join(projectRoot, 'vendor', 'constructor_code_reference');
const possibleReferenceFiles = [
  `${normalizedName}.js`,
  `${normalizedName}_deobfuscated.js`,
  `${normalizedName}.html`,
];

const foundReferences = possibleReferenceFiles.filter(file => {
  const filePath = path.join(referenceDir, file);
  return fs.existsSync(filePath);
});

if (foundReferences.length > 0) {
  console.log('\n📚 Найдены референсные файлы:');
  foundReferences.forEach(file => {
    console.log(`   - ${file}`);
  });
} else {
  console.log('\n⚠️  Референсные файлы не найдены в:');
  console.log(`   ${referenceDir}`);
  console.log('\nПроверьте имя компонента или создайте файлы вручную.');
}

console.log('\n✅ Готово! Можно начинать анализ.');
console.log(`\nОткройте файлы:`);
console.log(`  - ${analysisFilePath}`);
console.log(`  - ${planFilePath}`);
