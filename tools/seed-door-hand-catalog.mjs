/**
 * Добавляет в catalog_28 шаблоны:
 *   11 — Фасад шкаф (правый, ry)
 *   12 — Фасад антресоль (правый, ry)
 *   13 — Фасад шкаф двустворчатый (ly + ry)
 *   14 — Фасад антресоль двустворчатый (ly + ry)
 *
 *   node tools/seed-door-hand-catalog.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.join(__dirname, '..', 'catalog_items', 'catalog_28.json');

function deepClone(o) {
  return JSON.parse(JSON.stringify(o));
}

function findCatalogItem(items, id) {
  return items.find((x) => Number(x.id) === Number(id)) || null;
}

function findFirstAnimator(sectionNode) {
  if (!sectionNode || !Array.isArray(sectionNode.children)) return null;
  for (const c of sectionNode.children) {
    if (String(c.type || '').toLowerCase() === 'animator') return c;
    const nested = findFirstAnimator(c);
    if (nested) return nested;
  }
  return null;
}

function getConstructorRoot(item) {
  return item?.constructor_structure || item?.data?.constructor_structure || null;
}

function setConstructorRoot(item, root) {
  if (item.constructor_structure) item.constructor_structure = root;
  else if (item.data?.constructor_structure) item.data.constructor_structure = root;
  else item.constructor_structure = root;
}

function patchRightHand(item, newId, newName) {
  const out = deepClone(item);
  out.id = newId;
  const root = getConstructorRoot(out);
  if (!root) throw new Error(`no constructor_structure for id ${item.id}`);
  root.name = newName;
  const section = root.children?.[0];
  const anim = findFirstAnimator(section);
  if (!anim) throw new Error(`no animator in id ${item.id}`);
  anim.spec = anim.spec || {};
  anim.spec.props = { ...(anim.spec.props || {}), deg: 90, direction: 'ry' };
  if (anim.spec.door_offset && typeof anim.spec.door_offset === 'object') {
    const ox = Number(anim.spec.door_offset.x);
    if (Number.isFinite(ox)) anim.spec.door_offset.x = -ox;
  }
  const facade = anim.children?.[0];
  if (facade?.spec) {
    facade.spec = { ...facade.spec, opening: 'right' };
    if (facade.spec.handle && typeof facade.spec.handle === 'object') {
      facade.spec.handle = { ...facade.spec.handle, dir: 'r' };
    }
  }
  setConstructorRoot(out, root);
  out.pairedHandCatalogItemIds = {
    left: Number(item.id),
    right: Number(newId),
  };
  return out;
}

function patchDoubleLeaf(item, newId, newName) {
  const out = deepClone(item);
  out.id = newId;
  const root = getConstructorRoot(out);
  root.name = newName;
  const section = root.children?.[0];
  if (!section?.children?.length) throw new Error(`no section children id ${item.id}`);
  const animIdx = section.children.findIndex((c) => String(c.type || '').toLowerCase() === 'animator');
  if (animIdx < 0) throw new Error(`no animator id ${item.id}`);
  const baseAnim = section.children[animIdx];
  const gap = 3;

  const leftAnim = deepClone(baseAnim);
  leftAnim.id = `${baseAnim.id || 'anim'}_left`;
  leftAnim.name = 'Аниматор левая';
  leftAnim.size = { ...(leftAnim.size || {}), x: `s:x/2-${gap / 2}` };
  leftAnim.pos = { ...(leftAnim.pos || {}), x: 0 };
  leftAnim.spec = leftAnim.spec || {};
  leftAnim.spec.props = { ...(leftAnim.spec.props || {}), deg: 90, direction: 'ly' };
  if (leftAnim.children?.[0]?.spec) {
    leftAnim.children[0].size = {
      ...(leftAnim.children[0].size || {}),
      x: `s:x/2-${gap / 2 + 1.5}`,
    };
    leftAnim.children[0].spec = { ...leftAnim.children[0].spec, opening: 'left' };
  }

  const rightAnim = deepClone(baseAnim);
  rightAnim.id = `${baseAnim.id || 'anim'}_right`;
  rightAnim.name = 'Аниматор правая';
  rightAnim.size = { ...(rightAnim.size || {}), x: `s:x/2-${gap / 2}` };
  rightAnim.pos = { ...(rightAnim.pos || {}), x: `s:x/2+${gap / 2}` };
  rightAnim.spec = rightAnim.spec || {};
  rightAnim.spec.props = { ...(rightAnim.spec.props || {}), deg: 90, direction: 'ry' };
  if (rightAnim.spec.door_offset && typeof rightAnim.spec.door_offset === 'object') {
    const ox = Number(rightAnim.spec.door_offset.x);
    if (Number.isFinite(ox)) rightAnim.spec.door_offset.x = -ox;
  }
  if (rightAnim.children?.[0]) {
    rightAnim.children[0].size = {
      ...(rightAnim.children[0].size || {}),
      x: `s:x/2-${gap / 2 + 1.5}`,
    };
    rightAnim.children[0].pos = { ...(rightAnim.children[0].pos || {}), x: 1.5 };
    if (rightAnim.children[0].spec) {
      rightAnim.children[0].spec = { ...rightAnim.children[0].spec, opening: 'right' };
    }
  }

  section.children.splice(animIdx, 1, leftAnim, rightAnim);
  setConstructorRoot(out, root);
  return out;
}

const items = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const mainLeft = findCatalogItem(items, 8);
const topLeft = findCatalogItem(items, 7);
if (!mainLeft || !topLeft) {
  console.error('catalog_28: need items id 7 and 8');
  process.exit(1);
}

const byId = new Map(items.map((x) => [Number(x.id), x]));
const toAdd = [];

function upsert(entry) {
  const id = Number(entry.id);
  if (byId.has(id)) {
    const idx = items.findIndex((x) => Number(x.id) === id);
    items[idx] = entry;
    console.log('Updated catalog_28 id', id, entry.constructor_structure?.name || entry.data?.name);
  } else {
    toAdd.push(entry);
    console.log('Added catalog_28 id', id, entry.constructor_structure?.name);
  }
  if (!mainLeft.pairedHandCatalogItemIds) {
    mainLeft.pairedHandCatalogItemIds = { left: 8, right: 11 };
  }
  if (!topLeft.pairedHandCatalogItemIds) {
    topLeft.pairedHandCatalogItemIds = { left: 7, right: 12 };
  }
}

upsert(patchRightHand(mainLeft, 11, 'Фасад шкаф (правый)'));
upsert(patchRightHand(topLeft, 12, 'Фасад антресоль (правый)'));
upsert(patchDoubleLeaf(mainLeft, 13, 'Фасад шкаф двустворчатый'));
upsert(patchDoubleLeaf(topLeft, 14, 'Фасад антресоль двустворчатый'));

const next = [...items, ...toAdd.filter((e) => !byId.has(Number(e.id)))];
fs.writeFileSync(catalogPath, JSON.stringify(next, null, 2), 'utf8');
console.log('Done. Total items:', next.length);
