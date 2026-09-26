# План разбивки admin-new.html на модули

## Цель
Разбить `admin-new.html` (22 000+ строк) на отдельные JS-модули для снижения нагрузки на Cursor.

## Текущая структура

### Уже выделено:
- ✅ `admin-groups.js` — группы материалов (materials_groups)
- ✅ `admin-models3d-materials.js` — материалы 3D моделей
- ✅ `admin-models3d-list.js` — список 3D моделей
- ✅ `admin-catalog-groups.js` — группы модулей (modules_groups)
- ✅ `admin-edges-categories.js` — категории кромок (дерево)

### Нужно выделить:

#### 1. `admin-catalog-types.js` (~400 строк)
Функции для работы с типами каталога:
- `loadCatalogTypes()`
- `renderCatalogTypesTable()`
- `renderCatalogTypesPagination()`
- `updateCatalogSubmenu()`
- `openCatalogTypeEdit()`
- `loadCatalogTypeEdit()`
- `saveCatalogType()`
- `deleteCatalogType()`

#### 2. `admin-catalog-items.js` (~500 строк)
Функции для работы с элементами каталога:
- `loadCatalogItems()`
- `openCatalogItemEdit()`
- `loadCatalogItemData()`
- `saveCatalogItem()` (если есть)

#### 3. `admin-materials.js` (~800 строк)
Функции для работы с материалами:
- `loadMaterialsKeys()`
- `renderMaterialsKeysTable()`
- `loadMaterialsItems()`
- `renderMaterialsItemsTable()`
- `loadMaterialItemEdit()`
- `saveMaterialItem()`
- `openMaterialKeyEdit()`
- `loadMaterialKeyEdit()`
- `saveMaterialKey()`
- `updateMaterialsSubmenu()`

#### 4. `admin-edges.js` (~600 строк)
Функции для работы с кромками:
- `loadEdgesKeys()`
- `renderEdgesKeysTable()`
- `loadEdgesItems()`
- `renderEdgesItemsTable()`
- `loadEdgeItemEdit()`
- `saveEdgeItem()`
- `openEdgeKeyEdit()`
- `loadEdgeKeyEdit()`
- `saveEdgeKey()`
- `updateEdgesSubmenu()`
- `loadEdgesCategories()`
- `renderEdgesCategoriesTree()`

#### 5. `admin-global-vars.js` (~500 строк)
Функции для глобальных переменных:
- `loadGlobalVars()`
- `renderGlobalVars()`
- `saveGlobalVars()`
- `updateGlobalVarFromInput()`
- `deleteGlobalVar()`

#### 6. `admin-constructor.js` (~3000+ строк) ✅
Функции для конструктора элементов:
- `loadConstructorTreeFromJSON()`
- `updateConstructorPropertiesPanel()`
- `saveConstructorNodeData()`
- `saveDetailNodeData()`
- `loadMaterialsList()`
- `updateMaterialDisplay()`
- `loadEdgeTypesList()`
- `openAccessoriesModal()`
- `loadAccessoriesList()`
- `updateAccessoriesList()`
- `openAddElementModal()`
- `updateDetailGrid()`

#### 7. `admin-menu.js` (~300 строк)
Функции для работы с меню:
- `loadMenuSettings()`
- `saveMenuSettings()`
- `renderMenuItem()`

#### 8. `admin-orders.js` (~200 строк)
Функции для работы с заказами:
- `loadClientsOrders()`

## Порядок выполнения

1. ✅ Создать план (этот файл)
2. Создать файлы модулей с функциями
3. Обновить admin-new.html: добавить `<script src="">` для новых модулей
4. Удалить продублированный код из admin-new.html
5. Протестировать каждый модуль
6. Обновить .cursorignore (оставить только нужное)

## Безопасность

- Делаем по одному модулю за раз
- Тестируем после каждого извлечения
- Сохраняем резервные копии
- Не трогаем HTML-разметку
- Только JS-функции переносим в модули

## Ожидаемый результат

- admin-new.html: ~5 000–10 000 строк (только HTML + минимум JS)
- 8–10 модулей по 200–3000 строк каждый
- Cursor стабильно работает без вылетов
- Индексация включена, но на меньший объём кода
