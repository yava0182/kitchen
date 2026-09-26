# API для работы с проектами (полными, не модулями)

## Обзор

По аналогии с Clodis добавлена поддержка полных проектов с объектами в сцене (cabinet_model и т.д.).

**Отличия от модулей:**
- **Модуль** (`/api/modules/`, `/catalog/items_save/`) — дерево секций/стенок (template.tree), без camera, room, objects[]
- **Проект** (`/api/projects/`) — полный JSON проекта: project_settings, camera, room, **objects[]** (Cabinet, Model и т.д.)

Референс: `get_save_data_new()` и `save_scene_new()` в Clodis (planplace_refs_planplace_main_core_v2_deobfuscated.js:75671)

---

## API Endpoints

### 1. POST /api/projects/save

**Описание:** Сохраняет полный проект на сервер.

**Body (JSON):**
```json
{
  "name": "Мой проект",
  "projectData": {
    "version": "clodis-v1",
    "project_settings": { ... },
    "camera": {
      "position": { "x": 0, "y": 100, "z": 200 },
      "target": { "x": 0, "y": 0, "z": 0 }
    },
    "room": {
      "width": 3000,
      "height": 2500,
      "depth": 600
    },
    "objects": [
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
    ]
  }
}
```

**Response (success):**
```json
{
  "result": "success",
  "id": "1234567890",
  "fileName": "Мой_проект_1234567890.json",
  "filePath": "/path/to/projects/Мой_проект_1234567890.json"
}
```

**Response (error):**
```json
{
  "result": "error",
  "error": "Описание ошибки"
}
```

---

### 2. GET /api/projects/load/:fileName

**Описание:** Загружает проект из файла.

**Параметры:**
- `fileName` — имя файла проекта (например: `Мой_проект_1234567890.json`)

**Response (success):**
```json
{
  "result": "success",
  "project": {
    "version": "clodis-v1",
    "date_created": "2026-02-03T12:00:00.000Z",
    "date_updated": "2026-02-03T12:30:00.000Z",
    "project_settings": { ... },
    "camera": { ... },
    "room": { ... },
    "objects": [ ... ]
  }
}
```

**Response (error):**
```json
{
  "result": "error",
  "error": "Проект не найден"
}
```

---

### 3. GET /api/projects/list

**Описание:** Возвращает список всех проектов.

**Response (success):**
```json
{
  "result": "success",
  "projects": [
    {
      "id": "1234567890",
      "name": "Мой проект",
      "fileName": "Мой_проект_1234567890.json",
      "version": "clodis-v1",
      "date_created": "2026-02-03T12:00:00.000Z",
      "date_updated": "2026-02-03T12:30:00.000Z",
      "objects_count": 5
    }
  ]
}
```

---

## Использование в коде (frontend)

### Сохранение проекта

```javascript
// В constructor-clodis.js доступен window.cld
const projectJSON = await window.cld.saveProject();
const projectData = JSON.parse(projectJSON);

// Сохраняем на сервер
const response = await fetch('/api/projects/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Мой проект',
    projectData: projectData
  })
});

const result = await response.json();
console.log('Проект сохранён:', result.fileName);
```

### Загрузка проекта

```javascript
// Загружаем с сервера
const response = await fetch('/api/projects/load/Мой_проект_1234567890.json');
const result = await response.json();

if (result.result === 'success') {
  // Загружаем в сцену
  await window.cld.loadProject(result.project);
  console.log('Проект загружен');
}
```

### Добавление cabinet_model в сцену

```javascript
// Создаём объект cabinet_model в сцене
const modelParams = {
  type: 'Model',
  name: 'Опора 100 мм',
  size: { x: 60, y: 100, z: 79 },
  pos: { x: 1000, y: 0, z: 500 },
  pivot: { x: -1, y: -1, z: -1 },
  spec: {
    id: 456,
    catalog_id: 456,
    element_type: 'cabinet_model',
    catalog_type: 'cabinet_model'
  }
};

const obj = await window.cld.addModelToScene(modelParams);
if (obj) {
  console.log('Модель добавлена в сцену');
}
```

### Получение объектов сцены

```javascript
const objects = window.cld.getSceneObjects();
console.log('Объектов в сцене:', objects.length);
```

---

## Структура проекта (projectData)

### Полный формат (как в Clodis)

```json
{
  "version": "clodis-v1",
  "date_created": "2026-02-03T12:00:00.000Z",
  "date_updated": "2026-02-03T12:30:00.000Z",
  
  "project_settings": {
    "project_id": 1234567890,
    "selected_materials": {
      "top": {},
      "bottom": {},
      "facades": {},
      "corpus": {},
      "glass": {},
      "cokol": {}
    },
    "models": {
      "top": "",
      "bottom": ""
    },
    "defaults": {
      "facades": {
        "top": "",
        "bottom": ""
      }
    }
  },
  
  "camera": {
    "position": { "x": 0, "y": 100, "z": 200 },
    "target": { "x": 0, "y": 0, "z": 0 }
  },
  
  "room": {
    "width": 3000,
    "height": 2500,
    "depth": 600
  },
  
  "objects": [
    {
      "type": "Model",
      "name": "Опора 100 мм",
      "size": { "x": 60, "y": 100, "z": 79 },
      "pos": { "x": 1000, "y": 0, "z": 500 },
      "pivot": { "x": -1, "y": -1, "z": -1 },
      "rot": { "x": 0, "y": 0, "z": 0 },
      "scale": { "x": 1, "y": 1, "z": 1 },
      "spec": {
        "id": 456,
        "catalog_id": 456,
        "element_type": "cabinet_model",
        "catalog_type": "cabinet_model",
        "orientation": "v",
        "material": { ... }
      }
    }
  ]
}
```

---

## Файлы

### Backend (server.js)

- `POST /api/projects/save` — сохранение проекта
- `GET /api/projects/load/:fileName` — загрузка проекта
- `GET /api/projects/list` — список проектов
- Проекты хранятся в папке `projects/` (формат: `name_projectId.json`)

### Frontend (constructor-clodis.js)

Функции:
- `get_save_data_new()` — сборка JSON проекта (как в Clodis)
- `save_scene_new()` — async функция сохранения (возвращает JSON строку)
- `load_project(projectData)` — загрузка проекта и создание объектов в сцене
- `createModelObject(params)` — создание объекта cabinet_model в сцене
- `addObjectToScene(obj)` — добавление объекта в `d_objects[]`
- `removeObjectFromScene(obj)` — удаление объекта

Экспортируется через `window.cld`:
- `window.cld.saveProject()` — сохранить проект (async)
- `window.cld.loadProject(projectData)` — загрузить проект (async)
- `window.cld.addModelToScene(params)` — добавить cabinet_model в сцену (async)
- `window.cld.getSceneObjects()` — получить массив `d_objects[]`
- `window.cld.removeObjectFromScene(obj)` — удалить объект

Глобальные переменные:
- `d_objects[]` — массив всех объектов в сцене (как в Clodis)
- `project_settings` — настройки проекта
- `room.params` — параметры комнаты
- `room.active_objects` — ссылка на `d_objects`

---

## Примечания

1. **Модули vs Проекты:**
   - Модули (`/catalog/items_save/`) — для каталога элементов (дерево секций)
   - Проекты (`/api/projects/`) — для полных сцен с объектами

2. **Совместимость:**
   - Старые endpoints `/api/modules/*` работают для модулей
   - Новые endpoints `/api/projects/*` для проектов

3. **Референс:**
   - Структура полностью соответствует Clodis `get_save_data_new()` (строка 75671)
   - Поддержка объектов типа "Model" (cabinet_model) в сцене

4. **TODO:**
   - Drag & drop из каталога 3D моделей в конструктор
   - UI для управления проектами (сохранение/загрузка)
   - Поддержка объектов типа "Cabinet" (модули кухни)
