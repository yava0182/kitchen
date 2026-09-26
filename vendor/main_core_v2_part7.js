   0x0 < f['params']['tabletop']['offset']['back'] && 0x1 == f['params']['cabinet']['end_corner_side_wall'] && (y += f['params']['tabletop']['offset']['back'],
        z -= f['params']['tabletop']['offset']['back'] / units / 0x2),
        g['right'] = new CabinetCokol({
            'width': y,
            'height': m * units,
            'thickness': q * units,
            'rY': Math['PI'] / 0x2,
            'pY': m / 0x2,
            'pX': j / 0x2 - q / 0x2 - f['params']['cabinet']['thickness'] / units / 0x2 - f['params']['cabinet']['thickness'] / units / 0x2,
            'pZ': z,
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
        g['add'](g['back']);
    }
}
,
Cabinet_new['prototype']['build_sections_end_radius_open'] = function(f={}) {
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
        g['build_shelves_end_radius_open']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['shelves'],
            'params': k
        }));
    }
}
,
Cabinet_new['prototype']['build_shelves_end_radius_open'] = function(f={}) {
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
            'height': void 0x0 !== v['depth'] ? v['depth'] : '100%',
            'thickness': void 0x0 !== v['height'] ? v['height'] : project_settings['shelves_thickness'],
            'orientation': void 0x0 !== v['orientation'] ? v['orientation'] : 'horizontal',
            'material': g['params']['cabinet']['material'],
            'starting_point_x': void 0x0 !== v['starting_point_x'] ? v['starting_point_x'] : '50%',
            'starting_point_y': void 0x0 !== v['starting_point_y'] ? v['starting_point_y'] : '0%',
            'fixed_material': void 0x0 !== v['fixed_material'] ? v['fixed_material'] : null,
            'position_offset_top': void 0x0 !== v['position_offset_top'] ? v['position_offset_top'] : 0x0,
            'position_offset_bottom': void 0x0 !== v['position_offset_bottom'] ? v['position_offset_bottom'] : 0x0,
            'direction_x': void 0x0 !== v['direction_x'] ? v['direction_x'] : 'right',
            'direction_y': void 0x0 !== v['direction_y'] ? v['direction_y'] : 'top',
            'pX': v['pX'] || 0x0,
            'pY': v['pY'] || g['cabinet']['position']['y'],
            'pZ': v['pZ'] || -project_settings['shelve_offset'] / units / 0x2,
            'rX': v['rX'] || Math['PI'] / 0x2,
            'rY': v['rY'] || 0x0,
            'rZ': v['rZ'] || 0x0
        }
          , x = ('string' == typeof w['width'] && -0x1 < w['width']['indexOf']('%') && ('vertical' === w['orientation'] ? w['width'] = (g['params']['cabinet']['height'] - 0x2 * g['params']['cabinet']['thickness']) * parseFloat(w['width']) / 0x64 : w['width'] = (g['const']['calculated_width'] - 0x2 * g['params']['cabinet']['thickness']) * parseFloat(w['width']) / 0x64),
        'string' == typeof w['height'] && -0x1 < w['height']['indexOf']('%') && (w['height'] = (g['const']['calculated_depth'] - g['params']['cabinet']['thickness']) * parseFloat(w['height']) / 0x64),
        'string' == typeof w['starting_point_x'] && -0x1 < w['starting_point_x']['indexOf']('%') && ('center' === w['starting_point_x'] ? w['pX'] = -w['width'] / units / 0x2 : 'right' === w['direction_x'] ? w['pX'] = -g['const']['calculated_width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(w['starting_point_x']) / 0x64 / units : w['pX'] = -g['const']['calculated_width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(w['starting_point_x']) / 0x64 / units - w['width'] / units),
        'string' == typeof w['starting_point_y'] && -0x1 < w['starting_point_y']['indexOf']('%') && ('center' === w['starting_point_y'] ? w['pY'] = m + j['y'] / 0x2 - w['height'] / units / 0x2 : 'top' === w['direction_y'] ? 'horizontal' === w['orientation'] ? w['pY'] = m + (k['height'] - w['position_offset_top']) * parseFloat(w['starting_point_y']) / 0x64 / units : w['pY'] = m + (k['height'] - w['position_offset_top']) * parseFloat(w['starting_point_y']) / 0x64 / units + w['width'] / units / 0x2 : 'horizontal' === w['orientation'] ? w['pY'] = m + k['height'] * parseFloat(w['starting_point_y']) / 0x64 / units - w['height'] / units : w['pY'] = m + k['height'] * parseFloat(w['starting_point_y']) / 0x64 / units - w['width'] / units / 0x2),
        'vertical' === w['orientation'] && (w['rY'] = Math['PI'] / 0x2),
        w['width'] /= units,
        w['height'] /= units,
        w['thickness'] /= units,
        new THREE['Shape']())
          , y = g['const']['calculated_width'] / units - g['params']['cabinet']['thickness'] / units
          , z = g['const']['calculated_depth'] / units - 0x2 * g['params']['cabinet']['thickness'] / units
          , A = g['params']['cabinet']['end_radius'];
        (A = (A = 0x0 == A ? y : g['params']['cabinet']['end_radius'] / units) > y ? y : A) > z && (A = z),
        x = p_shapes['rounded_corners'](y, z, 0x0, 0x0, A, 0x0),
        w['shape'] = x,
        w['pX'] = this['params']['cabinet']['thickness'] / units / 0x2,
        w['pZ'] = this['params']['cabinet']['thickness'] / units / 0x2,
        'left' === g['params']['cabinet']['orientation'] && (w['rY'] = Math['PI'],
        w['pY'] -= w['thickness'],
        w['pX'] = -this['params']['cabinet']['thickness'] / units / 0x2),
        w['fixed_material'] && null != w['fixed_material'] && materials_lib['items'][w['fixed_material']] && (w['material'] = w['fixed_material']);
        var u = new Object_wall(w);
        k['obj_to_add']['add'](u);
    }
}
,
Cabinet_new['prototype']['build_cornice_end_radius_open'] = function() {
    var f = this
      , g = this['cornice']
      , h = f['params']['cornice']
      , j = project_settings['selected_molded_model'] && 0x1 < h['level'];
    let k;
    j && (k = (k = molded_lib['items'][project_settings['selected_molded_model']]['height']) || 0x9),
    h['visible']['front'] && (g['front'] = new Cornice({
        'model': h['model'],
        'type': 'radius'
    }),
    g['front']['position']['set'](-f['params']['cabinet']['width'] / units / 0x2, 0x0, f['params']['cabinet']['depth'] / units / 0x2 - 0.2),
    g['front']['rotation']['y'] = -Math['PI'] / 0x2,
    0x12c < f['params']['cabinet']['width'] && (g['right'] = new Cornice({
        'model': h['model'],
        'width': f['params']['cabinet']['width'] - 0x12c,
        'type': 'straight'
    }),
    g['right']['position']['z'] = f['const']['calculated_depth'] / units / 0x2 + h['offset_front'] / units,
    g['right']['position']['x'] = f['params']['cabinet']['width'] / units / 0x2 - (f['params']['cabinet']['width'] - 0x12c) / units / 0x2,
    f['cornice']['add'](g['right'])),
    'right' === f['params']['cabinet']['orientation'] && (g['front']['position']['x'] *= -0x1,
    0x12c < f['params']['cabinet']['width'] && (g['right']['position']['x'] *= -0x1),
    g['front']['rotation']['y'] = 0x0),
    j && (g['front_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['radius'],
        'type': 'radius'
    }),
    g['front_m']['position']['set'](-f['params']['cabinet']['width'] / units / 0x2, 0x0, f['params']['cabinet']['depth'] / units / 0x2 - 0.2),
    g['front_m']['rotation']['y'] = -Math['PI'] / 0x2,
    0x12c < f['params']['cabinet']['width'] && (g['right_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['params']['cabinet']['width'] - 0x12c,
        'type': 'straight'
    }),
    g['right_m']['position']['z'] = f['const']['calculated_depth'] / units / 0x2 + h['offset_front'] / units,
    g['right_m']['position']['x'] = f['params']['cabinet']['width'] / units / 0x2 - (f['params']['cabinet']['width'] - 0x12c) / units / 0x2,
    g['right']['position']['y'] = k,
    'right' === f['params']['cabinet']['orientation'] && 0x12c < f['params']['cabinet']['width'] && (g['right_m']['position']['x'] *= -0x1),
    f['cornice']['add'](g['right_m'])),
    'right' === f['params']['cabinet']['orientation'] && (g['front_m']['position']['x'] *= -0x1,
    g['front_m']['rotation']['y'] = 0x0),
    g['front']['position']['y'] = k,
    f['cornice']['add'](g['front_m'])),
    f['cornice']['add'](g['front']));
}
,
Cabinet_new['prototype']['build_positions_end_radius_open'] = function() {
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
        this['cabinet']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['params']['cokol']['height'] / units, -this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2),
        this['cokol']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['cokol']['position']['y'], -this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2),
        this['sections']['position']['set'](-this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2, this['params']['cokol']['height'] / units, -this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2),
        this['lockers']['position']['z'] = -this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2,
        this['sizes']['position']['z'] = 0x0,
        this['models']['position']['z'] = -this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2,
        this['doors']['position']['z'] = -this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2,
        this['shelves']['position']['x'] = -this['params']['tabletop']['offset']['right'] / units / 0x2 + this['params']['tabletop']['offset']['left'] / units / 0x2,
        this['shelves']['position']['z'] = -this['params']['tabletop']['offset']['front'] / units / 0x2 + this['params']['tabletop']['offset']['back'] / units / 0x2;
    this['cornice']['position']['y'] = this['cabinet']['position']['y'] + this['params']['cabinet']['height'] / units;
}
,
Cabinet_new['prototype']['build_end_radius_facade'] = function() {
    let j = this
      , k = j['cabinet']
      , q = j['const']['calculated_width'] / units
      , v = j['params']['cabinet']['height'] / units
      , x = j['const']['calculated_depth'] / units
      , y = j['params']['cabinet']['thickness_back'] / units
      , z = j['params']['cabinet']['back_wall_offset'] / units
      , A = j['params']['cabinet']['thickness'] / units
      , B = j['params']['cabinet']['material']
      , C = j['params']['cabinet']['orientation']
      , D = Math['max'](Math['abs']((j['params']['cabinet']['depth'] - j['params']['cabinet']['width'] - j['params']['cabinet']['thickness']) / units), 0x64 / units)
      , E = q - 0x2 * A
      , F = x
      , G = j['params']['cabinet']['end_radius']
      , H = ((G = (G = 0x0 == G ? E : j['params']['cabinet']['end_radius'] / units) > E ? E : G) > F && (G = F),
    k['back_wall'] = new Object_wall({
        'width': q - A,
        'height': v - A,
        'thickness': y,
        'pX': 0x0,
        'pY': v / 0x2,
        'pZ': -x / 0x2 + y / 0x2 - 0.01,
        'material': j['params']['cabinet']['back_wall_material']['id'],
        'name': 'back_wall'
    }),
    D + j['params']['tabletop']['offset']['back'] / units)
      , I = -j['params']['cabinet']['depth'] / units / 0x2 - (this['params']['tabletop']['offset']['back'] / units / 0x2 - this['params']['tabletop']['offset']['front'] / units / 0x2) + H / 0x2;
    0x2 == j['params']['version'] && (I = -j['params']['cabinet']['depth'] / units / 0x2 - j['params']['cabinet']['offset']['back'] / units / 0x2 + D / 0x2),
    'bottom' == j['params']['cabinet_group'] && 'exact' == j['params']['cabinet']['end_side_wall'] && (H = D,
    0x2 == j['params']['version']) && (I = -j['params']['cabinet']['depth'] / units / 0x2 + H / 0x2);
    var J = {
        'width': x,
        'height': v,
        'thickness': A,
        'rY': Math['PI'] / 0x2,
        'pX': -q / 0x2 + A / 0x2,
        'pY': v / 0x2,
        'pZ': 0x0,
        'material': B,
        'name': 'left_wall'
    }
      , K = {
        'width': H,
        'height': v,
        'thickness': A,
        'rY': Math['PI'] / 0x2,
        'pX': q / 0x2 - A / 0x2,
        'pY': v / 0x2,
        'pZ': I,
        'material': B,
        'name': 'left_wall'
    }
      , L = 'full'
      , N = 'full';
    if ('left' === C) {
        if ('facade' != j['params']['left_wall'] || 'facade_simple' != j['params']['left_wall']) {
            for (let O = j['params']['doors']['length']; O--; )
                'left_wall' == j['params']['doors'][O]['tag'] && (j['params']['doors']['splice'](O, 0x1),
                j['doors']['remove'](j['doors']['children'][O]));
        }
        'facade' == j['params']['cabinet']['left_wall'] ? j['params']['doors']['push']({
            'type': 'falsefacade',
            'allow_z': 0x1,
            'allow_x': 0x1,
            'allow_ry': 0x1,
            'facade': j['params']['facade']['id'],
            'material': j['params']['facade']['materials']['gen'],
            'style': L,
            'tag': 'left_wall',
            'width': K['width'] * units - A / 0x2 * units,
            'height': v * units,
            'thickness': A * units,
            'rY': -Math['PI'] / 0x2,
            'pX': -q / 0x2 + A,
            'pY': v / 0x2,
            'pZ': -j['params']['cabinet']['depth'] / units / 0x2 - this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['tabletop']['offset']['front'] / units / 0x2
        }) : 'facade_simple' == j['params']['cabinet']['left_wall'] ? j['params']['doors']['push']({
            'type': 'falsefacade',
            'allow_z': 0x1,
            'allow_x': 0x1,
            'allow_ry': 0x1,
            'facade': j['params']['facade']['id'],
            'material': j['params']['facade']['materials']['gen'],
            'fixed_facade_model': '/common_assets/models/plastic_full.fbx',
            'style': L,
            'tag': 'left_wall',
            'width': K['width'] * units - A / 0x2 * units,
            'height': v * units,
            'thickness': A * units,
            'rY': -Math['PI'] / 0x2,
            'pX': -q / 0x2 + A,
            'pY': v / 0x2,
            'pZ': -j['params']['cabinet']['depth'] / units / 0x2 - this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['tabletop']['offset']['front'] / units / 0x2
        }) : k['left_wall'] = new Object_wall(K),
        k['right_wall'] = new Object_wall(J);
    } else {
        if ('facade' != j['params']['right_wall'] || 'facade_simple' != j['params']['right_wall']) {
            for (let P = j['params']['doors']['length']; P--; )
                'right_wall' == j['params']['doors'][P]['tag'] && (j['params']['doors']['splice'](P, 0x1),
                j['doors']['remove'](j['doors']['children'][P]));
        }
        'facade' == j['params']['cabinet']['right_wall'] ? j['params']['doors']['push']({
            'type': 'falsefacade',
            'allow_z': 0x1,
            'allow_x': 0x1,
            'allow_ry': 0x1,
            'facade': j['params']['facade']['id'],
            'material': j['params']['facade']['materials']['gen'],
            'style': N,
            'tag': 'right_wall',
            'width': K['width'] * units - A / 0x2 * units,
            'height': v * units,
            'thickness': A * units,
            'rY': Math['PI'] / 0x2,
            'pX': q / 0x2 - A,
            'pY': v / 0x2,
            'pZ': -j['params']['cabinet']['depth'] / units / 0x2 - this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['tabletop']['offset']['front'] / units / 0x2 + K['width'] - A / 0x2
        }) : 'facade_simple' == j['params']['cabinet']['right_wall'] ? j['params']['doors']['push']({
            'type': 'falsefacade',
            'allow_z': 0x1,
            'allow_x': 0x1,
            'allow_ry': 0x1,
            'facade': j['params']['facade']['id'],
            'material': j['params']['facade']['materials']['gen'],
            'fixed_facade_model': '/common_assets/models/plastic_full.fbx',
            'style': N,
            'tag': 'right_wall',
            'width': K['width'] * units - A / 0x2 * units,
            'height': v * units,
            'thickness': A * units,
            'rY': Math['PI'] / 0x2,
            'pX': q / 0x2 - A,
            'pY': v / 0x2,
            'pZ': -j['params']['cabinet']['depth'] / units / 0x2 - this['params']['tabletop']['offset']['back'] / units / 0x2 + this['params']['tabletop']['offset']['front'] / units / 0x2 + K['width'] - A / 0x2
        }) : k['right_wall'] = new Object_wall(K),
        k['left_wall'] = new Object_wall(J);
    }
    0x0 != this['params']['tabletop']['offset']['back'] && (k['end_corner_side_wall'] = new Object_wall({
        'width': this['params']['tabletop']['offset']['back'] / units,
        'height': v,
        'thickness': A,
        'rY': Math['PI'] / 0x2,
        'pX': q / 0x2 - 0x3 * A / 0x2,
        'pY': v / 0x2,
        'pZ': -x / 0x2 - this['params']['tabletop']['offset']['back'] / units / 0x2,
        'material': B,
        'name': 'end_side_wall'
    }));
    var L = p_shapes['rounded_corners'](E, F, 0x0, 0x0, G, 0x0);
    k['top_wall'] = new Object_wall({
        'width': E,
        'height': F,
        'thickness': A,
        'rX': Math['PI'] / 0x2,
        'pX': 0x0,
        'pY': v,
        'pZ': 0x0,
        'name': 'top_wall',
        'material': B,
        'shape': L
    }),
    k['bottom_wall'] = new Object_wall({
        'width': E,
        'height': F,
        'thickness': A,
        'rX': Math['PI'] / 0x2,
        'pX': 0x0,
        'pY': A,
        'pZ': 0x0,
        'name': 'top_wall',
        'material': B,
        'shape': L
    }),
    'left' === C && (0x0 != this['params']['tabletop']['offset']['back'] && (k['end_corner_side_wall']['position']['x'] = -q / 0x2 + 0x3 * A / 0x2),
    0x1 == j['params']['cabinet']['right_wall'] && (k['right_wall']['position']['x'] = q / 0x2 - A / 0x2),
    0x1 == j['params']['cabinet']['left_wall'] && (k['left_wall']['position']['x'] = -q / 0x2 + A / 0x2),
    k['top_wall']['rotation']['y'] = Math['PI'],
    k['bottom_wall']['rotation']['y'] = Math['PI'],
    k['top_wall']['position']['y'] = v - A,
    k['bottom_wall']['position']['y'] = 0x0),
    k['add'](k['back_wall']),
    0x1 == j['params']['cabinet']['right_wall'] && k['add'](k['right_wall']),
    0x1 == j['params']['cabinet']['left_wall'] && k['add'](k['left_wall']),
    k['add'](k['top_wall']),
    k['add'](k['bottom_wall']),
    0x0 != this['params']['tabletop']['offset']['back'] && 0x1 == this['params']['cabinet']['end_corner_side_wall'] && k['add'](k['end_corner_side_wall']);
}
,
Cabinet_new['prototype']['build_tabletop_end_radius_facade'] = function() {
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
Cabinet_new['prototype']['build_cokol_end_radius_facade'] = function() {
    if (!(this['params']['cokol']['height'] < 0x1)) {
        var f = this, g = f['cokol'], j = f['const']['calculated_width'] / units, k = f['const']['calculated_depth'] / units, m = f['params']['cokol']['height'] / units, q = f['params']['cokol']['thickness'] / units, u = Math['max'](Math['abs']((f['params']['cabinet']['depth'] - f['params']['cabinet']['width'] - f['params']['cabinet']['thickness']) / units), 0x64 / units), v = f['params']['cokol']['material'], w, x = j - f['params']['cabinet']['thickness'] / units;
        let y = f['const']['calculated_depth'] - x * units + f['params']['tabletop']['offset']['back']
          , z = -k / 0x2 + (f['const']['calculated_depth'] / units - x) / 0x2 - f['params']['tabletop']['offset']['back'] / units / 0x2
          , A = ('to_wall' == f['params']['cabinet']['end_side_wall'] && (y += f['params']['cabinet']['offset']['back'],
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
        'left' === f['params']['cabinet']['orientation']) && (w['position']['x'] = -j / 0x2 + w['params']['radius2'] / units / 0x2 + 0x3 * q + u / 0x2),
        f['const']['calculated_depth'] / units / 0x2 - x - f['params']['cabinet']['thickness'] / units / 0x2);
        'end_radius_open' == this['params']['cabinet']['type'] && (A -= f['params']['cabinet']['thickness_back'] / units),
        'left' === f['params']['cabinet']['orientation'] ? (g['front'] = new Object_wall({
            'width': x,
            'height': x,
            'thickness': m,
            'pX': f['const']['calculated_width'] / units / 0x2,
            'pZ': A,
            'pY': m,
            'rX': Math['PI'] / 0x2,
            'material': v,
            'name': 'cokol_front',
            'shape': build_shape['rounded_cokol'](x, x, q)
        }),
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
            'pZ': A,
            'pY': m,
            'rX': Math['PI'] / 0x2,
            'rZ': -Math['PI'] / 0x2,
            'material': v,
            'name': 'cokol_front',
            'shape': build_shape['rounded_cokol'](x, x, q)
        }),
        g['right'] = new CabinetCokol({
            'width': y,
            'height': m * units,
            'thickness': q * units,
            'rY': Math['PI'] / 0x2,
            'pY': m / 0x2,
            'pX': j / 0x2 - q / 0x2 - f['params']['cabinet']['thickness'] / units / 0x2 - f['params']['cabinet']['thickness'] / units / 0x2,
            'pZ': z,
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
        g['add'](g['back']);
    }
}
,
Cabinet_new['prototype']['build_sections_end_radius_facade'] = function(f={}) {
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
        g['build_shelves_end_radius_facade']({
            'width': k['width'],
            'height': k['height'],
            'obj_to_add': m['shelves'],
            'params': k
        }));
    }
}
,
Cabinet_new['prototype']['build_shelves_end_radius_facade'] = function(f={}) {
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
            'pY': v['pY'] || g['cabinet']['position']['y'],
            'pZ': v['pZ'] || -project_settings['shelve_offset'] / units / 0x2,
            'rX': v['rX'] || Math['PI'] / 0x2,
            'rY': v['rY'] || 0x0,
            'rZ': v['rZ'] || 0x0
        }
          , x = ('string' == typeof w['width'] && -0x1 < w['width']['indexOf']('%') && (w['width'] = 'vertical' === w['orientation'] ? (g['params']['cabinet']['height'] - 0x2 * g['params']['cabinet']['thickness']) * parseFloat(w['width']) / 0x64 : (g['const']['calculated_width'] - 0x2 * g['params']['cabinet']['thickness']) * parseFloat(w['width']) / 0x64),
        'string' == typeof w['height'] && -0x1 < w['height']['indexOf']('%') && (w['height'] = g['params']['cabinet']['depth'] * parseFloat(w['height']) / 0x64),
        'string' == typeof w['starting_point_x'] && -0x1 < w['starting_point_x']['indexOf']('%') && (w['pX'] = 'center' === w['starting_point_x'] ? -w['width'] / units / 0x2 : 'right' === w['direction_x'] ? -g['const']['calculated_width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(w['starting_point_x']) / 0x64 / units : -g['const']['calculated_width'] / units / 0x2 + g['params']['cabinet']['width'] * parseFloat(w['starting_point_x']) / 0x64 / units - w['width'] / units),
        'string' == typeof w['starting_point_y'] && -0x1 < w['starting_point_y']['indexOf']('%') ? w['pY'] = 'center' === w['starting_point_y'] ? m + j['y'] / 0x2 - w['height'] / units / 0x2 : 'top' === w['direction_y'] ? 'horizontal' === w['orientation'] ? m + (k['height'] - w['position_offset_top']) * parseFloat(w['starting_point_y']) / 0x64 / units : m + (k['height'] - w['position_offset_top']) * parseFloat(w['starting_point_y']) / 0x64 / units + w['width'] / units / 0x2 : 'horizontal' === w['orientation'] ? m + k['height'] * parseFloat(w['starting_point_y']) / 0x64 / units - w['height'] / units : m + k['height'] * parseFloat(w['starting_point_y']) / 0x64 / units - w['width'] / units / 0x2 : w['pY'] = w['starting_point_y'] / units,
        'vertical' === w['orientation'] && (w['rY'] = Math['PI'] / 0x2),
        w['width'] /= units,
        w['height'] /= units,
        w['thickness'] /= units,
        Math['max'](Math['abs']((g['params']['cabinet']['depth'] - g['params']['cabinet']['width'] - g['params']['cabinet']['thickness']) / units), 0x64 / units))
          , y = g['const']['calculated_width'] / units - 0x2 * g['params']['cabinet']['thickness'] / units
          , z = g['const']['calculated_depth'] / units - project_settings['shelve_offset'] / units
          , A = g['params']['cabinet']['end_radius'];
        (A = (A = 0x0 == A ? y : g['params']['cabinet']['end_radius'] / units) > y ? y : A) > z && (A = z),
        w['shape'] = p_shapes['rounded'](y, z, A),
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
Cabinet_new['prototype']['build_cornice_end_radius_facade'] = function() {
    var f = this
      , g = this['cornice']
      , h = f['params']['cornice']
      , j = project_settings['selected_molded_model'] && 0x1 < h['level'];
    let k;
    j && (k = (k = molded_lib['items'][project_settings['selected_molded_model']]['height']) || 0x9),
    h['visible']['front'] && (g['front'] = new Cornice({
        'model': h['model'],
        'type': 'radius',
        'orientation': f['params']['cabinet']['orientation']
    }),
    g['front']['position']['set'](f['params']['cabinet']['width'] / units / 0x2, 0x0, f['params']['cabinet']['depth'] / units / 0x2),
    0x12c < f['params']['cabinet']['width'] && (g['right'] = new Cornice({
        'model': h['model'],
        'width': f['params']['cabinet']['width'] - 0x12c,
        'type': 'straight'
    }),
    g['right']['position']['z'] = f['const']['calculated_depth'] / units / 0x2 + h['offset_front'] / units,
    g['right']['position']['x'] = f['params']['cabinet']['width'] / units / 0x2 - (f['params']['cabinet']['width'] - 0x12c) / units / 0x2,
    f['cornice']['add'](g['right'])),
    'right' === f['params']['cabinet']['orientation'] && (g['front']['position']['x'] *= -0x1,
    0x12c < f['params']['cabinet']['width'] && (g['right']['position']['x'] *= -0x1),
    g['front']['rotation']['y'] = 0x0),
    j && (g['front_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['radius'],
        'type': 'radius'
    }),
    g['front_m']['position']['set'](-f['params']['cabinet']['width'] / units / 0x2, 0x0, f['params']['cabinet']['depth'] / units / 0x2 - 0.2),
    g['front_m']['rotation']['y'] = -Math['PI'] / 0x2,
    0x12c < f['params']['cabinet']['width'] && (g['right_m'] = new Cornice({
        'model': molded_lib['items'][project_settings['selected_molded_model']]['model'],
        'width': f['params']['cabinet']['width'] - 0x12c,
        'type': 'straight'
    }),
    g['right_m']['position']['z'] = f['const']['calculated_depth'] / units / 0x2 + h['offset_front'] / units,
    g['right_m']['position']['x'] = f['params']['cabinet']['width'] / units / 0x2 - (f['params']['cabinet']['width'] - 0x12c) / units / 0x2,
    g['right']['position']['y'] = k,
    'right' === f['params']['cabinet']['orientation'] && 0x12c < f['params']['cabinet']['width'] && (g['right_m']['position']['x'] *= -0x1),
    f['cornice']['add'](g['right_m'])),
    'right' === f['params']['cabinet']['orientation'] && (g['front_m']['position']['x'] *= -0x1,
    g['front_m']['rotation']['y'] = 0x0),
    g['front']['position']['y'] = k,
    f['cornice']['add'](g['front_m'])),
    f['cornice']['add'](g['front']));
}
,
Cabinet_new['prototype']['build_positions_end_radius_facade'] = function() {
    if (0x2 == this['params']['version']) {
        let e = -this['params']['tabletop']['depth'] / units / 0x2 + this['params']['cabinet']['depth'] / units / 0x2 + this['params']['cabinet']['offset']['back'] / units;
        'top' != this['params']['cabinet_group'] && this['params']['tabletop']['active'] || (e = this['params']['cabinet']['offset']['back'] / units),
        this['cabinet']['position']['set'](0x0, this['params']['cokol']['height'] / units, e),
        this['cokol']['position']['set'](0x0, this['cokol']['position']['y'], e),
        this['sections']['position']['set'](0x0, this['params']['cokol']['height'] / units, e),
        this['walls']['position']['set'](0x0, this['params']['cokol']['height'] / units, e),
        this['built_in_models']['position']['set'](0x0, this['params']['cokol']['height'] / units, e),
        this['lockers']['position']['z'] = e,
        this['models']['position']['z'] = e,
        this['doors']['position']['z'] = e,
        this['decorations']['position']['z'] = e,
        this['shelves']['position']['z'] = e;
    } else
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
        this['shelves']['position']['z'] = this['params']['tabletop']['offset']['back'] / units / 0x2 - this['params']['tabletop']['offset']['front'] / units / 0x2;
    this['cornice']['position']['y'] = this['cabinet']['position']['y'] + this['params']['cabinet']['height'] / units;
}
,
Cabinet_new['prototype']['build_end_radius_facade_f'] = function() {
    var g = this
      , j = g['cabinet']
      , k = g['const']['calculated_width'] / units
      , q = g['params']['cabinet']['height'] / units
      , v = g['const']['calculated_depth'] / units
      , x = g['params']['cabinet']['thickness_back'] / units
      , y = g['params']['cabinet']['back_wall_offset'] / units
      , z = g['params']['cabinet']['thickness'] / units
      , A = g['params']['cabinet']['material']
      , B = g['params']['cabinet']['orientation']
      , C = Math['max'](Math['abs']((g['params']['cabinet']['depth'] - g['params']['cabinet']['width'] - g['params']['cabinet']['thickness']) / units), 0x64 / units);
    j['back_wall'] = new Object_wall({
        'width': k,
        'height': q,
        'thickness': z,
        'pX': 0x0,
        'pY': q / 0x2,
        'pZ': -v / 0x2 + z / 0x2,
        'material': A,
        'name': 'back_cab_wall'
    });
    let D = -g['params']['cabinet']['depth'] / units / 0x2 + (C + g['params']['tabletop']['offset']['back'] / units) / 0x2
      , E = (0x2 == g['params']['version'] && (D = -g['params']['cabinet']['depth'] / units / 0x2 - g['params']['cabinet']['offset']['back'] / units / 0x2 + C / 0x2),
    C + g['params']['tabletop']['offset']['front'] / units);
    'bottom' == g['params']['cabinet_group'] && 'exact' == g['params']['cabinet']['end_side_wall'] && (E = C,
    0x2 == g['params']['version']) && (D = -g['params']['cabinet']['depth'] / units / 0x2 + E / 0x2);
    var C = {
        'width': v,
        'height': q,
        'thickness': z,
        'rY': Math['PI'] / 0x2,
        'pX': -k / 0x2 + z / 0x2,
        'pY': q / 0x2,
        'pZ': 0x0,
        'material': A,
        'name': 'left_wall'
    }
      , F = {
        'width': E,
        'height': q,
        'thickness': z,
        'rY': Math['PI'] / 0x2,
        'pX': k / 0x2 - z / 0x2,
        'pY': q / 0x2,
        'pZ': D,
        'material': A,
        'name': 'left_wall'
    }
      , G = 'full'
      , H = 'full';
    if ('left' === B) {
        if ('facade' != g['params']['left_wall'] || 'facade_simple' != g['params']['left_wall']) {
            for (let L = g['params']['doors']['length']; L--; )
                'left_wall' == g['params']['doors'][L]['tag'] && (g['params']['doors']['splice'](L, 0x1),
                g['doors']['remove'](g['doors']['children'][L]));
        }
        'facade' == g['params']['cabinet']['left_wall'] ? g['params']['doors']['push']({
            'type': 'falsefacade',
            'allow_z': 0x1,
            'allow_x': 0x1,
            'allow_ry': 0x1,
            'style': G,
            'tag': 'left_wall',
            'width': F['width'] * units,
            'height': q * units,
            'thickness': z * units,
            'rY': -Math['PI'] / 0x2,
            'pX': -k / 0x2 + z,
            'pY': q / 0x2,
            'pZ': -v / 0x2 - y - g['params']['tabletop']['offset']['front'] / units
        }) : 'facade_simple' == g['params']['cabinet']['left_wall'] ? g['params']['doors']['push']({
            'type': 'falsefacade',
            'allow_z': 0x1,
            'allow_x': 0x1,
            'allow_ry': 0x1,
            'fixed_facade_model': '/common_assets/models/plastic_full.fbx',
            'style': G,
            'tag': 'left_wall',
            'width': F['width'] * units,
            'height': q * units,
            'thickness': z * units,
            'rY': -Math['PI'] / 0x2,
            'pX': -k / 0x2 + z,
            'pY': q / 0x2,
            'pZ': -v / 0x2 - y - g['params']['tabletop']['offset']['front'] / units
        }) : j['left_wall'] = new Object_wall(F),
        j['right_wall'] = new Object_wall(C);
    } else {
        if ('facade' != g['params']['right_wall'] || 'facade_simple' != g['params']['right_wall']) {
            for (let N = g['params']['doors']['length']; N--; )
                'right_wall' == g['params']['doors'][N]['tag'] && (g['params']['doors']['splice'](N, 0x1),
                g['doors']['remove'](g['doors']['children'][N]));
        }
        'facade' == g['params']['cabinet']['right_wall'] ? g['params']['doors']['push']({
            'type': 'falsefacade',
            'allow_z': 0x1,
            'allow_x': 0x1,
            'allow_ry': 0x1,
            'facade': g['params']['facade']['id'],
            'material': g['params']['facade']['materials']['gen'],
            'style': H,
            'tag': 'right_wall',
            'width': F['width'] * units,
            'height': q * units,
            'thickness': z * units,
            'rY': Math['PI'] / 0x2,
            'pX': k / 0x2 - z,
            'pY': q / 0x2,
            'pZ': -v / 0x2 - y - g['params']['tabletop']['offset']['front'] / units + F['width']
        }) : 'facade_simple' == g['params']['cabinet']['right_wall'] ? g['params']['doors']['push']({
            'type': 'falsefacade',
            'allow_z': 0x1,
            'allow_x': 0x1,
            'allow_ry': 0x1,
            'facade': g['params']['facade']['id'],
            'material': g['params']['facade']['materials']['gen'],
            'fixed_facade_model': '/common_assets/models/plastic_full.fbx',
            'style': H,
            'tag': 'right_wall',
            'width': F['width'] * units,
            'height': q * units,
            'thickness': z * units,
            'rY': Math['PI'] / 0x2,
            'pX': k / 0x2 - z,
            'pY': q / 0x2,
            'pZ': -v / 0x2 - y - g['params']['tabletop']['offset']['front'] / units + F['width']
        }) : j['right_wall'] = new Object_wall(F),
        j['left_wall'] = new Object_wall(C);
    }
    let I = k - z
      , J = v - z
      , K = g['params']['cabinet']['end_radius'];
    (K = (K = 0x0 == K ? I : g['params']['cabinet']['end_radius'] / units) > I ? I : K) > J && (K = J);
    var G = p_shapes['rounded_corners'](I, J, 0x0, 0x0, K, 0x0);
    j['top_wall'] = new Object_wall({
        'width': I,
        'height': J,
        'thickness': z,
        'rX': Math['PI'] / 0x2,
        'pX': 0x0,
        'pY': q,
        'pZ': z / 0x2,
        'name': 'top_wall',
        'material': A,
        'shape': G
    }),
    j['bottom_wall'] = new Object_wall({
        'width': I,
        'height': J,
        'thickness': z,
        'rX': Math['PI'] / 0x2,
        'pX': 0x0,
        'pY': z,
        'pZ': z / 0x2,
        'name': 'top_wall',
        'material': A,
        'shape': G
    }),
    'left' === B ? (0x1 == g['params']['cabinet']['right_wall'] && (j['right_wall']['position']['x'] = k / 0x2 - z / 0x2),
    0x1 == g['params']['cabinet']['left_wall'] && (j['left_wall']['position']['x'] = -k / 0x2 + z / 0x2),
    j['top_wall']['rotation']['y'] = Math['PI'],
    j['bottom_wall']['rotation']['y'] = Math['PI'],
    j['top_wall']['position']['y'] = q - z,
    j['bottom_wall']['position']['y'] = 0x0,
    j['top_wall']['position']['x'] = -z / 0x2,
    j['bottom_wall']['position']['x'] = -z / 0x2) : (j['top_wall']['position']['x'] = z / 0x2,
    j['bottom_wall']['position']['x'] = z / 0x2),
    j['add'](j['back_wall']),
    'left' == B ? 0x1 == g['params']['cabinet']['right_wall'] && j['add'](j['right_wall']) : 0x1 == g['params']['cabinet']['left_wall'] && j['add'](j['left_wall']),
    j['add'](j['top_wall']),
    j['add'](j['bottom_wall']);
}
),
(Cabinet_new['prototype']['set_cokol_height'] = function(f) {
    0x1 != this['params']['cokol']['fixed'] && (this['params']['cokol']['height'] = f,
    this['reset_model'](this['cokol']),
    this['build_cokol'](),
    global_update());
}
,
Cabinet_new['prototype']['set_cokol_visible'] = function(f, g) {
    var h = this;
    switch (f) {
    case 'left':
        h['params']['cokol']['visible']['left'] = g,
        h['cokol']['left']['visible'] = g;
        break;
    case 'right':
        h['params']['cokol']['visible']['right'] = g,
        h['cokol']['right']['visible'] = g;
        break;
    case 'back':
        h['params']['cokol']['visible']['back'] = g,
        h['cokol']['back']['visible'] = g;
        break;
    case 'front':
        h['params']['cokol']['visible']['front'] = g,
        h['cokol']['front']['visible'] = g;
        break;
    default:
        h['params']['cokol']['visible']['front'] = g,
        h['cokol']['front']['visible'] = g;
    }
}
,
Cabinet_new['prototype']['_set_size_by_number'] = function(f) {
    let g, h;
    'corner_straight' === this['params']['cabinet']['type'] && (h = this['params']['cabinet']['corner_straight_front_wall_width']),
    ('corner' === this['params']['cabinet']['type'] && 0x0 == this['params']['cabinet']['inner_radius'] || 'corner_90' === this['params']['cabinet']['type'] && 0x0 == this['params']['cabinet']['inner_radius']) && (h = this['params']['cabinet']['corner_right_wall_width']),
    ('corner_90' === this['params']['cabinet']['type'] && 0x0 == this['params']['cabinet']['inner_radius'] || 'corner' === this['params']['cabinet']['type'] && 0x0 == this['params']['cabinet']['inner_radius']) && (g = this['params']['cabinet']['width2']),
    this['set_cabinet_size'](f['x'], f['y'], f['z'], h, g);
}
,
Cabinet_new['prototype']['set_cabinet_size'] = function(f, g, h, j, k) {
    var l, m, g;
    pp['custom']['cab_types'][this['params']['cabinet']['type']] ? 'function' == typeof this['set_cabinet_size_' + this['params']['cabinet']['type']] && this['set_cabinet_size_' + this['params']['cabinet']['type']](f, g, h, j, k) : (l = this['userData']?.['computed']?.['size']?.['y'],
    m = {
        'type': 'build',
        'from': copy_object(this['params']),
        'object': this
    },
    null == k && (k = f),
    null != j && !isNaN(j) || (j = h),
    isNaN(f) && (f = 0x1),
    isNaN(g) && (g = 0x1),
    isNaN(h) && (h = 0x1),
    this['params']['cabinet']['width'] = f,
    this['params']['cabinet']['height'] = g,
    this['params']['cabinet']['original_height'] = g,
    this['params']['cabinet']['depth'] = h,
    'corner_straight' === this['params']['cabinet']['type'] && (this['params']['cabinet']['corner_straight_front_wall_width'] = j),
    ('corner' === this['params']['cabinet']['type'] && 0x0 == this['params']['cabinet']['inner_radius'] || 'corner_90' === this['params']['cabinet']['type'] && 0x0 == this['params']['cabinet']['inner_radius']) && (this['params']['cabinet']['corner_right_wall_width'] = j,
    !custom_settings['link_corner_depth']) || (this['params']['cabinet']['corner_right_wall_width'] = h),
    ('corner_90' === this['params']['cabinet']['type'] && 0x0 == this['params']['cabinet']['inner_radius'] || 'corner' === this['params']['cabinet']['type'] && 0x0 == this['params']['cabinet']['inner_radius']) && (this['params']['cabinet']['width2'] = k,
    !custom_settings['link_corner_width']) || (this['params']['cabinet']['width2'] = f),
    m['to'] = copy_object(this['params']),
    add_undo_action(m),
    this['build'](),
    g = this['userData']?.['computed']?.['size']?.['y'],
    (constructor_settings['tabletop_v2'] || constructor_settings['core_v2']) && (this['translate_washers']({
        'y': (g - l) / units
    }),
    sc['need_update_tabletops']()),
    check_overlap());
}
,
Cabinet_new['prototype']['set_size_by_index'] = function(f) {
    var g = {
        'type': 'build',
        'from': copy_object(this['params']),
        'object': this
    }
      , h = this['params']['variants'][f];
    this['params']['cabinet']['width'] = parseInt(h['width']),
    this['params']['cabinet']['height'] = parseInt(h['height']),
    this['params']['cabinet']['original_height'] = parseInt(h['height']),
    this['params']['cabinet']['depth'] = parseInt(h['depth']),
    h['corner_straight_wall_width'] && (this['params']['cabinet']['corner_straight_front_wall_width'] = parseInt(h['corner_straight_wall_width'])),
    this['params']['accessories_variant'] = [],
    h['accessories'] && (this['params']['accessories_variant'] = h['accessories']),
    h['width2'] || (h['width2'] = parseInt(h['width'])),
    h['corner_right_wall_width'] || (this['params']['cabinet']['corner_right_wall_width'] = parseInt(h['depth'])),
    h['width2'] && (this['params']['cabinet']['width2'] = parseInt(h['width2'])),
    this['params']['name'] = h['name'],
    this['params']['code'] = h['code'],
    this['params']['price'] = h['price'],
    this['params']['selected_variant'] = f,
    g['to'] = copy_object(this['params']),
    add_undo_action(g),
    this['build'](),
    (constructor_settings['tabletop_v2'] || constructor_settings['core_v2']) && (sc['build_tabletop'](),
    setTimeout( () => {}
    , 0x1f4)),
    check_overlap(),
    get_wall_panel(),
    get_total_price_test();
}
,
Cabinet_new['prototype']['set_cornice_active'] = function(f) {
    let g = this;
    var h = {
        'front': this['params']['cornice']['visible']['front'],
        'left': this['params']['cornice']['visible']['left'],
        'right': this['params']['cornice']['visible']['right']
    }, i;
    Object['keys'](f)['forEach'](function(j) {
        g['params']['cornice']['visible'][j] = f[j];
    }),
    this['build_cornice'](),
    constructor_settings['core_v2'] && (i = _['get'](this, 'userData.parts.cornice_placer[0]')) && i['_rebuild'](),
    add_undo_action({
        'type': 'cornice_active',
        'object': this,
        'from': h,
        'to': f
    }),
    get_total_price_test(),
    global_update();
}
,
Cabinet_new['prototype']['show_radial_menu'] = function(f, g, h) {
    var j = this, k = {
        'material': !0x0,
        'copy_button': !0x0
    }, m;
    'false_facade_tabletop' !== j['params']['cabinet']['type'] && 'false_facade_facade' !== j['params']['cabinet']['type'] && 'false_facade_facade_b' !== j['params']['cabinet']['type'] && (k['material_corpus'] = !0x0),
    'object' == typeof project_settings['materials']['top']['back_wall_material'] && (k['material_back_wall'] = !0x0),
    k['rotate_buttons'] = !0x0;
    let n, p, q = (k['sizes'] = !0x0,
    k['total_settings'] = !0x0,
    0x0);
    if (0x1 != (q = 0x1 == constructor_settings['facade_style_change_availabale'] ? j['userData']['has_facades'] : q) || 'false_facade' === j['params']['cabinet']['type'] || 'false_facade_tabletop' === j['params']['cabinet']['type'] || 'false_facade_facade' === j['params']['cabinet']['type'] || 'false_facade_facade_b' === j['params']['cabinet']['type'] || (m = facades_lib['get_item'](project_settings['models'][j['params']['cabinet_group']]),
    k['facade_type'] = !0x0,
    k['facade_type_full'] = !0x0,
    k['facade_type_window'] = !0x0,
    'end_radius_facade' === j['params']['cabinet']['type'] && 'end_radius_facade_f' === j['params']['cabinet']['type'] || (k['facade_type_frame'] = !0x0),
    m['frame'] && 0x0 !== m['frame']['length']) || (k['facade_type_frame'] = !0x1),
    j['userData']['has_facades']) {
        if (k['open_doors'] = !0x0,
        project_settings['is_facades_system'] || (k['material_facade'] = !0x0),
        j['params']['doors']['length'] && (p = j['params']['doors'][0x0]['material']),
        j['params']['lockers']['length'] && (p = j['params']['lockers'][0x0]['material']),
        j['params']['sections']['length']) {
            for (let v = 0x0; v < j['params']['sections']['length']; v++)
                j['params']['sections'][v]['doors'] && j['params']['sections'][v]['doors']['length'] && (p = j['params']['sections'][v]['doors'][0x0]['material']),
                j['params']['sections'][v]['lockers'] && j['params']['sections'][v]['lockers']['length'] && (p = j['params']['sections'][v]['lockers'][0x0]['material']);
        }
        let u = !0x1;
        if (project_settings['materials']['glass']) {
            for (let w = 0x0; w < j['params']['doors']['length']; w++)
                if (JSON['stringify'](j['params']['doors'][w])['indexOf']('full') < 0x0) {
                    u = !0x0,
                    n = parseInt(j['params']['doors'][w]['glass_material']);
                    break;
                }
            for (let x = 0x0; x < j['params']['lockers']['length']; x++)
                if (JSON['stringify'](j['params']['lockers'][x])['indexOf']('full') < 0x0) {
                    u = !0x0,
                    n = parseInt(j['params']['lockers'][x]['glass_material']);
                    break;
                }
            if (j['params']['sections']['length'])
                for (let y = 0x0; y < j['params']['sections']['length']; y++) {
                    if (j['params']['sections'][y]['doors'] && j['params']['sections'][y]['doors']['length'] && JSON['stringify'](j['params']['sections'][y]['doors'])['indexOf']('full') < 0x0) {
                        u = !0x0,
                        n = parseInt(j['params']['sections'][y]['doors']);
                        break;
                    }
                    if (j['params']['sections'][y]['lockers'] && j['params']['sections'][y]['lockers']['length'] && JSON['stringify'](j['params']['sections'][y]['lockers'])['indexOf']('full') < 0x0) {
                        u = !0x0,
                        n = parseInt(j['params']['sections'][y]['lockers']['glass_material']);
                        break;
                    }
                }
        }
        project_settings['available_selection'] && 0x1 != project_settings['available_selection']['allow_glass_material_select'] && (u = !0x1),
        k['material_glass'] = u;
    }
    project_settings['available_selection'] && (0x0 == project_settings['available_selection']['allow_facades_materials_select'] && (k['material_facade'] = !0x1),
    0x0 == project_settings['available_selection']['allow_corpus_materials_select']) && (k['material_corpus'] = !0x1),
    !0x1 === k['material_glass'] && !0x1 === k['material_facade'] && !0x1 === k['material_corpus'] && (k['material'] = !0x1),
    j['params']['change_opens'] && (k['open_type'] = !0x0),
    'bottom' === j['params']['cabinet_group'] && 'false_facade_tabletop' !== j['params']['cabinet']['type'] && 'false_facade_facade' !== j['params']['cabinet']['type'] && 'corner_90' !== j['params']['cabinet']['type'] && 0x0 != j['params']['tabletop']['active'] && (k['tech'] = !0x0,
    k['hob'] = !0x0,
    k['sink'] = !0x1,
    0x1f3 < j['params']['cabinet']['width'] && (k['sink'] = !0x0),
    -0x1 < window['location']['href']['split']('?')[0x0]['toLowerCase']()['indexOf']('ronner-3d.com') && 0x0 < j['params']['lockers']['length'] && (k['sink'] = !0x1),
    !0x0 === j['params']['hob']['active'] && (k['sink'] = !0x1),
    !0x0 === j['params']['sink']['active']) && (k['hob'] = !0x1),
    'false_facade' != j['params']['cabinet']['type'] && 'false_facade_facade' != j['params']['cabinet']['type'] && 'false_facade_facade_b' != j['params']['cabinet']['type'] || (k['open_doors'] = !0x1),
    'corner_open' != j['params']['cabinet']['type'] && 'end_corner_facade' != j['params']['cabinet']['type'] && 'end_radius_open' != j['params']['cabinet']['type'] && 'end_radius_facade' != j['params']['cabinet']['type'] && 'end_radius_facade_f' != j['params']['cabinet']['type'] && 'corner_open_facade' != j['params']['cabinet']['type'] && 'false_facade_facade' != j['params']['cabinet']['type'] || (k['flip_button'] = !0x0),
    pp['interface']['root']['radial']({
        'obj_type': this['type'],
        'obj': k,
        'left': f,
        'top': g
    });
}
,
Cabinet_new['prototype']['change_orientation'] = function() {
    var f = this
      , g = this['params'];
    if ('corner_open' != g['cabinet']['type'] && 'end_radius_open' != g['cabinet']['type'] || ('left' == g['cabinet']['orientation'] ? (g['cabinet']['orientation'] = 'right',
    0x1 == g['cokol']['visible']['left'] && (g['cokol']['visible']['left'] = !0x1,
    g['cokol']['visible']['right'] = !0x0)) : (g['cabinet']['orientation'] = 'left',
    0x1 == g['cokol']['visible']['right'] && (g['cokol']['visible']['right'] = !0x1,
    g['cokol']['visible']['left'] = !0x0)),
    this['build']()),
    'end_corner_facade' == g['cabinet']['type'] || 'end_radius_facade' == g['cabinet']['type'] || 'end_radius_facade_f' == g['cabinet']['type']) {
        if ('left' == g['cabinet']['orientation']) {
            g['cabinet']['orientation'] = 'right',
            0x1 == g['cokol']['visible']['left'] && (g['cokol']['visible']['left'] = !0x1,
            g['cokol']['visible']['right'] = !0x0),
            0x1 == g['cornice']['visible']['left'] && (g['cornice']['visible']['left'] = !0x1,
            g['cornice']['visible']['right'] = !0x0),
            0x1 == g['cabinet']['left_wall'] && 0x0 == g['cabinet']['left_wall'] || (g['cabinet']['right_wall'] = g['cabinet']['left_wall'],
            g['cabinet']['left_wall'] = !0x0);
            for (let h = g['doors']['length']; h--; )
                !g['doors'][h]['tag'] || 'left_wall' != g['doors'][h]['tag'] && 'right_wall' != g['doors'][h]['tag'] || (g['doors']['splice'](h, 0x1),
                this['doors']['remove'](this['doors']['children'][h]));
            g['doors'][0x0]['type'] = 'ltr';
        } else {
            g['cabinet']['orientation'] = 'left',
            0x1 == g['cokol']['visible']['right'] && (g['cokol']['visible']['right'] = !0x1,
            g['cokol']['visible']['left'] = !0x0),
            0x1 == g['cornice']['visible']['right'] && (g['cornice']['visible']['right'] = !0x1,
            g['cornice']['visible']['left'] = !0x0),
            0x1 == g['cabinet']['right_wall'] && 0x0 == g['cabinet']['right_wall'] || (g['cabinet']['left_wall'] = g['cabinet']['right_wall'],
            g['cabinet']['right_wall'] = !0x0);
            for (let i = g['doors']['length']; i--; )
                !g['doors'][i]['tag'] || 'left_wall' != g['doors'][i]['tag'] && 'right_wall' != g['doors'][i]['tag'] || (g['doors']['splice'](i, 0x1),
                this['doors']['remove'](this['doors']['children'][i]));
            g['doors'][0x0]['type'] = 'rtl';
        }
        this['build']();
    }
    if ('corner_open_facade' == g['cabinet']['type']) {
        if ('left' == g['cabinet']['orientation']) {
            g['cabinet']['orientation'] = 'right',
            0x1 == g['cokol']['visible']['left'] && (g['cokol']['visible']['left'] = !0x1,
            g['cokol']['visible']['right'] = !0x0),
            0x1 == g['cornice']['visible']['left'] && (g['cornice']['visible']['left'] = !0x1,
            g['cornice']['visible']['right'] = !0x0),
            0x1 == g['cabinet']['left_wall'] && 0x0 == g['cabinet']['left_wall'] || (g['cabinet']['right_wall'] = g['cabinet']['left_wall'],
            g['cabinet']['left_wall'] = !0x0);
            for (let j = g['doors']['length']; j--; )
                !g['doors'][j]['tag'] || 'left_wall' != g['doors'][j]['tag'] && 'right_wall' != g['doors'][j]['tag'] || (g['doors']['splice'](j, 0x1),
                this['doors']['remove'](this['doors']['children'][j]));
            g['doors'][0x0]['type'] = 'rtl',
            g['doors'][0x1]['type'] = 'ltr';
        } else {
            g['cabinet']['orientation'] = 'left',
            0x1 == g['cokol']['visible']['right'] && (g['cokol']['visible']['right'] = !0x1,
            g['cokol']['visible']['left'] = !0x0),
            0x1 == g['cornice']['visible']['right'] && (g['cornice']['visible']['right'] = !0x1,
            g['cornice']['visible']['left'] = !0x0),
            0x1 == g['cabinet']['right_wall'] && 0x0 == g['cabinet']['right_wall'] || (g['cabinet']['left_wall'] = g['cabinet']['right_wall'],
            g['cabinet']['right_wall'] = !0x0);
            for (let k = g['doors']['length']; k--; )
                !g['doors'][k]['tag'] || 'left_wall' != g['doors'][k]['tag'] && 'right_wall' != g['doors'][k]['tag'] || (g['doors']['splice'](k, 0x1),
                this['doors']['remove'](this['doors']['children'][k]));
            g['doors'][0x0]['type'] = 'ltr',
            g['doors'][0x1]['type'] = 'rtl';
        }
        this['build']();
    }
    'false_facade_facade' == f['params']['cabinet']['type'] && ('left' == g['cabinet']['orientation'] ? g['cabinet']['orientation'] = 'right' : g['cabinet']['orientation'] = 'left',
    this['build']());
}
,
Cabinet_new['prototype']['change_opens'] = function() {
    for (var f = this, g = {
        'type': 'change_opens',
        'from': copy_object(f['params']['doors']),
        'object': f
    }, h = f['doors']['children']['length'] - 0x1; 0x0 <= h; h--) {
        if ('ltr' === f['params']['doors'][h]['type']) {
            for (let l = 0x0; l < f['params']['doors'][h]['available_opens']['length']; l++)
                'rtl' === f['params']['doors'][h]['available_opens'][l] && (f['params']['doors'][h]['type'] = 'rtl');
        } else {
            if ('rtl' === f['params']['doors'][h]['type']) {
                for (let m = 0x0; m < f['params']['doors'][h]['available_opens']['length']; m++)
                    'ltr' === f['params']['doors'][h]['available_opens'][m] && (f['params']['doors'][h]['type'] = 'ltr');
            }
        }
        'corner_90_ltr' === f['params']['doors'][h]['type'] ? f['params']['doors'][h]['type'] = 'corner_90_rtl' : 'corner_90_rtl' === f['params']['doors'][h]['type'] && (f['params']['doors'][h]['type'] = 'corner_90_ltr');
    }
    for (let n = 0x0; n < f['sections']['children']['length']; n++) {
        var j = f['sections']['children'][n]
          , k = f['params']['sections'][n];
        if (j['doors'])
            for (let o = 0x0; o < j['doors']['children']['length']; o++) {
                if ('ltr' === k['doors'][o]['type']) {
                    for (let p = 0x0; p < k['doors'][o]['available_opens']['length']; p++)
                        'rtl' === k['doors'][o]['available_opens'][p] && (k['doors'][o]['type'] = 'rtl');
                } else {
                    if ('rtl' === k['doors'][o]['type']) {
                        for (let q = 0x0; q < k['doors'][o]['available_opens']['length']; q++)
                            'ltr' === k['doors'][o]['available_opens'][q] && (k['doors'][o]['type'] = 'ltr');
                    }
                }
                'corner_90_ltr' === k['doors'][o]['type'] ? k['doors'][o]['type'] = 'corner_90_rtl' : 'corner_90_rtl' === k['doors'][o]['type'] && (k['doors'][o]['type'] = 'corner_90_ltr');
            }
    }
    'common' == f['params']['cabinet']['type'] && f['build_sections'](),
    g['to'] = copy_object(f['params']['doors']),
    add_undo_action(g),
    f['build_doors']();
}
,
Cabinet_new['prototype']['get_price'] = function() {
    if (0x1 == constructor_settings['shop_mode'] && !custom_settings['use_materials_prices']) {
        if (0x1 == constructor_settings['multiple_facades_mode'] && 0x1 != constructor_settings['use_module_base_price_mf']) {
            if (h = 0x0,
            project_settings['prices_data']) {
                var f, f, g, h = 0x0, f = this['params']['facade'] && this['params']['facade']['id'] ? this['params']['facade']['id'] : 'bottom' === this['params']['cabinet_group'] ? project_settings['models']['bottom'] : project_settings['models']['top'], f = objectFindByKey(project_settings['prices_data'], 'id', f);
                if (null === f)
                    return this['params']['price'] = 0x0;
                if (!f['modules'])
                    return this['params']['price'] = 0x0;
                if (f = f['modules']) {
                    var f = objectFindByKey(f, 'id', this['params']['id']);
                    if (f) {
                        for (var g = f['variants'], j = 0x0; j < g['length']; j++)
                            g[j]['width'] == this['params']['cabinet']['width'] && g[j]['height'] == this['params']['cabinet']['height'] && g[j]['depth'] == this['params']['cabinet']['depth'] && (h = parseInt(g[j]['price']),
                            0x0 == do_not_overwrite_code_in_multiple_facades_mode) && (this['params']['code'] = g[j]['code']);
                    } else
                        this['params']['price'] = 0x0;
                }
            }
            let q = 0x0;
            this['params']['price'] = parseFloat(h) * constructor_settings['price_modificator'],
            q = parseFloat(h) * constructor_settings['price_modificator'];
            var k, f = this['get_furniture_price']({});
            if (q += f,
            constructor_settings['price_mode'] && constructor_settings['price_mode']['type'] == PRICE_MODE['MIXED']) {
                let u = this['get_price_specs'](!0x0);
                var m = this['params']['price'];
                Object['keys'](u)['forEach'](function(v) {
                    constructor_settings['price_mode']['settings'] && 0x1 == constructor_settings['price_mode']['settings'][v] && (q += u[v]);
                });
            }
            return this['params']['price'] = q;
        }
        {
            let v = 0x0;
            var f = {};
            if (constructor_settings['price_mode'] && constructor_settings['price_mode']['type'] == PRICE_MODE['MIXED']) {
                let w = 0x0;
                var n = {};
                let x = this['get_price_specs'](!0x0);
                void 0x0 !== this['params']['price'] && '' !== this['params']['price'] && (w = parseFloat(this['params']['price']) * constructor_settings['price_modificator']);
                var p = this['get_furniture_price'](n);
                return Object['keys'](x)['forEach'](function(y) {
                    constructor_settings['price_mode']['settings'] && 0x1 == constructor_settings['price_mode']['settings'][y] && (w += x[y]);
                }),
                w += p,
                this['price_description'] = n,
                w;
            }
            void 0x0 !== this['params']['price'] && '' !== this['params']['price'] && (v = parseFloat(this['params']['price']) * constructor_settings['price_modificator']);
            var p = this['get_furniture_price'](f);
            return v += p,
            this['price_description'] = f,
            v;
        }
    }
    if (0x1 == constructor_settings['price_enabled'])
        return this['get_price_specs']();
}
,
Cabinet_new['prototype']['add_accessories'] = function(f, g) {
    let h = -0x1;
    for (let i = this['params']['accessories_list']['length']; i--; )
        if (this['params']['accessories_list'][i]['id'] == f['id']) {
            h = i;
            break;
        }
    -0x1 < h ? this['params']['accessories_list'][h]['count'] += g : this['params']['accessories_list']['push']({
        'id': f['id'],
        'count': g,
        'c': 0x1
    }),
    this['params']['accessories_comments_string'] = this['params']['accessories_comments_string']['replace']('\x20\x0a\x20' + f['name'], ''),
    this['params']['accessories_comments']['push'](f['id']),
    this['build_comments'](),
    pp['interface']['root']['$emit']('accessories_list_update');
}
,
Cabinet_new['prototype']['remove_accessories'] = function(f) {
    for (let h = this['params']['accessories_list']['length']; h--; )
        this['params']['accessories_list'][h]['id'] == f['id'] && this['params']['accessories_list']['splice'](h, 0x1);
    for (let i = this['params']['accessories_comments']['length'] - 0x1; -0x1 < i; i--) {
        var g = this['params']['accessories_comments'][i];
        f['id'] === g && (this['params']['accessories_comments']['splice'](i, 0x1),
        this['params']['accessories_comments_string'] = this['params']['accessories_comments_string']['replace']('\x20\x0a\x20' + f['name'], ''));
    }
    this['build_comments'](),
    pp['interface']['root']['$emit']('accessories_list_update');
}
,
Cabinet_new['prototype']['get_furniture_types_count'] = function() {
    if (0x0 < Object['keys'](this['params']['accessories_types'])['length'])
        return this['get_furniture_types_count_custom']();
    let f = this
      , g = {
        'door': {
            'count': 0x0,
            'id': null
        },
        'locker': {
            'count': 0x0,
            'id': null
        },
        'simple_top': {
            'count': 0x0,
            'id': null
        },
        'double_top': {
            'count': 0x0,
            'id': null
        },
        'front_top': {
            'count': 0x0,
            'id': null
        }
    };
    if ('false_facade' === f['params']['cabinet']['type'] || 'false_facade_facade' === f['params']['cabinet']['type'] || 'false_facade_facade_b' === f['params']['cabinet']['type'] || 'false_facade_tabletop' === f['params']['cabinet']['type'])
        return this['furniture_data'] = g;
    for (let A = 0x0; A < this['params']['doors']['length']; A++) {
        var j, k, j, k, m, q;
        'ltr' !== this['params']['doors'][A]['type'] && 'rtl' !== this['params']['doors'][A]['type'] || (furniture_rules['door'] && furniture_rules['door']['types'] && furniture_rules['door']['rules'] && furniture_rules['door']['rules']['length'] ? this['doors'] && this['doors']['children']['length'] && (j = this['doors']['children'][A]['params']['width'],
        k = this['doors']['children'][A]['params']['height'],
        g['door']['count'] += get_by_wh(furniture_rules['door']['rules'], j, k)) : g['door']['count'] += 0x2),
        'simple_top' === this['params']['doors'][A]['type'] && (furniture_rules['simple_top'] && furniture_rules['simple_top']['types'] && furniture_rules['simple_top']['rules'] && furniture_rules['simple_top']['rules']['length'] ? this['doors'] && this['doors']['children']['length'] && (j = this['doors']['children'][A]['params']['width'],
        k = this['doors']['children'][A]['params']['height'],
        g['door']['count'] += get_by_wh(furniture_rules['simple_top']['rules'], j, k)) : g['door']['count'] += 0x2,
        g['simple_top']['count'] += 0x2),
        'double_top' === this['params']['doors'][A]['type'] && (g['door']['count'] += 0x2,
        g['double_top']['count'] += 0x1),
        'front_top' === this['params']['doors'][A]['type'] && (g['front_top']['count'] += 0x1),
        'corner_90_rtl' !== this['params']['doors'][A]['type'] && 'corner_90_ltr' !== this['params']['doors'][A]['type'] || (furniture_rules['door'] && furniture_rules['door']['types'] && furniture_rules['door']['rules'] && furniture_rules['door']['rules']['length'] ? this['doors'] && this['doors']['children']['length'] && (m = this['doors']['children'][A]['params']['width'],
        q = this['doors']['children'][A]['params']['height'],
        g['door']['count'] += get_by_wh(furniture_rules['door']['rules'], m, q)) : g['door']['count'] += 0x4);
    }
    for (let B = 0x0; B < this['sections']['children']['length']; B++) {
        var u = this['sections']['children'][B];
        if (u['doors'])
            for (let C = 0x0; C < u['doors']['children']['length']; C++) {
                var v = u['doors']['children'][C], w, x, w, x, y, v;
                'ltr' !== v['params']['type'] && 'rtl' !== v['params']['type'] || (furniture_rules['door'] && furniture_rules['door']['types'] && furniture_rules['door']['rules'] && furniture_rules['door']['rules']['length'] ? u['doors'] && u['doors']['children']['length'] && (w = v['params']['width'],
                x = v['params']['height'],
                g['door']['count'] += get_by_wh(furniture_rules['door']['rules'], w, x)) : g['door']['count'] += 0x2),
                'simple_top' === v['params']['type'] && (furniture_rules['simple_top'] && furniture_rules['simple_top']['types'] && furniture_rules['simple_top']['rules'] && furniture_rules['simple_top']['rules']['length'] ? u['doors'] && u['doors']['children']['length'] && (w = v['params']['width'],
                x = v['params']['height'],
                g['door']['count'] += get_by_wh(furniture_rules['simple_top']['rules'], w, x)) : g['door']['count'] += 0x2,
                g['simple_top']['count'] += 0x2),
                'double_top' === v['params']['type'] && (g['door']['count'] += 0x2,
                g['double_top']['count'] += 0x1),
                'front_top' === v['params']['type'] && (g['front_top']['count'] += 0x1),
                'corner_90_rtl' !== v['params']['type'] && 'corner_90_ltr' !== v['params']['type'] || (furniture_rules['door'] && furniture_rules['door']['types'] && furniture_rules['door']['rules'] && furniture_rules['door']['rules']['length'] ? u['doors'] && u['doors']['children']['length'] && (y = v['params']['width'],
                v = v['params']['height'],
                g['door']['count'] += get_by_wh(furniture_rules['door']['rules'], y, v)) : g['door']['count'] += 0x4);
            }
        if (u['lockers']) {
            for (let D = 0x0; D < u['lockers']['children']['length']; D++)
                g['locker']['count'] += 0x1;
        }
    }
    Object['keys'](g)['forEach'](function(E) {
        g[E]['id'] = f['selected_furniture'][E];
    });
    for (let E = 0x0; E < this['params']['lockers']['length']; E++)
        g['locker']['count'] += 0x1;
    'function' == typeof custom_furniture_rules && custom_furniture_rules(this, g),
    this['furniture_data'] = g;
    let z = copy_object(g);
    return Object['keys'](z)['forEach'](function(F) {
        delete z[F]['excluded'],
        0x0 == z[F]['count'] && delete z[F];
    }),
    this['params']['furniture_data'] = z,
    g;
}
,
Cabinet_new['prototype']['get_furniture_types_count_custom'] = function() {
    let e = this
      , f = e['params']['accessories_types']
      , g = (Object['keys'](f)['forEach'](function(h) {
        if (furniture_rules[h] && furniture_rules[h]['types'] && furniture_rules[h]['rules'] && furniture_rules[h]['rules']['length']) {
            if (f[h]['count'] = 0x0,
            e['doors'] && e['doors']['children']['length'])
                for (let q = 0x0; q < e['params']['doors']['length']; q++) {
                    var j, k;
                    furniture_rules[h]['types'][e['params']['doors'][q]['type']] && (j = e['doors']['children'][q]['params']['width'],
                    k = e['doors']['children'][q]['params']['height'],
                    f[h]['count'] += get_by_wh(furniture_rules[h]['rules'], j, k),
                    f[h]['id'] = e['selected_furniture'][h]);
                }
            for (let u = 0x0; u < e['sections']['children']['length']; u++) {
                var m = e['sections']['children'][u];
                if (m['doors'])
                    for (let v = 0x0; v < m['doors']['children']['length']; v++) {
                        var n = m['doors']['children'][v], p, n;
                        furniture_rules[h]['types'][n['params']['type']] && (p = n['params']['width'],
                        n = n['params']['height'],
                        f[h]['count'] += get_by_wh(furniture_rules[h]['rules'], p, n),
                        f[h]['id'] = e['selected_furniture'][h]);
                    }
            }
        } else
            f[h]['id'] = e['selected_furniture'][h];
    }),
    this['furniture_data'] = f,
    copy_object(f));
    return Object['keys'](g)['forEach'](function(h) {
        delete g[h]['excluded'],
        0x0 == g[h]['count'] && delete g[h];
    }),
    this['params']['furniture_data'] = g,
    f;
}
,
Cabinet_new['prototype']['get_furniture_price'] = function(f) {
    let g = 0x0
      , h = this['get_furniture_types_count']();
    f['furniture'] = [],
    Object['keys'](h)['forEach'](function(p) {
        null !== h[p]['id'] && null !== accsessories_data['default'][p] && '' != h[p]['id'] && void 0x0 !== h[p]['id'] && 0x0 != h[p]['count'] && accsessories_data['items'][h[p]['id']] && (f['furniture']['push']({
            'name': accsessories_data['items'][h[p]['id']]['code'] + '\x20' + accsessories_data['items'][h[p]['id']]['name'],
            'count': h[p]['count'],
            'price': h[p]['count'] * parseFloat(accsessories_data['items'][h[p]['id']]['price']),
            'price_per_piece': parseFloat(accsessories_data['items'][h[p]['id']]['price'])
        }),
        g += h[p]['count'] * parseFloat(accsessories_data['items'][h[p]['id']]['price']));
    }),
    f['accessories'] = [];
    for (let p = 0x0; p < this['params']['accessories_default']['length']; p++) {
        var j = this['params']['accessories_default'][p]['id']
          , k = this['params']['accessories_default'][p]['count'];
        accsessories_data['items'][j] && (f['accessories']['push']({
            'name': accsessories_data['items'][j]['code'] + '\x20' + accsessories_data['items'][j]['name'],
            'count': k,
            'price': k * parseFloat(accsessories_data['items'][j]['price']),
            'price_per_piece': parseFloat(accsessories_data['items'][j]['price'])
        }),
        g += k * parseFloat(accsessories_data['items'][j]['price']));
    }
    for (let q = 0x0; q < this['params']['accessories_variant']['length']; q++) {
        var m = this['params']['accessories_variant'][q]['id']
          , n = this['params']['accessories_variant'][q]['count'];
        accsessories_data['items'][m] && (f['accessories']['push']({
            'name': accsessories_data['items'][m]['code'] + '\x20' + accsessories_data['items'][m]['name'],
            'count': n,
            'price': n * parseFloat(accsessories_data['items'][m]['price']),
            'price_per_piece': parseFloat(accsessories_data['items'][m]['price'])
        }),
        g += n * parseFloat(accsessories_data['items'][m]['price']));
    }
    return g;
}
,
Cabinet_new['prototype']['get_specs'] = function(f) {
    var g = copy_object(specs_result), j, k, m, m, q, u;
    this['washer']['children']['length'] && 0x1 < this['washer']['children'][0x0]['params']['v'] && g['washes']['push']({
        'id': this['washer']['children'][0x0]['params']['id'],
        'count': 0x1,
        'material': this['washer']['children'][0x0]['params']['material']
    });
    for (let C = 0x0; C < this['cabinet']['children']['length']; C++)
        if ('LineSegments' !== this['cabinet']['children'][C]['type']) {
            if ('Facade' == this['cabinet']['children'][C]['type']) {
                var v = this['cabinet']['children'][C]['get_specs'](), v;
                v['is_fix'] ? g['facades_fixed']['push'](v['data']) : (g['facades'][v['type_key']][v['style']] || (g['facades'][v['type_key']][v['style']] = []),
                g['facades'][v['type_key']][v['style']]['push'](v['data']),
                null != (v = this['cabinet']['children'][C]['get_glass_specs']()) && g['glass']['push'](v));
            } else {
                if ('common' == this['params']['cabinet']['type'] || 'corner_straight' == this['params']['cabinet']['type']) {
                    if (0x1 == this['params']['cabinet']['back_wall'] && -0x1 < this['cabinet']['children'][C]['name']['indexOf']('back_wall') && 'object' == typeof project_settings['materials']['top']['back_wall_material']) {
                        let D = 0x0
                          , E = 0x0
                          , F = 0x3;
                        'type_0' != this['params']['cabinet']['back_wall_material']['key'] || project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']] || (this['params']['cabinet']['back_wall_material']['key'] = Object['keys'](project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'])[0x0]),
                        project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']] && (D = project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']]['offset']['width'],
                        E = project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']]['offset']['height'],
                        'wall' == project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']]['offset']['width_type'] && (D = 0x2 * this['params']['cabinet']['thickness']),
                        'wall' == project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']]['offset']['height_type'] && (E = 0x2 * this['params']['cabinet']['thickness']),
                        F = project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']]['thickness'],
                        'corpus' == project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']]['mode'] && (F = 0x10),
                        'facade' == project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']]['mode']) && (F = 0x10);
                        var v = this['cabinet']['children'][C]['params']['width'] * units - D
                          , w = this['cabinet']['children'][C]['params']['height'] * units - E
                          , w = parseFloat(to_fix2(v / 0x3e8 * w / 0x3e8));
                        g['back_wall']['push']({
                            'id': this['params']['cabinet']['back_wall_material']['id'],
                            'm2': w,
                            'pm': 0x0,
                            'thickness': F,
                            'key': this['params']['cabinet']['back_wall_material']['key']
                        });
                        continue;
                    }
                } else {
                    if (0x1 == this['params']['cabinet']['back_wall'] && -0x1 < this['cabinet']['children'][C]['name']['indexOf']('back_wall') && 'object' == typeof project_settings['materials']['top']['back_wall_material']) {
                        let G = 0x0
                          , H = 0x0
                          , I = 0x3;
                        'type_0' != this['params']['cabinet']['back_wall_material']['key'] || project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']] || (this['params']['cabinet']['back_wall_material']['key'] = Object['keys'](project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'])[0x0]),
                        project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']] && (G = project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']]['offset']['width'],
                        H = project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']]['offset']['height'],
                        'wall' == project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']]['offset']['width_type'] && (G = 0x2 * this['params']['cabinet']['thickness']),
                        'wall' == project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']]['offset']['height_type'] && (H = 0x2 * this['params']['cabinet']['thickness']),
                        I = project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']]['thickness'],
                        'corpus' == project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']]['mode'] && (I = 0x10),
                        'facade' == project_settings['materials'][this['params']['cabinet_group']]['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']]['mode']) && (I = 0x10);
                        var w = this['cabinet']['children'][C]['params']['width'] * units - G
                          , j = this['cabinet']['children'][C]['params']['height'] * units - H
                          , j = parseFloat(to_fix2(w / 0x3e8 * j / 0x3e8));
                        g['back_wall']['push']({
                            'id': this['params']['cabinet']['back_wall_material']['id'],
                            'm2': j,
                            'pm': 0x0,
                            'thickness': I,
                            'key': this['params']['cabinet']['back_wall_material']['key']
                        });
                        continue;
                    }
                }
                -0x1 < this['cabinet']['children'][C]['name']['indexOf']('back_wall') || (g['corpus']['push']({
                    'id': this['params']['cabinet']['material'],
                    'm2': parseFloat((this['cabinet']['children'][C]['params']['width'] * units / 0x3e8 * this['cabinet']['children'][C]['params']['height'] * units / 0x3e8)['toFixed'](0x2)),
                    'pm': 0x0,
                    'thickness': this['cabinet']['children'][C]['params']['thickness'] * units
                }),
                g['edge']['push']({
                    'id': this['params']['cabinet']['material'],
                    'm2': parseFloat((this['cabinet']['children'][C]['params']['width'] * units / 0x3e8 * this['cabinet']['children'][C]['params']['height'] * units / 0x3e8)['toFixed'](0x2)),
                    'pm': parseFloat(this['cabinet']['children'][C]['params']['width'] * units * 0x2 / 0x3e8 + this['cabinet']['children'][C]['params']['height'] * units * 0x2 / 0x3e8),
                    'name': this['cabinet']['children'][C]['name']
                }),
                j = {
                    'id': this['params']['cabinet']['material'],
                    'width': this['cabinet']['children'][C]['params']['width'] * units,
                    'height': this['cabinet']['children'][C]['params']['height'] * units,
                    'thickness': this['cabinet']['children'][C]['params']['thickness'] * units,
                    'name': this['cabinet']['children'][C]['name']
                },
                'bottom' != this['params']['cabinet_group'] || 'common' != this['params']['cabinet']['type'] && 'corner_straight' != this['params']['cabinet']['type'] && 'corner' != this['params']['cabinet']['type'] && 'corner_90' != this['params']['cabinet']['type'] || constructor_settings['tmp_convert_details'] && ('bottom_wall' == this['cabinet']['children'][C]['name'] && (j['width'] += 0x2 * j['thickness']),
                'left_wall' == this['cabinet']['children'][C]['name'] && (j['height'] -= j['thickness']),
                'right_wall' == this['cabinet']['children'][C]['name']) && (j['height'] -= j['thickness']),
                g['details_corpus']['push'](j));
            }
        }
    for (let J = 0x0; J < this['walls']['children']['length']; J++)
        if ('LineSegments' !== this['walls']['children'][J]['type']) {
            let K = 0xa;
            this['walls']['children'][J]['userData']['units_included'] && (K = 0x1),
            g['corpus']['push']({
                'id': this['params']['cabinet']['material'],
                'm2': parseFloat((this['walls']['children'][J]['params']['width'] * K / 0x3e8 * this['walls']['children'][J]['params']['height'] * K / 0x3e8)['toFixed'](0x2)),
                'pm': 0x0,
                'thickness': this['walls']['children'][J]['params']['thickness'] * K
            }),
            g['edge']['push']({
                'id': this['params']['cabinet']['material'],
                'm2': parseFloat((this['walls']['children'][J]['params']['width'] * units / 0x3e8 * this['walls']['children'][J]['params']['height'] * units / 0x3e8)['toFixed'](0x2)),
                'pm': parseFloat(this['walls']['children'][J]['params']['width'] * units * 0x2 / 0x3e8 + this['walls']['children'][J]['params']['height'] * units * 0x2 / 0x3e8)
            }),
            g['details_corpus']['push']({
                'id': this['params']['cabinet']['material'],
                'width': this['walls']['children'][J]['params']['width'] * K,
                'height': this['walls']['children'][J]['params']['height'] * K,
                'thickness': this['walls']['children'][J]['params']['thickness'] * K,
                'name': 'Горизонт'
            });
        }
    for (let L = 0x0; L < this['cokol']['children']['length']; L++)
        'Mesh' !== this['cokol']['children'][L]['type'] && 'CabinetCokol' != this['cokol']['children'][L]['temp_type'] || !0x1 !== this['cokol']['children'][L]['visible'] && 'function' == typeof this['cokol']['children'][L]['get_specs'] && g['cokol']['push'](this['cokol']['children'][L]['get_specs']());
    for (let N = 0x0; N < this['shelves']['children']['length']; N++)
        if ('LineSegments' !== this['shelves']['children'][N]['type']) {
            let O = 0xa;
            this['shelves']['children'][N]['userData']['units_included'] && (O = 0x1),
            g['corpus']['push']({
                'id': this['params']['cabinet']['material'],
                'm2': parseFloat((this['shelves']['children'][N]['params']['width'] * O / 0x3e8 * this['shelves']['children'][N]['params']['height'] * O / 0x3e8)['toFixed'](0x2)),
                'pm': 0x0,
                'thickness': this['shelves']['children'][N]['params']['thickness'] * O
            }),
            g['edge']['push']({
                'id': this['params']['cabinet']['material'],
                'm2': parseFloat((this['shelves']['children'][N]['params']['width'] * units / 0x3e8 * this['shelves']['children'][N]['params']['height'] * units / 0x3e8)['toFixed'](0x2)),
                'pm': parseFloat(this['shelves']['children'][N]['params']['width'] * units * 0x2 / 0x3e8 + this['shelves']['children'][N]['params']['height'] * units * 0x2 / 0x3e8)
            }),
            g['details_shelves']['push']({
                'id': this['params']['cabinet']['material'],
                'width': this['shelves']['children'][N]['params']['width'] * O,
                'height': this['shelves']['children'][N]['params']['height'] * O,
                'thickness': this['shelves']['children'][N]['params']['thickness'] * O
            });
        }
    if (0x1 != constructor_settings['tabletop_v2'])
        for (let P = 0x0; P < this['tabletop']['children']['length']; P++) {
            'LineSegments' !== this['tabletop']['children'][P]['type'] && (k = {
                'id': 0x0,
                'm2': 0x0,
                'pm': 0x0
            },
            ('Facade' === this['tabletop']['children'][P]['type'] ? (k['id'] = this['params']['tabletop']['material'],
            k['pm'] += this['tabletop']['children'][P]['params']['width'] / 0x3e8,
            g['tabletop_plints']) : ('corner' === this['params']['cabinet']['type'] ? k['m2'] = parseFloat((this['tabletop']['children'][P]['params']['width'] / 0x3e8 * this['tabletop']['children'][P]['params']['width'] / 0x3e8)['toFixed'](0x2)) : k['m2'] = parseFloat((this['tabletop']['children'][P]['params']['width'] / 0x3e8 * this['tabletop']['children'][P]['params']['depth'] / 0x3e8)['toFixed'](0x2)),
            k['pm'] += this['tabletop']['children'][P]['params']['width'] / 0x3e8,
            k['id'] = this['params']['tabletop']['material'],
            g['tabletop']))['push'](k));
        }
    for (let Q = 0x0; Q < this['doors']['children']['length']; Q++)
        if ('LineSegments' !== this['doors']['children'][Q]['type'] && 0x0 != this['doors']['children'][Q]['params']['active']) {
            for (let R = 0x0; R < this['doors']['children'][Q]['children']['length']; R++) {
                this['doors']['children'][Q]['children'][R]['params'] && this['doors']['children'][Q]['children'][R]['type'] && 'Facade' == this['doors']['children'][Q]['children'][R]['type'] && ((m = this['doors']['children'][Q]['children'][R]['get_specs']())['is_fix'] ? g['facades_fixed']['push'](m['data']) : (g['facades'][m['type_key']][m['style']] || (g['facades'][m['type_key']][m['style']] = []),
                g['facades'][m['type_key']][m['style']]['push'](m['data']),
                null != (m = this['doors']['children'][Q]['children'][R]['get_glass_specs']()) && g['glass']['push'](m)));
            }
            project_settings['handle'][this['params']['cabinet_group']]['no_handle'] || this['doors']['children'][Q]['handle'] && !this['doors']['children'][Q]['params']['no_handle_forced'] && g['handles']['push'](this['doors']['children'][Q]['handle']['get_specs']());
        }
    for (let S = 0x0; S < this['lockers']['children']['length']; S++) {
        'LineSegments' !== this['lockers']['children'][S]['type'] && 0x0 != this['lockers']['children'][S]['params']['active'] && ((q = this['lockers']['children'][S]['get_specs']())['facade_specs'] && ((u = q['facade_specs'])['is_fix'] ? g['facades_fixed']['push'](u['data']) : (g['facades'][u['type_key']][u['style']] || (g['facades'][u['type_key']][u['style']] = []),
        g['facades'][u['type_key']][u['style']]['push'](u['data']),
        q['glass_specs'] && g['glass']['push'](q['glass_specs']))),
        q['handle_specs'] && g['handles']['push'](q['handle_specs']),
        g['corpus']['push'](...q['corpus']),
        g['edge']['push'](...q['edge']),
        g['back_wall']['push'](...q['back_wall']));
    }
    for (let T = 0x0; T < this['sections']['children']['length']; T++) {
        var x = this['sections']['children'][T], y, z, A, A;
        if (x['lockers'])
            for (let U = 0x0; U < x['lockers']['children']['length']; U++) {
                'LineSegments' !== x['lockers']['children'][U]['type'] && 0x0 != x['lockers']['children'][U]['params']['active'] && ((y = x['lockers']['children'][U]['get_specs']())['facade_specs'] && ((z = y['facade_specs'])['is_fix'] ? g['facades_fixed']['push'](z['data']) : (g['facades'][z['type_key']][z['style']] || (g['facades'][z['type_key']][z['style']] = []),
                g['facades'][z['type_key']][z['style']]['push'](z['data']),
                y['glass_specs'] && g['glass']['push'](y['glass_specs']))),
                y['handle_specs'] && g['handles']['push'](y['handle_specs']),
                g['corpus']['push'](...y['corpus']),
                g['edge']['push'](...y['edge']),
                g['back_wall']['push'](...y['back_wall']));
            }
        if (x['doors']) {
            for (let W = 0x0; W < x['doors']['children']['length']; W++)
                if ('LineSegments' !== x['doors']['children'][W]['type'] && 0x0 != x['doors']['children'][W]['params']['active']) {
                    for (let Z = 0x0; Z < x['doors']['children'][W]['children']['length']; Z++) {
                        x['doors']['children'][W]['children'][Z]['params'] && x['doors']['children'][W]['children'][Z]['type'] && 'Facade' == x['doors']['children'][W]['children'][Z]['type'] && ((A = x['doors']['children'][W]['children'][Z]['get_specs']())['is_fix'] ? g['facades_fixed']['push'](A['data']) : (g['facades'][A['type_key']][A['style']] || (g['facades'][A['type_key']][A['style']] = []),
                        g['facades'][A['type_key']][A['style']]['push'](A['data']),
                        null != (A = x['doors']['children'][W]['children'][Z]['get_glass_specs']()) && g['glass']['push'](A)));
                    }
                    project_settings['handle'][this['params']['cabinet_group']]['no_handle'] || x['doors']['children'][W]['handle'] && !x['doors']['children'][W]['params']['no_handle_forced'] && g['handles']['push'](x['doors']['children'][W]['handle']['get_specs']());
                }
        }
        if (x['shelves']) {
            for (let a0 = 0x0; a0 < x['shelves']['children']['length']; a0++)
                'LineSegments' !== x['shelves']['children'][a0]['type'] && (g['corpus']['push']({
                    'id': this['params']['cabinet']['material'],
                    'm2': parseFloat((x['shelves']['children'][a0]['params']['width'] * units / 0x3e8 * x['shelves']['children'][a0]['params']['height'] * units / 0x3e8)['toFixed'](0x2)),
                    'pm': 0x0,
                    'thickness': x['shelves']['children'][a0]['params']['thickness'] * units
                }),
                g['edge']['push']({
                    'id': this['params']['cabinet']['material'],
                    'm2': parseFloat((x['shelves']['children'][a0]['params']['width'] * units / 0x3e8 * x['shelves']['children'][a0]['params']['height'] * units / 0x3e8)['toFixed'](0x2)),
                    'pm': parseFloat(x['shelves']['children'][a0]['params']['width'] * units * 0x2 / 0x3e8 + x['shelves']['children'][a0]['params']['height'] * units * 0x2 / 0x3e8)
                }),
                g['details_shelves']['push']({
                    'id': this['params']['cabinet']['material'],
                    'width': x['shelves']['children'][a0]['params']['width'] * units,
                    'height': x['shelves']['children'][a0]['params']['height'] * units,
                    'thickness': x['shelves']['children'][a0]['params']['thickness'] * units
                }));
        }
        if (x['walls']) {
            for (let a1 = 0x0; a1 < x['walls']['children']['length']; a1++)
                'LineSegments' !== x['walls']['children'][a1]['type'] && (g['corpus']['push']({
                    'id': this['params']['cabinet']['material'],
                    'm2': parseFloat((x['walls']['children'][a1]['params']['width'] * units / 0x3e8 * x['walls']['children'][a1]['params']['height'] * units / 0x3e8)['toFixed'](0x2)),
                    'pm': 0x0,
                    'thickness': x['walls']['children'][a1]['params']['thickness'] * units
                }),
                g['edge']['push']({
                    'id': this['params']['cabinet']['material'],
                    'm2': parseFloat((x['walls']['children'][a1]['params']['width'] * units / 0x3e8 * x['walls']['children'][a1]['params']['height'] * units / 0x3e8)['toFixed'](0x2)),
                    'pm': parseFloat(x['walls']['children'][a1]['params']['width'] * units * 0x2 / 0x3e8 + x['walls']['children'][a1]['params']['height'] * units * 0x2 / 0x3e8)
                }),
                g['details_corpus']['push']({
                    'id': this['params']['cabinet']['material'],
                    'width': x['walls']['children'][a1]['params']['width'] * units,
                    'height': x['walls']['children'][a1]['params']['height'] * units,
                    'thickness': x['walls']['children'][a1]['params']['thickness'] * units,
                    'name': 'Горизонт'
                }));
        }
    }
    for (let a2 = this['cornice']['children']['length']; a2--; ) {
        var B = this['cornice']['children'][a2];
        switch (B['params']['type']) {
        case 'radius':
            g['cornice']['radius']['push']({
                'id': this['params']['cornice']['material'],
                'orientation': this['params']['cabinet']['orientation'],
                'count': 0x1
            });
            break;
        case 'corner':
            g['cornice']['corner']['push']({
                'id': this['params']['cornice']['material'],
                'count': 0x1
            });
            break;
        case 'corner_45':
            g['cornice']['corner45']['push']({
                'id': this['params']['cornice']['material'],
                'count': 0x1
            });
            break;
        default:
            g['cornice']['common']['push']({
                'id': this['params']['cornice']['material'],
                'pm': parseFloat(B['params']['width']) / 0x3e8
            });
            break;
        }
    }
    return this['specs'] = g,
    'function' == typeof cabinet_specs_calculation_callback && cabinet_specs_calculation_callback(g, this),
    f ? convert_specs(g) : g;
}
,
Cabinet_new['prototype']['get_price_specs'] = function(q=!0x1) {
    let z = this['get_specs'](!0x0)
      , A = this
      , B = 0x0
      , C = {
        'corpus': 0x0,
        'edge': 0x0,
        'cokol': 0x0,
        'tabletop': 0x0,
        'tabletop_plints': 0x0,
        'facades': 0x0,
        'facades_edge': 0x0,
        'facades_fixed': 0x0,
        'handles': 0x0,
        'glass': 0x0,
        'back_wall': 0x0
    }
      , D = {}
      , E = !0x1;
    var F = this['params']['variants'][this['params']['selected_variant']], F, F, F = (F['width'] == this['params']['cabinet']['width'] && F['height'] == this['params']['cabinet']['height'] && F['depth'] == this['params']['cabinet']['depth'] && (E = !0x0),
    F['price'] && 0x0 != F['price'] && 0x1 == constructor_settings['use_corpus_direct_price'] && 0x1 == E ? (D['corpus'] = [],
    F = parseFloat(this['params']['variants'][this['params']['selected_variant']]['price']),
    D['corpus']['push']({
        'name': this['params']['variants'][this['params']['selected_variant']]['name'],
        'm2': 0x0,
        'pm': 0x0,
        'count': 0x1,
        'price': F,
        'price_per_piece': F
    }),
    C['corpus'] += F,
    B += F) : (F = Object['keys'](z['corpus']))['length'] && (D['corpus'] = [],
    F['forEach'](function(a1) {
        var a2;
        Object['keys'](z['corpus'][a1])['forEach'](function(a3) {
            let a4 = get_material_by_id(a3)
              , a5 = (a4 = a4 || get_material_by_id(0x0),
            prices['corpus'][a1]);
            a5 = a5 || prices['corpus'];
            var a6 = objectFindByKey(a5, 'id', a4['category']);
            if (a6) {
                let a7, a8 = (a7 = (0x0 != a6['get_from_parent'] && null != a6['get_from_parent'] ? objectFindByKey(a5, 'id', a6['parent']) : a6)['price']) * z['corpus'][a1][a3]['m2'];
                custom_settings['top_module_price_modificator'] && 'top' == A['params']['cabinet_group'] && (a7 *= parseFloat(custom_settings['top_module_price_modificator']),
                a8 *= parseFloat(custom_settings['top_module_price_modificator'])),
                D['corpus']['push'](get_desc_arr(z['corpus'][a1][a3], a8, a7, a1)),
                C['corpus'] += a8,
                B += a8;
            }
        });
    })),
    Object['keys'](z['back_wall']));
    if (F['length'] && (D['back_wall'] = [],
    F['forEach'](function(a1) {
        var a2;
        Object['keys'](z['back_wall'][a1])['forEach'](function(a3) {
            let a4 = z['back_wall'][a1][a3]['mat_data'];
            if (a4 = a4 || get_material_by_id(0x0),
            'custom' == project_settings['materials'][A['params']['cabinet_group']]['back_wall_material'][a1]['mode'] || 'custom_as_corpus' == project_settings['materials'][A['params']['cabinet_group']]['back_wall_material'][a1]['mode']) {
                var a5, a5;
                let a7;
                if (prices['back_wall']) {
                    if (!(a5 = prices['back_wall'][a1]))
                        return;
                    a7 = objectFindByKey(a5, 'id', a4['category']);
                } else
                    a7 = {
                        'price': 0x0
                    };
                a7 && ('' == a7['price'] && (a7['price'] = 0x0),
                a5 = parseFloat(a7['price']) * z['back_wall'][a1][a3]['m2'],
                D['back_wall']['push'](get_desc_back_wall(z['back_wall'][a1][a3], a5, a7['price'], z['back_wall'][a1][a3]['thickness'])),
                C['back_wall'] += a5,
                B += a5);
            }
            if ('corpus' == project_settings['materials'][A['params']['cabinet_group']]['back_wall_material'][a1]['mode']) {
                let a8 = prices['corpus'][0x10];
                a8 = a8 || prices['corpus'];
                var a5 = objectFindByKey(a8, 'id', a4['category']);
                if (a5) {
                    let a9;
                    var a6 = (a9 = (0x0 != a5['get_from_parent'] && null != a5['get_from_parent'] ? objectFindByKey(a8, 'id', a5['parent']) : a5)['price']) * z['back_wall'][a1][a3]['m2'];
                    D['back_wall']['push'](get_desc_back_wall(z['back_wall'][a1][a3], a6, a5['price'], z['back_wall'][a1][a3]['thickness'])),
                    C['back_wall'] += a6,
                    B += a6;
                }
            }
            if ('facade' == project_settings['materials'][A['params']['cabinet_group']]['back_wall_material'][a1]['mode']) {
                let aa = 0x0;
                var a5 = facades_lib['items'][project_settings['defaults']['facades']['top']], a6;
                a5['prices'] && (a5['prices'][0x0] && a5['prices'][0x0][a4['category']] && (a5['prices'][0x0][a4['category']]['price'] ? aa = parseFloat(('' + a5['prices'][0x0][a4['category']]['price'])['replace'](',', '.')) : 0x0 != a5['prices'][0x0][a4['category']]['parent'] && 0x0 == parseFloat(('' + a5['prices'][0x0][a4['category']]['price'])['replace'](',', '.')) && (aa = parseFloat(('' + a5['prices'][0x0][a5['prices'][0x0][a4['category']]['parent']]['price'])['replace'](',', '.')))),
                a6 = aa * z['back_wall'][a1][a3]['m2'],
                D['back_wall']['push'](get_desc_back_wall(z['back_wall'][a1][a3], a6, aa, z['back_wall'][a1][a3]['thickness'])),
                a5['back_wall'] += a6,
                B += a6);
            }
        });
    })),
    Object['keys'](z['cokol'])['length'] && (D['cokol'] = [],
    Object['keys'](z['cokol'])['forEach'](function(a1) {
        let a2 = get_material_by_id(a1);
        a2 = a2 || get_material_by_id(0x0);
        var a3 = objectFindByKey(prices['cokol'], 'id', a2['category']);
        if (a3) {
            let a4;
            var a3 = (a4 = (0x0 != a3['get_from_parent'] && null != a3['get_from_parent'] ? objectFindByKey(prices['cokol'], 'id', a3['parent']) : a3)['price']) * z['cokol'][a1]['m2'];
            D['cokol']['push'](get_desc_arr(z['cokol'][a1], a3, a4)),
            C['cokol'] += a3,
            B += a3;
        }
    })),
    prices['edge'] && Object['keys'](z['edge'])['length'] && (D['edge'] = [],
    Object['keys'](z['edge'])['forEach'](function(a1) {
        let a2 = get_material_by_id(a1);
        a2 = a2 || get_material_by_id(0x0);
        var a3 = objectFindByKey(prices['edge'], 'id', a2['category']);
        if (a3) {
            let a4;
            var a3 = (a4 = (0x0 != a3['get_from_parent'] && null != a3['get_from_parent'] ? objectFindByKey(prices['edge'], 'id', a3['parent']) : a3)['price']) * z['edge'][a1]['pm'];
            D['edge']['push'](get_desc_arr_name_only(z['edge'][a1], a3, a4)),
            C['edge'] += a3,
            B += a3;
        }
    })),
    Object['keys'](z['tabletop'])['length'] && (D['tabletop'] = [],
    Object['keys'](z['tabletop'])['forEach'](function(a1) {
        let a2 = get_material_by_id(a1);
        a2 = a2 || get_material_by_id(0x0);
        var a3 = objectFindByKey(prices['tabletop'], 'id', a2['category']);
        if (a3) {
            let a4;
            var a3 = (a4 = (0x0 != a3['get_from_parent'] && null != a3['get_from_parent'] ? objectFindByKey(prices['tabletop'], 'id', a3['parent']) : a3)['price']) * z['tabletop'][a1]['m2'];
            D['tabletop']['push'](get_desc_arr(z['tabletop'][a1], a3, a4)),
            C['tabletop'] += a3,
            B += a3;
        }
    })),
    Object['keys'](z['tabletop_plints'])['length'] && prices['tabletop_plints'] && (D['tabletop_plints'] = [],
    Object['keys'](z['tabletop_plints'])['forEach'](function(a1) {
        let a2 = get_material_by_id(a1);
        a2 = a2 || get_material_by_id(0x0);
        var a3 = objectFindByKey(prices['tabletop_plints'], 'id', a2['category']);
        if (a3) {
            let a4;
            var a3 = (a4 = (0x0 != a3['get_from_parent'] && null != a3['get_from_parent'] ? objectFindByKey(prices['tabletop_plints'], 'id', a3['parent']) : a3)['price']) * z['tabletop_plints'][a1]['pm'];
            D['tabletop_plints']['push'](get_desc_arr(z['tabletop_plints'][a1], a3, a4)),
            C['tabletop_plints'] += a3,
            B += a3;
        }
    })),
    Object['keys'](z['facades'])['length'] && (D['facades'] = [],
    Object['keys'](z['facades'])['forEach'](function(a1) {
        let a2 = z['facades'][a1];
        Object['keys'](a2)['forEach'](function(a3) {
            var a4 = a2[a3];
            Object['keys'](a4)['forEach'](function(a5) {
                var a6 = a5['split']('_')
                  , a7 = a6[0x0]
                  , a6 = a6[0x1];
                let a8 = facades_lib['items'][a7];
                if ((a8 = a8 || objectFindByKey(facades_sets, 'id', facades_sets[facades_sets['length'] - 0x1]['id']))['prices']) {
                    var a7 = materials_lib['get_item'](a6)
                      , a6 = a7['code']
                      , a7 = a7['category'];
                    let a9 = 0x0
                      , aa = 0x0;
                    a8['prices_decor'] && a8['prices_decor'][a6] && a8['prices_decor'][a6]['price'][a3] && (a9 = 0x1,
                    aa = parseFloat(a8['prices_decor'][a6]['price'][a3])),
                    0x0 == a9 && a8['prices'][a3] && a8['prices'][a3][a7] && (a8['prices'][a3][a7]['price'] ? aa = parseFloat(('' + a8['prices'][a3][a7]['price'])['replace'](',', '.')) : 0x0 != a8['prices'][a3][a7]['parent'] && 0x0 == parseFloat(('' + a8['prices'][a3][a7]['price'])['replace'](',', '.')) && (aa = parseFloat(('' + a8['prices'][a3][a8['prices'][a3][a7]['parent']]['price'])['replace'](',', '.'))));
                    var a6 = aa * z['facades'][a1][a3][a5]['m2'];
                    if (D['facades']['push'](get_desc_facade(z['facades'][a1][a3][a5], a6, aa)),
                    C['facades'] += a6,
                    B += a6,
                    a8['prices_edge']) {
                        D['facades_edge'] = [];
                        let ab = 0x0;
                        a8['prices_edge'][a3] && a8['prices_edge'][a3][a7] && (a8['prices_edge'][a3][a7]['price'] ? ab = parseFloat(('' + a8['prices_edge'][a3][a7]['price'])['replace'](',', '.')) : 0x0 != a8['prices_edge'][a3][a7]['parent'] && 0x0 == parseFloat(('' + a8['prices_edge'][a3][a7]['price'])['replace'](',', '.')) && a8['prices_edge'][a3][a8['prices_edge'][a3][a7]['parent']] && a8['prices_edge'][a3][a8['prices_edge'][a3][a7]['parent']]['price'] && (ab = parseFloat(('' + a8['prices_edge'][a3][a8['prices_edge'][a3][a7]['parent']]['price'])['replace'](',', '.'))));
                        var a6 = ab * z['facades'][a1][a3][a5]['per'] / 0x3e8;
                        D['facades_edge']['push'](get_desc_arr(z['facades'][a1][a3][a5], a6, ab)),
                        C['facades_edge'] += a6,
                        B += a6;
                    }
                }
            });
        });
    })),
    Object['keys'](z['facades_fixed'])['length'] && (D['facades_fixed'] = [],
    Object['keys'](z['facades_fixed'])['forEach'](function(a1) {
        var a1 = z['facades_fixed'][a1]
          , a2 = parseFloat(a1['price'])
          , a3 = a2 * a1['count']
          , a4 = (C['facades_fixed'] += a3,
        B += a3,
        {});
        a4['name'] = a1['name'],
        a4['code'] = a1['code'],
        a4['count'] = a1['count'],
        a4['price'] = a3,
        a4['price_per_piece'] = a2,
        D['facades_fixed']['push'](a4);
    })),
    Object['keys'](z['handles'])['length'] && (D['handles'] = [],
    Object['keys'](z['handles'])['forEach'](function(a1) {
        let a2 = 0x0;
        var a3, a4, a5, a3, a4, a5, a3, a4, a5;
        'common' == z['handles'][a1]['type'] && (a3 = objectFindByKey(handles_catalog['items'], 'id', z['handles'][a1]['id']),
        a4 = objectFindByKey(a3['sizes'], 'width', z['handles'][a1]['width']),
        a2 = parseFloat(('' + a4['price'])['replace'](',', '.')),
        -0x1 < (a2 = isNaN(a2) ? 0x0 : a2)) && (a5 = a2 * z['handles'][a1]['count'],
        D['handles']['push'](get_desc_handle({
            'obj': a3,
            'size': a4,
            'specs': z['handles'][a1]
        }, a5, a2)),
        C['handles'] += a5,
        B += a5),
        'facade_profile' != z['handles'][a1]['type'] && 'overhead_profile' != z['handles'][a1]['type'] || (a4 = (a3 = objectFindByKey(handles_catalog['items'], 'id', z['handles'][a1]['id']))['sizes'][0x0],
        a2 = parseFloat(('' + a4['price'])['replace'](',', '.')),
        -0x1 < (a2 = isNaN(a2) ? 0x0 : a2) && (a5 = a2 * z['handles'][a1]['count'] * parseInt(z['handles'][a1]['width']) / 0x3e8,
        D['handles']['push'](get_desc_handle({
            'obj': a3,
            'size': a4,
            'specs': z['handles'][a1]
        }, a5, a2)),
        C['handles'] += a5,
        B += a5)),
        'gola' == z['handles'][a1]['type'] && (a4 = (a3 = objectFindByKey(handles_catalog['items'], 'id', z['handles'][a1]['id']))['sizes'][0x0],
        a2 = parseFloat(('' + a4['price'])['replace'](',', '.')),
        -0x1 < (a2 = isNaN(a2) ? 0x0 : a2)) && (a5 = a2 * z['handles'][a1]['count'] * parseInt(z['handles'][a1]['width']) / 0x3e8,
        D['handles']['push'](get_desc_handle({
            'obj': a3,
            'size': a4,
            'specs': z['handles'][a1]
        }, a5, a2)),
        C['handles'] += a5,
        B += a5);
    })),
    Object['keys'](z['glass'])['length'] && glass_materials_catalog['items']['length'] && (D['glass'] = [],
    Object['keys'](z['glass'])['forEach'](function(a1) {
        prices['glass'] || (prices['glass'] = []);
        var a2 = objectFindByKey(prices['glass'], 'id', glass_lib['get_item'](a1)['category']);
        if (a2) {
            let a3;
            a3 = (0x0 != a2['get_from_parent'] && null != a2['get_from_parent'] ? objectFindByKey(prices['glass'], 'id', a2['parent']) : a2)['price'];
            var a2 = (a3 = parseFloat(('' + a3)['replace'](',', '.'))) * z['glass'][a1]['m2'];
            D['glass']['push'](get_desc_arr(z['glass'][a1], a2, a3)),
            C['glass'] += a3 * z['glass'][a1]['m2'],
            B += a3 * z['glass'][a1]['m2'];
        }
    })),
    0x1 == q)
        return C;
    let G = 0x0
      , H = A['get_furniture_types_count']()
      , I = {};
    if (null != default_locker_type) {
        if (0x2 == lockers_version) {
            for (let a1 = 0x0; a1 < this['lockers']['children']['length']; a1++) {
                var J = this['lockers']['children'][a1]['userData']['type_item']['item'];
                for (let a2 = J['length']; a2--; )
                    I[J[a2]['id']] ? I[J[a2]['id']] += J[a2]['count'] : I[J[a2]['id']] = J[a2]['count'];
            }
            for (let a3 = 0x0; a3 < this['sections']['children']['length']; a3++) {
                var K = this['sections']['children'][a3];
                if (K['lockers'])
                    for (let a4 = 0x0; a4 < K['lockers']['children']['length']; a4++) {
                        var L = K['lockers']['children'][a4]['userData']['type_item']['item'];
                        for (let a5 = L['length']; a5--; )
                            I[L[a5]['id']] ? I[L[a5]['id']] += L[a5]['count'] : I[L[a5]['id']] = L[a5]['count'];
                    }
            }
        } else {
            for (let a6 = 0x0; a6 < this['lockers']['children']['length']; a6++) {
                var N = this['lockers']['children'][a6]['params']
                  , O = N['type_params']
                  , P = lockers_types[N['type']]['types'][O['selected_type']]['items'][O['move_type']][O['move']];
                let a7 = null;
                for (let a8 = 0x0; a8 < P['length']; a8++)
                    O['lead_depth'] == P[a8]['lead_depth'] && (a7 = P[a8]);
                for (let a9 = 0x0; a9 < a7['item']['length']; a9++)
                    I[a7['item'][a9]['id']] ? I[a7['item'][a9]['id']] += a7['item'][a9]['count'] : I[a7['item'][a9]['id']] = a7['item'][a9]['count'];
            }
            for (let aa = 0x0; aa < this['sections']['children']['length']; aa++) {
                var Q = this['sections']['children'][aa];
                if (Q['lockers'])
                    for (let ab = 0x0; ab < Q['lockers']['children']['length']; ab++) {
                        var R = Q['lockers']['children'][ab]['params']
                          , S = R['type_params'];
                        if (0x0 != S['lead_depth']) {
                            var T = lockers_types[R['type']]['types'][S['selected_type']]['items'][S['move_type']][S['move']];
                            let ac = null;
                            for (let ad = 0x0; ad < T['length']; ad++)
                                S['lead_depth'] == T[ad]['lead_depth'] && (ac = T[ad]);
                            for (let ae = 0x0; ae < ac['item']['length']; ae++)
                                I[ac['item'][ae]['id']] ? I[ac['item'][ae]['id']] += ac['item'][ae]['count'] : I[ac['item'][ae]['id']] = ac['item'][ae]['count'];
                        }
                    }
            }
        }
    }
    D['furniture'] = [],
    Object['keys'](H)['forEach'](function(af) {
        null !== H[af]['id'] && null !== accsessories_data['default'][af] && '' != H[af]['id'] && void 0x0 !== H[af]['id'] && accsessories_data['items'][H[af]['id']] && 0x0 != H[af]['count'] && (D['furniture']['push']({
            'id': H[af]['id'],
            'code': accsessories_data['items'][H[af]['id']]['code'],
            'name': accsessories_data['items'][H[af]['id']]['code'] + '\x20' + accsessories_data['items'][H[af]['id']]['name'],
            'name_only': accsessories_data['items'][H[af]['id']]['name'],
            'count': H[af]['count'],
            'price': H[af]['count'] * parseFloat(accsessories_data['items'][H[af]['id']]['price']),
            'price_per_piece': parseFloat(accsessories_data['items'][H[af]['id']]['price'])
        }),
        G += H[af]['count'] * parseFloat(accsessories_data['items'][H[af]['id']]['price']));
    }),
    null != default_locker_type && (0x2 == lockers_version ? Object['keys'](I)['forEach'](function(af) {
        accsessories_data['items'][af] && (D['furniture']['push']({
            'name': accsessories_data['items'][af]['code'] + '\x20' + accsessories_data['items'][af]['name'],
            'count': I[af],
            'price': I[af] * parseFloat(accsessories_data['items'][af]['price']),
            'price_per_piece': parseFloat(accsessories_data['items'][af]['price'])
        }),
        G += I[af] * parseFloat(accsessories_data['items'][af]['price']));
    }) : Object['keys'](I)['forEach'](function(af) {
        accsessories_data['items'][af] && (D['furniture']['push']({
            'name': accsessories_data['items'][af]['code'] + '\x20' + accsessories_data['items'][af]['name'],
            'count': I[af],
            'price': I[af] * parseFloat(accsessories_data['items'][af]['price']),
            'price_per_piece': parseFloat(accsessories_data['items'][af]['price'])
        }),
        G += I[af] * parseFloat(accsessories_data['items'][af]['price']));
    })),
    D['accessories'] = [];
    for (let af = 0x0; af < this['params']['accessories_default']['length']; af++) {
        var U = this['params']['accessories_default'][af]['id']
          , W = this['params']['accessories_default'][af]['count'];
        accsessories_data['items'][U] && (D['accessories']['push']({
            'id': U,
            'name': accsessories_data['items'][U]['code'] + '\x20' + accsessories_data['items'][U]['name'],
            'category': accsessories_data['items'][U]['category'],
            'name_only': accsessories_data['items'][U]['name'],
            'code': accsessories_data['items'][U]['code'],
            'count': W,
            'price': W * parseFloat(accsessories_data['items'][U]['price']),
            'price_per_piece': parseFloat(accsessories_data['items'][U]['price'])
        }),
        G += W * parseFloat(accsessories_data['items'][U]['price']));
    }
    for (let ag = 0x0; ag < this['params']['accessories_variant']['length']; ag++) {
        var Z = this['params']['accessories_variant'][ag]['id']
          , a0 = this['params']['accessories_variant'][ag]['count'];
        accsessories_data['items'][Z] && (D['accessories']['push']({
            'id': Z,
            'name': accsessories_data['items'][Z]['code'] + '\x20' + accsessories_data['items'][Z]['name'],
            'category': accsessories_data['items'][Z]['category'],
            'name_only': accsessories_data['items'][Z]['name'],
            'code': accsessories_data['items'][Z]['code'],
            'count': a0,
            'price': a0 * parseFloat(accsessories_data['items'][Z]['price']),
            'price_per_piece': parseFloat(accsessories_data['items'][Z]['price'])
        }),
        G += a0 * parseFloat(accsessories_data['items'][Z]['price']));
    }
    return B = (B *= constructor_settings['price_modificator']) + G,
    this['price_description'] = D,
    this['userData']['price_obj'] = C,
    this['params']['price'] = B;
}
,
Cabinet_new['prototype']['change_object_active'] = function(f, g, h, i=null) {
    var g = this['find_child_by_index'](g, h, i);
    g['params']['active'] = f,
    g['obj']['params']['active'] = f,
    this['build']();
}
,
Cabinet_new['prototype']['change_facades_active'] = function(f) {
    for (let h = 0x0; h < this['params']['doors']['length']; h++)
        this['params']['doors'][h]['active'] = f;
    for (let i = 0x0; i < this['params']['lockers']['length']; i++)
        this['params']['lockers'][i]['active'] = f;
    for (let j = 0x0; j < this['params']['sections']['length']; j++) {
        var g = this['params']['sections'][j];
        g['doors'] || (g['doors'] = []),
        g['lockers'] || (g['lockers'] = []);
        for (let k = 0x0; k < g['doors']['length']; k++)
            g['doors'][k]['active'] = f;
        for (let l = 0x0; l < g['lockers']['length']; l++)
            g['lockers'][l]['active'] = f;
    }
    this['build']();
}
,
Cabinet_new['prototype']['change_facades_style'] = async function(f, g) {
    ce('change_facades_style');
    var h = {
        'type': 'change_facades_style',
        'from': copy_object(this['params']['doors']),
        'object': this
    };
    g = g || '',
    this['params']['facade']['type'] = f;
    for (let l = this['doors']['children']['length'] - 0x1; 0x0 <= l; l--)
        this['params']['doors'][l]['tag'] == g && (this['params']['doors'][l]['style'] = f);
    if ('' == g) {
        for (let m = 0x0; m < this['params']['sections']['length']; m++) {
            var j = this['params']['sections'][m];
            if (j['doors']) {
                for (let n = 0x0; n < j['doors']['length']; n++)
                    j['doors'][n]['style'] = f;
            }
        }
        for (let o = this['lockers']['children']['length'] - 0x1; 0x0 <= o; o--)
            this['params']['lockers'][o]['style'] = f;
        for (let p = 0x0; p < this['params']['sections']['length']; p++) {
            var k = this['params']['sections'][p];
            if (k['lockers']) {
                for (let q = 0x0; q < k['lockers']['length']; q++)
                    k['lockers'][q]['style'] = f;
            }
        }
    }
    h['to'] = copy_object(this['params']['doors']),
    add_undo_action(h),
    this['build_doors'](),
    'end_corner_facade' == this['params']['cabinet']['type'] && this['build_positions_end_corner_facade'](),
    '' == g && this['build_lockers'](),
    this['params']['sections'] && this['params']['sections']['length'] && this['build_sections'](),
    get_total_price_test(),
    global_update();
}
,
Cabinet_new['prototype']['change_facade_style'] = function(f, g=!0x1) {
    var j;
    if ((ce('change_facade_style'),
    'function' == typeof cabinet_before_facade_change) && !cabinet_before_facade_change(f, this))
        return !0x1;
    if (0x1 == this['params']['facade_locked'])
        return !0x1;
    let k = this;
    var m = this['params']['doors']['length']
      , q = this['params']['lockers']['length']
      , u = (this['params']['facade']['id'] = f,
    materials_lib['get_top_category_by_material'](this['params']['facade']['materials']['gen']));
    let v = 0x0
      , w = facades_lib['items'][f];
    for (let B = 0x0; B < w['materials']['length']; B++)
        u['id'] == w['materials'][B] && (v = 0x1);
    0x0 === v && (this['params']['facade']['materials']['gen'] = materials_lib['get_first_item'](w['materials'][0x0])['id']),
    Object['keys'](this['params']['facade']['materials'])['forEach'](function(C) {
        'gen' == C || w['additional_materials'][C] || delete k['params']['facade']['materials'][C];
    }),
    w['additional_materials'] && Object['keys'](w['additional_materials'])['forEach'](function(C) {
        k['params']['facade']['materials'][C] || (k['params']['facade']['materials'][C] = copy_object(w['additional_materials'][C]['selected']));
    });
    var x = copy_object(k['params']['facade']['materials']);
    delete x['gen'];
    for (let C = 0x0; C < this['params']['doors']['length']; C++)
        this['params']['doors'][C]['params_locked'] || this['params']['doors'][C]['facade_locked'] || (this['params']['doors'][C]['facade'] = f,
        this['params']['doors'][C]['material'] = this['params']['facade']['materials']['gen'],
        this['params']['doors'][C]['additional_materials'] = x);
    for (let D = 0x0; D < this['params']['lockers']['length']; D++)
        this['params']['lockers'][D]['params_locked'] || (this['params']['lockers'][D]['facade'] = f,
        this['params']['lockers'][D]['material'] = this['params']['facade']['materials']['gen'],
        this['params']['lockers'][D]['additional_materials'] = x);
    for (let E = 0x0; E < this['params']['sections']['length']; E++) {
        var y = this['params']['sections'][E]
          , z = (y['doors'] || (y['doors'] = []),
        y['lockers'] || (y['lockers'] = []),
        y['doors']['length'])
          , A = y['lockers']['length'];
        for (let F = 0x0; F < y['doors']['length']; F++)
            y['doors'][F]['params_locked'] || y['doors'][F]['facade_locked'] || (y['doors'][F]['facade'] = f,
            y['doors'][F]['material'] = this['params']['facade']['materials']['gen'],
            y['doors'][F]['additional_materials'] = x);
        for (let G = 0x0; G < y['lockers']['length']; G++)
            y['lockers'][G]['params_locked'] || (y['lockers'][G]['facade'] = f,
            y['lockers'][G]['material'] = this['params']['facade']['materials']['gen'],
            y['lockers'][G]['additional_materials'] = x);
        (z || A) && this['build_sections']();
    }
    for (let H = 0x0; H < this['cabinet']['children']['length']; H++)
        'Facade' == this['cabinet']['children'][H]['type'] && this['cabinet']['children'][H]['change_facade']({
            'id': f,
            'material': this['params']['facade']['materials']['gen']
        });
    m && this['build_doors'](g),
    q && this['build_lockers'](g),
    this['build_decorations'](g),
    custom_settings['fit_side_into_module'] && this['userData']['flags'] && (0x0 != this['userData']['flags']['sm_flag_l'] || 0x0 != this['userData']['flags']['sm_flag_r']) && 'common' == this['params']['cabinet']['type'] && this['build'](),
    'function' == typeof cabinet_facade_change_callback && cabinet_facade_change_callback(f, this);
}
,
Cabinet_new['prototype']['change_facade_style_new'] = function(f, g, j=!0x1) {
    var k;
    if ((ce('change_facade_style_new'),
    'function' == typeof cabinet_before_facades_change) && !cabinet_before_facades_change(f, this))
        return !0x1;
    if (0x1 == this['params']['facade_locked'])
        return !0x1;
    let m = this;
    var q = this['params']['doors']['length']
      , u = this['params']['lockers']['length'];
    let v;
    if (this['params']['group'] == g) {
        this['params']['facade']['id'] = f;
        var w = materials_lib['get_top_category_by_material'](this['params']['facade']['materials']['gen']);
        let B = 0x0
          , C = facades_lib['items'][f];
        for (let D = 0x0; D < C['materials']['length']; D++)
            w['id'] == C['materials'][D] && (B = 0x1);
        0x0 === B && (this['params']['facade']['materials']['gen'] = materials_lib['get_first_item'](C['materials'][0x0])['id']),
        Object['keys'](this['params']['facade']['materials'])['forEach'](function(E) {
            'gen' == E || C['additional_materials'][E] || delete m['params']['facade']['materials'][E];
        }),
        C['additional_materials'] || (C['additional_materials'] = {}),
        Object['keys'](C['additional_materials'])['forEach'](function(E) {
            m['params']['facade']['materials'][E] || (m['params']['facade']['materials'][E] = copy_object(C['additional_materials'][E]['selected']));
        }),
        delete (v = copy_object(m['params']['facade']['materials']))['gen'];
    }
    let x = 0x0;
    for (let E = 0x0; E < this['params']['doors']['length']; E++)
        this['params']['doors'][E]['params_locked'] || this['params']['doors'][E]['facade_locked'] || this['params']['doors'][E]['group'] == g && (x = 0x1,
        this['params']['doors'][E]['facade'] = f,
        this['params']['doors'][E]['material'] = this['params']['facade']['materials']['gen'],
        this['params']['doors'][E]['additional_materials'] = v);
    for (let F = 0x0; F < this['params']['lockers']['length']; F++)
        this['params']['lockers'][F]['params_locked'] || this['params']['lockers'][F]['group'] == g && (x = 0x1,
        this['params']['lockers'][F]['facade'] = f,
        this['params']['lockers'][F]['material'] = this['params']['facade']['materials']['gen'],
        this['params']['lockers'][F]['additional_materials'] = v);
    for (let G = 0x0; G < this['params']['sections']['length']; G++) {
        var y = this['params']['sections'][G]
          , z = (y['doors'] || (y['doors'] = []),
        y['lockers'] || (y['lockers'] = []),
        y['doors']['length'])
          , A = y['lockers']['length'];
        for (let H = 0x0; H < y['doors']['length']; H++)
            y['doors'][H]['params_locked'] || this['params']['doors'][H]['facade_locked'] || y['doors'][H]['group'] == g && (x = 0x1,
            y['doors'][H]['facade'] = f,
            y['doors'][H]['material'] = this['params']['facade']['materials']['gen'],
            y['doors'][H]['additional_materials'] = v);
        for (let I = 0x0; I < y['lockers']['length']; I++)
            y['lockers'][I]['params_locked'] || y['lockers'][I]['group'] == g && (x = 0x1,
            y['lockers'][I]['facade'] = f,
            y['lockers'][I]['material'] = this['params']['facade']['materials']['gen'],
            y['lockers'][I]['additional_materials'] = v);
        (z || A) && this['build_sections']();
    }
    for (let J = 0x0; J < this['cabinet']['children']['length']; J++)
        'Facade' == this['cabinet']['children'][J]['type'] && this['cabinet']['children'][J]['change_facade']({
            'id': f,
            'material': this['params']['facade']['materials']['gen']
        });
    0x1 == x && (q && this['build_doors'](j),
    u && this['build_lockers'](j),
    this['build_decorations'](j),
    'end_corner_facade' == this['params']['cabinet']['type']) && this['build_positions_end_corner_facade'](),
    custom_settings['fit_side_into_module'] && this['userData']['flags'] && (0x0 != this['userData']['flags']['sm_flag_l'] || 0x0 != this['userData']['flags']['sm_flag_r']) && 'common' == this['params']['cabinet']['type'] && this['build'](),
    'function' == typeof cabinet_facade_change_callback && cabinet_facade_change_callback(f, this);
}
,
Cabinet_new['prototype']['change_facade_style_single'] = function(f, g, h, j=null) {
    var k = {};
    let m = this['find_child_by_index'](g, h, j)
      , n = (m['params']['facade'] = f,
    m['obj']['params']['facade'] = f,
    facades_lib['items'][f]);
    Array['isArray'](m['obj']['params']['material']) && (m['obj']['params']['material'] = m['obj']['params']['material'][0x0]);
    var p = materials_lib['get_top_category_by_material'](m['obj']['params']['material']);
    let q = 0x0;
    for (let u = 0x0; u < n['materials']['length']; u++)
        p['id'] == n['materials'][u] && (q = 0x1);
    return 0x0 === q && (m['params']['material'] = materials_lib['get_first_item'](n['materials'][0x0])['id'],
    m['obj']['params']['material'] = materials_lib['get_first_item'](n['materials'][0x0])['id']),
    Object['keys'](m['params']['additional_materials'])['forEach'](function(v) {
        m['params']['additional_materials'][v] && (delete m['params']['additional_materials'][v],
        delete m['obj']['params']['additional_materials'][v]);
    }),
    Object['keys'](n['additional_materials'])['forEach'](function(v) {
        m['params']['additional_materials'][v] || (m['params']['additional_materials'][v] = parseInt(copy_object(n['additional_materials'][v]['selected'])),
        m['obj']['params']['additional_materials'][v] = parseInt(copy_object(n['additional_materials'][v]['selected'])));
    }),
    k['material'] = m['params']['material'],
    k['additional_materials'] = m['params']['additional_materials'],
    m['obj']['build'](),
    this['check_facades_one_id'](),
    'd' == g && (m['params']['info']['material_code'] = materials_lib['get_item'](m['obj']['params']['material'][0x0])['code']),
    'l' == g && (m['params']['info']['material_code'] = materials_lib['get_item'](m['obj']['params']['material'])['code']),
    m['params']['info']['facade_code'] = m['obj']['params']['facade_code'] || '',
    'function' == typeof cabinet_facade_change_callback && cabinet_facade_change_callback(f, this),
    k;
}
,
Cabinet_new['prototype']['check_facades_one_id'] = function() {
    var f = this['params']['facade_id']
      , g = {};
    for (let l = 0x0; l < this['params']['doors']['length']; l++)
        g[this['params']['doors'][l]['facade']] = 0x1;
    for (let m = 0x0; m < this['sections']['children']['length']; m++) {
        var h = this['sections']['children'][m]
          , j = this['params']['sections'][m];
        if (h['doors']) {
            for (let n = 0x0; n < h['doors']['children']['length']; n++)
                g[j['doors'][n]['facade']] = 0x1;
        }
        if (h['lockers']) {
            for (let o = 0x0; o < h['lockers']['children']['length']; o++)
                g[j['lockers'][o]['facade']] = 0x1;
        }
    }
    var k = Object['keys'](g);
    0x1 == k['length'] && (this['params']['facade']['id'] = parseInt(k[0x0]),
    this['get_price']());
}
,
Cabinet_new['prototype']['change_facade_type_single'] = function(f, g, h, j=null) {
    var k = {}
      , h = this['find_child_by_index'](g, h, j);
    return 'd' == g && (h['params']['style'] = f,
    h['obj']['params']['style'] = [f, f]),
    'l' == g && (h['params']['style'] = f,
    h['obj']['params']['style'] = f),
    h['obj']['build'](),
    'd' == g && (h['params']['info']['material_code'] = materials_lib['get_item'](h['obj']['params']['material'][0x0])['code']),
    'l' == g && (h['params']['info']['material_code'] = materials_lib['get_item'](h['obj']['params']['material'])['code']),
    h['params']['info']['facade_code'] = h['obj']['params']['facade_code'] || '',
    k;
}
,
Cabinet_new['prototype']['change_facade_material'] = function(f) {
    ce('change_facade_material');
    let g = f['id'];
    if (null != this['params']['fixed_facade_material'] && (g = this['params']['fixed_facade_material'],
    f['id'] = this['params']['fixed_facade_material']),
    f['material_key']) {
        for (let k = 0x0; k < this['doors']['children']['length']; k++)
            this['params']['doors'][k]['additional_materials'] || (this['params']['doors'][k]['additional_materials'] = {}),
            'all' !== f['group'] && this['doors']['children'][k]['params']['group'] !== f['group'] || (this['params']['doors'][k]['additional_materials'][f['material_key']] = g,
            this['doors']['children'][k]['change_material'](f));
        for (let l = 0x0; l < this['lockers']['children']['length']; l++)
            this['params']['lockers'][l]['additional_materials'] || (this['params']['lockers'][l]['additional_materials'] = {}),
            'all' !== f['group'] && this['lockers']['children'][l]['params']['group'] !== f['group'] || (this['params']['lockers'][l]['additional_materials'][f['material_key']] = g,
            this['lockers']['children'][l]['change_material'](f));
        for (let m = 0x0; m < this['decorations']['children']['length']; m++)
            this['params']['decorations'][m]['additional_materials'] || (this['params']['decorations'][m]['additional_materials'] = {}),
            'all' !== f['group'] && this['decorations']['children'][m]['params']['group'] !== f['group'] || (this['params']['decorations'][m]['additional_materials'][f['material_key']] = g,
            this['decorations']['children'][m]['change_material'](f));
        for (let n = 0x0; n < this['cokol_top']['children']['length']; n++)
            'all' !== f['group'] && 'top' !== f['group'] || (this['params']['cokol_top']['material'] = g,
            this['cokol_top']['children'][n]['change_material'](g));
    } else {
        for (let o = 0x0; o < this['doors']['children']['length']; o++)
            !0x0 === this['params']['doors'][o]['material_fixed'] || 'all' !== f['group'] && this['doors']['children'][o]['params']['group'] !== f['group'] || (this['params']['doors'][o]['material'] = g,
            this['params']['doors'][o]['material_rotated'] = f['rotated'],
            this['doors']['children'][o]['change_material'](f),
            this['params']['doors'][o]['info'] = {
                'width': this['doors']['children'][o]['params']['width'] - 0x2 * project_settings['door_offset'],
                'height': this['doors']['children'][o]['params']['height'] - 0x2 * project_settings['door_offset'],
                'material_code': materials_lib['get_item'](this['doors']['children'][o]['params']['material'][0x0])['code'],
                'facade_code': this['doors']['children'][o]['params']['facade_code'] || ''
            });
        for (let p = 0x0; p < this['lockers']['children']['length']; p++)
            'all' !== f['group'] && this['lockers']['children'][p]['params']['group'] !== f['group'] || (this['params']['lockers'][p]['material'] = g,
            this['params']['lockers'][p]['material_rotated'] = f['rotated'],
            this['lockers']['children'][p]['change_material'](f),
            this['params']['lockers'][p]['info'] = {
                'width': this['lockers']['children'][p]['params']['width'] - 0x2 * project_settings['door_offset'],
                'height': this['lockers']['children'][p]['params']['height'] - 0x2 * project_settings['door_offset'],
                'material_code': materials_lib['get_item'](this['lockers']['children'][p]['params']['material'])['code'],
                'facade_code': this['lockers']['children'][p]['params']['facade_code'] || ''
            });
        for (let q = 0x0; q < this['decorations']['children']['length']; q++)
            'facade' !== this['decorations']['children'][q]['params']['material_type'] || 'all' !== f['group'] && this['decorations']['children'][q]['params']['group'] !== f['group'] || (this['params']['decorations'][q]['material'] = g,
            this['params']['decorations'][q]['material_rotated'] = f['rotated'],
            this['decorations']['children'][q]['change_material'](f));
        for (let r = 0x0; r < this['cokol_top']['children']['length']; r++)
            'all' !== f['group'] && 'top' !== f['group'] || (this['params']['cokol_top']['material'] = g,
            this['cokol_top']['children'][r]['change_material'](g));
        for (let u = 0x0; u < this['sections']['children']['length']; u++) {
            var h = this['sections']['children'][u]
              , j = this['params']['sections'][u];
            if (h['doors']) {
                for (let v = 0x0; v < h['doors']['children']['length']; v++)
                    !0x0 === j['doors'][v]['material_fixed'] || 'all' !== f['group'] && h['doors']['children'][v]['params']['group'] !== f['group'] || (j['doors'][v]['material'] = g,
                    j['doors'][v]['material_rotated'] = f['rotated'],
                    h['doors']['children'][v]['change_material'](f),
                    j['doors'][v]['info'] = {
                        'width': h['doors']['children'][v]['params']['width'] - 0x2 * project_settings['door_offset'],
                        'height': h['doors']['children'][v]['params']['height'] - 0x2 * project_settings['door_offset'],
                        'material_code': materials_lib['get_item'](h['doors']['children'][v]['params']['material'][0x0])['code'],
                        'facade_code': h['doors']['children'][v]['params']['facade_code'] || ''
                    });
            }
            if (h['lockers']) {
                for (let w = 0x0; w < h['lockers']['children']['length']; w++)
                    'all' !== f['group'] && h['lockers']['children'][w]['params']['group'] !== f['group'] || (j['lockers'][w]['material'] = g,
                    j['lockers'][w]['material_rotated'] = f['rotated'],
                    h['lockers']['children'][w]['change_material'](f),
                    j['lockers'][w]['info'] = {
                        'width': h['lockers']['children'][w]['params']['width'] - 0x2 * project_settings['door_offset'],
                        'height': h['lockers']['children'][w]['params']['height'] - 0x2 * project_settings['door_offset'],
                        'material_code': materials_lib['get_item'](h['lockers']['children'][w]['params']['material'])['code'],
                        'facade_code': h['lockers']['children'][w]['params']['facade_code'] || ''
                    });
            }
        }
        'function' == typeof cabinet_facade_material_change_callback && cabinet_facade_material_change_callback(g, this);
    }
    get_total_price_test(),
    global_update();
}
,
Cabinet_new['prototype']['change_facade_material_new'] = function(g, j, k, q) {
    if (ce('change_facade_material_new'),
    'all' == q || q == this['params']['cabinet_group']) {
        this['params']['facade']['materials'][j] = k;
        var u = this;
        for (let F = 0x0; F < u['params']['doors']['length']; F++) {
            var v = u['params']['doors'][F]
              , w = u['doors']['children'][F];
            if (!v['params_locked']) {
                let G = q
                  , H = ('all' == q && (G = v['group']),
                v['facade'] == g);
                (H = custom_settings['no_facade_id_check_change_facade_material_new'] ? 0x1 : H) && v['group'] == G && ('gen' == j ? v['material'] = k : v['additional_materials'][j] = k,
                w['change_material']({
                    'group': q,
                    'material_key': j,
                    'id': k
                }),
                v['info'] = {
                    'width': w['params']['width'] - 0x2 * project_settings['door_offset'],
                    'height': w['params']['height'] - 0x2 * project_settings['door_offset'],
                    'material_code': materials_lib['get_item'](w['params']['material'][0x0])['code'],
                    'facade_code': w['params']['facade_code'] || ''
                });
            }
        }
        for (let I = 0x0; I < u['params']['lockers']['length']; I++) {
            var x = u['params']['lockers'][I]
              , y = u['lockers']['children'][I];
            if (!x['params_locked']) {
                let J = q;
                'all' == q && (J = x['group']),
                x['facade'] == g && x['group'] == J && ('gen' == j ? x['material'] = k : x['additional_materials'][j] = k,
                y['change_material']({
                    'group': q,
                    'material_key': j,
                    'id': k
                }),
                x['info'] = {
                    'width': y['params']['width'] - 0x2 * project_settings['door_offset'],
                    'height': y['params']['height'] - 0x2 * project_settings['door_offset'],
                    'material_code': materials_lib['get_item'](y['params']['material'])['code'],
                    'facade_code': y['params']['facade_code'] || ''
                });
            }
        }
        for (let K = 0x0; K < this['sections']['children']['length']; K++) {
            var z = this['sections']['children'][K]
              , A = this['params']['sections'][K];
            if (z['doors'])
                for (let L = 0x0; L < A['doors']['length']; L++) {
                    var B = A['doors'][L]
                      , C = z['doors']['children'][L];
                    if (!B['params_locked']) {
                        let N = q;
                        'all' == q && (N = B['group']),
                        B['facade'] == g && B['group'] == N && ('gen' == j ? B['material'] = k : B['additional_materials'][j] = k,
                        C['change_material']({
                            'group': q,
                            'material_key': j,
                            'id': k
                        }),
                        B['info'] = {
                            'width': C['params']['width'] - 0x2 * project_settings['door_offset'],
                            'height': C['params']['height'] - 0x2 * project_settings['door_offset'],
                            'material_code': materials_lib['get_item'](C['params']['material'][0x0])['code'],
                            'facade_code': C['params']['facade_code'] || ''
                        });
                    }
                }
            if (z['lockers'])
                for (let O = 0x0; O < A['lockers']['length']; O++) {
                    var D = A['lockers'][O]
                      , E = z['lockers']['children'][O];
                    if (!D['params_locked']) {
                        let P = q;
                        'all' == q && (P = D['group']),
                        D['facade'] == g && D['group'] == P && ('gen' == j ? D['material'] = k : D['additional_materials'][j] = k,
                        E['change_material']({
                            'group': q,
                            'material_key': j,
                            'id': k
                        }),
                        D['info'] = {
                            'width': E['params']['width'] - 0x2 * project_settings['door_offset'],
                            'height': E['params']['height'] - 0x2 * project_settings['door_offset'],
                            'material_code': materials_lib['get_item'](E['params']['material'])['code'],
                            'facade_code': E['params']['facade_code'] || ''
                        });
                    }
                }
        }
        for (let Q = 0x0; Q < u['decorations']['children']['length']; Q++)
            'facade' !== this['decorations']['children'][Q]['params']['material_type'] || 'all' !== q && this['decorations']['children'][Q]['params']['group'] !== q || (this['params']['decorations'][Q]['material'] = k,
            this['decorations']['children'][Q]['change_material']({
                'id': k
            }));
        for (let R = 0x0; R < this['cabinet']['children']['length']; R++)
            'Facade' != this['cabinet']['children'][R]['type'] || 'all' !== q && this['params']['cabinet_group'] !== q || this['cabinet']['children'][R]['change_material']({
                'group': q,
                'material_key': j,
                'id': k
            });
        for (let S = 0x0; S < u['cokol_top']['children']['length']; S++)
            'all' !== q && 'top' !== params['group'] || (this['params']['cokol_top']['material'] = k,
            this['cokol_top']['children'][S]['change_material'](k));
        'function' == typeof this['on_after_facade_change'] && this['on_after_facade_change'](g, j, k, q),
        get_total_price_test(),
        global_update();
    }
}
,
Cabinet_new['prototype']['change_facade_material_single_new'] = function(f, g, h, j=null) {
    f['key'] || (f['key'] = 'gen'),
    f['id'] || (f['id'] = 0x0);
    var k = f['key']
      , f = f['id']
      , l = {}
      , h = this['find_child_by_index'](g, h, j);
    'gen' == k ? h['params']['material'] = f : h['params']['additional_materials'][k] = f,
    h['obj']['change_material']({
        'material_key': k,
        'id': f
    }),
    'd' == g && (h['params']['info']['material_code'] = materials_lib['get_item'](h['obj']['params']['material'][0x0])['code']),
    'l' == g && (h['params']['info']['material_code'] = materials_lib['get_item'](h['obj']['params']['material'])['code']),
    h['params']['info']['facade_code'] = h['obj']['params']['facade_code'] || '',
    global_update();
}
,
Cabinet_new['prototype']['change_facade_group_single'] = function(f, g, h, j=null) {
    var k = this['find_child_by_index'](g, h, j)
      , l = project_settings['defaults']['facades'][f];
    if (l == k['params']['facade']) {
        if (k['params']['material'] == project_settings['selected_materials']['facades'][project_settings['defaults']['facades'][f]]['gen'][f])
            return;
        var m = 0x0;
    }
    k['params']['material'] = project_settings['selected_materials']['facades'][project_settings['defaults']['facades'][f]]['gen'][f],
    k['obj']['params']['material'] = project_settings['selected_materials']['facades'][project_settings['defaults']['facades'][f]]['gen'][f],
    k['params']['group'] = f,
    k['obj']['params']['group'] = f,
    this['change_facade_style_single'](l, g, h, j);
}
,
Cabinet_new['prototype']['change_default_facade'] = function(f) {}
,
Cabinet_new['prototype']['change_single_facade_material'] = function(f, g, h) {
    if ('gen' == (h = h || 'gen')) {
        var j = get_top_material_category(get_material_by_id(f)['category'])['id'], k;
        if (!facades_lib['items'][g['params']['facade']]['materials']['includes'](j + '') && !facades_lib['items'][g['params']['facade']]['materials']['includes'](j))
            return void new Modal_window({
                'heading': lang['unavailable_material'],
                'body': '<p>' + lang['unavailable_material_msg'] + '</p>'
            })['show']();
    }
    if (g instanceof Door_new || g instanceof Locker_new) {
        var j = g['par_index'];
        if (!0x0 === g['params_link'][j]['material_fixed'])
            return;
        'gen' == h ? g['params_link'][j]['material'] = f : g['params_link'][j]['additional_materials'][h] = f;
        var l = {
            'group': g['params']['group'],
            'material_key': h,
            'id': f
        };
        'gen' == h && delete l['material_key'],
        g['change_material'](l),
        'gen' == h && (g instanceof Door_new && (g['params_link'][j]['info'] = {
            'width': g['params']['width'] - 0x2 * project_settings['door_offset'],
            'height': g['params']['height'] - 0x2 * project_settings['door_offset'],
            'material_code': materials_lib['get_item'](g['params']['material'][0x0])['code'],
            'facade_code': g['params']['facade_code'] || ''
        }),
        g instanceof Locker_new) && (g['params_link'][j]['info'] = {
            'width': g['params']['width'] - 0x2 * project_settings['door_offset'],
            'height': g['params']['height'] - 0x2 * project_settings['door_offset'],
            'material_code': materials_lib['get_item'](g['params']['material'])['code'],
            'facade_code': g['params']['facade_code'] || ''
        });
    }
    return void ('function' == typeof cabinet_facade_material_change_callback && cabinet_facade_material_change_callback(f, this));
    if (g instanceof Decoration) {
        for (let m = 0x0; m < this['decorations']['children']['length']; m++)
            if (this['decorations']['children'][m] === g)
                return this['params']['decorations'][m]['material'] = f,
                this['params']['decorations'][m]['material_rotated'] = project_settings['selected_materials'][this['params']['facades_group']]['facades_rotated'],
                this['decorations']['children'][m]['change_material']({
                    'id': f,
                    'rotated': this['params']['decorations'][m]['material_rotated']
                }),
                update_materials_panel(),
                void get_total_price_test();
    }
}
,
Cabinet_new['prototype']['change_glass_material'] = function(f) {
    for (let i = 0x0; i < this['doors']['children']['length']; i++)
        this['doors']['children'][i]['change_glass_material'](f),
        this['params']['doors'][i]['glass_material'] = f;
    for (let j = 0x0; j < this['lockers']['children']['length']; j++)
        this['lockers']['children'][j]['change_glass_material'](f),
        this['params']['lockers'][j]['glass_material'] = f;
    for (let k = 0x0; k < this['sections']['children']['length']; k++) {
        var g = this['sections']['children'][k]
          , h = this['params']['sections'][k];
        if (g['doors']) {
            for (let l = 0x0; l < g['doors']['children']['length']; l++)
                h['doors'][l]['glass_material'] = f,
                g['doors']['children'][l]['change_glass_material'](f);
        }
        if (g['lockers']) {
            for (let m = 0x0; m < g['lockers']['children']['length']; m++)
                h['lockers'][m]['glass_material'] = f,
                g['lockers']['children'][m]['change_glass_material'](f);
        }
    }
    this['params']['facade']['glass'] = f,
    get_total_price_test(),
    global_update();
}
,
Cabinet_new['prototype']['change_cornice_material'] = function(f) {
    if (!f['material_key'] && 'bottom' !== f['group']) {
        var g = f['id'];
        for (let h = 0x0; h < this['cornice']['children']['length']; h++)
            this['cornice']['children'][h]['change_material'](g),
            this['params']['cornice']['material'] = g;
        global_update();
    }
}
,
Cabinet_new['prototype']['change_corpus_material'] = function(f) {
    if (!this['params']['cabinet']['materials'] || !this['params']['cabinet']['materials']['length'] || this['params']['cabinet']['materials']['includes'](materials_lib['get_top_category_by_material'](f)['id'])) {
        this['params']['cabinet']['material'] = parseInt(f);
        for (let i = 0x0; i < this['cabinet']['children']['length']; i++)
            -0x1 < this['cabinet']['children'][i]['name']['indexOf']('back_wall') && 'object' == typeof project_settings['materials']['top']['back_wall_material'] ? 'corpus' != project_settings['materials']['top']['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']]['mode'] && 'custom_as_corpus' != project_settings['materials']['top']['back_wall_material'][this['params']['cabinet']['back_wall_material']['key']]['mode'] || this['change_back_wall_material']({
                'key': this['params']['cabinet']['back_wall_material']['key'],
                'id': f
            }) : this['cabinet']['children'][i]['change_material'](f);
        for (let j = 0x0; j < this['shelves']['children']['length']; j++)
            this['shelves']['children'][j]['change_material'](f);
        for (let k = 0x0; k < this['walls']['children']['length']; k++)
            this['walls']['children'][k]['change_material'](f);
        for (let l = 0x0; l < this['lockers']['children']['length']; l++)
            this['params']['lockers'][l]['corpus_material'] = f,
            this['lockers']['children'][l]['change_corpus_material'](f);
        for (let m = 0x0; m < this['doors']['children']['length']; m++)
            this['doors']['children'][m]['params']['group'] == this['params']['cabinet_group'] && this['doors']['children'][m]['change_material_new']({
                'id': f,
                'type': 'corpmat'
            });
        for (let n = 0x0; n < this['decorations']['children']['length']; n++)
            this['params']['decorations'][n]['material'] = f,
            this['decorations']['children'][n]['change_material']({
                'id': f,
                'type': 'corpmat'
            });
        for (let o = 0x0; o < this['sections']['children']['length']; o++) {
            var g = this['sections']['children'][o]
              , h = this['params']['sections'][o];
            if (g['shelves']) {
                for (let p = 0x0; p < g['shelves']['children']['length']; p++)
                    g['shelves']['children'][p]['change_material'](f);
            }
            if (g['walls']) {
                for (let q = 0x0; q < g['walls']['children']['length']; q++)
                    g['walls']['children'][q]['change_material'](f);
            }
            if (g['lockers']) {
                for (let r = 0x0; r < g['lockers']['children']['length']; r++)
                    h['lockers'][r]['corpus_material'] = f,
                    g['lockers']['children'][r]['change_corpus_material'](f);
            }
        }
        'function' == typeof cabinet_material_change_callback && cabinet_material_change_callback(f, this),
        get_total_price_test(),
        global_update();
    }
}
,
Cabinet_new['prototype']['change_back_wall_material'] = function(f) {
    if (constructor_settings['core_v2'])
        this['change_material_group']({
            'group_key': 'g1',
            'mat_key': 'bw_' + f['key'],
            'mat_id': f['id'],
            'mat_variant_id': null,
            'mat_thickness': get_wall_thickness(f['id'], 0x0, 'bw_' + f['key']),
            'obj_groups': [this['params']['cabinet_group']]
        });
    else {
        this['params']['cabinet']['back_wall_material'] = f;
        for (let g = 0x0; g < this['cabinet']['children']['length']; g++)
            -0x1 < this['cabinet']['children'][g]['name']['indexOf']('back_wall') && this['cabinet']['children'][g]['change_material'](f['id']);
    }
    get_total_price_test(),
    global_update();
}
,
Cabinet_new['prototype']['change_tabletop_material'] = function(f, g=0x0) {
    var h, j, j;
    ce('ctm'),
    this['params']['tabletop']['material'] = f,
    this['params']['tabletop']['tabletop_id'] = f,
    this['params']['tabletop']['tabletop_variant'] = g,
    constructor_settings['tabletop_v2'] && (j = pp['libs']['tabletop']['find_item'](f)['params']['variants'][g],
    j = parseInt(j['thickness']),
    this['params']['tabletop']['height'] = j),
    this['build_tabletop'](),
    this['build_sizes']();
    for (var k = this['tabletop']['children']['length'] - 0x1; 0x0 <= k; k--)
        'Facade' == this['tabletop']['children'][k]['type'] ? this['tabletop']['children'][k]['change_material']({
            'id': f,
            'variant': g
        }) : this['tabletop']['children'][k]['change_material'](f, g);
    sc['build_tabletop'](),
    update_materials_panel(),
    autosave(),
    global_update();
}
,
Cabinet_new['prototype']['change_tabletop_material_ext'] = function(f) {
    this['params']['tabletop']['material'] = f,
    global_update();
}
,
Cabinet_new['prototype']['change_cokol_material'] = function(f) {
    this['params']['cokol']['material'] = f;
    for (var g = 0x0; g < this['cokol']['children']['length']; g++)
        'Mesh' !== this['cokol']['children'][g]['type'] && 'CabinetCokol' !== this['cokol']['children'][g]['temp_type'] || this['cokol']['children'][g]['change_material'](f);
    global_update();
}
,
Cabinet_new['prototype']['change_handles_orientation'] = function(f) {
    constructor_settings['core_v2'] && this['change_handles_orientation_v2'](f);
    var g = this, h, j;
    for (let u = g['doors']['children']['length'] - 0x1; 0x0 <= u; u--) {
        q(g['params']['doors'][u], g['doors']['children'][u]);
    }
    for (let v = 0x0; v < this['sections']['children']['length']; v++) {
        var k = this['sections']['children'][v], m = this['params']['sections'][v], n, p;
        if (k['doors'])
            for (let w = k['doors']['children']['length'] - 0x1; 0x0 <= w; w--) {
                q(m['doors'][w], k['doors']['children'][w]);
            }
    }
    function q(x, y) {
        var z = handles_lib['items'][project_settings['handle'][g['params']['cabinet_group']]['selected_model']]
          , A = z['sizes'][project_settings['handle'][g['params']['cabinet_group']]['preferable_size']]['width'];
        let B, C;
        if ('horizontal' === f) {
            if (A >= y['params']['width']) {
                for (B = [],
                C = 0x0; C < z['sizes']['length']; C++)
                    z['sizes'][C]['index'] = C,
                    z['sizes'][C]['width'] <= y['params']['width'] && B['push'](z['sizes'][C]);
                B['sort'](function(D, E) {
                    return E['width'] - D['width'];
                }),
                B['length'] ? (x['handle_size_index'] = B[0x0]['index'],
                y['params']['handle_size_index'] = B[0x0]['index']) : (x['handle_orientation'] = 'vertical',
                y['params']['handle_orientation'] = 'vertical',
                f = 'vertical');
            } else
                x['handle_size_index'] = project_settings['handle'][g['params']['cabinet_group']]['preferable_size'],
                y['params']['handle_size_index'] = project_settings['handle'][g['params']['cabinet_group']]['preferable_size'];
        }
        if ('vertical' === f) {
            if (A >= y['params']['height']) {
                for (B = [],
                C = 0x0; C < z['sizes']['length']; C++)
                    z['sizes'][C]['index'] = C,
                    z['sizes'][C]['width'] <= y['params']['height'] && B['push'](z['sizes'][C]);
                B['sort'](function(D, E) {
                    return E['width'] - D['width'];
                }),
                B['length'] && (x['handle_size_index'] = B[0x0]['index'],
                y['params']['handle_size_index'] = B[0x0]['index']);
            } else
                x['handle_size_index'] = project_settings['handle'][g['params']['cabinet_group']]['preferable_size'],
                y['params']['handle_size_index'] = project_settings['handle'][g['params']['cabinet_group']]['preferable_size'];
        }
        x['handle_orientation'] = f,
        y['params']['handle_orientation'] = f,
        y['build_handle']();
    }
}
,
Cabinet_new['prototype']['change_locker_handle_position'] = function(f) {
    for (var g = this, h = g['lockers']['children']['length'] - 0x1; 0x0 <= h; h--)
        g['params']['lockers'][h]['handle_position'] = f,
        g['lockers']['children'][h]['params']['handle_position'] = f,
        g['lockers']['children'][h]['build_handle']();
    for (let l = 0x0; l < this['sections']['children']['length']; l++) {
        var j = this['sections']['children'][l]
          , k = this['params']['sections'][l];
        if (j['lockers']) {
            for (let m = 0x0; m < j['lockers']['children']['length']; m++)
                k['lockers'][m]['handle_position'] = f,
                j['lockers']['children'][m]['params']['handle_position'] = f,
                j['lockers']['children'][m]['build_handle']();
        }
    }
}
,
Cabinet_new['prototype']['change_handles_model'] = function(j, k, q, v={}) {
    constructor_settings['core_v2'] && this['change_handles_v2'](j, k, q, v = {});
    var w = this;
    if ('false_facade' !== w['params']['cabinet']['type'] && 'false_facade_facade' !== w['params']['cabinet']['type'] && 'false_facade_facade_b' !== w['params']['cabinet']['type'] && 'false_facade_facade_no_cokol' !== w['params']['cabinet']['type']) {
        0x0 == j && (j = handles_catalog['items'][0x0]['id']);
        let I = handles_lib['get_item'](j);
        var j = copy_object(this['params']['gola']), x = (this['params']['gola'] = to_int('gola' == I['type']),
        I['sizes'][k]['width']), y, z, A, B;
        I['type'] || (I['type'] = 'common');
        for (let K = w['doors']['children']['length'] - 0x1; 0x0 <= K; K--) {
            'locker' == v['type'] || null != v['index'] && v['index'] !== K || (null != v['no_handle'] ? (w['params']['doors'][K]['no_handle_forced'] = v['no_handle'],
            w['doors']['children'][K]['params']['no_handle_forced'] = v['no_handle'],
            w['doors']['children'][K]['build_handle'](),
            sc['get_price']()) : (y = w['params']['doors'][K],
            z = w['doors']['children'][K],
            y['handle_model'] = I,
            z['params']['handle_model'] = I,
            J(y, z),
            q || z['build_handle']()));
        }
        for (let L = w['lockers']['children']['length'] - 0x1; 0x0 <= L; L--) {
            'door' == v['type'] || null != v['index'] && v['index'] !== L || (null != v['no_handle'] ? (w['params']['lockers'][L]['no_handle_forced'] = v['no_handle'],
            w['lockers']['children'][L]['params']['no_handle_forced'] = v['no_handle'],
            w['lockers']['children'][L]['build_handle'](),
            sc['get_price']()) : (A = w['params']['lockers'][L],
            B = w['lockers']['children'][L],
            A['handle_model'] = I,
            B['params']['handle_model'] = I,
            B['params']['handle_orientation'] = A['handle_orientation'] = 'horizontal',
            J(A, B),
            q || B['build_handle']()));
        }
        for (let N = 0x0; N < this['sections']['children']['length']; N++) {
            var C = this['sections']['children'][N]
              , D = this['params']['sections'][N];
            if (C['doors'])
                for (let O = C['doors']['children']['length'] - 0x1; 0x0 <= O; O--) {
                    var E = D['doors'][O]
                      , F = C['doors']['children'][O];
                    E['handle_model'] = I,
                    F['params']['handle_model'] = I,
                    J(E, F),
                    q || F['build_handle']();
                }
            if (C['lockers'])
                for (let P = C['lockers']['children']['length'] - 0x1; 0x0 <= P; P--) {
                    var G = D['lockers'][P]
                      , H = C['lockers']['children'][P];
                    G['handle_model'] = I,
                    H['params']['handle_model'] = I,
                    H['params']['handle_orientation'] = G['handle_orientation'] = 'horizontal',
                    J(G, H),
                    q || H['build_handle']();
                }
        }
        function J(Q, R) {
            let S, T;
            if ('horizontal' === R['params']['handle_orientation']) {
                if (x >= R['params']['width']) {
                    for (S = [],
                    T = 0x0; T < I['sizes']['length']; T++)
                        I['sizes'][T]['index'] = T,
                        I['sizes'][T]['width'] <= R['params']['width'] && S['push'](I['sizes'][T]);
                    S['sort'](function(U, W) {
                        return W['width'] - U['width'];
                    }),
                    S['length'] ? (Q['handle_size_index'] = S[0x0]['index'],
                    R['params']['handle_size_index'] = S[0x0]['index']) : (Q['handle_orientation'] = 'vertical',
                    R['params']['handle_orientation'] = 'vertical');
                } else
                    Q['handle_size_index'] = project_settings['handle'][w['params']['cabinet_group']]['preferable_size'],
                    R['params']['handle_size_index'] = project_settings['handle'][w['params']['cabinet_group']]['preferable_size'];
            }
            if ('vertical' === R['params']['handle_orientation']) {
                if (x >= R['params']['height']) {
                    for (S = [],
                    T = 0x0; T < I['sizes']['length']; T++)
                        I['sizes'][T]['index'] = T,
                        I['sizes'][T]['width'] <= R['params']['height'] && S['push'](I['sizes'][T]);
                    S['sort'](function(U, W) {
                        return W['width'] - U['width'];
                    }),
                    S['length'] && (Q['handle_size_index'] = S[0x0]['index'],
                    R['params']['handle_size_index'] = S[0x0]['index']);
                } else
                    Q['handle_size_index'] = project_settings['handle'][w['params']['cabinet_group']]['preferable_size'],
                    R['params']['handle_size_index'] = project_settings['handle'][w['params']['cabinet_group']]['preferable_size'];
            }
        }
        q && (!0x0 === I['is_gola'] ? w['build']() : (w['build_doors'](),
        w['build_lockers'](),
        w['build_sections']())),
        0x1 === j && 0x0 === this['params']['gola'] && w['build'](),
        0x0 === j && 0x1 === this['params']['gola'] && w['build']();
    }
}
,
Cabinet_new['prototype']['set_handle_active_single'] = function(f, g, h, i=null) {
    var g = this['find_child_by_index'](g, h, i);
    g['params']['no_handle_forced'] = f,
    g['obj']['params']['no_handle_forced'] = f,
    g['obj']['params']['handle_model']['is_gola'] ? (this['build_cabinet'](),
    this['build_sections'](),
    this['build_doors'](),
    this['build_lockers'](),
    this['build_gola']()) : g['obj']['build_handle'](),
    sc['get_price']();
}
,
Cabinet_new['prototype']['change_handle_position_single'] = function(f, g, h, j=null) {
    var g = this['find_child_by_index'](g, h, j), h = (g['params']['handle_position'] = f,
    g['obj']['params']['handle_position'] = f,
    g['obj']['params']['handle_model']['id']), k;
    'facade_profile' == handles_lib['items'][h]['type'] ? this['build_doors']() : g['obj']['build_handle'](),
    sc['get_price']();
}
,
Cabinet_new['prototype']['change_handle_orientation_single'] = function(f, g, h, i=null) {
    var g = this['find_child_by_index'](g, h, i);
    g['params']['handle_orientation'] = f,
    g['obj']['params']['handle_orientation'] = f,
    g['obj']['build_handle'](),
    sc['get_price']();
}
,
Cabinet_new['prototype']['change_handle_model_single'] = function(f, g, h, j=null) {
    var g = this['find_child_by_index'](g, h, j)
      , h = handles_lib['get_item'](f['id'])
      , k = (h['size_index'] = f['size'],
    g['params']['handle_model'] = h,
    g['params']['handle_size_index'] = f['size'],
    0x0)
      , l = g['obj']['params']['gola']
      , m = to_int('gola' == h['type']);
    g['obj']['params']['handle_model'] = h,
    g['obj']['params']['handle_size_index'] = f['size'],
    'gola' == h['type'] ? (g['params']['gola'] = 0x1,
    g['obj']['params']['gola'] = 0x1) : (g['params']['gola'] = 0x0,
    g['obj']['params']['gola'] = 0x0),
    g['obj']['build']();
}
,
Cabinet_new['prototype']['lock_object'] = function(f, g, h, i=null) {
    var g = this['find_child_by_index'](g, h, i);
    g['params']['params_locked'] = f,
    g['obj']['params']['params_locked'] = f;
}
,
Cabinet_new['prototype']['find_child_by_index'] = function(f, g, h=null) {
    let j, k;
    return k = null != h ? (j = this['sections']['children'][h],
    k = this['params']['sections'][h],
    'd' == f ? (j = j['doors']['children'],
    k['doors']) : (j = j['lockers']['children'],
    k['lockers'])) : 'd' == f ? (j = this['doors']['children'],
    this['params']['doors']) : (j = this['lockers']['children'],
    this['params']['lockers']),
    {
        'obj': j[g],
        'params': k[g]
    };
}
,
Cabinet_new['prototype']['get_facades_by_position'] = function(f) {
    var g = this
      , h = [];
    for (let q = 0x0; q < this['lockers']['children']['length']; q++)
        h['push'](p(this['lockers']['children'][q], 'l', q, null));
    let j = 0x0;
    for (let u = 0x0; u < this['doors']['children']['length']; u++) {
        if ('left_wall' != this['doors']['children'][u]['params']['tag'] && 'right_wall' != this['doors']['children'][u]['params']['tag'] || (j = 0x1),
        f) {
            if ('false_facade' != this['params']['cabinet']['type'] && 'falsefacade' == this['doors']['children'][u]['params']['type'] && '' != this['doors']['children'][u]['fixed_facade_model'] && 0x0 == j)
                continue;
        } else {
            if ('falsefacade' == this['doors']['children'][u]['params']['type'] && '' != this['doors']['children'][u]['fixed_facade_model'])
                continue;
        }
        h['push'](p(this['doors']['children'][u], 'd', u, null));
    }
    for (let v = 0x0; v < this['params']['sections']['length']; v++) {
        var k = this['params']['sections'][v];
        if (k['doors'])
            for (let w = 0x0; w < this['sections']['children'][v]['doors']['children']['length']; w++) {
                var m = this['sections']['children'][v]['doors']['children'][w];
                'falsefacade' == m['params']['type'] && '' != m['fixed_facade_model'] || h['push'](p(m, 'd', w, v));
            }
        if (k['lockers'])
            for (let x = 0x0; x < this['sections']['children'][v]['lockers']['children']['length']; x++) {
                var n = this['sections']['children'][v]['lockers']['children'][x];
                h['push'](p(n, 'l', x, v));
            }
    }
    function p(y, z, A, B) {
        return {
            'type': z,
            'index': A,
            'sec_index': B,
            'pos': y['getWorldPosition'](new THREE['Vector3']())['y'],
            'params': {
                'active': y['params']['active'],
                'tag': y['params']['tag'],
                'params_locked': y['params']['params_locked'],
                'type': y['params']['type'],
                'group': y['params']['group'],
                'facade': y['params']['facade'],
                'style': y['params']['style'],
                'material': y['params']['material'],
                'additional_materials': y['params']['additional_materials'],
                'glass_material': y['params']['glass_material'],
                'handle': y['params']['handle_model'],
                'handle_active': y['params']['handle_active'],
                'handle_orientation': y['params']['handle_orientation'],
                'handle_position': y['params']['handle_position'],
                'no_handle_forced': y['params']['no_handle_forced'],
                'width': y['params']['width'],
                'height': y['params']['height'],
                'thickness': y['params']['thickness'],
                'radius': y['params']['radius']
            }
        };
    }
    return h['sort'](function(y, z) {
        return z['pos'] - y['pos'];
    }),
    copy_object(h);
}
,
Cabinet_new['prototype']['get_lockers_by_position'] = function() {
    var f = [], g;
    for (let k = 0x0; k < this['lockers']['children']['length']; k++)
        f['push'](j(this['lockers']['children'][k], 'l', k, null));
    for (let l = 0x0; l < this['params']['sections']['length']; l++) {
        if (this['params']['sections'][l]['lockers'])
            for (let m = 0x0; m < this['sections']['children'][l]['lockers']['children']['length']; m++) {
                var h = this['sections']['children'][l]['lockers']['children'][m];
                f['push'](j(h, 'l', m, l));
            }
    }
    function j(n, o, p, q) {
        return {
            'type': n['params']['type'],
            'index': p,
            'sec_index': q,
            'pos': n['getWorldPosition'](new THREE['Vector3']())['y'],
            'type_params': n['params']['type_params'],
            'is_inner': n['params']['inner']
        };
    }
    return f['sort'](function(n, o) {
        return o['pos'] - n['pos'];
    }),
    copy_object(f);
}
,
Cabinet_new['prototype']['set_locker_param'] = function(f, g, h, j, k=null) {
    var h = this['find_child_by_index'](h, j, k);
    g ? (h['params']['type_params'][f['key']] = f['val'],
    h['obj']['params']['type_params'][f['key']] = f['val']) : (h['params'][f['key']] = f['val'],
    h['obj']['params'][f['key']] = f['val'],
    h['params']['type_params'] = copy_object(lockers_types[f['val']]),
    h['obj']['params']['type_params'] = copy_object(lockers_types[f['val']])),
    h['obj']['build']();
}
,
Cabinet_new['prototype']['change_type_to_top'] = function(f) {
    f && 0x0 < this['params']['cokol']['height'] && (this['params']['cokol']['height_backup'] = this['params']['cokol']['height']),
    !f && 0x0 < this['params']['cokol']['height_backup'] && (this['params']['cokol']['height'] = this['params']['cokol']['height_backup']),
    this['cabinet_type'] = f ? 'top' : this['params']['cabinet_group'] || 'bottom',
    this['params']['changed_to_top'] = f ? 0x1 : 0x0,
    this['params']['cokol']['active'] = !f,
    f || (this['position']['y'] = 0x0),
    this['build'](),
    this['userData']['has_tabletop'] && sc['build_tabletop']();
}
,
Cabinet_new['prototype']['set_tabletop_plints_active'] = function(e) {
    let f = this;
    Object['keys'](e)['forEach'](function(g) {
        f['params']['tabletop']['plints'][g] = e[g];
    }),
    this['build_tabletop'](),
    get_total_price_test(),
    global_update();
}
,
Cabinet_new['prototype']['set_tabletop_autogen'] = function(f) {
    this['params']['tabletop']['autogen'] = f,
    this['build_tabletop'](),
    this['build_sizes'](),
    this['build_size_box'](),
    get_total_price_test(),
    global_update();
}
,
Cabinet_new['prototype']['copypaste'] = function() {
    if (-0x1 < location['href']['indexOf']('zetta'))
        this['toggleResizeMode'](null, 'bottom');
    else {
        let k = room['box']['clone']();
        k['expandByScalar'](0.1);
        var f = copy_object(this['params']);
        for (let n = 0x0; n < f['doors']['length']; n++)
            delete f['doors'][n]['params_link'];
        for (let p = 0x0; p < f['lockers']['length']; p++)
            delete f['lockers'][p]['params_link'];
        var g = copy_object(f['accessories_list']);
        f['accessories_list'] = [],
        f['obj_id'] = void 0x0;
        let l = sc['add_object']('cabinet', f, !0x1);
        for (let q = 0x0; q < g['length']; q++) {
            var h = g[q]
              , j = copy_object(accsessories_data['items'][h['id']]);
            pp['interface']['root']['$emit']('add_cart_item', j, h['count'], l['params']['obj_id']);
        }
        l['position']['copy'](this['position']),
        l['rotation']['copy'](this['rotation']),
        0x0 === l['rotation']['y'] && (l['position']['x'] += l['params']['cabinet']['width'] / units),
        l['rotation']['y'] === Math['PI'] && (l['position']['x'] -= l['params']['cabinet']['width'] / units),
        l['rotation']['y'] === Math['PI'] / 0x2 && (l['position']['z'] -= l['params']['cabinet']['width'] / units),
        l['rotation']['y'] === -Math['PI'] / 0x2 && (l['position']['z'] += l['params']['cabinet']['width'] / units);
        let m = 0x0;
        setTimeout(function() {
            l['box']['update'](),
            k['containsBox'](l['box']) || (l['delete'](),
            m = 0x1);
        }, 0x64),
        setTimeout(function() {
            0x0 == m && (add_undo_action({
                'type': 'copy',
                'object': l
            }),
            'bottom' === l['params']['cabinet_group'] && get_wall_panel(),
            get_total_price_test());
        }, 0xc8);
    }
}
);
class Door_new extends THREE['Group'] {
    constructor(f) {
        super(f);
        var g = this;
        this['type'] = 'Door',
        f = f || {};
        let h, i;
        h = void 0x0 !== f['glass_material'] && get_material_by_id(f['glass_material']) ? f['glass_material'] : project_settings['selected_materials']['glass'] || void 0x0,
        this['params'] = {
            'active': void 0x0 === f['active'] || f['active'],
            'version': void 0x0 !== f['version'] ? f['version'] : 0x1,
            'width': void 0x0 !== f['width'] ? f['width'] : 0x258,
            'width2': void 0x0 !== f['width2'] ? f['width2'] : void 0x0,
            'height': void 0x0 !== f['height'] ? f['height'] : 0x2d0,
            'thickness': void 0x0 !== f['thickness'] ? f['thickness'] : 0x12,
            'hinges': void 0x0 !== f['hinges'] ? f['hinges'] : [{
                'pos': '' + global_options['hinges_door_offset_y'] * units,
                'from': -0x1
            }, {
                'pos': '' + global_options['hinges_door_offset_y'] * units,
                'from': 0x1
            }],
            'hinges_offset': void 0x0 !== f['hinges_offset'] ? f['hinges_offset'] : 0x10,
            'facade': void 0x0 !== f['facade'] ? f['facade'] : void 0x0,
            'facade2': void 0x0 !== f['facade2'] ? f['facade2'] : void 0x0,
            'type': void 0x0 !== f['type'] ? f['type'] : 'ltr',
            'style': void 0x0 !== f['style'] ? f['style'] : ['full', 'full'],
            'name': void 0x0 !== f['name'] ? f['name'] : 'Door',
            'facade_type': void 0x0 !== f['facade_type'] ? f['facade_type'] : 'normal',
            'fixed_facade_model': void 0x0 !== f['fixed_facade_model'] ? f['fixed_facade_model'] : void 0x0,
            'can_be_opened': void 0x0 === f['can_be_opened'] || f['can_be_opened'],
            'furniture_visible': void 0x0 === f['furniture_visible'] || f['furniture_visible'],
            'handle_active': void 0x0 === f['handle_active'] || f['handle_active'],
            'no_handle': void 0x0 !== f['no_handle'] && f['no_handle'],
            'handle_position': void 0x0 !== f['handle_position'] ? f['handle_position'] : 'top',
            'inner_radius': void 0x0 !== f['inner_radius'] && f['inner_radius'],
            'no_handle_forced': void 0x0 !== f['no_handle_forced'] && f['no_handle_forced'],
            'no_handle_group': void 0x0 !== f['no_handle_group'] && f['no_handle_group'],
            'handle_model_type': void 0x0 !== f['handle_model_type'] ? f['handle_model_type'] : 'common',
            'material': void 0x0 !== f['material'] ? f['material'] : 0x0,
            'material_rotated': void 0x0 !== f['material_rotated'] && f['material_rotated'],
            'additional_materials': void 0x0 !== f['additional_materials'] ? f['additional_materials'] : {},
            'glass_material': void 0x0 !== f['glass_material'] ? f['glass_material'] : h,
            'group': void 0x0 !== f['group'] ? f['group'] : 'top',
            'radius': void 0x0 !== f['radius'] && f['radius'],
            'radius_type': void 0x0 !== f['radius_type'] ? f['radius_type'] : 0x0,
            'orientation': void 0x0 !== f['orientation'] ? f['orientation'] : 'right',
            'flip': void 0x0 !== f['flip'] && f['flip'],
            'is_double': void 0x0 !== f['is_double'] && f['is_double'],
            'is_triple': void 0x0 !== f['is_triple'] && f['is_triple'],
            'params_locked': void 0x0 !== f['params_locked'] && f['params_locked'],
            'facade_locked': void 0x0 !== f['facade_locked'] && f['facade_locked'],
            'facade_type_locked': void 0x0 !== f['facade_type_locked'] && f['facade_type_locked'],
            'facade_mat_locked': void 0x0 !== f['facade_mat_locked'] && f['facade_mat_locked'],
            'facade_offset': void 0x0 !== f['facade_offset'] ? f['facade_offset'] : project_settings['door_offset'],
            'models': void 0x0 !== f['models'] ? f['models'] : [],
            'tag': void 0x0 !== f['tag'] ? f['tag'] : '',
            'pX': f['pX'] || 0x0,
            'pY': f['pY'] || 0x0,
            'pZ': f['pZ'] || 0x0,
            'rX': f['rX'] || 0x0,
            'rY': f['rY'] || 0x0,
            'rZ': f['rZ'] || 0x0
        },
        project_settings['door_thickness'] && (this['params']['thickness'] = 0x18),
        void 0x0 === this['params']['facade'] && (this['params']['facade'] = project_settings['defaults']['facades'][this['params']['group']]),
        void 0x0 === this['params']['facade2'] && (this['params']['facade2'] = this['params']['facade']),
        this['params']['handle_offset'] = facades_lib['get_item'](this['params']['facade'])['handle_offset'],
        null == this['params']['handle_offset'] && (this['params']['handle_offset'] = 0x19),
        this['params']['handle_offset'] = parseInt(this['params']['handle_offset']),
        this['params']['handle_model'] = void 0x0 !== f['handle_model'] ? f['handle_model'] : project_settings['handle'][this['params']['group']]['model'],
        this['params']['handle_size_index'] = void 0x0 !== f['handle_size_index'] ? f['handle_size_index'] : project_settings['handle'][this['params']['group']]['preferable_size'],
        this['params']['handle_orientation'] = (void 0x0 !== f['handle_orientation'] ? f : project_settings['handle'][this['params']['group']])['handle_orientation'],
        this['params']['handle_model'] && 'gola' === this['params']['handle_model']['type'] && (this['params']['handle_model'] = project_settings['handle'][this['params']['group']]['model']),
        !0x0 === this['params']['can_be_opened'] && (this['o_type'] = 'Locker'),
        this['params']['style']instanceof Array || (i = [this['params']['style'], this['params']['style']],
        this['params']['style'] = i),
        this['params']['material']instanceof Array || (this['params']['material'] = [this['params']['material'], this['params']['material']]),
        g['can_load_model'] = 0x0,
        this['name'] = this['params']['name'],
        0x1 == project_settings['handle'][this['params']['group']]['no_handle'] && (this['userData']['no_handle_forced'] = !0x0),
        0x1 != project_settings['handle'][this['params']['group']]['no_handle'] ? this['params']['gola'] = to_int(!0x0 === project_settings['handle'][this['params']['group']]['model']['is_gola']) : this['params']['gola'] = 0x0,
        this['cabinet'] = f['cabinet'],
        this['par_index'] = f['index'],
        this['params_link'] = f['params_link'],
        -0x1 < this['params']['type']['indexOf']('corner_90') ? this['params']['width2'] || (this['params']['width2'] = this['params']['width']) : delete this['params']['width2'],
        this['params']['version'] < 0x2 && (this['cabinet'] || (this['cabinet'] = this['parent']['parent'])),
        0x0 == this['params']['no_handle_forced'] && void 0x0 !== this['params']['handle_model'] && (this['params']['handle_model']['type'] || (this['params']['handle_model']['type'] = 'common'),
        'facade_profile' === this['params']['handle_model']['type'] && (this['params']['radius'] || this['params']['inner_radius'] ? this['params']['handle_model'] = 'none' : 0x1 == project_settings['handle'][this['params']['group']]['no_handle'] || 0x0 == facades_lib['get_item'](this['params']['facade'])['handle'] || this['params']['no_handle_forced'] || (this['params']['height'] -= this['params']['handle_model']['sizes'][0x0]['height'] - g['params']['handle_model']['sizes'][0x0]['offset_y'],
        'top' !== g['params']['handle_position'] && (this['params']['pY'] += (this['params']['handle_model']['sizes'][0x0]['height'] - g['params']['handle_model']['sizes'][0x0]['offset_y']) / units))),
        'overhead' !== this['params']['handle_model']['type'] && 'overhead_profile' != g['params']['handle_model']['type'] || (this['params']['radius'] || this['params']['inner_radius']) && (this['params']['handle_model'] = 'none')),
        this['params']['version'] < 0x2 && (this['params_link'][this['par_index']]['material'] = this['params']['material'][0x0]),
        this['userData']['state'] = {
            'is_open': !0x1,
            'is_moving': !0x1,
            'starting_pos': 0x0
        },
        'function' == typeof door_before_build && door_before_build(this),
        this['build']();
    }
}
Door_new['prototype']['build'] = function() {
    switch (this['userData']['state'] = {
        'is_open': !0x1,
        'is_moving': !0x1,
        'starting_pos': 0x0
    },
    this['reset_model'](),
    this['params']['material']instanceof Array || (this['params']['material'] = [this['params']['material'], this['params']['material']]),
    this['params']['type']) {
    case 'ltr':
        this['build_ltr']();
        break;
    case 'rtl':
        this['build_rtl']();
        break;
    case 'simple_top':
        this['build_simple_top']();
        break;
    case 'angle_top':
        this['build_simple_top']();
        break;
    case 'front_top':
        this['build_front_top']();
        break;
    case 'simple_bottom':
        this['build_simple_bottom']();
        break;
    case 'double_top':
        this['build_double_top']();
        break;
    case 'falsefacade':
        this['build_falsefacade']();
        break;
    case 'corner_90_ltr':
        this['build_corner_90_ltr']();
        break;
    case 'corner_90_rtl':
        this['build_corner_90_rtl']();
        break;
    case 'coupe_l':
        this['build_coupe']();
        break;
    case 'coupe_r':
        this['build_coupe']();
        break;
    default:
        break;
    }
    this['params']['models'] && this['build_models'](),
    this['check_fixed_facade'](),
    'function' == typeof after_door_build && after_door_build(this);
}
,
Door_new['prototype']['build_models'] = function() {
    if (this['facade']) {
        let e = this;
        for (let g = 0x0; g < this['params']['models']['length']; g++)
            f(this['params']['models'][g]);
        function f(h) {
            var j, h = _['merge']({
                'spec': {
                    'catalog': 'interior',
                    'absolute_size': !0x1,
                    'id': 0x57,
                    'use_model_size': !0x1,
                    'compatible': {
                        'items': [],
                        'categories': []
                    },
                    'sizes': []
                },
                'size': {
                    'x': 0x1c7,
                    'y': 0x63f,
                    'z': 0x98
                },
                'pos': {
                    'x': '50%',
                    'y': 0x0,
                    'z': 0x0
                },
                'pivot': {
                    'x': 0x0,
                    'y': -0x1,
                    'z': -0x1
                },
                'rot': {
                    'x': 0x0,
                    'y': 0x0,
                    'z': 0x0
                }
            }, h), k = e['params']['width'], l = e['params']['height'], m = e['params']['thickness'], q = (h['size']['x'] = convert_size(h['size']['x'], k),
            h['size']['y'] = convert_size(h['size']['y'], l),
            h['size']['z'] = convert_size(h['size']['z'], m),
            {
                'x': -e['params']['hinges_offset'] / units / 0x2 + e['params']['facade_offset'] / units,
                'y': -h['size']['y'] / units / 0x2 - l / units / 0x2 + e['params']['facade_offset'] / units,
                'z': -h['size']['z'] / units - m / units / 0x2
            }), u = (h['spec']['absolute_size'],
            models_lib[h['spec']['catalog']]['get_item'](h['spec']['id'])), v = (u['draggable'] = !0x1,
            u['sizes_available'] = !0x1,
            {}), k = (v['x'] = conv_val(h['pos']['x'], k) / units,
            v['y'] = conv_val(h['pos']['y'], l) / units,
            v['z'] = conv_val(h['pos']['z'], m) / units,
            {});
            k['x'] = conv_pivot(h['pivot']['x'], h['size']['x']),
            k['y'] = conv_pivot(h['pivot']['y'], h['size']['y']),
            k['z'] = conv_pivot(h['pivot']['z'], h['size']['z']),
            'ltr' == e['params']['type'] && (k['x'] *= -0x1,
            q['x'] *= -0x1,
            v['x'] *= -0x1),
            u['variants'][0x0]['width'] = h['size']['x'],
            u['variants'][0x0]['height'] = h['size']['y'],
            u['variants'][0x0]['depth'] = h['size']['z'];
            let w = new Model_new(u);
            w['position']['set'](q['x'] + v['x'], q['y'] + v['y'], q['z'] + v['z']),
            w['translateX'](k['x'] / units),
            w['translateY'](k['y'] / units),
            w['translateZ'](k['z'] / units),
            e['facade']['add'](w),
            setTimeout(function() {
                w['load_model']();
            }, 0x64),
            cl();
        }
    } else
        setTimeout( () => {
            this['build_models']();
        }
        , 0x64);
}
,
Door_new['prototype']['set_handle_position'] = function(e) {
    var f = this;
    switch (this['params']['type']) {
    case 'double_top':
        this['set_handle_position_double_top'](e);
        break;
    case 'ltr':
        this['set_handle_position_ltr'](e);
        break;
    case 'rtl':
        this['set_handle_position_rtl'](e);
        break;
    case 'simple_top':
        this['set_handle_position_simple_top'](e);
        break;
    case 'angle_top':
        this['set_handle_position_simple_top'](e);
        break;
    case 'front_top':
        this['set_handle_position_front_top'](e);
        break;
    case 'simple_bottom':
        this['set_handle_position_simple_bottom'](e);
        break;
    case 'falsefacade':
        this['set_handle_position_ltr'](e);
        break;
    case 'corner_90_ltr':
        this['set_handle_position_corner_90_ltr']();
        break;
    case 'corner_90_rtl':
        this['set_handle_position_corner_90_rtl']();
        break;
    default:
        break;
    }
}
,
Door_new['prototype']['set_additional_materials'] = function(e) {
    !facades_lib['items'][this['params']['facade']]['additional_materials'][e] || this['params']['additional_materials'][e] || (this['params']['additional_materials'][e] = facades_lib['items'][this['params']['facade']]['additional_materials'][e]['selected'],
    this['params']['version'] < 0x2 && (this['params_link'][this['par_index']]['additional_materials'] || (this['params_link'][this['par_index']]['additional_materials'] = {}),
    this['params_link'][this['par_index']]['additional_materials'][e] = facades_lib['items'][this['params']['facade']]['additional_materials'][e]['selected']));
}
,
Door_new['prototype']['build_hinges'] = function() {
    var f = this
      , g = this['params']['type'];
    if ('ltr' === g || 'rtl' === g) {
        var h = 'ltr' === g ? 0x1 : 0x0, j = h ? -0x1 : 0x1, k = h * f['params']['width'] / units, l = furniture_models['hinge_door']['sizes'], m;
        for (m of this['params']['hinges']) {
            var q = v(m, f['params']['height']), u;
            let w = new THREE['Mesh'](furniture_models['hinge_door'],aluminium_material);
            w['receiveShadow'] = !0x0,
            w['name'] = 'furni',
            w['position']['set'](k + j * (f['cabinet']['params']['cabinet']['thickness'] / units + l['x'] / 0x2), q / units, -l['z'] / 0x2),
            'corner' === f['cabinet']['params']['cabinet']['type'] && (w['rotation']['y'] = j * Math['PI'] / 0x4,
            w['position']['x'] = k - j * l['x'] / 0x2),
            'end_corner_facade' === f['cabinet']['params']['cabinet']['type'] && (w['rotation']['y'] = j * Math['PI'] / 0x4,
            w['position']['x'] = k - j * l['x'] / 0x2),
            'corner_straight' === f['cabinet']['params']['cabinet']['type'] && f['cabinet']['params']['cabinet']['orientation'] == (h ? 'left' : 'right') && (w['rotation']['y'] = j * Math['PI'] / 0x2,
            w['position']['x'] = k - j * l['z'] / 0x2,
            w['position']['z'] = -l['x'] / 0x2),
            f['add'](w),
            h && (w['rotation']['z'] = Math['PI']),
            h && 'end_corner_facade' === f['cabinet']['params']['cabinet']['type'] && 'right' == this['params']['orientation'] && (w['rotation']['y'] += 0.2),
            (w = new THREE['Mesh'](furniture_models['hinge_facade'],aluminium_material))['receiveShadow'] = !0x0,
            w['name'] = 'furni',
            w['position']['set'](j * furniture_models['hinge_facade']['sizes']['x'] / 0x2, q / units - f['params']['height'] / units / 0x2, -f['facade']['params']['thickness'] / units / 0x2 - furniture_models['hinge_facade']['sizes']['z'] / 0x2),
            f['facade']['add'](w),
            h && (w['rotation']['z'] = Math['PI']);
        }
    }
    function v(x, y) {
        let z = x['pos'] || '0';
        var x = 0x0 === x['from'] || x['from'] ? x['from'] : -0x1;
        let A = !0x1;
        0x0 < (z = 'string' != typeof z ? '' + z : z)['length'] && '%' === z['slice'](-0x1) && (z = z['slice'](0x0, -0x1),
        A = !0x0);
        try {
            z = parseFloat(z);
        } catch (B) {
            z = 0x0;
        }
        return Number['isFinite'](z) || (z = 0x0),
        A && (z = z / 0x64 * y),
        0x0 === x ? y / 0x2 + z : 0x0 < x ? y - z : z;
    }
}
,
Door_new['prototype']['build_ltr'] = function() {
    var e;
    this['params']['radius'] ? this['build_ltr_radius']() : this['params']['inner_radius'] ? this['build_ltr_inner_radius']() : ((e = this)['facade'] = new Facade_new({
        'parent': e,
        'facade': e['params']['facade'],
        'width': e['params']['width'] - 0x2 * e['params']['facade_offset'],
        'height': e['params']['height'] - 0x2 * e['params']['facade_offset'],
        'thickness': e['params']['thickness'],
        'style': e['params']['style'][0x0],
        'fixed_model': e['params']['fixed_facade_model'],
        'material': e['params']['material'][0x0],
        'material_rotated': e['params']['material_rotated'],
        'glass_material': e['params']['glass_material'],
        'no_handle_group': e['params']['no_handle_group'],
        'facade_type': e['params']['facade_type'],
        'group': e['params']['group'],
        'flip': e['params']['flip'],
        'is_double': e['params']['is_double'],
        'is_triple': e['params']['is_triple'],
        'pX': e['params']['width'] / units - e['params']['hinges_offset'] / 0x2 / units,
        'pZ': e['params']['thickness'] / 0x2 / units,
        'pY': e['params']['height'] / 0x2 / units
    }),
    constructor_settings['furniture_available'] && 0x1 == e['params']['furniture_visible'] && this['params']['version'] < 0x2 && this['build_hinges'](),
    e['add'](e['facade']),
    e['facade']['model']['position']['x'] = -e['params']['width'] / 0x2 / units + e['params']['hinges_offset'] / 0x2 / units,
    e['position']['set'](e['params']['pX'], e['params']['pY'], e['params']['pZ']),
    e['rotation']['set'](e['params']['rX'], e['params']['rY'], e['params']['rZ']),
    e['build_handle']());
}
,
Door_new['prototype']['build_rtl'] = function() {
    var e;
    this['params']['radius'] ? this['build_rtl_radius']() : this['params']['inner_radius'] ? this['build_rtl_inner_radius']() : ((e = this)['facade'] = new Facade_new({
        'parent': e,
        'facade': e['params']['facade'],
        'width': e['params']['width'] - 0x2 * e['params']['facade_offset'],
        'height': e['params']['height'] - 0x2 * e['params']['facade_offset'],
        'thickness': e['params']['thickness'],
        'style': e['params']['style'][0x0],
        'fixed_model': e['params']['fixed_facade_model'],
        'material': e['params']['material'][0x0],
        'material_rotated': e['params']['material_rotated'],
        'glass_material': e['params']['glass_material'],
        'no_handle_group': e['params']['no_handle_group'],
        'facade_type': e['params']['facade_type'],
        'group': e['params']['group'],
        'radius': e['params']['radius'],
        'flip': e['params']['flip'],
        'is_double': e['params']['is_double'],
        'is_triple': e['params']['is_triple'],
        'pX': e['params']['hinges_offset'] / 0x2 / units,
        'pZ': e['params']['thickness'] / 0x2 / units,
        'pY': e['params']['height'] / 0x2 / units
    }),
    constructor_settings['furniture_available'] && 0x1 == e['params']['furniture_visible'] && this['params']['version'] < 0x2 && this['build_hinges'](),
    e['add'](e['facade']),
    e['facade']['model']['position']['x'] = e['params']['width'] / 0x2 / units - e['params']['hinges_offset'] / 0x2 / units,
    e['position']['set'](e['params']['pX'], e['params']['pY'], e['params']['pZ']),
    e['rotation']['set'](e['params']['rX'], e['params']['rY'], e['params']['rZ']),
    e['build_handle']());
}
,
Door_new['prototype']['build_simple_top'] = function() {
    var e = this;
    e['facade'] = new Facade_new({
        'parent': e,
        'facade': e['params']['facade'],
        'width': e['params']['width'] - 0x2 * e['params']['facade_offset'],
        'height': e['params']['height'] - 0x2 * e['params']['facade_offset'],
        'thickness': e['params']['thickness'],
        'style': e['params']['style'][0x1],
        'fixed_model': e['params']['fixed_facade_model'],
        'material': e['params']['material'][0x1],
        'material_rotated': e['params']['material_rotated'],
        'glass_material': e['params']['glass_material'],
        'no_handle_group': e['params']['no_handle_group'],
        'facade_type': e['params']['facade_type'],
        'group': e['params']['group'],
        'flip': e['params']['flip'],
        'pX': e['params']['width'] / 0x2 / units,
        'pZ': e['params']['thickness'] / 0x2 / units,
        'pY': e['params']['height'] / units - e['params']['hinges_offset'] / 0x2 / units
    }),
    e['add'](e['facade']),
    e['facade']['model']['position']['y'] = -e['params']['height'] / units / 0x2 + e['params']['hinges_offset'] / 0x2 / units,
    e['position']['set'](e['params']['pX'], e['params']['pY'], e['params']['pZ']),
    e['rotation']['set'](e['params']['rX'], e['params']['rY'], e['params']['rZ']),
    this['userData']['state']['starting_pos'] = {},
    this['userData']['state']['starting_pos']['x'] = e['facade']['position']['x'],
    this['userData']['state']['starting_pos']['y'] = e['facade']['position']['y'],
    this['userData']['state']['starting_pos']['z'] = e['facade']['position']['z'],
    e['build_handle']();
}
,
Door_new['prototype']['build_simple_bottom'] = function() {
    var f = this
      , g = f['params']['width']
      , h = f['params']['height']
      , j = f['params']['thickness']
      , k = f['params']['style'];
    f['facade'] = new Facade_new({
        'parent': f,
        'facade': f['params']['facade'],
        'width': f['params']['width'] - 0x2 * f['params']['facade_offset'],
        'height': f['params']['height'] - 0x2 * f['params']['facade_offset'],
        'thickness': f['params']['thickness'],
        'style': f['params']['style'][0x1],
        'fixed_model': f['params']['fixed_facade_model'],
        'material': f['params']['material'][0x1],
        'material_rotated': f['params']['material_rotated'],
        'glass_material': f['params']['glass_material'],
        'no_handle_group': f['params']['no_handle_group'],
        'facade_type': f['params']['facade_type'],
        'group': f['params']['group'],
        'flip': f['params']['flip'],
        'pX': f['params']['width'] / 0x2 / units,
        'pZ': f['params']['thickness'] / 0x2 / units,
        'pY': f['params']['height'] / units - f['params']['hinges_offset'] / 0x2 / units
    }),
    f['add'](f['facade']),
    f['facade']['model']['position']['y'] = f['params']['height'] / units / 0x2 + f['params']['hinges_offset'] / 0x2 / units,
    f['position']['set'](f['params']['pX'], f['params']['pY'], f['params']['pZ']),
    f['rotation']['set'](f['params']['rX'], f['params']['rY'], f['params']['rZ']),
    f['build_handle']();
}
,
Door_new['prototype']['build_double_top'] = function() {
    var f = this
      , g = f['params']['width']
      , h = f['params']['height']
      , j = f['params']['thickness']
      , k = f['params']['style'];
    f['facade2'] = new Facade_new({
        'parent': f,
        'facade': f['params']['facade'],
        'width': f['params']['width'] - 0x2 * f['params']['facade_offset'],
        'height': f['params']['height'] / 0x2 - 0x2 * f['params']['facade_offset'],
        'thickness': f['params']['thickness'],
        'style': f['params']['style'][0x0],
        'fixed_model': f['params']['fixed_facade_model'],
        'material': f['params']['material'][0x1],
        'material_rotated': f['params']['material_rotated'],
        'glass_material': f['params']['glass_material'],
        'no_handle_group': f['params']['no_handle_group'],
        'facade_type': f['params']['facade_type'],
        'group': f['params']['group'],
        'flip': f['params']['flip'],
        'pX': f['params']['width'] / 0x2 / units,
        'pZ': f['params']['thickness'] / 0x2 / units,
        'pY': f['params']['height'] / units
    }),
    f['add'](f['facade2']),
    f['facade2']['model']['position']['y'] = -f['params']['height'] / 0x4 / units,
    f['facade'] = new Facade_new({
        'parent': f,
        'facade': f['params']['facade'],
        'width': f['params']['width'] - 0x2 * f['params']['facade_offset'],
        'height': f['params']['height'] / 0x2 - 0x2 * f['params']['facade_offset'],
        'thickness': f['params']['thickness'],
        'style': f['params']['style'][0x1],
        'fixed_model': f['params']['fixed_facade_model'],
        'material': f['params']['material'][0x1],
        'material_rotated': f['params']['material_rotated'],
        'glass_material': f['params']['glass_material'],
        'no_handle_group': f['params']['no_handle_group'],
        'facade_type': f['params']['facade_type'],
        'group': f['params']['group'],
        'flip': f['params']['flip'],
        'pX': f['params']['width'] / 0x2 / units,
        'pZ': f['params']['thickness'] / 0x2 / units,
        'pY': f['params']['height'] / units / 0x2 - f['params']['hinges_offset'] / 0x2 / units
    }),
    f['add'](f['facade']),
    f['facade']['model']['position']['y'] = -f['params']['height'] / 0x4 / units + f['params']['hinges_offset'] / 0x2 / units,
    f['position']['set'](f['params']['pX'], f['params']['pY'], f['params']['pZ']),
    f['rotation']['set'](f['params']['rX'], f['params']['rY'], f['params']['rZ']),
    f['build_handle']();
}
,
Door_new['prototype']['build_front_top'] = function() {
    var f = this
      , g = f['params']['width']
      , h = f['params']['height']
      , j = f['params']['thickness']
      , k = f['params']['style'];
    f['facade'] = new Facade_new({
        'parent': f,
        'facade': f['params']['facade'],
        'width': f['params']['width'] - 0x2 * f['params']['facade_offset'],
        'height': f['params']['height'] - 0x2 * f['params']['facade_offset'],
        'thickness': f['params']['thickness'],
        'style': f['params']['style'][0x1],
        'fixed_model': f['params']['fixed_facade_model'],
        'material': f['params']['material'][0x1],
        'material_rotated': f['params']['material_rotated'],
        'glass_material': f['params']['glass_material'],
        'no_handle_group': f['params']['no_handle_group'],
        'facade_type': f['params']['facade_type'],
        'group': f['params']['group'],
        'flip': f['params']['flip'],
        'pX': f['params']['width'] / 0x2 / units,
        'pZ': f['params']['thickness'] / 0x2 / units,
        'pY': f['params']['height'] / units - f['params']['hinges_offset'] / 0x2 / units
    }),
    f['add'](f['facade']),
    f['facade']['model']['position']['y'] = -f['params']['height'] / units / 0x2 + f['params']['hinges_offset'] / 0x2 / units,
    f['position']['set'](f['params']['pX'], f['params']['pY'], f['params']['pZ']),
    f['rotation']['set'](f['params']['rX'], f['params']['rY'], f['params']['rZ']),
    f['build_handle']();
}
,
Door_new['prototype']['build_ltr_radius'] = function() {
    var f, g, h, j, k;
    0x0 != this['params']['radius_type'] ? this['build_ltr_radius_f']() : (g = (f = this)['params']['width'],
    h = f['params']['height'],
    j = f['params']['thickness'],
    k = f['params']['style'],
    f['facade'] = new Facade_new({
        'parent': f,
        'facade': f['params']['facade'],
        'width': f['params']['width'] - 0x2 * f['params']['facade_offset'],
        'height': f['params']['height'] - 0x2 * f['params']['facade_offset'],
        'thickness': f['params']['thickness'],
        'style': f['params']['style'][0x1],
        'fixed_model': f['params']['fixed_facade_model'],
        'material': f['params']['material'][0x1],
        'material_rotated': f['params']['material_rotated'],
        'glass_material': f['params']['glass_material'],
        'no_handle_group': f['params']['no_handle_group'],
        'facade_type': f['params']['facade_type'],
        'group': f['params']['group'],
        'radius': f['params']['radius'],
        'flip': f['params']['flip'],
        'orientation': f['params']['orientation'],
        'pY': f['params']['height'] / 0x2 / units
    }),
    f['add'](f['facade']),
    f['position']['set'](f['params']['pX'], f['params']['pY'], f['params']['pZ']),
    f['rotation']['set'](f['params']['rX'], f['params']['rY'], f['params']['rZ']),
    void 0x0 !== f['facade']['params']['do_not_build_handle'] && 0x1 !== f['params']['is_gola'] || f['build_handle']());
}
,
Door_new['prototype']['build_ltr_radius_f'] = function() {
    var f = this
      , g = f['params']['width']
      , h = f['params']['height']
      , j = f['params']['thickness']
      , k = f['params']['style'];
    f['facade'] = new Facade_new({
        'parent': f,
        'facade': f['params']['facade'],
        'width': f['params']['width'] - 0x2 * f['params']['facade_offset'],
        'height': f['params']['height'] - 0x2 * f['params']['facade_offset'],
        'thickness': f['params']['thickness'],
        'style': f['params']['style'][0x1],
        'fixed_model': f['params']['fixed_facade_model'],
        'material': f['params']['material'][0x1],
        'material_rotated': f['params']['material_rotated'],
        'glass_material': f['params']['glass_material'],
        'no_handle_group': f['params']['no_handle_group'],
        'facade_type': f['params']['facade_type'],
        'group': f['params']['group'],
        'radius': 'rn',
        'flip': f['params']['flip'],
        'orientation': f['params']['orientation'],
        'pY': f['params']['height'] / 0x2 / units
    }),
    f['add'](f['facade']),
    f['position']['x'] = f['cabinet']['params']['cabinet']['width'] / units / 0x2,
    f['position']['z'] = -f['cabinet']['params']['cabinet']['depth'] / units / 0x2,
    f['position']['y'] = f['params']['pY'],
    void 0x0 !== f['facade']['params']['do_not_build_handle'] && 0x1 !== f['params']['is_gola'] || f['build_handle']();
}
,
Door_new['prototype']['build_rtl_radius'] = function() {
    var f, g, h, j, k;
    0x0 != this['params']['radius_type'] ? this['build_rtl_radius_f']() : (g = (f = this)['params']['width'],
    h = f['params']['height'],
    j = f['params']['thickness'],
    k = f['params']['style'],
    f['facade'] = new Facade_new({
        'parent': f,
        'facade': f['params']['facade'],
        'width': f['params']['width'] - 0x2 * f['params']['facade_offset'],
        'height': f['params']['height'] - 0x2 * f['params']['facade_offset'],
        'thickness': f['params']['thickness'],
        'style': f['params']['style'][0x0],
        'fixed_model': f['params']['fixed_facade_model'],
        'material': f['params']['material'][0x0],
        'material_rotated': f['params']['material_rotated'],
        'glass_material': f['params']['glass_material'],
        'no_handle_group': f['params']['no_handle_group'],
        'facade_type': f['params']['facade_type'],
        'group': f['params']['group'],
        'radius': f['params']['radius'],
        'flip': f['params']['flip'],
        'orientation': f['params']['orientation'],
        'pY': f['params']['height'] / 0x2 / units
    }),
    f['add'](f['facade']),
    f['position']['set'](f['params']['pX'], f['params']['pY'], f['params']['pZ']),
    f['rotation']['set'](f['params']['rX'], f['params']['rY'], f['params']['rZ']),
    void 0x0 !== f['facade']['params']['do_not_build_handle'] && 0x1 !== f['params']['is_gola'] || f['build_handle']());
}
,
Door_new['prototype']['build_rtl_radius_f'] = function() {
    var f = this
      , g = f['params']['width']
      , h = f['params']['height']
      , j = f['params']['thickness']
      , k = f['params']['style'];
    f['facade'] = new Facade_new({
        'parent': f,
        'facade': f['params']['facade'],
        'width': f['params']['width'] - 0x2 * f['params']['facade_offset'],
        'height': f['params']['height'] - 0x2 * f['params']['facade_offset'],
        'thickness': f['params']['thickness'],
        'style': f['params']['style'][0x0],
        'fixed_model': f['params']['fixed_facade_model'],
        'material': f['params']['material'][0x0],
        'material_rotated': f['params']['material_rotated'],
        'glass_material': f['params']['glass_material'],
        'no_handle_group': f['params']['no_handle_group'],
        'facade_type': f['params']['facade_type'],
        'group': f['params']['group'],
        'radius': 'rn',
        'flip': f['params']['flip'],
        'orientation': f['params']['orientation'],
        'pY': f['params']['height'] / 0x2 / units
    }),
    f['add'](f['facade']),
    f['position']['x'] = -f['cabinet']['params']['cabinet']['width'] / units / 0x2,
    f['position']['z'] = -f['cabinet']['params']['cabinet']['depth'] / units / 0x2,
    f['position']['y'] = f['params']['pY'],
    void 0x0 !== f['facade']['params']['do_not_build_handle'] && 0x1 !== f['params']['is_gola'] || f['build_handle']();
}
,
Door_new['prototype']['build_falsefacade'] = function() {
    var f = this
      , g = f['params']['width']
      , h = f['params']['height']
      , j = f['params']['thickness']
      , k = f['params']['style'];
    f['facade'] = new Facade_new({
        'parent': f,
        'facade': f['params']['facade'],
        'width': f['params']['width'] - 0x2 * f['params']['facade_offset'],
        'height': f['params']['height'] - 0x2 * f['params']['facade_offset'],
        'thickness': f['params']['thickness'],
        'style': f['params']['style'][0x0],
        'fixed_model': f['params']['fixed_facade_model'],
        'material': f['params']['material'][0x0],
        'material_rotated': f['params']['material_rotated'],
        'glass_material': f['params']['glass_material'],
        'no_handle_group': f['params']['no_handle_group'],
        'facade_type': f['params']['facade_type'],
        'group': f['params']['group'],
        'flip': f['params']['flip'],
        'pX': f['params']['width'] / units - f['params']['hinges_offset'] / 0x2 / units,
        'pZ': f['params']['thickness'] / 0x2 / units,
        'pY': f['params']['height'] / 0x2 / units
    }),
    f['add'](f['facade']),
    f['facade']['model']['position']['x'] = -f['params']['width'] / 0x2 / units + f['params']['hinges_offset'] / 0x2 / units,
    f['position']['set'](f['params']['pX'], f['params']['pY'], f['params']['pZ']),
    f['rotation']['set'](f['params']['rX'], f['params']['rY'], f['params']['rZ']),
    f['build_handle']();
}
,
Door_new['prototype']['build_ltr_inner_radius'] = function() {
    var f = this
      , g = f['params']['width']
      , h = f['params']['height']
      , j = f['params']['thickness']
      , k = f['params']['style'];
    f['facade'] = new Facade_new({
        'parent': f,
        'facade': f['params']['facade'],
        'width': f['params']['width'] - 0x2 * f['params']['facade_offset'],
        'height': f['params']['height'] - 0x2 * f['params']['facade_offset'],
        'thickness': f['params']['thickness'],
        'style': f['params']['style'][0x1],
        'fixed_model': f['params']['fixed_facade_model'],
        'material': f['params']['material'][0x1],
        'material_rotated': f['params']['material_rotated'],
        'glass_material': f['params']['glass_material'],
        'no_handle_group': f['params']['no_handle_group'],
        'facade_type': f['params']['facade_type'],
        'group': f['params']['group'],
        'inner_radius': f['params']['inner_radius'],
        'flip': f['params']['flip'],
        'orientation': f['params']['orientation'],
        'pY': f['params']['height'] / 0x2 / units
    }),
    f['add'](f['facade']),
    f['position']['set'](f['params']['pX'], f['params']['pY'], f['params']['pZ']),
    f['rotation']['set'](f['params']['rX'], f['params']['rY'], f['params']['rZ']),
    void 0x0 !== f['facade']['params']['do_not_build_handle'] && 0x1 !== f['params']['is_gola'] || f['build_handle']();
}
,
Door_new['prototype']['build_rtl_inner_radius'] = function() {
    var f = this
      , g = f['params']['width']
      , h = f['params']['height']
      , j = f['params']['thickness']
      , k = f['params']['style'];
    f['facade'] = new Facade_new({
        'parent': f,
        'facade': f['params']['facade'],
        'width': f['params']['width'] - 0x2 * f['params']['facade_offset'],
        'height': f['params']['height'] - 0x2 * f['params']['facade_offset'],
        'thickness': f['params']['thickness'],
        'style': f['params']['style'][0x0],
        'fixed_model': f['params']['fixed_facade_model'],
        'material': f['params']['material'][0x0],
        'material_rotated': f['params']['material_rotated'],
        'glass_material': f['params']['glass_material'],
        'no_handle_group': f['params']['no_handle_group'],
        'facade_type': f['params']['facade_type'],
        'group': f['params']['group'],
        'inner_radius': f['params']['inner_radius'],
        'orientation': f['params']['orientation'],
        'flip': f['params']['flip'],
        'pY': f['params']['height'] / 0x2 / units
    }),
    f['add'](f['facade']),
    f['facade']['model']['position']['x'] = 0x0,
    f['facade']['model']['position']['z'] = -j / units / 0x2,
    f['position']['set'](f['params']['pX'], f['params']['pY'], f['params']['pZ']),
    f['rotation']['set'](f['params']['rX'], f['params']['rY'], f['params']['rZ']),
    void 0x0 !== f['facade']['params']['do_not_build_handle'] && 0x1 !== f['params']['is_gola'] || f['build_handle']();
}
,
Door_new['prototype']['build_corner_90_ltr'] = function() {
    var f = this
      , g = f['params']['width']
      , h = f['params']['height']
      , j = f['params']['thickness']
      , k = f['params']['style'];
    f['facade'] = new Facade_new({
        'parent': f,
        'facade': f['params']['facade'],
        'width': f['params']['width'] - 0x2 * f['params']['facade_offset'],
        'height': f['params']['height'] - 0x2 * f['params']['facade_offset'],
        'thickness': f['params']['thickness'],
        'style': f['params']['style'][0x0],
        'fixed_model': f['params']['fixed_facade_model'],
        'material': f['params']['material'][0x0],
        'material_rotated': f['params']['material_rotated'],
        'glass_material': f['params']['glass_material'],
        'no_handle_group': f['params']['no_handle_group'],
        'facade_type': f['params']['facade_type'],
        'group': f['params']['group'],
        'flip': f['params']['flip'],
        'pX': f['params']['width'] / units - f['params']['hinges_offset'] / 0x2 / units,
        'pZ': f['params']['thickness'] / 0x2 / units,
        'pY': f['params']['height'] / 0x2 / units
    }),
    f['facade2'] = new Facade_new({
        'parent': f,
        'facade': f['params']['facade'],
        'width': f['params']['width2'] - 0x2 * f['params']['facade_offset'],
        'height': f['params']['height'] - 0x2 * f['params']['facade_offset'],
        'thickness': f['params']['thickness'],
        'style': f['params']['style'][0x1],
        'fixed_model': f['params']['fixed_facade_model'],
        'material': f['params']['material'][0x0],
        'material_rotated': f['params']['material_rotated'],
        'glass_material': f['params']['glass_material'],
        'no_handle_group': f['params']['no_handle_group'],
        'facade_type': f['params']['facade_type'],
        'group': f['params']['group'],
        'flip': f['params']['flip'],
        'pX': f['params']['width'] / units - f['params']['hinges_offset'] / units + f['params']['thickness'] / units,
        'pZ': (f['params']['width2'] - 0x2 * f['params']['facade_offset']) / units / 0x2 + f['params']['hinges_offset'] / 0x2 / units,
        'pY': f['params']['height'] / 0x2 / units
    }),
    f['add'](f['facade']),
    f['add'](f['facade2']),
    f['facade']['model']['position']['x'] = -f['params']['width'] / 0x2 / units + f['params']['hinges_offset'] / 0x2 / units,
    f['facade2']['rotation']['y'] = -Math['PI'] / 0x2,
    f['position']['set'](f['params']['pX'], f['params']['pY'], f['params']['pZ']),
    f['rotation']['set'](f['params']['rX'], f['params']['rY'], f['params']['rZ']),
    f['build_handle']();
}
,
Door_new['prototype']['build_corner_90_rtl'] = function() {
    let f = this
      , g = f['params']['width']
      , h = f['params']['height']
      , j = f['params']['thickness']
      , k = f['params']['style']
      , l = f['params']['hinges_offset'] / units;
    var q = f['params']['width'] / units - f['params']['hinges_offset'] / units + f['params']['thickness'] / units
      , u = f['params']['thickness'] / 0x2 / units
      , v = f['params']['width'] / units / 0x2;
    f['params']['width'],
    f['params']['width2'];
    let w = f['params']['width'] - 0x2 * f['params']['facade_offset']
      , x = f['params']['width2'] - 0x2 * f['params']['facade_offset'];
    l = 'left' == f['cabinet']['params']['cabinet']['orientation'] ? (w = f['params']['width2'] - 0x2 * f['params']['facade_offset'],
    x = f['params']['width'] - 0x2 * f['params']['facade_offset'],
    (f['params']['width2'] / units - 0x2 * f['params']['facade_offset'] / units) / 0x2 + f['params']['hinges_offset'] / units / 0x2) : (w = f['params']['width2'] - 0x2 * f['params']['facade_offset'],
    x = f['params']['width'] - 0x2 * f['params']['facade_offset'],
    (f['params']['width2'] / units - f['params']['facade_offset'] / units) / 0x2 + f['params']['hinges_offset'] / units / 0x2),
    f['facade'] = new Facade_new({
        'parent': f,
        'facade': f['params']['facade'],
        'width': w,
        'height': f['params']['height'] - 0x2 * f['params']['facade_offset'],
        'thickness': f['params']['thickness'],
        'style': f['params']['style'][0x0],
        'fixed_model': f['params']['fixed_facade_model'],
        'material': f['params']['material'][0x0],
        'material_rotated': f['params']['material_rotated'],
        'glass_material': f['params']['glass_material'],
        'no_handle_group': f['params']['no_handle_group'],
        'facade_type': f['params']['facade_type'],
        'group': f['params']['group'],
        'flip': f['params']['flip'],
        'pX': q,
        'pZ': l,
        'pY': f['params']['height'] / 0x2 / units
    }),
    f['facade2'] = new Facade_new({
        'parent': f,
        'facade': f['params']['facade'],
        'width': x,
        'height': f['params']['height'] - 0x2 * f['params']['facade_offset'],
        'thickness': f['params']['thickness'],
        'style': f['params']['style'][0x1],
        'fixed_model': f['params']['fixed_facade_model'],
        'material': f['params']['material'][0x0],
        'material_rotated': f['params']['material_rotated'],
        'glass_material': f['params']['glass_material'],
        'no_handle_group': f['params']['no_handle_group'],
        'facade_type': f['params']['facade_type'],
        'group': f['params']['group'],
        'flip': f['params']['flip'],
        'pX': v,
        'pZ': u,
        'pY': f['params']['height'] / 0x2 / units
    }),
    f['add'](f['facade']),
    f['add'](f['facade2']),
    f['cabinet']['params']['cabinet']['orientation'],
    f['facade2']['rotation']['y'] = 0x0,
    f['facade']['rotation']['y'] = -Math['PI'] / 0x2,
    f['position']['set'](f['params']['pX'], f['params']['pY'], f['params']['pZ']),
    f['rotation']['set'](f['params']['rX'], f['params']['rY'], f['params']['rZ']),
    f['build_handle']();
}
,
Door_new['prototype']['build_coupe'] = function() {
    var f = this
      , g = f['params']['width']
      , h = f['params']['height']
      , j = f['params']['thickness']
      , k = f['params']['style']
      , l = {
        'left': {
            'model': '/common_assets/models/other_models/profil_ruchka_kupe_v1.fbx',
            'offset': {
                'x': 0x8
            },
            'size': {
                'x': 0x1a,
                'z': 0x2a
            }
        },
        'right': {
            'model': '/common_assets/models/other_models/profil_ruchka_kupe_v1_r.fbx',
            'offset': {
                'x': 0x8
            },
            'size': {
                'x': 0x1a,
                'z': 0x2a
            }
        },
        'top': {
            'model': '/common_assets/models/other_models/profil_verh.fbx',
            'offset': {
                'y': 0x8
            },
            'size': {
                'y': 0x16,
                'z': 0x17
            }
        },
        'bottom': {
            'model': '/common_assets/models/other_models/profil_niz.fbx',
            'offset': {
                'y': 0x9
            },
            'size': {
                'y': 0x39,
                'z': 0x17
            }
        }
    }
      , m = (f['left_profile'] = new Model_new({
        'model': l['left']['model'],
        'immediate_load': 0x1,
        'variants': [{
            'width': l['left']['size']['x'],
            'height': f['params']['height'],
            'depth': l['left']['size']['z']
        }]
    }),
    f['left_profile']['position']['x'] = l['left']['size']['x'] / units / 0x2,
    f['left_profile']['position']['z'] = f['params']['thickness'] / units / 0x2,
    f['add'](f['left_profile']),
    f['right_profile'] = new Model_new({
        'model': l['right']['model'],
        'immediate_load': 0x1,
        'variants': [{
            'width': l['right']['size']['x'],
            'height': f['params']['height'],
            'depth': l['right']['size']['z']
        }]
    }),
    f['right_profile']['position']['x'] = f['params']['width'] / units - l['left']['size']['x'] / units / 0x2,
    f['right_profile']['position']['z'] = f['params']['thickness'] / units / 0x2,
    f['add'](f['right_profile']),
    f['top_profile'] = new Model_new({
        'model': l['top']['model'],
        'immediate_load': 0x1,
        'variants': [{
            'width': f['params']['width'],
            'height': l['top']['size']['y'],
            'depth': l['top']['size']['z']
        }]
    }),
    f['top_profile']['position']['x'] = f['params']['width'] / units / 0x2,
    f['top_profile']['position']['y'] = f['params']['height'] / units - l['top']['size']['y'] / units,
    f['top_profile']['position']['z'] = f['params']['thickness'] / units / 0x2,
    f['add'](f['top_profile']),
    f['bottom_profile'] = new Model_new({
        'model': l['bottom']['model'],
        'immediate_load': 0x1,
        'variants': [{
            'width': f['params']['width'] - 0x1,
            'height': l['bottom']['size']['y'],
            'depth': l['bottom']['size']['z']
        }]
    }),
    f['bottom_profile']['position']['x'] = f['params']['width'] / units / 0x2,
    f['bottom_profile']['position']['z'] = f['params']['thickness'] / units / 0x2,
    f['add'](f['bottom_profile']),
    f['params']['height'] - l['top']['size']['y'] - l['bottom']['size']['y'] + l['top']['offset']['y'] + l['bottom']['offset']['y']);
    f['facade'] = new Facade_new({
        'parent': f,
        'facade': f['params']['facade'],
        'width': f['params']['width'] - l['left']['size']['x'] - l['right']['size']['x'] + l['left']['offset']['x'] + l['right']['offset']['x'],
        'height': m,
        'thickness': f['params']['thickness'],
        'style': f['params']['style'][0x0],
        'fixed_model': f['params']['fixed_facade_model'],
        'material': f['params']['material'][0x0],
        'material_rotated': f['params']['material_rotated'],
        'glass_material': f['params']['glass_material'],
        'no_handle_group': f['params']['no_handle_group'],
        'facade_type': f['params']['facade_type'],
        'group': f['params']['group'],
        'flip': f['params']['flip'],
        'is_double': f['params']['is_double'],
        'is_triple': f['params']['is_triple'],
        'pX': f['params']['width'] / units - f['params']['hinges_offset'] / 0x2 / units,
        'pZ': f['params']['thickness'] / 0x2 / units,
        'pY': m / units / 0x2 + l['bottom']['size']['y'] / units - l['bottom']['offset']['y'] / units
    }),
    f['add'](f['facade']),
    f['facade']['model']['position']['x'] = -f['params']['width'] / 0x2 / units + f['params']['hinges_offset'] / 0x2 / units,
    f['position']['set'](f['params']['pX'], f['params']['pY'], f['params']['pZ']),
    f['rotation']['set'](f['params']['rX'], f['params']['rY'], f['params']['rZ']),
    setTimeout(function() {
        f['userData']['c_init_pos'] = f['position']['x'];
    }, 0xc8),
    f['build_handle']();
}
,
Door_new['prototype']['build_slide'] = function() {}
,
Door_new['prototype']['build_handle'] = function(e) {
    let f = this;
    if ('falsefacade' !== this['params']['type'] && 'coupe_l' !== this['params']['type'] && 'coupe_r' !== this['params']['type']) {
        if (!this['params']['no_handle_forced'] && 0x0 != facades_lib['get_item'](this['params']['facade'])['handle'])
            return 0x1 === this['params']['gola'] && 0x1 != project_settings['handle'][this['params']['group']]['no_handle'] ? !0x1 === this['params']['handle_active'] ? void 0x0 : ((e = e || f['params']['handle_model'])['size_index'] = f['params']['handle_size_index'],
            e['width'] = f['params']['width'],
            e['model_type'] = f['params']['handle_model_type'],
            f['handle'] = new Handle(e),
            'common' === f['params']['handle_model_type'] && f['handle']['position']['set'](f['params']['width'] / units / 0x2, f['params']['height'] / units + 0x19 / units - e['sizes'][0x0]['height'] / units / 0x2 + 1.7, -e['sizes'][0x0]['depth'] / units / 0x2),
            'model_top_module' === f['params']['handle_model_type'] && f['handle']['position']['set'](f['params']['width'] / units / 0x2, e['sizes_top_module']['height'] / units / 0x2 - 0.025, -e['sizes_top_module']['depth'] / units / 0x2 - 0x6 / units),
            'model_tabletop' === f['params']['handle_model_type'] && ('simple_bottom' === f['params']['type'] ? f['handle']['position']['set'](f['params']['width'] / units / 0x2, f['params']['height'] / units * 0x2 - 0.36, -e['sizes_tabletop']['depth'] / units / 0x2) : f['handle']['position']['set'](f['params']['width'] / units / 0x2, f['params']['height'] / units + 0x19 / units - e['sizes_tabletop']['height'] / units / 0x2, -e['sizes_tabletop']['depth'] / units / 0x2)),
            f['add'](f['handle']),
            void setTimeout(function() {
                f['handle']['load_model']();
            }, 0x64)) : void ('none' !== this['params']['handle_model'] && !0x1 !== this['params']['handle_active'] && (0x1 == project_settings['handle'][this['params']['group']]['no_handle'] ? f['handle'] && (f['reset_model'](f['handle']),
            f['facade']['remove'](f['handle'])) : (f['handle'] && (f['reset_model'](f['handle']),
            f['facade']['remove'](f['handle'])),
            (e = e || f['params']['handle_model'])['size_index'] = f['params']['handle_size_index'],
            'facade_profile' !== this['params']['handle_model']['type'] && 'overhead_profile' != this['params']['handle_model']['type'] || (e['width'] = f['params']['width'] - 0x2 * f['params']['facade_offset'],
            e['type'] = this['params']['handle_model']['type']),
            f['handle'] = new Handle(e),
            f['facade']['add'](f['handle']),
            f['set_handle_position'](!0x0),
            setTimeout(function() {
                f['handle']['load_model']();
            }, 0x64))));
        f['handle'] && (f['reset_model'](f['handle']),
        f['facade']['remove'](f['handle']));
    }
}
,
Door_new['prototype']['set_handle_position_ltr'] = function(e) {
    var f = this;
    if ('facade_profile' === f['params']['handle_model']['type'] && ('bottom' === f['params']['group'] && 'top' === f['params']['handle_position'] ? f['handle']['position']['set'](-f['params']['width'] / units / 0x2 + f['params']['hinges_offset'] / units / 0x2, f['params']['height'] / units / 0x2 - f['params']['handle_model']['sizes'][0x0]['offset_y'] / units - f['params']['facade_offset'] / units, 0x0) : (f['handle']['rotation']['z'] = Math['PI'],
    f['handle']['position']['set'](-f['params']['width'] / units / 0x2 + f['params']['hinges_offset'] / units / 0x2, -f['params']['height'] / units / 0x2 + f['params']['handle_model']['sizes'][0x0]['offset_y'] / units + f['params']['facade_offset'] / units, 0x0))),
    'common' === f['params']['handle_model']['type']) {
        if (this['params']['radius'])
            return void this['set_handle_position_ltr_radius']();
        if (this['params']['inner_radius'])
            return void this['set_handle_position_ltr_inner_radius']();
        'vertical' === f['params']['handle_orientation'] ? (f['handle']['rotation']['z'] = Math['PI'] / 0x2,
        'top' === f['params']['handle_position'] ? f['handle']['position']['set'](-f['params']['width'] / units + f['params']['handle_offset'] / units + f['params']['hinges_offset'] / 0x2 / units, f['params']['height'] / units / 0x2 - f['handle']['params']['width'] / units / 0x2 - f['params']['handle_offset'] / units, f['params']['thickness'] / units / 0x2 + f['handle']['params']['depth'] / units / 0x2) : 'bottom' === f['params']['handle_position'] ? (f['handle']['position']['set'](-f['params']['width'] / units + f['params']['handle_offset'] / units + f['params']['hinges_offset'] / 0x2 / units, -f['params']['height'] / units / 0x2 + f['handle']['params']['width'] / units / 0x2 + f['params']['handle_offset'] / units, f['params']['thickness'] / units / 0x2 + f['handle']['params']['depth'] / units / 0x2),
        f['params']['is_double'] && (f['handle']['position']['y'] += facades_lib['get_item'](f['params']['facade'])['double_offset'] / units)) : f['handle']['position']['set'](-f['params']['width'] / units + f['params']['handle_offset'] / units + f['params']['hinges_offset'] / 0x2 / units, 0x0, f['params']['thickness'] / units / 0x2 + f['handle']['params']['depth'] / units / 0x2)) : (f['handle']['rotation']['z'] = 0x0,
        'top' === f['params']['handle_position'] ? f['handle']['position']['set'](-f['facade']['params']['width'] / units / 0x2 + f['params']['hinges_offset'] / 0x2 / units, f['params']['height'] / units / 0x2 - f['handle']['params']['depth'] / units / 0x2 - f['params']['handle_offset'] / units, f['params']['thickness'] / units / 0x2 + f['handle']['params']['depth'] / units / 0x2) : f['handle']['position']['set'](-f['facade']['params']['width'] / units / 0x2 + f['params']['hinges_offset'] / 0x2 / units, -f['params']['height'] / units / 0x2 + f['handle']['params']['depth'] / units / 0x2 + f['params']['handle_offset'] / units, f['params']['thickness'] / units / 0x2 + f['handle']['params']['depth'] / units / 0x2));
    }
    'overhead' !== f['params']['handle_model']['type'] && 'overhead_profile' != f['params']['handle_model']['type'] || ('bottom' !== f['params']['group'] || 0x48 < f['params']['pY'] || 'reversed' == f['params']['facade_type'] ? (f['handle']['rotation']['z'] = Math['PI'],
    f['handle']['position']['set'](-f['params']['width'] / units / 0x2 + 0x4 * f['params']['facade_offset'] / units, -f['params']['height'] / units / 0x2 + f['params']['facade_offset'] / units, -f['params']['thickness'] / units / 0x2)) : f['handle']['position']['set'](-f['params']['width'] / units / 0x2 + 0x4 * f['params']['facade_offset'] / units, f['params']['height'] / units / 0x2 - f['params']['facade_offset'] / units, -f['params']['thickness'] / units / 0x2));
}
,
Door_new['prototype']['set_handle_position_rtl'] = function(f) {
    var g = this;
    if ('facade_profile' === g['params']['handle_model']['type'] && ('bottom' === g['params']['group'] && 'top' === g['params']['handle_position'] ? g['handle']['position']['set'](g['params']['width'] / units / 0x2 - g['params']['hinges_offset'] / units / 0x2, g['params']['height'] / units / 0x2 - g['params']['handle_model']['sizes'][0x0]['offset_y'] / units - g['params']['facade_offset'] / units, 0x0) : (g['handle']['rotation']['z'] = Math['PI'],
    g['handle']['position']['set'](g['params']['width'] / units / 0x2 - g['params']['hinges_offset'] / units / 0x2, -g['params']['height'] / units / 0x2 + g['params']['handle_model']['sizes'][0x0]['offset_y'] / units + g['params']['facade_offset'] / units, 0x0))),
    'common' === g['params']['handle_model']['type']) {
        if (this['params']['radius'])
            return void this['set_handle_position_rtl_radius']();
        if (this['params']['inner_radius'])
            return void this['set_handle_position_rtl_inner_radius']();
        var h = g['params']['thickness'] / units / 0x2 + g['handle']['params']['depth'] / units / 0x2
          , h = g['params']['thickness'] / units / 0x2 + g['handle']['params']['depth'] / units / 0x2;
        'vertical' === g['params']['handle_orientation'] ? (g['handle']['rotation']['z'] = Math['PI'] / 0x2,
        'top' === g['params']['handle_position'] ? g['handle']['position']['set'](g['params']['width'] / units - g['params']['handle_offset'] / units - g['params']['hinges_offset'] / 0x2 / units, g['params']['height'] / units / 0x2 - g['handle']['params']['width'] / units / 0x2 - g['params']['handle_offset'] / units, h) : 'bottom' === g['params']['handle_position'] ? (g['handle']['position']['set'](g['params']['width'] / units - g['params']['handle_offset'] / units - g['params']['hinges_offset'] / 0x2 / units, -g['params']['height'] / units / 0x2 + g['handle']['params']['width'] / units / 0x2 + g['params']['handle_offset'] / units, h),
        g['params']['is_double'] && (g['handle']['position']['y'] += facades_lib['get_item'](g['params']['facade'])['double_offset'] / units)) : g['handle']['position']['set'](g['params']['width'] / units - g['params']['handle_offset'] / units - g['params']['hinges_offset'] / 0x2 / units, 0x0, h)) : (g['handle']['rotation']['z'] = 0x0,
        'top' === g['params']['handle_position'] ? g['handle']['position']['set'](g['facade']['params']['width'] / units / 0x2 - g['params']['hinges_offset'] / 0x2 / units, g['params']['height'] / units / 0x2 - g['handle']['params']['depth'] / units / 0x2 - g['params']['handle_offset'] / units, h) : 'bottom' === g['params']['handle_position'] ? g['handle']['position']['set'](g['facade']['params']['width'] / units / 0x2 - g['params']['hinges_offset'] / 0x2 / units, -g['params']['height'] / units / 0x2 + g['handle']['params']['depth'] / units / 0x2 + g['params']['handle_offset'] / units, h) : g['handle']['position']['set'](g['facade']['params']['width'] / units / 0x2 - g['params']['hinges_offset'] / 0x2 / units, g['handle']['params']['depth'] / units / 0x2 + g['params']['handle_offset'] / units, h));
    }
    'overhead' !== g['params']['handle_model']['type'] && 'overhead_profile' != g['params']['handle_model']['type'] || ('bottom' !== g['params']['group'] || 0x48 < g['params']['pY'] || 'reversed' == g['params']['facade_type'] ? (g['handle']['rotation']['z'] = Math['PI'],
    g['handle']['position']['set'](g['params']['width'] / units / 0x2 - 0x4 * g['params']['facade_offset'] / units, -g['params']['height'] / units / 0x2 + g['params']['facade_offset'] / units, -g['params']['thickness'] / units / 0x2)) : g['handle']['position']['set'](g['params']['width'] / units / 0x2 - 0x4 * g['params']['facade_offset'] / units, g['params']['height'] / units / 0x2 - g['params']['facade_offset'] / units, -g['params']['thickness'] / units / 0x2));
}
,
Door_new['prototype']['set_handle_position_simple_top'] = function(e) {
    var f = this;
    'facade_profile' === f['params']['handle_model']['type'] && (f['handle']['rotation']['z'] = Math['PI'],
    f['handle']['position']['set'](0x0, -f['params']['height'] / units + f['params']['handle_model']['sizes'][0x0]['offset_y'] / units + f['params']['facade_offset'] / units + f['params']['hinges_offset'] / units / 0x2, 0x0)),
    'common' === f['params']['handle_model']['type'] && (f['params']['handle_orientation'] = 'horizontal',
    f['handle']['rotation']['z'] = 0x0,
    f['handle']['position']['set'](f['params']['hinges_offset'] / 0x2 / units, -f['params']['height'] / units + f['handle']['params']['depth'] / units / 0x2 + f['params']['handle_offset'] / units + f['params']['hinges_offset'] / units / 0x2, f['params']['thickness'] / units + f['handle']['params']['height'] / units / 0x2)),
    'overhead' !== f['params']['handle_model']['type'] && 'overhead_profile' != f['params']['handle_model']['type'] || (f['handle']['rotation']['z'] = Math['PI'],
    f['handle']['position']['set'](0x0, -f['params']['height'] / units + f['params']['facade_offset'] / units + f['params']['hinges_offset'] / units / 0x2, -f['params']['thickness'] / units / 0x2));
}
,
Door_new['prototype']['set_handle_position_front_top'] = function(e) {
    var f = this;
    'facade_profile' === f['params']['handle_model']['type'] && (f['handle']['rotation']['z'] = Math['PI'],
    f['handle']['position']['set'](0x0, -f['params']['height'] / units + f['params']['handle_model']['sizes'][0x0]['offset_y'] / units + f['params']['facade_offset'] / units + f['params']['hinges_offset'] / units / 0x2, 0x0)),
    'common' === f['params']['handle_model']['type'] && (f['params']['handle_orientation'] = 'horizontal',
    f['handle']['rotation']['z'] = 0x0,
    f['handle']['position']['set'](f['params']['hinges_offset'] / 0x2 / units, -f['params']['height'] / units + f['handle']['params']['depth'] / units / 0x2 + f['params']['handle_offset'] / units + f['params']['hinges_offset'] / units / 0x2, f['params']['thickness'] / units + f['handle']['params']['height'] / units / 0x2)),
    'overhead' !== f['params']['handle_model']['type'] && 'overhead_profile' != f['params']['handle_model']['type'] || (f['handle']['rotation']['z'] = Math['PI'],
    f['handle']['position']['set'](0x0, -f['params']['height'] / units + f['params']['facade_offset'] / units + f['params']['hinges_offset'] / units / 0x2, -f['params']['thickness'] / units / 0x2));
}
,
Door_new['prototype']['set_handle_position_simple_bottom'] = function(e) {
    var f = this;
    'facade_profile' === f['params']['handle_model']['type'] && f['handle']['position']['set'](0x0, f['params']['height'] / units - f['params']['handle_model']['sizes'][0x0]['offset_y'] / units - f['params']['facade_offset'] / units + f['params']['hinges_offset'] / units / 0x2, 0x0),
    'common' === f['params']['handle_model']['type'] && (f['params']['handle_orientation'] = 'horizontal',
    f['handle']['rotation']['z'] = 0x0,
    f['handle']['position']['set'](f['params']['hinges_offset'] / 0x2 / units, f['params']['height'] / units - f['handle']['params']['depth'] / units / 0x2 - f['params']['handle_offset'] / units + f['params']['hinges_offset'] / units / 0x2, f['params']['thickness'] / units + f['handle']['params']['height'] / units / 0x2)),
    'overhead' !== f['params']['handle_model']['type'] && 'overhead_profile' != f['params']['handle_model']['type'] || f['handle']['position']['set'](0x0, f['params']['height'] / units + f['params']['hinges_offset'] / units / 0x2 - f['params']['facade_offset'] / units, -f['params']['thickness'] / units / 0x2);
}
,
Door_new['prototype']['set_handle_position_double_top'] = function(e) {
    var f = this;
    'facade_profile' === f['params']['handle_model']['type'] && (f['handle']['rotation']['z'] = Math['PI'],
    f['handle']['position']['set'](0x0, -f['params']['height'] / units / 0x2 + f['params']['handle_model']['sizes'][0x0]['offset_y'] / units + f['params']['facade_offset'] / units + f['params']['hinges_offset'] / units / 0x2, 0x0)),
    'common' === f['params']['handle_model']['type'] && (f['params']['handle_orientation'] = 'horizontal',
    f['handle']['rotation']['z'] = 0x0,
    f['handle']['position']['set'](f['params']['hinges_offset'] / 0x2 / units, -f['params']['height'] / units / 0x2 + f['handle']['params']['depth'] / units / 0x2 + f['params']['handle_offset'] / units + f['params']['hinges_offset'] / units / 0x2, f['params']['thickness'] / units / 0x2 + f['handle']['params']['depth'] / units / 0x2)),
    'overhead' !== f['params']['handle_model']['type'] && 'overhead_profile' != f['params']['handle_model']['type'] || (f['handle']['rotation']['z'] = Math['PI'],
    f['handle']['position']['set'](0x0, -f['params']['height'] / units / 0x2 + f['params']['hinges_offset'] / units / 0x2 + f['params']['facade_offset'] / units, -f['params']['thickness'] / units / 0x2));
}
,
Door_new['prototype']['set_handle_position_ltr_radius'] = function() {
    var e, f;
    0x0 != this['params']['radius_type'] ? this['set_handle_position_ltr_radius_f']() : ((e = this)['handle']['rotation']['z'] = Math['PI'] / 0x2,
    e['handle']['rotation']['y'] = -Math['PI'] / 0x4,
    f = new THREE['Box3']()['setFromObject'](this['facade'])['getSize'](new THREE['Vector3']()),
    e['handle']['position']['x'] = 0x3 - Math['sqrt'](f['x'] * f['x'] + f['z'] * f['z']) + e['params']['hinges_offset'] / 0x2 / units - 1.5,
    e['handle']['position']['z'] = e['handle']['params']['depth'] / units / 0x2 + e['params']['thickness'] / units + 1.5,
    'top' === e['params']['handle_position'] ? e['handle']['position']['y'] = e['params']['height'] / units / 0x2 - e['handle']['params']['width'] / units / 0x2 - 2.5 : e['handle']['position']['y'] = -e['params']['height'] / units / 0x2 + e['handle']['params']['width'] / units / 0x2 + 2.5);
}
,
Door_new['prototype']['set_handle_position_ltr_radius_f'] = function() {
    var e = this
      , f = (e['handle']['rotation']['z'] = Math['PI'] / 0x2,
    new THREE['Box3']()['setFromObject'](this['facade'])['getSize'](new THREE['Vector3']()));
    e['handle']['position']['x'] = 2.5 - f['x'] + 2.5,
    e['handle']['position']['z'] = f['z'] + e['handle']['params']['depth'] / units / 0x2 + e['params']['thickness'] / units / 0x2,
    'top' === e['params']['handle_position'] ? e['handle']['position']['y'] = e['params']['height'] / units / 0x2 - e['handle']['params']['width'] / units / 0x2 - 2.5 : e['handle']['position']['y'] = -e['params']['height'] / units / 0x2 + e['handle']['params']['width'] / units / 0x2 + 2.5;
}
,
Door_new['prototype']['set_handle_position_rtl_radius'] = function() {
    var e, f;
    0x0 != this['params']['radius_type'] ? this['set_handle_position_rtl_radius_f']() : ((e = this)['handle']['rotation']['z'] = Math['PI'] / 0x2,
    e['handle']['rotation']['y'] = Math['PI'] / 0x4,
    f = new THREE['Box3']()['setFromObject'](this['facade']['model'])['getSize'](new THREE['Vector3']()),
    e['handle']['position']['x'] = Math['sqrt'](f['x'] * f['x'] + f['z'] * f['z']) - 0x3 - e['params']['hinges_offset'] / 0x2 / units + 2.5,
    e['handle']['position']['z'] = e['handle']['params']['depth'] / units + e['params']['thickness'] / units - 0.5,
    'top' === e['params']['handle_position'] ? e['handle']['position']['y'] = e['params']['height'] / units / 0x2 - e['handle']['params']['width'] / units / 0x2 - 2.5 : e['handle']['position']['y'] = -e['params']['height'] / units / 0x2 + e['handle']['params']['width'] / units / 0x2 + 2.5);
}
,
Door_new['prototype']['set_handle_position_rtl_radius_f'] = function() {
    var e = this
      , f = (e['handle']['rotation']['z'] = Math['PI'] / 0x2,
    new THREE['Box3']()['setFromObject'](this['facade']['model'])['getSize'](new THREE['Vector3']()));
    e['handle']['position']['x'] = f['x'] - 2.5 - 2.5,
    e['handle']['position']['z'] = f['z'] + e['handle']['params']['depth'] / units / 0x2 + e['params']['thickness'] / units / 0x2,
    'top' === e['params']['handle_position'] ? e['handle']['position']['y'] = e['params']['height'] / units / 0x2 - e['handle']['params']['width'] / units / 0x2 - 2.5 : e['handle']['position']['y'] = -e['params']['height'] / units / 0x2 + e['handle']['params']['width'] / units / 0x2 + 2.5;
}
,
Door_new['prototype']['set_handle_position_ltr_inner_radius'] = function() {
    var e = this
      , f = (e['handle']['rotation']['z'] = Math['PI'] / 0x2,
    e['handle']['rotation']['y'] = Math['PI'] / 0x4,
    new THREE['Box3']()['setFromObject'](this['facade'])['getSize'](new THREE['Vector3']()));
    e['handle']['position']['x'] = 0x3,
    e['handle']['position']['z'] = -0x0,
    'top' === e['params']['handle_position'] ? e['handle']['position']['y'] = e['params']['height'] / units / 0x2 - e['handle']['params']['width'] / units / 0x2 - 2.5 : e['handle']['position']['y'] = -e['params']['height'] / units / 0x2 + e['handle']['params']['width'] / units / 0x2 + 2.5;
}
,
Door_new['prototype']['set_handle_position_rtl_inner_radius'] = function() {
    var e = this
      , f = (e['handle']['rotation']['z'] = Math['PI'] / 0x2,
    e['handle']['rotation']['y'] = -Math['PI'] / 0x4,
    new THREE['Box3']()['setFromObject'](this['facade'])['getSize'](new THREE['Vector3']()));
    e['handle']['position']['x'] = Math['sqrt'](e['params']['width'] / units * e['params']['width'] / units + e['params']['width'] / units * e['params']['width'] / units) - 0x5,
    e['handle']['position']['z'] = -0x2,
    'top' === e['params']['handle_position'] ? e['handle']['position']['y'] = e['params']['height'] / units / 0x2 - e['handle']['params']['width'] / units / 0x2 - 0x3 : e['handle']['position']['y'] = -e['params']['height'] / units / 0x2 + e['handle']['params']['width'] / units / 0x2 + 0x3;
}
,
Door_new['prototype']['set_handle_position_corner_90_ltr'] = function(e) {
    var f = this;
    'facade_profile' !== f['params']['handle_model']['type'] && 'overhead_profile' != f['params']['handle_model']['type'] || ('bottom' !== f['params']['group'] || 0x53 < f['params']['pY'] ? (f['handle']['rotation']['z'] = Math['PI'],
    f['handle']['position']['set'](-f['params']['width'] / units / 0x2 + f['params']['hinges_offset'] / units / 0x2, -f['params']['height'] / units / 0x2 + f['params']['handle_model']['sizes'][0x0]['offset_y'] / units + f['params']['facade_offset'] / units, 0x0)) : f['handle']['position']['set'](-f['params']['width'] / units / 0x2 + f['params']['hinges_offset'] / units / 0x2, f['params']['height'] / units / 0x2 - f['params']['handle_model']['sizes'][0x0]['offset_y'] / units - f['params']['facade_offset'] / units, 0x0)),
    'common' === f['params']['handle_model']['type'] && (this['params']['radius'] ? this['set_handle_position_ltr_radius']() : this['params']['inner_radius'] ? this['set_handle_position_ltr_inner_radius']() : 'vertical' === f['params']['handle_orientation'] ? (f['handle']['rotation']['z'] = Math['PI'] / 0x2,
    'top' === f['params']['handle_position'] ? f['handle']['position']['set'](-f['params']['width'] / units + f['params']['handle_offset'] / units + f['params']['hinges_offset'] / 0x2 / units, f['params']['height'] / units / 0x2 - f['handle']['params']['width'] / units / 0x2 - f['params']['handle_offset'] / units, f['params']['thickness'] / units + f['handle']['params']['height'] / units / 0x2) : 'bottom' === f['params']['handle_position'] ? f['handle']['position']['set'](-f['params']['width'] / units + f['params']['handle_offset'] / units + f['params']['hinges_offset'] / 0x2 / units, -f['params']['height'] / units / 0x2 + f['handle']['params']['width'] / units / 0x2 + f['params']['handle_offset'] / units, f['params']['thickness'] / units / 0x2 + f['handle']['params']['depth'] / units / 0x2) : f['handle']['position']['set'](-f['params']['width'] / units + f['params']['handle_offset'] / units + f['params']['hinges_offset'] / 0x2 / units, 0x0, f['params']['thickness'] / units / 0x2 + f['handle']['params']['depth'] / units / 0x2)) : (f['handle']['rotation']['z'] = 0x0,
    'top' === f['params']['handle_position'] ? f['handle']['position']['set'](-f['facade']['params']['width'] / units / 0x2 + f['params']['hinges_offset'] / 0x2 / units, f['params']['height'] / units / 0x2 - f['handle']['params']['depth'] / units / 0x2 - f['params']['handle_offset'] / units, f['params']['thickness'] / units / 0x2 + f['handle']['params']['depth'] / units / 0x2) : f['handle']['position']['set'](-f['facade']['params']['width'] / units / 0x2 + f['params']['hinges_offset'] / 0x2 / units, -f['params']['height'] / units / 0x2 + f['handle']['params']['depth'] / units / 0x2 + f['params']['handle_offset'] / units, f['params']['thickness'] / units / 0x2 + f['handle']['params']['depth'] / units / 0x2)));
}
,
Door_new['prototype']['set_handle_position_corner_90_rtl'] = function(e) {
    var f = this;
    'facade_profile' !== f['params']['handle_model']['type'] && 'overhead_profile' != f['params']['handle_model']['type'] || ('bottom' !== f['params']['group'] || 0x53 < f['params']['pY'] ? (f['handle']['rotation']['z'] = Math['PI'],
    f['handle']['position']['set'](f['params']['width'] / units / 0x2 - f['params']['hinges_offset'] / units / 0x2, -f['params']['height'] / units / 0x2 + f['params']['handle_model']['sizes'][0x0]['offset_y'] / units + f['params']['facade_offset'] / units, 0x0)) : f['handle']['position']['set'](f['params']['width'] / units / 0x2 - f['params']['hinges_offset'] / units / 0x2, f['params']['height'] / units / 0x2 - f['params']['handle_model']['sizes'][0x0]['offset_y'] / units - f['params']['facade_offset'] / units, 0x0)),
    'common' === f['params']['handle_model']['type'] && (this['params']['radius'] ? this['set_handle_position_rtl_radius']() : this['params']['inner_radius'] ? this['set_handle_position_rtl_inner_radius']() : ('vertical' === f['params']['handle_orientation'] ? (f['handle']['rotation']['z'] = Math['PI'] / 0x2,
    'top' === f['params']['handle_position'] ? f['handle']['position']['set'](f['params']['width'] / units - f['params']['handle_offset'] / units - f['params']['hinges_offset'] / 0x2 / units, f['params']['height'] / units / 0x2 - f['handle']['params']['width'] / units / 0x2 - f['params']['handle_offset'] / units, f['params']['thickness'] / units / 0x2 + f['handle']['params']['depth'] / units / 0x2) : 'bottom' === f['params']['handle_position'] ? f['handle']['position']['set'](f['params']['width'] / units - f['params']['handle_offset'] / units - f['params']['hinges_offset'] / 0x2 / units, -f['params']['height'] / units / 0x2 + f['handle']['params']['width'] / units / 0x2 + f['params']['handle_offset'] / units, f['params']['thickness'] / units / 0x2 + f['handle']['params']['depth'] / units / 0x2) : f['handle']['position']['set'](f['params']['width'] / units - f['params']['handle_offset'] / units - f['params']['hinges_offset'] / 0x2 / units, 0x0, f['params']['thickness'] / units / 0x2 + f['handle']['params']['depth'] / units / 0x2)) : (f['handle']['rotation']['z'] = 0x0,
    'top' === f['params']['handle_position'] ? f['handle']['position']['set'](f['facade']['params']['width'] / units / 0x2 - f['params']['hinges_offset'] / 0x2 / units, f['params']['height'] / units / 0x2 - f['handle']['params']['depth'] / units / 0x2 - f['params']['handle_offset'] / units, f['params']['thickness'] / units / 0x2 + f['handle']['params']['depth'] / units / 0x2) : 'bottom' === f['params']['handle_position'] ? f['handle']['position']['set'](f['facade']['params']['width'] / units / 0x2 - f['params']['hinges_offset'] / 0x2 / units, -f['params']['height'] / units / 0x2 + f['handle']['params']['depth'] / units / 0x2 + f['params']['handle_offset'] / units, f['params']['thickness'] / units / 0x2 + f['handle']['params']['depth'] / units / 0x2) : f['handle']['position']['set'](f['facade']['params']['width'] / units / 0x2 - f['params']['hinges_offset'] / 0x2 / units, f['handle']['params']['depth'] / units / 0x2 + f['params']['handle_offset'] / units, f['params']['thickness'] / units / 0x2 + f['handle']['params']['depth'] / units / 0x2)),
    'corner_90_rtl' == f['params']['type'] && ('left' == f['cabinet']['params']['cabinet']['orientation'] ? f['handle']['position']['x'] = f['facade']['params']['width'] / units / 0x2 - f['params']['handle_offset'] / units - f['params']['hinges_offset'] / 0x2 / units : f['handle']['position']['x'] = f['facade']['params']['width'] / units / 0x2 - f['params']['handle_offset'] / units,
    'vertical' !== f['params']['handle_orientation']) && (f['handle']['position']['x'] = 0x0)));
}
,
Door_new['prototype']['change_facade_style'] = function(e) {
    this['facade']['change_style'](e),
    this['check_fixed_facade']();
}
,
Door_new['prototype']['before_animation'] = function() {}
,
Door_new['prototype']['click'] = function() {
    var f = this, g, h, j, k;
    if (!f['userData']['state']['is_moving'])
        switch (f['userData']['state']['is_moving'] = !0x0,
        'function' == typeof door_animation_callback && door_animation_callback(this),
        this['before_animation'](this),
        f['params']['type']) {
        case 'double_front':
            (0x0 === f['facade1']['rotation']['y'] ? (new TWEEN['Tween'](f['facade1']['rotation'])['to']({
                'y': f['rotation']['y'] - f['params']['rY'] - 0x5a * Math['PI'] / 0xb4
            }, 0x190)['start'](),
            new TWEEN['Tween'](f['facade2']['rotation'])['to']({
                'y': f['rotation']['y'] - f['params']['rY'] + 0x5a * Math['PI'] / 0xb4
            }, 0x190)['onComplete'](function() {
                f['userData']['state']['is_moving'] = !0x1;
            })) : (new TWEEN['Tween'](f['facade1']['rotation'])['to']({
                'y': f['rotation']['y'] - f['params']['rY'] - 0x5 * Math['PI'] / 0xb4
            }, 0x12c)['onComplete'](function() {
                new TWEEN['Tween'](f['facade1']['rotation'])['to']({
                    'y': f['rotation']['y'] - f['params']['rY']
                }, 0x258)['onComplete'](function() {
                    f['userData']['state']['is_moving'] = !0x1;
                })['start']();
            })['start'](),
            new TWEEN['Tween'](f['facade2']['rotation'])['to']({
                'y': f['rotation']['y'] - f['params']['rY'] + 0x5 * Math['PI'] / 0xb4
            }, 0x12c)['onComplete'](function() {
                new TWEEN['Tween'](f['facade2']['rotation'])['to']({
                    'y': f['rotation']['y'] - f['params']['rY']
                }, 0x258)['start']();
            })))['start']();
            break;
        case 'double_top':
            0x0 === f['facade2']['rotation']['x'] ? (g = new TWEEN['Tween'](f['facade2']['rotation'])['to']({
                'x': -1.6534
            }, 0x320)['onUpdate'](function(l) {
                f['facade']['position']['y'] = f['params']['height'] / units - f['params']['height'] / units / 0x2 * Math['cos'](this['_x']) + l * f['params']['hinges_offset'] / units / 0x2,
                f['facade']['position']['z'] = -f['params']['height'] / units / 0x2 * Math['sin'](this['_x']) + 0x3 * l * f['params']['hinges_offset'] / units / 0x2;
            }),
            h = new TWEEN['Tween'](f['facade']['rotation'])['to']({
                'x': Math['PI'] / 0x7
            }, 0x320),
            j = new TWEEN['Tween'](f['facade2']['rotation'])['to']({
                'x': -1.81514
            }, 0x190)['onUpdate'](function(l) {
                f['facade']['position']['y'] = f['params']['height'] / units - f['params']['height'] / units / 0x2 * Math['cos'](this['_x']) + f['params']['hinges_offset'] / units / 0x2 + l * f['params']['hinges_offset'] / units / 0x2,
                f['facade']['position']['z'] = -f['params']['height'] / units / 0x2 * Math['sin'](this['_x']) + 0x3 * f['params']['hinges_offset'] / units / 0x2 + 0x3 * l * f['params']['hinges_offset'] / units / 0x2;
            }),
            k = new TWEEN['Tween'](f['facade']['rotation'])['to']({
                'x': Math['PI'] / 0x6
            }, 0x190)['onComplete'](function() {
                f['userData']['state']['is_moving'] = !0x1;
            }),
            g['start']()['chain'](j),
            h['start']()['chain'](k)) : (g = new TWEEN['Tween'](f['facade2']['rotation'])['to']({
                'x': -0.1
            }, 0x320)['onUpdate'](function(l) {
                f['facade']['position']['y'] = f['params']['height'] / units - f['params']['height'] / units / 0x2 * Math['cos'](this['_x']) + (0x1 - l) * f['params']['hinges_offset'] / units,
                f['facade']['position']['z'] = -f['params']['height'] / units / 0x2 * Math['sin'](this['_x']) + 0x3 * (0x1 - l) * f['params']['hinges_offset'] / units;
            }),
            j = new TWEEN['Tween'](f['facade2']['rotation'])['to']({
                'x': 0x0
            }, 0x190)['onComplete'](function() {
                f['userData']['state']['is_moving'] = !0x1;
            })['onUpdate'](function(l) {
                f['facade']['position']['y'] = f['params']['height'] / units - f['params']['height'] / units / 0x2 * Math['cos'](this['_x']) - f['params']['hinges_offset'] / units / 0x2,
                f['facade']['position']['z'] = f['params']['thickness'] / 0x2 / units - f['params']['height'] / units / 0x2 * Math['sin'](this['_x']);
            }),
            h = new TWEEN['Tween'](f['facade']['rotation'])['to']({
                'x': 0x0
            }, 0x320),
            g['start']()['chain'](j),
            h['start']());
            break;
        case 'front_top':
            (f['facade']['position']['y'] === f['params']['height'] / units - f['params']['hinges_offset'] / 0x2 / units ? (g = new TWEEN['Tween'](f['facade']['position'])['to']({
                'z': f['params']['thickness'] / units * 0xa + f['params']['thickness'] / units
            }, 0x12c),
            h = new TWEEN['Tween'](f['facade']['position'])['to']({
                'y': f['params']['height'] / units * 0x2
            }, 0x1f4),
            j = new TWEEN['Tween'](f['facade']['position'])['to']({
                'z': f['params']['thickness'] / units * 0x9
            }, 0x3e8),
            k = new TWEEN['Tween'](f['facade']['position'])['to']({
                'y': f['params']['height'] / units * 0x2 + f['params']['thickness'] / units
            }, 0x190)['onComplete'](function() {
                f['userData']['state']['is_moving'] = !0x1;
            }),
            g['start']()['chain'](j),
            h['delay'](0x64)) : (g = new TWEEN['Tween'](f['facade']['position'])['to']({
                'z': f['params']['thickness'] / units * 0xa
            }, 0x12c),
            h = new TWEEN['Tween'](f['facade']['position'])['to']({
                'y': f['params']['height'] / units - f['params']['hinges_offset'] / 0x2 / units
            }, 0x258),
            j = new TWEEN['Tween'](f['facade']['position'])['to']({
                'z': f['params']['thickness'] / units * 0x2
            }, 0x12c),
            k = new TWEEN['Tween'](f['facade']['position'])['to']({
                'z': f['params']['thickness'] / 0x2 / units
            }, 0x3e8)['onComplete'](function() {
                f['userData']['state']['is_moving'] = !0x1;
            }),
            g['start']()['chain'](j),
            h['delay'](0x0)))['start']()['chain'](k);
            break;
        case 'ltr':
            (!0x0 === project_settings['hinges']['dovodchik'] ? 0x0 === f['facade']['rotation']['y'] ? new TWEEN['Tween'](f['facade']['rotation'])['to']({
                'y': 0x5a * Math['PI'] / 0xb4
            }, 0x190)['onComplete'](function() {
                f['userData']['state']['is_moving'] = !0x1;
            }) : new TWEEN['Tween'](f['facade']['rotation'])['to']({
                'y': 0x5 * Math['PI'] / 0xb4
            }, 0x12c)['onComplete'](function() {
                new TWEEN['Tween'](f['facade']['rotation'])['to']({
                    'y': 0x0
                }, 0x258)['onComplete'](function() {
                    f['userData']['state']['is_moving'] = !0x1;
                })['start']();
            }) : (0x0 === f['facade']['rotation']['y'] ? new TWEEN['Tween'](f['facade']['rotation'])['to']({
                'y': 0x5a * Math['PI'] / 0xb4
            }, 0x190) : new TWEEN['Tween'](f['facade']['rotation'])['to']({
                'y': 0x0
            }, 0x12c))['onComplete'](function() {
                f['userData']['state']['is_moving'] = !0x1;
            }))['start']();
            break;
        case 'rtl':
            (!0x0 === project_settings['hinges']['dovodchik'] ? 0x0 === f['facade']['rotation']['y'] ? new TWEEN['Tween'](f['facade']['rotation'])['to']({
                'y': -0x5a * Math['PI'] / 0xb4
            }, 0x190)['onComplete'](function() {
                f['userData']['state']['is_moving'] = !0x1;
            }) : new TWEEN['Tween'](f['facade']['rotation'])['to']({
                'y': -0x5 * Math['PI'] / 0xb4
            }, 0x12c)['onComplete'](function() {
                new TWEEN['Tween'](f['facade']['rotation'])['to']({
                    'y': 0x0
                }, 0x258)['onComplete'](function() {
                    f['userData']['state']['is_moving'] = !0x1;
                })['start']();
            }) : (0x0 === f['facade']['rotation']['y'] ? new TWEEN['Tween'](f['facade']['rotation'])['to']({
                'y': -0x5a * Math['PI'] / 0xb4
            }, 0x190) : new TWEEN['Tween'](f['facade']['rotation'])['to']({
                'y': 0x0
            }, 0x12c))['onComplete'](function() {
                f['userData']['state']['is_moving'] = !0x1;
            }))['start']();
            break;
        case 'simple_top':
            (0x0 === f['facade']['rotation']['x'] ? new TWEEN['Tween'](f['facade']['rotation'])['to']({
                'x': -0x64 * Math['PI'] / 0xb4
            }, 0x190)['onComplete'](function() {
                f['userData']['state']['is_moving'] = !0x1;
            }) : !0x0 === project_settings['hinges']['dovodchik'] ? new TWEEN['Tween'](f['facade']['rotation'])['to']({
                'x': -0x5 * Math['PI'] / 0xb4
            }, 0x12c)['onComplete'](function() {
                new TWEEN['Tween'](f['facade']['rotation'])['to']({
                    'x': 0x0
                }, 0x258)['onComplete'](function() {
                    f['userData']['state']['is_moving'] = !0x1;
                })['start']();
            }) : new TWEEN['Tween'](f['facade']['rotation'])['to']({
                'x': 0x0
            }, 0x190)['onComplete'](function() {
                f['userData']['state']['is_moving'] = !0x1;
            }))['start']();
            break;
        case 'angle_top':
            f['userData']['state']['is_moving'] = !0x0,
            f['userData']['state']['is_open'] ? (new TWEEN['Tween'](f['facade']['rotation'])['to']({
                'x': 0x0
            }, 0x190)['onComplete'](function() {
                f['userData']['state']['is_moving'] = !0x1,
                f['userData']['state']['is_open'] = !0x1;
            })['start'](),
            new TWEEN['Tween'](f['facade']['position'])['to']({
                'z': f['userData']['state']['starting_pos']['z'] + 0x3
            }, 0x190)['onComplete'](function() {
                f['userData']['state']['is_moving'] = !0x1,
                f['userData']['state']['is_open'] = !0x1;
            })['start'](),
            setTimeout(function() {
                new TWEEN['Tween'](f['facade']['position'])['to']({
                    'y': f['userData']['state']['starting_pos']['y']
                }, 0x190)['onComplete'](function() {
                    f['userData']['state']['is_moving'] = !0x1,
                    f['userData']['state']['is_open'] = !0x1;
                })['start'](),
                setTimeout(function() {
                    new TWEEN['Tween'](f['facade']['position'])['to']({
                        'z': f['userData']['state']['starting_pos']['z']
                    }, 0x190)['onComplete'](function() {})['start']();
                }, 0x12c);
            }, 0x64)) : (new TWEEN['Tween'](f['facade']['position'])['to']({
                'z': f['userData']['state']['starting_pos']['z'] + 0x3
            }, 0x12c)['onComplete'](function() {})['start'](),
            setTimeout(function() {
                new TWEEN['Tween'](f['facade']['position'])['to']({
                    'y': f['userData']['state']['starting_pos']['y'] + 0x8
                }, 0x190)['onComplete'](function() {
                    f['userData']['state']['is_moving'] = !0x1,
                    f['userData']['state']['is_open'] = !0x0;
                })['start'](),
                setTimeout(function() {
                    new TWEEN['Tween'](f['facade']['rotation'])['to']({
                        'x': -Math['PI'] / 2.4
                    }, 0x190)['onComplete'](function() {
                        f['userData']['state']['is_moving'] = !0x1,
                        f['userData']['state']['is_open'] = !0x0;
                    })['start'](),
                    new TWEEN['Tween'](f['facade']['position'])['to']({
                        'z': f['facade']['position']['z'] - 0xc
                    }, 0x190)['onComplete'](function() {
                        f['userData']['state']['is_moving'] = !0x1,
                        f['userData']['state']['is_open'] = !0x0;
                    })['start']();
                }, 0x64);
            }, 0xc8));
            break;
        case 'simple_bottom':
            (0x0 === f['facade']['rotation']['x'] ? new TWEEN['Tween'](f['facade']['rotation'])['to']({
                'x': 0x2d * Math['PI'] / 0xb4
            }, 0x190)['onComplete'](function() {
                f['userData']['state']['is_moving'] = !0x1;
            }) : !0x0 === project_settings['hinges']['dovodchik'] ? new TWEEN['Tween'](f['facade']['rotation'])['to']({
                'x': 0x5 * Math['PI'] / 0xb4
            }, 0x12c)['onComplete'](function() {
                new TWEEN['Tween'](f['facade']['rotation'])['to']({
                    'x': 0x0
                }, 0x258)['onComplete'](function() {
                    f['userData']['state']['is_moving'] = !0x1;
                })['start']();
            }) : new TWEEN['Tween'](f['facade']['rotation'])['to']({
                'x': 0x0
            }, 0x190)['onComplete'](function() {
                f['userData']['state']['is_moving'] = !0x1;
            }))['start']();
            break;
        case 'coupe_r':
            (f['position']['x'] === f['userData']['c_init_pos'] ? new TWEEN['Tween'](f['position'])['to']({
                'x': f['userData']['c_init_pos'] + f['params']['width'] / units - 0xf
            }, 0x190) : new TWEEN['Tween'](f['position'])['to']({
                'x': f['userData']['c_init_pos']
            }, 0x190))['onComplete'](function() {
                f['userData']['state']['is_moving'] = !0x1;
            })['start']();
            break;
        case 'coupe_l':
            (f['position']['x'] === f['userData']['c_init_pos'] ? new TWEEN['Tween'](f['position'])['to']({
                'x': f['userData']['c_init_pos'] - f['params']['width'] / units + 0xf
            }, 0x190) : new TWEEN['Tween'](f['position'])['to']({
                'x': f['userData']['c_init_pos']
            }, 0x190))['onComplete'](function() {
                f['userData']['state']['is_moving'] = !0x1;
            })['start']();
            break;
        default:
            break;
        }
}
,
Door_new['prototype']['change_material'] = function(e) {
    if (e['group'] || (e['group'] = this['params']['group']),
    e['material_key'] && 'gen' != e['material_key']) {
        this['params']['additional_materials'] || (this['params']['additional_materials'] = {}),
        this['params']['additional_materials'][e['material_key']] = e['id'];
        for (let f = 0x0; f < this['children']['length']; f++)
            'function' == typeof this['children'][f]['change_material'] && this['children'][f]['change_material'](e);
    } else {
        'all' !== e['group'] && this['params']['group'] !== e['group'] || (this['params']['material'] = [e['id'], e['id']],
        this['params']['material_rotated'] = e['rotated']);
        for (let g = 0x0; g < this['children']['length']; g++)
            'function' == typeof this['children'][g]['change_material'] && this['children'][g]['change_material'](e);
    }
    this['check_fixed_facade']();
}
,
Door_new['prototype']['edges_mode'] = PPObject['prototype']['edges_mode'],
Door_new['prototype']['edges_mode_traverse'] = PPObject['prototype']['edges_mode_traverse'],
Door_new['prototype']['change_material_v2'] = function(e) {}
,
Door_new['prototype']['change_material_new'] = function(e) {
    (e = e || {})['id'] || (e['id'] = 0x1),
    e['type'] || (e['type'] = 'gen');
    for (let f = 0x0; f < this['children']['length']; f++)
        'function' == typeof this['children'][f]['change_material_new'] && this['children'][f]['change_material_new'](e);
    this['params']['material'] = [e['id'], e['id']],
    this['check_fixed_facade']();
}
,
Door_new['prototype']['change_glass_material'] = function(e) {
    this['params']['glass_material'] = e;
    for (let f = 0x0; f < this['children']['length']; f++)
        'function' == typeof this['children'][f]['change_glass_material'] && this['children'][f]['change_glass_material'](e);
}
,
Door_new['prototype']['change_handle'] = function(f, g, h) {
    f = f || 0x0,
    g = g || 0x0;
    for (var j = handles_lib['get_item'](f), k = 0x0; k < j['sizes']['length']; k++)
        j['sizes'][k]['default'] = k === g;
    this['params']['handle_size_index'] = g,
    h && (this['params']['handle_orientation'] = h),
    this['build_handle'](j);
}
,
Door_new['prototype']['change_handle_size'] = function(e) {
    var f = this;
    f['handle'] && (f['handle']['set']['width_by_index'](e, !0x0),
    f['set_handle_position']());
}
,
Door_new['prototype']['change_handle_orientation'] = function(e) {
    this['build_handle']();
}
,
Door_new['prototype']['reset_model'] = function(f) {
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
Door_new['prototype']['has_glass'] = function() {
    let e = !0x1;
    return e = this['facade2'] ? this['facade']['has_glass']() || this['facade2']['has_glass']() : this['facade']['has_glass']();
}
,
Door_new['prototype']['reset_model'] = function(f) {
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
Door_new['prototype']['check_fixed_facade'] = function() {
    var f = facades_lib['items'][this['params']['facade']];
    if (f && f['fixed_sizes']) {
        var g = this['params']['style'][0x0];
        if (isNaN(parseInt(g)) && (g = 't_' + f['compatibility_types'][g],
        f['fixed_sizes'][g])) {
            var h, j, k = this['params']['width'] - 0x2 * this['params']['facade_offset'] + 'x' + (this['params']['height'] - 0x2 * this['params']['facade_offset']);
            if (f['fixed_sizes'][g][k]) {
                let q = f['fixed_sizes'][g][k]['code']
                  , u = 0x0;
                var l = materials_lib['items'][this['params']['material'][0x0]]['category']
                  , m = materials_lib['get_top_category'](l)['id']
                  , p = (f['fixed_sizes'][g][k]['categories']['c_' + l] && ('' != f['fixed_sizes'][g][k]['categories']['c_' + l]['code'] && (q = f['fixed_sizes'][g][k]['categories']['c_' + l]['code']),
                u = f['fixed_sizes'][g][k]['categories']['c_' + l]['price']),
                f['fixed_sizes'][g][k]['categories']['c_' + m] && ('' != f['fixed_sizes'][g][k]['categories']['c_' + m]['code'] && (q = f['fixed_sizes'][g][k]['categories']['c_' + m]['code']),
                u = f['fixed_sizes'][g][k]['categories']['c_' + m]['price']),
                this['params']['facade_code'] = q,
                this['params']['facade_price'] = parseFloat(u),
                this);
            }
        }
    }
}
;
class Handle extends THREE['Group'] {
    constructor(f) {
        super(f);
        var g = this, h, j;
        this['type'] = 'Handle',
        void 0x0 === (f = f || {})['code'] && ((h = handles_catalog['items'][0x0])['name'] || (h['name'] = ''),
        h['code'] || (h['code'] = '')),
        this['params'] = {
            'id': void 0x0 !== f['id'] ? f['id'] : 0x0,
            'model': (void 0x0 !== f['model'] ? f : h)['model'],
            'model_top_module': void 0x0 !== f['model_top_module'] ? f['model_top_module'] : '',
            'model_tabletop': void 0x0 !== f['model_tabletop'] ? f['model_tabletop'] : '',
            'size_type': void 0x0 !== f['size_type'] ? f['size_type'] : 'stretch_x',
            'material': (void 0x0 !== f['material'] ? f : h)['material'],
            'model_type': void 0x0 !== f['model_type'] ? f['model_type'] : 'common',
            'type': void 0x0 !== f['type'] ? f['type'] : 'common',
            'sizes': (void 0x0 !== f['sizes'] ? f : h)['sizes'],
            'is_gola': void 0x0 !== f['is_gola'] && f['is_gola'],
            'name': (void 0x0 !== f['name'] ? f : h)['name'],
            'code': (void 0x0 !== f['code'] ? f : h)['code'],
            'size_index': void 0x0 !== f['size_index'] ? f['size_index'] : void 0x0,
            'width': void 0x0 !== f['width'] ? f['width'] : 0xaf,
            'height': void 0x0 !== f['height'] ? f['height'] : 0x23,
            'depth': void 0x0 !== f['depth'] ? f['depth'] : 0xe,
            'pX': void 0x0 !== f['pX'] ? f['pX'] : 0x0,
            'pY': void 0x0 !== f['pY'] ? f['pY'] : 0x0,
            'pZ': void 0x0 !== f['pZ'] ? f['pZ'] : 0x0,
            'rX': void 0x0 !== f['rX'] ? f['rX'] : 0x0,
            'rY': void 0x0 !== f['rY'] ? f['rY'] : 0x0,
            'rZ': void 0x0 !== f['rZ'] ? f['rZ'] : 0x0
        },
        this['name'] = 'Handle',
        this['model'] = new THREE['Group'](),
        void 0x0 === this['params']['size_index'] && (this['params']['size_index'] = objectFindByKey(this['params']['sizes'], 'default', !0x0, !0x0),
        null === this['params']['size_index']) && (this['params']['size_index'] = 0x0),
        this['box'] = new THREE['Box3'](),
        this['build'] = function() {
            g['params']['is_gola'],
            'common' !== g['params']['type'] && 'overhead' != g['params']['type'] || g['set']['width_by_index'](g['params']['size_index'], !0x1),
            g['add'](make_edges(g['params']['width'] / units, g['params']['depth'] / units, g['params']['height'] / units)),
            g['position']['set'](g['params']['pX'], g['params']['pY'], g['params']['pZ']),
            g['rotation']['set'](g['params']['rX'], g['params']['rY'], g['params']['rZ']);
        }
        ,
        this['load_model'] = async function() {
            g['reset_model']();
            let k;
            'common' === g['params']['model_type'] && (k = g['params']['model']),
            'model_tabletop' === g['params']['model_type'] && (k = g['params']['model_tabletop']),
            -0x1 < (k = 'model_top_module' === g['params']['model_type'] ? g['params']['model_top_module'] : k)['indexOf']('broskokitchenplanner.com') && (k = k['replace']('https://broskokitchenplanner.com', 'https://planplace.ru'));
            for (var l = await load_model({
                'model': k,
                'buffer': !0x1
            }), m = 0x0; m < l['length']; m++) {
                var n = l[m]['clone']()
                  , p = new THREE['Mesh'](n,create_material(g['params']['material']));
                p['name'] = n['name'],
                p['castShadow'] = !0x0,
                p['receiveShadow'] = !0x0,
                p['userData']['edgesModeType'] = ObjectType['Handle'],
                g['model']['add'](p),
                g['add'](g['model']);
            }
            function q(r) {
                return 'Cabinet' === r['type'] ? r : q(r['parent']);
            }
            'common' === g['params']['type'] ? g['set']['width_by_index'](g['params']['size_index'], !0x0) : g['set']['width'](),
            'edges' === global_options['mode'] && this['edges_mode']();
        }
        ,
        this['set'] = {
            'width': function() {
                scene['add'](g['model']);
                var k, l = new THREE['Vector3'](g['params']['width'] / units,g['params']['height'] / units,g['params']['depth'] / units), m = box3['setFromObject'](g['model'])['getSize'](new THREE['Vector3']())['clone'](), k = l['clone']()['sub'](m)['divideScalar'](0x2), n = {
                    'box': m,
                    'diff': new THREE['Vector3'](g['params']['width'] / units,g['params']['height'] / units,g['params']['depth'] / units)['sub'](m)['divideScalar'](0x2),
                    'width': g['params']['width'] / units,
                    'height': g['params']['height'] / units,
                    'depth': g['params']['depth'] / units,
                    'is_handle': !0x0
                };
                for (let p = 0x0; p < g['model']['children']['length']; p++)
                    set_size_buff(g['model']['children'][p], g['model']['children'][p]['name'], n),
                    'common' === g['params']['type'] && correct_uv_buff(Model_utils['get_model_from_cache'](g['params']['model'])['geometry'][p], g['model']['children'][p]['geometry']),
                    g['model']['children'][p]['geometry']['attributes']['position']['needsUpdate'] = !0x0,
                    g['model']['children'][p]['geometry']['attributes']['uv'] && (g['model']['children'][p]['geometry']['attributes']['uv']['needsUpdate'] = !0x0);
                g['add'](g['model']);
            },
            'width_by_index': function(k, l) {
                g['params']['sizes'][k] ? (g['params']['width'] = g['params']['sizes'][k]['width'],
                g['params']['height'] = g['params']['sizes'][k]['height'],
                g['params']['depth'] = g['params']['sizes'][k]['depth'],
                g['params']['size_index'] = k) : (g['params']['width'] = g['params']['sizes'][g['params']['sizes']['length'] - 0x1]['width'],
                g['params']['height'] = g['params']['sizes'][g['params']['sizes']['length'] - 0x1]['height'],
                g['params']['depth'] = g['params']['sizes'][g['params']['sizes']['length'] - 0x1]['depth'],
                g['params']['size_index'] = g['params']['sizes']['length'] - 0x1),
                !0x0 === l && g['set']['width']();
            },
            'width_by_number': function(k) {
                g['params']['width'] = k,
                g['set']['width']();
            },
            'suitable_width': function(k) {
                if (g['params']['sizes'][g['params']['size_index']]['width'] < k - 0x8)
                    g['set']['width_by_index'](g['params']['size_index']);
                else {
                    for (var l = [], m = 0x0; m < g['params']['sizes']['length']; m++)
                        g['params']['sizes'][m]['index'] = m,
                        g['params']['sizes'][m]['width'] < k - 0x8 && l['push'](g['params']['sizes'][m]);
                    l['sort'](function(n, p) {
                        return p['width'] - n['width'];
                    }),
                    l['length'] && g['set']['width_by_index'](l[0x0]['index']);
                }
            }
        },