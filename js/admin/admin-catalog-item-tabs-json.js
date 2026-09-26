/**
 * admin-catalog-item-tabs-json.js — Вкладка "JSON" в редакторе элемента каталога
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  /** catalog_29 — плоская полка 16 мм; s:y в JSON ломает превью (невидимый «куб» на всю высоту). */
  function normalizeFlatCatalogShelfInJsonPayload(data) {
    const walk = (nodes) => {
      if (!Array.isArray(nodes)) return;
      for (const n of nodes) {
        if (!n || typeof n !== 'object') continue;
        const t = String(n.type || '').toLowerCase();
        if (t === 'module') {
          const isFlat =
            typeof globalThis.__cldIsFlatCatalogShelfModule === 'function'
              ? globalThis.__cldIsFlatCatalogShelfModule(n)
              : false;
          if (isFlat) {
            const rawY = n.size?.y;
            const yNum = Number(rawY);
            n.size = {
              x: 's:x-32',
              y: Number.isFinite(yNum) && yNum > 0 && yNum < 120 ? Math.round(yNum) : 16,
              z: 's:z',
            };
            n.pos = n.pos && typeof n.pos === 'object' ? { ...n.pos } : {};
            if (
              n.pos.x === undefined ||
              n.pos.x === null ||
              n.pos.x === 0 ||
              String(n.pos.x).trim() === '' ||
              String(n.pos.x).replace(/\s+/g, '') === 's:x'
            ) {
              n.pos.x = 16;
            }
            if (n.spec && typeof n.spec === 'object') {
              delete n.spec.template_tree;
              delete n.spec.templates;
            }
            n.children = [];
            if (!n.layout_role && !n.sectionLayoutRole) n.layout_role = 'shelf';
          }
        }
        walk(n.children);
      }
    };
    if (Array.isArray(data)) walk(data);
    else if (data && typeof data === 'object') {
      if (Array.isArray(data.template?.structure)) walk(data.template.structure);
      else if (Array.isArray(data.children)) walk(data.children);
    }
    return data;
  }

  function getNodeDataClodisTree(nd) {
    if (!nd || typeof nd !== 'object') return null;
    if (typeof globalThis !== 'undefined' && typeof globalThis.__cldReadClodisJSON === 'function') {
      const tree = globalThis.__cldReadClodisJSON(nd);
      return Array.isArray(tree) && tree.length > 0 ? tree : null;
    }
    if (Array.isArray(nd.clodisJSON) && nd.clodisJSON.length > 0) return nd.clodisJSON;
    return null;
  }

  function initJsonTab() {
    const ta = document.getElementById('catalog-item-json-textarea');
    const btnRefresh = document.getElementById('catalog-item-json-refresh');
    const btnApply = document.getElementById('catalog-item-json-apply');
    const btnFormat = document.getElementById('catalog-item-json-format');
    const btnCopy = document.getElementById('catalog-item-json-copy');
    const btnDownload = document.getElementById('catalog-item-json-download');
    const btnUpload = document.getElementById('catalog-item-json-upload');
    const inpFile = document.getElementById('catalog-item-json-file');
    const statusEl = document.getElementById('catalog-item-json-status');
    if (!ta || !btnRefresh || !btnApply) return;
    if (window.__CLD_JSON_TAB_INITIALIZED) {
      try {
        const raw = String(ta.value || '').trim();
        if (!raw) btnRefresh.click();
      } catch {}
      return;
    }
    window.__CLD_JSON_TAB_INITIALIZED = true;

    // Ранее здесь хранился черновик JSON во всех модулях через localStorage.
    // Это мешало работе: новый модуль открывался с "чужим" JSON.
    // Сейчас JSON-вкладка всегда инициализируется из текущего конструктора,
    // без глобального черновика.
    const LS_KEY = 'cld:json_tab:draft';

    const setStatus = (text, kind) => {
      if (!statusEl) return;
      statusEl.textContent = text || '';
      statusEl.style.color = kind === 'ok' ? '#16a34a' : kind === 'err' ? '#dc2626' : '#6b7280';
    };

    const posToLineCol = (raw, pos) => {
      const upTo = raw.slice(0, Math.max(0, pos));
      const lines = upTo.split('\n');
      const line = lines.length;
      const col = (lines[lines.length - 1] || '').length + 1;
      return { line, col };
    };

    /** Имя из «Основные» → корневая section в Clodis (как при сохранении). */
    function applyCatalogDisplayNameToClodisPayload(payload) {
      if (payload == null) return;
      const nameInput = document.getElementById('catalog-item-edit-name');
      const displayName = nameInput ? String(nameInput.value || '').trim() : '';
      if (!displayName || typeof window.syncCatalogDisplayNameIntoConstructorTree !== 'function') return;
      try {
        window.syncCatalogDisplayNameIntoConstructorTree(payload, displayName);
      } catch (e) {
        console.warn('[JSON] не удалось подставить имя из формы в Clodis:', e);
      }
    }

    const validate = (raw) => {
      const txt = String(raw || '').trim();
      if (!txt) { setStatus('Пусто', 'muted'); return { ok: false, parsed: null }; }
      try {
        const parsed = JSON.parse(txt);
        setStatus('JSON валиден', 'ok');
        return { ok: true, parsed };
      } catch (e) {
        const msg = String(e?.message || e || '');
        const m = msg.match(/position\s+(\d+)/i);
        if (m) {
          const pos = Number(m[1]);
          if (Number.isFinite(pos)) {
            const lc = posToLineCol(txt, pos);
            setStatus(`Ошибка JSON (строка ${lc.line}, столбец ${lc.col})`, 'err');
            return { ok: false, parsed: null };
          }
        }
        setStatus('Ошибка JSON', 'err');
        return { ok: false, parsed: null };
      }
    };

    const refresh = (retryCount = 0) => {
      // Гарантируем, что конструктор инициализирован перед чтением JSON
      if (typeof window.getConstructorTreeJSON !== 'function') {
        // Пытаемся инициализировать конструктор, если он еще не готов
        try {
          if (typeof window.__cldInitConstructorTab === 'function') {
            window.__cldInitConstructorTab();
          } else if (typeof window.initConstructorTab === 'function') {
            window.initConstructorTab();
          }
        } catch (e) {
          console.warn('[JSON][refresh] Ошибка инициализации конструктора:', e);
        }

        // Если после попытки инициализации функция все еще недоступна — ждём и повторяем
        if (typeof window.getConstructorTreeJSON !== 'function') {
          if (retryCount < 30) {
            setTimeout(() => refresh(retryCount + 1), 100);
            if (retryCount === 0) {
              setStatus('Ожидание конструктора...', 'muted');
            }
            return;
          } else {
            ta.value = '';
            setStatus('Конструктор не готов', 'muted');
            return;
          }
        }
      }

      try {
        const rootModule = document.getElementById('constructor-root-module');
        const nodeTree = getNodeDataClodisTree(rootModule?.nodeData);
        const hasClodisJSON = !!(nodeTree && nodeTree.length);
        
        if (window.__CLD_DEBUG) {
          console.log('[JSON][refresh] Проверка данных:', {
            retryCount,
            hasClodisJSON,
            clodisJSONLength: hasClodisJSON ? nodeTree.length : 0,
            hasGetConstructorTreeJSON: typeof window.getConstructorTreeJSON === 'function',
          });
        }

        const tree = window.getConstructorTreeJSON() || {};

        // В Clodis JSON‑вкладка работает с "движковым" описанием модуля (section/wall),
        // а не с полным объектом constructor_structure. Поэтому:
        // 1. Если есть spec.template.tree или template.structure — показываем именно их (массив).
        // 2. Если структура пуста — показываем [].
        let payload = null;
        const tplTree = Array.isArray(tree.spec?.template?.tree) ? tree.spec.template.tree
                      : (Array.isArray(tree.template?.structure) ? tree.template.structure : null);

        if (Array.isArray(tplTree)) {
          payload = tplTree;
          if (window.__CLD_DEBUG) {
            console.log('[JSON][refresh] Используем tree.spec.template.tree или tree.template.structure:', { length: payload.length });
          }
        } else if (Array.isArray(tree) ) {
          // На случай, если конструктор уже вернул "голый" массив
          payload = tree;
          if (window.__CLD_DEBUG) {
            console.log('[JSON][refresh] Используем tree как массив:', { length: payload.length });
          }
        } else {
          // Если структура пуста, но это сохраненный модуль — проверяем, может данные еще загружаются
          if (hasClodisJSON && retryCount < 15) {
            // Данные есть в clodisJSON, но getConstructorTreeJSON еще не вернул их — ждём
            if (window.__CLD_DEBUG) {
              console.log('[JSON][refresh] clodisJSON найден, но getConstructorTreeJSON пуст. Повтор через 150мс...', {
                clodisJSONLength: nodeTree.length,
                retryCount,
              });
            }
            setTimeout(() => refresh(retryCount + 1), 150);
            if (retryCount === 0) {
              setStatus('Загрузка данных...', 'muted');
            }
            return;
          }
          
          // Если clodisJSON есть, но getConstructorTreeJSON не вернул его — используем clodisJSON напрямую
          if (hasClodisJSON) {
            payload = nodeTree;
            console.log('[JSON][refresh] ✅✅✅ Используем clodisJSON напрямую (getConstructorTreeJSON не вернул данные):', { 
              length: payload.length,
              firstItem: payload[0] ? { type: payload[0].type, name: payload[0].name } : null,
            });
          } else {
            // ⭐ КРИТИЧНО: Если clodisJSON ещё не готов, но это сохранённый модуль — ждём его появления
            // Это может быть проблема тайминга: JSON вкладка открывается до того, как loadConstructorTreeFromJSON завершит сохранение
            if (retryCount < 25 && !window.__CLD_IS_NEW_MODULE) {
              // Проверяем, может данные ещё загружаются
              setTimeout(() => refresh(retryCount + 1), 200);
              if (retryCount === 0 || retryCount % 5 === 0) {
                setStatus('Ожидание загрузки данных...', 'muted');
                console.log('[JSON][refresh] ⏳ clodisJSON ещё не готов, ожидаем загрузки... (retry ' + retryCount + '/25)');
              }
              return;
            }
            
            payload = [];
            console.warn('[JSON][refresh] ⚠️ Нет данных для отображения:', {
              hasTree: !!tree,
              treeKeys: Object.keys(tree || {}),
              hasClodisJSON: false,
              retryCount,
              isNewModule: window.__CLD_IS_NEW_MODULE,
              rootModuleExists: !!rootModule,
              rootModuleNodeDataExists: !!rootModule?.nodeData,
              rootModuleNodeDataKeys: rootModule?.nodeData ? Object.keys(rootModule.nodeData).slice(0, 10) : [],
            });
          }
        }

        if (Array.isArray(payload) && payload.length > 0) {
          applyCatalogDisplayNameToClodisPayload(payload);
        } else if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
          applyCatalogDisplayNameToClodisPayload(payload);
        }

        ta.value = JSON.stringify(payload != null ? payload : [], null, 2);
        try { localStorage.removeItem(LS_KEY); } catch {}
        validate(ta.value);
        if (Array.isArray(payload) && payload.length > 0) {
          console.log('[JSON] Вкладка JSON обновлена из конструктора, элементов:', payload.length);
        }
      } catch (e) {
        console.error('❌ [JSON] Не удалось собрать JSON из конструктора:', e);
        ta.value = '[]';
        setStatus('Не удалось собрать JSON', 'err');
      }
    };

    const format = () => {
      const raw = String(ta.value || '');
      const v = validate(raw);
      if (!v.ok) return;
      ta.value = JSON.stringify(v.parsed, null, 2);
      validate(ta.value);
    };

    const apply = () => {
      const raw = String(ta.value || '').trim();
      if (!raw) return;

      // Сначала проверяем, что JSON вообще парсится
      let parsed = null;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        console.error('❌ [JSON] Ошибка парсинга JSON при применении:', e);
        alert('Ошибка JSON: ' + (e?.message || e));
        validate(raw);
        return;
      }

      // ПланPlace‑формат допускает "голый" массив секций, loadConstructorTreeFromJSON
      // умеет с ним работать (сам оборачивает в { template.structure }).
      const treeData = normalizeFlatCatalogShelfInJsonPayload(parsed);
      applyCatalogDisplayNameToClodisPayload(treeData);
      ta.value = JSON.stringify(treeData, null, 2);
      validate(ta.value);

      const tryApplyToConstructor = (n) => {
        // Пытаемся инициализировать конструктор разными способами (в зависимости от того,
        // что уже есть на странице: старый inline initConstructorTab или новый admin-constructor.js)
        try {
          if (typeof window.__cldInitConstructorTab === 'function') {
            window.__cldInitConstructorTab();
          } else if (typeof window.initConstructorTab === 'function') {
            window.initConstructorTab();
          }
        } catch (e) {
          console.warn('[JSON] Ошибка инициализации конструктора перед применением JSON:', e);
        }

        if (typeof window.loadConstructorTreeFromJSON === 'function') {
          try {
            window.loadConstructorTreeFromJSON(treeData);
            if (typeof window.__ppPostModuleToIframe === 'function') {
              window.__ppPostModuleToIframe(true);
            }
            if (typeof toastr !== 'undefined') toastr.success('JSON применён в конструктор');
            setStatus('Применено', 'ok');
          } catch (e) {
            console.error('❌ [JSON] Ошибка применения JSON в конструктор:', e);
            alert('Ошибка применения JSON в конструктор: ' + (e?.message || e));
          }
          return;
        }

        if (n < 20) {
          // Конструктор ещё не успел создать loadConstructorTreeFromJSON — подождём и повторим
          setTimeout(() => tryApplyToConstructor(n + 1), 80);
        } else {
          console.warn('[JSON] Не удалось получить loadConstructorTreeFromJSON после ожидания');
          setStatus('Конструктор не готов', 'err');
        }
      };

      tryApplyToConstructor(0);
    };

    const copy = async () => {
      const raw = String(ta.value || '');
      if (!raw.trim()) return;
      try {
        await navigator.clipboard.writeText(raw);
        setStatus('Скопировано', 'ok');
      } catch {
        ta.focus();
        ta.select();
        try { document.execCommand('copy'); setStatus('Скопировано', 'ok'); } catch { setStatus('Не удалось скопировать', 'err'); }
        try { ta.setSelectionRange(0, 0); } catch {}
      }
    };

    const download = () => {
      const raw = String(ta.value || '').trim();
      if (!raw) return;
      const v = validate(raw);
      if (!v.ok) return;
      const blob = new Blob([JSON.stringify(v.parsed, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'constructor_structure.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus('Файл скачан', 'ok');
    };

    const uploadPick = () => {
      if (!inpFile) return;
      inpFile.value = '';
      inpFile.click();
    };

    const uploadHandle = async (file) => {
      if (!file) return;
      const text = await file.text();
      ta.value = text;
      const v = validate(ta.value);
      try { localStorage.setItem(LS_KEY, ta.value); } catch {}
      setStatus(`Загружено: ${file.name}`, 'ok');
      // Чтобы при сохранении ушёл загруженный JSON — применяем его в конструктор (clodisJSON + дерево)
      if (v.ok && v.parsed) {
        applyCatalogDisplayNameToClodisPayload(v.parsed);
        let treeArray = null;
        if (Array.isArray(v.parsed)) {
          treeArray = v.parsed;
        } else if (v.parsed && typeof v.parsed === 'object') {
          treeArray =
            v.parsed.template?.structure ??
            v.parsed.spec?.template?.tree ??
            null;
        }
        ta.value = JSON.stringify(v.parsed, null, 2);
        validate(ta.value);
        if (Array.isArray(treeArray)) {
          const rootModule = document.getElementById('constructor-root-module');
          if (rootModule) {
            rootModule.nodeData = rootModule.nodeData || {};
            rootModule.nodeData.clodisJSON = treeArray;
            if (typeof window.__cldInitConstructorTab === 'function') window.__cldInitConstructorTab();
            if (typeof window.loadConstructorTreeFromJSON === 'function') {
              window.loadConstructorTreeFromJSON({ template: { structure: treeArray } });
            }
            setStatus(`Загружено и применено в конструктор: ${file.name}`, 'ok');
          }
        }
      }
    };

    btnRefresh.onclick = refresh;
    btnApply.onclick = apply;
    if (btnFormat) btnFormat.onclick = format;
    if (btnCopy) btnCopy.onclick = copy;
    if (btnDownload) btnDownload.onclick = download;
    if (btnUpload) btnUpload.onclick = uploadPick;
    if (inpFile) {
      inpFile.addEventListener('change', (e) => {
        const f = e.target?.files?.[0];
        uploadHandle(f);
      });
    }

    // При вводе просто проверяем валидность — без сохранения глобального черновика
    ta.addEventListener('input', () => {
      const raw = String(ta.value || '');
      validate(raw);
    });

    // ⭐ КРИТИЧНО: Слушаем событие готовности clodisJSON
    // Это решает проблему тайминга, когда JSON вкладка открывается до завершения загрузки дерева
    window.addEventListener('cld:clodisJSONReady', () => {
      console.log('[JSON][event] Получено событие cld:clodisJSONReady, обновляем JSON вкладку');
      setTimeout(() => refresh(0), 100); // Небольшая задержка для гарантии
    });

    // Инициализация: всегда берём текущее состояние конструктора
    try {
      refresh();
    } catch {
      refresh();
    }
  }

  window.initJsonTab = initJsonTab;

})();
