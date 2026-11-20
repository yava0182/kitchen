/**
 * Замер-эталон крепежа: одинаковые числа в админке и в комнате.
 *
 * Админка:  __cldJointDump('admin')
 * Комната:  __cldJointDump('room')
 * Сверка:   __cldJointDiff()   (в любой из вкладок — обе выгрузки лежат в localStorage)
 *
 * Все величины приведены к мм и к bbox корпуса (его min — начало координат),
 * поэтому сцена-юниты админки (UNITS_MM=10) и мм комнаты сравниваются напрямую.
 */
(function (global) {
  'use strict';

  var LS_PREFIX = 'cld_parity_dump_';
  var TOL_MM = 1;
  var TOL_DEG = 1;

  function three() {
    return global.THREE || null;
  }

  function sceneUnitsMm(side) {
    var hint = Number(global.__CLD_SCENE_UNITS_MM);
    if (Number.isFinite(hint) && hint > 0) return hint;
    return side === 'admin' ? 10 : 1;
  }

  function isHelperMesh(ud, name) {
    return !!(
      ud.isEdgesHelper ||
      ud.isRoomFurnitureXrayEdges ||
      ud.isKitchenRunOverlay ||
      ud.isDimensions ||
      ud.isSectionVolume ||
      ud.__cldDbgPivotKind ||
      ud.furniDrillHole ||
      ud.jointPreviewHole ||
      ud.jointPreviewOrigin ||
      /Helper|Edges|Gizmo|PivotMarker|furni_joint_hole|__cld_dbg|__clodis_dimensions|__clodis_sizes_obj/i.test(
        name,
      )
    );
  }

  /** Размерные линии и прочая обвязка — целыми ветками, не по одному мешу. */
  function underHelper(obj) {
    var p = obj;
    for (var i = 0; i < 32 && p; i++) {
      if (isHelperMesh(p.userData || {}, String(p.name || ''))) return true;
      p = p.parent;
    }
    return false;
  }

  /** Ближайший предок-кадр стыка (или сам меш, если он помечен). */
  function jointFrameOf(obj) {
    var p = obj;
    for (var i = 0; i < 32 && p; i++) {
      var ud = p.userData || {};
      if (ud.fromJointScheme || ud.jointHardwareMesh || Number(ud.joint_hardware) === 1) return p;
      p = p.parent;
    }
    return null;
  }

  function modelInfoOf(obj) {
    var p = obj;
    var name = '';
    var id = '';
    for (var i = 0; i < 32 && p; i++) {
      var ud = p.userData || {};
      var spec = ud.spec || ud.modelSpec || null;
      if (!id && (ud.modelSpecId != null || spec?.id != null)) {
        id = String(ud.modelSpecId != null ? ud.modelSpecId : spec.id);
      }
      if (!name) {
        var n = spec?.name || ud.modelName || '';
        if (n) name = String(n);
      }
      if (!name && /^Model_/i.test(String(p.name || ''))) {
        name = String(p.name).replace(/^Model_/i, '');
      }
      if (id && name) break;
      p = p.parent;
    }
    return { name: name, id: id };
  }

  /** bbox корпуса: только панели, без крепежа/опор/хелперов. */
  function corpusBox(root, parts) {
    var THREE_ = three();
    var box = new THREE_.Box3();
    root.traverse(function (o) {
      if (!o || !o.isMesh || !o.geometry) return;
      if (underHelper(o)) return;
      if (o.userData?.cldSupportLeg) return;
      if (jointFrameOf(o)) return;
      box.expandByObject(o);
      if (parts) parts.push(o);
    });
    return box.isEmpty() ? null : box;
  }

  /** Из чего сложился bbox — чтобы видеть, почему корпуса разного размера. */
  function describeParts(meshes, origin, unitsMm) {
    var THREE_ = three();
    return meshes
      .map(function (o) {
        var b = new THREE_.Box3().setFromObject(o);
        var s = b.getSize(new THREE_.Vector3());
        var c = b.getCenter(new THREE_.Vector3()).sub(origin);
        return {
          узел: String(o.name || o.parent?.name || '?').slice(0, 40),
          габарит: [r1(s.x * unitsMm), r1(s.y * unitsMm), r1(s.z * unitsMm)],
          центр: [r1(c.x * unitsMm), r1(c.y * unitsMm), r1(c.z * unitsMm)],
          объём: Math.round(s.x * s.y * s.z * unitsMm * unitsMm * unitsMm),
        };
      })
      .sort(function (x, y) {
        return y.объём - x.объём;
      })
      .slice(0, 16);
  }

  function r1(v) {
    return Math.round(v * 10) / 10;
  }

  function worldEulerDeg(obj) {
    var THREE_ = three();
    var q = obj.getWorldQuaternion(new THREE_.Quaternion());
    var e = new THREE_.Euler().setFromQuaternion(q, 'XYZ');
    var norm = function (rad) {
      var d = (rad * 180) / Math.PI;
      d = ((d % 360) + 360) % 360;
      return r1(d > 359.95 ? 0 : d);
    };
    return [norm(e.x), norm(e.y), norm(e.z)];
  }

  function findRoomRoot() {
    var scene = global.__cldRoomScene || global.state?.scene || null;
    if (!scene || typeof scene.traverse !== 'function') return null;
    var found = null;
    scene.traverse(function (o) {
      if (found || !o?.userData?.isFurniture) return;
      found = o;
    });
    return found;
  }

  function findAdminRoot() {
    try {
      if (typeof global.__cldGetAdminRoot === 'function') {
        var r = global.__cldGetAdminRoot();
        if (r) return r;
      }
    } catch (_) {}
    if (global.rootGroup) return global.rootGroup;
    if (global.CLDDBG?.engine?.root) return global.CLDDBG.engine.root;
    if (global.__cldAdminScene) return global.__cldAdminScene;
    return null;
  }

  function resolveRoot(side, explicit) {
    if (explicit) return { root: explicit, side: side || 'arg' };
    var admin = findAdminRoot();
    if (admin && (!side || side === 'admin')) return { root: admin, side: 'admin' };
    var room = findRoomRoot();
    if (room && (!side || side === 'room')) return { root: room, side: 'room' };
    return { root: admin || room || null, side: admin ? 'admin' : 'room' };
  }

  function collect(root, unitsMm) {
    var THREE_ = three();
    root.updateMatrixWorld(true);
    var corpusMeshes = [];
    var corpus = corpusBox(root, corpusMeshes);
    var origin = corpus ? corpus.min.clone() : new THREE_.Vector3();
    var byFrame = new Map();

    root.traverse(function (o) {
      if (!o || !o.isMesh || !o.geometry) return;
      if (underHelper(o)) return;
      var frame = jointFrameOf(o);
      if (!frame) return;
      var rec = byFrame.get(frame);
      if (!rec) {
        var info = modelInfoOf(o);
        rec = {
          frame: String(frame.name || ''),
          model: info.name,
          modelId: info.id,
          originMode: String(frame.userData?._cldJointTemplateOriginMode || ''),
          box: new THREE_.Box3(),
          node: frame,
          meshes: 0,
          visible: 0,
        };
        byFrame.set(frame, rec);
      }
      rec.box.expandByObject(o);
      rec.meshes += 1;
      if (o.visible) rec.visible += 1;
    });

    var rows = [];
    byFrame.forEach(function (rec) {
      if (rec.box.isEmpty()) return;
      var size = rec.box.getSize(new THREE_.Vector3());
      var center = rec.box.getCenter(new THREE_.Vector3()).sub(origin);
      rows.push({
        frame: rec.frame,
        model: rec.model,
        modelId: rec.modelId,
        originMode: rec.originMode,
        posMm: [r1(center.x * unitsMm), r1(center.y * unitsMm), r1(center.z * unitsMm)],
        sizeMm: [r1(size.x * unitsMm), r1(size.y * unitsMm), r1(size.z * unitsMm)],
        rotDeg: worldEulerDeg(rec.node),
        meshes: rec.meshes,
        visible: rec.visible,
      });
    });

    rows.sort(function (a, b) {
      var k = (a.model + a.frame).localeCompare(b.model + b.frame);
      if (k) return k;
      for (var i = 0; i < 3; i++) {
        if (a.posMm[i] !== b.posMm[i]) return a.posMm[i] - b.posMm[i];
      }
      return 0;
    });

    // Метка опоры стоит и на группе, и на её мешах — считаем только верхний узел.
    var legs = 0;
    root.traverse(function (o) {
      if (!o?.userData?.cldSupportLeg) return;
      var p = o.parent;
      for (var i = 0; i < 32 && p; i++) {
        if (p.userData?.cldSupportLeg) return;
        p = p.parent;
      }
      legs += 1;
    });

    var cs = corpus ? corpus.getSize(new THREE_.Vector3()) : null;
    return {
      joints: rows,
      legs: legs,
      corpusMm: cs ? [r1(cs.x * unitsMm), r1(cs.y * unitsMm), r1(cs.z * unitsMm)] : null,
      corpusParts: describeParts(corpusMeshes, origin, unitsMm),
      unitsMm: unitsMm,
    };
  }

  /** Все same-origin окна внутри текущего, включая вложенные iframe. */
  function sameOriginFrames(win, depth, acc) {
    acc = acc || [];
    if (!win || depth > 4) return acc;
    var list;
    try {
      list = win.document.querySelectorAll('iframe');
    } catch (_) {
      return acc;
    }
    for (var i = 0; i < list.length; i++) {
      var w = null;
      try {
        w = list[i].contentWindow;
        if (w) void w.document;
      } catch (_) {
        w = null;
      }
      if (!w) continue;
      acc.push({ win: w, src: String(list[i].getAttribute('src') || list[i].src || '') });
      sameOriginFrames(w, depth + 1, acc);
    }
    return acc;
  }

  /** Превью админки живёт в same-origin iframe — замер делаем прямо в нём. */
  function dumpInAdminFrame(side) {
    if (!global.document) return null;
    var frames = sameOriginFrames(global, 0, []);
    var report = [];
    for (var i = 0; i < frames.length; i++) {
      var w = frames[i].win;
      var hasDump = false;
      var hasScene = false;
      var hasThree = false;
      try {
        hasDump = typeof w.__cldJointDump === 'function';
        hasScene = !!w.__cldAdminScene;
        hasThree = !!w.THREE;
      } catch (_) {}
      if (hasDump && w !== global) {
        var r = null;
        try {
          r = w.__cldJointDump(side || 'admin');
        } catch (e) {
          report.push({ src: frames[i].src, ошибка: String(e && e.message) });
          continue;
        }
        if (r) return r;
      }
      report.push({
        src: frames[i].src,
        'есть замер': hasDump,
        'есть сцена': hasScene,
        THREE: hasThree,
      });
    }
    if (report.length) {
      console.error('[CLD][DUMP] Ни один iframe не дал замер:');
      if (console.table) console.table(report);
    } else {
      console.error('[CLD][DUMP] На странице нет доступных iframe (same-origin).');
    }
    return null;
  }

  function dump(side, explicitRoot) {
    var THREE_ = three();
    if (!explicitRoot && !findAdminRoot() && !findRoomRoot()) {
      var viaFrame = dumpInAdminFrame(side);
      if (viaFrame) return viaFrame;
    }
    if (!THREE_) {
      console.error('[CLD][DUMP] THREE недоступен');
      return null;
    }
    var res = resolveRoot(side, explicitRoot);
    if (!res.root) {
      console.error(
        '[CLD][DUMP] Не нашёл модуль. В комнате поставь модуль, в админке открой карточку.',
      );
      return null;
    }
    var realSide = side || res.side;
    var data = collect(res.root, sceneUnitsMm(realSide));
    data.side = realSide;
    data.rootName = String(res.root.name || '');
    data.at = new Date().toISOString();
    try {
      global.localStorage.setItem(LS_PREFIX + realSide, JSON.stringify(data));
    } catch (_) {}
    console.warn(
      '[CLD][DUMP] ' +
        realSide +
        ': крепёж=' +
        data.joints.length +
        ' опоры=' +
        data.legs +
        ' корпус(мм)=' +
        JSON.stringify(data.corpusMm),
    );
    if (console.table) console.table(data.joints);
    return data;
  }

  function load(side) {
    try {
      var raw = global.localStorage.getItem(LS_PREFIX + side);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  /** Имя модели есть не везде (в админке пусто) — опора сравнения это id. */
  function keyOf(row) {
    return 'id:' + (row.modelId || row.model || '?');
  }

  function groupBy(rows) {
    var m = new Map();
    rows.forEach(function (r) {
      var k = keyOf(r);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
    });
    return m;
  }

  function pct(row, corpus) {
    return row.posMm.map(function (v, i) {
      var c = corpus && corpus[i] ? corpus[i] : 0;
      return c ? Math.round((v / c) * 1000) / 10 : 0;
    });
  }

  /**
   * Габарит крепежа абсолютный: конфирмат 7×50 одинаков при любом размере модуля.
   * Позиция — в % корпуса, иначе разные размеры модуля дают ложные расхождения.
   */
  function diffRow(a, b, ca, cb, corpusSame) {
    var bad = [];
    var pa = pct(a, ca);
    var pb = pct(b, cb);
    for (var i = 0; i < 3; i++) {
      if (Math.abs(a.sizeMm[i] - b.sizeMm[i]) > TOL_MM) bad.push('габарит' + 'XYZ'[i]);
      var dr = Math.abs(a.rotDeg[i] - b.rotDeg[i]);
      if (Math.min(dr, 360 - dr) > TOL_DEG) bad.push('поворот' + 'XYZ'[i]);
      if (corpusSame) {
        if (Math.abs(a.posMm[i] - b.posMm[i]) > TOL_MM) bad.push('позиция' + 'XYZ'[i]);
      } else if (Math.abs(pa[i] - pb[i]) > 1) {
        bad.push('позиция' + 'XYZ'[i] + '%');
      }
    }
    return { bad: bad, pa: pa, pb: pb };
  }

  function diff() {
    var a = load('admin');
    var b = load('room');
    if (!a || !b) {
      console.error(
        '[CLD][DIFF] Нужны обе выгрузки. В админке __cldJointDump("admin"), в комнате __cldJointDump("room").',
      );
      return null;
    }
    var ga = groupBy(a.joints);
    var gb = groupBy(b.joints);
    var keys = new Set([].concat(Array.from(ga.keys()), Array.from(gb.keys())));
    var out = [];
    var corpusSame =
      !!a.corpusMm &&
      !!b.corpusMm &&
      a.corpusMm.every(function (v, i) {
        return Math.abs(v - b.corpusMm[i]) <= TOL_MM;
      });
    var sortByPct = function (corpus) {
      return function (x, y) {
        var px = pct(x, corpus);
        var py = pct(y, corpus);
        for (var i = 0; i < 3; i++) if (px[i] !== py[i]) return px[i] - py[i];
        return 0;
      };
    };
    keys.forEach(function (k) {
      var la = (ga.get(k) || []).slice().sort(sortByPct(a.corpusMm));
      var lb = (gb.get(k) || []).slice().sort(sortByPct(b.corpusMm));
      if (la.length !== lb.length) {
        out.push({ модель: k, проблема: 'разное количество', админка: la.length, комната: lb.length });
      }
      var n = Math.min(la.length, lb.length);
      for (var i = 0; i < n; i++) {
        var d = diffRow(la[i], lb[i], a.corpusMm, b.corpusMm, corpusSame);
        if (!d.bad.length) continue;
        out.push({
          модель: k,
          проблема: d.bad.join(','),
          'админка мм | %':
            JSON.stringify(la[i].posMm) + ' | ' + JSON.stringify(d.pa),
          'комната мм | %':
            JSON.stringify(lb[i].posMm) + ' | ' + JSON.stringify(d.pb),
        });
      }
    });
    if (!corpusSame) {
      console.warn(
        '[CLD][DIFF] Корпус разный: админка ' +
          JSON.stringify(a.corpusMm) +
          ' vs комната ' +
          JSON.stringify(b.corpusMm) +
          '. Позиции сверяю в % корпуса, габарит крепежа — в мм.',
      );
      if (console.table) {
        console.warn('[CLD][DIFF] Состав корпуса — АДМИНКА');
        console.table(a.corpusParts || []);
        console.warn('[CLD][DIFF] Состав корпуса — КОМНАТА');
        console.table(b.corpusParts || []);
      }
    }
    if (a.legs !== b.legs) {
      out.unshift({ модель: 'ОПОРЫ', проблема: 'разное количество', админка: a.legs, комната: b.legs });
    }
    if (!out.length) {
      console.warn('[CLD][DIFF] ПАРИТЕТ: админка и комната совпадают (допуск 1мм / 1°).');
    } else {
      console.error('[CLD][DIFF] РАСХОЖДЕНИЙ: ' + out.length);
      if (console.table) console.table(out);
    }
    return { rows: out, admin: a, room: b };
  }

  global.__cldJointDump = dump;
  global.__cldJointDiff = diff;
})(typeof window !== 'undefined' ? window : globalThis);
