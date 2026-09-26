# Референс PlanPlace: сохранение и открытие элементов каталога

## Загрузка при редактировании

**Референс:** `GET /catalog/{i_method_name}/{controller_name}/{item_id}` → `item = data`  
**Наш API:** `GET /api/catalog/item/{catalogType}/{itemId}`  
**Формат:** `catalog_25` — `{ id, catalog_type, data: { name, width, height, depth, constructor_structure } }`  
**Patch:** `_d = data.data || data` — поддержка вложенного `data`

## Сохранение

**Референс:** `form_data.append('data', JSON.stringify({ ...metadata, params: data }))`  
**Наш API:** `POST /api/catalog/item_edit/{catalogType}/{itemId}` — FormData с `data`

## Выполнено

- Retry для `loadConstructorTreeFromJSON` (вызов `initConstructorTab` до загрузки дерева)
- `loadCatalogItemData` при первом открытии при `itemId > 0`
- Логи `[Шкаф]` для отладки

## Проверка

1. `npm start` → `http://localhost:8000/admin-new.html`
2. Каталог → catalog_25 → «Шкаф пример» → Редактировать
3. Консоль: логи `[Шкаф]`, дерево конструктора на вкладке «Конструктор»
