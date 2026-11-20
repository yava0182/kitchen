// ============================================
// Модуль: Материалы 3D Моделей (model_key_material)
// Вынесено из admin-new.html для уменьшения размера основного файла
// ============================================

(function() {
  'use strict';

  const MODELS3D_MATERIALS_TYPE = 'model_key_material';
  const models3dMaterialsState = { allData: [], filtered: [], currentPage: 1, perPage: 20, total: 0 };
  let mkmPreview = null;
  let models3dMaterialsCategoryMap = Object.create(null); // { "<id>": "<name>" }

  // ============================================
  // Утилиты
  // ============================================
  function getModels3dCategory(item) {
    const c = item?.category;
    if (Array.isArray(c)) return (c[0] ?? '').toString();
    if (typeof c === 'string') {
      const trimmed = c.trim();
      if (!trimmed || trimmed === '[]') return '';
      if (trimmed[0] === '[') {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return (parsed[0] ?? '').toString();
        } catch (_) {}
      }
      return trimmed;
    }
    return (c ?? '').toString();
  }

  function getModels3dCategoryLabel(item) {
    const raw = getModels3dCategory(item).trim();
    if (!raw) return '';
    return models3dMaterialsCategoryMap[raw] || raw;
  }

  function renderModels3dCategorySelect(state, selectId, defaultLabel) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const cats = [...new Set((state.allData || []).map(it => getModels3dCategory(it).trim()).filter(Boolean))]
      .sort((a, b) => (models3dMaterialsCategoryMap[a] || a).localeCompare((models3dMaterialsCategoryMap[b] || b), 'ru'));
    const opts = `<option value="">${defaultLabel}</option>` + cats
      .map(c => `<option value="${(c || '').replace(/"/g, '&quot;')}">${(models3dMaterialsCategoryMap[c] || c)}</option>`)
      .join('');
    const cur = sel.value || '';
    sel.innerHTML = opts;
    if (cur) sel.value = cur;
  }

  function renderModels3dPagination(state, totalItems, topId, bottomId, fromId, toId, totalId, onPageChange) {
    const top = document.getElementById(topId);
    const bottom = document.getElementById(bottomId);
    const fromEl = document.getElementById(fromId);
    const toEl = document.getElementById(toId);
    const totalEl = document.getElementById(totalId);
    if (!top || !bottom) return;
    const perPage = state.perPage || 20;
    const currentPage = state.currentPage || 1;
    const totalPages = Math.max(1, Math.ceil((totalItems || 0) / perPage));
    const start = totalItems ? (currentPage - 1) * perPage + 1 : 0;
    const end = totalItems ? Math.min(currentPage * perPage, totalItems) : 0;
    if (fromEl) fromEl.textContent = String(start);
    if (toEl) toEl.textContent = String(end);
    if (totalEl) totalEl.textContent = String(totalItems || 0);
    const mk = (host) => {
      let html = '';
      html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="1">&lt;&lt;</a></li>`;
      html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage - 1}">&lt;</a></li>`;
      for (let p = Math.max(1, currentPage - 2); p <= Math.min(totalPages, currentPage + 2); p++) {
        html += `<li class="page-item ${p === currentPage ? 'active' : ''}"><a class="page-link" href="#" data-page="${p}">${p}</a></li>`;
      }
      html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage + 1}">&gt;</a></li>`;
      html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${totalPages}">&gt;&gt;</a></li>`;
      host.innerHTML = html;
      host.querySelectorAll('a.page-link').forEach(a => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          const p = parseInt(a.getAttribute('data-page') || '0', 10);
          if (p >= 1 && p <= totalPages) {
            state.currentPage = p;
            onPageChange();
          }
        });
      });
    };
    mk(top);
    mk(bottom);
  }

  function mkIconCellHtml(item) {
    const iconUrl = (item?.icon || item?.image || '').toString();
    const colorVal = (item?.color || '').toString().trim();
    if (iconUrl) {
      return `<img class="admin-list-thumb" src="${iconUrl}" alt="" onerror="this.style.display='none'">`;
    }
    if (colorVal && /^#([0-9A-Fa-f]{6})$/.test(colorVal)) {
      return `<div class="admin-list-thumb-empty" style="background:${colorVal};"></div>`;
    }
    return '<div class="admin-list-thumb-empty"></div>';
  }

  function parseMaybeJson(v, fallback) {
    try {
      if (v == null) return fallback;
      if (typeof v === 'object') return v;
      const s = String(v).trim();
      if (!s) return fallback;
      return JSON.parse(s);
    } catch (_) {
      return fallback;
    }
  }

  function getSelectedValues(selectEl) {
    if (!selectEl) return [];
    return Array.from(selectEl.options).filter(o => o.selected).map(o => o.value);
  }

  function setSelectedValues(selectEl, values) {
    if (!selectEl) return;
    const set = new Set((values || []).map(String));
    Array.from(selectEl.options).forEach(o => { o.selected = set.has(String(o.value)); });
  }

  function setPreviewBox(boxId, url) {
    const box = document.getElementById(boxId);
    if (!box) return;
    const u = (url || '').toString().trim();
    if (!u) {
      box.innerHTML = `<span style="color:#ccc; font-size:12px;">нет</span>`;
      return;
    }
    const safe = u.replace(/"/g, '&quot;');
    box.innerHTML = `<img src="${safe}" style="width:100%; height:100%; object-fit:cover; display:block;" />`;
  }

  function disposeObject3D(obj) {
    if (!obj) return;
    if (obj.children) {
      [...obj.children].forEach(disposeObject3D);
    }
    if (obj.geometry) {
      try { obj.geometry.dispose(); } catch (_) {}
    }
    if (obj.material) {
      try {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat) => {
          if (!mat) return;
          ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'alphaMap'].forEach((prop) => {
            try { mat[prop]?.dispose?.(); } catch (_) {}
          });
          mat.dispose?.();
        });
      } catch (_) {}
    }
  }

  function destroyMkmViewportPreview() {
    if (!mkmPreview || mkmPreview.disabled === true) {
      mkmPreview = null;
      return;
    }
    try { cancelAnimationFrame(mkmPreview.raf || 0); } catch (_) {}
    try { window.removeEventListener('resize', mkmPreview.onResize); } catch (_) {}
    try { disposeObject3D(mkmPreview.scene); } catch (_) {}
    try { mkmPreview.envRT?.dispose?.(); } catch (_) {}
    try {
      const el = mkmPreview.renderer?.domElement;
      const gl = mkmPreview.renderer?.getContext?.();
      gl?.getExtension?.('WEBGL_lose_context')?.loseContext?.();
      if (el?.parentNode) el.parentNode.removeChild(el);
      mkmPreview.renderer?.dispose?.();
    } catch (_) {}
    mkmPreview = null;
  }

  window.addEventListener('pagehide', destroyMkmViewportPreview);
  window.addEventListener('beforeunload', destroyMkmViewportPreview);

  /** Metalness=1 has no diffuse — without IBL the sphere is black. Studio box → PMREM. */
  function createMkmStudioEnvMap(renderer, THREE) {
    const envScene = new THREE.Scene();
    const addWall = (w, h, color, x, y, z, rotX, rotY) => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
      );
      mesh.position.set(x, y, z);
      mesh.rotation.set(rotX || 0, rotY || 0, 0);
      envScene.add(mesh);
    };
    addWall(8, 8, 0xf2f2f0, 0, 0, -4, 0, 0);
    addWall(8, 8, 0xe6e6e4, 0, 0, 4, 0, Math.PI);
    addWall(8, 8, 0xeeeeec, -4, 0, 0, 0, Math.PI / 2);
    addWall(8, 8, 0xffffff, 4, 0, 0, 0, -Math.PI / 2);
    addWall(8, 8, 0xffffff, 0, 4, 0, Math.PI / 2, 0);
    addWall(8, 8, 0xc4c4c0, 0, -4, 0, -Math.PI / 2, 0);
    const windowPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 3.4),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    windowPanel.position.set(3.55, 1.15, -1.1);
    windowPanel.rotation.y = -Math.PI / 2;
    envScene.add(windowPanel);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const rt = pmrem.fromScene(envScene, 0.04);
    pmrem.dispose();
    envScene.traverse((o) => {
      try { o.geometry?.dispose?.(); } catch (_) {}
      try { o.material?.dispose?.(); } catch (_) {}
    });
    return rt;
  }

  function initMkmViewportPreview() {
    const host = document.getElementById('mkm-viewport');
    if (!host || mkmPreview) return;
    if (!window.THREE) return;

    const THREE = window.THREE;
    const w = Math.max(240, host.clientWidth || 360);
    const h = Math.max(240, host.clientHeight || 360);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);

    const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
    camera.position.set(0, 0.15, 2.2);
    camera.lookAt(0, 0, 0);

    let renderer = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
      else if (THREE.sRGBEncoding != null) renderer.outputEncoding = THREE.sRGBEncoding;
      if (THREE.ACESFilmicToneMapping != null) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
      }
      host.innerHTML = '';
      host.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('[admin-models3d-materials] WebGL preview disabled:', e);
      mkmPreview = { disabled: true };
      return;
    }

    let envRT = null;
    try {
      envRT = createMkmStudioEnvMap(renderer, THREE);
      scene.environment = envRT.texture;
    } catch (e) {
      console.warn('[admin-models3d-materials] studio env failed:', e);
    }

    const lightD = new THREE.DirectionalLight(0xffffff, 0.55);
    lightD.position.set(1.5, 2, 2);
    scene.add(lightD);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 48, 48),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.1 })
    );
    sphere.position.set(0, 0.02, 0);
    scene.add(sphere);

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xdfdfdf, roughness: 1, metalness: 0 })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.45;
    scene.add(plane);

    let lastW = w;
    let lastH = h;
    const onResize = () => {
      if (!host || !renderer || !camera) return;
      const nw = Math.max(240, host.clientWidth || 360);
      const nh = Math.max(240, host.clientHeight || 360);
      if (nw === lastW && nh === lastH) return;
      lastW = nw;
      lastH = nh;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      camera.lookAt(0, 0, 0);
    };
    window.addEventListener('resize', onResize);

    const animate = () => {
      if (!mkmPreview) return;
      // Keep preview centered when container size becomes known after layout/hash navigation.
      onResize();
      sphere.rotation.y += 0.005;
      renderer.render(scene, camera);
      mkmPreview.raf = requestAnimationFrame(animate);
    };

    mkmPreview = { THREE, host, scene, camera, renderer, sphere, plane, envRT, onResize, raf: 0 };
    animate();
  }

  function updateMkmViewportMaterialPreview() {
    if (!mkmPreview) initMkmViewportPreview();
    if (!mkmPreview) return;
    if (mkmPreview.disabled === true) return;
    const THREE = mkmPreview.THREE;
    const mat = mkmPreview.sphere.material;
    if (!mat) return;

    const color = (document.getElementById('mkm-color')?.value || '#ffffff').toString().trim() || '#ffffff';
    const roughness = Math.max(0, Math.min(1, Number(document.getElementById('mkm-roughness')?.value ?? 0.5)));
    const metalness = Math.max(0, Math.min(1, Number(document.getElementById('mkm-metalness')?.value ?? 0.1)));
    const transparent = !!document.getElementById('mkm-transparent')?.checked;
    const opacity = Math.max(0, Math.min(1, Number(document.getElementById('mkm-opacity')?.value ?? 1)));
    const textureUrl = (document.getElementById('mkm-texture-url')?.value || '').toString().trim();
    const normalUrl = (document.getElementById('mkm-normal-url')?.value || '').toString().trim();
    const roughnessMapUrl = (document.getElementById('mkm-roughmap-url')?.value || '').toString().trim();

    // Декор = вид. Цвет карточки — только если карты нет / не загрузилась.
    mat.color.set(textureUrl ? '#ffffff' : color);
    mat.roughness = roughness;
    mat.metalness = metalness;
    mat.transparent = transparent;
    mat.opacity = transparent ? opacity : 1;

    const loader = new THREE.TextureLoader();
    const assignMap = (prop, url) => {
      if (mat[prop]) {
        try { mat[prop].dispose(); } catch (_) {}
        mat[prop] = null;
      }
      if (!url) return;
      loader.load(url, (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        if ('colorSpace' in tex && THREE.SRGBColorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
        mat[prop] = tex;
        if (prop === 'map') mat.color.set('#ffffff');
        mat.needsUpdate = true;
      }, undefined, () => {
        if (prop === 'map') mat.color.set(color);
        mat.needsUpdate = true;
      });
    };
    assignMap('map', textureUrl);
    assignMap('normalMap', normalUrl);
    assignMap('roughnessMap', roughnessMapUrl);

    mat.needsUpdate = true;
    mkmPreview.renderer.render(mkmPreview.scene, mkmPreview.camera);
  }

  // ============================================
  // Загрузка списка материалов 3D моделей
  // ============================================
  async function loadModels3dMaterials() {
    const tbody = document.getElementById('models3d-materials-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">Загрузка...</td></tr>';
    try {
      try {
        const cResp = await fetch(`/api/catalog/categories_get/${encodeURIComponent(MODELS3D_MATERIALS_TYPE)}?t=${Date.now()}`, { cache: 'no-cache' });
        if (cResp.ok) {
          const cData = await cResp.json();
          const cArr = Array.isArray(cData) ? cData : (Array.isArray(cData?.items) ? cData.items : []);
          const map = Object.create(null);
          cArr.forEach((c) => {
            const id = String(c?.id ?? '').trim();
            const name = String(c?.name ?? '').trim();
            if (id && name) map[id] = name;
          });
          models3dMaterialsCategoryMap = map;
        }
      } catch (_) {}

      const page = models3dMaterialsState.currentPage || 1;
      const perPage = models3dMaterialsState.perPage || 20;
      const q = (document.getElementById('models3d-materials-search-input')?.value || '').toString().trim();
      const cat = (document.getElementById('models3d-materials-category-filter')?.value || '').toString().trim();
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('per_page', String(perPage));
      if (q) params.set('q', q);
      if (cat) params.set('category', cat);
      params.set('t', String(Date.now()));
      const resp = await fetch(`/api/catalog/items_get/${encodeURIComponent(MODELS3D_MATERIALS_TYPE)}?${params.toString()}`, { cache: 'no-cache' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      models3dMaterialsState.allData = items;
      models3dMaterialsState.filtered = items;
      models3dMaterialsState.total = Number(data?.count ?? items.length) || items.length;
      renderModels3dCategorySelect(models3dMaterialsState, 'models3d-materials-category-filter', 'Все');
      renderModels3dMaterialsTable();
    } catch (e) {
      console.error('❌ Ошибка загрузки материалов 3D моделей:', e);
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#999;">Ошибка загрузки</td></tr>';
      renderModels3dPagination(models3dMaterialsState, 0, 'models3d-materials-pagination-top', 'models3d-materials-pagination-bottom', 'models3d-materials-from', 'models3d-materials-to', 'models3d-materials-total', () => {});
    }
  }

  function renderModels3dMaterialsTable() {
    const tbody = document.getElementById('models3d-materials-table-body');
    if (!tbody) return;
    const data = Array.isArray(models3dMaterialsState.allData) ? models3dMaterialsState.allData : [];
    tbody.innerHTML = '';
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#999;">Нет данных</td></tr>';
      renderModels3dPagination(models3dMaterialsState, 0, 'models3d-materials-pagination-top', 'models3d-materials-pagination-bottom', 'models3d-materials-from', 'models3d-materials-to', 'models3d-materials-total', () => { models3dMaterialsState.currentPage = 1; loadModels3dMaterials(); });
      return;
    }
    for (const item of data) {
      const active = (item?.active ?? 1) == 1 || item?.active === true || item?.active === '1';
      const visHtml = active
        ? '<button type="button" class="btn btn-xs btn-outline btn-success" title="Видим"><i class="fa fa-eye"></i></button>'
        : '<button type="button" class="btn btn-xs btn-outline btn-default" title="Скрыт"><i class="fa fa-eye-slash"></i></button>';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="checkbox" class="models3d-materials-checkbox" value="${item?.id ?? ''}"></td>
        <td>${item?.id ?? '-'}</td>
        <td class="col-icon">${mkIconCellHtml(item)}</td>
        <td>${(item?.name || '-').toString().replace(/</g, '&lt;')}</td>
        <td>${(getModels3dCategoryLabel(item) || 'Нет').toString().replace(/</g, '&lt;')}</td>
        <td class="col-order">${String(item?.order ?? item?.sort ?? 10000)}</td>
        <td class="col-vis">${visHtml}</td>
        <td class="col-actions">
          <div class="cld-row-actions">
            <button type="button" class="btn btn-xs btn-outline btn-primary" title="Редактировать" data-m3m-action="edit" data-m3m-id="${item?.id ?? 0}" data-m3m-name="${(item?.name || '').replace(/"/g, '&quot;')}"><i class="fa fa-pencil"></i></button>
            <button type="button" class="btn btn-xs btn-outline btn-info" title="Копировать" data-m3m-action="copy" data-m3m-id="${item?.id ?? 0}" data-m3m-name="${(item?.name || '').replace(/"/g, '&quot;')}"><i class="fa fa-link"></i></button>
            <button type="button" class="btn btn-xs btn-outline btn-danger" title="Удалить" data-m3m-action="delete" data-m3m-id="${item?.id ?? 0}" data-m3m-name="${(item?.name || '').replace(/"/g, '&quot;')}"><i class="fa fa-trash"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    }
    renderModels3dPagination(models3dMaterialsState, models3dMaterialsState.total || data.length, 'models3d-materials-pagination-top', 'models3d-materials-pagination-bottom', 'models3d-materials-from', 'models3d-materials-to', 'models3d-materials-total', () => { loadModels3dMaterials(); });
  }

  function openModels3dMaterialEdit(itemId) {
    const hash = itemId ? `#model-key-material-edit?id=${encodeURIComponent(String(itemId))}` : '#model-key-material-edit';
    if (window.location.hash !== hash) window.location.hash = hash;
    loadModelKeyMaterialEdit(itemId || 0);
  }

  async function deleteModels3dMaterial(itemId, itemName) {
    if (!confirm(`Удалить материал "${itemName}"?`)) return;
    try {
      const resp = await fetch(`/api/catalog/item_delete/${encodeURIComponent(MODELS3D_MATERIALS_TYPE)}/${encodeURIComponent(String(itemId))}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      if (window.toastr) window.toastr.success('Удалено');
      await loadModels3dMaterials();
    } catch (e) {
      console.error('❌ Ошибка удаления материала 3D:', e);
      alert('Ошибка удаления');
    }
  }

  async function copyModels3dMaterial(itemId) {
    try {
      const resp = await fetch(`/api/catalog/item/${encodeURIComponent(MODELS3D_MATERIALS_TYPE)}/${encodeURIComponent(String(itemId))}?t=${Date.now()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const item = await resp.json();
      const copy = { ...item, id: 0, name: `${item?.name || 'Материал'} (копия)` };
      const addResp = await fetch(`/api/catalog/item_add/${encodeURIComponent(MODELS3D_MATERIALS_TYPE)}/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(copy) });
      if (!addResp.ok) throw new Error(`HTTP ${addResp.status}`);
      if (window.toastr) window.toastr.success('Скопировано');
      await loadModels3dMaterials();
    } catch (e) {
      console.error('❌ Ошибка копирования материала 3D:', e);
      alert('Ошибка копирования');
    }
  }

  // ============================================
  // Загрузка/сохранение формы редактирования
  // ============================================
  async function loadModelKeyMaterialEdit(id) {
    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById('model-key-material-edit');
    if (page) page.classList.add('active');

    const title = document.getElementById('mkm-edit-title');
    if (title) title.textContent = (id ? 'Редактировать ключ-материал 3D Модели' : 'Добавить ключ-материал 3D Модели');

    const idEl = document.getElementById('mkm_item_id');
    if (idEl) idEl.value = id ? String(id) : '0';

    const cancel = document.getElementById('cancel-mkm-btn');
    if (cancel) cancel.setAttribute('href', '#models3d-materials');

    // Инициализация Vue для категорий (v-select) - делаем после того как страница стала активной
    await new Promise(resolve => setTimeout(resolve, 50)); // Небольшая задержка для рендера DOM
    if (typeof window.initModelKeyMaterialVue === 'function') {
      window.initModelKeyMaterialVue();
    }
    
    // Загрузка категорий в Vue и синхронизация с нативным select
    const catSelect = document.getElementById('mkm-category');
    const vueApp = window.mkmVueApp;
    
    if (vueApp && catSelect) {
      try {
        const res = await fetch(`/api/catalog/categories_get/${encodeURIComponent(MODELS3D_MATERIALS_TYPE)}?t=${Date.now()}`, { cache: 'no-cache' });
        const cats = await res.json();
        const arr = Array.isArray(cats) ? cats : (cats?.items || []);
        vueApp.categoriesOptions = arr.map(c => ({ id: String(c.id), name: (c.name || '').toString() }));
        
        // Синхронизация: при изменении в Vue обновляем нативный select
        vueApp.$watch('form.categories', function(newVal) {
          if (!catSelect) return;
          const set = new Set((newVal || []).map(String));
          Array.from(catSelect.options).forEach(o => {
            o.selected = set.has(String(o.value));
          });
        });
        
        // Заполняем нативный select для совместимости
        catSelect.innerHTML = '';
        const opts = arr.map(c => `<option value="${String(c.id).replace(/"/g, '&quot;')}">${(c.name || '').toString()}</option>`).join('');
        catSelect.innerHTML = opts || '';
      } catch (_) {
        vueApp.categoriesOptions = [];
        if (catSelect) catSelect.innerHTML = '';
      }
    } else if (catSelect) {
      // Fallback: если Vue не загрузился, используем нативный select
      catSelect.style.display = '';
      catSelect.removeAttribute('size');
      try {
        const res = await fetch(`/api/catalog/categories_get/${encodeURIComponent(MODELS3D_MATERIALS_TYPE)}?t=${Date.now()}`, { cache: 'no-cache' });
        const cats = await res.json();
        const arr = Array.isArray(cats) ? cats : (cats?.items || []);
        const opts = arr.map(c => `<option value="${String(c.id).replace(/"/g, '&quot;')}">${(c.name || '').toString()}</option>`).join('');
        catSelect.innerHTML = opts || '';
      } catch (_) {
        catSelect.innerHTML = '';
      }
    }

    const setVal = (key, v) => { const el = document.getElementById(key); if (el) el.value = v ?? ''; };
    const setChk = (key, v) => { const el = document.getElementById(key); if (el) el.checked = !!v; };

    // defaults
    setVal('mkm-name', '');
    setVal('mkm-key', '');
    setChk('mkm-active', true);
    setVal('mkm-order', '10000');
    setVal('mkm-mode', '0');
    setVal('mkm-color', '#ffffff');
    setVal('mkm-color-picker', '#ffffff');
    setVal('mkm-roughness', '0.5');
    setVal('mkm-metalness', '0.1');
    setChk('mkm-transparent', false);
    setVal('mkm-opacity', '1');
    const opRow = document.getElementById('mkm-opacity-row');
    if (opRow) opRow.style.display = 'none';
      setVal('mkm-texture-url', '');
      setVal('mkm-normal-url', '');
      setVal('mkm-roughmap-url', '');
      setPreviewBox('mkm-texture-preview', '');
      setPreviewBox('mkm-normal-preview', '');
      setPreviewBox('mkm-roughmap-preview', '');
      setChk('mkm-stretch-width', false);
      setChk('mkm-stretch-height', false);
      setVal('mkm-real-width', '256');
      setVal('mkm-real-height', '256');
      setChk('mkm-one-sided', false);

      // Сбрасываем категории в Vue
      if (window.mkmVueApp) {
        window.mkmVueApp.form.categories = [];
      }

      if (!id) return;

    try {
      const res = await fetch(`/api/catalog/item_get/${encodeURIComponent(MODELS3D_MATERIALS_TYPE)}/${encodeURIComponent(String(id))}?t=${Date.now()}`, { cache: 'no-cache' });
      const resp = await res.json();
      if (!res.ok) throw new Error(resp?.error || resp?.message || res.statusText);
      const item = resp?.item || resp;

      setVal('mkm-name', item?.name || '');
      setChk('mkm-active', String(item?.active) === '1' || item?.active === 1 || item?.active === true);
      setVal('mkm-order', item?.order ?? '10000');

      const catFromItem = parseMaybeJson(item?.category, []);
      const catArr = Array.isArray(catFromItem) ? catFromItem : (catFromItem ? [catFromItem] : []);

        const d = parseMaybeJson(item?.data, {});
        const dCats = Array.isArray(d?.categories) ? d.categories : [];
        const selectedCats = dCats.length ? dCats : catArr;
        const selectedIds = selectedCats.map(String).filter(Boolean);
        
        // Обновляем Vue
        if (window.mkmVueApp) {
          window.mkmVueApp.form.categories = selectedIds;
        }
        
        // Обновляем нативный select для совместимости
        if (catSelect) setSelectedValues(catSelect, selectedIds);

      setVal('mkm-key', d?.key ?? '');
      setVal('mkm-mode', (d?.mode ?? 0).toString());

      const p = d?.params?.params || {};
      const addp = d?.params?.add_params || {};
      const color = (p?.color ?? '#ffffff').toString();
      setVal('mkm-color', color);
      setVal('mkm-color-picker', color);
      setVal('mkm-roughness', p?.roughness ?? '0.5');
      setVal('mkm-metalness', p?.metalness ?? '0.1');
      const tr = (p?.transparent ?? 0);
      const isTr = String(tr) === '1' || tr === 1 || tr === true;
      setChk('mkm-transparent', isTr);
      if (opRow) opRow.style.display = isTr ? '' : 'none';
      setVal('mkm-opacity', p?.opacity ?? '1');

      const map = (p?.map ?? '').toString();
      const normalMap = (p?.normalMap ?? '').toString();
      const roughMap = (p?.roughnessMap ?? '').toString();
      setVal('mkm-texture-url', map);
      setVal('mkm-normal-url', normalMap);
      setVal('mkm-roughmap-url', roughMap);
      setPreviewBox('mkm-texture-preview', map);
      setPreviewBox('mkm-normal-preview', normalMap);
      setPreviewBox('mkm-roughmap-preview', roughMap);

      setChk('mkm-stretch-width', String(addp?.stretch_width ?? 0) === '1' || addp?.stretch_width === 1 || addp?.stretch_width === true);
      setChk('mkm-stretch-height', String(addp?.stretch_height ?? 0) === '1' || addp?.stretch_height === 1 || addp?.stretch_height === true);
      setVal('mkm-real-width', addp?.real_width ?? '256');
      setVal('mkm-real-height', addp?.real_height ?? '256');
      setChk('mkm-one-sided', String(p?.one_side ?? 0) === '1' || p?.one_side === 1 || p?.one_side === true);
      updateMkmViewportMaterialPreview();
    } catch (e) {
      console.error('❌ loadModelKeyMaterialEdit error:', e);
      alert('Ошибка загрузки: ' + e.message);
    }
  }

  async function saveModelKeyMaterial(exitAfter) {
    const id = (document.getElementById('mkm_item_id')?.value || '0').toString();
    const isEdit = id && id !== '0';

    const name = (document.getElementById('mkm-name')?.value || '').trim();
    const key = (document.getElementById('mkm-key')?.value || '').trim();
    const active = document.getElementById('mkm-active')?.checked ? 1 : 0;
    const order = parseInt(document.getElementById('mkm-order')?.value || '10000', 10) || 10000;
    const mode = parseInt(document.getElementById('mkm-mode')?.value || '0', 10) || 0;

      // Получаем категории из Vue или из нативного select
      let categories = [];
      if (window.mkmVueApp && window.mkmVueApp.form.categories) {
        categories = (window.mkmVueApp.form.categories || []).map(String).filter(v => v !== '');
      } else {
        const catSelect = document.getElementById('mkm-category');
        if (catSelect) categories = getSelectedValues(catSelect).filter(v => v !== '');
      }

    const color = (document.getElementById('mkm-color')?.value || '#ffffff').trim() || '#ffffff';
    const roughness = document.getElementById('mkm-roughness')?.value ?? '0.5';
    const metalness = document.getElementById('mkm-metalness')?.value ?? '0.1';
    const transparent = document.getElementById('mkm-transparent')?.checked ? 1 : 0;
    const opacity = parseFloat(document.getElementById('mkm-opacity')?.value || '1') || 1;
    const textureUrl = (document.getElementById('mkm-texture-url')?.value || '').trim();
    const normalUrl = (document.getElementById('mkm-normal-url')?.value || '').trim();
    const roughmapUrl = (document.getElementById('mkm-roughmap-url')?.value || '').trim();
    const stretchWidth = document.getElementById('mkm-stretch-width')?.checked ? 1 : 0;
    const stretchHeight = document.getElementById('mkm-stretch-height')?.checked ? 1 : 0;
    const realWidth = parseInt(document.getElementById('mkm-real-width')?.value || '256', 10) || 256;
    const realHeight = parseInt(document.getElementById('mkm-real-height')?.value || '256', 10) || 256;
    const oneSided = document.getElementById('mkm-one-sided')?.checked ? 1 : 0;

    const payload = {
      id: isEdit ? parseInt(id, 10) : 0,
      name: name,
      active: active,
      order: order,
      category: categories,
      data: JSON.stringify({
        key: key,
        mode: mode,
        categories: categories,
        params: {
          type: 'Standard',
          params: {
            color: color,
            roughness: roughness,
            metalness: metalness,
            transparent: transparent,
            opacity: opacity,
            map: textureUrl || null,
            normalMap: normalUrl || null,
            roughnessMap: roughmapUrl || null
          },
          add_params: {
            stretch_width: stretchWidth,
            stretch_height: stretchHeight,
            real_width: realWidth,
            real_height: realHeight,
            one_side: oneSided
          }
        }
      })
    };

    const url = isEdit
      ? `/api/catalog/item_update/${encodeURIComponent(MODELS3D_MATERIALS_TYPE)}/${encodeURIComponent(id)}/`
      : `/api/catalog/item_add/${encodeURIComponent(MODELS3D_MATERIALS_TYPE)}/`;

    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const out = await res.json();
      if (!res.ok) throw new Error(out?.error || out?.message || res.statusText);
      if (window.toastr) window.toastr.success('Сохранено');
      if (exitAfter) {
        window.location.hash = '#models3d-materials';
        loadModels3dMaterials();
      } else {
        const newId = out?.item?.id ?? out?.id ?? id;
        window.location.hash = `#model-key-material-edit?id=${encodeURIComponent(String(newId))}`;
        await loadModelKeyMaterialEdit(newId);
      }
    } catch (e) {
      console.error('❌ saveModelKeyMaterial error:', e);
      alert('Ошибка сохранения: ' + e.message);
    }
  }

  // ============================================
  // Vue-приложение для формы редактирования ключ-материала (v-select для категорий)
  // ============================================
  window.initModelKeyMaterialVue = function() {
    const container = document.getElementById('mkm-category-vue-wrapper');
    if (!container) return;
    
    // Если уже создано, уничтожаем старое
    if (window.mkmVueApp) {
      window.mkmVueApp.$destroy();
      window.mkmVueApp = null;
    }
    
    if (typeof Vue === 'undefined') {
      console.warn('⚠️ Vue не загружен, категории будут работать через нативный select');
      return;
    }
    
    if (typeof VueSelect === 'undefined' && typeof window.VueSelect === 'undefined') {
      console.warn('⚠️ VueSelect не загружен, категории будут работать через нативный select');
      return;
    }
    
    // Регистрируем компонент v-select (если ещё не зарегистрирован)
    if (!Vue.options.components['v-select']) {
      const VueSelectComp = (typeof VueSelect !== 'undefined' ? VueSelect : window.VueSelect).default || (typeof VueSelect !== 'undefined' ? VueSelect : window.VueSelect);
      Vue.component('v-select', VueSelectComp);
    }
    
    window.mkmVueApp = new Vue({
      el: '#mkm-category-vue-wrapper',
      data: {
        form: {
          categories: []
        },
        categoriesOptions: []
      }
    });
  };

  // ============================================
  // Инициализация обработчиков событий
  // ============================================
  function initModels3dMaterialsHandlers() {
    // Кнопка "Категории" (как в рефе: общий редактор категорий)
    const m3mCatBtn = document.getElementById('models3d-materials-categories-btn');
    if (m3mCatBtn) {
      m3mCatBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const hash = `#edges-categories?type=${encodeURIComponent(MODELS3D_MATERIALS_TYPE)}&name=${encodeURIComponent('Материалы 3D Моделей')}`;
        window.location.hash = hash;
      });
      m3mCatBtn.removeAttribute('href');
    }

    // Кнопка "Добавить"
    const m3mAddBtn = document.getElementById('models3d-materials-add-btn');
    if (m3mAddBtn) {
      m3mAddBtn.addEventListener('click', () => {
        openModels3dMaterialEdit(0);
      });
    }

    // Количество на странице
    const m3mPerPage = document.getElementById('models3d-materials-per-page');
    if (m3mPerPage) {
      m3mPerPage.addEventListener('change', (e) => {
        models3dMaterialsState.perPage = parseInt(e.target.value || '20', 10) || 20;
        models3dMaterialsState.currentPage = 1;
        loadModels3dMaterials();
      });
    }

    // Фильтр категорий
    const m3mCat = document.getElementById('models3d-materials-category-filter');
    if (m3mCat) {
      m3mCat.addEventListener('change', () => {
        models3dMaterialsState.currentPage = 1;
        loadModels3dMaterials();
      });
    }

    // Поиск
    const m3mSearchInput = document.getElementById('models3d-materials-search-input');
    if (m3mSearchInput) {
      let t2 = null;
      m3mSearchInput.addEventListener('input', () => {
        clearTimeout(t2);
        t2 = setTimeout(() => {
          models3dMaterialsState.currentPage = 1;
          loadModels3dMaterials();
        }, 200);
      });
    }

    // Обработчики действий в таблице (редактировать/копировать/удалить)
    const m3mTableBody = document.getElementById('models3d-materials-table-body');
    if (m3mTableBody) {
      m3mTableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-m3m-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-m3m-action');
        const id = Number(btn.getAttribute('data-m3m-id') || '0') || 0;
        const name = btn.getAttribute('data-m3m-name') || '';
        if (action === 'edit') openModels3dMaterialEdit(id);
        if (action === 'copy') copyModels3dMaterial(id);
        if (action === 'delete') deleteModels3dMaterial(id, name);
      });
    }

    // Форма редактирования: цвет
    const mkmColorPicker = document.getElementById('mkm-color-picker');
    const mkmColorText = document.getElementById('mkm-color');
    if (mkmColorPicker && mkmColorText) {
      mkmColorPicker.addEventListener('input', () => {
        mkmColorText.value = mkmColorPicker.value;
        updateMkmViewportMaterialPreview();
      });
      mkmColorText.addEventListener('input', () => {
        const v = (mkmColorText.value || '').trim();
        if (/^#[0-9a-fA-F]{6}$/.test(v)) mkmColorPicker.value = v;
        updateMkmViewportMaterialPreview();
      });
    }

    // Прозрачность: показать/скрыть блок
    const mkmTransparent = document.getElementById('mkm-transparent');
    const mkmOpacityRow = document.getElementById('mkm-opacity-row');
    if (mkmTransparent && mkmOpacityRow) {
      mkmTransparent.addEventListener('change', () => {
        mkmOpacityRow.style.display = mkmTransparent.checked ? '' : 'none';
        updateMkmViewportMaterialPreview();
      });
    }

    // Загрузка файлов (текстура/нормали/шероховатость)
    const bindFilePick = (btnId, inputId, hiddenId, previewId) => {
      const btn = document.getElementById(btnId);
      const inp = document.getElementById(inputId);
      const hid = document.getElementById(hiddenId);
      const preview = document.getElementById(previewId);
      if (btn) {
        btn.addEventListener('click', () => {
          if (typeof window.openFileManager === 'function') {
            window.openFileManager({
              allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
              initialPath: 'common_assets/images/materials',
              onSelect: function(r) {
                if (r && r.url && hid) {
                  hid.value = r.url;
                  if (setPreviewBox && previewId) setPreviewBox(previewId, r.url);
                  updateMkmViewportMaterialPreview();
                }
              }
            });
          } else if (window.toastr) window.toastr.warning('Файловый менеджер не загружен.');
          else alert('Файловый менеджер недоступен.');
        });
      }
      if (inp && hid) inp.addEventListener('change', () => {
        const f = inp.files?.[0];
        if (!f) return;
        const url = URL.createObjectURL(f);
        hid.value = url;
        setPreviewBox(previewId, url);
        updateMkmViewportMaterialPreview();
      });
    };
    bindFilePick('mkm-texture-upload-btn', 'mkm-texture-file', 'mkm-texture-url', 'mkm-texture-preview');
    bindFilePick('mkm-normal-upload-btn', 'mkm-normal-file', 'mkm-normal-url', 'mkm-normal-preview');
    bindFilePick('mkm-roughmap-upload-btn', 'mkm-roughmap-file', 'mkm-roughmap-url', 'mkm-roughmap-preview');

    // Кнопки сохранения
    const mkmSaveBtn = document.getElementById('save-mkm-btn');
    const mkmSaveExitBtn = document.getElementById('save-exit-mkm-btn');
    if (mkmSaveBtn) mkmSaveBtn.addEventListener('click', () => saveModelKeyMaterial(false));
    if (mkmSaveExitBtn) mkmSaveExitBtn.addEventListener('click', () => saveModelKeyMaterial(true));

    ['mkm-roughness', 'mkm-metalness', 'mkm-opacity', 'mkm-texture-url', 'mkm-normal-url', 'mkm-roughmap-url']
      .forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', updateMkmViewportMaterialPreview);
        el.addEventListener('change', updateMkmViewportMaterialPreview);
      });

    // Инициализируем WebGL-превью только на странице редактирования 3D-материала,
    // чтобы не ловить context loss на других вкладках админки.
    const onMkmEditPage =
      (window.location.hash || '').indexOf('#model-key-material-edit') === 0 ||
      document.getElementById('model-key-material-edit')?.classList?.contains('active');
    if (onMkmEditPage && document.getElementById('mkm-viewport')) {
      initMkmViewportPreview();
      updateMkmViewportMaterialPreview();
    }
  }

  // ============================================
  // Экспорт функций в window для совместимости
  // ============================================
  window.loadModels3dMaterials = loadModels3dMaterials;
  window.loadModels3dMaterialsFromUI = function() {
    models3dMaterialsState.currentPage = 1;
    loadModels3dMaterials();
  };
  window.openModels3dMaterialEdit = openModels3dMaterialEdit;
  window.loadModelKeyMaterialEdit = loadModelKeyMaterialEdit;
  window.saveModelKeyMaterial = saveModelKeyMaterial;

  // Инициализация при загрузке DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModels3dMaterialsHandlers);
  } else {
    initModels3dMaterialsHandlers();
  }

})();
