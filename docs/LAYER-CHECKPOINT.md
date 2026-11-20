# Checkpoint / откат слоя

Чтобы не жить несколько дней в «сломанном bust» и не откатывать руками.

## Команды

```bash
# Снимок перед рискованной правкой (пресет overlays)
npm run layer:checkpoint -- before-l-footprint

# Снимок только цоколя
npm run layer:checkpoint -- before-plinth --preset=plinth

# Список снимков
npm run layer:list

# Откат файлов из снимка
npm run layer:restore -- before-l-footprint
```

После restore — **новый bust** в `index.html` + hard reload. Старый `?v=overlayL2` не открывать.

## Пресеты файлов

| Пресет | Когда |
|--------|--------|
| `overlays` (дефолт) | накладки, footprint, sacrifice, L/U колонка |
| `plinth` | только `KitchenPlinthRun` / цвет / inset |

Скрипт: `scripts/layer-checkpoint.mjs` → копии в `.rollback/<tag>/` + `MANIFEST.json`.

## Правило агента

1. Перед правкой `kitchen-side-panels*` / footprint / L — `layer:checkpoint`.
2. Комната/накладки красные → `layer:restore` того снимка, **не** «ещё патч сверху».
3. Цоколь continuity **не** чинить через side-panels (см. план ниже).
4. После зелёных накладок — `npm run freeze:overlays` (PASS). Чужой слой не ломает замок; доработка накладок = открыть слой и обновить freeze в той же сессии.

**Живой bust:** `20261118-overlayL6`.  
Снимки: `.rollback/before-overlay-verify/` (verify 616→600), `.rollback/before-overlay-midtop-sync/` (MID/TOP не росли с пеналом).

---

## Диагноз (2026-11-18): «торец занят» на L

**Симптом:** L-кухня, пенал/НМ → «Накладка 16 мм» → красное  
`Нет места для накладки: торец занят соседом или препятствием.`  
Bust после отката: `plinthSafe1` (это **возврат** старого бага, не новый).

**Путь кода**

1. `apply…` в `kitchen-side-panels-overlay-api.js`
2. `_columnOverlayCase` → `false`, потому что  
   `isKitchenStraightBaseBandSection(section)` на L = **false** (`lShape` есть)
3. Ветка footprint (жертва / pad колонки) **не** включается
4. Включается `evaluateKitchenModuleSidePanelClearanceLive`
5. Сосед по U → gap ≈ 0 → `blocked` → текст «торец занят…»

На **прямой** секции тот же модуль идёт в footprint → накладка ставится.

**Почему «фикс» overlayL сломал комнату**

Расширили footprint на L (`isKitchenSidePanelFootprintSection`) + выровняли MID parts к BASE.  
Это уже **канон сеток/накладок**, не «только clearance». Итог: белый брусок / развал формы на `?v=overlayL2`.

**Что можно / нельзя дальше**

| Подход | Канон накладок |
|--------|----------------|
| Читать готовый U ячейки для цоколя (только run-overlays) | не трогаем |
| Footprint на рукаве L **без** align MID (`overlayL3`/`L5`) | ок |
| `FootprintSection` + align parts MID→BASE | **нарушаем** — стоп |
| L free-arm затирает user `customZoneWidthsMm` (616→600) | **нарушаем** — стоп |

**Добито в L5:** пенал на L падал с `verify_failed` (ячейка 616→600), потому что `applyKitchenLFreeArm600SacrificeWidths` при user-ширинах пересобирал BASE. Теперь user BASE не трогает.

Снимки:
- `.rollback/plinthSafe1-baseline/` — до L-footprint
- `.rollback/before-l-overlay-fix/` — прямо перед `overlayL3`
- `.rollback/before-overlay-verify/` — перед L5 (verify_failed)
