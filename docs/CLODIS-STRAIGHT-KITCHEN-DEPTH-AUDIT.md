# CLODIS — прямая кухня. Аудит системы глубин

**Дата:** 2026-10-30  
**Режим:** только аудит (код не менялся)  
**Scope:** прямая кухня — BASE / MID (НШ1) / TOP (НШ2) / пенал / project depth  
**Вне scope:** L/U, Joint, Brain, WallRun, rhythm, autosave, UI-каталог

---

## 0. Вердикт одной фразой

Канон глубин и parametric rebuild для НМ / пенала / НШ1 / НШ2 **уже заложены** в коде; «глубина низов» и карандаш модуля идут без `scale`. Полная совместная работа на живой прямой кухне **не подтверждена сценой** в этом запуске. Главный риск по коду: смена **столешницы (Dwt)** перестраивает только НМ, **не** пенал / deep-TOP.

---

## 1. Канон глубин (из кода проекта)

Источник: `js/kitchen/kitchen-depth-stack.js` (шапка), `js/kitchen/kitchen-manufacturing-profile.js`.

| Символ | Значение | Роль |
|--------|----------|------|
| Dwt | project `worktopDepthMm`, дефолт **600** | глубина столешницы |
| front setback | **40** мм | торец столешки → перед корпуса НМ |
| rear min | **≥ 10** мм | стена → зад корпуса НМ |
| Прессеты низов UI | **460 / 510 / 550** | `kitchen-step3-setup` → project |
| Max корпус НМ | Dwt − 40 − 10 (= **550** при 600) | `resolveBaseCarcassDepthMm` |
| Пенал D | обычно **Dwt − 40** (= **560** при 600) | `resolveTallCarcassDepthMm`; rear=0 |
| НШ1 D | дефолт ~**350**, карандаш **200…450** | profile wall + `rebuildWallMid…` |
| НШ2 | shallow ~350 / deep ≈ пенал (Dwt−40) / custom+lock | `resolveKitchenWallTopDepthMm` + stamps |

### Геометрия прямой стены (`back`, W = пивот секции)

```
стена W ──[rear]── зад НМ ──[D]── перед НМ ═══ 560 (= W+Dwt−40) ──[+40]── торец столешки
стена W ──[0]──── пенал D=560 ────────────────── перед ═══════════ та же 560
стена W ──[0]──── НШ1 D≈350 ───────────────────── перед ближе к стене
```

**Правило:** смена D корпуса НМ **не двигает перед** ряда — меняется только зазор сзади (`rear = Dwt − 40 − D`).  
Пенал выравнивается по **тому же переду**, стоя вплотную к стене (не через стек 10+корпус+40).

---

## 2. Карта механизмов

| Слой | Resolve D | Rebuild (parametric) | Посадка (плоскость) | UI |
|------|-----------|----------------------|---------------------|-----|
| НМ BASE | `resolveBaseCarcassDepthMm` | `rebuildForCellDepthMm` | `enforce…OnModule` (якорь **перед**) | карандаш; «Глубина низов» 460/510/550 |
| Пенал | `resolveTallCarcassDepthMm` | `rebuildTallForCellDepthMm` | flush **зад=W**; sync TOP в зоне | карандаш «Глубина пенала» |
| НШ1 MID | profile / custom | `rebuildWallMidForCellDepthMm` | `alignBackToWall` | карандаш модуля |
| НШ2 TOP | shallow/deep/custom | `rebuildWallTopForCellDepthMm` | back; deep ← tall sync | карандаш → custom+lock |
| Project низы | `setProjectBaseCarcassDepthMm` | `applyProjectDepthToScene` → **только НМ** | потом `enforceDepthAll` | step3 manage |
| Столешка ряда | `set` Dwt | `applyWorktopDepthOnWall` → **только НМ** | enforce / overlays | карандаш столешки / project |

Файлы:

- `js/kitchen/kitchen-depth-stack.js` — стек + enforce  
- `js/kitchen/kitchen-manufacturing-profile.js` — формулы 40/10, tall, presets  
- `js/kitchen/kitchen-base-engine.js` — rebuild* / applyProject* / applyWorktop* / sync TOP←tall  
- `js/ui/scene-icons.js` — `applyModuleDepthCm` ветки tall/base/mid/top (+ legacy **scale** для не-кухни)  
- `js/ui/kitchen-step3-setup.js` — пресеты 460/510/550  

Связанные отчёты: `CLODIS-KITCHEN-WALL-DEPTH-FIX-RESULT.md`, `CLODIS-KITCHEN-DEPTH-OFFSETS-VERIFICATION.md`.

---

## 3. Что уже работает (по коду)

1. **Канон стека НМ** (перед фиксирован, D → rear) — согласован в depth-stack + manufacturing.  
2. **Карандаш НМ** → `rebuildForCellDepthMm` (не scale), `followCorner: false` на прямой.  
3. **Карандаш пенала** → `rebuildTallForCellDepthMm` + `alignBackToWall` + `syncKitchenWallTopDepthFromTallInZone`.  
4. **Карандаш НШ1/НШ2** → отдельные rebuild mid/top (этап walldepth1), без scale в этих ветках.  
5. **Глобальные низы 460/510/550** → project + rebuild всех НМ + enforce.  
6. **Явный запрет** гнать пенал через `resolveBaseCarcassDepthMm` (max 550 / rear 10).  
7. После tall rebuild TOP без lock может уйти в **deep**.

---

## 4. Что отсутствует / рискованно (по коду)

| # | Проблема | Подтверждение |
|---|----------|---------------|
| R1 | `applyProjectDepthToScene` / `applyWorktopDepthOnWall` обходят **только** `isKitchenNmCarcassGroup` — пенал и НШ **не** перестраиваются | `kitchen-base-engine.js` traverse filters |
| R2 | При смене **Dwt** линия переда НМ = Dwt−40 меняется; пенал остаётся со старым D → **разъезд переда** пенал vs НМ | следствие R1 + `resolveTallCarcassDepthMm` |
| R3 | `enforceKitchenDepthStackOnAllModules` собирает `isKitchenBaseGroup` на стене — **не** гарантирует enforce пенал/НШ после project depth | `kitchen-depth-stack.js` `collectKitchenBasesOnWall` |
| R4 | Смена только корпуса 550→460 **не** ломает выравнивание пенала (перед остаётся 560) — это **ок по канону**, не баг | формула стека |
| R5 | Хвост `applyModuleDepthCm` — **uniform scale** для нераспознанных типов (шкаф в нише) | `scene-icons.js` ~4370+ |
| R6 | TOP `userLocked` / custom после карандаша больше не наследует deep от пенала | задокументировано walldepth-fix |
| R7 | Live e2e прямой кухни (bbox / scale=1 / стык пенал–НМ) в этом аудите **не гонялся** | — |

---

## 5. Пеналы vs низы (сверка с каноном)

| Вопрос | Ответ кода |
|--------|------------|
| Согласование переда с НМ | Да: tall D ≈ Dwt−40, rear=0 → перед = перед НМ при каноне |
| Без scale | Да: `rebuildFurnitureGroupForSectionResize` + stamps |
| Сдвиг от стены/пола при depth pencil | Зад к стене через `alignBackToWall`; W/H сохраняются `_preserveWyMm` |
| Реакция на «глубина низов» 460/510/550 | Пенал **не** rebuild (и не должен для D низов — перед ряда стабилен) |
| Реакция на смену столешницы | **Дыра:** пенал не обновляется (R1/R2) |

---

## 6. НШ1 / НШ2

| | НШ1 | НШ2 |
|--|-----|-----|
| Привязка | зад к стене | зад к стене |
| Связь с project | дефолт ~350 из profile; не стек НМ | shallow/deep/custom; deep ≈ tall |
| Parametric | `rebuildWallMidForCellDepthMm` | `rebuildWallTopForCellDepthMm` |
| Пересечения с пеналом | cohabit zone; глубина независимо (shallow) или deep как пенал | sync from tall если не locked |

Правила **не выдумывать** — уже в manufacturing + base-engine + depth-stack.

---

## 7. Совместная работа (ожидание по коду)

| Действие | НМ | Пенал | НШ1 | НШ2 |
|----------|----|-------|-----|-----|
| Project D низов 550→460 | rebuild Z, перед тот же | без rebuild; перед ок | без изменений | без (если не deep-sync) |
| Карандаш D одного НМ | только этот | нет | нет | нет |
| Карандаш пенала | нет | rebuild + sync TOP | нет | deep sync если !lock |
| Смена Dwt столешки | rebuild все НМ | **не обновлён** | нет | deep может устареть |
| Scale | нет (ветка кухни) | нет | нет | нет |

Ширина/высота при depth rebuild: сохраняются через `_preserveWyMm` / cell stamps (код).

---

## 8. Выводы

### Уже работает

- Канон Dwt / 40 / 10 / пресеты 460·510·550 / пенал Dwt−40.  
- Parametric depth UI для НМ, пенала, НШ1, НШ2.  
- Глобальные низы обновляют стоящие НМ.  
- Выравнивание пенала с передом НМ при неизменной Dwt.

### Требует исправления (кандидат минимального патча)

**Только если подтвердится на сцене при смене столешницы:** после `applyWorktopDepthOnWall` (и при необходимости связанного project Dwt) — пересчитать пеналы через `rebuildTallForCellDepthMm` / `resolveTallCarcassDepthMm` и sync TOP deep в тех же зонах; без touch L/Joint/Brain.

Смена **только** 460/510/550 при фиксированной Dwt=600 по канону **не** требует rebuild пенала.

### Невозможно подтвердить без браузера

- Фактический `group.scale ≈ (1,1,1)` после карандашей.  
- Визуальный стык перед пенал ↔ НМ / НШ2 deep.  
- Отсутствие щели у стены у пенала после project depth.  
- Регресс фасадов/полок/крепежа после rebuild.  
- Пересечения ярусов на живом пироге.

### Минимальный следующий патч (после задания)

1. Ручной чеклист прямой кухни: низы 550↔460; карандаш НМ/пенал/НШ1/НШ2; **смена Dwt** (если UI доступен).  
2. Если R2 подтверждён: узкий хук после `applyWorktopDepthOnWall` — tall + TOP sync, без рефактора стека.  
3. Не трогать L/autosave/rhythm.

---

## 9. СТОП

Исправлений в этом запуске нет. Ждать следующего задания.
