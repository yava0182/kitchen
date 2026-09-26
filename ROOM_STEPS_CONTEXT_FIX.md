# Уникальный контекст при переключении шагов

Чтобы при смене шага не подставлялись данные другого шага, в `admin-new.html` нужно сделать **3 правки**.

---

## Правка 1. Функция `saveCurrentStepToConfig` (около строки 13210)

**Было:**
```javascript
    function saveCurrentStepToConfig() {
      var config = getRoomStepsConfig();
      var stepId = getCurrentStepId();
      var step = config.steps.find(function(s) { return s.stepId === stepId; });
```

**Стало:**
```javascript
    function saveCurrentStepToConfig(stepIdToSave) {
      var config = getRoomStepsConfig();
      var stepId = (stepIdToSave !== undefined && stepIdToSave !== null) ? stepIdToSave : getCurrentStepId();
      var step = config.steps.find(function(s) { return s.stepId === stepId; });
```

---

## Правка 2. Обработчик смены шага (около строк 13261–13267)

**Было:**
```javascript
        selectEl.value = '1';
        selectEl.addEventListener('change', function() {
          var config = saveCurrentStepToConfig();
          saveRoomStepsConfig(config);
          renderStepPanel(parseInt(selectEl.value, 10) || 1);
          renderRoomStepsSummary();
        });
```

**Стало:**
```javascript
        selectEl.value = '1';
        selectEl.dataset.currentStepId = '1';
        selectEl.addEventListener('change', function() {
          var previousStepId = parseInt(selectEl.dataset.currentStepId, 10) || 1;
          var config = saveCurrentStepToConfig(previousStepId);
          saveRoomStepsConfig(config);
          var newStepId = parseInt(selectEl.value, 10) || 1;
          selectEl.dataset.currentStepId = String(newStepId);
          renderStepPanel(newStepId).then(function() { renderRoomStepsSummary(); });
          renderRoomStepsSummary();
        });
```

---

## Правка 3. В конце функции `renderStepPanel` (сразу после `if (items.length > 0) await loadCategoriesIntoStepItems(...)`)

**Добавить перед закрывающей `}` функции `renderStepPanel`:**
```javascript
      var sel = document.getElementById('room-step-select');
      if (sel) sel.dataset.currentStepId = String(stepId);
```

То есть после строки:
```javascript
      if (items.length > 0) await loadCategoriesIntoStepItems(container, items);
```
должны идти две новые строки выше, затем `}`.

---

## Что это даёт

- При переключении с шага 1 на шаг 2 форма сохраняется **в шаг 1** (тот, с которого уходим), а не в шаг 2.
- Затем подставляются **только данные выбранного шага** (название, сетка, пункты).
- У каждого шага остаётся свой контекст и настройки, без повторения и смешивания.

Откройте `admin-new.html` в редакторе и замените указанные фрагменты на «Стало» / добавьте блок из правки 3.
