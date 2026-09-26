  A['top_wall_2'] = Object_wall({
            'width': ag,
            'height': L,
            'thickness': I,
            'rX': Math['PI'] / 0x2,
            'pX': ah,
            'pY': D - I / 0x2,
            'pZ': E / 0x2 - L / 0x2,
            'name': 'top_wall',
            'material': q['params']['cabinet']['material']
        }),
        (0x1 === this['params']['gola'] && this['params']['doors']['length'] && 0x1 != project_settings['handle'][this['params']['cabinet_group']]['no_handle'] || 0x1 === this['params']['gola'] && this['params']['lockers']['length'] && 0x1 != project_settings['handle'][this['params']['cabinet_group']]['no_handle']) && this['params']['cabinet']['height'] < 0x384 && (A['top_wall_2']['position']['z'] = E / 0x2 - L / 0x2 - 0x3);
    } else {
        A['top_wall_2'] = void 0x0;
        let ai = B - 0x2 * I
          , aj = 0x0;
        custom_settings['fit_side_into_module'] && (ai = ai - a4 - a5,
        aj = aj + a4 / 0x2 - a5 / 0x2),
        A['top_wall'] = Object_wall({
            'width': ai,
            'height': E - R,
            'thickness': I,
            'rX': Math['PI'] / 0x2,
            'pX': aj,
            'pY': D - I / 0x2,
            'pZ': R / 0x2,
            'name': 'top_wall',
            'material': q['params']['cabinet']['material']
        });
    }
    let aa = B - 0x2 * I
      , ab = 0x0;
    custom_settings['fit_side_into_module'] && (aa = aa - a4 - a5,
    ab = ab + a4 / 0x2 - a5 / 0x2),
    A['bottom_wall'] = Object_wall({
        'width': aa,
        'height': a8 - R,
        'thickness': I,
        'rX': Math['PI'] / 0x2,
        'pX': ab,
        'pY': I / 0x2,
        'pZ': a9 + R / 0x2,
        'name': 'bottom_wall',
        'material': q['params']['cabinet']['material']
    }),
    0x1 == this['params']['cabinet']['left_wall'] && (A['add'](A['left_wall']),
    this['userData']['sides']['left'] = A['left_wall']),
    0x1 == this['params']['cabinet']['right_wall'] && (A['add'](A['right_wall']),
    this['userData']['sides']['right'] = A['right_wall']),
    0x1 == this['params']['cabinet']['top_wall'] && A['add'](A['top_wall']),
    A['top_wall_2'] && 0x1 == this['params']['cabinet']['top_wall'] && A['add'](A['top_wall_2']),
    0x1 == this['params']['cabinet']['bottom_wall'] && A['add'](A['bottom_wall']),
    this['build_walls_common']();
}
,
Cabinet_new['prototype']['build_sections_common'] = function(f={}) {
    var g = this
      , h = new THREE['Box3']()['setFromObject'](this['cabinet'])['getSize'](new THREE['Vector3']())
      , j = (this['reset_model'](this['sections']),
    {
        'name': 'Секция',
        'width': '100%',
        'height': '100%',
        'starting_point_x': '0%',
        'starting_point_y': '0%',
        'direction_x': 'right',
        'direction_y': 'top',
        'offset_top': 0x0,
        'offset_bottom': 0x0,
        'position_offset_top': 0x0,
        'position_offset_bottom': 0x0,
        'group': g['params']['cabinet_group'],
        'pX': 0x0,
        'pY': 0x0,
        'pZ': 0x0,
        'rX': 0x0,
        'rY': 0x0,
        'rZ': 0x0
    });
    for (let q = 0x0; q < g['params']['sections']['length']; q++) {
        var k = g['params']['sections'][q], k, l = k = Object['assign']({}, j, k), m = ('string' == typeof l['offset_top'] && -0x1 < l['offset_top']['indexOf']('%') && (l['offset_top'] = g['params']['cabinet']['height'] * parseFloat(l['offset_top']) / 0x64),
        'string' == typeof l['offset_bottom'] && -0x1 < l['offset_bottom']['indexOf']('%') && (l['offset_bottom'] = g['params']['cabinet']['height'] * parseFloat(l['offset_bottom']) / 0x64),
        'string' == typeof l['width'] && -0x1 < l['width']['indexOf']('%') && (l['width'] = g['const']['calculated_width'] * parseFloat(l['width']) / 0x64),
        'string' == typeof l['height'] && -0x1 < l['height']['indexOf']('%') && (l['height'] = (g['params']['cabinet']['height'] - l['offset_top'] - l['offset_bottom']) * parseFloat(l['height']) / 0x64),
        'string' == typeof l['starting_point_x'] && -0x1 < l['starting_point_x']['indexOf']('%') ? 'center' === l['starting_point_x'] ? l['pX'] = 0x0 : 'right' === l['direction_x'] ? l['pX'] = g['const']['calculated_width'] * parseFloat(l['starting_point_x']) / 0x64 / units : l['pX'] = g['const']['calculated_width'] * parseFloat(l['starting_point_x']) / 0x64 / units - l['width'] / units : (l['direction_x'],
        l['pX'] = l['starting_point_x'] / units),
        'string' == typeof l['starting_point_y'] && -0x1 < l['starting_point_y']['indexOf']('%') ? 'center' === l['starting_point_y'] ? l['pY'] = 0x0 + h['y'] / 0x2 - l['height'] / units / 0x2 : 'top' === l['direction_y'] ? l['pY'] = 0x0 + g['params']['cabinet']['height'] * parseFloat(l['starting_point_y']) / 0x64 / units - l['position_offset_top'] / units + l['position_offset_bottom'] / units : l['pY'] = 0x0 + g['params']['cabinet']['height'] * parseFloat(l['starting_point_y']) / 0x64 / units - l['height'] / units - l['position_offset_top'] / units + l['position_offset_bottom'] / units : l['pY'] = 0x0 + l['starting_point_y'] / units - l['position_offset_top'] / units + l['position_offset_bottom'] / units,
        new THREE['Group']()), p = (m['temp_type'] = 'Section',
        this['sections']['add'](m),
        m['userData']['index'] = q,
        m['position']['set'](l['pX'], l['pY'], l['pZ']),
        k['lockers'] && (m['lockers'] = new THREE['Group'](),
        m['lockers']['name'] = 'section_lockers',
        m['add'](m['lockers']),
        g['build_lockers_common']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['lockers'],
            'params': k
        })),
        0x0);
        k['doors'] && (m['doors'] = new THREE['Group'](),
        m['doors']['name'] = 'section_doors',
        m['add'](m['doors']),
        g['build_doors_all']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['doors'],
            'params': k
        })),
        k['walls'] && (m['walls'] = new THREE['Group'](),
        m['walls']['name'] = 'section_walls',
        m['add'](m['walls']),
        g['build_walls_common']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['walls'],
            'params': k
        })),
        !k['shelves'] && 0x1 != k['shelves_auto'] || (m['shelves'] = new THREE['Group'](),
        m['shelves']['name'] = 'section_shelves',
        m['add'](m['shelves']),
        g['build_shelves_common']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['shelves'],
            'params': k
        }));
    }
}
,
Cabinet_new['prototype']['build_walls_common'] = function(f={}) {
    var g = this
      , h = new THREE['Box3']()['setFromObject'](this['cabinet'])['getSize'](new THREE['Vector3']())
      , j = {
        'width': void 0x0 !== f['width'] ? f['width'] : g['const']['calculated_width'],
        'height': (void 0x0 !== f['height'] ? f : g['params']['cabinet'])['height'],
        'obj_to_add': void 0x0 !== f['obj_to_add'] ? f['obj_to_add'] : this['walls'],
        'params': (void 0x0 !== f['params'] ? f : g)['params']
    };
    this['reset_model'](j['obj_to_add']);
    let k = 0x0;
    -0x1 < j['obj_to_add']['name']['indexOf']('section_') && (k = 0x0);
    for (var l = 0x0; l < j['params']['walls']['length']; l++) {
        var m = j['params']['walls'][l]
          , m = {
            'width': void 0x0 !== m['width'] ? m['width'] : '100%',
            'height': void 0x0 !== m['depth'] ? m['depth'] : g['const']['calculated_depth'] - g['params']['cabinet']['back_wall_offset'],
            'thickness': void 0x0 !== m['height'] ? m['height'] : project_settings['corpus_thickness'],
            'name': 'cab_wall',
            'front_offset': void 0x0 !== m['front_offset'] ? m['front_offset'] : project_settings['shelve_offset'],
            'width_offset_left': void 0x0 !== m['width_offset_left'] ? m['width_offset_left'] : 0x0,
            'width_offset_right': void 0x0 !== m['width_offset_right'] ? m['width_offset_right'] : 0x0,
            'orientation': void 0x0 !== m['orientation'] ? m['orientation'] : 'horizontal',
            'baluster': void 0x0 !== m['baluster'] ? m['baluster'] : 0x0,
            'material': g['params']['cabinet']['material'],
            'starting_point_x': void 0x0 !== m['starting_point_x'] ? m['starting_point_x'] : '0%',
            'starting_point_y': void 0x0 !== m['starting_point_y'] ? m['starting_point_y'] : '0%',
            'position_offset_left': void 0x0 !== m['position_offset_left'] ? m['position_offset_left'] : 0x0,
            'position_offset_right': void 0x0 !== m['position_offset_right'] ? m['position_offset_right'] : 0x0,
            'position_offset_top': void 0x0 !== m['position_offset_top'] ? m['position_offset_top'] : 0x0,
            'position_offset_bottom': void 0x0 !== m['position_offset_bottom'] ? m['position_offset_bottom'] : 0x0,
            'direction_x': void 0x0 !== m['direction_x'] ? m['direction_x'] : 'right',
            'direction_y': void 0x0 !== m['direction_y'] ? m['direction_y'] : 'center',
            'pX': m['pX'] || 0x0,
            'pY': m['pY'] || k,
            'pZ': m['pZ'] || 0x0,
            'rX': m['rX'] || Math['PI'] / 0x2,
            'rY': m['rY'] || 0x0,
            'rZ': m['rZ'] || 0x0
        }
          , p = ('string' == typeof m['width'] && -0x1 < m['width']['indexOf']('%') && (m['width'] = 'vertical' === m['orientation'] ? (j['height'] - 0x2 * g['params']['cabinet']['thickness']) * parseFloat(m['width']) / 0x64 - m['width_offset_left'] - m['width_offset_right'] : (j['width'] - 0x2 * g['params']['cabinet']['thickness']) * parseFloat(m['width']) / 0x64 - m['width_offset_left'] - m['width_offset_right']),
        'string' == typeof m['height'] && -0x1 < m['height']['indexOf']('%') && (m['height'] = g['const']['calculated_depth'] * parseFloat(m['height']) / 0x64),
        'string' == typeof m['starting_point_x'] && -0x1 < m['starting_point_x']['indexOf']('%') ? 'center' === m['starting_point_x'] ? m['pX'] = -m['width'] / units / 0x2 : 'horizontal' === m['orientation'] ? ('center' === m['direction_x'] && (m['pX'] = -j['width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(m['starting_point_x']) / 0x64 / units + m['position_offset_left'] / units - m['position_offset_right'] / units),
        'right' === m['direction_x'] && (m['pX'] = -j['width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(m['starting_point_x']) / 0x64 / units + m['width'] / units / 0x2 + m['position_offset_left'] / units - m['position_offset_right'] / units + g['params']['cabinet']['thickness'] / units),
        'left' === m['direction_x'] && (m['pX'] = -j['width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(m['starting_point_x']) / 0x64 / units + m['position_offset_left'] / units - m['position_offset_right'] / units - g['params']['cabinet']['thickness'] / 0x2 / units)) : ('right' === m['direction_x'] && (m['pX'] = -j['width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(m['starting_point_x']) / 0x64 / units - m['thickness'] / units + m['position_offset_left'] / units - m['position_offset_right'] / units + g['params']['cabinet']['thickness'] / units),
        'left' === m['direction_x'] && (m['pX'] = j['width'] / units / 0x2 - g['params']['cabinet']['width'] * parseFloat(m['starting_point_x']) / 0x64 / units - m['thickness'] / units + m['position_offset_left'] / units - m['position_offset_right'] / units + g['params']['cabinet']['thickness'] / units)) : m['pX'] = -j['width'] / units / 0x2 + m['starting_point_x'] / units + m['width'] / units / 0x2 + g['params']['cabinet']['thickness'] / units,
        'string' == typeof m['starting_point_y'] && -0x1 < m['starting_point_y']['indexOf']('%') ? 'center' === m['starting_point_y'] ? m['pY'] = k + h['y'] / 0x2 - m['height'] / units / 0x2 : ('center' === m['direction_y'] && (m['pY'] = 'horizontal' === m['orientation'] ? k + (j['height'] - m['position_offset_top'] + m['position_offset_bottom']) * parseFloat(m['starting_point_y']) / 0x64 / units : k + (j['height'] - m['position_offset_top']) * parseFloat(m['starting_point_y']) / 0x64 / units + m['width'] / units / 0x2 + g['params']['cabinet']['thickness'] / units),
        'top' === m['direction_y'] && 'horizontal' === m['orientation'] && (m['pY'] = k + (j['height'] - m['position_offset_top'] + m['position_offset_bottom'] + m['thickness'] / 0x2) * parseFloat(m['starting_point_y']) / 0x64 / units),
        'bottom' === m['direction_y'] && 'horizontal' === m['orientation'] && (m['pY'] = k + (j['height'] - m['position_offset_top'] + m['position_offset_bottom'] - m['thickness'] / 0x2) * parseFloat(m['starting_point_y']) / 0x64 / units)) : m['pY'] = k + m['starting_point_y'] / units,
        'vertical' === m['orientation'] && (m['rY'] = Math['PI'] / 0x2),
        m['width'] /= units,
        m['height'] /= units,
        m['thickness'] /= units,
        m['holders'] = !0x1,
        m['pZ'] += this['params']['cabinet']['back_wall_offset'] / units / 0x2,
        custom_settings['fit_side_into_module'] && this['userData']['flags'] && (m['width'] = m['width'] - this['userData']['flags']['sm_flag_l'] - this['userData']['flags']['sm_flag_r'],
        m['pX'] = m['pX'] + this['userData']['flags']['sm_flag_l'] / 0x2 - this['userData']['flags']['sm_flag_r'] / 0x2),
        new Object_wall(m));
        p['position']['set'](m['pX'], m['pY'], m['pZ']),
        j['obj_to_add']['add'](p);
    }
}
,
Cabinet_new['prototype']['build_cokol_common'] = function() {
    var f, g, h, j, k, l, m, p;
    this['params']['cokol']['height'] < 0x1 || (g = (f = this)['cokol'],
    h = f['const']['calculated_width'] / units,
    j = f['const']['calculated_depth'] / units,
    k = f['params']['cokol']['height'] / units,
    l = f['params']['cokol']['thickness'] / units,
    m = f['params']['cokol']['material'],
    0x3b < f['params']['cabinet']['width'] && 0x0 != f['params']['cokol']['legs'] && (f['params']['cabinet']['width'] < 0xfa ? (p = new CabinetLeg({
        'height': f['params']['cokol']['height'],
        'is_cokol_active': f['params']['cokol']['is_cokol_active']
    }),
    g['add'](p),
    p['position']['x'] = 0x0,
    p['position']['z'] = -j / 0x2 + p['params']['radius2'] / units / 0x2 + 0x2 * l,
    p = new CabinetLeg({
        'height': f['params']['cokol']['height'],
        'is_cokol_active': f['params']['cokol']['is_cokol_active']
    }),
    g['add'](p),
    p['position']['x'] = 0x0) : (p = new CabinetLeg({
        'height': f['params']['cokol']['height'],
        'is_cokol_active': f['params']['cokol']['is_cokol_active']
    }),
    g['add'](p),
    p['position']['x'] = -h / 0x2 + p['params']['radius2'] / units / 0x2 + 0x2 * l,
    p['position']['z'] = -j / 0x2 + p['params']['radius2'] / units / 0x2 + 0x2 * l,
    p = new CabinetLeg({
        'height': f['params']['cokol']['height'],
        'is_cokol_active': f['params']['cokol']['is_cokol_active']
    }),
    g['add'](p),
    p['position']['x'] = h / 0x2 - p['params']['radius2'] / units / 0x2 - 0x2 * l,
    p['position']['z'] = -j / 0x2 + p['params']['radius2'] / units / 0x2 + 0x2 * l,
    p = new CabinetLeg({
        'height': f['params']['cokol']['height'],
        'is_cokol_active': f['params']['cokol']['is_cokol_active']
    }),
    g['add'](p),
    p['position']['x'] = -h / 0x2 + p['params']['radius2'] / units / 0x2 + 0x2 * l,
    p['position']['z'] = j / 0x2 - p['params']['radius2'] / units / 0x2 - 0x3 * l - cokol_settings['offset'] / units,
    p = new CabinetLeg({
        'height': f['params']['cokol']['height'],
        'is_cokol_active': f['params']['cokol']['is_cokol_active']
    }),
    g['add'](p),
    p['position']['x'] = h / 0x2 - p['params']['radius2'] / units / 0x2 - 0x2 * l),
    p['position']['z'] = j / 0x2 - p['params']['radius2'] / units / 0x2 - 0x3 * l - cokol_settings['offset'] / units),
    g['front'] = new CabinetCokol({
        'width': h * units,
        'height': k * units,
        'thickness': l * units,
        'pZ': j / 0x2 - l - cokol_settings['offset'] / units,
        'pY': k / 0x2,
        'material': m,
        'name': 'cokol_front'
    }),
    g['left'] = new CabinetCokol({
        'width': j * units - l * units - l * units / 0x3 - cokol_settings['offset'],
        'height': k * units,
        'thickness': l * units,
        'rY': -Math['PI'] / 0x2,
        'pY': k / 0x2,
        'pX': -h / 0x2 + l / 0x2,
        'pZ': l / 0x3 / 0x2 - l - cokol_settings['offset'] / units / 0x2,
        'material': m,
        'name': 'cokol_left'
    }),
    g['right'] = new CabinetCokol({
        'width': j * units - l * units - l * units / 0x3 - cokol_settings['offset'],
        'height': k * units,
        'thickness': l * units,
        'rY': Math['PI'] / 0x2,
        'pY': k / 0x2,
        'pX': h / 0x2 - l / 0x2,
        'pZ': l / 0x3 / 0x2 - l - cokol_settings['offset'] / units / 0x2,
        'material': m,
        'name': 'cokol_right'
    }),
    g['back'] = new CabinetCokol({
        'width': h * units,
        'height': k * units,
        'thickness': l * units,
        'rY': Math['PI'],
        'pZ': -j / 0x2 + l / 0x2,
        'pY': k / 0x2,
        'material': m,
        'name': 'cokol_back'
    }),
    g['left']['visible'] = f['params']['cokol']['visible']['left'],
    g['right']['visible'] = f['params']['cokol']['visible']['right'],
    g['back']['visible'] = f['params']['cokol']['visible']['back'],
    g['front']['visible'] = f['params']['cokol']['visible']['front'],
    g['add'](g['front']),
    g['add'](g['left']),
    g['add'](g['right']),
    g['add'](g['back']));
}
,
Cabinet_new['prototype']['build_tabletop_common'] = function(f) {
    var g = this, h, j, k, l, m, q, u, f, q, q, v, f, m, l, q;
    !0x1 !== this['params']['tabletop']['active'] && (j = g['params']['tabletop']['offset']['left'],
    k = g['params']['tabletop']['offset']['right'],
    l = g['params']['tabletop']['offset']['front'],
    m = g['params']['tabletop']['offset']['back'],
    q = g['params']['tabletop']['height'],
    u = g['const']['calculated_width'],
    q = {
        'width': (u = f ? f : u) + j + k,
        'height': q,
        'depth': (f = g['const']['calculated_depth']) + m + l,
        'holes': g['params']['tabletop']['holes'],
        'material': g['params']['tabletop']['material'],
        'id': void 0x0 !== g['params']['tabletop']['tabletop_id'] ? g['params']['tabletop']['tabletop_id'] : 0x0,
        'variant': void 0x0 !== g['params']['tabletop']['tabletop_variant'] ? g['params']['tabletop']['tabletop_variant'] : 0x0
    },
    q = new Tabletop(q),
    v = u + j + k,
    f = f + m + l,
    g['tabletop']['add'](q),
    0x0 != this['params']['tabletop']['plints']['back'] && (m = new Decoration({
        'width': u + j + k,
        'height': 0x1e,
        'thickness': 0x14,
        'material': g['params']['tabletop']['material'],
        'model': '/common_assets/models/tp1.fbx'
    }),
    g['tabletop']['add'](m),
    m['position']['y'] = 0x1e / units / 0x2,
    m['position']['z'] = -f / units / 0x2 + 0x14 / units / 0x2),
    0x0 != this['params']['tabletop']['plints']['left'] && (l = new Decoration({
        'width': f,
        'height': 0x1e,
        'thickness': 0x14,
        'material': g['params']['tabletop']['material'],
        'model': '/common_assets/models/tp1.fbx'
    }),
    g['tabletop']['add'](l),
    l['rotation']['y'] = Math['PI'] / 0x2,
    l['position']['y'] = 0x1e / units / 0x2,
    l['position']['x'] = -v / units / 0x2 + 0x14 / units / 0x2),
    0x0 != this['params']['tabletop']['plints']['right']) && (q = new Decoration({
        'width': f,
        'height': 0x1e,
        'thickness': 0x14,
        'material': g['params']['tabletop']['material'],
        'model': '/common_assets/models/tp1.fbx'
    }),
    g['tabletop']['add'](q),
    q['rotation']['y'] = -Math['PI'] / 0x2,
    q['position']['y'] = 0x1e / units / 0x2,
    q['position']['x'] = v / units / 0x2 - 0x14 / units / 0x2);
}
,
Cabinet_new['prototype']['build_shelves_common'] = function(f={}) {
    var g = this
      , h = new THREE['Box3']()['setFromObject'](this['cabinet'])['getSize'](new THREE['Vector3']())
      , j = {
        'width': void 0x0 !== f['width'] ? f['width'] : g['const']['calculated_width'],
        'height': (void 0x0 !== f['height'] ? f : g['params']['cabinet'])['height'],
        'obj_to_add': void 0x0 !== f['obj_to_add'] ? f['obj_to_add'] : this['shelves'],
        'params': (void 0x0 !== f['params'] ? f : g)['params']
    };
    this['reset_model'](j['obj_to_add']),
    j['params']['shelves_auto'] && this['build_shelves_auto'](j);
    let k = g['cabinet']['position']['y'];
    -0x1 < j['obj_to_add']['name']['indexOf']('section_') && (k = 0x0);
    for (var l = 0x0; l < j['params']['shelves']['length']; l++) {
        var m = j['params']['shelves'][l], p, p, m, m, m = (m['v2'] ? ((p = {
            'width': void 0x0 !== m['width'] ? m['width'] : '100%',
            'height': void 0x0 !== m['depth'] ? m['depth'] : g['const']['calculated_depth'],
            'thickness': void 0x0 !== m['height'] ? m['height'] : project_settings['shelves_thickness'],
            'front_offset': void 0x0 !== m['front_offset'] ? m['front_offset'] : project_settings['shelve_offset'],
            'width_offset_left': void 0x0 !== m['width_offset_left'] ? m['width_offset_left'] : 0x0,
            'width_offset_right': void 0x0 !== m['width_offset_right'] ? m['width_offset_right'] : 0x0,
            'orientation': void 0x0 !== m['orientation'] ? m['orientation'] : 'horizontal',
            'baluster': void 0x0 !== m['baluster'] ? m['baluster'] : 0x0,
            'material': g['params']['cabinet']['material'],
            'fixed_material': void 0x0 !== m['fixed_material'] ? m['fixed_material'] : null,
            'starting_point_x': void 0x0 !== m['starting_point_x'] ? m['starting_point_x'] : '50%',
            'starting_point_y': void 0x0 !== m['starting_point_y'] ? m['starting_point_y'] : '0%',
            'position_offset_left': void 0x0 !== m['position_offset_left'] ? m['position_offset_left'] : 0x0,
            'position_offset_right': void 0x0 !== m['position_offset_right'] ? m['position_offset_right'] : 0x0,
            'position_offset_top': void 0x0 !== m['position_offset_top'] ? m['position_offset_top'] : 0x0,
            'position_offset_bottom': void 0x0 !== m['position_offset_bottom'] ? m['position_offset_bottom'] : 0x0,
            'direction_x': void 0x0 !== m['direction_x'] ? m['direction_x'] : 'right',
            'direction_y': void 0x0 !== m['direction_y'] ? m['direction_y'] : 'center',
            'pX': m['pX'] || 0x0,
            'pY': m['pY'] || k,
            'pZ': m['pZ'] || 0x0,
            'rX': m['rX'] || Math['PI'] / 0x2,
            'rY': m['rY'] || 0x0,
            'rZ': m['rZ'] || 0x0
        })['height'] = p['height'] - p['front_offset'],
        p['pZ'] = p['pZ'] - project_settings['shelve_offset'] / units / 0x2,
        'string' == typeof p['width'] && -0x1 < p['width']['indexOf']('%') && ('vertical' === p['orientation'] ? p['width'] = (j['height'] - 0x2 * g['params']['cabinet']['thickness']) * parseFloat(p['width']) / 0x64 - p['width_offset_left'] - p['width_offset_right'] : p['width'] = (j['width'] - 0x2 * g['params']['cabinet']['thickness']) * parseFloat(p['width']) / 0x64 - p['width_offset_left'] - p['width_offset_right']),
        'string' == typeof p['height'] && -0x1 < p['height']['indexOf']('%') && (p['height'] = g['const']['calculated_depth'] * parseFloat(p['height']) / 0x64),
        'string' == typeof p['starting_point_x'] && -0x1 < p['starting_point_x']['indexOf']('%') ? 'center' === p['starting_point_x'] ? p['pX'] = -p['width'] / units / 0x2 : 'horizontal' === p['orientation'] ? ('center' === p['direction_x'] && (p['pX'] = -j['width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(p['starting_point_x']) / 0x64 / units + p['position_offset_left'] / units - p['position_offset_right'] / units),
        'right' === p['direction_x'] && (p['pX'] = -j['width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(p['starting_point_x']) / 0x64 / units + p['width'] / units / 0x2 + p['position_offset_left'] / units - p['position_offset_right'] / units + g['params']['cabinet']['thickness'] / units),
        'left' === p['direction_x'] && (p['pX'] = -j['width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(p['starting_point_x']) / 0x64 / units + p['position_offset_left'] / units - p['position_offset_right'] / units - g['params']['cabinet']['thickness'] / 0x2 / units)) : ('right' === p['direction_x'] && (p['pX'] = -j['width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(p['starting_point_x']) / 0x64 / units - p['thickness'] / units + p['position_offset_left'] / units - p['position_offset_right'] / units + g['params']['cabinet']['thickness'] / units),
        'left' === p['direction_x'] && (p['pX'] = j['width'] / units / 0x2 - g['params']['cabinet']['width'] * parseFloat(p['starting_point_x']) / 0x64 / units - p['thickness'] / units + p['position_offset_left'] / units - p['position_offset_right'] / units + g['params']['cabinet']['thickness'] / units)) : 'horizontal' === p['orientation'] ? p['pX'] = -j['width'] / units / 0x2 + p['starting_point_x'] / units + p['width'] / units / 0x2 + g['params']['cabinet']['thickness'] / units : p['pX'] = -j['width'] / units / 0x2 + p['starting_point_x'] / units + p['thickness'] / units / 0x2 + g['params']['cabinet']['thickness'] / units,
        'string' == typeof p['starting_point_y'] && -0x1 < p['starting_point_y']['indexOf']('%') ? 'center' === p['starting_point_y'] ? p['pY'] = k + h['y'] / 0x2 - p['height'] / units / 0x2 : ('center' === p['direction_y'] && ('horizontal' === p['orientation'] ? p['pY'] = k + (j['height'] - p['position_offset_top'] + p['position_offset_bottom']) * parseFloat(p['starting_point_y']) / 0x64 / units : p['pY'] = k + (j['height'] - p['position_offset_top']) * parseFloat(p['starting_point_y']) / 0x64 / units + p['width'] / units / 0x2 + g['params']['cabinet']['thickness'] / units),
        'top' === p['direction_y'] && 'horizontal' === p['orientation'] && (p['pY'] = k + (j['height'] - p['position_offset_top'] + p['position_offset_bottom'] + p['thickness'] / 0x2) * parseFloat(p['starting_point_y']) / 0x64 / units),
        'bottom' === p['direction_y'] && 'horizontal' === p['orientation'] && (p['pY'] = k + (j['height'] - p['position_offset_top'] + p['position_offset_bottom'] - p['thickness'] / 0x2) * parseFloat(p['starting_point_y']) / 0x64 / units)) : p['pY'] = k + p['starting_point_y'] / units) : ((p = {
            'width': void 0x0 !== m['width'] ? m['width'] : '100%',
            'height': void 0x0 !== m['depth'] ? m['depth'] : g['const']['calculated_depth'],
            'thickness': void 0x0 !== m['height'] ? m['height'] : project_settings['shelves_thickness'],
            'front_offset': void 0x0 !== m['front_offset'] ? m['front_offset'] : project_settings['shelve_offset'],
            'orientation': void 0x0 !== m['orientation'] ? m['orientation'] : 'horizontal',
            'baluster': void 0x0 !== m['baluster'] ? m['baluster'] : 0x0,
            'material': g['params']['cabinet']['material'],
            'fixed_material': void 0x0 !== m['fixed_material'] ? m['fixed_material'] : null,
            'starting_point_x': void 0x0 !== m['starting_point_x'] ? m['starting_point_x'] : '50%',
            'starting_point_y': void 0x0 !== m['starting_point_y'] ? m['starting_point_y'] : '0%',
            'position_offset_top': void 0x0 !== m['position_offset_top'] ? m['position_offset_top'] : 0x0,
            'position_offset_bottom': void 0x0 !== m['position_offset_bottom'] ? m['position_offset_bottom'] : 0x0,
            'direction_x': void 0x0 !== m['direction_x'] ? m['direction_x'] : 'right',
            'direction_y': void 0x0 !== m['direction_y'] ? m['direction_y'] : 'top',
            'pX': m['pX'] || 0x0,
            'pY': m['pY'] || k,
            'pZ': m['pZ'] || 0x0,
            'rX': m['rX'] || Math['PI'] / 0x2,
            'rY': m['rY'] || 0x0,
            'rZ': m['rZ'] || 0x0
        })['height'] = p['height'] - p['front_offset'],
        p['pZ'] = p['pZ'] - project_settings['shelve_offset'] / units / 0x2,
        'string' == typeof p['width'] && -0x1 < p['width']['indexOf']('%') && ('vertical' === p['orientation'] ? p['width'] = (j['height'] - 0x2 * g['params']['cabinet']['thickness']) * parseFloat(p['width']) / 0x64 : p['width'] = (j['width'] - 0x2 * g['params']['cabinet']['thickness']) * parseFloat(p['width']) / 0x64),
        'string' == typeof p['height'] && -0x1 < p['height']['indexOf']('%') && (p['height'] = g['params']['cabinet']['depth'] * parseFloat(p['height']) / 0x64),
        'string' == typeof p['starting_point_x'] && -0x1 < p['starting_point_x']['indexOf']('%') && ('center' === p['starting_point_x'] ? p['pX'] = -p['width'] / units / 0x2 : 'right' === p['direction_x'] ? p['pX'] = -j['width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(p['starting_point_x']) / 0x64 / units : p['pX'] = -j['width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(p['starting_point_x']) / 0x64 / units - p['width'] / units),
        'string' == typeof p['starting_point_y'] && -0x1 < p['starting_point_y']['indexOf']('%') ? (m = j['height'],
        'center' === p['starting_point_y'] ? p['pY'] = k + h['y'] / 0x2 - p['height'] / units / 0x2 : 'top' === p['direction_y'] ? 'horizontal' === p['orientation'] ? p['pY'] = k + (m - p['position_offset_top']) * parseFloat(p['starting_point_y']) / 0x64 / units : p['pY'] = k + (m - p['position_offset_top']) * parseFloat(p['starting_point_y']) / 0x64 / units + p['width'] / units / 0x2 : 'horizontal' === p['orientation'] ? p['pY'] = k + m * parseFloat(p['starting_point_y']) / 0x64 / units - p['height'] / units : p['pY'] = k + m * parseFloat(p['starting_point_y']) / 0x64 / units - p['width'] / units / 0x2) : p['pY'] = k + p['starting_point_y'] / units),
        'vertical' === p['orientation'] && (p['rY'] = Math['PI'] / 0x2),
        p['width'] /= units,
        p['height'] /= units,
        p['thickness'] /= units,
        p['holders'] = !0x1,
        p['pZ'] += this['params']['cabinet']['back_wall_offset'] / units / 0x2,
        0x1 == j['params']['shelves_glass'] && (m = project_settings['materials']['glass_shelves'][j['params']['shelves_glass_material']['key']],
        p['material'] = j['params']['shelves_glass_material']['default'],
        p['thickness'] = m['thickness'] / units),
        p['fixed_material'] && null != p['fixed_material'] && materials_lib['items'][p['fixed_material']] && (p['material'] = p['fixed_material']),
        custom_settings['fit_side_into_module'] && this['userData']['flags'] && (p['width'] = p['width'] - this['userData']['flags']['sm_flag_l'] - this['userData']['flags']['sm_flag_r'],
        p['pX'] = p['pX'] + this['userData']['flags']['sm_flag_l'] / 0x2 - this['userData']['flags']['sm_flag_r'] / 0x2),
        new Object_wall(p));
        m['position']['set'](p['pX'], p['pY'], p['pZ']),
        j['obj_to_add']['add'](m);
    }
}
,
Cabinet_new['prototype']['build_shelves_common_new'] = function(j={}) {
    let k = this;
    var q = {
        'width': void 0x0 !== j['width'] ? j['width'] : k['const']['calculated_width'],
        'height': (void 0x0 !== j['height'] ? j : k['params']['cabinet'])['height'],
        'depth': void 0x0 !== j['depth'] ? j['depth'] : k['const']['calculated_depth'],
        'obj_to_add': void 0x0 !== j['obj_to_add'] ? j['obj_to_add'] : k['shelves'],
        'params': (void 0x0 !== j['params'] ? j : k)['params']
    };
    q['params']['shelves_auto'] && this['build_shelves_auto'](q);
    let v = k['cabinet']['position']['y'];
    -0x1 < q['obj_to_add']['name']['indexOf']('section_') && (v = 0x0);
    for (var x = 0x0; x < q['params']['shelves']['length']; x++) {
        var y = G(q['params']['shelves'][x]);
        let H, I, J, K, L, N;
        var z = q['width'] - 0x2 * k['params']['cabinet']['thickness']
          , A = q['height'] - 0x2 * k['params']['cabinet']['thickness']
          , B = q['depth']
          , C = convert_offset(z, y['offset']['x'])
          , D = convert_offset(A, y['offset']['y'])
          , E = convert_offset(B, y['offset']['z']);
        switch (y['spec']['orientation']) {
        case 'horizontal':
            H = convert_size(z, y['size']['x'], C),
            I = convert_size(B, y['size']['y'], E),
            J = convert_size(A, y['size']['z'], [0x0, 0x0]),
            K = convert_position(z, y['pos']['x'], y['dir']['x'], H, C),
            L = convert_position(A, y['pos']['y'], y['dir']['y'], J, D),
            N = convert_position(B, y['pos']['z'], y['dir']['z'], I, E);
            break;
        case 'vertical':
            H = convert_size(B, y['size']['x'], E),
            I = convert_size(A, y['size']['y'], D),
            J = convert_size(z, y['size']['z'], [0x0, 0x0]),
            K = convert_position(z, y['pos']['x'], y['dir']['x'], J, C),
            L = convert_position(A, y['pos']['y'], y['dir']['y'], I, D),
            N = convert_position(B, y['pos']['z'], y['dir']['z'], H, E);
            break;
        case 'frontal':
            H = convert_size(z, y['size']['x'], C),
            I = convert_size(A, y['size']['y'], D),
            J = convert_size(B, y['size']['z'], [0x0, 0x0]),
            K = convert_position(z, y['pos']['x'], y['dir']['x'], H, C),
            L = convert_position(A, y['pos']['y'], y['dir']['y'], I, D),
            N = convert_position(B, y['pos']['z'], y['dir']['z'], J, E);
            break;
        }
        var F = new CWall({
            'width': H,
            'height': I,
            'thickness': J,
            'name': 'shelve',
            'material': y['material']
        });
        F['position']['set']((-q['width'] / 0x2 + k['params']['cabinet']['thickness'] + K) / units, v + (k['params']['cabinet']['thickness'] + L) / units, (-q['depth'] / 0x2 + N) / units),
        'horizontal' == y['spec']['orientation'] && F['geometry']['rotateX'](Math['PI'] / 0x2),
        'vertical' == y['spec']['orientation'] && F['geometry']['rotateY'](Math['PI'] / 0x2),
        q['obj_to_add']['add'](F),
        q['params']['shelves'][x] = y;
    }
    function G(O) {
        var P = {
            'spec': {
                'orientation': 'horizontal',
                'type': 'common',
                'type_params': {},
                'shape': null,
                'v': 0x1
            },
            'size': {
                'x': '100%',
                'y': '100%',
                'z': 0x10
            },
            'pos': {
                'x': '50%',
                'y': 0x0,
                'z': 0x0
            },
            'dir': {
                'x': 0x0,
                'y': 0x0,
                'z': 0x1
            },
            'rot': {
                'x': 0x0,
                'y': 0x0,
                'z': 0x0
            },
            'offset': {
                'x': [0x0, 0x0],
                'y': [0x0, 0x0],
                'z': [0x0, 0x0]
            },
            'material': {
                'id': k['params']['cabinet']['material'],
                'rotated': 0x0,
                'fixed': 0x0
            }
        }
          , O = copy_object(O);
        return O['width'] && (P['size']['x'] = O['width'],
        delete O['width']),
        O['height'] && (P['size']['y'] = O['depth'],
        delete O['height']),
        O['thickness'] && (P['size']['z'] = O['thickness'],
        delete O['thickness']),
        O['front_offset'] && (P['offset']['z'][0x1] = O['front_offset'],
        delete O['front_offset']),
        O['orientation'] && (P['spec']['orientation'] = O['orientation'],
        O['v2'] || 'vertical' == O['orientation'] && (P['dir']['y'] = 0x1),
        delete O['orientation']),
        O['starting_point_x'] && (P['pos']['x'] = O['starting_point_x'],
        delete O['starting_point_x']),
        O['starting_point_y'] && (P['pos']['y'] = O['starting_point_y'],
        delete O['starting_point_y']),
        O['position_offset_top'] && !O['position_offset_bottom'] && (P['offset']['y'][0x1] = O['position_offset_top']),
        O['position_offset_bottom'] && !O['position_offset_top'] && (P['offset']['y'][0x0] = O['position_offset_bottom']),
        O['position_offset_bottom'] && O['position_offset_top'] && (P['offset']['y'][0x1] = O['position_offset_bottom'] - O['position_offset_top']),
        O['direction_x'] && (P['dir']['x'] = O['direction_x'],
        delete O['direction_x']),
        O['direction_y'] && (P['dir']['y'] = O['direction_y'],
        delete O['direction_y']),
        _['merge'](P, O);
    }
}
,
Cabinet_new['prototype']['build_shelve'] = function(e={}) {}
,
Cabinet_new['prototype']['build_lockers_common'] = function(f={}) {
    var g = this
      , j = new THREE['Box3']()['setFromObject'](this['cabinet'])['getSize'](new THREE['Vector3']())
      , k = {
        'width': void 0x0 !== f['width'] ? f['width'] : g['const']['calculated_width'],
        'height': (void 0x0 !== f['height'] ? f : g['params']['cabinet'])['height'],
        'obj_to_add': void 0x0 !== f['obj_to_add'] ? f['obj_to_add'] : this['lockers'],
        'params': (void 0x0 !== f['params'] ? f : g)['params']
    };
    let l = g['cabinet']['position']['y'];
    -0x1 < k['obj_to_add']['name']['indexOf']('section_') && (l = 0x0),
    this['reset_model'](k['obj_to_add']),
    k['params']['section_name'];
    for (var m = 0x0; m < k['params']['lockers']['length']; m++) {
        var q = k['params']['lockers'][m], u = {
            'active': void 0x0 !== q['active'] ? q['active'] : project_settings['facades_active'],
            'width': void 0x0 !== q['width'] ? q['width'] : '100%',
            'height': void 0x0 !== q['height'] ? q['height'] : '100%',
            'depth': g['const']['calculated_depth'] - 0x5,
            'thickness': void 0x0 !== q['thickness'] ? q['thickness'] : void 0x0,
            'facade': void 0x0 !== q['facade'] ? q['facade'] : void 0x0,
            'style': void 0x0 !== q['style'] ? q['style'] : 'full',
            'inner': void 0x0 !== q['inner'] && q['inner'],
            'type': void 0x0 !== q['type'] ? q['type'] : null,
            'type_params': void 0x0 !== q['type_params'] ? q['type_params'] : null,
            'corpus_material': void 0x0 !== q['corpus_material'] ? q['corpus_material'] : this['params']['cabinet']['material'],
            'material': void 0x0 !== q['material'] ? q['material'] : void 0x0,
            'material_rotated': void 0x0 !== q['material_rotated'] ? q['material_rotated'] : project_settings['selected_materials'][g['params']['cabinet_group']]['facades_rotated'],
            'handle_model': void 0x0 !== q['handle_model'] ? q['handle_model'] : project_settings['handle'][g['params']['cabinet_group']]['model'],
            'handle_size_index': void 0x0 !== q['handle_size_index'] ? q['handle_size_index'] : project_settings['handle'][g['params']['cabinet_group']]['preferable_size'],
            'handle_orientation': void 0x0 !== q['handle_orientation'] ? q['handle_orientation'] : 'horizontal',
            'handle_position': void 0x0 !== q['handle_position'] ? q['handle_position'] : project_settings['handle'][g['params']['cabinet_group']]['lockers_position'],
            'no_handle_forced': void 0x0 !== q['no_handle_forced'] && q['no_handle_forced'],
            'starting_point_x': void 0x0 !== q['starting_point_x'] ? q['starting_point_x'] : '0%',
            'starting_point_y': void 0x0 !== q['starting_point_y'] ? q['starting_point_y'] : '0%',
            'direction_x': void 0x0 !== q['direction_x'] ? q['direction_x'] : 'right',
            'direction_y': void 0x0 !== q['direction_y'] ? q['direction_y'] : 'top',
            'offset_top': void 0x0 !== q['offset_top'] ? q['offset_top'] : 0x0,
            'offset_bottom': void 0x0 !== q['offset_bottom'] ? q['offset_bottom'] : 0x0,
            'position_offset_top': void 0x0 !== q['position_offset_top'] ? q['position_offset_top'] : 0x0,
            'position_offset_bottom': void 0x0 !== q['position_offset_bottom'] ? q['position_offset_bottom'] : 0x0,
            'fixed_facade_model': void 0x0 !== q['fixed_facade_model'] ? q['fixed_facade_model'] : void 0x0,
            'fixed_corpus_material': void 0x0 !== q['fixed_corpus_material'] ? q['fixed_corpus_material'] : void 0x0,
            'top_facade_offset': void 0x0 !== q['top_facade_offset'] ? q['top_facade_offset'] : void 0x0,
            'bottom_facade_offset': void 0x0 !== q['bottom_facade_offset'] ? q['bottom_facade_offset'] : void 0x0,
            'left_facade_offset': void 0x0 !== q['left_facade_offset'] ? q['left_facade_offset'] : void 0x0,
            'right_facade_offset': void 0x0 !== q['right_facade_offset'] ? q['right_facade_offset'] : void 0x0,
            'additional_materials': void 0x0 !== q['additional_materials'] ? q['additional_materials'] : {},
            'model': void 0x0 !== q['model'] ? q['model'] : void 0x0,
            'walls_visible': void 0x0 === q['walls_visible'] || q['walls_visible'],
            'walls_active': void 0x0 === q['walls_active'] || q['walls_active'],
            'models': void 0x0 !== q['models'] ? q['models'] : [],
            'models_only': void 0x0 !== q['models_only'] && q['models_only'],
            'group': g['params']['facades_group'],
            'facade_group': void 0x0 !== q['facade_group'] ? q['facade_group'] : g['params']['facades_group'],
            'params_locked': void 0x0 !== q['params_locked'] && q['params_locked'],
            'furniture_available': void 0x0 === q['furniture_available'] || q['furniture_available'],
            'pX': q['pX'] || 0x0,
            'pY': q['pY'] || l,
            'pZ': g['const']['calculated_depth'] / units / 0x2,
            'rX': q['rX'] || 0x0,
            'rY': q['rY'] || 0x0,
            'rZ': q['rZ'] || 0x0
        }, v, q, q, v, q, q, w, x;
        if (null != u['type'] && null == u['type_params'] && lockers_types[u['type']] && (u['type_params'] = {},
        u['type_params']['is_inner'] = 0x0,
        u['type_params']['params'] = copy_object(lockers_types[u['type']]['params']),
        u['type_params']['move'] = lockers_types[u['type']]['default_move'],
        u['type_params']['move_type'] = lockers_types[u['type']]['default_move_type'],
        u['type_params']['bottom_type'] = lockers_types[u['type']]['default_bottom_type']),
        u['starting_point_x'] < 0x0 && (u['starting_point_x'] = '0%'),
        void 0x0 === u['facade'] && (u['facade'] = project_settings['defaults']['facades'][u['facade_group']]),
        k['params']['lockers'][m] = JSON['parse'](JSON['stringify'](u)),
        u['params_link'] = k['params']['lockers'],
        void 0x0 === u['material'] && (u['material'] = project_settings['selected_materials']['facades'][u['facade']]['gen'][u['group']]),
        'string' == typeof u['offset_top'] && -0x1 < u['offset_top']['indexOf']('%') && (u['offset_top'] = k['height'] * parseFloat(u['offset_top']) / 0x64),
        'string' == typeof u['offset_bottom'] && -0x1 < u['offset_bottom']['indexOf']('%') && (u['offset_bottom'] = k['height'] * parseFloat(u['offset_bottom']) / 0x64),
        'string' == typeof u['width'] && -0x1 < u['width']['indexOf']('%') && (u['width'] = k['width'] * parseFloat(u['width']) / 0x64),
        'string' == typeof u['height'] && -0x1 < u['height']['indexOf']('%') && (u['height'] = (k['height'] - u['offset_top'] - u['offset_bottom']) * parseFloat(u['height']) / 0x64),
        'string' == typeof u['depth'] && -0x1 < u['depth']['indexOf']('%') && (u['depth'] = (g['params']['cabinet']['depth'] - g['params']['cabinet']['back_wall_offset']) * parseFloat(u['depth']) / 0x64),
        'string' == typeof u['starting_point_x'] && -0x1 < u['starting_point_x']['indexOf']('%') ? u['pX'] = 'center' === u['starting_point_x'] ? -u['width'] / units / 0x2 : 'right' === u['direction_x'] ? -k['width'] / units / 0x2 + k['width'] * parseFloat(u['starting_point_x']) / 0x64 / units : -k['width'] / units / 0x2 + k['width'] * parseFloat(u['starting_point_x']) / 0x64 / units - u['width'] / units : u['pX'] = 'right' === u['direction_x'] ? -k['width'] / units / 0x2 + u['starting_point_x'] / units : k['width'] / units / 0x2 - u['starting_point_x'] / units,
        'string' == typeof u['starting_point_y'] && -0x1 < u['starting_point_y']['indexOf']('%') ? u['pY'] = 'center' === u['starting_point_y'] ? l + j['y'] / 0x2 - u['height'] / units / 0x2 : 'top' === u['direction_y'] ? l + k['height'] * parseFloat(u['starting_point_y']) / 0x64 / units - u['position_offset_top'] / units + u['position_offset_bottom'] / units : l + k['height'] * parseFloat(u['starting_point_y']) / 0x64 / units - u['height'] / units - u['position_offset_top'] / units + u['position_offset_bottom'] / units : u['pY'] = l + u['starting_point_y'] / units - u['position_offset_top'] / units + u['position_offset_bottom'] / units,
        0x1 != project_settings['handle'][g['params']['cabinet_group']]['no_handle']) {
            if ('object' != typeof u['handle_model'] && (u['handle_model'] = project_settings['handle'][g['params']['cabinet_group']]['model'],
            u['handle_size_index'] = project_settings['handle'][g['params']['cabinet_group']]['preferable_size'],
            g['params']['lockers'][m]['handle_model'] = project_settings['handle'][g['params']['cabinet_group']]['model'],
            g['params']['lockers'][m]['handle_size_index'] = project_settings['handle'][g['params']['cabinet_group']]['preferable_size']),
            q = (void 0x0 === u['handle_model'] && (u['handle_model'] = handles_catalog['items'][0x0]),
            ((v = u['handle_model'])['sizes'][u['handle_size_index']] || u['handle_model']['sizes'][u['handle_model']['sizes']['length'] - 0x1])['width']),
            'horizontal' === u['handle_orientation'] && u['width'] <= q) {
                for (w = [],
                x = 0x0; x < v['sizes']['length']; x++)
                    v['sizes'][x]['index'] = x,
                    v['sizes'][x]['width'] <= u['width'] && w['push'](v['sizes'][x]);
                w['sort'](function(y, z) {
                    return z['width'] - y['width'];
                }),
                w['length'] ? (g['params']['lockers'][m]['handle_size_index'] = w[0x0]['index'],
                u['handle_size_index'] = w[0x0]['index']) : (g['params']['lockers'][m]['handle_orientation'] = 'vertical',
                u['handle_orientation'] = 'vertical');
            }
            if ('vertical' === u['handle_orientation'] && u['height'] <= q) {
                for (w = [],
                x = 0x0; x < v['sizes']['length']; x++)
                    v['sizes'][x]['index'] = x,
                    v['sizes'][x]['width'] <= u['height'] && w['push'](v['sizes'][x]);
                w['sort'](function(y, z) {
                    return z['width'] - y['width'];
                }),
                w['length'] && (g['params']['lockers'][m]['handle_size_index'] = w[0x0]['index'],
                u['handle_size_index'] = w[0x0]['index']);
            }
        }
        if ('bottom' === u['group']) {
            if (0x1 === this['params']['gola'] && 0x1 != project_settings['handle'][g['params']['cabinet_group']]['no_handle'] && 0x0 != facades_lib['get_item'](u['facade'])['handle'] && 0x1 != u['no_handle_forced']) {
                let y = 0x19
                  , z = (custom_settings['g_height'] && (y = custom_settings['g_height']),
                u['height'] -= y,
                u['handle_model_type'] = 'common',
                u['pY'] - l + u['height'] / units + y / units == k['height'] / units && (u['handle_model_type'] = 'model_tabletop'),
                0x2d0);
                -0x1 < location['href']['indexOf']('mfleko') && (z = 0x320),
                custom_settings['gola_bottom_height'] && (z = custom_settings['gola_bottom_height']),
                u['pY'] - l + u['height'] / units + y / units > z / units && !0x1 === g['params']['tabletop']['active'] && 0x1 != custom_settings['gola_tmp'] && (u['handle_active'] = !0x1,
                u['height'] += y);
            }
        } else
            0x1 === this['params']['gola'] && 0x1 != project_settings['handle'][g['params']['cabinet_group']]['no_handle'] && 0x0 != facades_lib['get_item'](u['facade'])['handle'] && (u['handle_model_type'] = 'top_module');
        u['index'] = m,
        u['cabinet'] = this;
        var q = new Locker_new(u);
        q['cabinet'] = this,
        q['userData']['cabinet'] = this,
        k['params']['lockers'][m]['info'] = {
            'width': q['params']['width'] - 0x2 * project_settings['door_offset'],
            'height': q['params']['height'] - 0x2 * project_settings['door_offset'],
            'material_code': materials_lib['get_item'](q['params']['material'])['code'],
            'facade_code': q['params']['facade_code'] || ''
        },
        k['obj_to_add']['add'](q),
        q['visible'] = u['active'];
    }
}
,
Cabinet_new['prototype']['build_cornice_common'] = function() {
    var f = this
      , g = this['cornice']
      , h = f['params']['cornice']
      , j = project_settings['selected_molded_model'] && 0x1 < h['level'];
    let k;
    if (j && (k = (k = molded_lib['items'][project_settings['selected_molded_model']]['height']) || 0x9),
    h['visible']['front']) {
        let m = 0x0;
        var l = {
            'model': h['model'],
            'width': f['const']['calculated_width'],
            'type': 'straight',
            'offset_type': 'front'
        };
        h['visible']['left'] && (l['width'] -= f['params']['cabinet']['thickness'],
        l['angle_left'] = Math['PI'] / 0x4,
        m += f['params']['cabinet']['thickness'] / units / 0x2),
        h['visible']['right'] && (l['width'] -= f['params']['cabinet']['thickness'],
        l['angle_right'] = -Math['PI'] / 0x4,
        m -= f['params']['cabinet']['thickness'] / units / 0x2),
        g['front'] = new Cornice(l),
        g['front']['position']['x'] = m,
        g['front']['position']['z'] = f['const']['calculated_depth'] / units / 0x2,
        g['add'](g['front']),
        j && (g['front_m'] = new Cornice({
            'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
            'width': f['const']['calculated_width'],
            'type': 'straight_lvl2'
        }),
        g['front_m']['position']['z'] = f['const']['calculated_depth'] / units / 0x2 + h['offset_front'] / units,
        g['front']['position']['y'] = k,
        g['add'](g['front_m']));
    }
    h['visible']['right'] && (g['right'] = new Cornice({
        'model': h['model'],
        'width': f['const']['calculated_depth'] + h['offset_front'],
        'type': 'straight',
        'offset_type': 'side',
        'angle_left': Math['PI'] / 0x4
    }),
    g['right']['rotation']['y'] = Math['PI'] / 0x2,
    g['right']['position']['set'](f['const']['calculated_width'] / 0x2 / units - f['params']['cabinet']['thickness'] / units, 0x0, h['offset_front'] / units / 0x2),
    j && (g['right_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['const']['calculated_depth'] + h['offset_front'],
        'type': 'straight_lvl2'
    }),
    g['right_m']['rotation']['y'] = Math['PI'] / 0x2,
    g['right_m']['position']['set'](f['const']['calculated_width'] / 0x2 / units, 0x0, h['offset_front'] / units / 0x2),
    g['right']['position']['y'] = k,
    g['add'](g['right_m'])),
    g['add'](g['right'])),
    h['visible']['left'] && (g['left'] = new Cornice({
        'model': h['model'],
        'width': f['const']['calculated_depth'],
        'type': 'straight',
        'offset_type': 'side',
        'angle_right': -Math['PI'] / 0x4
    }),
    g['left']['rotation']['y'] = -Math['PI'] / 0x2,
    g['left']['position']['set'](-f['const']['calculated_width'] / 0x2 / units + f['params']['cabinet']['thickness'] / units, 0x0, h['offset_front'] / units / 0x2),
    j && (g['left_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['const']['calculated_depth'] + h['offset_front'],
        'type': 'straight_lvl2'
    }),
    g['left_m']['rotation']['y'] = -Math['PI'] / 0x2,
    g['left_m']['position']['set'](-f['const']['calculated_width'] / 0x2 / units, 0x0, h['offset_front'] / units / 0x2),
    g['left']['position']['y'] = k,
    g['add'](g['left_m'])),
    g['add'](g['left']));
}
,
Cabinet_new['prototype']['build_sizes_common'] = function() {
    let e = -this['params']['cabinet']['depth'] / units / 0x2 + 0.4;
    0x2 == this['params']['version'] && (e -= this['params']['cabinet']['offset']['back'] / units),
    this['size_width'] = new Sizes_obj({
        'width': this['params']['cabinet']['width'] / units,
        'text': this['params']['cabinet']['width'],
        'font_size': 0x32
    }),
    this['size_width']['position']['set'](0x0, this['const']['calculated_height'] / units, e),
    this['sizes']['add'](this['size_width']),
    this['size_height'] = new Sizes_obj({
        'width': this['const']['calculated_height'] / units,
        'text': this['const']['calculated_height'],
        'font_size': 0x32
    }),
    this['size_height']['position']['set'](-this['params']['cabinet']['width'] / units / 0x2, this['const']['calculated_height'] / units / 0x2, e),
    this['size_height']['rotation']['z'] = Math['PI'] / 0x2,
    this['sizes']['add'](this['size_height']),
    'edges' === global_options['mode'] && (this['size_depth'] = new Sizes_obj({
        'width': this['params']['cabinet']['depth'] / units,
        'text': this['params']['cabinet']['depth'],
        'font_size': 0x32
    }),
    this['size_depth']['position']['set'](this['params']['cabinet']['width'] / units / 0x2 + 0.4, this['const']['calculated_height'] / units + 0.4, 0x0),
    this['size_depth']['rotation']['z'] = Math['PI'] / 0x2,
    this['size_depth']['rotation']['x'] = -Math['PI'] / 0x2,
    this['sizes']['add'](this['size_depth']));
}
,
Cabinet_new['prototype']['build_positions_common'] = function() {
    constructor_settings['core_v2'] || this['cabinet']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['params']['cokol']['height'] / units, -this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['tabletop']['offset']['front'] / units / 0x2),
    constructor_settings['core_v2'] || this['cokol']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['cokol']['position']['y'], -this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['tabletop']['offset']['front'] / units / 0x2),
    this['sections']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['params']['cokol']['height'] / units, -this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['tabletop']['offset']['front'] / units / 0x2),
    this['walls']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['params']['cokol']['height'] / units, -this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['tabletop']['offset']['front'] / units / 0x2),
    this['lockers']['position']['z'] = -this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['tabletop']['offset']['front'] / units / 0x2,
    this['sizes']['position']['z'] = this['params']['cabinet']['back_wall_offset'] / units / 0x2,
    this['models']['position']['z'] = -this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['tabletop']['offset']['front'] / units / 0x2,
    this['doors']['position']['z'] = -this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['tabletop']['offset']['front'] / units / 0x2,
    this['shelves']['position']['z'] = -this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['tabletop']['offset']['front'] / units / 0x2,
    this['cornice']['position']['y'] = this['cabinet']['position']['y'] + this['params']['cabinet']['height'] / units;
}
,
Cabinet_new['prototype']['build_false_facade'] = function() {
    var f = this
      , g = f['cabinet']
      , h = f['const']['calculated_width'] / units
      , j = f['params']['cabinet']['height'] / units
      , k = f['const']['calculated_depth'] / units
      , l = f['params']['cabinet']['thickness'] / units;
    g['back_wall'] = Object_wall({
        'width': h,
        'height': j,
        'thickness': l,
        'pX': 0x0,
        'pY': j / 0x2,
        'pZ': -k / 0x2 + l / 0x2,
        'name': 'back_cab_wall',
        'material': f['params']['cabinet']['material']
    }),
    g['front_wall'] = Object_wall({
        'width': h,
        'height': j,
        'thickness': l,
        'pX': 0x0,
        'pY': j / 0x2,
        'pZ': k / 0x2 - l / 0x2,
        'name': 'front_wall',
        'material': f['params']['cabinet']['material']
    }),
    g['top_wall'] = Object_wall({
        'width': h,
        'height': k - 0x2 * l,
        'thickness': l,
        'rX': Math['PI'] / 0x2,
        'pX': 0x0,
        'pY': j - l / 0x2,
        'pZ': 0x0,
        'name': 'top_wall',
        'material': f['params']['cabinet']['material']
    }),
    g['bottom_wall'] = Object_wall({
        'width': h,
        'height': k - 0x2 * l,
        'thickness': l,
        'rX': Math['PI'] / 0x2,
        'pX': 0x0,
        'pY': l / 0x2,
        'pZ': 0x0,
        'name': 'bottom_wall',
        'material': f['params']['cabinet']['material']
    }),
    0x1 == this['params']['cabinet']['left_wall'] && g['add'](g['front_wall']),
    0x1 == this['params']['cabinet']['right_wall'] && g['add'](g['back_wall']),
    0x1 == this['params']['cabinet']['top_wall'] && g['add'](g['top_wall']),
    0x1 == this['params']['cabinet']['bottom_wall'] && g['add'](g['bottom_wall']);
}
,
Cabinet_new['prototype']['build_false_facade_tabletop'] = function() {}
,
Cabinet_new['prototype']['build_tabletop_false_facade_tabletop'] = function(f) {
    var g = this, h = new Tabletop({
        'width': g['params']['cabinet']['depth'],
        'height': g['params']['cabinet']['height'] + g['params']['cokol']['height'] + g['params']['tabletop']['height'],
        'depth': f,
        'holes': g['params']['tabletop']['holes'],
        'material': g['params']['tabletop']['material']
    }), h;
    h['userData']['need_delete'] = !0x0,
    g['tabletop']['add'](h),
    h['rotation']['y'] = Math['PI'] / 0x2,
    0x0 != this['params']['tabletop']['plints']['back'] && (h = new Decoration({
        'width': f,
        'height': 0x1e,
        'thickness': 0x14,
        'material': g['params']['tabletop']['material'],
        'model': '/common_assets/models/tp1.fbx'
    }),
    g['tabletop']['add'](h),
    h['position']['y'] = 0x1e / units / 0x2,
    h['position']['z'] = -g['params']['cabinet']['depth'] / units / 0x2 + 0x14 / units / 0x2);
}
,
Cabinet_new['prototype']['build_positions_false_facade_tabletop'] = function() {}
,
Cabinet_new['prototype']['build_sizes_false_facade_tabletop'] = function() {
    this['size_width'] = new Sizes_obj({
        'width': project_settings['tabletop_thickness'] / units,
        'text': project_settings['tabletop_thickness'],
        'font_size': 0x32
    }),
    this['size_width']['position']['set'](0x0, this['const']['calculated_height'] / units, -this['params']['cabinet']['depth'] / units / 0x2 + 0.4),
    this['sizes']['add'](this['size_width']),
    this['size_height'] = new Sizes_obj({
        'width': this['const']['calculated_height'] / units + this['params']['tabletop']['height'] / units,
        'text': this['const']['calculated_height'] + this['params']['tabletop']['height'],
        'font_size': 0x32
    }),
    this['size_height']['position']['set'](-project_settings['tabletop_thickness'] / units / 0x2, this['const']['calculated_height'] / units / 0x2 + this['params']['tabletop']['height'] / units / 0x2, -this['params']['cabinet']['depth'] / units / 0x2 + 0.4),
    this['size_height']['rotation']['z'] = Math['PI'] / 0x2,
    this['sizes']['add'](this['size_height']);
}
,
Cabinet_new['prototype']['build_false_facade_facade'] = function() {}
,
Cabinet_new['prototype']['build_tabletop_false_facade_facade'] = function() {
    var f = this, g, h, j, k, l, m, p, q, h;
    !0x1 !== this['params']['tabletop']['active'] && (h = f['params']['tabletop']['offset']['left'],
    j = f['params']['tabletop']['offset']['right'],
    k = f['params']['tabletop']['offset']['front'],
    l = f['params']['tabletop']['offset']['back'],
    m = f['params']['tabletop']['height'],
    p = 0x12,
    q = f['const']['calculated_depth'],
    h = new Tabletop({
        'width': 0x12 + h + j,
        'height': m,
        'depth': q + l + k,
        'holes': f['params']['tabletop']['holes'],
        'material': f['params']['tabletop']['material']
    }),
    f['tabletop']['add'](h));
}
,
Cabinet_new['prototype']['build_cokol_false_facade_facade'] = function() {}
,
Cabinet_new['prototype']['build_positions_false_facade_facade'] = function() {
    if (0x2 == this['params']['version']) {
        let e = -this['params']['tabletop']['depth'] / units / 0x2 + this['params']['cabinet']['depth'] / units / 0x2 + this['params']['cabinet']['offset']['back'] / units;
        'top' != this['params']['cabinet_group'] && this['params']['tabletop']['active'] || (e = this['params']['cabinet']['offset']['back'] / units),
        this['cabinet']['position']['set'](0x0, this['params']['cokol']['height'] / units, e),
        this['cokol']['position']['set'](0x0, this['cokol']['position']['y'], e),
        this['doors']['position']['set'](0x0, this['params']['cokol']['height'] / units, e);
    } else
        this['cabinet']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['params']['cokol']['height'] / units, 0x0),
        this['doors']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['params']['cokol']['height'] / units, this['params']['cabinet']['depth'] / units / 0x2 - this['params']['tabletop']['offset']['front'] / units - this['const']['calculated_depth'] / units / 0x2 - this['params']['cabinet']['back_wall_offset'] / units / 0x2),
        this['cokol']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['cokol']['position']['y'], 0x0);
}
,
Cabinet_new['prototype']['build_sizes_false_facade_facade'] = function() {
    this['size_width'] = new Sizes_obj({
        'width': this['params']['cabinet']['width'] / units,
        'text': this['params']['cabinet']['width'],
        'font_size': 0x32
    }),
    this['size_width']['position']['set'](0x0, this['const']['calculated_height'] / units, -this['params']['cabinet']['depth'] / units / 0x2 + 0.94),
    this['sizes']['add'](this['size_width']),
    this['size_height'] = new Sizes_obj({
        'width': this['const']['calculated_height'] / units,
        'text': this['const']['calculated_height'],
        'font_size': 0x32
    }),
    this['size_height']['position']['set'](-this['params']['cabinet']['width'] / units / 0x2, this['const']['calculated_height'] / units / 0x2, -this['params']['cabinet']['depth'] / units / 0x2 + 0.94),
    this['size_height']['rotation']['z'] = Math['PI'] / 0x2,
    this['sizes']['add'](this['size_height']);
}
),
(Cabinet_new['prototype']['build_corner_straight'] = function() {
    var f = this
      , g = f['cabinet']
      , j = f['const']['calculated_width'] / units
      , k = f['params']['cabinet']['height'] / units
      , m = f['const']['calculated_depth'] / units
      , q = f['params']['cabinet']['thickness_back'] / units
      , u = f['params']['cabinet']['back_wall_offset'] / units
      , v = f['params']['cabinet']['thickness'] / units
      , w = f['params']['cabinet']['material']
      , x = f['params']['cabinet']['corner_straight_front_wall_width'] / units
      , y = f['params']['cabinet']['orientation']
      , z = (g['back_wall'] = new Object_wall({
        'width': j,
        'height': k,
        'thickness': q,
        'pX': 0x0,
        'pY': k / 0x2,
        'pZ': -m / 0x2 - q / 0x2 + 0.4,
        'material': f['params']['cabinet']['back_wall_material']['id'],
        'name': 'back_wall'
    }),
    g['left_wall'] = new Object_wall({
        'width': m,
        'height': k,
        'thickness': v,
        'rY': Math['PI'] / 0x2,
        'pX': -j / 0x2 + v / 0x2,
        'pY': k / 0x2,
        'pZ': 0x0,
        'material': w,
        'name': 'left_wall'
    }),
    g['right_wall'] = new Object_wall({
        'width': m,
        'height': k,
        'thickness': v,
        'rY': Math['PI'] / 0x2,
        'pX': j / 0x2 - v / 0x2,
        'pY': k / 0x2,
        'pZ': 0x0,
        'material': w,
        'name': 'right_wall'
    }),
    0x0)
      , q = f['params']['cabinet']['tsarg_width'] / units;
    let A = m
      , B = 0x0;
    if ((0x1 === this['params']['gola'] && this['params']['doors']['length'] && 0x1 != project_settings['handle'][f['params']['cabinet_group']]['no_handle'] || 0x1 === this['params']['gola'] && this['params']['lockers']['length'] && 0x1 != project_settings['handle'][f['params']['cabinet_group']]['no_handle']) && ('bottom' === f['params']['cabinet_group'] ? this['params']['cabinet']['height'] : (A = m - project_settings['handle'][f['params']['cabinet_group']]['model']['sizes_tabletop']['depth'] / units + 0.8,
    B = -project_settings['handle'][f['params']['cabinet_group']]['model']['sizes_tabletop']['depth'] / units / 0x2 + 0.4)),
    'bottom' == f['params']['cabinet_group'] && f['params']['cabinet']['height'] < 0x578 ? (g['top_wall'] = Object_wall({
        'width': j - 0x2 * v,
        'height': q,
        'thickness': v,
        'rX': Math['PI'] / 0x2,
        'pX': 0x0,
        'pY': k - v / 0x2,
        'pZ': -m / 0x2 + q / 0x2,
        'name': 'top_wall',
        'material': f['params']['cabinet']['material']
    }),
    g['top_wall_2'] = Object_wall({
        'width': j - 0x2 * v,
        'height': q,
        'thickness': v,
        'rX': Math['PI'] / 0x2,
        'pX': 0x0,
        'pY': k - v / 0x2,
        'pZ': m / 0x2 - q / 0x2,
        'name': 'top_wall',
        'material': f['params']['cabinet']['material']
    }),
    (0x1 === this['params']['gola'] && this['params']['doors']['length'] && 0x1 != project_settings['handle'][f['params']['cabinet_group']]['no_handle'] || 0x1 === this['params']['gola'] && this['params']['lockers']['length'] && 0x1 != project_settings['handle'][f['params']['cabinet_group']]['no_handle']) && this['params']['cabinet']['height'] < 0x384 && (g['top_wall_2']['position']['z'] = m / 0x2 - q / 0x2 - 0x3)) : g['top_wall'] = Object_wall({
        'width': j - 0x2 * v,
        'height': m,
        'thickness': v,
        'rX': Math['PI'] / 0x2,
        'pX': 0x0,
        'pY': k - v / 0x2,
        'pZ': 0x0,
        'name': 'top_wall',
        'material': f['params']['cabinet']['material']
    }),
    g['bottom_wall'] = new Object_wall({
        'width': j - 0x2 * v,
        'height': A,
        'thickness': v,
        'rX': Math['PI'] / 0x2,
        'pX': 0x0,
        'pY': v / 0x2,
        'pZ': B,
        'material': w,
        'name': 'bottom_wall'
    }),
    g['add'](g['back_wall']),
    g['add'](g['left_wall']),
    g['add'](g['right_wall']),
    g['add'](g['top_wall']),
    g['add'](g['bottom_wall']),
    g['top_wall_2'] && 0x1 == this['params']['cabinet']['top_wall'] && g['add'](g['top_wall_2']),
    f['params']['cabinet']['corner_straight_front_wall_active']) {
        if ('facade' != f['params']['corner_straight_front_wall_active'] || 'facade_simple' != f['params']['corner_straight_front_wall_active']) {
            for (let C = f['params']['doors']['length']; C--; )
                'left_wall' == f['params']['doors'][C]['tag'] && (f['params']['doors']['splice'](C, 0x1),
                f['doors']['remove'](f['doors']['children'][C]));
        }
        var q = 'left' === y ? j / 0x2 - x / 0x2 : -j / 0x2 + x / 0x2;
        'facade_simple' === f['params']['cabinet']['corner_straight_front_wall_active'] ? f['params']['doors']['push']({
            'type': 'falsefacade',
            'allow_z': 0x1,
            'allow_x': 0x1,
            'fixed_facade_model': '/common_assets/models/plastic_full.fbx',
            'style': 'full',
            'tag': 'left_wall',
            'width': x * units,
            'height': k * units,
            'thickness': v * units,
            'pX': q - x / 0x2,
            'pY': k / 0x2,
            'pZ': m / 0x2
        }) : (0x2 == this['params']['version'] && (q = 'left' === y ? this['params']['cabinet']['width'] / 0x2 / units - x / 0x2 : -this['params']['cabinet']['width'] / 0x2 / units + x / 0x2),
        g['left_front_wall'] = new Object_wall({
            'width': x,
            'height': k,
            'thickness': v,
            'pX': q,
            'pY': k / 0x2,
            'pZ': m / 0x2 + v / 0x2,
            'material': w,
            'name': 'front_left_wall'
        }),
        g['add'](g['left_front_wall']));
    }
    if (0x2 == this['params']['version']) {
        let D = f['params']['cabinet']['corner_straight_side_connect_width'] / units;
        var j = f['params']['cabinet']['corner_straight_side_connect_width'] / units;
        let E = m / 0x2 + v + f['params']['cabinet']['corner_straight_side_connect_width'] / units / 0x2;
        f['params']['cabinet']['corner_straight_front_wall_active'] || (D += f['params']['cabinet']['thickness'] / units,
        E -= f['params']['cabinet']['thickness'] / units / 0x2),
        'left' === y ? (this['params']['doors']['push']({
            'width': f['params']['cabinet']['corner_straight_front_facade_width'],
            'type': 'falsefacade',
            'is_auto': 0x1,
            'allow_x': 0x1,
            'pX': this['params']['cabinet']['width'] / 0x2 / units - x - f['params']['cabinet']['corner_straight_front_facade_width'] / units
        }),
        f['params']['cabinet']['corner_straight_side_facade_active'] && this['params']['doors']['push']({
            'width': f['params']['cabinet']['corner_straight_side_connect_width'],
            'type': 'falsefacade',
            'is_auto': 0x1,
            'allow_x': 0x1,
            'allow_z': 0x1,
            'allow_ry': 0x1,
            'rY': -Math['PI'] / 0x2,
            'pX': this['params']['cabinet']['width'] / 0x2 / units - f['params']['cabinet']['corner_straight_side_facade_position'] / units,
            'pZ': this['params']['cabinet']['depth'] / units / 0x2 + f['params']['cabinet']['thickness'] / units
        }),
        f['params']['cabinet']['corner_straight_side_back_wall_active'] && (g['connect_wall'] = new Object_wall({
            'width': D,
            'height': k,
            'thickness': v,
            'pX': this['params']['cabinet']['width'] / 0x2 / units - f['params']['cabinet']['thickness'] / units / 0x2 - f['params']['cabinet']['corner_straight_side_back_wall_position'] / units,
            'pY': k / 0x2,
            'pZ': E,
            'rY': -Math['PI'] / 0x2,
            'material': w,
            'name': 'connect_wall'
        }),
        g['add'](g['connect_wall'])),
        f['params']['cabinet']['corner_straight_side_facade_wall_active'] && (g['connect_wall_facade'] = new Object_wall({
            'width': j,
            'height': k,
            'thickness': v,
            'pX': this['params']['cabinet']['width'] / 0x2 / units - f['params']['cabinet']['corner_straight_side_facade_position'] / units + f['params']['cabinet']['thickness'] / units / 0x2,
            'pY': k / 0x2,
            'pZ': m / 0x2 + v + f['params']['cabinet']['corner_straight_side_connect_width'] / units / 0x2,
            'rY': -Math['PI'] / 0x2,
            'material': w,
            'name': 'connect_wall_facade'
        }),
        g['add'](g['connect_wall_facade']))) : (this['params']['doors']['push']({
            'width': f['params']['cabinet']['corner_straight_front_facade_width'],
            'type': 'falsefacade',
            'is_auto': 0x1,
            'allow_x': 0x1,
            'pX': -this['params']['cabinet']['width'] / 0x2 / units + x
        }),
        f['params']['cabinet']['corner_straight_side_facade_active'] && this['params']['doors']['push']({
            'width': f['params']['cabinet']['corner_straight_side_connect_width'],
            'type': 'falsefacade',
            'is_auto': 0x1,
            'allow_x': 0x1,
            'allow_z': 0x1,
            'allow_ry': 0x1,
            'rY': Math['PI'] / 0x2,
            'pX': -this['params']['cabinet']['width'] / 0x2 / units + f['params']['cabinet']['corner_straight_side_facade_position'] / units,
            'pZ': this['params']['cabinet']['depth'] / units / 0x2 + f['params']['cabinet']['thickness'] / units + f['params']['cabinet']['corner_straight_side_connect_width'] / units
        }),
        f['params']['cabinet']['corner_straight_side_back_wall_active'] && (g['connect_wall'] = new Object_wall({
            'width': D,
            'height': k,
            'thickness': v,
            'pX': -this['params']['cabinet']['width'] / 0x2 / units + f['params']['cabinet']['thickness'] / units / 0x2 + f['params']['cabinet']['corner_straight_side_back_wall_position'] / units,
            'pY': k / 0x2,
            'pZ': E,
            'rY': -Math['PI'] / 0x2,
            'material': w,
            'name': 'connect_wall'
        }),
        g['add'](g['connect_wall'])),
        f['params']['cabinet']['corner_straight_side_facade_wall_active'] && (g['connect_wall_facade'] = new Object_wall({
            'width': j,
            'height': k,
            'thickness': v,
            'pX': -this['params']['cabinet']['width'] / 0x2 / units + f['params']['cabinet']['corner_straight_side_facade_position'] / units - f['params']['cabinet']['thickness'] / units / 0x2,
            'pY': k / 0x2,
            'pZ': m / 0x2 + v + f['params']['cabinet']['corner_straight_side_connect_width'] / units / 0x2,
            'rY': -Math['PI'] / 0x2,
            'material': w,
            'name': 'connect_wall_facade'
        }),
        g['add'](g['connect_wall_facade'])));
    }
}
,
Cabinet_new['prototype']['build_cokol_corner_straight'] = function() {
    if (!(this['params']['cokol']['height'] < 0x1)) {
        var f = this, g = f['cokol'], j = f['const']['calculated_width'] / units, k = f['const']['calculated_depth'] / units, m = f['params']['cokol']['height'] / units, q = f['params']['cokol']['thickness'] / units, u, v = j - f['params']['cabinet']['corner_straight_front_wall_width'] / units + 0x4, w = f['params']['cokol']['material'], x;
        if (f['params']['cabinet']['width'] < 0xfa && 0x0 != f['params']['cokol']['legs'] ? (x = new CabinetLeg({
            'height': f['params']['cokol']['height'],
            'is_cokol_active': f['params']['cokol']['is_cokol_active']
        }),
        g['add'](x),
        x['position']['x'] = 0x0,
        x['position']['z'] = -k / 0x2 + x['params']['radius2'] / units / 0x2 + 0x2 * q,
        x = new CabinetLeg({
            'height': f['params']['cokol']['height'],
            'is_cokol_active': f['params']['cokol']['is_cokol_active']
        }),
        g['add'](x),
        x['position']['x'] = 0x0,
        x['position']['z'] = k / 0x2 - x['params']['radius2'] / units / 0x2 - 0x3 * q) : 0x0 != f['params']['cokol']['legs'] && (x = new CabinetLeg({
            'height': f['params']['cokol']['height'],
            'is_cokol_active': f['params']['cokol']['is_cokol_active']
        }),
        g['add'](x),
        x['position']['x'] = -j / 0x2 + x['params']['radius2'] / units / 0x2 + 0x2 * q,
        x['position']['z'] = -k / 0x2 + x['params']['radius2'] / units / 0x2 + 0x2 * q,
        x = new CabinetLeg({
            'height': f['params']['cokol']['height'],
            'is_cokol_active': f['params']['cokol']['is_cokol_active']
        }),
        g['add'](x),
        x['position']['x'] = j / 0x2 - x['params']['radius2'] / units / 0x2 - 0x2 * q,
        x['position']['z'] = -k / 0x2 + x['params']['radius2'] / units / 0x2 + 0x2 * q,
        x = new CabinetLeg({
            'height': f['params']['cokol']['height'],
            'is_cokol_active': f['params']['cokol']['is_cokol_active']
        }),
        g['add'](x),
        x['position']['x'] = -j / 0x2 + x['params']['radius2'] / units / 0x2 + 0x2 * q,
        x['position']['z'] = k / 0x2 - x['params']['radius2'] / units / 0x2 - 0x3 * q,
        x = new CabinetLeg({
            'height': f['params']['cokol']['height'],
            'is_cokol_active': f['params']['cokol']['is_cokol_active']
        }),
        g['add'](x),
        x['position']['x'] = j / 0x2 - x['params']['radius2'] / units / 0x2 - 0x2 * q,
        x['position']['z'] = k / 0x2 - x['params']['radius2'] / units / 0x2 - 0x3 * q),
        'right' === f['params']['cabinet']['orientation']) {
            let y = v * units
              , z = j / 0x2 - v / 0x2
              , A = 0x5 * units
              , B = j / 0x2 - v + q / 0x2
              , C = k / 0x2 + 0x1;
            0x2 == this['params']['version'] && (y = this['params']['cabinet']['width'] - this['params']['cabinet']['corner_straight_side_facade_position'] + f['params']['cokol']['thickness'] + f['params']['cokol']['thickness'] / 0x2,
            z = j / 0x2 - y / units / 0x2,
            A = this['params']['cabinet']['corner_straight_side_connect_width'] + this['params']['cabinet']['thickness'] + f['params']['cokol']['thickness'] / 0x2,
            B = -this['params']['cabinet']['width'] / units / 0x2 + this['params']['cabinet']['corner_straight_side_facade_position'] / units - this['params']['cokol']['thickness'] / units,
            C = this['params']['cabinet']['depth'] / units / 0x2 + A / units / 0x2 - f['params']['cokol']['thickness'] / units / 0x2),
            g['front'] = new CabinetCokol({
                'width': y,
                'height': m * units,
                'thickness': q * units,
                'pX': z,
                'pZ': k / 0x2 - q,
                'pY': m / 0x2,
                'material': w,
                'name': 'cokol_front'
            }),
            g['right'] = new CabinetCokol({
                'width': k * units - q * units - q * units / 0x3,
                'height': m * units,
                'thickness': q * units,
                'rY': Math['PI'] / 0x2,
                'pY': m / 0x2,
                'pX': j / 0x2 - q / 0x2,
                'pZ': q / 0x3 / 0x2 - q,
                'material': w,
                'name': 'cokol_left'
            }),
            g['cr_left'] = new CabinetCokol({
                'width': A,
                'height': m * units,
                'thickness': q * units,
                'rY': -Math['PI'] / 0x2,
                'pY': m / 0x2,
                'pX': B,
                'pZ': C,
                'material': w,
                'name': 'cokol_cr_left'
            }),
            g['left'] = new CabinetCokol({
                'width': f['params']['cabinet']['depth'] - f['params']['tabletop']['offset']['front'],
                'height': m * units,
                'thickness': q * units,
                'rY': Math['PI'] / 0x2,
                'pY': m / 0x2,
                'pX': -j / 0x2 + q / 0x2,
                'pZ': f['params']['tabletop']['offset']['back'] / units / 0x2,
                'material': w,
                'name': 'cokol_left'
            }),
            g['left']['visible'] = f['params']['cokol']['visible']['left'],
            g['cr_left']['visible'] = f['params']['cokol']['visible']['front'],
            g['right']['visible'] = f['params']['cokol']['visible']['right'],
            g['front']['visible'] = f['params']['cokol']['visible']['front'],
            g['add'](g['front']),
            g['add'](g['left']),
            g['add'](g['cr_left']);
        } else {
            let D = v * units
              , E = -j / 0x2 + v / 0x2
              , F = 0x5 * units
              , G = -j / 0x2 + v - q / 0x2
              , H = k / 0x2 + 0x1;
            0x2 == this['params']['version'] && (D = this['params']['cabinet']['width'] - this['params']['cabinet']['corner_straight_side_facade_position'] + f['params']['cokol']['thickness'] + f['params']['cokol']['thickness'] / 0x2,
            E = -j / 0x2 + D / units / 0x2,
            F = this['params']['cabinet']['corner_straight_side_connect_width'] + this['params']['cabinet']['thickness'] + f['params']['cokol']['thickness'] / 0x2,
            G = this['params']['cabinet']['width'] / units / 0x2 - this['params']['cabinet']['corner_straight_side_facade_position'] / units + this['params']['cokol']['thickness'] / units,
            H = this['params']['cabinet']['depth'] / units / 0x2 + F / units / 0x2 - f['params']['cokol']['thickness'] / units / 0x2),
            g['front'] = new CabinetCokol({
                'width': D,
                'height': m * units,
                'thickness': q * units,
                'pX': E,
                'pZ': k / 0x2 - q,
                'pY': m / 0x2,
                'material': w,
                'name': 'cokol_front'
            }),
            g['left'] = new CabinetCokol({
                'width': k * units - q * units - q * units / 0x3,
                'height': m * units,
                'thickness': q * units,
                'rY': Math['PI'] / 0x2,
                'pY': m / 0x2,
                'pX': -j / 0x2 + q / 0x2,
                'pZ': q / 0x3 / 0x2 - q,
                'material': w,
                'name': 'cokol_left'
            }),
            g['cr_right'] = new CabinetCokol({
                'width': F,
                'height': m * units,
                'thickness': q * units,
                'rY': -Math['PI'] / 0x2,
                'pY': m / 0x2,
                'pX': G,
                'pZ': H,
                'material': w,
                'name': 'cokol_left'
            }),
            g['right'] = new CabinetCokol({
                'width': f['params']['cabinet']['depth'] - f['params']['tabletop']['offset']['front'],
                'height': m * units,
                'thickness': q * units,
                'rY': Math['PI'] / 0x2,
                'pY': m / 0x2,
                'pX': j / 0x2 - q / 0x2,
                'pZ': f['params']['tabletop']['offset']['back'] / units / 0x2,
                'material': w,
                'name': 'cokol_right'
            }),
            g['left']['visible'] = f['params']['cokol']['visible']['left'],
            g['right']['visible'] = f['params']['cokol']['visible']['right'],
            g['front']['visible'] = f['params']['cokol']['visible']['front'],
            g['cr_right']['visible'] = f['params']['cokol']['visible']['front'],
            g['add'](g['front']),
            g['add'](g['left']),
            g['add'](g['cr_right']);
        }
        g['add'](g['right']),
        g['back'] = new CabinetCokol({
            'width': j * units,
            'height': m * units,
            'thickness': q * units,
            'pX': 0x0,
            'pZ': -k / 0x2 + q,
            'pY': m / 0x2,
            'material': w,
            'name': 'cokol_back'
        }),
        g['back']['visible'] = f['params']['cokol']['visible']['back'],
        g['add'](g['back']);
    }
}
,
Cabinet_new['prototype']['build_tabletop_corner_straight'] = function() {
    var f = this, g, h, j, k, l, l, l, l, g, l, g, l;
    0x2 == this['params']['version'] ? (g = f['params']['tabletop']['height'],
    h = f['params']['cabinet']['width'] + f['params']['cabinet']['offset']['side'],
    j = f['params']['cabinet']['depth'] + f['params']['cabinet']['offset']['back'] + f['params']['cabinet']['corner_straight_side_connect_width'] + f['params']['cabinet']['thickness'],
    k = f['params']['tabletop']['depth'],
    l = f['params']['tabletop']['depth'],
    l = build_shape['corner_90'](h / units, j / units, k / units, l / units),
    l = new Tabletop({
        'width': h,
        'height': g,
        'depth': k,
        'holes': f['params']['tabletop']['holes'],
        'material': f['params']['tabletop']['material'],
        'id': void 0x0 !== f['params']['tabletop']['tabletop_id'] ? f['params']['tabletop']['tabletop_id'] : 0x0,
        'variant': void 0x0 !== f['params']['tabletop']['tabletop_variant'] ? f['params']['tabletop']['tabletop_variant'] : 0x0,
        'shape': l
    }),
    f['tabletop']['add'](l),
    'right' == this['params']['cabinet']['orientation'] && (l['rotation']['z'] = Math['PI'],
    l['position']['y'] = -g / units),
    0x0 != this['params']['tabletop']['plints']['back'] && (l = new Decoration({
        'width': h,
        'height': 0x1e,
        'thickness': 0x14,
        'material': f['params']['tabletop']['material'],
        'model': '/common_assets/models/tp1.fbx'
    }),
    f['tabletop']['add'](l),
    l['position']['y'] = 0x1e / units / 0x2,
    l['position']['z'] = -j / units / 0x2 + 0x14 / units / 0x2),
    'right' == this['params']['cabinet']['orientation'] ? (0x0 != this['params']['tabletop']['plints']['right'] && (g = new Decoration({
        'width': k,
        'height': 0x1e,
        'thickness': 0x14,
        'material': f['params']['tabletop']['material'],
        'model': '/common_assets/models/tp1.fbx'
    }),
    f['tabletop']['add'](g),
    g['rotation']['y'] = -Math['PI'] / 0x2,
    g['position']['y'] = 0x1e / units / 0x2,
    g['position']['x'] = h / units / 0x2 - 0x14 / units / 0x2,
    g['position']['z'] = -j / units / 0x2 + k / units / 0x2),
    0x0 != this['params']['tabletop']['plints']['left'] && (l = new Decoration({
        'width': j,
        'height': 0x1e,
        'thickness': 0x14,
        'material': f['params']['tabletop']['material'],
        'model': '/common_assets/models/tp1.fbx'
    }),
    f['tabletop']['add'](l),
    l['rotation']['y'] = +Math['PI'] / 0x2,
    l['position']['y'] = 0x1e / units / 0x2,
    l['position']['x'] = -h / units / 0x2 + 0x14 / units / 0x2)) : (0x0 != this['params']['tabletop']['plints']['left'] && (g = new Decoration({
        'width': k,
        'height': 0x1e,
        'thickness': 0x14,
        'material': f['params']['tabletop']['material'],
        'model': '/common_assets/models/tp1.fbx'
    }),
    f['tabletop']['add'](g),
    g['rotation']['y'] = Math['PI'] / 0x2,
    g['position']['y'] = 0x1e / units / 0x2,
    g['position']['x'] = -h / units / 0x2 + 0x14 / units / 0x2,
    g['position']['z'] = -j / units / 0x2 + k / units / 0x2),
    0x0 != this['params']['tabletop']['plints']['right'] && (l = new Decoration({
        'width': j,
        'height': 0x1e,
        'thickness': 0x14,
        'material': f['params']['tabletop']['material'],
        'model': '/common_assets/models/tp1.fbx'
    }),
    f['tabletop']['add'](l),
    l['rotation']['y'] = -Math['PI'] / 0x2,
    l['position']['y'] = 0x1e / units / 0x2,
    l['position']['x'] = h / units / 0x2 - 0x14 / units / 0x2))) : this['build_tabletop_common']();
}
,
Cabinet_new['prototype']['build_sections_corner_straight'] = function(f={}) {
    var g = this
      , h = new THREE['Box3']()['setFromObject'](this['cabinet'])['getSize'](new THREE['Vector3']())
      , j = (this['reset_model'](this['sections']),
    {
        'name': 'Секция',
        'width': '100%',
        'height': '100%',
        'starting_point_x': '0%',
        'starting_point_y': '0%',
        'direction_x': 'right',
        'direction_y': 'top',
        'offset_top': 0x0,
        'offset_bottom': 0x0,
        'position_offset_top': 0x0,
        'position_offset_bottom': 0x0,
        'group': g['params']['cabinet_group'],
        'pX': 0x0,
        'pY': 0x0,
        'pZ': 0x0,
        'rX': 0x0,
        'rY': 0x0,
        'rZ': 0x0
    });
    for (let p = 0x0; p < g['params']['sections']['length']; p++) {
        var k = g['params']['sections'][p], k, l = k = Object['assign']({}, j, k), m = ('string' == typeof l['offset_top'] && -0x1 < l['offset_top']['indexOf']('%') && (l['offset_top'] = g['params']['cabinet']['height'] * parseFloat(l['offset_top']) / 0x64),
        'string' == typeof l['offset_bottom'] && -0x1 < l['offset_bottom']['indexOf']('%') && (l['offset_bottom'] = g['params']['cabinet']['height'] * parseFloat(l['offset_bottom']) / 0x64),
        'string' == typeof l['width'] && -0x1 < l['width']['indexOf']('%') && (l['width'] = g['const']['calculated_width'] * parseFloat(l['width']) / 0x64),
        'string' == typeof l['height'] && -0x1 < l['height']['indexOf']('%') && (l['height'] = (g['params']['cabinet']['height'] - l['offset_top'] - l['offset_bottom']) * parseFloat(l['height']) / 0x64),
        'string' == typeof l['starting_point_x'] && -0x1 < l['starting_point_x']['indexOf']('%') ? 'center' === l['starting_point_x'] ? l['pX'] = 0x0 : 'right' === l['direction_x'] ? l['pX'] = g['const']['calculated_width'] * parseFloat(l['starting_point_x']) / 0x64 / units : l['pX'] = g['const']['calculated_width'] * parseFloat(l['starting_point_x']) / 0x64 / units - l['width'] / units : (l['direction_x'],
        l['pX'] = l['starting_point_x'] / units),
        'string' == typeof l['starting_point_y'] && -0x1 < l['starting_point_y']['indexOf']('%') ? 'center' === l['starting_point_y'] ? l['pY'] = 0x0 + h['y'] / 0x2 - l['height'] / units / 0x2 : 'top' === l['direction_y'] ? l['pY'] = 0x0 + g['params']['cabinet']['height'] * parseFloat(l['starting_point_y']) / 0x64 / units - l['position_offset_top'] / units + l['position_offset_bottom'] / units : l['pY'] = 0x0 + g['params']['cabinet']['height'] * parseFloat(l['starting_point_y']) / 0x64 / units - l['height'] / units - l['position_offset_top'] / units + l['position_offset_bottom'] / units : l['pY'] = 0x0 + l['starting_point_y'] / units - l['position_offset_top'] / units + l['position_offset_bottom'] / units,
        new THREE['Group']());
        m['temp_type'] = 'Section',
        this['sections']['add'](m),
        m['userData']['index'] = p,
        m['position']['set'](l['pX'], l['pY'], l['pZ']),
        k['lockers'] && (m['lockers'] = new THREE['Group'](),
        m['lockers']['name'] = 'section_lockers',
        m['add'](m['lockers']),
        g['build_lockers_common']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['lockers'],
            'params': k
        })),
        k['doors'] && (m['doors'] = new THREE['Group'](),
        m['doors']['name'] = 'section_doors',
        m['add'](m['doors']),
        g['build_doors_all']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['doors'],
            'params': k
        })),
        k['walls'] && (m['walls'] = new THREE['Group'](),
        m['walls']['name'] = 'section_walls',
        m['add'](m['walls']),
        g['build_walls_common']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['walls'],
            'params': k
        })),
        !k['shelves'] && 0x1 != k['shelves_auto'] || (m['shelves'] = new THREE['Group'](),
        m['shelves']['name'] = 'section_shelves',
        m['add'](m['shelves']),
        g['build_shelves_common']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['shelves'],
            'params': k
        }));
    }
}
,
Cabinet_new['prototype']['build_cornice_corner_straight'] = function() {
    var f = this
      , g = this['cornice']
      , h = f['params']['cornice']
      , j = project_settings['selected_molded_model'] && 0x1 < h['level'];
    let k;
    if (j && (k = (k = molded_lib['items'][project_settings['selected_molded_model']]['height']) || 0x9),
    h['visible']['front']) {
        let m = 0x0;
        var l = {
            'model': h['model'],
            'width': f['const']['calculated_width'] - f['params']['cabinet']['corner_straight_front_wall_width'],
            'type': 'straight',
            'offset_type': 'front'
        };
        'left' === f['params']['cabinet']['orientation'] ? h['visible']['left'] && (l['width'] -= f['params']['cabinet']['thickness'],
        l['angle_left'] = Math['PI'] / 0x4,
        m += f['params']['cabinet']['thickness'] / units / 0x2) : h['visible']['right'] && (l['width'] -= f['params']['cabinet']['thickness'],
        l['angle_right'] = -Math['PI'] / 0x4,
        m += f['params']['cabinet']['thickness'] / units / 0x2),
        g['front'] = new Cornice(l),
        'left' === f['params']['cabinet']['orientation'] ? g['front']['position']['x'] = -f['const']['calculated_width'] / units / 0x2 + (f['const']['calculated_width'] - f['params']['cabinet']['corner_straight_front_wall_width']) / units / 0x2 + m : g['front']['position']['x'] = f['const']['calculated_width'] / units / 0x2 - (f['const']['calculated_width'] - f['params']['cabinet']['corner_straight_front_wall_width']) / units / 0x2 - m,
        g['front']['position']['z'] = f['const']['calculated_depth'] / units / 0x2 - f['params']['cabinet']['thickness'] / units / 0x2,
        g['add'](g['front']),
        j && (g['front_m'] = new Cornice({
            'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
            'width': f['const']['calculated_width'] - f['params']['cabinet']['corner_straight_front_wall_width'],
            'type': 'straight_lvl2'
        }),
        'left' === f['params']['cabinet']['orientation'] ? g['front_m']['position']['x'] = -f['const']['calculated_width'] / units / 0x2 + (f['const']['calculated_width'] - f['params']['cabinet']['corner_straight_front_wall_width']) / units / 0x2 : g['front_m']['position']['x'] = f['const']['calculated_width'] / units / 0x2 - (f['const']['calculated_width'] - f['params']['cabinet']['corner_straight_front_wall_width']) / units / 0x2,
        g['front_m']['position']['z'] = f['const']['calculated_depth'] / units / 0x2 - f['params']['cabinet']['thickness'] / units / 0x2,
        g['front_m']['position']['y'] = k,
        g['add'](g['front_m']));
    }
    h['visible']['right'] && (g['right'] = new Cornice({
        'model': h['model'],
        'width': f['const']['calculated_depth'],
        'type': 'straight',
        'angle_left': Math['PI'] / 0x4
    }),
    g['right']['rotation']['y'] = Math['PI'] / 0x2,
    g['right']['position']['set'](f['const']['calculated_width'] / 0x2 / units - f['params']['cabinet']['thickness'] / units, 0x0, -f['params']['cabinet']['thickness'] / units / 0x2),
    g['add'](g['right']),
    j) && (g['right_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['const']['calculated_depth'] - f['params']['cabinet']['thickness'],
        'type': 'straight'
    }),
    g['right_m']['rotation']['y'] = Math['PI'] / 0x2,
    g['right_m']['position']['set'](f['const']['calculated_width'] / 0x2 / units, 0x0, -f['params']['cabinet']['thickness'] / units / 0x2),
    g['right_m']['position']['y'] = k,
    g['add'](g['right_m'])),
    h['visible']['left'] && (g['left'] = new Cornice({
        'model': h['model'],
        'width': f['const']['calculated_depth'],
        'type': 'straight',
        'angle_right': -Math['PI'] / 0x4
    }),
    g['left']['rotation']['y'] = -Math['PI'] / 0x2,
    g['left']['position']['set'](-f['const']['calculated_width'] / 0x2 / units + f['params']['cabinet']['thickness'] / units, 0x0, -f['params']['cabinet']['thickness'] / units / 0x2),
    g['add'](g['left']),
    j) && (g['left_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['const']['calculated_depth'] - f['params']['cabinet']['thickness'],
        'type': 'straight_lvl2'
    }),
    g['left_m']['rotation']['y'] = -Math['PI'] / 0x2,
    g['left_m']['position']['set'](-f['const']['calculated_width'] / 0x2 / units, 0x0, -f['params']['cabinet']['thickness'] / units / 0x2),
    g['left_m']['position']['y'] = k,
    g['add'](g['left_m']));
}
,
Cabinet_new['prototype']['build_sizes_corner_straight'] = function() {
    let f = this['params']['cabinet']['width']
      , g = -this['params']['cabinet']['depth'] / units / 0x2 + 0.4
      , h = (0x2 == this['params']['version'] && (f = this['params']['cabinet']['width'] + this['params']['cabinet']['offset']['side'],
    g = -this['params']['cabinet']['depth'] / units / 0x2 + 0.4 - this['params']['cabinet']['offset']['back'] / units / 0x2 - this['params']['cabinet']['thickness'] / units / 0x2 - this['params']['cabinet']['corner_straight_side_connect_width'] / units / 0x2),
    this['size_width'] = new Sizes_obj({
        'width': f / units,
        'text': f,
        'font_size': 0x32
    }),
    this['size_width']['position']['set'](0x0, this['const']['calculated_height'] / units, g),
    this['sizes']['add'](this['size_width']),
    this['params']['cabinet']['depth'] / units)
      , j = this['params']['cabinet']['depth']
      , k = this['params']['cabinet']['width'] / units / 0x2 - 0.4;
    0x2 == this['params']['version'] && (j = this['params']['cabinet']['depth'] + this['params']['cabinet']['thickness'] + this['params']['cabinet']['corner_straight_side_connect_width'] + this['params']['cabinet']['offset']['back'],
    h = j / units,
    k = this['params']['cabinet']['width'] / units / 0x2 - 0.4 + this['params']['cabinet']['offset']['side'] / units / 0x2),
    'top' == this['params']['cabinet_group'] && (h = this['params']['cabinet']['depth'] / units + this['params']['cabinet']['thickness'] / units,
    j = this['params']['cabinet']['depth'] + this['params']['cabinet']['thickness']),
    this['size_depth'] = new Sizes_obj({
        'width': h,
        'text': j,
        'font_size': 0x32
    }),
    'left' === this['params']['cabinet']['orientation'] ? (this['size_depth']['position']['set'](k, this['const']['calculated_height'] / units, 0x0),
    this['size_depth']['rotation']['y'] = -Math['PI'] / 0x2) : (this['size_depth']['position']['set'](-0x1 * k, this['const']['calculated_height'] / units, 0x0),
    this['size_depth']['rotation']['y'] = Math['PI'] / 0x2),
    this['sizes']['add'](this['size_depth']),
    this['size_height'] = new Sizes_obj({
        'width': this['const']['calculated_height'] / units,
        'text': this['const']['calculated_height'],
        'font_size': 0x32
    }),
    this['size_height']['position']['set'](-this['params']['cabinet']['width'] / units / 0x2, this['const']['calculated_height'] / units / 0x2, g),
    this['size_height']['rotation']['z'] = Math['PI'] / 0x2,
    this['sizes']['add'](this['size_height']);
}
,
Cabinet_new['prototype']['build_positions_corner_straight'] = function() {
    if (0x2 == this['params']['version']) {
        let f = this['params']['cabinet']['offset']['side'] / units / 0x2;
        'left' == this['params']['cabinet']['orientation'] && (f = -this['params']['cabinet']['offset']['side'] / units / 0x2);
        var e = this['params']['cabinet']['offset']['back'] / units / 0x2 - this['params']['cabinet']['thickness'] / units / 0x2 - this['params']['cabinet']['corner_straight_side_connect_width'] / units / 0x2;
        this['cabinet']['position']['set'](f, this['params']['cokol']['height'] / units, e),
        this['sections']['position']['set'](f, this['params']['cokol']['height'] / units, e),
        this['cokol']['position']['set'](f, this['cokol']['position']['y'], e),
        this['shelves']['position']['set'](f, this['shelves']['position']['y'], e),
        this['doors']['position']['set'](f, this['doors']['position']['y'], e);
    } else {
        var e = 0x0;
        'top' === this['params']['cabinet_group'] && (e = this['params']['cabinet']['thickness'] / units / 0x2),
        constructor_settings['core_v2'] || this['cabinet']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['params']['cokol']['height'] / units, -this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['tabletop']['offset']['front'] / units / 0x2 - e),
        this['sections']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['params']['cokol']['height'] / units, -this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['tabletop']['offset']['front'] / units / 0x2 - e),
        constructor_settings['core_v2'] || this['cokol']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['cokol']['position']['y'], -this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['tabletop']['offset']['front'] / units / 0x2 - e),
        'left' === this['params']['cabinet']['orientation'] ? (this['shelves']['position']['set'](-this['params']['tabletop']['offset']['right'] / units - this['params']['tabletop']['offset']['left'] / units, this['shelves']['position']['y'], -this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['tabletop']['offset']['front'] / units / 0x2 - e),
        this['walls']['position']['set'](-this['params']['tabletop']['offset']['right'] / units - this['params']['tabletop']['offset']['left'] / units, this['params']['cokol']['height'] / units, -this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['tabletop']['offset']['front'] / units / 0x2)) : (this['shelves']['position']['set'](this['params']['tabletop']['offset']['left'] / units + this['params']['tabletop']['offset']['right'] / units, this['shelves']['position']['y'], -this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['tabletop']['offset']['front'] / units / 0x2 - e),
        this['walls']['position']['set'](this['params']['tabletop']['offset']['left'] / units + this['params']['tabletop']['offset']['right'] / units, this['params']['cokol']['height'] / units, -this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['tabletop']['offset']['front'] / units / 0x2)),
        this['doors']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['doors']['position']['y'], -this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['tabletop']['offset']['front'] / units / 0x2 - e),
        this['doors']['children']['length'] && (this['doors']['children'][0x0]['position']['z'] = this['const']['calculated_depth'] / units / 0x2);
    }
    this['cornice']['position']['y'] = this['cabinet']['position']['y'] + this['params']['cabinet']['height'] / units;
}
,
Cabinet_new['prototype']['build_corner'] = function() {
    var f = this, g = f['cabinet'], j = f['const']['calculated_width'] / units, k = f['const']['calculated_width2'] / units, m = f['params']['cabinet']['height'] / units, q = f['const']['calculated_depth'] / units, u = f['params']['cabinet']['thickness_back'] / units, v = f['params']['cabinet']['back_wall_offset'] / units, w = f['params']['cabinet']['thickness'] / units, x = f['params']['cabinet']['material'], y = void 0x0 !== f['params']['cabinet']['corner_right_wall_width'] ? (f['params']['cabinet']['corner_right_wall_width'] - f['params']['tabletop']['offset']['back'] - f['params']['tabletop']['offset']['front'] - f['params']['cabinet']['back_wall_offset']) / units : f['const']['calculated_depth'] / units, u = (0x2 == this['params']['version'] && (y = void 0x0 !== f['params']['cabinet']['corner_right_wall_width'] ? f['params']['cabinet']['corner_right_wall_width'] / units : f['const']['calculated_depth'] / units),
    g['left_wall'] = new Object_wall({
        'width': q,
        'height': m,
        'thickness': w,
        'rY': Math['PI'] / 0x2,
        'pX': -j / 0x2 + w / 0x2,
        'pY': m / 0x2,
        'pZ': -k / 0x2 + q / 0x2,
        'name': 'left_wall',
        'material': f['params']['cabinet']['material']
    }),
    g['left_back_wall'] = new Object_wall({
        'width': j - v,
        'height': m,
        'thickness': u,
        'pX': 0x0,
        'pY': m / 0x2,
        'pZ': -k / 0x2 - u / 0x2 + 0.4,
        'name': 'back_wall',
        'material': f['params']['cabinet']['back_wall_material']['id']
    }),
    g['right_wall'] = new Object_wall({
        'name': 'right_wall',
        'width': y,
        'height': m,
        'thickness': w,
        'rY': 0x0,
        'pX': j / 0x2 - y / 0x2,
        'pY': m / 0x2,
        'pZ': k / 0x2 - w / 0x2,
        'material': f['params']['cabinet']['material']
    }),
    g['right_back_wall'] = new Object_wall({
        'name': 'right_back_wall',
        'width': k - v - w,
        'height': m,
        'thickness': w,
        'rY': Math['PI'] / 0x2,
        'pX': j / 0x2 - w / 0x2,
        'pY': m / 0x2,
        'pZ': -w / 0x2,
        'material': f['params']['cabinet']['material']
    }),
    f['const']['calculated_width'] - f['params']['cabinet']['thickness']), v = f['const']['calculated_width2'] - f['params']['cabinet']['thickness'], z = f['const']['calculated_depth'], A = new THREE['Shape'](), z, k, v, u, B, v, u, y, q;
    !0x0 === f['params']['cabinet']['inner_radius'] ? (A['moveTo'](-u / units / 0x2, -u / units / 0x2),
    A['lineTo'](-u / units / 0x2, (u / 0x2 - (u - z)) / units),
    A['quadraticCurveTo'](u / units / 0x2 - z / units, (u / 0x2 - (u - z)) / units, u / units / 0x2 - z / units, u / units / 0x2),
    A['lineTo'](u / units / 0x2, u / units / 0x2),
    A['lineTo'](u / units / 0x2, -u / units / 0x2),
    A['lineTo'](-u / units / 0x2, -u / units / 0x2)) : (A['moveTo'](-u / units / 0x2, -v / units / 0x2),
    A['lineTo'](-u / units / 0x2, (v / 0x2 - (v - z)) / units - (z / units - q)),
    A['lineTo'](u / units / 0x2 - z / units + (z / units - y), v / units / 0x2),
    A['lineTo'](u / units / 0x2, v / units / 0x2),
    A['lineTo'](u / units / 0x2, -v / units / 0x2),
    A['lineTo'](-u / units / 0x2, -v / units / 0x2)),
    g['bottom_wall'] = new Object_wall({
        'width': j,
        'height': k,
        'thickness': w,
        'rX': Math['PI'] / 0x2,
        'pX': w / 0x2,
        'pY': w,
        'pZ': -w / 0x2,
        'name': 'bottom_wall',
        'material': f['params']['cabinet']['material'],
        'shape': A
    }),
    'bottom' == f['params']['cabinet_group'] ? (g['top_wall'] = new Object_wall({
        'width': j - 0x2 * w,
        'height': f['params']['cabinet']['tsarg_width'] / units,
        'thickness': w,
        'rX': Math['PI'] / 0x2,
        'pX': 0x0,
        'pY': m - w / 0x2,
        'pZ': -j / 0x2 + f['params']['cabinet']['tsarg_width'] / units / 0x2,
        'name': 'top_wall',
        'material': f['params']['cabinet']['material']
    }),
    z = get_hypo(q, y),
    k = f['params']['cabinet']['tsarg_width'] / units,
    v = v / units - q,
    u = u / units - y,
    B = get_hypo(v, u),
    u = 0xb4 * (v = Math['atan'](v / u)) / Math['PI'],
    y = {
        'x': g['right_wall']['position']['x'] - y / 0x2,
        'z': g['right_wall']['position']['z']
    },
    q = {
        'x': g['left_wall']['position']['x'],
        'z': g['left_wall']['position']['z'] + q / 0x2
    },
    !0x0 !== f['params']['cabinet']['inner_radius'] && (g['top_wall_2'] = new Object_wall({
        'width': z + 0x2 * w,
        'height': f['params']['cabinet']['tsarg_width'] / units,
        'thickness': w,
        'rX': -Math['PI'] / 0x2,
        'rZ': -v,
        'pX': (y['x'] + q['x']) / 0x2 + k / 0x2 - w / 0x2,
        'pY': m - w,
        'pZ': (y['z'] + q['z']) / 0x2 - k / 0x2 + w / 0x2,
        'name': 'top_wall',
        'material': f['params']['cabinet']['material'],
        'shape': build_shape['corner_angle_double_diff'](B, k, 0x5a - u, u)
    }))) : g['top_wall'] = new Object_wall({
        'width': j,
        'height': j,
        'thickness': w,
        'rX': Math['PI'] / 0x2,
        'pX': w / 0x2,
        'pY': m,
        'pZ': -w / 0x2,
        'name': 'top_wall',
        'material': f['params']['cabinet']['material'],
        'shape': A
    }),
    g['add'](g['right_wall']),
    g['add'](g['right_back_wall']),
    g['add'](g['left_wall']),
    g['add'](g['left_back_wall']),
    g['add'](g['top_wall']),
    g['top_wall_2'] && 0x1 == this['params']['cabinet']['top_wall'] && g['add'](g['top_wall_2']),
    g['add'](g['bottom_wall']);
}
,
Cabinet_new['prototype']['build_cokol_corner'] = function() {
    var f, g, j, k, m, q, u, v, w, x, y, z, A, k, B, w;
    this['params']['cokol']['height'] < 0x1 || (g = (f = this)['cokol'],
    j = f['const']['calculated_width'] / units,
    k = f['const']['calculated_width2'] / units,
    m = f['const']['calculated_depth'] / units,
    q = f['params']['cokol']['height'] / units,
    u = f['params']['cokol']['thickness'] / units,
    v = f['params']['cokol']['material'],
    x = void 0x0 !== f['params']['cabinet']['corner_right_wall_width'] ? (f['params']['cabinet']['corner_right_wall_width'] - f['params']['tabletop']['offset']['back'] - f['params']['tabletop']['offset']['front'] - f['params']['cabinet']['back_wall_offset']) / units : f['const']['calculated_depth'] / units,
    y = (j - (x = 0x2 == this['params']['version'] ? void 0x0 !== f['params']['cabinet']['corner_right_wall_width'] ? f['params']['cabinet']['corner_right_wall_width'] / units : f['const']['calculated_depth'] / units : x) - u) * units,
    z = (k - m - u) * units,
    A = get_hypo(y, z),
    0x0 != f['params']['cokol']['legs'] && (w = new CabinetLeg({
        'height': f['params']['cokol']['height'],
        'is_cokol_active': f['params']['cokol']['is_cokol_active']
    }),
    g['add'](w),
    w['position']['x'] = -j / 0x2 + w['params']['radius2'] / units / 0x2 + 0x2 * u,
    w['position']['z'] = -k / 0x2 + w['params']['radius2'] / units / 0x2 + 0x2 * u,
    w = new CabinetLeg({
        'height': f['params']['cokol']['height'],
        'is_cokol_active': f['params']['cokol']['is_cokol_active']
    }),
    g['add'](w),
    w['position']['x'] = j / 0x2 - w['params']['radius2'] / units / 0x2 - 0x2 * u,
    w['position']['z'] = k / 0x2 - w['params']['radius2'] / units / 0x2 - 0x2 * u,
    w = new CabinetLeg({
        'height': f['params']['cokol']['height'],
        'is_cokol_active': f['params']['cokol']['is_cokol_active']
    }),
    g['add'](w),
    w['position']['x'] = -j / 0x2 + w['params']['radius2'] / units / 0x2 + 0x2 * u,
    w['position']['z'] = -k / 0x2 + m - w['params']['radius2'] / units / 0x2 - 0x2 * u,
    w = new CabinetLeg({
        'height': f['params']['cokol']['height'],
        'is_cokol_active': f['params']['cokol']['is_cokol_active']
    }),
    g['add'](w),
    w['position']['x'] = j / 0x2 - x + w['params']['radius2'] / units / 0x2 + 0x2 * u,
    w['position']['z'] = k / 0x2 - w['params']['radius2'] / units / 0x2 - 0x2 * u),
    !0x0 === f['params']['cabinet']['inner_radius'] ? (k = new THREE['Shape'](),
    w = f['params']['cabinet']['width'] - f['params']['cabinet']['depth'] + 0x20 + (B = 0x10) + 0x10,
    k['moveTo'](-w / units / 0x2, -w / units / 0x2),
    k['lineTo'](-w / units / 0x2, (w / 0x2 - (w - 0x10)) / units),
    k['quadraticCurveTo'](w / units / 0x2 - 0x10 / units, (w / 0x2 - (w - 0x10)) / units, w / units / 0x2 - 0x10 / units, w / units / 0x2),
    k['lineTo'](w / units / 0x2, w / units / 0x2),
    k['quadraticCurveTo'](w / units / 0x2, -w / units / 0x2, -w / units / 0x2, -w / units / 0x2),
    g['front'] = new Object_wall({
        'width': A / units + 0x2 * u + u / 0x2 + u / 0x2,
        'height': q,
        'thickness': q,
        'pX': -j / 0x2 + (j - x) / 0x2 - u / 0x2,
        'pZ': j / 0x2 - (j - m) / 0x2 + u / 0x2,
        'pY': q,
        'rX': Math['PI'] / 0x2,
        'material': v,
        'name': 'cokol_front',
        'shape': k
    })) : 0x2 == f['params']['version'] ? g['front'] = new CabinetCokol({
        'width': A + u * units * 0x2 + u * units / 0x2 + u * units / 0x2,
        'height': q * units,
        'thickness': u * units,
        'pX': -j / 0x2 + (j - x) / 0x2 + u / 0x2,
        'pZ': j / 0x2 - (j - m) / 0x2 - u / 0x2,
        'pY': q / 0x2,
        'rY': -Math['atan'](z / y),
        'material': v,
        'name': 'cokol_front'
    }) : g['front'] = new CabinetCokol({
        'width': A + u * units * 0x2 + u * units / 0x2 + u * units / 0x2,
        'height': q * units,
        'thickness': u * units,
        'pX': -j / 0x2 + (j - x) / 0x2,
        'pZ': j / 0x2 - (j - m) / 0x2,
        'pY': q / 0x2,
        'rY': -Math['atan'](z / y),
        'material': v,
        'name': 'cokol_front'
    }),
    g['front']['visible'] = f['params']['cokol']['visible']['front'],
    g['add'](g['front']));
}
,
Cabinet_new['prototype']['build_tabletop_corner'] = function() {
    var f = this, g = {
        'left': f['params']['tabletop']['offset']['left'],
        'right': f['params']['tabletop']['offset']['right'],
        'front': f['params']['tabletop']['offset']['front'],
        'back': f['params']['tabletop']['offset']['back']
    }, j = f['params']['tabletop']['height'], k = f['const']['calculated_width'], m = f['const']['calculated_width2'], q = f['const']['calculated_depth'], u = f['params']['cabinet']['width'], v = f['params']['cabinet']['width2'], w = f['params']['cabinet']['depth'], x = void 0x0 !== f['params']['cabinet']['corner_right_wall_width'] ? f['params']['cabinet']['corner_right_wall_width'] : w, y = (0x2 == this['params']['version'] && (u += f['params']['cabinet']['offset']['back'],
    v += f['params']['cabinet']['offset']['back'],
    w = f['params']['tabletop']['depth'],
    x = f['params']['tabletop']['depth'],
    g = {
        'left': 0x0,
        'right': 0x0,
        'front': 0x0,
        'back': 0x0
    }),
    new THREE['Shape']()), w = (!0x0 === f['params']['cabinet']['inner_radius'] ? (y['moveTo'](-u / units / 0x2, -u / units / 0x2),
    y['lineTo'](-u / units / 0x2, (u / 0x2 - (u - w)) / units),
    y['quadraticCurveTo'](u / units / 0x2 - w / units, (u / 0x2 - (u - w)) / units, u / units / 0x2 - w / units, u / units / 0x2),
    y['lineTo'](u / units / 0x2, u / units / 0x2),
    y['lineTo'](u / units / 0x2, -u / units / 0x2),
    y['lineTo'](-u / units / 0x2, -u / units / 0x2)) : (y['moveTo'](-u / units / 0x2, -v / units / 0x2),
    y['lineTo'](-u / units / 0x2, (v / 0x2 - (v - w)) / units),
    y['lineTo'](u / units / 0x2 - w / units + (w / units - x / units), v / units / 0x2),
    y['lineTo'](u / units / 0x2, v / units / 0x2),
    y['lineTo'](u / units / 0x2, -v / units / 0x2),
    y['lineTo'](-u / units / 0x2, -v / units / 0x2)),
    new Tabletop({
        'width': k + g['left'] + g['right'],
        'height': j,
        'depth': q + g['back'] + g['front'],
        'holes': f['params']['tabletop']['holes'],
        'material': f['params']['tabletop']['material'],
        'id': void 0x0 !== f['params']['tabletop']['tabletop_id'] ? f['params']['tabletop']['tabletop_id'] : 0x0,
        'variant': void 0x0 !== f['params']['tabletop']['tabletop_variant'] ? f['params']['tabletop']['tabletop_variant'] : 0x0,
        'shape': y
    })), x, u;
    f['tabletop']['add'](w);
    let z = k + g['left'] + g['right']
      , A = m + g['left'] + g['right'];
    0x2 == this['params']['version'] && (z += f['params']['cabinet']['offset']['back'],
    A += f['params']['cabinet']['offset']['back']),
    0x0 != this['params']['tabletop']['plints']['left'] && (x = new Decoration({
        'width': z,
        'height': 0x1e,
        'thickness': 0x14,
        'material': f['params']['tabletop']['material'],
        'model': '/common_assets/models/tp1.fbx'
    }),
    f['tabletop']['add'](x),
    x['position']['y'] = 0x1e / units / 0x2,
    x['position']['z'] = -A / units / 0x2 + 0x14 / units / 0x2),
    0x0 != this['params']['tabletop']['plints']['right'] && (u = new Decoration({
        'width': A,
        'height': 0x1e,
        'thickness': 0x14,
        'material': f['params']['tabletop']['material'],
        'model': '/common_assets/models/tp1.fbx'
    }),
    f['tabletop']['add'](u),
    u['rotation']['y'] = -Math['PI'] / 0x2,
    u['position']['y'] = 0x1e / units / 0x2,
    u['position']['x'] = z / units / 0x2 - 0x14 / units / 0x2);
}
,
Cabinet_new['prototype']['build_sections_corner'] = function(f={}) {
    var g = this
      , h = new THREE['Box3']()['setFromObject'](this['cabinet'])['getSize'](new THREE['Vector3']())
      , j = (this['reset_model'](this['sections']),
    {
        'name': 'Секция',
        'width': '100%',
        'height': '100%',
        'starting_point_x': '0%',
        'starting_point_y': '0%',
        'direction_x': 'right',
        'direction_y': 'top',
        'offset_top': 0x0,
        'offset_bottom': 0x0,
        'position_offset_top': 0x0,
        'position_offset_bottom': 0x0,
        'group': g['params']['cabinet_group'],
        'pX': 0x0,
        'pY': 0x0,
        'pZ': 0x0,
        'rX': 0x0,
        'rY': 0x0,
        'rZ': 0x0
    });
    for (let p = 0x0; p < g['params']['sections']['length']; p++) {
        var k = g['params']['sections'][p], k, l = k = Object['assign']({}, j, k), m = ('string' == typeof l['offset_top'] && -0x1 < l['offset_top']['indexOf']('%') && (l['offset_top'] = g['params']['cabinet']['height'] * parseFloat(l['offset_top']) / 0x64),
        'string' == typeof l['offset_bottom'] && -0x1 < l['offset_bottom']['indexOf']('%') && (l['offset_bottom'] = g['params']['cabinet']['height'] * parseFloat(l['offset_bottom']) / 0x64),
        'string' == typeof l['width'] && -0x1 < l['width']['indexOf']('%') && (l['width'] = g['const']['calculated_width'] * parseFloat(l['width']) / 0x64),
        'string' == typeof l['height'] && -0x1 < l['height']['indexOf']('%') && (l['height'] = (g['params']['cabinet']['height'] - l['offset_top'] - l['offset_bottom']) * parseFloat(l['height']) / 0x64),
        'string' == typeof l['starting_point_x'] && -0x1 < l['starting_point_x']['indexOf']('%') ? 'center' === l['starting_point_x'] ? l['pX'] = 0x0 : 'right' === l['direction_x'] ? l['pX'] = g['const']['calculated_width'] * parseFloat(l['starting_point_x']) / 0x64 / units : l['pX'] = g['const']['calculated_width'] * parseFloat(l['starting_point_x']) / 0x64 / units - l['width'] / units : (l['direction_x'],
        l['pX'] = l['starting_point_x'] / units),
        'string' == typeof l['starting_point_y'] && -0x1 < l['starting_point_y']['indexOf']('%') ? 'center' === l['starting_point_y'] ? l['pY'] = 0x0 + h['y'] / 0x2 - l['height'] / units / 0x2 : 'top' === l['direction_y'] ? l['pY'] = 0x0 + g['params']['cabinet']['height'] * parseFloat(l['starting_point_y']) / 0x64 / units - l['position_offset_top'] / units + l['position_offset_bottom'] / units : l['pY'] = 0x0 + g['params']['cabinet']['height'] * parseFloat(l['starting_point_y']) / 0x64 / units - l['height'] / units - l['position_offset_top'] / units + l['position_offset_bottom'] / units : l['pY'] = 0x0 + l['starting_point_y'] / units - l['position_offset_top'] / units + l['position_offset_bottom'] / units,
        new THREE['Group']());
        m['temp_type'] = 'Section',
        this['sections']['add'](m),
        m['userData']['index'] = p,
        m['position']['set'](l['pX'], l['pY'], l['pZ']),
        k['lockers'] && (m['lockers'] = new THREE['Group'](),
        m['lockers']['name'] = 'section_lockers',
        m['add'](m['lockers']),
        g['build_lockers_common']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['lockers'],
            'params': k
        })),
        k['doors'] && (m['doors'] = new THREE['Group'](),
        m['doors']['name'] = 'section_doors',
        m['add'](m['doors']),
        g['build_doors_all']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['doors'],
            'params': k
        })),
        k['walls'] && (m['walls'] = new THREE['Group'](),
        m['walls']['name'] = 'section_walls',
        m['add'](m['walls']),
        g['build_walls_common']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['walls'],
            'params': k
        })),
        !k['shelves'] && 0x1 != k['shelves_auto'] || (m['shelves'] = new THREE['Group'](),
        m['shelves']['name'] = 'section_shelves',
        m['add'](m['shelves']),
        g['build_shelves_corner']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['shelves'],
            'params': k
        }));
    }
}
,
Cabinet_new['prototype']['build_shelves_corner'] = function(f={}) {
    var g = this
      , j = new THREE['Box3']()['setFromObject'](this['cabinet'])['getSize'](new THREE['Vector3']())
      , k = {
        'width': void 0x0 !== f['width'] ? f['width'] : g['const']['calculated_width'],
        'height': (void 0x0 !== f['height'] ? f : g['params']['cabinet'])['height'],
        'obj_to_add': void 0x0 !== f['obj_to_add'] ? f['obj_to_add'] : this['shelves'],
        'params': (void 0x0 !== f['params'] ? f : g)['params']
    };
    k['params']['shelves_auto'] && this['build_shelves_auto'](k);
    let m = g['cabinet']['position']['y'];
    -0x1 < k['obj_to_add']['name']['indexOf']('section_') && (m = 0x0);
    for (var q = 0x0; q < k['params']['shelves']['length']; q++) {
        var u = k['params']['shelves'][q]
          , u = {
            'width': void 0x0 !== u['width'] ? u['width'] : '100%',
            'height': void 0x0 !== u['depth'] ? u['depth'] : g['const']['calculated_depth'] - project_settings['shelve_offset'],
            'thickness': void 0x0 !== u['height'] ? u['height'] : project_settings['shelves_thickness'],
            'orientation': void 0x0 !== u['orientation'] ? u['orientation'] : 'horizontal',
            'material': g['params']['cabinet']['material'],
            'starting_point_x': void 0x0 !== u['starting_point_x'] ? u['starting_point_x'] : '50%',
            'starting_point_y': void 0x0 !== u['starting_point_y'] ? u['starting_point_y'] : '0%',
            'position_offset_top': void 0x0 !== u['position_offset_top'] ? u['position_offset_top'] : 0x0,
            'position_offset_bottom': void 0x0 !== u['position_offset_bottom'] ? u['position_offset_bottom'] : 0x0,
            'direction_x': void 0x0 !== u['direction_x'] ? u['direction_x'] : 'right',
            'direction_y': void 0x0 !== u['direction_y'] ? u['direction_y'] : 'top',
            'pX': u['pX'] || 0x0,
            'pY': u['pY'] || g['cabinet']['position']['y'],
            'pZ': u['pZ'] || -project_settings['shelve_offset'] / units / 0x2,
            'rX': u['rX'] || Math['PI'] / 0x2,
            'rY': u['rY'] || 0x0,
            'rZ': u['rZ'] || 0x0
        }
          , v = ('string' == typeof u['width'] && -0x1 < u['width']['indexOf']('%') && (u['width'] = 'vertical' === u['orientation'] ? (g['params']['cabinet']['height'] - 0x2 * g['params']['cabinet']['thickness']) * parseFloat(u['width']) / 0x64 : (g['const']['calculated_width'] - 0x2 * g['params']['cabinet']['thickness']) * parseFloat(u['width']) / 0x64),
        'string' == typeof u['height'] && -0x1 < u['height']['indexOf']('%') && (u['height'] = g['params']['cabinet']['depth'] * parseFloat(u['height']) / 0x64),
        'string' == typeof u['starting_point_x'] && -0x1 < u['starting_point_x']['indexOf']('%') && (u['pX'] = 'center' === u['starting_point_x'] ? -u['width'] / units / 0x2 : 'right' === u['direction_x'] ? -g['const']['calculated_width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(u['starting_point_x']) / 0x64 / units : -g['const']['calculated_width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(u['starting_point_x']) / 0x64 / units - u['width'] / units),
        'string' == typeof u['starting_point_y'] && -0x1 < u['starting_point_y']['indexOf']('%') ? u['pY'] = 'center' === u['starting_point_y'] ? m + j['y'] / 0x2 - u['height'] / units / 0x2 : 'top' === u['direction_y'] ? 'horizontal' === u['orientation'] ? m + (k['height'] - u['position_offset_top']) * parseFloat(u['starting_point_y']) / 0x64 / units : m + (k['height'] - u['position_offset_top']) * parseFloat(u['starting_point_y']) / 0x64 / units + u['width'] / units / 0x2 : 'horizontal' === u['orientation'] ? m + k['height'] * parseFloat(u['starting_point_y']) / 0x64 / units - u['height'] / units : m + k['height'] * parseFloat(u['starting_point_y']) / 0x64 / units - u['width'] / units / 0x2 : u['pY'] = u['starting_point_y'] / units,
        'vertical' === u['orientation'] && (u['rY'] = Math['PI'] / 0x2),
        u['width'] /= units,
        u['height'] /= units,
        u['thickness'] /= units,
        g['const']['calculated_width'] - g['params']['cabinet']['thickness'] - g['params']['cabinet']['thickness_back'])
          , w = g['const']['calculated_width2'] - g['params']['cabinet']['thickness'] - g['params']['cabinet']['thickness_back']
          , x = g['const']['calculated_depth'] - g['params']['cabinet']['thickness']
          , y = void 0x0 !== g['params']['cabinet']['corner_right_wall_width'] ? (g['params']['cabinet']['corner_right_wall_width'] - g['params']['tabletop']['offset']['back'] - g['params']['tabletop']['offset']['front'] - g['params']['cabinet']['back_wall_offset']) / units : g['const']['calculated_depth'] / units
          , z = new THREE['Shape']()
          , x = (!0x0 === g['params']['cabinet']['inner_radius'] ? (z['moveTo'](-v / units / 0x2, -v / units / 0x2),
        z['lineTo'](-v / units / 0x2, (v / 0x2 - (v - x)) / units),
        z['quadraticCurveTo'](v / units / 0x2 - x / units, (v / 0x2 - (v - x)) / units, v / units / 0x2 - x / units, v / units / 0x2),
        z['lineTo'](v / units / 0x2, v / units / 0x2),
        z['lineTo'](v / units / 0x2, -v / units / 0x2),
        z['lineTo'](-v / units / 0x2, -v / units / 0x2)) : (z['moveTo'](-v / units / 0x2, -w / units / 0x2),
        z['lineTo'](-v / units / 0x2, (w / 0x2 - (w - x)) / units),
        z['lineTo'](v / units / 0x2 - x / units + (x / units - y + g['params']['cabinet']['thickness'] / units), w / units / 0x2),
        z['lineTo'](v / units / 0x2, w / units / 0x2),
        z['lineTo'](v / units / 0x2, -w / units / 0x2),
        z['lineTo'](-v / units / 0x2, -w / units / 0x2)),
        u['shape'] = z,
        u['pX'] = 0x0,
        u['pZ'] = 0x0,
        new Object_wall(u));
        k['obj_to_add']['add'](x);
    }
}
,
Cabinet_new['prototype']['build_cornice_corner'] = function() {
    var f = this, g = this['cornice'], j = f['params']['cornice'], k = project_settings['selected_molded_model'] && 0x1 < j['level'], l = f['const']['calculated_width2'] - f['const']['calculated_depth'] - f['params']['cabinet']['thickness'], m = f['const']['calculated_width'] - f['params']['cabinet']['corner_right_wall_width'] - f['params']['cabinet']['thickness'], p = Math['sqrt'](Math['pow'](l, 0x2) + Math['pow'](m, 0x2)), m = Math['atan'](l / m), q;
    let u;
    k && (u = (u = molded_lib['items'][project_settings['selected_molded_model']]['height']) || 0x9),
    j['visible']['front'] && (q = {
        'model': j['model'],
        'width': p,
        'type': 'straight',
        'offset_type': 'front'
    },
    j['visible']['left'] && (q['angle_left'] = Math['PI'] / 0x4 - m / 0x2),
    j['visible']['right'] && (q['angle_right'] = -m / 0x2),
    g['front'] = new Cornice(q),
    g['front']['rotation']['y'] = -m,
    g['front']['position']['set'](-f['const']['calculated_width'] / units / 0x2 + (f['const']['calculated_width'] - f['params']['cabinet']['corner_right_wall_width']) / units / 0x2 + f['params']['cabinet']['thickness'] / units / 0x2, 0x0, f['const']['calculated_width2'] / units / 0x2 - (f['const']['calculated_width2'] - f['const']['calculated_depth']) / units / 0x2 - f['params']['cabinet']['thickness'] / units / 0x2),
    g['add'](g['front']),
    k) && (g['front_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': p,
        'type': 'straight_lvl2'
    }),
    g['front_m']['rotation']['y'] = -Math['asin'](l / p),
    g['front_m']['position']['set'](-f['const']['calculated_depth'] / units / 0x2, 0x0, f['const']['calculated_depth'] / units / 0x2),
    g['front']['position']['y'] = u,
    g['add'](g['front_m'])),
    j['visible']['right'] && (g['right'] = new Cornice({
        'model': j['model'],
        'width': f['params']['cabinet']['corner_right_wall_width'],
        'type': 'straight',
        'angle_left': m / 0x2
    }),
    g['right']['rotation']['y'] = 0x0,
    g['right']['position']['set'](f['const']['calculated_width'] / 0x2 / units - f['params']['cabinet']['corner_right_wall_width'] / units / 0x2, 0x0, f['const']['calculated_width2'] / 0x2 / units - f['params']['cabinet']['thickness'] / units),
    g['add'](g['right']),
    k) && (g['right_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['const']['calculated_depth'],
        'type': 'straight_lvl2'
    }),
    g['right_m']['rotation']['y'] = 0x0,
    g['right_m']['position']['set'](f['const']['calculated_width'] / 0x2 / units - f['const']['calculated_depth'] / units / 0x2, 0x0, f['const']['calculated_width2'] / 0x2 / units),
    g['right_m']['position']['y'] = u,
    g['add'](g['right_m'])),
    j['visible']['left'] && (g['left'] = new Cornice({
        'model': j['model'],
        'width': f['const']['calculated_depth'],
        'type': 'straight',
        'angle_right': -Math['PI'] / 0x4 + m / 0x2
    }),
    g['left']['rotation']['y'] = -Math['PI'] / 0x2,
    g['left']['position']['set'](-f['const']['calculated_width'] / 0x2 / units + f['params']['cabinet']['thickness'] / units, 0x0, -f['const']['calculated_width2'] / units / 0x2 + f['const']['calculated_depth'] / units / 0x2),
    g['add'](g['left']),
    k) && (g['left_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['const']['calculated_depth'],
        'type': 'straight_lvl2'
    }),
    g['left_m']['rotation']['y'] = -Math['PI'] / 0x2,
    g['left_m']['position']['set'](-f['const']['calculated_width'] / 0x2 / units, 0x0, -f['const']['calculated_width2'] / units / 0x2 + f['const']['calculated_depth'] / units / 0x2),
    g['left_m']['position']['y'] = u,
    g['add'](g['left_m']));
}
,
Cabinet_new['prototype']['build_sizes_corner'] = function() {
    let e = this['params']['cabinet']['width']
      , f = -this['params']['cabinet']['width2'] / units / 0x2 + 0.4
      , g = (0x2 == this['params']['version'] && (e = this['params']['cabinet']['width'] + this['params']['cabinet']['offset']['back'],
    f = -this['params']['cabinet']['width2'] / units / 0x2 + 0.4 - this['params']['cabinet']['offset']['back'] / units / 0x2),
    this['size_width'] = new Sizes_obj({
        'width': e / units,
        'text': e,
        'font_size': 0x32
    }),
    this['size_width']['position']['set'](0x0, this['const']['calculated_height'] / units, f),
    this['sizes']['add'](this['size_width']),
    this['params']['cabinet']['width2'])
      , h = this['params']['cabinet']['width'] / units / 0x2 - 0.4;
    0x2 == this['params']['version'] && (g = this['params']['cabinet']['width'] + this['params']['cabinet']['offset']['back'],
    h = this['params']['cabinet']['width'] / units / 0x2 - 0.4 + this['params']['cabinet']['offset']['back'] / units / 0x2),
    this['size_width_corner'] = new Sizes_obj({
        'width': g / units,
        'text': g,
        'font_size': 0x32
    }),
    this['size_width_corner']['position']['set'](h, this['const']['calculated_height'] / units, 0x0),
    this['size_width_corner']['rotation']['y'] = -Math['PI'] / 0x2,
    this['sizes']['add'](this['size_width_corner']),
    this['size_height'] = new Sizes_obj({
        'width': this['const']['calculated_height'] / units,
        'text': this['const']['calculated_height'],
        'font_size': 0x32
    }),
    this['size_height']['position']['set'](-this['params']['cabinet']['width'] / units / 0x2, this['const']['calculated_height'] / units / 0x2, f),
    this['size_height']['rotation']['z'] = Math['PI'] / 0x2,
    this['sizes']['add'](this['size_height']);
}
,
Cabinet_new['prototype']['build_corner_positions'] = function() {
    var e, f, e, f, e;
    0x2 == this['params']['version'] ? (this['cabinet']['position']['set'](-this['params']['cabinet']['offset']['back'] / units / 0x2, this['params']['cokol']['height'] / units, this['params']['cabinet']['offset']['back'] / units / 0x2),
    this['cokol']['position']['set'](-this['params']['cabinet']['offset']['back'] / units / 0x2, this['cokol']['position']['y'], this['params']['cabinet']['offset']['back'] / units / 0x2),
    this['sections']['position']['set'](-this['params']['cabinet']['offset']['back'] / units / 0x2, this['params']['cokol']['height'] / units, this['params']['cabinet']['offset']['back'] / units / 0x2),
    this['doors']['position']['set'](-this['params']['cabinet']['width'] / units / 0x2 - this['params']['cabinet']['offset']['back'] / units / 0x2 + this['params']['cabinet']['thickness'] / units / 0x2, 0x0, this['params']['cabinet']['width2'] / units / 0x2 - (this['params']['cabinet']['width2'] / units - this['params']['cabinet']['depth'] / units) + this['params']['cabinet']['offset']['back'] / units / 0x2),
    e = this['params']['cabinet']['width2'] - this['params']['cabinet']['depth'] - this['params']['cabinet']['thickness'],
    f = this['params']['cabinet']['width'] - this['params']['cabinet']['corner_right_wall_width'] - this['params']['cabinet']['thickness'],
    this['doors']['rotation']['y'] = -Math['atan'](e / f)) : (this['cabinet']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['params']['cokol']['height'] / units, this['params']['tabletop']['offset']['back'] / units / 0x2),
    this['sections']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['params']['cokol']['height'] / units, this['params']['tabletop']['offset']['back'] / units / 0x2),
    !0x1 === this['params']['cabinet']['inner_radius'] ? (e = void 0x0 !== this['params']['cabinet']['corner_right_wall_width'] ? this['params']['cabinet']['corner_right_wall_width'] - this['params']['tabletop']['offset']['back'] - this['params']['tabletop']['offset']['front'] - this['params']['cabinet']['back_wall_offset'] : this['const']['calculated_depth'],
    this['doors']['position']['set'](-this['params']['cabinet']['width'] / units / 0x2 + this['params']['cabinet']['thickness'] / units / 0x2, 0x0, this['params']['cabinet']['width2'] / units / 0x2 - (this['params']['cabinet']['width2'] / units - this['params']['cabinet']['depth'] / units) - this['params']['tabletop']['offset']['front'] / units),
    f = this['const']['calculated_width2'] - this['const']['calculated_depth'] - this['params']['cabinet']['thickness'],
    e = this['const']['calculated_width'] - e - this['params']['cabinet']['thickness'],
    this['doors']['rotation']['y'] = -Math['atan'](f / e)) : (this['doors']['position']['x'] = -this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2,
    this['doors']['position']['z'] = this['params']['tabletop']['offset']['back'] / units / 0x2)),
    this['cornice']['position']['y'] = this['cabinet']['position']['y'] + this['params']['cabinet']['height'] / units;
}
,
Cabinet_new['prototype']['build_corner_90'] = function() {
    this['params']['cabinet']['width2'] || (this['params']['cabinet']['width2'] = this['params']['cabinet']['width']);
    var f = this
      , g = f['cabinet']
      , j = f['const']['calculated_width'] / units
      , k = f['params']['cabinet']['width2'] / units - f['params']['tabletop']['offset']['back'] / units
      , m = f['params']['cabinet']['height'] / units
      , q = f['const']['calculated_depth'] / units
      , u = f['params']['cabinet']['thickness_back'] / units
      , v = f['params']['cabinet']['back_wall_offset'] / units
      , w = f['params']['cabinet']['thickness'] / units
      , x = f['params']['cabinet']['material']
      , y = void 0x0 !== f['params']['cabinet']['corner_right_wall_width'] ? (f['params']['cabinet']['corner_right_wall_width'] - f['params']['tabletop']['offset']['back'] - f['params']['tabletop']['offset']['front'] - f['params']['cabinet']['back_wall_offset']) / units : f['const']['calculated_depth'] / units
      , z = (0x2 == this['params']['version'] && (k = f['params']['cabinet']['width2'] / units,
    y = void 0x0 !== f['params']['cabinet']['corner_right_wall_width'] ? f['params']['cabinet']['corner_right_wall_width'] / units : f['const']['calculated_depth'] / units),
    g['left_wall'] = new Object_wall({
        'width': q,
        'height': m,
        'thickness': w,
        'rY': Math['PI'] / 0x2,
        'pX': -j / 0x2 + w / 0x2,
        'pY': m / 0x2,
        'pZ': -k / 0x2 + q / 0x2,
        'name': 'left_wall',
        'material': f['params']['cabinet']['material']
    }),
    g['left_back_wall'] = new Object_wall({
        'width': j - w - v,
        'height': m,
        'thickness': w,
        'pX': w / 0x2,
        'pY': m / 0x2,
        'pZ': -k / 0x2 + w / 0x2,
        'name': 'left_back_wall',
        'material': f['params']['cabinet']['material']
    }),
    g['right_wall'] = new Object_wall({
        'name': 'right_wall',
        'width': y,
        'height': m,
        'thickness': w,
        'rY': 0x0,
        'pX': j / 0x2 - y / 0x2,
        'pY': m / 0x2,
        'pZ': k / 0x2 - w / 0x2,
        'material': f['params']['cabinet']['material']
    }),
    g['right_back_wall'] = new Object_wall({
        'name': 'back_wall',
        'width': k - v,
        'height': m,
        'thickness': u,
        'rY': Math['PI'] / 0x2,
        'pX': j / 0x2 + u / 0x2,
        'pY': m / 0x2,
        'pZ': 0x0,
        'material': f['params']['cabinet']['back_wall_material']['id']
    }),
    f['const']['calculated_width'] - f['params']['cabinet']['thickness'])
      , A = f['const']['calculated_depth']
      , v = build_shape['corner_90'](j, k, q, y)
      , B = (g['bottom_wall'] = new Object_wall({
        'width': j,
        'height': j,
        'thickness': w,
        'rX': Math['PI'] / 0x2,
        'pX': 0x0,
        'pY': w,
        'pZ': 0x0,
        'name': 'bottom_wall',
        'material': f['params']['cabinet']['material'],
        'shape': v
    }),
    f['params']['cabinet']['tsarg_width'] / units);
    'bottom' == f['params']['cabinet_group'] ? (g['top_wall'] = new Object_wall({
        'width': k - 0x2 * w,
        'height': B,
        'thickness': w,
        'rX': Math['PI'] / 0x2,
        'rZ': Math['PI'] / 0x2,
        'pX': j / 0x2 - B / 0x2,
        'pY': m - w / 0x2,
        'pZ': 0x0,
        'name': 'top_wall',
        'material': f['params']['cabinet']['material']
    }),
    g['top_wall_2'] = new Object_wall({
        'width': k - 0x2 * w,
        'height': B,
        'thickness': w,
        'rX': Math['PI'] / 0x2,
        'rZ': Math['PI'] / 0x2,
        'pX': j / 0x2 + B / 0x2 - y,
        'pY': m - w / 0x2,
        'pZ': 0x0,
        'name': 'top_wall',
        'material': f['params']['cabinet']['material']
    }),
    g['top_wall_3'] = new Object_wall({
        'width': j - q - w,
        'height': B,
        'thickness': w,
        'rX': Math['PI'] / 0x2,
        'pX': -j / 0x2 + (j - q - w) / 0x2 + w,
        'pY': m - w / 0x2,
        'pZ': -k / 0x2 + q - B / 0x2,
        'name': 'top_wall',
        'material': f['params']['cabinet']['material']
    })) : g['top_wall'] = new Object_wall({
        'width': j,
        'height': j,
        'thickness': w,
        'rX': Math['PI'] / 0x2,
        'pX': 0x0,
        'pY': m,
        'pZ': 0x0,
        'name': 'top_wall',
        'material': f['params']['cabinet']['material'],
        'shape': v
    }),
    'left' == f['params']['cabinet']['orientation'] && (g['left_wall']['position']['x'] = j / 0x2 - w / 0x2,
    g['left_back_wall']['position']['x'] = -w / 0x2,
    g['right_wall']['position']['x'] = -j / 0x2 + y / 0x2,
    g['right_back_wall']['position']['x'] = -j / 0x2 + u / 0x2,
    g['bottom_wall']['rotation']['y'] = Math['PI'],
    g['bottom_wall']['position']['y'] = 0x0,
    'bottom' == f['params']['cabinet_group'] ? (g['top_wall']['position']['x'] *= -0x1,
    g['top_wall_2']['position']['x'] *= -0x1,
    g['top_wall_3']['position']['x'] *= -0x1) : (g['top_wall']['rotation']['y'] = Math['PI'],
    g['top_wall']['position']['y'] = m - w)),
    g['add'](g['right_wall']),
    g['add'](g['right_back_wall']),
    g['add'](g['left_wall']),
    g['add'](g['left_back_wall']),
    g['add'](g['top_wall']),
    g['top_wall_2'] && g['add'](g['top_wall_2']),
    g['top_wall_3'] && g['add'](g['top_wall_3']),
    g['add'](g['bottom_wall']);
}
,
Cabinet_new['prototype']['build_tabletop_corner_90'] = function() {
    var f = this, g = {
        'left': f['params']['tabletop']['offset']['left'],
        'right': f['params']['tabletop']['offset']['right'],
        'front': f['params']['tabletop']['offset']['front'],
        'back': f['params']['tabletop']['offset']['back']
    }, j = f['params']['tabletop']['height'], k = f['const']['calculated_width'], l = f['const']['calculated_depth'], m = f['params']['cabinet']['width'], p = f['params']['cabinet']['width2'], q = f['params']['cabinet']['depth'], u = void 0x0 !== f['params']['cabinet']['corner_right_wall_width'] ? f['params']['cabinet']['corner_right_wall_width'] : q, u = (0x2 == this['params']['version'] && (m += f['params']['cabinet']['offset']['back'],
    p += f['params']['cabinet']['offset']['back'],
    q = f['params']['tabletop']['depth'],
    u = f['params']['tabletop']['depth'],
    g = {
        'left': 0x0,
        'right': 0x0,
        'front': 0x0,
        'back': 0x0
    }),
    build_shape['corner_90'](m / units, p / units, q / units, u / units)), q = new Tabletop({
        'width': m,
        'height': j,
        'depth': q,
        'holes': f['params']['tabletop']['holes'],
        'material': f['params']['tabletop']['material'],
        'id': void 0x0 !== f['params']['tabletop']['tabletop_id'] ? f['params']['tabletop']['tabletop_id'] : 0x0,
        'variant': void 0x0 !== f['params']['tabletop']['tabletop_variant'] ? f['params']['tabletop']['tabletop_variant'] : 0x0,
        'shape': u
    }), u = (f['tabletop']['add'](q),
    m), m, q;
    this['params']['version'],
    'left' == f['params']['cabinet']['orientation'] && (q['rotation']['y'] = Math['PI'],
    q['rotation']['x'] = Math['PI'],
    q['position']['y'] = -j / units),
    0x0 != this['params']['tabletop']['plints']['left'] && (m = new Decoration({
        'width': u,
        'height': 0x1e,
        'thickness': 0x14,
        'material': f['params']['tabletop']['material'],
        'model': '/common_assets/models/tp1.fbx'
    }),
    f['tabletop']['add'](m),
    m['position']['y'] = 0x1e / units / 0x2,
    m['position']['z'] = -p / units / 0x2 + 0x14 / units / 0x2),
    0x0 != this['params']['tabletop']['plints']['right'] && (q = new Decoration({
        'width': p,
        'height': 0x1e,
        'thickness': 0x14,
        'material': f['params']['tabletop']['material'],
        'model': '/common_assets/models/tp1.fbx'
    }),
    f['tabletop']['add'](q),
    q['rotation']['y'] = -Math['PI'] / 0x2,
    q['position']['y'] = 0x1e / units / 0x2,
    q['position']['x'] = u / units / 0x2 - 0x14 / units / 0x2,
    'left' == this['params']['cabinet']['orientation']) && (q['rotation']['y'] = Math['PI'] / 0x2,
    q['position']['x'] *= -0x1);
}
,
Cabinet_new['prototype']['build_cokol_corner_90'] = function() {
    var f, g, j, k, l, m, q, u, v, w;
    this['params']['cokol']['height'] < 0x1 || (g = (f = this)['cokol'],
    j = f['const']['calculated_width'] / units,
    k = f['params']['cabinet']['width2'] / units - f['params']['tabletop']['offset']['back'] / units,
    l = f['const']['calculated_depth'] / units,
    m = f['params']['cokol']['height'] / units,
    q = f['params']['cokol']['thickness'] / units,
    u = f['params']['cokol']['material'],
    w = void 0x0 !== f['params']['cabinet']['corner_right_wall_width'] ? (f['params']['cabinet']['corner_right_wall_width'] - f['params']['tabletop']['offset']['back'] - f['params']['tabletop']['offset']['front'] - f['params']['cabinet']['back_wall_offset']) / units : f['const']['calculated_depth'] / units,
    0x2 == this['params']['version'] && (k = f['params']['cabinet']['width2'] / units),
    0x0 != f['params']['cokol']['legs'] && (v = new CabinetLeg({
        'height': f['params']['cokol']['height'],
        'is_cokol_active': f['params']['cokol']['is_cokol_active']
    }),
    g['add'](v),
    v['position']['x'] = -j / 0x2 + v['params']['radius2'] / units / 0x2 + 0x2 * q,
    v['position']['z'] = -k / 0x2 + v['params']['radius2'] / units / 0x2 + 0x2 * q,
    'left' == f['params']['cabinet']['orientation'] && (v['position']['x'] *= -0x1),
    v = new CabinetLeg({
        'height': f['params']['cokol']['height'],
        'is_cokol_active': f['params']['cokol']['is_cokol_active']
    }),
    g['add'](v),
    v['position']['x'] = j / 0x2 - v['params']['radius2'] / units / 0x2 - 0x2 * q,
    v['position']['z'] = k / 0x2 - v['params']['radius2'] / units / 0x2 - 0x2 * q,
    'left' == f['params']['cabinet']['orientation'] && (v['position']['x'] *= -0x1),
    v = new CabinetLeg({
        'height': f['params']['cokol']['height'],
        'is_cokol_active': f['params']['cokol']['is_cokol_active']
    }),
    g['add'](v),
    v['position']['x'] = -j / 0x2 + v['params']['radius2'] / units / 0x2 + 0x2 * q,
    v['position']['z'] = -k / 0x2 + l - v['params']['radius2'] / units / 0x2 - 0x2 * q,
    'left' == f['params']['cabinet']['orientation'] && (v['position']['x'] *= -0x1),
    v = new CabinetLeg({
        'height': f['params']['cokol']['height'],
        'is_cokol_active': f['params']['cokol']['is_cokol_active']
    }),
    g['add'](v),
    v['position']['x'] = j / 0x2 - w + v['params']['radius2'] / units / 0x2 + 0x2 * q,
    v['position']['z'] = k / 0x2 - v['params']['radius2'] / units / 0x2 - 0x2 * q,
    'left' == f['params']['cabinet']['orientation']) && (v['position']['x'] *= -0x1),
    0x2 == this['params']['version'] ? g['front'] = new CabinetCokol({
        'width': j * units - l * units + q * units,
        'height': m * units,
        'thickness': q * units,
        'pX': -f['params']['cabinet']['width'] / units / 0x2 + (j - l) / 0x2 + q / 0x2,
        'pZ': -k / 0x2 + l - q,
        'pY': m / 0x2,
        'material': u,
        'name': 'cokol_front'
    }) : g['front'] = new CabinetCokol({
        'width': j * units - l * units + q * units,
        'height': m * units,
        'thickness': q * units,
        'pX': -f['params']['cabinet']['width'] / units / 0x2 + (j - l) / 0x2 + q / 0x2,
        'pZ': -k / 0x2 + l,
        'pY': m / 0x2,
        'material': u,
        'name': 'cokol_front'
    }),
    g['front_right'] = new CabinetCokol({
        'width': k * units - l * units + q * units,
        'height': m * units,
        'thickness': q * units,
        'pX': -f['params']['cabinet']['width'] / units / 0x2 + (j - l) + q,
        'pZ': f['params']['cabinet']['width'] / units / 0x2 - (j - l) / 0x2 - q / 0x2,
        'pY': m / 0x2,
        'rY': -Math['PI'] / 0x2,
        'material': u,
        'name': 'cokol_front'
    }),
    'left' == f['params']['cabinet']['orientation'] && (g['front']['position']['x'] *= -0x1,
    g['front_right']['position']['x'] *= -0x1),
    g['front']['visible'] = f['params']['cokol']['visible']['front'],
    g['front_right']['visible'] = f['params']['cokol']['visible']['front'],
    g['add'](g['front']),
    g['add'](g['front_right']));
}
,
Cabinet_new['prototype']['build_sections_corner_90'] = function(f={}) {
    var g = this
      , h = new THREE['Box3']()['setFromObject'](this['cabinet'])['getSize'](new THREE['Vector3']())
      , j = (this['reset_model'](this['sections']),
    {
        'name': 'Секция',
        'width': '100%',
        'height': '100%',
        'starting_point_x': '0%',
        'starting_point_y': '0%',
        'direction_x': 'right',
        'direction_y': 'top',
        'offset_top': 0x0,
        'offset_bottom': 0x0,
        'position_offset_top': 0x0,
        'position_offset_bottom': 0x0,
        'group': g['params']['cabinet_group'],
        'pX': 0x0,
        'pY': 0x0,
        'pZ': 0x0,
        'rX': 0x0,
        'rY': 0x0,
        'rZ': 0x0
    });
    for (let p = 0x0; p < g['params']['sections']['length']; p++) {
        var k = g['params']['sections'][p], k, l = k = Object['assign']({}, j, k), m = ('string' == typeof l['offset_top'] && -0x1 < l['offset_top']['indexOf']('%') && (l['offset_top'] = g['params']['cabinet']['height'] * parseFloat(l['offset_top']) / 0x64),
        'string' == typeof l['offset_bottom'] && -0x1 < l['offset_bottom']['indexOf']('%') && (l['offset_bottom'] = g['params']['cabinet']['height'] * parseFloat(l['offset_bottom']) / 0x64),
        'string' == typeof l['width'] && -0x1 < l['width']['indexOf']('%') && (l['width'] = g['const']['calculated_width'] * parseFloat(l['width']) / 0x64),
        'string' == typeof l['height'] && -0x1 < l['height']['indexOf']('%') && (l['height'] = (g['params']['cabinet']['height'] - l['offset_top'] - l['offset_bottom']) * parseFloat(l['height']) / 0x64),
        'string' == typeof l['starting_point_x'] && -0x1 < l['starting_point_x']['indexOf']('%') ? 'center' === l['starting_point_x'] ? l['pX'] = 0x0 : 'right' === l['direction_x'] ? l['pX'] = g['const']['calculated_width'] * parseFloat(l['starting_point_x']) / 0x64 / units : l['pX'] = g['const']['calculated_width'] * parseFloat(l['starting_point_x']) / 0x64 / units - l['width'] / units : (l['direction_x'],
        l['pX'] = l['starting_point_x'] / units),
        'string' == typeof l['starting_point_y'] && -0x1 < l['starting_point_y']['indexOf']('%') ? 'center' === l['starting_point_y'] ? l['pY'] = 0x0 + h['y'] / 0x2 - l['height'] / units / 0x2 : 'top' === l['direction_y'] ? l['pY'] = 0x0 + g['params']['cabinet']['height'] * parseFloat(l['starting_point_y']) / 0x64 / units - l['position_offset_top'] / units + l['position_offset_bottom'] / units : l['pY'] = 0x0 + g['params']['cabinet']['height'] * parseFloat(l['starting_point_y']) / 0x64 / units - l['height'] / units - l['position_offset_top'] / units + l['position_offset_bottom'] / units : l['pY'] = 0x0 + l['starting_point_y'] / units - l['position_offset_top'] / units + l['position_offset_bottom'] / units,
        new THREE['Group']());
        m['temp_type'] = 'Section',
        this['sections']['add'](m),
        m['userData']['index'] = p,
        m['position']['set'](l['pX'], l['pY'], l['pZ']),
        k['lockers'] && (m['lockers'] = new THREE['Group'](),
        m['lockers']['name'] = 'section_lockers',
        m['add'](m['lockers']),
        g['build_lockers_common']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['lockers'],
            'params': k
        })),
        k['doors'] && (m['doors'] = new THREE['Group'](),
        m['doors']['name'] = 'section_doors',
        m['add'](m['doors']),
        g['build_doors_all']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['doors'],
            'params': k
        })),
        k['walls'] && (m['walls'] = new THREE['Group'](),
        m['walls']['name'] = 'section_walls',
        m['add'](m['walls']),
        g['build_walls_common']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['walls'],
            'params': k
        })),
        !k['shelves'] && 0x1 != k['shelves_auto'] || (m['shelves'] = new THREE['Group'](),
        m['shelves']['name'] = 'section_shelves',
        m['add'](m['shelves']),
        g['build_shelves_corner_90']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['shelves'],
            'params': k
        }));
    }
}
,
Cabinet_new['prototype']['build_shelves_corner_90'] = function(f={}) {
    var g = this
      , j = new THREE['Box3']()['setFromObject'](this['cabinet'])['getSize'](new THREE['Vector3']())
      , k = {
        'width': void 0x0 !== f['width'] ? f['width'] : g['const']['calculated_width'],
        'height': (void 0x0 !== f['height'] ? f : g['params']['cabinet'])['height'],
        'obj_to_add': void 0x0 !== f['obj_to_add'] ? f['obj_to_add'] : this['shelves'],
        'params': (void 0x0 !== f['params'] ? f : g)['params']
    };
    k['params']['shelves_auto'] && this['build_shelves_auto'](k);
    let m = g['cabinet']['position']['y'];
    -0x1 < k['obj_to_add']['name']['indexOf']('section_') && (m = 0x0);
    for (var q = 0x0; q < k['params']['shelves']['length']; q++) {
        var u = k['params']['shelves'][q]
          , u = {
            'width': void 0x0 !== u['width'] ? u['width'] : '100%',
            'height': void 0x0 !== u['depth'] ? u['depth'] : g['const']['calculated_depth'] - project_settings['shelve_offset'],
            'thickness': void 0x0 !== u['height'] ? u['height'] : project_settings['shelves_thickness'],
            'orientation': void 0x0 !== u['orientation'] ? u['orientation'] : 'horizontal',
            'material': g['params']['cabinet']['material'],
            'starting_point_x': void 0x0 !== u['starting_point_x'] ? u['starting_point_x'] : '50%',
            'starting_point_y': void 0x0 !== u['starting_point_y'] ? u['starting_point_y'] : '0%',
            'position_offset_top': void 0x0 !== u['position_offset_top'] ? u['position_offset_top'] : 0x0,
            'position_offset_bottom': void 0x0 !== u['position_offset_bottom'] ? u['position_offset_bottom'] : 0x0,
            'direction_x': void 0x0 !== u['direction_x'] ? u['direction_x'] : 'right',
            'direction_y': void 0x0 !== u['direction_y'] ? u['direction_y'] : 'top',
            'pX': u['pX'] || 0x0,
            'pY': u['pY'] || g['cabinet']['position']['y'],
            'pZ': u['pZ'] || -project_settings['shelve_offset'] / units / 0x2,
            'rX': u['rX'] || Math['PI'] / 0x2,
            'rY': u['rY'] || 0x0,
            'rZ': u['rZ'] || 0x0
        }
          , v = ('string' == typeof u['width'] && -0x1 < u['width']['indexOf']('%') && (u['width'] = 'vertical' === u['orientation'] ? (g['params']['cabinet']['height'] - 0x2 * g['params']['cabinet']['thickness']) * parseFloat(u['width']) / 0x64 : (g['const']['calculated_width'] - 0x2 * g['params']['cabinet']['thickness']) * parseFloat(u['width']) / 0x64),
        'string' == typeof u['height'] && -0x1 < u['height']['indexOf']('%') && (u['height'] = g['params']['cabinet']['depth'] * parseFloat(u['height']) / 0x64),
        'string' == typeof u['starting_point_x'] && -0x1 < u['starting_point_x']['indexOf']('%') && (u['pX'] = 'center' === u['starting_point_x'] ? -u['width'] / units / 0x2 : 'right' === u['direction_x'] ? -g['const']['calculated_width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(u['starting_point_x']) / 0x64 / units : -g['const']['calculated_width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(u['starting_point_x']) / 0x64 / units - u['width'] / units),
        'string' == typeof u['starting_point_y'] && -0x1 < u['starting_point_y']['indexOf']('%') ? u['pY'] = 'center' === u['starting_point_y'] ? m + j['y'] / 0x2 - u['height'] / units / 0x2 : 'top' === u['direction_y'] ? 'horizontal' === u['orientation'] ? m + (k['height'] - u['position_offset_top']) * parseFloat(u['starting_point_y']) / 0x64 / units : m + (k['height'] - u['position_offset_top']) * parseFloat(u['starting_point_y']) / 0x64 / units + u['width'] / units / 0x2 : 'horizontal' === u['orientation'] ? m + k['height'] * parseFloat(u['starting_point_y']) / 0x64 / units - u['height'] / units : m + k['height'] * parseFloat(u['starting_point_y']) / 0x64 / units - u['width'] / units / 0x2 : u['pY'] = u['starting_point_y'] / units,
        'vertical' === u['orientation'] && (u['rY'] = Math['PI'] / 0x2),
        u['width'] /= units,
        u['height'] /= units,
        u['thickness'] /= units,
        g['const']['calculated_width'] - g['params']['cabinet']['thickness'] - g['params']['cabinet']['thickness_back'])
          , w = g['const']['calculated_depth'] - g['params']['cabinet']['thickness']
          , x = void 0x0 !== g['params']['cabinet']['corner_right_wall_width'] ? g['params']['cabinet']['corner_right_wall_width'] - g['params']['tabletop']['offset']['back'] - g['params']['tabletop']['offset']['front'] - g['params']['cabinet']['back_wall_offset'] : g['const']['calculated_depth']
          , y = g['params']['cabinet']['width2'] - g['params']['tabletop']['offset']['back'] - 0x2 * g['params']['cabinet']['thickness']
          , v = build_shape['corner_90'](v / units, y / units, w / units, x / units - g['params']['cabinet']['thickness'] / units)
          , y = (u['shape'] = v,
        u['pX'] = g['params']['cabinet']['thickness'] / units / 0x2,
        u['pZ'] = 0x0,
        new Object_wall(u));
        k['obj_to_add']['add'](y),
        'left' == this['params']['cabinet']['orientation'] && (y['rotation']['y'] = Math['PI'],
        y['position']['y'] -= u['thickness']);
    }
}
,
Cabinet_new['prototype']['build_cornice_corner_90'] = function() {
    var f = this, g = this['cornice'], h = f['params']['cornice'], j = f['params']['cabinet']['width2'] - f['params']['tabletop']['offset']['back'], k = project_settings['selected_molded_model'] && 0x1 < h['level'], l, l, l, l;
    let m;
    k && (m = (m = molded_lib['items'][project_settings['selected_molded_model']]['height']) || 0x9),
    h['visible']['front'] && (l = {
        'model': h['model'],
        'width': f['const']['calculated_width'] - f['const']['calculated_depth'],
        'type': 'straight',
        'offset_type': 'front'
    },
    h['visible']['left'] && ('left' == f['params']['cabinet']['orientation'] ? l['angle_right'] = -Math['PI'] / 0x4 : l['angle_left'] = Math['PI'] / 0x4),
    g['front'] = new Cornice(l),
    g['front']['position']['set'](-f['const']['calculated_depth'] / units / 0x2, 0x0, -j / units / 0x2 + f['const']['calculated_depth'] / units),
    l = {
        'model': h['model'],
        'width': j - f['const']['calculated_depth'],
        'type': 'straight',
        'offset_type': 'front'
    },
    h['visible']['right'] && ('left' == f['params']['cabinet']['orientation'] ? l['angle_left'] = Math['PI'] / 0x4 : l['angle_right'] = -Math['PI'] / 0x4),
    g['front_right'] = new Cornice(l),
    g['front_right']['rotation']['y'] = -Math['PI'] / 0x2,
    g['front_right']['position']['set'](f['const']['calculated_width'] / units / 0x2 - f['const']['calculated_depth'] / units, 0x0, -f['const']['calculated_width'] / units / 0x2 + f['const']['calculated_depth'] / units + (f['const']['calculated_width'] - f['const']['calculated_depth']) / units / 0x2),
    g['add'](g['front']),
    g['add'](g['front_right']),
    k) && (g['front_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['const']['calculated_width'] - f['const']['calculated_depth'],
        'type': 'straight_lvl2'
    }),
    g['front_m']['position']['set'](-f['const']['calculated_depth'] / units / 0x2, 0x0, -j / units / 0x2 + f['const']['calculated_depth'] / units),
    g['front_right_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': j - f['const']['calculated_depth'],
        'type': 'straight_lvl2'
    }),
    g['front_right_m']['rotation']['y'] = -Math['PI'] / 0x2,
    g['front_right_m']['position']['set'](f['const']['calculated_width'] / units / 0x2 - f['const']['calculated_depth'] / units, 0x0, -f['const']['calculated_width'] / units / 0x2 + f['const']['calculated_depth'] / units + (f['const']['calculated_width'] - f['const']['calculated_depth']) / units / 0x2),
    g['front']['position']['y'] = m,
    g['front_right']['position']['y'] = m,
    g['add'](g['front_m']),
    g['add'](g['front_right_m'])),
    h['visible']['right'] && (l = {
        'model': h['model'],
        'width': f['const']['calculated_depth'],
        'type': 'straight'
    },
    'left' == this['params']['cabinet']['orientation'] ? l['angle_right'] = -Math['PI'] / 0x4 : l['angle_left'] = Math['PI'] / 0x4,
    g['right'] = new Cornice(l),
    g['right']['rotation']['y'] = 0x0,
    g['right']['position']['set'](f['const']['calculated_width'] / 0x2 / units - f['const']['calculated_depth'] / units / 0x2, 0x0, j / 0x2 / units),
    g['add'](g['right']),
    k) && (g['right_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['const']['calculated_depth'],
        'type': 'straight_lvl2'
    }),
    g['right_m']['rotation']['y'] = 0x0,
    g['right_m']['position']['set'](f['const']['calculated_width'] / 0x2 / units - f['const']['calculated_depth'] / units / 0x2, 0x0, j / 0x2 / units),
    g['right_m']['position']['y'] = m,
    g['add'](g['right_m'])),
    h['visible']['left'] && (l = {
        'model': h['model'],
        'width': f['const']['calculated_depth'],
        'type': 'straight'
    },
    'left' == this['params']['cabinet']['orientation'] ? l['angle_left'] = Math['PI'] / 0x4 : l['angle_right'] = -Math['PI'] / 0x4,
    g['left'] = new Cornice(l),
    g['left']['rotation']['y'] = -Math['PI'] / 0x2,
    g['left']['position']['set'](-f['const']['calculated_width'] / 0x2 / units, 0x0, -j / units / 0x2 + f['const']['calculated_depth'] / units / 0x2),
    g['add'](g['left']),
    k) && (g['left_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['const']['calculated_depth'],
        'type': 'straight_lvl2'
    }),
    g['left_m']['rotation']['y'] = -Math['PI'] / 0x2,
    g['left_m']['position']['set'](-f['const']['calculated_width'] / 0x2 / units, 0x0, -j / units / 0x2 + f['const']['calculated_depth'] / units / 0x2),
    g['left_m']['position']['y'] = m,
    g['add'](g['left_m'])),
    'left' == f['params']['cabinet']['orientation'] && (h['visible']['front'] && (g['front']['position']['x'] *= -0x1,
    g['front_right']['rotation']['y'] = Math['PI'] / 0x2,
    g['front_right']['position']['x'] *= -0x1),
    h['visible']['right'] && (g['right']['position']['x'] *= -0x1),
    h['visible']['left']) && (g['left']['rotation']['y'] = Math['PI'] / 0x2,
    g['left']['position']['x'] *= -0x1);
}
,
Cabinet_new['prototype']['build_sizes_corner_90'] = function() {
    let e = this['params']['cabinet']['width']
      , f = -this['params']['cabinet']['width2'] / units / 0x2 + 0.4
      , g = (0x2 == this['params']['version'] && (e = this['params']['cabinet']['width'] + this['params']['cabinet']['offset']['back'],
    f = -this['params']['cabinet']['width2'] / units / 0x2 + 0.4 - this['params']['cabinet']['offset']['back'] / units / 0x2),
    this['size_width'] = new Sizes_obj({
        'width': e / units,
        'text': e,
        'font_size': 0x32
    }),
    this['size_width']['position']['set'](0x0, this['const']['calculated_height'] / units, f),
    this['sizes']['add'](this['size_width']),
    this['params']['cabinet']['width2'])
      , h = this['params']['cabinet']['width'] / units / 0x2 - 0.4;
    0x2 == this['params']['version'] && (g = this['params']['cabinet']['width'] + this['params']['cabinet']['offset']['back'],
    h = this['params']['cabinet']['width'] / units / 0x2 - 0.4 + this['params']['cabinet']['offset']['back'] / units / 0x2),
    this['size_width_corner'] = new Sizes_obj({
        'width': g / units,
        'text': g,
        'font_size': 0x32
    }),
    this['size_width_corner']['position']['set'](h, this['const']['calculated_height'] / units, 0x0),
    this['size_width_corner']['rotation']['y'] = -Math['PI'] / 0x2,
    this['sizes']['add'](this['size_width_corner']),
    this['size_height'] = new Sizes_obj({
        'width': this['const']['calculated_height'] / units,
        'text': this['const']['calculated_height'],
        'font_size': 0x32
    }),
    this['size_height']['position']['set'](-this['params']['cabinet']['width'] / units / 0x2, this['const']['calculated_height'] / units / 0x2, f),
    this['size_height']['rotation']['z'] = Math['PI'] / 0x2,
    this['sizes']['add'](this['size_height']);
}
,
Cabinet_new['prototype']['build_corner_90_positions'] = function() {
    constructor_settings['core_v2'] ? this['cabinet']['position']['set'](0x0, 0x0, 0x0) : (0x2 == this['params']['version'] ? (this['cabinet']['position']['set'](-this['params']['cabinet']['offset']['back'] / units / 0x2, this['params']['cokol']['height'] / units, this['params']['cabinet']['offset']['back'] / units / 0x2),
    this['cokol']['position']['set'](-this['params']['cabinet']['offset']['back'] / units / 0x2, this['cokol']['position']['y'], this['params']['cabinet']['offset']['back'] / units / 0x2),
    this['sections']['position']['set'](-this['params']['cabinet']['offset']['back'] / units / 0x2, this['params']['cokol']['height'] / units, this['params']['cabinet']['offset']['back'] / units / 0x2),
    this['doors']['position']['x'] = -this['params']['cabinet']['offset']['back'] / units / 0x2,
    this['doors']['position']['z'] = this['params']['cabinet']['offset']['back'] / units / 0x2 - this['params']['cabinet']['thickness'] / units) : (this['cabinet']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2 - this['params']['tabletop']['offset']['back'] / units / 0x2, this['params']['cokol']['height'] / units, this['params']['tabletop']['offset']['back'] / units / 0x2),
    this['shelves']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2 - this['params']['tabletop']['offset']['back'] / units / 0x2, this['params']['cokol']['height'] / units, this['params']['tabletop']['offset']['back'] / units / 0x2),
    this['sections']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2 - this['params']['tabletop']['offset']['back'] / units / 0x2, this['params']['cokol']['height'] / units, this['params']['tabletop']['offset']['back'] / units / 0x2),
    this['doors']['position']['x'] = -this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2,
    this['doors']['position']['z'] = this['params']['tabletop']['offset']['back'] / units / 0x2,
    'left' == this['params']['cabinet']['orientation'] && (this['cabinet']['position']['x'] *= -0x1,
    this['doors']['position']['x'] *= -0x1)),
    this['cornice']['position']['y'] = this['cabinet']['position']['y'] + this['params']['cabinet']['height'] / units);
}
),
(Cabinet_new['prototype']['build_corner_open'] = function() {
    var f = this
      , g = f['cabinet']
      , j = f['const']['calculated_width'] / units
      , k = f['params']['cabinet']['height'] / units
      , m = f['const']['calculated_depth'] / units
      , q = f['params']['cabinet']['thickness_back'] / units
      , u = f['params']['cabinet']['back_wall_offset'] / units
      , v = f['params']['cabinet']['thickness'] / units
      , w = f['params']['cabinet']['material']
      , x = f['params']['cabinet']['orientation']
      , y = f['params']['cabinet']['end_corner_width'] / units
      , z = f['params']['cabinet']['end_corner_depth'] / units
      , u = (0x0 == z && (z = y),
    j < y && (y = j / 0x2),
    m < z && (z = m / 0x2),
    g['back_wall'] = new Object_wall({
        'width': j - v,
        'height': k,
        'thickness': v,
        'pX': v / 0x2,
        'pY': k / 0x2,
        'pZ': -m / 0x2 + v / 0x2,
        'material': w,
        'name': 'back_cab_wall'
    }),
    g['left_wall'] = new Object_wall({
        'width': m + u,
        'height': k,
        'thickness': v,
        'rY': Math['PI'] / 0x2,
        'pX': -j / 0x2 + v / 0x2,
        'pY': k / 0x2,
        'pZ': -u / 0x2,
        'material': w,
        'name': 'left_wall'
    }),
    j - v)
      , A = m - v
      , B = new THREE['Shape']();
    B['moveTo'](-u / 0x2, -A / 0x2),
    B['lineTo'](-u / 0x2, A / 0x2),
    B['lineTo'](u / 0x2 - y, A / 0x2),
    B['lineTo'](u / 0x2, A / 0x2 - z),
    B['lineTo'](u / 0x2, -A / 0x2),
    B['lineTo'](-u / 0x2, -A / 0x2),
    g['top_wall'] = new Object_wall({
        'width': u,
        'height': A,
        'thickness': v,
        'rX': Math['PI'] / 0x2,
        'pX': v / 0x2,
        'pY': k,
        'pZ': v / 0x2,
        'name': 'top_wall',
        'material': f['params']['cabinet']['material'],
        'shape': B
    }),
    g['bottom_wall'] = new Object_wall({
        'width': u,
        'height': A,
        'thickness': v,
        'rX': Math['PI'] / 0x2,
        'pX': v / 0x2,
        'pY': v,
        'pZ': v / 0x2,
        'name': 'top_wall',
        'material': f['params']['cabinet']['material'],
        'shape': B
    }),
    0x0 != this['params']['tabletop']['offset']['back'] && (g['end_corner_side_wall'] = new Object_wall({
        'width': this['params']['tabletop']['offset']['back'] / units,
        'height': k,
        'thickness': v,
        'rY': Math['PI'] / 0x2,
        'pX': j / 0x2 - v / 0x2,
        'pY': k / 0x2,
        'pZ': -m / 0x2 - this['params']['tabletop']['offset']['back'] / units / 0x2,
        'material': w,
        'name': 'end_side_wall'
    })),
    'left' === x && (g['left_wall']['position']['x'] = j / 0x2 - v / 0x2,
    g['back_wall']['position']['x'] = -v / 0x2,
    0x0 != this['params']['tabletop']['offset']['back'] && (g['end_corner_side_wall']['position']['x'] = -j / 0x2 + v / 0x2),
    g['top_wall']['rotation']['y'] = Math['PI'],
    g['bottom_wall']['rotation']['y'] = Math['PI'],
    g['top_wall']['position']['x'] = -v / 0x2,
    g['bottom_wall']['position']['x'] = -v / 0x2,
    g['top_wall']['position']['y'] = k - v,
    g['bottom_wall']['position']['y'] = 0x0),
    0x1 == this['params']['cabinet']['left_wall'] && g['add'](g['left_wall']),
    0x1 == this['params']['cabinet']['back_wall'] && g['add'](g['back_wall']),
    0x1 == this['params']['cabinet']['top_wall'] && g['add'](g['top_wall']),
    0x1 == this['params']['cabinet']['bottom_wall'] && g['add'](g['bottom_wall']),
    0x0 != this['params']['tabletop']['offset']['back'] && 0x1 == this['params']['cabinet']['end_corner_side_wall'] && g['add'](g['end_corner_side_wall']);
}
,
Cabinet_new['prototype']['build_sections_corner_open'] = function(f={}) {
    var g = this
      , h = new THREE['Box3']()['setFromObject'](this['cabinet'])['getSize'](new THREE['Vector3']())
      , j = (this['reset_model'](this['sections']),
    {
        'name': 'Секция',
        'width': '100%',
        'height': '100%',
        'starting_point_x': '0%',
        'starting_point_y': '0%',
        'direction_x': 'right',
        'direction_y': 'top',
        'offset_top': 0x0,
        'offset_bottom': 0x0,
        'position_offset_top': 0x0,
        'position_offset_bottom': 0x0,
        'group': g['params']['cabinet_group'],
        'pX': 0x0,
        'pY': 0x0,
        'pZ': 0x0,
        'rX': 0x0,
        'rY': 0x0,
        'rZ': 0x0
    });
    for (let p = 0x0; p < g['params']['sections']['length']; p++) {
        var k = g['params']['sections'][p], k, l = k = Object['assign']({}, j, k), m = ('string' == typeof l['offset_top'] && -0x1 < l['offset_top']['indexOf']('%') && (l['offset_top'] = g['params']['cabinet']['height'] * parseFloat(l['offset_top']) / 0x64),
        'string' == typeof l['offset_bottom'] && -0x1 < l['offset_bottom']['indexOf']('%') && (l['offset_bottom'] = g['params']['cabinet']['height'] * parseFloat(l['offset_bottom']) / 0x64),
        'string' == typeof l['width'] && -0x1 < l['width']['indexOf']('%') && (l['width'] = g['const']['calculated_width'] * parseFloat(l['width']) / 0x64),
        'string' == typeof l['height'] && -0x1 < l['height']['indexOf']('%') && (l['height'] = (g['params']['cabinet']['height'] - l['offset_top'] - l['offset_bottom']) * parseFloat(l['height']) / 0x64),
        'string' == typeof l['starting_point_x'] && -0x1 < l['starting_point_x']['indexOf']('%') ? 'center' === l['starting_point_x'] ? l['pX'] = 0x0 : 'right' === l['direction_x'] ? l['pX'] = g['const']['calculated_width'] * parseFloat(l['starting_point_x']) / 0x64 / units : l['pX'] = g['const']['calculated_width'] * parseFloat(l['starting_point_x']) / 0x64 / units - l['width'] / units : (l['direction_x'],
        l['pX'] = l['starting_point_x'] / units),
        'string' == typeof l['starting_point_y'] && -0x1 < l['starting_point_y']['indexOf']('%') ? 'center' === l['starting_point_y'] ? l['pY'] = 0x0 + h['y'] / 0x2 - l['height'] / units / 0x2 : 'top' === l['direction_y'] ? l['pY'] = 0x0 + g['params']['cabinet']['height'] * parseFloat(l['starting_point_y']) / 0x64 / units - l['position_offset_top'] / units + l['position_offset_bottom'] / units : l['pY'] = 0x0 + g['params']['cabinet']['height'] * parseFloat(l['starting_point_y']) / 0x64 / units - l['height'] / units - l['position_offset_top'] / units + l['position_offset_bottom'] / units : l['pY'] = 0x0 + l['starting_point_y'] / units - l['position_offset_top'] / units + l['position_offset_bottom'] / units,
        new THREE['Group']());
        m['temp_type'] = 'Section',
        this['sections']['add'](m),
        m['userData']['index'] = p,
        m['position']['set'](l['pX'], l['pY'], l['pZ']),
        k['lockers'] && (m['lockers'] = new THREE['Group'](),
        m['lockers']['name'] = 'section_lockers',
        m['add'](m['lockers']),
        g['build_lockers_common']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['lockers'],
            'params': k
        })),
        k['doors'] && (m['doors'] = new THREE['Group'](),
        m['doors']['name'] = 'section_doors',
        m['add'](m['doors']),
        g['build_doors_all']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['doors'],
            'params': k
        })),
        k['walls'] && (m['walls'] = new THREE['Group'](),
        m['walls']['name'] = 'section_walls',
        m['add'](m['walls']),
        g['build_walls_common']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['walls'],
            'params': k
        })),
        !k['shelves'] && 0x1 != k['shelves_auto'] || (m['shelves'] = new THREE['Group'](),
        m['shelves']['name'] = 'section_shelves',
        m['add'](m['shelves']),
        g['build_shelves_corner_open']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['shelves'],
            'params': k
        }));
    }
}
,
Cabinet_new['prototype']['build_tabletop_corner_open'] = function() {
    var f = this;
    if (!0x1 !== this['params']['tabletop']['active']) {
        var g, j = f['params']['tabletop']['offset']['left'], k = f['params']['tabletop']['offset']['right'], m = f['params']['tabletop']['offset']['front'], q = f['params']['tabletop']['offset']['back'], u = f['params']['tabletop']['height'], v = f['const']['calculated_width'], w = f['const']['calculated_depth'], x = f['params']['cabinet']['end_corner_width'] / units, y = f['params']['cabinet']['width'] / units, z = f['params']['cabinet']['depth'] / units;
        y < x && (x = y / 0x2);
        let A = f['params']['tabletop']['end_corner_cut_width'] / units
          , B = f['params']['tabletop']['end_corner_cut_depth'] / units;
        0x0 == A && (A = x),
        0x0 == B && (B = x);
        var x = new THREE['Shape'](), y = (x['moveTo'](-y / 0x2, -z / 0x2),
        x['lineTo'](-y / 0x2, z / 0x2),
        x['lineTo'](y / 0x2 - A, z / 0x2),
        x['lineTo'](y / 0x2, z / 0x2 - B),
        x['lineTo'](y / 0x2, -z / 0x2),
        x['lineTo'](-y / 0x2, -z / 0x2),
        new Tabletop({
            'height': u,
            'width': y * units,
            'depth': z * units,
            'holes': f['params']['tabletop']['holes'],
            'material': f['params']['tabletop']['material'],
            'id': void 0x0 !== f['params']['tabletop']['tabletop_id'] ? f['params']['tabletop']['tabletop_id'] : 0x0,
            'variant': void 0x0 !== f['params']['tabletop']['tabletop_variant'] ? f['params']['tabletop']['tabletop_variant'] : 0x0,
            'shape': x
        })), z;
        f['tabletop']['add'](y),
        'left' === f['params']['cabinet']['orientation'] && (y['rotation']['z'] = Math['PI'],
        y['position']['y'] = u / units),
        0x0 != this['params']['tabletop']['plints']['back'] && (z = new Decoration({
            'width': v + j + k,
            'height': 0x1e,
            'thickness': 0x14,
            'material': f['params']['tabletop']['material'],
            'model': '/common_assets/models/tp1.fbx'
        }),
        f['tabletop']['add'](z),
        z['position']['y'] = 0x1e / units / 0x2,
        z['position']['z'] = -(w + q + m) / units / 0x2 + 0x14 / units / 0x2);
    }
}
,
Cabinet_new['prototype']['build_cokol_corner_open'] = function() {
    if (!(this['params']['cokol']['height'] < 0x1)) {
        var f = this, g = f['cokol'], j = f['const']['calculated_width'] / units, k = f['const']['calculated_depth'] / units, m = f['params']['cokol']['height'] / units, q = f['params']['cokol']['thickness'] / units, u = f['params']['cabinet']['end_corner_width'] / units, v = f['params']['cokol']['material'], w, x = (j < u && (u = j / 0x2),
        Math['sqrt'](Math['pow'](k - u, 0x2) + Math['pow'](j, 0x2)) - q), y = Math['sqrt'](Math['pow'](x / 0x2, 0x2) - Math['pow']((j - q) / 0x2, 0x2)), x = Math['atan']((k - u) / (j - 0x2 * q)), w = (f['params']['cabinet']['width'] < 0xfa && 0x0 != f['params']['cokol']['legs'] ? (w = new CabinetLeg({
            'height': f['params']['cokol']['height'],
            'is_cokol_active': f['params']['cokol']['is_cokol_active']
        }),
        g['add'](w),
        w['position']['x'] = 0x0,
        w['position']['z'] = -k / 0x2 + w['params']['radius2'] / units / 0x2 + 0x2 * q,
        w = new CabinetLeg({
            'height': f['params']['cokol']['height'],
            'is_cokol_active': f['params']['cokol']['is_cokol_active']
        }),
        g['add'](w),
        w['position']['x'] = 0x0,
        w['position']['z'] = k / 0x2 - w['params']['radius2'] / units / 0x2 - 0x3 * q - u / 0x2) : 0x0 != f['params']['cokol']['legs'] && (w = new CabinetLeg({
            'height': f['params']['cokol']['height'],
            'is_cokol_active': f['params']['cokol']['is_cokol_active']
        }),
        g['add'](w),
        w['position']['x'] = -j / 0x2 + w['params']['radius2'] / units / 0x2 + 0x2 * q,
        w['position']['z'] = -k / 0x2 + w['params']['radius2'] / units / 0x2 + 0x2 * q,
        'left' === f['params']['cabinet']['orientation'] && (w['position']['x'] = j / 0x2 - w['params']['radius2'] / units / 0x2 - 0x2 * q),
        w = new CabinetLeg({
            'height': f['params']['cokol']['height'],
            'is_cokol_active': f['params']['cokol']['is_cokol_active']
        }),
        g['add'](w),
        w['position']['x'] = j / 0x2 - w['params']['radius2'] / units / 0x2 - 0x3 * q,
        w['position']['z'] = -k / 0x2 + w['params']['radius2'] / units / 0x2 + 0x2 * q,
        'left' === f['params']['cabinet']['orientation'] && (w['position']['x'] = -j / 0x2 + w['params']['radius2'] / units / 0x2 + 0x3 * q),
        w = new CabinetLeg({
            'height': f['params']['cokol']['height'],
            'is_cokol_active': f['params']['cokol']['is_cokol_active']
        }),
        g['add'](w),
        w['position']['x'] = -j / 0x2 + w['params']['radius2'] / units / 0x2 + 0x2 * q,
        w['position']['z'] = k / 0x2 - w['params']['radius2'] / units / 0x2 - 0x3 * q - u / 0x2,
        'left' === f['params']['cabinet']['orientation'] && (w['position']['x'] = j / 0x2 - w['params']['radius2'] / units / 0x2 - 0x2 * q),
        w = new CabinetLeg({
            'height': f['params']['cokol']['height'],
            'is_cokol_active': f['params']['cokol']['is_cokol_active']
        }),
        g['add'](w),
        w['position']['x'] = j / 0x2 - w['params']['radius2'] / units / 0x2 - 0x3 * q - u / 0x2,
        w['position']['z'] = k / 0x2 - w['params']['radius2'] / units / 0x2 - 0x3 * q - u / 0x2 - u / 0x2,
        'left' === f['params']['cabinet']['orientation']) && (w['position']['x'] = -j / 0x2 + w['params']['radius2'] / units / 0x2 + 0x3 * q + u / 0x2),
        get_hypo(u, u));
        if ('left' === f['params']['cabinet']['orientation']) {
            x *= -0x1,
            g['front'] = new CabinetCokol({
                'width': (j - u) * units,
                'height': m * units,
                'thickness': q * units,
                'pX': j / 0x2 - (j - u) / 0x2,
                'pZ': k / 0x2 - f['params']['cabinet']['thickness'] / units / 0x2 - q / 0x2,
                'pY': m / 0x2,
                'material': v,
                'name': 'cokol_front'
            }),
            g['front2'] = new CabinetCokol({
                'width': (w - q / 1.5) * units,
                'height': m * units,
                'thickness': q * units,
                'pX': -j / 0x2 + u / 0x2 + f['params']['cabinet']['thickness'] / units / 0x2 + q / 0xc,
                'pZ': k / 0x2 - u / 0x2 - f['params']['cabinet']['thickness'] / units / 0x2 - q / 0xc,
                'pY': m / 0x2,
                'material': v,
                'name': 'cokol_front',
                'rY': -Math['PI'] / 0x4
            });
            let z = (k - u) * units
              , A = -u / 0x2;
            0x0 < f['params']['tabletop']['offset']['back'] && 0x1 == f['params']['cabinet']['end_corner_side_wall'] && (z = (k - u) * units + f['params']['tabletop']['offset']['back'],
            A -= f['params']['tabletop']['offset']['back'] / units / 0x2),
            g['left'] = new CabinetCokol({
                'width': z,
                'height': m * units,
                'thickness': q * units,
                'rY': -Math['PI'] / 0x2,
                'pY': m / 0x2,
                'pX': -j / 0x2 + q / 0x2 + f['params']['cabinet']['thickness'] / units / 0x2,
                'pZ': A,
                'material': v,
                'name': 'cokol_left'
            }),
            g['right'] = new CabinetCokol({
                'width': k * units,
                'height': m * units,
                'thickness': q * units,
                'rY': Math['PI'] / 0x2,
                'pY': m / 0x2,
                'pX': j / 0x2 - q / 0x2,
                'pZ': 0x0,
                'material': v,
                'name': 'cokol_right'
            });
        } else {
            g['front'] = new CabinetCokol({
                'width': (j - u) * units,
                'height': m * units,
                'thickness': q * units,
                'pX': -j / 0x2 + (j - u) / 0x2,
                'pZ': k / 0x2 - f['params']['cabinet']['thickness'] / units / 0x2 - q / 0x2,
                'pY': m / 0x2,
                'material': v,
                'name': 'cokol_front'
            }),
            g['front2'] = new CabinetCokol({
                'width': (w - q / 1.5) * units,
                'height': m * units,
                'thickness': q * units,
                'pX': j / 0x2 - u / 0x2 - f['params']['cabinet']['thickness'] / units / 0x2 - q / 0xc,
                'pZ': k / 0x2 - u / 0x2 - f['params']['cabinet']['thickness'] / units / 0x2 - q / 0xc,
                'pY': m / 0x2,
                'material': v,
                'name': 'cokol_front',
                'rY': Math['PI'] / 0x4
            });
            let B = (k - u) * units
              , C = -u / 0x2;
            0x0 < f['params']['tabletop']['offset']['back'] && 0x1 == f['params']['cabinet']['end_corner_side_wall'] && (B = (k - u) * units + f['params']['tabletop']['offset']['back'],
            C -= f['params']['tabletop']['offset']['back'] / units / 0x2),
            g['right'] = new CabinetCokol({
                'width': B,
                'height': m * units,
                'thickness': q * units,
                'rY': Math['PI'] / 0x2,
                'pY': m / 0x2,
                'pX': j / 0x2 - q / 0x2 - f['params']['cabinet']['thickness'] / units / 0x2,
                'pZ': C,
                'material': v,
                'name': 'cokol_left'
            }),
            g['left'] = new CabinetCokol({
                'width': k * units,
                'height': m * units,
                'thickness': q * units,
                'rY': Math['PI'] / 0x2,
                'pY': m / 0x2,
                'pX': -j / 0x2 + q / 0x2,
                'pZ': 0x0,
                'material': v,
                'name': 'cokol_right'
            });
        }
        g['back'] = new CabinetCokol({
            'width': j * units,
            'height': m * units,
            'thickness': q * units,
            'pZ': -k / 0x2 + q / 0x2,
            'pY': m / 0x2,
            'material': v,
            'name': 'cokol_back'
        }),
        f['params']['cabinet']['orientation'],
        g['right']['visible'] = f['params']['cokol']['visible']['right'],
        g['left']['visible'] = f['params']['cokol']['visible']['left'],
        g['back']['visible'] = f['params']['cokol']['visible']['back'],
        g['front']['visible'] = f['params']['cokol']['visible']['front'],
        g['add'](g['front']),
        g['add'](g['front2']),
        g['add'](g['left']),
        g['add'](g['right']),
        g['add'](g['back']);
    }
}
,
Cabinet_new['prototype']['build_shelves_corner_open'] = function(f={}) {
    var g = this
      , j = new THREE['Box3']()['setFromObject'](this['cabinet'])['getSize'](new THREE['Vector3']())
      , k = {
        'width': void 0x0 !== f['width'] ? f['width'] : g['const']['calculated_width'],
        'height': (void 0x0 !== f['height'] ? f : g['params']['cabinet'])['height'],
        'obj_to_add': void 0x0 !== f['obj_to_add'] ? f['obj_to_add'] : this['shelves'],
        'params': (void 0x0 !== f['params'] ? f : g)['params']
    };
    k['params']['shelves_auto'] && this['build_shelves_auto'](k);
    let m = g['cabinet']['position']['y'];
    -0x1 < k['obj_to_add']['name']['indexOf']('section_') && (m = 0x0);
    for (var q = 0x0; q < k['params']['shelves']['length']; q++) {
        var u = k['params']['shelves'][q]
          , u = {
            'width': void 0x0 !== u['width'] ? u['width'] : '100%',
            'height': void 0x0 !== u['depth'] ? u['depth'] : g['const']['calculated_depth'] - project_settings['shelve_offset'],
            'thickness': void 0x0 !== u['height'] ? u['height'] : project_settings['shelves_thickness'],
            'orientation': void 0x0 !== u['orientation'] ? u['orientation'] : 'horizontal',
            'material': g['params']['cabinet']['material'],
            'fixed_material': void 0x0 !== u['fixed_material'] ? u['fixed_material'] : null,
            'starting_point_x': void 0x0 !== u['starting_point_x'] ? u['starting_point_x'] : '50%',
            'starting_point_y': void 0x0 !== u['starting_point_y'] ? u['starting_point_y'] : '0%',
            'position_offset_top': void 0x0 !== u['position_offset_top'] ? u['position_offset_top'] : 0x0,
            'position_offset_bottom': void 0x0 !== u['position_offset_bottom'] ? u['position_offset_bottom'] : 0x0,
            'direction_x': void 0x0 !== u['direction_x'] ? u['direction_x'] : 'right',
            'direction_y': void 0x0 !== u['direction_y'] ? u['direction_y'] : 'top',
            'pX': u['pX'] || 0x0,
            'pY': u['pY'] || g['cabinet']['position']['y'],
            'pZ': u['pZ'] || -project_settings['shelve_offset'] / units / 0x2,
            'rX': u['rX'] || Math['PI'] / 0x2,
            'rY': u['rY'] || 0x0,
            'rZ': u['rZ'] || 0x0
        }
          , v = ('string' == typeof u['width'] && -0x1 < u['width']['indexOf']('%') && (u['width'] = 'vertical' === u['orientation'] ? (g['params']['cabinet']['height'] - 0x2 * g['params']['cabinet']['thickness']) * parseFloat(u['width']) / 0x64 : (g['const']['calculated_width'] - g['params']['cabinet']['thickness']) * parseFloat(u['width']) / 0x64),
        'string' == typeof u['height'] && -0x1 < u['height']['indexOf']('%') && (u['height'] = g['params']['cabinet']['depth'] * parseFloat(u['height']) / 0x64),
        'string' == typeof u['starting_point_x'] && -0x1 < u['starting_point_x']['indexOf']('%') && (u['pX'] = 'center' === u['starting_point_x'] ? -u['width'] / units / 0x2 : 'right' === u['direction_x'] ? -g['const']['calculated_width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(u['starting_point_x']) / 0x64 / units : -g['const']['calculated_width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(u['starting_point_x']) / 0x64 / units - u['width'] / units),
        'string' == typeof u['starting_point_y'] && -0x1 < u['starting_point_y']['indexOf']('%') && (u['pY'] = 'center' === u['starting_point_y'] ? m + j['y'] / 0x2 - u['height'] / units / 0x2 : 'top' === u['direction_y'] ? 'horizontal' === u['orientation'] ? m + (k['height'] - u['position_offset_top']) * parseFloat(u['starting_point_y']) / 0x64 / units : m + (k['height'] - u['position_offset_top']) * parseFloat(u['starting_point_y']) / 0x64 / units + u['width'] / units / 0x2 : 'horizontal' === u['orientation'] ? m + k['height'] * parseFloat(u['starting_point_y']) / 0x64 / units - u['height'] / units : m + k['height'] * parseFloat(u['starting_point_y']) / 0x64 / units - u['width'] / units / 0x2),
        'vertical' === u['orientation'] && (u['rY'] = Math['PI'] / 0x2),
        u['width'] /= units,
        u['height'] /= units,
        u['thickness'] /= units,
        g['params']['cabinet']['end_corner_width'] / units)
          , w = g['params']['cabinet']['end_corner_depth'] / units
          , x = (0x0 == w && (w = v),
        u['width'] < v && (v = u['width'] / 0x2),
        u['depth'] < w && (w = u['depth'] / 0x2),
        new THREE['Shape']())
          , y = g['const']['calculated_width'] / units - g['params']['cabinet']['thickness'] / units
          , z = g['const']['calculated_depth'] / units - g['params']['cabinet']['thickness'] / units
          , v = (x['moveTo'](-y / 0x2, -z / 0x2),
        x['lineTo'](-y / 0x2, z / 0x2),
        x['lineTo'](y / 0x2 - v, z / 0x2),
        x['lineTo'](y / 0x2, z / 0x2 - w),
        x['lineTo'](y / 0x2, -z / 0x2),
        x['lineTo'](-y / 0x2, -z / 0x2),
        u['shape'] = x,
        u['pX'] = this['params']['cabinet']['thickness'] / units / 0x2,
        u['pZ'] = this['params']['cabinet']['thickness'] / units / 0x2,
        'left' === g['params']['cabinet']['orientation'] && (u['rY'] = Math['PI'],
        u['pY'] -= u['thickness'],
        u['pX'] = -this['params']['cabinet']['thickness'] / units / 0x2),
        u['fixed_material'] && null != u['fixed_material'] && materials_lib['items'][u['fixed_material']] && (u['material'] = u['fixed_material']),
        new Object_wall(u));
        k['obj_to_add']['add'](v);
    }
}
,
Cabinet_new['prototype']['build_cornice_corner_open'] = function() {
    var f = this, g = this['cornice'], h = f['params']['cornice'], j = project_settings['selected_molded_model'] && 0x1 < h['level'], k = Math['sqrt'](Math['pow'](f['params']['cabinet']['end_corner_width'], 0x2) + Math['pow'](f['params']['cabinet']['end_corner_depth'], 0x2)), l = Math['atan'](f['params']['cabinet']['end_corner_depth'] / f['params']['cabinet']['end_corner_width']), m;
    let p;
    j && (p = (p = molded_lib['items'][project_settings['selected_molded_model']]['height']) || 0x9),
    h['visible']['front'] && (m = {
        'model': h['model'],
        'width': f['const']['calculated_width'] - f['params']['cabinet']['end_corner_width'],
        'type': 'straight'
    },
    'left' === f['params']['cabinet']['orientation'] ? m['angle_left'] = l / 0x2 : m['angle_right'] = -l / 0x2,
    g['front'] = new Cornice(m),
    g['front']['position']['x'] = f['const']['calculated_width'] / units / 0x2 - g['front']['params']['width'] / units / 0x2,
    g['front']['position']['z'] = f['const']['calculated_depth'] / units / 0x2,
    g['add'](g['front']),
    j && (g['front_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['const']['calculated_width'] - (f['params']['cabinet']['end_corner_width'] - f['params']['cabinet']['thickness']),
        'type': 'straight_lvl2'
    }),
    g['front_m']['position']['x'] = f['const']['calculated_width'] / units / 0x2 - g['front']['params']['width'] / units / 0x2,
    g['front_m']['position']['z'] = f['const']['calculated_depth'] / units / 0x2,
    g['front']['position']['y'] = p,
    g['add'](g['front_m'])),
    'left' !== f['params']['cabinet']['orientation']) && (g['front']['position']['x'] = -f['const']['calculated_width'] / units / 0x2 + g['front']['params']['width'] / units / 0x2,
    j) && (g['front_m']['position']['x'] = -f['const']['calculated_width'] / units / 0x2 + g['front']['params']['width'] / units / 0x2),
    h['visible']['right'] && ('left' === f['params']['cabinet']['orientation'] ? (g['right'] = new Cornice({
        'model': h['model'],
        'width': f['const']['calculated_depth'],
        'type': 'straight'
    }),
    g['right']['rotation']['y'] = Math['PI'] / 0x2,
    g['right']['position']['set'](f['const']['calculated_width'] / 0x2 / units, 0x0, 0x0),
    g['add'](g['right']),
    j && (g['right_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['const']['calculated_depth'],
        'type': 'straight_lvl2'
    }),
    g['right_m']['rotation']['y'] = Math['PI'] / 0x2,
    g['right_m']['position']['set'](f['const']['calculated_width'] / 0x2 / units, 0x0, 0x0),
    g['front_corner_right_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['corner_model_45'],
        'type': 'corner_45'
    }),
    g['front_corner_right_m']['rotation']['y'] = 0x0,
    g['front_corner_right_m']['position']['set'](f['const']['calculated_width'] / 0x2 / units, 0x0, f['const']['calculated_depth'] / units / 0x2),
    g['right']['position']['y'] = p,
    g['front_corner_right']['position']['y'] = p,
    g['add'](g['right_m']),
    g['add'](g['front_corner_right_m']))) : (g['right'] = new Cornice({
        'model': h['model'],
        'width': k,
        'type': 'straight',
        'angle_right': -Math['PI'] / 0x4 + l / 0x2,
        'angle_left': l / 0x2
    }),
    g['right']['rotation']['y'] = l,
    g['right']['position']['set'](f['const']['calculated_width'] / units / 0x2 - f['params']['cabinet']['end_corner_width'] / units / 0x2, 0x0, f['const']['calculated_depth'] / units / 0x2 - f['params']['cabinet']['end_corner_depth'] / units / 0x2),
    g['back_right'] = new Cornice({
        'model': h['model'],
        'width': f['const']['calculated_depth'] - f['params']['cabinet']['end_corner_depth'],
        'type': 'straight',
        'angle_left': Math['PI'] / 0x4 - l / 0x2
    }),
    g['back_right']['rotation']['y'] = Math['PI'] / 0x2,
    g['back_right']['position']['set'](f['const']['calculated_width'] / units / 0x2, 0x0, -f['const']['calculated_depth'] / units / 0x2 + g['back_right']['params']['width'] / units / 0x2),
    g['add'](g['right']),
    g['add'](g['back_right']),
    j && (g['right_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': k,
        'type': 'straight'
    }),
    g['right_m']['rotation']['y'] = Math['PI'] / 0x4,
    g['right_m']['position']['set']((f['params']['cabinet']['width'] - (f['params']['cabinet']['end_corner_width'] - f['params']['cabinet']['thickness'])) / units / 0x2, 0x0, (f['const']['calculated_depth'] - (f['params']['cabinet']['end_corner_width'] - f['params']['cabinet']['thickness'])) / units / 0x2),
    g['back_right_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['const']['calculated_depth'] - (f['params']['cabinet']['end_corner_width'] - f['params']['cabinet']['thickness']),
        'type': 'straight'
    }),
    g['back_right_m']['rotation']['y'] = Math['PI'] / 0x2,
    g['back_right_m']['position']['set'](f['const']['calculated_width'] / units / 0x2, 0x0, -f['const']['calculated_depth'] / units / 0x2 + g['back_right']['params']['width'] / units / 0x2),
    g['right']['position']['y'] = p,
    g['back_right']['position']['y'] = p,
    g['add'](g['right_m']),
    g['add'](g['back_right_m'])))),
    h['visible']['left'] && ('left' === f['params']['cabinet']['orientation'] ? (g['left'] = new Cornice({
        'model': h['model'],
        'width': k,
        'type': 'straight',
        'angle_left': Math['PI'] / 0x4 - l / 0x2,
        'angle_right': -l / 0x2
    }),
    g['left']['rotation']['y'] = -l,
    g['left']['position']['set'](-f['const']['calculated_width'] / units / 0x2 + f['params']['cabinet']['end_corner_width'] / units / 0x2, 0x0, f['const']['calculated_depth'] / units / 0x2 - f['params']['cabinet']['end_corner_depth'] / units / 0x2),
    g['back_left'] = new Cornice({
        'model': h['model'],
        'width': f['const']['calculated_depth'] - f['params']['cabinet']['end_corner_depth'],
        'type': 'straight',
        'angle_right': -Math['PI'] / 0x4 + l / 0x2
    }),
    g['back_left']['rotation']['y'] = -Math['PI'] / 0x2,
    g['back_left']['position']['set'](-f['const']['calculated_width'] / units / 0x2, 0x0, -f['const']['calculated_depth'] / units / 0x2 + g['back_left']['params']['width'] / units / 0x2),
    g['add'](g['left']),
    g['add'](g['back_left']),
    j && (g['left_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': k,
        'type': 'straight'
    }),
    g['left_m']['rotation']['y'] = -Math['PI'] / 0x4,
    g['left_m']['position']['set'](-0x1 * (f['params']['cabinet']['width'] - (f['params']['cabinet']['end_corner_width'] - f['params']['cabinet']['thickness'])) / units / 0x2, 0x0, (f['const']['calculated_depth'] - (f['params']['cabinet']['end_corner_width'] - f['params']['cabinet']['thickness'])) / units / 0x2),
    g['back_left_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['const']['calculated_depth'] - (f['params']['cabinet']['end_corner_width'] - f['params']['cabinet']['thickness']),
        'type': 'straight'
    }),
    g['back_left_m']['rotation']['y'] = -Math['PI'] / 0x2,
    g['back_left_m']['position']['set'](-f['const']['calculated_width'] / units / 0x2, 0x0, -f['const']['calculated_depth'] / units / 0x2 + g['back_left']['params']['width'] / units / 0x2),
    g['left']['position']['y'] = p,
    g['back_left']['position']['y'] = p,
    g['add'](g['left_m']),
    g['add'](g['back_left_m']))) : (g['left'] = new Cornice({
        'model': h['model'],
        'width': f['const']['calculated_depth'],
        'type': 'straight'
    }),
    g['left']['rotation']['y'] = -Math['PI'] / 0x2,
    g['left']['position']['set'](-f['const']['calculated_width'] / 0x2 / units, 0x0, 0x0),
    g['add'](g['left']),
    j && (g['left_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['const']['calculated_depth'],
        'type': 'straight'
    }),
    g['left_m']['rotation']['y'] = -Math['PI'] / 0x2,
    g['left_m']['position']['set'](-f['const']['calculated_width'] / 0x2 / units, 0x0, 0x0),
    g['left_m']['position']['y'] = p,
    g['add'](g['left_m']))));
}
,
Cabinet_new['prototype']['build_positions_corner_open'] = function() {
    if (0x2 == this['params']['version']) {
        let e = -this['params']['tabletop']['depth'] / units / 0x2 + this['params']['cabinet']['depth'] / units / 0x2 + this['params']['cabinet']['offset']['back'] / units;
        'top' == this['params']['cabinet_group'] && (e = this['params']['cabinet']['offset']['back'] / units),
        this['cabinet']['position']['set'](0x0, this['params']['cokol']['height'] / units, e),
        this['cokol']['position']['set'](0x0, this['cokol']['position']['y'], e),
        this['sections']['position']['set'](0x0, this['params']['cokol']['height'] / units, e),
        this['walls']['position']['set'](0x0, this['params']['cokol']['height'] / units, e),
        this['built_in_models']['position']['set'](0x0, this['params']['cokol']['height'] / units, e),
        this['lockers']['position']['z'] = e,
        this['sizes']['position']['z'] = e,
        this['models']['position']['z'] = e,
        this['doors']['position']['z'] = e,
        this['decorations']['position']['z'] = e,
        this['shelves']['position']['z'] = e;
    } else
        this['cabinet']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['params']['cokol']['height'] / units, -this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['cabinet']['back_wall_offset'] / units / 0x2),
        this['cokol']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['cokol']['position']['y'], -this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2),
        this['sections']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['params']['cokol']['height'] / units, -this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2),
        this['lockers']['position']['z'] = -this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2,
        this['sizes']['position']['z'] = this['params']['cabinet']['back_wall_offset'] / units / 0x2,
        this['models']['position']['z'] = -this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2,
        this['doors']['position']['z'] = -this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2,
        this['shelves']['position']['x'] = -this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2,
        this['shelves']['position']['z'] = -this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['cabinet']['back_wall_offset'] / units / 0x2;
    this['cornice']['position']['y'] = this['cabinet']['position']['y'] + this['params']['cabinet']['height'] / units;
}
,
Cabinet_new['prototype']['build_corner_open_facade'] = function() {
    var f = this
      , g = f['cabinet']
      , j = f['const']['calculated_width'] / units
      , k = f['params']['cabinet']['height'] / units
      , m = f['const']['calculated_depth'] / units
      , q = f['params']['cabinet']['thickness_back'] / units
      , u = f['params']['cabinet']['back_wall_offset'] / units
      , v = f['params']['cabinet']['thickness'] / units
      , w = f['params']['cabinet']['material']
      , x = f['params']['cabinet']['orientation']
      , y = (0xaa - f['params']['cabinet']['thickness']) / units
      , q = (g['back_wall'] = new Object_wall({
        'width': j,
        'height': k,
        'thickness': q,
        'pX': 0x0,
        'pY': k / 0x2,
        'pZ': -m / 0x2 + v - q / 0x2,
        'material': f['params']['cabinet']['back_wall_material']['id'],
        'name': 'back_wall'
    }),
    g['left_wall'] = new Object_wall({
        'width': m - v + u,
        'height': k,
        'thickness': v,
        'rY': Math['PI'] / 0x2,
        'pX': -j / 0x2 + v / 0x2,
        'pY': k / 0x2,
        'pZ': v / 0x2 - u / 0x2,
        'material': w,
        'name': 'left_wall'
    }),
    g['right_wall'] = new Object_wall({
        'width': m + u - y,
        'height': k - 0x2 * v,
        'thickness': v,
        'rY': Math['PI'] / 0x2,
        'pX': j / 0x2 - v / 0x2,
        'pY': k / 0x2,
        'pZ': v / 0x2 - u / 0x2 - m / 0x2 + (m - v + u - y) / 0x2,
        'material': w,
        'name': 'right_wall'
    }),
    j - v)
      , u = m - v
      , w = new THREE['Shape']();
    w['moveTo'](-q / 0x2, -u / 0x2),
    w['lineTo'](-q / 0x2, u / 0x2),
    w['lineTo'](q / 0x2 - y, u / 0x2),
    w['lineTo'](q / 0x2, u / 0x2 - y),
    w['lineTo'](q / 0x2, -u / 0x2),
    w['lineTo'](-q / 0x2, -u / 0x2),
    g['top_wall'] = new Object_wall({
        'width': q,
        'height': u,
        'thickness': v,
        'rX': Math['PI'] / 0x2,
        'pX': v / 0x2,
        'pY': k,
        'pZ': v / 0x2,
        'name': 'top_wall',
        'material': f['params']['cabinet']['material'],
        'shape': w
    }),
    g['bottom_wall'] = new Object_wall({
        'width': q,
        'height': u,
        'thickness': v,
        'rX': Math['PI'] / 0x2,
        'pX': v / 0x2,
        'pY': v,
        'pZ': v / 0x2,
        'name': 'top_wall',
        'material': f['params']['cabinet']['material'],
        'shape': w
    }),
    'left' === x && (g['left_wall']['position']['x'] = j / 0x2 - v / 0x2,
    g['right_wall']['position']['x'] = -j / 0x2 + v / 0x2,
    g['top_wall']['rotation']['y'] = Math['PI'],
    g['bottom_wall']['rotation']['y'] = Math['PI'],
    g['top_wall']['position']['x'] = -v / 0x2,
    g['bottom_wall']['position']['x'] = -v / 0x2,
    g['top_wall']['position']['y'] = k - v,
    g['bottom_wall']['position']['y'] = 0x0),
    g['add'](g['back_wall']),
    g['add'](g['left_wall']),
    g['add'](g['right_wall']),
    g['add'](g['top_wall']),
    g['add'](g['bottom_wall']);
}
,
Cabinet_new['prototype']['build_tabletop_corner_open_facade'] = function() {
    var f = this, g, j, k, m, q, u, v, w, x, y, z, A, x, y;
    !0x1 !== this['params']['tabletop']['active'] && (j = f['params']['tabletop']['offset']['left'],
    k = f['params']['tabletop']['offset']['right'],
    m = f['params']['tabletop']['offset']['front'],
    q = f['params']['tabletop']['offset']['back'],
    u = f['params']['tabletop']['height'],
    v = f['const']['calculated_width'],
    w = f['const']['calculated_depth'],
    x = 0xaa / units,
    y = f['params']['cabinet']['width'] / units,
    z = f['params']['cabinet']['depth'] / units,
    (A = new THREE['Shape']())['moveTo'](-y / 0x2, -z / 0x2),
    A['lineTo'](-y / 0x2, z / 0x2),
    A['lineTo'](y / 0x2 - x, z / 0x2),
    A['lineTo'](y / 0x2, z / 0x2 - x),
    A['lineTo'](y / 0x2, -z / 0x2),
    A['lineTo'](-y / 0x2, -z / 0x2),
    x = new Tabletop({
        'height': u,
        'width': y * units,
        'depth': z * units,
        'holes': f['params']['tabletop']['holes'],
        'material': f['params']['tabletop']['material'],
        'id': void 0x0 !== f['params']['tabletop']['tabletop_id'] ? f['params']['tabletop']['tabletop_id'] : 0x0,
        'variant': void 0x0 !== f['params']['tabletop']['tabletop_variant'] ? f['params']['tabletop']['tabletop_variant'] : 0x0,
        'shape': A
    }),
    f['tabletop']['add'](x),
    'left' === f['params']['cabinet']['orientation'] && (x['rotation']['z'] = Math['PI'],
    x['position']['y'] = u / units),
    0x0 != this['params']['tabletop']['plints']['back']) && (y = new Decoration({
        'width': v + j + k,
        'height': 0x1e,
        'thickness': 0x14,
        'material': f['params']['tabletop']['material'],
        'model': '/common_assets/models/tp1.fbx'
    }),
    f['tabletop']['add'](y),
    y['position']['y'] = 0x1e / units / 0x2,
    y['position']['z'] = -(w + q + m) / units / 0x2 + 0x14 / units / 0x2);
}
,
Cabinet_new['prototype']['build_cokol_corner_open_facade'] = function() {
    var f, g, j, k, m, q, u, v, w, x, y, z;
    this['params']['cokol']['height'] < 0x1 || (g = (f = this)['cokol'],
    j = f['const']['calculated_width'] / units,
    k = f['const']['calculated_depth'] / units,
    m = f['params']['cokol']['height'] / units,
    q = f['params']['cokol']['thickness'] / units,
    u = 0xc8 / units,
    v = f['params']['cokol']['material'],
    x = Math['sqrt'](Math['pow'](k - u, 0x2) + Math['pow'](j, 0x2)) - q,
    y = Math['sqrt'](Math['pow'](x / 0x2, 0x2) - Math['pow']((j - q) / 0x2, 0x2)),
    z = Math['atan']((k - u) / (j - 0x2 * q)),
    f['params']['cabinet']['width'] < 0xfa && 0x0 != f['params']['cokol']['legs'] ? (w = new CabinetLeg({
        'height': f['params']['cokol']['height'],
        'is_cokol_active': f['params']['cokol']['is_cokol_active']
    }),
    g['add'](w),
    w['position']['x'] = 0x0,
    w['position']['z'] = -k / 0x2 + w['params']['radius2'] / units / 0x2 + 0x2 * q,
    w = new CabinetLeg({
        'height': f['params']['cokol']['height'],
        'is_cokol_active': f['params']['cokol']['is_cokol_active']
    }),
    g['add'](w),
    w['position']['x'] = 0x0,
    w['position']['z'] = k / 0x2 - w['params']['radius2'] / units / 0x2 - 0x3 * q - u / 0x2) : 0x0 != f['params']['cokol']['legs'] && (w = new CabinetLeg({
        'height': f['params']['cokol']['height'],
        'is_cokol_active': f['params']['cokol']['is_cokol_active']
    }),
    g['add'](w),
    w['position']['x'] = -j / 0x2 + w['params']['radius2'] / units / 0x2 + 0x2 * q,
    w['position']['z'] = -k / 0x2 + w['params']['radius2'] / units / 0x2 + 0x2 * q,
    'left' === f['params']['cabinet']['orientation'] && (w['position']['x'] = j / 0x2 - w['params']['radius2'] / units / 0x2 - 0x2 * q),
    w = new CabinetLeg({
        'height': f['params']['cokol']['height'],
        'is_cokol_active': f['params']['cokol']['is_cokol_active']
    }),
    g['add'](w),
    w['position']['x'] = j / 0x2 - w['params']['radius2'] / units / 0x2 - 0x3 * q,
    w['position']['z'] = -k / 0x2 + w['params']['radius2'] / units / 0x2 + 0x2 * q,
    'left' === f['params']['cabinet']['orientation'] && (w['position']['x'] = -j / 0x2 + w['params']['radius2'] / units / 0x2 + 0x3 * q),
    w = new CabinetLeg({
        'height': f['params']['cokol']['height'],
        'is_cokol_active': f['params']['cokol']['is_cokol_active']
    }),
    g['add'](w),
    w['position']['x'] = -j / 0x2 + w['params']['radius2'] / units / 0x2 + 0x2 * q,
    w['position']['z'] = k / 0x2 - w['params']['radius2'] / units / 0x2 - 0x3 * q - u / 0x2,
    'left' === f['params']['cabinet']['orientation'] && (w['position']['x'] = j / 0x2 - w['params']['radius2'] / units / 0x2 - 0x2 * q),
    (w = new CabinetLeg({
        'height': f['params']['cokol']['height'],
        'is_cokol_active': f['params']['cokol']['is_cokol_active']
    }))['position']['z'] = k / 0x2 - w['params']['radius2'] / units / 0x2 - 0x3 * q - u / 0x2 - u / 0x2,
    'left' === f['params']['cabinet']['orientation']) && (w['position']['x'] = -j / 0x2 + w['params']['radius2'] / units / 0x2 + 0x3 * q + u / 0x2),
    'left' === f['params']['cabinet']['orientation'] ? (z *= -0x1,
    g['front'] = new CabinetCokol({
        'width': (x + q) * units,
        'height': m * units,
        'thickness': q * units,
        'pZ': k / 0x2 - y - f['params']['cabinet']['thickness'] / units - q / 0x2,
        'pY': m / 0x2,
        'material': v,
        'name': 'cokol_front',
        'rY': z
    }),
    g['left'] = new CabinetCokol({
        'width': (u - 1.5 * q) * units,
        'height': m * units,
        'thickness': q * units,
        'rY': -Math['PI'] / 0x2,
        'pY': m / 0x2,
        'pX': -j / 0x2 + q / 0x2,
        'pZ': -k / 0x2 + u / 0x2 - q / 0x2 * 1.5 - f['params']['cabinet']['thickness_back'] / units,
        'material': v,
        'name': 'cokol_left'
    }),
    g['right'] = new CabinetCokol({
        'width': k * units,
        'height': m * units,
        'thickness': q * units,
        'rY': Math['PI'] / 0x2,
        'pY': m / 0x2,
        'pX': j / 0x2 - q / 0x2,
        'pZ': 0x0,
        'material': v,
        'name': 'cokol_right'
    })) : (g['front'] = new CabinetCokol({
        'width': (x + q) * units,
        'height': m * units,
        'thickness': q * units,
        'pZ': k / 0x2 - y - f['params']['cabinet']['thickness'] / units - q / 0x2,
        'pY': m / 0x2,
        'material': v,
        'name': 'cokol_front',
        'rY': z
    }),
    g['right'] = new CabinetCokol({
        'width': (u - 1.5 * q) * units,
        'height': m * units,
        'thickness': q * units,
        'rY': Math['PI'] / 0x2,
        'pY': m / 0x2,
        'pX': j / 0x2 - q / 0x2,
        'pZ': -k / 0x2 + u / 0x2 - q / 0x2 * 1.5 - f['params']['cabinet']['thickness_back'] / units,
        'material': v,
        'name': 'cokol_left'
    }),
    g['left'] = new CabinetCokol({
        'width': k * units,
        'height': m * units,
        'thickness': q * units,
        'rY': Math['PI'] / 0x2,
        'pY': m / 0x2,
        'pX': -j / 0x2 + q / 0x2,
        'pZ': 0x0,
        'material': v,
        'name': 'cokol_right'
    })),
    g['back'] = new CabinetCokol({
        'width': j * units,
        'height': m * units,
        'thickness': q * units,
        'pZ': -k / 0x2 + q / 0x2,
        'pY': m / 0x2,
        'material': v,
        'name': 'cokol_back'
    }),
    f['params']['cabinet']['orientation'],
    g['right']['visible'] = f['params']['cokol']['visible']['right'],
    g['left']['visible'] = f['params']['cokol']['visible']['left'],
    g['back']['visible'] = f['params']['cokol']['visible']['back'],
    g['front']['visible'] = f['params']['cokol']['visible']['front'],
    g['add'](g['front']),
    g['add'](g['left']),
    g['add'](g['right']),
    g['add'](g['back']));
}
,
Cabinet_new['prototype']['build_sections_corner_open_facade'] = function(f={}) {
    var g = this
      , h = new THREE['Box3']()['setFromObject'](this['cabinet'])['getSize'](new THREE['Vector3']())
      , j = (this['reset_model'](this['sections']),
    {
        'name': 'Секция',
        'width': '100%',
        'height': '100%',
        'starting_point_x': '0%',
        'starting_point_y': '0%',
        'direction_x': 'right',
        'direction_y': 'top',
        'offset_top': 0x0,
        'offset_bottom': 0x0,
        'position_offset_top': 0x0,
        'position_offset_bottom': 0x0,
        'group': g['params']['cabinet_group'],
        'pX': 0x0,
        'pY': 0x0,
        'pZ': 0x0,
        'rX': 0x0,
        'rY': 0x0,
        'rZ': 0x0
    });
    for (let p = 0x0; p < g['params']['sections']['length']; p++) {
        var k = g['params']['sections'][p], k, l = k = Object['assign']({}, j, k), m = ('string' == typeof l['offset_top'] && -0x1 < l['offset_top']['indexOf']('%') && (l['offset_top'] = g['params']['cabinet']['height'] * parseFloat(l['offset_top']) / 0x64),
        'string' == typeof l['offset_bottom'] && -0x1 < l['offset_bottom']['indexOf']('%') && (l['offset_bottom'] = g['params']['cabinet']['height'] * parseFloat(l['offset_bottom']) / 0x64),
        'string' == typeof l['width'] && -0x1 < l['width']['indexOf']('%') && (l['width'] = g['const']['calculated_width'] * parseFloat(l['width']) / 0x64),
        'string' == typeof l['height'] && -0x1 < l['height']['indexOf']('%') && (l['height'] = (g['params']['cabinet']['height'] - l['offset_top'] - l['offset_bottom']) * parseFloat(l['height']) / 0x64),
        'string' == typeof l['starting_point_x'] && -0x1 < l['starting_point_x']['indexOf']('%') ? 'center' === l['starting_point_x'] ? l['pX'] = 0x0 : 'right' === l['direction_x'] ? l['pX'] = g['const']['calculated_width'] * parseFloat(l['starting_point_x']) / 0x64 / units : l['pX'] = g['const']['calculated_width'] * parseFloat(l['starting_point_x']) / 0x64 / units - l['width'] / units : (l['direction_x'],
        l['pX'] = l['starting_point_x'] / units),
        'string' == typeof l['starting_point_y'] && -0x1 < l['starting_point_y']['indexOf']('%') ? 'center' === l['starting_point_y'] ? l['pY'] = 0x0 + h['y'] / 0x2 - l['height'] / units / 0x2 : 'top' === l['direction_y'] ? l['pY'] = 0x0 + g['params']['cabinet']['height'] * parseFloat(l['starting_point_y']) / 0x64 / units - l['position_offset_top'] / units + l['position_offset_bottom'] / units : l['pY'] = 0x0 + g['params']['cabinet']['height'] * parseFloat(l['starting_point_y']) / 0x64 / units - l['height'] / units - l['position_offset_top'] / units + l['position_offset_bottom'] / units : l['pY'] = 0x0 + l['starting_point_y'] / units - l['position_offset_top'] / units + l['position_offset_bottom'] / units,
        new THREE['Group']());
        m['temp_type'] = 'Section',
        this['sections']['add'](m),
        m['userData']['index'] = p,
        m['position']['set'](l['pX'], l['pY'], l['pZ']),
        k['lockers'] && (m['lockers'] = new THREE['Group'](),
        m['lockers']['name'] = 'section_lockers',
        m['add'](m['lockers']),
        g['build_lockers_common']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['lockers'],
            'params': k
        })),
        k['doors'] && (m['doors'] = new THREE['Group'](),
        m['doors']['name'] = 'section_doors',
        m['add'](m['doors']),
        g['build_doors_all']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['doors'],
            'params': k
        })),
        k['walls'] && (m['walls'] = new THREE['Group'](),
        m['walls']['name'] = 'section_walls',
        m['add'](m['walls']),
        g['build_walls_common']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['walls'],
            'params': k
        })),
        !k['shelves'] && 0x1 != k['shelves_auto'] || (m['shelves'] = new THREE['Group'](),
        m['shelves']['name'] = 'section_shelves',
        m['add'](m['shelves']),
        g['build_shelves_corner_open_facade']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['shelves'],
            'params': k
        }));
    }
}
,
Cabinet_new['prototype']['build_shelves_corner_open_facade'] = function(f={}) {
    var g = this
      , j = new THREE['Box3']()['setFromObject'](this['cabinet'])['getSize'](new THREE['Vector3']())
      , k = {
        'width': void 0x0 !== f['width'] ? f['width'] : g['const']['calculated_width'],
        'height': (void 0x0 !== f['height'] ? f : g['params']['cabinet'])['height'],
        'obj_to_add': void 0x0 !== f['obj_to_add'] ? f['obj_to_add'] : this['shelves'],
        'params': (void 0x0 !== f['params'] ? f : g)['params']
    };
    k['params']['shelves_auto'] && this['build_shelves_auto'](k);
    let m = g['cabinet']['position']['y'];
    -0x1 < k['obj_to_add']['name']['indexOf']('section_') && (m = 0x0);
    for (var q = 0x0; q < k['params']['shelves']['length']; q++) {
        var u = k['params']['shelves'][q]
          , u = {
            'width': void 0x0 !== u['width'] ? u['width'] : '100%',
            'height': void 0x0 !== u['depth'] ? u['depth'] : g['const']['calculated_depth'] - project_settings['shelve_offset'],
            'thickness': void 0x0 !== u['height'] ? u['height'] : project_settings['shelves_thickness'],
            'orientation': void 0x0 !== u['orientation'] ? u['orientation'] : 'horizontal',
            'material': g['params']['cabinet']['material'],
            'fixed_material': void 0x0 !== u['fixed_material'] ? u['fixed_material'] : null,
            'starting_point_x': void 0x0 !== u['starting_point_x'] ? u['starting_point_x'] : '50%',
            'starting_point_y': void 0x0 !== u['starting_point_y'] ? u['starting_point_y'] : '0%',
            'position_offset_top': void 0x0 !== u['position_offset_top'] ? u['position_offset_top'] : 0x0,
            'position_offset_bottom': void 0x0 !== u['position_offset_bottom'] ? u['position_offset_bottom'] : 0x0,
            'direction_x': void 0x0 !== u['direction_x'] ? u['direction_x'] : 'right',
            'direction_y': void 0x0 !== u['direction_y'] ? u['direction_y'] : 'top',
            'pX': u['pX'] || 0x0,
            'pY': u['pY'] || g['cabinet']['position']['y'],
            'pZ': u['pZ'] || -project_settings['shelve_offset'] / units / 0x2,
            'rX': u['rX'] || Math['PI'] / 0x2,
            'rY': u['rY'] || 0x0,
            'rZ': u['rZ'] || 0x0
        }
          , v = ('string' == typeof u['width'] && -0x1 < u['width']['indexOf']('%') && (u['width'] = 'vertical' === u['orientation'] ? (g['params']['cabinet']['height'] - 0x2 * g['params']['cabinet']['thickness']) * parseFloat(u['width']) / 0x64 : (g['const']['calculated_width'] - 0x2 * g['params']['cabinet']['thickness']) * parseFloat(u['width']) / 0x64),
        'string' == typeof u['height'] && -0x1 < u['height']['indexOf']('%') && (u['height'] = g['params']['cabinet']['depth'] * parseFloat(u['height']) / 0x64),
        'string' == typeof u['starting_point_x'] && -0x1 < u['starting_point_x']['indexOf']('%') && (u['pX'] = 'center' === u['starting_point_x'] ? -u['width'] / units / 0x2 : 'right' === u['direction_x'] ? -g['const']['calculated_width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(u['starting_point_x']) / 0x64 / units : -g['const']['calculated_width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(u['starting_point_x']) / 0x64 / units - u['width'] / units),
        'string' == typeof u['starting_point_y'] && -0x1 < u['starting_point_y']['indexOf']('%') && (u['pY'] = 'center' === u['starting_point_y'] ? m + j['y'] / 0x2 - u['height'] / units / 0x2 : 'top' === u['direction_y'] ? 'horizontal' === u['orientation'] ? m + (k['height'] - u['position_offset_top']) * parseFloat(u['starting_point_y']) / 0x64 / units : m + (k['height'] - u['position_offset_top']) * parseFloat(u['starting_point_y']) / 0x64 / units + u['width'] / units / 0x2 : 'horizontal' === u['orientation'] ? m + k['height'] * parseFloat(u['starting_point_y']) / 0x64 / units - u['height'] / units : m + k['height'] * parseFloat(u['starting_point_y']) / 0x64 / units - u['width'] / units / 0x2),
        'vertical' === u['orientation'] && (u['rY'] = Math['PI'] / 0x2),
        u['width'] /= units,
        u['height'] /= units,
        u['thickness'] /= units,
        (0xaa - g['params']['cabinet']['thickness']) / units)
          , w = new THREE['Shape']()
          , x = g['const']['calculated_width'] / units - g['params']['cabinet']['thickness'] / units
          , y = g['const']['calculated_depth'] / units - g['params']['cabinet']['thickness'] / units
          , v = (w['moveTo'](-x / 0x2, -y / 0x2),
        w['lineTo'](-x / 0x2, y / 0x2),
        w['lineTo'](x / 0x2 - v, y / 0x2),
        w['lineTo'](x / 0x2, y / 0x2 - v),
        w['lineTo'](x / 0x2, -y / 0x2),
        w['lineTo'](-x / 0x2, -y / 0x2),
        u['shape'] = w,
        u['pX'] = 0x0,
        u['pZ'] = 0x0,
        'left' === g['params']['cabinet']['orientation'] && (u['rY'] = Math['PI'],
        u['pY'] -= u['thickness']),
        u['fixed_material'] && null != u['fixed_material'] && materials_lib['items'][u['fixed_material']] && (u['material'] = u['fixed_material']),
        new Object_wall(u));
        k['obj_to_add']['add'](v);
    }
}
,
Cabinet_new['prototype']['build_cornice_corner_open_facade'] = function() {
    var f = this, g = this['cornice'], h = f['params']['cornice'], j = project_settings['selected_molded_model'] && 0x1 < h['level'], k = Math['sqrt'](Math['pow'](0xaa - f['params']['cabinet']['thickness'], 0x2) + Math['pow'](0xaa - f['params']['cabinet']['thickness'], 0x2)), l;
    let m;
    j && (m = (m = molded_lib['items'][project_settings['selected_molded_model']]['height']) || 0x9),
    h['visible']['front'] && (l = {
        'model': h['model'],
        'width': f['const']['calculated_width'] - (0xaa - f['params']['cabinet']['thickness']),
        'type': 'straight'
    },
    'left' === f['params']['cabinet']['orientation'] ? l['angle_left'] = Math['PI'] / 0x8 : l['angle_right'] = -Math['PI'] / 0x8,
    g['front'] = new Cornice(l),
    g['front']['position']['x'] = f['const']['calculated_width'] / units / 0x2 - g['front']['params']['width'] / units / 0x2,
    g['front']['position']['z'] = f['const']['calculated_depth'] / units / 0x2,
    g['add'](g['front']),
    j && (g['front_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['const']['calculated_width'] - (0xaa - f['params']['cabinet']['thickness']),
        'type': 'straight'
    }),
    g['front_m']['position']['x'] = f['const']['calculated_width'] / units / 0x2 - g['front']['params']['width'] / units / 0x2,
    g['front_m']['position']['z'] = f['const']['calculated_depth'] / units / 0x2,
    g['front']['position']['y'] = m,
    g['add'](g['front_m'])),
    'left' !== f['params']['cabinet']['orientation']) && (g['front']['position']['x'] = -f['const']['calculated_width'] / units / 0x2 + g['front']['params']['width'] / units / 0x2,
    j) && (g['front_m']['position']['x'] = -f['const']['calculated_width'] / units / 0x2 + g['front']['params']['width'] / units / 0x2),
    h['visible']['right'] && ('left' === f['params']['cabinet']['orientation'] ? (g['right'] = new Cornice({
        'model': h['model'],
        'width': f['const']['calculated_depth'],
        'type': 'straight'
    }),
    g['right']['rotation']['y'] = Math['PI'] / 0x2,
    g['right']['position']['set'](f['const']['calculated_width'] / 0x2 / units, 0x0, 0x0),
    g['add'](g['right']),
    j && (g['right_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['const']['calculated_depth'],
        'type': 'straight'
    }),
    g['right_m']['rotation']['y'] = Math['PI'] / 0x2,
    g['right_m']['position']['set'](f['const']['calculated_width'] / 0x2 / units, 0x0, 0x0),
    g['right']['position']['y'] = m,
    g['front_corner_right']['position']['y'] = m,
    g['add'](g['right_m']))) : (g['right'] = new Cornice({
        'model': h['model'],
        'width': k,
        'type': 'straight',
        'angle_left': Math['PI'] / 0x8,
        'angle_right': -Math['PI'] / 0x8
    }),
    g['right']['rotation']['y'] = Math['PI'] / 0x4,
    g['right']['position']['set']((f['params']['cabinet']['width'] - (0xaa - f['params']['cabinet']['thickness'])) / units / 0x2, 0x0, (f['const']['calculated_depth'] - (0xaa - f['params']['cabinet']['thickness'])) / units / 0x2),
    g['back_right'] = new Cornice({
        'model': h['model'],
        'width': f['const']['calculated_depth'] - (0xaa - f['params']['cabinet']['thickness']),
        'type': 'straight',
        'angle_left': Math['PI'] / 0x8
    }),
    g['back_right']['rotation']['y'] = Math['PI'] / 0x2,
    g['back_right']['position']['set'](f['const']['calculated_width'] / units / 0x2, 0x0, -f['const']['calculated_depth'] / units / 0x2 + g['back_right']['params']['width'] / units / 0x2),
    g['add'](g['right']),
    g['add'](g['back_right']),
    j && (g['right_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': k,
        'type': 'straight'
    }),
    g['right_m']['rotation']['y'] = Math['PI'] / 0x4,
    g['right_m']['position']['set']((f['params']['cabinet']['width'] - (0xaa - f['params']['cabinet']['thickness'])) / units / 0x2, 0x0, (f['const']['calculated_depth'] - (0xaa - f['params']['cabinet']['thickness'])) / units / 0x2),
    g['back_right_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['const']['calculated_depth'] - (0xaa - f['params']['cabinet']['thickness']),
        'type': 'straight'
    }),
    g['back_right_m']['rotation']['y'] = Math['PI'] / 0x2,
    g['back_right_m']['position']['set'](f['const']['calculated_width'] / units / 0x2, 0x0, -f['const']['calculated_depth'] / units / 0x2 + g['back_right']['params']['width'] / units / 0x2),
    g['right']['position']['y'] = m,
    g['back_right']['position']['y'] = m,
    g['add'](g['right_m']),
    g['add'](g['back_right_m'])))),
    h['visible']['left'] && ('left' === f['params']['cabinet']['orientation'] ? (g['left'] = new Cornice({
        'model': h['model'],
        'width': k,
        'type': 'straight',
        'angle_left': Math['PI'] / 0x8,
        'angle_right': -Math['PI'] / 0x8
    }),
    g['left']['rotation']['y'] = -Math['PI'] / 0x4,
    g['left']['position']['set'](-0x1 * (f['params']['cabinet']['width'] - (0xaa - f['params']['cabinet']['thickness'])) / units / 0x2, 0x0, (f['const']['calculated_depth'] - (0xaa - f['params']['cabinet']['thickness'])) / units / 0x2),
    g['back_left'] = new Cornice({
        'model': h['model'],
        'width': f['const']['calculated_depth'] - (0xaa - f['params']['cabinet']['thickness']),
        'type': 'straight',
        'angle_right': -Math['PI'] / 0x8
    }),
    g['back_left']['rotation']['y'] = -Math['PI'] / 0x2,
    g['back_left']['position']['set'](-f['const']['calculated_width'] / units / 0x2, 0x0, -f['const']['calculated_depth'] / units / 0x2 + g['back_left']['params']['width'] / units / 0x2),
    g['add'](g['left']),
    g['add'](g['back_left']),
    j && (g['left_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': k,
        'type': 'straight'
    }),
    g['left_m']['rotation']['y'] = -Math['PI'] / 0x4,
    g['left_m']['position']['set'](-0x1 * (f['params']['cabinet']['width'] - (0xaa - f['params']['cabinet']['thickness'])) / units / 0x2, 0x0, (f['const']['calculated_depth'] - (0xaa - f['params']['cabinet']['thickness'])) / units / 0x2),
    g['back_left_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['const']['calculated_depth'] - (0xaa - f['params']['cabinet']['thickness']),
        'type': 'straight'
    }),
    g['back_left_m']['rotation']['y'] = -Math['PI'] / 0x2,
    g['back_left_m']['position']['set'](-f['const']['calculated_width'] / units / 0x2, 0x0, -f['const']['calculated_depth'] / units / 0x2 + g['back_left']['params']['width'] / units / 0x2),
    g['left']['position']['y'] = m,
    g['back_left']['position']['y'] = m,
    g['add'](g['left_m']),
    g['add'](g['back_left_m']))) : (g['left'] = new Cornice({
        'model': h['model'],
        'width': f['const']['calculated_depth'],
        'type': 'straight'
    }),
    g['left']['rotation']['y'] = -Math['PI'] / 0x2,
    g['left']['position']['set'](-f['const']['calculated_width'] / 0x2 / units, 0x0, 0x0),
    g['add'](g['left']),
    j && (g['left_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['const']['calculated_depth'],
        'type': 'straight'
    }),
    g['left_m']['rotation']['y'] = -Math['PI'] / 0x2,
    g['left_m']['position']['set'](-f['const']['calculated_width'] / 0x2 / units, 0x0, 0x0),
    g['front_corner_left_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['corner_model_45'],
        'type': 'corner_45'
    }),
    g['left']['position']['y'] = m,
    g['front_corner_left']['position']['y'] = m,
    g['add'](g['left_m']))));
}
,
Cabinet_new['prototype']['build_positions_corner_open_facade'] = function() {
    0x2 == this['params']['version'] ? (this['cabinet']['position']['set'](0x0, this['params']['cokol']['height'] / units, 0x0),
    this['cokol']['position']['set'](0x0, this['cokol']['position']['y'], 0x0),
    this['sections']['position']['set'](0x0, this['params']['cokol']['height'] / units, 0x0),
    this['lockers']['position']['z'] = 0x0,
    this['sizes']['position']['z'] = 0x0,
    this['models']['position']['z'] = 0x0,
    this['doors']['position']['z'] = 0x0,
    this['shelves']['position']['z'] = 0x0) : (this['cabinet']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['params']['cokol']['height'] / units, -this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2),
    this['cokol']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['cokol']['position']['y'], -this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2),
    this['sections']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['params']['cokol']['height'] / units, -this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2),
    this['lockers']['position']['z'] = -this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2,
    this['sizes']['position']['z'] = this['params']['cabinet']['back_wall_offset'] / units / 0x2,
    this['models']['position']['z'] = -this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2,
    this['doors']['position']['z'] = -this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2,
    this['shelves']['position']['z'] = -this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2),
    this['cornice']['position']['y'] = this['cabinet']['position']['y'] + this['params']['cabinet']['height'] / units;
}
,
Cabinet_new['prototype']['build_end_corner_facade'] = function() {
    let g = this
      , j = g['cabinet']
      , k = g['const']['calculated_width'] / units
      , q = g['params']['cabinet']['height'] / units
      , v = g['const']['calculated_depth'] / units
      , w = g['params']['cabinet']['thickness_back'] / units
      , x = g['params']['cabinet']['back_wall_offset'] / units
      , y = g['params']['cabinet']['thickness'] / units
      , z = g['params']['cabinet']['material']
      , A = g['params']['cabinet']['orientation']
      , B = Math['max'](Math['abs']((g['params']['cabinet']['depth'] - g['params']['cabinet']['width'] - g['params']['cabinet']['thickness']) / units), 0x64 / units)
      , C = 'full'
      , D = 'full';
    for (let J = g['params']['doors']['length']; J--; )
        'right_wall' == g['params']['doors'][J]['tag'] && (D = g['params']['doors'][J]['style']),
        'left_wall' == g['params']['doors'][J]['tag'] && (C = g['params']['doors'][J]['style']);
    let E = B + g['params']['tabletop']['offset']['back'] / units;
    if (0x0 != g['params']['cabinet']['end_corner_side_wall_width'] && (E = g['params']['cabinet']['end_corner_side_wall_width'] / units),
    j['back_wall'] = new Object_wall({
        'width': k - y,
        'height': q,
        'thickness': w,
        'pX': 0x0,
        'pY': q / 0x2,
        'pZ': -v / 0x2 - w / 0x2 + 0.4,
        'material': g['params']['cabinet']['back_wall_material']['id'],
        'name': 'back_wall'
    }),
    'left' === A) {
        if ('facade' != g['params']['left_wall'] || 'facade_simple' != g['params']['left_wall']) {
            for (let K = g['params']['doors']['length']; K--; )
                'left_wall' == g['params']['doors'][K]['tag'] && (g['params']['doors']['splice'](K, 0x1),
                g['doors']['remove'](g['doors']['children'][K]));
        }
        if ('facade' == g['params']['cabinet']['left_wall'])
            g['params']['doors']['push']({
                'type': 'falsefacade',
                'allow_z': 0x1,
                'allow_x': 0x1,
                'allow_ry': 0x1,
                'facade': g['params']['facade']['id'],
                'material': g['params']['facade']['materials']['gen'],
                'style': C,
                'tag': 'left_wall',
                'width': E * units,
                'height': q * units,
                'thickness': y * units,
                'rY': -Math['PI'] / 0x2,
                'pX': 0x0,
                'pY': q / 0x2,
                'pZ': 0x0
            });
        else {
            if ('facade_simple' == g['params']['cabinet']['left_wall'])
                g['params']['doors']['push']({
                    'type': 'falsefacade',
                    'allow_z': 0x1,
                    'allow_x': 0x1,
                    'allow_ry': 0x1,
                    'facade': g['params']['facade']['id'],
                    'material': g['params']['facade']['materials']['gen'],
                    'fixed_facade_model': '/common_assets/models/plastic_full.fbx',
                    'style': C,
                    'tag': 'left_wall',
                    'width': E * units,
                    'height': q * units,
                    'thickness': y * units,
                    'rY': -Math['PI'] / 0x2,
                    'pX': 0x0,
                    'pY': q / 0x2,
                    'pZ': 0x0
                });
            else {
                let L = -g['params']['cabinet']['depth'] / units / 0x2 + B / 0x2 + g['params']['tabletop']['offset']['front'] / units / 0x2;
                0x2 == g['params']['version'] && (L = -g['params']['cabinet']['depth'] / units / 0x2 - g['params']['cabinet']['offset']['back'] / units / 0x2 + B / 0x2),
                0x0 != g['params']['cabinet']['end_corner_side_wall_width'] && (L = -g['params']['cabinet']['depth'] / units / 0x2 + E / 0x2 - (-this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2)),
                j['left_wall'] = new Object_wall({
                    'width': E,
                    'height': q,
                    'thickness': y,
                    'rY': Math['PI'] / 0x2,
                    'pX': -k / 0x2 + y / 0x2,
                    'pY': q / 0x2,
                    'pZ': L,
                    'material': z,
                    'name': 'left_wall'
                });
            }
        }
        j['right_wall'] = new Object_wall({
            'width': v,
            'height': q,
            'thickness': y,
            'rY': Math['PI'] / 0x2,
            'pX': k / 0x2 - y / 0x2,
            'pY': q / 0x2,
            'pZ': 0x0,
            'material': z,
            'name': 'left_wall'
        });
    } else {
        if ('facade' != g['params']['right_wall'] || 'facade_simple' != g['params']['right_wall']) {
            for (let N = g['params']['doors']['length']; N--; )
                'right_wall' == g['params']['doors'][N]['tag'] && (g['params']['doors']['splice'](N, 0x1),
                g['doors']['remove'](g['doors']['children'][N]));
        }
        if (j['left_wall'] = new Object_wall({
            'width': v,
            'height': q,
            'thickness': y,
            'rY': Math['PI'] / 0x2,
            'pX': -k / 0x2 + y / 0x2,
            'pY': q / 0x2,
            'pZ': 0x0,
            'material': z,
            'name': 'left_wall'
        }),
        'facade' == g['params']['cabinet']['right_wall'])
            g['params']['doors']['push']({
                'type': 'falsefacade',
                'allow_z': 0x1,
                'allow_x': 0x1,
                'allow_ry': 0x1,
                'facade': g['params']['facade']['id'],
                'material': g['params']['facade']['materials']['gen'],
                'style': D,
                'tag': 'right_wall',
                'width': E * units,
                'height': q * units,
                'thickness': y * units,
                'rY': Math['PI'] / 0x2,
                'pX': 0x0,
                'pY': q / 0x2,
                'pZ': 0x0
            });
        else {
            if ('facade_simple' == g['params']['cabinet']['right_wall'])
                g['params']['doors']['push']({
                    'type': 'falsefacade',
                    'allow_z': 0x1,
                    'allow_x': 0x1,
                    'allow_ry': 0x1,
                    'facade': g['params']['facade']['id'],
                    'material': g['params']['facade']['materials']['gen'],
                    'style': D,
                    'tag': 'right_wall',
                    'fixed_facade_model': '/common_assets/models/plastic_full.fbx',
                    'width': E * units,
                    'height': q * units,
                    'thickness': y * units,
                    'rY': Math['PI'] / 0x2,
                    'pX': 0x0,
                    'pY': q / 0x2,
                    'pZ': 0x0
                });
            else {
                let O = -g['params']['cabinet']['depth'] / units / 0x2 + B / 0x2 + g['params']['tabletop']['offset']['front'] / units / 0x2;
                0x2 == g['params']['version'] && (O = -g['params']['cabinet']['depth'] / units / 0x2 - g['params']['cabinet']['offset']['back'] / units / 0x2 + B / 0x2),
                0x0 != g['params']['cabinet']['end_corner_side_wall_width'] && (O = -g['params']['cabinet']['depth'] / units / 0x2 + E / 0x2 - (-this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2)),
                j['right_wall'] = new Object_wall({
                    'width': E,
                    'height': q,
                    'thickness': y,
                    'rY': Math['PI'] / 0x2,
                    'pX': k / 0x2 - y / 0x2,
                    'pY': q / 0x2,
                    'pZ': O,
                    'material': z,
                    'name': 'left_wall'
                });
            }
        }
    }
    let F = k - 0x2 * y
      , G = v
      , H = B;
    0x0 != g['params']['cabinet']['end_corner_side_wall_width'] && (H = E - g['params']['tabletop']['offset']['back'] / units);
    var I = new THREE['Shape']();
    I['moveTo'](-F / 0x2, -G / 0x2),
    I['lineTo'](-F / 0x2, G / 0x2),
    I['lineTo'](F / 0x2, -G / 0x2 + H),
    I['lineTo'](F / 0x2, -G / 0x2),
    I['lineTo'](-F / 0x2, -G / 0x2),
    j['top_wall'] = new Object_wall({
        'width': F,
        'height': G,
        'thickness': y,
        'rX': Math['PI'] / 0x2,
        'pX': 0x0,
        'pY': q,
        'pZ': 0x0,
        'name': 'top_wall',
        'material': z,
        'shape': I
    }),
    j['bottom_wall'] = new Object_wall({
        'width': F,
        'height': G,
        'thickness': y,
        'rX': Math['PI'] / 0x2,
        'pX': 0x0,
        'pY': y,
        'pZ': 0x0,
        'name': 'top_wall',
        'material': z,
        'shape': I
    }),
    0x0 != this['params']['tabletop']['offset']['back'] && (j['end_corner_side_wall'] = new Object_wall({
        'width': this['params']['tabletop']['offset']['back'] / units,
        'height': q,
        'thickness': y,
        'rY': Math['PI'] / 0x2,
        'pX': k / 0x2 - y - y / 0x2,
        'pY': q / 0x2,
        'pZ': -v / 0x2 - this['params']['tabletop']['offset']['back'] / units / 0x2,
        'material': z,
        'name': 'end_side_wall'
    })),
    'left' === A && (j['top_wall']['rotation']['y'] = Math['PI'],
    j['bottom_wall']['rotation']['y'] = Math['PI'],
    j['top_wall']['position']['y'] = q - y,
    (j['bottom_wall']['position']['y'] = 0x0) != this['params']['tabletop']['offset']['back']) && (j['end_corner_side_wall']['position']['x'] = -k / 0x2 + y + y / 0x2),
    j['add'](j['back_wall']),
    0x1 == g['params']['cabinet']['left_wall'] && j['add'](j['left_wall']),
    0x1 == g['params']['cabinet']['right_wall'] && j['add'](j['right_wall']),
    j['add'](j['top_wall']),
    j['add'](j['bottom_wall']),
    0x0 != this['params']['tabletop']['offset']['back'] && 0x1 == this['params']['cabinet']['end_corner_side_wall'] && j['add'](j['end_corner_side_wall']);
}
,
Cabinet_new['prototype']['build_tabletop_end_corner_facade'] = function() {
    var f = this, g, j = f['params']['tabletop']['offset']['left'], k = f['params']['tabletop']['offset']['right'], m = f['params']['tabletop']['offset']['front'], q = f['params']['tabletop']['offset']['back'], u = f['params']['tabletop']['height'], v = f['const']['calculated_width'], w = f['const']['calculated_depth'], x = Math['max'](Math['abs']((f['params']['cabinet']['depth'] - f['params']['cabinet']['width'] - f['params']['cabinet']['thickness']) / units), 0x64 / units), y = f['params']['cabinet']['width'] / units, z = f['params']['cabinet']['depth'] / units;
    let A = f['params']['tabletop']['end_corner_cut_width'] / units
      , B = f['params']['tabletop']['end_corner_cut_depth'] / units;
    0x0 == A && (A = x),
    0x0 == B && (B = x - f['params']['tabletop']['offset']['front'] / units);
    var x = new THREE['Shape'](), y = (x['moveTo'](-y / 0x2, -z / 0x2),
    x['lineTo'](-y / 0x2, z / 0x2),
    x['lineTo'](y / 0x2 - A, z / 0x2),
    x['lineTo'](y / 0x2, z / 0x2 - B),
    x['lineTo'](y / 0x2, -z / 0x2),
    x['lineTo'](-y / 0x2, -z / 0x2),
    new Tabletop({
        'height': u,
        'width': y * units,
        'depth': z * units,
        'holes': f['params']['tabletop']['holes'],
        'material': f['params']['tabletop']['material'],
        'id': void 0x0 !== f['params']['tabletop']['tabletop_id'] ? f['params']['tabletop']['tabletop_id'] : 0x0,
        'variant': void 0x0 !== f['params']['tabletop']['tabletop_variant'] ? f['params']['tabletop']['tabletop_variant'] : 0x0,
        'shape': x
    })), z;
    f['tabletop']['add'](y),
    'left' === f['params']['cabinet']['orientation'] && (y['rotation']['z'] = Math['PI'],
    y['position']['y'] = u / units),
    0x0 != this['params']['tabletop']['plints']['back'] && (z = new Decoration({
        'width': v + j + k,
        'height': 0x1e,
        'thickness': 0x14,
        'material': f['params']['tabletop']['material'],
        'model': '/common_assets/models/tp1.fbx'
    }),
    0x2 == this['params']['version'] && (w = f['params']['tabletop']['depth']),
    f['tabletop']['add'](z),
    z['position']['y'] = 0x1e / units / 0x2,
    z['position']['z'] = -(w + q + m) / units / 0x2 + 0x14 / units / 0x2);
}
,
Cabinet_new['prototype']['build_cokol_end_corner_facade'] = function() {
    if (!(this['params']['cokol']['height'] < 0x1)) {
        var g = this, j = g['cokol'], k = g['const']['calculated_width'] / units, q = g['const']['calculated_depth'] / units, v = g['params']['cokol']['height'] / units, w = g['params']['cokol']['thickness'] / units, x = Math['max'](Math['abs']((g['params']['cabinet']['depth'] - g['params']['cabinet']['width'] - g['params']['cabinet']['thickness']) / units), 0x64 / units), y = g['params']['cokol']['material'], z, A = Math['sqrt'](Math['pow'](q - x, 0x2) + Math['pow'](k, 0x2)) - w, B = Math['sqrt'](Math['pow'](A / 0x2, 0x2) - Math['pow']((k - w) / 0x2, 0x2)), C = Math['atan']((q - x) / (k - 0x2 * w)), D, E, A, B, C, F, G;
        let H = 0x0
          , I = x;
        if (0x0 != g['params']['cabinet']['end_corner_side_wall_width'] && (I = g['params']['cabinet']['end_corner_side_wall_width'] / units - w / 0x2),
        0x0 != g['params']['cabinet']['end_corner_side_wall_width'] && (D = g['params']['cabinet']['depth'] / units - g['params']['tabletop']['offset']['front'] / units - g['params']['cabinet']['end_corner_side_wall_width'] / units,
        E = g['const']['calculated_width'] / units,
        A = Math['sqrt'](Math['pow'](D, 0x2) + Math['pow'](E, 0x2)) - w,
        B = Math['sqrt'](Math['pow'](A / 0x2, 0x2) - Math['pow']((k - w) / 0x2, 0x2)) - w / 0x2,
        C = Math['atan'](D / (E - g['params']['cabinet']['thickness'] / units * 0x2)),
        H = -w,
        'left' === g['params']['cabinet']['orientation']) && (H = w),
        g['params']['cabinet']['width'] < 0xfa && 0x0 != g['params']['cokol']['legs'] ? (z = new CabinetLeg({
            'height': g['params']['cokol']['height'],
            'is_cokol_active': g['params']['cokol']['is_cokol_active']
        }),
        j['add'](z),
        z['position']['x'] = 0x0,
        z['position']['z'] = -q / 0x2 + z['params']['radius2'] / units / 0x2 + 0x2 * w,
        z = new CabinetLeg({
            'height': g['params']['cokol']['height'],
            'is_cokol_active': g['params']['cokol']['is_cokol_active']
        }),
        j['add'](z),
        z['position']['x'] = 0x0,
        z['position']['z'] = q / 0x2 - z['params']['radius2'] / units / 0x2 - 0x3 * w - x / 0x2) : 0x0 != g['params']['cokol']['legs'] && (z = new CabinetLeg({
            'height': g['params']['cokol']['height'],
            'is_cokol_active': g['params']['cokol']['is_cokol_active']
        }),
        j['add'](z),
        z['position']['x'] = -k / 0x2 + z['params']['radius2'] / units / 0x2 + 0x2 * w,
        z['position']['z'] = -q / 0x2 + z['params']['radius2'] / units / 0x2 + 0x2 * w,
        'left' === g['params']['cabinet']['orientation'] && (z['position']['x'] = k / 0x2 - z['params']['radius2'] / units / 0x2 - 0x2 * w),
        z = new CabinetLeg({
            'height': g['params']['cokol']['height'],
            'is_cokol_active': g['params']['cokol']['is_cokol_active']
        }),
        j['add'](z),
        z['position']['x'] = k / 0x2 - z['params']['radius2'] / units / 0x2 - 0x3 * w,
        z['position']['z'] = -q / 0x2 + z['params']['radius2'] / units / 0x2 + 0x2 * w,
        'left' === g['params']['cabinet']['orientation'] && (z['position']['x'] = -k / 0x2 + z['params']['radius2'] / units / 0x2 + 0x3 * w),
        z = new CabinetLeg({
            'height': g['params']['cokol']['height'],
            'is_cokol_active': g['params']['cokol']['is_cokol_active']
        }),
        j['add'](z),
        z['position']['x'] = -k / 0x2 + z['params']['radius2'] / units / 0x2 + 0x2 * w,
        z['position']['z'] = q / 0x2 - z['params']['radius2'] / units / 0x2 - 0x3 * w - x / 0x2,
        'left' === g['params']['cabinet']['orientation'] && (z['position']['x'] = k / 0x2 - z['params']['radius2'] / units / 0x2 - 0x2 * w),
        z = new CabinetLeg({
            'height': g['params']['cokol']['height'],
            'is_cokol_active': g['params']['cokol']['is_cokol_active']
        }),
        j['add'](z),
        z['position']['x'] = k / 0x2 - z['params']['radius2'] / units / 0x2 - 0x3 * w - x / 0x2,
        z['position']['z'] = q / 0x2 - z['params']['radius2'] / units / 0x2 - 0x3 * w - x / 0x2 - x / 0x2,
        'left' === g['params']['cabinet']['orientation']) && (z['position']['x'] = -k / 0x2 + z['params']['radius2'] / units / 0x2 + 0x3 * w + x / 0x2),
        'left' === g['params']['cabinet']['orientation']) {
            C *= -0x1,
            j['front'] = new CabinetCokol({
                'width': A * units,
                'height': v * units,
                'thickness': w * units,
                'pX': 0x0,
                'pZ': -g['params']['cabinet']['depth'] / units / 0x2 - w / 0x2 - (this['params']['tabletop']['offset']['back'] / units / 0x2 - this['params']['tabletop']['offset']['front'] / units / 0x2) + I + w / 0x2,
                'pY': v / 0x2,
                'material': y,
                'name': 'cokol_front',
                'rY': C + 0.02
            }),
            j['front']['position']['x'] = -k / 0x2 + g['params']['tabletop']['offset']['left'] / units;
            for (let J = 0x0; J < j['front']['children']['length']; J++) {
                'Mesh' == j['front']['children'][J]['type'] && j['front']['children'][J]['geometry']['translate'](j['front']['params']['width'] / units / 0x2, 0x0, -w / 0x2);
            }
            j['left'] = new CabinetCokol({
                'width': I * units,
                'height': v * units,
                'thickness': w * units,
                'rY': -Math['PI'] / 0x2,
                'pY': v / 0x2,
                'pX': -k / 0x2 + w / 0x2 + g['params']['tabletop']['offset']['left'] / units,
                'pZ': -g['params']['cabinet']['depth'] / units / 0x2 + I / 0x2 - (this['params']['tabletop']['offset']['back'] / units / 0x2 - this['params']['tabletop']['offset']['front'] / units / 0x2),
                'material': y,
                'name': 'cokol_left'
            }),
            j['right'] = new CabinetCokol({
                'width': q * units,
                'height': v * units,
                'thickness': w * units,
                'rY': Math['PI'] / 0x2,
                'pY': v / 0x2,
                'pX': k / 0x2 - w / 0x2,
                'pZ': 0x0,
                'material': y,
                'name': 'cokol_right'
            });
        } else {
            j['front'] = new CabinetCokol({
                'width': A * units,
                'height': v * units,
                'thickness': w * units,
                'pX': H,
                'pZ': -g['params']['cabinet']['depth'] / units / 0x2 - w / 0x2 - (this['params']['tabletop']['offset']['back'] / units / 0x2 - this['params']['tabletop']['offset']['front'] / units / 0x2) + I + w / 0x2,
                'pY': v / 0x2,
                'material': y,
                'name': 'cokol_front',
                'rY': C - 0.02
            });
            for (let K = 0x0; K < j['front']['children']['length']; K++) {
                'Mesh' == j['front']['children'][K]['type'] && j['front']['children'][K]['geometry']['translate'](-j['front']['params']['width'] / units / 0x2, 0x0, -w / 0x2);
            }
            j['front']['position']['x'] = k / 0x2 - g['params']['tabletop']['offset']['right'] / units,
            j['right'] = new CabinetCokol({
                'width': I * units,
                'height': v * units,
                'thickness': w * units,
                'rY': Math['PI'] / 0x2,
                'pY': v / 0x2,
                'pX': k / 0x2 - w / 0x2 - g['params']['tabletop']['offset']['right'] / units,
                'pZ': -g['params']['cabinet']['depth'] / units / 0x2 + I / 0x2 - (this['params']['tabletop']['offset']['back'] / units / 0x2 - this['params']['tabletop']['offset']['front'] / units / 0x2),
                'material': y,
                'name': 'cokol_left'
            }),
            j['left'] = new CabinetCokol({
                'width': q * units,
                'height': v * units,
                'thickness': w * units,
                'rY': Math['PI'] / 0x2,
                'pY': v / 0x2,
                'pX': -k / 0x2 + w / 0x2,
                'pZ': 0x0,
                'material': y,
                'name': 'cokol_right'
            });
        }
        j['back'] = new CabinetCokol({
            'width': k * units,
            'height': v * units,
            'thickness': w * units,
            'pZ': -q / 0x2 + w / 0x2,
            'pY': v / 0x2,
            'material': y,
            'name': 'cokol_back'
        }),
        g['params']['cabinet']['orientation'],
        j['right']['visible'] = g['params']['cokol']['visible']['right'],
        j['left']['visible'] = g['params']['cokol']['visible']['left'],
        j['back']['visible'] = g['params']['cokol']['visible']['back'],
        j['front']['visible'] = g['params']['cokol']['visible']['front'],
        j['add'](j['front']),
        j['add'](j['left']),
        j['add'](j['right']),
        j['add'](j['back']);
    }
}
,
Cabinet_new['prototype']['build_sections_end_corner_facade'] = function(f={}) {
    var g = this
      , h = new THREE['Box3']()['setFromObject'](this['cabinet'])['getSize'](new THREE['Vector3']())
      , j = (this['reset_model'](this['sections']),
    {
        'name': 'Секция',
        'width': '100%',
        'height': '100%',
        'starting_point_x': '0%',
        'starting_point_y': '0%',
        'direction_x': 'right',
        'direction_y': 'top',
        'offset_top': 0x0,
        'offset_bottom': 0x0,
        'position_offset_top': 0x0,
        'position_offset_bottom': 0x0,
        'group': g['params']['cabinet_group'],
        'pX': 0x0,
        'pY': 0x0,
        'pZ': 0x0,
        'rX': 0x0,
        'rY': 0x0,
        'rZ': 0x0
    });
    for (let p = 0x0; p < g['params']['sections']['length']; p++) {
        var k = g['params']['sections'][p], k, l = k = Object['assign']({}, j, k), m = ('string' == typeof l['offset_top'] && -0x1 < l['offset_top']['indexOf']('%') && (l['offset_top'] = g['params']['cabinet']['height'] * parseFloat(l['offset_top']) / 0x64),
        'string' == typeof l['offset_bottom'] && -0x1 < l['offset_bottom']['indexOf']('%') && (l['offset_bottom'] = g['params']['cabinet']['height'] * parseFloat(l['offset_bottom']) / 0x64),
        'string' == typeof l['width'] && -0x1 < l['width']['indexOf']('%') && (l['width'] = g['const']['calculated_width'] * parseFloat(l['width']) / 0x64),
        'string' == typeof l['height'] && -0x1 < l['height']['indexOf']('%') && (l['height'] = (g['params']['cabinet']['height'] - l['offset_top'] - l['offset_bottom']) * parseFloat(l['height']) / 0x64),
        'string' == typeof l['starting_point_x'] && -0x1 < l['starting_point_x']['indexOf']('%') ? 'center' === l['starting_point_x'] ? l['pX'] = 0x0 : 'right' === l['direction_x'] ? l['pX'] = g['const']['calculated_width'] * parseFloat(l['starting_point_x']) / 0x64 / units : l['pX'] = g['const']['calculated_width'] * parseFloat(l['starting_point_x']) / 0x64 / units - l['width'] / units : (l['direction_x'],
        l['pX'] = l['starting_point_x'] / units),
        'string' == typeof l['starting_point_y'] && -0x1 < l['starting_point_y']['indexOf']('%') ? 'center' === l['starting_point_y'] ? l['pY'] = 0x0 + h['y'] / 0x2 - l['height'] / units / 0x2 : 'top' === l['direction_y'] ? l['pY'] = 0x0 + g['params']['cabinet']['height'] * parseFloat(l['starting_point_y']) / 0x64 / units - l['position_offset_top'] / units + l['position_offset_bottom'] / units : l['pY'] = 0x0 + g['params']['cabinet']['height'] * parseFloat(l['starting_point_y']) / 0x64 / units - l['height'] / units - l['position_offset_top'] / units + l['position_offset_bottom'] / units : l['pY'] = 0x0 + l['starting_point_y'] / units - l['position_offset_top'] / units + l['position_offset_bottom'] / units,
        new THREE['Group']());
        m['userData']['index'] = p,
        m['temp_type'] = 'Section',
        this['sections']['add'](m),
        m['position']['set'](l['pX'], l['pY'], l['pZ']),
        k['lockers'] && (m['lockers'] = new THREE['Group'](),
        m['lockers']['name'] = 'section_lockers',
        m['add'](m['lockers']),
        g['build_lockers_common']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['lockers'],
            'params': k
        })),
        k['doors'] && (m['doors'] = new THREE['Group'](),
        m['doors']['name'] = 'section_doors',
        m['add'](m['doors']),
        g['build_doors_all']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['doors'],
            'params': k
        })),
        k['walls'] && (m['walls'] = new THREE['Group'](),
        m['walls']['name'] = 'section_walls',
        m['add'](m['walls']),
        g['build_walls_common']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['walls'],
            'params': k
        })),
        !k['shelves'] && 0x1 != k['shelves_auto'] || (m['shelves'] = new THREE['Group'](),
        m['shelves']['name'] = 'section_shelves',
        m['add'](m['shelves']),
        g['build_shelves_end_corner_facade']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['shelves'],
            'params': k
        }));
    }
}
,
Cabinet_new['prototype']['build_shelves_end_corner_facade'] = function(f={}) {
    var g = this
      , j = new THREE['Box3']()['setFromObject'](this['cabinet'])['getSize'](new THREE['Vector3']())
      , k = {
        'width': void 0x0 !== f['width'] ? f['width'] : g['const']['calculated_width'],
        'height': (void 0x0 !== f['height'] ? f : g['params']['cabinet'])['height'],
        'obj_to_add': void 0x0 !== f['obj_to_add'] ? f['obj_to_add'] : this['shelves'],
        'params': (void 0x0 !== f['params'] ? f : g)['params']
    };
    k['params']['shelves_auto'] && this['build_shelves_auto'](k);
    let m = g['cabinet']['position']['y'];
    -0x1 < k['obj_to_add']['name']['indexOf']('section_') && (m = 0x0);
    for (var q = 0x0; q < k['params']['shelves']['length']; q++) {
        let v = k['params']['shelves'][q]
          , w = {
            'width': void 0x0 !== v['width'] ? v['width'] : '100%',
            'height': void 0x0 !== v['depth'] ? v['depth'] : g['const']['calculated_depth'] - project_settings['shelve_offset'],
            'thickness': void 0x0 !== v['height'] ? v['height'] : project_settings['shelves_thickness'],
            'orientation': void 0x0 !== v['orientation'] ? v['orientation'] : 'horizontal',
            'material': g['params']['cabinet']['material'],
            'fixed_material': void 0x0 !== v['fixed_material'] ? v['fixed_material'] : null,
            'starting_point_x': void 0x0 !== v['starting_point_x'] ? v['starting_point_x'] : '50%',
            'starting_point_y': void 0x0 !== v['starting_point_y'] ? v['starting_point_y'] : '0%',
            'position_offset_top': void 0x0 !== v['position_offset_top'] ? v['position_offset_top'] : 0x0,
            'position_offset_bottom': void 0x0 !== v['position_offset_bottom'] ? v['position_offset_bottom'] : 0x0,
            'direction_x': void 0x0 !== v['direction_x'] ? v['direction_x'] : 'right',
            'direction_y': void 0x0 !== v['direction_y'] ? v['direction_y'] : 'top',
            'pX': v['pX'] || 0x0,
            'pY': v['pY'] || m,
            'pZ': v['pZ'] || -project_settings['shelve_offset'] / units / 0x2,
            'rX': v['rX'] || Math['PI'] / 0x2,
            'rY': v['rY'] || 0x0,
            'rZ': v['rZ'] || 0x0
        }
          , x = ('string' == typeof w['width'] && -0x1 < w['width']['indexOf']('%') && (w['width'] = 'vertical' === w['orientation'] ? (g['params']['cabinet']['height'] - 0x2 * g['params']['cabinet']['thickness']) * parseFloat(w['width']) / 0x64 : (g['const']['calculated_width'] - 0x2 * g['params']['cabinet']['thickness']) * parseFloat(w['width']) / 0x64),
        'string' == typeof w['height'] && -0x1 < w['height']['indexOf']('%') && (w['height'] = g['params']['cabinet']['depth'] * parseFloat(w['height']) / 0x64),
        'string' == typeof w['starting_point_x'] && -0x1 < w['starting_point_x']['indexOf']('%') && (w['pX'] = 'center' === w['starting_point_x'] ? -w['width'] / units / 0x2 : 'right' === w['direction_x'] ? -g['const']['calculated_width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(w['starting_point_x']) / 0x64 / units : -g['const']['calculated_width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(w['starting_point_x']) / 0x64 / units - w['width'] / units),
        'string' == typeof w['starting_point_y'] && -0x1 < w['starting_point_y']['indexOf']('%') && (w['pY'] = 'center' === w['starting_point_y'] ? m + j['y'] / 0x2 - w['height'] / units / 0x2 : 'top' === w['direction_y'] ? 'horizontal' === w['orientation'] ? m + (k['height'] - w['position_offset_top']) * parseFloat(w['starting_point_y']) / 0x64 / units : m + (k['height'] - w['position_offset_top']) * parseFloat(w['starting_point_y']) / 0x64 / units + w['width'] / units / 0x2 : 'horizontal' === w['orientation'] ? m + k['height'] * parseFloat(w['starting_point_y']) / 0x64 / units - w['height'] / units : m + k['height'] * parseFloat(w['starting_point_y']) / 0x64 / units - w['width'] / units / 0x2),
        'vertical' === w['orientation'] && (w['rY'] = Math['PI'] / 0x2),
        w['width'] /= units,
        w['height'] /= units,
        w['thickness'] /= units,
        Math['max'](Math['abs']((g['params']['cabinet']['depth'] - g['params']['cabinet']['width'] - g['params']['cabinet']['thickness']) / units), 0x64 / units))
          , y = new THREE['Shape']()
          , z = g['const']['calculated_width'] / units - 0x2 * g['params']['cabinet']['thickness'] / units
          , A = g['const']['calculated_depth'] / units - project_settings['shelve_offset'] / units
          , B = x
          , C = x + g['params']['tabletop']['offset']['back'] / units;
        0x0 != g['params']['cabinet']['end_corner_side_wall_width'] && (C = g['params']['cabinet']['end_corner_side_wall_width'] / units),
        0x0 != g['params']['cabinet']['end_corner_side_wall_width'] && (B = C - g['params']['tabletop']['offset']['back'] / units),
        y['moveTo'](-z / 0x2, -A / 0x2),
        y['lineTo'](-z / 0x2, A / 0x2),
        y['lineTo'](z / 0x2, -A / 0x2 + B),
        y['lineTo'](z / 0x2, -A / 0x2),
        y['lineTo'](-z / 0x2, -A / 0x2),
        w['shape'] = y,
        w['pX'] = 0x0,
        w['pZ'] = -project_settings['shelve_offset'] / units / 0x2,
        'left' === g['params']['cabinet']['orientation'] && (w['rY'] = Math['PI'],
        w['pY'] -= w['thickness']),
        w['fixed_material'] && null != w['fixed_material'] && materials_lib['items'][w['fixed_material']] && (w['material'] = w['fixed_material']);
        var u = new Object_wall(w);
        k['obj_to_add']['add'](u);
    }
}
,
Cabinet_new['prototype']['build_cornice_end_corner_facade'] = function() {
    var f = this
      , g = this['cornice']
      , h = f['params']['cornice']
      , j = project_settings['selected_molded_model'] && 0x1 < h['level'];
    let k = Math['sqrt'](Math['pow'](0xc8, 0x2) + Math['pow'](0xc8, 0x2));
    var m = Math['max'](Math['abs'](f['params']['cabinet']['depth'] - f['params']['cabinet']['width'] - f['params']['cabinet']['thickness']), 0x64), m = (0x0 < f['params']['cabinet']['end_corner_side_wall_width'] && (m = f['params']['cabinet']['depth'] - f['params']['cabinet']['end_corner_side_wall_width']),
    k = Math['sqrt'](Math['pow'](f['const']['calculated_depth'] - m, 0x2) + Math['pow'](f['const']['calculated_width'], 0x2)),
    Math['atan']((f['const']['calculated_depth'] - m) / (f['const']['calculated_width'] - 0x2 * f['params']['cabinet']['thickness']))), p, q, p, q, m = 0x0 != f['params']['cabinet']['end_corner_side_wall_width'] ? (p = f['params']['cabinet']['depth'] - f['params']['tabletop']['offset']['front'] - f['params']['cabinet']['end_corner_side_wall_width'],
    q = f['const']['calculated_width'],
    k = Math['sqrt'](Math['pow'](p, 0x2) + Math['pow'](q - 0x2 * f['params']['cabinet']['thickness'], 0x2)),
    Math['atan'](p / (q - 0x2 * f['params']['cabinet']['thickness']))) : (p = f['params']['cabinet']['depth'] - f['params']['tabletop']['offset']['front'] - 0x64,
    q = f['const']['calculated_width'],
    k = Math['sqrt'](Math['pow'](p, 0x2) + Math['pow'](q - 0x2 * f['params']['cabinet']['thickness'], 0x2)),
    Math['atan'](p / (q - 0x2 * f['params']['cabinet']['thickness']))), p;
    let u;
    if (j && (u = (u = molded_lib['items'][project_settings['selected_molded_model']]['height']) || 0x9),
    h['visible']['front'] && (p = {
        'model': h['model'],
        'width': f['params']['cabinet']['thickness'],
        'type': 'straight',
        'offset_type': 'front'
    },
    'left' === f['params']['cabinet']['orientation'] ? p['angle_left'] = m / 0x2 : p['angle_right'] = -m / 0x2,
    g['front'] = new Cornice(p),
    g['front']['position']['x'] = f['const']['calculated_width'] / units / 0x2 - g['front']['params']['width'] / units / 0x2,
    g['front']['position']['z'] = f['const']['calculated_depth'] / units / 0x2,
    g['add'](g['front']),
    j && (g['front_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['const']['calculated_width'] - (0xc8 - f['params']['cabinet']['thickness']),
        'type': 'straight'
    }),
    g['front_m']['position']['x'] = f['const']['calculated_width'] / units / 0x2 - g['front']['params']['width'] / units / 0x2,
    g['front_m']['position']['z'] = f['const']['calculated_depth'] / units / 0x2,
    g['front']['position']['y'] = u,
    g['add'](g['front_m'])),
    'left' !== f['params']['cabinet']['orientation']) && (g['front']['position']['x'] = -f['const']['calculated_width'] / units / 0x2 + g['front']['params']['width'] / units / 0x2,
    j) && (g['front_m']['position']['x'] = -f['const']['calculated_width'] / units / 0x2 + g['front']['params']['width'] / units / 0x2),
    h['visible']['right']) {
        if ('left' === f['params']['cabinet']['orientation'])
            g['right'] = new Cornice({
                'model': h['model'],
                'width': f['const']['calculated_depth'],
                'type': 'straight'
            }),
            g['right']['rotation']['y'] = Math['PI'] / 0x2,
            g['right']['position']['set'](f['const']['calculated_width'] / 0x2 / units, 0x0, 0x0),
            g['add'](g['right']),
            j && (g['right_m'] = new Cornice({
                'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
                'width': f['const']['calculated_depth'],
                'type': 'straight'
            }),
            g['right_m']['rotation']['y'] = Math['PI'] / 0x2,
            g['right_m']['position']['set'](f['const']['calculated_width'] / 0x2 / units, 0x0, 0x0),
            g['front_corner_right_m'] = new Cornice({
                'model': molded_lib['items'][project_settings['selected_molded_model']]['corner_model_45'],
                'type': 'corner_45'
            }),
            g['front_corner_right_m']['rotation']['y'] = 0x0,
            g['front_corner_right_m']['position']['set'](f['const']['calculated_width'] / 0x2 / units, 0x0, f['const']['calculated_depth'] / units / 0x2),
            g['right']['position']['y'] = u,
            g['front_corner_right']['position']['y'] = u,
            g['add'](g['right_m']),
            g['add'](g['front_corner_right_m']));
        else {
            let v = f['const']['calculated_depth'] - (0xc8 - f['params']['cabinet']['thickness']);
            v = (0x0 < f['params']['cabinet']['end_corner_side_wall_width'] || (f['params']['cabinet']['end_corner_side_wall_width'] = 0x64),
            f['params']['cabinet']['end_corner_side_wall_width']),
            g['right'] = new Cornice({
                'model': h['model'],
                'width': k,
                'type': 'straight',
                'offset_type': 'front',
                'angle_right': -Math['PI'] / 0x4 + m / 0x2,
                'angle_left': m / 0x2
            }),
            g['right']['rotation']['y'] = m,
            g['right']['position']['set'](0x0, 0x0, f['const']['calculated_depth'] / units / 0x2 - (f['const']['calculated_depth'] - v) / units / 0x2),
            g['back_right'] = new Cornice({
                'model': h['model'],
                'width': v,
                'type': 'straight',
                'offset_type': 'side',
                'angle_left': Math['PI'] / 0x4 - m / 0x2
            }),
            g['back_right']['rotation']['y'] = Math['PI'] / 0x2,
            g['back_right']['position']['set'](f['const']['calculated_width'] / units / 0x2 - f['params']['cabinet']['thickness'] / units, 0x0, -f['const']['calculated_depth'] / units / 0x2 + g['back_right']['params']['width'] / units / 0x2),
            g['add'](g['right']),
            g['add'](g['back_right']),
            j && (g['right_m'] = new Cornice({
                'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
                'width': k,
                'type': 'straight'
            }),
            g['right_m']['rotation']['y'] = Math['PI'] / 0x4,
            g['right_m']['position']['set']((f['params']['cabinet']['width'] - (0xc8 - f['params']['cabinet']['thickness'])) / units / 0x2, 0x0, (f['const']['calculated_depth'] - (0xc8 - f['params']['cabinet']['thickness'])) / units / 0x2),
            g['back_right_m'] = new Cornice({
                'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
                'width': f['const']['calculated_depth'] - (0xc8 - f['params']['cabinet']['thickness']),
                'type': 'straight'
            }),
            g['back_right_m']['rotation']['y'] = Math['PI'] / 0x2,
            g['back_right_m']['position']['set'](f['const']['calculated_width'] / units / 0x2, 0x0, -f['const']['calculated_depth'] / units / 0x2 + g['back_right']['params']['width'] / units / 0x2),
            g['right']['position']['y'] = u,
            g['back_right']['position']['y'] = u,
            g['back_right_corner']['position']['y'] = u,
            g['front_corner_right']['position']['y'] = u,
            g['add'](g['right_m']),
            g['add'](g['back_right_m']));
        }
    }
    if (h['visible']['left']) {
        let w = f['const']['calculated_depth'] - (0xc8 - f['params']['cabinet']['thickness']);
        w = (0x0 < f['params']['cabinet']['end_corner_side_wall_width'] || (f['params']['cabinet']['end_corner_side_wall_width'] = 0x64),
        f['params']['cabinet']['end_corner_side_wall_width']),
        'left' === f['params']['cabinet']['orientation'] ? (g['left'] = new Cornice({
            'model': h['model'],
            'width': k,
            'type': 'straight',
            'offset_type': 'front',
            'angle_left': Math['PI'] / 0x4 - m / 0x2,
            'angle_right': -m / 0x2
        }),
        g['left']['rotation']['y'] = -m,
        g['left']['position']['set'](0x0, 0x0, f['const']['calculated_depth'] / units / 0x2 - (f['const']['calculated_depth'] - w) / units / 0x2),
        g['back_left'] = new Cornice({
            'model': h['model'],
            'width': w,
            'type': 'straight',
            'offset_type': 'side',
            'angle_right': -Math['PI'] / 0x4 + m / 0x2
        }),
        g['back_left']['rotation']['y'] = -Math['PI'] / 0x2,
        g['back_left']['position']['set'](-f['const']['calculated_width'] / units / 0x2 + f['params']['cabinet']['thickness'] / units, 0x0, -f['const']['calculated_depth'] / units / 0x2 + g['back_left']['params']['width'] / units / 0x2),
        g['add'](g['left']),
        g['add'](g['back_left']),
        j && (g['left_m'] = new Cornice({
            'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
            'width': k,
            'type': 'straight'
        }),
        g['left_m']['rotation']['y'] = -Math['PI'] / 0x4,
        g['left_m']['position']['set'](-0x1 * (f['params']['cabinet']['width'] - (0xc8 - f['params']['cabinet']['thickness'])) / units / 0x2, 0x0, (f['const']['calculated_depth'] - (0xc8 - f['params']['cabinet']['thickness'])) / units / 0x2),
        g['back_left_m'] = new Cornice({
            'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
            'width': f['const']['calculated_depth'] - (0xc8 - f['params']['cabinet']['thickness']),
            'type': 'straight'
        }),
        g['back_left_m']['rotation']['y'] = -Math['PI'] / 0x2,
        g['back_left_m']['position']['set'](-f['const']['calculated_width'] / units / 0x2, 0x0, -f['const']['calculated_depth'] / units / 0x2 + g['back_left']['params']['width'] / units / 0x2),
        g['back_left_corner_m'] = new Cornice({
            'model': molded_lib['items'][project_settings['selected_molded_model']]['corner_model_45'],
            'type': 'corner_45'
        }),
        g['back_left_corner_m']['rotation']['y'] = -Math['PI'] / 0x2,
        g['back_left_corner_m']['position']['set'](-f['const']['calculated_width'] / units / 0x2, 0x0, f['const']['calculated_depth'] / units / 0x2 - (0xc8 - f['params']['cabinet']['thickness']) / units),
        g['front_corner_left_m'] = new Cornice({
            'model': molded_lib['items'][project_settings['selected_molded_model']]['corner_model_45'],
            'type': 'corner_45'
        }),
        g['front_corner_left_m']['rotation']['y'] = -Math['PI'] / 0x4,
        g['front_corner_left_m']['position']['set'](f['const']['calculated_width'] / units / 0x2 - g['front']['params']['width'] / units, 0x0, f['const']['calculated_depth'] / units / 0x2),
        g['left']['position']['y'] = u,
        g['back_left']['position']['y'] = u,
        g['back_left_corner']['position']['y'] = u,
        g['front_corner_left']['position']['y'] = u,
        g['add'](g['left_m']),
        g['add'](g['back_left_m']),
        g['add'](g['back_left_corner_m']),
        g['add'](g['front_corner_left_m']))) : (g['left'] = new Cornice({
            'model': h['model'],
            'width': f['const']['calculated_depth'],
            'type': 'straight'
        }),
        g['left']['rotation']['y'] = -Math['PI'] / 0x2,
        g['left']['position']['set'](-f['const']['calculated_width'] / 0x2 / units, 0x0, 0x0),
        g['add'](g['left']),
        j && (g['left_m'] = new Cornice({
            'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
            'width': f['const']['calculated_depth'],
            'type': 'straight'
        }),
        g['left_m']['rotation']['y'] = -Math['PI'] / 0x2,
        g['left_m']['position']['set'](-f['const']['calculated_width'] / 0x2 / units, 0x0, 0x0),
        g['left']['position']['y'] = u,
        g['front_corner_left']['position']['y'] = u,
        g['add'](g['left_m'])));
    }
}
,
Cabinet_new['prototype']['build_positions_end_corner_facade'] = function() {
    this['cabinet']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['params']['cokol']['height'] / units, this['params']['tabletop']['offset']['back'] / units / 0x2 - this['params']['tabletop']['offset']['front'] / units / 0x2),
    this['cokol']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['cokol']['position']['y'], this['params']['tabletop']['offset']['back'] / units / 0x2 - this['params']['tabletop']['offset']['front'] / units / 0x2),
    this['sections']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['params']['cokol']['height'] / units, this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['tabletop']['offset']['front'] / units / 0x2),
    this['walls']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['params']['cokol']['height'] / units, this['params']['tabletop']['offset']['back'] / units / 0x2 - this['params']['tabletop']['offset']['front'] / units / 0x2),
    this['lockers']['position']['z'] = this['params']['tabletop']['offset']['back'] / units / 0x2 - this['params']['tabletop']['offset']['front'] / units / 0x2,
    this['sizes']['position']['z'] = this['params']['cabinet']['back_wall_offset'] / units / 0x2,
    this['models']['position']['z'] = this['params']['tabletop']['offset']['back'] / units / 0x2 - this['params']['tabletop']['offset']['front'] / units / 0x2,
    this['doors']['position']['z'] = this['params']['tabletop']['offset']['back'] / units / 0x2 - this['params']['tabletop']['offset']['front'] / units / 0x2,
    this['doors']['position']['x'] = -this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2,
    this['shelves']['position']['x'] = -this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2,
    this['shelves']['position']['z'] = this['params']['tabletop']['offset']['back'] / units / 0x2 - this['params']['tabletop']['offset']['front'] / units / 0x2,
    this['cornice']['position']['y'] = this['cabinet']['position']['y'] + this['params']['cabinet']['height'] / units;
    var f = Math['max'](Math['abs'](this['params']['cabinet']['depth'] - this['params']['cabinet']['width'] - this['params']['cabinet']['thickness']), 0x64), g, h, j, h, j;
    let k, l = (k = 0x0 != this['params']['cabinet']['end_corner_side_wall_width'] ? (h = this['params']['cabinet']['depth'] - this['params']['tabletop']['offset']['front'] - this['params']['cabinet']['end_corner_side_wall_width'],
    j = this['const']['calculated_width'] - 0x2 * this['params']['cabinet']['thickness'],
    Math['atan'](h / j)) : (h = this['const']['calculated_depth'] - f,
    j = this['const']['calculated_width'] - 0x2 * this['params']['cabinet']['thickness'],
    Math['atan'](h / j)),
    'left' == this['params']['cabinet']['orientation'] && (k *= -0x1),
    f / units + this['params']['tabletop']['offset']['back'] / units);
    0x0 != this['params']['cabinet']['end_corner_side_wall_width'] && (l = this['params']['cabinet']['end_corner_side_wall_width'] / units),
    'left' == this['params']['cabinet']['orientation'] ? this['doors']['position']['set'](-this['params']['cabinet']['width'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units + this['params']['cabinet']['thickness'] / units / 0x2, 0x0, -this['params']['cabinet']['depth'] / units / 0x2 + l - this['params']['cabinet']['thickness'] / units / 0x2) : 0x0 != this['params']['cabinet']['end_corner_side_wall_width'] ? this['doors']['position']['set'](-this['params']['cabinet']['width'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units + this['params']['cabinet']['thickness'] / units / 0x2, 0x0, -this['params']['cabinet']['depth'] / units / 0x2 + l + (this['params']['cabinet']['depth'] - this['params']['tabletop']['offset']['front'] - this['params']['cabinet']['end_corner_side_wall_width']) / units + this['params']['cabinet']['thickness'] / units / 0x2) : this['doors']['position']['set'](-this['params']['cabinet']['width'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units + this['params']['cabinet']['thickness'] / units / 0x2, 0x0, -this['params']['cabinet']['depth'] / units / 0x2 + this['const']['calculated_depth'] / units - f / units + this['params']['cabinet']['thickness'] / units + l - this['params']['cabinet']['thickness'] / units / 0x2);
    for (let m = this['params']['doors']['length']; m--; )
        'left_wall' == this['params']['doors'][m]['tag'] && (this['doors']['children'][m]['rotateY'](-k),
        this['doors']['children'][m]['translateX'](-l + this['params']['cabinet']['thickness'] / units / 0x2),
        this['doors']['children'][m]['translateZ'](-this['params']['cabinet']['thickness'] / units / 0x2)),
        'right_wall' == this['params']['doors'][m]['tag'] && (this['doors']['children'][m]['rotateY'](-k),
        this['doors']['children'][m]['translateZ'](this['const']['calculated_width'] / units - this['params']['cabinet']['thickness'] / units * 0x3 / 0x2),
        this['doors']['children'][m]['translateX'](-this['params']['tabletop']['offset']['front'] / units + this['params']['cabinet']['thickness'] / units / 0x2 + this['params']['cabinet']['depth'] / units - l));
    this['doors']['rotation']['y'] = k;
}
,
Cabinet_new['prototype']['rotate_doors'] = function() {
    var f = Math['max'](Math['abs'](this['params']['cabinet']['depth'] - this['params']['cabinet']['width'] - this['params']['cabinet']['thickness']), 0x64), g, h, j, h, j;
    let k;
    k = 0x0 != this['params']['cabinet']['end_corner_side_wall_width'] ? (h = this['params']['cabinet']['depth'] - this['params']['tabletop']['offset']['front'] - this['params']['cabinet']['end_corner_side_wall_width'],
    j = this['const']['calculated_width'] - 0x2 * this['params']['cabinet']['thickness'],
    Math['atan'](h / j)) : (h = this['const']['calculated_depth'] - f,
    j = this['const']['calculated_width'] - 0x2 * this['params']['cabinet']['thickness'],
    Math['atan'](h / j)),
    'left' == this['params']['cabinet']['orientation'] && (k *= -0x1);
    var l = f / units + this['params']['tabletop']['offset']['back'] / units;
    0x0 != this['params']['cabinet']['end_corner_side_wall_width'] && (l = this['params']['cabinet']['end_corner_side_wall_width'] / units);
    for (let m = this['params']['doors']['length']; m--; ) {
        if ('left_wall' == this['params']['doors'][m]['tag']) {
            let n = setInterval( () => {
                this['doors']['children'][m] && clearInterval(n),
                this['doors']['children'][m]['rotateY'](-k);
            }
            , 0xa);
        }
        if ('right_wall' == this['params']['doors'][m]['tag']) {
            let p = setInterval( () => {
                this['doors']['children'][m] && clearInterval(p),
                this['doors']['children'][m]['rotateY'](-k);
            }
            , 0xa);
        }
    }
}
,
Cabinet_new['prototype']['build_end_radius_open'] = function() {
    let f = this
      , g = f['cabinet']
      , j = f['const']['calculated_width'] / units
      , k = f['params']['cabinet']['height'] / units
      , m = f['const']['calculated_depth'] / units
      , q = f['params']['cabinet']['thickness_back'] / units
      , u = f['params']['cabinet']['back_wall_offset'] / units
      , v = f['params']['cabinet']['thickness'] / units
      , w = f['params']['cabinet']['material']
      , x = f['params']['cabinet']['orientation']
      , y = (g['back_wall'] = new Object_wall({
        'width': j,
        'height': k,
        'thickness': v,
        'pX': 0x0,
        'pY': k / 0x2,
        'pZ': -m / 0x2 + v / 0x2,
        'material': w,
        'name': 'back_cab_wall'
    }),
    g['left_wall'] = new Object_wall({
        'width': m - v,
        'height': k,
        'thickness': v,
        'rY': Math['PI'] / 0x2,
        'pX': -j / 0x2 + v / 0x2,
        'pY': k / 0x2,
        'pZ': v / 0x2,
        'material': w,
        'name': 'left_wall'
    }),
    j - v)
      , z = m - v
      , A = f['params']['cabinet']['end_radius'];
    (A = (A = 0x0 == A ? y : f['params']['cabinet']['end_radius'] / units) > y ? y : A) > z && (A = z);
    var B = p_shapes['rounded_corners'](y, z, 0x0, 0x0, A, 0x0);
    g['top_wall'] = new Object_wall({
        'width': y,
        'height': z,
        'thickness': v,
        'rX': Math['PI'] / 0x2,
        'pX': v / 0x2,
        'pY': k,
        'pZ': v / 0x2,
        'name': 'top_wall',
        'material': f['params']['cabinet']['material'],
        'shape': B
    }),
    g['bottom_wall'] = new Object_wall({
        'width': y,
        'height': z,
        'thickness': v,
        'rX': Math['PI'] / 0x2,
        'pX': v / 0x2,
        'pY': v,
        'pZ': v / 0x2,
        'name': 'top_wall',
        'material': f['params']['cabinet']['material'],
        'shape': B
    }),
    0x0 != this['params']['tabletop']['offset']['back'] && (g['end_corner_side_wall'] = new Object_wall({
        'width': this['params']['tabletop']['offset']['back'] / units,
        'height': k,
        'thickness': v,
        'rY': Math['PI'] / 0x2,
        'pX': j / 0x2 - v / 0x2,
        'pY': k / 0x2,
        'pZ': -m / 0x2 - this['params']['tabletop']['offset']['back'] / units / 0x2,
        'material': w,
        'name': 'end_side_wall'
    })),
    'left' === x && (g['left_wall']['position']['x'] = j / 0x2 - v / 0x2,
    0x0 != this['params']['tabletop']['offset']['back'] && (g['end_corner_side_wall']['position']['x'] = -j / 0x2 + v / 0x2),
    g['top_wall']['rotation']['y'] = Math['PI'],
    g['bottom_wall']['rotation']['y'] = Math['PI'],
    g['top_wall']['position']['x'] = -v / 0x2,
    g['bottom_wall']['position']['x'] = -v / 0x2,
    g['top_wall']['position']['y'] = k - v,
    g['bottom_wall']['position']['y'] = 0x0),
    0x1 == this['params']['cabinet']['left_wall'] && g['add'](g['left_wall']),
    0x1 == this['params']['cabinet']['back_wall'] && g['add'](g['back_wall']),
    0x1 == this['params']['cabinet']['top_wall'] && g['add'](g['top_wall']),
    0x1 == this['params']['cabinet']['bottom_wall'] && g['add'](g['bottom_wall']),
    0x0 != this['params']['tabletop']['offset']['back'] && 0x1 == this['params']['cabinet']['end_corner_side_wall'] && g['add'](g['end_corner_side_wall']);
}
,
Cabinet_new['prototype']['build_tabletop_end_radius_open'] = function() {
    var f = this, g, j = f['params']['tabletop']['offset']['left'], k = f['params']['tabletop']['offset']['right'], m = f['params']['tabletop']['offset']['front'], q = f['params']['tabletop']['offset']['back'], u = f['params']['tabletop']['height'], v = f['const']['calculated_width'], w = f['const']['calculated_depth'], x = f['params']['cabinet']['width'] / units, y = f['params']['cabinet']['depth'] / units;
    0x2 == this['params']['version'] && (y = f['params']['tabletop']['depth'] / units);
    let z = f['params']['tabletop']['end_radius'];
    (z = (z = 0x0 == z ? x : f['params']['tabletop']['end_radius'] / units) > x ? x : z) > y && (z = y);
    var A = p_shapes['rounded_corners'](x, y, 0x0, 0x0, z, 0x0), x = new Tabletop({
        'height': u,
        'width': x * units,
        'depth': y * units,
        'holes': f['params']['tabletop']['holes'],
        'material': f['params']['tabletop']['material'],
        'id': void 0x0 !== f['params']['tabletop']['tabletop_id'] ? f['params']['tabletop']['tabletop_id'] : 0x0,
        'variant': void 0x0 !== f['params']['tabletop']['tabletop_variant'] ? f['params']['tabletop']['tabletop_variant'] : 0x0,
        'shape': A
    }), y;
    f['tabletop']['add'](x),
    'left' === f['params']['cabinet']['orientation'] && (x['rotation']['z'] = Math['PI'],
    x['position']['y'] = u / units),
    0x0 != this['params']['tabletop']['plints']['back'] && (y = new Decoration({
        'width': v + j + k,
        'height': 0x1e,
        'thickness': 0x14,
        'material': f['params']['tabletop']['material'],
        'model': '/common_assets/models/tp1.fbx'
    }),
    f['tabletop']['add'](y),
    y['position']['y'] = 0x1e / units / 0x2,
    y['position']['z'] = -(w + q + m) / units / 0x2 + 0x14 / units / 0x2);
}
,
Cabinet_new['prototype']['build_cokol_end_radius_open'] = function() {
    if (!(this['params']['cokol']['height'] < 0x1)) {
        var f = this, g = f['cokol'], j = f['const']['calculated_width'] / units, k = f['const']['calculated_depth'] / units, m = f['params']['cokol']['height'] / units, q = f['params']['cokol']['thickness'] / units, u = Math['max'](Math['abs']((f['params']['cabinet']['depth'] - f['params']['cabinet']['width'] - f['params']['cabinet']['thickness']) / units), 0x64 / units), v = f['params']['cokol']['material'], w, x = j - f['params']['cabinet']['thickness'] / units;
        let y = f['const']['calculated_depth'] - x * units
          , z = -k / 0x2 + (f['const']['calculated_depth'] / units - x) / 0x2;
        'to_wall' == f['params']['cabinet']['end_side_wall'] && (y += f['params']['cabinet']['offset']['back'],
        z -= f['params']['cabinet']['offset']['back'] / units / 0x2),
        f['params']['cabinet']['width'] < 0xfa && 0x0 != f['params']['cokol']['legs'] ? (w = new CabinetLeg({
            'height': f['params']['cokol']['height'],
            'is_cokol_active': f['params']['cokol']['is_cokol_active']
        }),
        g['add'](w),
        w['position']['x'] = 0x0,
        w['position']['z'] = -k / 0x2 + w['params']['radius2'] / units / 0x2 + 0x2 * q,
        w = new CabinetLeg({
            'height': f['params']['cokol']['height'],
            'is_cokol_active': f['params']['cokol']['is_cokol_active']
        }),
        g['add'](w),
        w['position']['x'] = 0x0,
        w['position']['z'] = k / 0x2 - w['params']['radius2'] / units / 0x2 - 0x3 * q - u / 0x2) : 0x0 != f['params']['cokol']['legs'] && (w = new CabinetLeg({
            'height': f['params']['cokol']['height'],
            'is_cokol_active': f['params']['cokol']['is_cokol_active']
        }),
        g['add'](w),
        w['position']['x'] = -j / 0x2 + w['params']['radius2'] / units / 0x2 + 0x2 * q,
        w['position']['z'] = -k / 0x2 + w['params']['radius2'] / units / 0x2 + 0x2 * q,
        'left' === f['params']['cabinet']['orientation'] && (w['position']['x'] = j / 0x2 - w['params']['radius2'] / units / 0x2 - 0x2 * q),
        w = new CabinetLeg({
            'height': f['params']['cokol']['height'],
            'is_cokol_active': f['params']['cokol']['is_cokol_active']
        }),
        g['add'](w),
        w['position']['x'] = j / 0x2 - w['params']['radius2'] / units / 0x2 - 0x3 * q,
        w['position']['z'] = -k / 0x2 + w['params']['radius2'] / units / 0x2 + 0x2 * q,
        'left' === f['params']['cabinet']['orientation'] && (w['position']['x'] = -j / 0x2 + w['params']['radius2'] / units / 0x2 + 0x3 * q),
        w = new CabinetLeg({
            'height': f['params']['cokol']['height'],
            'is_cokol_active': f['params']['cokol']['is_cokol_active']
        }),
        g['add'](w),
        w['position']['x'] = -j / 0x2 + w['params']['radius2'] / units / 0x2 + 0x2 * q,
        w['position']['z'] = k / 0x2 - w['params']['radius2'] / units / 0x2 - 0x3 * q - u / 0x2,
        'left' === f['params']['cabinet']['orientation'] && (w['position']['x'] = j / 0x2 - w['params']['radius2'] / units / 0x2 - 0x2 * q),
        w = new CabinetLeg({
            'height': f['params']['cokol']['height'],
            'is_cokol_active': f['params']['cokol']['is_cokol_active']
        }),
        g['add'](w),
        w['position']['x'] = j / 0x2 - w['params']['radius2'] / units / 0x2 - 0x3 * q - u / 0x2,
        w['position']['z'] = k / 0x2 - w['params']['radius2'] / units / 0x2 - 0x3 * q - u / 0x2 - u / 0x2,
        'left' === f['params']['cabinet']['orientation']) && (w['position']['x'] = -j / 0x2 + w['params']['radius2'] / units / 0x2 + 0x3 * q + u / 0x2);
        var w = f['const']['calculated_depth'] / units / 0x2 - x - f['params']['cabinet']['thickness'] / units / 0x2;
        'left' === f['params']['cabinet']['orientation'] ? (g['front'] = new Object_wall({
            'width': x,
            'height': x,
            'thickness': m,
            'pX': f['const']['calculated_width'] / units / 0x2,
            'pZ': w,
            'pY': m,
            'rX': Math['PI'] / 0x2,
            'material': v,
            'name': 'cokol_front',
            'shape': build_shape['rounded_cokol'](x, x, q)
        }),
        0x0 < f['params']['tabletop']['offset']['back'] && 0x1 == f['params']['cabinet']['end_corner_side_wall'] && (y += f['params']['tabletop']['offset']['back'],
        z -= f['params']['tabletop']['offset']['back'] / units / 0x2),
        g['left'] = new CabinetCokol({
            'width': y,
            'height': m * units,
            'thickness': q * units,
            'rY': -Math['PI'] / 0x2,
            'pY': m / 0x2,
            'pX': -j / 0x2 + q / 0x2 + f['params']['cabinet']['thickness'] / units / 0x2 + f['params']['cabinet']['thickness'] / units / 0x2,
            'pZ': z,
            'material': v,
            'name': 'cokol_left'
        }),
        g['right'] = new CabinetCokol({
            'width': k * units,
            'height': m * units,
            'thickness': q * units,
            'rY': Math['PI'] / 0x2,
            'pY': m / 0x2,
            'pX': j / 0x2 - q / 0x2,
            'pZ': 0x0,
            'material': v,
            'name': 'cokol_right'
        })) : (g['front'] = new Object_wall({
            'width': x,
            'height': x,
            'thickness': m,
            'pX': -f['const']['calculated_width'] / units / 0x2,
            'pZ': w,
            'pY': m,
            'rX': Math['PI'] / 0x2,
            'rZ': -Math['PI'] / 0x2,
            'material': v,
            'name': 'cokol_front',
            'shape': build_shape['rounded_cokol'](x, x, q)
        }),