# -*- coding: utf-8 -*-
"""Inject catalog/models3d/fitting + r4 add handler into admin-new-main.js modal."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
main_path = ROOT / "js" / "admin" / "admin-new-main.js"
r4_path = ROOT / "js" / "admin" / "admin-new-bundle-r4.js"
main = main_path.read_text(encoding="utf-8")
r4 = r4_path.read_text(encoding="utf-8")

old_must = """          // Типы, для которых нужна сетка пресетов детали (кроме фасада — там сетка опциональна)
          const MUST_PICK_DETAIL_LAYOUT = new Set([
            'detail',
            'plinth',
            'wall',
            'countertop',
            'fitting',
            'cutout',
            'element',
            'model',
            'module',
            'animator',
            'size',
            'mouse_target',
            'information',
            'attachment_point',
          ]);"""
new_must = """          const MUST_PICK_DETAIL_LAYOUT = new Set([
            'detail',
            'plinth',
            'wall',
            'countertop',
            'cutout',
            'module',
            'size',
            'mouse_target',
            'information',
            'attachment_point',
          ]);"""
if old_must not in main:
    raise SystemExit("MUST_PICK block not found")
main = main.replace(old_must, new_must, 1)

needle = """            typeSelect.appendChild(opt);
          });

          const MUST_PICK_DETAIL_LAYOUT"""
repl = """            typeSelect.appendChild(opt);
          });
          try { window.__CLD_CATALOGS_DATA = {}; } catch (_) {}

          const MUST_PICK_DETAIL_LAYOUT"""
if needle not in main:
    raise SystemExit("appendChild needle not found")
main = main.replace(needle, repl, 1)

old_facade = """          // Блок выбора фасада
          const facadeContainer = document.getElementById('constructor-add-modal-facade-container');
          const facadeSelectedSpan = document.getElementById('constructor-add-modal-facade-selected');
          let selectedFacadeId = null;
          let selectedFacadeName = '';

          function setSelectedFacade(id, name) {
            selectedFacadeId = (id != null && id !== '') ? String(id) : null;
            selectedFacadeName = name || '';
            if (facadeSelectedSpan) {
              facadeSelectedSpan.textContent = selectedFacadeId
                ? (selectedFacadeId + ': ' + selectedFacadeName)
                : '';
            }
          }
          
          // Функция для отрисовки превью детали на canvas"""

s0 = r4.find("          // Блок выбора фасада\n          const facadeContainer")
s1 = r4.find("          // ========== /Каталог ==========\n\n", s0)
if s0 < 0 or s1 < 0:
    raise SystemExit("r4 facade/catalog slice not found")
s1_end = s1 + len("          // ========== /Каталог ==========\n\n")
facade_through_catalog = r4[s0:s1_end]
new_facade = facade_through_catalog + "          // Функция для отрисовки превью детали на canvas"
if old_facade not in main:
    raise SystemExit("old facade block not found")
main = main.replace(old_facade, new_facade, 1)

old_udg = """          // Функция для обновления сетки деталей
          function updateDetailGrid() {
            if (!detailGrid) return;
            
            detailGrid.innerHTML = '';

            const isFacade = typeSelect.value === 'facade';
            const showDetailGrid =
              isFacade || MUST_PICK_DETAIL_LAYOUT.has(typeSelect.value);

            // показать/скрыть блок "Фасад"
            if (facadeContainer) {
              facadeContainer.style.display = isFacade ? 'block' : 'none';
              if (!isFacade) {
                setSelectedFacade(null, '');
              }
            }
            
            if (showDetailGrid) {
              // Показываем контейнер
              if (detailGridContainer) {
                detailGridContainer.style.display = 'block';
              }
              
              // Добавляем все типы деталей в сетку
              detailTypes.forEach(detailType => {
                detailGrid.appendChild(createDetailPreviewItem(detailType));
              });
              
              // Сбрасываем выбор
              selectedDetailType = null;
            } else {
              // Скрываем контейнер
              if (detailGridContainer) {
                detailGridContainer.style.display = 'none';
              }
              selectedDetailType = null;
            }
          }"""

r4_a = r4.find("          // Функция для обновления сетки деталей\n          const fittingContainer")
r4_b = r4.find("          // Вешаем обработчик на ссылку", r4_a)
if r4_a < 0 or r4_b < 0:
    raise SystemExit("r4 fitting/updateDetailGrid not found")
new_udg_block = r4[r4_a:r4_b]
if old_udg not in main:
    raise SystemExit("old updateDetailGrid not found")
main = main.replace(old_udg, new_udg_block, 1)

old_link = """                  window.openFacadePickerModal(function(id, name) {
                    setSelectedFacade(id, name);
                  });"""
new_link = """                  window.openFacadePickerModal(function(id, name, item) {
                    setSelectedFacade(id, name, item);
                  });"""
if old_link not in main:
    raise SystemExit("facade link not found")
main = main.replace(old_link, new_link, 1)

old_close = """          function closeModal() {
            if (modal) {
            modal.style.display = 'none';
            // Сбрасываем выбор детали и фасада
            selectedDetailType = null;
            setSelectedFacade(null, '');
              if (detailGrid) {
                document.querySelectorAll('.detail-type-preview-item.selected').forEach(item => {
                  item.classList.remove('selected');
                  item.style.borderColor = '#e0e0e0';
                  item.style.background = '#fff';
                });
              }
            }
          }"""
new_close = """          function closeModal() {
            if (modal) {
            modal.style.display = 'none';
            // Сбрасываем выбор детали и фасада
            selectedDetailType = null;
            setSelectedFacade(null, '');
            setSelectedCatalogItem(null, '', '');
            setSelectedModels3d(null, '');
            setSelectedFitting(null, '');
            _models3dItemsCache = null;
              if (detailGrid) {
                document.querySelectorAll('.detail-type-preview-item.selected').forEach(item => {
                  item.classList.remove('selected');
                  item.style.borderColor = '#e0e0e0';
                  item.style.background = '#fff';
                });
              }
            }
          }"""
if old_close not in main:
    raise SystemExit("closeModal not found")
main = main.replace(old_close, new_close, 1)

start = main.find("          // Обработчик добавления элемента\n          if (addBtn) {")
end = main.find("          // Закрытие при клике вне модального окна", start)
if start < 0 or end < 0:
    raise SystemExit("addBtn block markers not found")
r4_add_start = r4.find("          // Обработчик добавления элемента\n          if (addBtn) {")
r4_add_end = r4.find("          // Закрытие при клике вне модального окна", r4_add_start)
if r4_add_start < 0 or r4_add_end < 0:
    raise SystemExit("r4 addBtn not found")
new_add = r4[r4_add_start:r4_add_end]
main = main[:start] + new_add + main[end:]

main_path.write_text(main, encoding="utf-8")
print("OK", main_path)
