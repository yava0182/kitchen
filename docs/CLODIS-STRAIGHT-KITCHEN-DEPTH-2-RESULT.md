# CLODIS — прямая кухня. DEPTH-2 результат

**Дата:** 2026-10-30  
**Опора:** `docs/CLODIS-STRAIGHT-KITCHEN-DEPTH-AUDIT.md`  
**Bust:** `?v=20261030-depth2` (engine build `__cldKitchenBaseEngineBuild`)

---

## 1. Какие сценарии реально выполнены

| Сценарий | Как проверен | Результат |
|----------|--------------|-----------|
| НМ 550→460→510 (формула стека) | Static: rear = Dwt−40−D, перед = 560 при Dwt=600 | OK по канону; rebuild пенала **не** нужен |
| Карандаш пенала / НШ1 / НШ2 | Static: пути `rebuildTall*` / `rebuildWallMid*` / `rebuildWallTop*` уже есть (walldepth1) | Не гонялись на живой сцене |
| Смена Dwt (столешка) | Static formula + code path `applyWorktopDepthOnWall` | **Дефект R2 подтверждён** → исправлен |
| Live e2e прямой кухни (bbox / scale / стык) | Браузер localhost:8100 | Scene **не загружена** (нет `state.scene`, 0 модулей) — сценарии place/rebuild **не** выполнены |
| `node scripts/check-straight-kitchen-depth2.mjs` | Реально выполнен | **PASS** |

---

## 2. Подтвердился ли дефект Dwt?

**Да.**

До патча `applyWorktopDepthOnWall` обходил только `isKitchenNmCarcassGroup`. Пенал сохранял старый `__kitchenCarcassDepthMm` (напр. 560 при Dwt=600). После Dwt→650 линия переда НМ = 610, пенал оставался 560 → разъезд **50 мм**.

Формула в чекере: `gap = (Dwt_new − 40) − tall_stamp_old`.

Пресеты низов 460/510/550 при фиксированной Dwt=600 перед ряда не двигают — пенал там не ломался (как в аудите R4).

---

## 3. Файлы изменены и почему

| Файл | Зачем |
|------|--------|
| `js/kitchen/kitchen-base-engine.js` | `syncTallDepthAfterWorktopOnWall` + вызов из `applyWorktopDepthOnWall`; build `20261030-depth2` |
| `js/main-refactored.js`, `js/core/init.js`, `js/furniture/furniture-manager.js`, `js/sections/section-manager.js`, `js/kitchen/kitchen-section-engine.js` | bust импорта engine → `depth2` |
| `scripts/check-straight-kitchen-depth2.mjs` | статический чекер формул + pins |
| `docs/CLODIS-STRAIGHT-KITCHEN-DEPTH-2-RESULT.md` | этот отчёт |

**Поведение патча**

1. После rebuild НМ под новой Dwt → для пеналов на стене: `rebuildTallForCellDepthMm(…, Dwt−40, { worktopDepthMm })`.
2. Зад пенала: существующий `alignBackToWall` внутри tall rebuild.
3. TOP: существующий `syncKitchenWallTopDepthFromTallInZone` (пропуск при `userLocked` / `custom`).
4. НШ1 не трогается.
5. `applyProjectDepthToScene` (пресеты 460/510/550) **не** менялся — tall sync туда не добавлялся.

Не трогались: L/Joint, Brain, WallRun, rhythm, autosave, материалы/свет/камера, каталог UI.

---

## 4. Результаты тестов

```
node scripts/check-straight-kitchen-depth2.mjs → PASS
```

- R2 gap 600→650 без sync = 50 мм  
- после sync tall D = nm front  
- пресеты 460/510/550: перед 560, rear ≥ 10  
- pins: `syncTallDepthAfterWorktopOnWall` вызывается из `applyWorktopDepthOnWall`  
- `applyProjectDepthToScene` остаётся NM-only  

---

## 5. Что проверить человеку в браузере

Hard reload: `http://localhost:8100/?v=20261030-depth2`

1. Консоль: `__cldKitchenBaseEngineBuild === '20261030-depth2'`.
2. Прямая кухня: НМ + пенал + НШ1 + НШ2.
3. «Глубина низов» 550→460→510: перед ряда и пенал совпадают; пенал не уезжает от стены; `group.scale ≈ (1,1,1)`.
4. Карандаш глубины пенала / НШ1 / НШ2: parametric, без scale; НШ2 с lock не сбрасывается project-ом.
5. **Карандаш «Глубина столешницы»** (напр. 600→650→600): пенал D = Dwt−40; перед пенал = перед НМ; deep TOP без lock следует пеналу; locked TOP без изменений; НШ1 D без изменений.

---

## Вывод

- Дефект Dwt→пенал **подтверждён** кодом и формулой; live-сцена недоступна в этом запуске.  
- Минимальный патч: sync пеналов через существующий `rebuildTallForCellDepthMm` + TOP sync после `applyWorktopDepthOnWall`.  
- Пресеты низов и карандаши модулей — без смены архитектуры.  

**СТОП.** Дальше — приёмка в браузере / следующее задание.
