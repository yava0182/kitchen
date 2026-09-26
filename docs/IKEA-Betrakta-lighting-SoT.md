# IKEA PAX — свет и тени (SoT из консоли)

Снято с живого `storageone v16.2.0`  
URL: `https://www.ikea.com/addon-app/storageone/pax/web/latest/us/en/#/planner`  
Движок: **Betrakta** поверх **Babylon ThinEngine** (не Three.js).  
Единицы позиций: **метры**.  
Дата снятия: 2026-08-24.

Это не догадки — `LightsApi.renderSettings` + live `betraktaViewer` / `light_manager`.

---

## 1. Архитектура (факты)

| Факт | Значение |
|------|----------|
| Кастомный viewer | Betrakta |
| Материалы мебели и комнаты | `ShaderMaterial` (Betrakta PBR), **не** unlit / MeshBasic |
| Lightmap на корпусе / стенах | **0** (нет bake lightmap) |
| HDR framebuffer | `use_hdr_framebuffer: true` |
| Tonemap Babylon IPC | `toneMappingEnabled: false` |
| Exposure (IPC) | **2** |
| Contrast | 1 |
| Deferred tonemap + LUT | есть (`use_deferred_tonemapping`, `get_lut_effect`) |
| Soft shadows feature | `enable_soft_shadows: true`, `max_lights: 8` |
| SSAO day (`screenSpaceAmbientOcclusion`) | **false** |
| Env | `210701_pax_env_lowres_lowsat_2.env`, intensity **0.6**, rotation **80°**, local box |

---

## 2. Комната (room)

### 2.1 Материалы комнаты (`renderSettings.roomMaterials`)

| id | asset |
|----|--------|
| WALL | `.../materials/room/wall/new_wall_1.glb` |
| SKIRTING | `.../materials/room/skirting/skirting.gltf` |
| FLOOR | `.../materials/room/floor/new_wooden_floor.glb` |
| THICKNESS | `#FFFFFF` (без url) |
| CEILING | `#FFFFFF` (без url) |

Стены/пол — **GLB + Betrakta ShaderMaterial**, не плоский Basic без IBL.

### 2.2 Ambient (live `BetraktaAmbientLightController`)

| Параметр | Live |
|----------|------|
| enabled | true |
| intensity | **0** (в момент снятия) |
| top color | rgb(1, 1, 1) |
| bottom/ground | ~rgb(0.53, 0.53, 0.53) |

### 2.3 Ceiling / Floor / Line / Spot fill (из `renderSettings`, day)

```json
"ceilingLight": { "color": {"r":255,"g":255,"b":255}, "intensity": 2 },
"floorLight":   { "color": {"r":255,"g":255,"b":255}, "intensity": 3 },
"lineLight": {
  "angleRange": 120,
  "color": {"r":255,"g":204,"b":168},
  "intensity": 3
},
"spotLight": {
  "color": {"r":255,"g":204,"b":168},
  "intensity": 8,
  "positionAdjustment": { "y": -0.02, "z": 0.3 }
}
```

Цвет line/spot fill: тёплый `#FFCCA8` (не холодный синий).

### 2.4 Environment (комната + мебель в одном env)

```json
"environmentMap": {
  "url": "https://www.ikea.com/addon-app/storageone/assets/generic/envmaps/210701_pax_env_lowres_lowsat_2.env",
  "intensity": 0.6,
  "rotation": 80,
  "localMode": {
    "position": { "x": 0, "y": 1, "z": 0 },
    "size": { "x": 7.5, "y": 5, "z": 7.5 }
  },
  "assemblyInstructionIntensity": 1.5
}
```

Live: `showSkybox: false`, fileType `env`.

### 2.5 Scene clear / fog

| | |
|--|--|
| ambientColor | `#000000` |
| fogMode | 0 (off) |
| environmentIntensity | 0.6 |

---

## 3. Шкаф / решение (furniture lighting)

### 3.1 Main light = Spot (live punctual: **только он**)

`get_punctual_lights()` → `[BetraktaSpotLight]` — **один** punctual light.

| Параметр | renderSettings / live |
|----------|------------------------|
| type | BetraktaSpotLight |
| intensity | **115** |
| colorTemperature | **6300 K** |
| position | **(0, 5, 2)** м |
| direction | **(0, -1, 0)** (смотрит вниз) |
| innerAngle | **65°** |
| outerAngle | **106°** |
| shadow angle | = outer **106°** |
| enableShadows | **true** |
| shadowResolution | **4096** |
| shadowNear | **0.5** м |
| shadowFar | **6** м |
| bias | `z_factor: 3`, `z_units: 8000` |

`mainLightCenterPosition` (якорь решения): `(0, 1.3, 2)`.

API: `set_intensity_lumen` / `set_intensity_candela` — интенсивность в физических единицах Betrakta, **не** Three.js `intensity`.

### 3.2 Directional (в settings есть; как punctual в момент снятия — нет)

```json
"directionalLight": {
  "enabled": true,
  "enableShadows": true,
  "intensity": 3,
  "color": {"r":191,"g":191,"b":191},
  "position": { "x": 1, "y": 6, "z": 3 },
  "target": { "x": 0, "y": 0, "z": 0 },
  "shadowResolution": 4096,
  "shadowNear": 1,
  "shadowFar": 10
}
```

Соотношение Spot:Dir по intensity в settings ≈ **115 : 3**.

### 3.3 Point light

```json
"pointLight": {
  "enabled": false,
  "enableShadows": true,
  "intensity": 6,
  "color": {"r":191,"g":191,"b":191},
  "position": { "x": 0, "y": 3, "z": 2 },
  "shadowResolution": 4096,
  "shadowNear": 0.1,
  "shadowFar": 40
}
```

### 3.4 SoftShadowRenderer (отдельный слой «мягких» теней)

Съём 2026-08-25 (live console, узкий белый PAX):

| | |
|--|--|
| class | SoftShadowRenderer |
| intensity | 1 |
| resolution | **80** |
| center | **(0, 1.3, 1.5)** м — XZ ≡ Spot (см. ниже) |
| size | **(10, 2.74, 10)** м |
| render_layer_mask | bitmap **2** |
| block_layer_mask | bitmap **32** |
| API | `get_blurred_heightmap`, `update_shadow_plane_texture` |

**Live Spot (тот же кадр):** `BetraktaSpotLight` intensity 115, pos **(0, 5, 1.5)**, dir (0,−1, 0).  
`delta (Spot.xz − SoftShadow.center.xz) = (0, 0)`.

#### Pipeline SoftShadow (факты из `keys` / methods)

Порядок по именам эффектов (не догадка «как blur» — структура объектов):

1. `_depth_texture` + `_transfer_depth_effect` — depth / height сверху объёма  
2. `_blur_effect` — размытие heightmap  
3. `_generate_shadow_plane_texture_effect` → `_shadow_plane_target` — текстура на **shadow plane**  
4. `get_blurred_heightmap` / `update_shadow_plane_texture` — публичный API обновления  

Прочие ключи: `_postprocess_camera`, `_tracked_center_position`, `_tracked_size`, `_reference_height`, `_render_layer_mask`.

**Вывод для порта:** контакт пол (и мягкая проекция на стену) = **blurred heightmap → shadow-plane texture**, не классический Spot shadow map на MeshBasic и не screen SSAO (`screenSpaceAmbientOcclusion: false` в day).

**ПРОБЕЛ P2b:** числовой blur kernel / radius px у `_blur_effect` ещё не снят (свойство `blur` в dump = не выведено).  
**ПРОБЕЛ P3:** получают ли стены отдельный Spot shadow map или только soft-plane — в dump `spot.enableShadows` на live-объекте `undefined`, в `renderSettings.mainLight` — `enableShadows: true` + bias / 4096.

### 3.5 Shadow atlas (light_manager.shadows)

Кастомный объект с `_fake_light`, `atlas`, `_depth_texture` — свой shadow pipeline Betrakta, не «голый» Babylon ShadowGenerator.

### 3.6 Temporal / SSAO (day)

```json
"temporalEffects": {
  "screenSpaceAmbientOcclusion": false,
  "ssaoParams": {
    "enabled": true,
    "ambientOcclusionStrength": 0.6,
    "radius": 0.06
  },
  "temporalAntiAliasing": false
}
```

Главный depth day-режима: **Spot shadows + SoftShadow**, не screen-space AO.

---

## 4. Night mode (для полноты)

| | day | night (`darkMode`) |
|--|-----|---------------------|
| Spot fill intensity | 8 | 8 (angle 93, width 8) |
| Dir intensity | 3 | 0.1 |
| Env intensity | 0.6 | 0.4 |
| Glow | — | blur 15, intensity 2.2 |
| SSAO screen | false | false |
| ssaoParams.radius | 0.06 | 0.3 |
| ssaoParams.strength | 0.6 | 0.8 |

---

## 5. LightsApi — методы (как двигают свет)

- `setupSceneLights`
- `setupEnvironmentMap`
- `setupMainLight` / `setupMainLightIfNeeded`
- `setupTemporalEffects`
- `setupCameraExposure`
- `centerLights`
- `updateMainLightPosition` — свет следует за решением
- `setShadowsEnabled`
- `updatePointLight`
- `setDarkScene` / `setLightScene`
- `forAssembly`

Вывод: тень на стене меняется при переносе шкафа, потому что **main light / soft shadow center** привязаны к решению, а не «прижим к стене».

---

## 6. Что это значит для нашего Three.js

| IKEA | Наш целевой порт (без Babylon) |
|------|--------------------------------|
| Betrakta Spot 115 + CCT 6300, 65°/106°, shadow 4K | `SpotLight` main, тени, углы те же; intensity **калибровать** (единицы другие) |
| Dir 3, pos (1,6,3), shadow 4K в settings | `DirectionalLight` secondary; не перебивать Spot |
| SoftShadowRenderer heightmap | отдельный soft contact plane / heightmap pass |
| Env `.env` lowsat 0.6 + local box | PMREM того же (или клона) env, intensity ~0.6 по ощущению |
| Room = GLB + Betrakta shaders + тот же свет | У нас сейчас MeshBasic комната — **другой мир**; стык теней шкаф→стена = отдельная задача |
| Exposure 2 + deferred + LUT | ACES/exposure + опционально LUT; цифры не копировать 1:1 |
| Lightmaps / GTAO day | **не** основа IKEA day |

---

## 7. Источник правды

Повторный съём в DevTools:

1. Открыть PAX planner.
2. Найти React fiber → `props.value.betraktaViewer` / `props.value.lights`.
3. Читать `lights.renderSettings` и `betraktaViewer.light_manager`.

Файл обновлять при смене `storageone` version, если визуал разъедется.

---

## 8. ПРОБЕЛЫ — статус после полного dump 2026-08-25

| ID | Статус | Факт из dump |
|----|--------|--------------|
| Soft + Spot follow | **закрыт** | Soft 80 / 10×2.74×10; Spot 115; Δxz=0; center≈(0,1.3,1.5) |
| Spot shadow | **закрыт** | `BetraktaLightShadow` `_enable_shadows: true`, near 0.5 far 6; settings 4096 + bias |
| Soft pipeline | **закрыт** | depthTransfer → blur EffectWrapper → generatePlane → shadowPlaneTarget |
| Blur kernel px | **открыт** | у `_blur_effect` нет простых `kernel/radius/sigma` — только EffectWrapper (`_samples: 1`, fullscreen). Калибровка по кадру |
| Стена vs Soft | **частично** | contact на полу = soft-plane; трапеция на стене — тот же heightmap-слой (не отдельный Dir). Точный wall-shader uniform не снят |
| PBR корпус/стена | **открыт** | dump попал в `ViewerUiMeshMaterial` (UI Custom Mesh), `baseColor/roughness` null — **не** материал шкафа |
| Intensity units | **частично** | `set_intensity_lumen` + `set_intensity_candela` = true; перевод 115→Three — калибровка |
| LUT | **частично** | класс `LutEffect`, ключи `_lut_texture` / `_url` — URL не раскрыт |
| Shadow atlas | **факт** | `shadowsMgr`: `_fake_light` = BabylonCustomShadowLight, atlas TexturePacker |

**Вывод:** архитектуру своего «Betrakta-light» в Three.js строить **можно**. Цифры blur/PBR/LUT — калибровка по эталонному кадру, не блокер старта.

### Дожим dump 2026-08-25 (remaining-gaps)

| Тема | Результат |
|------|-----------|
| Soft blur | EffectWrapper, uniforms: `direction`, `scale`, `sourceTexture`, `textureSampler` (separable blur). `samples: 1`. Числового radius/sigma в JS **нет** |
| Spot intensity | `raw: 115`; lumen/candela getters → `undefined` (методы есть) |
| LUT | `LutEffect`, `url`/`intensity` в dump → `undefined` |
| Camera exposure/fov | `undefined` на этом пути |
| Материалы | Первые меши = UI (`ViewerUiMeshMaterial`). **Пол:** `BetraktaPBRMaterial` / `Floor_Herringbone_Medium_Wood_Instance`, `receiveShadows: true` |
| Room assets | WALL / SKIRTING / FLOOR — GLB urls; THICKNESS+CEILING `#FFFFFF` |

### PBR live (dump `pbr` ×22) — 2026-08-25

Все `BetraktaPBRMaterial`, `receiveShadows: true`. Цвет смотреть в `_base_color_factor_srgb` (линейный фактор рядом — TrackedVec4).

| Роль | name | roughness | metallic | base_color_srgb |
|------|------|-----------|----------|-----------------|
| **Стена (краска)** | `paint_30x30_white_instance` | **0.75** | 0 | **(0.942, 0.941, 0.892)** тёплый off-white |
| **Пол** | `Floor_Herringbone_Medium_Wood_instance` | **1.0** | 0 | (1,1,1) + albedo-текстура |
| **Белый корпус PAX** | `010_White` | **0.35** | 0 | **(0.998, 0.998, 0.967)** |
| Зад / HDF | `003_Backside_Furniture` | 0.6 | 0 | (1,1,1) |
| Присадка / отверстия | `002_Holes_Pax` | 1.0 | 0 | (1,1,1) |
| Белый пластик | `011_White_Plastic` | 0.6 | 0 | как `010_White` |
| Оцинковка | `004_Galvanized_Metal` | 0.35 | **1** | ~0.545 gray |
| Резина | `006_Black_Rubber` | 0.65 | 0 | ~0.169 |

**Порт Three.js:** стена ≈ `MeshStandardMaterial` color `#f0efe4` (из srgb), roughness 0.75; корпус ≈ color `#fefef7`, roughness **0.35**, metalness 0. Пол — текстура + roughnessness 1.

Остаётся калибровка: SoftShadow `scale`, Spot 115→Three, LUT (url не отдан). **Архитектура + материалы для «как IKEA» — достаточно стартовать.**
