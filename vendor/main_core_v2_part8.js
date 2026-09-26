 this['reset_model'] = function() {
            var k, l = [], m = [];
            if (g['traverse'](function(n) {
                g !== n && ('Group' !== n['type'] ? l : m)['push'](n);
            }),
            l['length']) {
                for (k = l['length'] - 0x1; -0x1 < k; k--)
                    l[k]['parent']['remove'](l[k]),
                    l[k]['geometry'] && l[k]['geometry']['dispose'](),
                    l[k]['material'] && l[k]['material']['map'] && l[k]['material']['map']['dispose'](),
                    l['splice'](l['indexOf'](l[k]), 0x1);
            }
            if (m['length']) {
                for (k = m['length'] - 0x1; -0x1 < k; k--)
                    m[k]['parent']['remove'](m[k]),
                    m['splice'](m['indexOf'](l[k]), 0x1);
            }
        }
        ,
        this['edges_mode'] = function() {
            PPObject['prototype']['edges_mode_traverse']['call'](this, this['model'], !0x0);
        }
        ,
        this['design_mode'] = PPObject['prototype']['design_mode'],
        this['get_specs'] = function() {
            let k = {};
            return k = 'common' == this['params']['type'] ? {
                'id': this['params']['id'],
                'width': this['params']['width'],
                'type': 'common',
                'is_gola': 0x0
            } : 'facade_profile' == this['params']['type'] ? {
                'id': this['params']['id'],
                'width': this['params']['width'],
                'type': 'facade_profile',
                'is_gola': 0x0
            } : 'overhead' == this['params']['type'] ? {
                'id': this['params']['id'],
                'width': this['params']['width'],
                'type': 'common',
                'is_gola': 0x0
            } : 'overhead_profile' == this['params']['type'] ? {
                'id': this['params']['id'],
                'width': this['params']['width'],
                'type': 'overhead_profile',
                'is_gola': 0x0
            } : {
                'id': this['params']['id'],
                'width': this['params']['width'],
                'type': 'gola',
                'gola_type': g['params']['model_type'],
                'is_gola': 0x1
            };
        }
        ,
        this['build']();
    }
}
class Locker_new extends THREE['Group'] {
    constructor(f) {
        super(f);
        var g = this, h;
        this['type'] = 'Locker',
        this['o_type'] = 'Locker',
        this['name'] = 'Locker_object',
        f = f || {},
        this['userData'] = {};
        let j;
        j = void 0x0 !== f['glass_material'] ? f['glass_material'] : project_settings['selected_materials']['glass'] || void 0x0,
        this['params'] = {
            'active': void 0x0 === f['active'] || f['active'],
            'version': void 0x0 !== f['version'] ? f['version'] : 0x1,
            'width': void 0x0 !== f['width'] ? f['width'] : 0x258,
            'height': void 0x0 !== f['height'] ? f['height'] : 0x168,
            'depth': void 0x0 !== f['depth'] ? f['depth'] : 0x212,
            'thickness': void 0x0 !== f['thickness'] ? f['thickness'] : 0x10,
            'thickness_bottom': void 0x0 !== f['thickness_bottom'] ? f['thickness_bottom'] : 0x3,
            'handle_orientation': void 0x0 !== f['handle_orientation'] ? f['handle_orientation'] : 'horizontal',
            'handle_position': void 0x0 !== f['handle_position'] ? f['handle_position'] : 'middle',
            'handle_model_type': void 0x0 !== f['handle_model_type'] ? f['handle_model_type'] : 'common',
            'handles_double': void 0x0 !== f['handles_double'] ? f['handles_double'] : 0x0,
            'handle_active': void 0x0 === f['handle_active'] || f['handle_active'],
            'no_handle_forced': void 0x0 !== f['no_handle_forced'] && f['no_handle_forced'],
            'model': void 0x0 !== f['model'] ? f['model'] : void 0x0,
            'facade': void 0x0 !== f['facade'] ? f['facade'] : void 0x0,
            'type': void 0x0 !== f['type'] ? f['type'] : null,
            'type_params': void 0x0 !== f['type_params'] ? f['type_params'] : null,
            'l_type': void 0x0 !== f['l_type'] ? f['l_type'] : null,
            'fixed_facade_model': void 0x0 !== f['fixed_facade_model'] ? f['fixed_facade_model'] : void 0x0,
            'facade_thickness': void 0x0 !== f['facade_thickness'] ? f['facade_thickness'] : 0x12,
            'style': void 0x0 !== f['style'] ? f['style'] : 'full',
            'top_facade_offset': void 0x0 !== f['top_facade_offset'] ? f['top_facade_offset'] : '50%',
            'bottom_facade_offset': void 0x0 !== f['bottom_facade_offset'] ? f['bottom_facade_offset'] : 0x14,
            'left_facade_offset': void 0x0 !== f['left_facade_offset'] ? f['left_facade_offset'] : 0x19,
            'right_facade_offset': void 0x0 !== f['right_facade_offset'] ? f['right_facade_offset'] : 0x19,
            'furniture_available': void 0x0 === f['furniture_available'] || f['furniture_available'],
            'locker_height': void 0x0 !== f['locker_height'] ? f['locker_height'] : 0xc8,
            'inner': void 0x0 !== f['inner'] && f['inner'],
            'group': void 0x0 !== f['group'] ? f['group'] : 'top',
            'models': void 0x0 !== f['models'] ? f['models'] : [],
            'models_only': void 0x0 !== f['models_only'] && f['models_only'],
            'pX': void 0x0 !== f['pX'] ? f['pX'] : 0x0,
            'pY': void 0x0 !== f['pY'] ? f['pY'] : 0x0,
            'pZ': void 0x0 !== f['pZ'] ? f['pZ'] : 0x0,
            'material': void 0x0 !== f['material'] ? f['material'] : 0x0,
            'material_rotated': void 0x0 !== f['material_rotated'] && f['material_rotated'],
            'glass_material': void 0x0 !== f['glass_material'] ? f['glass_material'] : j,
            'additional_materials': void 0x0 !== f['additional_materials'] ? f['additional_materials'] : {},
            'params_locked': void 0x0 !== f['params_locked'] && f['params_locked'],
            'corpus_material': void 0x0 !== f['corpus_material'] ? f['corpus_material'] : void 0x0,
            'fixed_corpus_material': void 0x0 !== f['fixed_corpus_material'] ? f['fixed_corpus_material'] : void 0x0,
            'walls_visible': void 0x0 === f['walls_visible'] || f['walls_visible'],
            'walls_active': void 0x0 === f['walls_active'] || f['walls_active'],
            'tag': void 0x0 !== f['tag'] ? f['tag'] : ''
        },
        null == this['params']['facade'] && (this['params']['facade'] = project_settings['defaults']['facades'][this['params']['group']]);
        var k = facades_lib['get_item'](this['params']['facade']);
        k['thickness'] ? this['params']['facade_thickness'] = k['thickness'] : this['params']['facade_thickness'] = 0x12,
        this['params']['handle_model'] = void 0x0 !== f['handle_model'] ? f['handle_model'] : project_settings['handle'][this['params']['group']]['model'],
        this['params']['handle_size_index'] = void 0x0 !== f['handle_size_index'] ? f['handle_size_index'] : project_settings['handle'][this['params']['group']]['preferable_size'],
        custom_settings['fixed_locker_material'] && (this['params']['fixed_corpus_material'] = custom_settings['fixed_locker_material']),
        project_settings['door_thickness'] && (this['params']['facade_thickness'] = 0x18),
        this['params']['handle_offset'] = facades_lib['get_item'](this['params']['facade'])['handle_offset'],
        null == this['params']['handle_offset'] && (this['params']['handle_offset'] = 0x19),
        this['params']['handle_offset'] = parseInt(this['params']['handle_offset']),
        this['par_index'] = f['index'],
        this['params_link'] = f['params_link'],
        this['locker'] = new THREE['Group'](),
        this['locker']['name'] = 'Locker_model',
        this['locker']['o_type'] = 'as',
        this['add'](this['locker']),
        this['animated'] = 0x0,
        0x1 == project_settings['handle'][this['params']['group']]['no_handle'] && (this['params']['no_handle_forced'] = !0x0),
        0x0 == this['params']['no_handle_forced'] && void 0x0 !== this['params']['handle_model'] && ('gola' === this['params']['handle_model']['type'] && (this['params']['handle_model'] = project_settings['handle'][this['params']['group']]['model']),
        this['params']['gola'] = to_int(!0x0 === project_settings['handle'][this['params']['group']]['model']['is_gola']),
        this['params']['handle_model']['type'] || (this['params']['handle_model']['type'] = 'common'),
        'facade_profile' !== this['params']['handle_model']['type'] || 0x1 == project_settings['handle'][this['params']['group']]['no_handle'] || 0x0 == facades_lib['get_item'](this['params']['facade'])['handle'] || this['params']['no_handle_forced'] || (this['params']['height'] -= this['params']['handle_model']['sizes'][0x0]['height'] - g['params']['handle_model']['sizes'][0x0]['offset_y'],
        'top' === this['params']['group'] && (this['params']['pY'] += (this['params']['handle_model']['sizes'][0x0]['height'] - g['params']['handle_model']['sizes'][0x0]['offset_y']) / units))),
        'string' == typeof this['params']['top_facade_offset'] && (this['params']['top_facade_offset'] = (this['params']['height'] - this['params']['bottom_facade_offset']) * parseFloat(this['params']['top_facade_offset']) / 0x64),
        null != this['params']['fixed_corpus_material'] && (this['params']['corpus_material'] = this['params']['fixed_corpus_material']),
        this['params']['version'] < 0x2 && (this['params_link'][this['par_index']]['material'] = this['params']['material']),
        this['userData']['state'] = {
            'is_open': !0x1,
            'is_moving': !0x1,
            'starting_pos': 0x0
        },
        this['userData']['animation'] = {
            'push': 0x0,
            'percent': 0x50,
            'dovod': 0x1
        },
        this['build'](),
        this['load_model']();
    }
}
Locker_new['prototype']['build'] = function() {
    if (this['reset_model'](),
    this['userData']['state'] = {
        'is_open': !0x1,
        'is_moving': !0x1,
        'starting_pos': 0x0
    },
    this['userData']['animation'] = {
        'push': 0x0,
        'percent': 0x50,
        'dovod': 0x1
    },
    0x2 == lockers_version)
        this['build_by_type_v2']();
    else {
        if (null != this['params']['type'] && !this['params']['models']['length'])
            return default_locker_type && 0x2 == lockers_version ? void this['build_by_type_v2']() : void this['build_by_type']();
        this['animated'] = 0x0;
        var f = this['params'];
        if ('custom' === project_settings['lo_type'] || 0x1 == constructor_settings['custom_lockers']) {
            if (!0x1 === this['params']['models_only'] && !0x1 !== this['params']['walls_visible']) {
                let h = ''
                  , j = 0x0
                  , k = (j = 0xb4 < f['height'] ? (h = '/common_assets/models/custom/ya1.fbx',
                this['params']['inner'] && (h = '/common_assets/models/custom/ya1_inn.fbx'),
                0xb2) : (h = '/common_assets/models/custom/ya2.fbx',
                this['params']['inner'] && (h = '/common_assets/models/custom/ya2_inn.fbx'),
                0x57),
                f['depth']);
                this['params']['inner'] && (k = f['depth'] - 0xa);
                var g = new Decoration({
                    'model': h,
                    'width': f['width'] - 0x20,
                    'height': j,
                    'thickness': k,
                    'name': 'LOCKER_BLUM'
                });
                g['position']['x'] = f['width'] / units / 0x2,
                g['position']['y'] = g['params']['height'] / units / 0x2 + project_settings['door_offset'] / units,
                this['params']['inner'] && (g['position']['z'] = -0.5),
                this['locker']['add'](g);
            }
            this['locker']['position']['z'] = -f['depth'] / 0x2 / units,
            this['build_facade'](),
            this['build_handle'](),
            this['position']['set'](f['pX'], f['pY'], f['pZ']);
        } else {
            let l = f['height'] / units - f['top_facade_offset'] / units - f['bottom_facade_offset'] / units
              , m = (f['inner'] && (l = f['height'] / units),
            f['bottom_facade_offset'] / 0x2 / units + (f['height'] - f['top_facade_offset']) / 0x2 / units);
            if (f['inner'] && (m = f['height'] / 0x2 / units),
            f['walls_active'] && (this['bottom_wall'] = new Object_wall({
                'width': f['width'] / units - f['left_facade_offset'] / units - f['right_facade_offset'] / units,
                'height': f['thickness_bottom'] / units,
                'thickness': f['depth'] / units,
                'pX': f['width'] / 0x2 / units,
                'pY': f['thickness_bottom'] / 0x2 / units + f['bottom_facade_offset'] / units,
                'name': 'bottom_wall',
                'material': null == f['fixed_corpus_material'] ? f['corpus_material'] : f['fixed_corpus_material']
            }),
            this['left_wall'] = new Object_wall({
                'width': f['depth'] / units,
                'height': l,
                'thickness': f['thickness'] / units,
                'pX': f['left_facade_offset'] / units + f['thickness'] / 0x2 / units,
                'pY': m,
                'rY': Math['PI'] / 0x2,
                'material': null == f['fixed_corpus_material'] ? f['corpus_material'] : f['fixed_corpus_material']
            }),
            this['right_wall'] = new Object_wall({
                'width': f['depth'] / units,
                'height': l,
                'thickness': f['thickness'] / units,
                'pX': f['width'] / units - f['right_facade_offset'] / units - f['thickness'] / 0x2 / units,
                'pY': m,
                'rY': Math['PI'] / 0x2,
                'material': null == f['fixed_corpus_material'] ? f['corpus_material'] : f['fixed_corpus_material']
            }),
            this['back_wall'] = new Object_wall({
                'width': f['width'] / units - f['left_facade_offset'] / units - f['right_facade_offset'] / units - f['thickness'] / units * 0x2,
                'height': l,
                'thickness': f['thickness'] / units,
                'pX': f['width'] / units / 0x2,
                'pY': m,
                'pZ': -f['depth'] / units / 0x2 + f['thickness'] / 0x2 / units,
                'material': null == f['fixed_corpus_material'] ? f['corpus_material'] : f['fixed_corpus_material']
            }),
            this['params']['inner'] && (this['front_wall'] = new Object_wall({
                'width': f['width'] / units - f['left_facade_offset'] / units - f['right_facade_offset'] / units - f['thickness'] / units * 0x2,
                'height': l,
                'thickness': f['thickness'] / units,
                'pX': f['width'] / units / 0x2,
                'pY': m,
                'pZ': f['depth'] / units / 0x2 - f['thickness'] / 0x2 / units,
                'material': null == f['fixed_corpus_material'] ? f['corpus_material'] : f['fixed_corpus_material']
            })),
            this['locker']['add'](this['bottom_wall']),
            this['locker']['add'](this['left_wall']),
            this['locker']['add'](this['right_wall']),
            this['locker']['add'](this['back_wall']),
            this['params']['inner'] && this['locker']['add'](this['front_wall']),
            !0x1 === this['params']['walls_visible']) && (this['bottom_wall']['visible'] = !0x1,
            this['left_wall']['visible'] = !0x1,
            this['right_wall']['visible'] = !0x1,
            this['back_wall']['visible'] = !0x1,
            this['params']['inner']) && (this['front_wall']['visible'] = !0x1),
            this['locker']['position']['z'] = -f['depth'] / 0x2 / units,
            constructor_settings['furniture_available'] && f['furniture_available']) {
                let n = new THREE['Mesh'](furniture_models['napr_corp'],aluminium_material);
                n['name'] = 'furni',
                n['position']['set'](this['params']['thickness'] / units + furniture_models['napr_corp']['sizes']['x'] / 0x2, 0x5, -furniture_models['napr_corp']['sizes']['z'] / 0x2 - 0x2),
                this['add'](n),
                n['scale']['z'] = this['params']['depth'] / units / furniture_models['napr_corp']['sizes']['z'],
                n['position']['z'] = -furniture_models['napr_corp']['sizes']['z'] / 0x2 * n['scale']['z'],
                (n = new THREE['Mesh'](furniture_models['napr_locker'],aluminium_material))['name'] = 'furni',
                n['position']['set'](f['left_facade_offset'] / units / 0x2 + furniture_models['napr_locker']['sizes']['x'] / 0x2, 0x5, 0x0),
                this['locker']['add'](n),
                n['scale']['z'] = this['params']['depth'] / units / furniture_models['napr_locker']['sizes']['z'],
                (n = new THREE['Mesh'](furniture_models['napr_corp'],aluminium_material))['name'] = 'furni',
                n['rotation']['z'] = Math['PI'],
                n['position']['set'](f['width'] / units - this['params']['thickness'] / units - furniture_models['napr_corp']['sizes']['x'] / 0x2, 0x5, -furniture_models['napr_corp']['sizes']['z'] / 0x2 - 0x2),
                this['add'](n),
                n['scale']['z'] = this['params']['depth'] / units / furniture_models['napr_corp']['sizes']['z'],
                n['position']['z'] = -furniture_models['napr_corp']['sizes']['z'] / 0x2 * n['scale']['z'],
                (n = new THREE['Mesh'](furniture_models['napr_locker'],aluminium_material))['name'] = 'furni',
                n['rotation']['z'] = Math['PI'],
                n['position']['set'](f['width'] / units - f['right_facade_offset'] / units / 0x2 - furniture_models['napr_locker']['sizes']['x'] / 0x2, 0x5, 0x0),
                n['scale']['z'] = this['params']['depth'] / units / furniture_models['napr_locker']['sizes']['z'],
                this['locker']['add'](n);
            }
            f['models'] && this['build_models'](),
            this['build_facade'](),
            this['build_handle'](),
            this['position']['set'](f['pX'], f['pY'], f['pZ']),
            this['check_fixed_facade']();
        }
    }
}
,
Locker_new['prototype']['build_models'] = function() {
    let f = this;
    for (let g = 0x0; g < this['params']['models']['length']; g++) {
        function h(j) {
            var k, j = _['merge']({
                'spec': {
                    'catalog': 'tech',
                    'absolute_size': !0x1,
                    'id': 0xa,
                    'use_model_size': !0x1,
                    'compatible': {
                        'items': [],
                        'categories': []
                    },
                    'sizes': []
                },
                'size': {
                    'x': '100%',
                    'y': '100%',
                    'z': '100%'
                },
                'pos': {
                    'x': 0x0,
                    'y': 0x0,
                    'z': 0x0
                },
                'pivot': {
                    'x': -0x1,
                    'y': -0x1,
                    'z': -0x1
                },
                'rot': {
                    'x': 0x0,
                    'y': 0x0,
                    'z': 0x0
                }
            }, j);
            let m = f['params']['width']
              , q = f['params']['height']
              , u = f['params']['depth'];
            j['spec']['absolute_size'] || (m -= f['params']['left_facade_offset'] + f['params']['right_facade_offset'] + 0x2 * f['params']['thickness'],
            f['params']['walls_active'] && (u -= f['params']['thickness']),
            f['params']['inner'] ? u -= f['params']['thickness'] : q -= f['params']['top_facade_offset']),
            j['size']['x'] = convert_size(j['size']['x'], m),
            j['size']['y'] = convert_size(j['size']['y'], q),
            j['size']['z'] = convert_size(j['size']['z'], u);
            var v = {
                'x': 0x0,
                'y': -j['size']['y'] / 0x2 / units,
                'z': -f['params']['depth'] / 0x2 / units
            }
              , w = (j['spec']['absolute_size'] || (v['y'] = -j['size']['y'] / 0x2 / units,
            f['params']['inner'] || -0x1 == j['pivot']['y'] && (v['y'] += f['params']['thickness_bottom'] / 0x2 / units + f['params']['bottom_facade_offset'] / units),
            v['x'] += f['params']['left_facade_offset'] / units,
            v['x'] += f['params']['thickness'] / units,
            v['z'] += f['params']['thickness'] / units),
            models_lib[j['spec']['catalog']]['get_item'](j['spec']['id']))
              , x = (w['draggable'] = !0x1,
            w['sizes_available'] = !0x1,
            {})
              , y = (x['x'] = conv_val(j['pos']['x'], m) / units,
            x['y'] = conv_val(j['pos']['y'], q) / units,
            x['z'] = conv_val(j['pos']['z'], u) / units,
            {});
            y['x'] = conv_pivot(j['pivot']['x'], j['size']['x']),
            y['y'] = conv_pivot(j['pivot']['y'], j['size']['y']),
            y['z'] = conv_pivot(j['pivot']['z'], j['size']['z']),
            w['variants'][0x0]['width'] = j['size']['x'],
            w['variants'][0x0]['height'] = j['size']['y'],
            w['variants'][0x0]['depth'] = j['size']['z'];
            let z = new Model_new(w);
            z['position']['set'](v['x'] + x['x'], v['y'] + x['y'], v['z'] + x['z']),
            z['translateX'](y['x'] / units),
            z['translateY'](y['y'] / units),
            z['translateZ'](y['z'] / units),
            f['locker']['add'](z),
            setTimeout(function() {
                z['load_model']();
            }, 0x64),
            cl();
        }
        function i(j) {
            j['width'] || (j['width'] = '100%'),
            j['height'] || (j['height'] = '100%'),
            j['depth'] || (j['depth'] = '100%'),
            j['pX'] || (j['pX'] = 0x0),
            j['pY'] || (j['pY'] = 0x0),
            j['pZ'] || (j['pZ'] = 0x0),
            j['rX'] || (j['rX'] = 0x0),
            j['rY'] || (j['rY'] = 0x0),
            j['rZ'] || (j['rZ'] = 0x0);
            var k = copy_object(find_obj_by_id(models_catalog['items'], j['id']));
            'string' == typeof j['width'] ? k['variants'][0x0]['width'] = (params['width'] - 0x20) * parseFloat(j['width']) / 0x64 : k['variants'][0x0]['width'] = j['width'],
            k['variants'][0x0]['height'] = 'string' == typeof j['height'] ? params['height'] * parseFloat(j['height']) / 0x64 : j['height'],
            k['variants'][0x0]['depth'] = 'string' == typeof j['depth'] ? params['depth'] * parseFloat(j['depth']) / 0x64 : j['depth'],
            'string' == typeof j['starting_point_x'] && (j['pX'] = params['width'] * parseFloat(j['starting_point_x']) / 0x64 / units),
            j['pY'] += 0.2;
            let l = new Model_new(k);
            l['position']['set'](j['pX'], j['pY'], j['pZ']),
            this['locker']['add'](l),
            setTimeout(function() {
                l['load_model']();
            }, 0x64);
        }
        (this['params']['models'][g]['spec'] ? h : i)(this['params']['models'][g]);
    }
}
,
Locker_new['prototype']['build_by_type'] = function() {
    let f = this['params']
      , g = f['type_params']
      , j = copy_object(lockers_types[f['type']])
      , k = null;
    g['params']['facade_offset'] = copy_object(j['params']['facade_offset']),
    g['is_inner'] || (g['is_inner'] = '0'),
    j['move_types'][g['move_type']] || (g['move_type'] = Object['keys'](j['move_types'])[0x0]),
    j['move'][g['move']] || (g['move'] = Object['keys'](j['move'])[0x0]),
    Object['keys'](j['types'])['forEach'](function(B) {
        0x1 == g['is_inner'] ? 0x1 == j['types'][B]['is_inner'] && f['height'] >= j['types'][B]['min_facade_height'] && f['height'] <= j['types'][B]['max_facade_height'] && (k = B) : 0x1 != j['types'][B]['is_inner'] && f['height'] >= j['types'][B]['min_facade_height'] && f['height'] <= j['types'][B]['max_facade_height'] && (k = B);
    }),
    k = k || Object['keys'](j['types'])[0x0];
    var m = f['depth'] + 0x5;
    let q = 0x0;
    var u = j['types'][k]['items'][g['move_type']][g['move']];
    for (let B = 0x0; B < u['length']; B++)
        m >= u[B]['min_depth'] && (q = u[B]['lead_depth']);
    var v = q - g['params']['offset']['side']
      , w = q - g['params']['offset']['bottom'];
    g['selected_type'] = k,
    g['lead_depth'] = q;
    let x = 0x0;
    var y = lockers_types[f['type']]['params']['height_mode'], y = (x = 'constant' == y ? lockers_types[f['type']]['types'][k]['height'] / units : this['params']['height'] / units - lockers_types[f['type']]['types'][k]['height'] / units - g['params']['facade_offset']['bottom'] / units) / 0x2 + g['params']['facade_offset']['bottom'] / units, y, z;
    let A = null == f['fixed_corpus_material'] ? f['corpus_material'] : f['fixed_corpus_material'];
    0x1 == j['params']['bottom_enabled'] && (j['bottom_types'][g['bottom_type']] || (g['bottom_type'] = Object['keys'](j['bottom_types'])[0x0]),
    'corpus' != j['bottom_types'][g['bottom_type']]['material']) && (A = j['bottom_types'][g['bottom_type']]['material']),
    f['left_facade_offset'] = g['params']['facade_offset']['side'],
    f['right_facade_offset'] = g['params']['facade_offset']['side'],
    0x0 !== q && (this['bottom_wall'] = new Object_wall({
        'width': f['width'] / units - g['params']['facade_offset']['side'] / units - g['params']['facade_offset']['side'] / units,
        'height': j['bottom_types'][g['bottom_type']]['thickness'] / units,
        'thickness': w / units,
        'pX': f['width'] / 0x2 / units,
        'pY': g['params']['facade_offset']['bottom'] / units - j['bottom_types'][g['bottom_type']]['thickness'] / units / 0x2,
        'pZ': (f['depth'] - w) / 0x2 / units,
        'name': 'bottom_wall',
        'material': A
    }),
    this['left_wall'] = new Object_wall({
        'width': v / units,
        'height': x,
        'thickness': f['thickness'] / units,
        'pX': g['params']['facade_offset']['side'] / units + f['thickness'] / 0x2 / units,
        'pY': y,
        'pZ': (f['depth'] - v) / 0x2 / units,
        'rY': Math['PI'] / 0x2,
        'name': 'side_wall',
        'material': null == f['fixed_corpus_material'] ? f['corpus_material'] : f['fixed_corpus_material']
    }),
    this['right_wall'] = new Object_wall({
        'width': v / units,
        'height': x,
        'thickness': f['thickness'] / units,
        'pX': f['width'] / units - g['params']['facade_offset']['side'] / units - f['thickness'] / 0x2 / units,
        'pY': y,
        'pZ': (f['depth'] - v) / 0x2 / units,
        'rY': Math['PI'] / 0x2,
        'name': 'side_wall',
        'material': null == f['fixed_corpus_material'] ? f['corpus_material'] : f['fixed_corpus_material']
    }),
    this['back_wall'] = new Object_wall({
        'width': f['width'] / units - g['params']['facade_offset']['side'] / units - g['params']['facade_offset']['side'] / units - f['thickness'] / units * 0x2,
        'height': x,
        'thickness': f['thickness'] / units,
        'pX': f['width'] / units / 0x2,
        'pY': y,
        'pZ': -v / units / 0x2 + (f['depth'] - v) / 0x2 / units + f['thickness'] / 0x2 / units,
        'name': 'back_wall',
        'material': null == f['fixed_corpus_material'] ? f['corpus_material'] : f['fixed_corpus_material']
    }),
    0x1 == g['is_inner'] && (z = (y = lockers_types[f['type']]['types'][k]['inner_height'] / units) / 0x2 + lockers_types[f['type']]['types'][k]['inner_pos'] / units,
    this['inner_bottom_wall'] = new Object_wall({
        'width': f['width'] / units - f['left_facade_offset'] / units - f['right_facade_offset'] / units,
        'height': j['bottom_types'][g['bottom_type']]['thickness'] / units,
        'thickness': w / units,
        'pX': f['width'] / 0x2 / units,
        'pY': lockers_types[f['type']]['types'][k]['inner_pos'] / units - j['bottom_types'][g['bottom_type']]['thickness'] / units / 0x2,
        'pZ': (f['depth'] - w) / 0x2 / units,
        'name': 'bottom_wall',
        'material': A
    }),
    this['inner_left_wall'] = new Object_wall({
        'width': v / units,
        'height': y,
        'thickness': f['thickness'] / units,
        'pX': f['left_facade_offset'] / units + f['thickness'] / 0x2 / units,
        'pY': z,
        'pZ': (f['depth'] - v) / 0x2 / units,
        'rY': Math['PI'] / 0x2,
        'name': 'side_wall',
        'material': null == f['fixed_corpus_material'] ? f['corpus_material'] : f['fixed_corpus_material']
    }),
    this['inner_right_wall'] = new Object_wall({
        'width': v / units,
        'height': y,
        'thickness': f['thickness'] / units,
        'pX': f['width'] / units - f['right_facade_offset'] / units - f['thickness'] / 0x2 / units,
        'pY': z,
        'pZ': (f['depth'] - v) / 0x2 / units,
        'rY': Math['PI'] / 0x2,
        'name': 'side_wall',
        'material': null == f['fixed_corpus_material'] ? f['corpus_material'] : f['fixed_corpus_material']
    }),
    this['inner_back_wall'] = new Object_wall({
        'width': f['width'] / units - f['left_facade_offset'] / units - f['right_facade_offset'] / units - f['thickness'] / units * 0x2,
        'height': y,
        'thickness': f['thickness'] / units,
        'pX': f['width'] / units / 0x2,
        'pY': z,
        'pZ': -v / units / 0x2 + (f['depth'] - v) / 0x2 / units + f['thickness'] / 0x2 / units,
        'name': 'back_wall',
        'material': null == f['fixed_corpus_material'] ? f['corpus_material'] : f['fixed_corpus_material']
    }),
    this['inner_front_wall'] = new Object_wall({
        'width': f['width'] / units - f['left_facade_offset'] / units - f['right_facade_offset'] / units - f['thickness'] / units * 0x2,
        'height': y,
        'thickness': f['thickness'] / units,
        'pX': f['width'] / units / 0x2,
        'pY': z,
        'pZ': f['depth'] / units / 0x2 - f['thickness'] / 0x2 / units,
        'name': 'front_wall',
        'material': null == f['fixed_corpus_material'] ? f['corpus_material'] : f['fixed_corpus_material']
    }),
    this['locker']['add'](this['inner_bottom_wall']),
    this['locker']['add'](this['inner_left_wall']),
    this['locker']['add'](this['inner_right_wall']),
    this['locker']['add'](this['inner_back_wall']),
    this['locker']['add'](this['inner_front_wall'])),
    this['locker']['add'](this['bottom_wall']),
    this['locker']['add'](this['left_wall']),
    this['locker']['add'](this['right_wall']),
    this['locker']['add'](this['back_wall']),
    this['params']['inner'] && this['locker']['add'](this['front_wall']),
    !0x1 === this['params']['walls_visible']) && (this['bottom_wall']['visible'] = !0x1,
    this['left_wall']['visible'] = !0x1,
    this['right_wall']['visible'] = !0x1,
    this['back_wall']['visible'] = !0x1,
    this['params']['inner']) && (this['front_wall']['visible'] = !0x1),
    this['locker']['position']['z'] = -f['depth'] / 0x2 / units,
    this['build_facade'](),
    this['build_handle'](),
    this['position']['set'](f['pX'], f['pY'], f['pZ']);
}
,
Locker_new['prototype']['build_by_type_v2'] = function() {
    let f = this['params']
      , g = (this['userData']['type_v2'] = !0x0,
    null === f['type'] && (0x0 == this['params']['inner'] ? f['type'] = default_locker_type : f['type'] = default_inner_locker_type),
    copy_object(lockers_types[f['type']]))
      , j = null;
    this['userData']['animation']['push'] = g['params']['animation']['push'],
    this['userData']['animation']['percent'] = g['params']['animation']['percent'],
    this['userData']['animation']['dovod'] = g['params']['animation']['dovod'],
    Object['keys'](g['types'])['forEach'](function(z) {
        f['height'] >= g['types'][z]['min_facade_height'] && f['height'] <= g['types'][z]['max_facade_height'] && (j = z);
    }),
    j = j || Object['keys'](g['types'])[0x0];
    var k = f['depth'] + 0x5;
    let m = 0x0
      , q = (0x1 != g['params']['handle'] ? this['params']['no_handle_forced'] = !0x0 : this['params']['no_handle_forced'] = !0x1,
    null);
    var u = g['types'][j]['items'];
    for (let z = 0x0; z < u['length']; z++)
        k >= u[z]['min_depth'] && (q = u[z],
        m = u[z]['lead_depth']);
    if (null != (this['userData']['type_item'] = q)) {
        var v = m - g['params']['offset']['side']
          , w = m - g['params']['offset']['bottom'];
        let A = 0x0;
        var x = g['params']['height_mode'];
        let B = q['max_height'] / units;
        var y = q['min_height'] / units
          , x = (0x0 == B && (B = 0x1 / 0x0),
        (A = 'constant' == x ? q['height'] / units : (A = this['params']['height'] / units - g['params']['facade_offset']['bottom'] / units - q['height'] / units,
        clamp(A, y, B))) / 0x2 + g['params']['facade_offset']['bottom'] / units);
        let C = null == f['fixed_corpus_material'] ? f['corpus_material'] : f['fixed_corpus_material'];
        'corpus' != g['params']['bottom']['material'] && (C = g['params']['bottom']['material']),
        g['params']['offset']['back_pos_y'] || (g['params']['offset']['back_pos_y'] = 0x0);
        var y = f['width'] - 0x2 * project_settings['door_offset'], w, x, y;
        0x0 != m && (g['params']['walls']['bottom'] && (this['bottom_wall'] = new Object_wall({
            'width': y / units - g['params']['facade_offset']['side'] / units - g['params']['facade_offset']['side'] / units - 0x2 * g['params']['offset']['bottom_side'] / units,
            'height': g['params']['bottom']['thickness'] / units,
            'thickness': m / units - f['thickness'] / units - g['params']['offset']['bottom'] / units,
            'pX': f['width'] / 0x2 / units,
            'pY': g['params']['facade_offset']['bottom'] / units + g['params']['bottom']['thickness'] / units / 0x2 + g['params']['offset']['bottom_pos_y'] / units,
            'pZ': (f['depth'] - w) / 0x2 / units + f['thickness'] / units / 0x2 + g['params']['offset']['bottom_pos_z'] / units,
            'name': 'bottom_wall',
            'material': C
        }),
        this['locker']['add'](this['bottom_wall'])),
        g['params']['walls']['left'] && (this['left_wall'] = new Object_wall({
            'width': v / units,
            'height': A,
            'thickness': f['thickness'] / units,
            'pX': g['params']['facade_offset']['side'] / units + f['thickness'] / 0x2 / units + project_settings['door_offset'] / units,
            'pY': x,
            'pZ': (f['depth'] - v) / 0x2 / units,
            'rY': Math['PI'] / 0x2,
            'name': 'side_wall',
            'material': null == f['fixed_corpus_material'] ? f['corpus_material'] : f['fixed_corpus_material']
        }),
        this['locker']['add'](this['left_wall'])),
        g['params']['walls']['right'] && (this['right_wall'] = new Object_wall({
            'width': v / units,
            'height': A,
            'thickness': f['thickness'] / units,
            'pX': f['width'] / units - g['params']['facade_offset']['side'] / units - f['thickness'] / 0x2 / units - project_settings['door_offset'] / units,
            'pY': x,
            'pZ': (f['depth'] - v) / 0x2 / units,
            'rY': Math['PI'] / 0x2,
            'name': 'side_wall',
            'material': null == f['fixed_corpus_material'] ? f['corpus_material'] : f['fixed_corpus_material']
        }),
        this['locker']['add'](this['right_wall'])),
        g['params']['walls']['back'] && (this['back_wall'] = new Object_wall({
            'width': y / units - g['params']['facade_offset']['side'] / units - g['params']['facade_offset']['side'] / units - 0x2 * g['params']['offset']['back_side'] / units,
            'height': A + g['params']['offset']['back_size_y'] / units,
            'thickness': f['thickness'] / units,
            'pX': f['width'] / units / 0x2,
            'pY': x + g['params']['offset']['back_pos_y'] / units + g['params']['offset']['back_size_y'] / units / 0x2,
            'pZ': -v / units / 0x2 + (f['depth'] - v) / 0x2 / units + f['thickness'] / 0x2 / units + g['params']['offset']['back'] / units,
            'name': 'back_wall',
            'material': null == f['fixed_corpus_material'] ? f['corpus_material'] : f['fixed_corpus_material']
        }),
        this['locker']['add'](this['back_wall'])),
        g['params']['walls']['front'] && this['locker']['add'](this['front_wall']),
        q['models'] && (q['models']['dyna'] && (w = {
            'name': '',
            'code': '',
            'price': 0x0,
            'width': y - g['params']['facade_offset']['side'] - g['params']['facade_offset']['side'] + q['models']['dyna']['size_offset']['x'],
            'height': q['models']['dyna']['size']['y'] + q['models']['dyna']['size_offset']['y'],
            'depth': q['models']['dyna']['size']['z'] + q['models']['dyna']['size_offset']['z'],
            'model': '',
            'default': !0x0
        },
        (x = new Model_new({
            'model': q['models']['dyna']['model'],
            'immediate_load': 0x1,
            'variants': [w]
        }))['position']['x'] = f['width'] / units / 0x2,
        x['position']['y'] = g['params']['facade_offset']['bottom'] / units + q['models']['dyna']['pos']['y'] / units,
        x['position']['z'] = -v / units / 0x2 + (f['depth'] - v) / 0x2 / units + q['models']['dyna']['size']['z'] / units / 0x2 + q['models']['dyna']['pos']['z'] / units,
        this['locker']['add'](x)),
        q['models']['stat']) && ((y = new Model_new({
            'model': q['models']['stat']['model'],
            'immediate_load': 0x1,
            'variants': [{
                'name': '',
                'code': '',
                'price': 0x0,
                'width': f['width'] + q['models']['stat']['size_offset']['x'],
                'height': q['models']['stat']['size']['y'] + q['models']['stat']['size_offset']['y'],
                'depth': q['models']['stat']['size']['z'] + q['models']['stat']['size_offset']['z'],
                'model': '',
                'default': !0x0
            }]
        }))['position']['x'] = f['width'] / units / 0x2,
        y['position']['y'] = q['models']['stat']['pos']['y'] / units,
        y['position']['z'] = -q['models']['stat']['size']['z'] / units / 0x2,
        this['add'](y)),
        !0x1 === this['params']['walls_visible']) && (this['bottom_wall']['visible'] = !0x1,
        this['left_wall']['visible'] = !0x1,
        this['right_wall']['visible'] = !0x1,
        this['back_wall']['visible'] = !0x1,
        this['params']['inner']) && (this['front_wall']['visible'] = !0x1),
        this['locker']['position']['z'] = -f['depth'] / 0x2 / units,
        this['build_facade'](),
        this['build_handle'](),
        this['position']['set'](f['pX'], f['pY'], f['pZ']);
    }
}
,
Locker_new['prototype']['get_specs'] = function() {
    var f = {
        'corpus': [],
        'edge': [],
        'back_wall': []
    }, g, g;
    if (!this['userData']['type_v2'] || null != this['userData']['type_item']) {
        0x0 == this['params']['inner'] && (null != (g = this['facade']['get_specs']()) && (f['facade_specs'] = g),
        null != (g = this['facade']['get_glass_specs']()) && (f['glass_specs'] = g),
        project_settings['handle'][this['params']['group']]['no_handle'] || this['handle'] && !this['params']['no_handle_forced'] && (f['handle_specs'] = this['handle']['get_specs']()));
        let p = 0x10;
        if (custom_settings['lockers_thickness'] && (p = custom_settings['lockers_thickness']),
        calc_options['lockers_inner']) {
            if (null == this['params']['type'] || this['params']['models']['length'])
                for (let q = 0x0; q < this['locker']['children']['length']; q++) {
                    var h = this['locker']['children'][q];
                    'Mesh' !== h['type'] && 'LOCKER_BLUM' !== h['name'] || 'furni' !== h['name'] && ('LOCKER_BLUM' == h['name'] ? (f['corpus']['push']({
                        'id': this['params']['corpus_material'],
                        'm2': parseFloat((h['params']['width'] / 0x3e8 * h['params']['thickness'] / 0x3e8)['toFixed'](0x2)),
                        'pm': 0x0,
                        'thickness': p
                    }),
                    f['corpus']['push']({
                        'id': this['params']['corpus_material'],
                        'm2': parseFloat((h['params']['height'] / 0x3e8 * h['params']['thickness'] / 0x3e8)['toFixed'](0x2)),
                        'pm': 0x0,
                        'thickness': p
                    })) : -0x1 < h['name']['indexOf']('bottom_wall') ? h['visible'] && (f['corpus']['push']({
                        'id': h['params']['material'],
                        'm2': h['params']['width'] * units / 0x3e8 * h['params']['thickness'] * units / 0x3e8,
                        'pm': 0x0,
                        'thickness': p
                    }),
                    f['edge']['push']({
                        'id': h['params']['material'],
                        'm2': h['params']['width'] * units / 0x3e8 * h['params']['thickness'] * units / 0x3e8,
                        'pm': parseFloat(h['params']['width'] * units / 0x3e8 + h['params']['thickness'] * units / 0x3e8),
                        'name': h['name']
                    })) : h['visible'] && (f['corpus']['push']({
                        'id': h['params']['material'],
                        'm2': parseFloat((0xa * h['params']['width'] / 0x3e8 * h['params']['height'] * 0xa / 0x3e8)['toFixed'](0x2)),
                        'pm': 0x0,
                        'thickness': p
                    }),
                    f['edge']['push']({
                        'id': h['params']['material'],
                        'm2': h['params']['width'] * units / 0x3e8 * h['params']['thickness'] * units / 0x3e8,
                        'pm': parseFloat(h['params']['width'] * units / 0x3e8 + h['params']['thickness'] * units / 0x3e8),
                        'name': h['name']
                    })));
                }
            else {
                if (0x2 == lockers_version)
                    for (let u = 0x0; u < this['locker']['children']['length']; u++) {
                        var j = this['locker']['children'][u];
                        'Mesh' !== j['type'] && 'LOCKER_BLUM' !== j['name'] || (-0x1 < j['name']['indexOf']('bottom_wall') ? 'corpus' == lockers_types[this['params']['type']]['params']['bottom']['material'] ? (f['corpus']['push']({
                            'id': j['params']['material'],
                            'm2': j['params']['width'] * units / 0x3e8 * j['params']['thickness'] * units / 0x3e8,
                            'pm': 0x0,
                            'thickness': p
                        }),
                        f['edge']['push']({
                            'id': j['params']['material'],
                            'm2': j['params']['width'] * units / 0x3e8 * j['params']['thickness'] * units / 0x3e8,
                            'pm': parseFloat(j['params']['width'] * units / 0x3e8 + j['params']['thickness'] * units / 0x3e8),
                            'name': j['name']
                        })) : f['back_wall']['push']({
                            'id': j['params']['material'],
                            'm2': j['params']['width'] * units / 0x3e8 * j['params']['thickness'] * units / 0x3e8,
                            'pm': 0x0,
                            'key': 'type_1',
                            'thickness': j['params']['height'] * units
                        }) : (f['corpus']['push']({
                            'id': j['params']['material'],
                            'm2': parseFloat((0xa * j['params']['width'] / 0x3e8 * j['params']['height'] * 0xa / 0x3e8)['toFixed'](0x2)),
                            'pm': 0x0,
                            'thickness': p
                        }),
                        f['edge']['push']({
                            'id': j['params']['material'],
                            'm2': j['params']['width'] * units / 0x3e8 * j['params']['thickness'] * units / 0x3e8,
                            'pm': parseFloat(j['params']['width'] * units / 0x3e8 + j['params']['thickness'] * units / 0x3e8),
                            'name': j['name']
                        })));
                    }
                else {
                    var k = this['params']['type_params']
                      , l = lockers_types[this['params']['type']];
                    for (let v = 0x0; v < this['locker']['children']['length']; v++) {
                        var m = this['locker']['children'][v];
                        'Mesh' !== m['type'] && 'LOCKER_BLUM' !== m['name'] || 'furni' === m['name'] || -0x1 < m['name']['indexOf']('no_count') || (0x1 == this['params']['type_params']['params']['specs_count']['bottom'] && -0x1 < m['name']['indexOf']('bottom_wall') && ('corpus' == l['bottom_types'][k['bottom_type']]['material'] ? f['corpus']['push']({
                            'id': m['params']['material'],
                            'm2': m['params']['width'] * units / 0x3e8 * m['params']['thickness'] * units / 0x3e8,
                            'pm': 0x0,
                            'thickness': m['params']['height'] * units
                        }) : f['back_wall']['push']({
                            'id': m['params']['material'],
                            'm2': m['params']['width'] * units / 0x3e8 * m['params']['thickness'] * units / 0x3e8,
                            'pm': 0x0,
                            'key': 'type_1',
                            'thickness': m['params']['height'] * units
                        })),
                        0x1 == this['params']['type_params']['params']['specs_count']['back'] && -0x1 < m['name']['indexOf']('back_wall') && f['corpus']['push']({
                            'id': m['params']['material'],
                            'm2': m['params']['width'] * units / 0x3e8 * m['params']['height'] * units / 0x3e8,
                            'pm': 0x0,
                            'thickness': m['params']['thickness'] * units
                        }),
                        0x1 == this['params']['type_params']['params']['specs_count']['side'] && -0x1 < m['name']['indexOf']('side_wall') && f['corpus']['push']({
                            'id': m['params']['material'],
                            'm2': m['params']['width'] * units / 0x3e8 * m['params']['height'] * units / 0x3e8,
                            'pm': 0x0,
                            'thickness': m['params']['thickness'] * units
                        }));
                    }
                }
            }
        }
    }
    return f;
}
,
Locker_new['prototype']['set_additional_materials'] = function(e) {
    !facades_lib['items'][this['params']['facade']]['additional_materials'][e] || this['params']['additional_materials'][e] || (this['params']['additional_materials'][e] = facades_lib['items'][this['params']['facade']]['additional_materials'][e]['selected'],
    this['params']['version'] < 0x2 && (this['params_link'][this['par_index']]['additional_materials'] || (this['params_link'][this['par_index']]['additional_materials'] = {}),
    this['params_link'][this['par_index']]['additional_materials'][e] = facades_lib['items'][this['params']['facade']]['additional_materials'][e]['selected']));
}
,
Locker_new['prototype']['build_facade'] = function() {
    var e = this['params'];
    this['reset_facade'](),
    0x1 != this['params']['inner'] && (this['facade'] = new Facade_new({
        'parent': this,
        'facade': this['params']['facade'],
        'width': e['width'] - 0x2 * project_settings['door_offset'],
        'height': e['height'] - 0x2 * project_settings['door_offset'],
        'thickness': e['facade_thickness'],
        'style': e['style'],
        'fixed_model': e['fixed_facade_model'],
        'material': e['material'],
        'material_rotated': e['material_rotated'],
        'pX': e['width'] / 0x2 / units,
        'pY': e['height'] / 0x2 / units,
        'pZ': e['depth'] / units / 0x2 + e['facade_thickness'] / 0x2 / units,
        'group': e['group']
    }),
    this['locker']['add'](this['facade']));
}
,
Locker_new['prototype']['build_handle'] = function(f) {
    var g = this;
    if (0x1 != this['params']['inner']) {
        if (!this['params']['no_handle_forced'] && 0x0 != facades_lib['get_item'](this['params']['facade'])['handle'])
            return 0x1 === this['params']['gola'] ? !0x1 === this['params']['handle_active'] ? void 0x0 : ((f = f || g['params']['handle_model'])['size_index'] = g['params']['handle_size_index'],
            f['width'] = g['params']['width'],
            f['model_type'] = g['params']['handle_model_type'],
            g['handle'] = new Handle(f),
            'common' === f['model_type'] && g['handle']['position']['set'](g['params']['width'] / units / 0x2, g['params']['height'] / units + 0x19 / units - f['sizes'][0x0]['height'] / units / 0x2 + 1.7, -f['sizes'][0x0]['depth'] / units / 0x2),
            'model_top' === f['model_type'] && g['handle']['position']['set'](g['params']['width'] / units / 0x2, f['sizes_top_module']['height'] / units / 0x2, -f['sizes_top_module']['depth'] / units / 0x2 - 0x7 / units),
            'model_tabletop' === f['model_type'] && g['handle']['position']['set'](g['params']['width'] / units / 0x2, g['params']['height'] / units + 0x19 / units - f['sizes_tabletop']['height'] / units / 0x2, -f['sizes_tabletop']['depth'] / units / 0x2),
            g['add'](g['handle']),
            void setTimeout(function() {
                g['handle']['load_model']();
            }, 0x64)) : void (0x1 == project_settings['handle'][this['params']['group']]['no_handle'] ? (g['handle'] && (g['reset_model'](g['handle']),
            g['facade']['remove'](g['handle'])),
            g['handle2'] && (g['reset_model'](g['handle2']),
            g['facade']['remove'](g['handle2']))) : 'none' !== this['params']['handle_model'] && !0x1 !== this['params']['handle_active'] && (g['handle'] && (g['reset_model'](g['handle']),
            g['remove'](g['handle'])),
            g['handle2'] && (g['reset_model'](g['handle2']),
            g['remove'](g['handle2'])),
            (f = f || g['params']['handle_model'])['size_index'] = g['params']['handle_size_index'],
            f['type'] = this['params']['handle_model']['type'],
            'facade_profile' !== g['params']['handle_model']['type'] && 'overhead_profile' !== g['params']['handle_model']['type'] || (f['width'] = g['params']['width'] - 0x2 * project_settings['door_offset']),
            g['handle'] = new Handle(f),
            g['locker']['add'](g['handle']),
            'facade_profile' === g['params']['handle_model']['type'] && 0x1 != project_settings['handle'][this['params']['group']]['no_handle'] && 0x0 != facades_lib['get_item'](this['params']['facade'])['handle'] && ('bottom' === g['params']['group'] ? g['handle']['position']['set'](g['params']['width'] / units / 0x2, g['params']['height'] / units - g['params']['handle_model']['sizes'][0x0]['offset_y'] / units - project_settings['door_offset'] / units, g['params']['depth'] / units / 0x2 + g['params']['handle_model']['sizes'][0x0]['depth'] / units / 0x2) : (g['handle']['rotation']['z'] = Math['PI'],
            g['handle']['position']['set'](g['params']['width'] / units / 0x2 - g['params']['hinges_offset'] / units / 0x2, -g['params']['height'] / units / 0x2 + g['params']['handle_model']['sizes'][0x0]['offset_y'] / units + project_settings['door_offset'] / units, g['params']['depth'] / units / 0x2))),
            'common' === g['params']['handle_model']['type'] && (g['params']['handles_double'] && (g['handle2'] = new Handle(f),
            g['locker']['add'](g['handle2'])),
            'horizontal' === g['params']['handle_orientation'] ? (g['handle']['rotation']['z'] = 0x0,
            'middle' === g['params']['handle_position'] && g['params']['height'] < 0x258 ? g['handle']['position']['set'](g['params']['width'] / units / 0x2, g['params']['height'] / units / 0x2, g['params']['depth'] / units / 0x2 + g['params']['facade_thickness'] / units + this['handle']['params']['depth'] / 0x2 / units) : g['handle']['position']['set'](g['params']['width'] / units / 0x2, g['params']['height'] / units - g['handle']['params']['depth'] / units / 0x2 - g['params']['handle_offset'] / units, g['params']['depth'] / units / 0x2 + g['params']['facade_thickness'] / units + this['handle']['params']['depth'] / 0x2 / units),
            g['params']['handles_double'] && (g['handle2']['position']['copy'](g['handle']['position']),
            g['handle2']['rotation']['copy'](g['handle']['rotation']),
            g['handle2']['position']['x'] = g['params']['width'] / units / 0x4,
            g['handle']['position']['x'] = g['params']['width'] / units - g['params']['width'] / units / 0x4)) : (g['handle']['rotation']['z'] = Math['PI'] / 0x2,
            'middle_vertical' === g['params']['handle_position'] ? g['handle']['position']['set'](g['params']['width'] / units / 0x2, g['params']['height'] / units / 0x2, g['params']['depth'] / units / 0x2 + g['params']['facade_thickness'] / units + this['handle']['params']['depth'] / 0x2 / units) : g['handle']['position']['set'](g['params']['width'] / units / 0x2, g['params']['height'] / units - g['handle']['params']['width'] / units / 0x2 - g['params']['handle_offset'] / units, g['params']['depth'] / units / 0x2 + g['params']['facade_thickness'] / units + this['handle']['params']['depth'] / 0x2 / units),
            g['params']['handles_double'] && (g['handle2']['position']['copy'](g['handle']['position']),
            g['handle2']['rotation']['copy'](g['handle']['rotation']),
            g['handle2']['position']['x'] = g['handle']['params']['width'] / units / 0x2 + g['params']['handle_offset'] / units,
            g['handle']['position']['x'] = g['params']['width'] / units - g['handle']['params']['width'] / units / 0x2 - g['params']['handle_offset'] / units))),
            'overhead' !== g['params']['handle_model']['type'] && 'overhead_profile' !== g['params']['handle_model']['type'] || ('bottom' !== g['params']['group'] || 0x53 < g['params']['pY'] ? (g['handle']['rotation']['z'] = Math['PI'],
            g['handle']['position']['set'](g['params']['width'] / units / 0x2, project_settings['door_offset'] / units, g['params']['depth'] / units / 0x2)) : g['handle']['position']['set'](g['params']['width'] / units / 0x2, g['params']['height'] / units - project_settings['door_offset'] / units, g['params']['depth'] / units / 0x2)),
            setTimeout(function() {
                g['handle']['load_model'](),
                g['params']['handles_double'] && g['handle2']['load_model']();
            }, 0x64)));
        g['handle'] && (g['reset_model'](g['handle']),
        g['facade']['remove'](g['handle'])),
        g['handle2'] && (g['reset_model'](g['handle2']),
        g['facade']['remove'](g['handle2']));
    }
}
,
Locker_new['prototype']['change_handle'] = function(f, g, h) {
    f = f || 0x0,
    g = g || 0x0;
    for (var j = handles_lib['get_item'](f), k = 0x0; k < j['sizes']['length']; k++)
        j['sizes'][k]['default'] = k === g;
    this['params']['handle_size_index'] = g,
    h && (this['params']['handle_orientation'] = h),
    this['build_handle'](j);
}
,
Locker_new['prototype']['change_material'] = function(e) {
    0x1 != this['params']['inner'] && (e['group'] || (e['group'] = this['params']['group']),
    e['material_key'] && 'gen' != e['material_key'] ? (this['params']['additional_materials'] || (this['params']['additional_materials'] = {}),
    this['params']['additional_materials'][e['material_key']] = e['id']) : (this['params']['material'] = e['id'],
    this['params']['material_rotated'] = e['rotated']),
    this['facade']['change_material'](e));
}
,
Locker_new['prototype']['change_glass_material'] = function(e) {
    this['facade']['change_glass_material'](e);
}
,
Locker_new['prototype']['change_corpus_material'] = function(f) {
    var g, h, g;
    null == this['params']['fixed_corpus_material'] && (this['params']['corpus_material'] = f,
    null != default_locker_type || 'custom' !== project_settings['lo_type'] && 0x1 != constructor_settings['custom_lockers']) && (null == default_locker_type ? (this['left_wall'] && this['left_wall']['change_material'](f),
    this['right_wall'] && this['right_wall']['change_material'](f),
    this['back_wall'] && this['back_wall']['change_material'](f),
    this['bottom_wall'] && this['bottom_wall']['change_material'](f),
    this['inner_front_wall'] && this['inner_front_wall']['change_material'](f),
    this['front_wall'] && this['front_wall']['change_material'](f)) : (h = (g = this['params'])['type_params'],
    g = lockers_types[g['type']],
    ce(),
    this['left_wall'] && this['left_wall']['change_material'](f),
    this['right_wall'] && this['right_wall']['change_material'](f),
    this['back_wall'] && this['back_wall']['change_material'](f),
    0x1 == g['params']['bottom_enabled'] && 'corpus' == g['bottom_types'][h['bottom_type']]['material'] && this['bottom_wall'] && this['bottom_wall']['change_material'](f)));
}
,
Locker_new['prototype']['before_animation'] = function() {}
,
Locker_new['prototype']['click'] = function() {
    var f = this, g;
    if (this['before_animation'](this),
    'function' == typeof locker_animation_click_callback && locker_animation_click_callback(this),
    0x2 == lockers_version) {
        if (!this['userData']['state']['is_moving']) {
            if (this['userData']['state']['is_moving'] = !0x0,
            this['userData']['state']['is_open'])
                (this['userData']['animation']['dovod'] ? new TWEEN['Tween'](f['locker']['position'])['to']({
                    'z': this['userData']['state']['starting_pos']['z'] + 0x5
                }, 0x190)['onComplete']( () => {
                    new TWEEN['Tween'](f['locker']['position'])['to']({
                        'z': this['userData']['state']['starting_pos']['z']
                    }, 0x258)['onComplete']( () => {
                        this['userData']['state']['is_moving'] = !0x1;
                    }
                    )['start']();
                }
                ) : new TWEEN['Tween'](f['locker']['position'])['to']({
                    'z': this['userData']['state']['starting_pos']['z']
                }, 0x190)['onComplete']( () => {
                    this['userData']['state']['is_moving'] = !0x1;
                }
                ))['start'](),
                this['userData']['state']['is_open'] = 0x0;
            else {
                this['userData']['state']['starting_pos'] = f['locker']['position']['clone']();
                let h = new TWEEN['Tween'](f['locker']['position']);
                h['to']({
                    'z': this['userData']['state']['starting_pos']['z'] + f['params']['depth'] / units * parseFloat(this['userData']['animation']['percent']) / 0x64
                }, 0x258),
                this['userData']['animation']['push'] ? ((g = new TWEEN['Tween'](f['locker']['position']))['to']({
                    'z': this['userData']['state']['starting_pos']['z'] - 0.5
                }, 0x64),
                g['onComplete']( () => {
                    h['start'](),
                    h['onComplete']( () => {
                        this['userData']['state']['is_moving'] = !0x1;
                    }
                    );
                }
                ),
                g['start']()) : (h['start'](),
                h['onComplete']( () => {
                    this['userData']['state']['is_moving'] = !0x1;
                }
                )),
                this['userData']['state']['is_open'] = 0x1;
            }
        }
    } else
        this['userData']['state']['is_moving'] || (this['userData']['state']['is_moving'] = !0x0,
        0x0 === f['animated'] ? (f['locker']['starting_position'] = f['locker']['position']['clone'](),
        new TWEEN['Tween'](f['locker']['position'])['to']({
            'z': f['locker']['starting_position']['z'] + f['params']['depth'] / units * 0x2 / 0x3
        }, 0x258)['onComplete']( () => {
            this['userData']['state']['is_moving'] = !0x1;
        }
        )['start'](),
        f['animated'] = 0x1) : ((!0x0 === project_settings['hinges']['dovodchik'] ? new TWEEN['Tween'](f['locker']['position'])['to']({
            'z': f['locker']['starting_position']['z'] + 0x5
        }, 0x190)['onComplete']( () => {
            new TWEEN['Tween'](f['locker']['position'])['to']({
                'z': f['locker']['starting_position']['z']
            }, 0x258)['onComplete']( () => {
                this['userData']['state']['is_moving'] = !0x1;
            }
            )['start']();
        }
        ) : new TWEEN['Tween'](f['locker']['position'])['to']({
            'z': f['locker']['starting_position']['z']
        }, 0x258)['onComplete']( () => {
            this['userData']['state']['is_moving'] = !0x1;
        }
        ))['start'](),
        f['animated'] = 0x0));
}
,
Locker_new['prototype']['load_model'] = function() {
    var e;
    void 0x0 !== this['params']['model'] && ((e = this)['model'] = new Model_new(objectFindByKey(models_catalog['items'], 'id', e['params']['model'])),
    e['model']['position']['set'](e['params']['width'] / units / 0x2, e['params']['bottom_facade_offset'] / units, e['params']['depth'] / units / 0x2 - e['model']['params']['depth'] / units / 0x2),
    e['model']['load_model'](),
    e['locker']['add'](e['model']));
}
,
Locker_new['prototype']['reset_model'] = function(f) {
    var g = f, h, i = [];
    if ((g = f ? f : this)['traverse'](function(j) {
        g !== j && 'Group' !== j['type'] && i['push'](j);
    }),
    i['length']) {
        for (h = i['length'] - 0x1; -0x1 < h; h--)
            i[h]['parent']['remove'](i[h]),
            i[h]['geometry'] && i[h]['geometry']['dispose'](),
            i[h]['material'] && i[h]['material']['map'] && i[h]['material']['map']['dispose'](),
            i['splice'](i['indexOf'](i[h]), 0x1);
    }
}
,
Locker_new['prototype']['reset_facade'] = function() {
    this['facade'] && this['remove'](this['facade']);
}
,
Locker_new['prototype']['has_glass'] = function() {
    let e = !0x1;
    return this['params']['inner'] || (this['facade2'] ? this['facade'] && this['facade2'] && (e = this['facade']['has_glass']() || this['facade2']['has_glass']()) : this['facade'] && (e = this['facade']['has_glass']())),
    e;
}
,
Locker_new['prototype']['change_facade_style'] = function(e) {
    this['facade']['change_style'](e);
}
,
Locker_new['prototype']['check_fixed_facade'] = function() {
    var f = facades_lib['items'][this['params']['facade']];
    if (f && f['fixed_sizes']) {
        var g = this['params']['style'];
        if (isNaN(parseInt(g)) && (g = 't_' + f['compatibility_types'][g],
        f['fixed_sizes'][g])) {
            var h, j, k = this['params']['width'] - 0x2 * project_settings['door_offset'] + 'x' + (this['params']['height'] - 0x2 * project_settings['door_offset']);
            if (f['fixed_sizes'][g][k]) {
                let p = f['fixed_sizes'][g][k]['code']
                  , q = 0x0;
                var l = materials_lib['items'][this['params']['material']]['category']
                  , m = materials_lib['get_top_category'](l)['id'];
                f['fixed_sizes'][g][k]['categories']['c_' + l] && ('' != f['fixed_sizes'][g][k]['categories']['c_' + l]['code'] && (p = f['fixed_sizes'][g][k]['categories']['c_' + l]['code']),
                q = f['fixed_sizes'][g][k]['categories']['c_' + l]['price']),
                f['fixed_sizes'][g][k]['categories']['c_' + m] && ('' != f['fixed_sizes'][g][k]['categories']['c_' + m]['code'] && (p = f['fixed_sizes'][g][k]['categories']['c_' + m]['code']),
                q = f['fixed_sizes'][g][k]['categories']['c_' + m]['price']),
                this['params']['facade_code'] = p,
                this['params']['facade_price'] = parseFloat(q);
            }
        }
    }
}
,
Locker_new['prototype']['edges_mode'] = PPObject['prototype']['edges_mode'],
Locker_new['prototype']['edges_mode_traverse'] = PPObject['prototype']['edges_mode_traverse'];
let model_new_base_params = {
    'id': 0x0,
    'cabinet_group': 'top',
    'cabinet_type': 'common',
    'catalog': '',
    'opens_support': 0x0,
    'model': '',
    'default_model': void 0x0,
    'material': {},
    'additional_materials': {},
    'self_additional_materials': {},
    'width': 0xaf,
    'height': 0x23,
    'depth': 0xe,
    'params_blocks': [],
    'params_blocks_obj': {},
    'variants': [{
        'name': '',
        'code': '',
        'price': 0x0,
        'width': 0xaf,
        'height': 0x23,
        'depth': 0xe,
        'model': '',
        'default': !0x0
    }],
    'selected_variant': void 0x0,
    'sizes_available': !0x0,
    'drag_mode': 'common',
    'name': 'Model',
    'code': '',
    'price': 0x0,
    'size_index': 0x0,
    'show_in_report': 0x0,
    'draggable': !0x1,
    'resizable': !0x0,
    'service_name': '',
    'obj_type': 'model',
    'joints': [],
    'drag_offset_y': 0x0,
    'pX': 0x0,
    'pY': 0x0,
    'pZ': 0x0,
    'rX': 0x0,
    'rY': 0x0,
    'rZ': 0x0,
    'v2': 0x0,
    'exact': 0x0,
    'custom_data': {},
    'sbor_data': [],
    'is_new': 0x1,
    'immediate_load': 0x0,
    'type': 'common',
    'lighting': {
        'enabled': !0x1,
        'color': '#000000',
        'intensity': 0.5
    }
};
class Model_new extends PPObject {
    constructor(f) {
        super(f),
        f = f || {};
        let g = this
          , h = (this['type'] = 'Model',
        this['temp_type'] = 'Model',
        this['object_type'] = 'cab',
        this['params'] = _['merge'](copy_object(model_new_base_params), f),
        this['userData']['variant_price'] = 0x0,
        this['params']);
        '' == this['params']['model'] && (this['params']['model'] = this['params']['variants'][0x0]['model']),
        this['params']['default_model'] = void 0x0 !== f['default_model'] ? f['default_model'] : this['params']['model'],
        void 0x0 === this['params']['selected_variant'] ? (this['params']['selected_variant'] = objectFindByKey(this['params']['variants'], 'default', !0x0, !0x0),
        null === this['params']['selected_variant'] && (this['params']['selected_variant'] = 0x0),
        0x1 == h['is_new'] && (h['width'] = parseInt(h['variants'][h['selected_variant']]['width']),
        h['height'] = parseInt(h['variants'][h['selected_variant']]['height']),
        h['depth'] = parseInt(h['variants'][h['selected_variant']]['depth']),
        h['name'] = h['variants'][h['selected_variant']]['name'],
        h['code'] = h['variants'][h['selected_variant']]['code'],
        this['userData']['variant_price'] = h['variants'][h['selected_variant']]['price']),
        h['variants'][h['selected_variant']]['model'] && '' != h['variants'][h['selected_variant']]['model'] ? h['model'] = h['variants'][h['selected_variant']]['model'] : h['model'] || (h['model'] = h['variants'][0x0]['model'])) : (0x1 == h['is_new'] && (h['width'] = parseInt(h['variants'][h['selected_variant']]['width']),
        h['height'] = parseInt(h['variants'][h['selected_variant']]['height']),
        h['depth'] = parseInt(h['variants'][h['selected_variant']]['depth']),
        h['name'] = h['variants'][h['selected_variant']]['name'],
        h['code'] = h['variants'][h['selected_variant']]['code'],
        this['userData']['variant_price'] = h['variants'][h['selected_variant']]['price']),
        h['variants'][h['selected_variant']]['model'] && '' != h['variants'][h['selected_variant']]['model'] ? h['model'] = h['variants'][h['selected_variant']]['model'] : h['model'] || (h['model'] = h['variants'][0x0]['model']),
        this['userData']['variant_price'] = h['variants'][h['selected_variant']]['price']),
        h['variants'][h['selected_variant']]['params_blocks'] && (this['params']['params_blocks_obj'] = h['variants'][h['selected_variant']]['params_blocks']),
        this['userData']['mc'] = !0x1;
        var j = Object['keys'](h['self_additional_materials']);
        if (j['length']) {
            this['userData']['mc'] = !0x0;
            let k = {};
            j['forEach'](function(l) {
                k[h['self_additional_materials'][l]['key']] = h['self_additional_materials'][l];
            }),
            this['params']['self_additional_materials'] = k;
        }
        this['model_loaded'] = 'not_loaded',
        this['drag_mode'] = this['params']['drag_mode'],
        this['name'] = this['params']['service_name'],
        0x1 == this['params']['draggable'] && (this['object_type'] = 'cabinet',
        this['cabinet_type'] = f['cabinet_group']),
        this['model'] = new THREE['Group'](),
        this['model']['name'] = this['params']['name'],
        this['model']['userData']['childrenRenderable'] = !0x0,
        this['sizes'] = new THREE['Group'](),
        this['sizes']['name'] = 'Sizes',
        this['sizes']['userData']['childrenRenderable'] = !0x1,
        this['temp_sizes'] = new THREE['Group'](),
        this['temp_sizes']['name'] = 'Temp\x20Sizes',
        this['temp_sizes']['userData']['childrenRenderable'] = !0x1,
        this['joints'] = this['params']['joints'],
        this['add'](this['model']),
        this['add'](this['sizes']),
        this['add'](this['temp_sizes']),
        this['box'] = new THREE['Box3'](),
        this['box']['update'] = function() {
            !0x1 !== g['params']['draggable'] ? g['box']['setFromObject'](g['size_box']) : g['box']['setFromObject'](g['model']);
        }
        ,
        '' != g['params']['width'] && !isNaN(g['params']['width']) || (g['params']['width'] = 0x258,
        g['recalc'] = !0x0),
        '' != g['params']['height'] && !isNaN(g['params']['height']) || (g['params']['height'] = 0x258,
        g['recalc'] = !0x0),
        '' != g['params']['depth'] && !isNaN(g['params']['depth']) || (g['params']['depth'] = 0x258,
        g['recalc'] = !0x0),
        !0x1 !== this['params']['draggable'] && (this['size_box'] = new SizeBox({
            'width': g['params']['width'] / units,
            'height': g['params']['height'] / units,
            'depth': g['params']['depth'] / units
        }),
        global_options['mashprom_mode'] && 'surface' !== this['params']['drag_mode'] && (this['size_box']['visible'] = !0x1),
        this['size_box']['position']['y'] = g['params']['height'] / units / 0x2,
        this['add'](this['size_box']),
        this['size_box']['visible'] = !0x1),
        -0x1 < g['params']['model']['indexOf']('_os') && (g['params']['opens_support'] = 0x1),
        this['params']['auto_rotation'] = void 0x0 !== f['auto_rotation'] ? f['auto_rotation'] : 0x1,
        this['build']();
    }
    ['build']() {
        var f = this, g;
        if (this['model_loaded'] = 'not_loaded',
        this['joints'] = [],
        f['params']['joints']['length'])
            for (let k = 0x0; k < f['params']['joints']['length']; k++) {
                var h = f['params']['joints'][k]
                  , j = ('string' == typeof h['x'] && (h['x'] = f['params']['width'] / 0x2 * parseFloat(h['x']) / 0x64 / units),
                'string' == typeof h['y'] && (h['y'] = f['params']['height'] / 0x2 * parseFloat(h['y']) / 0x64 / units),
                'string' == typeof h['z'] && (h['z'] = f['params']['depth'] / 0x2 * parseFloat(h['z']) / 0x64 / units),
                new THREE['Group']());
                this['add'](j),
                j['visible'] = !0x1,
                j['position']['set'](h['x'], h['y'], h['z']),
                this['joints']['push'](j);
            }
        0x1 == f['params']['immediate_load'] || void 0x0 !== Model_utils['get_model_from_cache'](f['params']['model']) ? f['load_model']() : ((g = make_edges(f['params']['width'] / units, f['params']['height'] / units, f['params']['depth'] / units))['position']['y'] = f['params']['height'] / 0x2 / units,
        f['model']['add'](g)),
        !0x1 !== this['params']['draggable'] && this['size_box']['set_size'](f['params']['width'] / units, f['params']['height'] / units, f['params']['depth'] / units),
        f['model']['position']['set'](f['params']['pX'], f['params']['pY'], f['params']['pZ']),
        f['model']['rotation']['set'](f['params']['rX'], f['params']['rY'], f['params']['rZ']),
        '' != this['params']['width'] && this['build_sizes'](),
        this['calculate_distances'](),
        'surface' == this['params']['drag_mode'] && this['build_from_wall_sizes'](!0x0);
    }
    async['load_model']() {
        var f = this;
        if (f['reset_model'](this['model']),
        f['params']['model']) {
            if (0x1 == f['params']['exact'])
                f['load_exact']();
            else {
                if (f['params']['v2'] || f['params']['opens_support'])
                    f['load_model_v2']();
                else {
                    var g = await load_model({
                        'model': f['params']['model'],
                        'buffer': !0x1,
                        'no_cache': -0x1 < f['params']['model']['indexOf']('data:application')
                    }), h;
                    for (let q = 0x0; q < g['length']; q++) {
                        var j = g[q]['clone']();
                        if (-0x1 < j['name']['indexOf']('v(2)') || -0x1 < j['name']['indexOf']('v(3)')) {
                            let u, v = 'gen';
                            var k = j['name']['match'](/m\((.*?)\)/);
                            null != k && (v = k[0x1]);
                            let w = 0x0;
                            if ('gen' == v && (u = create_material(f['params']['material']),
                            w = 0x1),
                            bim_arr['forEach'](function(x) {
                                v == x && 'pat' != v && (u = 'function' == typeof bim_keys[x] ? bim_keys[x](f, v) : bim_keys[x],
                                w = 0x1);
                            }),
                            0x1 != w) {
                                if (f['params']['self_additional_materials'][v]) {
                                    let x, y;
                                    (y = f['params']['self_additional_materials'][v]['type'] && 0x1 == f['params']['self_additional_materials'][v]['type'] ? copy_object(f['params']['self_additional_materials'][v]['params']) : (x = (x = f['params']['self_additional_materials'][v]['selected']) || materials_lib['get_item'](this['params']['material'])['id'],
                                    materials_lib['get_item'](x)))['add_params']['model_width'] = f['params']['width'],
                                    y['add_params']['model_height'] = f['params']['height'],
                                    u = create_material(y);
                                } else {
                                    let z;
                                    z = (z = f['cabinet_type'] && facades_lib['items'][project_settings['defaults']['facades'][f['cabinet_type']]]['additional_materials'][v] ? facades_lib['items'][project_settings['defaults']['facades'][f['cabinet_type']]]['additional_materials'][v]['selected'] : z) || materials_lib['get_item'](this['params']['material'])['id'];
                                    var k = materials_lib['get_item'](z);
                                    f['params']['additional_materials'][v] = z,
                                    k['add_params']['model_width'] = f['params']['width'],
                                    k['add_params']['model_height'] = f['params']['height'],
                                    u = create_material(k);
                                }
                            }
                            var k = new THREE['Mesh'](j,u);
                            k['name'] = j['name'],
                            k['castShadow'] = !0x0,
                            k['receiveShadow'] = !0x0,
                            f['model']['add'](k);
                        } else {
                            var k = create_material(f['params']['material']), l = new THREE['Mesh'](j,k), n = (l['name'] = j['name'],
                            void 0x0 === project_settings['fixed_materials'] && (project_settings['fixed_materials'] = []),
                            project_settings['fixed_materials']), j = !0x1, p;
                            bim_arr['forEach'](function(A) {
                                -0x1 < l['name']['indexOf'](A) && (ce(A),
                                'function' == typeof bim_keys[A] ? l['material'] = bim_keys[A](f, l['name']) : l['material'] = bim_keys[A]);
                            }),
                            -0x1 < l['name']['indexOf']('light') ? (p = create_light({
                                'color': '#ecde6c',
                                'intensity': 0x1,
                                'distance': 0x24,
                                'decay': 0x1
                            }),
                            f['add'](p),
                            p['position']['copy'](l['position']),
                            j = !0x0) : l['receiveShadow'] = !0x0,
                            !0x1 === j && f['model']['add'](l),
                            l['castShadow'] = !0x0,
                            l['receiveShadow'] = !0x0;
                        }
                        f['model']['position']['y'] = f['params']['height'] / units / 0x2;
                    }
                    global_options['mode'],
                    ('' == f['params']['width'] || isNaN(f['params']['width']) || f['recalc']) && (f['model']['updateMatrixWorld'](),
                    h = box3['setFromObject'](f['model'])['getSize'](vec3)['clone'](),
                    Math['abs'](f['rotation']['y']) == Math['PI'] / 0x2 ? (f['params']['width'] = Math['round'](h['z'] * units),
                    f['params']['height'] = Math['round'](h['y'] * units),
                    f['params']['depth'] = Math['round'](h['x'] * units)) : (f['params']['width'] = Math['round'](h['x'] * units),
                    f['params']['height'] = Math['round'](h['y'] * units),
                    f['params']['depth'] = Math['round'](h['z'] * units)),
                    f['params']['draggable'] && (f['size_box']['params']['width'] = f['params']['width'] / units,
                    f['size_box']['params']['height'] = f['params']['height'] / units,
                    f['size_box']['params']['depth'] = f['params']['depth'] / units,
                    f['size_box']['build'](),
                    f['size_box']['position']['y'] = f['params']['height'] / units / 0x2),
                    f['box']['update'](),
                    f['recalc'] = !0x1),
                    f['set_size'](),
                    f['box']['update'](),
                    f['build_sizes'](),
                    f['model_loaded'] = 'loaded',
                    this['dispatchEvent']({
                        'type': 'model_loaded',
                        'message': 'loaded'
                    }),
                    0x1 == custom_settings['lighting'] && this['params']['lighting']['enabled'] && set_light(this);
                }
            }
        } else
            !(f['model_loaded'] = 'loaded') !== this['params']['draggable'] && (this['size_box']['set_size'](f['params']['width'] / units, f['params']['height'] / units, f['params']['depth'] / units),
            f['box']['update'](),
            f['build_sizes']());
    }
    async['load_exact']() {
        var f = this, g = await load_exact_model(f['params']['model']), g = (f['model']['add'](g),
        box3['setFromObject'](g)['getSize'](new THREE['Vector3']())), g;
        f['params']['width'] = parseInt(g['x'] * units),
        f['params']['height'] = parseInt(g['y'] * units),
        f['params']['depth'] = parseInt(g['z'] * units),
        this['size_box'] && (f['size_box']['set_size'](f['params']['width'] / units, f['params']['height'] / units, f['params']['depth'] / units),
        f['size_box']['position']['y'] = f['params']['height'] / units / 0x2,
        this['model']['position']['y'] = this['size_box']['position']['y'],
        this['box']['update'](),
        g = box3['setFromObject'](this['model']),
        this['model']['position']['y'] += this['box']['min']['y'] - g['min']['y'],
        this['model']['position']['x'] += this['box']['min']['x'] - g['min']['x'],
        this['model']['position']['z'] += this['box']['min']['z'] - g['min']['z'],
        this['build_sizes']()),
        f['model_loaded'] = 'loaded';
    }
    ['load_model_v2']() {
        let e = this;
        fbx_loader['load'](e['params']['model'], function(f) {
            var f = f
              , g = (f['traverse'](function(h) {
                function j(p) {
                    return 'Group' == p['parent']['type'] && -0x1 < p['parent']['name']['indexOf']('locker') || 'Group' == p['parent']['type'] && -0x1 < p['parent']['name']['indexOf']('hinge') ? p['parent'] : j(p['parent']);
                }
                if (-0x1 < h['name']['indexOf']('door_rtl') && (h['click'] = function() {
                    h['userData']['rotated'] ? (new TWEEN['Tween'](h['parent']['rotation'])['to']({
                        'z': h['userData']['rotation_base']
                    }, 0x12c)['start'](),
                    h['userData']['rotated'] = !0x1) : (h['userData']['rotation_base'] = copy_object(h['parent']['rotation']['z']),
                    new TWEEN['Tween'](h['parent']['rotation'])['to']({
                        'z': h['parent']['rotation']['z'] - Math['PI'] / 0x2
                    }, 0x12c)['start'](),
                    h['userData']['rotated'] = !0x0);
                }
                ),
                -0x1 < h['name']['indexOf']('door_ltr') && (h['click'] = function() {
                    h['userData']['rotated'] ? (new TWEEN['Tween'](h['parent']['rotation'])['to']({
                        'z': h['userData']['rotation_base']
                    }, 0x12c)['start'](),
                    h['userData']['rotated'] = !0x1) : (h['userData']['rotation_base'] = copy_object(h['parent']['rotation']['z']),
                    new TWEEN['Tween'](h['parent']['rotation'])['to']({
                        'z': h['parent']['rotation']['z'] + Math['PI'] / 0x2
                    }, 0x12c)['start'](),
                    h['userData']['rotated'] = !0x0);
                }
                ),
                -0x1 < h['name']['indexOf']('door_simple_top') && (h['click'] = function() {
                    h['userData']['rotated'] ? (new TWEEN['Tween'](h['parent']['rotation'])['to']({
                        'x': h['userData']['rotation_base']
                    }, 0x12c)['start'](),
                    h['userData']['rotated'] = !0x1) : (h['userData']['rotation_base'] = copy_object(h['parent']['rotation']['x']),
                    new TWEEN['Tween'](h['parent']['rotation'])['to']({
                        'x': h['parent']['rotation']['x'] - Math['PI'] / 0x2 - Math['PI'] / 0x8
                    }, 0x12c)['start'](),
                    h['userData']['rotated'] = !0x0);
                }
                ),
                -0x1 < h['name']['indexOf']('door_simple_bottom') && (h['click'] = function() {
                    h['userData']['rotated'] ? (new TWEEN['Tween'](h['parent']['rotation'])['to']({
                        'x': h['userData']['rotation_base']
                    }, 0x12c)['start'](),
                    h['userData']['rotated'] = !0x1) : (h['userData']['rotation_base'] = copy_object(h['parent']['rotation']['x']),
                    new TWEEN['Tween'](h['parent']['rotation'])['to']({
                        'x': h['parent']['rotation']['x'] + Math['PI'] / 0x2 + Math['PI'] / 0x8
                    }, 0x12c)['start'](),
                    h['userData']['rotated'] = !0x0);
                }
                ),
                -0x1 < h['name']['indexOf']('locker') && (h['click'] = function() {
                    var p = j(h)
                      , q = box3['setFromObject'](p)['getSize'](new THREE['Vector3']())['clone']();
                    let u = q['z'];
                    Math['abs'](e['rotation']['y']) == Math['PI'] / 0x2 && (u = q['x']),
                    p['userData']['rotated'] ? (new TWEEN['Tween'](p['position'])['to']({
                        'z': p['userData']['rotation_base']
                    }, 0x12c)['start'](),
                    p['userData']['rotated'] = !0x1) : (p['userData']['rotation_base'] = copy_object(p['position']['z']),
                    new TWEEN['Tween'](p['position'])['to']({
                        'z': p['position']['z'] + 0.75 * u
                    }, 0x12c)['start'](),
                    p['userData']['rotated'] = !0x0);
                }
                ),
                -0x1 < h['name']['indexOf']('door_slide_left') && (h['click'] = function() {
                    var p = box3['setFromObject'](h)['getSize'](new THREE['Vector3']())['clone']();
                    h['userData']['rotated'] ? (new TWEEN['Tween'](h['parent']['position'])['to']({
                        'x': h['userData']['rotation_base']
                    }, 0x12c)['start'](),
                    h['userData']['rotated'] = !0x1) : (h['userData']['rotation_base'] = copy_object(h['parent']['position']['x']),
                    new TWEEN['Tween'](h['parent']['position'])['to']({
                        'x': h['parent']['position']['x'] - p['x']
                    }, 0x12c)['start'](),
                    h['userData']['rotated'] = !0x0);
                }
                ),
                -0x1 < h['name']['indexOf']('door_slide_right') && (h['click'] = function() {
                    var p = box3['setFromObject'](h)['getSize'](new THREE['Vector3']())['clone']();
                    h['userData']['rotated'] ? (new TWEEN['Tween'](h['parent']['position'])['to']({
                        'x': h['userData']['rotation_base']
                    }, 0x12c)['start'](),
                    h['userData']['rotated'] = !0x1) : (h['userData']['rotation_base'] = copy_object(h['parent']['position']['x']),
                    new TWEEN['Tween'](h['parent']['position'])['to']({
                        'x': h['parent']['position']['x'] + p['x']
                    }, 0x12c)['start'](),
                    h['userData']['rotated'] = !0x0);
                }
                ),
                'Mesh' == h['type']) {
                    let p = h;
                    if (-0x1 < p['name']['indexOf']('v(2)') || -0x1 < p['name']['indexOf']('v(3)')) {
                        let q;
                        var k = p['name']['match'](/m\((.*?)\)/);
                        let u = 'gen'
                          , v = (null != k && (u = k[0x1]),
                        0x0);
                        if ('gen' == u && (q = create_material(e['params']['material']),
                        v = 0x1),
                        bim_arr['forEach'](function(w) {
                            -0x1 < u['indexOf'](w) && 'pat' != u && (q = 'function' == typeof bim_keys[w] ? bim_keys[w](e, u) : bim_keys[w],
                            v = 0x1);
                        }),
                        0x1 != v) {
                            if (e['params']['self_additional_materials'][u]) {
                                let w, x;
                                w = e['params']['self_additional_materials'][u]['type'] && 0x1 == e['params']['self_additional_materials'][u]['type'] ? copy_object(e['params']['self_additional_materials'][u]['params']) : (x = (x = e['params']['self_additional_materials'][u]['selected']) || materials_lib['get_item'](this['params']['material'])['id'],
                                materials_lib['get_item'](x)),
                                p['geometry']['computeBoundingBox']();
                                var k = p['geometry']['boundingBox']['getSize'](new THREE['Vector3']());
                                w['add_params']['model_width'] = k['x'] > k['y'] ? 0x3e8 * k['x'] : 0x3e8 * k['y'],
                                w['add_params']['model_height'] = k['z'] < k['y'] ? 0x3e8 * k['y'] : 0x3e8 * k['z'],
                                u,
                                q = create_material(w);
                            } else {
                                let y;
                                y = (y = facades_lib['items'][project_settings['defaults']['facades'][e['cabinet_type']]]['additional_materials'][u] ? facades_lib['items'][project_settings['defaults']['facades'][e['cabinet_type']]]['additional_materials'][u]['selected'] : y) || materials_lib['get_item'](this['params']['material'])['id'];
                                var k = materials_lib['get_item'](y);
                                e['params']['additional_materials'][u] = y,
                                k['add_params']['model_width'] = e['params']['width'],
                                k['add_params']['model_height'] = e['params']['height'],
                                q = create_material(k);
                            }
                        }
                        p['material'] = q,
                        p['castShadow'] = !0x0,
                        p['receiveShadow'] = !0x0;
                    } else {
                        var l = create_material(e['params']['material'])
                          , m = (void 0x0 === project_settings['fixed_materials'] && (project_settings['fixed_materials'] = []),
                        project_settings['fixed_materials'])
                          , n = !0x1;
                        bim_arr['forEach'](function(z) {
                            -0x1 < p['name']['indexOf'](z) && (l = 'function' == typeof bim_keys[z] ? bim_keys[z](e, p['name']) : bim_keys[z]);
                        }),
                        p['castShadow'] = !0x0,
                        p['receiveShadow'] = !0x0,
                        p['material'] = l;
                    }
                }
            }),
            Math['abs'](e['rotation']['y']) == Math['PI'] / 0x2 && (e['model']['rotation']['y'] = -0x1 * e['rotation']['y']),
            e['rotation']['y'] == Math['PI'] && (e['model']['rotation']['y'] = Math['PI']),
            e['model']['add'](f),
            box3['setFromObject'](e['model'])['getSize'](vec3)['clone']());
            e['params']['width'] = Math['round'](g['x'] * units),
            e['params']['height'] = Math['round'](g['y'] * units),
            e['params']['depth'] = Math['round'](g['z'] * units),
            f['position']['y'] = g['y'] / 0x2,
            e['params']['draggable'] && (e['size_box']['params']['width'] = e['params']['width'] / units,
            e['size_box']['params']['height'] = e['params']['height'] / units,
            e['size_box']['params']['depth'] = e['params']['depth'] / units,
            e['size_box']['build']()),
            e['set_size'](),
            e['box']['update'](),
            e['build_sizes']();
        }),
        this['model_loaded'] = 'loaded';
    }
    ['set_size']() {
        this['set_size_new']();
    }
    ['set_size_new']() {
        var f = this['model']['rotation']['clone']()
          , g = new THREE['Euler']()['setFromQuaternion'](this['model']['getWorldQuaternion'](new THREE['Quaternion']())['clone']())
          , h = (this['model']['rotation']['set'](-0x1 * g['x'], -0x1 * g['y'], -0x1 * g['z']),
        this)
          , g = box3['setFromObject'](h['model'])['getSize'](new THREE['Vector3']())['clone']()
          , j = {
            'box': g,
            'diff': new THREE['Vector3'](h['params']['width'] / units,h['params']['height'] / units,h['params']['depth'] / units)['sub'](g)['divideScalar'](0x2),
            'width': h['params']['width'] / units,
            'height': h['params']['height'] / units,
            'depth': h['params']['depth'] / units
        };
        for (let l = 0x0; l < h['model']['children']['length']; l++) {
            set_size_buff(h['model']['children'][l], h['model']['children'][l]['name'], j);
            var k = box3['setFromObject'](h['model']['children'][l])['getSize'](new THREE['Vector3']())['clone']();
            h['model']['children'][l]['userData']['size'] = {
                'x': k['x'] * units,
                'y': k['y'] * units,
                'z': k['z'] * units
            },
            h['model']['children'][l]['geometry']['attributes']['position']['needsUpdate'] = !0x0;
        }
        this['model']['rotation']['copy'](f),
        h['model']['position']['y'] = h['params']['height'] / units / 0x2,
        this['build_sizes'](),
        this['box']['update'](),
        'edges' === global_options['mode'] && h['edges_mode']();
    }
    ['change_params_blocks'](e) {
        this['params']['params_blocks_obj'] = e,
        this['params']['variants'][this['params']['selected_variant']]['params_blocks'] = e;
    }
    ['set_size_by_index'](e) {
        this['params']['variants'][e]['model'] ? '' != this['params']['variants'][e]['model'] && (this['params']['model'] = this['params']['variants'][e]['model']) : this['params']['model'] = this['params']['default_model'],
        this['params']['variants'][e]['code'] && (this['params']['code'] = this['params']['variants'][e]['code']),
        this['params']['variants'][e]['price'] && (this['userData']['variant_price'] = parseFloat(this['params']['variants'][e]['price'])),
        this['params']['variants'][e]['params_blocks'] && (this['params']['params_blocks_obj'] = this['params']['variants'][e]['params_blocks']),
        this['set_size_by_number'](this['params']['variants'][e]['width'], this['params']['variants'][e]['height'], this['params']['variants'][e]['depth']),
        this['params']['selected_variant'] = e,
        0x0 != this['userData']['variant_price'] && sc['get_price']();
    }
    ['set_size_by_number'](f, g, h, j) {
        var k = this
          , l = {
            'type': 'model_resize',
            'from': {
                'width': copy_object(k['params']['width']),
                'height': copy_object(k['params']['height']),
                'depth': copy_object(k['params']['depth'])
            },
            'object': k
        };
        f && (this['params']['width'] = f),
        g && (this['params']['height'] = g),
        h && (this['params']['depth'] = h),
        l['to'] = {
            'width': k['params']['width'],
            'height': k['params']['height'],
            'depth': k['params']['depth']
        },
        add_undo_action(l),
        k['load_model'](),
        !0x1 !== this['params']['draggable'] && this['size_box']['set_size'](this['params']['width'] / units, this['params']['height'] / units, this['params']['depth'] / units);
    }
    ['build_sizes']() {
        this['params']['draggable'] && this['params']['sizes_available'] && (this['reset_model'](this['sizes']),
        this['size_width'] = new Sizes_obj({
            'width': this['params']['width'] / units,
            'text': this['params']['width'],
            'font_size': 0x32
        }),
        this['size_width']['position']['set'](0x0, this['params']['height'] / units, -this['params']['depth'] / units / 0x2 + 0.44),
        this['sizes']['add'](this['size_width']),
        this['size_height'] = new Sizes_obj({
            'width': this['params']['height'] / units,
            'text': this['params']['height'],
            'font_size': 0x32
        }),
        this['size_height']['position']['set'](-this['params']['width'] / units / 0x2, this['params']['height'] / units / 0x2, -this['params']['depth'] / units / 0x2 + 0.4),
        this['size_height']['rotation']['z'] = Math['PI'] / 0x2,
        this['sizes']['add'](this['size_height']),
        this['sizes']['visible'] = global_options['sizes_visible']);
    }
    ['show_radial_menu'](f, g) {
        var h = this
          , j = {};
        j['material'] = this['userData']['mc'],
        j['material_corpus'] = !0x1,
        j['rotate_buttons'] = !0x0,
        j['sizes'] = !0x0,
        j['copy_button'] = !0x0,
        this['params']['opens_support'] && (j['open_doors'] = !0x0),
        pp['interface']['root']['radial']({
            'obj_type': this['type'],
            'obj': j,
            'left': f,
            'top': g
        });
    }
    ['set_image_map_by_key'](f, g) {
        for (let m = 0x0; m < this['model']['children']['length']; m++) {
            var h = this['model']['children'][m], j, k, l;
            (-0x1 < h['name']['indexOf']('v(2)') || -0x1 < h['name']['indexOf']('v(3)')) && (j = h['name']['match'](/m\((.*?)\)/)) && j[0x1] == f && (h['material'] = create_material({
                'params': {
                    'map': g,
                    'color': '#ffffff',
                    'metalness': 0x0,
                    'roughness': 0.8
                },
                'add_params': {
                    'stretch_width': !0x0,
                    'stretch_height': !0x0
                }
            }));
        }
    }
    ['change_material'](f, g) {
        if (this['params']['self_additional_materials'][g] && (this['params']['self_additional_materials'][g]['selected'] = f),
        this['params']['opens_support'])
            this['model']['traverse'](function(n) {
                var p, q, q;
                'Mesh' === n['type'] && -0x1 < n['name']['indexOf'](g) && (p = materials_lib['get_item'](f),
                n['geometry']['computeBoundingBox'](),
                q = n['geometry']['boundingBox']['getSize'](new THREE['Vector3']()),
                p['add_params']['model_width'] = q['x'] > q['y'] ? 0x3e8 * q['x'] : 0x3e8 * q['y'],
                p['add_params']['model_height'] = q['z'] < q['y'] ? 0x3e8 * q['y'] : 0x3e8 * q['z'],
                (q = create_material(p))['side'] = THREE['DoubleSide'],
                n['material'] = q);
            });
        else
            for (var h = 0x0; h < this['model']['children']['length']; h++) {
                var j = this['model']['children'][h], k, l, m, l, l;
                -0x1 < j['name']['indexOf']('v(2)') || -0x1 < j['name']['indexOf']('v(3)') ? (l = j['name']['match'](/m\((.*?)\)/)) && l[0x1] == g && ((l = create_material(materials_lib['get_item'](f)))['side'] = THREE['DoubleSide'],
                j['material'] = l) : j['name']['indexOf'](g) && ((l = create_material(materials_lib['get_item'](f)))['side'] = THREE['DoubleSide'],
                j['material'] = l);
            }
    }
    ['change_facade_material'](f) {
        if (this['params']['opens_support'])
            this['model']['traverse'](function(l) {
                var m, m, m;
                'Mesh' === l['type'] && ('all' == f['group'] && (-0x1 < l['name']['indexOf']('facmat') || -0x1 < l['name']['indexOf']('topfacmat') || -0x1 < l['name']['indexOf']('botfacmat')) && ((m = create_material(materials_lib['get_item'](f['id'])))['side'] = THREE['DoubleSide'],
                l['material'] = m),
                'top' == f['group'] && (-0x1 < l['name']['indexOf']('facmat') || -0x1 < l['name']['indexOf']('topfacmat')) && ((m = create_material(materials_lib['get_item'](f['id'])))['side'] = THREE['DoubleSide'],
                l['material'] = m),
                'bottom' == f['group']) && (-0x1 < l['name']['indexOf']('facmat') || -0x1 < l['name']['indexOf']('botfacmat')) && ((m = create_material(materials_lib['get_item'](f['id'])))['side'] = THREE['DoubleSide'],
                l['material'] = m);
            });
        else
            for (var g = 0x0; g < this['model']['children']['length']; g++) {
                var h = this['model']['children'][g], j, k, k;
                if (-0x1 < h['name']['indexOf']('v(2)') || -0x1 < h['name']['indexOf']('v(3)')) {
                    let l;
                    var j = h['name']['match'](/m\((.*?)\)/);
                    let m = 'gen'
                      , n = (null != j && (m = j[0x1]),
                    0x0);
                    if (!this['params']['self_additional_materials'][m]) {
                        if (!f['material_key']) {
                            if ('all' == f['group'] && ('facmat' == m || 'topfacmat' == m || 'botfacmat' == m)) {
                                (l = create_material(materials_lib['get_item'](f['id'])))['side'] = THREE['DoubleSide'],
                                h['material'] = l,
                                n = 0x1;
                                continue;
                            }
                            if ('top' == f['group'] && ('facmat' == m || 'topfacmat' == m)) {
                                (l = create_material(materials_lib['get_item'](f['id'])))['side'] = THREE['DoubleSide'],
                                h['material'] = l,
                                n = 0x1;
                                continue;
                            }
                            if ('bottom' == f['group'] && ('facmat' == m || 'botfacmat' == m)) {
                                (l = create_material(materials_lib['get_item'](f['id'])))['side'] = THREE['DoubleSide'],
                                h['material'] = l,
                                n = 0x1;
                                continue;
                            }
                        }
                        if (bim_arr['forEach'](function(p) {
                            -0x1 < m['indexOf'](p) && 'pat' != m && (n = 0x1);
                        }),
                        0x1 != (n = 'gen' == m ? 0x1 : n)) {
                            let p;
                            facades_lib['items'][project_settings['defaults']['facades'][this['cabinet_type']]]['additional_materials'][m] && (p = facades_lib['items'][project_settings['defaults']['facades'][this['cabinet_type']]]['additional_materials'][m]['selected']),
                            p = (this['params']['additional_materials'][m] = p) || materials_lib['get_item'](this['params']['material'])['id'];
                            var j = materials_lib['get_item'](p);
                            j['add_params']['model_width'] = this['params']['width'],
                            j['add_params']['model_height'] = this['params']['height'],
                            l = create_material(j),
                            h['material'] = l;
                        }
                    }
                } else
                    'all' == f['group'] && (-0x1 < h['name']['indexOf']('facmat') || -0x1 < h['name']['indexOf']('topfacmat') || -0x1 < h['name']['indexOf']('botfacmat')) ? ((j = create_material(materials_lib['get_item'](f['id'])))['side'] = THREE['DoubleSide'],
                    h['material'] = j) : 'top' == f['group'] && (-0x1 < h['name']['indexOf']('facmat') || -0x1 < h['name']['indexOf']('topfacmat')) ? ((k = create_material(materials_lib['get_item'](f['id'])))['side'] = THREE['DoubleSide'],
                    h['material'] = k) : 'bottom' == f['group'] && (-0x1 < h['name']['indexOf']('facmat') || -0x1 < h['name']['indexOf']('botfacmat')) && ((k = create_material(materials_lib['get_item'](f['id'])))['side'] = THREE['DoubleSide'],
                    h['material'] = k);
            }
    }
    ['change_corpus_material'](f) {
        if (this['params']['opens_support'])
            this['model']['traverse'](function(k) {
                var l;
                'Mesh' === k['type'] && -0x1 < k['name']['indexOf']('corpmat') && ((l = create_material(materials_lib['get_item'](f)))['side'] = THREE['DoubleSide'],
                k['material'] = l);
            });
        else
            for (var g = 0x0; g < this['model']['children']['length']; g++) {
                var h = this['model']['children'][g], j;
                -0x1 < h['name']['indexOf']('corpmat') && ((j = create_material(materials_lib['get_item'](f)))['side'] = THREE['DoubleSide'],
                h['material'] = j);
            }
    }
    ['mouse_up']() {
        var e = this;
        'door' !== e['params']['obj_type'] && e['params']['obj_type'];
    }
    ['design_mode']() {
        this['load_model']();
    }
    ['copypaste']() {
        var f = copy_object(this['params'])
          , g = (f['is_new'] = 0x0,
        new Model_new(f));
        room['add'](g),
        room['active_objects']['push'](g),
        d_objects['push'](g),
        g['position']['copy'](this['position']),
        g['rotation']['copy'](this['rotation']),
        0x0 === g['rotation']['y'] && (g['position']['x'] += g['params']['width'] / units),
        g['rotation']['y'] === Math['PI'] && (g['position']['x'] -= g['params']['width'] / units),
        g['rotation']['y'] === Math['PI'] / 0x2 && (g['position']['z'] -= g['params']['width'] / units),
        g['rotation']['y'] === -Math['PI'] / 0x2 && (g['position']['z'] += g['params']['width'] / units),
        add_undo_action({
            'type': 'copy',
            'object': g
        }),
        setTimeout(function() {
            'bottom' === g['params']['cabinet_group'] && get_wall_panel(),
            get_total_price_test();
        }, 0xc8);
    }
    ['set_material_from_params'](f) {
        this['params']['material'] = f;
        let g = this;
        for (let k = 0x0; k < this['model']['children']['length']; k++) {
            var h = this['model']['children'][k];
            if (-0x1 < h['name']['indexOf']('v(2)') || -0x1 < h['name']['indexOf']('v(3)')) {
                let l, m = 'gen';
                var j = h['name']['match'](/m\((.*?)\)/);
                null != j && (m = j[0x1]);
                let n = 0x0;
                if ('gen' == m && (l = create_material(g['params']['material']),
                n = 0x1),
                bim_arr['forEach'](function(p) {
                    -0x1 < m['indexOf'](p) && 'pat' != m && (l = 'function' == typeof bim_keys[p] ? bim_keys[p](g, m) : bim_keys[p],
                    n = 0x1);
                }),
                0x1 != n) {
                    if (g['params']['self_additional_materials'][m]) {
                        let p, q;
                        (q = g['params']['self_additional_materials'][m]['type'] && 0x1 == g['params']['self_additional_materials'][m]['type'] ? copy_object(g['params']['self_additional_materials'][m]['params']) : (p = (p = g['params']['self_additional_materials'][m]['selected']) || materials_lib['get_item'](this['params']['material'])['id'],
                        materials_lib['get_item'](p)))['add_params']['model_width'] = g['params']['width'],
                        q['add_params']['model_height'] = g['params']['height'],
                        l = create_material(q);
                    } else {
                        let u;
                        u = (u = g['cabinet_type'] && facades_lib['items'][project_settings['defaults']['facades'][g['cabinet_type']]]['additional_materials'][m] ? facades_lib['items'][project_settings['defaults']['facades'][g['cabinet_type']]]['additional_materials'][m]['selected'] : u) || materials_lib['get_item'](this['params']['material'])['id'];
                        var j = materials_lib['get_item'](u);
                        g['params']['additional_materials'][m] = u,
                        j['add_params']['model_width'] = g['params']['width'],
                        j['add_params']['model_height'] = g['params']['height'],
                        l = create_material(j);
                    }
                }
                h['material'] = l;
            } else
                -0x1 < h['name']['indexOf']('gen') && (h['material'] = create_material(f));
        }
    }
    ['get_price']() {
        var e;
        this['userData']['variant_price'] || (this['userData']['variant_price'] = 0x0);
        let f = e = parseFloat((this['userData']['variant_price'] + '')['replace'](',', '.'))
          , g = 0x0;
        return Object['keys'](this['params']['params_blocks_obj'])['forEach'](h => {
            var j = this['params']['params_blocks_obj'][h]['data'];
            for (let l = 0x0; l < j['length']; l++) {
                if ('select' == j[l]['type'])
                    for (let m = 0x0; m < j[l]['params']['options']['length']; m++) {
                        var k = j[l]['params']['options'][m];
                        k['value'] == j[l]['value'] && ('replace' == j[l]['params']['price_mode'] && (f = parseFloat(k['price'])),
                        'add' == j[l]['params']['price_mode']) && (g += parseFloat(k['price']));
                    }
                'boolean' == j[l]['type'] && 0x1 == j[l]['value'] && ('replace' == j[l]['params']['price_mode'] && (f = parseFloat(j[l]['params']['price'])),
                'add' == j[l]['params']['price_mode']) && (g += parseFloat(j[l]['params']['price']));
            }
        }
        ),
        e = f + g,
        e *= constructor_settings['price_modificator'],
        this['params']['price'] = e;
    }
    ['get_price_specs']() {
        return this['get_price']();
    }
    async['check_loaded']() {
        let f = this;
        var g = setInterval(function() {
            f['model_loaded'];
        }, 0x64);
    }
    ['set_light']() {
        var f = this, g;
        this['userData']['has_light'] || ((g = new THREE['SpotLight'](this['params']['lighting']['color'],this['params']['lighting']['intensity'],0x32,0x1e,spot_params['penumbra'],spot_params['decay']))['position']['set'](0x0, 0x32, 0x0),
        g['target']['position']['set'](0x0, 0x0, 0x0),
        obj['add'](g['target']),
        obj['add'](g),
        obj['userData']['light'] = g),
        this['userData']['has_light'] = !0x0;
    }
}
function cart_new() {
    Vue['component']('cart_new', {
        'template': '#cart_new_template',
        'props': {
            'mode': {
                'type': String,
                'default': 'p'
            },
            'custom_add_visible': {
                'type': Boolean,
                'default': !0x1
            }
        },
        'mixins': [],
        'data': function() {
            return {
                'cart': {},
                'l_mode': '',
                'selected_cat': -0x1,
                'selected_item': 0x0,
                'search': '',
                'tags': '',
                'add_mode': 'cart',
                'module_id': null,
                'debounce': null,
                'is_enough': !0x0,
                'is_excluded': !0x1
            };
        },
        'watch': {},
        'computed': {
            'computed_items': function() {
                var f = [];
                if (0x0 < this['tags']['length']) {
                    for (let g = 0x0; g < this['$options']['catalog']['tree'][this['selected_cat']]['items']['length']; g++)
                        for (let h = this['tags']['length']; h--; )
                            -0x1 < this['$options']['catalog']['items'][this['$options']['catalog']['tree'][this['selected_cat']]['items'][g]]['tags']['indexOf'](this['tags'][h]) && f['push'](this['$options']['catalog']['tree'][this['selected_cat']]['items'][g]);
                } else {
                    for (let i = 0x0; i < this['$options']['catalog']['tree'][this['selected_cat']]['items']['length']; i++)
                        f['push'](this['$options']['catalog']['tree'][this['selected_cat']]['items'][i]);
                }
                return f;
            },
            'cat_name': function() {
                if (-0x1 < this['selected_cat'])
                    return this['$options']['catalog']['tree'][this['selected_cat']]['category'];
            },
            'item_name': function() {
                if (0x0 < this['selected_item'])
                    return this['$options']['catalog']['items'][this['selected_item']]['name'];
            }
        },
        'created': function() {
            this['$options']['catalog'] = accsessories_data,
            Vue['set'](this, 'cart', cart2),
            this['selected_cat'] = -0x1,
            this['selected_item'] = 0x0,
            this['$root']['$on']('clear_cart', () => {
                this['clear_cart']();
            }
            ),
            this['l_mode'] = this['mode'];
        },
        'mounted': function() {
            this['update_items']();
        },
        'methods': {
            async 'change_mode'(e) {
                'c' == (this['l_mode'] = e) && this['update_items'](!0x0),
                this['set_panel_height']();
            },
            'f_price'(e) {
                return format_price(e);
            },
            'select_cat'(e) {
                this['selected_cat'] = e,
                this['selected_item'] = 0x0,
                this['set_panel_height']();
            },
            'select_item'(e) {
                this['selected_item'] = e,
                this['set_panel_height']();
            },
            'set_panel_height': function() {
                let f = this['$refs'];
                f['body']['style']['height'] = 'auto',
                this['$nextTick']( () => {
                    setTimeout(function() {
                        var g = f['comp_el']['parentElement']['offsetHeight'] - f['heading']['offsetHeight'];
                        f['body']['style']['height'] = g + 'px';
                    }, 0x1);
                }
                );
            },
            async 'update_items'(f=!0x1) {
                this['cart']['items'] = [];
                let g = global_options['custom_data']['price_data'];
                var i = global_options['custom_data']['price_errors'], j;
                let k = {};
                for (let u = 0x0; u < g['modules']['length']; u++)
                    for (let v = 0x0; v < g['modules'][u]['prices']['length']; v++)
                        k[g['modules'][u]['prices'][v]['code']] ? k[g['modules'][u]['prices'][v]['code']]['count'] += copy_object(g['modules'][u]['prices'][v]['count']) : k[g['modules'][u]['prices'][v]['code']] = copy_object(g['modules'][u]['prices'][v]);
                let l = {}
                  , m = 0x0
                  , p = 0x0;
                f && (j = await test_quant(),
                l = JSON['parse'](j)),
                Object['keys'](k)['forEach'](w => {
                    var x = parseFloat(k[w]['price'])
                      , y = x * parseInt(k[w]['count'])
                      , x = {
                        'name': k[w]['name'],
                        'code': k[w]['code'],
                        'count': k[w]['count'],
                        'price': x,
                        'total': y
                    };
                    f && (x['is_excluded'] = k[w]['excluded'],
                    0x1 == x['is_excluded'] && (p = 0x1),
                    x['is_enough'] = parseInt(l[x['code']]) >= g[w][i]['count'],
                    x['is_enough'] || (m = 0x1)),
                    this['cart']['items']['push'](x);
                }
                ),
                Object['keys'](g)['forEach'](w => {
                    if ('modules' != w)
                        for (let z = 0x0; z < g[w]['length']; z++) {
                            var x = parseFloat(g[w][z]['price'])
                              , y = x * parseInt(g[w][z]['count'])
                              , x = {
                                'name': g[w][z]['name'],
                                'code': g[w][z]['code'],
                                'count': g[w][z]['count'],
                                'price': x,
                                'total': y
                            };
                            f && (x['is_excluded'] = g[w]['excluded'],
                            0x1 == x['is_excluded'] && (p = 0x1),
                            x['is_enough'] = parseInt(l[x['code']]) >= g[w][z]['count'],
                            x['is_enough'] || (m = 0x1)),
                            this['cart']['items']['push'](x);
                        }
                }
                );
                for (let w = 0x0; w < this['cart']['accessories']['length']; w++) {
                    var q = this['cart']['accessories'][w];
                    f && (q['is_excluded'] = 0x0,
                    q['is_enough'] = parseInt(l[q['code']]) >= parseInt(q['count']),
                    q['is_enough'] || (m = 0x1));
                }
                this['is_enough'] = 0x0 == m,
                this['is_excluded'] = 0x1 == p,
                this['cart_update'](),
                this['set_panel_height']();
            },
            'clear_cart': function() {
                for (let e = this['cart']['accessories']['length']; e--; )
                    this['cart']['accessories']['splice'](e, 0x1);
                this['cart_update']();
            },
            'add_cart_item': function(f, g) {
                var h = parseInt(g['target']['parentElement']['getElementsByTagName']('input')[0x0]['value']), j;
                if (null != this['module_id']) {
                    let l = -0x1;
                    for (let m = this['cart']['accessories']['length']; m--; )
                        this['cart']['accessories'][m]['obj_id'] == this['to_module'] && this['cart']['accessories'][m]['id'] == f['id'] && (l = m);
                    var k = get_module_with_obj_id(this['to_module']), j;
                    -0x1 < l ? this['cart']['accessories'][l]['count'] += h : ((j = copy_object(f))['count'] = h,
                    j['obj_id'] = this['module_id'],
                    j['num'] = k['pdf_number'],
                    j['is_enough'] = !0x0,
                    this['cart']['accessories']['push'](j)),
                    k['add_accessories'](f, h);
                } else {
                    let n = -0x1;
                    for (let o = this['cart']['accessories']['length']; o--; )
                        this['cart']['accessories'][o]['id'] != f['id'] || this['cart']['accessories'][o]['obj_id'] || (n = o);
                    -0x1 < n ? this['cart']['accessories'][n]['count'] += h : ((j = copy_object(f))['count'] = h,
                    j['is_enough'] = !0x0,
                    this['cart']['accessories']['push'](j));
                }
                flyToElement(g['target']['parentElement']['parentElement']['parentElement'], this['$refs']['cart_icon']),
                this['cart_update']();
            },
            'remove_cart_item': function(f, g) {
                if (g)
                    for (let k = this['cart']['accessories']['length']; k--; ) {
                        var h;
                        this['cart']['accessories'][k]['id'] == f['id'] && this['cart']['accessories'][k]['obj_id'] == g && ((h = get_module_with_obj_id(this['cart']['accessories'][k]['obj_id'])) && h['remove_accessories'](f),
                        this['cart']['accessories']['splice'](k, 0x1));
                    }
                else
                    for (let l = this['cart']['accessories']['length']; l--; ) {
                        var j;
                        f['obj_id'] ? this['cart']['accessories'][l]['obj_id'] && f['id'] == this['cart']['accessories'][l]['id'] && f['obj_id'] == this['cart']['accessories'][l]['obj_id'] && ((j = get_module_with_obj_id(this['cart']['accessories'][l]['obj_id'])) && j['remove_accessories'](f),
                        this['cart']['accessories']['splice'](l, 0x1)) : this['cart']['accessories'][l]['id'] != f['id'] || this['cart']['accessories'][l]['obj_id'] || this['cart']['accessories']['splice'](l, 0x1);
                    }
                this['cart_update']();
            },
            'add_count': function(f, g) {
                var f = this['$refs']['count_input'][f];
                f['value'] = parseInt(f['value']) + parseInt(g),
                0x0 == f['value'] && (f['value'] = 0x1);
            },
            'cart_update': function() {
                let f = 0x0
                  , g = 0x0;
                for (let i = 0x0; i < this['cart']['items']['length']; i++)
                    f += this['cart']['items'][i]['total'],
                    g += this['cart']['items'][i]['count'];
                for (let j = 0x0; j < this['cart']['accessories']['length']; j++)
                    void 0x0 !== this['cart']['accessories'][j]['Regular\x20price'] && (this['cart']['accessories'][j]['price'] = cart['accessories'][j]['Regular\x20price']),
                    this['cart']['accessories'][j]['total'] = correct_price(this['cart']['accessories'][j]['price']) * this['cart']['accessories'][j]['count'],
                    f += correct_price(this['cart']['accessories'][j]['price']) * this['cart']['accessories'][j]['count'],
                    g += this['cart']['accessories'][j]['count'];
                this['cart']['total'] = f,
                this['cart']['count'] = g;
                var h = document['getElementsByClassName']('top_cart_count');
                h['length'] && (h[0x0]['innerHTML'] = this['cart']['count']),
                this['$root']['$emit']('cart_update', this['cart']['count']),
                this['$nextTick']( () => {
                    this['$refs']['count']['innerHTML'] = this['cart']['count'];
                }
                ),
                sc['get_price']();
            },
            'get_images': function(e) {
                return e['split'](',');
            },
            'lang': function(e) {
                return this['$root']['lang'](e);
            },
            'get_first_image': function(e) {
                var e = e['split'](',');
                return '' == e[0x0] ? '/common_assets/images/no_image.png' : e[0x0];
            }
        }
    });
}
function conf_m() {
    var f = {
        'wall': [{
            'key': 'spec',
            'name': 'Базовые\x20параметры',
            'children': [{
                'key': 'orientation',
                'name': 'Ориентация',
                'type': 'select',
                'values': [{
                    'label': 'Горизонтальная',
                    'val': 'h'
                }, {
                    'label': 'Вертикальная',
                    'val': 'v'
                }, {
                    'label': 'Фронтальная',
                    'val': 'f'
                }]
            }]
        }, {
            'key': 'size',
            'name': 'Размеры',
            'children': [{
                'key': 'x',
                'name': 'Ширина',
                'type': 'input_ext'
            }, {
                'key': 'y',
                'name': 'Высота',
                'type': 'input_ext'
            }]
        }, {
            'key': 'pos',
            'name': 'Позиция',
            'children': [{
                'key': 'x',
                'name': 'По\x20ширине',
                'type': 'input_ext'
            }, {
                'key': 'y',
                'name': 'По\x20высоте',
                'type': 'input_ext'
            }, {
                'key': 'z',
                'name': 'По\x20глубине',
                'type': 'input_ext'
            }]
        }, {
            'key': 'pivot',
            'name': 'Точка\x20отсчета',
            'children': [{
                'key': 'x',
                'name': 'По\x20оси\x20X',
                'type': 'select',
                'values': [{
                    'label': 'Слева',
                    'val': -0x1
                }, {
                    'label': 'По\x20центру',
                    'val': 0x0
                }, {
                    'label': 'Справа',
                    'val': 0x1
                }]
            }, {
                'key': 'y',
                'name': 'По\x20оси\x20Y',
                'type': 'select',
                'values': [{
                    'label': 'Снизу',
                    'val': -0x1
                }, {
                    'label': 'По\x20центру',
                    'val': 0x0
                }, {
                    'label': 'Сверху',
                    'val': 0x1
                }]
            }, {
                'key': 'z',
                'name': 'По\x20оси\x20Z',
                'type': 'select',
                'values': [{
                    'label': 'Спереди',
                    'val': 0x1
                }, {
                    'label': 'По\x20центру',
                    'val': 0x0
                }, {
                    'label': 'Сзади',
                    'val': -0x1
                }]
            }]
        }, {
            'key': 'rot',
            'name': 'Поворот',
            'children': [{
                'key': 'x',
                'name': 'По\x20оси\x20X',
                'type': 'number'
            }, {
                'key': 'y',
                'name': 'По\x20оси\x20Y',
                'type': 'number'
            }, {
                'key': 'z',
                'name': 'По\x20оси\x20Z',
                'type': 'number'
            }]
        }, {
            'key': 'material',
            'name': 'Материал',
            'children': [{
                'key': 'rotated',
                'name': 'Повернуть',
                'type': 'bool'
            }, {
                'key': 'fixed',
                'name': 'Зафиксировать',
                'type': 'bool'
            }]
        }],
        'section': [{
            'key': 'size',
            'name': 'Размеры',
            'children': [{
                'key': 'x',
                'name': 'Ширина',
                'type': 'input_ext'
            }, {
                'key': 'y',
                'name': 'Высота',
                'type': 'input_ext'
            }, {
                'key': 'z',
                'name': 'Глубина',
                'type': 'input_ext'
            }]
        }, {
            'key': 'pos',
            'name': 'Позиция',
            'children': [{
                'key': 'x',
                'name': 'По\x20ширине',
                'type': 'input_ext'
            }, {
                'key': 'y',
                'name': 'По\x20высоте',
                'type': 'input_ext'
            }, {
                'key': 'z',
                'name': 'По\x20глубине',
                'type': 'input_ext'
            }]
        }, {
            'key': 'pivot',
            'name': 'Точка\x20отсчета',
            'children': [{
                'key': 'x',
                'name': 'По\x20оси\x20X',
                'type': 'select',
                'values': [{
                    'label': 'Слева',
                    'val': -0x1
                }, {
                    'label': 'По\x20центру',
                    'val': 0x0
                }, {
                    'label': 'Справа',
                    'val': 0x1
                }]
            }, {
                'key': 'y',
                'name': 'По\x20оси\x20Y',
                'type': 'select',
                'values': [{
                    'label': 'Снизу',
                    'val': -0x1
                }, {
                    'label': 'По\x20центру',
                    'val': 0x0
                }, {
                    'label': 'Сверху',
                    'val': 0x1
                }]
            }, {
                'key': 'z',
                'name': 'По\x20оси\x20Z',
                'type': 'select',
                'values': [{
                    'label': 'Спереди',
                    'val': 0x1
                }, {
                    'label': 'По\x20центру',
                    'val': 0x0
                }, {
                    'label': 'Сзади',
                    'val': -0x1
                }]
            }]
        }, {
            'key': 'rot',
            'name': 'Поворот',
            'children': [{
                'key': 'x',
                'name': 'По\x20оси\x20X',
                'type': 'input_ext'
            }, {
                'key': 'y',
                'name': 'По\x20оси\x20Y',
                'type': 'input_ext'
            }, {
                'key': 'z',
                'name': 'По\x20оси\x20Z',
                'type': 'input_ext'
            }]
        }]
    };
    Vue['component']('value_input', {
        'template': '#value_input_template',
        'props': {
            'var_list': {
                'type': Object,
                'default': function() {
                    return {};
                }
            },
            'label': String,
            'value': [Number, String],
            'delay': {
                'type': Number,
                'default': 'undefined' == typeof input_delay ? 0x1f4 : input_delay
            }
        },
        'data': function() {
            return {
                'show_variables': 0x0,
                'errors': 0x0,
                'pretty_val': '',
                'real_val': '',
                'mode': 'pretty',
                'timeout': null
            };
        },
        'computed': {},
        'watch': {
            'value': function() {
                this['real_val'] = this['value'],
                this['pretty_val'] = this['value'],
                this['from_real']();
            }
        },
        'created': function() {
            this['real_val'] = this['value'],
            this['pretty_val'] = this['value'],
            this['from_real']();
        },
        'mounted': function() {},
        'methods': {
            'change_mode': function() {
                'pretty' == this['mode'] ? this['mode'] = 'real' : this['mode'] = 'pretty';
            },
            'add_val': function(g) {
                this['pretty_val'] += '{' + g['name'] + '}',
                this['from_pretty'](),
                this['show_variables'] = 0x0,
                this['on_change']();
            },
            'change_pretty': function() {
                this['from_pretty'](),
                this['on_change']();
            },
            'change_real': function() {
                this['from_real'](),
                this['on_change']();
            },
            'from_pretty': function() {
                var g = treg(this['pretty_val']);
                let h = this['pretty_val'];
                for (let j = 0x0; j < g['length']; j++) {
                    var i = '{' + g[j] + '}';
                    h = this['var_list']['hash'][g[j]] ? h['replaceAll'](i, this['var_list']['hash'][g[j]]) : (this['errors'] = 0x1,
                    h['replaceAll'](i, ''));
                }
                h = (h = (h = h['replace'](/ +/g, ''))['replace'](/(\*|\(|\)|\+|-|\/)/g, '\x20$1\x20'))['replace'](/\s\s+/g, '\x20'),
                this['real_val'] = h;
            },
            'from_real': function() {
                if ('string' == typeof this['real_val']) {
                    var g, h = this['real_val']['split']('\x20'), j, k, m, o, m;
                    for (let p = 0x0; p < h['length']; p++)
                        if (isNaN(parseInt(h[p])))
                            switch (h[p][0x0]) {
                            case 'v':
                                h[p] = '{' + this['var_list']['variables'][h[p]['substring'](0x2)]['name'] + '}';
                                break;
                            case 'c':
                                h[p] = '{' + this['var_list']['computed'][h[p]['substring'](0x2)]['name'] + '}';
                                break;
                            case 's':
                                -0x1 < h[p]['indexOf']('x') && (h[p] = '{Ширина}'),
                                -0x1 < h[p]['indexOf']('y') && (h[p] = '{Высота}'),
                                -0x1 < h[p]['indexOf']('z') && (h[p] = '{Глубина}');
                                break;
                            case 'm':
                                -0x1 < h[p]['indexOf']('current') ? (m = h[p]['split']('.current.')[0x0]['substring'](0x2),
                                m = set_obj['materials'][m]['name'],
                                h[p] = '{Толщина\x20' + m + '}') : h[p]['indexOf']('v_');
                                break;
                            default:
                                h[p] = h[p];
                            }
                        else
                            h[p] = parseInt(h[p]);
                    this['pretty_val'] = h['join']('\x20');
                } else
                    this['pretty_val'] = this['real_val'];
            },
            'on_change': function(g) {
                clearTimeout(this['debounce']);
                let h = this;
                this['debounce'] = setTimeout(function() {
                    h['$emit']('change_inp', h['real_val']);
                }, this['delay']);
            },
            'lang': function(g) {
                return lang[g];
            }
        }
    });
}
function treg(f) {
    for (var g = /{(.*?)}/g, h = [], i; i = g['exec'](f); )
        h['push'](i[0x1]);
    return h;
}
function convert_params(f) {
    function g(h) {
        if (h['children']) {
            for (let i = 0x0; i < h['children']['length']; i++)
                g(h['children'][i]);
        }
        h['title'] = h['name'] || h['type'],
        Object['keys'](h)['forEach'](function(j) {
            'children' != j && 'title' != j && 'data' != j && delete h[j];
        });
    }
    f['name'] = 'Модуль',
    f['isDraggable'] = !0x1,
    g(f);
}
let mixin = {
    'methods': {
        'item_style': function(f) {
            var g = {}, h;
            if (f['params'] && f['params']['p_mat_key']) {
                var h = pp['libs']['materials'][f['params']['p_mat_key']]['find_item'](f['params']['p_mat']);
                if (h)
                    return this['item_style'](h);
            }
            return f['icon'] || '' == f['icon'] ? '' == f['icon'] ? f['params'] && f['params']['material'] && '0' !== f['params']['material'] && (h = materials_lib['items'][f['params']['material']]) && h['params'] ? h['params']['icon'] ? g['background-image'] = 'url(' + correct_url(h['params']['icon']) + ')' : h['params']['map'] ? g['background-image'] = 'url(' + correct_url(h['params']['map']) + ')' : h['params']['color'] ? g['background-color'] = h['params']['color'] : j(f, g) : j(f, g) : g['background-image'] = 'url(' + correct_url(f['icon']) + ')' : f['params'] ? f['params']['icon'] ? g['background-image'] = 'url(' + correct_url(f['params']['icon']) + ')' : f['params']['map'] ? g['background-image'] = 'url(' + correct_url(f['params']['map']) + ')' : f['params']['color'] ? g['background-color'] = f['params']['color'] : j(f, g) : j(f, g),
            g;
            function j(k, l) {
                var k = _['get'](k, 'params.mat_params.params');
                k ? k['icon'] ? l['background-image'] = 'url(' + correct_url(k['icon']) + ')' : k['map'] ? l['background-image'] = 'url(' + correct_url(k['map']) + ')' : k['color'] ? l['background-color'] = k['color'] : l['background-image'] = 'url(/common_assets/images/no_image.png)' : l['background-image'] = 'url(/common_assets/images/no_image.png)';
            }
        },
        'lang': function(f) {
            return this['$root']['lang'](f);
        },
        'expand_panel': function() {
            this['$refs'] && this['$refs']['catalog'] && 'function' == typeof this['$refs']['catalog']['check_scroll'] && this['$refs']['catalog']['check_scroll'](),
            'function' == typeof this['set_panel_height'] && this['set_panel_height'](),
            this['expanded'] = !this['expanded'],
            this['$root']['$emit']('expand_panel', this['expanded']);
        },
        'panel_expanded': function() {
            return !!this['$parent']['panel_expanded'];
        }
    }
}
  , expand_mixin = {
    'methods': {
        'expand_panel': function() {
            this['$refs'] && this['$refs']['catalog'] && 'function' == typeof this['$refs']['catalog']['check_scroll'] && this['$refs']['catalog']['check_scroll'](),
            'function' == typeof this['set_panel_height'] && this['set_panel_height'](),
            this['$root']['$emit']('expand_panel');
        },
        'panel_expanded': function() {
            return !!this['$parent']['panel_expanded'];
        }
    }
}
  , interface_components_init = [];
function interface_new() {
    custom_settings['mod_lib_no_height'] || (convert_height({
        'id': 0x0,
        'name': '',
        'active': 0x1,
        'categories': mod_lib['tree'],
        'items': []
    }),
    mod_lib['conv'] = !0x0),
    Vue['component']('SlickList', window['VueSlicksort']['SlickList']),
    Vue['component']('SlickItem', window['VueSlicksort']['SlickItem']),
    Vue['component']('DragHandle', window['VueSlicksort']['DragHandle']),
    Vue['component']('PpTree', window['PpTree']),
    Vue['component']('lighting_component', {
        'template': '#lighting_component_template',
        'components': {
            'chrome-picker': VueColor['Chrome']
        },
        'props': {
            'enabled': {
                'type': [Number, String, Boolean],
                'default': !0x1
            },
            'intensity': {
                'type': [Number, String],
                'default': 0.5
            }
        },
        'mixins': [mixin],
        'data': function() {
            return {
                'l_enabled': !0x1,
                'colors': '#000000',
                'l_intensity': 0.5,
                'spot': {
                    'intensity': spot_params['intensity'],
                    'distance': spot_params['distance'],
                    'angle': spot_params['angle'],
                    'penumbra': spot_params['penumbra'],
                    'decay': spot_params['decay']
                }
            };
        },
        'watch': {},
        'created': function() {
            this['l_enabled'] = this['enabled'],
            this['l_intensity'] = this['intensity'];
        },
        'methods': {
            'upd_light': function() {
                var h = copy_object(parseFloat(this['l_intensity']));
                if (active_el['params']['lighting']['intensity'] = h,
                active_el['userData']['light']) {
                    active_el['userData']['light']['intensity'] = h;
                    for (let k = 0x0; k < active_el['model']['children']['length']; k++) {
                        var j = active_el['model']['children'][k];
                        -0x1 < j['name']['indexOf'](custom_settings['lighting_key']) && (j['material']['emissiveIntensity'] = h / 0x4);
                    }
                }
            },
            'change_enabled': function() {
                var h = copy_object(parseFloat(this['l_intensity']));
                if (set_light(active_el),
                this['l_enabled']) {
                    active_el['params']['lighting']['enabled'] = !0x0,
                    active_el['params']['lighting']['color'] = '#ffffff',
                    active_el['userData']['light']['color'] = new THREE['Color']('#ffffff'),
                    active_el['userData']['light']['intensity'] = h;
                    for (let l = 0x0; l < active_el['model']['children']['length']; l++) {
                        var j = active_el['model']['children'][l];
                        -0x1 < j['name']['indexOf'](custom_settings['lighting_key']) && (j['material']['emissiveIntensity'] = h / 0x4,
                        j['material']['emissive'] = new THREE['Color']('#ffffff'));
                    }
                } else {
                    active_el['params']['lighting']['enabled'] = !0x1,
                    active_el['params']['lighting']['color'] = '#000000',
                    active_el['userData']['light']['color'] = new THREE['Color']('#000000');
                    for (let m = active_el['userData']['light']['intensity'] = 0x0; m < active_el['model']['children']['length']; m++) {
                        var k = active_el['model']['children'][m];
                        -0x1 < k['name']['indexOf'](custom_settings['lighting_key']) && (k['material']['emissiveIntensity'] = 0x0,
                        k['material']['emissive'] = new THREE['Color']('#000000'));
                    }
                }
            },
            'test_color'() {
                for (let i = 0x0; i < active_el['model']['children']['length']; i++) {
                    var h = active_el['model']['children'][i];
                    -0x1 < h['name']['indexOf'](custom_settings['lighting_key']) && (h['material']['emissiveIntensity'] = parseFloat(this['spot']['intensity']) / 0x4,
                    h['material']['emissive'] = new THREE['Color'](this['colors']['hex']));
                }
                active_el['userData']['light']['color'] = new THREE['Color'](this['colors']['hex']);
            },
            'select_item': function(h) {},
            'emit_select': function(h) {},
            'find_item': function(h) {}
        }
    }),
    Vue['component']('facade_type_picker', {
        'template': '#facade_type_picker_template',
        'props': {
            'facade': {
                'type': [Number, String],
                'default': 0x0
            },
            'selected': {
                'type': [String, Number, Array],
                'default': 0x0
            },
            'radius': {
                'type': [Number, Boolean],
                'default': 0x0
            },
            'filter': {
                'type': [Function]
            },
            'type': {
                'type': [String],
                'default': 'd'
            },
            'all': {
                'type': [Number],
                'default': 0x0
            },
            'index': {
                'type': [Number],
                'default': 0x0
            },
            'sec_index': {
                'type': [Number],
                'default': null
            },
            'item': {
                'type': [Object],
                'default': {}
            }
        },
        'mixins': [mixin],
        'data': function() {
            return {
                'expanded': !0x1,
                'l_selected': 0x0
            };
        },
        'watch': {
            'selected': function(h, i) {
                this['get_selected_index']();
            }
        },
        'created': function() {
            this['$options']['facade'] = facades_lib['items'][this['facade']],
            this['get_selected_index']();
        },
        'methods': {
            'item_style_type': function(h, j) {
                let k = {
                    'full': '/common_assets/images/icons/common_full_78.jpg',
                    'window': '/common_assets/images/icons/common_window_78.jpg',
                    'frame': '/common_assets/images/icons/common_frame_78.jpg'
                }
                  , l = {
                    'radius': 'full',
                    'radius_window': 'window',
                    'radius_window2': 'radius_window2',
                    'radius_frame': 'frame'
                }
                  , m = this['$options']['facade']['compatibility_types']
                  , n = h['icon'];
                '' == n && (h['radius'] ? Object['keys'](m)['forEach'](function(p) {
                    m[p] == j && (n = k[l[p]]);
                }) : Object['keys'](m)['forEach'](function(p) {
                    m[p] == j && (n = k[p]);
                }));
                var h = {};
                return '' == n || null == n ? h['background-image'] = 'url(/common_assets/images/no_image.png)' : h['background-image'] = 'url(' + n + ')',
                h;
            },
            'select_item': function(h) {},
            'get_selected_index': function() {
                let h = this['selected'];
                Array['isArray'](this['selected']) && (h = this['selected'][0x0]),
                h = isNaN(parseInt(h)) ? this['radius'] ? 'full' == h ? this['$options']['facade']['compatibility_types']['radius'] : 'window' == h ? this['$options']['facade']['compatibility_types']['radius_window'] : this['$options']['facade']['compatibility_types'][h] : this['$options']['facade']['compatibility_types'][h] : parseInt(h),
                this['l_selected'] = h;
            },
            'select_type': function(h, j) {
                let k = this['l_selected'] = j;
                var l = Object['keys'](this['$options']['facade']['compatibility_types']);
                for (let m = l['length']; m--; )
                    if (this['$options']['facade']['compatibility_types'][l[m]] == j) {
                        if (this['radius']) {
                            k = l[m];
                            break;
                        }
                        k = l[m];
                        break;
                    }
                constructor_settings['core_v2'] ? this['$emit']('change_type', k) : (this['radius'] && 'radius_window' == (k = 'radius' == k ? 'full' : k) && (k = 'window'),
                this['all'] ? this['$root']['$selected_object']['change_facades_style'](k) : (this['item']['params']['style'] = k,
                this['item']['path'] ? this['$root']['$selected_object']['change_facade_type_single'](k, this['item']['type'], this['item']['path']) : this['$root']['$selected_object']['change_facade_type_single'](k, this['item']['type'], this['item']['index'], this['item']['sec_index'])),
                setTimeout( () => {
                    this['$root']['$emit']('check_glass'),
                    this['$root']['$emit']('obj_price_update');
                }
                , 0xc8),
                this['$root']['$emit']('set_menu_facade_style', k));
            },
            'check_radius': function(h) {
                if (this['filter'])
                    return this['filter'](h);
                if (this['radius']) {
                    if (h['radius'])
                        return !0x0;
                } else {
                    if (!h['radius'])
                        return !0x0;
                }
                return !0x1;
            }
        }
    }),
    Vue['component']('from_wall_sizes', {
        'template': '#from_wall_sizes_template',
        'mixins': [mixin],
        'data': function() {
            return {
                'l_floor': 0x0,
                'l_ceiling': 0x0,
                'l_left_wall': 0x0,
                'l_right_wall': 0x0,
                'l_back_wall': 0x0,
                'l_front_wall': 0x0,
                'l_sizes_mode': 0x0,
                'l_pos_from_root': {
                    'x': 0x0,
                    'y': 0x0,
                    'z': 0x0
                },
                'pos_locks': {
                    'x': !0x1,
                    'y': !0x1,
                    'z': !0x1
                },
                'delay': 'undefined' == typeof input_delay ? 0x1f4 : input_delay,
                'debounce': null
            };
        },
        'created': function() {
            let h = this;
            h['l_sizes_mode'] = global_options['additional_sizes_mode'] || 0x0;
            var j = this['$root']['$selected_object'];
            let k = copy_object(j['cust_dists'] || {}), l = ['x', 'y', 'z'], m;
            !j['userData']?.['is_root'] && j['userData']['params']?.['spec']?.['is_fill'] && j['userData']['parent']instanceof CabinetSection && (m = {
                'x': j['userData']['params']['spec']['fill_size_x'] || 0x0,
                'y': j['userData']['params']['spec']['fill_size_y'] || 0x0,
                'z': j['userData']['params']['spec']['fill_size_z'] || 0x0
            }),
            Object['keys'](k)['forEach'](function(n) {
                h['l_' + n] = k[n];
            }),
            m ? l['forEach'](n => {
                0x0 !== m[n] ? Vue['set'](h['pos_locks'], n, !0x0) : Vue['set'](h['pos_locks'], n, !0x1);
            }
            ) : l['forEach'](n => {
                Vue['set'](h['pos_locks'], n, !0x1);
            }
            ),
            this['$root']['$on']('update_sizes_from_wall', function(n, o) {
                Object['keys'](n)['forEach'](function(p) {
                    h['l_' + p] = n[p];
                }),
                o ? l['forEach'](p => {
                    0x1 == o[p] ? Vue['set'](h['pos_locks'], p, 0x1) : Vue['set'](h['pos_locks'], p, 0x0);
                }
                ) : l['forEach'](p => {
                    Vue['set'](h['pos_locks'], p, 0x0);
                }
                ),
                h['l_sizes_mode'] = global_options['additional_sizes_mode'] || 0x0;
            }),
            this['$root']['$on']('additional_sizes_mode_changed', function(n) {
                h['l_sizes_mode'] = n;
            });
        },
        'methods': {
            'change_position': function(h) {
                let j = 0x0;
                switch (h) {
                case 'left':
                    j = this['l_left_wall'];
                    break;
                case 'right':
                    j = this['l_right_wall'];
                    break;
                case 'ceiling':
                    j = this['l_ceiling'];
                    break;
                case 'floor':
                    j = this['l_floor'];
                    break;
                case 'front':
                    j = this['l_front_wall'];
                    break;
                case 'back':
                    j = this['l_back_wall'];
                    break;
                }
                clearTimeout(this['debounce']);
                let k = this
                  , l = k['$root']['$selected_object'];
                if (!l['userData']?.['is_root'] && l['userData']['params']?.['spec']?.['is_fill'] && l['userData']['parent']instanceof CabinetSection) {
                    let m = l['userData']['parent'];
                    this['debounce'] = setTimeout(function() {
                        sc['set_position_from_parent'](h, j, l, m);
                    }, this['delay']);
                } else
                    this['debounce'] = setTimeout(function() {
                        sc['set_position_from_wall'](h, j, k['$root']['$selected_object']);
                    }, this['delay']);
            },
            'change_position_from_root': function(h) {
                var j;
                clearTimeout(this['debounce']);
                let k = this['l_pos_from_root'][h]
                  , l = this['$root']['$selected_object'];
                if (!l['userData']?.['is_root'] && l['userData']['params']?.['spec']?.['is_fill'] && l['userData']['parent']instanceof CabinetSection) {
                    let m = l['userData']['parent'];
                    this['debounce'] = setTimeout(function() {
                        sc['set_position_from_root'](k, h, l, m);
                    }, this['delay']);
                }
            }
        }
    }),
    Vue['component']('facades_picker', {
        'template': '#facades_picker_template',
        'props': {
            'heading': {
                'type': String,
                'default': ''
            },
            'cid': {
                'type': String,
                'default': ''
            },
            'categories': {
                'type': [String, Array],
                'default': function() {
                    return [];
                }
            },
            'items': {
                'type': [String, Array],
                'default': null
            },
            'lib': {
                'type': String,
                'default': 'facades'
            },
            'mode': {
                'type': String,
                'default': 'p'
            },
            'fn': {
                'type': String,
                'default': ''
            },
            'can_facade': {
                'type': [Boolean, Number],
                'default': !0x0
            },
            'can_color': {
                'type': [Boolean, Number],
                'default': !0x0
            },
            'facades': {
                'type': [String, Object],
                'default': {
                    'top': 0x0,
                    'bottom': 0x0
                }
            },
            'materials': {
                'type': [String, Object],
                'default': {
                    0x0: {
                        'gen': {
                            'top': 0x0,
                            'bottom': 0x0
                        }
                    }
                }
            },
            'multiple': {
                'type': Number,
                'default': 0x1
            },
            'method': {
                'type': String,
                'default': 'project'
            },
            'facade_picker': {
                'type': [Boolean, Number],
                'default': !0x0
            },
            'color_picker': {
                'type': [Boolean, Number],
                'default': !0x0
            },
            'mode_type': {
                'type': [String],
                'default': ''
            }
        },
        'mixins': [mixin],
        'data': function() {
            return {
                'expanded': !0x1,
                'l_categories': [],
                'l_facades': {},
                'l_materials': {},
                'selected_materials': {
                    'top': 0x0,
                    'bottom': 0x0
                },
                'l_mode': 'p',
                'l_mode_type': this['mode_type'],
                'l_cid': this['cid'],
                'l_group': 'all',
                'selected_facade': 0x0,
                'selected_key': null,
                'current_facade': 0x0,
                'l_materials_categories': [],
                'is_equal': !0x1,
                'h_top': '',
                'h_bottom': 'Фасады:\x20нижние\x20модули',
                'sel_mats': {}
            };
        },
        'watch': {
            'materials': function() {
                'string' == typeof this['materials'] ? this['l_materials'] = copy_object(utils['nested_object']['get'](project_settings, this['materials'])) : this['l_materials'] = this['materials'];
            },
            'mode': function(h, i) {
                this['l_mode'] = this['mode'];
            },
            'mode_type': function(h, i) {
                this['l_mode_type'] = this['mode_type'];
            },
            'cid': function(h, i) {
                this['l_cid'] = this['cid'];
            }
        },
        'created': function() {
            if (this['l_mode'] = this['mode'],
            !this['items']) {
                let h = [];
                if (0x1 == constructor_settings['multiple_facades_mode']) {
                    for (let i = 0x0; i < project_settings['facade_categories']['length']; i++)
                        h['push'](project_settings['facade_categories'][i]['id']);
                } else {
                    if (this['categories']['length'])
                        h = this['categories'];
                    else {
                        for (let j = 0x0; j < facades_lib['tree']['length']; j++)
                            h['push'](facades_lib['tree'][j]['id']);
                    }
                }
                this['l_categories'] = h;
            }
            'string' == typeof this['facades'] ? this['l_facades'] = copy_object(utils['nested_object']['get'](project_settings, this['facades'])) : this['l_facades'] = this['facades'],
            'string' == typeof this['materials'] ? this['l_materials'] = copy_object(utils['nested_object']['get'](project_settings, this['materials'])) : this['l_materials'] = this['materials'],
            'fc' == this['l_mode_type'] && (this['l_materials_categories'] = Array['from'](new Set([...copy_object(facades_lib['items'][project_settings['models']['top']]['materials']), ...copy_object(facades_lib['items'][project_settings['models']['bottom']]['materials'])])),
            this['selected_materials']['top'] = parseInt(project_settings['selected_materials']['facades'][project_settings['models']['top']]['gen']['top']),
            this['selected_materials']['bottom'] = parseInt(project_settings['selected_materials']['facades'][project_settings['models']['bottom']]['gen']['bottom'])),
            this['sel_mats'] = null,
            this['check_equal'](),
            Vue['nextTick']( () => {
                this['set_height']();
            }
            );
        },
        'methods': {
            'get_color_mode': function() {
                return 0x0 != this['multiple'] && (this['is_equal'] ? 0x1 : 0x0);
            },
            'check_equal': function() {
                if (0x0 == this['multiple'])
                    return this['is_equal'] = !0x1;
                this['is_equal'] = this['l_facades']['top'] == this['l_facades']['bottom'],
                this['is_equal'] ? this['h_top'] = 'Фасады' : this['h_top'] = 'Фасады:\x20верхние\x20модули';
            },
            'find_category': function(h) {
                this['$refs']['catalog']['set_path'](h),
                this['l_mode'] = 'c';
            },
            'select_material': function(h) {
                var j = h['item']
                  , k = (this['l_group'] = h['group'],
                this);
                this['selected_facade'] = j['facade_id'],
                this['l_materials_categories'] = 'gen' == j['key'] ? copy_object(facades_lib['items'][this['selected_facade']]['materials']) : copy_object(facades_lib['items'][this['selected_facade']]['additional_materials'][j['key']]['materials']),
                this['selected_key'] = j['key'],
                this['selected_materials']['top'] = parseInt(this['l_materials'][j['facade_id']][j['key']]['top']),
                this['selected_materials']['bottom'] = parseInt(this['l_materials'][j['facade_id']][j['key']]['bottom']),
                (this['l_mode'] = 'fc') == constructor_settings['components']['mode_type'] && (this['l_mode_type'] = constructor_settings['components']['mode_type'],
                this['l_cid'] || (this['l_cid'] = materials_lib['find_item'](j['id'])['category']),
                this['cid'] = this['l_cid'],
                this['$emit']('update:cid', this['l_cid'])),
                setTimeout(function() {}, 0x1);
            },
            'get_materials_categories': function() {},
            'select_item': function(h, j) {
                if ('object' == this['method'])
                    this['l_facades']['top'] = h['id'],
                    this['l_facades']['bottom'] = h['id'],
                    this['$emit']('change_facade', h);
                else {
                    if ('single' == this['method'])
                        this['l_facades']['top'] = h['id'],
                        this['l_facades']['bottom'] = h['id'],
                        this['$emit']('change_facade_single', h);
                    else {
                        h['id'] ? (this['l_facades']['top'] = h['id'],
                        this['l_facades']['bottom'] = h['id']) : (this['l_facades']['top'] = project_settings['selected_materials']['facades'][project_settings['models']['top']]['gen']['top'],
                        this['l_facades']['bottom'] = project_settings['selected_materials']['facades'][project_settings['models']['bottom']]['gen']['bottom']);
                        let k = _['map'](pp['libs']['modules_groups'], l => l['key']);
                        k?.['length'] || (k = ['top', 'bottom']),
                        j && 'all' !== j && (k = [j]),
                        sc['change_facade'](h['id'], k),
                        Vue['set'](this, 'l_materials', copy_object(project_settings['selected_materials']['facades'])),
                        this['check_equal']();
                    }
                }
            },
            'select_item_top': function(h) {
                h['id'] ? this['l_facades']['top'] = h['id'] : this['l_facades']['top'] = project_settings['selected_materials']['facades'][project_settings['models']['top']]['gen']['top'],
                sc['change_facade'](h['id'], ['top']),
                this['check_equal'](),
                Vue['set'](this, 'l_materials', copy_object(project_settings['selected_materials']['facades']));
            },
            'select_item_bottom': function(h) {
                h['id'] ? this['l_facades']['bottom'] = h['id'] : this['l_facades']['bottom'] = project_settings['selected_materials']['facades'][project_settings['models']['bottom']]['gen']['bottom'],
                sc['change_facade'](h['id'], ['bottom']),
                this['check_equal'](),
                Vue['set'](this, 'l_materials', copy_object(project_settings['selected_materials']['facades']));
            },
            'select_color': function(h) {
                'fc' == this['l_mode_type'] && (this['selected_facade'] = project_settings['models']['top'],
                this['selected_key'] = 'gen'),
                'object' == this['method'] ? this['$emit']('change_material', {
                    'id': this['selected_facade'],
                    'key': this['selected_key'],
                    'mat_id': h['id']
                }) : 'single' == this['method'] ? this['$emit']('change_material_single', {
                    'id': this['selected_facade'],
                    'key': this['selected_key'],
                    'mat_id': h['id']
                }) : (sc['change_facade_material_v2'](this['selected_facade'], this['selected_key'], h['id'], this['l_group']),
                Vue['set'](this, 'l_materials', copy_object(project_settings['selected_materials']['facades'])),
                this['$refs']['fac_top']['cr'](),
                this['$refs']['fac_bottom'] && this['$refs']['fac_bottom']['cr']());
            },
            'select_color_top': function(h) {
                'fc' == this['l_mode_type'] && (this['selected_facade'] = project_settings['models']['top'],
                this['selected_key'] = 'gen'),
                sc['change_facade_material_v2'](this['selected_facade'], this['selected_key'], h['id'], 'top'),
                Vue['set'](this, 'l_materials', copy_object(project_settings['selected_materials']['facades'])),
                this['$refs']['fac_top']['cr'](),
                this['$refs']['fac_bottom']['cr']();
            },
            'select_color_bottom': function(h) {
                'fc' == this['l_mode_type'] && (this['selected_facade'] = project_settings['models']['bottom'],
                this['selected_key'] = 'gen'),
                sc['change_facade_material_v2'](this['selected_facade'], this['selected_key'], h['id'], 'bottom'),
                Vue['set'](this, 'l_materials', copy_object(project_settings['selected_materials']['facades'])),
                this['$refs']['fac_top']['cr'](),
                this['$refs']['fac_bottom']['cr']();
            },
            'change_mode'(h) {
                this['l_mode'] = h,
                this['set_height']();
            },
            'set_height': function() {
                let h = this['$refs'];
                if (this['$refs']['scroll']) {
                    h['scroll']['style']['height'] = 'auto',
                    h['scroll']['style']['overflow'] = 'hidden',
                    h['scroll']['style']['height'] = 'auto';
                    let j = h['scroll']['closest']('.component_panel')
                      , k = j['getElementsByClassName']('heading')[0x0];
                    Vue['nextTick']( () => {
                        cl();
                        let l = j['offsetHeight'] - k['offsetHeight'];
                        h['bread'] && (l -= h['bread']['offsetHeight']),
                        h['scroll']['style']['height'] = l + 'px',
                        h['scroll']['style']['overflow'] = 'auto';
                    }
                    );
                }
            },
            'find_item': function(h) {
                'fc' == constructor_settings['components']['mode_type'] && (this['l_mode_type'] = '',
                this['l_cid'] = '',
                this['$emit']('update:mode_type', this['l_mode_type']),
                this['$emit']('update:cid', this['l_cid'])),
                this['$refs']['catalog']['cr'](),
                this['l_mode'] = 'c';
            }
        }
    }),
    Vue['component']('model_picker', {
        'template': '#model_picker_template',
        'props': ['categories', 'heading', 'catalog', 'lib', 'cid', 'fn', 'hide_variants'],
        'mixins': [mixin],
        'data': function() {
            return {
                'category': 0x0,
                'mode': 'c',
                'search': '',
                'expanded': !0x1,
                'debounce': null,
                'path': [0x0]
            };
        },
        'methods': {
            'reset': function() {},
            'mouse_down': function(h) {
                sc['unset_mouse_mode']();
                var i = copy_object(h);
                switch (this['$root']['$refs']['interface']['classList']['add']('tmp_dis'),
                this['catalog']) {
                case 'comms':
                    i['catalog'] = 'Comms';
                    break;
                case 'tech':
                    i['catalog'] = 'Tech';
                    break;
                case 'interior':
                    i['catalog'] = 'Other';
                    break;
                }
                sc['add_object']('model', i);
            },
            'handle_md': function(h) {
                this['mouse_down'](h);
            }
        }
    }),
    Vue['component']('catalog_picker', {
        'template': '#catalog_picker_template',
        'props': ['categories', 'heading', 'catalog', 'lib', 'cid', 'fn', 'hide_variants'],
        'mixins': [mixin],
        'data': function() {
            return {
                'category': 0x0,
                'mode': 'c',
                'search': '',
                'expanded': !0x1,
                'debounce': null,
                'path': [0x0]
            };
        },
        'methods': {
            'reset': function() {},
            'mouse_down': function(h) {
                if (sc['unset_mouse_mode'](),
                'function' != typeof before_mousedown_catalog || before_mousedown_catalog(h, 'corpus', {})) {
                    if (h['params']['old_type'])
                        switch (h['params']['old_type']) {
                        case 'cabinet':
                            var j = mod_lib['get_item'](h['params']['old_type_id'])['params'];
                            this['$root']['$refs']['interface']['classList']['add']('tmp_dis'),
                            sc['add_object']('cabinet', j);
                        }
                    else {
                        let m = copy_object(h['params']);
                        if (m['is_default'] = !0x0,
                        m['id'] = h['id'],
                        this['$root']['$refs']['interface']['classList']['add']('tmp_dis'),
                        0x1 == h['params']['spec']['is_fill']) {
                            for (let n = room['active_objects']['length']; n--; ) {
                                var k = room['active_objects'][n];
                                'CabinetN' == k['temp_type'] && k['show_drag_areas'](h['id']);
                            }
                            if (custom_settings['draggable_only']) {
                                let o = dp['get']('draggable');
                                if (o['children'] = m['children'],
                                o['spec']['id'] = h['id'],
                                o['spec']['fill'] = m['spec']['fill'],
                                m['variables'] && (o['variables'] || (o['variables'] = {}),
                                Object['keys'](m['variables'])['forEach'](p => {
                                    o['variables'][p] = m['variables'][p];
                                }
                                )),
                                o['materials'] = {},
                                m['spec']['materials']) {
                                    o['spec']['materials'] = m['spec']['materials'];
                                    for (let p = 0x0; p < o['spec']['materials']['length']; p++)
                                        o['materials'][o['spec']['materials'][p]['key']] = o['spec']['materials'][p];
                                }
                                o['name'] = m['name'];
                                var l = m['spec']['variants'][m['spec']['variant']];
                                return o['size'] = {
                                    'x': parseFloat(l['size']['x']),
                                    'y': parseFloat(l['size']['y']),
                                    'z': parseFloat(l['size']['z'])
                                },
                                void sc['add_object']('draggable', o);
                            }
                        }
                        sc['add_object']('cabinet_cn', m);
                    }
                }
            },
            'handle_md': function(h) {
                this['mouse_down'](h);
            }
        }
    }),
    Vue['component']('bardesks_picker', {
        'template': '#bardesks_picker_template',
        'props': ['categories', 'heading', 'catalog', 'lib', 'cid', 'fn', 'hide_variants'],
        'mixins': [mixin],
        'data': function() {
            return {
                'category': 0x0,
                'mode': 'c',
                'search': '',
                'expanded': !0x1,
                'debounce': null,
                'path': [0x0]
            };
        },
        'methods': {
            'reset': function() {},
            'mouse_down': function(h) {
                if (sc['unset_mouse_mode'](),
                h['params']['old_type'])
                    switch (h['params']['old_type']) {
                    case 'cabinet':
                        var j = mod_lib['get_item'](h['params']['old_type_id'])['params'];
                        this['$root']['$refs']['interface']['classList']['add']('tmp_dis'),
                        sc['add_object']('cabinet', j);
                    }
                else {
                    if (0x1 == h['params']['spec']['is_fill'])
                        for (let m = room['active_objects']['length']; m--; ) {
                            var k = room['active_objects'][m];
                            'CabinetN' == k['temp_type'] && k['show_drag_areas'](h['id']);
                        }
                    var l = copy_object(h['params']);
                    for (let n = l['spec']['materials']['length']; n--; )
                        '__tabletop' == l['spec']['materials'][n]['key'] && (l['spec']['materials'][n]['id'] = project_settings['selected_materials']['tabletop']);
                    l['is_default'] = !0x0,
                    l['id'] = h['id'],
                    this['$root']['$refs']['interface']['classList']['add']('tmp_dis'),
                    sc['add_object']('cabinet_cn', l);
                }
            },
            'handle_md': function(h) {
                this['mouse_down'](h);
            }
        }
    }),
    Vue['component']('constr_picker', {
        'template': '#constr_picker_template',
        'props': ['categories', 'heading', 'catalog', 'lib', 'cid', 'fn', 'hide_variants'],
        'mixins': [mixin],
        'data': function() {
            return {
                'category': 0x0,
                'mode': 'c',
                'search': '',
                'expanded': !0x1,
                'debounce': null,
                'path': [0x0]
            };
        },
        'methods': {
            'reset': function() {},
            'expand_panel': function() {
                this['expanded'] = !this['expanded'],
                this['$root']['$emit']('expand_panel', this['expanded']);
            },
            'mouse_down': function(h) {
                var i;
                sc['unset_mouse_mode'](),
                this['$root']['$refs']['interface']['classList']['add']('tmp_dis'),
                h['mode'] ? sc['add_object']('shaft', h) : ((i = copy_object(h))['catalog'] = 'Comms',
                i['id'] = h['id'],
                sc['add_object']('model', i));
            },
            'handle_md': function(h) {
                this['mouse_down'](h);
            }
        }
    }),
    Vue['component']('module_picker', {
        'template': '#module_picker_template',
        'props': ['categories', 'heading', 'cid', 'fn'],
        'mixins': [mixin],
        'data': function() {
            return {
                'mode': 'c',
                'expanded': !0x1
            };
        },
        'methods': {
            'reset': function() {},
            'expand_panel': function() {
                this['expanded'] = !this['expanded'],
                this['$root']['$emit']('expand_panel', this['expanded']);
            },
            'mouse_down': function(h) {
                sc['unset_mouse_mode'](),
                this['$root']['$refs']['interface']['classList']['add']('tmp_dis');
                var i = mod_lib['get_item'](h['id'])['params'];
                i['id'] = h['id'],
                sc['add_object']('cabinet', i);
            },
            'handle_cl': function(h) {},
            'handle_md': function(h) {
                this['mouse_down'](h);
            }
        }
    }),
    Vue['component']('handles_picker', {
        'template': '#handles_picker_template',
        'props': {
            'heading': {
                'type': String,
                'default': ''
            },
            'categories': {
                'type': [String, Array],
                'default': []
            },
            'lib': {
                'type': String,
                'default': 'handles'
            },
            'mode': {
                'type': String,
                'default': 'p'
            },
            'method': {
                'type': String,
                'default': 'project'
            },
            'multiple': {
                'type': Number,
                'default': 0x1
            },
            'item': {
                'type': Object,
                'required': !0x1
            },
            'cabinet_group': {
                'type': String,
                'default': ''
            },
            'handle_type': {
                'type': String,
                'default': ''
            }
        },
        'mixins': [mixin],
        'data': function() {
            return {
                'bottom_as_top': !0x0,
                'top': {
                    'no_handle': !0x1,
                    'selected': 0x1,
                    'orientation': 'vertical',
                    'lockers_position': 'top',
                    'preferable_size': 0x0
                },
                'bottom': {
                    'no_handle': !0x1,
                    'selected': 0x1,
                    'orientation': 'vertical',
                    'lockers_position': 'top',
                    'preferable_size': 0x0
                },
                'expanded': !0x1,
                '_selected': 0x0,
                'l_mode': 'p'
            };
        },
        'watch': {},
        'created': function() {
            if (this['l_mode'] = this['mode'],
            'rm' === this['l_mode']) {
                var h = this['item']['params']['spec']['handle'], j;
                let k = '';
                k = 'a' === h['orient'] ? project_settings['handle'][this['cabinet_group']]['orientation'] : (l => ({
                    'h': 'horizontal',
                    'v': 'vertical',
                    'l': 'left',
                    'r': 'right',
                    'b': 'bottom',
                    't': 'top',
                    'c': 'center'
                }[l] ?? l))(h['orient']),
                Vue['set'](this, 'top', {
                    'no_handle': !(h['active'] || h['enabled']),
                    'selected': h['id'],
                    'orientation': k,
                    'preferable_size': Number(h['p_size']),
                    'head': this['heading'],
                    'cabinet_group': this['l_mode'],
                    'handle_type': this['handle_type'],
                    'pos': this['item']['params']['spec']['handle']['pos']
                });
            } else
                this['bottom_as_top'] = project_settings['handle']['bottom_as_top'],
                Vue['set'](this, 'top', {
                    'no_handle': project_settings['handle']['top']['no_handle'],
                    'selected': project_settings['handle']['top']['selected_model'],
                    'orientation': project_settings['handle']['top']['orientation'],
                    'lockers_position': project_settings['handle']['top']['lockers_position'],
                    'preferable_size': project_settings['handle']['top']['preferable_size'],
                    'head': this['heading'],
                    'handle_type': project_settings['handle']['top']['model']['type'],
                    'pos': {
                        'x': 'a',
                        'y': 'a'
                    }
                }),
                Vue['set'](this, 'bottom', {
                    'no_handle': project_settings['handle']['bottom']['no_handle'],
                    'selected': project_settings['handle']['bottom']['selected_model'],
                    'orientation': project_settings['handle']['bottom']['orientation'],
                    'lockers_position': project_settings['handle']['bottom']['lockers_position'],
                    'preferable_size': project_settings['handle']['bottom']['preferable_size'],
                    'handle_type': project_settings['handle']['bottom']['model']['type'],
                    'pos': {
                        'x': 'a',
                        'y': 'a'
                    }
                });
        },
        'methods': {
            'update': function() {},
            'change_mode': function(h) {
                this['l_mode'] = h,
                'c' == this['l_mode'] && this['$refs']['catalog']['check_scroll']();
            },
            'select_item': function(h) {
                let j = 0x0;
                for (let k = 0x0; k < h['sizes']['length']; k++)
                    h['sizes'][k]['default'] && (j = k);
                h['size'] = j,
                'object' == this['method'] ? this['$emit']('change_handle', h) : 'single' == this['method'] ? this['$emit']('change_handle_single', h) : (this['bottom_as_top'] = !0x0,
                project_settings['handle']['bottom_as_top'] = !0x0,
                this['top']['selected'] = h['id'],
                this['bottom']['selected'] = h['id'],
                this['top']['preferable_size'] = parseInt(j),
                this['bottom']['preferable_size'] = parseInt(j),
                change_handle_model(h['id'], j, 'top'));
            },
            'select_item_top': function(h) {
                this['bottom_as_top'] = !0x1,
                project_settings['handle']['bottom_as_top'] = !0x1,
                this['top']['selected'] = h['id'];
                let j = 0x0;
                for (let k = 0x0; k < h['sizes']['length']; k++)
                    h['sizes'][k]['default'] && (j = k);
                this['top']['preferable_size'] = parseInt(j),
                change_handle_model(h['id'], j, 'top');
            },
            'select_item_bottom': function(h) {
                this['bottom_as_top'] = !0x1,
                project_settings['handle']['bottom_as_top'] = !0x1,
                this['bottom']['selected'] = h['id'];
                let j = 0x0;
                for (let k = 0x0; k < h['sizes']['length']; k++)
                    h['sizes'][k]['default'] && (j = k);
                this['bottom']['preferable_size'] = parseInt(j),
                change_handle_model(h['id'], j, 'bottom');
            },
            'cr': function() {
                this['bottom_as_top'] = project_settings['handle']['bottom_as_top'],
                Vue['set'](this, 'top', {
                    'no_handle': project_settings['handle']['top']['no_handle'],
                    'selected': project_settings['handle']['top']['selected_model'],
                    'orientation': project_settings['handle']['top']['orientation'],
                    'lockers_position': project_settings['handle']['top']['lockers_position'],
                    'preferable_size': project_settings['handle']['top']['preferable_size']
                }),
                Vue['set'](this, 'bottom', {
                    'no_handle': project_settings['handle']['bottom']['no_handle'],
                    'selected': project_settings['handle']['bottom']['selected_model'],
                    'orientation': project_settings['handle']['bottom']['orientation'],
                    'lockers_position': project_settings['handle']['bottom']['lockers_position'],
                    'preferable_size': project_settings['handle']['bottom']['preferable_size']
                });
            },
            'change_no_handle': function(h) {
                this[h]['no_handle'] = !this[h]['no_handle'],
                change_no_handle(this[h]['no_handle'], h);
            },
            'change_orientation': function(h) {
                change_handles_orientation(this[h]['orientation'], h);
            },
            'change_lockers': function(h) {
                change_lockers_handles_position(this[h]['lockers_position'], h);
            },
            'change_size': function(h) {},
            'change_param': function(h) {
                var j = this['$root']['$selected_object']
                  , k = pp['libs']['handles']['find_item'](h['id'])['type'];
                if ('dir' === h['key'] && 'common' == k)
                    switch (h['value']) {
                    case 'l':
                        j['change_param_by_path'](this['item']['path'], 'spec.handle.pos.x', h['value'], !0x1);
                        break;
                    case 'r':
                        j['change_param_by_path'](this['item']['path'], 'spec.handle.pos.x', h['value'], !0x1);
                        break;
                    case 't':
                        j['change_param_by_path'](this['item']['path'], 'spec.handle.pos.y', h['value'], !0x1);
                        break;
                    case 'b':
                        j['change_param_by_path'](this['item']['path'], 'spec.handle.pos.y', h['value'], !0x1);
                        break;
                    case 'c':
                        j['change_param_by_path'](this['item']['path'], 'spec.handle.pos.y', h['value'], !0x1);
                        break;
                    }
                'facade_profile' === k && 'dir' === h['key'] && ('t' === h['value'] || 'b' === h['value'] ? (j['change_param_by_path'](this['item']['path'], 'spec.handle.pos.x', 'c', !0x1),
                j['change_param_by_path'](this['item']['path'], 'spec.handle.pos.y', h['value'], !0x1)) : (j['change_param_by_path'](this['item']['path'], 'spec.handle.pos.x', h['value'], !0x1),
                j['change_param_by_path'](this['item']['path'], 'spec.handle.pos.y', 'c', !0x1))),
                this['$root']['$selected_object']['change_param_by_path'](this['item']['path'], 'spec.handle.' + h['key'], h['value']);
            },
            'find_item': function(h) {
                this['$refs']['catalog']['check_scroll'](),
                this['change_mode']('c');
            },
            'open_item': function(h) {
                this['$emit']('open_item', this['categories']);
            }
        }
    }),
    Vue['component']('washer_picker', {
        'template': '#washer_picker_template',
        'props': ['cid'],
        'mixins': [mixin],
        'data': function() {
            return {
                'category': 0x0,
                'mode': 'c',
                'categories': [0x0],
                'tree': {},
                'expanded': !0x1,
                'debounce': null,
                'path': [0x0]
            };
        },
        'created': function() {
            let h = {
                'id': 0x0,
                'name': '',
                'active': 0x1,
                'categories': [],
                'items': []
            };
            Object['keys'](washes_catalog)['forEach'](function(i) {
                h['items']['push'](washes_catalog[i]);
            }),
            Vue['set'](this, 'tree', h);
        },
        'methods': {
            'lang': function(h) {
                return this['$root']['lang'](h);
            },
            'category_back': function() {
                0x1 != this['path']['length'] && (this['path']['pop'](),
                this['category'] = this['path'][this['path']['length'] - 0x1],
                this['set_panel_height']());
            },
            'set_panel_height': function() {
                let h = this['$refs'];
                h['body']['style']['height'] = 'auto',
                setTimeout(function() {
                    let i = h['comp_el']['parentElement']['offsetHeight'] - h['heading']['offsetHeight'];
                    h['bread'] && (i -= h['bread']['offsetHeight']),
                    h['body']['style']['height'] = i + 'px';
                }, 0x1);
            },
            'expand_panel': function() {
                this['expanded'] = !this['expanded'],
                this['$root']['$emit']('expand_panel', this['expanded']),
                this['set_panel_height']();
            },
            'mouse_down': function(h) {
                sc['unset_mouse_mode'](),
                this['$root']['$refs']['interface']['classList']['add']('tmp_dis');
                var h = copy_object(h);
                sc['add_object']('washer', h);
            },
            'item_style': function(h) {
                var i = {};
                return h['icon'] && (i['background-image'] = 'url(' + correct_url(h['icon']) + ')'),
                i;
            }
        }
    }),
    Vue['component']('shelve_picker', {
        'template': '#shelve_picker_template',
        'props': ['catalog', 'cid'],
        'mixins': [mixin],
        'data': function() {
            return {
                'category': 0x0,
                'mode': 'c',
                'categories': [0x0],
                'tree': {},
                'expanded': !0x1,
                'debounce': null,
                'path': [0x0]
            };
        },
        'created': function() {
            this['cr']();
        },
        'watch': {
            'catalog': function(h, i) {
                this['cr']();
            }
        },
        'methods': {
            'cr': function() {
                var h = {
                    'id': 0x0,
                    'name': '',
                    'active': 0x1,
                    'categories': [],
                    'items': []
                };
                'shelves' == this['catalog'] ? h['items'] = shelves_catalog['items'] : h['items'] = bardesk_catalog['items'],
                Vue['set'](this, 'tree', h);
            },
            'set_panel_height': function() {
                let h = this['$refs'];
                h['body']['style']['height'] = 'auto',
                setTimeout(function() {
                    let i = h['comp_el']['parentElement']['offsetHeight'] - h['heading']['offsetHeight'];
                    h['bread'] && (i -= h['bread']['offsetHeight']),
                    h['body']['style']['height'] = i + 'px';
                }, 0x1);
            },
            'expand_panel': function() {
                this['expanded'] = !this['expanded'],
                this['$root']['$emit']('expand_panel', this['expanded']),
                this['set_panel_height']();
            },
            'mouse_down': function(h) {
                sc['unset_mouse_mode'](),
                this['$root']['$refs']['interface']['classList']['add']('tmp_dis');
                var h = copy_object(h['params']);
                'shelves' == this['catalog'] ? sc['add_object']('shelve', h) : sc['add_object']('bardesk', h);
            },
            'item_style': function(h) {
                var i = {};
                return h['icon'] && (i['background-image'] = 'url(' + correct_url(h['icon']) + ')'),
                i;
            }
        }
    }),
    Vue['component']('bardesk_picker', {
        'template': '#bardesk_picker_template',
        'props': ['catalog', 'cid'],
        'mixins': [mixin],
        'data': function() {
            return {
                'category': 0x0,
                'mode': 'c',
                'categories': [0x0],
                'tree': {},
                'expanded': !0x1,
                'debounce': null,
                'path': [0x0]
            };
        },
        'created': function() {
            this['cr']();
        },
        'watch': {
            'catalog': function(h, i) {
                this['cr']();
            }
        },
        'methods': {
            'cr': function() {
                var h = {
                    'id': 0x0,
                    'name': '',
                    'active': 0x1,
                    'categories': [],
                    'items': []
                };
                'shelves' == this['catalog'] ? h['items'] = shelves_catalog['items'] : h['items'] = bardesk_catalog['items'],
                Vue['set'](this, 'tree', h);
            },
            'set_panel_height': function() {
                let h = this['$refs'];
                h['body']['style']['height'] = 'auto',
                setTimeout(function() {
                    let i = h['comp_el']['parentElement']['offsetHeight'] - h['heading']['offsetHeight'];
                    h['bread'] && (i -= h['bread']['offsetHeight']),
                    h['body']['style']['height'] = i + 'px';
                }, 0x1);
            },
            'expand_panel': function() {
                this['expanded'] = !this['expanded'],
                this['$root']['$emit']('expand_panel', this['expanded']),
                this['set_panel_height']();
            },
            'mouse_down': function(h) {
                sc['unset_mouse_mode'](),
                this['$root']['$refs']['interface']['classList']['add']('tmp_dis');
                var h = copy_object(h['params']);
                'shelves' == this['catalog'] ? sc['add_object']('shelve', h) : sc['add_object']('bardesk', h);
            },
            'item_style': function(h) {
                var i = {};
                return h['icon'] && (i['background-image'] = 'url(' + correct_url(h['icon']) + ')'),
                i;
            }
        }
    }),
    Vue['component']('project_picker', {
        'template': '#project_picker_template',
        'props': ['cid'],
        'data': function() {
            return {
                'category': 0x0,
                'mode': 'c',
                'categories': [0x0],
                'tree': {},
                'expanded': !0x1,
                'debounce': null,
                'path': [0x0]
            };
        },
        'created': function() {
            let h = this;
            var i = {
                'id': 0x0,
                'name': '',
                'active': 0x1,
                'categories': [],
                'items': [],
                'selected': null
            };
            i['items'] = kitchen_templates,
            this['$options']['tree'] = i,
            this['$root']['$on']('yn_modal_project', function(j) {
                j && h['load']();
            }),
            this['$nextTick']( () => {
                this['set_panel_height']();
            }
            );
        },
        'methods': {
            'lang': function(h) {
                return this['$root']['lang'](h);
            },
            'category_back': function() {
                0x1 != this['path']['length'] && (this['path']['pop'](),
                this['category'] = this['path'][this['path']['length'] - 0x1],
                this['set_panel_height']());
            },
            'set_panel_height': function() {
                let h = this['$refs'];
                h['body']['style']['height'] = 'auto',
                setTimeout(function() {
                    let i = h['comp_el']['parentElement']['offsetHeight'] - h['heading']['offsetHeight'];
                    h['bread'] && (i -= h['bread']['offsetHeight']),
                    h['body']['style']['height'] = i + 'px';
                }, 0x1);
            },
            'expand_panel': function() {
                this['expanded'] = !this['expanded'],
                this['$root']['$emit']('expand_panel', this['expanded']),
                this['set_panel_height']();
            },
            'select_item': async function(h) {
                this['$root']['$emit']('yn_modal_show', {
                    'heading': '',
                    'body': this['lang']('project_overwrite_notice'),
                    'callback': async function() {
                        let j, k;
                        h['file']['endsWith'](global_options['save_file_zip']) ? (j = await promise_request_blob(h['file']),
                        (k = new FileReader())['onload'] = async function(l) {
                            try {
                                var m = await JSZip['loadAsync'](l['target']['result']);
                                if (m['files']['project.json']) {
                                    var p = await m['files']['project.json']['async']('string'), q;
                                    if (load_scene_new(p),
                                    m['folder']('textures'))
                                        for (let x of Object['keys'](m['files'])['filter'](y => y['startsWith']('textures/'))) {
                                            var u = await m['files'][x]['async']('base64'), v, w = 'data:' + (x['endsWith']('.png') ? 'image/png' : 'image/jpeg') + ';base64,' + u;
                                            let y = new Image();
                                            y['onload'] = () => {
                                                x['includes']('lr_wall') ? (sc['set_walls_custom_material'](y),
                                                global_options['custom_textures']['lr_wall']['texture'] = y['src'],
                                                global_options['custom_textures']['fb_wall']['texture'] = y['src']) : x['includes']('floor') && (sc['set_floor_custom_material'](y),
                                                global_options['custom_textures']['floor']['texture'] = y['src']);
                                            }
                                            ,
                                            y['src'] = w;
                                        }
                                }
                            } catch (z) {}
                        }
                        ,
                        k['readAsArrayBuffer'](j['response'])) : (j = await promise_request(h['file']),
                        load_scene_new(JSON['stringify'](j)));
                    }
                });
            },
            'load': async function() {
                var h = await promise_request(this['$options']['tree']['items'][this['selected']]['file']);
                load_scene_new(JSON['stringify'](h));
            },
            'click': async function(h) {
                this['selected'] = h,
                this['$root']['$emit']('yn_modal_show', {
                    'heading': '',
                    'body': this['lang']('project_overwrite_notice'),
                    'cb': 'project'
                });
            },
            'item_style': function(h) {
                var i = {};
                return h['icon'] && (i['background-image'] = 'url(' + correct_url(h['icon']) + ')'),
                i;
            }
        }
    }),
    Vue['component']('selected_material', {
        'template': '#selected_material_template',
        'props': {
            'has_auto': {
                'type': [String, Number],
                'default': 0x0
            },
            'selected': {
                'type': [String, Number],
                'default': null
            },
            'cropper_enabled': 0x0,
            'lib': {
                'type': String,
                'default': 'materials'
            },
            'heading': {
                'type': String,
                'default': lang['current_material']
            },
            'f_key': {
                'type': String,
                'default': null
            },
            'add_data': {
                'type': Object,
                'default': null
            }
        },
        'mixins': [mixin],
        'data': function() {
            return {
                '_selected': 0x0,
                'item': {},
                '_lib': ''
            };
        },
        'watch': {
            'selected': function(h, i) {
                this['cr']();
            },
            'lib': function(h, i) {
                this['cr']();
            }
        },
        'created': function() {
            this['cr']();
        },
        'methods': {
            'cr': function() {
                let h = '';
                switch (this['lib']) {
                case 'materials':
                    h = materials_lib;
                    break;
                case 'glass':
                    h = glass_lib;
                    break;
                case 'washers':
                    h = washes_materials_lib;
                    break;
                case 'tabletop':
                    h = tabletop_lib;
                    break;
                default:
                    h = materials_lib;
                }
                !constructor_settings['core_v2'] || 'cokol' !== this['lib'] && 'cokol_top' !== this['lib'] && 'cornice' !== this['lib'] && 'facades' !== this['lib'] || (h = pp['libs'][this['lib']]),
                ('' + this['lib'])['startsWith']('butts.') && (h = _['get'](pp['libs'], this['lib'])),
                ('' + this['lib'])['startsWith']('catalogs.') && (h = _['get'](pp['libs'], this['lib'])),
                this['_lib'] = this['lib'],
                'string' == typeof this['selected'] ? this['_selected'] = utils['nested_object']['get'](project_settings, this['selected']) : this['_selected'] = this['selected'],
                this['$options']['lib'] = h,
                this['has_auto'] && 0x0 == this['_selected'] ? this['item'] = {
                    'name': 'Автоматически',
                    'code': '',
                    'icon': '/common_assets/assets/misc_icons/auto_butt.jpg'
                } : this['item'] = this['$options']['lib']['get_item'](this['_selected']);
            },
            'check_embedded_image': function() {
                let h = null;
                var j, k, l, j;
                return h = this['$root']['$selected_object'] && (j = this['$root']['$selected_object']['params']['obj_id'],
                k = this['add_data']['key'],
                j = document['getElementById'](j + ':' + k)) ? {
                    'background-size': 'cover',
                    'background-image': 'url(' + j['src'] + ')'
                } : h;
            },
            'find_item': function(h, i=null) {
                this['cropper_enabled'] ? this['$root']['$emit']('cropper_modal_show', copy_object(this['add_data'])) : null != this['add_data'] ? this['$emit']('find_item', {
                    'id': h,
                    'data': this['add_data']
                }) : null != this['f_key'] ? this['$emit']('find_item', {
                    'id': h,
                    'key': this['f_key']
                }) : this['$emit']('find_item', h);
            }
        }
    }),
    Vue['component']('selected_material_multiple', {
        'template': '#selected_material_multiple_template',
        'props': {
            'selected': {
                'type': [String, Number],
                'default': null
            },
            'selected2': {
                'type': [String, Number],
                'default': null
            },
            'lib': {
                'type': String,
                'default': 'materials'
            },
            'heading': {
                'type': String,
                'default': lang['current_material']
            },
            'f_key': {
                'type': String,
                'default': null
            },
            'is_equal': {
                'type': Boolean,
                'default': !0x1
            }
        },
        'mixins': [mixin],
        'data': function() {
            return {
                '_selected': 0x0,
                '_selected2': 0x0,
                'item': {},
                'item2': {},
                '_lib': ''
            };
        },
        'watch': {
            'selected': function(h, i) {
                this['cr']();
            },
            'selected2': function(h, i) {
                this['cr']();
            },
            'lib': function(h, i) {
                this['cr']();
            }
        },
        'created': function() {
            this['cr']();
        },
        'methods': {
            'cr': function() {
                let h = '';
                switch (this['lib']) {
                case 'materials':
                    h = materials_lib;
                    break;
                case 'glass':
                    h = glass_lib;
                    break;
                default:
                    h = materials_lib;
                }
                this['_lib'] = this['lib'],
                'string' == typeof this['selected'] ? this['_selected'] = utils['nested_object']['get'](project_settings, this['selected']) : this['_selected'] = this['selected'],
                'string' == typeof this['selected2'] ? this['_selected2'] = utils['nested_object']['get'](project_settings, this['selected2']) : this['_selected2'] = this['selected2'],
                this['$options']['lib'] = h,
                this['item'] = this['$options']['lib']['get_item'](this['_selected']),
                this['item2'] = this['$options']['lib']['get_item'](this['_selected2']);
            },
            'rotate_texture': function(h) {
                sc['change_facade_material']({
                    'id': parseInt(this['_selected2']),
                    'rotated': !project_settings['selected_materials'][h]['facades_rotated'],
                    'group': h
                });
            },
            'find_item': function(h, i) {
                null != this['f_key'] ? this['$emit']('find_item', {
                    'id': h,
                    'key': this['f_key']
                }) : this['$emit']('find_item', h);
            }
        }
    }),
    Vue['component']('selected_material_ext', {
        'template': '#selected_material_template_ext',
        'props': {
            'selected': {
                'type': [Object, String],
                'default': {
                    'id': 0x0,
                    'key': 'type_0'
                }
            },
            'lib': {
                'type': String,
                'default': 'materials'
            },
            'types_list': {
                'type': String,
                'default': null
            },
            'heading': {
                'type': String,
                'default': lang['current_material']
            }
        },
        'mixins': [mixin],
        'data': function() {
            return {
                '_selected': {
                    'key': 'type_0',
                    'id': 0x0
                },
                'item': {},
                '_lib': '',
                'type_name': ''
            };
        },
        'watch': {
            'selected': function(h, i) {
                this['cr']();
            },
            'lib': function(h, i) {
                this['cr']();
            }
        },
        'created': function() {
            this['cr']();
        },
        'methods': {
            'cr': function() {
                let h = '';
                switch (this['lib']) {
                case 'materials':
                    h = materials_lib;
                    break;
                case 'glass':
                    h = glass_lib;
                    break;
                default:
                    h = materials_lib;
                }
                var i, i = (this['_lib'] = this['lib'],
                'string' == typeof this['selected'] ? (!(i = copy_object(utils['nested_object']['get'](project_settings, this['selected'])))['id'] && i['default'] && (i['id'] = i['default']),
                delete i['default'],
                this['_selected'] = i) : this['_selected'] = this['selected'],
                copy_object(utils['nested_object']['get'](project_settings, this['types_list'])));
                this['type_name'] = i[this['_selected']['key']]['name'],
                this['$options']['lib'] = h,
                this['item'] = this['$options']['lib']['get_item'](this['_selected']['id']);
            },
            'find_item': function(h) {
                this['$emit']('find_item', {
                    'id': h,
                    'key': this['_selected']['key']
                });
            }
        }
    }),
    Vue['component']('lockers_component_new', {
        'template': '#lockers_params_template',
        'created': function() {
            this['$options']['lockers_types'] = lockers_types,
            this['$options']['v2'] = 0x2 == lockers_version,
            this['$options']['test'] = {
                0x1: 0x1,
                0x0: 0x0
            },
            this['init']();
        },
        'data': function() {
            return {
                'params': null
            };
        },
        'methods': {
            'init': function() {
                var h;
                Vue['set'](this, 'params', active_el['get_lockers_by_position']());
            },
            'root_update': function() {
                this['$root']['$emit']('obj_price_update'),
                this['$root']['$emit']('module_menu_recalc');
            },
            'change_param': function(h, j, k) {
                var l = {
                    'key': j
                };
                l['val'] = (k ? h['type_params'] : h)[j],
                active_el['set_locker_param'](l, k, 'l', h['index'], h['sec_index']),
                this['root_update']();
            },
            'check_inner_available': function(h) {
                let j = 0x0
                  , k = h['type'];
                var l;
                let m = active_el['find_child_by_index']('l', h['index'], h['sec_index'])['obj']['params']['height'];
                return Object['keys'](lockers_types[k]['types'])['forEach'](function(n) {
                    0x1 == lockers_types[k]['types'][n]['is_inner'] && m >= lockers_types[k]['types'][n]['min_facade_height'] && m <= lockers_types[k]['types'][n]['max_facade_height'] && (j = 0x1);
                }),
                j;
            }
        }
    }),
    Vue['component']('kitchen_style_picker', {
        'template': '#kitchen_style_picker_template',
        'props': {
            'selected': {
                'type': [String, Number],
                'default': 0x0
            },
            'lib': {
                'type': String,
                'default': 'materials'
            },
            'mode': {
                'type': String,
                'default': 'p'
            },
            'fn': {
                'type': String,
                'default': ''
            },
            'emit': {
                'type': Boolean,
                'default': !0x1
            }
        },
        'mixins': [mixin],
        'data': function() {
            return {
                'expanded': !0x1,
                'l_mode': '',
                'l_selected': 0x0,
                'sel_desc': {
                    'icon': '',
                    'name': ''
                }
            };
        },
        'watch': {
            'l_selected': function(h, i) {
                this['sel_desc']['icon'] = kitchen_styles[ks_map[this['l_selected']]]['icon'],
                this['sel_desc']['name'] = kitchen_styles[ks_map[this['l_selected']]]['name'];
            }
        },
        'created': function() {
            this['$options']['items'] = kitchen_styles,
            this['l_selected'] = this['selected'],
            0x0 == this['l_selected'] && (this['l_selected'] = project_settings['id']),
            this['l_mode'] = this['mode'],
            this['sel_desc']['icon'] = kitchen_styles[ks_map[this['l_selected']]]['icon'],
            this['sel_desc']['name'] = kitchen_styles[ks_map[this['l_selected']]]['name'],
            this['$root']['$on']('set_kitchen_style_selected', h => {
                this['l_selected'] = h;
            }
            );
        },
        'methods': {
            'item_style': function(h) {
                var i = {}
                  , h = kitchen_styles[ks_map[h]];
                return '' == h['icon'] ? i['background-image'] = 'url(/common_assets/images/no_image.png)' : i['background-image'] = 'url(' + correct_url(h['icon']) + ')',
                i;
            },
            'set_panel_height': function() {
                let h = this['$refs'];
                h['body']['style']['height'] = 'auto',
                setTimeout(function() {
                    let i = h['comp_el']['parentElement']['offsetHeight'] - h['heading']['offsetHeight'];
                    h['bread'] && (i -= h['bread']['offsetHeight']),
                    h['body']['style']['height'] = i + 'px';
                }, 0x1);
            },
            'select_item': function(h) {
                this['l_selected'] = h['id'],
                global_temp['kitchen_style_id'] = h['id'],
                change_kitchen_style(h['id'], !0x0, !0x0);
            },
            'emit_select': function(h) {
                this['$emit']('change_material', h);
            },
            'find_item': function(h) {
                this['set_panel_height'](),
                this['l_mode'] = 'c';
            },
            'selected_item': function() {}
        }
    }),
    Vue['component']('selected_item', {
        'template': '#selected_item_template',
        'props': {
            'selected': {
                'type': [String, Number],
                'default': 0x0
            },
            'lib': {
                'type': String,
                'default': 'materials'
            },
            'heading': {
                'type': String,
                'default': ''
            }
        },
        'mixins': [mixin],
        'created': function() {
            'materials' !== this['lib'] || libs[this['lib']] ? this['$options']['lib'] = libs[this['lib']]['get_item'](this['selected']) : this['$options']['lib'] = pp['libs']['decors']['get_item'](this['selected']);
        },
        'computed': {
            'item': function() {
                return ('materials' !== this['lib'] || libs[this['lib']] ? libs[this['lib']] : pp['libs']['decors'])['get_item'](this['selected']);
            }
        },
        'data': function() {
            return {};
        },
        'methods': {
            'select_category'(h, i) {},
            'find_item'(h) {
                this['$emit']('find_item', {
                    'id': h
                });
            }
        }
    }),
    Vue['component']('object_picker', {
        'template': '#object_picker_template',
        'data': function() {
            return {
                'items': []
            };
        }
    }),
    Vue['component']('room_params', {
        'template': '#room_params_template',
        'mixins': [mixin],
        'data': function() {
            return {
                'w': 0x0,
                'h': 0x0,
                'd': 0x0,
                'l_mode': 'p',
                'delay': 'undefined' == typeof input_delay ? 0x1f4 : input_delay,
                'debounce': null
            };
        },
        'created': function() {
            try {
                var h = sc['get_room_size']();
                this['w'] = h['w'],
                this['h'] = h['h'],
                this['d'] = h['d'];
            } catch (i) {}
        },
        'methods': {
            'apply': function() {
                clearTimeout(this['debounce']);
                let h = this;
                this['debounce'] = setTimeout(function() {
                    sc['set_room_size'](h['w'], h['h'], h['d']);
                }, this['delay']);
            }
        }
    }),
    Vue['component']('kitchen_params', {
        'template': '#kitchen_params_template',
        'props': ['test'],
        'data': function() {
            return {
                'tabletop_thickness': 0x0,
                'cokol_height': 0x0,
                'top_depth': pp['interface']['root']['$custom_top_depth_value'],
                'top_apply_by_default': pp['interface']['root']['$custom_top_depth'],
                'bottom_depth': pp['interface']['root']['$custom_bottom_depth_value'],
                'bottom_apply_by_default': pp['interface']['root']['$custom_bottom_depth'],
                'top_height': pp['interface']['root']['$custom_top_height_value'],
                'top_apply_height_by_default': pp['interface']['root']['$custom_top_height'],
                'bottom_height': pp['interface']['root']['$custom_bottom_height_value'],
                'bottom_apply_height_by_default': pp['interface']['root']['$custom_bottom_height'],
                'cokol_float': !0x1,
                'dsp_thickness': 0x10,
                'dsp_variants': copy_object(project_settings['available_corpus_thickness']),
                'delay': 0x0
            };
        },
        'created': function() {
            this['cr'](),
            this['$root']['$on']('project_loaded', () => {
                this['cr']();
            }
            );
        },
        'methods': {
            'cr': function() {
                this['tabletop_thickness'] = project_settings['tabletop_thickness'],
                this['cokol_height'] = project_settings['cokol_height'],
                this['delay'] = input_delay,
                null == project_settings['cokol_disabled'] && (project_settings['cokol_disabled'] = !0x1),
                this['cokol_float'] = project_settings['cokol_disabled'];
            },
            'lang': function(h) {
                return this['$root']['lang'](h);
            },
            'change_tabletop_thickness': function(h) {
                clearTimeout(this['debounce']);
                let i = this;
                this['debounce'] = setTimeout(function() {
                    change_tabletop_thickness(i['tabletop_thickness']);
                }, this['delay']);
            },
            'change_cokol_height': function() {
                clearTimeout(this['debounce']);
                let h = this;
                this['debounce'] = setTimeout(function() {
                    change_cokol_height(h['cokol_height']);
                }, this['delay']);
            },
            'change_cokol_float': function() {
                project_settings['cokol_disabled'] = this['cokol_float'];
                for (let h = room['active_objects']['length']; h--; )
                    'Cabinet' === room['active_objects'][h]['type'] && 'bottom' === room['active_objects'][h]['params']['cabinet_group'] && (room['active_objects'][h]['params']['cokol']['disabled'] = this['cokol_float'],
                    room['active_objects'][h]['build_cokol']());
            },
            'change_dsp_thickness': function() {
                for (let h = room['active_objects']['length'] - 0x1; 0x0 <= h; h--)
                    'Cabinet' === room['active_objects'][h]['type'] && (room['active_objects'][h]['params']['cabinet']['thickness'] = parseInt(this['dsp_thickness']),
                    room['active_objects'][h]['build']());
            },
            'change_top_depth': function() {
                pp['interface']['root']['$custom_top_depth_value'] = parseInt(this['top_depth']);
            },
            'change_bottom_depth': function() {
                pp['interface']['root']['$custom_bottom_depth_value'] = parseInt(this['bottom_depth']);
            },
            'change_apply_by_default_top': function() {
                pp['interface']['root']['$custom_top_depth'] = this['top_apply_by_default'];
            },
            'change_apply_by_default_bottom': function() {
                pp['interface']['root']['$custom_bottom_depth'] = this['bottom_apply_by_default'];
            },
            'change_top_height': function() {
                pp['interface']['root']['$custom_top_height_value'] = parseInt(this['top_height']);
            },
            'change_bottom_hegiht': function() {
                pp['interface']['root']['$custom_bottom_height_value'] = parseInt(this['bottom_height']);
            },
            'change_apply_height_by_default_top': function() {
                pp['interface']['root']['$custom_top_height'] = this['top_apply_height_by_default'];
            },
            'change_apply_height_by_default_bottom': function() {
                pp['interface']['root']['$custom_bottom_height'] = this['bottom_apply_height_by_default'];
            },
            'apply_top_depth': function() {
                this['$root']['$emit']('yn_modal_show', {
                    'body': this['lang']('apply_to_top') + '?',
                    'heading': this['lang']('confirm_action'),
                    'callback': function() {
                        sc['mass_depth_change']('top', pp['interface']['root']['$custom_top_depth_value']);
                    }
                });
            },
            'apply_bottom_depth': function() {
                this['$root']['$emit']('yn_modal_show', {
                    'body': this['lang']('apply_to_bottom') + '?',
                    'heading': this['lang']('confirm_action'),
                    'callback': function() {
                        sc['mass_depth_change']('bottom', pp['interface']['root']['$custom_bottom_depth_value']);
                    }
                });
            },
            'apply_top_height': function() {
                this['$root']['$emit']('yn_modal_show', {
                    'body': this['lang']('apply_to_top') + '?',
                    'heading': this['lang']('confirm_action'),
                    'callback': function() {
                        sc['mass_height_change']('top', pp['interface']['root']['$custom_top_height_value']);
                    }
                });
            },
            'apply_bottom_height': function() {
                this['$root']['$emit']('yn_modal_show', {
                    'body': this['lang']('apply_to_bottom') + '?',
                    'heading': this['lang']('confirm_action'),
                    'callback': function() {
                        sc['mass_height_change']('bottom', pp['interface']['root']['$custom_bottom_height_value']);
                    }
                });
            }
        }
    }),
    Vue['component']('cabinet_tree_item', {
        'template': '#cabinet_tree_item',
        'props': ['item', 'current'],
        'data': function() {
            return {
                'is_open': !0x1
            };
        },
        'computed': {
            'is_folder': function() {
                return 'folder' == this['item']['type'] && this['item']['children']['length'];
            },
            'is_current': function() {
                return this['item']['id'] == this['current'];
            }
        },
        'methods': {
            'toggle': function() {
                this['item']['is_open'] || Vue['set'](this['item'], 'is_open', !0x1),
                this['is_folder'] && (this['is_open'] = !this['is_open'],
                this['item']['is_open'] = !this['item']['is_open'],
                this['$emit']('toggle', this['item']));
            },
            'select_folder_t': function() {
                this['select_folder'](this['item']);
            },
            'select_folder': function(h) {
                this['$emit']('select_folder', h),
                this['is_open'] = !0x0,
                Vue['set'](this['item'], 'is_open', !0x0);
            },
            'make_folder': function() {
                this['is_folder'] || (this['$emit']('make_folder', this['item']),
                this['is_open'] = !0x0);
            }
        }
    }),
    Vue['component']('cabinet_conf_block', {
        'template': '#cabinet_conf_block',
        'data': function() {
            return {
                'params': [],
                'is_object': 0x0,
                'current_item': -0x1
            };
        },
        'created': async function() {
            let h = this;
            this['$options']['block_keys'] = ['sections', 'walls', 'doors', 'lockers', ''],
            h['$options']['selected'] = null,
            h['$root']['$on']('set_selected', function(i) {
                h['$options']['selected'] = i,
                h['is_object'] = null != i,
                null != i ? i['userData']['params'] && Vue['set'](h, 'params', copy_object(i['userData']['params']['spec'])) : Vue['set'](h, 'params', []);
            });
        },
        'computed': {},
        'methods': {
            'toggle': function() {}
        }
    });
    let f = {
        'cabinet': [{
            'key': 'cabinet',
            'type': 'single',
            'name': 'Базовые\x20параметры',
            'children': [{
                'key': 'width',
                'name': 'Ширина',
                'type': 'number'
            }, {
                'key': 'height',
                'name': 'Высота',
                'type': 'number'
            }, {
                'key': 'depth',
                'name': 'Глубина',
                'type': 'number'
            }]
        }],
        'shelves': [{
            'key': 'shelves',
            'type': 'multi',
            'name': 'Базовые\x20параметры',
            'children': [{
                'key': 'orientation',
                'name': 'Ориентация',
                'type': 'select',
                'values': [{
                    'label': 'Вертикальная',
                    'val': 'vertical'
                }, {
                    'label': 'Горизонтальная',
                    'val': 'horizontal'
                }],
                'default': 'horizontal'
            }, {
                'key': 'width',
                'name': 'Ширина',
                'type': 'input%',
                'default': '100%'
            }, {
                'key': 'height',
                'name': 'Толщина',
                'type': 'number',
                'default': parseInt(project_settings['shelves_thickness'])
            }, {
                'key': 'starting_point_x',
                'name': 'Позиция\x20по\x20гор.',
                'type': 'input%',
                'default': '50%'
            }, {
                'key': 'starting_point_y',
                'name': 'Позиция\x20по\x20верт.',
                'type': 'input%',
                'default': '0%'
            }]
        }],
        'doors': [{
            'key': 'doors',
            'type': 'multi',
            'name': 'Базовые\x20параметры',
            'children': [{
                'key': 'type',
                'name': 'Тип\x20открывания',
                'type': 'select',
                'values': [{
                    'label': 'Направо',
                    'val': 'ltr'
                }, {
                    'label': 'Налево',
                    'val': 'rtl'
                }, {
                    'label': 'Вверх',
                    'val': 'simple_top'
                }, {
                    'label': 'Вниз',
                    'val': 'simple_bottom'
                }, {
                    'label': 'Aventos\x20HL',
                    'val': 'front_top'
                }, {
                    'label': 'Aventos\x20HF',
                    'val': 'double_top'
                }, {
                    'label': 'Фальшфасад',
                    'val': 'falsefacade'
                }, {
                    'label': 'Купе\x20налево',
                    'val': 'coupe_l'
                }, {
                    'label': 'Купе\x20направо',
                    'val': 'coupe_r'
                }]
            }, {
                'key': 'style',
                'name': 'Тип\x20фасада',
                'type': 'select',
                'values': [{
                    'label': 'Глухой',
                    'val': 'full'
                }, {
                    'label': 'Витрина',
                    'val': 'window'
                }, {
                    'label': 'Решетка',
                    'val': 'frame'
                }]
            }, {
                'key': 'width',
                'name': 'Ширина',
                'type': 'input%'
            }, {
                'key': 'height',
                'name': 'Высота',
                'type': 'input%'
            }, {
                'key': 'starting_point_x',
                'name': 'Позиция\x20по\x20гор.',
                'type': 'input%'
            }, {
                'key': 'starting_point_y',
                'name': 'Позиция\x20по\x20верт.',
                'type': 'input%'
            }, {
                'key': 'offset_top',
                'name': 'Отступ\x20сверху\x20(мм)',
                'type': 'number'
            }, {
                'key': 'offset_bottom',
                'name': 'Отступ\x20снизу\x20(мм)',
                'type': 'number'
            }, {
                'key': 'handle_position',
                'name': 'Ручка',
                'type': 'select',
                'values': [{
                    'label': 'Сверху',
                    'val': 'top'
                }, {
                    'label': 'По\x20центру',
                    'val': 'center'
                }, {
                    'label': 'Снизу',
                    'val': 'bottom'
                }]
            }]
        }],
        'lockers': [{
            'key': 'lockers',
            'type': 'multi',
            'name': 'Базовые\x20параметры',
            'children': [{
                'key': 'style',
                'name': 'Тип\x20фасада',
                'type': 'select',
                'values': [{
                    'label': 'Глухой',
                    'val': 'full'
                }, {
                    'label': 'Витрина',
                    'val': 'window'
                }, {
                    'label': 'Решетка',
                    'val': 'frame'
                }]
            }, {
                'key': 'inner',
                'name': 'Тип\x20ящика',
                'type': 'select',
                'values': [{
                    'label': 'Обычный',
                    'val': !0x1
                }, {
                    'label': 'Внутренний',
                    'val': !0x0
                }]
            }, {
                'key': 'width',
                'name': 'Ширина',
                'type': 'input%'
            }, {
                'key': 'height',
                'name': 'Высота',
                'type': 'input%'
            }, {
                'key': 'starting_point_x',
                'name': 'Позиция\x20по\x20гор.',
                'type': 'input%'
            }, {
                'key': 'starting_point_y',
                'name': 'Позиция\x20по\x20верт.',
                'type': 'input%'
            }]
        }]
    };
    var g;
    Vue['component']('component_number_with_select', {
        'template': '#component_number_with_select',
        'props': {
            'value': [Number, String],
            'def': [Number, String],
            'delay': {
                'type': Number,
                'default': 'undefined' == typeof input_delay ? 0x1f4 : input_delay
            }
        },
        'created': function() {
            let h = this['value'];
            'string' == typeof (h = null == h ? this['def'] : h) && '%' == h[h['length'] - 0x1] && (this['select_value'] = '%'),
            this['input_value'] = parseFloat(h),
            this['$options']['timeout'] = null;
        },
        'mounted': function() {},
        'computed': {
            'return_val': function() {
                return '%' == this['select_value'] ? this['input_value'] + this['select_value'] : parseFloat(this['input_value']);
            }
        },
        'data': function() {
            return {
                'input_value': 0x0,
                'select_value': 'mm',
                'timeout': null
            };
        },
        'methods': {
            'on_change': function(h) {
                var i = this;
                i['$emit']('input', i['return_val']);
            },
            'lang': function(h) {
                return lang[h];
            }
        }
    }),
    Vue['component']('conf_new', {
        'template': '#conf_block',
        'props': {
            'param': String
        },
        'created': function() {
            this['cr']();
        },
        'watch': {
            'param': function() {
                this['cr']();
            }
        },
        'mounted': function() {},
        'data': function() {
            return {
                'params': [],
                'selected_block': 0x0,
                'is_object': 0x0,
                'mode': 0x0,
                'test_val': 0x0,
                'delay': 'undefined' == typeof input_delay ? 0x1f4 : input_delay,
                'debounce': null
            };
        },
        'methods': {
            'cr': function() {
                var h = this
                  , j = h['$root']['$selected_object']
                  , k = copy_object(j['params'][h['param']])
                  , m = (this['$options']['interface'] = f[this['param']],
                this['$options']['interface']);
                for (let x = 0x0; x < m['length']; x++) {
                    var p = m[x];
                    if ('multi' == p['type'])
                        for (let y = 0x0; y < k['length']; y++) {
                            var q = k[y];
                            for (let z = 0x0; z < p['children']['length']; z++) {
                                var u = p['children'][z];
                                !q[u['key']] && u['default'] && (q[u['key']] = u['default']);
                            }
                        }
                    else {
                        var v = k;
                        for (let A = 0x0; A < p['children']['length']; A++) {
                            var w = p['children'][A];
                            !v[w['key']] && w['default'] && (v[w['key']] = w['default']);
                        }
                    }
                }
                Vue['set'](h, 'params', k),
                this['params'];
            },
            'add_item': function() {
                var h = {
                    'active': !0x0
                }
                  , i = ('shelves' == this['param'] && (h['v2'] = 0x1,
                h['width'] = '100%',
                h['height'] = 0x10,
                h['starting_point_y'] = '0%',
                h['starting_point_x'] = '0%'),
                this['$root']['$selected_object']);
                i['params'][this['param']]['push'](h),
                i['build'](),
                this['cr'](),
                this['$parent']['set_height'](),
                setTimeout( () => {}
                , 0x64);
            },
            'remove_item': function(h) {
                var i = this['$root']['$selected_object'];
                i['params'][this['param']]['splice'](h, 0x1),
                i['build'](),
                this['cr']();
            },
            'change_param': function(h, j, k) {
                let l = this['params'][j]
                  , m = this['$root']['$selected_object'];
                clearTimeout(this['debounce']),
                this['debounce'] = setTimeout(function() {
                    m['params'][h][j] = l,
                    m['build']('conf'),
                    sc['correct_sel_box'](m);
                }, this['delay']);
            },
            'change_param_multi': function(h, j, k, l) {
                let m = this['params'][j][k]
                  , n = this['$root']['$selected_object'];
                clearTimeout(this['debounce']),
                this['debounce'] = setTimeout(function() {
                    n['params'][h][j][k] = m,
                    n['build']();
                }, this['delay']);
            },
            'update_object': function() {
                this['$options']['selected']['userData']['params'] ? this['$options']['selected']['userData']['params'][this['param']] = copy_object(this['params']) : this['$options']['selected']['params'][this['param']] = copy_object(this['params']),
                this['$options']['selected']['build']();
            },
            'lang': function(h) {
                return lang[h];
            },
            'select_block': function(h) {},
            'mouse_enter': function(h) {
                this['$options']['selected']['userData']['params'] ? selection_box['setFromObject'](this['$options']['selected']['userData']['parts'][this['param']]['children'][h]) : selection_box['setFromObject'](this['$options']['selected'][this['param']]['children'][h]),
                selection_box['visible'] = !0x0;
            },
            'mouse_leave': function() {
                selection_box['visible'] = !0x1;
            }
        }
    }),
    Vue['component']('notification', {
        'template': '#notification_template',
        'data'() {
            return {
                'visible': !0x1,
                'title': '',
                'message': '',
                'type': 'success',
                'duration': 0xfa0,
                'timer': null,
                'hovered': !0x1
            };
        },
        'computed': {
            'typeClass'() {
                return 'notify--' + this['type'];
            }
        },
        'created': function() {
            this['$root']['$on']('notify', this['show']);
        },
        'beforeDestroy'() {
            this['clearTimer']();
        },
        'methods': {
            'show'(h) {
                this['clearTimer'](),
                this['title'] = h['title'] || '',
                this['message'] = h['message'] || '',
                this['type'] = h['type'] || 'success',
                this['duration'] = h['duration'] || 0xfa0,
                this['visible'] = !0x0,
                this['hovered'] = !0x1,
                this['startTimer']();
            },
            'startTimer'() {
                this['timer'] = setTimeout( () => {
                    this['hovered'] || (this['visible'] = !0x1);
                }
                , this['duration']);
            },
            'clearTimer'() {
                this['timer'] && (clearTimeout(this['timer']),
                this['timer'] = null);
            },
            'close'() {
                this['visible'] = !0x1,
                this['clearTimer']();
            },
            'onHover'() {
                this['hovered'] = !0x0,
                this['clearTimer']();
            },
            'onLeave'() {
                this['hovered'] = !0x1,
                this['startTimer']();
            }
        }
    }),
    Vue['component']('kitchen_models_component', {
        'props': {
            'type_key': String,
            'mousedown': Number,
            'colorpicker': Boolean,
            'single': Boolean,
            'active': Boolean
        },
        'template': '\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20v-show=\x22mode\x20==\x200\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20v-for=\x22(model,\x20index)\x20in\x20$options.models\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20@click=\x22select_model(model,index)\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div><img\x20:src=\x22model.icon\x22\x20alt=\x22\x22></div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div>{{model.name}}</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20v-if=\x22mode\x20==\x201\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20@click=\x22mode\x20=\x200\x22>Назад</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20v-for=\x22item\x20in\x20$options.modules.items\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20@mousedown=\x22add_module($event,\x20item)\x22><img\x20:src=\x22item.icon\x22\x20alt=\x22\x22></div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div>{{item.name}}</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x0a\x20\x20\x20\x20',
        'created': function() {
            var h = this;
            this['$options']['models'] = kitchen_styles;
        },
        'mounted': function() {},
        'computed': {},
        'data': function() {
            return {
                'selected_model': -0x1,
                'mode': 0x0
            };
        },
        'methods': {
            'select_model': async function(h, i) {
                modules = await promise_request('data/module_sets/' + h['modules_set_id'] + '.json' + date_timestamp),
                this['$options']['modules'] = modules,
                this['mode'] = 0x1,
                this['selected_model'] = i,
                this['$forceUpdate']();
            },
            'add_module': function(h, i) {
                h['preventDefault']();
                var h = copy_object(i['params']);
                h['id'] = i['id'],
                sc['add_object']('cabinet', h);
            },
            'lang': function(h) {
                return lang[h];
            }
        }
    });
}
var isOutOfViewport = function(f) {
    var f = f['getBoundingClientRect']()
      , g = {};
    return g['top'] = f['top'] < 0x0,
    g['left'] = f['left'] < 0x0,
    g['bottom'] = f['bottom'] > (window['innerHeight'] || document['documentElement']['clientHeight']),
    g['right'] = f['right'] > (window['innerWidth'] || document['documentElement']['clientWidth']),
    g['any'] = g['top'] || g['left'] || g['bottom'] || g['right'],
    g['all'] = g['top'] && g['left'] && g['bottom'] && g['right'],
    g;
};
function convert_height(f) {
    let g = {};
    if (f['items'])
        for (let k = 0x0; k < f['items']['length']; k++) {
            var h = f['items'][k];
            for (let l = 0x0; l < h['params']['variants']['length']; l++) {
                var j = h['params']['variants'][l];
                g[j['height']] || (g[j['height']] = {}),
                g[j['height']][h['id']] || (g[j['height']][h['id']] = h['id']);
            }
        }
    if (f['categories']) {
        for (let m = 0x0; m < f['categories']['length']; m++)
            convert_height(f['categories'][m]);
    }
    f['categories'] && Object['keys'](g)['forEach'](function(n) {
        let o = {
            'id': f['id'] + '_' + n,
            'name': lang['height'] + '\x20' + n + '\x20' + lang['mm'],
            'active': 0x1,
            'is_height': 0x1,
            'items': [],
            'categories': []
        };
        Object['keys'](g[n])['forEach'](function(p) {
            o['items']['push'](mod_lib['items'][p]);
        }),
        mod_lib['categories'][o['id']] = o,
        f['categories']['push'](o);
    });
}
function check_keyboard_free() {
    var f = window['getSelection']()
      , f = f && 'Range' === f['type'];
    return 'INPUT' !== document['activeElement']['tagName'] && 'TEXTAREA' !== document['activeElement']['tagName'] && !f;
}
let pp_keyboard = {
    'ctrl': !0x1,
    'shift': !0x1,
    'r': !0x1,
    'c': !0x1,
    'x': !0x1,
    'y': !0x1,
    'z': !0x1
};
document['addEventListener']('keydown', function(f) {
    f['shiftKey'] && (pp_keyboard['shift'] = !0x0,
    controls) && (controls['enabled'] = !0x1),
    f['ctrlKey'] && (pp_keyboard['ctrl'] = !0x0,
    controls) && (controls['enabled'] = !0x1),
    'KeyX' == f['code'] && (pp_keyboard['x'] = !0x0),
    'KeyY' == f['code'] && (pp_keyboard['y'] = !0x0),
    'KeyZ' == f['code'] && (pp_keyboard['z'] = !0x0),
    'KeyR' == f['code'] && (pp_keyboard['r'] = !0x0),
    'KeyC' == f['code'] && (pp_keyboard['c'] = !0x0);
}),
document['addEventListener']('keyup', function(f) {
    var g;
    if (f['preventDefault'](),
    Object['keys'](pp_keyboard)['forEach'](h => {
        pp_keyboard[h] = !0x1,
        'shift' != h && 'ctrl' != h || controls && (controls['enabled'] = !0x0);
    }
    ),
