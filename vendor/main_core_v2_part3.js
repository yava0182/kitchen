       'Door' == f['type'] && (null != global_options['facade_mode']['facade'] && (f['cabinet']['params']['doors'][f['par_index']]['facade'] = global_options['facade_mode']['facade']),
        f['cabinet']['params']['doors'][f['par_index']]['style'] = global_options['facade_mode']['style'],
        0x0 != l && (f['cabinet']['params']['doors'][f['par_index']]['material'] = l),
        f['cabinet']['build_doors']()),
        'Locker' == f['type'] && (null != global_options['facade_mode']['facade'] && (f['cabinet']['params']['lockers'][f['par_index']]['facade'] = global_options['facade_mode']['facade']),
        f['cabinet']['params']['lockers'][f['par_index']]['style'] = global_options['facade_mode']['style'],
        0x0 != l && (f['cabinet']['params']['lockers'][f['par_index']]['material'] = l),
        f['cabinet']['build_lockers']());
    },
    'change_facade': function(f, g) {
        'string' == typeof g && (g = [g]),
        project_settings['selected_materials']['facades'] || (project_settings['selected_materials']['facades'] = {});
        let h = facades_lib['get_item'](f);
        var j = copy_object(project_settings['selected_materials']['facades'])
          , k = copy_object(project_settings['defaults']['facades']);
        let q = []
          , v = {};
        for (let F = g['length']; F--; ) {
            let G = g[F];
            if (project_settings['materials'][G] && (project_settings['models'][G] = f,
            project_settings['defaults']['facades'][G] = f,
            project_settings['materials'][G]['facades'] = copy_object(h['materials']),
            'object' == typeof project_settings['materials'][G]['back_wall_material'] && Object['keys'](project_settings['materials'][G]['back_wall_material'])['forEach'](function(H) {
                'facade' == project_settings['materials'][G]['back_wall_material'][H]['mode'] && (project_settings['materials'][G]['back_wall_material'][H]['materials'] = copy_object(project_settings['materials'][G]['facades']));
            }),
            void 0x0 !== project_settings['selected_materials'][G]['facades'])) {
                var w = materials_lib['get_top_category_by_material'](project_settings['selected_materials'][G]['facades']);
                let H = 0x0;
                for (let I = 0x0; I < project_settings['materials'][G]['facades']['length']; I++)
                    w['id'] == project_settings['materials'][G]['facades'][I] && (H = 0x1);
                0x0 === H && (project_settings['selected_materials'][G]['facades'] = materials_lib['get_first_item'](project_settings['materials'][G]['facades'][0x0])['id']);
            }
        }
        Object['keys'](project_settings['models'])['forEach'](function(J) {
            v[project_settings['models'][J]] || (v[project_settings['models'][J]] = 0x1);
        }),
        Object['keys'](project_settings['selected_materials']['facades'])['forEach'](function(J) {
            v[J] || q['push'](J);
        }),
        project_settings['selected_materials']['facades'][f] || (project_settings['selected_materials']['facades'][f] = {
            'gen': {
                'top': 0x0,
                'bottom': 0x0
            }
        });
        var x = h['materials'];
        for (let J = g['length']; J--; ) {
            var y = g[J], z, A, z;
            let K = 0x0, L;
            if (j[k[y]]) {
                L = j[k[y]]['gen'][y];
                for (let N = 0x0; N < x['length']; N++)
                    if (materials_lib['check_material_in_category'](L, x[N])) {
                        K = 0x1;
                        break;
                    }
            }
            K ? project_settings['selected_materials']['facades'][f]['gen'][y] = L : project_settings['selected_materials']['facades'][f]['gen'][y] = materials_lib['get_first_item'](x[0x0])['id'],
            constructor_settings['core_v2'] && (z = project_settings['kitchen']['defaults']['facades'],
            A = project_settings['selected_materials']['facades'][f]['gen'][y],
            z[y] || (z[y] = {
                'id': 0x0,
                'materials': {
                    'gen': 0x0
                }
            }),
            (z = z[y])['id'] = f,
            z['materials']['gen'] = A);
        }
        if (h['additional_materials'] && Object['keys'](h['additional_materials'])['forEach'](function(O) {
            project_settings['selected_materials']['facades'][f][O] = {},
            project_settings['selected_materials']['facades'][f][O]['top'] = copy_object(h['additional_materials'][O]['selected']),
            project_settings['selected_materials']['facades'][f][O]['bottom'] = copy_object(h['additional_materials'][O]['selected']);
        }),
        project_settings['defaults']['facades']['top'] != project_settings['defaults']['facades']['bottom']) {
            let O = project_settings['selected_materials']['facades'][project_settings['defaults']['facades']['top']]
              , P = project_settings['selected_materials']['facades'][project_settings['defaults']['facades']['bottom']];
            O && Object['keys'](O)['forEach'](function(Q) {
                O[Q]['bottom'] = O[Q]['top'];
            }),
            P && Object['keys'](P)['forEach'](function(Q) {
                P[Q]['top'] = P[Q]['bottom'];
            });
        }
        for (let Q = room['active_objects']['length'] - 0x1; 0x0 <= Q; Q--) {
            if ('module' === room['active_objects'][Q]['userData']['params']?.['type']) {
                var B = room['active_objects'][Q]
                  , C = B['userData']['params']['spec']['cabinet_tag'];
                if (!C || !g['includes'](C))
                    continue;
                let R = project_settings['selected_materials']['facades']?.[f]?.['gen']?.[C] || 0x0;
                var C = B['get_defaults_param']('facade.id'), C, D;
                B['set_defaults_param']('facade.id', parseInt(f)),
                !is_empty_id(C) && (C = B['get_defaults_param']('facade.materials.gen'),
                module_utils['can_change_facade_material'](f, C)) || B['set_defaults_param']('facade.materials.gen', parseInt(R)),
                module_utils['walk_params_tree'](B, (T, U) => {
                    U || 'module' !== T['type'] || (module_utils['set_defaults_param'](T, 'facade.id', parseInt(f)),
                    module_utils['set_defaults_param'](T, 'facade.materials.gen', parseInt(R)));
                }
                ),
                B['_build_defaults']();
                for (D of B['userData']['parts']['module'])
                    module_utils['set_defaults_param'](D, 'facade.id', parseInt(f)),
                    module_utils['set_defaults_param'](D, 'facade.materials.gen', parseInt(R)),
                    D['_build_defaults']();
                let S = !0x1;
                B['walk_params_tree'](T => {
                    if ('facade' === T['type'] && T['spec']['can_change']?.['id']) {
                        T['spec']['id'] = f;
                        let U = !0x0;
                        (U = isNaN(parseInt(T['spec']['type'])) && module_utils['get_facade_type'](T['spec']['id'], T['spec']['type']) ? !0x1 : U) && (T['spec']['type'] = 'full'),
                        T['spec']['materials'] && (T['spec']['materials']['gen'] = parseInt(R)),
                        S = !0x0;
                    }
                }
                ),
                S && B['_rebuild_parts_by_type']('facade');
            }
            if ('Cabinet' === room['active_objects'][Q]['type'])
                for (let T = 0x0; T < g['length']; T++) {
                    var E = g[T];
                    room['active_objects'][Q]['change_facade_style_new'](f, E, !0x0);
                }
            'Shelve' === room['active_objects'][Q]['type'] && room['active_objects'][Q]['build'](),
            'Facade' === room['active_objects'][Q]['type'] && room['active_objects'][Q]['build']();
        }
        for (let U = 0x0; U < q['length']; U++)
            delete project_settings['selected_materials']['facades'][q[U]];
        sc['get_price']();
    },
    'get_room_size': function() {
        return {
            'w': room['params']['width'],
            'h': room['params']['height'],
            'd': room['params']['depth']
        };
    },
    'set_room_size': function(f, g, h) {
        room['set_size'](f, g, h);
    },
    'set_walls_material': function(f) {
        change_walls_material(f['id']);
    },
    'set_floor_material': function(f) {
        room['set_material_floor'](f['id']);
    },
    'set_tabletop_material': function(f) {
        change_tabletop_material(f['id']);
    },
    'set_tabletop': function(f) {
        if (project_settings['defaults']['tabletop'] = f['id'],
        project_settings['defaults']['tabletop_variant'] = f['variant_id'],
        constructor_settings['core_v2']) {
            utils['nested_object']['set'](project_settings, 'kitchen.defaults.tabletop.id', f['id']),
            utils['nested_object']['set'](project_settings, 'kitchen.defaults.tabletop.variant_id', f['variant_id']);
            let D = pp['const']['vars']['tabletop_enabled'];
            var g = _['find'](pp['variables']['current'], E => E['key'] === D), g = (!g || 0x0 !== g['value'] && '0' !== g['value'] || sc['change_global_var'](pp['const']['vars']['tabletop_enabled'], 0x1, !0x1),
            project_settings['kitchen']['defaults']?.['tabletop']?.['id']), h, g = C(g, project_settings['kitchen']['defaults']?.['tabletop']?.['variant_id']);
            sc['change_global_var'](pp['const']['vars']['tabletop_height'], g, !0x0);
        }
        for (var j of d_objects)
            'Cabinet' === j['temp_type'] ? (j['params']['tabletop']['tabletop_id'] = f['id'],
            j['params']['tabletop']['tabletop_variant'] = f['variant_id']) : 'Bardesk' === j['temp_type'] && j['change_tabletop_material'](f['id']);
        for (let E = room['active_objects']['length']; E--; ) {
            var k = room['active_objects'][E];
            if (k['userData']['params'] && 'module' === k['userData']['params']['type']) {
                k['set_defaults_param']('tabletop.id', f['id'], 'number'),
                k['set_defaults_param']('tabletop.variant_id', f['variant_id'], 'number');
                let F = !0x1;
                k['walk_params_tree'](H => {
                    'tabletop' === H['type'] && H['spec']['can_change']?.['id'] && (H['spec']['material']['id'] = f['id'],
                    H['spec']['material']['variant_id'] = f['variant_id'],
                    F = !0x0);
                }
                );
                var q = k, v, w;
                let G = !0x1;
                for (v of k['userData']['parts']['tabletop']) {
                    var x = v['userData']['params']['resizable']?.['extend_size'], y;
                    v['userData']['params']['spec']?.['can_change']?.['id'] && x && (G = !0x0);
                }
                G && (w = q['userData']['extend_size_info']) && (w['need_update'] = !0x0),
                F ? q['_rebuild']() : G && q['_build_fast']();
            }
            'function' == typeof k['build_tabletop'] && (k['build_tabletop'](),
            'function' == typeof k['build_sizes']) && k['build_sizes']();
        }
        for (let H = global_data['tabletop']['items']['length']; H--; )
            global_data['tabletop']['items'][H]['change_material_ext'](f['id'], f['variant_id']);
        if (constructor_settings['core_v2']) {
            for (var z of d_objects)
                if ('Cabinet' === z['type']) {
                    if (z['params']['tabletop']['material'] = f['id'],
                    z['userData']['params_hash'] && z['userData']['params_hash']['tabletop']) {
                        for (var A of z['userData']['params_hash']['tabletop'])
                            A['spec']['material']['id'] = f['id'],
                            A['spec']['material']['variant_id'] = f['variant_id'];
                    }
                    if (z['userData']['parts'] && z['userData']['parts']['tabletop']) {
                        for (var B of z['userData']['parts']['tabletop'])
                            B['change_material'](f['id'], f['variant_id']);
                    }
                }
        }
        function C(I, J) {
            var K = pp['libs']['tabletop'];
            return get_variant_thickness(I, J || 0x0, K, 0x0);
        }
        sc['build_tabletop'](),
        get_total_price_test(),
        update_materials_panel(),
        autosave();
    },
    'set_glass_material': function(f) {
        change_glass_material_all(f['id']);
    },
    'set_corpus_material': function(f) {
        switch (f['group']) {
        case 'top':
            change_corpus_material_top(f['id']);
            break;
        case 'bottom':
            change_corpus_material_bottom(f['id']);
            break;
        default:
            change_corpus_material_all(f['id']);
        }
    },
    'set_cokol_material': function(f) {
        change_cokol_material(f['id']);
    },
    'set_model_material': function(f, g, h, j=d_objects) {
        var k, l = project_settings['kitchen']['model_materials']?.[h]?.['material'] || {};
        if ('2' === g || '3' === g) {
            let n;
            '2' === g && (l['id'] = parse_int(f['id']),
            n = {
                'mode': g,
                'key': h,
                'mat_id': parse_int(f['id'])
            }),
            '3' === g && (l['id'] = parse_int(f['mat_id']),
            l['key'] = f['mat_key'],
            l['variant_id'] = f['mat_variant_id'] || 0x0,
            n = {
                'mode': g,
                'key': h,
                'mat_id': parse_int(f['mat_id']),
                'mat_key': f['mat_key'],
                'mat_variant_id': f['mat_variant_id'] || 0x0
            });
            for (var m of j)
                module_utils['change_model_material'](m, n);
            sc['get_price']();
        }
    },
    'change_corpus': function(f, g=d_objects) {
        for (let h = f['group']['length']; h--; )
            project_settings['selected_materials'][f['group'][h]]['corpus'] = f['id'];
        for (let i = g['length']; i--; )
            'function' == typeof g[i]['change_corpus'] && g[i]['change_corpus'](f['id'], f['key'], f['group']);
    },
    'change_dsp_thickness': function(f) {
        project_settings['corpus_thickness'] = f;
        for (let g = room['active_objects']['length'] - 0x1; 0x0 <= g; g--)
            'Cabinet' === room['active_objects'][g]['type'] && (room['active_objects'][g]['params']['cabinet']['thickness'] = parseInt(f),
            room['active_objects'][g]['build']());
    },
    'change_cokol_float': function(f) {
        project_settings['cokol_disabled'] = f;
        for (let g = room['active_objects']['length']; g--; )
            'Cabinet' === room['active_objects'][g]['type'] && 'bottom' === room['active_objects'][g]['params']['cabinet_group'] && (room['active_objects'][g]['params']['cokol']['disabled'] = f,
            room['active_objects'][g]['build_cokol']());
    },
    'change_cokol': function(f, g=d_objects) {
        if (project_settings['selected_cokol_model'] = f['id'],
        constructor_settings['core_v2']) {
            project_settings['defaults']['cokol']['material'] = f['id'],
            project_settings['kitchen']['defaults']['cokol']['id'] = f['id'];
            var h = l(f['id']), j, k;
            sc['change_global_var'](pp['const']['vars']['cokol_height'], h);
            for (j of g) {
                if (j['userData']['params'] && 'module' === j['userData']['params']['type']) {
                    let m = !0x1;
                    j['set_defaults_param']('cokol.id', f['id'], 'number'),
                    j['walk_params_tree'](n => {
                        'cokol' === n['type'] && n['spec']['can_change']?.['id'] && (n['spec']['id'] = f['id'],
                        m = !0x0);
                    }
                    ),
                    m && (j['_rebuild'](),
                    sc['build_tabletop']());
                }
            }
        } else {
            for (let n = g['length']; n--; )
                'function' == typeof g[n]['change_cokol'] && g[n]['change_cokol'](f['id']);
        }
        function l(p) {
            var q;
            return pp['libs']['cokol']['items'][p]?.['params']['height'] || 0x0;
        }
    },
    'change_butt': function(f, g=d_objects) {
        for (let u = 0x0; u < f['group']['length']; u++) {
            var h = f['group'][u]
              , h = (project_settings['kitchen']['mat_groups'][f['mat_group_key']]['selected_butt'] || (project_settings['kitchen']['mat_groups'][f['mat_group_key']]['selected_butt'] = {}),
            project_settings['kitchen']['mat_groups'][f['mat_group_key']]['selected_butt'][h]);
            h['key'] === f['key'] && (h['id'] = f['id']);
        }
        let j = f['id'];
        var k = pp['libs']['butts'][f['key']]['find_item'](j), l;
        let m = k['key']
          , p = find_selected_variant(k)
          , q = _['get'](k, 'params.variants[variant_id].thickness') || 0x0;
        for (l of g)
            l['walk_params_tree'](v => {
                if ('wall' === v['type'] && v['spec']['butts'])
                    for (var w of v['spec']['butts']) {
                        var w = w['spec'] || w;
                        w['id'] = j,
                        w['key'] = m,
                        w['thickness'] = q,
                        w['variant_id'] = p;
                    }
            }
            ),
            l['_rebuild_parts_by_type']('wall');
    },
    'change_cokol_top': function(f, g=d_objects) {
        project_settings['defaults']['cokol_top']['material'] = f['id'];
        for (var h of g) {
            var i;
            if (h['userData']['params'] && 'module' === h['userData']['params']['type']) {
                let j = !0x1;
                h['walk_params_tree'](k => {
                    'cokol_top' === k['type'] && k['spec']['can_change']?.['id'] && (k['spec']['id'] = f['id'],
                    j = !0x0);
                }
                ),
                j && h['_rebuild_parts_by_type']('cokol_top');
            } else
                'function' == typeof h['change_cokol_top_material_v2'] && h['change_cokol_top_material_v2'](f);
        }
    },
    'change_leg': function(f, g=d_objects) {
        project_settings['defaults']['leg']['material'] = f['id'];
        for (var h of g) {
            var i;
            h['userData']['params'] && 'module' === h['userData']['params']['type'] ? (h['walk_params_tree'](j => {
                'leg' === j['type'] && (j['spec']['id'] = f['id']);
            }
            ),
            h['_rebuild_parts_by_type']('leg')) : 'function' == typeof h['change_leg_material_v2'] && h['change_leg_material_v2'](f);
        }
    },
    'select_global_vars': function(f, g=!0x0) {
        var h = _['map'](pp['variables']['current'], i => i['key']), f;
        pp['variables']['selected_index'] = f,
        h['push'](..._['map'](pp['variables']['current'], i => i['key'])),
        g && (f = sc['find_modules_with_global_vars'](h),
        sc['rebuild_objects'](f));
    },
    'change_global_var': function(f, g, h=!0x0) {
        var i = pp['variables']['current']
          , i = _['find'](i, j => j['key'] === f);
        i && (i['value'] = g,
        sc['change_global_var_in_modules']({
            'key': f,
            'value': g
        }, h),
        sc['init_catalog_size_hash']());
    },
    'change_global_var_in_modules'(f, g=!0x0) {
        if (!f || void 0x0 === f['key'] || void 0x0 === f['value'])
            return [];
        var h = [], j;
        for (j of d_objects)
            if (j instanceof Module) {
                let p = !0x1;
                var k = _['find'](j['userData']['params']['variables']?.['mass_state'], q => q['key'] === f['key']), l, m;
                if (k) {
                    if (k['fixed'])
                        continue;
                    k['value'] = f['value'];
                }
                module_utils['walk_params_tree'](j, q => {
                    var q = q['variables']?.['global'], q;
                    q?.['length'] && (q = _['find'](q, u => u['key'] === f['key'] && !u['fixed'])) && !_['find'](q['disabled_values'], u => '' + u == '' + f['value']) && (q['value'] = f['value']);
                }
                );
                for (m of [j, ...j['userData']['parts']['module']]) {
                    var n = m['userData']['params']?.['variables']?.['global'], n;
                    n?.['length'] && (n = _['find'](n, q => q['key'] === f['key'] && !q['fixed'])) && !_['find'](n['disabled_values'], q => '' + q == '' + f['value']) && (p = !0x0);
                }
                p && h['push'](j);
            }
        return g && (sc['rebuild_objects'](h),
        f['key'] === pp['const']['vars']['tabletop_enabled'] || f['key'] === pp['const']['vars']['plint_enabled'] || f['key'] === pp['const']['vars']['tabletop_depth'] ? sc['build_tabletop']() : h['length'] && setTimeout( () => sc['get_price'](), 0x258)),
        h;
    },
    'find_modules_with_global_vars'(f) {
        if (!f || !f['length'])
            return [];
        var g = [], h;
        for (h of d_objects) {
            var j = [];
            if (j['push'](h['userData']['params']?.['variables']?.['global']),
            h['userData']['parts']['module']) {
                for (var k of h['userData']['parts']['module'])
                    j['push'](k['userData']['params']?.['variables']?.['global']);
            }
            let n = !0x1;
            for (let p = 0x0; p < j['length']; p++) {
                var l = j[p], m;
                if (n)
                    break;
                if (l && l['length'])
                    for (let q of f) {
                        if (_['find'](l, u => u['key'] === q && (null == u['value'] || !u['fixed']))) {
                            n = !0x0;
                            break;
                        }
                    }
            }
            n && g['push'](h);
        }
        return g;
    },
    'rebuild_objects': function(f=d_objects) {
        for (var g of f)
            if (g['_rebuild']) {
                var h = g['userData']['is_root'] ? g['userData']['params'] : module_utils['get_child_params_by_path'](g, g['userData']['path']), i;
                'module' === h?.['type'] && h?.['spec'] && (i = h['spec']['variants']?.[h['spec']['selected_variant']]?.['size'] || {},
                !h['size_changed']) && (isNaN(Number(i['x'])) || isNaN(Number(i['y'])) || isNaN(Number(i['z']))) && (delete h['size'],
                h['spec']['selected_template'] = -0x1);
                let j;
                g['userData']['is_root'] && g['box'] && (g['box']['update'](),
                j = g['box']['clone']()),
                g['_rebuild'](),
                g['userData']['is_root'] && sc['correct_position_new'](g, j);
            }
    },
    'mass_change_module_id'(f, g) {
        for (var h of d_objects)
            'function' == typeof h['mass_change_id_by_type'] && h['mass_change_id_by_type'](g, f);
    },
    'comments_toggle': function(f) {
        pp['state']['scene_layers']['comments'] = f;
        for (let g = room['active_objects']['length'] - 0x1; 0x0 <= g; g--)
            'function' == typeof room['active_objects'][g]['set_comments_visible'] && room['active_objects'][g]['set_comments_visible'](f);
    },
    'intersections_toggle': function(f) {
        global_options['check_intersections'] = f,
        check_overlap();
    },
    'set_position_from_wall': function(f, g, h) {
        var i = h['box']['getSize'](new THREE['Vector3']());
        switch (isNaN(parseFloat(g)) && (g = 0x0),
        g = parseFloat(g),
        f) {
        case 'left':
            switch (normalize_angle(h['rotation']['y'])) {
            case 0x0:
                h['position']['x'] = room['left_wall']['position']['x'] + g / units + i['x'] / 0x2;
                break;
            case -0x2:
                h['position']['z'] = room['front_wall']['position']['z'] + g / units + i['z'] / 0x2;
                break;
            case 0x3:
                h['position']['x'] = room['right_wall']['position']['x'] - g / units - i['x'] / 0x2;
                break;
            case -0x3:
                h['position']['x'] = room['right_wall']['position']['x'] - g / units - i['x'] / 0x2;
                break;
            case 0x2:
                h['position']['z'] = room['back_wall']['position']['z'] - g / units - i['z'] / 0x2;
                break;
            }
            break;
        case 'right':
            switch (normalize_angle(h['rotation']['y'])) {
            case 0x0:
                h['position']['x'] = room['right_wall']['position']['x'] - g / units - i['x'] / 0x2;
                break;
            case -0x2:
                h['position']['z'] = room['back_wall']['position']['z'] - g / units - i['z'] / 0x2;
                break;
            case 0x3:
                h['position']['x'] = room['left_wall']['position']['x'] + g / units + i['x'] / 0x2;
                break;
            case -0x3:
                h['position']['x'] = room['left_wall']['position']['x'] + g / units + i['x'] / 0x2;
                break;
            case 0x2:
                h['position']['z'] = room['front_wall']['position']['z'] + g / units + i['z'] / 0x2;
                break;
            }
            break;
        case 'front':
            switch (normalize_angle(h['rotation']['y'])) {
            case 0x0:
                h['position']['z'] = room['back_wall']['position']['z'] - g / units - i['z'] / 0x2;
                break;
            case -0x2:
                h['position']['x'] = Math['round'](room['left_wall']['position']['x'] + g / units + i['x'] / 0x2);
                break;
            case 0x3:
                h['position']['z'] = room['front_wall']['position']['z'] + g / units + i['z'] / 0x2;
                break;
            case -0x3:
                h['position']['z'] = room['front_wall']['position']['z'] + g / units + i['z'] / 0x2;
                break;
            case 0x2:
                h['position']['x'] = Math['round'](room['right_wall']['position']['x'] - (g / units + i['x'] / 0x2));
                break;
            }
            break;
        case 'back':
            switch (normalize_angle(h['rotation']['y'])) {
            case 0x0:
                h['position']['z'] = room['front_wall']['position']['z'] + g / units + i['z'] / 0x2;
                break;
            case -0x2:
                h['position']['x'] = Math['round'](room['right_wall']['position']['x'] - g / units - i['x'] / 0x2);
                break;
            case 0x3:
                h['position']['z'] = room['back_wall']['position']['z'] - g / units - i['z'] / 0x2;
                break;
            case -0x3:
                h['position']['z'] = room['back_wall']['position']['z'] - g / units - i['z'] / 0x2;
                break;
            case 0x2:
                h['position']['x'] = Math['round'](room['left_wall']['position']['x'] + (g / units + i['x'] / 0x2));
                break;
            }
            break;
        case 'floor':
            h['position']['y'] = g / units,
            dControls['s_helper']['position']['y'] = h['position']['y'] + i['y'] / 0x2;
            break;
        case 'ceiling':
            h['position']['y'] = room['ceiling']['position']['y'] - g / units - i['y'],
            dControls['s_helper']['position']['y'] = h['position']['y'] + i['y'] / 0x2;
            break;
        }
        h['box']['update'](),
        dControls['s_helper']['position']['x'] = h['position']['x'],
        dControls['s_helper']['position']['z'] = h['position']['z'],
        'function' == typeof h['build_tabletop'] && h['build_tabletop'](),
        active_el['calculate_distances'](),
        setTimeout(function() {
            build_sizes_all(),
            'function' == typeof h['build_from_wall_sizes'] && h['build_from_wall_sizes']();
        }, 0x64);
    },
    'set_position_from_parent': function(f, g, h, j) {
        var k = j['userData']['computed']
          , l = h['userData']['computed']
          , m = (isNaN(parseFloat(g)) && (g = 0x0),
        g = parseFloat(g),
        h['userData']['computed']['pos']['clone']());
        switch (f) {
        case 'left':
            m['x'] = g;
            break;
        case 'right':
            m['x'] = k['size']['x'] - g - l['size']['x'];
            break;
        case 'front':
            m['z'] = k['size']['z'] - g - l['size']['z'];
            break;
        case 'back':
            m['z'] = g;
            break;
        case 'floor':
            m['y'] = g;
            break;
        case 'ceiling':
            m['y'] = k['size']['y'] - g - l['size']['y'];
            break;
        }
        h['userData']['connected'] = h['get_connected'](),
        h['old_pos'] = h['userData']['computed']['pos']['clone']();
        var j = h['userData']['path']
          , f = h['get_child_params_by_path'](j);
        h['userData']['root']['change_param_by_path'](h['userData']['path'], 'pos', m, !0x1),
        h['update_connected_sizes'](h['userData']['parent'], f),
        h['userData']['parent']['_rebuild'](),
        (h = h['userData']['root']['get_child_by_path'](h['userData']['path']))['userData']['root']['_build_sizes'](),
        sc['select_object'](h),
        h['calculate_distances']();
    },
    'set_position_from_root': function(f, g, h, j) {
        var k, l = (h['userData']['params']['pivot'][g] + 0x1) * h['userData']['computed']['size'][g] / 0x2, m;
        let n = f - (j['userData']['computed']['world'] || CabinetAnalyzer['get_root_params'](j))['pos'][g] + l;
        var f = j['userData']['computed']['size'][g] - h['userData']['computed']['size'][g] + l
          , j = ((n = n < 0x0 ? 0x0 : n) > f && (n = f),
        h['userData']['path'])
          , l = h['get_child_params_by_path'](j);
        h['userData']['root']['change_param_by_path'](j, 'pos.' + g, n, !0x1),
        h['update_connected_sizes'](h['userData']['parent'], l),
        h['userData']['parent']['_rebuild'](),
        h = h['userData']['root']['get_child_by_path'](h['userData']['path']),
        sc['select_object'](h),
        h['userData']['root']['_build_sizes'](),
        h['calculate_distances']();
    },
    'correct_position': function(f) {
        var g, h, j, k, l, m, n;
        active_el['userData']?.['root'] && active_el['userData']['parent']instanceof CabinetSection || (g = 0x0,
        h = room['params']['width'] / units,
        j = 0x0,
        k = room['params']['depth'] / units,
        l = 0x0,
        m = room['params']['height'] / units,
        f['box']['update'](),
        n = f['box']['getSize'](new THREE['Vector3']()),
        active_el['position']['set'](clamp(f['position']['x'], 0x0 + n['x'] / 0x2, h - n['x'] / 0x2), clamp(f['position']['y'], 0x0, m - n['y']), clamp(f['position']['z'], 0x0 + n['z'] / 0x2, k - n['z'] / 0x2)),
        f['box']['update']());
    },
    'correct_position_new': function(f, g) {
        var h, j, k, q, u, v, w, x, y, z;
        function A(B, C, D=0.1) {
            return Math['abs'](B - C) < D;
        }
        f['userData']['is_root'] && (h = 0x0,
        j = room['params']['width'] / units,
        k = 0x0,
        q = room['params']['depth'] / units,
        u = 0x0,
        v = room['params']['height'] / units,
        f['box']['update'](),
        w = f['box']['getSize'](new THREE['Vector3']()),
        x = f['position'],
        y = f['box'],
        g && (z = {
            'x': 0x0,
            'y': 0x0,
            'z': 0x0
        },
        A(g['min']['x'], 0x0) ? z['x'] -= y['min']['x'] - g['min']['x'] : A(g['max']['x'], j) && (z['x'] -= y['max']['x'] - g['max']['x']),
        A(g['min']['z'], 0x0) ? z['z'] -= y['min']['z'] - g['min']['z'] : A(g['max']['z'], q) && (z['z'] -= y['max']['z'] - g['max']['z']),
        f['position']['add'](z)),
        f['position']['set'](clamp(x['x'], 0x0 + w['x'] / 0x2, j - w['x'] / 0x2), clamp(x['y'], 0x0, v - w['y']), clamp(x['z'], 0x0 + w['z'] / 0x2, q - w['z'] / 0x2)),
        f['box']['update']());
    },
    'set_cokol_top_all': function(f, g) {
        g || add_undo_action({
            'type': 'cokol_top_all',
            'from': !f,
            'to': f
        }),
        project_settings['cokol_top_active'] = f;
        for (let h = room['active_objects']['length'] - 0x1; 0x0 <= h; h--)
            'Cabinet' === room['active_objects'][h]['type'] && 'top' === room['active_objects'][h]['params']['cabinet_group'] && (room['active_objects'][h]['params']['cokol_top']['front'] = f,
            room['active_objects'][h]['build_cokol_top']());
        get_total_price_test(),
        global_update();
    },
    'set_tabletop_plints_all': function(f) {
        project_settings['tabletop_plints_default'] = f;
        for (let g = room['active_objects']['length'] - 0x1; 0x0 <= g; g--)
            'Cabinet' === room['active_objects'][g]['type'] && 'bottom' === room['active_objects'][g]['params']['cabinet_group'] && 'function' == typeof room['active_objects'][g]['build_tabletop'] && room['active_objects'][g]['params']['tabletop']['active'] && check_at_wall(room['active_objects'][g]) && (room['active_objects'][g]['params']['tabletop']['plints']['back'] = f,
            'corner' !== room['active_objects'][g]['params']['cabinet']['type'] && 'corner_90' !== room['active_objects'][g]['params']['cabinet']['type'] || (room['active_objects'][g]['params']['tabletop']['plints']['left'] = f,
            room['active_objects'][g]['params']['tabletop']['plints']['right'] = f),
            'corner_straight' === room['active_objects'][g]['params']['cabinet']['type'] && ('left' == room['active_objects'][g]['params']['cabinet']['orientation'] ? room['active_objects'][g]['params']['tabletop']['plints']['right'] = f : room['active_objects'][g]['params']['tabletop']['plints']['left'] = f),
            room['active_objects'][g]['build_tabletop']());
        get_total_price_test(),
        global_update();
    },
    'set_cokol_all': function(f) {
        project_settings['is_front_cokol'] = f;
        for (let g = room['active_objects']['length'] - 0x1; 0x0 <= g; g--)
            'Cabinet' === room['active_objects'][g]['type'] && 'bottom' === room['active_objects'][g]['params']['cabinet_group'] && 'function' == typeof room['active_objects'][g]['build_cokol'] && (room['active_objects'][g]['params']['cokol']['visible']['front'] = project_settings['is_front_cokol'],
            'corner_open' !== room['active_objects'][g]['params']['cabinet']['type'] && 'end_corner_facade' !== room['active_objects'][g]['params']['cabinet']['type'] && 'corner_open_facade' !== room['active_objects'][g]['params']['cabinet']['type'] && 'end_radius_open' !== room['active_objects'][g]['params']['cabinet']['type'] && 'end_radius_facade' !== room['active_objects'][g]['params']['cabinet']['type'] || ('left' === room['active_objects'][g]['params']['cabinet']['orientation'] ? room['active_objects'][g]['params']['cokol']['visible']['left'] = project_settings['is_front_cokol'] : room['active_objects'][g]['params']['cokol']['visible']['right'] = project_settings['is_front_cokol']),
            room['active_objects'][g]['build_cokol']());
        get_total_price_test(),
        global_update();
    },
    'set_cokol_legs_all': function(f) {
        project_settings['is_cokol_active'] = f;
        for (let g = room['active_objects']['length'] - 0x1; 0x0 <= g; g--)
            'Cabinet' === room['active_objects'][g]['type'] && 'bottom' === room['active_objects'][g]['params']['cabinet_group'] && 'function' == typeof room['active_objects'][g]['build_cokol'] && (room['active_objects'][g]['params']['cokol']['is_cokol_active'] = project_settings['is_cokol_active'],
            room['active_objects'][g]['build_cokol']());
    },
    'set_cokol_disable_all': function(f) {
        project_settings['cokol_disabled'] = f;
        for (let g = room['active_objects']['length']; g--; )
            'Cabinet' === room['active_objects'][g]['type'] && 'bottom' === room['active_objects'][g]['params']['cabinet_group'] && (room['active_objects'][g]['params']['cokol']['disabled'] = this['cokol_float'],
            room['active_objects'][g]['build_cokol']());
    },
    'show_360': async function(f=!0x1) {
        let g;
        g = f || (project_settings['background']['id'] ? libs['background']['get_item'](project_settings['background']['id']) : libs['background']['items'][Object['keys'](libs['background']['items'])[0x0]]),
        room['floor']['visible'] = !0x1,
        project_settings['background']['active'] = 0x1,
        project_settings['background']['id'] = g['id'],
        global_options['env'] && (scene['remove'](global_options['env']),
        global_options['env'] = null);
        let h;
        (h = -0x1 < g['src']['indexOf']('.hdr') ? await hdr_loader['loadAsync'](g['src']) : await texture_loader['loadAsync'](g['src']))['mapping'] = THREE['EquirectangularReflectionMapping'];
        var f = new THREE['GroundProjectedEnv'](h,{
            'offset_x': room['params']['width'] / units / 0x3 * 0x2,
            'offset_z': room['params']['depth'] / units / 0x3 * 0x2
        });
        f['scale']['setScalar'](project_settings['background']['scale']),
        f['radius'] = project_settings['background']['radius'],
        f['height'] = project_settings['background']['height'],
        scene['add'](f),
        global_options['env'] = f;
    },
    'hide_360': function() {
        project_settings['background']['active'] = 0x0,
        global_options['env'] && (scene['remove'](global_options['env']),
        global_options['env'] = null),
        room['floor']['visible'] = !0x0;
    },
    'assign_numbers': function() {
        let f = 0x1;
        var g = {
            'Cabinet': 0x1,
            'Shelve': 0x1,
            'CabinetN': 0x1,
            'Wall_panel': 0x1
        };
        for (let j = 0x0; j < room['active_objects']['length']; j++) {
            var h = room['active_objects'][j], i;
            h['pdf_number'] = f,
            'Module' == room['active_objects'][j]['temp_type'] ? (h['add_number'](f),
            f++) : g[room['active_objects'][j]['temp_type']] && (i = generate_sprite_number(f, h),
            0x0 < h['number_obj']['children']['length'] && h['number_obj']['remove'](h['number_obj']['children'][0x0]),
            h['number_obj']['add'](i),
            'Cabinet' === h['temp_type'] && i['position']['set'](0x0, h['const']['calculated_height'] / units / 0x2, h['params']['cabinet']['depth'] / units / 0x2),
            'CabinetN' === h['temp_type'] && i['position']['set'](0x0, parseFloat(h['userData']['computed']['size']['y']) / units / 0x2, parseFloat(h['userData']['computed']['size']['z']) / units / 0x2),
            'Shelve' === h['temp_type'] && ('vertical' == h['params']['vertical_orientation'] ? i['position']['set'](0x0, parseFloat(h['params']['width']) / units / 0x2, 0x0) : i['position']['set'](0x0, parseFloat(h['params']['thickness']) / units / 0x2, 0x0)),
            'Wall_panel' === h['type'] && i['position']['set'](0x0, parseFloat(h['params']['width']) / units / 0x2, 0x0),
            f++);
        }
    },
    'numbers': function(f) {
        var g = {
            'Cabinet': 0x1,
            'Shelve': 0x1,
            'CabinetN': 0x1,
            'Wall_panel': 0x1
        };
        global_options['show_numbers'] = f,
        pp['state']['scene_layers']['numbers'] = f;
        for (let h = 0x0; h < room['active_objects']['length']; h++)
            'Module' == room['active_objects'][h]['temp_type'] ? room['active_objects'][h]['set_number_visible'](f) : g[room['active_objects'][h]['temp_type']] && (room['active_objects'][h]['number_obj']['visible'] = f);
    },
    'add_comment': function(f) {
        project_settings['comments'] || (project_settings['comments'] = []),
        project_settings['comments']['push'](f);
    },
    'change_cornice_model': function(f) {
        var g = pp['libs']['cornice']['find_item'](project_settings['selected_cornice_model'])
          , h = (project_settings['selected_cornice_model'] = f,
        pp['libs']['cornice']['find_item'](project_settings['selected_cornice_model']));
        switch (h['params']['materials_mode']) {
        case 'i':
            'i' == g['params']['materials_mode'] && h['params']['material']['includes'](project_settings['selected_materials']['cornice']) || (h['params']['default_material'] ? project_settings['selected_materials']['cornice'] = parseInt(h['params']['default_material']) : project_settings['selected_materials']['cornice'] = parseInt(h['materials'][0x0]));
            break;
        case 'c':
            project_settings['selected_materials']['cornice'] = parseInt(pp['libs']['decors']['get_first_item'](h['mat_categories'][0x0])['id']);
            break;
        default:
            'f' != g['params']['materials_mode'] && (project_settings['selected_materials']['cornice'] = parseInt(project_settings['selected_materials']['top']['facades']));
        }
        if (constructor_settings['core_v2'])
            for (var i of d_objects) {
                i['set_defaults_param']('cornice.id', f, 'number');
                let j = !0x1;
                i['walk_params_tree'](k => {
                    'cornice_placer' === k['type'] && k['spec']['can_change']?.['id'] && (k['spec']['id'] = f,
                    j = !0x0);
                }
                ),
                j && i['_rebuild_parts_by_type']('cornice_placer');
            }
        else {
            for (let k = 0x0; k < room['active_objects']['length']; k++)
                'function' == typeof room['active_objects'][k]['build_cornice'] && (room['active_objects'][k]['params']['cornice']['model'] = f,
                room['active_objects'][k]['build_cornice']());
        }
        sc['get_price']();
    },
    'change_cornice_material': function(f) {
        project_settings['selected_materials']['cornice'] = f;
        for (let g = 0x0; g < room['active_objects']['length']; g++)
            'function' == typeof room['active_objects'][g]['change_cornice_material'] && room['active_objects'][g]['change_cornice_material']({
                'id': f
            }, 'top');
        sc['get_price']();
    },
    'change_cornice_active': function(f, g) {
        change_cornice_active(f, g);
    },
    'set_cornice_as_facade': function(f) {
        !0x0 === f ? (project_settings['cornice_change_with_facade'] = 0x1,
        sc['change_cornice_material'](sc['get_top_facade_material']())) : project_settings['cornice_change_with_facade'] = 0x0;
    },
    'get_top_facade_material': function() {
        return project_settings['selected_materials']['facades'][project_settings['defaults']['facades']['top']]['gen']['top'];
    },
    'get_bottom_facade_material': function() {
        return project_settings['selected_materials']['facades'][project_settings['defaults']['facades']['top']]['gen']['bottom'];
    },
    'set_cokol_offset'(f) {
        cokol_settings['offset'] = f;
        for (let g = d_objects['length']; g--; )
            'function' == typeof d_objects[g]['build_cokol'] && d_objects[g]['build_cokol']();
    },
    'set_walls_custom_material'(f) {
        global_options['custom_textures']['lr_wall'] = create_material({
            'type': 'Standart',
            'params': {
                'map': f['src'],
                'color': '#ffffff',
                'roughness': 0.8,
                'metalness': 0x0
            },
            'add_params': {
                'real_width': f['width'],
                'real_height': f['height'],
                'model_width': room['params']['depth'],
                'model_height': room['params']['height']
            }
        }),
        global_options['custom_textures']['fb_wall'] = create_material({
            'type': 'Standart',
            'params': {
                'map': f['src'],
                'color': '#ffffff',
                'roughness': 0.8,
                'metalness': 0x0
            },
            'add_params': {
                'real_width': f['width'],
                'real_height': f['height'],
                'model_width': room['params']['width'],
                'model_height': room['params']['height']
            }
        }),
        room['left_wall']['material'] = global_options['custom_textures']['lr_wall'],
        room['right_wall']['material'] = global_options['custom_textures']['lr_wall'],
        room['back_wall']['material'] = global_options['custom_textures']['fb_wall'],
        room['front_wall']['material'] = global_options['custom_textures']['fb_wall'],
        global_options['custom_textures_params']['lr_wall']['width'] = f['width'],
        global_options['custom_textures_params']['lr_wall']['height'] = f['height'],
        global_options['custom_textures_params']['lr_wall']['str_x'] = 0x0,
        global_options['custom_textures_params']['lr_wall']['str_y'] = 0x0,
        global_options['custom_textures_params']['lr_wall']['repeat'] = 'mirror',
        global_options['custom_textures_params']['fb_wall']['width'] = f['width'],
        global_options['custom_textures_params']['fb_wall']['height'] = f['height'],
        global_options['custom_textures_params']['fb_wall']['str_x'] = 0x0,
        global_options['custom_textures_params']['fb_wall']['str_y'] = 0x0,
        global_options['custom_textures_params']['fb_wall']['repeat'] = 'mirror',
        pp['interface']['root'] && pp['interface']['root']['$emit']('set_custom_material_params_walls', global_options['custom_textures_params']['lr_wall']),
        add_undo_action({
            'type': 'change_walls_material',
            'from': room['params']['wall_material'],
            'to': void 0x0
        });
    },
    'set_floor_custom_material'(f) {
        global_options['custom_textures']['floor'] = create_material({
            'type': 'Standart',
            'params': {
                'map': f['src'],
                'color': '#ffffff',
                'roughness': 0.8,
                'metalness': 0x0
            },
            'add_params': {
                'real_width': f['width'],
                'real_height': f['height'],
                'model_width': room['params']['width'],
                'model_height': room['params']['depth']
            }
        });
        var g = global_options['custom_textures']['floor'];
        room['floor']['material'] = g,
        global_options['custom_textures_params']['floor']['width'] = f['width'],
        global_options['custom_textures_params']['floor']['height'] = f['height'],
        global_options['custom_textures_params']['floor']['str_x'] = 0x0,
        global_options['custom_textures_params']['floor']['str_y'] = 0x0,
        global_options['custom_textures_params']['floor']['repeat'] = 'mirror',
        pp['interface']['root'] && pp['interface']['root']['$emit']('set_custom_material_params_floor', global_options['custom_textures_params']['floor']);
    },
    'set_facades_active'(f) {
        project_settings['facades_active'] = f;
        for (let h = room['active_objects']['length']; h--; ) {
            var g = room['active_objects'][h];
            'Cabinet' == g['type'] && 'function' == typeof g['change_facades_active'] && g['change_facades_active'](f);
        }
    },
    'update_from_wall_sizes'() {
        if (!custom_settings['from_wall_sizes_disabled']) {
            for (var f of d_objects)
                f && 'function' == typeof f['calculate_distances'] && 'function' == typeof f['build_from_wall_sizes'] && (f['calculate_distances'](),
                f['build_from_wall_sizes']());
        }
    },
    'unset_mouse_mode'() {
        this['set_guides_mode'](0x0),
        this['set_ruler_mode'](0x0),
        this['set_camera_mode'](0x0),
        pp['interface']['root']['unset_mouse_mode'](),
        global_options['mouse_mode'] = {
            'mode': 'drag',
            'target': null,
            'style': null,
            'radius': 0x0,
            'active': !0x1,
            'item_id': null,
            'notice': '',
            'el': null,
            'obj': null
        };
    },
    'mass_depth_change'(f, g) {
        var h = 0x0
          , j = room['params']['width'] / units
          , k = 0x0
          , l = room['params']['depth'] / units
          , m = 0x0
          , n = room['params']['height'] / units;
        for (let q = 0x0; q < room['active_objects']['length']; q++)
            if ('Cabinet' == room['active_objects'][q]['type'] && room['active_objects'][q]['params']['cabinet_group'] == f) {
                room['active_objects'][q]['params']['cabinet']['depth'] = parseInt(g);
                for (let u = 0x0; u < room['active_objects'][q]['params']['variants']['length']; u++)
                    room['active_objects'][q]['params']['variants'][u]['depth'] = parseInt(g),
                    room['active_objects'][q]['build']();
                room['active_objects'][q]['box']['update']();
                var p = room['active_objects'][q]['box']['getSize'](new THREE['Vector3']());
                room['active_objects'][q]['position']['set'](clamp(room['active_objects'][q]['position']['x'], 0x0 + p['x'] / 0x2, j - p['x'] / 0x2), clamp(room['active_objects'][q]['position']['y'], 0x0, n - p['y']), clamp(room['active_objects'][q]['position']['z'], 0x0 + p['z'] / 0x2, l - p['z'] / 0x2)),
                room['active_objects'][q]['box']['update']();
            }
    },
    'mass_height_change'(f, g) {
        var h = 0x0
          , j = room['params']['width'] / units
          , k = 0x0
          , l = room['params']['depth'] / units
          , m = 0x0
          , n = room['params']['height'] / units;
        for (let q = 0x0; q < room['active_objects']['length']; q++)
            if ('Cabinet' == room['active_objects'][q]['type'] && room['active_objects'][q]['params']['cabinet_group'] == f) {
                room['active_objects'][q]['params']['cabinet']['height'] = parseInt(g),
                room['active_objects'][q]['params']['cabinet']['original_height'] = parseInt(g);
                for (let u = 0x0; u < room['active_objects'][q]['params']['variants']['length']; u++)
                    room['active_objects'][q]['params']['variants'][u]['height'] = parseInt(g),
                    room['active_objects'][q]['build']();
                room['active_objects'][q]['box']['update']();
                var p = room['active_objects'][q]['box']['getSize'](new THREE['Vector3']());
                room['active_objects'][q]['position']['set'](clamp(room['active_objects'][q]['position']['x'], 0x0 + p['x'] / 0x2, j - p['x'] / 0x2), clamp(room['active_objects'][q]['position']['y'], 0x0, n - p['y']), clamp(room['active_objects'][q]['position']['z'], 0x0 + p['z'] / 0x2, l - p['z'] / 0x2)),
                room['active_objects'][q]['box']['update']();
            }
    },
    'mouseup_selected'() {},
    'correct_sel_box'(f) {},
    'init_catalog_size_hash'() {
        let f = {}
          , g = {
            'parent_size': new THREE['Vector3'](),
            'computed': {},
            'variables': pp['variables']['current_hash'] || {},
            'props': {},
            'materials': {},
            'local_parent': {}
        };
        for (var h of Object['values'](pp['libs']['catalogs']))
            for (var j of h['items_arr'])
                if (j?.['params']?.['spec']?.['variants']) {
                    for (var k of j['params']['spec']['variants'])
                        k['size'] && (l(k['size']['x']),
                        l(k['size']['y']),
                        l(k['size']['z']));
                }
        function l(m) {
            void 0x0 !== m && isNaN(Number(m)) && void 0x0 === f[m] && (f[m] = comp2(m, g));
        }
        pp['temp']['catalog_size_hash'] = f;
    },
    'change_back_wall_material': function(f, g, h) {
        if ('all' == (h = h || 'all')) {
            project_settings['selected_materials']['top']['back_wall_material'] = {
                'key': f,
                'id': g
            },
            project_settings['selected_materials']['bottom']['back_wall_material'] = {
                'key': f,
                'id': g
            };
            for (let m = 0x0; m < room['active_objects']['length']; m++)
                'Cabinet' === room['active_objects'][m]['type'] && room['active_objects'][m]['change_back_wall_material']({
                    'key': f,
                    'id': g
                });
        } else {
            project_settings['selected_materials'][h]['back_wall_material'] = {
                'key': f,
                'id': g
            };
            for (let n = 0x0; n < room['active_objects']['length']; n++)
                'Cabinet' === room['active_objects'][n]['type'] && room['active_objects'][n]['params']['cabinet_group'] == h && room['active_objects'][n]['change_back_wall_material']({
                    'key': f,
                    'id': g
                });
        }
        if (constructor_settings['core_v2']) {
            var j = project_settings['kitchen']['mat_groups']['g1']['selected']
              , k = get_wall_thickness(g, 0x0, 'bw_' + f)
              , l = 'all' === h ? ['top', 'bottom'] : [h];
            for (let p of l)
                j[p] && (j[p] = {
                    'key': 'bw_' + f,
                    'id': g,
                    'variant_id': 0x0,
                    'size': {
                        'z': k
                    }
                });
        }
    }
}
  , sc = scene_controller;
function draw_line(f, g, h) {
    return new THREE['Line'](new THREE['BufferGeometry']()['setFromPoints']([f, g]),h);
}
function c_round(f) {
    var g;
    return 0.6 < f - Math['floor'](f) ? Math['ceil'](f) : Math['floor'](f);
}
function round_decimals(f) {
    var g = f
      , h = f - Math['floor'](f);
    return h *= 0xa,
    h = Math['round'](h),
    h /= 0xa,
    Math['floor'](f) + h;
}
function round_decimals_2(f) {
    var g, f = (Math['round'](0x64 * f) / 0x64)['toString']();
    return f['includes']('.') ? f['replace'](/\.?0+$/, '') : f;
}
function round_vec(f) {
    f['min']['x'] = c_round(f['min']['x']),
    f['max']['x'] = c_round(f['max']['x']),
    f['max']['z'] = c_round(f['max']['z']),
    f['min']['z'] = c_round(f['min']['z']),
    f['min']['y'] = c_round(f['min']['y']),
    f['max']['y'] = c_round(f['max']['y']);
}
function get_adj_objs() {
    var f = [];
    let g = {}
      , h = {};
    var j = [];
    let k = {};
    for (let B = d_objects['length']; B--; )
        'Wall_panel' != d_objects[B]['params']['type'] && 'Shaft' != d_objects[B]['params']['type'] && 'top' != d_objects[B]['params']['cabinet_group'] && (d_objects[B]['box']['update'](),
        j['push'](d_objects[B]));
    for (let C = j['length']; C--; ) {
        var q = j[C]
          , u = (q['userData']['adj'] = [],
        q['box']['clone']());
        u['max']['round'](),
        u['min']['round'](),
        q['userData']['rounded_box'] = u;
        for (let D = d_objects['length']; D--; ) {
            var v = d_objects[D], w;
            q['userData']['rounded_box'] || ((w = v['box']['clone']())['max']['round'](),
            w['min']['round'](),
            q['userData']['rounded_box'] = w),
            q['uuid'] != v['uuid'] && q['box']['intersectsBox'](v['box']) && q['userData']['adj']['push'](v);
        }
    }
    for (let E = j['length']; E--; )
        z(j[E], E);
    let x = {}
      , y = new THREE['Box3']();
    function z(F, G) {
        if (!h[F['uuid']]) {
            k[G] || (k[G] = []),
            g[F['uuid']] || (k[G]['push'](F),
            g[F['uuid']] = 0x1);
            var H = F['userData']['adj'];
            h[F['uuid']] = 0x1;
            for (let I = H['length']; I--; )
                g[H[I]['uuid']] || (g[H[I]['uuid']] = 0x1,
                k[G]['push'](H[I])),
                z(H[I], G);
        }
    }
    function A(F) {
        let G = {}
          , H = [];
        for (let I = F['length']; I--; )
            G[F[I]['x'] + '_' + F[I]['z']] ? G[F[I]['x'] + '_' + F[I]['z']]['count'] += 0x1 : G[F[I]['x'] + '_' + F[I]['z']] = {
                'count': 0x1,
                'item': F[I]
            };
        return Object['keys'](G)['forEach'](J => {
            0x1 == G[J]['count'] && H['push'](G[J]['item']);
        }
        ),
        H;
    }
    return Object['keys'](k)['forEach'](F => {
        x[F] = [];
        for (let H = k[F]['length']; H--; ) {
            var G = k[F][H];
            for (let I = G['tabletop']['children']['length']; I--; )
                G['tabletop']['children'][I]instanceof Tabletop && (y['setFromObject'](G['tabletop']['children'][I]),
                y['max']['round'](),
                y['min']['round'](),
                x[F]['push']({
                    'x': y['min']['x'],
                    'z': y['min']['z'],
                    'type': 'sq'
                }),
                x[F]['push']({
                    'x': y['max']['x'],
                    'z': y['min']['z'],
                    'type': 'sq'
                }),
                x[F]['push']({
                    'x': y['min']['x'],
                    'z': y['max']['z'],
                    'type': 'sq'
                }),
                x[F]['push']({
                    'x': y['max']['x'],
                    'z': y['max']['z'],
                    'type': 'sq'
                }));
        }
        x[F] = A(x[F])['sort'](function(J, K) {
            return J['x'] === K['x'] ? J['z'] - K['z'] : J['x'] - K['x'];
        });
    }
    ),
    Object['keys'](x)['forEach'](F => {
        var G = x[F];
        let H = {
            'p': G[0x0],
            'i': 0x0
        }
          , I = 'z'
          , J = 'x';
        var K = []
          , L = [];
        L['push']({
            'x': H['p']['x'],
            'z': H['p']['z']
        }),
        G['splice'](0x0, 0x1);
        let N = 0x0;
        do {
            K = [],
            J = N % 0x2 == 0x0 ? (I = 'z',
            'x') : (I = 'x',
            'z');
            for (let R = G['length']; R--; ) {
                var O = G[R];
                H['p'][I] == O[I] && K['push']({
                    'p': O,
                    'i': R
                });
            }
            K['sort']( (S, T) => S['p'][J] - T['p'][J]),
            H = copy_object(K[0x0]),
            L['push']({
                'x': H['p']['x'],
                'z': H['p']['z']
            }),
            G['splice'](H['i'], 0x1),
            N++;
        } while (G['length']);
        var P = new THREE['Shape']();
        P['moveTo'](L[0x0]['x'], L[0x0]['z']);
        for (let S = 0x1; S < L['length']; S++)
            P['lineTo'](L[S]['x'], L[S]['z']);
        var F = new THREE['ExtrudeBufferGeometry'](P,{
            'steps': 0x1,
            'depth': 0x28,
            'bevelEnabled': !0x1
        })
          , Q = F['attributes']['uv'];
        F['attributes']['position']['needsUpdate'] = !0x0,
        F['attributes']['uv']['needsUpdate'] = !0x0,
        mesh = new THREE['Mesh'](F,red_mat),
        scene['add'](mesh);
    }
    ),
    k;
}
function get_around(f) {
    f || (f = active_el)['box']['update']();
    var g = f['box']['clone']()
      , h = (g['max']['round'](),
    g['min']['round'](),
    {
        'at_wall': 0x0,
        'left': null,
        'right': null,
        'front': null,
        'back': null,
        'corner_left': null,
        'corner_right': null
    })
      , j = f['get_forward']()
      , k = g['getSize'](new THREE['Vector3']());
    for (let x = d_objects['length']; x--; ) {
        var m = d_objects[x], p, q, u, v, w;
        f['uuid'] != m['uuid'] && (m['box']['update'](),
        (p = m['box']['clone']())['max']['round'](),
        p['min']['round'](),
        g['intersectsBox'](p) && g['max']['y'] == p['max']['y']) && (q = m['get_forward'](),
        u = p['getSize'](new THREE['Vector3']()),
        v = !0x1,
        0x0 == (w = j['clone']()['add'](q['clone']()))['x'] && 0x0 == w['y'] && w['z'],
        j['equals'](q) ? 0x1 == j['z'] ? g['min']['z'] == p['min']['z'] && (f['position']['x'] > m['position']['x'] ? h['left'] = m : h['right'] = m) : -0x1 == j['z'] ? g['max']['z'] == p['max']['z'] && (f['position']['x'] < m['position']['x'] ? h['left'] = m : h['right'] = m) : 0x1 == j['x'] ? g['min']['x'] == p['min']['x'] && (f['position']['z'] > m['position']['z'] ? h['left'] = m : h['right'] = m) : -0x1 == j['x'] && g['max']['x'] == p['max']['x'] && (f['position']['z'] < m['position']['z'] ? h['left'] = m : h['right'] = m) : m['params']['cabinet'] && 'corner_straight' == m['params']['cabinet']['type'] && (0x1 == j['z'] && (g['max']['x'] <= p['min']['x'] ? h['corner_right'] = m : h['corner_left'] = m),
        -0x1 == j['z'] && (g['max']['x'] <= p['min']['x'] ? h['corner_right'] = m : h['corner_left'] = m),
        0x1 == j['x'] && (g['max']['z'] <= p['min']['z'] ? h['corner_right'] = m : h['corner_left'] = m),
        -0x1 == j['x']) && (g['max']['z'] <= p['min']['z'] ? h['corner_right'] = m : h['corner_left'] = m));
    }
    for (let y = room['walls_objects']['length']; y--; )
        'floor' != room['walls_objects'][y]['name'] && 'ceiling' != room['walls_objects'][y]['name'] && f['box']['intersectsBox'](room['walls_objects'][y]['box']) && (h['at_wall'] = 0x1);
    f['userData']['around'] = h;
}
let cabinet_templates = {
    'common_top': [{
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
        'v': 0x1,
        'template': {
            'tree': {
                'type': 'section',
                'name': 'cabinet',
                'size': {
                    'x': 's:x',
                    'y': 's:y',
                    'z': 's:z'
                },
                'children': [{
                    'type': 'section',
                    'name': 'cabinet_inner',
                    'id': 'cabinet_inner',
                    'size': {
                        'x': 's:x',
                        'y': 's:y',
                        'z': 's:z\x20-\x20v:wall_d\x20-\x20v:tob'
                    },
                    'pos': {
                        'z': 'v:wall_d'
                    },
                    'children': [{
                        'type': 'section',
                        'name': 'walls',
                        'id': 'section_walls',
                        'size': {
                            'x': 's:x',
                            'y': 's:y',
                            'z': 's:z'
                        },
                        'pos': {
                            'y': 'v:c_height'
                        },
                        'children': [{
                            'type': 'wall',
                            'id': 'wall_bottom',
                            'spec': {
                                'material': {},
                                'orientation': 'h',
                                'type': 'common',
                                'key': 'bottom'
                            },
                            'active': 0x1,
                            'size': {
                                'x': 's:x',
                                'y': 's:z'
                            }
                        }, {
                            'type': 'wall',
                            'id': 'wall_top',
                            'spec': {
                                'material': {},
                                'orientation': 'h',
                                'type': 'common',
                                'key': 'top'
                            },
                            'active': 0x1,
                            'size': {
                                'x': 's:x\x20-\x20g:g0.size.z\x20*\x202',
                                'y': 's:z'
                            },
                            'pos': {
                                'x': 's:x\x20/\x202',
                                'y': 's:y'
                            },
                            'pivot': {
                                'x': 0x0,
                                'y': 0x1
                            }
                        }, {
                            'type': 'wall',
                            'id': 'wall_left',
                            'spec': {
                                'material': {},
                                'orientation': 'v',
                                'type': 'common',
                                'key': 'left'
                            },
                            'pos': {
                                'y': 'g:g0.size.z'
                            },
                            'active': 0x1,
                            'size': {
                                'x': 's:z',
                                'y': 's:y\x20-\x20g:g0.size.z'
                            }
                        }, {
                            'type': 'wall',
                            'id': 'wall_right',
                            'spec': {
                                'material': {},
                                'type': 'common',
                                'key': 'right',
                                'orientation': 'v'
                            },
                            'active': 0x1,
                            'pos': {
                                'x': 's:x',
                                'y': 'g:g0.size.z'
                            },
                            'pivot': {
                                'x': 0x1
                            },
                            'size': {
                                'x': 's:z',
                                'y': 's:y\x20-\x20g:g0.size.z'
                            }
                        }, {
                            'type': 'wall',
                            'id': 'wall_back',
                            'spec': {
                                'material': {
                                    'group': 'g1'
                                },
                                'orientation': 'f',
                                'type': 'common',
                                'key': 'left'
                            },
                            'pos': {
                                'z': 0x0
                            },
                            'active': 0x1,
                            'size': {
                                'x': 's:x',
                                'y': 's:y'
                            },
                            'pivot': {
                                'z': 0x1
                            }
                        }]
                    }, {
                        'type': 'cornice_placer',
                        'name': 'cornice_placer',
                        'id': 'section_cornice_placer'
                    }, {
                        'type': 'section',
                        'name': 'cokol_top',
                        'id': 'section_cokol_top',
                        'size': {
                            'x': 's:x',
                            'y': 's:y',
                            'z': 's:z'
                        },
                        'children': [{
                            'type': 'cokol_top',
                            'id': 'cokol_top_front',
                            'spec': {
                                'type': 'common',
                                'key': 'front'
                            },
                            'toggle': {
                                'enabled': 0x1,
                                'value': 0x0,
                                'key': 'cokol_top_front',
                                'group': 'Световая\x20рейка',
                                'name': 'Спереди',
                                'order': 0x1
                            },
                            'size': {
                                'x': 's:x'
                            },
                            'pivot': {
                                'y': 0x1,
                                'z': 0x1
                            },
                            'pos': {
                                'z': 's:z\x20-\x20v:c_offset'
                            }
                        }, {
                            'type': 'cokol_top',
                            'id': 'cokol_top_left',
                            'spec': {
                                'type': 'common',
                                'key': 'left'
                            },
                            'toggle': {
                                'enabled': 0x1,
                                'value': 0x0,
                                'key': 'cokol_top_left',
                                'group': 'Световая\x20рейка',
                                'name': 'Слева',
                                'order': 0x2
                            },
                            'size': {
                                'x': 's:z\x20-\x20v:c_offset\x20*\x202'
                            },
                            'rot': {
                                'y': 0x28
                            },
                            'pivot': {
                                'y': 0x1,
                                'z': 0x1
                            },
                            'pos': {
                                'z': 'v:c_offset'
                            }
                        }, {
                            'type': 'cokol_top',
                            'id': 'cokol_top_right',
                            'spec': {
                                'type': 'common',
                                'key': 'right'
                            },
                            'toggle': {
                                'enabled': 0x1,
                                'value': 0x0,
                                'key': 'cokol_top_right',
                                'group': 'Световая\x20рейка',
                                'name': 'Справа'
                            },
                            'size': {
                                'x': 's:z\x20-\x20v:c_offset\x20*\x202'
                            },
                            'rot': {
                                'y': -0x5a
                            },
                            'pivot': {
                                'y': 0x1,
                                'z': 0x1
                            },
                            'pos': {
                                'x': 's:x',
                                'z': 's:z\x20-\x20v:c_offset'
                            }
                        }]
                    }]
                }]
            },
            'variables': {
                'wall_d': {
                    'name': 'Расстояние\x20от\x20стены',
                    'key': 'wall_d',
                    'type': 'number',
                    'local': 0x0,
                    'editable': 0x1,
                    'variants': 0x0,
                    'params': {}
                },
                'left_wall': {
                    'key': 'type',
                    'value': 'w'
                },
                'right_wall': {
                    'key': 'type',
                    'value': 'w'
                }
            }
        }
    }],
    'common_bottom': [{
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
        'v': 0x1,
        'template': {
            'tree': [{
                'type': 'section',
                'name': 'cabinet_inner',
                'id': 'cabinet_inner',
                'size': {
                    'x': 's:x',
                    'y': 's:y',
                    'z': 's:z'
                },
                'pos': {
                    'x': 'v:tol',
                    'z': 'v:wall_d'
                },
                'children': [{
                    'type': 'section',
                    'name': 'walls',
                    'id': 'section_walls',
                    'size': {
                        'x': 's:x',
                        'y': 's:y',
                        'z': 's:z'
                    },
                    'pos': {
                        'y': 'v:c_height'
                    },
                    'children': [{
                        'type': 'wall',
                        'id': 'wall_bottom',
                        'spec': {
                            'material': {},
                            'orientation': 'h',
                            'type': 'common',
                            'key': 'bottom'
                        },
                        'active': 0x1,
                        'size': {
                            'x': 's:x',
                            'y': 's:z'
                        }
                    }, {
                        'type': 'wall',
                        'id': 'wall_top',
                        'spec': {
                            'material': {},
                            'orientation': 'h',
                            'type': 'common',
                            'key': 'top'
                        },
                        'condition': [[{
                            'f': 's:y',
                            'o': '>=',
                            'v': 0x4b0
                        }]],
                        'active': 0x1,
                        'size': {
                            'x': 's:x\x20-\x20g:g0.size.z\x20*\x202',
                            'y': 's:z'
                        },
                        'pos': {
                            'x': 's:x\x20/\x202',
                            'y': 's:y'
                        },
                        'pivot': {
                            'x': 0x0,
                            'y': 0x1
                        }
                    }, {
                        'type': 'wall',
                        'id': 'tsarg_front',
                        'spec': {
                            'material': {},
                            'orientation': 'h',
                            'type': 'common',
                            'key': 'top'
                        },
                        'condition': [[{
                            'f': 's:y',
                            'o': '<',
                            'v': 0x4b0
                        }]],
                        'active': 0x1,
                        'size': {
                            'x': 's:x\x20-\x20g:g0.size.z\x20*\x202',
                            'y': 'v:tsw'
                        },
                        'pos': {
                            'x': 's:x\x20/\x202',
                            'y': 's:y',
                            'z': 's:z'
                        },
                        'pivot': {
                            'x': 0x0,
                            'y': 0x1,
                            'z': 0x1
                        }
                    }, {
                        'type': 'wall',
                        'id': 'tsarg_back',
                        'spec': {
                            'material': {},
                            'orientation': 'h',
                            'type': 'common',
                            'key': 'top'
                        },
                        'condition': [[{
                            'f': 's:y',
                            'o': '<',
                            'v': 0x4b0
                        }]],
                        'active': 0x1,
                        'size': {
                            'x': 's:x\x20-\x20g:g0.size.z\x20*\x202',
                            'y': 'v:tsw'
                        },
                        'pos': {
                            'x': 's:x\x20/\x202',
                            'y': 's:y'
                        },
                        'pivot': {
                            'x': 0x0,
                            'y': 0x1,
                            'z': -0x1
                        }
                    }, {
                        'type': 'wall',
                        'id': 'wall_left',
                        'spec': {
                            'material': {},
                            'orientation': 'v',
                            'type': 'common',
                            'key': 'left'
                        },
                        'pos': {
                            'y': 'g:g0.size.z'
                        },
                        'pivot': {
                            'x': -0x1
                        },
                        'active': 0x1,
                        'size': {
                            'x': 's:z',
                            'y': 's:y\x20-\x20g:g0.size.z'
                        }
                    }, {
                        'type': 'wall',
                        'id': 'wall_right',
                        'spec': {
                            'material': {},
                            'type': 'common',
                            'key': 'right',
                            'orientation': 'v'
                        },
                        'active': 0x1,
                        'pos': {
                            'x': 's:x',
                            'y': 'g:g0.size.z'
                        },
                        'pivot': {
                            'x': 0x1
                        },
                        'size': {
                            'x': 's:z',
                            'y': 's:y\x20-\x20g:g0.size.z'
                        }
                    }, {
                        'type': 'wall',
                        'id': 'wall_back',
                        'spec': {
                            'material': {
                                'group': 'g1'
                            },
                            'orientation': 'f',
                            'type': 'common',
                            'key': 'left'
                        },
                        'pos': {
                            'z': 0x0
                        },
                        'active': 0x1,
                        'size': {
                            'x': 's:x',
                            'y': 's:y'
                        },
                        'pivot': {
                            'z': -0x1
                        },
                        'condition': [[{
                            'f': 'v:_bw',
                            'o': '!=',
                            'v': 0x0
                        }]]
                    }]
                }, {
                    'type': 'section',
                    'name': 'cokol',
                    'id': 'section_cokol',
                    'size': {
                        'x': 's:x',
                        'y': 's:y',
                        'z': 's:z'
                    },
                    'children': [{
                        'type': 'cokol',
                        'id': 'cokol_front',
                        'spec': {
                            'type': 'common',
                            'key': 'front'
                        },
                        'toggle': {
                            'enabled': 0x1,
                            'value': 0x1,
                            'key': 'cokol_front',
                            'group': 'Цоколь',
                            'name': 'Спереди'
                        },
                        'size': {
                            'x': 's:x'
                        },
                        'pivot': {
                            'z': 0x1
                        },
                        'pos': {
                            'z': 's:z\x20-\x20v:c_offset'
                        }
                    }, {
                        'type': 'cokol',
                        'id': 'cokol_left',
                        'spec': {
                            'type': 'common',
                            'key': 'left'
                        },
                        'toggle': {
                            'enabled': 0x1,
                            'value': 0x0,
                            'key': 'cokol_left',
                            'group': 'Цоколь',
                            'name': 'Слева'
                        },
                        'size': {
                            'x': 's:z\x20-\x20v:c_offset\x20*\x202'
                        },
                        'rot': {
                            'y': 0x5a
                        },
                        'pivot': {
                            'z': 0x1
                        },
                        'pos': {
                            'z': 'v:c_offset'
                        }
                    }, {
                        'type': 'cokol',
                        'id': 'cokol_right',
                        'spec': {
                            'type': 'common',
                            'key': 'right'
                        },
                        'toggle': {
                            'enabled': 0x1,
                            'value': 0x0,
                            'key': 'cokol_right',
                            'group': 'Цоколь',
                            'name': 'Справа'
                        },
                        'size': {
                            'x': 's:z\x20-\x20v:c_offset\x20*\x202'
                        },
                        'rot': {
                            'y': -0x5a
                        },
                        'pivot': {
                            'z': 0x1
                        },
                        'pos': {
                            'x': 's:x',
                            'z': 's:z\x20-\x20v:c_offset'
                        }
                    }, {
                        'type': 'cokol',
                        'id': 'cokol_back',
                        'spec': {
                            'type': 'common',
                            'key': 'back'
                        },
                        'toggle': {
                            'enabled': 0x1,
                            'value': 0x0,
                            'key': 'cokol_back',
                            'group': 'Цоколь',
                            'name': 'Сзади'
                        },
                        'size': {
                            'x': 's:x'
                        },
                        'pos': {
                            'z': 'v:c_offset'
                        }
                    }]
                }, {
                    'type': 'section',
                    'name': 'doors',
                    'id': 'section_doors',
                    'size': {
                        'x': 's:x',
                        'y': 's:y',
                        'z': 's:z'
                    },
                    'pivot': {
                        'z': -0x1
                    },
                    'pos': {
                        'y': 'v:c_height',
                        'z': 's:z'
                    },
                    'children': [{
                        'type': 'compound',
                        'name': 'Door',
                        'spec': {
                            'id': '_door_rtl'
                        },
                        'size': {
                            'x': 's:x',
                            'y': 's:y',
                            'z': 's:z'
                        },
                        'pos': {
                            'y': 0x0
                        }
                    }, {
                        'type': 'compound',
                        'name': 'Door',
                        'spec': {
                            'id': '_door_ltr'
                        },
                        'size': {
                            'x': 's:x',
                            'y': 's:y',
                            'z': 's:z'
                        },
                        'pos': {
                            'x': 's:x'
                        }
                    }]
                }, {
                    'type': 'section',
                    'name': 'cokol',
                    'id': 'section_cokol',
                    'size': {
                        'x': 's:x',
                        'y': 's:y',
                        'z': 's:z'
                    },
                    'children': [{
                        'type': 'leg',
                        'id': 'leg1',
                        'spec': {
                            'type': 'common',
                            'key': 'front'
                        },
                        'size': {
                            'y': 'v:c_height'
                        },
                        'pivot': {
                            'z': -0x1
                        },
                        'pos': {
                            'x': 0x0,
                            'z': 0x0
                        }
                    }, {
                        'type': 'leg',
                        'id': 'leg2',
                        'spec': {
                            'type': 'common',
                            'key': 'front'
                        },
                        'size': {
                            'y': 'v:c_height'
                        },
                        'pivot': {
                            'z': -0x1,
                            'x': 0x1
                        },
                        'pos': {
                            'x': 's:x',
                            'z': 0x0
                        }
                    }, {
                        'type': 'leg',
                        'id': 'leg3',
                        'spec': {
                            'type': 'common',
                            'key': 'front'
                        },
                        'size': {
                            'y': 'v:c_height'
                        },
                        'pivot': {
                            'z': 0x1,
                            'x': 0x1
                        },
                        'pos': {
                            'x': 's:x',
                            'z': 's:z'
                        }
                    }, {
                        'type': 'leg',
                        'id': 'leg4',
                        'spec': {
                            'type': 'common',
                            'key': 'front'
                        },
                        'size': {
                            'y': 'v:c_height'
                        },
                        'pivot': {
                            'z': 0x1,
                            'x': -0x1
                        },
                        'pos': {
                            'x': 0x0,
                            'z': 's:z'
                        }
                    }]
                }]
            }],
            'variables': {
                'wall_d': {
                    'name': 'Расстояние\x20от\x20стены',
                    'key': 'wall_d',
                    'type': 'number',
                    'local': 0x0,
                    'editable': 0x1,
                    'variants': 0x0,
                    'params': {}
                },
                '_bw': {
                    'name': 'Задняя\x20стенка',
                    'key': '_bw',
                    'type': 'boolean',
                    'local': 0x0,
                    'editable': 0x1,
                    'variants': 0x0,
                    'params': {}
                },
                '_tbl': {
                    'name': 'Столешница',
                    'key': '_tbl',
                    'type': 'boolean',
                    'local': 0x0,
                    'editable': 0x1,
                    'variants': 0x0,
                    'params': {}
                },
                'left_wall': {
                    'key': 'type',
                    'value': 'w'
                },
                'right_wall': {
                    'key': 'type',
                    'value': 'w'
                }
            }
        }
    }],
    'corner_straight_bottom_left': [{
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
        'v': 0x1,
        'template': {
            'tree': {
                'type': 'section',
                'name': 'cabinet',
                'size': {
                    'x': 's:x',
                    'y': 's:y',
                    'z': 's:z'
                },
                'children': [{
                    'type': 'section',
                    'name': 'cabinet_inner',
                    'id': 'cabinet_inner',
                    'size': {
                        'x': 's:x\x20-\x20v:tol\x20-\x20v:tor',
                        'y': 's:y',
                        'z': 's:z\x20-\x20v:wall_d\x20-\x20v:tof'
                    },
                    'pos': {
                        'x': 'v:tol',
                        'z': 'v:wall_d'
                    },
                    'children': [{
                        'type': 'section',
                        'name': 'walls',
                        'id': 'section_walls',
                        'size': {
                            'x': 's:x',
                            'y': 's:y',
                            'z': 's:z'
                        },
                        'pos': {
                            'y': 'v:c_height'
                        },
                        'children': [{
                            'type': 'wall',
                            'id': 'wall_bottom',
                            'spec': {
                                'material': {},
                                'orientation': 'h',
                                'type': 'common',
                                'key': 'bottom'
                            },
                            'active': 0x1,
                            'size': {
                                'x': 's:x',
                                'y': 's:z'
                            }
                        }, {
                            'type': 'wall',
                            'id': 'wall_top',
                            'spec': {
                                'material': {},
                                'orientation': 'h',
                                'type': 'common',
                                'key': 'top'
                            },
                            'condition': [[{
                                'f': 's:y',
                                'o': '>=',
                                'v': 0x4b0
                            }]],
                            'active': 0x1,
                            'size': {
                                'x': 's:x\x20-\x20g:g0.size.z\x20*\x202',
                                'y': 's:z'
                            },
                            'pos': {
                                'x': 's:x\x20/\x202',
                                'y': 's:y'
                            },
                            'pivot': {
                                'x': 0x0,
                                'y': 0x1
                            }
                        }, {
                            'type': 'wall',
                            'id': 'wall_left',
                            'spec': {
                                'material': {},
                                'orientation': 'v',
                                'type': 'common',
                                'key': 'left'
                            },
                            'pos': {
                                'y': 'g:g0.size.z'
                            },
                            'active': 0x1,
                            'size': {
                                'x': 's:z',
                                'y': 's:y\x20-\x20g:g0.size.z'
                            }
                        }, {
                            'type': 'wall',
                            'id': 'wall_right',
                            'spec': {
                                'material': {},
                                'type': 'common',
                                'key': 'right',
                                'orientation': 'v'
                            },
                            'active': 0x1,
                            'pos': {
                                'x': 's:x',
                                'y': 'g:g0.size.z'
                            },
                            'pivot': {
                                'x': 0x1
                            },
                            'size': {
                                'x': 's:z',
                                'y': 's:y\x20-\x20g:g0.size.z'
                            }
                        }, {
                            'type': 'wall',
                            'id': 'wall_back',
                            'spec': {
                                'material': {
                                    'group': 'g1'
                                },
                                'orientation': 'f',
                                'type': 'common',
                                'key': 'left'
                            },
                            'pos': {
                                'z': 0x0
                            },
                            'active': 0x1,
                            'size': {
                                'x': 's:x',
                                'y': 's:y'
                            },
                            'pivot': {
                                'z': 0x1
                            }
                        }]
                    }, {
                        'type': 'section',
                        'name': 'cokol',
                        'id': 'section_cokol',
                        'size': {
                            'x': 's:x',
                            'y': 's:y',
                            'z': 's:z'
                        },
                        'children': [{
                            'type': 'cokol',
                            'id': 'cokol_front',
                            'spec': {
                                'type': 'common',
                                'key': 'front'
                            },
                            'visible': 0x1,
                            'size': {
                                'x': 's:x'
                            },
                            'pivot': {
                                'z': 0x1
                            },
                            'pos': {
                                'z': 's:z\x20-\x20v:c_offset'
                            }
                        }, {
                            'type': 'cokol',
                            'id': 'cokol_left',
                            'spec': {
                                'type': 'common',
                                'key': 'left'
                            },
                            'visible': 0x0,
                            'size': {
                                'x': 's:z\x20-\x20v:c_offset\x20-\x20v:c_thick'
                            },
                            'rot': {
                                'y': 0x5a
                            },
                            'pivot': {
                                'z': 0x1
                            },
                            'pos': {
                                'z': 0x0
                            }
                        }, {
                            'type': 'cokol',
                            'id': 'cokol_right',
                            'spec': {
                                'type': 'common',
                                'key': 'right'
                            },
                            'visible': 0x0,
                            'size': {
                                'x': 's:z\x20-\x20v:c_offset\x20-\x20v:c_thick'
                            },
                            'rot': {
                                'y': 0x5a
                            },
                            'pivot': {
                                'z': -0x1
                            },
                            'pos': {
                                'x': 's:x'
                            }
                        }, {
                            'type': 'cokol',
                            'id': 'cokol_back',
                            'spec': {
                                'type': 'common',
                                'key': 'back'
                            },
                            'visible': 0x0,
                            'size': {
                                'x': 's:x'
                            },
                            'pos': {
                                'z': 'v:c_offset'
                            }
                        }]
                    }]
                }]
            },
            'variables': {
                'wall_d': {
                    'name': 'Расстояние\x20от\x20стены',
                    'key': 'wall_d',
                    'type': 'number',
                    'local': 0x0,
                    'editable': 0x1,
                    'variants': 0x0,
                    'params': {}
                },
                'left_wall': {
                    'key': 'type',
                    'value': 'w'
                },
                'right_wall': {
                    'key': 'type',
                    'value': 'w'
                }
            }
        }
    }],
    'corner_straight_bottom_right': [{
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
        'v': 0x1,
        'template': {
            'tree': {
                'type': 'section',
                'name': 'cabinet',
                'size': {
                    'x': 's:x',
                    'y': 's:y',
                    'z': 's:z'
                },
                'children': [{
                    'type': 'section',
                    'name': 'cabinet_inner',
                    'id': 'cabinet_inner',
                    'size': {
                        'x': 's:x',
                        'y': 's:y',
                        'z': 's:z\x20-\x20v:wall_d\x20-\x20v:tof'
                    },
                    'pos': {
                        'z': 'v:wall_d'
                    },
                    'children': [{
                        'type': 'section',
                        'name': 'walls',
                        'id': 'section_walls',
                        'size': {
                            'x': 's:x',
                            'y': 's:y',
                            'z': 's:z'
                        },
                        'pos': {
                            'y': 'v:c_height'
                        },
                        'children': [{
                            'type': 'wall',
                            'id': 'wall_bottom',
                            'spec': {
                                'material': {},
                                'orientation': 'h',
                                'type': 'common',
                                'key': 'bottom'
                            },
                            'active': 0x1,
                            'size': {
                                'x': 's:x',
                                'y': 's:z'
                            }
                        }, {
                            'type': 'wall',
                            'id': 'wall_top',
                            'spec': {
                                'material': {},
                                'orientation': 'h',
                                'type': 'common',
                                'key': 'top'
                            },
                            'condition': [[{
                                'f': 's:y',
                                'o': '>=',
                                'v': 0x4b0
                            }]],
                            'active': 0x1,
                            'size': {
                                'x': 's:x\x20-\x20g:g0.size.z\x20*\x202',
                                'y': 's:z'
                            },
                            'pos': {
                                'x': 's:x\x20/\x202',
                                'y': 's:y'
                            },
                            'pivot': {
                                'x': 0x0,
                                'y': 0x1
                            }
                        }, {
                            'type': 'wall',
                            'id': 'wall_left',
                            'spec': {
                                'material': {},
                                'orientation': 'v',
                                'type': 'common',
                                'key': 'left'
                            },
                            'pos': {
                                'y': 'g:g0.size.z'
                            },
                            'active': 0x1,
                            'size': {
                                'x': 's:z',
                                'y': 's:y\x20-\x20g:g0.size.z'
                            }
                        }, {
                            'type': 'wall',
                            'id': 'wall_right',
                            'spec': {
                                'material': {},
                                'type': 'common',
                                'key': 'right',
                                'orientation': 'v'
                            },
                            'active': 0x1,
                            'pos': {
                                'x': 's:x',
                                'y': 'g:g0.size.z'
                            },
                            'pivot': {
                                'x': 0x1
                            },
                            'size': {
                                'x': 's:z',
                                'y': 's:y\x20-\x20g:g0.size.z'
                            }
                        }, {
                            'type': 'wall',
                            'id': 'wall_back',
                            'spec': {
                                'material': {
                                    'group': 'g1'
                                },
                                'orientation': 'f',
                                'type': 'common',
                                'key': 'left'
                            },
                            'pos': {
                                'z': 0x0
                            },
                            'active': 0x1,
                            'size': {
                                'x': 's:x',
                                'y': 's:y'
                            },
                            'pivot': {
                                'z': 0x1
                            }
                        }]
                    }, {
                        'type': 'section',
                        'name': 'cokol',
                        'id': 'section_cokol',
                        'size': {
                            'x': 's:x',
                            'y': 's:y',
                            'z': 's:z'
                        },
                        'children': [{
                            'type': 'cokol',
                            'id': 'cokol_front',
                            'spec': {
                                'type': 'common',
                                'key': 'front'
                            },
                            'visible': 0x1,
                            'size': {
                                'x': 's:x'
                            },
                            'pivot': {
                                'z': 0x1
                            },
                            'pos': {
                                'z': 's:z\x20-\x20v:c_offset'
                            }
                        }, {
                            'type': 'cokol',
                            'id': 'cokol_left',
                            'spec': {
                                'type': 'common',
                                'key': 'left'
                            },
                            'visible': 0x0,
                            'size': {
                                'x': 's:z\x20-\x20v:c_offset\x20-\x20v:c_thick'
                            },
                            'rot': {
                                'y': 0x5a
                            },
                            'pivot': {
                                'z': 0x1
                            },
                            'pos': {
                                'z': 0x0
                            }
                        }, {
                            'type': 'cokol',
                            'id': 'cokol_right',
                            'spec': {
                                'type': 'common',
                                'key': 'right'
                            },
                            'visible': 0x0,
                            'size': {
                                'x': 's:z\x20-\x20v:c_offset\x20-\x20v:c_thick'
                            },
                            'rot': {
                                'y': 0x5a
                            },
                            'pivot': {
                                'z': -0x1
                            },
                            'pos': {
                                'x': 's:x'
                            }
                        }, {
                            'type': 'cokol',
                            'id': 'cokol_back',
                            'spec': {
                                'type': 'common',
                                'key': 'back'
                            },
                            'visible': 0x0,
                            'size': {
                                'x': 's:x'
                            },
                            'pos': {
                                'z': 'v:c_offset'
                            }
                        }]
                    }]
                }]
            },
            'variables': {
                'wall_d': {
                    'name': 'Расстояние\x20от\x20стены',
                    'key': 'wall_d',
                    'type': 'number',
                    'local': 0x0,
                    'editable': 0x1,
                    'variants': 0x0,
                    'params': {}
                },
                'offset': {
                    'key': 'offset',
                    'value': 0xa
                },
                'left_wall': {
                    'key': 'type',
                    'value': 'w'
                },
                'right_wall': {
                    'key': 'type',
                    'value': 'w'
                }
            }
        }
    }],
    'corner_90_bottom_right': [{
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
        'v': 0x1,
        'template': {
            'tree': {
                'type': 'section',
                'name': 'cabinet',
                'id': 'cabinet_sec',
                'size': {
                    'x': 's:x',
                    'y': 's:y',
                    'z': 'v:c_w2'
                },
                'pos': {
                    'z': 0x0
                },
                'pivot': {
                    'x': -0x1,
                    'y': -0x1,
                    'z': -0x1
                },
                'children': [{
                    'type': 'section',
                    'name': 'cabinet_inner',
                    'id': 'cabinet_inner',
                    'size': {
                        'x': 's:x\x20-\x20v:tol\x20-\x20v:wall_d',
                        'y': 's:y',
                        'z': 's:z\x20-\x20v:wall_d\x20'
                    },
                    'pos': {
                        'x': 'v:tol',
                        'z': 'v:wall_d'
                    },
                    'children': [{
                        'type': 'section',
                        'name': 'walls',
                        'id': 'section_walls',
                        'size': {
                            'x': 's:x',
                            'y': 's:y',
                            'z': 's:z'
                        },
                        'pos': {
                            'y': 'v:c_height'
                        },
                        'children': [{
                            'type': 'wall',
                            'id': 'wall_back',
                            'spec': {
                                'material': {
                                    'group': 'g0'
                                },
                                'orientation': 'f',
                                'type': 'common',
                                'key': 'left'
                            },
                            'pos': {
                                'z': 0x0
                            },
                            'active': 0x1,
                            'size': {
                                'x': 's:x',
                                'y': 's:y'
                            },
                            'pivot': {
                                'z': -0x1
                            }
                        }, {
                            'type': 'wall',
                            'id': 'wall_back_2',
                            'spec': {
                                'material': {
                                    'group': 'g1'
                                },
                                'orientation': 'v',
                                'type': 'common',
                                'key': 'left'
                            },
                            'pos': {
                                'x': 's:x'
                            },
                            'active': 0x1,
                            'size': {
                                'x': 's:z',
                                'y': 's:y'
                            },
                            'pivot': {
                                'x': -0x1
                            }
                        }, {
                            'type': 'wall',
                            'id': 'wall_side_1',
                            'spec': {
                                'material': {
                                    'group': 'g0'
                                },
                                'orientation': 'v',
                                'type': 'common',
                                'key': 'left'
                            },
                            'pos': {
                                'x': 0x0,
                                'z': 0x0
                            },
                            'active': 0x1,
                            'size': {
                                'x': 'v:fsz\x20-\x20v:wall_d\x20-\x20v:tof',
                                'y': 's:y'
                            },
                            'pivot': {
                                'x': -0x1,
                                'z': -0x1
                            }
                        }, {
                            'type': 'wall',
                            'id': 'wall_side_2',
                            'spec': {
                                'material': {
                                    'group': 'g0'
                                },
                                'orientation': 'f',
                                'type': 'common',
                                'key': 'left'
                            },
                            'pos': {
                                'x': 's:x',
                                'z': 's:z'
                            },
                            'active': 0x1,
                            'size': {
                                'x': 'v:c_d2\x20-\x20v:wall_d\x20-\x20v:tof',
                                'y': 's:y'
                            },
                            'pivot': {
                                'x': 0x1,
                                'z': 0x1
                            }
                        }, {
                            'type': 'wall',
                            'id': 'wall_bottom',
                            'spec': {
                                'material': {},
                                'orientation': 'h',
                                'type': 'free',
                                'type_params': {
                                    'points': [{
                                        'x': 's:x',
                                        'y': 0x0
                                    }, {
                                        'x': 's:x',
                                        'y': 's:z'
                                    }, {
                                        'x': 's:x\x20-\x20(\x20v:c_d2\x20-\x20v:wall_d\x20-\x20v:tof\x20)',
                                        'y': 's:z'
                                    }, {
                                        'x': 's:x\x20-\x20(\x20v:c_d2\x20-\x20v:wall_d\x20-\x20v:tof\x20)',
                                        'y': '(\x20v:fsz\x20-\x20v:wall_d\x20-\x20v:tof\x20)'
                                    }, {
                                        'x': '0',
                                        'y': '(\x20v:fsz\x20-\x20v:wall_d\x20-\x20v:tof\x20)'
                                    }]
                                },
                                'key': 'bottom'
                            },
                            'active': 0x1,
                            'size': {
                                'x': 's:x',
                                'y': 's:z'
                            }
                        }]
                    }, {
                        'type': 'section',
                        'name': 'cokol',
                        'id': 'section_cokol',
                        'size': {
                            'x': 's:x',
                            'y': 's:y',
                            'z': 's:z'
                        },
                        'children': [{
                            'type': 'cokol',
                            'id': 'cokol_front',
                            'spec': {
                                'type': 'common',
                                'key': 'front'
                            },
                            'visible': 0x1,
                            'size': {
                                'x': 's:x'
                            },
                            'pivot': {
                                'z': 0x1
                            },
                            'pos': {
                                'z': 's:z\x20-\x20v:c_offset'
                            }
                        }, {
                            'type': 'cokol',
                            'id': 'cokol_left',
                            'spec': {
                                'type': 'common',
                                'key': 'left'
                            },
                            'visible': 0x0,
                            'size': {
                                'x': 's:z\x20-\x20v:c_offset\x20*\x202'
                            },
                            'rot': {
                                'y': 0x5a
                            },
                            'pivot': {
                                'z': 0x1
                            },
                            'pos': {
                                'z': 'v:c_offset'
                            }
                        }, {
                            'type': 'cokol',
                            'id': 'cokol_right',
                            'spec': {
                                'type': 'common',
                                'key': 'right'
                            },
                            'visible': 0x0,
                            'size': {
                                'x': 's:z\x20-\x20v:c_offset\x20*\x202'
                            },
                            'rot': {
                                'y': -0x5a
                            },
                            'pivot': {
                                'z': 0x1
                            },
                            'pos': {
                                'x': 's:x',
                                'z': 's:z\x20-\x20v:c_offset'
                            }
                        }, {
                            'type': 'cokol',
                            'id': 'cokol_back',
                            'spec': {
                                'type': 'common',
                                'key': 'back'
                            },
                            'visible': 0x0,
                            'size': {
                                'x': 's:x'
                            },
                            'pos': {
                                'z': 'v:c_offset'
                            }
                        }]
                    }]
                }, {
                    'type': 'tabletop',
                    'id': 'tabletop1',
                    'size': {
                        'x': 's:x',
                        'y': 'v:fsz'
                    },
                    'pivot': {
                        'x': -0x1,
                        'y': -0x1
                    },
                    'pos': {
                        'x': 0x0,
                        'y': 's:y\x20+\x20v:c_height'
                    }
                }, {
                    'type': 'tabletop',
                    'id': 'tabletop2',
                    'size': {
                        'x': 's:z\x20-\x20v:fsz',
                        'y': 'v:c_d2'
                    },
                    'pivot': {
                        'x': 0x1,
                        'y': -0x1
                    },
                    'rot': {
                        'y': 0x5a
                    },
                    'pos': {
                        'x': 's:x',
                        'z': 's:z',
                        'y': 's:y\x20+\x20v:c_height'
                    },
                    'spec': {
                        'material': {
                            'id': '1'
                        }
                    }
                }]
            },
            'variables': {
                'wall_d': {
                    'name': 'Расстояние\x20от\x20стены',
                    'key': 'wall_d',
                    'type': 'number',
                    'local': 0x0,
                    'editable': 0x1,
                    'variants': 0x0,
                    'params': {}
                },
                'left_wall': {
                    'key': 'type',
                    'value': 'w'
                },
                'right_wall': {
                    'key': 'type',
                    'value': 'w'
                }
            }
        }
    }]
}
  , cab_temps = {
    'common_bottom': {
        'tree': [{
            'type': 'section',
            'name': 'cabinet_inner',
            'id': 'cabinet_inner',
            'size': {
                'x': 's:x',
                'y': 's:y',
                'z': 's:z'
            },
            'pos': {
                'x': 0x0,
                'y': 0x0,
                'z': 0x0
            },
            'children': [{
                'type': 'section',
                'name': 'walls',
                'id': 'section_walls',
                'size': {
                    'x': 's:x',
                    'y': 's:y',
                    'z': 's:z'
                },
                'children': [{
                    'type': 'wall',
                    'id': 'wall_bottom',
                    'spec': {
                        'material': {},
                        'orientation': 'h',
                        'type': 'common',
                        'key': 'bottom'
                    },
                    'active': 0x1,
                    'size': {
                        'x': 's:x',
                        'y': 's:z'
                    }
                }, {
                    'type': 'wall',
                    'id': 'tsarg_front',
                    'spec': {
                        'material': {},
                        'orientation': 'h',
                        'type': 'common',
                        'key': 'top'
                    },
                    'active': 0x1,
                    'size': {
                        'x': 's:x\x20-\x20g:g0.size.z\x20*\x202',
                        'y': 'v:tsw'
                    },
                    'pos': {
                        'x': 's:x\x20/\x202',
                        'y': 's:y',
                        'z': 's:z'
                    },
                    'pivot': {
                        'x': 0x0,
                        'y': 0x1,
                        'z': 0x1
                    }
                }, {
                    'type': 'wall',
                    'id': 'tsarg_back',
                    'spec': {
                        'material': {},
                        'orientation': 'h',
                        'type': 'common',
                        'key': 'top'
                    },
                    'active': 0x1,
                    'size': {
                        'x': 's:x\x20-\x20g:g0.size.z\x20*\x202',
                        'y': 'v:_tsw'
                    },
                    'pos': {
                        'x': 's:x\x20/\x202',
                        'y': 's:y'
                    },
                    'pivot': {
                        'x': 0x0,
                        'y': 0x1,
                        'z': -0x1
                    }
                }, {
                    'type': 'wall',
                    'id': 'wall_left',
                    'spec': {
                        'material': {},
                        'orientation': 'v',
                        'type': 'common',
                        'key': 'left'
                    },
                    'pos': {
                        'y': 'g:g0.size.z'
                    },
                    'pivot': {
                        'x': -0x1
                    },
                    'active': 0x1,
                    'size': {
                        'x': 's:z',
                        'y': 's:y\x20-\x20g:g0.size.z'
                    }
                }, {
                    'type': 'wall',
                    'id': 'wall_right',
                    'spec': {
                        'material': {},
                        'type': 'common',
                        'key': 'right',
                        'orientation': 'v'
                    },
                    'active': 0x1,
                    'pos': {
                        'x': 's:x',
                        'y': 'g:g0.size.z'
                    },
                    'pivot': {
                        'x': 0x1
                    },
                    'size': {
                        'x': 's:z',
                        'y': 's:y\x20-\x20g:g0.size.z'
                    }
                }, {
                    'type': 'wall',
                    'id': 'wall_back',
                    'spec': {
                        'material': {
                            'group': 'g1'
                        },
                        'orientation': 'f',
                        'type': 'common',
                        'key': 'left'
                    },
                    'pos': {
                        'z': 0x0
                    },
                    'active': 0x1,
                    'size': {
                        'x': 's:x',
                        'y': 's:y'
                    },
                    'pivot': {
                        'z': -0x1
                    },
                    'condition': [[{
                        'f': 'v:_bw',
                        'o': '!=',
                        'v': 0x0
                    }]]
                }]
            }, {
                'type': 'section',
                'name': 'cokol',
                'id': 'section_cokol',
                'size': {
                    'x': 's:x',
                    'y': 's:y',
                    'z': 's:z'
                },
                'children': [{
                    'type': 'cokol',
                    'id': 'cokol_front',
                    'spec': {
                        'type': 'common',
                        'key': 'front'
                    },
                    'toggle': {
                        'enabled': 0x1,
                        'value': 0x1,
                        'key': 'cokol_front',
                        'group': 'Цоколь',
                        'name': 'Спереди'
                    },
                    'size': {
                        'x': 's:x'
                    },
                    'pivot': {
                        'z': 0x1
                    },
                    'pos': {
                        'z': 's:z\x20-\x20v:c_offset'
                    }
                }, {
                    'type': 'cokol',
                    'id': 'cokol_left',
                    'spec': {
                        'type': 'common',
                        'key': 'left'
                    },
                    'toggle': {
                        'enabled': 0x1,
                        'value': 0x0,
                        'key': 'cokol_left',
                        'group': 'Цоколь',
                        'name': 'Слева'
                    },
                    'size': {
                        'x': 's:z\x20-\x20v:c_offset\x20*\x202'
                    },
                    'rot': {
                        'y': 0x5a
                    },
                    'pivot': {
                        'z': 0x1
                    },
                    'pos': {
                        'z': 'v:c_offset'
                    }
                }, {
                    'type': 'cokol',
                    'id': 'cokol_right',
                    'spec': {
                        'type': 'common',
                        'key': 'right'
                    },
                    'toggle': {
                        'enabled': 0x1,
                        'value': 0x0,
                        'key': 'cokol_right',
                        'group': 'Цоколь',
                        'name': 'Справа'
                    },
                    'size': {
                        'x': 's:z\x20-\x20v:c_offset\x20*\x202'
                    },
                    'rot': {
                        'y': -0x5a
                    },
                    'pivot': {
                        'z': 0x1
                    },
                    'pos': {
                        'x': 's:x',
                        'z': 's:z\x20-\x20v:c_offset'
                    }
                }, {
                    'type': 'cokol',
                    'id': 'cokol_back',
                    'spec': {
                        'type': 'common',
                        'key': 'back'
                    },
                    'toggle': {
                        'enabled': 0x1,
                        'value': 0x0,
                        'key': 'cokol_back',
                        'group': 'Цоколь',
                        'name': 'Сзади'
                    },
                    'size': {
                        'x': 's:x'
                    },
                    'pos': {
                        'z': 'v:c_offset'
                    }
                }]
            }, {
                'type': 'section',
                'name': 'doors',
                'id': 'section_doors',
                'size': {
                    'x': 's:x',
                    'y': 's:y',
                    'z': 's:z'
                },
                'pivot': {
                    'z': -0x1
                },
                'pos': {
                    'y': 'v:c_height',
                    'z': 's:z'
                },
                'children': [{
                    'type': 'compound',
                    'name': 'Door',
                    'spec': {
                        'id': '_door_rtl'
                    },
                    'size': {
                        'x': 's:x',
                        'y': 's:y',
                        'z': 's:z'
                    },
                    'pos': {
                        'y': 0x0
                    }
                }, {
                    'type': 'compound',
                    'name': 'Door',
                    'spec': {
                        'id': '_door_ltr'
                    },
                    'size': {
                        'x': 's:x',
                        'y': 's:y',
                        'z': 's:z'
                    },
                    'pos': {
                        'x': 's:x'
                    }
                }]
            }, {
                'type': 'section',
                'name': 'cokol',
                'id': 'section_cokol',
                'size': {
                    'x': 's:x',
                    'y': 's:y',
                    'z': 's:z'
                },
                'children': [{
                    'type': 'leg',
                    'id': 'leg1',
                    'spec': {
                        'type': 'common',
                        'key': 'front'
                    },
                    'size': {
                        'y': 'v:c_height'
                    },
                    'pivot': {
                        'z': -0x1
                    },
                    'pos': {
                        'x': 0x0,
                        'z': 0x0
                    }
                }, {
                    'type': 'leg',
                    'id': 'leg2',
                    'spec': {
                        'type': 'common',
                        'key': 'front'
                    },
                    'size': {
                        'y': 'v:c_height'
                    },
                    'pivot': {
                        'z': -0x1,
                        'x': 0x1
                    },
                    'pos': {
                        'x': 's:x',
                        'z': 0x0
                    }
                }, {
                    'type': 'leg',
                    'id': 'leg3',
                    'spec': {
                        'type': 'common',
                        'key': 'front'
                    },
                    'size': {
                        'y': 'v:c_height'
                    },
                    'pivot': {
                        'z': 0x1,
                        'x': 0x1
                    },
                    'pos': {
                        'x': 's:x',
                        'z': 's:z'
                    }
                }, {
                    'type': 'leg',
                    'id': 'leg4',
                    'spec': {
                        'type': 'common',
                        'key': 'front'
                    },
                    'size': {
                        'y': 'v:c_height'
                    },
                    'pivot': {
                        'z': 0x1,
                        'x': -0x1
                    },
                    'pos': {
                        'x': 0x0,
                        'z': 's:z'
                    }
                }]
            }]
        }],
        'variables': {}
    }
}
  , old_mod_def_params = {
    'cabinet_group': 'bottom',
    'cabinet_type': 'common',
    'selected_variant': 0x0,
    'name': '',
    'code': '',
    'price': 0x0,
    'free_size': 0x1,
    'comments': '',
    'accessories_list': [],
    'accessories_default': [],
    'accessories_variant': [],
    'accessories_types': {},
    'accessories_comments': [],
    'accessories_comments_string': '',
    'fixed_facade_material': null,
    'facades_group': 'bottom',
    'shelves_auto': 0x0,
    'shelves_auto_count': 'auto',
    'shelves_glass': 0x0,
    'models': [],
    'facade': void 0x0,
    'sizes_limit': {
        'min_width': 0x0,
        'max_width': 0x0,
        'min_height': 0x0,
        'max_height': 0x0,
        'min_depth': 0x0,
        'max_depth': 0x0
    },
    'custom_data': {},
    'changed_to_top': 0x0,
    'auto_rotation': 0x1,
    'fly_height': 0x0,
    'cabinet': {
        'width': 0x258,
        'height': 0x2d0,
        'depth': 0x258,
        'thickness': 0x10,
        'thickness_back': 0x3,
        'tsarg_width': 0x64,
        'force_top_wall': 0x0,
        'back_wall_offset': 0x0,
        'width2': void 0x0,
        'depth2': void 0x0,
        'orientation': 'right',
        'material': void 0x0,
        'materials': [],
        'back_wall_material': void 0x0,
        'is_penal': !0x1,
        'type': 'common',
        'inner_radius': !0x1,
        'corner_right_wall_width': void 0x0,
        'corner_straight_front_facade_material': 'facade',
        'corner_straight_front_wall_width': void 0x0,
        'corner_straight_front_facade_width': 0x78,
        'corner_straight_side_connect_width': 0x0,
        'corner_straight_facade_only': 0x0,
        'corner_straight_side_back_wall_position': 0x32,
        'corner_straight_side_facade_position': 0x19f,
        'corner_straight_front_wall_active': 0x1,
        'corner_straight_side_back_wall_active': 0x1,
        'corner_straight_side_facade_wall_active': 0x1,
        'corner_straight_side_facade_active': 0x1,
        'end_corner_width': 0xc8,
        'end_corner_depth': 0x0,
        'end_corner_side_wall_width': 0x0,
        'end_corner_side_wall': !0x1,
        'end_radius': 0x0,
        'end_side_wall': 'to_wall',
        'bottom_wall': !0x0,
        'top_wall': !0x0,
        'left_wall': !0x0,
        'right_wall': !0x0,
        'back_wall': !0x0,
        'front_wall': !0x1,
        'bottom_baluster': !0x1,
        'top_baluster_front': !0x1,
        'top_baluster_left': !0x1,
        'top_baluster_right': !0x1,
        'is_double': 0x0,
        'is_triple': 0x0,
        'original_height': 0x0,
        'offset': {
            'left': 0x0,
            'right': 0x0,
            'back': 0x0,
            'side': 0x0
        },
        'sides': {
            'left': {
                'fac_id': 0x0,
                'mat_id': 0x0,
                'style': 'full'
            },
            'right': {
                'fac_id': 0x0,
                'mat_id': 0x0,
                'style': 'full'
            }
        },
        'include_cokol': 0x1
    },
    'tabletop': {
        'tabletop_id': 0x0,
        'tabletop_variant': 0x0,
        'active': !0x0,
        'autogen': !0x0,
        'height': 0x26,
        'depth': 0x258,
        'offset': {
            'left': 0x0,
            'right': 0x0,
            'front': 0x0,
            'back': 0x0
        },
        'plints': {
            'back': !0x0,
            'right': !0x1,
            'left': !0x1
        },
        'plints_material': 0x0,
        'plints_enabled': !0x0,
        'holes': void 0x0,
        'visible': !0x0,
        'material': 0x0,
        'end_corner_cut_width': 0x0,
        'end_corner_cut_depth': 0x0,
        'end_radius': 0x0
    },
    'cokol': {
        'enabled': !0x0,
        'height': 0x64,
        'thickness': 0x10,
        'material': 0x0,
        'legs': !0x0,
        'visible': {
            'left': !0x1,
            'right': !0x1,
            'back': !0x1,
            'front': !0x0
        },
        'vis': {},
        'lock_params': 0x0,
        'fixed': 0x0,
        'disabled': !0x1,
        'is_cokol_active': !0x1,
        'active': !0x0,
        'model': void 0x0,
        'model_raidus': void 0x0,
        'height_backup': 0x0
    },
    'leg': {
        'enabled': !0x0,
        'material': 0x0
    },
    'cokol_top': {
        'enabled': !0x0,
        'height': 0x32,
        'left': !0x1,
        'front': !0x1,
        'right': !0x1,
        'material': 0x0
    },
    'cornice': {
        'active': !0x0,
        'level': 0x1,
        'enabled': !0x0,
        'available': void 0x0,
        'force': !0x1,
        'model': 0x0,
        'visible': {
            'left': !0x1,
            'right': !0x1,
            'back': !0x1,
            'front': !0x1
        },
        'material': 0x0,
        'offset_front': 0x0,
        'offset_back': 0x0,
        'offset_left': 0x0,
        'offset_right': 0x0,
        'front_offset': 0x0,
        'side_offset': 0x0
    },
    'doors': [],
    'lockers': [],
    'shelves': [],
    'walls': [],
    'decorations': [],
    'sections': [],
    'back_walls': [],
    'oven': {
        'active': !0x1,
        'model': 0x1e8480,
        'pY': void 0x0
    },
    'hob': {
        'active': !0x1,
        'model': 0x2dc6c0
    },
    'sink': {
        'active': !0x1,
        'model': 0x3d0900,
        'available': !0x0
    },
    'washer': {},
    'fixed_models': {},
    'built_in_models': {},
    'variants': []
};
function add_module_converted(f=0x1) {
    var g, h = sc['add_object']('module', {
        'type': 'module',
        'size': {
            'x': 0x1c2,
            'y': 0x2d0,
            'z': 0x258
        },
        'spec': {
            'variants': [{
                'size': {
                    'x': 0x1c2,
                    'y': 0x2d0,
                    'z': 0x217
                }
            }],
            'templates': [{
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
                'template': {
                    'tree': [{
                        'type': 'section',
                        'name': ':corpus',
                        'active': 0x1,
                        'size': {
                            'x': 's:x',
                            'y': 's:y',
                            'z': 's:z\x20-\x20v:_bwo\x20-\x20v:_tfo'
                        },
                        'pos': {
                            'z': 'v:_bwo'
                        },
                        'children': [{
                            'type': 'section',
                            'name': ':walls',
                            'active': 0x1,
                            'size': {
                                'x': 's:x',
                                'y': 's:y',
                                'z': 's:z'
                            },
                            'children': [{
                                'type': 'wall',
                                'active': 0x1,
                                'spec': {
                                    'name': ':bottom_wall',
                                    'orientation': 'h',
                                    'material': {
                                        'group': 'g0'
                                    },
                                    'butts': [{
                                        'spec': {
                                            'id': 0x1,
                                            'variant_id': 0xd,
                                            'key': 'butts',
                                            'face_index': 0x0
                                        }
                                    }, {
                                        'spec': {
                                            'id': 0x1,
                                            'variant_id': 0xd,
                                            'key': 'butts',
                                            'face_index': 0x1
                                        }
                                    }, {
                                        'spec': {
                                            'id': 0x1,
                                            'key': 'butts',
                                            'variant_id': 0xd,
                                            'face_index': 0x2
                                        }
                                    }, {
                                        'spec': {
                                            'id': 0x1,
                                            'key': 'butts',
                                            'variant_id': 0xd,
                                            'face_index': 0x3
                                        }
                                    }]
                                },
                                'size': {
                                    'x': 's:x',
                                    'y': 's:y',
                                    'z': 's.z'
                                }
                            }, {
                                'type': 'wall',
                                'active': 0x1,
                                'spec': {
                                    'name': ':bottom_wall2',
                                    'orientation': 'v',
                                    'material': {
                                        'group': 'g0'
                                    },
                                    'points': [{
                                        'x': 0xf,
                                        'y': 0x0
                                    }, {
                                        'x': 0x1e,
                                        'y': 0x0
                                    }, {
                                        'x': 0x2d,
                                        'y': 0x1e
                                    }, {
                                        'x': 0x2d,
                                        'y': 0x32
                                    }, {
                                        'x': 0x1e,
                                        'y': 0x48
                                    }, {
                                        'x': 0xf,
                                        'y': 0x48
                                    }, {
                                        'x': 0x0,
                                        'y': 0x32
                                    }, {
                                        'x': 0x0,
                                        'y': 0x1e
                                    }],
                                    'butts': [{
                                        'spec': {
                                            'id': 0x1,
                                            'variant_id': 0x1,
                                            'key': 'butts',
                                            'face_index': 0x0
                                        }
                                    }, {
                                        'spec': {
                                            'id': 0x2,
                                            'key': 'butts',
                                            'face_index': 0x1
                                        }
                                    }, {
                                        'spec': {
                                            'id': 0x2,
                                            'key': 'butts',
                                            'face_index': 0x2
                                        }
                                    }, {
                                        'spec': {
                                            'id': 0x2,
                                            'key': 'butts',
                                            'face_index': 0x3
                                        }
                                    }, {
                                        'spec': {
                                            'id': 0x1,
                                            'key': 'butts',
                                            'face_index': 0x4
                                        }
                                    }, {
                                        'spec': {
                                            'id': 0x1,
                                            'key': 'butts',
                                            'face_index': 0x5
                                        }
                                    }, {
                                        'spec': {
                                            'id': 0x1,
                                            'key': 'butts',
                                            'face_index': 0x6
                                        }
                                    }, {
                                        'spec': {
                                            'id': 0x1,
                                            'key': 'butts',
                                            'face_index': 0x7
                                        }
                                    }]
                                },
                                'size': {
                                    'x': 's:x',
                                    'y': 's:y',
                                    'z': 's.z'
                                },
                                'pos': {
                                    'x': 0x258
                                }
                            }, {
                                'name': ':top_wall',
                                'spec': {
                                    'id': '1',
                                    'element_type': 'top_wall',
                                    'can_change': {
                                        'id': 0x1
                                    }
                                },
                                'active': 0x1,
                                'type': 'module',
                                'size': {
                                    'x': 's:x\x20-\x20g:g0.thickness\x20*\x202',
                                    'y': 's:y',
                                    'z': 's.z'
                                },
                                'pos': {
                                    'x': 'g:g0.thickness',
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
                                },
                                'c_rot': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': 0x0
                                }
                            }, {
                                'name': ':left_wall',
                                'spec': {
                                    'id': '1',
                                    'element_type': 'side_wall',
                                    'can_change': {
                                        'id': 0x1
                                    }
                                },
                                'active': 0x1,
                                'type': 'module',
                                'size': {
                                    'x': 's:x',
                                    'y': 's:y',
                                    'z': 's.z'
                                },
                                'pos': {
                                    'x': '0',
                                    'y': '0',
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
                                },
                                'c_rot': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': 0x0
                                }
                            }, {
                                'name': ':right_wall',
                                'spec': {
                                    'id': '1',
                                    'element_type': 'side_wall',
                                    'can_change': {
                                        'id': 0x1
                                    }
                                },
                                'active': 0x1,
                                'type': 'module',
                                'size': {
                                    'x': 's:x',
                                    'y': 's:y',
                                    'z': 's.z'
                                },
                                'pos': {
                                    'x': 's:x',
                                    'y': '0',
                                    'z': 0x0
                                },
                                'pivot': {
                                    'x': 0x1,
                                    'y': -0x1,
                                    'z': -0x1
                                },
                                'rot': {
                                    'x': 0x0,
                                    'y': '0',
                                    'z': 0x0
                                },
                                'c_rot': {
                                    'x': 0x0,
                                    'y': '180',
                                    'z': 0x0
                                }
                            }, {
                                'name': ':back_wall',
                                'spec': {
                                    'id': '1',
                                    'element_type': 'back_wall',
                                    'can_change': {
                                        'id': 0x1
                                    }
                                },
                                'active': 0x1,
                                'type': 'module',
                                'size': {
                                    'x': 's:x',
                                    'y': 's:y',
                                    'z': 's.z'
                                },
                                'pos': {
                                    'x': 0x0,
                                    'y': '0',
                                    'z': 0x0
                                },
                                'pivot': {
                                    'x': -0x1,
                                    'y': -0x1,
                                    'z': -0x1
                                },
                                'rot': {
                                    'x': 0x0,
                                    'y': '0',
                                    'z': 0x0
                                },
                                'c_rot': {
                                    'x': 0x0,
                                    'y': '0',
                                    'z': 0x0
                                },
                                'toggle': {
                                    'enabled': 0x1,
                                    'value': 0x1,
                                    'key': 'bw',
                                    'group': 'Задняя\x20стенка',
                                    'name': 'Задняя\x20стенка',
                                    'order': 0x1
                                }
                            }]
                        }, {
                            'type': 'section',
                            'name': ':lockers',
                            'active': 0x0,
                            'size': {
                                'x': 's:x',
                                'y': 's:y',
                                'z': 's:z'
                            },
                            'pos': {
                                'x': 0x0,
                                'y': 0x0,
                                'z': 's:z'
                            },
                            'pivot': {
                                'x': -0x1,
                                'y': -0x1,
                                'z': 0x1
                            },
                            'children': [{
                                'name': ':locker',
                                'spec': {
                                    'id': '1',
                                    'element_type': 'locker',
                                    'can_change': {
                                        'id': 0x1
                                    }
                                },
                                'active': 0x1,
                                'type': 'module',
                                'size': {
                                    'x': 's:x',
                                    'y': 's:y\x20/\x202',
                                    'z': 's:z'
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
                                },
                                'c_rot': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': 0x0
                                }
                            }, {
                                'name': ':locker',
                                'spec': {
                                    'id': '1',
                                    'element_type': 'locker',
                                    'can_change': {
                                        'id': 0x1
                                    }
                                },
                                'active': 0x1,
                                'type': 'module',
                                'size': {
                                    'x': 's:x',
                                    'y': 's:y\x20/\x204',
                                    'z': 's:z'
                                },
                                'pos': {
                                    'x': 0x0,
                                    'y': 's:y\x20/\x202',
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
                                },
                                'c_rot': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': 0x0
                                }
                            }, {
                                'name': ':locker',
                                'spec': {
                                    'id': '1',
                                    'element_type': 'locker',
                                    'can_change': {
                                        'id': 0x1
                                    }
                                },
                                'active': 0x1,
                                'type': 'module',
                                'size': {
                                    'x': 's:x',
                                    'y': 's:y\x20/\x204',
                                    'z': 's:z'
                                },
                                'pos': {
                                    'x': 0x0,
                                    'y': 's:y\x20/\x202\x20+\x20s:y\x20/\x204',
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
                                },
                                'c_rot': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': 0x0
                                }
                            }]
                        }, {
                            'type': 'section',
                            'name': ':shelves',
                            'active': 0x1,
                            'size': {
                                'x': 's:x\x20-\x20g:g0.thickness\x20*\x202',
                                'y': 's:y\x20\x20-\x20g:g0.thickness\x20*\x202',
                                'z': 's:z\x20-\x20v:_sbo\x20-\x20v:_sfo'
                            },
                            'pos': {
                                'x': 'g:g0.thickness',
                                'y': 'g:g0.thickness',
                                'z': 'v:_sbo'
                            },
                            'pivot': {
                                'x': -0x1,
                                'y': -0x1,
                                'z': -0x1
                            },
                            'children': [{
                                'name': ':shelve',
                                'spec': {
                                    'id': '1',
                                    'element_type': 'shelve',
                                    'can_change': {
                                        'id': 0x1
                                    }
                                },
                                'active': 0x1,
                                'type': 'module',
                                'size': {
                                    'x': 's:x',
                                    'y': 's:y',
                                    'z': 's:z'
                                },
                                'pos': {
                                    'x': 0x0,
                                    'y': 's:y\x20/\x202',
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
                                },
                                'c_rot': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': 0x0
                                }
                            }]
                        }, {
                            'type': 'section',
                            'name': ':doors',
                            'active': 0x1,
                            'size': {
                                'x': 's:x',
                                'y': 's:y',
                                'z': 0x0
                            },
                            'pos': {
                                'z': 's:z'
                            },
                            'pivot': {
                                'x': -0x1,
                                'y': -0x1,
                                'z': -0x1
                            },
                            'children': [{
                                'name': ':door_rtl',
                                'spec': {
                                    'id': '3',
                                    'element_type': 'door',
                                    'can_change': {
                                        'id': 0x1
                                    }
                                },
                                'active': 0x1,
                                'type': 'module',
                                'size': {
                                    'x': 's:x',
                                    'y': 's:y',
                                    'z': 0x0
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
                                },
                                'c_rot': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': 0x0
                                }
                            }]
                        }, {
                            'type': 'section',
                            'name': ':cokol',
                            'active': 0x1,
                            'size': {
                                'x': 's:x',
                                'y': 's:y',
                                'z': 's:z\x20-\x20v:_tfo'
                            },
                            'pos': {
                                'z': 0x0
                            },
                            'children': [{
                                'type': 'cokol',
                                'name': ':cokol_front',
                                'spec': {
                                    'id': '1',
                                    'type': 'common',
                                    'key': 'front'
                                },
                                'toggle': {
                                    'enabled': 0x1,
                                    'value': 0x1,
                                    'key': 'cokol_front',
                                    'group': 'Цоколь',
                                    'name': 'Спереди',
                                    'order': 0x1
                                },
                                'resizable': {
                                    'extend_size': 0x1
                                },
                                'visible': 0x1,
                                'active': 0x1,
                                'size': {
                                    'x': 's:x'
                                },
                                'pos': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': 's:z'
                                },
                                'pivot': {
                                    'x': -0x1,
                                    'y': 0x1,
                                    'z': 0x1
                                },
                                'rot': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': 0x0
                                },
                                'c_rot': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': 0x0
                                },
                                'events': {
                                    'on_before_build': '',
                                    'on_after_build': ''
                                },
                                'comments': ''
                            }, {
                                'type': 'cokol',
                                'name': ':cokol_left',
                                'spec': {
                                    'id': '1',
                                    'type': 'common',
                                    'key': 'front'
                                },
                                'toggle': {
                                    'enabled': 0x1,
                                    'value': 0x1,
                                    'key': 'cokol_left',
                                    'group': 'Цоколь',
                                    'name': 'Слева',
                                    'order': 0x1
                                },
                                'visible': 0x1,
                                'active': 0x1,
                                'size': {
                                    'x': 's:z'
                                },
                                'pos': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': 0x0
                                },
                                'pivot': {
                                    'x': -0x1,
                                    'y': 0x1,
                                    'z': 0x1
                                },
                                'rot': {
                                    'x': 0x0,
                                    'y': 0x5a,
                                    'z': 0x0
                                },
                                'c_rot': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': 0x0
                                },
                                'events': {
                                    'on_before_build': '',
                                    'on_after_build': ''
                                },
                                'comments': ''
                            }, {
                                'type': 'cokol',
                                'name': ':cokol_right',
                                'spec': {
                                    'id': '1',
                                    'type': 'common',
                                    'key': 'front'
                                },
                                'toggle': {
                                    'enabled': 0x1,
                                    'value': 0x1,
                                    'key': 'cokol_right',
                                    'group': 'Цоколь',
                                    'name': 'Слева',
                                    'order': 0x1
                                },
                                'visible': 0x1,
                                'active': 0x1,
                                'size': {
                                    'x': 's:z'
                                },
                                'pos': {
                                    'x': 's:x',
                                    'y': 0x0,
                                    'z': 0x0
                                },
                                'pivot': {
                                    'x': 0x1,
                                    'y': 0x1,
                                    'z': 0x1
                                },
                                'rot': {
                                    'x': 0x0,
                                    'y': -0x5a,
                                    'z': 0x0
                                },
                                'c_rot': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': 0x0
                                },
                                'events': {
                                    'on_before_build': '',
                                    'on_after_build': ''
                                },
                                'comments': ''
                            }]
                        }]
                    }, {
                        'type': 'tabletop',
                        'active': 0x1,
                        'spec': {
                            'name': '',
                            'code': '',
                            'group': 'tabletop',
                            'type': 'common',
                            'can_group': 0x1,
                            'can_euro': 0x1,
                            'type_params': {
                                'corners_equal': 0x1,
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
                            },
                            'cuts': {
                                'connects': [],
                                'len': 0x5dc
                            },
                            'key': '',
                            'shape': null,
                            'material': {
                                'id': 0x1,
                                'variant_id': 0x0
                            },
                            'plints': {
                                'enabled': 0x1,
                                'material': 0x0,
                                'back': 0x1,
                                'right': 0x0,
                                'left': 0x0
                            }
                        },
                        'size': {
                            'x': 's:x',
                            'y': 's:y',
                            'z': 's:z'
                        },
                        'pos': {
                            'y': 's:y',
                            'z': 0x0
                        }
                    }],
                    'variables': {
                        '_bwo': {
                            'name': 'Расстояние\x20от\x20стены',
                            'key': '_bwo',
                            'type': 'number',
                            'local': 0x0,
                            'editable': 0x1,
                            'variants': 0x0,
                            'value': '35',
                            'params': {
                                'min': 0x1,
                                'max': '',
                                'step': 0x1
                            }
                        },
                        '_tfo': {
                            'name': 'Свес\x20столешницы',
                            'key': '_tfo',
                            'type': 'number',
                            'local': 0x0,
                            'editable': 0x1,
                            'variants': 0x0,
                            'value': '35',
                            'params': {
                                'min': 0x1,
                                'max': '',
                                'step': 0x1
                            }
                        },
                        '_tsw': {
                            'name': 'Ширина\x20царг',
                            'key': '_tsw',
                            'type': 'number',
                            'local': 0x0,
                            'editable': 0x1,
                            'variants': 0x0,
                            'value': '100',
                            'params': {
                                'min': 0x1,
                                'max': '',
                                'step': 0x1
                            }
                        },
                        '_sfo': {
                            'name': 'Отступ\x20полок\x20спереди',
                            'key': '_sfo',
                            'type': 'number',
                            'local': 0x0,
                            'editable': 0x1,
                            'variants': 0x0,
                            'value': '15',
                            'params': {
                                'min': 0x1,
                                'max': '',
                                'step': 0x1
                            }
                        },
                        '_sbo': {
                            'name': 'Отступ\x20полок\x20сзади',
                            'key': '_sbo',
                            'type': 'number',
                            'local': 0x0,
                            'editable': 0x1,
                            'variants': 0x0,
                            'value': '0',
                            'params': {
                                'min': 0x1,
                                'max': '',
                                'step': 0x1
                            }
                        }
                    }
                }
            }],
            'cabinet_group': 'bottom',
            'mat_groups': [{
                'key': 'g0',
                'material': {
                    'av_index': 0x0,
                    'id': 0xb7,
                    'key': 'ldsp',
                    'variant_id': 0x0
                },
                'name': 'Корпус',
                'available': [{
                    'key': 'ldsp',
                    'thickness': [],
                    'categories': []
                }]
            }, {
                'key': 'g1',
                'material': {
                    'av_index': 0x0,
                    'key': 'hdf',
                    'variant_id': 0x0
                },
                'name': 'Задняя\x20стенка',
                'available': [{
                    'key': 'hdf',
                    'thickness': [],
                    'categories': []
                }]
            }, {
                'key': 'glass',
                'material': {
                    'av_index': 0x0,
                    'key': 'glass',
                    'variant_id': 0x0
                },
                'name': 'Стекло',
                'available': [{
                    'key': 'glass',
                    'thickness': [],
                    'categories': []
                }]
            }, {
                'key': 'facade',
                'material': {
                    'av_index': 0x0,
                    'id': 0xc0,
                    'key': 'ldsp',
                    'variant_id': 0x0
                },
                'name': 'Фасад\x20ЛДСП',
                'available': [{
                    'key': 'facade',
                    'thickness': [],
                    'categories': []
                }]
            }]
        }
    }, !0x1);
    return h['position']['x'] = 0x96,
    h['position']['z'] = 0x1e,
    h;
}
function get_drag_areas(f, g) {
    var h = [];
    for (let i = f['length']; i--; )
        'CabinetN' === f[i]['userData']['class'] && f[i]['uuid'] != g['uuid'] && h['push'](...f[i]['get_drag_areas'](g['userData']['params']['id'] + ''));
    return h;
}
function get_section_intersection(f, g, h) {
    var h = get_drag_areas(d_objects, h)
      , g = g['intersectObjects'](h, !0x0)
      , h = {
        'obj': null,
        'point': null
    };
    return g['length'] && g[0x0]['object'] ? (f && (f['get_area']()['set_material'](drag_area_materials['area']),
    f['get_parent']()['build_drag_sizes']()),
    f = g[0x0]['object'],
    h['point'] = g[0x0]['point'],
    f['get_area']()['set_material'](drag_area_materials['area_hover'])) : (f && (f['get_area']()['set_material'](drag_area_materials['area']),
    f['get_parent']()['build_drag_sizes']()),
    f = null),
    h['obj'] = f,
    h;
}
function removeElementFromArray(f, g) {
    var h = [];
    for (let i = 0x0; i < f['length']; i++)
        f[i] !== g && h['push'](f[i]);
    return h['push'](room['floor']),
    h;
}
function gp_t(f) {
    return f ? f['parent']instanceof Tabletop || f['parent']instanceof CabinetTabletop ? f['parent'] : gp_t(f['parent']) : null;
}
THREE['DragControls5'] = function(a0, a1, a2) {
    this['params'] = {},
    this['params']['grid'] = 0x1 / units,
    this['params']['snap_distance'] = 0xa,
    this['top_cabinets_helper'] = null,
    this['wallpanel_helper'] = null,
    this['block_move'] = 0x0,
    this['view_mode'] = 0x0;
    var a3 = null, a4, a5;
    let a6 = new THREE['Vector3']();
    var a7 = new THREE['Vector3'](), a8;
    let a9;
    var aa = !0x1;
    let ab = {
        'x': 0x0,
        'y': 0x0
    };
    var ac = null, ad = {
        'x': 0x0,
        'y': 0x0,
        'both': 0x0,
        'tabletop_rebuilt': 0x0
    }, ae, af;
    this['set_camera'] = function(aV) {
        a1 = aV;
    }
    ;
    let ag = '';
    this['long_mouse_press'] = 0x96;
    var ah = 0x0
      , ai = 0x1
      , aj = new THREE['Raycaster']()
      , ak = new THREE['Vector2']()
      , al = new THREE['Vector3']()
      , am = null
      , an = null
      , ao = null
      , ap = null
      , aq = this
      , ar = null
      , as = null
      , at = null
      , au = null
      , av = (this['set_selected'] = function(aV) {
        an = am = aV,
        am['box']['update'](),
        a6['copy'](am['position']['clone']()),
        aq['s_helper']['set_size'](am['box']),
        aq['s_helper']['position']['copy'](am['position']),
        aq['s_helper']['position']['y'] = am['position']['y'] + aq['s_helper']['size']['y'] / 0x2,
        aq['s_helper']['show']();
    }
    ,
    this['update_selection'] = function(aV) {}
    ,
    this['clear_selected'] = function() {
        am = null,
        this['s_helper']['hide']();
    }
    ,
    this['hide_helper'] = function() {
        this['s_helper']['hide']();
    }
    ,
    this['set_selection_position'] = function(aV) {
        this['s_helper']['position']['set'](aV);
    }
    ,
    this['set_cursor'] = function(aV='auto') {
        a2['style']['cursor'] = aV;
    }
    ,
    new THREE['Matrix4']())
      , aw = (this['s_helper'] = make_s_helper(0x64, 0x64, 0x64),
    this['s_helper']['userData']['renderable'] = !0x1,
    this['s_helper']['renderOrder'] = 0x1,
    this['s_helper']['set_size'] = function(aV) {
        aq['s_helper']['scale']['set'](0x1, 0x1, 0x1);
        var aW = common_box['setFromObject'](aq['s_helper'])['getSize'](new THREE['Vector3']())['clone']()
          , aV = aV['getSize'](new THREE['Vector3']())['clone']();
        aq['s_helper']['size'] = aV,
        aq['s_helper']['scale']['set']((aV['x'] + 0.1) / aW['x'], (aV['y'] + 0.1) / aW['y'], (aV['z'] + 0.1) / aW['z']);
    }
    ,
    this['s_helper']['make'] = function(aV) {
        var aW, aX, aX;
        0x1 == (aV = aV || am)['userData']['is_interactive'] || 'draggable' == aV['object_type'] ? (aX = box3['setFromObject'](aV)['clone']()['getCenter'](new THREE['Vector3']()),
        aq['s_helper']['set_size'](box3['setFromObject'](aV)),
        aq['s_helper']['position']['copy'](aX),
        ce(aV)) : (aV['box'] ? aq['s_helper']['set_size'](aV['box']) : aq['s_helper']['set_size'](box3['setFromObject'](aV)),
        aX = aV['getWorldPosition'](new THREE['Vector3']()),
        aq['s_helper']['position']['copy'](aX),
        aq['s_helper']['position']['y'] = aX['y'] + aq['s_helper']['size']['y'] / 0x2),
        aq['s_helper']['show'](),
        aq['update_selection'](aV);
    }
    ,
    this['clear_hovered'] = function() {
        ao = null;
    }
    ,
    this['s_helper']['make_w_box'] = function(aV, aW) {
        aq['s_helper']['show']();
        var aX = box3['setFromObject'](am['model']);
        aX['expandByObject'](am['smes_model']),
        aq['s_helper']['set_size'](aX),
        aq['s_helper']['position']['copy'](aX['getCenter'](vec3));
    }
    ,
    this['s_helper']['make_box'] = function(aV) {
        aV = aV || am,
        aq['s_helper']['show'](),
        aq['s_helper']['set_size'](box3['setFromObject'](aV)),
        aq['s_helper']['position']['copy'](aV['getWorldPosition'](new THREE['Vector3']())),
        aq['s_helper']['position']['z'] = aV['getWorldPosition'](new THREE['Vector3']())['z'] + aq['s_helper']['size']['z'] / 0x2,
        aq['update_selection'](aV);
    }
    ,
    new THREE['Vector3']())
      , ax = (this['s_helper']['make_from_center_and_size'] = function(aV) {
        aq['s_helper']['scale']['set'](0x1, 0x1, 0x1);
        var aW = common_box['setFromObject'](aq['s_helper'])['getSize'](new THREE['Vector3']())['clone']()
          , aX = aV['getSize'](new THREE['Vector3']())['clone']();
        aq['s_helper']['size'] = aX,
        aq['s_helper']['scale']['set']((aX['x'] + 0.1) / aW['x'], (aX['y'] + 0.1) / aW['y'], (aX['z'] + 0.1) / aW['z']),
        aq['position']['x'] = aV['getCenter'](new THREE['Vector3']())['x'],
        aq['position']['z'] = aV['getCenter'](new THREE['Vector3']())['z'],
        aq['position']['y'] = aV['getCenter'](new THREE['Vector3']())['y'];
    }
    ,
    this['s_helper']['show'] = function() {
        this['visible'] = !0x0;
    }
    ,
    this['s_helper']['hide'] = function() {
        this['visible'] = !0x1;
    }
    ,
    this['s_helper']['position']['set'](0x989680, 0xf4240, 0xf4240),
    scene['add'](this['s_helper']),
    this['selector'] = new Selector(),
    scene['add'](this['selector']),
    this['cut_helper'] = new THREE['Mesh'](new THREE['BoxBufferGeometry'](0x1,0x4,0x3c),new THREE['MeshPhongMaterial']({
        'color': '#880000',
        'depthTest': !0x1,
        'depthWrite': !0x1,
        'side': THREE['DoubleSide'],
        'transparent': !0x1,
        'opacity': 0x1
    })),
    this['cut_helper']['params'] = {},
    this['cut_helper']['params']['height'] = 0x4,
    this['cut_helper']['params']['depth'] = 0x3c,
    this['cut_helper']['visible'] = !0x1,
    this['cut_helper']['set_size'] = function(aV, aW) {}
    ,
    [])
      , ay = (0x1 != constructor_settings['tabletop_v2'] && 0x1 != constructor_settings['core_v2'] || scene['add'](this['cut_helper']),
    null)
      , az = 0x0
      , aA = (this['hover_helper'] = new Drag_helper({
        'material': global_materials['hover_material']
    }),
    scene['add'](this['hover_helper']),
    this['hover_helper']['visible'] = !0x1,
    this['drag_helper'] = new Drag_helper({}),
    scene['add'](this['drag_helper']),
    this['drag_helper']['visible'] = !0x1,
    null);
    let aB = null;
    function aC(aV) {
        aV['type']['indexOf']('touch') < 0x0 ? aV['preventDefault']() : aV = aV['changedTouches'][0x0];
        var aW = a2['getBoundingClientRect']()
          , aW = (ak['x'] = (aV['clientX'] - aW['left']) / aW['width'] * 0x2 - 0x1,
        ak['y'] = -(aV['clientY'] - aW['top']) / aW['height'] * 0x2 + 0x1,
        an && (an['position']['x'] += 0x1,
        ce('drag')),
        aD(aS(), !0x0));
        aF(aW),
        ab = {
            'x': aV['clientX'],
            'y': aV['clientY']
        };
    }
    function aD(aV, aW) {
        aj['setFromCamera'](ak, a1);
        var aX = aj['intersectObjects'](aV, aW);
        if (0x0 < aX['length']) {
            for (; aX[0x0] && aX[0x0]['object'] && !0x1 === aX[0x0]['object']['userData']['mouse_events']; )
                aX['shift']();
        }
        return aX;
    }
    function aE(aV) {
        if (0x0 < aV['length']) {
            var aW = []
              , aX = [];
            for (let aZ = 0x0; aZ < aV['length']; aZ++)
                aV[aZ]['object']['userData']['is_mouse_target'] && aW['push'](aV[aZ]),
                aV[aZ]['object']['userData']['is_draggable_child'] && aX['push'](aV[aZ]);
            let aY = aV[0x0]['object'];
            return aX['length'] ? aY = aX[0x0]['object'] : aW['length'] && (aY = aW[0x0]['object']),
            aY;
        }
        return null;
    }
    function aF(aV) {
        var aV;
        0x0 < aV['length'] ? (aV = aE(aV),
        null === ao ? (ao = aT(aV),
        aq['dispatchEvent']({
            'type': 'hoveron',
            'object': ao
        })) : (ao['uuid'] !== aV['uuid'] && (aq['dispatchEvent']({
            'type': 'hoveroff',
            'object': ao
        }),
        ao = aT(aV),
        aq['dispatchEvent']({
            'type': 'hoveron',
            'object': ao
        })),
        'wall' === ao['object_type'] ? a2['style']['cursor'] = 'auto' : a2['style']['cursor'] = 'pointer')) : null !== ao && (aq['dispatchEvent']({
            'type': 'hoveroff',
            'object': ao
        }),
        a2['style']['cursor'] = 'auto',
        ao = null);
    }
    function aG(aV) {
        if (aq['enabled']) {
            aV['type']['indexOf']('touch') < 0x0 ? (aV['preventDefault'](),
            aV['stopPropagation']()) : aV = aV['changedTouches'][0x0],
            pp['interface']['root']['radial_hide']();
            var aW = aD(aS(), !0x0), aX, aY, aZ;
            switch (aV['which']) {
            case 0x1:
                ag = new Date()['getTime'](),
                0x0 < aW['length'] ? (aY = aT(aE(aW)),
                am && am['uuid'] == aY['uuid'] ? (an = aY,
                aq['dispatchEvent']({
                    'type': 'dragstart',
                    'object': an
                }),
                (aZ = aj['intersectObjects'](room['walls_objects']))['length'] && al['copy'](aZ[0x0]['point'])['sub'](am['position']),
                an['box'] && an['box']['update'](),
                a6['copy'](an['position']['clone']()),
                a9 = an['rotation']['clone']()) : aB = aY) : (am = null,
                aB = null,
                an = null,
                aq['s_helper']['hide'](),
                sc['select_object'](null),
                pp['interface']['root']['$emit']('hide_interactive_menu', 0x1));
                break;
            case 0x2:
            case 0x3:
            }
        }
    }
    function aH(aV) {
        aV['type']['indexOf']('touch') < 0x0 ? aV['preventDefault']() : aV = aV['changedTouches'][0x0],
        new Date()['getTime']() >= ag + aq['long_mouse_press'] ? (ce('nothing'),
        aq['selector']['hide']()) : aB ? (am = aB,
        sc['select_object'](am),
        aq['s_helper']['position']['copy'](am['parent']['localToWorld'](am['position']['clone']())),
        aq['s_helper']['show'](),
        aq['selector']['show'](),
        aq['selector']['set_from_object'](am)) : aq['selector']['hide'](),
        an && (an['show_radial_menu'](aV['clientX'], aV['clientY']),
        an = null),
        aq['dispatchEvent']({
            'type': 'dragend',
            'object': am
        });
    }
    function aI() {
        var aV, aV, aV, aW, aX, aW, aX, aY;
        if ('walls' == global_options['mouse_mode']['target'])
            ao && ('Shaft_wall' == ao['name'] ? ao['userData']['root']['change_plane_material'](ao['userData']['tag'], global_options['mouse_mode']['item_id']) : (aV = ao['name']['replace']('_wall', ''),
            room['change_wall_material'](aV, global_options['mouse_mode']['item_id'])));
        else {
            if ('facade_materials' == global_options['mouse_mode']['target'])
                ao && null !== (aV = aO(ao)) && (aV instanceof Facade ? aV['change_own_material'](global_options['mouse_mode']['item_id'], global_options['cpk_key']) : aN(aV)['change_single_facade_material'](global_options['mouse_mode']['item_id'], aV, global_options['cpk_key']),
                sc['get_price']());
            else {
                if ('facades' == global_options['mouse_mode']['target'] && ao) {
                    let aZ = aO(ao);
                    0x1 == global_options['mouse_mode']['radius'] ? aZ['cabinet']['params']['cabinet']['type']['indexOf']('radius') < 0x0 && (aZ = null) : -0x1 < aZ['cabinet']['params']['cabinet']['type']['indexOf']('radius') && (aZ = null),
                    null !== aZ && ('function' == typeof sc['add_facade'] && sc['add_facade'](aZ),
                    sc['get_price']());
                }
                if ('fill' == global_options['mouse_mode']['target'])
                    ao && (aV = ao['parent']['parent']['userData']['root'],
                    aW = ao['parent']['parent'],
                    aX = copy_object(catalog_lib['items'][global_options['mouse_mode']['item_id']]['params']),
                    aV['add_drag_child_2'](global_options['mouse_mode']['item_id'] + '', aW, aX),
                    aV['show_drag_areas'](global_options['mouse_mode']['item_id'] + ''));
                else {
                    if ('erase' == global_options['mouse_mode']['target'])
                        ao && null !== (aW = aP(ao)) && ((aX = aW['userData']['root'])['remove_draggable'](aW),
                        bpi) && 0x1 == bpi['$refs']['module_menu']['show'] && (bpi['$refs']['module_menu']['price'] = format_price(aX['get_price']()));
                    else {
                        if ('tabletop_cut' == global_options['mouse_mode']['target'] || 'tabletop_cut_v2' == global_options['mouse_mode']['target'])
                            switch (global_options['mouse_mode']['item_id']) {
                            case 0x1:
                                return void (am = ao ? (controls['enabled'] = !0x1,
                                ao) : null);
                            case 0x2:
                                return void (ao && (controls['enabled'] = !0x1,
                                ao['add_connection'](aq['cut_helper']['position'])));
                            case 0x3:
                                ao && (controls['enabled'] = !0x1,
                                aY = gp_t(ao)) && aY['remove_connection'](ao);
                            }
                    }
                }
            }
        }
    }
    function aJ() {
        a2['addEventListener']('mousemove', aC, !0x1),
        a2['addEventListener']('mousedown', aG, !0x1),
        a2['addEventListener']('mouseup', aH, !0x1),
        a2['addEventListener']('touchmove', aC, !0x1),
        a2['addEventListener']('touchstart', aG, !0x1),
        a2['addEventListener']('touchend', aH, !0x1);
    }
    function aK() {
        a2['removeEventListener']('mousemove', aC, !0x1),
        a2['removeEventListener']('mousedown', aG, !0x1),
        a2['removeEventListener']('mouseup', aH, !0x1),
        a2['removeEventListener']('touchmove', aC, !0x1),
        a2['removeEventListener']('touchstart', aG, !0x1),
        a2['removeEventListener']('touchend', aH, !0x1);
    }
    function aL() {
        aK();
    }
    function aM(aV) {
        return 'cabinet' === aV['object_type'] || 'Room' === aV['name'] ? aV : aM(aV['parent']);
    }
    function aN(aV) {
        var aW;
        let aX = 0x0
          , aY = aV['object_type'];
        return aY = aY || aV['userData']['object_type'],
        aV['userData'] && 0x1 == aV['userData']['grouped'] && (aX = 0x1),
        pp_keyboard['r'] && (aX = 0x0),
        !{
            'cabinet': 0x1,
            'drag_group': 0x1,
            'washer': 0x1,
            'tabletop': 0x1,
            'wall': 0x1
        }[aY] || aV['userData'] && aX ? aN(aV['parent'], event) : aV;
    }
    function aO(aV) {
        return aV instanceof Door_new || aV instanceof Locker_new || aV instanceof Decoration || aV instanceof Facade ? aV : aV['parent'] ? aO(aV['parent']) : null;
    }
    function aP(aV) {
        return aV instanceof Draggable ? aV : aV['parent'] ? aP(aV['parent']) : null;
    }
    function aQ(aV) {
        return aV instanceof Slider || aV instanceof Rotator ? aV : aV['parent'] ? aQ(aV['parent']) : null;
    }
    function aR() {
        var aV = [];
        aV['push'](room['left_wall']),
        aV['push'](room['right_wall']),
        aV['push'](room['front_wall']),
        aV['push'](room['back_wall']);
        for (let aW = a0['length']; aW--; )
            'Shaft' == a0[aW]['temp_type'] && aV['push'](a0[aW]);
    }
    function aS(aV) {
        var aW = [];
        for (let aY = a0['length']; aY--; ) {
            if ('CabinetN' == a0[aY]['temp_type'] && 0x1 != a0[aY]['userData']['params']['spec']['fill_locked']) {
                var aX = a0[aY]['get_draggables']();
                for (let aZ = aX['length']; aZ--; )
                    aW['push'](aX[aZ]);
            }
            aW['push'](a0[aY]);
        }
        return aW;
    }
    function aT(aV, aW=!0x1) {
        var aX = {
            'cabinet': 0x1,
            'module': 0x1,
            'drag_group': 0x1,
            'washer': 0x1,
            'tabletop': 0x1,
            'wall': 0x1,
            'draggable': 0x1
        };
        let aY = aV['object_type'];
        return aY = aY || aV['userData']['object_type'],
        aW && aV['userData']['is_interactive'] || aV['is_control'] ? aV : 'draggable' == aY && 0x1 == aV['userData']['root']['userData']['params']['spec']['fill_locked'] ? aT(aV['parent'], aW) : aX[aY] ? aV : aV['parent'] ? aT(aV['parent'], aW) : null;
    }
    function aU(aV) {
        if ('function' == typeof Slider) {
            var aW = aQ(aV);
            if (aW)
                return void aW['animate']();
        }
        -0x1 < aV['name']['indexOf']('door_rtl') && aV['click'](),
        -0x1 < aV['name']['indexOf']('door_ltr') && aV['click'](),
        -0x1 < aV['name']['indexOf']('door_simple_top') && aV['click'](),
        -0x1 < aV['name']['indexOf']('door_simple_bottom') && aV['click'](),
        -0x1 < aV['name']['indexOf']('locker') && aV['click'](),
        -0x1 < aV['name']['indexOf']('door_slide_left') && aV['click'](),
        -0x1 < aV['name']['indexOf']('door_slide_right') && aV['click'](),
        aq['block_move'] = 0x1,
        aV['parent']['o_type'] && 'Locker' === aV['parent']['o_type'] && aV['parent']['click'](),
        aV['parent']['parent']['o_type'] && 'Locker' === aV['parent']['parent']['o_type'] ? aV['parent']['parent']['click']() : aV['parent']['parent']['parent']['o_type'] && 'Locker' === aV['parent']['parent']['parent']['o_type'] ? aV['parent']['parent']['parent']['click']() : aV['parent']['parent']['parent']['parent']['o_type'] && 'Locker' === aV['parent']['parent']['parent']['parent']['o_type'] && aV['parent']['parent']['parent']['parent']['click']();
    }
    aJ(),
    this['enabled'] = !0x0,
    this['activate'] = aJ,
    this['deactivate'] = aK,
    this['dispose'] = aL,
    this['go'] = function() {
        return aS();
    }
    ,
    this['setObjects'] = function() {}
    ,
    this['on'] = function(aV, aW) {
        aq['addEventListener'](aV, aW);
    }
    ,
    this['off'] = function(aV, aW) {
        aq['removeEventListener'](aV, aW);
    }
    ,
    this['notify'] = function(aV) {
        aq['dispatchEvent']({
            'type': aV
        });
    }
    ;
}
,
THREE['DragControls5']['prototype'] = Object['create'](THREE['EventDispatcher']['prototype']),
THREE['DragControls5']['prototype']['constructor'] = THREE['DragControls3'];
class Section extends THREE['Group'] {
    constructor(e={}, f={
        'parent': null,
        'root': null,
        'path': null
    }) {
        super(),
        this['userData']['data'] = {},
        this['userData']['object'] = new THREE['Group'](),
        this['userData']['object']['name'] = 'object',
        this['userData']['children'] = this['userData']['object']['children'],
        this['add'](this['userData']['object']),
        this['userData']['edges'] = new THREE['Group'](),
        this['userData']['edges']['name'] = 'edges',
        this['add'](this['userData']['edges']),
        this['userData']['own_object'] = new THREE['Group'](),
        this['userData']['own_object']['name'] = 'own_object',
        this['add'](this['userData']['own_object']),
        this['userData']['sizes_object'] = new THREE['Group'](),
        this['userData']['sizes_object']['name'] = 'sizes',
        this['add'](this['userData']['sizes_object']),
        this['userData']['helpers'] = new THREE['Group'](),
        this['userData']['helpers']['name'] = 'helpers',
        this['add'](this['userData']['helpers']),
        this['userData']['helpers']['visible'] = !0x1,
        this['userData']['class'] = this['constructor']['name'],
        this['userData']['current'] = {},
        this['userData']['connected'] = [],
        this['userData']['parent'] = f['parent'],
        this['userData']['path2'] = f['path'],
        this['userData']['parent_params'] = f,
        this['userData']['local_parent'] = f['local_parent'],
        this['userData']['is_draggable_child'] = f['is_draggable_child'],
        this['userData']['interaction'] = {},
        this['userData']['interaction']['is_fill'] = 0x0,
        f['root'] ? this['userData']['root'] = f['root'] : this['_make_root'](),
        this['build_computed'](),
        this['build_params'](e),
        this['build']();
    }
    ['add_material_key'](f, g, h=0x0, j=0x0) {
        var k = f + '::' + (g = g || 0x0)
          , l = this['userData']['params'];
        l['materials'][k] || (l['spec']['materials']['push']({
            'key': f,
            'group': g,
            'fixed': h,
            'label': set_obj['materials'][f]['name'],
            'order': l['spec']['materials']['length'],
            'variant': set_obj['materials'][f]['default'],
            'id': j
        }),
        j = j || set_obj['materials'][f]['variants'][set_obj['materials'][f]['default']]['id'],
        l['materials'][k] = {
            'key': f,
            'group': g,
            'fixed': h,
            'label': set_obj['materials'][f]['name'],
            'order': l['spec']['materials']['length'],
            'type': set_obj['materials'][f]['type'],
            'id': j,
            'size': set_obj['materials'][f]['variants'][set_obj['materials'][f]['default']]['size'],
            'variant': set_obj['materials'][f]['default']
        }),
        'function' == typeof pp['events']['cabinet']['after_add_material_key'] && pp['events']['cabinet']['after_add_material_key'](this, f, g, h, j);
    }
    ['add_variable'](e, f=!0x1) {
        this['userData']['computed']['variables'][e['key']] || (this['userData']['computed']['variables'][e['key']] = e),
        f && !this['userData']['params']['variables'][e['key']] && (this['userData']['params']['variables'][e['key']] = e);
    }
    ['_make_root']() {
        this['userData']['is_root'] = !0x0,
        (this['userData']['root'] = this)['userData']['path'] = '0',
        (this['userData']['parent'] = this)['userData']['ids'] = {},
        this['userData']['parts'] = {},
        this['userData']['parts_by_path'] = {},
        this['userData']['params_hash'] = {},
        this['box'] = new THREE['Box3'](),
        this['box']['update'] = function() {}
        ,
        Object['keys'](pp['engine']['item_types'])['forEach'](e => {
            this['userData']['parts'][e] = [],
            this['userData']['params_hash'][e] = [],
            this['userData']['parts_by_path'][e] = {};
        }
        );
    }
    ['rebuild'](e) {
        this['build_computed'](),
        this['build_params'](e),
        this['build']();
    }
    ['build_computed']() {
        this['userData']['computed'] = {
            'size': {},
            'variables': {},
            'used_materials': {}
        };
    }
    ['build_params'](f) {
        if (void 0x0 !== f['type'] && f['type'],
        'model' == f['type'] && (f['spec'] = {
            'id': f['spec']['id'],
            'selected_materials': {},
            'version': f['version']
        }),
        this['userData']['params'] = _['merge'](dp['get'](f['type']), copy_object(f)),
        this['userData']['computed']['tags'] = {},
        this['userData']['params']['spec']['tags'] && this['userData']['params']['spec']['tags']['length']) {
            var g = this['userData']['params']['spec']['tags']['split'](',');
            for (let i = 0x0; i < g['length']; i++) {
                let j = 0x1
                  , k = g[i]['trim']();
                var h = k['split']('::');
                0x1 < h['length'] && (k = h[0x0],
                j = h[0x1]),
                this['userData']['computed']['tags'][k] = j;
            }
        }
        this['userData']['is_interactive'] = 0x1 == this['userData']['params']['spec']['interactive'],
        this['userData']['params']['spec']['drag_enabled'] = Boolean(to_int(this['userData']['params']['spec']['drag_enabled'])),
        'c:size.x' == this['userData']['params']['size']['x'] && (this['userData']['params']['size']['x'] = 's:x'),
        'c:size.y' == this['userData']['params']['size']['y'] && (this['userData']['params']['size']['y'] = 's:y'),
        'c:size.z' == this['userData']['params']['size']['z'] && (this['userData']['params']['size']['z'] = 's:z');
    }
    ['build']() {
        'function' == typeof pp['events']['parts'][this['userData']['params']['events']['on_before_build']] && pp['events']['parts'][this['userData']['params']['events']['on_before_build']](this),
        this['reset'](),
        this['reset'](this['userData']['own_object']),
        this['name'] = this['userData']['params']['name'],
        this['_build_variables'](),
        this['b_size'](),
        this['b_pos'](),
        this['b_spec'](),
        this['b_rotate'](),
        this['b_pivot'](),
        this['b_rotate2'](),
        this['userData']['params']['id'] && (this['userData']['root']['userData']['obj_ids'][this['userData']['params']['id']] = this);
        var e = this['userData']['params']['children'];
        if (this['userData']['params']['variables'] && Object['keys'](this['userData']['params']['variables'])['forEach'](f => {
            0x1 == this['userData']['params']['variables'][f]['local'] || this['userData']['root']['userData']['computed']['variables'][f] || (this['userData']['root']['userData']['computed']['variables'][f] = this['userData']['params']['variables'][f]);
        }
        ),
        e) {
            for (let f = 0x0; f < e['length']; f++)
                this['add_child'](e[f], f);
        }
        this['visible'] = this['userData']['params']['visible'],
        this['build_helpers'](),
        this['userData']['helpers']['position']['copy'](this['userData']['object']['position']),
        this['userData']['helpers']['rotation']['copy'](this['userData']['object']['rotation']),
        this['build_drag_area'](),
        this['userData']['own_object']['position']['copy'](this['userData']['object']['position']),
        this['userData']['own_object']['rotation']['copy'](this['userData']['object']['rotation']),
        'edges' == global_options['mode'] && this['edges_mode'](),
        this['build_drag_sizes'](),
        'function' == typeof pp['events']['parts'][this['userData']['params']['events']['on_after_build']] && pp['events']['parts'][this['userData']['params']['events']['on_after_build']](this);
    }
    ['_build_variables']() {
        let e = {};
        Object['keys'](this['userData']['root']['userData']['computed']['variables'])['forEach'](f => {
            e[f] = this['userData']['root']['userData']['computed']['variables'][f];
        }
        ),
        this['userData']['params']['variables'] && Object['keys'](this['userData']['params']['variables'])['forEach'](f => {
            e[f] = this['userData']['params']['variables'][f];
        }
        ),
        this['userData']['parent_params']['local_parent'] && this['userData']['parent_params']['local_parent']['userData']['computed']['variables'] && Object['keys'](this['userData']['parent_params']['local_parent']['userData']['computed']['variables'])['forEach'](f => {
            e[f] || (e[f] = this['userData']['parent_params']['local_parent']['userData']['computed']['variables'][f]);
        }
        ),
        this['userData']['computed']['variables'] = e;
    }
    ['b_size'](e=null) {
        let f;
        var e = {
            'parent_size': f = this['userData']['is_root'] ? this['userData']['params']['size'] : null == e ? this['userData']['parent']['userData']['computed']['size'] : e,
            'computed': this['userData']['root']['userData']['computed']['computed'],
            'variables': this['userData']['computed']['variables'],
            'materials': this['userData']['root']['userData']['computed']['materials']
        };
