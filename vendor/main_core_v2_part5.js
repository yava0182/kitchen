   ['set_size']() {
        var f = this['userData']['own_object']
          , g = f['rotation']['clone']()
          , j = (f['rotation']['set'](0x0, 0x0, 0x0),
        new THREE['Euler']()['setFromQuaternion'](f['getWorldQuaternion'](new THREE['Quaternion']())['clone']()));
        f['rotation']['set'](-0x1 * j['x'], -0x1 * j['y'], -0x1 * j['z']);
        let k = this['userData']['computed']['size']['x'] / units
          , l = this['userData']['computed']['size']['y'] / units;
        'v' == this['userData']['params']['spec']['orient'] && (k = this['userData']['computed']['size']['y'] / units,
        l = this['userData']['computed']['size']['x'] / units);
        var m, j = new THREE['Vector3'](k,l,this['userData']['computed']['size']['z'] / units), n = box3['setFromObject'](this['userData']['own_object'])['getSize'](new THREE['Vector3']())['clone'](), m = j['clone']()['sub'](n)['divideScalar'](0x2), p = {
            'box': n,
            'diff': new THREE['Vector3'](k,l,this['userData']['computed']['size']['z'] / units)['sub'](n)['divideScalar'](0x2),
            'width': k,
            'height': l,
            'depth': this['userData']['computed']['size']['z'] / units,
            'is_handle': !0x0
        };
        for (let q = 0x0; q < this['userData']['own_object']['children']['length']; q++)
            set_size_buff(this['userData']['own_object']['children'][q], this['userData']['own_object']['children'][q]['name'], p),
            'common' === this['userData']['model_params']['type'] && correct_uv_buff(Model_utils['get_model_from_cache'](this['userData']['computed']['model'])['geometry'][q], this['userData']['own_object']['children'][q]['geometry']),
            this['userData']['own_object']['children'][q]['geometry']['attributes']['position']['needsUpdate'] = !0x0,
            this['userData']['own_object']['children'][q]['geometry']['attributes']['uv'] && (this['userData']['own_object']['children'][q]['geometry']['attributes']['uv']['needsUpdate'] = !0x0);
        f['rotation']['copy'](g);
    }
    ['get_specs']() {
        let f = {};
        var g = this['userData']['model_params']['id']
          , h = this['userData']['size']['x']
          , i = this['userData']['model_params']['type'];
        return 'common' == i ? f = {
            'id': g,
            'width': h,
            'type': 'common',
            'is_gola': 0x0
        } : 'facade_profile' == i ? f = {
            'id': g,
            'width': h,
            'type': 'facade_profile',
            'is_gola': 0x0
        } : 'overhead' == i ? f = {
            'id': g,
            'width': h,
            'type': 'common',
            'is_gola': 0x0
        } : 'overhead_profile' == i && (f = {
            'id': g,
            'width': h,
            'type': 'overhead_profile',
            'is_gola': 0x0
        }),
        this['userData']['specs'] = f;
    }
}
class Link extends Section {
    constructor(e={}, f={
        'parent': null,
        'root': null,
        'path': null
    }) {
        super(e, f);
    }
    ['b_spec']() {
        var f = catalog_lib['get_item'](this['userData']['params']['spec']['id']), g = f['params']['spec']['materials'], h = this['userData']['root']['userData']['params'], j, k;
        for (let v = g['length']; v--; ) {
            h['materials'][g[v]['key']] || set_obj['materials'][g[v]['key']] && (g[v]['group'] || (g[v]['group'] = 0x0),
            j = g[v]['key'] + '::' + g[v]['group'],
            h['materials'][j] || (this['userData']['root']['add_material_key'](g[v]['key'], g[v]['group']),
            k = void 0x0 !== g[v]['variant'] ? g[v]['variant'] : set_obj['materials'][g[v]['key']]['default'],
            0x1 == h['is_default'] && (h['materials'][g[v]['key']]['id'] = set_obj['materials'][g[v]['key']]['variants'][k]['id']),
            g[v]['id'] = h['materials'][j]['id'],
            g[v]['variant'] = k));
        }
        let m = f['params']['variables'];
        Object['keys'](m)['forEach'](w => {
            this['userData']['root']['userData']['computed']['variables'][w] || (this['userData']['root']['userData']['computed']['variables'][w] = m[w]);
        }
        );
        var n = f['params']['children'];
        if (n)
            for (let w = 0x0; w < n['length']; w++) {
                var q = 0x1
                  , u = this['userData']['path2'] + ',' + w;
                try {
                    n[w]['visible'] && this['add_object'](new item_types[n[w]['type']](n[w],{
                        'parent': this,
                        'root': this['userData']['root'],
                        'path': u
                    }));
                } catch (x) {
                    ce();
                }
            }
    }
    ['gp']() {
        var e = copy_object(this['userData']['params']);
        return e['children'] = [],
        e;
    }
    static['get_model_children'](e) {
        var e = catalog_lib['get_item'](e)
          , f = e['params']['children'];
        return e['params']['children'];
    }
}
let l_params = {}
  , lc = [];
class Locker extends Section {
    constructor(f={}, g={
        'parent': null,
        'root': null,
        'path': null
    }) {
        super(f, g);
    }
    ['build']() {
        super['build']();
    }
    ['b_spec']() {
        var f = lockers_lib['get_item'](this['userData']['params']['spec']['id']);
        let g = null;
        for (let l = 0x0; l < f['models']['length']; l++)
            if (0x0 == f['models'][l]['max_x'] && (f['models'][l]['max_x'] = 0x1 / 0x0),
            0x0 == f['models'][l]['max_y'] && (f['models'][l]['max_y'] = 0x1 / 0x0),
            0x0 == f['models'][l]['max_z'] && (f['models'][l]['max_z'] = 0x1 / 0x0),
            this['userData']['size']['x'] >= f['models'][l]['min_x'] && this['userData']['size']['x'] <= f['models'][l]['max_x'] && this['userData']['size']['y'] >= f['models'][l]['min_y'] && this['userData']['size']['y'] <= f['models'][l]['max_y'] && this['userData']['size']['z'] >= f['models'][l]['min_z'] && this['userData']['size']['z'] <= f['models'][l]['max_z']) {
                g = f['models'][l];
                break;
            }
        if (null != g) {
            var h = _['merge'](dp['get']('section'), {});
            let m = g['params']['materials']
              , n = (m = m || {},
            this['userData']['root']['userData']['params']);
            Object['keys'](m)['forEach'](p => {
                var q, u;
                set_obj['materials'][m[p]['key']] && (m[p]['group'] || (m[p]['group'] = 0x0),
                q = m[p]['key'] + '::' + m[p]['group'],
                n['materials'][q] || (this['userData']['root']['add_material_key'](m[p]['key'], m[p]['group']),
                u = void 0x0 !== m[p]['variant'] ? m[p]['variant'] : set_obj['materials'][m[p]['key']]['default'],
                m[p]['id'] = n['materials'][q]['id'],
                m[p]['variant'] = u));
            }
            ),
            this['userData']['params']['spec']['materials'] && Object['keys'](this['userData']['params']['spec']['materials'])['forEach'](p => {
                m[p] && (m[p]['id'] = this['userData']['params']['spec']['materials'][p]);
            }
            ),
            this['userData']['materials'] = m,
            g['params']['variables'] && Object['keys'](g['params']['variables'])['forEach'](p => {
                var q = g['params']['variables'][p], u;
                0x1 != q['local'] ? this['userData']['root']['add_variable'](q) : (this['userData']['computed']['variables'] || (this['userData']['computed']['variables'] = {}),
                this['userData']['parent_params']['local_parent'] ? (ce('here1'),
                (u = this['userData']['parent_params']['local_parent'])['userData']['computed']['variables'][p] && (q['value'] = u['userData']['computed']['variables'][p]['value'])) : ce('here2'),
                this['userData']['params']['spec']['variables'][p] && (q['value'] = this['userData']['params']['spec']['variables'][p]),
                this['userData']['computed']['variables'][p] = copy_object(q));
            }
            ),
            h['children'] = g['params']['children'],
            this['userData']['model'] = h;
            var j = (this['userData']['model2'] = g)['params']['children'];
            if (j)
                for (let p = 0x0; p < j['length']; p++) {
                    let q = 0x1;
                    var k = this['userData']['path2'] + ',' + p;
                    try {
                        j[p]['condition'] && (q = check_condition(j[p]['condition'], {
                            'computed': this['userData']['root']['userData']['computed']['computed'],
                            'local_parent': void 0x0 !== this['userData']['parent_params']['local_parent'] ? this['userData']['parent_params']['local_parent'] : null,
                            'variables': this['userData']['computed']['variables']
                        })),
                        j[p]['visible'] = q,
                        j[p]['visible'] && this['add_object'](new item_types[j[p]['type']](j[p],{
                            'parent': this,
                            'root': this['userData']['root'],
                            'path': k,
                            'local_parent': this,
                            'is_draggable_child': void 0x0 !== this['userData']['parent_params']['is_draggable_child'] ? this['userData']['parent_params']['is_draggable_child'] : null
                        }));
                    } catch (u) {
                        ce();
                    }
                }
        }
    }
    ['gp']() {
        var e = copy_object(this['userData']['params']);
        return e['children'] = [],
        e;
    }
    ['add_to_cab']() {}
    static['get_locker_model'](f, g) {
        var h = lockers_lib['get_item'](f);
        let i = null;
        for (let j = 0x0; j < h['models']['length']; j++)
            if (0x0 == h['models'][j]['max_x'] && (h['models'][j]['max_x'] = 0x1 / 0x0),
            0x0 == h['models'][j]['max_y'] && (h['models'][j]['max_y'] = 0x1 / 0x0),
            0x0 == h['models'][j]['max_z'] && (h['models'][j]['max_z'] = 0x1 / 0x0),
            g['x'] >= h['models'][j]['min_x'] && g['x'] <= h['models'][j]['max_x'] && g['y'] >= h['models'][j]['min_y'] && g['y'] <= h['models'][j]['max_y'] && g['z'] >= h['models'][j]['min_z'] && g['z'] <= h['models'][j]['max_z']) {
                i = h['models'][j];
                break;
            }
        return i;
    }
    ['set_facade_style'](e) {}
    ['change_variable'](f, g, h=!0x0) {
        this['userData']['computed']['variables'][f]['value'] = g,
        this['userData']['params']['spec']['variables'][f] = g,
        this['userData']['root']['change_local_variable_by_path'](this['userData']['path2'], f, g),
        h && this['build']();
    }
    ['change_material'](f, g, h) {
        this['userData']['materials'] || (this['userData']['materials'] = {}),
        this['userData']['materials'][f + '::' + g] && (this['userData']['materials'][f + '::' + g]['id'] = h,
        this['userData']['params']['spec']['materials'] || (this['userData']['params']['spec']['materials'] = {}),
        this['userData']['params']['spec']['materials'][f + '::' + g] = h,
        this['userData']['root']['change_local_material_by_path'](this['userData']['path2'], f, g, h));
        for (let i = 0x0; i < this['userData']['children']['length']; i++)
            'function' == typeof this['userData']['children'][i]['change_material'] && this['userData']['children'][i]['change_material'](f, g, h);
    }
    ['get_local_variables_array']() {
        let f = [];
        return Object['keys'](this['userData']['computed']['variables'])['forEach'](g => {
            0x1 == this['userData']['computed']['variables'][g]['local'] && 0x1 == this['userData']['computed']['variables'][g]['editable'] && f['push'](this['userData']['computed']['variables'][g]);
        }
        ),
        copy_object(f);
    }
    ['add_material_key'](f, g, h=0x0, j=0x0) {
        var k = f + '::' + (g = g || 0x0);
        this['userData']['materials'][k] || (j = j || set_obj['materials'][f]['variants'][set_obj['materials'][f]['default']]['id'],
        this['userData']['materials'][k] = {
            'key': f,
            'group': g,
            'fixed': h,
            'label': set_obj['materials'][f]['name'],
            'type': set_obj['materials'][f]['type'],
            'id': j,
            'size': set_obj['materials'][f]['variants'][set_obj['materials'][f]['default']]['size'],
            'variant': set_obj['materials'][f]['default']
        });
    }
    ['get_specs']() {
        var f = [];
        if (this['userData']['model2'] && this['userData']['model2']['accessories']) {
            ce('lgs');
            for (let i = 0x0; i < this['userData']['model2']['accessories']['length']; i++) {
                var g = this['userData']['model2']['accessories'][i]
                  , h = accsessories_data['items'][g['id']];
                h && f['push']({
                    'price_type': 'p',
                    'count': parseInt(g['count']),
                    'name': h['name'],
                    'code': h['code'],
                    'price': parseFloat(h['price']),
                    'type': 'item',
                    'units': 'units_pcs',
                    'key': h['code'] + '_' + h['id']
                });
            }
        }
        return f;
    }
    ['change_corpus_material'](f, g) {}
}
class LockerCN extends Locker {
    constructor(f={}, g={
        'parent': null,
        'root': null,
        'path': null
    }) {
        super(f, g),
        this['userData']['params']['spec']['id'] = 0x0;
    }
}
class LockerCN2 extends Section {
    constructor(f={}, g={
        'parent': null,
        'root': null,
        'path': null
    }) {
        super(f, g),
        this['userData']['movable_object'] = new THREE['Group']();
    }
    ['b_spec']() {
        var f = this['userData']['params']
          , g = this['userData']['computed']
          , h = this['userData']['params']['spec']
          , j = this['userData']['root']['userData']['params']
          , k = this['userData']['root']['userData']['params']['spec']['facades']
          , j = {
            'active': void 0x0 === h['active'] || h['active'],
            'width': g['size']['x'],
            'height': g['size']['y'],
            'depth': g['size']['z'],
            'thickness': void 0x0 !== h['thickness'] ? h['thickness'] : void 0x0,
            'version': 0x2,
            'facade': void 0x0 !== h['facade'] ? h['facade'] : void 0x0,
            'style': (void 0x0 !== h['style'] ? h : k)['style'],
            'inner': void 0x0 !== h['inner'] && h['inner'],
            'type': void 0x0 !== h['type'] ? h['type'] : default_locker_type,
            'type_params': void 0x0 !== h['type_params'] ? h['type_params'] : null,
            'material': void 0x0 !== h['material'] ? h['material'] : void 0x0,
            'material_rotated': void 0x0 !== h['material_rotated'] ? h['material_rotated'] : project_settings['selected_materials'][j['spec']['group']]['facades_rotated'],
            'handle_model': void 0x0 !== h['handle_model'] ? h['handle_model'] : project_settings['handle'][j['spec']['group']]['model'],
            'handle_size_index': void 0x0 !== h['handle_size_index'] ? h['handle_size_index'] : project_settings['handle'][j['spec']['group']]['preferable_size'],
            'handle_orientation': void 0x0 !== h['handle_orientation'] ? h['handle_orientation'] : 'horizontal',
            'handle_position': void 0x0 !== h['handle_position'] ? h['handle_position'] : project_settings['handle'][j['spec']['group']]['lockers_position'],
            'no_handle_forced': void 0x0 !== h['no_handle_forced'] && h['no_handle_forced'],
            'handles_double': void 0x0 !== h['handles_double'] ? h['handles_double'] : 0x0,
            'starting_point_x': void 0x0 !== h['starting_point_x'] ? h['starting_point_x'] : '0%',
            'starting_point_y': void 0x0 !== h['starting_point_y'] ? h['starting_point_y'] : '0%',
            'direction_x': void 0x0 !== h['direction_x'] ? h['direction_x'] : 'right',
            'direction_y': void 0x0 !== h['direction_y'] ? h['direction_y'] : 'top',
            'offset_top': void 0x0 !== h['offset_top'] ? h['offset_top'] : 0x0,
            'offset_bottom': void 0x0 !== h['offset_bottom'] ? h['offset_bottom'] : 0x0,
            'position_offset_top': void 0x0 !== h['position_offset_top'] ? h['position_offset_top'] : 0x0,
            'position_offset_bottom': void 0x0 !== h['position_offset_bottom'] ? h['position_offset_bottom'] : 0x0,
            'fixed_facade_model': void 0x0 !== h['fixed_facade_model'] ? h['fixed_facade_model'] : void 0x0,
            'fixed_corpus_material': void 0x0 !== h['fixed_corpus_material'] ? h['fixed_corpus_material'] : void 0x0,
            'top_facade_offset': void 0x0 !== h['top_facade_offset'] ? h['top_facade_offset'] : void 0x0,
            'bottom_facade_offset': void 0x0 !== h['bottom_facade_offset'] ? h['bottom_facade_offset'] : void 0x0,
            'left_facade_offset': void 0x0 !== h['left_facade_offset'] ? h['left_facade_offset'] : void 0x0,
            'right_facade_offset': void 0x0 !== h['right_facade_offset'] ? h['right_facade_offset'] : void 0x0,
            'additional_materials': void 0x0 !== h['additional_materials'] ? h['additional_materials'] : {},
            'model': void 0x0 !== h['model'] ? h['model'] : void 0x0,
            'walls_visible': void 0x0 === h['walls_visible'] || h['walls_visible'],
            'walls_active': void 0x0 === h['walls_active'] || h['walls_active'],
            'models': void 0x0 !== h['models'] ? h['models'] : [],
            'models_only': void 0x0 !== h['models_only'] && h['models_only'],
            'group': j['spec']['group'],
            'facade_group': void 0x0 !== h['facade_group'] ? h['facade_group'] : j['spec']['group'],
            'params_locked': void 0x0 !== h['params_locked'] && h['params_locked'],
            'furniture_available': void 0x0 === h['furniture_available'] || h['furniture_available']
        };
        null != j['type'] && null == j['type_params'] && lockers_types[j['type']] && (j['type_params'] = {},
        j['type_params']['is_inner'] = 0x0,
        j['type_params']['params'] = copy_object(lockers_types[j['type']]['params']),
        j['type_params']['move'] = lockers_types[j['type']]['default_move'],
        j['type_params']['move_type'] = lockers_types[j['type']]['default_move_type'],
        j['type_params']['bottom_type'] = lockers_types[j['type']]['default_bottom_type']),
        void 0x0 === j['facade'] && (j['facade'] = k['model']),
        void 0x0 === j['glass_material'] && (j['glass_material'] = k['glass_material']),
        void 0x0 === j['material'] && (j['material'] = k['materials']['gen']),
        void 0x0 === j['style'] && (j['style'] = k['style']),
        this['userData']['mesh'] = new Locker_new(j),
        this['add_own_object'](this['userData']['mesh']),
        this['userData']['mesh']['position']['x'] = -g['size']['x'] / 0x2 / units,
        this['userData']['mesh']['position']['y'] = -g['size']['y'] / 0x2 / units,
        this['userData']['mesh']['position']['z'] = g['size']['z'] / 0x2 / units;
    }
    ['set_facade_style'](e) {
        this['userData']['params']['spec']['style'] = e,
        this['userData']['mesh']['params']['style'] = e,
        this['userData']['mesh']['change_facade_style'](e);
        var e = this['userData']['computed'];
        this['userData']['mesh']['position']['x'] = -e['size']['x'] / 0x2 / units,
        this['userData']['mesh']['position']['y'] = -e['size']['y'] / 0x2 / units,
        this['userData']['mesh']['position']['z'] = e['size']['z'] / 0x2 / units;
    }
    ['change_facade_material'](f, g) {
        super['change_facade_material'](f, g),
        this['userData']['params']['material']['fixed'] || this['userData']['params']['material']['id'] != g && (this['userData']['params']['spec']['material'] = g,
        this['userData']['mesh']['change_material']({
            'id': g
        }));
    }
    ['change_corpus_material'](f, g) {
        super['change_corpus_material'](f, g),
        this['userData']['mesh']['change_corpus_material'](g);
    }
}
let mn;
class ModelCN extends Section {
    constructor(f={}, g={
        'parent': null,
        'root': null,
        'path': null
    }) {
        super(f, g);
    }
    ['build_params'](f) {
        if (!Array['isArray'](f['spec']['materials'])) {
            let j = [];
            Object['keys'](f['spec']['materials'])['forEach'](k => {
                j['push'](f['spec']['materials'][k]);
            }
            ),
            f['spec']['materials'] = j;
        }
        var g = copy_object(f['spec']['materials']);
        if (f['spec'] && f['spec']['id']) {
            var h = f['spec']['id'];
            if (f['spec'] = models3d_lib['get_item'](h)['params'],
            f['spec']['id'] = h,
            f['temp'] || (f['temp'] = {}),
            f['spec']['materials'] = models3d_lib['get_item'](h)['params']['materials'],
            !Array['isArray'](f['spec']['materials'])) {
                let k = [];
                Object['keys'](f['spec']['materials'])['forEach'](l => {
                    k['push'](f['spec']['materials'][l]);
                }
                ),
                f['spec']['materials'] = k;
            }
            if (f['temp']['is_loaded']) {
                for (let l = 0x0; l < g['length']; l++)
                    for (let m = 0x0; m < f['spec']['materials']['length']; m++)
                        f['spec']['materials'][m]['key'] == g[l]['key'] && (f['spec']['materials'][m]['selected'] = g[l]['selected']);
            }
        }
        this['userData']['params'] = _['merge'](copy_object(dp['get'](f['type'])), f),
        this['userData']['params']['materials'] = {};
        for (let n = 0x0; n < f['spec']['materials']['length']; n++) {
            f['spec']['materials'][n]['group'] || (f['spec']['materials'][n]['group'] = 0x0);
            var i = f['spec']['materials'][n]['key'] + '::' + f['spec']['materials'][n]['group'];
            this['userData']['params']['materials'][i] = f['spec']['materials'][n],
            'm' != f['spec']['materials'][n]['mode'] || this['userData']['root']['userData']['params']['materials'][i] || this['userData']['root']['add_material_key'](f['spec']['materials'][n]['selected'], f['spec']['materials'][n]['group']);
        }
        for (let o = 0x0; o < this['userData']['params']['spec']['models']['length']; o++)
            this['userData']['params']['spec']['models'][o]['min_x'] = parseInt(this['userData']['params']['spec']['models'][o]['min_x']),
            this['userData']['params']['spec']['models'][o]['min_y'] = parseInt(this['userData']['params']['spec']['models'][o]['min_y']),
            this['userData']['params']['spec']['models'][o]['min_z'] = parseInt(this['userData']['params']['spec']['models'][o]['min_z']);
        this['get_meshes_by_material']();
    }
    ['build_computed']() {
        super['build_computed'](),
        this['userData']['computed']['meshes_list'] = [];
    }
    ['get_meshes_by_material']() {
        this['userData']['meshes_by_material'] = {};
        let f = this;
        var g = this['userData']['params']['spec']['materials'];
        Object['keys'](g)['forEach'](function(h) {
            f['userData']['meshes_by_material'][h] = [];
        });
    }
    ['clean_materials']() {}
    async['b_spec']() {
        0x1 == this['userData']['params']['spec']['version'] ? await this['build_old']() : (this['userData']['computed']['model'] = this['get_model'](),
        this['userData']['data']['name'] = this['userData']['computed']['model']['name'],
        this['userData']['data']['code'] = this['userData']['computed']['model']['code'],
        this['userData']['data']['price'] = this['userData']['computed']['model']['price'],
        await this['load_model']());
    }
    ['get_model']() {
        var f, f = (this['userData']['params']['spec']['models'] && '' == this['userData']['params']['spec']['models'][0x0]['model'] && this['userData']['params']['spec']['id'] && models3d_lib['items'][this['userData']['params']['spec']['id']] && (f = models3d_lib['get_item'](this['userData']['params']['spec']['id'])['params'],
        this['userData']['params']['spec']['models'] = f['models'],
        this['userData']['params']['spec']['materials'] = f['materials']),
        this['userData']['params']['spec']['models']);
        let g = this['userData']['computed']['size'];
        f['sort'](function(i, j) {
            return i['min_x'] - j['min_x'];
        });
        var f = h(f, 'x')
          , f = h(f, 'y')
          , f = h(f, 'z');
        return f['length'] ? f[f['length'] - 0x1] : {
            'code': '',
            'name': '',
            'price': 0x0,
            'model': '/common_assets/models/no_model.fbx'
        };
        function h(j, k) {
            j['sort'](function(p, q) {
                return p['min_' + k] - q['min_' + k];
            });
            var l = [];
            for (let p = 0x0; p < j['length']; p++) {
                var n = j[p]
                  , o = j[p + 0x1];
                o && 0x0 != o['min_' + k] ? g[k] >= n['min_' + k] && g[k] <= o['min_' + k] && l['push'](n) : g[k] >= n['min_' + k] && l['push'](n);
            }
            return l;
        }
    }
    async['load_model']() {
        this['userData']['computed']['model_loaded'] = !0x1,
        this['userData']['computed']['meshes_list'] = [];
        var f = this
          , g = this['userData']['params']
          , h = this['userData']['params']['spec']['materials'];
        if (this['get_meshes_by_material'](),
        this['userData']['computed']['model']['model']) {
            var j = await load_model({
                'model': this['userData']['computed']['model']['model'],
                'buffer': !0x0,
                'no_cache': -0x1 < this['userData']['computed']['model']['model']['indexOf']('data:application')
            });
            for (let m = 0x0; m < j['length']; m++) {
                var k = j[m]['clone']();
                let n = 'gen';
                var l = k['name']['match'](/m\((.*?)\)/)
                  , l = (null != l && (n = l[0x1]),
                new THREE['Mesh'](k,red_mat));
                l['name'] = k['name'],
                l['castShadow'] = !0x0,
                l['receiveShadow'] = !0x0,
                this['userData']['meshes_by_material'][n] && this['userData']['meshes_by_material'][n]['push'](l),
                this['userData']['computed']['meshes_list']['push'](l),
                this['add_own_object'](l);
            }
            this['apply_materials'](),
            this['userData']['computed']['model_loaded'] = !0x0,
            this['set_size'](),
            this['userData']['root']['change_param'](this['userData']['path2'], 'spec.materials', copy_object(this['userData']['params']['spec']['materials'])),
            this['userData']['root']['change_param'](this['userData']['path2'], 'temp.is_loaded', 0x1);
        }
    }
    ['set_size']() {
        var f = this['userData']['own_object']
          , g = this['userData']['size']
          , h = {
            'x': this['userData']['size']['x'] / units,
            'y': this['userData']['size']['y'] / units,
            'z': this['userData']['size']['z'] / units
        }
          , j = f['rotation']['clone']()
          , k = (f['rotation']['set'](0x0, 0x0, 0x0),
        new THREE['Euler']()['setFromQuaternion'](f['getWorldQuaternion'](new THREE['Quaternion']())['clone']()))
          , k = (f['rotation']['set'](-0x1 * k['x'], -0x1 * k['y'], -0x1 * k['z']),
        box3['setFromObject'](f)['getSize'](new THREE['Vector3']())['clone']())
          , l = {
            'box': box3['setFromObject'](f)['getSize'](new THREE['Vector3']())['clone'](),
            'diff': new THREE['Vector3'](g['x'] / units,g['y'] / units,g['z'] / units)['sub'](k)['divideScalar'](0x2),
            'size': h
        };
        for (let m = 0x0; m < f['children']['length']; m++)
            set_size_buff(f['children'][m], f['children'][m]['name'], l),
            correct_uv_buff(Model_utils['get_model_from_cache'](this['userData']['computed']['model']['model'])['geometry'][m], f['children'][m]['geometry']);
        f['rotation']['copy'](j);
    }
    ['build_old']() {
        var f, g;
        this['userData']['params']['spec']['catalog'] ? this['build_old_from_id']() : (f = this['userData']['computed'],
        (g = this['userData']['params']['spec'])['width'] = f['size']['x'],
        g['height'] = f['size']['y'],
        g['depth'] = f['size']['z'],
        g['immediate_load'] = 0x1,
        g['variants'][0x0]['width'] = f['size']['x'],
        g['variants'][0x0]['height'] = f['size']['y'],
        g['variants'][0x0]['depth'] = f['size']['z'],
        this['userData']['mesh'] = new Model_new(g),
        this['userData']['mesh']['position']['y'] = -f['size']['y'] / 0x2 / units,
        this['add_own_object'](this['userData']['mesh']));
    }
    ['build_old_from_id']() {}
    ['apply_materials']() {
        var f = this['userData']['params']['spec']['materials'];
        let g = this;
        for (let q = 0x0; q < this['userData']['computed']['meshes_list']['length']; q++) {
            var h = this['userData']['computed']['meshes_list'][q];
            let v, w = 'gen';
            var j = h['name']['match'](/m\((.*?)\)/);
            if (f[w = null != j ? j[0x1] : w]) {
                var k = f[w];
                let x;
                switch (k['mode']) {
                case 'i':
                    x = materials_lib['get_item'](k['selected']);
                    break;
                case 'm':
                    k['group'] || (k['group'] = 0x0);
                    var n = k['selected'] + '::' + k['group']
                      , p = this['userData']['root']['userData']['params']['materials'];
                    x = (p[n],
                    materials_lib['get_item'](p[n]['id']));
                    break;
                case 'c':
                    x = materials_lib['get_item'](k['selected']);
                    break;
                case 'v':
                    x = copy_object(f[w]['params']);
                    break;
                case 'f':
                    x = materials_lib['get_item'](this['userData']['root']['userData']['params']['spec']['facades']['materials']['gen']);
                    break;
                }
                x ? (x['add_params']['model_width'] = this['userData']['size']['x'],
                x['add_params']['model_height'] = this['userData']['size']['y']) : x = materials_lib['get_item'](0x0),
                v = create_material(x);
            } else
                bim_arr['forEach'](function(y) {
                    -0x1 < w['indexOf'](y) && 'pat' != w && (v = 'function' == typeof bim_keys[y] ? bim_keys[y](g, w) : bim_keys[y]);
                }),
                v = v || create_material(materials_lib['get_item'](0x0));
            h['material'] = v;
        }
    }
    ['change_material_fixed'](f) {
        for (let h = 0x0; h < this['userData']['computed']['meshes_list']; h++) {
            var g = this['userData']['computed']['meshes_list'][h];
            dispose_material(g['material']);
            let i = materials_lib['get_item'](f);
            i ? (i['add_params']['model_width'] = this['userData']['size']['x'],
            i['add_params']['model_height'] = this['userData']['size']['y']) : i = materials_lib['get_item'](0x0),
            g['material'] = create_material(i);
        }
    }
    ['change_material'](f, g) {
        super['change_material'](f, g);
        let h = this['userData']['params']['spec']['materials']
          , j = [];
        Object['keys'](h)['forEach'](function(n) {
            'm' == h[n]['mode'] && h[n]['selected'] == f && j['push'](n),
            'c' == h[n]['mode'] && h[n]['key'] == f && (h[n]['selected'] = g,
            j['push'](n));
        });
        var k = this;
        for (let n = 0x0; n < j['length']; n++) {
            var l = this['userData']['meshes_by_material'][j[n]];
            for (let o = 0x0; o < l['length']; o++) {
                dispose_material(l[o]['material']);
                let p = materials_lib['get_item'](g);
                p ? (p['add_params']['model_width'] = k['userData']['size']['x'],
                p['add_params']['model_height'] = k['userData']['size']['y']) : p = materials_lib['get_item'](0x0),
                l[o]['material'] = create_material(p);
            }
        }
        this['userData']['root']['change_param'](this['userData']['path'], 'spec.materials.' + f + '.selected', g);
    }
    ['change_corpus_material'](f, g) {
        super['change_corpus_material'](f, g),
        this['change_material'](f, g);
    }
    ['get_meshes']() {
        return this['userData']['computed']['meshes_list'];
    }
}
class ModelCN2 extends Section {
    constructor(f={}, g={
        'parent': null,
        'root': null,
        'path': null
    }) {
        super(f, g),
        this['userData']['cuts'] = [];
    }
    ['build_params'](f) {
        super['build_params'](f);
        let g = this['userData']['root']['userData']['params']['spec']['overrides'];
        if ('function' == typeof pp['events']['parts']['model_before_get_model'] && pp['events']['parts']['model_before_get_model'](f, this),
        this['userData']['model_params'] = models3d_lib['get_item'](this['userData']['params']['spec']['id']),
        !Array['isArray'](this['userData']['model_params']['params']['materials'])) {
            let j = [];
            Object['keys'](this['userData']['model_params']['params']['materials'])['forEach'](k => {
                j['push'](this['userData']['model_params']['params']['materials'][k]);
            }
            ),
            this['userData']['model_params']['params']['materials'] = j;
        }
        this['userData']['mat_ref'] = {};
        for (let k = this['userData']['model_params']['params']['materials']['length']; k--; )
            this['userData']['model_params']['params']['materials'][k]['group'] || (this['userData']['model_params']['params']['materials'][k]['group'] = 0x0),
            this['userData']['model_params']['params']['materials'][k]['tex_axis'] || (this['userData']['model_params']['params']['materials'][k]['tex_axis'] = {
                'x': 'x',
                'y': 'y'
            }),
            this['userData']['mat_ref'][this['userData']['model_params']['params']['materials'][k]['key']] = this['userData']['model_params']['params']['materials'][k]['key'] + '::' + this['userData']['model_params']['params']['materials'][k]['group'];
        var h = this['userData']['model_params']['params']['materials'];
        this['userData']['params']['materials'] = {};
        for (let l = 0x0; l < h['length']; l++) {
            h[l]['group'] || (h[l]['group'] = 0x0);
            var i = h[l]['key'] + '::' + h[l]['group'];
            this['userData']['params']['materials'][i] = h[l],
            'm' == h[l]['mode'] && (this['userData']['root']['userData']['params']['materials'][h[l]['selected'] + '::' + h[l]['group']] || this['userData']['root']['add_material_key'](h[l]['selected'], h[l]['group'], h[l]['fixed']),
            this['userData']['root']['userData']['computed']['used_materials'][h[l]['selected'] + '::' + h[l]['group']] || (this['userData']['root']['userData']['computed']['used_materials'][h[l]['selected'] + '::' + h[l]['group']] = 0x1),
            this['userData']['local_parent']) && this['userData']['local_parent']['userData']['materials'][h[l]['selected'] + '::' + h[l]['group']],
            'c' == h[l]['mode'] && (this['userData']['root']['userData']['params']['materials']['_' + h[l]['key'] + '::' + h[l]['group']] ? h[l]['selected'] = this['userData']['root']['userData']['params']['materials']['_' + h[l]['key'] + '::' + h[l]['group']]['id'] : this['userData']['root']['add_custom_material_key'](h[l]),
            this['userData']['root']['userData']['computed']['used_materials']['_' + h[l]['key'] + '::' + h[l]['group']] || (this['userData']['root']['userData']['computed']['used_materials']['_' + h[l]['key'] + '::' + h[l]['group']] = 0x1));
        }
        g && g[this['userData']['path2']] && Object['keys'](g[this['userData']['path2']])['forEach'](m => {
            var n = g[this['userData']['path2']][m];
            this['userData'][m] = _['merge'](this['userData'][m], n);
        }
        );
    }
    async['b_spec']() {
        0x1 == this['userData']['params']['spec']['version'] ? await this['build_old']() : (this['userData']['computed']['model'] = this['get_model'](),
        this['userData']['data']['name'] = this['userData']['computed']['model']['name'],
        this['userData']['data']['code'] = this['userData']['computed']['model']['code'],
        this['userData']['data']['price'] = this['userData']['computed']['model']['price'],
        await this['load_model']());
    }
    ['build_old']() {}
    async['load_model']() {
        this['userData']['computed']['model_loaded'] = !0x1,
        this['userData']['computed']['meshes_list'] = [];
        var f = this
          , g = this['userData']['params']
          , h = this['userData']['params']['spec']['materials'];
        if (this['get_meshes_by_material'](),
        !this['userData']['computed']['model']['model'])
            return !0x1;
        var j = await load_model({
            'model': this['userData']['computed']['model']['model'],
            'buffer': !0x0,
            'no_cache': -0x1 < this['userData']['computed']['model']['model']['indexOf']('data:application')
        });
        for (let m = 0x0; m < j['length']; m++) {
            var k = j[m]['clone']();
            let n = 'gen';
            var l = k['name']['match'](/m\((.*?)\)/)
              , l = (null != l && (n = l[0x1]),
            new THREE['Mesh'](k,red_mat));
            l['name'] = k['name'],
            l['castShadow'] = !0x0,
            l['receiveShadow'] = !0x0,
            -0x1 < l['name']['indexOf']('cut') && (this['userData']['has_cut'] = 0x1,
            this['userData']['cuts']['push'](l),
            l['visible'] = !0x1,
            l['castShadow'] = !0x1,
            l['receiveShadow'] = !0x1),
            l['userData']['is_draggable_child'] = void 0x0 !== this['userData']['parent_params']['is_draggable_child'] ? this['userData']['parent_params']['is_draggable_child'] : null,
            this['userData']['meshes_by_material'][n] && this['userData']['meshes_by_material'][n]['push'](l),
            this['userData']['computed']['meshes_list']['push'](l),
            this['add_own_object'](l);
        }
        this['apply_materials'](),
        this['userData']['computed']['model_loaded'] = !0x0,
        this['set_size'](),
        'edges' === global_options['mode'] && f['edges_mode']();
    }
    ['get_model']() {
        var f = this['userData']['model_params']['params']['models'];
        for (let j = f['length']; j--; )
            f[j]['min_x'] = parseInt(f[j]['min_x']),
            f[j]['min_y'] = parseInt(f[j]['min_y']),
            f[j]['min_z'] = parseInt(f[j]['min_z']);
        let g = this['userData']['computed']['size'];
        f['sort'](function(k, l) {
            return k['min_x'] - l['min_x'];
        });
        var h = i(f, 'x')
          , h = i(h, 'y')
          , h = i(h, 'z');
        return h['length'] ? h[h['length'] - 0x1] : {
            'code': '',
            'name': '',
            'price': 0x0,
            'model': '/common_assets/models/no_model.fbx'
        };
        function i(k, l) {
            k['sort'](function(q, u) {
                return parseInt(q['min_' + l]) - parseInt(u['min_' + l]);
            });
            var n = [];
            for (let q = 0x0; q < k['length']; q++) {
                var o = k[q]
                  , p = k[q + 0x1];
                p && 0x0 != p['min_' + l] ? (o['min_' + l] == p['min_' + l] && g[l] >= o['min_' + l] || g[l] >= o['min_' + l] && g[l] <= p['min_' + l]) && n['push'](o) : g[l] >= o['min_' + l] && n['push'](o);
            }
            return n;
        }
    }
    ['get_meshes_by_material']() {
        this['userData']['meshes_by_material'] = {};
        var f = this
          , g = this['userData']['model_params']['params']['materials'];
        for (let h = 0x0; h < g['length']; h++)
            f['userData']['meshes_by_material'][g[h]['key']] = [];
    }
    ['apply_materials']() {
        var f = this['userData']['params']['materials'];
        let g = this;
        for (let q = 0x0; q < this['userData']['computed']['meshes_list']['length']; q++) {
            var h = this['userData']['computed']['meshes_list'][q];
            let v, w = 'gen';
            var j = h['name']['match'](/m\((.*?)\)/);
            if (null != j && (w = j[0x1]),
            f[w = this['userData']['mat_ref'][w] ? this['userData']['mat_ref'][w] : w]) {
                var k = f[w];
                let x;
                switch (k['mode']) {
                case 'i':
                    x = materials_lib['get_item'](k['selected']);
                    break;
                case 'm':
                    k['group'] || (k['group'] = 0x0);
                    var n = k['selected'] + '::' + k['group'], p, p, p, p;
                    x = this['userData']['local_parent'] ? (p = this['userData']['local_parent']['userData']['materials'])[n] ? 0x0 != p[n]['id'] ? materials_lib['get_item'](p[n]['id']) : ((p = this['userData']['root']['userData']['params']['materials'])[n],
                    materials_lib['get_item'](p[n]['id'])) : ((p = this['userData']['root']['userData']['params']['materials'])[n],
                    materials_lib['get_item'](p[n]['id'])) : ((p = this['userData']['root']['userData']['params']['materials'])[n],
                    materials_lib['get_item'](p[n]['id']));
                    break;
                case 'c':
                    x = materials_lib['get_item'](k['selected']);
                    break;
                case 'v':
                    x = copy_object(f[w]['params']);
                    break;
                case 'f':
                    x = materials_lib['get_item'](this['userData']['root']['userData']['params']['spec']['facades']['materials']['gen']);
                    break;
                }
                x ? (x['add_params']['model_width'] = this['userData']['size'][k['tex_axis']['x']],
                x['add_params']['model_height'] = this['userData']['size'][k['tex_axis']['y']]) : x = materials_lib['get_item'](0x0),
                v = create_material(x);
            } else
                bim_arr['forEach'](function(y) {
                    -0x1 < w['indexOf'](y) && 'pat' != w && (v = 'function' == typeof bim_keys[y] ? bim_keys[y](g, w) : bim_keys[y]);
                }),
                v = v || create_material(materials_lib['get_item'](0x0));
            h['material'] = v;
        }
    }
    ['change_material'](f, g, h) {
        super['change_material'](f, g, h),
        '_' == f[0x0] && (f = f['substring'](0x1));
        var j = this['userData']['model_params']['params']['materials']
          , k = [];
        for (let p = 0x0; p < j['length']; p++)
            'm' == j[p]['mode'] && j[p]['selected'] == f && j[p]['group'] == g && k['push'](j[p]['key']),
            'c' == j[p]['mode'] && j[p]['key'] == f && j[p]['group'] == g && (j[p]['selected'] = h,
            k['push'](j[p]['key']));
        for (let q = 0x0; q < k['length']; q++) {
            var n = this['userData']['meshes_by_material'][k[q]]
              , o = this['userData']['params']['materials'][k[q] + '::' + g];
            for (let u = 0x0; u < n['length']; u++) {
                dispose_material(n[u]['material']);
                let v = materials_lib['get_item'](h);
                v ? (v['add_params']['model_width'] = this['userData']['size'][o['tex_axis']['x']],
                v['add_params']['model_height'] = this['userData']['size'][o['tex_axis']['y']]) : v = materials_lib['get_item'](0x0),
                n[u]['material'] = create_material(v);
            }
        }
    }
    ['set_size']() {
        var f = this['userData']['own_object']
          , g = this['userData']['size']
          , h = {
            'x': this['userData']['size']['x'] / units,
            'y': this['userData']['size']['y'] / units,
            'z': this['userData']['size']['z'] / units
        }
          , j = f['rotation']['clone']()
          , k = (this['remove'](f),
        f['rotation']['set'](0x0, 0x0, 0x0),
        box3['setFromObject'](f)['getSize'](new THREE['Vector3']())['clone']())
          , l = {
            'box': box3['setFromObject'](f)['getSize'](new THREE['Vector3']())['clone'](),
            'diff': new THREE['Vector3'](g['x'] / units,g['y'] / units,g['z'] / units)['sub'](k)['divideScalar'](0x2),
            'size': h
        };
        for (let m = 0x0; m < f['children']['length']; m++)
            set_size_buff(f['children'][m], f['children'][m]['name'], l),
            correct_uv_buff(Model_utils['get_model_from_cache'](this['userData']['computed']['model']['model'])['geometry'][m], f['children'][m]['geometry']);
        this['add'](f),
        f['rotation']['copy'](j);
    }
    ['get_specs']() {
        this['userData']['model_params']['params']['price_type'] || (this['userData']['model_params']['params']['price_type'] = 'p');
        var f = {
            'price_type': this['userData']['model_params']['params']['price_type'],
            'count': 0x0,
            'name': this['userData']['computed']['model']['name'],
            'code': this['userData']['computed']['model']['code'],
            'price': parseFloat(this['userData']['computed']['model']['price']),
            'type': 'item',
            'units': '',
            'key': ''
        };
        let g = this['userData']['computed']['model']['code'];
        switch (Object['keys'](this['userData']['params']['materials'])['forEach'](h => {
            g += '_' + h + this['userData']['params']['materials'][h]['selected'];
        }
        ),
        f['key'] = g,
        f['price_type']) {
        case 'p':
            f['count'] = 0x1,
            f['units'] = 'units_pcs';
            break;
        case 'm':
            f['count'] = this['userData']['size']['x'] / 0x3e8,
            f['units'] = 'units_pogon';
            break;
        case 'm2':
            f['count'] = this['userData']['size']['x'] / 0x3e8 * this['userData']['size']['y'] / 0x3e8,
            f['units'] = 'units_square';
            break;
        case 'm3':
            f['count'] = this['userData']['size']['x'] / 0x3e8 * this['userData']['size']['y'] / 0x3e8 * this['userData']['size']['z'] / 0x3e8,
            f['units'] = 'units_square';
            break;
        default:
            f['count'] = 0x1;
        }
        return this['userData']['specs'] = f;
    }
}
class MouseTarget extends Section {
    constructor(f={}, g={
        'parent': null,
        'root': null,
        'path': null
    }) {
        super(f, g);
    }
    ['b_spec']() {
        var f = this['userData']['computed']
          , f = make_cube(f['size']['x'] / units, f['size']['y'] / units, f['size']['z'] / units, transparent_material);
        f['userData']['is_mouse_target'] = 0x1,
        f['userData']['selector'] = f,
        this['add_own_object'](f);
    }
    ['gp']() {
        var f = copy_object(this['userData']['params']);
        return f['children'] = [],
        f;
    }
    ['hover_on']() {
        this['userData']['selector']['material'] = misc_mats['mouse_target_hovered'];
    }
    ['hover_off']() {
        this['userData']['selector']['material'] = misc_mats['mouse_target']();
    }
}
class Point extends Section {
    constructor(f={}, g={
        'parent': null,
        'root': null,
        'path': null
    }) {
        super(f, g);
    }
    ['build']() {
        super['build'](),
        view_mode && (this['userData']['helpers']['visible'] = !0x0);
    }
    ['hide_helpers']() {
        view_mode || (this['userData']['helpers']['visible'] = !0x1);
    }
}
let projection_offset_radius = 0.1
  , projection_offset_tolerance = 0.1
  , projection_opacity_radius = 0.05
  , projection_opacity_tolerance = 0.1
  , projecttion_depth_test = !0x0
  , projecttion_depth_write = !0x0;
class Projection extends Section {
    constructor(f={}, g={
        'parent': null,
        'root': null,
        'path': null
    }) {
        super(f, g),
        this['visible'] = 0x1 == constructor_settings['projection_visible'],
        this['userData']['mouse_events'] = !0x1;
    }
    ['b_spec']() {
        var f = 0x2 / units
          , g = new THREE['Group']()
          , h = (this['userData']['pr_group'] = g,
        new THREE['Mesh'](new THREE['CircleGeometry'](this['userData']['params']['spec']['radius'] / units,0x28),new THREE['MeshStandardMaterial']({
            'color': this['userData']['params']['spec']['radius_color'],
            'side': THREE['FrontSide'],
            'blending': THREE['NormalBlending'],
            'forceSinglePass': !0x0,
            'transparent': !0x0,
            'opacity': projection_opacity_radius,
            'depthWrite': projecttion_depth_test,
            'depthTest': projecttion_depth_test
        })))
          , h = (h['userData']['mouse_events'] = !0x1,
        h['position']['z'] += projection_offset_radius,
        this['userData']['circle'] = h,
        0x0 != this['userData']['params']['spec']['radius'] && g['add'](h),
        new THREE['Mesh'](new THREE['PlaneGeometry'](this['userData']['params']['spec']['tolerance_x'] / units,this['userData']['params']['spec']['tolerance_y'] / units,0x1,0x1),new THREE['MeshStandardMaterial']({
            'color': this['userData']['params']['spec']['tolerance_color'],
            'side': THREE['DoubleSide'],
            'transparent': !0x0,
            'opacity': projection_opacity_tolerance,
            'depthWrite': projecttion_depth_write,
            'depthTest': projecttion_depth_test
        })));
        h['position']['z'] += projection_offset_tolerance,
        (this['userData']['plane'] = h)['userData']['mouse_events'] = !0x1,
        0x0 == this['userData']['params']['spec']['tolerance_y'] && 0x0 == this['userData']['params']['spec']['tolerance_x'] || g['add'](h),
        'c' == this['userData']['params']['spec']['type'] && g['rotateX'](Math['PI'] / 0x2),
        'f' == this['userData']['params']['spec']['type'] && g['rotateX'](-Math['PI'] / 0x2),
        this['add_own_object'](g),
        setTimeout( () => {
            this['mouse_move']();
        }
        , 0x64);
    }
    ['gp']() {
        var e = copy_object(this['userData']['params']);
        return e['children'] = [],
        e;
    }
    ['mouse_move']() {
        var f = this['userData']['root']['get_forward']()
          , g = this['userData']['pr_group'];
        scene['attach'](g),
        'w' == this['userData']['params']['spec']['type'] && (0x1 == f['z'] && g['position']['set'](g['position']['x'], g['position']['y'], 0x0),
        -0x1 == f['z'] && g['position']['set'](g['position']['x'], g['position']['y'], room['back_wall']['position']['z']),
        0x1 == f['x'] && g['position']['set'](0x0, g['position']['y'], g['position']['z']),
        -0x1 == f['x']) && g['position']['set'](room['right_wall']['position']['x'], g['position']['y'], g['position']['z']),
        'f' == this['userData']['params']['spec']['type'] && g['position']['set'](g['position']['x'], room['floor']['position']['y'], g['position']['z']),
        'c' == this['userData']['params']['spec']['type'] && g['position']['set'](g['position']['x'], room['ceiling']['position']['y'], g['position']['z']),
        this['userData']['own_object']['attach'](g);
    }
    ['mouse_up']() {}
}
class Rotator extends Section {
    constructor(e={}, f={
        'parent': null,
        'root': null,
        'path': null
    }) {
        super(e, f);
    }
    ['build']() {
        var e;
        super['build'](),
        this['userData']['state'] = {
            'is_open': !0x1,
            'is_moving': !0x1,
            'starting_pos': 0x0
        },
        this['userData']['state']['starting_pos'] = this['userData']['object']['rotation'][{
            'rx': 'x',
            'lx': 'x',
            'rz': 'z',
            'lz': 'z',
            'ry': 'y',
            'ly': 'y'
        }[this['userData']['params']['spec']['direction']]],
        lc['push'](this);
    }
    ['animate']() {
        var f, g, h, j, k, l, k;
        super['animate'](),
        this['userData']['state']['is_moving'] || (this['userData']['state']['is_moving'] = !0x0,
        h = {
            'rx': 'x',
            'lx': 'x',
            'rz': 'z',
            'lz': 'z',
            'ry': 'y',
            'ly': 'y'
        }[this['userData']['params']['spec']['direction']],
        j = {
            'rx': 0x1,
            'rz': 0x1,
            'ry': 0x1,
            'lx': -0x1,
            'lz': -0x1,
            'ly': -0x1
        }[this['userData']['params']['spec']['direction']],
        k = THREE['Math']['degToRad'](this['userData']['params']['spec']['deg']),
        (l = {})[h] = (this['userData']['state']['starting_pos'] + k) * j,
        (k = {})[h] = this['userData']['state']['starting_pos'],
        (this['userData']['state']['is_open'] ? new TWEEN['Tween'](this['rotation'])['to'](k, 0x190)['onComplete']( () => {
            this['userData']['state']['is_moving'] = !0x1,
            this['userData']['state']['is_open'] = !0x1;
        }
        ) : new TWEEN['Tween'](this['rotation'])['to'](l, 0x190)['onComplete']( () => {
            this['userData']['state']['is_moving'] = !0x1,
            this['userData']['state']['is_open'] = !0x0;
        }
        ))['start']());
    }
}
class Slider extends Section {
    constructor(e={}, f={
        'parent': null,
        'root': null,
        'path': null
    }) {
        super(e, f);
    }
    ['build']() {
        var e;
        super['build'](),
        this['userData']['state'] = {
            'is_open': !0x1,
            'is_moving': !0x1,
            'starting_pos': 0x0
        },
        this['userData']['state']['starting_pos'] = this['userData']['object']['position'][{
            'l': 'x',
            'r': 'x',
            'f': 'z',
            't': 'y',
            'b': 'y'
        }[this['userData']['params']['spec']['direction']]],
        lc['push'](this);
    }
    ['animate']() {
        if (!this['userData']['state']['is_moving']) {
            this['userData']['state']['is_moving'] = !0x0;
            var f, g, h = {
                'l': 'x',
                'r': 'x',
                'f': 'z',
                't': 'y',
                'b': 'y'
            }[this['userData']['params']['spec']['direction']], j = {
                'l': -0x1,
                'r': 0x1,
                'f': 0x1,
                't': 0x1,
                'b': -0x1
            }[this['userData']['params']['spec']['direction']], k = {};
            k[h] = this['userData']['state']['starting_pos'] + 0x5 * j;
            let m = {};
            m[h] = this['userData']['state']['starting_pos'];
            var l = {};
            l[h] = this['userData']['state']['starting_pos'] + this['userData']['size'][h] / units * parseFloat(this['userData']['params']['spec']['ext_percent']) * j,
            (this['userData']['state']['is_open'] ? new TWEEN['Tween'](this['userData']['object']['position'])['to'](k, 0x190)['onComplete']( () => {
                new TWEEN['Tween'](this['userData']['object']['position'])['to'](m, 0x258)['onComplete']( () => {
                    this['userData']['state']['is_moving'] = !0x1,
                    this['userData']['state']['is_open'] = !0x1;
                }
                )['start']();
            }
            ) : new TWEEN['Tween'](this['userData']['object']['position'])['to'](l, 0x258)['onComplete']( () => {
                this['userData']['state']['is_moving'] = !0x1,
                this['userData']['state']['is_open'] = !0x0;
            }
            ))['start']();
        }
    }
}
class TabletopCN extends WallCN {
    constructor(f={}, g={
        'parent': null,
        'root': null,
        'path': null
    }) {
        super(f, g);
    }
    ['b_size']() {
        this['userData']['params']['material']['key'] = '__tabletop',
        this['userData']['params']['material']['group'] = 0x0;
        var f = this['userData']['params']
          , g = this['userData']['root']['userData']['params']
          , h = f['material']['key'] + '::' + f['material']['group']
          , i = (g['materials'][h] || this['userData']['root']['add_material_key'](f['material']['key'], f['material']['group']),
        this['userData']['root']['userData']['computed']['used_materials'][f['material']['key'] + '::' + f['material']['group']] || (this['userData']['root']['userData']['computed']['used_materials'][f['material']['key'] + '::' + f['material']['group']] = 0x1),
        {
            'parent_size': this['userData']['parent']['userData']['computed']['size'],
            'computed': this['userData']['root']['userData']['computed']['computed'],
            'variables': this['userData']['root']['userData']['computed']['variables'],
            'materials': this['userData']['root']['userData']['computed']['materials']
        });
        if (this['userData']['params']['material']['key'] && set_obj['materials'][this['userData']['params']['material']['key']]) {
            this['userData']['computed']['size'] = {};
            var j = this['userData']['params']['material']
              , k = j['key'] + '::' + j['group'];
            switch (set_obj['materials'][this['userData']['params']['material']['key']]['type']) {
            case 'm2':
                this['userData']['params']['size']['x']['indexOf']('default') && (this['userData']['params']['size']['x'] = this['userData']['params']['size']['x']['replaceAll']('default', k)),
                this['userData']['params']['size']['y']['indexOf']('default') && (this['userData']['params']['size']['y'] = this['userData']['params']['size']['y']['replaceAll']('default', k)),
                this['userData']['computed']['size']['x'] = comp2(this['userData']['params']['size']['x'], i),
                this['userData']['computed']['size']['y'] = comp2(this['userData']['params']['size']['y'], i),
                'current' == j['variant'] ? this['userData']['computed']['size']['z'] = comp2('m:' + k + '.size.z', i) : this['userData']['computed']['size']['z'] = comp2('m:' + k + '.' + j['variant'] + '.size.z', i);
                break;
            case 'm':
                break;
            }
            this['userData']['size'] = copy_object(this['userData']['computed']['size']);
        } else
            super['b_size']();
    }
    ['b_spec']() {
        super['b_spec']();
        for (let f = this['userData']['own_object']['children']['length']; f--; )
            this['userData']['own_object']['children'][f]['userData']['edgesModeType'] = ObjectType['Tabletop'];
        setTimeout(h => {
            let j = [];
            var k = this['userData']['own_object']['children'];
            Object['values'](this['userData']['root']['userData']['parts']['model'])['forEach'](F => {
                if (F['userData']['has_cut']) {
                    for (let G = 0x0; G < F['userData']['cuts']['length']; G++)
                        j['push'](F['userData']['cuts'][G]);
                }
            }
            );
            for (let F = j['length']; F--; )
                for (let G = k['length']; G--; ) {
                    var q = j[F]
                      , v = k[G]
                      , w = (q['geometry']['computeBoundingBox'](),
                    q['geometry']['boundingBox']['max']['y'] - q['geometry']['boundingBox']['min']['y'])
                      , w = q['geometry']['boundingBox']['min']['y'] + w / 0x2
                      , w = (q['geometry']['translate'](0x0, -w, 0x0),
                    new THREE['Box3']()['setFromObject'](q))
                      , x = (w['max']['y'] += 0x32,
                    w['min']['y'] -= 0x32,
                    new THREE['Box3']()['setFromObject'](v));
                    if (w['intersectsBox'](x)) {
                        var w = q['clone']()
                          , x = v['clone']()
                          , q = (w['geometry'] = q['geometry']['clone'](),
                        w['geometry']['rotateY'](q['rotation']['y'] + v['rotation']['y']),
                        x['geometry']['rotateY'](v['rotation']['y']),
                        q['getWorldPosition']())
                          , y = v['getWorldPosition']()
                          , z = (q['sub'](y),
                        w['geometry']['translate'](q['x'], 0x0, q['z']),
                        w['geometry']['attributes']['position']);
                        for (let H = 0x0; H < z['count']; H++) {
                            var A = z['getX'](H), B = z['getY'](H), C = z['getZ'](H), D, E;
                            let I = B;
                            I = B < 0x0 ? -0xa : 0xa,
                            z['setXYZ'](H, A, I, C);
                        }
                        var y = csggeom(x, [w], 'subtract');
                        y['rotateY'](-v['rotation']['y']),
                        v['geometry'] = y,
                        'edges' != global_options['mode'] && (v['material']['transparent'] = !0x1);
                    }
                }
        }
        , 0x12c);
    }
    ['get_specs']() {
        var f = {
            'id': 0x0,
            'm2': 0x0,
            'pm': 0x0
        };
        switch (f['id'] = this['userData']['params']['material']['id'],
        this['userData']['params']['spec']['orientation']) {
        case 'h':
            f['pm'] = this['userData']['size']['x'] / 0x3e8;
            break;
        default:
            f['pm'] = this['userData']['size']['y'] / 0x3e8;
        }
        return f['m2'] = this['userData']['size']['x'] / 0x3e8 * this['userData']['size']['y'] / 0x3e8,
        f;
    }
}
function cut(f, h) {
    for (let D = f['length']; D--; )
        for (let E = h['length']; E--; ) {
            var j = f[D]
              , k = h[E]
              , q = (j['geometry']['computeBoundingBox'](),
            j['geometry']['boundingBox']['max']['y'] - j['geometry']['boundingBox']['min']['y'])
              , q = j['geometry']['boundingBox']['min']['y'] + q / 0x2
              , q = (j['geometry']['translate'](0x0, -q, 0x0),
            new THREE['Box3']()['setFromObject'](j))
              , v = (q['max']['y'] += 0x32,
            q['min']['y'] -= 0x32,
            new THREE['Box3']()['setFromObject'](k));
            if (q['intersectsBox'](v)) {
                var q = j['clone']()
                  , v = k['clone']()
                  , j = (q['geometry'] = j['geometry']['clone'](),
                q['geometry']['rotateY'](j['rotation']['y'] + k['rotation']['y']),
                v['geometry']['rotateY'](k['rotation']['y']),
                j['getWorldPosition'](new THREE['Vector3']()))
                  , w = k['getWorldPosition'](new THREE['Vector3']())
                  , x = (j['sub'](w),
                q['geometry']['translate'](j['x'], 0x0, j['z']),
                q['geometry']['attributes']['position']);
                for (let F = 0x0; F < x['count']; F++) {
                    var y = x['getX'](F), z = x['getY'](F), A = x['getZ'](F), B, C;
                    let G = z;
                    G = z < 0x0 ? -0xa : 0xa,
                    x['setXYZ'](F, y, G, A);
                }
                var w = csggeom(v, [q], 'subtract');
                w['rotateY'](-k['rotation']['y']),
                k['geometry'] = w;
            }
        }
}
let item_types = {
    'section': Section,
    'wall': WallCN,
    'door': DoorCN,
    'locker': LockerCN,
    'locker2': Locker,
    'model': ModelCN2,
    'link': Link,
    'facade': Facade,
    'draggable': Draggable,
    'slider': Slider,
    'slider_side': Slider,
    'rotator': Rotator,
    'handle': HandleCN,
    'tabletop': TabletopCN,
    'point': Point,
    'blocker': Blocker,
    'divider': Divider,
    'section_div': Section_div,
    'mouse_target': MouseTarget,
    'projection': Projection,
    'connector': Connector
};
class Bardesk extends PPObject {
    constructor(f) {
        super(f);
        var g = this, h, j, h, h;
        this['type'] = 'Bardesk',
        this['temp_type'] = 'Bardesk',
        (f = f || {})['plints'] || (f['plints'] = {});
        let k = 0x2d0;
        if (custom_settings['bottom_corpus_height'] && (k = custom_settings['bottom_corpus_height']),
        'bardesk' == f['name'] && (f['name'] = lang['tabletop']),
        this['params'] = {
            'tabletop_id': void 0x0 !== f['tabletop_id'] ? f['tabletop_id'] : (constructor_settings['tabletop_v2'] ? project_settings['defaults'] : project_settings['selected_materials'])['tabletop'],
            'width': void 0x0 !== f['width'] ? f['width'] : 0x5dc,
            'height': void 0x0 !== f['height'] ? f['height'] : void 0x0,
            'depth': void 0x0 !== f['depth'] ? f['depth'] : 0x258,
            'thickness': void 0x0 !== f['thickness'] ? f['thickness'] : void 0x0,
            'fly_height': void 0x0 !== f['fly_height'] ? f['fly_height'] : 0x0,
            'bardesk_type': void 0x0 !== f['bardesk_type'] ? f['bardesk_type'] : 'full',
            'leg_visible': void 0x0 !== f['leg_visible'] ? f['leg_visible'] : 0x1,
            'leg_model': void 0x0 !== f['leg_model'] ? f['leg_model'] : void 0x0,
            'radius': void 0x0 !== f['radius'] ? f['radius'] : void 0x0,
            'material': f['material'] || (constructor_settings['tabletop_v2'] ? project_settings['defaults'] : project_settings['selected_materials'])['tabletop'],
            'material_rotated': f['material_rotated'] || !0x1,
            'cabinet_type': f['cabinet_type'] || 'bottom',
            'corners': void 0x0 !== f['corners'] ? f['corners'] : void 0x0,
            'corners_equal': void 0x0 !== f['corners_equal'] ? f['corners_equal'] : void 0x0,
            'rX': void 0x0 !== f['rX'] ? f['rX'] : 0x0,
            'rY': void 0x0 !== f['rY'] ? f['rY'] : 0x0,
            'rZ': void 0x0 !== f['rZ'] ? f['rZ'] : 0x0,
            'pX': void 0x0 !== f['pX'] ? f['pX'] : 0x0,
            'pY': void 0x0 !== f['pY'] ? f['pY'] : 0x0,
            'pZ': void 0x0 !== f['pZ'] ? f['pZ'] : 0x0,
            'name': f['name'] || lang['tabletop'],
            'plints': {
                'back': !0x1,
                'left': !0x1,
                'right': !0x1
            },
            'auto_rotation': void 0x0 !== f['auto_rotation'] ? f['auto_rotation'] : 0x1
        },
        this['params']['corners'] || 'podium' === this['params']['bardesk_type'] || 'full' === this['params']['bardesk_type'] || (this['params']['corners'] = {
            'c1': {
                'type': 'straight',
                'val': 0x0
            },
            'c2': {
                'type': 'straight',
                'val': 0x0
            },
            'c3': {
                'type': 'straight',
                'val': 0x0
            },
            'c4': {
                'type': 'straight',
                'val': 0x0
            }
        }),
        this['params']['corners']) {
            for (var l of ['c1', 'c2', 'c3', 'c4'])
                this['params']['corners'][l] || (this['params']['corners'][l] = {
                    'type': 'straight',
                    'val': 0x0
                });
        }
        void 0x0 === this['params']['corners_equal'] && (h = this['params']['corners'],
        this['params']['corners_equal'] = !h || h['c1']['type'] === h['c2']['type'] && h['c1']['type'] === h['c3']['type'] && h['c1']['type'] === h['c4']['type'] && h['c1']['val'] === h['c2']['val'] && h['c1']['val'] === h['c3']['val'] && h['c1']['val'] === h['c4']['val']),
        0x1 == constructor_settings['tabletop_v2'] ? (j = 0x0,
        h = pp['libs']['tabletop']['items'][this['params']['tabletop_id']],
        h = parseFloat(h['params']['variants'][0x0]['thickness']),
        this['params']['thickness'] = h) : void 0x0 === this['params']['thickness'] && (this['params']['thickness'] = project_settings['tabletop_thickness']),
        void 0x0 === this['params']['height'] && (this['params']['height'] = k + project_settings['cokol_height'] + this['params']['thickness']),
        this['params']['variants'] = void 0x0 !== f['variants'] ? f['variants'] : [],
        void 0x0 === this['params']['radius'] && (this['params']['radius'] = this['params']['width'] / 0x2),
        this['object_type'] = 'cabinet',
        this['cabinet_type'] = this['params']['cabinet_type'],
        this['model'] = new THREE['Group'](),
        this['model']['name'] = 'Model',
        this['add'](this['model']),
        this['sizes'] = new THREE['Group'](),
        this['sizes']['name'] = 'Sizes',
        this['add'](this['sizes']),
        this['box'] = new THREE['Box3'](),
        this['box']['update'] = function() {
            g['box']['setFromObject'](g['size_box']);
        }
        ,
        this['build']();
    }
    ['build']() {
        var e = this;
        e['model'] && e['model']['tabletop'] && void 0x0 !== e['model']['tabletop']['userData']['tabletop_need_rebuild'] && delete e['model']['tabletop']['userData']['tabletop_need_rebuild'],
        e['reset_model'](),
        e['size_box'] ? e['size_box']['set_size'](e['params']['width'] / units, e['params']['height'] / units, e['params']['depth'] / units) : e['size_box'] = new SizeBox({
            'width': e['params']['width'] / units,
            'height': e['params']['height'] / units,
            'depth': e['params']['depth'] / units
        }),
        e['size_box']['position']['y'] = e['params']['height'] / units / 0x2 + e['params']['fly_height'] / units,
        e['add'](e['size_box']),
        e['size_box']['visible'] = !0x1,
        e['position']['y'] = e['params']['fly_height'] / units,
        e['build_shapes'](),
        this['box']['update'](),
        this['build_sizes'](),
        this['check_wall_panel'](),
        'edges' === global_options['mode'] && e['edges_mode'](),
        this['calculate_distances'](),
        this['build_from_wall_sizes'](),
        this['resizable'] && this['resizable']['updateControls']();
    }
    ['build_shapes']() {
        var f = this, g = f['params']['bardesk_type'], h = this['create_shape'](), h, g, h, g, h, g;
        let j = 'common' !== g && 'full' != g ? 'rotated' : !0x1;
        f['model']['tabletop'] = new Tabletop({
            'id': f['params']['material'] || project_settings['defaults']['tabletop'],
            'width': f['params']['width'],
            'height': f['params']['thickness'],
            'depth': f['params']['depth'],
            'material': f['params']['material'],
            'shape': h[0x0],
            'bortOffsets': h[0x1],
            'material_rotated': j
        }),
        'full' == g ? (f['model']['leg'] = new Tabletop({
            'id': f['params']['material'] || project_settings['defaults']['tabletop'],
            'width': f['params']['height'] - f['params']['thickness'],
            'height': f['params']['thickness'],
            'depth': f['params']['depth'],
            'material': f['params']['material'],
            'material_rotated': j
        }),
        f['model']['leg']['rotation']['z'] = Math['PI'] / 0x2,
        f['model']['leg']['position']['x'] = -f['params']['width'] / units / 0x2 + f['params']['thickness'] / units,
        this['model']['leg']['position']['y'] = this['params']['height'] / units / 0x2 - this['params']['thickness'] / units / 0x2,
        this['model']['leg']['userData']['tmp_no_hide'] = !0x0) : 'podium' == g ? (h = get_hypo(f['params']['width'], f['params']['width']),
        g = build_shape['corner_angle_double'](h / units - this['params']['thickness'] / units / 0x2, this['params']['thickness'] / units, 0x2d),
        f['model']['leg'] = new Tabletop({
            'width': h,
            'height': f['params']['height'] - f['params']['thickness'],
            'material': f['params']['material'],
            'material_rotated': f['params']['material_rotated'],
            'shape': g
        }),
        f['model']['leg']['rotation']['y'] = Math['PI'] / 0x4 * 0x3,
        f['model']['leg']['position']['z'] = -this['params']['thickness'] / units / 0x2,
        f['model']['leg']['position']['x'] = this['params']['thickness'] / units / 0x2,
        this['model']['tabletop']['rotation']['y'] = Math['PI'] / 0x2) : (f['params']['leg_model'] ? (f['params']['leg_model']['variants'][0x0]['height'] = f['params']['height'] - f['params']['thickness'],
        f['model']['leg'] = new Model_new(f['params']['leg_model']),
        void 0x0 === Model_utils['get_model_from_cache'](f['params']['leg_model']['model']) && f['model']['leg']['load_model']()) : (h = new THREE['CylinderBufferGeometry'](0x19 / units,0x19 / units,f['params']['height'] / units - f['params']['thickness'] / units,0xc),
        f['model']['leg'] = new THREE['Mesh'](h,white_mat),
        f['model']['leg']['castShadow'] = !0x0,
        f['model']['leg']['receiveShadow'] = !0x0,
        this['model']['leg']['position']['y'] = this['params']['height'] / units / 0x2 - this['params']['thickness'] / units / 0x2),
        this['model']['leg']['position']['x'] = -this['params']['width'] / units / 0x2 + 0xfa / units),
        this['model']['tabletop']['position']['y'] = this['params']['height'] / units - this['params']['thickness'] / units,
        0x0 != f['params']['plints']['back'] && ((g = this['create_plint'](f['params']['width']))['position']['y'] = this['model']['tabletop']['position']['y'] + 0x1e / units / 0x2,
        g['position']['z'] = -f['params']['depth'] / units / 0x2 + 0x14 / units / 0x2),
        0x0 != f['params']['plints']['left'] && ((h = this['create_plint'](f['params']['depth']))['rotation']['y'] = Math['PI'] / 0x2,
        h['position']['y'] = this['model']['tabletop']['position']['y'] + 0x1e / units / 0x2,
        h['position']['x'] = -f['params']['width'] / units / 0x2 + 0x14 / units / 0x2),
        0x0 != f['params']['plints']['right'] && ((g = this['create_plint'](f['params']['depth']))['rotation']['y'] = -Math['PI'] / 0x2,
        g['position']['y'] = this['model']['tabletop']['position']['y'] + 0x1e / units / 0x2,
        g['position']['x'] = f['params']['width'] / units / 0x2 - 0x14 / units / 0x2),
        f['model']['leg']['visible'] = f['params']['leg_visible'],
        f['model']['add'](f['model']['tabletop']),
        f['model']['add'](f['model']['leg']);
    }
    ['create_shape']() {
        if ('podium' === this['params']['bardesk_type'])
            return [this['create_podium_shape'](), null];
        if (this['is_straight']())
            return [null, null];
        var f = this['params']['corners'], g, g, g;
        let h = null;
        return this['params']['corners_equal'] ? (g = this['get_radius'](f['c1']['val']) / units,
        'straight' !== f['c1']['type'] && (h = {
            'c1': g,
            'c2': g,
            'c3': g,
            'c4': g
        }),
        g = {
            'type': f['c1']['type'],
            'val': g
        },
        [build_shape['tabletop'](this['params']['width'] / units, this['params']['depth'] / units, {
            'c1': g,
            'c2': g,
            'c3': g,
            'c4': g
        }), h]) : (g = {
            'c1': {
                'type': f['c1']['type'],
                'val': this['get_radius'](f['c1']['val']) / units
            },
            'c2': {
                'type': f['c2']['type'],
                'val': this['get_radius'](f['c2']['val']) / units
            },
            'c3': {
                'type': f['c3']['type'],
                'val': this['get_radius'](f['c3']['val']) / units
            },
            'c4': {
                'type': f['c4']['type'],
                'val': this['get_radius'](f['c4']['val']) / units
            }
        },
        h = {
            'c1': 'straight' === g['c1']['type'] ? 0x0 : g['c1']['val'],
            'c2': 'straight' === g['c2']['type'] ? 0x0 : g['c2']['val'],
            'c3': 'straight' === g['c3']['type'] ? 0x0 : g['c3']['val'],
            'c4': 'straight' === g['c4']['type'] ? 0x0 : g['c4']['val']
        },
        [build_shape['tabletop'](this['params']['width'] / units, this['params']['depth'] / units, g), h]);
    }
    ['create_podium_shape']() {
        var f = this
          , g = new THREE['Shape']();
        return g['moveTo'](-f['params']['width'] / units / 0x2, f['params']['width'] / units / 0x2),
        g['lineTo'](f['params']['width'] / units / 0x2, f['params']['width'] / units / 0x2),
        g['lineTo'](f['params']['width'] / units / 0x2, -f['params']['width'] / units / 0x2),
        g['lineTo'](-f['params']['width'] / units / 0x2, f['params']['width'] / units / 0x2),
        g;
    }
    ['create_plint'](e) {
        var e = new Decoration({
            'width': e,
            'height': 0x1e,
            'thickness': 0x14,
            'material': this['params']['material'],
            'model': '/common_assets/models/tp1.fbx'
        });
        return this['model']['add'](e),
        e;
    }
    ['update_sc']() {
        setTimeout( () => {
            sc['build_tabletop']();
        }
        , 0x1f4);
    }
    ['is_straight']() {
        var e;
        return 'full' === this['params']['bardesk_type'] || 'podium' === this['params']['bardesk_type'] || !(e = this['params']['corners']) || 'straight' === e['c1']['type'] && 'straight' === e['c2']['type'] && 'straight' === e['c3']['type'] && 'straight' === e['c4']['type'];
    }
    ['get_radius'](f) {
        let g = f;
        return '0' !== g && ('string' == typeof g && (g = g['endsWith']('%') ? parseFloat(g['slice'](0x0, -0x1)) / 0x64 * Math['min'](this['params']['width'], this['params']['depth']) : parseFloat(g)),
        Number['isFinite'](g)) ? g : 0x0;
    }
    ['rotate_left']() {
        var f, g, h;
        constructor_settings['tabletop_v2'] ? (f = !constructor_settings['core_v2'],
        g = this['position']['clone'](),
        h = this['rotation']['y'],
        super['rotate_left'](),
        this['update_washers_on_move'](g, this['position'], this['rotation']['y'] - h),
        f && sc['build_tabletop_debounced']()) : super['rotate_left']();
    }
    ['rotate_right']() {
        var f, g, h;
        constructor_settings['tabletop_v2'] ? (f = !constructor_settings['core_v2'],
        g = this['position']['clone'](),
        h = this['rotation']['y'],
        super['rotate_right'](),
        this['update_washers_on_move'](g, this['position'], this['rotation']['y'] - h),
        f && sc['build_tabletop_debounced']()) : super['rotate_right']();
    }
    ['change_bardesk_corner'](f, g, h) {
        var f = this['params']['corners'][f];
        f['type'] = g,
        f['val'] = h,
        this['build'](),
        this['update_sc']();
    }
    ['set_bardesk_corners_equal'](e) {
        this['params']['corners_equal'] = e,
        this['build'](),
        this['update_sc']();
    }
    ['set_fly_height'](f) {
        var g = (f - this['params']['fly_height']) / units;
        this['translate_washers']({
            'y': g
        }),
        this['params']['fly_height'] = f,
        this['build'](),
        sc['build_tabletop_debounced']();
    }
    ['translate_washers'](f) {
        if (f && (f['x'] || f['y'] || f['z'])) {
            var g, h;
            _['defaults'](f, {
                'x': 0x0,
                'y': 0x0,
                'z': 0x0
            });
            for (h of this['find_washers']())
                h['reset_related_tabletop_parts'](),
                h['position']['add'](f);
        }
    }
    ['change_tabletop_material'](f) {
        this['params']['material'] = f,
        this['model']['tabletop']['change_material'](f),
        'Mesh' !== this['model']['leg']['type'] && this['model']['leg']['change_material'](f);
        for (let g = 0x0; g < this['model']['children']['length']; g++)
            'Facade' == this['model']['children'][g]['type'] && this['model']['children'][g]['change_material']({
                'id': f
            });
        global_update();
    }
    ['build_sizes']() {
        this['reset_model'](this['sizes']),
        this['size_width'] = new Sizes_obj({
            'width': this['params']['width'] / units,
            'text': this['params']['width'],
            'font_size': 0x32
        }),
        this['size_width']['position']['set'](0x0, this['params']['height'] / units + 0.04, this['params']['depth'] / units / 0x2 - 0.4),
        this['size_width']['rotation']['x'] = -Math['PI'] / 0x2,
        this['sizes']['add'](this['size_width']),
        this['size_height'] = new Sizes_obj({
            'width': this['params']['height'] / units,
            'text': this['params']['height'],
            'font_size': 0x32
        }),
        this['size_height']['position']['set'](-this['params']['width'] / units / 0x2, this['params']['height'] / units / 0x2, -this['params']['depth'] / units / 0x2 + 0.4),
        this['size_height']['rotation']['z'] = Math['PI'] / 0x2,
        this['sizes']['add'](this['size_height']),
        this['size_depth'] = new Sizes_obj({
            'width': this['params']['depth'] / units,
            'text': this['params']['depth'],
            'font_size': 0x32
        }),
        this['size_depth']['position']['set'](-this['params']['width'] / units / 0x2 + 0.04, this['params']['height'] / units + 0.04, 0x0),
        this['size_depth']['rotation']['z'] = -Math['PI'] / 0x2,
        this['size_depth']['rotation']['x'] = -Math['PI'] / 0x2,
        this['sizes']['add'](this['size_depth']),
        this['sizes']['visible'] = global_options['sizes_visible'];
    }
    ['check_tabletop_rebuild']() {
        return !0x0;
    }
    ['check_wall_panel']() {}
    ['set_size_by_number'](f, g, h) {
        var j = {
            'type': 'build',
            'from': copy_object(this['params']),
            'object': this
        };
        this['params']['width'] = f,
        this['params']['height'] = g,
        this['params']['depth'] = h,
        j['to'] = copy_object(this['params']),
        add_undo_action(j),
        this['build'](),
        this['update_sc'](),
        get_wall_panel();
    }
    ['show_radial_menu'](f, g) {
        var h = this
          , j = {
            'sizes': !0x0,
            'copy_button': !0x0,
            'rotate_buttons': !0x0,
            'material': !0x0,
            'material_facade': !0x1,
            'material_corpus': !0x1
        };
        project_settings['available_selection'] && 0x0 == project_settings['available_selection']['allow_tabletop_materials_select'] && (j['material'] = !0x1),
        pp['interface']['root']['radial']({
            'obj_type': this['type'],
            'obj': j,
            'left': f,
            'top': g
        });
    }
    ['update_washers_on_move'](f, g, h, j) {
        var k = g['clone']()['sub'](f), l, m;
        for (m of j || this['find_washers']())
            m['reset_related_tabletop_parts'](),
            m['rotate_across_point'](f, h),
            m['position']['x'] += k['x'],
            m['position']['z'] += k['z'];
    }
    ['find_washers']() {
        var f, g;
        return !constructor_settings['core_v2'] && (g = this['model']['tabletop']) ? _['map'](_['get'](g, 'userData.washers'), h => h['obj']) : [];
    }
    ['delete'](e) {
        this['reset_model'](),
        super['del_spl'](),
        0x1 == constructor_settings['tabletop_v2'] && sc['build_tabletop']();
    }
    ['get_price']() {
        return 0x1 == constructor_settings['shop_mode'] && 0x1 != custom_settings['force_tabletop_price'] ? 0x0 : (this['params']['price'] = this['get_price_specs'](),
        this['params']['price']);
    }
    ['get_specs'](f) {
        var g = copy_object(specs_result);
        if (0x1 == constructor_settings['tabletop_v2'])
            return g;
        var h = {
            'id': 0x0,
            'm2': 0x0,
            'pm': 0x0
        }, h, j;
        h['m2'] = this['params']['width'] / 0x3e8 * this['params']['depth'] / 0x3e8,
        h['pm'] += Math['max'](this['params']['width'] / 0x3e8, this['params']['depth'] / 0x3e8),
        h['id'] = this['params']['material'],
        g['tabletop']['push'](h),
        this['specs'] = g,
        'full' === this['params']['bardesk_type'] && ((h = {
            'id': 0x0,
            'm2': 0x0,
            'pm': 0x0
        })['m2'] = parseFloat(((this['params']['height'] - this['params']['thickness']) / 0x3e8 * this['params']['width'] / 0x3e8)['toFixed'](0x2)),
        h['pm'] = (this['params']['height'] - this['params']['thickness']) / 0x3e8,
        h['id'] = this['params']['material'],
        g['tabletop']['push'](h));
        for (let k = 0x0; k < this['model']['children']['length']; k++) {
            'Facade' == this['model']['children'][k]['type'] && ((j = {
                'id': 0x0,
                'm2': 0x0,
                'pm': 0x0
            })['id'] = this['params']['material'],
            j['pm'] += this['model']['children'][k]['params']['width'] / 0x3e8,
            g['tabletop_plints']['push'](j));
        }
        return f ? convert_specs(g) : g;
    }
    ['get_price_specs']() {
        let f = this['get_specs'](!0x0)
          , g = 0x0;
        if (0x1 == constructor_settings['tabletop_v2']) {
            var h = pp['libs']['tabletop']['find_item'](this['params']['tabletop_id'])
              , j = void 0x0 === this['params']['variant'] ? 0x0 : this['params']['variant']
              , h = h['params']['variants'][j];
            g = parseFloat(h['price']),
            this['params']['name'] = h['name'],
            this['params']['code'] = h['code'],
            this['price_description'] = {
                'tabletop': [{
                    'name': h['name'],
                    'name_only': h['name'],
                    'code': h['code'],
                    'count': this['params']['width'] / 0x3e8,
                    'units': 'units_flat',
                    'price': g * constructor_settings['price_modificator'],
                    'price_per_piece': g * constructor_settings['price_modificator']
                }]
            };
        } else {
            let k = {};
            Object['keys'](f['tabletop'])['length'] && (k['tabletop'] = [],
            Object['keys'](f['tabletop'])['forEach'](function(l) {
                let m = get_material_by_id(l);
                m = m || get_material_by_id(0x0);
                var n = objectFindByKey(prices['tabletop'], 'id', m['category']);
                if (n) {
                    let o;
                    var n = (o = (0x0 != n['get_from_parent'] && null != n['get_from_parent'] ? objectFindByKey(prices['tabletop'], 'id', n['parent']) : n)['price']) * f['tabletop'][l]['m2'];
                    k['tabletop']['push'](get_desc_arr(f['tabletop'][l], n, o)),
                    g += n;
                }
            })),
            Object['keys'](f['tabletop_plints'])['length'] && prices['tabletop_plints'] && (k['tabletop_plints'] = [],
            Object['keys'](f['tabletop_plints'])['forEach'](function(l) {
                let m = get_material_by_id(l);
                m = m || get_material_by_id(0x0);
                var n = objectFindByKey(prices['tabletop_plints'], 'id', m['category']);
                if (n) {
                    let o;
                    var n = (o = (0x0 != n['get_from_parent'] && null != n['get_from_parent'] ? objectFindByKey(prices['tabletop_plints'], 'id', n['parent']) : n)['price']) * f['tabletop_plints'][l]['pm'];
                    k['tabletop_plints']['push'](get_desc_arr(f['tabletop_plints'][l], n, o)),
                    g += n;
                }
            })),
            this['price_description'] = k,
            g *= constructor_settings['price_modificator'];
        }
        return g;
    }
    ['copypaste']() {
        return void this['toggleResizeMode'](null, 'bottom');
        var e = new Bardesk(JSON['parse'](JSON['stringify'](this['params'])));
        room['add'](e),
        room['active_objects']['push'](e),
        d_objects['push'](e),
        e['position']['copy'](this['position']),
        e['rotation']['copy'](this['rotation']),
        0x0 === e['rotation']['y'] && (e['position']['x'] += e['params']['width'] / units),
        e['rotation']['y'] === Math['PI'] && (e['position']['x'] -= e['params']['width'] / units),
        e['rotation']['y'] === Math['PI'] / 0x2 && (e['position']['z'] -= e['params']['width'] / units),
        e['rotation']['y'] === -Math['PI'] / 0x2 && (e['position']['z'] += e['params']['width'] / units),
        add_undo_action({
            'type': 'copy',
            'object': e
        }),
        setTimeout(function() {
            get_wall_panel(),
            get_total_price_test();
        }, 0xc8);
    }
}
class Bardesk_new extends PPObject {
    constructor(f) {
        super(f);
        var g = this;
        this['type'] = 'Bardesk',
        this['temp_type'] = 'Bardesk',
        (f = f || {})['plints'] || (f['plints'] = {});
        let h = 0x2d0;
        custom_settings['bottom_corpus_height'] && (h = custom_settings['bottom_corpus_height']),
        'bardesk' == f['name'] && (f['name'] = lang['tabletop']),
        this['params'] = {
            'tabletop_id': void 0x0 !== f['tabletop_id'] ? f['tabletop_id'] : project_settings['defaults']['tabletop'],
            'width': void 0x0 !== f['width'] ? f['width'] : 0x258,
            'height': void 0x0 !== f['height'] ? f['height'] : h + project_settings['cokol_height'] + project_settings['tabletop_thickness'],
            'depth': void 0x0 !== f['depth'] ? f['depth'] : 0x5dc,
            'thickness': void 0x0 !== f['thickness'] ? f['thickness'] : project_settings['tabletop_thickness'],
            'bardesk_type': void 0x0 !== f['bardesk_type'] ? f['bardesk_type'] : 'full',
            'leg_visible': void 0x0 !== f['leg_visible'] ? f['leg_visible'] : 0x1,
            'leg_model': void 0x0 !== f['leg_model'] ? f['leg_model'] : void 0x0,
            'radius': void 0x0 !== f['radius'] ? f['radius'] : void 0x0,
            'material': f['material'] || project_settings['selected_materials']['tabletop'],
            'material_rotated': f['material_rotated'] || !0x1,
            'cabinet_type': f['cabinet_type'] || 'bottom',
            'rX': void 0x0 !== f['rX'] ? f['rX'] : 0x0,
            'rY': void 0x0 !== f['rY'] ? f['rY'] : 0x0,
            'rZ': void 0x0 !== f['rZ'] ? f['rZ'] : 0x0,
            'pX': void 0x0 !== f['pX'] ? f['pX'] : 0x0,
            'pY': void 0x0 !== f['pY'] ? f['pY'] : 0x0,
            'pZ': void 0x0 !== f['pZ'] ? f['pZ'] : 0x0,
            'name': f['name'] || lang['tabletop'],
            'plints': {
                'back': !0x1,
                'left': !0x1,
                'right': !0x1
            }
        },
        constructor_settings['tabletop_v2'],
        this['params']['variants'] = void 0x0 !== f['variants'] ? f['variants'] : [],
        void 0x0 === this['params']['radius'] && (this['params']['radius'] = this['params']['width'] / 0x2),
        this['object_type'] = 'cabinet',
        this['cabinet_type'] = this['params']['cabinet_type'],
        this['model'] = new THREE['Group'](),
        this['model']['name'] = 'Model',
        this['add'](this['model']),
        this['sizes'] = new THREE['Group'](),
        this['sizes']['name'] = 'Sizes',
        this['add'](this['sizes']),
        this['box'] = new THREE['Box3'](),
        this['box']['update'] = function() {
            g['box']['setFromObject'](g['model']);
        }
        ,
        g['size_box'] = new SizeBox({
            'width': g['params']['width'] / units,
            'height': g['params']['height'] / units,
            'depth': g['params']['depth'] / units
        }),
        g['size_box']['position']['y'] = g['params']['height'] / units / 0x2,
        g['add'](g['size_box']),
        g['size_box']['visible'] = !0x1,
        this['build']();
    }
    ['build']() {
        var f = this, g;
        f['reset_model'](),
        'common' === f['params']['bardesk_type'] && f['build_common'](),
        'full' === f['params']['bardesk_type'] && f['build_full'](),
        'rounded' === f['params']['bardesk_type'] && f['build_rounded'](),
        'podium' === f['params']['bardesk_type'] && f['build_podium'](),
        0x1 == constructor_settings['tabletop_v2'] && (g = make_cube(f['params']['width'] / units, f['params']['thickness'] / units, f['params']['depth'] / units, transparent_material),
        this['model']['add'](g),
        g['position']['y'] = f['params']['height'] / units - f['params']['thickness'] / units / 0x2),
        this['box']['update'](),
        this['build_sizes'](),
        this['check_wall_panel'](),
        'edges' === global_options['mode'] && f['edges_mode'](),
        this['calculate_distances'](),
        this['build_from_wall_sizes']();
    }
    ['build_common']() {
        let f = this, g = build_shape['square'](f['params']['width'] / units, f['params']['depth'] / units), h = !0x1, j;
        var k, k, k;
        this['params']['leg_visible'] && (h = 'rotated'),
        f['model']['tabletop'] = new Tabletop({
            'width': f['params']['width'],
            'height': f['params']['thickness'],
            'depth': f['params']['depth'],
            'material': f['params']['material'],
            'material_rotated': h
        }),
        this['model']['tabletop']['position']['y'] = this['params']['height'] / units,
        f['params']['leg_model'] ? (f['params']['leg_model']['variants'][0x0]['height'] = f['params']['height'] - f['params']['thickness'],
        f['model']['leg'] = new Model_new(f['params']['leg_model']),
        void 0x0 === Model_utils['get_model_from_cache'](f['params']['leg_model']['model']) && f['model']['leg']['load_model']()) : (j = new THREE['CylinderBufferGeometry'](0x19 / units,0x19 / units,f['params']['height'] / units - f['params']['thickness'] / units,0xc),
        f['model']['leg'] = new THREE['Mesh'](j,white_mat),
        f['model']['leg']['castShadow'] = !0x0,
        f['model']['leg']['receiveShadow'] = !0x0,
        this['model']['leg']['position']['y'] = this['params']['height'] / units / 0x2 - this['params']['thickness'] / units / 0x2),
        this['model']['leg']['position']['z'] = this['params']['depth'] / units / 0x2 - 0xfa / units,
        0x0 != f['params']['plints']['back'] && (k = new Decoration({
            'width': f['params']['width'],
            'height': 0x1e,
            'thickness': 0x14,
            'material': f['params']['material'],
            'model': '/common_assets/models/tp1.fbx'
        }),
        f['model']['add'](k),
        k['position']['y'] = this['model']['tabletop']['position']['y'] + 0x1e / units / 0x2,
        k['position']['z'] = -f['params']['depth'] / units / 0x2 + 0x14 / units / 0x2),
        0x0 != f['params']['plints']['left'] && (k = new Decoration({
            'width': f['params']['depth'],
            'height': 0x1e,
            'thickness': 0x14,
            'material': f['params']['material'],
            'model': '/common_assets/models/tp1.fbx'
        }),
        f['model']['add'](k),
        k['rotation']['y'] = Math['PI'] / 0x2,
        k['position']['y'] = this['model']['tabletop']['position']['y'] + 0x1e / units / 0x2,
        k['position']['x'] = -f['params']['width'] / units / 0x2 + 0x14 / units / 0x2),
        0x0 != f['params']['plints']['right'] && (k = new Decoration({
            'width': f['params']['depth'],
            'height': 0x1e,
            'thickness': 0x14,
            'material': f['params']['material'],
            'model': '/common_assets/models/tp1.fbx'
        }),
        f['model']['add'](k),
        k['rotation']['y'] = -Math['PI'] / 0x2,
        k['position']['y'] = this['model']['tabletop']['position']['y'] + 0x1e / units / 0x2,
        k['position']['x'] = f['params']['width'] / units / 0x2 - 0x14 / units / 0x2),
        f['model']['leg']['visible'] = f['params']['leg_visible'],
        f['model']['add'](f['model']['tabletop']),
        f['model']['add'](f['model']['leg']);
    }
    ['build_rounded']() {
        var f = this, g = build_shape['rounded_tabletop'](f['params']['width'] / units, f['params']['depth'] / units, f['params']['radius'] / units), g, g;
        f['model']['tabletop'] = new Tabletop({
            'width': f['params']['width'],
            'height': f['params']['thickness'],
            'depth': f['params']['depth'],
            'material': f['params']['material'],
            'shape': g,
            'material_rotated': 'rotated'
        }),
        f['params']['leg_model'] ? (f['params']['leg_model']['variants'][0x0]['height'] = f['params']['height'] - f['params']['thickness'],
        f['model']['leg'] = new Model_new(f['params']['leg_model']),
        void 0x0 === Model_utils['get_model_from_cache'](f['params']['leg_model']['model']) && f['model']['leg']['load_model']()) : (g = new THREE['CylinderBufferGeometry'](0x19 / units,0x19 / units,f['params']['height'] / units - f['params']['thickness'] / units,0xc),
        f['model']['leg'] = new THREE['Mesh'](g,white_mat),
        this['model']['leg']['position']['y'] = this['params']['height'] / units / 0x2 - this['params']['thickness'] / units / 0x2),
        this['model']['leg']['position']['z'] = this['params']['depth'] / units / 0x2 - 0xfa / units,
        this['model']['tabletop']['position']['y'] = this['params']['height'] / units,
        0x0 != f['params']['plints']['back'] && (g = new Decoration({
            'width': f['params']['width'],
            'height': 0x1e,
            'thickness': 0x14,
            'material': f['params']['material'],
            'model': '/common_assets/models/tp1.fbx'
        }),
        f['model']['add'](g),
        g['position']['y'] = this['model']['tabletop']['position']['y'] + 0x1e / units / 0x2,
        g['position']['z'] = -f['params']['depth'] / units / 0x2 + 0x14 / units / 0x2),
        f['model']['leg']['visible'] = f['params']['leg_visible'],
        f['model']['add'](f['model']['tabletop']),
        f['model']['add'](f['model']['leg']);
    }
    ['build_full']() {
        var f = this, g = build_shape['square'](f['params']['width'] / units, f['params']['depth'] / units), h = new THREE['CylinderBufferGeometry'](0x19 / units,0x19 / units,f['params']['height'] / units - f['params']['thickness'] / units,0xc), j, j, j;
        ce(),
        ce(),
        ce(),
        f['model']['tabletop'] = new Tabletop({
            'width': f['params']['width'],
            'height': f['params']['thickness'],
            'depth': f['params']['depth'],
            'material': f['params']['material'],
            'material_rotated': 'rotated'
        }),
        f['model']['leg'] = new Tabletop({
            'width': f['params']['width'],
            'height': f['params']['thickness'],
            'depth': f['params']['height'] - f['params']['thickness'],
            'material': f['params']['material'],
            'material_rotated': 'rotated'
        }),
        f['model']['leg']['rotation']['x'] = Math['PI'] / 0x2,
        f['model']['leg']['position']['z'] = f['params']['depth'] / units / 0x2,
        this['model']['tabletop']['position']['y'] = this['params']['height'] / units,
        this['model']['leg']['position']['y'] = this['params']['height'] / units / 0x2 - this['params']['thickness'] / units / 0x2,
        this['model']['leg']['userData']['tmp_no_hide'] = !0x0,
        0x0 != f['params']['plints']['back'] && (j = new Decoration({
            'width': f['params']['width'],
            'height': 0x1e,
            'thickness': 0x14,
            'material': f['params']['material'],
            'model': '/common_assets/models/tp1.fbx'
        }),
        f['model']['add'](j),
        j['position']['y'] = this['model']['tabletop']['position']['y'] + 0x1e / units / 0x2,
        j['position']['z'] = -f['params']['depth'] / units / 0x2 + 0x14 / units / 0x2),
        0x0 != f['params']['plints']['left'] && (j = new Decoration({
            'width': f['params']['depth'],
            'height': 0x1e,
            'thickness': 0x14,
            'material': f['params']['material'],
            'model': '/common_assets/models/tp1.fbx'
        }),
        f['model']['add'](j),
        j['rotation']['y'] = Math['PI'] / 0x2,
        j['position']['y'] = this['model']['tabletop']['position']['y'] + 0x1e / units / 0x2,
        j['position']['x'] = -f['params']['width'] / units / 0x2 + 0x14 / units / 0x2),
        0x0 != f['params']['plints']['right'] && (j = new Decoration({
            'width': f['params']['depth'],
            'height': 0x1e,
            'thickness': 0x14,
            'material': f['params']['material'],
            'model': '/common_assets/models/tp1.fbx'
        }),
        f['model']['add'](j),
        j['rotation']['y'] = -Math['PI'] / 0x2,
        j['position']['y'] = this['model']['tabletop']['position']['y'] + 0x1e / units / 0x2,
        j['position']['x'] = f['params']['width'] / units / 0x2 - 0x14 / units / 0x2),
        f['model']['leg']['visible'] = f['params']['leg_visible'],
        f['model']['add'](f['model']['tabletop']),
        f['model']['add'](f['model']['leg']);
    }
    ['build_podium']() {
        var f = this, g = new THREE['Shape'](), h = (g['moveTo'](-f['params']['width'] / units / 0x2, f['params']['width'] / units / 0x2),
        g['lineTo'](f['params']['width'] / units / 0x2, f['params']['width'] / units / 0x2),
        g['lineTo'](f['params']['width'] / units / 0x2, -f['params']['width'] / units / 0x2),
        g['lineTo'](-f['params']['width'] / units / 0x2, f['params']['width'] / units / 0x2),
        get_hypo(f['params']['width'], f['params']['width'])), g = (f['model']['tabletop'] = new Tabletop({
            'width': f['params']['width'],
            'height': f['params']['thickness'],
            'depth': f['params']['depth'],
            'material': f['params']['material'],
            'shape': g,
            'material_rotated': f['params']['material_rotated']
        }),
        build_shape['corner_angle_double'](h / units - this['params']['thickness'] / units / 0x2, this['params']['thickness'] / units, 0x2d)), h, g;
        f['model']['leg'] = f['model']['leg'] = new Tabletop({
            'width': h,
            'height': f['params']['height'] - f['params']['thickness'],
            'material': f['params']['material'],
            'material_rotated': f['params']['material_rotated'],
            'shape': g
        }),
        f['model']['leg']['rotation']['y'] = Math['PI'] / 0x4 * 0x3,
        f['model']['leg']['position']['z'] = -this['params']['thickness'] / units / 0x2,
        f['model']['leg']['position']['x'] = this['params']['thickness'] / units / 0x2,
        this['model']['tabletop']['position']['y'] = this['params']['height'] / units,
        this['model']['tabletop']['rotation']['y'] = Math['PI'] / 0x2,
        this['model']['leg']['position']['y'] = this['params']['height'] / units - this['params']['thickness'] / units,
        0x0 != f['params']['plints']['left'] && (h = new Decoration({
            'width': f['params']['width'],
            'height': 0x1e,
            'thickness': 0x14,
            'material': f['params']['material'],
            'model': '/common_assets/models/tp1.fbx'
        }),
        f['model']['add'](h),
        h['position']['y'] = this['model']['tabletop']['position']['y'] + 0x1e / units / 0x2,
        h['position']['z'] = -f['params']['depth'] / units / 0x2 + 0x14 / units / 0x2),
        0x0 != f['params']['plints']['right'] && (g = new Decoration({
            'width': f['params']['depth'],
            'height': 0x1e,
            'thickness': 0x14,
            'material': f['params']['material'],
            'model': '/common_assets/models/tp1.fbx'
        }),
        f['model']['add'](g),
        g['rotation']['y'] = -Math['PI'] / 0x2,
        g['position']['y'] = this['model']['tabletop']['position']['y'] + 0x1e / units / 0x2,
        g['position']['x'] = f['params']['width'] / units / 0x2 - 0x14 / units / 0x2),
        f['model']['leg']['visible'] = f['params']['leg_visible'],
        f['model']['add'](f['model']['tabletop']),
        f['model']['add'](f['model']['leg']);
    }
    ['change_tabletop_material'](f) {
        this['params']['material'] = f,
        this['model']['tabletop']['change_material'](f),
        'Mesh' !== this['model']['leg']['type'] && this['model']['leg']['change_material'](f);
        for (let g = 0x0; g < this['model']['children']['length']; g++)
            'Facade' == this['model']['children'][g]['type'] && this['model']['children'][g]['change_material']({
                'id': f
            });
        global_update();
    }
    ['build_sizes']() {
        this['reset_model'](this['sizes']),
        this['size_width'] = new Sizes_obj({
            'width': this['params']['width'] / units,
            'text': this['params']['width'],
            'font_size': 0x32
        }),
        this['size_width']['position']['set'](0x0, this['params']['height'] / units, -this['params']['depth'] / units / 0x2 + 0.4),
        this['sizes']['add'](this['size_width']),
        this['size_height'] = new Sizes_obj({
            'width': this['params']['height'] / units,
            'text': this['params']['height'],
            'font_size': 0x32
        }),
        this['size_height']['position']['set'](-this['params']['width'] / units / 0x2, this['params']['height'] / units / 0x2, -this['params']['depth'] / units / 0x2 + 0.4),
        this['size_height']['rotation']['z'] = Math['PI'] / 0x2,
        this['sizes']['add'](this['size_height']),
        this['size_depth'] = new Sizes_obj({
            'width': this['params']['depth'] / units,
            'text': this['params']['depth'],
            'font_size': 0x32
        }),
        'podium' === this['params']['bardesk_type'] ? (this['size_depth']['position']['set'](this['params']['width'] / units / 0x2 - 0.4, this['params']['height'] / units, 0x0),
        this['size_depth']['rotation']['y'] = -Math['PI'] / 0x2) : (this['size_depth']['position']['set'](-this['params']['width'] / units / 0x2 + 0.04, this['params']['height'] / units + 0.04, 0x0),
        this['size_depth']['rotation']['z'] = -Math['PI'] / 0x2,
        this['size_depth']['rotation']['x'] = -Math['PI'] / 0x2),
        this['sizes']['add'](this['size_depth']),
        this['sizes']['visible'] = global_options['sizes_visible'];
    }
    ['check_wall_panel']() {}
    ['set_size_by_number'](f, g, h) {
        var j = {
            'type': 'build',
            'from': copy_object(this['params']),
            'object': this
        };
        this['params']['width'] = f,
        this['params']['height'] = g,
        this['params']['depth'] = h,
        j['to'] = copy_object(this['params']),
        add_undo_action(j),
        this['build'](),
        get_wall_panel();
    }
    ['show_radial_menu'](f, g) {
        var h = this
          , j = {
            'sizes': !0x0,
            'copy_button': !0x0,
            'rotate_buttons': !0x0,
            'material': !0x0,
            'material_facade': !0x1,
            'material_corpus': !0x1
        };
        project_settings['available_selection'] && 0x0 == project_settings['available_selection']['allow_tabletop_materials_select'] && (j['material'] = !0x1),
        pp['interface']['root']['radial']({
            'obj_type': this['type'],
            'obj': j,
            'left': f,
            'top': g
        });
    }
    ['delete'](e) {
        this['reset_model'](),
        super['del_spl'](),
        0x1 == constructor_settings['tabletop_v2'] && sc['build_tabletop']();
    }
    ['get_price']() {
        return 0x1 == constructor_settings['shop_mode'] && 0x1 != custom_settings['force_tabletop_price'] ? 0x0 : (this['params']['price'] = this['get_price_specs'](),
        this['params']['price']);
    }
    ['get_specs'](f) {
        var g = copy_object(specs_result), h = {
            'id': 0x0,
            'm2': 0x0,
            'pm': 0x0
        }, h, j;
        h['m2'] = this['params']['width'] / 0x3e8 * this['params']['depth'] / 0x3e8,
        h['pm'] += Math['max'](this['params']['width'] / 0x3e8, this['params']['depth'] / 0x3e8),
        h['id'] = this['params']['material'],
        g['tabletop']['push'](h),
        this['specs'] = g,
        'full' === this['params']['bardesk_type'] && ((h = {
            'id': 0x0,
            'm2': 0x0,
            'pm': 0x0
        })['m2'] = parseFloat(((this['params']['height'] - this['params']['thickness']) / 0x3e8 * this['params']['width'] / 0x3e8)['toFixed'](0x2)),
        h['pm'] = (this['params']['height'] - this['params']['thickness']) / 0x3e8,
        h['id'] = this['params']['material'],
        g['tabletop']['push'](h));
        for (let k = 0x0; k < this['model']['children']['length']; k++) {
            'Facade' == this['model']['children'][k]['type'] && ((j = {
                'id': 0x0,
                'm2': 0x0,
                'pm': 0x0
            })['id'] = this['params']['material'],
            j['pm'] += this['model']['children'][k]['params']['width'] / 0x3e8,
            g['tabletop_plints']['push'](j));
        }
        return f ? convert_specs(g) : g;
    }
    ['get_price_specs']() {
        let e = this['get_specs'](!0x0)
          , f = 0x0
          , g = {};
        return Object['keys'](e['tabletop'])['length'] && (g['tabletop'] = [],
        Object['keys'](e['tabletop'])['forEach'](function(h) {
            let j = get_material_by_id(h);
            j = j || get_material_by_id(0x0);
            var k = objectFindByKey(prices['tabletop'], 'id', j['category']);
            if (k) {
                let l;
                var k = (l = (0x0 != k['get_from_parent'] && null != k['get_from_parent'] ? objectFindByKey(prices['tabletop'], 'id', k['parent']) : k)['price']) * e['tabletop'][h]['m2'];
                g['tabletop']['push'](get_desc_arr(e['tabletop'][h], k, l)),
                f += k;
            }
        })),
        Object['keys'](e['tabletop_plints'])['length'] && prices['tabletop_plints'] && (g['tabletop_plints'] = [],
        Object['keys'](e['tabletop_plints'])['forEach'](function(h) {
            let j = get_material_by_id(h);
            j = j || get_material_by_id(0x0);
            var k = objectFindByKey(prices['tabletop_plints'], 'id', j['category']);
            if (k) {
                let l;
                var k = (l = (0x0 != k['get_from_parent'] && null != k['get_from_parent'] ? objectFindByKey(prices['tabletop_plints'], 'id', k['parent']) : k)['price']) * e['tabletop_plints'][h]['pm'];
                g['tabletop_plints']['push'](get_desc_arr(e['tabletop_plints'][h], k, l)),
                f += k;
            }
        })),
        this['price_description'] = g,
        f *= constructor_settings['price_modificator'];
    }
    ['copypaste']() {
        var e = new Bardesk_new(JSON['parse'](JSON['stringify'](this['params'])));
        room['add'](e),
        room['active_objects']['push'](e),
        d_objects['push'](e),
        e['position']['copy'](this['position']),
        e['rotation']['copy'](this['rotation']),
        0x0 === e['rotation']['y'] && (e['position']['x'] += e['params']['width'] / units),
        e['rotation']['y'] === Math['PI'] && (e['position']['x'] -= e['params']['width'] / units),
        e['rotation']['y'] === Math['PI'] / 0x2 && (e['position']['z'] -= e['params']['width'] / units),
        e['rotation']['y'] === -Math['PI'] / 0x2 && (e['position']['z'] += e['params']['width'] / units),
        add_undo_action({
            'type': 'copy',
            'object': e
        }),
        setTimeout(function() {
            get_wall_panel(),
            get_total_price_test();
        }, 0xc8);
    }
}
class Cabinet_new extends PPObject {
    constructor(e) {
        super(e);
        var f = this;
        this['type'] = 'Cabinet',
        this['temp_type'] = 'Cabinet',
        e = e || {},
        this['cabinet'] = new THREE['Group'](),
        this['cabinet']['name'] = 'Cabinet',
        this['cokol'] = new THREE['Group'](),
        this['cokol']['name'] = 'Cokol',
        this['cokol_top'] = new THREE['Group'](),
        this['cokol_top']['name'] = 'Cokol_top',
        this['tabletop'] = new THREE['Group'](),
        this['tabletop']['name'] = 'Tabletop',
        this['sizes'] = new THREE['Group'](),
        this['sizes']['name'] = 'Sizes',
        this['sizes']['userData']['childrenRenderable'] = !0x1,
        this['models'] = new THREE['Group'](),
        this['models']['name'] = 'Models',
        this['model'] = new THREE['Group'](),
        this['model']['name'] = 'Model',
        this['shelves'] = new THREE['Group'](),
        this['shelves']['name'] = 'Shelves',
        this['walls'] = new THREE['Group'](),
        this['walls']['name'] = 'Walls',
        this['doors'] = new THREE['Group'](),
        this['doors']['name'] = 'Doors',
        this['lockers'] = new THREE['Group'](),
        this['lockers']['name'] = 'Lockers',
        this['facades'] = new THREE['Group'](),
        this['facades']['name'] = 'Facades',
        this['decorations'] = new THREE['Group'](),
        this['decorations']['name'] = 'Decorations',
        this['cornice'] = new THREE['Group'](),
        this['cornice']['name'] = 'Cornice',
        this['comments'] = new THREE['Group'](),
        this['comments']['name'] = 'Comments',
        this['furniture'] = new THREE['Group'](),
        this['furniture']['name'] = 'Furniture',
        this['washer'] = new THREE['Group'](),
        this['washer']['name'] = 'Washer',
        this['fixed_models'] = new THREE['Group'](),
        this['fixed_models']['name'] = 'Fixed_models',
        this['built_in_models'] = new THREE['Group'](),
        this['built_in_models']['name'] = 'Built_in_models',
        this['sections'] = new THREE['Group'](),
        this['sections']['name'] = 'sections',
        this['add'](this['cabinet']),
        this['add'](this['cokol']),
        this['add'](this['cokol_top']),
        this['add'](this['tabletop']),
        this['add'](this['sizes']),
        this['add'](this['models']),
        this['add'](this['model']),
        this['add'](this['shelves']),
        this['add'](this['walls']),
        this['add'](this['doors']),
        this['add'](this['lockers']),
        this['add'](this['facades']),
        this['add'](this['decorations']),
        this['add'](this['cornice']),
        this['add'](this['sizes']),
        this['add'](this['comments']),
        this['add'](this['furniture']),
        this['add'](this['washer']),
        this['add'](this['fixed_models']),
        this['add'](this['built_in_models']),
        this['add'](this['sections']),
        this['lights'] = new THREE['Group'](),
        this['lights']['name'] = 'Lights',
        this['add'](this['lights']),
        this['models_to_load'] = [],
        this['build_params'](e),
        this['box'] = new THREE['Box3'](),
        this['box']['update'] = function() {
            f['box']['setFromObject'](f['size_box']);
        }
        ,
        this['model_loaded'] = 'not_loaded',
        this['cust_dists'] = {},
        this['accessories_data'] = [],
        this['furniture_data'] = [],
        this['selected_furniture'] = {},
        this['build']();
    }
    ['rotate_left']() {
        var f, g, h;
        constructor_settings['tabletop_v2'] ? (f = !constructor_settings['core_v2'],
        g = this['position']['clone'](),
        h = this['rotation']['y'],
        super['rotate_left'](),
        this['update_washers_on_move'](g, this['position'], this['rotation']['y'] - h),
        f && sc['build_tabletop_debounced']()) : super['rotate_left']();
    }
    ['rotate_right']() {
        var f, g, h;
        constructor_settings['tabletop_v2'] ? (f = !constructor_settings['core_v2'],
        g = this['position']['clone'](),
        h = this['rotation']['y'],
        super['rotate_right'](),
        this['update_washers_on_move'](g, this['position'], this['rotation']['y'] - h),
        f && sc['build_tabletop_debounced']()) : super['rotate_right']();
    }
    ['update_washers_on_move'](f, g, h, j) {
        var k = g['clone']()['sub'](f), l, m;
        for (m of j || this['find_washers']())
            m['reset_related_tabletop_parts'](),
            m['rotate_across_point'](f, h),
            m['position']['x'] += k['x'],
            m['position']['z'] += k['z'];
    }
    ['delete'](e) {
        this['reset_model'](),
        super['del_spl'](),
        this['check_tabletop_rebuild']() && sc['build_tabletop']();
        for (let g = this['params']['accessories_list']['length'] - 0x1; 0x0 <= g; g--) {
            var f = this['params']['accessories_list'][g];
            pp['interface']['root']['remove_accessories'](f, this['params']['obj_id']);
        }
        this['after_delete'](),
        sc['get_price']();
    }
    ['check_tabletop_rebuild']() {
        return !this['userData']['tabletopGroup'] && 'bottom' == this['params']['cabinet_group'] && 0x1 == this['params']['tabletop']['active'];
    }
    ['is_detached_tabletop']() {
        var e, e;
        return !!constructor_settings['core_v2'] && 0x1 === (e = this['userData']['parts']['tabletop'])['length'] && !(!(e = _['get'](e[0x0], 'userData.params.spec')) || e['can_group']);
    }
}
Cabinet_new['prototype']['build_params'] = function(f) {
    var g = this, h;
    if (f['cabinet'] || (f['cabinet'] = {}),
    f['cabinet']['offset'] || (f['cabinet']['offset'] = {}),
    f['cabinet']['sides'] || (f['cabinet']['sides'] = {}),
    f['cabinet']['sides']['left'] || (f['cabinet']['sides']['left'] = {}),
    f['cabinet']['sides']['right'] || (f['cabinet']['sides']['right'] = {}),
    f['type_params'] || (f['type_params'] = {}),
    f['tabletop'] || (f['tabletop'] = {
        'offset': {}
    }),
    f['tabletop']['offset'] || (f['tabletop']['offset'] = {}),
    f['tabletop']['plints'] || (f['tabletop']['plints'] = {}),
    f['cornice'] || (f['cornice'] = {}),
    f['cokol'] || (f['cokol'] = {}),
    f['cokol_top'] || (f['cokol_top'] = {}),
    f['leg'] || (f['leg'] = {}),
    f['facade'] || (f['facades'] = []),
    f['decorations'] || (f['decorations'] = []),
    f['doors'] || (f['doors'] = []),
    f['shelves'] || (f['shelves'] = []),
    f['walls'] || (f['walls'] = []),
    f['back_walls'] || (f['back_walls'] = []),
    f['lockers'] || (f['lockers'] = []),
    f['oven'] || (f['oven'] = []),
    f['hob'] || (f['hob'] = []),
    f['sink'] || (f['sink'] = []),
    f['washer'] || (f['washer'] = {}),
    f['fixed_models'] || (f['fixed_models'] = {}),
    f['built_in_models'] || (f['built_in_models'] = {}),
    f['models'] || (f['models'] = []),
    f['variants'] || (f['variants'] = []),
    f['handles'] || (f['handles'] = {}),
    f['selected_furniture'] || (f['selected_furniture'] = {}),
    f['sizes_limit'] || (f['sizes_limit'] = constructor_settings['sizes_limit']),
    f['custom_data'] || (f['custom_data'] = {}),
    f['sections'] || (f['sections'] = {}),
    f['variables'] || (f['variables'] = {}),
    f['materials'] || (f['materials'] = {}),
    this['params'] = {
        'cabinet_tag': void 0x0 !== f['cabinet_group'] ? f['cabinet_group'] : '',
        'cabinet_group': void 0x0 !== f['cabinet_group'] ? f['cabinet_group'] : 'bottom',
        'drag_mode': void 0x0 !== f['drag_mode'] ? f['drag_mode'] : 'common',
        'cabinet_type': void 0x0 !== f['cabinet_type'] ? f['cabinet_type'] : 'common',
        'element_type': void 0x0 !== f['element_type'] ? f['element_type'] : 'module',
        'catalog_type': void 0x0 !== f['catalog_type'] ? f['catalog_type'] : '',
        'selected_variant': void 0x0 !== f['selected_variant'] ? f['selected_variant'] : void 0x0,
        'name': void 0x0 !== f['name'] ? f['name'] : void 0x0,
        'code': void 0x0 !== f['code'] ? f['code'] : void 0x0,
        'price': void 0x0 !== f['price'] ? f['price'] : void 0x0,
        'free_size': void 0x0 !== f['free_size'] ? f['free_size'] : 0x1,
        'custom_size': void 0x0 !== f['custom_size'] ? f['custom_size'] : void 0x0,
        'comments': void 0x0 !== f['comments'] ? f['comments'] : '',
        'template_id': void 0x0 !== f['template_id'] ? f['template_id'] : 0x0,
        'templates': void 0x0 !== f['templates'] ? f['templates'] : [],
        'selected_template': void 0x0 !== f['selected_template'] ? f['selected_template'] : 0x0,
        'obj_id': void 0x0 !== f['obj_id'] ? f['obj_id'] : void 0x0,
        'accessories_list': void 0x0 !== f['accessories_list'] ? f['accessories_list'] : [],
        'accessories_default': void 0x0 !== f['accessories_default'] ? f['accessories_default'] : [],
        'accessories_variant': void 0x0 !== f['accessories_variant'] ? f['accessories_variant'] : [],
        'accessories_types': void 0x0 !== f['accessories_types'] ? f['accessories_types'] : {},
        'accessories_comments': void 0x0 !== f['accessories_comments'] ? f['accessories_comments'] : [],
        'accessories_comments_string': void 0x0 !== f['accessories_comments_string'] ? f['accessories_comments_string'] : '',
        'fixed_facade_material': void 0x0 !== f['fixed_facade_material'] ? f['fixed_facade_material'] : null,
        'facade_locked': void 0x0 !== f['facade_locked'] && f['facade_locked'],
        'facade_type_locked': void 0x0 !== f['facade_type_locked'] && f['facade_type_locked'],
        'facade_mat_locked': void 0x0 !== f['facade_mat_locked'] && f['facade_mat_locked'],
        'facades_group': void 0x0 !== f['facades_group'] ? f['facades_group'] : null,
        'shelves_auto': void 0x0 !== f['shelves_auto'] ? f['shelves_auto'] : default_shelves_auto,
        'shelves_auto_count': void 0x0 !== f['shelves_auto_count'] ? f['shelves_auto_count'] : 'auto',
        'shelves_glass': void 0x0 !== f['shelves_glass'] ? f['shelves_glass'] : 0x0,
        'shelves_glass_material': void 0x0 !== f['shelves_glass_material'] ? f['shelves_glass_material'] : project_settings['selected_materials']['glass_shelves'],
        'models': void 0x0 !== f['models'] ? f['models'] : [],
        'facade': void 0x0 !== f['facade'] ? f['facade'] : void 0x0,
        'kitchen_model_id': void 0x0 !== f['kitchen_model_id'] ? f['kitchen_model_id'] : 0x0,
        'version': void 0x0 !== f['version'] ? f['version'] : 0x1,
        'sizes_limit': void 0x0 !== f['sizes_limit'] ? f['sizes_limit'] : {
            'min_width': 0x0,
            'max_width': 0x0,
            'min_height': 0x0,
            'max_height': 0x0,
            'min_depth': 0x0,
            'max_depth': 0x0
        },
        'top_tabletop_offset': void 0x0 !== f['top_tabletop_offset'] ? f['top_tabletop_offset'] : 0x0,
        'custom_data': void 0x0 !== f['custom_data'] ? f['custom_data'] : {},
        'changed_to_top': void 0x0 !== f['changed_to_top'] ? f['changed_to_top'] : 0x0,
        'auto_rotation': void 0x0 !== f['auto_rotation'] ? f['auto_rotation'] : 0x1,
        'fly_height': void 0x0 !== f['fly_height'] ? f['fly_height'] : 0x0
    },
    void 0x0 !== f['template'] && void 0x0 === f['selected_template'] && (this['params']['selected_template'] = 0x0,
    this['params']['templates']['unshift']({
        'name': '',
        'min': {
            'x': 0x0,
            'y': 0x0,
            'z': 0x0
        },
        'max': {
            'x': 0x0,
            'y': 0x0,
            'z': 0x0
        },
        'template': f['template']
    })),
    Object['defineProperty'](this['params'], 'template', {
        'get': function() {
            var l = this['templates'][this['selected_template']];
            return l ? l['template'] : void 0x0;
        },
        'set': function(l) {
            var m = this['templates'][this['selected_template']];
            m ? m['template'] = l : this['templates'][this['selected_template']] = {
                'name': '',
                'min': {
                    'x': 0x0,
                    'y': 0x0,
                    'z': 0x0
                },
                'max': {
                    'x': 0x0,
                    'y': 0x0,
                    'z': 0x0
                },
                'template': l
            };
        }
    }),
    f['resizable'] && (this['params']['resizable'] = f['resizable']),
    this['temp'] = {},
    this['object_type'] = 'cabinet',
    this['cabinet_type'] = f['cabinet_group'] || 'bottom',
    this['params']['facades_group'] = this['params']['facades_group'] || copy_object(this['cabinet_type']),
    this['params']['changed_to_top'] && (this['cabinet_type'] = 'top'),
    this['params']['facade'] || (h = project_settings['defaults']['facades'][this['params']['facades_group']],
    this['set_default_facade_params'](h)),
    this['params']['accessories_list']['length']) {
        for (let l = 0x0; l < this['params']['accessories_list']['length']; l++)
            void 0x0 === this['params']['accessories_list'][l]['c'] && (this['params']['accessories_list'][l]['c'] = 0x1);
    }
    this['params']['cabinet'] = {
        'width': void 0x0 !== f['cabinet']['width'] ? f['cabinet']['width'] : 0x258,
        'height': void 0x0 !== f['cabinet']['height'] ? parseInt(f['cabinet']['height']) : 0x2d0,
        'depth': void 0x0 !== f['cabinet']['depth'] ? f['cabinet']['depth'] : 0x258,
        'thickness': void 0x0 !== f['cabinet']['thickness'] ? f['cabinet']['thickness'] : parseInt(project_settings['corpus_thickness']),
        'thickness_back': void 0x0 !== f['cabinet']['thickness_back'] ? f['cabinet']['thickness_back'] : 0x3,
        'tsarg_width': void 0x0 !== f['cabinet']['tsarg_width'] ? f['cabinet']['tsarg_width'] : 0x64,
        'force_top_wall': void 0x0 !== f['cabinet']['force_top_wall'] ? f['cabinet']['force_top_wall'] : 0x0,
        'back_wall_offset': void 0x0 !== f['cabinet']['back_wall_offset'] ? f['cabinet']['back_wall_offset'] : 0x0,
        'width2': void 0x0 !== f['cabinet']['width2'] ? f['cabinet']['width2'] : void 0x0,
        'depth2': void 0x0 !== f['cabinet']['depth2'] ? f['cabinet']['depth2'] : void 0x0,
        'orientation': void 0x0 !== f['cabinet']['orientation'] ? f['cabinet']['orientation'] : 'right',
        'material': void 0x0 !== f['cabinet']['material'] ? f['cabinet']['material'] : void 0x0,
        'materials': void 0x0 !== f['cabinet']['materials'] ? f['cabinet']['materials'] : [],
        'back_wall_material': void 0x0 !== f['cabinet']['back_wall_material'] ? f['cabinet']['back_wall_material'] : void 0x0,
        'is_penal': f['cabinet']['is_penal'] || !0x1,
        'type': void 0x0 !== f['cabinet']['type'] ? f['cabinet']['type'] : 'common',
        'inner_radius': void 0x0 !== f['cabinet']['inner_radius'] && f['cabinet']['inner_radius'],
        'corner_right_wall_width': void 0x0 !== f['cabinet']['corner_right_wall_width'] ? f['cabinet']['corner_right_wall_width'] : void 0x0,
        'corner_straight_front_facade_material': void 0x0 !== f['cabinet']['corner_straight_front_facade_material'] ? f['cabinet']['corner_straight_front_facade_material'] : 'facade',
        'corner_straight_front_wall_width': void 0x0 !== f['cabinet']['corner_straight_front_wall_width'] ? parseInt(f['cabinet']['corner_straight_front_wall_width']) : void 0x0,
        'corner_straight_front_facade_width': void 0x0 !== f['cabinet']['corner_straight_front_facade_width'] ? parseInt(f['cabinet']['corner_straight_front_facade_width']) : 0x78,
        'corner_straight_side_connect_width': void 0x0 !== f['cabinet']['corner_straight_side_connect_width'] ? parseInt(f['cabinet']['corner_straight_side_connect_width']) : 0x0,
        'corner_straight_facade_only': void 0x0 !== f['cabinet']['corner_straight_facade_only'] ? parseInt(f['cabinet']['corner_straight_facade_only']) : 0x0,
        'corner_straight_side_back_wall_position': void 0x0 !== f['cabinet']['corner_straight_side_back_wall_position'] ? parseInt(f['cabinet']['corner_straight_side_back_wall_position']) : 0x32,
        'corner_straight_side_facade_position': void 0x0 !== f['cabinet']['corner_straight_side_facade_position'] ? parseInt(f['cabinet']['corner_straight_side_facade_position']) : 0x19f,
        'corner_straight_front_wall_active': void 0x0 !== f['cabinet']['corner_straight_front_wall_active'] ? f['cabinet']['corner_straight_front_wall_active'] : 0x1,
        'corner_straight_side_back_wall_active': void 0x0 !== f['cabinet']['corner_straight_side_back_wall_active'] ? f['cabinet']['corner_straight_side_back_wall_active'] : 0x1,
        'corner_straight_side_facade_wall_active': void 0x0 !== f['cabinet']['corner_straight_side_facade_wall_active'] ? f['cabinet']['corner_straight_side_facade_wall_active'] : 0x1,
        'corner_straight_side_facade_active': void 0x0 !== f['cabinet']['corner_straight_side_facade_active'] ? f['cabinet']['corner_straight_side_facade_active'] : 0x1,
        'end_corner_width': void 0x0 !== f['cabinet']['end_corner_width'] ? f['cabinet']['end_corner_width'] : 0xc8,
        'end_corner_depth': void 0x0 !== f['cabinet']['end_corner_depth'] ? f['cabinet']['end_corner_depth'] : 0x0,
        'end_corner_side_wall_width': f['cabinet']['end_corner_side_wall_width'] || 0x0,
        'end_corner_side_wall': void 0x0 !== f['cabinet']['end_corner_side_wall'] && f['cabinet']['end_corner_side_wall'],
        'end_radius': void 0x0 !== f['cabinet']['end_radius'] ? f['cabinet']['end_radius'] : 0x0,
        'end_side_wall': void 0x0 !== f['cabinet']['end_side_wall'] ? f['cabinet']['end_side_wall'] : 'to_wall',
        'bottom_wall': void 0x0 === f['cabinet']['bottom_wall'] || f['cabinet']['bottom_wall'],
        'top_wall': void 0x0 === f['cabinet']['top_wall'] || f['cabinet']['top_wall'],
        'left_wall': void 0x0 === f['cabinet']['left_wall'] || f['cabinet']['left_wall'],
        'right_wall': void 0x0 === f['cabinet']['right_wall'] || f['cabinet']['right_wall'],
        'back_wall': void 0x0 === f['cabinet']['back_wall'] || f['cabinet']['back_wall'],
        'front_wall': void 0x0 !== f['cabinet']['front_wall'] && f['cabinet']['front_wall'],
        'bottom_baluster': void 0x0 !== f['cabinet']['bottom_baluster'] && f['cabinet']['bottom_baluster'],
        'top_baluster_front': void 0x0 !== f['cabinet']['top_baluster_front'] && f['cabinet']['top_baluster_front'],
        'top_baluster_left': void 0x0 !== f['cabinet']['top_baluster_left'] && f['cabinet']['top_baluster_left'],
        'top_baluster_right': void 0x0 !== f['cabinet']['top_baluster_right'] && f['cabinet']['top_baluster_right'],
        'is_double': void 0x0 !== f['cabinet']['is_double'] ? f['cabinet']['is_double'] : 0x0,
        'is_triple': void 0x0 !== f['cabinet']['is_triple'] ? f['cabinet']['is_triple'] : 0x0,
        'original_height': void 0x0 !== f['cabinet']['original_height'] ? f['cabinet']['original_height'] : 0x0,
        'offset': {
            'left': void 0x0 !== f['cabinet']['offset']['left'] ? f['cabinet']['offset']['left'] : 0x0,
            'right': void 0x0 !== f['cabinet']['offset']['right'] ? f['cabinet']['offset']['right'] : 0x0,
            'back': void 0x0 !== f['cabinet']['offset']['back'] ? f['cabinet']['offset']['back'] : 0x0,
            'side': void 0x0 !== f['cabinet']['offset']['side'] ? f['cabinet']['offset']['side'] : 0x0
        },
        'include_cokol': void 0x0 !== f['cabinet']['include_cokol'] ? f['cabinet']['include_cokol'] : 0x1
    },
    this['params']['cabinet']['sides'] = {
        'left': {
            'fac_id': void 0x0 !== f['cabinet']['sides']['left']['fac_id'] ? f['cabinet']['sides']['left']['fac_id'] : this['params']['facade']['id'],
            'mat_id': void 0x0 !== f['cabinet']['sides']['left']['mat_id'] ? f['cabinet']['sides']['left']['mat_id'] : this['params']['facade']['materials']['gen'],
            'style': void 0x0 !== f['cabinet']['sides']['left']['style'] ? f['cabinet']['sides']['left']['style'] : 'full'
        },
        'right': {
            'fac_id': void 0x0 !== f['cabinet']['sides']['right']['fac_id'] ? f['cabinet']['sides']['right']['fac_id'] : this['params']['facade']['id'],
            'mat_id': void 0x0 !== f['cabinet']['sides']['right']['mat_id'] ? f['cabinet']['sides']['right']['mat_id'] : this['params']['facade']['materials']['gen'],
            'style': void 0x0 !== f['cabinet']['sides']['right']['style'] ? f['cabinet']['sides']['right']['style'] : 'full'
        }
    };
    for (let m = this['params']['cabinet']['materials']['length']; m--; )
        this['params']['cabinet']['materials'][m] = parseInt(this['params']['cabinet']['materials'][m]);
    !isNaN(this['params']['cabinet']['width']) && null !== this['params']['cabinet']['width'] || (this['params']['cabinet']['width'] = 0x1),
    !isNaN(this['params']['cabinet']['height']) && null !== this['params']['cabinet']['height'] || (this['params']['cabinet']['height'] = 0x1),
    !isNaN(this['params']['cabinet']['depth']) && null !== this['params']['cabinet']['depth'] || (this['params']['cabinet']['depth'] = 0x1),
    this['params']['cabinet']['type'],
    this['params']['cabinet']['type'],
    this['params']['cabinet']['original_height'] = this['params']['cabinet']['height'];
    var h = constructor_settings['core_v2'] ? project_settings['defaults']['tabletop'] || project_settings['selected_materials']['tabletop'] || tabletop_lib['first_item']['id'] : project_settings['selected_materials']['tabletop'], j = void 0x0 !== project_settings['bort_active'] ? to_int(project_settings['bort_active']) : 0x0, h, h;
    if (this['params']['tabletop'] = {
        'tabletop_id': void 0x0 !== f['tabletop']['tabletop_id'] ? f['tabletop']['tabletop_id'] : (constructor_settings['tabletop_v2'] ? project_settings['defaults'] : project_settings['selected_materials'])['tabletop'],
        'tabletop_variant': void 0x0 !== f['tabletop']['tabletop_variant'] ? f['tabletop']['tabletop_variant'] : constructor_settings['tabletop_v2'] ? project_settings['defaults']['tabletop_variant'] : 0x0,
        'active': void 0x0 !== f['tabletop']['active'] ? f['tabletop']['active'] : void 0x0,
        'autogen': void 0x0 === f['tabletop']['autogen'] || f['tabletop']['autogen'],
        'height': void 0x0 !== f['tabletop']['height'] ? f['tabletop']['height'] : project_settings['tabletop_thickness'],
        'depth': void 0x0 !== f['tabletop']['depth'] ? f['tabletop']['depth'] : 0x258,
        'offset': {
            'left': void 0x0 !== f['tabletop']['offset']['left'] ? f['tabletop']['offset']['left'] : 0x0,
            'right': void 0x0 !== f['tabletop']['offset']['right'] ? f['tabletop']['offset']['right'] : 0x0,
            'front': void 0x0 !== f['tabletop']['offset']['front'] ? f['tabletop']['offset']['front'] : 0x0,
            'back': void 0x0 !== f['tabletop']['offset']['back'] ? f['tabletop']['offset']['back'] : 0x0
        },
        'plints': {
            'back': void 0x0 !== f['tabletop']['plints']['back'] ? f['tabletop']['plints']['back'] : project_settings['tabletop_plints_default'],
            'right': void 0x0 !== f['tabletop']['plints']['right'] && f['tabletop']['plints']['right'],
            'left': void 0x0 !== f['tabletop']['plints']['left'] && f['tabletop']['plints']['left']
        },
        'plints_material': f['tabletop']['plints_material'],
        'plints_enabled': void 0x0 !== f['tabletop']['plints_enabled'] ? f['tabletop']['plints_enabled'] : j,
        'holes': f['tabletop']['holes'] || void 0x0,
        'visible': void 0x0 === f['tabletop']['visible'] || f['tabletop']['visible'],
        'material': void 0x0 !== f['tabletop']['material'] ? f['tabletop']['material'] : h,
        'end_corner_cut_width': void 0x0 !== f['tabletop']['end_corner_cut_width'] ? f['tabletop']['end_corner_cut_width'] : 0x0,
        'end_corner_cut_depth': void 0x0 !== f['tabletop']['end_corner_cut_depth'] ? f['tabletop']['end_corner_cut_depth'] : 0x0,
        'end_radius': void 0x0 !== f['tabletop']['end_radius'] ? f['tabletop']['end_radius'] : 0x0
    },
    0x1 == constructor_settings['tabletop_v2']) {
        if (project_settings['defaults']['tabletop'] || (project_settings['defaults']['tabletop'] = tabletop_lib['first_item']['id']),
        project_settings['defaults']['tabletop_variant']) {
            this['params']['tabletop']['tabletop_id'] || (this['params']['tabletop']['tabletop_id'] = project_settings['defaults']['tabletop']),
            this['params']['tabletop']['tabletop_variant'] || (this['params']['tabletop']['tabletop_variant'] = 0x0);
            let n = pp['libs']['tabletop']['find_item'](this['params']['tabletop']['tabletop_id']);
            n['id'] || (n = pp['libs']['tabletop']['first_item'],
            this['params']['tabletop']['tabletop_id'] = n['id']);
            var j = n['params']['variants'][this['params']['tabletop']['tabletop_variant']]['thickness'];
            this['params']['tabletop']['height'] = j;
        } else
            project_settings['defaults']['tabletop_variant'] = 0x0;
    }
    'corner' !== this['params']['cabinet']['type'] && 'corner_90' !== this['params']['cabinet']['type'] || (this['params']['tabletop']['plints']['left'] = void 0x0 !== f['tabletop']['plints']['left'] ? f['tabletop']['plints']['left'] : project_settings['tabletop_plints_default'],
    this['params']['tabletop']['plints']['right'] = void 0x0 !== f['tabletop']['plints']['right'] ? f['tabletop']['plints']['right'] : project_settings['tabletop_plints_default'],
    this['params']['tabletop']['plints']['back'] = !0x1),
    'corner_straight' === this['params']['cabinet']['type'] && ('left' == this['params']['cabinet']['orientation'] ? this['params']['tabletop']['plints']['right'] = void 0x0 !== f['tabletop']['plints']['right'] ? f['tabletop']['plints']['right'] : project_settings['tabletop_plints_default'] : this['params']['tabletop']['plints']['left'] = void 0x0 !== f['tabletop']['plints']['left'] ? f['tabletop']['plints']['left'] : project_settings['tabletop_plints_default']),
    this['params']['selected_furniture'] = {},
    void 0x0 !== accsessories_data['types'] && (Object['keys'](accsessories_data['default'])['forEach'](function(o) {
        g['params']['selected_furniture'][o] = accsessories_data['default'][o],
        null !== g['params']['selected_furniture'][o] && null !== accsessories_data['default'][o] && g['params']['accessories_types']['length'] && g['params']['accessories_types'][o] && g['params']['accessories_types'][o]['excluded']['includes'](g['params']['selected_furniture'][o]) && Object['keys'](accsessories_data['types'][o])['forEach'](p => {
            g['params']['accessories_types'][o]['excluded']['includes'](p) || (g['params']['selected_furniture'][o] = p + '');
        }
        );
    }),
    Object['keys'](f['selected_furniture'])['forEach'](function(o) {
        null !== f['selected_furniture'][o] && null !== accsessories_data['default'][o] ? (accsessories_data['items'][f['selected_furniture'][o]] ? g['params']['selected_furniture'][o] = f['selected_furniture'][o] : g['params']['selected_furniture'][o] = project_settings['selected_furniture'][o],
        g['params']['accessories_types'][o] && g['params']['accessories_types'][o]['excluded'] && g['params']['accessories_types'][o]['excluded']['includes'](g['params']['selected_furniture'][o]) && Object['keys'](accsessories_data['types'][o])['forEach'](p => {
            g['params']['accessories_types'][o]['excluded']['includes'](p) || (g['params']['selected_furniture'][o] = p + '');
        }
        )) : g['params']['selected_furniture'][o] = null;
    })),
    'top' === this['params']['cabinet_group'] && 0x1 != this['params']['top_tabletop_offset'] && (this['params']['tabletop']['offset']['left'] = 0x0,
    this['params']['tabletop']['offset']['right'] = 0x0,
    this['params']['tabletop']['offset']['front'] = 0x0,
    this['params']['tabletop']['offset']['back'] = 0x0),
    void 0x0 === this['params']['tabletop']['active'] && (this['params']['tabletop']['active'] = 'bottom' === this['params']['cabinet_group']),
    this['params']['tabletop']['active'] || (this['params']['tabletop']['height'] = 0x0),
    this['params']['cokol'] = {
        'enabled': void 0x0 === f['cokol']['enabled'] || f['cokol']['enabled'],
        'height': void 0x0 !== f['cokol']['height'] ? f['cokol']['height'] : project_settings['cokol_height'],
        'thickness': void 0x0 !== f['cokol']['thickness'] ? f['cokol']['thickness'] : 0x10,
        'material': void 0x0 !== f['cokol']['material'] ? f['cokol']['material'] : project_settings['selected_materials']['cokol'],
        'legs': void 0x0 === f['cokol']['legs'] || f['cokol']['legs'],
        'visible': void 0x0 !== f['cokol']['visible'] ? f['cokol']['visible'] : {
            'left': !0x1,
            'right': !0x1,
            'back': !0x1,
            'front': !0x1
        },
        'vis': void 0x0 !== f['cokol']['vis'] ? f['cokol']['vis'] : {},
        'lock_params': void 0x0 !== f['cokol']['lock_params'] ? f['cokol']['lock_params'] : 0x0,
        'fixed': void 0x0 !== f['cokol']['fixed'] ? f['cokol']['fixed'] : 0x0,
        'disabled': void 0x0 !== f['cokol']['disabled'] && f['cokol']['disabled'],
        'is_cokol_active': void 0x0 !== f['cokol']['is_cokol_active'] && f['cokol']['is_cokol_active'],
        'active': void 0x0 === f['cokol']['active'] || f['cokol']['active'],
        'model': (void 0x0 !== f['cokol']['model'] ? f['cokol'] : cokol_lib['get_item'](project_settings['selected_cokol_model']))['model'],
        'model_raidus': (void 0x0 !== f['cokol']['model_raidus'] ? f['cokol'] : cokol_lib['get_item'](project_settings['selected_cokol_model']))['model_raidus'],
        'height_backup': void 0x0 !== f['cokol']['height_backup'] ? f['cokol']['height_backup'] : 0x0
    },
    this['params']['cokol_top'] = {
        'enabled': void 0x0 === f['cokol_top']['enabled'] || f['cokol_top']['enabled'],
        'height': void 0x0 !== f['cokol_top']['height'] ? f['cokol_top']['height'] : cokol_top_height,
        'left': void 0x0 !== f['cokol_top']['left'] && f['cokol_top']['left'],
        'front': void 0x0 !== f['cokol_top']['front'] ? f['cokol_top']['front'] : project_settings['cokol_top_active'],
        'right': void 0x0 !== f['cokol_top']['right'] && f['cokol_top']['right'],
        'material': void 0x0 !== f['cokol_top']['material'] ? f['cokol_top']['material'] : project_settings['selected_materials']['top']['facades']
    },
    this['params']['leg'] = {
        'enabled': void 0x0 === f['leg']['enabled'] || f['leg']['enabled'],
        'material': void 0x0 !== f['leg']['material'] ? f['leg']['material'] : project_settings?.['defaults']?.['leg']?.['material']
    },
    !0x0 === project_settings['is_cokol_active'] && (this['params']['cokol']['is_cokol_active'] = !0x0),
    void 0x0 === project_settings['is_front_cokol'] && (project_settings['is_front_cokol'] = !0x0),
    project_settings['is_front_cokol'] && (this['params']['cokol']['visible']['front'] = !0x0),
    'corner_open' !== this['params']['cabinet']['type'] && 'end_corner_facade' !== this['params']['cabinet']['type'] && 'corner_open_facade' !== this['params']['cabinet']['type'] && 'end_radius_open' !== this['params']['cabinet']['type'] && 'end_radius_facade' !== this['params']['cabinet']['type'] && 'end_radius_facade_f' !== this['params']['cabinet']['type'] || ('left' === this['params']['cabinet']['orientation'] ? this['params']['cokol']['visible']['left'] = project_settings['is_front_cokol'] : this['params']['cokol']['visible']['right'] = project_settings['is_front_cokol']),
    this['params']['cornice'] = {
        'active': void 0x0 === f['cornice']['active'] || f['cornice']['active'],
        'level': void 0x0 !== f['cornice']['level'] ? f['cornice']['level'] : project_settings['cornice_level'],
        'enabled': void 0x0 === f['cornice']['enabled'] || f['cornice']['enabled'],
        'available': void 0x0 !== f['cornice']['available'] ? f['cornice']['available'] : void 0x0,
        'force': void 0x0 !== f['cornice']['force'] && f['cornice']['force'],
        'model': void 0x0 !== f['cornice']['model'] ? f['cornice']['model'] : project_settings['selected_cornice_model'],
        'visible': void 0x0 !== f['cornice']['visible'] ? f['cornice']['visible'] : {
            'left': !0x1,
            'right': !0x1,
            'back': !0x1,
            'front': !0x1
        },
        'material': void 0x0 !== f['cornice']['material'] ? f['cornice']['material'] : project_settings['selected_materials']['cornice'],
        'offset_front': void 0x0 !== f['cornice']['offset_front'] ? f['cornice']['offset_front'] : 0x0,
        'offset_back': void 0x0 !== f['cornice']['offset_back'] ? f['cornice']['offset_back'] : 0x0,
        'offset_left': void 0x0 !== f['cornice']['offset_left'] ? f['cornice']['offset_left'] : 0x0,
        'offset_right': void 0x0 !== f['cornice']['offset_right'] ? f['cornice']['offset_right'] : 0x0,
        'front_offset': cornice_lib['get_item'](project_settings['selected_cornice_model'])['params']['front_offset'],
        'side_offset': cornice_lib['get_item'](project_settings['selected_cornice_model'])['side_offset']
    },
    project_settings['custom_cornice'] && (this['params']['cornice']['model'] = project_settings['custom_cornice']['model'],
    this['params']['cornice']['corner_model'] = project_settings['custom_cornice']['corner_model'],
    this['params']['cornice']['corner_model_45'] = project_settings['custom_cornice']['corner_model_45'],
    this['params']['cornice']['radius_model'] = project_settings['custom_cornice']['radius_model']),
    'corner_open' === this['params']['cabinet']['type'] && ('left' === this['params']['cabinet']['orientation'] ? this['params']['cornice']['visible']['left'] = project_settings['cornice_active'] : this['params']['cornice']['visible']['right'] = project_settings['cornice_active']),
    'end_corner_facade' === this['params']['cabinet']['type'] && ('left' === this['params']['cabinet']['orientation'] ? this['params']['cornice']['visible']['left'] = project_settings['cornice_active'] : this['params']['cornice']['visible']['right'] = project_settings['cornice_active']),
    'corner_open_facade' === this['params']['cabinet']['type'] && ('left' === this['params']['cabinet']['orientation'] ? this['params']['cornice']['visible']['left'] = project_settings['cornice_active'] : this['params']['cornice']['visible']['right'] = project_settings['cornice_active']),
    this['params']['doors'] = f['doors'],
    this['params']['lockers'] = f['lockers'],
    this['params']['shelves'] = f['shelves'],
    this['params']['walls'] = f['walls'],
    this['params']['decorations'] = f['decorations'],
    this['params']['sections'] = f['sections'],
    this['params']['back_walls'] = f['back_walls'],
    this['params']['oven'] = {
        'active': void 0x0 !== f['oven']['active'] && f['oven']['active'],
        'model': void 0x0 !== f['oven']['model'] ? f['oven']['model'] : 0x1e8480,
        'pY': void 0x0 !== f['oven']['pY'] ? f['oven']['pY'] : void 0x0
    },
    this['params']['hob'] = {
        'active': void 0x0 !== f['hob']['active'] && f['hob']['active'],
        'model': void 0x0 !== f['hob']['model'] ? f['hob']['model'] : 0x2dc6c0
    },
    this['params']['sink'] = {
        'active': void 0x0 !== f['sink']['active'] && f['sink']['active'],
        'model': void 0x0 !== f['sink']['model'] ? f['sink']['model'] : 0x3d0900,
        'available': void 0x0 === f['available'] || f['sink']['available']
    },
    this['params']['washer'] = f['washer'],
    this['params']['fixed_models'] = f['fixed_models'],
    this['params']['built_in_models'] = f['built_in_models'],
    this['params']['variants'] = void 0x0 !== f['variants'] ? f['variants'] : [],
    Object['keys'](this['params']['sizes_limit'])['forEach'](function(o) {
        g['params']['sizes_limit'][o] = parseInt(g['params']['sizes_limit'][o]);
    });
    for (let o = this['params']['variants']['length']; o--; ) {
        var k = this['params']['variants'][o];
        k['width'] = parseInt(k['width']),
        k['height'] = parseInt(k['height']),
        k['depth'] = parseInt(k['depth']);
        let p = !0x1;
        0x0 < parseInt(this['params']['sizes_limit']['min_width']) && parseInt(k['width']) < parseInt(this['params']['sizes_limit']['min_width']) && (p = 0x1),
        0x0 < parseInt(this['params']['sizes_limit']['max_width']) && parseInt(k['width']) > parseInt(this['params']['sizes_limit']['max_width']) && (p = 0x1),
        0x0 < parseInt(this['params']['sizes_limit']['min_height']) && parseInt(k['height']) < parseInt(this['params']['sizes_limit']['min_height']) && (p = 0x1),
        0x0 < parseInt(this['params']['sizes_limit']['max_height']) && parseInt(k['height']) > parseInt(this['params']['sizes_limit']['max_height']) && (p = 0x1),
        0x0 < parseInt(this['params']['sizes_limit']['min_depth']) && parseInt(k['depth']) < parseInt(this['params']['sizes_limit']['min_depth']) && (p = 0x1),
        (p = 0x0 < parseInt(this['params']['sizes_limit']['max_depth']) && parseInt(k['depth']) > parseInt(this['params']['sizes_limit']['max_depth']) ? 0x1 : p) && (this['params']['variants']['splice'](o, 0x1),
        this['params']['selected_variant'] == o) && (this['params']['selected_variant'] = 0x0);
    }
    this['params']['variants']['length'] && void 0x0 === this['params']['selected_variant'] && (h = (h = objectFindByKey(this['params']['variants'], 'default', !0x0)) || this['params']['variants'][0x0]) && (this['params']['cabinet']['width'] = parseInt(h['width']),
    this['params']['cabinet']['height'] = parseInt(h['height']),
    this['params']['cabinet']['original_height'] = parseInt(h['height']),
    this['params']['cabinet']['depth'] = parseInt(h['depth']),
    h['corner_straight_wall_width'] && (this['params']['cabinet']['corner_straight_front_wall_width'] = h['corner_straight_wall_width']),
    h['width2'] && (this['params']['cabinet']['width2'] = parseInt(h['width2'])),
    h['depth2'] && (this['params']['cabinet']['depth2'] = parseInt(h['depth2'])),
    this['params']['name'] = h['name'],
    this['params']['code'] = h['code'],
    this['params']['price'] = h['price'],
    this['params']['selected_variant'] = this['params']['variants']['indexOf'](h)),
    this['params']['variants'] && this['params']['variants'][this['params']['selected_variant']] && this['params']['variants'][this['params']['selected_variant']]['accessories'] && (this['params']['accessories_variant'] = this['params']['variants'][this['params']['selected_variant']]['accessories']),
    0x1 === to_int(constructor_settings['shop_mode']) && (this['params']['kitchen_model_id'] = project_settings['id']),
    this['params']['id'] = void 0x0 !== f['id'] ? f['id'] : 0x0,
    'corner_straight' === this['params']['cabinet']['type'] && ('bottom' === this['params']['cabinet_group'] ? this['params']['cabinet']['corner_straight_front_wall_width'] = void 0x0 !== this['params']['cabinet']['corner_straight_front_wall_width'] ? this['params']['cabinet']['corner_straight_front_wall_width'] : 0x212 + g['params']['cabinet']['thickness'] : this['params']['cabinet']['corner_straight_front_wall_width'] = void 0x0 !== this['params']['cabinet']['corner_straight_front_wall_width'] ? this['params']['cabinet']['corner_straight_front_wall_width'] : 0x12c + g['params']['cabinet']['thickness']),
    'corner_90' !== this['params']['cabinet']['type'] || this['params']['cabinet']['width2'] || (this['params']['cabinet']['width2'] = this['params']['cabinet']['width']),
    'corner' !== this['params']['cabinet']['type'] || this['params']['cabinet']['width2'] || (this['params']['cabinet']['width2'] = this['params']['cabinet']['width']),
    void 0x0 === this['params']['cabinet']['corner_right_wall_width'] && (this['params']['cabinet']['corner_right_wall_width'] = this['params']['cabinet']['depth']),
    this['const'] = {
        'calculated_width': g['params']['cabinet']['width'] - g['params']['tabletop']['offset']['left'] - g['params']['tabletop']['offset']['right'],
        'calculated_depth': g['params']['cabinet']['depth'] - g['params']['tabletop']['offset']['back'] - g['params']['tabletop']['offset']['front'] - g['params']['cabinet']['back_wall_offset']
    },
    this['calculate_height'](),
    'bottom' === this['params']['cabinet_group'] && (this['params']['cokol_top']['left'] = !0x1,
    this['params']['cokol_top']['right'] = !0x1,
    this['params']['cokol_top']['front'] = !0x1),
    !0x0 === this['params']['sink']['active'] ? this['tabletop']['needs_rebuild'] = !0x0 : this['tabletop']['needs_rebuild'] = !0x1,
    void 0x0 !== this['params']['cabinet']['material'] && 0x0 != this['params']['cabinet']['material'] || ('bottom' === this['params']['cabinet_group'] ? this['params']['cabinet']['material'] = project_settings['selected_materials']['bottom']['corpus'] : this['params']['cabinet']['material'] = project_settings['selected_materials']['top']['corpus']),
    'object' != typeof project_settings['materials']['top']['back_wall_material'] ? (this['params']['cabinet']['back_wall_material'] = {},
    this['params']['cabinet']['back_wall_material']['key'] = 'type_0',
    this['params']['cabinet']['back_wall_material']['id'] = this['params']['cabinet']['material']) : (void 0x0 === this['params']['cabinet']['back_wall_material'] && (this['params']['cabinet']['back_wall_material'] = copy_object(project_settings['selected_materials'][this['params']['cabinet_group']]['back_wall_material'])),
    project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']] && ('facade' == project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']]['mode'] && void 0x0 === this['params']['cabinet']['back_wall_material']['id'] && (this['params']['cabinet']['back_wall_material']['id'] = project_settings['selected_materials']['facades'][project_settings['defaults']['facades'][this['params']['cabinet_group']]]['gen'][this['params']['cabinet_group']]),
    'custom_as_corpus' == project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']]['mode'] && void 0x0 === this['params']['cabinet']['back_wall_material']['id'] && (this['params']['cabinet']['back_wall_material']['id'] = project_settings['selected_materials'][this['params']['cabinet_group']]['corpus']),
    'corpus' == project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']]['mode']) && void 0x0 === this['params']['cabinet']['back_wall_material']['id'] && (this['params']['cabinet']['back_wall_material']['id'] = project_settings['selected_materials'][this['params']['cabinet_group']]['corpus']),
    void 0x0 === this['params']['cabinet']['back_wall_material']['id'] && (this['params']['cabinet']['back_wall_material']['id'] = project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']]['default'])),
    void 0x0 === this['params']['wall_panel'] && (this['params']['wall_panel'] = 'top' !== this['params']['cabinet_group']),
    'corner_straight' === this['params']['cabinet']['type'] && ('left' === this['params']['cabinet']['orientation'] ? 0x0 == this['params']['tabletop']['offset']['right'] && (this['params']['tabletop']['offset']['right'] = this['params']['tabletop']['offset']['front']) : 0x0 == this['params']['tabletop']['offset']['left'] && (this['params']['tabletop']['offset']['left'] = this['params']['tabletop']['offset']['front'])),
    'top' === this['params']['cabinet_group'] && (this['params']['cokol']['height'] = 0x0),
    this['params']['cabinet']['width'] = parseInt(this['params']['cabinet']['width']),
    this['params']['cabinet']['height'] = parseInt(this['params']['cabinet']['height']),
    this['params']['cabinet']['depth'] = parseInt(this['params']['cabinet']['depth']),
    0x1 != project_settings['handle'][g['params']['cabinet_group']]['no_handle'] ? this['params']['gola'] = to_int(!0x0 === project_settings['handle'][g['params']['cabinet_group']]['model']['is_gola']) : this['params']['gola'] = 0x0,
    'bottom' === this['params']['cabinet_group'] && !0x1 === this['params']['tabletop']['active'] && (this['params']['cabinet']['bottom_baluster'] = !0x1),
    'bottom' === this['params']['cabinet_group'] && !0x0 === this['params']['tabletop']['active'] && (this['params']['cabinet']['top_baluster_front'] = !0x1,
    this['params']['cabinet']['top_baluster_left'] = !0x1,
    this['params']['cabinet']['top_baluster_right'] = !0x1,
    this['params']['cabinet']['bottom_baluster'] = !0x1),
    this['params']['group'] = this['params']['cabinet_group'],
    this['userData']['has_doors'] = 0x0,
    this['userData']['has_lockers'] = 0x0,
    this['params']['doors'] && this['params']['doors']['length'] && (this['userData']['has_doors'] = 0x1),
    'false_facade_facade' != this['params']['cabinet']['type'] && 'false_facade_facade_b' != this['params']['cabinet']['type'] || (this['userData']['has_doors'] = 0x1),
    this['params']['lockers'] && this['params']['lockers']['length'] && (this['userData']['has_lockers'] = 0x1);
    for (let q = 0x0; q < this['params']['sections']['length']; q++)
        this['params']['sections'][q]['doors'] && this['params']['sections'][q]['doors']['length'] && (this['userData']['has_doors'] = 0x1),
        this['params']['sections'][q]['lockers'] && this['params']['sections'][q]['lockers']['length'] && (this['userData']['has_lockers'] = 0x1);
    this['userData']['has_facades'] = to_int(0x1 == this['userData']['has_doors'] || 0x1 == this['userData']['has_lockers']),
    void 0x0 === this['params']['cornice']['available'] && (this['params']['cornice']['available'] = !0x0),
    this['userData']['has_tabletop'] = 'bottom' === this['params']['cabinet_group'] && this['params']['tabletop']['active'],
    this['userData']['has_cornice'] = 0x1 == constructor_settings['cornice_available'] && 0x1 == project_settings['cornice_available'] && !0x0 === this['params']['cornice']['available'] && !this['userData']['has_tabletop'],
    this['userData']['has_tabletop_plints'] = this['userData']['has_tabletop'] && 0x1 == constructor_settings['tabletop_plints_available'],
    this['userData']['has_cokol_top'] = 'top' === this['params']['cabinet_group'] && 0x1 == constructor_settings['cokol_top_available'] && 0x1 == this['params']['cokol_top']['enabled'],
    this['userData']['has_cokol'] = 'bottom' === this['params']['cabinet_group'] && 'false_facade_tabletop' !== this['params']['cabinet']['type'],
    this['userData']['type'] = 'Cabinet',
    0x0 == this['params']['tabletop']['active'] && (this['params']['tabletop']['depth'] = 0x0),
    pp['custom']['cab_types'][this['params']['cabinet']['type']] && 'function' == typeof this['build_params_' + this['params']['cabinet']['type']] && this['build_params_' + this['params']['cabinet']['type']]();
}
,
Cabinet_new['prototype']['set_default_facade_params'] = function(f) {
    let g = this
      , h = {
        'id': f,
        'materials': {},
        'type': 'full',
        'glass': project_settings['selected_materials']['glass']
    }
      , j = project_settings['selected_materials']['facades'][f];
    Object['keys'](j)['forEach'](function(k) {
        h['materials'][k] = j[k][g['params']['facades_group']];
    }),
    this['params']['facade'] = h;
}
,
Cabinet_new['prototype']['build'] = function(f) {
    this['reset_model']();
    var g = this
      , h = this['params'];
    if (this['cabinet']['position']['y'] = 0x0,
    'conf' !== f ? g['params']['cabinet']['height'] = g['params']['cabinet']['original_height'] : g['params']['cabinet']['original_height'] = g['params']['cabinet']['height'],
    h['doors']) {
        for (let i = h['doors']['length']; i--; )
            h['doors'][i]['is_auto'] && h['doors']['splice'](i, 0x1);
    }
    if (0x0 == this['params']['cabinet']['end_corner_depth'] && (this['params']['cabinet']['end_corner_depth'] = this['params']['cabinet']['end_corner_width']),
    g['params']['cabinet']['is_double'] && facades_lib['get_defaults'](g['params']['cabinet_group'])['types_double'] && 0x0 < Object['keys'](facades_lib['get_defaults'](g['params']['cabinet_group'])['types_double'])['length'] && facades_lib['get_defaults'](g['params']['cabinet_group'])['double_offset'] && (g['params']['cabinet']['height'] -= facades_lib['get_defaults'](g['params']['cabinet_group'])['double_offset']),
    0x1 == custom_settings['wtm'] && 0x2 != g['params']['version']) {
        if (g['params']['version'] = 0x2,
        'common' == g['params']['cabinet']['type'] || 'corner_straight' == g['params']['cabinet']['type'] || 'false_facade' == g['params']['cabinet']['type'] || 'end_corner_facade' == g['params']['cabinet']['type'] || 'end_radius_facade' == g['params']['cabinet']['type'] || 'end_radius_facade_f' == g['params']['cabinet']['type'] || 'corner_open_facade' == g['params']['cabinet']['type'] ? g['params']['tabletop']['active'] ? g['params']['cabinet']['offset'] = {
            'back': g['params']['tabletop']['offset']['front'],
            'side': Math['max'](g['params']['tabletop']['offset']['left'], g['params']['tabletop']['offset']['right'])
        } : g['params']['cabinet']['offset'] = {
            'back': 0x0,
            'side': 0x0
        } : 'corner' == g['params']['cabinet']['type'] || 'corner_90' == g['params']['cabinet']['type'] ? g['params']['cabinet']['offset'] = {
            'back': g['params']['tabletop']['offset']['back'],
            'side': Math['max'](g['params']['tabletop']['offset']['left'], g['params']['tabletop']['offset']['right'])
        } : 'false_facade_tabletop' == g['params']['cabinet']['type'] ? (g['params']['cabinet']['offset'] = {
            'back': 0x0,
            'side': 0x0
        },
        g['const']['calculated_depth'] = g['params']['cabinet']['depth']) : 'false_facade_facade' == g['params']['cabinet']['type'] || 'false_facade_facade_b' == g['params']['cabinet']['type'] ? g['params']['cabinet']['offset'] = {
            'back': 0x0,
            'side': 0x0
        } : g['params']['cabinet']['offset'] = {
            'back': g['params']['tabletop']['offset']['back'],
            'side': Math['max'](g['params']['tabletop']['offset']['left'], g['params']['tabletop']['offset']['right'])
        },
        'corner' == g['params']['cabinet']['type'] || 'corner_90' == g['params']['cabinet']['type'] ? (g['const']['calculated_width'] = g['params']['cabinet']['width'] - g['params']['tabletop']['offset']['front'],
        g['const']['calculated_width2'] = g['params']['cabinet']['width2'] - g['params']['tabletop']['offset']['front'],
        g['params']['cabinet']['corner_right_wall_width'] && (g['params']['cabinet']['corner_right_wall_width'] = g['const']['calculated_depth']),
        g['params']['cabinet']['width'] = g['const']['calculated_width'],
        g['params']['cabinet']['width2'] = g['const']['calculated_width2']) : g['params']['cabinet']['width'] = g['const']['calculated_width'],
        g['params']['cabinet']['depth'] = g['const']['calculated_depth'] + g['params']['cabinet']['back_wall_offset'],
        g['const']['calculated_depth'] = g['params']['cabinet']['depth'],
        g['params']['cabinet']['width2'] && (g['params']['cabinet']['width2'] = g['const']['calculated_width2']),
        'corner' == g['params']['cabinet']['type'] || 'corner_90' == g['params']['cabinet']['type']) {
            for (let j = 0x0; j < g['params']['variants']['length']; j++)
                g['params']['variants'][j]['width'] = g['params']['variants'][j]['width'] - g['params']['tabletop']['offset']['front'],
                g['params']['variants'][j]['depth'] = g['params']['variants'][j]['depth'] - g['params']['tabletop']['offset']['front'];
        } else {
            for (let k = 0x0; k < g['params']['variants']['length']; k++)
                g['params']['variants'][k]['width'] = g['params']['variants'][k]['width'] - g['params']['tabletop']['offset']['left'] - g['params']['tabletop']['offset']['right'],
                g['params']['variants'][k]['depth'] = g['params']['variants'][k]['depth'] - g['params']['tabletop']['offset']['back'] - g['params']['tabletop']['offset']['front'];
        }
    }
    0x1 == g['params']['version'] && (g['const']['calculated_width'] = g['params']['cabinet']['width'] - g['params']['tabletop']['offset']['left'] - g['params']['tabletop']['offset']['right'],
    g['params']['cabinet']['width2'] && (g['const']['calculated_width2'] = g['params']['cabinet']['width2'] - g['params']['tabletop']['offset']['left'] - g['params']['tabletop']['offset']['right']),
    g['const']['calculated_depth'] = g['params']['cabinet']['depth'] - g['params']['tabletop']['offset']['back'] - g['params']['tabletop']['offset']['front'] - g['params']['cabinet']['back_wall_offset'],
    'bottom' === this['params']['cabinet_group']) && 'corner_90' === this['params']['cabinet']['type'] && (this['const']['calculated_width'] -= g['params']['tabletop']['offset']['back']),
    0x2 == g['params']['version'] && (g['const']['calculated_width'] = g['params']['cabinet']['width'],
    g['params']['cabinet']['width2'] && (g['const']['calculated_width2'] = g['params']['cabinet']['width2']),
    g['const']['calculated_depth'] = g['params']['cabinet']['depth'],
    'corner_straight' === this['params']['cabinet']['type']) && ('bottom' === this['params']['cabinet_group'] ? this['params']['cabinet']['corner_straight_front_wall_width'] = void 0x0 !== this['params']['cabinet']['corner_straight_front_wall_width'] ? this['params']['cabinet']['corner_straight_front_wall_width'] : 0x1f9 - g['params']['cabinet']['offset']['side'] : this['params']['cabinet']['corner_straight_front_wall_width'] = void 0x0 !== this['params']['cabinet']['corner_straight_front_wall_width'] ? this['params']['cabinet']['corner_straight_front_wall_width'] : 0x12c + g['params']['cabinet']['thickness']),
    this['params']['cabinet']['include_cokol'],
    void 0x0 !== accsessories_data['types'] && (this['selected_furniture'] = this['params']['selected_furniture']),
    this['build_cabinet'](),
    g['build_sections'](),
    g['build_cokol'](),
    g['build_cokol_top'](),
    g['build_tabletop'](),
    g['build_doors'](),
    g['build_lockers'](),
    g['build_shelves'](),
    g['build_hob'](),
    g['build_oven'](),
    g['build_washer'](!0x0),
    g['build_cornice'](),
    g['build_decorations'](),
    g['build_lights'](),
    g['build_fixed_models'](),
    g['build_models'](),
    this['build_comments'](),
    'common' === h['cabinet']['type'] && g['build_positions_common'](),
    'corner' === h['cabinet']['type'] && g['build_corner_positions'](),
    'corner_90' === h['cabinet']['type'] && g['build_corner_90_positions'](),
    'corner_straight' === h['cabinet']['type'] && g['build_positions_corner_straight'](),
    'corner_open' === h['cabinet']['type'] && g['build_positions_corner_open'](),
    'corner_open_facade' === h['cabinet']['type'] && g['build_positions_corner_open_facade'](),
    'end_corner_facade' === h['cabinet']['type'] && g['build_positions_end_corner_facade'](),
    'end_radius_facade' === h['cabinet']['type'] && g['build_positions_end_radius_facade'](),
    'end_radius_facade_f' === h['cabinet']['type'] && g['build_positions_common'](),
    'end_radius_open' === h['cabinet']['type'] && g['build_positions_end_radius_open'](),
    'false_facade' === h['cabinet']['type'] && g['build_positions_common'](),
    'false_facade_tabletop' === h['cabinet']['type'] && g['build_positions_false_facade_tabletop'](),
    'false_facade_facade' === h['cabinet']['type'] && g['build_positions_false_facade_facade'](),
    'false_facade_facade_b' === h['cabinet']['type'] && g['build_positions_false_facade_facade'](),
    pp['custom']['cab_types'][h['cabinet']['type']] && 'function' == typeof this['build_positions_' + h['cabinet']['type']] && this['build_positions_' + h['cabinet']['type']](),
    0x1 === this['params']['gola'] && 0x1 != project_settings['handle'][this['params']['cabinet_group']]['no_handle'] && this['build_gola'](),
    0x1 !== f && (this['build_sizes'](),
    'edges' === global_options['mode']) && g['edges_mode'](),
    g['built_in_models']['position']['y'] = this['params']['cokol']['height'] / units,
    g['params']['fly_height'] && (this['position']['y'] = g['params']['fly_height'] / units),
    this['build_size_box'](),
    'function' == typeof cabinet_build_callback && cabinet_build_callback(this),
    global_update(),
    this['calculate_distances'](),
    this['build_from_wall_sizes'](),
    get_total_price_test(),
    this['resizable'] && this['resizable']['updateControls']();
}
,
Cabinet_new['prototype']['build_cabinet'] = function() {
    this['reset_model'](this['cabinet']);
    var e = this['params']
      , f = this;
    'common' === e['cabinet']['type'] && f['build_common'](),
    'corner' === e['cabinet']['type'] && f['build_corner'](),
    'corner_90' === e['cabinet']['type'] && f['build_corner_90'](),
    'corner_straight' === e['cabinet']['type'] && f['build_corner_straight'](),
    'corner_open' === e['cabinet']['type'] && f['build_corner_open'](),
    'corner_open_facade' === e['cabinet']['type'] && f['build_corner_open_facade'](),
    'end_corner_facade' === e['cabinet']['type'] && f['build_end_corner_facade'](),
    'end_radius_facade' === e['cabinet']['type'] && f['build_end_radius_facade'](),
    'end_radius_facade_f' === e['cabinet']['type'] && f['build_end_radius_facade_f'](),
    'end_radius_open' === e['cabinet']['type'] && f['build_end_radius_open'](),
    'false_facade' === e['cabinet']['type'] && f['build_false_facade'](),
    'false_facade_facade' === e['cabinet']['type'] && f['build_false_facade_facade'](),
    'false_facade_facade_b' === e['cabinet']['type'] && f['build_false_facade_facade'](),
    pp['custom']['cab_types'][e['cabinet']['type']] && 'function' == typeof this['build_cabinet_' + e['cabinet']['type']] && this['build_cabinet_' + e['cabinet']['type']]();
}
,
Cabinet_new['prototype']['build_sections'] = function() {
    'common' === this['params']['cabinet']['type'] && this['build_sections_common'](),
    'end_corner_facade' === this['params']['cabinet']['type'] && this['build_sections_end_corner_facade'](),
    'corner_open' === this['params']['cabinet']['type'] && this['build_sections_corner_open'](),
    'corner_open_facade' === this['params']['cabinet']['type'] && this['build_sections_corner_open_facade'](),
    'end_radius_facade' === this['params']['cabinet']['type'] && this['build_sections_end_radius_facade'](),
    'end_radius_facade_f' === this['params']['cabinet']['type'] && this['build_sections_end_radius_facade'](),
    'end_radius_open' === this['params']['cabinet']['type'] && this['build_sections_end_radius_open'](),
    'corner_straight' === this['params']['cabinet']['type'] && this['build_sections_corner_straight'](),
    'corner' === this['params']['cabinet']['type'] && this['build_sections_corner'](),
    'corner_90' === this['params']['cabinet']['type'] && this['build_sections_corner_90']();
}
,
Cabinet_new['prototype']['build_shelves_auto'] = function(f) {
    var g = this;
    let h = 0x0;
    var j = f['height']
      , k = f['params'];
    k['shelves'] = [],
    k['shelves_ac'] = 0x0;
    let l = null;
    if (-0x1 < f['obj_to_add']['name']['indexOf']('section_') && (l = f['obj_to_add']),
    'auto' == k['shelves_auto_count']) {
        let u = 0x0;
        {
            var f = shelves_rules[this['params']['cabinet_type']]
              , m = Object['keys'](f);
            m['sort'](function(w, x) {
                return w - x;
            });
            let v = m[0x0];
            for (let w = 0x0; w < m['length']; w++)
                j >= m[w] && (v = m[w]);
            if (0x0 < f[v]) {
                if ('bottom' === k['group'] && (u = 0x1),
                k['doors'] && k['doors']['length']) {
                    for (let x = 0x0; x < k['doors']['length']; x++)
                        'simple_top' != k['doors'][x]['type'] && 'double_top' != k['doors'][x]['type'] || (u = 0x1);
                }
                h = 0x1 == u ? 0x1 : f[v];
            } else
                h = f[v];
        }
    } else
        h = l ? parseInt(k['shelves_auto_count']) : parseInt(this['params']['shelves_auto_count']);
    this['shelves_auto_count'] = h,
    l && (l['shelves_auto_count'] = h);
    var p = 0x64 / (h + 0x1);
    let q = p;
    for (let y = 0x0; y < h; y++)
        k['shelves']['push']({
            'starting_point_y': q + '%'
        }),
        q += p;
}
,
Cabinet_new['prototype']['build_cokol'] = function() {
    if (!constructor_settings['core_v2']) {
        this['reset_model'](this['cokol']);
        var e = this['params'];
        if ('bottom' === this['params']['cabinet_group'] && !project_settings['cokol_disabled'] && !this['params']['cokol']['disabled'] && 0x0 != this['params']['cokol']['enabled']) {
            if (0x0 == this['params']['cokol']['active'])
                this['params']['cokol']['height'] = 0x0;
            else {
                if ('common' === this['params']['cabinet']['type'] && this['build_cokol_common'](),
                'false_facade' === this['params']['cabinet']['type'] && this['build_cokol_common'](),
                'false_facade_facade' === this['params']['cabinet']['type'] && this['build_cokol_false_facade_facade'](),
                'false_facade_facade_b' === this['params']['cabinet']['type'] && this['build_cokol_false_facade_facade'](),
                'corner' === this['params']['cabinet']['type'] && this['build_cokol_corner'](),
                'corner_90' === this['params']['cabinet']['type'] && this['build_cokol_corner_90'](),
                'corner_straight' === this['params']['cabinet']['type'] && this['build_cokol_corner_straight'](),
                'corner_open' === this['params']['cabinet']['type'] && this['build_cokol_corner_open'](),
                'corner_open_facade' === this['params']['cabinet']['type'] && this['build_cokol_corner_open_facade'](),
                'end_corner_facade' === this['params']['cabinet']['type'] && this['build_cokol_end_corner_facade'](),
                'end_radius_facade' === this['params']['cabinet']['type'] && this['build_cokol_end_radius_facade'](),
                'end_radius_facade_f' === this['params']['cabinet']['type'] && this['build_cokol_end_radius_facade'](),
                'end_radius_open' === this['params']['cabinet']['type'] && this['build_cokol_end_radius_open'](),
                pp['custom']['cab_types'][e['cabinet']['type']] && 'function' == typeof this['build_cokol_' + e['cabinet']['type']] && this['build_cokol_' + e['cabinet']['type']](),
                0x0 != constructor_settings['shop_mode'] && !0x1 === project_settings['is_cokol_active']) {
                    for (var f = 0x0; f < this['cokol']['children']['length']; f++)
                        'CabinetCokol' === this['cokol']['children'][f]['temp_type'] && (this['cokol']['children'][f]['visible'] = !0x1),
                        this['cokol']['children'][f]['temp_type'];
                }
                this['set_cabinet_positions']();
            }
        }
    }
}
,
Cabinet_new['prototype']['set_cokol_active'] = function(f) {
    let g = this;
    var h = {
        'front': g['params']['cokol']['visible']['front'],
        'left': g['params']['cokol']['visible']['left'],
        'right': g['params']['cokol']['visible']['right'],
        'back': g['params']['cokol']['visible']['back']
    };
    Object['keys'](f)['forEach'](function(i) {
        g['params']['cokol']['visible'][i] = f[i];
    }),
    this['build_cokol'](),
    get_total_price_test(),
    global_update();
}
,
Cabinet_new['prototype']['change_cokol'] = function(e) {
    this['params']['cokol']['material'] = e,
    this['build_cokol'](),
    get_total_price_test(),
    global_update();
}
,
Cabinet_new['prototype']['change_cokol_legs'] = function(e) {
    this['params']['cokol']['is_cokol_active'] = e,
    this['build_cokol'](),
    get_total_price_test(),
    global_update();
}
,
Cabinet_new['prototype']['change_cokol_disabled'] = function(e) {
    this['params']['cokol']['disabled'] = e,
    this['build_cokol'](),
    get_total_price_test(),
    global_update();
}
,
Cabinet_new['prototype']['build_cokol_top'] = function() {
    if (this['reset_model'](this['cokol_top']),
    0x0 != this['params']['cokol_top']['enabled']) {
        var f = this, g = this['params'], j, j, j, j, j, j, k, j, k, j, j, k, j, k, j, q, u, v, w, x, y, z, A, B, B, x, q, w, k, j, u;
        if ('top' === this['params']['cabinet_group'] && (pp['custom']['cab_types'][g['cabinet']['type']] && 'function' == typeof this['build_cokol_top_' + g['cabinet']['type']] && this['build_cokol_top_' + g['cabinet']['type']](),
        constructor_settings['cokol_top_available']) && 0x1 == constructor_settings['cokol_top_available']) {
            if ('common' !== this['params']['cabinet']['type'] && 'false_facade' !== this['params']['cabinet']['type'] || (g['cokol_top']['front'] && (j = new CabinetCokolTop({
                'width': g['cabinet']['width'],
                'height': g['cokol_top']['height'],
                'thickness': g['cabinet']['thickness'],
                'name': 'cokol_top_front',
                'material': f['params']['cokol_top']['material'],
                'pZ': g['cabinet']['depth'] / units / 0x2 - g['cabinet']['thickness'] / units / 0x2
            }),
            f['cokol_top']['add'](j)),
            g['cokol_top']['left'] && (j = new CabinetCokolTop({
                'width': g['cabinet']['depth'] - g['cabinet']['thickness'],
                'height': g['cokol_top']['height'],
                'thickness': g['cabinet']['thickness'],
                'rY': -Math['PI'] / 0x2,
                'pX': -g['cabinet']['width'] / units / 0x2 + g['cabinet']['thickness'] / units / 0x2,
                'pZ': -g['cabinet']['thickness'] / units / 0x2,
                'name': 'cokol_top_left',
                'material': f['params']['cokol_top']['material']
            }),
            f['cokol_top']['add'](j)),
            g['cokol_top']['right'] && (j = new CabinetCokolTop({
                'width': g['cabinet']['depth'] - g['cabinet']['thickness'],
                'height': g['cokol_top']['height'],
                'thickness': g['cabinet']['thickness'],
                'rY': Math['PI'] / 0x2,
                'pX': g['cabinet']['width'] / units / 0x2 - g['cabinet']['thickness'] / units / 0x2,
                'pZ': -g['cabinet']['thickness'] / units / 0x2,
                'name': 'cokol_top_right',
                'material': f['params']['cokol_top']['material']
            }),
            f['cokol_top']['add'](j))),
            'corner_straight' === this['params']['cabinet']['type']) {
                if (g['cokol_top']['front']) {
                    let C = 0x0;
                    var j = f['const']['calculated_width'] - f['params']['cabinet']['corner_straight_front_wall_width'] + g['cabinet']['thickness']
                      , j = (C = 'left' == g['cabinet']['orientation'] ? -f['const']['calculated_width'] / units / 0x2 + j / units / 0x2 : f['const']['calculated_width'] / units / 0x2 - j / units / 0x2,
                    new CabinetCokolTop({
                        'width': j,
                        'height': g['cokol_top']['height'],
                        'thickness': g['cabinet']['thickness'],
                        'name': 'cokol_top_front',
                        'material': f['params']['cokol_top']['material'],
                        'pZ': g['cabinet']['depth'] / units / 0x2 - g['cabinet']['thickness'] / units / 0x2,
                        'pX': C
                    }));
                    f['cokol_top']['add'](j);
                }
                'left' == g['cabinet']['orientation'] ? g['cokol_top']['left'] && (j = new CabinetCokolTop({
                    'width': g['cabinet']['depth'] - g['cabinet']['thickness'],
                    'height': g['cokol_top']['height'],
                    'thickness': g['cabinet']['thickness'],
                    'rY': -Math['PI'] / 0x2,
                    'pX': -g['cabinet']['width'] / units / 0x2 + g['cabinet']['thickness'] / units / 0x2,
                    'pZ': -g['cabinet']['thickness'] / units / 0x2,
                    'name': 'cokol_top_left',
                    'material': f['params']['cokol_top']['material']
                }),
                f['cokol_top']['add'](j)) : g['cokol_top']['right'] && (j = new CabinetCokolTop({
                    'width': g['cabinet']['depth'] - g['cabinet']['thickness'],
                    'height': g['cokol_top']['height'],
                    'thickness': g['cabinet']['thickness'],
                    'rY': Math['PI'] / 0x2,
                    'pX': g['cabinet']['width'] / units / 0x2 - g['cabinet']['thickness'] / units / 0x2,
                    'pZ': -g['cabinet']['thickness'] / units / 0x2,
                    'name': 'cokol_top_right',
                    'material': f['params']['cokol_top']['material']
                }),
                f['cokol_top']['add'](j));
            }
            if ('corner' !== this['params']['cabinet']['type'] || f['params']['cabinet']['inner_radius'] || (g['cokol_top']['front'] && (j = void 0x0 !== f['params']['cabinet']['corner_right_wall_width'] ? f['params']['cabinet']['corner_right_wall_width'] : f['const']['calculated_depth'],
            k = g['cabinet']['width'] - g['cabinet']['depth'],
            j = g['cabinet']['width2'] - j,
            k = get_hypo(k, j),
            j = f['const']['calculated_width2'] - f['const']['calculated_depth'] - f['params']['cabinet']['thickness'],
            j = new CabinetCokolTop({
                'width': k + g['cabinet']['thickness'] / 0x2,
                'height': g['cokol_top']['height'],
                'thickness': g['cabinet']['thickness'],
                'name': 'cokol_top_front',
                'rY': -Math['asin'](j / k),
                'material': f['params']['cokol_top']['material'],
                'pZ': 0xe,
                'pX': -0xe
            }),
            f['cokol_top']['add'](j)),
            g['cokol_top']['left'] && (k = new CabinetCokolTop({
                'width': g['cabinet']['depth'],
                'height': g['cokol_top']['height'],
                'thickness': g['cabinet']['thickness'],
                'rY': -Math['PI'] / 0x2,
                'pX': -g['cabinet']['width'] / units / 0x2 + g['cabinet']['thickness'] / units / 0x2,
                'pZ': -g['cabinet']['width2'] / units / 0x2 + g['cabinet']['depth'] / units / 0x2,
                'name': 'cokol_top_left',
                'material': f['params']['cokol_top']['material']
            }),
            f['cokol_top']['add'](k)),
            g['cokol_top']['right'] && (j = new CabinetCokolTop({
                'width': g['cabinet']['depth'],
                'height': g['cokol_top']['height'],
                'thickness': g['cabinet']['thickness'],
                'rY': 0x0,
                'pX': g['cabinet']['width'] / units / 0x2 - g['cabinet']['depth'] / units / 0x2,
                'pZ': g['cabinet']['width2'] / units / 0x2 - g['cabinet']['thickness'] / units / 0x2,
                'name': 'cokol_top_right',
                'material': f['params']['cokol_top']['material']
            }),
            f['cokol_top']['add'](j))),
            'corner' === this['params']['cabinet']['type'] && f['params']['cabinet']['inner_radius'] && (g['cokol_top']['front'] && (k = f['const']['calculated_width'] / units,
            j = f['const']['calculated_depth'] / units,
            q = f['params']['cokol_top']['height'] / units,
            u = f['params']['cabinet']['thickness'] / units,
            v = f['params']['cokol_top']['material'],
            w = void 0x0 !== f['params']['cabinet']['corner_right_wall_width'] ? (f['params']['cabinet']['corner_right_wall_width'] - f['params']['cabinet']['back_wall_offset']) / units : f['const']['calculated_depth'] / units,
            x = Math['sqrt'](Math['pow']((k - w - u) * units, 0x2) + Math['pow']((k - j - u) * units, 0x2)),
            y = f['const']['calculated_width'] - f['const']['calculated_depth'] - f['params']['cabinet']['thickness'],
            z = new THREE['Shape'](),
            B = f['params']['cabinet']['width'] - f['params']['cabinet']['depth'] + (A = 0x10),
            z['moveTo'](-B / units / 0x2, -B / units / 0x2),
            z['lineTo'](-B / units / 0x2, (B / 0x2 - (B - 0x10)) / units),
            z['quadraticCurveTo'](B / units / 0x2 - 0x10 / units, (B / 0x2 - (B - 0x10)) / units, B / units / 0x2 - 0x10 / units, B / units / 0x2),
            z['lineTo'](B / units / 0x2, B / units / 0x2),
            z['quadraticCurveTo'](B / units / 0x2, -B / units / 0x2, -B / units / 0x2, -B / units / 0x2),
            B = new Object_wall({
                'width': x / units + 0x2 * u + u / 0x2 + u / 0x2,
                'height': q,
                'thickness': q,
                'pX': -k / 0x2 + (k - w) / 0x2 + u / 0x2,
                'pZ': k / 0x2 - (k - j) / 0x2 - u / 0x2,
                'pY': 0x0,
                'rX': Math['PI'] / 0x2,
                'material': v,
                'name': 'cokol_front',
                'shape': z
            }),
            f['cokol_top']['add'](B)),
            g['cokol_top']['left'] && (x = new CabinetCokolTop({
                'width': g['cabinet']['depth'],
                'height': g['cokol_top']['height'],
                'thickness': g['cabinet']['thickness'],
                'rY': -Math['PI'] / 0x2,
                'pX': -g['cabinet']['width'] / units / 0x2 + g['cabinet']['thickness'] / units / 0x2,
                'pZ': -g['cabinet']['width'] / units / 0x2 + g['cabinet']['depth'] / units / 0x2,
                'name': 'cokol_top_left',
                'material': f['params']['cokol_top']['material']
            }),
            f['cokol_top']['add'](x)),
            g['cokol_top']['right']) && (q = new CabinetCokolTop({
                'width': g['cabinet']['depth'],
                'height': g['cokol_top']['height'],
                'thickness': g['cabinet']['thickness'],
                'rY': 0x0,
                'pX': g['cabinet']['width'] / units / 0x2 - g['cabinet']['depth'] / units / 0x2,
                'pZ': g['cabinet']['width'] / units / 0x2 - g['cabinet']['thickness'] / units / 0x2,
                'name': 'cokol_top_right',
                'material': f['params']['cokol_top']['material']
            }),
            f['cokol_top']['add'](q)),
            'corner_90' === this['params']['cabinet']['type'] && (g['cokol_top']['front'] && (w = new CabinetCokolTop({
                'width': g['cabinet']['depth'] + g['cabinet']['thickness'],
                'height': g['cokol_top']['height'],
                'thickness': g['cabinet']['thickness'],
                'name': 'cokol_top_front',
                'pX': -g['cabinet']['width'] / units / 0x2 + g['cabinet']['depth'] / units / 0x2 + g['cabinet']['thickness'] / units / 0x2,
                'pZ': -g['cabinet']['thickness'] / units / 0x2,
                'material': f['params']['cokol_top']['material']
            }),
            f['cokol_top']['add'](w),
            k = new CabinetCokolTop({
                'width': g['cabinet']['depth'],
                'height': g['cokol_top']['height'],
                'thickness': g['cabinet']['thickness'],
                'name': 'cokol_top_front',
                'rY': -Math['PI'] / 0x2,
                'pX': g['cabinet']['thickness'] / units / 0x2,
                'pZ': g['cabinet']['width'] / units / 0x2 - g['cabinet']['depth'] / units / 0x2,
                'material': f['params']['cokol_top']['material']
            }),
            f['cokol_top']['add'](k)),
            g['cokol_top']['left'] && (j = new CabinetCokolTop({
                'width': g['cabinet']['depth'] - g['cabinet']['thickness'],
                'height': g['cokol_top']['height'],
                'thickness': g['cabinet']['thickness'],
                'rY': -Math['PI'] / 0x2,
                'pZ': -g['cabinet']['width'] / units / 0x2 + g['cabinet']['depth'] / units / 0x2 - g['cabinet']['thickness'] / units / 0x2,
                'pX': -g['cabinet']['width'] / units / 0x2 + g['cabinet']['thickness'] / units / 0x2,
                'name': 'cokol_top_left',
                'material': f['params']['cokol_top']['material']
            }),
            f['cokol_top']['add'](j)),
            g['cokol_top']['right']) && (u = new CabinetCokolTop({
                'width': g['cabinet']['depth'] - g['cabinet']['thickness'],
                'height': g['cokol_top']['height'],
                'thickness': g['cabinet']['thickness'],
                'rY': 0x0,
                'pX': g['cabinet']['width'] / units / 0x2 - g['cabinet']['depth'] / units / 0x2 - g['cabinet']['thickness'] / units / 0x2,
                'pZ': g['cabinet']['width'] / units / 0x2 - g['cabinet']['thickness'] / units / 0x2,
                'name': 'cokol_top_right',
                'material': f['params']['cokol_top']['material']
            }),
            f['cokol_top']['add'](u)),
            'corner_open' === this['params']['cabinet']['type'] && g['cokol_top']['front']) {
                var v = f['params']['cabinet']['end_corner_width'] - f['params']['cabinet']['thickness']
                  , v = f['params']['cabinet']['end_corner_width']
                  , z = get_hypo(v, v);
                let D = g['cabinet']['width'] / units / 0x2 - (g['cabinet']['width'] - v) / units / 0x2
                  , E = -g['cabinet']['width'] / units / 0x2 + g['cabinet']['thickness'] / units / 0x2
                  , F = -Math['PI'] / 0x2
                  , G = -g['cabinet']['width'] / units / 0x2 + v / units / 0x2 + f['params']['cabinet']['thickness'] / units / 0x3
                  , H = -Math['PI'] / 0x4;
                'right' == g['cabinet']['orientation'] && (D *= -0x1,
                E *= -0x1,
                F *= -0x1,
                G *= -0x1,
                H *= -0x1);
                var B = new CabinetCokolTop({
                    'width': g['cabinet']['width'] - v,
                    'height': g['cokol_top']['height'],
                    'thickness': g['cabinet']['thickness'],
                    'name': 'cokol_top_front',
                    'pX': D,
                    'pZ': g['cabinet']['depth'] / units / 0x2 - g['cabinet']['thickness'] / units / 0x2,
                    'material': f['params']['cokol_top']['material']
                })
                  , x = (f['cokol_top']['add'](B),
                new CabinetCokolTop({
                    'width': g['cabinet']['depth'] - v,
                    'height': g['cokol_top']['height'],
                    'thickness': g['cabinet']['thickness'],
                    'rY': F,
                    'name': 'cokol_top_front',
                    'pX': E,
                    'pZ': -g['cabinet']['depth'] / units / 0x2 + g['cabinet']['depth'] / units / 0x2 - v / units / 0x2,
                    'material': f['params']['cokol_top']['material']
                }))
                  , q = (f['cokol_top']['add'](x),
                new CabinetCokolTop({
                    'width': z,
                    'height': g['cokol_top']['height'],
                    'thickness': g['cabinet']['thickness'],
                    'rY': H,
                    'pX': G,
                    'pZ': g['cabinet']['depth'] / units / 0x2 - v / units / 0x2 - f['params']['cabinet']['thickness'] / units / 0x3,
                    'name': 'cokol_top_front',
                    'material': f['params']['cokol_top']['material']
                }));
                f['cokol_top']['add'](q);
            }
            if ('corner_open_facade' === this['params']['cabinet']['type'] && g['cokol_top']['front']) {
                var w = 0xaa - f['params']['cabinet']['thickness']
                  , k = get_hypo(w, w);
                let I = g['cabinet']['width'] / units / 0x2 - (g['cabinet']['width'] - w) / units / 0x2
                  , J = -g['cabinet']['width'] / units / 0x2 + g['cabinet']['thickness'] / units / 0x2
                  , K = -Math['PI'] / 0x2
                  , L = -g['cabinet']['width'] / units / 0x2 + k / units / 0x2 - f['params']['cabinet']['thickness'] / units * 0x2
                  , N = -Math['PI'] / 0x4;
                'right' == g['cabinet']['orientation'] && (I *= -0x1,
                J *= -0x1,
                K *= -0x1,
                L *= -0x1,
                N *= -0x1);
                var j = new CabinetCokolTop({
                    'width': g['cabinet']['width'] - w,
                    'height': g['cokol_top']['height'],
                    'thickness': g['cabinet']['thickness'],
                    'name': 'cokol_top_front',
                    'pX': I,
                    'pZ': g['cabinet']['depth'] / units / 0x2 - g['cabinet']['thickness'] / units / 0x2,
                    'material': f['params']['cokol_top']['material']
                })
                  , u = (f['cokol_top']['add'](j),
                new CabinetCokolTop({
                    'width': g['cabinet']['depth'] - w,
                    'height': g['cokol_top']['height'],
                    'thickness': g['cabinet']['thickness'],
                    'rY': K,
                    'name': 'cokol_top_front',
                    'pX': J,
                    'pZ': -g['cabinet']['depth'] / units / 0x2 + g['cabinet']['depth'] / units / 0x2 - w / units / 0x2,
                    'material': f['params']['cokol_top']['material']
                }))
                  , B = (f['cokol_top']['add'](u),
                new CabinetCokolTop({
                    'width': k,
                    'height': g['cokol_top']['height'],
                    'thickness': g['cabinet']['thickness'],
                    'rY': N,
                    'pX': L,
                    'pZ': g['cabinet']['depth'] / units / 0x2 - k / units / 0x2 + f['params']['cabinet']['thickness'] / units * 0x2,
                    'name': 'cokol_top_front',
                    'material': f['params']['cokol_top']['material']
                }));
                f['cokol_top']['add'](B);
            }
            if ('end_corner_facade' === this['params']['cabinet']['type'] && g['cokol_top']['front']) {
                var x = f['const']['calculated_width']
                  , z = f['const']['calculated_depth']
                  , v = f['params']['cokol']['thickness']
                  , q = Math['max'](Math['abs'](f['params']['cabinet']['depth'] - f['params']['cabinet']['width'] - f['params']['cabinet']['thickness']), 0x64)
                  , j = Math['sqrt'](Math['pow'](z - q, 0x2) + Math['pow'](x, 0x2)) - v
                  , w = Math['sqrt'](Math['pow'](j / 0x2, 0x2) - Math['pow']((x - v) / 0x2, 0x2));
                let O = Math['atan']((z - q) / (x - 0x2 * v));
                'left' == f['params']['cabinet']['orientation'] && (O *= -0x1);
                var u = new CabinetCokolTop({
                    'width': j + v,
                    'height': g['cokol_top']['height'],
                    'thickness': v,
                    'pZ': z / units / 0x2 - w / units - f['params']['cabinet']['thickness'] / units,
                    'material': f['params']['cokol_top']['material'],
                    'name': 'cokol_top_front',
                    'rY': O
                });
                f['cokol_top']['add'](u);
                let P = -g['cabinet']['width'] / units / 0x2 + g['cabinet']['thickness'] / units / 0x2
                  , Q = -Math['PI'] / 0x2;
                'right' == f['params']['cabinet']['orientation'] && (P *= -0x1,
                Q *= -0x1);
                var k = new CabinetCokolTop({
                    'width': q - g['cabinet']['thickness'],
                    'height': g['cokol_top']['height'],
                    'thickness': g['cabinet']['thickness'],
                    'rY': Q,
                    'pX': P,
                    'pZ': -z / units / 0x2 + (q - g['cabinet']['thickness']) / units / 0x2,
                    'name': 'cokol_top_left',
                    'material': f['params']['cokol_top']['material']
                });
                f['cokol_top']['add'](k);
            }
            if (('end_radius_facade' === this['params']['cabinet']['type'] || 'end_radius_facade_f' === this['params']['cabinet']['type']) && g['cokol_top']['front']) {
                let R = 0x0;
                'left' != f['params']['cabinet']['orientation'] && (R = Math['PI'] / 0x2);
                var B = new CabinetCokolTop({
                    'width': f['const']['calculated_width'],
                    'height': f['params']['cokol_top']['height'],
                    'thickness': f['params']['cokol_top']['height'],
                    'rY': R,
                    'orientation': f['params']['cabinet']['orientation'],
                    'material': f['params']['cokol_top']['material'],
                    'name': 'cokol_front',
                    'radius': !0x0
                });
                f['cokol_top']['add'](B);
            }
            if ('end_radius_open' === this['params']['cabinet']['type'] && g['cokol_top']['front']) {
                let S = 0x0;
                'left' != f['params']['cabinet']['orientation'] && (S = Math['PI'] / 0x2);
                var x = new CabinetCokolTop({
                    'width': f['const']['calculated_width'],
                    'height': f['params']['cokol_top']['height'],
                    'thickness': f['params']['cokol_top']['height'],
                    'rY': S,
                    'orientation': f['params']['cabinet']['orientation'],
                    'material': f['params']['cokol_top']['material'],
                    'name': 'cokol_front',
                    'radius': !0x0
                });
                f['cokol_top']['add'](x);
            }
        }
    }
}
,
Cabinet_new['prototype']['set_cokol_top_active'] = function(f) {
    let g = this;
    var h = {
        'front': g['params']['cokol_top']['front'],
        'left': g['params']['cokol_top']['left'],
        'right': g['params']['cokol_top']['right']
    };
    Object['keys'](f)['forEach'](function(i) {
        g['params']['cokol_top'][i] = f[i];
    }),
    this['build_cokol_top'](),
    add_undo_action({
        'type': 'cokol_top_active',
        'object': this,
        'from': h,
        'to': f
    }),
    get_total_price_test(),
    global_update();
}
,
Cabinet_new['prototype']['build_tabletop'] = function() {
    if (custom_settings['wtm'],
    0x1 == tmp_tabletop_fix && (this['params']['tabletop']['height'] = 0x0,
    this['params']['tabletop']['visible'] = !0x1),
    this['reset_model'](this['tabletop']),
    this['tabletop']['children']['length']) {
        for (var f = 0x0; f < this['tabletop']['children']['length']; f++)
            this['tabletop']['remove'](this['tabletop']['children'][f]);
    }
    var g, h;
    0x1 != constructor_settings['tabletop_plints_available'] && (this['params']['tabletop']['plints']['back'] = !0x1,
    this['params']['tabletop']['plints']['left'] = !0x1,
    this['params']['tabletop']['plints']['right'] = !0x1),
    0x1 == constructor_settings['tabletop_v2'] && this['params']['tabletop']['active'] && (project_settings['defaults']['tabletop'] || (project_settings['defaults']['tabletop'] = tabletop_lib['first_item']['id']),
    this['params']['tabletop']['tabletop_id'] || (this['params']['tabletop']['tabletop_id'] = project_settings['defaults']['tabletop']),
    this['params']['tabletop']['tabletop_variant'] || (this['params']['tabletop']['tabletop_variant'] = 0x0),
    h = pp['libs']['tabletop']['find_item'](this['params']['tabletop']['tabletop_id'])['params']['variants'][this['params']['tabletop']['tabletop_variant']]['thickness'],
    this['params']['tabletop']['height'] = parseInt(h)),
    this['params']['tabletop']['autogen'] && 'top' !== this['params']['cabinet_group'] && ('common' === this['params']['cabinet']['type'] && this['build_tabletop_common'](),
    'false_facade_tabletop' === this['params']['cabinet']['type'] && (this['params']['tabletop']['plints']['left'] = !0x1,
    this['params']['tabletop']['plints']['right'] = !0x1,
    this['build_tabletop_false_facade_tabletop'](project_settings['tabletop_thickness'])),
    'false_facade' === this['params']['cabinet']['type'] && (this['params']['tabletop']['plints']['left'] = !0x1,
    this['params']['tabletop']['plints']['right'] = !0x1,
    this['build_tabletop_common']()),
    'false_facade_facade' === this['params']['cabinet']['type'] && (this['params']['tabletop']['plints']['left'] = !0x1,
    this['params']['tabletop']['plints']['right'] = !0x1,
    this['build_tabletop_common'](0x12)),
    'corner' === this['params']['cabinet']['type'] && this['build_tabletop_corner'](),
    'corner_90' === this['params']['cabinet']['type'] && this['build_tabletop_corner_90'](),
    'corner_straight' === this['params']['cabinet']['type'] && this['build_tabletop_corner_straight'](),
    'corner_open' === this['params']['cabinet']['type'] && (this['params']['tabletop']['plints']['left'] = !0x1,
    this['params']['tabletop']['plints']['right'] = !0x1,
    this['build_tabletop_corner_open']()),
    'corner_open_facade' === this['params']['cabinet']['type'] && (this['params']['tabletop']['plints']['left'] = !0x1,
    this['params']['tabletop']['plints']['right'] = !0x1,
    this['build_tabletop_corner_open_facade']()),
    'end_corner_facade' === this['params']['cabinet']['type'] && (this['params']['tabletop']['plints']['left'] = !0x1,
    this['params']['tabletop']['plints']['right'] = !0x1,
    this['build_tabletop_end_corner_facade']()),
    'end_radius_facade' === this['params']['cabinet']['type'] && (this['params']['tabletop']['plints']['left'] = !0x1,
    this['params']['tabletop']['plints']['right'] = !0x1,
    this['build_tabletop_end_radius_facade']()),
    'end_radius_facade_f' === this['params']['cabinet']['type'] && (this['params']['tabletop']['plints']['left'] = !0x1,
    this['params']['tabletop']['plints']['right'] = !0x1,
    this['build_tabletop_end_radius_facade']()),
    'end_radius_open' === this['params']['cabinet']['type'] && (this['params']['tabletop']['plints']['left'] = !0x1,
    this['params']['tabletop']['plints']['right'] = !0x1,
    this['build_tabletop_end_radius_open']()),
    'end_radius_open_f' === this['params']['cabinet']['type'] && (this['params']['tabletop']['plints']['left'] = !0x1,
    this['params']['tabletop']['plints']['right'] = !0x1,
    this['build_tabletop_end_radius_facade']()),
    pp['custom']['cab_types'][this['params']['cabinet']['type']] && 'function' == typeof this['build_tabletop_' + this['params']['cabinet']['type']] && this['build_tabletop_' + this['params']['cabinet']['type']](),
    0x0 == this['params']['tabletop']['visible'] && (this['tabletop']['visible'] = !0x1),
    0x1 == constructor_settings['tabletop_v2'] && (this['tabletop']['visible'] = !0x1),
    this['set_cabinet_positions'](),
    'edges' === global_options['mode']) && this['edges_mode']();
}
,
Cabinet_new['prototype']['build_doors'] = async function(e) {
    if (!constructor_settings['core_v2']) {
        if (e) {
            for (let f = 0x0; f < this['params']['doors']['length']; f++)
                check_material_in_category(facades_lib['get_defaults'](this['params']['cabinet_group'])['materials'], this['params']['doors'][f]['material']) || (this['params']['doors'][f]['material'] = void 0x0);
        }
        if (null != this['params']['fixed_facade_material']) {
            for (let g = 0x0; g < this['params']['doors']['length']; g++)
                this['params']['doors'][g]['material'] = this['params']['fixed_facade_material'];
        }
        pp['custom']['cab_types'][this['params']['cabinet']['type']] ? 'function' == typeof this['build_doors_' + this['params']['cabinet']['type']] && this['build_doors_' + this['params']['cabinet']['type']]() : this['build_doors_all']();
    }
}
,
Cabinet_new['prototype']['build_shelves'] = function() {
    0x1 != constructor_settings['core_v2'] && (this['reset_model'](this['shelves']),
    'common' === this['params']['cabinet']['type'] && this['build_shelves_common'](),
    'corner_straight' === this['params']['cabinet']['type'] && this['build_shelves_common'](),
    'corner' === this['params']['cabinet']['type'] && this['build_shelves_corner'](),
    'corner_90' === this['params']['cabinet']['type'] && this['build_shelves_corner_90'](),
    'corner_open' === this['params']['cabinet']['type'] && this['build_shelves_corner_open'](),
    'corner_open_facade' === this['params']['cabinet']['type'] && this['build_shelves_corner_open_facade'](),
    'end_corner_facade' === this['params']['cabinet']['type'] && this['build_shelves_end_corner_facade'](),
    'end_radius_facade' === this['params']['cabinet']['type'] && this['build_shelves_end_radius_facade'](),
    'end_radius_facade_f' === this['params']['cabinet']['type'] && this['build_shelves_end_radius_facade'](),
    'end_radius_open' === this['params']['cabinet']['type'] && this['build_shelves_end_radius_open'](),
    pp['custom']['cab_types'][this['params']['cabinet']['type']]) && 'function' == typeof this['build_shelves_' + this['params']['cabinet']['type']] && this['build_shelves_' + this['params']['cabinet']['type']]();
}
,
Cabinet_new['prototype']['build_lockers'] = function(e) {
    if (e) {
        for (let f = 0x0; f < this['params']['lockers']['length']; f++)
            check_material_in_category(facades_lib['get_defaults'](this['params']['cabinet_group'])['materials'], this['params']['lockers'][f]['material']) || (this['params']['lockers'][f]['material'] = void 0x0);
    }
    if (null != this['params']['fixed_facade_material']) {
        for (let g = 0x0; g < this['params']['lockers']['length']; g++)
            this['params']['lockers'][g]['material'] = this['params']['fixed_facade_material'];
    }
    'common' === this['params']['cabinet']['type'] && this['build_lockers_common']();
}
,
Cabinet_new['prototype']['build_sizes'] = function() {
    this['reset_model'](this['sizes']),
    this['calculate_height'](),
    'common' === this['params']['cabinet']['type'] && this['build_sizes_common'](),
    'corner_open' === this['params']['cabinet']['type'] && this['build_sizes_common'](),
    'corner_open_facade' === this['params']['cabinet']['type'] && this['build_sizes_common'](),
    'end_corner_facade' === this['params']['cabinet']['type'] && this['build_sizes_common'](),
    'end_radius_facade' === this['params']['cabinet']['type'] && this['build_sizes_common'](),
    'end_radius_facade_f' === this['params']['cabinet']['type'] && this['build_sizes_common'](),
    'end_radius_open' === this['params']['cabinet']['type'] && this['build_sizes_common'](),
    'corner' === this['params']['cabinet']['type'] && this['build_sizes_corner'](),
    'corner_90' === this['params']['cabinet']['type'] && this['build_sizes_corner_90'](),
    'corner_straight' === this['params']['cabinet']['type'] && this['build_sizes_corner_straight'](),
    'false_facade' === this['params']['cabinet']['type'] && this['build_sizes_common'](),
    'false_facade_tabletop' === this['params']['cabinet']['type'] && this['build_sizes_false_facade_tabletop'](),
    'false_facade_facade' === this['params']['cabinet']['type'] && this['build_sizes_false_facade_facade'](),
    'false_facade_facade_b' === this['params']['cabinet']['type'] && this['build_sizes_false_facade_facade'](),
    pp['custom']['cab_types'][this['params']['cabinet']['type']] && 'function' == typeof this['build_sizes_' + this['params']['cabinet']['type']] && this['build_sizes_' + this['params']['cabinet']['type']](),
    this['sizes']['visible'] = global_options['sizes_visible'];
}
,
Cabinet_new['prototype']['calculate_height'] = function() {
    var f = this['params'], g;
    let h = this['params']['cabinet']['height'];
    'bottom' === f['cabinet_group'] && (h += f['cokol']['height'],
    ('false_facade_facade' !== f['cabinet']['type'] || !0x1 !== f['tabletop']['active']) && f['tabletop']['autogen'] && 0x1 != custom_settings['wtm'] && Number['isFinite'](f['tabletop']['height'])) && (h += f['tabletop']['height']),
    this['const']['calculated_height'] = h;
}
,
Cabinet_new['prototype']['build_size_box'] = function() {
    if (pp['custom']['cab_types'][this['params']['cabinet']['type']] && 'function' == typeof this['build_size_box_' + this['params']['cabinet']['type']])
        this['build_size_box_' + this['params']['cabinet']['type']]();
    else {
        var f = this
          , g = this['params'];
        let h = f['params']['cabinet']['width']
          , j = ('false_facade_tabletop' === g['cabinet']['type'] && (h = project_settings['tabletop_thickness']),
        f['params']['cabinet']['depth'] / units - f['params']['cabinet']['back_wall_offset'] / units);
        'corner' === g['cabinet']['type'] && (j = f['params']['cabinet']['width2'] / units),
        'corner_90' === g['cabinet']['type'] && (j = f['params']['cabinet']['width2'] / units),
        0x1 == custom_settings['wtm'] && (j = (f['params']['cabinet']['depth'] + f['params']['cabinet']['offset']['back']) / units,
        0x1 == f['params']['tabletop']['active'] && 'corner_straight' !== g['cabinet']['type'] && 'false_facade_tabletop' !== g['cabinet']['type'] && (j = f['params']['tabletop']['depth'] / units),
        h = f['params']['cabinet']['width'] + f['params']['cabinet']['offset']['side'],
        'false_facade_tabletop' === g['cabinet']['type'] && (h = project_settings['tabletop_thickness']),
        'corner_straight' === g['cabinet']['type'] && (j = Math['max']((f['params']['cabinet']['depth'] + f['params']['cabinet']['offset']['back']) / units + (f['params']['cabinet']['thickness'] + f['params']['cabinet']['corner_straight_side_connect_width']) / units, f['params']['tabletop']['depth'] / units)),
        'corner' !== g['cabinet']['type'] && 'corner_90' !== g['cabinet']['type'] || (j = (f['params']['cabinet']['width2'] + f['params']['cabinet']['offset']['back']) / units,
        h = f['params']['cabinet']['width'] + f['params']['cabinet']['offset']['back'])),
        'corner_straight' === g['cabinet']['type'] && 'top' == g['cabinet_group'] && (j = f['params']['cabinet']['depth'] / units - f['params']['cabinet']['back_wall_offset'] / units + f['params']['cabinet']['thickness'] / units),
        f['size_box'] ? f['size_box']['set_size'](h / units, f['const']['calculated_height'] / units, j) : f['size_box'] = new SizeBox({
            'width': h / units,
            'height': f['const']['calculated_height'] / units,
            'depth': j
        }),
        f['size_box']['position']['y'] = f['const']['calculated_height'] / units / 0x2,
        f['add'](f['size_box']),
        f['size_box']['visible'] = !0x1;
    }
}
,
Cabinet_new['prototype']['build_cornice'] = function(e) {
    constructor_settings['core_v2'] || (this['reset_model'](this['cornice']),
    0x0 != constructor_settings['cornice_available'] && 0x0 != this['params']['cornice']['enabled'] && 0x0 != project_settings['cornice_available'] && (e && (this['params']['cornice']['material'] = void 0x0),
    'bottom' !== this['params']['cabinet_group'] || !0x0 !== this['params']['tabletop']['active']) && (void 0x0 === this['params']['cornice']['available'] && (this['params']['cornice']['available'] = !0x0),
    'common' === this['params']['cabinet']['type'] && this['build_cornice_common'](),
    'false_facade' === this['params']['cabinet']['type'] && this['build_cornice_common'](),
    'corner_straight' === this['params']['cabinet']['type'] && this['build_cornice_corner_straight'](),
    'corner' === this['params']['cabinet']['type'] && this['build_cornice_corner'](),
    'corner_90' === this['params']['cabinet']['type'] && this['build_cornice_corner_90'](),
    'corner_open' === this['params']['cabinet']['type'] && this['build_cornice_corner_open'](),
    'end_corner_facade' === this['params']['cabinet']['type'] && this['build_cornice_end_corner_facade'](),
    'corner_open_facade' === this['params']['cabinet']['type'] && this['build_cornice_corner_open_facade'](),
    'end_radius_open' === this['params']['cabinet']['type'] && this['build_cornice_end_radius_facade'](),
    'end_radius_facade' === this['params']['cabinet']['type'] && this['build_cornice_end_radius_facade'](),
    'end_radius_facade_f' === this['params']['cabinet']['type']) && this['build_cornice_end_radius_facade']());
}
,
Cabinet_new['prototype']['build_gola'] = function() {
    if (0x0 != facades_lib['get_defaults'](this['params']['cabinet_group'])['handle'] && 'corner' !== this['params']['cabinet']['type'] && 'corner_open' !== this['params']['cabinet']['type'] && 'end_corner_facade' !== this['params']['cabinet']['type'] && 'end_radius_facade' !== this['params']['cabinet']['type'] && 'end_radius_facade_f' !== this['params']['cabinet']['type'] && 'end_radius_open' !== this['params']['cabinet']['type'] && 'corner_open_facade' !== this['params']['cabinet']['type'] && 'false_facade' !== this['params']['cabinet']['type'] && 'false_facade_facade' !== this['params']['cabinet']['type'] && 'false_facade_facade_b' !== this['params']['cabinet']['type'] && 'false_facade_tabletop' !== this['params']['cabinet']['type']) {
        let j = this;
        if ('' === handle_cuts['common'] || '' === handle_cuts['model_tabletop'] || '' === handle_cuts['model_top_module']) {
            load_gola(project_settings['handle'][j['params']['cabinet_group']]['model']);
            let k = setInterval(function() {
                '' !== handle_cuts['common'] && '' !== handle_cuts['model_tabletop'] && '' !== handle_cuts['model_top_module'] && (clearInterval(k),
                j['build_gola']());
            }, 0x64);
        } else {
            var f = new THREE['Group']();
            if (this['cabinet']['left_wall']) {
                var g = this['cabinet']['left_wall']['clone']()
                  , h = (f['add'](g),
                g['position']['x'] = 0x0,
                g['position']['y'] = this['params']['cabinet']['height'] / units / 0x2,
                g['updateMatrix'](),
                []);
                for (let l = 0x0; l < this['doors']['children']['length']; l++)
                    if (!0x1 !== this['doors']['children'][l]['params']['handle_active'] && !0x0 !== this['doors']['children'][l]['params']['no_handle_forced'] && this['doors']['children'][l]['handle']) {
                        let m;
                        'model_tabletop' === this['doors']['children'][l]['handle']['params']['model_type'] && (m = handle_cuts['model_tabletop']['clone']()),
                        'common' === this['doors']['children'][l]['handle']['params']['model_type'] && (m = handle_cuts['common']['clone']()),
                        'model_top_module' === this['doors']['children'][l]['handle']['params']['model_type'] && (m = handle_cuts['model_top_module']['clone']()),
                        f['add'](m),
                        m['position']['x'] = 0x0,
                        'model_tabletop' === this['doors']['children'][l]['handle']['params']['model_type'] && (m['position']['z'] = this['const']['calculated_depth'] / units / 0x2 - 0x1b / units / 0x2,
                        m['position']['y'] = this['doors']['children'][l]['position']['y'] - this['cabinet']['position']['y'] + this['doors']['children'][l]['handle']['position']['y'] + 0.05),
                        'common' === this['doors']['children'][l]['handle']['params']['model_type'] && (m['position']['z'] = this['const']['calculated_depth'] / units / 0x2 - 0x1b / units / 0x2 + 0.05,
                        m['position']['y'] = this['doors']['children'][l]['position']['y'] - this['cabinet']['position']['y'] + this['doors']['children'][l]['handle']['position']['y'] + 0.05),
                        'model_top_module' === this['doors']['children'][l]['handle']['params']['model_type'] && (m['position']['z'] = this['const']['calculated_depth'] / units / 0x2 - 19.5 / units,
                        m['position']['y'] = this['doors']['children'][l]['position']['y'] - this['cabinet']['position']['y'] + this['doors']['children'][l]['handle']['position']['y']),
                        m['updateMatrix'](),
                        h['push'](m);
                    }
                for (let n = 0x0; n < this['lockers']['children']['length']; n++)
                    if (!0x0 !== this['lockers']['children'][n]['params']['no_handle_forced'] && this['lockers']['children'][n]['handle'] && !0x1 !== this['lockers']['children'][n]['params']['handle_active'] && !0x0 !== this['lockers']['children'][n]['params']['inner']) {
                        let o;
                        'model_tabletop' === this['lockers']['children'][n]['handle']['params']['model_type'] && (o = handle_cuts['model_tabletop']['clone']()),
                        'common' === this['lockers']['children'][n]['handle']['params']['model_type'] && (o = handle_cuts['common']['clone']()),
                        f['add'](o),
                        o['position']['y'] = 0x0,
                        o['position']['y'] = this['lockers']['children'][n]['position']['y'] - this['cabinet']['position']['y'] + this['lockers']['children'][n]['handle']['position']['y'] + 0.05,
                        'model_tabletop' === this['lockers']['children'][n]['handle']['params']['model_type'] && (o['position']['z'] = this['const']['calculated_depth'] / units / 0x2 - 0x1b / units / 0x2),
                        'common' === this['lockers']['children'][n]['handle']['params']['model_type'] && (o['position']['z'] = this['const']['calculated_depth'] / units / 0x2 - 0x1b / units / 0x2 + 0.05),
                        o['updateMatrix'](),
                        h['push'](o);
                    }
                var g = csggeom(g, h, 'subtract');
                this['cabinet']['left_wall']['geometry'] = g,
                this['cabinet']['right_wall'] && (this['cabinet']['right_wall']['geometry'] = g);
            }
        }
    }
}
,
Cabinet_new['prototype']['set_cabinet_positions'] = function() {
    0x0 == this['params']['cokol']['active'] ? (this['cabinet']['position']['y'] = 0x0,
    this['tabletop']['position']['y'] = this['params']['cabinet']['height'] / units) : (this['cabinet']['position']['y'] = this['params']['cokol']['height'] / units,
    this['tabletop']['position']['y'] = this['params']['cokol']['height'] / units + this['params']['cabinet']['height'] / units,
    'false_facade_tabletop' === this['params']['cabinet']['type'] && (this['cabinet']['position']['y'] = 0x0));
}
,
Cabinet_new['prototype']['build_comments'] = function() {
    this['reset_model'](this['comments']);
    var f = this;
    if (f['params']['accessories_comments']['length'])
        for (let l = 0x0; l < f['params']['accessories_comments']['length']; l++) {
            var g = f['params']['accessories_comments'][l];
            g in accsessories_data['items'] && f['params']['accessories_comments_string']['indexOf']('\x20\x0a\x20' + accsessories_data['items'][g]['name']) < 0x0 && (f['params']['accessories_comments_string'] += '\x20\x0a\x20' + accsessories_data['items'][g]['name']);
        }
    var h = this['params']['comments'] + this['params']['accessories_comments_string'], h, j, k, h, k;
    '' !== h && (h = makeTextSprite(h, 0x0, f['params']['cabinet']['height'] / units + 0x32, 0x0, {
        'fontsize': 0x36,
        'fontface': 'Georgia',
        'borderColor': {
            'r': 0x0,
            'g': 0x0,
            'b': 0x0,
            'a': 0x1
        },
        'borderThickness': 0x2,
        'fillColor': {
            'r': 0xff,
            'g': 0xff,
            'b': 0xff,
            'a': 0x0
        },
        'radius': 0xf,
        'vAlign': 'bottom',
        'hAlign': 'center'
    }),
    this['comments']['add'](h),
    (j = new THREE['LineBasicMaterial']({
        'color': 0x0
    }))['depthWrite'] = !0x1,
    j['depthTest'] = !0x1,
    (k = [])['push'](new THREE['Vector3'](0x0,f['params']['cokol']['height'] / units + f['params']['cabinet']['height'] / units / 0x2,0x0)),
    k['push'](new THREE['Vector3'](0x0,h['position']['y'] - 0x1,0x0)),
    h = new THREE['BufferGeometry']()['setFromPoints'](k),
    (k = new THREE['Line'](h,j))['userData']['mouse_events'] = !0x1,
    this['comments']['add'](k));
}
,
Cabinet_new['prototype']['show_comments'] = function() {
    this['comments']['visible'] = !0x0;
}
,
Cabinet_new['prototype']['hide_comments'] = function() {
    this['comments']['visible'] = !0x1;
}
,
Cabinet_new['prototype']['build_doors_all'] = async function(j={}) {
    var q = this;
    for (let U = q['lights']['children']['length']; U--; )
        'door' === q['lights']['children'][U]['light_type'] && q['lights']['remove'](q['lights']['children'][U]);
    var A = {
        'width': void 0x0 !== j['width'] ? j['width'] : q['const']['calculated_width'],
        'height': (void 0x0 !== j['height'] ? j : q['params']['cabinet'])['height'],
        'obj_to_add': void 0x0 !== j['obj_to_add'] ? j['obj_to_add'] : this['doors'],
        'params': (void 0x0 !== j['params'] ? j : q)['params'],
        'override': void 0x0 !== j['override'] && j['override']
    };
    this['reset_model'](A['obj_to_add']);
    let B = q['cabinet']['position']['y'];
    if (-0x1 < A['obj_to_add']['name']['indexOf']('section_') && (B = 0x0),
    !('false_facade' == q['params']['cabinet']['type'] && q['params']['doors']['length'] < 0x1)) {
        var C, D = ('false_facade_facade' == q['params']['cabinet']['type'] && q['params']['doors']['length'] < 0x1 && q['params']['doors']['push']({}),
        'false_facade_facade_b' == q['params']['cabinet']['type'] && q['params']['doors']['length'] < 0x1 && q['params']['doors']['push']({}),
        'corner_open_facade' == q['params']['cabinet']['type'] && (C = 0xaa - q['params']['cabinet']['thickness'],
        q['params']['doors']['length'] < 0x1) && ('right' === q['params']['cabinet']['orientation'] ? (q['params']['doors']['push']({
            'width': q['const']['calculated_width'] - C,
            'type': 'rtl',
            'handle_position': 'top' === q['params']['cabinet_group'] ? 'bottom' : 'top',
            'pX': 0x0,
            'pY': 0x0,
            'pZ': 0x0
        }),
        q['params']['doors']['push']({
            'width': Math['sqrt'](C * C + C * C),
            'type': 'ltr',
            'handle_position': 'top' === q['params']['cabinet_group'] ? 'bottom' : 'top',
            'pX': 0x0,
            'pY': 0x0,
            'pZ': 0x0
        })) : (q['params']['doors']['push']({
            'width': q['const']['calculated_width'] - C,
            'type': 'ltr',
            'handle_position': 'top' === q['params']['cabinet_group'] ? 'bottom' : 'top',
            'pX': 0x0,
            'pY': 0x0,
            'pZ': 0x0
        }),
        q['params']['doors']['push']({
            'width': Math['sqrt'](C * C + C * C),
            'type': 'rtl',
            'handle_position': 'top' === q['params']['cabinet_group'] ? 'bottom' : 'top',
            'pX': 0x0,
            'pY': 0x0,
            'pZ': 0x0
        }))),
        box3['setFromObject'](this['cabinet'])['getSize'](new THREE['Vector3']())), E, F, G, H, I, G, H, I, H, J, G, H, J, H, J, K, L, I, F, N, L, K, I, K, I, N;
        for (let W = 0x0; W < A['params']['doors']['length']; W++) {
            let Z = A['params']['doors'][W];
            if ('false_facade' == q['params']['cabinet']['type'] && (q['params']['doors'][W] = {},
            Z = {
                'width': '100%',
                'height': '100%',
                'thickness': void 0x0,
                'type': 'falsefacade',
                'can_be_opened': !0x1,
                'handle_model': 'none',
                'no_handle_forced': !0x0,
                'group': q['params']['facades_group'],
                'material': q['params']['doors'][W]['material'],
                'additional_materials': {},
                'material_rotated': void 0x0 !== Z['material_rotated'] ? Z['material_rotated'] : project_settings['selected_materials'][q['params']['cabinet_group']]['facades_rotated'],
                'pX': -q['const']['calculated_width'] / units / 0x2,
                'pZ': q['const']['calculated_depth'] / units / 0x2
            },
            q['params']['facade']) && (Z['facade'] = q['params']['facade']['id'],
            Z['material'] = q['params']['facade']['materials']['gen']),
            'false_facade_facade' == q['params']['cabinet']['type']) {
                var E = q['params']['doors'][W]['style'];
                let a3 = q['params']['doors'][W]['fixed_facade_model'];
                a3 = 'facade_simple' == q['params']['cabinet']['left_wall'] ? (ce(),
                '/common_assets/models/plastic_full.fbx') : (ce(),
                ce(),
                ''),
                Z = {
                    'width': q['const']['calculated_depth'],
                    'type': 'falsefacade',
                    'facade': q['params']['facade']['id'],
                    'material': q['params']['doors'][W]['material'],
                    'fixed_facade_model': a3,
                    'additional_materials': void 0x0 !== Z['additional_materials'] ? Z['additional_materials'] : {},
                    'style': E,
                    'handle_model': 'none',
                    'no_handle_forced': !0x0,
                    'can_be_opened': !0x1,
                    'pX': 0x0,
                    'allow_z': 0x1,
                    'allow_x': 0x1,
                    'pZ': q['const']['calculated_depth'] / units / 0x2
                },
                'left' === q['params']['cabinet']['orientation'] ? (Z['rY'] = -Math['PI'] / 0x2,
                Z['pZ'] = -q['const']['calculated_depth'] / units / 0x2,
                Z['pX'] = 0.9) : (Z['rY'] = Math['PI'] / 0x2,
                Z['pX'] = -0.9),
                Z['allow_ry'] = 0x1;
            }
            'false_facade_facade_b' == q['params']['cabinet']['type'] && ((Z = {
                'height': q['const']['calculated_depth'],
                'width': q['const']['calculated_width'],
                'type': 'falsefacade',
                'facade': q['params']['facade']['id'],
                'material': q['params']['doors'][W]['material'],
                'fixed_facade_model': q['params']['doors'][W]['fixed_facade_model'],
                'additional_materials': void 0x0 !== Z['additional_materials'] ? Z['additional_materials'] : {},
                'style': q['params']['doors'][W]['style'],
                'handle_model': 'none',
                'no_handle_forced': !0x0,
                'can_be_opened': !0x1,
                'allow_z': 0x1,
                'allow_y': 0x1,
                'pZ': -q['const']['calculated_depth'] / units / 0x2,
                'pY': q['params']['cabinet']['height'] / units,
                'allow_rx': 0x1
            })['rX'] = Math['PI'] / 0x2),
            'end_radius_facade' != q['params']['cabinet']['type'] && 'end_radius_facade_f' != q['params']['cabinet']['type'] || (Z['radius'] = !0x0);
            let a0, a1 = (a0 = void 0x0 !== Z['glass_material'] ? Z['glass_material'] : project_settings['selected_materials']['glass'] || void 0x0,
            {
                'active': void 0x0 !== Z['active'] ? Z['active'] : project_settings['facades_active'],
                'width': void 0x0 !== Z['width'] ? Z['width'] : '100%',
                'height': void 0x0 !== Z['height'] ? Z['height'] : '100%',
                'thickness': void 0x0 !== Z['thickness'] ? Z['thickness'] : void 0x0,
                'facade': void 0x0 !== Z['facade'] ? Z['facade'] : this['params']['facade']['id'],
                'facade2': void 0x0 !== Z['facade2'] ? Z['facade2'] : this['params']['facade']['id'],
                'type': void 0x0 !== Z['type'] ? Z['type'] : 'rtl',
                'style': void 0x0 !== Z['style'] ? Z['style'] : 'full',
                'fixed_facade_model': void 0x0 !== Z['fixed_facade_model'] ? Z['fixed_facade_model'] : void 0x0,
                'facade_type': void 0x0 !== Z['facade_type'] ? Z['facade_type'] : void 0x0,
                'handle_model': void 0x0 !== Z['handle_model'] ? Z['handle_model'] : project_settings['handle'][q['params']['cabinet_group']]['model'],
                'handle_size_index': void 0x0 !== Z['handle_size_index'] ? Z['handle_size_index'] : project_settings['handle'][q['params']['cabinet_group']]['preferable_size'],
                'handle_orientation': void 0x0 !== Z['handle_orientation'] ? Z['handle_orientation'] : project_settings['handle'][q['params']['cabinet_group']]['orientation'],
                'handle_position': void 0x0 !== Z['handle_position'] ? Z['handle_position'] : 'top',
                'no_handle_forced': void 0x0 !== Z['no_handle_forced'] && Z['no_handle_forced'],
                'hinges': void 0x0,
                'starting_point_x': void 0x0 !== Z['starting_point_x'] ? Z['starting_point_x'] : '0%',
                'starting_point_y': void 0x0 !== Z['starting_point_y'] ? Z['starting_point_y'] : '0%',
                'direction_x': void 0x0 !== Z['direction_x'] ? Z['direction_x'] : 'right',
                'direction_y': void 0x0 !== Z['direction_y'] ? Z['direction_y'] : 'top',
                'offset_top': void 0x0 !== Z['offset_top'] ? Z['offset_top'] : 0x0,
                'offset_bottom': void 0x0 !== Z['offset_bottom'] ? Z['offset_bottom'] : 0x0,
                'offset_left': void 0x0 !== Z['offset_left'] ? Z['offset_left'] : 0x0,
                'offset_right': void 0x0 !== Z['offset_right'] ? Z['offset_right'] : 0x0,
                'additional_materials': void 0x0 !== Z['additional_materials'] ? Z['additional_materials'] : {},
                'available_opens': void 0x0 !== Z['available_opens'] ? Z['available_opens'] : [],
                'material_fixed': void 0x0 !== Z['material_fixed'] && Z['material_fixed'],
                'material': Z['material'],
                'material_rotated': void 0x0 !== Z['material_rotated'] ? Z['material_rotated'] : project_settings['selected_materials'][q['params']['cabinet_group']]['facades_rotated'],
                'glass_material': a0,
                'group': void 0x0 !== Z['group'] ? Z['group'] : q['params']['facades_group'],
                'facade_group': void 0x0 !== Z['facade_group'] ? Z['facade_group'] : q['params']['facades_group'],
                'no_handle_group': void 0x0 !== Z['no_handle_group'] && Z['no_handle_group'],
                'can_be_opened': void 0x0 === Z['can_be_opened'] || Z['can_be_opened'],
                'furniture_visible': void 0x0 === Z['furniture_visible'] || Z['furniture_visible'],
                'radius': void 0x0 !== Z['radius'] && Z['radius'],
                'orientation': q['params']['cabinet']['orientation'],
                'params_locked': void 0x0 !== Z['params_locked'] && Z['params_locked'],
                'facade_locked': (void 0x0 !== Z['facade_locked'] ? Z : this['params'])['facade_locked'],
                'facade_type_locked': (void 0x0 !== Z['facade_type_locked'] ? Z : this['params'])['facade_type_locked'],
                'facade_mat_locked': (void 0x0 !== Z['facade_mat_locked'] ? Z : this['params'])['facade_mat_locked'],
                'facade_offset': void 0x0 !== Z['facade_offset'] ? Z['facade_offset'] : project_settings['door_offset'],
                'models': void 0x0 !== Z['models'] ? Z['models'] : [],
                'pX': 0x0,
                'pY': B,
                'pZ': q['const']['calculated_depth'] / units / 0x2,
                'rX': void 0x0 !== Z['rX'] ? Z['rX'] : 0x0,
                'rY': void 0x0 !== Z['rY'] ? Z['rY'] : 0x0,
                'rZ': void 0x0 !== Z['rZ'] ? Z['rZ'] : 0x0,
                'allow_x': void 0x0 !== Z['allow_x'] ? Z['allow_x'] : 0x0,
                'allow_y': void 0x0 !== Z['allow_y'] ? Z['allow_y'] : 0x0,
                'allow_z': void 0x0 !== Z['allow_z'] ? Z['allow_z'] : 0x0,
                'allow_ry': void 0x0 !== Z['allow_ry'] ? Z['allow_ry'] : 0x0,
                'allow_rx': void 0x0 !== Z['allow_rx'] ? Z['allow_rx'] : 0x0,
                'is_auto': void 0x0 !== Z['is_auto'] ? Z['is_auto'] : 0x0,
                'tag': void 0x0 !== Z['tag'] ? Z['tag'] : '',
                'flip': void 0x0 !== Z['flip'] && Z['flip'],
                'is_double': void 0x0 !== Z['is_double'] ? Z['is_double'] : 0x0,
                'is_triple': void 0x0 !== Z['is_triple'] ? Z['is_triple'] : 0x0
            });
            if ('end_radius_facade_f' == q['params']['cabinet']['type'] && (a1['radius_type'] = 0x1),
            0x1 == a1['is_double']) {
                if (!facades_lib['get_defaults'](q['params']['cabinet_group'])['types_double'])
                    continue;
                if (!Object['keys'](facades_lib['get_defaults'](q['params']['cabinet_group'])['types_double'])['length'])
                    continue;
                a1['offset_top'] = -facades_lib['get_defaults'](q['params']['cabinet_group'])['double_offset'];
            }
            if (0x1 == a1['is_triple']) {
                if (!facades_lib['get_defaults'](q['params']['cabinet_group'])['types_triple'])
                    continue;
                if (!Object['keys'](facades_lib['get_defaults'](q['params']['cabinet_group'])['types_triple'])['length'])
                    continue;
                facades_lib['get_defaults'](q['params']['cabinet_group'])['triple_decor_model']['offset'] && (a1['offset_top'] = facades_lib['get_defaults'](q['params']['cabinet_group'])['triple_decor_model']['offset']);
            }
            if (!A['override'] || a1['material_fixed'] || (a1['material'] = void 0x0),
            void 0x0 === a1['facade'] && (a1['facade'] = project_settings['defaults']['facades'][a1['facade_group']]),
            void 0x0 === a1['facade2'] && (a1['facade2'] = a1['facade']),
            !isNaN(parseInt(a1['style'])) && facades_lib['items'][a1['facade']]['compatibility_types']) {
                let a4 = facades_lib['items'][a1['facade']]['compatibility_types'];
                Object['keys'](a4)['forEach'](function(a5) {
                    a4[a5] == a1['style'] && (a1['style'] = a5);
                });
            }
            if (0x1 == constructor_settings['module_sides_version'] ? (E = facades_lib['get_item'](a1['facade']))['thickness'] ? a1['thickness'] = E['thickness'] : a1['thickness'] = 0x12 : a1['thickness'] || ((F = facades_lib['get_item'](a1['facade']))['types'][a1['style']] && F['types'][a1['style']]['thickness'] ? a1['thickness'] = F['types'][a1['style']]['thickness'] : F['thickness'] ? a1['thickness'] = F['thickness'] : a1['thickness'] = 0x12),
            'common' == q['params']['cabinet']['type']) {
                if (0x1 === A['params']['doors']['length'])
                    0x0 !== a1['available_opens']['length'] || 'ltr' !== a1['type'] && 'rtl' !== a1['type'] || a1['available_opens']['push']('ltr', 'rtl');
                else {
                    let a5 = 0x0
                      , a6 = 0x0;
                    for (let a7 = 0x0; a7 < A['params']['doors']['length']; a7++) {
                        var O = A['params']['doors'][a7];
                        'ltr' !== O['type'] && 'rtl' !== O['type'] || O['starting_point_x'] && 0x0 != parseInt(O['starting_point_x']) && (a5 = 0x1);
                    }
                    if (0x0 == a5) {
                        for (let a8 = 0x0; a8 < A['params']['doors']['length']; a8++) {
                            var P = A['params']['doors'][a8];
                            'ltr' !== P['type'] && 'rtl' !== P['type'] || (P['available_opens'] || (P['available_opens'] = []),
                            0x0 === P['available_opens']['length'] && (P['available_opens']['push']('ltr', 'rtl'),
                            a6 = 0x1));
                        }
                        0x1 == a6 && (q['params']['change_opens'] = !0x0);
                    }
                }
                0x1 < a1['available_opens']['length'] && (q['params']['change_opens'] = !0x0);
            }
            'corner_straight' == q['params']['cabinet']['type'] && (0x1 == q['params']['version'] ? 'falsefacade' != a1['type'] && 0x1 === A['params']['doors']['length'] && ('left' === q['params']['cabinet']['orientation'] && (a1['type'] = 'ltr'),
            'right' === q['params']['cabinet']['orientation']) && (a1['type'] = 'rtl') : (0x3 !== A['params']['doors']['length'] || 0x0 !== a1['available_opens']['length'] || 'ltr' !== a1['type'] && 'rtl' !== a1['type'] || a1['available_opens']['push']('ltr', 'rtl'),
            0x1 < a1['available_opens']['length'] && (q['params']['change_opens'] = !0x0))),
            'corner' == q['params']['cabinet']['type'] && (0x2 == q['params']['version'] ? (G = void 0x0 !== q['params']['cabinet']['corner_right_wall_width'] ? q['params']['cabinet']['corner_right_wall_width'] / units : q['const']['calculated_depth'] / units,
            H = q['const']['calculated_width2'] - q['const']['calculated_depth'] - q['params']['cabinet']['thickness']) : (G = void 0x0 !== q['params']['cabinet']['corner_right_wall_width'] ? (q['params']['cabinet']['corner_right_wall_width'] - q['params']['tabletop']['offset']['back'] - q['params']['tabletop']['offset']['front'] - q['params']['cabinet']['back_wall_offset']) / units : q['const']['calculated_depth'] / units,
            H = q['const']['calculated_width2'] - q['const']['calculated_depth'] - q['params']['cabinet']['thickness'],
            0x1 < a1['available_opens']['length'] && (q['params']['change_opens'] = !0x0))),
            'corner_90' == q['params']['cabinet']['type'] && (0x2 == q['params']['version'] ? (H = q['const']['calculated_width'] - q['const']['calculated_depth'] - q['params']['cabinet']['thickness'] / 0x2,
            J = q['params']['cabinet']['width2'] - q['const']['calculated_depth'] - q['params']['cabinet']['thickness'] / 0x2) : (G = void 0x0 !== q['params']['cabinet']['corner_right_wall_width'] ? q['params']['cabinet']['corner_right_wall_width'] - q['params']['tabletop']['offset']['back'] - q['params']['tabletop']['offset']['front'] - q['params']['cabinet']['back_wall_offset'] : q['const']['calculated_depth'],
            H = q['params']['cabinet']['width'] - q['params']['tabletop']['offset']['back'] - G - q['params']['cabinet']['thickness'] / 0x2,
            J = q['params']['cabinet']['width2'] - q['params']['tabletop']['offset']['back'] - q['const']['calculated_depth'] - q['params']['cabinet']['thickness'] / 0x2,
            'left' == q['params']['cabinet']['orientation'] && (H = q['params']['cabinet']['width2'] - q['params']['tabletop']['offset']['back'] - q['const']['calculated_depth'] - q['params']['cabinet']['thickness'] / 0x2,
            J = q['params']['cabinet']['width'] - q['params']['tabletop']['offset']['back'] - G - q['params']['cabinet']['thickness'] / 0x2)),
            0x1 < a1['available_opens']['length']) && (q['params']['change_opens'] = !0x0),
            'corner_open_facade' == q['params']['cabinet']['type'] && (q['params']['cabinet']['orientation'],
            0x0 == W && (a1['width'] = q['const']['calculated_width'] - C),
            0x1 == W) && (a1['width'] = Math['sqrt'](C * C + C * C)),
            'end_corner_facade' == q['params']['cabinet']['type'] && (K = Math['max'](Math['abs'](q['params']['cabinet']['depth'] - q['params']['cabinet']['width'] - q['params']['cabinet']['thickness']), 0x64),
            L = Math['sqrt'](Math['pow'](q['const']['calculated_depth'] - K, 0x2) + Math['pow'](q['const']['calculated_width'], 0x2)),
            I = Math['atan']((q['const']['calculated_depth'] - K) / (q['const']['calculated_width'] - 0x2 * q['params']['cabinet']['thickness'])),
            0x0 != q['params']['cabinet']['end_corner_side_wall_width']) && (F = q['params']['cabinet']['depth'] - q['params']['tabletop']['offset']['front'] - q['params']['cabinet']['end_corner_side_wall_width'],
            N = q['const']['calculated_width'],
            L = Math['sqrt'](Math['pow'](F, 0x2) + Math['pow'](N, 0x2)),
            I = Math['atan'](F / (N - 0x2 * q['params']['cabinet']['thickness']))),
            'end_radius_facade' == q['params']['cabinet']['type'] && (K = Math['max'](Math['abs'](q['params']['cabinet']['depth'] - q['params']['cabinet']['width'] - q['params']['cabinet']['thickness']), 0x64),
            I = Math['atan']((q['const']['calculated_depth'] - K) / (q['const']['calculated_width'] - 0x2 * q['params']['cabinet']['thickness']))),
            'end_radius_facade_f' == q['params']['cabinet']['type'] && (K = Math['max'](Math['abs'](q['params']['cabinet']['depth'] - q['params']['cabinet']['width'] - q['params']['cabinet']['thickness']), 0x64),
            I = 0x0),
            0x1 == Z['allow_z'] && (a1['pZ'] = Z['pZ']),
            0x1 == Z['allow_x'] && (a1['pX'] = Z['pX']),
            0x1 == Z['allow_y'] && (a1['pY'] = Z['pY']),
            A['params']['doors'][W] = JSON['parse'](JSON['stringify'](a1)),
            'string' == typeof a1['offset_top'] && -0x1 < a1['offset_top']['indexOf']('%') && (a1['offset_top'] = A['height'] * parseFloat(a1['offset_top']) / 0x64),
            'string' == typeof a1['offset_left'] && -0x1 < a1['offset_left']['indexOf']('%') && (a1['offset_left'] = A['width'] * parseFloat(a1['offset_left']) / 0x64),
            'string' == typeof a1['offset_right'] && -0x1 < a1['offset_right']['indexOf']('%') && (a1['offset_right'] = A['width'] * parseFloat(a1['offset_right']) / 0x64),
            'string' == typeof a1['offset_bottom'] && -0x1 < a1['offset_bottom']['indexOf']('%') && (a1['offset_bottom'] = A['height'] * parseFloat(a1['offset_bottom']) / 0x64),
            void 0x0 === Z['material'] && (this['params']['facade'] && this['params']['facade']['materials'] && this['params']['facade']['materials']['gen'] ? a1['material'] = this['params']['facade']['materials']['gen'] : a1['material'] = project_settings['selected_materials']['facades'][a1['facade']]['gen'][a1['group']]);
            let a2 = 0x0;
            if ('common' != q['params']['cabinet']['type'] && 'false_facade' != q['params']['cabinet']['type'] && 'false_facade_facade' != q['params']['cabinet']['type'] && 'false_facade_facade_b' != q['params']['cabinet']['type'] && 'end_radius_facade' != q['params']['cabinet']['type'] && 'end_radius_facade_f' != q['params']['cabinet']['type'] || (a2 = q['const']['calculated_width']),
            'corner_straight' == q['params']['cabinet']['type'] && (a2 = 0x2 == q['params']['version'] ? q['const']['calculated_width'] - q['params']['cabinet']['corner_straight_front_wall_width'] - q['params']['cabinet']['corner_straight_front_facade_width'] : q['const']['calculated_width'] - q['params']['cabinet']['corner_straight_front_wall_width']),
            'corner' == q['params']['cabinet']['type'] && (a2 = get_hypo(q['const']['calculated_width'] - G * units - q['params']['cabinet']['thickness'], q['const']['calculated_width2'] - q['const']['calculated_depth'] - q['params']['cabinet']['thickness']),
            a2 += q['params']['cabinet']['thickness'] / 0x2,
            I = Math['asin'](H / a2)),
            'corner_90' == q['params']['cabinet']['type'] && (a2 = H,
            a1['width2'] = J),
            'end_corner_facade' == q['params']['cabinet']['type'] && (a2 = L),
            'string' == typeof a1['width'] && -0x1 < a1['width']['indexOf']('%') && (a1['width'] = (a2 - a1['offset_left'] - a1['offset_right']) * parseFloat(a1['width']) / 0x64),
            !('corner' == q['params']['cabinet']['type'] && a2 < 0xd2)) {
                if ('string' == typeof a1['height'] && -0x1 < a1['height']['indexOf']('%') && (a1['height'] = (A['height'] - a1['offset_top'] - a1['offset_bottom']) * parseFloat(a1['height']) / 0x64),
                'string' == typeof a1['starting_point_x'] && -0x1 < a1['starting_point_x']['indexOf']('%') ? 'corner_straight' == q['params']['cabinet']['type'] ? 'left' == q['params']['cabinet']['orientation'] ? 'right' === a1['direction_x'] ? a1['pX'] = -q['const']['calculated_width'] / units / 0x2 + a2 * parseFloat(a1['starting_point_x']) / 0x64 / units : a1['pX'] = -q['const']['calculated_width'] / units / 0x2 + a2 * parseFloat(a1['starting_point_x']) / 0x64 / units - a1['width'] / units : (N = q['const']['calculated_width'] / units / 0x2 - a2 / units,
                'right' === a1['direction_x'] ? a1['pX'] = N + a2 * parseFloat(a1['starting_point_x']) / 0x64 / units : a1['pX'] = N + a2 * parseFloat(a1['starting_point_x']) / 0x64 / units - a1['width'] / units) : 'right' === a1['direction_x'] ? a1['pX'] = -q['const']['calculated_width'] / units / 0x2 + q['const']['calculated_width'] * parseFloat(a1['starting_point_x']) / 0x64 / units : a1['pX'] = -q['const']['calculated_width'] / units / 0x2 + q['const']['calculated_width'] * parseFloat(a1['starting_point_x']) / 0x64 / units - a1['width'] / units : -0x1 < location['href']['indexOf']('mfleko') ? 'right' === a1['direction_x'] ? a1['pX'] = -q['const']['calculated_width'] / units / 0x2 + a1['starting_point_x'] : a1['pX'] = q['const']['calculated_width'] / units / 0x2 - a1['starting_point_x'] : 'right' === a1['direction_x'] ? a1['pX'] = -q['const']['calculated_width'] / units / 0x2 + a1['starting_point_x'] / units : a1['pX'] = q['const']['calculated_width'] / units / 0x2 - a1['starting_point_x'] / units,
                'string' == typeof a1['starting_point_y'] && -0x1 < a1['starting_point_y']['indexOf']('%') ? 'center' === a1['starting_point_y'] ? a1['pY'] = B + D['y'] / 0x2 - a1['height'] / units / 0x2 : 'top' === a1['direction_y'] ? a1['pY'] = B + A['height'] * parseFloat(a1['starting_point_y']) / 0x64 / units : a1['pY'] = B + A['height'] * parseFloat(a1['starting_point_y']) / 0x64 / units - a1['height'] / units : a1['pY'] = B + a1['starting_point_y'] / units,
                A['params']['doors'][W]['pY'] = a1['pY'],
                0x1 != project_settings['handle'][q['params']['cabinet_group']]['no_handle'] && 'false_facade' != q['params']['cabinet']['type'] && 'false_facade_facade' != q['params']['cabinet']['type'] && 'false_facade_facade_b' != q['params']['cabinet']['type']) {
                    'object' != typeof a1['handle_model'] && (a1['handle_model'] = handles_catalog['items'][0x0]);
                    var Q = a1['handle_model'], R, R, S, T;
                    if (R = (a1['handle_model']['sizes'][a1['handle_size_index']] || a1['handle_model']['sizes'][a1['handle_model']['sizes']['length'] - 0x1])['width'],
                    'horizontal' === a1['handle_orientation']) {
                        let a9 = a1['width'];
                        if (R >= (a9 = 'corner_90' == q['params']['cabinet']['type'] && 'left' == q['params']['cabinet']['orientation'] ? J : a9)) {
                            for (S = [],
                            T = 0x0; T < Q['sizes']['length']; T++)
                                Q['sizes'][T]['index'] = T,
                                Q['sizes'][T]['width'] <= a1['width'] && S['push'](Q['sizes'][T]);
                            S['sort'](function(aa, ab) {
                                return ab['width'] - aa['width'];
                            }),
                            S['length'] ? (Z['handle_size_index'] = S[0x0]['index'],
                            a1['handle_size_index'] = S[0x0]['index']) : (Z['handle_orientation'] = 'vertical',
                            a1['handle_orientation'] = 'vertical');
                        }
                    }
                    if ('vertical' === a1['handle_orientation'] && R >= a1['height']) {
                        for (S = [],
                        T = 0x0; T < Q['sizes']['length']; T++)
                            Q['sizes'][T]['index'] = T,
                            Q['sizes'][T]['width'] <= a1['height'] && S['push'](Q['sizes'][T]);
                        S['sort'](function(aa, ab) {
                            return ab['width'] - aa['width'];
                        }),
                        S['length'] && (Z['handle_size_index'] = S[0x0]['index'],
                        a1['handle_size_index'] = S[0x0]['index']);
                    }
                }
                if ('corner' == q['params']['cabinet']['type'] && (a1['pX'] = a2 * parseFloat(a1['starting_point_x']) / 0x64 / units,
                a1['pZ'] = 0x0,
                a1['rY'] = 0x0,
                a1['inner_radius'] = q['params']['cabinet']['inner_radius'],
                a1['inner_radius']) && (a1['width'] = q['const']['calculated_width'] - q['const']['calculated_depth'],
                a1['pX'] = -q['const']['calculated_width'] / units / 0x2,
                a1['pZ'] = q['const']['calculated_width2'] / units / 0x2 - (q['const']['calculated_width2'] / units - q['const']['calculated_depth'] / units),
                a1['rY'] = -I),
                'corner_90' == q['params']['cabinet']['type'] && (a1['pX'] = -q['params']['cabinet']['width'] / units / 0x2,
                'left' == q['params']['cabinet']['orientation'] && (a1['rY'] = Math['PI'] / 0x2),
                'top' == q['params']['cabinet_group'] ? (a1['pZ'] = q['params']['cabinet']['width2'] / units / 0x2 - (q['params']['cabinet']['width2'] / units - q['const']['calculated_depth'] / units),
                'left' == q['params']['cabinet']['orientation'] && (a1['pX'] = q['params']['cabinet']['width'] / units / 0x2 - (q['params']['cabinet']['width'] / units - q['const']['calculated_depth'] / units),
                a1['pZ'] = q['params']['cabinet']['width2'] / units / 0x2)) : (a1['pZ'] = q['params']['cabinet']['width2'] / units / 0x2 - (q['params']['cabinet']['width2'] / units - q['const']['calculated_depth'] / units) + a1['thickness'] / units,
                'left' == q['params']['cabinet']['orientation'] && (a1['pX'] = q['params']['cabinet']['width'] / units / 0x2 - (q['params']['cabinet']['width'] / units - q['const']['calculated_depth'] / units) + q['params']['tabletop']['offset']['back'] / units,
                a1['pZ'] = q['params']['cabinet']['width2'] / units / 0x2 - q['params']['tabletop']['offset']['front'] / units + a1['thickness'] / units))),
                0x1 === this['params']['gola'] && 0x1 != project_settings['handle'][q['params']['cabinet_group']]['no_handle'] && 0x0 != facades_lib['get_defaults'](q['params']['cabinet_group'])['handle']) {
                    if ('corner' == q['params']['cabinet']['type'] || 'corner_90' == q['params']['cabinet']['type'] || 'false_facade' == q['params']['cabinet']['type'] || 'false_facade_facade' == q['params']['cabinet']['type'] || 'false_facade_facade_b' == q['params']['cabinet']['type'] || 'corner_open_facade' == q['params']['cabinet']['type'] || 'end_corner_facade' == q['params']['cabinet']['type'] || 'end_radius_facade' == q['params']['cabinet']['type'] || 'end_radius_facade_f' == q['params']['cabinet']['type'])
                        a1['handle_active'] = !0x1;
                    else {
                        if ('bottom' === a1['group']) {
                            if (0x1 != a1['no_handle_forced']) {
                                let aa = 0x19
                                  , ab = (custom_settings['g_height'] && (aa = custom_settings['g_height']),
                                a1['height'] -= aa,
                                a1['handle_model_type'] = 'common',
                                B - a1['pY'] + a1['height'] / units + aa / units == A['height'] / units && (a1['handle_model_type'] = 'model_tabletop'),
                                'simple_bottom' === a1['type'] && (a1['pY'] += 2.5,
                                B - (a1['pY'] + a1['height'] / units + aa / units) + 2.5 == 0x0) && (a1['handle_model_type'] = 'model_tabletop'),
                                0x2d0);
                                -0x1 < location['href']['indexOf']('mfleko') && (ab = 0x320),
                                custom_settings['gola_bottom_height'] && (ab = custom_settings['gola_bottom_height']),
                                a1['pY'] - B + a1['height'] / units + aa / units > ab / units && !0x1 === q['params']['tabletop']['active'] && 0x1 != custom_settings['gola_tmp'] && (a1['handle_active'] = !0x1,
                                a1['height'] += aa);
                            }
                        } else
                            0x1 === this['params']['gola'] && 0x1 != project_settings['handle'][q['params']['cabinet_group']]['no_handle'] && (a1['handle_model_type'] = 'model_top_module');
                    }
                }
                0x0 == facades_lib['get_defaults'](q['params']['cabinet_group'])['handle'] && 0x48 <= a1['pY'] && (a1['no_handle_group'] = 'top'),
                a1['index'] = W,
                a1['cabinet'] = this,
                a1['params_link'] = A['params']['doors'],
                'false_facade_facade' == q['params']['cabinet']['type'] && (a1['pY'] = 0x0),
                'end_corner_facade' == q['params']['cabinet']['type'] && (a1['pZ'] = 0x0,
                a1['pX'] = a2 * parseFloat(a1['starting_point_x']) / 0x64 / units),
                'end_radius_facade' == q['params']['cabinet']['type'] && ('right' === q['params']['cabinet']['orientation'] ? a1['pX'] = q['const']['calculated_width'] / units / 0x2 - q['params']['cabinet']['thickness'] / units / 0x2 : a1['pX'] = -q['const']['calculated_width'] / units / 0x2 + q['params']['cabinet']['thickness'] / units / 0x2,
                a1['pZ'] = q['const']['calculated_depth'] / units / 0x2 - (q['const']['calculated_depth'] - K) / units - q['params']['cabinet']['thickness'] / units,
                'right' === q['params']['cabinet']['orientation'] ? a1['rY'] = I : a1['rY'] = -I),
                'end_radius_facade_f' == q['params']['cabinet']['type'] && ('right' === q['params']['cabinet']['orientation'] ? a1['pX'] = q['const']['calculated_width'] / units / 0x2 - q['params']['cabinet']['thickness'] / units / 0x2 : a1['pX'] = -q['const']['calculated_width'] / units / 0x2 + q['params']['cabinet']['thickness'] / units / 0x2,
                a1['pZ'] = q['const']['calculated_depth'] / units / 0x2 - (q['const']['calculated_depth'] - K) / units - q['params']['cabinet']['thickness'] / units,
                'right' === q['params']['cabinet']['orientation'] ? a1['rY'] = I : a1['rY'] = -I),
                0x1 == Z['allow_z'] && (a1['pZ'] = Z['pZ']),
                0x1 == Z['allow_x'] && (a1['pX'] = Z['pX']),
                0x1 == Z['allow_y'] && (a1['pY'] = Z['pY']),
                0x1 == Z['allow_ry'] && (a1['rY'] = Z['rY']),
                0x1 == Z['allow_rx'] && (a1['rX'] = Z['rX']);
                var R = new Door_new(a1);
                R['userData']['cabinet'] = this,
                R['userData']['index'] = W,
                A['params']['doors'][W]['info'] = {
                    'width': R['params']['width'] - 0x2 * project_settings['door_offset'],
                    'height': R['params']['height'] - 0x2 * project_settings['door_offset'],
                    'material_code': materials_lib['get_item'](R['params']['material'][0x0])['code'],
                    'facade_code': R['params']['facade_code'] || ''
                },
                R['visible'] = a1['active'],
                A['obj_to_add']['add'](R),
                'false_facade_facade' == q['params']['cabinet']['type'] && q['params']['cabinet']['orientation'],
                'corner_open_facade' == q['params']['cabinet']['type'] && ('right' === q['params']['cabinet']['orientation'] ? (0x0 == W && R['position']['set'](-q['const']['calculated_width'] / units / 0x2, q['params']['cokol']['height'] / units, q['const']['calculated_depth'] / 0x2 / units),
                0x1 == W && (R['position']['set'](q['const']['calculated_width'] / units / 0x2 - C / units - a1['thickness'] / 0x4 / units, q['params']['cokol']['height'] / units, q['const']['calculated_depth'] / 0x2 / units - a1['thickness'] / 0x4 / units),
                R['rotation']['set'](0x0, Math['PI'] / 0x4, 0x0))) : (0x0 == W && R['position']['set'](q['const']['calculated_width'] / units / 0x2 - a1['width'] / units, q['params']['cokol']['height'] / units, q['const']['calculated_depth'] / 0x2 / units),
                0x1 == W && (R['position']['set'](-q['const']['calculated_width'] / units / 0x2 + a1['thickness'] / units / 0x2, q['params']['cokol']['height'] / units, -q['const']['calculated_depth'] / 0x2 / units + (q['const']['calculated_depth'] - C) / units - a1['thickness'] / units / 0x2),
                R['rotation']['set'](0x0, -Math['PI'] / 0x4, 0x0)))),
                q['params']['cabinet']['type'];
            }
        }
    }
}
,
Cabinet_new['prototype']['reset_model'] = function(f) {
    var g = f, h, j = [], k = [];
    if ((g = f ? f : this)['traverse'](function(l) {
        g !== l && 'Number' != l['name'] && 'Number' != l['parent']['name'] && 'ResizeControls' != l['name'] && 'ResizeControls' != l['parent']['name'] && ('CabinetCokol' !== l['temp_type'] && 'CabinetLeg' !== l['temp_type'] && 'Section' !== l['temp_type'] || k['push'](l),
        'Group' !== l['type']) && j['push'](l);
    }),
    j['length']) {
        for (h = j['length'] - 0x1; -0x1 < h; h--)
            j[h]['parent']['remove'](j[h]),
            j[h]['geometry'] && j[h]['geometry']['dispose'](),
            j[h]['material'] && !isArray(j[h]['material']) && j[h]['material']['map'] && j[h]['material']['map']['dispose'](),
            j['splice'](j['indexOf'](j[h]), 0x1);
    }
    if (k['length']) {
        for (h = k['length'] - 0x1; -0x1 < h; h--)
            'function' == typeof k[h]['delete'] ? k[h]['delete']() : k[h]['parent']['remove'](k[h]);
    }
}
,
Cabinet_new['prototype']['build_decorations'] = function(f) {
    if (f = f || !0x1,
    this['reset_model'](this['decorations']),
    this['params']['decorations']['length']) {
        var g = this;
        if (f) {
            for (let k = 0x0; k < this['params']['decorations']['length']; k++)
                check_material_in_category(facades_lib['get_defaults'](g['params']['cabinet_group'])['materials'], this['params']['decorations'][k]['material']) || (this['params']['decorations'][k]['material'] = void 0x0);
        }
        var h = new THREE['Box3']()['setFromObject'](this['cabinet'])['getSize'](new THREE['Vector3']());
        for (let l = 0x0; l < g['params']['decorations']['length']; l++) {
            var j = g['params']['decorations'][l];
            if (!j['type']) {
                let m = 0x0
                  , n = 0x0
                  , p = 0x0;
                var j = {
                    'width': void 0x0 !== j['width'] ? j['width'] : '100%',
                    'height': void 0x0 !== j['height'] ? j['height'] : '100%',
                    'thickness': void 0x0 !== j['thickness'] ? j['thickness'] : void 0x0,
                    'material': void 0x0 !== j['material'] ? j['material'] : void 0x0,
                    'material_type': void 0x0 !== j['material_type'] ? j['material_type'] : void 0x0,
                    'material_rotated': void 0x0 !== j['material_rotated'] ? j['material_rotated'] : project_settings['selected_materials'][g['params']['cabinet_group']]['facades_rotated'],
                    'is_triple': void 0x0 !== j['is_triple'] ? j['is_triple'] : 0x0,
                    'root': this,
                    'model': void 0x0 !== j['model'] ? j['model'] : void 0x0,
                    'group': g['params']['cabinet_group'],
                    'starting_point_x': void 0x0 !== j['starting_point_x'] ? j['starting_point_x'] : '0%',
                    'starting_point_y': void 0x0 !== j['starting_point_y'] ? j['starting_point_y'] : '0%',
                    'starting_point_z': void 0x0 !== j['starting_point_z'] ? j['starting_point_z'] : void 0x0,
                    'width_offset': void 0x0 !== j['width_offset'] ? j['width_offset'] : 0x0,
                    'direction_x': void 0x0 !== j['direction_x'] ? j['direction_x'] : 'right',
                    'direction_y': void 0x0 !== j['direction_y'] ? j['direction_y'] : 'top',
                    'pX': void 0x0 !== j['pX'] ? j['pX'] : 0x0,
                    'pY': void 0x0 !== j['pY'] ? j['pY'] : 0x0,
                    'pZ': void 0x0 !== j['pZ'] ? j['pZ'] : void 0x0,
                    'rZ': void 0x0 !== j['rZ'] ? j['rZ'] : 0x0,
                    'rY': void 0x0 !== j['rY'] ? j['rY'] : 0x0,
                    'accPX': void 0x0 !== j['accPX'] ? j['accPX'] : null
                };
                if (j['is_triple']) {
                    if (!facades_lib['get_defaults'](g['params']['cabinet_group'])['triple_decor_model'])
                        continue;
                    if (!facades_lib['get_defaults'](g['params']['cabinet_group'])['triple_decor_model']['model'])
                        continue;
                    j['model'] = facades_lib['get_defaults'](g['params']['cabinet_group'])['triple_decor_model']['model'],
                    j['height'] = facades_lib['get_defaults'](g['params']['cabinet_group'])['triple_decor_model']['height'],
                    j['thickness'] = facades_lib['get_defaults'](g['params']['cabinet_group'])['triple_decor_model']['thickness'];
                }
                'string' == typeof j['width'] && -0x1 < j['width']['indexOf']('%') && (j['width'] = g['const']['calculated_width'] * parseFloat(j['width']) / 0x64 - j['width_offset']),
                'string' == typeof j['height'] && -0x1 < j['height']['indexOf']('%') && (j['height'] = g['params']['cabinet']['height'] * parseFloat(j['height']) / 0x64),
                'string' == typeof j['thickness'] && -0x1 < j['thickness']['indexOf']('%') && (j['thickness'] = g['const']['calculated_depth'] * parseFloat(j['thickness']) / 0x64),
                m = j['pX'],
                n = j['pY'],
                p = j['pZ'],
                m = 'string' == typeof j['starting_point_x'] && -0x1 < j['starting_point_x']['indexOf']('%') || isNaN(parseInt(j['starting_point_x'])) ? 'center' === j['starting_point_x'] ? 0x0 : 'right' === j['direction_x'] ? -g['const']['calculated_width'] / units / 0x2 + g['const']['calculated_width'] * parseFloat(j['starting_point_x']) / 0x64 / units + j['width'] / units / 0x2 + j['width_offset'] / units / 0x2 : -g['const']['calculated_width'] / units / 0x2 + g['const']['calculated_width'] * parseFloat(j['starting_point_x']) / 0x64 / units - j['width'] / units / 0x2 + j['width_offset'] / units / 0x2 : -g['const']['calculated_width'] / units / 0x2 + j['starting_point_x'] / units + j['width'] / units / 0x2 + j['width_offset'] / units / 0x2,
                n = 'string' == typeof j['starting_point_y'] && -0x1 < j['starting_point_y']['indexOf']('%') ? 'center' === j['starting_point_y'] ? g['cabinet']['position']['y'] + h['y'] / 0x2 - j['height'] / units / 0x2 : 'top' === j['direction_y'] ? g['cabinet']['position']['y'] + g['params']['cabinet']['height'] * parseFloat(j['starting_point_y']) / 0x64 / units + j['height'] / units / 0x2 : g['cabinet']['position']['y'] + g['params']['cabinet']['height'] * parseFloat(j['starting_point_y']) / 0x64 / units - j['height'] / units / 0x2 : g['cabinet']['position']['y'] + j['starting_point_y'] / units + j['height'] / units / 0x2,
                p = void 0x0 !== j['starting_point_z'] ? 'string' == typeof j['starting_point_z'] && -0x1 < j['starting_point_z']['indexOf']('%') ? -g['const']['calculated_depth'] / units / 0x2 + g['const']['calculated_depth'] * parseFloat(j['starting_point_z']) / 0x64 / units + j['thickness'] / units / 0x2 : -g['const']['calculated_depth'] / units / 0x2 + j['starting_point_z'] / units : void 0x0 === j['pZ'] ? g['const']['calculated_depth'] / units / 0x2 + j['thickness'] / 0x2 / units + g['params']['cabinet']['back_wall_offset'] / units / 0x2 : j['pZ'],
                null != j['accPX'] && (m = j['accPX']);
                var j = new Decoration(j);
                this['decorations']['add'](j),
                j['position']['set'](m, n, p);
            }
        }
    }
}
,
Cabinet_new['prototype']['load_model'] = function() {
    for (let e = 0x0; e < this['models_to_load']['length']; e++)
        'function' == typeof this['models_to_load'][e]['load_model']() && 'not_loaded' === this['models_to_load'][e]['model_loaded'] && this['models_to_load'][e]['load_model']();
    this['model_loaded'] = 'loaded';
}
,
Cabinet_new['prototype']['build_hob'] = function() {
    for (var f = this, g = 0x0, h, h; g < f['models']['children']['length']; g++)
        'Hob' === f['models']['children'][g]['name'] && f['reset_model'](f['models']['children'][g]);
    !0x1 !== f['params']['hob']['active'] && (f['params']['cabinet']['width'] < 0x258 ? f['params']['hob']['model'] = 0x1e847f : f['params']['hob']['model'] = 0x2dc6c0,
    (h = objectFindByKey(models_catalog['items'], 'id', f['params']['hob']['model']))['service_name'] = 'Hob',
    h['name'] = 'Hob',
    (h = new Model_new(h))['position']['y'] = f['params']['cabinet']['height'] / units + f['params']['tabletop']['height'] / units + f['params']['cokol']['height'] / units - h['params']['height'] / units / 0x2,
    'corner' === f['params']['cabinet']['type'] && (h['rotation']['y'] = -Math['PI'] / 0x4),
    f['models']['add'](h),
    h['load_model']());
}
,
Cabinet_new['prototype']['build_oven'] = function() {
    for (var f = this, g = 0x0, h, j, h, h; g < f['models']['children']['length']; g++)
        'Oven' === f['models']['children'][g]['name'] && f['reset_model'](f['models']['children'][g]);
    !0x1 !== f['params']['oven']['active'] && ((h = objectFindByKey(models_catalog['items'], 'id', f['params']['oven']['model']))['service_name'] = 'Oven',
    h['name'] = 'Oven',
    j = new Model_new(h),
    h = void 0x0 === f['params']['oven']['pY'] ? f['cabinet']['position']['y'] + f['params']['cabinet']['height'] / units - j['params']['height'] / units - project_settings['door_offset'] / units : 'string' == typeof f['params']['oven']['pY'] && -0x1 < params['oven']['pY']['indexOf']('%') ? f['cabinet']['position']['y'] + f['params']['cabinet']['height'] * parseFloat(f['params']['oven']['pY']) / 0x64 / units : f['cabinet']['position']['y'] + f['params']['oven']['pY'] / units,
    j['position']['set'](0x0, h, f['const']['calculated_depth'] / units / 0x2),
    f['models']['add'](j),
    j['params']['width'] = f['const']['calculated_width'],
    setTimeout(function() {
        j['load_model']();
    }, 0x64));
}
,
Cabinet_new['prototype']['build_washer'] = function(f) {
    return void this['build_washer_new'](f);
    var f;
    if (!0x1 !== this['params']['sink']['active'])
        (f = washes_catalog[0x0])['active'] = !0x0,
        f['material'] = f['variants'][0x0]['material'],
        'corner_straight' === this['params']['cabinet']['type'] && ('left' == this['params']['cabinet']['orientation'] ? f['offset_x'] = -this['params']['cabinet']['width'] / units / 0x2 + f['width'] / units / 0x2 + 0x1 : f['offset_x'] = this['params']['cabinet']['width'] / units / 0x2 - f['width'] / units / 0x2 - 0x1),
        'common' === this['params']['cabinet']['type'] && (f['offset_x'] = 0x0,
        f['rotation'] = 0x0),
        'corner' === this['params']['cabinet']['type'] ? (f['rotation'] = -Math['PI'] / 0x4,
        f['offset_x'] = 0x0) : 'corner_90' === this['params']['cabinet']['type'] ? (f['rotation'] = -Math['PI'] / 0x4,
        f['offset_x'] = 15.4,
        f['offset_z'] = -7.1) : (f['rotation'] = 0x0,
        f['offset_x'] = 0x0),
        this['params']['sink'] = !0x1,
        this['params']['washer'] = f,
        this['build_washer_new'](!0x0);
    else {
        for (var g = this, h = 0x0, f, f, j, k, l, m; h < g['models']['children']['length']; h++)
            'Washer' === g['models']['children'][h]['name'] && (g['reset_model'](g['models']['children'][h]),
            g['models']['children'][h]['parent']['remove'](g['models']['children'][h]));
        !0x1 !== g['params']['sink']['active'] ? ((f = objectFindByKey(models_catalog['items'], 'id', g['params']['sink']['model']))['service_name'] = 'Washer',
        f['name'] = 'Sink',
        (f = new Model_new(f))['position']['y'] = g['params']['cabinet']['height'] / units + g['params']['tabletop']['height'] / units + g['params']['cokol']['height'] / units - f['params']['height'] / units / 0x2,
        g['models']['add'](f),
        f['load_model'](),
        'corner' !== g['params']['cabinet']['type'] && 'corner_90' !== g['params']['cabinet']['type'] || (f['rotation']['y'] = -Math['PI'] / 0x4),
        'corner_90' === g['params']['cabinet']['type'] && (f['position']['x'] = 0x5,
        f['position']['z'] = -0x5),
        this['cabinet']['top_wall'] && (this['cabinet']['top_wall']['visible'] = !0x1),
        j = new THREE['Path'](),
        f['box']['update'](),
        l = f['params']['width'] / units,
        m = f['params']['depth'] / units,
        'corner_straight' === g['params']['cabinet']['type'] && ('left' === g['params']['cabinet']['orientation'] ? f['position']['x'] = -g['params']['cabinet']['width'] / units / 0x2 + 0x1 + l / 0x2 : f['position']['x'] = g['params']['cabinet']['width'] / units / 0x2 - 0x1 - l / 0x2),
        'corner' === g['params']['cabinet']['type'] || 'corner_90' === g['params']['cabinet']['type'] ? (j['moveTo']((f['position']['x'] - l / 0x2) * Math['cos'](-Math['PI'] / 0x4) - (f['position']['z'] - m / 0x2) * Math['sin'](-Math['PI'] / 0x4), (f['position']['z'] - m / 0x2) * Math['cos'](-Math['PI'] / 0x4) + (f['position']['x'] - l / 0x2) * Math['sin'](-Math['PI'] / 0x4)),
        j['lineTo']((f['position']['x'] + l / 0x2) * Math['cos'](-Math['PI'] / 0x4) - (f['position']['z'] - m / 0x2) * Math['sin'](-Math['PI'] / 0x4), (f['position']['z'] - m / 0x2) * Math['cos'](-Math['PI'] / 0x4) + (f['position']['x'] + l / 0x2) * Math['sin'](-Math['PI'] / 0x4)),
        j['lineTo']((f['position']['x'] + l / 0x2) * Math['cos'](-Math['PI'] / 0x4) - (f['position']['z'] + m / 0x2) * Math['sin'](-Math['PI'] / 0x4), (f['position']['z'] + m / 0x2) * Math['cos'](-Math['PI'] / 0x4) + (f['position']['x'] + l / 0x2) * Math['sin'](-Math['PI'] / 0x4)),
        j['lineTo']((f['position']['x'] - l / 0x2) * Math['cos'](-Math['PI'] / 0x4) - (f['position']['z'] + m / 0x2) * Math['sin'](-Math['PI'] / 0x4), (f['position']['z'] + m / 0x2) * Math['cos'](-Math['PI'] / 0x4) + (f['position']['x'] - l / 0x2) * Math['sin'](-Math['PI'] / 0x4)),
        j['lineTo']((f['position']['x'] - l / 0x2) * Math['cos'](-Math['PI'] / 0x4) - (f['position']['z'] - m / 0x2) * Math['sin'](-Math['PI'] / 0x4), (f['position']['z'] - m / 0x2) * Math['cos'](-Math['PI'] / 0x4) + (f['position']['x'] - l / 0x2) * Math['sin'](-Math['PI'] / 0x4))) : (g['params']['cabinet']['type'],
        j['moveTo'](f['position']['x'] - l / 0x2, f['position']['z'] - m / 0x2),
        j['lineTo'](f['position']['x'] + l / 0x2, f['position']['z'] - m / 0x2),
        j['lineTo'](f['position']['x'] + l / 0x2, f['position']['z'] + m / 0x2),
        j['lineTo'](f['position']['x'] - l / 0x2, f['position']['z'] + m / 0x2),
        j['lineTo'](f['position']['x'] - l / 0x2, f['position']['z'] - m / 0x2)),
        g['params']['tabletop']['holes'] = [j],
        g['build_tabletop'](),
        this['tabletop']['needs_rebuild'] = !0x0) : (this['tabletop']['needs_rebuild'] = !0x0,
        this['cabinet']['top_wall'] && (this['cabinet']['top_wall']['visible'] = !0x0),
        this['tabletop']['needs_rebuild'] = !0x1,
        g['params']['tabletop']['holes'] = void 0x0,
        g['build_tabletop']());
    }
}
,
Cabinet_new['prototype']['build_washer_new'] = function(f=!0x1) {
    let g = this;
    if (this['washer']['children'][0x0] && (this['params']['washer'] = copy_object(this['washer']['children'][0x0]['params'])),
    null == this['params']['washer']['id']) {
        if (!this['params']['sink']['active'])
            return;
        this['params']['washer'] = washes_lib['get_item'](0x0);
    }
    let h = {
        'id': 0x1,
        'offset_x': 0x1,
        'offset_z': 0x1,
        'flipped': 0x1,
        'material': 0x1,
        'rotation': 0x1
    };
    var f, f, j;
    if (Object['keys'](this['params']['washer'])['forEach'](l => {
        h[l] || delete this['params']['washer'][l];
    }
    ),
    0x1 == f)
        return null != this['params']['washer']['id'] ? (f = washes_lib['get_item'](this['params']['washer']['id']),
        g['params']['washer']['offset_z'] || (g['params']['washer']['offset_z'] = 0x0),
        g['params']['washer']['offset_x'] || ('corner_straight' == g['params']['cabinet']['type'] ? 'left' == g['params']['cabinet']['orientation'] ? g['params']['washer']['offset_x'] = -g['params']['cabinet']['width'] / units / 0x4 : g['params']['washer']['offset_x'] = g['params']['cabinet']['width'] / units / 0x4 : 'corner_90' == g['params']['cabinet']['type'] ? (g['params']['washer']['offset_x'] = 15.4,
        g['params']['washer']['offset_z'] = -7.8) : g['params']['washer']['offset_x'] = 0x0),
        g['params']['washer']['rotation'] || ('corner' == g['params']['cabinet']['type'] || 'corner_90' == g['params']['cabinet']['type'] ? g['params']['washer']['rotation'] = -Math['PI'] / 0x4 : g['params']['washer']['rotation'] = 0x0),
        g['reset_model'](g['washer']),
        g['build_tabletop'](),
        f['offset_x'] = this['params']['washer']['offset_x'],
        f['offset_z'] = this['params']['washer']['offset_z'],
        f['flipped'] = this['params']['washer']['flipped'],
        f['material'] = this['params']['washer']['material'],
        f['rotation'] = this['params']['washer']['rotation'],
        f = new Washer(f),
        this['washer']['add'](f),
        f['position']['y'] = g['cabinet']['position']['y'] + g['params']['cabinet']['height'] / units + g['params']['tabletop']['height'] / units,
        f['position']['x'] = g['params']['washer']['offset_x'],
        f['position']['z'] = g['params']['washer']['offset_z'],
        f['load_model'](),
        k(f),
        this['rebuild_wahser_top_wall'](),
        void (0x1 == constructor_settings['tabletop_v2'] && sc['build_tabletop']())) : void 0x0;
    function k(m) {
        let n = setInterval(function() {
            if ('loaded' == m['model_loaded'] && 'loaded' == m['smes']['model_loaded'] && (clearInterval(n),
            0x0 < m['model']['children']['length'])) {
                let B = '';
                for (let C = m['model']['children']['length'] - 0x1; 0x0 <= C; C--)
                    if (-0x1 < m['model']['children'][C]['name']['indexOf']('cut')) {
                        B = m['model']['children'][C]['clone']();
                        break;
                    }
                var q = g['tabletop']['children'][0x0]['mesh']
                  , u = q['clone']()
                  , v = (B['geometry']['rotateY'](g['params']['washer']['rotation']),
                B['geometry']['translate'](m['position']['x'], 0x0, m['position']['z']),
                B['geometry']['attributes']['position']);
                for (let D = 0x0; D < v['count']; D++) {
                    var w = v['getX'](D), x = v['getY'](D), y = v['getZ'](D), z, A;
                    let E = x;
                    E = x < 0x0 ? -0xa : 0xa,
                    v['setXYZ'](D, w, E, y);
                }
                var u = csggeom(u, [B], 'subtract');
                B['geometry']['translate'](-m['position']['x'], 0x0, -m['position']['z']),
                B['geometry']['rotateY'](-g['params']['washer']['rotation']),
                q['geometry'] = u,
                'edges' != global_options['mode'] && (q['material']['transparent'] = !0x1),
                m['rotation']['y'] = g['params']['washer']['rotation'];
            }
        }, 0x64);
    }
    this['washer']['children']['length'] ? (g['params']['washer']['offset_z'] || (g['params']['washer']['offset_z'] = 0x0),
    g['params']['washer']['offset_x'] || (g['params']['washer']['offset_x'] = 0x0),
    g['params']['washer']['rotation'] || (g['params']['washer']['rotation'] = 0x0),
    k(this['washer']['children'][0x0]),
    this['rebuild_wahser_top_wall']()) : (this['cabinet']['back_wall'] && (this['cabinet']['back_wall']['visible'] = !0x0),
    sc['get_price'](),
    g['build_tabletop'](),
    this['params']['washer'] = {}),
    0x1 == constructor_settings['tabletop_v2'] && sc['build_tabletop']();
}
,
Cabinet_new['prototype']['remove_wahser_new'] = function(e) {
    var f = this;
    this['reset_model'](this['washer']),
    this['params']['washer'] = {},
    this['params']['sink'] = {},
    this['build_tabletop'](),
    this['rebuild_wahser_top_wall'](!0x0);
}
,
Cabinet_new['prototype']['rebuild_washer_tabletop'] = function() {
    this['build_tabletop'](),
    this['rebuild_wahser_top_wall'](!0x0);
}
,
Cabinet_new['prototype']['rebuild_wahser_top_wall'] = function(e) {
    var f = this;
    e ? ('common' != this['params']['cabinet']['type'] && 'corner_straight' != this['params']['cabinet']['type'] || (this['cabinet']['back_wall'] && (this['cabinet']['back_wall']['visible'] = !0x0,
    this['params']['cabinet']['back_wall'] = !0x0),
    this['cabinet']['top_wall'] && (this['cabinet']['top_wall']['rotation']['x'] = Math['PI'] / 0x2,
    this['cabinet']['top_wall']['position']['z'] = -this['const']['calculated_depth'] / 0x2 / units + f['params']['cabinet']['tsarg_width'] / units / 0x2,
    this['cabinet']['top_wall']['position']['y'] = this['params']['cabinet']['height'] / units - f['params']['cabinet']['thickness'] / units / 0x2),
    this['cabinet']['top_wall_2'] && (this['cabinet']['top_wall_2']['rotation']['x'] = Math['PI'] / 0x2,
    this['cabinet']['top_wall_2']['position']['z'] = this['const']['calculated_depth'] / 0x2 / units - f['params']['cabinet']['tsarg_width'] / units / 0x2,
    this['cabinet']['top_wall_2']['position']['y'] = this['params']['cabinet']['height'] / units - f['params']['cabinet']['thickness'] / units / 0x2),
    (0x1 === this['params']['gola'] && this['params']['doors']['length'] && 0x1 != project_settings['handle'][f['params']['cabinet_group']]['no_handle'] || 0x1 === this['params']['gola'] && this['params']['lockers']['length'] && 0x1 != project_settings['handle'][f['params']['cabinet_group']]['no_handle']) && this['params']['cabinet']['height'] < 0x384 && (this['cabinet']['top_wall_2']['position']['z'] = this['const']['calculated_depth'] / units / 0x2 - f['params']['cabinet']['tsarg_width'] / units / 0x2 - 0x3)),
    'corner_90' == this['params']['cabinet']['type'] && (this['cabinet']['right_back_wall'] && (this['cabinet']['right_back_wall']['visible'] = !0x0),
    this['cabinet']['top_wall']['rotation']['y'] = 0x0,
    this['cabinet']['top_wall_2']['rotation']['y'] = 0x0,
    this['cabinet']['top_wall_3']['rotation']['x'] = Math['PI'] / 0x2,
    this['cabinet']['top_wall']['position']['y'] = this['params']['cabinet']['height'] / units - f['params']['cabinet']['thickness'] / units / 0x2,
    this['cabinet']['top_wall']['position']['x'] = this['const']['calculated_width'] / units / 0x2 - f['params']['cabinet']['tsarg_width'] / units / 0x2,
    this['cabinet']['top_wall_2']['position']['y'] = this['params']['cabinet']['height'] / units - f['params']['cabinet']['thickness'] / units / 0x2,
    this['cabinet']['top_wall_2']['position']['x'] = this['const']['calculated_width'] / units / 0x2 - this['const']['calculated_depth'] / units + f['params']['cabinet']['tsarg_width'] / units / 0x2,
    this['cabinet']['top_wall_3']['position']['y'] = this['params']['cabinet']['height'] / units - f['params']['cabinet']['thickness'] / units / 0x2,
    this['cabinet']['top_wall_3']['position']['z'] = -this['const']['calculated_width'] / units / 0x2 + this['const']['calculated_depth'] / units - f['params']['cabinet']['tsarg_width'] / units / 0x2),
    'corner' == this['params']['cabinet']['type'] && 0x1 != f['params']['cabinet']['inner_radius'] && (this['cabinet']['top_wall_2'] && (this['cabinet']['top_wall_2']['visible'] = !0x0),
    this['cabinet']['left_back_wall'] && (this['cabinet']['left_back_wall']['visible'] = !0x0),
    this['cabinet']['top_wall']['rotation']['x'] = Math['PI'] / 0x2,
    this['cabinet']['top_wall']['position']['y'] = this['params']['cabinet']['height'] / units - f['params']['cabinet']['thickness'] / units / 0x2,
    this['cabinet']['top_wall']['position']['z'] = -this['const']['calculated_width'] / units / 0x2 + f['params']['cabinet']['tsarg_width'] / units / 0x2),
    'corner' == this['params']['cabinet']['type'] && 0x1 == f['params']['cabinet']['inner_radius'] && (this['cabinet']['top_wall_2'] && (this['cabinet']['top_wall_2']['visible'] = !0x0),
    this['cabinet']['left_back_wall'] && (this['cabinet']['left_back_wall']['visible'] = !0x0),
    this['cabinet']['top_wall']['rotation']['x'] = Math['PI'] / 0x2,
    this['cabinet']['top_wall']['position']['y'] = this['params']['cabinet']['height'] / units - f['params']['cabinet']['thickness'] / units / 0x2,
    this['cabinet']['top_wall']['position']['z'] = -this['const']['calculated_width'] / units / 0x2 + f['params']['cabinet']['tsarg_width'] / units / 0x2)) : ('common' != this['params']['cabinet']['type'] && 'corner_straight' != this['params']['cabinet']['type'] || (this['cabinet']['back_wall'] && (this['params']['cabinet']['back_wall'] = !0x1,
    this['cabinet']['back_wall']['visible'] = !0x1),
    this['cabinet']['top_wall'] && (this['cabinet']['top_wall']['rotation']['x'] = 0x0,
    this['cabinet']['top_wall']['position']['z'] = -this['const']['calculated_depth'] / 0x2 / units + f['params']['cabinet']['thickness'] / units / 0x2,
    this['cabinet']['top_wall']['position']['y'] = this['params']['cabinet']['height'] / units - f['params']['cabinet']['tsarg_width'] / units / 0x2),
    this['cabinet']['top_wall_2'] && (this['cabinet']['top_wall_2']['rotation']['x'] = 0x0,
    this['cabinet']['top_wall_2']['position']['z'] = this['const']['calculated_depth'] / 0x2 / units - f['params']['cabinet']['thickness'] / units / 0x2,
    this['cabinet']['top_wall_2']['position']['y'] = this['params']['cabinet']['height'] / units - f['params']['cabinet']['tsarg_width'] / units / 0x2),
    (0x1 === this['params']['gola'] && this['params']['doors']['length'] && 0x1 != project_settings['handle'][f['params']['cabinet_group']]['no_handle'] || 0x1 === this['params']['gola'] && this['params']['lockers']['length'] && 0x1 != project_settings['handle'][f['params']['cabinet_group']]['no_handle']) && this['params']['cabinet']['height'] < 0x384 && (this['cabinet']['top_wall_2']['position']['z'] = this['const']['calculated_depth'] / units / 0x2 - f['params']['cabinet']['thickness'] / units / 0x2 - 0x3)),
    'corner_90' == this['params']['cabinet']['type'] && (this['cabinet']['right_back_wall'] && (this['cabinet']['right_back_wall']['visible'] = !0x1),
    this['cabinet']['top_wall']) && (this['cabinet']['top_wall']['rotation']['y'] = Math['PI'] / 0x2,
    this['cabinet']['top_wall_2']['rotation']['y'] = Math['PI'] / 0x2,
    this['cabinet']['top_wall_3']['rotation']['x'] = 0x0,
    this['cabinet']['top_wall']['position']['y'] = this['params']['cabinet']['height'] / units - f['params']['cabinet']['tsarg_width'] / units / 0x2,
    this['cabinet']['top_wall']['position']['x'] = this['const']['calculated_width'] / units / 0x2 - this['params']['cabinet']['thickness'] / units / 0x2,
    this['cabinet']['top_wall_2']['position']['y'] = this['params']['cabinet']['height'] / units - f['params']['cabinet']['tsarg_width'] / units / 0x2,
    this['cabinet']['top_wall_2']['position']['x'] = this['const']['calculated_width'] / units / 0x2 - this['const']['calculated_depth'] / units + this['params']['cabinet']['thickness'] / units / 0x2,
    this['cabinet']['top_wall_3']['position']['y'] = this['params']['cabinet']['height'] / units - f['params']['cabinet']['tsarg_width'] / units / 0x2,
    this['cabinet']['top_wall_3']['position']['z'] = -this['const']['calculated_width'] / units / 0x2 + this['const']['calculated_depth'] / units - this['params']['cabinet']['thickness'] / units / 0x2),
    'corner' == this['params']['cabinet']['type'] && 0x1 != f['params']['cabinet']['inner_radius'] && (this['cabinet']['top_wall_2'] && (this['cabinet']['top_wall_2']['visible'] = !0x1),
    this['cabinet']['left_back_wall'] && (this['cabinet']['left_back_wall']['visible'] = !0x1),
    this['cabinet']['top_wall']['rotation']['x'] = 0x0,
    this['cabinet']['top_wall']['position']['y'] = this['params']['cabinet']['height'] / units - f['params']['cabinet']['tsarg_width'] / units / 0x2,
    this['cabinet']['top_wall']['position']['z'] = -this['const']['calculated_width'] / units / 0x2 + f['params']['cabinet']['thickness'] / units / 0x2),
    'corner' == this['params']['cabinet']['type'] && 0x1 == f['params']['cabinet']['inner_radius'] && (this['cabinet']['top_wall_2'] && (this['cabinet']['top_wall_2']['visible'] = !0x1),
    this['cabinet']['left_back_wall'] && (this['cabinet']['left_back_wall']['visible'] = !0x1),
    this['cabinet']['top_wall']['rotation']['x'] = 0x0,
    this['cabinet']['top_wall']['position']['y'] = this['params']['cabinet']['height'] / units - f['params']['cabinet']['tsarg_width'] / units / 0x2,
    this['cabinet']['top_wall']['position']['z'] = -this['const']['calculated_width'] / units / 0x2 + f['params']['cabinet']['thickness'] / units / 0x2)),
    'function' == typeof after_washer_build && after_washer_build(this, e),
    sc['get_price']();
}
,
Cabinet_new['prototype']['build_fixed_models'] = function() {
    var f = this;
    for (let q = 0x0; q < f['fixed_models']['children']['length']; q++)
        f['reset_model'](f['fixed_models']['children'][q]),
        f['built_in_models']['remove'](f['fixed_models']['children'][q]);
    for (let u = 0x0; u < f['params']['fixed_models']['length']; u++) {
        var g = Object['assign']({}, f['params']['fixed_models'][u])
          , h = (g['pos'] || (g['pos'] = {}),
        g['pos']['oz'] || (g['pos']['oz'] = 0x0),
        g['pos']['y'] || (g['pos']['y'] = 0x0),
        g['pos']['x'] || (g['pos']['x'] = 0x0),
        g['pos']['z'] || (g['pos']['z'] = null),
        g['rot'] || (g['rot'] = {}),
        g['rot']['y'] || (g['rot']['y'] = 0x0),
        g['rot']['y'] * Math['PI'] / 0xb4)
          , j = (g['width'] += '',
        g['height'] += '',
        g['depth'] += '',
        -0x1 < g['width']['indexOf']('%') && (g['width'] = f['params']['cabinet']['width'] * parseInt(g['width']) / 0x64),
        -0x1 < g['height']['indexOf']('%') && (g['height'] = (f['params']['cabinet']['height'] + f['params']['cokol']['height']) * parseInt(g['height']) / 0x64),
        -0x1 < g['depth']['indexOf']('%') && (g['depth'] = f['const']['calculated_depth'] * parseInt(g['depth']) / 0x64),
        new Simple_model(g));
        -0x1 < j['params']['model']['indexOf']('dishwasher') ? j['position']['y'] = j['params']['height'] / units / 0x2 : (j['position']['y'] = f['cabinet']['position']['y'] + j['params']['height'] / units / 0x2 + g['pos']['y'] / units,
        null == g['pos']['z'] ? j['position']['z'] = f['const']['calculated_depth'] / units / 0x2 + g['pos']['oz'] / units + f['params']['cabinet']['back_wall_offset'] / units / 0x2 : j['position']['z'] = g['pos']['z'],
        j['position']['x'] = g['pos']['x']),
        j['rotation']['y'] = h,
        this['fixed_models']['add'](j);
    }
    for (let v = f['built_in_models']['children']['length']; v--; )
        f['reset_model'](f['built_in_models']['children'][v]),
        f['built_in_models']['remove'](f['built_in_models']['children'][v]);
    for (let w = 0x0; w < f['params']['built_in_models']['length']; w++) {
        var k = f['params']['built_in_models'][w];
        if (0x0 == k['active'])
            f['built_in_models']['add'](new THREE['Group']());
        else {
            let x = 0x0;
            var l = copy_object(bim_models['items'][k['id']]), m;
            for (let y = 0x0; y < l['variants']['length']; y++) {
                var p = l['variants'][y];
                0x0 < p['module_width'] && p['module_width'] == f['params']['cabinet']['width'] && (l['selected_variant'] = y,
                x = 0x1);
            }
            0x1 == x && (l['immediate_load'] = 0x1,
            (m = new Model_new(l))['position']['y'] += k['pY'] / units,
            m['position']['z'] += k['pZ'] / units,
            f['built_in_models']['add'](m));
        }
    }
}
,
Cabinet_new['prototype']['build_models'] = function() {
    this['model']['position']['y'] = this['cabinet']['position']['y'];
    for (let g = 0x0; g < this['model']['children']['length']; g++)
        this['reset_model'](e['model']['children'][g]),
        this['model']['remove'](e['model']['children'][g]);
    let e = this;
    for (let h = 0x0; h < this['params']['models']['length']; h++)
        f(this['params']['models'][h]);
    function f(j) {
        var k, j = _['merge']({
            'spec': {
                'catalog': 'interior',
                'absolute_size': !0x1,
                'id': 0x5,
                'use_model_size': !0x1,
                'compatible': {
                    'items': [],
                    'categories': []
                },
                'sizes': []
            },
            'size': {
                'x': 0x1f4,
                'y': 0x612,
                'z': 0x123
            },
            'pos': {
                'x': '50%',
                'y': '100%',
                'z': '100%'
            },
            'pivot': {
                'x': 0x0,
                'y': -0x1,
                'z': 0x1
            },
            'rot': {
                'x': 0x0,
                'y': 0x0,
                'z': 0x0
            }
        }, j), m = e['params']['cabinet']['width'], p = e['params']['cabinet']['height'], q = e['params']['cabinet']['depth'], u = (j['size']['x'] = convert_size(j['size']['x'], m),
        j['size']['y'] = convert_size(j['size']['y'], p),
        j['size']['z'] = convert_size(j['size']['z'], q),
        {
            'x': -m / units / 0x2,
            'y': -j['size']['y'] / units / 0x2,
            'z': -q / units / 0x2
        }), v = (0x1 == j['pivot']['z'] && (u['z'] = -q / units / 0x2 - e['params']['tabletop']['offset']['front'] / units / 0x2),
        models_lib[j['spec']['catalog']]['get_item'](j['spec']['id'])), w = (v['draggable'] = !0x1,
        v['sizes_available'] = !0x1,
        {}), m = (w['x'] = conv_val(j['pos']['x'], m) / units,
        w['y'] = conv_val(j['pos']['y'], p) / units,
        w['z'] = conv_val(j['pos']['z'], q) / units,
        {});
        m['x'] = conv_pivot(j['pivot']['x'], j['size']['x']),
        m['y'] = conv_pivot(j['pivot']['y'], j['size']['y']),
        m['z'] = conv_pivot(j['pivot']['z'], j['size']['z']),
        v['variants'][0x0]['width'] = j['size']['x'],
        v['variants'][0x0]['height'] = j['size']['y'],
        v['variants'][0x0]['depth'] = j['size']['z'];
        let x = new Model_new(v);
        x['position']['set'](u['x'] + w['x'], u['y'] + w['y'], u['z'] + w['z']),
        x['translateX'](m['x'] / units),
        x['translateY'](m['y'] / units),
        x['translateZ'](m['z'] / units),
        e['model']['add'](x),
        setTimeout(function() {
            x['load_model']();
        }, 0x64);
    }
}
,
Cabinet_new['prototype']['add_window_light'] = function(f, g, h) {
    var j = create_light();
    j['light_type'] = h,
    j['visible'] = !0x1,
    this['lights']['add'](j),
    j['position']['set'](f, g, 0x0);
}
,
Cabinet_new['prototype']['build_lights'] = function() {
    for (var e = this, f = 0x0; f < e['lights']['children']['length']; f++)
        'door' !== e['lights']['children'][f]['light_type'] && e['lights']['remove'](e['lights']['children'][f]);
}
,
Cabinet_new['prototype']['has_glass'] = function(e) {
    for (let g = this['doors']['children']['length']; g--; )
        if (this['doors']['children'][g]['has_glass']())
            return !0x0;
    for (let h = this['lockers']['children']['length']; h--; )
        if (this['lockers']['children'][h]['has_glass']())
            return !0x0;
    for (let i = 0x0; i < this['sections']['children']['length']; i++) {
        var f = this['sections']['children'][i];
        if (f['doors']) {
            for (let j = f['doors']['children']['length']; j--; )
                if (f['doors']['children'][j]['has_glass']())
                    return !0x0;
        }
        if (f['lockers']) {
            for (let k = f['lockers']['children']['length']; k--; )
                if (f['lockers']['children'][k]['has_glass']())
                    return !0x0;
        }
    }
    return !0x1;
}
,
Cabinet_new['prototype']['open_all'] = function() {
    for (let f = 0x0; f < this['doors']['children']['length']; f++)
        this['doors']['children'][f]['click']();
    for (let g = 0x0; g < this['lockers']['children']['length']; g++)
        this['lockers']['children'][g]['click']();
    for (let h = 0x0; h < this['sections']['children']['length']; h++) {
        var e = this['sections']['children'][h];
        if (e['doors']) {
            for (let i = e['doors']['children']['length']; i--; )
                e['doors']['children'][i]['click']();
        }
        if (e['lockers']) {
            for (let j = e['lockers']['children']['length']; j--; )
                e['lockers']['children'][j]['click']();
        }
    }
}
,
Cabinet_new['prototype']['set_side'] = function(e) {
    'dsp' == e['style'] ? this['params']['cabinet'][e['side'] + '_wall'] = !0x0 : (this['params']['cabinet']['sides'][e['side']] = {
        'style': e['style'],
        'fac_id': e['fac_id'],
        'mat_id': e['mat_id']
    },
    this['params']['cabinet'][e['side'] + '_wall'] = 'facade'),
    this['build']();
}
,
Cabinet_new['prototype']['set_fly_height'] = function(e) {
    var f = (e - this['params']['fly_height']) / units;
    this['translate_washers']({
        'y': f
    }),
    this['params']['fly_height'] = e,
    this['build']();
}
,
Cabinet_new['prototype']['translate_washers'] = function(f, g) {
    if (f && (f['x'] || f['y'] || f['z'])) {
        var h, j;
        _['defaults'](f, {
            'x': 0x0,
            'y': 0x0,
            'z': 0x0
        });
        for (j of g || this['find_washers']())
            j['reset_related_tabletop_parts'](),
            j['position']['add'](f);
    }
}
,
Cabinet_new['prototype']['find_washers'] = function() {
    var f;
    if (!constructor_settings['core_v2']) {
        let m = this['userData']['tabletopGroup'] || this['find_tabletop_group']();
        if (!m)
            return [];
        let n = m['groupObject'];
        if (!n)
            return [];
        if (0x1 === Object['keys'](m['objs'])['length'])
            return _['map'](_['get'](n, 'userData.washers'), r => r['obj']);
        let p = this['box']
          , q = _(_['get'](n, 'userData.washers'))['filter'](r => r['box']['intersectsBox'](p))['map'](r => r['obj']);
        return q;
    }
    if (!this['userData']['parts']['tabletop']['length'])
        return [];
    if (this['is_detached_tabletop']()) {
        let r = this['userData']['parts']['tabletop'][0x0];
        return _['map'](_['get'](r, 'userData.washers'), u => u['obj']);
    }
    let g = this['userData']['tabletopGroup'] || this['find_tabletop_group']();
    if (!g)
        return [];
    var h = g['info']['groupObject'];
    if (!h)
        return [];
    let j = h['userData']['parts']['tabletop'][0x0];
    if (0x1 === g['items']['length'])
        return _['map'](_['get'](j, 'userData.washers'), u => u['obj']);
    let k = this['box']
      , l = _(_['get'](j, 'userData.washers'))['filter'](u => u['box']['intersectsBox'](k))['map'](u => u['obj']);
    return l;
}
,
Cabinet_new['prototype']['find_tabletop_group'] = function() {
    var f;
    if (!constructor_settings['core_v2']) {
        if (this['params']['tabletop']?.['active']) {
            for (var g of global_data['tabletop']['desc'])
                if (g['objs'][this['uuid']])
                    return g;
        }
    } else {
        if (this['userData']['parts']['tabletop']['length']) {
            for (var h of pp['info']['tabletop']['desc'])
                for (var j of h['items'])
                    if (j['sourceObject'] === this)
                        return h;
        }
    }
    return null;
}
,
Cabinet_new['prototype']['get_child_by_path'] = function(f, g, h) {
    var h = h || this, g, j;
    if (f) {
        if (g)
            return (g = _['get'](h, 'params.template.tree.children')) && g['length'] && (j = f['slice'](0x2)['replaceAll'](',', '.children.')) ? _['get'](g, j) : null;
        var k = h['userData']['parts_by_path'];
        if (k)
            for (var l in k) {
                var l = k[l];
                if (l && l['hasOwnProperty'](f))
                    return l[f];
            }
    }
    return null;
}
,
Cabinet_new['prototype']['get_hierarchy'] = function(e) {
    var e = e || this['userData']['cabinet'], e;
    return (e = e && get_object_hierarchy(e)) ? [e] : [];
}
,
Cabinet_new['prototype']['change_toggle'] = function(e, f) {
    var e = this['get_child_by_path'](e, !0x0);
    e && e['toggle'] && (e['toggle']['value'] = to_int(f));
}
,
Cabinet_new['prototype']['get_variables'] = function() {
    let e = [];
    return this['userData']?.['computed']?.['variables'] && (Object['keys'](this['userData']['computed']['variables'])['forEach'](f => {
        0x1 == this['userData']['computed']['variables'][f]['editable'] && e['push'](this['userData']['computed']['variables'][f]);
    }
    ),
    (e = copy_object(e))['sort']( (f, g) => void 0x0 === f['order'] && void 0x0 === g['order'] ? 0x0 : void 0x0 === f['order'] ? 0x1 : void 0x0 === g['order'] ? -0x1 : f['order'] - g['order'])),
    copy_object(e);
}
,
(Cabinet_new['prototype']['build_common'] = function() {
    var q = this
      , A = q['cabinet']
      , B = q['const']['calculated_width'] / units
      , D = q['params']['cabinet']['height'] / units
      , E = q['const']['calculated_depth'] / units
      , G = q['params']['cabinet']['thickness_back'] / units
      , H = q['params']['cabinet']['back_wall_offset'] / units
      , I = q['params']['cabinet']['thickness'] / units;
    this['userData']['sides'] || (this['userData']['sides'] = {
        'left': null,
        'right': null
    });
    let J = this['params']['cabinet']['sides']['left']['style']
      , K = this['params']['cabinet']['sides']['right']['style'];
    var L = this['params']['cabinet']['sides']['left']['fac_id']
      , N = this['params']['cabinet']['sides']['right']['fac_id']
      , P = this['params']['cabinet']['sides']['left']['mat_id']
      , Q = this['params']['cabinet']['sides']['right']['mat_id'];
    if (0x1 == constructor_settings['module_sides_version']) {
        for (let ac = q['params']['doors']['length']; ac--; )
            'right_wall' == q['params']['doors'][ac]['tag'] && (K = q['params']['doors'][ac]['style'],
            this['params']['cabinet']['sides']['right']['style'] = K),
            'left_wall' == q['params']['doors'][ac]['tag'] && (J = q['params']['doors'][ac]['style'],
            this['params']['cabinet']['sides']['left']['style'] = J);
    }
    if ('facade' != q['params']['left_wall'] || 'facade_simple' != q['params']['left_wall']) {
        for (let ad = q['params']['doors']['length']; ad--; )
            'left_wall' == q['params']['doors'][ad]['tag'] && (q['params']['doors']['splice'](ad, 0x1),
            q['doors']['remove'](q['doors']['children'][ad]));
    }
    if ('facade' != q['params']['right_wall'] || 'facade_simple' != q['params']['left_wall']) {
        for (let ae = q['params']['doors']['length']; ae--; )
            'right_wall' == q['params']['doors'][ae]['tag'] && (q['params']['doors']['splice'](ae, 0x1),
            q['doors']['remove'](q['doors']['children'][ae]));
    }
    let R = 0x0;
    if (0x2 == this['params']['version'] && (R = H,
    H = 0x0),
    0x1 == this['params']['cabinet']['back_wall']) {
        if (this['params']['back_walls']['length'])
            for (let af = this['params']['back_walls']['length']; af--; ) {
                var S = _['merge']({
                    'size': {
                        'x': '100%',
                        'y': '100%',
                        'z': q['params']['cabinet']['thickness_back']
                    },
                    'pos': {
                        'x': '0%',
                        'y': '0%'
                    },
                    'dir': {
                        'x': 0x1,
                        'y': 0x1
                    },
                    'offset': {
                        'x': [0x0, 0x0],
                        'y': [0x0, 0x0]
                    },
                    'material': {
                        'id': q['params']['cabinet']['back_wall_material']['id'],
                        'rotated': 0x1,
                        'fixed': 0x0
                    }
                }, this['params']['back_walls'][af])
                  , T = convert_offset(q['const']['calculated_width'], S['offset']['x'])
                  , U = convert_offset(q['params']['cabinet']['height'], S['offset']['y'])
                  , W = convert_size(q['const']['calculated_width'], S['size']['x'], T) - q['params']['cabinet']['thickness']
                  , a0 = convert_size(q['params']['cabinet']['height'], S['size']['y'], U) - q['params']['cabinet']['thickness']
                  , T = convert_position(q['const']['calculated_width'] - q['params']['cabinet']['thickness'], S['pos']['x'], S['dir']['x'], W, T)
                  , U = convert_position(q['params']['cabinet']['height'] - q['params']['cabinet']['thickness'], S['pos']['y'], S['dir']['y'], a0, U)
                  , W = {
                    'width': W / units,
                    'height': a0 / units,
                    'thickness': S['size']['z'] / units,
                    'pX': -B / 0x2 + I / 0x2 + T / units,
                    'pY': U / units + I / 0x2,
                    'pZ': -E / 0x2 + S['size']['z'] / units / 0x2 - 0.1 + R,
                    'name': 'back_wall',
                    'material': S['material']['id'],
                    'material_rotated': S['material']['rotated'],
                    'material_fixed': S['material']['fixed']
                }
                  , a0 = Object_wall(W);
                A['add'](a0);
            }
        else
            A['back_wall'] = Object_wall({
                'width': B - I,
                'height': D - I,
                'thickness': G,
                'pX': 0x0,
                'pY': D / 0x2,
                'pZ': -E / 0x2 + G / 0x2 - 0.1 + R,
                'name': 'back_wall',
                'material': q['params']['cabinet']['back_wall_material']['id']
            }),
            A['add'](A['back_wall']);
    }
    let a1, a2, a3, a4 = (a3 = 0x1 == constructor_settings['module_sides_version'] ? a2 = facades_lib['items'][q['params']['facade']['id']] ? parseInt(facades_lib['items'][q['params']['facade']['id']]['thickness']) : 0x12 : (isNaN(parseInt(J)) && (J = facades_lib['items'][L]['compatibility_types'][J]),
    isNaN(parseInt(K)) && (K = facades_lib['items'][N]['compatibility_types'][K]),
    a2 = parseInt(facades_lib['items'][L]['types'][J]['thickness']),
    parseInt(facades_lib['items'][N]['types'][K]['thickness'])),
    0x0), a5 = 0x0;
    var G = {}, a6 = {}, L, P, L = ('facade' == q['params']['cabinet']['left_wall'] || 'facade_simple' == q['params']['cabinet']['left_wall'] ? (a1 = -B / 0x2 + I,
    custom_settings['fit_side_into_module'] && (a1 = -B / 0x2 + a2 / units,
    a4 = (a2 - q['params']['cabinet']['thickness']) / units),
    G = {
        'type': 'falsefacade',
        'allow_z': 0x1,
        'allow_x': 0x1,
        'facade': L,
        'material': P,
        'style': J,
        'tag': 'left_wall',
        'width': (E + H) * units,
        'height': D * units,
        'thickness': a2,
        'rY': -Math['PI'] / 0x2,
        'pX': a1,
        'pY': D / 0x2,
        'pZ': -E / 0x2 - H
    },
    'facade_simple' == q['params']['cabinet']['left_wall'] && (G['fixed_facade_model'] = '/common_assets/models/plastic_full.fbx'),
    L = q['params']['doors']['push'](G),
    G['door_index'] = L - 0x1,
    this['userData']['sides']['left'] = G) : 0x1 == q['params']['cabinet']['left_wall'] && (A['left_wall'] = Object_wall({
        'width': E + H,
        'height': D,
        'thickness': I,
        'rY': Math['PI'] / 0x2,
        'pX': -B / 0x2 + I / 0x2,
        'pY': D / 0x2,
        'pZ': -H / 0x2,
        'name': 'left_wall',
        'material': q['params']['cabinet']['material']
    })),
    'facade' == q['params']['cabinet']['right_wall'] || 'facade_simple' == q['params']['cabinet']['right_wall'] ? (a1 = B / 0x2 - I,
    custom_settings['fit_side_into_module'] && (a1 = B / 0x2 - a3 / units,
    a5 = (a3 - q['params']['cabinet']['thickness']) / units),
    a6 = {
        'type': 'falsefacade',
        'allow_z': 0x1,
        'allow_x': 0x1,
        'facade': N,
        'material': Q,
        'style': K,
        'tag': 'right_wall',
        'width': (E + H) * units + 0x2 * project_settings['door_offset'] / units,
        'height': D * units + 0x2 * project_settings['door_offset'] / units,
        'thickness': a3,
        'rY': Math['PI'] / 0x2,
        'pX': a1,
        'pY': D / 0x2,
        'pZ': E / 0x2
    },
    'facade_simple' == q['params']['cabinet']['right_wall'] && (a6['fixed_facade_model'] = '/common_assets/models/plastic_full.fbx'),
    P = q['params']['doors']['push'](a6),
    a6['door_index'] = P - 0x1,
    this['userData']['sides']['right'] = a6) : 0x1 == q['params']['cabinet']['right_wall'] && (A['right_wall'] = Object_wall({
        'width': E + H,
        'height': D,
        'thickness': I,
        'rY': Math['PI'] / 0x2,
        'pX': B / 0x2 - I / 0x2,
        'pY': D / 0x2,
        'pZ': -H / 0x2,
        'name': 'right_wall',
        'material': q['params']['cabinet']['material']
    })),
    this['userData']['flags'] = {},
    this['userData']['flags']['sm_flag_l'] = a4,
    this['userData']['flags']['sm_flag_r'] = a5,
    q['params']['cabinet']['tsarg_width'] / units), a7 = 0x0;
    let a8 = E
      , a9 = 0x0;
    if ((0x1 === this['params']['gola'] && this['params']['doors']['length'] && 0x1 != project_settings['handle'][this['params']['cabinet_group']]['no_handle'] || 0x1 === this['params']['gola'] && this['params']['lockers']['length'] && 0x1 != project_settings['handle'][this['params']['cabinet_group']]['no_handle']) && ('bottom' === q['params']['cabinet_group'] ? this['params']['cabinet']['height'] : (a8 = E - project_settings['handle'][this['params']['cabinet_group']]['model']['sizes_tabletop']['depth'] / units + 0.8,
    a9 = -project_settings['handle'][this['params']['cabinet_group']]['model']['sizes_tabletop']['depth'] / units / 0x2 + 0.4)),
    'bottom' == q['params']['cabinet_group'] && q['params']['cabinet']['height'] < 0x578 && 0x1 != q['params']['cabinet']['force_top_wall']) {
        let ag = B - 0x2 * I
          , ah = 0x0;
        custom_settings['fit_side_into_module'] && (ag = ag - a4 - a5,
        ah = ah + a4 / 0x2 - a5 / 0x2),
        A['top_wall'] = Object_wall({
            'width': ag,
            'height': L,
            'thickness': I,
            'rX': Math['PI'] / 0x2,
            'pX': ah,
            'pY': D - I / 0x2,
            'pZ': -E / 0x2 + L / 0x2,
            'name': 'top_wall',
            'material': q['params']['cabinet']['material']
        }),