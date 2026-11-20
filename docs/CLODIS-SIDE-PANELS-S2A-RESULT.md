# CLODIS — SIDE PANELS S2A. Результат

Эксперимент: параметрическая **накладная** боковина левой стороны прямого пенала.  
Конструкционная боковина / присадка / админка UI — **не делались** (СТОП после S2A).

Дата: 2026-10-31.

---

## 1. Preflight / изоляция

| Проверка | Результат |
|----------|-----------|
| Git CLI | недоступен в PATH — коммит/ветка недоступны |
| DEPTH-4 (`depth4b`) | файлы `kitchen-base-engine` / `kitchen-depth-stack` / `scene-icons` **не изменялись** |
| Точка отката S2A | `.s2a-rollback/clodis-build-contract.js`, `.s2a-rollback/furniture-manager.js` |
| Новый файл | `js/kitchen/kitchen-side-panels.js` — откат = удалить файл + вернуть rollback-копии |

Безопасная изоляция: да (только contract + furniture-manager + новый модуль + main import + docs/scripts).

---

## 2. Изменённые файлы

| Файл | Изменение |
|------|-----------|
| `js/kitchen/kitchen-side-panels.js` | **новый** — normalize / depth / buildWall-узел / inject / test API |
| `js/clodis/clodis-build-contract.js` | после prepare → `applySidePanelsToPreparedRoots`; contract `20261031-s2a` |
| `js/furniture/furniture-manager.js` | place/rebuild передают `sidePanels`, `carcassDepthMm`, `rearOffsetMm` с инстанса |
| `js/main-refactored.js` | import side-panels + bust contract |
| `scripts/check-side-panels-s2a.mjs` | **новый** статический тест |
| `docs/CLODIS-SIDE-PANELS-S2A-RESULT.md` | этот отчёт |

**Не трогались:** DEPTH-3/4 ядро, SideTrim, EndCabinet, Joint, админка HTML, catalog_47/48, полки/дно/крыша/задник.

---

## 3. Поведение

Инстанс пенала:

```js
group.userData.sidePanels = {
  left:  { mode: 'overlay', depthMode: 'to_wall', jointPolicy: 'none' },
  right: { mode: 'normal' },
};
```

При `prepareKitchenModuleForBuild` (place/rebuild):

- в корень дерева (рядом с «Корпус пенала») добавляется отдельный `type:wall`, `id: cld_side_overlay_left`, `layout_role: side_overlay`;
- `size.z = carcassD + rearOffsetMm` (460+100 → **560**);
- `pos.z = −rearOffsetMm`, `pivot.z = −1` → перед накладки = перед корпуса, зад к стене;
- штатный бок / корпус / jointSchemes карточки **не меняются**;
- на накладке **нет** `jointSchemes` и children-крепежа;
- `scale` = 1; D корпуса и `rearOffsetMm` группы не увеличиваются «ради панели».

Правая сторона при `mode: 'normal'` — без inject.

---

## 4. Как включить / выключить (один пенал)

Глобального авто-включения нет. Только stamp на выбранном group + rebuild.

В консоли комнаты (пенал уже стоит, желательно D=460, `rearOffsetMm`=100):

```js
// вкл
__cldEnableTallLeftOverlayS2A(selectedTallGroup);

// выкл
__cldDisableTallSidePanelsS2A(selectedTallGroup);
```

Эквивалент:

```js
__cldKitchenSidePanels.setKitchenModuleSidePanels(group, {
  left: { mode: 'overlay', depthMode: 'to_wall', jointPolicy: 'none' },
  right: { mode: 'normal' },
});
```

API сам вызывает `rebuildTallForCellDepthMm` для этого group. Остальные модули не читают чужой `userData.sidePanels`.

Bust: перезагрузить комнату с актуальным `main-refactored.js` (query из `index.html`).

---

## 5. Тесты

### S2A static — PASS

```
node scripts/check-side-panels-s2a.mjs  → [S2A] PASS
```

Покрыто: отдельная деталь; depth 560; stock walls/corpus нетронуты; нет jointSchemes; нет double rearOffset; идемпотентность; DEPTH-файлы без S2A-патчей.

### DEPTH-4 — PASS

```
node scripts/check-straight-kitchen-depth4.mjs  → [DEPTH-4] PASS
```

### DEPTH-3 — частично (не регрессия S2A)

Все поведенческие проверки DEPTH-3 **OK**.  
Один FAIL: regex stamp ожидает `depth3`/`depth4`, фактически в дереве уже `20261030-depth4b` (после DEPTH-4b, **до** S2A). S2A engine не менял.

### Живой браузер

Не прогонялся в этой сессии → **визуальная проверка не объявляется успешной**.

---

## 6. Ограничения / конфликты (не маскировались)

1. **X за ячейку:** левая накладка с `pivot.x = +1` при `pos.x = 0` лежит **снаружи** штатного бока (−thickness…0). Толщина материала (обычно 16 мм g0) **не уменьшалась**. Возможен выход за ширину ячейки / касание соседа — зафиксировано; не чинилось.
2. Накладка — sibling корневой секции пенала, не child catalog_47; высота = формула корпуса (`s:y − h_bottom − h_top − tech`).
3. Присадка / seamLen / structural mode — вне S2A.
4. Админ-карточка / UI «Боковины» — нет.
5. Визуал в комнате — требует ручного прогона с `__cldEnableTallLeftOverlayS2A`.

---

## 7. Чеклист приёмки

- [ ] Static S2A PASS  
- [ ] DEPTH-4 PASS  
- [ ] На одном пенале: enable → в дереве/сцене отдельная деталь `side_overlay`, Z≈560 при D=460 offset=100  
- [ ] Disable снимает накладку; соседние модули / W ячейки без правок кода SideTrim/EndCabinet  
- [ ] Визуал: да/нет отдельно (здесь не закрыт)

---

## 8. СТОП

S2A завершён. Дальше без нового задания: не structural, не присадка, не админка, не другие модули.
