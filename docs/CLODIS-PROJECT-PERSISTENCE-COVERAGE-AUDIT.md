# CLODIS — этап 4. Аудит полноты автосохранения

**Дата:** 2026-10-30  
**Режим:** только аудит (код не менялся)  
**База:** Stage2 `ikea-room-fixture` + Stage3 `room-draft-autosave` (`clodis_room_draft_v2`)  
**Bust на момент аудита:** `20261030-autosave1`

### Легенда статусов

| Метка | Смысл |
|-------|--------|
| **код** | Подтверждено чтением кода |
| **smoke** | Проверено агентом в Stage3 (модалка / New→prev), не полный e2e кухни |
| **ручной** | Нужен прогон человеком на реальной кухне |
| **частично** | Есть collect и/или dirty, но дыра в restore или в хуке |
| **нет** | Нет dirty и/или нет сериализации / restore |

---

## 1. Сводная таблица покрытия

**Действие → Где реализовано → Dirty-хук → Что сериализуется → Что восстанавливается → Риск → Рекомендация**

| Действие | Где | Dirty | Сериализация | Restore | Риск | Рекомендация | Статус |
|----------|-----|-------|--------------|---------|------|--------------|--------|
| Размеры комнаты W/D/H | `room-manager.updateRoomDimensions` | `room_dimensions` | `room` + shape/footprint/interior | `updateRoomDimensions` / skip if same | Низкий | — | **код** |
| Форма комнаты (shape) без resize | `recreateRoomWithShape` / `applyKitchenRoomShapeToRoom` | **нет** | `kitchenRoomShapeKey`, footprint | apply при restore room | Средний: смена формы не autosave | dirty в конце `recreateRoomWithShape` | **код / нет хука** |
| Окно/дверь — добавить | `room-edit-openings` place | `opening_window` / `opening_door` | `openings[]` | `reapplyRoomEditOpenings` | Низкий | — | **код** |
| Окно/дверь — удалить | openings `onEditorDelete` | `opening_delete` | да | да | Низкий | — | **код** |
| Окно/дверь — сдвиг/resize/редактор | drag/applyToRoom, editor apply | **нет** | данные в state → попадут при следующем dirty | да, если сохранили | Средний: правка без другого dirty | dirty на mouseup resize/drag end и editor Apply | **код / нет хука** |
| Коммуникации — place/delete | `room-edit-objects` | `room_object_place` / `_delete` | `roomEditObjects[]` | `__cldReapplyRoomEditObjects` | Низкий | — | **код** |
| Коммуникации — drag/resize/dims | objects drag/resize/dim edit | **нет** | то же | то же | Средний | dirty на конец drag/resize | **код / нет хука** |
| Секция — создать | `createSectionAtPosition` return | `section_create` | sections size/pos/wall/division/… | create + division + bands | Низкий для прямой | — | **код** |
| Секция — clear all | `clearAllCustomSections` | `sections_clear` | сцена пустеет | — | empty-guard не даст затереть draft пустым | ок | **код** |
| Секция — удалить одну | нет явного export delete + dirty | **нет** | — | — | Высокий, если UI умеет удалять одну | найти delete path + dirty | **код / нет** |
| Ширина ячеек | `setZoneCustomWidthMm` | `zone_width` | `division.customZoneWidthsMm` + `kitchenBandGrids` | setParts + widths + applyBandGrids | Низкий | — | **код** |
| Ширина модуля (карандаш → zone) | `applyModuleWidthCm` → setZone… | косвенно `zone_width` | да | да | Низкий | — | **код** |
| Модуль — place | `placePendingFurniture` end | `furniture_place` | furniture stamp + clodis* | Furniture ctor + pos | Низкий | — | **код** / **ручной** e2e |
| Модуль — delete | `deleteSelectedFurniture` | `furniture_delete` | да | да | Низкий | — | **код** |
| Модуль — drag вдоль стены | `finishFurnitureDragFromCanvas` (`camera.js`) | **нет** | position в collect | position set | **Высокий**: позиция не autosave | dirty в конце drag | **код / нет хука** |
| Глубина НМ | `applyModuleDepthCm` base | `module_depth_base` | customDepth + vars/clodis + stamps | ud + rebuild из roots | Средний: rebuild mid-flight | debounce 1.5s помогает | **код** / **ручной** |
| Глубина НШ1 MID | wall_mid branch | `module_depth_wall_mid` | top/carcass stamps + customDepth | да | Средний | — | **код** / **ручной** |
| Глубина НШ2 TOP | wall_top branch | `module_depth_wall_top` | mode/custom/locked | да | Средний | — | **код** / **ручной** |
| Глубина пенал (tall) | tall branch | `module_depth_tall` | customDepth + clodis | да | Средний | — | **код** / **ручной** |
| Глубина ВМУ / wall_corner | isWallCorner → fallback scale | **нет** dirty на scale path | customDepthMm если выставили | customDepth + scale | Высокий для угла | dirty + явный wall_corner rebuild path | **код / частично** |
| Глубина столешки ряда | `applyKitchenWorktopDepthCm` | **нет** | через kitchenProject / модули после apply | hydrate + stamps | Средний | dirty после worktop apply | **код / нет хука** |
| Высота модуля | `applyModuleHeightCm` / standalone height | **нет** | `customHeightMm` + clodis vars | ud set, без обязательного height rebuild API | Средний–высокий | dirty + проверить restore height | **код / нет хука** |
| Материалы / декор step5 | `persistStep5ModuleDecorForGroup` | `step5_decor` | step5 outside/inside/end | ud + dynamic applyStep5 | Средний (async textures) | **ручной** после reload | **код** / **ручной** |
| Двери / zoneHand | `__clodisApplyModuleZoneHand` UI | **нет** | `doorLayout`, `zoneHand` | в Furniture params | Средний | dirty после hand apply | **код / нет хука** |
| Петли / крепёж / CFRN схемы | ClodisBuilder / drill registry | **нет** отдельного | частично внутри `clodisRoots`/`clodisData` если уже в дереве | rebuild из roots | Высокий для «ручных» правок фурнитуры вне roots | не трогать ядро; при смене схем — dirty на UI exit | **код / частично** |
| Полки / ящики policy | ud policies | нет отдельного dirty | `drawerStackPolicy`, `shelfStackPolicy` | ud restore | Низкий если меняются только через place | dirty при смене policy UI | **код / частично** |
| `kitchenProject` (система/опоры) | manufacturing profile | **нет** dirty | `getKitchenProjectForSave` | hydrate | Средний | dirty при смене профиля кухни | **код / нет хука** |
| L-секции / Joint | corner-joint / kitchen-joint | только если сработало section_create | `lShape`, `kitchenJoints` | **metadata only**, без seat | **Высокий** для угла | согласовать seat/recreate (ядро) | **код / частично** Stage2 |
| BASE/MID/TOP grids | layout + setZone | `zone_width` / section_create | `serializeKitchenBandZoneGrids` | `applyKitchenBandZoneGrids` | Низкий для прямых | **ручной** MID/TOP независимость | **код** / **ручной** |
| Offsets секции / filler | collect offsets | нет отдельного (только create) | offsets/filler | assign на sectionData, без updateSectionSize | Средний | dirty при правке offsets + soft apply | **код / частично** |
| Камера / step | collect | нет (косвенно при других dirty) | camera, step | goToStep + camera | Низкий | optional dirty на step change | **код** |
| «Начать новый» | autosave `onNewProject` | n/a | prev slot | clear scene | Низкий при verify prev | — | **код** + **smoke** |
| Autosave на boot/пустая сцена | phase + empty guard | blocked | — | — | Низкий | — | **код** + **smoke** |

---

## 2. Восстановление по типам модулей (**код**)

| Тип | Collect stamps | Restore | Ограничение |
|-----|----------------|---------|-------------|
| НМ | placementKind, customDepth, offsets, clodis*, kitchenProject | Furniture + ud + pos | Без enforce depth после restore (намеренно Stage2) — **ручной** визуал vs bbox |
| НШ1 / НШ2 | mode/custom/locked, carcassDepth, profileId | ud stamps; геометрия из clodisRoots | **ручной** custom depth |
| Пенал | tall path stamps + customDepth | как furniture | **ручной** |
| НМУ / ВМУ / wall_corner | lShape + joints + furniture | lShape/joints **без** `seatKitchenJointCorner` | Угол может быть визуально/ячейками неполным — **частично** |
| L-соединения | kitchenJoints remap uuid | metadata | Нужно согласование ядра для полного seat |
| Сетки BASE/MID/TOP | kitchenBandGrids | applyKitchenBandZoneGrids | **ручной** независимые правки |
| Ячейка / zoneIndex | sectionId, zoneIndex, position | remap sectionId + zoneIndex + world pos | Drag без dirty → устаревший pos в draft |
| Крепёж / петли | в clodis snapshot если в дереве | rebuild | Отдельные UI-правки схем без обновления roots — риск рассинхрона с БАЗИС |
| Материалы | step5* | applyStep5 dynamic | **ручной** текстуры |
| Индивид. размеры | custom W/H/D + vars | ud; H без гарантированного rebuild | высота — пробел dirty |

---

## 3. Архитектурные риски (**код**)

### 3.1 Промежуточные состояния rebuild

- Dirty вешается **после** успешного depth rebuild (НМ/НШ/пенал), не на каждый кадр — хорошо.
- Debounce 1.5 s: если юзер крутит карандаш, в LS уйдёт **последнее** стабильное состояние после паузы — ок.
- Риск: dirty **во время** длинного place-post (редко) — place dirty в самом конце `__placeDone` — ок.
- Риск: worktop/height/hand без dirty → LS устаревает, пока не сработает другой хук.

### 3.2 Пропущенные dirty-хуки (приоритет)

1. **P0** — конец drag мебели (`finishFurnitureDragFromCanvas` / `camera.js`).  
2. **P0** — высота модуля (`applyModuleHeightCm` / tryApply height).  
3. **P1** — форма комнаты `recreateRoomWithShape`.  
4. **P1** — opening drag/resize/editor apply; object drag/resize.  
5. **P1** — zoneHand / двери; worktop depth.  
6. **P2** — wall_corner depth path; kitchenProject UI; одиночное удаление секции; step change.

### 3.3 Повторное сохранение / потери параметров

- Повторный `saveRoomDraft` = полный collect сцены: не «мержит» частично — если параметр не в collect, он не появится.
- Empty overwrite blocked защищает от пустого collect.
- Параметры только в runtime (не в ud/clodis) теряются всегда.

### 3.4 Визуал vs БАЗИС

- Draft = clodisRoots/Data/Variables + stamps. CFRN/БАЗИС читают дерево после rebuild.
- Если UI меняет петли/сверловку **без** обновления clodisRoots, draft и БАЗИС разойдутся — **частично**, ядро не трогаем в рамках persistence.
- Restore **не** вызывает enforce depth / place snap — визуал может чуть отличаться от «живого» place; для паритета нужен **ручной** чеклист, не авто-enforce (может сдвинуть сохранённое).

### 3.5 Новый проект vs предыдущий

- New: verify write `clodis_room_draft_prev_v2` → remove current → clear scene (**smoke** Stage3).  
- Autosave пустого не затирает non-empty (**код**).  
- Prev один слот: второй New перезапишет prev — ожидаемо для Stage3.

### 3.6 Переполнение localStorage

- `saveRoomDraft` / prev ловят exception → `storage_error`, toast «Не удалось сохранить» (**код**).  
- Нет fallback IndexedDB / обрезки clodisRoots — крупная кухня может не сохраниться.  
- Рекомендация (позже): IndexedDB mirror или сжатие; не в рамках этого аудита.

### 3.7 Debounce vs уход со страницы

- `pagehide` / `visibilitychange` → silent flush если dirty (**код**).  
- Если phase ≠ editing — flush не пишет (модалка) — ок.

---

## 4. Что подтверждено / что нет

| Категория | Пункты |
|-----------|--------|
| **Подтверждено кодом** | Список dirty в §1; collect/restore поля fixture; phase gate; empty/prev/storage_error |
| **Smoke Stage3** | Модалка при draft; New → prev; без draft → editing |
| **Требует ручной проверки** | Полный цикл кухня→autosave→reload→Continue; НШ1/НШ2 custom; декор; L/НМУ; MID≠BASE; БАЗИС после restore |
| **Отсутствует / частично** | Drag мебели; высота; shape; opening/object edit; zoneHand; worktop; wall_corner dirty; L seat restore; одиночный delete секции |

---

## 5. Минимальные исправления (приоритет, без реализации сейчас)

1. **P0** `markRoomDraftDirty('furniture_drag')` в конце успешного drag.  
2. **P0** dirty после успешной высоты модуля.  
3. **P1** dirty: `recreateRoomWithShape`, opening move/resize end, object move/resize end, zoneHand, worktop depth.  
4. **P1** dirty на scale/fallback depth (в т.ч. wall_corner), если нет отдельного rebuild.  
5. **P2** dirty при смене `kitchenProject` / шага wizard.  
6. **Отдельно согласовать** (ядро, не silently): полный restore L/НМУ через seat Joint — иначе угол останется metadata-only.  
7. **P2 ops**: IndexedDB / обработка Quota с понятным UX.

Не предлагать вторую сериализацию и не трогать ClodisBuilder / Brain / WallRun / depth engines в этих патчах — только хуки + при согласовании restore угла.

---

## 6. Критерии ручного приёмочного прогона (после патчей или сейчас)

1. Place НМ+НШ → статус сохранён → F5 → Continue → те же D и stamps.  
2. Drag шкафа → wait 2s → F5 → позиция.  
3. Высота / hand / worktop → F5.  
4. Окно сдвинуть → F5.  
5. L/НМУ → Continue → стык/ячейка (ожидать fail без seat).  
6. New → prev inspect → RestorePrev.  
7. DevTools → Application → заполнить LS → убедиться в error toast, не «сохранён».

---

*Конец аудита этапа 4. Код не изменялся.*
