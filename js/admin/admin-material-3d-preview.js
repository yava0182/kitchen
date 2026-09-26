/**
 * 3D-превью декора — панель BoxGeometry(ширина × высота × толщина мм).
 * MeshStandardMaterial: текстура, шероховатость, metalness, карты, прозрачность, односторонний.
 * v=20260530-preview-legacy-repeat — color map + repeat как create_material (part15).
 */
(function () {
  'use strict';
  try {
    console.log('[CLD][material-3d-preview] loaded v=20260530-preview-legacy-repeat');
  } catch (_) {}

  /** Админ-превью: декор = color map; normal/rough из каталога часто дублируют JPG и белят торец. */
  var ADMIN_PREVIEW_MAP_ONLY = true;

  var mat3d = null;
  var texLoader = null;
  var texCache = {};
  var previewDebounceTimers = { material: null, edge: null };

  function clamp01(n, def) {
    var v = Number(n);
    return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : def;
  }

  function ensurePreviewLighting(scene, THREE) {
    if (!scene || scene.userData._cldPreviewLit) return;
    scene.userData._cldPreviewLit = true;
    scene.add(new THREE.AmbientLight(0xffffff, 0.62));
    var key = new THREE.DirectionalLight(0xffffff, 0.88);
    key.position.set(1.6, 2.4, 2.2);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xffffff, 0.32);
    fill.position.set(-1.8, 0.8, -1.2);
    scene.add(fill);
  }

  function loadPbrTextures(urls, onDone) {
    var out = { map: null, normal: null, rough: null };
    var pending = 0;
    ['map', 'normal', 'rough'].forEach(function (k) {
      var u = (urls[k] || '').toString().trim();
      if (!u) return;
      pending++;
      loadDecorTexture(u, function (tex) {
        out[k] = tex;
        pending--;
        if (pending <= 0) onDone(out);
      });
    });
    if (!pending) onDone(out);
  }

  function loadPreviewColorMapOnly(mapUrl, onDone) {
    var u = (mapUrl || '').toString().trim();
    if (!u) {
      onDone({ map: null, normal: null, rough: null });
      return;
    }
    loadPbrTextures({ map: u }, onDone);
  }

  function cloneTex(tex, repeatFn) {
    if (!tex) return null;
    var c = tex.clone();
    c.needsUpdate = true;
    if (repeatFn) repeatFn(c);
    return c;
  }

  /** Превью: декор на всю грань (UV 0–1), как «растянуть» у ЛДСП. */
  function applyPreviewClampMap(tex) {
    if (!tex || !window.THREE) return;
    var THREE = window.THREE;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(1, 1);
    tex.offset.set(0, 0);
    tex.needsUpdate = true;
  }

  /** Как create_material (part15): mirror + model/real по ширине/высоте превью-панели. */
  function applyAdminPreviewMapRepeat(tex, sizeMm, ro) {
    if (!tex || !window.THREE) return;
    var THREE = window.THREE;
    var w = Math.max(0.1, Number(sizeMm && sizeMm.w) || 450);
    var h = Math.max(0.1, Number(sizeMm && sizeMm.h) || 720);
    var realW = Math.max(1, Number(ro && ro.realW) || 256);
    var realH = Math.max(1, Number(ro && ro.realH) || 256);
    var stretchW = !!(ro && ro.stretchW);
    var stretchH = !!(ro && ro.stretchH);
    if (stretchW && stretchH) {
      applyPreviewClampMap(tex);
      return;
    }
    tex.wrapS = tex.wrapT = THREE.MirroredRepeatWrapping;
    tex.repeat.set(
      stretchW ? 1 : Math.max(0.01, w / realW),
      stretchH ? 1 : Math.max(0.01, h / realH)
    );
    tex.offset.set(0, 0);
    tex.needsUpdate = true;
  }

  function applyFaceMapRepeat(tex, faceWmm, faceHmm, opts) {
    if (!tex || !window.THREE) return;
    var THREE = window.THREE;
    if (opts && (opts.stretchW || opts.stretchH)) {
      applyPreviewClampMap(tex);
      return;
    }
    tex.wrapS = tex.wrapT = THREE.MirroredRepeatWrapping;
    var realW = Math.max(1, Number(opts.realW) || 256);
    var realH = Math.max(1, Number(opts.realH) || 256);
    tex.repeat.set(
      Math.max(0.01, faceWmm / realW),
      Math.max(0.01, faceHmm / realH)
    );
    tex.needsUpdate = true;
  }

  /** Размеры граней BoxGeometry(w,h,t): 0±X 1±X 2+Y 3−Y 4+Z 5−Z (мм). */
  function boxFaceSizesMm(sizeMm) {
    var w = Math.max(0.1, Number(sizeMm.w) || 450);
    var h = Math.max(0.1, Number(sizeMm.h) || 720);
    var t = Math.max(0.1, Number(sizeMm.t) || 16);
    return [
      [t, h],
      [t, h],
      [w, t],
      [w, t],
      [w, h],
      [w, h],
    ];
  }

  /**
   * Один MeshStandardMaterial на весь BoxGeometry — торец и лицо с одним декором.
   * (массив из 6 материалов с разным repeat давал белый верхний торец.)
   */
  function buildPreviewPanelMaterial(THREE, textures, p, sizeMm, repeatOpts) {
    var side = p.oneSided ? THREE.FrontSide : THREE.DoubleSide;
    var sm = sizeMm || { w: 450, h: 720, t: 16 };
    var ro = repeatOpts || { realW: 256, realH: 256, stretchW: false, stretchH: false };
    var mapRepeatFn = textures.map
      ? function (tex) {
          applyAdminPreviewMapRepeat(tex, sm, ro);
        }
      : function (tex) {
          var faces = boxFaceSizesMm(sm);
          applyFaceMapRepeat(tex, faces[4][0], faces[4][1], ro);
        };

    if (textures.map) {
      var bm = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: p.transparent,
        opacity: p.opacity,
        side: side,
      });
      bm.map = cloneTex(textures.map, mapRepeatFn);
      return bm;
    }

    return new THREE.MeshStandardMaterial({
      color: p.color,
      roughness: p.roughness,
      metalness: p.metalness,
      transparent: p.transparent,
      opacity: p.opacity,
      side: side,
    });
  }

  function resolveMediaUrl(url) {
    var u = (url || '').toString().trim();
    if (!u) return '';
    if (/^https?:\/\//i.test(u) || u.indexOf('data:') === 0) return u;
    if (u.indexOf('//') === 0) return window.location.protocol + u;
    if (u.charAt(0) === '/') return window.location.origin + u;
    try {
      return new URL(u, window.location.href).href;
    } catch (e) {
      return window.location.origin + '/' + u.replace(/^\.\//, '');
    }
  }

  function readTextureUrl() {
    var v = resolveMediaUrl(elVal('material-texture-url'));
    if (v) return v;
    var img = document.querySelector('#material-texture-preview img');
    if (img && img.src) return resolveMediaUrl(img.src);
    return '';
  }

  function elVal(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
  }

  function elNum(id, def) {
    var n = Number(elVal(id));
    return isFinite(n) ? n : def;
  }

  function elChecked(id) {
    var el = document.getElementById(id);
    return !!(el && el.checked);
  }

  function readThicknessMm() {
    var t = elNum('material-thickness', 0);
    if (t > 0) return t;
    try {
      var raw = (document.getElementById('material-variants-hidden') || {}).value || '[]';
      var arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length && arr[0].thickness != null) {
        var v = Number(arr[0].thickness);
        if (isFinite(v) && v > 0) return v;
      }
    } catch (e) {}
    return 16;
  }

  function normalizeTexPath(u) {
    var s = (u || '').toString().split('?')[0].trim();
    if (!s) return '';
    try {
      if (/^https?:\/\//i.test(s) || s.indexOf('//') === 0) {
        var abs = s.indexOf('//') === 0 ? window.location.protocol + s : s;
        return new URL(abs).pathname;
      }
      return s.charAt(0) === '/' ? s : '/' + s.replace(/^\.\//, '');
    } catch (e) {
      return s;
    }
  }

  function texPathsEqual(a, b) {
    var na = normalizeTexPath(a);
    var nb = normalizeTexPath(b);
    return !!(na && nb && na === nb);
  }

  /** Декоративный JPG в normal/rough даёт «белые» грани — не PBR. */
  function sanitizePreviewMapUrls(mapUrl, normalUrl, roughUrl) {
    mapUrl = (mapUrl || '').toString().trim();
    normalUrl = (normalUrl || '').toString().trim();
    roughUrl = (roughUrl || '').toString().trim();
    if (!mapUrl) return { map: mapUrl, normal: normalUrl, rough: roughUrl };
    if (texPathsEqual(normalUrl, mapUrl)) normalUrl = '';
    if (texPathsEqual(roughUrl, mapUrl)) roughUrl = '';
    return { map: mapUrl, normal: normalUrl, rough: roughUrl };
  }

  function loadDecorTexture(url, onDone) {
    var u = resolveMediaUrl(url);
    if (!u) {
      onDone(null);
      return;
    }
    if (texCache[u]) {
      onDone(texCache[u]);
      return;
    }
    if (!texLoader && window.THREE) {
      texLoader = new THREE.TextureLoader();
    }
    if (!texLoader) {
      onDone(null);
      return;
    }
    texLoader.load(
      u,
      function (tex) {
        if (window.THREE.SRGBColorSpace) {
          tex.colorSpace = window.THREE.SRGBColorSpace;
        }
        texCache[u] = tex;
        onDone(tex);
      },
      undefined,
      function () {
        console.warn('[material-3d-preview] texture load failed:', u);
        onDone(null);
      }
    );
  }

  /** Повтор как create_material (part15): mirror + model/real. */
  function applyMapRepeat(tex) {
    if (!tex || !window.THREE) return;
    var THREE = window.THREE;
    tex.wrapS = tex.wrapT = THREE.MirroredRepeatWrapping;
    var modelW = Math.max(1, elNum('material-preview-width', 450));
    var modelH = Math.max(1, elNum('material-preview-height', 720));
    var realW = Math.max(1, elNum('material-real-texture-width', elNum('material-texture-width', 1000)));
    var realH = Math.max(1, elNum('material-real-texture-height', elNum('material-texture-height', 1000)));
    var stretchW = elChecked('material-stretch-width');
    var stretchH = elChecked('material-stretch-height');
    tex.repeat.set(stretchW ? 1 : modelW / realW, stretchH ? 1 : modelH / realH);
    tex.needsUpdate = true;
  }

  function disposeMeshMaterials(mesh) {
    if (!mesh) return;
    var mats = mesh.material;
    if (Array.isArray(mats)) {
      var seen = new Set();
      mats.forEach(function (m) {
        if (!m || seen.has(m)) return;
        seen.add(m);
        try { m.dispose(); } catch (e) {}
      });
    } else if (mats) {
      try { mats.dispose(); } catch (e) {}
    }
  }

  function readMaterialRepeatOpts() {
    return {
      realW: Math.max(1, elNum('material-real-texture-width', elNum('material-texture-width', 1000))),
      realH: Math.max(1, elNum('material-real-texture-height', elNum('material-texture-height', 1000))),
      stretchW: elChecked('material-stretch-width'),
      stretchH: elChecked('material-stretch-height'),
    };
  }

  function readEdgeRepeatOpts() {
    return {
      realW: Math.max(1, edgeElNum('edge-real-texture-width', 256)),
      realH: Math.max(1, edgeElNum('edge-real-texture-height', 256)),
      stretchW: edgeElChecked('edge-stretch-width'),
      stretchH: edgeElChecked('edge-stretch-height'),
    };
  }

  function readMaterialDisplayParams() {
    var mapUrl = readTextureUrl();
    return {
      color: mapUrl ? '#ffffff' : (elVal('material-color') || elVal('material-color-hex') || '#ffffff').trim() || '#ffffff',
      roughness: clamp01(elNum('material-roughness', 0.8), 0.8),
      metalness: clamp01(elNum('material-metalness', 0), 0),
      transparent: elChecked('material-transparent'),
      opacity: elChecked('material-transparent') ? clamp01(elNum('material-opacity', 1), 1) : 1,
      oneSided: elChecked('material-one-sided'),
      mapUrl: mapUrl,
      normalUrl: resolveMediaUrl(elVal('material-normal-map-url')),
      roughUrl: resolveMediaUrl(elVal('material-roughness-map-url')),
      repeatMap: applyMapRepeat,
      repeatOther: applyMapRepeat,
    };
  }

  function readEdgeMapUrlForPreview() {
    var u = readEdgeTextureUrl();
    if (u) return u;
    u = resolveMediaUrl(edgeElVal('edge-item-icon'));
    return u || '';
  }

  function readEdgeDisplayParams() {
    var mapUrl = readEdgeMapUrlForPreview();
    return {
      color: mapUrl ? '#ffffff' : (edgeElVal('edge-item-color') || '#ffffff').trim() || '#ffffff',
      roughness: clamp01(edgeElNum('edge-roughness', 0.8), 0.8),
      metalness: clamp01(edgeElNum('edge-metalness', 0), 0),
      transparent: edgeElChecked('edge-transparent'),
      opacity: edgeElChecked('edge-transparent') ? clamp01(edgeElNum('edge-opacity', 1), 1) : 1,
      oneSided: edgeElChecked('edge-one-sided'),
      mapUrl: mapUrl,
      normalUrl: resolveMediaUrl(edgeElVal('edge-normal-map-url')),
      roughUrl: resolveMediaUrl(edgeElVal('edge-roughness-map-url')),
      repeatMap: applyEdgeMapRepeat,
      repeatOther: applyEdgeMapRepeat,
    };
  }

  function buildSixFacePbrMaterials(THREE, textures, p, sizeMm, repeatOpts) {
    var one = buildPreviewPanelMaterial(THREE, textures, p, sizeMm, repeatOpts);
    var out = [];
    for (var i = 0; i < 6; i++) out.push(one);
    return out;
  }

  function fitCameraToBox() {
    if (!mat3d) return;
    var pw = Math.max(1, elNum('material-preview-width', 450)) / 1000;
    var ph = Math.max(1, elNum('material-preview-height', 720)) / 1000;
    var maxDim = Math.max(pw, ph);
    var dist = maxDim * 1.55;
    mat3d.camera.position.set(dist * 0.42, dist * 0.08, dist * 0.92);
    mat3d.camera.lookAt(0, 0, 0);
    if (mat3d.controls) {
      mat3d.controls.target.set(0, 0, 0);
      mat3d.controls.update();
    }
  }

  function rebuildPanelGeometry() {
    if (!mat3d || !mat3d.mesh) return;
    var pw = Math.max(1, elNum('material-preview-width', 450));
    var ph = Math.max(1, elNum('material-preview-height', 720));
    var pt = Math.max(1, readThicknessMm());
    var key = pw + 'x' + ph + 'x' + pt;
    if (mat3d.sizeKey === key) return;
    mat3d.sizeKey = key;
    var w = pw / 1000;
    var h = ph / 1000;
    var t = pt / 1000;
    if (mat3d.mesh.geometry) mat3d.mesh.geometry.dispose();
    mat3d.mesh.geometry = new mat3d.THREE.BoxGeometry(w, h, t);
    fitCameraToBox();
  }

  function renderPreview() {
    if (mat3d && mat3d.renderer) {
      mat3d.renderer.render(mat3d.scene, mat3d.camera);
    }
  }

  function initMaterial3dPreview() {
    var host = document.getElementById('material-preview');
    if (!host) return;
    if (mat3d && mat3d.host === host) return;
    if (mat3d) {
      try {
        cancelAnimationFrame(mat3d.raf);
        if (mat3d.controls) mat3d.controls.dispose();
        disposeMeshMaterials(mat3d.mesh);
        if (mat3d.mesh && mat3d.mesh.geometry) mat3d.mesh.geometry.dispose();
        if (mat3d.renderer) mat3d.renderer.dispose();
      } catch (e) {}
      mat3d = null;
    }
    if (!window.THREE) {
      host.innerHTML = '<span style="color:#999;font-size:13px;">THREE.js не загружен</span>';
      return;
    }

    var THREE = window.THREE;
    var viewW = Math.max(200, host.clientWidth || 400);
    var viewH = Math.max(200, host.clientHeight || 480);

    var scene = new THREE.Scene();
    ensurePreviewLighting(scene, THREE);
    var camera = new THREE.PerspectiveCamera(38, viewW / viewH, 0.001, 50);
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(viewW, viewH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0xf5f5dc, 1);
    if (THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    host.innerHTML = '';
    host.style.display = 'block';
    host.style.position = 'relative';
    host.appendChild(renderer.domElement);

    var pw = Math.max(1, elNum('material-preview-width', 450));
    var ph = Math.max(1, elNum('material-preview-height', 720));
    var pt = Math.max(1, readThicknessMm());
    var mesh = new THREE.Mesh(
      new THREE.BoxGeometry(pw / 1000, ph / 1000, pt / 1000),
      buildPreviewPanelMaterial(
        THREE,
        { map: null, normal: null, rough: null },
        readMaterialDisplayParams(),
        { w: pw, h: ph, t: pt },
        readMaterialRepeatOpts()
      )
    );
    mesh.rotation.y = -0.12;
    scene.add(mesh);

    var controls = null;
    if (typeof THREE.OrbitControls !== 'undefined') {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 0.15;
      controls.maxDistance = 6;
    }

    var lastW = viewW;
    var lastH = viewH;
    function onResize() {
      if (!host || !renderer) return;
      var nw = Math.max(200, host.clientWidth || 400);
      var nh = Math.max(200, host.clientHeight || 480);
      if (nw === lastW && nh === lastH) return;
      lastW = nw;
      lastH = nh;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      fitCameraToBox();
    }

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(onResize).observe(host);
    } else {
      window.addEventListener('resize', onResize);
    }

    function tick() {
      if (!mat3d) return;
      if (mat3d.controls) mat3d.controls.update();
      mat3d.renderer.render(mat3d.scene, mat3d.camera);
      mat3d.raf = requestAnimationFrame(tick);
    }

    mat3d = {
      THREE: THREE,
      host: host,
      scene: scene,
      camera: camera,
      renderer: renderer,
      mesh: mesh,
      controls: controls,
      sizeKey: pw + 'x' + ph + 'x' + pt,
      raf: 0,
    };
    fitCameraToBox();
    tick();
    updateMaterial3dPreview();
  }

  function applyDecorToPanelSlot(slot, p, sizeMm, repeatOpts, renderFn) {
    if (!slot || !slot.mesh) return;
    loadPreviewColorMapOnly(p.mapUrl, function (textures) {
      if (!slot.mesh) return;
      disposeMeshMaterials(slot.mesh);
      slot.mesh.material = buildPreviewPanelMaterial(slot.THREE, textures, p, sizeMm, repeatOpts);
      if (renderFn) renderFn();
    });
  }

  function schedulePanelPreviewUpdate(kind) {
    clearTimeout(previewDebounceTimers[kind]);
    previewDebounceTimers[kind] = setTimeout(function () {
      if (kind === 'edge') updateEdge3dPreviewNow();
      else updateMaterial3dPreviewNow();
    }, 30);
  }

  function updateMaterial3dPreviewNow() {
    var host = document.getElementById('material-preview');
    if (!host) return;
    if (!mat3d || mat3d.host !== host) initMaterial3dPreview();
    if (!mat3d || !mat3d.mesh) return;
    rebuildPanelGeometry();
    var p = readMaterialDisplayParams();
    var pw = Math.max(1, elNum('material-preview-width', 450));
    var ph = Math.max(1, elNum('material-preview-height', 720));
    var pt = Math.max(1, readThicknessMm());
    applyDecorToPanelSlot(mat3d, p, { w: pw, h: ph, t: pt }, readMaterialRepeatOpts(), renderPreview);
  }

  function updateMaterial3dPreview() {
    schedulePanelPreviewUpdate('material');
  }

  window.__cldUpdateMaterialDecorPreview = updateMaterial3dPreview;
  window.__cldInitMaterial3dPreview = initMaterial3dPreview;
  window.__cldResolveAdminMediaUrl = resolveMediaUrl;
  window.__cldDisposeMaterial3dPreview = function () {
    if (!mat3d) return;
    try {
      cancelAnimationFrame(mat3d.raf);
      if (mat3d.controls) mat3d.controls.dispose();
      disposeMeshMaterials(mat3d.mesh);
      if (mat3d.mesh && mat3d.mesh.geometry) mat3d.mesh.geometry.dispose();
      if (mat3d.renderer) {
        var el = mat3d.renderer.domElement;
        if (el && el.parentNode) el.parentNode.removeChild(el);
        mat3d.renderer.dispose();
      }
    } catch (e) {}
    mat3d = null;
  };

  window.__cldSyncEdgeDecorIconFromTexture = function () {
    var tex = (document.getElementById('edge-texture-url') || {}).value;
    tex = (tex || '').toString().trim();
    if (!tex) return;
    var iconInput = document.getElementById('edge-item-icon');
    if (iconInput) iconInput.value = tex;
    var prevWrap = document.getElementById('edge-item-icon-preview-wrapper');
    var prevImg = document.getElementById('edge-item-icon-preview');
    var placeholder = document.getElementById('edge-item-icon-placeholder');
    if (!prevWrap || !prevImg || !placeholder) return;
    prevWrap.style.display = 'block';
    placeholder.style.display = 'none';
    prevImg.src = resolveMediaUrl(tex);
  };

  var bindIds = [
    'material-texture-url',
    'material-color',
    'material-color-hex',
    'material-roughness',
    'material-metalness',
    'material-transparent',
    'material-opacity',
    'material-normal-map-url',
    'material-roughness-map-url',
    'material-preview-width',
    'material-preview-height',
    'material-texture-width',
    'material-texture-height',
    'material-real-texture-width',
    'material-real-texture-height',
    'material-stretch-width',
    'material-stretch-height',
    'material-one-sided',
    'material-thickness',
  ];

  function bindInputs() {
    bindIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el._cldMat3dBound) return;
      el._cldMat3dBound = true;
      el.addEventListener('input', function () {
        if (id === 'material-color') {
          var hx = document.getElementById('material-color-hex');
          if (hx) hx.value = el.value;
        }
        if (id === 'material-color-hex') {
          var cp = document.getElementById('material-color');
          if (cp && /^#([0-9a-fA-F]{6})$/.test(el.value)) cp.value = el.value;
        }
        updateMaterial3dPreview();
      });
      el.addEventListener('change', function () {
        if (id === 'material-color') {
          var hx2 = document.getElementById('material-color-hex');
          if (hx2) hx2.value = el.value;
        }
        if (id === 'material-color-hex') {
          var cp2 = document.getElementById('material-color');
          if (cp2 && /^#([0-9a-fA-F]{6})$/.test(el.value)) cp2.value = el.value;
        }
        updateMaterial3dPreview();
      });
    });
  }

  document.addEventListener('cld-material-item-edit-loaded', function () {
    bindInputs();
    setTimeout(function () {
      initMaterial3dPreview();
      updateMaterial3dPreview();
    }, 0);
    setTimeout(updateMaterial3dPreview, 400);
  });

  document.addEventListener('click', function (e) {
    if (e.target && (e.target.getAttribute('href') === '#mat-item-tab-display' ||
      (e.target.closest && e.target.closest('[href="#mat-item-tab-display"]')))) {
      setTimeout(function () {
        initMaterial3dPreview();
        updateMaterial3dPreview();
      }, 50);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindInputs);
  } else {
    bindInputs();
  }

  // --- Кромки: 3D-превью (те же правила, что у плитных материалов) ---
  var edge3d = null;

  function edgeElVal(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
  }

  function edgeElNum(id, def) {
    var n = Number(edgeElVal(id));
    return isFinite(n) ? n : def;
  }

  function edgeElChecked(id) {
    var el = document.getElementById(id);
    return !!(el && el.checked);
  }

  function readEdgeTextureUrl() {
    var v = resolveMediaUrl(edgeElVal('edge-texture-url'));
    if (v) return v;
    var img = document.querySelector('#edge-texture-preview img');
    if (img && img.src) return resolveMediaUrl(img.src);
    return '';
  }

  function readEdgeThicknessMm() {
    var t = edgeElNum('edge-item-thickness', 0);
    if (t > 0) return t;
    t = edgeElNum('edge-variant-thickness', 0);
    if (t > 0) return t;
    try {
      var raw = (document.getElementById('edge-variants-hidden') || {}).value || '[]';
      var arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length && arr[0].thickness != null) {
        var v = Number(arr[0].thickness);
        if (isFinite(v) && v > 0) return v;
      }
    } catch (e) {}
    return 1;
  }

  /** Толщина бруска в 3D-превью (как ЛДСП 16 мм), не толщина кромки в каталоге. */
  function readEdgePreviewThicknessMm() {
    return 16;
  }

  function applyEdgeMapRepeat(tex) {
    if (!tex || !window.THREE) return;
    var THREE = window.THREE;
    tex.wrapS = tex.wrapT = THREE.MirroredRepeatWrapping;
    var modelW = Math.max(1, edgeElNum('edge-preview-width', 450));
    var modelH = Math.max(1, edgeElNum('edge-preview-height', 720));
    var realW = Math.max(1, edgeElNum('edge-real-texture-width', 256));
    var realH = Math.max(1, edgeElNum('edge-real-texture-height', 256));
    var stretchW = edgeElChecked('edge-stretch-width');
    var stretchH = edgeElChecked('edge-stretch-height');
    tex.repeat.set(stretchW ? 1 : modelW / realW, stretchH ? 1 : modelH / realH);
    tex.needsUpdate = true;
  }

  function fitEdgeCameraToBox() {
    if (!edge3d) return;
    var pw = Math.max(1, edgeElNum('edge-preview-width', 450)) / 1000;
    var ph = Math.max(1, edgeElNum('edge-preview-height', 720)) / 1000;
    var maxDim = Math.max(pw, ph);
    var dist = maxDim * 1.55;
    edge3d.camera.position.set(dist * 0.42, dist * 0.08, dist * 0.92);
    edge3d.camera.lookAt(0, 0, 0);
    if (edge3d.controls) {
      edge3d.controls.target.set(0, 0, 0);
      edge3d.controls.update();
    }
  }

  function rebuildEdgePanelGeometry() {
    if (!edge3d || !edge3d.mesh) return;
    var pw = Math.max(1, edgeElNum('edge-preview-width', 450));
    var ph = Math.max(1, edgeElNum('edge-preview-height', 720));
    var pt = Math.max(1, readEdgePreviewThicknessMm());
    var key = pw + 'x' + ph + 'x' + pt;
    if (edge3d.sizeKey === key) return;
    edge3d.sizeKey = key;
    var w = pw / 1000;
    var h = ph / 1000;
    var t = pt / 1000;
    if (edge3d.mesh.geometry) edge3d.mesh.geometry.dispose();
    edge3d.mesh.geometry = new edge3d.THREE.BoxGeometry(w, h, t);
    fitEdgeCameraToBox();
  }

  function renderEdgePreview() {
    if (edge3d && edge3d.renderer) {
      edge3d.renderer.render(edge3d.scene, edge3d.camera);
    }
  }

  function initEdge3dPreview() {
    var host = document.getElementById('edge-preview');
    if (!host) return;
    if (edge3d && edge3d.host === host) return;
    if (edge3d) {
      try {
        cancelAnimationFrame(edge3d.raf);
        if (edge3d.controls) edge3d.controls.dispose();
        disposeMeshMaterials(edge3d.mesh);
        if (edge3d.mesh && edge3d.mesh.geometry) edge3d.mesh.geometry.dispose();
        if (edge3d.renderer) edge3d.renderer.dispose();
      } catch (e) {}
      edge3d = null;
    }
    if (!window.THREE) {
      host.innerHTML = '<span style="color:#999;font-size:13px;">THREE.js не загружен</span>';
      return;
    }

    var THREE = window.THREE;
    var viewW = Math.max(200, host.clientWidth || 400);
    var viewH = Math.max(200, host.clientHeight || 480);

    var scene = new THREE.Scene();
    ensurePreviewLighting(scene, THREE);
    var camera = new THREE.PerspectiveCamera(38, viewW / viewH, 0.001, 50);
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(viewW, viewH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0xf5f5dc, 1);
    if (THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    host.innerHTML = '';
    host.style.display = 'block';
    host.style.position = 'relative';
    host.appendChild(renderer.domElement);

    var pw = Math.max(1, edgeElNum('edge-preview-width', 450));
    var ph = Math.max(1, edgeElNum('edge-preview-height', 720));
    var pt = Math.max(1, readEdgePreviewThicknessMm());
    var mesh = new THREE.Mesh(
      new THREE.BoxGeometry(pw / 1000, ph / 1000, pt / 1000),
      buildPreviewPanelMaterial(
        THREE,
        { map: null, normal: null, rough: null },
        readEdgeDisplayParams(),
        { w: pw, h: ph, t: pt },
        readEdgeRepeatOpts()
      )
    );
    mesh.rotation.y = -0.12;
    scene.add(mesh);

    var controls = null;
    if (typeof THREE.OrbitControls !== 'undefined') {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 0.15;
      controls.maxDistance = 6;
    }

    var lastW = viewW;
    var lastH = viewH;
    function onResize() {
      if (!host || !renderer) return;
      var nw = Math.max(200, host.clientWidth || 400);
      var nh = Math.max(200, host.clientHeight || 480);
      if (nw === lastW && nh === lastH) return;
      lastW = nw;
      lastH = nh;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      fitEdgeCameraToBox();
    }

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(onResize).observe(host);
    } else {
      window.addEventListener('resize', onResize);
    }

    function tick() {
      if (!edge3d) return;
      if (edge3d.controls) edge3d.controls.update();
      edge3d.renderer.render(edge3d.scene, edge3d.camera);
      edge3d.raf = requestAnimationFrame(tick);
    }

    edge3d = {
      THREE: THREE,
      host: host,
      scene: scene,
      camera: camera,
      renderer: renderer,
      mesh: mesh,
      controls: controls,
      sizeKey: pw + 'x' + ph + 'x' + pt,
      raf: 0,
    };
    fitEdgeCameraToBox();
    tick();
    updateEdge3dPreview();
  }

  function updateEdge3dPreviewNow() {
    var host = document.getElementById('edge-preview');
    if (!host) return;
    if (!edge3d || edge3d.host !== host) initEdge3dPreview();
    if (!edge3d || !edge3d.mesh) return;
    rebuildEdgePanelGeometry();
    var p = readEdgeDisplayParams();
    var pw = Math.max(1, edgeElNum('edge-preview-width', 450));
    var ph = Math.max(1, edgeElNum('edge-preview-height', 720));
    var pt = Math.max(1, readEdgePreviewThicknessMm());
    applyDecorToPanelSlot(edge3d, p, { w: pw, h: ph, t: pt }, readEdgeRepeatOpts(), renderEdgePreview);
  }

  function updateEdge3dPreview() {
    schedulePanelPreviewUpdate('edge');
  }

  window.__cldUpdateEdgeDecorPreview = updateEdge3dPreview;
  window.__cldInitEdgeDecorPreview = initEdge3dPreview;
  window.__cldDisposeEdge3dPreview = function () {
    if (!edge3d) return;
    try {
      cancelAnimationFrame(edge3d.raf);
      if (edge3d.controls) edge3d.controls.dispose();
      disposeMeshMaterials(edge3d.mesh);
      if (edge3d.mesh && edge3d.mesh.geometry) edge3d.mesh.geometry.dispose();
      if (edge3d.renderer) {
        var el = edge3d.renderer.domElement;
        if (el && el.parentNode) el.parentNode.removeChild(el);
        edge3d.renderer.dispose();
      }
    } catch (e) {}
    edge3d = null;
  };

  var edgeBindIds = [
    'edge-texture-url',
    'edge-item-color',
    'edge-item-color-picker',
    'edge-roughness',
    'edge-metalness',
    'edge-transparent',
    'edge-opacity',
    'edge-normal-map-url',
    'edge-roughness-map-url',
    'edge-preview-width',
    'edge-preview-height',
    'edge-real-texture-width',
    'edge-real-texture-height',
    'edge-stretch-width',
    'edge-stretch-height',
    'edge-one-sided',
    'edge-item-thickness',
    'edge-variants-hidden',
    'edge-item-icon',
  ];

  function bindEdgeInputs() {
    edgeBindIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el._cldEdge3dBound) return;
      el._cldEdge3dBound = true;
      el.addEventListener('input', function () {
        if (id === 'edge-item-color-picker') {
          var t = document.getElementById('edge-item-color');
          if (t) t.value = el.value;
        }
        if (id === 'edge-texture-url' && typeof window.__cldSyncEdgeDecorIconFromTexture === 'function') {
          window.__cldSyncEdgeDecorIconFromTexture();
        }
        updateEdge3dPreview();
      });
      el.addEventListener('change', function () {
        if (id === 'edge-item-color-picker') {
          var t = document.getElementById('edge-item-color');
          if (t) t.value = el.value;
        }
        if (id === 'edge-texture-url' && typeof window.__cldSyncEdgeDecorIconFromTexture === 'function') {
          window.__cldSyncEdgeDecorIconFromTexture();
        }
        updateEdge3dPreview();
      });
    });
  }

  document.addEventListener('cld-edge-item-edit-loaded', function () {
    bindEdgeInputs();
    setTimeout(function () {
      initEdge3dPreview();
      updateEdge3dPreview();
    }, 0);
    setTimeout(updateEdge3dPreview, 400);
  });

  document.addEventListener('click', function (e) {
    if (e.target && (e.target.getAttribute('href') === '#edge-item-tab-display' ||
      (e.target.closest && e.target.closest('[href="#edge-item-tab-display"]')))) {
      setTimeout(function () {
        initEdge3dPreview();
        updateEdge3dPreviewNow();
      }, 50);
    }
  });

  document.addEventListener('shown.bs.tab', function (e) {
    if (!e.target || !e.target.getAttribute) return;
    var href = e.target.getAttribute('href');
    if (href === '#edge-item-tab-display') {
      setTimeout(function () {
        initEdge3dPreview();
        updateEdge3dPreviewNow();
      }, 0);
    }
    if (href === '#mat-item-tab-display') {
      setTimeout(function () {
        initMaterial3dPreview();
        updateMaterial3dPreviewNow();
      }, 0);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEdgeInputs);
  } else {
    bindEdgeInputs();
  }
})();
