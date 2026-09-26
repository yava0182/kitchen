// ОДНОРАЗОВЫЙ СКРИПТ
// Приводит каталог петли catalog_31.json к структуре референса.
// Сохраняет:
//   - размеры (size) у всех узлов
//   - id моделей петли (5 = "Петля накладная фасад", 6 = "Петля накладная корпус")
//   - id присадок (3 в аниматоре, 4 в секции корпуса)
// Меняет позиции/повороты/pivot/spec по референсу 1:1.
//
// Запуск:
//   node scripts/fix-catalog-31-hinge-to-ref.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const targetFile = path.join(projectRoot, 'catalog_items', 'catalog_31.json');

if (!fs.existsSync(targetFile)) {
  console.error('Файл не найден:', targetFile);
  process.exit(1);
}

// Резервная копия со штампом времени
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = `${targetFile}.bak-${stamp}`;
fs.copyFileSync(targetFile, backupFile);
console.log('Backup:', backupFile);

const raw = fs.readFileSync(targetFile, 'utf8');
const data = JSON.parse(raw);

let counters = {
  animator: 0,
  modelFacade: 0,
  modelCorpus: 0,
  furnInAnimator: 0,
  furnInCorpus: 0,
};

// Приводим один узел "аниматора петли" к референсу.
// Сохраняем size; правим pos и spec (без door_offset).
function patchAnimator(node) {
  if (!node || typeof node !== 'object') return;
  node.pos = {
    x: '0 - g:g0.thickness / 2 + 4',
    y: 0,
    z: 's:z + 18 / 2',
  };
  node.pivot = { x: -1, y: -1, z: -1 };
  node.rot = { x: 0, y: 0, z: 0 };
  node.c_rot = { x: 0, y: 0, z: 0 };
  // Референсный spec аниматора — без door_offset.
  node.spec = {
    is_open: 0,
    props: { deg: 90, direction: 'ly' },
    source: [],
    fn: 'rotate',
    group: '',
  };
  counters.animator++;
}

// Модель петли «к фасаду» (id=5, родом from user). По рефу:
//   pos: {x:-5, y:0, z:" - 18 / 2"}, pivot: -1,-1,-1, rot: 0,0,0
// Сохраняем size и spec.id=5.
function patchModelFacade(node) {
  if (!node || typeof node !== 'object') return;
  node.pos = { x: -5, y: 0, z: ' - 18 / 2' };
  node.pivot = { x: -1, y: -1, z: -1 };
  node.rot = { x: 0, y: 0, z: 0 };
  node.c_rot = { x: 0, y: 0, z: 0 };
  counters.modelFacade++;
}

// Модель петли «к корпусу» (id=6). По рефу:
//   pos: {x:0, y:"s:y / 2", z:"10"}, pivot: -1,0,-1, rot 0,0,0
// Сохраняем size и spec.id=6.
function patchModelCorpus(node) {
  if (!node || typeof node !== 'object') return;
  node.pos = { x: 0, y: 's:y / 2', z: '10' };
  node.pivot = { x: -1, y: 0, z: -1 };
  node.rot = { x: 0, y: 0, z: 0 };
  node.c_rot = { x: 0, y: 0, z: 0 };
  counters.modelCorpus++;
}

// Присадка в аниматоре (родительский узел — animator):
// По рефу: pos {x:"12", y:"s:y / 2", z:" - 6.4"}, rot 0,180,0, pivot -1,-1,-1, spec={id:"3"}
function patchFurnInAnimator(node) {
  if (!node || typeof node !== 'object') return;
  node.pos = { x: 12, y: 's:y / 2', z: ' - 6.4' };
  node.pivot = { x: -1, y: -1, z: -1 };
  node.rot = { x: 0, y: 180, z: 0 };
  node.c_rot = { x: 0, y: 0, z: 0 };
  // Сохраняем id (3) — это «петля моя».
  const keepId = String(node?.spec?.id ?? '3');
  node.spec = { id: keepId };
  counters.furnInAnimator++;
}

// Присадка в секции корпуса:
// По рефу: pos {x:0, y:"s:y / 2", z:"s:z - 37.2"}, rot 0,-90,0, pivot -1,0,-1, spec={id:"1"}
// Сохраняем наш id присадки (4).
function patchFurnInCorpus(node) {
  if (!node || typeof node !== 'object') return;
  node.pos = { x: 0, y: 's:y / 2', z: 's:z - 37.2' };
  node.pivot = { x: -1, y: 0, z: -1 };
  node.rot = { x: 0, y: -90, z: 0 };
  node.c_rot = { x: 0, y: 0, z: 0 };
  const keepId = String(node?.spec?.id ?? '4');
  node.spec = { id: keepId };
  counters.furnInCorpus++;
}

function isHingeAnimator(n) {
  return n && typeof n === 'object' && n.type === 'animator' && String(n.id || '') === 'hinge_animator';
}

function isModelByName(n, name) {
  return n && typeof n === 'object' && n.type === 'model' && String(n.name || '').trim() === name;
}

function isFurniture(n) {
  return n && typeof n === 'object' && n.type === 'furniture';
}

// Каждый объект патчим максимум один раз (защита от перекрытия деревьев)
const patched = new WeakSet();

function walk(node, parentAnimator) {
  if (!node || typeof node !== 'object') return;
  if (patched.has(node)) return;
  patched.add(node);
  const isAnim = isHingeAnimator(node);
  if (isAnim) patchAnimator(node);
  if (isModelByName(node, 'Петля накладная фасад')) patchModelFacade(node);
  if (isModelByName(node, 'Петля накладная корпус')) patchModelCorpus(node);
  if (isFurniture(node)) {
    if (parentAnimator) patchFurnInAnimator(node);
    else patchFurnInCorpus(node);
  }
  if (Array.isArray(node.children)) {
    for (const ch of node.children) walk(ch, isAnim);
  }
}

function deepWalkAnyTree(root) {
  if (!root || typeof root !== 'object') return;
  if (Array.isArray(root)) {
    for (const it of root) deepWalkAnyTree(it);
    return;
  }
  if (typeof root.type === 'string' && root.type) {
    walk(root, false);
  }
  for (const k of Object.keys(root)) {
    const v = root[k];
    if (v && typeof v === 'object') deepWalkAnyTree(v);
  }
}

deepWalkAnyTree(data);

fs.writeFileSync(targetFile, JSON.stringify(data, null, 2), 'utf8');
console.log('Готово. Изменено узлов:', counters);
console.log('Файл сохранён:', targetFile);
