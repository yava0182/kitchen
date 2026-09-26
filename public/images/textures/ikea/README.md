# IKEA Текстуры для материалов комнаты

Эта папка предназначена для хранения текстур, извлеченных из IKEA Planner GLB файлов.

## Структура

```
ikea/
├── wall/          # Текстуры для стен (из new_wall_1.glb)
│   ├── diffuse.jpg
│   ├── normal.jpg
│   ├── roughness.jpg  (если есть)
│   └── ao.jpg        (если есть)
└── floor/         # Текстуры для пола (из new_wooden_floor.glb)
    ├── diffuse.jpg
    ├── normal.jpg
    ├── roughness.jpg  (если есть)
    └── ao.jpg        (если есть)
```

## Как получить текстуры

### Вариант 1: Из IKEA Planner (браузер)
1. Откройте IKEA Planner: https://ikea.com/addon-app/storageone/pax/web/latest/pl/pl/
2. Откройте DevTools → Network
3. Найдите запросы к `.glb` файлам:
   - `/addon-app/storageone/assets/generic/materials/room/wall/new_wall_1.glb`
   - `/addon-app/storageone/assets/generic/materials/room/floor/new_wooden_floor.glb`
4. Скачайте файлы
5. Распакуйте GLB используя инструменты (см. ниже)

### Вариант 2: Прямая загрузка (если доступны прямые URL)
```bash
# Пример (замените на актуальные URL)
curl -o wall.glb "https://ikea.com/addon-app/storageone/assets/generic/materials/room/wall/new_wall_1.glb"
curl -o floor.glb "https://ikea.com/addon-app/storageone/assets/generic/materials/room/floor/new_wooden_floor.glb"
```

## Распаковка GLB файлов

### Используя gltf-transform (рекомендуется)
```bash
npm install -g @gltf-transform/cli
gltf-transform extract wall.glb wall-extracted/
# Текстуры будут в папке wall-extracted/
```

### Используя gltf-pipeline
```bash
npm install -g gltf-pipeline
gltf-pipeline -i wall.glb -o wall-extracted/
```

### Используя Blender
1. Откройте Blender
2. File → Import → glTF 2.0 (.glb/.gltf)
3. Выберите файл
4. Материалы и текстуры будут доступны в Shader Editor
5. Экспортируйте текстуры вручную

## Применение в коде

После размещения текстур в соответствующих папках, обновите пути в `js/Room.js`:

```javascript
// Для стен
const wallTextureUrl = 'images/textures/ikea/wall/diffuse.jpg';
const wallNormalUrl = 'images/textures/ikea/wall/normal.jpg';

// Для пола
const floorTextureUrl = 'images/textures/ikea/floor/diffuse.jpg';
const floorNormalUrl = 'images/textures/ikea/floor/normal.jpg';
```

## Форматы текстур

- **Diffuse/Albedo**: JPG или PNG (RGB)
- **Normal**: JPG или PNG (RGB, tangent space)
- **Roughness**: JPG или PNG (grayscale)
- **AO (Ambient Occlusion)**: JPG или PNG (grayscale)

Рекомендуемое разрешение: 2K (2048×2048) или 4K (4096×4096).

---

**Статус:** Ожидание текстур IKEA  
**Источник:** `TZ_IKEA_LIGHTING_CONVERSION.md`
