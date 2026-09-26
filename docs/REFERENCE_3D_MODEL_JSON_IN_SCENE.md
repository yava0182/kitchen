# Референс: JSON при добавлении 3D модели в сцену

## Вопрос

При добавлении 3D модели (cabinet_model) в сцену конструктора: пишется ли JSON? Как он формируется? Что сохраняется?

## Поиск в референсе

### 1. Структура данных в сцене

В референсе PlanPlace:

- **`d_objects`** — массив всех объектов в сцене (шкафы, техника, модели и т.д.)
- Каждый объект имеет **`params`** или **`userData.params`** — структура параметров объекта (тип, размеры, позиция, материалы и т.д.)
- **`project_settings`** — глобальные настройки проекта (выбранные материалы, стили фасадов, ножки и т.д.)

### 2. Добавление объекта в сцену

При добавлении объекта (в т.ч. cabinet_model) в сцену:

```javascript
// Создание объекта (например Cabinet, или из каталога по ID)
let obj = new CabinetModel(params); // или new Cabinet(params)

// Добавление в массив объектов сцены
d_objects.push(obj);

// Добавление в сцену Three.js
room.add(obj);
```

Объект `obj` содержит:
- **`params`** — параметры: тип, размеры, позиция, материалы, ID элемента каталога и т.д.
- **`userData`** — дополнительные данные Three.js (computed, children, и т.д.)

### 3. Сохранение проекта в JSON

При сохранении проекта вызывается функция сбора данных (например `get_all_data` или `save_project`).

**Что сохраняется:**

- **Список объектов:** для каждого объекта в `d_objects` сохраняются:
  - `type` (Cabinet, Model, Shelve и т.д.)
  - `params` — все параметры объекта:
    - `size` (x, y, z)
    - `pos` (position)
    - `rot` (rotation)
    - `catalog_id` — ID элемента из каталога (для cabinet_model — ID записи типа cabinet_model)
    - `spec` — параметры спецификации
    - И другие параметры (материалы, фасады, ручки и т.д.)
  
- **Глобальные настройки проекта (`project_settings`):**
  - Выбранные материалы (`selected_materials`)
  - Стили фасадов (`models.top`, `models.bottom`)
  - Настройки ножек, цоколя, карнизов
  - Размеры комнаты

**Формат JSON (из референса):**

```json
{
  "version": "...",
  "project_settings": {
    "selected_materials": { ... },
    "models": { "top": "...", "bottom": "..." },
    "project_id": 1234567890,
    ...
  },
  "camera": {
    "position": { "x": ..., "y": ..., "z": ... },
    "target": { "x": ..., "y": ..., "z": ... }
  },
  "room": { ... },
  "objects": [
    {
      "type": "Cabinet",
      "name": "Шкаф нижний",
      "size": { "x": 600, "y": 720, "z": 600 },
      "pos": { "x": 1000, "y": 0, "z": 0 },
      "pivot": { "x": -1, "y": -1, "z": -1 },
      "spec": {
        "id": 123,
        "catalog_id": 123,
        "catalog_type": "kitchens",
        ...
      },
      ...
    },
    {
      "type": "Model",
      "name": "Опора 100 мм",
      "size": { "x": 60, "y": 100, "z": 79 },
      "pos": { "x": 2000, "y": 0, "z": 0 },
      "pivot": { "x": -1, "y": -1, "z": -1 },
      "spec": {
        "id": 456,
        "catalog_id": 456,
        "element_type": "cabinet_model",
        "catalog_type": "cabinet_model",
        "orientation": "v",
        "group": "model",
        "type": "common",
        "key": null,
        "material": {
          "group": "g0",
          "key": "ldsp",
          "thickness_lock": 0,
          "id": 0,
          "variant_id": 0
        },
        "show_index": 1
      },
      ...
    }
  ],
  "accessories": [...],
  "custom_items": [...],
  "tabletops": [...]
}
```

### 4. Для cabinet_model: что сохраняется в JSON проекта

При добавлении 3D модели (cabinet_model) в сцену:

1. **Создание объекта:** `new CabinetModel(params)` (наследник CabinetSection)
   - `params.spec.id` — ID записи из каталога cabinet_model
   - `params.spec.catalog_id` — дублирует spec.id (для совместимости)
   - `params.size` — размеры секции (x, y, z) в мм
   - `params.pos` — позиция объекта в комнате
   - `params.pivot` — точка привязки (по умолчанию `-1, -1, -1`)
   - `params.spec.element_type` — `"cabinet_model"`
   - `params.spec.catalog_type` — `"cabinet_model"`

2. **Построение объекта:** `_build_spec()` вызывает:
   - `_get_model()` — выбор варианта модели по размеру секции из `item.data.params.models`
   - `_load_model(model_path, materials, params)` — загрузка 3D-файла и масштабирование под размер секции

3. **Сохранение в JSON проекта** (функция `get_save_data_new`, строка 75671):
   
   Перебирает `room.active_objects[]` и для каждого объекта (кроме wall) добавляет в `objects[]`:
   
   ```javascript
   // Для core_v2 (новый движок):
   i.objects.push(j.userData.params);
   
   // Для старого:
   j.params.type = j.type;  // "Model"
   j.params.position = j.getWorldPosition();
   j.params.rotation = j.getWorldQuaternion();
   i.objects.push(j.params);
   ```
   
   **Что сохраняется для cabinet_model:**
   - `type: "Model"` — тип объекта в сцене
   - `name` — название
   - `size: { x, y, z }` — текущий размер секции в мм (может отличаться от дефолтного в каталоге)
   - `pos: { x, y, z }` — позиция в комнате
   - `pivot: { x, y, z }` — точка привязки (-1/-1/-1 для нижнего левого заднего угла)
   - `rot: { x, y, z }` (если есть поворот)
   - `scale: { x, y, z }` (если есть масштаб)
   - **`spec.id`** — ID записи в каталоге cabinet_model
   - **`spec.catalog_id`** — дублирует spec.id
   - **`spec.element_type`** — `"cabinet_model"`
   - **`spec.catalog_type`** — `"cabinet_model"`
   - `spec.orientation` — ориентация ("v"/"h"/"f")
   - `spec.material` — материал (группа, ключ, толщина и т.д.)
   - `spec.show_index` — показ номеров кромок
   
   **НЕ сохраняется:**
   - Путь к 3D-файлу (`params.models[].model`) — он берётся из каталога по `spec.id` при загрузке проекта
   - Загруженные меши (они создаются заново при загрузке проекта)

### 5. Загрузка проекта из JSON

При загрузке сохранённого проекта:

1. Читается JSON проекта
2. Для каждого объекта в `objects`:
   - По `type` создаётся экземпляр класса (Cabinet, CabinetModel и т.д.)
   - По `params.catalog_id` загружаются данные элемента из каталога (`item.data`)
   - Размер секции берётся из `params.size` (из JSON проекта)
   - Вызывается `_build()` → `_build_spec()` → `_get_model()` → выбор варианта модели по размеру → `_load_model()`

---

## Итог

**Да, при добавлении 3D модели (cabinet_model) в сцену пишется JSON:**

- В JSON проекта сохраняется объект с типом "Model" или "CabinetModel"
- Хранятся: `catalog_id`, `size`, `pos`, `rot`, `spec` и другие `params`
- **Путь к 3D-файлу не хранится** в JSON проекта — он берётся из каталога (`item.data.params.models`) по `catalog_id` при загрузке
- Когда проект загружается, по `catalog_id` подтягивается запись из каталога cabinet_model, по размеру секции выбирается вариант модели, загружается 3D-файл

---

## В нашем проекте

### Текущая реализация:

1. **Каталог элементов (cabinet_model):**
   - Записи типа `cabinet_model` с `item.data.params.models` (путь к файлу, размеры, min/max по осям)
   - API: `GET /api/catalog/items_get/cabinet_model`, `POST /api/catalog/item_add/cabinet_model/`
   - Хранятся в `db.json` в массиве `catalog_items[]`

2. **Сохранение модуля (конструктор):**
   - `src/api/catalogAPI.ts`: `saveModuleJSONPlanPlaceStyle(name, json, elementId)` → `POST /api/modules/save`
   - Сохраняет в `modules/имя_id.json` массив детей (PlanPlace формат: `type, size, pos, pivot, rot, spec`)
   - **НЕ сохраняет глобальный проект** (нет camera, room, project_settings) — только дерево модуля

3. **Загрузка модуля:**
   - `GET /api/modules/load/:fileName` → возвращает JSON дерева модуля
   - `GET /catalog/items_list/` → список всех модулей с `data.params` (дерево в формате PlanPlace)

### Отличия от референса:

| Что | Референс | У нас |
|-----|----------|--------|
| **Сохранение проекта** | `save_scene_new()` → `project.json` (весь проект: settings, camera, room, objects[]) | `saveModuleJSONPlanPlaceStyle()` → только дерево модуля (массив детей) |
| **Объекты в сцене** | `objects[]` — массив объектов в комнате (Cabinet, Model, Shelve и т.д.) | В конструкторе модуля: только дерево template.tree (секции, стенки) |
| **cabinet_model в проекте** | Объект с `type: "Model"`, `spec.id`, `spec.catalog_type: "cabinet_model"`, `size`, `pos`, `pivot` | Пока не реализовано добавление cabinet_model в сцену конструктора (только превью в админке) |

### Для добавления cabinet_model в конструктор нужно:

1. **Структура JSON проекта** (как в референсе):
   - `project_settings` — глобальные настройки
   - `room` — параметры комнаты
   - `objects[]` — массив объектов в сцене (в т.ч. cabinet_model)
   - `camera` — позиция и target камеры

2. **Объект cabinet_model в objects[]:**
   ```json
   {
     "type": "Model",
     "name": "Опора 100 мм",
     "size": { "x": 60, "y": 100, "z": 79 },
     "pos": { "x": 1000, "y": 0, "z": 500 },
     "pivot": { "x": -1, "y": -1, "z": -1 },
     "spec": {
       "id": 456,
       "catalog_id": 456,
       "element_type": "cabinet_model",
       "catalog_type": "cabinet_model"
     }
   }
   ```

3. **При загрузке проекта:**
   - По `spec.id` загружается запись из каталога cabinet_model (`GET /api/catalog/item/cabinet_model/:id`)
   - Из `item.data.params.models` по размеру `size` выбирается вариант модели
   - Загружается 3D-файл, масштабируется под `size`, применяется `pos`, `pivot`, `rot`

Файлы:
- `src/constructor.ts` — добавление поддержки объектов типа "Model" в сцену
- `server.js` — сохранение/загрузка полного проекта (не только модуля)
- `src/api/catalogAPI.ts` — методы работы с cabinet_model
