// ClodisBuilder - builds Three.js geometry from Clodis JSON structure (референс: Clodis формат)
// Handles sections, walls, facades, modules with expressions and variables

function __cldItemEmbeddedTree(item) {
  if (!item) return null;
  const direct = item?.spec?.template_tree || item?.template?.tree;
  if (direct) return direct;
  if (typeof globalThis !== 'undefined' && typeof globalThis.__cldReadClodisJSON === 'function') {
    const t = globalThis.__cldReadClodisJSON(item);
    return Array.isArray(t) ? t : null;
  }
  let cj = item?.clodisJSON;
  if (typeof cj === 'string') {
    try {
      cj = JSON.parse(cj);
    } catch (_) {
      cj = null;
    }
  }
  return Array.isArray(cj) ? cj : null;
}

class ClodisBuilder {
  constructor() {
    this.variables = {}; // v:variable_name
    this.groups = {}; // g:group_name (materials, thicknesses)
    this.sectionStack = []; // Stack for nested sections
    /** >0 внутри buildModule: не применять room layoutZones к вложенным corpus/plinth/… */
    this._catalogModuleBuildDepth = 0;
  }

  _treeHasCupDrillingAny(data) {
    if (!data) return false;
    if (Array.isArray(data)) {
      for (const it of data) {
        if (this._treeHasCupDrillingAny(it)) return true;
      }
      return false;
    }
    return this._itemTreeHasCupDrilling(data);
  }

  _dbgEnabled() {
    return !!(typeof window !== 'undefined' && window.__CLD_DEBUG_BUILDER);
  }

  _dbg(...args) {
    if (!this._dbgEnabled()) return;
    try {
      console.log(...args);
    } catch (_) {}
  }

  /** Материал полоски кромки — паритет с constructor-clodis _build_edges. */
  _buildRoomEdgeMaterial(edgeData, repeatW, repeatH, options = {}) {
    const vis = typeof window !== 'undefined' ? window.__cldRoomEdgeVisual : null;
    if (vis && typeof vis.buildRoomEdgeStripMaterial === 'function') {
      return vis.buildRoomEdgeStripMaterial(edgeData, repeatW, repeatH, options);
    }
    const ed = edgeData || {};
    let edgeColor = 0xffffff;
    if (typeof ed.color === 'string') {
      const m = /^#([0-9a-fA-F]{6})$/.exec(ed.color.trim());
      if (m) edgeColor = parseInt(m[1], 16);
    }
    return new THREE.MeshStandardMaterial({
      color: edgeColor,
      roughness: typeof ed.roughness === 'number' ? ed.roughness : 0.8,
      metalness: typeof ed.metalness === 'number' ? ed.metalness : 0,
      depthTest: true,
      depthWrite: true,
    });
  }

  /** Шаблон: color пустой / #fff — плейсхолдер до декора шага 5. */
  _isDefaultWhitePlaceholderEdge(edgeData) {
    if (!edgeData || typeof edgeData !== 'object') return true;
    const c = String(edgeData.color ?? '').trim().toLowerCase();
    return !c || c === '#ffffff' || c === '#fff';
  }

  /** Комната + шаг 5: кромка корпуса = тот же material, что у core (не белый плейсхолдер #fff). */
  _shouldUseBodyMaterialForCorpusEdge(edgeData, roomInside) {
    return !!roomInside;
  }

  /** После сборки: полоски корпуса — clone material core (не общая ссылка). */
  _syncCorpusEdgeStripsToCoreMaterial(wallGroup, roomInside) {
    if (!roomInside || !wallGroup) return;
    const core = wallGroup.children?.find(
      (c) => c?.isMesh && (c.userData?.isBody || String(c.name || '').includes('_core')),
    );
    if (!core?.material) return;
    wallGroup.traverse((c) => {
      if (!c?.isMesh || !c.userData?.isEdge) return;
      c.material = this._cloneMaterialSafeForEdges(core.material);
      c.userData.cldClonedBodyMaterial = true;
      c.userData.cldCorpusBodyEdge = true;
    });
  }

  /**
   * ShaderMaterial + soft/spot RT в uniforms → Three cloneUniforms() спамит
   * "Textures of render targets cannot be cloned" × сотни раз.
   */
  _cloneMaterialSafeForEdges(mat) {
    if (!mat?.clone) return mat;
    const u = mat.uniforms;
    if (!u) return mat.clone();
    const saved = Object.create(null);
    for (const key of Object.keys(u)) {
      const tex = u[key]?.value;
      if (tex && tex.isRenderTargetTexture) {
        saved[key] = tex;
        u[key].value = null;
      }
    }
    let cloned;
    try {
      cloned = mat.clone();
    } finally {
      for (const key of Object.keys(saved)) {
        u[key].value = saved[key];
      }
    }
    for (const key of Object.keys(saved)) {
      if (cloned.uniforms?.[key]) cloned.uniforms[key].value = saved[key];
    }
    return cloned;
  }

  /** Лёгкий заход кромки на плиту (мм) — убирает тёмный зазор на стыке в комнате. */
  _cldNudgeEdgeTowardCore(edgeNum, edgePos, overlapMm, orientation) {
    if (!edgePos || !(overlapMm > 0)) return;
    const d = overlapMm / 2;
    const o = (orientation || 'f').toLowerCase();
    if (o === 'v') {
      if (edgeNum === 1) edgePos.y += d;
      else if (edgeNum === 2) edgePos.y -= d;
      // 3 зад (−Z): к плите = +Z; 4 перед (+Z): к плите = −Z (раньше было наоборот → кромка вылезала назад)
      else if (edgeNum === 3) edgePos.z += d;
      else if (edgeNum === 4) edgePos.z -= d;
    } else if (o === 'h') {
      if (edgeNum === 1) edgePos.z += d;
      else if (edgeNum === 2) edgePos.z -= d;
      else if (edgeNum === 3) edgePos.x += d;
      else if (edgeNum === 4) edgePos.x -= d;
    } else {
      if (edgeNum === 1) edgePos.y += d;
      else if (edgeNum === 2) edgePos.y -= d;
      else if (edgeNum === 3) edgePos.x += d;
      else if (edgeNum === 4) edgePos.x -= d;
    }
  }

  _normalizeAdminFields(node) {
    if (!node || typeof node !== 'object') return;
    if (node.position && !node.pos) {
      node.pos = node.position;
      delete node.position;
    }
    if (node.anchor && !node.pivot) {
      node.pivot = node.anchor;
      delete node.anchor;
    }
    if (node.rotation && !node.rot) {
      node.rot = node.rotation;
      delete node.rotation;
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(c => this._normalizeAdminFields(c));
    }
  }

  _normalizeLayoutRoleKey(raw) {
    const normFn =
      typeof window !== 'undefined' && typeof window.__cldNormalizeSectionLayoutRole === 'function'
        ? window.__cldNormalizeSectionLayoutRole
        : function (v) {
            const s = String(v == null ? '' : v).trim();
            if (!s) return '';
            const allowed = new Set([
              'cabinet_root',
              'plinth',
              'corpus',
              'corpus_antresol',
              'facades',
              'facades_main',
              'facades_top',
              'service',
              'top',
              'wall_hung_body',
              'drawer',
            ]);
            return allowed.has(s) ? s : '';
          };
    return normFn(raw) || '';
  }

  /** Дочерние секции по Clodis-узлу: corpus / corpus_antresol / top (для превью каталога). */
  _roleFlagsFromPlanChildren(planItem) {
    const ch = planItem && Array.isArray(planItem.children) ? planItem.children : [];
    let hasCorpusMain = false;
    let hasCorpusAnt = false;
    let hasTop = false;
    for (const c of ch) {
      const t = String(c.type || '').trim().toLowerCase();
      // Роль может быть задана на type:section (эталон) и на type:module (каталожные вставки в cabinet_root).
      if (t !== 'section' && t !== 'module') continue;
      const r = this._normalizeLayoutRoleKey(c.layout_role ?? c.sectionLayoutRole ?? '');
      if (r === 'corpus') hasCorpusMain = true;
      if (r === 'corpus_antresol') hasCorpusAnt = true;
      if (r === 'top') hasTop = true;
    }
    return { hasCorpusMain, hasCorpusAnt, hasTop };
  }

  /** Какие фасадные module/section есть в clodis (для высоты полос, не corpus_*). */
  _planFacadeRolesFromChildren(planItem) {
    const ch = planItem && Array.isArray(planItem.children) ? planItem.children : [];
    const out = {
      facades: false,
      facades_main: false,
      facades_top: false,
      splitMainAndTop: false,
    };
    for (const c of ch) {
      const t = String(c.type || '').trim().toLowerCase();
      if (t !== 'section' && t !== 'module') continue;
      const r = this._normalizeLayoutRoleKey(c.layout_role ?? c.sectionLayoutRole ?? '');
      if (r === 'facades') out.facades = true;
      if (r === 'facades_main') out.facades_main = true;
      if (r === 'facades_top') out.facades_top = true;
    }
    out.splitMainAndTop = out.facades_main && out.facades_top;
    out.hasSplitFacadeModules =
      out.splitMainAndTop || (out.facades && (out.facades_main || out.facades_top));
    return out;
  }

  _isFacadeLayoutRole(role) {
    const r = this._normalizeLayoutRoleKey(role);
    return r === 'facades' || r === 'facades_main' || r === 'facades_top';
  }

  _isDrawerCatalogElementType(spec) {
    const et = String(spec?.element_type || '').toLowerCase();
    return et === 'catalog_33' || et.includes('yashik');
  }

  /**
   * Роль module в пирамиде cabinet_root: cabinet_root только у корневой section.
   * Ошибочный cabinet_root у ящика → drawer; иначе сброс.
   */
  _resolveOuterModuleLayoutRole(item, parentSection) {
    let role = item?.layout_role ?? item?.sectionLayoutRole ?? '';
    const norm = this._normalizeLayoutRoleKey(role);
    const parentLr = this._normalizeLayoutRoleKey(
      parentSection?.layoutRole || parentSection?.sourceItem?.layout_role || ''
    );
    if (norm === 'cabinet_root' && parentLr === 'cabinet_root') {
      if (this._isDrawerCatalogElementType(item?.spec)) {
        role = 'drawer';
        console.warn('[CLD][drawer] layout_role cabinet_root у ящика заменён на drawer:', item?.name || '');
      } else {
        role = '';
        console.warn(
          '[CLD][layout] layout_role cabinet_root у вложенного module сброшен:',
          item?.name || ''
        );
      }
    }
    if (!this._normalizeLayoutRoleKey(role) && this._isDrawerCatalogElementType(item?.spec)) {
      role = 'drawer';
    }
    return role;
  }

  /** Шкаф: pos.z+size.z из JSON уже до переднего торца родителя (превью: pos.z=50, size.z=550, parentZ=600). */
  _isDrawerCatalogSlotLockedToParent(item, pos, size, parentZ) {
    const rawPosZ = item?.pos?.z;
    if (rawPosZ === undefined || rawPosZ === null || rawPosZ === '') return false;
    if (typeof rawPosZ === 'string' && /s\s*:/i.test(String(rawPosZ).trim())) return false;
    const pz = Number(typeof rawPosZ === 'number' ? rawPosZ : pos?.z);
    const sz = Number(size?.z);
    const pZ = Number(parentZ) || 0;
    if (!Number.isFinite(pz) || pz < 0 || !Number.isFinite(sz) || !(sz > 0) || !(pZ > 0)) return false;
    const front = pz + sz;
    return front <= pZ + 1.5 && front >= pZ - 1.5;
  }

  /** Комната: ящик в полосе корпуса (не на всю высоту cabinet_root). */
  _applyRoomDrawerModuleShellLayout(item, parentSection, layoutRole) {
    const lr = this._normalizeLayoutRoleKey(layoutRole);
    if (lr !== 'drawer') return null;
    if ((this._catalogModuleBuildDepth || 0) > 0) return null;
    if (!parentSection || !parentSection.size) return null;

    const manualLayout =
      !!(item && item.spec && (item.spec.manual_layout === true || item.spec.keep_manual_layout === true || item.spec.layoutZonesLock === true)) ||
      !!(item && (item.manual_layout === true || item.keep_manual_layout === true));
    if (manualLayout) return null;

    let size = this.evaluateSize(item.size || {}, parentSection);
    let pos = this.evaluatePosition(item.pos || {}, parentSection, size);
    let pivot = this.evaluatePivot(item.pivot || {}, size);

    const parentX = Number(parentSection.size.x) || 0;
    const parentY = Number(parentSection.size.y) || 0;
    const parentZ = Number(parentSection.size.z) || 0;
    const ref = item?.spec?.ref_size_mm && typeof item.spec.ref_size_mm === 'object'
      ? item.spec.ref_size_mm
      : null;
    const catItem = this._getCatalogItemById(item?.spec?.element_type, item?.spec?.id);
    const catH = Number(this._catalogItemDataField(catItem, 'height')) || 0;
    const catD = Number(this._catalogItemDataField(catItem, 'depth')) || 0;
    const lockedDepthMm = Math.max(0, Number(item?.spec?.depth_locked_mm) || 0);
    // Глубина ящика фиксирована карточкой catalog_33 (depth). По Z ничего не «тянем» под корпус:
    // depth_locked_mm (правило подбора) → иначе глубина из собственной карточки ящика.
    const fixedDepthMm = lockedDepthMm > 0 ? lockedDepthMm : catD > 0 ? catD : 0;
    const manualDrawerPosZ =
      !!(item?.spec?.drawer_pos_z_manual || item?.spec?.manual_layout || item?.spec?.keep_manual_layout);

    if (parentY > 0 && Number(size.y) >= parentY * 0.85) {
      size.y = Number(ref?.y) || catH || 162;
    }
    const sizeXExpr = String(item?.size?.x ?? '').trim();
    const wantsFullDrawerWidth =
      /^s:\s*x$/i.test(sizeXExpr) ||
      (parentX > 0 && Number(size.x) >= parentX * 0.98);
    if (wantsFullDrawerWidth && parentX > 0) {
      // Полоса ящика = ширина cabinet_root (s:x). Боковины 16 мм уже в catalog_36;
      // повторный −32 давал щель ~32 мм на фасадах в комнате.
      size.x = parentX;
      const jsonPosX = Number(item?.pos?.x);
      pos.x = Number.isFinite(jsonPosX) ? jsonPosX : 0;
    }

    const slotLocked = this._isDrawerCatalogSlotLockedToParent(item, pos, size, parentZ);
    const refZ = Number(ref?.z) || 0;

    if (!slotLocked) {
      if (fixedDepthMm > 0) {
        size.z = fixedDepthMm;
      } else {
        const sizeZExpr = String(item?.size?.z ?? '').trim();
        const wantsFullDrawerDepth =
          /s:\s*z/i.test(sizeZExpr) || (parentZ > 0 && Number(size.z) >= parentZ * 0.85);
        const backInsetNominalZ = 50;
        if (wantsFullDrawerDepth && parentZ > 0) {
          size.z = Math.max(0, parentZ - backInsetNominalZ);
        } else if (parentZ > 0 && Number(size.z) >= parentZ * 0.98) {
          size.z = Math.max(0, parentZ - backInsetNominalZ);
        }
      }
    } else if (refZ > 0) {
      size.z = refZ;
    }

    const z = this.layoutZones && this.layoutZones.zones ? this.layoutZones.zones : null;
    const plinthMm =
      z && Number.isFinite(Number(z.plinthMm))
        ? Math.max(0, Number(z.plinthMm))
        : Math.max(0, Number(this.variables?.h_bottom) || 0);
    const jsonY = Number(pos.y);
    if (!Number.isFinite(jsonY) || jsonY <= 0) {
      pos.y = plinthMm + 18;
    } else if (jsonY < parentY * 0.5 && jsonY < plinthMm + 5) {
      pos.y = plinthMm + jsonY;
    }

    if (!manualDrawerPosZ && !(fixedDepthMm > 0) && (pos.z === 16 || String(pos.z).trim() === '16')) {
      pos.z = 50;
    }

    // Комната: pos.z + size.z = parentZ (фасад 16 мм — внутри catalog_29, не на слоте).
    if (!slotLocked) {
      const insetZ = Number(pos.z);
      const backInset = Number.isFinite(insetZ) && insetZ > 0 ? insetZ : 50;
      if (fixedDepthMm > 0 && parentZ > 0 && !manualDrawerPosZ) {
        pos.z = Math.max(0, parentZ - fixedDepthMm);
      } else if (parentZ > 0) {
        const maxDrawerZ = Math.max(0, parentZ - backInset);
        const sz = Number(size.z);
        if (sz > maxDrawerZ + 0.5) {
          size.z = maxDrawerZ;
        } else if (sz < maxDrawerZ - 0.5) {
          size.z = maxDrawerZ;
        }
      }
    } else {
      const rawPosZ = item?.pos?.z;
      if (typeof rawPosZ === 'number' && Number.isFinite(rawPosZ)) {
        pos.z = rawPosZ;
      }
    }

    pivot = {
      x: -Number(size.x) / 2,
      y: -Number(size.y) / 2,
      z: -Number(size.z) / 2,
    };
    try {
      const catW = Number(this._catalogItemDataField(catItem, 'width')) || 0;
      if (typeof window !== 'undefined' && window.__CLD_DEBUG_BUILDER === true) {
        console.warn('[CLD][DRAWER-W] shell', {
          name: item?.name || '',
          catalog: `${item?.spec?.element_type || ''}#${item?.spec?.id || ''}`,
          sizeXExpr,
          parentName: parentSection?.name || '',
          parentX,
          evalSizeXBeforeShell: Number(
            this.evaluateSize(item.size || {}, parentSection).x
          ) || 0,
          shellSizeX: Number(size.x) || 0,
          shellPosX: Number(pos.x) || 0,
          cardDataWidth: catW,
          deltaShellMinusCard: catW > 0 ? Number(size.x) - catW : null,
          wantsFullDrawerWidth,
        });
      }
    } catch (_) {}
    return { size, pos, pivot };
  }

  /**
   * Высота верхней полки facades_top (антресоль над corpus_antresol), мм.
   * corpus_antresol_mm в шкафах часто = высота основного корпуса, не этой полки.
   */
  _facadesTopShelfHeightMm(parentSection) {
    const py = Number(parentSection?.size?.y);
    if (!(py > 0)) return 0;
    const hb = Math.max(0, Number(this.variables?.h_bottom) || 0);
    const ca = Math.max(0, Number(this.variables?.corpus_antresol_mm) || 0);
    const tech = Math.max(
      0,
      Number(
        this.variables?.tech_zone_mm ??
          this.variables?.h_service ??
          this.variables?.service_zone_mm
      ) || 0
    );
    return Math.max(0, py - hb - ca - tech);
  }

  /** doorH для петель facades_top — не путать с corpus_antresol_mm (полоса корпуса). */
  _resolveFacadesTopHingeDoorHeightMm(facadeShellSize, parentSection) {
    const shellY = Number(facadeShellSize?.y);
    const topBand = this._facadesTopShelfHeightMm(parentSection);
    const ca = Math.max(0, Number(this.variables?.corpus_antresol_mm) || 0);
    if (topBand > 0) {
      if (ca > 0 && shellY >= ca * 0.85 && topBand < ca * 0.85) return topBand;
      if (shellY > topBand * 1.025) return topBand;
      if (shellY > 0) return shellY;
      return topBand;
    }
    return shellY > 0 ? shellY : Math.max(1, Number(parentSection?.size?.y) || 1);
  }

  /** doorH для цельной двери (facades_main + facades_top без стыка). */
  _resolveUnifiedFacadeDoorHeightMm(parentSection) {
    const py = Number(parentSection?.size?.y);
    if (!(py > 0)) return 0;
    const hb = Math.max(0, Number(this.variables?.h_bottom) || 0);
    const tech = Math.max(
      0,
      Number(
        this.variables?.tech_zone_mm ??
          this.variables?.h_service ??
          this.variables?.service_zone_mm
      ) || 0
    );
    return Math.max(1, py - hb - tech);
  }

  _getUnifiedFacadeBandHeightsMm(fullHeightMm, parentSection) {
    const fullH = Math.max(1, Number(fullHeightMm) || 0);
    const mainH = Math.max(1, Number(this.variables?.corpus_antresol_mm) || 0);
    const topShelf =
      parentSection && typeof this._facadesTopShelfHeightMm === 'function'
        ? Math.max(0, Number(this._facadesTopShelfHeightMm(parentSection)) || 0)
        : 0;
    const topH = topShelf > 0 ? Math.max(1, topShelf) : Math.max(1, fullH - mainH);
    return { fullH, mainH, topH };
  }

  /** Нижняя полоса фасада (корпус / цельная дверь), не антресоль facades_top. */
  _isLowerFacadeBandRole(layoutRole) {
    const r = this._normalizeLayoutRoleKey(layoutRole);
    return r === 'facades_main' || r === 'facades';
  }

  /**
   * Y нижнего края полосы фасада в координатах родителя (мм).
   * facades на секции от пола: низ двери у v:h_bottom, не у pos.y секции (0).
   * Внутри corpus / facades_main: pos.y уже у дна корпуса — не добавлять h_bottom повторно.
   */
  _resolveFacadeBandBottomY(py, sy, layoutRole, parentSection) {
    const hb = Math.max(0, Number(this.variables?.h_bottom) || 0);
    const r = this._normalizeLayoutRoleKey(layoutRole);
    if (r !== 'facades' || hb <= 0) return py;
    const parentRole = this._normalizeLayoutRoleKey(parentSection?.layoutRole || '');
    if (parentRole !== 'facades') return py;
    if (!(py < hb)) return py;
    const topY = py + sy;
    if (!(topY > hb)) return py;
    return hb;
  }

  /**
   * Комната: низ facades_main / facades ниже дна корпуса.
   * Стандарт: 30 мм (при h_bottom=100 → 70 мм от пола). Глубокий режим (шаг 4): 25 мм от пола.
   * Переопределение: clodisVariables.facade_bottom_overhang_mm
   */
  _resolveLowerFacadeBottomOverhangMm() {
    const hbRaw = Math.max(0, Number(this.variables?.h_bottom) || 0);
    const floorLikeProduct = this._isPedestalLikeProduct();
    // Для напольных модулей без явного h_bottom используем дефолт цоколя 100 мм.
    // Это возвращает ожидаемый свес 30 мм (или 75 мм в режиме 2.5 см) как раньше.
    const hb = hbRaw > 0 ? hbRaw : floorLikeProduct ? 100 : 0;
    const layout = typeof window !== 'undefined' ? window.__cldFurnitureDoorLayout : null;
    if (layout && typeof layout.resolveLowerFacadeBottomOverhangMm === 'function') {
      return layout.resolveLowerFacadeBottomOverhangMm(hb, this.variables || {});
    }
    const explicit = Number(this.variables?.facade_bottom_overhang_mm);
    if (Number.isFinite(explicit) && explicit >= 0) return explicit;
    if (hb <= 0) return 0;
    if (typeof window !== 'undefined' && window.step4FacadeBottomDeep === true) {
      return Math.max(0, hb - 25);
    }
    return 30;
  }

  _isPedestalLikeProduct() {
    const pk = String(this.productKind || '').trim().toLowerCase();
    return pk === 'pedestal' || pk === 'standalone_floor';
  }

  _applyLowerFacadeBottomOverhangToShell(size, pos, layoutRole, parentSection) {
    if (!size || !pos || !this._isLowerFacadeBandRole(layoutRole)) return 0;
    const oh = this._resolveLowerFacadeBottomOverhangMm();
    if (!(oh > 0)) return 0;
    const py = Number(pos.y);
    const sy = Number(size.y);
    if (!Number.isFinite(py) || !Number.isFinite(sy) || sy <= 0) return 0;
    const topY = py + sy;
    const bandBottom = this._resolveFacadeBandBottomY(py, sy, layoutRole, parentSection);
    const newBottom = bandBottom - oh;
    pos.y = newBottom;
    size.y = Math.max(0, topY - newBottom);
    return oh;
  }

  /** Нижний ящик в стеке (catalog_33, layout_role drawer) — для свеса низа как у распашки. */
  _isBottomDrawerModule(item, parentSection) {
    const role = this._normalizeLayoutRoleKey(
      item?.layout_role ?? item?.sectionLayoutRole ?? ''
    );
    if (role !== 'drawer') return false;
    if (String(item?.spec?.element_type || '').toLowerCase() !== 'catalog_33') return false;

    const id = String(item?.id || '');
    const stackM = id.match(/__stack_(\d+)$/i);
    if (stackM) return Number(stackM[1]) === 1;

    const py = Number(item?.pos?.y);
    const siblings = Array.isArray(parentSection?.sourceItem?.children)
      ? parentSection.sourceItem.children
      : [];
    const drawerPeers = siblings.filter((s) => {
      if (!s || s === item) return false;
      const sr = this._normalizeLayoutRoleKey(s.layout_role ?? s.sectionLayoutRole ?? '');
      return (
        sr === 'drawer' && String(s?.spec?.element_type || '').toLowerCase() === 'catalog_33'
      );
    });
    if (!drawerPeers.length) return true;
    if (!Number.isFinite(py)) return true;
    for (const s of drawerPeers) {
      const spy = Number(s?.pos?.y);
      if (Number.isFinite(spy) && spy < py - 0.5) return false;
    }
    return true;
  }

  /** Ящик / slide-аниматор: ручка только через handle-drawer-attach (не по orientation «f» — он у всех фасадов). */
  _isDrawerBandFacadeTreeNode(n, parentSection) {
    if (!n || typeof n !== 'object') return false;
    if (String(n.type || '').toLowerCase() !== 'facade') return false;
    let ctx = parentSection;
    for (let i = 0; i < 12 && ctx; i++) {
      if (ctx.slideAnimatorLocalBuild) return true;
      const lr = this._normalizeLayoutRoleKey(ctx.layoutRole || '');
      if (lr === 'drawer') return true;
      ctx = ctx._cldSectionContext || ctx.parent || null;
    }
    const lr = this._normalizeLayoutRoleKey(
      n.layout_role ?? n.layoutRole ?? n.sectionLayoutRole ?? ''
    );
    return lr === 'drawer';
  }

  /** Фасад внутри catalog_33 / slide — не навешивать __cld_facade_handle (только drawer-attach или ни одной). */
  _isFacadeInsideDrawerAssembly(facadeGroup) {
    if (!facadeGroup) return false;
    let n = facadeGroup;
    while (n) {
      if (n.userData?.cldDrawerNoHandle === true) return true;
      if (n.name === '__slide_own' || n.userData?.cldSlide) return true;
      if (n.userData?.cldSlideAnimator) return true;
      const item = n.userData?.cldBuildItem;
      const et = String(item?.spec?.element_type || '').toLowerCase();
      if (et === 'catalog_33') return true;
      const lr = this._normalizeLayoutRoleKey(
        item?.layout_role ?? item?.layoutRole ?? n.userData?.layoutRole ?? ''
      );
      if (lr === 'drawer') return true;
      n = n.parent;
    }
    return false;
  }

  /** Фасад ящика в template_tree (свес снизу) — только геометрия, не ручки. */
  _isDrawerFrontFacadeTreeNode(n) {
    if (!n || typeof n !== 'object') return false;
    if (String(n.type || '').toLowerCase() !== 'facade') return false;
    const spec = n.spec && typeof n.spec === 'object' ? n.spec : {};
    if (String(spec.orientation || '').toLowerCase() === 'f') return true;
    const nm = String(n.name || '').toLowerCase();
    return /фасад|facade/.test(nm);
  }

  _adjustDrawerFacadeExprYPlus(expr, deltaMm) {
    const d = Number(deltaMm);
    if (!Number.isFinite(d) || Math.abs(d) < 0.01) return expr;
    if (typeof expr === 'number' && Number.isFinite(expr)) return expr + d;
    const s = String(expr || '').trim();
    if (!s) return s;
    const mPlus = s.match(/^s:y\+(\d+(?:\.\d+)?)$/i);
    if (mPlus) return `s:y+${Number(mPlus[1]) + d}`;
    const mMinus = s.match(/^s:y\s*-\s*(\d+(?:\.\d+)?)$/i);
    if (mMinus) return `s:y+${d - Number(mMinus[1])}`;
    if (/^s:y$/i.test(s)) return `s:y+${d}`;
    return s;
  }

  /**
   * Комната шаг 4: опустить только фасад нижнего ящика (catalog_29 внутри catalog_33).
   * Межъящичное нависание ±14.5 мм не трогаем — добавляем только step4 overhang.
   */
  _applyLowerDrawerFacadeBottomOverhangInTree(nodes, overhangMm) {
    const oh = Number(overhangMm);
    if (!Number.isFinite(oh) || oh <= 0 || !Array.isArray(nodes)) return 0;
    let touched = 0;
    const walk = (list) => {
      if (!Array.isArray(list)) return;
      for (const n of list) {
        if (!n || typeof n !== 'object') continue;
        if (this._isDrawerFrontFacadeTreeNode(n)) {
          n.pos = n.pos && typeof n.pos === 'object' ? n.pos : {};
          n.size = n.size && typeof n.size === 'object' ? n.size : {};
          const py = n.pos.y;
          if (typeof py === 'number' && Number.isFinite(py)) {
            n.pos.y = py - oh;
          } else if (typeof py === 'string' && /^-?\d+(\.\d+)?$/.test(py.trim())) {
            n.pos.y = Number(py) - oh;
          }
          if (typeof n.size.y === 'number' && Number.isFinite(n.size.y)) {
            n.size.y = n.size.y + oh;
          } else if (n.size.y != null) {
            n.size.y = this._adjustDrawerFacadeExprYPlus(n.size.y, oh);
          }
          touched += 1;
        }
        if (Array.isArray(n.children)) walk(n.children);
        if (Array.isArray(n.spec?.template_tree)) walk(n.spec.template_tree);
      }
    };
    walk(nodes);
    return touched;
  }

  /**
   * Комната шаг 4: свес низа только на полотне двери в дереве (как у ящика).
   * Оболочку facades_* и pos петель не трогаем — петли остаются как без свеса.
   */
  _applyLowerDoorFacadeBottomOverhangInTree(nodes, overhangMm) {
    return this._applyLowerDrawerFacadeBottomOverhangInTree(nodes, overhangMm);
  }

  /** Логи стыка фасад↔корпус: window.DEBUG_FACADE_Z = false чтобы выключить. */
  _facadeZDbgEnabled() {
    if (typeof window === 'undefined') return true;
    if (window.DEBUG_FACADE_Z === false) return false;
    return true;
  }

  _facadeZLog(tag, payload) {
    if (!this._facadeZDbgEnabled()) return;
    try {
      console.warn(`[CLD][FACADE-Z] ${tag}`, payload);
    } catch (_) {}
  }

  _isThinFacadeShellDepth(depthMm) {
    const d = Number(depthMm);
    return Number.isFinite(d) && d > 0 && d <= 28;
  }

  /**
   * Комната: полотно фасада внутри catalog_28 (animator/section), даже если родительская
   * секция с петлями имеет полную глубину ниши (hinge pos.z из превью).
   */
  _isRoomFacadePanelContext(parentSection) {
    if (!parentSection) return false;
    if ((this._catalogModuleBuildDepth || 0) > 0) return true;
    if (parentSection.facadeThinShell || parentSection.hingeModuleLocalBuild) return true;
    const lr = this._normalizeLayoutRoleKey(parentSection.layoutRole || '');
    return this._isFacadeLayoutRole(lr);
  }

  /** Ручка на фасаде в комнате (не превью-призрак). */
  _shouldAttachHandleOnFacade(facadeGroup, parentSection) {
    if (!facadeGroup?.userData?.isFacade) return false;
    if (this._suppressHingeRoomLog) return false;
    if (this.placementKind || this.layoutZones || this.productKind) return true;
    if (this._isRoomFacadePanelContext(parentSection)) return true;
    return false;
  }

  /**
   * Реф Door_new: width/height − 2×facade_offset, pos смещён на offset.
   * Если в JSON каталога уже заданы inset (1.5, s:x-3, …) — не дублируем.
   */
  _facadePanelHasAuthoredInset(item) {
    const pos = item?.pos || {};
    const size = item?.size || {};
    const numPos = (v) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) > 0.05;
    if (numPos(pos.x) || numPos(pos.y)) return true;
    const strPos = (v) => typeof v === 'string' && v.trim() && v.trim() !== '0';
    if (strPos(pos.x) || strPos(pos.y)) return true;
    const sx = String(size.x ?? '').trim();
    const sy = String(size.y ?? '').trim();
    const isBare = (s, axis) => !s || s === `s:${axis}` || s === `s.${axis}`;
    if (!isBare(sx, 'x') && (/[-+]/.test(sx) || Number(sx) > 0)) return true;
    if (!isBare(sy, 'y') && (/[-+]/.test(sy) || Number(sy) > 0)) return true;
    return false;
  }

  /** Реф project_settings.door_offset / Door_new.build_ltr — только геометрия полотна. */
  _applyRefFacadePanelInsetMm(pos, size, gapMm = 1.5) {
    const g = Number(gapMm);
    if (!Number.isFinite(g) || g <= 0) return;
    pos.x = (Number(pos.x) || 0) + g;
    pos.y = (Number(pos.y) || 0) + g;
    size.x = Math.max(1, (Number(size.x) || 0) - 2 * g);
    size.y = Math.max(1, (Number(size.y) || 0) - 2 * g);
  }

  _resolveRefFacadePanelInsetMm() {
    const gen = typeof window !== 'undefined' ? window.__cldHingeLayout : null;
    if (gen && typeof gen.ensureHingeRoleLayoutParams === 'function') {
      try {
        const p = gen.ensureHingeRoleLayoutParams({});
        const edge = Number(p?.facadeEdgeOffset);
        if (Number.isFinite(edge) && edge > 0) return edge;
      } catch (_) {}
    }
    return 1.5;
  }

  /**
   * Комната: смещение оси распашки (мм) из «Петли по ролям» (resolveHingeRoleLayoutParams).
   * Отладка: window.__CLD_ROOM_DOOR_PIVOT_OFFSET = { x, y, z } или null (отключить).
   */
  _resolveRoomDoorPivotOffsetMm(parentSection) {
    const zero = { x: 0, y: 0, z: 0 };
    const ctx = this._facadeHingeContext || {};
    let layoutRole = parentSection?.layoutRole || ctx.layoutRole || '';
    if (!layoutRole && parentSection) {
      let p = parentSection;
      for (let i = 0; i < 12 && p && !layoutRole; i++) {
        layoutRole = p.layoutRole || '';
        p = p.parent || p._cldSectionContext;
      }
    }
    if (!layoutRole && parentSection?.groupRef?.userData?.layoutRole) {
      layoutRole = parentSection.groupRef.userData.layoutRole;
    }
    const gen = typeof window !== 'undefined' ? window.__cldHingeLayout : null;
    const productKind =
      this.productKind ||
      (gen && typeof gen.placementKindToProductKind === 'function'
        ? gen.placementKindToProductKind(this.placementKind)
        : '') ||
      'wardrobe';
    if (gen && typeof gen.resolveDoorPivotOffsetMm === 'function') {
      try {
        const off = gen.resolveDoorPivotOffsetMm({
          facadeLayoutRole: layoutRole,
          productKind,
          placementKind: this.placementKind,
          catalogHingeLayoutId: ctx.catalogHingeLayoutId,
          furnitureHingeLayoutOverride: this.hingeLayoutOverride,
        });
        const resolved = {
          x: Number(off.x) || 0,
          y: Number(off.y) || 0,
          z: Number(off.z) || 0,
          __source: 'hinge-role-defaults',
          __layoutRole: layoutRole,
        };
        if (
          typeof window !== 'undefined' &&
          (window.DEBUG_FACADE_DOOR || window.DEBUG_HINGE_ROOM)
        ) {
          try {
            console.info('[CLD][DOOR-OFFSET] resolve', {
              layoutRole,
              productKind,
              placementKind: this.placementKind,
              offset: resolved,
            });
          } catch (_) {}
        }
        return resolved;
      } catch (_) {}
    }
    if (typeof window !== 'undefined' && window.__CLD_ROOM_DOOR_PIVOT_OFFSET === null) {
      return { ...zero, __source: 'disabled' };
    }
    if (typeof window !== 'undefined' && window.__CLD_ROOM_DOOR_PIVOT_OFFSET) {
      const o = window.__CLD_ROOM_DOOR_PIVOT_OFFSET;
      if (o && typeof o === 'object') {
        return {
          x: Number.isFinite(Number(o.x)) ? Number(o.x) : 0,
          y: Number.isFinite(Number(o.y)) ? Number(o.y) : 0,
          z: Number.isFinite(Number(o.z)) ? Number(o.z) : 0,
          __source: 'window-override',
          __layoutRole: layoutRole,
        };
      }
    }
    return { ...zero, __source: 'none', __layoutRole: layoutRole };
  }

  _isRoomFacadeDoorRotateContext(parentSection) {
    if (!parentSection || parentSection.hingeModuleLocalBuild) return false;
    if (parentSection.facadeThinShell) return true;
    const shellD = Number(parentSection.facadeShellDepthMm) || Number(parentSection.size?.z);
    return this._isThinFacadeShellDepth(shellD);
  }

  _isRoomSideSwingGeometry(axis, isTop, isBottom) {
    return axis === 'y' && !isTop && !isBottom;
  }

  _isRoomSwingOpenCapActive() {
    return !this._suppressHingeRoomLog;
  }

  _isRoomSideSwingDoor(axis, isTop, isBottom) {
    if (!this._isRoomSwingOpenCapActive()) return false;
    return this._isRoomSideSwingGeometry(axis, isTop, isBottom);
  }

  _roomSideSwingOpenRad(sign) {
    const s = Math.sign(sign) || 1;
    return THREE.MathUtils.degToRad(ClodisBuilder.ROOM_SWING_DOOR_OPEN_DEG) * s;
  }

  /** Комната: боковые распашные — не 90° из каталога, только ROOM_SWING_DOOR_OPEN_DEG. */
  _capRoomSideSwingRad(rad, axis, isTop, isBottom) {
    if (!this._isRoomSwingOpenCapActive()) return rad;
    if (!this._isRoomSideSwingGeometry(axis, isTop, isBottom)) return rad;
    const sign = Math.sign(Number(rad)) || 1;
    return this._roomSideSwingOpenRad(sign);
  }

  /** Комната: боковые распашные (ось Y) по умолчанию приоткрыты на 85°. */
  _applyRoomSwingDoorDefaultOpenIfNeeded(swing, sw, spec, axis, isTop, isBottom) {
    if (!swing || !sw || !this._isRoomSwingOpenCapActive()) return;
    if (!this._isRoomSideSwingGeometry(axis, isTop, isBottom)) return;
    if (Math.abs(Number(sw.currentAngle) || 0) > 1e-4) return;
    const sign = Math.sign(Number(sw.maxAngle)) || 1;
    const openRad = this._roomSideSwingOpenRad(sign);
    sw.roomOpenAngleRad = openRad;
    sw.maxAngle = openRad;
    sw.roomSideSwing = true;
    sw.roomDefaultOpenAngle = openRad;
    sw.isOpen = true;
    sw.targetAngle = openRad;
    sw.currentAngle = openRad;
    this._applyDoorSwingPoseFromState(swing);
  }

  /** Применить currentAngle/targetAngle к rotation группы __door_swing. */
  _applyDoorSwingPoseFromState(swing) {
    if (!swing) return;
    const sw = swing.userData && swing.userData.cldDoorSwing;
    if (!sw) return;
    const cur =
      sw.currentAngle != null
        ? sw.currentAngle
        : sw.targetAngle != null
          ? sw.targetAngle
          : 0;
    sw.currentAngle = cur;
    if (sw.axis === 'y') swing.rotation.y = cur;
    else if (sw.axis === 'x') swing.rotation.x = cur;
    else if (sw.axis === 'z') swing.rotation.z = cur;
  }

  /**
   * После reparent hinge_animator: фасадная половина крутится только с дверным __door_swing,
   * вложенный swing петли — всегда 0° (не дублировать угол двери).
   */
  _finalizeHingeFacadeSwingPoseAfterReparent(doorSwing) {
    if (!doorSwing) return;
    this._applyDoorSwingPoseFromState(doorSwing);
    doorSwing.traverse((o) => {
      if (!o || o === doorSwing) return;
      const animId = String(o.userData?.animatorId || '').toLowerCase();
      if (animId === 'hinge_animator') {
        this._neutralizeHingeAnimatorSwingState(o);
        return;
      }
      if (o.name !== '__door_swing') return;
      this._neutralizeNestedDoorSwing(o);
    });
  }

  /**
   * Превью constructor-clodis: door_offset сдвигает аниматор, полотно остаётся на месте.
   * НЕ добавлять тот же offset в pivot swing — иначе z:7 при pivotZ=0 даёт ось в центре 16 мм.
   */
  _applyRoomDoorOffsetLikePreview(animatorGroup, facadeGroup, dOff) {
    if (!animatorGroup || !facadeGroup || !dOff || typeof dOff !== 'object') return false;
    if (facadeGroup.userData?._cldRoomDoorOffsetApplied) return false;
    const dx = Number(dOff.x) || 0;
    const dy = Number(dOff.y) || 0;
    const dz = Number(dOff.z) || 0;
    if (!dx && !dy && !dz) return false;
    animatorGroup.position.x += dx;
    animatorGroup.position.y += dy;
    animatorGroup.position.z += dz;
    facadeGroup.position.x -= dx;
    facadeGroup.position.y -= dy;
    facadeGroup.position.z -= dz;
    const stored = facadeGroup.userData?._cldBlbContentOffset;
    if (stored && typeof stored === 'object') {
      facadeGroup.userData._cldBlbContentOffset = {
        x: (Number(stored.x) || 0) - dx,
        y: (Number(stored.y) || 0) - dy,
        z: (Number(stored.z) || 0) - dz,
      };
    }
    facadeGroup.userData._cldRoomDoorOffsetApplied = true;
    facadeGroup.userData._cldRoomDoorOffsetMm = { x: dx, y: dy, z: dz };
    return true;
  }

  /** @deprecated — swing-offset давал z=7 от задней грани → ось в t/2; используйте preview-offset. */
  _applyRoomDoorPivotOffsetToSwing(swing) {
    void swing;
  }

  _applyRoomDoorPivotOffsetOnFacadeGroup(facadeGroup) {
    void facadeGroup;
  }

  _resolveRoomFacadeThicknessMm(parentSection, facadeGroup) {
    const fromGroup = Number(facadeGroup?.userData?.facadeThicknessMm);
    if (Number.isFinite(fromGroup) && fromGroup > 0) return fromGroup;
    const fromCtx = Number(this._facadeHingeContext?.facadeThicknessMm);
    if (Number.isFinite(fromCtx) && fromCtx > 0) return fromCtx;
    const shellFromParent = Number(parentSection?.facadeShellDepthMm);
    if (this._isThinFacadeShellDepth(shellFromParent)) return shellFromParent;
    const ps = Number(parentSection?.size?.z);
    if (this._isThinFacadeShellDepth(ps)) return ps;
    const ftOff = Number(parentSection?.facadeThicknessOffset);
    if (this._isThinFacadeShellDepth(ftOff)) return ftOff;
    return 16;
  }

  /**
   * catalog_31 — карточка превью (~63 мм по Z): hinge_animator `pos.z = s:z + 18/2 ≈ 72` и
   * корпус-мешь `pos.z = 10, size.z = 72`. В комнате оболочка facades_* — 16 мм, обе половины
   * без правок торчат вперёд из накладки.
   *
   * Реф Door_new.build_hinges (part7):
   *   корпус: `position.z = -hinge_door.z / 2`  → уходит в шкаф (Z<0)
   *   фасад:  `position.z = -ft/2 - hinge_facade.z / 2` → за тылом фасада, в его толщине
   *
   * Никакого масштабирования: только сдвиги. Сжатие (scale.z) деформировало бы геометрию.
   * Алгоритм для нашей оболочки 16 мм:
   *   1) hinge_animator (фасадная половина) → в local своего parent сместить, чтобы его BLB-фронт
   *      лёг на z=0 hingeMod (плоскость стыка фасад-корпус, она же тыл накладки в hingeMod local).
   *   2) корпусная sub-section (контейнер «Петля накладная корпус») → bbox её детей в local hingeMod
   *      должен иметь max.z = 0 (передняя грань корпус-меша на стыке, остальное уходит в Z<0).
   */
  _applyHingeCatalogOverlayDepthRemap(hingeMod, item, parentSection, hingeIntrinsic) {
    // disabled until Bazis placer rewrite — old overlay depth remap off
    return;
    void item;
    void hingeIntrinsic;
    if (!hingeMod || typeof THREE === 'undefined') return;
    if (!this._useCatalogHingeModulesInRoom()) return;
    const shellD = this._resolveRoomFacadeThicknessMm(parentSection);
    if (!this._isThinFacadeShellDepth(shellD)) return;

    hingeMod.updateMatrixWorld(true);

    const animators = [];
    const corpusSections = [];
    hingeMod.traverse((o) => {
      if (!o || o === hingeMod) return;
      if (o.userData?.isAnimator) {
        const aid = String(o.userData.animatorId || '').toLowerCase();
        if (aid === 'hinge_animator') animators.push(o);
        return;
      }
      if (o.userData?.isSection) {
        let hasCorpusModel = false;
        let hasHingeAnimator = false;
        o.traverse((c) => {
          if (!c) return;
          if (c === o) return;
          if (
            !hasHingeAnimator &&
            c.userData?.isAnimator &&
            String(c.userData.animatorId || '').toLowerCase() === 'hinge_animator'
          ) {
            hasHingeAnimator = true;
          }
          if (!hasCorpusModel && /корпус/i.test(String(c.name || ''))) {
            hasCorpusModel = true;
          }
        });
        if (hasCorpusModel && !hasHingeAnimator) corpusSections.push(o);
      }
    });

    const logs = [];

    const roomThinShell =
      this._useCatalogHingeModulesInRoom() && this._isThinFacadeShellDepth(shellD);
    for (const anim of animators) {
      const prev = anim.position.z;
      anim.position.z = 0;
      anim.updateMatrixWorld(true);
      // Комната 16 мм: Z фасада только после reparent в swing, не превью-remap здесь.
      if (!roomThinShell) {
        this._remapHingeAnimatorFacadePartZToRef(anim, shellD, logs);
      }
      logs.push({
        kind: 'animator',
        name: anim.name,
        prevZ: prev,
        newZ: 0,
        shellD,
        skipFacadeRemap: roomThinShell,
      });
    }

    const innerCorpus = corpusSections.filter(
      (s) => !corpusSections.some((q) => q !== s && this._isAncestor(s, q)),
    );
    for (const sec of innerCorpus) {
      const parent = sec.parent;
      if (!parent) continue;
      parent.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(sec);
      if (box.isEmpty()) continue;
      const corners = [
        new THREE.Vector3(box.min.x, box.min.y, box.min.z),
        new THREE.Vector3(box.max.x, box.min.y, box.min.z),
        new THREE.Vector3(box.min.x, box.max.y, box.min.z),
        new THREE.Vector3(box.max.x, box.max.y, box.min.z),
        new THREE.Vector3(box.min.x, box.min.y, box.max.z),
        new THREE.Vector3(box.max.x, box.min.y, box.max.z),
        new THREE.Vector3(box.min.x, box.max.y, box.max.z),
        new THREE.Vector3(box.max.x, box.max.y, box.max.z),
      ];
      let maxZ = -Infinity;
      for (const c of corners) {
        const p = hingeMod.worldToLocal(c.clone());
        if (p.z > maxZ) maxZ = p.z;
      }
      if (!Number.isFinite(maxZ)) continue;
      const shift = -maxZ;
      if (Math.abs(shift) < 0.01) continue;
      sec.position.z += shift;
      sec.updateMatrixWorld(true);
      logs.push({ kind: 'corpus_section', name: sec.name, prevMaxZ: maxZ, shift });
    }

    hingeMod.userData.hingeOverlayRemapApplied = true;

    // Catalog: корпус якорится на боковине в finalize — не snap к z=0 hingeMod.
    if (!this._hingeModuleUsesCatalogGlb(hingeMod, null)) {
      this._snapCatalogHingeCorpusFrontToHingeModPlane(hingeMod);
    }

    if (this._hingeRoomDbg()) {
      console.warn('[CLD][HINGE-ROOM] overlayRemap', { shellD, logs });
    }
  }

  /**
   * catalog_31: корпус в превью pos.z=10 — передняя грань корпуса должна лежать на z=0 hingeMod
   * (плоскость стыка с тылом фасада). Сдвигаем только корпусную ветку, не весь hingeMod.
   */
  _snapCatalogHingeCorpusFrontToHingeModPlane(hingeMod) {
    if (!hingeMod || typeof THREE === 'undefined') return 0;
    const corpus = this._findHingeCorpusMeshIn(hingeMod);
    if (!corpus) return 0;
    hingeMod.updateMatrixWorld(true);
    corpus.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(corpus);
    if (box.isEmpty()) return 0;
    const corners = [
      new THREE.Vector3(box.min.x, box.min.y, box.min.z),
      new THREE.Vector3(box.max.x, box.min.y, box.min.z),
      new THREE.Vector3(box.min.x, box.max.y, box.min.z),
      new THREE.Vector3(box.max.x, box.max.y, box.min.z),
      new THREE.Vector3(box.min.x, box.min.y, box.max.z),
      new THREE.Vector3(box.max.x, box.min.y, box.max.z),
      new THREE.Vector3(box.min.x, box.max.y, box.max.z),
      new THREE.Vector3(box.max.x, box.max.y, box.max.z),
    ];
    let maxZ = -Infinity;
    for (const c of corners) {
      const p = hingeMod.worldToLocal(c.clone());
      if (p.z > maxZ) maxZ = p.z;
    }
    if (!Number.isFinite(maxZ) || Math.abs(maxZ) < 0.05) return 0;
    return this._shiftRoomHingeCorpusLocalZ(hingeMod, -maxZ);
  }

  _isAncestor(ancestor, node) {
    if (!ancestor || !node) return false;
    let p = node.parent;
    while (p) {
      if (p === ancestor) return true;
      p = p.parent;
    }
    return false;
  }

  /** После сборки: зазор по мировому Z между задней гранью ЛДСП фасада и передней гранью корпуса. */
  _measureFacadeCorpusGapMm(facadeModuleGroup, parentSection, facadeRole, label) {
    if (!facadeModuleGroup || !parentSection?.groupRef) return null;
    const cabinet = parentSection.groupRef;
    const role = this._normalizeLayoutRoleKey(facadeRole);
    const corpusRoles =
      role === 'facades_top'
        ? ['top', 'corpus_antresol']
        : ['corpus_antresol', 'corpus'];
    let corpusGroup = null;
    for (const cr of corpusRoles) {
      corpusGroup = cabinet.children.find((ch) => ch?.userData?.layoutRole === cr) || null;
      if (corpusGroup) break;
    }
    cabinet.updateMatrixWorld(true);
    facadeModuleGroup.updateMatrixWorld(true);
    const facadeBox = new THREE.Box3();
    const corpusBox = new THREE.Box3();
    let facadeMeshCount = 0;
    let corpusMeshCount = 0;
    facadeModuleGroup.traverse((o) => {
      if (!o?.isMesh) return;
      if (o.userData?.isHole || o.userData?.isAccessory) return;
      if (!o.userData?.isFacade) return;
      facadeBox.union(new THREE.Box3().setFromObject(o));
      facadeMeshCount++;
    });
    if (corpusGroup) {
      corpusGroup.traverse((o) => {
        if (!o?.isMesh || o.userData?.isHole) return;
        if (!(o.userData?.isBody || o.userData?.isDetail)) return;
        corpusBox.union(new THREE.Box3().setFromObject(o));
        corpusMeshCount++;
      });
    }
    if (facadeBox.isEmpty()) return null;
    const corpusFrontZ = corpusBox.isEmpty() ? NaN : corpusBox.max.z;
    const facadeBackZ = facadeBox.min.z;
    const gapMm = Number.isFinite(corpusFrontZ) ? facadeBackZ - corpusFrontZ : NaN;
    if (this._facadeZDbgEnabled()) {
      this._facadeZLog('gap-measure', {
        label,
        facadeRole: role,
        corpusRole: corpusGroup?.userData?.layoutRole || '?',
        moduleShellPosZ: facadeModuleGroup.position.z,
        corpusFrontZ,
        facadeBackZ,
        gapMm,
        facadeMeshCount,
        corpusMeshCount,
      });
    }
    return gapMm;
  }

  /** Узел фасада в Clodis: type:facade или module catalog_28 с ролью facades*. */
  _isFacadePlanNode(node) {
    if (!node || typeof node !== 'object') return false;
    const roleNorm = this._normalizeLayoutRoleKey(node.layout_role ?? node.sectionLayoutRole ?? '');
    const t = String(node.type || '').trim().toLowerCase();
    const et = String(node.spec?.element_type || '').toLowerCase();
    if (t === 'facade') return true;
    if (
      this._isFacadeLayoutRole(roleNorm) &&
      t === 'module' &&
      (et === 'catalog_28' || et === 'facades')
    ) {
      return true;
    }
    const name = String(node.name || node.spec?.key || '').trim().toLowerCase();
    return (
      t === 'module' &&
      (et === 'catalog_28' || et === 'facades') &&
      /фасад|facade/.test(name)
    );
  }

  /**
   * catalog_28 без layout_role: роль из карточки (имя + pos.y/size.y), не порядок siblings.
   * Если layout_role в JSON не совпадает с формулами — доверяем pos/size (ручки, петли).
   */
  _inferFacadeShellLayoutRoleFromCard(item, planChildren, parentSection) {
    const compact = (v) => String(v ?? '').trim().replace(/\s+/g, '');
    const name = String(item?.name || item?.spec?.key || '').trim().toLowerCase();
    const posY = compact(item?.pos?.y);
    const sizeY = compact(item?.size?.y);

    const isTopName =
      /антрес|antresol|верхн/i.test(name) && /фасад|facade|двер/i.test(name);
    const isMainName =
      (/шкаф|корпус|основ|main/i.test(name) && /фасад|facade|двер/i.test(name)) ||
      /^фасадшкаф/i.test(name.replace(/\s+/g, ''));
    if (isTopName && !isMainName) return 'facades_top';
    if (isMainName && !isTopName) return 'facades_main';

    if (/corpus_antresol/i.test(posY) && /\+/.test(posY)) return 'facades_top';
    if (/tech_zone|h_top/i.test(sizeY) && /corpus_antresol/i.test(sizeY)) return 'facades_top';
    if (/^v:h_bottom$/i.test(posY)) return 'facades_main';
    if (/^v:corpus_antresol_mm$/i.test(sizeY)) return 'facades_main';

    if (parentSection && Array.isArray(planChildren)) {
      const facades = planChildren.filter((c) => this._isFacadePlanNode(c));
      if (facades.length >= 2) {
        const scored = facades.map((c) => {
          let y = 0;
          try {
            const sz = this.evaluateSize(c.size || {}, parentSection);
            const p = this.evaluatePosition(c.pos || {}, parentSection, sz);
            y = Number(p.y) || 0;
          } catch (_) {}
          return { c, y };
        });
        scored.sort((a, b) => a.y - b.y);
        const idx = scored.findIndex((s) => s.c === item);
        if (idx === 0) return 'facades_main';
        if (idx === scored.length - 1) return 'facades_top';
      }
    }
    return '';
  }

  _inferFacadeShellLayoutRole(item, planChildren, parentSection) {
    const existing = this._normalizeLayoutRoleKey(item?.layout_role ?? item?.sectionLayoutRole ?? '');
    const fromCard = this._inferFacadeShellLayoutRoleFromCard(item, planChildren, parentSection);

    if (
      this._isFacadeLayoutRole(existing) &&
      fromCard &&
      existing !== fromCard
    ) {
      console.warn(
        '[CLD][facade] layout_role в JSON не совпадает с pos/size карточки — берём геометрию:',
        item?.name || '',
        `${existing} → ${fromCard}`
      );
      return fromCard;
    }
    if (this._isFacadeLayoutRole(existing)) return existing;
    if (!this._isFacadePlanNode(item)) return existing;
    if (fromCard) return fromCard;

    const sibRoles = this._planFacadeRolesFromChildren({ children: planChildren });
    if (!sibRoles.facades_main) return 'facades_main';
    if (!sibRoles.facades_top) return 'facades_top';
    return 'facades';
  }

  _pickFacadeThicknessMmFromNode(node, parentSection) {
    if (!this._isFacadePlanNode(node)) return 0;
    let evalSize = null;
    if (node.size && parentSection) {
      try {
        evalSize = this.evaluateSize(node.size, parentSection);
      } catch (_) {
        evalSize = null;
      }
    }
    let mm = this._resolveFacadeThicknessMm(node, evalSize || {});
    if (!(mm > 0)) {
      const v = Number(this.variables?.facade_thickness_mm);
      if (Number.isFinite(v) && v > 0) {
        mm = THREE.MathUtils.clamp(v, 8, 28);
      }
    }
    return mm;
  }

  /**
   * Сканирует детей cabinet_root: legacy (section → facade) и пирамида (module catalog_28).
   * @returns {number} мм — макс. толщина накладки для уменьшения глубины корпуса
   */
  _scanFacadeThicknessOffsetMm(children, parentSectionForEval) {
    let max = 0;
    const walk = (arr) => {
      if (!Array.isArray(arr)) return;
      for (const child of arr) {
        if (!child || typeof child !== 'object') continue;
        const mm = this._pickFacadeThicknessMmFromNode(child, parentSectionForEval);
        if (mm > max) max = mm;
        const t = String(child.type || '').trim().toLowerCase();
        const role = this._normalizeLayoutRoleKey(child.layout_role ?? child.sectionLayoutRole ?? '');
        if (role === 'drawer' || this._isDrawerCatalogElementType(child?.spec)) {
          const fromVar = Number(this.variables?.facade_thickness_mm);
          const drawerFt = Number.isFinite(fromVar) && fromVar > 0 ? fromVar : 16;
          if (drawerFt > max) max = drawerFt;
        }
        if (t === 'section' && !role && Array.isArray(child.children)) {
          walk(child.children);
        }
        if (this._isFacadeLayoutRole(role) && Array.isArray(child.children)) {
          for (const gc of child.children) {
            const gmm = this._pickFacadeThicknessMmFromNode(gc, parentSectionForEval);
            if (gmm > max) max = gmm;
          }
        }
      }
    };
    walk(children);
    return max;
  }

  /**
   * Роли ЛДСП-оболочек у cabinet_root: при фасаде depth уменьшаем один раз на module shell.
   * top (catalog_30) — та же глубина s:z, что у корпуса.
   * wall_hung_body — корпус навеса (как corpus у тумбы).
   */
  _moduleRoleUsesFacadeDepthInset(role) {
    const r = this._normalizeLayoutRoleKey(role);
    return (
      r === 'plinth' ||
      r === 'corpus' ||
      r === 'corpus_antresol' ||
      r === 'wall_hung_body' ||
      r === 'top' ||
      r === 'service'
    );
  }

  /**
   * Накладной фасад в комнате (3 слоя по Z, одна ось — наружу):
   * 1) Корпус (corpus/top): depth = nicheZ − inset, pos.z = 0 → передний край на (nicheZ − inset).
   * 2) Оболочка module facades_*: size.z = толщина, pos.z = nicheZ − inset (BLB = передний край корпуса).
   * 3) ЛДСП в catalog_28: minZ панели = 0 внутри оболочки (задняя грань = стык с корпусом), maxZ = толщина.
   * JSON pos.z = «s:z» в превью = передний торец полной глубины; в оболочке 16 мм не использовать.
   */
  _applyFacadeShellDepthToParent(item, parentSection, size, pos) {
    const facadeThick = this._resolveFacadeThicknessMm(item, size);
    size.z = facadeThick;
    const parentDepth = Number(parentSection?.size?.z);
    const inset = Math.max(0, Number(parentSection?.facadeThicknessOffset) || 0);
    if (Number.isFinite(parentDepth) && parentDepth > 0) {
      pos.z = Math.max(0, parentDepth - (inset > 0 ? inset : facadeThick));
    }
    return facadeThick;
  }

  /**
   * catalog_28 с петлями: дверная секция = полная глубина ниши (как Clodis),
   * иначе pos.z=-82 у модуля hinges уходит за шкаф в тонкой 16мм оболочке.
   */
  _applyFacadeRoomDepth(item, parentSection, size, pos) {
    if (this._facadeModuleTemplateHasHinges(item)) {
      const parentDepth = Number(parentSection?.size?.z);
      if (Number.isFinite(parentDepth) && parentDepth > 0) {
        size.z = parentDepth;
        pos.z = 0;
      }
      return Number(size.z) || 0;
    }
    return this._applyFacadeShellDepthToParent(item, parentSection, size, pos);
  }

  /** Есть ли в шаблоне фасадного module узлы element_type: hinges. */
  _facadeModuleTemplateHasHinges(item) {
    if (!item) return false;
    const embedded =
      item?.spec?.template_tree ||
      item?.template?.tree ||
      __cldItemEmbeddedTree(item);
    if (embedded && this._treeHasHingeModuleNodes(embedded)) return true;
    const spec = item.spec || {};
    const et = String(spec.element_type || item.element_type || '').toLowerCase();
    const id = spec.id != null ? String(spec.id) : '';
    if (!et || !id) return false;
    const fromCat = this._resolveModuleTemplateTreeFromCatalog(et, id);
    return !!(fromCat && this._treeHasHingeModuleNodes(fromCat));
  }

  /**
   * Фасады у cabinet_root — type:module (catalog_28), не section.
   * layoutZones и полосы facades_main/facades_top применяются здесь, иначе остаются только JSON-формулы.
   */
  /**
   * Только явные формулы v:… / @ — не «s:y» (наследование размера секции).
   * Иначе facades_main/facades_top с s:y остаются на всю высоту cabinet_root → петли и метки на ~1950 мм.
   */
  _facadeModuleHasAuthoredLayoutExprs(item) {
    const exprLike = (v) => {
      if (v === undefined || v === null) return false;
      const s = String(v).trim();
      if (!s) return false;
      return /\bv:/.test(s) || s.includes('@');
    };
    return exprLike(item?.pos?.y) || exprLike(item?.size?.y) || exprLike(item?.pos?.z) || exprLike(item?.size?.z);
  }

  _applyRoomFacadeModuleShellLayout(item, parentSection, layoutRole) {
    const facadeRoles = new Set(['facades', 'facades_main', 'facades_top']);
    const lr = this._normalizeLayoutRoleKey(layoutRole);
    if (!facadeRoles.has(lr)) return null;
    if ((this._catalogModuleBuildDepth || 0) > 0) return null;

    const manualLayout =
      !!(item && item.spec && (item.spec.manual_layout === true || item.spec.keep_manual_layout === true || item.spec.layoutZonesLock === true)) ||
      !!(item && (item.manual_layout === true || item.keep_manual_layout === true));
    if (manualLayout) return null;

    // Шкаф в clodisJSON уже задаёт pos/size формулами (v:h_bottom, corpus_antresol_mm, …) —
    // не перетираем зонной математикой (иначе facades_top уезжает в полку h_top).
    if (this._facadeModuleHasAuthoredLayoutExprs(item)) return null;

    if (!parentSection || !parentSection.size) return null;

    let size = this.evaluateSize(item.size || {}, parentSection);
    let pos = this.evaluatePosition(item.pos || {}, parentSection, size);
    let pivot = this.evaluatePivot(item.pivot || {}, size);

    const z =
      this.layoutZones && this.layoutZones.zones ? this.layoutZones.zones : null;
    const pf = this._roleFlagsFromPlanChildren(parentSection.sourceItem);
    const fr = this._planFacadeRolesFromChildren(parentSection.sourceItem);

    if (z) {
      const px = Number(parentSection.size.x);
      if (Number.isFinite(px) && px > 0) size.x = px;

      const plinthMm = Number(z.plinthMm);
      const carcassMm = Number(z.carcassMm);
      const hTopBand = Number(z.hTopMm);
      const antMm = Math.max(0, Number(z.carcassAntresolMm) || 0);
      const mainMm = Math.max(0, Number(z.carcassMainMm) || 0);
      const fp = Number.isFinite(plinthMm) && plinthMm >= 0 ? plinthMm : 0;
      const yPlinth = fp;
      const yCorpus = yPlinth + (Number.isFinite(carcassMm) && carcassMm >= 0 ? carcassMm : 0);

      if (lr === 'facades') {
        const fc = Number.isFinite(carcassMm) && carcassMm > 0 ? carcassMm : 0;
        if (fr.hasSplitFacadeModules && pf.hasCorpusMain && mainMm > 0) {
          size.y = fp + mainMm;
        } else if (fp + fc > 0) {
          size.y = fp + fc;
        }
        pos.y = 0;
      } else if (lr === 'facades_main') {
        let bodyBand = 0;
        if (pf.hasCorpusMain && mainMm > 0) bodyBand = mainMm;
        else if (pf.hasCorpusAnt && antMm > 0) bodyBand = antMm;
        else if (Number.isFinite(carcassMm) && carcassMm > 0) bodyBand = carcassMm;
        if (bodyBand > 0) size.y = bodyBand;
        pos.y = yPlinth;
      } else if (lr === 'facades_top') {
        const topShelfNotCorpusBand = fr.splitMainAndTop;
        if (topShelfNotCorpusBand) {
          if (Number.isFinite(hTopBand) && hTopBand > 0) {
            size.y = hTopBand;
            pos.y = yCorpus;
          } else if (pf.hasTop && carcassMm > 0) {
            const innerMid =
              Math.max(0, carcassMm) +
              (Number.isFinite(hTopBand) && hTopBand > 0 ? hTopBand : 0);
            const mainH = pf.hasCorpusMain ? mainMm : 0;
            const derived = Math.max(0, innerMid - mainH - antMm);
            if (derived > 0) size.y = derived;
            pos.y = yPlinth + mainH + antMm;
          } else {
            const derived = this._facadesTopShelfHeightMm(parentSection);
            if (derived > 0) {
              size.y = derived;
              pos.y = yPlinth + (pf.hasCorpusMain && mainMm > 0 ? mainMm : 0) + antMm;
            }
          }
        } else if (pf.hasCorpusAnt && antMm > 0) {
          size.y = antMm;
          pos.y = yPlinth + (pf.hasCorpusMain && mainMm > 0 ? mainMm : 0);
        } else if (Number.isFinite(hTopBand) && hTopBand > 0) {
          size.y = hTopBand;
          pos.y = yCorpus;
        } else if (pf.hasTop && carcassMm > 0) {
          const innerMid =
            Math.max(0, carcassMm) +
            (Number.isFinite(hTopBand) && hTopBand > 0 ? hTopBand : 0);
          const mainH = pf.hasCorpusMain ? mainMm : 0;
          const derived = Math.max(0, innerMid - mainH - antMm);
          if (derived > 0) size.y = derived;
          pos.y = yPlinth + mainH + antMm;
        }
      }

      pos.x = 0;
      this._applyFacadeShellDepthToParent(item, parentSection, size, pos);
      pivot = {
        x: -Number(size.x) / 2,
        y: -Number(size.y) / 2,
        z: -Number(size.z) / 2,
      };
      return { size, pos, pivot };
    }

    // Превью / комната без layoutZones: те же полосы, что __catalogRolePrev в buildSection.
    const hb = Math.max(0, Number(this.variables?.h_bottom) || 0);
    const py = Number(parentSection.size.y);
    const techPrev = Math.max(
      0,
      Number(
        this.variables?.tech_zone_mm ??
          this.variables?.h_service ??
          this.variables?.service_zone_mm
      ) || 0
    );
    const hTopVar = Math.max(0, Number(this.variables?.h_top) || 0);
    const antSplit = Math.max(0, Number(this.variables?.corpus_antresol_mm) || 0);
    const fullInner = Number.isFinite(py) && py > 0 ? Math.max(0, py - hb - techPrev) : 0;
    let carcassTotal = 0;
    let antH = 0;
    let mainH = 0;
    let hTopShelf = hTopVar;
    if (fullInner > 0) {
      if (hTopVar > 0) carcassTotal = Math.max(0, fullInner - hTopVar);
      else if (pf.hasTop) carcassTotal = fullInner;
      else carcassTotal = fullInner;
      antH = antSplit > 0 ? Math.min(antSplit, carcassTotal) : 0;
      mainH = pf.hasCorpusMain ? Math.max(0, carcassTotal - antH) : 0;
      if (hTopVar <= 0 && pf.hasTop) {
        hTopShelf = Math.max(0, fullInner - mainH - antH);
      }
    }

    const px = Number(parentSection.size.x);
    if (Number.isFinite(px) && px > 0) size.x = px;

    if (lr === 'facades' && carcassTotal > 0) {
      if (fr.hasSplitFacadeModules && pf.hasCorpusMain && mainH > 0) {
        size.y = hb + mainH;
      } else {
        size.y = hb + mainH + antH;
      }
      pos.y = 0;
    } else if (lr === 'facades_main' && carcassTotal > 0) {
      const band =
        pf.hasCorpusMain && mainH > 0
          ? mainH
          : pf.hasCorpusAnt && antH > 0
            ? antH
            : carcassTotal;
      size.y = band;
      pos.y = hb;
    } else if (lr === 'facades_top' && carcassTotal > 0) {
      if (fr.splitMainAndTop) {
        if (hTopShelf > 0) {
          size.y = hTopShelf;
          pos.y = hb + mainH + antH;
        } else {
          const derived = this._facadesTopShelfHeightMm(parentSection);
          if (derived > 0) {
            size.y = derived;
            pos.y = hb + mainH + antH;
          }
        }
      } else if (pf.hasCorpusAnt && antH > 0) {
        size.y = antH;
        pos.y = hb + (pf.hasCorpusMain && mainH > 0 ? mainH : 0);
      } else if (hTopShelf > 0) {
        size.y = hTopShelf;
        pos.y = hb + mainH + antH;
      }
    } else {
      return null;
    }

    pos.x = 0;
    this._applyFacadeShellDepthToParent(item, parentSection, size, pos);
    pivot = {
      x: -Number(size.x) / 2,
      y: -Number(size.y) / 2,
      z: -Number(size.z) / 2,
    };
    return { size, pos, pivot };
  }

  _exprDbgEnabled() {
    return !!(typeof window !== 'undefined' && window.__CLD_DEBUG_EXPR);
  }

  _exprDbg(...args) {
    if (!this._exprDbgEnabled()) return;
    try {
      console.log(...args);
    } catch (_) {}
  }

  _getEventHandlerByName(eventName) {
    if (!eventName || typeof eventName !== 'string') return null;
    try {
      const w = (typeof window !== 'undefined') ? window : null;
      if (!w) return null;
      const fromParts = w.pp?.events?.parts?.[eventName];
      if (typeof fromParts === 'function') return fromParts;
      const fromCabinet = w.pp?.events?.cabinet?.[eventName];
      if (typeof fromCabinet === 'function') return fromCabinet;
      const fromCabinetEvents = w.cabinet_events?.[eventName];
      if (typeof fromCabinetEvents === 'function') return fromCabinetEvents;
      const fromGlobal = w[eventName];
      if (typeof fromGlobal === 'function') return fromGlobal;
    } catch (_) {}
    return null;
  }

  _invokeItemEvent(item, eventKey, payload = {}) {
    const eventName = item?.events?.[eventKey];
    if (!eventName || typeof eventName !== 'string') return;
    const fn = this._getEventHandlerByName(eventName);
    if (typeof fn !== 'function') return;
    try {
      fn({
        ...payload,
        eventKey,
        eventName,
        item,
        builder: this,
      });
    } catch (err) {
      console.warn(`[CLD][events] "${eventKey}" failed for "${item?.name || item?.type || 'item'}":`, err);
    }
  }

  // Build furniture from Clodis JSON structure (референс: Clodis формат)
  buildFromJSON(jsonData, params = {}) {
    this._dbg('🚀🚀🚀 ClodisBuilder.buildFromJSON НАЧАЛО 🚀🚀🚀');
    this._dbg('📦 JSON данные:', {
      type: jsonData?.type,
      name: jsonData?.name,
      hasChildren: !!jsonData?.children,
      childrenCount: jsonData?.children?.length || 0,
      children: jsonData?.children?.map(c => ({ type: c.type, name: c.name })) || []
    });
    this._dbg('📦 Параметры:', params);
    
    // Initialize variables and groups
    this.variables = params.variables || {};
    this.groups = params.groups || {
      g0: { thickness: 16 }, // Default thickness 16mm
    };
    this.decorOutside = params.decorOutside || null;
    this.decorInside = params.decorInside || null;
    // Вертикальные зоны ниши (комната): см. computePlacementVerticalZones + layout_role подсекций
    this.layoutZones = params.layoutZones || null;
    this.doorLayout = params.doorLayout || null;
    this.zoneHand = params.zoneHand || null;
    this.unifiedFacade = !!params.unifiedFacade;
    this.placementKind = params.placementKind || null;
    this.productKind = params.productKind || null;
    this._kitchenSupports = params.kitchenSupports || null;
    if (this._isKitchenBaseBuildContext()) {
      try {
        this._normalizeKitchenTemplateTree(jsonData);
      } catch (_) {}
    }
    this.hingeLayoutOverride =
      params.hingeLayoutOverride != null ? params.hingeLayoutOverride : null;
    this._suppressHingeRoomLog = !!params.isFurnitureGhost;
    if (typeof ClodisBuilder.resetHingeRoomBuildLog === 'function') {
      ClodisBuilder.resetHingeRoomBuildLog();
    }
    this._facadeHingeContext = {
      layoutRole: '',
      catalogHingeLayoutId: null,
      catalogHingeModulesApplied: false,
      catalogHingeModulesInTree: false,
    };
    this._catalogModuleBuildDepth = 0;
    this._shellFillPolicyCatalogItem = params.shellFillPolicyCatalogItem || null;
    this._fillPolicyCatalogItem = params.fillPolicyCatalogItem || null;
    this._isFurnitureGhost = !!params.isFurnitureGhost;
    this._shelfPropsConfig = null;
    this._shelfPropShelfIndex = 0;
    this._shelfPropPending = [];
    this._shelfPropMixKey = [
      String(this._fillPolicyCatalogItem?.id || this._shellFillPolicyCatalogItem?.id || ''),
      String(Math.round(Number(this.variables?.x) || 0)),
      String(Math.round(Number(this.variables?.y) || 0)),
    ].join(':');
    if (!this._isFurnitureGhost) {
      try {
        const shelfApi = typeof globalThis !== 'undefined' ? globalThis.__cldShelfProps : null;
        const lifestyleOn =
          typeof globalThis !== 'undefined' &&
          typeof globalThis.__cldRoomShelfLifestyleEnabled === 'function' &&
          globalThis.__cldRoomShelfLifestyleEnabled();
        if (shelfApi) {
          if (params.shelfProps != null && typeof shelfApi.parseShelfPropsConfig === 'function') {
            this._shelfPropsConfig = shelfApi.parseShelfPropsConfig(params.shelfProps);
          } else if (typeof shelfApi.extractShelfPropsFromCatalogItem === 'function') {
            const fillSrc = this._fillPolicyCatalogItem || this._shellFillPolicyCatalogItem;
            this._shelfPropsConfig = fillSrc
              ? shelfApi.extractShelfPropsFromCatalogItem(fillSrc)
              : null;
          }
          // Lifestyle: всегда полный пул (каталог shelfProps не режет).
          if (lifestyleOn) {
            this._shelfPropsConfig = {
              enabled: 1,
              slots: [{ model_id: '29', label: '', x_mm: 0, y_mm: 0, z_mm: 0, rot_y: 0 }],
            };
            this._shelfPropsNeedLibMap = true;
          }
        }
      } catch (_) {
        this._shelfPropsConfig = null;
      }
    }
    // Не сбрасываем весь реестр: в комнате несколько модулей, у каждого свои __door_swing.
    // Полный сброс — только params.clearDoorSwingRegistry (превью админки).
    if (params && params.clearDoorSwingRegistry === true) {
      ClodisBuilder.clearDoorSwingRegistry();
    }
    if (this.layoutZones && this.layoutZones.zones) {
      const z = this.layoutZones.zones;
      const pm = Number(z.plinthMm);
      if (Number.isFinite(pm) && pm >= 0) {
        this.variables = { ...this.variables, h_bottom: pm };
      }
      const ht = Number(z.hTopMm);
      if (Number.isFinite(ht) && ht >= 0) {
        // Совпадает с фактической высотой зоны top (антресоль); нужно для v:h_top в выражениях.
        this.variables = { ...this.variables, h_top: ht };
      }
      const sv = Number(z.serviceMm);
      if (Number.isFinite(sv) && sv >= 0) {
        this.variables = { ...this.variables, tech_zone_mm: sv };
      }
      const cmain = Number(z.carcassMainMm);
      if (Number.isFinite(cmain) && cmain >= 0) {
        this.variables = { ...this.variables, carcass_main_mm: cmain };
      }
      const cant = Number(z.carcassAntresolMm);
      if (Number.isFinite(cant) && cant >= 0) {
        this.variables = { ...this.variables, carcass_antresol_mm: cant };
      }
    }

    // Clodis/конструктор: $wall.thickness → v:_wt (см. constructor-clodis.normalizeExpressionSyntax).
    // В комнате без этого evaluateExpression не знает "$wall.*" → толщина 0 → размеры z=0 и «разлёт».
    {
      const g0t = Number(this.groups?.g0?.thickness);
      const fromParams = Number(params.wallThicknessMm);
      const prevWt = Number(this.variables._wt);
      const wt =
        Number.isFinite(prevWt) && prevWt > 0
          ? prevWt
          : Number.isFinite(fromParams) && fromParams > 0
            ? fromParams
            : Number.isFinite(g0t) && g0t > 0
              ? g0t
              : 16;
      const bwo = Number(this.variables._bwo);
      const tfo = Number(this.variables._tfo);
      this.variables = {
        ...this.variables,
        _wt: wt,
        _bwo: Number.isFinite(bwo) ? bwo : 0,
        _tfo: Number.isFinite(tfo) ? tfo : 0,
      };
    }

    // Если в дереве уже есть authored присадка/отверстия чашки (furniture id=3 или hole),
    // не добавляем runtime cup holes из accessories, чтобы не дублировать (как в рефе).
    try {
      this._hasAuthoredCupDrilling = this._treeHasCupDrillingAny(jsonData);
    } catch (_) {
      this._hasAuthoredCupDrilling = false;
    }

    // Get root section size from params (these become s:x, s:y, s:z)
    // sectionSize should be in MILLIMETERS (Clodis units, референс: Clodis)
    const sectionSize = params.sectionSize || {
      x: 600, // Default width 600mm
      y: 2400, // Default height 2400mm
      z: 600, // Default depth 600mm
    };

    // Если JSON пришёл из конструктора с numeric pos/size, а секция в комнате другого размера,
    // применяем дельта-пересчёт как в редакторе (без масштабирования всей группы).
    try {
      const rootArr =
        (Array.isArray(jsonData) ? jsonData : (jsonData?.type === 'module' && Array.isArray(jsonData.children) ? jsonData.children : null));
      const first = Array.isArray(rootArr) ? rootArr[0] : null;
      // Один корень { type: "section", __cldAuthorSizeMm } — не массив; иначе room-reanchor не срабатывает
      const authorHost =
        first ||
        (!Array.isArray(jsonData) && jsonData && typeof jsonData === 'object' ? jsonData : null);
      const author =
        authorHost && typeof authorHost === 'object' ? authorHost.__cldAuthorSizeMm : null;
      const target = sectionSize;
      const hasAuthor = author && Number(author.x) > 0 && Number(author.y) > 0 && Number(author.z) > 0;
      const hasTarget = target && Number(target.x) > 0 && Number(target.y) > 0 && Number(target.z) > 0;
      if (hasAuthor && hasTarget) {
        const dX = Number(target.x) - Number(author.x);
        const dY = Number(target.y) - Number(author.y);
        const dZ = Number(target.z) - Number(author.z);
        const need = dX !== 0 || dY !== 0 || dZ !== 0;
        if (!need) {
          this._dbg('[CLD][room-reanchor] skip (no delta needed)', { author, target });
        }
        if (need) {
          const stats = {
            itemsVisited: 0,
            posAdjustedX: 0,
            posAdjustedY: 0,
            posAdjustedZ: 0,
            sizeAdjustedX: 0,
            sizeAdjustedY: 0,
            sizeAdjustedZ: 0,
          };
          const isNumericString = (s) => typeof s === 'string' && /^\s*-?\d+(?:\.\d+)?\s*$/.test(s);
          const adjustAxis = (val, anchorVal, delta, mode) => {
            const isNum = typeof val === 'number' && Number.isFinite(val);
            const isNumStr = isNumericString(val);
            if (!isNum && !isNumStr) return val;
            const origWasString = typeof val === 'string';
            const n = isNum ? val : parseFloat(String(val).trim());
            if (!Number.isFinite(n)) return val;
            const a = Number(anchorVal);
            let out = n;
            if (mode === 'pos') {
              if (a === 1) out = n + delta;
              else if (a === 0) out = n + delta / 2;
            } else if (mode === 'size') {
              out = n + delta;
            }
            if (!origWasString) return out;
            const rounded = Math.abs(out - Math.round(out)) < 1e-9 ? String(Math.round(out)) : String(out);
            return rounded;
          };
          // walk принимает effectiveDY — дельта высоты, применяемая к детям текущего узла.
          // Обычно: plinth/top — фикс; corpus — вся дельта inner (рост ниши).
          // corpus_body_mm (legacy): корпус+фасад фикс, дельта — в top. corpus_antresol_mm: верхний корпус фикс, дельта — в corpus+facades.
          const _rawCf =
            this.variables?.corpus_body_mm ??
            this.variables?.corpus_fixed_mm ??
            this.variables?.h_corpus_body;
          const corpusBodyFixed = Math.max(0, Number(_rawCf) || 0) > 0;
          const antSplitDy = Math.max(0, Number(this.variables?.corpus_antresol_mm) || 0) > 0;
          const walk = (it, effectiveDY = dY) => {
            if (!it || typeof it !== 'object') return;
            stats.itemsVisited++;
            // children recursion: при входе в role-секцию меняем effectiveDY
            if (Array.isArray(it.children)) {
              const lr = it.layout_role || it.sectionLayoutRole || '';
              let childDY = effectiveDY;
              if (lr === 'plinth' || lr === 'service' || lr === 'corpus_antresol') {
                childDY = 0;
              } else if (lr === 'top') {
                childDY = corpusBodyFixed && !antSplitDy ? effectiveDY : 0;
              } else if (
                antSplitDy &&
                (lr === 'corpus' || lr === 'facades' || lr === 'facades_main')
              ) {
                childDY = effectiveDY;
              } else if (
                !antSplitDy &&
                corpusBodyFixed &&
                (lr === 'corpus' || lr === 'facades' || lr === 'facades_main')
              ) {
                childDY = 0;
              }
              it.children.forEach(child => walk(child, childDY));
            }

            const spec = it.spec || {};
            const orient = String(spec.orientation || '').trim(); // 'v' | 'h' | 'f'
            const type = String(it.type || '').trim(); // section|wall|facade|module|furniture
            const dt = String(spec.detailTypeId || spec.detail_type_id || '').trim();
            const originalType = String(it.originalType || '').trim();

            // normalize field names
            const pos = it.pos || it.position;
            const pivot = it.pivot || it.anchor;
            const size = it.size;
            // Используем effectiveDY для Y-корректировки этого конкретного узла
            const localDY = effectiveDY;

            if (pos && pivot) {
              const beforeX = pos.x;
              const beforeY = pos.y;
              const beforeZ = pos.z;
              pos.x = adjustAxis(pos.x, pivot.x, dX, 'pos');
              pos.y = adjustAxis(pos.y, pivot.y, localDY, 'pos');
              pos.z = adjustAxis(pos.z, pivot.z, dZ, 'pos');
              if (pos.x !== beforeX) stats.posAdjustedX++;
              if (pos.y !== beforeY) stats.posAdjustedY++;
              if (pos.z !== beforeZ) stats.posAdjustedZ++;
              it.pos = pos;
            }

            // size resize rules: only for numeric sizes (do not touch expressions)
            if (size && typeof size === 'object') {
              const beforeSizeX = size.x;
              const beforeSizeY = size.y;
              const beforeSizeZ = size.z;
              // vertical: resize Y — используем localDY (0 внутри plinth/top, dY внутри corpus)
              if ((orient === 'v' || dt.startsWith('vertical_')) && localDY) {
                size.y = adjustAxis(size.y, 0, localDY, 'size');
              }
              // horizontal: resize X
              if ((orient === 'h' || dt.startsWith('horizontal_')) && dX) {
                size.x = adjustAxis(size.x, 0, dX, 'size');
              }
              // front/back/facade: resize X and Y (Y = localDY)
              const isFrontLike =
                orient === 'f' ||
                dt.startsWith('front_') ||
                dt.startsWith('back_') ||
                type === 'facade' ||
                originalType === 'facade';
              if (isFrontLike && dX) size.x = adjustAxis(size.x, 0, dX, 'size');
              if (isFrontLike && localDY) size.y = adjustAxis(size.y, 0, localDY, 'size');
              it.size = size;
              if (size.x !== beforeSizeX) stats.sizeAdjustedX++;
              if (size.y !== beforeSizeY) stats.sizeAdjustedY++;
              if (size.z !== beforeSizeZ) stats.sizeAdjustedZ++;
            }
          };
          if (Array.isArray(rootArr)) rootArr.forEach(child => walk(child, dY));
          else walk(jsonData, dY);
          this._dbg('[CLD][room-reanchor] applying author->target delta', {
            author,
            target,
            delta: { dX, dY, dZ },
            stats,
          });
        }
      } else {
        this._dbg('[CLD][room-reanchor] skip (no author/target size)', {
          hasAuthor,
          hasTarget,
          author,
          target,
          jsonRootType: Array.isArray(jsonData) ? 'array' : jsonData?.type || typeof jsonData,
        });
      }
    } catch (_) {}

    // Create root section context with actual sizes
    // Clodis stores values in millimeters (референс: Clodis)
    // We use millimeters everywhere (no conversion to meters)
    this._dbg('📐📐📐 СОЗДАНИЕ rootSectionContext:', {
      sectionSizeFromParams: sectionSize,
      sectionSizeType: typeof sectionSize.x,
      sectionSizeValues: { x: sectionSize.x, y: sectionSize.y, z: sectionSize.z }
    });
    
    const rootSectionContext = {
      size: {
        x: sectionSize.x, // Keep in millimeters: 600mm
        y: sectionSize.y, // 2400mm
        z: sectionSize.z, // 600mm
      },
      position: { x: 0, y: 0, z: 0 },
      pivot: { x: 0, y: 0, z: 0 },
      parent: null,
      name: 'root',
    };
    
    this._dbg('📐📐📐 rootSectionContext создан (в мм):', {
      sizeInMm: rootSectionContext.size
    });

    // Сохраняем корневой контекст для выражений s:x, s:y, s:z
    this.rootSectionContext = rootSectionContext;

    // Create root group
    const rootGroup = new THREE.Group();
    this.sectionStack = [];

    // Как __ppHydrateNestedCatalogModulesForPreview в админке: в JSON комнаты у module
    // children: [] и без template_tree — подставляем дерево из каталога (catalog_28/31 + model).
    try {
      if (jsonData && typeof jsonData === 'object') {
        const hydrated = JSON.parse(JSON.stringify(jsonData));
        const stats = this._hydrateCatalogModulesInPlanTree(hydrated);
        if (typeof globalThis.__cldStampDrawerNoHandleFlagsInTree === 'function') {
          try {
            const stampRoots = Array.isArray(hydrated) ? hydrated : [hydrated];
            globalThis.__cldStampDrawerNoHandleFlagsInTree(stampRoots);
          } catch (_) {}
        }
        jsonData = hydrated;
        this._stripFillCatalogSnapshotsFromPlan(jsonData);
        if (stats.hydrated > 0 && this._hingeRoomDbg()) {
          console.warn('[CLD][HINGE-ROOM] hydrate catalog modules', stats);
        }
      }
    } catch (hydrateErr) {
      console.warn('[CLD][HINGE-ROOM] hydrate failed:', hydrateErr);
    }

    // Если корень { type: "module", children: [...] } — обрабатываем children
    let itemsToProcess = jsonData;
    if (jsonData && typeof jsonData === 'object' && !Array.isArray(jsonData) && jsonData.type === 'module' && Array.isArray(jsonData.children)) {
      itemsToProcess = jsonData.children;
      this._dbg('📦 Корень type=module, обрабатываем children:', itemsToProcess.length);
    }

    // Process root level (array of sections)
    if (Array.isArray(itemsToProcess)) {
      itemsToProcess.forEach((item, idx) => {
        if (!item || !item.type) {
          console.warn('⚠️ buildFromJSON: пропуск элемента [' + idx + '] — нет item или type', item);
          return;
        }
        const built = this.buildItem(item, rootSectionContext);
        if (built) {
          rootGroup.add(built);
        }
      });
    } else {
      const built = this.buildItem(itemsToProcess, rootSectionContext);
      if (built) {
        rootGroup.add(built);
      }
    }

    this._flushShelfProps();
    this._dbg('📦 Результат:', {
      rootGroupChildren: rootGroup.children.length,
      children: rootGroup.children.map(c => ({ type: c.type, name: c.name, isMesh: c.isMesh }))
    });

    if (
      !this._suppressHingeRoomLog &&
      typeof ClodisBuilder.flushHingeRoomBuildLog === 'function'
    ) {
      ClodisBuilder.flushHingeRoomBuildLog({ furnitureName: jsonData?.name || jsonData?.type });
    }

    if (!this._suppressHingeRoomLog) {
      this._attachMissingFacadeHandles(rootGroup);
      if (typeof globalThis.__cldAttachDrawerHandlesToRoot === 'function') {
        const drawerAttach = globalThis.__cldAttachDrawerHandlesToRoot(rootGroup, {
          productKind: this.productKind,
          placementKind: this.placementKind,
        });
        if (drawerAttach && typeof drawerAttach.catch === 'function') {
          drawerAttach.catch((err) => {
            console.warn('[CLD][HANDLE][drawer] attach error', err);
          });
        }
        if (typeof globalThis.__cldStripDrawerNoHandleFromRoot === 'function') {
          try {
            globalThis.__cldStripDrawerNoHandleFromRoot(rootGroup, {
              productKind: this.productKind,
              placementKind: this.placementKind,
            });
          } catch (_) {}
        }
      }
    }

    this._finalizeDrawerFixedPartsReparent(rootGroup);
    this._finalizeDrawerSlideAssemblies(rootGroup);
    this._finalizeRoomDrawerStackSlideCascade(rootGroup);

    if (!params.isFurnitureGhost) {
      if (typeof globalThis.__cldApplyJointFittingHoles === 'function') {
        try {
          const n = globalThis.__cldApplyJointFittingHoles(rootGroup);
          if (n > 0) {
            console.log('[CLD][joint-holes] применено отверстий крепежа:', n);
          }
        } catch (jointHoleErr) {
          console.warn('[CLD][joint-holes] apply failed', jointHoleErr);
        }
      }
      // Как админ-iframe: после resize Ш×В×Г крепёж на живой стык, не baked pos из JSON.
      if (typeof globalThis.__cldRepositionJointSchemeFurniture === 'function') {
        try {
          globalThis.__cldRepositionJointSchemeFurniture(rootGroup);
        } catch (jointFurnErr) {
          console.warn('[CLD][joint-furniture] reposition failed', jointFurnErr);
        }
      }
      // Контуры: после reposition + async GLB stamp — перекрасить aluminium.
      try {
        if (typeof globalThis.__cldRefreshRoomFurnitureXray === 'function') {
          globalThis.__cldRefreshRoomFurnitureXray();
        } else if (typeof window !== 'undefined' && typeof window.__cldRefreshRoomFurnitureXray === 'function') {
          window.__cldRefreshRoomFurnitureXray();
        }
      } catch (_) {}
    }

    if (
      !this._suppressHingeRoomLog &&
      typeof ClodisBuilder.syncDoorToggleButtonFromScene === 'function'
    ) {
      ClodisBuilder.syncDoorToggleButtonFromScene();
    }

    return rootGroup;
  }

  _facadeHasHandleAttached(facadeGroup) {
    if (!facadeGroup) return false;
    const findHandle = (parent) => {
      if (!parent?.children?.length) return null;
      for (const ch of parent.children) {
        if (ch && String(ch.name || '').startsWith('__cld_facade_handle')) return ch;
      }
      return null;
    };
    let hg = findHandle(facadeGroup);
    if (!hg) {
      const swing = facadeGroup.getObjectByName('__door_swing');
      hg = findHandle(swing) || null;
    }
    if (!hg) return false;
    let meshes = 0;
    hg.traverse((o) => {
      if (o?.isMesh) meshes += 1;
    });
    return meshes > 0;
  }

  _attachMissingFacadeHandles(rootGroup, opts = {}) {
    const rt = typeof window !== 'undefined' ? window.__cldHandleRuntime : null;
    const log = rt?.handleLog || ((step, data) => {
      if (typeof window !== 'undefined' && window.DEBUG_HANDLE_ROOM === true) {
        console.log('[CLD][HANDLE] ' + step, data ?? '');
      }
    });
    if (!rootGroup || !rt) return;
    const force = !!opts.force;
    const facades = [];
    rootGroup.traverse((o) => {
      if (o?.userData?.isFacade && o.userData._cldFacadeBuildItem) facades.push(o);
    });
    let attached = 0;
    let missing = 0;
    for (const fg of facades) {
      if (this._isFacadeInsideDrawerAssembly(fg)) {
        this._removeAttachedFacadeHandle(fg);
        continue;
      }
      if (this._isDrawerBandFacadeTreeNode(fg.userData._cldFacadeBuildItem, fg.userData._cldFacadeBuildParent)) continue;
      if (!force && this._facadeHasHandleAttached(fg)) {
        attached += 1;
        continue;
      }
      missing += 1;
      this._finalizeFacadeHandleAfterBuild(
        fg,
        fg.userData._cldFacadeBuildItem,
        fg.userData._cldFacadeBuildParent || {},
        fg.userData.originalSize,
        fg.userData.facadeThicknessMm
      );
    }
    log('buildFromJSON facades', {
      total: facades.length,
      alreadyHadHandle: attached,
      retryAttach: missing,
      force,
      selection: rt.readSelection?.() || null,
    });
  }

  static attachDrawerHandlesInRoot(rootGroup, builderParams = {}) {
    if (typeof globalThis.__cldAttachDrawerHandlesToRoot !== 'function') return;
    globalThis.__cldAttachDrawerHandlesToRoot(rootGroup, {
      productKind: builderParams.productKind || null,
      placementKind: builderParams.placementKind || null,
      force: !!builderParams.force,
      previewMode: !!builderParams.previewMode,
      toSceneUnits: builderParams.toSceneUnits,
    });
  }

  /** Повторное прикрепление ручек без полной пересборки (после загрузки каталога / шаг 6). */
  static attachFacadeHandlesInRoot(rootGroup, builderParams = {}) {
    const b = new ClodisBuilder();
    b.variables = builderParams.variables || {};
    b.groups = builderParams.groups || { g0: { thickness: 16 } };
    b.decorOutside = builderParams.decorOutside || null;
    b.decorInside = builderParams.decorInside || null;
    b.layoutZones = builderParams.layoutZones || null;
    b.placementKind = builderParams.placementKind || null;
    b.productKind = builderParams.productKind || null;
    b.unifiedFacade = !!builderParams.unifiedFacade;
    b._suppressHingeRoomLog = false;
    b._attachMissingFacadeHandles(rootGroup, { force: !!builderParams.force });
  }

  static retryFacadeHandlesInScene() {
    const rt = typeof window !== 'undefined' ? window.__cldHandleRuntime : null;
    const log = rt?.handleLog || ((step, data) => {
      if (typeof window !== 'undefined' && window.DEBUG_HANDLE_ROOM === true) {
        console.log('[CLD][HANDLE] ' + step, data ?? '');
      }
    });
    const scene =
      (typeof window !== 'undefined' && window.__cldAppState?.scene) ||
      (typeof window !== 'undefined' && window.__cldRoomScene) ||
      null;
    if (!scene || typeof scene.traverse !== 'function') {
      log('retry scene skip', { reason: 'no_scene' });
      return 0;
    }
    let count = 0;
    scene.traverse((obj) => {
      if (!obj?.userData?.isFurniture || !obj.isGroup) return;
      const ud = obj.userData || {};
      const readRoots =
        typeof globalThis !== 'undefined' && globalThis.__cldReadUserDataClodisRoots
          ? globalThis.__cldReadUserDataClodisRoots
          : (ud) => ud?.__clodisRootsForBuild;
      const readData =
        typeof globalThis !== 'undefined' && globalThis.__cldReadUserDataClodisData
          ? globalThis.__cldReadUserDataClodisData
          : (ud) => ud?.__clodisDataForBuild;
      const readVars =
        typeof globalThis !== 'undefined' && globalThis.__cldReadUserDataClodisVariables
          ? globalThis.__cldReadUserDataClodisVariables
          : (ud) => ud?.__clodisVariables;
      const hasBuildRoots = readRoots(ud) || readData(ud);
      if (!hasBuildRoots) return;
      count += 1;
      ClodisBuilder.attachFacadeHandlesInRoot(obj, {
        layoutZones: ud.__layoutZones || null,
        placementKind: ud.__placementKind || null,
        productKind: ud.productKind || null,
        unifiedFacade: !!ud.unifiedFacade,
        variables: readVars(ud) || {},
        decorOutside: ud.step5ModuleOutside || null,
        decorInside: ud.step5ModuleInside || null,
        force: true,
      });
      ClodisBuilder.attachDrawerHandlesInRoot(obj, {
        placementKind: ud.__placementKind || null,
        productKind: ud.productKind || null,
        force: true,
      });
    });
    log('retry scene attach', { furnitureGroups: count });
    return count;
  }

  // Нормализация: конструктор Clodis использует position/anchor, Clodis — pos/pivot
  _normalizeItem(item) {
    if (!item) return item;
    const n = { ...item };
    if (!n.pos && n.position) n.pos = n.position;
    if (!n.pivot && n.anchor) n.pivot = n.anchor;
    // Как _normalizeAdminFields / admin iframe: rotation → rot (иначе tree y:180 теряется).
    if (n.rotation && !n.rot) {
      n.rot = n.rotation;
      delete n.rotation;
    }
    // detail = стенка, но комплектующие в конструкторе: detail + originalType model|furniture.
    if (n.type === 'detail') {
      const ot = String(n.originalType || '').toLowerCase();
      if (ot === 'model' || ot === 'furniture') n.type = ot;
      else n.type = 'wall';
    }
    return n;
  }

  _isPreviewOnlyCatalogItem(item) {
    const spec = item?.spec;
    if (!spec || typeof spec !== 'object') return false;
    return (
      spec.preview_only === true ||
      spec.preview_only === 1 ||
      spec.previewOnly === true ||
      spec.previewOnly === 1
    );
  }

  // Build single item (section, wall, facade, module, furniture, hole)
  buildItem(item, parentSection) {
    if (!item || !item.type) {
      console.warn('⚠️ buildItem: нет item или type!', { item, hasType: !!item?.type });
      return null;
    }
    item = this._normalizeItem(item);

    const type = item.type;
    const name = item.name || 'unnamed';
    if (this._isPreviewOnlyCatalogItem(item)) {
      this._dbg(`🏗️ buildItem: skip preview_only "${name}" (type: ${type})`);
      return null;
    }
    const itemLayoutRole = this._normalizeLayoutRoleKey(
      item?.layout_role ?? item?.sectionLayoutRole ?? ''
    );
    if (this.unifiedFacade && itemLayoutRole === 'facades_top') {
      this._dbg(`🏗️ buildItem: skip facades_top (unified facade)`, { name });
      return null;
    }

    this._dbg(`🏗️ buildItem: создание "${name}" (type: ${type})`);

    let result = null;
    switch (type) {
      case 'section':
      case 'fill_section':
        this._dbg(`  → Вызов buildSection для "${name}"`);
        result = this.buildSection(item, parentSection);
        break;
      case 'animator':
        this._dbg(`  → Вызов buildAnimator для "${name}"`);
        result = this.buildAnimator(item, parentSection);
        break;
      case 'wall':
        this._dbg(`  → Вызов buildWall для "${name}"`);
        result = this.buildWall(item, parentSection);
        break;
      case 'facade':
        this._dbg(`  → Вызов buildFacade для "${name}"`);
        result = this.buildFacade(item, parentSection);
        break;
      case 'module':
        this._dbg(`  → Вызов buildModule для "${name}"`);
        result = this.buildModule(item, parentSection);
        break;
      case 'model':
        this._dbg(`  → Вызов buildModel для "${name}"`);
        result = this.buildModel(item, parentSection);
        break;
      case 'furniture':
        this._dbg(`  → Вызов buildFurniture для "${name}"`);
        result = this.buildFurniture(item, parentSection);
        break;
      case 'path':
      case 'groove':
        this._dbg(`  → Вызов buildPath для "${name}"`);
        result = this.buildPath(item, parentSection);
        break;
      case 'hole':
        // В комнате под каталожной петлёй Hole_* не строим: загрязняют bbox/планки
        // (история: «красные планки» вдоль фасада). CFRN берёт шаблон по cfrnDrillTemplateId.
        if (parentSection?.hingeModuleLocalBuild) {
          this._dbg(`  → skip buildHole under hingeModuleLocalBuild "${name}"`);
          result = null;
          break;
        }
        this._dbg(`  → Вызов buildHole для "${name}"`);
        result = this.buildHole(item, parentSection);
        break;
      default:
        console.warn(`❌ Unknown item type: "${type}" для "${name}"`, item);
        return null;
    }

    if (result && item.spec && item.spec.visual_only) {
      result.userData = result.userData || {};
      result.userData.isVisualOnly = true;
      if (typeof result.traverse === 'function') {
        result.traverse(function (child) {
          child.userData = child.userData || {};
          child.userData.isVisualOnly = true;
        });
      }
    }
    if (result && item) {
      result.userData = result.userData || {};
      result.userData.cldBuildItem = item;
    }
    return result;
  }

  // Build animator (container node for animated facade hierarchy)
  buildAnimator(item, parentSection) {
    const group = new THREE.Group();
    const animatorName = item.name || 'animator';
    this._invokeItemEvent(item, 'on_before_params', { parentSection });

    group.name = animatorName;
    group.userData.isAnimator = true;
    group.userData.sectionName = animatorName;
    if (item.id != null && String(item.id).trim() !== '') {
      group.userData.animatorId = String(item.id).trim();
    }
    const specEarly = item.spec || {};
    const propsEarly = specEarly.props && typeof specEarly.props === 'object' ? specEarly.props : {};
    const dirEarly = String(propsEarly.direction || specEarly.direction || '').replace(/^-/, '').toLowerCase();
    if (dirEarly) group.userData.cldDoorDirection = dirEarly;

    const size = this.evaluateSize(item.size || {}, parentSection);
    const isHingeCatalogAnimator =
      String(item.id || '').toLowerCase() === 'hinge_animator';
    const inHingeModuleBuild = !!(parentSection && parentSection.hingeModuleLocalBuild);
    const hingeRoomThinShell =
      isHingeCatalogAnimator &&
      inHingeModuleBuild &&
      (parentSection?.facadeThinShell ||
        this._isThinFacadeShellDepth(Number(parentSection?.facadeShellDepthMm)));
    const shellDepthForExpr =
      hingeRoomThinShell && Number(parentSection?.facadeShellDepthMm) > 0
        ? Number(parentSection.facadeShellDepthMm)
        : size.z;
    // catalog_31: pos.z «s:z + 18/2» — превью; в комнате оболочка 16 мм.
    const posEvalParent =
      inHingeModuleBuild && isHingeCatalogAnimator && parentSection
        ? {
            ...parentSection,
            size: { x: size.x, y: size.y, z: shellDepthForExpr },
          }
        : parentSection;
    const pos = this.evaluatePosition(item.pos || {}, posEvalParent, size);
    const pivot = this.evaluatePivot(item.pivot || {}, size);
    const parentDepthMm = Number(parentSection?.size?.z);
    const thinShell =
      !(isHingeCatalogAnimator || inHingeModuleBuild) &&
      (this._isThinFacadeShellDepth(parentDepthMm) ||
        !!(parentSection && parentSection.facadeThinShell));
    // Реф Locker: плита в оболочке 16 мм — minZ=0. catalog_28 #8: animator pos.z=16 для превью.
    if (thinShell) {
      pos.z = 0;
    }
    // Комната: pos.x/y из JSON аниматора (как превью: «0 - g0/2 + 4»); pos.z=0 в оболочке 16 мм.
    // hingePreviewSwingPosMm — смещение model «К фасаду», не аниматора (см. model.pos.x −5).
    if (hingeRoomThinShell) {
      pos.y = Number(pos.y) || 0;
      pos.z = 0;
    }

    this._dbg(`🎛️ buildAnimator "${animatorName}"`, {
      size,
      pos,
      pivot,
      spec: item.spec || {},
    });

    // Секции и slide-аниматор (ящик): group.position = pos (BLB), без applyTransform (+size/2).
    const fnEarly = String(specEarly.fn || '').toLowerCase().trim();
    const isSlideAnimator = fnEarly === 'slide' && !isHingeCatalogAnimator;
    if (inHingeModuleBuild || thinShell || isSlideAnimator) {
      group.position.set(Number(pos.x) || 0, Number(pos.y) || 0, Number(pos.z) || 0);
      const rot = item.rot || {};
      if (rot.x) group.rotation.x = this.parseRotation(rot.x);
      if (rot.y) group.rotation.y = this.parseRotation(rot.y);
      if (rot.z) group.rotation.z = this.parseRotation(rot.z);
    } else {
      this.applyTransform(group, pos, pivot, item.rot || {});
    }

    // Animator в room сейчас работает как контейнер.
    // Детали/фасады внутри него продолжают собираться штатно.
    if (item.children && Array.isArray(item.children)) {
      item.children.forEach((child) => {
        const animDrill = this._hingeDrillTemplateIdsFromContext(parentSection);
        const childObject = this.buildItem(child, {
          size: size,
          variables: this.variables,
          groups: this.groups,
          parent: group,
          layoutRole: parentSection?.layoutRole || '',
          facadeThicknessOffset: 0,
          rootSection: parentSection?.rootSection,
          hingeModuleLocalBuild: !!(parentSection && parentSection.hingeModuleLocalBuild),
          slideAnimatorLocalBuild:
            isSlideAnimator || !!(parentSection && parentSection.slideAnimatorLocalBuild),
          hingeFacadeDrillTemplateId: animDrill.facade || parentSection?.hingeFacadeDrillTemplateId || 0,
          hingeDoorDrillTemplateId: animDrill.door || parentSection?.hingeDoorDrillTemplateId || 0,
          hingeCatalogSourceItem: parentSection?.hingeCatalogSourceItem || null,
          /** Цепочка секций (имя «Петли…»), иначе у фасада/фурнитуры под аниматором теряется контекст. */
          _cldSectionContext: parentSection,
        });
        if (childObject) {
          group.add(childObject);
        }
      });
    }

    this._trySetupAnimatorRotate(group, item, parentSection);
    this._trySetupHingeCatalogAnimatorSwingRoom(group, item, parentSection);
    this._trySetupAnimatorSlide(group, item, size);

    group.userData.originalSize = { x: size.x, y: size.y, z: size.z };

    this._invokeItemEvent(item, 'on_after_build', { parentSection, target: group, size, pos, pivot });
    return group;
  }

  /**
   * Реф part21 animator_state.slide: own_object сдвигается по оси direction на ext_percent.
   * Вложенные slide (catalog_29 внутри catalog_33) не регистрируем — едут с внешним __slide_own.
   * Направляющие (catalog_34) синхронизируем с master в _finalizeDrawerSlideAssemblies.
   */
  _isNestedUnderSlideOwn(group) {
    let p = group?.parent;
    while (p) {
      if (p.name === '__slide_own') return true;
      p = p.parent;
    }
    return false;
  }

  /** catalog_29 id=4 внутри catalog_33: slide только у внешнего аниматора (реф part21). */
  _isInnerDrawerBoxSlideAnimator(animatorGroup) {
    let p = animatorGroup?.parent;
    while (p) {
      const item = p.userData?.cldBuildItem;
      if (item && typeof item === 'object') {
        const et = String(item.spec?.element_type || '').toLowerCase();
        const id = String(item.spec?.id ?? '').trim();
        if (et === 'catalog_29' && id === '4') return true;
        const nm = String(item.name || p.name || '').toLowerCase();
        if (/выдвижн.*внутрен|ящик.*внутренн/i.test(nm)) return true;
      }
      p = p.parent;
    }
    return false;
  }

  _isDrawerMountPlatesBuildNode(obj) {
    if (!obj || typeof obj !== 'object') return false;
    const item = obj.userData?.cldBuildItem;
    const name = String(item?.name || obj.name || '').toLowerCase();
    const et = String(item?.spec?.element_type || '').toLowerCase();
    const id = String(item?.spec?.id ?? '').trim();
    if (et === 'catalog_29' && id === '3') return true;
    if (/планк.*креп|креп[её]жн.*планк/i.test(name)) return true;
    if (/^module_.*планк.*креп|^module_.*креп[её]ж/i.test(name)) return true;
    return false;
  }

  _animatorChildIsFixedToCarcase(item, obj) {
    const spec = item?.spec && typeof item.spec === 'object' ? item.spec : {};
    const attach = String(
      spec.swingAttach || spec.swing_role || spec.slideAttach || spec.slide_role || ''
    )
      .toLowerCase()
      .trim();
    if (['fixed', 'cabinet', 'corpus', 'body', 'carcase', 'корпус'].includes(attach)) return true;
    if (
      ['swing', 'door', 'facade', 'фасад', 'drawer', 'ящик', 'run', 'runner', 'basket', 'корзина'].includes(
        attach
      )
    ) {
      return false;
    }
    const name = String(item?.name || obj?.name || spec.key || '').toLowerCase();
    if (/(фасад|двер|door|swing)/i.test(name) && !/(корпус|каркас)/i.test(name)) return false;
    if (/(корпус|каркас|к\s*корпус|на\s*корпус|cabinet|carcase)/i.test(name)) return true;
    if (/(направляющ|направл|guide\s*rail|telescop|runner)/i.test(name)) {
      if (/(ящик|корзин|полк|выдвиж|бегун|middle|средн|внутр|подвиж)/i.test(name)) return false;
      if (/(корпус|каркас|стойк|бок|стенк|mount|монтаж|креп|фикс|к\s*шкаф|к\s*корпус)/i.test(name)) {
        return true;
      }
    }
    const et = String(spec.element_type || '').toLowerCase();
    const cid = String(spec.id ?? '').trim();
    if (et === 'catalog_29' && cid === '3') return true;
    if (/планк.*креп|креп[её]жн.*планк|креп[её]жные/i.test(name)) return true;
    return false;
  }

  /** Секция catalog_33 (inner section карточки ящика), sibling slide-аниматора и планок. */
  _findDrawerCarcaseSectionFromAnimator(animatorGroup) {
    let n = animatorGroup?.parent;
    while (n) {
      if (n.userData?.isSection) {
        let mod = n.parent;
        while (mod) {
          const item = mod.userData?.cldBuildItem;
          const et = String(item?.spec?.element_type || '').toLowerCase();
          if (et === 'catalog_33') return n;
          if (String(mod.name || '').startsWith('Module_')) break;
          mod = mod.parent;
        }
        return n;
      }
      if (String(n.name || '').startsWith('Module_')) {
        for (const ch of n.children || []) {
          if (ch?.userData?.isSection) return ch;
        }
      }
      n = n.parent;
    }
    return animatorGroup?.parent || null;
  }

  /** Планки catalog_29 id=3 — sibling аниматора на секции ящика (как в JSON / превью). */
  _ensureDrawerMountPlatesOnSection(sectionGroup) {
    if (!sectionGroup?.userData?.isSection) return;
    const mountPlate = (sectionGroup.children || []).find((ch) =>
      this._isDrawerMountPlatesBuildNode(ch)
    );
    if (!mountPlate) return;

    const slideAnim = (sectionGroup.children || []).find(
      (ch) => ch?.userData?.cldSlideAnimator || ch?.getObjectByName?.('__slide_own')
    );
    const own = slideAnim?.getObjectByName?.('__slide_own');

    let needsReparent = false;
    if (mountPlate.parent !== sectionGroup) {
      let p = mountPlate.parent;
      while (p && p !== sectionGroup) {
        if (p === own || p === slideAnim || p?.name === '__slide_own') {
          needsReparent = true;
          break;
        }
        p = p.parent;
      }
    }

    if (!needsReparent) return;
    sectionGroup.updateMatrixWorld(true);
    mountPlate.updateMatrixWorld(true);
    try {
      sectionGroup.attach(mountPlate);
    } catch (_) {}
  }

  _ensureDrawerMountPlatesOnAllSections(rootGroup) {
    if (!rootGroup) return;
    rootGroup.traverse((o) => {
      if (o?.userData?.isSection) this._ensureDrawerMountPlatesOnSection(o);
    });
  }

  /**
   * Реф / constructor-clodis __cldReparentSlideFixedPartsToCarcase:
   * части «на корпус» не должны ехать в __slide_own (планки ящика, рельса к стойке).
   */
  _reparentSlideFixedPartsToCarcase(animatorGroup) {
    const own = animatorGroup?.getObjectByName?.('__slide_own');
    if (!own) return;
    const corpusParent =
      (animatorGroup.parent?.userData?.isSection ? animatorGroup.parent : null) ||
      this._findDrawerCarcaseSectionFromAnimator(animatorGroup);
    if (!corpusParent || corpusParent === own.parent) return;

    const toReparent = [];
    const consider = (o) => {
      if (!o || o === own) return;
      const itemMeta = o.userData?.cldBuildItem;
      const moduleLike =
        String(o.name || '').startsWith('Module_') ||
        String(itemMeta?.type || '').toLowerCase() === 'module';
      if (!moduleLike && !itemMeta) return;
      if (!this._animatorChildIsFixedToCarcase(itemMeta, o) && !this._isDrawerMountPlatesBuildNode(o)) return;
      let p = o.parent;
      let underOwn = false;
      while (p) {
        if (p === own) {
          underOwn = true;
          break;
        }
        p = p.parent;
      }
      if (!underOwn) return;
      if (toReparent.includes(o)) return;
      toReparent.push(o);
    };

    for (const ch of [...own.children]) consider(ch);
    own.traverse((o) => consider(o));

    if (!toReparent.length) return;
    own.updateMatrixWorld(true);
    corpusParent.updateMatrixWorld(true);

    for (const o of toReparent) {
      if (o.parent === corpusParent) continue;
      o.updateMatrixWorld(true);
      try {
        corpusParent.attach(o);
      } catch (_) {}
    }
  }

  /** Пост-сборка: fixed-части slide снять с __slide_own на секцию (как превью). */
  _finalizeDrawerFixedPartsReparent(rootGroup) {
    if (!rootGroup) return;
    this._ensureDrawerMountPlatesOnAllSections(rootGroup);
    rootGroup.traverse((o) => {
      if (o?.userData?.cldSlideAnimator) {
        this._reparentSlideFixedPartsToCarcase(o);
      }
    });
    this._ensureDrawerMountPlatesOnAllSections(rootGroup);
  }

  _trySetupAnimatorSlide(animatorGroup, animatorItem, sizeMm) {
    if (!animatorGroup || !animatorItem) return;
    const spec = animatorItem.spec || {};
    const fn = String(spec.fn || '').toLowerCase().trim();
    if (fn !== 'slide') return;
    if (animatorGroup.getObjectByName('__slide_own')) return;
    if (this._isNestedUnderSlideOwn(animatorGroup)) return;
    if (this._isInnerDrawerBoxSlideAnimator(animatorGroup)) return;
    if (!animatorGroup.children.length) return;

    const props = spec.props && typeof spec.props === 'object' ? spec.props : {};
    const extRaw = props.ext_percent ?? props.extPercent;
    let extPct = Number(extRaw);
    if (!Number.isFinite(extPct) || extPct <= 0) extPct = 70;
    extPct = Math.min(Math.max(extPct, 1), 100);

    const dirStr = String(props.direction || 'f').toLowerCase().trim();
    const dir = dirStr.charAt(0) || 'f';
    const axisByDir = { l: 'x', r: 'x', f: 'z', t: 'y', b: 'y' };
    const signByDir = { l: -1, r: 1, f: 1, t: 1, b: -1 };
    const axis = axisByDir[dir] || 'z';
    const sign = signByDir[dir] ?? 1;

    const sz = sizeMm || animatorGroup.userData.originalSize || {};
    const sizeAxis =
      axis === 'x' ? Number(sz.x) || 0 : axis === 'y' ? Number(sz.y) || 0 : Number(sz.z) || 0;
    const travelMm = Math.abs(sizeAxis) * (extPct / 100);
    if (travelMm < 0.01) return;

    const own = new THREE.Group();
    own.name = '__slide_own';
    const sliding = [];
    const fixed = [];
    for (const child of [...animatorGroup.children]) {
      const itemMeta = child.userData?.cldBuildItem;
      if (this._animatorChildIsFixedToCarcase(itemMeta, child) || this._isDrawerMountPlatesBuildNode(child)) {
        fixed.push(child);
      } else sliding.push(child);
    }
    for (const ch of sliding) own.add(ch);
    animatorGroup.add(own);
    for (const ch of fixed) animatorGroup.add(ch);

    const base = { x: own.position.x, y: own.position.y, z: own.position.z };
    const slideState = {
      axis,
      sign,
      base,
      travelMm,
      baseTravelMm: travelMm,
      extPercent: extPct,
      isOpen: false,
      currentOffsetMm: 0,
      targetOffsetMm: 0,
      syncBulkOpen: true,
      slideMaster: null,
    };
    own.userData.cldSlide = slideState;
    animatorGroup.userData.cldSlideAnimator = true;

    const isOpenInit = Number(spec.is_open) === 1 || spec.is_open === true;
    if (isOpenInit) {
      slideState.isOpen = true;
      slideState.targetOffsetMm = travelMm;
      slideState.currentOffsetMm = travelMm;
      if (axis === 'x') own.position.x = base.x + travelMm * sign;
      else if (axis === 'y') own.position.y = base.y + travelMm * sign;
      else own.position.z = base.z + travelMm * sign;
    }

    own.traverse((o) => {
      if (o.isMesh) o.userData.cldDrawerPick = true;
    });

    ClodisBuilder._registerSlideGroup(own);
    this._reparentSlideFixedPartsToCarcase(animatorGroup);
  }

  _drawerSlideAssemblyKey(own) {
    let n = own.parent;
    while (n) {
      if (String(n.name || '').startsWith('Module_')) {
        const lr = this._normalizeLayoutRoleKey(n.userData?.layoutRole || '');
        const et = String(n.userData?.cldBuildItem?.spec?.element_type || '').toLowerCase();
        if (lr === 'drawer' || et === 'catalog_33') return n.uuid;
      }
      n = n.parent;
    }
    return own.parent?.uuid || own.uuid;
  }

  _finalizeDrawerSlideAssemblies(rootGroup) {
    const slides = (ClodisBuilder._slideGroups || []).filter((g) => g?.parent && g.userData?.cldSlide);
    if (slides.length < 2) return;
    const assemblies = new Map();
    for (const own of slides) {
      const key = this._drawerSlideAssemblyKey(own);
      if (!assemblies.has(key)) assemblies.set(key, []);
      assemblies.get(key).push(own);
    }
    for (const group of assemblies.values()) {
      if (group.length < 2) continue;
      group.sort(
        (a, b) =>
          (Number(a.userData.cldSlide?.extPercent) || 999) -
          (Number(b.userData.cldSlide?.extPercent) || 999)
      );
      const master = group[0];
      const mSl = master.userData.cldSlide;
      if (!mSl) continue;
      for (let i = 1; i < group.length; i++) {
        const sl = group[i].userData.cldSlide;
        if (!sl) continue;
        sl.slideMaster = master;
        sl.travelMm = mSl.travelMm;
        sl.baseTravelMm = mSl.baseTravelMm ?? mSl.travelMm;
        sl.syncBulkOpen = false;
      }
    }
  }

  _drawerModuleBottomY(own) {
    let n = own?.parent;
    while (n) {
      if (String(n.name || '').startsWith('Module_')) {
        const lr = this._normalizeLayoutRoleKey(n.userData?.layoutRole || '');
        const et = String(n.userData?.cldBuildItem?.spec?.element_type || '').toLowerCase();
        if (lr === 'drawer' || et === 'catalog_33') {
          const itemPos = n.userData?.cldBuildItem?.pos;
          const py = Number(itemPos?.y);
          if (Number.isFinite(py)) return py;
          return Number(n.position.y) || 0;
        }
      }
      n = n.parent;
    }
    return Number(own?.position?.y) || 0;
  }

  _isSlideOwnUnderRoot(own, rootGroup) {
    if (!own || !rootGroup) return false;
    let p = own;
    while (p) {
      if (p === rootGroup) return true;
      p = p.parent;
    }
    return false;
  }

  /**
   * Комната: ступенчатое выдвижение стека ящиков — нижний на максимум, каждый выше на 1/3 меньше.
   */
  _finalizeRoomDrawerStackSlideCascade(rootGroup) {
    if (this._suppressHingeRoomLog || !rootGroup) return;

    const slides = (ClodisBuilder._slideGroups || []).filter(
      (own) =>
        own?.parent &&
        own.userData?.cldSlide &&
        !own.userData.cldSlide.slideMaster &&
        this._isSlideOwnUnderRoot(own, rootGroup)
    );
    if (slides.length < 2) return;

    const ranked = slides
      .map((own) => ({ own, y: this._drawerModuleBottomY(own) }))
      .sort((a, b) => a.y - b.y || a.own.uuid.localeCompare(b.own.uuid));

    for (let i = 0; i < ranked.length; i++) {
      const own = ranked[i].own;
      const sl = own.userData?.cldSlide;
      if (!sl) continue;
      const baseTravel = Number(sl.baseTravelMm ?? sl.travelMm);
      if (!Number.isFinite(baseTravel) || baseTravel <= 0) continue;
      const factor = Math.max(0, 1 - i * (1 / 3));
      sl.baseTravelMm = baseTravel;
      sl.travelMm = baseTravel * factor;
      sl.cascadeRank = i;
      sl.cascadeFactor = factor;
      if (sl.isOpen || (Number(sl.targetOffsetMm) || 0) > 0) {
        sl.targetOffsetMm = sl.travelMm;
        sl.currentOffsetMm = Math.min(Number(sl.currentOffsetMm) || 0, sl.travelMm);
      }
      ClodisBuilder._applySlideOwnPosition(own, sl);
    }

    for (const own of ClodisBuilder._slideGroups || []) {
      const sl = own?.userData?.cldSlide;
      if (!sl?.slideMaster || !this._isSlideOwnUnderRoot(own, rootGroup)) continue;
      const mSl = sl.slideMaster.userData?.cldSlide;
      if (!mSl) continue;
      sl.travelMm = mSl.travelMm;
      sl.baseTravelMm = mSl.baseTravelMm ?? mSl.travelMm;
      if (sl.isOpen || (Number(sl.targetOffsetMm) || 0) > 0) {
        sl.targetOffsetMm = sl.travelMm;
        sl.currentOffsetMm = Math.min(Number(sl.currentOffsetMm) || 0, sl.travelMm);
      }
      ClodisBuilder._applySlideOwnPosition(own, sl);
    }
  }

  /**
   * Аниматор с spec.fn === "rotate": оборачивает дочерний фасад в __door_swing (как петля без GLB).
   */
  _trySetupAnimatorRotate(animatorGroup, animatorItem, parentSection) {
    if (!animatorGroup || !animatorItem) return;
    // В комнате hinge_animator не получает свой __door_swing — reparent в дверной swing + Z-align.
    if (
      String(animatorItem.id || '').toLowerCase() === 'hinge_animator' &&
      parentSection?.hingeModuleLocalBuild
    ) {
      return;
    }
    const spec = animatorItem.spec || {};
    const fn = String(spec.fn || '').toLowerCase().trim();
    if (fn !== 'rotate') {
      if (fn === 'slide' && String(animatorItem.id || '') === 'hinge_animator') {
        try {
          console.info(
            '[CLD][animator] fn=slide — поворот двери не включён. Для распашной двери поставьте spec.fn: "rotate" и props.deg (например 90).'
          );
        } catch (_) {}
      }
      return;
    }

    const facadeGroup = animatorGroup.children.find((c) => c && c.userData && c.userData.isFacade);
    if (!facadeGroup) return;
    if (facadeGroup.getObjectByName('__door_swing')) return;

    const sz = facadeGroup.userData.originalSize;
    if (!sz || !(Number(sz.x) > 0) || !(Number(sz.y) > 0)) return;

    const props = spec.props && typeof spec.props === 'object' ? spec.props : {};
    const degRaw = Number(props.deg);
    const maxDeg = Number.isFinite(degRaw) && degRaw > 0 ? degRaw : 90;
    const maxAngleRad = THREE.MathUtils.degToRad(maxDeg);

    const w = Number(sz.x);
    const h = Number(sz.y);
    const d = Number(sz.z) || 16;
    const ho = 16;
    const thinDoor = this._isRoomFacadeDoorRotateContext(parentSection);
    const roomOffResolved = thinDoor ? this._resolveRoomDoorPivotOffsetMm(parentSection) : null;
    const roomOff = roomOffResolved
      ? {
          x: Number(roomOffResolved.x) || 0,
          y: Number(roomOffResolved.y) || 0,
          z: Number(roomOffResolved.z) || 0,
        }
      : null;
    const odx = thinDoor && roomOff ? roomOff.x : 0;
    const ody = thinDoor && roomOff ? roomOff.y : 0;
    const odz = thinDoor && roomOff ? roomOff.z : 0;
    if (thinDoor) {
      facadeGroup.userData._cldRoomDoorOffsetSource = roomOffResolved?.__source || 'hinge-role-defaults';
      facadeGroup.userData._cldRoomDoorOffsetRole = roomOffResolved?.__layoutRole || '';
      facadeGroup.userData._cldRoomDoorOffsetMm = { x: odx, y: ody, z: odz };
    }
    const contentOff = this._resolveFacadeContentOffsetMm(facadeGroup);
    const cx = contentOff.x;
    const cy = contentOff.y;
    const cz = contentOff.z;

    const opening = String(props.opening || spec.opening || '').toLowerCase();
    const isTop = opening === 'top' || opening === 'simple_top';
    const isBottom = opening === 'bottom' || opening === 'simple_bottom';

    // Реф. main_core_v2_part21 animator_state.rotate + превью constructor-clodis:
    // ось и знак — из spec.props.direction (ly/ry/…), не из pivot.x фасада.
    const dirRaw = String(
      props.direction || (isTop ? 'lx' : isBottom ? 'rx' : 'ly')
    )
      .toLowerCase()
      .trim();
    const dirNeg = dirRaw.startsWith('-');
    const dirBody = dirNeg ? dirRaw.slice(1) : dirRaw;
    const axisByDir = { rx: 'x', lx: 'x', ry: 'y', ly: 'y', rz: 'z', lz: 'z' };
    const signByDir = { rx: 1, lx: -1, ry: 1, ly: -1, rz: 1, lz: -1 };
    const axis = axisByDir[dirBody] || 'y';
    const dirSign = (signByDir[dirBody] ?? -1) * (dirNeg ? -1 : 1);
    const openScale = isTop || isBottom ? 0.92 : 1;
    let maxAngle = maxAngleRad * dirSign * openScale;
    maxAngle = this._capRoomSideSwingRad(maxAngle, axis, isTop, isBottom);

    let pivotX = 0;
    let pivotY = 0;
    let pivotZ = 0;
    if (axis === 'y') {
      // Ось относительно facadeGroup: учитываем BLB-смещение меша (тонкая оболочка), не только центр группы.
      if (dirBody === 'ly' || dirBody === 'lz') pivotX = cx - w / 2 + ho / 2;
      else if (dirBody === 'ry' || dirBody === 'rz') pivotX = cx + w / 2 - ho / 2;
      // Тонкая оболочка: база на задней кромке (z=0 BLB); Z из «Петли по ролям» сдвигает вперёд, как door_offset в превью.
      pivotZ = thinDoor ? cz - d / 2 : cz - d / 2;
    } else if (axis === 'x') {
      if (isTop || dirBody === 'lx') pivotY = cy + h / 2 - ho / 2;
      else if (isBottom || dirBody === 'rx') pivotY = cy - h / 2 + ho / 2;
    } else if (axis === 'z') {
      const dz = Number(sz.z) || 16;
      if (dirBody === 'lz') pivotZ = cz - dz / 2 + ho / 2;
      else if (dirBody === 'rz') pivotZ = cz + dz / 2 - ho / 2;
    }

    // Комната: pivot + offset из «Петли по ролям» (мм, локально facadeGroup).
    const swingPx = pivotX + odx;
    const swingPy = pivotY + ody;
    const swingPz = pivotZ + odz;

    const swing = new THREE.Group();
    swing.name = '__door_swing';
    const doorDomainId = this._resolveDoorDomainId(animatorItem, parentSection);
    swing.userData.cldDoorSwing = {
      axis,
      maxAngle,
      isOpen: false,
      currentAngle: 0,
      targetAngle: 0,
      doorDomainId,
      isFacadeMaster: true,
      roomSideSwing: this._isRoomSideSwingDoor(axis, isTop, isBottom),
      roomOpenAngleRad: this._isRoomSideSwingDoor(axis, isTop, isBottom) ? maxAngle : undefined,
    };
    swing.userData.cldDoorDirection = dirBody;
    swing.userData.cldDoorPivotXBase = pivotX;
    swing.userData.cldDoorPivotYBase = pivotY;
    swing.userData.cldDoorPivotZBase = pivotZ;
    swing.userData.cldDoorPivotX = swingPx;
    swing.userData._cldRoomDoorOffsetMode = thinDoor ? 'swing-pivot-role' : 'legacy';
    if (facadeGroup.userData._cldRoomDoorOffsetMm) {
      swing.userData._cldRoomDoorOffsetMm = { ...facadeGroup.userData._cldRoomDoorOffsetMm };
    }
    if (facadeGroup.userData._cldRoomDoorOffsetSource) {
      swing.userData._cldRoomDoorOffsetSource = facadeGroup.userData._cldRoomDoorOffsetSource;
    }
    if (facadeGroup.userData._cldRoomDoorOffsetRole) {
      swing.userData._cldRoomDoorOffsetRole = facadeGroup.userData._cldRoomDoorOffsetRole;
    }

    swing.position.set(swingPx, swingPy, swingPz);

    const ch = [...facadeGroup.children];
    const childZBefore = ch.map((c) => c.position.z);
    ch.forEach((c) => {
      facadeGroup.remove(c);
      c.position.x -= swingPx;
      c.position.y -= swingPy;
      c.position.z -= swingPz;
      swing.add(c);
    });
    if (thinDoor && (odx || ody || odz)) {
      try {
        console.info('[CLD][DOOR-OFFSET] swing-pivot', {
          layoutRole: roomOffResolved?.__layoutRole,
          basePivot: { x: pivotX, y: pivotY, z: pivotZ },
          offset: { x: odx, y: ody, z: odz },
          swingPos: { x: swingPx, y: swingPy, z: swingPz },
        });
      } catch (_) {}
    }
    if (this._facadeZDbgEnabled()) {
      this._facadeZLog('doorSwing', {
        animatorId: animatorItem.id,
        thinDoor,
        roomOff: facadeGroup.userData._cldRoomDoorOffsetMm || null,
        shellZ: Number(sz.z) || 16,
        basePivot: { x: pivotX, y: pivotY, z: pivotZ },
        swingPos: { x: swingPx, y: swingPy, z: swingPz },
        childZBefore,
        facadeGroupPosZ: facadeGroup.position.z,
      });
    }
    // Маркер оси вращения: показываем только при явном debug-флаге.
    if (typeof window !== 'undefined' && window.__CLD_DEBUG_DOOR_AXIS_MARKER === true) {
      const axisDot = new THREE.Mesh(
        new THREE.SphereGeometry(10, 16, 12),
        new THREE.MeshBasicMaterial({
          color: 0xc800ff,
          depthTest: false,
          depthWrite: false,
          transparent: true,
          opacity: 0.98,
        })
      );
      axisDot.name = '__cld_door_axis_marker';
      axisDot.renderOrder = 1000;
      swing.add(axisDot);
    }
    facadeGroup.add(swing);

    const sw = swing.userData.cldDoorSwing;
    const hingeAccStub = {
      opening: isTop
        ? 'top'
        : isBottom
          ? 'bottom'
          : dirBody === 'ry' || dirBody === 'rz'
            ? 'right'
            : 'left',
      hingesOffset: ho,
    };
    this._applyInitialDoorSwingFromCrot(swing, sw, hingeAccStub, animatorItem, parentSection);

    const isOpenInit = Number(spec.is_open) === 1 || spec.is_open === true;
    if (
      isOpenInit &&
      Math.abs(sw.currentAngle) < 1e-6 &&
      Math.abs(sw.targetAngle) < 1e-6
    ) {
      sw.isOpen = true;
      sw.targetAngle = maxAngle;
      sw.currentAngle = maxAngle;
      if (this._isRoomSideSwingDoor(axis, isTop, isBottom)) {
        sw.roomOpenAngleRad = maxAngle;
      }
      this._applyDoorSwingPoseFromState(swing);
    } else {
      this._applyRoomSwingDoorDefaultOpenIfNeeded(swing, sw, spec, axis, isTop, isBottom);
    }

    swing.traverse((o) => {
      if (!o.isMesh) return;
      if (o.userData?.isHole) return;
      const acc = o.userData?.isAccessory;
      const nm = String(o.name || '');
      const hingeLike = nm.includes('hinge') || nm.includes('furni_hinge');
      if (acc && !hingeLike) return;
      o.userData.cldDoorPick = true;
    });

    if (typeof ClodisBuilder._registerDoorSwingGroup === 'function') {
      ClodisBuilder._registerDoorSwingGroup(swing);
    }

    this._logFacadePanelPlacement('doorSwing', facadeGroup);
  }

  /**
   * catalog_31 в комнате: hinge_animator с model (без facade-child) — cldDoorSwing на группе,
   * как constructor-clodis _setupAnimatorSwingIfNeeded. После reparent в __door_swing ось гасится.
   */
  _trySetupHingeCatalogAnimatorSwingRoom(animatorGroup, animatorItem, parentSection) {
    if (!animatorGroup || !animatorItem || this._suppressHingeRoomLog) return;
    if (String(animatorItem.id || '').toLowerCase() !== 'hinge_animator') return;
    // catalog_31 в комнате: своя ось 90° на колонке оболочки ломает reparent — только дверной __door_swing.
    if (parentSection?.hingeModuleLocalBuild && this._useCatalogHingeModulesInRoom()) return;
    const spec = animatorItem.spec || {};
    if (String(spec.fn || '').toLowerCase().trim() !== 'rotate') return;
    const hasFacadeChild = animatorGroup.children.some(
      (c) => c && c.userData && c.userData.isFacade
    );
    if (hasFacadeChild) return;
    if (animatorGroup.userData?.cldDoorSwing) return;

    const props = spec.props && typeof spec.props === 'object' ? spec.props : {};
    const degRaw = Number(props.deg);
    const degAbs = Number.isFinite(degRaw) && degRaw > 0 ? degRaw : 90;
    const opening = String(props.opening || spec.opening || '').toLowerCase();
    const isTop = opening === 'top' || opening === 'simple_top';
    const isBottom = opening === 'bottom' || opening === 'simple_bottom';
    const dirRaw = String(
      props.direction || (isTop ? 'lx' : isBottom ? 'rx' : 'ly')
    )
      .toLowerCase()
      .trim();
    const dirNeg = dirRaw.startsWith('-');
    const dirBody = dirNeg ? dirRaw.slice(1) : dirRaw;
    const axisByDir = { rx: 'x', lx: 'x', ry: 'y', ly: 'y', rz: 'z', lz: 'z' };
    const signByDir = { rx: 1, lx: -1, ry: 1, ly: -1, rz: 1, lz: -1 };
    const axis = axisByDir[dirBody] || 'y';
    const hingeDirSign = (signByDir[dirBody] ?? -1) * (dirNeg ? -1 : 1);
    const roomHingeDeg = this._isRoomSideSwingGeometry(axis, isTop, isBottom)
      ? ClodisBuilder.ROOM_SWING_DOOR_OPEN_DEG
      : degAbs;
    const hingeMaxAngle =
      (Number(animatorGroup.rotation[axis]) || 0) +
      THREE.MathUtils.degToRad(roomHingeDeg) * hingeDirSign;

    animatorGroup.userData.cldDoorSwing = {
      axis,
      maxAngle: hingeMaxAngle,
      isOpen: false,
      currentAngle: 0,
      targetAngle: 0,
      syncBulkOpen: false,
      isHingeCatalogSwing: true,
    };
    if (typeof ClodisBuilder._registerDoorSwingGroup === 'function') {
      ClodisBuilder._registerDoorSwingGroup(animatorGroup);
    }
  }

  // Build section (container for other elements)
  buildSection(item, parentSection) {
    const sectionGroup = new THREE.Group();
    const sectionName = item.name || 'section';
    this._invokeItemEvent(item, 'on_before_params', { parentSection });
    
    // Store section info in userData for selection
    sectionGroup.userData.sectionName = sectionName;
    sectionGroup.userData.isSection = true;
    // Роль подсекции из конструктора (layout_role): цоколь / корпус / … — не путать с name
    const rawLayoutRole = item.layout_role ?? item.sectionLayoutRole ?? '';
    const normFn =
      typeof window !== 'undefined' && typeof window.__cldNormalizeSectionLayoutRole === 'function'
        ? window.__cldNormalizeSectionLayoutRole
        : function (v) {
            const s = String(v == null ? '' : v).trim();
            if (!s) return '';
            const allowed = new Set([
              'cabinet_root',
              'plinth',
              'corpus',
              'corpus_antresol',
              'facades',
              'facades_main',
              'facades_top',
              'service',
              'top',
              'wall_hung_body',
              'drawer',
            ]);
            return allowed.has(s) ? s : '';
          };
    sectionGroup.userData.layoutRole = normFn(rawLayoutRole) || '';

    // Calculate section size (references parent section via s:x, s:y, s:z)
    this._dbg(`📐 buildSection "${sectionName}": размеры из JSON:`, item.size);
    this._dbg(`📐 buildSection "${sectionName}": parentSection:`, parentSection ? {
      name: parentSection.name,
      size: parentSection.size
    } : 'null (корневая секция)');
    
    let size = this.evaluateSize(item.size || {}, parentSection);
    this._dbg(`📐 buildSection "${sectionName}": вычисленные размеры (в мм):`, size);

    // Зоны ниши комнаты — только для корневого шкафа. Внутри buildModule дерево строится
    // в moduleSectionContext; если оставить room zones, plinth/corpus/facades получают
    // размеры всей ниши вместо родительского модуля → «разлёт» деталей и ломанный bbox.
    const roomZones =
      this.layoutZones &&
      this.layoutZones.zones &&
      (this._catalogModuleBuildDepth || 0) === 0
        ? this.layoutZones.zones
        : null;

    // Эвристика зажима высоты plinth — применяется ТОЛЬКО когда есть layoutZones
    // (т.е. шкаф ставится в нишу комнаты). Для призрака и каталога (layoutZones = null)
    // оставляем JSON как есть, иначе bbox призрака раздувается.
    const __hasZones = !!roomZones;
    if (__hasZones && sectionGroup.userData.layoutRole === 'plinth' && parentSection && parentSection.size) {
      const parentH = Number(parentSection.size.y);
      const hbRaw = this.variables['h_bottom'];
      const hbVar = Number.isFinite(Number(hbRaw)) ? Math.max(0, Number(hbRaw)) : NaN;
      const targetH = Number.isFinite(hbVar) && hbVar > 0 ? hbVar : 100;
      const ny = Number(size.y);
      if (
        Number.isFinite(parentH) &&
        parentH > 200 &&
        Number.isFinite(ny) &&
        ny >= parentH * 0.88 &&
        ny > targetH + 20
      ) {
        console.warn('[CLD][plinth] Высота подсекции plinth совпадает с родителем — подмена на h_bottom:', {
          section: sectionName,
          wasMm: ny,
          parentHm: parentH,
          h_bottomMm: targetH,
        });
        size.y = targetH;
      }
    }

    // Комната: подогнать размеры подсекций под зоны ниши (цоколь / корпус / верх)
    const lrAfter = sectionGroup.userData.layoutRole;
    const z = roomZones;
    // В нише/комнате "корень шкафа" (cabinet_root) должен совпадать с общей секцией слота.
    // Если cabinet_root вложен и у него применится transform, role-подсекции (plinth/corpus/top)
    // будут разъезжаться по локальной системе координат.
    const isCabinetRootInRoom = !!(z && lrAfter === 'cabinet_root');
    // ⭐ Флаг для «ручного» позиционирования role-секций:
    // если секция/шаблон задаёт pos/size вручную (например «фасад нижний»),
    // то в комнате НЕ перетираем его layoutZones-логикой.
    const manualLayout =
      !!(item && item.spec && (item.spec.manual_layout === true || item.spec.keep_manual_layout === true || item.spec.layoutZonesLock === true)) ||
      !!(item && (item.manual_layout === true || item.keep_manual_layout === true));

    if (z && lrAfter && !manualLayout) {
      // ВАЖНО: для plinth/corpus используем >= 0, а не > 0, чтобы корректно обрабатывать
      // случай plinthMm = 0 (шкаф без цоколя). При > 0 override не срабатывает и plinth
      // сохраняет JSON-высоту, а corpus.pos.y = 0 → секции перекрываются.
      // Для top оставляем > 0 (нулевой top = его нет).
      if (lrAfter === 'plinth' && Number.isFinite(Number(z.plinthMm)) && Number(z.plinthMm) >= 0) {
        size.y = Math.max(0, Number(z.plinthMm));
      } else if (
        lrAfter === 'wall_hung_body' &&
        Number.isFinite(Number(z.bodyMm)) &&
        Number(z.bodyMm) > 0
      ) {
        size.y = Math.max(0, Number(z.bodyMm));
      } else if (lrAfter === 'corpus' && Number.isFinite(Number(z.carcassMm)) && Number(z.carcassMm) > 0) {
        const full = Number(z.carcassMm);
        const mainMm = Number(z.carcassMainMm);
        const pf = parentSection && this._roleFlagsFromPlanChildren(parentSection.sourceItem);
        if (pf && pf.hasCorpusAnt && Number.isFinite(mainMm) && mainMm >= 0) {
          size.y = mainMm > 0 ? mainMm : full;
        } else {
          size.y = full;
        }
      } else if (
        lrAfter === 'corpus_antresol' &&
        Number.isFinite(Number(z.carcassMm)) &&
        Number(z.carcassMm) > 0
      ) {
        const full = Number(z.carcassMm);
        const antMm = Number(z.carcassAntresolMm);
        const pf = parentSection && this._roleFlagsFromPlanChildren(parentSection.sourceItem);
        if (Number.isFinite(antMm) && antMm > 0) {
          size.y = antMm;
        } else if (!pf || !pf.hasCorpusMain) {
          size.y = full;
        }
      } else if (lrAfter === 'facades') {
        const fp = Number.isFinite(Number(z.plinthMm)) ? Math.max(0, Number(z.plinthMm)) : 0;
        const fc =
          Number.isFinite(Number(z.carcassMm)) && Number(z.carcassMm) > 0 ? Number(z.carcassMm) : 0;
        const mainMm = Math.max(0, Number(z.carcassMainMm) || 0);
        const pf = parentSection && this._roleFlagsFromPlanChildren(parentSection.sourceItem);
        const fr = parentSection && this._planFacadeRolesFromChildren(parentSection.sourceItem);
        if (fr && fr.hasSplitFacadeModules && pf && pf.hasCorpusMain && mainMm > 0) {
          size.y = fp + mainMm;
        } else if (fp + fc > 0) {
          size.y = fp + fc;
        }
      } else if (lrAfter === 'facades_main') {
        const pf = parentSection && this._roleFlagsFromPlanChildren(parentSection.sourceItem);
        const carcassMm = Number(z.carcassMm);
        const mainMm = Number(z.carcassMainMm);
        const antMm = Number(z.carcassAntresolMm);
        let bodyBand = 0;
        if (pf && pf.hasCorpusMain && Number.isFinite(mainMm) && mainMm > 0) {
          bodyBand = mainMm;
        } else if (pf && pf.hasCorpusAnt && Number.isFinite(antMm) && antMm > 0) {
          bodyBand = antMm;
        } else if (Number.isFinite(carcassMm) && carcassMm > 0) {
          bodyBand = carcassMm;
        }
        if (bodyBand > 0) size.y = bodyBand;
      } else if (lrAfter === 'facades_top') {
        const pf = parentSection && this._roleFlagsFromPlanChildren(parentSection.sourceItem);
        const fr = parentSection && this._planFacadeRolesFromChildren(parentSection.sourceItem);
        const hTopBand = Number(z.hTopMm);
        const antMm = Math.max(0, Number(z.carcassAntresolMm) || 0);
        const mainMm = Math.max(0, Number(z.carcassMainMm) || 0);
        if (fr && fr.splitMainAndTop) {
          if (Number.isFinite(hTopBand) && hTopBand > 0) {
            size.y = hTopBand;
          } else if (
            pf &&
            pf.hasTop &&
            Number.isFinite(Number(z.carcassMm)) &&
            Number(z.carcassMm) > 0
          ) {
            const innerMid =
              Math.max(0, Number(z.carcassMm) || 0) +
              (Number.isFinite(Number(z.hTopMm)) && Number(z.hTopMm) > 0 ? Number(z.hTopMm) : 0);
            const mainH = pf.hasCorpusMain ? mainMm : 0;
            const derived = Math.max(0, innerMid - mainH - antMm);
            if (derived > 0) size.y = derived;
          } else {
            const derived = this._facadesTopShelfHeightMm(parentSection);
            if (derived > 0) size.y = derived;
          }
        } else if (pf && pf.hasCorpusAnt && antMm > 0) {
          size.y = antMm;
        } else if (Number.isFinite(hTopBand) && hTopBand > 0) {
          size.y = hTopBand;
        } else if (
          pf &&
          pf.hasTop &&
          Number.isFinite(Number(z.carcassMm)) &&
          Number(z.carcassMm) > 0
        ) {
          const innerMid =
            Math.max(0, Number(z.carcassMm) || 0) +
            (Number.isFinite(Number(z.hTopMm)) && Number(z.hTopMm) > 0 ? Number(z.hTopMm) : 0);
          const mainH = pf.hasCorpusMain ? mainMm : 0;
          const derived = Math.max(0, innerMid - mainH - antMm);
          if (derived > 0) size.y = derived;
        }
      } else if (lrAfter === 'top') {
        const hTopBand = Number(z.hTopMm);
        if (Number.isFinite(hTopBand) && hTopBand > 0) {
          size.y = hTopBand;
        } else {
          // Как __catalogRolePreview: при h_top=0 vertical-layout отдаёт hTopMm=0, но в дереве есть
          // роль top — высота = остаток innerMid − полоса корпуса (без «фиктивного» main, если нет роли corpus).
          const pf = parentSection && this._roleFlagsFromPlanChildren(parentSection.sourceItem);
          if (
            pf &&
            pf.hasTop &&
            Number.isFinite(Number(z.carcassMm)) &&
            Number(z.carcassMm) > 0
          ) {
            const innerMid =
              Math.max(0, Number(z.carcassMm) || 0) +
              (Number.isFinite(Number(z.hTopMm)) && Number(z.hTopMm) > 0 ? Number(z.hTopMm) : 0);
            const mainH = pf.hasCorpusMain ? Math.max(0, Number(z.carcassMainMm) || 0) : 0;
            const antH = Math.max(0, Number(z.carcassAntresolMm) || 0);
            const derived = Math.max(0, innerMid - mainH - antH);
            if (derived > 0) size.y = derived;
          }
        }
      } else if (
        lrAfter === 'service' &&
        Number.isFinite(Number(z.serviceMm)) &&
        Number(z.serviceMm) >= 0
      ) {
        size.y = Math.max(0, Number(z.serviceMm));
      }
    }

    // Превью каталога (layoutZones нет): plinth + corpus | corpus_antresol + top (h_top из vars или остаток).
    // ВАЖНО: применяется ТОЛЬКО для корневой section шкафа (depth=0). Внутри module-шаблонов
    // (catalog_32/27/30) корневая section имеет ту же роль, что и модуль-обёртка ("plinth"/"corpus_antresol"/"top"),
    // и зонная математика добавила бы повторный сдвиг на h_bottom → между цоколем и корпусом возникал
    // лишний отступ 100мм, а у антресоли — наезд на верхнюю планку корпуса.
    const __insideModuleTree = (this._catalogModuleBuildDepth || 0) > 0;
    let __catalogRolePrev = null;
    if (!__hasZones && !__insideModuleTree && lrAfter && parentSection && parentSection.size && !manualLayout) {
      const hb = Math.max(0, Number(this.variables?.h_bottom) || 0);
      const py = Number(parentSection.size.y);
      const techPrev = Math.max(
        0,
        Number(
          this.variables?.tech_zone_mm ??
            this.variables?.h_service ??
            this.variables?.service_zone_mm
        ) || 0
      );
      const hTopVar = Math.max(0, Number(this.variables?.h_top) || 0);
      const antSplit = Math.max(0, Number(this.variables?.corpus_antresol_mm) || 0);
      const flags = this._roleFlagsFromPlanChildren(parentSection.sourceItem);
      const fullInner =
        Number.isFinite(py) && py > 0 ? Math.max(0, py - hb - techPrev) : 0;

      let carcassTotal = 0;
      let antH = 0;
      let mainH = 0;
      let hTopShelf = hTopVar;

      if (fullInner > 0) {
        if (hTopVar > 0) {
          carcassTotal = Math.max(0, fullInner - hTopVar);
        } else if (flags.hasTop) {
          carcassTotal = fullInner;
        } else {
          carcassTotal = fullInner;
        }
        antH = antSplit > 0 ? Math.min(antSplit, carcassTotal) : 0;
        mainH = flags.hasCorpusMain ? Math.max(0, carcassTotal - antH) : 0;
        if (hTopVar <= 0 && flags.hasTop) {
          hTopShelf = Math.max(0, fullInner - mainH - antH);
        }
        // Антресоль как layout_role top без corpus_antresol_mm: иначе antH=0, mainH=весь корпус, hTopShelf=0
        // и секция остаётся с size «s:y - v:h_bottom» ≈ весь шкаф, pos «v:h_bottom» — дно у цоколя, крыша у потолка.
        if (flags.hasTop && hTopShelf <= 0 && fullInner > 0 && antSplit <= 0) {
          const fallbackAnt = Math.max(300, Math.min(800, Math.round(fullInner * 0.22)));
          antH = fallbackAnt;
          mainH = flags.hasCorpusMain ? Math.max(0, fullInner - antH) : 0;
          hTopShelf = Math.max(0, fullInner - mainH - antH);
          console.warn(
            '[CLD][antresol] Нет v:corpus_antresol_mm — оценка высоты антресоли',
            fallbackAnt,
            'мм. Задайте corpus_antresol_mm в clodisVariables.'
          );
        }
      }

      __catalogRolePrev = {
        hb,
        py,
        techPrev,
        hTopShelf,
        carcassTotal,
        antH,
        mainH,
        flags,
      };
    }
    if (__catalogRolePrev) {
      const { hb, techPrev, hTopShelf, carcassTotal, antH, mainH, flags } = __catalogRolePrev;
      if (lrAfter === 'plinth' && Number.isFinite(hb)) {
        size.y = hb;
      } else if (lrAfter === 'corpus' && carcassTotal > 0) {
        if (antH > 0 && flags && (flags.hasCorpusAnt || flags.hasTop)) {
          size.y = mainH > 0 ? mainH : carcassTotal;
        } else {
          size.y = carcassTotal;
        }
      } else if (lrAfter === 'corpus_antresol' && carcassTotal > 0) {
        if (antH > 0) {
          size.y = antH;
        } else if (!flags || !flags.hasCorpusMain) {
          size.y = carcassTotal;
        }
      } else if (
        lrAfter === 'top' &&
        (hTopShelf > 0 || (antH > 0 && flags && !flags.hasCorpusAnt))
      ) {
        size.y = hTopShelf > 0 ? hTopShelf : antH;
      } else if (lrAfter === 'service' && techPrev > 0) {
        size.y = techPrev;
      } else if (lrAfter === 'facades' && carcassTotal > 0) {
        const fr =
          parentSection && this._planFacadeRolesFromChildren(parentSection.sourceItem);
        if (fr && fr.hasSplitFacadeModules && flags.hasCorpusMain && mainH > 0) {
          size.y = hb + mainH;
        } else {
          size.y = hb + mainH + antH;
        }
      } else if (lrAfter === 'facades_main' && carcassTotal > 0) {
        const band =
          flags.hasCorpusMain && mainH > 0
            ? mainH
            : flags.hasCorpusAnt && antH > 0
              ? antH
              : carcassTotal;
        size.y = band;
      } else if (lrAfter === 'facades_top' && carcassTotal > 0) {
        const fr =
          parentSection && this._planFacadeRolesFromChildren(parentSection.sourceItem);
        if (fr && fr.splitMainAndTop) {
          if (hTopShelf > 0) {
            size.y = hTopShelf;
          } else {
            const derived = this._facadesTopShelfHeightMm(parentSection);
            if (derived > 0) size.y = derived;
          }
        } else if (flags.hasCorpusAnt && antH > 0) {
          size.y = antH;
        } else if (hTopShelf > 0) {
          size.y = hTopShelf;
        }
      }
    }

    let pos = this.evaluatePosition(item.pos || {}, parentSection, size);
    let pivot = this.evaluatePivot(item.pivot || {}, size);

    if (__catalogRolePrev) {
      const { hb, techPrev, hTopShelf, carcassTotal, antH, mainH, flags } = __catalogRolePrev;
      const px = Number(parentSection.size.x);
      const pz = Number(parentSection.size.z);
      const isFacadeRolePrev =
        lrAfter === 'facades' || lrAfter === 'facades_main' || lrAfter === 'facades_top';
      if (Number.isFinite(px) && px > 0) size.x = px;
      // Как layoutZones: фасаду НЕ раздувать size.z до глубины корпуса (иначе дверь «в полёте»).
      if (Number.isFinite(pz) && pz > 0 && !isFacadeRolePrev) size.z = pz;
      if (lrAfter === 'plinth') {
        pos.y = 0;
      } else if (lrAfter === 'corpus' && carcassTotal > 0) {
        pos.y = hb;
      } else if (
        lrAfter === 'corpus_antresol' &&
        carcassTotal > 0 &&
        (antH > 0 || !flags || !flags.hasCorpusMain)
      ) {
        pos.y = hb + (flags && flags.hasCorpusAnt && antH > 0 ? mainH : 0);
      } else if (lrAfter === 'facades' && carcassTotal > 0) {
        pos.y = 0;
      } else if (lrAfter === 'facades_main') {
        pos.y = hb;
      } else if (lrAfter === 'facades_top') {
        if (flags && flags.hasCorpusAnt && antH > 0) {
          pos.y = hb + (flags.hasCorpusMain && mainH > 0 ? mainH : 0);
        } else if (hTopShelf > 0) {
          pos.y = hb + mainH;
        }
      } else if (
        lrAfter === 'top' &&
        (hTopShelf > 0 || (antH > 0 && flags && !flags.hasCorpusAnt))
      ) {
        // BLB секции антресоли — сразу над корпусом (не верхний угол всего шкафа).
        pos.y = hb + mainH;
      } else if (lrAfter === 'service' && techPrev > 0) {
        pos.y = hb + mainH + antH + hTopShelf;
      }
      if (
        lrAfter === 'plinth' ||
        lrAfter === 'corpus' ||
        lrAfter === 'corpus_antresol' ||
        lrAfter === 'facades' ||
        lrAfter === 'facades_main' ||
        lrAfter === 'facades_top' ||
        lrAfter === 'top' ||
        lrAfter === 'service'
      ) {
        pos.x = 0;
        if (isFacadeRolePrev) {
          this._applyFacadeShellDepthToParent(item, parentSection, size, pos);
        } else {
          pos.z = 0;
        }
        pivot = {
          x: -Number(size.x) / 2,
          y: -Number(size.y) / 2,
          z: -Number(size.z) / 2,
        };
      }
    }

    // Жёсткая привязка role-секций к общей секции комнаты:
    // - ширина/глубина role-секции = ширина/глубина родительской секции;
    // - по Y: plinth=0, corpus=plinthMm, facades=0 (от пола);
    //   corpus_antresol: как в превью каталога — сдвиг на carcassMainMm только если в дереве есть роль corpus;
    //   top: при ненулевой зоне hTopMm — низ верхней полосы ниши (yCorpus); иначе стопка под антресолью
    //   внутри полосы корпуса: plinth + main + ant (без «фиктивного» main при одной corpus_antresol).
    //   service=после top (зона hTopMm + service).
    if (z && lrAfter && parentSection && parentSection.size && !manualLayout) {
      const px = Number(parentSection.size.x);
      const pz = Number(parentSection.size.z);
      const isFacadeRole =
        lrAfter === 'facades' || lrAfter === 'facades_main' || lrAfter === 'facades_top';
      if (Number.isFinite(px) && px > 0) size.x = px;
      if (Number.isFinite(pz) && pz > 0 && !isFacadeRole) size.z = pz;

      const plinthMm = Number(z.plinthMm);
      const carcassMm = Number(z.carcassMm);
      const hTopBand = Number(z.hTopMm);
      const yPlinth = Number.isFinite(plinthMm) && plinthMm >= 0 ? plinthMm : 0;
      const yCorpus = yPlinth + (Number.isFinite(carcassMm) && carcassMm >= 0 ? carcassMm : 0);
      const yAfterAntresol =
        yCorpus + (Number.isFinite(hTopBand) && hTopBand >= 0 ? hTopBand : 0);
      const planRoleFlags = this._roleFlagsFromPlanChildren(parentSection.sourceItem);

      const yBefore = pos && Number.isFinite(Number(pos.y)) ? Number(pos.y) : null;
      if (lrAfter === 'plinth') {
        pos.y = 0;
      } else if (lrAfter === 'corpus') {
        pos.y = yPlinth;
      } else if (lrAfter === 'corpus_antresol') {
        const mainBand = Number(z.carcassMainMm);
        const offMain =
          planRoleFlags &&
          planRoleFlags.hasCorpusMain &&
          Number.isFinite(mainBand) &&
          mainBand >= 0
            ? mainBand
            : 0;
        pos.y = yPlinth + offMain;
      } else if (lrAfter === 'facades') {
        pos.y = 0;
      } else if (lrAfter === 'facades_main') {
        pos.y = yPlinth;
      } else if (lrAfter === 'facades_top') {
        const antMm = Math.max(0, Number(z.carcassAntresolMm) || 0);
        const mainMm = Math.max(0, Number(z.carcassMainMm) || 0);
        if (planRoleFlags && planRoleFlags.hasCorpusAnt && antMm > 0) {
          pos.y = yPlinth + (planRoleFlags.hasCorpusMain && mainMm > 0 ? mainMm : 0);
        } else if (Number.isFinite(hTopBand) && hTopBand > 0) {
          pos.y = yCorpus;
        } else {
          const mainH = planRoleFlags && planRoleFlags.hasCorpusMain ? mainMm : 0;
          pos.y = yPlinth + mainH + antMm;
        }
      } else if (lrAfter === 'top') {
        if (Number.isFinite(hTopBand) && hTopBand > 0) {
          pos.y = yCorpus;
        } else {
          const mainH =
            planRoleFlags && planRoleFlags.hasCorpusMain
              ? Math.max(0, Number(z.carcassMainMm) || 0)
              : 0;
          pos.y = yPlinth + mainH;
        }
      } else if (lrAfter === 'service') {
        pos.y = yAfterAntresol;
      }

      // Для role-секций в комнате не используем авторские anchor/pivot:
      // секции должны жестко совпадать с зоной ниши по X/Z и по "этажу" по Y.
      // Пивот (точка привязки) ставим в min-угол под-секции, чтобы min-корнеры секций
      // совпали с min-корнером родителя (внутренний back-left-bottom = 0,0,0).
      pos.x = 0;
      if (isFacadeRole) {
        this._applyFacadeShellDepthToParent(item, parentSection, size, pos);
      } else {
        pos.z = 0;
      }
      pivot = {
        x: -Number(size.x) / 2,
        y: -Number(size.y) / 2,
        z: -Number(size.z) / 2,
      };

      if (
        typeof window !== 'undefined' &&
        (window.DEBUG_PLINTH_GEOMETRY === true || window.DEBUG_COLOR_FURNITURE_PARTS === true)
      ) {
        const _tag = lrAfter || 'role?';
        console.log(`[DEBUG][role:${_tag}]`, {
          sectionName,
          role: lrAfter,
          plinthMm: z.plinthMm,
          carcassMm: z.carcassMm,
          carcassMainMm: z.carcassMainMm,
          carcassAntresolMm: z.carcassAntresolMm,
          hTopMm: z.hTopMm,
          serviceMm: z.serviceMm,
          h_bottom_var: this.variables?.h_bottom,
          h_top_var: this.variables?.h_top,
          innerMm: this.layoutZones?.innerMm,
          rootSectionSizeY: this.rootSectionContext?.size?.y,
          sizeBeforeY: yBefore,
          sizeNow: { x: size?.x, y: size?.y, z: size?.z },
          posNow: { x: pos?.x, y: pos?.y, z: pos?.z },
          parentSectionSize: parentSection?.size,
        });
      }
    }

    // Принудительная синхронизация cabinet_root с общей секцией комнаты (slot size).
    // Цель: cabinet_root становится контейнером (0,0,0) и имеет размеры слота по X/Y/Z.
    // Y cabinet_root = plinthMm + carcassMm + hTopMm + serviceMm (техзона поверх антресоли при заданном tech_zone_mm).
    // Это больше чем innerHeightMm: cabinet_root.bottom = пол (y=0), top = нижняя грань верхней планки.
    if (isCabinetRootInRoom) {
      const ctx = parentSection && parentSection.size ? parentSection : this.rootSectionContext;
      if (ctx && ctx.size) {
        const sx = Number(ctx.size.x);
        const sz = Number(ctx.size.z);
        if (Number.isFinite(sx) && sx > 0) size.x = sx;
        if (Number.isFinite(sz) && sz > 0) size.z = sz;
        // Y: сумма зон даёт полную высоту корня от пола (включая serviceMm при наличии)
        if (z) {
          const totalH =
            Number(z.plinthMm || 0) +
            Number(z.carcassMm || 0) +
            Number(z.hTopMm || 0) +
            Number(z.serviceMm || 0);
          if (Number.isFinite(totalH) && totalH > 0) {
            size.y = totalH;
          } else {
            const sy = Number(ctx.size.y);
            if (Number.isFinite(sy) && sy > 0) size.y = sy;
          }
        } else {
          const sy = Number(ctx.size.y);
          if (Number.isFinite(sy) && sy > 0) size.y = sy;
        }
      }

      // Для контейнера координат не используем pos/pivot из JSON.
      pos = { x: 0, y: 0, z: 0 };
      pivot = { x: 0, y: 0, z: 0 };
    }

    // Уменьшение depth на толщину фасада — только для role-section на cabinet_root.
    // Внутри catalog module (depth>0) оболочка уже ужата в buildModule — повторно не вычитаем (иначе −32мм).
    const ftOffset = parentSection && parentSection.facadeThicknessOffset;
    const insideCatalogModuleShell = (this._catalogModuleBuildDepth || 0) > 0;
    if (
      ftOffset > 0 &&
      !insideCatalogModuleShell &&
      !this._isFacadeLayoutRole(lrAfter) &&
      (lrAfter === 'corpus' ||
        lrAfter === 'corpus_antresol' ||
        lrAfter === 'plinth' ||
        lrAfter === 'service' ||
        lrAfter === 'top')
    ) {
      const oldZ = size.z;
      size.z = Math.max(0, size.z - ftOffset);
      this._dbg(`🚪 [facadeOffset] "${sectionName}" (role=${lrAfter}): depth ${oldZ} → ${size.z} (−${ftOffset}мм)`);
    }

    // Store original size in userData (before it might be recalculated from children)
    sectionGroup.userData.originalSize = { ...size };
    sectionGroup.userData.originalPosition = { ...pos };
    sectionGroup.userData.originalPivot = { ...pivot };
    
    this._dbg(`📐 buildSection "${sectionName}": originalSize сохранен:`, sectionGroup.userData.originalSize);

    // Store section context for children
    // ВАЖНО: Для выражений s:x, s:y, s:z детали должны ссылаться на РОДИТЕЛЬСКУЮ секцию (parentSection),
    // а не на текущую секцию. Текущая секция используется только для позиционирования.
    // Если parentSection = null (корневая секция), используем текущую секцию как контекст для s:x, s:y, s:z
    const sectionContextForExpressions = parentSection || {
      size: size,
      position: pos,
      pivot: pivot,
      parent: null,
      name: sectionName,
    };
    
    const scanParentCtx = parentSection || { size, name: sectionName };
    const facadeThicknessOffset =
      item.children && Array.isArray(item.children)
        ? this._scanFacadeThicknessOffsetMm(item.children, scanParentCtx)
        : 0;
    if (facadeThicknessOffset > 0) {
      this._dbg(
        `🚪 Секция "${sectionName}": фасад в дереве, толщина=${facadeThicknessOffset}мм → depth корпуса/цоколя −${facadeThicknessOffset}мм`
      );
    }

    const sectionDrillIds = this._collectHingeDrillTemplateIds(parentSection);
    const sectionContext = {
      size: size,
      position: pos,
      pivot: pivot,
      parent: parentSection,
      name: sectionName,
      rootSection: sectionContextForExpressions,
      facadeThicknessOffset: facadeThicknessOffset,
      hingeModuleLocalBuild: !!(parentSection && parentSection.hingeModuleLocalBuild),
      facadeThinShell: !!(parentSection && parentSection.facadeThinShell),
      facadeShellDepthMm: Number(parentSection?.facadeShellDepthMm) || 0,
      hingeCatalogSourceItem:
        parentSection?.hingeCatalogSourceItem ||
        (parentSection?.hingeModuleLocalBuild ? parentSection?.sourceItem : null),
      hingeFacadeDrillTemplateId:
        sectionDrillIds.facade || parentSection?.hingeFacadeDrillTemplateId || 0,
      hingeDoorDrillTemplateId:
        sectionDrillIds.door || parentSection?.hingeDoorDrillTemplateId || 0,
      layoutRole: parentSection?.layoutRole || item?.layout_role || '',
      sourceItem: item,
      groupRef: sectionGroup,
      _cldSectionContext: parentSection,
    };
    this._invokeItemEvent(item, 'on_before_build', { parentSection, size, pos, pivot, context: sectionContext });

    this.sectionStack.push(sectionContext);

    // Build children
    let childrenCount = 0;
    if (item.children && Array.isArray(item.children)) {
      this._dbg(`🔍 Секция "${sectionName}": обработка ${item.children.length} children:`, 
        item.children.map(c => ({ type: c.type, name: c.name })));
      
      item.children.forEach((child, index) => {
        this._dbg(`  🔍 [${index + 1}/${item.children.length}] Обработка child:`, {
          type: child.type,
          name: child.name,
          hasSize: !!child.size,
          hasPos: !!child.pos,
          hasPivot: !!child.pivot,
          hasSpec: !!child.spec,
          orientation: child.spec?.orientation,
          size: child.size,
          pos: child.pos
        });
        
        // Прокидываем контекст текущей секции во все дочерние узлы (и section, и wall/facade),
        // чтобы s:x/s:y/s:z всегда ссылались на размеры НЕПОСРЕДСТВЕННОГО родителя.
        const contextForChild = sectionContext;
        const built = this.buildItem(child, contextForChild);
        if (built) {
          sectionGroup.add(built);
          childrenCount++;
          this._dbg(`    ✅ Child "${child.name}" (${child.type}) успешно создан и добавлен в секцию "${sectionName}"`);
          
          // Проверяем, что built действительно добавлен
          if (sectionGroup.children.includes(built)) {
            this._dbg(`      ✅ Подтверждено: child добавлен в sectionGroup.children`);
            
            // Если это mesh, проверяем его размеры
            if (built.isMesh) {
              const bbox = new THREE.Box3().setFromObject(built);
              const size = bbox.getSize(new THREE.Vector3());
              this._dbg(`      📐 Mesh размеры:`, {
                width: size.x + 'мм',
                height: size.y + 'мм',
                depth: size.z + 'мм',
                position: { x: built.position.x + 'мм', y: built.position.y + 'мм', z: built.position.z + 'мм' },
                visible: built.visible
              });
              
              if (size.x < 0.001 || size.y < 0.001 || size.z < 0.001) {
                console.error(`      ❌❌❌ МЕШ ИМЕЕТ НУЛЕВОЙ РАЗМЕР! ❌❌❌`);
              }
            }
          } else {
            console.error(`      ❌❌❌ Child НЕ НАЙДЕН в sectionGroup.children! ❌❌❌`);
          }
        } else {
          console.warn(`    ❌ Child "${child.name}" (${child.type}) НЕ создан!`);
          console.warn(`      Проверьте buildItem для типа "${child.type}"`);
        }
      });
    } else {
      console.warn(`⚠️ Секция "${sectionName}": нет children или children не массив!`, {
        hasChildren: !!item.children,
        isArray: Array.isArray(item.children),
        children: item.children
      });
    }
    
    // Build accessories (комплектующие) - добавляем после children
    let accessoriesCount = 0;
    if (item.accessories && Array.isArray(item.accessories) && item.accessories.length > 0) {
      this._dbg(`🔧 Секция "${sectionName}": обработка ${item.accessories.length} комплектующих`);
      
      item.accessories.forEach((acc, index) => {
        if (!acc || !acc.id) return;
        const accName = acc.name || `Комплектующее #${acc.id}`;
        const count = Number(acc.count || 1);
        
        this._dbg(`  🔧 [${index + 1}/${item.accessories.length}] Обработка комплектующего:`, {
          id: acc.id,
          name: accName,
          count: count,
          sku: acc.sku || acc.article || ''
        });
        
        // Создаём placeholder для каждого экземпляра комплектующего
        for (let i = 0; i < count; i++) {
          const accessoryMesh = this.buildAccessory(acc, sectionContext, i);
          if (accessoryMesh) {
            sectionGroup.add(accessoryMesh);
            accessoriesCount++;
            this._dbg(`    ✅ Комплектующее "${accName}" #${i + 1} создано и добавлено`);
          }
        }
      });
    }
    
    this._dbg(`📦 Section "${sectionName}": ${childrenCount} children, ${accessoriesCount} комплектующих, size:`, {
      x: size.x + 'мм',
      y: size.y + 'мм',
      z: size.z + 'мм'
    });
    this._dbg(`   Position: (${pos.x}, ${pos.y}, ${pos.z})мм`);
    this._dbg(`   Pivot: (${pivot.x}, ${pivot.y}, ${pivot.z})мм`);
    this._dbg(`   ✅ userData установлен: isSection=${sectionGroup.userData.isSection}, sectionName="${sectionGroup.userData.sectionName}"`);
    this._dbg(`   ✅ sectionGroup добавлен в иерархию, children: ${sectionGroup.children.length}`);

    // НЕ создаем визуальную рамку для секции - только детали должны отображаться
    // Секция - это контейнер, а не визуальный объект

    // If size was not fully specified (0 or NaN), calculate from children bounds
    if (sectionGroup.children.length > 0) {
      const childrenBox = new THREE.Box3();
      sectionGroup.children.forEach(child => {
        const childBox = new THREE.Box3().setFromObject(child);
        childrenBox.union(childBox);
      });
      if ((size.x === 0 || isNaN(size.x)) && childrenBox.max.x > childrenBox.min.x) {
        size.x = Math.max(childrenBox.max.x - childrenBox.min.x, 0.1);
      }
      if ((size.y === 0 || isNaN(size.y)) && childrenBox.max.y > childrenBox.min.y) {
        size.y = Math.max(childrenBox.max.y - childrenBox.min.y, 0.1);
      }
      if ((size.z === 0 || isNaN(size.z)) && childrenBox.max.z > childrenBox.min.z) {
        size.z = Math.max(childrenBox.max.z - childrenBox.min.z, 0.1);
      }
    }

    // Apply position and pivot
    // ВАЖНО: Для корневой секции (parentSection = null) НЕ применяем transform,
    // так как она должна быть в (0,0,0) и служить контейнером для деталей
    // Детали позиционируются относительно начала координат секции (back-left-bottom = 0,0,0)
    // Transform будет применен позже в Furniture.setupPivot для всей мебели
    const isRootForTransform =
      isCabinetRootInRoom ||
      parentSection == null ||
      parentSection === this.rootSectionContext;

    if (!isRootForTransform) {
      // Для секций (THREE.Group) НЕ используем applyTransform(pos, pivot):
      //   applyTransform делает group.position = pos - pivot = pos + size/2.
      //   Для МЕША (BoxGeometry centred at origin) это правильно: corner меша
      //   встаёт ровно в pos. Но Group — не меш: его local (0,0,0) — это и есть
      //   back-left-bottom контейнера. Дети строятся от этого origin.
      //   Если сдвинуть origin на +size/2, каждый дочерний меш добавит ещё +size/2
      //   → итог: смещение в 2× (визуально: plinth вниз, corpus вверх на полвысоты,
      //   призрак в 2 раза больше секции).
      //   Правильно: group.position = pos напрямую (back-left-bottom = pos в parent).
      sectionGroup.position.set(
        Number(pos.x) || 0,
        Number(pos.y) || 0,
        Number(pos.z) || 0,
      );
      const rot = item.rot || {};
      if (rot.x) sectionGroup.rotation.x = this.parseRotation(rot.x);
      if (rot.y) sectionGroup.rotation.y = this.parseRotation(rot.y);
      if (rot.z) sectionGroup.rotation.z = this.parseRotation(rot.z);
    } else {
      // Корневая секция/контейнер НЕ должна сдвигаться applyTransform'ом.
      // Иначе весь шкаф уезжает (root за комнатой) и role-подсекции "разъезжаются".
      sectionGroup.position.set(0, 0, 0);
      this._dbg(
        `📐 Корневая секция "${sectionName}": НЕ применяем transform (root container), позиция остается (0,0,0)`
      );
      this._dbg(`   pos ignored:`, pos, `pivot ignored:`, pivot);
      this._dbg(
        `   Детали будут позиционироваться относительно начала координат секции (back-left-bottom = 0,0,0)`
      );

      // Применяем только rotation, если есть
      if (item.rot) {
        if (item.rot.x) sectionGroup.rotation.x = this.parseRotation(item.rot.x);
        if (item.rot.y) sectionGroup.rotation.y = this.parseRotation(item.rot.y);
        if (item.rot.z) sectionGroup.rotation.z = this.parseRotation(item.rot.z);
      }
    }

    this._invokeItemEvent(item, 'on_after_build', { parentSection, target: sectionGroup });

    // Debug: pivot/bbox для подсекций мебели — только по кнопкам UI (не глобальные флаги HTML).
    // Роли (plinth/corpus/top): «Шкаф по ролям» = DEBUG_COLOR_FURNITURE_PARTS.
    // Корень: «Корень pivot» = DEBUG_ROOT_SECTION_PIVOTS.
    // Маркеры всегда вешаются на соответствующую THREE.Group секции (не «отдельно» в мире).
    const showRolePivots =
      typeof window !== 'undefined' && window.DEBUG_COLOR_FURNITURE_PARTS === true;
    const showRootPivots =
      typeof window !== 'undefined' && window.DEBUG_ROOT_SECTION_PIVOTS === true;

    const isRoleSection = [
      'plinth',
      'corpus',
      'corpus_antresol',
      'top',
      'facades',
      'facades_main',
      'facades_top',
    ].includes(sectionGroup?.userData?.layoutRole);
    // В buildFromJSON верхняя секция получает parentSection = rootSectionContext (не null),
    // иначе ломались бы выражения s:x/s:y. Считаем «корнем мебели» и этот случай.
    const isRootSection =
      parentSection == null || parentSection === this.rootSectionContext;

    const shouldAddPivotMarkers =
      sectionGroup.userData &&
      sectionGroup.userData.isSection &&
      !sectionGroup.userData.__pivotMarkerAdded &&
      (isRootSection || isRoleSection);

    if (shouldAddPivotMarkers) {
      try {
        const role = sectionGroup.userData.layoutRole || '';
        const baseColor = isRootSection
          ? 0xff6600
          : role === 'plinth'
            ? 0x00ccff
            : role === 'corpus'
              ? 0xff33cc
              : role === 'corpus_antresol'
                ? 0xcc66ff
                : role === 'facades'
                  ? 0x44dd88
                  : role === 'facades_main'
                    ? 0x33bb77
                    : role === 'facades_top'
                      ? 0x66ee99
                      : 0xffcc00;

        const sphereR = isRootSection ? 28 : 18;
        const addMarker = (localPos, name, color, opacity = 0.95) => {
          const marker = new THREE.Mesh(
            new THREE.SphereGeometry(sphereR, 10, 8),
            new THREE.MeshBasicMaterial({
              color,
              transparent: true,
              opacity,
              // На геометрии секции, а не «поверх всей сцены»
              depthTest: true,
              depthWrite: false,
            })
          );
          marker.name = name;
          marker.position.set(
            Number(localPos?.x) || 0,
            Number(localPos?.y) || 0,
            Number(localPos?.z) || 0
          );
          marker.renderOrder = 260;
          marker.userData.__cldDbgPivotKind = isRootSection ? 'root' : 'role';
          marker.userData.__cldDbgPivotRole = role || (isRootSection ? 'root' : '');
          marker.visible = isRootSection ? showRootPivots : showRolePivots;
          sectionGroup.add(marker);
        };

        if (isRootSection) {
          // Для корня трансформ НЕ применяется, поэтому единственная смысловая
          // точка — это local origin (0,0,0) = back-left-bottom = точка привязки к стене.
          addMarker({ x: 0, y: 0, z: 0 }, 'PivotMarkerLocal_root', baseColor, 0.95);
        } else {
          // Для подсекций (plinth/corpus/top): back-left-bottom = local origin {0,0,0}.
          // Секция теперь позиционируется напрямую (group.position = pos), без applyTransform.
          // Старый маркер 'pivot' = {-sx/2,...} больше не актуален: он раздувал bbox
          // в setupPivot (setFromObject включал невидимые сферы) → призрак 1.5× больше.
          // Ставим оба маркера в {0,0,0} = back-left-bottom угол секции.
          addMarker({ x: 0, y: 0, z: 0 }, 'PivotMarkerLocalOrigin', 0x222222, 0.8);
          addMarker({ x: 0, y: 0, z: 0 }, `PivotMarkerLocal_${role}`, baseColor, 0.95);
        }

        // Для корня мебели делаем отладочный wireframe габаритов секции,
        // чтобы было видно не только pivot-точку, но и сам "контейнер" (box).
        if (isRootSection) {
          // Чтобы wireframe совпадал с реальными дочерними mesh-гранями,
          // считаем bbox по sectionGroup, но исключаем debug-пивоты (PivotMarker*),
          // иначе bbox раздувается радиусом сфер (и получается "в 2 раза больше").
          sectionGroup.updateMatrixWorld(true);
          const bb = new THREE.Box3();
          // Traverse ALL descendants (не только прямые дети):
          // cabinet_root — контейнер из Section-групп (plinth/corpus), у которых нет
          // прямых мешей на верхнем уровне. children.forEach нашла бы 0 мешей →
          // bb.isEmpty() → бокс центрировался в {0,0,0} = в углу мебели → полбокса вылезает.
          sectionGroup.traverse((ch) => {
            if (!ch || ch === sectionGroup) return;
            // Исключаем отладочные маркеры pivot и сам bbox.
            const nm = ch.name || '';
            if (nm.includes('PivotMarker') || nm === 'RootSectionBBoxDebug') return;
            // На всякий случай исключаем объекты, помеченные как debug pivot kind.
            if (ch.userData && ch.userData.__cldDbgPivotKind) return;
            if (ch.isMesh || ch.isLineSegments || ch.isLine) {
              const cb = new THREE.Box3().setFromObject(ch);
              bb.union(cb);
            }
          });
          const bboxSize = bb.getSize(new THREE.Vector3());

          let sx = Number(bboxSize.x);
          let sy = Number(bboxSize.y);
          let sz = Number(bboxSize.z);

          // Fallback: если bbox по потомкам выродился (нет видимых мешей),
          // используем вычисленные параметры секции.
          if (!Number.isFinite(sx) || sx <= 0) sx = Number(size?.x);
          if (!Number.isFinite(sy) || sy <= 0) sy = Number(size?.y);
          if (!Number.isFinite(sz) || sz <= 0) sz = Number(size?.z);

          // Центр бокса в local-пространстве sectionGroup.
          // При traverse найдены реальные меши → используем их bbox-центр.
          // При fallback (меши не найдены) → геометрический центр секции {sx/2,sy/2,sz/2},
          // иначе BoxGeometry(sx,sy,sz) при position={0,0,0} вылезает на −sx/2..+sx/2
          // и "выходит за комнату".
          let bboxCenterLocal;
          if (!bb.isEmpty()) {
            const bboxCenterWorld = bb.getCenter(new THREE.Vector3());
            bboxCenterLocal = sectionGroup.worldToLocal(bboxCenterWorld.clone());
          } else {
            bboxCenterLocal = new THREE.Vector3(sx / 2, sy / 2, sz / 2);
          }

          if (sx > 0 && sy > 0 && sz > 0) {
            const boxEdges = new THREE.EdgesGeometry(
              new THREE.BoxGeometry(sx, sy, sz)
            );
            const wireMat = new THREE.LineBasicMaterial({
              color: baseColor,
              transparent: true,
              opacity: 0.75,
              depthTest: true,
              depthWrite: false,
            });
            const rootBox = new THREE.LineSegments(boxEdges, wireMat);
            rootBox.name = 'RootSectionBBoxDebug';
            rootBox.position.copy(bboxCenterLocal);
            rootBox.renderOrder = 255;
            rootBox.userData.__cldDbgPivotKind = 'root';
            rootBox.userData.__cldDbgPivotRole = 'root';
            rootBox.visible = showRootPivots;
            sectionGroup.add(rootBox);
          }
        }

        sectionGroup.userData.__pivotMarkerAdded = true;
      } catch (e) {
        console.warn('[DEBUG][pivot] failed to add pivot marker:', e);
      }
    }

    if (
      typeof window !== 'undefined' &&
      (window.DEBUG_PLINTH_GEOMETRY === true ||
        window.DEBUG_COLOR_FURNITURE_PARTS === true) &&
      sectionGroup.userData.layoutRole === 'plinth'
    ) {
      try {
        sectionGroup.updateMatrixWorld(true);
        const sb = new THREE.Box3().setFromObject(sectionGroup);
        const ssz = sb.getSize(new THREE.Vector3());
        const smn = sb.min.clone();
        const smx = sb.max.clone();
        const childrenDbg = [];
        sectionGroup.children.forEach((ch, idx) => {
          if (!ch) return;
          const cb = new THREE.Box3().setFromObject(ch);
          const csz = cb.getSize(new THREE.Vector3());
          childrenDbg.push({
            i: idx,
            name: ch.name || ch.userData?.sectionName || ch.type,
            isMesh: !!ch.isMesh,
            isSection: !!ch.userData?.isSection,
            pos: ch.position
              ? { x: ch.position.x, y: ch.position.y, z: ch.position.z }
              : null,
            bboxMin: { x: cb.min.x, y: cb.min.y, z: cb.min.z },
            bboxMax: { x: cb.max.x, y: cb.max.y, z: cb.max.z },
            bboxSize: { x: csz.x, y: csz.y, z: csz.z },
          });
        });
        console.log('[DEBUG][plinth:bbox]', {
          sectionName,
          role: sectionGroup.userData.layoutRole,
          sectionPos: {
            x: sectionGroup.position.x,
            y: sectionGroup.position.y,
            z: sectionGroup.position.z,
          },
          sectionBBoxMin: { x: smn.x, y: smn.y, z: smn.z },
          sectionBBoxMax: { x: smx.x, y: smx.y, z: smx.z },
          sectionBBoxSize: { x: ssz.x, y: ssz.y, z: ssz.z },
          children: childrenDbg,
        });
      } catch (e) {
        console.warn('[DEBUG][plinth:bbox] failed', e);
      }
    }

    this._finalizeStandaloneCatalogHingesInSection(sectionGroup, sectionContext);

    this.sectionStack.pop();

    return sectionGroup;
  }

  /** Сборка в комнате (шаг 5): декор/ЛДСП с колеса, не material_id из каталога детали. */
  _roomStep5Active() {
    return !!(this.decorOutside || this.decorInside);
  }

  /** В комнате (шаг 5) выбран декор «внутри» — им красим корпус, не дефолт ЛДСП из каталога. */
  _roomStep5InsideDecorActive() {
    const d = this.decorInside;
    if (!d) return false;
    const tex = String(d.texture || d.icon || '').trim();
    if (tex) return true;
    const h = String(d.hex || '').trim().toLowerCase();
    return !!(h && h !== '#cccccc' && h !== '#ccc');
  }

  _step5DecorTextureUrl(decor) {
    if (!decor) return '';
    return String(decor.texture || decor.icon || '').trim();
  }

  _step5DecorHexFallback(decor) {
    if (!decor) return null;
    if (this._step5DecorTextureUrl(decor)) return null;
    const h = String(decor.hex || '').trim();
    if (!h || h.toLowerCase() === '#cccccc' || h.toLowerCase() === '#ccc') return null;
    return h;
  }

  _step5DecorPreviewColor(decor) {
    if (!decor) return null;
    if (typeof window !== 'undefined' && typeof window.getStep5DecorPreviewColor === 'function') {
      return window.getStep5DecorPreviewColor(decor);
    }
    return this._step5DecorHexFallback(decor);
  }

  _applyDecorTextureToMaterial(material, textureUrl, setupTexture) {
    if (!textureUrl || !material) return;
    const apply = (texture) => {
      const tex = texture && typeof texture.clone === 'function' ? texture.clone() : texture;
      if (!tex) return;
      tex.needsUpdate = true;
      if (typeof setupTexture === 'function') setupTexture(tex);
      if (tex.colorSpace !== undefined && THREE.SRGBColorSpace !== undefined) {
        tex.colorSpace = THREE.SRGBColorSpace;
      } else if (tex.encoding !== undefined && THREE.sRGBEncoding !== undefined) {
        tex.encoding = THREE.sRGBEncoding;
      }
      tex.anisotropy = 16;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.needsUpdate = true;
      material.map = tex;
      material.color.setHex(0xffffff);
      material.needsUpdate = true;
    };
    if (typeof window !== 'undefined' && typeof window.__cldLoadDecorTexture === 'function') {
      window.__cldLoadDecorTexture(textureUrl, apply);
      return;
    }
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      textureUrl,
      apply,
      undefined,
      (error) => {
        console.warn('[CLD][wall] Ошибка загрузки текстуры материала:', textureUrl, error);
      }
    );
  }

  _loadWallBodyTexture(material, textureUrl, repeatXMm, repeatYMm) {
    this._applyDecorTextureToMaterial(material, textureUrl, (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      const tw = Math.max(1, Number(repeatXMm) || 1000);
      const th = Math.max(1, Number(repeatYMm) || 1000);
      texture.repeat.set(tw / 1000, th / 1000);
    });
  }

  /** material_icon / texture в JSON детали (явный выбор в конструкторе). */
  _resolveWallItemExplicitDecorUrl(item) {
    if (!item) return '';
    const direct = String(item.material_icon || item.materialIcon || '').trim();
    if (direct) return direct;
    const sm = item.spec?.material;
    if (sm && typeof sm === 'object') {
      const fromSpec = String(sm.texture || sm.texture_url || sm.image || sm.icon || '').trim();
      if (fromSpec) return fromSpec;
    }
    return '';
  }

  /** Текстура из справочника материалов по material_id (дефолт каталога, не шаг 5). */
  _resolveWallItemDecorUrlFromLib(item) {
    if (!item) return '';
    const sm = item.spec?.material;
    const matKey = String(item.material_key || sm?.key || 'material_2').trim() || 'material_2';
    const matId = item.material_id ?? item.materialId ?? sm?.id;
    if (matId == null || matId === '' || typeof window === 'undefined') return '';
    const lib = window.__cldMaterialsLib;
    const list = lib?.itemsByKey?.[matKey];
    if (!Array.isArray(list)) return '';
    const found = list.find((x) => String(x?.id) === String(matId));
    return String(found?.texture || found?.texture_url || found?.image || found?.icon || '').trim();
  }

  /**
   * URL текстуры детали.
   * Комната (шаг 5): только явная текстура в JSON (превью в конструкторе), без material_id из карточки.
   * Иначе декор подтягивается с колеса при сборке/refreshFurnitureDecors.
   */
  _resolveWallItemDecorUrl(item) {
    const explicit = this._resolveWallItemExplicitDecorUrl(item);
    if (explicit) return explicit;
    if (this._roomStep5Active()) return '';
    if (this._roomStep5InsideDecorActive()) return '';
    return this._resolveWallItemDecorUrlFromLib(item);
  }

  /** Кромки корпуса/фасада из шага 5 (круг: материал ЛДСП → кромка + толщина). */
  _resolveStep5EdgesForItem(item, channel) {
    const ext = typeof window !== 'undefined' ? window.__cldStep5Edge : null;
    if (!ext || typeof ext.makeEdgesObject !== 'function') return null;

    const ch = String(channel || '').toLowerCase();
    const panelThicknessMm = (() => {
      try {
        if (!item?.size) return null;
        const sz = this.evaluateSize(item.size, null);
        const zMm = Math.abs(Number(sz?.z) || 0) * 1000;
        if (zMm > 0.5 && zMm < 80) return zMm;
      } catch (_) {}
      const t = Number(item?.spec?.thickness ?? item?.thickness);
      return Number.isFinite(t) && t > 0 ? t : null;
    })();

    if (ch === 'inside') {
      if (!this._roomStep5InsideDecorActive() || !this.decorInside) return null;
      const binding =
        typeof ext.resolveBindingForDecor === 'function'
          ? ext.resolveBindingForDecor(this.decorInside, { panelThicknessMm })
          : null;
      return binding
        ? ext.makeEdgesObject(binding, {
            texture: this.decorInside.texture,
            panelThicknessMm,
          })
        : null;
    }
    if (ch === 'outside') {
      if (!this.decorOutside) return null;
      const binding =
        typeof ext.resolveBindingForDecor === 'function'
          ? ext.resolveBindingForDecor(this.decorOutside, { panelThicknessMm })
          : null;
      return binding
        ? ext.makeEdgesObject(binding, {
            texture: this.decorOutside.texture,
            panelThicknessMm,
          })
        : null;
    }
    return null;
  }

  _mergeItemEdgesWithStep5(item, channel) {
    const templateEdges = item.edges && typeof item.edges === 'object' ? item.edges : {};
    const step5Edges = this._resolveStep5EdgesForItem(item, channel);
    if (!step5Edges) return templateEdges;
    const ext = typeof window !== 'undefined' ? window.__cldStep5Edge : null;
    if (ext && typeof ext.mergeTemplateEdgesWithStep5 === 'function') {
      return ext.mergeTemplateEdgesWithStep5(templateEdges, step5Edges);
    }
    return templateEdges;
  }

  // Build wall (vertical or horizontal panel)
  buildWall(item, parentSection) {
    const wallName = item.name || 'wall';
    const detailTypeId = item?.spec?.detailTypeId || item?.spec?.detail_type_id || '';
    this._invokeItemEvent(item, 'on_before_params', { parentSection });
    
    this._dbg(`🧱🧱🧱 buildWall: "${wallName}" detailTypeId=${detailTypeId || '—'} 🧱🧱🧱`);
    this._dbg(`  📋 Параметры:`, {
      hasSpec: !!item.spec,
      spec: item.spec,
      size: item.size,
      pos: item.pos,
      pivot: item.pivot,
      orientation: item.spec?.orientation
    });
    
    if (!item.spec) {
      console.error(`❌ buildWall "${wallName}": нет spec!`, item);
      return null;
    }

    this._dbg(`🧱🧱🧱 buildWall "${wallName}": ВЫЧИСЛЕНИЕ РАЗМЕРОВ 🧱🧱🧱`);
    const size = this.evaluateSize(item.size || {}, parentSection);
    this._dbg(`🧱🧱🧱 buildWall "${wallName}": РАЗМЕРЫ ВЫЧИСЛЕНЫ:`, {
      sizeInMeters: size,
      sizeInMm: {
        x: size.x * 1000,
        y: size.y * 1000,
        z: size.z * 1000
      },
      originalSizeObj: item.size
    });
    
    const pos = this.evaluatePosition(item.pos || {}, parentSection, size);
    // Тумба/pedestal: старый хак ширины horizontal_top.
    // Кухня (kitchen_base): как в админке — только формулы JSON, без подмены size/pos.
    if (
      this._isPedestalLikeProduct() &&
      !this._isKitchenBaseBuildContext() &&
      String(detailTypeId || '').trim().toLowerCase() === 'horizontal_top'
    ) {
      const parentW = Number(parentSection?.size?.x) || Number(size.x) || 0;
      if (parentW > 1) {
        size.x = parentW;
        if (item.pos == null || item.pos.x == null || item.pos.x === 0 || item.pos.x === '0') {
          pos.x = 0;
        }
      }
    }
    const thickness = this.getMaterialThickness(item.spec.material);
    const orientation = item.spec.orientation; // 'v' vertical, 'h' horizontal, 'f' front
    let geometry;
    this._invokeItemEvent(item, 'on_before_build', { parentSection, size, pos, thickness, orientation });

    // ⭐ Конструктор экспортирует size как @section.width/height/depth для ВСЕХ стен.
    // Для вертикальной/горизонтальной/фасадной стены тонкое измерение = thickness (16мм),
    // а не size из JSON. Как в EmbeddedClodisBuilder (конструктор).
    if (orientation === 'v') {
      // Вертикальная стена: thickness x height x depth (тонкое измерение по X)
      geometry = new THREE.BoxGeometry(thickness, size.y, size.z);
      this._dbg(`🔧🔧🔧 ВЕРТИКАЛЬНАЯ ДЕТАЛЬ: BoxGeometry(thickness=${thickness}, y=${size.y}, z=${size.z}) мм`);
    } else if (orientation === 'h') {
      // Горизонтальная стена: width x thickness x depth (тонкое измерение по Y)
      geometry = new THREE.BoxGeometry(size.x, thickness, size.z);
    } else if (orientation === 'f') {
      // Фронтальная стена: width x height x thickness (тонкое измерение по Z)
      geometry = new THREE.BoxGeometry(size.x, size.y, thickness);
    } else {
      // Default: use x, y, z as width, height, depth
      geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    }

    // Pivot вычисляем по размерам ГЕОМЕТРИИ (как в EmbeddedClodisBuilder)
    const geometrySizeForPivot = {
      x: geometry.parameters.width,
      y: geometry.parameters.height,
      z: geometry.parameters.depth
    };
    const pivot = this.evaluatePivot(item.pivot || {}, geometrySizeForPivot);

    try {
      if (/бок|дно|задн|фасад/i.test(wallName) && typeof window !== 'undefined' && window.__CLD_DEBUG_BUILDER === true) {
        const pSize = parentSection?.size || {};
        console.warn('[CLD][DRAWER-W] part', {
          name: wallName,
          orientation,
          parentName: parentSection?.name || '',
          parentSizeX: Number(pSize.x) || 0,
          parentSizeY: Number(pSize.y) || 0,
          parentSizeZ: Number(pSize.z) || 0,
          sizeExpr: item.size,
          posExpr: item.pos,
          evalSize: { x: size.x, y: size.y, z: size.z },
          thicknessMm: thickness,
          geomMm: geometrySizeForPivot,
          evalPos: { x: pos.x, y: pos.y, z: pos.z },
        });
      }
    } catch (_) {}

    // Базовый материал корпуса:
    // по умолчанию делаем его чисто белым, как Ikea‑корпус.
    let baseColor = 0xffffff;

    // Если в spec.material или в полях material_group/material_key задана группа/ключ — подбираем цвет:
    // g0 / ldsp      → корпус (белый/светлый)
    // g1 / hdf       → задняя стенка (светло-серый)
    // иначе остаётся базовый коричневый
    let matGroup = '';
    let matKey = '';
    if (item.spec && item.spec.material) {
      matGroup = (item.spec.material.group || '').toLowerCase();
      matKey = (item.spec.material.key || '').toLowerCase();
    } else {
      matGroup = (item.material_group || '').toLowerCase();
      matKey = (item.material_key || '').toLowerCase();
    }

    const templateMat =
      typeof window !== 'undefined' && typeof window.__cldIsTemplateMaterialPanel === 'function'
        ? window.__cldIsTemplateMaterialPanel(item)
        : matKey === 'material_3' || matKey === 'hdf' || matGroup === 'g1' || matGroup === 'hdf';
    const isBody = true;
    const roomMode = this._roomStep5Active();
    const roomInside = !templateMat && this._roomStep5InsideDecorActive();
    const itemDecorUrl = templateMat
      ? this._resolveWallItemExplicitDecorUrl(item) || this._resolveWallItemDecorUrlFromLib(item)
      : roomMode
        ? this._resolveWallItemExplicitDecorUrl(item)
        : this._resolveWallItemDecorUrl(item);
    const hasItemDecor = !!itemDecorUrl;
    const decorForBody = roomInside
      ? this.decorInside
      : hasItemDecor
        ? null
        : this.decorInside;
    const bodyTex = this._step5DecorTextureUrl(decorForBody);

    if (hasItemDecor) {
      baseColor = 0xffffff;
    } else if (bodyTex) {
      const previewHex = this._step5DecorPreviewColor(decorForBody);
      baseColor = previewHex
        ? new THREE.Color(previewHex).getHex()
        : 0xffffff;
    } else if (this._step5DecorHexFallback(decorForBody)) {
      baseColor = new THREE.Color(this._step5DecorHexFallback(decorForBody)).getHex();
    } else if (matGroup === 'g0' || matKey === 'ldsp' || matKey === 'material_2') {
      baseColor = 0xffffff;
    } else {
      baseColor = 0xffffff;
    }

    const material = new THREE.MeshStandardMaterial({
      color: baseColor,
      metalness: 0.0,
      roughness: 0.4,
    });
    // ХДФ задней стенки: не z-fight с текстурой комнаты (z≈0.5 мм) при примыкании к стене
    if (templateMat) {
      material.polygonOffset = true;
      material.polygonOffsetFactor = 1;
      material.polygonOffsetUnits = 2;
    }

    const texRepeatX =
      orientation === 'h' ? size.x : orientation === 'v' ? size.z : size.x;
    const texRepeatY =
      orientation === 'h' ? size.z : orientation === 'v' ? size.y : size.y;

    if (roomInside && bodyTex) {
      this._loadWallBodyTexture(material, bodyTex, texRepeatX, texRepeatY);
    } else if (hasItemDecor) {
      this._loadWallBodyTexture(material, itemDecorUrl, texRepeatX, texRepeatY);
    } else if (bodyTex) {
      this._loadWallBodyTexture(material, bodyTex, texRepeatX, texRepeatY);
    } else if (item.spec?.material?.texture) {
      this._loadWallBodyTexture(material, item.spec.material.texture, texRepeatX, texRepeatY);
    }

    // ХДФ / g1: кромки и материал только из шаблона, без шага 5
    const edges = templateMat
      ? item.edges && typeof item.edges === 'object'
        ? item.edges
        : {}
      : this._mergeItemEdgesWithStep5(item, 'inside');
    const getEdgeData = (i) => edges[i] || edges[String(i)] || {};
    const hasSelectedDecor = (ed) => !!(ed?.decor_id || ed?.decor_name || ed?.edge_id || ed?.edge_name);
    const parseEdgeThicknessMm = (ed) => {
      if (!ed) return 0;
      if (typeof ed.thickness === 'number' && Number.isFinite(ed.thickness)) return ed.thickness;
      const n = parseFloat(ed.thickness || '0.8');
      return Number.isFinite(n) ? n : 0.8;
    };

    const RoundedBoxGeometryGlobal =
      (typeof window !== 'undefined' && window.RoundedBoxGeometry) ? window.RoundedBoxGeometry : null;
    const parseHexColor = (c, fallback) => {
      if (typeof c !== 'string') return fallback;
      const m = /^#([0-9a-fA-F]{6})$/.exec(c.trim());
      if (!m) return fallback;
      return parseInt(m[1], 16);
    };

    const wOuter = geometry.parameters.width || 0;
    const hOuter = geometry.parameters.height || 0;
    const dOuter = geometry.parameters.depth || 0;

    // Edge insets and core offsets (constructor-clodis.js)
    let inset1 = 0, inset2 = 0, inset3 = 0, inset4 = 0;
    for (let i = 1; i <= 4; i++) {
      const ed = getEdgeData(i);
      const enabled = !!ed?.enabled;
      if (enabled && hasSelectedDecor(ed)) {
        const t = parseEdgeThicknessMm(ed);
        if (i === 1) inset1 = t;
        else if (i === 2) inset2 = t;
        else if (i === 3) inset3 = t;
        else inset4 = t;
      }
    }

    let coreW = wOuter, coreH = hOuter, coreD = dOuter;
    let ox = 0, oy = 0, oz = 0;
    if (inset1 || inset2 || inset3 || inset4) {
      if (orientation === 'v') {
        coreW = wOuter;
        coreH = Math.max(0.001, hOuter - inset1 - inset2);
        coreD = Math.max(0.001, dOuter - inset3 - inset4);
        ox = 0;
        oy = (inset1 - inset2) / 2;
        oz = (inset3 - inset4) / 2;
      } else if (orientation === 'h') {
        // Горизонталь (полка/дно): кромки 1/2 — перед/зад (Z), 3/4 — лево/право (X); Y = толщина плиты.
        coreW = Math.max(0.001, wOuter - inset3 - inset4);
        coreH = hOuter;
        coreD = Math.max(0.001, dOuter - inset1 - inset2);
        ox = (inset3 - inset4) / 2;
        oy = 0;
        oz = (inset1 - inset2) / 2;
      } else {
        // 'f' and default
        coreW = Math.max(0.001, wOuter - inset3 - inset4);
        coreH = Math.max(0.001, hOuter - inset1 - inset2);
        coreD = dOuter;
        ox = (inset3 - inset4) / 2;
        oy = (inset1 - inset2) / 2;
        oz = 0;
      }
    }

    const wallGroup = new THREE.Group();
    wallGroup.name = wallName;
    wallGroup.userData.isDetail = true;
    wallGroup.userData.detailType = item.type;
    wallGroup.userData.detailTypeId = detailTypeId;
    wallGroup.userData.detailName = wallName;
    wallGroup.userData.isBody = isBody;
    wallGroup.userData.cldUseTemplateMaterial = templateMat;
    if (isBody && !templateMat) wallGroup.userData.step5DecorChannel = 'inside';
    wallGroup.userData.originalSize = { ...size };
    wallGroup.userData.originalPosition = { ...pos };
    wallGroup.userData.originalPivot = { ...pivot };
    const _pv = item.pivot || {};
    const _npc = (v, d) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return d;
      if (n <= -0.5) return -1;
      if (n >= 0.5) return 1;
      return 0;
    };
    wallGroup.userData.__cldPivotCodes = {
      x: _npc(_pv.x, -1),
      y: _npc(_pv.y, -1),
      z: _npc(_pv.z, -1),
    };
    wallGroup.userData.own_object = wallGroup;
    wallGroup.userData.__cldPanelOrientation = orientation;
    wallGroup.userData.type = 'wall';
    wallGroup.config = wallGroup.config || {};
    wallGroup.config.type = 'wall';
    wallGroup.config.spec = { ...(wallGroup.config.spec || {}), orientation };
    wallGroup.calculated = {
      u_size: {
        x: geometry.parameters.width,
        y: geometry.parameters.height,
        z: geometry.parameters.depth,
        clone() {
          return new THREE.Vector3(this.x, this.y, this.z);
        },
      },
      size: {
        x: geometry.parameters.width,
        y: geometry.parameters.height,
        z: geometry.parameters.depth,
      },
    };
    // Схемы крепежа (Конфирмат и др.) для CFRN-экспорта
    if (Array.isArray(item.jointSchemes) && item.jointSchemes.length > 0) {
      wallGroup.userData.jointSchemes = item.jointSchemes;
    }

    // Core: острые углы (пила); радиус только на полосках кромки
    const coreGeometry = new THREE.BoxGeometry(coreW, coreH, coreD);
    const coreMesh = new THREE.Mesh(coreGeometry, material);
    coreMesh.castShadow = true;
    coreMesh.receiveShadow = true;
    coreMesh.name = wallName + '_core';
    coreMesh.visible = true;
    coreMesh.userData.isDetail = true;
    coreMesh.userData.detailType = item.type;
    coreMesh.userData.detailTypeId = detailTypeId;
    coreMesh.userData.detailName = wallName;
    coreMesh.userData.isBody = isBody;
    coreMesh.userData.cldUseTemplateMaterial = templateMat;
    if (isBody && !templateMat) coreMesh.userData.step5DecorChannel = 'inside';
    if (Array.isArray(item.jointSchemes) && item.jointSchemes.length > 0) {
      coreMesh.userData.jointSchemes = item.jointSchemes;
    }
    coreMesh.position.set(ox, oy, oz);
    wallGroup.userData.__cldCoreOffsetMm = { x: ox, y: oy, z: oz };
    coreMesh.userData.__cldNominalThicknessMm = thickness;
    coreMesh.userData.__cldPanelOrientation = orientation;
    const itemMatKey = String(
      item.material_key || item.spec?.material?.key || matKey || 'material_2'
    ).trim() || 'material_2';
    const itemMatId = item.material_id ?? item.materialId ?? item.spec?.material?.id;
    const step5MatId =
      !templateMat && roomInside && this.decorInside
        ? this.decorInside.material_id ?? this.decorInside.materialId
        : null;
    const exportMatId =
      templateMat && itemMatId != null && itemMatId !== ''
        ? itemMatId
        : step5MatId != null && step5MatId !== ''
          ? step5MatId
          : itemMatId;
    if (exportMatId != null && exportMatId !== '') {
      coreMesh.userData.catalogMaterialId = exportMatId;
      coreMesh.userData.catalogMaterialKey = itemMatKey;
      wallGroup.userData.catalogMaterialId = exportMatId;
      wallGroup.userData.catalogMaterialKey = itemMatKey;
      if (step5MatId != null) {
        coreMesh.userData.step5MaterialId = Number(step5MatId);
        wallGroup.userData.step5MaterialId = Number(step5MatId);
      }
    }
    if (hasItemDecor && (templateMat || !roomMode)) {
      coreMesh.userData.catalogMaterialFromItem = true;
      coreMesh.userData.catalogExplicitDecor = true;
      wallGroup.userData.catalogMaterialFromItem = true;
      wallGroup.userData.catalogExplicitDecor = true;
    }
    wallGroup.userData.__cldNominalThicknessMm = thickness;
    wallGroup.userData.__cldPanelOrientation = orientation;
    if (orientation === 'v') {
      wallGroup.userData.__cldCfrnSizeMm = { x: thickness, y: size.y, z: size.z };
    } else if (orientation === 'h') {
      wallGroup.userData.__cldCfrnSizeMm = { x: size.x, y: thickness, z: size.z };
    } else {
      wallGroup.userData.__cldCfrnSizeMm = { x: size.x, y: size.y, z: thickness };
    }
    {
      const butts = [];
      const edgeToElem = { 1: 0, 2: 2, 3: 3, 4: 1 };
      for (let edgeNum = 1; edgeNum <= 4; edgeNum++) {
        const ed = getEdgeData(edgeNum);
        const enabled = !!ed?.enabled;
        const hasSelected = hasSelectedDecor(ed);
        if (!enabled || !hasSelected) continue;
        const t = parseEdgeThicknessMm(ed);
        const edgeId = ed?.edge_id ?? ed?.decor_id ?? ed?.id ?? edgeNum;
        const edgeName = ed?.edge_name || ed?.decor_name || `Кромка ${edgeId}`;
        const edgeWidth = Number(ed?.width ?? ed?.height ?? 0) || 0;
        const thickMm = Number.isFinite(t) && t > 0 ? t : 0.5;
        const tKey = String(thickMm).replace('.', '_');
        butts.push({
          elemIndex: edgeToElem[edgeNum] ?? edgeNum - 1,
          thickness: thickMm,
          width: edgeWidth,
          buttType: 0,
          overhang: 0,
          allowance: 0,
          cutIndex: -1,
          clip: false,
          edgeCatalogId: edgeId,
          materialArt: `EDGE_${edgeId}_t${tKey}`,
          materialName: edgeName,
        });
      }
      if (butts.length) {
        coreMesh.userData.__cldButts = butts;
        wallGroup.userData.__cldButts = butts;
      }
    }
    coreMesh.userData.__cldCfrnSizeMm = wallGroup.userData.__cldCfrnSizeMm;
    coreMesh.userData.__cldPanelOrientation = orientation;
    wallGroup.add(coreMesh);

    // Debug: sanity check core geometry
    const geometrySize = {
      width: coreGeometry.parameters.width || 0,
      height: coreGeometry.parameters.height || 0,
      depth: coreGeometry.parameters.depth || 0
    };
    if (geometrySize.width < 0.001 || geometrySize.height < 0.001 || geometrySize.depth < 0.001) {
      console.error(`  ❌❌❌ ГЕОМЕТРИЯ ИМЕЕТ НУЛЕВОЙ РАЗМЕР! ❌❌❌`, {
        geometrySize,
        size,
        thickness,
        orientation
      });
    }

    this._dbg(`  ✅ Wall core created for "${wallName}"`, {
      geometryType: coreGeometry.type,
      vertices: coreGeometry.attributes.position.count,
      faces: coreGeometry.attributes.position.count / 3,
      size: { x: size.x + 'мм', y: size.y + 'мм', z: size.z + 'мм' },
      thickness: thickness + 'мм'
    });

    // Edge strips
    const makeEdgeGeom = (tw, th, td, edgeMm) => {
      const useRounded = !!RoundedBoxGeometryGlobal && edgeMm > 0 && edgeMm <= 2;
      if (useRounded) {
        try {
          const r = edgeMm;
          return new RoundedBoxGeometryGlobal(tw, th, td, 2, Math.max(r, 0.0001));
        } catch (_) {
          return new THREE.BoxGeometry(tw, th, td);
        }
      }
      return new THREE.BoxGeometry(tw, th, td);
    };

    const anyEdgeEnabled = Object.keys(edges).some((k) => getEdgeData(k)?.enabled);
    if (anyEdgeEnabled) {
      for (let edgeNum = 1; edgeNum <= 4; edgeNum++) {
        const ed = getEdgeData(edgeNum);
        const enabled = !!ed?.enabled;
        const hasSelected = hasSelectedDecor(ed);
        if (!enabled || !hasSelected) continue;

        const edgeMm = parseEdgeThicknessMm(ed);
        const edgeThickness = Math.max(edgeMm, 0.0001);
        const useRounded = !!RoundedBoxGeometryGlobal && edgeMm > 0 && edgeMm <= 2;
        const edgeGeomThickness = useRounded ? edgeThickness * 2 : edgeThickness;

        let edgeGeom = null;
        let edgePos = null;

        // Edge orientation mapping (constructor-clodis.js)
        if (orientation === 'v') {
          if (edgeNum === 1) {
            edgeGeom = makeEdgeGeom(wOuter, edgeGeomThickness, dOuter, edgeMm);
            edgePos = new THREE.Vector3(0, -hOuter / 2 + edgeGeomThickness / 2, 0);
          } else if (edgeNum === 2) {
            edgeGeom = makeEdgeGeom(wOuter, edgeGeomThickness, dOuter, edgeMm);
            edgePos = new THREE.Vector3(0, hOuter / 2 - edgeGeomThickness / 2, 0);
          } else if (edgeNum === 3) {
            edgeGeom = makeEdgeGeom(wOuter, hOuter, edgeGeomThickness, edgeMm);
            edgePos = new THREE.Vector3(0, 0, -dOuter / 2 + edgeGeomThickness / 2);
          } else if (edgeNum === 4) {
            edgeGeom = makeEdgeGeom(wOuter, hOuter, edgeGeomThickness, edgeMm);
            edgePos = new THREE.Vector3(0, 0, dOuter / 2 - edgeGeomThickness / 2);
          }
        } else if (orientation === 'h') {
          if (edgeNum === 1) {
            edgeGeom = makeEdgeGeom(wOuter, hOuter, edgeGeomThickness, edgeMm);
            edgePos = new THREE.Vector3(0, 0, -dOuter / 2 + edgeGeomThickness / 2);
          } else if (edgeNum === 2) {
            edgeGeom = makeEdgeGeom(wOuter, hOuter, edgeGeomThickness, edgeMm);
            edgePos = new THREE.Vector3(0, 0, dOuter / 2 - edgeGeomThickness / 2);
          } else if (edgeNum === 3) {
            edgeGeom = makeEdgeGeom(edgeGeomThickness, hOuter, dOuter, edgeMm);
            edgePos = new THREE.Vector3(-wOuter / 2 + edgeGeomThickness / 2, 0, 0);
          } else if (edgeNum === 4) {
            edgeGeom = makeEdgeGeom(edgeGeomThickness, hOuter, dOuter, edgeMm);
            edgePos = new THREE.Vector3(wOuter / 2 - edgeGeomThickness / 2, 0, 0);
          }
        } else {
          // 'f' and default
          if (edgeNum === 1) {
            edgeGeom = makeEdgeGeom(wOuter, edgeGeomThickness, dOuter, edgeMm);
            edgePos = new THREE.Vector3(0, -hOuter / 2 + edgeGeomThickness / 2, 0);
          } else if (edgeNum === 2) {
            edgeGeom = makeEdgeGeom(wOuter, edgeGeomThickness, dOuter, edgeMm);
            edgePos = new THREE.Vector3(0, hOuter / 2 - edgeGeomThickness / 2, 0);
          } else if (edgeNum === 3) {
            edgeGeom = makeEdgeGeom(edgeGeomThickness, hOuter, dOuter, edgeMm);
            edgePos = new THREE.Vector3(-wOuter / 2 + edgeGeomThickness / 2, 0, 0);
          } else if (edgeNum === 4) {
            edgeGeom = makeEdgeGeom(edgeGeomThickness, hOuter, dOuter, edgeMm);
            edgePos = new THREE.Vector3(wOuter / 2 - edgeGeomThickness / 2, 0, 0);
          }
        }

        if (!edgeGeom || !edgePos) continue;

        this._cldNudgeEdgeTowardCore(edgeNum, edgePos, 0.06, orientation);

        const useBodyMaterial = this._shouldUseBodyMaterialForCorpusEdge(ed, roomInside);
        const edgeMat = useBodyMaterial
          ? this._cloneMaterialSafeForEdges(material)
          : this._buildRoomEdgeMaterial(ed, wOuter, hOuter, {
              bodyDecorFallback: roomInside ? this.decorInside : null,
              bodyDecorSync: false,
            });

        const edgeMesh = new THREE.Mesh(edgeGeom, edgeMat);
        edgeMesh.position.copy(edgePos);
        edgeMesh.renderOrder = 10;
        edgeMesh.userData.isEdge = true;
        edgeMesh.userData.edgeNumber = edgeNum;
        if (roomInside) {
          edgeMesh.userData.cldCorpusBodyEdge = true;
          edgeMesh.userData.step5DecorChannel = 'inside';
        }
        if (useBodyMaterial) {
          edgeMesh.userData.cldClonedBodyMaterial = true;
        }
        wallGroup.add(edgeMesh);
      }
      this._syncCorpusEdgeStripsToCoreMaterial(wallGroup, roomInside);
    }

    // Apply transform to the whole wall group (в slide-аниматоре — BLB + conv_pivot на детях).
    const rawPivotObj = item.pivot && typeof item.pivot === 'object' ? item.pivot : { x: -1, y: -1, z: -1 };
    wallGroup.userData._cldBlbPivotRaw = {
      x: Number(rawPivotObj.x ?? -1),
      y: Number(rawPivotObj.y ?? -1),
      z: Number(rawPivotObj.z ?? -1),
    };
    if (this._isBlbDirectBuildContext(parentSection)) {
      this._applyBlbGroupTransformWithContentPivot(wallGroup, pos, pivot, item.rot || {}, item.pivot || {});
    } else {
      this.applyTransform(wallGroup, pos, pivot, item.rot || {});
    }
    this._dbg(`  📍 Transform applied for "${wallName}"`, {
      position: { x: wallGroup.position.x + 'мм', y: wallGroup.position.y + 'мм', z: wallGroup.position.z + 'мм' },
    });

    // Build children (furniture / path attached to wall)
    let furnitureCount = 0;
    if (item.children && Array.isArray(item.children)) {
      this._dbg(`  🔍 Wall "${wallName}": обработка ${item.children.length} children`);
      // Стыковой крепёж: локаль панели (type/size/parent), не секции корпуса.
      const wallChildCtx = {
        ...(parentSection && typeof parentSection === 'object' ? parentSection : {}),
        type: 'wall',
        parentType: 'wall',
        size: { x: size.x, y: size.y, z: size.z },
        variables: this.variables,
        groups: this.groups,
        parent: wallGroup,
        layoutRole: parentSection?.layoutRole || '',
        wallThickness: thickness,
        rootSection: parentSection?.rootSection || parentSection,
        _cldSectionContext: parentSection,
      };
      item.children.forEach(child => {
        if (this._isPhantomJointFittingWallItem(child)) {
          this._dbg(`  ⏭️ Пропуск фантомного крепежа "${child?.name || ''}" (jointSchemes на родителе)`);
          return;
        }
        const childType = String(child?.type || '').toLowerCase();
        if (childType === 'path' || childType === 'groove') {
          this._applyPathGrooveToWall(wallGroup, coreMesh, child, parentSection);
          furnitureCount++;
          return;
        }
        const built = this.buildItem(child, wallChildCtx);
        if (built) {
          const isJointChild =
            !!child?.fromJointScheme ||
            Number(child?.spec?.joint_template_frame) === 1 ||
            Number(child?.spec?.joint_template_model) === 1 ||
            Number(child?.spec?.joint_hardware) === 1;
          // Стык: host-local уже в group.position — BLB-offset не добавляем.
          if (!isJointChild) {
            this._applyStoredBlbContentOffsetToChild(wallGroup, built);
          }
          this._stampJointSchemeUserData(built, child);
          wallGroup.add(built);
          furnitureCount++;
        }
      });
    }

    // Петли — строим как в рефе (Door_new.build_hinges) для фасадных деталей
    const isFacade = orientation === 'f' ||
      String(item.originalType || '').toLowerCase() === 'facade' ||
      String(item.name || '').toLowerCase().includes('фасад');
    if (isFacade && Array.isArray(item.accessories) && item.accessories.length) {
      const hingeAccWall = item.accessories.find(
        (a) => a && (String(a.id || '').includes('hinge') || (a.name || '').toLowerCase().includes('петл'))
      );
      if (!this._useCatalogHingeModulesInRoom()) {
        this._buildHingesForFacade(wallGroup, item, parentSection);
      }
      if (hingeAccWall) {
        this._setupDoorSwingGroupIfHinge(wallGroup, hingeAccWall, item, { panelOnly: true }, parentSection);
      }
    }

    this._dbg(`✅ Wall "${wallName}" created: orientation=${orientation}, size=(${size.x}, ${size.y}, ${size.z})мм, thickness=${thickness}мм, furniture=${furnitureCount}`);
    this._invokeItemEvent(item, 'on_after_build', { parentSection, target: wallGroup, size, pos, thickness, orientation });

    return wallGroup;
  }

  _isBlbDirectBuildContext(parentSection) {
    return !!(
      parentSection &&
      (parentSection.slideAnimatorLocalBuild ||
        parentSection.hingeModuleLocalBuild ||
        parentSection.facadeThinShell)
    );
  }

  /** BLB на узле (pos), смещение геометрии −evaluatePivot на прямых детях — как buildFacade / applyTransform. */
  _applyBlbGroupTransformWithContentPivot(group, pos, pivot, rot, rawPivotObj) {
    group.position.set(Number(pos?.x) || 0, Number(pos?.y) || 0, Number(pos?.z) || 0);
    const rotObj = rot && typeof rot === 'object' ? rot : {};
    if (rotObj.x) group.rotation.x = this.parseRotation(rotObj.x);
    if (rotObj.y) group.rotation.y = this.parseRotation(rotObj.y);
    if (rotObj.z) group.rotation.z = this.parseRotation(rotObj.z);
    const pv = rawPivotObj && typeof rawPivotObj === 'object' ? rawPivotObj : {};
    group.userData._cldBlbPivotRaw = {
      x: Number(pv.x ?? -1),
      y: Number(pv.y ?? -1),
      z: Number(pv.z ?? -1),
    };
    const ox = -(Number(pivot?.x) || 0);
    const oy = -(Number(pivot?.y) || 0);
    const oz = -(Number(pivot?.z) || 0);
    group.userData._cldBlbContentOffset = { x: ox, y: oy, z: oz };
    for (const child of group.children) {
      child.position.x += ox;
      child.position.y += oy;
      child.position.z += oz;
    }
  }

  /**
   * Дети стены/фасада (fromJointScheme конфирмат/эксцентр), добавленные ПОСЛЕ
   * _applyBlbGroupTransformWithContentPivot, иначе остаются в center-frame, а mesh уже +size/2 —
   * ящик визуально «уезжает» на половину ширины, крепёж «на месте», CFRN теряет контакт.
   */
  _applyStoredBlbContentOffsetToChild(parentGroup, childObj) {
    if (!parentGroup || !childObj) return;
    const off = parentGroup.userData?._cldBlbContentOffset;
    if (!off || typeof off !== 'object') return;
    const ox = Number(off.x) || 0;
    const oy = Number(off.y) || 0;
    const oz = Number(off.z) || 0;
    if (!ox && !oy && !oz) return;
    childObj.position.x += ox;
    childObj.position.y += oy;
    childObj.position.z += oz;
  }

  // Build facade (door, panel)
  buildFacade(item, parentSection) {
    const facadeName = item.name || 'facade';
    this._invokeItemEvent(item, 'on_before_params', { parentSection });
    
    this._dbg(`🚪 buildFacade: начало создания "${facadeName}"`);
    this._dbg(`  📋 Параметры:`, {
      size: item.size,
      pos: item.pos,
      pivot: item.pivot,
      hasSpec: !!item.spec,
      spec: item.spec
    });
    
    const size = this.evaluateSize(item.size || {}, parentSection);
    let pos = this.evaluatePosition(item.pos || {}, parentSection, size);
    const posFromJson = { ...pos };
    const parentDepthMm = Number(parentSection?.size?.z);
    const thinShell =
      this._isThinFacadeShellDepth(parentDepthMm) ||
      this._isRoomFacadePanelContext(parentSection) ||
      !!(parentSection && parentSection.facadeThinShell);
    const inSlideAnimator = !!(parentSection && parentSection.slideAnimatorLocalBuild);
    const rotX = parseFloat(item.rot?.x || '0');
    const isTopFacade = rotX === 90;
    const authoredInset = this._facadePanelHasAuthoredInset(item);
    const insetGapMm = this._resolveRefFacadePanelInsetMm();
    const posBeforeInset = { x: pos.x, y: pos.y, z: pos.z };
    const sizeBeforeInset = { x: size.x, y: size.y, z: size.z };
    let refInsetApplied = false;
    if (
      thinShell &&
      this._isRoomFacadePanelContext(parentSection) &&
      !isTopFacade &&
      !authoredInset
    ) {
      this._applyRefFacadePanelInsetMm(pos, size, insetGapMm);
      refInsetApplied = true;
    }
    const thicknessMm = this._resolveFacadeThicknessMm(item, size);
    const geometrySizeForPivot = { x: size.x, y: size.y, z: thicknessMm };
    const pivot = this.evaluatePivot(item.pivot || {}, geometrySizeForPivot);
    if (thinShell && !inSlideAnimator) {
      pos.z = 0;
    }
    this._invokeItemEvent(item, 'on_before_build', {
      parentSection,
      size,
      pos,
      pivot,
      thickness: thicknessMm,
    });

    if (this._isHingeCatalogDrillPlaceholderItem(item, parentSection)) {
      const empty = new THREE.Group();
      empty.name = facadeName;
      empty.userData.isDrillPlaceholder = true;
      this.applyTransform(empty, pos, pivot, item.rot || {});
      this._invokeItemEvent(item, 'on_after_build', { parentSection, target: empty, size, pos, pivot });
      return empty;
    }

    this._dbg(`🚪 Facade "${facadeName}" вычисленные значения:`, {
      size: { x: size.x + 'мм', y: size.y + 'мм', z: size.z + 'мм' },
      pos: { x: pos.x + 'мм', y: pos.y + 'мм', z: pos.z + 'мм' },
      pivot: { x: pivot.x + 'мм', y: pivot.y + 'мм', z: pivot.z + 'мм' },
      thickness: thicknessMm + 'мм'
    });

    // Edges: build decorative edge strips in room view to match constructor preview
    // Ported from constructor-clodis.js
    let edges = this._mergeItemEdgesWithStep5(item, 'outside');
    if (this.unifiedFacade) {
      const topEdges =
        item.__cldUnifiedFacadeTopEdges || this._unifiedFacadeModuleMeta?.topEdges;
      if (topEdges && typeof topEdges === 'object') {
        const merged = { ...edges };
        const topStrip = topEdges[2] || topEdges['2'];
        if (topStrip) merged[2] = { ...topStrip };
        edges = merged;
      }
    }
    const getEdgeData = (i) => edges[i] || edges[String(i)] || {};
    const hasSelectedDecor = (ed) => !!(ed?.decor_id || ed?.decor_name || ed?.edge_id || ed?.edge_name);
    const parseEdgeThicknessMm = (ed) => {
      if (!ed) return 0;
      if (typeof ed.thickness === 'number' && Number.isFinite(ed.thickness)) return ed.thickness;
      const n = parseFloat(ed.thickness || '0.8');
      return Number.isFinite(n) ? n : 0.8;
    };

    // Facade edge orientation is frontal (f): 1 bottom, 2 top, 3 left, 4 right
    const w = size.x;
    const h = size.y;
    const d = thicknessMm;

    // Inset thickness per edge (used to shrink core panel)
    let inset1 = 0, inset2 = 0, inset3 = 0, inset4 = 0;
    for (let i = 1; i <= 4; i++) {
      const ed = getEdgeData(i);
      const enabled = !!ed?.enabled;
      if (enabled && hasSelectedDecor(ed)) {
        const t = parseEdgeThicknessMm(ed);
        if (i === 1) inset1 = t;
        else if (i === 2) inset2 = t;
        else if (i === 3) inset3 = t;
        else inset4 = t;
      }
    }
    const hasAnyInset = inset1 > 0 || inset2 > 0 || inset3 > 0 || inset4 > 0;

    // Цвет фасада: декор шага 5 (outside) или материал из item
    const outsideTex = this._step5DecorTextureUrl(this.decorOutside);
    const outsideHex = this._step5DecorHexFallback(this.decorOutside);
    let facadeColor = 0xffffff;
    if (this.decorOutside) {
      if (!outsideTex && outsideHex) {
        facadeColor = new THREE.Color(outsideHex).getHex();
      } else if (outsideTex) {
        const previewHex = this._step5DecorPreviewColor(this.decorOutside);
        if (previewHex) facadeColor = new THREE.Color(previewHex).getHex();
      }
    } else if (item.spec && item.spec.material) {
      facadeColor = 0x654321;
      const mat = item.spec.material;
      const group = (mat.group || '').toLowerCase();
      const key = (mat.key || '').toLowerCase();

      if (group === 'g2') {
        facadeColor = 0x5a3a1a;
      }
    }

    const material = new THREE.MeshStandardMaterial({
      color: facadeColor,
      metalness: 0.2,
      roughness: 0.7,
    });

    // Текстура декора шага 5 (фасад) — только из карточки material_2, без подмешивания hex колеса
    if (outsideTex) {
      this._applyDecorTextureToMaterial(material, outsideTex, (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        const texWidth = 1000;
        const texHeight = 1000;
        texture.repeat.set(size.x / texWidth, size.y / texHeight);
      });
    }

    // Build facade core + edge strips inside a group (so applyTransform doesn't wipe local offsets)
    const facadeGroup = new THREE.Group();
    facadeGroup.name = facadeName;
    facadeGroup.userData.isFacade = true;
    facadeGroup.userData.isBody = false;
    // Как wall: isDetail + pivot — иначе detectToretsAgainstPlast не видит фасад ящика.
    facadeGroup.userData.isDetail = true;
    facadeGroup.userData.detailType = 'facade';
    facadeGroup.userData.type = 'facade';
    /** Шаг 5: канал декора `outside` (фасад), не путать с «внешним кольцом» SVG — кольца — только палитры */
    facadeGroup.userData.step5DecorChannel = 'outside';
    facadeGroup.userData.facadeThicknessMm = thicknessMm;
    this._facadeHingeContext = this._facadeHingeContext || {
      layoutRole: '',
      catalogHingeLayoutId: null,
      catalogHingeModulesApplied: false,
      catalogHingeModulesInTree: false,
    };
    this._facadeHingeContext.facadeThicknessMm = thicknessMm;
    // Габарит фасада в мм (нужен для петель и для аниматора rotate без accessories)
    facadeGroup.userData.originalSize = { x: size.x, y: size.y, z: thicknessMm };
    facadeGroup.userData._cldFacadeBuildItem = item;
    facadeGroup.userData._cldFacadeBuildParent = parentSection;
    facadeGroup.userData.layoutRole = this._normalizeLayoutRoleKey(parentSection?.layoutRole || '');
    facadeGroup.userData.__cldCfrnSizeMm = { x: w, y: h, z: d };
    facadeGroup.userData.__cldPanelOrientation = 'f';
    facadeGroup.userData.__cldNominalThicknessMm = thicknessMm;
    facadeGroup.config = facadeGroup.config || {};
    facadeGroup.config.type = 'facade';
    facadeGroup.config.spec = { ...(facadeGroup.config.spec || {}), orientation: 'f' };
    {
      const _pv = item.pivot || {};
      const _npc = (v, d) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return d;
        if (n <= -0.5) return -1;
        if (n >= 0.5) return 1;
        return 0;
      };
      facadeGroup.userData.__cldPivotCodes = {
        x: _npc(_pv.x, -1),
        y: _npc(_pv.y, -1),
        z: _npc(_pv.z, -1),
      };
    }
    facadeGroup.userData.own_object = facadeGroup;
    facadeGroup.calculated = {
      u_size: {
        x: w,
        y: h,
        z: d,
        clone() {
          return new THREE.Vector3(this.x, this.y, this.z);
        },
      },
      size: { x: w, y: h, z: d },
    };
    if (Array.isArray(item.jointSchemes) && item.jointSchemes.length > 0) {
      facadeGroup.userData.jointSchemes = item.jointSchemes;
    }
    facadeGroup.userData._cldDoorBuildDiag = {
      name: facadeName,
      jsonPos: item.pos ? { ...item.pos } : {},
      jsonSize: item.size ? { ...item.size } : {},
      posBeforeInset,
      sizeBeforeInset,
      appliedPos: { x: pos.x, y: pos.y, z: pos.z },
      appliedSize: { x: size.x, y: size.y, z: size.z },
      refInsetApplied,
      authoredInset,
      insetGapMm,
      thinShell,
      isTopFacade,
      parentDepthMm,
      layoutRole: parentSection?.layoutRole || '',
      parentName: parentSection?.name || '',
    };
    const _px = item.pivot && item.pivot.x;
    facadeGroup.userData._cldPivotXSgn = _px === 1 ? 1 : -1;

    let coreMesh = null;
    let ox = 0, oy = 0;
    let coreW = w;
    let coreH = h;
    if (hasAnyInset) {
      coreW = Math.max(0.001, w - inset3 - inset4);
      coreH = Math.max(0.001, h - inset1 - inset2);
      ox = (inset3 - inset4) / 2;
      oy = (inset1 - inset2) / 2;
      const coreGeometry = new THREE.BoxGeometry(coreW, coreH, d);
      coreMesh = new THREE.Mesh(coreGeometry, material);
      coreMesh.castShadow = true;
      coreMesh.receiveShadow = true;
      coreMesh.name = facadeName + '_core';
      coreMesh.userData.isFacade = true;
      coreMesh.userData.step5DecorChannel = 'outside';
      coreMesh.position.set(ox, oy, 0);
    } else {
      const coreGeometry = new THREE.BoxGeometry(w, h, d);
      coreMesh = new THREE.Mesh(coreGeometry, material);
      coreMesh.castShadow = true;
      coreMesh.receiveShadow = true;
      coreMesh.name = facadeName + '_core';
      coreMesh.userData.isFacade = true;
      coreMesh.userData.step5DecorChannel = 'outside';
    }

    {
      const butts = [];
      const edgeToElem = { 1: 0, 2: 2, 3: 3, 4: 1 };
      for (let edgeNum = 1; edgeNum <= 4; edgeNum++) {
        const ed = getEdgeData(edgeNum);
        const enabled = !!ed?.enabled;
        if (!enabled || !hasSelectedDecor(ed)) continue;
        const t = parseEdgeThicknessMm(ed);
        const edgeId = ed?.edge_id ?? ed?.decor_id ?? ed?.id ?? edgeNum;
        const edgeName = ed?.edge_name || ed?.decor_name || `Кромка ${edgeId}`;
        const edgeWidth = Number(ed?.width ?? ed?.height ?? 0) || 0;
        const thickMm = Number.isFinite(t) && t > 0 ? t : 0.5;
        const tKey = String(thickMm).replace('.', '_');
        butts.push({
          elemIndex: edgeToElem[edgeNum] ?? edgeNum - 1,
          thickness: thickMm,
          width: edgeWidth,
          buttType: 0,
          overhang: 0,
          allowance: 0,
          cutIndex: -1,
          clip: false,
          edgeCatalogId: edgeId,
          materialArt: `EDGE_${edgeId}_t${tKey}`,
          materialName: edgeName,
        });
      }
      if (butts.length) {
        coreMesh.userData.__cldButts = butts;
        facadeGroup.userData.__cldButts = butts;
      }
    }
    coreMesh.userData.__cldCfrnSizeMm = facadeGroup.userData.__cldCfrnSizeMm;
    coreMesh.userData.__cldPanelOrientation = 'f';
    coreMesh.userData.__cldNominalThicknessMm = thicknessMm;
    coreMesh.userData.isDetail = true;
    coreMesh.userData.detailType = 'facade';
    if (Array.isArray(item.jointSchemes) && item.jointSchemes.length > 0) {
      coreMesh.userData.jointSchemes = item.jointSchemes;
    }

    const facadeMatKey = String(
      item.material_key || item.spec?.material?.key || 'material_2',
    ).trim() || 'material_2';
    const step5FacadeMatId =
      this.decorOutside?.material_id ?? this.decorOutside?.materialId ?? null;
    if (step5FacadeMatId != null && step5FacadeMatId !== '') {
      coreMesh.userData.catalogMaterialId = step5FacadeMatId;
      coreMesh.userData.catalogMaterialKey = facadeMatKey;
      coreMesh.userData.step5MaterialId = Number(step5FacadeMatId);
      facadeGroup.userData.catalogMaterialId = step5FacadeMatId;
      facadeGroup.userData.catalogMaterialKey = facadeMatKey;
      facadeGroup.userData.step5MaterialId = Number(step5FacadeMatId);
    }

    facadeGroup.add(coreMesh);

    // Edge strips (rounded where possible)
    const RoundedBoxGeometryGlobal =
      (typeof window !== 'undefined' && window.RoundedBoxGeometry) ? window.RoundedBoxGeometry : null;
    const makeEdgeGeom = (tw, th, td, edgeMm) => {
      const useRounded = !!RoundedBoxGeometryGlobal && edgeMm > 0 && edgeMm <= 2;
      if (useRounded) {
        try {
          const r = edgeMm;
          return new RoundedBoxGeometryGlobal(tw, th, td, 2, Math.max(r, 0.0001));
        } catch (_) {
          return new THREE.BoxGeometry(tw, th, td);
        }
      }
      return new THREE.BoxGeometry(tw, th, td);
    };

    const parseHexColor = (c, fallback) => {
      if (typeof c !== 'string') return fallback;
      const m = /^#([0-9a-fA-F]{6})$/.exec(c.trim());
      if (!m) return fallback;
      return parseInt(m[1], 16);
    };

    for (let edgeNum = 1; edgeNum <= 4; edgeNum++) {
      const ed = getEdgeData(edgeNum);
      const enabled = !!ed?.enabled;
      if (!enabled || !hasSelectedDecor(ed)) continue;

      const edgeMm = parseEdgeThicknessMm(ed);
      const edgeThickness = Math.max(edgeMm, 0.0001);

      const useRounded = !!RoundedBoxGeometryGlobal && edgeMm > 0 && edgeMm <= 2;
      const edgeGeomThickness = useRounded ? edgeThickness * 2 : edgeThickness;

      let edgeGeom = null;
      let edgePos = null;

      // orientation 'f': 1 bottom, 2 top, 3 left, 4 right
      if (edgeNum === 1) {
        edgeGeom = makeEdgeGeom(w, edgeGeomThickness, d, edgeMm);
        edgePos = new THREE.Vector3(0, -h / 2 + edgeGeomThickness / 2, 0);
      } else if (edgeNum === 2) {
        edgeGeom = makeEdgeGeom(w, edgeGeomThickness, d, edgeMm);
        edgePos = new THREE.Vector3(0, h / 2 - edgeGeomThickness / 2, 0);
      } else if (edgeNum === 3) {
        edgeGeom = makeEdgeGeom(edgeGeomThickness, h, d, edgeMm);
        edgePos = new THREE.Vector3(-w / 2 + edgeGeomThickness / 2, 0, 0);
      } else if (edgeNum === 4) {
        edgeGeom = makeEdgeGeom(edgeGeomThickness, h, d, edgeMm);
        edgePos = new THREE.Vector3(w / 2 - edgeGeomThickness / 2, 0, 0);
      }

      if (!edgeGeom || !edgePos) continue;

      this._cldNudgeEdgeTowardCore(edgeNum, edgePos, 0.06, 'f');

      const edgeMat = this._buildRoomEdgeMaterial(ed, w, h, {
        decorFallback: this.decorOutside,
        facadeRoughness: 0.7,
        facadeMetalness: 0.2,
      });

      const edgeMesh = new THREE.Mesh(edgeGeom, edgeMat);
      edgeMesh.position.copy(edgePos);
      edgeMesh.renderOrder = 10;
      edgeMesh.userData.isEdge = true;
      edgeMesh.userData.edgeNumber = edgeNum;
      edgeMesh.userData.cldFacadeEdgeStrip = true;

      facadeGroup.add(edgeMesh);
    }

    // BLB: тонкая оболочка фасада шкафа (z=0) или slide-ящик (pos.z из JSON, напр. s:z-16).
    if (thinShell || inSlideAnimator) {
      facadeGroup.position.set(
        Number(pos.x) || 0,
        Number(pos.y) || 0,
        Number(pos.z) || 0
      );
      const rotEarly = item.rot || {};
      if (rotEarly.x) facadeGroup.rotation.x = this.parseRotation(rotEarly.x);
      if (rotEarly.y) facadeGroup.rotation.y = this.parseRotation(rotEarly.y);
      if (rotEarly.z) facadeGroup.rotation.z = this.parseRotation(rotEarly.z);
      const ox = -pivot.x;
      const oy = -pivot.y;
      const oz = -pivot.z;
      const rawPv = item.pivot || {};
      facadeGroup.userData._cldBlbPivotRaw = {
        x: Number(rawPv.x ?? -1),
        y: Number(rawPv.y ?? -1),
        z: Number(rawPv.z ?? -1),
      };
      facadeGroup.userData._cldBlbContentOffset = { x: ox, y: oy, z: oz };
      for (const child of facadeGroup.children) {
        child.position.x += ox;
        child.position.y += oy;
        child.position.z += oz;
      }
    }

    this._dbg(`  ✅ Mesh создан для "${facadeName}":`, {
      geometryType: coreMesh?.geometry?.type || 'unknown',
      vertices: coreMesh?.geometry?.attributes?.position?.count || 0
    });

    // Петли — как build_hinges в рефе
    if (Array.isArray(item.accessories) && item.accessories.length) {
      const hingeAcc = item.accessories.find(a =>
        a && (String(a.id || '').includes('hinge') || (a.name || '').toLowerCase().includes('петл'))
      );
      if (hingeAcc) {
        this._facadeHingeContext = this._facadeHingeContext || {
          layoutRole: '',
          catalogHingeLayoutId: null,
          catalogHingeModulesApplied: false,
          catalogHingeModulesInTree: false,
        };
        const doorH =
          Number(facadeGroup.userData?.originalSize?.y) ||
          Number(parentSection?.size?.y) ||
          0;
        const mergedHingeAcc =
          doorH > 0
            ? this._mergeHingeAccessoryFromLayoutScheme(hingeAcc, item, doorH)
            : hingeAcc;
        this._applyHingeDrillTemplateIdsToFacadeContext({
          facade: Number(mergedHingeAcc.hingeFacadeDrillTemplateId) || 0,
          door: Number(mergedHingeAcc.hingeDoorDrillTemplateId) || 0,
        });
        if (!this._useCatalogHingeModulesInRoom()) {
          this._buildHingesForFacade(facadeGroup, item, parentSection);
        }
        this._setupDoorSwingGroupIfHinge(facadeGroup, hingeAcc, item, {}, parentSection);
      }
    }

    if (!thinShell && !inSlideAnimator) {
      this.applyTransform(facadeGroup, pos, pivot, item.rot || {});
    }

    // Крепёж / модели на фасаде ящика (эксцентры fromJointScheme) — тот же BLB-offset, что у core.
    if (item.children && Array.isArray(item.children)) {
      const facadeChildCtx = {
        ...(parentSection && typeof parentSection === 'object' ? parentSection : {}),
        type: 'wall',
        parentType: 'wall',
        size: { x: size.x, y: size.y, z: thicknessMm },
        variables: this.variables,
        groups: this.groups,
        parent: facadeGroup,
        layoutRole: parentSection?.layoutRole || '',
        facadeThicknessOffset: 0,
        rootSection: parentSection?.rootSection || parentSection,
        slideAnimatorLocalBuild: !!(parentSection && parentSection.slideAnimatorLocalBuild),
        hingeModuleLocalBuild: !!(parentSection && parentSection.hingeModuleLocalBuild),
        facadeThinShell: !!(thinShell || (parentSection && parentSection.facadeThinShell)),
        _cldSectionContext: parentSection,
      };
      item.children.forEach((child) => {
        if (this._isPhantomJointFittingWallItem(child)) return;
        const childType = String(child?.type || '').toLowerCase();
        if (childType === 'path' || childType === 'groove') return;
        const built = this.buildItem(child, facadeChildCtx);
        if (!built) return;
        const isJointChild =
          !!child?.fromJointScheme ||
          Number(child?.spec?.joint_template_frame) === 1 ||
          Number(child?.spec?.joint_template_model) === 1 ||
          Number(child?.spec?.joint_hardware) === 1;
        if (!isJointChild) {
          this._applyStoredBlbContentOffsetToChild(facadeGroup, built);
        }
        this._stampJointSchemeUserData(built, child);
        facadeGroup.add(built);
      });
    }

    this._logFacadePanelPlacement('buildFacade', facadeGroup);

    if (thinShell || this._facadeZDbgEnabled()) {
      this._facadeZLog('buildFacade', {
        name: facadeName,
        thinShell,
        parentDepthMm,
        thicknessMm,
        posFromJson,
        posApply: { ...pos },
        pivot,
        blbOffset: facadeGroup.userData._cldBlbContentOffset || null,
        groupPosZ: facadeGroup.position.z,
        panelBackZLocal: facadeGroup.position.z - thicknessMm / 2,
      });
    }

    this._dbg(`  📍 Transform применен для "${facadeName}":`, {
      position: { x: facadeGroup.position.x.toFixed(3), y: facadeGroup.position.y.toFixed(3), z: facadeGroup.position.z.toFixed(3) }
    });

    this._finalizeFacadeHandleAfterBuild(facadeGroup, item, parentSection, size, thicknessMm);

    this._dbg(`✅ Facade "${facadeName}" создан: size=(${size.x}, ${size.y}, ${size.z})мм, thickness=${thicknessMm}мм`);
    this._invokeItemEvent(item, 'on_after_build', { parentSection, target: facadeGroup, size, pos, pivot, thickness: thicknessMm });

    return facadeGroup;
  }

  _removeAttachedFacadeHandle(facadeGroup) {
    if (!facadeGroup) return;
    const dispose = (prev) => {
      if (!prev) return;
      prev.parent?.remove(prev);
      prev.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => m?.dispose?.());
        }
      });
    };
    const stripHandles = (parent) => {
      if (!parent || !Array.isArray(parent.children)) return;
      for (let i = parent.children.length - 1; i >= 0; i--) {
        const ch = parent.children[i];
        if (ch && String(ch.name || '').startsWith('__cld_facade_handle')) dispose(ch);
      }
    };
    const swing = facadeGroup.getObjectByName('__door_swing');
    stripHandles(swing || facadeGroup);
    stripHandles(facadeGroup);
  }

  /**
   *
   * Ориентация модели:
   * - Каталог: mesh всегда вертикальный (длина по Y).
   * - vertical: scaleHandleToCatalogMm + rot из cabinet_model (админка).
   * - horizontal: тот же масштаб, затем applyRoomHandleOrientationFromVerticalCatalog (−90° Z).
   */
  _finalizeFacadeHandleAfterBuild(facadeGroup, item, parentSection, size, thicknessMm) {
    const rt = typeof window !== 'undefined' ? window.__cldHandleRuntime : null;
    const log = rt?.handleLog || ((step, data) => {
      if (typeof window !== 'undefined' && window.DEBUG_HANDLE_ROOM === true) {
        console.log('[CLD][HANDLE] ' + step, data ?? '');
      }
    });
    if (!facadeGroup) {
      log('buildFacade skip', { reason: 'no_facade_group' });
      return;
    }
    if (this._isDrawerBandFacadeTreeNode(item, parentSection)) {
      log('buildFacade skip', {
        reason: 'drawer_front_handles_via_drawer_attach',
        facade: facadeGroup.name,
      });
      return;
    }
    if (this._isFacadeInsideDrawerAssembly(facadeGroup)) {
      log('buildFacade skip', {
        reason: 'drawer_assembly_no_facade_handle',
        facade: facadeGroup.name,
      });
      return;
    }
    if (!this._shouldAttachHandleOnFacade(facadeGroup, parentSection)) {
      log('buildFacade skip', {
        reason: 'not_room_facade_context',
        facade: facadeGroup.name,
        moduleDepth: this._catalogModuleBuildDepth || 0,
        productKind: this.productKind || null,
        hasLayoutZones: !!this.layoutZones,
        parentLayoutRole: parentSection?.layoutRole || '',
      });
      return;
    }
    const loader = typeof window !== 'undefined' ? window.__cldRoomCabinetModels : null;
    if (!rt || !loader?.resolveCabinetModel) {
      log('buildFacade skip', { reason: 'runtime_or_loader_missing', hasRt: !!rt, hasLoader: !!loader?.resolveCabinetModel });
      return;
    }
    if (!rt.isHandleEnabledOnFacade(item)) {
      log('buildFacade skip', {
        reason: 'handle_disabled_on_facade',
        facade: facadeGroup.name,
        handleSpec: item?.spec?.handle ?? null,
        noHandleForced: !!(item?.no_handle_forced || item?.spec?.no_handle),
      });
      return;
    }
    if (rt.shouldAttachHandlesInRoom && !rt.shouldAttachHandlesInRoom()) {
      this._removeAttachedFacadeHandle(facadeGroup);
      log('buildFacade skip', {
        reason: 'room_step_before_6',
        facade: facadeGroup.name,
        currentRoomStep: typeof window !== 'undefined' ? window.currentRoomStep : null,
      });
      return;
    }

    const sel = rt.readSelection();
    const productKind = this.productKind || 'wardrobe';
    const wEarly =
      Number(facadeGroup.userData?.originalSize?.x) ||
      Number(size?.x) ||
      0;
    const hEarly =
      Number(facadeGroup.userData?.originalSize?.y) ||
      Number(size?.y) ||
      0;
    const layoutRole = this._normalizeLayoutRoleKey(
      parentSection?.layoutRole ||
        facadeGroup.userData?.layoutRole ||
        facadeGroup.userData?._cldRoomDoorOffsetRole ||
        ''
    );
    const doorFn = String(item?.spec?.fn || item?.fn || '').toLowerCase();
    const doorKind = doorFn === 'slide' ? 'slide' : 'rotate';
    log('buildFacade start', {
      facade: facadeGroup.name,
      selection: sel,
      productKind,
      layoutRole,
      doorKind,
      unifiedFacade: !!this.unifiedFacade,
      facadeSize: facadeGroup.userData?.originalSize || size,
    });

    const unifiedHandlePlacements =
      this.unifiedFacade &&
      layoutRole === 'facades_main' &&
      typeof rt.resolveUnifiedFacadeHandlePlacements === 'function'
        ? rt.resolveUnifiedFacadeHandlePlacements(sel.seriesId, {
            productKind,
            doorKind,
            facadeWidthMm: wEarly,
            facadeHeightMm: hEarly,
            vars: this.variables,
          })
        : null;

    const attachResolvedHandle = (resolved, bandCtx) => {
      bandCtx = bandCtx || {
        bandHeightMm: hEarly,
        yOffsetMm: 0,
        handleSuffix: '',
        layoutRole,
      };
      if (!resolved || resolved.skip) {
        log('attachHandle skip', {
          facade: facadeGroup.name,
          seriesId: sel.seriesId,
          layoutRole: bandCtx.layoutRole,
          reason: resolved?.reason || 'unknown',
        });
        return;
      }

      const bandH = Math.max(1, Number(bandCtx.bandHeightMm) || Number(hEarly) || 1);
      const yOffsetMm = Math.max(0, Number(bandCtx.yOffsetMm) || 0);
      const handleSuffix = String(bandCtx.handleSuffix || '');
      const roleForLog = bandCtx.layoutRole || layoutRole;

      const resolveAttachParent = () => {
        const swing = facadeGroup.getObjectByName('__door_swing');
        return { swing, attachParent: swing || facadeGroup };
      };

      let { swing, attachParent } = resolveAttachParent();
      const handleName = `__cld_facade_handle${handleSuffix}`;
      const prev = attachParent.getObjectByName(handleName);
      if (prev) {
        attachParent.remove(prev);
        prev.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((m) => m?.dispose?.());
          }
        });
      }

      const w =
        Number(facadeGroup.userData?.originalSize?.x) ||
        Number(size?.x) ||
        0;
      const d = Number(thicknessMm) || 16;
      const vertical = !!resolved.vertical;
      const isKnob =
        !!(rt.isKnobHandleSeries && rt.isKnobHandleSeries(resolved.series)) ||
        String(resolved.kind || resolved.series?.kind || '').toLowerCase() === 'knob';
      const handleOffsetMm =
        resolved.positionOffsetMm != null && Number.isFinite(Number(resolved.positionOffsetMm))
          ? Number(resolved.positionOffsetMm)
          : rt.resolveHandleOffsetMm(item);
      const edgeOffsetMm =
        resolved.positionEdgeOffsetMm != null && Number.isFinite(Number(resolved.positionEdgeOffsetMm))
          ? Number(resolved.positionEdgeOffsetMm)
          : null;
      const contentOff = facadeGroup.userData._cldBlbContentOffset || { x: 0, y: 0, z: 0 };
      const doorDirection = swing?.userData?.cldDoorDirection || facadeGroup.userData?.cldDoorDirection || 'ly';
      const cmId = Number(resolved.cabinetModelId) || 3;

      const handleGroup = new THREE.Group();
      handleGroup.name = handleName;
      handleGroup.userData.isFacadeHandle = true;
      handleGroup.userData.handleSeriesId = sel.seriesId;
      handleGroup.userData.cabinetModelId = cmId;
      handleGroup.userData.handleVertical = vertical;
      handleGroup.userData.handleSizeSource = 'cabinet_model';
      handleGroup.userData.handleLayoutRole = roleForLog;
      attachParent.add(handleGroup);

      const loadWithCabinetModelDims = (cmPl) => {
        const pl = cmPl || rt.cabinetModelSizeToHandlePlacement({ x: 14, y: 960, z: 22 }, bandH);
        const knobScaleMode = !!pl.knob;
        const barWidthMm = knobScaleMode
          ? 0
          : rt.resolveBarWidthMm(w, resolved.series, resolved.variant, resolved.barRules);
        const ruleBarMm = knobScaleMode
          ? 0
          : Number(resolved.barLengthMm) ||
            Number(resolved.variant?.barLengthMm) ||
            Number(pl.catalogBarMm) ||
            0;
        let barLengthMm;
        if (knobScaleMode) {
          barLengthMm = 0;
        } else if (vertical) {
          const catalogBar = ruleBarMm > 0 ? ruleBarMm : Number(pl.barLengthMm) || 0;
          barLengthMm = rt.resolveVerticalBarFitLengthMm
            ? rt.resolveVerticalBarFitLengthMm(catalogBar, bandH, {
                positionAnchor: resolved.positionAnchor || null,
                handleOffsetMm,
              })
            : catalogBar > 0 && bandH > 0
              ? Math.min(catalogBar, Math.max(64, bandH - 2 * (rt.DEFAULT_HANDLE_OFFSET_MM || 30)))
              : catalogBar || Number(pl.barLengthMm) || 0;
        } else {
          const catalogBar =
            ruleBarMm > 0 ? ruleBarMm : Number(pl.catalogBarMm) || Number(pl.barLengthMm) || 0;
          barLengthMm = rt.resolveHorizontalBarFitLengthMm
            ? rt.resolveHorizontalBarFitLengthMm(catalogBar, w)
            : catalogBar || barWidthMm;
        }
        const handleDims = {
          barLengthMm,
          catalogBarMm: ruleBarMm > 0 ? ruleBarMm : pl.catalogBarMm || barLengthMm,
          profileHeightMm: pl.profileHeightMm,
          profileDepthMm: pl.profileDepthMm,
        };

        const spec = { fitToSize: true, roomHandle: true, id: String(cmId) };
        if (resolved.modelPath) spec.modelUrl = resolved.modelPath;
        const refSizeMm = pl.sizeMm;

        log('load model (cabinet_model)', {
          facade: facadeGroup.name,
          cabinetModelId: cmId,
          spec,
          refSizeMm,
          handleDims,
          vertical,
          doorDirection,
          attachParent: attachParent.name,
          hasSwing: !!swing,
        });

        loader
          .resolveCabinetModel({
            spec,
            sizeMm: refSizeMm,
          })
          .then((root) => {
            ({ swing, attachParent } = resolveAttachParent());
            if (handleGroup.parent !== attachParent) {
              handleGroup.parent?.remove(handleGroup);
              attachParent.add(handleGroup);
              log('reparent handle', { facade: facadeGroup.name, attachParent: attachParent.name });
            }
            if (!root) {
              log('load failed', { facade: facadeGroup.name, reason: 'null_root', spec });
              if (handleGroup.parent) handleGroup.parent.remove(handleGroup);
              return;
            }
            if (!handleGroup.parent) {
              log('load aborted', { facade: facadeGroup.name, reason: 'handle_group_detached' });
              return;
            }

            let meshCount = 0;
            root.traverse((o) => {
              if (o.isMesh) meshCount += 1;
            });
            if (meshCount === 0) {
              log('load failed', { facade: facadeGroup.name, reason: 'no_meshes_in_fbx', spec });
              if (handleGroup.parent) handleGroup.parent.remove(handleGroup);
              return;
            }

            const bboxBefore = rt.bboxSizeMm(root);
            let handleSize = rt.bboxSizeMm(root);
            if (cmId === 3) {
              const sMax = Math.max(handleSize.x, handleSize.y, handleSize.z);
              const tMax = Math.max(refSizeMm.x, refSizeMm.y, refSizeMm.z);
              if (sMax > 0 && sMax < Math.min(120, tMax * 0.2)) {
                const beforeRescue = handleSize;
                root.scale.multiplyScalar(10);
                root.updateMatrixWorld(true);
                rt.centerObjectAtOrigin(root);
                handleSize = rt.bboxSizeMm(root);
                log('handle x10 rescue', { beforeRescue, afterRescue: handleSize, sMax, tMax });
              }
            }

            const ph = Number(handleDims.profileHeightMm) || Number(pl.profileHeightMm) || 14;
            const pd = Number(handleDims.profileDepthMm) || Number(pl.profileDepthMm) || 22;
            const targetBarMm = knobScaleMode
              ? 0
              : vertical
              ? Number(barLengthMm) || Number(pl.barLengthMm) || 0
              : Number(barLengthMm) ||
                (ruleBarMm > 0 ? ruleBarMm : 0) ||
                Number(pl.catalogBarMm) ||
                Number(pl.barLengthMm) ||
                0;

            if (knobScaleMode && rt.scaleKnobToCabinetMm) {
              const sm = pl.sizeMm || refSizeMm;
              handleSize = rt.scaleKnobToCabinetMm(root, sm);
              if (typeof loader.applyStoredCatalogRotation === 'function') {
                loader.applyStoredCatalogRotation(root);
                root.userData._cldCatalogRotApplied = true;
                rt.centerObjectAtOrigin(root);
                handleSize = rt.bboxSizeMm(root);
              }
            } else if (targetBarMm > 0 && rt.scaleHandleToCatalogMm) {
              handleSize = rt.scaleHandleToCatalogMm(root, targetBarMm, ph, pd);
            }

            if (!knobScaleMode && vertical && typeof loader.applyStoredCatalogRotation === 'function') {
              loader.applyStoredCatalogRotation(root);
              root.userData._cldCatalogRotApplied = true;
              rt.centerObjectAtOrigin(root);
              handleSize = rt.bboxSizeMm(root);
            } else if (!vertical) {
              handleSize = rt.applyRoomHandleOrientationFromVerticalCatalog
                ? rt.applyRoomHandleOrientationFromVerticalCatalog(root, false)
                : (() => {
                    root.rotation.z = -Math.PI / 2;
                    root.updateMatrixWorld(true);
                    rt.centerObjectAtOrigin(root);
                    return rt.bboxSizeMm(root);
                  })();
              log('horizontal bar scale', {
                facade: facadeGroup.name,
                targetBarMm,
                ruleBarMm,
                barLengthMm,
                barWidthMm,
                bboxBefore,
                bboxAfter: handleSize,
                facadeW: w,
              });
            }
            const bboxAfter = handleSize;

            const posDims = { ...handleDims };
            const posOpts = {
              facadeWidthMm: w,
              facadeHeightMm: bandH,
              thicknessMm: d,
              contentOffset: contentOff,
              handleOffsetMm,
              edgeOffsetMm,
              handleSizeMm: handleSize,
              handleDims: posDims,
              doorDirection,
              hingesOffsetMm: 16,
              vertical,
              productKind: this.productKind || 'wardrobe',
              positionAnchor: resolved.positionAnchor || null,
            };
            const pos = rt.computeHandlePositionMm
              ? rt.computeHandlePositionMm(posOpts)
              : vertical
                ? rt.computeVerticalHandlePositionMm(posOpts)
                : rt.computeBarHandlePositionMm(posOpts);
            if (yOffsetMm > 0) pos.y += yOffsetMm;

            const swingLocal =
              swing && attachParent === swing
                ? {
                    x: pos.x - (Number(swing.position.x) || 0),
                    y: pos.y - (Number(swing.position.y) || 0),
                    z: pos.z - (Number(swing.position.z) || 0),
                  }
                : { x: pos.x, y: pos.y, z: pos.z };

            root.traverse((o) => {
              if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
                o.userData.isFacadeHandle = true;
                o.userData.cldSkipStep5FacadeDecor = true;
              }
            });
            handleGroup.add(root);
            handleGroup.position.set(swingLocal.x, swingLocal.y, swingLocal.z);
            if (!vertical && pos.rotationZ) handleGroup.rotation.z = pos.rotationZ;

            log('attached ok', {
              facade: facadeGroup.name,
              series: sel.seriesId,
              layoutRole: roleForLog,
              unifiedFacade: !!this.unifiedFacade,
              bandHeightMm: bandH,
              yOffsetMm,
              sizeSource: 'cabinet_model',
              cabinetModelId: cmId,
              vertical,
              barWidthMm,
              barLengthMm,
              handleDims: posDims,
              bboxBefore,
              bboxAfter,
              handleSize,
              meshCount,
              targetMm: refSizeMm,
              pos,
              swingLocal,
              swingPos: swing
                ? { x: swing.position.x, y: swing.position.y, z: swing.position.z }
                : null,
              attachParent: attachParent.name,
            });
          })
          .catch((e) => {
            log('load error', { facade: facadeGroup.name, error: String(e?.message || e), spec });
            if (handleGroup.parent) handleGroup.parent.remove(handleGroup);
          });
      };

      const cmWarm = rt.resolveHandleCabinetModelDims
        ? rt.resolveHandleCabinetModelDims(cmId, bandH)
        : Promise.resolve(null);
      cmWarm.then(loadWithCabinetModelDims).catch(() => loadWithCabinetModelDims(null));
    };

    const attachHandle = () => {
      this._removeAttachedFacadeHandle(facadeGroup);
      if (Array.isArray(unifiedHandlePlacements) && unifiedHandlePlacements.length) {
        for (const pl of unifiedHandlePlacements) {
          attachResolvedHandle(pl.resolved, {
            bandHeightMm: pl.bandHeightMm,
            yOffsetMm: pl.yOffsetMm,
            handleSuffix: `_${pl.layoutRole}`,
            layoutRole: pl.layoutRole,
          });
        }
        return;
      }
      const resolveFn = rt.resolveForFacade || rt.resolveSync;
      const resolved = resolveFn.call(rt, sel.seriesId, {
        productKind,
        layoutRole,
        doorKind,
        facadeWidthMm: wEarly,
        facadeHeightMm: hEarly,
      });
      attachResolvedHandle(resolved, {
        bandHeightMm: hEarly,
        yOffsetMm: 0,
        handleSuffix: '',
        layoutRole,
      });
    };

    const warm = rt.loadHandlesCatalog ? rt.loadHandlesCatalog() : Promise.resolve();
    warm.then(attachHandle).catch(() => attachHandle());
  }

  // Build 3D model node (Clodis type:'model'): GLB/FBX из каталога cabinet_model.
  // Пока GLB грузится — серый куб; после загрузки (clodis-cabinet-model-loader.js) — модель из каталога.
  buildModel(item, parentSection) {
    this._invokeItemEvent(item, 'on_before_params', { parentSection });
    const modelName = item.name || 'model';
    const size = this.evaluateSize(item.size || {}, parentSection);
    const pos = this.evaluatePosition(item.pos || {}, parentSection, size);
    const pivot = this.evaluatePivot(item.pivot || {}, size);
    // Кухня: высота опоры = project h_bottom (как v:h_bottom в админке). size.xz/pos — из JSON.
    {
      const isLegEarly =
        item?.cldSupportLeg === true ||
        /опора/i.test(modelName) ||
        /опора/i.test(String(item?.spec?.key || ''));
      const hbVar = Math.max(0, Number(this.variables?.h_bottom) || 0);
      if (isLegEarly && hbVar > 0) {
        size.y = hbVar;
      }
    }
    this._invokeItemEvent(item, 'on_before_build', { parentSection, size, pos, pivot });

    const group = new THREE.Group();
    group.name = `Model_${modelName}`;
    group.userData.isCabinetModel = true;
    group.userData.modelSpecId = item?.spec?.id != null ? String(item.spec.id) : '';
    group.userData.modelKey = item?.spec?.key || '';
    // Стыковой крепёж: size 0 в JSON = нативный GLB (как админ). Math.max(1) сжимал до 1 мм → не видно.
    const isJointHwModel =
      !!item?.fromJointScheme ||
      Number(item?.spec?.joint_template_model) === 1 ||
      Number(item?.spec?.joint_hardware) === 1;
    if (isJointHwModel) {
      group.userData.fromJointScheme = 1;
      group.userData.jointTemplateModel = 1;
      group.userData.joint_hardware = 1;
      group.userData.isAccessory = true;
      if (item.spec && typeof item.spec === 'object') {
        group.userData.spec = { ...(group.userData.spec || {}), ...item.spec };
      }
    }
    if (parentSection?.hingeModuleLocalBuild) {
      const fromDrillTpl = Number(item?.spec?.from_drill_template) === 1;
      if (!fromDrillTpl) {
        const specId = String(item?.spec?.id ?? '').trim();
        const part =
          specId === '6' || /корпус|corpus/i.test(modelName) ? 'door' : 'facade';
        const tid = this._resolveHingeDrillTemplateIdFromContext(parentSection, part);
        if (tid > 0) {
          group.userData.cfrnDrillTemplateId = tid;
          group.userData.isHingeBazisExport = true;
          group.userData.hingePart = part;
          group.userData._drillTemplateLocalMmPerUnit = 1;
        }
      } else {
        group.userData.isHingeBazisExport = true;
        group.userData.fromDrillTemplateModel = true;
      }
    }
    this._modelLoadEpoch = (this._modelLoadEpoch || 0) + 1;
    group.userData._cldModelEpoch = this._modelLoadEpoch;

    const rawSx = Number(size.x) || 0;
    const rawSy = Number(size.y) || 0;
    const rawSz = Number(size.z) || 0;
    const useNativeJointGlb =
      isJointHwModel && !(rawSx > 0.5 && rawSy > 0.5 && rawSz > 0.5);
    const w = useNativeJointGlb ? 0 : Math.max(1, rawSx || 1);
    const h = useNativeJointGlb ? 0 : Math.max(1, rawSy || 1);
    const d = useNativeJointGlb ? 0 : Math.max(1, rawSz || 1);

    const content = new THREE.Group();
    content.name = `ModelContent_${modelName}`;
    const hangKind =
      item?.spec?.rodHangStripKind ||
      item?.rodHangStripKind ||
      item?.spec?.rod_hang_strip_kind ||
      '';
    if (hangKind) {
      group.userData.rodHangStripKind = String(hangKind);
      content.userData.rodHangStripKind = String(hangKind);
    }

    const phW = useNativeJointGlb ? 8 : w;
    const phH = useNativeJointGlb ? 8 : h;
    const phD = useNativeJointGlb ? 50 : d;
    const geometry = new THREE.BoxGeometry(phW, phH, phD);
    const material = new THREE.MeshStandardMaterial({
      color: isJointHwModel ? 0x64748b : 0x9ca3af,
      metalness: 0.2,
      roughness: 0.7,
      transparent: true,
      opacity: isJointHwModel ? 0.85 : 0.35,
    });
    const placeholder = new THREE.Mesh(geometry, material);
    placeholder.name = `ModelPlaceholder_${modelName}`;
    placeholder.userData.isAccessory = true;
    if (isJointHwModel) {
      placeholder.userData.fromJointScheme = 1;
      placeholder.userData.joint_hardware = 1;
    }
    // isVisualOnly только у петель: иначе опоры выпадают из floor-contact bbox
    // (регрессия после крепежа/петель; в 1.321 placeholder опоры считался в bbox).
    if (parentSection?.hingeModuleLocalBuild) {
      placeholder.userData.isVisualOnly = true;
      placeholder.visible = false;
      group.userData.cldHingeCatalogModel = true;
    }
    content.add(placeholder);

    const pv = item.pivot || {};
    const slotW = useNativeJointGlb ? phW : w;
    const slotH = useNativeJointGlb ? phH : h;
    const slotD = useNativeJointGlb ? phD : d;
    const convX = (-(Number(pv.x) || 0) * slotW) / 2;
    const convY = (-(Number(pv.y) || 0) * slotH) / 2;
    const convZ = (-(Number(pv.z) || 0) * slotD) / 2;
    const treeRot = item.rot || item.rotation || {};
    const modelKeyEarly = String(item?.spec?.key || modelName || '');
    const isSupportLegEarly =
      item?.cldSupportLeg === true ||
      /опора/i.test(modelName) ||
      /опора/i.test(modelKeyEarly) ||
      /support.?leg/i.test(modelKeyEarly);
    // Реф: PlanPlace-own (−tree + pivot + card pos/rot). Опоры — тем же путём.
    const usePlanPlaceOwn =
      !useNativeJointGlb &&
      !isJointHwModel &&
      typeof window !== 'undefined' &&
      window.__cldPlanPlaceLoadModel &&
      typeof window.__cldPlanPlaceLoadModel.buildPlanPlaceOwnObject === 'function';

    group.position.set(Number(pos.x) || 0, Number(pos.y) || 0, Number(pos.z) || 0);
    if (usePlanPlaceOwn) {
      // pivot + tree −rot внутри buildPlanPlaceOwnObject (content в нуле).
      content.position.set(0, 0, 0);
      // Опоры: placeholder в рамке conv_pivot — иначе floor-snap по −h/2, стопа на 0.
      if (isSupportLegEarly) {
        placeholder.position.set(convX, convY, convZ);
      }
    } else {
      content.position.set(convX, convY, convZ);
    }
    group.add(content);

    if (!usePlanPlaceOwn) {
      // Legacy: tree rot на group (+). PlanPlace-путь не дублирует.
      if (treeRot.x) group.rotation.x = this.parseRotation(treeRot.x);
      if (treeRot.y) group.rotation.y = this.parseRotation(treeRot.y);
      if (treeRot.z) group.rotation.z = this.parseRotation(treeRot.z);
      const cRot = item.c_rot || {};
      if (cRot.x) content.rotation.x = this.parseRotation(cRot.x);
      if (cRot.y) content.rotation.y = this.parseRotation(cRot.y);
      if (cRot.z) content.rotation.z = this.parseRotation(cRot.z);
    }
    if (isSupportLegEarly && typeof window !== 'undefined') {
      window.__cldLastSupportLegSeat = {
        name: modelName,
        pos: { x: pos.x, y: pos.y, z: pos.z },
        pivot: { x: pv.x, y: pv.y, z: pv.z },
        rot: { x: treeRot.x, y: treeRot.y, z: treeRot.z },
        treeRotSign: usePlanPlaceOwn ? -1 : 1,
        slot: { x: slotW, y: slotH, z: slotD },
        planPlace: !!usePlanPlaceOwn,
      };
    }

    if (typeof window !== 'undefined' && window.__cldRoomCabinetModels) {
      const modelKey = modelKeyEarly;
      const isSupportLeg = isSupportLegEarly;
      if (isSupportLeg) {
        group.userData.cldSupportLeg = true;
        group.userData.cldSupportLegTargetHeightMm = h;
      }
      let attachSpec = useNativeJointGlb
        ? { ...(item.spec || {}), fitToSize: false }
        : { ...(item.spec || {}) };
      if (isSupportLeg) {
        attachSpec = {
          ...attachSpec,
          cldSupportLeg: true,
          name: modelName,
          key: modelKey || modelName,
        };
      }
      if (isJointHwModel) {
        attachSpec = {
          ...attachSpec,
          fitToSize: false,
          fromJointScheme: 1,
          joint_hardware: 1,
          joint_template_model:
            Number(attachSpec.joint_template_model) === 1
              ? 1
              : Number(item?.spec?.joint_template_model) === 1
                ? 1
                : attachSpec.joint_template_model,
        };
      }
      window.__cldRoomCabinetModels.attachCabinetModelToGroup({
        contentGroup: content,
        placeholderMesh: placeholder,
        parentGroup: group,
        spec: attachSpec,
        sizeMm: useNativeJointGlb
          ? { x: 0, y: 0, z: 0 }
          : { x: w, y: h, z: d },
        pivot: item.pivot || {},
        treeRot: treeRot,
        usePlanPlace: !!usePlanPlaceOwn,
        buildEpoch: group.userData._cldModelEpoch,
      });
    }

    this._dbg(`🧊 buildModel "${modelName}"`, {
      specId: group.userData.modelSpecId,
      size,
      pos,
      pivot,
    });

    // Присадка/дети под model — в СК content (origin GLB), как в превью.
    if (Array.isArray(item.children) && item.children.length) {
      const modelChildCtx = {
        name: modelName,
        size: { x: w, y: h, z: d },
        variables: this.variables,
        groups: this.groups,
        parent: content,
        layoutRole: parentSection?.layoutRole || '',
        facadeThicknessOffset: 0,
        rootSection: parentSection?.rootSection || parentSection,
        cabinetModelLocalHost: true,
        modelKey: item?.spec?.key || modelName,
        hingeModuleLocalBuild: !!(parentSection && parentSection.hingeModuleLocalBuild),
        hingeFacadeDrillTemplateId: parentSection?.hingeFacadeDrillTemplateId || 0,
        hingeDoorDrillTemplateId: parentSection?.hingeDoorDrillTemplateId || 0,
        hingeCatalogSourceItem: parentSection?.hingeCatalogSourceItem || null,
        _cldSectionContext: parentSection,
      };
      item.children.forEach((child) => {
        const childObject = this.buildItem(child, modelChildCtx);
        if (childObject) content.add(childObject);
      });
    }

    this._invokeItemEvent(item, 'on_after_build', { parentSection, target: group, size, pos, pivot });
    return group;
  }

  // Build module (predefined component)
  buildModule(item, parentSection) {
    this._invokeItemEvent(item, 'on_before_params', { parentSection });
    const moduleName = item.name || 'module';
    let outerPyramidRoleEarly = this._resolveOuterModuleLayoutRole(item, parentSection);
    // Вложенные створки двустворчатого catalog_28 (#13/#14 → #8/#11/#7/#12):
    // роль с внешней оболочки (facades_main / facades_top) — для ручек/петель.
    // Антресоль: facades_top → noHandle в handles.json; без роли ручка встаёт по defaults.
    // Свес/shell-layout по-прежнему только при catalogDepth===0 (не дублируем).
    if (
      !this._normalizeLayoutRoleKey(outerPyramidRoleEarly) &&
      (this._catalogModuleBuildDepth || 0) > 0 &&
      this._isFacadePlanNode(item)
    ) {
      const parentLr = this._normalizeLayoutRoleKey(
        parentSection?.layoutRole || parentSection?.sourceItem?.layout_role || ''
      );
      if (this._isFacadeLayoutRole(parentLr)) {
        outerPyramidRoleEarly = parentLr;
      }
    }
    if (
      !this._normalizeLayoutRoleKey(outerPyramidRoleEarly) &&
      (this._catalogModuleBuildDepth || 0) === 0 &&
      this._isFacadePlanNode(item) &&
      parentSection?.sourceItem?.children
    ) {
      outerPyramidRoleEarly = this._inferFacadeShellLayoutRole(
        item,
        parentSection.sourceItem.children,
        parentSection
      );
    }
    if (this._isFacadeLayoutRole(this._normalizeLayoutRoleKey(outerPyramidRoleEarly))) {
      item.layout_role = outerPyramidRoleEarly;
    }
    const facadeShellLayout = this._applyRoomFacadeModuleShellLayout(
      item,
      parentSection,
      outerPyramidRoleEarly
    );
    const drawerShellLayout = facadeShellLayout
      ? null
      : this._applyRoomDrawerModuleShellLayout(item, parentSection, outerPyramidRoleEarly);
    const size = facadeShellLayout
      ? facadeShellLayout.size
      : drawerShellLayout
        ? drawerShellLayout.size
        : this.evaluateSize(item.size || {}, parentSection);
    const pos = facadeShellLayout
      ? facadeShellLayout.pos
      : drawerShellLayout
        ? drawerShellLayout.pos
        : this.evaluatePosition(item.pos || {}, parentSection, size);
    let pivot = facadeShellLayout
      ? facadeShellLayout.pivot
      : drawerShellLayout
        ? drawerShellLayout.pivot
        : this.evaluatePivot(item.pivot || {}, size);
    if (
      !facadeShellLayout &&
      this._isFacadeLayoutRole(this._normalizeLayoutRoleKey(outerPyramidRoleEarly)) &&
      parentSection &&
      parentSection.size
    ) {
      this._applyFacadeShellDepthToParent(item, parentSection, size, pos);
    }
    const moduleRoleNorm = this._normalizeLayoutRoleKey(outerPyramidRoleEarly);
    const inheritedFacadeFt = Math.max(0, Number(parentSection?.facadeThicknessOffset) || 0);
    if (
      inheritedFacadeFt > 0 &&
      this._moduleRoleUsesFacadeDepthInset(moduleRoleNorm) &&
      !this._isFacadeLayoutRole(moduleRoleNorm)
    ) {
      const oldZ = size.z;
      size.z = Math.max(0, Number(size.z) - inheritedFacadeFt);
      this._dbg(
        `🚪 [facadeOffset/module] "${moduleName}" (role=${moduleRoleNorm}): depth ${oldZ} → ${size.z} (−${inheritedFacadeFt}мм)`
      );
    }
    const posShellBefore = { ...pos };
    if (this._isFacadeLayoutRole(moduleRoleNorm)) {
      // Комната: оболочка всегда 16 мм у переднего торца ниши (реф Locker overlay).
      // Превью catalog_28 с петлями — глубокая секция; pos.z петель/аниматора нормализуем в fixFacadeInnerPanelPosZ.
      const facadeThick = this._resolveFacadeThicknessMm(item, size);
      const nicheZ = Number(parentSection?.size?.z) || 0;
      const inset = Math.max(0, Number(parentSection?.facadeThicknessOffset) || 0);
      size.z = facadeThick;
      if (nicheZ > 0) {
        pos.z = Math.max(0, nicheZ - (inset > 0 ? inset : facadeThick));
      }
      this._facadeZLog('buildModule/shell', {
        moduleName,
        role: moduleRoleNorm,
        nicheZ,
        inset,
        facadeThick,
        shellPosZ: pos.z,
        shellSizeZ: size.z,
        posFromLayout: posShellBefore,
        facadeShellLayout: !!facadeShellLayout,
      });
      if (typeof window !== 'undefined' && window.DEBUG_HINGE_ROOM === true) {
        console.warn('[CLD][HINGE-COORDS] facade-shell', {
          moduleName,
          parentSectionName: parentSection?.name,
          parentSize: parentSection?.size,
          parentPos: parentSection?.position,
          shellSize: { x: size.x, y: size.y, z: size.z },
          shellPos: { x: pos.x, y: pos.y, z: pos.z },
        });
      }
    }
    const resolvedOverhangMm = this._resolveLowerFacadeBottomOverhangMm();
    const catalogDepth = this._catalogModuleBuildDepth || 0;
    const roleForOverhang = this._normalizeLayoutRoleKey(moduleRoleNorm);
    const productKindNorm = String(this.productKind || '').trim().toLowerCase();
    const isPedestalLike =
      productKindNorm === 'pedestal' || productKindNorm === 'standalone_floor';
    const allowOverhangByDepth =
      roleForOverhang === 'facades'
        ? isPedestalLike
          ? catalogDepth === 0
          : catalogDepth === 1
        : roleForOverhang === 'facades_main'
        ? productKindNorm === 'wardrobe'
          ? true
          : isPedestalLike
          ? catalogDepth === 0
          : catalogDepth >= 1
        : false;
    // Свес только на внешней оболочке facades_* (depth=0).
    // Двустворчатый catalog_28 (#13): родитель патчит template_tree створок, затем
    // вложенные #8/#11 наследуют/инферят facades_main и навешивали свес ещё раз
    // (−30−30 → фасад ~42 мм от пола вместо ~70).
    const lowerFacadeOverhang =
      this._isLowerFacadeBandRole(roleForOverhang) &&
      allowOverhangByDepth &&
      !parentSection?.hingeModuleLocalBuild &&
      resolvedOverhangMm > 0 &&
      catalogDepth === 0;
    this._invokeItemEvent(item, 'on_before_build', { parentSection, size, pos, pivot });

    const group = new THREE.Group();
    group.name = `Module_${moduleName}`;
    if (moduleRoleNorm) {
      group.userData.layoutRole = moduleRoleNorm;
    }
    if (this.unifiedFacade && this._isFacadeLayoutRole(moduleRoleNorm)) {
      this._unifiedFacadeModuleMeta = {
        topEdges: item.__cldUnifiedFacadeTopEdges || null,
        topCatalogSpecId: item.__cldUnifiedFacadeTopCatalogSpecId || null,
      };
    }

    const spec = item.spec || {};
    const elementType = spec.element_type;
    const elementId = spec.id != null ? String(spec.id) : '';
    const etLowerEarly = String(elementType || '').toLowerCase();
    if (etLowerEarly === 'catalog_38' || etLowerEarly === 'catalog_37') {
      if (item.spec && item.spec.template_tree) {
        delete item.spec.template_tree;
      }
    }
    if (etLowerEarly === 'catalog_33' && elementId) {
      const readNoHandle = this._readDrawerNoHandleFlag('catalog_33', elementId);
      const specNoHandle =
        spec.drawer_no_handle === 1 ||
        spec.drawer_no_handle === true ||
        spec.drawer_no_handle === '1' ||
        spec.drawerNoHandle === true ||
        spec.drawerNoHandle === 1 ||
        spec.drawerNoHandle === '1';
      if (readNoHandle || specNoHandle) {
        item.spec = { ...spec, drawer_no_handle: 1 };
        group.userData.cldDrawerCatalogId = elementId;
        group.userData.cldDrawerNoHandle = true;
      } else if (elementId) {
        group.userData.cldDrawerCatalogId = elementId;
      }
    }

    if (this._isFlatCatalogShelfModuleItem(item)) {
      group.userData.isFlatCatalogShelf = true;
      group.userData.layoutRole = group.userData.layoutRole || 'shelf';
      const pv = item.pivot && typeof item.pivot === 'object' ? item.pivot : {};
      const moduleCenterPivot =
        pv.y === 0 || pv.y === '0' || String(pv.y ?? '').trim() === '0';
      // pivot.y=0: pos.y = центр полки; дочерняя wall тоже с pivot.y=0 в центре группы — не BLB-shell.
      // pos.z отступ от задней стенки — только на синтетической wall (catalog wall pos.z=3),
      // не на shell module (как __cldNormalizeFlatCatalogShelfModuleParams в превью: module pos.z=0).
      const shellPos = moduleCenterPivot
        ? {
            x: Number(pos?.x) || 0,
            y: Number(pos?.y) || 0,
            z: 0,
          }
        : this._resolveCatalogModuleShellPositionBlb(pos, size, item.pivot || {});
      group.position.set(shellPos.x, shellPos.y, shellPos.z);
      if (moduleCenterPivot) {
        group.userData._cldBlbPivotRaw = { x: -1, y: 0, z: -1 };
      }
      const rotEarly = item.rot || {};
      if (rotEarly.x) group.rotation.x = this.parseRotation(rotEarly.x);
      if (rotEarly.y) group.rotation.y = this.parseRotation(rotEarly.y);
      if (rotEarly.z) group.rotation.z = this.parseRotation(rotEarly.z);
      const wallItem = this._flatCatalogShelfWallItemFromModule(item, size, parentSection);
      const builtWall = this.buildWall(wallItem, parentSection);
      if (builtWall) group.add(builtWall);
      this._maybeSpawnShelfPropsOnShelf(group, item, size, moduleRoleNorm || 'shelf');
      this._invokeItemEvent(item, 'on_after_build', { parentSection, target: group, size, pos, pivot });
      return group;
    }

    // 1) Пытаемся взять шаблон прямо из узла (сохраняется админкой при выборе элемента).
    // Это самый надежный путь: модуль рендерится даже без глобального каталожного кэша.
    const embeddedTemplateTree =
      item?.spec?.template_tree
      || item?.template?.tree
      || __cldItemEmbeddedTree(item)
      || null;

    // 2) Резолвим модуль из глобального каталога (как в рефе: element_type + id).
    const etLowerModule = String(elementType || '').toLowerCase();
    const catalogLookupKey =
      etLowerModule === 'hinges' ? this._resolveHingeModuleCatalogKey(spec) : elementType;
    const catalogTemplateTree = this._resolveModuleTemplateTreeFromCatalog(
      catalogLookupKey,
      elementId
    );

    // Fill catalog_38/37: свежий шаблон из каталога (shelfStack/interiorLayout), не устаревший spec.template_tree.
    const isLiveFillCatalogType =
      etLowerModule === 'catalog_38' || etLowerModule === 'catalog_37';
    let templateTree =
      isLiveFillCatalogType &&
      Array.isArray(catalogTemplateTree) &&
      catalogTemplateTree.length > 0
        ? catalogTemplateTree
        : (Array.isArray(embeddedTemplateTree) && embeddedTemplateTree.length > 0
            ? embeddedTemplateTree
            : null) ||
          catalogTemplateTree ||
          null;

    if (templateTree && (etLowerModule === 'catalog_32' || this._isKitchenBaseBuildContext())) {
      try {
        templateTree = JSON.parse(JSON.stringify(templateTree));
      } catch (_) {}
      if (etLowerModule === 'catalog_32') {
        try {
          const fix =
            typeof window !== 'undefined' ? window.__cldFixPlinthLegDepthExprs : null;
          if (typeof fix === 'function') fix(templateTree);
        } catch (_) {}
        this._normalizingCatalog32 = 'catalog_32';
      }
      try {
        this._normalizeKitchenTemplateTree(templateTree);
      } finally {
        this._normalizingCatalog32 = '';
      }
    }

    if (templateTree && etLowerModule === 'hinges') {
      templateTree = this._unwrapHingeModuleTemplateTree(templateTree, elementType);
    }

    if (etLowerModule === 'hinges') {
      group.userData.isCatalogHingeModule = true;
      const drillIds = this._hingeDrillIdsFromMergedSource(item, templateTree);
      const ctxDrill = this._hingeDrillTemplateIdsFromContext(parentSection);
      if (!drillIds.facade && ctxDrill.facade) drillIds.facade = ctxDrill.facade;
      if (!drillIds.door && ctxDrill.door) drillIds.door = ctxDrill.door;
      this._applyHingeDrillTemplateIdsToFacadeContext(drillIds);
      group.userData.hingeSpec = {
        ...spec,
        ...(drillIds.facade ? { hingeFacadeDrillTemplateId: drillIds.facade } : {}),
        ...(drillIds.door ? { hingeDoorDrillTemplateId: drillIds.door } : {}),
      };
      if (drillIds.facade) group.userData.hingeFacadeDrillTemplateId = drillIds.facade;
      if (drillIds.door) group.userData.hingeDoorDrillTemplateId = drillIds.door;
      const slotM = String(item.id || '').match(/hinge_layout_(\d+)/i);
      if (slotM) group.userData.hingeLayoutSlotIndex = Number(slotM[1]);
      if (item.__hingeRoleExpectedYMm != null) {
        group.userData.hingeRoleExpectedYMm = Number(item.__hingeRoleExpectedYMm);
      }
      if (item.__hingeRoleTreePosYMm != null) {
        group.userData.hingeRoleTreePosYMm = Number(item.__hingeRoleTreePosYMm);
      }
      if (item.__hingeRoleDoorHeightMm != null) {
        group.userData.hingeRoleDoorHeightMm = Number(item.__hingeRoleDoorHeightMm);
      } else if (this._facadeHingeContext?.roleLayoutDoorHeightMm != null) {
        group.userData.hingeRoleDoorHeightMm = Number(this._facadeHingeContext.roleLayoutDoorHeightMm);
      }
      const gen = typeof window !== 'undefined' ? window.__cldHingeLayout : null;
      if (gen && typeof gen.resolveHingeRoleLayoutAnchorOffsetMm === 'function') {
        group.userData.hingeLayoutAnchorYMm = gen.resolveHingeRoleLayoutAnchorOffsetMm(item, 'y');
      }
      this._facadeHingeContext = this._facadeHingeContext || {
        layoutRole: '',
        catalogHingeLayoutId: null,
        catalogHingeModulesApplied: false,
        catalogHingeModulesInTree: false,
      };
      this._facadeHingeContext.catalogHingeModulesInTree = true;
    }

    if (templateTree && etLowerModule !== 'hinges') {
      const fillCatalogItem = this._getCatalogItemById(elementType, elementId);
      const etFill = String(elementType || '').toLowerCase();
      const isFillCatalog =
        etFill === 'catalog_38' ||
        etFill === 'catalog_27' ||
        etFill === 'catalog_37' ||
        etFill === 'catalog_39';
      // catalog_29 — деталь «Полка» (size.y=16), не пересчитывать fill-политику на ней.
      if (fillCatalogItem && isFillCatalog) {
        if (typeof globalThis.__cldApplyFillPoliciesToCatalogTemplateTree !== 'function') {
          try {
            globalThis.__cldFillPoliciesImportPromise =
              globalThis.__cldFillPoliciesImportPromise ||
              import('./furniture/furniture-interior-layout.js?v=20260912-props-fix').then(
                (m) => {
                  globalThis.__cldApplyFillPoliciesToCatalogTemplateTree =
                    m.applyFillPoliciesToCatalogTemplateTree;
                  globalThis.__cldApplyInteriorLayoutToRoots = m.applyInteriorLayoutToRoots;
                  return m;
                }
              );
          } catch (preloadErr) {
            console.warn('[CLD][fill-policies] preload failed', preloadErr);
          }
        }
      }
      if (
        fillCatalogItem &&
        isFillCatalog &&
        typeof globalThis.__cldApplyFillPoliciesToCatalogTemplateTree === 'function'
      ) {
        try {
          const shellItem = this._shellFillPolicyCatalogItem || null;
          if (typeof globalThis.__cldLogShelfCount === 'function') {
            globalThis.__cldLogShelfCount('builder/fill-hook/before', {
              elementType: etFill,
              elementId,
              sectionSizeY: size?.y,
              fillName: fillCatalogItem?.name ?? fillCatalogItem?.data?.name ?? '',
              shellName: shellItem?.name ?? shellItem?.data?.name ?? '',
              corpus_antresol_mm: this.variables?.corpus_antresol_mm,
            });
          }
          const fillSizeY =
            typeof globalThis.__cldResolveFillSlotSizeYMm === 'function'
              ? globalThis.__cldResolveFillSlotSizeYMm({
                  hostSectionSizeY: Number(size?.y) || 0,
                  parentModule: item,
                  fillVars: this.variables,
                  variables: this.variables,
                  fallbackY: Number(size?.y) || 0,
                  sectionSizeY: Number(size?.y) || 0,
                })
              : typeof globalThis.__cldResolveModuleSlotSizeYMm === 'function'
              ? globalThis.__cldResolveModuleSlotSizeYMm(item, Number(size?.y) || 0, this.variables)
              : typeof globalThis.__cldResolveFillShelfSectionSizeYMm === 'function'
              ? globalThis.__cldResolveFillShelfSectionSizeYMm(size, this.variables, {
                  isFill:
                    etFill === 'catalog_38' ||
                    etFill === 'catalog_37' ||
                    etFill === 'catalog_39',
                  catalogTypeHint: etFill,
                })
              : null;
          const sectionSizeMmForFill =
            fillSizeY > 0
              ? {
                  x: Number(size?.x) || 600,
                  y: fillSizeY,
                  z: Number(size?.z) || 600,
                }
              : size;
          const applied = globalThis.__cldApplyFillPoliciesToCatalogTemplateTree(
            templateTree,
            fillCatalogItem,
            {
              sectionSizeMm: sectionSizeMmForFill,
              variables: this.variables,
              shellCatalogItem: shellItem,
              catalogTypeHint: etFill,
              debugTag: `builder/${etFill}#${elementId}`,
              findCatalogItem: (ct, id) => this._getCatalogItemById(ct, id),
            }
          );
          if (typeof globalThis.__cldLogShelfCount === 'function') {
            globalThis.__cldLogShelfCount('builder/fill-hook/after', {
              elementType: etFill,
              elementId,
              applied: Array.isArray(applied) && applied.length > 0,
            });
          }
          if (Array.isArray(applied) && applied.length) {
            templateTree = applied;
          }
        } catch (fillErr) {
          console.warn('[CLD][fill-policies] catalog template apply failed', fillErr);
        }
      } else if (isFillCatalog && !fillCatalogItem) {
        console.warn('[CLD][SHELF-COUNT] builder/fill-hook/no-catalog-item', {
          elementType: etFill,
          elementId,
        });
      } else if (fillCatalogItem && isFillCatalog && typeof globalThis.__cldLogShelfCount === 'function') {
        globalThis.__cldLogShelfCount('builder/fill-hook/missing', {
          elementType: etFill,
          elementId,
          hookReady: typeof globalThis.__cldApplyFillPoliciesToCatalogTemplateTree === 'function',
        });
      }
    }

    const outerPyramidRole = this._resolveOuterModuleLayoutRole(item, parentSection);
    const facadeRoleNorm = moduleRoleNorm;
    const facadeRoles = new Set(['facades', 'facades_main', 'facades_top']);
    if (facadeRoles.has(facadeRoleNorm)) {
      this._facadeHingeContext = this._facadeHingeContext || { layoutRole: '', catalogHingeLayoutId: null };
      this._facadeHingeContext.layoutRole = facadeRoleNorm;
    }
    const etLower = String(elementType || '').toLowerCase();
    if (etLower === 'catalog_28' || etLower === 'facades') {
      const catItem = this._getCatalogItemById(elementType, elementId);
      this._facadeHingeContext = this._facadeHingeContext || { layoutRole: '', catalogHingeLayoutId: null };
      const nid = Number(elementId) || 0;
      if (facadeRoles.has(facadeRoleNorm) && nid > 0) {
        this._facadeHingeContext.facadeCatalogItemId = nid;
        this._facadeHingeContext.facadeRoleLayoutCatalogItemId = nid;
        this._logHingeRoom('ctx/shellCatalogId', {
          moduleName,
          layoutRole: facadeRoleNorm,
          facadeRoleLayoutCatalogItemId: nid,
          elementType: etLower,
        });
      } else if (nid > 0 && !this._facadeHingeContext.facadeRoleLayoutCatalogItemId) {
        this._facadeHingeContext.facadeCatalogItemId = nid;
        this._logHingeRoom('ctx/leafCatalogId', {
          moduleName,
          leafCatalogItemId: nid,
          shellCatalogItemId: this._facadeHingeContext.facadeRoleLayoutCatalogItemId || null,
          layoutRole: facadeRoleNorm || null,
        });
      } else if (nid > 0) {
        this._logHingeRoom('ctx/leafCatalogId/keepShell', {
          moduleName,
          leafCatalogItemId: nid,
          shellCatalogItemId: this._facadeHingeContext.facadeRoleLayoutCatalogItemId,
          layoutRole: facadeRoleNorm || null,
        });
      }
      const hid = this._catalogItemDataField(catItem, 'hingeLayoutId');
      if (hid != null && hid !== '') {
        this._facadeHingeContext = this._facadeHingeContext || { layoutRole: '', catalogHingeLayoutId: null };
        this._facadeHingeContext.catalogHingeLayoutId = hid;
      }
    }
    if (
      Array.isArray(templateTree) &&
      templateTree.length > 0 &&
      outerPyramidRole &&
      typeof window.__cldNormalizeCatalogTemplateForPyramidShell === 'function'
    ) {
      templateTree = JSON.parse(JSON.stringify(templateTree));
      window.__cldNormalizeCatalogTemplateForPyramidShell(templateTree, outerPyramidRole);
    }

    const hasTree = Array.isArray(templateTree) && templateTree.length > 0;
    let hasCatalogHinges = false;

    if (hasTree && this._isFacadeLayoutRole(moduleRoleNorm)) {
      templateTree = JSON.parse(JSON.stringify(templateTree));
      try {
        this._hydrateCatalogModulesInPlanTree(templateTree);
      } catch (hydrateTplErr) {
        if (this._hingeRoomDbg()) {
          console.warn('[CLD][HINGE-ROOM] hydrate facade template_tree failed', hydrateTplErr);
        }
      }
      this._facadeHingeContext = this._facadeHingeContext || {
        layoutRole: moduleRoleNorm,
        catalogHingeLayoutId: null,
        catalogHingeModulesApplied: false,
        catalogHingeModulesInTree: false,
      };
      const hasHingeMods = this._treeHasHingeModuleNodes(templateTree);
      hasCatalogHinges = hasHingeMods;
      if (hasHingeMods) {
        const applied = this._applyFacadeHingeLayoutModulesInTree(
          templateTree,
          item,
          size,
          parentSection
        );
        this._facadeHingeContext.catalogHingeModulesApplied = applied;
        this._facadeHingeContext.catalogHingeModulesInTree = hasHingeMods;
      }
    }

    let appliedLowerFacadeOverhangMm = 0;
    if (this._hingeRoomVerbose() && this._isFacadeLayoutRole(moduleRoleNorm)) {
      console.warn('[CLD][HINGE-ROOM] facade/overhang-gate', {
        moduleName,
        layoutRole: moduleRoleNorm,
        catalogDepth: this._catalogModuleBuildDepth || 0,
        resolvedOverhangMm,
        lowerFacadeOverhang,
        sizeBefore: { x: size?.x, y: size?.y, z: size?.z },
        posBefore: { x: pos?.x, y: pos?.y, z: pos?.z },
      });
    }
    if (lowerFacadeOverhang) {
      // Свес — только удлинение полотна в template_tree; shell/петли как без свеса.
      if (hasTree) {
        const patched = this._applyLowerDoorFacadeBottomOverhangInTree(
          templateTree,
          resolvedOverhangMm
        );
        if (patched > 0) appliedLowerFacadeOverhangMm = resolvedOverhangMm;
      }
    }
    if (this._isFacadeLayoutRole(moduleRoleNorm)) {
      group.userData.facadeBottomOverhangMm = Math.max(0, Number(appliedLowerFacadeOverhangMm) || 0);
      if (this._hingeRoomVerbose()) {
        console.warn('[CLD][HINGE-ROOM] facade/overhang-applied', {
          moduleName,
          layoutRole: moduleRoleNorm,
          appliedLowerFacadeOverhangMm: group.userData.facadeBottomOverhangMm,
          sizeAfter: { x: size?.x, y: size?.y, z: size?.z },
          posAfter: { x: pos?.x, y: pos?.y, z: pos?.z },
        });
      }
    }

    if (typeof window !== 'undefined' && this._hingeRoomVerbose() && this._isFacadeLayoutRole(moduleRoleNorm)) {
      const hingeNodesInTree = [];
      const _walkDbg = (nodes) => {
        if (!Array.isArray(nodes)) return;
        for (const n of nodes) {
          if (String(n?.type||'').toLowerCase() === 'module' && String(n?.spec?.element_type||'').toLowerCase() === 'hinges') {
            hingeNodesInTree.push({ id: n.id, pos: n.pos, size: n.size });
          }
          if (Array.isArray(n?.children)) _walkDbg(n.children);
          if (Array.isArray(n?.spec?.template_tree)) _walkDbg(n.spec.template_tree);
        }
      };
      if (hasTree) _walkDbg(templateTree);
      console.warn('[CLD][HINGE-VERIFY][buildModule/facade]', {
        moduleName,
        moduleRoleNorm,
        isFacadeRole: this._isFacadeLayoutRole(moduleRoleNorm),
        hasTree,
        hasCatalogHinges,
        hingeNodesFoundInTree: hingeNodesInTree.length,
        hingeNodes: hingeNodesInTree,
        templateTreeTypes: hasTree ? templateTree.map(n => ({type:n?.type, et:n?.spec?.element_type, role:n?.layout_role})) : [],
        sizeUsed: { x: size?.x, y: size?.y, z: size?.z },
        posUsed: { x: pos?.x, y: pos?.y, z: pos?.z },
        itemHasAuthoredExprs: this._facadeModuleHasAuthoredLayoutExprs(item),
        facadeHingeContext: {
          layoutRole: this._facadeHingeContext?.layoutRole,
          facadeCatalogItemId: this._facadeHingeContext?.facadeCatalogItemId,
          facadeRoleLayoutCatalogItemId: this._facadeHingeContext?.facadeRoleLayoutCatalogItemId,
          doubleSwingLeafFacade: this._facadeHingeContext?.doubleSwingLeafFacade,
          catalogHingeModulesApplied: this._facadeHingeContext?.catalogHingeModulesApplied,
          roleLayoutAcc: this._facadeHingeContext?.roleLayoutAccSnapshot || null,
        },
      });
    }

    // (раскладка петель по ролям — выше, после гидратации вложенных catalog_28)

    // Антресоль (layout_role top): шкаф уже нарезал слот; вложенный catalog_30 не должен
    // повторять формулу `s:y - v:h_bottom - v:corpus…`. Корпус (corpus_antresol) — не трогаем.
    const _roleNormItem = this._normalizeLayoutRoleKey(
      item.layout_role ?? item.sectionLayoutRole ?? moduleRoleNorm ?? ''
    );
    if (
      hasTree &&
      etLowerModule !== 'hinges' &&
      !this._isFacadeLayoutRole(moduleRoleNorm) &&
      _roleNormItem === 'top' &&
      this._moduleNodeUsesCabinetLevelHeightSlice(item)
    ) {
      templateTree = this._neutralizeNestedSlotSelfPositioning(templateTree);
    }

    if (
      hasTree &&
      moduleRoleNorm === 'drawer' &&
      this._isBottomDrawerModule(item, parentSection) &&
      (this._catalogModuleBuildDepth || 0) === 0 &&
      resolvedOverhangMm > 0
    ) {
      templateTree = JSON.parse(JSON.stringify(templateTree));
      const drawerFacadePatches = this._applyLowerDrawerFacadeBottomOverhangInTree(
        templateTree,
        resolvedOverhangMm
      );
      if (drawerFacadePatches > 0) {
        group.userData.facadeBottomOverhangMm = resolvedOverhangMm;
        if (this._hingeRoomVerbose()) {
          console.warn('[CLD][HINGE-ROOM] drawer/bottom-overhang-applied', {
            moduleName,
            drawerId: item?.id,
            facadeNodesPatched: drawerFacadePatches,
            overhangMm: resolvedOverhangMm,
          });
        }
      }
    }

    // Каталожный module: group.position = pos (без вычитания pivot), как shell-section в превью.
    const parentShellDepthMm = Number(parentSection?.size?.z) || 0;
    if (
      etLowerModule === 'hinges' &&
      (this._useCatalogHingeModulesInRoom() ||
        this._isThinFacadeShellDepth(parentShellDepthMm) ||
        this._isThinFacadeShellDepth(Number(size?.z)))
    ) {
      const doorDir =
        this._facadeHingeContext?.doorDirection ||
        parentSection?.userData?.cldDoorDirection;
      this._applyRefHingeModulePosInFacadeShell(item, pos, size, doorDir, parentSection);
    }

    if (hasTree) {
      const isHingeCatalogModuleEarly = etLowerModule === 'hinges';
      if (isHingeCatalogModuleEarly && item.__hingeRoleExpectedYMm != null) {
        const layoutAxis =
          this._facadeHingeContext?.roleLayoutVerify?.axis ||
          this._facadeHingeContext?.roleLayoutVerify?.hingeAxis ||
          'Y';
        this._applyHingeRoleLayoutModuleBLBFromCenter(item, pos, templateTree, layoutAxis);
      }
      const shellPos =
        etLowerModule === 'hinges'
          ? {
              x: Number(pos.x) || 0,
              y: Number(pos.y) || 0,
              z: Number(pos.z) || 0,
            }
          : this._resolveCatalogModuleShellPositionBlb(pos, size, item.pivot || {});
      group.position.set(shellPos.x, shellPos.y, shellPos.z);
      const rot = item.rot || {};
      if (rot.x) group.rotation.x = this.parseRotation(rot.x);
      if (rot.y) group.rotation.y = this.parseRotation(rot.y);
      if (rot.z) group.rotation.z = this.parseRotation(rot.z);
    } else {
      this.applyTransform(group, pos, pivot, item.rot || {});
    }

    if (etLowerModule === 'hinges' && this._hingeVerifyDbg()) {
      this._logHingeModuleBuiltState('buildModule/afterPos', group, item, pos, size, parentSection);
    }

    if (hasTree) {
      const isHingeCatalogModule = etLowerModule === 'hinges';
      const hingeIntrinsic =
        isHingeCatalogModule
          ? this._hingeCatalogIntrinsicSectionSize(templateTree)
          : null;
      // Карточка catalog_31 (50×67×150 и т.п.): если в дереве size = s:x/s:y/s:z.
      const hingeCardSize =
        isHingeCatalogModule
          ? this._hingeCatalogCardSizeMm(
              this._getCatalogItemById(
                this._resolveHingeModuleCatalogKey(spec) || elementType,
                elementId
              )
            )
          : null;
      const moduleSizePositive =
        Number(size?.x) > 0 || Number(size?.y) > 0 || Number(size?.z) > 0;
      const hingeCtxSize = hingeIntrinsic
        ? { ...hingeIntrinsic }
        : hingeCardSize
          ? { ...hingeCardSize }
          : moduleSizePositive
            ? { ...size }
            : isHingeCatalogModule
              ? { x: 50, y: 67, z: 150 }
              : { ...size };
      if (isHingeCatalogModule) {
        group.userData.hingeModuleSizeMm = { ...hingeCtxSize };
      }
      const facadeThinShell =
        this._isFacadeLayoutRole(moduleRoleNorm) &&
        this._isThinFacadeShellDepth(Number(size.z));
      const hingeDrillForModule = isHingeCatalogModule
        ? this._hingeDrillIdsFromMergedSource(item, templateTree)
        : { facade: 0, door: 0 };
      if (isHingeCatalogModule) {
        const ctxDrill = this._hingeDrillTemplateIdsFromContext(parentSection);
        if (!hingeDrillForModule.facade && ctxDrill.facade) hingeDrillForModule.facade = ctxDrill.facade;
        if (!hingeDrillForModule.door && ctxDrill.door) hingeDrillForModule.door = ctxDrill.door;
      }
      const facadeLayoutRoleForHinge =
        parentSection?.layoutRole ||
        parentSection?.hingeCatalogSourceItem?.layout_role ||
        item?.layout_role ||
        moduleRoleNorm;
      const moduleSectionContext = {
        name: moduleName,
        size: isHingeCatalogModule ? { ...hingeCtxSize } : { ...size },
        position: { x: 0, y: 0, z: 0 },
        pivot: pivot,
        parent: parentSection,
        rootSection: parentSection ? (parentSection.rootSection || parentSection) : null,
        sourceItem: item,
        groupRef: group,
        variables: this.variables,
        groups: this.groups,
        layoutRole: isHingeCatalogModule ? facadeLayoutRoleForHinge : moduleRoleNorm,
        hingeModuleLocalBuild: isHingeCatalogModule,
        facadeThinShell,
        facadeShellDepthMm: facadeThinShell ? Number(size.z) || 16 : 0,
        hingeCatalogSourceItem: isHingeCatalogModule ? item : parentSection?.hingeCatalogSourceItem || null,
        hingeFacadeDrillTemplateId: hingeDrillForModule.facade || 0,
        hingeDoorDrillTemplateId: hingeDrillForModule.door || 0,
        // Inset уже в size.z оболочки; детям каталога не передаём (иначе buildSection вычтет ещё раз).
        facadeThicknessOffset: 0,
        _cldSectionContext: parentSection,
      };
      if (isHingeCatalogModule && facadeLayoutRoleForHinge) {
        group.userData.hingeFacadeLayoutRole = facadeLayoutRoleForHinge;
      }

      this._dbg(`📦 buildModule "${moduleName}": resolve`, {
        elementType,
        elementId,
        childrenCount: templateTree.length,
        size,
        pos,
        facadeDepthInsetMm: inheritedFacadeFt > 0 && this._moduleRoleUsesFacadeDepthInset(moduleRoleNorm) ? inheritedFacadeFt : 0,
      });

      this._catalogModuleBuildDepth = (this._catalogModuleBuildDepth || 0) + 1;
      try {
        templateTree.forEach((child) => {
          const childItem = JSON.parse(JSON.stringify(child));
          this._normalizeAdminFields(childItem);
          const built = this.buildItem(childItem, moduleSectionContext);
          if (built) group.add(built);
        });
      } finally {
        this._catalogModuleBuildDepth = Math.max(0, (this._catalogModuleBuildDepth || 0) - 1);
      }
      if (etLowerModule === 'catalog_33' && elementId) {
        const noHandle = this._readDrawerNoHandleFlag('catalog_33', elementId) || group.userData.cldDrawerNoHandle;
        if (noHandle) {
          group.userData.cldDrawerCatalogId = elementId;
          group.userData.cldDrawerNoHandle = true;
          item.spec = { ...(item.spec || {}), drawer_no_handle: 1 };
        }
        if (group.userData.cldDrawerNoHandle) {
          group.traverse((child) => {
            child.userData.cldDrawerCatalogId = elementId;
            child.userData.cldDrawerNoHandle = true;
          });
        }
      }
      // В комнате Z/X задаёт _finalize*CatalogHinges* (реф build_hinges). overlayRemap — только без каталожных GLB.
      if (isHingeCatalogModule && hingeIntrinsic) {
        const thinHingeShell =
          this._isThinFacadeShellDepth(parentShellDepthMm) ||
          this._isThinFacadeShellDepth(Number(size.z));
        if (!this._useCatalogHingeModulesInRoom() || thinHingeShell) {
          this._applyHingeCatalogOverlayDepthRemap(group, item, parentSection, hingeIntrinsic);
        }
      }
      if (this._isFacadeLayoutRole(moduleRoleNorm)) {
        this._measureFacadeCorpusGapMm(group, parentSection, moduleRoleNorm, moduleName);
      }
      if (hasCatalogHinges && this._useCatalogHingeModulesInRoom()) {
        if (this._facadeHingeContext?.roleLayoutVerify) {
          group.userData.hingeRoleLayoutVerify = {
            ...this._facadeHingeContext.roleLayoutVerify,
          };
        }
        if (this._facadeHingeContext?.roleLayoutAccSnapshot) {
          group.userData.hingeRoleLayoutAccSnapshot = {
            ...this._facadeHingeContext.roleLayoutAccSnapshot,
          };
        }
        if (this._facadeHingeContext?.facadeRoleLayoutCatalogItemId) {
          group.userData.facadeRoleLayoutCatalogItemId =
            this._facadeHingeContext.facadeRoleLayoutCatalogItemId;
        }
        this._finalizeFacadeCatalogHingesAfterBuild(group, item, size);
        if (this._hingeVerifyDbg()) {
          this._logFacadeHingesVerifyAfterFinalize(group, item, size, parentSection);
        }
      }
      // Автономную петлю (sibling двери) финализируем в конце buildSection — иначе при порядке
      // children «петля → дверь» во время buildModule ещё нет __door_swing.
    } else if (String(elementType || '').toLowerCase() === 'hinges') {
      // Дерева нет — legacy-кубы только без каталожных hinge_layout в дереве фасада.
      if (!this._useCatalogHingeModulesInRoom()) {
        this._buildHingeModuleForSection(group, item, parentSection, { size, pos });
      }
    } else {
      // Fallback: placeholder box (чтобы не ломать сцену при пустом/не найденном каталоге)
      console.warn(`⚠️ Module "${moduleName}" not resolved from catalog`, { elementType, elementId, item });
      const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
      const material = new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        metalness: 0.3,
        roughness: 0.6,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `ModulePlaceholder_${moduleName}`;
      group.add(mesh);
    }

    if (this._isFacadeLayoutRole(moduleRoleNorm)) {
      group.userData.originalSize = {
        x: Number(size.x) || 0,
        y: Number(size.y) || 0,
        z: Number(size.z) || 0,
      };
    }

    this._maybeSpawnShelfPropsOnShelf(group, item, size, moduleRoleNorm);
    this._invokeItemEvent(item, 'on_after_build', { parentSection, target: group, size, pos, pivot });
    return group;
  }

  /**
   * IKEA propping: вещи на верхней пласти полки (ymax), не сетка штанги.
   * Конфиг — interiorTemplates.shelfProps карточки наполнения. Не BOM, не bbox.
   */
  _maybeSpawnShelfPropsOnShelf(group, item, size, moduleRoleNorm) {
    if (this._isFurnitureGhost) return;
    const role = this._normalizeLayoutRoleKey(
      moduleRoleNorm || item?.layout_role || item?.sectionLayoutRole || ''
    );
    if (role === 'zone_divider' || role === 'drawer' || role === 'drawer_internal') return;
    const isShelf = role === 'shelf' || this._isFlatCatalogShelfModuleItem(item);
    if (!isShelf) return;
    // Метка хоста — чтобы шаг 7 мог resync без полной пересборки шкафа.
    group.userData = group.userData || {};
    group.userData.cldShelfPropHost = {
      sizeMm: {
        x: Number(size?.x) || 0,
        y: Number(size?.y) || 0,
        z: Number(size?.z) || 0,
      },
      mixKey: String(this._shelfPropMixKey || ''),
      role,
    };
    // Lifestyle полки: только при ROOM_SHELF_LIFESTYLE_ENABLED (шаг 7 — видимость).
    if (
      typeof globalThis !== 'undefined' &&
      typeof globalThis.__cldRoomShelfLifestyleEnabled === 'function' &&
      !globalThis.__cldRoomShelfLifestyleEnabled()
    ) {
      return;
    }
    const cfg = this._shelfPropsConfig;
    if (!cfg || !cfg.enabled || !cfg.slots || !cfg.slots.length) return;
    const api = typeof globalThis !== 'undefined' ? globalThis.__cldShelfProps : null;
    const THREERef = typeof globalThis !== 'undefined' ? globalThis.THREE : null;
    if (!api || typeof api.spawnShelfPropsIntoGroup !== 'function' || !THREERef) return;
    const token = {};
    group.userData._shelfPropToken = token;
    const shelfIndex = Number(this._shelfPropShelfIndex) || 0;
    this._shelfPropShelfIndex = shelfIndex + 1;
    if (!this._shelfPropPending) this._shelfPropPending = [];
    this._shelfPropPending.push({
      group,
      size,
      shelfIndex,
      token,
      cfg,
    });
  }

  _worldBoxOfShelfBoard(group) {
    const THREERef = typeof globalThis !== 'undefined' ? globalThis.THREE : null;
    const api = typeof globalThis !== 'undefined' ? globalThis.__cldShelfProps : null;
    if (api && typeof api.worldMeshUnionBox === 'function' && THREERef) {
      return api.worldMeshUnionBox(group, THREERef);
    }
    if (!group || !THREERef) return null;
    group.updateMatrixWorld(true);
    const box = new THREERef.Box3().setFromObject(group);
    return box.isEmpty() ? null : box;
  }

  _openingMmForShelf(entry, all) {
    const box = entry?.box;
    if (!box) return 0;
    const cx = (box.min.x + box.max.x) * 0.5;
    const cz = (box.min.z + box.max.z) * 0.5;
    let nextMinY = Infinity;
    for (let i = 0; i < all.length; i++) {
      const o = all[i];
      if (!o || o === entry || !o.box) continue;
      const ocx = (o.box.min.x + o.box.max.x) * 0.5;
      const ocz = (o.box.min.z + o.box.max.z) * 0.5;
      if (Math.abs(ocx - cx) > 100 || Math.abs(ocz - cz) > 100) continue;
      if (o.box.min.y > box.max.y + 1) {
        nextMinY = Math.min(nextMinY, o.box.min.y);
      }
    }
    if (nextMinY < Infinity) return nextMinY - box.max.y;
    const THREERef = typeof globalThis !== 'undefined' ? globalThis.THREE : null;
    if (!THREERef) return 0;
    let n = entry.group && entry.group.parent;
    for (let k = 0; k < 16 && n; k++) {
      n.updateMatrixWorld(true);
      const pb = new THREERef.Box3().setFromObject(n);
      if (!pb.isEmpty() && pb.max.y > box.max.y + 40) {
        const topPanel = 16;
        return Math.max(0, pb.max.y - topPanel - box.max.y);
      }
      n = n.parent;
    }
    return 0;
  }

  _flushShelfProps() {
    const pending = this._shelfPropPending || [];
    this._shelfPropPending = [];
    if (!pending.length) return;
    const api = typeof globalThis !== 'undefined' ? globalThis.__cldShelfProps : null;
    const THREERef = typeof globalThis !== 'undefined' ? globalThis.THREE : null;
    if (!api || typeof api.spawnShelfPropsIntoGroup !== 'function' || !THREERef) return;
    const infos = pending.map((p) => {
      if (p.group) p.group.updateMatrixWorld(true);
      return { ...p, box: this._worldBoxOfShelfBoard(p.group) };
    });
    void this._flushShelfPropsAsync(infos, api, THREERef);
  }

  async _flushShelfPropsAsync(infos, api, THREERef) {
    const lifestyleOn =
      typeof globalThis !== 'undefined' &&
      typeof globalThis.__cldRoomShelfLifestyleEnabled === 'function' &&
      globalThis.__cldRoomShelfLifestyleEnabled();
    if (lifestyleOn && typeof api.buildRoomLifestyleShelfPropsConfig === 'function') {
      try {
        const loader =
          typeof globalThis !== 'undefined' ? globalThis.__cldRoomCabinetModels : null;
        const map =
          loader && typeof loader.ensureCabinetModelLibraryMap === 'function'
            ? await loader.ensureCabinetModelLibraryMap()
            : {};
        const lifestyleCfg = api.buildRoomLifestyleShelfPropsConfig(map || {});
        if (lifestyleCfg?.enabled && lifestyleCfg.slots?.length) {
          for (let i = 0; i < infos.length; i++) {
            if (infos[i]) infos[i].cfg = lifestyleCfg;
          }
        }
      } catch (_) {}
    }
    const sorted = infos.slice().sort((a, b) => {
      const acx = a.box ? (a.box.min.x + a.box.max.x) * 0.5 : 0;
      const bcx = b.box ? (b.box.min.x + b.box.max.x) * 0.5 : 0;
      if (Math.abs(acx - bcx) > 80) return acx - bcx;
      const ay = a.box ? a.box.max.y : 0;
      const by = b.box ? b.box.max.y : 0;
      return ay - by;
    });
    // Ранг в колонке: 0 = низ … 1 = верх (для пустых как у IKEA).
    const colBuckets = new Map();
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      if (!p?.box) continue;
      const cx = (p.box.min.x + p.box.max.x) * 0.5;
      const colKey = Math.round(cx / 80) * 80;
      if (!colBuckets.has(colKey)) colBuckets.set(colKey, []);
      colBuckets.get(colKey).push(p);
    }
    colBuckets.forEach((list) => {
      list.sort((a, b) => (a.box?.max.y || 0) - (b.box?.max.y || 0));
      const n = list.length;
      for (let j = 0; j < n; j++) {
        list[j].colRank01 = n <= 1 ? 0.5 : j / (n - 1);
      }
    });
    const lastKindByCol = new Map();
    const usedModelIds = new Map();
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      if (!p?.group || !p.cfg) continue;
      const openingMm = this._openingMmForShelf(p, infos);
      const token = p.token;
      const cx = p.box ? (p.box.min.x + p.box.max.x) * 0.5 : 0;
      const colKey = Math.round(cx / 80) * 80;
      const prevKind = lastKindByCol.get(colKey) || '';
      const excludeKinds = prevKind ? new Set([prevKind]) : new Set();
      let result = null;
      try {
        result = await api.spawnShelfPropsIntoGroup({
          group: p.group,
          config: p.cfg,
          THREE: THREERef,
          sizeMm: p.size,
          shelfIndex: p.shelfIndex,
          mixKey: this._shelfPropMixKey,
          onePerShelf: true,
          openingMm,
          excludeKinds,
          usedModelIds,
          colRank01: p.colRank01,
          isStale: () => p.group.userData?._shelfPropToken !== token,
        });
      } catch (_) {
        result = null;
      }
      const kind =
        result && typeof result === 'object'
          ? String(result.kind || '').trim().toLowerCase()
          : '';
      if (kind) lastKindByCol.set(colKey, kind);
      else if (result && typeof result === 'object' && Number(result.spawned) > 0) {
        lastKindByCol.delete(colKey);
      }
    }
  }

  /**
   * После сборки facades_* с каталожными петлями: X/Z в тонкой оболочке (16 мм),
   * фасадная половина hinge_animator — в __door_swing. Y не трогаем (раскладка по ролям).
   */
  /** Каталожные module+hinges лежат внутри Section, не среди прямых children фасада. */
  /**
   * X модуля петли: центр совпадает с осью __door_swing в local space общего родителя (Section).
   * Не min/max оболочки — иначе при ly петли оказываются на противоположном краю.
   */
  _placeCatalogHingeModuleXOnDoorAxis(hingeMod, swing, facadeGroup, modW, relX) {
    if (!hingeMod || !swing || typeof THREE === 'undefined') return null;
    facadeGroup.updateMatrixWorld(true);
    const swingWorld = new THREE.Vector3();
    swing.getWorldPosition(swingWorld);
    const parent = hingeMod.parent;
    if (!parent) return null;
    parent.updateMatrixWorld(true);
    const pivotLocal = parent.worldToLocal(swingWorld.clone());
    const centerX = Number(pivotLocal.x) || 0;
    hingeMod.position.x = centerX - modW / 2 + relX;
    return { centerX, appliedX: hingeMod.position.x, pivotWorldX: swingWorld.x };
  }

  _boxExtremeZInAncestorLocal(obj, ancestor, pickMax) {
    if (!obj || !ancestor || typeof THREE === 'undefined') return null;
    const box = new THREE.Box3().setFromObject(obj);
    if (box.isEmpty()) return null;
    const corners = [
      new THREE.Vector3(box.min.x, box.min.y, box.min.z),
      new THREE.Vector3(box.max.x, box.min.y, box.min.z),
      new THREE.Vector3(box.min.x, box.max.y, box.min.z),
      new THREE.Vector3(box.max.x, box.max.y, box.min.z),
      new THREE.Vector3(box.min.x, box.min.y, box.max.z),
      new THREE.Vector3(box.max.x, box.min.y, box.max.z),
      new THREE.Vector3(box.min.x, box.max.y, box.max.z),
      new THREE.Vector3(box.max.x, box.max.y, box.max.z),
    ];
    let z = pickMax ? -Infinity : Infinity;
    for (const c of corners) {
      const p = ancestor.worldToLocal(c);
      z = pickMax ? Math.max(z, p.z) : Math.min(z, p.z);
    }
    return Number.isFinite(z) ? z : null;
  }

  _findFacadeMeshForHingeAlign(facadeGroup, swing) {
    let found = null;
    const tryPick = (root) => {
      if (!root || found) return;
      root.traverse((o) => {
        if (found || !o.isMesh) return;
        if (o.userData?.isFacade) found = o;
      });
    };
    if (swing) tryPick(swing);
    if (!found && facadeGroup) tryPick(facadeGroup);
    return found;
  }

  /**
   * Тонкая оболочка (16 мм): каталог петли глубже — без сдвига вперёд по Z торчит корпусная половина.
   * Подтягиваем модуль так, чтобы max Z петли ≤ max Z фасада (в local родителя Section).
   */
  _alignCatalogHingeModuleZToFacade(hingeMod, facadeGroup, swing, shellD) {
    if (!hingeMod || typeof THREE === 'undefined') return 0;
    const depth = Math.max(1, Number(shellD) || 16);
    if (depth > 24) return 0;
    const parent = hingeMod.parent;
    const facadeMesh = this._findFacadeMeshForHingeAlign(facadeGroup, swing);
    if (!parent || !facadeMesh) return 0;

    facadeGroup.updateMatrixWorld(true);
    parent.updateMatrixWorld(true);

    const facadeMaxZ = this._boxExtremeZInAncestorLocal(facadeMesh, parent, true);
    let hingeMaxZ = this._boxExtremeZInAncestorLocal(hingeMod, parent, true);
    if (facadeMaxZ == null || hingeMaxZ == null) return 0;

    let shift = facadeMaxZ - hingeMaxZ;
    if (!(shift < -0.05)) return 0;

    hingeMod.position.z += shift;
    hingeMod.updateMatrixWorld(true);

    hingeMaxZ = this._boxExtremeZInAncestorLocal(hingeMod, parent, true);
    if (hingeMaxZ != null && hingeMaxZ > facadeMaxZ + 0.05) {
      hingeMod.position.z -= hingeMaxZ - facadeMaxZ;
    }

    hingeMod.traverse((o) => {
      if (o === hingeMod) return;
      if (o.userData?.isAnimator && String(o.userData.animatorId || '').toLowerCase() === 'hinge_animator') {
        return;
      }
      if (o.isMesh || o.isGroup) {
        if (Number(o.position.z) > depth) o.position.z = 0;
      }
    });

    return shift;
  }

  _resolveHingeLayoutAnchorYMm(hingeMod) {
    if (!hingeMod) return 0;
    const stored = Number(hingeMod.userData?.hingeLayoutAnchorYMm);
    if (Number.isFinite(stored)) return stored;
    const sp = hingeMod.userData?.hingeSpec || {};
    const fromSpec = Number(sp.hingeLayoutAnchorOffsetYMm);
    if (Number.isFinite(fromSpec)) return fromSpec;
    const refY =
      Number(hingeMod.userData?.hingeModuleSizeMm?.y) ||
      Number(sp.ref_size_mm?.y) ||
      35;
    return refY > 0 && refY <= 80 ? refY / 2 : 0;
  }

  _collectFacadeCatalogHingeModules(facadeRoot) {
    const out = [];
    const seen = new Set();
    if (!facadeRoot || typeof facadeRoot.traverse !== 'function') return out;
    facadeRoot.traverse((o) => {
      if (!o || !o.isGroup) return;
      if (seen.has(o.uuid)) return;
      if (o.userData && o.userData.isCatalogHingeModule) {
        seen.add(o.uuid);
        out.push(o);
        return;
      }
      const nm = String(o.name || '');
      if (/^Module_/i.test(nm) && /петл|hinge/i.test(nm)) {
        seen.add(o.uuid);
        out.push(o);
      }
    });
    return out;
  }

  /**
   * После сборки всех children секции: автономные каталожные петли (прямые дети groupRef).
   * Порядок JSON «петля → дверь» даёт __door_swing только здесь, не в конце buildModule.
   */
  _finalizeStandaloneCatalogHingesInSection(sectionGroup, sectionContext) {
    if (!sectionGroup || !sectionContext) return;
    if (!this._useCatalogHingeModulesInRoom()) return;
    const hingeMods = [];
    sectionGroup.traverse((o) => {
      if (o && o.isGroup && o.userData && o.userData.isCatalogHingeModule) {
        hingeMods.push(o);
      }
    });
    for (let i = 0; i < hingeMods.length; i++) {
      this._finalizeStandaloneCatalogHingeModule(hingeMods[i], sectionContext);
    }
  }

  /** align X + reparent hinge_animator → __door_swing (секция уже содержит swing). */
  _finalizeStandaloneCatalogHingeModule(hingeMod, parentSection) {
    if (!hingeMod || !this._useCatalogHingeModulesInRoom()) return;
    if (hingeMod.userData?.cldHingeRoomFinalized) return;
    const { swing, facadeGroup } = this._resolveDoorSwingAndFacadeGroupForHinge(hingeMod, parentSection);
    if (!swing || !facadeGroup) {
      if (this._hingeRoomDbg()) {
        console.warn('[CLD][HINGE-ROOM] standalone hinge: нет swing/facade', {
          hingeName: hingeMod.name,
          hasParentSection: !!parentSection,
        });
      }
      return;
    }
    if (swing.userData?.cldDoorDirection) {
      hingeMod.userData.cldDoorDirection = swing.userData.cldDoorDirection;
    }
    if (this._hingeCorpusOnlyMode()) {
      if (this._hingeRoomDbg()) {
        console.warn('[CLD][HINGE-ROOM] corpus-only: skip reparent/facade finalize', hingeMod.name);
      }
      return;
    }
    this._alignCatalogHingeCupYFromRoleLayout(hingeMod, swing, facadeGroup);
    this._reparentCatalogHingeAnimatorsToSwing(hingeMod, swing);
    this._applyCatalogHingeRefRotationsBeforeZAlign(hingeMod, swing);
    // Все catalog-петли: один Bazis-placer (шов = пласть×торец). Без BLB facadeZ/X/moduleX.
    this._placeHingePackageOnSeam(hingeMod, swing, facadeGroup);
    this._detachLSeamFacadeToHingeAnimatorAfterAlign(hingeMod, swing);
    facadeGroup.updateMatrixWorld(true);
    this._applyRoomDoorPivotOffsetOnFacadeGroup(facadeGroup);
    if (swing) {
      this._reassertHingeAnimatorsOnDoorSwing(swing);
      this._finalizeHingeFacadeSwingPoseAfterReparent(swing);
    }
    this._applyRoomCatalogHingeZDepthOffsets(hingeMod, swing, facadeGroup, parentSection);
    hingeMod.userData = hingeMod.userData || {};
    hingeMod.userData.cldHingeRoomFinalized = true;
    if (this._hingeRoomVerbose()) {
      console.warn('[CLD][HINGE-ROOM] standalone hinge finalized', hingeMod.name);
    }
  }

  /** Секция → groupRef → вложенный __door_swing; facadeGroup = swing.parent (контейнер buildFacade). */
  _resolveDoorSwingAndFacadeGroupForHinge(hingeMod, parentSection) {
    if (!hingeMod) return { swing: null, facadeGroup: null };

    const wantDir = String(hingeMod.userData?.cldDoorDirection || '').toLowerCase();
    const swings = [];
    const seen = new Set();
    let cursor = hingeMod.parent;
    for (let i = 0; i < 64 && cursor; i++) {
      if (typeof cursor.traverse === 'function') {
        cursor.traverse((o) => {
          if (!o || o.name !== '__door_swing' || seen.has(o.uuid)) return;
          const dsw = o.userData && o.userData.cldDoorSwing;
          if (!dsw) return;
          seen.add(o.uuid);
          swings.push(o);
        });
      }
      cursor = cursor.parent;
    }

    if (swings.length) {
      const matched =
        (wantDir &&
          swings.find(
            (s) => String(s.userData?.cldDoorDirection || '').toLowerCase() === wantDir
          )) ||
        swings.find((s) => s.userData?.cldDoorSwing?.isFacadeMaster === true) ||
        swings[0];
      return { swing: matched, facadeGroup: matched.parent || null };
    }

    let swing = null;
    let p = parentSection;
    for (let i = 0; i < 48 && p && !swing; i++) {
      const rg = p.groupRef;
      if (rg && typeof rg.getObjectByName === 'function') {
        const s = rg.getObjectByName('__door_swing');
        if (s) swing = s;
      }
      p = p.parent;
    }
    if (
      !swing &&
      hingeMod.parent &&
      typeof hingeMod.parent.getObjectByName === 'function'
    ) {
      swing = hingeMod.parent.getObjectByName('__door_swing');
    }
    const facadeGroup = swing && swing.parent ? swing.parent : null;
    return { swing, facadeGroup };
  }

  _reassertHingeAnimatorsOnDoorSwing(doorSwing) {
    if (!doorSwing || typeof doorSwing.traverse !== 'function') return;
    doorSwing.traverse((o) => {
      if (String(o?.userData?.animatorId || '').toLowerCase() !== 'hinge_animator') return;
      if (o.parent !== doorSwing) doorSwing.attach(o);
      o.userData = o.userData || {};
      o.userData._cldHingeReparentedToSwing = doorSwing.uuid;
      this._neutralizeHingeAnimatorSwingState(o);
    });
    doorSwing.updateMatrixWorld(true);
  }

  _refinalizeHingeFacadeZAfterPose(hingeMod, swing, facadeGroup) {
    // Bazis-only: BLB facadeZ больше не вызываем ни для L, ни для обычных catalog.
    void hingeMod;
    void swing;
    void facadeGroup;
  }

  /** Секция/модель «Петля накладная корпус» — не крутится с дверью, остаётся в hingeMod. */
  _isHingeAnimatorCorpusBranch(node) {
    if (!node) return false;
    if (node.userData?.hingePart === 'corpus' || node.userData?.hingePart === 'door') return true;
    const specId = String(node.userData?.modelSpecId || '').trim();
    // Только корпусная половина петли (#6). #7 в cabinet_model — направляющие, не петля.
    if (specId === '6') return true;
    const nm = String(node.name || '').toLowerCase();
    if (/накладная.*корпус|петл.*корпус|hinge.*corpus|furni_hinge_door/.test(nm)) {
      return true;
    }
    if (node.userData?.isSection) {
      let hasCorpus = false;
      node.traverse((c) => {
        if (!c || c === node) return;
        const sid = String(c.userData?.modelSpecId || '').trim();
        const cn = String(c.name || '').toLowerCase();
        if (sid === '6' || /корпус/.test(cn) || c.userData?.hingePart === 'corpus') hasCorpus = true;
      });
      return hasCorpus;
    }
    return false;
  }

  /**
   * catalog_31: корпус — sibling секции внутри hinge_animator. Перед reparent в swing
   * отцепляем корпус в hingeMod (реф: корпус на боковине, фасад на полотне).
   */
  _detachHingeCorpusSubtreeFromSwingAnimator(animRoot, hingeMod) {
    if (!animRoot || !hingeMod || typeof THREE === 'undefined') return 0;
    let moved = 0;
    const kids = [...(animRoot.children || [])];
    for (const ch of kids) {
      if (!this._isHingeAnimatorCorpusBranch(ch)) continue;
      if (ch.parent === hingeMod) continue;
      hingeMod.attach(ch);
      ch.userData = ch.userData || {};
      ch.userData._cldHingeCorpusDetachedFromSwing = true;
      moved++;
    }
    if (moved) {
      hingeMod.updateMatrixWorld(true);
      animRoot.updateMatrixWorld(true);
    }
    return moved;
  }

  _reparentCatalogHingeAnimatorsToSwing(hingeMod, swing) {
    if (!hingeMod || !swing) return;
    const swingRoots = [];
    hingeMod.traverse((o) => {
      if (!o.userData?.isAnimator) return;
      if (String(o.userData.animatorId || '').toLowerCase() !== 'hinge_animator') return;
      swingRoots.push(o);
    });
    // Реф _setupHingeModuleSwingReparent: attach при ЗАКРЫТОЙ двери (swing=0).
    // Иначе attach запекает текущий угол двери (85°) в локальный поворот петли —
    // и фасадная половина «вечно открыта» (rotY=-85 при закрытой двери).
    this._withDoorSwingClosedForHingeAlign(swing, () => {
      for (const sub of swingRoots) {
        this._detachHingeCorpusSubtreeFromSwingAnimator(sub, hingeMod);
        if (sub.parent !== swing) swing.attach(sub);
        sub.userData = sub.userData || {};
        sub.userData._cldHingeOwnerUuid = hingeMod.uuid;
        sub.userData._cldHingeReparentedToSwing = swing.uuid;
        this._stripHingeCatalogAnimatorOwnSwing(sub);
        this._neutralizeHingeAnimatorSwingState(sub);
      }
    });
    swing.updateMatrixWorld(true);
    this._addHingeDebugSectionVolumes(hingeMod, swingRoots, swing);
  }

  _resolveHingeAnimatorWorldPos(hingeMod, out) {
    const v = out || new THREE.Vector3();
    let anim = null;
    if (hingeMod && typeof hingeMod.traverse === 'function') {
      hingeMod.traverse((o) => {
        if (anim) return;
        if (!o?.userData?.isAnimator) return;
        if (String(o.userData.animatorId || '').toLowerCase() !== 'hinge_animator') return;
        anim = o;
      });
    }
    if (anim) {
      anim.updateMatrixWorld(true);
      return anim.getWorldPosition(v);
    }
    if (hingeMod) {
      hingeMod.updateMatrixWorld(true);
      return hingeMod.getWorldPosition(v);
    }
    return v.set(0, 0, 0);
  }

  _collectHingeVerifyRow(hingeMod, facadeGroup, facadeShellBox) {
    const wpMod = new THREE.Vector3();
    const wpAnim = new THREE.Vector3();
    const wpCup = new THREE.Vector3();
    hingeMod.updateMatrixWorld(true);
    hingeMod.getWorldPosition(wpMod);
    this._resolveHingeAnimatorWorldPos(hingeMod, wpAnim);
    let swing = null;
    for (let p = hingeMod.parent; p && !swing; p = p.parent) {
      if (p.name === '__door_swing' || p.userData?.cldDoorSwing) swing = p;
    }
    if (!swing && facadeGroup) {
      facadeGroup.traverse((o) => {
        if (!swing && o?.name === '__door_swing') swing = o;
      });
    }
    const panelBox = this._facadePanelWorldBox(facadeGroup, swing);
    const refBox = panelBox && !panelBox.isEmpty() ? panelBox : facadeShellBox;
    const animRoots = this._collectHingeAnimatorRootsForHingeModule(hingeMod, swing);
    let cupFromBottom = null;
    if (animRoots.length && refBox) {
      const cupW = this._resolveHingeCupCenterWorldY(animRoots[0], wpCup);
      if (cupW && refBox) cupFromBottom = Math.round(cupW.y - refBox.min.y);
    }
    const facadeMinY = refBox ? refBox.min.y : facadeShellBox ? facadeShellBox.min.y : 0;
    const yWorldFromFacadeBottom = wpMod.y - facadeMinY;
    const yAnimFromFacadeBottom = wpAnim.y - facadeMinY;
    const slot = Number.isFinite(Number(hingeMod.userData?.hingeLayoutSlotIndex))
      ? Number(hingeMod.userData.hingeLayoutSlotIndex)
      : null;
    const expected = Number(hingeMod.userData?.hingeRoleExpectedYMm);
    const treePos = Number(hingeMod.userData?.hingeRoleTreePosYMm);
    const doorDir = String(hingeMod.userData?.cldDoorDirection || '').toLowerCase() || null;
    const deltaCup =
      Number.isFinite(expected) && cupFromBottom != null ? cupFromBottom - expected : null;
    const deltaGroup =
      Number.isFinite(expected) ? Math.round((Number(hingeMod.position?.y) || 0) - expected) : null;
    const tolMm = 3;
    const ok =
      Number.isFinite(expected) &&
      cupFromBottom != null
        ? Math.abs(cupFromBottom - expected) <= tolMm
        : Number.isFinite(expected) &&
          (Math.abs((deltaGroup || 0)) <= tolMm);
    return {
      slot,
      name: hingeMod.name,
      doorDir,
      facadeRole: hingeMod.userData?.hingeFacadeLayoutRole || null,
      posX: Math.round((Number(hingeMod.position?.x) || 0) * 10) / 10,
      expectedYMm: Number.isFinite(expected) ? expected : null,
      treePosYMm: Number.isFinite(treePos) ? treePos : null,
      groupPosY: Number(hingeMod.position?.y) || 0,
      worldY: wpMod.y,
      animatorWorldY: wpAnim.y,
      yLabelFromFacadeBottom: Math.round(yWorldFromFacadeBottom),
      yAnimFromFacadeBottom: Math.round(yAnimFromFacadeBottom),
      yCupFromFacadeBottom: cupFromBottom,
      deltaCupVsExpected: deltaCup,
      deltaLabelVsExpected:
        Number.isFinite(expected) ? Math.round(yWorldFromFacadeBottom - expected) : null,
      deltaAnimVsExpected:
        Number.isFinite(expected) ? Math.round(yAnimFromFacadeBottom - expected) : null,
      deltaGroupPosVsExpected: deltaGroup,
      ok,
    };
  }

  _logHingeRoom(tag, payload) {
    if (!this._hingeRoomDbg()) return;
    if (typeof ClodisBuilder._pushHingeRoomBuildLog === 'function') {
      ClodisBuilder._pushHingeRoomBuildLog(tag, payload);
    }
  }

  _hingeRoomVerbose() {
    return typeof window !== 'undefined' && window.DEBUG_HINGE_ROOM_VERBOSE === true;
  }

  _warnHingeRoomVerbose(msg, payload) {
    if (!this._hingeRoomDbg() || !this._hingeRoomVerbose()) return;
    if (payload !== undefined) console.warn(msg, payload);
    else console.warn(msg);
  }

  _snapshotHingeRoleLayoutAcc(layoutAcc, doorH, gen) {
    if (!layoutAcc) return null;
    const expectedYs =
      gen && typeof gen.calcIntegerRoleHingeYs === 'function'
        ? gen.calcIntegerRoleHingeYs(layoutAcc, doorH)
        : [];
    return {
      count: layoutAcc.count,
      hingeAxis: layoutAcc.hingeAxis,
      insetTopMm: layoutAcc.hingeInsetTopMm,
      insetBottomMm: layoutAcc.hingeInsetBottomMm,
      expectedYsMm: expectedYs,
      fromRoleLayout: !!layoutAcc.__hingeRoleLayout,
      usedFallback: !!layoutAcc.__hingeRoleFallback,
    };
  }

  _findFacadeShellGroupForHinge(hingeMod) {
    let p = hingeMod?.parent;
    for (let i = 0; i < 48 && p; i++) {
      const lr = String(p.userData?.layoutRole || '').trim();
      if (lr === 'facades' || lr === 'facades_main' || lr === 'facades_top') return p;
      if (p.userData?.hingeRoleLayoutVerify || p.userData?.hingeRoleLayoutAccSnapshot) return p;
      if (p.userData?.isFacade && lr) return p;
      p = p.parent;
    }
    return null;
  }

  _walkHingeLayoutNodesInTree(nodes, out, path) {
    if (!Array.isArray(nodes)) return;
    const basePath = path || '';
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (!n || typeof n !== 'object') continue;
      const et = String(n?.spec?.element_type || '').toLowerCase();
      const seg =
        et === 'catalog_28'
          ? `cat${n?.spec?.id || '?'}`
          : et === 'hinges'
            ? 'hingeTpl'
            : String(n?.type || 'node');
      const nodePath = basePath ? `${basePath}/${seg}` : seg;
      if (et === 'hinges' || (String(n?.type || '').toLowerCase() === 'module' && et === 'hinges')) {
        const isExpanded = String(n.id || '').startsWith('hinge_layout_');
        out.push({
          path: nodePath,
          id: n.id,
          expanded: isExpanded,
          pos: n.pos ? { x: n.pos.x, y: n.pos.y, z: n.pos.z } : null,
          expectedYMm: n.__hingeRoleExpectedYMm ?? null,
        });
      }
      if (Array.isArray(n.children)) this._walkHingeLayoutNodesInTree(n.children, out, nodePath);
      if (Array.isArray(n?.spec?.template_tree)) {
        this._walkHingeLayoutNodesInTree(n.spec.template_tree, out, nodePath);
      }
    }
  }

  _logHingeModuleBuiltState(tag, group, item, pos, size, parentSection) {
    if (!this._hingeVerifyDbg()) return;
    const payload = {
      name: group?.name,
      slot: group?.userData?.hingeLayoutSlotIndex,
      doorDir: group?.userData?.cldDoorDirection || null,
      facadeRole: group?.userData?.hingeFacadeLayoutRole || null,
      itemPos: { x: item?.pos?.x, y: item?.pos?.y, z: item?.pos?.z },
      builtPos: { x: pos?.x, y: pos?.y, z: pos?.z },
      groupPos: {
        x: group?.position?.x,
        y: group?.position?.y,
        z: group?.position?.z,
      },
      expectedYMm: group?.userData?.hingeRoleExpectedYMm,
      treePosYMm: group?.userData?.hingeRoleTreePosYMm,
      parentSection: parentSection?.name,
      parentSize: parentSection?.size,
      moduleSize: size,
      pivot: item?.pivot ? { x: item.pivot.x, y: item.pivot.y, z: item.pivot.z } : null,
    };
    console.warn(`[CLD][HINGE-VERIFY][${tag}]`, payload);
  }

  _logFacadeHingesVerifyAfterFinalize(facadeGroup, item, shellSize, parentSection) {
    if (!this._hingeVerifyDbg() || !facadeGroup) return;
    const facadeShellBox = new THREE.Box3();
    let hasBox = false;
    facadeGroup.traverse((o) => {
      if (!o?.isMesh) return;
      if (o.userData?.isCatalogHingeModule) return;
      let p = o.parent;
      while (p) {
        if (p.userData?.isCatalogHingeModule) return;
        p = p.parent;
      }
      try {
        const b = new THREE.Box3().setFromObject(o);
        if (!hasBox) {
          facadeShellBox.copy(b);
          hasBox = true;
        } else {
          facadeShellBox.union(b);
        }
      } catch (_) {}
    });
    const hingeMods = this._collectFacadeCatalogHingeModules(facadeGroup);
    const rows = hingeMods.map((hm) => this._collectHingeVerifyRow(hm, facadeGroup, hasBox ? facadeShellBox : null));
    rows.sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
    const bad = rows.filter((r) => r.ok === false);
    const summary = {
      facade: facadeGroup.name,
      layoutRole: facadeGroup.userData?.layoutRole || null,
      catalogItemId: facadeGroup.userData?.facadeRoleLayoutCatalogItemId || null,
      layoutVerify: facadeGroup.userData?.hingeRoleLayoutVerify || null,
      layoutAcc: facadeGroup.userData?.hingeRoleLayoutAccSnapshot || null,
      shellSize: { x: shellSize?.x, y: shellSize?.y, z: shellSize?.z },
      hingeCount: rows.length,
      okCount: rows.filter((r) => r.ok === true).length,
      badCount: bad.length,
      facadeShellBox: hasBox
        ? {
            min: facadeShellBox.min.toArray(),
            max: facadeShellBox.max.toArray(),
            h: facadeShellBox.max.y - facadeShellBox.min.y,
          }
        : null,
      facadeGroupPos: facadeGroup.position.toArray(),
      parentSection: parentSection?.name,
    };
    console.warn('[CLD][HINGE-VERIFY][finalize/scene]', { ...summary, hinges: rows });
    this._logHingeRoom('finalize/scene', { ...summary, hinges: rows });
    if (this._hingeRoomVerbose()) {
      if (bad.length) {
        console.table(bad);
      } else if (rows.length) {
        console.table(rows);
      }
    }
  }

  /**
   * Реф constructor-clodis _setupHingeModuleSwingReparent + Door_new.build_hinges:
   * корпусная половина остаётся в module; hinge_animator (фасад + присадка id:3) → __door_swing.
   * Z/X задаются в дереве (fixFacadeInnerPanelPosZ + buildFacade/buildAnimator), без post-build bbox.
   */
  _finalizeFacadeCatalogHingesAfterBuild(facadeGroup, item, shellSize) {
    void item;
    void shellSize;
    if (!facadeGroup || !this._useCatalogHingeModulesInRoom()) return;

    const hingeMods = this._collectFacadeCatalogHingeModules(facadeGroup);
    if (!hingeMods.length) {
      if (this._hingeRoomDbg()) {
        console.warn('[CLD][HINGE-ROOM] finalize: нет каталожных петель', facadeGroup.name);
      }
      return;
    }

    const reparentedLog = [];
    for (let i = 0; i < hingeMods.length; i++) {
      const hingeMod = hingeMods[i];
      if (hingeMod.userData?.cldHingeRoomFinalized) continue;
      const { swing, facadeGroup: leafFacadeGroup } =
        this._resolveDoorSwingAndFacadeGroupForHinge(hingeMod, null);
      if (!swing || !leafFacadeGroup) {
        if (this._hingeRoomDbg()) {
          console.warn('[CLD][HINGE-ROOM] finalize: нет swing для петли', hingeMod.name);
        }
        continue;
      }
      if (swing.userData?.cldDoorDirection) {
        hingeMod.userData.cldDoorDirection = swing.userData.cldDoorDirection;
      }
      if (this._hingeCorpusOnlyMode()) {
        if (this._hingeRoomDbg()) {
          console.warn('[CLD][HINGE-ROOM] corpus-only: skip reparent/facade finalize', hingeMod.name);
        }
        continue;
      }
      const rootsBefore = [];
      hingeMod.traverse((o) => {
        if (!o.userData?.isAnimator) return;
        if (String(o.userData.animatorId || '').toLowerCase() !== 'hinge_animator') return;
        rootsBefore.push(o);
      });
      this._alignCatalogHingeCupYFromRoleLayout(hingeMod, swing, leafFacadeGroup);
      this._reparentCatalogHingeAnimatorsToSwing(hingeMod, swing);
      this._applyCatalogHingeRefRotationsBeforeZAlign(hingeMod, swing);
      // Все catalog-петли: один Bazis-placer (шов = пласть×торец). Без BLB facadeZ/X/moduleX.
      this._placeHingePackageOnSeam(hingeMod, swing, leafFacadeGroup);
      // Как в превью: чашка L на hinge_animator (уже в __door_swing) — едет с дверью.
      this._detachLSeamFacadeToHingeAnimatorAfterAlign(hingeMod, swing);
      reparentedLog.push(rootsBefore.length);
      this._reassertHingeAnimatorsOnDoorSwing(swing);
      this._finalizeHingeFacadeSwingPoseAfterReparent(swing);
      this._applyRoomCatalogHingeZDepthOffsets(hingeMod, swing, leafFacadeGroup, null);
      hingeMod.userData = hingeMod.userData || {};
      hingeMod.userData.cldHingeRoomFinalized = true;
    }

    facadeGroup.updateMatrixWorld(true);

    this._applyRoomDoorPivotOffsetOnFacadeGroup(facadeGroup);

    if (this._hingeRoomVerbose()) {
      const verifyRows = hingeMods.map((hm) =>
        this._collectHingeVerifyRow(hm, facadeGroup, null)
      );
      this._warnHingeRoomVerbose('[CLD][HINGE-ROOM] finalize/done', {
        facade: facadeGroup.name,
        hingeMods: hingeMods.length,
        reparented: reparentedLog.join(','),
        hinges: verifyRows,
      });
    }
  }

  _neutralizeNestedDoorSwing(obj) {
    if (!obj) return;
    const sw = obj.userData && obj.userData.cldDoorSwing;
    if (!sw) return;
    sw.isFacadeMaster = false;
    sw.syncBulkOpen = false;
    sw.isOpen = false;
    sw.targetAngle = 0;
    sw.currentAngle = 0;
    if (sw.axis === 'y') obj.rotation.y = 0;
    else if (sw.axis === 'x') obj.rotation.x = 0;
    else if (sw.axis === 'z') obj.rotation.z = 0;
  }

  /**
   * catalog_31 hinge_animator после reparent в __door_swing: своя ось двери = 0
   * (крутится только дверь). Убираем cldDoorSwing и обнуляем поворот по оси двери,
   * чтобы не осталось запечённого ±85° от attach при открытой двери.
   */
  _stripHingeCatalogAnimatorOwnSwing(animRoot) {
    if (!animRoot) return;
    const ownSwing = animRoot.userData?.cldDoorSwing;
    if (ownSwing) {
      delete animRoot.userData.cldDoorSwing;
      if (typeof ClodisBuilder._unregisterDoorSwingGroup === 'function') {
        ClodisBuilder._unregisterDoorSwingGroup(animRoot);
      }
    }
    if (!animRoot.userData?._cldHingeReparentedToSwing) return;
    // Ось двери (y для боковых, x для верх/низ) — 0; ось «лица» (z) не трогаем.
    const doorAxis = ownSwing?.axis === 'x' ? 'x' : 'y';
    if (Math.abs(animRoot.rotation[doorAxis]) > 1e-4) {
      animRoot.rotation[doorAxis] = 0;
      animRoot.updateMatrixWorld(true);
    }
  }

  /**
   * После reparent в дверной __door_swing: фасадная половина не крутится сама
   * (реф constructor-clodis _setupHingeModuleSwingReparent).
   */
  _neutralizeHingeAnimatorSwingState(animRoot) {
    if (!animRoot) return;
    if (animRoot.userData?._cldHingeReparentedToSwing) {
      this._stripHingeCatalogAnimatorOwnSwing(animRoot);
    }
    const rootSw = animRoot.userData && animRoot.userData.cldDoorSwing;
    if (rootSw) {
      this._neutralizeNestedDoorSwing(animRoot);
    }
    if (typeof animRoot.traverse === 'function') {
      animRoot.traverse((o) => {
        if (!o || o === animRoot || o.name !== '__door_swing') return;
        this._neutralizeNestedDoorSwing(o);
      });
    } else {
      const nestedSwing =
        animRoot.getObjectByName && animRoot.getObjectByName('__door_swing');
      if (nestedSwing) this._neutralizeNestedDoorSwing(nestedSwing);
    }
  }

  /** Внутренняя грань боковой стенки = facade.minX/maxX ± толщина (накладной фасад). */
  _cabinetSidewallThicknessMm() {
    const g0t = Number(this.groups?.g0?.thickness);
    if (Number.isFinite(g0t) && g0t > 0) return g0t;
    const wt = Number(this.variables?._wt);
    if (Number.isFinite(wt) && wt > 0) return wt;
    return 16;
  }

  _findAncestorLayoutGroup(hingeMod, roleKey) {
    const want = String(roleKey || '').trim().toLowerCase();
    if (!want) return null;
    let p = hingeMod?.parent;
    while (p) {
      const lr = this._normalizeLayoutRoleKey(p.userData?.layoutRole || '');
      if (lr === want) return p;
      p = p.parent;
    }
    return null;
  }

  _findAncestorCabinetRoot(hingeMod) {
    return this._findAncestorLayoutGroup(hingeMod, 'cabinet_root');
  }

  _findCorpusGroupUnder(root) {
    if (!root || typeof root.traverse !== 'function') return null;
    let found = null;
    root.traverse((o) => {
      if (found || !o?.isGroup) return;
      const lr = this._normalizeLayoutRoleKey(o.userData?.layoutRole || '');
      if (lr === 'corpus' || lr === 'corpus_main' || lr === 'corpus_antresol') found = o;
    });
    return found;
  }

  /**
   * Корень поиска боковины: corpus под cabinet_root, иначе cabinet_root / мебель.
   * Петля в facades_* — corpus сосед, не предок.
   */
  _findCabinetSidewallSearchRoot(hingeMod) {
    if (!hingeMod) return null;
    const cabinetRoot = this._findAncestorCabinetRoot(hingeMod);
    const corpus =
      (cabinetRoot && this._findCorpusGroupUnder(cabinetRoot)) ||
      this._findAncestorLayoutGroup(hingeMod, 'corpus') ||
      this._findAncestorLayoutGroup(hingeMod, 'corpus_main') ||
      this._findAncestorLayoutGroup(hingeMod, 'corpus_antresol');
    if (corpus) return corpus;
    if (cabinetRoot) return cabinetRoot;
    let p = hingeMod.parent;
    for (let i = 0; i < 24 && p; i++) {
      if (p.userData?.isFurniture) return p;
      p = p.parent;
    }
    return null;
  }

  /**
   * Внутренняя грань боковины корпуса (мм, world X) — для привязки корпусной половины петли.
   * Петля внутри facades_*; corpus — сосед под cabinet_root, не предок hingeMod.
   */
  _findCabinetSidewallInnerFaceWorldX(hingeMod, isLTR) {
    if (!hingeMod || typeof THREE === 'undefined') return null;
    const root = this._findCabinetSidewallSearchRoot(hingeMod);
    if (!root) return null;
    root.updateMatrixWorld(true);
    const sideMesh = this._findCabinetSidewallMesh(root, isLTR);
    if (sideMesh) {
      const sb = new THREE.Box3().setFromObject(sideMesh);
      if (!sb.isEmpty()) return isLTR ? sb.max.x : sb.min.x;
    }
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return null;
    const wallT = this._cabinetSidewallThicknessMm();
    return isLTR ? box.min.x + wallT : box.max.x - wallT;
  }

  /**
   * Передний торец боковины (world Z). Только меш бока — НЕ max.z всего корпуса
   * (иначе ящики/фасады утягивают якорь на пласть фасада).
   */
  _findCabinetSidewallFrontWorldZ(hingeMod, isLTR) {
    if (!hingeMod || typeof THREE === 'undefined') return null;
    const root = this._findCabinetSidewallSearchRoot(hingeMod);
    if (!root) return null;
    root.updateMatrixWorld(true);
    const sideMesh = this._findCabinetSidewallMesh(root, isLTR);
    if (!sideMesh) {
      console.warn('[L-SEAM] sidewall frontZ: боковина не найдена', {
        root: root.name,
        isLTR,
      });
      return null;
    }
    const sb = new THREE.Box3().setFromObject(sideMesh);
    if (sb.isEmpty()) return null;
    return sb.max.z;
  }

  /**
   * Вертикальная боковина на стороне петель.
   * Сначала isSidePlank / имя «бок», потом геометрия (тонкая по X).
   */
  _findCabinetSidewallMesh(corpusRoot, isLTR) {
    if (!corpusRoot || typeof THREE === 'undefined') return null;
    corpusRoot.updateMatrixWorld(true);
    const rootBox = new THREE.Box3().setFromObject(corpusRoot);
    if (rootBox.isEmpty()) return null;
    const wantX = isLTR ? rootBox.min.x : rootBox.max.x;

    let bestNamed = null;
    let bestNamedScore = -1;
    let bestGeo = null;
    let bestGeoScore = -1;

    corpusRoot.traverse((o) => {
      if (!o?.isMesh) return;
      const ud = o.userData || {};
      if (ud.isHole || ud.isAccessory || ud.isEdge || ud.isUncutEdge) return;
      if (ud.isFacade && !ud.isBody && !ud.isDetail && !ud.isSidePlank) return;
      const nm = String(o.name || '').toLowerCase();
      if (/фасад|facade|двер|drawer|ящик|полк|shelf|зад|спин|back|цокол|plinth/.test(nm)) {
        if (!ud.isSidePlank) return;
      }
      const b = new THREE.Box3().setFromObject(o);
      if (b.isEmpty()) return;
      const sx = b.max.x - b.min.x;
      const sy = b.max.y - b.min.y;
      const sz = b.max.z - b.min.z;
      if (!(sx > 0 && sy > 80 && sz > 40)) return;
      const cx = (b.min.x + b.max.x) * 0.5;
      const dist = Math.abs(cx - wantX);
      if (dist > 120) return;

      const named =
        !!ud.isSidePlank ||
        /бок|side|стенк|лев|прав|left|right|wall/.test(nm);
      const thin = sx <= 40 || (sx < sy * 0.35 && sx < sz * 0.35);
      if (!named && !thin) return;

      const score = (named ? 1e9 : 0) + (200 - dist) * 1e6 + sy * sz;
      if (named) {
        if (score > bestNamedScore) {
          bestNamedScore = score;
          bestNamed = o;
        }
      } else if (score > bestGeoScore) {
        bestGeoScore = score;
        bestGeo = o;
      }
    });
    return bestNamed || bestGeo;
  }

  /**
   * Узел начала отсчёта корпусной половины = origin шаблона присадки на боке.
   * Важно: __furniture_own (после conv_pivot), не Furniture_* —
   * иначе при pivot −1 и size≈11 origin уезжает на ~5.5 мм от пласти.
   */
  _findHingeCorpusOriginNode(hingeMod) {
    if (!hingeMod) return null;
    if (this._isCatalogHingeLSeamPackage(hingeMod)) {
      const lOrigin = this._findLSeamPackageOriginNode(hingeMod, null);
      if (lOrigin) return lOrigin;
    }
    let bestFurni = null;
    hingeMod.traverse((o) => {
      if (!o?.isGroup) return;
      const nm = String(o.name || '');
      const ud = o.userData || {};
      const part = String(ud.hingeDrillPart || ud.hingePart || '').toLowerCase();
      if (nm.startsWith('Furniture_') && (/присадк/i.test(nm) || Number(ud.cfrnDrillTemplateId) > 0)) {
        if (part === 'door' || part === 'corpus' || !part) {
          if (!bestFurni || part === 'door' || part === 'corpus') bestFurni = o;
        }
      }
    });
    if (bestFurni) {
      const own = bestFurni.getObjectByName?.('__furniture_own');
      if (own) return own;
      return bestFurni;
    }
    const roots = this._collectHingeCorpusRootsInModule(hingeMod);
    if (roots.length) {
      const r0 = roots[0];
      const own = r0.getObjectByName?.('__furniture_own');
      return own || r0;
    }
    return this._findHingeCorpusMeshIn(hingeMod);
  }

  /**
   * L-пакет: frame шаблона = Furniture_Присадка / __furniture_own (R_place).
   * Ищем под hingeMod и под __door_swing (после reparent). Никогда не Module_/Секция (ширина карточки 50).
   */
  _findLSeamPackageOriginNode(hingeMod, swing) {
    if (!hingeMod && !swing) return null;
    const pickOwn = (furni) => {
      if (!furni) return null;
      const own = furni.getObjectByName?.('__furniture_own');
      return own || furni;
    };
    const scoreFurni = (o) => {
      const ud = o.userData || {};
      const nm = String(o.name || '');
      if (!(nm.startsWith('Furniture_') && /присадк/i.test(nm))) return -1;
      let s = 0;
      if (ud.cldHingeLSeamPackage) s += 100;
      if (Number(ud.cfrnDrillTemplateId) > 0) s += 40;
      const part = String(ud.hingeDrillPart || ud.hingePart || '').toLowerCase();
      if (part === 'door' || part === 'corpus') s += 20;
      if (part === 'facade') s += 5;
      const own = o.getObjectByName?.('__furniture_own');
      if (own?.userData?.cldHingeLSeamPackage) s += 50;
      return s;
    };
    const roots = [];
    if (hingeMod) roots.push(hingeMod);
    if (swing && swing !== hingeMod) roots.push(swing);
    // Родитель swing / секция фасада — Присадка могла уехать с animator.
    let p = swing?.parent || hingeMod?.parent;
    for (let i = 0; i < 6 && p; i++) {
      if (!roots.includes(p)) roots.push(p);
      p = p.parent;
    }
    let best = null;
    let bestScore = 0;
    for (const root of roots) {
      if (!root?.traverse) continue;
      root.traverse((o) => {
        if (!o?.isGroup && !o?.isObject3D) return;
        const sc = scoreFurni(o);
        if (sc > bestScore) {
          bestScore = sc;
          best = o;
        }
      });
    }
    if (best && bestScore > 0) return pickOwn(best);
    // Fallback: любой узел с флагом пакета
    for (const root of roots) {
      if (!root?.traverse) continue;
      let found = null;
      root.traverse((o) => {
        if (found || !o?.userData?.cldHingeLSeamPackage) return;
        found = o.name === '__furniture_own' ? o : pickOwn(o) || o;
      });
      if (found) return found;
    }
    return null;
  }

  /**
   * L-пакет: R_place на own Присадки — только __cldLSeamPlacement / DR (этап 4).
   */
  _applyLSeamRPlaceToObject(obj, edgeOrDir = 'ly') {
    if (!obj) return null;
    const place =
      typeof globalThis !== 'undefined' ? globalThis.__cldLSeamPlacement : null;
    if (place && typeof place.applyToObject === 'function') {
      return place.applyToObject(obj, edgeOrDir);
    }
    const DR =
      typeof globalThis !== 'undefined' ? globalThis.__CLD_DRILL_RESOLVE : null;
    if (DR && typeof DR.applyLSeamTemplatePlacementRotation === 'function') {
      return DR.applyLSeamTemplatePlacementRotation(obj, edgeOrDir);
    }
    return null;
  }

  /**
   * disabled: дерево + R_place задают шов; старый seam post-processing не нужен.
   */
  _placeHingePackageOnSeam(/* hingeMod, swing, facadeGroup */) {
    return;
  }

  /** Alias → `_placeHingePackageOnSeam` (единый Bazis-placer). */
  _alignCatalogHingeCorpusOriginToSidewall(hingeMod, swing, facadeGroup) {
    return this._placeHingePackageOnSeam(hingeMod, swing, facadeGroup);
  }

  /**
   * Смещение якоря корпуса на боке из «Петли по ролям» (corpusMountOffset*).
   * Для catalog-петель Z всегда 0 (не двигает package origin).
   */
  _resolveRoomCorpusMountOffsetMm(hingeMod) {
    const zero = { x: 0, y: 0, z: 0 };
    const ctx = this._facadeHingeContext || {};
    let layoutRole =
      hingeMod?.userData?.hingeFacadeLayoutRole ||
      ctx.layoutRole ||
      '';
    const gen = typeof window !== 'undefined' ? window.__cldHingeLayout : null;
    const productKind =
      this.productKind ||
      (gen && typeof gen.placementKindToProductKind === 'function'
        ? gen.placementKindToProductKind(this.placementKind)
        : '') ||
      'wardrobe';
    let off = zero;
    if (gen && typeof gen.resolveCorpusMountOffsetMm === 'function') {
      try {
        const resolved = gen.resolveCorpusMountOffsetMm({
          facadeLayoutRole: layoutRole,
          productKind,
          placementKind: this.placementKind,
          catalogHingeLayoutId: ctx.catalogHingeLayoutId,
          furnitureHingeLayoutOverride: this.hingeLayoutOverride,
        });
        off = {
          x: Number(resolved?.x) || 0,
          y: Number(resolved?.y) || 0,
          z: Number(resolved?.z) || 0,
        };
      } catch (_) {
        off = zero;
      }
    }
    if (hingeMod?.userData?.isCatalogHingeModule || this._isCatalogHingeLSeamPackage(hingeMod)) {
      return { x: Number(off.x) || 0, y: Number(off.y) || 0, z: 0 };
    }
    return off;
  }

  /** Ось распашки (__door_swing) в world X; fallback — кромка полотна. */
  _resolveHingeAxisWorldX(swing, facadeGroup, facadeMesh, isLTR) {
    if (swing && typeof THREE !== 'undefined') {
      swing.updateMatrixWorld(true);
      const wp = new THREE.Vector3();
      swing.getWorldPosition(wp);
      if (Number.isFinite(wp.x)) return wp.x;
    }
    const mesh = facadeMesh || this._findFacadePanelMeshFor(facadeGroup, swing);
    const facadeBoxW = mesh ? this._boxWorldX(mesh) : null;
    if (!facadeBoxW) return null;
    return isLTR ? facadeBoxW.min : facadeBoxW.max;
  }

  _resolveFacadeHingeInsetHalfMm() {
    const ho = Number(this.variables?.facade_hinge_offset_mm);
    if (Number.isFinite(ho) && ho > 0) return ho / 2;
    return 8;
  }

  /** Тонкая оболочка facades_*: X модуля = кромка шва (0 LTR / doorW RTL), не wallT/Ø35. */
  _hingeModuleRefPosXInThinFacadeShell(item, size, doorDirection) {
    void item;
    const shellD = Number(size?.z) || 0;
    if (!this._isThinFacadeShellDepth(shellD)) return null;
    const dir = String(
      doorDirection || this._facadeHingeContext?.doorDirection || 'ly'
    ).toLowerCase();
    const isRTL = /^(r|ry|rtl|right)/.test(dir);
    const doorW =
      Number(size?.x) ||
      Number(this._facadeHingeContext?.facadeShellWidthMm) ||
      0;
    if (isRTL && doorW > 0) return doorW;
    return 0;
  }

  /** Аниматор распашки двери (не hinge_animator внутри catalog_31). */
  _isFacadeDoorRotateAnimatorNode(n) {
    if (!n || typeof n !== 'object') return false;
    const spec = n.spec && typeof n.spec === 'object' ? n.spec : {};
    const props = spec.props && typeof spec.props === 'object' ? spec.props : {};
    const nodeType = String(n.type || '').toLowerCase();
    const et = String(spec.element_type || '').toLowerCase();
    const fn = String(spec.fn || '').toLowerCase();
    if (!((nodeType === 'animator' || et === 'animator') && fn === 'rotate' && props.direction)) {
      return false;
    }
    const nodeId = String(n.id || '').toLowerCase();
    const srcId = String(spec.source?.id || '').toLowerCase();
    if (nodeId === 'hinge_animator' || srcId === 'hinge_animator') return false;
    const sub = n.children || n.child;
    if (!Array.isArray(sub) || !sub.length) return true;
    return sub.some((c) => String(c?.type || '').toLowerCase() === 'facade');
  }

  _extractDoorRotateDirectionFromTree(nodes) {
    if (!Array.isArray(nodes)) return 'ly';
    for (const n of nodes) {
      if (!n || typeof n !== 'object') continue;
      if (this._isFacadeDoorRotateAnimatorNode(n)) {
        const props = n.spec?.props || {};
        return String(props.direction).toLowerCase();
      }
      const sub = n.children || n.child;
      if (Array.isArray(sub)) {
        const d = this._extractDoorRotateDirectionFromTree(sub);
        if (d) return d;
      }
    }
    return 'ly';
  }

  /**
   * «Петли по ролям» / превью: pos в дереве = центр секции петли (catalog pivot −1).
   * В комнате group.position = BLB → origin на expected − size/2 по оси раскладки.
   */
  _applyHingeRoleLayoutModuleBLBFromCenter(item, pos, templateTree, layoutAxis) {
    const expected = Number(item?.__hingeRoleExpectedYMm);
    if (!Number.isFinite(expected)) return;
    const intrinsic = this._hingeCatalogIntrinsicSectionSize(templateTree) || {};
    const axis = String(layoutAxis || 'Y').toUpperCase() === 'X' ? 'x' : 'y';
    const dim =
      axis === 'x'
        ? Math.max(1, Number(intrinsic.x) || Number(item?.size?.x) || 67)
        : Math.max(1, Number(intrinsic.y) || Number(item?.size?.y) || 67);
    const pivot = item?.pivot && typeof item.pivot === 'object' ? item.pivot : {};
    const pv = axis === 'x' ? Number(pivot.x) : Number(pivot.y);
    // catalog_28 #7/#12: pivot.y=0 — ось по центру секции петли; pos = центр (как в превью ролей).
    // pivot −1 — BLB: expected − size/2.
    if (Number.isFinite(pv) && pv === 0) {
      if (axis === 'x') pos.x = expected;
      else pos.y = expected;
    } else {
      const blb = expected - dim / 2;
      if (axis === 'x') pos.x = blb;
      else pos.y = blb;
    }
    if (this._hingeVerifyDbg()) {
      console.warn('[CLD][HINGE-VERIFY][roleLayoutBLB]', {
        id: item?.id,
        layoutAxis: axis,
        pivotAxis: pv,
        expectedCenterMm: expected,
        hingeSectionMm: dim,
        groupPos: axis === 'x' ? pos.x : pos.y,
      });
    }
  }

  _resolveFacadeShellWidthMmForHinge(parentSection, size) {
    const ctx = this._facadeHingeContext || {};
    const fromCtx = Number(ctx.facadeShellWidthMm);
    if (Number.isFinite(fromCtx) && fromCtx > 0) return fromCtx;
    const fromVerify = Number(ctx.roleLayoutVerify?.facadeShellSize?.x);
    if (Number.isFinite(fromVerify) && fromVerify > 0) return fromVerify;
    const fromParent = Number(parentSection?.size?.x);
    if (Number.isFinite(fromParent) && fromParent > 40) return fromParent;
    const fromSize = Number(size?.x);
    if (Number.isFinite(fromSize) && fromSize > 40) return fromSize;
    return Number.isFinite(fromParent) && fromParent > 0 ? fromParent : 0;
  }

  _applyRefHingeModulePosInFacadeShell(item, pos, size, doorDirection, parentSection) {
    const parentShellD = Number(parentSection?.size?.z) || 0;
    const shellD = this._isThinFacadeShellDepth(parentShellD)
      ? parentShellD
      : Number(size?.z) || 0;
    if (!this._isThinFacadeShellDepth(shellD)) return;
    pos.z = 0;
    // «Петли по ролям» уже выставили pos.x в дереве (как в карточке каталога) — не затирать.
    if (this._facadeHingeContext?.catalogHingeModulesApplied) {
      return;
    }
    const facadeW = this._resolveFacadeShellWidthMmForHinge(parentSection, size);
    const refX = this._hingeModuleRefPosXInThinFacadeShell(
      item,
      { x: facadeW, y: size?.y, z: shellD },
      doorDirection
    );
    if (refX == null || !Number.isFinite(refX)) return;
    pos.x = refX;
  }

  _findFacadePanelMeshFor(facadeGroup, swing) {
    let best = null;
    let bestScore = -1;
    const consider = (m) => {
      if (!m || !m.isMesh) return;
      const nm = String(m.name || '').toLowerCase();
      const ud = m.userData || {};
      // Не плита двери: reparented hinge_animator в swing (имя «…фасад» у GLB петли).
      if (ud.isCabinetModel && /петл|hinge|накладн/.test(nm)) return;
      if (/furni_hinge|model_.*петл|model_.*hinge/.test(nm)) return;
      if (ud.cldFacadeEdgeStrip) return;
      // Предпочтение «фасадным» мешам и самым большим по площади.
      const hint =
        (ud.isFacade ? 5 : 0) +
        (ud.isFacadePanel ? 5 : 0) +
        (/_core$/i.test(nm) ? 4 : 0) +
        (/facade|фасад/.test(nm) ? 3 : 0) +
        (/ldsp|panel|door/.test(nm) ? 1 : 0);
      const box = new THREE.Box3().setFromObject(m);
      if (box.isEmpty()) return;
      const s = box.getSize(new THREE.Vector3());
      const area = Math.max(0, s.x) * Math.max(0, s.y);
      const score = hint * 1e9 + area; // hint важнее площади
      if (score > bestScore) {
        bestScore = score;
        best = m;
      }
    };
    const pickFrom = (root) => {
      if (!root || typeof root.traverse !== 'function') return;
      const walk = (node) => {
        if (!node) return;
        if (
          node !== root &&
          String(node.userData?.animatorId || '').toLowerCase() === 'hinge_animator'
        ) {
          return;
        }
        consider(node);
        const kids = node.children || [];
        for (let i = 0; i < kids.length; i++) walk(kids[i]);
      };
      walk(root);
    };
    if (typeof THREE === 'undefined') return null;
    // Сначала swing: там обычно дверь/фасад.
    if (swing) pickFrom(swing);
    // Fallback: вся группа фасада.
    if (!best && facadeGroup) pickFrom(facadeGroup);
    return best;
  }

  /** catalog_31 id 5/6/7 — GLB из cabinet_model; legacy rotation.z=PI из рефа FBX к ним не применяем. */
  _isCatalogHingeGlbNode(o) {
    if (!o) return false;
    const sid = String(o.userData?.modelSpecId || '').trim();
    if (sid === '5' || sid === '6' || sid === '7') return true;
    if (o.userData?.isCabinetModel) {
      const nm = String(o.name || '').toLowerCase();
      if (/петл|hinge|накладн/.test(nm) && /фасад|корпус|facade|corpus/.test(nm)) return true;
    }
    return false;
  }

  _findHingeCorpusMeshIn(hingeMod) {
    let best = null;
    let bestScore = -1;
    const consider = (node) => {
      if (!node) return;
      const nm = String(node.name || '').toLowerCase();
      const ud = node.userData || {};
      const specId = String(ud.modelSpecId || '').trim();
      let hint =
        (ud.hingePart === 'corpus' ? 10 : 0) +
        (specId === '6' ? 12 : 0) +
        (/furni_hinge_door/.test(nm) ? 10 : 0) +
        (/накладная.*корпус|петл.*корпус/.test(nm) ? 9 : 0) +
        (/корпус|corpus/.test(nm) && /петл|hinge|model/.test(nm) ? 7 : 0);
      if (hint <= 0 && node.isGroup && this._isCatalogHingeGlbNode(node)) {
        const pnm = String(node.parent?.name || '').toLowerCase();
        if (/корпус/.test(nm) || /корпус/.test(pnm) || specId === '6') hint = 11;
      }
      if (hint <= 0) return;
      const box = new THREE.Box3().setFromObject(node);
      if (box.isEmpty()) return;
      const s = box.getSize(new THREE.Vector3());
      const vol = Math.max(0, s.x) * Math.max(0, s.y) * Math.max(0, s.z);
      const score = hint * 1e9 + vol;
      if (score > bestScore) {
        bestScore = score;
        best = node;
      }
    };
    if (typeof THREE === 'undefined' || !hingeMod || typeof hingeMod.traverse !== 'function') return null;
    hingeMod.traverse((o) => {
      if (o.isMesh || (o.isGroup && (o.userData?.isCabinetModel || String(o.userData?.modelSpecId || '') === '6'))) {
        consider(o);
      }
    });
    return best;
  }

  /** Фасадная половина петли внутри hinge_animator (реф: hinge_facade mesh). */
  _findHingeFacadeMeshIn(root) {
    let best = null;
    let bestScore = -1;
    const consider = (m) => {
      if (!m || !m.isMesh) return;
      const nm = String(m.name || '').toLowerCase();
      const ud = m.userData || {};
      const specId = String(ud.modelSpecId || '').trim();
      let hint =
        (ud.hingePart === 'facade' ? 10 : 0) +
        (specId === '5' ? 12 : 0) +
        (/furni_hinge_facade/.test(nm) ? 10 : 0) +
        (/к\s*фасад|к фасаду/.test(nm) ? 8 : 0) +
        (/clodis.*фасад|петл.*фасад|накладная.*фасад/.test(nm) ? 8 : 0) +
        (/facade|фасад/.test(nm) && /hinge|furni|петл|clodis/.test(nm) ? 5 : 0);
      if (hint <= 0) return;
      const box = new THREE.Box3().setFromObject(m);
      if (box.isEmpty()) return;
      const s = box.getSize(new THREE.Vector3());
      const vol = Math.max(0, s.x) * Math.max(0, s.y) * Math.max(0, s.z);
      const score = hint * 1e9 + vol;
      if (score > bestScore) {
        bestScore = score;
        best = m;
      }
    };
    if (typeof THREE === 'undefined' || !root || typeof root.traverse !== 'function') return null;
    root.traverse((o) => consider(o));
    return best;
  }

  /** Реф part7: LTR PI — legacy FBX; catalog GLB (id 5/6) как в превью элемента, rot 0. */
  _applyCatalogHingeRefRotationsBeforeZAlign(hingeMod, swing) {
    if (!hingeMod) return;
    const dir =
      String(swing?.userData?.cldDoorDirection || '').toLowerCase() ||
      String(hingeMod.userData?.cldDoorDirection || '').toLowerCase() ||
      'ly';
    const isLTR = !dir.startsWith('r');
    const catalogGlb = this._hingeModuleUsesCatalogGlb(hingeMod, swing);
    if (!catalogGlb) {
      this._applyRefHingeCorpusLtrRotation(hingeMod, isLTR);
    }
    const animRoots = this._collectHingeAnimatorRootsForHingeModule(hingeMod, swing);
    for (const anim of animRoots) {
      if (catalogGlb) {
        this._resetCatalogHingeFacadeRefLtrRotation(anim);
      } else {
        this._applyRefHingeFacadeLtrRotation(anim, isLTR);
      }
      anim.updateMatrixWorld(true);
    }
    hingeMod.updateMatrixWorld(true);
  }

  _hingeModuleUsesCatalogGlb(hingeMod, swing) {
    let found = false;
    const scan = (root) => {
      if (!root || found) return;
      root.traverse((o) => {
        if (found) return;
        if (this._isCatalogHingeGlbNode(o)) found = true;
      });
    };
    scan(hingeMod);
    if (!found && swing) scan(swing);
    return found;
  }

  /** Снять legacy PI, если комната уже крутила catalog GLB (превью элемента = rot 0). */
  _resetCatalogHingeFacadeRefLtrRotation(root) {
    if (!root) return;
    const facRoot = this._findHingeFacadePartRoot(root) || this._findHingeFacadeMeshIn(root);
    if (!facRoot) return;
    let target = facRoot;
    if (facRoot.isMesh && facRoot.parent?.userData?.isCabinetModel) {
      target = facRoot.parent;
    }
    if (!this._isCatalogHingeGlbNode(target) && !this._isCatalogHingeGlbNode(facRoot)) return;
    if (target.userData?._cldRefHingeFacadeLtrRot || Math.abs(target.rotation.z - Math.PI) < 0.01) {
      target.rotation.z = 0;
      if (target.userData) delete target.userData._cldRefHingeFacadeLtrRot;
      root.updateMatrixWorld(true);
    }
  }

  /** Реф part7 ~4188: LTR rotation.z = PI — legacy furni_hinge_facade (не catalog). */
  _applyRefHingeFacadeLtrRotation(root, isLTR) {
    if (!root || !isLTR) return;
    const facRoot = this._findHingeFacadePartRoot(root) || this._findHingeFacadeMeshIn(root);
    if (!facRoot) return;
    let target = facRoot;
    if (facRoot.isMesh && facRoot.parent?.userData?.isCabinetModel) {
      target = facRoot.parent;
    }
    if (this._isCatalogHingeGlbNode(target) || this._isCatalogHingeGlbNode(facRoot)) return;
    if (target.userData?._cldRefHingeFacadeLtrRot) return;
    target.rotation.z = Math.PI;
    target.userData = target.userData || {};
    target.userData._cldRefHingeFacadeLtrRot = true;
    root.updateMatrixWorld(true);
  }

  _shiftObjectWorldX(obj, parentForLocal, shiftWorldX) {
    if (!obj || !parentForLocal || typeof THREE === 'undefined') return;
    parentForLocal.updateMatrixWorld(true);
    const a = new THREE.Vector3(0, 0, 0).applyMatrix4(parentForLocal.matrixWorld);
    const b = new THREE.Vector3(shiftWorldX, 0, 0).add(a);
    const localA = parentForLocal.worldToLocal(a.clone());
    const localB = parentForLocal.worldToLocal(b.clone());
    obj.position.x += localB.x - localA.x;
  }

  _shiftObjectWorldZ(obj, parentForLocal, shiftWorldZ) {
    if (!obj || !parentForLocal || typeof THREE === 'undefined') return;
    parentForLocal.updateMatrixWorld(true);
    const a = new THREE.Vector3(0, 0, 0).applyMatrix4(parentForLocal.matrixWorld);
    const b = new THREE.Vector3(0, 0, shiftWorldZ).add(a);
    const localA = parentForLocal.worldToLocal(a.clone());
    const localB = parentForLocal.worldToLocal(b.clone());
    obj.position.z += localB.z - localA.z;
  }

  _shiftObjectWorldY(obj, parentForLocal, shiftWorldY) {
    if (!obj || !parentForLocal || typeof THREE === 'undefined') return;
    parentForLocal.updateMatrixWorld(true);
    const a = new THREE.Vector3(0, 0, 0).applyMatrix4(parentForLocal.matrixWorld);
    const b = new THREE.Vector3(0, shiftWorldY, 0).add(a);
    const localA = parentForLocal.worldToLocal(a.clone());
    const localB = parentForLocal.worldToLocal(b.clone());
    obj.position.y += localB.y - localA.y;
  }

  /** Нижний край полотна фасада (мм world Y) — для привязки оси петли к «петли по ролям». */
  _facadePanelWorldBox(facadeGroup, swing) {
    if (typeof THREE === 'undefined' || !facadeGroup) return null;
    const union = new THREE.Box3();
    let count = 0;
    const tryCollect = (root) => {
      if (!root || typeof root.traverse !== 'function') return;
      root.traverse((o) => {
        if (!o || !o.isMesh) return;
        const nm = String(o.name || '').toLowerCase();
        const ud = o.userData || {};
        if (ud.isCabinetModel && /петл|hinge|накладн/.test(nm)) return;
        if (/furni_hinge|model_.*петл|model_.*hinge/.test(nm)) return;
        const facadeLike =
          !!ud.isFacade ||
          !!ud.isFacadePanel ||
          /facade|фасад|door|panel|ldsp/.test(nm);
        if (!facadeLike) return;
        try {
          const b = new THREE.Box3().setFromObject(o);
          if (!b.isEmpty()) {
            if (count === 0) union.copy(b);
            else union.union(b);
            count++;
          }
        } catch (_) {}
      });
    };
    if (swing) tryCollect(swing);
    if (!count) tryCollect(facadeGroup);
    if (count) return union;

    const panel = this._findFacadePanelMeshFor(facadeGroup, swing);
    if (panel) {
      try {
        const b = new THREE.Box3().setFromObject(panel);
        if (!b.isEmpty()) return b;
      } catch (_) {}
    }
    try {
      const b = new THREE.Box3().setFromObject(facadeGroup);
      return b.isEmpty() ? null : b;
    } catch (_) {
      return null;
    }
  }

  /** L-пакет: чашка на GLB фасада (ещё на Присадке), не в пустом hinge_animator. */
  _resolveLSeamFacadeCupCenterWorldY(hingeMod, out) {
    if (!hingeMod || typeof THREE === 'undefined') return null;
    const v = out || new THREE.Vector3();
    let facadeNode = null;
    hingeMod.traverse((o) => {
      if (facadeNode) return;
      if (o.userData?.hingePart === 'facade' && o.userData?.fromDrillTemplateModel) {
        facadeNode = o;
      }
    });
    if (!facadeNode) {
      hingeMod.traverse((o) => {
        if (facadeNode) return;
        const pending = o?.userData?.cldLSeamFacadePendingDetach;
        if (pending?.userData?.hingePart === 'facade') facadeNode = pending;
      });
    }
    if (!facadeNode) return null;
    try {
      facadeNode.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(facadeNode);
      if (!box.isEmpty()) {
        box.getCenter(v);
        return v;
      }
    } catch (_) {}
    facadeNode.getWorldPosition(v);
    return v;
  }

  /**
   * До reparent в swing: сдвинуть весь module петли (корпус + hinge_animator),
   * чтобы центр фасадной чашки был на expected мм от низа полотна.
   * Reparent (attach) сохраняет world Y фасадной половины; корпус остаётся на hingeMod.
   */
  _alignCatalogHingeCupYFromRoleLayout(hingeMod, swing, facadeGroup) {
    // CupY post-shift выкл. до rewrite Bazis placer (оставляем pos.y из ролей в дереве).
    void hingeMod;
    void swing;
    void facadeGroup;
    return;
    if (!hingeMod || !swing || !facadeGroup || typeof THREE === 'undefined') return;
    const expected = Number(hingeMod.userData?.hingeRoleExpectedYMm);
    if (!Number.isFinite(expected)) return;

    // База для expected — именно полотно двери, а не весь контейнер фасада.
    const panelBox = this._facadePanelWorldBox(facadeGroup, swing);
    if (!panelBox || panelBox.isEmpty()) return;

    const lSeam = this._isCatalogHingeLSeamPackage(hingeMod);
    let cupW =
      lSeam ? this._resolveLSeamFacadeCupCenterWorldY(hingeMod) : null;
    if (!cupW) {
      const animRoots = this._collectHingeAnimatorRootsForHingeModule(hingeMod, swing);
      if (!animRoots.length) return;
      cupW = this._resolveHingeCupCenterWorldY(animRoots[0]);
    }
    if (!cupW) return;

    // Единое правило для всех фасадов со свесом:
    // петли считаем от базового низа (без свеса), а не от текущего опущенного края.
    // Базовый низ = panelBox.min.y + фактически применённый свес этой двери.
    const panelHeightMm = Math.max(0, Number(panelBox.max.y) - Number(panelBox.min.y));
    const baseDoorHeightMm = Math.max(
      0,
      Number(hingeMod.userData?.hingeRoleDoorHeightMm) ||
        Number(this._facadeHingeContext?.roleLayoutDoorHeightMm) ||
        0
    );
    const overhangFromGeometryMm =
      baseDoorHeightMm > 0 ? Math.max(0, panelHeightMm - baseDoorHeightMm) : 0;
    const appliedOverhangMm = Math.max(
      0,
      Number(facadeGroup?.userData?.facadeBottomOverhangMm) || overhangFromGeometryMm
    );
    const baseBottomY = panelBox.min.y + appliedOverhangMm;
    const targetCupY = baseBottomY + expected;
    const delta = targetCupY - cupW.y;
    if (!Number.isFinite(delta) || Math.abs(delta) < 0.2) return;
    // L: после R_place иногда читаем «чужой» world Y → унос на пол. Не двигаем на метры.
    if (lSeam && Math.abs(delta) > 400) {
      console.warn('[CLD][HINGE-ROOM] alignCupY skip L (delta too large)', {
        hinge: hingeMod.name,
        deltaMm: Math.round(delta),
        cupY: Math.round(cupW.y),
        targetCupY: Math.round(targetCupY),
      });
      return;
    }

    const hingeParent = hingeMod.parent;
    if (!hingeParent) return;
    this._shiftObjectWorldY(hingeMod, hingeParent, delta);
    hingeMod.updateMatrixWorld(true);

    if (this._hingeRoomVerbose()) {
      const animRoots = this._collectHingeAnimatorRootsForHingeModule(hingeMod, swing);
      const anim = animRoots[0];
      const cupAfter = this._resolveHingeCupCenterWorldY(anim);
      const corpus = this._findHingeCorpusMeshIn(hingeMod);
      let corpusFromPanel = null;
      if (corpus) {
        try {
          const cb = new THREE.Box3().setFromObject(corpus);
          if (!cb.isEmpty()) {
            corpusFromPanel = Math.round((cb.min.y + cb.max.y) / 2 - panelBox.min.y);
          }
        } catch (_) {}
      }
      console.warn('[CLD][HINGE-ROOM] alignCupY/hingeMod', {
        hinge: hingeMod.name,
        expectedFromPanelBottom: expected,
        appliedOverhangMm,
        panelMinY: Math.round(panelBox.min.y),
        panelMaxY: Math.round(panelBox.max.y),
        baseBottomY: Math.round(baseBottomY),
        targetCupFromPanelBottom: Math.round(targetCupY - panelBox.min.y),
        cupBeforeFromPanelBottom: Math.round(cupW.y - panelBox.min.y),
        panelHeightMm: Math.round(panelHeightMm),
        baseDoorHeightMm: Math.round(baseDoorHeightMm || 0),
        overhangFromGeometryMm: Math.round(overhangFromGeometryMm),
        facadeRole:
          hingeMod.userData?.hingeFacadeLayoutRole ||
          facadeGroup?.userData?.layoutRole ||
          this._facadeHingeContext?.layoutRole ||
          null,
        deltaMm: Math.round(delta * 10) / 10,
        cupAfter: cupAfter ? Math.round(cupAfter.y - panelBox.min.y) : null,
        corpusCenterFromPanel: corpusFromPanel,
        hingeModPosY: hingeMod.position.y,
      });
    }
  }

  /** Центр чашки GLB (для verify / меток), мм world Y. */
  _resolveHingeCupCenterWorldY(animRoot, out) {
    if (!animRoot || typeof THREE === 'undefined') return null;
    const v = out || new THREE.Vector3();
    animRoot.updateMatrixWorld(true);
    const cup = this._findHingeCupAnchorInAnim(animRoot);
    if (cup?.obj) {
      try {
        const box = new THREE.Box3().setFromObject(cup.obj);
        if (!box.isEmpty()) {
          box.getCenter(v);
          return v;
        }
      } catch (_) {}
    }
    const box = new THREE.Box3();
    let hit = false;
    animRoot.traverse((o) => {
      if (!o?.isMesh) return;
      if (o.userData?.isHole) return;
      const nm = String(o.name || '').toLowerCase();
      if (/корпус|corpus|присад/.test(nm) && !/фасад|facade/.test(nm)) return;
      try {
        const b = new THREE.Box3().setFromObject(o);
        if (b.isEmpty()) return;
        if (!hit) {
          box.copy(b);
          hit = true;
        } else {
          box.union(b);
        }
      } catch (_) {}
    });
    if (!hit) {
      animRoot.getWorldPosition(v);
      return v;
    }
    box.getCenter(v);
    return v;
  }

  _boxWorldZ(obj) {
    if (!obj || typeof THREE === 'undefined') return null;
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    if (box.isEmpty()) return null;
    return { min: box.min.z, max: box.max.z };
  }

  /** catalog_31: model «Петля накладная фасад» / spec.id 5 — не furni_hinge_facade mesh. */
  _findHingeFacadePartRoot(animRoot) {
    if (!animRoot || typeof animRoot.traverse !== 'function') return null;
    let best = null;
    let bestScore = -1;
    const isCupOrCorpus = (nl) =>
      /присадк|hole_|корпус|corpus|__door_swing|animator/.test(nl);
    animRoot.traverse((o) => {
      if (!o || o === animRoot) return;
      const nl = String(o.name || '').toLowerCase();
      if (isCupOrCorpus(nl)) return;
      if (o.userData?.isHole || o.userData?.isDrillPlaceholder) return;
      if (/furniture_.*присад/.test(nl)) return;
      let hint = 0;
      const specId = String(o.userData?.modelSpecId || '').trim();
      if (o.userData?.isCabinetModel) hint += 8;
      if (specId === '5' || specId === '6' || specId === '7') hint += 10;
      if (/model.*фасад|петл.*фасад|накладная.*фасад|фасад/.test(nl) && /петл|model|наклад/.test(nl)) {
        hint += 12;
      }
      if (o.userData?.hingePart === 'facade') hint += 10;
      if (/furni_hinge_facade/.test(nl)) hint += 10;
      if (hint <= 0) return;
      const box = new THREE.Box3().setFromObject(o);
      if (box.isEmpty()) return;
      const s = box.getSize(new THREE.Vector3());
      const score = hint * 1e12 + Math.max(0, s.x) * Math.max(0, s.y) * Math.max(0, s.z);
      if (score > bestScore) {
        bestScore = score;
        best = o;
      }
    });
    return best;
  }

  _collectHingeAnimatorRootsForHingeModule(hingeMod, swing) {
    const out = [];
    const seen = new Set();
    const push = (o) => {
      if (!o || seen.has(o.uuid)) return;
      seen.add(o.uuid);
      out.push(o);
    };
    if (hingeMod) {
      hingeMod.traverse((o) => {
        if (!o?.userData?.isAnimator) return;
        if (String(o.userData.animatorId || '').toLowerCase() !== 'hinge_animator') return;
        push(o);
      });
    }
    if (swing) {
      swing.traverse((o) => {
        if (!o?.userData?.isAnimator) return;
        if (String(o.userData.animatorId || '').toLowerCase() !== 'hinge_animator') return;
        const tag = String(o.userData._cldHingeOwnerUuid || '');
        if (hingeMod && tag && tag !== String(hingeMod.uuid || '')) return;
        push(o);
      });
    }
    return out;
  }

  _hingeFacadeMetalBox3(animRoot) {
    if (!animRoot || typeof THREE === 'undefined') return null;
    const root = this._findHingeFacadePartRoot(animRoot) || animRoot;
    const box = new THREE.Box3();
    let hit = false;
    root.traverse((o) => {
      if (!o?.isMesh) return;
      if (o.userData?.isHole) return;
      const nl = String(o.name || '').toLowerCase();
      if (/присад|hole_/.test(nl)) return;
      if (o.userData?.isDrillPlaceholder) return;
      const mb = new THREE.Box3().setFromObject(o);
      if (mb.isEmpty()) return;
      box.union(mb);
      hit = true;
    });
    return hit && !box.isEmpty() ? box : null;
  }

  /** Bbox фасадной половины для вписывания в толщину полотна: металл + чашка/присадка + hole. */
  _hingeFacadeFitBox3(animRoot) {
    if (!animRoot || typeof THREE === 'undefined') return null;
    const box = new THREE.Box3();
    let hit = false;
    const unionObj = (o) => {
      if (!o) return;
      const b = new THREE.Box3().setFromObject(o);
      if (b.isEmpty()) return;
      if (!hit) {
        box.copy(b);
        hit = true;
      } else {
        box.union(b);
      }
    };
    const metal = this._hingeFacadeMetalBox3(animRoot);
    if (metal && !metal.isEmpty()) {
      box.copy(metal);
      hit = true;
    }
    const cupAnchor = this._findHingeCupAnchorInAnim(animRoot);
    if (cupAnchor?.obj) unionObj(cupAnchor.obj);
    animRoot.traverse((o) => {
      if (!o?.userData?.isHole) return;
      unionObj(o);
    });
    return hit && !box.isEmpty() ? box : null;
  }

  /** Чашка 35 мм: hole или Furniture_Присадка (catalog_31 z:-6.4). */
  _findHingeCupAnchorInAnim(animRoot) {
    if (!animRoot) return null;
    let bestHole = null;
    let bestD = 0;
    animRoot.traverse((o) => {
      if (!o?.userData?.isHole) return;
      const box = new THREE.Box3().setFromObject(o);
      if (box.isEmpty()) return;
      const s = box.getSize(new THREE.Vector3());
      const diam = Math.max(s.x, s.y, s.z);
      if (diam > bestD) {
        bestD = diam;
        bestHole = o;
      }
    });
    if (bestHole && bestD >= 20) return { kind: 'hole', obj: bestHole };
    let cupFurn = null;
    animRoot.traverse((o) => {
      if (!o?.isGroup) return;
      const nl = String(o.name || '').toLowerCase();
      if (/furniture_.*присад|присад/.test(nl)) cupFurn = o;
    });
    if (cupFurn) return { kind: 'furniture', obj: cupFurn };
    return null;
  }

  _boxMinMaxZInSwingLocal(box, swing) {
    if (!box || box.isEmpty() || !swing) return { min: null, max: null };
    const corners = [
      new THREE.Vector3(box.min.x, box.min.y, box.min.z),
      new THREE.Vector3(box.max.x, box.min.y, box.min.z),
      new THREE.Vector3(box.min.x, box.max.y, box.min.z),
      new THREE.Vector3(box.max.x, box.max.y, box.min.z),
      new THREE.Vector3(box.min.x, box.min.y, box.max.z),
      new THREE.Vector3(box.max.x, box.min.y, box.max.z),
      new THREE.Vector3(box.min.x, box.max.y, box.max.z),
      new THREE.Vector3(box.max.x, box.max.y, box.max.z),
    ];
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const c of corners) {
      const p = swing.worldToLocal(c.clone());
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    }
    return {
      min: Number.isFinite(minZ) ? minZ : null,
      max: Number.isFinite(maxZ) ? maxZ : null,
    };
  }

  /**
   * Снимок local pos model «К фасаду» vs Furniture_Присадка в hinge_animator.
   * Для замера: relative должен не меняться при room Z-align (реф: один transform родителя).
   */
  _snapshotHingeAnimFacadeDrillRel(anim) {
    if (!anim || typeof THREE === 'undefined') return null;
    const facRoot = this._findHingeFacadePartRoot(anim);
    let drill = null;
    anim.traverse((o) => {
      if (!o || o === anim || drill) return;
      const nl = String(o.name || '').toLowerCase();
      if (/furniture_.*присад|^присад/.test(nl) || (o.userData?.isFurniture && /присад/.test(nl))) {
        drill = o;
      }
    });
    if (!facRoot && !drill) return null;
    return {
      model: facRoot
        ? {
            name: facRoot.name,
            x: facRoot.position.x,
            y: facRoot.position.y,
            z: facRoot.position.z,
          }
        : null,
      drill: drill
        ? {
            name: drill.name,
            x: drill.position.x,
            y: drill.position.y,
            z: drill.position.z,
          }
        : null,
      delta:
        facRoot && drill
          ? {
              x: drill.position.x - facRoot.position.x,
              y: drill.position.y - facRoot.position.y,
              z: drill.position.z - facRoot.position.z,
            }
          : null,
    };
  }

  _logHingeAnimFacadeDrillRel(tag, anim, beforeSnap) {
    if (!this._hingeRoomDbg() || !anim) return;
    const after = this._snapshotHingeAnimFacadeDrillRel(anim);
    const row = {
      tag,
      anim: anim.name,
      before: beforeSnap || null,
      after,
    };
    if (beforeSnap?.delta && after?.delta) {
      row.deltaChanged = {
        x: after.delta.x - beforeSnap.delta.x,
        y: after.delta.y - beforeSnap.delta.y,
        z: after.delta.z - beforeSnap.delta.z,
      };
    }
    this._warnHingeRoomVerbose('[CLD][HINGE-ROOM] model↔Присадка rel', row);
  }

  /**
   * Реф PlanPlace: coords model/Присадка из дерева каталога, без post-shift детей.
   * Постановка на тыл полотна 16 мм — только _alignCatalogHingeFacadeZInSwing (сдвиг родителя anim).
   */
  _remapHingeAnimatorFacadePartZToRef(anim, shellD, logs) {
    if (!anim || typeof THREE === 'undefined') return;
    void shellD;
    void logs;
    // Раньше: model minZ→0 и отдельно Присадка → cupHalf — ломало relative vs превью/реф.
    // Оставляем снимок для DEBUG_HINGE_ROOM.
    if (this._hingeRoomDbg()) {
      this._logHingeAnimFacadeDrillRel('remap/noop-ref-tree-coords', anim, this._snapshotHingeAnimFacadeDrillRel(anim));
    }
  }

  _positiveDrillTemplateId(...vals) {
    for (const v of vals) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return 0;
  }

  /** Как __cldHingeFlatMergedSpec в constructor-clodis — spec модуля / model в дереве. */
  _hingeDrillIdsFromMergedSource(item, templateTree) {
    if (!item || typeof item !== 'object') return { facade: 0, door: 0 };
    const pick = (...vals) => this._positiveDrillTemplateId(...vals);
    const sp = item.spec && typeof item.spec === 'object' ? item.spec : {};
    let facade = pick(
      sp.hingeFacadeDrillTemplateId,
      item.hingeFacadeDrillTemplateId,
      sp.drillTemplateId,
      sp.drillingTemplateId,
      sp.templateId,
      sp.drilling_template_id
    );
    let door = pick(
      sp.hingeDoorDrillTemplateId,
      item.hingeDoorDrillTemplateId,
      sp.doorDrillTemplateId,
      sp.door_drill_template_id
    );
    if (templateTree) {
      const fromTree = this._scanHingeSubtreeForDrillTemplateIds(templateTree);
      if (!facade) facade = fromTree.facade;
      if (!door) door = fromTree.door;
    }
    return { facade, door };
  }

  _scanHingeSubtreeForDrillTemplateIds(nodes) {
    let facade = 0;
    let door = 0;
    const pick = (...vals) => this._positiveDrillTemplateId(...vals);
    const walk = (arr) => {
      if (!Array.isArray(arr)) return;
      for (const n of arr) {
        if (!n || typeof n !== 'object') continue;
        const t = String(n.type || '').toLowerCase();
        if (t === 'model') {
          const sp = n.spec && typeof n.spec === 'object' ? n.spec : {};
          const tid = pick(
            sp.drillTemplateId,
            sp.drillingTemplateId,
            sp.templateId,
            sp.hingeFacadeDrillTemplateId,
            sp.hingeDoorDrillTemplateId
          );
          const sid = String(sp.id ?? '').trim();
          const nm = String(n.name || sp.key || '').toLowerCase();
          if (sid === '6' || /корпус|corpus/.test(nm)) {
            if (!door && tid) door = tid;
          } else if (sid === '5' || /фасад|facade/.test(nm)) {
            if (!facade && tid) facade = tid;
          } else if (tid) {
            if (!facade) facade = tid;
            if (!door) door = tid;
          }
        }
        if (t === 'furniture') {
          const fnm = String(n.name || '').toLowerCase();
          if (/присадк/.test(fnm)) {
            const sp = n.spec && typeof n.spec === 'object' ? n.spec : {};
            let tid = pick(
              sp.drillTemplateId,
              sp.drillingTemplateId,
              sp.templateId,
              sp.hingeFacadeDrillTemplateId,
              sp.hingeDoorDrillTemplateId
            );
            if (!tid) {
              const sid = Number(sp.id);
              if (Number.isFinite(sid) && sid > 0) {
                const tplInfo = this._getDrillTemplateHolesForBuilder(sid);
                if (tplInfo.holes && tplInfo.holes.length) tid = sid;
              }
            }
            if (tid) {
              const part = this._hingeCupDrillPartFromFurnitureItem(n);
              if (part === 'door' && !door) door = tid;
              else if (part === 'facade' && !facade) facade = tid;
            }
          }
        }
        if (Array.isArray(n.children)) walk(n.children);
      }
    };
    walk(nodes);
    return { facade, door };
  }

  _applyHingeDrillTemplateIdsToFacadeContext(drillIds) {
    if (!drillIds || typeof drillIds !== 'object') return;
    const facade = Number(drillIds.facade) || 0;
    const door = Number(drillIds.door) || 0;
    if (!(facade > 0) && !(door > 0)) return;
    this._facadeHingeContext = this._facadeHingeContext || {
      layoutRole: '',
      catalogHingeLayoutId: null,
      catalogHingeModulesApplied: false,
      catalogHingeModulesInTree: false,
    };
    if (facade > 0) this._facadeHingeContext.hingeFacadeDrillTemplateId = facade;
    if (door > 0) this._facadeHingeContext.hingeDoorDrillTemplateId = door;
  }

  _stampHingeDrillTemplateIdsOnModuleTree(tree, drillIds) {
    if (!Array.isArray(tree) || !drillIds) return;
    const facade = Number(drillIds.facade) || 0;
    const door = Number(drillIds.door) || 0;
    if (!(facade > 0) && !(door > 0)) return;
    const gen = typeof window !== 'undefined' ? window.__cldHingeLayout : null;
    const isHingeMod =
      gen && typeof gen.isHingeModuleTreeNode === 'function'
        ? (n) => gen.isHingeModuleTreeNode(n)
        : (n) =>
            String(n?.type || '').toLowerCase() === 'module' &&
            String(n?.spec?.element_type || '').toLowerCase() === 'hinges';
    const walk = (nodes) => {
      if (!Array.isArray(nodes)) return;
      for (const n of nodes) {
        if (isHingeMod(n)) {
          n.spec = n.spec && typeof n.spec === 'object' ? n.spec : {};
          if (facade > 0) {
            if (!n.spec.hingeFacadeDrillTemplateId) n.spec.hingeFacadeDrillTemplateId = facade;
            if (!n.spec.drillTemplateId) n.spec.drillTemplateId = facade;
          }
          if (door > 0 && !n.spec.hingeDoorDrillTemplateId) {
            n.spec.hingeDoorDrillTemplateId = door;
          }
        }
        if (Array.isArray(n.children)) walk(n.children);
      }
    };
    walk(tree);
  }

  _hingeCupDrillPartFromFurnitureItem(item) {
    const specPart = String(
      item?.spec?.hingeDrillPart || item?.spec?.hingePart || item?.hingeDrillPart || ''
    ).toLowerCase();
    if (specPart === 'door' || specPart === 'corpus') return 'door';
    if (specPart === 'facade') return 'facade';
    const pos = item?.pos && typeof item.pos === 'object' ? item.pos : {};
    const zStr = String(pos.z ?? '');
    if (/37\.2/.test(zStr) || /s:z\s*-\s*37/i.test(zStr)) return 'door';
    const xRaw = String(pos.x ?? '').trim();
    const yRaw = String(pos.y ?? '').trim();
    const zRaw = String(pos.z ?? '').trim();
    const nx = Number(pos.x);
    const ny = Number(pos.y);
    const nz = Number(pos.z);
    // L-пакет / нулевой origin шаблона: одна Присадка на корпус+фасад — host пакета (door), не facade-skip.
    const x0 = xRaw === '' || xRaw === '0' || nx === 0;
    const y0 = yRaw === '' || yRaw === '0' || ny === 0;
    const z0 = zRaw === '' || zRaw === '0' || nz === 0;
    if (x0 && y0 && z0) return 'door';
    if (xRaw === '0' || nx === 0) {
      if (/s:z/i.test(zStr)) return 'door';
    }
    return 'facade';
  }

  _collectHingeDrillTemplateIds(parentSection) {
    const merge = (ids) => {
      if (!ids || typeof ids !== 'object') return;
      if (!facade && ids.facade > 0) facade = ids.facade;
      if (!door && ids.door > 0) door = ids.door;
    };
    let facade = 0;
    let door = 0;
    const pick = (...vals) => this._positiveDrillTemplateId(...vals);
    const ctx = this._facadeHingeContext || {};
    merge({ facade: pick(ctx.hingeFacadeDrillTemplateId), door: pick(ctx.hingeDoorDrillTemplateId) });
    let p = parentSection;
    for (let i = 0; i < 48 && p; i++) {
      merge({
        facade: pick(
          p.hingeFacadeDrillTemplateId,
          p.userData?.hingeFacadeDrillTemplateId,
          p.userData?.hingeSpec?.hingeFacadeDrillTemplateId
        ),
        door: pick(
          p.hingeDoorDrillTemplateId,
          p.userData?.hingeDoorDrillTemplateId,
          p.userData?.hingeSpec?.hingeDoorDrillTemplateId
        ),
      });
      const srcItems = [p.sourceItem, p.hingeCatalogSourceItem].filter(Boolean);
      for (const src of srcItems) {
        merge(this._hingeDrillIdsFromMergedSource(src, null));
        if (Array.isArray(src.accessories)) {
          for (const a of src.accessories) {
            if (!a) continue;
            merge({
              facade: pick(a.hingeFacadeDrillTemplateId, a.drillTemplateId),
              door: pick(a.hingeDoorDrillTemplateId, a.drillTemplateId),
            });
          }
        }
      }
      p = p.parent || p._cldSectionContext;
    }
    return { facade, door };
  }

  _hingeDrillTemplateIdsFromContext(parentSection) {
    return this._collectHingeDrillTemplateIds(parentSection);
  }

  _resolveHingeDrillTemplateIdFromContext(parentSection, part) {
    const ids = this._collectHingeDrillTemplateIds(parentSection);
    return part === 'door' ? ids.door : ids.facade;
  }

  _facadePanelBoundsZInSwing(facadePanel, swing, facadeGroup) {
    if (!facadePanel || !swing || typeof THREE === 'undefined') return null;
    const shellD = Math.max(1, this._resolveRoomFacadeThicknessMm(null, facadeGroup) || 16);

    const geom = facadePanel.geometry;
    if (geom) {
      if (!geom.boundingBox) geom.computeBoundingBox();
      const bb = geom.boundingBox;
      if (bb && !bb.isEmpty()) {
        const xs = [bb.min.x, bb.max.x];
        const ys = [bb.min.y, bb.max.y];
        const zs = [bb.min.z, bb.max.z];
        let minZ = Infinity;
        let maxZ = -Infinity;
        const v = new THREE.Vector3();
        facadePanel.updateMatrixWorld(true);
        for (let xi = 0; xi < xs.length; xi++) {
          for (let yi = 0; yi < ys.length; yi++) {
            for (let zi = 0; zi < zs.length; zi++) {
              v.set(xs[xi], ys[yi], zs[zi]);
              v.applyMatrix4(facadePanel.matrixWorld);
              swing.worldToLocal(v);
              if (v.z < minZ) minZ = v.z;
              if (v.z > maxZ) maxZ = v.z;
            }
          }
        }
        if (Number.isFinite(minZ) && Number.isFinite(maxZ)) {
          const depth = Math.max(1, maxZ - minZ);
          if (this._isThinFacadeShellDepth(shellD) && depth > shellD * 2.5) {
            return { backZ: minZ, frontZ: minZ + shellD, depth: shellD };
          }
          return { backZ: minZ, frontZ: maxZ, depth };
        }
      }
    }

    const box = new THREE.Box3().setFromObject(facadePanel);
    if (box.isEmpty()) return null;
    const zm = this._boxMinMaxZInSwingLocal(box, swing);
    if (zm.min == null || zm.max == null) return null;
    const depth = Math.max(1, zm.max - zm.min);
    if (this._isThinFacadeShellDepth(shellD) && depth > shellD * 2.5) {
      return { backZ: zm.min, frontZ: zm.min + shellD, depth: shellD };
    }
    return {
      backZ: zm.min,
      frontZ: zm.max,
      depth,
    };
  }

  /** Z-align только при закрытой двери — иначе сдвиг по swing.local Z уезжает в X/Y. */
  _withDoorSwingClosedForHingeAlign(swing, fn) {
    if (!swing || typeof fn !== 'function') return;
    const sw = swing.userData?.cldDoorSwing;
    if (!sw) {
      fn();
      return;
    }
    const saved = {
      currentAngle: sw.currentAngle,
      targetAngle: sw.targetAngle,
      isOpen: sw.isOpen,
      rotY: swing.rotation.y,
      rotX: swing.rotation.x,
      rotZ: swing.rotation.z,
    };
    sw.currentAngle = 0;
    sw.targetAngle = 0;
    if (sw.axis === 'y') swing.rotation.y = 0;
    else if (sw.axis === 'x') swing.rotation.x = 0;
    else if (sw.axis === 'z') swing.rotation.z = 0;
    swing.updateMatrixWorld(true);
    try {
      fn();
    } finally {
      sw.currentAngle = saved.currentAngle;
      sw.targetAngle = saved.targetAngle;
      sw.isOpen = saved.isOpen;
      if (sw.axis === 'y') swing.rotation.y = saved.rotY;
      else if (sw.axis === 'x') swing.rotation.x = saved.rotX;
      else if (sw.axis === 'z') swing.rotation.z = saved.rotZ;
      swing.updateMatrixWorld(true);
    }
  }

  _shiftAnimRootAlongSwingZ(animRoot, swing, deltaZ) {
    if (!animRoot || !swing || typeof THREE === 'undefined') return;
    if (!Number.isFinite(deltaZ) || Math.abs(deltaZ) < 0.02) return;
    const shiftParent = animRoot.parent || swing;
    if (shiftParent === swing) {
      animRoot.position.z += deltaZ;
    } else {
      const p0 = new THREE.Vector3(0, 0, 0);
      const p1 = new THREE.Vector3(0, 0, deltaZ);
      swing.localToWorld(p0);
      swing.localToWorld(p1);
      this._shiftObjectWorldZ(animRoot, shiftParent, p1.z - p0.z);
    }
    animRoot.updateMatrixWorld(true);
  }

  /** Реф Z в swing после reparent — выкл. по умолчанию (CLD_HINGE_FACADE_REF_Z=false). */
  _hingeFacadeRefZInSwingEnabled() {
    if (typeof window === 'undefined') return true;
    return window.CLD_HINGE_FACADE_REF_Z !== false;
  }

  /** Реф X фасада в swing (part7 ~4182) — только при CLD_HINGE_FACADE_REF_X=true; иначе pos из catalog_31 после attach. */
  _hingeFacadeRefXInSwingEnabled() {
    if (typeof window === 'undefined') return false;
    return window.CLD_HINGE_FACADE_REF_X === true;
  }

  /** Ширина фасадной половины по X (мм) — реф part7 hinge_facade.sizes.x (=11), не Ø чашки 35. */
  _resolveHingeFacadeRefWidthMm(facRoot, hingeMod) {
    const readMm = (v) => {
      const x = Number(v?.x);
      return Number.isFinite(x) && x > 0 ? x : 0;
    };
    const fromSpec = (sp) => {
      if (!sp || typeof sp !== 'object') return 0;
      return (
        readMm(sp.hingeFacadePreviewRefMm) ||
        readMm(sp.hingePreviewFacadeRefMm) ||
        readMm(sp.hingePreviewSwingModelRefMm) ||
        0
      );
    };
    let w = 0;
    hingeMod?.traverse?.((o) => {
      if (w > 0 || !o?.userData) return;
      w = fromSpec(o.userData.catalogItemSpec) || fromSpec(o.userData.itemSpec);
    });
    if (w <= 0 && hingeMod?.userData) {
      w = fromSpec(hingeMod.userData.catalogItemSpec) || fromSpec(hingeMod.userData.itemSpec);
    }
    if (w <= 0) {
      const gen = typeof window !== 'undefined' ? window.__cldHingeLayout : null;
      if (gen && typeof gen.refHingeFacadeArmWidthMm === 'function') {
        w = gen.refHingeFacadeArmWidthMm();
      }
    }
    if (w <= 0 && facRoot) {
      const box = this._boxWorldX(facRoot);
      if (box) w = Math.max(1, box.max - box.min);
    }
    return w > 0 ? w : 11;
  }

  /**
   * Post-build Z по bbox. В комнате (catalog + 16 мм) — всегда после reparent в swing.
   * Иначе — только при CLD_HINGE_FACADE_REF_Z / CLD_HINGE_FACADE_POSTALIGN.
   */
  _alignCatalogHingeFacadeZFromRefInSwing(hingeMod, swing, facadeGroup) {
    if (this._isCatalogHingeLSeamPackage(hingeMod)) return;
    const shellD = this._resolveRoomFacadeThicknessMm(null, facadeGroup);
    const roomThinCatalog =
      this._useCatalogHingeModulesInRoom() && this._isThinFacadeShellDepth(shellD);
    if (roomThinCatalog) {
      this._alignCatalogHingeFacadeZInSwing(hingeMod, swing, facadeGroup, { forceRoom: true });
      return;
    }
    if (!this._hingeFacadeRefZInSwingEnabled()) return;
    if (this._hingeFacadePostAlignEnabled()) {
      this._alignCatalogHingeFacadeZInSwing(hingeMod, swing, facadeGroup);
      return;
    }
    if (this._hingeRoomDbg()) {
      this._warnHingeRoomVerbose('[CLD][HINGE-ROOM] alignZ(ref facade) skipped — use buildModel ref z + catalog pos');
    }
  }

  /**
   * Реф part7 ~4182: z = -ft/2 - hz/2. В комнате (swing): весь bbox «К фасаду» (id:5) внутри [panelBackZ … panelFrontZ];
   * чашка catalog_31 z:-6.4 → центр отверстия panelBackZ + cupDepth/2 (после вписывания модели).
   */
  _alignCatalogHingeFacadeZInSwing(hingeMod, swing, facadeGroup, options) {
    if (!hingeMod || !swing || typeof THREE === 'undefined') return;
    const forceRoom = options?.forceRoom === true;
    if (!forceRoom && !this._hingeFacadePostAlignEnabled()) {
      return;
    }
    const facadePanel = this._findFacadePanelMeshFor(facadeGroup, swing);
    if (!facadePanel) {
      if (this._hingeRoomDbg()) {
        this._warnHingeRoomVerbose('[CLD][HINGE-ROOM] alignZ(swing) skip: no facade panel');
      }
      return;
    }

    this._withDoorSwingClosedForHingeAlign(swing, () => {
      swing.updateMatrixWorld(true);
      const panelZ = this._facadePanelBoundsZInSwing(facadePanel, swing, facadeGroup);
      if (!panelZ) return;
      const panelBackZ = panelZ.backZ;
      const panelFrontZ = panelZ.frontZ;
      const shellD = panelZ.depth || this._resolveRoomFacadeThicknessMm(null, facadeGroup);
      const cupDepth = 12.8;
      const cupHalf = cupDepth / 2;
      const cupCenterTarget = panelBackZ + Math.min(cupHalf, Math.max(0.5, shellD - cupHalf));
      const catalogGlb = this._hingeModuleUsesCatalogGlb(hingeMod, swing);

      const animRoots = this._collectHingeAnimatorRootsForHingeModule(hingeMod, swing);

      let aligned = 0;
      const logRows = [];
      const frontMargin = 0.35;
      const backMargin = 0.15;

      for (const animRoot of animRoots) {
      animRoot.updateMatrixWorld(true);
      let detail = { panelBackZ, panelFrontZ, shellD, cupCenterTarget, catalogGlb };
      const facRoot = this._findHingeFacadePartRoot(animRoot);
      const cupAnchor = this._findHingeCupAnchorInAnim(animRoot);

      const applyFacadeZSteps = () => {
        const steps = [];
        const metalBox = this._hingeFacadeMetalBox3(animRoot);
        const fitBox = this._hingeFacadeFitBox3(animRoot);
        const box =
          catalogGlb && metalBox && !metalBox.isEmpty()
            ? metalBox
            : fitBox && !fitBox.isEmpty()
              ? fitBox
              : facRoot
                ? new THREE.Box3().setFromObject(facRoot)
                : null;
        if (!box || box.isEmpty()) return steps;
        const zm = this._boxMinMaxZInSwingLocal(box, swing);
        if (zm.max == null || zm.min == null) return steps;
        if (catalogGlb) {
          // Реф part7: z = -ft/2 - hz/2 — пластина на тылу полотна, тело в зазор к корпусу.
          const overlayFrontMm = 8;
          const maxCorpusExtendMm = 22;
          if (zm.min > panelBackZ + 0.45) {
            steps.push({
              dz: panelBackZ - zm.min,
              mode: 'overlay_mount_inner_face',
            });
          } else if (zm.min < panelBackZ - maxCorpusExtendMm) {
            steps.push({
              dz: panelBackZ - maxCorpusExtendMm - zm.min,
              mode: 'overlay_corpus_limit',
            });
          }
          if (zm.max > panelFrontZ + overlayFrontMm) {
            steps.push({
              dz: panelFrontZ + overlayFrontMm - zm.max,
              mode: 'facade_fit_front_overlay',
            });
          }
          return steps;
        }
        const frontLimit = panelFrontZ - frontMargin;
        if (zm.max > frontLimit) {
          steps.push({
            dz: frontLimit - zm.max,
            mode: 'facade_fit_front',
          });
        } else if (zm.min < panelBackZ - backMargin) {
          steps.push({
            dz: panelBackZ - zm.min,
            mode: 'facade_fit_back',
          });
        }
        return steps;
      };

      if (catalogGlb && facRoot) {
        const metalBox0 = this._hingeFacadeMetalBox3(animRoot);
        if (metalBox0 && !metalBox0.isEmpty()) {
          const zm0 = this._boxMinMaxZInSwingLocal(metalBox0, swing);
          if (zm0.min != null && Math.abs(zm0.min - panelBackZ) > 0.35) {
            const dzBack = panelBackZ - zm0.min;
            this._shiftAnimRootAlongSwingZ(animRoot, swing, dzBack);
            aligned++;
            detail = { ...detail, zStep: 'overlay_snap_mount', zDelta: dzBack };
            animRoot.updateMatrixWorld(true);
          }
        }
        if (facRoot) {
          const zmF = this._boxMinMaxZInSwingLocal(
            new THREE.Box3().setFromObject(facRoot),
            swing
          );
          detail = { ...detail, finalFacZ: zmF };
        }
        if (logRows.length < 4) {
          logRows.push({ anim: animRoot.name, mode: 'catalog_overlay_mount_only', ...detail });
        }
        continue;
      }

      let deltaZ = null;
      let mode = '';
      const alignBox = this._hingeFacadeMetalBox3(animRoot);
      if (cupAnchor?.obj) {
        const cupBox = new THREE.Box3().setFromObject(cupAnchor.obj);
        if (!cupBox.isEmpty()) {
          const curCupZ = swing.worldToLocal(cupBox.getCenter(new THREE.Vector3()).clone()).z;
          deltaZ = cupCenterTarget - curCupZ;
          mode = 'cup_center_in_panel';
          detail = { ...detail, curCupZ, cupAnchor: cupAnchor.kind };
        }
      }
      if ((deltaZ == null || !Number.isFinite(deltaZ)) && alignBox && !alignBox.isEmpty()) {
        const zm = this._boxMinMaxZInSwingLocal(alignBox, swing);
        const facZ = Math.max(1, (zm.max ?? 0) - (zm.min ?? 0));
        const refCenterZ = panelBackZ - facZ / 2;
        const curCenterZ = swing.worldToLocal(alignBox.getCenter(new THREE.Vector3()).clone()).z;
        deltaZ = refCenterZ - curCenterZ;
        mode = 'ref_center_back';
        detail = { ...detail, wasMinZ: zm.min, wasMaxZ: zm.max, refCenterZ, curCenterZ };
      }
      if (deltaZ != null && Number.isFinite(deltaZ) && Math.abs(deltaZ) >= 0.02) {
        this._shiftAnimRootAlongSwingZ(animRoot, swing, deltaZ);
        aligned++;
      }
      if (logRows.length < 4) {
        logRows.push({ anim: animRoot.name, mode, deltaZ, ...detail });
      }
    }

      if (this._hingeRoomDbg()) {
        this._warnHingeRoomVerbose('[CLD][HINGE-ROOM] alignZ(swing)', {
          panelBackZ,
          panelFrontZ,
          shellD,
          cupCenterTarget,
          catalogGlb,
          aligned,
          animRoots: animRoots.length,
          rows: logRows,
        });
      }
    });
  }

  /** Корневые узлы корпусной половины (остаются в hingeMod после reparent фасада в swing). */
  _collectHingeCorpusRootsInModule(hingeMod) {
    const roots = [];
    if (!hingeMod || typeof hingeMod.traverse !== 'function') return roots;
    hingeMod.traverse((o) => {
      if (o === hingeMod) return;
      if (!this._isHingeAnimatorCorpusBranch(o)) return;
      roots.push(o);
    });
    return roots.filter((s) => !roots.some((q) => q !== s && this._isAncestor(q, s)));
  }

  /**
   * Сдвиг только корпусной ветки в hingeMod.local Z (мм).
   * Не трогаем hingeMod.position — иначе уезжает X к оси двери и «вылазит» сильнее, чем на N мм.
   */
  _shiftRoomHingeCorpusLocalZ(hingeMod, deltaMm) {
    if (!hingeMod || typeof THREE === 'undefined') return 0;
    const delta = Number(deltaMm);
    if (!Number.isFinite(delta) || Math.abs(delta) < 0.02) return 0;
    const roots = this._collectHingeCorpusRootsInModule(hingeMod);
    if (!roots.length) return 0;
    for (const node of roots) {
      node.position.z += delta;
      node.updateMatrixWorld(true);
    }
    hingeMod.updateMatrixWorld(true);
    return roots.length;
  }

  /**
   * Произвольные ±мм поверх дерева — не в рефе PlanPlace / не в превью.
   * Позицию корпуса/фасада задают в админке (карточка / шаблон / «Петли по ролям»), не хардкодом здесь.
   */
  _applyRoomCatalogHingeZDepthOffsets(hingeMod, swing, facadeGroup, parentSection) {
    void hingeMod;
    void swing;
    void facadeGroup;
    void parentSection;
    if (this._hingeRoomDbg()) {
      this._warnHingeRoomVerbose('[CLD][HINGE-ROOM] room Z-depth offsets skipped (ref: tree coords only)');
    }
  }

  /** Legacy: корпус к тылу фасада. Catalog — только _alignCatalogHingeCorpusOriginToSidewall. */
  _alignCatalogHingeCorpusZToFacadeBack(hingeMod, swing, facadeGroup) {
    if (this._useCatalogHingeModulesInRoom()) {
      if (this._hingeRoomDbg()) {
        this._warnHingeRoomVerbose('[CLD][HINGE-ROOM] alignZ(corpus→facade) skipped (sidewall origin)');
      }
      return;
    }
    if (!hingeMod || typeof THREE === 'undefined') return;
    if (!this._hingeCorpusPostAlignEnabled()) {
      if (this._hingeRoomDbg()) {
        this._warnHingeRoomVerbose('[CLD][HINGE-ROOM] alignZ(corpus) skipped (CLD_HINGE_CORPUS_POSTALIGN=false)');
      }
      return;
    }
    const parent = hingeMod.parent;
    const facadePanel = this._findFacadePanelMeshFor(facadeGroup, swing);
    const corpus = this._findHingeCorpusMeshIn(hingeMod);
    if (!parent || !facadePanel || !corpus) {
      if (this._hingeRoomDbg()) {
        this._warnHingeRoomVerbose('[CLD][HINGE-ROOM] alignZ(corpus) skip', {
          hasParent: !!parent,
          hasPanel: !!facadePanel,
          hasCorpus: !!corpus,
        });
      }
      return;
    }

    facadePanel.updateMatrixWorld(true);
    corpus.updateMatrixWorld(true);
    const panelBox = new THREE.Box3().setFromObject(facadePanel);
    const corpusBox = new THREE.Box3().setFromObject(corpus);
    if (panelBox.isEmpty() || corpusBox.isEmpty()) return;

    const facadeBackWorldZ = panelBox.min.z;
    const corpusFrontWorldZ = corpusBox.max.z;
    const shiftWorldZ = facadeBackWorldZ - corpusFrontWorldZ;
    if (Math.abs(shiftWorldZ) < 0.05) return;

    this._shiftObjectWorldZ(hingeMod, parent, shiftWorldZ);
    hingeMod.updateMatrixWorld(true);

    if (this._hingeRoomDbg()) {
      this._warnHingeRoomVerbose('[CLD][HINGE-ROOM] alignZ(corpus)', {
        facadeBackWorldZ,
        corpusFrontWorldZ,
        shiftWorldZ,
      });
    }
  }

  _boxWorldX(obj) {
    if (!obj || typeof THREE === 'undefined') return null;
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    if (box.isEmpty()) return null;
    return { min: box.min.x, max: box.max.x };
  }

  /** Реф part7 ~4176: для ltr у корпусной половины rotation.z = PI (legacy FBX). */
  _applyRefHingeCorpusLtrRotation(hingeMod, isLTR) {
    if (!hingeMod || !isLTR) return;
    hingeMod.traverse((o) => {
      if (!o || o.userData?._cldRefHingeCorpusLtrRot) return;
      const nm = String(o.name || '');
      if (!/корпус/i.test(nm)) return;
      let target = o;
      if (o.isMesh && o.parent) target = o.parent;
      if (this._isCatalogHingeGlbNode(target) || this._isCatalogHingeGlbNode(o)) return;
      if (/furni_hinge_door/i.test(nm)) {
        target.rotation.z = Math.PI;
        target.userData._cldRefHingeCorpusLtrRot = true;
      }
    });
    hingeMod.updateMatrixWorld(true);
  }

  /**
   * Комнатный align X для каталожной петли.
   * Корпус (catalog): X якоря уже на боковине (_alignCatalogHingeCorpusOriginToSidewall) —
   * не центрируем mesh по thickness+halfW (это ломало шаблон #5).
   * Legacy FBX: реф part7 ~4163.
   */
  _alignCatalogHingeModuleXFromRef(hingeMod, facadeGroup, swing) {
    if (!hingeMod || typeof THREE === 'undefined') return;
    const parent = hingeMod.parent;
    if (!parent) return;

    const dir =
      String(swing?.userData?.cldDoorDirection || '').toLowerCase() ||
      String(hingeMod.userData?.cldDoorDirection || '').toLowerCase() ||
      'ly';
    const isLTR = !dir.startsWith('r');

    const catalogGlb = this._hingeModuleUsesCatalogGlb(hingeMod, swing);
    if (!catalogGlb) {
      this._applyRefHingeCorpusLtrRotation(hingeMod, isLTR);
    } else {
      // Catalog + шаблон на боке: корпусный X уже выставлен якорем на пласть боковины.
      if (this._hingeRoomDbg()) {
        this._warnHingeRoomVerbose('[CLD][HINGE-ROOM] alignX(ref) skip corpus (sidewall origin)');
      }
      return;
    }

    const overhangMm = Math.max(0, Number(facadeGroup?.userData?.facadeBottomOverhangMm) || 0);
    if (overhangMm > 0) {
      // Свес только на полотне; X петли = pos.x из «петли по ролям» (как без свеса).
      return;
    }

    const facadeMesh = this._findFacadePanelMeshFor(facadeGroup, swing);
    const corpus = this._findHingeCorpusMeshIn(hingeMod);
    if (!facadeMesh || !corpus) {
      if (this._hingeRoomDbg()) {
        this._warnHingeRoomVerbose('[CLD][HINGE-ROOM] alignX(ref) skip: missing mesh', {
          hasFacadeMesh: !!facadeMesh,
          hasCorpusMesh: !!corpus,
          facadeGroup: facadeGroup?.name,
          swingName: swing?.name,
          hingeName: hingeMod?.name,
        });
      }
      return;
    }

    const facadeBoxW = this._boxWorldX(facadeMesh);
    const corpusBoxW = this._boxWorldX(corpus);
    if (!facadeBoxW || !corpusBoxW) {
      if (this._hingeRoomDbg()) {
        this._warnHingeRoomVerbose('[CLD][HINGE-ROOM] alignX(ref) skip: empty bbox', {
          hasFacadeBox: !!facadeBoxW,
          hasCorpusBox: !!corpusBoxW,
          facadeName: facadeMesh?.name,
          corpusName: corpus?.name,
        });
      }
      return;
    }

    const corpusW = Math.max(1, corpusBoxW.max - corpusBoxW.min);
    const doorEdgeX = isLTR ? facadeBoxW.min : facadeBoxW.max;
    const wallT = this._cabinetSidewallThicknessMm();

    const refCenterX = isLTR
      ? doorEdgeX + wallT + corpusW / 2
      : doorEdgeX - wallT - corpusW / 2;

    const currentCenterX = (corpusBoxW.min + corpusBoxW.max) / 2;
    const shiftWorldX = refCenterX - currentCenterX;

    if (!this._hingeCorpusPostAlignEnabled()) {
      if (this._hingeRoomDbg()) {
        this._warnHingeRoomVerbose('[CLD][HINGE-ROOM] alignX(ref) corpus shift skipped', {
          doorEdgeX,
          refCenterX,
          currentCenterX,
          shiftWorldX,
        });
      }
    } else if (Math.abs(shiftWorldX) < 0.05) {
      if (this._hingeRoomDbg()) {
        this._warnHingeRoomVerbose('[CLD][HINGE-ROOM] alignX(ref) noop (tiny shift)', {
          shiftWorldX,
          refCenterX,
          currentCenterX,
          dir,
        });
      }
      return;
    }

    if (this._hingeCorpusPostAlignEnabled()) {
      parent.updateMatrixWorld(true);
      this._shiftObjectWorldX(hingeMod, parent, shiftWorldX);
    }

    hingeMod.updateMatrixWorld(true);

    if (this._hingeRoomDbg()) {
      const after = this._boxWorldX(corpus);
      this._warnHingeRoomVerbose('[CLD][HINGE-ROOM] alignX(ref corpus post)', {
        dir,
        isLTR,
        doorEdgeX,
        wallT,
        refCenterX,
        corpusW,
        currentCenterX,
        shiftWorldX,
        facadeX: facadeBoxW,
        corpusX: after,
        hingeModPosX: hingeMod.position.x,
      });
    }
  }

  /**
   * Реф part7 ~4182 (только CLD_HINGE_FACADE_REF_X=true): position.x = j*hinge_facade.x/2 от центра полотна.
   * По умолчанию выкл. — X из catalog_31 (attach сохраняет мировую позицию).
   */
  _alignCatalogHingeFacadeXFromRef(hingeMod, facadeGroup, swing) {
    if (!hingeMod || !swing || typeof THREE === 'undefined') return;
    if (this._isCatalogHingeLSeamPackage(hingeMod)) return;
    if (!this._useCatalogHingeModulesInRoom()) return;
    if (!this._hingeFacadeRefXInSwingEnabled()) return;

    const dir =
      String(swing?.userData?.cldDoorDirection || '').toLowerCase() ||
      String(hingeMod.userData?.cldDoorDirection || '').toLowerCase() ||
      'ly';
    const isLTR = !dir.startsWith('r');

    const facadeMesh = this._findFacadePanelMeshFor(facadeGroup, swing);
    if (!facadeMesh) {
      if (this._hingeRoomDbg()) {
        this._warnHingeRoomVerbose('[CLD][HINGE-ROOM] alignX(ref facade) skip: no panel');
      }
      return;
    }

    const facadeBoxW = this._boxWorldX(facadeMesh);
    if (!facadeBoxW) return;
    const doorCenterX = (facadeBoxW.min + facadeBoxW.max) / 2;
    const j = isLTR ? -1 : 1;
    const wp = new THREE.Vector3();

    swing.updateMatrixWorld(true);
    const taggedRoots = [];
    swing.traverse((o) => {
      if (!o) return;
      if (String(o.userData?._cldHingeOwnerUuid || '') !== String(hingeMod.uuid || '')) return;
      taggedRoots.push(o);
    });

    let movedAnimatorRoots = 0;
    const movedNames = [];
    const dbgRows = [];
    for (const o of taggedRoots) {
      this._resetCatalogHingeFacadeRefLtrRotation(o);
      const facRoot = this._findHingeFacadePartRoot(o) || this._findHingeFacadeMeshIn(o);
      if (!facRoot) continue;
      const refW = this._resolveHingeFacadeRefWidthMm(facRoot, hingeMod);
      let alignNode = facRoot;
      if (facRoot.isMesh && facRoot.parent?.userData?.isCabinetModel) {
        alignNode = facRoot.parent;
      }
      alignNode.getWorldPosition(wp);
      const facOriginX = wp.x;
      const facRefOriginX = doorCenterX + j * (refW / 2);
      const facShiftWorldX = facRefOriginX - facOriginX;
      if (Math.abs(facShiftWorldX) < 0.05) continue;
      const shiftParent = o.parent || swing;
      this._shiftObjectWorldX(o, shiftParent, facShiftWorldX);
      movedAnimatorRoots++;
      if (movedNames.length < 6) movedNames.push(String(facRoot.name || 'facade'));
      if (dbgRows.length < 4) {
        dbgRows.push({
          refW,
          doorCenterX,
          facOriginX,
          facRefOriginX,
          shift: facShiftWorldX,
        });
      }
    }

    if (this._hingeRoomDbg()) {
      this._warnHingeRoomVerbose('[CLD][HINGE-ROOM] alignX(ref facade origin)', {
        movedAnimatorRoots,
        movedNames,
        doorCenterX,
        dir,
        isLTR,
        rows: dbgRows,
      });
    }
  }

  _measureGroupLocalSizeMm(group) {
    if (!group || typeof THREE === 'undefined') return null;
    const box = new THREE.Box3().setFromObject(group);
    if (box.isEmpty()) return null;
    const s = box.getSize(new THREE.Vector3());
    return { x: s.x, y: s.y, z: s.z };
  }

  _buildHingeModuleForSection(group, item, parentSection, ctx) {
    const spec = item && item.spec && typeof item.spec === 'object' ? item.spec : {};
    let rootGroup = parentSection && parentSection.groupRef ? parentSection.groupRef : null;
    let swing =
      rootGroup && typeof rootGroup.getObjectByName === 'function'
        ? rootGroup.getObjectByName('__door_swing')
        : null;
    // Вложенный catalog-модуль: groupRef указывает на группу модуля, а __door_swing — у корневой секции шкафа.
    let p = parentSection && parentSection.parent;
    for (let i = 0; i < 32 && p && !swing; i++) {
      const rg = p.groupRef;
      if (rg && typeof rg.getObjectByName === 'function') {
        const s = rg.getObjectByName('__door_swing');
        if (s) {
          rootGroup = rg;
          swing = s;
          break;
        }
      }
      p = p.parent;
    }

    const readVec = (v, d = { x: 0, y: 0, z: 0 }) => ({
      x: Number(v?.x ?? d.x) || 0,
      y: Number(v?.y ?? d.y) || 0,
      z: Number(v?.z ?? d.z) || 0,
    });

    const basePos = readVec(ctx?.pos, { x: 0, y: 0, z: 0 });
    const corpusRel = readVec(spec.hingePreviewCorpusRelPosMm, { x: 0, y: 0, z: 0 });
    const swingRel = readVec(spec.hingePreviewSwingModelPosMm, { x: 0, y: 0, z: 0 });
    const doorSize = readVec(spec.ref_size_mm, ctx?.size || { x: 12, y: 55, z: 12 });
    const corpusSize = readVec(spec.hingePreviewCabinetCorpusRefSizeMm, { x: 12, y: 55, z: 12 });

    const mat = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      metalness: 0.7,
      roughness: 0.3,
    });
    const meta = {
      isAccessory: true,
      isFurniture: true,
      isHingeBazisExport: true,
      accessorySku: String(spec.id || ''),
      accessoryName: String(item?.name || 'Петля'),
    };

    // Корпусная часть: остается в координатах секции (статичная).
    const corpusMesh = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(corpusSize.x, 1), Math.max(corpusSize.y, 1), Math.max(corpusSize.z, 1)),
      mat
    );
    corpusMesh.name = 'furni_hinge_door';
    corpusMesh.userData = { ...corpusMesh.userData, ...meta, hingePart: 'corpus' };
    corpusMesh.position.set(
      basePos.x + corpusRel.x,
      basePos.y + corpusRel.y,
      basePos.z + corpusRel.z
    );
    group.add(corpusMesh);

    // Фасадная часть: в swing-группу, чтобы вращалась вместе с фасадом.
    const facadeMesh = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(doorSize.x, 1), Math.max(doorSize.y, 1), Math.max(doorSize.z, 1)),
      mat
    );
    facadeMesh.name = 'furni_hinge_facade';
    facadeMesh.userData = { ...facadeMesh.userData, ...meta, hingePart: 'facade' };
    facadeMesh.position.set(
      basePos.x + swingRel.x,
      basePos.y + swingRel.y,
      basePos.z + swingRel.z
    );
    if (swing) {
      swing.add(facadeMesh);
    } else {
      // fallback: если swing еще не построен, добавляем в модуль (поведение прежнее, но с визуалом)
      group.add(facadeMesh);
    }
  }

  // Build furniture (accessory item)
  buildFurniture(item, parentSection) {
    this._invokeItemEvent(item, 'on_before_params', { parentSection });
    // Стыковой кадр: не мержить drill/catalog шаблон — дети model уже в JSON.
    const earlyJointScheme =
      !!item?.fromJointScheme ||
      Number(item?.spec?.joint_template_frame) === 1 ||
      Number(item?.spec?.joint_hardware) === 1;
    const resolvedFromCatalog = earlyJointScheme
      ? null
      : this._resolveFurnitureCatalogParams(item, parentSection);
    let effectiveItem = resolvedFromCatalog || item;
    const furnitureName = effectiveItem.name || item.name || 'furniture';
    const underModelHost = !!(parentSection && parentSection.cabinetModelLocalHost);
    const underHinge = !!(parentSection && parentSection.hingeModuleLocalBuild);
    // Стыковой крепёж (эксцентрик/конфирмат) — НЕ присадка: иначе setup_type/group=furniture
    // уводит кадр в drill-resolve и крепёж пропадает в НМ/админке.
    const isJointSchemeFurni =
      !!(effectiveItem?.fromJointScheme || item?.fromJointScheme) ||
      Number(
        effectiveItem?.spec?.joint_template_frame ?? item?.spec?.joint_template_frame,
      ) === 1 ||
      Number(effectiveItem?.spec?.joint_hardware ?? item?.spec?.joint_hardware) === 1 ||
      Number(
        effectiveItem?.spec?.joint_template_model ?? item?.spec?.joint_template_model,
      ) === 1;
    // Кадровая цепочка: шаблон в дереве шкафа → комната. Не только «петля/model».
    const looksLikeDrillFurni =
      !isJointSchemeFurni &&
      (/присадк/i.test(furnitureName) ||
        String(effectiveItem?.spec?.group || '').toLowerCase() === 'furniture' ||
        Number(effectiveItem?.spec?.setup_type ?? effectiveItem?.spec?.setupType) > 0 ||
        Number(effectiveItem?.spec?.drillTemplateId ?? effectiveItem?.spec?.templateId) > 0);
    let drillTidEarly =
      !isJointSchemeFurni && (looksLikeDrillFurni || underHinge || underModelHost)
        ? this._resolveFurnitureDrillTemplateId(
            effectiveItem?.spec || item?.spec,
            parentSection,
            effectiveItem || item,
          )
        : 0;
    const isHingeDrillFurni =
      !isJointSchemeFurni && underHinge && (looksLikeDrillFurni || Number(drillTidEarly) > 0);
    const isModelHostDrillFurni =
      !isJointSchemeFurni &&
      underModelHost &&
      (looksLikeDrillFurni || Number(drillTidEarly) > 0);
    const isAnyDrillFurni =
      !isJointSchemeFurni &&
      (Number(drillTidEarly) > 0 || isHingeDrillFurni || isModelHostDrillFurni);

    let hingeTemplateDrillHoles = null;
    if (isAnyDrillFurni) {
      let tid =
        Number(drillTidEarly) > 0
          ? Number(drillTidEarly)
          : this._resolveFurnitureDrillTemplateId(
              effectiveItem?.spec || item?.spec,
              parentSection,
              effectiveItem || item,
            );
      if (!(tid > 0) && underModelHost) {
        tid = Number(effectiveItem?.spec?.id || item?.spec?.id) || 0;
      }
      if (tid > 0) {
        const tplInfo = this._getDrillTemplateHolesForBuilder(tid);
        const usable = (tplInfo.holes || []).filter((h) => h && !h.through);
        if (usable.length) {
          hingeTemplateDrillHoles = usable;
          if (!(Number(drillTidEarly) > 0)) drillTidEarly = tid;
        } else if (underModelHost || /присадк/i.test(furnitureName)) {
          console.warn('[CLD][DRILL] пустой шаблон присадки — дырки не построены (админка → выгрузить)', {
            tid,
            name: furnitureName,
            host: parentSection?.name || parentSection?.modelKey || '',
          });
        }
      }
      effectiveItem = JSON.parse(JSON.stringify(effectiveItem));
      effectiveItem.children = (effectiveItem.children || []).filter(
        (c) => String(c?.type || '').toLowerCase() !== 'hole',
      );
    }

    let size;
    if (
      effectiveItem.size &&
      (effectiveItem.size.x !== undefined ||
        effectiveItem.size.y !== undefined ||
        effectiveItem.size.z !== undefined)
    ) {
      size = this.evaluateSize(effectiveItem.size || {}, parentSection);
      this._dbg(`🔧 Фурнитура "${furnitureName}": размер из JSON =`, size, 'мм');
    } else {
      size = { x: 10, y: 10, z: 5 };
      this._dbg(`🔧 Фурнитура "${furnitureName}": размер по умолчанию =`, size, 'мм');
    }

    const DR = typeof globalThis !== 'undefined' ? globalThis.__CLD_DRILL_RESOLVE : null;
    let isLSeamDrillTpl = false;
    let isSingleFaceDrill = false;
    let setupTypeResolved = 0;
    let drillPlacement = null;
    const setupFromTree =
      Number(
        effectiveItem?.spec?.setup_type ??
          effectiveItem?.spec?.setupType ??
          item?.spec?.setup_type ??
          item?.spec?.setupType,
      ) || 0;
    let tplMetaForPlace = null;
    if (isAnyDrillFurni && Number(drillTidEarly) > 0) {
      tplMetaForPlace = this._getDrillTemplateHolesForBuilder(Number(drillTidEarly));
    }

    // Стыковой кадр: не оставлять baked ±300 с карточки 600 при ячейке 500.
    const isJointTemplateFrame =
      !!(effectiveItem?.fromJointScheme || item?.fromJointScheme) &&
      Number(
        effectiveItem?.spec?.joint_template_frame ?? item?.spec?.joint_template_frame,
      ) === 1;
    if (isJointTemplateFrame) {
      const parentSz = parentSection?.size || {};
      const jIdx = Number(effectiveItem?.jointIdx ?? item?.jointIdx);
      const rawPos = effectiveItem.pos || item.pos || {};
      const remapped = this._remapJointFramePosToParentSize(rawPos, jIdx, parentSz);
      effectiveItem = {
        ...effectiveItem,
        pos: { ...rawPos, ...remapped },
      };
      if (Number.isFinite(jIdx)) {
        this._dbg?.(
          `[joint-frame] remap pos x ${Number(rawPos.x) || 0} → ${remapped.x} (parentW=${Number(parentSz.x) || 0}, jointIdx=${jIdx})`,
        );
      }
    }

    let pos = this.evaluatePosition(effectiveItem.pos || item.pos || {}, parentSection, size);
    if (isAnyDrillFurni && DR && typeof DR.resolveFurnitureDrillPlacement === 'function') {
      const parentTypeForResolve = underModelHost
        ? 'model'
        : String(parentSection?.type || parentSection?.parentType || '').toLowerCase() === 'wall'
          ? 'wall'
          : '';
      drillPlacement = DR.resolveFurnitureDrillPlacement({
        setupTypeFromTree: setupFromTree,
        setupTypeFromTemplate: Number(tplMetaForPlace?.setupType) || 0,
        facadeModelId: Number(tplMetaForPlace?.facadeModelId) || 0,
        underModelHost,
        parentType: parentTypeForResolve,
        underHinge,
        pivot: effectiveItem.pivot || item.pivot,
        posMm: pos,
        parentSizeMm: parentSection?.size || {},
      });
      setupTypeResolved = drillPlacement.setupType;
      isLSeamDrillTpl = drillPlacement.isLSeam;
      isSingleFaceDrill = drillPlacement.isSingleFace;
      if (drillPlacement.sizeZero) size = { x: 0, y: 0, z: 0 };
      if (drillPlacement.clearInstancePivot && effectiveItem.pivot) {
        effectiveItem.pivot = { x: 0, y: 0, z: 0 };
      }
      if (isLSeamDrillTpl) {
        effectiveItem.pos = { x: 0, y: 0, z: 0 };
        pos = { x: 0, y: 0, z: 0 };
      } else {
        pos = { ...drillPlacement.originMm };
      }
    } else if (isAnyDrillFurni) {
      console.error('[CLD][DRILL] __CLD_DRILL_RESOLVE не загружен — присадка без канона посадки');
    }

    if (
      !isLSeamDrillTpl &&
      !isSingleFaceDrill &&
      isHingeDrillFurni &&
      hingeTemplateDrillHoles &&
      hingeTemplateDrillHoles.length
    ) {
      let maxDiam = 0;
      let maxDepth = 0;
      for (const h of hingeTemplateDrillHoles) {
        if (!h || h.through) continue;
        const d = Number(h.diameterMm ?? h.diameter) || 0;
        const dep = Number(h.depthMm ?? h.depth) || 0;
        if (d > maxDiam) maxDiam = d;
        if (dep > maxDepth) maxDepth = dep;
      }
      if (maxDiam > 0) size = { x: maxDiam, y: maxDiam, z: maxDepth > 0 ? maxDepth : size.z };
    }

    const useDrillOwnMount =
      isLSeamDrillTpl ||
      isSingleFaceDrill ||
      isModelHostDrillFurni ||
      isHingeDrillFurni ||
      !!(drillPlacement && drillPlacement.mountPivotZero);
    const pivot = useDrillOwnMount
      ? { x: 0, y: 0, z: 0 }
      : this.evaluatePivot(effectiveItem.pivot || item.pivot || {}, size);
    const rawPivot = useDrillOwnMount
      ? { x: 0, y: 0, z: 0 }
      : effectiveItem.pivot || item.pivot || {};
    const inHingeAnimatorBlb = underHinge;
    this._invokeItemEvent(item, 'on_before_build', { parentSection, size, pos, pivot });

    if (this._isHingeCatalogDrillPlaceholderItem(effectiveItem, parentSection)) {
      const empty = new THREE.Group();
      empty.name = `Furniture_${furnitureName}`;
      empty.userData.isDrillPlaceholder = true;
      if (inHingeAnimatorBlb) {
        this._applyFurnitureTransformRefInBlbParent(empty, pos, size, rawPivot, item.rot || {});
      } else {
        this.applyTransform(empty, pos, pivot, item.rot || {});
      }
      this._invokeItemEvent(item, 'on_after_build', { parentSection, target: empty, size, pos, pivot });
      return empty;
    }

    const hasChildren = Array.isArray(effectiveItem.children) && effectiveItem.children.length > 0;
    const hasHingeTemplateDrillHoles =
      !!hingeTemplateDrillHoles &&
      Array.isArray(hingeTemplateDrillHoles) &&
      hingeTemplateDrillHoles.length > 0;
    if (!hasChildren && !hasHingeTemplateDrillHoles) {
      if (isHingeDrillFurni || (isAnyDrillFurni && Number(drillTidEarly) > 0)) {
        const empty = new THREE.Group();
        empty.name = `Furniture_${furnitureName}`;
        empty.userData.isDrillPlaceholder = true;
        if (Number(drillTidEarly) > 0) empty.userData.cfrnDrillTemplateId = Number(drillTidEarly);
        if (inHingeAnimatorBlb || isSingleFaceDrill || isModelHostDrillFurni) {
          this._applyFurnitureTransformRefInBlbParent(empty, pos, size, rawPivot, item.rot || {});
        } else {
          this.applyTransform(empty, pos, pivot, item.rot || {});
        }
        this._invokeItemEvent(item, 'on_after_build', { parentSection, target: empty, size, pos, pivot });
        return empty;
      }
      const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
      const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `Furniture_${furnitureName}`;
      if (inHingeAnimatorBlb) {
        const wrap = new THREE.Group();
        wrap.name = `Furniture_${furnitureName}`;
        const own = this._applyFurnitureTransformRefInBlbParent(wrap, pos, size, rawPivot, item.rot || {});
        own.add(mesh);
        this._invokeItemEvent(item, 'on_after_build', { parentSection, target: wrap, size, pos, pivot });
        return wrap;
      }
      this.applyTransform(mesh, pos, pivot, item.rot || {});
      this._dbg(
        `✅ Фурнитура "${furnitureName}" создана: размер=(${size.x}, ${size.y}, ${size.z})мм, позиция=(${pos.x}, ${pos.y}, ${pos.z})мм`,
      );
      this._invokeItemEvent(item, 'on_after_build', { parentSection, target: mesh, size, pos, pivot });
      return mesh;
    }

    const group = new THREE.Group();
    group.name = `Furniture_${furnitureName}`;
    let mount;
    if (inHingeAnimatorBlb) {
      mount = this._applyFurnitureTransformRefInBlbParent(
        group,
        pos,
        size,
        rawPivot,
        effectiveItem.rot || item.rot || {},
      );
    } else if (isSingleFaceDrill || isModelHostDrillFurni || isLSeamDrillTpl) {
      mount = this._applyFurnitureTransformRefInBlbParent(
        group,
        pos,
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        effectiveItem.rot || item.rot || {},
      );
      if (underModelHost) group.userData.cabinetModelLocalHost = true;
      group.userData._drillTemplateLocalMmPerUnit = 1;
      if (isSingleFaceDrill) {
        group.userData.cldHostAnchorPivot =
          effectiveItem.pivot || item.pivot || { x: -1, y: -1, z: -1 };
      }
      if (Number(drillTidEarly) > 0) group.userData.cfrnDrillTemplateId = Number(drillTidEarly);
    } else if (isJointTemplateFrame || isJointSchemeFurni) {
      // Host-local мм панели (как admin joint_host_local): pos как есть, без pivot BLB.
      group.position.set(Number(pos.x) || 0, Number(pos.y) || 0, Number(pos.z) || 0);
      const jRot = effectiveItem.rot || item.rot || {};
      if (jRot.x) group.rotation.x = this.parseRotation(jRot.x);
      if (jRot.y) group.rotation.y = this.parseRotation(jRot.y);
      if (jRot.z) group.rotation.z = this.parseRotation(jRot.z);
      mount = group;
    } else {
      this.applyTransform(group, pos, pivot, effectiveItem.rot || item.rot || {});
      mount = group;
    }

    if (/присадк/i.test(furnitureName) && underHinge) {
      group.userData.hingeDrillPart = this._hingeCupDrillPartFromFurnitureItem(effectiveItem);
      const tid =
        Number(drillTidEarly) ||
        this._resolveFurnitureDrillTemplateId(
          effectiveItem?.spec || item?.spec,
          parentSection,
          effectiveItem || item,
        );
      if (tid > 0) {
        group.userData.cfrnDrillTemplateId = tid;
        group.userData.isHingeBazisExport = true;
        group.userData._drillTemplateLocalMmPerUnit = 1;
      }
    } else if (isAnyDrillFurni && Number(drillTidEarly) > 0 && !group.userData.cfrnDrillTemplateId) {
      group.userData.cfrnDrillTemplateId = Number(drillTidEarly);
      group.userData._drillTemplateLocalMmPerUnit = 1;
    }

    const drillIds = this._hingeDrillTemplateIdsFromContext(parentSection);
    const holeParentSizeMm =
      (isHingeDrillFurni || isModelHostDrillFurni || isSingleFaceDrill) && parentSection?.size
        ? { ...parentSection.size }
        : { ...size };
    const childContext = {
      name: furnitureName,
      size: holeParentSizeMm,
      parent: mount,
      variables: this.variables,
      groups: this.groups,
      layoutRole: parentSection?.layoutRole || '',
      wallThickness: parentSection?.wallThickness,
      hingeModuleLocalBuild: underHinge,
      cabinetModelLocalHost: underModelHost,
      hingeFacadeDrillTemplateId: drillIds.facade || parentSection?.hingeFacadeDrillTemplateId,
      hingeDoorDrillTemplateId: drillIds.door || parentSection?.hingeDoorDrillTemplateId,
      _cldSectionContext: parentSection?._cldSectionContext || parentSection,
    };
    (effectiveItem.children || []).forEach((child) => {
      const childItem = JSON.parse(JSON.stringify(child));
      this._normalizeAdminFields(childItem);
      const built = this.buildItem(childItem, childContext);
      if (built) mount.add(built);
    });

    if (isHingeDrillFurni) {
      const modelTid =
        Number(group.userData.cfrnDrillTemplateId) ||
        this._resolveFurnitureDrillTemplateId(
          effectiveItem?.spec || item?.spec,
          parentSection,
          effectiveItem || item,
        );
      if (modelTid > 0) {
        this._attachDrillTemplateCabinetModelToFurniture(mount, modelTid, parentSection);
      }
    }
    if (isHingeDrillFurni && this._hingeRoomDbg()) {
      console.warn('[CLD][HINGE-DRILL] Присадка ref-BLB', {
        name: furnitureName,
        pos,
        rawPivot,
        groupLocalPos: { x: group.position.x, y: group.position.y, z: group.position.z },
        ownPos: { x: mount.position.x, y: mount.position.y, z: mount.position.z },
        templateHoles: hingeTemplateDrillHoles ? hingeTemplateDrillHoles.length : 0,
      });
    }
    this._dbg(
      `✅ Фурнитура-контейнер "${furnitureName}" создана: children=${(effectiveItem.children || []).length}, позиция=(${pos.x}, ${pos.y}, ${pos.z})мм`,
    );
    this._stampJointSchemeUserData(group, effectiveItem || item);
    this._invokeItemEvent(item, 'on_after_build', { parentSection, target: group, size, pos, pivot });
    return group;
  }

  /** Сырой pivot (−1/0/1): для BLB-родителя pos = точка pivot, origin модуля смещаем к заднему BLB. */
  _pivotAxisNumeric(raw, fallback = -1) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }

  /**
   * Каталожный module (hasTree): pos в JSON — anchor pivot (как превью + conv_pivot).
   * pivot.z=1, pos.z=s:z → зад ящика на parentZ−size.z; pivot −1 → pos уже BLB (без сдвига).
   */
  _resolveCatalogModuleShellPositionBlb(pos, size, rawPivotObj) {
    const out = {
      x: Number(pos?.x) || 0,
      y: Number(pos?.y) || 0,
      z: Number(pos?.z) || 0,
    };
    const pv = rawPivotObj && typeof rawPivotObj === 'object' ? rawPivotObj : {};
    const adjust = (posVal, pivotRaw, sizeVal) => {
      const sz = Number(sizeVal) || 0;
      if (!(sz > 0)) return Number(posVal) || 0;
      const p = this._pivotAxisNumeric(pivotRaw, -1);
      if (p === -1) return Number(posVal) || 0;
      if (p === 1) return (Number(posVal) || 0) - sz;
      if (p === 0) return (Number(posVal) || 0) - sz / 2;
      return Number(posVal) || 0;
    };
    if (this._pivotAxisNumeric(pv.x, -1) !== -1) {
      out.x = adjust(out.x, pv.x, size?.x);
    }
    if (this._pivotAxisNumeric(pv.y, -1) !== -1) {
      out.y = adjust(out.y, pv.y, size?.y);
    }
    if (this._pivotAxisNumeric(pv.z, -1) !== -1) {
      out.z = adjust(out.z, pv.z, size?.z);
    }
    return out;
  }

  /**
   * Baked pos крепежа (±300 при карточке 600) → грань при текущем W панели.
   * jointIdx 2/3 = лево/право (ось X у гориз. панели); 0/1 = торец по Z.
   * Координаты — center-frame host local (как joint_host_local_mm в админке);
   * BLB-offset родителя потом сдвинет к min-углу.
   */
  _remapJointFramePosToParentSize(posObj, jointIdx, parentSizeMm) {
    const out = {
      x: Number(posObj?.x) || 0,
      y: Number(posObj?.y) || 0,
      z: Number(posObj?.z) || 0,
    };
    const j = Number(jointIdx);
    const sx = Number(parentSizeMm?.x) || 0;
    const sz = Number(parentSizeMm?.z) || 0;
    if (j === 2 || j === 3) {
      if (sx > 50) {
        const half = sx / 2;
        out.x = j === 2 || out.x < 0 ? -half : half;
      }
    } else if (j === 0 || j === 1) {
      if (sz > 50) {
        const half = sz / 2;
        // 0 = +face, 1 = −face (как joint-engine faceSign)
        out.z = j === 0 || out.z > 0 ? half : -half;
      }
    } else if (Math.abs(out.x) > 50 && sx > 50) {
      out.x = Math.sign(out.x) * (sx / 2);
    }
    return out;
  }

  /**
   * Мета стыкового крепежа с JSON → userData (для live reposition в комнате = админ-iframe).
   */
  _stampJointSchemeUserData(built, item) {
    if (!built?.userData || !item || typeof item !== 'object') return;
    const isJoint =
      !!item.fromJointScheme ||
      Number(item.spec?.joint_hardware) === 1 ||
      Number(item.spec?.joint_template_frame) === 1 ||
      Number(item.spec?.joint_template_model) === 1;
    if (!isJoint) return;
    built.userData.fromJointScheme = 1;
    built.userData.isAccessory = true;
    if (item.spec && typeof item.spec === 'object') {
      built.userData.spec = { ...(built.userData.spec || {}), ...item.spec };
    }
    if (Number(item.schemeId) > 0) built.userData.schemeId = Number(item.schemeId);
    if (item.jointIdx != null && Number.isFinite(Number(item.jointIdx))) {
      built.userData.jointIdx = Number(item.jointIdx);
    }
    if (Number(item.templateId) > 0) built.userData.templateId = Number(item.templateId);
    if (item.contactId) built.userData.contactId = String(item.contactId);
    if (item.neighborName) built.userData.neighborName = String(item.neighborName);
    if (item.seamPosMm != null && Number.isFinite(Number(item.seamPosMm))) {
      built.userData.seamPosMm = Number(item.seamPosMm);
    }
    if (item.frameIndex != null && Number.isFinite(Number(item.frameIndex))) {
      built.userData.frameIndex = Number(item.frameIndex);
    }
    if (Number(item.spec?.joint_template_frame) === 1) {
      built.userData.jointTemplateFrame = 1;
    }
    if (Number(item.spec?.joint_template_model) === 1) {
      built.userData.jointTemplateModel = 1;
    }
    if (Number(item.spec?.joint_hardware) === 1) {
      built.userData.joint_hardware = 1;
    }
    built.traverse((o) => {
      if (o?.userData) o.userData.isAccessory = true;
    });
  }

  /** Фантомные wall «Крепёж: …» из старого экспорта — не геометрия, только jointSchemes на родителе. */
  _isPhantomJointFittingWallItem(item) {
    if (!item || typeof item !== 'object') return false;
    if (String(item.type || '').toLowerCase() === 'joint_fitting' || item.synthetic === true) return true;
    const name = String(item.name || '');
    return String(item.type || '').toLowerCase() === 'wall' && /^Крепёж\s*:/i.test(name);
  }

  /** catalog_29 #6 / role shelf — плоская полка 16 мм (как превью), не section+wall из template_tree. */
  _isFlatCatalogShelfModuleItem(item) {
    if (typeof globalThis !== 'undefined' && typeof globalThis.__cldIsFlatCatalogShelfModule === 'function') {
      return globalThis.__cldIsFlatCatalogShelfModule(item);
    }
    if (!item || typeof item !== 'object') return false;
    const type = String(item.type || '').toLowerCase();
    if (type !== 'module' && type !== 'model') return false;
    const et = String(item.spec?.element_type || '').trim().toLowerCase();
    if (et !== 'catalog_29' && et !== '29') return false;
    const name = String(item.name || item.spec?.key || '').trim().toLowerCase();
    const id = String(item.spec?.id ?? '').trim();
    const role = String(item.layout_role ?? item.sectionLayoutRole ?? '').trim().toLowerCase();
    if (/планк|крепеж|крепёж|ящик|drawer|направ|guide|rail|mount|strip|slider|slide|выдвиж/i.test(name)) {
      return false;
    }
    if (role === 'drawer' || role === 'rod' || role === 'facade' || role === 'hinge') return false;
    if (role === 'shelf' || role === 'zone_divider') return true;
    if (id === '6') return true;
    return /полк|shelf/i.test(name) && !/ящик|планк/i.test(name);
  }

  /** Первая горизонтальная wall в clodisJSON catalog_29 (полка карточки). */
  _findCatalogShelfInnerWallNode(catalogItem) {
    const tree = this._moduleTemplateFromCatalogItem(catalogItem);
    if (!tree) return null;
    const stack = Array.isArray(tree) ? [...tree] : [tree];
    while (stack.length) {
      const n = stack.pop();
      if (!n || typeof n !== 'object') continue;
      const t = String(n.type || '').toLowerCase();
      if (t === 'wall') {
        const orient = String(n.spec?.orientation || '').toLowerCase();
        const dt = String(n.spec?.detailTypeId || n.spec?.detail_type_id || '');
        if (orient === 'h' || dt === 'horizontal_middle') return n;
      }
      if (Array.isArray(n.children)) stack.push(...n.children);
    }
    return null;
  }

  _readCatalogShelfInnerWallDefaults(item) {
    const et = String(item?.spec?.element_type || '').trim();
    const id = item?.spec?.id;
    if (!et || id == null || id === '') return null;
    const catItem = this._getCatalogItemById(et, id);
    if (!catItem) return null;
    return this._findCatalogShelfInnerWallNode(catItem);
  }

  /**
   * Синтетическая горизонтальная wall внутри shell module.
   * Z/pos.z/pivot — из clodisJSON карточки catalog_29 (s:z-9, pos.z=3, pivot.y=0).
   */
  _flatCatalogShelfWallItemFromModule(item, evaluatedSize, parentSection) {
    const sz = evaluatedSize && typeof evaluatedSize === 'object' ? evaluatedSize : {};
    const inner = this._readCatalogShelfInnerWallDefaults(item);
    const role = String(item.layout_role ?? item.sectionLayoutRole ?? '').trim().toLowerCase();
    const isDivider = role === 'zone_divider';

    const rawY = item?.size?.y;
    const yNum = Number(rawY);
    const yThin =
      Number.isFinite(yNum) && yNum > 0 && yNum < 120
        ? Math.round(yNum)
        : Math.max(8, Number(sz.y) || 16);

    const shellDepth = Math.max(0, Number(sz.z) || Number(parentSection?.size?.z) || 0);
    const sectionCtx =
      parentSection && parentSection.size
        ? parentSection
        : { size: { x: Number(sz.x) || 0, y: 0, z: shellDepth } };

    let sizeX = Number(sz.x) || 0;
    let sizeZ = shellDepth;
    let posX = 0;
    let posZ = 0;
    let pivot =
      item.pivot && typeof item.pivot === 'object'
        ? { ...item.pivot }
        : { x: -1, y: -1, z: -1 };

    if (inner) {
      const innerSize = inner.size && typeof inner.size === 'object' ? inner.size : {};
      const innerPos = inner.pos && typeof inner.pos === 'object' ? inner.pos : {};
      const innerPivot = inner.pivot && typeof inner.pivot === 'object' ? inner.pivot : null;

      if (innerSize.x != null && String(innerSize.x).trim() !== '') {
        try {
          const ev = this.evaluateSize({ x: innerSize.x }, sectionCtx);
          if (Number(ev.x) > 0) sizeX = Number(ev.x);
        } catch (_) {}
      }
      if (innerSize.z != null && String(innerSize.z).trim() !== '') {
        try {
          const ev = this.evaluateSize({ z: innerSize.z }, sectionCtx);
          if (Number(ev.z) > 0) sizeZ = Number(ev.z);
        } catch (_) {
          if (/s:z-9|s:z\s*-\s*9/i.test(String(innerSize.z).replace(/\s+/g, '')) && shellDepth > 0) {
            sizeZ = Math.max(0, shellDepth - 9);
          }
        }
      } else if (shellDepth > 0) {
        sizeZ = Math.max(0, shellDepth - 9);
      }

      if (innerPos.z !== undefined && innerPos.z !== null && String(innerPos.z).trim() !== '') {
        const rawZ = innerPos.z;
        const numZ = Number(rawZ);
        if (Number.isFinite(numZ)) {
          posZ = numZ;
        } else {
          try {
            const ev = this.evaluatePosition({ z: rawZ }, sectionCtx, { z: sizeZ });
            posZ = Number(ev.z) || 0;
          } catch (_) {}
        }
      }

      const modulePosX = Number(item?.pos?.x);
      if (
        innerPos.x !== undefined &&
        innerPos.x !== null &&
        String(innerPos.x).trim() !== '' &&
        !(Number.isFinite(modulePosX) && modulePosX > 0)
      ) {
        const ix = Number(innerPos.x);
        if (Number.isFinite(ix)) posX = ix;
      }

      if (innerPivot) {
        const modulePivotY = item.pivot?.y;
        const moduleCenterPivot =
          modulePivotY === 0 || modulePivotY === '0' || String(modulePivotY).trim() === '0';
        pivot = {
          x: innerPivot.x ?? -1,
          y: moduleCenterPivot ? 0 : innerPivot.y ?? -1,
          z: innerPivot.z ?? -1,
        };
      }
      if (isDivider) {
        pivot.y = 0;
      } else if (item.pivot && (item.pivot.y === 0 || item.pivot.y === '0')) {
        pivot.y = 0;
      }
    }

    // Legacy fill-шаблоны могли продублировать wall pos.z на module — переносим на wall один раз.
    if (!posZ) {
      const legacyModulePosZ = Number(item?.pos?.z);
      if (Number.isFinite(legacyModulePosZ) && legacyModulePosZ !== 0) {
        posZ = legacyModulePosZ;
      }
    }

    // БМ-workflow: схемы на полке карточки (jointSchemes), временные бока удалены.
    // При вставке в шкаф синтетическая wall должна нести те же схемы → отверстия к бокам корпуса.
    let jointSchemes = null;
    if (Array.isArray(inner?.jointSchemes) && inner.jointSchemes.length) {
      try {
        jointSchemes = JSON.parse(JSON.stringify(inner.jointSchemes));
      } catch (_) {
        jointSchemes = inner.jointSchemes.slice();
      }
    } else if (Array.isArray(item?.jointSchemes) && item.jointSchemes.length) {
      try {
        jointSchemes = JSON.parse(JSON.stringify(item.jointSchemes));
      } catch (_) {
        jointSchemes = item.jointSchemes.slice();
      }
    }

    return {
      type: 'wall',
      name: item.name || 'Полка',
      size: {
        x: sizeX,
        y: yThin,
        z: sizeZ,
      },
      pos: { x: posX, y: 0, z: posZ },
      pivot,
      rot: item.rot || { x: 0, y: 0, z: 0 },
      spec: {
        orientation: 'h',
        direction: 'z',
        side: 'center',
        detailTypeId: 'horizontal_middle',
        material:
          (item.spec && item.spec.material) ||
          inner?.spec?.material ||
          { group: 'g0', key: 'material_2', rotated: false, fixed: false },
      },
      material_key: item.material_key || inner?.material_key || 'material_2',
      material_group: item.material_group || inner?.material_group || 'g0',
      edges: item.edges || inner?.edges || {},
      ...(jointSchemes ? { jointSchemes } : {}),
      children: [],
    };
  }

  /**
   * Реф constructor-clodis / CabinetSection: pos на узле, rot (−deg) и conv_pivot translate на own_object.
   * applyTransform(pos − evaluatePivot) давал +size/2; rot на root ломал frame отверстий vs превью.
   */
  _applyFurnitureTransformRefInBlbParent(rootGroup, pos, size, rawPivotObj, rotObj) {
    const w = Number(size?.x) || 0;
    const h = Number(size?.y) || 0;
    const d = Number(size?.z) || 0;
    const pv = rawPivotObj && typeof rawPivotObj === 'object' ? rawPivotObj : {};
    const convX = (-(Number(pv.x) || 0) * w) / 2;
    const convY = (-(Number(pv.y) || 0) * h) / 2;
    const convZ = (-(Number(pv.z) || 0) * d) / 2;
    rootGroup.position.set(Number(pos?.x) || 0, Number(pos?.y) || 0, Number(pos?.z) || 0);
    rootGroup.rotation.set(0, 0, 0);
    let own = rootGroup.getObjectByName('__furniture_own');
    if (!own) {
      own = new THREE.Group();
      own.name = '__furniture_own';
      own.userData.cldFurnitureOwnObject = true;
      rootGroup.add(own);
    }
    own.position.set(0, 0, 0);
    own.rotation.set(0, 0, 0);
    const rot = rotObj && typeof rotObj === 'object' ? rotObj : {};
    if (rot.x) own.rotateX(-this.parseRotation(rot.x));
    if (rot.y) own.rotateY(-this.parseRotation(rot.y));
    if (rot.z) own.rotateZ(-this.parseRotation(rot.z));
    own.translateX(convX);
    own.translateY(convY);
    own.translateZ(convZ);
    return own;
  }

  /** Узлы «Присадка» в шаблоне каталога петель — не отдельные детали, см. constructor-clodis. */
  _builderSectionContextChainHasHinge(parentSection) {
    let p =
      parentSection && parentSection._cldSectionContext
        ? parentSection._cldSectionContext
        : parentSection;
    for (let g = 0; g < 28 && p; g++) {
      const nm = String(p.name || '').toLowerCase();
      if (/петл|hinge/i.test(nm)) return true;
      const sp = p.spec && typeof p.spec === 'object' ? p.spec : {};
      if (String(sp.element_type || '').toLowerCase() === 'hinges') return true;
      p = p.parent;
    }
    return false;
  }

  _isHingeCatalogDrillPlaceholderItem(item, parentSection) {
    if (!item || typeof item !== 'object') return false;
    const n = String(item.name || '').toLowerCase();
    if (!/присадк/.test(n)) return false;
    const t = String(item.type || '').toLowerCase();
    if (t !== 'facade' && t !== 'furniture') return false;
    if (item.spec && item.spec.cld_skip_mesh === true) return true;
    // Как в constructor-clodis: furniture «Присадка» (spec.id=3) — строим hole-детей для Bazis/CFRN,
    // не пустую заглушку. Пропускаем только визуальную заглушку facade «присадка».
    if (t === 'furniture') return false;
    return this._builderSectionContextChainHasHinge(parentSection);
  }

  /**
   * После hydrate: у catalog_38/37 убрать вшитый template_tree — иначе комната берёт
   * старые pos/pivot полок (до center-pivot или до shelfStack), а не live-каталог + политику.
   */
  _stripFillCatalogSnapshotsFromPlan(root) {
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      const t = String(node.type || '').toLowerCase();
      if (t === 'module' && node.spec && typeof node.spec === 'object') {
        const et = String(node.spec.element_type || '').trim().toLowerCase();
        if (et === 'catalog_38' || et === 'catalog_37') {
          delete node.spec.template_tree;
          if (Array.isArray(node.spec.templates)) delete node.spec.templates;
        }
      }
      if (Array.isArray(node.spec?.template_tree)) node.spec.template_tree.forEach(walk);
      if (Array.isArray(node.children)) node.children.forEach(walk);
    };
    if (Array.isArray(root)) root.forEach(walk);
    else walk(root);
  }

  _getCatalogsData() {
    if (typeof window === 'undefined') return null;
    return window.__CLD_CATALOGS_DATA || null;
  }

  /**
   * Каталоги в комнате: админка вызывает «Выгрузить всё в конструктор» и пишет
   * массивы в localStorage[catalog_<id>] (см. admin-room-settings.js initBulkExportButton).
   * Здесь читаем эти массивы лениво при первом обращении к каталожному ключу,
   * чтобы вложенные модули (ящик/фасад из соседнего каталога) корректно
   * разворачивались внутри корневого модуля даже без админского __CLD_CATALOGS_DATA.
   */
  _ensureCatalogFromLocalStorage(catalogKey) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    const key = String(catalogKey || '').trim();
    if (!key) return null;
    if (key === 'catalogs_keys' || key.startsWith('catalogCategories_')) return null;
    // catalog_<id> или произвольный ключ (hinges, facades и т.д.) — пробуем оба варианта
    const storageKeys = [];
    if (/^catalog_/.test(key)) storageKeys.push(key);
    storageKeys.push('catalog_' + key);
    storageKeys.push(key); // fallback на нестандартные ключи (facades/hinges и пр.)
    let raw = null;
    for (const sk of storageKeys) {
      try {
        const v = localStorage.getItem(sk);
        if (v) { raw = v; break; }
      } catch (_) {}
    }
    if (!raw) return null;
    let arr;
    try { arr = JSON.parse(raw); } catch (_) { return null; }
    if (!Array.isArray(arr) || !arr.length) return null;
    if (!window.__CLD_CATALOGS_DATA) window.__CLD_CATALOGS_DATA = {};
    // Сохраняем в map<id> — это тот формат, который _getCatalogItemById умеет читать.
    const map = {};
    for (const it of arr) {
      if (!it || typeof it !== 'object') continue;
      const idKey = it.id != null && it.id !== '' ? String(it.id) : (it.name ? String(it.name) : null);
      if (!idKey) continue;
      map[idKey] = it;
    }
    window.__CLD_CATALOGS_DATA[key] = { items: map };
    return window.__CLD_CATALOGS_DATA[key];
  }

  _catalogItemDataField(catalogItem, field) {
    if (!catalogItem || !field) return null;
    let data = catalogItem.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (_) {
        data = null;
      }
    }
    if (data && typeof data === 'object' && data[field] != null) return data[field];
    let params = catalogItem.params;
    if (typeof params === 'string') {
      try {
        params = JSON.parse(params);
      } catch (_) {
        params = null;
      }
    }
    if (params && typeof params === 'object' && params[field] != null) return params[field];
    return catalogItem[field] != null ? catalogItem[field] : null;
  }

  /** Карточка catalog_33: drawerNoHandle из кэша комнаты / localStorage (как items_get в превью). */
  _readDrawerNoHandleFlag(catalogKey, catalogId) {
    const id = String(catalogId || '').trim();
    const key = String(catalogKey || '').trim();
    if (!id || !key) return false;
    if (
      key === 'catalog_33' &&
      typeof globalThis.__cldReadDrawerNoHandleByCatalogId === 'function' &&
      globalThis.__cldReadDrawerNoHandleByCatalogId(id)
    ) {
      return true;
    }
    const catItem = this._getCatalogItemById(key, id);
    const v = this._catalogItemDataField(catItem, 'drawerNoHandle');
    return v === true || v === 1 || v === '1';
  }

  /**
   * Узел type:path (паз) — мета для CFRN на родительской детали.
   * Меш не строим (выемка только в Bazis).
   */
  buildPath(item, parentSection) {
    const name = item?.name || 'Паз';
    const group = new THREE.Group();
    group.name = name;
    group.userData = group.userData || {};
    group.userData.type = 'path';
    group.userData.isGroovePath = true;
    group.userData.cldPathParams = this._normalizePathGrooveParams(item, parentSection);
    // Если path вызвали вне buildWall (редко) — группа-маркер без геометрии.
    return group;
  }

  _normalizePathGrooveParams(item, parentSection) {
    const size = item?.size && typeof item.size === 'object' ? item.size : {};
    const pos = item?.pos && typeof item.pos === 'object' ? item.pos : {};
    const spec = item?.spec && typeof item.spec === 'object' ? item.spec : {};
    const evalNum = (v, fallback) => {
      if (v === undefined || v === null || v === '') return fallback;
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      try {
        const n = this.evaluateExpression
          ? this.evaluateExpression(v, parentSection)
          : Number(v);
        return Number.isFinite(Number(n)) ? Number(n) : fallback;
      } catch (_) {
        const n = Number(v);
        return Number.isFinite(n) ? n : fallback;
      }
    };
    // Реф CabinetPath: size.x = глубина в материал, size.y = ширина паза.
    const depthMm = evalNum(size.x, 5);
    const widthMm = evalNum(size.y, 4);
    const trajOrient = String(spec.orientation || 'h').toLowerCase() === 'v' ? 'v' : 'h';
    const offsetAlongMm = trajOrient === 'v'
      ? evalNum(pos.x != null ? pos.x : pos.y, 10)
      : evalNum(pos.y != null ? pos.y : pos.x, 10);
    const direction = String(spec.direction || '-z');
    const dz = evalNum(spec.dz, 0);
    const dz2 = evalNum(spec.dz_2 != null ? spec.dz_2 : spec.dz2, 0);
    let trajectory = null;
    if (Array.isArray(spec.trajectory) && spec.trajectory.length >= 2) {
      trajectory = spec.trajectory.map((p) => ({
        x: evalNum(p?.x, 0),
        y: evalNum(p?.y, 0),
      }));
    }
    return {
      kind: 'path',
      name: String(item?.name || 'Паз'),
      widthMm,
      depthMm,
      offsetAlongMm,
      trajOrient,
      direction,
      dz,
      dz2,
      trajectory,
      frontSide: spec.frontSide === true,
    };
  }

  _applyPathGrooveToWall(wallGroup, coreMesh, pathItem, parentSection) {
    const groove = this._normalizePathGrooveParams(pathItem, parentSection);
    const stamp = (obj) => {
      if (!obj?.userData) return;
      const list = Array.isArray(obj.userData.__cldGrooves)
        ? obj.userData.__cldGrooves.slice()
        : [];
      list.push(groove);
      obj.userData.__cldGrooves = list;
    };
    stamp(wallGroup);
    stamp(coreMesh);
  }

  _getCatalogItemById(catalogKey, id) {
    let catalogs = this._getCatalogsData();
    if (!catalogKey || id == null) return null;
    let cat = catalogs && catalogs[catalogKey];
    if (!cat || !cat.items) {
      // Ленивая загрузка из localStorage (комната не выполняет prefetch каталогов).
      cat = this._ensureCatalogFromLocalStorage(catalogKey) || null;
      catalogs = this._getCatalogsData();
      if (!cat) return null;
    }
    const items = cat.items;
    if (!items) return null;
    const key = String(id);
    if (Array.isArray(items)) {
      return items.find((it) => String(it?.id ?? '') === key) || null;
    }
    return items[key] || null;
  }

  _moduleTemplateFromCatalogItem(catalogItem) {
    if (!catalogItem || typeof catalogItem !== 'object') return null;

    let params = catalogItem.params;
    if (typeof params === 'string') {
      try { params = JSON.parse(params); } catch (_) { params = null; }
    }
    if (!params || typeof params !== 'object') params = {};

    let data = catalogItem.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (_) { data = null; }
    }
    if (!data || typeof data !== 'object') data = {};

    const roots = [catalogItem, params, data, { ...data, ...params }];
    const unwrapTree = (tryTree) => {
      if (typeof tryTree === 'string') {
        try {
          tryTree = JSON.parse(tryTree);
        } catch (_) {
          return null;
        }
      }
      if (Array.isArray(tryTree) && tryTree.length > 0) return tryTree;
      if (tryTree && typeof tryTree === 'object' && Array.isArray(tryTree.children) && tryTree.children.length) {
        return tryTree.children;
      }
      if (tryTree && typeof tryTree === 'object' && Array.isArray(tryTree.template?.structure)) {
        return tryTree.template.structure;
      }
      return null;
    };
    for (const root of roots) {
      if (!root || typeof root !== 'object') continue;
      const candidates = [
        root?.template?.structure,
        root?.spec?.template?.tree,
        root?.params?.constructor_structure?.children,
        root?.params?.constructor_structure,
        root?.constructor_structure?.children,
        root?.constructor_structure,
        // После save clodisJSON иногда уезжает строкой — парсим, иначе комната
        // теряет jointSchemes / fromJointScheme и крепёж остаётся только в админке.
        root?.clodisJSON,
        root?.params?.template?.tree,
        root?.params?.templates?.[0]?.template?.tree,
        root?.template?.tree,
        root?.template_tree,
      ];
      for (const cand of candidates) {
        const tree = unwrapTree(cand);
        if (tree) return tree;
      }
    }
    return null;
  }

  _resolveModuleTemplateTreeFromCatalog(elementType, elementId) {
    if (!elementType || elementId == null || elementId === '') return null;
    const catalogItem = this._getCatalogItemById(elementType, elementId);
    if (!catalogItem) return null;
    const tree = this._moduleTemplateFromCatalogItem(catalogItem);
    if (!tree) return null;
    const et = String(elementType || '').toLowerCase();
    if (et === 'catalog_32') {
      try {
        const fix =
          typeof window !== 'undefined' ? window.__cldFixPlinthLegDepthExprs : null;
        if (typeof fix === 'function') fix(tree);
      } catch (_) {}
    }
    return tree;
  }

  _isKitchenBaseBuildContext() {
    const pk = String(this.placementKind || '').trim().toLowerCase();
    const prod = String(this.productKind || '').trim().toLowerCase();
    return (
      pk === 'kitchen_base' ||
      pk === 'kitchen_base_gola' ||
      prod === 'kitchen_base' ||
      prod === 'kitchen_base_gola'
    );
  }

  /**
   * Кухня: высота опор → v:h_bottom; spec.id → cabinet_model из профиля/карточки.
   * pos/size.xz/pivot — как в JSON конструктора (1:1 с админ-превью / PlanPlace).
   */
  _normalizeKitchenTemplateTree(tree) {
    // catalog_32 внутри НМ тоже нормализуем (раньше early-return резал swap SKU).
    if (!tree) return tree;
    const kitchenCtx = this._isKitchenBaseBuildContext();
    const isPlinthOnly =
      !kitchenCtx &&
      String(this._normalizingCatalog32 || '').toLowerCase() === 'catalog_32';
    if (!kitchenCtx && !isPlinthOnly) return tree;
    let bind = null;
    try {
      const km = typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
      const eng = typeof window !== 'undefined' ? window.__cldKitchenBaseEngine : null;
      // Project plinth важнее catalog h_bottom=100 в карточке модуля — иначе при 120/150
      // остаётся SKU #2 и щель под корпусом.
      const projectPlinth =
        km && typeof km.getProjectPlinthHeightMm === 'function'
          ? Number(km.getProjectPlinthHeightMm())
          : NaN;
      const plinth =
        Number.isFinite(projectPlinth) && projectPlinth > 0
          ? projectPlinth
          : Number(this.variables?.h_bottom) || 100;
      const ks =
        this._kitchenSupports ||
        (typeof window !== 'undefined' ? window.catalogItemVueApp?.item?.kitchenSupports : null) ||
        null;
      if (km && typeof km.resolveSupportCabinetModelBinding === 'function') {
        bind = km.resolveSupportCabinetModelBinding(plinth, ks);
      } else if (eng && typeof eng.resolveKitchenSupportBinding === 'function') {
        bind = eng.resolveKitchenSupportBinding(plinth, ks);
      }
      try {
        if (typeof window !== 'undefined') {
          window.__cldLastSupportBind = {
            plinthMm: plinth,
            heightMm: bind?.heightMm ?? null,
            modelId: bind?.modelId != null ? String(bind.modelId) : null,
            name: bind?.name || null,
            source: bind?.source || 'builder',
            map: bind?.modelsByHeightMm || null,
          };
        }
      } catch (_) {}
    } catch (_) {
      bind = null;
    }
    const walk = (n) => {
      if (!n || typeof n !== 'object') return;
      const name = String(n.name || n.spec?.key || '');
      const isLeg =
        n.cldSupportLeg === true || /опора/i.test(name) || /support.?leg/i.test(name);
      if (isLeg) {
        n.cldSupportLeg = true;
        n.size = n.size && typeof n.size === 'object' ? { ...n.size } : {};
        if (!/\bv\s*:\s*h_bottom\b/i.test(String(n.size.y || ''))) {
          n.size.y = 'v:h_bottom';
        }
        if (String(n.type || '').toLowerCase() === 'detail') {
          n.originalType = 'model';
          n.type = 'model';
        } else if (!n.type) {
          n.type = 'model';
        }
        if (bind && bind.enabled !== false && bind.modelId) {
          n.spec = n.spec && typeof n.spec === 'object' ? { ...n.spec } : {};
          n.spec.id = String(bind.modelId);
          n.spec.key = bind.key || bind.name || n.spec.key;
          n.modelId = String(bind.modelId);
          if (bind.name) n.name = bind.name;
        }
      }
      if (Array.isArray(n.children)) n.children.forEach(walk);
      if (Array.isArray(n.spec?.template_tree)) n.spec.template_tree.forEach(walk);
    };
    if (Array.isArray(tree)) tree.forEach(walk);
    else walk(tree);
    return tree;
  }

  /** Выражение ссылается на «слотовые» role-переменные шкафа (высоты зон). */
  _exprRefsSlotRoleVars(v) {
    return (
      typeof v === 'string' &&
      /v:\s*(h_bottom|h_top|corpus_antresol_mm|tech_zone_mm)/.test(v)
    );
  }

  /** Формула высоты уровня всего шкафа (антресоль), а не заполнения слота корпуса. */
  _moduleNodeUsesCabinetLevelHeightSlice(item) {
    if (!item || typeof item !== 'object') return false;
    const sy = item.size?.y;
    const py = item.pos?.y ?? item.position?.y;
    const sizeIsCabinetSlice =
      typeof sy === 'string' &&
      /s:y\s*[-−+]/.test(sy) &&
      /v:\s*(h_bottom|corpus_antresol_mm|tech_zone_mm|h_top)/.test(sy);
    const posIsCabinetSlice =
      typeof py === 'string' &&
      /v:\s*(h_bottom|corpus_antresol_mm)/.test(py) &&
      !/s:y/.test(py);
    return sizeIsCabinetSlice || posIsCabinetSlice;
  }

  _nodeNeedsSlotFillNotReslice(node) {
    if (!node || typeof node !== 'object') return false;
    const role = this._normalizeLayoutRoleKey(node.layout_role ?? node.sectionLayoutRole ?? '');
    if (role === 'top') return true;
    const sy = node.size?.y;
    const py = node.pos?.y ?? node.position?.y;
    if (typeof sy === 'string' && /s:y\s*[-−]/.test(sy) && /v:\s*corpus_antresol_mm/.test(sy)) {
      return true;
    }
    if (
      typeof py === 'string' &&
      /v:\s*h_bottom/.test(py) &&
      /v:\s*corpus_antresol_mm/.test(py)
    ) {
      return true;
    }
    return false;
  }

  /**
   * Во вложенном catalog_30: секции с формулой уровня шкафа → заполнить слот (0, s:y).
   * Стенки (s:y-32, s:y) оставляем — они относительны высоты слота.
   */
  _neutralizeNestedSlotSelfPositioning(tree) {
    if (!Array.isArray(tree) || !tree.length) return tree;
    const walk = (node) => {
      if (!node || typeof node !== 'object') return node;
      let clone = node;
      if (this._nodeNeedsSlotFillNotReslice(node)) {
        clone = JSON.parse(JSON.stringify(node));
        if (clone.size) clone.size.y = 's:y';
        if (clone.pos) clone.pos.y = 0;
        if (clone.position) clone.position.y = 0;
      }
      if (Array.isArray(clone.children) && clone.children.length) {
        clone = { ...clone, children: clone.children.map(walk) };
      }
      return clone;
    };
    return tree.map(walk);
  }

  /** Модули петель: шаблон в catalog_31 (hingeCatalogTypeKey), не в ключе «hinges». */
  _resolveHingeModuleCatalogKey(spec) {
    const sp = spec && typeof spec === 'object' ? spec : {};
    const hk = String(sp.hingeCatalogTypeKey || 'catalog_31').trim();
    return hk || 'catalog_31';
  }

  /**
   * Раскладка module+hinges по Y (как applyLayoutParamsToTree в админке) перед сборкой facades_*.
   */
  /**
   * Z модуля петли в тонкой оболочке фасада приводится в _finalizeFacadeCatalogHingesAfterBuild
   * (Door_new.build_hinges из эталона). На этапе дерева Z из catalog_28 не правим — иначе
   * pos.z=-22 / -82 / +N перетёрт неверной формулой ещё до сборки.
   */
  _snapCatalogHingeModulesZInTree(_nodes) {
    void _nodes;
  }

  _applyFacadeHingeLayoutModulesInTree(templateTree, item, size, parentSection) {
    const gen = typeof window !== 'undefined' ? window.__cldHingeLayout : null;
    if (!gen || !Array.isArray(templateTree) || !templateTree.length) return false;
    if (typeof gen.applyRoleLayoutCatalogHingeModulesInTree !== 'function') return false;
    if (this._facadeHingeContext && typeof this._facadeHingeContext === 'object') {
      this._facadeHingeContext.parentSection = parentSection;
    }
    const genDim =
      typeof gen.resolveFacadeRoleHingeDimensionMm === 'function'
        ? gen.resolveFacadeRoleHingeDimensionMm(size, parentSection?.size, 'Y')
        : Math.max(1, Number(size?.y) || Number(parentSection?.size?.y) || 0);
    const layoutRoleNorm = this._normalizeLayoutRoleKey(
      this._facadeHingeContext?.layoutRole || item?.layout_role || ''
    );
    // Всегда считаем от фасадной полосы из "петли по ролям":
    // без специальных веток unified/top и без учета нижнего свеса.
    // Тумба (роль `facades`) строится ОТ ПОЛА: size.y включает зону цоколя h_bottom.
    // Базовая полоса полотна для петель = size.y - h_bottom (от hb до верха), чтобы
    // отступы 100/100 считались по полотну без цоколя и без свеса. Свес геометрию
    // полотна опускает отдельно и петли не двигает (якорь "от верха").
    const hbMm = Math.max(0, Number(this.variables?.h_bottom) || 0);
    let doorH = genDim;
    if (layoutRoleNorm === 'facades' && hbMm > 0 && genDim - hbMm > 1) {
      doorH = genDim - hbMm;
    }
    // Базовая высота полотна (без свеса) — резерв для якоря петли «от верха»,
    // если в дерево петли по какой-то причине не попал __hingeRoleDoorHeightMm.
    if (this._facadeHingeContext && typeof this._facadeHingeContext === 'object') {
      this._facadeHingeContext.roleLayoutDoorHeightMm = doorH;
    }
    // Ключевой лог: что передаётся как высота фасада при раскладке петель
    if (this._hingeRoomVerbose()) {
      console.warn('[CLD][HINGE-VERIFY][applyHingeLayoutInTree]', {
        layoutRole: this._facadeHingeContext?.layoutRole,
        itemName: item?.name,
        itemLayoutRole: item?.layout_role,
        sizeIn: { x: size?.x, y: size?.y, z: size?.z },
        parentSectionSize: parentSection?.size ? { x: parentSection.size.x, y: parentSection.size.y } : null,
        doorH,
        doorHGenDim: genDim,
        topBandMm:
          layoutRoleNorm === 'facades_top'
            ? this._facadesTopShelfHeightMm(parentSection)
            : null,
        note: 'doorH должен совпадать с высотой фасада в превью «петли по ролям»',
      });
    }
    if (!(doorH > 0)) return false;
    const doorDir = this._extractDoorRotateDirectionFromTree(templateTree);
    const swingCount =
      typeof gen.countSwingDoorAnimatorsInTree === 'function'
        ? gen.countSwingDoorAnimatorsInTree(templateTree)
        : 0;
    const shellCatalogId =
      Number(this._facadeHingeContext?.facadeRoleLayoutCatalogItemId) ||
      Number(this._facadeHingeContext?.facadeCatalogItemId) ||
      0;
    const compositeShell =
      gen.FACADE_COMPOSITE_DOUBLE_CATALOG_IDS &&
      gen.FACADE_COMPOSITE_DOUBLE_CATALOG_IDS.has(shellCatalogId);
    const doubleSwingLeaf = swingCount >= 2 || !!compositeShell;
    if (this._facadeHingeContext && typeof this._facadeHingeContext === 'object') {
      this._facadeHingeContext.doorDirection = doorDir;
      this._facadeHingeContext.doubleSwingLeafFacade = doubleSwingLeaf;
    }
    const accFromItem = Array.isArray(item?.accessories)
      ? item.accessories.find(
          (a) =>
            a &&
            (String(a.id || '').includes('hinge') ||
              (a.name || '').toLowerCase().includes('петл'))
        )
      : null;
    const stubAcc = accFromItem || { id: 'hinge', name: 'Петли' };
    let layoutAcc = this._mergeHingeAccessoryFromLayoutScheme(stubAcc, item || {}, doorH);
    if (layoutAcc && layoutAcc.__solid) return false;
    if (layoutAcc) {
      const drillFromLayout = {
        facade: Number(layoutAcc.hingeFacadeDrillTemplateId) || 0,
        door: Number(layoutAcc.hingeDoorDrillTemplateId) || 0,
      };
      this._applyHingeDrillTemplateIdsToFacadeContext(drillFromLayout);
      this._stampHingeDrillTemplateIdsOnModuleTree(templateTree, drillFromLayout);
    }
    // Реф Door_new.params.hinges — массив слотов всегда задан. Если в админке/localStorage
    // дефолтов нет, генерируем 2 петли по `ensureHingeRoleLayoutParams` (top/bottom=100мм).
    if (!layoutAcc || !Array.isArray(layoutAcc.hinges) || !layoutAcc.hinges.length) {
      if (
        typeof gen.ensureHingeRoleLayoutParams === 'function' &&
        typeof gen.roleLayoutParamsToHingeAccessory === 'function'
      ) {
        const role = this._facadeHingeContext?.layoutRole || 'facades';
        const opens =
          typeof gen.resolveOpensForHingeRoleLayout === 'function'
            ? gen.resolveOpensForHingeRoleLayout({
                facadeLayoutRole: role,
                doubleSwing: doubleSwingLeaf,
                doorDirection: doorDir,
                zoneHand: this.zoneHand,
              })
            : doubleSwingLeaf
              ? 'double-swing'
              : 'swing-left';
        const axisKey = String(
          typeof gen.hingeAxisForOpens === 'function' ? gen.hingeAxisForOpens(opens) : 'Y'
        ).toUpperCase();
        const dim = axisKey === 'X' ? Math.max(1, Number(size?.x) || doorH) : doorH;
        const fallbackParams = gen.ensureHingeRoleLayoutParams({});
        layoutAcc = gen.roleLayoutParamsToHingeAccessory(fallbackParams, dim, opens);
        if (layoutAcc) layoutAcc.__hingeRoleFallback = true;
        if (this._hingeRoomDbg()) {
          console.warn('[CLD][HINGE-ROOM] fallback hinges (no defaults)', {
            count: layoutAcc?.count,
            hinges: layoutAcc?.hinges,
          });
        }
      }
      if (!layoutAcc || !Array.isArray(layoutAcc.hinges) || !layoutAcc.hinges.length) {
        return false;
      }
    }
    const axis =
      layoutAcc.hingeAxis ||
      (layoutAcc.__hingeRoleOpens && typeof gen.hingeAxisForOpens === 'function'
        ? gen.hingeAxisForOpens(layoutAcc.__hingeRoleOpens)
        : null) ||
      (doubleSwingLeaf ? 'Y' : null) ||
      (typeof gen.hingeAxisForRole === 'function'
        ? gen.hingeAxisForRole(this._facadeHingeContext?.layoutRole || 'facades')
        : 'Y');
    const axisKey = String(axis).toUpperCase() === 'X' ? 'x' : 'y';
    // doorH уже = высота полосы facades_* (для facades_top — верхняя полка, не corpus_antresol_mm).
    const dim =
      axisKey === 'y'
        ? Math.max(1, doorH)
        : Math.max(1, Number(size?.x) || doorH);
    const shellDepthMm = Number(size?.z) || 0;
    if (this._facadeHingeContext && typeof this._facadeHingeContext === 'object') {
      this._facadeHingeContext.facadeShellWidthMm = Math.max(1, Number(size?.x) || 0);
    }
    const expectedYs =
      typeof gen.calcIntegerRoleHingeYs === 'function'
        ? gen.calcIntegerRoleHingeYs(layoutAcc, dim)
        : [];
    if (this._facadeHingeContext && typeof this._facadeHingeContext === 'object') {
      this._facadeHingeContext.roleLayoutAccSnapshot = {
        ...this._snapshotHingeRoleLayoutAcc(layoutAcc, dim, gen),
        opens:
          layoutAcc.__hingeRoleOpens ||
          (typeof gen.resolveOpensForHingeRoleLayout === 'function'
            ? gen.resolveOpensForHingeRoleLayout({
                facadeLayoutRole: this._facadeHingeContext.layoutRole || layoutRoleNorm,
                doubleSwing: doubleSwingLeaf,
                doorDirection: doorDir,
                zoneHand: this.zoneHand,
              })
            : doubleSwingLeaf
              ? 'double-swing'
              : null),
        swingCount,
        doubleSwingLeaf,
        doorH: dim,
        layoutRole: this._facadeHingeContext.layoutRole,
        facadeRoleLayoutCatalogItemId: this._facadeHingeContext.facadeRoleLayoutCatalogItemId,
        itemName: item?.name || '',
      };
      this._logHingeRoom('applyLayout/plan', this._facadeHingeContext.roleLayoutAccSnapshot);
    }
    const applied = !!gen.applyRoleLayoutCatalogHingeModulesInTree(templateTree, layoutAcc, {
      axis,
      dimensionMm: dim,
      facadeShellDepthMm: shellDepthMm,
      wallThicknessMm: this._cabinetSidewallThicknessMm(),
      overlaySideThicknessMm: this._cabinetSidewallThicknessMm(),
      doorDirection: doorDir,
      facadeWidthMm: Math.max(1, Number(size?.x) || 0),
      facadeSeamZMm: 0,
      useAnchorOffset: false,
    });
    // Одна цепочка с ролями: catalog-петли оставляем в дереве (Y/X шва уже проставлены).
    if (applied && this._facadeHingeContext) {
      this._facadeHingeContext.roleLayoutVerify = {
        layoutRole: this._facadeHingeContext.layoutRole || item?.layout_role || 'facades',
        moduleName: item?.name,
        axis,
        dimensionMm: dim,
        facadeShellSize: { x: size?.x, y: size?.y, z: size?.z },
        parentSectionSize: parentSection?.size
          ? { x: parentSection.size.x, y: parentSection.size.y, z: parentSection.size.z }
          : null,
        expectedYs,
        insetTopMm: layoutAcc?.hingeInsetTopMm,
        insetBottomMm: layoutAcc?.hingeInsetBottomMm,
        useAnchorOffset: false,
      };
    }
    if (shellDepthMm > 0 && shellDepthMm <= 40 && this._treeHasHingeModuleNodes(templateTree)) {
      this._snapCatalogHingeModulesZInTree(templateTree);
    }
    if (applied && this._hingeVerifyDbg()) {
      if (typeof gen.logHingeRoleVerify === 'function') {
        gen.logHingeRoleVerify('room_applyFacadeHingeLayout', {
          ...this._facadeHingeContext?.roleLayoutVerify,
          applied,
        });
      }
    }
    if (applied && this._hingeRoomVerbose()) {
      const hingeNodes = [];
      const walk = (nodes) => {
        if (!Array.isArray(nodes)) return;
        for (const n of nodes) {
          if (gen.isHingeModuleTreeNode && gen.isHingeModuleTreeNode(n)) {
            hingeNodes.push({
              id: n.id,
              pos: { x: n.pos?.x, y: n.pos?.y, z: n.pos?.z },
              size: { x: n.size?.x, y: n.size?.y, z: n.size?.z },
              pivot: { x: n.pivot?.x, y: n.pivot?.y, z: n.pivot?.z },
              expectedYMm: n.__hingeRoleExpectedYMm ?? null,
            });
          }
          if (Array.isArray(n?.children)) walk(n.children);
          if (Array.isArray(n?.spec?.template_tree)) walk(n.spec.template_tree);
        }
      };
      walk(templateTree);
      const allInTree = [];
      this._walkHingeLayoutNodesInTree(templateTree, allInTree, '');
      this._logHingeRoom('applyLayout/treeAfter', {
        moduleName: item?.name,
        hingeModuleCount: hingeNodes.length,
        expectedYs,
        hingeNodes,
        layoutNodes: allInTree,
      });
      if (hingeNodes.length) console.table(hingeNodes);
    }
    return applied;
  }

  _useCatalogHingeModulesInRoom() {
    const ctx = this._facadeHingeContext;
    return !!(ctx && (ctx.catalogHingeModulesApplied || ctx.catalogHingeModulesInTree));
  }

  _hingeRoomDbg() {
    if (this._suppressHingeRoomLog) return false;
    return typeof window !== 'undefined' && window.DEBUG_HINGE_ROOM === true;
  }

  _hingeVerifyDbg() {
    if (typeof window === 'undefined') return false;
    return window.DEBUG_HINGE_ROLE_VERIFY === true || window.DEBUG_HINGE_ROOM === true;
  }

  /**
   * Пост-сборочное выравнивание фасадной половины петли (Z/X в swing после reparent).
   * false — только позиции из JSON/каталога (откат экспериментов с «петля в фасад»).
   */
  _hingeFacadePostAlignEnabled() {
    if (typeof window === 'undefined') return true;
    return window.CLD_HINGE_FACADE_POSTALIGN !== false;
  }

  /**
   * Пост-сборочное выравнивание корпусной половины: Z к тылу фасада + сдвиг всего hingeMod по X.
   * false — корпус остаётся на pos.x из каталога/раскладки (частая причина «улетело в центр»).
   */
  _hingeCorpusPostAlignEnabled() {
    if (typeof window === 'undefined') return true;
    return window.CLD_HINGE_CORPUS_POSTALIGN !== false;
  }

  /** true — только корпусная ветка: без reparent hinge_animator и без finalize фасада. */
  _hingeCorpusOnlyMode() {
    if (typeof window === 'undefined') return false;
    return window.CLD_HINGE_CORPUS_ONLY === true;
  }

  /** Полупрозрачные секции на каталожных петлях (только DEBUG_HINGE_SECTION_VOL, не ROOM). */
  _hingeSectionVolDbg() {
    if (typeof window === 'undefined') return false;
    if (window.DEBUG_HINGE_SECTION_VOL === false) return false;
    return window.DEBUG_HINGE_SECTION_VOL === true;
  }

  _makeHingeDebugVolumeMesh(sx, sy, sz, color, name) {
    const geom = new THREE.BoxGeometry(sx, sy, sz);
    const mat = new THREE.MeshBasicMaterial({
      color: color || 0x96c296,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name || 'HingeSectionVolume';
    mesh.userData.isSectionVolume = true;
    mesh.userData.isHingeDebugVolume = true;
    mesh.renderOrder = 1200;
    mesh.position.set(sx / 2, sy / 2, sz / 2);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geom),
      new THREE.LineBasicMaterial({ color: 0x111111, depthTest: false })
    );
    edges.name = (name || 'HingeSectionVolume') + '_edges';
    edges.userData.isHingeDebugVolume = true;
    edges.renderOrder = 1201;
    edges.position.copy(mesh.position);
    const grp = new THREE.Group();
    grp.name = name || 'HingeSectionVolume_grp';
    grp.userData.isHingeDebugVolume = true;
    grp.add(mesh);
    grp.add(edges);
    return grp;
  }

  /**
   * Рисует bbox секций/аниматора петли в local space hingeMod (после finalize/reparent).
   * Вкл.: window.DEBUG_HINGE_SECTION_VOL = true  (или DEBUG_HINGE_ROOM).
   */
  _addHingeDebugSectionVolumes(hingeMod, swingRoots, doorSwing) {
    if (!this._hingeSectionVolDbg() || !hingeMod || typeof THREE === 'undefined') return;

    const prev = hingeMod.getObjectByName('__hinge_debug_vols');
    if (prev) {
      hingeMod.remove(prev);
      prev.traverse((o) => {
        if (o.geometry) o.geometry.dispose?.();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
          else o.material.dispose?.();
        }
      });
    }

    const dbg = new THREE.Group();
    dbg.name = '__hinge_debug_vols';
    hingeMod.add(dbg);

    hingeMod.updateMatrixWorld(true);

    const addVolForNode = (node, color, label) => {
      if (!node || node.userData?.isHingeDebugVolume) return;
      const box = new THREE.Box3().setFromObject(node);
      if (box.isEmpty()) return;
      const s = box.getSize(new THREE.Vector3());
      const sz = { x: s.x, y: s.y, z: s.z };
      const minW = box.min.clone();
      hingeMod.worldToLocal(minW);
      const vol = this._makeHingeDebugVolumeMesh(
        Number(sz.x) || 1,
        Number(sz.y) || 1,
        Number(sz.z) || 1,
        color,
        label || node.name || 'hinge_vol'
      );
      vol.position.set(minW.x + sz.x / 2, minW.y + sz.y / 2, minW.z + sz.z / 2);
      dbg.add(vol);
    };

    const modSz = hingeMod.userData?.hingeModuleSizeMm;
    if (modSz && Number(modSz.x) > 0) {
      const vol = this._makeHingeDebugVolumeMesh(
        Number(modSz.x),
        Number(modSz.y),
        Number(modSz.z),
        0xff9966,
        'hinge_module_shell'
      );
      vol.position.set(Number(modSz.x) / 2, Number(modSz.y) / 2, Number(modSz.z) / 2);
      dbg.add(vol);
    }

    hingeMod.traverse((node) => {
      if (node === hingeMod || node.userData?.isHingeDebugVolume) return;
      if (node.userData?.isSectionVolume) return;
      if (node.userData?.isSection) {
        addVolForNode(node, 0x96c296, 'sec_' + (node.userData.sectionName || 'section'));
      }
    });

    // Синий куб: hinge_animator после reparent в __door_swing — рисуем у двери (не в hingeMod local).
    if (Array.isArray(swingRoots) && doorSwing) {
      const swingParent = doorSwing.parent || doorSwing;
      if (swingParent) {
        swingParent.updateMatrixWorld(true);
        for (const anim of swingRoots) {
          if (!anim) continue;
          const box = new THREE.Box3().setFromObject(anim);
          if (box.isEmpty()) continue;
          const s = box.getSize(new THREE.Vector3());
          const minW = box.min.clone();
          swingParent.worldToLocal(minW);
          const vol = this._makeHingeDebugVolumeMesh(
            s.x || 1,
            s.y || 1,
            s.z || 1,
            0x6699ff,
            'hinge_animator_on_door'
          );
          vol.position.set(minW.x + s.x / 2, minW.y + s.y / 2, minW.z + s.z / 2);
          if (!swingParent.getObjectByName('__hinge_debug_vols_door')) {
            const doorDbg = new THREE.Group();
            doorDbg.name = '__hinge_debug_vols_door';
            swingParent.add(doorDbg);
          }
          swingParent.getObjectByName('__hinge_debug_vols_door').add(vol);
        }
      }
    }
  }

  /** Локальная секция catalog_31 (~62×63 мм) — для s:y/s:z внутри модуля hinges, не высота полосы facades_*. */
  /**
   * Габарит петли с карточки catalog_31 (width/height/depth).
   * Нужен, когда в clodisJSON секция с s:x/s:y/s:z — Number("s:y") = NaN
   * и intrinsic из дерева не находится → контекст size={0,0,0} и спам evaluateSize.
   */
  _hingeCatalogCardSizeMm(catalogItem) {
    if (!catalogItem || typeof catalogItem !== 'object') return null;
    let data = catalogItem.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (_) {
        data = null;
      }
    }
    const root =
      data && typeof data === 'object' ? { ...catalogItem, ...data } : catalogItem;
    const w = Number(root.width);
    const h = Number(root.height);
    const d = Number(root.depth);
    if (!(w > 0 && h > 0 && d > 0 && w < 512 && h < 512 && d < 512)) return null;
    return { x: w, y: h, z: d };
  }

  _hingeCatalogIntrinsicSectionSize(templateTree) {
    let found = null;
    const walk = (list) => {
      if (!Array.isArray(list) || found) return;
      for (const n of list) {
        if (!n || String(n.type || '').toLowerCase() !== 'section') continue;
        const kids = n.children;
        const hasAnim =
          Array.isArray(kids) &&
          kids.some((c) => String(c?.id || '').toLowerCase() === 'hinge_animator');
        const y = Number(n.size?.y);
        const z = Number(n.size?.z);
        if (hasAnim && y > 0 && y < 256 && z > 0 && z < 256) {
          found = {
            x: Math.max(0, Number(n.size?.x) || 0),
            y,
            z,
          };
          return;
        }
        if (Array.isArray(kids)) walk(kids);
      }
    };
    walk(templateTree);
    return found;
  }

  _treeHasHingeModuleNodes(nodes) {
    const gen = typeof window !== 'undefined' ? window.__cldHingeLayout : null;
    if (!gen || typeof gen.isHingeModuleTreeNode !== 'function' || !Array.isArray(nodes)) {
      return false;
    }
    let found = false;
    const walk = (list) => {
      if (!Array.isArray(list) || found) return;
      for (const n of list) {
        if (gen.isHingeModuleTreeNode(n)) {
          found = true;
          return;
        }
        if (Array.isArray(n?.children)) walk(n.children);
        if (Array.isArray(n?.spec?.template_tree)) walk(n.spec.template_tree);
      }
    };
    walk(nodes);
    return found;
  }

  /**
   * Комната получает module с пустыми children — без этого петли не разворачиваются в GLB.
   */
  _hydrateCatalogModulesInPlanTree(root) {
    const stats = { scanned: 0, hydrated: 0 };
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      const t = String(node.type || '').toLowerCase();
      if (t === 'module') {
        stats.scanned++;
        const ch = node.children;
        const emptyCh = !Array.isArray(ch) || ch.length === 0;
        const et = String(node.spec?.element_type || '').trim();
        const id = String(node.spec?.id ?? '').trim();
        const etLower = et.toLowerCase();
        const hasTpl =
          (Array.isArray(node.spec?.template_tree) && node.spec.template_tree.length > 0) ||
          (Array.isArray(node.spec?.templates?.[0]?.template?.tree) &&
            node.spec.templates[0].template.tree.length > 0);
        // catalog_38/37: не вшивать template_tree при гидратации — buildModule возьмёт live catalog
        // и применит shelfStack/interiorLayout (как превью админки).
        if (emptyCh && et && id && !hasTpl && etLower !== 'catalog_38' && etLower !== 'catalog_37') {
          const lookupKey =
            String(et).toLowerCase() === 'hinges' ? this._resolveHingeModuleCatalogKey(node.spec) : et;
          const tpl = this._resolveModuleTemplateTreeFromCatalog(lookupKey, id);
          if (Array.isArray(tpl) && tpl.length) {
            node.spec = node.spec && typeof node.spec === 'object' ? { ...node.spec } : {};
            node.spec.template_tree = JSON.parse(JSON.stringify(tpl));
            stats.hydrated++;
          }
        }
        if (
          et === 'catalog_33' &&
          id &&
          (this._readDrawerNoHandleFlag('catalog_33', id) ||
            node.spec?.drawer_no_handle === 1 ||
            node.spec?.drawer_no_handle === true ||
            node.spec?.drawer_no_handle === '1')
        ) {
          node.spec = node.spec && typeof node.spec === 'object' ? { ...node.spec } : {};
          node.spec.drawer_no_handle = 1;
        }
        if (Array.isArray(node.spec?.template_tree)) {
          node.spec.template_tree.forEach(walk);
        }
        if (Array.isArray(node.spec?.templates)) {
          for (const tplWrap of node.spec.templates) {
            const arr = tplWrap?.template?.tree;
            if (Array.isArray(arr)) arr.forEach(walk);
          }
        }
      }
      if (Array.isArray(node.children)) node.children.forEach(walk);
    };
    if (Array.isArray(root)) root.forEach(walk);
    else walk(root);
    return stats;
  }

  /** Секция-оболочка петли: animator + section (корпус) — не снимать при unwrap. */
  _hingeTemplateIsAnatomyShell(sectionNode) {
    if (!sectionNode || String(sectionNode.type || '').toLowerCase() !== 'section') return false;
    const ch = sectionNode.children;
    if (!Array.isArray(ch) || ch.length < 2) return false;
    const hasAnim = ch.some(
      (c) =>
        c &&
        (String(c.type || '').toLowerCase() === 'animator' ||
          String(c.id || '').toLowerCase() === 'hinge_animator')
    );
    const hasCorpusBranch = ch.some((c) => c && String(c.type || '').toLowerCase() === 'section');
    return hasAnim && hasCorpusBranch;
  }

  /**
   * Как в Clodis / constructor-clodis: для `element_type: hinges` убрать верхнюю секцию-обёртку каталога
   * («Петли накладные»), оставив сразу подсекции фасад/корпус.
   * Оболочку 38×67×80 (animator + корпус) не разворачиваем.
   */
  _unwrapHingeModuleTemplateTree(tpl, elementType) {
    const et = String(elementType || '').toLowerCase();
    if (et !== 'hinges' || !Array.isArray(tpl) || tpl.length === 0) return tpl;

    let out = tpl;
    let guard = 0;
    while (
      out.length === 1 &&
      out[0] &&
      out[0].type === 'section' &&
      Array.isArray(out[0].children) &&
      out[0].children.length > 0 &&
      guard < 6
    ) {
      guard += 1;
      const root = out[0];
      const ch = root.children;
      const nm = String(root.name || '').toLowerCase();
      if (this._hingeTemplateIsAnatomyShell(root)) break;
      if (ch.length === 1 && ch[0] && this._hingeTemplateIsAnatomyShell(ch[0])) break;
      const allSections = ch.every((c) => c && (c.type === 'section' || c.type === 'fill_section'));
      if (ch.length >= 2 && (allSections || /петл|hinge/i.test(nm))) {
        out = ch;
        continue;
      }
      if (ch.length === 1 && /петл|hinge/i.test(nm)) {
        out = ch;
        continue;
      }
      break;
    }
    return out;
  }

  /**
   * Нормализация записи из админского __CLD_CATALOGS_DATA: children могут лежать в params или в распарсенном data.
   */
  /** Только hole-узлы из дерева каталога furniture (не секции/аниматор — иначе рекурсия при сборке). */
  _collectHoleNodesFromFurnitureTree(nodes, out = []) {
    if (!Array.isArray(nodes)) return out;
    for (const n of nodes) {
      if (!n || typeof n !== 'object') continue;
      const t = String(n.type || '').toLowerCase();
      if (t === 'hole') out.push(n);
      if (Array.isArray(n.children) && n.children.length) {
        this._collectHoleNodesFromFurnitureTree(n.children, out);
      }
    }
    return out;
  }

  _furnitureTemplateFromAdminCatalogItem(catalogItem) {
    if (!catalogItem || typeof catalogItem !== 'object') return null;
    let params = catalogItem.params;
    if (typeof params === 'string') {
      try {
        params = JSON.parse(params);
      } catch (_) {
        params = null;
      }
    }
    if (!params || typeof params !== 'object') params = {};
    let data = catalogItem.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (_) {
        data = null;
      }
    }
    if (!data || typeof data !== 'object') data = {};
    const root = { ...data, ...params };
    const ch = root.children;
    if (!Array.isArray(ch) || !ch.length) return null;
    const holes = this._collectHoleNodesFromFurnitureTree(ch);
    if (!holes.length) return null;
    return {
      name: root.name || catalogItem.name,
      size: root.size,
      children: holes,
      spec: root.spec && typeof root.spec === 'object' ? root.spec : undefined,
    };
  }

  /** Запись из /api/catalog/items_get/furniture (как в constructor-clodis __cldFurnitureCatalogMap). */
  _furnitureTemplateFromApiMapEntry(entry) {
    if (!entry || typeof entry !== 'object') return null;
    const ch = entry.children;
    if (!Array.isArray(ch) || !ch.length) return null;
    const holes = this._collectHoleNodesFromFurnitureTree(ch);
    if (!holes.length) return null;
    return {
      name: entry.name,
      size: entry.size,
      children: holes,
      spec: entry.params && typeof entry.params === 'object' && entry.params.spec && typeof entry.params.spec === 'object'
        ? entry.params.spec
        : undefined,
    };
  }

  /**
   * Каталог furniture (Clodis / API), как в референсе — без локальных «заготовок» геометрии.
   */
  _lookupFurnitureCatalogTemplate(specId) {
    const sid = String(specId ?? '').trim();
    if (!sid) return null;
    const catalogKeys = ['furniture', 'furnitures', 'hinges'];
    for (const key of catalogKeys) {
      const it = this._getCatalogItemById(key, sid);
      const tpl = this._furnitureTemplateFromAdminCatalogItem(it);
      if (tpl) return tpl;
    }
    if (typeof window !== 'undefined' && window.__CLD_FURNITURE_CATALOG_MAP) {
      const ent = window.__CLD_FURNITURE_CATALOG_MAP[sid];
      const tpl = this._furnitureTemplateFromApiMapEntry(ent);
      if (tpl) return tpl;
    }
    return null;
  }

  /**
   * Id шаблона присадки: как constructor-clodis CabinetFurniture._resolveDrillTemplateIdWithAncestors.
   * L-пакет (spec.id / drillTemplateId = шаблон setupType=2) — один id на оба отверстия/GLB.
   * spec.id=3 — тип furniture «Фасадное отверстие», не id шаблона в LS (реф ~8921).
   * Пустой tid / дырки — ошибка данных; runtime mirror 8↔9 убран (CAD single-chain).
   */
  _resolveFurnitureDrillTemplateId(spec, parentSection, item) {
    if (!spec || typeof spec !== 'object') return 0;
    const nm = String(item?.name || '').toLowerCase();
    const specId = String(spec.id ?? '').trim();
    const isHingeCup =
      /присадк|cup|чаш/.test(nm) || specId === '3';

    const pickExplicit = (...vals) => {
      const DR = typeof globalThis !== 'undefined' ? globalThis.__CLD_DRILL_RESOLVE : null;
      if (!DR || typeof DR.pickDrillTemplateIdFromCandidates !== 'function') return 0;
      return DR.pickDrillTemplateIdFromCandidates(vals, (id) => {
        const tpl = this._getDrillTemplateHolesForBuilder(id);
        const isL = Number(tpl.setupType) === 2 && Number(tpl.facadeModelId) > 0;
        const hasHoles =
          (Array.isArray(tpl.holes) && tpl.holes.length > 0) ||
          (DR.templateHasDrillHoles &&
            DR.templateHasDrillHoles(
              this._lsClodisDrillTemplatesArr().find((t) => Number(t.id) === Number(id)),
            ));
        if (!isL && !hasHoles) return null;
        return {
          id,
          setupType: tpl.setupType,
          currentSetupType: tpl.setupType,
          facadeModelId: tpl.facadeModelId,
          corpusModelId: tpl.corpusModelId,
          cabinetModelId: tpl.cabinetModelId,
          holes: tpl.holes,
        };
      });
    };

    // Новая логика: явный шаблон на узле (L-пакет #7 и т.п.) важнее split facade/door из accessories.
    const fromNode = pickExplicit(
      spec.drillTemplateId,
      spec.drillingTemplateId,
      spec.templateId,
      spec.drilling_template_id,
      specId !== '3' ? spec.id : 0
    );
    if (fromNode > 0) return fromNode;

    if (isHingeCup && parentSection) {
      const part = this._hingeCupDrillPartFromFurnitureItem(item);
      const fromAcc = this._resolveHingeDrillTemplateIdFromContext(parentSection, part);
      if (fromAcc > 0) return fromAcc;
      const src =
        parentSection.hingeCatalogSourceItem ||
        parentSection._cldSectionContext?.hingeCatalogSourceItem ||
        parentSection.sourceItem;
      if (src) {
        const fromSrc = this._hingeDrillIdsFromMergedSource(src, null);
        const tid = part === 'door' ? fromSrc.door : fromSrc.facade;
        if (tid > 0) return tid;
      }
    }
    return 0;
  }

  _lsClodisDrillTemplatesArr() {
    try {
      const raw =
        typeof localStorage !== 'undefined' ? localStorage.getItem('clodis_drilling_templates_v2') : null;
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  /** Направление сверления — __CLD_DRILL_RESOLVE.drillDirUnit. */
  _drillDirUnitVec(dirKey) {
    const DR = typeof globalThis !== 'undefined' ? globalThis.__CLD_DRILL_RESOLVE : null;
    if (DR && typeof DR.drillDirUnit === 'function') {
      const u = DR.drillDirUnit(dirKey);
      return new THREE.Vector3(u.x, u.y, u.z).normalize();
    }
    const k = String(dirKey || '-z').toLowerCase();
    const map = DR?.DRILL_DIR_VEC || {
      x: [1, 0, 0],
      '-x': [-1, 0, 0],
      y: [0, 1, 0],
      '-y': [0, -1, 0],
      z: [0, 0, 1],
      '-z': [0, 0, -1],
    };
    const a = map[k] || map['-z'];
    return new THREE.Vector3(a[0], a[1], a[2]).normalize();
  }

  /**
   * Присадка на Furniture_Присадка — через __CLD_DRILL_RESOLVE (карточка = комната).
   */
  _drillTemplateLocalPosMm(xMm, yMm, zMm) {
    const DR = typeof globalThis !== 'undefined' ? globalThis.__CLD_DRILL_RESOLVE : null;
    if (DR && typeof DR.drillTemplateLocalPosMm === 'function') {
      return DR.drillTemplateLocalPosMm(xMm, yMm, zMm);
    }
    return {
      x: Number(xMm) || 0,
      y: -(Number(yMm) || 0),
      z: -(Number(zMm) || 0),
    };
  }

  /** Room hole meshes removed — CFRN only via cfrnDrillTemplateId + __CLD_DRILL_RESOLVE. */

  /** Согласовано с constructor-clodis._normalizeDrillTemplateRawHoles */
  _normalizeDrillTemplateRawHolesForBuilder(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((h, i) => {
        if (!h || typeof h !== 'object') return null;
        const through = !!(h.through || h.isThrough || h.thru);
        const d = Number(
          h.diameter ?? h.diameterMm ?? h.dia ?? h.D ?? h.drillDiameter ?? h.drill_diameter ?? h.size
        );
        let dep = Number(
          h.depth ?? h.depthMm ?? h.length ?? h.h ?? h.L ?? h.drillDepth ?? h.drill_depth ?? h.maxDepth
        );
        if (!Number.isFinite(d) || d <= 0) return null;
        if (through) {
          if (!Number.isFinite(dep) || dep <= 0) dep = 220;
        } else if (!Number.isFinite(dep) || dep <= 0) return null;
        const depthMm = through ? Math.min(dep, 220) : Math.min(dep, 120);
        const dirKey = String(h.direction || '-z').toLowerCase();
        const gRaw = h.global;
        const global =
          gRaw === 1 || gRaw === '1' ? 1
            : gRaw === 0 || gRaw === '0' ? 0
              : undefined;
        return {
          name: String(h.name || `отв.${i + 1}`),
          diameterMm: d,
          depthMm,
          xMm: Number(h.x ?? h.xMm ?? 0) || 0,
          yMm: Number(h.y ?? h.yMm ?? 0) || 0,
          zMm: Number(h.z ?? h.zMm ?? 0) || 0,
          dirKey,
          coordBase: String(h.coordBase || 'auto').toLowerCase(),
          mountSide: String(h.mountSide || 'auto').toLowerCase(),
          through,
          global,
        };
      })
      .filter(Boolean);
  }

  _getDrillTemplateHolesForBuilder(templateId) {
    const tid = Number(templateId);
    const emptyMeta = {
      templateName: '',
      templateId: 0,
      holes: [],
      setupType: 0,
      cabinetModelId: 0,
      cabinetModelName: '',
      corpusModelId: 0,
      corpusModelName: '',
      facadeModelId: 0,
      facadeModelName: '',
      jointModelVisualOffsetMm: { x: 0, y: 0, z: 0 },
      facadeModelVisualOffsetMm: { x: 0, y: 0, z: 0 },
    };
    const packTplMeta = (tpl, holes, tidOut) => {
      const off = tpl?.jointModelVisualOffsetMm || {};
      const fOff = tpl?.facadeModelVisualOffsetMm || {};
      const cabinetModelId = Number(tpl?.cabinetModelId) || 0;
      const corpusModelId = Number(tpl?.corpusModelId) || cabinetModelId || 0;
      return {
        templateName: tpl?.name || '',
        templateId: tidOut || Number(tpl?.id) || 0,
        holes: holes || [],
        setupType: Number(tpl?.currentSetupType ?? tpl?.setupType) || 0,
        cabinetModelId,
        cabinetModelName: String(tpl?.cabinetModelName || ''),
        corpusModelId,
        corpusModelName: String(tpl?.corpusModelName || tpl?.cabinetModelName || ''),
        facadeModelId: Number(tpl?.facadeModelId) || 0,
        facadeModelName: String(tpl?.facadeModelName || ''),
        jointModelVisualOffsetMm: {
          x: Number(off.x) || 0,
          y: Number(off.y) || 0,
          z: Number(off.z) || 0,
        },
        facadeModelVisualOffsetMm: {
          x: Number(fOff.x) || 0,
          y: Number(fOff.y) || 0,
          z: Number(fOff.z) || 0,
        },
      };
    };
    if (!Number.isFinite(tid) || tid <= 0) return emptyMeta;
    const templates = this._lsClodisDrillTemplatesArr();
    const tplLs = templates.find((t) => Number(t.id) === tid);
    const api = typeof window !== 'undefined' && window.__CLD_DRILLING_API;
    if (api && typeof api.getHolesByTemplateId === 'function') {
      const info = api.getHolesByTemplateId(tid);
      if (info && Array.isArray(info.holes) && info.holes.length) {
        const base = packTplMeta(tplLs || {}, info.holes, tid);
        if (Number(info.cabinetModelId) > 0) base.cabinetModelId = Number(info.cabinetModelId);
        if (Number(info.corpusModelId) > 0) base.corpusModelId = Number(info.corpusModelId);
        else if (!base.corpusModelId) base.corpusModelId = base.cabinetModelId;
        if (Number(info.facadeModelId) > 0) base.facadeModelId = Number(info.facadeModelId);
        if (info.cabinetModelName) base.cabinetModelName = String(info.cabinetModelName);
        if (info.corpusModelName) base.corpusModelName = String(info.corpusModelName);
        if (info.facadeModelName) base.facadeModelName = String(info.facadeModelName);
        if (info.jointModelVisualOffsetMm) {
          base.jointModelVisualOffsetMm = {
            x: Number(info.jointModelVisualOffsetMm.x) || 0,
            y: Number(info.jointModelVisualOffsetMm.y) || 0,
            z: Number(info.jointModelVisualOffsetMm.z) || 0,
          };
        }
        if (info.facadeModelVisualOffsetMm) {
          base.facadeModelVisualOffsetMm = {
            x: Number(info.facadeModelVisualOffsetMm.x) || 0,
            y: Number(info.facadeModelVisualOffsetMm.y) || 0,
            z: Number(info.facadeModelVisualOffsetMm.z) || 0,
          };
        }
        if (Number(info.setupType) > 0) base.setupType = Number(info.setupType);
        else if (tplLs) base.setupType = Number(tplLs.currentSetupType ?? tplLs.setupType) || 0;
        if (!base.templateName) base.templateName = info.templateName || '';
        return base;
      }
    }
    if (!tplLs) return { ...emptyMeta, templateId: tid };
    const st = Number(tplLs.currentSetupType ?? tplLs.setupType ?? 3);
    let raw = [];
    const hbs = tplLs.holesBySetup && typeof tplLs.holesBySetup === 'object' ? tplLs.holesBySetup : null;
    if (hbs && Array.isArray(hbs[String(st)]) && hbs[String(st)].length) {
      raw = hbs[String(st)];
    } else if (hbs) {
      const firstKey = Object.keys(hbs).find((k) => Array.isArray(hbs[k]) && hbs[k].length > 0);
      if (firstKey) raw = hbs[firstKey];
    }
    if (!Array.isArray(raw) || !raw.length) {
      raw = Array.isArray(tplLs.holes) ? tplLs.holes : [];
    }
    const holes = this._normalizeDrillTemplateRawHolesForBuilder(raw);
    return packTplMeta(tplLs, holes, tid);
  }

  /** Room Hole_* strip removed — holes are no longer built in room. */

  /**
   * Вариант «3D в шаблоне присадки»: GLB из corpus/cabinet (+ facade для L) + offset
   * на Furniture_Присадка. Без model в карточке catalog_31.
   * L-пакет (setupType=2 + facadeModelId): обе половины на door/corpus-Присадке
   * от одного origin; facade-Присадка без второго GLB (CFRN id остаётся).
   */
  _attachDrillTemplateCabinetModelToFurniture(mount, templateId, parentSection) {
    const tid = Number(templateId);
    if (!mount || !Number.isFinite(tid) || tid <= 0) return null;
    if (typeof window === 'undefined' || !window.__cldRoomCabinetModels) return null;
    const tplInfo = this._getDrillTemplateHolesForBuilder(tid);
    const setupType = Number(tplInfo.setupType) || 0;
    const isLPackage = setupType === 2 && Number(tplInfo.facadeModelId) > 0;
    const corpusId = Number(tplInfo.corpusModelId) || Number(tplInfo.cabinetModelId) || 0;
    const facadeId = Number(tplInfo.facadeModelId) || 0;
    const part = String(
      mount.userData?.hingeDrillPart ||
        mount.parent?.userData?.hingeDrillPart ||
        ''
    ).toLowerCase();

    // Раньше: isLPackage && part==='facade' → return null.
    // После L pos=0 _hingeCupDrillPartFromFurnitureItem даёт 'facade' → GLB не вешались → «петель нет».
    // Одиночная Присадка L несёт обе половины; skip только если пакет уже на sibling.
    if (isLPackage && part === 'facade') {
      let siblingHasLPackage = false;
      const huntRoots = [];
      if (mount.parent) huntRoots.push(mount.parent);
      if (mount.parent?.parent) huntRoots.push(mount.parent.parent);
      for (const root of huntRoots) {
        if (!root?.children) continue;
        for (const ch of root.children) {
          if (!ch || ch === mount) continue;
          if (ch.userData?.cldHingeLSeamPackage && Number(ch.userData?.cfrnDrillTemplateId) > 0) {
            siblingHasLPackage = true;
            break;
          }
          ch.traverse?.((o) => {
            if (siblingHasLPackage || o === mount) return;
            if (o.userData?.cldHingeLSeamPackage && Number(o.userData?.cfrnDrillTemplateId) > 0) {
              siblingHasLPackage = true;
            }
          });
          if (siblingHasLPackage) break;
        }
        if (siblingHasLPackage) break;
      }
      if (siblingHasLPackage) {
        mount.userData = mount.userData || {};
        mount.userData.cldHingeLSeamPackage = true;
        mount.userData.cfrnDrillTemplateId = tid;
        return null;
      }
    }

    const builtList = [];
    const attachOne = (cmId, off, hingePart, nameHint) => {
      if (!(cmId > 0)) return null;
      // L-пакет: те же знаки, что admin mapPoint / card _drillTemplateLocalPosUnits: (x, −y, −z).
      const ox = Number(off?.x) || 0;
      const oy = Number(off?.y) || 0;
      const oz = Number(off?.z) || 0;
      const posMm = isLPackage
        ? { x: ox, y: -oy, z: -oz }
        : { x: ox, y: oy, z: oz };
      const modelItem = {
        type: 'model',
        name: nameHint || `Model_${cmId}`,
        active: 1,
        size: { x: 1, y: 1, z: 1 },
        pos: posMm,
        pivot: { x: 0, y: 0, z: 0 },
        rot: { x: 0, y: 0, z: 0 },
        c_rot: { x: 0, y: 0, z: 0 },
        spec: {
          id: String(cmId),
          joint_template_model: 1,
          joint_hardware: 1,
          from_drill_template: 1,
          hingePart,
        },
        children: [],
      };
      const modelCtx = {
        ...(parentSection && typeof parentSection === 'object' ? parentSection : {}),
        hingeModuleLocalBuild: true,
        parent: mount,
        size: parentSection?.size || { x: 38, y: 67, z: 18 },
      };
      const built = this.buildModel(modelItem, modelCtx);
      if (!built) return null;
      built.userData.isHingeBazisExport = true;
      built.userData.fromDrillTemplateModel = true;
      built.userData.isAccessory = true;
      built.userData.cfrnDrillTemplateId = tid;
      built.userData.hingePart = hingePart;
      built.traverse((o) => {
        if (!o?.isMesh) return;
        o.userData = o.userData || {};
        o.userData.isAccessory = true;
        o.userData.fromDrillTemplateModel = true;
        o.userData.isHingeBazisExport = true;
        o.userData.hingePart = hingePart;
      });
      mount.add(built);
      return built;
    };

    if (isLPackage) {
      const bCorpus = attachOne(
        corpusId,
        tplInfo.jointModelVisualOffsetMm,
        'corpus',
        tplInfo.corpusModelName || tplInfo.cabinetModelName || `Corpus_${corpusId}`
      );
      if (bCorpus) builtList.push(bCorpus);
      const bFacade = attachOne(
        facadeId,
        tplInfo.facadeModelVisualOffsetMm,
        'facade',
        tplInfo.facadeModelName || `Facade_${facadeId}`
      );
      if (bFacade) builtList.push(bFacade);
      // Одна цепочка с превью/ролями: R_place на own Присадки.
      mount.userData = mount.userData || {};
      mount.userData.cldHingeLSeamPackage = true;
      mount.userData.cfrnDrillTemplateId = tid;
      mount.userData.cldLSeamFacadePendingDetach = null;
      try {
        let animDir = 'ly';
        let cur = mount;
        for (let i = 0; i < 12 && cur; i++) {
          const d = String(cur.userData?.cldDoorDirection || '').toLowerCase();
          if (d) {
            animDir = d;
            break;
          }
          cur = cur.parent;
        }
        const edge = this._applyLSeamRPlaceToObject(mount, animDir);
        if (edge) mount.userData.cldLSeamRPlaceEdge = edge;
      } catch (e) {
        if (this._hingeRoomDbg()) {
          console.warn('[CLD][HINGE-DRILL] R_place failed', e);
        }
      }
    } else if (corpusId > 0) {
      const b = attachOne(
        corpusId,
        tplInfo.jointModelVisualOffsetMm,
        part === 'facade' ? 'facade' : 'corpus',
        tplInfo.corpusModelName || tplInfo.cabinetModelName || `Model_${corpusId}`
      );
      if (b) builtList.push(b);
    }

    if (this._hingeRoomDbg() && builtList.length) {
      console.warn('[CLD][HINGE-DRILL] GLB из шаблона присадки', {
        templateId: tid,
        setupType,
        isLPackage,
        corpusId,
        facadeId,
        part,
        count: builtList.length,
        mount: mount.name,
      });
    }
    return builtList[0] || null;
  }

  /** L-пакет: setupType=2 и задан facadeModelId (явный пакет стыка). */
  _resolveHingeLSeamPackageInfo(hingeMod) {
    if (!hingeMod) return null;
    let tid = 0;
    hingeMod.traverse((o) => {
      if (tid) return;
      const n = Number(o?.userData?.cfrnDrillTemplateId) || 0;
      if (n > 0) tid = n;
    });
    if (!(tid > 0)) return null;
    const info = this._getDrillTemplateHolesForBuilder(tid);
    if (Number(info.setupType) !== 2) return null;
    if (!(Number(info.facadeModelId) > 0)) return null;
    const corpusId = Number(info.corpusModelId) || Number(info.cabinetModelId) || 0;
    if (!(corpusId > 0)) return null;
    return { templateId: tid, ...info };
  }

  _isCatalogHingeLSeamPackage(hingeMod) {
    return !!this._resolveHingeLSeamPackageInfo(hingeMod);
  }

  /** buildModule: L-пакет по drill template id (до появления сцены) — не ставить X от ширины карточки. */
  _isLSeamHingeModuleBuildItem(item, parentSection, templateTree) {
    const ids = this._hingeDrillIdsFromMergedSource(item, templateTree) || {};
    const ctx = this._hingeDrillTemplateIdsFromContext(parentSection) || {};
    const tids = [
      Number(ids.door) || 0,
      Number(ids.facade) || 0,
      Number(ctx.door) || 0,
      Number(ctx.facade) || 0,
      Number(item?.spec?.hingeDoorDrillTemplateId) || 0,
      Number(item?.spec?.hingeFacadeDrillTemplateId) || 0,
    ].filter((n) => n > 0);
    // Присадка в дереве: spec.id часто = id шаблона L
    const walk = (arr) => {
      if (!Array.isArray(arr)) return;
      for (const n of arr) {
        if (!n || typeof n !== 'object') continue;
        if (String(n.type || '').toLowerCase() === 'furniture' && /присадк/i.test(String(n.name || ''))) {
          const id = Number(n.spec?.id) || 0;
          if (id > 0) tids.push(id);
        }
        if (Array.isArray(n.children)) walk(n.children);
      }
    };
    walk(templateTree);
    walk(item?.children);
    for (const tid of tids) {
      const info = this._getDrillTemplateHolesForBuilder(tid);
      if (Number(info.setupType) === 2 && Number(info.facadeModelId) > 0) return true;
    }
    return false;
  }

  /**
   * L-пакет: origin шаблона на передний торец бока + внутренняя пласть.
   * Двигаем только Furniture_Присадка/__furniture_own (ноль L), не весь Module_
   * и не ломая GLB на hinge_animator.
   */
  _alignCatalogHingeLSeamPackageToSeam(hingeMod, swing, facadeGroup) {
    if (!hingeMod || typeof THREE === 'undefined') return;
    if (!this._isCatalogHingeLSeamPackage(hingeMod)) return;

    const dir =
      String(swing?.userData?.cldDoorDirection || '').toLowerCase() ||
      String(hingeMod.userData?.cldDoorDirection || '').toLowerCase() ||
      'ly';
    const isLTR = !dir.startsWith('r');

    const origin = this._findLSeamPackageOriginNode(hingeMod, swing);
    if (!origin) {
      console.warn('[CLD][HINGE-ROOM] L-seam skip: нет Furniture_Присадка', {
        hinge: hingeMod.name,
        hasSwing: !!swing,
      });
      return;
    }
    if (origin === hingeMod || origin.userData?.isCatalogHingeModule) {
      console.warn('[CLD][HINGE-ROOM] L-seam skip: origin=module (нужен __furniture_own)', {
        hinge: hingeMod.name,
        origin: origin.name,
      });
      return;
    }
    const parent = origin.parent;
    if (!parent) return;

    const faceX = this._findCabinetSidewallInnerFaceWorldX(hingeMod, isLTR);
    const seamZ = this._findCabinetSidewallFrontWorldZ(hingeMod, isLTR);
    if (!Number.isFinite(faceX) || !Number.isFinite(seamZ)) {
      console.warn('[CLD][HINGE-ROOM] L-seam skip: no seam', { faceX, seamZ, hinge: hingeMod.name });
      return;
    }

    origin.updateMatrixWorld(true);
    const wp = new THREE.Vector3();
    origin.getWorldPosition(wp);
    const dx = faceX - wp.x;
    if (Math.abs(dx) >= 0.02) this._shiftObjectWorldX(origin, parent, dx);
    origin.updateMatrixWorld(true);
    origin.getWorldPosition(wp);
    const dz = seamZ - wp.z;
    if (Math.abs(dz) >= 0.02) this._shiftObjectWorldZ(origin, parent, dz);
    hingeMod.updateMatrixWorld(true);
    hingeMod.userData = hingeMod.userData || {};
    hingeMod.userData.cldHingeLSeamAligned = true;
  }

  /** Debug L-сферы выкл (ломали parse/GLB петель). */
  _updateLSeamPackagePivotDebug() {}

  /** Снять оставшиеся маркеры L-пивота со сцены (если были). */
  _refreshLSeamPivotDebugForHingeMods() {
    const scene =
      (typeof window !== 'undefined' && (window.__cldRoomScene || window.__cldAppState?.scene)) ||
      null;
    if (!scene?.traverse) return;
    const doomed = [];
    scene.traverse((o) => {
      if (o?.userData?.isLSeamPivotDebug || o?.name === '__l_seam_pivot_dbg') doomed.push(o);
    });
    for (const o of doomed) {
      o.parent?.remove(o);
      o.traverse((c) => {
        c.geometry?.dispose?.();
        if (c.material) {
          if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose?.());
          else c.material.dispose?.();
        }
      });
    }
  }

  /**
   * L-пакет: обе половины сначала на Присадке (как шаблон). После align к шву
   * фасад attach на hinge_animator — world-поза закрытого состояния сохраняется.
   * hinge_animator уже на __door_swing после reparent — ищем и на модуле, и на swing.
   */
  _detachLSeamFacadeToHingeAnimatorAfterAlign(hingeMod, swing) {
    if (!hingeMod || typeof THREE === 'undefined') return 0;
    const animRoots = this._collectHingeAnimatorRootsForHingeModule(hingeMod, swing);
    const animRoot = animRoots[0] || null;
    if (!animRoot) {
      if (this._hingeRoomDbg()) {
        console.warn('[CLD][L-SEAM] facade detach: no hinge_animator', {
          hinge: hingeMod.name,
          hasSwing: !!swing,
        });
      }
      return 0;
    }

    const facades = [];
    hingeMod.traverse((o) => {
      if (!o || o === animRoot) return;
      if (o.userData?.hingePart === 'facade' && o.userData?.fromDrillTemplateModel) {
        facades.push(o);
      }
    });
    hingeMod.traverse((o) => {
      const pending = o?.userData?.cldLSeamFacadePendingDetach;
      if (pending && !facades.includes(pending)) facades.push(pending);
      if (o?.userData) o.userData.cldLSeamFacadePendingDetach = null;
    });

    let moved = 0;
    const attachFacades = () => {
      for (const f of facades) {
        if (!f || f.parent === animRoot) continue;
        try {
          // CFRN: после detach walk-up до Присадки не работает — явная связь для присадки.
          f.userData = f.userData || {};
          f.userData.cldLSeamPackageMountUuid = hingeMod.uuid;
          f.traverse((o) => {
            if (!o?.userData) return;
            o.userData.cldLSeamPackageMountUuid = hingeMod.uuid;
          });
          f.updateMatrixWorld(true);
          animRoot.updateMatrixWorld(true);
          animRoot.attach(f);
          moved += 1;
        } catch (_) {}
      }
    };
    if (swing) {
      this._withDoorSwingClosedForHingeAlign(swing, attachFacades);
    } else {
      attachFacades();
    }
    if (moved && this._hingeRoomDbg()) {
      console.warn('[CLD][L-SEAM] facade → hinge_animator after seam align', {
        hinge: hingeMod.name,
        animParent: animRoot.parent?.name,
        moved,
      });
    }
    return moved;
  }

  /** Планка C: шаблоны присадки из LS (админка Clodis), как fallback у CabinetFurnitureNode. */
  _resolveFurnitureFromDrillTemplateSpec(item, parentSection) {
    const spec = item?.spec;
    if (!spec || typeof spec !== 'object') return null;
    let tid = 0;
    const api = typeof window !== 'undefined' && window.__CLD_DRILLING_API;
    if (api && typeof api.resolveTemplateId === 'function') tid = api.resolveTemplateId(spec);
    if (!tid) tid = this._resolveFurnitureDrillTemplateId(spec, parentSection, item);
    if (!tid) return null;
    const tplInfo = this._getDrillTemplateHolesForBuilder(tid);
    const holes = tplInfo.holes || [];
    if (!holes.length) return null;

    const out = JSON.parse(JSON.stringify(item));
    let maxDiam = 0;
    let maxDepth = 0;
    for (const h of holes) {
      const d = h.diameterMm ?? h.diameter ?? 0;
      const dep = h.depthMm ?? h.depth ?? 0;
      if (d > maxDiam) maxDiam = d;
      if (dep > maxDepth) maxDepth = dep;
    }
    if (
      (!out.size || Object.keys(out.size).length === 0) &&
      maxDiam > 0 &&
      !parentSection?.hingeModuleLocalBuild
    ) {
      out.size = { x: String(maxDiam), y: String(maxDiam), z: String(maxDepth) };
    }
    // CAD: дырки не inject в дерево комнаты — только tid на Furniture_* → CFRN.
    if (tplInfo.templateName && (!out.name || out.name === 'furniture')) {
      out.name = tplInfo.templateName;
    }
    return out;
  }

  _mergeFurnitureCatalogTemplateIntoItem(item, tpl) {
    const out = JSON.parse(JSON.stringify(item));
    if ((!out.name || out.name === 'furniture') && tpl.name) out.name = tpl.name;
    if ((!out.size || Object.keys(out.size).length === 0) && tpl.size) {
      out.size = JSON.parse(JSON.stringify(tpl.size));
    }
    if ((!Array.isArray(out.children) || out.children.length === 0) && Array.isArray(tpl.children) && tpl.children.length) {
      out.children = JSON.parse(JSON.stringify(tpl.children));
    }
    if (!out.spec || typeof out.spec !== 'object') out.spec = {};
    if (tpl.spec && typeof tpl.spec === 'object') {
      out.spec = { ...tpl.spec, ...out.spec };
    }
    return out;
  }

  _resolveFurnitureCatalogParams(item, parentSection) {
    const spec = item?.spec || {};
    const id = spec.id;
    let merged = null;
    if (id != null && id !== '') {
      const tpl = this._lookupFurnitureCatalogTemplate(id);
      if (tpl) merged = this._mergeFurnitureCatalogTemplateIntoItem(item, tpl);
    }
    const fromDrill = this._resolveFurnitureFromDrillTemplateSpec(item, parentSection);
    if (!merged) return fromDrill;
    const hasHoleChildren =
      Array.isArray(merged.children) &&
      merged.children.some((c) => String(c?.type || '').toLowerCase() === 'hole');
    if (hasHoleChildren) return merged;
    if (!fromDrill) return merged;
    if (!Array.isArray(fromDrill.children) || !fromDrill.children.length) return merged;
    merged = JSON.parse(JSON.stringify(merged));
    merged.children = JSON.parse(JSON.stringify(fromDrill.children));
    if ((!merged.size || !Object.keys(merged.size).length) && fromDrill.size) {
      merged.size = JSON.parse(JSON.stringify(fromDrill.size));
    }
    return merged;
  }

  _itemTreeHasCupDrilling(node) {
    if (!node || typeof node !== 'object') return false;
    const t = String(node.type || '').toLowerCase();
    const n = String(node.name || '').toLowerCase();
    const specId = String(node?.spec?.id ?? '').trim();
    if (t === 'hole') return true;
    if (t === 'furniture' && (specId === '3' || n.includes('присад') || n.includes('чаш') || n.includes('cup'))) {
      return true;
    }
    const ch = Array.isArray(node.children) ? node.children : [];
    for (const c of ch) {
      if (this._itemTreeHasCupDrilling(c)) return true;
    }
    return false;
  }

  /** Реф CabinetHole: pivot -1 → смещение на половину размера (мм). */
  _convPivotRefMm(pivotVal, sizeDim) {
    const n = Number(pivotVal);
    if (!Number.isFinite(n)) return 0;
    return (-n * Number(sizeDim)) / 2;
  }

  /**
   * Реф main_core_v2_part19 CabinetHole._build_pos — координаты в мм относительно parent_size
   * (контейнер furniture «Присадка», size = s:x × s:y × s:z аниматора).
   */
  _buildHolePositionRefClodis(parentSizeMm, posMm, realSizeMm, direction, isGlobal) {
    const px = Number(posMm?.x) || 0;
    const py = Number(posMm?.y) || 0;
    const pz = Number(posMm?.z) || 0;
    const rx = Number(realSizeMm?.x) || 0;
    const rz = Number(realSizeMm?.z) || 0;
    const psx = Number(parentSizeMm?.x) || 0;
    const psy = Number(parentSizeMm?.y) || 0;
    const psz = Number(parentSizeMm?.z) || 0;
    const g = isGlobal ? 1 : 0;
    const dir = String(direction || '-z').trim();
    let x = 0;
    let y = 0;
    let z = 0;
    switch (dir) {
      case 'x':
        x = g ? -psx / 2 + pz + rz / 2 : -psx / 2;
        y = -psy / 2 + py;
        z = -psz / 2 + px;
        break;
      case '-x':
        x = g ? psx / 2 + pz - rz / 2 : psx / 2;
        y = -psy / 2 + py;
        z = -psz / 2 + px;
        break;
      case 'y':
        y = g ? -psy / 2 + pz + rz / 2 : -psy / 2;
        x = -psx / 2 + px;
        z = -psz / 2 + py;
        break;
      case '-y':
        y = g ? psy / 2 + pz - rz / 2 : psy / 2;
        x = -psx / 2 + px;
        z = -psz / 2 + py;
        break;
      case 'z':
        z = g ? -psz / 2 + pz + rz / 2 : -psz / 2;
        x = -psx / 2 + px;
        y = -psy / 2 + py;
        break;
      case '-z':
      default:
        z = g ? psz / 2 + pz - rz / 2 : psz / 2;
        x = -psx / 2 + px;
        y = -psy / 2 + py;
        break;
    }
    return { x, y, z };
  }

  /** Реф CabinetHole._build_pivot — доп. сдвиг own_object (мм). */
  _buildHolePivotOffsetRefMm(direction, realSizeMm) {
    const rx = Number(realSizeMm?.x) || 0;
    const ry = Number(realSizeMm?.y) || 0;
    const rz = Number(realSizeMm?.z) || 0;
    const dir = String(direction || '-z').trim();
    const table = {
      x: [-1, 0, 0, rz, ry, rx],
      '-x': [1, 0, 0, rz, ry, rx],
      y: [0, -1, 0, rx, rz, ry],
      '-y': [0, 1, 0, rx, rz, ry],
      z: [0, 0, -1, rx, ry, rz],
      '-z': [0, 0, 1, rx, ry, rz],
    };
    const row = table[dir] || table['-z'];
    return {
      x: this._convPivotRefMm(row[0], row[3]),
      y: this._convPivotRefMm(row[1], row[4]),
      z: this._convPivotRefMm(row[2], row[5]),
    };
  }

  // Build drilling hole (Clodis-style simplified runtime hole)
  buildHole(item, parentSection) {
    this._invokeItemEvent(item, 'on_before_params', { parentSection });
    const holeName = item.name || 'hole';
    const fallbackSize = { x: 35, y: 0, z: 12 };
    const size = this.evaluateSize(item.size || fallbackSize, parentSection);
    const normalizedSize = {
      x: Number.isFinite(Number(size.x)) && Number(size.x) > 0 ? Number(size.x) : fallbackSize.x,
      y: 0,
      z: Number.isFinite(Number(size.z)) && Number(size.z) > 0 ? Number(size.z) : fallbackSize.z,
    };
    const pos = this.evaluatePosition(item.pos || {}, parentSection, normalizedSize);
    const pivot = this.evaluatePivot(item.pivot || {}, normalizedSize);
    try {
      console.log('[CLD][buildHole]', {
        name: holeName,
        spec: item.spec || {},
        size: normalizedSize,
        pos,
        pivot,
        parentSectionSize: parentSection?.size || null,
      });
    } catch (_) {}
    this._invokeItemEvent(item, 'on_before_build', { parentSection, size: normalizedSize, pos, pivot });

    const group = new THREE.Group();
    group.name = `Hole_${holeName}`;
    group.userData.isHole = true;
    const spec = item.spec || {};
    group.userData.holeSpec = { ...spec };
    group.userData.holeDiameterMm = normalizedSize.x;
    group.userData.holeDepthMm = normalizedSize.z;

    // Base cylinder in local +Y axis, then orient by direction.
    const radius = Math.max(0.1, normalizedSize.x / 2);
    const depth = Math.max(0.1, normalizedSize.z);
    const geom = new THREE.CylinderGeometry(radius, radius, depth, 24);
    const direction = String(spec.direction || '-z').trim();
    switch (direction) {
      case 'x':
        geom.rotateZ(Math.PI / 2);
        geom.translate(-depth / 2, 0, 0);
        break;
      case '-x':
        geom.rotateZ(-Math.PI / 2);
        geom.translate(depth / 2, 0, 0);
        break;
      case 'y':
        geom.translate(0, -depth / 2, 0);
        break;
      case '-y':
        geom.rotateZ(-Math.PI);
        geom.translate(0, depth / 2, 0);
        break;
      case 'z':
        geom.rotateX(Math.PI / 2);
        geom.translate(0, 0, -depth / 2);
        break;
      case '-z':
      default:
        geom.rotateX(-Math.PI / 2);
        geom.translate(0, 0, depth / 2);
        break;
    }
    const mat = new THREE.MeshBasicMaterial({
      color: 0x999999,
      transparent: true,
      opacity: 0.6,
      depthTest: true,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = 'HoleMesh';
    mesh.userData.isHole = true;
    group.add(mesh);

    const isGlobal = Number(spec.global) === 1;
    const parentSize = parentSection?.size || {};
    const realSize = {
      x: normalizedSize.x,
      y: normalizedSize.x,
      z: normalizedSize.z,
    };
    if (isGlobal && parentSize.x > 0 && parentSize.y > 0 && parentSize.z > 0) {
      const refPos = this._buildHolePositionRefClodis(
        parentSize,
        pos,
        realSize,
        direction,
        true
      );
      const pivotOff = this._buildHolePivotOffsetRefMm(direction, realSize);
      group.position.set(
        refPos.x + pivotOff.x,
        refPos.y + pivotOff.y,
        refPos.z + pivotOff.z
      );
      const rot = item.rot || {};
      if (rot.x) group.rotation.x = this.parseRotation(rot.x);
      if (rot.y) group.rotation.y = this.parseRotation(rot.y);
      if (rot.z) group.rotation.z = this.parseRotation(rot.z);
      group.userData.holePosRef = 'global';
    } else {
      this.applyTransform(group, pos, pivot, item.rot || {});
    }

    this._invokeItemEvent(item, 'on_after_build', { parentSection, target: group, size: normalizedSize, pos, pivot });
    return group;
  }

  /**
   * Вычислить Y-позиции петель по высоте двери (как Door_new.build_hinges в рефе).
   * acc.hinges — массив [{pos, from}] (приоритет); иначе авто из count и hingeInsetTopMm/BottomMm (по умолчанию 120).
   * Возвращает массив Y-координат в мм от низа (0 = низ двери).
   */
  _resolveHingeOpening(acc, item) {
    const a = String(acc?.opening || '').toLowerCase().trim();
    const s = String(item?.spec?.opening || '').toLowerCase();
    return a || s;
  }

  _resolveHingeYPositions(acc, doorHeightMm, count) {
    const hinges = acc && acc.hinges;
    const top = Number(acc?.hingeInsetTopMm);
    const bottom = Number(acc?.hingeInsetBottomMm);
    const OFF_TOP = Number.isFinite(top) && top >= 0 ? top : 120;
    const OFF_BOT = Number.isFinite(bottom) && bottom >= 0 ? bottom : 120;
    if (Array.isArray(hinges) && hinges.length) {
      return hinges.map(h => {
        let pos = h.pos != null ? String(h.pos) : '0';
        const from = h.from != null ? Number(h.from) : -1;
        let isPct = false;
        if (pos.endsWith('%')) { pos = pos.slice(0, -1); isPct = true; }
        let v = parseFloat(pos) || 0;
        if (isPct) v = v / 100 * doorHeightMm;
        if (from === 0) return doorHeightMm / 2 + v;
        if (from > 0) return doorHeightMm - v;
        return v;
      });
    }
    const n = Math.max(1, count || 2);
    if (n === 1) return [OFF_TOP];
    if (n === 2) return [OFF_TOP, doorHeightMm - OFF_BOT];
    const positions = [OFF_TOP];
    const gap = (doorHeightMm - OFF_TOP - OFF_BOT) / (n - 1);
    for (let i = 1; i < n - 1; i++) positions.push(OFF_TOP + i * gap);
    positions.push(doorHeightMm - OFF_BOT);
    return positions;
  }

  _mergeHingeAccessoryFromLayoutScheme(acc, item, doorHeightMm) {
    const gen = typeof window !== 'undefined' ? window.__cldHingeLayout : null;
    if (!gen || typeof gen.resolveHingeLayoutScheme !== 'function') return acc;
    const ctx = this._facadeHingeContext || {};
    const layoutRole = ctx.layoutRole || item?.layout_role || item?.sectionLayoutRole || 'facades';
    const roleLayoutCatalogId =
      Number(ctx.facadeRoleLayoutCatalogItemId) ||
      Number(ctx.facadeCatalogItemId) ||
      0;
    const doubleSwing =
      !!ctx.doubleSwingLeafFacade ||
      (gen.FACADE_COMPOSITE_DOUBLE_CATALOG_IDS &&
        gen.FACADE_COMPOSITE_DOUBLE_CATALOG_IDS.has(roleLayoutCatalogId));
    const doorDirection = ctx.doorDirection || null;
    const resolveOpts = {
      facadeLayoutRole: layoutRole,
      productKind: this.productKind,
      placementKind: this.placementKind,
      zoneHand: this.zoneHand,
      doorDirection,
      facadeCatalogItemId: roleLayoutCatalogId || null,
      catalogItemId: roleLayoutCatalogId || null,
      doubleSwing,
      catalogHingeLayoutId: ctx.catalogHingeLayoutId,
      specHingeLayoutId: item?.spec?.hingeLayoutId,
      furnitureHingeLayoutOverride: this.hingeLayoutOverride,
    };
    const layoutRoleNorm = String(layoutRole || '').trim().toLowerCase();
    if (
      this.unifiedFacade &&
      layoutRoleNorm === 'facades_main' &&
      typeof gen.buildUnifiedWardrobeHingeAccessory === 'function'
    ) {
      const bands = this._getUnifiedFacadeBandHeightsMm(
        doorHeightMm,
        this._facadeHingeContext?.parentSection || null
      );
      const unifiedAcc = gen.buildUnifiedWardrobeHingeAccessory({
        ...resolveOpts,
        vars: this.variables,
        doorHeightMm: doorHeightMm,
        mainBandMm: bands.mainH,
        topBandMm: bands.topH,
        topFacadeCatalogItemId:
          Number(item?.__cldUnifiedFacadeTopCatalogSpecId) ||
          Number(this._unifiedFacadeModuleMeta?.topCatalogSpecId) ||
          0,
      });
      if (unifiedAcc) {
        const merged = {
          ...acc,
          ...unifiedAcc,
          opening: acc.opening || item?.spec?.opening,
          sku: acc.sku || acc.article,
          name: acc.name || unifiedAcc.name,
        };
        if (this._hingeRoomVerbose()) {
          this._logHingeRoom('mergeScheme/unifiedFacade', {
            itemName: item?.name,
            doorHeightMm,
            result: this._snapshotHingeRoleLayoutAcc(merged, doorHeightMm, gen),
          });
        }
        return merged;
      }
    }
    let layoutAcc = null;
    if (typeof gen.resolveHingeRoleLayoutParams === 'function' && typeof gen.roleLayoutParamsToHingeAccessory === 'function') {
      const roleParams = gen.resolveHingeRoleLayoutParams(resolveOpts);
      if (roleParams) {
        const opens =
          roleParams.opens ||
          (typeof gen.resolveOpensForHingeRoleLayout === 'function'
            ? gen.resolveOpensForHingeRoleLayout({
                facadeLayoutRole: layoutRole,
                doubleSwing,
                doorDirection,
                zoneHand: this.zoneHand,
              })
            : doubleSwing
              ? 'double-swing'
              : 'swing-left');
        const axis =
          typeof gen.hingeAxisForOpens === 'function'
            ? gen.hingeAxisForOpens(opens)
            : typeof gen.hingeAxisForRole === 'function'
              ? gen.hingeAxisForRole(layoutRole)
              : 'Y';
        const facadeW =
          Number(item?.size?.x) ||
          Number(this._facadeHingeContext?.facadeWidth) ||
          doorHeightMm;
        const dim = axis === 'X' ? facadeW : doorHeightMm;
        layoutAcc = gen.roleLayoutParamsToHingeAccessory(roleParams, dim, opens);
        if (layoutAcc) {
          layoutAcc.__hingeRoleOpens = opens;
          layoutAcc.__hingeRoleParams = {
            hingeCount: roleParams.hingeCount,
            topOffset: roleParams.topOffset,
            bottomOffset: roleParams.bottomOffset,
            catalogItemId: roleParams.catalogItemId,
            variant: roleParams.variant,
            opens: roleParams.opens,
          };
        }
      }
    }
    const scheme = layoutAcc ? null : gen.resolveHingeLayoutScheme(resolveOpts);
    if (!layoutAcc && scheme) {
      layoutAcc =
        typeof gen.schemeToHingeAccessory === 'function'
          ? gen.schemeToHingeAccessory(scheme, doorHeightMm)
          : null;
    }
    if (!layoutAcc) {
      this._logHingeRoom('mergeScheme/miss', { resolveOpts, itemName: item?.name });
      return acc;
    }
    const merged = {
      ...acc,
      ...layoutAcc,
      opening: acc.opening || item?.spec?.opening,
      sku: acc.sku || acc.article,
      name: acc.name || layoutAcc.name,
    };
    if (this._hingeRoomVerbose()) {
      this._logHingeRoom('mergeScheme/ok', {
        itemName: item?.name,
        resolveOpts,
        roleParams: layoutAcc.__hingeRoleParams || null,
        result: this._snapshotHingeRoleLayoutAcc(merged, doorHeightMm, gen),
      });
    }
    return merged;
  }

  _buildHingesForFacade(wallGroup, item, parentSection) {
    // old accessory BLB hinges off — catalog path only
    if (this._hingeRoomDbg() && !ClodisBuilder._buildHingesForFacadeOffLogged) {
      ClodisBuilder._buildHingesForFacadeOffLogged = true;
      console.log('[CLD][HINGE] _buildHingesForFacade: skipped (old accessory BLB hinges off)');
    }
    return;
    let acc = (item.accessories || []).find(a =>
      a && (String(a.id || '').includes('hinge') || (a.name || '').toLowerCase().includes('петл'))
    );
    if (!acc) return;

    const facadeSize = wallGroup.userData.originalSize || { x: 0, y: 0, z: 0 };
    const doorH = facadeSize.y;
    if (!doorH || doorH <= 0) return;

    acc = this._mergeHingeAccessoryFromLayoutScheme(acc, item, doorH);

    try {
      console.log('[CLD][HINGE] _buildHingesForFacade:start', {
        wall: wallGroup?.name || '',
        itemName: item?.name || '',
        layoutRole: this._facadeHingeContext?.layoutRole,
        schemeId: acc.__hingeLayoutSchemeId,
        hingeCount: acc.count,
      });
    } catch (_) {}

    const count = Number(acc.count) || 2;
    const opening = this._resolveHingeOpening(acc, item);
    const isLTR = opening !== 'right' && opening !== 'rtl';

    const hingeDoorSize = { x: 12, y: 55, z: 12 };
    const hingeFacadeSize = { x: 11, y: 55, z: 4 };
    const cabinetThickness = parentSection?.wallThickness || 16;
    const cabT = Number(acc.hingeCabinetThicknessMm);
    const hoMm = Number(acc.hingesOffset);
    const stackMm =
      Number.isFinite(cabT) && cabT > 0
        ? cabT
        : Number.isFinite(hoMm) && hoMm > 0
          ? hoMm
          : cabinetThickness;

    let positions = this._resolveHingeYPositions(acc, doorH, count);
    if (Array.isArray(acc.hinges) && acc.hinges.length) {
      positions = this._resolveHingeYPositions(acc, doorH, acc.hinges.length);
    }
    const hingeMat = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      metalness: 0.7,
      roughness: 0.3,
    });

    const hingeSku = String(acc.sku || acc.article || acc.id || '').trim() || 'HINGE_DEFAULT';
    const hingeLabel = String(acc.name || 'Петля');

    for (const yMm of positions) {
      const dirJ = isLTR ? -1 : 1;
      // Keep hinge anchored to facade edge in centered local coordinates.
      const edgeInset = Number.isFinite(hoMm) && hoMm > 0 ? hoMm : 16;
      const xEdge = isLTR
        ? (-facadeSize.x / 2 + edgeInset / 2)
        : (facadeSize.x / 2 - edgeInset / 2);

      const gDoor = new THREE.BoxGeometry(hingeDoorSize.x, hingeDoorSize.y, hingeDoorSize.z);
      const mDoor = new THREE.Mesh(gDoor, hingeMat);
      mDoor.name = 'furni_hinge_door';
      mDoor.userData.isAccessory = true;
      mDoor.userData.isFurniture = true;
      mDoor.userData.isHingeBazisExport = true;
      mDoor.userData.accessorySku = hingeSku;
      mDoor.userData.accessoryName = hingeLabel;
      mDoor.userData.hingeOpeningIsLTR = isLTR;
      const dDrillTid = Number(acc.hingeDoorDrillTemplateId);
      if (Number.isFinite(dDrillTid) && dDrillTid > 0) mDoor.userData.cfrnDrillTemplateId = dDrillTid;
      // Y как в рефе Clodis: та же база, что у части на фасаде (центр двери по высоте).
      const yCentered = yMm - doorH / 2;
      try {
        console.log('[CLD][HINGE] iteration', { yMm, yCentered, isLTR, dirJ, doorH, facadeSize });
      } catch (_) {}
      mDoor.position.set(
        xEdge + dirJ * (stackMm + hingeDoorSize.x / 2),
        yCentered,
        -hingeDoorSize.z / 2
      );
      if (isLTR) mDoor.rotation.z = Math.PI;
      wallGroup.add(mDoor);

      const gFac = new THREE.BoxGeometry(hingeFacadeSize.x, hingeFacadeSize.y, hingeFacadeSize.z);
      const mFac = new THREE.Mesh(gFac, hingeMat);
      mFac.name = 'furni_hinge_facade';
      mFac.userData.isAccessory = true;
      mFac.userData.isFurniture = true;
      mFac.userData.isHingeBazisExport = true;
      mFac.userData.accessorySku = hingeSku;
      mFac.userData.accessoryName = hingeLabel;
      mFac.userData.hingeOpeningIsLTR = isLTR;
      const fDrillTid = Number(acc.hingeFacadeDrillTemplateId);
      if (Number.isFinite(fDrillTid) && fDrillTid > 0) mFac.userData.cfrnDrillTemplateId = fDrillTid;
      const facadeThickness = facadeSize.z || 16;
      mFac.position.set(
        xEdge + dirJ * (hingeFacadeSize.x / 2),
        yCentered,
        -facadeThickness / 2 - hingeFacadeSize.z / 2
      );
      if (isLTR) mFac.rotation.z = Math.PI;
      wallGroup.add(mFac);
      // Присадка петель — только Furniture_* + cfrnDrillTemplateId (CFRN), без runtime Ø35/Hole_*.
    }
  }

  /**
   * Ось c_rot для конструктора (градусы): число, строка числа, v:var, -v:var (как в админке для фасадов).
   */
  _evaluateCrotDegrees(val, parentSection) {
    if (val == null || val === '') return 0;
    if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
    const s = String(val).trim();
    if (!s) return 0;
    if (s.startsWith('-')) {
      const rest = s.slice(1).trim();
      return -this.evaluateExpression(rest, parentSection);
    }
    return this.evaluateExpression(s, parentSection);
  }

  /**
   * Начальный угол распашной группы из item.c_rot по оси, заданной в hingeAcc (совпадает с sw.axis).
   */
  _applyInitialDoorSwingFromCrot(swing, sw, hingeAcc, item, parentSection) {
    const crot = item && item.c_rot;
    if (!swing || !sw || !crot || typeof crot !== 'object') return;
    const axis = sw.axis === 'x' || sw.axis === 'y' ? sw.axis : 'y';
    const opening = this._resolveHingeOpening(hingeAcc, item);
    const isTop = opening === 'top' || opening === 'simple_top';
    const isBottom = opening === 'bottom' || opening === 'simple_bottom';
    let deg = 0;
    if (isTop || isBottom) {
      deg = this._evaluateCrotDegrees(crot.x, parentSection);
    } else {
      deg = this._evaluateCrotDegrees(crot.y, parentSection);
    }
    if (!Number.isFinite(deg) || deg === 0) return;
    let rad = THREE.MathUtils.degToRad(deg);
    rad = this._capRoomSideSwingRad(rad, axis, isTop, isBottom);
    sw.currentAngle = rad;
    sw.targetAngle = rad;
    sw.isOpen = Math.abs(rad) > 1e-4;
    if (axis === 'y') swing.rotation.y = rad;
    else swing.rotation.x = rad;
  }

  /**
   * Группа вращения фасада с петлёй (мм, локально к parentGroup). Регистрируется для анимации в комнате.
   * @param {{ panelOnly?: boolean }} opts — panelOnly: на стенке не трогаем дочерние Module_/Furniture_ (ручки и т.п.).
   */
  _setupDoorSwingGroupIfHinge(parentGroup, hingeAcc, item, opts = {}, parentSection = null) {
    if (!parentGroup || !hingeAcc) return;
    if (parentGroup.getObjectByName('__door_swing')) return;
    const sz = parentGroup.userData.originalSize;
    if (!sz || !(Number(sz.x) > 0)) return;

    const panelOnly = !!opts.panelOnly;
    let ch = [...parentGroup.children];
    if (panelOnly) {
      ch = ch.filter((c) => {
        if (!c || c.name === '__door_swing') return false;
        if (c.isMesh) return true;
        if (c instanceof THREE.Group) {
          const n = String(c.name || '');
          if (n.startsWith('Module_') || n.startsWith('Furniture_') || n.startsWith('Accessory_')) return false;
          if (c.userData && c.userData.isSection) return false;
          return false;
        }
        return false;
      });
    }
    if (!ch.length) return;

    const opening = this._resolveHingeOpening(hingeAcc, item);
    const isTop = opening === 'top' || opening === 'simple_top';
    const isBottom = opening === 'bottom' || opening === 'simple_bottom';
    const isLTR = opening !== 'right' && opening !== 'rtl';
    const doorDirBody = isTop ? 'lx' : isBottom ? 'rx' : isLTR ? 'ly' : 'ry';

    const hoMm = Number(hingeAcc.hingesOffset);
    const ho = Number.isFinite(hoMm) && hoMm > 0 ? hoMm : 16;
    const w = sz.x;
    const h = sz.y;
    const d = Number(sz.z) || Number(parentGroup.userData?.facadeThicknessMm) || 16;
    const contentOff = this._resolveFacadeContentOffsetMm(parentGroup);
    const cx = contentOff.x;
    const cy = contentOff.y;
    const cz = contentOff.z;

    let pivotX = 0;
    let pivotY = 0;
    let pivotZ = 0;
    let axis = 'y';
    let maxAngle = isLTR ? Math.PI / 2 : -Math.PI / 2;

    if (isTop) {
      axis = 'x';
      maxAngle = -Math.PI / 2 * 0.92;
      pivotY = cy + h / 2 - ho / 2;
    } else if (isBottom) {
      axis = 'x';
      maxAngle = Math.PI / 2 * 0.92;
      pivotY = cy - h / 2 + ho / 2;
    } else {
      pivotX = isLTR ? cx - w / 2 + ho / 2 : cx + w / 2 - ho / 2;
      pivotZ = cz - d / 2;
    }

    maxAngle = this._capRoomSideSwingRad(maxAngle, axis, isTop, isBottom);

    const swing = new THREE.Group();
    swing.name = '__door_swing';
    const doorDomainId = this._resolveDoorDomainId(item, parentSection);
    swing.userData.cldDoorSwing = {
      axis,
      maxAngle,
      isOpen: false,
      currentAngle: 0,
      targetAngle: 0,
      doorDomainId,
      isFacadeMaster: false,
      roomSideSwing: this._isRoomSideSwingDoor(axis, isTop, isBottom),
      roomOpenAngleRad: this._isRoomSideSwingDoor(axis, isTop, isBottom) ? maxAngle : undefined,
    };
    swing.userData.cldDoorDirection = doorDirBody;
    parentGroup.userData.cldDoorDirection = doorDirBody;

    // Swing позиционируем в точку пивота, дети смещаются на -pivot внутри swing.
    // Визуально панель остаётся на месте, ось вращения — ребро петли.
    swing.position.set(pivotX, pivotY, pivotZ);

    ch.forEach((c) => {
      parentGroup.remove(c);
      c.position.x -= pivotX;
      c.position.y -= pivotY;
      c.position.z -= pivotZ;
      swing.add(c);
    });
    // Маркер оси вращения: показываем только при явном debug-флаге.
    if (typeof window !== 'undefined' && window.__CLD_DEBUG_DOOR_AXIS_MARKER === true) {
      const axisDot = new THREE.Mesh(
        new THREE.SphereGeometry(10, 16, 12),
        new THREE.MeshBasicMaterial({
          color: 0xc800ff,
          depthTest: false,
          depthWrite: false,
          transparent: true,
          opacity: 0.98,
        })
      );
      axisDot.name = '__cld_door_axis_marker';
      axisDot.renderOrder = 1000;
      swing.add(axisDot);
    }
    parentGroup.add(swing);

    this._applyInitialDoorSwingFromCrot(swing, swing.userData.cldDoorSwing, hingeAcc, item, parentSection);

    const swLegacy = swing.userData.cldDoorSwing;
    this._applyRoomSwingDoorDefaultOpenIfNeeded(
      swing,
      swLegacy,
      item,
      axis,
      isTop,
      isBottom
    );

    swing.traverse((o) => {
      if (!o.isMesh) return;
      if (o.userData?.isHole) return;
      const acc = o.userData?.isAccessory;
      const nm = String(o.name || '');
      const hingeLike = nm.includes('hinge') || nm.includes('furni_hinge');
      if (acc && !hingeLike) return;
      o.userData.cldDoorPick = false;
    });

    if (typeof ClodisBuilder._registerDoorSwingGroup === 'function') {
      ClodisBuilder._registerDoorSwingGroup(swing);
    }
  }

  _resolveDoorDomainId(item, parentSection) {
    const spec = item && item.spec && typeof item.spec === 'object' ? item.spec : {};
    const src = parentSection && parentSection.sourceItem && typeof parentSection.sourceItem === 'object'
      ? parentSection.sourceItem
      : {};
    const raw =
      spec.group ||
      item?.section_key ||
      item?.params_key ||
      item?.id ||
      src.section_key ||
      src.params_key ||
      src.id ||
      parentSection?.name ||
      '';
    const s = String(raw || '').trim();
    return s || '__door_domain_default';
  }

  // Build accessory (комплектующее из массива accessories)
  buildAccessory(acc, sectionContext, instanceIndex = 0) {
    const accName = acc.name || `Комплектующее #${acc.id}`;
    const accId = String(acc.id || '');
    const nameLower = (accName || '').toLowerCase();

    if (nameLower.includes('петл') || nameLower.includes('hinge')) {
      return null;
    }

    let size = { x: 500, y: 30, z: 25 };
    if (nameLower.includes('направляющ') || nameLower.includes('rail') || nameLower.includes('slide')) {
      size = { x: sectionContext.size.x * 0.9, y: 30, z: 25 };
    } else if (nameLower.includes('ручк') || nameLower.includes('handle')) {
      size = { x: 30, y: 30, z: 20 };
    } else if (nameLower.includes('полкодерж') || nameLower.includes('shelf')) {
      size = { x: 20, y: 20, z: 50 };
    }

    let pos = { x: 0, y: 0, z: 0 };
    if (nameLower.includes('направляющ') || nameLower.includes('rail') || nameLower.includes('slide')) {
      pos = {
        x: sectionContext.size.x * 0.5,
        y: size.y * 0.5,
        z: sectionContext.size.z * 0.5
      };
    } else {
      pos = {
        x: sectionContext.size.x * (0.3 + instanceIndex * 0.1),
        y: sectionContext.size.y * (0.1 + instanceIndex * 0.05),
        z: sectionContext.size.z * 0.5
      };
    }

    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      metalness: 0.5,
      roughness: 0.4,
      transparent: true,
      opacity: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `Accessory_${accId}_${accName.replace(/\s+/g, '_')}`;
    mesh.position.set(pos.x, pos.y, pos.z);

    mesh.userData.isAccessory = true;
    mesh.userData.accessoryId = accId;
    mesh.userData.accessoryName = accName;
    mesh.userData.accessorySku = acc.sku || acc.article || '';
    mesh.userData.accessoryCategory = acc.category || '';
    mesh.userData.drillFrontOffsetMm = Number.isFinite(Number(acc.drillFrontOffsetMm)) ? Number(acc.drillFrontOffsetMm) :
      (Number.isFinite(Number(acc.frontOffsetMm)) ? Number(acc.frontOffsetMm) : 20);
    mesh.userData.drillInstanceSpacingMm = Number.isFinite(Number(acc.drillInstanceSpacingMm)) ? Number(acc.drillInstanceSpacingMm) : 0;
    mesh.userData.drillStartMm = Number.isFinite(Number(acc.drillStartMm)) ? Number(acc.drillStartMm) : 50;
    mesh.userData.drillStepMm = Number.isFinite(Number(acc.drillStepMm)) ? Number(acc.drillStepMm) : 32;
    mesh.userData.drillHoleCount = Number.isFinite(Number(acc.drillHoleCount)) ? Number(acc.drillHoleCount) : 0;
    mesh.userData.drillHoleDiameterMm = Number.isFinite(Number(acc.drillHoleDiameterMm)) ? Number(acc.drillHoleDiameterMm) : 5;
    mesh.userData.drillHoleDepthMm = Number.isFinite(Number(acc.drillHoleDepthMm)) ? Number(acc.drillHoleDepthMm) : 12;
    mesh.userData.instanceIndex = instanceIndex;

    this._dbg(`✅ Комплектующее "${accName}" создано: размер=(${size.x}, ${size.y}, ${size.z})мм, позиция=(${pos.x}, ${pos.y}, ${pos.z})мм`);
    return mesh;
  }

  // Evaluate size expressions (s:x, v:variable, numeric values)
  // Returns sizes in MILLIMETERS (no conversion)
  evaluateSize(sizeObj, parentSection) {
    const result = { x: 0, y: 0, z: 0 };

    this._dbg('📏 evaluateSize: начало вычисления размеров', {
      sizeObj: sizeObj,
      hasParentSection: !!parentSection,
      parentSectionName: parentSection?.name
    });

    ['x', 'y', 'z'].forEach(axis => {
      const value = sizeObj[axis];
      if (value === undefined) {
        result[axis] = parentSection && parentSection.size ? parentSection.size[axis] : 0;
        this._dbg(`  📏 ${axis}: undefined, используем parentSection.size[${axis}] = ${result[axis]}мм`);
      } else if (typeof value === 'number') {
        result[axis] = value; // Keep in millimeters
        this._dbg(`  📏 ${axis}: число ${value}мм`);
      } else if (typeof value === 'string') {
        const evaluated = this.evaluateExpression(value, parentSection); // Returns value in mm
        result[axis] = evaluated; // Keep in millimeters
        this._dbg(`  📏 ${axis}: выражение "${value}" = ${evaluated}мм`);
        
        // Логируем если результат нулевой
        if (result[axis] < 1 && value !== '0' && !value.startsWith('0')) {
          const dbgParent = parentSection
            ? `${parentSection.name || parentSection.id || '?'} size=${JSON.stringify(parentSection.size || null)}`
            : 'нет parentSection';
          console.error(`  ❌❌❌ evaluateSize: размер ${axis} = 0 для выражения "${value}" | секция: ${dbgParent} ❌❌❌`, {
            expression: value,
            evaluated: evaluated,
            result: result[axis],
            parentSection: parentSection ? {
              hasSize: !!parentSection.size,
              size: parentSection.size
            } : 'нет parentSection',
            rootSectionContext: this.rootSectionContext ? {
              hasSize: !!this.rootSectionContext.size,
              size: this.rootSectionContext.size
            } : 'нет rootSectionContext'
          });
        }
      } else {
        result[axis] = 0;
        console.warn(`  ⚠️ ${axis}: неизвестный тип значения:`, typeof value, value);
      }
    });

    this._dbg('📏📏📏 evaluateSize: РЕЗУЛЬТАТ (в мм) 📏📏📏', {
      resultInMm: result
    });
    
    // КРИТИЧЕСКАЯ ПРОВЕРКА: если это вертикальная деталь (x = толщина, y и z = размеры секции)
    if (sizeObj.x === 'g:g0.thickness' && sizeObj.y === 's:y' && sizeObj.z === 's:z') {
      this._dbg('🔴🔴🔴 ВЕРТИКАЛЬНАЯ ДЕТАЛЬ - ПРОВЕРКА РАЗМЕРОВ 🔴🔴🔴');
      this._dbg('  X (ширина, должна быть толщина):', result.x, 'мм (ожидается ~16мм)');
      this._dbg('  Y (высота, должна быть s:y):', result.y, 'мм (ожидается ~2400мм)');
      this._dbg('  Z (глубина, должна быть s:z):', result.z, 'мм (ожидается ~600мм)');
      this._dbg('  rootSectionContext.size (в мм):', this.rootSectionContext?.size);
    }

    return result;
  }

  // Evaluate position expressions
  // Returns positions in MILLIMETERS (no conversion)
  evaluatePosition(posObj, parentSection, size) {
    const result = { x: 0, y: 0, z: 0 };

    ['x', 'y', 'z'].forEach(axis => {
      const value = posObj[axis];
      if (value === undefined) {
        result[axis] = 0;
      } else if (typeof value === 'number') {
        result[axis] = value; // Keep in millimeters
      } else if (typeof value === 'string') {
        const evaluated = this.evaluateExpression(value, parentSection, size); // Returns value in mm
        result[axis] = evaluated; // Keep in millimeters
      }
    });

    return result;
  }

  // Evaluate pivot (-1 = min, 0 = center, 1 = max)
  evaluatePivot(pivotObj, size) {
    const result = { x: 0, y: 0, z: 0 };

    ['x', 'y', 'z'].forEach(axis => {
      const value = pivotObj[axis];
      if (value === -1) {
        result[axis] = -size[axis] / 2; // Back/left/bottom
      } else if (value === 1) {
        result[axis] = size[axis] / 2; // Front/right/top
      } else {
        result[axis] = 0; // Center
      }
    });

    return result;
  }

  _facadePanelDbgEnabled() {
    if (typeof window === 'undefined') return false;
    return window.__CLD_DEBUG_FACADE_PANEL === true || window.DEBUG_HINGE_ROOM === true;
  }

  /** Диагностика полотна: local/world bbox core-меша (фильтр [CLD][FACADE-PANEL]). */
  _logFacadePanelPlacement(tag, facadeGroup) {
    if (!this._facadePanelDbgEnabled() || !facadeGroup || typeof THREE === 'undefined') return;
    let core = null;
    facadeGroup.traverse((o) => {
      if (core || !o?.isMesh || !o.userData?.isFacade) return;
      if (String(o.name || '').includes('_core') || o.userData.step5DecorChannel === 'outside') {
        core = o;
      }
    });
    if (!core) return;
    facadeGroup.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(core);
    if (box.isEmpty()) return;
    const c = box.getCenter(new THREE.Vector3());
    let mod = facadeGroup;
    for (let i = 0; i < 8 && mod; i++) {
      if (String(mod.name || '').startsWith('Module_')) break;
      mod = mod.parent;
    }
    if (mod && !String(mod.name || '').startsWith('Module_')) mod = null;
    let modBox = null;
    if (mod) {
      mod.updateMatrixWorld(true);
      const mb = new THREE.Box3().setFromObject(mod);
      if (!mb.isEmpty()) {
        modBox = { minX: mb.min.x, maxX: mb.max.x, minZ: mb.min.z, maxZ: mb.max.z };
      }
    }
    try {
      console.warn('[CLD][FACADE-PANEL]', tag, {
        facadeGroup: facadeGroup.name,
        thinBlb: facadeGroup.userData._cldBlbContentOffset || null,
        groupPos: {
          x: facadeGroup.position.x,
          y: facadeGroup.position.y,
          z: facadeGroup.position.z,
        },
        swingPos: facadeGroup.getObjectByName('__door_swing')?.position || null,
        panelWorld: {
          minX: box.min.x,
          maxX: box.max.x,
          minY: box.min.y,
          maxY: box.max.y,
          minZ: box.min.z,
          maxZ: box.max.z,
          centerX: c.x,
        },
        moduleWorld: modBox,
        expect:
          'minX ~ module.minX (left), maxZ ~ module.maxZ (front shell)',
      });
    } catch (_) {}
  }

  /** Смещение core-меша в facadeGroup (BLB в тонкой оболочке) — для оси __door_swing. */
  _resolveFacadeContentOffsetMm(facadeGroup) {
    const stored = facadeGroup?.userData?._cldBlbContentOffset;
    if (stored && Number.isFinite(Number(stored.x))) {
      return {
        x: Number(stored.x) || 0,
        y: Number(stored.y) || 0,
        z: Number(stored.z) || 0,
      };
    }
    let cx = 0;
    let cy = 0;
    let cz = 0;
    if (facadeGroup && Array.isArray(facadeGroup.children)) {
      const core = facadeGroup.children.find(
        (c) => c && c.isMesh && c.userData && c.userData.isFacade
      );
      if (core) {
        cx = Number(core.position.x) || 0;
        cy = Number(core.position.y) || 0;
        cz = Number(core.position.z) || 0;
      }
    }
    return { x: cx, y: cy, z: cz };
  }

  // Evaluate expression string (s:x, v:variable, g:group.property, math operations)
  // Returns value in MILLIMETERS (как в референсе Clodis)
  evaluateExpression(expr, parentSection, size = null, depth = 0) {
    if (typeof expr !== 'string') return 0;
    if (depth > 40) {
      try {
        console.warn('[CLD][expr] depth limit', { expr, depth });
      } catch (_) {}
      return 0;
    }

    // Strip Clodis-style prefixes: "size.x = s:x - 3" → "s:x - 3", "pos.y = 25" → "25"
    expr = expr.replace(/^(?:size|pos|pivot|rot)\.[xyz]\s*=\s*/i, '');
    // Админка: "z = s:z" → assignment eval → s:z. В комнате без strip → parseFloat → 0.
    expr = expr.replace(/^[xyz]\s*=\s*/i, '');
    expr = String(expr).trim();
    if (!expr) return 0;
    if (/^[+\-*/]$/.test(expr)) return 0;

    const __origExpr = expr;
    const exprDepth = depth + 1;

    // Каталог петли: pos.z = " - 18 / 2". После split(/([+-])/) и filter(Boolean) первый токен "-"
    // → бесконечная рекурсия parseTerm/evaluateExpression.
    if (/^[+-]\s*(?=[\d.(]|g:|s:|v:|@|\$)/.test(expr)) {
      expr = '0 ' + expr;
    }

    // ✅ Поддержка старого синтаксиса Clodis: "@section.width / @section.height / @section.depth"
    // Такие выражения приходят из JSON вкладки конструктора, но ClodisBuilder по умолчанию понимает только s:x/s:y/s:z.
    // Преобразуем их в эквивалентный новый формат, чтобы дальше сработал общий код обработки s:*
    // ВАЖНО: выражения часто приходят в составе математики (например "@section.height / 2"),
    // поэтому заменяем ВХОЖДЕНИЯ, а не только полное совпадение строки.
    // Порядок важен: сначала самые длинные токены (@section.deptl содержит префикс @section.dept)
    expr = String(expr)
      .replace(/@section\.width/g, 's:x')
      .replace(/@section\.height/g, 's:y')
      .replace(/@section\.depth/g, 's:z')
      .replace(/@section\.deptl/g, 's:z') // опечатка: deptl
      // dept без h — иначе z→0 и фасад у задней стенки
      .replace(/@section\.dept/g, 's:z');

    // Алиасы как в constructor-clodis.normalizeExpressionSyntax (до tokenize / parseFloat).
    expr = expr
      .replace(/\$size\s*\.\s*x\b/gi, 's:x')
      .replace(/\$size\s*\.\s*y\b/gi, 's:y')
      .replace(/\$size\s*\.\s*z\b/gi, 's:z')
      .replace(/\$wall\s*\.\s*thickness\b/gi, 'v:_wt')
      .replace(/\$back\s*\.\s*offset\b/gi, 'v:_bwo')
      .replace(/\$front\s*\.\s*offset\b/gi, 'v:_tfo')
      .replace(/#material\.group(\d+)\.([A-Za-z0-9_.]+)\b/g, (_m, g, rest) => `g:g${g}.${rest}`);

    if (window.__CLD_DEBUG_EXPR && __origExpr !== expr) {
      this._exprDbg('[CLD][expr] normalize', {
        from: __origExpr,
        to: expr,
        rootSectionSize: this.rootSectionContext?.size || null,
        parentSection: parentSection?.name || null,
      });
    }

    // Поддержка круглых скобок: рекурсивно вычисляем самые внутренние "(…)"
    // и подставляем результат обратно в строку. Без этого выражения из админки
    // конструктора, типа "(v:h_bottom) + (1950)", парсятся как 0 + 0 = 0 →
    // антресоль и другие модули с такими позициями падают на пол комнаты.
    if (expr.indexOf('(') !== -1) {
      const parenRe = /\(([^()]*)\)/;
      let safety = 64;
      while (parenRe.test(expr) && safety-- > 0) {
        expr = expr.replace(parenRe, (_m, inner) => {
          const v = this.evaluateExpression(
            String(inner).trim(),
            parentSection,
            size,
            exprDepth
          );
          const num = Number(v);
          if (!Number.isFinite(num)) return '0';
          // Отрицательное число оборачиваем дополнительными пробелами вокруг знака,
          // чтобы split по +/- корректно интерпретировал его как оператор и операнд.
          return num < 0 ? `0 - ${Math.abs(num)}` : String(num);
        });
      }
      if (expr.indexOf('(') !== -1 || expr.indexOf(')') !== -1) {
        try {
          console.warn('[CLD][expr] unmatched paren, using 0', { from: __origExpr, expr });
        } catch (_) {}
        return 0;
      }
    }

    // Normalize section access: support both s:x and s.x
    // Semantics:
    // - if we have a parentSection, s:* refers to parentSection.size
    // - otherwise (root), s:* refers to rootSectionContext.size
    // ВАЖНО: Проверяем только если выражение НЕ содержит операторов (+, -, *, /).
    const hasOperators = /[+\-*/]/.test(expr);
    if ((expr.startsWith('s:') || expr.startsWith('s.')) && !hasOperators) {
      const axis = expr.substring(2).trim();

      const ctxSection = parentSection?.size ? parentSection : this.rootSectionContext;
      if (ctxSection && ctxSection.size && ctxSection.size[axis] !== undefined) {
        const value = ctxSection.size[axis]; // millimeters
        this._exprDbg(`  ✅ evaluateExpression: s:${axis} = ${value}мм`, {
          ctxSectionName: ctxSection.name || parentSection?.name || 'root',
          axis: axis
        });
        return value;
      }

      console.error(`  ❌ evaluateExpression: s:${axis} - нет контекста size!`, {
        expr,
        hasRootSectionContext: !!this.rootSectionContext,
        rootSectionContextSize: this.rootSectionContext?.size,
        hasParentSection: !!parentSection,
        parentSectionName: parentSection?.name
      });
      return 0;
    }

    // Handle variable references (v:variable_name) — только целое выражение без математики
    const vOnly = expr.match(/^v:([A-Za-z0-9_]+)$/);
    if (vOnly) {
      const varName = vOnly[1];
      if (this.variables[varName] !== undefined) {
        return this.variables[varName];
      }
      return 0;
    }

    // Handle group references (g:group.property) — только целое выражение (не "g:g0.thickness / 2")
    const gOnly = expr.match(/^g:([A-Za-z0-9_]+)\.([A-Za-z0-9_.]+)$/);
    if (gOnly) {
      const groupName = gOnly[1];
      const property = gOnly[2];
      if (this.groups[groupName] && this.groups[groupName][property] !== undefined) {
        const value = this.groups[groupName][property];
        this._exprDbg(`  ✅ evaluateExpression: g:${groupName}.${property} = ${value}мм`);
        return value;
      }
      console.warn(`⚠️ Группа "${groupName}" или свойство "${property}" не найдено, используем 0`, {
        availableGroups: Object.keys(this.groups),
        groups: this.groups
      });
      return 0;
    }

    // Handle math expressions with operator precedence
    // Parse expression respecting operator precedence: * / before + -
    // Use recursive parsing: first parse + -, then * / within each term
    
    const mulDivPattern = /([*/])/;
    const addSubPattern = /([+-])/;
    
    // Helper function to parse a term (handles * and /)
    const parseTerm = (termExpr) => {
      const t = String(termExpr || '').trim();
      if (!t) return 0;
      if (/^[+\-*/]$/.test(t)) return 0;
      if (/^[+-]\s*(?=[\d.(]|g:|s:|v:|@|\$)/.test(t)) {
        return this.evaluateExpression('0 ' + t, parentSection, size, exprDepth);
      }
      if (!mulDivPattern.test(t)) {
        return this.evaluateExpression(t, parentSection, size, exprDepth);
      }

      const tokens = t.split(/([*/])/).map((tok) => tok.trim()).filter((tok) => tok);
      if (!tokens.length) return 0;
      if (tokens.length === 1) {
        return this.evaluateExpression(tokens[0], parentSection, size, exprDepth);
      }
      let result = this.evaluateExpression(tokens[0], parentSection, size, exprDepth);
      
      for (let i = 1; i < tokens.length; i += 2) {
        const operator = tokens[i];
        const operand = tokens[i + 1];
        const value = this.evaluateExpression(operand, parentSection, size, exprDepth);
        
        if (operator === '*') {
          result *= value;
        } else if (operator === '/') {
          if (value === 0) {
            console.warn('⚠️ Деление на ноль в выражении:', termExpr);
            return 0;
          }
          result /= value;
        }
      }

      if (!Number.isFinite(result)) {
        console.warn('[CLD][expr] non-finite term result', {
          termExpr,
          result,
          tokens,
          rootSectionSize: this.rootSectionContext?.size || null,
          parentSection: parentSection?.name || null,
        });
        return 0;
      }
      
      return result;
    };
    
    // Check if expression contains + or - (lower precedence, split expression)
    if (addSubPattern.test(expr)) {
      // Split by + and -, but keep track of operators
      // This handles expressions like "s:x / 2 - g:g0.thickness / 2"
      const tokens = expr.split(/([+-])/).map(t => t.trim()).filter(t => t);
      let result = parseTerm(tokens[0]);
      
      for (let i = 1; i < tokens.length; i += 2) {
        const operator = tokens[i];
        const operand = tokens[i + 1];
        const value = parseTerm(operand);
        
        if (operator === '+') {
          result += value;
        } else if (operator === '-') {
          result -= value;
        }
      }

      if (!Number.isFinite(result)) {
        console.warn('[CLD][expr] non-finite add/sub result', {
          expr,
          result,
          tokens,
          rootSectionSize: this.rootSectionContext?.size || null,
          parentSection: parentSection?.name || null,
        });
        return 0;
      }
      
      return result;
    }
    
    // Handle multiplication and division only (no + or -)
    if (mulDivPattern.test(expr)) {
      const v = parseTerm(expr);
      if (!Number.isFinite(v)) {
        console.warn('[CLD][expr] non-finite mul/div result', {
          expr,
          result: v,
          rootSectionSize: this.rootSectionContext?.size || null,
          parentSection: parentSection?.name || null,
        });
        return 0;
      }
      return v;
    }

    // Try to parse as number
    const num = parseFloat(expr);
    if (!Number.isFinite(num)) {
      if (window.__CLD_DEBUG_EXPR) {
        console.warn('[CLD][expr] cannot parse number, returning 0', {
          expr,
          from: __origExpr,
          rootSectionSize: this.rootSectionContext?.size || null,
          parentSection: parentSection?.name || null,
        });
      }
      return 0;
    }
    return num;
  }

  // Get material thickness from material spec
  // Returns thickness in MILLIMETERS
  getMaterialThickness(material) {
    if (!material) return 16; // Default 16mm

    // Check if thickness is locked
    if (material.thickness_lock) {
      return material.thickness_lock; // Already in millimeters
    }

    // Get from group
    if (material.group && this.groups[material.group]) {
      return this.groups[material.group].thickness || 16; // Already in millimeters
    }

    return 16; // Default 16mm
  }

  /**
   * Толщина накладного фасада (мм): обычно 16 или 18 по материалу/спеке каталога.
   * Плоскость накладки совпадает с планками/декоративными накладками; цоколь визуально заглублён — задаётся отдельно (layout_role plinth), не здесь.
   */
  _resolveFacadeThicknessMm(item, evaluatedSize) {
    // 1) Явный размер фасада по Z в JSON (после вычисления выражений) имеет высший приоритет.
    const sizeZ = Number(evaluatedSize && evaluatedSize.z);
    if (Number.isFinite(sizeZ) && sizeZ > 0) {
      return THREE.MathUtils.clamp(sizeZ, 8, 28);
    }

    const spec = item && item.spec ? item.spec : null;
    const raw =
      (spec && (spec.thickness_mm ?? spec.facade_thickness_mm ?? spec.thickness)) ??
      (item && item.thickness_mm) ??
      (item && item.thickness);
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) {
      return THREE.MathUtils.clamp(n, 8, 28);
    }
    if (spec && spec.material) {
      const t = this.getMaterialThickness(spec.material);
      if (Number.isFinite(t) && t > 0) {
        return THREE.MathUtils.clamp(t, 8, 28);
      }
    }
    return 16;
  }

  // Apply transform (position, pivot, rotation)
  applyTransform(object, position, pivot, rotation) {
    object.position.set(position.x - pivot.x, position.y - pivot.y, position.z - pivot.z);

    // Apply rotation
    if (rotation.x) object.rotation.x = this.parseRotation(rotation.x);
    if (rotation.y) object.rotation.y = this.parseRotation(rotation.y);
    if (rotation.z) object.rotation.z = this.parseRotation(rotation.z);
  }

  // Parse rotation (degrees to radians, or string expressions)
  parseRotation(rot) {
    if (typeof rot === 'number') {
      return THREE.MathUtils.degToRad(rot);
    }
    if (typeof rot === 'string') {
      const num = parseFloat(rot);
      return isNaN(num) ? 0 : THREE.MathUtils.degToRad(num);
    }
    return 0;
  }
}

ClodisBuilder._doorSwingGroups = [];
ClodisBuilder._slideGroups = [];
/** Комната: распашные фасады — только 0° (закрыто) или 85° (открыто), не 90° из каталога. */
ClodisBuilder.ROOM_SWING_DOOR_OPEN_DEG = 85;
/** Устарело: произвольный +Z корпуса (не реф). Оставлено 0 — см. _applyRoomCatalogHingeZDepthOffsets. */
ClodisBuilder.ROOM_HINGE_CORPUS_Z_OUTWARD_MM = 0;
/** Устарело: произвольный −Z фасада (не реф). Оставлено 0. */
ClodisBuilder.ROOM_HINGE_FACADE_Z_INTO_CABINET_MM = 0;

ClodisBuilder.roomSwingDoorOpenTarget = function roomSwingDoorOpenTarget(sw) {
  if (!sw) return 0;
  if (sw.roomSideSwing === true || sw.axis === 'y') {
    const sign =
      Math.sign(Number(sw.maxAngle)) ||
      Math.sign(Number(sw.roomOpenAngleRad)) ||
      Math.sign(Number(sw.targetAngle)) ||
      1;
    if (typeof THREE !== 'undefined') {
      return THREE.MathUtils.degToRad(ClodisBuilder.ROOM_SWING_DOOR_OPEN_DEG) * sign;
    }
  }
  return Number.isFinite(sw.maxAngle) ? sw.maxAngle : 0;
};

/** Снять устаревшие 90° из каталога — только 0° или ROOM_SWING_DOOR_OPEN_DEG. */
ClodisBuilder.normalizeRoomSideSwingAngles = function normalizeRoomSideSwingAngles(sw) {
  if (!sw || typeof THREE === 'undefined') return;
  const roomSwing = sw.roomSideSwing === true || sw.axis === 'y';
  if (!roomSwing) return;
  const openRad = ClodisBuilder.roomSwingDoorOpenTarget(sw);
  const near90 = (a) =>
    Number.isFinite(a) && Math.abs(Math.abs(a) - Math.PI / 2) < 0.03;
  if (near90(sw.maxAngle)) sw.maxAngle = openRad;
  if (near90(sw.roomOpenAngleRad)) sw.roomOpenAngleRad = openRad;
  if (sw.isOpen) {
    if (near90(sw.targetAngle) || Math.abs(sw.targetAngle) > Math.abs(openRad) + 0.02) {
      sw.targetAngle = openRad;
    }
    if (near90(sw.currentAngle) || Math.abs(sw.currentAngle) > Math.abs(openRad) + 0.02) {
      sw.currentAngle = openRad;
    }
  }
  if (sw.isOpen) {
    sw.maxAngle = openRad;
    sw.roomOpenAngleRad = openRad;
    sw.roomSideSwing = true;
  }
};

/** Целевой угол комнаты: строго закрыто (0) или открыто (85°). */
ClodisBuilder.applyRoomDoorSwingToggleTarget = function applyRoomDoorSwingToggleTarget(sw, open) {
  if (!sw) return;
  const roomSwing = sw.roomSideSwing === true || sw.axis === 'y';
  const ang = open && roomSwing ? ClodisBuilder.roomSwingDoorOpenTarget(sw) : open ? (Number(sw.maxAngle) || 0) : 0;
  sw.isOpen = !!open;
  sw.targetAngle = ang;
  if (roomSwing) {
    if (open) {
      sw.maxAngle = ang;
      sw.roomOpenAngleRad = ang;
      sw.roomSideSwing = true;
    }
  }
};

/** Есть ли на сцене открытые фасады/ящики, участвующие в массовом toggle. */
ClodisBuilder._sceneDoorsAreOpen = function _sceneDoorsAreOpen() {
  const list = ClodisBuilder._doorSwingGroups || [];
  const anySwingOpen = list.some(
    (g) =>
      g?.parent &&
      g.userData?.cldDoorSwing &&
      g.userData.cldDoorSwing.syncBulkOpen !== false &&
      g.userData.cldDoorSwing.isOpen === true
  );
  if (anySwingOpen) return true;
  const slides = ClodisBuilder._slideGroups || [];
  return slides.some(
    (s) =>
      s?.parent &&
      s.userData?.cldSlide &&
      s.userData.cldSlide.syncBulkOpen !== false &&
      s.userData.cldSlide.isOpen === true
  );
};

/** Синхронизировать кнопку «открыть/закрыть фасады» с фактическим состоянием дверей. */
ClodisBuilder.syncDoorToggleButtonFromScene = function syncDoorToggleButtonFromScene() {
  const open = ClodisBuilder._sceneDoorsAreOpen();
  if (typeof window !== 'undefined' && typeof window.__clodisSyncDoorToggleBtn === 'function') {
    window.__clodisSyncDoorToggleBtn(open);
  }
  return open;
};

ClodisBuilder.clearDoorSwingRegistry = function clearDoorSwingRegistry() {
  ClodisBuilder._doorSwingGroups.length = 0;
  ClodisBuilder._slideGroups.length = 0;
};

ClodisBuilder._registerSlideGroup = function _registerSlideGroup(g) {
  if (g && ClodisBuilder._slideGroups.indexOf(g) === -1) {
    ClodisBuilder._slideGroups.push(g);
  }
};

ClodisBuilder._applySlideOwnPosition = function _applySlideOwnPosition(own, sl) {
  if (!own || !sl) return;
  const off = (Number(sl.currentOffsetMm) || 0) * (sl.sign ?? 1);
  const b = sl.base || { x: 0, y: 0, z: 0 };
  own.position.x = b.x + (sl.axis === 'x' ? off : 0);
  own.position.y = b.y + (sl.axis === 'y' ? off : 0);
  own.position.z = b.z + (sl.axis === 'z' ? off : 0);
};

/** После build / расстановки: планки на секцию, fixed-части slide — с превью (attach с сохранением world). */
ClodisBuilder.finalizeDrawerFixedPartsReparent = function finalizeDrawerFixedPartsReparent(rootGroup) {
  if (!rootGroup || typeof ClodisBuilder !== 'function') return;
  try {
    const builder = new ClodisBuilder();
    builder._finalizeDrawerFixedPartsReparent(rootGroup);
  } catch (e) {
    console.warn('[CLD][drawer-mount] finalizeDrawerFixedPartsReparent failed', e);
  }
};

/** Снять с реестра анимации дверей у одного модуля (пересборка / удаление). */
ClodisBuilder.unregisterDoorSwingGroupsFromRoot = function unregisterDoorSwingGroupsFromRoot(root) {
  if (!root || !Array.isArray(ClodisBuilder._doorSwingGroups)) return;
  const list = ClodisBuilder._doorSwingGroups;
  const drop = new Set();
  root.traverse((o) => {
    if (!o) return;
    if (o.name === '__door_swing' || (o.userData && o.userData.cldDoorSwing)) {
      drop.add(o);
    }
  });
  if (!drop.size) return;
  for (let i = list.length - 1; i >= 0; i--) {
    if (drop.has(list[i])) list.splice(i, 1);
  }
};

ClodisBuilder._registerDoorSwingGroup = function _registerDoorSwingGroup(g) {
  if (g && ClodisBuilder._doorSwingGroups.indexOf(g) === -1) {
    ClodisBuilder._doorSwingGroups.push(g);
  }
};

ClodisBuilder._unregisterDoorSwingGroup = function _unregisterDoorSwingGroup(g) {
  if (!g || !Array.isArray(ClodisBuilder._doorSwingGroups)) return;
  const list = ClodisBuilder._doorSwingGroups;
  const idx = list.indexOf(g);
  if (idx >= 0) list.splice(idx, 1);
};

ClodisBuilder._getDoorDomainGroups = function _getDoorDomainGroups(domainId) {
  const id = String(domainId || '').trim();
  const list = ClodisBuilder._doorSwingGroups || [];
  if (!id) return [];
  return list.filter((g) => {
    if (!g || !g.parent) return false;
    const sw = g.userData && g.userData.cldDoorSwing;
    return !!sw && String(sw.doorDomainId || '').trim() === id;
  });
};

ClodisBuilder._hingeAnimatorUnderFacadeDoorSwing = function _hingeAnimatorUnderFacadeDoorSwing(animRoot) {
  if (!animRoot) return false;
  let p = animRoot.parent;
  for (let i = 0; i < 48 && p; i++) {
    if (p.name === '__door_swing') {
      const dsw = p.userData && p.userData.cldDoorSwing;
      return !!(dsw && dsw.isFacadeMaster === true);
    }
    p = p.parent;
  }
  return false;
};

/** Reparented hinge_animator: собственная ось 0°, крутится только с дверным __door_swing. */
ClodisBuilder._stabilizeReparentedHingeSwings = function _stabilizeReparentedHingeSwings() {
  const list = ClodisBuilder._doorSwingGroups || [];
  for (let i = 0; i < list.length; i++) {
    const g = list[i];
    if (!g?.parent) continue;
    const sw = g.userData?.cldDoorSwing;
    if (!sw?.isFacadeMaster) continue;
    g.traverse((o) => {
      if (String(o?.userData?.animatorId || '').toLowerCase() !== 'hinge_animator') return;
      if (!o.userData?._cldHingeReparentedToSwing) return;
      if (o.parent !== g) g.attach(o);
      const hsw = o.userData?.cldDoorSwing;
      if (hsw) {
        hsw.syncBulkOpen = false;
        hsw.isFacadeMaster = false;
        hsw.targetAngle = 0;
        hsw.currentAngle = 0;
        const ax = hsw.axis || 'y';
        o.rotation[ax] = 0;
      }
      o.traverse((c) => {
        if (!c || c === o || c.name !== '__door_swing') return;
        const nsw = c.userData?.cldDoorSwing;
        if (!nsw) return;
        nsw.syncBulkOpen = false;
        nsw.isFacadeMaster = false;
        nsw.targetAngle = 0;
        nsw.currentAngle = 0;
        const ax = nsw.axis || 'y';
        c.rotation[ax] = 0;
      });
    });
  }
};

/** Вызывать из цикла рендера комнаты (renderer.animate). */
ClodisBuilder.updateDoorSwingAnimations = function updateDoorSwingAnimations(dt) {
  const d = Number.isFinite(Number(dt)) && Number(dt) > 0 ? Number(dt) : 0.016;
  // Быстрее доезд (~0.3–0.4 с вместо ~0.7–1 с при rate 8).
  const k = Math.min(1, d * 15);
  const list = ClodisBuilder._doorSwingGroups || [];
  const domainMasterMap = new Map();
  let anyMoving = false;
  for (let i = list.length - 1; i >= 0; i--) {
    const g = list[i];
    if (!g || !g.parent) continue;
    const sw = g.userData && g.userData.cldDoorSwing;
    if (!sw) continue;
    const domainId = String(sw.doorDomainId || '').trim();
    if (!domainId || sw.isFacadeMaster !== true) continue;
    domainMasterMap.set(domainId, sw);
  }
  for (let i = list.length - 1; i >= 0; i--) {
    const g = list[i];
    if (!g || !g.parent) {
      list.splice(i, 1);
      continue;
    }
    const sw = g.userData && g.userData.cldDoorSwing;
    if (!sw) continue;
    if (sw.isFacadeMaster === true) {
      ClodisBuilder.normalizeRoomSideSwingAngles(sw);
    }
    if (
      sw.isHingeCatalogSwing &&
      g.userData?._cldHingeReparentedToSwing &&
      ClodisBuilder._hingeAnimatorUnderFacadeDoorSwing(g)
    ) {
      continue;
    }
    if (sw.isFacadeMaster !== true) {
      const domainId = String(sw.doorDomainId || '').trim();
      if (domainId && sw.syncBulkOpen !== false) {
        const master = domainMasterMap.get(domainId);
        if (master) {
          sw.isOpen = !!master.isOpen;
          sw.targetAngle = master.targetAngle;
        }
      }
    }
    const tgt = sw.targetAngle != null ? sw.targetAngle : 0;
    let cur = sw.currentAngle != null ? sw.currentAngle : 0;
    const da = tgt - cur;
    if (Math.abs(da) < 0.002) {
      cur = tgt;
    } else {
      cur += da * k;
      anyMoving = true;
    }
    sw.currentAngle = cur;
    if (sw.axis === 'y') g.rotation.y = cur;
    else if (sw.axis === 'x') g.rotation.x = cur;
  }
  // Stabilize петель — только пока двери едут (не каждый idle-кадр).
  if (anyMoving) {
    ClodisBuilder._stabilizeReparentedHingeSwings();
  }
  const slides = ClodisBuilder._slideGroups || [];
  for (let i = slides.length - 1; i >= 0; i--) {
    const own = slides[i];
    if (!own || !own.parent) {
      slides.splice(i, 1);
      continue;
    }
    const sl = own.userData?.cldSlide;
    if (!sl) continue;
    if (sl.slideMaster) {
      const m = sl.slideMaster.userData?.cldSlide;
      if (m) {
        sl.isOpen = !!m.isOpen;
        const ratio = m.travelMm > 0 ? m.currentOffsetMm / m.travelMm : 0;
        sl.currentOffsetMm = sl.travelMm * ratio;
        ClodisBuilder._applySlideOwnPosition(own, sl);
      }
      continue;
    }
    const tgt = sl.targetOffsetMm != null ? sl.targetOffsetMm : 0;
    let cur = sl.currentOffsetMm != null ? sl.currentOffsetMm : 0;
    const da = tgt - cur;
    if (Math.abs(da) < 0.05) {
      cur = tgt;
    } else {
      cur += da * k;
    }
    sl.currentOffsetMm = cur;
    ClodisBuilder._applySlideOwnPosition(own, sl);
  }
};

/** TAA motion gate: любая дверь/ящик ещё доезжает до targetAngle/targetOffset. */
ClodisBuilder.isDoorAnimationActive = function isDoorAnimationActive() {
  const DOOR_EPS = 0.002;
  const SLIDE_EPS = 0.05;
  for (const g of ClodisBuilder._doorSwingGroups || []) {
    if (!g?.parent) continue;
    const sw = g.userData?.cldDoorSwing;
    if (!sw) continue;
    const tgt = sw.targetAngle != null ? sw.targetAngle : 0;
    const cur = sw.currentAngle != null ? sw.currentAngle : 0;
    if (Math.abs(tgt - cur) > DOOR_EPS) return true;
  }
  for (const own of ClodisBuilder._slideGroups || []) {
    if (!own?.parent) continue;
    const sl = own.userData?.cldSlide;
    if (!sl) continue;
    const tgt = sl.targetOffsetMm != null ? sl.targetOffsetMm : 0;
    const cur = sl.currentOffsetMm != null ? sl.currentOffsetMm : 0;
    if (Math.abs(tgt - cur) > SLIDE_EPS) return true;
  }
  return false;
};

/**
 * Открыть/закрыть все двери на сцене (все зарегистрированные __door_swing).
 * @param {boolean|undefined} openMaybe — true/false или toggle при undefined.
 * @param {{instant?: boolean}} [opts] — instant: без анимации (пересборка модулей:
 *        двери должны сразу остаться в текущем состоянии шага, а не доезжать).
 * @returns {boolean} целевое состояние (true = открыто).
 */
ClodisBuilder.toggleAllDoors = function toggleAllDoors(openMaybe, opts = {}) {
  const list = ClodisBuilder._doorSwingGroups || [];
  const instant = opts && opts.instant === true;
  const root = opts && opts.root ? opts.root : null;
  let nextOpen;
  if (openMaybe === true) nextOpen = true;
  else if (openMaybe === false) nextOpen = false;
  else nextOpen = !ClodisBuilder._sceneDoorsAreOpen();
  for (const g of list) {
    if (!g?.parent) continue;
    if (root && !ClodisBuilder._isObjectUnderRoot(g, root)) continue;
    const sw = g.userData?.cldDoorSwing;
    if (!sw || sw.syncBulkOpen === false) continue;
    ClodisBuilder.applyRoomDoorSwingToggleTarget(sw, nextOpen);
    if (instant) {
      sw.currentAngle = Number(sw.targetAngle) || 0;
      if (sw.axis === 'y') g.rotation.y = sw.currentAngle;
      else if (sw.axis === 'x') g.rotation.x = sw.currentAngle;
      else if (sw.axis === 'z') g.rotation.z = sw.currentAngle;
    }
  }
  const slides = ClodisBuilder._slideGroups || [];
  for (const own of slides) {
    if (!own?.parent) continue;
    if (root && !ClodisBuilder._isObjectUnderRoot(own, root)) continue;
    const sl = own.userData?.cldSlide;
    if (!sl || sl.syncBulkOpen === false || sl.slideMaster) continue;
    sl.isOpen = nextOpen;
    sl.targetOffsetMm = nextOpen ? sl.travelMm : 0;
    if (instant) {
      sl.currentOffsetMm = Number(sl.targetOffsetMm) || 0;
      ClodisBuilder._applySlideOwnPosition(own, sl);
    }
  }
  if (typeof ClodisBuilder.syncDoorToggleButtonFromScene === 'function') {
    ClodisBuilder.syncDoorToggleButtonFromScene();
  }
  try {
    if (typeof window.invalidateAllFurnitureIconAnchors === 'function') {
      window.invalidateAllFurnitureIconAnchors();
    }
  } catch (_) {}
  return nextOpen;
};

/** true, если obj — потомок root (или сам root). */
ClodisBuilder._isObjectUnderRoot = function _isObjectUnderRoot(obj, root) {
  if (!obj || !root) return false;
  let p = obj;
  for (let i = 0; i < 48 && p; i++) {
    if (p === root) return true;
    p = p.parent;
  }
  return false;
};

/** Клик по фасаду с петлёй: переключить открытие. */
ClodisBuilder.raycastToggleDoor = function raycastToggleDoor(raycaster, root) {
  if (!raycaster || !root) return false;
  const picks = [];
  root.traverse((o) => {
    if (o.isMesh && o.userData && (o.userData.cldDoorPick || o.userData.cldDrawerPick)) picks.push(o);
  });
  if (!picks.length) return false;
  const hits = raycaster.intersectObjects(picks, false);
  if (!hits.length) return false;
  let n = hits[0].object;
  while (n) {
    if (n.userData && n.userData.cldSlide) {
      const sl = n.userData.cldSlide;
      if (sl.slideMaster) {
        n = n.parent;
        continue;
      }
      const nextOpen = !sl.isOpen;
      sl.isOpen = nextOpen;
      sl.targetOffsetMm = nextOpen ? sl.travelMm : 0;
      return true;
    }
    if (n.userData && n.userData.cldDoorSwing) {
      const sw = n.userData.cldDoorSwing;
      const domainId = String(sw.doorDomainId || '').trim();
      const groups = ClodisBuilder._getDoorDomainGroups(domainId);
      const masterGroup =
        groups.find((g) => g?.userData?.cldDoorSwing?.isFacadeMaster === true) || n;
      const masterSw = masterGroup && masterGroup.userData && masterGroup.userData.cldDoorSwing
        ? masterGroup.userData.cldDoorSwing
        : sw;
      const nextOpen = !masterSw.isOpen;

      if (groups.length) {
        groups.forEach((g) => {
          const gs = g && g.userData && g.userData.cldDoorSwing;
          if (!gs) return;
          ClodisBuilder.applyRoomDoorSwingToggleTarget(gs, nextOpen);
        });
      } else {
        ClodisBuilder.applyRoomDoorSwingToggleTarget(masterSw, nextOpen);
      }
      if (typeof ClodisBuilder.syncDoorToggleButtonFromScene === 'function') {
        ClodisBuilder.syncDoorToggleButtonFromScene();
      }
      return true;
    }
    n = n.parent;
  }
  return false;
};

/** Показать/скрыть кубы отладки петель (__hinge_debug_vols*) на сцене комнаты. */
ClodisBuilder.syncHingeDebugVolumesVisibility = function syncHingeDebugVolumesVisibility(scene) {
  if (!scene || typeof scene.traverse !== 'function') return;
  const on = typeof window !== 'undefined' && window.DEBUG_HINGE_SECTION_VOL === true;
  scene.traverse((o) => {
    if (!o) return;
    if (o.name === '__hinge_debug_vols' || o.name === '__hinge_debug_vols_door') {
      o.visible = on;
    }
    if (o.userData && o.userData.isHingeDebugVolume) {
      o.visible = on;
    }
  });
};

/** Снять маркеры L-пивота со сцены (сферы выкл). */
ClodisBuilder.syncLSeamPivotDebugVisibility = function syncLSeamPivotDebugVisibility(scene) {
  if (!scene || typeof scene.traverse !== 'function') return;
  const doomed = [];
  scene.traverse((o) => {
    if (o?.userData?.isLSeamPivotDebug || o?.name === '__l_seam_pivot_dbg') doomed.push(o);
  });
  for (const o of doomed) {
    o.parent?.remove(o);
    o.traverse((c) => {
      c.geometry?.dispose?.();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose?.());
        else c.material.dispose?.();
      }
    });
  }
};

/** Только strip L-маркеров — сферы не пересоздаём. */
ClodisBuilder.refreshLSeamPivotDebugInScene = function refreshLSeamPivotDebugInScene(scene) {
  ClodisBuilder.syncLSeamPivotDebugVisibility(scene);
};

/**
 * Диагностика двери в комнате: swing, inset, размеры полотна vs оболочки, зазор до корпуса.
 * В консоли: ClodisBuilder.enableFacadeDoorDebug(); ClodisBuilder.logFacadeDoorDiagnostics();
 * @param {THREE.Object3D} [root] — furniture group или scene (по умолчанию state.furniture / __cldRoomScene)
 */
ClodisBuilder._resolveFurnitureDiagRoot = function _resolveFurnitureDiagRoot(explicitRoot) {
  if (explicitRoot && typeof explicitRoot.traverse === 'function') {
    return { root: explicitRoot, source: 'argument' };
  }
  const appState = typeof window !== 'undefined' ? window.__cldAppState : null;
  const fg = appState?.furniture?.group;
  if (fg && typeof fg.traverse === 'function') {
    return { root: fg, source: '__cldAppState.furniture.group' };
  }
  const roomScene = typeof window !== 'undefined' ? window.__cldRoomScene : null;
  if (roomScene && typeof roomScene.traverse === 'function') {
    const furn = [];
    roomScene.traverse((o) => {
      if (o?.userData?.isFurniture && o.isGroup) furn.push(o);
    });
    if (furn.length === 1) return { root: furn[0], source: 'scene.isFurniture' };
    if (furn.length > 1) return { root: furn[0], source: 'scene.isFurniture[0]' };
  }
  if (roomScene) return { root: roomScene, source: '__cldRoomScene (вся комната)' };
  return { root: null, source: 'none' };
};

ClodisBuilder.logFacadeDoorDiagnostics = function logFacadeDoorDiagnostics(root) {
  if (typeof window === 'undefined' || typeof THREE === 'undefined') {
    console.warn('[CLD][DOOR-DIAG] нет window/THREE');
    return null;
  }
  const resolved = ClodisBuilder._resolveFurnitureDiagRoot(root);
  const scene = resolved.root;
  if (!scene || typeof scene.traverse !== 'function') {
    console.warn(
      '[CLD][DOOR-DIAG] нет шкафа: поставьте модуль в комнату, затем:\n' +
        '  ClodisBuilder.logFacadeDoorDiagnostics()'
    );
    return null;
  }
  console.warn('[CLD][DOOR-DIAG] root:', resolved.source, scene.name || scene.type);

  const swings = [];
  const registeredSwings = [];
  const facades = [];
  const animators = [];
  const facadeModules = [];
  const corpusModules = [];

  scene.updateMatrixWorld(true);

  const regList = ClodisBuilder._doorSwingGroups || [];
  for (let ri = 0; ri < regList.length; ri++) {
    const g = regList[ri];
    if (!g) continue;
    const sw = g.userData?.cldDoorSwing;
    registeredSwings.push({
      idx: ri,
      inScene: !!(g.parent && g.parent.type),
      parentName: g.parent?.name || '(detached)',
      axis: sw?.axis,
      isFacadeMaster: !!sw?.isFacadeMaster,
      isOpen: !!sw?.isOpen,
    });
  }

  scene.traverse((o) => {
    if (!o) return;
    if (o.name === '__door_swing') {
      const sw = o.userData?.cldDoorSwing;
      if (!sw) {
        swings.push({ path: o.parent?.name, note: 'нет cldDoorSwing userData' });
        return;
      }
      const pxBase = o.userData.cldDoorPivotXBase;
      const pyBase = o.userData.cldDoorPivotYBase;
      const pzBase = o.userData.cldDoorPivotZBase;
      const posMm = {
        x: Math.round(o.position.x * 10) / 10,
        y: Math.round(o.position.y * 10) / 10,
        z: Math.round(o.position.z * 10) / 10,
      };
      const roomOff = o.userData._cldRoomDoorOffsetMm || null;
      swings.push({
        path: o.parent?.name || '?',
        axis: sw.axis,
        maxAngleDeg: THREE.MathUtils.radToDeg(Math.abs(sw.maxAngle || 0)),
        isOpen: !!sw.isOpen,
        currentAngleDeg: THREE.MathUtils.radToDeg(sw.currentAngle || 0),
        offsetMode: o.userData._cldRoomDoorOffsetMode || '',
        pivotBaseMm: {
          x: Math.round((Number(pxBase) || 0) * 10) / 10,
          y: Math.round((Number(pyBase) || 0) * 10) / 10,
          z: Math.round((Number(pzBase) || 0) * 10) / 10,
        },
        swingPosMm: posMm,
        pivotOffsetDeltaMm: {
          x: Math.round((posMm.x - (Number(pxBase) || 0)) * 10) / 10,
          y: Math.round((posMm.y - (Number(pyBase) || 0)) * 10) / 10,
          z: Math.round((posMm.z - (Number(pzBase) || 0)) * 10) / 10,
        },
        roomDoorOffset: roomOff,
        roomOffsetApplied: !!(roomOff && (roomOff.x || roomOff.y || roomOff.z)),
        roomOffsetSource: o.userData._cldRoomDoorOffsetSource || '',
        roomOffsetRole: o.userData._cldRoomDoorOffsetRole || '',
        isFacadeMaster: !!sw.isFacadeMaster,
        doorDomainId: sw.doorDomainId || '',
      });
    }
    if (o.userData?.isFacade && o.isGroup) {
      const box = new THREE.Box3().setFromObject(o);
      const sz = box.getSize(new THREE.Vector3());
      facades.push({
        name: o.name,
        originalSize: o.userData.originalSize || null,
        buildDiag: o.userData._cldDoorBuildDiag || null,
        hasSwingChild: !!o.getObjectByName('__door_swing'),
        worldBoxMm: box.isEmpty()
          ? null
          : {
              w: Math.round(sz.x),
              h: Math.round(sz.y),
              d: Math.round(sz.z),
              minZ: Math.round(box.min.z),
              maxZ: Math.round(box.max.z),
            },
        parentChain: (() => {
          const chain = [];
          let p = o.parent;
          for (let i = 0; i < 6 && p; i++) {
            chain.push(p.name || p.type);
            p = p.parent;
          }
          return chain.join(' ← ');
        })(),
      });
    }
    if (o.userData?.isAnimator) {
      animators.push({
        name: o.name,
        animatorId: o.userData.animatorId || '',
        hasFacadeChild: o.children?.some((c) => c?.userData?.isFacade),
        originalSize: o.userData.originalSize || null,
        position: {
          x: Math.round(o.position.x),
          y: Math.round(o.position.y),
          z: Math.round(o.position.z),
        },
      });
    }
    const lr = String(o.userData?.layoutRole || '');
    if (lr === 'facades' || lr === 'facades_main' || lr === 'facades_top') {
      const box = new THREE.Box3().setFromObject(o);
      facadeModules.push({
        name: o.name,
        layoutRole: lr,
        shellOriginalSize: o.userData.originalSize || null,
        shellWorldMm: box.isEmpty()
          ? null
          : {
              w: Math.round(box.getSize(new THREE.Vector3()).x),
              h: Math.round(box.getSize(new THREE.Vector3()).y),
              d: Math.round(box.getSize(new THREE.Vector3()).z),
            },
        swingInSubtree: !!o.getObjectByName('__door_swing'),
        facadeNodesInSubtree: (() => {
          let n = 0;
          o.traverse((c) => {
            if (c?.userData?.isFacade) n++;
          });
          return n;
        })(),
      });
    }
    if (lr === 'corpus' || lr === 'corpus_antresol') {
      const box = new THREE.Box3().setFromObject(o);
      if (!box.isEmpty()) {
        corpusModules.push({
          name: o.name,
          layoutRole: lr,
          frontZ: Math.round(box.max.z),
          sizeMm: {
            w: Math.round(box.getSize(new THREE.Vector3()).x),
            h: Math.round(box.getSize(new THREE.Vector3()).y),
            d: Math.round(box.getSize(new THREE.Vector3()).z),
          },
        });
      }
    }
  });

  const registeredSwingCount = regList.length;
  let gapMm = null;
  if (facadeModules.length && corpusModules.length) {
    const fac = facadeModules.find((m) => m.layoutRole === 'facades_main') || facadeModules[0];
    const cor = corpusModules.find((m) => m.layoutRole === 'corpus_antresol') || corpusModules[0];
    if (fac?.shellWorldMm && cor?.frontZ != null) {
      gapMm = fac.shellWorldMm.minZ - cor.frontZ;
    }
  }

  const swingsInScene = registeredSwings.filter((r) => r.inScene).length;
  const summary = {
    diagRoot: resolved.source,
    swingsInTree: swings.length,
    swingsRegistered: registeredSwingCount,
    swingsRegisteredInScene: swingsInScene,
    facadeGroups: facades.length,
    rotateAnimators: animators.length,
    facadeShellModules: facadeModules.length,
    corpusModules: corpusModules.length,
    facadeToCorpusGapMm: gapMm,
    roomDoorPivotOffsetMm: (() => {
      const fromSwing = swings.find((s) => s.roomDoorOffset);
      if (fromSwing?.roomDoorOffset) {
        return {
          ...fromSwing.roomDoorOffset,
          source: fromSwing.roomOffsetSource || '',
          layoutRole: fromSwing.roomOffsetRole || '',
        };
      }
      return { x: 0, y: 0, z: 0, source: 'none', layoutRole: '' };
    })(),
    verdict:
      registeredSwingCount > 0 && swings.length === 0
        ? 'Swing зарегистрирован, но не в этом root — вызовите logFacadeDoorDiagnostics() после постановки шкафа (см. diagRoot)'
        : swings.length === 0 && registeredSwingCount === 0
          ? 'НЕТ __door_swing — в catalog_28 комнаты нет rotate+facade в inner tree (петли отдельными modules)'
          : facades.length === 0 && facadeModules.length > 0
            ? 'Крутится оболочка facades_* без inner facade — ref-inset на полотно не попал'
            : !facades.some((f) => f.buildDiag?.refInsetApplied) &&
                !facades.some((f) => f.buildDiag?.authoredInset)
              ? 'Полотно на полный размер (нет inset) — при открытии может заходить в корпус'
              : 'Есть swing + facade; проверьте toggleAllDoors и gapMm',
  };

  console.warn('[CLD][DOOR-DIAG] ═══ сводка ═══', summary);
  if (swings.length) {
    const off = summary.roomDoorPivotOffsetMm || { x: 0, y: 0, z: 0 };
    swings.forEach((s, i) => {
      console.warn(
        `[CLD][DOOR-DIAG] swing[${i}] «${s.path}» mode=${s.offsetMode || '?'} ` +
          `base=${JSON.stringify(s.pivotBaseMm)} swing=${JSON.stringify(s.swingPosMm)} ` +
          `delta=${JSON.stringify(s.pivotOffsetDeltaMm)} offset=${JSON.stringify(s.roomDoorOffset || off)} ` +
          `applied=${s.roomOffsetApplied} source=${s.roomOffsetSource || '?'} role=${s.roomOffsetRole || '?'}`
      );
    });
  }
  if (registeredSwings.length) console.table(registeredSwings);
  if (swings.length) console.table(swings);
  if (facades.length) {
    console.table(
      facades.map((f) => ({
        name: f.name,
        originalSize: f.originalSize,
        refInset: f.buildDiag?.refInsetApplied,
        authoredInset: f.buildDiag?.authoredInset,
        posBefore: f.buildDiag?.posBeforeInset,
        posAfter: f.buildDiag?.appliedPos,
        sizeBefore: f.buildDiag?.sizeBeforeInset,
        sizeAfter: f.buildDiag?.appliedSize,
        hasSwing: f.hasSwingChild,
        world: f.worldBoxMm,
      }))
    );
  }
  if (facadeModules.length) console.table(facadeModules);
  if (animators.length) console.table(animators);
  if (corpusModules.length) console.table(corpusModules);

  return {
    summary,
    diagRoot: resolved.source,
    swings,
    registeredSwings,
    facades,
    facadeModules,
    animators,
    corpusModules,
  };
};

ClodisBuilder.enableFacadeDoorDebug = function enableFacadeDoorDebug() {
  if (typeof window === 'undefined') return false;
  window.DEBUG_FACADE_DOOR = true;
  window.DEBUG_FACADE_Z = true;
  console.warn(
    '[CLD][DOOR-DIAG] Включено. Поставьте шкаф или в консоли:\n' +
      '  ClodisBuilder.logFacadeDoorDiagnostics()\n' +
      '  ClodisBuilder.toggleAllDoors()'
  );
  return true;
};

/** Диагностика ручек в сцене + resolveSync. Вызов: ClodisBuilder.diagnoseHandles() */
ClodisBuilder.diagnoseHandles = function diagnoseHandles(root) {
  const rt = typeof window !== 'undefined' ? window.__cldHandleRuntime : null;
  const log = rt?.handleLog || ((step, data) => console.log('[CLD][HANDLE] ' + step, data ?? ''));
  const resolvedRoot = ClodisBuilder._resolveFurnitureDiagRoot
    ? ClodisBuilder._resolveFurnitureDiagRoot(root)
    : { root: root || null, source: 'arg' };
  const sceneRoot = resolvedRoot.root;
  const sel = rt?.readSelection?.() || null;
  const sync = rt?.resolveSync && sel?.seriesId ? rt.resolveSync(sel.seriesId, 'wardrobe') : null;
  let facadeCount = 0;
  let handleCount = 0;
  let drawerHandleCount = 0;
  const rows = [];
  if (sceneRoot) {
    sceneRoot.traverse((o) => {
      if (o?.name === '__cld_drawer_handle' || o?.userData?.isDrawerHandle) {
        drawerHandleCount += 1;
      }
      if (!o?.userData?.isFacade || !o.userData._cldFacadeBuildItem) return;
      facadeCount += 1;
      const swing = o.getObjectByName?.('__door_swing');
      const hg =
        o.getObjectByName?.('__cld_facade_handle') ||
        o.getObjectByName?.('__cld_drawer_handle') ||
        swing?.getObjectByName?.('__cld_facade_handle') ||
        swing?.getObjectByName?.('__cld_drawer_handle');
      if (hg) handleCount += 1;
      rows.push({
        name: o.name,
        size: o.userData?.originalSize || null,
        hasHandle: !!hg,
        hasSwing: !!swing,
      });
    });
  }
  const out = {
    sceneRoot: resolvedRoot.source,
    selection: sel,
    resolveSync: sync,
    facadeCount,
    handleCount,
    drawerHandleCount,
    facades: rows,
  };
  log('DIAGNOSE', out);
  if (rows.length) console.table(rows);
  return out;
};

if (typeof window !== 'undefined') {
  window.__cldCompareHandleHardwareScale = function () {
    const THREE = typeof window !== 'undefined' ? window.THREE : null;
    const scene =
      (typeof window !== 'undefined' && window.__cldAppState?.scene) ||
      (typeof window !== 'undefined' && window.__cldRoomScene) ||
      null;
    if (!scene || !THREE) return { error: 'no_scene' };
    const measure = (label, pred) => {
      let obj = null;
      scene.traverse((o) => {
        if (obj || !pred(o)) return;
        obj = o;
      });
      if (!obj) return { label, found: false };
      obj.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(obj);
      const s = box.getSize(new THREE.Vector3());
      return {
        label,
        found: true,
        name: obj.name,
        sizeMm: {
          x: Math.round(s.x * 10) / 10,
          y: Math.round(s.y * 10) / 10,
          z: Math.round(s.z * 10) / 10,
        },
      };
    };
    const out = {
      handle: measure('handle', (o) => o.name === '__cld_facade_handle' || o.userData?.isFacadeHandle),
      hinge: measure('hinge', (o) => String(o.userData?.modelSpecId || '') === '5' || o.userData?.cldHingeCatalogModel),
      support: measure('support', (o) => String(o.userData?.modelSpecId || '') === '2'),
    };
    console.log('[CLD][HANDLE] compare hardware mm', out);
    return out;
  };
  window.__cldRetryFacadeHandles = function () {
    const n = ClodisBuilder.retryFacadeHandlesInScene();
    try {
      const desiredOpen = window.__cldRoomDoorsDesiredOpen === true;
      if (typeof ClodisBuilder.toggleAllDoors === 'function' && Number(window.currentRoomStep) >= 4) {
        ClodisBuilder.toggleAllDoors(desiredOpen);
      }
    } catch (_) {}
    setTimeout(() => {
      try {
        const desiredOpen = window.__cldRoomDoorsDesiredOpen === true;
        if (typeof ClodisBuilder.toggleAllDoors === 'function' && Number(window.currentRoomStep) >= 4) {
          ClodisBuilder.toggleAllDoors(desiredOpen);
        }
      } catch (_) {}
    }, 320);
    setTimeout(() => {
      try {
        const scene =
          window.__cldAppState?.scene || window.__cldRoomScene || null;
        if (scene && typeof window.__cldDiagnoseDrawerHandles === 'function') {
          scene.traverse((obj) => {
            if (!obj?.userData?.isFurniture || !obj.isGroup) return;
            window.__cldDiagnoseDrawerHandles(obj);
          });
        }
        ClodisBuilder.diagnoseHandles();
      } catch (_) {}
    }, 1500);
    return n;
  };
}

/** Буфер логов одной сборки (без спама от призрака). */
ClodisBuilder.resetHingeRoomBuildLog = function resetHingeRoomBuildLog() {
  ClodisBuilder._hingeRoomBuildLog = {
    planKeys: new Set(),
    plans: [],
    finalizes: [],
    misses: [],
  };
};

ClodisBuilder._pushHingeRoomBuildLog = function _pushHingeRoomBuildLog(tag, payload) {
  if (!ClodisBuilder._hingeRoomBuildLog) ClodisBuilder.resetHingeRoomBuildLog();
  const buf = ClodisBuilder._hingeRoomBuildLog;
  if (tag === 'applyLayout/plan' && payload) {
    const key = [
      payload.layoutRole,
      payload.facadeRoleLayoutCatalogItemId,
      payload.doorH,
      payload.count,
      (payload.expectedYsMm || []).join(','),
    ].join('|');
    if (buf.planKeys.has(key)) return;
    buf.planKeys.add(key);
    buf.plans.push({
      item: payload.itemName || '',
      role: payload.layoutRole,
      catId: payload.facadeRoleLayoutCatalogItemId,
      count: payload.count,
      doorH: payload.doorH,
      opens: payload.opens,
      double: payload.doubleSwingLeaf,
      top: payload.insetTopMm,
      bottom: payload.insetBottomMm,
      expectedYs: (payload.expectedYsMm || []).join(', '),
      layer: /левый|правый/i.test(payload.itemName || '')
        ? 'створка'
        : /двухдверн/i.test(payload.itemName || '')
          ? 'оболочка'
          : '—',
    });
    return;
  }
  if (tag === 'finalize/scene' && payload) {
    const hinges = Array.isArray(payload.hinges)
      ? payload.hinges.map((h) => ({
          slot: h.slot,
          dir: h.doorDir,
          expected: h.expectedYMm,
          groupY: h.groupPosY,
          delta: h.deltaGroupPosVsExpected,
          ok: h.ok,
        }))
      : [];
    buf.finalizes.push({
      facade: payload.facade,
      role: payload.layoutRole,
      catId: payload.catalogItemId,
      hingeCount: payload.hingeCount,
      badCount: payload.badCount,
      hinges,
    });
    return;
  }
  if (tag === 'mergeScheme/miss') {
    buf.misses.push(payload);
  }
};

ClodisBuilder.flushHingeRoomBuildLog = function flushHingeRoomBuildLog(opts) {
  const buf = ClodisBuilder._hingeRoomBuildLog;
  if (!buf || (!buf.plans.length && !buf.finalizes.length && !buf.misses.length)) return;
  const name = opts?.furnitureName || 'шкаф';
  const fin = buf.finalizes || [];
  const isLeafName = (n) => /левый|правый/i.test(String(n || ''));
  const isShellName = (n) => /двухдверн/i.test(String(n || ''));
  const doorLeaves = fin.filter((f) => isLeafName(f.facade));
  const compositeShells = fin.filter((f) => isShellName(f.facade));
  const uniquePlansByRole = new Map();
  for (const p of buf.plans) {
    const k = `${p.role}|${p.catId}`;
    if (!uniquePlansByRole.has(k)) uniquePlansByRole.set(k, p);
  }
  console.warn(
    `[CLD][HINGE-ROOM] ===== СБОРКА «${name}» =====\n` +
      `  видимых створок (лев+прав): ${doorLeaves.length || '?'}\n` +
      `  оболочек catalog (#13/#14): ${compositeShells.length || '?'}\n` +
      `  уник. планов по роли (main+top): ${uniquePlansByRole.size}\n` +
      `  (внутр. finalize-событий: ${fin.length} — оболочки + половинки в дереве)`
  );
  if (buf.plans.length) {
    console.warn('[CLD][HINGE-ROOM] План «петли по ролям» (до раскладки):');
    console.table(buf.plans);
  }
  if (buf.finalizes.length) {
    for (const fin of buf.finalizes) {
      console.warn(
        `[CLD][HINGE-ROOM] Финал «${fin.facade}» role=${fin.role} cat=${fin.catId} петель=${fin.hingeCount} bad=${fin.badCount}`
      );
      if (fin.hinges.length) console.table(fin.hinges);
    }
  }
  if (buf.misses.length) {
    console.warn('[CLD][HINGE-ROOM] дефолты не найдены:', buf.misses);
  }
  ClodisBuilder.resetHingeRoomBuildLog();
};

/** Включить логи петли в комнате. */
ClodisBuilder.enableHingeRoomDebug = function enableHingeRoomDebug() {
  if (typeof window === 'undefined') return false;
  window.DEBUG_HINGE_ROOM = true;
  console.warn(
    '[CLD][HINGE-ROOM] DEBUG включён.\n' +
      '  Поставьте шкаф → одна сводка [CLD][HINGE-ROOM] сборка\n' +
      '  ClodisBuilder.logHingeRoomDiagnostics() — таблица по сцене'
  );
  return true;
};

/**
 * Сводка петель в уже собранной комнате: план из «петли по ролям» vs фактические позиции.
 * @param {THREE.Object3D} [scene] — furniture.group или scene
 * @returns {{ facades: number, hinges: number, bad: number, root: string }}
 */
ClodisBuilder.logHingeRoomDiagnostics = function logHingeRoomDiagnostics(scene) {
  if (typeof window !== 'undefined') window.DEBUG_HINGE_ROOM = true;
  const resolved = ClodisBuilder._resolveFurnitureDiagRoot(scene);
  const rootScene = resolved.root;
  if (!rootScene || typeof rootScene.traverse !== 'function') {
    console.warn(
      '[CLD][HINGE-ROOM] logHingeRoomDiagnostics: нет шкафа в сцене.\n' +
        '  Поставьте шкаф в комнату, затем повторите команду.'
    );
    return { facades: 0, hinges: 0, bad: 0, root: 'none' };
  }
  rootScene.updateMatrixWorld(true);
  const builder = new ClodisBuilder();
  const gen = typeof window !== 'undefined' ? window.__cldHingeLayout : null;
  const facadeShells = [];
  const hingeRows = [];
  const facadeRoles = new Set(['facades', 'facades_main', 'facades_top']);

  const isFacadeShellNode = (o) => {
    if (!o || o.isMesh) return false;
    const lr = String(o.userData?.layoutRole || '').trim();
    if (facadeRoles.has(lr)) return true;
    if (o.userData?.hingeRoleLayoutVerify || o.userData?.hingeRoleLayoutAccSnapshot) return true;
    if (o.userData?.isFacade && lr) return true;
    return false;
  };

  const isHingeModuleNode = (o) => {
    if (!o || o.isMesh) return false;
    if (o.userData?.isCatalogHingeModule) return true;
    if (o.userData?.hingeRoleExpectedYMm != null && o.userData?.hingeLayoutSlotIndex != null) {
      return true;
    }
    const nm = String(o.name || '');
    if (/^Module_.*петл/i.test(nm) && o.userData?.hingeRoleExpectedYMm != null) return true;
    return false;
  };

  rootScene.traverse((o) => {
    if (!isFacadeShellNode(o)) return;
    if (!facadeShells.includes(o)) facadeShells.push(o);
  });

  rootScene.traverse((hingeMod) => {
    if (!isHingeModuleNode(hingeMod)) return;
    const facadeGroup = builder._findFacadeShellGroupForHinge(hingeMod);
    const facadeShellBox = (() => {
      if (!facadeGroup) return null;
      const box = new THREE.Box3();
      let has = false;
      facadeGroup.traverse((o) => {
        if (!o?.isMesh || o.userData?.isCatalogHingeModule) return;
        let p = o.parent;
        while (p) {
          if (p.userData?.isCatalogHingeModule) return;
          p = p.parent;
        }
        try {
          const b = new THREE.Box3().setFromObject(o);
          if (!has) {
            box.copy(b);
            has = true;
          } else box.union(b);
        } catch (_) {}
      });
      return has ? box : null;
    })();
    const row = builder._collectHingeVerifyRow(hingeMod, facadeGroup, facadeShellBox);
    const accSnap = facadeGroup?.userData?.hingeRoleLayoutAccSnapshot || null;
    const verify = facadeGroup?.userData?.hingeRoleLayoutVerify || null;
    hingeRows.push({
      facade: facadeGroup?.name || '(no facade shell)',
      layoutRole: facadeGroup?.userData?.layoutRole || row.facadeRole,
      catalogItemId: facadeGroup?.userData?.facadeRoleLayoutCatalogItemId || null,
      planCount: accSnap?.count ?? verify?.expectedYs?.length ?? null,
      planYs: accSnap?.expectedYsMm || verify?.expectedYs || null,
      ...row,
    });
  });

  hingeRows.sort((a, b) => {
    const fa = String(a.facade || '');
    const fb = String(b.facade || '');
    if (fa !== fb) return fa.localeCompare(fb);
    return (a.slot ?? 0) - (b.slot ?? 0);
  });

  const bad = hingeRows.filter((r) => r.ok === false);
  const facadeSummary = facadeShells.map((fg) => {
    const acc = fg.userData?.hingeRoleLayoutAccSnapshot || null;
    const verify = fg.userData?.hingeRoleLayoutVerify || null;
    const onFacade = hingeRows.filter((r) => r.facade === fg.name);
    return {
      name: fg.name,
      layoutRole: fg.userData?.layoutRole,
      catalogItemId: fg.userData?.facadeRoleLayoutCatalogItemId,
      shellH: fg.userData?.originalSize?.y,
      planCount: acc?.count ?? null,
      planYs: acc?.expectedYsMm || verify?.expectedYs || null,
      builtCount: onFacade.length,
      badCount: onFacade.filter((r) => r.ok === false).length,
    };
  });

  console.warn('[CLD][HINGE-ROOM][diagnostics/summary]', {
    root: resolved.source,
    rootName: rootScene.name || rootScene.type,
    facades: facadeShells.length,
    hinges: hingeRows.length,
    bad: bad.length,
    note: 'ok=false → |delta| > 3мм от expectedYMm (от низа фасада)',
  });
  if (facadeSummary.length) console.table(facadeSummary);
  if (typeof ClodisBuilder.logHingeYCompare === 'function') {
    ClodisBuilder.logHingeYCompare(rootScene);
  } else if (hingeRows.length) {
    console.table(hingeRows);
  }
  if (bad.length) {
    console.warn('[CLD][HINGE-ROOM][diagnostics/bad]', bad);
  }

  if (gen && typeof gen.resolveHingeRoleLayoutParams === 'function') {
    const roleChecks = facadeSummary
      .filter((f) => f.catalogItemId > 0)
      .map((f) => {
        const params = gen.resolveHingeRoleLayoutParams({
          productKind: 'wardrobe',
          facadeLayoutRole: f.layoutRole,
          catalogItemId: f.catalogItemId,
          facadeCatalogItemId: f.catalogItemId,
          doubleSwing: gen.FACADE_COMPOSITE_DOUBLE_CATALOG_IDS?.has(f.catalogItemId),
        });
        return {
          facade: f.name,
          catalogItemId: f.catalogItemId,
          adminHingeCount: params?.hingeCount ?? null,
          adminTop: params?.topOffset ?? null,
          adminBottom: params?.bottomOffset ?? null,
          adminOpens: params?.opens ?? null,
          builtCount: f.builtCount,
        };
      });
    if (roleChecks.length) {
      console.warn('[CLD][HINGE-ROOM][diagnostics/adminDefaults]');
      console.table(roleChecks);
    }
  }

  return { facades: facadeShells.length, hinges: hingeRows.length, bad: bad.length, root: resolved.source };
};

/**
 * Только высота Y: план vs факт, по створкам ly/ry. Главная таблица для отладки двухдверных.
 * @param {THREE.Object3D} [scene]
 */
ClodisBuilder.logHingeYCompare = function logHingeYCompare(scene) {
  if (typeof window !== 'undefined') window.DEBUG_HINGE_ROOM = true;
  const resolved = ClodisBuilder._resolveFurnitureDiagRoot(scene);
  const root = resolved.root;
  if (!root || typeof root.traverse !== 'function') {
    console.warn('[CLD][HINGE-ROOM][hingeY] нет шкафа в сцене');
    return [];
  }
  root.updateMatrixWorld(true);
  const builder = new ClodisBuilder();
  const rows = [];

  root.traverse((hingeMod) => {
    if (!hingeMod?.userData?.isCatalogHingeModule) return;
    const facadeGroup = builder._findFacadeShellGroupForHinge(hingeMod);
    let leafName = '';
    for (let p = hingeMod.parent; p && !leafName; p = p.parent) {
      const nm = String(p.name || '');
      if (/Module_Фасад|левый|правый/i.test(nm)) {
        leafName = nm.replace(/^Module_/, '');
        break;
      }
    }
    const facadeShellBox = (() => {
      if (!facadeGroup) return null;
      const box = new THREE.Box3();
      let has = false;
      facadeGroup.traverse((o) => {
        if (!o?.isMesh || o.userData?.isCatalogHingeModule) return;
        let p = o.parent;
        while (p) {
          if (p.userData?.isCatalogHingeModule) return;
          p = p.parent;
        }
        try {
          const b = new THREE.Box3().setFromObject(o);
          if (!has) {
            box.copy(b);
            has = true;
          } else box.union(b);
        } catch (_) {}
      });
      return has ? box : null;
    })();
    const v = builder._collectHingeVerifyRow(hingeMod, facadeGroup, facadeShellBox);
    const acc = facadeGroup?.userData?.hingeRoleLayoutAccSnapshot || null;
    const verify = facadeGroup?.userData?.hingeRoleLayoutVerify || null;
    const planYs = acc?.expectedYsMm || verify?.expectedYs || [];
    const slotIdx = Number(v.slot) || 0;
    const isLeaf = /левый|правый/i.test(leafName);
    let panelInsetBottom = null;
    let panelInsetTop = null;
    if (typeof THREE !== 'undefined') {
      let swing = null;
      for (let p = hingeMod.parent; p; p = p.parent) {
        if (p.userData?.cldDoorSwing) {
          swing = p.userData.cldDoorSwing;
          break;
        }
      }
      const panelMesh = builder._findFacadePanelMeshFor(facadeGroup, swing);
      if (panelMesh) {
        try {
          const panelBox = new THREE.Box3().setFromObject(panelMesh);
          const animRoots = builder._collectHingeAnimatorRootsForHingeModule(hingeMod, null);
          if (animRoots.length && !panelBox.isEmpty()) {
            const cupW = new THREE.Vector3();
            builder._resolveHingeCupCenterWorldY(animRoots[0], cupW);
            panelInsetBottom = Math.round(cupW.y - panelBox.min.y);
            panelInsetTop = Math.round(panelBox.max.y - cupW.y);
          }
        } catch (_) {}
      }
    }
    rows.push({
      роль: facadeGroup?.userData?.layoutRole || v.facadeRole || '',
      створка: leafName || hingeMod.name,
      leaf: isLeaf ? 'да' : 'оболочка',
      dir: v.doorDir || '?',
      слот: slotIdx,
      doorH_план: acc?.doorH ?? verify?.dimensionMm ?? null,
      count_план: acc?.count ?? (planYs.length > 0 ? planYs.length : null),
      expected_Y: v.expectedYMm,
      план_Y_слот: planYs[slotIdx] ?? null,
      groupPosY: Math.round((v.groupPosY || 0) * 10) / 10,
      delta_Y: v.deltaGroupPosVsExpected,
      панель_снизу: panelInsetBottom,
      панель_сверху: panelInsetTop,
      ok: v.ok,
    });
  });

  const leafRows = rows.filter((r) => r.leaf === 'да');

  rows.sort((a, b) => {
    const ra = String(a.роль || '');
    const rb = String(b.роль || '');
    if (ra !== rb) return ra.localeCompare(rb);
    const sa = String(a.слот ?? 0);
    const sb = String(b.слот ?? 0);
    if (sa !== sb) return Number(sa) - Number(sb);
    return String(a.dir || '').localeCompare(String(b.dir || ''));
  });

  console.warn(
    '[CLD][HINGE-ROOM][hingeY] ===== ВЫСОТА ПЕТЕЛЬ (мм от низа створки) =====\n' +
      '  expected_Y = по правилам «петли по ролям»\n' +
      '  groupPosY = факт в комнате\n' +
      '  панель_снизу/сверху = мм от видимого полотна (для сверки 100/100)\n' +
      '  ly и ry на одном слоте должны иметь одинаковый expected_Y'
  );
  if (rows.length) console.table(rows);

  const lyRyPairs = [];
  const pairKey = (role, slot) => `${role}|${slot}`;
  const lyByKey = new Map();
  const ryByKey = new Map();
  for (const r of leafRows) {
    const k = pairKey(r.роль, r.слот);
    const d = String(r.dir || '').toLowerCase();
    if (d === 'ly' || d === 'left' || d === 'ltr') lyByKey.set(k, r);
    else if (d === 'ry' || d === 'right' || d === 'rtl') ryByKey.set(k, r);
  }
  for (const [k, ly] of lyByKey) {
    const ry = ryByKey.get(k);
    if (!ry) continue;
    const lyE = ly.expected_Y;
    const ryE = ry.expected_Y;
    const diff = lyE != null && ryE != null ? Math.round(ryE - lyE) : null;
    lyRyPairs.push({
      роль: ly.роль,
      слот: ly.слот,
      ly_expected: lyE,
      ry_expected: ryE,
      diff_ry_minus_ly: diff,
      ly_ok: ly.ok,
      ry_ok: ry.ok,
      match: diff == null ? '?' : Math.abs(diff) <= 1,
    });
  }
  if (lyRyPairs.length) {
    console.warn('[CLD][HINGE-ROOM][hingeY] Пара ly/ry (только створки левый+правый):');
    console.table(lyRyPairs);
  }

  const lyRyMismatch = lyRyPairs.filter((p) => p.match === false);
  if (lyRyMismatch.length) {
    console.warn('[CLD][HINGE-ROOM][hingeY] ly≠ry expected на створках:', lyRyMismatch);
  }

  const bad = leafRows.filter((r) => r.ok === false);
  if (bad.length) {
    console.warn('[CLD][HINGE-ROOM][hingeY] ОШИБКА Y (delta > 3мм):', bad);
  } else if (rows.length) {
    console.warn('[CLD][HINGE-ROOM][hingeY] все Y в допуске ±3мм');
  }

  return rows;
};

/**
 * Повторить finalize петель на уже собранной сцене (после DEBUG_HINGE_ROOM=true).
 * @param {THREE.Scene} scene — корневая сцена комнаты
 * @returns {number} сколько модулей петли обработано
 */
/** Сводка: ожидаемые Y (по ролям) vs фактические позиции петель в уже собранной сцене. */
ClodisBuilder.logHingeRoleVerifyInScene = function logHingeRoleVerifyInScene(scene) {
  if (typeof window !== 'undefined') window.DEBUG_HINGE_ROLE_VERIFY = true;
  const resolved = ClodisBuilder._resolveFurnitureDiagRoot(scene);
  const rootScene = resolved.root;
  if (!rootScene || typeof rootScene.traverse !== 'function') {
    console.warn('[CLD][HINGE-VERIFY] нет шкафа в сцене');
    return 0;
  }
  const builder = new ClodisBuilder();
  const facadeRoles = new Set(['facades', 'facades_main', 'facades_top']);
  let facades = 0;
  rootScene.traverse((o) => {
    const lr = String(o.userData?.layoutRole || '').trim();
    if (!facadeRoles.has(lr) && !o.userData?.hingeRoleLayoutVerify) return;
    const shellSize = o.userData?.originalSize || { x: 0, y: 0, z: 0 };
    builder._logFacadeHingesVerifyAfterFinalize(o, null, shellSize, null);
    facades++;
  });
  console.warn('[CLD][HINGE-VERIFY] logHingeRoleVerifyInScene facades=' + facades, resolved.source);
  return facades;
};

/**
 * После async-загрузки GLB «Петля накладная фасад» (spec.id:5): Z-align с реальной геометрией.
 * До загрузки placeholder скрыт — finalize мог выровнять пустой bbox и спрятать петлю в полотне.
 */
ClodisBuilder.refinalizeHingeAfterCatalogModelLoaded = function refinalizeHingeAfterCatalogModelLoaded(modelGroup) {
  if (!modelGroup || typeof THREE === 'undefined') return false;
  const specId = String(modelGroup.userData?.modelSpecId || '').trim();
  if (specId !== '5' || !modelGroup.userData?.cldHingeCatalogModel) return false;

  let hingeMod = null;
  let animRoot = null;
  let p = modelGroup;
  for (let i = 0; i < 40 && p; i++) {
    if (!hingeMod && p.userData?.isCatalogHingeModule) hingeMod = p;
    if (
      !animRoot &&
      p.userData?.isAnimator &&
      String(p.userData.animatorId || '').toLowerCase() === 'hinge_animator'
    ) {
      animRoot = p;
    }
    p = p.parent;
  }
  if (!hingeMod || !animRoot) return false;

  let ctx = null;
  for (let p = hingeMod.parent; p && !ctx; p = p.parent) {
    if (p.userData?.isSection) {
      ctx = {
        groupRef: p,
        name: p.userData.sectionName || p.name || '',
        parent: null,
      };
    }
  }
  if (!ctx && hingeMod.parent) {
    ctx = { groupRef: hingeMod.parent, name: '', parent: null };
  }
  if (!ctx) return false;

  modelGroup.traverse((o) => {
    if (!o?.isMesh) return;
    o.visible = true;
    o.renderOrder = Math.max(o.renderOrder || 0, 4);
  });

  const builder = new ClodisBuilder();
  builder._facadeHingeContext = {
    layoutRole: '',
    catalogHingeLayoutId: null,
    catalogHingeModulesApplied: false,
    catalogHingeModulesInTree: true,
  };
  builder._finalizeStandaloneCatalogHingeModule(hingeMod, ctx);
  if (typeof window !== 'undefined' && window.DEBUG_HINGE_ROOM === true) {
    console.info('[CLD][HINGE-ROOM] facade GLB loaded → hinge finalize', {
      hinge: hingeMod.name,
    });
  }
  return true;
};

ClodisBuilder.refinalizeCatalogHingesForDebug = function refinalizeCatalogHingesForDebug(scene) {
  if (typeof window === 'undefined') return 0;
  window.DEBUG_HINGE_ROOM = true;
  const resolved = ClodisBuilder._resolveFurnitureDiagRoot(scene);
  const rootScene = resolved.root;
  if (!rootScene || typeof rootScene.traverse !== 'function') {
    console.warn('[CLD][HINGE-ROOM] refinalize: нет шкафа в сцене');
    return 0;
  }
  const builder = new ClodisBuilder();
  builder._facadeHingeContext = {
    layoutRole: '',
    catalogHingeLayoutId: null,
    catalogHingeModulesApplied: false,
    catalogHingeModulesInTree: true,
  };
  let count = 0;
  rootScene.traverse((hingeMod) => {
    if (!hingeMod?.userData?.isCatalogHingeModule) return;
    let ctx = null;
    for (let p = hingeMod.parent; p && !ctx; p = p.parent) {
      if (p.userData?.isSection) {
        ctx = {
          groupRef: p,
          name: p.userData.sectionName || p.name || '',
          parent: null,
        };
      }
    }
    if (!ctx && hingeMod.parent) {
      ctx = { groupRef: hingeMod.parent, name: '', parent: null };
    }
    if (!ctx) return;
    builder._finalizeStandaloneCatalogHingeModule(hingeMod, ctx);
    count++;
  });
  console.warn('[CLD][HINGE-ROOM] refinalize done, hinge modules=' + count);
  return count;
};

/** Пересоздать кубы петель для уже собранной сцены (после включения кнопки). */
ClodisBuilder.refreshHingeDebugVolumesInScene = function refreshHingeDebugVolumesInScene(scene) {
  if (!scene || typeof scene.traverse !== 'function') return;
  if (typeof window === 'undefined' || window.DEBUG_HINGE_SECTION_VOL !== true) return;
  const builder = new ClodisBuilder();
  scene.traverse((hingeMod) => {
    if (!hingeMod || !hingeMod.userData?.isCatalogHingeModule) return;
    let swing = null;
    let p = hingeMod.parent;
    for (let i = 0; i < 24 && p; i++) {
      if (typeof p.getObjectByName === 'function') {
        const s = p.getObjectByName('__door_swing');
        if (s) {
          swing = s;
          break;
        }
      }
      p = p.parent;
    }
    const animators = [];
    hingeMod.traverse((o) => {
      if (!o.userData?.isAnimator) return;
      if (String(o.userData.animatorId || '').toLowerCase() !== 'hinge_animator') return;
      animators.push(o);
    });
    builder._addHingeDebugSectionVolumes(hingeMod, animators, swing);
  });
  ClodisBuilder.syncHingeDebugVolumesVisibility(scene);
};

// ClodisBuilder — глобальный экспорт для комнаты и админки
ClodisBuilder.ROOM_DOOR_PIVOT_OFFSET_MM = { x: 9, y: 0, z: 7 };
window.ClodisBuilder = ClodisBuilder;
