['_build_helpers']() {
  var j = this['userData']['computed']
  , k = this['userData']['orientation']
  , {_p0: q, _p1: A, _p2: B, type: C} = this['userData']['params']['spec']
  , F = j['size']['x'] / units
  , G = j['size']['y'] / units
  , H = j['size']['z'] / units
  , I = this['userData']['parent'];
  this['userData']['helpers'] ? this['_reset'](this['userData']['helpers']) : (this['userData']['helpers'] = new THREE['Group'](),
  this['userData']['helpers']['name'] = '__helpers',
  this['add'](this['userData']['helpers']));
  let J;
  var j = new THREE['Shape']();
  if ('rad' === C) {
    var C = A['dir'], K = A['radius'] / units, L = q['x'] / units, q = q['y'] / units, N = A['x'] / units, O = A['y'] / units, P, Q, C = void 0 !== C && C, L = L - N, q = q - O, R = B['x'] / units - N, S = B['y'] / units - O, U = Math['sqrt'](L * L + q * q) || 1, W = Math['sqrt'](R * R + S * S) || 1, Z = N + L / U * K, U = O + q / U * K, a0 = N + R / W * K, W = O + S / W * K, a1 = (Z + a0) / 2, a2 = (U + W) / 2, a3, L = 0 < L * S - q * R, S = Math['sqrt']((a0 - Z) ** 2 + (W - U) ** 2), q = S ? Math['sqrt'](Math['max'](K * K - Math['pow'](S / 2, 2), 0)) : 0, R = (W - U) / Math['max'](S, 0.0001), S = -(a0 - Z) / Math['max'](S, 0.0001);
    let a6, a7, a8 = (a7 = !L && C ? (a6 = a1 - R * q,
    a2 - S * q) : (a6 = a1 + R * q,
    a2 + S * q),
    K + H), a9 = K;
    L || (a8 = K - H,
    a9 = K);
    var a1 = a6 - N
    , R = a7 - O
    , a2 = Math['atan2'](U - a7, Z - a6)
    , S = Math['atan2'](W - a7, a0 - a6)
    , a4 = 34
    , q = new THREE['ArcCurve'](a1,R,a8,S,a2,C)
    , L = new THREE['ArcCurve'](a1,R,a9,a2,S,!C)
    , K = q['getPoints'](34)
    , N = L['getPoints'](34)
    , O = [...K, ...N[0]]
    , U = new THREE['Shape'](O);
    switch (J = new THREE['ExtrudeBufferGeometry'](U,{
      'steps': 1,
      'depth': G,
      'bevelEnabled': false
    }),
    k) {
      case 'f':
      J['translate'](0, 0, -G / 2);
      break;
      case 'h':
      J['translate'](0, 0, -G / 2),
      J['rotateX'](Math['PI'] / 2);
      break;
      case 'v':
      J['translate'](0, 0, -G / 2),
      J['rotateY'](-Math['PI'] / 2);
      break;
    }
  } else {
    j['moveTo'](0, 0),
    j['lineTo'](F, 0),
    j['lineTo'](F, G),
    j['lineTo'](0, G),
    j['lineTo'](0, 0),
    J = new THREE['ExtrudeBufferGeometry'](j,{
      'steps': 1,
      'depth': H,
      'bevelEnabled': false
    });
    var a5 = Math['atan2'](B['y'] - A['y'], B['x'] - A['x']);
    switch (k) {
      case 'f':
      J['translate'](-F / 2, -G / 2, -H),
      J['rotateX'](Math['PI'] / 2),
      J['rotateZ'](a5);
      break;
      case 'h':
      J['translate'](-F / 2, -G / 2, 0),
      J['rotateY'](-a5);
      break;
      case 'v':
      J['translate'](-F / 2, -G / 2, -H),
      J['rotateZ'](Math['PI'] / 2),
      J['rotateX'](-a5 + Math['PI'] / 2);
      break;
    }
  }
  var Z = new THREE['MeshBasicMaterial']({
    'color': 3381759,
    'transparent': true,
    'opacity': 0.5,
    'depthTest': false
  })
  , W = new THREE['LineBasicMaterial']({
    'color': 3381759,
    'linewidth': 2,
    'depthTest': false
  })
  , a0 = new THREE['Mesh'](J,Z)
  , a1 = (a0['userData']['deepTest'] = true,
  a0['userData']['is_helper'] = true,
  a0['userData']['no_edges'] = 1,
  a0['renderOrder'] = 10,
  a0['layers']['set'](1),
  new THREE['EdgesGeometry'](J))
  , R = new THREE['LineSegments'](a1,W);
  R['userData']['deepTest'] = true,
  R['userData']['is_helper'] = true,
  R['userData']['no_edges'] = 1,
  R['renderOrder'] = 11,
  R['layers']['set'](1),
  this['userData']['helpers']['add'](a0),
  this['userData']['helpers']['add'](R),
  this['userData']['helpers']['visible'] = 1 == this['userData']['params']['helpers_visible'];
}
}
let def_cabinet_cokol_top = _['merge'](copy_object(cabinet_def_common), {
  'type': 'cokol_top',
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
, def_cokol_top_nolib = {
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
class CabinetCokolTopN extends CabinetSection {
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
    f['type'] || (f['type'] = 'cokol_top');
  }
  ['_before_build']() {
    var f = this['userData']['params']
    , g = this['userData']['computed'];
    this['userData']['item_id'] = f['spec']['id'],
    g['key'] = f['spec']['key'],
    this['userData']['add_params']['use_lib'] ? (g['item'] = cokol_top_lib['get_item'](this['userData']['item_id']),
    g['decor'] = g['item']['params']['material']) : (g['item'] = _['merge'](copy_object(def_cokol_top_nolib['item']), this['userData']['add_params']['params']),
    g['decor'] = _['merge'](copy_object(def_cokol_top_nolib['material']), this['userData']['add_params']['material'])),
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
    , g = this['userData']['own_object'];
    if (f['model'] && f['model']['model']) {
      await this['_load_model'](f['model']['model'], {
        'gen': f['item']
      });
      for (let i = 0; i < g['children']['length']; i++)
      g['children'][i]['userData']['edgesModeType'] = ObjectType['CabinetCokolTop'];
    } else {
      var h = new Object_wall({
        'width': f['u_size']['x'],
        'height': f['u_size']['y'],
        'thickness': f['u_size']['z'],
        'material': f['material'],
        'name': f['tag']
      })
      , h = (h['userData']['edgesModeType'] = ObjectType['CabinetCokolTop'],
      g['add'](h),
      _.map(this['userData']['own_object']['children'], j => ({
        'mat_key': 'gen',
        'mesh': j
      })));
      this['_apply_materials']({
        'gen': f['item']
      }, h);
    }
  }
  ['change_material'](f) {
    var g = this['userData']['params'], h, g, g, j;
    constructor_settings['core_v2'] && !g['spec']['can_change']?.['id'] || (h = g['spec']['id'] !== f,
    g['spec']['id'] = f,
    (g = _['get'](this['userData'], 'parent_params.root')) && (g = g['get_child_by_path'](this['userData']['path'], true),
    j = _['get'](g, 'spec'),
    g) && j && (j['id'] = f),
    h && this['_rebuild']());
  }
  async['build_model']() {
    var f = await load_model({
      'model': this['userData']['computed']['item']['params']['models'][this['userData']['params']['spec']['type']]['model'],
      'buffer': true,
      'no_cache': false
    });
    for (let h = 0; h < f.length; h++) {
      var g = new THREE['Mesh'](f[h]['clone'](),red_mat);
      g['name'] = f[h]['name'],
      g['castShadow'] = true,
      g['receiveShadow'] = true,
      g['userData']['edgesModeType'] = ObjectType['CabinetCokolTop'],
      this['userData']['own_object']['add'](g);
    }
  }
  ['_after_build']() {
    'edges' == global_options['mode'] && this['edges_mode']();
  }
  ['apply_material_model'](f) {
    var g = this['userData']['computed']
    , h = f['name']['match'](/m\((.*?)\)/);
    let j = 'gen'
    , k = (null != h && (j = h[1]),
    0);
    var l = 0, h = f['name']['match'](/ro\((.*?)\)/), h, h;
    null != h && (l = parseInt(h[1]));
    let n = f['name']['match'](/r\((.*?)\)/);
    null != n && (n = n[1]);
    let p;
    this['userData']['add_params']['use_lib'] ? ('gen' == j && (h = materials_lib['get_item'](g['material']),
    90 == n && (h['add_params']['rotation'] = 'rotated'),
    h['add_params']['model_width'] = this['userData']['size']['x'],
    h['add_params']['model_height'] = this['userData']['size']['y'],
    p = create_material(h),
    k = 1),
    materials_global[j] && ((h = materials_lib['get_item'](materials_global[j]['selected']))['add_params']['model_width'] = this['userData']['size']['x'],
    h['add_params']['model_height'] = this['userData']['size']['y'],
    true === materials['material_rotated'] && (h['add_params']['rotation'] = 'rotated'),
    p = create_material(h),
    k = 1),
    0 == k && bim_keys[j] && (p = 'function' == typeof bim_keys[k] ? bim_keys[k](f, j) : bim_keys[k]),
    f['material'] = p) : ((p = g['material'])['add_params']['model_width'] = g['size']['x'],
    p['add_params']['model_height'] = g['size']['y'],
    f['material'] = create_material(p));
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
let def_cabinet_cornice_placer = _['merge'](copy_object(cabinet_def_common), {
  'type': 'cornice_placer',
  'spec': {
    'id': 0,
    'group': 'cornice_placer',
    'type': 'common',
    'cabinet_type': '',
    'cuts': {
      'start': 0,
      'end': 0
    },
    'can_change': {
      'id': 1
    }
  }
})
, def_cornice_nolib = {
  'item': {
    'params': {
      'name': '',
      'code': '',
      'icon': '',
      'category': [],
      'active': 1,
      'order': 10000,
      'params': {
        'mat_mode': 0,
        'material': 0,
        'p_mat_key': '',
        'p_mat': 0,
        'p_variant': 0,
        'mat_params': {},
        'models': {
          'common': {
            'enabled': true,
            'model': '',
            'code': '',
            'price_type': 'p',
            'price_mode': 'c',
            'price': 0
          },
          'radius': {
            'enabled': false,
            'model': '',
            'code': '',
            'price_type': 'p',
            'price_mode': 'c',
            'price': 0
          }
        },
        'accs': [],
        'height': 0,
        'thickness': 0,
        'width': 0,
        'front_offset': 0
      }
    }
  },
  'material': {
    'params': {},
    'add_params': {}
  }
};
class CabinetCornicePlacer extends CabinetSection {
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
    f['type'] || (f['type'] = 'common');
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
  ['_before_build_spec']() {
    var f = this['userData']['params'], g = this['userData']['computed'], h = f['spec']['id'], h = (this['userData']['add_params']['use_lib'] ? (g['item'] = cornice_lib['get_item'](h),
    g['decor'] = g['item']['params']['material']) : (g['item'] = _['merge'](copy_object(def_cornice_nolib['item']['params']), this['userData']['add_params']['params']),
    g['decor'] = _['merge'](copy_object(def_cornice_nolib['material']), this['userData']['add_params']['material'])),
    g['model'] = g['item']['params']['models'][f['spec']['type']],
    g['item_params'] = {
      'width': parseFloat(g['item']['params']['width']) || 0,
      'depth': parseFloat(g['item']['params']['depth']) || 0,
      'height': parseFloat(g['item']['params']['height']) || 0,
      'front_offset': parseFloat(g['item']['params']['front_offset']) || 0
    },
    {
      'width': g['size']['x'],
      'pos_offset': 0,
      'size_offset': 0,
      'left_offset': 0,
      'right_offset': 0
    }), i, f, j, i, i;
    h['pos_offset'] = g['item_params']['front_offset'],
    h['size_offset'] = g['item_params']['front_offset'],
    'radius' !== f['spec']['type'] && (i = f['spec']['cuts']?.['start'] || 0,
    f = f['spec']['cuts']?.['end'] || 0,
    j = g['item_params']['depth'] - h['size_offset'],
    i && (i = j * Math['tan'](Math['abs'](i)),
    h['width'] += i,
    h['left_offset'] = i),
    f) && (i = j * Math['tan'](Math['abs'](f)),
    h['width'] += i,
    h['right_offset'] = i),
    g['pp_calc'] = h;
  }
  async['_build_spec']() {
    this['_before_build_spec']();
    var f = this['userData']['own_object']
    , g = this['userData']['computed'];
    if (this['_reset'](f),
    constructor_settings['cornice_available'] && project_settings['cornice_available']) {
      var h = {
        'key': 'gen',
        'mat_mode': g['item']['params']['mat_mode'],
        'p_mat_key': g['item']['params']['p_mat_key'],
        'p_mat': g['item']['params']['p_mat'],
        'material': g['item']['params']['material'],
        'params': g['item']['params']['mat_params']
      };
      if (g['model']?.['model']) {
        await this['_load_model'](g['model']['model'], {
          'gen': h
        });
        for (let j = 0; j < f['children']['length']; j++)
        f['children'][j]['userData']['edgesModeType'] = ObjectType['Cornice'];
        this['set_size'](),
        this['make_angle'](),
        'edges' == global_options['mode'] && this['edges_mode']();
      } else
      var h = new Object_wall({
        'width': g['pp_calc']['width'],
        'height': g['item_params']['height'],
        'thickness': g['item_params']['depth'],
        'name': g['tag']
      })
      , i = (f['add'](h),
      h['userData']['edgesModeType'] = ObjectType['Cornice'],
      _.map(this['userData']['own_object']['children'], k => ({
        'mat_key': 'gen',
        'mesh': k
      })));
    }
  }
  ['_after_build']() {
    'edges' == global_options['mode'] && this['edges_mode']();
  }
  ['make_angle']() {
    var f = this['userData']['params'], g = this['userData']['computed'], h = this['userData']['own_object'], j, f, h, k, l, j, l, j;
    'radius' !== f['spec']['type'] && (j = f['spec']['cuts']?.['start'] || 0,
    f = f['spec']['cuts']?.['end'] || 0,
    j || f) && (h = h['children'][0],
    k = [],
    j && ((l = new THREE['BoxBufferGeometry'](12,20,20))['translate'](-6, 0, -10),
    l['rotateY'](-j),
    l['translate'](-g['pp_calc']['width'] / units / 2, 0, g['item_params']['depth'] / units / 2),
    (j = new THREE['Mesh'](l,red_mat))['userData']['edgesModeType'] = ObjectType['Cornice'],
    k.push(j)),
    f && ((l = new THREE['BoxBufferGeometry'](12,20,20))['translate'](6, 0, -10),
    l['rotateY'](-f),
    l['translate'](g['pp_calc']['width'] / units / 2, 0, g['item_params']['depth'] / units / 2),
    (j = new THREE['Mesh'](l,red_mat))['userData']['edgesModeType'] = ObjectType['Cornice'],
    k.push(j)),
    h['geometry'] = csggeom(h, k, 'subtract'));
  }
  ['set_size']() {
    var f = this['userData']['computed']
    , g = this['userData']['own_object']
    , h = {
      'x': f['pp_calc']['width'] / units,
      'y': f['item_params']['height'] / units,
      'z': f['item_params']['depth'] / units
    }
    , j = g['rotation']['clone']()
    , k = (g['rotation']['set'](0, 0, 0),
    new THREE['Euler']()['setFromQuaternion'](g['getWorldQuaternion'](new THREE['Quaternion']())['clone']()))
    , k = (g['rotation']['set'](-1 * k['x'], -1 * k['y'], -1 * k['z']),
    box3['setFromObject'](g)['getSize'](new THREE['Vector3']())['clone']())
    , l = {
      'box': box3['setFromObject'](g)['getSize'](new THREE['Vector3']())['clone'](),
      'diff': new THREE['Vector3'](h['x'],h['y'],h['z'])['sub'](k)['divideScalar'](2),
      'size': h
    };
    for (let m = 0; m < g['children']['length']; m++)
    set_size_buff(g['children'][m], g['children'][m]['name'], l),
    correct_uv_buff(Model_utils['get_model_from_cache'](f['model']?.['model'])['geometry'][m], g['children'][m]['geometry']);
    g['rotation']['copy'](j);
  }
}
let def_cabinet_cut = _['merge'](copy_object(cabinet_def_common), {
  'type': 'cut',
  'spec': {
    'name': '',
    'code': '',
    'group': 'cut',
    'type': 'common',
    'type_params': {},
    'key': '',
    'points': [],
    'reverse': false,
    'direction': 'z',
    'material': {
      'id': '1'
    },
    'trajectory': []
  },
  'size': {
    'x': 10,
    'y': 10,
    'z': 100
  }
});
class CabinetCut extends CabinetSection {
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
    f['type'] || (f['type'] = 'cut');
  }
  ['_before_build']() {
    var f = this['userData']['params'], g = this['userData']['computed'], h, i = this['userData']['root']['userData']['computed'];
    this['params'] = this['userData']['params'],
    g['key'] = this['userData']['params']['spec']['key'] || f['spec']['code'],
    g['material'] = pp['libs']['bort']['get_item'](f['spec']['material']['id']),
    g['decor'] = this['userData']['computed']['material']['params']['material'],
    g['material']['add_params'] || (g['material']['add_params'] = {});
  }
  ['_build_size']() {
    var f = this['userData']['computed']
    , g = this['userData']['params'];
    let h = f['c_object'];
    f['points'] = g['spec']['points']['map'](i => ({
      'x': void 0 !== i['x'] ? comp2(i['x'], h) : null,
      'y': void 0 !== i['y'] ? comp2(i['y'], h) : null,
      'radius': i['radius'] || 0,
      'center': i['center'] ? {
        'x': comp2(i['center']['x'], h),
        'y': comp2(i['center']['y'], h)
      } : null,
      'dir': i['dir'] || false
    })),
    f['size']['x'] = comp2(g['size']['x'], h),
    f['size']['y'] = comp2(g['size']['y'], h),
    f['size']['z'] = comp2(g['size']['z'], h),
    f['u_size'] = f['size']['clone']()['divideScalar'](units);
  }
  ['_build_trajectory']() {
    var f = this['userData']['computed'], g, h = this['userData']['params']['spec']['trajectory'], h;
    let j = f['c_object'];
    h = Array.isArray(h) && 0 < h.length ? h.map(m => new THREE['Vector3'](comp2(m['x'], j),comp2(m['y'], j),0)) : [new THREE['Vector3'](0,0,0), new THREE['Vector3'](0,0,comp2(f['size']['z'], j))],
    f['trajectory'] = h;
    var k = new THREE['CurvePath']()
    , l = h.map(m => m['clone']()['divideScalar'](units));
    for (let m = 0; m < l.length - 1; m++)
    k['add'](new THREE['LineCurve3'](l[m],l[m + 1]));
    return k;
  }
  ['_create_shape']() {
    var f = this['userData']['params']
    , g = this['userData']['computed']
    , j = g['c_object']
    , k = g['size']['x']
    , q = g['size']['y']
    , {cbl: v=0, cbr: w=0, ctl: x=0, ctr: z=0, d1: A=0, d2: B=0, w1: C=0, h1: D=0, w2: E=0, h2: F=0, o: G='', r: H=''} = (g['points'] = [],
    f['spec']['type_params'])
    , v = comp2(v, j)
    , w = comp2(w, j)
    , x = comp2(x, j)
    , z = comp2(z, j)
    , A = comp2(A, j)
    , B = comp2(B, j)
    , C = comp2(C, j)
    , D = comp2(D, j)
    , E = comp2(E, j)
    , F = comp2(F, j)
    , H = comp2(H, j);
    switch (f['spec']['type']) {
      case 'cut_corners':
      g['points'] = [],
      0 < v ? (g['points']['push']({
        'x': 0,
        'y': v,
        'radius': 0
      }),
      g['points']['push']({
        'x': v,
        'y': 0,
        'radius': 0
      })) : g['points']['push']({
        'x': 0,
        'y': 0,
        'radius': 0
      }),
      0 < w ? (g['points']['push']({
        'x': q - w,
        'y': 0,
        'radius': 0
      }),
      g['points']['push']({
        'x': q,
        'y': w,
        'radius': 0
      })) : g['points']['push']({
        'x': q,
        'y': 0,
        'radius': 0
      }),
      0 < z ? (g['points']['push']({
        'x': q,
        'y': k - z,
        'radius': 0
      }),
      g['points']['push']({
        'x': q - z,
        'y': k,
        'radius': 0
      })) : g['points']['push']({
        'x': q,
        'y': k,
        'radius': 0
      }),
      0 < x ? (g['points']['push']({
        'x': x,
        'y': k,
        'radius': 0
      }),
      g['points']['push']({
        'x': 0,
        'y': k - x,
        'radius': 0
      })) : g['points']['push']({
        'x': 0,
        'y': k,
        'radius': 0
      });
      break;
      case 'rounded_corners':
      g['points'] = [{
        'x': 0,
        'y': 0,
        'radius': v,
        'dir': true
      }, {
        'x': q,
        'y': 0,
        'radius': w,
        'dir': true
      }, {
        'x': q,
        'y': k,
        'radius': z,
        'dir': true
      }, {
        'x': 0,
        'y': k,
        'radius': x,
        'dir': true
      }];
      break;
      case 'trapeze_cut_by_offset':
      g['points'] = [{
        'x': C,
        'y': 0,
        'radius': 0
      }, {
        'x': q,
        'y': D,
        'radius': 0
      }, {
        'x': q - E,
        'y': k,
        'radius': 0
      }, {
        'x': F,
        'y': k,
        'radius': 0
      }];
      break;
      case 'radius':
      g['points']['length'] || (g['points'] = [{
        'center': {
          'x': q / 2,
          'y': k / 2
        },
        'radius': H,
        'dir': true
      }]);
      break;
      default:
      g['points'] = [{
        'x': 0,
        'y': 0,
        'radius': 0
      }, {
        'x': q,
        'y': 0,
        'radius': 0
      }, {
        'x': q,
        'y': k,
        'radius': 0
      }, {
        'x': 0,
        'y': k,
        'radius': 0
      }];
      break;
    }
    return p_shapes['common'](g['points']);
  }
  ['_build_spec']() {
    var f = this['userData']['computed']
    , g = this['_create_shape']()
    , h = this['_build_trajectory']()
    , h = (f['relative_points'] = f['points']['map'](i => ({
      ...i
    })),
    {
      'steps': 10,
      'bevelEnabled': false,
      'extrudePath': h
    })
    , g = new THREE['ExtrudeGeometry'](g,h)
    , h = (g['translate'](-f['size']['x'] / 2 / units, f['size']['y'] / 2 / units, -f['size']['z'] / 2 / units),
    pp['three']['materials']['cabinet_path'])
    , f = (h['opacity'] = 0.2,
    new THREE['Mesh'](g,h));
    f['castShadow'] = false,
    f['receiveShadow'] = false,
    f['userData']['edgesModeType'] = ObjectType['Path'],
    f['visible'] = true,
    this['userData']['own_object']['add'](f);
  }
}
let def_cabinet_facade = _['merge'](copy_object(cabinet_def_common), {
  'type': 'facade',
  'spec': {
    'id': 0,
    'materials': {
      'gen': 0
    },
    'handle': {
      'enabled': 0,
      'id': 0,
      'active': 0,
      'fixed': 0,
      'group': 0,
      'orient': 'a',
      'a_orient': ['h', 'v'],
      'dir': 'l',
      'a_dir': ['l', 'r', 'b', 't'],
      'pos': {
        'x': 'a',
        'y': 'a'
      },
      'c_size': 0,
      'p_size': 0,
      'double': 0,
      'offset_mode': 'f',
      'offset': 25
    },
    'f_model': 0,
    'group': 'auto',
    'open': 'all',
    'type': 'full',
    'radius': 0,
    'side': 0,
    'role': ['kitchen'],
    'can_change': {
      'id': 1,
      'material': 1,
      'type': 1
    }
  },
  'size': {
    'x': 600,
    'y': 720,
    'z': 0
  }
})
, def_facade_no_lib = {};
class CabinetFacade extends CabinetSection {
  constructor(f={}, g={
    'root': null,
    'parent': null,
    'local_parent': null,
    'path': '0'
  }, h={
    'use_lib': true
  }) {
    super(f, g, h);
  }
  ['_before_params'](f, g, h) {
    this['userData']['class'] = this.constructor['name'],
    this['temp_type'] = this.constructor['name'],
    f['type'] || (f['type'] = 'facade'),
    f['events'] && f['events']['on_before_params'] && 'function' == typeof pp['events']['custom'][f['events']['on_before_params']] && pp['events']['custom'][f['events']['on_before_params']](f, g, h);
  }
  ['_before_build']() {
    var f = this['userData']['params'], g = this['userData']['computed'], h, h;
    this['userData']['item_id'] = f['spec']['id'],
    this['userData']['is_correct'] = 0,
    g['item'] = pp['libs']['facades']['get_item'](this['userData']['item_id']),
    g['type'] = 0,
    g['type_ind'] = 0,
    isNaN(parseInt(f['spec']['type'])) ? null != g['item']['compatibility_types'][f['spec']['type']] ? (h = g['item']['compatibility_types'][f['spec']['type']],
    g['type'] = g['item']['types'][h],
    g['type_ind'] = h) : (h = Object['keys'](g['item']['types'])[0],
    g['type'] = g['item']['types'][h],
    g['type_ind'] = h) : (g['type'] = g['item']['types'][f['spec']['type']],
    g['type_ind'] = f['spec']['type']),
    g['handle_offset'] = g['item']['handle_offset'],
    this['_get_handle_computed'](),
    g['model_loaded'] = 0;
  }
  ['_build_size']() {
    super['_build_size']();
    var f = this['userData']['computed'];
    void 0 === f['type']['thickness'] && (f['type']['thickness'] = 18),
    f['size']['z'] = Number(f['type']['thickness']),
    f['u_size']['z'] = f['size']['z'] / units;
  }
  async['_build_spec']() {
    var f = this['userData']['computed']
    , g = this['userData']['params'];
    if ('facade_profile' == f['handle_type']) {
      var h = f['handle_item']['sizes'][f['handle_size']]
      , h = parseFloat(h['height']) - parseFloat(h['offset_y'])
      , j = h / units / 2
      , k = g['spec']['handle']['dir'];
      if ('l' == k || 'r' == k) {
        f['size']['x'] -= h,
        f['u_size']['x'] = f['size']['x'] / units;
        let l = g['spec']['handle']['pos']['x']
        , m = g['spec']['handle']['pos']['y'];
        '$' == g['spec']['handle']['pos']['x'][0] && (l = g['spec']['handle']['pos']['x'][1]),
        '$' == g['spec']['handle']['pos']['y'][0] && (m = g['spec']['handle']['pos']['y'][1]),
        '@' == g['spec']['handle']['pos']['x'][0] && (l = pp['engine']['functions'][g['spec']['handle']['pos']['x']['substr'](1)](this)),
        '@' == g['spec']['handle']['pos']['y'][0] && (m = pp['engine']['functions'][g['spec']['handle']['pos']['y']['substr'](1)](this)),
        'l' == k ? this['userData']['own_object']['position']['x'] += j : this['userData']['own_object']['position']['x'] -= j;
      } else
      'b' == k && (g['spec']['handle']['pos']['y'] = 'b'),
      f['size']['y'] -= h,
      f['u_size']['y'] = f['size']['y'] / units,
      'b' == this['userData']['params']['spec']['handle']['pos']['y'] ? this['userData']['own_object']['position']['y'] += j : this['userData']['own_object']['position']['y'] -= j;
    }
    f['open'] = g['spec']['open'],
    f['group'] = g['spec']['group'],
    f['model'] = this['_get_model'](),
    this['_build_computed_materials'](),
    await this['_load_model'](f['model']),
    this['_build_handle'](),
    'edges' == global_options['mode'] && this['edges_mode']();
  }
  ['_get_model']() {
    if (0 != this['userData']['params']['spec']['f_model'])
    return this['userData']['params']['spec']['f_model'];
    var f = this['userData']['params']
    , g = this['userData']['computed']
    , h = g['type']['items']
    , j = g['size']
    , k = [];
    let l = null;
    var m = j['x']
    , q = j['y'];
    if (!g['type']['radius'] && f['spec']['radius'])
    return this['userData']['is_correct'] = 0,
    'radius_window' === f['spec']['type'] ? '/common_assets/models/facades/mdf_window_radius.fbx' : '/common_assets/models/facades/mdf_full_radius.fbx';
    let u = g['group'];
    'auto' == u && (u = this['userData']['root']['userData']['params']['spec']['cabinet_group']);
    for (let x = 0; x < h.length; x++)
    if (h[x]['group'] || (h[x]['group'] = 'all'),
    h[x]['open'] || (h[x]['open'] = 'all'),
    'all' != h[x]['group'] && h[x]['group'] != u || (h[x]['min_height'] = parseInt(h[x]['min_height']),
    0 === h[x]['min_height'] && k.push(h[x]),
    q >= h[x]['min_height'] && k.push(h[x])),
    k.length)
    for (let y = 0; y < k.length; y++) {
      var v = k[y]
      , w = k[y + 1];
      v['min_width'] = parseInt(v['min_width']),
      m >= v['min_width'] && (!w || (w['min_width'] = parseInt(w['min_width']),
      m <= w['min_width'])) && (l = v['model']);
    }
    return l ? (this['userData']['is_correct'] = 1,
    l) : (this['userData']['is_correct'] = 0,
    '/common_assets/models/no_model.fbx');
  }
  ['_build_computed_materials']() {
    let f = this['userData']['computed'];
    var g = this['userData']['params']
    , h = [];
    for (let i = 0; i < pp['libs']['glass']['categories_arr']; i++)
    h.push(pp['libs']['glass']['categories_arr'][i]['id']);
    f['meshes_list_by_material'] = {
      'gen': []
    },
    f['materials'] = {},
    f['materials'] = {
      'gen': {
        'categories': f['item']['materials'],
        'fixed': 0,
        'name': '',
        'lib': 'decors',
        'key': 'gen',
        'tex_axis': {
          'x': 'x',
          'y': 'y'
        },
        'mode': 2,
        'selected': g['spec']['materials']['gen']
      }
    };
    var g = f['item']['additional_materials'];
    Object['values'](g)['forEach'](j => {
      f['materials'][j['key']] = {
        'categories': j['materials'],
        'fixed': j['fixed'],
        'lib': 'decors',
        'name': j['name'],
        'key': j['key'],
        'tex_axis': {
          'x': 'x',
          'y': 'y'
        },
        'mode': 2,
        'selected': j['selected']
      },
      f['meshes_list_by_material'][j['key']] = [];
    }
    );
  }
  ['_apply_materials'](f={}, g=[], h=false) {
    var j = this['userData']['params']
    , k = this['userData']['computed']
    , l = k['materials'];
    if (h || j['spec']['can_change']?.['material']) {
      if (0 == this['userData']['is_correct']) {
        for (let q = 0; q < k['meshes_list']['length']; q++)
        k['meshes_list'][q]['mesh']['material'] = pp['engine']['materials']['incorrect_mat'];
      } else
      for (let u = 0; u < k['meshes_list']['length']; u++) {
        let v = k['meshes_list'][u]['params']['m'];
        var m = k['meshes_list'][u]['mesh'];
        let w;
        if (l[v]) {
          var n = l[v];
          let x;
          switch ('' + n['mode']) {
            case '0':
            x = copy_object(n['params']);
            break;
            case '1':
            x = pp['libs'][n['lib']]['get_item'](n['selected']);
            break;
            case '2':
            x = pp['libs'][n['lib']]['get_item'](n['selected']);
            break;
            case '3':
            x = pp['libs']['materials'][n['p_sel']]['get_item'](n['p_mat'])['params']['mat_params'];
            break;
            case '4':
            break;
          }
          x ? (x['add_params']['model_width'] = k['size'][n['tex_axis']['x']],
          x['add_params']['model_height'] = k['size'][n['tex_axis']['y']]) : x = pp['libs']['decors']['get_item'](0),
          w = create_material(x);
        } else
        bim_arr.forEach(y => {
          -1 < v['indexOf'](y) && 'pat' != v && (w = 'function' == typeof bim_keys[y] ? bim_keys[y](this, v) : bim_keys[y]);
        }
        ),
        w = w || create_material(pp['libs']['decors']['get_item'](0));
        m['material'] = w;
      }
    }
  }
  ['_get_handle_computed']() {
    var f = this['userData']['computed']
    , g = this['userData']['params'];
    f['has_handle'] = 0,
    f['handle_item'] = null,
    f['handle_size'] = 0,
    f['handle_type'] = 'common',
    1 == f['item']['handle'] && 1 == g['spec']['handle']['enabled'] && 1 == g['spec']['handle']['active'] && (f['has_handle'] = 1,
    this['userData']['add_params']['use_lib']) && (f['handle_item'] = pp['libs']['handles']['get_item'](g['spec']['handle']['id']),
    f['handle_type'] = f['handle_item']['type']);
  }
  ['_get_handle_size']() {
    var f = this['userData']['params']
    , g = this['userData']['computed'];
    let h = f['spec']['handle']['p_size'];
    var j = g['handle_item']
    , k = (h > j['sizes']['length'] - 1 && (h = j['sizes']['length'] - 1),
    parseInt(j['sizes'][h]['width']))
    , l = 'h' == f['spec']['handle']['orient'] ? g['size']['x'] : g['size']['y'];
    if (l < k) {
      for (let m = h; m--; )
      if (parseInt(j['sizes'][m]['width']) <= l) {
        h = m;
        break;
      }
    } else
    h = f['spec']['handle']['p_size'];
    return f['spec']['handle']['c_size'] = h;
  }
  ['_build_handle']() {
    var f = this['userData']['computed'];
    if (0 != f['has_handle']) {
      this['userData']['handle'] && (this['userData']['handle']['_reset'](this['userData']['handle']['userData']['own_object']),
      this['userData']['own_object']['remove'](this['userData']['handle'])),
      delete this['userData']['handle_holes'];
      var g = this['userData']['params']
      , h = copy_object(def_cabinet_handle)
      , j = (f['handle_size'] = this['_get_handle_size'](),
      h['spec']['id'] = f['handle_item']['id'],
      h['spec']['size_index'] = f['handle_size'],
      h['pos']['z'] = 's.z',
      f['handle_type'])
      , k = f['handle_offset']
      , f = f['handle_item']['sizes'][f['handle_size']];
      let m = g['spec']['handle']['pos']['x']
      , n = g['spec']['handle']['pos']['y']
      , q = ('$' == g['spec']['handle']['pos']['x'][0] && (m = g['spec']['handle']['pos']['x'][1]),
      '$' == g['spec']['handle']['pos']['y'][0] && (n = g['spec']['handle']['pos']['y'][1]),
      '@' == g['spec']['handle']['pos']['x'][0] && (m = pp['engine']['functions'][g['spec']['handle']['pos']['x']['substr'](1)](this)),
      '@' == g['spec']['handle']['pos']['y'][0] && (n = pp['engine']['functions'][g['spec']['handle']['pos']['y']['substr'](1)](this)),
      0);
      var l = 0
      , k = ('facade_profile' == j && (q = parseFloat(f['offset_y']),
      h['spec']['dir'] = g['spec']['handle']['dir']),
      'overhead' == j && (h['spec']['dir'] = g['spec']['handle']['dir']),
      {
        'common': {
          'x': {
            'l': {
              'pivot': {
                'x': -1
              },
              'pos': {
                'x': k
              }
            },
            'c': {
              'pivot': {
                'x': 0
              },
              'pos': {
                'x': 's:x\x20/\x202'
              }
            },
            'r': {
              'pivot': {
                'x': 1
              },
              'pos': {
                'x': 's:x\x20-\x20' + k
              }
            }
          },
          'y': {
            'b': {
              'pivot': {
                'y': -1
              },
              'pos': {
                'y': k
              }
            },
            'c': {
              'pivot': {
                'y': 0
              },
              'pos': {
                'y': 's:y\x20/\x202'
              }
            },
            't': {
              'pivot': {
                'y': 1
              },
              'pos': {
                'y': 's:y\x20\x20-\x20' + k
              }
            }
          },
          'z': {
            'pivot': -1,
            'pos': 's.z'
          }
        },
        'gola': {
          'x': {
            'l': {
              'pivot': {
                'x': -1
              },
              'pos': {
                'x': k
              }
            },
            'c': {
              'pivot': {
                'x': 0
              },
              'pos': {
                'x': 's:x\x20/\x202'
              }
            },
            'r': {
              'pivot': {
                'x': 1
              },
              'pos': {
                'x': 's:x\x20-\x20' + k
              }
            }
          },
          'y': {
            'b': {
              'pivot': {
                'y': -1
              },
              'pos': {
                'y': k
              }
            },
            'c': {
              'pivot': {
                'y': 0
              },
              'pos': {
                'y': 's:y\x20/\x202'
              }
            },
            't': {
              'pivot': {
                'y': 1
              },
              'pos': {
                'y': 's:y\x20\x20-\x20' + k
              }
            }
          },
          'z': {
            'pivot': -1,
            'pos': 's.z'
          }
        },
        'overhead': {
          'x': {
            'l': {
              'pivot': {
                'x': 0
              },
              'pos': {
                'x': 's:x\x20/\x202'
              }
            },
            'c': {
              'pivot': {
                'x': 0
              },
              'pos': {
                'x': 's:x\x20/\x202'
              }
            },
            'r': {
              'pivot': {
                'x': 0
              },
              'pos': {
                'x': 's:x\x20/\x202'
              }
            }
          },
          'y': {
            'b': {
              'pivot': {
                'y': 0
              },
              'pos': {
                'y': 0
              }
            },
            'c': {
              'pivot': {
                'y': 0
              },
              'pos': {
                'y': 's:y\x20/\x202'
              }
            },
            't': {
              'pivot': {
                'y': 0
              },
              'pos': {
                'y': 's:y'
              }
            }
          },
          'z': {
            'pivot': 1,
            'pos': 's.z'
          }
        },
        'facade_profile': {
          'x': {
            'l': {
              'pivot': {
                'x': 0
              },
              'pos': {
                'x': q
              }
            },
            'c': {
              'pivot': {
                'x': 0
              },
              'pos': {
                'x': 's:x\x20/\x202'
              }
            },
            'r': {
              'pivot': {
                'x': 0
              },
              'pos': {
                'x': 's:x\x20-\x20' + q
              }
            }
          },
          'y': {
            'b': {
              'pivot': {
                'y': 0
              },
              'pos': {
                'y': q
              }
            },
            'c': {
              'pivot': {
                'y': 0
              },
              'pos': {
                'y': 's:y\x20/\x202'
              }
            },
            't': {
              'pivot': {
                'y': 0
              },
              'pos': {
                'y': 's:y\x20-\x20' + q
              }
            }
          },
          'z': {
            'pivot': -1,
            'pos': 0
          }
        }
      });
      if ('common' != j && 'gola' != j || (h['spec']['orient'] = g['spec']['handle']['orient']),
      'a' == m && (m = 'r'),
      'a' == n && (n = 'b'),
      'facade_profile' == j)
      switch (h['spec']['dir']) {
        case 'l':
        n = 'c';
        break;
        case 'r':
        n = 'c';
        break;
        case 'b':
        m = 'c';
        break;
        case 't':
        m = 'c';
        break;
      }
      h['pos']['x'] = k[j]['x'][m]['pos']['x'],
      h['pivot']['x'] = k[j]['x'][m]['pivot']['x'],
      h['pos']['y'] = k[j]['y'][n]['pos']['y'],
      h['pivot']['y'] = k[j]['y'][n]['pivot']['y'],
      h['pos']['z'] = k[j]['z']['pos'],
      h['pivot']['z'] = k[j]['z']['pivot'],
      h['size'] = {
        'x': f['width'],
        'y': f['height'],
        'z': f['depth']
      };
      var g = new CabinetHandle(h,{
        'parent': this,
        'local_parent': this,
        'root': this['userData']['root'],
        'path': this['userData']['path'] + ',0',
        'variables': {}
      },{
        'use_lib': true,
        'params': {},
        'material': {}
      });
      this['userData']['handle'] = g,
      this['userData']['own_object']['add'](g),
      this['add_handle_holes']();
    }
  }
  ['add_handle_holes']() {
    var f = this['userData']['computed'], g = f['handle_item']['type_params'], h = this['userData']['handle']?.['userData']['params'], j = this['userData']['handle']?.['userData']['computed'], k, l, h, h, m, m, m, g;
    function n(q, u, v=false) {
      return u ? q < 0 ? v ? '\x20-\x20' + u : '\x20+\x20' + u : 0 < q ? v ? '\x20+\x20' + u : '\x20-\x20' + u : '' : '';
    }
    h && 'common' === f['handle_item']?.['type'] && g && void 0 !== g['diameter'] && void 0 !== g['double'] && (l = 'v' === h['spec']['orient'] ? 'y' : 'x',
    h = merge(copy_object(pp['engine']['item_def_params']['furniture']), {
      'size': {
        'x': 0,
        'y': 0,
        'z': 0
      },
      'pos': {
        'x': '' + h['pos']['x'] + n(h['pivot']['x'], j['size']['x'] + '\x20/\x202'),
        'y': '' + h['pos']['y'] + n(h['pivot']['y'], j['size']['y'] + '\x20/\x202'),
        'z': 0
      },
      'children': []
    }),
    h = new CabinetFurniture(h,{
      'root': this['userData']['root'],
      'parent': this,
      'local_parent': this,
      'path': this['userData']['path'] + ',1'
    }),
    this['userData']['own_object']['add'](h),
    this['userData']['handle_holes'] = h,
    m = merge(copy_object(pp['engine']['item_def_params']['hole']), {
      'spec': {
        'orientation': 'f',
        'global': 1,
        'direction': 'z'
      },
      'size': {
        'x': g['diameter'],
        'y': 0,
        'z': f['size']['z']
      },
      'pos': {
        'x': 0,
        'y': 0,
        'z': 0
      }
    }),
    g['double'] && (m['pos'][l] = -parseFloat(j['model_size']['axis_size']) / 2),
    m = new CabinetHole(m,{
      'root': this['userData']['root'],
      'parent': h,
      'local_parent': this,
      'path': this['userData']['path'] + ',1,0'
    }),
    h['userData']['own_object']['add'](m),
    g['double']) && ((m = merge(copy_object(pp['engine']['item_def_params']['hole']), {
      'spec': {
        'orientation': 'f',
        'global': 1,
        'direction': 'z'
      },
      'size': {
        'x': g['diameter'],
        'y': 0,
        'z': f['size']['z']
      },
      'pos': {
        'x': 0,
        'y': 0,
        'z': 0
      }
    }))['pos'][l] = parseFloat(j['model_size']['axis_size']) / 2,
    g = new CabinetHole(m,{
      'root': this['userData']['root'],
      'parent': h,
      'local_parent': this,
      'path': this['userData']['path'] + ',1,1'
    }),
    h['userData']['own_object']['add'](g));
  }
  ['_change_handle'](f, g) {
    if (!constructor_settings['core_v2'] || this['userData']['params']['spec']['can_change']?.['id']) {
      var h = this['userData']['computed'];
      if (0 != h['has_handle'] && (h['handle_item']['id'] != f || h['handle_size'] != g)) {
        var g = pp['libs']['handles']['items'][f], h = h['handle_item'], j;
        this['userData']['params']['spec']['handle']['id'] = f;
        let k = false;
        'facade_profile' != g['type'] && 'facade_profile' != h['type'] || (k = true),
        this['_get_handle_computed'](),
        k ? this['_rebuild']() : this['_build_handle']();
      }
    }
  }
  ['_change_handle_orientation'](f) {
    if (!constructor_settings['core_v2'] || this['userData']['params']['spec']['can_change']?.['id']) {
      var g, h = this['userData']['computed']['handle_item'], j;
      this['userData']['params']['spec']['handle']['orient'] = f;
      let k = false;
      'facade_profile' != h['type'] && 'facade_profile' != h['type'] || (k = true),
      this['_get_handle_computed'](),
      k ? this['_rebuild']() : this['_build_handle']();
    }
  }
  ['_change_material'](f='gen', g) {
    var h = this['userData']['root']
    , i = this['userData']['params'];
    module_utils['change_param_by_path'](h, this['userData']['path'], 'spec.materials.' + f, g),
    i['spec']['materials'][f] = g,
    this['_build_computed_materials'](),
    this['_apply_materials']();
  }
  async['_after_build']() {
    'edges' == global_options['mode'] && this['edges_mode'](),
    this['updateMatrixWorld'](true),
    await this['_wait_children_ready'](),
    this['_on_after_build'] = async f => {
      f['updateWorldMatrix'](true, true),
      await f['_update_evaluate']();
    }
    ,
    await this['_on_after_build']?.(this);
  }
  ['_wait_children_ready']() {
    return new Promise(e => {
      let f = () => {
        var g;
        if (1 !== this['userData']['computed']['model_loaded'])
        return requestAnimationFrame(f);
        e();
      }
      ;
      f();
    }
    );
  }
  ['edges_mode']() {
    PPObject['prototype']['edges_mode_traverse']['call'](this, this['userData']['own_object'], true);
    for (let f = 0; f < this['userData']['children']['length']; f++)
    'function' == typeof this['userData']['children'][f]['edges_mode'] && this['userData']['children'][f]['edges_mode']();
  }
  ['_get_specs'](j) {
    var k = this, q = pp['events']?.['cabinet']?.['before_create_spec_item'], A = pp['events']?.['cabinet']?.['after_create_spec_item'], B = this['userData']['params'], C = this['userData']['computed'], E;
    if ((j = j || {
      'all': {},
      'sum': {},
      'sum_arr': [],
      'aggr_funcs': {}
    },
    q) && false === q(B['type'], this, j))
    return j;
    if (this['_get_specs_accessories'](j),
    !is_empty_id(B['spec']['id'])) {
      let a0 = module_utils['get_price_mod']('facade');
      var F = C['materials']['gen']['selected']
      , G = pp['libs']['decors']['find_item'](F)
      , H = C['item']['prices']?.[C['type_ind']]?.[G['category']]?.['price']
      , I = parse_num(C['item']['prices_edge']?.[C['type_ind']]?.[G['category']]?.['price']);
      let a1 = C['item']['prices_fixed']?.['mat_codes']?.[G['code']]?.[C['type_ind']]?.[Math['round'](C['size']['x']) + '_' + Math['round'](C['size']['y'])];
      a1 = a1 || C['item']['prices_fixed']?.['mat_codes']?.['__all']?.[C['type_ind']]?.[Math['round'](C['size']['x']) + '_' + Math['round'](C['size']['y'])];
      var J = {
        'type': 'facade'
      }, K, L;
      if (J['id'] = C['item']['id'],
      J['name'] = C['item']['name'],
      J['code'] = C['item']['code'] || '',
      J['material_id'] = F,
      J['mat_name'] = G['name'],
      J['mat_code'] = G['code'],
      J['size'] = C['size'],
      J['width'] = C['size']['x'],
      J['height'] = C['size']['y'],
      J['size_x'] = C['size']['x'],
      J['size_z'] = C['size']['y'],
      J['type_ind'] = C['type_ind'],
      J['fac_type'] = C['type'],
      J['price_type'] = 'm2',
      J['count'] = 1,
      J['show_size'] = 0,
      J['price'] = parse_num(H) * a0,
      J['sum_key'] = C['item']['id'] + ('_' + F + '_') + C['type_ind'],
      a1 && (J['show_size'] = 1,
      J['price_type'] = 'p',
      J['name'] = a1['name'] || '',
      J['code'] = a1['code'] || '',
      J['price'] = parse_num(a1['price']) * a0,
      J['sum_key'] += '_' + C['size']['x'] + '_' + C['size']['y'] + '_' + J['code']),
      A) {
        if (false === A(B['type'], this, j, J))
        return j;
      }
      if (module_utils['add_spec_to_context'](j, J),
      C['item']['accessories']?.['length']) {
        var N = C['item']['accessories'];
        if (N)
        for (let a2 = 0; a2 < N.length; a2++) {
          var O = N[a2], P = O['id'], O = O['count'], Q;
          if (q) {
            if (false === q('item', k, j))
            continue;
          }
          var P = accsessories_data['get_item'](P), R;
          if (P) {
            let a3 = module_utils['get_price_mod']('acc', null, P['category']);
            if (P['count'] = parse_int(O),
            P['price_type'] = 'p',
            P['type'] = 'item',
            P['price'] = parse_num(P['price_per_piece']) * a3,
            P['sum_key'] = P['id'] + '_' + P['code'] + '_' + P['price_type'],
            A) {
              if (false === A('item', k, j, P))
              continue;
            }
            module_utils['add_spec_to_context'](j, P);
          }
        }
      }
      if (C['has_handle'] && C['handle_item']) {
        var H = C['handle_item']['sizes']?.[C['handle_size']], S;
        if (q) {
          if (false === q('handle', this, j))
          return j;
        }
        let a4 = C['handle_item']['name'] || C['handle_item']['id'] || '';
        if (H?.['axis_size'] && (a4 && (a4 += '\x20'),
        a4 += '\x20(' + H['axis_size'] + ')'),
        H) {
          let a5 = module_utils['get_price_mod']();
          var B = {
            'type': 'item',
            'name': a4,
            'code': H['code'] || '',
            'handle_id': C['handle_item']['id'],
            'handle_size': C['handle_size'],
            'axis_size': H['axis_size'] || '',
            'category': '',
            'label': H['code'] + '\x20' + C['handle_item']['name'],
            'price_per_piece': parse_num(H['price']),
            'count': 1,
            'price_type': 'p'
          }, T;
          if (B['price'] = parse_num(B['price_per_piece']) * a5,
          B['sum_key'] = 'h' + B['handle_id'] + '_' + C['handle_size'] + '_' + B['code'] + '_' + B['price_type'],
          A) {
            if (false === A('handle', this, j, B))
            return j;
          }
          module_utils['add_spec_to_context'](j, B);
        }
      }
      if (I)
      for (let a6 = 0; a6 < 4; a6++) {
        if (q) {
          if (false === q('butts_facade', this, j))
          continue;
        }
        let a7 = module_utils['get_price_mod']('butt');
        var U = C['item']['id'] + '_' + F, W = {
          'type': 'butts_facade'
        }, Z;
        if (W['facade_name'] = J['name'],
        W['mat_name'] = G['name'],
        W['sum_key'] = U,
        W['price'] = I * a7,
        W['price_type'] = 'm',
        W['size_x'] = parse_num(a6 % 2 == 0 ? C['size']['x'] : C['size']['y']),
        A) {
          if (false === A('butts_facade', this, j, W))
          continue;
        }
        module_utils['add_spec_to_context'](j, W);
      }
    }
    return j;
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
        for (let u = 0; u < k.length; u++)
        q(f, k[u]);
      }
    }
    if (this['userData']['params']['accessories_default']) {
      var l = this['userData']['params']['accessories_default'];
      if (l) {
        for (let v = 0; v < l.length; v++)
        q(f, l[v]);
      }
    }
    if (this['userData']['params']['spec']['variants'] && this['userData']['params']['spec']['variants'][this['userData']['params']['spec']['selected_variant']]) {
      var m = this['userData']['params']['spec']['variants'][this['userData']['params']['spec']['selected_variant']]['accessories'];
      if (m) {
        for (let w = 0; w < m.length; w++)
        q(f, m[w]);
      }
    }
    if (this['userData']['params']['spec']['template'] && this['userData']['params']['spec']['template']['accessories']) {
      var n = this['userData']['params']['spec']['template']['accessories'];
      for (let x = 0; x < n.length; x++)
      q(f, n[x]);
    }
    return f;
    function q(y, z) {
      var A = z['id'], z = z['count'], B;
      if (h && false === h('item', g, y))
      return;
      var A = accsessories_data['get_item'](A);
      if (A) {
        var C = module_utils['get_price_mod']('acc', null, A['category']), D;
        if (A['count'] = parse_int(z),
        A['price_type'] = 'p',
        A['type'] = 'item',
        A['price'] = parse_num(A['price_per_piece']) * C,
        A['sum_key'] = A['id'] + '_' + A['code'] + '_' + A['price_type'],
        j) {
          if (false === j('item', g, y, A))
          return;
        }
        module_utils['add_spec_to_context'](y, A);
      }
    }
  }
  ['_change_glass_material'](f) {}
}
let def_cabinet_fill_section = _['merge'](copy_object(cabinet_def_common), {
  'type': 'fill_section',
  'spec': {
    'show_sizes': 0,
    'replace': 0,
    'step_axes': {
      'x': 1,
      'y': 1,
      'z': 1
    },
    'invert': {
      'x': 0,
      'y': 0,
      'z': 0
    }
  },
  'fill': {}
});
class CabinetFillSection extends CabinetSection {
  constructor(f={}, g={}, h={}) {
    super(f, g, h);
  }
  ['_before_params'](f, g, h) {
    if (this['userData']['class'] = this.constructor['name'],
    this['temp_type'] = this.constructor['name'],
    f['type'] || (f['type'] = 'fill_section'),
    f['section_key'] || (f['section_key'] = new Date()['getTime']() + Math['random']()['toString'](36)['substr'](2, 9)),
    f['spec']['replace'] && 0 < f['children']['length']) {
      var i = f['children']['map']( (j, k) => 'module' === j['type'] ? k : -1)['filter'](j => -1 !== j);
      if (1 < i.length) {
        let j = i[i.length - 1];
        f['children'] = f['children']['filter']( (k, l) => 'module' !== k['type'] || l === j);
      }
    }
    pp['events']['fill_section']['before_params'] && pp['events']['fill_section']['before_params'](this, f, g, h);
  }
  ['_build_children']() {
    pp['events']['fill_section']['before_build_children'] && pp['events']['fill_section']['before_build_children'](this),
    super['_build_children']();
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
    this['drag_area'] && (this['drag_area']['visible'] = false,
    this['userData']['own_object']['remove'](this['drag_area']),
    this['drag_area']['dispose']());
  }
  ['_after_build']() {}
  ['_build_sizes']() {
    var f = this['userData']['params']
    , g = this['userData']['computed']
    , h = this['userData']['children']
    , i = g['size']
    , g = this['userData']['root'];
    g && g['userData']['params']['spec']['hide_sizes'];
  }
}
function sizes_obj_paths(f) {
  var g = f['userData']['computed']
  , h = f['userData']['children'];
  let j = g['size']
  , k = ['x', 'y', 'z']
  , m = {
    'x': [],
    'y': [],
    'z': []
  };
  var p = [];
  if (0 < h.length)
  for (let v = 0; v < h.length; v++) {
    var q = h[v], u;
    q instanceof Module && (q['_drag_element'] || ((u = new THREE['Vector3']())['x'] = q['userData']['params']['spec']['fill_size_x'] || 0,
    u['y'] = q['userData']['params']['spec']['fill_size_y'] || 0,
    u['z'] = q['userData']['params']['spec']['fill_size_z'] || 0,
    p.push({
      'size': q['userData']['computed']['size'],
      'pos': q['userData']['computed']['pos'],
      'fill_size': u,
      'path': q['userData']['path']
    })));
  }
  return p.forEach(w => {
    k.forEach(x => {
      var y, z;
      0 === w['fill_size'][x] && (y = w['pos'][x],
      z = w['pos'][x] + w['size'][x],
      m[x]['push']({
        'path': w['path'] || '',
        'axis': x,
        'pos': w['pos'][x],
        'size': w['size'][x],
        'min': y,
        'max': z,
        'prev': null,
        'next': null
      }));
    }
    );
  }
  ),
  k.forEach(w => {
    var x = m[w]['sort']( (A, B) => A['pos'] - B['pos']);
    for (let A = 0; A < x.length; A++) {
      var y = x[A], z;
      0 === A && (y['prev'] = y['min']),
      A === x.length - 1 ? y['next'] = j[w] - y['max'] : (z = x[A + 1])['min'] >= y['max'] ? y['next'] = z['min'] - y['max'] : y['next'] = 0;
    }
    m[w] = x.filter(B => 0 <= B['prev'] && 0 <= B['next']);
  }
  ),
  m;
}
let def_cabinet_furniture = _['merge'](copy_object(cabinet_def_common), {
  'type': 'furniture',
  'spec': {
    'name': '',
    'code': '',
    'group': 'furniture',
    'show_in_spec': 1,
    'type': 'common',
    'type_params': {},
    'setup_type': null,
    'plane': '',
    'key': '',
    'material': {
      'id': '1'
    }
  },
  'price_type': 'p',
  'price_mode': 'c',
  'size': {
    'x': 0,
    'y': 0,
    'z': 0
  }
});
class CabinetFurniture extends CabinetSection {
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
    f['type'] || (f['type'] = 'furniture');
    var j = f['spec'] && f['spec']['id'] && pp['libs']['furniture'], k = f['spec'] && parseFloat(f['id']) && pp['libs']['furniture'], j;
    let l = 0
    , m = null;
    j && (m = pp['libs']['furniture']['find_item'](f['spec']['id']),
    l = f['spec']['id']),
    !j && k && (m = pp['libs']['furniture']['find_item'](parseFloat(f['id'])),
    l = parseFloat(f['id'])),
    m && (j = merge(copy_object(m['params']), {
      'name': m['name'],
      'code': m['code'],
      'size': m['size'] ? copy_object(m['size']) : void 0,
      'children': m['children'] ? copy_object(m['children']) : []
    }),
    f['spec']['id'] = l,
    j['size'] && (f['size'] = j['size']),
    j['children'] && (f['children'] = j['children']),
    fill_defaults(f, j, copy_object(pp['engine']['item_def_params'][f['type']])));
  }
  ['_before_build']() {
    var f = this['userData']['params'], g = this['userData']['computed'], h, j = this['userData']['root']['userData']['computed'];
    this['params'] = this['userData']['params'],
    g['key'] = this['userData']['params']['spec']['key'] || f['spec']['code'],
    view_mode || (g['item'] = pp['libs']['furniture']['find_item'](this['userData']['params']['spec']['id']),
    g['show_in_spec'] = null == g['item']['params']['spec']['show_in_spec'] ? 1 : g['item']['params']['spec']['show_in_spec']);
  }
  ['_build_size']() {
    var f = this['userData']['computed']
    , g = this['userData']['params']
    , h = f['c_object'];
    f['size']['x'] = comp2(g['size']['x'], h),
    f['size']['y'] = comp2(g['size']['y'] || 0, h),
    f['size']['z'] = comp2(g['size']['z'], h),
    f['u_size'] = f['size']['clone']()['divideScalar'](units);
  }
  ['_get_specs'](f) {
    var g = pp['events']?.['cabinet']?.['before_create_spec_item'], h = pp['events']?.['cabinet']?.['after_create_spec_item'], j = this['userData']['computed'], k = this['userData']['params'], l;
    if ((f = f || {
      'all': {},
      'sum': {},
      'sum_arr': [],
      'aggr_funcs': {}
    },
    g) && false === g(k['type'], this, f))
    return f;
    if (!is_empty_id(k['spec']['id']) && 0 != j['show_in_spec']) {
      if ('c' == k['price_mode'] || 'a' == k['price_mode']) {
        var g = 'c' == k['price_mode'] ? accsessories_data['get_item_by_code'](k['code']) : accsessories_data['get_item'](k['acc_id']);
        if (g) {
          var m = module_utils['get_price_mod']('acc', null, g['category']), n;
          if (g['count'] = 1,
          g['price_type'] = k['price_type'],
          g['type'] = 'item',
          g['name'] = g['name'] || j['item']['name'],
          g['sum_key'] = g['id'] + '_' + g['code'] + '_' + g['price_type'],
          g['price'] = parse_num(g['price_per_piece']) * m,
          h) {
            if (false === h(k['type'], this, f, g))
            return f;
          }
          module_utils['add_spec_to_context'](f, g);
        }
      } else {
        var m = module_utils['get_price_mod']('acc'), g = {
          'id': k['spec']['id'],
          'type': 'item',
          'name': j['item']['name'],
          'code': j['item']['code'],
          'category': '',
          'label': j['item']['code'] + '\x20' + j['item']['name'],
          'price_per_piece': k['price'],
          'count': 1,
          'price_type': k['price_type']
        }, o;
        if (g['price'] = parse_num(g['price_per_piece']) * m,
        g['sum_key'] = g['id'] + ('_' + g['code'] + '_') + g['price_type'],
        h) {
          if (false === h(k['type'], this, f, g))
          return f;
        }
        module_utils['add_spec_to_context'](f, g);
      }
    }
    return f;
  }
}
let def_cabinet_handle = _['merge'](copy_object(cabinet_def_common), {
  'type': 'handle',
  'spec': {
    'id': 1,
    'size_index': 0,
    'orient': 'v',
    'a_orient': ['h', 'v'],
    'dir': 'l',
    'a_dir': ['l', 'r', 'b', 't'],
    'own': 1,
    'change_mode': 'n',
    'change_arr': []
  }
})
, def_handle_no_lib = {};
class CabinetHandle extends CabinetSection {
  constructor(f={}, g={
    'root': null,
    'parent': null,
    'local_parent': null,
    'path': '0'
  }, h={
    'use_lib': 1
  }) {
    super(f, g, h);
  }
  ['_before_params'](f, g, h) {
    this['userData']['class'] = this.constructor['name'],
    this['userData']['desc'] = {},
    this['temp_type'] = this.constructor['name'],
    f['type'] || (f['type'] = 'handle');
  }
  ['_before_build']() {
    var f = this['userData']['params']
    , g = this['userData']['computed']
    , f = (this['userData']['item_id'] = f['spec']['id'],
    this['userData']['add_params']['use_lib'] && (g['item'] = pp['libs']['handles']['get_item'](this['userData']['item_id'])),
    this['userData']['computed']['item'])
    , h = f['sizes'];
    let i = this['userData']['params']['spec']['size_index'];
    h[i] || (i = 0),
    g['model'] = f['model'],
    g['model_size'] = h[i],
    this['_build_computed_materials'](),
    g['model_loaded'] = 0;
  }
  async['_build_spec']() {
    this['_get_model'](),
    await this['_load_model']();
    var f = this['userData']['computed']['item']
    , g = this['userData']['own_object']
    , h = this['userData']['params'];
    'common' == f['type'] && 'v' == h['spec']['orient'] && g['rotateZ'](-deg2rad(90)),
    'facade_profile' == f['type'] && ('l' == h['spec']['dir'] && g['rotateZ'](deg2rad(90)),
    'r' == h['spec']['dir'] && g['rotateZ'](-deg2rad(90)),
    'b' == h['spec']['dir']) && g['rotateZ'](deg2rad(180)),
    'overhead' == f['type'] && 'b' == h['spec']['dir'] && g['rotateZ'](deg2rad(180));
  }
  ['_build_size']() {
    var f = this['userData']['computed']['item']
    , g = this['userData']['computed']['model_size']
    , h = this['userData']['params']['spec']['orient']
    , j = this['userData']['params']['spec']['dir']
    , k = this['userData']['computed']
    , l = this['userData']['params'];
    'common' === f['type'] && (l['size']['x'] = Number(g['width']),
    l['size']['y'] = Number(g['height']),
    l['size']['z'] = Number(g['depth']),
    'v' == h) && (l['size']['y'] = Number(g['width']),
    l['size']['x'] = Number(g['height'])),
    'facade_profile' === f['type'] && (l['size']['x'] = 's:x',
    l['size']['x'] = 't' == j || 'b' == j ? 's:x' : 's:y',
    l['size']['y'] = Number(g['height']),
    l['size']['z'] = Number(g['depth'])),
    super['_build_size']();
  }
  async['_load_model']() {
    var f = this['userData']['computed']
    , g = f['model']
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
      f['meshes_list_by_material'][m]['push'](k),
      this['userData']['own_object']['add'](k);
    }
    this['_apply_materials'](),
    this['_set_model3d_size'](g),
    f['model_loaded'] = 1;
  }
  ['_get_model']() {}
  ['_apply_materials']() {
    let f = this['userData']['computed'];
    var g = f['materials'];
    for (let k = 0; k < f['meshes_list']['length']; k++) {
      let l = this['userData']['computed']
      , m = l['meshes_list'][k]['mat_key'];
      var h = l['meshes_list'][k]['mesh'];
      let n;
      if (g[m]) {
        var j = g[m];
        let o;
        switch (j['mode']) {
          case 'i':
          o = pp['libs']['decors']['get_item'](j['selected']);
          break;
          case 'm':
          break;
          case 'c':
          o = pp['libs']['decors']['get_item'](j['selected']);
          break;
          case 'v':
          o = copy_object(g[m]['params']);
          break;
          case 'f':
          break;
        }
        o ? (o['add_params']['model_width'] = l['size'][j['tex_axis']['x']],
        o['add_params']['model_height'] = l['size'][j['tex_axis']['y']]) : o = pp['libs']['decors']['get_item'](0),
        n = create_material(o);
      } else
      bim_arr.forEach(p => {
        -1 < m['indexOf'](p) && 'pat' != m && (n = 'function' == typeof bim_keys[p] ? bim_keys[p](this, m) : bim_keys[p]);
      }
      ),
      n = n || create_material(pp['libs']['decors']['get_item'](0));
      h['material'] = n;
    }
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
        'mode': 'v',
        'params': f['item']['material']
      }
    };
  }
  ['_set_model3d_size'](f) {
    var g = this['userData']['own_object']
    , h = this['userData']['params']
    , j = this['userData']['computed']['size']
    , k = this['userData']['computed']['u_size']
    , n = this['userData']['computed']['item']
    , p = g['rotation']['clone']()
    , q = (scene['add'](g),
    g['rotation']['set'](0, 0, 0),
    new THREE['Vector3'](j['x'],j['y'],j['z']))
    , u = box3['setFromObject'](g)['getSize'](new THREE['Vector3']())
    , v = ('common' === n['type'] && 'v' == h['spec']['orient'] && (q['x'] = j['y'],
    q['y'] = j['x']),
    'facade_profile' === n['type'] && 'l' != h['spec']['dir'] && h['spec']['dir'],
    {
      'box': u['clone'](),
      'diff': new THREE['Vector3'](q['x'] / units,q['y'] / units,q['z'] / units)['sub'](u)['divideScalar'](2),
      'size': q['divideScalar'](units)
    });
    for (let w = 0; w < g['children']['length']; w++)
    set_size_buff(g['children'][w], g['children'][w]['name'], v),
    correct_uv_buff(Model_utils['get_model_from_cache'](f)['geometry'][w], g['children'][w]['geometry']);
    this['add'](g),
    g['rotation']['copy'](p);
  }
}
let def_cabinet_hinge = _['merge'](copy_object(cabinet_def_common), {
  'type': 'hinge',
  'spec': {
    'id': 0,
    'type': 'common',
    'role': ['kitchen']
  },
  'size': {
    'x': 600,
    'y': 720,
    'z': 0
  }
})
, def_hinge_no_lib = {};
class CabinetHinge extends CabinetSection {
  constructor(f={}, g={
    'root': null,
    'parent': null,
    'local_parent': null,
    'path': '0'
  }, h={
    'use_lib': true
  }) {
    super(f, g, h);
  }
  ['_before_params'](f, g, h) {
    this['userData']['class'] = this.constructor['name'],
    this['temp_type'] = this.constructor['name'],
    f['type'] || (f['type'] = 'hinge');
  }
  ['_before_build']() {
    var f = this['userData']['params'], g = this['userData']['computed'], h, h;
    this['userData']['item_id'] = f['spec']['id'],
    this['userData']['add_params']['use_lib'] && (g['item'] = pp['libs']['facades']['get_item'](this['userData']['item_id']),
    g['type'] = 0,
    isNaN(parseInt(f['spec']['type'])) ? null != g['item']['compatibility_types'][f['spec']['type']] ? (h = g['item']['compatibility_types'][f['spec']['type']],
    g['type'] = g['item']['types'][h]) : (h = Object['keys'](g['item']['types'])[0],
    g['type'] = g['item']['types'][h]) : g['type'] = g['item']['types'][f['spec']['type']],
    g['handle_offset'] = g['item']['handle_offset']),
    this['_get_handle_computed'](),
    g['model_loaded'] = 0;
  }
  ['_build_size']() {
    super['_build_size']();
    var f = this['userData']['computed']
    , g = this['userData']['params'];
    f['size']['z'] = Number(f['type']['thickness']),
    f['u_size']['z'] = f['size']['z'] / units;
  }
  async['_build_spec']() {
    var f = this['userData']['computed'], g = this['userData']['params'], h, h, i;
    'facade_profile' == f['handle_type'] && (h = f['handle_item']['sizes'][f['handle_size']],
    i = (h = parseFloat(h['height']) - parseFloat(h['offset_y'])) / units / 2,
    'h' == g['spec']['handle']['orient'] ? (f['size']['y'] -= h,
    f['u_size']['y'] = f['size']['y'] / units,
    'b' == this['userData']['params']['spec']['handle']['pos']['y'] ? this['userData']['own_object']['position']['y'] += i : this['userData']['own_object']['position']['y'] -= i) : (f['size']['x'] -= h,
    f['u_size']['x'] = f['size']['x'] / units,
    'l' == this['userData']['params']['spec']['handle']['pos']['x'] ? this['userData']['own_object']['position']['x'] += i : this['userData']['own_object']['position']['x'] -= i)),
    f['model'] = this['_get_model'](),
    this['_build_computed_materials'](),
    await this['_load_model'](),
    this['_build_handle']();
  }
  async['_load_model']() {
    var f = this['userData']['computed']
    , g = (f['model'] = this['_get_model'](),
    f['model'])
    , j = (f['meshes_list'] = [],
    await load_model({
      'model': g,
      'buffer': true,
      'no_cache': -1 < g['indexOf']('data:application')
    }));
    for (let n = 0; n < j.length; n++) {
      var k = j[n]['clone'](), m, m, m;
      let q = 'gen'
      , r = 0
      , u = 0
      , v = 0;
      -1 < k['name']['indexOf']('v(2)') || -1 < k['name']['indexOf']('v(3)') ? (v = 2,
      null != (m = k['name']['match'](/m\((.*?)\)/)) && (q = m[1]),
      null != (m = k['name']['match'](/ro\((.*?)\)/)) && (r = parseInt(m[1])),
      null != (m = k['name']['match'](/r\((.*?)\)/)) && (u = parseInt(m[1]))) : (-(v = 1) < k['name']['indexOf']('al') && (q = 'al'),
      -1 < k['name']['indexOf']('back') && (q = 'back'),
      -1 < k['name']['indexOf']('glass') && (q = 'glass'));
      var m = new THREE['Mesh'](k,red_mat);
      m['name'] = k['name'],
      m['castShadow'] = true,
      m['receiveShadow'] = true,
      f['meshes_list']['push']({
        'version': v,
        'mat_key': q,
        'render_order': r,
        'tex_rotation': u,
        'mesh': m
      }),
      f['meshes_list_by_material'][q] && f['meshes_list_by_material'][q]['push'](m),
      this['userData']['own_object']['add'](m);
    }
    this['_apply_materials'](),
    this['_set_model3d_size'](g),
    f['model_loaded'] = 1;
  }
  ['_get_model']() {
    if (0 != this['userData']['params']['spec']['f_model'])
    return this['userData']['params']['spec']['f_model'];
    var f = this['userData']['computed']
    , g = f['type']['items']
    , h = f['size'];
    for (let j = 0; j < g.length; j++) {
      var i = g[j];
      if (i['min_width'] = Number(i['min_width']),
      i['min_height'] = Number(i['min_height']),
      i['max_width'] = Number(i['max_width']),
      i['max_height'] = Number(i['max_height']),
      i['max_width'] || (i['max_width'] = 0),
      i['max_height'] || (i['max_height'] = 0),
      i['min_width'] <= h['x'] && h['x'] <= i['max_width'] || i['min_width'] <= h['x'] && 0 == i['max_width'] && i['min_height'] <= h['y'] && h['y'] <= i['max_height'] || i['min_height'] <= h['y'] && 0 == i['max_height'])
      return i['model'];
    }
    return '/common_assets/models/no_model.fbx';
  }
  ['_get_handle_computed']() {
    var f = this['userData']['computed']
    , g = this['userData']['params'];
    f['has_handle'] = 0,
    f['handle_item'] = null,
    f['handle_size'] = 0,
    f['handle_type'] = 'common',
    1 == f['item']['handle'] && 1 == g['spec']['handle']['enabled'] && 1 == g['spec']['handle']['active'] && (f['has_handle'] = 1,
    this['userData']['add_params']['use_lib']) && (f['handle_item'] = pp['libs']['handles']['get_item'](g['spec']['handle']['id']),
    f['handle_type'] = f['handle_item']['type']);
  }
  ['_build_handle']() {
    var f = this['userData']['computed'];
    if (0 != f['has_handle']) {
      var g = this['userData']['params']
      , h = copy_object(def_cabinet_handle)
      , j = (f['handle_size'] = this['_get_handle_size'](),
      h['spec']['id'] = f['handle_item']['id'],
      h['spec']['size_index'] = f['handle_size'],
      h['pos']['z'] = 's.z',
      f['handle_type'])
      , k = f['handle_offset']
      , f = f['handle_item']['sizes'][f['handle_size']];
      let m = g['spec']['handle']['pos']['x']
      , n = g['spec']['handle']['pos']['y'];
      '$' == g['spec']['handle']['pos']['x'][0] && (m = g['spec']['handle']['pos']['x'][1]),
      '$' == g['spec']['handle']['pos']['y'][0] && (n = g['spec']['handle']['pos']['y'][1]),
      '@' == g['spec']['handle']['pos']['x'][0] && (m = pp['engine']['functions'][g['spec']['handle']['pos']['x']['substr'](1)](this)),
      '@' == g['spec']['handle']['pos']['y'][0] && (n = pp['engine']['functions'][g['spec']['handle']['pos']['y']['substr'](1)](this));
      var k = {
        'common': {
          'x': {
            'l': {
              'pivot': {
                'x': -1
              },
              'pos': {
                'x': k
              }
            },
            'c': {
              'pivot': {
                'x': 0
              },
              'pos': {
                'x': 's:x\x20/\x202'
              }
            },
            'r': {
              'pivot': {
                'x': 1
              },
              'pos': {
                'x': 's:x\x20-\x20' + k
              }
            }
          },
          'y': {
            'b': {
              'pivot': {
                'y': -1
              },
              'pos': {
                'y': k
              }
            },
            'c': {
              'pivot': {
                'y': 0
              },
              'pos': {
                'y': 's:y\x20/\x202'
              }
            },
            't': {
              'pivot': {
                'y': 1
              },
              'pos': {
                'y': 's:y\x20\x20-\x20' + k
              }
            }
          },
          'z': {
            'pivot': -1,
            'pos': 's.z'
          }
        },
        'overhead': {
          'x': {
            'l': {
              'pivot': {
                'x': -1
              },
              'pos': {
                'x': k
              }
            },
            'c': {
              'pivot': {
                'x': 0
              },
              'pos': {
                'x': 's:x\x20/\x202'
              }
            },
            'r': {
              'pivot': {
                'x': 1
              },
              'pos': {
                'x': 's:x\x20-\x20' + k
              }
            }
          },
          'y': {
            'b': {
              'pivot': {
                'y': -1
              },
              'pos': {
                'y': k
              }
            },
            'c': {
              'pivot': {
                'y': 0
              },
              'pos': {
                'y': 's:y\x20/\x202'
              }
            },
            't': {
              'pivot': {
                'y': 1
              },
              'pos': {
                'y': 's:y\x20\x20-\x20' + k
              }
            }
          },
          'z': {
            'pivot': -1,
            'pos': 's.z'
          }
        },
        'facade_profile': {
          'x': {
            'l': {
              'pivot': {
                'x': -1
              },
              'pos': {
                'x': parseFloat(f['height']) / 2
              }
            },
            'c': {
              'pivot': {
                'x': 0
              },
              'pos': {
                'x': 's:x\x20/\x202'
              }
            },
            'r': {
              'pivot': {
                'x': 1
              },
              'pos': {
                'x': 's:x\x20-\x20' + parseFloat(f['height']) / 2
              }
            }
          },
          'y': {
            'b': {
              'pivot': {
                'y': -1
              },
              'pos': {
                'y': parseFloat(f['height']) / 2
              }
            },
            'c': {
              'pivot': {
                'y': 0
              },
              'pos': {
                'y': 's:y\x20/\x202'
              }
            },
            't': {
              'pivot': {
                'y': 1
              },
              'pos': {
                'y': 's:y\x20+\x20' + (parseFloat(f['height']) / 2 - parseFloat(f['offset_y']))
              }
            }
          },
          'z': {
            'pivot': -1,
            'pos': 0
          }
        }
      }
      , f = ('v' == g['spec']['handle']['orient'] && (h['rot']['z'] = 90),
      h['pos']['x'] = k[j]['x'][m]['pos']['x'],
      h['pivot']['x'] = k[j]['x'][m]['pivot']['x'],
      h['pos']['y'] = k[j]['y'][n]['pos']['y'],
      h['pivot']['y'] = k[j]['y'][n]['pivot']['y'],
      h['pos']['z'] = k[j]['z']['pos'],
      h['pivot']['z'] = k[j]['z']['pivot'],
      new CabinetHandle(h,{
        'parent': this,
        'local_parent': this,
        'root': this['userData']['root'],
        'path': this['userData']['path'] + ',0',
        'variables': {}
      },{
        'use_lib': true,
        'params': {},
        'material': {}
      }));
      this['userData']['handle'] = f,
      this['userData']['own_object']['add'](f);
    }
  }
  ['_get_handle_size']() {
    var f = this['userData']['params']
    , g = this['userData']['computed'];
    let h = f['spec']['handle']['p_size'];
    var j = g['handle_item']
    , k = (h > j['sizes']['length'] - 1 && (h = j['sizes']['length'] - 1),
    parseInt(j['sizes'][h]['width']))
    , l = 'h' == f['spec']['handle']['orient'] ? g['size']['x'] : g['size']['y'];
    if (l < k) {
      for (let m = h; m--; )
      if (parseInt(j['sizes'][m]['width']) <= l) {
        h = m;
        break;
      }
    } else
    h = f['spec']['handle']['p_size'];
    return f['spec']['handle']['c_size'] = h;
  }
  ['_change_handle'](f, g) {
    var h = this['userData']['computed'];
    if (0 != h['has_handle'] && (h['handle_item']['id'] != f || h['handle_size'] != g)) {
      var g = pp['libs']['handles']['items'][f], j = h['handle_item'], k, g;
      this['userData']['params']['spec']['handle']['id'] = f;
      let l = false;
      'facade_profile' != g['type'] && 'facade_profile' != j['type'] || (l = true),
      this['_get_handle_computed'](),
      (l ? this : (g = this['userData']['handle'],
      h['handle_size'] = this['_get_handle_size'](),
      g['userData']['params']['spec']['size_index'] = h['handle_size'],
      g['userData']['params']['spec']['id'] = f,
      g))['_rebuild']();
    }
  }
  ['_apply_materials']() {
    let f = this['userData']['computed'];
    var g = f['materials'];
    for (let k = 0; k < f['meshes_list']['length']; k++) {
      let m = this['userData']['computed']
      , n = m['meshes_list'][k]['mat_key'];
      var h = m['meshes_list'][k]['mesh'];
      let o;
      if (g[n]) {
        var j = g[n];
        let q;
        switch (j['mode']) {
          case 'i':
          q = pp['libs']['decors']['get_item'](j['selected']);
          break;
          case 'm':
          break;
          case 'c':
          q = pp['libs']['decors']['get_item'](j['selected']);
          break;
          case 'v':
          q = copy_object(g[n]['params']);
          break;
          case 'f':
          break;
        }
        q ? (q['add_params']['model_width'] = m['size'][j['tex_axis']['x']],
        q['add_params']['model_height'] = m['size'][j['tex_axis']['y']]) : q = pp['libs']['decors']['get_item'](0),
        o = create_material(q);
      } else
      bim_arr.forEach(r => {
        -1 < n['indexOf'](r) && 'pat' != n && (o = 'function' == typeof bim_keys[r] ? bim_keys[r](this, n) : bim_keys[r]);
      }
      ),
      o = o || create_material(pp['libs']['decors']['get_item'](0));
      h['material'] = o;
    }
  }
  ['_build_computed_materials']() {
    let f = this['userData']['computed'];
    var g = this['userData']['params']
    , g = (f['meshes_list_by_material'] = {
      'gen': []
    },
    f['materials'] = {},
    f['materials'] = {
      'gen': {
        'categories': f['item']['materials'],
        'fixed': 0,
        'name': '',
        'key': 'gen',
        'tex_axis': {
          'x': 'x',
          'y': 'y'
        },
        'mode': 'c',
        'selected': g['spec']['materials']['gen']
      }
    },
    f['item']['additional_materials']);
    Object['values'](g)['forEach'](h => {
      f['materials'][h['key']] = {
        'categories': h['materials'],
        'fixed': h['fixed'],
        'name': '',
        'key': h['key'],
        'tex_axis': {
          'x': 'x',
          'y': 'y'
        },
        'mode': 'c',
        'selected': h['selected']
      },
      f['meshes_list_by_material'][h['key']] = [];
    }
    );
  }
}
let def_cabinet_hole = _['merge'](copy_object(cabinet_def_common), {
  'type': 'hole',
  'spec': {
    'name': '',
    'code': '',
    'orientation': 'f',
    'group': 'hole',
    'type': 'common',
    'type_params': {},
    'key': '',
    'global': 1,
    'shape': null,
    'direction': '',
    'through': false
  },
  'size': {
    'x': 100,
    'y': 0,
    'z': 15
  }
});
class CabinetHole extends CabinetSection {
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
    f['type'] || (f['type'] = 'hole');
  }
  ['_build_children']() {}
  ['_build_computed']() {
    super['_build_computed']();
    var f = this['userData']['computed']
    , g = this['userData']['params'];
    f['real_size'] = new THREE['Vector3']();
  }
  ['_before_build']() {
    var f = this['userData']['computed'], g, h = this['userData']['root']['userData']['computed'];
    this['params'] = this['userData']['params'],
    f['key'] = this['userData']['params']['spec']['key'];
  }
  ['_build_helpers']() {
    var f = this['userData']['computed']
    , g = (this['userData']['helpers'] ? this['_reset'](this['userData']['helpers']) : (this['userData']['helpers'] = new THREE['Group'](),
    this['userData']['helpers']['name'] = '__helpers',
    this['add'](this['userData']['helpers'])),
    make_cube(f['size']['x'] / units, f['size']['y'] / units, f['size']['z'] / units, pp['three']['materials']['helper_cube']))
    , h = (g['userData']['is_helper'] = true,
    g['userData']['no_edges'] = 1,
    g['userData']['is_helper'] = 1,
    g['renderOrder'] = 10,
    g['layers']['set'](1),
    this['userData']['helpers']['userData']['size_volume'] = g,
    this['userData']['helpers']['add'](g),
    make_edges(f['size']['x'] / units, f['size']['y'] / units, f['size']['z'] / units, pp['three']['materials']['basic_line']))
    , g = (h['userData']['is_helper'] = true,
    h['userData']['no_edges'] = 1,
    h['userData']['is_helper'] = 1,
    h['renderOrder'] = 11,
    h['layers']['set'](1),
    this['userData']['helpers']['add'](g),
    this['userData']['helpers']['add'](h),
    this['_build_direction']())
    , h = {
      'x': [-1, 0, 0, f['real_size']['z'], f['real_size']['y'], f['real_size']['x']],
      '-x': [1, 0, 0, f['real_size']['z'], f['real_size']['y'], f['real_size']['x']],
      'y': [0, -1, 0, f['real_size']['x'], f['real_size']['z'], f['real_size']['y']],
      '-y': [0, 1, 0, f['real_size']['x'], f['real_size']['z'], f['real_size']['y']],
      'z': [0, 0, -1, f['real_size']['x'], f['real_size']['y'], f['real_size']['z']],
      '-z': [0, 0, 1, f['real_size']['x'], f['real_size']['y'], f['real_size']['z']],
      'default': [0, 0, 0, f['real_size']['x'], f['real_size']['y'], f['real_size']['z']]
    }
    , [f,g,h,j,k,l] = h[g] || h['default']
    , f = conv_pivot(f, j)
    , j = conv_pivot(g, k)
    , g = conv_pivot(h, l);
    this['userData']['helpers']['position']['copy'](this['userData']['own_object']['position']),
    this['userData']['helpers']['rotation']['copy'](this['userData']['own_object']['rotation']),
    this['userData']['helpers']['translateX'](-f / units),
    this['userData']['helpers']['translateY'](-j / units),
    this['userData']['helpers']['translateZ'](-g / units),
    this['userData']['helpers']['visible'] = 1 == this['userData']['params']['helpers_visible'];
  }
  ['_build_size']() {
    var f = this['userData']['computed'], g = this['userData']['params'], h = f['c_object'], j = this['_build_direction'](), k = g['spec']['through'], l = this['userData']['parent']instanceof CabinetFurniture && this['userData']['parent']['userData']['parent']instanceof CabinetWall, k;
    k && l && (k = this['userData']['parent']['userData']['parent']['userData']['computed']['material'],
    g['size']['z'] = k['thickness']),
    f['real_size']['x'] = comp2(g['size']['x'], h),
    f['real_size']['y'] = comp2(g['size']['x'], h),
    f['real_size']['z'] = comp2(g['size']['z'], h),
    f['size']['x'] = comp2(g['size']['x'], h),
    f['size']['y'] = comp2(g['size']['x'], h),
    f['size']['z'] = comp2(g['size']['z'], h),
    'x' != j && '-x' != j || (f['size']['x'] = comp2(g['size']['z'], h),
    f['size']['z'] = comp2(g['size']['x'], h),
    f['size']['y'] = comp2(g['size']['x'], h)),
    'y' != j && '-y' != j || (f['size']['x'] = comp2(g['size']['x'], h),
    f['size']['y'] = comp2(g['size']['z'], h),
    f['size']['z'] = comp2(g['size']['x'], h)),
    f['u_real_size'] = f['real_size']['clone']()['divideScalar'](units),
    f['u_size'] = f['size']['clone']()['divideScalar'](units);
  }
  ['_build_direction'](f=null) {
    f = f || this['userData']['parent']?.['userData']?.['params']?.['spec']?.['orientation'] || 'f';
    let g = this['userData']['params']['spec']['direction'];
    if ('v' === f)
    switch (g) {
      case 'x':
      g = 'z';
      break;
      case '-x':
      g = '-z';
      break;
      case 'y':
      g = 'y';
      break;
      case '-y':
      g = '-y';
      break;
      case 'z':
      g = 'x';
      break;
      case '-z':
      g = '-x';
      break;
    }
    else {
      if ('h' === f)
      switch (g) {
        case 'x':
        g = 'x';
        break;
        case '-x':
        g = '-x';
        break;
        case 'y':
        g = 'z';
        break;
        case '-y':
        g = '-z';
        break;
        case 'z':
        g = 'y';
        break;
        case '-z':
        g = '-y';
        break;
      }
    }
    return g;
  }
  ['_build_pivot']() {
    var f = this['userData']['params']
    , g = this['userData']['computed']
    , h = this['userData']['own_object']
    , j = this['_build_direction']()
    , g = {
      'x': [-1, 0, 0, g['real_size']['z'], g['real_size']['y'], g['real_size']['x']],
      '-x': [1, 0, 0, g['real_size']['z'], g['real_size']['y'], g['real_size']['x']],
      'y': [0, -1, 0, g['real_size']['x'], g['real_size']['z'], g['real_size']['y']],
      '-y': [0, 1, 0, g['real_size']['x'], g['real_size']['z'], g['real_size']['y']],
      'z': [0, 0, -1, g['real_size']['x'], g['real_size']['y'], g['real_size']['z']],
      '-z': [0, 0, 1, g['real_size']['x'], g['real_size']['y'], g['real_size']['z']],
      'default': [0, 0, 0, g['real_size']['x'], g['real_size']['y'], g['real_size']['z']]
    }
    , [j,g,k,l,m,n] = g[j] || g['default']
    , j = (f['pivot']['x'] = j,
    f['pivot']['y'] = g,
    f['pivot']['z'] = k,
    conv_pivot(f['pivot']['x'], l))
    , g = conv_pivot(f['pivot']['y'], m)
    , k = conv_pivot(f['pivot']['z'], n);
    h['translateX'](j / units),
    h['translateY'](g / units),
    h['translateZ'](k / units);
  }
  ['_build_pos']() {
    var f = this['userData']['computed']
    , g = this['userData']['params']
    , h = f['c_object'];
    f['real_pos'] = new THREE['Vector3'](),
    f['pos']['x'] = comp2(g['pos']['x'], h),
    f['pos']['y'] = comp2(g['pos']['y'], h),
    f['pos']['z'] = comp2(g['pos']['z'], h),
    f['real_pos']['x'] = comp2(g['pos']['x'], h),
    f['real_pos']['y'] = comp2(g['pos']['y'], h),
    f['real_pos']['z'] = comp2(g['pos']['z'], h);
    let j, k, l;
    var m = this['_build_direction']()
    , n = this['userData']['parent']instanceof CabinetFurniture;
    switch (m) {
      case 'x':
      j = 1 == g['spec']['global'] ? (-h['parent_size']['x'] / 2 + f['pos']['z'] + f['real_size']['z'] / 2) / units : -h['parent_size']['x'] / 2 / units,
      k = (-h['parent_size']['y'] / 2 + f['pos']['y']) / units,
      l = (-h['parent_size']['z'] / 2 + f['pos']['x']) / units,
      f['real_pos']['z'] = f['pos']['x'],
      f['real_pos']['x'] = f['pos']['z'];
      break;
      case '-x':
      j = 1 == g['spec']['global'] ? (h['parent_size']['x'] / 2 + f['pos']['z'] + -f['real_size']['z'] / 2) / units : h['parent_size']['x'] / 2 / units,
      k = (-h['parent_size']['y'] / 2 + f['pos']['y']) / units,
      l = (-h['parent_size']['z'] / 2 + f['pos']['x']) / units,
      f['real_pos']['z'] = f['pos']['x'],
      f['real_pos']['x'] = f['pos']['z'];
      break;
      case 'y':
      k = 1 == g['spec']['global'] ? (-h['parent_size']['y'] / 2 + f['pos']['z'] + f['real_size']['z'] / 2) / units : -h['parent_size']['y'] / 2 / units,
      j = (-h['parent_size']['x'] / 2 + f['pos']['x']) / units,
      l = (-h['parent_size']['z'] / 2 + f['pos']['y']) / units,
      f['real_pos']['y'] = f['pos']['z'],
      f['real_pos']['z'] = f['pos']['y'];
      break;
      case '-y':
      k = 1 == g['spec']['global'] ? (h['parent_size']['y'] / 2 + f['pos']['z'] + -f['real_size']['z'] / 2) / units : h['parent_size']['y'] / 2 / units,
      j = (-h['parent_size']['x'] / 2 + f['pos']['x']) / units,
      l = (-h['parent_size']['z'] / 2 + f['pos']['y']) / units,
      f['real_pos']['y'] = f['pos']['z'],
      f['real_pos']['z'] = f['pos']['y'];
      break;
      case 'z':
      l = 1 == g['spec']['global'] ? (-h['parent_size']['z'] / 2 + f['pos']['z'] + f['real_size']['z'] / 2) / units : -h['parent_size']['z'] / 2 / units,
      j = (-h['parent_size']['x'] / 2 + f['pos']['x']) / units,
      k = (-h['parent_size']['y'] / 2 + f['pos']['y']) / units;
      break;
      case '-z':
      l = 1 == g['spec']['global'] ? (h['parent_size']['z'] / 2 + f['pos']['z'] + -f['real_size']['z'] / 2) / units : h['parent_size']['z'] / 2 / units,
      j = (-h['parent_size']['x'] / 2 + f['pos']['x']) / units,
      k = (-h['parent_size']['y'] / 2 + f['pos']['y']) / units;
      break;
      default:
      j = f['pos']['x'],
      k = f['pos']['y'],
      l = f['pos']['z'];
      break;
    }
    this['position']['set'](j, k, l);
  }
  ['_after_build']() {
    'edges' == global_options['mode'] && this['edges_mode']();
  }
  ['_build_spec']() {
    var f = this['userData']['computed'], g = this['userData']['params'], h = f['real_size']['x'] / 2 / units, j = f['real_size']['z'] / units, k = new THREE['CylinderGeometry'](h,h,j,32), m = 0.3 * j, h = 1 / units, q = 0.1 * h, u = 0.7 * j, v = new THREE['ConeGeometry'](h,m,16), w = new THREE['CylinderGeometry'](q,q,u,8), j = this['userData']['parent']instanceof CabinetFurniture, x;
    switch (this['_build_direction']()) {
      case 'x':
      w['rotateZ'](Math['PI'] / 2)['rotateZ'](-Math['PI'])['translate'](-f['u_real_size']['z'] / 2 - m / 2, 0, 0),
      v['rotateZ'](Math['PI'] / 2)['rotateZ'](-Math['PI'])['translate'](-f['u_real_size']['z'] / 2 + u / 2, 0, 0),
      k['rotateZ'](Math['PI'] / 2)['translate'](-f['u_real_size']['z'] / 2, 0, 0);
      break;
      case '-x':
      w['rotateZ'](-Math['PI'] / 2)['rotateZ'](-Math['PI'])['translate'](f['u_real_size']['z'] / 2 + m / 2, 0, 0),
      v['rotateZ'](-Math['PI'] / 2)['rotateZ'](-Math['PI'])['translate'](f['u_real_size']['z'] / 2 - u / 2, 0, 0),
      k['rotateZ'](-Math['PI'] / 2)['translate'](f['u_real_size']['z'] / 2, 0, 0);
      break;
      case 'y':
      w['translate'](0, -f['u_real_size']['z'] / 2 - m / 2, 0),
      v['translate'](0, -f['u_real_size']['z'] / 2 + u / 2, 0),
      k['translate'](0, -f['u_real_size']['z'] / 2, 0);
      break;
      case '-y':
      w['rotateZ'](-Math['PI'])['translate'](0, f['u_real_size']['z'] / 2 + m / 2, 0),
      v['rotateZ'](-Math['PI'])['translate'](0, f['u_real_size']['z'] / 2 - u / 2, 0),
      k['translate'](0, f['u_real_size']['z'] / 2, 0);
      break;
      case 'z':
      w['rotateX'](Math['PI'] / 2)['translate'](0, 0, -f['u_real_size']['z'] / 2 - m / 2),
      v['rotateX'](Math['PI'] / 2)['translate'](0, 0, -f['u_real_size']['z'] / 2 + u / 2),
      k['rotateX'](Math['PI'] / 2)['translate'](0, 0, -f['u_real_size']['z'] / 2);
      break;
      case '-z':
      w['rotateX'](-Math['PI'] / 2)['translate'](0, 0, f['u_real_size']['z'] / 2 + m / 2),
      v['rotateX'](-Math['PI'] / 2)['translate'](0, 0, f['u_real_size']['z'] / 2 - u / 2),
      k['rotateX'](-Math['PI'] / 2)['translate'](0, 0, f['u_real_size']['z'] / 2);
      break;
    }
    var h = new THREE['Mesh'](k,pp['three']['materials']['hole'])
    , q = THREE['BufferGeometryUtils']['mergeBufferGeometries']([w, v])
    , y = pp['three']['materials']['arrow']
    , q = new THREE['Mesh'](q,y);
    j && 1 == this['userData']['parent']['userData']['params']['spec']['show_direction'] ? q['visible'] = true : q['visible'] = false,
    q['userData']['type'] = 'hole_direction_arrow',
    h['castShadow'] = !(q['exclude_cut'] = true),
    h['receiveShadow'] = false,
    h['userData']['edgesModeType'] = ObjectType['Hole'],
    this['userData']['arrow'] = q,
    this['userData']['own_object']['add'](q),
    this['userData']['own_object']['add'](h);
  }
}
let def_cabinet_info_section = {
  'type': 'info_section',
  'name': '',
  'visible': 1,
  'active': 1,
  'comments': '',
  'spec': {
    'key': '',
    'value': ''
  }
};
class CabinetInfoSection extends CabinetSection {
  constructor(f={}, g={}, h={
    'use_lib': true,
    'params': {},
    'material': {}
  }) {
    super(f, g, h);
  }
}
let def_cabinet_leg = _['merge'](copy_object(cabinet_def_common), {
  'type': 'leg',
  'spec': {
    'id': 0,
    'type': 'common',
    'key': ''
  },
  'size': {
    'x': 100,
    'y': 100,
    'z': 100
  }
})
, def_cabinet_leg_nolib = {
  'item': {
    'params': {
      'mat_mode': 0,
      'material': 0,
      'mat_params': {},
      'model_params': {
        'enabled': true,
        'model': '',
        'code': '',
        'price_type': 'p',
        'price_mode': 'm',
        'price': 0,
        'acc_id': 0
      },
      'accs': [],
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
class CabinetLegN extends CabinetSection {
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
    f['type'] || (f['type'] = 'leg');
  }
  ['_before_build']() {
    var f = this['userData']['params']
    , g = this['userData']['computed'];
    this['userData']['item_id'] = f['spec']['id'],
    g['key'] = f['spec']['key'],
    this['userData']['add_params']['use_lib'] ? (g['item'] = pp['libs']['legs']['get_item'](this['userData']['item_id']),
    g['decor'] = g['item']['params']['material']) : (g['item'] = _['merge'](copy_object(def_cabinet_leg_nolib['item']), this['userData']['add_params']['params']),
    g['decor'] = _['merge'](copy_object(def_cabinet_leg_nolib['material']), this['userData']['add_params']['material'])),
    g['model'] = g['item']['params']['model_params'];
  }
  ['_build_size']() {
    var f = this['userData']['computed']
    , g = this['userData']['params']
    , h = f['c_object'];
    f['size']['x'] = parseInt(f['item']['params']['width']),
    f['size']['y'] = comp2(g['size']['y'], h),
    f['size']['z'] = parseInt(f['item']['params']['thickness']),
    f['u_size'] = f['size']['clone']()['divideScalar'](units);
  }
  async['_build_spec']() {
    var f = this['userData']['computed']
    , g = this['userData']['own_object'];
    if (f['model'] && f['model']['model']) {
      await this['_load_model'](f['model']['model'], {
        'gen': f['item']
      });
      for (let h = 0; h < g['children']['length']; h++)
      g['children'][h]['userData']['edgesModeType'] = ObjectType['CabinetLeg'];
    } else
    this['_build_mesh']();
  }
  ['_build_mesh']() {
    var f = this['userData']['computed'], g = this['userData']['own_object'], h = f['size']['y'] / units, j = 20 / units, k = 10 / units, l = 30 / units, n = 12, k, k = (0 < h && j < h && ((k = make_cylinder(k, k, h, n, red_mat))['userData']['edgesModeType'] = ObjectType['CabinetLeg'],
    g['add'](k),
    k['castShadow'] = true),
    make_cylinder(l, l, j, n, red_mat)), l = (j < h && (k['position']['y'] = -(h - j) / 2),
    k['userData']['edgesModeType'] = ObjectType['CabinetLeg'],
    g['add'](k),
    k['castShadow'] = true,
    _.map(this['userData']['own_object']['children'], o => ({
      'mat_key': 'gen',
      'mesh': o
    })));
    this['_apply_materials']({
      'gen': f['item']
    }, l);
  }
  ['change_material'](f) {
    var g = this['userData']['params'], h = g['spec']['id'] !== f, g = (g['spec']['id'] = f,
    _['get'](this['userData'], 'parent_params.root')), g, i;
    g && (g = g['get_child_by_path'](this['userData']['path'], true),
    i = _['get'](g, 'spec'),
    g) && i && (i['id'] = f),
    h && this['_rebuild']();
  }
}
let def_cabinet_model = _['merge'](copy_object(cabinet_def_common), {
  'type': 'model',
  'spec': {
    'id': 0,
    'key': '',
    'model_mats': {}
  },
  'current': {},
  'size': {
    'x': 100,
    'y': 100,
    'z': 100
  }
});
class CabinetModel extends CabinetSection {
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
    f['type'] || (f['type'] = 'model'),
    pp['events']['cabinet']['before_build_params'] && pp['events']['cabinet']['before_build_params'](this, f, g, h),
    f['events'] && f['events']['on_before_params'] && 'function' == typeof pp['events']['custom'][f['events']['on_before_params']] && pp['events']['custom'][f['events']['on_before_params']](f, g, h);
  }
  ['_before_build']() {
    var f = this['userData']['params']
    , g = this['userData']['computed'];
    this['userData']['item_id'] = f['spec']['id'],
    g['key'] = f['spec']['key'],
    this['userData']['add_params']['use_lib'] ? g['item'] = pp['libs']['models']['get_item'](this['userData']['item_id']) : g['item'] = f['spec'],
    this['_build_computed_materials'](),
    g['model_loaded'] = 0,
    super['_before_build']();
  }
  async['_build_spec']() {
    var f = this['userData']['computed']
    , g = f['materials']
    , h = this['_get_model']()
    , j = (f['model_item'] = h,
    await this['_load_model'](h['model'], g, h['params']),
    this['userData']['root']);
    this['userData']['is_root'] && this['_build_sizes'](),
    'edges' == global_options['mode'] && this['edges_mode']();
  }
  ['_get_model']() {
    var f = this['userData']['computed']
    , g = f['item']['params']['models']
    , h = f['size'];
    for (let m = 0; m < g.length; m++) {
      var j = g[m]
      , k = ['min_x', 'min_y', 'min_z'];
      for (let n = k.length; n--; )
      0 == j[k[n]] ? j[k[n]] = -1 / 0 : j[k[n]] = Number(j[k[n]]);
      var l = ['max_x', 'max_y', 'max_z'];
      for (let o = l.length; o--; )
      j[l[o]] && 0 != j[l[o]] ? j[l[o]] = Number(j[l[o]]) : j[l[o]] = 1 / 0;
      if ((j['min_x'] <= h['x'] && h['x'] <= j['max_x'] || 0 === h['x']) && (j['min_y'] <= h['y'] && h['y'] <= j['max_y'] || 0 === h['y']) && (j['min_z'] <= h['z'] && h['z'] <= j['max_z'] || 0 === h['z']))
      return '' == j['model'] && (j['model'] = '/common_assets/models/no_model.fbx'),
      j;
    }
    return {
      'code': '',
      'name': '',
      'price': 0,
      'model': '/common_assets/models/no_model.fbx'
    };
  }
  ['_build_computed_materials']() {}
  ['change_material'](f, g) {
    var h = this['userData']['computed'];
    this['_apply_material'](g, h['meshes_list_by_material'][f]);
  }
  ['_get_specs'](f) {
    var g = pp['events']?.['cabinet']?.['before_create_spec_item'], h = pp['events']?.['cabinet']?.['after_create_spec_item'], j = (f = f || {
      'all': {},
      'sum': {},
      'sum_arr': [],
      'aggr_funcs': {}
    },
    this['userData']['params']), k;
    if (g && false === g(j['type'], this, f))
    return f;
    this['_get_specs_accessories'](f);
    var g = this['userData']['computed'];
    if (0 != g['item']['params']['show_in_spec'] && ('' != g['model_item']['code'] || '' != g['model_item']['name'] || 0 != g['model_item']['price'])) {
      var l = module_utils['get_price_mod']('model');
      if ('c' == g['model_item']['price_mode'] && g['model_item']['code']) {
        var n = accsessories_data['get_item_by_code'](g['model_item']['code']);
        if (n) {
          var q = void 0 !== g['model_item']['count'] ? parse_num(g['model_item']['count']) : 1, u;
          if ('m' == g['model_item']['price_type'] && (n['count'] = g['size']['x'] / 1000),
          'm2' == g['model_item']['price_type'] && (n['count'] = g['size']['x'] * g['size']['z'] / 1000 / 1000),
          n['price_type'] = g['model_item']['price_type'],
          n['name'] = n['name'] || g['model_item']['name'],
          n['type'] = 'item',
          n['size_x'] = g['size']['x'],
          n['size_y'] = g['size']['y'],
          n['size_z'] = g['size']['z'],
          n['count'] = q,
          n['price'] = parse_num(n['price_per_piece']) * l,
          n['width'] = 'hl' === n['price_type'] ? parse_num(g['model_item']['hl_size']) : 0,
          n['hl_axis'] = g['model_item']['hl_axis'] || 'x',
          n['sum_key'] = 'hl' === n['price_type'] ? n['id'] + '_' + n['code'] + '_' + n['price_type'] + '_' + n['hl_axis'] : n['id'] + '_' + n['code'] + '_' + n['price_type'],
          h) {
            if (false === h(j['type'], this, f, n))
            return f;
          }
          module_utils['add_spec_to_context'](f, n);
        }
      } else {
        var q = void 0 !== g['model_item']['count'] ? parse_num(g['model_item']['count']) : 1, n = {
          'id': this['userData']['params']['spec']['id'],
          'type': 'item',
          'name': g['model_item']['name'],
          'code': g['model_item']['code'],
          'category': '',
          'label': g['model_item']['code'] + '\x20' + g['model_item']['name'],
          'size_x': g['size']['x'],
          'size_y': g['size']['y'],
          'size_z': g['size']['z'],
          'price_per_piece': parse_num(g['model_item']['price']),
          'price': parse_num(g['model_item']['price']) * l,
          'count': q,
          'price_type': g['model_item']['price_type'] || 'p'
        }, v;
        if (n['width'] = 'hl' === n['price_type'] ? parse_num(g['model_item']['hl_size']) : 0,
        n['hl_axis'] = g['model_item']['hl_axis'] || 'x',
        n['sum_key'] = 'hl' === n['price_type'] ? n['id'] + ('_' + n['code'] + '_' + n['price_type'] + '_') + n['hl_axis'] : n['id'] + ('_' + n['code'] + '_') + n['price_type'],
        h) {
          if (false === h(j['type'], this, f, n))
          return f;
        }
        module_utils['add_spec_to_context'](f, n);
      }
    }
    return f;
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
      var l = this['userData']['params']['accessories_default'];
      if (l) {
        for (let w = 0; w < l.length; w++)
        u(f, l[w]);
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
}
let def_cabinet_mouse_target = _['merge'](copy_object(cabinet_def_common), {
  'type': 'mouse_target',
  'spec': {}
});
class CabinetMouseTarget extends CabinetSection {
  constructor(f={}, g={}, h={}) {
    super(f, g, h);
  }
  ['_before_params'](f, g, h) {
    this['userData']['class'] = this.constructor['name'],
    this['temp_type'] = this.constructor['name'],
    f['type'] || (f['type'] = 'mouse_target');
  }
  ['_build_spec']() {
    super['_build_spec']();
    var f = this['userData']['computed']
    , f = make_cube(f['u_size']['x'], f['u_size']['y'], f['u_size']['z'], pp['three']['materials']['transparent_material']);
    f['userData']['is_mouse_target'] = 1,
    f['no_edges'] = 1,
    f['userData']['local_parent'] = this['userData']['local_parent'],
    (f['userData']['parent'] = this)['userData']['own_object']['add'](f);
  }
}
let def_cabinet_path = _['merge'](copy_object(cabinet_def_common), {
  'type': 'path',
  'spec': {
    'name': '',
    'code': '',
    'orientation': 'v',
    'group': 'path',
    'type': 'common',
    'type_params': {},
    'key': '',
    'points': [],
    'reverse': false,
    'direction': 'z',
    'material': {
      'id': '1'
    },
    'trajectory': [],
    'dz': 0,
    'dz_2': 0
  },
  'size': {
    'x': 10,
    'y': 10,
    'z': 0
  }
});
class CabinetPath extends CabinetSection {
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
    f['type'] || (f['type'] = 'path');
  }
  ['_before_build']() {
    var f = this['userData']['params'], g = this['userData']['computed'], h, i = this['userData']['root']['userData']['computed'];
    this['params'] = this['userData']['params'],
    g['key'] = this['userData']['params']['spec']['key'] || f['spec']['code'],
    g['material'] = pp['libs']['bort']['get_item'](f['spec']['material']['id']),
    g['decor'] = this['userData']['computed']['material']['params']['material'],
    g['material']['add_params'] || (g['material']['add_params'] = {});
  }
  ['_build_size']() {
    var f = this['userData']['computed']
    , g = this['userData']['params'];
    let h = f['c_object'];
    var j = this['userData']['parent']
    , k = (j['userData']?.['computed']?.['real_size'] || j['userData']?.['computed']?.['size'])['z']
    , j = g['spec']['type_params']['angle'] ?? 45
    , j = comp2(j, h)
    , l = THREE['MathUtils']['degToRad'](j);
    switch (f['points'] = g['spec']['points']['map'](m => ({
      'x': void 0 !== m['x'] ? comp2(m['x'], h) : null,
      'y': void 0 !== m['y'] ? comp2(m['y'], h) : null,
      'radius': m['radius'] || 0,
      'center': m['center'] ? {
        'x': comp2(m['center']['x'], h),
        'y': comp2(m['center']['y'], h)
      } : null,
      'dir': m['dir'] || false
    })),
    g['spec']['type']) {
      case 'angle':
      f['size']['x'] = k,
      f['size']['y'] = Math['tan'](l) * f['size']['x'];
      break;
      case 'dx_angle':
      f['size']['x'] = comp2(g['size']['x'], h),
      f['size']['y'] = Math['tan'](l) * f['size']['x'];
      break;
      default:
      f['size']['x'] = comp2(g['size']['x'], h),
      f['size']['y'] = comp2(g['size']['y'] || 0, h);
      break;
    }
    f['size']['z'] = comp2(g['size']['z'], h),
    f['u_size'] = f['size']['clone']()['divideScalar'](units);
  }
  ['_build_trajectory']() {
    var f = this['userData']['computed']
    , g = this['userData']['params']
    , j = g['spec']['trajectory']
    , k = this['userData']['parent']
    , l = k['userData']?.['computed']?.['real_size'] || k['userData']?.['computed']['size'] || {}
    , k = k['userData']['params']['spec']['orientation']
    , m = g['spec']['orientation']
    , q = g['spec']['direction'];
    let v = f['c_object'], w, x;
    var y = comp2(g['spec']['dz'], v)
    , A = comp2(g['spec']['dz_2'], v);
    if (j && 0 < j.length)
    w = Array.isArray(j) ? j.map(D => new THREE['Vector3'](comp2(D['x'], v),comp2(D['y'], v),0)) : [new THREE['Vector3'](comp2(j['pos1']['x'], v),comp2(j['pos1']['y'], v),0), new THREE['Vector3'](comp2(j['pos2']['x'], v),comp2(j['pos2']['y'], v),0)];
    else
    switch (m) {
      case 'v':
      w = [new THREE['Vector3'](0,y,0), new THREE['Vector3'](0,l['y'] - A,0)];
      break;
      default:
      w = [new THREE['Vector3'](y,0,0), new THREE['Vector3'](l['x'] - A,0,0)];
      break;
    }
    switch (k) {
      case 'h':
      case 'v':
      x = 'v' == m ? '-z' == q ? [new THREE['Vector3'](0,y,0), new THREE['Vector3'](0,l['y'] - A,0)] : [new THREE['Vector3'](0,A,0), new THREE['Vector3'](0,l['y'] - y,0)] : 'z' == q ? [new THREE['Vector3'](y,0,0), new THREE['Vector3'](l['x'] - A,0,0)] : [new THREE['Vector3'](A,0,0), new THREE['Vector3'](l['x'] - y,0,0)];
      break;
      default:
      x = 'v' == m ? 'z' == q ? [new THREE['Vector3'](0,y,0), new THREE['Vector3'](0,l['y'] - A,0)] : [new THREE['Vector3'](0,A,0), new THREE['Vector3'](0,l['y'] - y,0)] : '-z' == q ? [new THREE['Vector3'](y,0,0), new THREE['Vector3'](l['x'] - A,0,0)] : [new THREE['Vector3'](A,0,0), new THREE['Vector3'](l['x'] - y,0,0)];
      break;
    }
    f['trajectory'] = w;
    var B = new THREE['CurvePath']()
    , C = x.map(D => D['clone']()['divideScalar'](units));
    for (let D = 0; D < C.length - 1; D++)
    B['add'](new THREE['LineCurve3'](C[D],C[D + 1]));
    return B;
  }
  ['_rebuild']() {
    super['_rebuild']();
    var f = this['userData']['path']
    , g = this['userData']['root']
    , g = module_utils['get_child_by_path'](g, f)
    , f = g['userData']['parent'];
    g['updateMatrixWorld'](true),
    f['_update_evaluate']();
  }
  ['_build_helpers']() {
    var f = this['userData']['computed'], g = this['userData']['params'], h, j = this['userData']['parent']['userData']['params']['spec']['orientation'], k = g['spec']['orientation'], l = g['spec']['direction'], m = f['c_object'], g = (this['userData']['helpers'] ? this['_reset'](this['userData']['helpers']) : (this['userData']['helpers'] = new THREE['Group'](),
    this['userData']['helpers']['name'] = '__helpers',
    this['add'](this['userData']['helpers'])),
    this['_create_shape']()), f = this['_build_trajectory'](), q, u = new THREE['ExtrudeGeometry'](g,{
      'steps': 20,
      'bevelEnabled': false,
      'extrudePath': f
    });
    switch (j) {
      case 'h':
      u['rotateX'](Math['PI'] / 2),
      'v' == k && '-z' == l && u['rotateZ'](Math['PI']),
      'v' == k && 'z' == l && u['rotateY'](Math['PI'])['translate'](0, 0, m['parent_size']['z'] / units),
      'h' == k && '-z' == l && u['rotateY'](Math['PI'])['rotateX'](Math['PI'])['translate'](m['parent_size']['x'] / units, 0, 0);
      break;
      case 'v':
      u['rotateY'](Math['PI'] / 2),
      'v' == k && 'z' == l && u['rotateZ'](Math['PI'])['translate'](0, m['parent_size']['y'] / units, 0),
      'h' == k && 'z' == l && u['rotateX'](Math['PI'])['rotateZ'](Math['PI']),
      'h' == k && '-z' == l && u['translate'](0, 0, m['parent_size']['z'] / units);
      break;
      default:
      'v' == k && 'z' == l && u['rotateY'](Math['PI']),
      'v' == k && '-z' == l && u['rotateY'](Math['PI'])['rotateX'](Math['PI'])['translate'](0, m['parent_size']['y'] / units, 0),
      'h' == k && 'z' == l && u['rotateY'](Math['PI'])['translate'](m['parent_size']['x'] / units, 0, 0);
      break;
    }
    var g = new THREE['WireframeGeometry'](u)
    , f = new THREE['LineBasicMaterial']({
      'color': 3381759,
      'transparent': true,
      'opacity': 1,
      'depthTest': false
    })
    , j = new THREE['LineSegments'](g,f);
    j['userData']['is_helper'] = true,
    j['renderOrder'] = 20,
    j['visible'] = true,
    this['userData']['helpers']['add'](j),
    this['userData']['helpers']['visible'] = 1 == this['userData']['params']['helpers_visible'];
  }
  ['_build_helpers_edges']() {
    var f = this['userData']['computed'], g = this['userData']['params'], h, j = this['userData']['parent']['userData']['params']['spec']['orientation'], k = g['spec']['orientation'], l = g['spec']['direction'], m = f['c_object'], g = (this['userData']['helpers_edges'] ? this['_reset'](this['userData']['helpers_edges']) : (this['userData']['helpers_edges'] = new THREE['Group'](),
    this['userData']['helpers_edges']['name'] = '__helpers_edges',
    this['add'](this['userData']['helpers_edges'])),
    this['_create_shape']()), f = this['_build_trajectory'](), q, u = new THREE['ExtrudeGeometry'](g,{
      'steps': 20,
      'bevelEnabled': false,
      'extrudePath': f
    });
    switch (j) {
      case 'h':
      u['rotateX'](Math['PI'] / 2),
      'v' == k && '-z' == l && u['rotateZ'](Math['PI']),
      'v' == k && 'z' == l && u['rotateY'](Math['PI'])['translate'](0, 0, m['parent_size']['z'] / units),
      'h' == k && '-z' == l && u['rotateY'](Math['PI'])['rotateX'](Math['PI'])['translate'](m['parent_size']['x'] / units, 0, 0);
      break;
      case 'v':
      u['rotateY'](Math['PI'] / 2),
      'v' == k && 'z' == l && u['rotateZ'](Math['PI'])['translate'](0, m['parent_size']['y'] / units, 0),
      'h' == k && 'z' == l && u['rotateX'](Math['PI'])['rotateZ'](Math['PI']),
      'h' == k && '-z' == l && u['translate'](0, 0, m['parent_size']['z'] / units);
      break;
      default:
      'v' == k && 'z' == l && u['rotateY'](Math['PI']),
      'v' == k && '-z' == l && u['rotateY'](Math['PI'])['rotateX'](Math['PI'])['translate'](0, m['parent_size']['y'] / units, 0),
      'h' == k && 'z' == l && u['rotateY'](Math['PI'])['translate'](m['parent_size']['x'] / units, 0, 0);
      break;
    }
    var g = build_edges(u);
    g['visible'] = true,
    this['userData']['helpers_edges']['add'](g);
  }
  ['_create_shape']() {
    var f = this['userData']['params']
    , g = this['userData']['computed']
    , j = g['c_object']
    , k = g['size']['x']
    , m = g['size']['y']
    , q = (g['points'] = [],
    f['spec']['reverse'])
    , {cbl: v=0, cbr: w=0, ctl: A=0, ctr: B=0, d1: C=0, d2: D=0, w1: E=0, h1: F=0, w2: G=0, h2: H=0, r: I=0, o: J=''} = f['spec']['type_params']
    , v = comp2(v, j)
    , w = comp2(w, j)
    , A = comp2(A, j)
    , B = comp2(B, j)
    , C = comp2(C, j)
    , D = comp2(D, j)
    , E = comp2(E, j)
    , F = comp2(F, j)
    , G = comp2(G, j)
    , H = comp2(H, j)
    , I = comp2(I, j);
    switch (f['spec']['type']) {
      case 'angle':
      case 'dx_angle':
      g['points'] = [{
        'x': 0,
        'y': 0,
        'radius': 0
      }, {
        'x': k,
        'y': 0,
        'radius': 0
      }, {
        'x': 0,
        'y': m,
        'radius': 0
      }],
      q && (g['points'] = [{
        'x': 0,
        'y': 0,
        'radius': 0
      }, {
        'x': k,
        'y': 0,
        'radius': 0
      }, {
        'x': 0,
        'y': -m,
        'radius': 0
      }]);
      break;
      case 'radius':
      g['points'] = [{
        'center': {
          'x': 0,
          'y': 0
        },
        'radius': I,
        'dir': true
      }];
      break;
      case 'rounded_corners':
      g['points'] = [{
        'x': 0,
        'y': 0,
        'radius': v,
        'dir': true
      }, {
        'x': k,
        'y': 0,
        'radius': w,
        'dir': true
      }, {
        'x': k,
        'y': m,
        'radius': B,
        'dir': true
      }, {
        'x': 0,
        'y': m,
        'radius': A,
        'dir': true
      }];
      break;
      case 'trapeze_cut_by_offset':
      g['points'] = [{
        'x': E,
        'y': 0,
        'radius': 0
      }, {
        'x': k,
        'y': F,
        'radius': 0
      }, {
        'x': k - G,
        'y': m,
        'radius': 0
      }, {
        'x': H,
        'y': m,
        'radius': 0
      }];
      break;
      case 'cut_corners':
      g['points'] = [],
      0 < v ? (g['points']['push']({
        'x': 0,
        'y': v,
        'radius': 0
      }),
      g['points']['push']({
        'x': v,
        'y': 0,
        'radius': 0
      })) : g['points']['push']({
        'x': 0,
        'y': 0,
        'radius': 0
      }),
      0 < w ? (g['points']['push']({
        'x': k - w,
        'y': 0,
        'radius': 0
      }),
      g['points']['push']({
        'x': k,
        'y': w,
        'radius': 0
      })) : g['points']['push']({
        'x': k,
        'y': 0,
        'radius': 0
      }),
      0 < B ? (g['points']['push']({
        'x': k,
        'y': m - B,
        'radius': 0
      }),
      g['points']['push']({
        'x': k - B,
        'y': m,
        'radius': 0
      })) : g['points']['push']({
        'x': k,
        'y': m,
        'radius': 0
      }),
      0 < A ? (g['points']['push']({
        'x': A,
        'y': m,
        'radius': 0
      }),
      g['points']['push']({
        'x': 0,
        'y': m - A,
        'radius': 0
      })) : g['points']['push']({
        'x': 0,
        'y': m,
        'radius': 0
      });
      break;
      default:
      g['points'] = [{
        'x': 0,
        'y': 0,
        'radius': 0
      }, {
        'x': k,
        'y': 0,
        'radius': 0
      }, {
        'x': k,
        'y': m,
        'radius': 0
      }, {
        'x': 0,
        'y': m,
        'radius': 0
      }];
      break;
    }
    return p_shapes['common'](g['points']);
  }
  ['_build_pivot']() {
    var f = this['userData']['computed']
    , g = this['userData']['params']
    , h = this['userData']['own_object']
    , i = f['size']['x']
    , j = f['size']['y']
    , f = f['size']['z']
    , i = (g['pivot'] = {
      'x': -1,
      'y': -1,
      'z': -1
    },
    conv_pivot(g['pivot']['x'], i))
    , j = conv_pivot(g['pivot']['y'], j)
    , g = conv_pivot(g['pivot']['z'], f);
    h['translateX'](i / units),
    h['translateY'](j / units),
    h['translateZ'](g / units);
  }
  ['_build_pos']() {
    var f = this['userData']['computed']
    , g = this['userData']['params']
    , j = f['c_object']
    , k = g['spec']['orientation'];
    let l, m, q;
    var v = this['userData']['parent'], w = (v['userData']?.['computed']?.['real_size'] || v['userData']?.['computed']?.['size'])['z'], v = v['userData']?.['computed']?.['real_size'] || v['userData']?.['computed']['size'] || {}, x = this['userData']['params']['spec']['direction'], y = this['userData']['parent']['userData']['params']['spec']['orientation'] || 'f', z, z;
    switch (f['pos']['x'] = comp2(g['pos']['x'], j),
    f['pos']['y'] = comp2(g['pos']['y'], j),
    f['pos']['z'] = comp2(g['pos']['z'], j),
    'h' == k && (f['pos']['x'] = 0,
    g['spec']['reverse']) && (z = parseFloat(v['y']) - g['pos']['y'],
    f['pos']['y'] = comp2(z, j)),
    'v' == k && (f['pos']['y'] = 0,
    g['spec']['reverse']) && (z = parseFloat(v['x']) - g['pos']['x'],
    f['pos']['x'] = comp2(z, j)),
    y) {
      case 'h':
      'z' == x ? (l = (-j['parent_size']['x'] / 2 + f['pos']['x']) / units,
      m = (-j['parent_size']['y'] / 2 + f['pos']['z']) / units,
      q = (-j['parent_size']['z'] / 2 + f['pos']['y']) / units) : '-z' == x && (l = (-j['parent_size']['x'] / 2 + f['pos']['x']) / units,
      m = (-j['parent_size']['y'] / 2 - f['pos']['z'] + w) / units,
      q = (-j['parent_size']['z'] / 2 + f['pos']['y']) / units);
      break;
      case 'v':
      'z' == x ? (l = (-j['parent_size']['x'] / 2 + f['pos']['z']) / units,
      m = (-j['parent_size']['y'] / 2 + f['pos']['y']) / units,
      q = (-j['parent_size']['z'] / 2 + f['pos']['x']) / units) : '-z' == x && (l = (-j['parent_size']['x'] / 2 - f['pos']['z'] + w) / units,
      m = (-j['parent_size']['y'] / 2 + f['pos']['y']) / units,
      q = (-j['parent_size']['z'] / 2 + f['pos']['x']) / units);
      break;
      default:
      'z' == x ? (l = (-j['parent_size']['x'] / 2 + f['pos']['x']) / units,
      m = (-j['parent_size']['y'] / 2 + f['pos']['y']) / units,
      q = (-j['parent_size']['z'] / 2 + f['pos']['z']) / units) : '-z' == x && (l = (-j['parent_size']['x'] / 2 + f['pos']['x']) / units,
      m = (-j['parent_size']['y'] / 2 + f['pos']['y']) / units,
      q = (-j['parent_size']['z'] / 2 - f['pos']['z'] + w) / units);
      break;
    }
    this['position']['set'](l, m, q);
  }
  ['_build_spec']() {
    var f = this['userData']['computed']
    , g = this['userData']['params']
    , h = this['userData']['parent']
    , j = h['userData']['params']['spec']['orientation']
    , k = g['spec']['orientation']
    , l = g['spec']['direction']
    , g = this['_create_shape']()
    , m = this['_build_trajectory']();
    let q = f['pos']
    , v = (h['userData']?.['computed']?.['real_size'] || h['userData']?.['computed']?.['size'])['z'];
    var w = f['c_object']
    , h = (f['relative_points'] = f['points']['map'](y => ({
      ...y
    })),
    {
      'steps': 20,
      'bevelEnabled': false,
      'extrudePath': m
    })
    , x = new THREE['ExtrudeGeometry'](g,h);
    switch (j) {
      case 'h':
      x['rotateX'](Math['PI'] / 2),
      'v' == k && '-z' == l && x['rotateZ'](Math['PI']),
      'v' == k && 'z' == l && x['rotateY'](Math['PI'])['translate'](0, 0, w['parent_size']['z'] / units),
      'h' == k && '-z' == l && x['rotateY'](Math['PI'])['rotateX'](Math['PI'])['translate'](w['parent_size']['x'] / units, 0, 0),
      'z' == l && f['relative_points']['forEach'](y => {
        let z;
        void 0 !== y['x'] && (z = v - 2 * y['x'],
        y['x'] += z),
        y['center'] && (z = v - 2 * y['center']['x'],
        y['center']['x'] += z);
      }
      );
      break;
      case 'v':
      x['rotateY'](Math['PI'] / 2),
      'v' == k && 'z' == l && x['rotateZ'](Math['PI'])['translate'](0, w['parent_size']['y'] / units, 0),
      'h' == k && 'z' == l && x['rotateX'](Math['PI'])['rotateZ'](Math['PI']),
      'h' == k && '-z' == l && x['translate'](0, 0, w['parent_size']['z'] / units),
      'z' == l && f['relative_points']['forEach'](y => {
        let z;
        void 0 !== y['x'] && (z = v - 2 * y['x'],
        y['x'] += z),
        y['center'] && (z = v - y['center']['x'],
        y['center']['x'] += z);
      }
      );
      break;
      default:
      'v' == k && 'z' == l && x['rotateY'](Math['PI']),
      'v' == k && '-z' == l && x['rotateY'](Math['PI'])['rotateX'](Math['PI'])['translate'](0, w['parent_size']['y'] / units, 0),
      'h' == k && 'z' == l && x['rotateY'](Math['PI'])['translate'](w['parent_size']['x'] / units, 0, 0),
      '-z' == l && f['relative_points']['forEach'](y => {
        let z;
        void 0 !== y['x'] && (z = v - 2 * y['x'],
        y['x'] += z),
        y['center'] && (z = v - 2 * y['center']['x'],
        y['center']['x'] += z);
      }
      );
      break;
    }
    'h' == k && 'f' !== j && ('z' == l ? f['relative_points']['forEach'](y => {
      void 0 !== y['x'] && void 0 !== y['y'] && (y['x'] -= q['z'],
      y['y'] += q['y']),
      y['center'] && (y['center']['x'] -= q['z'],
      y['center']['y'] += q['y']);
    }
    ) : f['relative_points']['forEach'](y => {
      void 0 !== y['x'] && void 0 !== y['y'] && (y['x'] += q['z'],
      y['y'] += q['y']),
      y['center'] && (y['center']['x'] += q['z'],
      y['center']['y'] += q['y']);
    }
    )),
    'v' == k && 'f' !== j && ('z' == l ? f['relative_points']['forEach'](y => {
      void 0 !== y['x'] && void 0 !== y['y'] && (y['x'] -= q['z'],
      y['y'] += q['x']),
      y['center'] && (y['center']['x'] -= q['z'],
      y['center']['y'] += q['x']);
    }
    ) : f['relative_points']['forEach'](y => {
      void 0 !== y['x'] && void 0 !== y['y'] && (y['x'] += q['z'],
      y['y'] += q['x']),
      y['center'] && (y['center']['x'] += q['z'],
      y['center']['y'] += q['x']);
    }
    )),
    'h' == k && 'f' == j && ('z' == l ? f['relative_points']['forEach'](y => {
      void 0 !== y['x'] && void 0 !== y['y'] && (y['x'] += q['z'],
      y['y'] += q['y']),
      y['center'] && (y['center']['x'] += q['z'],
      y['center']['y'] += q['y']);
    }
    ) : f['relative_points']['forEach'](y => {
      void 0 !== y['x'] && void 0 !== y['y'] && (y['x'] -= q['z'],
      y['y'] += q['y']),
      y['center'] && (y['center']['x'] -= q['z'],
      y['center']['y'] += q['y']);
    }
    )),
    'v' == k && 'f' == j && ('z' == l ? f['relative_points']['forEach'](y => {
      void 0 !== y['x'] && void 0 !== y['y'] && (y['x'] += q['z'],
      y['y'] += q['x']),
      y['center'] && (y['center']['x'] += q['z'],
      y['center']['y'] += q['x']);
    }
    ) : f['relative_points']['forEach'](y => {
      void 0 !== y['x'] && void 0 !== y['y'] && (y['x'] -= q['z'],
      y['y'] += q['x']),
      y['center'] && (y['center']['x'] -= q['z'],
      y['center']['y'] += q['x']);
    }
    )),
    x['translate'](-f['size']['x'] / 2 / units, -f['size']['y'] / 2 / units, 0);
    var m = pp['three']['materials']['cabinet_path']
    , g = new THREE['Mesh'](x,m);
    g['castShadow'] = false,
    g['receiveShadow'] = false,
    g['userData']['edgesModeType'] = ObjectType['Path'],
    g['visible'] = false,
    this['userData']['own_object']['add'](g);
  }
  ['_after_build']() {
    'edges' == global_options['mode'] && this['_build_helpers_edges']();
  }
}
let def_cabinet_size = _['merge'](copy_object(cabinet_def_common), {
  'type': 'size',
  'spec': {
    'axis': 'x1',
    'line_pos': 80,
    'length': 100,
    'is_text': 0,
    'level': 0,
    'arrows': 1,
    'use_css2d': 0,
    'css_mode': 0,
    'text_size': 0,
    'text_scale': 100,
    'arrow_scale': 100
  }
});
class CabinetSize extends CabinetSection {
  static['p_table'] = {
    'x1': {
      'x': -1,
      'y': -1,
      'z': -1
    },
    'x2': {
      'x': -1,
      'y': 1,
      'z': -1
    },
    'y1': {
      'x': 1,
      'y': -1,
      'z': -1
    },
    'y2': {
      'x': -1,
      'y': -1,
      'z': -1
    },
    'z1': {
      'x': -1,
      'y': -1,
      'z': -1
    },
    'z2': {
      'x': -1,
      'y': -1,
      'z': -1
    }
  };
  constructor(f={}, g={}, h={}) {
    super(f, g, h);
  }
  ['_before_params'](f, g, h) {
    this['userData']['class'] = this.constructor['name'],
    this['temp_type'] = this.constructor['name'],
    f['type'] || (f['type'] = 'size');
  }
  ['_build_computed']() {
    super['_build_computed'](),
    this['userData']['computed']['text_scale'] = parseInt(this['userData']['params']['spec']['text_scale']) / 100,
    this['userData']['computed']['arrow_scale'] = parseInt(this['userData']['params']['spec']['arrow_scale']) / 100;
  }
  ['_before_build']() {
    var f = this['userData']['computed']
    , g = this['userData']['params'];
    'x' == g['spec']['axis'] && (g['spec']['axis'] = 'x1'),
    g['pivot'] = CabinetSize['p_table'][g['spec']['axis']];
  }
  ['_build_size']() {
    var f = this['userData']['computed']
    , g = this['userData']['params']
    , h = f['c_object']
    , i = g['spec']['length'] + 60;
    switch (g['spec']['axis'][0]) {
      case 'x':
      f['size']['x'] = comp2(g['size']['x'], h),
      f['size']['y'] = i,
      f['size']['z'] = 1;
      break;
      case 'y':
      f['size']['x'] = i,
      f['size']['y'] = comp2(g['size']['x'], h),
      f['size']['z'] = 1;
      break;
      case 'z':
      f['size']['x'] = 1,
      f['size']['y'] = i,
      f['size']['z'] = comp2(g['size']['x'], h);
      break;
    }
    f['u_size'] = f['size']['clone']()['divideScalar'](units);
  }
  ['_build_spec']() {
    var f;
    super['_build_spec'](),
    this['userData']['params']['spec']['text_size'] ? this['_build_text_size']() : this['_build_size_obj']();
  }
  ['full_dispose']() {
    var f;
    this['label'] && (this['label']?.['element'] && (f = this['label']['element'])['parentNode'] && f['parentNode']['removeChild'] && f['parentNode']['removeChild'](f),
    this['label']['parent'] && this['label']['parent']['remove'](this['label']),
    this['label'] = null),
    this['userData']['children']['forEach'](g => {
      g['full_dispose'] && g['full_dispose']();
    }
    );
  }
  ['_build_size_obj']() {
    var f = this['userData']['computed']
    , g = this['userData']['params']
    , h = 100 * g['spec']['level']
    , i = new Sizes_obj({
      'width': f['u_size'][g['spec']['axis'][0]],
      'text': f['size'][g['spec']['axis'][0]],
      'length': (g['spec']['length'] + h) / units,
      'middle_line_position': (g['spec']['line_pos'] + h) / units,
      'text_scale': f['text_scale'],
      'arrow_scale': f['arrow_scale'],
      'css_mode': g['spec']['css_mode'],
      'use_css2d': g['spec']['use_css2d'],
      'axis': g['spec']['axis'][0]
    });
    switch (g['spec']['axis'][0]) {
      case 'x':
      switch (g['spec']['axis'][1]) {
        case '1':
        i['position']['y'] -= f['u_size']['y'] / 2;
        break;
        case '2':
        i['position']['y'] += f['u_size']['y'] / 2,
        i['rotation']['z'] = Math['PI'];
        break;
      }
      break;
      case 'y':
      switch (g['spec']['axis'][1]) {
        case '1':
        i['position']['x'] += f['u_size']['x'] / 2,
        i['rotation']['z'] = Math['PI'] / 2;
        break;
        case '2':
        i['position']['x'] -= f['u_size']['x'] / 2,
        i['rotation']['z'] = -Math['PI'] / 2;
        break;
      }
      break;
      case 'z':
      switch (g['spec']['axis'][1]) {
        case '1':
        i['rotation']['y'] = -Math['PI'] / 2,
        i['position']['y'] -= f['u_size']['y'] / 2;
        break;
        case '2':
        i['rotation']['y'] = Math['PI'] / 2,
        i['position']['y'] -= f['u_size']['y'] / 2;
        break;
      }
      break;
    }
    this['userData']['own_object']['add'](i);
  }
  ['_build_text_size']() {
    var f = this['userData']['params']
    , g = this['userData']['computed']
    , h = 100 * f['spec']['level']
    , h = {
      'width': g['u_size'][f['spec']['axis'][0]],
      'text': g['size'][f['spec']['axis'][0]],
      'length': (f['spec']['length'] + h) / units,
      'middle_line_position': (f['spec']['line_pos'] + h) / units,
      'text_scale': g['text_scale'],
      'arrow_scale': g['arrow_scale'],
      'axis': f['spec']['axis'][0]
    };
    'z' == f['spec']['axis'][0] && (this['position']['y'] -= g['u_size']['y'] / 2);
    let i = make_css2d_dimension_sizes(h, f['spec']['axis'][0] || 'x');
    i['addEventListener']('mousedown', j => {
      j['stopPropagation'](),
      j['preventDefault']();
    }
    ),
    i['addEventListener']('click', j => {
      j['stopPropagation'](),
      j['preventDefault'](),
      this['_enter_text_edit_mode'](i);
    }
    );
    var g = new THREE['CSS2DObject'](i);
    g['element']['style']['transform'] = 'translate(-50%,\x20-50%)',
    this['label'] = g,
    this['userData']['own_object']['add'](g);
  }
  ['_enter_text_edit_mode'](f) {
    if (!global_options['size_edit_mode']['active']) {
      global_options['size_edit_mode']['active'] = true,
      global_options['size_edit_mode']['size_obj'] = this,
      controls['enabled'] = false,
      dControls['enabled'] = false;
      var g = this['userData']['params']['spec']['axis'][0], g = this['userData']['computed']['size'][g], h;
      if (f['children'][0]) {
        let j = document['createElement']('input')
        , k = (j['type'] = 'text',
        j['inputMode'] = 'numeric',
        j['pattern'] = '[0-9]*',
        j['value'] = g,
        j['style']['display'] = 'inline-block',
        j['style']['padding'] = '2px\x206px',
        j['style']['backgroundColor'] = 'white',
        j['style']['color'] = 'black',
        j['style']['border'] = '1px\x20solid\x20black',
        j['style']['borderRadius'] = '5px',
        j['style']['fontFamily'] = 'Arial,\x20sans-serif',
        j['style']['fontSize'] = '14px',
        j['style']['fontWeight'] = 'bold',
        j['style']['lineHeight'] = '1',
        j['style']['whiteSpace'] = 'nowrap',
        j['style']['textAlign'] = 'center',
        j['style']['outline'] = 'none',
        j['style']['boxShadow'] = 'none',
        j['style']['appearance'] = 'textfield',
        j['style']['mozAppearance'] = 'textfield',
        j['style']['width'] = Math['max'](10 * String(g)['length'] + 20, 40) + 'px',
        f['innerHTML'] = '',
        f['appendChild'](j),
        j['focus'](),
        j['select'](),
        false)
        , l = () => {
          var m, m;
          k || (k = true,
          '' !== (m = j['value']['trim']()) && (m = Number(m),
          Number['isFinite'](m) && this['_apply_text_size'](m),
          this['_exit_text_edit_mode'](f)));
        }
        ;
        j['addEventListener']('keydown', m => {
          m['stopPropagation'](),
          'Enter' === m['key'] && l(),
          'Escape' === m['key'] && l();
        }
        ),
        j['addEventListener']('input', () => {
          j['value'] = j['value']['replace'](/[^0-9]/g, '');
        }
        ),
        j['addEventListener']('blur', l);
      }
    }
  }
  ['_exit_text_edit_mode'](f) {
    global_options['size_edit_mode']['active'] = false,
    global_options['size_edit_mode']['size_obj'] = null,
    controls['enabled'] = true,
    dControls['enabled'] = true,
    f['innerHTML'] = this['userData']['computed']['size'][this['userData']['params']['spec']['axis'][0]];
  }
  ['_apply_text_size'](f) {
    var g = this['userData']['params'];
    if (this['userData']['params']['obj_path']) {
      var h = this['userData']['params']['spec']['axis'][0]
      , j = this['userData']['params']['obj_path']
      , k = this['userData']['root']['get_child_by_path'](j);
      if (k instanceof Module) {
        var f = parseFloat(f) || 0;
        let q = 0;
        if (pp['events']['size']['add_offset_text_size'] && (q = parseFloat(pp['events']['size']['add_offset_text_size'](this))),
        3 == global_options['additional_sizes_mode'] || 4 == global_options['additional_sizes_mode']) {
          var m, p = (k['userData']['params']['pivot'][h] + 1) * k['userData']['computed']['size'][h] / 2;
          let u = f - g['spec']['section_pos'][h] + p + q;
          4 == global_options['additional_sizes_mode'] && (u = f + p + q);
          var f = g['spec']['section_size'][h] - k['userData']['computed']['size'][h] + p;
          (u = u < 0 ? 0 : u) > f && (u = f),
          this['userData']['root']['change_param_by_path'](j, 'pos.' + h, u, true),
          this['userData']['root']['_build_sizes']();
        }
      }
    }
  }
  ['_update_size']() {
    this['_build_size']();
    var f = this['userData']['computed']
    , g = this['userData']['params']
    , h = this['userData']['own_object']['children'];
    if (0 < h.length)
    for (let k = 0; k < h.length; k++) {
      var j = h[k];
      j['params'] && (j['params']['width'] = f['u_size'][g['spec']['axis'][0]],
      j['params']['text'] = f['size'][g['spec']['axis'][0]],
      j['params']['length'] = g['spec']['length'] / units,
      j['build']) && j['build']();
    }
  }
  ['_update_text_size'](f, g, h=null) {
    if (this['label']) {
      var j = this['userData']['computed'], k, m = this['userData']['params']['spec']['axis'][0], q = h['userData']['root'], u = g['userData']['computed']['size'], v = new THREE['Vector3'](), w = (v['copy'](q['position']),
      new THREE['Vector3']());
      w['copy'](f);
      let x = 0;
      pp['events']['size']['add_offset_text_size'] && (x = pp['events']['size']['add_offset_text_size'](q, g));
      let y;
      var f = h['userData']['computed']['world'] || CabinetAnalyzer['get_root_params'](h);
      q['uuid'] !== h['userData']['root']['uuid'] ? this['visible'] = false : (this['visible'] = true,
      3 == global_options['additional_sizes_mode'] ? ('y' == m && (y = Math['abs']((w['y'] - v['y']) * units)['toFixed']()),
      'x' == m && (y = Math['abs']((w['x'] - (v['x'] - q['userData']['computed']['u_size']['x'] / 2)) * units - u['x'] / 2 - x)['toFixed']()),
      y = parseFloat(y)) : ('y' == m && (y = Math['abs']((w['y'] - v['y']) * units - f['pos']['y'])['toFixed']()),
      'x' == m && (y = Math['abs']((w['x'] - (v['x'] - q['userData']['computed']['u_size']['x'] / 2)) * units - u['x'] / 2 - f['pos']['x'])['toFixed']())),
      this['label']['element'] && this['label']['element']['children'][0] && (this['label']['element']['children'][0]['textContent'] = y - x),
      pp['events']['size']['update_text_size'] && pp['events']['size']['update_text_size'](this));
    }
  }
}
function make_css2d_dimension_sizes(f) {
  var g = document['createElement']('div')
  , h = document['createElement']('div');
  return h['textContent'] = f['text'],
  h['style']['display'] = 'inline-block',
  h['style']['padding'] = '2px\x206px',
  h['style']['backgroundColor'] = 'white',
  h['style']['color'] = 'black',
  h['style']['border'] = '1px\x20solid\x20black',
  h['style']['borderRadius'] = '5px',
  h['style']['fontFamily'] = 'Arial,\x20sans-serif',
  h['style']['fontSize'] = '14px',
  h['style']['fontWeight'] = 'bold',
  h['style']['zIndex'] = '1',
  h['style']['position'] = 'relative',
  h['style']['whiteSpace'] = 'nowrap',
  h['style']['lineHeight'] = '1',
  h['style']['pointerEvents'] = 'auto',
  g['className'] = 'dimension-label',
  g['style']['position'] = 'relative',
  g['style']['userSelect'] = 'none',
  g['style']['pointerEvents'] = 'auto',
  g['style']['display'] = 'flex',
  g['style']['flexDirection'] = 'column',
  g['style']['alignItems'] = 'center',
  g['style']['position'] = 'relative',
  g['appendChild'](h),
  g;
}
let def_cabinet_tabletop = _['merge'](copy_object(cabinet_def_common), {
  'type': 'tabletop',
  'spec': {
    'name': '',
    'code': '',
    'group': 'tabletop',
    'type': 'common',
    'can_group': 1,
    'can_euro': 1,
    'type_params': {
      'corners_equal': 1,
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
    'key': '',
    'shape': null,
    'material': {
      'id': 0,
      'variant_id': 0
    },
    'plints': {
      'enabled': 1,
      'material': 0,
      'back': 1,
      'right': 0,
      'left': 0
    },
    'can_change': {
      'id': 1
    }
  },
  'resizable': {
    'locks': 'y'
  },
  'size': {
    'x': 100,
    'y': 100
  }
});
class CabinetTabletop extends CabinetSection {
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
  ['_before_build']() {
    var f = this['userData']['params'], g = this['userData']['computed'], h = this['userData']['parent_params'], j = this['userData']['params']['spec']['material']['group'], k, l = this['userData']['root']['userData']['computed'], m = f['spec']['material']['id'], f = f['spec']['material']['variant_id'], m;
    g['key'] = this['userData']['params']['spec']['key'],
    g['material'] = pp['libs']['tabletop']['get_item'](m),
    g['decor'] = this['userData']['computed']['material']['params']['material'],
    constructor_settings['core_v2'] && (m = parseInt(g['material']['params']['variants'][f]?.['width'])) && Number['isFinite'](m) && (this['userData']['params']['spec']['cuts']['len'] = m),
    this['userData']['washers'] && this['userData']['washers']['length'] && (this['userData']['washers'] = []);
  }
  ['_build_size']() {
    var f = this['userData']['computed']
    , g = this['userData']['params']
    , h = f['c_object']
    , j = g['spec']['material']['id']
    , k = g['spec']['material']['variant_id'];
    f['size']['x'] = comp2(g['size']['x'], h),
    f['size']['y'] = get_tabletop_thickness(j, k),
    f['size']['z'] = comp2(g['size']['z'], h),
    f['u_size'] = f['size']['clone']()['divideScalar'](units);
  }
  ['_build_pivot']() {
    var f = this['userData']['params'], g = this['userData']['computed'], h = this['userData']['own_object'], j, k, f, j = conv_pivot(f['pivot']['x'], g['size']['x']), k = conv_pivot(f['pivot']['y'], g['size']['y']), f = conv_pivot(f['pivot']['z'], g['size']['z']);
    h['translateX'](j / units),
    h['translateY'](k / units),
    h['translateZ'](f / units),
    this['userData']['cuts']['position']['copy'](h['position']);
  }
  ['_after_build']() {
    this['_apply_material'](),
    'edges' == global_options['mode'] && this['edges_mode']();
  }
  ['_build_spec']() {
    var f = this['userData']['params']
    , g = this['userData']['computed']
    , {shape: h, bortOffsets: i} = this['_create_shape']()
    , i = (this['userData']['bortOffsets'] = i,
    g['size']['y'])
    , h = new THREE['ExtrudeBufferGeometry'](h,{
      'steps': 1,
      'depth': i / units,
      'bevelEnabled': false
    })
    , i = (h['translate'](0, 0, -i / units / 2),
    h['rotateX'](-Math['PI'] / 2),
    correct_buffer_uv_simple(h, g['size']['x'] / units, g['size']['z'] / units),
    new THREE['Mesh'](h,red_mat))
    , g = (i['castShadow'] = true,
    i['receiveShadow'] = true,
    i['userData']['edgesModeType'] = ObjectType['Tabletop'],
    this['userData']['own_object']['add'](i),
    this['userData']['cuts']['edge_mesh'] && this['_reset'](this['userData']['cuts']['edge_mesh']),
    this['userData']['cuts']['edge_opaque'] && this['_reset'](this['userData']['cuts']['edge_opaque']),
    build_edges(h['clone']()))
    , i = (this['userData']['cuts']['edge_mesh'] = g,
    this['userData']['cuts']['add'](g),
    new THREE['Mesh'](h['clone'](),edges_opacue_mat));
    this['userData']['cuts']['edge_opaque'] = i,
    this['userData']['cuts']['add'](i);
  }
  ['_build_struct']() {
    super['_build_struct'](),
    this['userData']['cuts'] = new THREE['Group'](),
    this['userData']['cuts']['name'] = '__cuts',
    this['userData']['struct'][this['userData']['cuts']['name']] = this['userData']['cuts'],
    this['add'](this['userData']['cuts']),
    this['userData']['cuts']['visible'] = false;
    var e = new THREE['Group']()
    , e = (this['userData']['cuts']['add'](e),
    this['userData']['cuts']['connects'] = e,
    new THREE['Group']());
    this['userData']['cuts']['add'](e),
    this['userData']['cuts']['connects_sizes'] = e;
  }
  ['_build_helpers']() {
    var f = this['userData']['computed'], g = this['userData']['params'], h, j, g, k = (this['userData']['helpers'] ? this['_reset'](this['userData']['helpers']) : (this['userData']['helpers'] = new THREE['Group'](),
    this['userData']['helpers']['name'] = '__helpers',
    this['add'](this['userData']['helpers'])),
    h = conv_pivot(g['pivot']['x'], f['size']['x']),
    j = conv_pivot(g['pivot']['y'], f['size']['y']),
    g = conv_pivot(g['pivot']['z'], f['size']['z']),
    make_cube(f['size']['x'] / units, f['size']['y'] / units, f['size']['z'] / units, pp['three']['materials']['helper_cube'])), k = (k['position']['set'](h / units, j / units, g / units),
    this['userData']['helpers']['userData']['size_volume'] = k,
    this['userData']['helpers']['add'](k),
    make_edges(f['size']['x'] / units, f['size']['y'] / units, f['size']['z'] / units, new THREE['LineBasicMaterial']({
      'color': '#000000',
      'depthTest': false
    })));
    k['position']['set'](h / units, j / units, g / units),
    k['userData']['no_edges'] = 1,
    k['renderOrder'] = 11,
    this['userData']['helpers']['add'](k),
    this['userData']['helpers']['rotation']['copy'](this['userData']['own_object']['rotation']),
    1 == this['userData']['params']['helpers_visible'] && (this['userData']['helpers']['visible'] = true);
  }
  ['_apply_material']() {
    var f = this['userData']['computed']
    , g = this['userData']['params']
    , h = '' + f['material']['params']['mat_mode'] == '0' ? f['material']['params']['mat_params'] : materials_lib['get_item'](f['decor']);
    void 0 === h['add_params'] && (h['add_params'] = {}),
    h['add_params']['model_width'] = f['size']['x'],
    h['add_params']['model_height'] = f['size']['z'];
    for (let i = 0; i < this['userData']['own_object']['children']['length']; i++)
    dispose_material(this['userData']['own_object']['children'][i]['material']),
    this['userData']['own_object']['children'][i]['material'] = create_material(h);
  }
  ['change_material'](f, g) {
    var h = this['userData']['computed']
    , j = this['userData']['params'];
    let k = this['userData']['root'];
    if (!constructor_settings['core_v2'] || j['spec']['can_change']?.['id']) {
      var f = f, g = g, l, m;
      j['spec']['material']['id'] = f,
      j['spec']['material']['variant_id'] = g;
      let q;
      (q = k['userData']['params'] && 'module' === k['userData']['params']['type'] ? k : _['get'](this['userData'], 'parent.parent')) && (l = q['get_child_by_path'](this['userData']['path'], true),
      m = _['get'](l, 'spec.material'),
      l) && m && (m['id'] = f,
      m['variant_id'] = g || 0),
      h['material'] = pp['libs']['tabletop']['get_item'](f),
      h['decor'] = h['material']['params']['material'];
      var p = '' + h['material']['params']['mat_mode'] == '0' ? h['material']['params']['mat_params'] : materials_lib['get_item'](h['decor'])
      , l = (void 0 === p['add_params'] && (p['add_params'] = {}),
      p['add_params']['model_width'] = h['size']['x'],
      p['add_params']['model_height'] = h['size']['y'],
      p['add_params']['stretch_width'] = 0,
      p['add_params']['stretch_height'] = 0,
      get_tabletop_thickness(f, g))
      , m = h['size']['z'] !== l;
      for (let u = 0; u < this['userData']['own_object']['children']['length']; u++)
      dispose_material(this['userData']['own_object']['children'][u]['material']),
      this['userData']['own_object']['children'][u]['material'] = create_material(p);
      if (m) {
        if (constructor_settings['core_v2']) {
          let v = this['userData']['is_root'] ? this : this['userData']['root'];
          var f = j['resizable']?.['extend_size']
          , g = (this['_rebuild'](),
          v['userData']['extend_size_info']);
          g && (g['need_update'] = true),
          f && v?.['_build_fast']();
        } else
        this['_rebuild']();
      }
    }
  }
  ['set_cut_mode'](f) {
    var g = this['userData']['cuts']['connects']
    , f = Boolean(f);
    this['userData']['own_object']['visible'] = !f,
    this['userData']['cuts']['visible'] = f,
    g.length || this['build_connections'](),
    f && this['build_conn_sizes']();
  }
  ['build_connections']() {
    var f = this['userData']['computed']['size']
    , g = this['userData']['params']['spec']['cuts']
    , h = this['userData']['cuts']['connects'];
    for (let k = h['children']['length']; k--; )
    this['_reset'](h['children'][k]);
    if (h['children']['length'] = 0,
    g['connects']['length']) {
      g['connects']['sort']();
      for (let l = 0; l < g['connects']['length']; l++) {
        let m;
        constructor_settings['core_v2'] ? (m = this['make_connect_mesh'](f['y'] / units, f['z'] / units))['position']['x'] = -f['x'] / units / 2 + g['connects'][l] : ((m = this['make_connect_mesh'](f['z'] / units, f['y'] / units))['position']['y'] += f['z'] / units / 2,
        m['position']['x'] = -f['x'] / units / 2 + g['connects'][l]),
        m['no_edges'] = true,
        h['add'](m);
      }
    } else {
      if (!(f['x'] <= g['len'])) {
        var j = Math['floor'](f['x'] / g['len']);
        for (let n = 1; n < j + 1; n++) {
          let o;
          constructor_settings['core_v2'] ? (o = this['make_connect_mesh'](f['y'] / units, f['z'] / units))['position']['x'] = -f['x'] / units / 2 + n * g['len'] / units : ((o = this['make_connect_mesh'](f['z'] / units, f['y'] / units))['position']['y'] += f['z'] / units / 2,
          o['position']['x'] = -f['x'] / units / 2 + n * g['len'] / units),
          o['no_edges'] = true,
          h['add'](o),
          g['connects']['push'](n * g['len'] / units);
        }
      }
    }
  }
  ['build_conn_sizes']() {
    var f = this['userData']['computed']['size'], g = this['userData']['params']['spec']['cuts'], j = this['userData']['cuts']['connects_sizes'], k = f['x'] / units / 2, l;
    for (l of this['userData']['cuts']['connects']['children'])
    l['position']['x'] < -k || Math['abs'](l['position']['x'] + k) < 0.4 ? l['position']['x'] = -k : (l['position']['x'] > k || Math['abs'](l['position']['x'] - k) < 0.4) && (l['position']['x'] = k);
    var m = _['sortBy'](this['userData']['cuts']['connects']['children'], 'position.x');
    for (let A = j['children']['length']; A--; )
    j['children'][A]['full_dispose']();
    var q = []
    , v = j['children']['length'] = 0;
    let w = 0;
    for (let B = 0; B < m.length; B++) {
      var x = m[B];
      let C, D = (C = 0 == B ? parseInt(f['x'] / 2 + x['position']['x'] * units) : parseInt(Math['abs'](x['position']['x'] - m[B - 1]['position']['x']) * units)) > g['len'] ? 1 : 0, E = new Sizes_obj({
        'width': C / units,
        'text': parseInt(C),
        'font_size': 50,
        'wrong': D
      });
      constructor_settings['core_v2'] ? (E['position']['y'] = f['y'] / units / 2,
      E['position']['z'] = f['z'] / units / 2) : E['position']['y'] = f['z'] / units / 2,
      0 == B ? E['position']['x'] = x['position']['x'] - parseInt(f['x'] / 2 + x['position']['x'] * units) / units / 2 : E['position']['x'] = x['position']['x'] - Math['abs'](x['position']['x'] - m[B - 1]['position']['x']) / 2,
      q.push(x['position']['x'] + f['x'] / units / 2),
      E['rotateX'](-PI / 2),
      j['add'](E),
      w += C;
    }
    let y = (v = f['x'] - w) > g['len'] ? 1 : 0
    , z = new Sizes_obj({
      'width': v / units,
      'text': parseInt(v),
      'font_size': 50,
      'wrong': y
    });
    constructor_settings['core_v2'] ? (z['position']['y'] = f['y'] / units / 2,
    z['position']['z'] = f['z'] / units / 2) : z['position']['y'] = f['z'] / units / 2,
    z['position']['x'] = f['x'] / units / 2 - v / units / 2,
    z['rotateX'](-PI / 2),
    j['add'](z),
    this['set_connects'](q);
  }
  ['set_connects'](f) {
    var g = this['userData'], h;
    if (this['userData']['params']['spec']['cuts']['connects'] = f,
    constructor_settings['core_v2']) {
      if (!g['root'])
      return;
      let j = module_utils['get_child_params_by_path'](g['root'], g['path']);
      return j ? void (j['spec']['cuts']['connects'] = f) : void 0;
    }
    var i = _['get'](g, 'parent.parent');
    if (i) {
      let k = i['get_child_by_path'](g['path'], true);
      k && (k['spec']['cuts']['connects'] = f);
    }
  }
  ['add_connection'](f) {
    var g = this['userData']['computed'];
    let h;
    constructor_settings['core_v2'] ? (h = this['make_connect_mesh'](g['size']['y'] / units, g['size']['z'] / units))['position']['x'] = f['x'] : ((h = this['make_connect_mesh'](g['size']['z'] / units, g['size']['y'] / units))['position']['y'] += g['size']['z'] / units / 2,
    h['position']['x'] = f['x']),
    h['no_edges'] = true,
    this['userData']['cuts']['connects']['add'](h),
    this['build_conn_sizes']();
  }
  ['remove_connection'](e) {
    this['userData']['cuts']['connects']['remove'](e),
    this['build_conn_sizes']();
  }
  ['resize_connects'](f) {
    var g = this['userData']['params']['spec']['cuts']['connects'];
    if (!g.length)
    return false;
    let h = void 0 === f ? this['userData']['computed']['size']['x'] / units : f;
    _['remove'](g, i => i > h),
    this['set_connects'](g),
    this['update_auto_connects']();
  }
  ['update_auto_connects']() {
    var f = this['userData']['params']['spec']['cuts']
    , g = this['userData']['computed']['size'];
    !f['connects']['length'] && g['x'] > f['len'] && this['build_connections']();
  }
  ['make_connect_mesh'](f, g, h=0) {
    var f = new THREE['BoxBufferGeometry'](1,f,g);
    return new THREE['Mesh'](f,new THREE['MeshPhongMaterial']({
      'color': '#880000',
      'depthTest': false,
      'depthWrite': false,
      'side': THREE['DoubleSide'],
      'transparent': false,
      'opacity': 1
    }));
  }
  ['_create_shape']() {
    var f = this['userData']['params']['spec']['type_params'], g = this['userData']['computed']['u_size'], h, h, h;
    let i = null;
    return this['_is_straight']() ? {
      'shape': build_shape['square'](g['x'], g['z']),
      'bortOffsets': i
    } : f['corners_equal'] ? (h = this['_get_radius'](f['c1']['val']) / units,
    'straight' !== f['c1']['type'] && (i = {
      'c1': h,
      'c2': h,
      'c3': h,
      'c4': h
    }),
    h = {
      'type': f['c1']['type'],
      'val': h
    },
    {
      'shape': build_shape['tabletop'](g['x'], g['z'], {
        'c1': h,
        'c2': h,
        'c3': h,
        'c4': h
      }),
      'bortOffsets': i
    }) : (h = {
      'c1': {
        'type': f['c1']['type'],
        'val': this['_get_radius'](f['c1']['val']) / units
      },
      'c2': {
        'type': f['c2']['type'],
        'val': this['_get_radius'](f['c2']['val']) / units
      },
      'c3': {
        'type': f['c3']['type'],
        'val': this['_get_radius'](f['c3']['val']) / units
      },
      'c4': {
        'type': f['c4']['type'],
        'val': this['_get_radius'](f['c4']['val']) / units
      }
    },
    i = {
      'c1': 'straight' === h['c1']['type'] ? 0 : h['c1']['val'],
      'c2': 'straight' === h['c2']['type'] ? 0 : h['c2']['val'],
      'c3': 'straight' === h['c3']['type'] ? 0 : h['c3']['val'],
      'c4': 'straight' === h['c4']['type'] ? 0 : h['c4']['val']
    },
    {
      'shape': build_shape['tabletop'](g['x'], g['z'], h),
      'bortOffsets': i
    });
  }
  ['_is_straight']() {
    var e = this['userData']['params']['spec']['type_params'];
    return !e || (e['corners_equal'] ? 'straight' === e['c1']['type'] : 'straight' === e['c1']['type'] && 'straight' === e['c2']['type'] && 'straight' === e['c3']['type'] && 'straight' === e['c4']['type']);
  }
  ['_get_radius'](f) {
    let g = f;
    var f;
    return '0' !== g && ('string' == typeof g && (g = g['endsWith']('%') ? (f = this['userData']['computed']['size'],
    parseFloat(g['slice'](0, -1)) / 100 * Math['min'](f['x'], f['z'])) : parseFloat(g)),
    Number['isFinite'](g)) ? g : 0;
  }
  ['_set_cut_mode']() {}
}
let def_cabinet_wall = _['merge'](copy_object(cabinet_def_common), {
  'type': 'wall',
  'spec': {
    'name': '',
    'code': '',
    'orientation': 'f',
    'group': 'wall',
    'type': 'common',
    'type_params': {},
    'points': [],
    'butts': [],
    'holes': [],
    'key': 'front',
    'shape': null,
    'material': {
      'group': 'g0',
      'key': 'ldsp',
      'key_lock': '',
      'thickness_lock': 0,
      'id': 0,
      'variant_id': 0,
      'rotated': 0
    },
    'show_index': 1,
    'n_map': 0,
    'n_scale': 1
  },
  'size': {
    'x': 100,
    'y': 100
  }
});
class CabinetWall extends CabinetSection {
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
    f['type'] || (f['type'] = 'wall');
  }
  ['_build_computed']() {
    super['_build_computed']();
    var f = this['userData']['computed']
    , g = this['userData']['params'];
    f['real_size'] = new THREE['Vector3'](),
    f['size_with_butts'] = new THREE['Vector3'](),
    f['size_without_butts'] = new THREE['Vector3'](),
    f['name'] = g['name'],
    f['code'] = g['spec']['code'];
  }
  ['_before_build']() {
    var f = this['userData']['params']
    , g = this['userData']['computed']
    , h = this['userData']['root']
    , j = (g['key'] = f['spec']['key'],
    {
      'group': f['spec']['material']['group'],
      'key': f['spec']['material']['key'],
      'id': f['spec']['material']['id'],
      'variant_id': f['spec']['material']['variant_id'],
      'rotated': f['spec']['material']['rotated'],
      'fixed': f['spec']['material']['fixed'],
      'thickness': 0,
      'key_lock': f['spec']['material']['key_lock'],
      'thickness_lock': f['spec']['material']['thickness_lock'],
      'mat_mode': '0',
      'mat_item': null,
      'mat_params': null
    });
    if (is_empty_id(j['id'])) {
      let n = this['userData']['local_parent'] || this['userData']['root'];
      for (; n?.['userData']['params']; ) {
        var k = n['userData']['computed']['materials']?.[j['group']];
        if (!is_empty_id(k?.['material']?.['id'])) {
          var l = module_utils['find_material_variant_to_change'](j, k['material']);
          if (null !== l) {
            j['group'] = k['material']['group'] || j['group'],
            j['key'] = k['material']['key'],
            j['id'] = k['material']['id'],
            j['variant_id'] = l,
            j['rotated'] = k['material']['rotated'],
            n = null;
            break;
          }
        }
        n = n['userData']['is_root'] ? null : n['userData']['local_parent'] || n['userData']['root'];
      }
    }
    let m;
    (m = pp['libs']['materials'][j['key']] ? pp['libs']['materials'][j['key']]['get_item'](j['id']) : m) || (j['key'] = 'ldsp',
    j['id'] = 0,
    j['variant_id'] = 0,
    m = pp['libs']['materials']['ldsp']['get_item'](0)),
    j['mat_mode'] = m['params']['mat_mode'],
    j['mat_item'] = m,
    j['mat_params'] = '' + m['params']['mat_mode'] == '0' ? m['params']['mat_params'] : materials_lib['get_item'](m['params']['material']),
    'normal' == j['mat_params']['add_params']['wrapping'] && (j['mat_params']['add_params']['wrapping'] = 'repeat');
    var f = _['get'](m, 'params.variants[' + (j['variant_id'] || 0) + '].thickness')
    , f = parseInt(f, 10);
    j['thickness'] = f,
    0 == j['thickness'] && (j['thickness'] = 1),
    j['rotated'] && (j['mat_params']['add_params']['rotation'] = 'rotated'),
    g['material'] = j;
  }
  ['_build_size']() {
    var f = this['userData']['computed']
    , g = this['userData']['params'];
    let h = f['c_object'];
    var i = f['material'];
    switch (f['points'] = g['spec']['points']['map'](j => ({
      'x': void 0 !== j['x'] ? comp2(j['x'], h) : null,
      'y': void 0 !== j['y'] ? comp2(j['y'], h) : null,
      'radius': j['radius'] || 0,
      'center': j['center'] ? {
        'x': comp2(j['center']['x'], h),
        'y': comp2(j['center']['y'], h)
      } : null,
      'dir': j['dir'] || false
    })),
    g['spec']['orientation'][0]) {
      case 'h':
      f['size']['x'] = comp2(g['size']['x'], h),
      f['size']['y'] = i['thickness'],
      f['size']['z'] = comp2(g['size']['z'], h),
      f['real_size']['x'] = f['size']['x'],
      f['real_size']['y'] = f['size']['z'],
      f['real_size']['z'] = f['size']['y'],
      f['size_with_butts']['x'] = f['size']['x'],
      f['size_with_butts']['y'] = f['size']['z'],
      f['size_with_butts']['z'] = f['size']['y'];
      break;
      case 'v':
      f['size']['x'] = i['thickness'],
      f['size']['y'] = comp2(g['size']['y'], h),
      f['size']['z'] = comp2(g['size']['z'], h),
      f['real_size']['x'] = f['size']['z'],
      f['real_size']['y'] = f['size']['y'],
      f['real_size']['z'] = f['size']['x'],
      f['size_with_butts']['x'] = f['size']['z'],
      f['size_with_butts']['y'] = f['size']['y'],
      f['size_with_butts']['z'] = f['size']['x'];
      break;
      case 'f':
      f['size']['x'] = comp2(g['size']['x'], h),
      f['size']['y'] = comp2(g['size']['y'], h),
      f['size']['z'] = i['thickness'],
      f['real_size']['x'] = f['size']['x'],
      f['real_size']['y'] = f['size']['y'],
      f['real_size']['z'] = f['size']['z'],
      f['size_with_butts']['x'] = f['size']['x'],
      f['size_with_butts']['y'] = f['size']['y'],
      f['size_with_butts']['z'] = f['size']['z'];
      break;
    }
    f['size_without_butts'] = f['real_size']['clone'](),
    f['u_size'] = f['size']['clone']()['divideScalar'](units),
    f['u_real_size'] = f['real_size']['clone']()['divideScalar'](units),
    f['u_size_with_butts'] = f['size_with_butts']['clone']()['divideScalar'](units);
  }
  ['_build_pivot']() {
    var f = this['userData']['params'], g = this['userData']['computed'], h = this['userData']['own_object'], j, j, j;
    let k, m, n = 0, o = 0;
    f['_pivot_offset'] = {
      'x': 0,
      'y': 0
    },
    'string' == typeof f['pivot']['x'] && (j = f['pivot']['x']['split']('::'),
    f['pivot']['x'] = parseFloat(j[0]),
    n = parseFloat(j[1]),
    f['_pivot_offset']['x'] = n),
    'string' == typeof f['pivot']['y'] && (j = f['pivot']['y']['split']('::'),
    f['pivot']['y'] = parseFloat(j[0]),
    o = parseFloat(j[1]),
    f['_pivot_offset']['y'] = o),
    k = conv_pivot(f['pivot']['x'], g['size']['x']),
    m = conv_pivot(f['pivot']['y'], g['size']['y']),
    j = conv_pivot(f['pivot']['z'], g['size']['z']),
    n && (k += n),
    o && (m += o),
    h['translateX'](k / units),
    h['translateY'](m / units),
    h['translateZ'](j / units);
  }
  ['_after_build']() {
    this['_apply_material'](),
    'edges' == global_options['mode'] && this['edges_mode'](),
    super['_after_build'](),
    this['updateMatrixWorld'](true),
    this['_update_evaluate']();
  }
  ['_rebuild']() {
    super['_rebuild']();
  }
  ['_build_spec']() {
    let q = this['userData']['params'], B = this['userData']['computed'], C = B['c_object'], G, H;
    var I = B['u_real_size']['z'], J, K, L, L, O, P;
    this['userData']['butts_info'] = {};
    let {cbl: Q=0, cbr: R=0, ctl: S=0, ctr: T=0, d1: U=0, d2: W=0, w1: Z=0, h1: a0=0, w2: a1=0, h2: a2=0, o: a3='', r: a4=0, r_concave: a5=0} = q['spec']['type_params'];
    Q = comp2(Q, C),
    R = comp2(R, C),
    S = comp2(S, C),
    T = comp2(T, C),
    U = comp2(U, C),
    W = comp2(W, C),
    Z = comp2(Z, C),
    a0 = comp2(a0, C),
    a1 = comp2(a1, C),
    a2 = comp2(a2, C),
    a4 = comp2(a4, C),
    a5 = comp2(a5, C);
    let a6;
    switch (q['spec']['type']) {
      case 'cut_corners':
      B['points'] = [],
      0 < Q ? (B['points']['push']({
        'x': 0,
        'y': Q,
        'radius': 0
      }),
      B['points']['push']({
        'x': Q,
        'y': 0,
        'radius': 0
      })) : B['points']['push']({
        'x': 0,
        'y': 0,
        'radius': 0
      }),
      0 < R ? (B['points']['push']({
        'x': B['real_size']['x'] - R,
        'y': 0,
        'radius': 0
      }),
      B['points']['push']({
        'x': B['real_size']['x'],
        'y': R,
        'radius': 0
      })) : B['points']['push']({
        'x': B['real_size']['x'],
        'y': 0,
        'radius': 0
      }),
      0 < T ? (B['points']['push']({
        'x': B['real_size']['x'],
        'y': B['real_size']['y'] - T,
        'radius': 0
      }),
      B['points']['push']({
        'x': B['real_size']['x'] - T,
        'y': B['real_size']['y'],
        'radius': 0
      })) : B['points']['push']({
        'x': B['real_size']['x'],
        'y': B['real_size']['y'],
        'radius': 0
      }),
      0 < S ? (B['points']['push']({
        'x': S,
        'y': B['real_size']['y'],
        'radius': 0
      }),
      B['points']['push']({
        'x': 0,
        'y': B['real_size']['y'] - S,
        'radius': 0
      })) : B['points']['push']({
        'x': 0,
        'y': B['real_size']['y'],
        'radius': 0
      }),
      B['original_points'] = B['points']['map'](ag => ({
        ...ag
      })),
      0 < q['spec']['butts']['length'] && (this['_build_butts'](),
      this['_get_butts_offsets']()),
      H = p_shapes['common'](B['points']);
      break;
      case 'triangle':
      switch (B['points'] = [],
      q['spec']['type_params']['corner']) {
        case 'tr':
        B['points'] = [{
          'x': B['real_size']['x'],
          'y': 0,
          'radius': 0
        }, {
          'x': B['real_size']['x'],
          'y': B['real_size']['y'],
          'radius': 0
        }, {
          'x': 0,
          'y': B['real_size']['y'],
          'radius': 0
        }];
        break;
        case 'tl':
        B['points'] = [{
          'x': 0,
          'y': 0,
          'radius': 0
        }, {
          'x': B['real_size']['x'],
          'y': B['real_size']['y'],
          'radius': 0
        }, {
          'x': 0,
          'y': B['real_size']['y'],
          'radius': 0
        }];
        break;
        case 'br':
        B['points'] = [{
          'x': 0,
          'y': 0,
          'radius': 0
        }, {
          'x': B['real_size']['x'],
          'y': 0,
          'radius': 0
        }, {
          'x': B['real_size']['x'],
          'y': B['real_size']['y'],
          'radius': 0
        }];
        break;
        case 'bl':
        B['points'] = [{
          'x': 0,
          'y': 0,
          'radius': 0
        }, {
          'x': B['real_size']['x'],
          'y': 0,
          'radius': 0
        }, {
          'x': 0,
          'y': B['real_size']['y'],
          'radius': 0
        }];
        break;
      }
      B['original_points'] = B['points']['map'](ag => ({
        ...ag
      })),
      0 < q['spec']['butts']['length'] && (this['_build_butts'](),
      this['_get_butts_offsets']()),
      H = p_shapes['common'](B['points']);
      break;
      case 'rounded_corners':
      B['points'] = [{
        'x': 0,
        'y': 0,
        'radius': Q,
        'dir': true
      }, {
        'x': B['real_size']['x'],
        'y': 0,
        'radius': R,
        'dir': true
      }, {
        'x': B['real_size']['x'],
        'y': B['real_size']['y'],
        'radius': T,
        'dir': true
      }, {
        'x': 0,
        'y': B['real_size']['y'],
        'radius': S,
        'dir': true
      }],
      B['original_points'] = B['points']['map'](ag => ({
        ...ag
      })),
      0 < q['spec']['butts']['length'] && (this['_build_butts'](),
      this['_get_butts_offsets']()),
      H = p_shapes['common'](B['points']);
      break;
      case 'trapeze_cut_by_offset':
      B['points'] = [{
        'x': Z,
        'y': 0,
        'radius': 0
      }, {
        'x': B['real_size']['x'],
        'y': a0,
        'radius': 0
      }, {
        'x': B['real_size']['x'] - a1,
        'y': B['real_size']['y'],
        'radius': 0
      }, {
        'x': 0,
        'y': B['real_size']['y'] - a2,
        'radius': 0
      }],
      B['original_points'] = B['points']['map'](ag => ({
        ...ag
      })),
      0 < q['spec']['butts']['length'] && (this['_build_butts'](),
      this['_get_butts_offsets']()),
      H = p_shapes['common'](B['points']);
      break;
      case 'l_shape':
      switch (a3) {
        case 'ctl':
        B['points'] = [{
          'x': 0,
          'y': 0,
          'radius': 0
        }, {
          'x': B['real_size']['x'],
          'y': 0,
          'radius': 0
        }, {
          'x': B['real_size']['x'],
          'y': B['real_size']['y'],
          'radius': 0
        }, {
          'x': W,
          'y': B['real_size']['y'],
          'radius': a4,
          'dir': true
        }, {
          'x': W,
          'y': B['real_size']['y'] - U,
          'radius': a5,
          'dir': false
        }, {
          'x': 0,
          'y': B['real_size']['y'] - U,
          'radius': a4,
          'dir': true
        }
      ];
