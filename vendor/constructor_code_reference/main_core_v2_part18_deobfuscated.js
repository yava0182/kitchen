return sc['find_groups'](J, null, (az, aA) => {}
, (az, aA, aB, aC) => {
  var aD, aE, aF;
  return az['axis'] === aA['axis'] && az['materialId'] === aA['materialId'] && (aD = 0.05,
  aF = 'x' === (aE = az['axis']['slice'](-1)) ? 'z' : 'x',
  aB['copy'](az['box']),
  aC['copy'](aA['box']),
  !(aB['max'][aF] + aD < aC['min'][aF] || aB['min'][aF] - aD > aC['max'][aF])) && Math['abs'](aB['min'][aE] - aC['min'][aE]) < aD && Math['abs'](aB['max'][aE] - aC['max'][aE]) < aD && Math['abs'](aB['min']['y'] - aC['min']['y']) < aD;
}
, (az, aA, aB) => {
  aA['copy'](az[0]['box']);
  for (let aG = 1; aG < az.length; aG++)
  aA['union'](az[aG]['box']);
  var aC = az[0]['axis']['slice'](-1), aD, aE;
  return {
    'size': new THREE['Vector3'](aF(aA, 'x' === aC ? 'z' : 'x'),aF(aA, 'y'),aF(aA, aC)),
    'axis': az[0]['axis'],
    'groupObject': null,
    'materialId': az[0]['materialId']
  };
  function aF(aH, aI) {
    let aJ = aH['max'][aI] - aH['min'][aI];
    return (!Number['isFinite'](aJ) || aJ < 0) && (aJ = 0),
    Math['round'](aJ * units);
  }
}
);
function as(az, aA) {
  var aB;
  return aA ? 'f' === az ? [aA['c1'] + aA['c4'], (aA['c1'] - aA['c4']) / 2] : 'b' === az ? [aA['c2'] + aA['c3'], (aA['c2'] - aA['c3']) / 2] : 'l' === az ? [aA['c3'] + aA['c4'], (aA['c3'] - aA['c4']) / 2] : 'r' === az ? [aA['c2'] + aA['c1'], (aA['c2'] - aA['c1']) / 2] : [0, 0] : [0, 0];
}
function at(az, aA) {
  var az = (pp['libs']['bort'] || libs['tabletop_plints'])?.['get_item'](az), aB = {
    'bortHeight': void 0,
    'bortDepth': void 0
  }, aC, az;
  return az && az['params'] && (aC = parseInt(az['params']['height']) / units,
  az = parseInt(az['params']['depth']) / units,
  Number['isFinite'](aC)) && Number['isFinite'](az) && (aB['bortHeight'] = aC,
  aB['bortDepth'] = az),
  aA && (void 0 === aB['bortHeight'] && (aB['bortHeight'] = aA['bortHeight']),
  void 0 === aB['bortDepth']) && (aB['bortDepth'] = aA['bortDepth']),
  aB;
}
}
,
sc['find_cornice_groups'] = function() {
  var q = !constructor_settings['core_v2'], A = 0.05, B = [], C = new THREE['Box3'](), F = new THREE['Vector3'](), G = new THREE['Vector3'](), H = d_objects, I, J, K, L;
  if (0 == constructor_settings['cornice_available'] || 0 == project_settings['cornice_available'])
  return [];
  for (I of H)
  if ('Cabinet' === I['params']['type']) {
    var N = I['params']['cornice'];
    if (N && N['enabled'] && I['params']['cabinet'] && ('bottom' !== I['params']['cabinet_group'] || !I['params']['tabletop'] || true !== I['params']['tabletop']['active']) && (N['visible']['front'] || N['visible']['left'] || N['visible']['right'])) {
      var O = pp['libs']['cornice']['get_item'](N['model']), P = O['params']['depth'], O = O['params']['height'], Q = I['params']['cabinet']['thickness'] || 0, R = q ? I['box']['getSize'](new THREE['Vector3']())['multiplyScalar'](units) : I['userData']['computed']['size'], S = P - Q, T = I['get_forward'](), U = Math['abs'](Math['abs'](T['z']) - 1) < A ? 'z' : 'x', T = Math['sign'](T[U]), W = 'z' == U ? 'x' : 'z', Z = 'z' == U ? T : -T, a0, a1, a2, a3, a3, a3, a4, a3, a5, a6, a5, S;
      if (N['visible']['front']) {
        var a7, a1 = R['x'];
        let a8 = 0
        , a9 = 0;
        N['visible']['left'] && (a9 = S),
        a1 += (a8 = N['visible']['right'] ? S : a8) + a9,
        G[W] = a1 / units,
        G['y'] = O / units,
        G[U] = P / units,
        F[W] = I['position'][W] + Z * (a8 - a9) / 2 / units,
        F['y'] = I['position']['y'] + R['y'] / units + G['y'] / 2,
        F[U] = I['position'][U] + T * (R['z'] / 2 / units + G[U] / 2 - Q / units + N['offset_front'] / 2 / units),
        C['setFromCenterAndSize'](F, G);
        var a1 = {
          'type': 'fake_obj',
          'userData': {},
          'box': C['clone'](),
          'axis': (T < 0 ? '-' : '') + U,
          'modelId': N['model'],
          'materialId': N['material'],
          'offsetLeft': a8,
          'offsetRight': a9,
          'sourceObject': I
        };
        B.push(a1);
      }
      N['visible']['right'] && (a1 = R['z'] + N['offset_front'],
      a1 += (a3 = a2 = 0) + (a3 = S),
      G[U] = a1 / units,
      G['y'] = O / units,
      G[W] = P / units,
      F[W] = I['position'][W] + Z * (R['x'] / 2 / units + G[W] / 2 - Q / units),
      F['y'] = I['position']['y'] + R['y'] / units + G['y'] / 2,
      F[U] = I['position'][U] + T * (a3 + N['offset_front']) / 2 / units,
      C['setFromCenterAndSize'](F, G),
      a3 = {
        'type': 'fake_obj',
        'userData': {},
        'box': C['clone'](),
        'axis': (T < 0 ? '-' : '') + W,
        'modelId': N['model'],
        'materialId': N['material'],
        'offsetLeft': 0,
        'offsetRight': a3,
        'sourceObject': I
      },
      B.push(a3)),
      N['visible']['left'] && (a3 = R['z'] + N['offset_front'],
      a3 += (a6 = a5 = 0) + (a5 = S),
      G[U] = a3 / units,
      G['y'] = O / units,
      G[W] = P / units,
      F[W] = I['position'][W] - Z * (R['x'] / 2 / units + G[W] / 2 - Q / units),
      F['y'] = I['position']['y'] + R['y'] / units + G['y'] / 2,
      F[U] = I['position'][U] - T * (0 - a5 + N['offset_front']) / 2 / units,
      C['setFromCenterAndSize'](F, G),
      S = {
        'type': 'fake_obj',
        'userData': {},
        'box': C['clone'](),
        'axis': (0 < T ? '-' : '') + W,
        'modelId': N['model'],
        'materialId': N['material'],
        'offsetLeft': a5,
        'offsetRight': 0,
        'sourceObject': I
      },
      B.push(S));
    }
  }
  return sc['find_groups'](B, null, (aa, ab) => {}
  , (aa, ab, ac, ad) => {
    var ae, af, ag, ah, ai, ah, ai, ah, aj, ah;
    return aa['axis'] === ab['axis'] && aa['modelId'] === ab['modelId'] && aa['materialId'] === ab['materialId'] && (ae = 0.05,
    ah = (af = aa['box'])['max']['y'] - af['min']['y'],
    ai = (ag = ab['box'])['max']['y'] - ag['min']['y'],
    !(Math['abs'](ah - ai) > ae || Math['abs'](af['min']['y'] - ag['min']['y']) > ae || (ah = aa['axis']['slice'](-1),
    af['max'][ai = 'x' === ah ? 'z' : 'x'] + ae < ag['min'][ai]) || af['min'][ai] - ae > ag['max'][ai] || !(Math['abs'](af['min'][ah] - ag['min'][ah]) < ae) || !(Math['abs'](af['max'][ah] - ag['max'][ah]) < ae) || (aj = (ah = 'z' === aa['axis'] || '-x' === aa['axis']) ? 'offsetRight' : 'offsetLeft',
    aa[ah = ah ? 'offsetLeft' : 'offsetRight'] && ak(af['max'][ai] - aa[ah] / units + ae, ag['min'][ai], ag['max'][ai])) || aa[aj] && ak(af['min'][ai] + aa[aj] / units - ae, ag['min'][ai], ag['max'][ai]) || ab[ah] && ak(ag['max'][ai] - ab[ah] / units + ae, af['min'][ai], af['max'][ai]) || ab[aj] && ak(ag['min'][ai] + ab[aj] / units - ae, af['min'][ai], af['max'][ai])));
    function ak(al, am, an) {
      return am <= al && al <= an;
    }
  }
  , (aa, ab, ac) => {
    ab['copy'](aa[0]['box']);
    let ad = aa[0]['offsetLeft']
    , ae = aa[0]['offsetRight'];
    for (let ah = 1; ah < aa.length; ah++)
    ab['union'](aa[ah]['box']),
    aa[ah]['offsetLeft'] > ad && (ad = aa[ah]['offsetLeft']),
    aa[ah]['offsetRight'] > ae && (ae = aa[ah]['offsetRight']);
    var af = 'x' === aa[0]['axis']['slice'](-1) ? 'z' : 'x';
    let ag = ab['max'][af] - ab['min'][af];
    return (!Number['isFinite'](ag) || ag < 0) && (ag = 0),
    {
      'width': ag = c_round(ag * units),
      'axis': aa[0]['axis'],
      'modelId': aa[0]['modelId'],
      'materialId': aa[0]['materialId'],
      'offsetLeft': ad,
      'offsetRight': ae
    };
  }
  );
}
,
sc['show_groups_sizes'] = function(f, g, h) {
  if (!f)
  throw new Error('groupLabel\x20can\x27t\x20be\x20empty!');
  global_data['kitchen_sizes'] || (global_data['kitchen_sizes'] = {}),
  sc['hide_groups_sizes'](f);
  var j = [];
  if (global_data['kitchen_sizes'][f] = j,
  g) {
    h = (h || 1) / units;
    var k = new THREE['Group'](), m = (scene['add'](k),
    j.push(k),
    new THREE['Vector3']()), p = new THREE['Vector3'](), q;
    for (q of g) {
      q['box']['getSize'](m),
      q['box']['getCenter'](p);
      var u = new Sizes_obj({
        'width': m['x'],
        'text': Math['round'](m['x'] * units),
        'font_size': 50,
        'line_thickness': h
      })
      , u = (u['position']['set'](0, -m['y'] / 2 + 0.04, m['z'] / 2 - 0.4),
      u['position']['add'](p),
      u['rotation']['x'] = Math['PI'] / 2,
      u['rotation']['y'] = Math['PI'],
      k['add'](u),
      new Sizes_obj({
        'width': m['y'],
        'text': Math['round'](m['y'] * units),
        'font_size': 50,
        'line_thickness': h
      }))
      , u = (u['position']['set'](m['x'] / 2, 0, -m['z'] / 2 + 0.4),
      u['position']['add'](p),
      u['rotation']['z'] = -Math['PI'] / 2,
      k['add'](u),
      new Sizes_obj({
        'width': m['z'],
        'text': Math['round'](m['z'] * units),
        'font_size': 50,
        'line_thickness': h
      }));
      u['position']['set'](m['x'] / 2 + 0.04, -m['y'] / 2 + 0.04, 0),
      u['position']['add'](p),
      u['rotation']['z'] = -Math['PI'] / 2,
      u['rotation']['x'] = -Math['PI'] / 2,
      k['add'](u);
    }
  }
}
,
sc['hide_groups_sizes'] = function(f) {
  if (global_data['kitchen_sizes'] || (global_data['kitchen_sizes'] = {}),
  global_data['kitchen_sizes'][f])
  for (var g of global_data['kitchen_sizes'][f]) {
    for (var h of g['children'])
    h instanceof Sizes_obj && h['full_dispose']();
    scene['remove'](g);
  }
}
,
sc['highlight_groups'] = function(f) {
  if (global_data['highlight_groups']) {
    for (var g of global_data['highlight_groups'])
    scene['remove'](g);
  }
  var h = [];
  if (global_data['highlight_groups'] = h,
  f) {
    var j = new THREE['Group'](), k = (scene['add'](j),
    h.push(j),
    new THREE['Vector3']()), l;
    for (l of f) {
      l['box']['getSize'](k);
      var m = new SizeBox({
        'width': k['x'],
        'height': k['y'],
        'depth': k['z']
      });
      l['box']['getCenter'](k),
      m['position']['copy'](k),
      j['add'](m);
    }
  }
}
,
sc['update_kitchen_sizes'] = function() {
  var e;
  global_options['kitchen_sizes_visible'] ? (e = sc['find_groups'](d_objects),
  sc['show_groups_sizes']('kitchen', e, 4)) : sc['hide_groups_sizes']('kitchen');
}
,
(sc['change_material_group'] = function(f, g, h, i) {}
,
sc['change_material_groups'] = function(f) {
  for (var g of d_objects)
  'function' == typeof g['change_material_group'] && g['change_material_group'](f);
  sc['get_price']();
}
,
sc['change_facade_v2'] = function(g=0, h=[]) {
  var j = pp['project_settings']['kitchen']['defaults']['facades'];
  for (let z = h.length; z--; ) {
    var k = h[z], n = j[k]['materials']['gen'], o = pp['libs']['facades']['find_item'](j[k]['id']), p, q = facades_lib['find_item'](g)['materials'];
    let A = n;
    pp['libs']['decors']['check_material_in_categories'](n, q) || (A = pp['libs']['decors']['get_first_item'](q[0])['id']),
    j[k]['id'] = g,
    j[k]['materials']['gen'] = A;
  }
  for (let B = d_objects.length; B--; )
  if ('module' === d_objects[B]['userData']['params']?.['type']) {
    var v = d_objects[B]
    , w = v['userData']['params']['spec']['cabinet_tag'];
    if (w && h['includes'](w)) {
      let C = j[w]['materials']['gen'] || 0;
      var w = v['get_defaults_param']('facade.id'), w, x;
      v['set_defaults_param']('facade.id', parseInt(g)),
      !is_empty_id(w) && (w = v['get_defaults_param']('facade.materials.gen'),
      module_utils['can_change_facade_material'](g, w)) || v['set_defaults_param']('facade.materials.gen', parseInt(C)),
      module_utils['walk_params_tree'](v, (F, G) => {
        G || 'module' !== F['type'] || (module_utils['set_defaults_param'](F, 'facade.id', parseInt(g)),
        module_utils['set_defaults_param'](F, 'facade.materials.gen', parseInt(C)));
      }
      ),
      v['_build_defaults']();
      for (x of v['userData']['parts']['module'])
      module_utils['set_defaults_param'](x, 'facade.id', parseInt(g)),
      module_utils['set_defaults_param'](x, 'facade.materials.gen', parseInt(C)),
      x['_build_defaults']();
      let D = false
      , E = (v['walk_params_tree'](F => {
        if ('facade' === F['type'] && F['spec']['can_change']?.['id']) {
          F['spec']['id'] = g;
          let G = true;
          (G = isNaN(parseInt(F['spec']['type'])) && module_utils['get_facade_type'](F['spec']['id'], F['spec']['type']) ? false : G) && (F['spec']['type'] = 'full'),
          F['spec']['materials'] && (F['spec']['materials']['gen'] = parseInt(C)),
          D = true;
        }
      }
      ),
      false);
      if (!(E = v['userData']['params']['variables']?.['main']?.[pp['const']['vars']['facade_thickness']] ? true : E)) {
        for (var y of v['userData']['parts']['module'])
        if (!E && y['userData']['params']['variables']?.['main']?.[pp['const']['vars']['facade_thickness']]) {
          E = true;
          break;
        }
      }
      D && !E && v['_rebuild_parts_by_type']('facade'),
      E && v['_rebuild']();
    }
  }
  sc['get_price']();
}
,
sc['change_facade_material_v2'] = function(f, g, h, j=[]) {
  if (constructor_settings['core_v2']) {
    var k = project_settings['kitchen']['defaults']['facades'], m, n;
    for (m of j) {
      k[m] ? (n = k[m],
      module_utils['can_change_facade_material'](n['id'], h) && (n['materials'][g] = h)) : k[m] = {
        'id': f,
        'materials': {
          [g]: h
        }
      };
    }
  }
  for (let u = 0; u < d_objects.length; u++) {
    var o = d_objects[u];
    if ('module' === o['userData']['params']?.['type']) {
      ce(123);
      var p = o['userData']['params']['spec']['cabinet_tag'];
      if (p && j['includes'](p)) {
        let v = parseInt(h)
        , w = o['get_defaults_param']('facade.id');
        is_empty_id(w) ? (w = parseInt(f),
        o['set_defaults_param']('facade.id', w),
        o['set_defaults_param']('facade.materials.' + g, v)) : module_utils['can_change_facade_material'](w, h) && o['set_defaults_param']('facade.materials.' + g, v),
        module_utils['walk_params_tree'](o, (x, y) => {
          if (!y && 'module' === x['type']) {
            let z = module_utils['get_defaults_param'](x, 'facade.id');
            is_empty_id(z) ? (z = parseInt(f),
            module_utils['set_defaults_param'](x, 'facade.id', z),
            module_utils['set_defaults_param'](x, 'facade.materials.' + g, v)) : module_utils['can_change_facade_material'](z, h) && module_utils['set_defaults_param'](x, 'facade.materials.' + g, v);
          }
        }
        );
        for (var q of o['userData']['parts']['module']) {
          let x = module_utils['get_defaults_param'](q, 'facade.id');
          is_empty_id(x) ? (x = parseInt(f),
          module_utils['set_defaults_param'](q, 'facade.id', x),
          module_utils['set_defaults_param'](q, 'facade.materials.' + g, v)) : module_utils['can_change_facade_material'](x, h) && module_utils['set_defaults_param'](q, 'facade.materials.' + g, v);
        }
        module_utils['change_facade_material'](o, f, g, h);
      }
    }
  }
  'function' == typeof change_facade_material_callback && change_facade_material_callback(params),
  get_total_price_test(),
  autosave();
}
),
(sc['set_ruler_mode'] = (f, g) => {
  if (dControls['clear_hovered'](),
  0 == f) {
    global_options['mouse_mode']['mode'] = 'drag',
    global_options['mouse_mode']['target'] = null,
    global_options['mouse_mode']['is_quick'] = null,
    0 == project_settings['rulers_visible'] && (scene['userData']['rulers']['visible'] = false);
    for (let h = 0; h < room['active_objects']['length']; h++)
    'function' == typeof room['active_objects'][h]['hide_ruler_points'] && room['active_objects'][h]['hide_ruler_points']();
  } else {
    0 == project_settings['rulers_visible'] && (scene['userData']['rulers']['visible'] = true),
    global_options['mouse_mode']['mode'] = 'ruler',
    global_options['mouse_mode']['target'] = f,
    global_options['mouse_mode']['is_quick'] = g;
    let i = [];
    for (let j = room['active_objects']['length']; j--; )
    'function' == typeof room['active_objects'][j]['get_ruler_points'] && (i = i['concat'](room['active_objects'][j]['get_ruler_points']())),
    'function' == typeof room['active_objects'][j]['show_ruler_points'] && room['active_objects'][j]['show_ruler_points']();
  }
}
,
sc['set_rulers_visible'] = f => {
  project_settings['rulers_visible'] = to_int(f);
  var g = 1 == f;
  scene['userData']['rulers']['visible'] = g;
  for (let h = scene['userData']['rulers']['children']['length']; h--; )
  scene['userData']['rulers']['children'][h]['userData']['label']['visible'] = g;
}
,
sc['load_rulers'] = () => {
  project_settings['rulers'] && Object['keys'](project_settings['rulers'])['forEach'](f => {
    var g = f.split('::')
    , h = g[0]['split']('_')
    , g = g[1]['split']('_')
    , j = h[0]
    , h = h[1]
    , k = g[0]
    , g = g[1]
    , m = sc['get_object_by_obj_id'](j)
    , p = m['get_ruler_point'](h)['getWorldPosition']()
    , q = sc['get_object_by_obj_id'](k)
    , v = q['get_ruler_point'](g)['getWorldPosition']()
    , w = new Ruler_obj({
      'points': f,
      'p1': p,
      'p2': v
    });
    scene['userData']['rulers']['add'](w),
    global_data['rulers']['items'][f] = {
      'p1': p,
      'p2': v,
      'obj': w
    },
    global_data['rulers']['items'][f][j] = {
      'obj': m,
      'point_id': h
    },
    global_data['rulers']['items'][f][k] = {
      'obj': q,
      'point_id': g
    };
  }
  );
}
,
sc['build_ruler'] = f => {
  var g = global_data['rulers']['items'][f]['obj']
  , h = f.split('::')
  , i = h[0]['split']('_')
  , h = h[1]['split']('_')
  , i = global_data['rulers']['items'][f][i[0]]['obj']['get_ruler_point'](i[1])['getWorldPosition']()
  , f = global_data['rulers']['items'][f][h[0]]['obj']['get_ruler_point'](h[1])['getWorldPosition']();
  g['rebuild']({
    'p1': i,
    'p2': f
  });
}
,
sc['add_ruler'] = f => {
  var g, h;
  global_data['rulers']['items'][f[0]['id'] + '::' + f[1]['id']] || global_data['rulers']['items'][f[1]['id'] + '::' + f[0]['id']] || (g = f[0]['id'] + '::' + f[1]['id'],
  project_settings['rulers'] || (project_settings['rulers'] = {}),
  project_settings['rulers'][g] = 1,
  h = new Ruler_obj({
    'points': g,
    'p1': f[0]['point'],
    'p2': f[1]['point']
  }),
  scene['userData']['rulers']['add'](h),
  global_data['rulers']['items'][g] = {
    'p1': f[0]['point'],
    'p2': f[1]['point'],
    'obj': h
  },
  global_data['rulers']['items'][g][f[0]['parent_id']] = {
    'obj': f[0]['parent'],
    'point_id': f[0]['point_id']
  },
  global_data['rulers']['items'][g][f[1]['parent_id']] = {
    'obj': f[1]['parent'],
    'point_id': f[0]['point_id']
  },
  1 == global_options['mouse_mode']['is_quick'] && (sc['set_ruler_mode'](0),
  pp['interface']['root']['$emit']('set_ruler_mode', 0)));
}
,
sc['update_rulers'] = f => {
  var g = Object['keys'](global_data['rulers']['items']);
  if (g.length)
  for (let i = g.length; i--; ) {
    var h = g[i];
    -1 < h['indexOf'](f) && sc['build_ruler'](h);
  }
}
,
sc['update_rulers_group'] = f => {
  var g = Object['keys'](global_data['rulers']['items']);
  if (g.length)
  for (let j = f.length; j--; ) {
    var h = f[j];
    for (let k = g.length; k--; ) {
      var i = g[k];
      -1 < i['indexOf'](h) && sc['build_ruler'](i);
    }
  }
}
,
sc['clear_rulers'] = () => {
  Object['keys'](global_data['rulers']['items'])['forEach'](f => {
    sc['remove_ruler'](f);
  }
  );
}
,
sc['remove_rulers'] = f => {
  var g = Object['keys'](global_data['rulers']['items']);
  if (g.length)
  for (let i = g.length; i--; ) {
    var h = g[i];
    -1 < h['indexOf'](f) && sc['remove_ruler'](h);
  }
}
,
sc['remove_ruler'] = f => {
  global_data['rulers']['items'][f]['obj']['full_dispose'](),
  delete global_data['rulers']['items'][f],
  delete project_settings['rulers'][f];
}
,
sc['grid_mode'] = f => {
  1 == f ? (sc['draw_grid'](),
  scene['userData']['grid']['visible'] = true,
  global_options['grid']['active'] = 1) : (scene['userData']['grid']['clear'](),
  scene['userData']['grid']['visible'] = false,
  global_options['grid']['active'] = 0);
}
,
sc['draw_grid'] = () => {
  scene['userData']['grid']['userData']['by_axis'] = {
    'x': [],
    'y': [],
    'z': []
  };
  for (let p = scene['userData']['grid']['children']['length']; p--; )
  scene['userData']['grid']['children'][p]['geometry'] && scene['userData']['grid']['children'][p]['geometry']['dispose'](),
  scene['userData']['grid']['remove'](scene['userData']['grid']['children'][p]);
  var f = room['params']['width'] / global_options['grid']['grid_x']
  , g = room['params']['depth'] / global_options['grid']['grid_z']
  , h = misc_mats['grid_line']
  , j = [];
  j.push(new THREE['Vector3'](0,0,0)),
  j.push(new THREE['Vector3'](0,0,room['params']['depth'] / units));
  for (let q = 0; q <= f; q++) {
    var k = new THREE['BufferGeometry']()['setFromPoints'](j)
    , k = new THREE['Line'](k,h);
    k['position']['set'](global_options['grid']['grid_x'] / units * q, 0.2, 0),
    k['userData']['axis'] = 'x',
    k['box'] = new THREE['Box3']()['setFromObject'](k),
    scene['userData']['grid']['userData']['by_axis']['x']['push'](k),
    scene['userData']['grid']['add'](k);
  }
  var m = [];
  m.push(new THREE['Vector3'](0,0,0)),
  m.push(new THREE['Vector3'](room['params']['width'] / units,0,0));
  for (let u = 0; u <= g; u++) {
    var n = new THREE['BufferGeometry']()['setFromPoints'](m)
    , n = new THREE['Line'](n,h);
    n['position']['set'](0, 0.2, global_options['grid']['grid_z'] / units * u),
    n['userData']['axis'] = 'z',
    n['box'] = new THREE['Box3']()['setFromObject'](n),
    scene['userData']['grid']['userData']['by_axis']['z']['push'](n),
    scene['userData']['grid']['add'](n);
  }
}
,
sc['set_grid'] = (f, g) => {
  global_options['grid']['grid_' + f] = g,
  sc['draw_grid']();
}
,
sc['set_guides_mode'] = (f, g=0) => {
  dControls['clear_hovered'](),
  0 == f ? (global_options['mouse_mode']['mode'] = 'drag',
  global_options['mouse_mode']['target'] = null,
  global_options['mouse_mode']['is_quick'] = null,
  global_options['mouse_mode']['style'] = null,
  scene['userData']['temp_line'] && (scene['userData']['temp_line']['geometry']['dispose'](),
  scene['userData']['temp']['remove'](scene['userData']['temp_line'])),
  0 == project_settings['guides_visible'] && (scene['userData']['guides']['visible'] = false),
  scene['userData']['ruler']['hide']()) : (3 == f && (scene['userData']['ruler']['hide'](),
  scene['userData']['temp_line']) && (scene['userData']['temp_line']['geometry']['dispose'](),
  scene['userData']['temp']['remove'](scene['userData']['temp_line'])),
  global_options['mouse_mode']['mode'] = 'guides',
  global_options['mouse_mode']['target'] = f,
  global_options['mouse_mode']['is_quick'] = g,
  0 == project_settings['guides_visible'] && (scene['userData']['guides']['visible'] = true));
}
,
sc['set_guides_visible'] = f => {
  project_settings['guides_visible'] = to_int(f),
  scene['userData']['guides']['visible'] = 1 == f;
}
,
sc['set_camera_mode'] = f => {
  0 == f ? (global_options['mouse_mode']['mode'] = 'drag',
  global_options['mouse_mode']['target'] = null,
  global_options['mouse_mode']['is_quick'] = null,
  global_options['mouse_mode']['style'] = null,
  scene['userData']['temp_line'] && (scene['userData']['temp_line']['geometry']['dispose'](),
  scene['userData']['temp']['remove'](scene['userData']['temp_line'])),
  0 == project_settings['guides_visible'] && (scene['userData']['guides']['visible'] = false),
  scene['userData']['ruler']['hide']()) : global_options['mouse_mode']['mode'] = 'camera';
}
,
sc['add_guide'] = (f, g, h, i, j, k) => {
  var g = draw_line(g, h, misc_mats['grid_line']);
  g['userData']['pos'] = i,
  g['userData']['wall'] = j,
  g['userData']['mode'] = k,
  g['position']['copy'](i),
  g['userData']['axis'] = f,
  g['box'] = new THREE['Box3']()['setFromObject'](g),
  scene['userData']['guides']['userData']['by_axis'][f]['push'](g),
  scene['userData']['guides']['add'](g);
}
,
sc['clear_guides'] = () => {
  scene['userData']['guides']['clear']();
}
,
sc['remove_guide'] = f => {
  scene['userData']['guides']['remove'](f);
}
,
sc['update_guides'] = () => {}
,
sc['rebuild_guides'] = () => {
  var f = [];
  for (let n = scene['userData']['guides']['children']['length']; n--; ) {
    var g = scene['userData']['guides']['children'][n]
    , h = new THREE['Vector3']()
    , j = new THREE['Vector3']();
    let p = 'x';
    var k = g['userData']['wall']
    , m = g['userData']['mode'];
    switch (g['userData']['wall']) {
      case 'floor':
      1 == m ? (h['z'] = 0,
      j['z'] = room['params']['depth'] / units) : 2 == m && (h['x'] = 0,
      j['x'] = room['params']['width'] / units,
      p = 'z'),
      h['y'] += 0.2,
      j['y'] += 0.2;
      break;
      case 'left_wall':
      1 == m && (p = 'z',
      h['y'] = 0,
      j['y'] = room['params']['height'] / units),
      2 == m && (p = 'y',
      h['z'] = 0,
      j['z'] = room['params']['depth'] / units),
      h['x'] += 0.2,
      j['x'] += 0.2;
      break;
      case 'right_wall':
      1 == m && (p = 'z',
      h['y'] = 0,
      j['y'] = room['params']['height'] / units),
      2 == m && (p = 'y',
      h['z'] = 0,
      j['z'] = room['params']['depth'] / units),
      h['x'] -= 0.2,
      j['x'] -= 0.2;
      break;
      case 'front_wall':
      1 == m ? (h['y'] = 0,
      j['y'] = room['params']['height'] / units) : 2 == m && (h['x'] = 0,
      j['x'] = room['params']['width'] / units,
      p = 'y'),
      h['z'] += 0.2,
      j['z'] += 0.2;
      break;
      case 'back_wall':
      1 == m ? (h['y'] = 0,
      j['y'] = room['params']['height'] / units) : 2 == m && (h['x'] = 0,
      j['x'] = room['params']['width'] / units,
      p = 'y'),
      h['z'] -= 0.2,
      j['z'] -= 0.2;
      break;
    }
    f.push({
      'axis': p,
      'p1': h,
      'p2': j,
      'pos': g['position']['clone'](),
      'wall': k,
      'mode': m
    });
  }
  sc['clear_guides']();
  for (let q = 0; q < f.length; q++)
  sc['add_guide'](f[q]['axis'], f[q]['p1'], f[q]['p2'], f[q]['pos'], f[q]['wall'], f[q]['mode']);
}
),
(sc['build_tabletop'] = function() {
  constructor_settings['core_v2'] ? sc['need_update_tabletops']() : constructor_settings['tabletop_v2'] && (sc['build_tabletop_debounced'](),
  sc['build_tabletop_debounced']['flush']());
}
,
sc['washer_related_tabletops_mark_rebuild'] = function(f) {
  if (!global_data['tabletop']['items']?.['length'])
  return false;
  let g = false;
  var h = new THREE['Box3']()['setFromObject'](f), i;
  for (i of global_data['tabletop']['items'])
  i['userData']['tabletop_need_rebuild'] || h['intersectsBox'](i['get_box']()) && (i['userData']['tabletop_need_rebuild'] = 1,
  g = true);
  return g;
}
,
sc['washer_drag_start_legacy'] = function(f) {
  var g;
  sc['washer_related_tabletops_mark_rebuild'](f) && sc['build_tabletop']();
}
,
sc['washer_drag_end_legacy'] = function(e) {
  sc['washer_related_tabletops_mark_rebuild'](e);
}
,
sc['build_tabletop_debounced'] = _['debounce'](function() {
  if (!constructor_settings['core_v2'] && constructor_settings['tabletop_v2']) {
    global_data['cokol'] = [];
    var A = [], J = [], K = {}, L = {}, N = {}, Q = {}, a0 = [], a1 = [], a2 = [], a3, a4, a5;
    for (let aG = d_objects.length; aG--; ) {
      'top' == d_objects[aG]['params']['cabinet_group'] || 'Shaft' == d_objects[aG]['temp_type'] || 'CabinetN' == d_objects[aG]['temp_type'] || 'Wall_panel' == (a3 = d_objects[aG])['temp_type'] || 'Cabinet' == a3['temp_type'] && 0 == a3['params']['tabletop']['active'] || 'Cabinet' == a3['temp_type'] && !a3['params']['tabletop']['autogen'] || ('Bardesk' == a3['type'] ? (get_around(a3),
      A.push(a3['model']['tabletop']),
      a0.push(a3['model']['tabletop']),
      a3['model']['leg']instanceof Tabletop && A.push(a3['model']['leg'])) : ('Cabinet' == a3['temp_type'] && a3['params']['washer'] && void 0 !== a3['params']['washer']['id'] && a3['washer']?.['children'][0] && a1.push(a3['washer']['children'][0]),
      'Cabinet' == a3['temp_type'] && 'corner' == a3['params']['cabinet']['type'] ? a2.push(a3) : (a3['box']['update'](),
      (a4 = a3['box']['clone']())['max']['round'](),
      a4['min']['round'](),
      a5 = a3['get_forward'](),
      get_around(a3),
      1 == a5['z'] && (K[a4['min']['z']] || (K[a4['min']['z']] = []),
      K[a4['min']['z']]['push'](a3)),
      -1 == a5['z'] && (L[a4['max']['z']] || (L[a4['max']['z']] = []),
      L[a4['max']['z']]['push'](a3)),
      1 == a5['x'] && (N[a4['min']['x']] || (N[a4['min']['x']] = []),
      N[a4['min']['x']]['push'](a3)),
      -1 == a5['x'] && (Q[a4['max']['x']] || (Q[a4['max']['x']] = []),
      Q[a4['max']['x']]['push'](a3)))));
    }
    let aE = [];
    aF(K, 'x', 'asc', 'front', 0),
    aF(L, 'x', 'desc', 'back', PI),
    aF(N, 'z', 'asc', 'left', PI / 2),
    aF(Q, 'z', 'desc', 'right', -PI / 2);
    for (let aH = (global_data['tabletop']['desc'] = aE)['length']; aH--; ) {
      let aI = new THREE['Box3']();
      Object['keys'](aE[aH]['objs'])['forEach'](aM => {
        var aN = aE[aH]['objs'][aM]['obj'];
        if (aN['params'])
        switch (aN['temp_type']) {
          case 'Cabinet':
          aE[aH]['material'] = aN['params']['tabletop']['tabletop_id'],
          aE[aH]['variant'] = aN['params']['tabletop']['tabletop_variant'],
          aN['tabletop']['visible'] = false;
          for (let aO = aN['tabletop']['children']['length']; aO--; )
          if (aN['tabletop']['children'][aO]instanceof Tabletop) {
            for (let aP = 0; aP < aN['tabletop']['children'][aO]['children']['length']; aP++)
            'Mesh' == aN['tabletop']['children'][aO]['children'][aP]['type'] && aI['expandByObject'](aN['tabletop']['children'][aO]['children'][aP]);
          }
          break;
          case 'Bardesk':
          aE[aH]['material'] = aN['params']['material'];
          for (let aQ = aN['model']['children']['length']; aQ--; )
          aN['model']['children'][aQ]instanceof Tabletop && (aN['model']['children'][aQ]['userData']['tmp_no_hide'] || (aN['model']['children'][aQ]['visible'] = false),
          aI['expandByObject'](aN['model']['children'][aQ]));
          break;
        }
      }
      );
      var a6 = aI['getSize'](new THREE['Vector3']());
      let aJ, aK, aL;
      switch (aE[aH]['axis']) {
        case 'x':
        aJ = a6['x'],
        aL = a6['z'],
        aK = a6['y'];
        break;
        case 'z':
        aJ = a6['z'],
        aL = a6['x'],
        aK = a6['y'];
        break;
      }
      aE[aH]['width'] = aJ * units,
      aE[aH]['height'] = aK * units,
      aE[aH]['depth'] = aL * units,
      aE[aH]['center'] = aI['getCenter'](new THREE['Vector3']())['round'](),
      aE[aH]['pos'] = aI['getCenter'](new THREE['Vector3']()),
      aE[aH]['pos']['y'] -= aK / 2;
    }
    var a7 = 0.05;
    for (let aM = global_data['tabletop']['items']['length']; aM--; ) {
      var a8 = global_data['tabletop']['items'][aM];
      if (a8['parent'] && a8['parent']['parent'] && 'Bardesk' === a8['parent']['parent']['type'])
      a8['parent']['parent']['model'] && a8['parent']['parent']['model']['leg'] !== a8 && (a8['userData']['tabletop_need_rebuild'] && (delete a8['userData']['tabletop_need_rebuild'],
      a8['build']?.()),
      J.push(a8));
      else {
        let aN = 0;
        if (!a8['userData']['tabletop_need_rebuild']) {
          for (let aO = aE.length; aO--; )
          Math['abs'](a8['position']['x'] - aE[aO]['pos']['x']) < a7 && Math['abs'](a8['position']['y'] - aE[aO]['pos']['y']) < a7 && Math['abs'](a8['position']['z'] - aE[aO]['pos']['z']) < a7 && Math['abs'](a8['params']['width'] - aE[aO]['width']) < a7 && '' + a8['params']['id'] == '' + aE[aO]['material'] && '' + a8['params']['variant'] == '' + aE[aO]['variant'] && (aN = 1);
        }
        0 == aN ? a8['parent'] && a8['delete']() : (A.push(a8),
        J.push(a8));
      }
    }
    for (let aP = aE.length; aP--; ) {
      let aQ = 0;
      for (let aR = global_data['tabletop']['items']['length']; aR--; ) {
        var a9 = global_data['tabletop']['items'][aR];
        a9['userData']['tabletop_need_rebuild'] || a9['parent'] && a9['parent']['parent'] && 'Bardesk' === a9['parent']['parent']['type'] || Math['abs'](a9['position']['x'] - aE[aP]['pos']['x']) < a7 && Math['abs'](a9['position']['y'] - aE[aP]['pos']['y']) < a7 && Math['abs'](a9['position']['z'] - aE[aP]['pos']['z']) < a7 && Math['abs'](a9['params']['width'] - aE[aP]['width']) < a7 && '' + a9['params']['id'] == '' + aE[aP]['material'] && '' + a9['params']['variant'] == '' + aE[aP]['variant'] && (aE[aP]['groupObject'] = a9,
        aQ = 1);
      }
      if (1 != aQ) {
        var aa = libs['tabletop']['items'][project_settings['defaults']['tabletop']]
        , ab = {
          'c1': {
            'type': 'straight',
            'val': 0
          },
          'c2': {
            'type': 'straight',
            'val': 0
          },
          'c3': {
            'type': 'straight',
            'val': 0
          },
          'c4': {
            'type': 'straight',
            'val': 0
          }
        };
        if ('Cabinet' == aE[aP]['start']['obj']['temp_type'] && 'Cabinet' == aE[aP]['end']['obj']['temp_type']) {
          if ('front' == aE[aP]['label'] || 'back' == aE[aP]['label']) {
            if ('end_radius_facade' == aE[aP]['start']['obj']['params']['cabinet']['type'] || 'end_radius_open' == aE[aP]['start']['obj']['params']['cabinet']['type']) {
              let aS = aE[aP]['start']['obj']['params']['tabletop']['end_radius'];
              aS = 0 == aS ? aE[aP]['start']['obj']['params']['cabinet']['width'] / units : aE[aP]['start']['obj']['params']['tabletop']['end_radius'] / units,
              'left' == aE[aP]['start']['obj']['params']['cabinet']['orientation'] && (ab['c2']['type'] = 'radius',
              ab['c2']['val'] = aS);
            }
            if ('end_radius_facade' == aE[aP]['end']['obj']['params']['cabinet']['type'] || 'end_radius_open' == aE[aP]['end']['obj']['params']['cabinet']['type']) {
              let aT = aE[aP]['end']['obj']['params']['tabletop']['end_radius'];
              aT = 0 == aT ? aE[aP]['end']['obj']['params']['cabinet']['width'] / units : aE[aP]['end']['obj']['params']['tabletop']['end_radius'] / units,
              'right' == aE[aP]['end']['obj']['params']['cabinet']['orientation'] && (ab['c3']['type'] = 'radius',
              ab['c3']['val'] = aT);
            }
            if ('corner_open' == aE[aP]['start']['obj']['params']['cabinet']['type'] || 'end_corner_facade' == aE[aP]['start']['obj']['params']['cabinet']['type']) {
              let aU = aE[aP]['start']['obj']['params']['cabinet']['end_corner_width'] / units;
              var ac = aE[aP]['start']['obj']['params']['cabinet']['width'] / units
              , ad = aE[aP]['start']['obj']['params']['cabinet']['depth'] / units;
              aU > ac && (aU = ac / 2);
              let aV = aE[aP]['start']['obj']['params']['tabletop']['end_corner_cut_width'] / units
              , aW = aE[aP]['start']['obj']['params']['tabletop']['end_corner_cut_depth'] / units;
              0 == aV && (aV = aU),
              0 == aW && (aW = aU),
              'left' == aE[aP]['start']['obj']['params']['cabinet']['orientation'] && (ab['c2']['type'] = 'corner',
              ab['c2']['val'] = aW,
              ab['c2']['val2'] = aV);
            }
            if ('corner_open' == aE[aP]['end']['obj']['params']['cabinet']['type'] || 'end_corner_facade' == aE[aP]['end']['obj']['params']['cabinet']['type']) {
              let aX = aE[aP]['end']['obj']['params']['cabinet']['end_corner_width'] / units;
              var ac = aE[aP]['end']['obj']['params']['cabinet']['width'] / units
              , ae = aE[aP]['end']['obj']['params']['cabinet']['depth'] / units;
              aX > ac && (aX = ac / 2);
              let aY = aE[aP]['end']['obj']['params']['tabletop']['end_corner_cut_width'] / units
              , aZ = aE[aP]['end']['obj']['params']['tabletop']['end_corner_cut_depth'] / units;
              0 == aY && (aY = aX),
              0 == aZ && (aZ = aX),
              'right' == aE[aP]['end']['obj']['params']['cabinet']['orientation'] && (ab['c3']['type'] = 'corner',
              ab['c3']['val'] = aY,
              ab['c3']['val2'] = aZ);
            }
          } else {
            if ('end_radius_facade' == aE[aP]['start']['obj']['params']['cabinet']['type'] || 'end_radius_open' == aE[aP]['start']['obj']['params']['cabinet']['type']) {
              let b0 = aE[aP]['start']['obj']['params']['tabletop']['end_radius'];
              b0 = 0 == b0 ? aE[aP]['start']['obj']['params']['cabinet']['width'] / units : aE[aP]['start']['obj']['params']['tabletop']['end_radius'] / units,
              'right' == aE[aP]['start']['obj']['params']['cabinet']['orientation'] && (ab['c3']['type'] = 'radius',
              ab['c3']['val'] = b0);
            }
            if ('end_radius_facade' == aE[aP]['end']['obj']['params']['cabinet']['type'] || 'end_radius_open' == aE[aP]['end']['obj']['params']['cabinet']['type']) {
              let b1 = aE[aP]['end']['obj']['params']['tabletop']['end_radius'];
              b1 = 0 == b1 ? aE[aP]['end']['obj']['params']['cabinet']['width'] / units : aE[aP]['end']['obj']['params']['tabletop']['end_radius'] / units,
              'left' == aE[aP]['end']['obj']['params']['cabinet']['orientation'] && (ab['c2']['type'] = 'radius',
              ab['c2']['val'] = b1);
            }
            if ('corner_open' == aE[aP]['start']['obj']['params']['cabinet']['type'] || 'end_corner_facade' == aE[aP]['start']['obj']['params']['cabinet']['type']) {
              let b2 = aE[aP]['start']['obj']['params']['cabinet']['end_corner_width'] / units;
              var af = aE[aP]['start']['obj']['params']['cabinet']['width'] / units
              , ag = aE[aP]['start']['obj']['params']['cabinet']['depth'] / units;
              b2 > af && (b2 = af / 2);
              let b3 = aE[aP]['start']['obj']['params']['tabletop']['end_corner_cut_width'] / units
              , b4 = aE[aP]['start']['obj']['params']['tabletop']['end_corner_cut_depth'] / units;
              0 == b3 && (b3 = b2),
              0 == b4 && (b4 = b2),
              'right' == aE[aP]['start']['obj']['params']['cabinet']['orientation'] && (ab['c3']['type'] = 'corner',
              ab['c3']['val'] = b3,
              ab['c3']['val2'] = b4);
            }
            if ('corner_open' == aE[aP]['end']['obj']['params']['cabinet']['type'] || 'end_corner_facade' == aE[aP]['end']['obj']['params']['cabinet']['type']) {
              let b5 = aE[aP]['end']['obj']['params']['cabinet']['end_corner_width'] / units;
              var af = aE[aP]['end']['obj']['params']['cabinet']['width'] / units
              , ah = aE[aP]['end']['obj']['params']['cabinet']['depth'] / units;
              b5 > af && (b5 = af / 2);
              let b6 = aE[aP]['end']['obj']['params']['tabletop']['end_corner_cut_width'] / units
              , b7 = aE[aP]['end']['obj']['params']['tabletop']['end_corner_cut_depth'] / units;
              0 == b6 && (b6 = b5),
              0 == b7 && (b7 = b5),
              'left' == aE[aP]['end']['obj']['params']['cabinet']['orientation'] && (ab['c2']['type'] = 'corner',
              ab['c2']['val'] = b6,
              ab['c2']['val2'] = b7);
            }
          }
        }
        var ab = build_shape['tabletop'](aE[aP]['width'] / units, aE[aP]['depth'] / units, ab)
        , aa = new Tabletop({
          'width': aE[aP]['width'],
          'auto': 1,
          'height': aa['params']['variants'][0]['thickness'],
          'depth': aE[aP]['depth'],
          'id': aE[aP]['material'] || project_settings['defaults']['tabletop'],
          'variant': aE[aP]['variant'] || project_settings['defaults']['tabletop_variant'],
          'len': aa['params']['width'],
          'shape': ab
        });
        aE[aP]['groupObject'] = aa,
        A.push(aa),
        J.push(aa),
        room['add'](aa),
        aa['position']['copy'](aE[aP]['pos']),
        aa['rotation']['y'] = aE[aP]['rot'];
      }
    }
    for (let b8 = a2.length; b8--; ) {
      var ai = libs['tabletop']['items'][project_settings['defaults']['tabletop']]
      , aj = a2[b8]['tabletop']['children'][0]['params']
      , ai = (aj['id'] = ai['id'],
      aj['height'] = ai['params']['variants'][0]['thickness'],
      new Tabletop(aj));
      ai['userData']['is_trap'] = 1,
      A.push(ai),
      room['add'](ai),
      ai['position']['copy'](a2[b8]['tabletop']['children'][0]['getWorldPosition']()),
      ai['rotation']['y'] = a2[b8]['rotation']['y'];
    }
    for (let b9 = a1.length; b9--; )
    for (let ba = A.length; ba--; ) {
      var ak = a1[b9]
      , al = A[ba]
      , am = new THREE['Box3']()['setFromObject'](ak)
      , an = al['get_box']();
      if (am['intersectsBox'](an)) {
        for (let bb = ak['model']['children']['length'] - 1; 0 <= bb; bb--)
        if (-1 < ak['model']['children'][bb]['name']['indexOf']('cut')) {
          var ao = ak['model']['children'][bb]['clone']()
          , ap = al['mesh']['clone']()
          , aq = (ao['geometry'] = ak['model']['children'][bb]['geometry']['clone'](),
          ao['geometry']['rotateY'](ak['rotation']['y'] + al['rotation']['y']),
          ap['geometry']['rotateY'](al['rotation']['y']),
          ak['getWorldPosition'](new THREE['Vector3']()))
          , ar = al['position']['clone']()
          , as = (aq['sub'](ar),
          ao['geometry']['translate'](aq['x'], 0, aq['z']),
          ao['geometry']['attributes']['position']);
          for (let bc = 0; bc < as['count']; bc++) {
            var at = as['getX'](bc), au = as['getY'](bc), av = as['getZ'](bc), aw, ax;
            let bd = au;
            bd = au < 0 ? -10 : 10,
            as['setXYZ'](bc, at, bd, av);
          }
          var ar = csggeom(ap, [ao], 'subtract');
          ar['rotateY'](-al['rotation']['y']),
          al['mesh']['geometry'] = ar,
          'edges' != global_options['mode'] && (al['mesh']['material']['transparent'] = false);
          break;
        }
      }
    }
    global_data['tabletop']['items'] = A,
    global_data['tabletop']['items_bardesk'] = a0,
    global_data['tabletop']['needs_cut'] = J;
    for (let be = global_data['tabletop']['items']['length']; be--; ) {
      var ay = global_data['tabletop']['items'][be];
      let bf = ay['get_box']()['expandByScalar'](0.1)
      , bg = ay['get_forward']();
      var az = [], aA, aB;
      ay['userData']['forward'] = bg;
      let bh = {
        'b': [],
        'f': [],
        'l': [],
        'r': []
      };
      for (let bj = room['walls_objects']['length']; bj--; )
      if ('floor' != room['walls_objects'][bj]['name'] && 'ceiling' != room['walls_objects'][bj]['name']) {
        var aC = room['walls_objects'][bj]['box']['clone']()['expandByScalar'](0.1);
        if (bf['intersectsBox'](room['walls_objects'][bj]['box'])) {
          if (az.push({
            'obj': room['walls_objects'][bj],
            'box': aC
          }),
          1 == bg['z'])
          switch (room['walls_objects'][bj]['name']) {
            case 'right_wall':
            bh['l']['push']({
              'obj': room['walls_objects'][bj],
              'min': aC['min']['z'],
              'max': aC['max']['z'],
              'type': 'wall'
            });
            break;
            case 'left_wall':
            bh['r']['push']({
              'obj': room['walls_objects'][bj],
              'min': aC['min']['z'],
              'max': aC['max']['z'],
              'type': 'wall'
            });
            break;
            case 'front_wall':
            bh['b']['push']({
              'obj': room['walls_objects'][bj],
              'min': aC['min']['x'],
              'max': aC['max']['x'],
              'type': 'wall'
            });
            break;
            case 'back_wall':
            bh['f']['push']({
              'obj': room['walls_objects'][bj],
              'min': aC['min']['x'],
              'max': aC['max']['x'],
              'type': 'wall'
            });
            break;
          }
          else {
            if (-1 == bg['z'])
            switch (room['walls_objects'][bj]['name']) {
              case 'right_wall':
              bh['r']['push']({
                'obj': room['walls_objects'][bj],
                'min': aC['min']['z'],
                'max': aC['max']['z'],
                'type': 'wall'
              });
              break;
              case 'left_wall':
              bh['l']['push']({
                'obj': room['walls_objects'][bj],
                'min': aC['min']['z'],
                'max': aC['max']['z'],
                'type': 'wall'
              });
              break;
              case 'front_wall':
              bh['f']['push']({
                'obj': room['walls_objects'][bj],
                'min': aC['min']['x'],
                'max': aC['max']['x'],
                'type': 'wall'
              });
              break;
              case 'back_wall':
              bh['b']['push']({
                'obj': room['walls_objects'][bj],
                'min': aC['min']['x'],
                'max': aC['max']['x'],
                'type': 'wall'
              });
              break;
            }
            else {
              if (1 == bg['x'])
              switch (room['walls_objects'][bj]['name']) {
                case 'right_wall':
                bh['f']['push']({
                  'obj': room['walls_objects'][bj],
                  'min': aC['min']['z'],
                  'max': aC['max']['z'],
                  'type': 'wall'
                });
                break;
                case 'left_wall':
                bh['b']['push']({
                  'obj': room['walls_objects'][bj],
                  'min': aC['min']['z'],
                  'max': aC['max']['z'],
                  'type': 'wall'
                });
                break;
                case 'front_wall':
                bh['l']['push']({
                  'obj': room['walls_objects'][bj],
                  'min': aC['min']['x'],
                  'max': aC['max']['x'],
                  'type': 'wall'
                });
                break;
                case 'back_wall':
                bh['r']['push']({
                  'obj': room['walls_objects'][bj],
                  'min': aC['min']['x'],
                  'max': aC['max']['x'],
                  'type': 'wall'
                });
                break;
              }
              else {
                if (-1 == bg['x'])
                switch (room['walls_objects'][bj]['name']) {
                  case 'right_wall':
                  bh['b']['push']({
                    'obj': room['walls_objects'][bj],
                    'min': aC['min']['z'],
                    'max': aC['max']['z'],
                    'type': 'wall'
                  });
                  break;
                  case 'left_wall':
                  bh['f']['push']({
                    'obj': room['walls_objects'][bj],
                    'min': aC['min']['z'],
                    'max': aC['max']['z'],
                    'type': 'wall'
                  });
                  break;
                  case 'front_wall':
                  bh['r']['push']({
                    'obj': room['walls_objects'][bj],
                    'min': aC['min']['x'],
                    'max': aC['max']['x'],
                    'type': 'wall'
                  });
                  break;
                  case 'back_wall':
                  bh['l']['push']({
                    'obj': room['walls_objects'][bj],
                    'min': aC['min']['x'],
                    'max': aC['max']['x'],
                    'type': 'wall'
                  });
                  break;
                }
              }
            }
          }
        }
      }
      for (let bk = global_data['tabletop']['items']['length']; bk--; ) {
        var aD = global_data['tabletop']['items'][bk], aD;
        ay['uuid'] != aD['uuid'] && (aD = aD['get_box']()['expandByScalar'](0.1),
        bf['intersectsBox'](aD)) && az.push({
          'obj': global_data['tabletop']['items'][bk],
          'box': aD
        });
      }
      ay['userData']['box'] = bf,
      ay['userData']['around'] = bh,
      ay['userData']['inter'] = az,
      bf['expandByScalar'](-0.3);
      for (let bl = az.length; bl--; ) {
        'wall' != az[bl]['obj']['object_type'] && (aA = az[bl]['obj'],
        aB = az[bl]['box'],
        1 == bg['z'] ? (bf['max']['x'] < aB['min']['x'] && bh['l']['push']({
          'obj': aA,
          'min': c_round(aB['min']['z']),
          'max': c_round(aB['max']['z']),
          'type': 'tabletop'
        }),
        bf['min']['x'] > aB['max']['x'] && bh['r']['push']({
          'obj': aA,
          'min': c_round(aB['min']['z']),
          'max': c_round(aB['max']['z']),
          'type': 'tabletop'
        }),
        bf['max']['z'] < aB['min']['z'] && bh['f']['push']({
          'obj': aA,
          'min': c_round(aB['min']['x']),
          'max': c_round(aB['max']['x']),
          'type': 'tabletop'
        }),
        bf['min']['z'] > aB['max']['z'] && bh['b']['push']({
          'obj': aA,
          'min': c_round(aB['min']['x']),
          'max': c_round(aB['max']['x']),
          'type': 'tabletop'
        })) : -1 == bg['z'] ? (bf['max']['x'] < aB['min']['x'] && bh['r']['push']({
          'obj': aA,
          'min': c_round(aB['min']['z']),
          'max': c_round(aB['max']['z']),
          'type': 'tabletop'
        }),
        bf['min']['x'] > aB['max']['x'] && bh['l']['push']({
          'obj': aA,
          'min': c_round(aB['min']['z']),
          'max': c_round(aB['max']['z']),
          'type': 'tabletop'
        }),
        bf['max']['z'] < aB['min']['z'] && bh['b']['push']({
          'obj': aA,
          'min': c_round(aB['min']['x']),
          'max': c_round(aB['max']['x']),
          'type': 'tabletop'
        }),
        bf['min']['z'] > aB['max']['z'] && bh['f']['push']({
          'obj': aA,
          'min': c_round(aB['min']['x']),
          'max': c_round(aB['max']['x']),
          'type': 'tabletop'
        })) : 1 == bg['x'] ? (bf['max']['x'] < aB['min']['x'] && bh['f']['push']({
          'obj': aA,
          'min': c_round(aB['min']['z']),
          'max': c_round(aB['max']['z']),
          'type': 'tabletop'
        }),
        bf['min']['x'] > aB['max']['x'] && bh['b']['push']({
          'obj': aA,
          'min': c_round(aB['min']['z']),
          'max': c_round(aB['max']['z']),
          'type': 'tabletop'
        }),
        bf['max']['z'] < aB['min']['z'] && bh['r']['push']({
          'obj': aA,
          'min': c_round(aB['min']['x']),
          'max': c_round(aB['max']['x']),
          'type': 'tabletop'
        }),
        bf['min']['z'] > aB['max']['z'] && bh['l']['push']({
          'obj': aA,
          'min': c_round(aB['min']['x']),
          'max': c_round(aB['max']['x']),
          'type': 'tabletop'
        })) : -1 == bg['x'] && (bf['max']['x'] < aB['min']['x'] && bh['b']['push']({
          'obj': aA,
          'min': c_round(aB['min']['z']),
          'max': c_round(aB['max']['z']),
          'type': 'tabletop'
        }),
        bf['min']['x'] > aB['max']['x'] && bh['f']['push']({
          'obj': aA,
          'min': c_round(aB['min']['z']),
          'max': c_round(aB['max']['z']),
          'type': 'tabletop'
        }),
        bf['max']['z'] < aB['min']['z'] && bh['l']['push']({
          'obj': aA,
          'min': c_round(aB['min']['x']),
          'max': c_round(aB['max']['x']),
          'type': 'tabletop'
        }),
        bf['min']['z'] > aB['max']['z']) && bh['r']['push']({
          'obj': aA,
          'min': c_round(aB['min']['x']),
          'max': c_round(aB['max']['x']),
          'type': 'tabletop'
        }));
      }
      bf['expandByScalar'](0.2),
      round_vec(bf);
      let bi = {
        'l': [],
        'r': [],
        'f': [],
        'b': []
      };
      Object['keys'](bh)['forEach'](bm => {
        if (bh[bm]['length']) {
          bh[bm]['sort']( (bs, bt) => bs['min'] - bt['min']);
          let bp = 'z';
          if (0 == bg['z'])
          switch (bm) {
            case 'f':
            bp = 'z';
            break;
            case 'b':
            bp = 'z';
            break;
            case 'l':
            bp = 'x';
            break;
            case 'r':
            bp = 'x';
            break;
          }
          else
          switch (bm) {
            case 'f':
            bp = 'x';
            break;
            case 'b':
            bp = 'x';
            break;
            case 'l':
            bp = 'z';
            break;
            case 'r':
            bp = 'z';
            break;
          }
          let bq = bf['min'][bp]
          , br = 0;
          for (let bs = 0; bs < bh[bm]['length']; bs++) {
            var bn = bh[bm][bs]
            , bo = bh[bm][bs + 1];
            bn['min'] <= bf['min'][bp] && bn['max'] >= bf['max'][bp] ? bi[bm]['push']({
              'type': 1,
              'start': bf['min'][bp] - bf['min'][bp],
              'end': bf['max'][bp] - bf['min'][bp],
              'len': bf['max'][bp] - bf['min'][bp]
            }) : (1 < bn['min'] - bq && 0 == br && (bi[bm]['push']({
              'type': 0,
              'start': bq - bf['min'][bp],
              'end': bn['min'] - bf['min'][bp],
              'len': bn['min'] - bq
            }),
            bq = bn['min']),
            bo ? bo['min'] - bn['max'] < 1 ? br = 1 : (bi[bm]['push']({
              'type': 1,
              'start': bq - bf['min'][bp],
              'end': bn['max'] - bf['min'][bp],
              'len': bn['max'] - bq
            }),
            br = 0,
            bq = bn['max']) : (1 < bn['max'] - bq && bi[bm]['push']({
              'type': 1,
              'start': bq - bf['min'][bp],
              'end': bn['max'] - bf['min'][bp],
              'len': bn['max'] - bq
            }),
            bq = bn['max'],
            1 < bf['max'][bp] - bq && bi[bm]['push']({
              'type': 0,
              'start': bq - bf['min'][bp],
              'end': bf['max'][bp] - bf['min'][bp],
              'len': bf['max'][bp] - bq
            })));
          }
        } else {
          let bt = 'z';
          if (0 == bg['z'])
          switch (bm) {
            case 'f':
            bt = 'z';
            break;
            case 'b':
            bt = 'z';
            break;
            case 'l':
            bt = 'x';
            break;
            case 'r':
            bt = 'x';
            break;
          }
          else
          switch (bm) {
            case 'f':
            bt = 'x';
            break;
            case 'b':
            bt = 'x';
            break;
            case 'l':
            bt = 'z';
            break;
            case 'r':
            bt = 'z';
            break;
          }
          bi[bm]['push']({
            'type': 0,
            'start': bf['min'][bt] - bf['min'][bt],
            'end': bf['max'][bt] - bf['min'][bt],
            'len': bf['max'][bt] - bf['min'][bt]
          });
        }
      }
      ),
      ay['userData']['edges'] = bi;
    }
    function aF(bm, bn='x', bo='asc', bp='front', bq=0) {
      function br(bv) {
        return 'Cabinet' == bv['temp_type'] && 'corner' != bv['params']['cabinet']['type'] && 'corner_90' != bv['params']['cabinet']['type'] && bv['params']['tabletop']['active'] && bv['params']['tabletop']['autogen'];
      }
      function bs(bv) {
        return 'Cabinet' == bv['temp_type'] ? bv['params']['cabinet']['height'] : 'Bardesk' == bv['temp_type'] ? 720 : bv['params']['height'];
      }
      function bt(bv) {
        return ('Cabinet' == bv['temp_type'] ? bv['params']['cabinet'] : bv['params'])['depth'];
      }
      function bu(bv) {
        return 'Cabinet' == bv['temp_type'] ? bv['params']['tabletop']['tabletop_id'] : 'Bardesk' == bv['temp_type'] ? bv['params']['material'] : 0;
      }
      Object['keys'](bm)['forEach'](bv => {
        bm[bv]['sort'](function(bz, bA) {
          return 'asc' == bo ? bz['position'][bn] - bA['position'][bn] : bA['position'][bn] - bz['position'][bn];
        });
        let bw = {
          'start': null,
          'objs': {},
          'end': null,
          'rot': bq,
          'label': bp,
          'axis': bn,
          'groupObject': null
        };
        for (let bz = 0; bz < bm[bv]['length']; bz++) {
          var bx = bm[bv][bz]
          , by = bx['userData']['around'];
          bw['start'] || (bw['start'] = {
            'id': bx['uuid'],
            'obj': bx
          },
          bw['objs'][bx['uuid']] = {
            'id': bx['uuid'],
            'obj': bx
          }),
          by['right'] && br(by['right']) && bs(by['right']) == bs(bx) && bt(by['right']) == bt(bx) && bu(by['right']) == bu(bx) ? bw['objs'][by['right']['uuid']] = {
            'id': by['right']['uuid'],
            'obj': by['right']
          } : (bw['end'] = {
            'id': bx['uuid'],
            'obj': bx
          },
          aE.push(Object['assign']({}, bw)),
          bw = {
            'start': null,
            'objs': {},
            'end': null,
            'rot': bq,
            'label': bp,
            'axis': bn,
            'groupObject': null
          });
        }
      }
      );
    }
    pp['info']['tabletop']['desc'] = sc['find_tabletop_groups'](),
    sc['build_bort_v3'](),
    sc['build_tabletop_washers'](),
    sc['get_price'](),
    'function' == typeof pp['events']['global']['after_build_tabletop'] && pp['events']['global']['after_build_tabletop'](),
    pp['config']['on_demand_render'] && pp['render']();
  }
}, 500),
sc['detach_tabletop'] = function(f) {
  if (constructor_settings['core_v2'])
  sc['detach_tabletop_v3'](f);
  else {
    var g = global_data['tabletop']['desc'] || []
    , h = global_data['tabletop']['items'] || [];
    if (f && 'Cabinet' === f['type']) {
      let q = false
      , u = []
      , v = null;
      for (var j of g) {
        var k = Object['values'](j['objs']);
        if (k && k.length && (q = k['some'](x => x['id'] === f['uuid']))) {
          v = j,
          u = k.filter(x => 'Cabinet' === x['obj']['type'])['map'](x => x['obj']);
          break;
        }
      }
      u.length || u.push(f);
      let w = null;
      w = (w = q && v ? h['find'](x => x['position']['x'] === v['pos']['x'] && x['position']['z'] === v['pos']['z'] && Math['abs'](x['params']['width'] - v['width']) < 0.01 && Math['abs'](x['params']['depth'] - v['depth']) < 0.01) : w) || f['tabletop'];
      for (var m of u)
      m['set_tabletop_autogen'](false);
      var g = {
        'bardesk_type': 'common',
        'leg_visible': false,
        'width': Math['floor'](w['params']['width']),
        'depth': Math['floor'](w['params']['depth'])
      }
      , h = sc['add_object']('bardesk', g, false);
      w['getWorldQuaternion'](h['quaternion']),
      w['getWorldPosition'](h['position']),
      h['position']['y'] = 0,
      sc['build_tabletop'](),
      sc['select_object'](h);
    }
  }
}
,
sc['change_tabletop_active'] = function(e) {
  constructor_settings['core_v2'] ? (sc['change_global_var'](pp['const']['vars']['tabletop_enabled'], to_int(e), true),
  global_update(),
  sc['build_tabletop'](),
  sc['assign_numbers']()) : (sc['build_bort'](),
  sc['get_price']());
}
,
sc['change_bort_active'] = function(e) {
  project_settings['bort_active'] = e,
  constructor_settings['core_v2'] ? (sc['change_global_var'](pp['const']['vars']['plint_enabled'], to_int(e), true),
  global_update(),
  sc['build_bort_v3'](),
  sc['assign_numbers']()) : (sc['build_bort'](),
  sc['get_price']());
}
,
sc['build_bort'] = function() {
  sc['build_bort_v3'](),
  sc['get_price']();
}
,
sc['change_tabletop_plint'] = function(f) {
  if (project_settings['defaults']['tabletop_plint'] = f['id'],
  constructor_settings['core_v2']) {
    project_settings['kitchen']['defaults']['tabletop']['bort_id'] = f['id'],
    call_method_on_cabinets('change_tabletop_plint_material_v2', f['id'], false);
    for (var g of d_objects) {
      var h;
      g['userData']['params'] && 'module' === g['userData']['params']['type'] && (g['set_defaults_param']('tabletop.plints.material', f['id'], 'number'),
      g['walk_params_tree'](i => {
        'tabletop' === i['type'] && (i['spec']['plints']['material'] = f['id']);
      }
      ),
      g['_rebuild_parts_by_type']('tabletop'));
    }
    global_update(),
    sc['build_bort_v3'](),
    sc['assign_numbers']();
  } else
  pp['info']['tabletop']['desc'] = sc['find_tabletop_groups'](),
  sc['build_bort_v3']();
}
,
sc['set_tabletop_cut_mode'] = f => {
  var g = constructor_settings['core_v2']
  , h = g ? 'tabletop_cut_v2' : 'tabletop_cut';
  if (global_options['mouse_mode']['mode'] != h || global_options['mouse_mode']['item_id'] != f) {
    0 == f ? (global_options['mouse_mode']['mode'] = 'drag',
    global_options['mouse_mode']['target'] = null,
    global_options['mouse_mode']['item_id'] = null) : (global_options['mouse_mode']['mode'] = 'picker',
    global_options['mouse_mode']['target'] = h,
    global_options['mouse_mode']['item_id'] = f);
    var i = (g ? pp['info']['tabletop']['items_parts'] : global_data['tabletop']['needs_cut']) || [];
    for (let j = i.length; j--; )
    i[j]['set_cut_mode'](f);
  }
}
,
sc['build_tabletop_v3'] = function() {
  sc['build_tabletop_v3_debounced'](),
  sc['build_tabletop_v3_debounced']['flush']();
}
,
sc['build_tabletop_v3_debounced'] = _['debounce'](function() {
  if (constructor_settings['core_v2'] && ('undefined' == typeof view_mode || !view_mode)) {
    var f = [], g = sc['find_tabletop_groups'](), h = [], j = pp['info']['tabletop']['cuts_update'] || [], k, m;
    for (k of pp['info']['tabletop']['items'])
    if (k) {
      let z = k['userData']['tabletopGroup'];
      var q = g['find'](A => y(z, A));
      q && !q['items'][0]['sourceObject']?.['is_detached_tabletop']?.() ? (k['userData']['tabletopGroup'] = q)['info']['groupObject'] = k : (sc['split_tabletop_group_cuts'](k, h),
      z['info']['groupObject'] && (z['info']['groupObject'] = null),
      k['delete'](),
      room['remove'](k),
      k['userData'] && k['userData']['tabletopGroup'] && (k['userData']['tabletopGroup'] = null));
    }
    for (m of g)
    if (m['info']['groupObject'])
    f.push(m['info']['groupObject']);
    else {
      if (!m['items'][0]['sourceObject']?.['is_detached_tabletop']?.()) {
        for (var u of m['items'])
        u['tabletop']['visible'] = false,
        u['tabletop']['userData']['params']['visible'] = 0;
        var v = sc['collect_tabletop_group_cuts'](m, h)
        , w = v?.['connects']
        , x = v?.['needCutsUpdate'];
        if (w?.['length']) {
          let A = m['info']['size']['x'] / units;
          _['remove'](w, B => B > A);
        }
        var v = sc['add_tabletop_from_group'](m, void 0, void 0, w, false);
        pp['state']['scene_layers']['tabletop'] || (v['visible'] = false),
        (v['userData']['tabletopGroup'] = m)['info']['groupObject'] = v,
        f.push(v);
      }
    }
    pp['info']['tabletop']['items'] = f,
    pp['info']['tabletop']['desc'] = g,
    pp['info']['tabletop']['cuts_update'] = j,
    sc['update_tabletop_parts'](),
    sc['build_bort_v3'](),
    sc['build_tabletop_washers'](),
    sc['assign_numbers'](),
    'function' == typeof pp['events']['global']['after_build_tabletop'] && pp['events']['global']['after_build_tabletop'](),
    pp['config']['on_demand_render'] && pp['render'](),
    sc['get_price']();
  }
  function y(B, C) {
    var D = 0.05, E = B['info'], F = C['info'], G, H, B, C;
    return B['items'][0]['tabletop']['userData']['params']['spec']['can_group'] === C['items'][0]['tabletop']['userData']['params']['spec']['can_group'] && E['axis'] === F['axis'] && E['materialId'] === F['materialId'] && E['size']['x'] === F['size']['x'] && E['size']['y'] === F['size']['y'] && E['size']['z'] === F['size']['z'] && !(Math['abs'](B['box']['min']['x'] - C['box']['min']['x']) > D || Math['abs'](B['box']['min']['y'] - C['box']['min']['y']) > D || Math['abs'](B['box']['min']['z'] - C['box']['min']['z']) > D) && (B = E['typeParams'],
    C = E['typeParams'],
    B['corners_equal'] === C['corners_equal']) && B['c1']['type'] === C['c1']['type'] && B['c1']['val'] === C['c1']['val'] && B['c2']['type'] === C['c2']['type'] && B['c2']['val'] === C['c2']['val'] && B['c3']['type'] === C['c3']['type'] && B['c3']['val'] === C['c3']['val'] && B['c4']['type'] === C['c4']['type'] && B['c4']['val'] === C['c4']['val'] && E['canEuro']['c1'] === F['canEuro']['c1'] && E['canEuro']['c2'] === F['canEuro']['c2'] && E['canEuro']['c3'] === F['canEuro']['c3'] && E['canEuro']['c4'] === F['canEuro']['c4'];
  }
}, 200),
sc['update_auto_tabletop_cuts'] = function() {
  var f = pp['info']['tabletop']['cuts_update'];
  if (f?.['length']) {
    var g = new Set(), h;
    for (h of f) {
      var j = h?.['info']?.['groupObject'];
      if (j && !g['has'](j)) {
        var j = j['userData']['parts']['tabletop'][0];
        if (j) {
          var j = j['userData']['params']['spec']?.['cuts']
          , k = j?.['connects']
          , l = parse_num(j?.['len'])
          , m = parse_int(h['info']['size']['x']);
          if (j?.['connects']?.['length'] && l && m / l < 1000 && !(l < m)) {
            k['splice'](0);
            var p = Math['floor'](m / l);
            for (let q = 1; q < p + 1; q++)
            k.push(q * l / units);
          }
        }
      }
    }
  }
}
,
sc['build_tabletop_washers'] = function() {
  var f = !constructor_settings['core_v2'];
  let g = dControls['get_selected']();
  var h = _(d_objects)['filter'](E => 'washer' === E['object_type'] && (!g || g['uuid'] !== E['uuid']))['map'](E => {
    var F = new THREE['Box3']();
    return F['setFromObject'](E['model']),
    {
      'obj': E,
      'box': F,
      'position': E['getWorldPosition'](new THREE['Vector3']()),
      'rotationY': E['rotation']['y'],
      'flipped': Boolean(E['params']['flipped'])
    };
  }
  )['value'](), j = f ? E => E : _['property']('userData.parts.tabletop[0]'), k = f ? _['property']('mesh') : _['property']('userData.parts.tabletop[0].userData.own_object.children[0]'), q, v;
  for (v of f ? [...global_data['tabletop']['desc'], ..._.map(global_data['tabletop']['items_bardesk'], E => ({
    'groupObject': E
  }))] : pp['info']['tabletop']['desc']) {
    let E = f ? v['groupObject']?.['get_box']?.() : v['box'];
    var w = f ? v['groupObject'] : v['info']['groupObject'] || v['items'][0]['sourceObject'];
    if (E && w) {
      var x = j(w);
      if (x) {
        var y = x['userData']['washers']
        , z = _.filter(h, F => F['box']['intersectsBox'](E));
        if (C(y, z)) {
          !f && y && y.length && x['_rebuild'](),
          x['userData']['washers'] = z;
          var A = k(w);
          if (A) {
            for (var B of z)
            D(B, A, w);
          }
        }
      }
    }
  }
  function C(F, G) {
    if (!F)
    return Boolean(G.length);
    if (F.length !== G.length)
    return 1;
    var H = 0.05;
    for (let J of F) {
      var I = _['find'](G, K => K['obj'] === J['obj']);
      if (!I)
      return 1;
      if (Math['abs'](J['position']['x'] - I['position']['x']) > H || Math['abs'](J['position']['y'] - I['position']['y']) > H || Math['abs'](J['position']['z'] - I['position']['z']) > H || Math['abs'](J['rotationY'] - I['rotationY']) > H || J['flipped'] !== I['flipped'])
      return 1;
    }
  }
  function D(F, G, H) {
    var I = F['obj']['model']
    , I = _['find'](I['children'], P => -1 < P['name']['indexOf']('cut'));
    if (I) {
      let P = H['position']
      , Q = H['rotation']['y'];
      'Bardesk' === H['parent']?.['parent']?.['type'] && (P = H['getWorldPosition'](),
      Q = H['parent']['parent']['rotation']['y']);
      var H = I['clone']()
      , J = G['clone']()
      , I = (H['geometry'] = I['geometry']['clone'](),
      H['geometry']['rotateY'](F['rotationY']),
      J['geometry']['rotateY'](Q),
      F['position']['clone']())
      , K = (I['sub'](P),
      H['geometry']['translate'](I['x'], 0, I['z']),
      H['geometry']['attributes']['position']);
      for (let R = 0; R < K['count']; R++) {
        var L = K['getX'](R)
        , N = K['getY'](R) < 0 ? -10 : 10
        , O = K['getZ'](R);
        K['setXYZ'](R, L, N, O);
      }
      var F = csggeom(J, [H], 'subtract');
      F['rotateY'](-Q),
      G['geometry'] = F,
      'edges' !== global_options['mode'] && (G['material']['transparent'] = false);
    }
  }
}
,
sc['split_tabletop_group_cuts'] = function(g, j) {
  var k, q;
  if ((q = g['userData']['parts']['tabletop'][0]?.['userData']['params']['spec']['cuts']['connects'])?.['length']) {
    let G = 0.05;
    var g = g['userData']['tabletopGroup'];
    if (1 === g['items']['length'])
    j.push({
      'groupItem': g['items'][0],
      'connects': q
    });
    else {
      var q = [...q], v = g['box'], w = g['info'], x;
      let H = 'x' === w['axis']['slice'](-1) ? 'z' : 'x';
      var y = 'z' === w['axis'] || '-x' === w['axis'] ? 1 : -1, z = v['max'][H] - v['min'][H], A = v['min'][H] + z / 2, B;
      for (let I = 0; I < q.length; I++)
      q[I] = A + y * (q[I] - z / 2);
      for (B of g['items']) {
        let J = B['box'];
        var C = 'z' === B['axis'] || '-x' === B['axis'] ? 1 : -1
        , D = _['remove'](q, K => K + G >= J['min'][H] && K - G <= J['max'][H]);
        if (D.length) {
          var E = J['max'][H] - J['min'][H]
          , F = J['min'][H] + E / 2;
          for (let K = 0; K < D.length; K++)
          D[K] = C * (D[K] - F) + E / 2;
          if (j.push({
            'groupItem': B,
            'connects': D
          }),
          !q.length)
          break;
        }
      }
    }
  }
}
,
sc['collect_tabletop_group_cuts'] = function(k, q) {
  let v = false;
  if (1 === k['items']['length']) {
    let P = k['items'][0]['sourceObject']
    , Q = k['items'][0]['tabletop'];
    var w = q['find'](R => R['groupItem']['sourceObject'] === P && R['groupItem']['tabletop']?.['userData']['params']['id'] === Q['userData']['params']['id']);
    return w && '' + w['groupItem']['tabletop']?.['userData']?.['params']?.['spec']?.['cuts']?.['len'] != '' + k['tabletop']?.['userData']?.['params']?.['spec']?.['cuts']?.['len'] && (v = true),
    w?.['connects']?.['length'] ? {
      'connects': w['connects'],
      'needCutsUpdate': v
    } : null;
  }
  var y = 0.05, z = [], A = k['box'], w = k['info'], B, C = 'x' === w['axis']['slice'](-1) ? 'z' : 'x', D = 'z' === w['axis'] || '-x' === w['axis'] ? 1 : -1, E = A['max'][C] - A['min'][C], F = A['min'][C] + E / 2;
  for (let R of k['items']) {
    var G = _.findIndex(q, S => S['groupItem']['sourceObject'] === R['sourceObject'] && S['groupItem']['tabletop']?.['userData']['params']['id'] === R['tabletop']?.['userData']['params']['id']);
    if (!(G < 0)) {
      var H = R['box']
      , I = 'z' === R['axis'] || '-x' === R['axis'] ? 1 : -1
      , J = H['max'][C] - H['min'][C]
      , K = H['min'][C] + J / 2
      , H = _['pullAt'](q, [G])[0]
      , L = H['connects'];
      v || '' + H['groupItem']['tabletop']?.['userData']?.['params']?.['spec']?.['cuts']?.['len'] == '' + k['tabletop']?.['userData']?.['params']?.['spec']?.['cuts']?.['len'] || (v = true);
      for (let S = 0; S < L.length; S++) {
        var N = K + I * (L[S] - J / 2), O;
        N + y >= A['min'][C] && N - y <= A['max'][C] && z.push(D * (N - F) + E / 2);
      }
      if (!q.length)
      break;
    }
  }
  return z.length ? {
    'connects': z,
    'needCutsUpdate': v
  } : null;
}
,
sc['set_tabletop_autogen'] = function(f, g) {
  var h;
  f['userData']['params'] && 'module' === f['userData']['params']['type'] || f['set_tabletop_autogen'](Boolean(g)),
  sc['build_tabletop']();
}
,
sc['detach_tabletop_v3'] = function(f) {
  if (constructor_settings['core_v2'] && f) {
    var g, h, j, k;
    let B = (pp['info']['tabletop']['desc'] || [])['filter'](E => E['items']['some'](F => F['sourceObject']['uuid'] === f['uuid']))
    , C = (B.length || (B = sc['find_tabletop_groups'](false, false, [f])),
    null)
    , D = [];
    for (h of B) {
      for (var q of h['items']) {
        q['sourceObject'] && q['tabletop'] && (find_condition(q['tabletop']['userData']['params']['condition'], F => ('' + F['f'])['includes']('v:_tbl')) ? module_utils['change_variables'](q['sourceObject'], {
          'key': '_tbl',
          'value': 0,
          'fixed': 1
        }, {
          'isMain': true,
          'isTemplate': true,
          'isVariant': true,
          'isGlobal': true,
          'action': 'update',
          'triggerBuild': 'rebuild',
          'raiseEvent': true
        }) : (q['sourceObject']['change_param_by_path'](q['tabletop']['userData']['path'], 'active', 0, false),
        q['sourceObject']['_rebuild']()),
        (k = q['sourceObject']['userData']['parts'])['tabletop']['length'] || k['wall']['length'] || k['module']['length'] || k['model']['length'] || k['cokol']['length'] || k['cokol_top']['length'] || (q['sourceObject']['delete'](),
        room['remove'](q['sourceObject'])));
      }
      var v, w = _['find'](h['items'], F => F['sourceObject'] === f)['tabletop']['userData']['params']['spec']['plints'], x = w ? copy_object(w) : {};
      let E = h['info']['groupObject'];
      if (E) {
        E['userData']['tabletopGroup'] = null,
        h['info']['groupObject'] = null,
        E['userData']['params']['interaction']['check_intersection'] = 1,
        utils['nested_object']['set'](E['userData']['params'], 'spec.defaults.tabletop.plints', x);
        for (var y of E['userData']['parts']['tabletop'])
        module_utils['change_param_by_path'](E, y['userData']['path'], 'spec.can_change.id', 1, false),
        utils['nested_object']['set'](y['userData']['params'], 'spec.can_change.id', 1),
        module_utils['change_param_by_path'](E, y['userData']['path'], 'spec.plints', copy_object(x), false),
        utils['nested_object']['set'](y['userData']['params'], 'spec.plints', copy_object(x));
        room['active_objects']['push'](E),
        d_objects.push(E),
        D.push(E);
      } else {
        var z, A, w = h['items'][0]['sourceObject']['userData']['parts']['tabletop'][0]?.['userData']['params']['spec']['cuts']['connects'];
        E = sc['add_tabletop_from_group'](h, true, false, w, true),
        pp['state']['scene_layers']['tabletop'] || (E['visible'] = false);
      }
      C = E;
    }
    D.length && pp['info']['tabletop']['items'] && (pp['info']['tabletop']['items'] = pp['info']['tabletop']['items']['filter'](F => !D['includes'](F))),
    B.length && pp['info']['tabletop']['desc'] && (pp['info']['tabletop']['desc'] = pp['info']['tabletop']['desc']['filter'](F => !B['includes'](F))),
    sc['assign_numbers'](),
    C && (sc['select_object'](C),
    $('.interface')['css']('pointer-events', 'none'),
    $('.left_subpanel.active')['css']({
      'opacity': 0.1
    }),
    dControls['clear_selected']()),
    sc['build_tabletop']();
  }
}
,
sc['update_tabletop_parts'] = function() {
  pp['info']['tabletop']['items_parts'] = pp['info']['tabletop']['desc']['map'](e => (e['info']['groupObject'] || e['items'][0]['sourceObject'])['userData']['parts']['tabletop'][0]);
}
,
sc['save_tabletops_data'] = function() {
  if (!constructor_settings['core_v2'])
  return null;
  var f = [], g = {
    'groups': f
  }, h = new THREE['Vector3'](), j;
  let k = _['property']('sourceObject.userData.params.obj_id')
  , q = _['property']('tabletop.userData.params.id');
  for (j of pp['info']['tabletop']['desc']) {
    var v = j['info'], w = j['box'], x = (w['getCenter'](h),
    v['axis']['slice'](-1)), y = 'x' === x ? 'z' : 'x', z = v['groupObject'] ? null : {
      'obj_id': k(j['items'][0]),
      'tabletop_id': q(j['items'][0])
    }, A = v['axis'], B = v['size'], y = {
      'x': h[y],
      'y': w['min']['y'],
      'z': h[x]
    }, C, D, w = (v['groupObject'] || j['items'][0]['sourceObject'])['userData']['parts']['tabletop'][0]?.['userData']['params']['spec']['cuts']['connects'], x = _.map(j['items'], E => ({
      'obj_id': k(E),
      'tabletop_id': q(E)
    }));
    f.push({
      'linked_object': z,
      'axis': A,
      'size': B,
      'position': y,
      'connects': w,
      'objects': x
    });
  }
  return g;
}
,
sc['load_tabletops_data'] = function(f) {
  if (constructor_settings['core_v2'] && _['get'](f, 'groups.length')) {
    var g = pp['info']['tabletop']['desc'];
    if (g.length) {
      for (let l of f['groups'])
      if (_['get'](l, 'objects.length') && _['get'](l, 'connects.length')) {
        var h = _['find'](g, m => {
          var p = m['info']['size'], q;
          if (m['info']['axis']['slice'](-1) !== l['axis']['slice'](-1))
          return false;
          if (1 < Math['abs'](p['x'] - l['size']['x']) || 1 < Math['abs'](p['z'] - l['size']['z']))
          return false;
          if (l['objects']['length'] !== m['items']['length'])
          return false;
          for (let u of m['items']) {
            if (!_['find'](l['objects'], v => v['obj_id'] === u['sourceObject']['userData']['params']['obj_id'] && v['tabletop_id'] === u['tabletop']['userData']['params']['id']))
            return false;
          }
          return true;
        }
        );
        if (!h)
        return;
        var i = l['connects'];
        if (h['info']['axis']['length'] !== l['axis']['length']) {
          var j = h['info']['size']['x'] / units;
          for (let m = 0; m < i.length; m++)
          i[m] = j - i[m];
        }
        var k, h = (h['info']['groupObject'] || h['items'][0]['sourceObject'])['userData']['parts']['tabletop'][0];
        h['set_connects'](i),
        h['update_auto_connects']();
      }
      sc['update_tabletops_connects']();
    }
  }
}
,
sc['update_tabletops_connects'] = function() {
  if ('tabletop_cut_v2' === global_options['mouse_mode']['target'] && global_options['mouse_mode']['item_id']) {
    var f = pp['info']['tabletop']['items_parts'] || []
    , g = global_options['mouse_mode']['item_id'];
    for (let h = f.length; h--; )
    f[h]['set_cut_mode'](g);
  }
}
,
sc['need_update_tabletops'] = function() {
  constructor_settings['core_v2'] ? sc['build_tabletop_v3_debounced']() : sc['build_tabletop_debounced']();
}
,
sc['add_tabletop_from_group'] = function(f, g, h, j, k) {
  var m = new THREE['Vector3']()
  , q = ['z', 'x', '-z', '-x']
  , v = f['info']['size'];
  let w = f['info']['axis'];
  var x = f['info']['typeParams'], q = q.findIndex(B => B === w), y = (f['box']['getCenter'](m),
  Math['round'](m['y'] * units - v['y'])), x = {
    'corners_equal': x['corners_equal'],
    'c1': {
      'type': x['c1']['type'],
      'val': x['c1']['val']
    },
    'c2': {
      'type': x['c2']['type'],
      'val': x['c2']['val']
    },
    'c3': {
      'type': x['c3']['type'],
      'val': x['c3']['val']
    },
    'c4': {
      'type': x['c4']['type'],
      'val': x['c4']['val']
    }
  }, z, A = f['start']['tabletop']['userData']['params']['spec']['plints'], A = A ? copy_object(A) : {}, v = {
    'size': {
      'x': v['x'],
      'y': 0,
      'z': v['z']
    },
    'spec': {
      'variants': [{
        'name': '',
        'code': '',
        'price': 0,
        'size': {
          'x': v['x'],
          'y': 0,
          'z': v['z']
        },
        'variables': {},
        'active': 1,
        'accessories': []
      }],
      'can_change': {
        'id': 1
      }
    }
  }, v = sc['create_tabletop'](v, x, j, f['info']['variantId'], f['info']['materialId'], A, k), x = (v['_build_sizes'] = function() {
    if (this['userData']['is_root']) {
      this['userData']['sizes_items'] || (this['userData']['sizes_items'] = []);
      for (let B = this['userData']['sizes_items']['length']; B--; )
      this['userData']['sizes_items'][B]['full_dispose'](),
      this['userData']['sizes_items']['splice'](B, 1);
    }
  }
  ,
  v['_build_sizes'](),
  g ? (room['active_objects']['push'](v),
  d_objects.push(v),
  room['add'](v),
  h && (sc['select_object'](v),
  $('.interface')['css']('pointer-events', 'none'),
  $('.left_subpanel.active')['css']({
    'opacity': 0.1
  }),
  dControls['clear_selected'](),
  dControls['set_selected'](v))) : room['add'](v),
  v['position']['x'] = m['x'],
  v['position']['z'] = m['z'],
  get_tabletop_thickness(f['info']['materialId'], f['info']['variantId']));
  return v['position']['y'] += x / units / 2 + y / units,
  v['rotation']['y'] = Math['PI'] / 2 * q,
  v['userData']['parts']['tabletop'][0]?.['update_auto_connects'](),
  v;
}
,
sc['create_tabletop'] = function(f, g, h, i, j, k, l) {
  if (!f)
  throw new Error('Creating\x20tabletop\x20without\x20params!');
  if (void 0 === j)
  throw new Error('Creating\x20tabletop\x20without\x20materialId!');
  var j = {
    'resizable': {
      'locks': 'y'
    },
    'spec': {
      'element_type': '__tabletop',
      'selected_variant': 0,
      'selected_template': 0,
      'templates': [{
        'name': '',
        'code': '',
        'min': {
          'x': 0,
          'y': 0,
          'z': 0
        },
        'max': {
          'x': 0,
          'y': 0,
          'z': 0
        },
        'template': {
          'tree': [merge(copy_object(pp['engine']['item_def_params']['tabletop']), {
            'type': 'tabletop',
            'id': 'tabletop1',
            'size': {
              'x': 's:x',
              'y': 0,
              'z': 's:z'
            },
            'pivot': {
              'x': 0,
              'y': -1
            },
            'pos': {
              'x': 's:x\x20/\x202',
              'y': 's:y'
            },
            'spec': {
              'name': '',
              'code': '',
              'group': 'tabletop',
              'type': 'common',
              'can_group': 0,
              'can_euro': 0,
              'type_params': {
                'corners_equal': 0,
                'c1': {
                  'type': 'straight',
                  'val': 0
                },
                'c2': {
                  'type': 'straight',
                  'val': 0
                },
                'c3': {
                  'type': 'straight',
                  'val': 0
                },
                'c4': {
                  'type': 'straight',
                  'val': 0
                }
              },
              'cuts': {
                'connects': [],
                'len': 1500
              },
              'material': {
                'id': void 0 !== j ? j : '1',
                'variant_id': i || 0
              },
              'plints': k
            },
            'resizable': {
              'extend_size': 1
            }
          })],
          'variables': {}
        }
      }]
    },
    'show_in_spec': 0
  }, j, i = ((j = merge(copy_object(pp['engine']['item_def_params']['module']), j, f))['obj_id'] || (j['obj_id'] = sc['generate_obj_id']()),
  j['spec']['templates'][0]['template']['tree'][0]), k = (g && (i['spec']['type_params'] = g),
  h && (i['spec']['cuts']['connects'] = h),
  new Module(j));
  return k;
}
,
sc['build_bort_v3'] = function() {
  var f = [], g = sc['find_bort_groups'](null, true), h, i, j;
  for (h of pp['info']['tabletop']['bort_items'])
  if (h) {
    let m = h['userData']['bortGroup'];
    var k = g['find'](p => l(m, p));
    k ? (h['userData']['bortGroup'] = k)['info']['groupObject'] = h : (h['userData']['bortGroup']['info']['groupObject'] && (h['userData']['bortGroup']['info']['groupObject'] = null),
    h['_delete'](),
    h['userData'] && h['userData']['bortGroup'] && (h['userData']['bortGroup'] = null));
  }
  for (i of g) {
    i['info']['groupObject'] ? f.push(i['info']['groupObject']) : (j = sc['add_bort_from_group'](i),
    pp['state']['scene_layers']['tabletop'] || (j['visible'] = false),
    (j['userData']['bortGroup'] = i)['info']['groupObject'] = j,
    f.push(j));
  }
  function l(p, q) {
    var u = 0.05
    , v = p['info']
    , w = q['info'];
    return v['axis'] === w['axis'] && v['materialId'] === w['materialId'] && v['size']['x'] === w['size']['x'] && v['size']['y'] === w['size']['y'] && v['size']['z'] === w['size']['z'] && !(Math['abs'](p['box']['min']['x'] - q['box']['min']['x']) > u || Math['abs'](p['box']['min']['y'] - q['box']['min']['y']) > u || Math['abs'](p['box']['min']['z'] - q['box']['min']['z']) > u);
  }
  pp['info']['tabletop']['bort_items'] = f,
  pp['info']['tabletop']['bort_desc'] = g;
}
,
sc['add_bort_from_group'] = function(f) {
  var g = new THREE['Vector3']()
  , h = ['z', 'x', '-z', '-x']
  , i = f['info']['size'];
  let j = f['info']['axis'];
  var h = h.findIndex(m => m === j);
  if (f['box']['getCenter'](g),
  g['y'] = g['y'] - i['y'] / 2 / units,
  !constructor_settings['core_v2']) {
    let m = {
      'width': i['x'],
      'height': i['y'],
      'depth': i['z'],
      'material': f['info']['materialId']
    }
    , p = (m['obj_id'] || (m['obj_id'] = sc['generate_obj_id']()),
    new BortLegacy(m));
    return p['params']['object_type'] = 'bort',
    room['add'](p),
    p['position']['copy'](g),
    p['rotation']['y'] = Math['PI'] / 2 * h,
    p;
  }
  let k = {
    'size': {
      'x': i['x'],
      'y': i['y'],
      'z': i['z']
    },
    'spec': {
      'material': {
        'id': f['info']['materialId']
      }
    }
  }
  , l = sc['create_bort'](k);
  return room['add'](l),
  l['position']['copy'](g),
  l['rotation']['y'] = Math['PI'] / 2 * h,
  l;
}
,
sc['create_bort'] = function(f) {
  var g, g, h;
  if (f)
  return g = {
    'type': 'bort',
    'id': 'bort1',
    'size': {
      'x': 15,
      'y': 15,
      'z': 15
    },
    'pivot': {
      'x': -1,
      'y': -1,
      'z': -1
    },
    'pos': {
      'x': 0,
      'y': 0,
      'z': 0
    },
    'show_in_spec': 0
  },
  (g = _['mergeWith'](copy_object(pp['engine']['item_def_params']['bort']), g, f))['obj_id'] || (g['obj_id'] = sc['generate_obj_id']()),
  g['spec']['selected_template'] = 0,
  g['spec']['templates'] = [{
    'name': '',
    'code': '',
    'min': {
      'x': 0,
      'y': 0,
      'z': 0
    },
    'max': {
      'x': 0,
      'y': 0,
      'z': 0
    },
    'template': {
      'tree': []
    }
  }],
  new CabinetBort(g);
  throw new Error('Creating\x20bort\x20without\x20params!');
}
);
function user_provider() {
  Vue['prototype']['$up'] = Vue['observable']({
    'is_auth': false,
    'show_modal': false,
    'expires_in': null,
    'api': {
      'auth': 'https://auth.planplace.ru/public/auth/token',
      'get_data': 'https://auth.planplace.ru/public/auth/userinfo',
      'get_valid_token': 'https://auth.planplace.ru/public/auth/refresh_token'
    },
    'access_token': null,
    'refresh_token': null,
    'grant_type': 'password',
    'scope': 'app',
    'user_info': {},
    'message': '',
    async 'login'(f) {
      var g = new FormData();
      g['append']('username', f['login']),
      g['append']('password', f['password']),
      g['append']('grant_type', this['grant_type']),
      g['append']('scope', this['scope']);
      try {
        var h = await axios['post'](this['api']['auth'], g, {
          'withCredentials': true
        }), i;
        if (200 === h['status'])
        return (i = h['data'])['access_token'] ? (localStorage['setItem']('access_token', i['access_token']),
        localStorage['setItem']('refresh_token', i['refresh_token']),
        localStorage['setItem']('username', f['login']),
        this['is_auth'] = true,
        this['expires_in'] = i['expires_in'],
        this['access_token'] = i['access_token'],
        this['refresh_token'] = i['refresh_token'],
        this['decodeJWT'](this['access_token']),
        await this['get_data'](),
        {
          'success': true,
          'message': 'auth_succsess'
        }) : {
          'success': false,
          'message': 'auth_not_token'
        };
      } catch (k) {
        var g = k?.['response']?.['data']?.['error_description'], j;
        return {
          'success': false,
          'message': g || 'auth_error',
          'error_code': k?.['response']?.['status']
        };
      }
    },
    'decodeJWT'(f) {
      try {
        var g = f.split('.');
        if (3 !== g.length)
        throw new Error('Некорректный\x20формат\x20JWT\x20токена');
        var h = JSON['parse'](atob(g[0]['replace'](/-/g, '+')['replace'](/_/g, '/'))), i;
        return JSON['parse'](atob(g[1]['replace'](/-/g, '+')['replace'](/_/g, '/')));
      } catch (j) {}
    },
    async 'get_data'() {
      try {
        var f = await axios['post'](this['api']['get_data'], {}, {
          'headers': {
            'Authorization': 'Bearer\x20' + this['access_token'],
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }), g;
        200 === f['status'] && (g = f['data'],
        this['user_info'] = g);
      } catch (k) {
        try {
          var h = new FormData(), i = (h['append']('refresh_token', this['refresh_token']),
          h['append']('grant_type', 'refresh_token'),
          await axios['post'](this['api']['get_valid_token'], h)), j;
          200 === i['status'] && (j = i['data'])['access_token'] && (localStorage['setItem']('access_token', j['access_token']),
          this['access_token'] = j['access_token'],
          await this['get_data']());
        } catch (l) {
          this['is_auth'] = false,
          this['access_token'] = null,
          this['refresh_token'] = null,
          localStorage['setItem']('access_token', ''),
          localStorage['setItem']('refresh_token', ''),
          localStorage['setItem']('username', ''),
          localStorage['removeItem']('access_token'),
          localStorage['removeItem']('refresh_token'),
          localStorage['removeItem']('username'),
          sessionStorage['removeItem']('access_token'),
          sessionStorage['removeItem']('refresh_token');
        }
      }
    },
    'logout'() {
      this['is_auth'] = false,
      this['access_token'] = null,
      this['refresh_token'] = null,
      localStorage['setItem']('access_token', ''),
      localStorage['setItem']('refresh_token', ''),
      localStorage['setItem']('username', ''),
      localStorage['removeItem']('access_token'),
      localStorage['removeItem']('refresh_token'),
      localStorage['removeItem']('username'),
      sessionStorage['removeItem']('access_token'),
      sessionStorage['removeItem']('refresh_token');
    },
    async 'load_from_storage'() {
      var f = localStorage['getItem']('access_token')
      , g = localStorage['getItem']('refresh_token');
      f && g && (this['is_auth'] = true,
      this['access_token'] = f,
      this['refresh_token'] = g,
      await this['get_data']());
    }
  });
}
let def_cabinet_section = copy_object(cabinet_def_common)
, CabinetAnalyzer = new Analyzer();
class CabinetSection extends THREE['Group'] {
  constructor(f={}, g={
    'root': null,
    'parent': null,
    'local_parent': null,
    'path': '0'
  }, h={}) {
    super(),
    this['_build_struct'](),
    this['userData']['after_rebuild_callbacks'] = [],
    this['userData']['obj_links'] = {
      'number': null,
      'comments': {
        'sprite': null,
        'line': null
      }
    },
    this['_main'](f, g, h);
  }
  ['_main'](f, g, h) {
    this['_before_params'](f, g, h),
    'module' !== f['type'] && g['root'] || f['templates_loaded'] || this['load_templates'](f),
    this['_build_params'](f, g, h),
    this['_build_computed'](),
    this['_build_defaults'](),
    this['_before_variables'](),
    this['_build_variables'](),
    this['_build_comp_obj'](),
    this['_before_build'](),
    this['_build'](),
    this['_after_build'](),
    'edges' == global_options['mode'] && this['_show_helpers_edges']();
  }
  ['_rebuild']() {
    var f = this['userData']['is_root'] ? this['userData']['params'] : module_utils['get_child_params_by_path'](this, this['userData']['path']);
    if (this['_main'](f, this['userData']['parent_params'], this['userData']['add_params']),
    this['userData']['after_rebuild_callbacks']) {
      for (let g = 0; g < this['userData']['after_rebuild_callbacks']['length']; g++)
      this['userData']['after_rebuild_callbacks'][g]['fn'](this, this['userData']['after_rebuild_callbacks'][g]['params']);
    }
    this['userData']['after_rebuild_callbacks'] = [];
  }
  ['_before_variables']() {}
  ['_before_params'](f, g, h) {
    this['userData']['class'] = this.constructor['name'],
    this['temp_type'] = this.constructor['name'],
    f['type'] || (f['type'] = 'section'),
    pp['events']['cabinet']['before_build_params'] && pp['events']['cabinet']['before_build_params'](this, f, g, h),
    f['events'] && f['events']['on_before_params'] && 'function' == typeof pp['events']['custom'][f['events']['on_before_params']] && pp['events']['custom'][f['events']['on_before_params']](f, g, h);
  }
  ['_build_params'](f, g, h) {
    var j = 'module' === f['type'], f, k = void 0 !== f['size'], f = merge_copies(pp['engine']['item_def_params'][f['type']], f), h = (f['spec']['defaults'] && (f['spec']['defaults'] = fix_json_empty_object(f['spec']['defaults']),
    0 === f['spec']?.['defaults']?.['facade']?.['id']) && (f['spec']['defaults']['facade']['id'] = pp['const']['not_set_value']),
    this['name'] = f['name'],
    this['userData']['id'] = f['id'],
    this['userData']['params'] = f,
    this['userData']['parent_params'] = g,
    this['userData']['add_params'] = h,
    this['is_interactive'] = 1 == this['userData']['params']['interactive'],
    this['userData']['parent'] = g['parent'],
    this['userData']['path'] = g['path'],
    this['userData']['parent_params'] = g,
    j && g['root'] && g['root'] !== this), h, g, k, j;
    h ? (this['userData']['root'] = g['root'],
    this['_make_root'](h)) : g['root'] ? this['userData']['root'] = g['root'] : this['_make_root'](),
    this['userData']['ids'] = {},
    this['cust_dists'] = {},
    this['userData']['local_parent'] = g['local_parent'],
    this['userData']['is_root'] && !k && delete f['size'],
    (this['userData']['is_root'] || j) && (h = this['_match_template'](f),
    f['variables'] || (f['variables'] = {
      'main': {}
    }),
    f['variables']['main'] && !Array.isArray(f['variables']['main']) || (f['variables']['main'] = {}),
    this['set_selected_template_property'](h['selected_template'])),
    this['userData']['is_root'] && !this['userData']['init_empty_values'] && (this['userData']['init_empty_values'] = 1,
    g = f['spec']['defaults'] ? copy_object(f['spec']['defaults']) : {},
    k = module_utils['get_global_defaults'](f),
    j = module_utils['create_defaults'](g, null, k),
    module_utils['init_empty_values_recursive'](f, j, true)),
    'Cabinet' !== this['userData']['root']['type'] && delete f['children'],
    this['update_params_types'](),
    pp['events']['cabinet']['after_build_params'] && pp['events']['cabinet']['after_build_params'](this);
  }
  ['_build_computed']() {
    var f, g, f;
    this['userData']['computed'] = {},
    this['userData']['computed']['variables'] = {},
    this['userData']['computed']['size'] = new THREE['Vector3'](),
    this['userData']['computed']['pos'] = new THREE['Vector3'](),
    this['userData']['computed']['rot'] = new THREE['Vector3'](),
    this['userData']['computed']['scale'] = new THREE['Vector3'](),
    this['userData']['computed']['u_size'] = new THREE['Vector3'](),
    this['userData']['computed']['meshes_list'] = [],
    this['userData']['computed']['meshes_list_by_material'] = {},
    this['userData']['computed']['additional_sizes'] = [],
    'module' === this['userData']['params']['type'] && (f = this['userData']['params']['spec'],
    this['userData']['params']['spec']['templates'] || (this['userData']['params']['spec']['templates'] = [{
      'name': '',
      'code': '',
      'min': {
        'x': 0,
        'y': 0,
        'z': 0
      },
      'max': {
        'x': 0,
        'y': 0,
        'z': 0
      },
      'template': {
        'tree': []
      }
    }]),
    this['userData']['params']['spec']['variants'] || (this['userData']['params']['spec']['variants'] = [{
      'name': '',
      'code': '',
      'price': 0,
      'variables': {},
      'active': 1,
      'accessories': [],
      'size': {
        'x': 0,
        'y': 0,
        'z': 0
      }
    }]),
    f = (g = this['userData']['params']['spec']['variants'])[f['selected_variant']] || {},
    this['userData']['params']['name'] || (this['name'] = f['name'] || '',
    this['userData']['params']['name'] = f['name'] || ''),
    f['name'] && (this['userData']['computed']['name'] = f['name'] || ''),
    this['userData']['computed']['code'] = f['code'] || '',
    this['userData']['computed']['price'] = f['price'] || 0),
    this['_build_tags']();
  }
  ['_build_variables']() {
    var f = this['userData']['params'], g = f['variables'] ? copy_object(f['variables']) : {}, j;
    let k = g['main'] || {};
    if (k = fix_json_empty_object(k),
    'module' === f['type'] || this['userData']['is_root']) {
      let C = (f['spec']['template'] || {})['variables'] || {};
      Object['keys'](C)['forEach'](D => {
        k[D] && !is_empty_value(k[D]['value']) || is_empty_value(C[D]['value']) || (k[D] = copy_object(C[D]));
      }
      );
    }
    var m = pp['variables']['current'], f = g['global'], q, q, f, f, f;
    if (f && m)
    for (let D of f) {
      k[D['key']] && !is_empty_value(k[D['key']]['value']) && k[D['key']]['fixed'] && !D['fixed'] || !(q = _['find'](m, E => E['key'] === D['key'])) || k[D['key']] && is_empty_value(D['value']) && is_empty_value(q['value']) || (delete (q = copy_object(q))['local'],
      delete q['fixed'],
      is_empty_value(D['value']) || (q['value'] = D['value']),
      void 0 !== D['local'] && (q['local'] = D['local']),
      void 0 !== D['fixed'] && (q['fixed'] = D['fixed']),
      k[D['key']] = q);
    }
    if (!this['userData']['is_root']) {
      let E = this['userData']['root']
      , F = this['userData']['local_parent'];
      F && F !== this ? F['userData']['computed']['variables'] && Object['keys'](F['userData']['computed']['variables'])['forEach'](G => {
        k[G] && (!is_empty_value(k[G]['value']) && (k[G]['local'] || k[G]['fixed']) || is_empty_value(F['userData']['computed']['variables'][G]['value'])) || (k[G] = copy_object(F['userData']['computed']['variables'][G]),
        delete k[G]['local'],
        delete k[G]['fixed']);
      }
      ) : Object['keys'](E['userData']['computed']['variables'])['forEach'](G => {
        k[G] && (!is_empty_value(k[G]['value']) && (k[G]['local'] || k[G]['fixed']) || is_empty_value(E['userData']['computed']['variables'][G]['value'])) || (k[G] = copy_object(E['userData']['computed']['variables'][G]),
        delete k[G]['local'],
        delete k[G]['fixed']);
      }
      );
    }
    if (k[pp['const']['vars']['cokol_height']] && (f = this['_get_defaults'](),
    k[pp['const']['vars']['cokol_height']]['value'] = z(f?.['cokol']['id'])),
    k[pp['const']['vars']['tabletop_height']] && (f = this['_get_defaults'](),
    k[pp['const']['vars']['tabletop_height']]['value'] = A(f?.['tabletop']['id'], f?.['tabletop']['variant_id'])),
    k[pp['const']['vars']['facade_thickness']] && (f = this['_get_defaults'](),
    k[pp['const']['vars']['facade_thickness']]['value'] = B(f?.['facade']['id'], f?.['facade']['type_side'])),
    g['override']) {
      var f = this['userData']['parent'], v = this['userData']['root'], w = this['userData']['local_parent'], x = {
        'parent_size': null != f ? f['userData']['computed']['size'] : new THREE['Vector3'](),
        'variables': k,
        'computed': (w || v)?.['userData']['computed']['computed'] || {},
        'props': (w || v)?.['userData']['computed']['props'] || {},
        'materials': (w || v)?.['userData']['computed']['materials'] || {},
        'local_parent': null != w ? w : {}
      }, y;
      for (y of Object['keys'](g['override']))
      k[y] && (k[y]['value'] = comp2(g['override'][y], x));
    }
    function z(G) {
      var H;
      return pp['libs']['cokol']['items'][G]?.['params']['height'] || 0;
    }
    function A(G, H) {
      var I = pp['libs']['tabletop'];
      return get_variant_thickness(G, H || 0, I, 0);
    }
    function B(G, H) {
      var G = pp['libs']['facades']['items'][G];
      return G ? H && void 0 !== G['thickness_side'] ? G['thickness_side'] || 0 : G['thickness'] || 0 : 0;
    }
    this['userData']['computed']['variables'] = k;
  }
  ['_build_defaults']() {}
  ['_get_defaults']() {
    var f, g, h;
    return ('module' === this['userData']['params']['type'] || this['userData']['is_root'] ? this : this['userData']['local_parent'] || this['userData']['root'])['userData']['computed']['defaults'];
  }
  ['_build_comp_obj']() {
    var f = this['userData']['parent']
    , g = this['userData']['root']
    , h = this['userData']['local_parent'];
    this['userData']['computed']['c_object'] = {
      'parent_size': null != f ? f['userData']['computed']['size'] : new THREE['Vector3'](),
      'root_size': g ? g['userData']['computed']['size'] : new THREE['Vector3'](),
      'variables': this['userData']['computed']['variables'],
      'computed': (h || g)?.['userData']['computed']['computed'] || {},
      'props': (h || g)?.['userData']['computed']['props'] || {},
      'materials': (h || g)?.['userData']['computed']['materials'] || {},
      'local_parent': null != h ? h : {}
    };
  }
  ['_build_tags']() {
    var f = this['userData']['params']
    , g = this['userData']['computed'];
    if (g['tags'] = {},
    f['tags']) {
      var h = f['tags']['split'](',');
      for (let i = 0; i < h.length; i++)
      g['tags'][h[i]] = 1;
    }
  }
  ['_build_struct']() {
    this['userData']['struct'] = {},
    this['userData']['own_object'] = new THREE['Group'](),
    this['userData']['own_object']['name'] = '__own_object',
    this['userData']['struct'][this['userData']['own_object']['name']] = this['userData']['own_object'],
    this['userData']['children'] = this['userData']['own_object']['children'],
    this['add'](this['userData']['own_object']);
  }
  ['_before_build']() {}
  ['_after_build']() {
    pp['events']['cabinet']['after_build'] && pp['events']['cabinet']['after_build'](this);
  }
  ['_build']() {
    var f = this['userData']['params'], g = this['userData']['helpers'], h = this['userData']['own_object'], j = this['userData']['root'], h, j;
    let k = 0;
    this['userData']['is_root'] && this['userData']['params_types']['tabletop'] && (k = this['box']?.['max']['y'] || 0),
    this['_reset'](h),
    this['userData']['is_root'] && j['userData']['extend_size_info'] && (j['userData']['extend_size_info']['items_by_path'] = {}),
    this['_build_size'](),
    this['_build_pos'](),
    this['_build_rot'](),
    this['_build_scale'](),
    this['_build_pivot'](),
    this['_build_c_rot'](),
    f['active'] && this['_build_spec'](),
    this['visible'] = !(0 == f['visible'] || 0 == f['active']),
    'undefined' == typeof view_mode || view_mode || 'tabletop' !== f['type'] || '__tabletop' === j['userData']['params']?.['spec']?.['element_type'] || (this['visible'] = false),
    this['userData']['is_root'] && !j['userData']['toggles_by_path'] && (j['userData']['toggles_by_path'] = {}),
    !this['userData']['is_root'] && f['toggle'] && ((h = copy_object(f['toggle']))['__path'] = this['userData']['path'],
    void 0 === h['name'] && (h['name'] = h['key']),
    j['userData']['toggles_by_path'][this['userData']['path']] = h),
    this['_build_children'](),
    is_empty_value(f['interaction']?.['offset_y']) || (this['position']['y'] = f['interaction']['offset_y'] / units),
    this['userData']['interaction'] = f['interaction'],
    this['userData']['is_root'] && this['_extend_size'](),
    this['userData']['is_root'] && this['userData']['params_types']['tabletop'] && (j = this['box']?.['max']['y'] || 0,
    Number['isFinite'](j)) && Number['isFinite'](k) && 0.01 < Math['abs'](j - k) && sc['build_tabletop']();
  }
  ['_build_fast']() {
    var f = this['userData']['params'], f;
    let g = 0;
    this['userData']['is_root'] && this['userData']['params_types']['tabletop'] && (g = this['box']?.['max']['y'] || 0),
    this['userData']['is_root'],
    this['_build_size'](),
    this['_build_pos'](),
    this['_build_rot'](),
    this['_build_pivot'](),
    this['_build_c_rot'](),
    this['_build_helpers'](),
    is_empty_value(f['interaction']?.['offset_y']) || (this['position']['y'] = f['interaction']['offset_y'] / units),
    this['userData']['is_root'] && this['_extend_size'](),
    this['userData']['is_root'] && this['userData']['params_types']['tabletop'] && (f = this['box']?.['max']['y'] || 0,
    Number['isFinite'](f)) && Number['isFinite'](g) && 0.01 < Math['abs'](f - g) && sc['build_tabletop']();
  }
  ['_update_pos']() {
    var f = this['userData']['params'];
    this['_build_pos'](),
    this['_build_rot'](),
    this['_build_pivot'](),
    this['_build_c_rot'](),
    is_empty_value(f['interaction']?.['offset_y']) || (this['position']['y'] = f['interaction']['offset_y'] / units),
    this['userData']['interaction'] = f['interaction'];
  }
  ['_build_size']() {
    var f = this['userData']['computed']
    , g = this['userData']['params']
    , h = f['c_object'];
    f['size']['x'] = comp2(g['size']['x'], h),
    f['size']['y'] = comp2(g['size']['y'], h),
    f['size']['z'] = comp2(g['size']['z'], h),
    f['u_size'] = f['size']['clone']()['divideScalar'](units);
  }
  ['_build_pos']() {
    var f = this['userData']['computed']
    , g = this['userData']['params']
    , h = f['c_object'];
    f['pos']['x'] = comp2(g['pos']['x'], h),
    f['pos']['y'] = comp2(g['pos']['y'], h),
    f['pos']['z'] = comp2(g['pos']['z'], h),
    this['userData']['is_root'] ? this['userData']['own_object']['position']['set']((-f['size']['x'] / 2 + f['pos']['x']) / units, f['pos']['y'] / units, (-f['size']['z'] / 2 + f['pos']['z']) / units) : this['position']['set']((-h['parent_size']['x'] / 2 + f['pos']['x']) / units, (-h['parent_size']['y'] / 2 + f['pos']['y']) / units, (-h['parent_size']['z'] / 2 + f['pos']['z']) / units);
  }
  ['_build_spec']() {}
  ['_build_pivot']() {
    var f = this['userData']['computed']
    , g = this['userData']['params']
    , h = this['userData']['own_object']
    , j = conv_pivot(g['pivot']['x'], f['size']['x'])
    , k = conv_pivot(g['pivot']['y'], f['size']['y'])
    , g = conv_pivot(g['pivot']['z'], f['size']['z']);
    h['translateX'](j / units),
    h['translateY'](k / units),
    h['translateZ'](g / units);
  }
  ['_build_rot']() {
    var f = this['userData']['computed'], g = this['userData']['params'], h = this['userData']['own_object'], j = f['c_object'], k, l, g, k = comp2(g['rot']['x'], j), l = comp2(g['rot']['y'], j), g = comp2(g['rot']['z'], j);
    f['rot']['x'] = k,
    f['rot']['y'] = l,
    f['rot']['z'] = g,
    h['rotation']['set'](0, 0, 0),
    h['rotateX'](-deg2rad(k)),
    h['rotateY'](-deg2rad(l)),
    h['rotateZ'](-deg2rad(g));
  }
  ['_build_scale']() {
    var f = this['userData']['computed'], g = this['userData']['params'], h = this['userData']['own_object'], j = f['c_object'], k, l, g, k = comp2(g['scale']['x'], j), l = comp2(g['scale']['y'], j), g = comp2(g['scale']['z'], j);
    f['scale']['x'] = k,
    f['scale']['y'] = l,
    f['scale']['z'] = g,
    h['scale']['set'](k, l, g);
  }
  ['_build_c_rot']() {
    return;
    var f = this['userData']['computed']
    , g = this['userData']['params']
    , h = this['userData']['own_object']
    , f = f['c_object'];
    h['rotateX'](-deg2rad(comp2(g['c_rot']['x'], f))),
    h['rotateY'](-deg2rad(comp2(g['c_rot']['y'], f))),
    h['rotateZ'](-deg2rad(comp2(g['c_rot']['z'], f)));
  }
  ['_build_children']() {
    var f = this['userData']['params']
    , g = 'module' !== f['type'] || this['userData']['is_root'] ? this['userData']['local_parent'] : this
    , j = this['userData']['root']
    , k = this['userData']['computed']
    , m = j['userData']['extend_size_info'];
    let q = this['userData']['params']['children'];
    var v = 'Cabinet' === j['type'], w;
    v || (q = this['userData']['is_root'] || this === g ? f['spec']['template']?.['tree'] || [] : (w = module_utils['get_child_params_by_path'](this, this['userData']['path'])) && w['children'] || []);
    let x = j;
    g && (x = g);
    for (let B = 0; B < q.length; B++) {
      var y = copy_object(this['userData']['path']) + ',' + B, z, z;
      let C;
      if (C = v ? A(this, y) : module_utils['get_child_params_by_path'](x, y),
      j['userData']['params_hash'][C['type']]['push'](C),
      'info_section' !== C['type']) {
        let D = true;
        f['active'] && C['active'] && (C['condition']?.['length'] && ((z = {
          ...k['c_object']
        })['parent_size'] = k['size'],
        D = ConditionChecker['check'](C['condition'], z)),
        !(D && C['toggle'] && C['toggle']['enabled']) || C['toggle']['value']) || (D = false);
        let E = j['userData']['parts_by_path'][C['type']][y];
        D ? E && (_['remove'](j['userData']['parts'][C['type']], F => F === E),
        delete j['userData']['parts_by_path'][C['type']][y],
        m && void 0 !== m['items_by_path'][y] && (delete m['items_by_path'][y],
        m['need_update'] = true),
        delete j['userData']['toggles_by_path'][y]) : (m && void 0 !== m['items_by_path'][y] && (delete m['items_by_path'][y],
        m['need_update'] = true),
        this['clean_parts'](y),
        this['find_toggles'](C, j['userData']['toggles_by_path'], y)),
        D && (z = new pp['engine']['item_types'][C['type']](C,{
          'parent': this,
          'local_parent': g,
          'root': this['userData']['root'],
          'path': y,
          'variables': {}
        },{
          'use_lib': true,
          'params': {},
          'material': {}
        }),
        m && C['resizable'] && C['resizable']['extend_size'] && (m['items_by_path'][y] = z,
        m['need_update'] = true),
        C['id'] && (x['userData']['ids'][C['id']] = z),
        j['userData']['parts'][C['type']]['push'](z),
        j['userData']['parts_by_path'][C['type']][y] = z,
        this['userData']['own_object']['add'](z));
      }
    }
    function A(F, G) {
      let H = F['userData']['params'];
      var I = G.split(',');
      I['shift']();
      for (let J = 0; J < I.length; J++)
      H = H['children'][I[J]];
      return H;
    }
  }
  ['clean_parts'](f) {
    var g = this['userData']['root'], h = g['userData']['extend_size_info'], j = g['userData']['parts'], k = g['userData']['parts_by_path'], m = g['userData']['toggles_by_path'], n = void 0 !== f ? f : this['userData']['path'], p;
    for (p of Object['keys'](j)) {
      var q = j[p];
      for (let u = q.length - 1; 0 <= u; u--) {
        let v = q[u]['userData']['path'];
        v && v['startsWith'](n) && v.length !== n.length && (q['splice'](u, 1),
        delete k[p][v],
        delete m[v],
        h) && void 0 !== h['items_by_path'][v] && (delete h['items_by_path'][v],
        h['need_update'] = true);
      }
    }
  }
  ['_extend_size']() {
    var f = this['userData']['root']
    , g = f['userData']['extend_size_info'];
    if (g && g['need_update']) {
      var h;
      if (g['need_update'] = false,
      (h = Object['values'](g['items_by_path']))['length']) {
        f['updateMatrixWorld']();
        var j = 0.05, k = f['_get_forward'](), m, j;
        let w = ''
        , x = 'z';
        if ((Math['abs'](Math['abs'](k['x']) - 1) < j || Math['abs'](Math['abs'](k['z']) - 1) < j) && (x = Math['abs'](Math['abs'](k['z']) - 1) < j ? 'z' : 'x',
        j = Math['sign'](k[x]),
        w = (j < 0 ? '-' : '') + x),
        w) {
          var q = g['box'] || new THREE['Box3'](), u;
          q['makeEmpty']();
          for (u of h) {
            let y = new THREE['Box3']()['setFromCenterAndSize'](u['userData']['own_object']['getWorldPosition'](new THREE['Vector3']()), new THREE['Vector3'](u['userData']['computed']['u_size']['x'],u['userData']['computed']['u_size']['y'],u['userData']['computed']['u_size']['z']));
            u['updateMatrixWorld']();
            var v = u['userData']['own_object']['getWorldQuaternion'](new THREE['Quaternion']());
            y = getRotatedBox3(y, y['getCenter'](new THREE['Vector3']()), v),
            q['union'](y);
          }
          var k = new THREE['Vector3'](), j, h;
          f['getWorldPosition'](k),
          k['negate'](),
          q['translate'](k),
          '-z' !== w && '-x' !== w || (j = -q['min']['x'],
          q['min']['x'] = -q['max']['x'],
          q['max']['x'] = j),
          '-z' !== w && 'x' !== w || (h = -q['min']['z'],
          q['min']['z'] = -q['max']['z'],
          q['max']['z'] = h),
          'x' === x && (k['copy'](q['min']),
          q['min']['x'] = k['z'],
          q['min']['z'] = k['x'],
          k['copy'](q['max']),
          q['max']['x'] = k['z'],
          q['max']['z'] = k['x']),
          g['box'] = q;
        } else
        g['box'] = null;
      } else
      g['box'] = null;
    }
    f['_update_size_box']();
  }
  ['_update_size_box']() {
    if (this['userData']['is_root']) {
      var f = this['userData']['computed']['u_size'], f = new THREE['Vector3'](f['x'],f['y'],f['z']), g;
      let j, k = 0, l = this['userData']['extend_size_info'] && this['userData']['extend_size_info']['box'];
      if (l) {
        j = new THREE['Vector3'](),
        g = new THREE['Vector3']();
        let m = this['userData']['extend_size_info']['box'];
        m['min']['x'] < -f['x'] / 2 && (j['x'] += -(-f['x'] / 2 - m['min']['x']) / 2,
        g['x'] += -f['x'] / 2 - m['min']['x']),
        m['max']['x'] > f['x'] / 2 && (j['x'] += (m['max']['x'] - f['x'] / 2) / 2,
        g['x'] += m['max']['x'] - f['x'] / 2),
        m['min']['y'] < 0 && (j['y'] += -(0 - m['min']['y']) / 2,
        g['y'] += 0 - m['min']['y'],
        k = -(0 - m['min']['y'])),
        m['max']['y'] > f['y'] && (j['y'] += (m['max']['y'] - f['y']) / 2,
        g['y'] += m['max']['y'] - f['y']),
        m['min']['z'] < -f['z'] / 2 && (j['z'] += -(-f['z'] / 2 - m['min']['z']) / 2,
        g['z'] += -f['z'] / 2 - m['min']['z']),
        m['max']['z'] > f['z'] / 2 && (j['z'] += (m['max']['z'] - f['z'] / 2) / 2,
        g['z'] += m['max']['z'] - f['z'] / 2),
        f['add'](g);
      }
      if (this['size_box'] ? this['size_box']['set_size'](f['x'], f['y'], f['z']) : (this['size_box'] = new SizeBox({
        'width': f['x'],
        'height': f['y'],
        'depth': f['z']
      }),
      this['add'](this['size_box'])),
      this['size_box']['visible'] = false,
      j) {
        for (var h of this['children'])
        h['position']['x'] += -j['x'],
        h['position']['y'] += -k,
        h['position']['z'] += -j['z'];
      }
      this['size_box']['position']['copy'](this['userData']['own_object']['position']),
      j && this['size_box']['position']['add'](j),
      this['size_box']['rotation']['copy'](this['userData']['own_object']['rotation']),
      this['box']['update']();
    }
  }
  ['_build_helpers']() {
    var f = this['userData']['computed']
    , g = (this['userData']['helpers'] ? this['_reset'](this['userData']['helpers']) : (this['userData']['helpers'] = new THREE['Group'](),
    this['userData']['helpers']['name'] = '__helpers',
    this['add'](this['userData']['helpers'])),
    make_cube(f['size']['x'] / units, f['size']['y'] / units, f['size']['z'] / units, pp['three']['materials']['helper_cube']))
    , f = (g['userData']['is_helper'] = true,
    g['userData']['no_edges'] = 1,
    g['userData']['is_helper'] = 1,
    g['renderOrder'] = 10,
    g['layers']['set'](1),
    this['userData']['helpers']['userData']['size_volume'] = g,
    this['userData']['helpers']['add'](g),
    make_edges(f['size']['x'] / units, f['size']['y'] / units, f['size']['z'] / units, pp['three']['materials']['basic_line']));
    f['userData']['is_helper'] = true,
    f['userData']['no_edges'] = 1,
    f['userData']['is_helper'] = 1,
    f['renderOrder'] = 11,
    f['layers']['set'](1),
    this['userData']['helpers']['add'](g),
    this['userData']['helpers']['add'](f),
    this['userData']['helpers']['position']['copy'](this['userData']['own_object']['position']),
    this['userData']['helpers']['rotation']['copy'](this['userData']['own_object']['rotation']),
    this['userData']['helpers']['visible'] = 1 == this['userData']['params']['helpers_visible'];
  }
  ['_show_helpers']() {
    this['userData']['helpers'] || this['_build_helpers'](),
    this['userData']['helpers']['visible'] = true;
  }
  ['_hide_helpers']() {
    this['userData']['helpers'] && (this['_reset'](this['userData']['helpers']),
    this['remove'](this['userData']['helpers']),
    this['userData']['helpers'] = null);
  }
  ['_hide']() {
    for (let f = this['userData']['own_object']['children']['length']; f--; )
    this['userData']['own_object']['children'][f]['visible'] = false;
    for (let g = 0; g < this['userData']['children']['length']; g++)
    this['userData']['children'][g]['_hide']();
  }
  ['_show']() {
    for (let f = this['userData']['own_object']['children']['length']; f--; )
    this['userData']['own_object']['children'][f]['visible'] = true;
    for (let g = 0; g < this['userData']['children']['length']; g++)
    this['userData']['children'][g]['_show']();
  }
  ['_set_visible'](f) {
    for (let g = this['userData']['own_object']['children']['length']; g--; )
    this['userData']['own_object']['children'][g]['visible'] = f;
    for (let h = 0; h < this['userData']['children']['length']; h++)
    this['userData']['children'][h]['_set_visible'](f);
  }
  ['change_toggle_by_path'](f, g, h=true) {
    let j = this['userData']['root'];
    var k = j['userData']['toggles_by_path']
    , k = (k && k[f] && (k[f]['value'] = to_int(g)),
    module_utils['get_parent_and_child_by_path'](this, f));
    if (k['parent'] && k['child']) {
      var f = k['childIndex'];
      if (!(f < 0)) {
        var l = k['parent'];
        if (l && l['children'] && !(f >= l['children']['length'])) {
          var f = k['child'];
          if (f['toggle'] && (f['toggle']['value'] = to_int(g),
          h)) {
            if ('0' === k['parentPath'])
            j['_rebuild']();
            else {
              var l = module_utils['get_child_by_path'](this, k['parentPath']);
              if (l && l['_rebuild']) {
                var g = f['resizable']?.['extend_size'];
                l['_rebuild']();
                let m = this['userData']['is_root'] ? this : this['userData']['root'];
                g && m?.['_build_fast']();
              }
            }
          }
        }
      }
    }
  }
  ['change_toggle_by_key'](f, g, h=true) {
    let j = this['userData']['root'];
    var k = j['userData']['toggles_by_path'];
    g = to_int(g);
    let m = false
    , q = false;
    var v = [];
    if (k)
    for (var w of Object['keys'](k)) {
      var x = k[w], x, w, y, w, y, z;
      x && x['key'] === f && (x['value'] = g,
      h) && !m && (x = module_utils['get_parent_and_child_by_path'](this, w))['parent'] && x['child'] && ((w = x['childIndex']) < 0 || (y = x['parent']) && y['children'] && (w >= y['children']['length'] || (w = x['child'])['toggle'] && ('0' === x['parentPath'] ? m = true : (y = module_utils['get_child_by_path'](this, x['parentPath'])) && y['_rebuild'] && (w['resizable']?.['extend_size'] && (q = true),
      v.push(y)))));
    }
    if (this['walk_params_tree'](B => {
      B['toggle'] && B['toggle']['key'] === f && (B['toggle']['value'] = to_int(g));
    }
    ),
    h) {
      if (m)
      j['_rebuild']();
      else {
        for (var A of v)
        A['_rebuild']();
        if (q) {
          let B = this['userData']['is_root'] ? this : B;
          B?.['_build_fast']();
        }
      }
    }
  }
  ['_reset'](f=this['userData']['own_object']) {
    if (f['rotation']['set'](0, 0, 0),
    f['position']['set'](0, 0, 0),
    f['children']['length']) {
      for (let g = f['children']['length']; g--; )
      this['_reset'](f['children'][g]);
    }
    this['userData']['struct'][f['name']] || ('Mesh' === f['type'] && (f['geometry']['dispose'](),
    dispose_material(f['material'])),
    f['parent'] && f['parent']['remove'](f));
  }
  ['_get_child_by_id'](f, g=this) {
    let h = null;
    return g['userData']['id'] == f ? g : (g['userData']['children'] && g['userData']['children']['length'] && g['userData']['children']['some'](i => h = this['_get_child_by_id'](f, i)),
    h);
  }
  ['_get_children_by_id'](f, g=[], h=this) {
    if (h['userData']['id'] != f)
    return h['userData']['children'] && h['userData']['children']['length'] && h['userData']['children']['some'](i => {
      this['_get_children_by_id'](f, g, i);
    }
    ),
    g;
    g.push(h);
  }
  async['_load_model'](f='', g={}, h={
    'rot': {
      'x': 0,
      'y': 0,
      'z': 0,
      'order': 'XYZ'
    },
    'scale': {
      'x': 1,
      'y': 1,
      'z': 1
    },
    'pos': {
      'x': 0,
      'y': 0,
      'z': 0
    },
    'set_uv': 1,
    'process': 1,
    'meshes': {}
  }) {
    var j = this['userData']['computed']
    , f = f;
    if (j['meshes_list'] = [],
    j['cut_meshes'] = [],
    1 == h['process']) {
      var k = await Model_utils['load_model']({
        'model': f,
        'buffer': true,
        'no_cache': -1 < f['indexOf']('data:application'),
        'rot': h['rot'],
        'scale': h['scale'],
        'process': h['process']
      });
      for (let u = 0; u < k.length; u++) {
        var m = k[u]['clone']()
        , n = new THREE['Euler'](THREE['MathUtils']['degToRad'](h['rot']['x']),THREE['MathUtils']['degToRad'](h['rot']['y']),THREE['MathUtils']['degToRad'](h['rot']['z']),h['rot']['order'])
        , p = new THREE['Matrix4']()['makeRotationFromEuler'](n)
        , n = (m['scale'](h['scale']['x'], h['scale']['y'], h['scale']['z']),
        new THREE['Mesh'](m,red_mat));
        n['name'] = m['name'],
        n['castShadow'] = true,
        n['receiveShadow'] = true,
        h['meshes'][m['name']] || (h['meshes'][m['name']] = Model_utils['parse_mesh_name'](m['name'])),
        j['meshes_list']['push']({
          'mesh': n,
          'params': h['meshes'][m['name']]
        }),
        '__cut' == n['name'] && j['cut_meshes']['push'](n),
        this['userData']['own_object']['add'](n);
      }
      this['_set_model3d_size'](f, h),
      this['userData']['own_object']['translateX'](h['pos']['x'] / units),
      this['userData']['own_object']['translateY'](h['pos']['y'] / units),
      this['userData']['own_object']['translateZ'](h['pos']['z'] / units),
      this['userData']['own_object']['rotateX'](THREE['MathUtils']['degToRad'](h['rot']['x'])),
      this['userData']['own_object']['rotateY'](THREE['MathUtils']['degToRad'](h['rot']['y'])),
      this['userData']['own_object']['rotateZ'](THREE['MathUtils']['degToRad'](h['rot']['z'])),
      this['_apply_materials'](g, j['meshes_list'], true),
      j['model_loaded'] = 1;
    } else {
      var f = await Model_utils['load_model']({
        'model': f,
        'buffer': true,
        'no_cache': -1 < f['indexOf']('data:application'),
        'rot': h['rot'],
        'scale': h['scale'],
        'process': h['process']
      })
      , q = Model_utils['get_meshes'](f);
      for (let v = 0; v < q.length; v++)
      h['meshes'][q[v]['name']] || (h['meshes'][q[v]['name']] = Model_utils['parse_mesh_name'](q[v]['name'])),
      j['meshes_list']['push']({
        'mesh': q[v],
        'params': h['meshes'][q[v]['name']]
      }),
      '__cut' == q[v]['name'] && j['cut_meshes']['push'](q[v]),
      ce('no_process'),
      Model_utils['set_scale'](q[v], {
        'x': h['scale']['x'],
        'y': h['scale']['y'],
        'z': h['scale']['z']
      });
      this['_apply_materials'](g, j['meshes_list'], true),
      f['rotation']['set'](deg2rad(h['rot']['x']), deg2rad(h['rot']['y']), deg2rad(h['rot']['z'])),
      f['position']['set'](h['pos']['x'] / units, h['pos']['y'] / units, h['pos']['z'] / units),
      this['userData']['own_object']['add'](f);
    }
    this['userData']['original_meshes'] = j['meshes_list']['map'](w => w['mesh']['clone'](true)),
    j['model_loaded'] = 1;
  }
  ['_set_model3d_size'](f, g={
    'set_uv': 1
  }) {
    var h = this['userData']['own_object']
    , j = this['userData']['computed']['size']
    , k = this['userData']['computed']['u_size']
    , l = h['rotation']['clone']();
    this['remove'](h),
    h['rotation']['set'](0, 0, 0),
    h['updateWorldMatrix'](false, true);
    let m = new THREE['Box3']();
    for (let n = 0; n < h['children']['length']; n++)
    (h['children'][n]instanceof THREE['Mesh'] || h['children'][n]instanceof THREE['CSG']['Brush']) && m['expandByObject'](h['children'][n]);
    m = m['getSize'](new THREE['Vector3']())['clone']();
    for (let p = 0; p < h['children']['length']; p++)
    (h['children'][p]instanceof THREE['Mesh'] || h['children'][p]instanceof THREE['CSG']['Brush']) && (Model_utils['set_size'](h['children'][p], h['children'][p]['name'], {
      'box': m['clone'](),
      'size': k['clone'](),
      's': g['meshes'][h['children'][p]['name']]['s'],
      't': g['meshes'][h['children'][p]['name']]['t']
    }),
    1 == g['set_uv']) && correct_uv_buff(Model_utils['get_model_from_cache'](f)['geometry'][p], h['children'][p]['geometry']);
    this['add'](h),
    h['rotation']['copy'](l);
  }
  async['_update_evaluate']() {
    if ('edges' !== global_options['mode']) {
      var f = this['userData']['children'], g = this['userData']['own_object']['children'], h = this['userData']?.['butt_objects'] || null, j, k = this['userData']['root']['userData']['evaluated'];
      if (!k) {
        let l = []
        , m = [...this['userData']['original_meshes'] || []];
        if (0 !== m.length) {
          f.forEach(o => {
            var p;
            o instanceof CabinetPath && o['userData']['children']['forEach'](q => {
              (q instanceof THREE['Mesh'] || q instanceof THREE['CSG']['Brush']) && l.push(q);
            }
            );
          }
          );
          let n = g.filter(o => o instanceof THREE['Mesh'] || o instanceof THREE['CSG']['Brush']);
          h && 0 < h.length && h.forEach(o => {
            if (0 < o['userData']['original_meshes']['length']) {
              for (var p of o['userData']['original_meshes'])
              m.push(p);
            }
            if (0 < o['userData']['children']['length']) {
              for (var q of o['userData']['children'])
              (q instanceof THREE['Mesh'] || q instanceof THREE['CSG']['Brush']) && n.push(q);
            }
          }
          ),
          0 !== n.length && 0 !== l.length && (n.forEach( (o, p) => {
            var p = m[p] || m[0];
            p && p['geometry'] && (o['geometry']['dispose'](),
            o['geometry'] = p['geometry']['clone']());
          }
          ),
          this['userData']['computed']['evaluated'] = 0,
          await module_utils['CSG_Operation'](n, l),
          this['userData']['computed']['evaluated'] = 1);
        }
      }
    }
  }
  ['_apply_materials'](f={}, g=[]) {
    var j = this['userData']['computed']
    , k = (g.length || (g = this['userData']['computed']['meshes_list']),
    'model' === this['userData']['params']['type']);
    for (let y = 0; y < g.length; y++)
    if (g[y]['params']) {
      if (0 == g[y]['params']['selected']) {
        let z;
        if (z = bim_arr['includes'](g[y]['params']['m']) ? 'function' == typeof bim_keys[g[y]['params']['m']] ? bim_keys[g[y]['params']['m']](this, g[y]['params']['m']) : bim_keys[g[y]['params']['m']] : z) {
          g[y]['mesh']['material'] = z;
          continue;
        }
      } else {
        var m = g[y]['mesh'];
        m['material'] && dispose_material(m['material']);
        let A = pp['libs']['model_materials']['find_item'](g[y]['params']['selected']), B;
        A['mat_mode'] && (A['mode'] = A['mat_mode']);
        var q = '' + A['mode'];
        if (k && ('2' == q || '3' == q)) {
          var v = this['userData']['root']
          , w = g[y]['params'];
          let D = this['userData']['params']['spec']['model_mats']?.[A['key']];
          D?.['mode'] === q && !is_empty_id(D?.['mat_id']) || (D = v['userData']['params']['spec']['model_mats']?.[A['key']]),
          A = {
            'mode': A['mode'],
            'selected': A['selected'],
            'p_key': A['p_key'],
            'params': A['params']
          },
          w['fixed'] || !D || D['mode'] !== q || is_empty_id(D['mat_id']) ? is_empty_id(w['mat_id']) || ('2' == q && (A['selected'] = w['mat_id']),
          '3' == q && w['mat_key'] && (A['selected'] = w['mat_id'],
          A['p_key'] = w['mat_key'])) : ('2' == q && (A['selected'] = D['mat_id']),
          '3' == q && D['mat_key'] && (A['selected'] = D['mat_id'],
          A['p_key'] = D['mat_key']));
        }
        let C = 'model' + g[y]['params']['selected'];
        switch (q) {
          case '0':
          B = copy_object(A['params']);
          break;
          case '1':
          B = pp['libs']['decors']['get_item'](A['selected']),
          C += '_' + A['selected'];
          break;
          case '2':
          B = pp['libs']['decors']['get_item'](A['selected']),
          C += '_' + A['selected'];
          break;
          case '3':
          B = pp['libs']['materials'][A['p_key']]['get_item'](A['selected'])['params']['mat_params'],
          C += '_' + A['p_key'] + '_' + A['selected'];
          break;
          case '4':
          break;
          case '5':
          var x = this['userData']['local_parent'] || this['userData']['root'], x, x;
          let E = A['selected']
          , F = x?.['userData']['computed']['materials']?.[E]?.['material'];
          F || (x = _['find'](pp['libs']['materials_info']['groups'], G => G['key'] === E),
          F = x?.['material']),
          B = pp['libs']['materials'][F?.['key']] ? '' + (x = pp['libs']['materials'][F['key']]['get_item'](F['id']))['params']['mat_mode'] == '0' ? x['params']['mat_params'] : materials_lib['get_item'](x['params']['material']) : materials_lib['get_item'](0),
          F && (C += '_' + F['key'] + '_' + F['id']);
          break;
        }
        B ? (void 0 === B['add_params'] && (B['add_params'] = {}),
        B['add_params']['model_width'] = g[y]['params']['tax'] ? j['size'][g[y]['params']['tax']['x']] : j['size']['x'],
        B['add_params']['model_height'] = g[y]['params']['tax'] ? j['size'][g[y]['params']['tax']['y']] : j['size']['y']) : B = pp['libs']['decors']['get_item'](0);
        var v = create_material(B, C);
        m['material'] = v;
      }
    }
  }
  ['_apply_material'](f, g=[]) {
    var h = this['userData']['computed']
    , j = {
      'v': 0,
      'f': 4
    };
    null == f['mat_mode'] && null != f['mode'] && (f['mat_mode'] = f['mode'],
    void 0 !== j[f['mat_mode']]) && (f['mat_mode'] = j[f['mat_mode']]),
    null == f['material'] && null != f['selected'] && (f['material'] = f['selected']);
    let k;
    switch ('' + f['mat_mode']) {
      case '0':
      k = copy_object(f['params']);
      break;
      case '1':
      k = pp['libs']['decors']['get_item'](f['material']);
      break;
      case '2':
      k = pp['libs']['decors']['get_item'](f['material']);
      break;
      case '3':
      k = pp['libs']['materials'][f['p_mat_key']]['get_item'](f['p_mat'])['params']['mat_params'];
      break;
      case '4':
      break;
      case '5':
      var m = this['userData']['local_parent'] || this['userData']['root'], n = f['selected'], m;
      let q = m?.['userData']['computed']['materials']?.[n]?.['material'];
      k = pp['libs']['materials'][q?.['key']] ? '' + (m = pp['libs']['materials'][q['key']]['get_item'](q['id']))['params']['mat_mode'] == '0' ? m['params']['mat_params'] : materials_lib['get_item'](m['params']['material']) : materials_lib['get_item'](0);
      break;
    }
    k ? (void 0 === k['add_params'] && (k['add_params'] = {}),
    k['add_params']['model_width'] = f['tex_axis'] ? h['size'][f['tex_axis']['x']] : h['size']['x'],
    k['add_params']['model_height'] = f['tex_axis'] ? h['size'][f['tex_axis']['y']] : h['size']['y']) : k = pp['libs']['decors']['get_item'](0);
    for (let u = 0; u < g.length; u++) {
      var p = g[u];
      p['material'] && dispose_material(p['material']),
      p['material'] = material;
    }
  }
  ['_get_forward']() {
    return this['userData']['own_object']['getWorldDirection'](new THREE['Vector3']());
  }
  ['_resize'](f, g) {
    var h = this['userData']['computed']['size'], j = this['userData']['params']['size'], k, m, n, g, q, u;
    function v(w, x, y) {
      for (var z of ['x', 'y', 'z'])
      x[z] !== w[z] && (y[z] = x[z]);
    }
    g && (k = this['userData']['computed']['pos'],
    m = this['userData']['params']['pos'],
    n = this['userData']['params']['pivot'],
    g = new THREE['Vector3']()['copy'](g)['multiplyScalar'](2),
    0 <= (q = new THREE['Vector3']()['copy'](f)['sub'](h))['x'] * g['x'] && (g['x'] = 0),
    0 <= q['y'] * g['y'] && (g['y'] = 0),
    0 <= q['z'] * g['z'] && (g['z'] = 0),
    v(k, u = new THREE['Vector3']()['copy'](n)['addScalar'](1)['divideScalar'](2)['multiply'](q)['addScaledVector'](g, units)['add'](k), m)),
    v(h, f, j),
    this['_rebuild']();
  }
  ['toggleResizeMode'](f, g, h) {
    var i = _['get'](this['userData']['params'], 'resizable', {});
    (f = null == f ? !this['resizable'] : f) && i['enabled'] ? this['resizable'] || (g && (i['locks'] = g),
    h && (i['minmax'] = h),
    this['resizable'] = new Resizable(this),
    i['locks'] && this['resizable']['lock'](i['locks']),
    i['minmax'] && this['resizable']['minmax'](i['minmax']),
    this['resizable']['attachControls'](),
    this['resizable']['setActive'](true)) : this['resizable'] && (this['resizable']['destroy'](),
    this['resizable'] = null);
  }
  ['delete']() {
    this['_delete']();
  }
  ['_delete']() {
    this['_reset'](),
    this['parent']['remove'](this);
  }
  ['_make_root'](f) {
    f || (this['userData']['is_root'] = true,
    (this['userData']['root'] = this)['userData']['path'] = '0',
    this['userData']['parts'] = {},
    this['userData']['parts_by_path'] = {},
    this['userData']['params_types'] = {},
    this['userData']['params_hash'] = {},
    Object['keys'](pp['engine']['item_types'])['forEach'](h => {
      this['userData']['parts'][h] = [],
      this['userData']['params_hash'][h] = [],
      this['userData']['parts_by_path'][h] = {};
    }
    ),
    this['userData']['extend_size_info'] = {
      'items_by_path': {},
      'box': null,
      'need_update': true
    },
    this['box'] = this['box'] || new THREE['Box3'](),
    this['box']['update'] = h => {
      this['box']['setFromObject'](this['size_box']);
    }
    );
    var g = this['userData']['params']['spec'], g;
    this['userData']['is_root'] && void 0 === g['templates'] && (g['templates'] = [{
      'name': '',
      'code': '',
      'min': {
        'x': 0,
        'y': 0,
        'z': 0
      },
      'max': {
        'x': 0,
        'y': 0,
        'z': 0
      },
      'template': {
        'tree': []
      }
    }],
    g['selected_template'] = -1),
    this['userData']['is_root'] && void 0 === g['variants'] && (g['variants'] = [{
      'name': '',
      'code': '',
      'price': 0,
      'variables': {},
      'active': 1,
      'accessories': [],
      'size': {
        'x': 0,
        'y': 0,
        'z': 0
      }
    }],
    g['selected_variant'] = 0),
    this['set_template_proxy'](g),
    f && (g = module_utils['get_child_params_by_path'](this, this['userData']['path']),
    this['set_template_proxy'](g['spec']));
  }
  ['_update_box']() {
    this['userData']['is_root'] && this['box']['update']();
  }
  ['set_template_proxy'](f) {
    if (!('template'in f)) {
      let g = this;
      Object['defineProperty'](f, 'template', {
        'get': function() {
          this['templates'] || (this['templates'] = [{
            'name': '',
            'code': '',
            'min': {
              'x': 0,
              'y': 0,
              'z': 0
            },
            'max': {
              'x': 0,
              'y': 0,
              'z': 0
            },
            'template': {
              'tree': []
            }
          }]);
          var h = this['templates'][g['userData']['selected_template']];
          return h ? h['template'] : void 0;
        },
        'set': function(h) {
          var i = this['templates'][g['userData']['selected_template']];
          i ? i['template'] = h : this['templates'][g['userData']['selected_template']] = {
            'name': '',
            'min': {
              'x': 0,
              'y': 0,
              'z': 0
            },
            'max': {
              'x': 0,
              'y': 0,
              'z': 0
            },
            'template': h
          };
        }
      });
    }
  }
  ['_match_template'](f) {
    if (Number['isInteger'](f['spec']['selected_template']) && -1 !== f['spec']['selected_template']) {
      let L = f['spec']['templates'][f['spec']['selected_template']] || {};
      return {
        'tree': L['tree'] || [],
        'variables': L['variables'] || {},
        'selected_template': f['spec']['selected_template']
      };
    }
    let g = f['size'];
    var j = this['userData']['root'], k, q, v, k, v, q, w = (g && j !== this && (k = this['userData']['parent'],
    q = this['userData']['local_parent'],
    v = this['userData']['computed']?.['variables'] || k?.['userData']['computed']?.['variables'] || {},
    k = {
      'parent_size': null != k ? k['userData']['computed']['size'] : new THREE['Vector3'](),
      'variables': v,
      'computed': (q || j)?.['userData']['computed']['computed'] || {},
      'props': (q || j)?.['userData']['computed']['props'] || {},
      'materials': (q || j)?.['userData']['computed']['materials'] || {},
      'local_parent': null != q ? q : {}
    },
    g = {
      'x': comp2(g['x'], k),
      'y': comp2(g['y'], k),
      'z': comp2(g['z'], k)
    }),
    g || 'module' !== this['userData']['params']['type'] && j !== this || (v = f['spec']['variants'][f['spec']['selected_variant']]) && v['size'] && (g = copy_object(v['size']),
    q = {
      'parent_size': new THREE['Vector3'](),
      'computed': {},
      'variables': pp['variables']['current_hash'] || {},
      'props': {},
      'materials': {},
      'local_parent': {}
    },
    g = {
      'x': comp2(g['x'], q),
      'y': comp2(g['y'], q),
      'z': comp2(g['z'], q)
    },
    f['size'] = g),
    g = g || {
      'x': cabinet_def_common['size']['x'],
      'y': cabinet_def_common['size']['y'],
      'z': cabinet_def_common['size']['z']
    },
    this['check_minmax_size'](f, g),
    parseFloat(g['x'])), x = parseFloat(g['y']), z = parseFloat(g['z']), A = f['spec']['templates'], B;
    let C, E = -1;
    if (!A)
    return {
      'tree': [],
      'variables': {},
      'selected_template': E
    };
    for (let N = 0; N < A.length; N++) {
      var F = 0 != A[N]['min']['x'] ? A[N]['min']['x'] : -1 / 0
      , G = 0 != A[N]['max']['x'] ? A[N]['max']['x'] : 1 / 0
      , H = 0 != A[N]['min']['y'] ? A[N]['min']['y'] : -1 / 0
      , I = 0 != A[N]['max']['y'] ? A[N]['max']['y'] : 1 / 0
      , J = 0 != A[N]['min']['z'] ? A[N]['min']['z'] : -1 / 0
      , K = 0 != A[N]['max']['z'] ? A[N]['max']['z'] : 1 / 0;
      if (F <= w && w <= G && H <= x && x <= I && J <= z && z <= K) {
        C = A[N]['template'],
        E = N;
        break;
      }
    }
    return C ? {
      'tree': C['tree'],
      'variables': C['variables'],
      'selected_template': E
    } : {
      'tree': [],
      'variables': {},
      'selected_template': E
    };
  }
  ['check_minmax_size'](f, g) {
    g = g || f['size'];
    var h = f['resizable']?.['minmax']?.['min']
    , f = f['resizable']?.['minmax']?.['max'];
    if (g && h && f) {
      var j = {
        'x': parse_num(h['x']),
        'y': parse_num(h['y']),
        'z': parse_num(h['z'])
      }, k = {
        'x': parse_num(f['x']),
        'y': parse_num(f['y']),
        'z': parse_num(f['z'])
      }, l;
      for (l of ['x', 'y', 'z'])
      if (void 0 !== g[l]) {
        let m = parse_num(g[l]);
        0 < j[l] && m < j[l] && (m = j[l]),
        0 < k[l] && m > k[l] && (m = k[l]),
        g[l] = m;
      }
    }
  }
  ['set_template_active'](f, g=true, h=true) {
    g && (this['userData']['params']['spec']['selected_template'] = f),
    this['set_selected_template_property'](f),
    h && this['_rebuild']();
  }
  ['set_selected_template_property'](f) {
    this['userData']['selected_template'] = f;
  }
  ['_get_child_params_by_path'](f) {
    return module_utils['get_child_params_by_path'](this, f);
  }
  ['get_child_params_by_path'](f) {
    return module_utils['get_child_params_by_path'](this, f);
  }
  ['get_child_by_path'](f, g) {
    return g ? module_utils['get_child_params_by_path'](this, f) : module_utils['get_child_by_path'](this, f);
  }
  ['remove_child_by_path'](f, g) {
    return module_utils['remove_child_by_path'](this, f);
  }
  ['change_param_by_path'](f, g, h, i=true) {
    module_utils['change_param_by_path'](this, f, g, h, i);
  }
  ['_rebuild_parts_by_type'](f) {
    var g = this['userData']['root']
    , g = g['userData']['parts'] && g['userData']['parts'][f];
    if (g && g.length) {
      for (var h of g)
      h['_rebuild']();
    }
  }
  ['update_params_types'](f) {
    if (this['userData']['is_root'] && (f || !Object['keys'](this['userData']['params_types'] || {})['length'])) {
      let g = {};
      this['userData']['params_types'] = g,
      this['walk_params_tree'](h => {
        h['type'] && (g[h['type']] = true);
      }
      );
    }
  }
  ['walk_parts_by_type'](f, g) {
    if ('function' == typeof g) {
      var h = this['userData']['root']
      , h = h['userData']['parts'] && h['userData']['parts'][f];
      if (h && h.length) {
        for (var i of h)
        g(i);
      }
    }
  }
  ['walk_params_tree'](f, g, h) {
    module_utils['walk_params_tree'](void 0 !== g ? g : this, f, h);
  }
  ['load_templates'](f, g) {
    if (g = g || f,
    f['templates_loaded'] || 'module' === f['type'])
    this['walk_params_tree'](i, f, 2);
    else {
      f['spec'] || (f['spec'] = {}),
      f['spec']['templates'] || (f['spec']['templates'] = [{
        'name': '',
        'code': '',
        'min': {
          'x': 0,
          'y': 0,
          'z': 0
        },
        'max': {
          'x': 0,
          'y': 0,
          'z': 0
        },
        'template': {
          'tree': []
        }
      }],
      f['spec']['selected_template'] = -1),
      f['spec']['variants'] || (f['spec']['variants'] = [{
        'name': '',
        'code': '',
        'price': 0,
        'variables': {},
        'active': 1,
        'accessories': [],
        'size': {
          'x': 0,
          'y': 0,
          'z': 0
        }
      }],
      f['spec']['selected_variant'] = 0);
      for (var h of f['spec']['variants'])
      h['variables'] || (h['variables'] = {}),
      h['variables'] = fix_json_empty_object(h['variables']);
      this['walk_params_tree'](i, f, 2),
      f['templates_loaded'] = 1;
    }
    function i(j, k, m) {
      if ('function' == typeof pp['events']['cabinet']['load_templates'] && pp['events']['cabinet']['load_templates'](j, k, m),
      'furniture' === j['type'] && !j['loaded']) {
        let z, A = j['spec'] && j['spec']['id'] && pp['libs']['furniture'];
        var k = j['spec'] && parseFloat(j['id']) && pp['libs']['furniture'], k, q;
        let B = 0;
        return (A && (z = pp['libs']['furniture']['find_item'](j['spec']['id']),
        B = j['spec']['id']),
        !A && k && (z = pp['libs']['furniture']['find_item'](parseFloat(j['id'])),
        B = parseFloat(j['id'])),
        z) ? (k = merge(copy_object(z['params']), {
          'name': z['name'],
          'code': z['code'],
          'size': z['size'] ? copy_object(z['size']) : void 0,
          'children': z['children'] ? copy_object(z['children']) : []
        }),
        j['spec']['id'] = B,
        k['size'] && (j['size'] = k['size']),
        k['children'] && (j['children'] = k['children']),
        fill_defaults(j, k, copy_object(pp['engine']['item_def_params'][j['type']])),
        (q = _['find'](m, C => C['type'] === j['type'] && C['spec']?.['id'] && '' + C['spec']['id'] == '' + B)) && (j['children'] = [],
        j['name'] = '***РЕКУРСИЯ***\x20' + j['name']),
        void (j['loaded'] = 1)) : void 0;
      }
      if ('module' === j['type'] && !j['templates_loaded']) {
        if (!j['spec']['templates']) {
          let C, D = j['spec']?.['id'];
          if (!j['spec']?.['not_load_default']) {
            let F = project_settings?.['kitchen']?.['defaults']?.['module_types']?.[j['spec']['element_type']];
            var v;
            is_empty_id(F) || _['find'](m, G => G['type'] === j['type'] && G['spec']?.['element_type'] && G['spec']['element_type'] === j['spec']['element_type'] && G['spec']['id'] && '' + G['spec']['id'] == '' + F) || (D = F,
            j['spec']['id'] = D);
          }
          let E = j['spec'] && D && j['spec']['element_type'] && !j['spec']['templates'] && pp['libs']['catalogs'][j['spec']['element_type']];
          var w, x;
          E && ((C = pp['libs']['catalogs'][j['spec']['element_type']]['get_item'](D)?.['params']) ? _['find'](m, G => G['type'] === j['type'] && G['spec']?.['element_type'] && G['spec']['element_type'] === j['spec']['element_type'] && G['spec']['id'] && '' + G['spec']['id'] == '' + D) && (delete C['spec']['templates'],
          delete C['children'],
          j['name'] = '***РЕКУРСИЯ***\x20' + j['name']) : (C = {},
          j['name'] = '***УДАЛЕН***\x20' + j['name']),
          C['templates_loaded'] = 1),
          is_empty_value(C?.['spec']?.['can_change']?.['id']) || delete C['spec']['can_change']['id'],
          fill_defaults(j, C, copy_object(pp['engine']['item_def_params'][j['type']])),
          j['spec'] || (j['spec'] = {}),
          j['spec']['templates'] || (j['spec']['templates'] = [{
            'name': '',
            'code': '',
            'min': {
              'x': 0,
              'y': 0,
              'z': 0
            },
            'max': {
              'x': 0,
              'y': 0,
              'z': 0
            },
            'template': {
              'tree': []
            }
          }],
          j['spec']['selected_template'] = -1),
          j['spec']['variants'] || (j['spec']['variants'] = [{
            'name': '',
            'code': '',
            'price': 0,
            'variables': {},
            'active': 1,
            'accessories': [],
            'size': {
              'x': 0,
              'y': 0,
              'z': 0
            }
          }],
          j['spec']['selected_variant'] = 0);
          for (x of j['spec']['variants'])
          x['variables'] || (x['variables'] = {}),
          x['variables'] = fix_json_empty_object(x['variables']);
          if (j['variables'] = copy_object(j['variables']) || {
            'main': {}
          },
          j['variables'] = fix_json_empty_object(j['variables']),
          j['variables']['main'] || (j['variables']['main'] = {}),
          j['variables']['main'] = fix_json_empty_object(j['variables']['main']),
          j['variables']['apply'] && !j['variables']['apply_done']) {
            for (let G of Object['keys'](j['variables']['apply'])) {
              j['variables']['main'][G] && (j['variables']['main'][G]['value'] = j['variables']['apply'][G]);
              var y = _['find'](j['variables']['global'], H => H['key'] === G);
              y && (y['value'] = j['variables']['apply'][G]);
            }
            j['variables']['apply_done'] = 1;
          }
          if (Object['keys'](j['spec']['fill_content'] || {})['length']) {
            let H = j['spec']['fill_content'];
            module_utils['walk_params_tree'](j, I => {
              var J, J;
              'fill_section' !== I['type'] && 'section' !== I['type'] || !I['section_key'] || (J = I['section_key'],
              H[J]?.['children']?.['length'] && (I['children'] || (I['children'] = []),
              J = copy_object(H[J]['children']),
              I['children']['unshift'](...J)));
            }
            ),
            j['spec']['fill_content_expanded'] = 1;
          }
          if (Object['keys'](j['spec']['params_apply'] || {})['length']) {
            let I = j['spec']['params_apply'];
            module_utils['walk_params_tree'](j, J => {
              if (J['params_key'] && J['type']) {
                var K = J['params_key'] + ':' + J['type']
                , L = I[K] && copy_object(I[K]);
                if (L && Object['keys'](L)['length']) {
                  var K = Object['keys'](L);
                  if (K.length)
                  for (var N of K) {
                    var O = L[N];
                    null != O && utils['nested_object']['set'](J, N, O);
                  }
                }
              }
            }
            );
          }
          void 0 !== C && (C['templates_loaded'] = 1);
        }
        j['templates_loaded'] = 1;
      }
    }
  }
  ['find_toggles'](f, g, h) {
    g = g || {};
    var i = '0' === (h = h || this['userData']['path'] || '0');
    return (i || 'module' !== f['type']) && (f = f || (i ? this['userData']['root']['userData']['params'] : module_utils['get_child_params_by_path'](this, h))) && j(f, g, h),
    g;
    function j(k, l, m) {
      if (k) {
        var n = '0' === m, p, p;
        if (!n && k['toggle'] && ((p = copy_object(k['toggle']))['__path'] = m,
        void 0 === p['name'] && (p['name'] = p['key']),
        l[m] = p),
        n || 'module' !== k['type']) {
          let q;
          if (n ? (p = k['spec'] && k['spec']['template']) && (q = p['tree']) : q = k['children'],
          q && q.length) {
            for (let u = 0; u < q.length; u++)
            j(q[u], l, m + ',' + u);
          }
        }
      }
    }
  }
  ['get_toggles']() {
    var f, g = this['userData']['root']['userData']['toggles_by_path'];
    if (!g)
    return [];
    var g = Object['values'](g);
    if (natural_sort(g, '__path'),
    !g.length)
    return [];
    var h = [], j = {}, k;
    for (let n of g)
    if (n['enabled'] && n['key']) {
      var l = n['group'] || '', m;
      let p = j[l];
      p || (p = {
        'name': l,
        'order': void 0,
        'toggles': []
      },
      j[l] = p,
      h.push(p)),
      _['find'](j[l]['toggles'], q => q['key'] === n['key']) || (j[l]['toggles']['push'](n),
      void 0 !== n['order'] && (void 0 !== p['order'] ? p['order'] = Math['min'](p['order'], n['order']) : p['order'] = n['order']));
    }
    for (k of h)
    k['toggles']['sort']( (q, u) => void 0 === q['order'] && void 0 === u['order'] ? 0 : void 0 === q['order'] ? 1 : void 0 === u['order'] ? -1 : q['order'] - u['order']);
    return h['sort']( (q, u) => void 0 === q['order'] && void 0 === u['order'] ? 0 : void 0 === q['order'] ? 1 : void 0 === u['order'] ? -1 : q['order'] - u['order']),
    h;
  }
  ['show_drag_area']() {
    this['drag_area'] && (this['userData']['own_object']['remove'](this['drag_area']),
    this['drag_area']['dispose']());
    var f = {
      'x': this['userData']['computed']['size']['x'] / units,
      'y': this['userData']['computed']['size']['y'] / units,
      'z': this['userData']['computed']['size']['z'] / units
    };
    this['drag_area'] = new FillDragArea({
      'parent': this,
      'size': f
    }),
    this['userData']['own_object']['add'](this['drag_area']),
    this['drag_area']['show']();
  }
  ['hide_drag_area']() {
    this['drag_area'] && (this['drag_area']['visible'] = false);
  }
  ['_build_sizes']() {
    if (this['userData']['is_root'] && 1 != this['userData']['params']['spec']['is_fill'] && 1 != this['userData']['params']['spec']['hide_sizes']) {
      let h = this['userData']['params'];
      var f = ['x', 'y', 'z'];
      let i = m => Math['round'](m);
      this['userData']['sizes_items'] || (this['userData']['sizes_items'] = []);
      for (let m = this['userData']['sizes_items']['length']; m--; )
      this['userData']['sizes_items'][m]['full_dispose'](),
      this['userData']['sizes_items'][m]['parent'] && this['userData']['sizes_items'][m]['parent']['remove'](this['userData']['sizes_items'][m]),
      this['userData']['sizes_items']['splice'](m, 1);
      let j, k = (global_options['additional_sizes_mode'] && (j = global_options['additional_sizes_mode']),
      global_options['additional_sizes_visible'] || (j = 0),
      0), l = CabinetAnalyzer['get_sizes_all_fill'](this, j);
      return f.forEach(o => {
        let q = l[o];
        q && 0 !== q.length && q.forEach(v => {
          var w = copy_object(pp['engine']['item_def_params']['size']), x, y, z, z, x, y, z, z;
          w['spec']['axis'] = o + '1',
          w['spec']['length'] = 70,
          w['spec']['line_pos'] = 50,
          1 === q.length && (w['spec']['length'] = 120,
          w['spec']['line_pos'] = 100),
          w['spec']['level'] = v['level'],
          w['obj_path'] = v['path'],
          w['size']['x'] = i(v['axes_size']),
          w['pos'] = {
            'x': 0,
            'y': 0,
            'z': 0
          };
          let A, B;
          v['is_root'] || (B = this['get_child_by_path'](v['path'])),
          'x' == o && (w['pos']['y'] = this['userData']['computed']['size']['y']),
          'z' == o && (w['pos']['y'] = this['userData']['computed']['size']['y']),
          0 == j && (w['size']['x'] = i(v['axes_size']),
          A = new CabinetSize(w,{
            'parent': this,
            'root': this,
            'local_parent': this
          }),
          this['userData']['sizes_items']['push'](A),
          this['userData']['own_object']['add'](A)),
          1 == j && (v['prev'] && !v['is_root'] && (w['size']['x'] = i(v['prev']),
          A = new CabinetSize(w,{
            'parent': this,
            'root': this,
            'local_parent': this
          }),
          h['spec']['show_sizes_hover'] && (A['visible'] = false),
          v['is_root'] || B['userData']['computed']['additional_sizes']['push'](A),
          this['userData']['sizes_items']['push'](A),
          this['userData']['own_object']['add'](A)),
          v['next'] && (w['size']['x'] = i(v['next']),
          v['next'] && (w['pos'][o] = i(v['axes_pos'])),
          A = new CabinetSize(w,{
            'parent': this,
            'root': this,
            'local_parent': this
          }),
          h['spec']['show_sizes_hover'] && (A['visible'] = false),
          v['is_root'] || B['userData']['computed']['additional_sizes']['push'](A),
          this['userData']['sizes_items']['push'](A),
          this['userData']['own_object']['add'](A)),
          v['is_root']) && (w['size']['x'] = i(v['axes_size']),
          A = new CabinetSize(w,{
            'parent': this,
            'root': this,
            'local_parent': this
          }),
          this['userData']['sizes_items']['push'](A),
          this['userData']['own_object']['add'](A)),
          2 == j && ('bottom' == v['from'] && (w['size']['x'] = i(v['prev'])),
          'top' != v['from'] || v['is_root'] || (w['size']['x'] = i(v['next']),
          w['pos'][o] = i(v['axes_pos'])),
          v['is_root'] && (w['size']['x'] = i(v['axes_size'])),
          A = new CabinetSize(w,{
            'parent': this,
            'root': this,
            'local_parent': this
          }),
          v['is_root'] || B['userData']['computed']['additional_sizes']['push'](A),
          this['userData']['sizes_items']['push'](A),
          this['userData']['own_object']['add'](A)),
          3 != j && 4 != j || (v['is_root'] ? (w['spec']['length'] = 120,
          w['spec']['line_pos'] = 100,
          w['size']['x'] = i(v['axes_size'])) : (pp['events']['size']['add_offset_text_size'] && (k = pp['events']['size']['add_offset_text_size'](this, null, v)),
          w['spec']['text_size'] = 1,
          w['spec']['section_pos'] = v['section_pos'],
          w['spec']['section_size'] = v['section_size'],
          x = {
            'x': w['spec']['length'] + 30,
            'y': 0,
            'z': v['size']['z'] / 2
          },
          (y = CabinetAnalyzer['Vector3']())['y'] = -v['rot']['y'],
          y['x'] = -v['rot']['x'],
          y['z'] = -v['rot']['z'],
          z = CabinetAnalyzer['create_rotation_matrix'](y),
          z = CabinetAnalyzer['transform_vector'](z, x),
          w['rot'] = y,
          'y' == o && (w['pos']['y'] = v['pos']['y'] / 2 + v['size']['y'] / 2 + k / 2,
          w['pos']['x'] = v['pos']['x'] + z['x'],
          w['pos']['z'] = v['pos']['z'] + z['z']),
          'x' == o && (w['pos']['y'] = v['pos']['y'],
          w['pos']['x'] = v['pos']['x'] / 2 + v['size']['x'] / 2 + k / 2,
          w['pos']['z'] = v['pos']['z'] + z['z']),
          'z' == o && (w['pos']['y'] = v['pos']['y'] + v['size']['y'] / 2 + k / 2,
          w['pos']['x'] = v['pos']['x'],
          w['pos']['z'] = v['pos']['z']),
          w['size']['x'] = i(v['prev'] - k),
          4 == j && (w['size']['x'] = i(v['prev'] - v['section_pos'][o] - k),
          w['pos'][o] += v['section_pos'][o] / 2)),
          A = new CabinetSize(w,{
            'parent': this,
            'root': this,
            'local_parent': this
          }),
          v['is_root'] || B['userData']['computed']['additional_sizes']['push'](A),
          this['userData']['sizes_items']['push'](A),
          this['userData']['own_object']['add'](A)),
          5 == j && (v['is_root'] || (w['spec']['arrow_scale'] = 50,
          w['spec']['text_scale'] = 50,
          w['spec']['length'] = 0,
          x = {
            'x': v['size']['x'] / 2 + 45,
            'y': v['size']['y'] / 2,
            'z': 0
          },
          (y = CabinetAnalyzer['Vector3']())['y'] = -v['rot']['y'],
          y['x'] = -v['rot']['x'],
          y['z'] = -v['rot']['z'],
          z = CabinetAnalyzer['create_rotation_matrix'](y),
          z = CabinetAnalyzer['transform_vector'](z, x),
          w['rot'] = y,
          'y' == o && (w['pos']['x'] = v['pos']['x'] + z['x'],
          w['pos']['z'] = v['pos']['z'] + z['z']),
          'x' == o && (w['pos']['y'] = v['pos']['y'] + z['y'],
          w['pos']['z'] = v['pos']['z'] + z['z']),
          'z' == o && (w['pos']['y'] = v['pos']['y'] + z['y'],
          w['pos']['z'] = v['pos']['z'] + z['z']),
          w['size']['x'] = i(v['prev'] - k)),
          v['prev'] && !v['is_root'] && (w['size']['x'] = i(v['prev']),
          w['pos'][o] = v['axes_pos'] - v['prev'],
          A = new CabinetSize(w,{
            'parent': this,
            'root': this,
            'local_parent': this
          }),
          h['spec']['show_sizes_hover'] && (A['visible'] = false),
          v['is_root'] || B['userData']['computed']['additional_sizes']['push'](A),
          this['userData']['sizes_items']['push'](A),
          this['userData']['own_object']['add'](A)),
          v['next'] && 0 < v['next'] && (w['size']['x'] = i(v['next']),
          w['pos'][o] = i(v['axes_pos'] + v['size'][o]),
          A = new CabinetSize(w,{
            'parent': this,
            'root': this,
            'local_parent': this
          }),
          h['spec']['show_sizes_hover'] && (A['visible'] = false),
          v['is_root'] || B['userData']['computed']['additional_sizes']['push'](A),
          this['userData']['sizes_items']['push'](A),
          this['userData']['own_object']['add'](A)),
          v['is_root']) && (w['spec']['length'] = 120,
          w['spec']['line_pos'] = 100,
          w['size']['x'] = i(v['axes_size']),
          A = new CabinetSize(w,{
            'parent': this,
            'root': this,
            'local_parent': this
          }),
          this['userData']['sizes_items']['push'](A),
          this['userData']['own_object']['add'](A));
        }
        );
      }
      ),
      void (0 == global_options['sizes_visible'] && this['userData']['sizes_items']['forEach'](o => {
        o['visible'] = false;
      }
      ));
      this['userData']['sizes_items'] || (this['userData']['sizes_items'] = []);
      for (let o = this['userData']['sizes_items']['length']; o--; )
      this['userData']['sizes_items'][o]['full_dispose'](),
      this['userData']['sizes_items']['splice'](o, 1);
      var f = -this['userData']['computed']['size']['z'] / units / 2 + 0.4
      , g = new Sizes_obj({
        'width': this['userData']['computed']['size']['x'] / units,
        'text': this['userData']['computed']['size']['x'],
        'font_size': 50
      })
      , g = (this['userData']['sizes_items']['push'](g),
      g['position']['set'](0, this['userData']['computed']['size']['y'] / units, f),
      g['visible'] = global_options['sizes_visible'],
      this['add'](g),
      new Sizes_obj({
        'width': this['userData']['computed']['size']['y'] / units,
        'text': this['userData']['computed']['size']['y'],
        'font_size': 50
      }));
      this['userData']['sizes_items']['push'](g),
      g['position']['set'](-this['userData']['computed']['size']['x'] / units / 2, this['userData']['computed']['size']['y'] / units / 2, f),
      g['rotation']['z'] = Math['PI'] / 2,
      g['visible'] = global_options['sizes_visible'],
      this['add'](g);
    }
  }
  ['_show_helpers_edges']() {
    this['userData']['helpers_edges'] || 'function' != typeof this['_build_helpers_edges'] || this['_build_helpers_edges']();
  }
  ['_hide_helpers_edges']() {
    this['userData']['helpers_edges'] && 'edges' == !global_options['mode'] && (this['_reset'](this['userData']['helpers_edges']),
    this['remove'](this['userData']['helpers_edges']),
    this['userData']['helpers_edges'] = null);
  }
  ['edges_mode']() {
    if (this['userData']['is_root'])
    for (var f in this['userData']['parts']) {
      var f = this['userData']['parts'][f];
      if (Array.isArray(f)) {
        for (var g of f)
        if (g['_show_helpers_edges'](),
        0 < g['userData']['own_object']['children']['length']) {
          let n = g['userData']['original_meshes'];
          if (n && (g['userData']['own_object']['children']['forEach']( (p, q) => {
            var q;
            (p instanceof THREE['Mesh'] || p instanceof THREE['CSG']['Brush']) && !p['no_original_edges'] && (q = n[q] || n[0],
            p['geometry'] = q?.['geometry']);
          }
          ),
          g['userData']?.['butt_objects'] && 0 < g['userData']['butt_objects']['length']))
          for (let p = 0; p < g['userData']['butt_objects']['length']; p++) {
            var h = g['userData']['butt_objects'][p], j = h['userData']['original_meshes'], k;
            if (j)
            for (var l of h['userData']['children']) {
              !(l instanceof THREE['Mesh'] || l instanceof THREE['CSG']['Brush']) || l['no_original_edges'] || (k = j[p] || j[0],
              l['geometry'] = k?.['geometry']);
            }
          }
        }
      }
    }
    PPObject['prototype']['edges_mode_traverse']['call'](this, this['userData']['own_object'], true);
    var m = 'animator' === this['userData']['params']['type'] ? _['get'](this['userData']['ani_children'], 'children[0].children[0].children') : this['userData']['children'];
  }
  ['design_mode']() {
    'function' == typeof this['_rebuild'] && this['_rebuild']();
  }
  ['set_size'](f) {
    var g = this['userData']['params'], h, h, h;
    f && (void 0 !== f['x'] && (h = parseFloat(f['x']),
    g['size']['x'] = Number['isFinite'](h) ? h : 1),
    void 0 !== f['y'] && (h = parseFloat(f['y']),
    g['size']['y'] = Number['isFinite'](h) ? h : 1),
    void 0 !== f['z'] && (h = parseFloat(f['z']),
    g['size']['z'] = Number['isFinite'](h) ? h : 1),
    this['userData']['is_root'] ? (ce('rebuild'),
    this['_rebuild'](),
    this['calculate_distances']()) : (this['change_param_by_path'](this['userData']['path'], 'size', g['size'], true),
    this['calculate_distances'](),
    this['userData']['root']['_rebuild']()));
  }
  ['calculate_distances']() {
    if (!custom_settings['from_wall_sizes_disabled']) {
      var f = this['userData']['computed'], g = new THREE['Vector3']()['copy'](f['size'])['multiplyScalar'](1 / units), g = (this['cust_dists']['floor'] = (room['floor']['position']['y'] + this['position']['y'])['toFixed'](1) * units,
      this['cust_dists']['ceiling'] = (room['ceiling']['position']['y'] - (this['position']['y'] + g['y']))['toFixed'](1) * units,
      this['quaternion']), h = new THREE['Vector3'](0,0,1)['applyQuaternion'](g)['normalize'](), g = new THREE['Vector3'](1,0,0)['applyQuaternion'](g)['normalize'](), j = new THREE['Vector3']()['copy'](f['size'])['multiplyScalar'](0.5 / units), k = this['position']['clone']()['add'](h['clone']()['multiplyScalar'](j['z'])), m = this['position']['clone']()['add'](h['clone']()['multiplyScalar'](-j['z'])), n = this['position']['clone']()['add'](g['clone']()['multiplyScalar'](j['x'])), j = this['position']['clone']()['add'](g['clone']()['multiplyScalar'](-j['x'])), p, h, k;
      if (Math['abs'](h['z']) > Math['abs'](h['x']) ? 0 < h['z'] ? (this['cust_dists']['front_wall'] = (room['back_wall']['position']['z'] - k['z'])['toFixed'](1) * units,
      this['cust_dists']['back_wall'] = (m['z'] - room['front_wall']['position']['z'])['toFixed'](1) * units) : (this['cust_dists']['front_wall'] = (k['z'] - room['front_wall']['position']['z'])['toFixed'](1) * units,
      this['cust_dists']['back_wall'] = (room['back_wall']['position']['z'] - m['z'])['toFixed'](1) * units) : 0 < h['x'] ? (this['cust_dists']['front_wall'] = (room['right_wall']['position']['x'] - k['x'])['toFixed'](1) * units,
      this['cust_dists']['back_wall'] = (m['x'] - room['left_wall']['position']['x'])['toFixed'](1) * units) : (this['cust_dists']['front_wall'] = (k['x'] - room['left_wall']['position']['x'])['toFixed'](1) * units,
      this['cust_dists']['back_wall'] = (room['right_wall']['position']['x'] - m['x'])['toFixed'](1) * units),
      Math['abs'](g['x']) > Math['abs'](g['z']) ? 0 < g['x'] ? (this['cust_dists']['right_wall'] = (room['right_wall']['position']['x'] - n['x'])['toFixed'](1) * units,
      this['cust_dists']['left_wall'] = (j['x'] - room['left_wall']['position']['x'])['toFixed'](1) * units) : (this['cust_dists']['right_wall'] = (n['x'] - room['left_wall']['position']['x'])['toFixed'](1) * units,
      this['cust_dists']['left_wall'] = (room['right_wall']['position']['x'] - j['x'])['toFixed'](1) * units) : 0 < g['z'] ? (this['cust_dists']['right_wall'] = (room['back_wall']['position']['z'] - n['z'])['toFixed'](1) * units,
      this['cust_dists']['left_wall'] = (j['z'] - room['front_wall']['position']['z'])['toFixed'](1) * units) : (this['cust_dists']['right_wall'] = (n['z'] - room['front_wall']['position']['z'])['toFixed'](1) * units,
      this['cust_dists']['left_wall'] = (room['back_wall']['position']['z'] - j['z'])['toFixed'](1) * units),
      !this['userData']['is_root'] && this['userData']['params']['spec']['is_fill'] && (this['userData']['parent']instanceof CabinetFillSection || this['userData']['parent']instanceof CabinetSection) && (h = this['userData']['parent']['userData']['computed'],
      k = this['userData']['computed']['world'] || CabinetAnalyzer['get_root_params'](this),
      this['cust_dists']['floor'] = f['pos']['y'],
      this['cust_dists']['ceiling'] = h['size']['y'] - (f['pos']['y'] + f['size']['y']),
      this['cust_dists']['left_wall'] = f['pos']['x'],
      this['cust_dists']['right_wall'] = h['size']['x'] - (f['pos']['x'] + f['size']['x']),
      this['cust_dists']['back_wall'] = f['pos']['z'],
      this['cust_dists']['front_wall'] = h['size']['z'] - (f['pos']['z'] + f['size']['z']),
      this['cust_dists']['pos_from_root'] = k['pos']),
      pp['interface']['root']) {
        let q = new THREE['Vector3']();
        !this['userData']['is_root'] && this['userData']['params']['spec']['is_fill'] && (this['userData']['parent']instanceof CabinetFillSection || this['userData']['parent']instanceof CabinetSection) && (q = {
          'x': this['userData']['params']['spec']['fill_size_x'] || 0,
          'y': this['userData']['params']['spec']['fill_size_y'] || 0,
          'z': this['userData']['params']['spec']['fill_size_z'] || 0
        }),
        pp['interface']['root']['update_sizes_from_wall'](copy_object(this['cust_dists']), q);
      }
      $('#info_panel\x20.left_wall_distance')['val'](this['cust_dists']['left_wall']),
      $('#info_panel\x20.right_wall_distance')['val'](this['cust_dists']['right_wall']),
      $('#info_panel\x20.floor_distance')['val'](this['cust_dists']['floor']),
      $('#info_panel\x20.ceiling_distance')['val'](this['cust_dists']['ceiling']),
      $('#info_panel\x20.back_wall_distance')['val'](this['cust_dists']['back_wall']),
      $('#info_panel\x20.front_wall_distance')['val'](this['cust_dists']['front_wall']);
    }
  }
  ['find_around'](f, g, h, j, k) {
    var m = 0.05
    , n = void 0 === f && void 0 === g && void 0 === h && void 0 === j
    , g = (!g && this['box']?.['update'] && this['box']['update'](),
    g ? g['clone']() : this['box']?.['clone']())
    , k = (g?.['expandByScalar'](k || m),
    {
      'at_wall': false,
      'at_floor': false,
      'at_ceiling': false,
      'front': [],
      'back': [],
      'left': [],
      'right': [],
      'top': [],
      'bottom': []
    });
    if (g) {
      n && (this['userData']['around'] = k);
      var n = h || this['_get_forward'](), h = Math['abs'](Math['abs'](n['z']) - 1) < m ? 'z' : 'x', m, h, n;
      let p;
      'z' == h && 0 < n['z'] ? p = [k['front'], k['left'], k['back'], k['right']] : 'x' == h && 0 < n['x'] ? p = [k['right'], k['front'], k['left'], k['back']] : 'z' == h && n['z'] < 0 ? p = [k['back'], k['right'], k['front'], k['left']] : 'x' == h && n['x'] < 0 && (p = [k['left'], k['back'], k['right'], k['front']]),
      p && (h = {
        'at_wall': !(m = [[p[0], 'z', 1], [p[1], 'x', 1], [p[2], 'z', -1], [p[3], 'x', -1], [k['top'], 'y', 1], [k['bottom'], 'y', -1]]),
        'at_floor': false,
        'at_ceiling': false
      },
      (n = (q, u, v, w, x) => {
        for (var y of v)
        if (y !== q) {
          y['box']['update'] && y['box']['update']();
          var z = y['box'];
          if (u['intersectsBox'](z)) {
            let B = w[0][1]
            , C = w[0][0]
            , D = 0 < w[0][2] ? u['max'][B] - z['min'][B] : z['max'][B] - u['min'][B];
            for (let E = 1; E < w.length; E++) {
              B = w[E][1];
              var A = 0 < w[E][2] ? u['max'][B] - z['min'][B] : z['max'][B] - u['min'][B];
              A < D && (C = w[E][0],
              D = A);
            }
            C.push(y),
            x && y['is_wall'] && ('floor' === y['name'] ? x['at_floor'] = true : 'ceiling' === y['name'] ? x['at_ceiling'] = true : x['at_wall'] = true);
          }
        }
      }
      )(this, g, room['walls_objects'], m, h),
      f || n(this, g, j || d_objects, m),
      Object['assign'](k, h));
    }
    return k;
  }
  ['add_accessories'](f, g) {
    let h = -1;
    var i = this['userData']['params'];
    for (let j = i['accessories']['length']; j--; )
    if (i['accessories'][j]['id'] == f['id']) {
      h = j;
      break;
    }
    -1 < h ? i['accessories'][h]['count'] += g : i['accessories']['push']({
      'id': f['id'],
      'count': g,
      'c': 1
    }),
    pp['interface']['root']['$emit']('accessories_list_update'),
    pp['interface']['root']['$emit']('obj_price_update');
  }
  ['get_accessories']() {
    return this['userData']['params']['accessories'];
  }
  ['remove_accessory'](f) {
    var g = this['userData']['params'];
    for (let h = g['accessories']['length']; h--; )
    if (g['accessories'][h]['id'] === f) {
      g['accessories']['splice'](h, 1);
      break;
    }
    pp['interface']['root']['$emit']('obj_price_update');
  }
  ['check_spec_need_add'](f) {
    var g;
    if (!f?.['excluded']?.['parents'])
    return true;
    var h = this['userData']['path'];
  }
  ['_get_specs_accessories'](f) {
    let g = this
    , h = pp['events']?.['cabinet']?.['before_create_spec_item']
    , j = pp['events']?.['cabinet']?.['after_create_spec_item'];
    if (f = f || {
      'all': {},
      'sum': {},
      'sum_arr': [],
      'aggr_funcs': {}
    },
    this['userData']['params']['accessories']) {
      var k = this['userData']['params']['accessories'];
      if (k) {
        for (let v = 0; v < k.length; v++)
        u(f, k[v]);
      }
    }
    if (this['userData']['params']['accessories_default']) {
      var m = this['userData']['params']['accessories_default'];
      if (m) {
        for (let w = 0; w < m.length; w++)
        u(f, m[w]);
      }
    }
    if (this['userData']['params']['spec']['variants'] && this['userData']['params']['spec']['variants'][this['userData']['params']['spec']['selected_variant']]) {
      var n = this['userData']['params']['spec']['variants'][this['userData']['params']['spec']['selected_variant']]['accessories'];
      if (n) {
        for (let x = 0; x < n.length; x++)
        u(f, n[x]);
      }
    }
    if (this['userData']['params']['spec']['template'] && this['userData']['params']['spec']['template']['accessories']) {
      var q = this['userData']['params']['spec']['template']['accessories'];
      for (let y = 0; y < q.length; y++)
      u(f, q[y]);
    }
    return f;
    function u(z, A) {
      var B = A['id'], A = A['count'], C;
      if (h && false === h('item', g, z))
      return;
      var B = accsessories_data['get_item'](B);
      if (B) {
        var D = module_utils['get_price_mod']('acc', null, B['category']), E;
        if (B['count'] = parse_int(A),
        B['price_type'] = 'p',
        B['type'] = 'item',
        B['price'] = parse_num(B['price_per_piece']) * D,
        B['sum_key'] = B['id'] + '_' + B['code'] + '_' + B['price_type'],
        j) {
          if (false === j('item', g, z, B))
          return;
        }
        module_utils['add_spec_to_context'](z, B);
      }
    }
  }
  ['_get_specs'](f, g) {
    return f = f || {
      'all': {},
      'sum': {},
      'sum_arr': [],
      'aggr_funcs': {}
    },
    !view_mode && (this['_get_specs_accessories'](f),
    this['userData']['is_root'] && module_utils['init_spec_ctx_aggr'](f),
    !g) && this['userData']['is_root'] ? this['_get_specs_root'](f) : f;
  }
  ['_get_specs_root'](f) {
    var g = this['userData']['parts'], h = (f = f || {
      'all': {},
      'sum': {},
      'sum_arr': [],
      'aggr_funcs': {}
    },
    ['wall', 'furniture', 'model', 'facade', 'section', 'module', 'fill_section', 'path', 'cut']), j = [], k, m, n;
    for (k of g['module']) {
      var q = module_utils['check_spec_param'](k, 'show_in_spec', 1)
      , u = module_utils['check_spec_param'](k, 'nested_in_spec', 1);
      q ? u || j.push(k['userData']['path'] + ',') : j.push(k['userData']['path']);
    }
    for (m of h)
    if (g[m])
    for (let v of g[m]) {
      _['find'](j, w => v['userData']['path']['startsWith'](w)) || v['_get_specs'](f);
    }
    return f;
  }
  ['_get_box']() {
    let f = new THREE['Box3']()['setFromCenterAndSize'](this['userData']['own_object']['getWorldPosition'](new THREE['Vector3']()), new THREE['Vector3'](this['userData']['computed']['u_size']['x'],this['userData']['computed']['u_size']['y'],this['userData']['computed']['u_size']['z']));
    this['updateMatrixWorld']();
    var g = this['userData']['own_object']['getWorldQuaternion'](new THREE['Quaternion']());
    return f = getRotatedBox3(f, f['getCenter'](new THREE['Vector3']()), g);
  }
  ['_draw_box']() {
    this['userData']['box_helper'] && (this['userData']['box_helper']['dispose'](),
    scene['remove'](this['userData']['box_helper'])),
    this['userData']['box_helper'] = new THREE['Box3Helper'](this['_get_box'](),16776960),
    scene['add'](this['userData']['box_helper']);
  }
}
let def_cabinet_cokol = _['merge'](copy_object(cabinet_def_common), {
  'type': 'cokol',
  'spec': {
    'id': 0,
    'type': 'common',
    'key': 'front',
    'can_change': {
      'id': 1
    }
  },
  'size': {
    'x': 100
  }
})
, def_cokol_nolib = {
  'item': {
    'params': {
      'mat_mode': 0,
      'material': 0,
      'mat_params': {},
      'models': {
        'common': {
          'enabled': true,
          'model': '',
          'code': '',
          'price_type': 'p',
          'price_mode': 'm',
          'price': 0,
          'acc_id': 0
        },
        'radius': {
          'enabled': false,
          'model': '',
          'code': '',
          'price_type': 'p',
          'price_mode': 'm',
          'price': 0,
          'acc_id': 0
        }
      },
      'accs': [],
      'conns': {
        'a0': {
          'enabled': false,
          'model': '',
          'code': '',
          'price_type': 'p',
          'price_mode': 'm',
          'price': 0,
          'acc_id': 0
        },
        'a180': {
          'enabled': false,
          'model': '',
          'code': '',
          'price_type': 'p',
          'price_mode': 'm',
          'price': 0,
          'acc_id': 0
        },
        'a90': {
          'enabled': false,
          'model': '',
          'code': '',
          'price_type': 'p',
          'price_mode': 'm',
          'price': 0,
          'acc_id': 0
        },
        'a135': {
          'enabled': false,
          'model': '',
          'code': '',
          'price_type': 'p',
          'price_mode': 'm',
          'price': 0,
          'acc_id': 0
        }
      },
      'height': 0,
      'thickness': 0,
      'width': 0
    }
  },
  'material': {
    'params': {},
    'add_params': {}
  }
};
class CabinetCokolN extends CabinetSection {
  constructor(f={}, g={}, h={
    'use_lib': true,
    'params': {},
    'material': {}
  }) {
    super(f, g, h);
  }
  ['_before_params'](f, g, h) {
    this['userData']['class'] = this.constructor['name'],
    this['temp_type'] = this.constructor['name'],
    f['type'] || (f['type'] = 'cokol');
  }
  ['_before_build']() {
    var f = this['userData']['params']
    , g = this['userData']['computed'];
    this['userData']['item_id'] = f['spec']['id'],
    g['key'] = f['spec']['key'],
    this['userData']['add_params']['use_lib'] ? (g['item'] = cokol_lib['get_item'](this['userData']['item_id']),
    g['decor'] = g['item']['params']['material']) : (g['item'] = _['merge'](copy_object(def_cokol_nolib['item']), this['userData']['add_params']['params']),
    g['decor'] = _['merge'](copy_object(def_cokol_nolib['material']), this['userData']['add_params']['material'])),
    g['model'] = g['item']['params']['models'][f['spec']['type']];
  }
  ['_build_size']() {
    var f = this['userData']['computed']
    , g = this['userData']['params']
    , h = f['c_object'];
    f['size']['x'] = comp2(g['size']['x'], h),
    f['size']['y'] = parseInt(f['item']['params']['height']),
    f['size']['z'] = parseInt(f['item']['params']['thickness']),
    f['u_size'] = f['size']['clone']()['divideScalar'](units);
  }
  async['_build_spec']() {
    var f = this['userData']['computed']
    , g = this['userData']['own_object']
    , h = {
      'key': 'gen',
      'mat_mode': f['item']['params']['mat_mode'],
      'p_mat_key': f['item']['params']['p_mat_key'],
      'p_mat': f['item']['params']['p_mat'],
      'material': f['item']['params']['material'],
      'params': f['item']['params']['mat_params']
    };
    if (f['model'] && f['model']['model']) {
      await this['_load_model'](f['model']['model'], {
        'gen': h
      });
      for (let i = 0; i < g['children']['length']; i++)
      g['children'][i]['userData']['edgesModeType'] = ObjectType['CabinetCokol'];
      'edges' == global_options['mode'] && this['edges_mode']();
    } else {
      let j = new Object_wall({
        'width': f['u_size']['x'],
        'height': f['u_size']['y'],
        'thickness': f['u_size']['z'],
        'name': f['tag']
      });
      j['userData']['edgesModeType'] = ObjectType['CabinetCokol'],
      g['add'](j);
      var f = _.map(this['userData']['own_object']['children'], k => ({
        'mesh': j,
        'params': {
          'v': 3,
          'm': 'gen',
          't': {
            'x': 0,
            'y': 0,
            'z': 0
          },
          's': {
            'x': 1,
            'y': 1,
            'z': 1
          },
          'tax': {
            'x': 'x',
            'y': 'y'
          }
        }
      }));
      this['_apply_materials']({
        'gen': h
      }, f);
    }
  }
  ['change_material'](f, g=true) {
    var h = this['userData']['params'], j, h, h, k;
    constructor_settings['core_v2'] && !h['spec']['can_change']?.['id'] || (j = h['spec']['id'] !== f,
    h['spec']['id'] = f,
    (h = _['get'](this['userData'], 'parent_params.root')) && (h = h['get_child_by_path'](this['userData']['path'], true),
    k = _['get'](h, 'spec'),
    h) && k && (k['id'] = f),
    g && j && this['_rebuild']());
  }
  ['_apply_materials'](f={}, g=[]) {
    var h = this['userData']['computed'];
    g.length || (g = this['userData']['computed']['meshes_list']);
    for (let n = 0; n < g.length; n++)
    if (g[n]['params'] && 0 != g[n]['params']['selected']) {
      var j = g[n]['mesh']
      , k = (j['material'] && dispose_material(j['material']),
      this['userData']['computed']['item']['params']);
      let o;
      switch (this['userData']['computed']['item']['params']['mat_mode'],
      k['mat_mode'] && (k['mode'] = k['mat_mode']),
      '' + k['mat_mode']) {
        case '0':
        o = copy_object(k['mat_params']);
        break;
        case '1':
        o = pp['libs']['decors']['get_item'](k['selected']);
        break;
        case '2':
        o = pp['libs']['decors']['get_item'](k['selected']);
        break;
        case '3':
        pp['libs']['materials'][k['p_mat_key']] && (o = pp['libs']['materials'][k['p_mat_key']]['get_item'](k['p_mat'])['params']['mat_params']);
        break;
        case '4':
        break;
      }
      o ? (void 0 === o['add_params'] && (o['add_params'] = {}),
      o['add_params']['model_width'] = g[n]['params']['tax'] ? h['size'][g[n]['params']['tax']['x']] : h['size']['x'],
      o['add_params']['model_height'] = g[n]['params']['tax'] ? h['size'][g[n]['params']['tax']['y']] : h['size']['y']) : o = pp['libs']['decors']['get_item'](0);
      var l = create_material(o);
      j['material'] = l;
    }
  }
  ['_after_build']() {
    'edges' == global_options['mode'] && this['edges_mode']();
  }
  ['set_size']() {
    var f = this['userData']['own_object']
    , g = {
      'x': this['userData']['computed']['size']['x'] / units,
      'y': this['userData']['computed']['size']['y'] / units,
      'z': this['userData']['computed']['size']['z'] / units
    }
    , h = f['rotation']['clone']()
    , j = (f['rotation']['set'](0, 0, 0),
    new THREE['Euler']()['setFromQuaternion'](f['getWorldQuaternion'](new THREE['Quaternion']())['clone']()))
    , j = (f['rotation']['set'](-1 * j['x'], -1 * j['y'], -1 * j['z']),
    box3['setFromObject'](f)['getSize'](new THREE['Vector3']())['clone']())
    , k = {
      'box': box3['setFromObject'](f)['getSize'](new THREE['Vector3']())['clone'](),
      'diff': new THREE['Vector3'](g['x'],g['y'],g['z'])['sub'](j)['divideScalar'](2),
      'size': g
    };
    for (let l = 0; l < f['children']['length']; l++)
    set_size_buff(f['children'][l], f['children'][l]['name'], k),
    correct_uv_buff(Model_utils['get_model_from_cache'](this['userData']['computed']['item']['params']['models'][this['userData']['params']['spec']['type']]['model'])['geometry'][l], f['children'][l]['geometry']);
    f['rotation']['copy'](h);
  }
  ['get_specs']() {
    return {
      'id': this['userData']['computed']['material'],
      'm2': parseFloat((this['userData']['computed']['size']['x'] / 1000 * this['userData']['computed']['size']['y'] / 1000)['toFixed'](2)),
      'pm': this['userData']['computed']['size']['x'] / 1000
    };
  }
}
let def_cabinet_animator = _['merge'](copy_object(cabinet_def_common), {
  'type': 'animator',
  'spec': {
    'is_open': 0,
    'props': {
      'deg': 0
    },
    'source': {
      'id': ''
    },
    'fn': 'slide',
    'group': ''
  },
  'children': [],
  'size': {
    'x': 600,
    'y': 360,
    'z': 530
  }
});
class CabinetAnimator extends CabinetSection {
  constructor(f={}, g={}, h={
    'use_lib': true,
    'params': {},
    'material': {}
  }) {
    super(f, g, h);
  }
  ['_before_build']() {
    this['userData']['state'] = {
      'is_open': false,
      'is_moving': false
    },
    this['userData']['linked_items'] = [];
  }
  ['_build_struct']() {
    super['_build_struct'](),
    this['userData']['animator_object'] = new THREE['Group'](),
    this['userData']['animator_object']['name'] = '__animator',
    this['userData']['struct'][this['userData']['own_object']['name']] = this['userData']['animator_object'],
    this['userData']['ani_children'] = this['userData']['animator_object'],
    this['add'](this['userData']['animator_object']),
    this['userData']['animator_object']['add'](this['userData']['own_object']);
  }
  ['_build_spec']() {
    super['_build_spec']();
    let f = this['userData']['params']['spec']
    , g = null;
    this['userData']['linked_items'] = [],
    f['source']['id'] && setTimeout( () => {
      if (g = (null != this['userData']['local_parent'] ? this['userData']['local_parent'] : this['userData']['parent'])['_get_child_by_id'](f['source']['id'])) {
        let i = (this['userData']['linked'] = g)['userData']['params']['spec'];
        f['source']['fn'] && (f['fn'] = i['fn']),
        Object['keys'](i['props'])['forEach'](j => {
          f['source']['fixed']['includes'](j) || (f['props'][j] = i['props'][j]);
        }
        );
        var h = [];
        null != this['userData']['local_parent'] && this['userData']['local_parent']['_get_children_by_id'](f['source']['id'], h),
        this['userData']['linked_items'] = h;
      }
    }
    , 200),
    this['userData']['state']['is_open'] = 1 == f['is_open'];
  }
  ['_build_pos']() {
    super['_build_pos']();
  }
  ['_after_build']() {
    this['userData']['state']['initial_pos'] = this['userData']['own_object']['position']['clone'](),
    this['userData']['state']['initial_rot'] = this['userData']['own_object']['rotation']['clone']();
    var e = this['userData']['params']['spec'];
    if (e['is_open'] && (pp['engine']['animator_state'][e['fn']](this, e['props'], this['userData']['computed']['variables']),
    this['userData']['linked_items'])) {
      for (let f = 0; f < this['userData']['linked_items']['length']; f++)
      pp['engine']['animator_state'][e['fn']](this['userData']['linked_items'][f], e['props'], this['userData']['computed']['variables']);
    }
  }
  ['animate']() {
    if (!this['userData']['state']['is_moving']) {
      var e = this['userData']['params']['spec'];
      if (this['userData']['linked_items']) {
        for (let f = 0; f < this['userData']['linked_items']['length']; f++)
        this['userData']['linked_items'][f]['animate']();
      }
      module_utils['change_param_by_path'](this['userData']['root'], this['userData']['path'], 'spec.is_open', to_int(!this['userData']['state']['is_open']), false);
      try {
        pp['engine']['animations'][e['fn']](this, e['props'], this['userData']['computed']['variables']);
      } catch (g) {}
    }
  }
  ['trigger_animation_by_group'](e) {
    var f = this['userData']['params']?.['spec'];
    'animator' === this['userData']['params']?.['type'] && f?.['group'] === e && this['animate']?.();
  }
}
let def_cabinet_bort = _['merge'](copy_object(cabinet_def_common), {
  'type': 'bort',
  'spec': {
    'name': '',
    'code': '',
    'group': 'bort',
    'type': 'common',
    'key': '',
    'shape': null,
    'material': {
      'id': '1'
    }
  },
  'size': {
    'x': 100,
    'y': 15,
    'z': 15
  }
});
class CabinetBort extends CabinetSection {
  constructor(f={}, g={
    'root': null,
    'parent': null,
    'local_parent': null,
    'path': '0'
  }, h={}) {
    super(f, g, h);
  }
  ['_before_params'](f, g, h) {
    this['userData']['class'] = this.constructor['name'],
    this['temp_type'] = this.constructor['name'],
    f['type'] || (f['type'] = 'common');
  }
  ['_build_children']() {}
  ['_before_build']() {
    var f = this['userData']['params'], g = this['userData']['computed'], h = this['userData']['parent_params'], j = this['userData']['params']['spec']['material']['group'], k, l = this['userData']['root']['userData']['computed'], f = (this['params'] = this['userData']['params'],
    f['spec']['material']['id']);
    g['key'] = this['userData']['params']['spec']['key'],
    g['material'] = pp['libs']['bort']['get_item'](f),
    g['decor'] = this['userData']['computed']['material']['params']['material'],
    this['_build_computed_materials'](),
    g['material']['add_params'] || (g['material']['add_params'] = {});
  }
  ['_build_size']() {
    var f = this['userData']['computed']
    , g = this['userData']['params']
    , h = f['c_object'];
    f['size']['x'] = comp2(g['size']['x'], h),
    f['size']['y'] = comp2(g['size']['y'], h),
    f['size']['z'] = comp2(g['size']['z'], h),
    f['u_size'] = f['size']['clone']()['divideScalar'](units);
  }
  ['_after_build']() {
    'edges' == global_options['mode'] && this['edges_mode']();
  }
  ['_build_computed_materials']() {
    var f = this['userData']['computed'];
    f['meshes_list_by_material'] = {
      'gen': []
    },
    f['materials'] = {
      'gen': {
        'key': 'gen',
        'tex_axis': {
          'x': 'x',
          'y': 'y'
        },
        'mode': 'i',
        'params': f['material']['params']['material']
      }
    };
  }
  ['_build_spec']() {
    var f = this['userData']['computed'], g = this['userData']['params'], f;
    ce('pgpasppasp'),
    f['material']['models']['common'] ? this['_load_model']() : ((f = new Object_wall({
      'width': f['u_size']['x'],
      'height': f['u_size']['y'],
      'thickness': f['u_size']['z'],
      'material': f['material'],
      'name': f['tag']
    }))['userData']['edgesModeType'] = ObjectType['CabinetCokol'],
    this['userData']['own_object']['add'](f)),
    this['_apply_material']();
  }
  async['_load_model']() {
    var f = this['userData']['computed']
    , g = f['material']['models']['common']
    , h = (f['meshes_list'] = [],
    await load_model({
      'model': g,
      'buffer': true,
      'no_cache': -1 < g['indexOf']('data:application')
    }));
    for (let l = 0; l < h.length; l++) {
      var j = h[l]['clone']();
      let m = 'gen';
      var k = j['name']['match'](/m\((.*?)\)/)
      , k = (null != k && (m = k[1]),
      new THREE['Mesh'](j,red_mat));
      k['name'] = j['name'],
      k['name'] += '_x',
      k['castShadow'] = true,
      k['receiveShadow'] = true,
      f['meshes_list']['push']({
        'mat_key': m,
        'mesh': k
      }),
      f['meshes_list_by_material'][m] && f['meshes_list_by_material'][m]['push'](k),
      this['userData']['own_object']['add'](k);
    }
    this['_apply_material'](),
    this['_set_model3d_size'](g),
    f['model_loaded'] = 1;
  }
  ['_apply_material']() {
    var f = this['userData']['computed']
    , g = this['userData']['params']
    , h = materials_lib['get_item'](f['decor']);
    h['add_params']['model_width'] = f['size']['x'],
    h['add_params']['model_height'] = f['size']['y'],
    0 != g['spec']['material']['rotated'] && (h['add_params']['rotation'] = 'rotated');
    for (let i = 0; i < this['userData']['own_object']['children']['length']; i++)
    dispose_material(this['userData']['own_object']['children'][i]['material']),
    this['userData']['own_object']['children'][i]['material'] = create_material(h);
  }
  ['edges_mode']() {
    var f = this['type'], g;
    this['edges_mode_traverse'](this, 'Cabinet' !== f && 'Locker' !== f && 'Door' !== f),
    this['build_sizes'] && 'Cabinet' === f && this['build_sizes']();
  }
  ['edges_mode_traverse'](f, g) {
    f && f['traverse'](function(h) {
      var i, i;
      'Mesh' === h['type'] && true !== h['size_box'] && 1 != h['no_edges'] && 'edges' != h['name'] && 'Sizes_obj' !== h['parent']['type'] && ((i = build_edges(h['geometry']))['name'] = 'edges',
      (g ? h['parent'] : h)['add'](i),
      h['material']['map'] && 'function' == typeof h['material']['map']['dispose'] && h['material']['map']['dispose'](),
      i['visible'] = h['visible'],
      g && (i['position']['copy'](h['position']),
      i['rotation']['copy'](h['rotation']),
      i['scale']['copy'](h['scale'])),
      i = h['userData'] && h['userData']['edgesModeType'] || ObjectType['Default'],
      h['material'] = getEdgesModeMaterial(i));
    });
  }
  ['design_mode']() {
    var f, g;
    'function' == typeof this['_rebuild'] && (f = this['position']['clone'](),
    g = this['rotation']['clone'](),
    this['_rebuild'](),
    this['position']['copy'](f),
    this['rotation']['copy'](g));
  }
  ['_set_model3d_size'](f) {
    var g = this['userData']['own_object']
    , h = this['userData']['params']
    , j = this['userData']['computed']['size']
    , k = this['userData']['computed']['u_size']
    , n = this['userData']['computed']['item']
    , p = g['rotation']['clone']()
    , j = (scene['add'](g),
    g['rotation']['set'](0, 0, 0),
    new THREE['Vector3'](j['x'],j['y'],j['z']))
    , q = box3['setFromObject'](g)['getSize'](new THREE['Vector3']())
    , u = {
      'box': q['clone'](),
      'diff': new THREE['Vector3'](j['x'] / units,j['y'] / units,j['z'] / units)['sub'](q)['divideScalar'](2),
      'size': j['divideScalar'](units)
    };
    for (let v = 0; v < g['children']['length']; v++)
    set_size_buff(g['children'][v], g['children'][v]['name'], u),
    correct_uv_buff(Model_utils['get_model_from_cache'](f)['geometry'][v], g['children'][v]['geometry']);
    this['add'](g),
    g['rotation']['copy'](p);
  }
}
let def_cabinet_butts = _['merge'](copy_object(cabinet_def_common), {
  'type': 'butts',
  'active': 1,
  'spec': {
    'id': 0,
    'variant_id': 0,
    'key': 'butts',
    'name': '',
    'code': '',
    'sign': '',
    'group': 'butts',
    'type': 'common',
    'type_params': {},
    '_p0': {},
    '_p1': {},
    '_p2': {},
    'face_index': '0'
  },
  'size': {
    'x': 100,
    'y': 100,
    'z': 2
  }
});
class CabinetButts extends CabinetSection {
  constructor(f={}, g={}, h={}) {
    super(f, g, h);
  }
  ['_before_params'](f, g, h) {
    this['userData']['class'] = this.constructor['name'],
    this['temp_type'] = this.constructor['name'],
    f['type'] || (f['type'] = 'butts');
  }
  ['_before_build']() {
    var f = this['userData']['params']
    , g = this['userData']['computed']
    , h = this['userData']['root']
    , i = (this['userData']['orientation'] = this['userData']['parent']['userData']['params']['spec']['orientation'] || 'f',
    g['face_index'] = f['spec']['face_index'],
    f['spec']);
    g['material'] = pp['libs']['butts'][i['key']]['get_item'](i['id']),
    g['decor'] = this['userData']['computed']['material']['params']['material'],
    g['variant'] = g['material']['params']['variants'][f['spec']['variant_id']];
  }
  ['_find_variant']() {}
  ['_build_children']() {}
  ['_build_size']() {
    var f = this['userData']['computed']
    , g = this['userData']['params']
    , h = f['c_object']
    , i = this['userData']['orientation'];
    f['size']['x'] = g['size']['x'],
    f['size']['y'] = g['size']['y'],
    f['size']['z'] = f['variant']['thickness'],
    f['u_size'] = f['size']['clone']()['divideScalar'](units);
  }
  ['_build_spec']() {
    var j = this['userData']['computed'], k = this['userData']['orientation'], {_p0: q, _p1: A, _p2: B, type: C} = this['userData']['params']['spec'], F = j['size']['x'] / units, G = j['size']['y'] / units, I = j['size']['z'] / units, J;
    let K = new THREE['Shape'](), L;
    if ('rad' === C) {
      var C = A['dir'], J = A['radius'] / units, N = (q['x'] /= units,
      q['y'] /= units,
      A['x'] /= units,
      A['y'] /= units,
      B['x'] /= units,
      B['y'] /= units,
      void 0 !== C && C), C = q['x'] - A['x'], q = q['y'] - A['y'], O = B['x'] - A['x'], P = B['y'] - A['y'], Q = Math['sqrt'](C * C + q * q) || 1, R = Math['sqrt'](O * O + P * P) || 1, S = A['x'] + C / Q * J, Q = A['y'] + q / Q * J, U = A['x'] + O / R * J, R = A['y'] + P / R * J, W = (S + U) / 2, Z = (Q + R) / 2, a0, a1 = 0 < C * P - q * O, C = Math['sqrt']((U - S) ** 2 + (R - Q) ** 2), P = C ? Math['sqrt'](Math['max'](J * J - Math['pow'](C / 2, 2), 0)) : 0, q = (R - Q) / Math['max'](C, 0.0001), O = -(U - S) / Math['max'](C, 0.0001), C = S - U, a2 = Q - R;
      let a5, a6;
      a6 = !a1 && N ? (a5 = W - q * P,
      Z - O * P) : (a5 = W + q * P,
      Z + O * P);
      let a7, a8;
      a1 || (N ? (0 < C && a2 < 0 && (a7 = J,
      a8 = J),
      C < 0 && a2 < 0 && (a7 = J,
      a8 = J),
      C < 0 && 0 < a2 && (a7 = J,
      a8 = J),
      0 < C && 0 < a2 && (a7 = J,
      a8 = J)) : (C < 0 && 0 < a2 && (a7 = I,
      a8 = I),
      0 < C && 0 < a2 && (a7 = I,
      a8 = -I),
      0 < C && a2 < 0 && (a7 = -I,
      a8 = -I),
      C < 0 && a2 < 0 && (a7 = -I,
      a8 = I)));
      var W = a5 - A['x']
      , q = a6 - A['y']
      , Z = Math['atan2'](Q - a6, S - a5)
      , O = Math['atan2'](R - a6, U - a5);
      let a9 = J + I
      , aa = J;
      a1 || (a9 = J - I,
      aa = J);
      var a3 = 34
      , P = new THREE['ArcCurve'](W,q,a9,O,Z,N)
      , C = new THREE['ArcCurve'](W,q,aa,Z,O,!N)
      , a2 = P['getPoints'](34)
      , Q = C['getPoints'](34)
      , S = [...a2, ...Q];
      let ab = new THREE['Shape'](S);
      switch (L = new THREE['ExtrudeBufferGeometry'](ab,{
        'steps': 1,
        'depth': G,
        'bevelEnabled': false
      }),
      k) {
        case 'f':
        L['translate'](0, 0, -G / 2),
        a1 || N || L['translate'](a7, a8, 0);
        break;
        case 'h':
        L['translate'](0, 0, -G / 2),
        L['rotateX'](Math['PI'] / 2),
        a1 || N || L['translate'](a7, a8, 0);
        break;
        case 'v':
        L['translate'](0, 0, -G / 2),
        L['rotateY'](-Math['PI'] / 2),
        a1 || N || L['translate'](a7, a8, 0);
        break;
      }
    } else {
      K['moveTo'](0, 0),
      K['lineTo'](F, 0),
      K['lineTo'](F, G),
      K['lineTo'](0, G),
      K['lineTo'](0, 0),
      L = new THREE['ExtrudeBufferGeometry'](K,{
        'steps': 1,
        'depth': I,
        'bevelEnabled': false
      });
      var a4 = Math['atan2'](B['y'] - A['y'], B['x'] - A['x']);
      switch (k) {
        case 'f':
        L['translate'](-F / 2, -G / 2, -I),
        L['rotateX'](Math['PI'] / 2),
        L['rotateZ'](a4),
        correct_buffer_uv_simple(L, j['size']['x'] / units, j['size']['y'] / units);
        break;
        case 'h':
        L['translate'](-F / 2, -G / 2, 0),
        L['rotateY'](-a4),
        correct_buffer_uv_simple(L, j['size']['x'] / units, j['size']['y'] / units);
        break;
        case 'v':
        L['translate'](-F / 2, -G / 2, -I),
        L['rotateZ'](Math['PI'] / 2),
        L['rotateX'](-a4 + Math['PI'] / 2),
        correct_buffer_uv_simple(L, j['size']['x'] / units, j['size']['y'] / units);
        break;
      }
    }
    var R = new THREE['Mesh'](L,red_mat);
    R['castShadow'] = false,
    R['receiveShadow'] = true,
    R['userData']['edgesModeType'] = ObjectType['Wall'],
    this['userData']['original_meshes'] = [R['clone'](true)],
    this['userData']['own_object']['add'](R),
    global_options?.['show_butts'] && this['_show_helpers']();
  }
  ['_after_build']() {
    this['_apply_material'](),
    'edges' == global_options['mode'] && this['edges_mode']();
  }
  ['_apply_material']() {
    var f = this['userData']['computed']
    , g = '' + f['material']['params']['mat_mode'] == '0' ? f['material']['params']['mat_params'] : materials_lib['get_item'](f['decor']);
    void 0 === g['add_params'] && (g['add_params'] = {}),
    g['add_params']['model_width'] = f['size']['x'],
    g['add_params']['model_height'] = f['size']['y'];
    for (let h = 0; h < this['userData']['own_object']['children']['length']; h++)
    dispose_material(this['userData']['own_object']['children'][h]['material']),
    this['userData']['own_object']['children'][h]['material'] = create_material(g, f['material']['key'] + '_' + f['material']['id']);

  }
