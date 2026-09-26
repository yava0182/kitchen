# Сопоставление: добавление 3D модели — наш проект и референс Clodis

## Важно: область применения изменений по референсу

**Изменения по референсу (pivot, доработки масштаба/порядка и т.п.) применяем только для превью «Добавление/редактирование 3D модели» в админке** (вкладка «3D модели», форма редактирования записи cabinet_model). Там сцена открывается в iframe с параметром **`context=models3d`** (`constructor-clodis.html?embedded=1&context=models3d`), и логика может ветвиться по `window.__CLD_PREVIEW_CONTEXT === 'models3d'`.

**Каталог элементов в конструкторе не трогаем** — там сцена подстраивается отдельно, работа по интеграции 3D модели в конструктор будет своей. Для каждой вкладки/контекста сцену можно настраивать отдельно.

---

## 1. Каталог и API

| Аспект | Референс Clodis | Наш проект |
|--------|-------------------|------------|
| **Тип каталога** | `cabinet_model` (controller_name) | `cabinet_model` (`MODELS3D_LIST_TYPE` в admin-models3d-list.js) |
| **Список** | `GET /catalog/items_get/cabinet_model` | `GET /api/catalog/items_get/cabinet_model` |
| **Категории** | `GET /catalog/categories_get/cabinet_model` | Через общий items_get или categories_get по имени |
| **Один элемент** | Получение по id (item.data = JSON) | `GET /api/catalog/item/cabinet_model/:id` |
| **Добавление** | `item_add` для типа cabinet_model | `POST /api/catalog/item_add/cabinet_model/` |
| **Редактирование** | `item_update` | `POST /api/catalog/item_update/cabinet_model/:id/` |
| **Удаление** | — | `DELETE /api/catalog/item_delete/cabinet_model/:id` |
| **Загрузка файла модели** | Путь к файлу (например `/common_assets/models/... .fbx`) | `POST /api/upload/model_3d` → путь сохраняется в `params.models[].model` |

---

## 2. Структура данных одной записи (item.data / params)

| Поле | Референс | У нас |
|------|---------|--------|
| **Хранение** | `item.data` (JSON строка), при загрузке `params = JSON.parse(item.data).params` | `item.data` (JSON строка), парсим в `itemData`, используем `itemData.params` |
| **params.models** | Массив вариантов: `model`, `code`, `name`, `price`, `min_x..max_x`, `min_y..max_y`, `min_z..max_z` | ✅ То же: `params.models[]` с `model`, `code`, `name`, `min_x/y/z`, `max_x/y/z`, `price_type`, `price_mode`, `count` |
| **params.models[].params** | — | ✅ Доп. параметры: `rot`, `pos`, `scale`, `set_uv`, `process`, `meshes` (как в референсе у _load_model: rot, scale, pos) |
| **params.size** | Размер секции по умолчанию (например `size: { x: 100, y: 100, z: 100 }`) | Не в params; размер превью отдельно |
| **Размер для превью** | — | `preview_size: { x, y, z }` (мм) — отдельно от params (поля «Ширина/Высота/Глубина» в форме редактирования) |
| **params.show_in_spec** | Есть | ✅ `params.show_in_spec` |
| **params.variants** | Есть (для каталога) | ✅ `params.variants: []` (пока пустой массив) |

Итого: у нас одна запись = один элемент каталога с одним вариантом модели в `params.models[0]`; референс допускает несколько вариантов в `params.models` с разными диапазонами размеров.

---

## 3. Выбор варианта модели по размеру секции

| Аспект | Референс | У нас |
|--------|----------|--------|
| **Логика** | В конструкторе: `_get_model()` перебирает `params.models` и выбирает запись, где размер секции попадает в `min_x..max_x`, `min_y..max_y`, `min_z..max_z` | В админке редактируем один вариант (первый в массиве); в конструкторе при подстановке модуля выбор по размерам не реализован в этом сравнении |
| **Fallback** | Если ничего не подошло — `no_model.fbx` | Нет отдельного fallback-файла |

---

## 4. Форматы файлов моделей

| Формат | Референс | У нас |
|--------|----------|--------|
| **FBX** | ✅ основной (load_exact_model → fbx_loader) | ✅ при наличии FBXLoader в constructor-clodis.js |
| **GLTF/GLB** | ✅ GLTFLoader | ✅ GLTFLoader |
| **OBJ** | ✅ OBJLoader | ✅ OBJLoader (в коде явно: мм → юниты 1/UNITS_MM) |
| **STL** | — | ✅ в форме загрузки (если подключён loader) |
| **3DS / Collada** | ✅ в рефе | — |

У нас в превью загружаются пути вида `/api/upload/model_3d/...` или относительные пути к загруженным файлам.

---

## 5. Загрузка модели в сцену (движок превью / конструктор)

### 5.1 Кто и когда загружает

| Аспект | Референс | У нас |
|--------|----------|--------|
| **Класс/контекст** | Класс `CabinetModel` (наследник секции), в `_build_spec()` вызывается `_load_model(model_path, materials, params)` | Превью: iframe `constructor-clodis.html?embedded=1`, по postMessage `cld:loadModel` вызывается `loadModel(modelPath, transform)` |
| **Размеры секции** | `computed.size` (мм), `computed.u_size = size / units` (юниты сцены) | Превью: `state.w`, `state.h`, `state.d` (мм), задаются через `cld:setSize` из полей «Ширина/Высота/Глубина» формы; в коде `mmToU()` → юниты (1 юнит = 10 мм, UNITS_MM = 10) |

### 5.2 Порядок операций при загрузке

| Шаг | Референс (_load_model) | У нас (loadModel + applyLoadedModelTransform) |
|-----|------------------------|-----------------------------------------------|
| 1 | Загрузка мешей (Model_utils.load_model), применение rot/scale к мешам из params | Загрузка модели (OBJ/GLTF/GLB), добавление в `loadedModelGroup` |
| 2 | **Центрирование** | ✅ Центрирование: bbox модели → `model.position.sub(center)` |
| 3 | Масштаб под секцию | ✅ Масштаб под рамку: bbox → размеры `state.w, state.h, state.d` (мм); для OBJ ещё конвертация мм→юниты (baseScale); масштаб по осям на `model.scale` |
| 4 | _set_model3d_size: сброс поворота own_object, bbox мешей, Model_utils.set_size(mesh, name, { box, size: u_size, s, t }) | Нет отдельного «set_size» по мешам; итоговый размер достигается масштабом модели и группы |
| 5 | translateX/Y/Z(pos / units) на **own_object** | ✅ position задаётся на **loadedModelGroup**: `loadedModelGroup.position.set(mmToU(px), mmToU(py), mmToU(pz))` в applyLoadedModelTransform |
| 6 | rotateX/Y/Z(deg2rad(rot)) на **own_object** | ✅ rotation на **loadedModelGroup**: `loadedModelGroup.rotation.set(rotX, rotY, rotZ)` (радианы) |
| 7 | После поворота — повторная подгонка под рамку | ✅ После поворота сбрасываем scale группы в (1,1,1), считаем bbox, задаём мировой масштаб (sx,sy,sz), переводим в локальный масштаб группы через R^T и ставим `loadedModelGroup.scale` |
| 8 | _apply_materials | У нас в превью материалы не подставляются из каталога (можно добавить отдельно) |

В референсе pos/rot применяются к own_object после масштабирования мешей под u_size. У нас позиция и поворот применяются к `loadedModelGroup`; после поворота мы заново подгоняем габарит под рамку через scale группы (с учётом локальных осей).

---

## 6. Pivot (точка привязки)

| Аспект | Референс | У нас |
|--------|----------|--------|
| **Где задаётся** | У секции/элемента: `params.pivot` (числа -1, 0, 1 по осям). Для wall по умолчанию (-1,-1,-1). | **Нет в форме 3D модели.** В форме редактирования cabinet_model полей pivot нет. |
| **Формула** | `conv_pivot(pivot, size) = -pivot * size / 2` (мм); применяется как translate на own_object в _build_pivot() | — |
| **Порядок** | _build_size → _build_pos → _build_rot → _build_scale → **_build_pivot** → _build_c_rot → _build_spec. Pivot применяется к own_object до загрузки мешей (в _build_spec). | Превью: только позиция (pos) из формы; pivot не используется. Центрирование модели по bbox делается один раз при загрузке. |
| **Для cabinet_model** | Секция имеет свой pivot (например -1,-1,-1); own_object сдвигается на conv_pivot; внутрь добавляется уже загруженная модель. | Модель центрируем по центру bbox; «рамка» (preview_size) задаёт только размеры для масштаба, без явного pivot. |

Итого: в референсе pivot — это смещение секции (own_object), не отдельный параметр меша. У нас в админке 3D модели pivot не вынесен; при необходимости его можно добавить как смещение (например в мм) и применять к `loadedModelGroup.position` аналогично conv_pivot.

---

## 7. Размеры: откуда берутся и куда попадают

| Аспект | Референс | У нас |
|--------|----------|--------|
| **Размер секции (мм)** | `computed.size` из `params.size` через comp2 (s:x, s:y, s:z и т.д.) | Превью: явные поля «Ширина/Высота/Глубина» (например 600, 720, 600) → сохраняются в `preview_size.x/y/z`, в iframe передаются как `cld:setSize` → `state.w, state.h, state.d` |
| **Юниты сцены** | `u_size = size / units` (units = 1000 в одном месте; в другом 1 unit = 10 mm) | `mmToU(mm) = mm / UNITS_MM`, UNITS_MM = 10 → 1 юнит = 10 мм |
| **Целевой размер модели** | _set_model3d_size подгоняет bbox мешей к `u_size` (Model_utils.set_size) | Масштаб модели и группы подгоняем под `state.w, state.h, state.d` (мм), конвертированные в юниты |
| **min_x/y/z, max_x/y/z** | Диапазоны размеров секции, при которых выбран этот вариант модели | ✅ Хранятся в `params.models[].min_x/y/z`, `max_x/y/z`, заполняются в форме (вкладка «Модель») |

---

## 8. Трансформация из формы (pos, rot, scale)

| Поле | Референс (params для модели) | У нас (форма + data) |
|------|-----------------------------|------------------------|
| **pos (мм)** | В _load_model: `h['pos']['x/y/z']` в мм, делят на units при translate | ✅ `params.models[].params.pos` (x,y,z); в превью передаём только position/rotation (scale не передаём — масштаб автоматический под рамку) |
| **rot (градусы)** | В _load_model: `h['rot']['x/y/z']`, deg2rad при rotate | ✅ `params.models[].params.rot` (x,y,z); в postMessage передаём rotation в градусах, в constructor-clodis переводим в радианы |
| **scale** | В референсе scale задаётся в params и применяется к мешам (Model_utils.set_scale) или в _set_model3d_size | В форме есть scale x/y/z (сохраняем в params), но в превью **не передаём** — масштаб считается автоматически под рамку (w×h×d), чтобы модель не деформировалась произвольно |

---

## 9. Превью в форме редактирования

| Аспект | Референс | У нас |
|--------|----------|--------|
| **Где** | В форме редактирования элемента каталога cabinet_model (превью для проверки размеров/вида) | Страница редактирования 3D модели, блок «Превью» с iframe |
| **Сцена** | Может использоваться тот же превью-движок, что и для каталога | iframe: `/constructor-clodis.html?embedded=1` — та же сцена (стрелки, размеры, красный объём секции), без полного движка Clodis |
| **Размеры** | Размер секции из params или дефолт | Сначала отправляем `cld:setSize` с полями Ширина/Высота/Глубина, через 150 ms; затем через 200 ms отправляем `cld:loadModel` с путём и transform (без scale) |
| **Сообщения** | — | `cld:setSize`, `cld:loadModel`, `cld:setModelTransform` (position + rotation) |

---

## 10. Краткая сводка отличий

- **Структура данных:** совпадаем по `params.models[]` (model, code, name, min/max по осям, params.rot/pos/scale). Дополнительно у нас есть `preview_size` и явное хранение params у первого варианта.
- **Выбор варианта по размеру:** в референсе выбор по min/max при построении секции; у нас в админке один вариант, выбор при подстановке в комнату можно реализовать по тому же правилу.
- **Загрузка в сцену:** у нас центрирование + масштаб под рамку (w,h,d) + позиция и поворот на группе; после поворота — повторная подгонка под рамку с учётом локальных осей (R^T). В референсе — свой пайплайн (set_size по мешам, pos/rot на own_object).
- **Pivot:** в референсе есть у секции (conv_pivot на own_object); у нас в форме 3D модели pivot не вынесен — при необходимости можно добавить и применять к группе.
- **Масштаб в превью:** у нас в превью масштаб только автоматический (под рамку), из формы scale в превью не передаём; в референсе scale из params применяется к мешам.
- **Единицы:** у нас 1 юнит = 10 мм (UNITS_MM); в референсе в разных местах units = 1000 или 10 мм — см. REFERENCE_MAPPING.md.

**Разделение по контекстам сцены:**
- **Превью 3D модели (админка):** iframe с `?embedded=1&context=models3d`. В constructor-clodis выставляется `window.__CLD_PREVIEW_CONTEXT = 'models3d'`. Все доработки по референсу (pivot, порядок операций и т.д.) делаем только при этом контексте.
- **Каталог элементов / конструктор:** та же страница constructor-clodis может открываться без `context` или с другим значением. Там сцену не меняем в рамках этой задачи — настраивается отдельно.

Файлы для правок при доведении до референса (только для превью 3D модели):
- `admin-models3d-list.js` — форма, сохранение, postMessage; iframe с `context=models3d`.
- `src/constructor-clodis.js` — в ветках с проверкой `window.__CLD_PREVIEW_CONTEXT === 'models3d'`: loadModel, applyLoadedModelTransform, при необходимости pivot (форма pivot x/y/z -1|0|1 и применение к loadedModelGroup по формуле conv_pivot).
