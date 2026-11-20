STEP 3A-UI rollback — temporary «Тест боковин» panel
- Restore js__main-refactored.js → js/main-refactored.js
- Restore index.html (bust)
- Delete js/ui/kitchen-side-panels-test-ui.js
Does NOT touch overlay geometry/API (step 3A).
Does NOT touch draft / autosave.
Access fix: permanent «Боковины» button + panel with NM picker.
Cause of previous miss: panel was display:none until state.selectedFurniture.
