function computeUVOnPlane(f, g, h, j, k) {
    var m = new THREE['Vector3']();
    if (!g['ray']['intersectPlane'](f['plane_mathPlane'], m))
        return null;
    var g = m['clone']()['applyMatrix4'](f['plane_matrixWorldInvert']);
    let q = g['x']
      , u = g['y'];
    if (!k?.['ctrlKey']) {
        var m = h['params']['grid'] || 0x1 / j
          , v = 0x4;
        q = Math['round'](q / m) * m,
        u = Math['round'](u / m) * m,
        Math['abs'](q) < 0x4 / j && (q = 0x0),
        Math['abs'](u) < 0x4 / j && (u = 0x0);
        let {halfU: y, halfV: z} = f;
        Math['abs'](q - y) < 0x4 / j && (q = y),
        Math['abs'](q + y) < 0x4 / j && (q = -y),
        Math['abs'](u - z) < 0x4 / j && (u = z),
        Math['abs'](u + z) < 0x4 / j && (u = -z);
    }
    let {halfU: w, halfV: x} = f;
    return q = Math['max'](-w, Math['min'](w, q)),
    u = Math['max'](-x, Math['min'](x, u)),
    {
        'u': q,
        'v': u
    };
}
function uvToWorld(f, g, h) {
    return new THREE['Vector3'](g,h,0x0)['applyMatrix4'](f['plane_matrixWorld']);
}
function find_hit_box_fill_section(f, g=null, h=!0x1) {
    if (f['userData']['is_root']) {
        h && (window['__debug_fill_boxes'] || (window['__debug_fill_boxes'] = []),
        window['__debug_fill_boxes']['forEach'](z => {
            z['parent'] && z['parent']['remove'](z);
        }
        ),
        window['__debug_fill_boxes']['length'] = 0x0);
        let v = g;
        if (!v) {
            if (!mouse || !camera)
                return null;
            (v = new THREE['Raycaster']())['setFromCamera'](mouse, camera);
        }
        var j = v['ray'], k, m, g, g;
        let w = new Map()
          , x = (traverse_parts(f, (z, A, B) => {
            var A, z;
            'function' == typeof f['pp_is_visible'] && 0x0 == f['pp_is_visible']() || 'mouse_target' !== A || (A = get_parent_module(z),
            z = new THREE['Box3']()['setFromObject'](z),
            A['userData']['is_root']) || !A['userData']['params']['spec']['is_fill'] || z['isEmpty']() || w['has'](A['uuid']) || w['set'](A['uuid'], {
                'current_obj': A,
                'box': z
            });
        }
        ),
        traverse_parts(f, (z, A, B) => {
            var A, z;
            'function' == typeof f['pp_is_visible'] && 0x0 == f['pp_is_visible']() || 'module' !== A || (A = z,
            z = new THREE['Box3']()['setFromObject'](A),
            A['userData']['is_root']) || !A['userData']['params']['spec']['is_fill'] || z['isEmpty']() || w['has'](A['uuid']) || w['set'](A['uuid'], {
                'current_obj': A,
                'box': z
            });
        }
        ),
        null)
          , y = 0x1 / 0x0;
        for ([k,m] of w) {
            var q, q = (h && (q = new THREE['Box3Helper'](m['box'],0xff0000),
            scene['add'](q),
            window['__debug_fill_boxes']['push'](q)),
            j['intersectBox'](m['box'], new THREE['Vector3']())), u;
            q && (u = q['distanceTo'](j['origin'])) < y && (y = u,
            x = m['current_obj']);
        }
        return x && h && (g = w['get'](x['uuid'])['box'],
        g = new THREE['Box3Helper'](g,0xff00),
        scene['add'](g),
        window['__debug_fill_boxes']['push'](g)),
        x;
    }
}
function fill_edit_mode(f=null) {
    var g;
    global_options['mouse_mode']['fill_edit_mode'] = !!f,
    f || (sc['select_object'](global_options['mouse_mode']['root']),
    global_options['mouse_mode']['root']?.['cust_dists'] && pp['interface']['root']['update_sizes_from_wall'](copy_object(global_options['mouse_mode']['root']['cust_dists']))),
    global_options['mouse_mode']['root'] = f ? f['userData']['root'] : null,
    !f && global_options['mouse_mode']['target']instanceof Module && (global_options['mouse_mode']['target']['_hide_helpers'](),
    Object['keys'](global_options['mouse_mode']['target']['userData']['root']['userData']['parts_by_path']['module'])['forEach'](h => {
        var i;
        global_options['mouse_mode']['target']['userData']['root']['userData']['parts_by_path']['module'][h]['_hide_helpers']();
    }
    )),
    global_options['mouse_mode']['target'] = f || null,
    pp['interface']['root'] && (pp['interface']['root']['$emit']('fill_enabled', !!f),
    pp['events']['module']['fill_edit_mode']) && pp['events']['module']['fill_edit_mode'](f || null);
}
class Nest {
    async['ExportNestFile'](f='export.wsnin') {
        room['updateMatrix'](!0x0);
        let g = new Analyzer();
        var h = new Date()
          , j = E => String(E)['padStart'](0x2, '0')
          , k = Math['floor'](0x384 * Math['random']() + 0x64);
        let m = 0x0;
        var j = 'M' + h['getFullYear']() + j(h['getMonth']() + 0x1) + j(h['getDate']()) + '-' + j(h['getHours']()) + j(h['getMinutes']()) + j(h['getSeconds']()) + k;
        f = j + '.wsnin';
        let q = {
            'status': 0x0,
            'data': {
                'inputName': j,
                'items': []
            }
        };
        function v(E) {
            var F = {}
              , G = E['userData']['params']
              , H = E['userData']['computed']
              , I = E['userData']['children'] || [];
            let J = new Map();
            var K = new Map();
            let L;
            var N = H['material']?.['mat_item'], O, P, Q, P, O = (H['material']['id'] && (O = parseFloat(H['material']['id']),
            P = H['material']['key'],
            Q = H['material']['variant_id'],
            P = pp['libs']['materials'][P]['find_item'](O),
            L = P['params']['variants'][Q]),
            E['userData']['computed']?.['material']?.['id'] || E['userData']['computed']?.['item']?.['id'] || '\x20'), P = L?.['code'] || E['userData']['computed']?.['material']?.['mat_item']?.['code'] || E['userData']['computed']?.['material']?.['code'] || E['userData']['computed']?.['item']?.['code'], R = P || 'MAT_' + O, Q = L?.['name'] || E['userData']['computed']?.['material']?.['mat_item']?.['name'] || E['userData']['computed']?.['material']?.['name'] || E['userData']['computed']?.['item']['name'] || '\x20', P = x(), O = P + '.pgi';
            F['sourceInfo'] = {
                'fileName': O,
                'filePath': '',
                'sourceType': 0x1,
                'extraColumn': ['Источник\x20данных'],
                'panels': [{
                    'code': P,
                    'name': E['name'],
                    'material': Q,
                    'length': H['real_size']['x'],
                    'width': H['real_size']['y'],
                    'thickness': H['real_size']['z'],
                    'actualLength': H['real_size']['x'],
                    'actualWidth': H['real_size']['y'],
                    'texture': 0x0,
                    'bandLeft': 0x0,
                    'bandRight': 0x0,
                    'bandTop': 0x0,
                    'bandBottom': 0x0,
                    'extraColumn': [O]
                }]
            },
            F['panels'] = [{
                'strId': P,
                'material': Q,
                'name': E['name'],
                'codeFront': P,
                'length': H['real_size']['x'],
                'width': H['real_size']['y'],
                'thickness': H['real_size']['z'],
                'texture': 0x0,
                'parameters': [{
                    'name': 'T',
                    'expression': H['real_size']['z'],
                    'description': 'Толщина'
                }, {
                    'name': 'L',
                    'expression': H['real_size']['x'],
                    'description': 'Длина'
                }, {
                    'name': 'W',
                    'expression': H['real_size']['y'],
                    'description': 'Ширина'
                }],
                'outer': {
                    'vecVertex': []
                },
                'holes': [],
                'grooves': [],
                'paths': [],
                'pockets': [],
                'lamellos': [],
                'words': []
            }],
            F['panels'][0x0]['parameters']['forEach'](a2 => {
                var a3 = parseFloat(a2['expression']);
                a2['expression'] = isFinite(a3) ? a3['toFixed'](0x2) : '0.00';
            }
            );
            var S, T, U = (H['original_points'] || [])['map'](a2 => ({
                'x': void 0x0 !== a2['x'] ? a2['x'] : 0x0,
                'y': void 0x0 !== a2['y'] ? a2['y'] : 0x0,
                'radius': a2['radius'] || 0x0,
                'center': a2['center'] ? {
                    'x': a2['center']['x'],
                    'y': a2['center']['y']
                } : null,
                'dir': a2['dir'] || !0x1
            }))['filter'](a2 => !a2['center']), W = {};
            if (U['length'])
                for (let a2 = 0x0; a2 < U['length']; a2++) {
                    var Z = U[(a2 - 0x1 + U['length']) % U['length']]
                      , a0 = U[a2]
                      , a1 = U[(a2 + 0x1) % U['length']];
                    0x0 < a0['radius'] ? (W[a2] = g['get_rounded_point'](Z, a0, a1),
                    F['panels'][0x0]['outer']['vecVertex']['push']({
                        'x': W[a2]['p1']['x'],
                        'y': W[a2]['p1']['y'],
                        'bulge': W[a2]['bulge']
                    }),
                    F['panels'][0x0]['outer']['vecVertex']['push']({
                        'x': W[a2]['p2']['x'],
                        'y': W[a2]['p2']['y']
                    })) : F['panels'][0x0]['outer']['vecVertex']['push']({
                        'x': a0['x'],
                        'y': a0['y']
                    });
                }
            var O = I['filter'](a3 => 'CabinetPath' === a3['temp_type'])
              , Q = (O['length'] && (F['panels'][0x0]['grooves'] = O['map'](a3 => {
                var a4 = a3['userData']['computed']
                  , a3 = a3['userData']['params']
                  , a5 = a4['relative_points'] || []
                  , a6 = (a4['trajectory'] || [])['map'](ae => ({
                    ...ae
                }))
                  , a7 = a4['size']['y']
                  , a8 = a4['size']['x']
                  , a9 = a3['spec']['direction'];
                let aa = a4['pos'], ab = a3['spec']['orientation'], ac, ad = ('-z' == a9 && (ac = 'ZM'),
                'z' == a9 && (ac = 'ZP'),
                a3['spec']['reverse'] ? -a7 : a7);
                return a6['forEach'](ae => {
                    'h' == ab && (ae['y'] += aa['y'] + ad / 0x2),
                    'v' == ab && (ae['x'] += aa['x'] + ad / 0x2);
                }
                ),
                {
                    'direction': ac,
                    'correction': 'MIDDLE',
                    'startX': a6[0x0]['x'],
                    'startY': a6[0x0]['y'],
                    'startZ': a6[0x0]['z'],
                    'endX': a6[0x1]['x'],
                    'endY': a6[0x1]['y'],
                    'endZ': a6[0x1]['z'],
                    'width': a7,
                    'depth': a8
                };
            }
            )),
            E['userData']['butt_objects']?.['length'] && E['userData']['butt_objects']['forEach'](a3 => {
                var a4 = a3['userData']['params']?.['spec'] || {}
                  , a3 = a3['userData']['computed']?.['material']
                  , a5 = parseFloat(a4['variant_id'])
                  , a6 = a3?.['params']?.['variants']?.[a5]?.['code'] || 'MAT_butts'
                  , a3 = a3?.['params']?.['variants']?.[a5]?.['name'] || 'Неизвестная\x20кромка'
                  , a5 = a4['face_index'];
                null != a5 && J['set'](a5, {
                    'thickness': parseFloat(a4['thickness']) || 0.5,
                    'material_art': a6,
                    'material_name': a3
                });
            }
            ),
            E['userData']['params']['spec']['holes']?.['length'] && (F['panels'][0x0]['holes'] = E['userData']['params']['spec']['holes']['map'](a3 => {
                let a4 = '';
                var a5 = a3['diameter'], a6 = a3['axes']['x'], a7 = a3['axes']['y'], a8 = a3['axes']['z'], a9;
                return '-z' == a3['dir'] && (a4 = 'ZM'),
                'z' == a3['dir'] && (a4 = 'ZP'),
                '-x' == a3['dir'] && (a4 = 'XM'),
                'x' == a3['dir'] && (a4 = 'XP'),
                '-y' == a3['dir'] && (a4 = 'YM'),
                {
                    'direction': a4 = 'y' == a3['dir'] ? 'YP' : a4,
                    'diam': a5,
                    'depth': a3['depth'],
                    'x': a6,
                    'y': a7,
                    'z': a8
                };
            }
            )),
            F['panels'][0x0]['outer']['vecVertex']);
            return Q?.['length'] && J?.['size'] && Q['forEach']( (a3, a4) => {
                var a4;
                J['has'](a4) && (a4 = J['get'](a4),
                a3['thickness'] = a4['thickness'],
                a3['material'] = a4['material_name'] + ('\x20Артикул:\x20\x20' + a4['material_art'] + ',\x20Толщина:\x20') + a4['thickness']);
            }
            ),
            F['panels'][0x0]['outer']['vecVertex'] = Q['filter']( (a3, a4, a5) => {
                var a5;
                return 0x0 === a4 || (a5 = a5[a4 - 0x1],
                a3['x'] !== a5['x']) || a3['y'] !== a5['y'] || (a5['_remove'] = !0x0);
            }
            )['filter'](a3 => !a3['_remove']),
            F;
        }
        var h = room['active_objects']['filter'](E => E instanceof Module);
        function w(E) {
            Math['PI'];
        }
        function x(E='M') {
            var F = new Date(), G = I => String(I)['padStart'](0x2, '0'), H;
            return '' + E + F['getFullYear']() + G(F['getMonth']() + 0x1) + G(F['getDate']()) + '-' + G(F['getHours']()) + G(F['getMinutes']()) + G(F['getSeconds']()) + String(F['getMilliseconds']())['padStart'](0x3, '0') + m++;
        }
        function y(E, F=[], G=null) {
            if (Array['isArray'](E))
                return E['map'](K => y(K, F, G));
            if (null === E || 'object' != typeof E)
                return 'number' == typeof E && F['includes'](G) ? E['toFixed'](0x2) : E;
            var H = {}, I, J;
            for ([I,J] of Object['entries'](E))
                H[I] = y(J, F, I);
            return H;
        }
        function z(E, F) {
            var F = F['map'](G => G['replace'](/[.*+?^${}()|[\]\\]/g, '\x5c$&'))['join']('|')
              , F = new RegExp('\x22(' + F + ')\x22\x5cs*:\x5cs*\x22(-?\x5cd+\x5c.\x5cd{2})\x22','g');
            return E['replace'](F, '\x22$1\x22:\x20$2');
        }
        0x0 < h['length'] && h['forEach'](E => {
            C(E),
            0x0 < E['userData']['parts']['wall']['length'] && E['userData']['parts']['wall']['forEach'](F => {
                q['data']['items']['push'](v(F));
            }
            );
        }
        );
        var k = ['thickness', 'length', 'width', 'depth', 'actualLength', 'actualWidth', 'bandLeft', 'bandRight', 'bandTop', 'bandBottom', 'diam', 'x', 'y', 'z', 'startX', 'startY', 'startZ', 'endX', 'endY', 'endZ'], j = y(q, k), h, h = z(h = JSON['stringify'](j), k), A;
        function B(E, F) {
            let G = window['URL']['createObjectURL'](E);
            var E = document['createElement']('a');
            E['style'] = 'display:\x20none',
            E['href'] = G,
            E['download'] = F,
            document['body']['appendChild'](E),
            E['click'](),
            document['body']['removeChild'](E),
            setTimeout(function() {
                window['URL']['revokeObjectURL'](G);
            }, 0x3e8);
        }
        function C(E) {
            let F = []
              , G = [];
            Q(E, R => {
                var S = R['userData']['params']?.['type'];
                'hole' === S ? F['push'](R) : 'wall' !== S && 'facade' !== S && 'cokol' !== S || G['push'](R);
            }
            );
            var H = [], I;
            for (I of F)
                for (var J of G) {
                    var K = g['obb_intersect'](J, I, !0x1), L, N, O, P, K;
                    0x1 == K['intersect'] && (L = K['min_overlap'],
                    N = K['axis'],
                    O = K['overlap'],
                    P = K['A'],
                    K = K['B'],
                    g['check_countour_intersec'](J, I, P, K, L));
                }
            function Q(R, S) {
                if (S(R),
                R['userData']['children'] && R['userData']['children']['length']) {
                    for (var T of R['userData']['children'])
                        Q(T, S);
                }
            }
        }
        B(new Blob([h],{
            'type': 'application/json'
        }), f);
    }
}
class CabinetLeg extends THREE['Group'] {
    constructor(e) {
        super(e),
        this['temp_type'] = 'CabinetLeg',
        this['name'] = 'CabinetLeg',
        this['params'] = {
            'height': void 0x0 !== (e = e || [])['height'] ? e['height'] : 0x78,
            'height2': void 0x0 !== e['height2'] ? e['height2'] : 0x14,
            'radius': void 0x0 !== e['radius'] ? e['radius'] : 0xa,
            'radius2': void 0x0 !== e['radius2'] ? e['radius2'] : 0x1e,
            'segments': void 0x0 !== e['segments'] ? e['segments'] : 0xc,
            'material': void 0x0 !== e['material'] ? e['material'] : global_materials['black'],
            'is_cokol_active': void 0x0 === e['is_cokol_active'] || e['is_cokol_active']
        },
        this['build']();
    }
    ['build']() {
        var f = this;
        if (0x0 < this['children']['length']) {
            var g = this['children']['length'];
            for (let q = g['length'] - 0x1; -0x1 < q; q--)
                g[q]['parent']['remove'](g[q]),
                g[q]['geometry'] && g[q]['geometry']['dispose']();
        }
        (0x0 != constructor_settings['shop_mode'] && 0x0 == project_settings['is_cokol_active'] || !0x1 === this['params']['is_cokol_active']) && (this['params']['radius'] = 0x19,
        this['params']['radius2'] = 0x19,
        this['params']['material'] = aluminium_material);
        var h = f['params']['height'] / units
          , j = f['params']['height2'] / units
          , k = f['params']['radius'] / units
          , l = f['params']['radius2'] / units
          , m = f['params']['segments']
          , p = f['params']['material'];
        f['leg'] = make_cylinder(k, k, h, m, p),
        f['leg']['position']['y'] = h / 0x2,
        f['leg']['userData']['edgesModeType'] = ObjectType['CabinetLeg'],
        f['add'](f['leg']),
        f['leg']['castShadow'] = !0x0,
        f['leg2'] = make_cylinder(l, l, j, m, p),
        f['leg2']['position']['y'] = j / 0x2,
        f['leg2']['userData']['edgesModeType'] = ObjectType['CabinetLeg'],
        f['add'](f['leg2']),
        f['leg2']['castShadow'] = !0x0;
    }
}
class CabinetCokol extends THREE['Group'] {
    constructor(f) {
        super(f);
        var g = this;
        this['params'] = {
            'width': void 0x0 !== f['width'] ? f['width'] : 0x1c2,
            'height': void 0x0 !== f['height'] ? f['height'] : 0x78,
            'thickness': void 0x0 !== f['thickness'] ? f['thickness'] : 0x78,
            'radius': void 0x0 !== f['radius'] && f['radius'],
            'model': (void 0x0 !== f['model'] ? f : cokol_lib['get_item'](project_settings['selected_cokol_model']))['model'],
            'model_radius': (void 0x0 !== f['model_radius'] ? f : cokol_lib['get_item'](project_settings['selected_cokol_model']))['model_radius'],
            'material': void 0x0 !== f['material'] ? f['material'] : project_settings['selected_materials']['bottom']['corpus'],
            'resizable': void 0x0 === f['resizable'] || f['resizable'],
            'pX': f['pX'] || 0x0,
            'pY': f['pY'] || 0x0,
            'pZ': f['pZ'] || 0x0,
            'rX': f['rX'] || 0x0,
            'rY': f['rY'] || 0x0,
            'rZ': f['rZ'] || 0x0
        },
        project_settings['custom_cokol'] && project_settings['custom_cokol']['model'] && (this['params']['model'] = project_settings['custom_cokol']['model']),
        this['temp_type'] = 'CabinetCokol',
        this['forward'] = new THREE['Group'](),
        this['add'](this['forward']),
        this['forward']['position']['z'] = 0x1,
        this['get_forward'] = function() {
            return new THREE['Vector3']()['subVectors'](this['forward']['getWorldPosition'](new THREE['Vector3']()), this['getWorldPosition'](new THREE['Vector3']()));
        }
        ,
        'none' != g['params']['model'] && g['params']['model'] ? this['build_model']() : this['build_common']();
    }
    ['set_size']() {
        var f = this
          , g = f['rotation']['clone']()
          , h = new THREE['Euler']()['setFromQuaternion'](f['getWorldQuaternion'](new THREE['Quaternion']())['clone']());
        f['rotation']['set'](-0x1 * h['x'], -0x1 * h['y'], -0x1 * h['z']);
        var j, k, h = new THREE['Vector3'](f['params']['width'] / units,f['params']['height'] / units,f['params']['thickness'] / units), l = box3['setFromObject'](f)['getSize'](new THREE['Vector3']())['clone'](), k = h['clone']()['sub'](l)['divideScalar'](0x2);
        for (let m = 0x0; m < f['children']['length']; m++)
            for (let n = 0x0; n < f['children'][m]['geometry']['vertices']['length']; n++)
                j = f['children'][m]['geometry']['vertices'][n],
                -0x1 < f['children'][m]['name']['indexOf']('x') && (j['x'] < 0x0 ? j['x'] -= k['x'] : j['x'] += k['x']);
        f['rotation']['copy'](g);
    }
    ['get_specs']() {
        return {
            'id': this['params']['material'],
            'm2': parseFloat((this['params']['width'] / 0x3e8 * this['params']['height'] / 0x3e8)['toFixed'](0x2)),
            'pm': this['params']['width'] / 0x3e8
        };
    }
    ['change_material'](f) {
        this['params']['material'] = f;
        for (let h = 0x0; h < this['children']['length']; h++) {
            var g;
            'Mesh' == this['children'][h]['type'] && ((g = materials_lib['get_item'](this['params']['material']))['add_params'] || (g['add_params'] = {}),
            g['add_params']['model_width'] = this['params']['width'],
            g['add_params']['model_height'] = this['params']['height'],
            this['children'][h]['material'] = create_material(g));
        }
    }
    ['build_common']() {
        var e = new Object_wall({
            'width': this['params']['width'] / units,
            'height': this['params']['height'] / units,
            'thickness': this['params']['thickness'] / units,
            'material': this['params']['material'],
            'name': 'cokol_front'
        });
        this['rotation']['set'](this['params']['rX'], this['params']['rY'], this['params']['rZ']),
        this['position']['set'](this['params']['pX'], this['params']['pY'], this['params']['pZ']),
        e['userData']['edgesModeType'] = ObjectType['CabinetCokol'],
        this['add'](e);
    }
    ['build_model']() {
        let e = this;
        e['params']['radius'] ? fbx_loader['load'](e['params']['model_radius'], function(f) {
            let g;
            void 0x0 === project_settings['fixed_materials'] && (project_settings['fixed_materials'] = []);
            var h = project_settings['fixed_materials'];
            for (let q = 0x0; q < f['children']['length']; q++) {
                var j = f['children'][q]
                  , k = new THREE['Geometry']()['fromBufferGeometry'](j['geometry']['clone']())
                  , l = (k['scale'](j['scale']['x'], j['scale']['y'], j['scale']['z']),
                0x0);
                for (let u = 0x0; u < h['length']; u++) {
                    var p = u + 0x1, p;
                    -0x1 < j['name']['indexOf']('mat' + p) && ((p = materials_lib['get_item'](h[u]))['add_params'] || (p['add_params'] = {}),
                    p['add_params']['model_width'] = e['params']['width'],
                    p['add_params']['model_height'] = e['params']['height'],
                    g = create_material(p));
                }
                var k = new THREE['Mesh'](k,g);
                k['name'] = j['name'],
                k['userData']['edgesModeType'] = ObjectType['CabinetCokol'],
                e['add'](k);
            }
            e['rotation']['set'](e['params']['rX'], e['params']['rY'], e['params']['rZ']),
            e['position']['set'](e['params']['pX'], e['params']['pY'], e['params']['pZ']);
        }) : fbx_loader['load'](e['params']['model'], function(f) {
            let g;
            void 0x0 === project_settings['fixed_materials'] && (project_settings['fixed_materials'] = []);
            var j = project_settings['fixed_materials'];
            for (let w = 0x0; w < f['children']['length']; w++) {
                var k = f['children'][w], l = new THREE['Geometry']()['fromBufferGeometry'](k['geometry']['clone']()), p = (l['scale'](k['scale']['x'], k['scale']['y'], k['scale']['z']),
                0x0), q;
                if (-0x1 < k['name']['indexOf']('gen') && ((q = materials_lib['get_item'](e['params']['material']))['add_params']['model_width'] = e['params']['width'],
                q['add_params']['model_height'] = e['params']['height'],
                g = create_material(q)),
                -0x1 < k['name']['indexOf']('v(2)')) {
                    let x = 'gen'
                      , y = e['params']['material'];
                    var q = k['name']['match'](/m\((.*?)\)/)
                      , u = (null != q && (x = q[0x1]),
                    void 0x0 === (y = 'gen' != x ? facades_lib['items'][project_settings['defaults']['facades']['top']]['additional_materials'][q[0x1]]['selected'] : y) && (y = project_settings['selected_materials']['top']['facades']),
                    materials_lib['get_item'](y));
                    u['add_params']['model_width'] = e['params']['width'],
                    g = create_material(u);
                }
                for (let z = 0x0; z < j['length']; z++) {
                    var v = z + 0x1, v;
                    -0x1 < k['name']['indexOf']('mat' + v) && ((v = materials_lib['get_item'](j[z]))['add_params']['model_width'] = e['params']['width'],
                    v['add_params']['model_height'] = e['params']['height'],
                    g = create_material(v));
                }
                var u = new THREE['Mesh'](l,g);
                u['name'] = k['name'],
                u['userData']['edgesModeType'] = ObjectType['CabinetCokol'],
                e['add'](u);
            }
            e['set_size'](),
            e['rotation']['set'](e['params']['rX'], e['params']['rY'], e['params']['rZ']),
            e['position']['set'](e['params']['pX'], e['params']['pY'], e['params']['pZ']);
        });
    }
}
class CabinetCokolTop extends THREE['Group'] {
    constructor(e) {
        super(e),
        this['temp_type'] = 'CabinetCokol',
        this['params'] = {
            'width': void 0x0 !== e['width'] ? e['width'] : 0x1c2,
            'height': void 0x0 !== e['height'] ? e['height'] : 0x78,
            'thickness': void 0x0 !== e['thickness'] ? e['thickness'] : 0x78,
            'radius': void 0x0 !== e['radius'] && e['radius'],
            'orientation': void 0x0 !== e['orientation'] ? e['orientation'] : 'left',
            'model': (void 0x0 !== e['model'] ? e : cokol_top_lib['get_item'](project_settings['selected_cokol_top_model']))['model'],
            'model_radius': void 0x0 !== e['model_radius'] ? e['model_radius'] : cokol_top_lib['get_item'](project_settings['selected_cokol_top_model'])['radius'],
            'material': void 0x0 !== e['material'] ? e['material'] : project_settings['selected_materials']['bottom']['corpus'],
            'resizable': void 0x0 === e['resizable'] || e['resizable'],
            'pX': e['pX'] || 0x0,
            'pY': e['pY'] || 0x0,
            'pZ': e['pZ'] || 0x0,
            'rX': e['rX'] || 0x0,
            'rY': e['rY'] || 0x0,
            'rZ': e['rZ'] || 0x0
        },
        'none' == this['params']['model'] ? this['build_common']() : this['build_model']();
    }
    ['set_size']() {
        var f = this
          , g = f['rotation']['clone']()
          , h = new THREE['Euler']()['setFromQuaternion'](f['getWorldQuaternion'](new THREE['Quaternion']())['clone']());
        f['rotation']['set'](-0x1 * h['x'], -0x1 * h['y'], -0x1 * h['z']);
        var j, k, h = new THREE['Vector3'](f['params']['width'] / units,f['params']['height'] / units,f['params']['thickness'] / units), l = box3['setFromObject'](f)['getSize'](new THREE['Vector3']())['clone'](), k = h['clone']()['sub'](l)['divideScalar'](0x2);
        for (let m = 0x0; m < f['children']['length']; m++) {
            for (let n = 0x0; n < f['children'][m]['geometry']['vertices']['length']; n++)
                j = f['children'][m]['geometry']['vertices'][n],
                -0x1 < f['children'][m]['name']['indexOf']('x') && (j['x'] < 0x0 ? j['x'] -= k['x'] : j['x'] += k['x']);
            f['children'][m]['geometry']['verticesNeedUpdate'] = !0x0,
            f['children'][m]['geometry']['uvsNeedUpdate'] = !0x0;
        }
        f['rotation']['copy'](g);
    }
    ['get_specs']() {}
    ['change_material'](f) {
        var g = this, h;
        g['params']['material'] = f;
        for (let i = 0x0; i < g['children']['length']; i++) {
            'Mesh' == g['children'][i]['type'] && ((h = materials_lib['get_item'](g['params']['material']))['add_params'] || (h['add_params'] = {}),
            h['add_params']['model_width'] = g['params']['width'],
            h['add_params']['model_height'] = g['params']['height'],
            g['children'][i]['material'] = create_material(h));
        }
    }
    ['build_common']() {
        var f, f, g, h, h, f;
        this['params']['radius'] ? (f = new THREE['Shape'](),
        g = 0x10,
        h = this['params']['width'],
        f['moveTo'](-h / units / 0x2, -h / units / 0x2),
        f['lineTo'](-h / units / 0x2, (h / 0x2 - (h - 0x10)) / units),
        f['quadraticCurveTo'](h / units / 0x2 - 0x10 / units, (h / 0x2 - (h - 0x10)) / units, h / units / 0x2 - 0x10 / units, h / units / 0x2),
        f['lineTo'](h / units / 0x2, h / units / 0x2),
        f['quadraticCurveTo'](h / units / 0x2, -h / units / 0x2, -h / units / 0x2, -h / units / 0x2),
        h = new Object_wall({
            'width': this['params']['width'] / units,
            'height': this['params']['height'] / units,
            'thickness': this['params']['height'] / units,
            'material': this['params']['material'],
            'name': 'cokol_front',
            'shape': f
        }),
        this['rotation']['set'](this['params']['rX'], this['params']['rY'], this['params']['rZ']),
        this['position']['set'](this['params']['pX'], this['params']['pY'], this['params']['pZ']),
        h['rotation']['z'] = Math['PI'],
        h['rotation']['x'] = Math['PI'] / 0x2,
        this['params']['rZ'],
        h['userData']['edgesModeType'] = ObjectType['CabinetCokolTop'],
        this['add'](h)) : ((f = new Object_wall({
            'width': this['params']['width'] / units,
            'height': this['params']['height'] / units,
            'thickness': this['params']['thickness'] / units,
            'material': this['params']['material'],
            'name': 'cokol_front'
        }))['position']['y'] = -this['params']['height'] / units / 0x2,
        this['rotation']['set'](this['params']['rX'], this['params']['rY'], this['params']['rZ']),
        this['position']['set'](this['params']['pX'], this['params']['pY'], this['params']['pZ']),
        f['userData']['edgesModeType'] = ObjectType['CabinetCokolTop'],
        this['add'](f));
    }
    async['build_model']() {
        var f = this;
        let g = f['params']['model'];
        this['params']['radius'] && (g = this['params']['model_radius']);
        var j = await load_model({
            'model': g,
            'buffer': !0x1
        });
        let k;
        void 0x0 === project_settings['fixed_materials'] && (project_settings['fixed_materials'] = []);
        var l = project_settings['fixed_materials'];
        for (let w = 0x0; w < j['length']; w++) {
            var m = j[w]['clone'](), p = 0x0, q;
            if (-0x1 < m['name']['indexOf']('gen') && ((q = materials_lib['get_item'](f['params']['material']))['add_params']['model_width'] = f['params']['width'],
            q['add_params']['model_height'] = f['params']['height'],
            k = create_material(q)),
            -0x1 < m['name']['indexOf']('v(2)')) {
                let x = 'gen'
                  , y = f['params']['material'];
                var q = m['name']['match'](/m\((.*?)\)/)
                  , u = (null != q && (x = q[0x1]),
                void 0x0 === (y = 'gen' != x && facades_lib['items'][project_settings['defaults']['facades']['top']]['additional_materials'][q[0x1]] ? facades_lib['items'][project_settings['defaults']['facades']['top']]['additional_materials'][q[0x1]]['selected'] : y) && (y = project_settings['selected_materials']['top']['facades']),
                materials_lib['get_item'](y));
                u['add_params']['model_width'] = f['params']['width'],
                k = create_material(u);
            }
            for (let z = 0x0; z < l['length']; z++) {
                var v = z + 0x1, v;
                -0x1 < m['name']['indexOf']('mat' + v) && ((v = materials_lib['get_item'](l[z]))['add_params'] || (v['add_params'] = {}),
                v['add_params']['model_width'] = f['params']['width'],
                v['add_params']['model_height'] = f['params']['height'],
                k = create_material(v));
            }
            var u = new THREE['Mesh'](m,k);
            u['name'] = m['name'],
            u['castShadow'] = !0x0,
            u['userData']['edgesModeType'] = ObjectType['CabinetCokolTop'],
            f['add'](u);
        }
        f['set_size'](),
        f['rotation']['set'](f['params']['rX'], f['params']['rY'], f['params']['rZ']),
        f['position']['set'](f['params']['pX'], f['params']['pY'], f['params']['pZ']),
        this['params']['radius'] && ('left' == this['params']['orientation'] ? (f['rotation']['y'] = -Math['PI'] / 0x2,
        f['position']['z'] = f['params']['width'] / units / 0x2 - 0.8,
        f['position']['x'] = -f['params']['width'] / units / 0x2) : (f['rotation']['y'] = 0x0,
        f['position']['z'] = f['params']['width'] / units / 0x2 - 0.8,
        f['position']['x'] = f['params']['width'] / units / 0x2));
    }
}
class BortLegacy extends THREE['Group'] {
    constructor(e) {
        super(),
        this['name'] = 'BortLegacy',
        this['params'] = {
            'id': (e = e || {})['id'] || 0x0,
            'width': e['width'] || 0x1,
            'height': e['height'] || 0x4,
            'depth': e['depth'] || 0x1,
            'material': void 0x0 !== e['material'] ? e['material'] : 0x0
        },
        this['forward'] = new THREE['Group'](),
        this['add'](this['forward']),
        this['forward']['position']['z'] = 0x1,
        this['get_forward'] = function() {
            return new THREE['Vector3']()['subVectors'](this['forward']['getWorldPosition'](), this['getWorldPosition']());
        }
        ,
        this['build']();
    }
    async['build']() {
        var f = libs['tabletop_plints']['get_item'](project_settings['defaults']['tabletop_plint'])
          , g = (f['params']['height'] = parseInt(f['params']['height']),
        f['params']['depth'] = parseInt(f['params']['depth']),
        await load_model({
            'model': f['models']['common'],
            'buffer': !0x0
        }))
          , h = this['params']['width'] / units
          , g = g[0x0]['clone']()
          , i = materials_lib['get_item'](f['params']['material'])
          , i = (i['add_params']['model_width'] = this['params']['width'],
        i['add_params']['model_height'] = f['params']['height'],
        new THREE['Mesh'](g,create_material(i)))
          , g = (i['name'] = g['name'],
        box3['setFromObject'](i)['getSize'](new THREE['Vector3']())['clone']())
          , g = {
            'box': g,
            'width': h,
            'height': f['params']['height'] / units,
            'depth': f['params']['depth'] / units
        };
        i['position']['y'] = f['params']['height'] / units / 0x2,
        set_size_buff(i, i['name'], g),
        i['userData']['edgesModeType'] = ObjectType['Bort'],
        this['add'](i);
    }
    ['_delete']() {
        let f = this;
        this['traverse'](function(g) {
            f['uuid'] !== g['uuid'] && (g['geometry'] && g['geometry']['dispose'](),
            g['material']) && !isArray(g['material']) && g['material']['map'] && g['material']['map']['dispose']();
        }),
        this['parent']['remove'](this);
    }
}
class Tabletop extends THREE['Group'] {
    constructor(f) {
        super(f);
        var g = this, f, h, h;
        this['name'] = 'Tabletop',
        (f = f || {})['bort'] || (f['bort'] = {}),
        this['params'] = {
            'id': f['id'] || 0x0,
            'variant': void 0x0 !== f['variant'] ? f['variant'] : project_settings['defaults']['tabletop_variant'],
            'auto': f['auto'] || 0x0,
            'width': f['width'] || 0x1,
            'height': f['height'] || 0x4,
            'depth': f['depth'] || 0x1,
            'holes': f['holes'] || void 0x0,
            'shape': f['shape'] || void 0x0,
            'bortOffsets': f['bortOffsets'] || void 0x0,
            'material': void 0x0 !== f['material'] ? f['material'] : 0x0,
            'material_rotated': void 0x0 !== f['material_rotated'] && f['material_rotated'],
            'len': f['len'] || 0x5dc,
            'connects': f['connects'] || [],
            'bort': {
                'l': 0x0,
                'r': 0x0,
                'b': 0x0,
                'f': 0x0
            }
        },
        this['forward'] = new THREE['Group'](),
        this['add'](this['forward']),
        this['forward']['position']['z'] = 0x1,
        this['get_forward'] = function() {
            return new THREE['Vector3']()['subVectors'](this['forward']['getWorldPosition'](new THREE['Vector3']()), this['getWorldPosition'](new THREE['Vector3']()));
        }
        ,
        this['connects'] = new THREE['Group'](),
        this['connects']['name'] = 'connects',
        this['add'](this['connects']),
        this['connects']['visible'] = !0x1,
        this['connects_sizes'] = new THREE['Group'](),
        this['connects_sizes']['name'] = 'connects_sizes',
        this['add'](this['connects_sizes']),
        this['connects_sizes']['visible'] = !0x1,
        this['ends'] = new THREE['Group'](),
        this['ends']['name'] = 'ends',
        this['add'](this['ends']),
        this['edges_sizes'] = new THREE['Group'](),
        this['edges_sizes']['name'] = 'edges_sizes',
        this['add'](this['edges_sizes']),
        this['edges_sizes']['visible'] = !0x1,
        this['borts'] = new THREE['Group'](),
        this['borts']['name'] = 'borts',
        this['add'](this['borts']),
        this['borts']['visible'] = !0x0,
        0x1 == constructor_settings['tabletop_v2'] ? (void 0x0 === this['params']['variant'] && (this['params']['variant'] = 0x0),
        h = (f = pp['libs']['tabletop']['find_item'](this['params']['id']))['params']['variants'][this['params']['variant']],
        this['params']['height'] = parseInt(h['thickness']),
        h = f['params']['mat_mode'],
        this['userData']['mat_params'] = 0x1 == h ? pp['libs']['decors']['get_item'](f['params']['material']) : copy_object(f['params']['mat_params'])) : this['userData']['mat_params'] = pp['libs']['decors']['get_item'](this['params']['material']),
        this['build']();
    }
    ['build']() {
        this['reset_model']();
        var f = this, g, j = f['params']['width'] / units, k = f['params']['height'] / units, l = f['params']['depth'] / units, g = void 0x0 === f['params']['shape'] ? build_shape['square'](j, l) : f['params']['shape'];
        if (void 0x0 !== f['params']['holes']) {
            for (var m = 0x0; m < f['params']['holes']['length']; m++)
                g['holes']['push'](f['params']['holes'][m]);
        }
        var j = new THREE['ExtrudeBufferGeometry'](g,{
            'steps': 0x1,
            'depth': k,
            'bevelEnabled': !0x1
        })
          , p = (j['rotateX'](Math['PI'] / 0x2),
        j['translate'](0x0, k, 0x0),
        j['attributes']['uv']);
        for (let v = 0x0; v < p['count']; v++) {
            var q = p['getX'](v)
              , u = p['getY'](v)
              , q = q / (f['params']['width'] / units) + 0.5
              , u = u / (f['params']['depth'] / units) + 0.5;
            p['setXY'](v, q, u);
        }
        j['attributes']['position']['needsUpdate'] = !0x0,
        j['attributes']['uv']['needsUpdate'] = !0x0,
        this['mesh'] = new THREE['Mesh'](j,red_mat),
        this['apply_material'](),
        this['mesh']['castShadow'] = !0x0,
        this['mesh']['receiveShadow'] = !0x0,
        this['mesh']['userData']['edgesModeType'] = ObjectType['Tabletop'],
        f['add'](this['mesh']),
        this['edge_mesh'] = build_edges(j['clone']()),
        this['edge_mesh']['visible'] = !0x1,
        f['add'](this['edge_mesh']),
        this['edge_opaque'] = new THREE['Mesh'](j['clone'](),edges_opacue_mat),
        this['edge_opaque']['visible'] = !0x1,
        f['add'](this['edge_opaque']),
        f['mat'] = this['mesh']['material'],
        0x1 == constructor_settings['tabletop_v2'] && (this['build_connections'](),
        this['build_conn_sizes']());
    }
    ['calcBortOffset'](f) {
        var g = this['params']['bortOffsets'];
        return g ? 'f' === f ? [g['c3'] + g['c2'], (g['c3'] - g['c2']) / 0x2] : 'b' === f ? [g['c4'] + g['c1'], (g['c4'] - g['c1']) / 0x2] : 'l' === f ? [g['c3'] + g['c4'], (g['c3'] - g['c4']) / 0x2] : 'r' === f ? [g['c2'] + g['c1'], (g['c2'] - g['c1']) / 0x2] : [0x0, 0x0] : [0x0, 0x0];
    }
    ['get_bort_data']() {
        return this['userData']['bort'];
    }
    ['get_box']() {
        return this['updateMatrixWorld'](),
        this['updateMatrix'](),
        box3['setFromObject'](this['mesh'])['clone']();
    }
    ['build_connections']() {
        if (this['params']['connects']['length']) {
            this['params']['connects']['sort'](function(n, p) {
                return n - p;
            });
            for (let n = 0x0; n < this['params']['connects']['length']; n++) {
                var f = make_connect_mesh(this['params']['height'] / units, this['params']['depth'] / units);
                f['no_edges'] = !0x0,
                f['position']['y'] -= this['params']['height'] / units / 0x2,
                f['position']['x'] = this['params']['connects'][n],
                this['connects']['add'](f);
            }
        } else {
            if (this['params']['width'] > this['params']['len']) {
                if (this['params']['connects']['length']) {
                    this['params']['connects']['sort'](function(p, q) {
                        return p - q;
                    });
                    for (let p = 0x0; p < this['params']['connects']['length']; p++) {
                        var g = make_connect_mesh(this['params']['height'] / units, this['params']['depth'] / units);
                        g['no_edges'] = !0x0,
                        g['position']['y'] -= this['params']['height'] / units / 0x2,
                        g['position']['x'] = this['params']['connects'][p],
                        this['connects']['add'](g);
                    }
                } else {
                    var h = Math['floor'](this['params']['width'] / this['params']['len'])
                      , j = 0x0;
                    for (let q = 0x1; q < h + 0x1; q++) {
                        var k = make_connect_mesh(this['params']['height'] / units, this['params']['depth'] / units)
                          , l = (k['no_edges'] = !0x0,
                        k['position']['y'] -= this['params']['height'] / units / 0x2,
                        k['position']['x'] = -this['params']['width'] / units / 0x2 + q * this['params']['len'] / units,
                        this['connects']['add'](k),
                        this['params']['connects']['push'](k['position']['x']),
                        new Sizes_obj({
                            'width': this['params']['width'] / 0x2 / units + k['position']['x'],
                            'text': this['params']['width'] / 0x2 + k['position']['x'] * units,
                            'font_size': 0x32
                        }));
                        l['position']['y'] = this['params']['height'] / units / 0x2,
                        l['position']['x'] = -this['params']['width'] / units / 0x2 + (this['params']['width'] / 0x2 / units + k['position']['x']) / 0x2,
                        l['rotateX'](-PI / 0x2),
                        this['connects_sizes']['add'](l);
                    }
                    var j = this['params']['width'] - h * this['params']['len']
                      , m = new Sizes_obj({
                        'width': j / units,
                        'text': j,
                        'font_size': 0x32
                    });
                    m['position']['y'] = this['params']['height'] / units / 0x2,
                    m['position']['x'] = this['params']['width'] / units / 0x2 - j / units / 0x2,
                    m['rotateX'](-PI / 0x2),
                    this['connects_sizes']['add'](m);
                }
            }
        }
        var j = make_connect_mesh(this['params']['height'] / units, this['params']['depth'] / units, 0x1)
          , m = (j['no_edges'] = !0x0,
        j['position']['y'] -= this['params']['height'] / units / 0x2,
        j['position']['x'] = -this['params']['width'] / units / 0x2,
        j['clone']());
        m['position']['x'] = this['params']['width'] / units / 0x2,
        m['no_edges'] = !0x0;
    }
    ['build_conn_sizes']() {
        this['userData']['parts_sizes'] = [];
        var f = [...this['connects']['children']];
        f['sort'](function(v, w) {
            return v['position']['x'] - w['position']['x'];
        });
        for (let v = this['connects_sizes']['children']['length']; v--; )
            this['connects_sizes']['children'][v]['full_dispose']();
        var g = []
          , j = []
          , k = this['connects_sizes']['children']['length'] = 0x0;
        let l = 0x0;
        for (let w = 0x0; w < f['length']; w++) {
            var m = f[w];
            let x, y = 0x0;
            (x = 0x0 == w ? parseInt(this['params']['width'] / 0x2 + m['position']['x'] * units) : parseInt(Math['abs'](m['position']['x'] - f[w - 0x1]['position']['x']) * units)) > this['params']['len'] && (y = 0x1);
            var p = new Sizes_obj({
                'width': x / units,
                'text': parseInt(x),
                'font_size': 0x32,
                'wrong': y
            });
            this['userData']['parts_sizes']['push'](parseInt(x)),
            p['position']['y'] = this['params']['height'] / units / 0x2,
            0x0 == w ? p['position']['x'] = m['position']['x'] - parseInt(this['params']['width'] / 0x2 + m['position']['x'] * units) / units / 0x2 : p['position']['x'] = m['position']['x'] - Math['abs'](m['position']['x'] - f[w - 0x1]['position']['x']) / 0x2,
            j['push'](m['position']['x']),
            p['rotateX'](-PI / 0x2),
            g['push'](p),
            l += x;
        }
        let q = 0x0;
        (k = this['params']['width'] - l) > this['params']['len'] && (q = 0x1);
        var u = new Sizes_obj({
            'width': k / units,
            'text': parseInt(k),
            'font_size': 0x32,
            'wrong': q
        });
        this['userData']['parts_sizes']['push'](parseInt(k)),
        u['position']['y'] = this['params']['height'] / units / 0x2,
        u['position']['x'] = this['params']['width'] / units / 0x2 - k / units / 0x2,
        u['rotateX'](-PI / 0x2),
        g['push'](u),
        this['params']['connects'] = j;
        for (let z = g['length']; z--; )
            this['connects_sizes']['add'](g[z]);
    }
    ['add_connection'](f) {
        var g = make_connect_mesh(this['params']['height'] / units, this['params']['depth'] / units);
        g['no_edges'] = !0x0,
        g['position']['y'] -= this['params']['height'] / units / 0x2,
        g['position']['x'] = f['x'],
        this['connects']['add'](g),
        this['params']['connects']['push'](g['position']['x']),
        this['build_conn_sizes']();
    }
    ['remove_connection'](e) {
        this['connects']['remove'](e),
        this['build_conn_sizes']();
    }
    ['check_walls']() {
        var f, g = box3['setFromObject'](this)['clone']()['expandByScalar'](0.1);
        for (let h = 0x0; h < room['walls_objects']['length']; h++)
            box3['setFromObject'](room['walls_objects'][h])['intersectsBox'](g);
    }
    ['cut_mode']() {
        this['edge_mesh']['visible'] = !0x0,
        this['edge_opaque']['visible'] = !0x0,
        this['mesh']['visible'] = !0x1,
        this['build_conn_sizes'](),
        this['connects_sizes']['visible'] = !0x0,
        this['connects']['visible'] = !0x0;
    }
    ['des_mode']() {
        this['edge_mesh']['visible'] = !0x1,
        this['edge_opaque']['visible'] = !0x1,
        this['mesh']['visible'] = !0x0,
        this['build'](),
        this['connects_sizes']['visible'] = !0x1,
        this['connects']['visible'] = !0x1;
    }
    ['change_material'](f, g=0x0) {
        this['change_material_ext'](f, g);
    }
    ['apply_material'](f) {
        let g;
        (g = constructor_settings['tabletop_v2'] ? this['userData']['mat_params'] : (this['params']['material'] = f,
        materials_lib['get_item'](f)))['add_params'] || (g['add_params'] = {}),
        g['add_params']['rotation'] = 'normal',
        0x0 != this['params']['material_rotated'] && (g['add_params']['rotation'] = 'rotated'),
        g['add_params']['model_width'] = this['params']['width'],
        g['add_params']['model_height'] = this['params']['depth'],
        this['mesh']['material'] = create_material(g);
    }
    ['change_material_ext'](f, g=0x0) {
        if (constructor_settings['tabletop_v2']) {
            this['params']['id'] = f,
            this['params']['variant'] = g;
            var g = pp['libs']['tabletop']['find_item'](this['params']['id'])
              , h = g['params']['variants'][this['params']['variant']]
              , h = parseInt(h['thickness'])
              , i = g['params']['mat_mode'];
            if (this['userData']['mat_params'] = 0x1 == i ? pp['libs']['decors']['get_item'](g['params']['material']) : copy_object(g['params']['mat_params']),
            ce('var'),
            this['params']['height'] != h)
                return this['params']['height'] = h,
                this['build'](),
                !0x0;
            this['apply_material'](this['params']['material']);
        } else
            this['apply_material'](f);
    }
    ['delete']() {
        let f = this;
        this['traverse'](function(g) {
            f['uuid'] !== g['uuid'] && (g['geometry'] && g['geometry']['dispose'](),
            g['material']) && !isArray(g['material']) && g['material']['map'] && g['material']['map']['dispose']();
        }),
        this['parent']['remove'](this);
    }
    ['set_cut_mode'](e) {
        0x0 == e ? (this['ends']['visible'] = !0x0,
        this['des_mode']()) : (this['ends']['visible'] = !0x1,
        this['cut_mode']());
    }
    ['reset_model'](f) {
        var g = f, h, i = [];
        if ((g = f ? f : this)['traverse'](function(j) {
            g['uuid'] === j['uuid'] || 'Group' === j['type'] || j['no_reset'] || i['push'](j);
        }),
        i['length']) {
            for (h = i['length'] - 0x1; -0x1 < h; h--)
                i[h]['parent']['remove'](i[h]),
                i[h]['geometry'] && i[h]['geometry']['dispose'](),
                i[h]['material'] && !isArray(i[h]['material']) && i[h]['material']['map'] && i[h]['material']['map']['dispose'](),
                i['splice'](i['indexOf'](i[h]), 0x1);
        }
    }
    ['edges_mode']() {
        0x1 == constructor_settings['tabletop_v2'] && PPObject['prototype']['edges_mode']['call'](this);
    }
    ['edges_mode_traverse'](e, f) {
        e && e['traverse'](function(g) {
            var h, h;
            'Mesh' === g['type'] && !0x0 !== g['size_box'] && 0x1 != g['no_edges'] && 'edges' != g['name'] && 'Sizes_obj' !== g['parent']['type'] && ((h = build_edges(g['geometry']))['name'] = 'edges',
            (f ? g['parent'] : g)['add'](h),
            g['material']['map'] && 'function' == typeof g['material']['map']['dispose'] && g['material']['map']['dispose'](),
            h['visible'] = g['visible'],
            f && (h['position']['copy'](g['position']),
            h['rotation']['copy'](g['rotation']),
            h['scale']['copy'](g['scale'])),
            h = g['userData'] && g['userData']['edgesModeType'] || ObjectType['Default'],
            g['material'] = getEdgesModeMaterial(h));
        });
    }
    ['design_mode']() {
        0x1 == constructor_settings['tabletop_v2'] && 'function' == typeof this['build'] && this['build']();
    }
    ['build_edges']() {
        this['userData']['edges'] || (this['userData']['edges'] = {});
        for (let e = this['edges_sizes']['children']['length']; e--; )
            this['edges_sizes']['children'][e]['full_dispose']();
        Object['keys'](this['userData']['edges'])['forEach'](f => {
            for (let k = this['userData']['edges'][f]['length']; k--; ) {
                var g = this['userData']['edges'][f][k];
                let l = 'A';
                0x1 == g['type'] && (l = 'Т');
                var h = new Text_obj({
                    'width': g['len'],
                    'text': g['len'] * units + '\x20' + l,
                    'font_size': 0x32
                })
                  , j = this['get_forward']();
                switch (f) {
                case 'f':
                    -0x1 == j['z'] && (h['position']['x'] = this['params']['width'] / units / 0x2 - g['len'] / 0x2 - g['start']),
                    0x1 == j['z'] && (h['position']['x'] = -this['params']['width'] / units / 0x2 + g['len'] / 0x2 + g['start']),
                    0x1 == j['x'] && (h['position']['x'] = this['params']['width'] / units / 0x2 - g['len'] / 0x2 - g['start']),
                    -0x1 == j['x'] && (h['position']['x'] = -this['params']['width'] / units / 0x2 + g['len'] / 0x2 + g['start']),
                    h['position']['z'] = this['params']['depth'] / units / 0x2,
                    h['rotateX'](-PI / 0x2),
                    h['rotateZ'](PI);
                    break;
                case 'b':
                    -0x1 == j['z'] && (h['position']['x'] = this['params']['width'] / units / 0x2 - g['len'] / 0x2 - g['start']),
                    0x1 == j['z'] && (h['position']['x'] = -this['params']['width'] / units / 0x2 + g['len'] / 0x2 + g['start']),
                    0x1 == j['x'] && (h['position']['x'] = this['params']['width'] / units / 0x2 - g['len'] / 0x2 - g['start']),
                    -0x1 == j['x'] && (h['position']['x'] = -this['params']['width'] / units / 0x2 + g['len'] / 0x2 + g['start']),
                    h['position']['z'] = -this['params']['depth'] / units / 0x2,
                    h['rotateX'](-PI / 0x2);
                    break;
                case 'l':
                    h['position']['x'] = this['params']['width'] / units / 0x2,
                    h['rotateX'](-PI / 0x2),
                    h['rotateZ'](-PI / 0x2),
                    h['position']['z'] = -this['params']['depth'] / units / 0x2 + g['len'] / 0x2 + g['start'];
                    break;
                case 'r':
                    h['position']['x'] = -this['params']['width'] / units / 0x2,
                    h['rotateX'](-PI / 0x2),
                    h['rotateZ'](PI / 0x2),
                    h['position']['z'] = -this['params']['depth'] / units / 0x2 + g['len'] / 0x2 + g['start'];
                    break;
                }
                this['edges_sizes']['add'](h);
            }
        }
        );
    }
}
function make_connect_mesh(f, g, h=0x0) {
    var j = conn_mat
      , h = (0x1 == h && (j = conn_mat_end),
    new THREE['BoxBufferGeometry'](0x1,f,g))
      , k = new THREE['EdgesGeometry'](h);
    return new THREE['Mesh'](h,new THREE['MeshPhongMaterial']({
        'color': '#880000',
        'depthTest': !0x1,
        'depthWrite': !0x1,
        'side': THREE['DoubleSide'],
        'transparent': !0x1,
        'opacity': 0x1
    }));
}
function Wall(f) {
    var g = f['width'] || 0x0, j = f['height'] || 0x0, k = f['rX'] || 0x0, l = f['rY'] || 0x0, q = f['rZ'] || 0x0, u = f['pX'] || 0x0, v = f['pY'] || 0x0, w = f['pZ'] || 0x0, x = f['pb'] || 0x0, y = f['pt'] || 0x0, z = f['name'] || 'wall', f, f = f['material'] || new THREE['MeshPhongMaterial']({
        'color': 0xffffff,
        'specular': 0x0
    }), g = new THREE['PlaneBufferGeometry'](g,j), j = new THREE['Mesh'](g,f);
    return j['rotation']['set'](k, l, q),
    j['position']['set'](u, v, w),
    j['receiveShadow'] = !0x0,
    j['castShadow'] = !0x1,
    j['name'] = z,
    j['is_wall'] = !0x0,
    j['userData'] = {
        'interaction': {
            'selectable': 0x0
        }
    },
    j;
}
function Object_wall(f) {
    var g = void 0x0 !== f['width'] ? f['width'] : 0x3c, j = void 0x0 !== f['height'] ? f['height'] : 0x14, k = void 0x0 !== f['thickness'] ? f['thickness'] : 0x1e, q = f['rX'] || 0x0, v = f['rY'] || 0x0, w = f['rZ'] || 0x0, x = f['pX'] || 0x0, y = f['pY'] || 0x0, z = f['pZ'] || 0x0, A = f['name'] || 'wall', B, C, B = void 0x0 !== f['material'] ? f['material'] : project_settings['selected_materials']['bottom']['corpus'], D = null, D, B = (0x0 == (D = 'object' == typeof B ? copy_object(f['material']) : materials_lib['get_item'](B))['id'] && (D = materials_lib['get_item'](project_settings['selected_materials']['bottom']['corpus'])),
    f['material_rotated'] && (D['add_params']['rotation'] = 'rotated'),
    D['add_params']['model_width'] = g * units,
    D['add_params']['model_height'] = j * units,
    create_material(D)), D, D, C;
    if ((C = void 0x0 !== f['shape'] ? (D = f['shape'],
    D = new THREE['ExtrudeBufferGeometry'](D,{
        'steps': 0x1,
        'depth': k,
        'bevelEnabled': !0x1
    }),
    correct_buffer_uv_simple(D, g, j),
    new THREE['Mesh'](D,B)) : make_cube(g, j, k, B))['castShadow'] = !0x0,
    C['receiveShadow'] = !0x0,
    C['name'] = A,
    C['position']['set'](x, y, z),
    C['rotation']['set'](q, v, w),
    C['params'] = f,
    C['userData']['edgesModeType'] = ObjectType['Wall'],
    C['destroy'] = function() {
        C['geometry'] && C['geometry']['dispose'](),
        C['material'] && (C['material']['map'] && C['material']['map']['dispose'](),
        C['material']['dispose']());
    }
    ,
    C['change_material'] = function(G) {
        if (void 0x0 === G && (G = 0x0),
        0x1 != C['params']['fixed_material'] && 0x1 != C['params']['material_fixed']) {
            let H = null;
            'object' == typeof G ? (H = copy_object(G),
            this['params']['material'] = G['id']) : (H = materials_lib['get_item'](G),
            this['params']['material'] = G),
            C['material'] && (dispose_material(C['material']),
            H['add_params'] || (H['add_params'] = {}),
            C['params']['material_rotated'] && (H['add_params']['rotation'] = 'rotated'),
            H['add_params']['model_width'] = g * units,
            H['add_params']['model_height'] = j * units,
            C['material'] = create_material(H));
        }
    }
    ,
    f['holders']) {
        var E = 0.25;
        for (let G = 0x4; G--; ) {
            var F = new THREE['Group']();
            F['add'](new THREE['Mesh'](new THREE['CylinderBufferGeometry'](E,E,1.6,0x14),aluminium_material)),
            F['add'](new THREE['Mesh'](new THREE['CylinderBufferGeometry'](0.35,0.35,0.1,0x14),aluminium_material)),
            C['add'](F),
            F['position']['z'] = k / 0x2 + E,
            F['rotation']['z'] = Math['PI'] / 0x2,
            0x3 == G && (F['position']['x'] = -g / 0x2,
            F['position']['y'] = j / 0x2 - 0x5),
            0x2 == G && (F['position']['x'] = -g / 0x2,
            F['position']['y'] = -j / 0x2 + 0x5),
            0x1 == G && (F['position']['x'] = g / 0x2,
            F['position']['y'] = j / 0x2 - 0x5),
            0x0 == G && (F['position']['x'] = g / 0x2,
            F['position']['y'] = -j / 0x2 + 0x5);
        }
    }
    return C;
}
function make_cube(f, g, h, i) {
    return new THREE['Mesh'](new THREE['BoxBufferGeometry'](f,g,h),i);
}
function make_edges(f, g, h, i=!0x1) {
    i = i || new THREE['LineBasicMaterial']({
        'color': 0xff0000
    });
    var f = new THREE['LineSegments'](new THREE['EdgesGeometry'](new THREE['BoxGeometry'](f,g,h)),i);
    return f['computeLineDistances'](),
    f;
}
function make_s_helper(f, g, h) {
    return new THREE['LineSegments'](new THREE['EdgesGeometry'](new THREE['BoxBufferGeometry'](f,g,h),0xa),s_helper_mat);
}
function make_edges_dashed(f, g, h) {
    return new THREE['LineSegments'](new THREE['EdgesGeometry'](new THREE['BoxBufferGeometry'](f,g,h)),new THREE['LineBasicMaterial']({
        'color': '#7b7b7b'
    }));
}
function make_cylinder(f, g, h, j, k) {
    return new THREE['Mesh'](new THREE['CylinderBufferGeometry'](f,g,h,j),k);
}
class CWall extends THREE['Mesh'] {
    constructor(e) {
        super(e),
        e = e || {},
        this['params'] = _['merge']({
            'width': 0x258,
            'height': 0x258,
            'thickness': 0x10,
            'name': 'wall',
            'material': {
                'id': project_settings['selected_materials']['bottom']['corpus'],
                'rotated': 0x0,
                'fixed': 0x0
            },
            'shape': null,
            'holes': null
        }, e),
        this['userData']['units_included'] = 0x1,
        this['name'] = this['params']['name'],
        this['build']();
    }
    ['build']() {
        let e;
        this['params']['shape'] ? (e = new THREE['ExtrudeBufferGeometry'](shape,{
            'steps': 0x1,
            'depth': this['params']['thickness'] / units,
            'bevelEnabled': !0x1
        }),
        correct_buffer_uv_simple(this['geometry'], this['params']['width'] / units, this['params']['height'] / units)) : e = new THREE['BoxBufferGeometry'](this['params']['width'] / units,this['params']['height'] / units,this['params']['thickness'] / units),
        this['geometry'] = e,
        this['apply_material'](this['params']['material']['id']);
    }
    ['change_material'](e=0x0) {
        this['params']['material']['fixed'] || this['params']['material']['id'] != e && this['apply_material'](e);
    }
    ['apply_material'](e) {
        dispose_material(this['material']);
        var e = materials_lib['get_item'](e);
        this['params']['material']['rotated'] && (e['add_params']['rotation'] = 'rotated'),
        e['add_params']['model_width'] = this['params']['width'],
        e['add_params']['model_height'] = this['params']['height'],
        this['material'] = create_material(e),
        this['material']['wireframe'] = !0x0;
    }
}
class Selection_box extends THREE['Group'] {
    constructor(e) {
        super(),
        this['type'] = 'solid',
        this['userData']['box'] = new THREE['LineSegments'](new THREE['EdgesGeometry'](new THREE['BoxBufferGeometry'](0x1,0x1,0x1),0xa),new THREE['LineBasicMaterial']({
            'color': '#fdae11',
            'depthTest': !0x1
        })),
        this['add'](this['userData']['box']);
    }
    ['build_by_object'](f) {
        var g = this['userData']['box']
          , h = box3['setFromObject'](f)['clone']()
          , i = h['getSize'](new THREE['Vector3']())
          , h = h['getCenter'](new THREE['Vector3']());
        g['position']['copy'](h),
        g['rotation']['setFromQuaternion'](f['getWorldQuaternion'](new THREE['Quaternion']())),
        g['scale']['set'](i['x'], i['y'], i['z']),
        this['show']();
    }
    ['show']() {
        this['userData']['box']['visible'] = !0x0;
    }
    ['hide']() {
        this['userData']['box']['visible'] = !0x1;
    }
}
class SB extends THREE['Group'] {
    constructor(e) {
        super(),
        this['params'] = {
            'width': void 0x0 !== (e = e || {})['width'] ? e['width'] : 0x258 / units,
            'height': void 0x0 !== e['height'] ? e['height'] : 0x258 / units,
            'depth': void 0x0 !== e['depth'] ? e['depth'] : 0x258 / units
        },
        this['name'] = 'SizeBox',
        this['no_edges'] = !0x0,
        this['no_reset'] = !0x0,
        this['no_click_event'] = !0x0,
        this['size_box'] = !0x0,
        this['userData']['obb'] = null,
        this['userData']['renderable'] = !0x1,
        this['build']();
    }
    ['build']() {}
}
class SizeBox extends THREE['LineSegments'] {
    constructor(e) {
        super(),
        this['params'] = {
            'width': void 0x0 !== (e = e || {})['width'] ? e['width'] : 0x258 / units,
            'height': void 0x0 !== e['height'] ? e['height'] : 0x258 / units,
            'depth': void 0x0 !== e['depth'] ? e['depth'] : 0x258 / units
        },
        this['name'] = 'SizeBox',
        this['no_edges'] = !0x0,
        this['no_reset'] = !0x0,
        this['no_click_event'] = !0x0,
        this['size_box'] = !0x0,
        this['userData']['obb'] = null,
        this['userData']['renderable'] = !0x1,
        this['build']();
    }
    ['build']() {
        this['geometry'] && this['geometry']['dispose'](),
        this['geometry'] = make_edges(this['params']['width'], this['params']['height'], this['params']['depth'])['geometry'],
        'function' == typeof THREE['OBB'] && (this['userData']['obb'] = new THREE['OBB'](),
        this['userData']['obb']['halfSize'] = new THREE['Vector3'](this['params']['width'] / 0x2,this['params']['height'] / 0x2,this['params']['depth'] / 0x2)),
        this['material'] = s_helper_mat;
    }
    ['set_size'](f, g, h) {
        this['params']['width'] = f,
        this['params']['height'] = g,
        this['params']['depth'] = h,
        this['build']();
    }
}
class PPAxes extends THREE['Group'] {
    constructor(f=0x28, g=0x1) {
        super();
        var g = new THREE['Mesh'](new THREE['SphereGeometry'](g,0x10,0x8),new THREE['MeshBasicMaterial']({
            'color': '#ffd319',
            'depthTest': !0x1
        }))
          , g = (g['renderOrder'] = 0x1,
        this['add'](g),
        new THREE['Mesh'](new THREE['BoxGeometry'](f,0.2,0.2),new THREE['MeshBasicMaterial']({
            'color': '#4eb34e',
            'depthTest': !0x1
        })))
          , g = (g['rotateZ'](Math['PI'] / 0x2),
        g['renderOrder'] = 0x1,
        g['position']['y'] = 0x14,
        this['add'](g),
        new THREE['Mesh'](new THREE['BoxGeometry'](f,0.2,0.2),new THREE['MeshBasicMaterial']({
            'color': '#e81b1b',
            'depthTest': !0x1
        })))
          , g = (g['position']['x'] = 0x14,
        g['renderOrder'] = 0x1,
        this['add'](g),
        new THREE['Mesh'](new THREE['BoxGeometry'](f,0.2,0.2),new THREE['MeshBasicMaterial']({
            'color': '#50baff',
            'depthTest': !0x1,
            'depthWrite': !0x1
        })));
        g['rotateY'](-Math['PI'] / 0x2),
        g['position']['z'] = 0x14,
        g['renderOrder'] = 0x1,
        this['add'](g);
    }
}
async function check_pdf_lib() {
    var f;
    return 'object' == typeof pdfMake || document['getElementById']('pdfmakejs') || ((f = document['createElement']('script'))['id'] = 'pdfmakejs',
    f['src'] = '/common_assets/libs/pdf/pdfmake.min.js',
    document['head']['append'](f)),
    new Promise(function(g, h) {
        let i = setInterval(function() {
            if ('object' == typeof pdfMake) {
                clearInterval(i),
                g(!0x0);
                let j = location['origin'];
                try {
                    pdfMake['fonts'] = {
                        'Roboto': {
                            'normal': j + '/common_assets/libs/fonts/Roboto-Regular.ttf',
                            'bold': j + '/common_assets/libs/fonts/Roboto-Medium.ttf',
                            'italics': j + '/common_assets/libs/fonts/Roboto-Italic.ttf'
                        }
                    },
                    -0x1 < location['href']['indexOf']('modulit.co.il') && (j = 'https://modulit.co.il',
                    pdfMake['fonts'] = {
                        'Roboto': {
                            'normal': j + '/common_assets/libs/fonts/Heebo-Regular.ttf',
                            'bold': j + '/common_assets/libs/fonts/Heebo-Bold.ttf'
                        }
                    }),
                    -0x1 < location['href']['indexOf']('16825636') && (pdfMake['fonts'] = {
                        'Roboto': {
                            'normal': j + '/clients/16825636/assets/pdf_reg.ttf',
                            'bold': j + '/clients/16825636/assets/pdf_reg.ttf'
                        }
                    });
                } catch (k) {}
            }
        }, 0x64);
    }
    );
}
async function generate_pdf(a0, a1) {
    if (0x1 == constructor_settings['core_v2']) {
        if (dControls['clear_selected'](),
        await check_pdf_lib(),
        'function' == typeof custom_pdf_generation)
            return custom_pdf_generation(a1);
        if (!(-0x1 < location['href']['indexOf']('modulit.co.il'))) {
            var a2 = sc['get_specs'](!0x0)
              , a3 = global_options['pdf']['width']
              , a4 = global_options['pdf']['height']
              , a5 = global_options['pdf']['img_size_offset_x']
              , a6 = global_options['pdf']['img_size_offset_y']
              , a7 = global_options['pdf']['img_pos_x']
              , a8 = global_options['pdf']['img_pos_y']
              , a9 = global_options['pdf']['img_size_multi'];
            let cf;
            var aa = $('.client_logo\x20img')[0x0];
            if (void 0x0 !== aa && void 0x0 !== aa['src'])
                try {
                    cf = logo_to_base64(aa);
                } catch (co) {}
            var ab = get_modules(), ac = get_shelves(), ad, af = {
                'hLineWidth': function(cp, cq) {
                    return 0.1;
                },
                'vLineWidth': function(cp, cq) {
                    return 0.1;
                },
                'hLineColor': function(cp, cq) {
                    return 'gray';
                },
                'vLineColor': function(cp, cq) {
                    return 'gray';
                },
                'paddingLeft': function(cp, cq) {
                    return 0x6;
                },
                'paddingRight': function(cp, cq) {
                    return 0x6;
                },
                'paddingTop': function(cp, cq) {
                    return 0x3;
                },
                'paddingBottom': function(cp, cq) {
                    return 0x3;
                }
            }, ag = {
                'pageSize': 'A4',
                'pageOrientation': 'landscape',
                'pageMargins': [pdf_settings['lm'], pdf_settings['tm'], pdf_settings['rm'], pdf_settings['bm']],
                'footer': function(cp, cq) {
                    return {
                        'columns': [{
                            'width': '*',
                            'text': $('.client_data')['html']()['trim'](),
                            'alignment': 'left',
                            'margin': [0x55, 0x0, 0x0, 0x0]
                        }, {
                            'width': 0x5c,
                            'text': cp['toString']() + '\x20' + lang['pages_of'] + '\x20' + cq,
                            'alignment': 'right',
                            'margin': [0x0, 0x0, 0x2a, 0x0]
                        }]
                    };
                },
                'content': [],
                'styles': {
                    'tableHeader': {
                        'bold': !0x1,
                        'fontSize': 0xc
                    }
                },
                'defaultStyle': {
                    'fontSize': 0xa,
                    'bold': !0x1
                }
            };
            cf && (ag['header'] = {
                'image': cf,
                'opacity': 0.3,
                'fit': [0x64, 0x64],
                'margin': [0x0, 0x0, 0x2a, 0x0],
                'absolutePosition': {
                    'x': 0xf,
                    'y': 0xa
                },
                'alignment': 'right'
            });
            let cg = {};
            (cg = a0 || get_images({
                'width': a3 * a9,
                'height': a4 * a9
            }))['common_view'] && ag['content']['push']({
                'image': cg['common_view'],
                'fit': [a3 - a5, a4 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            0x1 == pdf_settings['german'] && (cg['front_view_color'] && ag['content']['push']({
                'image': cg['front_view_color'],
                'fit': [a3 - 0x1e, a4 - 0x1e],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'alignment': 'center',
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            cg['back_view_color'] && ag['content']['push']({
                'image': cg['back_view_color'],
                'fit': [a3 - a5, a4 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            cg['left_view_color'] && ag['content']['push']({
                'image': cg['left_view_color'],
                'fit': [a3 - a5, a4 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            cg['right_view_color']) && ag['content']['push']({
                'image': cg['right_view_color'],
                'fit': [a3 - a5, a4 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            cg['edges_view'] && ag['content']['push']({
                'image': cg['edges_view'],
                'fit': [a3 - a5, a4 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            cg['comms_only_view'] && ag['content']['push']({
                'image': cg['comms_only_view'],
                'fit': [a3 - a5, a4 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            cg['top_view'] && ag['content']['push']({
                'image': cg['top_view'],
                'fit': [a3 - a5, a4 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            0x1 == pdf_settings['german'] && cg['tabletop_view'] && ag['content']['push']({
                'image': cg['tabletop_view'],
                'fit': [a3 - a5, a4 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            cg['front_view'] && ag['content']['push']({
                'image': cg['front_view'],
                'fit': [a3 - a5, a4 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            cg['back_view'] && ag['content']['push']({
                'image': cg['back_view'],
                'fit': [a3 - a5, a4 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            cg['left_view'] && ag['content']['push']({
                'image': cg['left_view'],
                'fit': [a3 - a5, a4 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            cg['right_view'] && ag['content']['push']({
                'image': cg['right_view'],
                'fit': [a3 - a5, a4 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            });
            let ch, ci, cj, ck, cm;
            !0x0 !== pdf_settings['force_top_bottom_materials'] && !0x0 !== pdf_settings['add_material_to_module_name'] || (ci = void 0x0 !== project_settings['selected_materials']['top']['facades'] ? objectFindByKey(materials_catalog['items'], 'id', project_settings['selected_materials']['top']['facades']) : ((ch = objectFindByKey(ct, 'id', project_settings['materials']['top']['facades'][0x0]))['items']['length'] ? ch : ch['categories'][0x0])['items'][0x0],
            cj = void 0x0 !== project_settings['selected_materials']['bottom']['facades'] ? objectFindByKey(materials_catalog['items'], 'id', project_settings['selected_materials']['bottom']['facades']) : ((ch = objectFindByKey(ct, 'id', project_settings['materials']['bottom']['facades'][0x0]))['items']['length'] ? ch : ch['categories'][0x0])['items'][0x0],
            ck = objectFindByKey(materials_catalog['items'], 'id', project_settings['selected_materials']['top']['corpus']),
            cm = objectFindByKey(materials_catalog['items'], 'id', project_settings['selected_materials']['bottom']['corpus'])),
            ag['content']['push']({
                'text': lang['general_information'] + '\x0a\x0a',
                'style': 'tableHeader',
                'bold': !0x0,
                'alignment': 'center'
            }),
            void 0x0 !== project_settings['name'] && ag['content']['push']({
                'text': lang['kitchen_model'] + ':\x20' + project_settings['name'] + '\x0a\x0a'
            }),
            !0x0 === pdf_settings['force_top_bottom_materials'] && (ag['content']['push']({
                'text': lang['top_facades'] + ':\x20' + ci['name']
            }),
            ag['content']['push']({
                'text': lang['bottom_facades'] + ':\x20' + cj['name'] + '\x0a\x0a'
            }),
            ag['content']['push']({
                'text': lang['corpus_top'] + ':\x20' + ck['name']
            }),
            ag['content']['push']({
                'text': lang['corpus_bottom'] + ':\x20' + cm['name'] + '\x0a\x0a'
            }));
            var ah = null == custom_settings['info_show_price'] || custom_settings['info_show_price'], ai = null == constructor_settings['specs_icons'] || constructor_settings['specs_icons'], aj, ak, aa, a9;
            for ([aj,ak] of Object['entries'](a2['sum'])) {
                var al = []
                  , am = ah ? ['auto', '*', 'auto', 'auto', 'auto', 'auto'] : ['auto', '*', 'auto', 'auto', 'auto'];
                if ('wall' == aj) {
                    var an = [{
                        'text': lang['material'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['title'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['code'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['sizes'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['count_short'],
                        'style': 'tableHeader'
                    }], ao, ap;
                    ah && an['push']({
                        'text': lang['price'],
                        'style': 'tableHeader'
                    }),
                    al['push'](an),
                    ag['content']['push']({
                        'text': lang['wall_header'] + ':\x0a\x0a',
                        'style': 'tableHeader'
                    });
                    for ([ao,ap] of Object['entries'](ak)) {
                        var aq = [];
                        aq['push'](ap['key_name'], ap['variant_name'] || ap['material_name'], ap['variant_code'] || ap['material_code'], ap['width'] + 'x' + ap['height'] + '\x20мм', round_decimals_2(ap['total_count']) + '\x20' + lang['units_' + ap['price_type']]),
                        ah && aq['push']({
                            'text': format_price(ap['total_price']),
                            'alignment': 'right'
                        }),
                        al['push'](aq);
                    }
                    ag['content']['push']({
                        'table': {
                            'headerRows': 0x1,
                            'widths': am,
                            'body': al
                        },
                        'layout': af
                    }, {
                        'text': '\x0a\x0a'
                    });
                }
                if ('butts' == aj) {
                    var an = [{
                        'text': lang['title'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['code'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['thickness'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['width'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['count_short'],
                        'style': 'tableHeader'
                    }], ar, as;
                    ah && an['push']({
                        'text': lang['price'],
                        'style': 'tableHeader'
                    }),
                    al['push'](an),
                    ag['content']['push']({
                        'text': lang['edge'] + ':\x0a\x0a',
                        'style': 'tableHeader'
                    });
                    for ([ar,as] of Object['entries'](ak)) {
                        var au = [];
                        au['push'](as['name'], as['code'], as['thickness'] + '\x20мм', as['height'] + '\x20мм', round_decimals_2(as['total_count']) + '\x20' + lang['units_' + as['price_type']]),
                        ah && au['push']({
                            'text': format_price(as['total_price']),
                            'alignment': 'right'
                        }),
                        al['push'](au);
                    }
                    ag['content']['push']({
                        'table': {
                            'headerRows': 0x1,
                            'widths': am,
                            'body': al
                        },
                        'layout': af
                    }, {
                        'text': '\x0a\x0a'
                    });
                }
                if ('butts_facade' == aj) {
                    var av = [{
                        'text': lang['material'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['facade'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['count_short'],
                        'style': 'tableHeader'
                    }], aw, ax;
                    ah && av['push']({
                        'text': lang['price'],
                        'style': 'tableHeader'
                    }),
                    al['push'](av),
                    ag['content']['push']({
                        'text': lang['facades_edge'] + ':\x0a\x0a',
                        'style': 'tableHeader'
                    });
                    for ([aw,ax] of Object['entries'](ak)) {
                        var ay = [];
                        ay['push'](ax['mat_name'], ax['facade_name'], round_decimals_2(ax['total_count']) + '\x20' + lang['units_' + ax['price_type']]),
                        ah && ay['push']({
                            'text': format_price(ax['total_price']),
                            'alignment': 'right'
                        }),
                        al['push'](ay);
                    }
                    ag['content']['push']({
                        'table': {
                            'headerRows': 0x1,
                            'widths': ah ? ['auto', '*', 'auto', 'auto'] : ['auto', '*', 'auto'],
                            'body': al
                        },
                        'layout': af
                    }, {
                        'text': '\x0a\x0a'
                    });
                }
                if ('facade' == aj) {
                    var av = [{
                        'text': lang['material'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['title'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['code'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['sizes'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['count_short'],
                        'style': 'tableHeader'
                    }], az, aA;
                    ah && av['push']({
                        'text': lang['price'],
                        'style': 'tableHeader'
                    }),
                    al['push'](av),
                    ag['content']['push']({
                        'text': lang['facades'] + ':\x0a\x0a',
                        'style': 'tableHeader'
                    });
                    for ([az,aA] of Object['entries'](ak)) {
                        var aB = [];
                        aB['push'](aA['mat_name'], aA['name'], aA['code'], aA['show_size'] ? round_decimals_2(aA['size']['x']) + 'x' + round_decimals_2(aA['size']['y']) + '\x20мм' : '', round_decimals_2(aA['total_count']) + '\x20' + lang['units_' + aA['price_type']]),
                        ah && aB['push']({
                            'text': format_price(aA['total_price']),
                            'alignment': 'right'
                        }),
                        al['push'](aB);
                    }
                    ag['content']['push']({
                        'table': {
                            'headerRows': 0x1,
                            'widths': am,
                            'body': al
                        },
                        'layout': af
                    }, {
                        'text': '\x0a\x0a'
                    });
                }
                if ('tabletop' == aj) {
                    var aC = [{
                        'text': lang['title'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['code'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['sizes'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['common_sizes'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['count_short'],
                        'style': 'tableHeader'
                    }], aD, aE;
                    ah && aC['push']({
                        'text': lang['price'],
                        'style': 'tableHeader'
                    }),
                    al['push'](aC),
                    ag['content']['push']({
                        'text': lang['tabletop'] + ':\x0a\x0a',
                        'style': 'tableHeader'
                    });
                    for ([aD,aE] of Object['entries'](ak)) {
                        var aF = [];
                        aF['push'](aE['name'], aE['code'], aE['width'] + 'x' + aE['height'] + '\x20мм', 'm' === aE['price_type'] || 'm2' === aE['price_type'] ? round_decimals_2(aE['total_width']) + '\x20' + lang['units_' + aE['price_type']] : round_decimals_2(aE['total_width_m']) + '\x20' + lang['units_m'], round_decimals_2(aE['total_count']) + '\x20' + lang['units_' + aE['price_type']]),
                        ah && aF['push']({
                            'text': format_price(aE['total_price']),
                            'alignment': 'right'
                        }),
                        al['push'](aF);
                    }
                    ag['content']['push']({
                        'table': {
                            'headerRows': 0x1,
                            'widths': am,
                            'body': al
                        },
                        'layout': af
                    }, {
                        'text': '\x0a\x0a'
                    });
                }
                if ('bort' == aj) {
                    var aC = [{
                        'text': lang['title'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['code'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['sizes'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['common_sizes'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['count_short'],
                        'style': 'tableHeader'
                    }], aG, aH;
                    ah && aC['push']({
                        'text': lang['price'],
                        'style': 'tableHeader'
                    }),
                    al['push'](aC),
                    ag['content']['push']({
                        'text': lang['tabletop_plints'] + ':\x0a\x0a',
                        'style': 'tableHeader'
                    });
                    for ([aG,aH] of Object['entries'](ak)) {
                        var aI = [];
                        aI['push'](aH['name'], aH['code'], aH['width'] + 'x' + aH['height'] + '\x20мм', 'm' === aH['price_type'] || 'm2' === aH['price_type'] ? round_decimals_2(aH['total_width']) + '\x20' + lang['units_' + aH['price_type']] : round_decimals_2(aH['total_width_m']) + '\x20' + lang['units_m'], round_decimals_2(aH['total_count']) + '\x20' + lang['units_' + aH['price_type']]),
                        ah && aI['push']({
                            'text': format_price(aH['total_price']),
                            'alignment': 'right'
                        }),
                        al['push'](aI);
                    }
                    ag['content']['push']({
                        'table': {
                            'headerRows': 0x1,
                            'widths': am,
                            'body': al
                        },
                        'layout': af
                    }, {
                        'text': '\x0a\x0a'
                    });
                }
                if ('cokol' == aj) {
                    var aJ = [{
                        'text': lang['title'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['code'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['sizes'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['common_sizes'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['count_short'],
                        'style': 'tableHeader'
                    }], aK, aL;
                    ah && aJ['push']({
                        'text': lang['price'],
                        'style': 'tableHeader'
                    }),
                    al['push'](aJ),
                    ag['content']['push']({
                        'text': lang['cokol'] + ':\x0a\x0a',
                        'style': 'tableHeader'
                    });
                    for ([aK,aL] of Object['entries'](ak)) {
                        var aM = [];
                        aM['push'](aL['name'], aL['code'], aL['width'] + 'x' + aL['height'] + '\x20мм', 'm' === aL['price_type'] || 'm2' === aL['price_type'] ? round_decimals_2(aL['total_width']) + '\x20' + lang['units_' + aL['price_type']] : round_decimals_2(aL['total_width_m']) + '\x20' + lang['units_m'], round_decimals_2(aL['total_count']) + '\x20' + lang['units_' + aL['price_type']]),
                        ah && aM['push']({
                            'text': format_price(aL['total_price']),
                            'alignment': 'right'
                        }),
                        al['push'](aM);
                    }
                    ag['content']['push']({
                        'table': {
                            'headerRows': 0x1,
                            'widths': am,
                            'body': al
                        },
                        'layout': af
                    }, {
                        'text': '\x0a\x0a'
                    });
                }
                if ('cokol_top' == aj) {
                    var aJ = [{
                        'text': lang['title'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['code'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['sizes'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['common_sizes'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['count_short'],
                        'style': 'tableHeader'
                    }], aN, aO;
                    ah && aJ['push']({
                        'text': lang['price'],
                        'style': 'tableHeader'
                    }),
                    al['push'](aJ),
                    ag['content']['push']({
                        'text': lang['cokol_top'] + ':\x0a\x0a',
                        'style': 'tableHeader'
                    });
                    for ([aN,aO] of Object['entries'](ak)) {
                        var aP = [];
                        aP['push'](aO['name'], aO['code'], aO['width'] + 'x' + aO['height'] + '\x20мм', 'm' === aO['price_type'] || 'm2' === aO['price_type'] ? round_decimals_2(aO['total_width']) + '\x20' + lang['units_' + aO['price_type']] : round_decimals_2(aO['total_width_m']) + '\x20' + lang['units_m'], round_decimals_2(aO['total_count']) + '\x20' + lang['units_' + aO['price_type']]),
                        ah && aP['push']({
                            'text': format_price(aO['total_price']),
                            'alignment': 'right'
                        }),
                        al['push'](aP);
                    }
                    ag['content']['push']({
                        'table': {
                            'headerRows': 0x1,
                            'widths': am,
                            'body': al
                        },
                        'layout': af
                    }, {
                        'text': '\x0a\x0a'
                    });
                }
                if ('cornice' == aj) {
                    var aQ = [{
                        'text': lang['title'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['code'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['common_sizes'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['cornice_width'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['count_short'],
                        'style': 'tableHeader'
                    }], aR, aS;
                    ah && aQ['push']({
                        'text': lang['price'],
                        'style': 'tableHeader'
                    }),
                    al['push'](aQ),
                    ag['content']['push']({
                        'text': lang['cornice'] + ':\x0a\x0a',
                        'style': 'tableHeader'
                    });
                    for ([aR,aS] of Object['entries'](ak)) {
                        var aT = [];
                        aT['push'](aS['name'], aS['code'], aS['total_width'] + '\x20м', aS['width'] + '\x20м', round_decimals_2(aS['total_count']) + '\x20' + lang['units_' + aS['price_type']]),
                        ah && aT['push']({
                            'text': format_price(aS['total_price']),
                            'alignment': 'right'
                        }),
                        al['push'](aT);
                    }
                    ag['content']['push']({
                        'table': {
                            'headerRows': 0x1,
                            'widths': am,
                            'body': al
                        },
                        'layout': af
                    }, {
                        'text': '\x0a\x0a'
                    });
                }
                if ('item' == aj) {
                    var aU = [{
                        'text': lang['title'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['code'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['count_short'],
                        'style': 'tableHeader'
                    }], aV, aW;
                    ah && aU['push']({
                        'text': lang['price'],
                        'style': 'tableHeader'
                    }),
                    al['push'](aU),
                    ag['content']['push']({
                        'text': lang['accessories_furniture'] + ':\x0a\x0a',
                        'style': 'tableHeader'
                    });
                    for ([aV,aW] of Object['entries'](ak)) {
                        var aX = [];
                        aX['push'](aW['name'], aW['code'], round_decimals_2(aW['total_count']) + '\x20' + lang['units_' + aW['price_type']]),
                        ah && aX['push']({
                            'text': format_price(aW['total_price']),
                            'alignment': 'right'
                        }),
                        al['push'](aX);
                    }
                    var aY = [];
                    for (let cp = 0x0; cp < aU['length']; cp++)
                        0x0 == cp ? aY['push']('*') : aY['push']('auto');
                    ag['content']['push']({
                        'table': {
                            'headerRows': 0x1,
                            'widths': aY,
                            'body': al
                        },
                        'layout': af
                    }, {
                        'text': '\x0a\x0a'
                    });
                }
                if ('module' == aj && Object['values'](ak)['find'](cq => cq['is_root'] && cq['price'])) {
                    var aZ = [{
                        'text': lang['title'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['code'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['count_short'],
                        'style': 'tableHeader'
                    }], b0, b1, b2;
                    ah && aZ['push']({
                        'text': lang['price'],
                        'style': 'tableHeader'
                    }),
                    al['push'](aZ),
                    ag['content']['push']({
                        'text': lang['module'] + ':\x0a\x0a',
                        'style': 'tableHeader'
                    });
                    for ([b0,b1] of Object['entries'](ak)) {
                        b1['is_root'] && b1['price'] && ((b2 = [])['push'](b1['name'], b1['code'], round_decimals_2(b1['total_count'])),
                        ah && b2['push']({
                            'text': format_price(b1['total_price']),
                            'alignment': 'right'
                        }),
                        al['push'](b2));
                    }
                    var b3 = [];
                    for (let cq = 0x0; cq < aZ['length']; cq++)
                        0x0 == cq ? b3['push']('*') : b3['push']('auto');
                    ag['content']['push']({
                        'table': {
                            'headerRows': 0x1,
                            'widths': b3,
                            'body': al
                        },
                        'layout': af
                    }, {
                        'text': '\x0a\x0a'
                    });
                }
            }
            if (ah && 'object' !== a2['mode'] && ag['content']['push']({
                'text': lang['total_cost_project'] + '\x20' + format_price(a2['total_price']) + '\x0a\x0a',
                'style': 'tableHeader',
                'bold': !0x0,
                'alignment': 'left'
            }, {
                'text': '\x0a'
            }),
            'object' !== a2['mode']) {
                for (var [b4,b5] of Object['entries'](a2['all']['module'] || {}))
                    if (b5['is_root']) {
                        var b6 = ah && b5['show_price'], b7 = b6 ? ['auto', '*', 'auto', 'auto', 'auto', 'auto'] : ['auto', '*', 'auto', 'auto', 'auto'], b8, b9, ba, bb;
                        ag['content']['push']({
                            'text': lang['module'] + ':\x20' + b5['name'] + '\x0a\x0a',
                            'style': 'tableHeader',
                            'bold': !0x0,
                            'alignment': 'left'
                        }),
                        ai && b5['icon'] && '' !== b5['icon'] && (b8 = await convert_image_to_base64(b5['icon']),
                        b9 = await get_img_width(b5['icon']),
                        ag['content']['push']({
                            'image': b8,
                            'fit': [0x64, 0x64 / (b9['width'] / b9['height'])]
                        }));
                        for ([ba,bb] of Object['entries'](b5['ctx']?.['sum'] || {})) {
                            var bc = [];
                            if ('wall' == ba) {
                                var bd = [{
                                    'text': lang['material'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['title'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['code'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['sizes'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['count_short'],
                                    'style': 'tableHeader'
                                }], bf, bg;
                                b6 && bd['push']({
                                    'text': lang['price'],
                                    'style': 'tableHeader'
                                }),
                                bc['push'](bd),
                                ag['content']['push']({
                                    'text': lang['wall_header'] + ':\x0a\x0a',
                                    'style': 'tableHeader'
                                });
                                for ([bf,bg] of Object['entries'](bb)) {
                                    var bh = [];
                                    bh['push'](bg['key_name'], bg['variant_name'] || bg['material_name'], bg['variant_code'] || bg['material_code'], bg['width'] + 'x' + bg['height'] + '\x20мм', round_decimals_2(bg['total_count']) + '\x20' + lang['units_' + bg['price_type']]),
                                    b6 && bh['push']({
                                        'text': format_price(bg['total_price']),
                                        'alignment': 'right'
                                    }),
                                    bc['push'](bh);
                                }
                                ag['content']['push']({
                                    'table': {
                                        'headerRows': 0x1,
                                        'widths': b7,
                                        'body': bc
                                    },
                                    'layout': af
                                }, {
                                    'text': '\x0a\x0a'
                                });
                            }
                            if ('butts' == ba) {
                                var bd = [{
                                    'text': lang['title'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['code'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['thickness'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['width'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['count_short'],
                                    'style': 'tableHeader'
                                }], bi, bj;
                                b6 && bd['push']({
                                    'text': lang['price'],
                                    'style': 'tableHeader'
                                }),
                                bc['push'](bd),
                                ag['content']['push']({
                                    'text': lang['edge'] + ':\x0a\x0a',
                                    'style': 'tableHeader'
                                });
                                for ([bi,bj] of Object['entries'](bb)) {
                                    var bk = [];
                                    bk['push'](bj['name'], bj['code'], bj['thickness'] + '\x20мм', bj['height'] + '\x20мм', round_decimals_2(bj['total_count']) + '\x20' + lang['units_' + bj['price_type']]),
                                    b6 && bk['push']({
                                        'text': format_price(bj['total_price']),
                                        'alignment': 'right'
                                    }),
                                    bc['push'](bk);
                                }
                                ag['content']['push']({
                                    'table': {
                                        'headerRows': 0x1,
                                        'widths': b7,
                                        'body': bc
                                    },
                                    'layout': af
                                }, {
                                    'text': '\x0a\x0a'
                                });
                            }
                            if ('butts_facade' == ba) {
                                var bl = [{
                                    'text': lang['material'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['facade'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['count_short'],
                                    'style': 'tableHeader'
                                }], bm, bn;
                                b6 && bl['push']({
                                    'text': lang['price'],
                                    'style': 'tableHeader'
                                }),
                                bc['push'](bl),
                                ag['content']['push']({
                                    'text': lang['facades_edge'] + ':\x0a\x0a',
                                    'style': 'tableHeader'
                                });
                                for ([bm,bn] of Object['entries'](bb)) {
                                    var bo = [];
                                    bo['push'](bn['mat_name'], bn['facade_name'], round_decimals_2(bn['total_count']) + '\x20' + lang['units_' + bn['price_type']]),
                                    b6 && bo['push']({
                                        'text': format_price(bn['total_price']),
                                        'alignment': 'right'
                                    }),
                                    bc['push'](bo);
                                }
                                ag['content']['push']({
                                    'table': {
                                        'headerRows': 0x1,
                                        'widths': b6 ? ['auto', '*', 'auto', 'auto'] : ['auto', '*', 'auto'],
                                        'body': bc
                                    },
                                    'layout': af
                                }, {
                                    'text': '\x0a\x0a'
                                });
                            }
                            if ('facade' == ba) {
                                var bl = [{
                                    'text': lang['material'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['title'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['code'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['sizes'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['count_short'],
                                    'style': 'tableHeader'
                                }], bp, bq;
                                b6 && bl['push']({
                                    'text': lang['price'],
                                    'style': 'tableHeader'
                                }),
                                bc['push'](bl),
                                ag['content']['push']({
                                    'text': lang['facades'] + ':\x0a\x0a',
                                    'style': 'tableHeader'
                                });
                                for ([bp,bq] of Object['entries'](bb)) {
                                    var br = [];
                                    br['push'](bq['mat_name'], bq['name'], bq['code'], bq['show_size'] ? round_decimals_2(bq['size']['x']) + 'x' + round_decimals_2(bq['size']['y']) + '\x20мм' : '', round_decimals_2(bq['total_count']) + '\x20' + lang['units_' + bq['price_type']]),
                                    b6 && br['push']({
                                        'text': format_price(bq['total_price']),
                                        'alignment': 'right'
                                    }),
                                    bc['push'](br);
                                }
                                ag['content']['push']({
                                    'table': {
                                        'headerRows': 0x1,
                                        'widths': b7,
                                        'body': bc
                                    },
                                    'layout': af
                                }, {
                                    'text': '\x0a\x0a'
                                });
                            }
                            if ('tabletop' == ba) {
                                var bs = [{
                                    'text': lang['title'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['code'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['sizes'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['common_sizes'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['count_short'],
                                    'style': 'tableHeader'
                                }], bu, bv;
                                b6 && bs['push']({
                                    'text': lang['price'],
                                    'style': 'tableHeader'
                                }),
                                bc['push'](bs),
                                ag['content']['push']({
                                    'text': lang['tabletop'] + ':\x0a\x0a',
                                    'style': 'tableHeader'
                                });
                                for ([bu,bv] of Object['entries'](bb)) {
                                    var bw = [];
                                    bw['push'](bv['name'], bv['code'], bv['width'] + 'x' + bv['height'] + '\x20мм', 'm' === bv['price_type'] || 'm2' === bv['price_type'] ? round_decimals_2(bv['total_width']) + '\x20' + lang['units_' + bv['price_type']] : round_decimals_2(bv['total_width_m']) + '\x20' + lang['units_m'], round_decimals_2(bv['total_count']) + '\x20' + lang['units_' + bv['price_type']]),
                                    b6 && bw['push']({
                                        'text': format_price(bv['total_price']),
                                        'alignment': 'right'
                                    }),
                                    bc['push'](bw);
                                }
                                ag['content']['push']({
                                    'table': {
                                        'headerRows': 0x1,
                                        'widths': b7,
                                        'body': bc
                                    },
                                    'layout': af
                                }, {
                                    'text': '\x0a\x0a'
                                });
                            }
                            if ('bort' == ba) {
                                var bs = [{
                                    'text': lang['title'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['code'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['sizes'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['common_sizes'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['count_short'],
                                    'style': 'tableHeader'
                                }], bx, by;
                                b6 && bs['push']({
                                    'text': lang['price'],
                                    'style': 'tableHeader'
                                }),
                                bc['push'](bs),
                                ag['content']['push']({
                                    'text': lang['tabletop_plints'] + ':\x0a\x0a',
                                    'style': 'tableHeader'
                                });
                                for ([bx,by] of Object['entries'](bb)) {
                                    var bz = [];
                                    bz['push'](by['name'], by['code'], by['width'] + 'x' + by['height'] + '\x20мм', 'm' === by['price_type'] || 'm2' === by['price_type'] ? round_decimals_2(by['total_width']) + '\x20' + lang['units_' + by['price_type']] : round_decimals_2(by['total_width_m']) + '\x20' + lang['units_m'], round_decimals_2(by['total_count']) + '\x20' + lang['units_' + by['price_type']]),
                                    b6 && bz['push']({
                                        'text': format_price(by['total_price']),
                                        'alignment': 'right'
                                    }),
                                    bc['push'](bz);
                                }
                                ag['content']['push']({
                                    'table': {
                                        'headerRows': 0x1,
                                        'widths': b7,
                                        'body': bc
                                    },
                                    'layout': af
                                }, {
                                    'text': '\x0a\x0a'
                                });
                            }
                            if ('cokol' == ba) {
                                var bA = [{
                                    'text': lang['title'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['code'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['sizes'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['common_sizes'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['count_short'],
                                    'style': 'tableHeader'
                                }], bB, bC;
                                b6 && bA['push']({
                                    'text': lang['price'],
                                    'style': 'tableHeader'
                                }),
                                bc['push'](bA),
                                ag['content']['push']({
                                    'text': lang['cokol'] + ':\x0a\x0a',
                                    'style': 'tableHeader'
                                });
                                for ([bB,bC] of Object['entries'](bb)) {
                                    var bD = [];
                                    bD['push'](bC['name'], bC['code'], bC['width'] + 'x' + bC['height'] + '\x20мм', 'm' === bC['price_type'] || 'm2' === bC['price_type'] ? round_decimals_2(bC['total_width']) + '\x20' + lang['units_' + bC['price_type']] : round_decimals_2(bC['total_width_m']) + '\x20' + lang['units_m'], round_decimals_2(bC['total_count']) + '\x20' + lang['units_' + bC['price_type']]),
                                    b6 && bD['push']({
                                        'text': format_price(bC['total_price']),
                                        'alignment': 'right'
                                    }),
                                    bc['push'](bD);
                                }
                                ag['content']['push']({
                                    'table': {
                                        'headerRows': 0x1,
                                        'widths': b7,
                                        'body': bc
                                    },
                                    'layout': af
                                }, {
                                    'text': '\x0a\x0a'
                                });
                            }
                            if ('cokol_top' == ba) {
                                var bA = [{
                                    'text': lang['title'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['code'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['sizes'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['common_sizes'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['count_short'],
                                    'style': 'tableHeader'
                                }], bE, bF;
                                b6 && bA['push']({
                                    'text': lang['price'],
                                    'style': 'tableHeader'
                                }),
                                bc['push'](bA),
                                ag['content']['push']({
                                    'text': lang['cokol_top'] + ':\x0a\x0a',
                                    'style': 'tableHeader'
                                });
                                for ([bE,bF] of Object['entries'](bb)) {
                                    var bG = [];
                                    bG['push'](bF['name'], bF['code'], bF['width'] + 'x' + bF['height'] + '\x20мм', 'm' === bF['price_type'] || 'm2' === bF['price_type'] ? round_decimals_2(bF['total_width']) + '\x20' + lang['units_' + bF['price_type']] : round_decimals_2(bF['total_width_m']) + '\x20' + lang['units_m'], round_decimals_2(bF['total_count']) + '\x20' + lang['units_' + bF['price_type']]),
                                    b6 && bG['push']({
                                        'text': format_price(bF['total_price']),
                                        'alignment': 'right'
                                    }),
                                    bc['push'](bG);
                                }
                                ag['content']['push']({
                                    'table': {
                                        'headerRows': 0x1,
                                        'widths': b7,
                                        'body': bc
                                    },
                                    'layout': af
                                }, {
                                    'text': '\x0a\x0a'
                                });
                            }
                            if ('cornice' == ba) {
                                var bH = [{
                                    'text': lang['title'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['code'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['common_sizes'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['cornice_width'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['count_short'],
                                    'style': 'tableHeader'
                                }], bI, bJ;
                                b6 && bH['push']({
                                    'text': lang['price'],
                                    'style': 'tableHeader'
                                }),
                                bc['push'](bH),
                                ag['content']['push']({
                                    'text': lang['cornice'] + ':\x0a\x0a',
                                    'style': 'tableHeader'
                                });
                                for ([bI,bJ] of Object['entries'](bb)) {
                                    var bK = [];
                                    bK['push'](bJ['name'], bJ['code'], bJ['total_width'] + '\x20м', bJ['width'] + '\x20м', round_decimals_2(bJ['total_count']) + '\x20' + lang['units_' + bJ['price_type']]),
                                    b6 && bK['push']({
                                        'text': format_price(bJ['total_price']),
                                        'alignment': 'right'
                                    }),
                                    bc['push'](bK);
                                }
                                ag['content']['push']({
                                    'table': {
                                        'headerRows': 0x1,
                                        'widths': b7,
                                        'body': bc
                                    },
                                    'layout': af
                                }, {
                                    'text': '\x0a\x0a'
                                });
                            }
                            if ('item' == ba) {
                                var bL = [{
                                    'text': lang['title'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['code'],
                                    'style': 'tableHeader'
                                }, {
                                    'text': lang['count_short'],
                                    'style': 'tableHeader'
                                }], bM, bN;
                                b6 && bL['push']({
                                    'text': lang['price'],
                                    'style': 'tableHeader'
                                }),
                                bc['push'](bL),
                                ag['content']['push']({
                                    'text': lang['accessories_furniture'] + ':\x0a\x0a',
                                    'style': 'tableHeader'
                                });
                                for ([bM,bN] of Object['entries'](bb)) {
                                    var bO = [];
                                    bO['push'](bN['name'], bN['code'], round_decimals_2(bN['total_count']) + '\x20' + lang['units_' + bN['price_type']]),
                                    b6 && bO['push']({
                                        'text': format_price(bN['total_price']),
                                        'alignment': 'right'
                                    }),
                                    bc['push'](bO);
                                }
                                var bP = [];
                                for (let cr = 0x0; cr < bL['length']; cr++)
                                    0x0 == cr ? bP['push']('*') : bP['push']('auto');
                                ag['content']['push']({
                                    'table': {
                                        'headerRows': 0x1,
                                        'widths': bP,
                                        'body': bc
                                    },
                                    'layout': af
                                }, {
                                    'text': '\x0a\x0a'
                                });
                            }
                        }
                        b6 && ag['content']['push']({
                            'text': lang['price_module'] + ':\x20' + format_price(b5['price']) + '\x0a\x0a',
                            'style': 'tableHeader',
                            'bold': !0x1,
                            'italics': !0x0,
                            'alignment': 'left'
                        }, {
                            'text': '\x0a'
                        });
                    }
            }
            'function' == typeof pdf_generation_callback && pdf_generation_callback(ag),
            a0 || (cg = null);
            let cn = await pdfMake['createPdf'](ag);
            switch (a1) {
            case 'all':
                return {
                    'base64': new Promise(function(cs, ct) {
                        cn['getDataUrl'](function(cu) {
                            cs(cu);
                        });
                    }
                    ),
                    'blob': new Promise(function(cs, ct) {
                        cn['getBlob'](function(cu) {
                            cs(cu);
                        });
                    }
                    )
                };
            case 'blob':
                return new Promise(function(cs, ct) {
                    cn['getBlob'](function(cu) {
                        cs(cu);
                    });
                }
                );
            default:
                return new Promise(function(cs, ct) {
                    cn['getDataUrl'](function(cu) {
                        cs(cu);
                    });
                }
                );
            }
            return 'send' === action ? new Promise(function(cs, ct) {
                cn['getDataUrl'](function(cu) {
                    cs(cu);
                });
            }
            ) : 'blob' === action ? new Promise(function(cs, ct) {
                cn['getBlob'](function(cu) {
                    cs(cu);
                });
            }
            ) : void ('new_tab' === action ? cn['getDataUrl'](cs => {
                open_data_uri_window(cs);
            }
            ) : 'download' === action && (a9 = (aa = new Date())['getDate']() + '.' + (aa['getMonth']() + 0x1) + '.' + aa['getFullYear']() + '_' + aa['getHours']() + ':' + aa['getMinutes']() + '.pdf',
            cn['download'](a9)));
        }
    } else {
        if (dControls['clear_selected'](),
        await check_pdf_lib(),
        'function' == typeof custom_pdf_generation)
            return custom_pdf_generation(a1);
        if (!(-0x1 < location['href']['indexOf']('modulit.co.il'))) {
            let cs = sc['get_specs'](!0x0);
            var a3 = global_options['pdf']['width']
              , a5 = global_options['pdf']['height']
              , a4 = global_options['pdf']['img_size_offset_x']
              , a6 = global_options['pdf']['img_size_offset_y']
              , a7 = global_options['pdf']['img_pos_x']
              , a8 = global_options['pdf']['img_pos_y']
              , a2 = global_options['pdf']['img_size_multi'];
            let ct;
            var aa = $('.client_logo\x20img')[0x0];
            if (void 0x0 !== aa && void 0x0 !== aa['src'])
                try {
                    ct = logo_to_base64(aa);
                } catch (cE) {}
            let cu = get_modules();
            var bQ = get_shelves(), bR, bS = {
                'hLineWidth': function(cF, cG) {
                    return 0.1;
                },
                'vLineWidth': function(cF, cG) {
                    return 0.1;
                },
                'hLineColor': function(cF, cG) {
                    return 'gray';
                },
                'vLineColor': function(cF, cG) {
                    return 'gray';
                },
                'paddingLeft': function(cF, cG) {
                    return 0x6;
                },
                'paddingRight': function(cF, cG) {
                    return 0x6;
                },
                'paddingTop': function(cF, cG) {
                    return 0x3;
                },
                'paddingBottom': function(cF, cG) {
                    return 0x3;
                }
            }, bT, bU, a3, a4;
            let cv = {
                'pageSize': 'A4',
                'pageOrientation': 'landscape',
                'pageMargins': [pdf_settings['lm'], pdf_settings['tm'], pdf_settings['rm'], pdf_settings['bm']],
                'footer': function(cF, cG) {
                    return {
                        'columns': [{
                            'width': '*',
                            'text': $('.client_data')['html']()['trim'](),
                            'alignment': 'left',
                            'margin': [0x55, 0x0, 0x0, 0x0]
                        }, {
                            'width': 0x5c,
                            'text': cF['toString']() + '\x20' + lang['pages_of'] + '\x20' + cG,
                            'alignment': 'right',
                            'margin': [0x0, 0x0, 0x2a, 0x0]
                        }]
                    };
                },
                'content': [],
                'styles': {
                    'tableHeader': {
                        'bold': !0x1,
                        'fontSize': 0xc
                    }
                },
                'defaultStyle': {
                    'fontSize': 0xa,
                    'bold': !0x1
                }
            }
              , cw = (ct && (cv['header'] = {
                'image': ct,
                'opacity': 0.3,
                'fit': [0x64, 0x64],
                'margin': [0x0, 0x0, 0x2a, 0x0],
                'absolutePosition': {
                    'x': 0xf,
                    'y': 0xa
                },
                'alignment': 'right'
            }),
            {});
            (cw = a0 || get_images({
                'width': a3 * a2,
                'height': a5 * a2
            }))['common_view'] && cv['content']['push']({
                'image': cw['common_view'],
                'fit': [a3 - a4, a5 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            0x1 == pdf_settings['german'] && (cw['front_view_color'] && cv['content']['push']({
                'image': cw['front_view_color'],
                'fit': [a3 - 0x1e, a5 - 0x1e],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'alignment': 'center',
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            cw['back_view_color'] && cv['content']['push']({
                'image': cw['back_view_color'],
                'fit': [a3 - a4, a5 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            cw['left_view_color'] && cv['content']['push']({
                'image': cw['left_view_color'],
                'fit': [a3 - a4, a5 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            cw['right_view_color']) && cv['content']['push']({
                'image': cw['right_view_color'],
                'fit': [a3 - a4, a5 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            cw['edges_view'] && cv['content']['push']({
                'image': cw['edges_view'],
                'fit': [a3 - a4, a5 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            cw['comms_only_view'] && cv['content']['push']({
                'image': cw['comms_only_view'],
                'fit': [a3 - a4, a5 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            cw['top_view'] && cv['content']['push']({
                'image': cw['top_view'],
                'fit': [a3 - a4, a5 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            0x1 == pdf_settings['german'] && cw['tabletop_view'] && cv['content']['push']({
                'image': cw['tabletop_view'],
                'fit': [a3 - a4, a5 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            cw['front_view'] && cv['content']['push']({
                'image': cw['front_view'],
                'fit': [a3 - a4, a5 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            cw['back_view'] && cv['content']['push']({
                'image': cw['back_view'],
                'fit': [a3 - a4, a5 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            cw['left_view'] && cv['content']['push']({
                'image': cw['left_view'],
                'fit': [a3 - a4, a5 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            }),
            cw['right_view'] && cv['content']['push']({
                'image': cw['right_view'],
                'fit': [a3 - a4, a5 - a6],
                'absolutePosition': {
                    'x': a7,
                    'y': a8
                },
                'margin': [0x0, 0x0, 0x0, 0x0],
                'pageBreak': 'after'
            });
            let cx, cy, cz, cA, cB;
            if (!0x0 !== pdf_settings['force_top_bottom_materials'] && !0x0 !== pdf_settings['add_material_to_module_name'] || (cy = void 0x0 !== project_settings['selected_materials']['top']['facades'] ? objectFindByKey(materials_catalog['items'], 'id', project_settings['selected_materials']['top']['facades']) : ((cx = objectFindByKey(ct, 'id', project_settings['materials']['top']['facades'][0x0]))['items']['length'] ? cx : cx['categories'][0x0])['items'][0x0],
            cz = void 0x0 !== project_settings['selected_materials']['bottom']['facades'] ? objectFindByKey(materials_catalog['items'], 'id', project_settings['selected_materials']['bottom']['facades']) : ((cx = objectFindByKey(ct, 'id', project_settings['materials']['bottom']['facades'][0x0]))['items']['length'] ? cx : cx['categories'][0x0])['items'][0x0],
            cA = objectFindByKey(materials_catalog['items'], 'id', project_settings['selected_materials']['top']['corpus']),
            cB = objectFindByKey(materials_catalog['items'], 'id', project_settings['selected_materials']['bottom']['corpus'])),
            cv['content']['push']({
                'text': lang['materials_list'] + ':\x0a\x0a',
                'style': 'tableHeader'
            }),
            void 0x0 !== project_settings['name'] && cv['content']['push']({
                'text': lang['kitchen_model'] + ':\x20' + project_settings['name'] + '\x0a\x0a'
            }),
            !0x0 === pdf_settings['force_top_bottom_materials'] && (cv['content']['push']({
                'text': lang['top_facades'] + ':\x20' + cy['name']
            }),
            cv['content']['push']({
                'text': lang['bottom_facades'] + ':\x20' + cz['name'] + '\x0a\x0a'
            }),
            cv['content']['push']({
                'text': lang['corpus_top'] + ':\x20' + cA['name']
            }),
            cv['content']['push']({
                'text': lang['corpus_bottom'] + ':\x20' + cB['name'] + '\x0a\x0a'
            })),
            !0x1 !== pdf_settings['report_facades_material'] && (cv['content']['push']({
                'text': lang['facades'] + ':\x0a\x0a',
                'style': 'tableHeader'
            }),
            Object['keys'](cs['facades'])['forEach'](function(cF) {
                let cG = cs['facades'][cF];
                Object['keys'](cG)['forEach'](function(cH) {
                    let cI = cG[cH];
                    Object['keys'](cI)['forEach'](function(cJ) {
                        var cK = cJ['split']('_'), cL = {
                            'parent_category_name': '',
                            'category_name': '',
                            'name': '',
                            'type_name': ''
                        }, cK = facades_lib['get_item'](cK[0x0]), cK, cM, cM, cK, cM, cL;
                        null != cH && 'undefined' != cH && (cK && (cL['name'] += cK['name'] + '\x20',
                        cL['type_name'] += cK['types'][cH]['name']),
                        cK['category'] && ((cK = facades_lib['get_category'](cK['category'])) && (cL['category_name'] += cK['name'] + '\x20'),
                        cK['parent']) && (cM = '',
                        cM = find_obj_by_id(facades_categories, cK['parent'])) && (cL['parent_category_name'] += cM['name'] + '\x20'),
                        cK = cL['parent_category_name'] + cL['category_name'] + cL['name'] + cL['type_name'],
                        cM = {
                            'parent_category_name': '',
                            'category_name': '',
                            'name': '',
                            'code': '',
                            'm2': '',
                            'pm': ''
                        },
                        cI[cJ]['mat_data'] && (cI[cJ]['mat_data']['parent_category_name'] && (cM['parent_category_name'] = cI[cJ]['mat_data']['parent_category_name'] += '\x20'),
                        cI[cJ]['mat_data']['category_name'] && (cM['category_name'] = cI[cJ]['mat_data']['category_name'] += '\x20'),
                        cI[cJ]['mat_data']['name'] && (cM['name'] = cI[cJ]['mat_data']['name'] += '\x20'),
                        cI[cJ]['mat_data']['code'] && (cM['code'] = cI[cJ]['mat_data']['code'] += '\x20'),
                        cI[cJ]['m2'] && (cM['m2'] = parseFloat(cI[cJ]['m2'])['toFixed'](0x2)),
                        cI[cJ]['pm']) && (cM['pm'] = cI[cJ]['pm']),
                        cL = cM['parent_category_name'] + cM['category_name'] + cM['name'] + cM['code'],
                        cv['content']['push']({
                            'text': cK
                        }),
                        cv['content']['push']({
                            'text': cL
                        }),
                        cM['m2'] && '' != cM['m2'] && 0x0 != cM['m2'] && cv['content']['push']({
                            'text': lang['units_square'] + ':\x20' + cM['m2']
                        }),
                        cM['pm'] && '' != cM['pm'] && 0x0 != cM['pm'] && cv['content']['push']({
                            'text': lang['units_pogon'] + ':\x20' + cM['pm']
                        }),
                        cv['content']['push']({
                            'text': '\x0a'
                        }));
                    });
                });
            }),
            cv['content']['push']({
                'text': '\x0a'
            }),
            Object['keys'](cs['facades_edge'])['length'] && (cv['content']['push']({
                'text': lang['facades_edge'] + ':\x0a\x0a',
                'style': 'tableHeader'
            }),
            Object['keys'](cs['facades_edge'])['forEach'](function(cF) {
                build_pdf_material_block(cv['content'], cs['facades_edge'][cF]);
            })),
            cv['content']['push']({
                'text': '\x0a'
            })),
            !0x1 !== pdf_settings['report_glass_material'] && project_settings['materials']['glass'] && null != project_settings['materials']['glass'][0x0] && Object['keys'](cs['glass'])['length'] && (cv['content']['push']({
                'text': lang['glass_materials'] + ':\x0a\x0a',
                'style': 'tableHeader'
            }),
            Object['keys'](cs['glass'])['forEach'](function(cF) {
                build_pdf_material_block(cv['content'], cs['glass'][cF]);
            }),
            cv['content']['push']({
                'text': '\x0a'
            })),
            !0x1 !== pdf_settings['report_corpus_material'] && (Object['keys'](cs['corpus'])['length'] && (cv['content']['push']({
                'text': lang['corpus'] + ':\x0a\x0a',
                'style': 'tableHeader'
            }),
            Object['keys'](cs['corpus'])['forEach'](function(cF) {
                Object['keys'](cs['corpus'][cF])['forEach'](function(cG) {
                    build_pdf_material_block(cv['content'], cs['corpus'][cF][cG], cF);
                });
            }),
            cv['content']['push']({
                'text': '\x0a'
            })),
            Object['keys'](cs['edge'])['length'] && (cv['content']['push']({
                'text': lang['edge'] + ':\x0a\x0a',
                'style': 'tableHeader'
            }),
            Object['keys'](cs['edge'])['forEach'](function(cF) {
                build_pdf_material_block(cv['content'], cs['edge'][cF]);
            })),
            Object['keys'](cs['shelves'])['length']) && (cv['content']['push']({
                'text': lang['shelves'] + ':\x0a\x0a',
                'style': 'tableHeader'
            }),
            Object['keys'](cs['shelves'])['forEach'](function(cF) {
                Object['keys'](cs['shelves'][cF])['forEach'](function(cG) {
                    build_pdf_material_block(cv['content'], cs['shelves'][cF][cG], cF);
                });
            }),
            cv['content']['push']({
                'text': '\x0a'
            })),
            !0x1 !== pdf_settings['report_cokol_material'] && null == facades_lib['items'][project_settings['defaults']['facades']['top']]['fs_id'] && Object['keys'](cs['cokol'])['length'] && (cv['content']['push']({
                'text': lang['cokol'] + ':\x0a\x0a',
                'style': 'tableHeader'
            }),
            Object['keys'](cs['cokol'])['forEach'](function(cF) {
                build_pdf_material_block(cv['content'], cs['cokol'][cF]);
            }),
            cv['content']['push']({
                'text': '\x0a'
            })),
            !0x1 !== pdf_settings['report_tabletop_material'] && (Object['keys'](cs['tabletop'])['length'] && (cv['content']['push']({
                'text': lang['tabletop'] + ':\x0a\x0a',
                'style': 'tableHeader'
            }),
            Object['keys'](cs['tabletop'])['forEach'](function(cF) {
                build_pdf_material_block(cv['content'], cs['tabletop'][cF]);
            }),
            cv['content']['push']({
                'text': '\x0a'
            })),
            Object['keys'](cs['tabletop_plints'])['length']) && (cv['content']['push']({
                'text': lang['tabletop_plints'] + ':\x0a\x0a',
                'style': 'tableHeader'
            }),
            Object['keys'](cs['tabletop_plints'])['forEach'](function(cF) {
                build_pdf_material_block(cv['content'], cs['tabletop_plints'][cF]);
            }),
            cv['content']['push']({
                'text': '\x0a'
            })),
            !0x1 !== pdf_settings['report_wallpanel_material'] && Object['keys'](cs['wallpanel'])['length'] && (cv['content']['push']({
                'text': lang['wallpanel'] + ':\x0a\x0a',
                'style': 'tableHeader'
            }),
            Object['keys'](cs['wallpanel'])['forEach'](function(cF) {
                build_pdf_material_block(cv['content'], cs['wallpanel'][cF]);
            }),
            cv['content']['push']({
                'text': '\x0a'
            })),
            !0x1 !== pdf_settings['report_handle'] && 0x0 == project_settings['handle']['no_handle'] && (0x0 === project_settings['handle']['selected_model'] && (project_settings['handle']['selected_model'] = 0x1),
            Object['keys'](cs['handles'])['length'])) {
                cv['content']['push']({
                    'text': lang['handles'] + ':\x0a\x0a',
                    'style': 'tableHeader'
                });
                let cF = {};
                Object['keys'](cs['handles'])['forEach'](function(cG) {
                    let cH = objectFindByKey(handles_catalog['items'], 'id', cs['handles'][cG]['id']);
                    if (cH = cH || {
                        'name': lang['handles']
                    },
                    'common' == cs['handles'][cG]['type']) {
                        let cI = '';
                        cH['name'] && (cI += cH['name']),
                        cH['code'] && (cI += '\x20' + cH['code']),
                        cs['handles'][cG]['width'] && (cI += ',\x20' + cs['handles'][cG]['width'] + '\x20' + lang['mm']),
                        cs['handles'][cG]['count'] && (cI += ',\x20' + cs['handles'][cG]['count'] + '\x20' + lang['units_pcs']),
                        cI['length'] && (cI += '\x0a\x0a'),
                        cv['content']['push']({
                            'text': cI
                        });
                    }
                    if ('facade_profile' == cs['handles'][cG]['type']) {
                        let cJ = '';
                        cH['name'] && (cJ += cH['name']),
                        cH['code'] && (cJ += '\x20' + cH['code']),
                        cs['handles'][cG]['width'] && (cJ += ',\x20' + cs['handles'][cG]['width'] + '\x20' + lang['mm']),
                        cs['handles'][cG]['count'] && (cJ += ',\x20' + cs['handles'][cG]['count'] + '\x20' + lang['units_pcs']),
                        cJ['length'] && (cJ += '\x0a\x0a'),
                        cv['content']['push']({
                            'text': cJ
                        }),
                        cF[cs['handles'][cG]['id']] ? cF[cs['handles'][cG]['id']]['width'] += parseInt(cs['handles'][cG]['width']) * parseInt(cs['handles'][cG]['count']) : cF[cs['handles'][cG]['id']] = {
                            'width': parseInt(cs['handles'][cG]['width']) * parseInt(cs['handles'][cG]['count']),
                            'name': cH['name']
                        };
                    }
                    if ('gola' == cs['handles'][cG]['type']) {
                        let cK = '';
                        cH['name'] && (cK += cH['name']),
                        cH['code'] && (cK += '\x20' + cH['code']),
                        cs['handles'][cG]['width'] && (cK += ',\x20' + cs['handles'][cG]['width'] + '\x20' + lang['mm']),
                        cs['handles'][cG]['count'] && (cK += ',\x20' + cs['handles'][cG]['count'] + '\x20' + lang['units_pcs']),
                        cK['length'] && (cK += '\x0a\x0a'),
                        cv['content']['push']({
                            'text': cK
                        }),
                        cF[cs['handles'][cG]['id']] ? cF[cs['handles'][cG]['id']]['width'] += parseInt(cs['handles'][cG]['width']) * parseInt(cs['handles'][cG]['count']) : cF[cs['handles'][cG]['id']] = {
                            'width': parseInt(cs['handles'][cG]['width']) * parseInt(cs['handles'][cG]['count']),
                            'name': cH['name']
                        };
                    }
                }),
                Object['keys'](cF)['forEach'](function(cG) {
                    cv['content']['push']({
                        'text': lang['total'] + ':\x0a\x0a'
                    }),
                    cv['content']['push']({
                        'text': cF[cG]['name'] + ':\x20' + cF[cG]['width'] + '\x20' + lang['units_flat'] + '\x0a\x0a'
                    });
                }),
                cv['content']['push']({
                    'text': '\x0a'
                });
            }
            let cC = {
                'modules': 0x0,
                'wall_panel': 0x0
            };
            if (0x0 != constructor_settings['price_enabled'] && (cC = get_total_price_test()),
            !0x1 !== pdf_settings['report_modules_list']) {
                if (0x0 < cu['length']) {
                    var bV = [], a9 = [], aa;
                    a9['push']({
                        'text': '№',
                        'style': 'tableHeader'
                    }, {
                        'text': lang['title'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['code'],
                        'style': 'tableHeader'
                    }),
                    0x1 == pdf_settings['german'] && a9['unshift']({
                        'text': lang['image'],
                        'style': 'tableHeader'
                    }),
                    0x1 == pdf_settings['report_modules_sizes_column'] && a9['push']({
                        'text': lang['sizes'],
                        'style': 'tableHeader'
                    }),
                    0x0 != constructor_settings['price_enabled'] && a9['push']({
                        'text': lang['price'],
                        'style': 'tableHeader'
                    }),
                    bV['push'](a9);
                    let cG = 0x0;
                    for (let cH = 0x0; cH < cu['length']; cH++) {
                        var bW = [];
                        if (0x1 == pdf_settings['german']) {
                            if ('Cabinet' == cu[cH]['type']) {
                                let cI = await get_async(mod_lib['get_item'](cu[cH]['params']['id'])['icon']);
                                cI = cI || await get_async('/common_assets/images/ni.jpg'),
                                bW['push']({
                                    'image': cI,
                                    'fit': [0x64, 0x64],
                                    'alignment': 'center'
                                });
                            } else
                                cu[cH]['params']['catalog'] && ('Other' == cu[cH]['params']['catalog'] && bW['push']({
                                    'image': await get_async(find_obj_by_id(other_models['items'], cu[cH]['params']['id'])['icon']),
                                    'fit': [0x64, 0x64],
                                    'alignment': 'center'
                                }),
                                'Tech' == cu[cH]['params']['catalog'] && bW['push']({
                                    'image': await get_async(find_obj_by_id(tech_catalog['items'], cu[cH]['params']['id'])['icon']),
                                    'fit': [0x64, 0x64],
                                    'alignment': 'center'
                                }),
                                'Comms' == cu[cH]['params']['catalog']) && bW['push']({
                                    'image': await get_async(find_obj_by_id(comms_catalog['items'], cu[cH]['params']['id'])['icon']),
                                    'fit': [0x64, 0x64],
                                    'alignment': 'center'
                                });
                        }
                        if (bW['push']({
                            'text': cu[cH]['pdf_number']
                        }),
                        !0x0 === pdf_settings['add_material_to_module_name'] ? 'top' === cu[cH]['params']['cabinet_group'] ? bW['push']({
                            'text': cu[cH]['params']['name'] + '\x20' + cy['name']
                        }) : bW['push']({
                            'text': cu[cH]['params']['name'] + '\x20' + cz['name']
                        }) : bW['push']({
                            'text': cu[cH]['params']['name']
                        }),
                        bW['push']({
                            'text': cu[cH]['params']['code']
                        }),
                        0x1 == pdf_settings['report_modules_sizes_column'] && (!0x0 === pdf_settings['exact_module_depth'] || !0x0 === pdf_settings['report_modules_exact_depth'] ? 'Cabinet' == cu[cH]['type'] ? bW['push']({
                            'text': cu[cH]['params']['cabinet']['width'] + 'x' + cu[cH]['params']['cabinet']['height'] + 'x' + cu[cH]['const']['calculated_depth']
                        }) : 'CabinetN' == cu[cH]['temp_type'] ? bW['push']({
                            'text': cu[cH]['params']['size']['x'] + 'x' + cu[cH]['params']['size']['y'] + 'x' + cu[cH]['params']['size']['z']
                        }) : cu[cH]['params']['opens_support'] ? bW['push']({
                            'text': cu[cH]['params']['variants'][cu[cH]['params']['selected_variant']]['width'] + 'x' + cu[cH]['params']['variants'][cu[cH]['params']['selected_variant']]['height'] + 'x' + cu[cH]['params']['variants'][cu[cH]['params']['selected_variant']]['depth']
                        }) : bW['push']({
                            'text': cu[cH]['params']['width'] + 'x' + cu[cH]['params']['height'] + 'x' + cu[cH]['params']['depth']
                        }) : 'Cabinet' == cu[cH]['type'] ? bW['push']({
                            'text': cu[cH]['params']['cabinet']['width'] + 'x' + cu[cH]['params']['cabinet']['height'] + 'x' + cu[cH]['params']['cabinet']['depth']
                        }) : 'CabinetN' == cu[cH]['temp_type'] ? bW['push']({
                            'text': cu[cH]['params']['size']['x'] + 'x' + cu[cH]['params']['size']['y'] + 'x' + cu[cH]['params']['size']['z']
                        }) : cu[cH]['params']['opens_support'] ? bW['push']({
                            'text': cu[cH]['params']['variants'][cu[cH]['params']['selected_variant']]['width'] + 'x' + cu[cH]['params']['variants'][cu[cH]['params']['selected_variant']]['height'] + 'x' + cu[cH]['params']['variants'][cu[cH]['params']['selected_variant']]['depth']
                        }) : bW['push']({
                            'text': cu[cH]['params']['width'] + 'x' + cu[cH]['params']['height'] + 'x' + cu[cH]['params']['depth']
                        })),
                        0x0 != constructor_settings['price_enabled']) {
                            if (0x1 == constructor_settings['shop_mode'] || 0x0 == pdf_settings['report_modules_details'])
                                bW['push']({
                                    'text': format_price(cu[cH]['get_price']()),
                                    'alignment': 'right'
                                });
                            else {
                                let cJ = {
                                    'corpus': lang['corpus'],
                                    'edge': lang['edge'],
                                    'cokol': lang['cokol'],
                                    'tabletop': lang['tabletop'],
                                    'tabletop_plints': lang['tabletop_plints'],
                                    'facades': lang['facades'],
                                    'facades_edge': lang['facades_edge'],
                                    'facades_fixed': lang['facades'],
                                    'handles': lang['handles'],
                                    'glass': lang['glass_materials'],
                                    'furniture': lang['furniture'],
                                    'accessories': lang['accessories'],
                                    'back_wall': lang['back_wall_cabinet']
                                }
                                  , cK = [];
                                var bX = [0x37, 0x96, 0x4b, 0x2d, 0x4b]
                                  , bY = [];
                                bY['push']({
                                    'text': lang['type'],
                                    'bold': !0x0
                                }, {
                                    'text': lang['name'],
                                    'bold': !0x0
                                }, {
                                    'text': lang['price'],
                                    'bold': !0x0,
                                    'alignment': 'right'
                                }, {
                                    'text': lang['count_short'],
                                    'bold': !0x0,
                                    'alignment': 'right'
                                }, {
                                    'text': lang['total'],
                                    'bold': !0x0,
                                    'alignment': 'right'
                                }),
                                'Model' != cu[cH]['type'] && cK['push'](bY),
                                cu[cH]['price_description'] || (cu[cH]['price_description'] = {
                                    'test': cu[cH]['get_price']()
                                }),
                                Object['keys'](cu[cH]['price_description'])['forEach'](function(cN) {
                                    var cO = cu[cH]['price_description'][cN];
                                    for (let cR = 0x0; cR < cO['length']; cR++) {
                                        ce('123312');
                                        var cP = cO[cR];
                                        let cS = 0x0;
                                        'items' == cN ? cS = cP['count'] + '\x20' + lang[cP['units']] : (cS = cP['count'] || ('facades_edge' == cN ? cP['per'] : 'edge' == cN ? cP['pm'] : cP['m2']),
                                        cP['count'] ? cS += '\x20' + lang['units_pcs'] : cS = 'facades_edge' == cN || 'edge' == cN ? cS + '\x20' + lang['units_flat'] : to_fix2(cS) + '\x20' + lang['units_square']);
                                        var cQ = [];
                                        if (cQ['push']('materials' == cN ? {
                                            'text': cP['material']['name_f']
                                        } : {
                                            'text': cJ[cN]
                                        }),
                                        cQ['push']('materials' == cN ? {
                                            'text': cP['decor']['name_f']
                                        } : {
                                            'text': cP['name']
                                        }),
                                        cQ['push']('furniture' == cN || 'accessories' == cN ? {
                                            'text': format_price(cP['price_per_piece']),
                                            'alignment': 'right'
                                        } : {
                                            'text': format_price(cP['price_per_piece'] * constructor_settings['price_modificator']),
                                            'alignment': 'right'
                                        }),
                                        cQ['push']({
                                            'text': cS,
                                            'alignment': 'right'
                                        }),
                                        'furniture' == cN || 'accessories' == cN)
                                            cQ['push']({
                                                'text': format_price(cP['price']),
                                                'alignment': 'right'
                                            });
                                        else {
                                            let cT = format_price(cP['price'] * constructor_settings['price_modificator']);
                                            'Model' == cu[cH]['type'] && (cT = format_price(cu[cH]['get_price']())),
                                            cQ['push']({
                                                'text': cT,
                                                'alignment': 'right'
                                            });
                                        }
                                        cK['push'](cQ);
                                    }
                                });
                                let cL = format_price(cu[cH]['params']['price'])
                                  , cM = ('Model' == cu[cH]['type'] && (cL = format_price(cu[cH]['get_price']())),
                                ['', '', {
                                    'text': '',
                                    'colspan': 0x3
                                }, {
                                    'text': lang['total'] + ':',
                                    'alignment': 'right',
                                    'bold': !0x0
                                }, {
                                    'text': cL,
                                    'alignment': 'right',
                                    'bold': !0x0
                                }]);
                                'Model' == cu[cH]['type'] && (cL = to_fix2(cu[cH]['get_price']()),
                                cM = ['', '', {
                                    'text': '',
                                    'colspan': 0x3
                                }, '', {
                                    'text': cL,
                                    'alignment': 'right',
                                    'bold': !0x0
                                }]),
                                cK['push'](cM),
                                bW['push']({
                                    'table': {
                                        'widths': bX,
                                        'dontBreakRows': !0x0,
                                        'body': cK
                                    },
                                    'layout': bS
                                });
                            }
                        }
                        0x0 != constructor_settings['price_enabled'] && (cG += parseFloat(cu[cH]['get_price']()['toFixed'](0x2))),
                        bV['push'](bW);
                    }
                    0x0 != constructor_settings['price_enabled'] && (aa = ['', '', {
                        'text': '',
                        'colspan': 0x3
                    }, {
                        'text': lang['total'] + ':',
                        'alignment': 'right',
                        'bold': !0x0,
                        'style': 'tableHeader'
                    }, {
                        'text': format_price(cG),
                        'alignment': 'right',
                        'bold': !0x0,
                        'style': 'tableHeader'
                    }],
                    0x0 == pdf_settings['report_modules_sizes_column'] && aa['splice'](0x2, 0x1),
                    0x1 == pdf_settings['german'] && aa['unshift'](''),
                    bV['push'](aa)),
                    cv['content']['push']({
                        'text': lang['modules_list'] + ':',
                        'style': 'tableHeader'
                    });
                    var a2 = ['auto', '*', 0x32, 0x50, 'auto'];
                    0x1 == pdf_settings['german'] ? (a2['unshift']('auto'),
                    0x0 == constructor_settings['price_enabled'] && a2['splice'](a2['length'] - 0x1, 0x1),
                    0x0 == pdf_settings['report_modules_sizes_column'] && a2['splice'](0x4, 0x1)) : (0x0 == constructor_settings['price_enabled'] && a2['splice'](a2['length'] - 0x1, 0x1),
                    0x0 == pdf_settings['report_modules_sizes_column'] && a2['splice'](0x3, 0x1)),
                    ce(),
                    cv['content']['push']({
                        'table': {
                            'headerRows': 0x1,
                            'widths': a2,
                            'dontBreakRows': !0x1,
                            'body': bV
                        },
                        'layout': bS
                    }, {
                        'text': '\x0a\x0a'
                    });
                }
                if (0x0 < bQ['length']) {
                    var bZ = [], a3 = [], a4;
                    a3['push']({
                        'text': '№',
                        'style': 'tableHeader'
                    }, {
                        'text': lang['title'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['code'],
                        'style': 'tableHeader'
                    }),
                    0x1 == pdf_settings['report_modules_sizes_column'] && a3['push']({
                        'text': lang['sizes'],
                        'style': 'tableHeader'
                    }),
                    0x0 != constructor_settings['price_enabled'] && a3['push']({
                        'text': lang['price'],
                        'style': 'tableHeader'
                    }),
                    bZ['push'](a3);
                    let cN = 0x0;
                    for (let cO = 0x0; cO < bQ['length']; cO++) {
                        var c0 = [];
                        c0['push']({
                            'text': bQ[cO]['pdf_number']
                        }),
                        c0['push']({
                            'text': bQ[cO]['params']['name']
                        }),
                        c0['push']({
                            'text': bQ[cO]['params']['code']
                        }),
                        0x1 == pdf_settings['report_modules_sizes_column'] && c0['push']({
                            'text': bQ[cO]['params']['width'] + 'x' + bQ[cO]['params']['height'] + 'x' + bQ[cO]['params']['thickness']
                        }),
                        0x0 != constructor_settings['price_enabled'] && c0['push']({
                            'text': bQ[cO]['get_price']()['toFixed'](0x2) + '\x20' + lang['currency'],
                            'alignment': 'right'
                        }),
                        0x0 != constructor_settings['price_enabled'] && (cN += parseFloat(bQ[cO]['get_price']()['toFixed'](0x2))),
                        bZ['push'](c0);
                    }
                    0x0 != constructor_settings['price_enabled'] && (a4 = ['', '', {
                        'text': '',
                        'colspan': 0x3
                    }, {
                        'text': lang['total'] + ':',
                        'alignment': 'right',
                        'style': 'tableHeader'
                    }, {
                        'text': cN['toFixed'](0x2) + '\x20' + lang['currency'],
                        'alignment': 'right',
                        'style': 'tableHeader'
                    }],
                    0x0 == pdf_settings['report_modules_sizes_column'] && a4['splice'](0x2, 0x1),
                    bZ['push'](a4)),
                    cv['content']['push']({
                        'text': lang['shelves_list'] + ':',
                        'style': 'tableHeader'
                    });
                    var a5 = [0xa, '*', 'auto', 'auto', 'auto'];
                    0x0 == constructor_settings['price_enabled'] && a5['splice'](a5['length'] - 0x1, 0x1),
                    0x0 == pdf_settings['report_modules_sizes_column'] && a5['splice'](a5['length'] - 0x1, 0x1),
                    cv['content']['push']({
                        'table': {
                            'headerRows': 0x1,
                            'widths': a5,
                            'body': bZ
                        },
                        'layout': bS
                    }, {
                        'text': '\x0a\x0a'
                    });
                }
            }
            if (!0x1 !== pdf_settings['report_furniture'] && 0x0 == pdf_settings['report_modules_details'] && void 0x0 !== accsessories_data['types']) {
                let cP = 0x0;
                if (Object['keys'](accsessories_data['default'])['forEach'](function(cQ) {
                    null !== accsessories_data['default'][cQ] && (cP = 0x1);
                }),
                0x0 !== cP) {
                    let cQ = get_furniture_list()
                      , cR = []
                      , cS = (cR['push']([{
                        'text': lang['code'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['title'],
                        'style': 'tableHeader'
                    }, {
                        'text': lang['count'],
                        'alignment': 'right',
                        'style': 'tableHeader'
                    }, {
                        'text': lang['price_per_piece'],
                        'alignment': 'right',
                        'style': 'tableHeader'
                    }, {
                        'text': lang['price'],
                        'alignment': 'right',
                        'style': 'tableHeader'
                    }]),
                    0x0);
                    Object['keys'](cQ)['forEach'](function(cT) {
                        Object['keys'](cQ[cT])['forEach'](function(cU) {
                            var cV;
                            'null' != cQ['key'] && 'null' != cU && (cV = accsessories_data['items'][cU]) && 0x0 < cQ[cT][cU]['count'] && (cS += cQ[cT][cU]['count'] * parseFloat(cV['price']),
                            cR['push']([cV['code'], cV['name'], {
                                'text': cQ[cT][cU]['count'],
                                'alignment': 'right'
                            }, {
                                'text': format_price(cV['price']),
                                'alignment': 'right'
                            }, {
                                'text': format_price(cQ[cT][cU]['count'] * parseFloat(cV['price'])),
                                'alignment': 'right'
                            }]));
                        });
                    }),
                    cR['push'](['', '', {
                        'text': '',
                        'colspan': 0x3
                    }, {
                        'text': lang['total'] + ':',
                        'alignment': 'right',
                        'bold': !0x0,
                        'style': 'tableHeader'
                    }, {
                        'text': format_price(cS),
                        'bold': !0x0,
                        'alignment': 'right',
                        'style': 'tableHeader'
                    }]),
                    cv['content']['push']({
                        'text': lang['furniture'] + ':',
                        'style': 'tableHeader'
                    }),
                    cv['content']['push']({
                        'table': {
                            'headerRows': 0x1,
                            'widths': ['auto', '*', 'auto', 'auto', 'auto'],
                            'body': cR
                        },
                        'layout': bS
                    }, {
                        'text': '\x0a\x0a'
                    });
                }
            }
            if (!0x1 !== pdf_settings['report_accessories'] && 0x0 < cart['accessories']['length']) {
                var c1 = []
                  , a6 = [{
                    'text': lang['code'],
                    'style': 'tableHeader'
                }, {
                    'text': lang['title'],
                    'style': 'tableHeader'
                }, {
                    'text': lang['count'],
                    'alignment': 'right',
                    'style': 'tableHeader'
                }, {
                    'text': lang['price_per_piece'],
                    'alignment': 'right',
                    'style': 'tableHeader'
                }, {
                    'text': lang['price'],
                    'alignment': 'right',
                    'style': 'tableHeader'
                }];
                0x1 == pdf_settings['german'] && a6['unshift']({
                    'text': lang['image'],
                    'style': 'tableHeader'
                }),
                c1['push'](a6);
                let cT = 0x0;
                for (let cU = 0x0; cU < cart['accessories']['length']; cU++) {
                    var c2 = [], c3;
                    0x1 == pdf_settings['german'] && (c3 = await get_async(cart['accessories'][cU]['images']['split'](',')[0x0]),
                    c2['push'](null != c3 ? {
                        'image': c3,
                        'fit': [0x64, 0x64],
                        'alignment': 'center'
                    } : lang['no'])),
                    cT += cart['accessories'][cU]['count'] * parseFloat(cart['accessories'][cU]['price']),
                    c2['push'](cart['accessories'][cU]['code'], cart['accessories'][cU]['name'], {
                        'text': cart['accessories'][cU]['count'],
                        'alignment': 'right'
                    }, {
                        'text': format_price(cart['accessories'][cU]['price']),
                        'alignment': 'right'
                    }, {
                        'text': format_price(cart['accessories'][cU]['count'] * parseFloat(cart['accessories'][cU]['price'])),
                        'alignment': 'right'
                    }),
                    c1['push'](c2);
                }
                var a7 = ['', '', {
                    'text': '',
                    'colspan': 0x3
                }, {
                    'text': lang['total'] + ':',
                    'alignment': 'right',
                    'bold': !0x0,
                    'style': 'tableHeader'
                }, {
                    'text': format_price(cT),
                    'alignment': 'right',
                    'bold': !0x0,
                    'style': 'tableHeader'
                }]
                  , a8 = ['auto', '*', 'auto', 'auto', 'auto'];
                0x1 == pdf_settings['german'] && (a7['unshift'](''),
                a8['unshift']('auto')),
                c1['push'](a7),
                cv['content']['push']({
                    'text': lang['accessories'] + ':',
                    'style': 'tableHeader'
                }),
                cv['content']['push']({
                    'table': {
                        'headerRows': 0x1,
                        'widths': a8,
                        'body': c1
                    },
                    'layout': bS
                }, {
                    'text': '\x0a\x0a'
                });
            }
            if (0x0 != constructor_settings['price_enabled'] && 0x1 == pdf_settings['report_custom_cart_items'] && cart && cart['custom_items'] && cart['custom_items']['length']) {
                var c4 = []
                  , a9 = [{
                    'text': lang['code'],
                    'style': 'tableHeader'
                }, {
                    'text': lang['title'],
                    'style': 'tableHeader'
                }, {
                    'text': lang['count'],
                    'alignment': 'right',
                    'style': 'tableHeader'
                }, {
                    'text': lang['price_per_piece'],
                    'alignment': 'right',
                    'style': 'tableHeader'
                }, {
                    'text': lang['price'],
                    'alignment': 'right',
                    'style': 'tableHeader'
                }];
                c4['push'](a9);
                let cV = 0x0;
                for (let cW = 0x0; cW < cart['custom_items']['length']; cW++) {
                    var c5 = [];
                    cV += cart['custom_items'][cW]['count'] * parseFloat(cart['custom_items'][cW]['price']),
                    c5['push'](cart['custom_items'][cW]['code'], cart['custom_items'][cW]['name'], {
                        'text': cart['custom_items'][cW]['count'],
                        'alignment': 'right'
                    }, {
                        'text': format_price(cart['custom_items'][cW]['price']),
                        'alignment': 'right'
                    }, {
                        'text': format_price(cart['custom_items'][cW]['count'] * parseFloat(cart['custom_items'][cW]['price'])),
                        'alignment': 'right'
                    }),
                    c4['push'](c5);
                }
                var aa = ['', '', {
                    'text': '',
                    'colspan': 0x3
                }, {
                    'text': lang['total'] + ':',
                    'alignment': 'right',
                    'bold': !0x0,
                    'style': 'tableHeader'
                }, {
                    'text': format_price(cV),
                    'alignment': 'right',
                    'bold': !0x0,
                    'style': 'tableHeader'
                }]
                  , a2 = ['auto', '*', 'auto', 'auto', 'auto'];
                c4['push'](aa),
                cv['content']['push']({
                    'text': lang['additional_items'] + ':',
                    'style': 'tableHeader'
                }),
                cv['content']['push']({
                    'table': {
                        'headerRows': 0x1,
                        'widths': a2,
                        'body': c4
                    },
                    'layout': bS
                }, {
                    'text': '\x0a\x0a'
                });
            }
            if (global_data['cornice'] && global_data['cornice']['length']) {
                var c6 = [];
                let cX = 0x0;
                var a3 = [{
                    'text': lang['code'],
                    'style': 'tableHeader'
                }, {
                    'text': lang['title'],
                    'style': 'tableHeader'
                }, {
                    'text': lang['count'],
                    'alignment': 'right',
                    'style': 'tableHeader'
                }, {
                    'text': lang['price_per_piece'],
                    'alignment': 'right',
                    'style': 'tableHeader'
                }, {
                    'text': lang['price'],
                    'alignment': 'right',
                    'style': 'tableHeader'
                }];
                c6['push'](a3);
                for (let cY = 0x0; cY < global_data['cornice']['length']; cY++) {
                    var c7 = global_data['cornice'][cY]
                      , c8 = [];
                    cX += c7['total_price'],
                    c8['push'](c7['code'], c7['name'], {
                        'text': c7['count'],
                        'alignment': 'right'
                    }, {
                        'text': format_price(c7['price']),
                        'alignment': 'right'
                    }, {
                        'text': format_price(c7['total_price']),
                        'alignment': 'right'
                    }),
                    c6['push'](c8);
                }
                var a4 = ['', '', {
                    'text': '',
                    'colspan': 0x3
                }, {
                    'text': lang['total'] + ':',
                    'alignment': 'right',
                    'bold': !0x0,
                    'style': 'tableHeader'
                }, {
                    'text': format_price(cX),
                    'alignment': 'right',
                    'bold': !0x0,
                    'style': 'tableHeader'
                }]
                  , a5 = ['auto', '*', 'auto', 'auto', 'auto'];
                c6['push'](a4),
                cv['content']['push']({
                    'text': lang['cornice'] + ':',
                    'style': 'tableHeader'
                }),
                cv['content']['push']({
                    'table': {
                        'headerRows': 0x1,
                        'widths': a5,
                        'body': c6
                    },
                    'layout': bS
                }, {
                    'text': '\x0a\x0a'
                });
            }
            if (global_data['washes'] && global_data['washes']['length']) {
                var c9 = [];
                let cZ = 0x0;
                var a6 = [{
                    'text': lang['code'],
                    'style': 'tableHeader'
                }, {
                    'text': lang['title'],
                    'style': 'tableHeader'
                }, {
                    'text': lang['count'],
                    'alignment': 'right',
                    'style': 'tableHeader'
                }, {
                    'text': lang['price_per_piece'],
                    'alignment': 'right',
                    'style': 'tableHeader'
                }, {
                    'text': lang['price'],
                    'alignment': 'right',
                    'style': 'tableHeader'
                }];
                c9['push'](a6);
                for (let d0 = 0x0; d0 < global_data['washes']['length']; d0++) {
                    var ca = global_data['washes'][d0]
                      , cb = [];
                    cZ += ca['total_price'],
                    cb['push'](ca['code'], ca['name'], {
                        'text': ca['count'],
                        'alignment': 'right'
                    }, {
                        'text': format_price(ca['price']),
                        'alignment': 'right'
                    }, {
                        'text': format_price(ca['total_price']),
                        'alignment': 'right'
                    }),
                    c9['push'](cb);
                }
                var a7 = ['', '', {
                    'text': '',
                    'colspan': 0x3
                }, {
                    'text': lang['total'] + ':',
                    'alignment': 'right',
                    'bold': !0x0,
                    'style': 'tableHeader'
                }, {
                    'text': format_price(cZ),
                    'alignment': 'right',
                    'bold': !0x0,
                    'style': 'tableHeader'
                }]
                  , a8 = ['auto', '*', 'auto', 'auto', 'auto'];
                c9['push'](a7),
                cv['content']['push']({
                    'text': lang['washers'] + ':',
                    'style': 'tableHeader'
                }),
                cv['content']['push']({
                    'table': {
                        'headerRows': 0x1,
                        'widths': a8,
                        'body': c9
                    },
                    'layout': bS
                }, {
                    'text': '\x0a\x0a'
                });
            }
            if (0x0 != constructor_settings['price_enabled'] && 0x0 < parseFloat(cC['wall_panel']) && cv['content']['push']({
                'text': lang['wallpanel'] + ':\x20' + cC['wall_panel'] + '\x0a\x0a',
                'style': 'tableHeader',
                'alignment': 'right'
            }),
            0x1 == constructor_settings['tabletop_v2'] && !0x1 !== pdf_settings['report_tabletop_material'] && 0x0 != constructor_settings['price_enabled']) {
                let d1 = []
                  , d2 = 0x0;
                var a9 = [{
                    'text': lang['code'],
                    'style': 'tableHeader'
                }, {
                    'text': lang['title'],
                    'style': 'tableHeader'
                }, {
                    'text': lang['price'],
                    'alignment': 'right',
                    'style': 'tableHeader'
                }]
                  , aa = (d1['push'](a9),
                Object['keys'](cs['tabletop_v2'])['forEach'](d3 => {
                    var d3 = cs['tabletop_v2'][d3]
                      , d4 = pp['libs']['tabletop']['find_item'](d3['id']);
                    let d5 = 0x0
                      , d6 = (d5 = d4['params']?.['width'] ? Math['ceil'](d3['pm'] / parseInt(d4['params']['width'])) : Math['ceil'](d3['pm'] / parseInt(d4['params']['variants'][0x0]['width'])),
                    0x0);
                    d6 = d4['prices']?.['common'] ? parseFloat(d4['prices']['common']) * d5 * constructor_settings['price_modificator'] : parseFloat(d4['params']['variants'][0x0]['price']) * d5 * constructor_settings['price_modificator'];
                    var d3 = [];
                    d2 += d6,
                    d3['push'](d4['code'], d4['name'], {
                        'text': format_price(d6),
                        'alignment': 'right'
                    }),
                    d1['push'](d3);
                }
                ),
                ['', {
                    'text': lang['total'] + ':',
                    'alignment': 'right',
                    'bold': !0x0,
                    'style': 'tableHeader'
                }, {
                    'text': format_price(d2),
                    'alignment': 'right',
                    'bold': !0x0,
                    'style': 'tableHeader'
                }])
                  , a2 = ['auto', '*', 'auto'];
                d1['push'](aa),
                cv['content']['push']({
                    'text': lang['tabletop'] + ':',
                    'style': 'tableHeader'
                }),
                cv['content']['push']({
                    'table': {
                        'headerRows': 0x1,
                        'widths': a2,
                        'body': d1
                    },
                    'layout': bS
                }, {
                    'text': '\x0a\x0a'
                });
            }
            if (0x0 != constructor_settings['price_enabled'] && cv['content']['push']({
                'text': lang['total_project_price'] + '\x20' + format_price(parseFloat($('.k_sum\x20span')['html']())) + '\x0a\x0a',
                'style': 'tableHeader',
                'bold': !0x0,
                'alignment': 'right'
            }),
            !0x1 !== pdf_settings['report_modules_comments_list'] && 0x0 < cu['length']) {
                var cc = [];
                cc['push']([{
                    'text': '№',
                    'style': 'tableHeader'
                }, {
                    'text': lang['comment'],
                    'style': 'tableHeader'
                }]);
                for (let d3 = 0x0; d3 < cu['length']; d3++) {
                    var cd = cu[d3];
                    let d4 = d3 + 0x1;
                    cd['pdf_number'] && (d4 = cd['pdf_number']),
                    !cd['params']['comments'] && !cd['params']['accessories_comments_string'] || '' === cd['params']['comments'] && '' === cd['params']['accessories_comments_string'] || cc['push']([d4, cd['params']['comments'] + cd['params']['accessories_comments_string']]);
                }
                0x1 < cc['length'] && (cv['content']['push']({
                    'text': lang['modules_comments'] + ':',
                    'style': 'tableHeader'
                }),
                cv['content']['push']({
                    'table': {
                        'headerRows': 0x1,
                        'widths': ['auto', '*'],
                        'body': cc
                    },
                    'layout': bS
                }, {
                    'text': '\x0a\x0a'
                }));
            }
            if (project_settings['comments'] && 0x0 < project_settings['comments']['length']) {
                cv['content']['push']({
                    'text': lang['project_comments'] + ':',
                    'style': 'tableHeader'
                });
                for (let d5 = 0x0; d5 < project_settings['comments']['length']; d5++)
                    cv['content']['push']({
                        'text': project_settings['comments'][d5]['text']
                    }, {
                        'text': '\x0a\x0a'
                    });
                cv['content']['push']({
                    'text': '\x0a\x0a'
                });
            }
            if (constructor_settings['email'] && 0x1 == constructor_settings['email']['use_custom_form']) {
                let d6 = 0x0;
                for (let d7 = constructor_settings['email']['custom_form_data']['length']; d7--; )
                    if ('comments' == constructor_settings['email']['custom_form_data'][d7]['compatibility']) {
                        d6 = constructor_settings['email']['custom_form_data'][d7]['id'];
                        break;
                    }
                d6 && cv['content']['push']({
                    'text': lang['order_comments'] + ':',
                    'style': 'tableHeader'
                }, {
                    'text': $('textarea[name=\x22' + d6 + '\x22]')['val']()
                }, {
                    'text': '\x0a\x0a'
                });
            } else
                $('textarea[name=\x22comments\x22]')['length'] && '' != $('textarea[name=\x22comments\x22]')['val']() && cv['content']['push']({
                    'text': lang['order_comments'] + ':',
                    'style': 'tableHeader'
                }, {
                    'text': $('textarea[name=\x22comments\x22]')['val']()
                }, {
                    'text': '\x0a\x0a'
                });
            pdf_settings['report_additional_text'] && cv['content']['push']({
                'text': pdf_settings['report_additional_text'],
                'pageBreak': 'before'
            }),
            'function' == typeof pdf_generation_callback && pdf_generation_callback(cv),
            a0 || (cw = null);
            let cD = pdfMake['createPdf'](cv);
            switch (a1) {
            case 'all':
                return {
                    'base64': new Promise(function(d8, d9) {
                        cD['getDataUrl'](function(da) {
                            d8(da);
                        });
                    }
                    ),
                    'blob': new Promise(function(d8, d9) {
                        cD['getBlob'](function(da) {
                            d8(da);
                        });
                    }
                    )
                };
            case 'blob':
                return new Promise(function(d8, d9) {
                    cD['getBlob'](function(da) {
                        d8(da);
                    });
                }
                );
            default:
                return new Promise(function(d8, d9) {
                    cD['getDataUrl'](function(da) {
                        d8(da);
                    });
                }
                );
            }
            return 'send' === action ? new Promise(function(d8, d9) {
                cD['getDataUrl'](function(da) {
                    d8(da);
                });
            }
            ) : 'blob' === action ? new Promise(function(d8, d9) {
                cD['getBlob'](function(da) {
                    d8(da);
                });
            }
            ) : void ('new_tab' === action ? cD['getDataUrl'](d8 => {
                open_data_uri_window(d8);
            }
            ) : 'download' === action && (a4 = (a3 = new Date())['getDate']() + '.' + (a3['getMonth']() + 0x1) + '.' + a3['getFullYear']() + '_' + a3['getHours']() + ':' + a3['getMinutes']() + '.pdf',
            cD['download'](a4)));
        }
    }
    generate_pdf_new(action);
}
async function download_pdf() {
    var f = new Date()
      , f = f['getDate']() + '.' + (f['getMonth']() + 0x1) + '.' + f['getFullYear']() + '_' + f['getHours']() + ':' + f['getMinutes']() + '.pdf';
    downlad_url(await generate_pdf(), f);
}
function generate_pdf_new(f) {
    let g = new FormData()
      , h = (g['append']('images', JSON['stringify'](get_images())),
    g['append']('data', JSON['stringify'](get_pdf_data())),
    {});
    var i;
    if ($('#send_order\x20input')['not']('[type=\x22hidden\x22]')['each'](function() {
        $(this)['attr']('name') && (h[$(this)['attr']('name')] = $(this)['val']());
    }),
    g['append']('order_data', JSON['stringify'](h)),
    'function' == typeof pdf_generation_callback && (pdf_generation_callback(i = []),
    g['append']('custom_userfields', JSON['stringify'](i))),
    'send' == f)
        return new Promise(function(j, k) {
            var l = new XMLHttpRequest();
            l['open']('POST', location['origin'] + location['pathname'] + 'config/index.php/report/get_pdf'),
            l['responseType'] = 'string',
            l['send'](g),
            l['addEventListener']('readystatechange', function() {
                var m;
                0x4 === this['readyState'] && (m = this['response'],
                j('data:application/pdf;charset=utf-8;base64,' + m));
            });
        }
        );
    var i = new XMLHttpRequest();
    i['open']('POST', location['origin'] + location['pathname'] + 'config/index.php/report/get_pdf'),
    i['responseType'] = 'string',
    i['send'](g),
    i['addEventListener']('readystatechange', function() {
        var j;
        0x4 === this['readyState'] && open_data_uri_window('data:application/pdf;charset=utf-8;base64,' + this['response']);
    });
}
function get_images(f) {
    dControls['clear_selected'](),
    (f = f || {})['width'] || (f['width'] = 0x2 * global_options['pdf']['width']),
    f['height'] || (f['height'] = 0x2 * global_options['pdf']['height']);
    var g = renderer['domElement']['width']
      , h = renderer['domElement']['height']
      , f = (camera['aspect'] = f['width'] / f['height'],
    camera['updateProjectionMatrix'](),
    renderer['setSize'](f['width'], f['height']),
    {});
    let i = 0x0;
    0x1 == global_options['show_numbers'] && (i = 0x1),
    sc['numbers'](!0x1);
    var j = global_options['common_sizes_visible']
      , k = global_options['sizes_visible'];
    if (hide_sizes(),
    'edges' === global_options['mode'] && (global_options['mode'] = 'design',
    room['change_mode'](),
    transparent_edges(!0x1)),
    !0x1 !== pdf_settings['report_common_view'] && (renderer['render'](scene, camera),
    f['common_view'] = renderer['domElement']['toDataURL']('image/jpeg', 0.5)),
    !0x1 !== pdf_settings['report_walls_view'] && (0x0 < projection('front') && (f['front_view_color'] = renderer['domElement']['toDataURL']('image/jpeg', 0.5)),
    0x0 < projection('back') && (f['back_view_color'] = renderer['domElement']['toDataURL']('image/jpeg', 0.5)),
    0x0 < projection('left') && (f['left_view_color'] = renderer['domElement']['toDataURL']('image/jpeg', 0.5)),
    0x0 < projection('right')) && (f['right_view_color'] = renderer['domElement']['toDataURL']('image/jpeg', 0.5)),
    camera_mode_3d(),
    show_sizes(),
    show_common_sizes(),
    !0x1 !== pdf_settings['report_edges_view'] && (global_options['mode'] = 'edges',
    room['change_mode'](),
    transparent_edges(!0x0),
    renderer['render'](scene, camera),
    f['edges_view'] = renderer['domElement']['toDataURL']('image/jpeg', 0.5)),
    !0x1 !== pdf_settings['report_comms_only_view'] && 0x0 < show_comms_only(!0x0) && (renderer['render'](scene, camera),
    f['comms_only_view'] = renderer['domElement']['toDataURL']('image/jpeg', 0.5),
    show_comms_only(!0x1)),
    place_modules_numbers(),
    !0x1 !== pdf_settings['report_top_view']) {
        projection('top'),
        f['top_view'] = renderer['domElement']['toDataURL']('image/jpeg', 0.5);
        for (let l = 0x0; l < room['active_objects']['length']; l++)
            'bottom' != room['active_objects'][l]['cabinet_type'] && (room['active_objects'][l]['visible'] = !0x1);
        build_sizes_all(),
        renderer['render'](scene, camera),
        f['tabletop_view'] = renderer['domElement']['toDataURL']('image/jpeg', 0.5);
        for (let m = 0x0; m < room['active_objects']['length']; m++)
            'bottom' != room['active_objects'][m]['cabinet_type'] && (room['active_objects'][m]['visible'] = !0x0);
        build_sizes_all(),
        renderer['render'](scene, camera);
    }
    return !0x1 !== pdf_settings['report_walls_view'] && (0x0 < projection('front') && (f['front_view'] = renderer['domElement']['toDataURL']('image/jpeg', 0.5)),
    renderer['render'](scene, camera),
    0x0 < projection('back') && (f['back_view'] = renderer['domElement']['toDataURL']('image/jpeg', 0.5)),
    renderer['render'](scene, camera),
    0x0 < projection('left') && (f['left_view'] = renderer['domElement']['toDataURL']('image/jpeg', 0.5)),
    renderer['render'](scene, camera),
    0x0 < projection('right')) && (f['right_view'] = renderer['domElement']['toDataURL']('image/jpeg', 0.5)),
    !0x1 !== pdf_settings['report_edges_view'] && (global_options['mode'] = 'design',
    setTimeout(function() {
        room['change_mode']();
    }, 0x64),
    transparent_edges(!0x1)),
    remove_modules_numbers(),
    camera_mode_3d(),
    camera['aspect'] = g / h,
    camera['updateProjectionMatrix'](),
    renderer['setSize'](g, h),
    renderer['render'](scene, camera, null, !0x1),
    onWindowResize(),
    k || hide_sizes(),
    j || hide_common_sizes(),
    0x0 < i && sc['numbers'](!0x0),
    f;
}
function get_modules(f) {
    (f = f || {})['group'] || (f['group'] = 'all');
    var g = f['group'], h = [], i;
    for (let j = 0x0; j < room['active_objects']['length']; j++) {
        'Cabinet' !== room['active_objects'][j]['type'] && 'CabinetN' !== room['active_objects'][j]['temp_type'] && 'Model' !== room['active_objects'][j]['type'] || 'Cabinet' !== room['active_objects'][j]['type'] && 'CabinetN' !== room['active_objects'][j]['temp_type'] && 'Model' !== room['active_objects'][j]['type'] && 'Bardesk' !== room['active_objects'][j]['type'] || 'Bardesk' == room['active_objects'][j]['type'] && 0x1 == constructor_settings['tabletop_v2'] || 'Model' == room['active_objects'][j]['type'] && 0x1 != room['active_objects'][j]['params']['show_in_report'] && 0x0 == room['active_objects'][j]['get_price']() || (i = room['active_objects'][j])['params']['cabinet_group'] !== f['group'] && 'all' !== f['group'] || (i['number'] = j,
        void 0x0 === i['params']['name'] && (i['params']['name'] = ''),
        void 0x0 === i['params']['code'] && (i['params']['code'] = ''),
        h['push'](i));
    }
    return h;
}
function get_shelves() {
    var f = [];
    for (let g = 0x0; g < room['active_objects']['length']; g++)
        'Shelve' == room['active_objects'][g]['type'] && f['push'](room['active_objects'][g]);
    return f;
}
function get_pdf_data() {
    var f = {};
    return f['specs'] = sc['get_specs'](!0x0),
    f;
}
function get_models() {
    var f = [], g;
    for (let h = 0x0; h < room['active_objects']['length']; h++) {
        'Model' === room['active_objects'][h]['type'] && 0x0 != room['active_objects'][h]['params']['price'] && (room['active_objects'][h]['number'] = h,
        f['push'](room['active_objects'][h]));
    }
    return f;
}
function logo_to_base64(f) {
    var g = f['naturalWidth']
      , h = f['naturalHeight']
      , i = document['createElement']('canvas')
      , g = (i['width'] = g,
    i['height'] = h,
    i['getContext']('2d'));
    return g['globalAlpha'] = 0x1,
    g['drawImage'](f, 0x0, 0x0, f['naturalWidth'], f['naturalHeight'], 0x0, 0x0, i['width'], i['height']),
    i['toDataURL']('image/png', 0x1);
}
function open_data_uri_window(f) {
    var g, f = '<html><style>html,\x20body\x20{\x20padding:\x200;\x20margin:\x200;\x20}\x20iframe\x20{\x20width:\x20100%;\x20height:\x20100%;\x20border:\x200;}\x20\x20</style><body><iframe\x20type=\x22application/pdf\x22\x20src=\x22' + f['replace']('data:application/pdf;', 'data:application/pdf;name=myname.pdf;') + '\x22></iframe></body></html>', h = window['open']('about:blank', '_blank');
    h['document']['write'](f),
    h['document']['close']();
}
function build_pdf_material_block(f, g, h) {
    var i = {
        'thickness': '',
        'parent_category_name': '',
        'category_name': '',
        'name': '',
        'code': '',
        'pm': '',
        'm2': ''
    }
      , h = (h && (i['thickness'] = ',\x20' + h + lang['mm'] + '\x20'),
    g['mat_data'] && (g['mat_data']['parent_category_name'] && (i['parent_category_name'] = g['mat_data']['parent_category_name'] += '\x20'),
    g['mat_data']['category_name'] && (i['category_name'] = g['mat_data']['category_name'] += '\x20'),
    g['mat_data']['name'] && (i['name'] = g['mat_data']['name'] += '\x20'),
    g['mat_data']['code'] && (i['code'] = g['mat_data']['code'] += '\x20'),
    g['pm'] && (i['pm'] = g['pm']),
    g['m2']) && (i['m2'] = g['m2']),
    i['parent_category_name'] + i['category_name'] + i['name'] + i['code'] + i['thickness']);
    f['push']({
        'text': h
    }),
    i['m2'] && '' != i['m2'] && 0x0 != i['m2'] && f['push']({
        'text': lang['units_square'] + ':\x20' + parseFloat(i['m2'])['toFixed'](0x2)
    }),
    i['pm'] && '' != i['pm'] && 0x0 != i['pm'] && f['push']({
        'text': lang['units_pogon'] + ':\x20' + parseFloat(i['pm'])['toFixed'](0x2)
    }),
    f['push']({
        'text': '\x0a'
    });
}
function show_comms_only(f) {
    let g = 0x0;
    for (let h = 0x0; h < room['active_objects']['length']; h++)
        'wall' !== room['active_objects'][h]['object_type'] && (room['active_objects'][h]['params'] && room['active_objects'][h]['params']['catalog'] ? 'Comms' !== room['active_objects'][h]['params']['catalog'] ? room['active_objects'][h]['visible'] = !f : g++ : 'Shaft' !== room['active_objects'][h]['type'] ? room['active_objects'][h]['visible'] = !f : g++);
    for (let i = 0x0; i < pp['info']['tabletop']['items']['length']; i++)
        pp['info']['tabletop']['items'][i]['visible'] = !f,
        g++;
    return build_sizes_all(),
    g;
}
function toggle_layer(f) {
    if (f) {
        global_options['layers'][f] = !global_options['layers'][f];
        for (let g = 0x0; g < room['active_objects']['length']; g++)
            'comms' === f && 'wall' !== room['active_objects'][g]['object_type'] && room['active_objects'][g]['params']['catalog'] && 'Comms' === room['active_objects'][g]['params']['catalog'] && (room['active_objects'][g]['visible'] = global_options['layers']['comms']),
            'shafts' === f && 'Shaft' === room['active_objects'][g]['type'] && (room['active_objects'][g]['visible'] = global_options['layers']['shafts']),
            'modules' === f && 'Cabinet' === room['active_objects'][g]['type'] && (room['active_objects'][g]['visible'] = global_options['layers']['modules']),
            'tech' === f && 'wall' !== room['active_objects'][g]['object_type'] && room['active_objects'][g]['params']['catalog'] && 'Tech' === room['active_objects'][g]['params']['catalog'] && (room['active_objects'][g]['visible'] = global_options['layers']['tech']),
            'other' === f && 'wall' !== room['active_objects'][g]['object_type'] && room['active_objects'][g]['params']['catalog'] && 'Other' === room['active_objects'][g]['params']['catalog'] && (room['active_objects'][g]['visible'] = global_options['layers']['other']);
        build_sizes_all();
    }
}
async function convert_image_to_base64(f) {
    return new Promise( (g, h) => {
        let j = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp',
            '.gif': 'image/gif'
        }
          , k = f['substring'](f['lastIndexOf']('.'))['toLowerCase']();
        if (j[k]) {
            let l = new Image();
            l['src'] = f,
            l['crossOrigin'] = 'Anonymous',
            l['onload'] = () => {
                try {
                    var m = document['createElement']('canvas')
                      , q = l['naturalWidth']
                      , u = l['naturalHeight']
                      , v = (m['width'] = q,
                    m['height'] = u,
                    m['getContext']('2d'))
                      , w = (v['clearRect'](0x0, 0x0, q, u),
                    v['drawImage'](l, 0x0, 0x0),
                    j[k])
                      , x = 'image/png' === w ? void 0x0 : 0.7
                      , y = m['toDataURL'](w, x);
                    g(y);
                } catch (z) {
                    h('Error\x20processing\x20image:\x20' + z);
                }
            }
            ,
            l['onerror'] = m => {
                h('Failed\x20to\x20load\x20image:\x20' + m);
            }
            ;
        } else
            h('Unsupported\x20image\x20format:\x20' + k);
    }
    );
}
global_options['layers'] = {
    'modules': !0x0,
    'comms': !0x0,
    'shafts': !0x0,
    'tech': !0x0,
    'other': !0x0
};
function init_renderer() {
    var f = document['getElementById']('viewport')
      , g = f['clientWidth']
      , h = f['clientHeight'];
    camera_ortho = new THREE['OrthographicCamera'](g / -0x2,g / 0x2,h / 0x2,h / -0x2,0x1,0x2710),
    (camera_persp = new THREE['PerspectiveCamera'](0x37,g / h,0x1,0x1388))['name'] = 'Camera001',
    (camera = camera_persp)['layers']['enable'](0x1),
    camera['position']['x'] = 0x0,
    camera['position']['y'] = 0x0,
    camera['position']['z'] = -0x0,
    camera['position']['set'](0x22, 0xcb, 0x191),
    (renderer = new THREE['WebGLRenderer']({
        'antialias': !0x0,
        'alpha': !0x0,
        'powerPreference': 'high-performance',
        'preserveDrawingBuffer': !0x1
    }))['setSize'](g, h),
    renderer['setPixelRatio'](Math['min'](window['devicePixelRatio'], 0x2)),
    renderer['toneMapping'] = THREE['LinearToneMapping'],
    0x6e != THREE['REVISION'] && (THREE['ColorManagement']['enabled'] = !0x1,
    renderer['outputColorSpace'] = THREE['LinearSRGBColorSpace'],
    renderer['toneMapping'] = THREE['LinearToneMapping']),
    renderer['shadowMap']['enabled'] = !0x0,
    renderer['shadowMap']['type'] = THREE['PCFSoftShadowMap'],
    renderer['setClearColor'](0xffffff, 0x1),
    f['appendChild'](renderer['domElement']),
    (label_renderer = new THREE['CSS2DRenderer']())['setSize'](g, h),
    label_renderer['domElement']['style']['position'] = 'absolute',
    label_renderer['domElement']['style']['top'] = '0px',
    label_renderer['domElement']['style']['pointerEvents'] = 'none',
    f['appendChild'](label_renderer['domElement']),
    pp['three']['renderer'] = renderer,
    pp['three']['label_renderer'] = renderer,
    pp['three']['camera'] = camera,
    pp['three']['functions']['fit_camera'] = function(i, j=1.2) {
        fitCameraToCenteredObject(camera, i, j, controls);
    }
    ,
    pp['render'] = function() {
        ce('render'),
        renderer['render'](scene, camera),
        label_renderer['render'](scene, camera);
    }
    ,
    render = function(i) {
        TWEEN['update'](i),
        0x0 == pp['config']['on_demand_render'] && (renderer['render'](scene, camera),
        label_renderer['render'](scene, camera)),
        requestAnimationFrame(render);
    }
    ;
}
let controlSize = 0x8
  , controlOffset = 0x8
  , minSize = 0x64
  , snap = 0xa;
class Resizable {
    constructor(e) {
        this['obj'] = null,
        this['active'] = !0x1,
        this['locks'] = {},
        this['min'] = [],
        this['max'] = [],
        this['startPoint'] = new THREE['Vector3'](),
        this['cameraDirection'] = new THREE['Vector3'](),
        this['yAxis'] = new THREE['Vector3'](0x0,0x1,0x0),
        this['tmpVector'] = new THREE['Vector3'](0x0,0x0,0x0),
        this['tmp2Vector'] = new THREE['Vector3'](0x0,0x0,0x0),
        this['lastSize'] = new THREE['Vector3'](0x0,0x0,0x0),
        this['lastAxis'] = -0x1,
        this['obj'] = e,
        this['isCabinet'] = 'Cabinet' === this['obj']['type'],
        this['isModule'] = this['obj']['userData']['params'] && 'module' === this['obj']['userData']['params']['type'],
        this['isLegacy'] = !(this['isModule'] || this['obj']['_resize'] && this['obj']['userData']['computed']);
    }
    ['isActive']() {
        return this['active'];
    }
    ['setActive'](e) {
        this['active'] = !0x0 === e;
    }
    ['lock'](e) {
        if (e) {
            if ('string' == typeof e) {
                this['locks'] = {};
                for (var f of e['split']('\x20'))
                    f && (this['locks'][f] = !0x0);
            } else
                this['locks'] = e;
        } else
            this['locks'] = {};
    }
    ['minmax'](e) {
        if (e) {
            this['min'] = e['min'] ? [parseFloat(e['min']['x']), parseFloat(e['min']['y']), parseFloat(e['min']['z'])] : [],
            this['max'] = e['max'] ? [parseFloat(e['max']['x']), parseFloat(e['max']['y']), parseFloat(e['max']['z'])] : [];
            for (var f of [0x0, 0x1, 0x2])
                this['min'][f] || (this['min'][f] = void 0x0),
                this['max'][f] || (this['max'][f] = void 0x0);
        }
    }
    ['attachControls']() {
        this['obj']['resizeControls'] = new THREE['Group'](),
        this['obj']['resizeControls']['name'] = 'ResizeControls',
        this['obj']['add'](this['obj']['resizeControls']);
        let f;
        (f = make_cube(0x1, 0x1, 0x1, global_materials['helper_material']))['no_reset'] = !0x0,
        f['visible'] = !0x1,
        this['obj']['resizeControls']['box'] = f,
        this['obj']['resizeControls']['add'](f);
        for (var g of [0x0, 0x1])
            for (var h of [0x0, 0x1])
                for (var j of [0x0, 0x1])
                    (f = make_cube(controlSize, controlSize, controlSize, global_materials['helper_material']))['name'] = '' + h + g + j,
                    f['is_control'] = !0x0,
                    f['no_reset'] = !0x0,
                    f['userData']['obj'] = this['obj'],
                    this['obj']['resizeControls']['add'](f);
        this['updateControls']();
    }
    ['detachControls']() {
        this['destroyControls'](),
        delete this['obj']['resizeControls']['box'],
        delete this['obj']['resizeControls'];
    }
    ['handleDragStart'](e, f, g) {
        this['active'] && (this['lastAxis'] = -0x1,
        this['startPoint']['copy'](this['getPointFromScreen'](f, g)),
        this['lastSize']['set'](0x0, 0x0, 0x0),
        this['cameraDirection']['copy'](this['obj']['worldToLocal'](g['getWorldPosition'](this['tmp2Vector']))),
        this['cameraDirection']['normalize'](),
        this['updateBox'](),
        this['obj']['resizeControls']['box']['visible'] = !0x0);
    }
    ['handleDragMove'](f, g, h) {
        var j, g, k, j, k, l, l, k;
        !this['active'] || 0x3 !== f['name']['length'] || (j = this['isLegacy'] ? this['obj']['get_forward']() : this['obj']['_get_forward'](),
        this['tmp2Vector']['set'](0x0, 0x0, 0x1),
        (g = this['getPointFromScreen'](g, h))['sub'](this['startPoint']),
        k = j['angleTo'](this['tmp2Vector']),
        g['applyAxisAngle'](this['yAxis'], j['x'] < 0x0 ? k : -k),
        j = this['guessAxis'](g),
        !0x0 === (l = (k = this['locks'])[f['name']])) || l && (l['x'] && 0x0 === j || l['y'] && 0x1 === j || l['z'] && 0x2 === j) || k['bottom'] && 0x1 === j && '0' === f['name'][0x1] || k['top'] && 0x1 === j && '1' === f['name'][0x1] || k['x'] && 0x0 === j || k['y'] && 0x1 === j || k['z'] && 0x2 === j || (l = '0' === f['name'][j] ? -0x1 : 0x1,
        k = g['getComponent'](j),
        k *= h['position']['distanceTo'](this['obj']['getWorldPosition'](this['tmp2Vector'])) / 0x5,
        k = Math['floor'](k / (snap / units)) * (snap / units),
        this['resizeBox'](j, l, k),
        this['buildSizes'](f['name'], j));
    }
    ['handleDragEnd'](f, g, h) {
        var j, k, l, m, m, j, p, j;
        this['active'] && ((j = this['obj']['resizeControls']['box'])['visible'] = !0x1,
        this['destroySizes'](),
        this['isModule'] || this['obj']['_set_size_by_number'] || this['obj']['set_size_by_number']) && (k = this['getDimensions'](),
        (l = this['tmp2Vector'])['copy'](j['position']),
        l['y'] = 0x0,
        m = l['length'](),
        l['normalize'](),
        l['transformDirection'](j['matrixWorld']),
        l['setLength'](m),
        l['y'] = 0x0,
        m = j['position']['y'] - (k['y'] + controlOffset / 0x2) / 0x2,
        ((j = j['scale']['y'] - controlOffset / 0x2) > k['y'] && m < 0x0 || j < k['y'] && 0x0 < m) && (l['y'] += 0x2 * m),
        this['obj']['position']['add'](l),
        j = this['getNewSize'](),
        this['isModule'] ? (this['obj']['set_size'](j),
        this['obj']['userData']['params']['size_changed'] = 0x1) : this['obj']['_set_size_by_number'] ? this['obj']['_set_size_by_number'](j) : this['obj']['set_size_by_number'](j['x'], j['y'], j['z']),
        this['updateControls']());
    }
    ['buildSizes'](f, g) {
        var h = this['obj']['resizeControls']['box']
          , j = this['getNewSize']();
        this['lastSize']['equals'](j) || (this['lastSize']['copy'](j),
        h['sizes'] || (h['sizes'] = new THREE['Group'](),
        h['sizes']['name'] = 'Sizes',
        this['obj']['resizeControls']['add'](h['sizes'])),
        this['destroySizes'](),
        this['locks']['x'] || void 0x0 !== g && 0x0 !== g || (h['size_width'] = new Sizes_obj({
            'width': j['x'] / units,
            'text': 'Ш:\x20' + j['x'],
            'font_size': 0x32,
            'use_css2d': !0x0
        }),
        this['placeSize'](h['size_width'], f, 0x0, h, j),
        h['sizes']['add'](h['size_width'])),
        this['locks']['y'] || void 0x0 !== g && 0x1 !== g || (h['size_height'] = new Sizes_obj({
            'width': j['y'] / units,
            'text': 'В:\x20' + j['y'],
            'font_size': 0x32,
            'use_css2d': !0x0
        }),
        this['placeSize'](h['size_height'], f, 0x1, h, j),
        h['sizes']['add'](h['size_height'])),
        this['locks']['z'] || void 0x0 !== g && 0x2 !== g || (h['size_depth'] = new Sizes_obj({
            'width': j['z'] / units,
            'text': 'Г:\x20' + j['z'],
            'font_size': 0x32,
            'use_css2d': !0x0
        }),
        this['placeSize'](h['size_depth'], f, 0x2, h, j),
        h['sizes']['add'](h['size_depth'])),
        h['sizes']['visible'] = !0x0);
    }
    ['destroySizes']() {
        PPObject['prototype']['reset_model']['call'](this['obj'], this['obj']['sizes']),
        PPObject['prototype']['reset_model']['call'](this['obj'], this['obj']['resizeControls']['box']['sizes']);
    }
    ['placeSize'](f, g, j, k, p) {
        let q = k['position']['x']
          , u = k['position']['y']
          , v = k['position']['z'];
        var k = '0' === g[0x0] ? -0x1 : 0x1, w, x = '0' === g[0x2] ? -0x1 : 0x1, y = x < 0x0 ? 0x1 : 0x0, A = 'Wall_panel' === this['obj']['type'], B = A ? -0x1 : 0x1, C;
        0x0 !== j && (q += k * (p['x'] / units / 0x2 + B)),
        0x1 !== j && (u += ('0' === g[0x1] ? -0x1 : 0x1) * (p['y'] / units / 0x2 + B)),
        0x2 !== j && (v += x * (p['z'] / units / 0x2 + B)),
        f['position']['set'](q, u, v),
        A ? 0x1 === j ? (f['rotation']['x'] = (y - 0x1) * Math['PI'],
        f['rotation']['z'] = -k * Math['PI'] / 0x2) : 0x0 === j && (f['rotation']['y'] = (y - 0x1) * Math['PI']) : 0x1 === j ? (f['rotation']['x'] = y * Math['PI'],
        Math['abs'](this['cameraDirection']['x']) > Math['abs'](this['cameraDirection']['z']) ? (f['rotation']['y'] = k * Math['PI'] / 0x2,
        f['rotation']['z'] = -k * Math['PI'] / 0x2) : f['rotation']['z'] = k * Math['PI'] / 0x2) : 0x2 === j ? f['rotation']['y'] = k * Math['PI'] / 0x2 : 0x0 === j && (f['rotation']['y'] = y * Math['PI']);
    }
    ['updateControls']() {
        var f = this['getDimensions'](), g = 0x5 < f['x'], h = 0x5 < f['y'], j = 0x5 < f['z'], k, l, m, p;
        for (k of this['obj']['resizeControls']['children']) {
            0x3 === k['name']['length'] && (l = '0' === k['name'][0x0] ? -0x1 : 0x1,
            m = '0' === k['name'][0x1] ? 0x0 : 0x1,
            p = '0' === k['name'][0x2] ? -0x1 : 0x1,
            k['position']['set'](l * (f['x'] - controlSize + controlOffset) / 0x2, m * f['y'] - (0x2 * m - 0x1) * (controlSize - controlOffset) / 0x2, p * (f['z'] - controlSize + controlOffset) / 0x2),
            k['visible'] = (g || 0x1 == l) && (h || 0x1 == m) && (j || 0x1 == p));
        }
        this['updateControlsRoot'](),
        this['updateBox']();
    }
    ['updateControlsRoot']() {
        if (this['isCabinet']) {
            let h = parseInt(this['obj']['userData']['computed']['variables']['c_height']['value'], 0xa) / units;
            Number['isFinite'](h) || (h = 0x0),
            void (this['obj']['resizeControls']['position']['y'] = h);
        } else {
            var e, f, g;
            this['isLegacy'] || (e = this['getDimensions'](),
            f = this['isModule'] ? {
                'x': 0x0,
                'y': -0x1,
                'z': 0x0
            } : this['obj']['userData']['params']['pivot'],
            (g = this['tmp2Vector'])['set'](-f['x'] * e['x'] / 0x2, -(0x1 + f['y']) * e['y'] / 0x2, -f['z'] * e['z'] / 0x2),
            this['obj']['resizeControls']['position']['copy'](g));
        }
    }
    ['updateBox']() {
        var e = this['obj']['resizeControls']['box']
          , f = this['getDimensions']();
        e['scale']['set'](f['x'] + controlOffset / 0x2, f['y'] + controlOffset / 0x2, f['z'] + controlOffset / 0x2),
        e['position']['x'] = 0x0,
        e['position']['y'] = (f['y'] + controlOffset / 0x2) / 0x2,
        e['position']['z'] = 0x0;
    }
    ['resizeBox'](f, g, h) {
        var j = this['obj']['resizeControls']['box']
          , k = this['getDimensions']()
          , g = (j['scale']['set'](k['x'] + controlOffset / 0x2, k['y'] + controlOffset / 0x2, k['z'] + controlOffset / 0x2),
        j['position']['x'] = 0x0,
        j['position']['y'] = (k['y'] + controlOffset / 0x2) / 0x2,
        j['position']['z'] = 0x0,
        Math['sign'](g));
        let l = k['getComponent'](f) + controlOffset / 0x2 + g * h
          , m = h / 0x2;
        l < minSize / units && (l = minSize / units + controlOffset / 0x2,
        m = (minSize / units - k['getComponent'](f) - controlOffset / 0x2) * g / 0x2);
        var h = this['min']
          , p = this['max'];
        void 0x0 !== p[f] && l > p[f] / units && (l = p[f] / units + controlOffset / 0x2,
        m = (p[f] / units - k['getComponent'](f) - controlOffset / 0x2) * g / 0x2),
        void 0x0 !== h[f] && l < h[f] / units && (l = h[f] / units + controlOffset / 0x2,
        m = (h[f] / units - k['getComponent'](f) - controlOffset / 0x2) * g / 0x2),
        0x1 === f && (m += (k['y'] + controlOffset / 0x2) / 0x2),
        j['scale']['setComponent'](f, l),
        j['position']['setComponent'](f, m);
    }
    ['guessAxis'](e) {
        var f = this['tmp2Vector'];
        f['copy'](e),
        this['locks']['x'] || this['locks']['z'] || (f['y'] *= 0.6),
        0x0 <= this['lastAxis'] && f['setComponent'](this['lastAxis'], 0x3 * f['getComponent'](this['lastAxis']));
        let g = 0x0;
        return g = Math['abs'](f['x']) > Math['abs'](f['y']) ? Math['abs'](f['x']) > Math['abs'](f['z']) ? 0x0 : 0x2 : Math['abs'](f['y']) > Math['abs'](f['z']) ? 0x1 : 0x2,
        this['lastAxis'] = 0.07 < e['lengthSq']() ? g : -0x1,
        g;
    }
    ['getPointFromScreen'](e, f) {
        var g = this['tmpVector'];
        return g['x'] = e['clientX'] / window['innerWidth'] * 0x2 - 0x1,
        g['y'] = -e['clientY'] / window['innerHeight'] * 0x2 + 0x1,
        g['z'] = 0.5,
        g['unproject'](f),
        g;
    }
    ['getDimensions']() {
        var e = this['tmpVector'];
        return this['isCabinet'] ? e['set'](this['obj']['params']['cabinet']['width'] / units, this['obj']['params']['cabinet']['height'] / units, this['obj']['params']['cabinet']['depth'] / units) : this['isModule'] ? e['set'](this['obj']['userData']['params']['size']['x'] / units, this['obj']['userData']['params']['size']['y'] / units, this['obj']['userData']['params']['size']['z'] / units) : this['isLegacy'] ? e['set'](this['obj']['params']['width'] / units, this['obj']['params']['height'] / units, this['obj']['params']['depth'] / units) : e['copy'](this['obj']['userData']['computed']['u_size']),
        Number['isFinite'](e['z']) || (e['z'] = 0x1),
        e;
    }
    ['getNewSize']() {
        var e = this['tmp2Vector']
          , f = this['obj']['resizeControls']['box'];
        return e['copy'](f['scale']),
        e['subScalar'](controlOffset / 0x2),
        e['multiplyScalar'](units),
        e['round'](),
        e;
    }
    ['getChildrenToDestroy'](e) {
        if (!e || !e['traverse'])
            return [];
        let f = [];
        return e['traverse'](function(g) {
            e['uuid'] === g['uuid'] || 'Group' === g['type'] || g['no_reset'] || f['push'](g);
        }),
        f;
    }
    ['destroyControls']() {
        var f = this['obj']['resizeControls'];
        this['obj']['remove'](f);
        for (let k = f['children']['length'] - 0x1; 0x0 <= k; k--) {
            var g = f['children'][k];
            if (f['remove'](g),
            g['geometry'] && g['geometry']['dispose'](),
            g['material']) {
                var h = isArray(g['material']) ? g['material'] : [g['material']];
                for (let l = 0x0; l < h['length']; l++) {
                    var j = h[l];
                    j && (j['map'] && j['map']['dispose'](),
                    j['dispose']());
                }
                g['material'] = [];
            }
        }
    }
    ['destroy']() {
        this['obj'] && (this['detachControls'](),
        this['obj'] = null);
    }
}
class Room extends THREE['Group'] {
    constructor(e) {
        super(e),
        this['ceilng_material'] = {
            'type': 'Standard',
            'params': {
                'color': '#ffffff'
            }
        },
        this['active_objects'] = [],
        this['walls_objects'] = [],
        this['walls_only'] = [],
        this['to_del'] = [],
        this['params'] = {
            'width': void 0x0 !== e['width'] ? e['width'] : 0xfa0,
            'height': void 0x0 !== e['height'] ? e['height'] : 0x9c4,
            'depth': void 0x0 !== e['depth'] ? e['depth'] : 0xc80,
            'floor_only': void 0x0 !== e['floor_only'] && e['floor_only'],
            'wall_material': void 0x0 !== e['wall_material'] ? e['wall_material'] : project_settings['selected_materials']['walls'],
            'floor_material': void 0x0 !== e['floor_material'] ? e['floor_material'] : project_settings['selected_materials']['floor']
        },
        this['params']['lw_material'] = void 0x0 !== e['lw_material'] ? e['lw_material'] : this['params']['wall_material'],
        this['params']['rw_material'] = void 0x0 !== e['rw_material'] ? e['rw_material'] : this['params']['wall_material'],
        this['params']['fw_material'] = void 0x0 !== e['fw_material'] ? e['fw_material'] : this['params']['wall_material'],
        this['params']['bw_material'] = void 0x0 !== e['bw_material'] ? e['bw_material'] : this['params']['wall_material'],
        this['walls'] = new THREE['Group'](),
        this['walls']['userData'] = {
            'interaction': {
                'selectable': 0x0
            }
        },
        this['walls']['name'] = 'Walls',
        this['add'](this['walls']),
        this['lights'] = new THREE['Group'](),
        this['lights']['name'] = 'Lights',
        this['lights']['userData']['childrenRenderable'] = !0x1,
        this['add'](this['lights']),
        this['sizes'] = new THREE['Group'](),
        this['sizes']['name'] = 'Sizes',
        this['sizes']['userData']['childrenRenderable'] = !0x1,
        this['add'](this['sizes']),
        this['plints'] = new THREE['Group'](),
        this['plints']['name'] = 'Plints',
        this['plints']['userData']['childrenRenderable'] = !0x1,
        this['add'](this['plints']),
        this['common_sizes'] = new THREE['Group'](),
        this['common_sizes']['name'] = new THREE['Group'](),
        this['common_sizes']['name'] = 'Common_sizes',
        this['common_sizes']['userData']['childrenRenderable'] = !0x1,
        this['add'](this['common_sizes']),
        this['name'] = 'Room',
        this['build']();
    }
    ['build']() {
        var e = this
          , f = (this['reset_walls'](),
        this['reset_lights'](),
        this['reset_sizes'](),
        this['reset_plints'](),
        this['params']['lw_material'] = void 0x0 !== this['params']['lw_material'] ? this['params']['lw_material'] : this['params']['wall_material'],
        this['params']['rw_material'] = void 0x0 !== this['params']['rw_material'] ? this['params']['rw_material'] : this['params']['wall_material'],
        this['params']['fw_material'] = void 0x0 !== this['params']['fw_material'] ? this['params']['fw_material'] : this['params']['wall_material'],
        this['params']['bw_material'] = void 0x0 !== this['params']['bw_material'] ? this['params']['bw_material'] : this['params']['wall_material'],
        materials_lib['get_item'](this['params']['floor_material']))
          , f = (f['add_params'] || (f['add_params'] = {}),
        f['add_params']['model_width'] = this['params']['width'],
        f['add_params']['model_height'] = this['params']['depth'],
        this['floor'] = new Wall({
            'width': e['params']['width'] / units,
            'height': e['params']['depth'] / units,
            'rX': -Math['PI'] / 0x2,
            'pX': e['params']['width'] / units / 0x2,
            'pZ': e['params']['depth'] / units / 0x2,
            'name': 'floor',
            'material': create_material(f)
        }),
        this['walls']['add'](this['floor']),
        this['walls_objects']['push'](this['floor']),
        this['ceilng_material'])
          , f = (f['add_params'] || (f['add_params'] = {}),
        f['add_params']['model_width'] = this['params']['width'],
        f['add_params']['model_height'] = this['params']['depth'],
        this['ceiling'] = new Wall({
            'width': e['params']['width'] / units,
            'height': e['params']['depth'] / units,
            'rX': Math['PI'] / 0x2,
            'pX': e['params']['width'] / units / 0x2,
            'pY': e['params']['height'] / units,
            'pZ': e['params']['depth'] / units / 0x2,
            'name': 'ceiling',
            'material': create_material(f)
        }),
        materials_lib['get_item'](this['params']['fw_material']))
          , f = (f['add_params'] || (f['add_params'] = {}),
        0x1 != custom_settings['no_walls_bump_old'] && (f['params']['bumpMap'] = '/common_assets/images/normals/522.jpg'),
        f['add_params']['model_width'] = this['params']['width'],
        f['add_params']['model_height'] = this['params']['height'],
        this['front_wall'] = new Wall({
            'width': e['params']['width'] / units,
            'height': e['params']['height'] / units,
            'pY': e['params']['height'] / units / 0x2,
            'pZ': 0x0,
            'pX': e['params']['width'] / units / 0x2,
            'name': 'front_wall',
            'material': create_material(f),
            'pb': !0x0,
            'pt': !0x0
        }),
        materials_lib['get_item'](this['params']['bw_material']))
          , f = (f['add_params'] || (f['add_params'] = {}),
        0x1 != custom_settings['no_walls_bump_old'] && (f['params']['bumpMap'] = '/common_assets/images/normals/522.jpg'),
        f['add_params']['model_width'] = this['params']['width'],
        f['add_params']['model_height'] = this['params']['height'],
        this['back_wall'] = new Wall({
            'width': e['params']['width'] / units,
            'height': e['params']['height'] / units,
            'pX': e['params']['width'] / units / 0x2,
            'pY': e['params']['height'] / units / 0x2,
            'pZ': e['params']['depth'] / units,
            'rY': Math['PI'],
            'name': 'back_wall',
            'material': create_material(f),
            'pb': !0x0,
            'pt': !0x0
        }),
        materials_lib['get_item'](this['params']['rw_material']))
          , f = (f['add_params'] || (f['add_params'] = {}),
        0x1 != custom_settings['no_walls_bump_old'] && (f['params']['bumpMap'] = '/common_assets/images/normals/522.jpg'),
        f['add_params']['model_width'] = this['params']['depth'],
        f['add_params']['model_height'] = this['params']['height'],
        this['right_wall'] = new Wall({
            'width': e['params']['depth'] / units,
            'height': e['params']['height'] / units,
            'pX': e['params']['width'] / units,
            'pY': e['params']['height'] / units / 0x2,
            'pZ': e['params']['depth'] / units / 0x2,
            'rY': 0x3 * Math['PI'] / 0x2,
            'name': 'right_wall',
            'material': create_material(f),
            'pb': !0x0,
            'pt': !0x0
        }),
        materials_lib['get_item'](this['params']['lw_material']));
        f['add_params'] || (f['add_params'] = {}),
        0x1 != custom_settings['no_walls_bump_old'] && (f['params']['bumpMap'] = '/common_assets/images/normals/522.jpg'),
        f['add_params']['model_width'] = this['params']['depth'],
        f['add_params']['model_height'] = this['params']['height'],
        this['left_wall'] = new Wall({
            'width': e['params']['depth'] / units,
            'height': e['params']['height'] / units,
            'pX': 0x0,
            'pY': e['params']['height'] / units / 0x2,
            'pZ': e['params']['depth'] / units / 0x2,
            'rY': Math['PI'] / 0x2,
            'name': 'left_wall',
            'material': create_material(f),
            'pb': !0x0,
            'pt': !0x0
        }),
        global_options && global_options['custom_textures'] && global_options['custom_textures']['lr_wall'] && (global_options['custom_textures_params']['lr_wall']['str_x'] || (global_options['custom_textures']['lr_wall']['map']['repeat']['x'] = this['params']['depth'] / parseInt(global_options['custom_textures_params']['lr_wall']['width']),
        global_options['custom_textures']['lr_wall']['map']['needsUpdate'] = !0x0,
        global_options['custom_textures']['fb_wall']['map']['repeat']['x'] = this['params']['width'] / parseInt(global_options['custom_textures_params']['fb_wall']['width']),
        global_options['custom_textures']['fb_wall']['map']['needsUpdate'] = !0x0),
        global_options['custom_textures_params']['lr_wall']['str_y'] || (global_options['custom_textures']['lr_wall']['map']['repeat']['y'] = room['params']['height'] / parseInt(global_options['custom_textures_params']['lr_wall']['height']),
        global_options['custom_textures']['lr_wall']['map']['needsUpdate'] = !0x0,
        global_options['custom_textures']['fb_wall']['map']['repeat']['y'] = room['params']['height'] / parseInt(global_options['custom_textures_params']['fb_wall']['height']),
        global_options['custom_textures']['fb_wall']['map']['needsUpdate'] = !0x0),
        this['left_wall']['material'] = global_options['custom_textures']['lr_wall'],
        this['right_wall']['material'] = global_options['custom_textures']['lr_wall'],
        this['front_wall']['material'] = global_options['custom_textures']['fb_wall'],
        this['back_wall']['material'] = global_options['custom_textures']['fb_wall']),
        global_options && global_options['custom_textures'] && global_options['custom_textures']['floor'] && (global_options['custom_textures_params']['floor']['str_x'] || (global_options['custom_textures']['floor']['map']['repeat']['x'] = this['params']['width'] / parseInt(global_options['custom_textures_params']['floor']['width']),
        global_options['custom_textures']['floor']['map']['needsUpdate'] = !0x0),
        global_options['custom_textures_params']['floor']['str_y'] || (global_options['custom_textures']['floor']['map']['repeat']['y'] = room['params']['depth'] / parseInt(global_options['custom_textures_params']['floor']['height']),
        global_options['custom_textures']['floor']['map']['needsUpdate'] = !0x0),
        this['floor']['material'] = global_options['custom_textures']['floor']),
        this['walls']['add'](this['ceiling']),
        this['walls']['add'](this['front_wall']),
        this['walls']['add'](this['back_wall']),
        this['walls']['add'](this['right_wall']),
        this['walls']['add'](this['left_wall']),
        this['floor']['box'] = new THREE['Box3']()['setFromObject'](this['floor']),
        this['ceiling']['box'] = new THREE['Box3']()['setFromObject'](this['ceiling']),
        this['right_wall']['box'] = new THREE['Box3']()['setFromObject'](this['right_wall']),
        this['left_wall']['box'] = new THREE['Box3']()['setFromObject'](this['left_wall']),
        this['back_wall']['box'] = new THREE['Box3']()['setFromObject'](this['back_wall']),
        this['front_wall']['box'] = new THREE['Box3']()['setFromObject'](this['front_wall']),
        this['right_wall']['object_type'] = 'wall',
        this['front_wall']['object_type'] = 'wall',
        this['left_wall']['object_type'] = 'wall',
        this['back_wall']['object_type'] = 'wall',
        this['walls_only']['push'](this['front_wall']),
        this['walls_only']['push'](this['back_wall']),
        this['walls_only']['push'](this['right_wall']),
        this['walls_only']['push'](this['left_wall']),
        this['params']['floor_only'] ? (this['front_wall']['visible'] = !0x1,
        this['back_wall']['visible'] = !0x1,
        this['right_wall']['visible'] = !0x1,
        this['left_wall']['visible'] = !0x1,
        this['ceiling']['visible'] = !0x1,
        this['fake_floor'] = new Wall({
            'width': 0x1388,
            'height': 0x1388,
            'rX': -Math['PI'] / 0x2,
            'pX': e['params']['width'] / units / 0x2,
            'pZ': e['params']['depth'] / units / 0x2,
            'name': 'floor',
            'material': red_mat_opac
        }),
        this['edges_floor'] = new THREE['LineSegments'](new THREE['EdgesGeometry'](e['floor']['geometry'],0xa),new THREE['LineBasicMaterial']({
            'color': '#ff0000'
        })),
        this['edges_floor']['visible'] = !0x1,
        this['edges_floor']['name'] = 'floor',
        e['edges_floor']['position']['copy'](e['floor']['position']),
        e['edges_floor']['rotation']['copy'](e['floor']['rotation']),
        e['walls']['add'](e['edges_floor']),
        this['fake_floor']['material']['opacity'] = 0x0,
        this['walls']['add'](this['fake_floor']),
        this['walls_objects']['push'](this['fake_floor'])) : (this['walls_objects']['push'](this['front_wall']),
        this['walls_objects']['push'](this['back_wall']),
        this['walls_objects']['push'](this['right_wall']),
        this['walls_objects']['push'](this['left_wall']),
        this['walls_objects']['push'](this['ceiling']),
        custom_settings['new_drag'] || (this['active_objects']['push'](this['right_wall']),
        this['active_objects']['push'](this['front_wall']),
        this['active_objects']['push'](this['left_wall']),
        this['active_objects']['push'](this['back_wall']))),
        this['box'] = new THREE['Box3']()['setFromObject'](this),
        this['build_sizes'](),
        this['build_light'](),
        this['build_plints'](),
        'edges' === global_options['mode'] && (e['edges'] && (reset_model(e['edges']),
        e['edges']['visible'] = !0x1),
        this['edges_mode']()),
        pp['config']['on_demand_render'] && pp['render']();
    }
    ['build_light']() {
        let e = 0x1;
        0x6e != THREE['REVISION'] && (e = _pi),
        this['amb_light'] = new THREE['AmbientLight'](0xffffff,0.603 * e),
        this['light1'] = new THREE['PointLight'](0xffffff,0.5,0x7d0),
        this['light1']['position']['set'](this['params']['width'] / units / 0x2, this['params']['height'] / units + 0x5, this['params']['depth'] / units / 0x2),
        this['light1']['shadow']['mapSize']['width'] = shadow_quality['high'],
        this['light1']['shadow']['mapSize']['height'] = shadow_quality['high'],
        this['light1']['shadow']['camera']['near'] = 0x1,
        this['light1']['shadow']['camera']['far'] = 0x4e20,
        this['light1']['castShadow'] = !0x1,
        this['light1']['decay'] = 0x5,
        0x6e != THREE['REVISION'] && (this['light1']['decay'] = 0x1),
        0x6e != THREE['REVISION'] && (this['light1']['intensity'] = 0xbe),
        this['directionalLight'] = new THREE['DirectionalLight'](0xffffff,0.2 * e,0x64),
        this['directionalLight']['castShadow'] = !0x1,
        this['directionalLight']['position']['set'](0x0, 0x1c2, this['params']['depth'] / units),
        this['directionalLight']['shadow']['mapSize']['width'] = shadow_quality['high'],
        this['directionalLight']['shadow']['mapSize']['height'] = shadow_quality['high'],
        this['directionalLight']['shadow']['camera']['near'] = 0.5,
        this['directionalLight']['shadow']['camera']['far'] = 0x5dc,
        this['directionalLight']['shadow']['camera']['left'] = -0x3e8,
        this['directionalLight']['shadow']['camera']['right'] = 0x3e8,
        this['directionalLight']['shadow']['camera']['top'] = 0x3e8,
        this['directionalLight']['shadow']['camera']['bottom'] = -0x3e8,
        this['directionalLight']['target'] = new THREE['Group'](),
        this['directionalLight']['target']['position']['set'](this['params']['width'] / units / 0x2, 0x0, 0x0),
        this['directionalLight']['target']['name'] = 'Directional\x20Light\x20Target',
        this['lights']['add'](this['amb_light']),
        this['lights']['add'](this['light1']),
        this['lights']['add'](this['directionalLight']),
        this['lights']['add'](this['directionalLight']['target']);
    }
    ['build_sizes']() {
        this['params']['floor_only'] ? (this['left_wall_size'] = new Sizes_obj({
            'width': this['params']['depth'] / units,
            'text': this['params']['depth'],
            'length': 0xe6 / units,
            'middle_line_position': 0xd7 / units
        }),
        this['left_wall_size']['position']['set'](0x0, 0x0, this['params']['depth'] / units / 0x2),
        this['left_wall_size']['rotation']['x'] = -Math['PI'] / 0x2,
        this['left_wall_size']['rotation']['z'] = Math['PI'] / 0x2,
        this['sizes']['add'](this['left_wall_size']),
        this['rigth_wall_size'] = new Sizes_obj({
            'width': this['params']['width'] / units,
            'text': this['params']['width'],
            'length': 0xe6 / units,
            'middle_line_position': 0xd7 / units
        }),
        this['rigth_wall_size']['position']['set'](this['params']['width'] / units / 0x2, 0x0, 0x0),
        this['rigth_wall_size']['rotation']['x'] = -Math['PI'] / 0x2,
        this['sizes']['add'](this['rigth_wall_size'])) : (this['left_wall_size'] = new Sizes_obj({
            'width': this['params']['depth'] / units,
            'text': this['params']['depth'],
            'length': 0xe6 / units,
            'middle_line_position': 0xd7 / units
        }),
        this['left_wall_size']['position']['set'](this['left_wall']['position']['x'], this['params']['height'] / units, this['left_wall']['position']['z']),
        this['left_wall_size']['rotation']['y'] = Math['PI'] / 0x2,
        this['rigth_wall_size'] = new Sizes_obj({
            'width': this['params']['depth'] / units,
            'text': this['params']['depth'],
            'length': 0xe6 / units,
            'middle_line_position': 0xd7 / units
        }),