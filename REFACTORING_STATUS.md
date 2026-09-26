# Статус разбивки admin-new.html

## Выполнено

### ✅ Модуль 1: admin-catalog-types.js
**Создан:** `js/admin/admin-catalog-types.js`  
**Размер:** ~600 строк  
**Функции:**
- `loadCatalogTypes()` — загрузка типов элементов
- `renderCatalogTypesTable()` — рендеринг таблицы
- `renderCatalogTypesPagination()` — пагинация
- `updateCatalogSubmenu()` — обновление меню
- `openCatalogTypeEdit()` — открытие формы редактирования
- `loadCatalogTypeEdit()` — загрузка данных для редактирования
- `saveCatalogType()` — сохранение типа
- `deleteCatalogType()` — удаление типа

**Статус:** ✅ Создан, подключен, мёртвый код удалён из admin-new.html (~18 KB)

### ✅ Модуль 2: admin-materials-keys.js
**Создан:** `js/admin/admin-materials-keys.js`  
**Функции:** loadMaterialsKeys, renderMaterialsKeysTable, openMaterialKeyEdit, loadMaterialKeyEdit, saveMaterialKey, copyMaterialKey, deleteMaterialKey, updateMaterialsSubmenu  
**Статус:** ✅ Создан, подключен. Inline-код пока оставлен (модуль переопределяет при загрузке). Удаление — после проверки.

---

## Следующие модули (в процессе создания)

### Приоритет 1 (малые модули, быстро создать):
- `admin-materials-keys.js` (~400 строк) — типы материалов (ЛДСП, ХДФ и т.д.)
- `admin-edges-keys.js` (~400 строк) — наборы кромок
- `admin-global-vars.js` (~500 строк) — глобальные переменные

### Приоритет 2 (средние модули):
- `admin-materials-items.js` (~600 строк) — элементы материалов  
- `admin-edges-items.js` (~600 строк) — элементы кромок
- `admin-catalog-items.js` (~500 строк) — элементы каталога

### Приоритет 3 (большой модуль, разбить на несколько):
- `admin-constructor-tree.js` — работа с деревом конструктора
- `admin-constructor-properties.js` — панель свойств  
- `admin-constructor-materials.js` — материалы в конструкторе
- `admin-constructor-accessories.js` — комплектующие

---

## Следующие шаги

1. Протестировать первый модуль (catalog-types)
2. Создать модули приоритета 1–2
3. Разбить конструктор (приоритет 3)
4. Обновить admin-new.html

---

## Как протестировать

1. Найдите в `admin-new.html` раздел со script-тегами (строка ~6813):
```html
<script src="/js/admin/admin-groups.js"></script>
```

2. Добавьте ПОСЛЕ него:
```html
<script src="/js/admin/admin-catalog-types.js"></script>
```

3. Найдите в `admin-new.html` функции `loadCatalogTypes`, `renderCatalogTypesTable` и т.д. (строки ~6909–21036).

4. Закомментируйте ВСЕ функции, которые теперь в модуле:
```html
<script>
  // ============================================
  // ЗАКОММЕНТИРОВАНО — ПЕРЕНЕСЕНО В admin-catalog-types.js
  // ============================================
  /*
  const catalogTypesPagination = { ... };
  async function loadCatalogTypes() { ... }
  function renderCatalogTypesTable() { ... }
  ...
  */
</script>
```

5. Перезагрузите админку и проверьте:
   - Страница "Типы элементов" загружается
   - Таблица показывает данные
   - Кнопки "Редактировать" и "Удалить" работают
   - Сохранение типа работает

Если всё работает — продолжаем разбивку остальных модулей.
