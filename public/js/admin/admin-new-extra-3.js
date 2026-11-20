    (function initFileManager() {
      // Явный визуальный маркер загрузки (на случай, если console.log скрывается/фильтруется).
      try {
        try { window.__adminExtra3Loaded = '20260917-fm-mkdir'; } catch (e) {}
        console.log('[admin-new-extra-3] loaded v=20260917-fm-mkdir');
        function showBadge() {
          if (!document || !document.body) return;
          if (document.getElementById('__admin_extra3_loaded_badge')) return;
          var badge = document.createElement('div');
          badge.id = '__admin_extra3_loaded_badge';
          badge.textContent = 'extra-3 loaded';
          badge.style.cssText =
            'position:fixed;top:8px;right:8px;z-index:99999;' +
            'background:rgba(0,0,0,0.72);color:#fff;' +
            'padding:4px 8px;border-radius:999px;font:12px/1 Arial,sans-serif;' +
            'pointer-events:none;';
          document.body.appendChild(badge);
          setTimeout(function () {
            try { badge.parentNode && badge.parentNode.removeChild(badge); } catch (e) {}
          }, 6000);
        }
        if (document && document.body) showBadge();
        else if (document && document.addEventListener) {
          document.addEventListener('DOMContentLoaded', showBadge, { once: true });
        }
      } catch (e) {}
      function scheduleInitFileManagerWhenDomReady(fn) {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', fn, { once: true });
        } else {
          fn();
        }
      }
      scheduleInitFileManagerWhenDomReady(function attachFileManagerInstance() {
        const fmModal = document.getElementById('file-manager-modal');
        if (!fmModal) {
          window.openFileManager = function () {
            if (window.toastr) window.toastr.error('Файловый менеджер не найден в разметке страницы');
            else console.warn('[admin-new-extra-3] file-manager-modal missing');
          };
          return;
        }
        const fmTree = document.getElementById('file-manager-tree');
        const fmList = document.getElementById('file-manager-list');
        const fmBreadcrumbs = document.getElementById('file-manager-breadcrumbs');
        const fmCloseBtn = document.getElementById('file-manager-close-btn');
        const fmCancelBtn = document.getElementById('file-manager-cancel-btn');
        const fmOkBtn = document.getElementById('file-manager-ok-btn');
        const fmMkdirBtn = document.getElementById('file-manager-mkdir-btn');
        const fmUploadBtn = document.getElementById('file-manager-upload-btn');
        const fmUploadInput = document.getElementById('file-manager-upload-input');

      const state = {
        currentPath: '',
        selectedPath: '',
        selectedUrl: '',
        onSelect: null,
        allowedExt: null,
        renameTargetPath: '',
      };

      function fmIsImageExt(ext) {
        const e = (ext || '').toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff', '.bmp', '.svg'].indexOf(e) !== -1;
      }
      function fmEscapeAttr(s) {
        return String(s || '')
          .replace(/&/g, '&amp;')
          .replace(/"/g, '&quot;')
          .replace(/</g, '&lt;');
      }

      /** Расширение с ведущей точкой (для сравнения с allowedExt). */
      function fmNormExt(raw, fileName) {
        let e = (raw || '').toString().toLowerCase().trim();
        if (e && e[0] !== '.') e = '.' + e;
        if (!e && fileName) {
          const m = String(fileName)
            .toLowerCase()
            .match(/(\.[a-z0-9]{1,8})$/);
          if (m) e = m[1];
        }
        return e;
      }

      function fmExtAllowed(normExt, allowedList) {
        if (!Array.isArray(allowedList) || !allowedList.length) return true;
        const x = (normExt || '').toLowerCase();
        if (!x) return false;
        return allowedList.some(function (a) {
          const t = (a || '').toString().toLowerCase().trim();
          const withDot = t && t[0] !== '.' ? '.' + t : t;
          return withDot === x;
        });
      }

      // --- Переименование файла/папки (как в рефе: отдельный модал) ---
      let fmRenameModalEl = null;
      let fmRenameInputEl = null;
      let fmRenameOkBtnEl = null;
      let fmRenameCancelBtnEl = null;

      function fmHideRenameModal() {
        if (fmRenameModalEl) fmRenameModalEl.style.display = 'none';
        if (state) state.renameTargetPath = '';
      }

      function fmEnsureRenameModal() {
        if (fmRenameModalEl) return;
        fmRenameModalEl = document.createElement('div');
        fmRenameModalEl.id = 'file-manager-rename-modal';
        // Выше #file-manager-modal (10150), иначе диалог под оверлеем «не работает».
        fmRenameModalEl.style.cssText =
          'position:fixed; inset:0; background:rgba(0,0,0,0.42); z-index:10220;' +
          'display:none; align-items:center; justify-content:center;';

        const dialog = document.createElement('div');
        dialog.style.cssText =
          'background:#ffffff; border-radius:6px; max-width:520px; width:95%;' +
          'box-shadow:0 8px 30px rgba(0,0,0,0.2); overflow:hidden;';

        dialog.innerHTML =
          '<div style="padding:12px 16px; border-bottom:1px solid #e5e7eb; display:flex; align-items:center; justify-content:space-between;">' +
          '  <div style="font-weight:600;">Переименовать</div>' +
          '  <button type="button" id="file-manager-rename-close" class="btn btn-default btn-xs" style="padding:2px 8px;">✕</button>' +
          '</div>' +
          '<div style="padding:14px 16px;">' +
          '  <input id="file-manager-rename-input" class="form-control" type="text" placeholder="Введите новое имя" />' +
          '</div>' +
          '<div style="padding:10px 16px; display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #e5e7eb;">' +
          '  <button type="button" id="file-manager-rename-cancel" class="btn btn-default btn-sm">Отмена</button>' +
          '  <button type="button" id="file-manager-rename-ok" class="btn btn-primary btn-sm">Применить</button>' +
          '</div>';

        fmRenameModalEl.appendChild(dialog);
        document.body.appendChild(fmRenameModalEl);

        fmRenameInputEl = document.getElementById('file-manager-rename-input');
        fmRenameOkBtnEl = document.getElementById('file-manager-rename-ok');
        fmRenameCancelBtnEl = document.getElementById('file-manager-rename-cancel');

        const closeBtn = document.getElementById('file-manager-rename-close');
        if (closeBtn) closeBtn.addEventListener('click', fmHideRenameModal);

        if (fmRenameCancelBtnEl) fmRenameCancelBtnEl.addEventListener('click', fmHideRenameModal);

        if (fmRenameModalEl) {
          fmRenameModalEl.addEventListener('click', function (e) {
            if (e.target === fmRenameModalEl) fmHideRenameModal();
          });
        }

        if (fmRenameOkBtnEl) {
          fmRenameOkBtnEl.addEventListener('click', async function () {
            const targetPath = state.renameTargetPath;
            const newName = (fmRenameInputEl && fmRenameInputEl.value ? fmRenameInputEl.value : '').toString().trim();
            if (!targetPath) return;
            if (!newName) {
              if (window.toastr) window.toastr.error('Название не может быть пустым');
              else alert('Название не может быть пустым');
              return;
            }
            try {
              const resp = await fetch('/api/files/rename', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: targetPath, newName }),
              });
              const data = await resp.json().catch(() => null);
              if (!resp.ok) {
                const msg = (data && data.error) ? data.error : (resp.status ? ('HTTP ' + resp.status) : 'Ошибка переименования');
                const pathForUi = (targetPath || '').toString();
                const pathEsc = JSON.stringify(pathForUi);
                const codes = Array.from(pathForUi).slice(0, 40).map(function (ch) { return ch.charCodeAt(0); });
                const uiMsg = msg + ' (path: ' + pathEsc + (codes.length ? '; codes: ' + codes.join(',') : '') + ')';
                console.error('❌ /api/files/rename failed:', { status: resp.status, msg, uiMsg, targetPath, newName, data });
                if (window.toastr) window.toastr.error(uiMsg);
                else alert(msg);
                return;
              }
              await Promise.resolve(data).catch(() => ({}));
              fmHideRenameModal();
              await fmLoad(state.currentPath || '');
            } catch (e) {
              console.error('❌ Ошибка переименования:', e);
              const msg = (e && e.message) ? e.message : 'Не удалось переименовать';
              const pathForUi = ((state && state.renameTargetPath) ? state.renameTargetPath : targetPath || '').toString();
              const pathEsc = JSON.stringify(pathForUi);
              const codes = Array.from(pathForUi).slice(0, 40).map(function (ch) { return ch.charCodeAt(0); });
              const uiMsg = msg + ' (path: ' + pathEsc + (codes.length ? '; codes: ' + codes.join(',') : '') + ')';
              if (window.toastr) window.toastr.error(uiMsg);
              else alert(uiMsg);
            }
          });
        }
      }

      function fmShowRenameModal(targetPath, oldName) {
        fmEnsureRenameModal();
        state.renameTargetPath = targetPath || '';
        if (fmRenameInputEl) fmRenameInputEl.value = (oldName || '').toString();
        if (fmRenameModalEl) fmRenameModalEl.style.display = 'flex';
        if (fmRenameInputEl) {
          try { fmRenameInputEl.focus(); fmRenameInputEl.select(); } catch (_) {}
        }
      }

      function fmHide() {
        if (fmModal) fmModal.style.display = 'none';
        state.onSelect = null;
        state.selectedPath = '';
        state.selectedUrl = '';
      }

      function fmShow() {
        if (fmModal) {
          fmModal.style.display = 'block';
          fmModal.style.zIndex = '10150';
        }
      }

      function fmRenderBreadcrumbs() {
        if (!fmBreadcrumbs) return;
        const parts = (state.currentPath || '').split('/').filter(Boolean);
        const items = ['<a href="#" data-path="">files</a>'];
        let acc = '';
        parts.forEach((p) => {
          acc = acc ? acc + '/' + p : p;
          items.push('<span style="margin:0 4px;">/</span><a href="#" data-path="' + acc + '">' + p + '</a>');
        });
        fmBreadcrumbs.innerHTML = items.join('');
        fmBreadcrumbs.querySelectorAll('a[data-path]').forEach((a) => {
          a.addEventListener('click', (e) => {
            e.preventDefault();
            const path = a.getAttribute('data-path') || '';
            fmLoad(path);
          });
        });
      }

      function fmRenderTree(items) {
        if (!fmTree) return;
        const dirs = (items || []).filter((it) => it.type === 'dir');
        if (!dirs.length) {
          fmTree.innerHTML = '<div style="color:#6b7280; font-size:12px;">Папок нет</div>';
          return;
        }
        let html = '' +
          '<table class="table table-bordered table-sm" style="margin-bottom:0; font-size:13px;">' +
          '<tbody>';
        dirs.forEach((d) => {
          const fullPath = [state.currentPath, d.name].filter(Boolean).join('/');
          html += '<tr data-path="' + fullPath + '">' +
            '<td style="cursor:pointer;">' +
            '<i class="fa fa-folder-open" style="margin-right:6px;color:#c9a227;"></i>' +
            d.name +
            '</td>' +
            '<td style="width:40px; text-align:center; vertical-align:middle;">' +
            '<button type="button" class="btn btn-default btn-xs file-manager-edit-btn" data-path="' + fullPath + '" title="Переименовать">' +
            '<i class="fa fa-pencil"></i>' +
            '</button>' +
            '</td>' +
            '<td style="width:40px; text-align:center; vertical-align:middle;">' +
            '<button type="button" class="btn btn-default btn-xs file-manager-delete-btn" data-path="' + fullPath + '" title="Удалить">' +
            '<i class="fa fa-trash"></i>' +
            '</button>' +
            '</td>' +
            '</tr>';
        });
        html += '</tbody></table>';
        fmTree.innerHTML = html;

        // Клик по имени папки -> открыть
        fmTree.querySelectorAll('tr[data-path]').forEach((tr) => {
          tr.addEventListener('click', (e) => {
            const target = e.target;
            if (target && target.closest && (target.closest('button') || target.closest('.file-manager-edit-btn') || target.closest('.file-manager-delete-btn'))) {
              return;
            }
            e.preventDefault();
            const path = tr.getAttribute('data-path') || '';
            fmLoad(path);
          });
        });

        // rename в ветке
        fmTree.querySelectorAll('.file-manager-edit-btn').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetPath = btn.getAttribute('data-path') || '';
            const oldName = (targetPath.split('/').filter(Boolean).pop() || '').toString();
            fmShowRenameModal(targetPath, oldName);
          });
        });

        // delete в ветке
        fmTree.querySelectorAll('.file-manager-delete-btn').forEach((btn) => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const targetPath = btn.getAttribute('data-path') || '';
            if (!targetPath) return;
            const ok = window.confirm('Удалить "' + targetPath + '"?');
            if (!ok) return;
            try {
              const resp = await fetch('/api/files/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: targetPath }),
              });
              const data = await resp.json().catch(() => ({}));
              if (!resp.ok) {
                throw new Error(data.error || ('HTTP ' + resp.status));
              }
              await fmLoad(state.currentPath || '');
              if (window.toastr) window.toastr.success('Удалено');
            } catch (err) {
              console.error('❌ Ошибка удаления папки', err);
              const msg = (err && err.message) ? err.message : 'Не удалось удалить';
              if (window.toastr) window.toastr.error(msg);
              else alert(msg);
            }
          });
        });
      }

      function fmRenderList(items) {
        if (!fmList) return;
        if (!items.length) {
          fmList.innerHTML = '<div style="color:#6b7280; font-size:12px;">В этой папке пока ничего нет.</div>';
          return;
        }
        // Таблица как в рефе: имя + две колонки с действиями (редактировать / удалить)
        let html = '' +
          '<table class="table table-bordered table-sm" style="margin-bottom:0; font-size:13px;">' +
          '<thead><tr>' +
          '<th>Имя</th>' +
          '<th style="width:40px;"></th>' +
          '<th style="width:40px;"></th>' +
          '</tr></thead><tbody>';
        items.forEach((it) => {
          const isDir = it.type === 'dir';
          const rowPath = [state.currentPath, it.name].filter(Boolean).join('/');
          const rowUrl = it.url || '';
          const ext = fmNormExt(it.ext, it.name);
          const canSelect = !isDir && fmExtAllowed(ext, state.allowedExt);
          const rowClass = canSelect ? 'file-manager-row-selectable' : 'file-manager-row-disabled';
          let thumbOrIcon;
          if (isDir) {
            thumbOrIcon = '<i class="fa fa-folder-open" style="margin-right:6px;color:#c9a227;"></i>';
          } else if (rowUrl && fmIsImageExt(ext)) {
            thumbOrIcon =
              '<img src="' +
              fmEscapeAttr(rowUrl) +
              '" alt="" style="width:36px;height:36px;object-fit:cover;vertical-align:middle;margin-right:8px;border-radius:3px;border:1px solid #e5e7eb;"/>';
          } else {
            thumbOrIcon = '<i class="fa fa-file-o" style="margin-right:6px;color:#6b7280;"></i>';
          }
          html += '<tr class="' + rowClass + '" data-path="' + rowPath + '" data-url="' + rowUrl + '" data-type="' + it.type + '">';
          html += '<td>' + thumbOrIcon + it.name + '</td>';
          html += '<td style="text-align:center; vertical-align:middle;">' +
                  '<button type="button" class="btn btn-default btn-xs file-manager-edit-btn" data-path="' + rowPath + '" data-url="' + rowUrl + '" title="Переименовать">' +
                  '<i class="fa fa-pencil"></i>' +
                  '</button>' +
                  '</td>';
          html += '<td style="text-align:center; vertical-align:middle;">' +
                  '<button type="button" class="btn btn-default btn-xs file-manager-delete-btn" data-path="' + rowPath + '" title="Удалить">' +
                  '<i class="fa fa-trash"></i>' +
                  '</button>' +
                  '</td>';
          html += '</tr>';
        });
        html += '</tbody></table>';
        fmList.innerHTML = html;

        // Клик по строке — выбор файла или переход в папку
        fmList.querySelectorAll('tr[data-path]').forEach((tr) => {
          tr.addEventListener('click', (e) => {
            const t = e.target;
            if (t && t.closest && (t.closest('button') || t.closest('.file-manager-edit-btn') || t.closest('.file-manager-delete-btn'))) {
              return;
            }
            const type = tr.getAttribute('data-type');
            const path = tr.getAttribute('data-path') || '';
            const url = tr.getAttribute('data-url') || '';
            if (type === 'dir') {
              fmLoad(path);
              return;
            }
            if (tr.classList.contains('file-manager-row-disabled')) return;
            fmList.querySelectorAll('tr[data-path]').forEach((r) => r.classList.remove('file-manager-row-selected', 'info'));
            tr.classList.add('file-manager-row-selected');
            state.selectedPath = path;
            state.selectedUrl = url;
          });
        });

        // Кнопка удаления
        fmList.querySelectorAll('.file-manager-delete-btn').forEach((btn) => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const targetPath = btn.getAttribute('data-path') || '';
            if (!targetPath) return;
            const ok = window.confirm('Удалить "' + targetPath + '"?');
            if (!ok) return;
            try {
              const resp = await fetch('/api/files/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: targetPath }),
              });
              const data = await resp.json().catch(() => ({}));
              if (!resp.ok) {
                throw new Error(data.error || ('HTTP ' + resp.status));
              }
              await fmLoad(state.currentPath || '');
              if (window.toastr) window.toastr.success('Удалено');
            } catch (err) {
              console.error('❌ Ошибка удаления файла', err);
              const msg = (err && err.message) ? err.message : 'Не удалось удалить файл/папку';
              if (window.toastr) window.toastr.error(msg);
              else alert(msg);
            }
          });
        });

        // Кнопка "редактировать" — переименование (как в рефе: модалка)
        fmList.querySelectorAll('.file-manager-edit-btn').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetPath = btn.getAttribute('data-path') || '';
            if (!targetPath) return;
            const oldName = (targetPath.split('/').filter(Boolean).pop() || '').toString();
            fmShowRenameModal(targetPath, oldName);
          });
        });
      }

      async function fmLoad(path) {
        try {
          const resp = await fetch('/api/files/list?path=' + encodeURIComponent(path || ''));
          if (!resp.ok) throw new Error('Ошибка загрузки списка файлов');
          const data = await resp.json();
          state.currentPath = (data.path || '').toString();
          fmRenderBreadcrumbs();
          fmRenderTree(data.items || []);
          fmRenderList(data.items || []);
        } catch (e) {
          console.error('❌ Ошибка загрузки файлового менеджера:', e);
          if (window.toastr) window.toastr.error('Ошибка загрузки списка файлов');
        }
      }

      if (fmCloseBtn) fmCloseBtn.addEventListener('click', fmHide);
      if (fmCancelBtn) fmCancelBtn.addEventListener('click', fmHide);
      if (fmOkBtn) {
        fmOkBtn.addEventListener('click', () => {
          if (state.onSelect) {
            if (!state.selectedUrl) {
              if (window.toastr) window.toastr.warning('Выберите файл в списке (строка подсветится синим)');
              else alert('Выберите файл в списке');
              return;
            }
            state.onSelect({
              path: state.selectedPath,
              url: state.selectedUrl,
            });
          }
          fmHide();
        });
      }

      // --- Создать папку (свой диалог, не window.prompt — тот часто не замечают / режут) ---
      let fmMkdirModalEl = null;
      let fmMkdirInputEl = null;

      function fmHideMkdirModal() {
        if (fmMkdirModalEl) fmMkdirModalEl.style.display = 'none';
      }

      function fmSanitizeFolderName(raw) {
        let s = String(raw || '').normalize('NFC').trim();
        s = s.replace(/[\u0000-\u001F\u007F<>:"/\\|?*]/g, '_');
        s = s.replace(/^\.+/, '').replace(/\.+$/, '').trim();
        return s;
      }

      function fmEnsureMkdirModal() {
        if (fmMkdirModalEl) return;
        fmMkdirModalEl = document.createElement('div');
        fmMkdirModalEl.id = 'file-manager-mkdir-modal';
        fmMkdirModalEl.style.cssText =
          'position:fixed; inset:0; background:rgba(0,0,0,0.42); z-index:10220;' +
          'display:none; align-items:center; justify-content:center;';
        const dialog = document.createElement('div');
        dialog.style.cssText =
          'background:#ffffff; border-radius:6px; max-width:480px; width:95%;' +
          'box-shadow:0 8px 30px rgba(0,0,0,0.2); overflow:hidden;';
        dialog.innerHTML =
          '<div style="padding:12px 16px; border-bottom:1px solid #e5e7eb; display:flex; align-items:center; justify-content:space-between;">' +
          '  <div style="font-weight:600;">Создать папку</div>' +
          '  <button type="button" id="file-manager-mkdir-close" class="btn btn-default btn-xs" style="padding:2px 8px;">✕</button>' +
          '</div>' +
          '<div style="padding:14px 16px;">' +
          '  <label style="font-size:13px; color:#4b5563; margin-bottom:6px; display:block;">Имя папки</label>' +
          '  <input id="file-manager-mkdir-input" class="form-control" type="text" placeholder="Например: textures" autocomplete="off" />' +
          '</div>' +
          '<div style="padding:10px 16px; display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #e5e7eb;">' +
          '  <button type="button" id="file-manager-mkdir-cancel" class="btn btn-default btn-sm">Отмена</button>' +
          '  <button type="button" id="file-manager-mkdir-ok" class="btn btn-primary btn-sm">Создать</button>' +
          '</div>';
        fmMkdirModalEl.appendChild(dialog);
        document.body.appendChild(fmMkdirModalEl);
        fmMkdirInputEl = document.getElementById('file-manager-mkdir-input');
        const closeBtn = document.getElementById('file-manager-mkdir-close');
        const cancelBtn = document.getElementById('file-manager-mkdir-cancel');
        const okBtn = document.getElementById('file-manager-mkdir-ok');
        if (closeBtn) closeBtn.addEventListener('click', fmHideMkdirModal);
        if (cancelBtn) cancelBtn.addEventListener('click', fmHideMkdirModal);
        fmMkdirModalEl.addEventListener('click', function (e) {
          if (e.target === fmMkdirModalEl) fmHideMkdirModal();
        });
        async function submitMkdir() {
          const name = fmSanitizeFolderName(fmMkdirInputEl && fmMkdirInputEl.value);
          if (!name) {
            if (window.toastr) window.toastr.error('Введите имя папки');
            else alert('Введите имя папки');
            return;
          }
          try {
            const resp = await fetch('/api/files/mkdir', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: state.currentPath || '', name }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) throw new Error(data.error || ('HTTP ' + resp.status));
            fmHideMkdirModal();
            await fmLoad(state.currentPath || '');
            if (window.toastr) window.toastr.success('Папка создана: ' + name);
          } catch (e) {
            console.error('❌ Ошибка создания папки:', e);
            const msg = (e && e.message) ? e.message : 'Ошибка создания папки';
            if (window.toastr) window.toastr.error(msg);
            else alert('Ошибка создания папки: ' + msg);
          }
        }
        if (okBtn) okBtn.addEventListener('click', submitMkdir);
        if (fmMkdirInputEl) {
          fmMkdirInputEl.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
              e.preventDefault();
              submitMkdir();
            }
          });
        }
      }

      function fmShowMkdirModal() {
        fmEnsureMkdirModal();
        if (fmMkdirInputEl) fmMkdirInputEl.value = '';
        fmMkdirModalEl.style.display = 'flex';
        setTimeout(function () {
          try {
            fmMkdirInputEl && fmMkdirInputEl.focus();
          } catch (_) {}
        }, 30);
      }

      if (fmMkdirBtn) {
        fmMkdirBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          fmShowMkdirModal();
        });
      }

      if (fmUploadBtn && fmUploadInput) {
        fmUploadBtn.addEventListener('click', () => {
          fmUploadInput.value = '';
          fmUploadInput.click();
        });
        fmUploadInput.addEventListener('change', async () => {
          const files = Array.from(fmUploadInput.files || []);
          if (!files.length) return;
          try {
            const fd = new FormData();
            fd.append('path', state.currentPath || '');
            files.forEach((f) => fd.append('file', f));
            const resp = await fetch('/api/files/upload', { method: 'POST', body: fd });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) throw new Error(data.error || ('HTTP ' + resp.status));
            await fmLoad(state.currentPath || '');
            if (window.toastr) window.toastr.success('Файл загружен');
          } catch (e) {
            console.error('❌ Ошибка загрузки файлов:', e);
            const msg = (e && e.message) ? e.message : 'Ошибка загрузки';
            if (window.toastr) window.toastr.error(msg);
            else alert('Ошибка загрузки файлов: ' + msg);
          }
        });
      }

      window.openFileManager = function openFileManager(options) {
        state.onSelect = options && typeof options.onSelect === 'function' ? options.onSelect : null;
        state.allowedExt = Array.isArray(options && options.allowedExt)
          ? options.allowedExt.map((e) => {
              const t = (e || '').toString().toLowerCase().trim();
              return t && t[0] !== '.' ? '.' + t : t;
            })
          : null;
        state.selectedPath = '';
        state.selectedUrl = '';
        const initialPath = (options && options.initialPath) || '';
        fmShow();
        fmLoad(initialPath);
      };

      });

      // Один файловый менеджер на весь проект: выскакивает при каждой загрузке; с компа грузим только внутри него (кнопка «Загрузить» в модалке).
      // Перехват: кнопки «Выбрать», превью, плейсхолдеры — до бандла (capture).
      var fmPreviewIds = [
        { prev: 'material-texture-preview', urlId: 'material-texture-url' },
        { prev: 'material-normal-map-preview', urlId: 'material-normal-map-url' },
        { prev: 'material-roughness-map-preview', urlId: 'material-roughness-map-url' },
        { prev: 'edge-texture-preview', urlId: 'edge-texture-url' },
        { prev: 'edge-normal-map-preview', urlId: 'edge-normal-map-url' },
        { prev: 'edge-roughness-map-preview', urlId: 'edge-roughness-map-url' },
        { prev: 'mkm-texture-preview', urlId: 'mkm-texture-url' },
        { prev: 'mkm-normal-preview', urlId: 'mkm-normal-url' },
        { prev: 'mkm-roughmap-preview', urlId: 'mkm-roughmap-url' },
        { prev: 'tt-mat-map-preview', urlId: 'tt-mat-map' },
        { prev: 'tt-mat-normal-preview', urlId: 'tt-mat-normal' },
        { prev: 'tt-mat-rough-preview', urlId: 'tt-mat-rough-map' },
        { prev: 'plinth-texture-preview', urlId: 'plinth-texture-url' },
        { prev: 'plinth-normal-preview', urlId: 'plinth-normal-map-url' },
        { prev: 'plinth-roughness-preview', urlId: 'plinth-roughness-map-url' }
      ];
      var fmButtonIds = [
        { btnId: 'material-texture-upload-btn', urlId: 'material-texture-url', prevId: 'material-texture-preview' },
        { btnId: 'material-normal-map-upload-btn', urlId: 'material-normal-map-url', prevId: 'material-normal-map-preview' },
        { btnId: 'material-roughness-map-upload-btn', urlId: 'material-roughness-map-url', prevId: 'material-roughness-map-preview' },
        { btnId: 'edge-texture-upload-btn', urlId: 'edge-texture-url', prevId: 'edge-texture-preview' },
        { btnId: 'edge-normal-map-upload-btn', urlId: 'edge-normal-map-url', prevId: 'edge-normal-map-preview' },
        { btnId: 'edge-roughness-map-upload-btn', urlId: 'edge-roughness-map-url', prevId: 'edge-roughness-map-preview' },
        { btnId: 'mkm-texture-upload-btn', urlId: 'mkm-texture-url', prevId: 'mkm-texture-preview' },
        { btnId: 'mkm-normal-upload-btn', urlId: 'mkm-normal-url', prevId: 'mkm-normal-preview' },
        { btnId: 'mkm-roughmap-upload-btn', urlId: 'mkm-roughmap-url', prevId: 'mkm-roughmap-preview' },
        { btnId: 'tt-mat-map-btn', urlId: 'tt-mat-map', prevId: 'tt-mat-map-preview' },
        { btnId: 'tt-mat-normal-btn', urlId: 'tt-mat-normal', prevId: 'tt-mat-normal-preview' },
        { btnId: 'tt-mat-rough-btn', urlId: 'tt-mat-rough-map', prevId: 'tt-mat-rough-preview' },
        { btnId: 'plinth-texture-upload-btn', urlId: 'plinth-texture-url', prevId: 'plinth-texture-preview' },
        { btnId: 'plinth-normal-upload-btn', urlId: 'plinth-normal-map-url', prevId: 'plinth-normal-preview' },
        { btnId: 'plinth-roughness-upload-btn', urlId: 'plinth-roughness-map-url', prevId: 'plinth-roughness-preview' }
      ];

      function openFmForPreview(rec, preview) {
        var urlInput = document.getElementById(rec.urlId);
        if (!urlInput) return;
        window.openFileManager({
          allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff'],
          initialPath: 'files',
          onSelect: function (r) {
            if (r && r.url && preview) {
              urlInput.value = r.url;
              urlInput.dispatchEvent(new Event('input', { bubbles: true }));
              preview.innerHTML = '<img src="' + (r.url || '').replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:cover"><i class="fa fa-folder-open" style="position:absolute;top:4px;right:4px;color:#1c84c6;cursor:pointer;font-size:16px"></i>';
              if (rec.urlId === 'material-texture-url' || rec.urlId === 'material-normal-map-url' || rec.urlId === 'material-roughness-map-url') {
                if (typeof window.__cldUpdateMaterialDecorPreview === 'function') {
                  window.__cldUpdateMaterialDecorPreview();
                }
              }
              if (rec.urlId === 'edge-texture-url' || rec.urlId === 'edge-normal-map-url' || rec.urlId === 'edge-roughness-map-url') {
                if (rec.urlId === 'edge-texture-url' && typeof window.__cldSyncEdgeDecorIconFromTexture === 'function') {
                  window.__cldSyncEdgeDecorIconFromTexture();
                }
                if (typeof window.__cldUpdateEdgeDecorPreview === 'function') {
                  window.__cldUpdateEdgeDecorPreview();
                }
              }
              if (rec.urlId === 'tt-mat-map' || rec.urlId === 'tt-mat-normal' || rec.urlId === 'tt-mat-rough-map') {
                if (typeof window.__cldUpdateTabletopDisplayPreview === 'function') {
                  window.__cldUpdateTabletopDisplayPreview();
                }
              }
              if (
                rec.urlId === 'plinth-texture-url' ||
                rec.urlId === 'plinth-normal-map-url' ||
                rec.urlId === 'plinth-roughness-map-url'
              ) {
                if (typeof window.__cldUpdatePlinthDecorPreview === 'function') {
                  window.__cldUpdatePlinthDecorPreview();
                }
              }
            }
          }
        });
      }

      document.addEventListener('click', function (e) {
        var el = e.target;
        if (!el || !el.closest) return;

        var btn = fmButtonIds.find(function (b) { return el.id === b.btnId || el.closest && el.closest('#' + b.btnId); });
        if (btn) {
          e.preventDefault();
          e.stopPropagation();
          var preview = document.getElementById(btn.prevId);
          openFmForPreview({ urlId: btn.urlId }, preview);
          return;
        }

        var preview = el.closest('#material-texture-preview, #material-normal-map-preview, #material-roughness-map-preview, #edge-texture-preview, #edge-normal-map-preview, #edge-roughness-map-preview, #mkm-texture-preview, #mkm-normal-preview, #mkm-roughmap-preview, #tt-mat-map-preview, #tt-mat-normal-preview, #tt-mat-rough-preview, #plinth-texture-preview, #plinth-normal-preview, #plinth-roughness-preview');
        if (preview) {
          e.preventDefault();
          e.stopPropagation();
          var rec = fmPreviewIds.find(function (m) { return preview.id === m.prev; });
          if (rec) openFmForPreview(rec, preview);
          return;
        }

        var ttIconBlock = el.closest('#tt-model-icon-placeholder, #tt-model-icon-preview-wrapper, #tt-model-icon-block');
        if (ttIconBlock) {
          e.preventDefault();
          e.stopPropagation();
          var tu = document.getElementById('tt-model-icon');
          var twrap = document.getElementById('tt-model-icon-preview-wrapper');
          var tph = document.getElementById('tt-model-icon-placeholder');
          if (!tu) return;
          window.openFileManager({
            allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff'],
            initialPath: 'files',
            onSelect: function (r) {
              if (r && r.url) {
                tu.value = r.url;
                tu.dispatchEvent(new Event('input', { bubbles: true }));
                var img = document.getElementById('tt-model-icon-preview');
                if (img) img.src = r.url;
                if (twrap) twrap.style.display = 'block';
                if (tph) tph.style.display = 'none';
              }
            }
          });
          return;
        }

        var edgeBlock = el.closest('#edge-item-icon-placeholder, #edge-item-icon-preview-wrapper');
        if (edgeBlock) {
          e.preventDefault();
          e.stopPropagation();
          var u = document.getElementById('edge-item-icon');
          var wrap = document.getElementById('edge-item-icon-preview-wrapper');
          var ph = document.getElementById('edge-item-icon-placeholder');
          if (!u) return;
          window.openFileManager({
            allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff'],
            initialPath: 'files',
            onSelect: function (r) {
              if (r && r.url) {
                u.value = r.url;
                u.dispatchEvent(new Event('input', { bubbles: true }));
                var img = document.getElementById('edge-item-icon-preview');
                if (img) img.src = r.url;
                if (wrap) wrap.style.display = 'block';
                if (ph) ph.style.display = 'none';
              }
            }
          });
          return;
        }

        var materialBlock = el.closest('#material-item-icon-placeholder, #material-item-icon-preview-wrapper');
        if (materialBlock) {
          e.preventDefault();
          e.stopPropagation();
          var u = document.getElementById('material-item-icon');
          var wrap = document.getElementById('material-item-icon-preview-wrapper');
          var ph = document.getElementById('material-item-icon-placeholder');
          if (!u) return;
          window.openFileManager({
            allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff'],
            initialPath: 'files',
            onSelect: function (r) {
              if (r && r.url) {
                u.value = r.url;
                u.dispatchEvent(new Event('input', { bubbles: true }));
                var img = document.getElementById('material-item-icon-preview');
                if (img) img.src = r.url;
                if (wrap) wrap.style.display = 'block';
                if (ph) ph.style.display = 'none';
              }
            }
          });
          return;
        }

        var handlesCollIcon = el.closest('#handles-collection-add-icon-placeholder, #handles-collection-add-icon-preview, #handles-collection-add-icon-preview-wrap');
        if (handlesCollIcon) {
          e.preventDefault();
          e.stopPropagation();
          window.openFileManager({
            allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff'],
            initialPath: 'files',
            onSelect: function (r) {
              if (r && r.url) {
                if (typeof window.__cldSetCollectionAddIcon === 'function') {
                  window.__cldSetCollectionAddIcon(r.url);
                }
              }
            }
          });
        }
      }, true);

      // --- Параметры материала: заполнение «Набор кромок» из edges_keys (кромка выбирается из справочника, не из файлов) ---
      (function initMaterialParamsEdgeSet() {
        var filled = false;
        function fillMaterialEdgeSet() {
          var sel = document.getElementById('material-edge-set');
          if (!sel || filled || (sel.options && sel.options.length > 1)) return;
          var pane = document.getElementById('mat-item-tab-params');
          if (!pane || !pane.offsetParent) return; // tab not visible
          filled = true;
          fetch('/api/catalog/items_get/edges_keys').then(function (r) { return r.ok ? r.json() : []; }).then(function (list) {
            sel.innerHTML = '';
            if (!Array.isArray(list) || list.length === 0) {
              var opt = document.createElement('option');
              opt.value = 'butts';
              opt.textContent = 'Набор по умолчанию';
              sel.appendChild(opt);
              return;
            }
            list.forEach(function (e) {
              var opt = document.createElement('option');
              var rawKey = (e && e.key ? String(e.key) : '');
              var val = rawKey.replace(/[^a-zA-Z0-9_]/g, '') || 'butts';
              opt.value = val;
              opt.textContent = e.name || e.key || val;
              sel.appendChild(opt);
            });
          }).catch(function () {
            sel.innerHTML = '';
            var opt = document.createElement('option');
            opt.value = 'butts';
            opt.textContent = 'Набор по умолчанию';
            sel.appendChild(opt);
          });
        }
        document.addEventListener('click', function (e) {
          if (e.target && e.target.getAttribute && (e.target.getAttribute('href') === '#mat-item-tab-params' || (e.target.closest && e.target.closest('[href="#mat-item-tab-params"]')))) {
            setTimeout(fillMaterialEdgeSet, 50);
          }
        });
        if (window.location.hash.indexOf('material-item-edit') !== -1) setTimeout(fillMaterialEdgeSet, 500);
      })();

      // --- Несколько кромок для материала: список, добавление, сохранение edge_ids ---
      (function initMaterialEdgesMulti() {

        function getAssignedEdges() {
          var el = document.getElementById('material-edge-ids');
          if (!el || !el.value) return [];
          try { return JSON.parse(el.value); } catch (e) { return []; }
        }
        function setAssignedEdges(arr) {
          var el = document.getElementById('material-edge-ids');
          if (!el) return;
          el.value = JSON.stringify(Array.isArray(arr) ? arr : []);
          renderEdgeList();
        }
        function renderEdgeList() {
          var list = document.getElementById('material-edge-list');
          if (!list) return;
          var arr = getAssignedEdges();
          list.innerHTML = '';
          arr.forEach(function (edge, idx) {
            var span = document.createElement('span');
            span.className = 'badge badge-light d-inline-flex align-items-center';
            span.style.cssText = 'padding:3px 8px; font-size:11px; margin:0;';
            span.innerHTML = (edge.name || 'ID ' + edge.id) + ' <button type="button" class="btn btn-link btn-xs p-0 ml-1" data-remove-idx="' + idx + '" style="color:#dc3545; font-size:13px; line-height:1;">&times;</button>';
            list.appendChild(span);
          });
        }
        document.addEventListener('click', function (e) {
          var btn = e.target && e.target.getAttribute && e.target.getAttribute('data-remove-idx');
          if (btn == null) return;
          if (!e.target.closest || !e.target.closest('#material-edge-list')) return;
          var idx = parseInt(btn, 10);
          var arr = getAssignedEdges();
          if (idx >= 0 && idx < arr.length) {
            arr.splice(idx, 1);
            setAssignedEdges(arr);
          }
        });

        function openPickModal() {
          var sel = document.getElementById('material-edge-set');
          var mod = document.getElementById('material-edge-pick-modal');
          var list = document.getElementById('material-edge-pick-list');
          var hint = document.getElementById('material-edge-pick-hint');
          if (!mod || !list || !hint) return;
          var key = (sel && sel.value) ? String(sel.value).trim() : 'butts';
          if (!key) key = 'butts';
          var type = 'butt_' + key;
          hint.textContent = 'Загрузка кромок из набора...';
          list.innerHTML = '';
          mod.style.display = 'flex';
          fetch('/api/catalog/items_get/' + encodeURIComponent(type)).then(function (r) { return r.ok ? r.json() : []; }).then(function (data) {
            var items = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
            hint.textContent = 'Выберите кромку для добавления к материалу:';
            if (!Array.isArray(items) || items.length === 0) {
              list.innerHTML = '<li class="list-group-item text-muted">Нет кромок в этом наборе</li>';
              return;
            }
            function edgeVariantsFromItem(it) {
              if (!it) return [];
              if (Array.isArray(it.edge_variants) && it.edge_variants.length) return it.edge_variants;
              if (Array.isArray(it.variants) && it.variants.length) return it.variants;
              return [];
            }
            function edgePickLabel(it, variant, variantIndex) {
              var base = (variant && variant.name) ? String(variant.name) : (it.name || it.article || 'ID ' + it.id).toString();
              var variants = edgeVariantsFromItem(it);
              if (variants.length <= 1) return base;
              var th = variant && variant.thickness;
              if (th != null && th !== '') {
                var thStr = String(th).replace('.', ',');
                if (base.indexOf(thStr) >= 0 || base.indexOf(String(th)) >= 0) return base;
                return base + ' — ' + thStr + ' мм';
              }
              return base + ' (вариант ' + (variantIndex + 1) + ')';
            }
            var assigned = getAssignedEdges();
            function assignKey(e) {
              var vid = e.variant_id != null ? Number(e.variant_id) : 0;
              return Number(e.id) + ':' + (Number.isFinite(vid) ? vid : 0);
            }
            var assignedKeys = {};
            assigned.forEach(function (e) { assignedKeys[assignKey(e)] = true; });
            items.forEach(function (it) {
              var id = Number(it.id);
              var variants = edgeVariantsFromItem(it);
              var rows = variants.length > 1
                ? variants.map(function (v, i) { return { variant: v, variantIndex: i }; })
                : [{ variant: variants[0] || null, variantIndex: 0 }];
              rows.forEach(function (row) {
                var vi = row.variantIndex;
                var label = edgePickLabel(it, row.variant, vi);
                var key = id + ':' + vi;
                var already = !!assignedKeys[key];
                var li = document.createElement('li');
                li.className = 'list-group-item list-group-item-action' + (already ? ' disabled' : '');
                li.style.cursor = already ? 'not-allowed' : 'pointer';
                li.textContent = label + (already ? ' (уже добавлена)' : '');
                if (!already) {
                  li.onclick = function () {
                    var arr = getAssignedEdges();
                    arr.push({ id: id, name: label, variant_id: vi });
                    setAssignedEdges(arr);
                    if (mod) mod.style.display = 'none';
                  };
                }
                list.appendChild(li);
              });
            });
          }).catch(function () {
            hint.textContent = 'Ошибка загрузки списка кромок.';
            list.innerHTML = '';
          });
        }
        function closePickModal() {
          var mod = document.getElementById('material-edge-pick-modal');
          if (mod) mod.style.display = 'none';
        }
        document.addEventListener('click', function (e) {
          if (e.target && (e.target.id === 'material-edge-add-btn' || (e.target.closest && e.target.closest('#material-edge-add-btn')))) {
            e.preventDefault();
            openPickModal();
          }
          if (e.target && (e.target.id === 'material-edge-pick-modal-close' || (e.target.closest && e.target.closest('#material-edge-pick-modal-close')))) {
            closePickModal();
          }
          var mod = document.getElementById('material-edge-pick-modal');
          if (mod && e.target === mod) closePickModal();
        });

        // Название/артикул из «Основные параметры» → баннер и поля в каждом блоке варианта.
        function syncVariantFromBasic(force) {
          var nameBasic = document.getElementById('material-item-name');
          var artBasic = document.getElementById('material-item-article');
          var summaryName = document.getElementById('material-params-basic-name');
          var summaryArt = document.getElementById('material-params-basic-article');
          var n = (nameBasic && nameBasic.value) ? nameBasic.value.trim() : '';
          var a = (artBasic && artBasic.value) ? artBasic.value.trim() : '';
          if (summaryName) summaryName.textContent = n || '—';
          if (summaryArt) summaryArt.textContent = a ? (' · арт. ' + a) : '';
          var list = document.getElementById('material-variants-list');
          if (list) {
            list.querySelectorAll('.mat-v-name').forEach(function (el) { el.value = n; });
            list.querySelectorAll('.mat-v-article').forEach(function (el) { el.value = a; });
          }
        }
        window.__cldSyncMaterialVariantFromBasic = syncVariantFromBasic;

        function bindMaterialBasicFieldSync() {
          if (document.body && document.body._cldMatBasicSyncBound) return;
          if (document.body) document.body._cldMatBasicSyncBound = true;
          ['material-item-name', 'material-item-article'].forEach(function (id) {
            var el = document.getElementById(id);
            if (!el || el._cldMatBasicSync) return;
            el._cldMatBasicSync = true;
            el.addEventListener('input', function () { syncVariantFromBasic(true); });
          });
        }
        bindMaterialBasicFieldSync();

        document.addEventListener('click', function (e) {
          if (e.target && (e.target.getAttribute && e.target.getAttribute('href') === '#mat-item-tab-params' ||
            (e.target.closest && e.target.closest('[href="#mat-item-tab-params"]')))) {
            setTimeout(function () { syncVariantFromBasic(true); }, 0);
          }
        });

        if (window.location.hash.indexOf('material-item-edit') !== -1) {
          setTimeout(function () { syncVariantFromBasic(true); }, 700);
        }

        document.addEventListener('cld-material-item-edit-loaded', function () {
          try {
            var variants = getMaterialVariants();
            renderMaterialVariantBlocks(variants.length ? variants : [getDefaultMaterialVariant()]);
          } catch (e) {}
          syncVariantFromBasic(true);
        });

        // --- Варианты материала: стек блоков как в рефе (add_variant = copy_object(variants[0])) ---
        function cloneVariantObj(v) {
          try { return JSON.parse(JSON.stringify(v || {})); } catch (e) { return {}; }
        }
        function getBasicMaterialNameArticle() {
          var nameBasic = document.getElementById('material-item-name');
          var artBasic = document.getElementById('material-item-article');
          return {
            name: (nameBasic && nameBasic.value) ? nameBasic.value.trim() : '',
            article: (artBasic && artBasic.value) ? artBasic.value.trim() : ''
          };
        }
        function getDefaultMaterialVariant() {
          var ba = getBasicMaterialNameArticle();
          return {
            name: ba.name,
            article: ba.article,
            length: 2800,
            width: 2070,
            thickness: 16,
            calc_type: 'per_m2',
            price_input_type: 'manual',
            price: null
          };
        }
        function getMaterialVariants() {
          var hidden = document.getElementById('material-variants-hidden');
          if (!hidden || !hidden.value) return [];
          try { return JSON.parse(hidden.value); } catch (e) { return []; }
        }
        function escAttr(s) {
          return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;');
        }
        function readVariantFromBlock(block) {
          if (!block) return null;
          var num = function (sel) {
            var el = block.querySelector(sel);
            if (!el || el.value === '') return null;
            var n = Number(el.value);
            return isFinite(n) ? n : null;
          };
          var str = function (sel) {
            var el = block.querySelector(sel);
            return el ? el.value.trim() : '';
          };
          return {
            name: str('.mat-v-name'),
            article: str('.mat-v-article'),
            length: num('.mat-v-length'),
            width: num('.mat-v-width'),
            thickness: num('.mat-v-thickness'),
            calc_type: (function () {
              var el = block.querySelector('.mat-v-calc');
              return el && el.value ? el.value : 'per_m2';
            })(),
            price_input_type: (function () {
              var el = block.querySelector('.mat-v-price-mode');
              return el && el.value ? el.value : 'manual';
            })(),
            price: num('.mat-v-price')
          };
        }
        function readVariantsFromDOM() {
          var list = document.getElementById('material-variants-list');
          if (!list) return [];
          var blocks = list.querySelectorAll('.material-variant-block');
          var out = [];
          blocks.forEach(function (b) {
            var v = readVariantFromBlock(b);
            if (v) out.push(v);
          });
          return out;
        }
        function syncVariantsToHidden() {
          var hidden = document.getElementById('material-variants-hidden');
          if (!hidden) return;
          syncVariantFromBasic(true);
          hidden.value = JSON.stringify(readVariantsFromDOM());
        }
        window.__cldSyncMaterialVariantsToHidden = syncVariantsToHidden;

        function buildVariantBlockHtml(v, idx, total) {
          var len = v.length != null ? v.length : '';
          var wid = v.width != null ? v.width : '';
          var th = v.thickness != null ? v.thickness : '';
          var price = v.price != null && v.price !== '' ? v.price : '';
          var calc = v.calc_type || 'per_m2';
          var priceMode = v.price_input_type || 'manual';
          var showDel = total > 1;
          var showUp = idx > 0;
          var showDown = idx < total - 1;
          return (
            '<div class="material-variant-block mb-4" data-variant-idx="' + idx + '" style="padding:12px 50px 12px 12px;position:relative;border:1px solid #e5e7eb;border-radius:6px;background:#fafafa;">' +
            '<div class="variant_controls" style="position:absolute;right:5px;top:5px;display:flex;flex-direction:column;gap:4px;">' +
            (showDel ? '<button type="button" class="btn btn-sm btn-outline-danger material-variant-del" title="Удалить"><i class="fa fa-trash"></i></button>' : '') +
            (showUp ? '<button type="button" class="btn btn-sm btn-outline-success material-variant-up" title="Выше"><i class="fa fa-chevron-up"></i></button>' : '') +
            (showDown ? '<button type="button" class="btn btn-sm btn-outline-success material-variant-down" title="Ниже"><i class="fa fa-chevron-down"></i></button>' : '') +
            '</div>' +
            '<div class="row mb-2">' +
            '<div class="col-sm-4"><label class="mb-0" style="font-size:12px;">Название</label>' +
            '<input type="text" class="form-control form-control-sm mat-v-name" readonly value="' + escAttr(v.name || '') + '"></div>' +
            '<div class="col-sm-4"><label class="mb-0" style="font-size:12px;">Артикул</label>' +
            '<input type="text" class="form-control form-control-sm mat-v-article" readonly value="' + escAttr(v.article || '') + '"></div>' +
            '<div class="col-sm-4"></div></div>' +
            '<div class="row mb-2">' +
            '<div class="col-sm-4"><label class="mb-0" style="font-size:12px;">Длина, мм</label>' +
            '<input type="number" class="form-control form-control-sm mat-v-length" min="0" step="1" value="' + escAttr(len) + '"></div>' +
            '<div class="col-sm-4"><label class="mb-0" style="font-size:12px;">Ширина, мм</label>' +
            '<input type="number" class="form-control form-control-sm mat-v-width" min="0" step="1" value="' + escAttr(wid) + '"></div>' +
            '<div class="col-sm-4"><label class="mb-0" style="font-size:12px;">Толщина, мм</label>' +
            '<input type="number" class="form-control form-control-sm mat-v-thickness" min="0" step="1" value="' + escAttr(th) + '"></div></div>' +
            '<div class="row mb-2">' +
            '<div class="col-sm-4"><label class="mb-0" style="font-size:12px;">Тип расчёта</label>' +
            '<select class="form-control form-control-sm mat-v-calc">' +
            '<option value="per_m2"' + (calc === 'per_m2' ? ' selected' : '') + '>р/м²</option>' +
            '<option value="per_mp"' + (calc === 'per_mp' ? ' selected' : '') + '>р/м.п</option></select></div>' +
            '<div class="col-sm-4"><label class="mb-0" style="font-size:12px;">Ввод цен</label>' +
            '<select class="form-control form-control-sm mat-v-price-mode">' +
            '<option value="manual"' + (priceMode === 'manual' ? ' selected' : '') + '>Ручной ввод</option>' +
            '<option value="import"' + (priceMode === 'import' ? ' selected' : '') + '>Импорт</option></select></div>' +
            '<div class="col-sm-4"><label class="mb-0" style="font-size:12px;">Цена (руб)</label>' +
            '<input type="number" class="form-control form-control-sm mat-v-price" min="0" step="0.01" value="' + escAttr(price) + '"></div></div>' +
            '</div>'
          );
        }
        function renderMaterialVariantBlocks(variants) {
          var list = document.getElementById('material-variants-list');
          if (!list) return;
          var arr = Array.isArray(variants) ? variants : [];
          if (!arr.length) arr = [getDefaultMaterialVariant()];
          syncVariantFromBasic(true);
          var ba = getBasicMaterialNameArticle();
          arr = arr.map(function (v) {
            var o = cloneVariantObj(v);
            if (!o.name) o.name = ba.name;
            if (!o.article) o.article = ba.article;
            return o;
          });
          list.innerHTML = arr.map(function (v, i) {
            return buildVariantBlockHtml(v, i, arr.length);
          }).join('');
          var hidden = document.getElementById('material-variants-hidden');
          if (hidden) hidden.value = JSON.stringify(arr);
        }
        function setMaterialVariants(arr) {
          renderMaterialVariantBlocks(Array.isArray(arr) ? arr : []);
        }
        window.__cldRenderMaterialVariants = renderMaterialVariantBlocks;

        function addMaterialVariantBlock() {
          syncVariantsToHidden();
          var arr = readVariantsFromDOM();
          if (!arr.length) arr = [getDefaultMaterialVariant()];
          var copy = cloneVariantObj(arr[0]);
          var ba = getBasicMaterialNameArticle();
          copy.name = ba.name;
          copy.article = ba.article;
          arr.push(copy);
          renderMaterialVariantBlocks(arr);
        }

        var matVariantsInputTimer = null;
        document.addEventListener('input', function (e) {
          if (!e.target || !e.target.closest) return;
          if (!e.target.closest('#material-variants-list')) return;
          clearTimeout(matVariantsInputTimer);
          matVariantsInputTimer = setTimeout(syncVariantsToHidden, 120);
        });
        document.addEventListener('change', function (e) {
          if (!e.target || !e.target.closest) return;
          if (!e.target.closest('#material-variants-list')) return;
          syncVariantsToHidden();
        });

        document.addEventListener('click', function (e) {
          if (!e.target || !e.target.closest) return;
          var list = document.getElementById('material-variants-list');
          if (!list || !e.target.closest('#material-variants-list')) {
            if (e.target.id === 'material-variant-add-btn' || (e.target.closest && e.target.closest('#material-variant-add-btn'))) {
              e.preventDefault();
              addMaterialVariantBlock();
            }
            return;
          }
          var block = e.target.closest('.material-variant-block');
          if (!block) return;
          var idx = parseInt(block.getAttribute('data-variant-idx'), 10);
          if (!isFinite(idx)) return;
          syncVariantsToHidden();
          var arr = readVariantsFromDOM();
          if (e.target.closest('.material-variant-del')) {
            if (arr.length <= 1) return;
            arr.splice(idx, 1);
            renderMaterialVariantBlocks(arr);
            return;
          }
          if (e.target.closest('.material-variant-up') && idx > 0) {
            var tmp = arr[idx - 1];
            arr[idx - 1] = arr[idx];
            arr[idx] = tmp;
            renderMaterialVariantBlocks(arr);
            return;
          }
          if (e.target.closest('.material-variant-down') && idx < arr.length - 1) {
            var tmp2 = arr[idx + 1];
            arr[idx + 1] = arr[idx];
            arr[idx] = tmp2;
            renderMaterialVariantBlocks(arr);
          }
        });

        function getMaterialEditFromHash() {
          var hash = (window.location.hash || '').replace(/^#/, '');
          if (hash.indexOf('material-item-edit') === -1) return null;
          var params = new URLSearchParams(hash.split('?')[1] || '');
          return { type: params.get('type') || '', id: params.get('id') || '0' };
        }
        function loadMaterialEdgesIntoList() {
          var q = getMaterialEditFromHash();
          if (!q || !q.type || q.id === '0') return;
          var setSelEl = document.getElementById('material-edge-set');
          fetch('/api/catalog/item/' + encodeURIComponent(q.type) + '/' + encodeURIComponent(q.id)).then(function (r) { return r.ok ? r.json() : null; }).then(function (item) {
            if (!item) return;
            // подгружаем сохранённые варианты (цены/размеры) для этого материала
            var variants = item.material_variants || item.variants || [];
            if (Array.isArray(variants) && variants.length > 0) {
              setMaterialVariants(variants);
            } else {
              renderMaterialVariantBlocks([getDefaultMaterialVariant()]);
            }
            syncVariantFromBasic(true);
            if (setSelEl && (item.edge_set || item.edgeSet)) setSelEl.value = (item.edge_set || item.edgeSet).toString();
            var ids = item.edge_ids || item.edgeIds || [];
            if (!Array.isArray(ids) || ids.length === 0) {
              setAssignedEdges([]);
              return;
            }
            var key = (setSelEl && setSelEl.value) ? setSelEl.value.trim() : 'butts';
            var type = 'butt_' + (key || 'butts');
            fetch('/api/catalog/items_get/' + encodeURIComponent(type)).then(function (r) { return r.ok ? r.json() : []; }).then(function (data) {
              var items = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
              var map = {};
              (items || []).forEach(function (it) { map[Number(it.id)] = it.name || it.article || 'ID ' + it.id; });
              var arr = ids.map(function (id) { return { id: Number(id), name: map[Number(id)] || 'ID ' + id }; });
              setAssignedEdges(arr);
            }).catch(function () { setAssignedEdges(ids.map(function (id) { return { id: Number(id), name: 'ID ' + id }; })); });
          }).catch(function () {});
        }
        document.addEventListener('click', function (e) {
          if (e.target && (e.target.getAttribute('href') === '#mat-item-tab-params' || (e.target.closest && e.target.closest('[href="#mat-item-tab-params"]')))) {
            setTimeout(loadMaterialEdgesIntoList, 100);
          }
        });
        // При переходе между материалами через hash (id меняется) — обязаны подгружать кромки/варианты заново,
        // иначе форма "наследует" значения предыдущего материала.
        function scheduleLoad() {
          try {
            var hidden = document.getElementById('material-variants-hidden');
            if (hidden) hidden.value = '[]';
            renderMaterialVariantBlocks([getDefaultMaterialVariant()]);
          } catch (e) {}
          try { setAssignedEdges([]); } catch (e) {}
          var setSelEl = document.getElementById('material-edge-set');
          if (setSelEl) setSelEl.value = 'butts';
          syncVariantFromBasic(true);
          setTimeout(loadMaterialEdgesIntoList, 80);
        }
        window.addEventListener('hashchange', function () {
          if ((window.location.hash || '').indexOf('material-item-edit') !== -1) scheduleLoad();
        });
        if (window.location.hash.indexOf('material-item-edit') !== -1) setTimeout(loadMaterialEdgesIntoList, 600);
      })();

      // --- Варианты кромки: стек блоков (add_variant = copy_object(variants[0])) ---
      (function initEdgeVariantsBlocks() {
        function escAttr(s) {
          return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;');
        }
        function cloneVariantObj(v) {
          try { return JSON.parse(JSON.stringify(v || {})); } catch (e) { return {}; }
        }
        function getBasicEdgeNameArticle() {
          var nameBasic = document.getElementById('edge-item-name');
          var artBasic = document.getElementById('edge-item-article');
          return {
            name: (nameBasic && nameBasic.value) ? nameBasic.value.trim() : '',
            article: (artBasic && artBasic.value) ? artBasic.value.trim() : '',
          };
        }
        window.__cldGetBasicEdgeNameArticle = getBasicEdgeNameArticle;

        function getDefaultEdgeVariant() {
          var ba = getBasicEdgeNameArticle();
          return {
            name: ba.name,
            article: ba.article,
            length: 5000,
            width: 18,
            thickness: 0.8,
            calc_type: 'per_mp',
            price_input_type: 'manual',
            price: null,
          };
        }

        function readVariantFromBlock(block) {
          if (!block) return null;
          var num = function (sel) {
            var el = block.querySelector(sel);
            if (!el || el.value === '') return null;
            var n = Number(el.value);
            return isFinite(n) ? n : null;
          };
          var str = function (sel) {
            var el = block.querySelector(sel);
            return el ? el.value.trim() : '';
          };
          return {
            name: str('.edge-v-name'),
            article: str('.edge-v-article'),
            length: num('.edge-v-length'),
            width: num('.edge-v-width'),
            thickness: num('.edge-v-thickness'),
            calc_type: (function () {
              var el = block.querySelector('.edge-v-calc');
              return el && el.value ? el.value : 'per_mp';
            })(),
            price_input_type: (function () {
              var el = block.querySelector('.edge-v-price-mode');
              return el && el.value ? el.value : 'manual';
            })(),
            price: num('.edge-v-price'),
          };
        }

        function readVariantsFromDOM() {
          var list = document.getElementById('edge-variants-list');
          if (!list) return [];
          var blocks = list.querySelectorAll('.edge-variant-block');
          var out = [];
          blocks.forEach(function (b) {
            var v = readVariantFromBlock(b);
            if (v) out.push(v);
          });
          return out;
        }
        window.__cldReadEdgeVariantsFromDOM = readVariantsFromDOM;

        function syncEdgeVariantsToHidden() {
          var hidden = document.getElementById('edge-variants-hidden');
          if (!hidden) return;
          syncEdgeVariantNamesFromBasic();
          hidden.value = JSON.stringify(readVariantsFromDOM());
        }
        window.__cldSyncEdgeVariantsToHidden = syncEdgeVariantsToHidden;

        function syncEdgeVariantNamesFromBasic(force) {
          var ba = getBasicEdgeNameArticle();
          var list = document.getElementById('edge-variants-list');
          if (!list) return;
          list.querySelectorAll('.edge-variant-block').forEach(function (block) {
            var nameEl = block.querySelector('.edge-v-name');
            var artEl = block.querySelector('.edge-v-article');
            if (nameEl && (force || !nameEl.value.trim())) nameEl.value = ba.name;
            if (artEl && (force || !artEl.value.trim())) artEl.value = ba.article;
          });
        }

        function buildVariantBlockHtml(v, idx, total) {
          var len = v.length != null ? v.length : '';
          var wid = v.width != null ? v.width : '';
          var th = v.thickness != null ? v.thickness : '';
          var price = v.price != null && v.price !== '' ? v.price : '';
          var calc = v.calc_type || 'per_mp';
          var priceMode = v.price_input_type || 'manual';
          var showDel = total > 1;
          var showUp = idx > 0;
          var showDown = idx < total - 1;
          return (
            '<div class="edge-variant-block mb-4" data-variant-idx="' + idx + '" style="padding:12px 50px 12px 12px;position:relative;border:1px solid #e5e7eb;border-radius:6px;background:#fafafa;">' +
            '<div class="variant_controls" style="position:absolute;right:5px;top:5px;display:flex;flex-direction:column;gap:4px;">' +
            (showDel ? '<button type="button" class="btn btn-sm btn-outline-danger edge-variant-del" title="Удалить"><i class="fa fa-trash"></i></button>' : '') +
            (showUp ? '<button type="button" class="btn btn-sm btn-outline-success edge-variant-up" title="Выше"><i class="fa fa-chevron-up"></i></button>' : '') +
            (showDown ? '<button type="button" class="btn btn-sm btn-outline-success edge-variant-down" title="Ниже"><i class="fa fa-chevron-down"></i></button>' : '') +
            '</div>' +
            '<div class="row mb-2">' +
            '<div class="col-sm-4"><label class="mb-0" style="font-size:12px;">Название</label>' +
            '<input type="text" class="form-control form-control-sm edge-v-name" value="' + escAttr(v.name || '') + '"></div>' +
            '<div class="col-sm-4"><label class="mb-0" style="font-size:12px;">Артикул</label>' +
            '<input type="text" class="form-control form-control-sm edge-v-article" value="' + escAttr(v.article || '') + '"></div>' +
            '<div class="col-sm-4"></div></div>' +
            '<div class="row mb-2">' +
            '<div class="col-sm-4"><label class="mb-0" style="font-size:12px;">Длина, мм</label>' +
            '<input type="number" class="form-control form-control-sm edge-v-length" min="0" step="1" value="' + escAttr(len) + '"></div>' +
            '<div class="col-sm-4"><label class="mb-0" style="font-size:12px;">Ширина, мм</label>' +
            '<input type="number" class="form-control form-control-sm edge-v-width" min="0" step="1" value="' + escAttr(wid) + '"></div>' +
            '<div class="col-sm-4"><label class="mb-0" style="font-size:12px;">Толщина, мм</label>' +
            '<input type="number" class="form-control form-control-sm edge-v-thickness" min="0" step="0.1" value="' + escAttr(th) + '"></div></div>' +
            '<div class="row mb-2">' +
            '<div class="col-sm-4"><label class="mb-0" style="font-size:12px;">Тип расчёта</label>' +
            '<select class="form-control form-control-sm edge-v-calc">' +
            '<option value="per_mp"' + (calc === 'per_mp' ? ' selected' : '') + '>р/п.м</option>' +
            '<option value="per_m2"' + (calc === 'per_m2' ? ' selected' : '') + '>р/м²</option></select></div>' +
            '<div class="col-sm-4"><label class="mb-0" style="font-size:12px;">Ввод цен</label>' +
            '<select class="form-control form-control-sm edge-v-price-mode">' +
            '<option value="manual"' + (priceMode === 'manual' ? ' selected' : '') + '>Ручной ввод</option>' +
            '<option value="import"' + (priceMode === 'import' ? ' selected' : '') + '>Импорт</option></select></div>' +
            '<div class="col-sm-4"><label class="mb-0" style="font-size:12px;">Цена (руб)</label>' +
            '<input type="number" class="form-control form-control-sm edge-v-price" min="0" step="0.01" value="' + escAttr(price) + '"></div></div>' +
            '</div>'
          );
        }

        function renderEdgeVariantBlocks(variants) {
          var list = document.getElementById('edge-variants-list');
          if (!list) return;
          var arr = Array.isArray(variants) ? variants : [];
          if (!arr.length) arr = [getDefaultEdgeVariant()];
          syncEdgeVariantNamesFromBasic(true);
          var ba = getBasicEdgeNameArticle();
          arr = arr.map(function (v) {
            var o = cloneVariantObj(v);
            if (!o.name) o.name = ba.name;
            if (!o.article) o.article = ba.article;
            return o;
          });
          list.innerHTML = arr.map(function (v, i) {
            return buildVariantBlockHtml(v, i, arr.length);
          }).join('');
          var hidden = document.getElementById('edge-variants-hidden');
          if (hidden) hidden.value = JSON.stringify(arr);
        }
        window.__cldRenderEdgeVariants = renderEdgeVariantBlocks;

        function addEdgeVariantBlock() {
          syncEdgeVariantsToHidden();
          var arr = readVariantsFromDOM();
          if (!arr.length) arr = [getDefaultEdgeVariant()];
          var copy = cloneVariantObj(arr[0]);
          var ba = getBasicEdgeNameArticle();
          copy.name = ba.name;
          copy.article = ba.article;
          arr.push(copy);
          renderEdgeVariantBlocks(arr);
        }

        document.addEventListener('cld-edge-item-edit-loaded', function (ev) {
          try {
            var item = ev && ev.detail ? ev.detail.item : null;
            var variants = [];
            if (item) {
              variants = Array.isArray(item.edge_variants)
                ? item.edge_variants
                : (Array.isArray(item.variants) ? item.variants : []);
            }
            if (!variants.length) {
              var hidden = document.getElementById('edge-variants-hidden');
              if (hidden && hidden.value) {
                try { variants = JSON.parse(hidden.value); } catch (e) { variants = []; }
              }
            }
            renderEdgeVariantBlocks(variants.length ? variants : [getDefaultEdgeVariant()]);
          } catch (e) {}
        });

        var edgeVariantsInputTimer = null;
        document.addEventListener('input', function (e) {
          if (!e.target || !e.target.closest) return;
          if (!e.target.closest('#edge-variants-list')) return;
          clearTimeout(edgeVariantsInputTimer);
          edgeVariantsInputTimer = setTimeout(syncEdgeVariantsToHidden, 120);
        });
        document.addEventListener('change', function (e) {
          if (!e.target || !e.target.closest) return;
          if (!e.target.closest('#edge-variants-list')) return;
          syncEdgeVariantsToHidden();
        });

        document.addEventListener('click', function (e) {
          if (!e.target || !e.target.closest) return;
          var list = document.getElementById('edge-variants-list');
          if (!list || !e.target.closest('#edge-variants-list')) {
            if (e.target.id === 'edge-variant-add-btn' || (e.target.closest && e.target.closest('#edge-variant-add-btn'))) {
              e.preventDefault();
              addEdgeVariantBlock();
            }
            return;
          }
          var block = e.target.closest('.edge-variant-block');
          if (!block) return;
          var idx = parseInt(block.getAttribute('data-variant-idx'), 10);
          if (!isFinite(idx)) return;
          syncEdgeVariantsToHidden();
          var arr = readVariantsFromDOM();
          if (e.target.closest('.edge-variant-del')) {
            if (arr.length <= 1) return;
            arr.splice(idx, 1);
            renderEdgeVariantBlocks(arr);
            return;
          }
          if (e.target.closest('.edge-variant-up') && idx > 0) {
            var tmp = arr[idx - 1];
            arr[idx - 1] = arr[idx];
            arr[idx] = tmp;
            renderEdgeVariantBlocks(arr);
            return;
          }
          if (e.target.closest('.edge-variant-down') && idx < arr.length - 1) {
            var tmp2 = arr[idx + 1];
            arr[idx + 1] = arr[idx];
            arr[idx] = tmp2;
            renderEdgeVariantBlocks(arr);
          }
        });

        var edgeNameEl = document.getElementById('edge-item-name');
        var edgeArtEl = document.getElementById('edge-item-article');
        if (edgeNameEl) edgeNameEl.addEventListener('input', function () { syncEdgeVariantNamesFromBasic(); });
        if (edgeArtEl) edgeArtEl.addEventListener('input', function () { syncEdgeVariantNamesFromBasic(); });
      })();

      // Панель управления видом 3D-превью в catalog-item-edit
      // Используем делегирование событий, чтобы работать даже когда DOM панели
      // появляется динамически (после смены hash).
      (function initConstructorViewToolbar() {
        function getConstructorWindow() {
          var previewBlock = document.getElementById('preview_block');
          if (previewBlock) {
            var iframeInPreview = previewBlock.querySelector('iframe');
            if (iframeInPreview && iframeInPreview.contentWindow) {
              return iframeInPreview.contentWindow;
            }
          }
          return window;
        }

        function toggleOutlineMode(isTransparent) {
          var targetWin = getConstructorWindow();
          if (!targetWin) return;

          var hasOutlineFlag = Object.prototype.hasOwnProperty.call(targetWin, 'outlineMode');
          var hasTransparentFlag = Object.prototype.hasOwnProperty.call(targetWin, 'transparentOutlineMode');

          if (!hasOutlineFlag && !hasTransparentFlag) {
            console.warn('[constructor-view-toolbar] Флаги outlineMode/transparentOutlineMode не найдены в окне конструктора');
          }

          if (isTransparent) {
            if (hasTransparentFlag) {
              var currentTransparent = !!targetWin.transparentOutlineMode;
              var nextTransparent = !currentTransparent;
              targetWin.transparentOutlineMode = nextTransparent;
              if (nextTransparent && hasOutlineFlag) {
                targetWin.outlineMode = true;
              }
            }
          } else {
            if (hasOutlineFlag) {
              var currentOutline = !!targetWin.outlineMode;
              var nextOutline = !currentOutline;
              targetWin.outlineMode = nextOutline;
              if (!nextOutline && hasTransparentFlag) {
                targetWin.transparentOutlineMode = false;
              }
            }
          }

          if (typeof targetWin.updateOutlineModes === 'function') {
            try {
              targetWin.updateOutlineModes();
            } catch (e) {
              console.error('[constructor-view-toolbar] Ошибка обновления режимов контура конструктора:', e);
            }
          }
          if (typeof targetWin.__cldRenderJointMarkers === 'function') {
            try {
              targetWin.__cldRenderJointMarkers();
            } catch (e2) {}
          }

          var outlineBtn = document.getElementById('constructor-btn-outline');
          var transparentBtn = document.getElementById('constructor-btn-transparent-outline');
          if (outlineBtn && hasOutlineFlag) {
            outlineBtn.classList.toggle('is-active', !!targetWin.outlineMode);
          }
          if (transparentBtn && hasTransparentFlag) {
            transparentBtn.classList.toggle('is-active', !!targetWin.transparentOutlineMode);
          }
        }

        function guessScreenshotIconAspect() {
          try {
            var subForm = document.getElementById('catalog-item-edit-sub-form');
            var vm = subForm && subForm.__vue__;
            var ia = vm && vm.item && vm.item.iconAspect;
            if (ia === 'low' || ia === 'short') return 'low';
            if (ia === 'tall') return 'tall';
          } catch (e) {}
          var hEl = document.getElementById('catalog-item-edit-height');
          var h = hEl ? Number(hEl.value) : NaN;
          if (Number.isFinite(h) && h > 0 && h <= 900) return 'low';
          return 'tall';
        }

        function pickScreenshotIconAspect() {
          return new Promise(function (resolve) {
            var suggested = guessScreenshotIconAspect();
            var old = document.getElementById('cld-screenshot-aspect-modal');
            if (old) old.remove();
            var modal = document.createElement('div');
            modal.id = 'cld-screenshot-aspect-modal';
            modal.style.cssText =
              'position:fixed;inset:0;z-index:100010;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;';
            var card = document.createElement('div');
            card.style.cssText =
              'background:#fff;border-radius:10px;padding:20px 22px;max-width:360px;box-shadow:0 12px 40px rgba(0,0,0,.2);font:14px/1.4 Arial,sans-serif;';
            card.innerHTML =
              '<div style="font-weight:700;font-size:16px;margin-bottom:8px;">Скрин для иконки каталога</div>' +
              '<p style="margin:0 0 14px;color:#444;">Выберите формат — в категории все иконки одного типа.</p>' +
              '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
              '<button type="button" data-aspect="tall" style="flex:1;min-width:120px;padding:10px 12px;border:1px solid #1976d2;' +
              (suggested === 'tall' ? 'background:#1976d2;color:#fff;' : 'background:#fff;color:#1976d2;') +
              'border-radius:6px;cursor:pointer;">Высокий (шкаф)</button>' +
              '<button type="button" data-aspect="low" style="flex:1;min-width:120px;padding:10px 12px;border:1px solid #1976d2;' +
              (suggested === 'low' ? 'background:#1976d2;color:#fff;' : 'background:#fff;color:#1976d2;') +
              'border-radius:6px;cursor:pointer;">Низкий (тумба/комод)</button>' +
              '</div>' +
              '<button type="button" data-aspect="cancel" style="margin-top:12px;padding:6px 10px;border:none;background:transparent;color:#666;cursor:pointer;">Отмена</button>';
            modal.appendChild(card);
            document.body.appendChild(modal);
            function done(val) {
              try { modal.remove(); } catch (e) {}
              resolve(val);
            }
            card.addEventListener('click', function (ev) {
              var btn = ev.target && ev.target.closest ? ev.target.closest('[data-aspect]') : null;
              if (!btn) return;
              var a = btn.getAttribute('data-aspect');
              if (a === 'cancel') return done(null);
              done(a === 'low' ? 'low' : 'tall');
            });
          });
        }

        document.addEventListener('click', function (e) {
          var t = e.target;
          if (!t || !(t.closest)) return;

          var resetBtn = t.closest('#constructor-btn-reset-camera');
          var outlineBtn = t.closest('#constructor-btn-outline');
          var transparentBtn = t.closest('#constructor-btn-transparent-outline');
          var screenshotBtn = t.closest('#constructor-btn-screenshot');
          var iconTuningBtn = t.closest('#constructor-btn-icon-tuning-dev');

          if (!resetBtn && !outlineBtn && !transparentBtn && !screenshotBtn && !iconTuningBtn) return;

          if (iconTuningBtn) {
            ensureCatalogIconTuningDevPanel(true);
            return;
          }

          var targetWin = getConstructorWindow();
          if (!targetWin) {
            console.warn('[constructor-view-toolbar] Нет окна конструктора (targetWin пустой)');
            return;
          }

          if (resetBtn) {
            console.log('[constructor-view-toolbar] Домик: клик по кнопке, пробуем вызвать resetCameraToDefault / resetView');
            // Выключаем режим прозрачных контуров при сбросе камеры
            if (typeof window._cldSetTransparentOutline === 'function') window._cldSetTransparentOutline(false);
            if (typeof targetWin.resetCameraToDefault === 'function') {
              console.log('[constructor-view-toolbar] Вызываем targetWin.resetCameraToDefault()');
              try {
                targetWin.resetCameraToDefault();
              } catch (e) {
                console.error('[constructor-view-toolbar] Ошибка в resetCameraToDefault:', e);
              }
            } else if (typeof targetWin.resetView === 'function') {
              console.log('[constructor-view-toolbar] resetCameraToDefault отсутствует, вызываем targetWin.resetView()');
              try {
                targetWin.resetView();
              } catch (e) {
                console.error('[constructor-view-toolbar] Ошибка в resetView:', e);
              }
            } else {
              console.warn('[constructor-view-toolbar] Ни resetCameraToDefault, ни resetView в окне конструктора не найдены');
            }
          } else if (outlineBtn) {
            console.log('[constructor-view-toolbar] Контур: клик, переключаем outlineMode');
            toggleOutlineMode(false);
          } else if (transparentBtn) {
            console.log('[constructor-view-toolbar] Прозрачные контуры: клик, переключаем transparentOutlineMode');
            toggleOutlineMode(true);
          } else if (screenshotBtn) {
            console.log('[constructor-view-toolbar] Скриншот: выбор формата иконки');
            pickScreenshotIconAspect().then(function (aspect) {
              if (!aspect) return;
              try { window.__cldPendingScreenshotIconAspect = aspect; } catch (e) {}
              try { targetWin.__cldScreenshotIconAspect = aspect; } catch (e) {}
              if (typeof targetWin.makeScreenshot === 'function') {
                try {
                  targetWin.makeScreenshot();
                } catch (e) {
                  console.error('[constructor-view-toolbar] Ошибка создания скриншота конструктора:', e);
                }
              } else {
                console.warn('[constructor-view-toolbar] Функция makeScreenshot конструктора не найдена');
              }
            });
          }
        }, true);

        // Логи из iframe конструктора — выводим в консоль AdminPanel
        window.addEventListener('message', function (ev) {
          var data = ev && ev.data;
          if (data && data.type === 'cld:log') {
            console.log('[iframe]', data.msg);
          }
        });

        /** DEV: превью иконки как в комнате (шаг 4) — убрать после настройки каталожного скрина. */
        function ensureCatalogIconRoomPreviewDev() {
          var root = document.getElementById('__cld_room_icon_preview_dev');
          if (root) return root;
          root = document.createElement('div');
          root.id = '__cld_room_icon_preview_dev';
          root.style.cssText = [
            'position:fixed',
            'bottom:20px',
            'right:20px',
            'z-index:99998',
            'background:#fff',
            'border:1px solid #e0e0e0',
            'border-radius:10px',
            'box-shadow:0 8px 28px rgba(0,0,0,0.12)',
            'padding:12px 14px',
            'font:12px/1.35 system-ui,sans-serif',
            'color:#333',
            'pointer-events:auto',
          ].join(';');
          root.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:8px;">' +
            '<strong style="font-size:13px;">Превью иконки</strong>' +
            '<button type="button" id="__cld_room_icon_preview_dev_close" style="border:0;background:#f3f4f6;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:11px;">Скрыть</button>' +
            '</div>' +
            '<div style="display:flex;align-items:flex-end;gap:16px;justify-content:center;">' +
            '<div style="text-align:center"><div style="color:#888;font-size:10px;margin-bottom:4px;">Карточка элемента</div><div id="__cld_room_icon_preview_admin"></div></div>' +
            '<div style="text-align:center"><div style="color:#888;font-size:10px;margin-bottom:4px;">Комната, шаг 4</div><div id="__cld_room_icon_preview_room"></div></div>' +
            '</div>' +
            '<div style="margin-top:8px;color:#666;font-size:10px;text-align:center;">Без сохранения и выгрузки — сразу после скрина.</div>';
          document.body.appendChild(root);
          var closeBtn = document.getElementById('__cld_room_icon_preview_dev_close');
          if (closeBtn) {
            closeBtn.addEventListener('click', function () {
              root.style.display = 'none';
            });
          }
          return root;
        }

        function updateCatalogIconRoomPreviewDev(url, aspect) {
          if (!url) return;
          var root = ensureCatalogIconRoomPreviewDev();
          root.style.display = 'block';
          var isLow = aspect === 'low';
          var adminSlot = document.getElementById('__cld_room_icon_preview_admin');
          var roomSlot = document.getElementById('__cld_room_icon_preview_room');
          if (!adminSlot || !roomSlot) return;

          function makeCard(w, aspectRatio) {
            var card = document.createElement('div');
            card.style.cssText =
              'width:' + w + 'px;aspect-ratio:' + aspectRatio + ';' +
              'border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;' +
              'background:#fff;box-sizing:border-box;padding:0 4px;';
            var img = document.createElement('img');
            img.src = url;
            img.alt = '';
            img.style.cssText =
              'width:100%;height:100%;object-fit:contain;object-position:center bottom;display:block;';
            card.appendChild(img);
            return card;
          }

          var ratio = isLow ? '3 / 2' : '1 / 2';
          adminSlot.innerHTML = '';
          roomSlot.innerHTML = '';
          adminSlot.appendChild(makeCard(78, ratio));
          roomSlot.appendChild(makeCard(100, ratio));
        }

        // Принимаем скриншот из iframe превью, сохраняем на сервер и делаем иконкой элемента
        window.addEventListener('message', function (ev) {
          var data = ev && ev.data;
          if (!data || typeof data !== 'object') return;
          if (data.type !== 'cld:screenshotReady') return;

          if (data.error || !data.dataUrl) {
            var errMsg = data.error || 'нет dataUrl';
            console.error('[constructor-view-toolbar] screenshot error:', errMsg);
            if (window.toastr) window.toastr.error('Скрин не создан: ' + errMsg + '. Ctrl+F5 и «Домик».');
            else alert('Скрин не создан: ' + errMsg);
            return;
          }

          try {
            try {
              console.log('[constructor-view-toolbar] screenshotReady smartFit=', !!data.smartFit);
            } catch (e) {}
            try { window.__lastScreenshotSmartFit = !!data.smartFit; } catch (e) {}
            // Небольшая плашка, чтобы визуально видеть режим скрина
            try {
              if (document && document.body) {
                var b = document.getElementById('__smartfit_badge');
                if (!b) {
                  b = document.createElement('div');
                  b.id = '__smartfit_badge';
                  b.style.cssText =
                    'position:fixed;top:34px;right:8px;z-index:99999;' +
                    'background:rgba(0,0,0,0.72);color:#fff;' +
                    'padding:4px 8px;border-radius:999px;font:12px/1 Arial,sans-serif;' +
                    'pointer-events:none;';
                  document.body.appendChild(b);
                }
                b.textContent = 'smart screenshot: ' + (data.smartFit ? 'ON' : 'OFF');
                clearTimeout(b.__t);
                b.__t = setTimeout(function () {
                  try { b.parentNode && b.parentNode.removeChild(b); } catch (e) {}
                }, 4000);
              }
            } catch (e) {}
            var iconContainer = document.getElementById('catalog-item-edit-icon');

            // Показываем превью сразу (из dataUrl), пока файл грузится на сервер.
            // Важно: в блоке иконки могут жить скрытые <img> и плейсхолдеры,
            // поэтому делаем жёсткую замену содержимого, чтобы не появлялись "две иконки".
            function setSingleIconPreview(url, aspect) {
              if (!iconContainer) return;
              var a = aspect === 'low' ? 'low' : 'tall';
              var previewH = a === 'low' ? 52 : 78;
              try {
                // Удаляем всё содержимое блока, затем добавляем один <img>.
                iconContainer.innerHTML = '';
              } catch (e) {}
              var previewImg = document.createElement('img');
              previewImg.src = url;
              previewImg.alt = 'Иконка';
              previewImg.style.cssText =
                'width:78px;height:' + previewH + 'px;object-fit:contain;border-radius:4px;display:block;';
              iconContainer.appendChild(previewImg);
            }

            var shotAspect = data.iconAspect || window.__cldPendingScreenshotIconAspect || 'tall';

            if (iconContainer) {
              setSingleIconPreview(data.dataUrl, shotAspect);
            }
            updateCatalogIconRoomPreviewDev(data.dataUrl, shotAspect);

            try {
              // Конвертируем dataUrl в Blob и загружаем на сервер в папку catalog_icons
              var byteString = atob(data.dataUrl.split(',')[1]);
              var ab = new ArrayBuffer(byteString.length);
              var ia = new Uint8Array(ab);
              for (var i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
              var blob = new Blob([ab], { type: 'image/png' });

              // Получаем ID текущего элемента, чтобы имя файла было уникальным
              var itemIdEl = document.getElementById('item_id');
              var itemId = (itemIdEl && itemIdEl.value) ? itemIdEl.value : 'new';
              var fileName = 'catalog_icon_' + itemId + '_' + Date.now() + '.png';

              var fd = new FormData();
              fd.append('path', 'catalog_icons');
              fd.append('file', blob, fileName);

              fetch('/api/files/upload', { method: 'POST', body: fd })
                .then(function (resp) { return resp.ok ? resp.json() : Promise.reject('upload error ' + resp.status); })
                .then(function (result) {
                  var fileUrl = result && result.files && result.files[0] && result.files[0].url;
                  if (!fileUrl) return;

                  // Обновляем превью на реальный URL (и гарантируем, что иконка одна)
                  if (iconContainer) {
                    setSingleIconPreview(fileUrl, shotAspect);
                  }
                  updateCatalogIconRoomPreviewDev(fileUrl, shotAspect);

                  // Пишем URL (не dataUrl!) в Vue-модель → при сохранении уйдёт на сервер
                  try {
                    var subForm = document.getElementById('catalog-item-edit-sub-form');
                    var vm = subForm && subForm.__vue__;
                    if (vm && vm.item) {
                      vm.item.icon = fileUrl;
                      vm.item.iconAspect = shotAspect;
                    }
                    window.__cldLastScreenshotIconUrl = fileUrl;
                  } catch (e) {
                    console.warn('[constructor-view-toolbar] Не удалось записать icon в Vue-модель:', e);
                  }
                  if (window.toastr) {
                    window.toastr.success('Иконка загружена. Нажмите «Сохранить», затем «Выгрузить в конструктор».');
                  }
                })
                .catch(function (e) {
                  console.error('[constructor-view-toolbar] Ошибка загрузки иконки на сервер:', e);
                });
            } catch (e) {
              console.error('[constructor-view-toolbar] Ошибка конвертации dataUrl в blob:', e);
            }
          } catch (e) {
            console.error('[constructor-view-toolbar] Ошибка обработки скриншота для иконки:', e);
          }
        });

        /** DEV: галочка вкл + ползунок интенсивности на каждый источник. */
        var CATALOG_ICON_LIGHT_SOURCES = [
          { onKey: 'iconAmbientOn', key: 'iconAmbient', label: 'Ambient', min: 0, max: 0.4, step: 0.01 },
          { onKey: 'hemiFillOn', key: 'hemiFill', label: 'Hemisphere', min: 0, max: 0.3, step: 0.01 },
          { onKey: 'studioOpeningOn', key: 'studioOpening', label: 'Проём (мягкий свет внутрь)', min: 0, max: 4, step: 0.05 },
          { onKey: 'studioKeyOn', key: 'studioKey', label: 'Key (мягкий, спереди)', min: 0, max: 1.2, step: 0.01 },
          { onKey: 'studioFillOn', key: 'studioFill', label: 'Fill (бок)', min: 0, max: 0.8, step: 0.01 },
          { onKey: 'studioBackFillOn', key: 'studioBackFill', label: 'В задник (тени полок)', min: 0, max: 0.8, step: 0.01 },
          { onKey: 'studioRimOn', key: 'studioRim', label: 'Rim (сзади)', min: 0, max: 0.6, step: 0.01 },
          { onKey: 'studioTopOn', key: 'studioTop', label: 'Top (полки)', min: 0, max: 0.8, step: 0.01 },
          { onKey: 'studioInnerOn', key: 'studioInner', label: 'Объём (центр корпуса)', min: 0, max: 1.2, step: 0.01 },
          { onKey: 'studioLowFillOn', key: 'studioLowFill', label: 'Снизу (нижние полки)', min: 0, max: 0.5, step: 0.01 },
          { onKey: 'useSceneEnvironment', key: 'whiteEnvIntensity', label: 'IBL HDR', min: 0.1, max: 1.2, step: 0.01 },
        ];

        var CATALOG_ICON_TUNING_SLIDER_GROUPS = [
          { group: 'Задник', items: [
            { key: 'cavityBackFrac', label: 'Глубина задника', min: 0.2, max: 0.7, step: 0.01 },
          ]},
          { group: 'Тон', items: [
            { key: 'toneMappingMode', label: 'Tone map (0 Lin / 1 Rein / 2 ACES)', min: 0, max: 2, step: 1 },
            { key: 'exposure', label: 'Экспозиция', min: 0.6, max: 2.2, step: 0.01 },
            { key: 'whiteRoughness', label: 'Шероховатость корпуса', min: 0.4, max: 1, step: 0.01 },
            { key: 'studioInnerEven', label: 'Равномерность полок (0 point / 1 камера)', min: 0, max: 1, step: 0.01 },
            { key: 'hemiGroundGray', label: 'Hemisphere снизу (светлее = ровнее)', min: 160, max: 255, step: 1 },
          ]},
          { group: 'SSAO', onKey: 'useIconSsao', items: [
            { key: 'ssaoKernelRadius', label: 'Радиус', min: 4, max: 24, step: 1 },
            { key: 'ssaoMaxDistance', label: 'Дистанция', min: 0.04, max: 0.2, step: 0.01 },
          ]},
        ];

        var _cldTuningPreviewTimer = null;

        function readTuningFromPanel(root) {
          var out = {};
          CATALOG_ICON_LIGHT_SOURCES.forEach(function (src) {
            var cb = root.querySelector('[data-tuning-on="' + src.onKey + '"]');
            if (cb) out[src.onKey] = cb.checked ? 1 : 0;
            var el = root.querySelector('[data-tuning-key="' + src.key + '"]');
            if (!el) return;
            var v = Number(el.value);
            if (!Number.isFinite(v)) return;
            if (src.step >= 1) v = Math.round(v);
            out[src.key] = v;
          });
          CATALOG_ICON_TUNING_SLIDER_GROUPS.forEach(function (grp) {
            if (grp.onKey) {
              var cb = root.querySelector('[data-tuning-on="' + grp.onKey + '"]');
              if (cb) out[grp.onKey] = cb.checked ? 1 : 0;
            }
            (grp.items || []).forEach(function (item) {
              var el = root.querySelector('[data-tuning-key="' + item.key + '"]');
              if (!el) return;
              var v = Number(el.value);
              if (!Number.isFinite(v)) return;
              if (item.step >= 1) v = Math.round(v);
              out[item.key] = v;
            });
          });
          return out;
        }

        function fillTuningPanel(root, values) {
          CATALOG_ICON_LIGHT_SOURCES.forEach(function (src) {
            var cb = root.querySelector('[data-tuning-on="' + src.onKey + '"]');
            if (cb) cb.checked = Number(values[src.onKey]) !== 0;
            var el = root.querySelector('[data-tuning-key="' + src.key + '"]');
            var valEl = root.querySelector('[data-tuning-val="' + src.key + '"]');
            if (!el) return;
            var v = values[src.key];
            if (v == null) v = src.min;
            el.value = String(v);
            if (valEl) valEl.textContent = String(v);
          });
          CATALOG_ICON_TUNING_SLIDER_GROUPS.forEach(function (grp) {
            if (grp.onKey) {
              var cb = root.querySelector('[data-tuning-on="' + grp.onKey + '"]');
              if (cb) cb.checked = Number(values[grp.onKey]) !== 0;
            }
            (grp.items || []).forEach(function (item) {
              var el = root.querySelector('[data-tuning-key="' + item.key + '"]');
              var valEl = root.querySelector('[data-tuning-val="' + item.key + '"]');
              if (!el) return;
              var v = values[item.key];
              if (v == null) v = item.min;
              el.value = String(v);
              if (valEl) valEl.textContent = String(v);
            });
          });
        }

        function scheduleCatalogIconTuningPreview(root) {
          clearTimeout(_cldTuningPreviewTimer);
          _cldTuningPreviewTimer = setTimeout(function () {
            pushCatalogIconTuningFromPanel(root, true, true);
          }, 220);
        }

        function pushCatalogIconTuningFromPanel(root, refresh, preserveView) {
          var win = getConstructorWindow();
          if (!win || typeof win.__cldSetCatalogIconTuning !== 'function') return;
          var patch = readTuningFromPanel(root);
          win.__cldSetCatalogIconTuning(patch);
          if (refresh && typeof win.__cldRefreshCatalogIconPreview === 'function') {
            try {
              win.__cldRefreshCatalogIconPreview({ preserveView: preserveView === true });
            } catch (e) {
              console.error('[catalog-icon-tuning-dev]', e);
            }
          }
        }

        function ensureCatalogIconTuningDevPanel(show) {
          var root = document.getElementById('__cld_catalog_icon_tuning_dev');
          if (!root) {
            root = document.createElement('div');
            root.id = '__cld_catalog_icon_tuning_dev';
            root.style.cssText = [
              'position:fixed',
              'left:16px',
              'bottom:16px',
              'z-index:99999',
              'width:320px',
              'max-height:78vh',
              'overflow:auto',
              'background:#fff',
              'border:2px solid #fdba74',
              'border-radius:10px',
              'box-shadow:0 10px 32px rgba(0,0,0,.14)',
              'padding:12px 14px',
              'font:11px/1.35 system-ui,sans-serif',
              'color:#333',
            ].join(';');

            var html = '';
            html += '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">';
            html += '<div><strong style="font-size:12px;color:#c2410c;">DEV — настройка иконки</strong>';
            html += '<div style="color:#888;font-size:10px;margin-top:2px;">Ползунки — интенсивность (пересборка света). Гизмо — сдвиг вручную, на PNG не влияет после ползунка. Домик — только кадр иконки. Сброс — дефолты панели.</div></div>';
            html += '<button type="button" id="__cld_catalog_icon_tuning_dev_close" style="border:0;background:#f3f4f6;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px;">✕</button>';
            html += '</div>';

            html += '<div style="margin:10px 0 6px;font-weight:600;font-size:11px;color:#555;">Источники света</div>';
            CATALOG_ICON_LIGHT_SOURCES.forEach(function (src) {
              html += '<div style="margin:0 0 10px;padding:8px 10px;background:#fafafa;border-radius:8px;border:1px solid #eee;">';
              html += '<label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;cursor:pointer;">';
              html += '<input type="checkbox" data-tuning-on="' + src.onKey + '" style="width:15px;height:15px;cursor:pointer;">';
              html += '<span style="flex:1;font-weight:500;">' + src.label + '</span>';
              html += '<span data-tuning-val="' + src.key + '" style="color:#888;font-variant-numeric:tabular-nums;min-width:36px;text-align:right;">0</span>';
              html += '</label>';
              html += '<input type="range" data-tuning-key="' + src.key + '" min="' + src.min + '" max="' + src.max + '" step="' + src.step + '" style="width:100%;">';
              html += '</div>';
            });

            CATALOG_ICON_TUNING_SLIDER_GROUPS.forEach(function (grp) {
              html += '<div style="margin:10px 0 6px;font-weight:600;font-size:11px;color:#555;">' + grp.group + '</div>';
              if (grp.onKey) {
                html += '<label style="display:flex;align-items:center;gap:8px;margin:0 0 8px;cursor:pointer;">';
                html += '<input type="checkbox" data-tuning-on="' + grp.onKey + '" style="width:15px;height:15px;cursor:pointer;">';
                html += '<span style="font-weight:500;">Включить ' + grp.group + '</span>';
                html += '</label>';
              }
              (grp.items || []).forEach(function (item) {
                html += '<label style="display:block;margin:0 0 8px;">';
                html += '<div style="display:flex;justify-content:space-between;margin-bottom:2px;">';
                html += '<span>' + item.label + '</span>';
                html += '<span data-tuning-val="' + item.key + '" style="color:#888;font-variant-numeric:tabular-nums;">0</span>';
                html += '</div>';
                html += '<input type="range" data-tuning-key="' + item.key + '" min="' + item.min + '" max="' + item.max + '" step="' + item.step + '" style="width:100%;">';
                html += '</label>';
              });
            });

            html += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">';
            html += '<button type="button" id="__cld_tuning_preview_btn" style="flex:1;min-width:120px;padding:7px 8px;border:1px solid #1976d2;background:#1976d2;color:#fff;border-radius:6px;cursor:pointer;">Превью</button>';
            html += '<button type="button" id="__cld_tuning_shot_btn" style="flex:1;min-width:120px;padding:7px 8px;border:1px solid #1976d2;background:#fff;color:#1976d2;border-radius:6px;cursor:pointer;">Скриншот</button>';
            html += '</div>';
            html += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">';
            html += '<button type="button" id="__cld_tuning_copy_btn" style="flex:1;min-width:120px;padding:6px 8px;border:1px solid #d1d5db;background:#f9fafb;border-radius:6px;cursor:pointer;">Копировать JSON</button>';
            html += '<button type="button" id="__cld_tuning_reset_btn" style="flex:1;min-width:120px;padding:6px 8px;border:1px solid #d1d5db;background:#f9fafb;border-radius:6px;cursor:pointer;">Сброс</button>';
            html += '</div>';
            html += '<button type="button" id="__cld_tuning_exit_btn" style="width:100%;margin-top:6px;padding:6px 8px;border:0;background:transparent;color:#666;cursor:pointer;">Выйти из превью</button>';
            root.innerHTML = html;
            document.body.appendChild(root);

            function onCatalogIconTuningPanelChange(ev) {
              var t = ev.target;
              if (!t || !t.matches) return;
              if (t.matches('[data-tuning-key]')) {
                var key = t.getAttribute('data-tuning-key');
                var valEl = root.querySelector('[data-tuning-val="' + key + '"]');
                if (valEl) valEl.textContent = t.value;
              }
              if (!t.matches('[data-tuning-key]') && !t.matches('[data-tuning-on]')) return;
              scheduleCatalogIconTuningPreview(root);
            }
            root.addEventListener('input', onCatalogIconTuningPanelChange);
            root.addEventListener('change', onCatalogIconTuningPanelChange);

            root.querySelector('#__cld_catalog_icon_tuning_dev_close').addEventListener('click', function () {
              root.style.display = 'none';
            });
            root.querySelector('#__cld_tuning_preview_btn').addEventListener('click', function () {
              pushCatalogIconTuningFromPanel(root, true, false);
            });
            root.querySelector('#__cld_tuning_shot_btn').addEventListener('click', function () {
              var aspect = guessScreenshotIconAspect();
              try { window.__cldPendingScreenshotIconAspect = aspect; } catch (e) {}
              pushCatalogIconTuningFromPanel(root, false);
              var win = getConstructorWindow();
              if (!win || typeof win.makeScreenshot !== 'function') return;
              try { win.__cldScreenshotIconAspect = aspect; } catch (e) {}
              try { win.makeScreenshot(); } catch (e) { console.error(e); }
            });
            root.querySelector('#__cld_tuning_copy_btn').addEventListener('click', function () {
              var patch = readTuningFromPanel(root);
              var text = JSON.stringify(patch, null, 2);
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).catch(function () {
                  window.prompt('Скопируйте JSON:', text);
                });
              } else {
                window.prompt('Скопируйте JSON:', text);
              }
            });
            root.querySelector('#__cld_tuning_reset_btn').addEventListener('click', function () {
              var win = getConstructorWindow();
              if (win && typeof win.__cldResetCatalogIconTuning === 'function') {
                win.__cldResetCatalogIconTuning();
              }
              var defaults = (win && typeof win.__cldCatalogIconTuningDefaults === 'function')
                ? win.__cldCatalogIconTuningDefaults()
                : {};
              fillTuningPanel(root, defaults);
              pushCatalogIconTuningFromPanel(root, true, false);
            });
            root.querySelector('#__cld_tuning_exit_btn').addEventListener('click', function () {
              var win = getConstructorWindow();
              if (win && typeof win.__cldExitCatalogIconPreview === 'function') {
                try { win.__cldExitCatalogIconPreview(); } catch (e) { console.error(e); }
              }
            });
          }

          var win = getConstructorWindow();
          var defaults = (win && typeof win.__cldGetCatalogIconTuning === 'function')
            ? win.__cldGetCatalogIconTuning()
            : (win && typeof win.__cldCatalogIconTuningDefaults === 'function'
              ? win.__cldCatalogIconTuningDefaults()
              : {});
          fillTuningPanel(root, defaults);
          if (show) {
            root.style.display = 'block';
            pushCatalogIconTuningFromPanel(root, true);
          }
          return root;
        }

        // Сброс инстанса Vue при переходе на другую карточку, чтобы старый dataUrl не утекал
        window.addEventListener('hashchange', function () {
          var hash = window.location.hash || '';
          if (hash.indexOf('catalog-item-edit') === -1) {
            var devPrev = document.getElementById('__cld_room_icon_preview_dev');
            if (devPrev) devPrev.style.display = 'none';
            var tuningDev = document.getElementById('__cld_catalog_icon_tuning_dev');
            if (tuningDev) tuningDev.style.display = 'none';
            try {
              var win = getConstructorWindow();
              if (win && typeof win.__cldExitCatalogIconPreview === 'function') {
                win.__cldExitCatalogIconPreview();
              }
            } catch (e) {}
            var iconContainer = document.getElementById('catalog-item-edit-icon');
            if (!iconContainer) return;
            var oldImg = iconContainer.querySelector('img');
            if (oldImg) oldImg.parentNode.removeChild(oldImg);
          }
        });
      })();

    })();
