/**
 * CAD single-chain: присадка Furniture_* (как мировой CAD / PlanPlace).
 *
 * Единственный модуль математики. Превью / комната / CFRN только вызывают API.
 * Нет веток «guides», mirror 8↔9, world+I, FORCE.
 *
 * Контракт:
 * 1) resolveFurnitureDrillPlacement — origin посадки
 * 2) resolveTemplateHoles + mapTemplateHolesToLocal — дырки из шаблона (LS)
 * 3) exportFrameForMount + cfrnDrillLeafLocalPlusMw — экспорт: local holes + MW(frame)
 *
 * Пустой шаблон = ошибка данных (админка → выгрузить), не runtime-хак.
 * L-стык петли (setup 2) — ниже; detach / door_swing — вне модуля.
 */
(function (g) {
  'use strict';

  var DRILL_DIR_VEC = {
    x: [1, 0, 0],
    '-x': [-1, 0, 0],
    y: [0, 1, 0],
    '-y': [0, -1, 0],
    z: [0, 0, 1],
    '-z': [0, 0, -1],
  };

  function isSingleFaceDrillSetup(setupType) {
    var st = Number(setupType) || 0;
    return st === 1 || st === 4;
  }

  function pivotLooksAuthored(pivot) {
    if (!pivot || typeof pivot !== 'object') return false;
    if (pivot.x == null && pivot.y == null && pivot.z == null) return false;
    return !(
      Number(pivot.x) === 0 &&
      Number(pivot.y) === 0 &&
      Number(pivot.z) === 0
    );
  }

  function hostAnchorOriginMm(pivot, posMm, parentSizeMm, defaultPiv) {
    var d = Number.isFinite(Number(defaultPiv)) ? Number(defaultPiv) : -1;
    var ax = Number(pivot && pivot.x);
    var ay = Number(pivot && pivot.y);
    var az = Number(pivot && pivot.z);
    var pivX = Number.isFinite(ax) ? ax : d;
    var pivY = Number.isFinite(ay) ? ay : d;
    var pivZ = Number.isFinite(az) ? az : d;
    var sx = Number(parentSizeMm && parentSizeMm.x) || 0;
    var sy = Number(parentSizeMm && parentSizeMm.y) || 0;
    var sz = Number(parentSizeMm && parentSizeMm.z) || 0;
    var px = Number(posMm && posMm.x) || 0;
    var py = Number(posMm && posMm.y) || 0;
    var pz = Number(posMm && posMm.z) || 0;
    return {
      x: pivX * sx * 0.5 + px,
      y: pivY * sy * 0.5 + py,
      z: pivZ * sz * 0.5 + pz,
    };
  }

  function drillTemplateLocalPos(xMm, yMm, zMm, mmPerUnit) {
    var u = Number(mmPerUnit) > 0 ? Number(mmPerUnit) : 1;
    return {
      x: (Number(xMm) || 0) / u,
      y: -(Number(yMm) || 0) / u,
      z: -(Number(zMm) || 0) / u,
    };
  }

  function drillTemplateLocalPosMm(xMm, yMm, zMm) {
    return drillTemplateLocalPos(xMm, yMm, zMm, 1);
  }

  function drillDirUnit(dirKey) {
    var k = String(dirKey || '-z').toLowerCase();
    var a = DRILL_DIR_VEC[k] || DRILL_DIR_VEC['-z'];
    return { x: a[0], y: a[1], z: a[2] };
  }

  /**
   * Посадка Furniture_Присадка.
   * setup 1/4 → host-anchor; model без 1/4 → сырой pos; wall → host-anchor;
   * setup 0 + pivot на section (не model) → promote singleFace.
   */
  function resolveFurnitureDrillPlacement(opts) {
    opts = opts || {};
    var setupFromTree = Number(opts.setupTypeFromTree) || 0;
    var setupFromTpl = Number(opts.setupTypeFromTemplate) || 0;
    var setupType = setupFromTree || setupFromTpl || 0;
    var facadeModelId = Number(opts.facadeModelId) || 0;
    var parentType = String(opts.parentType || '').toLowerCase().trim();
    var underModelHost = !!opts.underModelHost || parentType === 'model';
    var underHinge = !!opts.underHinge;
    var underWall = parentType === 'wall';
    var pivot = opts.pivot || null;
    var posMm = opts.posMm || { x: 0, y: 0, z: 0 };
    var parentSizeMm = opts.parentSizeMm || { x: 0, y: 0, z: 0 };

    var isLSeam = setupType === 2 && facadeModelId > 0;
    var isSingleFace = isSingleFaceDrillSetup(setupType);

    if (
      !isSingleFace &&
      !isLSeam &&
      setupType === 0 &&
      !underModelHost &&
      !underWall &&
      pivotLooksAuthored(pivot)
    ) {
      isSingleFace = true;
    }

    var useHostAnchor = !isLSeam && (isSingleFace || underWall);
    var originMm = useHostAnchor
      ? hostAnchorOriginMm(pivot, posMm, parentSizeMm, -1)
      : {
          x: Number(posMm.x) || 0,
          y: Number(posMm.y) || 0,
          z: Number(posMm.z) || 0,
        };

    if (isLSeam) {
      originMm = { x: 0, y: 0, z: 0 };
    }

    var sizeZero = isLSeam || isSingleFace || underModelHost || underWall;
    var clearInstancePivot = !isSingleFace && !underModelHost && sizeZero;
    var mountPivotZero =
      isLSeam || isSingleFace || underModelHost || underHinge || underWall;

    return {
      setupType: setupType,
      isSingleFace: isSingleFace,
      isLSeam: isLSeam,
      useHostAnchor: useHostAnchor,
      originMm: originMm,
      sizeZero: sizeZero,
      clearInstancePivot: clearInstancePivot,
      mountPivotZero: mountPivotZero,
      drillTemplateLocalCs: 1,
      underModelHost: underModelHost,
    };
  }

  function mapTemplateHolesToLocal(holeList, opts) {
    opts = opts || {};
    var mmPerUnit = Number(opts.mmPerUnit) > 0 ? Number(opts.mmPerUnit) : 1;
    var planeAlign = opts.planeAlign !== false;
    var out = [];
    if (!Array.isArray(holeList) || !holeList.length) return out;

    var planeAnchorByDir = {};
    var i;
    var hole;
    var dirKey;
    var diam;
    var dep;
    var local;
    var start;

    if (planeAlign) {
      for (i = 0; i < holeList.length; i++) {
        hole = holeList[i];
        if (!hole || hole.through) continue;
        dirKey = String(hole.dirKey || hole.direction || '-z').toLowerCase();
        diam = Number(hole.diameterMm != null ? hole.diameterMm : hole.diameter);
        if (!Number.isFinite(diam) || diam <= 0) continue;
        local = drillTemplateLocalPos(
          hole.xMm != null ? hole.xMm : hole.x,
          hole.yMm != null ? hole.yMm : hole.y,
          hole.zMm != null ? hole.zMm : hole.z,
          mmPerUnit,
        );
        var cur = planeAnchorByDir[dirKey];
        if (!cur || diam > cur.diameter) {
          planeAnchorByDir[dirKey] = {
            diameter: diam,
            x: local.x,
            y: local.y,
            z: local.z,
          };
        }
      }
    }

    for (i = 0; i < holeList.length; i++) {
      hole = holeList[i];
      if (!hole || hole.through) continue;
      dirKey = String(hole.dirKey || hole.direction || '-z').toLowerCase();
      diam = Number(hole.diameterMm != null ? hole.diameterMm : hole.diameter);
      dep = Number(hole.depthMm != null ? hole.depthMm : hole.depth);
      if (!Number.isFinite(diam) || diam <= 0 || !Number.isFinite(dep) || dep <= 0) continue;
      dep = Math.min(dep, 120);
      local = drillTemplateLocalPos(
        hole.xMm != null ? hole.xMm : hole.x,
        hole.yMm != null ? hole.yMm : hole.y,
        hole.zMm != null ? hole.zMm : hole.z,
        mmPerUnit,
      );
      start = { x: local.x, y: local.y, z: local.z };
      if (planeAlign && planeAnchorByDir[dirKey]) {
        var anchor = planeAnchorByDir[dirKey];
        var dir = drillDirUnit(dirKey);
        var along =
          (start.x - anchor.x) * dir.x +
          (start.y - anchor.y) * dir.y +
          (start.z - anchor.z) * dir.z;
        start.x -= dir.x * along;
        start.y -= dir.y * along;
        start.z -= dir.z * along;
      }
      out.push({
        name: hole.name || '',
        diameterMm: diam,
        depthMm: dep,
        dirKey: dirKey,
        x: start.x,
        y: start.y,
        z: start.z,
        through: false,
      });
    }
    return out;
  }

  function templateLooksLikeLSeam(tpl) {
    if (!tpl || typeof tpl !== 'object') return false;
    var st = Number(tpl.currentSetupType != null ? tpl.currentSetupType : tpl.setupType) || 0;
    return (
      st === 2 &&
      (Number(tpl.facadeModelId) > 0 || Number(tpl.corpusModelId) > 0 || Number(tpl.cabinetModelId) > 0)
    );
  }

  function templateHasDrillHoles(tpl) {
    if (!tpl || typeof tpl !== 'object') return false;
    if (Array.isArray(tpl.holes) && tpl.holes.length > 0) return true;
    if (tpl.holesBySetup && typeof tpl.holesBySetup === 'object') {
      var vals = Object.keys(tpl.holesBySetup);
      for (var i = 0; i < vals.length; i++) {
        var a = tpl.holesBySetup[vals[i]];
        if (Array.isArray(a) && a.length) return true;
      }
    }
    return false;
  }

  function pickDrillTemplateIdFromCandidates(candidateIds, getTemplateMeta) {
    var list = Array.isArray(candidateIds) ? candidateIds : [];
    var getter =
      typeof getTemplateMeta === 'function'
        ? getTemplateMeta
        : function (id) {
            var arr = Array.isArray(getTemplateMeta) ? getTemplateMeta : [];
            for (var i = 0; i < arr.length; i++) {
              if (Number(arr[i] && arr[i].id) === Number(id)) return arr[i];
            }
            return null;
          };
    for (var c = 0; c < list.length; c++) {
      var n = Number(list[c]);
      if (!Number.isFinite(n) || n <= 0) continue;
      var tpl = getter(n);
      if (!tpl) continue;
      if (templateLooksLikeLSeam(tpl) || templateHasDrillHoles(tpl)) return n;
    }
    return 0;
  }

  function resolveTemplateHoles(templateId, setupType, getTemplate, holesForSetup) {
    var tid = Number(templateId) || 0;
    if (!(tid > 0) || typeof getTemplate !== 'function') {
      return { templateId: tid, holes: [], setupType: Number(setupType) || 0, empty: true };
    }
    var tpl = getTemplate(tid);
    if (!tpl) {
      return { templateId: tid, holes: [], setupType: Number(setupType) || 0, empty: true };
    }
    var st =
      Number(setupType) ||
      Number(tpl.currentSetupType != null ? tpl.currentSetupType : tpl.setupType) ||
      0;
    var raw = [];
    if (typeof holesForSetup === 'function') {
      raw = holesForSetup(tpl, st) || [];
    } else if (tpl.holesBySetup && typeof tpl.holesBySetup === 'object') {
      var key = String(st);
      if (Array.isArray(tpl.holesBySetup[key]) && tpl.holesBySetup[key].length) {
        raw = tpl.holesBySetup[key];
      } else {
        var keys = Object.keys(tpl.holesBySetup);
        for (var i = 0; i < keys.length; i++) {
          var a = tpl.holesBySetup[keys[i]];
          if (Array.isArray(a) && a.length) {
            raw = a;
            break;
          }
        }
      }
    }
    if (!raw.length && Array.isArray(tpl.holes)) raw = tpl.holes;
    var usable = [];
    for (var h = 0; h < raw.length; h++) {
      if (raw[h] && !raw[h].through) usable.push(raw[h]);
    }
    return {
      templateId: tid,
      holes: usable,
      setupType: st,
      empty: usable.length === 0,
      templateName: String(tpl.name || ''),
    };
  }

  function exportFrameForMount(mount) {
    if (!mount) return null;
    if (typeof mount.getObjectByName === 'function') {
      var own = mount.getObjectByName('__furniture_own');
      if (own) return own;
    }
    return mount;
  }

  function cfrnDrillLeafLocalPlusMw(mount, localHoles, matrixWorld16Fn) {
    var frame = exportFrameForMount(mount);
    var holes = Array.isArray(localHoles) ? localHoles : [];
    var matrix =
      typeof matrixWorld16Fn === 'function' && frame
        ? matrixWorld16Fn(frame)
        : [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    return { holes: holes, matrix: matrix, mount: mount, frame: frame };
  }

  /* ——— L-стык (петля setup 2): матрица R_place, без detach ——— */

  function lSeamEdgeFromAnimatorDirection(dir) {
    var d = String(dir || 'ly')
      .toLowerCase()
      .trim();
    if (d === 'top' || d === 'simple_top' || d.slice(-3) === 'top') return 'top';
    if (d === 'bottom' || d === 'simple_bottom' || d.slice(-6) === 'bottom') return 'bottom';
    if (d.charAt(0) === 'r') return 'right';
    return 'left';
  }

  function lSeamNormalizeEdge(edgeOrDir) {
    if (
      edgeOrDir === 'left' ||
      edgeOrDir === 'right' ||
      edgeOrDir === 'top' ||
      edgeOrDir === 'bottom'
    ) {
      return edgeOrDir;
    }
    return lSeamEdgeFromAnimatorDirection(edgeOrDir);
  }

  function lSeamTplToCabinetEdgeCfg(edge) {
    var edgeCfg = {
      left: { nf: [0, 0, -1], nb: [1, 0, 0], s: [0, -1, 0] },
      right: { nf: [0, 0, -1], nb: [-1, 0, 0], s: [0, -1, 0] },
      top: { nf: [0, 0, -1], nb: [0, -1, 0], s: [1, 0, 0] },
      bottom: { nf: [0, 0, -1], nb: [0, 1, 0], s: [1, 0, 0] },
    };
    return edgeCfg[lSeamNormalizeEdge(edge)] || edgeCfg.left;
  }

  function lSeamTplToCabinetMatrixElements(edge) {
    var ec = lSeamTplToCabinetEdgeCfg(edge);
    var nf = ec.nf;
    var nb = ec.nb;
    var s = ec.s;
    return [nf[0], nf[1], nf[2], 0, nb[0], nb[1], nb[2], 0, s[0], s[1], s[2], 0, 0, 0, 0, 1];
  }

  function applyLSeamTemplatePlacementRotation(obj, edgeOrDir) {
    if (!obj || typeof THREE === 'undefined') return null;
    var edge = lSeamNormalizeEdge(edgeOrDir);
    var els = lSeamTplToCabinetMatrixElements(edge);
    var m4 = new THREE.Matrix4();
    m4.set(
      els[0],
      els[4],
      els[8],
      els[12],
      els[1],
      els[5],
      els[9],
      els[13],
      els[2],
      els[6],
      els[10],
      els[14],
      els[3],
      els[7],
      els[11],
      els[15],
    );
    obj.quaternion.setFromRotationMatrix(m4);
    if (typeof obj.updateMatrixWorld === 'function') obj.updateMatrixWorld(true);
    obj.userData = obj.userData || {};
    obj.userData.cldLSeamRPlaceApplied = edge;
    return edge;
  }

  function lSeamTemplatePointToCabinetMm(xMm, yMm, zMm, edgeOrDir) {
    var local = drillTemplateLocalPosMm(xMm, yMm, zMm);
    var ec = lSeamTplToCabinetEdgeCfg(lSeamNormalizeEdge(edgeOrDir));
    return {
      x: ec.nf[0] * local.x + ec.nb[0] * local.y + ec.s[0] * local.z,
      y: ec.nf[1] * local.x + ec.nb[1] * local.y + ec.s[1] * local.z,
      z: ec.nf[2] * local.x + ec.nb[2] * local.y + ec.s[2] * local.z,
    };
  }

  function normalizeHoleHostPanel(panel) {
    var s = String(panel || '').toLowerCase().trim();
    // Админка L (setupType=2): vertical = фасад/чашка, horizontal = корпус.
    if (
      s === 'door' ||
      s === 'corpus' ||
      s === 'horizontal' ||
      s === 'horiz' ||
      s === 'h' ||
      s === 'body'
    ) {
      return 'door';
    }
    if (s === 'facade' || s === 'vertical' || s === 'vert' || s === 'v') {
      return 'facade';
    }
    return 'auto';
  }

  function classifyLSeamHoleHingePart(hole, opts) {
    opts = opts || {};
    var host = String(hole && (hole.hostPanel || hole.mountSide || '')).toLowerCase().trim();
    var norm = normalizeHoleHostPanel(host);
    if (norm === 'facade' || norm === 'door') return norm;
    // setupType=2 СК шаблона: X = N_facade (полотно/чашка, едет), Y = N_body (корпус, стоит).
    var dir = String((hole && (hole.dirKey || hole.direction)) || '-z').toLowerCase();
    if (dir === 'x' || dir === '-x') return 'facade';
    if (dir === 'y' || dir === '-y') return 'door';
    return 'door';
  }

  var api = {
    DRILL_DIR_VEC: DRILL_DIR_VEC,
    isSingleFaceDrillSetup: isSingleFaceDrillSetup,
    pivotLooksAuthored: pivotLooksAuthored,
    hostAnchorOriginMm: hostAnchorOriginMm,
    drillTemplateLocalPos: drillTemplateLocalPos,
    drillTemplateLocalPosMm: drillTemplateLocalPosMm,
    drillDirUnit: drillDirUnit,
    resolveFurnitureDrillPlacement: resolveFurnitureDrillPlacement,
    mapTemplateHolesToLocal: mapTemplateHolesToLocal,
    resolveTemplateHoles: resolveTemplateHoles,
    exportFrameForMount: exportFrameForMount,
    cfrnDrillLeafLocalPlusMw: cfrnDrillLeafLocalPlusMw,
    templateLooksLikeLSeam: templateLooksLikeLSeam,
    templateHasDrillHoles: templateHasDrillHoles,
    pickDrillTemplateIdFromCandidates: pickDrillTemplateIdFromCandidates,
    normalizeHoleHostPanel: normalizeHoleHostPanel,
    classifyLSeamHoleHingePart: classifyLSeamHoleHingePart,
    lSeamEdgeFromAnimatorDirection: lSeamEdgeFromAnimatorDirection,
    lSeamNormalizeEdge: lSeamNormalizeEdge,
    lSeamTplToCabinetEdgeCfg: lSeamTplToCabinetEdgeCfg,
    lSeamTplToCabinetMatrixElements: lSeamTplToCabinetMatrixElements,
    applyLSeamTemplatePlacementRotation: applyLSeamTemplatePlacementRotation,
    lSeamTemplatePointToCabinetMm: lSeamTemplatePointToCabinetMm,
  };

  g.__CLD_DRILL_RESOLVE = api;
  g.__cldLSeamPlacement = {
    edgeFromDir: lSeamEdgeFromAnimatorDirection,
    edgeCfg: lSeamTplToCabinetEdgeCfg,
    matrixElements: lSeamTplToCabinetMatrixElements,
    applyRotation: applyLSeamTemplatePlacementRotation,
    pointToCabinetMm: lSeamTemplatePointToCabinetMm,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
