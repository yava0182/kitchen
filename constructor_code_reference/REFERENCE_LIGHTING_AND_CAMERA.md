# Где в рефе настроены свет и камера

Файл референса: **`planplace_refs_planplace_main_core_v2_deobfuscated.js`**

---

## Камера и рендер

### Инициализация — функция `init_renderer()` (около строк 74943–74972)

- **PerspectiveCamera**: `new THREE.PerspectiveCamera(55, g/h, 1, 5000)`
  - FOV **55°**, aspect = clientWidth/clientHeight, **near = 1**, **far = 5000**
- Начальная позиция камеры: `camera.position.set(34, 203, 401)`
- Рендер: **LinearToneMapping**, **PCFSoftShadowMap**, **setClearColor(16777215, 1)** (белый фон)

### Подгонка камеры под объект (превью модуля)

- **`fitCameraToCenteredObject(camera, obj, 1.15, controls)`** — строки **4010–4023**
  - Считает размер объекта (Box3), по FOV и aspect вычисляет расстояние камеры по Z
  - Коэффициент **1.15** — отступ (padding)
  - Камера ставится: `position.set(obj.position.x, obj.position.y, distance)`
  - `controls.target = (obj.position.x, obj.position.y, 0)`, `maxDistance = 2 * distance`

- **`single_preview(bbox, obj)`** — строки **3999–4009**
  - Включает режим превью одного объекта
  - Вызывает `fitCameraToCenteredObject(camera, obj, 1.15, controls)`
  - Затем опускает объект на «пол»: `obj.position.set(0, -bbox.y/2, 0)`

---

## Свет (сцена «комната» — класс Room)

Метод **`build_light()`** — строки **75391–75413**

| Источник           | Параметры |
|--------------------|-----------|
| **AmbientLight**   | Цвет `0xffffff`, интенсивность **0.603** |
| **PointLight**     | Цвет `0xffffff`, интенсивность **0.5** (или 190 в старых ревизиях Three), позиция `(width/2, height+5, depth/2)`, **castShadow = false**, decay 5 (или 1 в r110+) |
| **DirectionalLight** | Цвет `0xffffff`, интенсивность **0.2**, позиция **(0, 450, depth/units)**, target **(width/2, 0, 0)**, **castShadow = false** |

В рефе тени от DirectionalLight в комнате отключены; shadowMap у рендера включён (PCFSoftShadowMap) для других целей.

---

## Дополнительный свет (элементы интерьера)

- **`create_light(params)`** — строки **1480–1488**
  - Точечный свет для окон/подсветки: **PointLight**, цвет по умолчанию `#ecde6c`, интенсивность **0.5**, distance **36**, decay **1**, **castShadow = true**

---

## Как быстро найти в файле

В `planplace_refs_planplace_main_core_v2_deobfuscated.js`:

1. Поиск по тексту: **`init_renderer`** — камера и рендер  
2. **`fitCameraToCenteredObject`** — расчёт камеры под объект  
3. **`single_preview`** — режим превью одного модуля  
4. **`build_light`** — свет комнаты (Ambient, Point, Directional)  
5. **`create_light`** — точечный свет для элементов
