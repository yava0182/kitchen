# CLODIS — аудит индивидуального удаления и редактирования кухонных модулей

**Дата:** 2026-10-30  
**Режим:** только аудит (код не менялся)  
**Симптом:** удалили НМ → НШ1/НШ2 остаются на сцене, их карандаши исчезают.

---

## 1. Вердикт

| Вопрос | Ответ |
|--------|--------|
| Удаляется ли только выбранный `furnitureGroup`? | **Да** (меш/группа одного модуля). Ячейка WallRun / `division` / соседние группы не удаляются. |
| Почему пропадают карандаши НШ1/НШ2? | После delete вызывается `removeSectionZoneEditIcon(sectionId, zoneIndex)` **без** `furnitureUuid` → снимаются **все** карандаши зоны. Пересборки карандашей для оставшихся модулей **нет**. |
| Связаны ли карандаши нескольких модулей? | Да: ключ хранения/удаления часто `sectionId + zoneIndex`. В одной ячейке (пирог base/mid/top) у НМ+НШ1+НШ2 **один** `zoneIndex`, разные `furnitureUuid`. API uuid уже есть, вызовы delete его не передают. |
| `furniture_delete` / автосейв? | Только путь `deleteSelectedFurniture` → `__cldMarkRoomDraftDirty('furniture_delete')`. Delete из попапа карандаша — **отдельный** код, dirty **не** ставит. |
| Можно ли независимо удалить НШ1/НШ2? | **Меш** — да, если открыть *их* карандаш. После удаления НМ карандаши верхних уже сняты → через UI продолжить нельзя. |

---

## 2. Фактическая архитектура

### 2.1 Модуль vs ячейка

- Каждый шкаф = отдельный `THREE.Group` с `userData.isFurniture`, `sectionId`, `zoneIndex`, `__placementKind` / `__placementKindProfileId`.
- Кухонный пирог в **одной** ячейке WallRun/`division`:
  - НМ / НМУ → `zoneSlotRole: base`, `cohabitGroup: kitchen_column`
  - НШ1 → `kitchen_wall_mid`, role `mid`
  - НШ2 → `kitchen_wall_top`, role `top`
- Совместность: `js/placement-kind-profiles.js` (`canCohabitInSameZone` / `kitchen_column`). Ячейка размещает несколько групп с **одинаковым** `zoneIndex`; это не один Object3D.

### 2.2 Карандаш

Файл: `js/ui/scene-icons.js`.

| Функция | Поведение |
|---------|-----------|
| `createSectionZoneEditIcon(sectionId, zoneIndex, pos, furnitureGroup)` | Пишет `userData.furnitureGroup` + `furnitureUuid`. При создании с группой снимает только иконку **этого** uuid в зоне. |
| `rebuildSectionZoneEditIconsForSection(sectionId)` | Сносит все карандаши секции → traverse сцены → **по одному карандашу на каждый** `isFurniture` в секции (в т.ч. несколько на один `zoneIndex`). |
| `removeSectionZoneEditIcon(sectionId, zoneIndex, furnitureUuid?)` | Без uuid — удаляет **все** иконки зоны. С uuid — только совпадающий модуль (задумано под пару base+upper). |

Клик передаёт `furnitureGroup` с иконки → `handleSectionZoneEditClick` → `findFurnitureInZone` предпочитает uuid карандаша (не «первый в зоне»).

### 2.3 Два пути удаления

#### A. Кнопка «удалить мебель» / `deleteSelectedFurniture`

`js/furniture/furniture-actions.js` → `js/furniture/furniture-manager.js` ~9490+.

1. Цель: `state.selectedFurniture || state.furniture` → один `grp`.
2. `removeSectionZoneEditIcon(deletedSectionId, deletedZoneIndex)` — **без uuid**.
3. `grp.parent.remove(grp)` + dispose.
4. Transitions, labels, cell volumes…
5. `__cldMarkRoomDraftDirty('furniture_delete')`.
6. **Нет** `rebuildSectionZoneEditIconsForSection`.

Контраст: жест-замена `removeFurnitureGroupQuietForGesture` (~8962) передаёт **`grp.uuid`** и после жеста дергает rebuild секции.

#### B. Delete в модалке карандаша («Настройка модуля»)

`js/ui/scene-icons.js` ~6312–6363 (`delBtn.onclick`).

1. `findFurnitureInZone(sec)` — обычно правильный модуль с карандаша.
2. `removeSectionZoneEditIcon(sectionId, zoneIndex)` — **снова без uuid**.
3. Сцена: `remove` + dispose только `targetFurniture`.
4. `rebuildAllTransitions` (если есть).
5. **Нет** dirty / `furniture_delete`.
6. **Нет** rebuild карандашей.
7. Не вызывает `deleteSelectedFurniture` (дублирующий/урезанный путь).

---

## 3. Причина исчезновения карандашей (точная)

Сценарий: в зоне `zi` стоят НМ + НШ1 + НШ2 → 3 карандаша, один `zoneIndex`.

1. Пользователь удаляет НМ (путь A или B).
2. Снимается группа НМ — НШ остаются.
3. `removeSectionZoneEditIcon(sec, zi)` без uuid → в `sectionZoneEditIcons` удаляются иконки НМ **и** НШ1/НШ2.
4. Rebuild не вызывается → верхние без UI-якорей, хотя Object3D на месте.

Это **не** WallRun, не Kitchen Brain, не «склейка» мешей. Это рассинхрон API карандаша (uuid) и вызовов delete + отсутствие rebuild.

Дополнительно: `syncSectionZoneEditIconsActive` подсвечивает по `sectionId+zoneIndex` без uuid (косметика).

---

## 4. UI после удаления

| Шаг | A `deleteSelectedFurniture` | B popup delete |
|-----|-----------------------------|----------------|
| Карандаш зоны | wipe всей зоны | wipe всей зоны |
| Rebuild карандашей | нет | нет |
| Focus fog | clear | clear |
| Transitions | да | да (частично) |
| Цена / catalog labels | да | нет |
| Step4 section icons | условно | нет |
| Dirty `furniture_delete` | да | **нет** |

Автосейв пустой кухни (Stage9) реагирует на dirty reason `furniture_delete` — только путь A. Popup delete сцену меняет, draft может отстать до другого dirty.

---

## 5. Независимость НШ1 / НШ2

- Place/cohabit: да, отдельные группы, общий `zoneIndex`.
- Edit с карандаша: да, пока иконка жива (`furnitureGroup` / uuid).
- Delete меша: да, один group.
- После delete соседа в той же зоне: карандаши зоны снесены → индивидуальный edit/delete через карандаш **ломается**, пока нет rebuild/ручного selection.

`__findFurnitureGroupForZone` без uuid берёт **первого** в traverse — опасно для fallback без привязки к карандашу.

---

## 6. Связанные файлы

| Файл | Роль |
|------|------|
| `js/ui/scene-icons.js` | Карандаши, modal delete, `findFurnitureInZone`, rebuild |
| `js/furniture/furniture-manager.js` | `deleteSelectedFurniture`, quiet-remove (правильный uuid), place/rebuild |
| `js/furniture/furniture-actions.js` | Кнопка delete → selected |
| `js/placement-kind-profiles.js` | mid/top/base, `kitchen_column` |
| `js/room/room-draft-autosave.js` | dirty `furniture_delete` / empty overwrite |
| `js/furniture/ikea-room-fixture.js` | collect/restore furniture |
| `js/ui/cabinet-markers.js` | линии зон (не карандаши модулей) |

**Не причина бага:** WallRun / ClodisBuilder / Brain / rhythm / depths / CFRN (в рамках этого симптома).

---

## 7. Минимальный план исправления (без реализации)

1. **Один delete-путь:** popup delete → `deleteSelectedFurniture` (или общий helper), не копипаст `scene.remove`.
2. Везде: `removeSectionZoneEditIcon(sectionId, zoneIndex, grp.uuid)` — как в `removeFurnitureGroupQuietForGesture`.
3. После delete модуля: `rebuildSectionZoneEditIconsForSection(sectionId)` (или оставить только uuid-remove, если rebuild дорогой — но rebuild уже канон после place/gesture).
4. Popup delete обязан давать тот же dirty `furniture_delete`, что и selected-delete.
5. Регрессия: зона с НМ+НШ1+НШ2 → удалить НМ → карандаши НШ1/НШ2 на месте → удалить НШ1 → НШ2 и его карандаш живы; draft dirty после каждого.

**Не трогать** в фиксе: Kitchen Brain, WallRun, ClodisBuilder, геометрию, rhythm, высоты/глубины, вторую систему сохранения, CFRN.

---

## 8. Чеклист приёмки будущего фикса

- [ ] Удалили НМ → НШ1 и НШ2 на сцене + оба карандаша видны.
- [ ] Удалили НШ1 → НМ и НШ2 и их карандаши на месте.
- [ ] Delete из попапа карандаша пишет dirty / автосейв как selected-delete.
- [ ] В LS/fixture после F5 остаются только неудалённые модули.
