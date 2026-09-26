# План разбиения больших файлов на модули

Цель: снизить нагрузку на Cursor, сохранив индексацию и AI-функции.

---

## admin-new.html (~22 000 строк)

**Текущая структура:**
- HTML + CSS: ~6 800 строк
- Огромный inline `<script>`: ~14 700 строк (строки 6846–21526)
- Ещё один script: ~200 строк

**План разбиения по логическим блокам:**

| Модуль | Функции | Примерный размер |
|--------|---------|------------------|
| `admin-catalog-types.js` | loadCatalogTypes, renderCatalogTypesTable, updateCatalogSubmenu | ~400 строк |
| `admin-catalog-groups.js` | loadCatalogGroups, renderCatalogGroupsTable | ~350 строк |
| `admin-materials.js` | loadMaterialsItems, loadMaterialsKeys, renderMaterialsKeysTable | ~900 строк |
| `admin-edges.js` | loadEdgesKeys, loadEdgesItems, updateEdgesSubmenu | ~700 строк |
| `admin-global-vars.js` | loadGlobalVars, renderGlobalVars, saveGlobalVars | ~500 строк |
| `admin-catalog-items.js` | loadCatalogItems | ~400 строк |
| `admin-menu-settings.js` | loadMenuSettings, renderMenuItem, saveMenuSettings | ~600 строк |
| `admin-catalog-item-edit.js` | openCatalogItemEdit, конструктор элемента | ~3000 строк |
| `admin-accessories.js` | loadAccessoriesLibrary, openAccessoriesModal | ~1500 строк |
| `admin-constructor.js` | updateConstructorPropertiesPanel, loadConstructorTreeFromJSON | ~2500 строк |
| `admin-catalog-type-edit.js` | openCatalogTypeEdit, saveCatalogType | ~400 строк |
| `admin-navigation.js` | hash routing, init, общие обработчики | ~800 строк |

**Уже вынесено:** `admin-groups.js` (materials_groups), `admin-models3d-list.js`, `admin-models3d-materials.js`

**Результат:** admin-new.html останется ~7 000 строк (HTML + подключаемые скрипты).

---

## constructor.ts (~17 500 строк)

**План разбиения по областям:**

| Модуль | Содержимое | Примерный размер |
|--------|------------|------------------|
| `constructor-core.ts` | init, базовая логика | ~2000 строк |
| `constructor-catalog.ts` | работа с каталогом, element_type | ~3000 строк |
| `constructor-materials.ts` | материалы, группы | ~2000 строк |
| `constructor-accessories.ts` | комплектующие | ~2000 строк |
| `constructor-details.ts` | детали, позиционирование | ~2500 строк |
| `constructor-ui.ts` | UI, таблицы, модалки | ~2500 строк |
| `constructor-utils.ts` | утилиты, типы | ~1500 строк |

**Результат:** 7 файлов по ~2000–3000 строк вместо одного на 17 500.

---

## Порядок работ

### Этап 1: admin-new.html (приоритет)

1. Создать `js/admin/admin-catalog-types.js` — вынести логику типов каталога
2. Создать `js/admin/admin-catalog-groups.js` — группы (если ещё не вынесено)
3. Создать `js/admin/admin-materials.js`
4. Создать `js/admin/admin-edges.js`
5. Создать `js/admin/admin-global-vars.js`
6. Остальные модули по тому же принципу
7. В `admin-new.html` заменить inline-скрипт на `<script src="...">`

### Этап 2: constructor.ts

1. Разделить на модули с `import`/`export`
2. Обновить `tsconfig` при необходимости

---

## Важно

- Каждый модуль — IIFE или ES-модуль с экспортом в `window` для обратной совместимости
- Порядок подключения скриптов в HTML должен сохраняться
- После разбиения можно убрать `admin-new.html` и `constructor.ts` из `.cursorignore`

---

## С чего начать

Рекомендуется начать с **admin-catalog-types.js** — небольшой и изолированный блок (~400 строк).
