const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
let c = fs.readFileSync(path.join(root, 'admin-models3d-list.js'), 'utf8');
const reps = [
  ['Models3D', 'Handles'],
  ['Models3d', 'Handles'],
  ['models3d', 'handles'],
  ["MODELS3D_LIST_TYPE = 'cabinet_model'", "HANDLES_LIST_TYPE = 'handles'"],
  ['notifyCabinetModelLibraryStale', 'notifyHandlesCatalogStale'],
  ['getModels3dCategory', 'getHandlesCategory'],
  ['upsertModels3dListCacheEntry', 'upsertHandlesListCacheEntry'],
  ['renderModels3dCategorySelect', 'renderHandlesCategorySelect'],
  ['applyModels3dFilters', 'applyHandlesFilters'],
  ['models3dListState', 'handlesListState'],
  ['loadModels3d', 'loadHandles'],
  ['renderModels3d', 'renderHandles'],
  ['openModels3d', 'openHandles'],
  ['saveModels3d', 'saveHandles'],
  ['deleteModels3d', 'deleteHandles'],
  ['copyModels3d', 'copyHandles'],
  ['toggleModels3d', 'toggleHandles'],
  ['initModels3d', 'initHandles'],
  ['handleModels3dRouting', 'handleHandlesRouting'],
  ['data-m3-', 'data-h-'],
  ['m3Save', 'hSave'],
  ['m3Add', 'hAdd'],
  ['m3Cat', 'hCat'],
  ['m3Table', 'hTable'],
  ['m3Cancel', 'hCancel'],
  ['__models3d', '__handles'],
  ['m3m-', 'hm-'],
  ['refreshModels3d', 'refreshHandles'],
  ['syncModels3d', 'syncHandles'],
  ['loadModels3dMaterials', 'loadHandlesMaterials'],
  ['openModels3dMaterial', 'openHandlesMaterial'],
  ['closeModels3dMaterial', 'closeHandlesMaterial'],
  ['loadModelInPreview', 'loadHandleInPreview'],
  ['applyModelTransformToPreview', 'applyHandleTransformToPreview'],
  ['initJsonEditor', 'initHandlesJsonEditor'],
];
for (const [a, b] of reps) c = c.split(a).join(b);
c = c
  .replace(/Список 3D Моделей/g, 'Список моделей ручек')
  .replace(/3D модел/g, 'серию ручек')
  .replace(/3D Модел/g, 'моделей ручек')
  .replace(/Добавить 3D модель/g, 'Добавить серию ручек')
  .replace(/Редактировать 3D модель/g, 'Редактировать серию ручек');
fs.writeFileSync(path.join(root, 'admin-handles-list.js'), c);
console.log('OK', c.length);
