 'kitchen_templates': function(B) {
            if (Array['isArray'](B)) {
                var C = {
                    'categories': [],
                    'items': B
                };
                for (let D = 0x0; D < B['length']; D++)
                    B[D]['category'] = 0x0;
                kitchen_templates = C,
                convert_lib(pp['libs']['templates'], C);
            } else
                convert_lib(pp['libs']['templates'], B),
                kitchen_templates = B;
        },
        'tech_catalog': function(B) {
            convert_lib(tech_lib, B),
            tech_catalog = B;
        },
        'comms_catalog': function(B) {
            convert_lib(comms_lib, B),
            comms_catalog = B;
        },
        'interior_catalog': function(B) {
            convert_lib(interior_lib, B),
            other_models = B;
        },
        'kitchen_models': function(B) {
            kitchen_styles = B,
            ks_map = {};
            for (let C = 0x0; C < kitchen_styles['length']; C++)
                ks_map[kitchen_styles[C]['id']] = C;
        },
        'handles': function(B) {
            convert_lib(handles_lib, B),
            handles_catalog = B,
            pp['libs']['handles'] = handles_lib;
        },
        'prices': function(B) {
            prices = B;
        },
        'sections': function(B) {
            sections = B;
        },
        'built_in_models_common': function(B) {
            built_in_models_common = B;
        },
        'constructor_settings': function(B) {
            var B;
            constructor_settings = B,
            document['getElementById']('pp_core_v2') && (constructor_settings['core_v2'] = 0x1),
            constructor_settings['core_v2'] && (B = pp['const']['not_set_value'],
            def_cabinet_tabletop['spec']['material']['id'] = B,
            def_cabinet_tabletop['spec']['material']['variant_id'] = B,
            def_cabinet_tabletop['spec']['plints']['enabled'] = B,
            def_cabinet_tabletop['spec']['plints']['material'] = B,
            def_cabinet_tabletop['spec']['plints']['back'] = B,
            def_cabinet_tabletop['spec']['plints']['right'] = B,
            def_cabinet_tabletop['spec']['plints']['left'] = B,
            def_cabinet_bort['spec']['material']['id'] = B,
            def_cabinet_cokol['spec']['id'] = B,
            def_cabinet_cokol_top['spec']['id'] = B),
            void 0x0 === constructor_settings['pdf_password'] && (constructor_settings['pdf_use_password'] = 0x0),
            void 0x0 === constructor_settings['pdf_password'] && (constructor_settings['pdf_password'] = ''),
            constructor_settings['pdf_settings'] && (Object['keys'](constructor_settings['pdf_settings'])['forEach'](function(C) {
                pdf_settings[C] = constructor_settings['pdf_settings'][C],
                'report_additional_text' != C && (pdf_settings[C] = '1' === pdf_settings[C]);
            }),
            null == pdf_settings['lm'] && (pdf_settings['lm'] = 0x55),
            null == pdf_settings['tm'] && (pdf_settings['tm'] = 0x38),
            null == pdf_settings['rm'] && (pdf_settings['rm'] = 0x2a),
            null == pdf_settings['bm']) && (pdf_settings['bm'] = 0x38),
            null == pdf_settings['report_modules_sizes_column'] && (pdf_settings['report_modules_sizes_column'] = !0x0),
            null == pdf_settings['report_modules_details'] && (pdf_settings['report_modules_details'] = !0x0),
            null == pdf_settings['report_custom_cart_items'] && (pdf_settings['report_custom_cart_items'] = !0x0),
            void 0x0 === constructor_settings['multiple_facades_mode'] && (constructor_settings['multiple_facades_mode'] = 0x0),
            void 0x0 === constructor_settings['cornice_available'] && (constructor_settings['cornice_available'] = 0x1),
            void 0x0 === constructor_settings['custom_form'] && (constructor_settings['custom_form'] = 0x0),
            void 0x0 === constructor_settings['custom_order_url'] && (constructor_settings['custom_order_url'] = ''),
            void 0x0 === constructor_settings['custom_sizes_available'] && (constructor_settings['custom_sizes_available'] = 'true'),
            void 0x0 !== constructor_settings['default_language'] && '' != constructor_settings['default_language'] || (constructor_settings['default_language'] = 'ru'),
            void 0x0 === constructor_settings['price_modificator'] ? constructor_settings['price_modificator'] = 0x1 : constructor_settings['price_modificator'] = parseFloat(constructor_settings['price_modificator']),
            void 0x0 === constructor_settings['price_modificator_dealer'] ? constructor_settings['price_modificator_dealer'] = 0x1 : constructor_settings['price_modificator_dealer'] = parseFloat(constructor_settings['price_modificator_dealer']),
            void 0x0 === constructor_settings['price_modificator_seller'] ? constructor_settings['price_modificator_seller'] = 0x1 : constructor_settings['price_modificator_seller'] = parseFloat(constructor_settings['price_modificator_seller']),
            void 0x0 === constructor_settings['facade_style_change_availabale'] ? constructor_settings['facade_style_change_availabale'] = 0x1 : constructor_settings['facade_style_change_availabale'] = parseInt(constructor_settings['facade_style_change_availabale']),
            void 0x0 === constructor_settings['show_specs'] ? constructor_settings['show_specs'] = 0x1 : constructor_settings['show_specs'] = parseInt(constructor_settings['show_specs']),
            void 0x0 === constructor_settings['allow_top_modules_mass_depth_change'] && (constructor_settings['allow_top_modules_mass_depth_change'] = 0x0),
            constructor_settings['decorations_enabled'] || (constructor_settings['decorations_enabled'] = 0x0),
            constructor_settings['allow_common_mode'] || (constructor_settings['allow_common_mode'] = 0x0),
            constructor_settings['frontend_configurator_available'] ? constructor_settings['frontend_configurator_available'] = parseInt(constructor_settings['frontend_configurator_available']) : constructor_settings['frontend_configurator_available'] = 0x0,
            constructor_settings['furniture_available'] = 0x1,
            constructor_settings['show_modules_names_in_sizes_select'] || (constructor_settings['show_modules_names_in_sizes_select'] = 0x0),
            constructor_settings['furniture_available'] || (constructor_settings['furniture_available'] = 0x0),
            constructor_settings['icons_type'] || (constructor_settings['icons_type'] = 0x0),
            global_options['forced_common'] = 0x0,
            constructor_settings['email'] || (constructor_settings['email'] = {
                'use_custom_form': 0x0,
                'custom_form_data': []
            }),
            0x1 == constructor_settings['custom_lockers'] && (custom_lockers = !0x0),
            null == constructor_settings['use_multiplier_in_furnitypes'] && (constructor_settings['use_multiplier_in_furnitypes'] = 0x1),
            null == constructor_settings['use_corpus_direct_price'] && (constructor_settings['use_corpus_direct_price'] = 0x0),
            constructor_settings['sizes_limit'] ? 'object' != typeof constructor_settings['sizes_limit'] && (constructor_settings['sizes_limit'] = JSON['parse'](constructor_settings['sizes_limit'])) : constructor_settings['sizes_limit'] = {
                'min_width': 0x0,
                'max_width': 0x0,
                'min_height': 0x0,
                'max_height': 0x0,
                'min_depth': 0x0,
                'max_depth': 0x0
            },
            void 0x0 === constructor_settings['cokol_top_available'] && (constructor_settings['cokol_top_available'] = 0x1),
            void 0x0 === constructor_settings['tabletop_plints_available'] && (constructor_settings['tabletop_plints_available'] = 0x1),
            constructor_settings['tabletop_plints_default'],
            void 0x0 === constructor_settings['russta'] && (constructor_settings['russta'] = 0x0),
            void 0x0 === constructor_settings['check_intersection_default'] && (constructor_settings['check_intersection_default'] = 0x0),
            global_options['check_intersections'] = 0x1 == constructor_settings['check_intersection_default'],
            null == constructor_settings['show_shelves_panel'] && (constructor_settings['show_shelves_panel'] = 0x1),
            null == constructor_settings['use_module_base_price_mf'] && (constructor_settings['use_module_base_price_mf'] = 0x0),
            null == constructor_settings['allow_facade_group_change'] && (constructor_settings['allow_facade_group_change'] = 0x0),
            constructor_settings['display_sizes'] || (constructor_settings['display_sizes'] = 'xyz'),
            constructor_settings['price_modificator_acc'] && (constructor_settings['price_modificator_acc'] = parseFloat(constructor_settings['price_modificator_acc'])),
            constructor_settings['price_modificator_furni'] && (constructor_settings['price_modificator_furni'] = parseFloat(constructor_settings['price_modificator_furni'])),
            isNaN(constructor_settings['price_modificator_acc']) && (constructor_settings['price_modificator_acc'] = constructor_settings['price_modificator']),
            isNaN(constructor_settings['price_modificator_furni']) && (constructor_settings['price_modificator_furni'] = constructor_settings['price_modificator']),
            constructor_settings['tabletop_v2'] = 0x1,
            constructor_settings['tmp_convert_details'] = 0x1,
            constructor_settings['module_sides_version'] = 0x1;
        },
        'facade_systems': function(B) {
            facade_systems_catalog = B;
        },
        'accessories': function(B) {
            (accsessories_data = B)['by_code'] = {},
            accsessories_data['get_item'] = function(C) {
                return !!this['items'][C] && {
                    'id': C,
                    'name': this['items'][C]['name'],
                    'code': this['items'][C]['code'],
                    'label': this['items'][C]['code'] + '\x20' + this['items'][C]['name'],
                    'category': this['items'][C]['category'],
                    'price_per_piece': parseFloat(this['items'][C]['price'])
                };
            }
            ,
            accsessories_data['find_item'] = function(C) {
                return this['items'][C] || !0x1;
            }
            ,
            Object['keys'](accsessories_data['items'])['forEach'](C => {
                accsessories_data['items'][C]['tags'] || (accsessories_data['items'][C]['tags'] = ''),
                accsessories_data['items'][C]['code'] && (accsessories_data['by_code'][accsessories_data['items'][C]['code']] = accsessories_data['items'][C]);
            }
            ),
            accsessories_data['find_item_by_code'] = function(C) {
                return this['by_code'][C] || !0x1;
            }
            ,
            accsessories_data['get_item_by_code'] = function(C) {
                return !!this['by_code'][C] && {
                    'id': this['by_code'][C]['id'],
                    'name': this['by_code'][C]['name'],
                    'code': this['by_code'][C]['code'],
                    'label': this['by_code'][C]['code'] + '\x20' + this['by_code'][C]['name'],
                    'category': this['by_code'][C]['category'],
                    'price_per_piece': parseFloat(this['by_code'][C]['price'])
                };
            }
            ,
            accsessories_data['original_items'] = copy_object(accsessories_data['items']),
            accsessories_data['tree'] && (Object['keys'](accsessories_data['tree'])['forEach'](C => {
                var D = accsessories_data['tree'][C];
                D['tags'] = [];
                for (let E = D['items']['length']; E--; )
                    0x0 != accsessories_data['items'][D['items'][E]]['active'] && '' != accsessories_data['items'][D['items'][E]]['tags'] && (D['tags'] = D['tags']['concat'](accsessories_data['items'][D['items'][E]]['tags']['split'](',')));
                for (let F = D['tags']['length']; F--; )
                    D['tags'][F] = D['tags'][F]['trim']();
                D['tags'] = _['uniq'](D['tags']);
            }
            ),
            accsessories_data['tags_by_types'] = {},
            Object['keys'](accsessories_data['types'])['forEach'](C => {
                var D = Object['keys'](accsessories_data['types'][C]);
                accsessories_data['tags_by_types'][C] = [];
                for (let F = 0x0; F < D['length']; F++) {
                    var E = accsessories_data['items'][D[F]];
                    E['active'] && '' != E['tags'] && (accsessories_data['tags_by_types'][C] = accsessories_data['tags_by_types'][C]['concat'](E['tags']['split'](',')));
                    for (let G = accsessories_data['tags_by_types'][C]['length']; G--; )
                        accsessories_data['tags_by_types'][C][G] = accsessories_data['tags_by_types'][C][G]['trim']();
                    accsessories_data['tags_by_types'][C] = _['uniq'](accsessories_data['tags_by_types'][C]);
                }
            }
            )),
            accsessories_data['tags'] && (accsessories_data['tags']['sort'](),
            accsessories_data['tags']['sort'](function(C, D) {
                return parseInt(C) - parseInt(D);
            }));
        },
        'facade_sets': function(B) {
            facades_sets = B,
            convert_facades(),
            (facades_lib = new lib(material_0,category_0))['get_item'] = function(C) {
                var C;
                return this['items'][C] ? ((C = copy_object(this['items'][C]))['additional_materials'] || (C['additional_materials'] = {}),
                C) : copy_object({
                    'id': 0x0,
                    'active': '0',
                    'order': 0x186a0,
                    'name': 'Default',
                    'compatibility_types': {
                        'full': 0x0
                    },
                    'category': 0x0,
                    'materials': [0x0],
                    'prices': [],
                    'icon': '',
                    'handle': 0x1,
                    'handle_offset': 0x1e,
                    'thickness': 0x12,
                    'types': [{
                        'name': 'Глухой',
                        'icon': '',
                        'items': [{
                            'min_width': 0x0,
                            'min_height': 0x0,
                            'model': '/common_assets/models/facades/7/plastic_full.fbx',
                            'group': 'all'
                        }],
                        'thickness': 0x12,
                        'icon_file': ''
                    }],
                    'types_radius': [],
                    'types_double': [],
                    'types_triple': [],
                    'double_offset': 0x0,
                    'triple_decor_model': {
                        'model': '',
                        'model_file': '',
                        'current_model': '',
                        'thickness': 0x0,
                        'height': 0x0,
                        'offset': 0x0
                    },
                    'additional_materials': []
                });
            }
            ,
            facades_lib['get_data'] = function(C) {
                var D = {
                    'mat': '',
                    'cat': '',
                    'par_cat': '',
                    'str': ''
                };
                return D['mat'] = this['get_item'](C),
                D['cat'] = this['get_category'](D['mat']['category']),
                0x0 != D['cat']['parent'] && (D['par_cat'] = this['get_category'](D['cat']['parent'])),
                D['str'] = '',
                0x0 != D['cat']['parent'] && (D['str'] += D['par_cat']['name']),
                D['str'] += '\x20' + D['cat']['name'],
                D['str'] += '\x20' + D['mat']['name'],
                D;
            }
            ,
            facades_lib['get_defaults'] = function(C) {
                return C = C || 'top',
                this['get_item'](project_settings['defaults']['facades'][C]);
            }
            ,
            convert_lib(facades_lib, {
                'items': facades_sets,
                'categories': facades_categories
            }),
            facades_lib['side_items'] = [];
            for (let C = 0x0; C < facades_sets['length']; C++)
                0x0 != facades_sets[C]['active'] && 0x1 == facades_sets[C]['has_side'] && facades_lib['side_items']['push'](facades_sets[C]);
            libs['facades'] = facades_lib,
            pp['libs']['facades'] = facades_lib;
        },
        'project_settings': function(B) {
            var B, B, B;
            if ((project_settings = B)['rulers_visible'] = void 0x0 === project_settings['rulers_visible'] ? 0x1 : project_settings['rulers_visible'],
            project_settings['selected_furniture'] = accsessories_data['default'],
            void 0x0 === project_settings['bottom_as_top_corpus_materials'] && (project_settings['bottom_as_top_corpus_materials'] = !0x0),
            void 0x0 === project_settings['bottom_as_top_facade_materials'] && (project_settings['bottom_as_top_facade_materials'] = !0x0),
            void 0x0 === project_settings['bottom_as_top_facade_models'] && (project_settings['bottom_as_top_facade_models'] = !0x0),
            void 0x0 === project_settings['bottom_modules_height'] && (project_settings['bottom_modules_height'] = 0x2d0),
            void 0x0 === project_settings['cokol_as_corpus'] && (project_settings['cokol_as_corpus'] = !0x0),
            void 0x0 === project_settings['cokol_height'] && (project_settings['cokol_height'] = 0x78),
            void 0x0 === project_settings['cornice_active'] && (project_settings['cornice_active'] = !0x1),
            void 0x0 === project_settings['cornice_available'] && (project_settings['cornice_available'] = constructor_settings['cornice_available']),
            void 0x0 === project_settings['corpus_thickness'] && (project_settings['corpus_thickness'] = 0x10),
            void 0x0 === project_settings['door_offset'] && (project_settings['door_offset'] = 0x2),
            void 0x0 === project_settings['is_cokol_active'] && (project_settings['is_cokol_active'] = !0x0),
            void 0x0 === project_settings['cokol_top_active'] && (project_settings['cokol_top_active'] = !0x1),
            project_settings['available_corpus_thickness'] || (project_settings['available_corpus_thickness'] = [0x10]),
            project_settings['default_corpus_thickness'] && (project_settings['corpus_thickness'] = project_settings['default_corpus_thickness']),
            void 0x0 === project_settings['shelves_thickness'] && (project_settings['shelves_thickness'] = 0x10),
            project_settings['available_shelves_thickness'] || (project_settings['available_shelves_thickness'] = [0x10]),
            project_settings['default_shelves_thickness'] && (project_settings['shelves_thickness'] = project_settings['default_shelves_thickness']),
            void 0x0 === project_settings['selected_materials']['pat'] && (project_settings['selected_materials']['pat'] = 0x2db),
            void 0x0 === project_settings['materials']['pat'] && (project_settings['materials']['pat'] = project_settings['materials']['top']['facades']),
            project_settings['accessories'] = cart['accessories'],
            void 0x0 === project_settings['decorations'] && 0x1 != constructor_settings['shop_mode'] && 0x1 == constructor_settings['decorations_enabled'] && (project_settings['decorations'] = decorations),
            void 0x0 === project_settings['models']['top'] && (project_settings['models']['top'] = facades_sets[0x0]['id']),
            void 0x0 === project_settings['models']['bottom'] && (project_settings['models']['bottom'] = facades_sets[0x0]['id']),
            project_settings['handle']['model'] || (project_settings['handle']['model'] = handles_catalog['items'][handles_catalog['items']['length'] - 0x1]),
            void 0x0 === project_settings['handle']['bottom_as_top'] && (project_settings['handle']['bottom_as_top'] = !0x0),
            void 0x0 === project_settings['handle']['no_handle'] && (project_settings['handle']['no_handle'] = !0x1),
            'center' === project_settings['handle']['lockers_position'] && (project_settings['handle']['lockers_position'] = 'middle'),
            project_settings['handle']['model']['is_gola'] || (project_settings['handle']['model']['is_gola'] = !0x1),
            'gola' == project_settings['handle']['model']['type'] && (project_settings['handle']['model']['is_gola'] = !0x0,
            (B = handles_lib['get_item'](project_settings['handle']['model']['id']))['is_gola'] = !0x0,
            B['model_top_module'] = '/common_assets/models/handles/18/gola_top_module.fbx',
            B['model_top_module_ch'] = '/common_assets/models/handles/18/gola_top_module_ch.fbx',
            B['model_tabletop'] = '/common_assets/models/handles/18/gola_under_tabletop.fbx',
            B['model_tabletop_ch'] = '/common_assets/models/handles/18/gola_under_tabletop_ch.fbx',
            B['model_ch'] = '/common_assets/models/handles/18/gola_common_ch.fbx',
            B['sizes_top_module'] = {
                'width': 0x4,
                'height': 0x11,
                'depth': 0x1b
            },
            B['sizes_tabletop'] = {
                'width': 0x11,
                'height': 0x39,
                'depth': 0x1b
            },
            load_gola(B),
            project_settings['handle']['model'] = B),
            project_settings['handle']['top'] || (project_settings['handle']['top'] = copy_object(project_settings['handle'])),
            project_settings['handle']['bottom'] || (project_settings['handle']['bottom'] = copy_object(project_settings['handle']['top'])),
            project_settings['selected_materials']['top']['facades_rotated'] || (project_settings['selected_materials']['top']['facades_rotated'] = !0x1),
            project_settings['selected_materials']['bottom']['facades_rotated'] || (project_settings['selected_materials']['bottom']['facades_rotated'] = !0x1),
            void 0x0 === project_settings['selected_materials']['cornice'] && (project_settings['selected_materials']['cornice'] = project_settings['selected_materials']['top']['facades']),
            void 0x0 === project_settings['cornice_change_with_facade'] && (project_settings['cornice_change_with_facade'] = 0x1),
            !0x0 === custom_lockers && (project_settings['lo_type'] = 'custom'),
            project_settings['tabletop_plints_default'] = 0x0 != constructor_settings['tabletop_plints_default'],
            project_settings['shelve_offset'] = 0xf,
            project_settings['selected_cornice_model'] || (project_settings['selected_cornice_model'] = 0x0),
            project_settings['selected_cokol_model'] || (project_settings['selected_cokol_model'] = 0x0),
            project_settings['cornice_level'] || (project_settings['cornice_level'] = 0x1),
            project_settings['tabletop_mode'] || (project_settings['tabletop_mode'] = 0x0),
            'string' == typeof project_settings['materials']['tabletop']) {
                project_settings['materials']['tabletop'] = JSON['parse'](project_settings['materials']['tabletop']),
                project_settings['materials']['cokol'] = JSON['parse'](project_settings['materials']['cokol']),
                project_settings['materials']['floor'] = JSON['parse'](project_settings['materials']['floor']),
                project_settings['materials']['glass'] = JSON['parse'](project_settings['materials']['glass']),
                project_settings['materials']['wall_panel'] = JSON['parse'](project_settings['materials']['wall_panel']),
                project_settings['materials']['walls'] = JSON['parse'](project_settings['materials']['walls']);
                try {
                    project_settings['materials']['top']['back_wall_material'] = JSON['parse'](project_settings['materials']['top']['back_wall_material']),
                    project_settings['materials']['bottom']['back_wall_material'] = JSON['parse'](project_settings['materials']['bottom']['back_wall_material']);
                } catch (C) {}
                project_settings['materials']['top']['corpus'] = JSON['parse'](project_settings['materials']['top']['corpus']),
                project_settings['materials']['bottom']['corpus'] = JSON['parse'](project_settings['materials']['bottom']['corpus']);
            }
            project_settings['materials']['top']['back_wall_material'] || (project_settings['materials']['top']['back_wall_material'] = '',
            project_settings['materials']['bottom']['back_wall_material'] = copy_object(project_settings['materials']['top']['back_wall_material'])),
            'object' == typeof project_settings['materials']['top']['back_wall_material'] && Object['keys'](project_settings['materials']['top']['back_wall_material'])['length'] < 0x1 && (project_settings['materials']['top']['back_wall_material'] = ''),
            'object' == typeof project_settings['materials']['top']['back_wall_material'] && (Object['keys'](project_settings['materials']['top']['back_wall_material'])['forEach'](function(D) {
                'facade' == project_settings['materials']['top']['back_wall_material'][D]['mode'] && (project_settings['materials']['top']['back_wall_material'][D]['materials'] = copy_object(project_settings['materials']['top']['facades']),
                project_settings['materials']['bottom']['back_wall_material'][D]['materials'] = copy_object(project_settings['materials']['bottom']['facades'])),
                'custom_as_corpus' != project_settings['materials']['top']['back_wall_material'][D]['mode'] && 'corpus' != project_settings['materials']['top']['back_wall_material'][D]['mode'] || (project_settings['materials']['top']['back_wall_material'][D]['default'] = project_settings['selected_materials']['top']['corpus'],
                project_settings['materials']['top']['back_wall_material'][D]['materials'] = copy_object(project_settings['materials']['top']['corpus']),
                project_settings['materials']['bottom']['back_wall_material'][D]['default'] = project_settings['selected_materials']['bottom']['corpus'],
                project_settings['materials']['bottom']['back_wall_material'][D]['materials'] = copy_object(project_settings['materials']['bottom']['corpus']));
            }),
            (B = Object['keys'](project_settings['materials']['top']['back_wall_material']))['forEach'](function(D) {
                project_settings['materials']['top']['back_wall_material'][D]['key'] = D;
            }),
            void 0x0 === project_settings['selected_materials']['top']['back_wall_material'] && (project_settings['selected_materials']['top']['back_wall_material'] = {
                'key': project_settings['materials']['top']['back_wall_material'][B[0x0]]['key'],
                'default': project_settings['materials']['top']['back_wall_material'][B[0x0]]['default']
            }),
            void 0x0 === project_settings['selected_materials']['bottom']['back_wall_material'] && (project_settings['selected_materials']['bottom']['back_wall_material'] = project_settings['selected_materials']['top']['back_wall_material']),
            (B = Object['keys'](project_settings['materials']['glass_shelves']))['forEach'](function(D) {
                project_settings['materials']['glass_shelves'][D]['key'] = D;
            }),
            B['length']) && void 0x0 === project_settings['selected_materials']['glass_shelves'] && (project_settings['selected_materials']['glass_shelves'] = {
                'key': project_settings['materials']['glass_shelves'][B[0x0]]['key'],
                'default': project_settings['materials']['glass_shelves'][B[0x0]]['default']
            }),
            project_settings['bottom_as_top_back_wall_material'] = !0x0,
            project_settings['comments'] || (project_settings['comments'] = []),
            void 0x0 === project_settings['facades_active'] && (project_settings['facades_active'] = !0x0),
            void 0x0 === project_settings['bort_active'] && (project_settings['bort_active'] = !0x1),
            void 0x0 === project_settings['services'] && (project_settings['services'] = []),
            void 0x0 === project_settings['discount'] && (project_settings['discount'] = 0x0),
            project_settings['hinges'] = {
                'id': 0x0,
                'name': 'С\x20доводчиком',
                'icon': '/common_assets/images/with_dovod.jpg',
                'door_hinges_price': 0x3e8,
                'locker_hinges_price': 0x3e8,
                'dovodchik': !0x0
            };
        },
        'language': function(B) {
            lang = B,
            pp['lang'] = lang;
        },
        'language_custom': function(B) {
            lang = Object['assign'](lang, B);
        },
        'catalog': function(B) {
            catalog_data = B,
            constructor_settings['catalog_available'] = 0x1,
            convert_lib_multi_cat(catalog_lib, B),
            pp['libs']['catalog'] = catalog_lib;
        },
        'bardesks': function(B) {
            bardesks_data = B,
            constructor_settings['bardesks_available'] = 0x1,
            convert_lib_multi_cat(bardesks_lib, B);
        },
        'models3d': function(B) {
            models3d_data = B,
            convert_lib_multi_cat(models3d_lib, B),
            pp['libs']['models3d'] = models3d_lib;
        },
        'lockers': function(B) {
            lockers_data = B,
            convert_lib(lockers_lib, B);
        },
        'tabletop_plints': function(B) {
            (tp_data = B)['items'] && (convert_lib(tabletop_plints_lib, B),
            libs['tabletop_plints'] = tabletop_plints_lib,
            pp['libs']['bort'] = tabletop_plints_lib);
        },
        'mat_types': function(B) {
            Object['keys'](B)['forEach'](function(C) {
                B[C]['default'] = Object['keys'](B[C]['variants'])[0x0];
            }),
            mat_types = B;
        },
        'params_blocks': function(B) {
            var C = {};
            for (let D = 0x0; D < B['length']; D++)
                C[B[D]['id']] = B[D];
            global_options['params_blocks'] = C;
        },
        'backgrounds': function(B) {
            for (let C = 0x0; C < B['length']; C++)
                B[C]['category'] || (B[C]['category'] = 0x1);
            convert_lib(libs['background'], {
                'categories': [{
                    'id': 0x1,
                    'parent': 0x0,
                    'code': '',
                    'name': '',
                    'active': 0x1,
                    'items': [],
                    'categories': []
                }],
                'items': B
            });
        },
        'cornice': function(B) {
            if (constructor_settings['core_v2']) {
                var C = {
                    'name': '',
                    'code': '',
                    'icon': '',
                    'category': [],
                    'active': 0x1,
                    'order': 0x2710,
                    'params': {
                        'mat_mode': 0x0,
                        'material': 0x0,
                        'p_mat_key': '',
                        'p_mat': 0x0,
                        'p_variant': 0x0,
                        'mat_params': {},
                        'models': {
                            'common': {
                                'enabled': !0x0,
                                'model': '',
                                'code': '',
                                'price_type': 'p',
                                'price_mode': 'c',
                                'price': 0x0
                            },
                            'radius': {
                                'enabled': !0x1,
                                'model': '',
                                'code': '',
                                'price_type': 'p',
                                'price_mode': 'c',
                                'price': 0x0
                            }
                        },
                        'accs': [],
                        'height': 0x0,
                        'thickness': 0x0,
                        'width': 0x0,
                        'front_offset': 0x0
                    }
                };
                for (let G = 0x0; G < B['items']['length']; G++) {
                    var D = _['merge'](copy_object(C), copy_object(B['items'][G]));
                    D['materials'] && (D['params']['models']['common']['code'] = B['items'][G]['code'],
                    'i' == D['params']['materials_mode'] && (D['params']['mat_mode'] = 0x1,
                    D['params']['material'] = B['items'][G]['materials'][0x0]),
                    delete D['materials']),
                    delete D['models'],
                    delete D['items'],
                    B['items'][G] = D;
                }
                C['params']['models']['common']['model'] = '/common_assets/models/cornice_new.fbx',
                C['params']['models']['radius']['model'] = '/common_assets/models/cornice_radius_new.fbx',
                cornice_lib = new lib(C,category_0),
                convert_lib_multi_cat(cornice_lib, B),
                libs['cornice'] = cornice_lib;
            } else {
                for (let H = 0x0; H < B['items']['length']; H++)
                    B['items'][H]['category'] || (B['items'][H]['category'] = 0x0);
                var E = {
                    'id': 0x0,
                    'name': '',
                    'code': '',
                    'icon': '',
                    'category': 0x0,
                    'active': 0x1,
                    'order': 0x2710,
                    'models': {
                        'common': '/common_assets/models/cornice_new.fbx',
                        'radius': '/common_assets/models/cornice_radius_new.fbx',
                        'radius_i': ''
                    },
                    'params': {
                        'height': 0x64,
                        'depth': 102.79,
                        'front_offset': 0x14,
                        'item_width': 0xbb8,
                        'materials_mode': 'f'
                    },
                    'materials': {},
                    'items': [{
                        'name': '',
                        'name_radius': '',
                        'name_radius_i': '',
                        'code': '',
                        'code_radius': '',
                        'code_radius_i': '',
                        'mat_code': 'c_default_price',
                        'price': {
                            'common': 0x0,
                            'radius': 0x0,
                            'radius_i': 0x0
                        }
                    }]
                };
                0x0 < B['items']['length'] && (E['active'] = 0x0),
                prices['cornice'] && (E['params']['item_width'] = parseFloat(prices['cornice']['width']),
                E['items'][0x0]['price']['common'] = parseFloat(prices['cornice']['common']),
                E['items'][0x0]['price']['radius'] = parseFloat(prices['cornice']['radius']),
                E['items'][0x0]['price']['radius_i'] = parseFloat(prices['cornice']['radius_i'])),
                B['items']['push'](E);
                for (let I = B['items']['length']; I--; ) {
                    var F = B['items'][I];
                    F['params']['item_width'] = parseInt(F['params']['item_width']),
                    F['price_hash'] = {},
                    F['cat_price_hash'] = {};
                    for (let J = F['items']['length']; J--; )
                        F['items'][J]['price']['common'] = parseFloat(F['items'][J]['price']['common']),
                        F['items'][J]['price']['radius'] = parseFloat(F['items'][J]['price']['radius']),
                        F['items'][J]['price']['radius_i'] = parseFloat(F['items'][J]['price']['radius_i']),
                        0x0 != F['items'][J]['mat_category'] && (F['cat_price_hash'][F['items'][J]['mat_category']] = F['items'][J]),
                        F['price_hash'][F['items'][J]['mat_code']] = F['items'][J];
                }
                convert_lib(cornice_lib, B);
            }
            pp['libs']['cornice'] = cornice_lib;
        },
        'tabletop': function(B) {
            if (B['items']['length']) {
                var C = {
                    'id': 0x0,
                    'name': '',
                    'code': '',
                    'has_trap': 0x0,
                    'icon': '',
                    'category': [],
                    'active': 0x1,
                    'order': 0x2710,
                    'params': {
                        'mat_mode': 0x0,
                        'material': 0x0,
                        'mat_params': {},
                        'variants': [{
                            'name': '',
                            'code': '',
                            'width': 0x0,
                            'height': 0x0,
                            'thickness': 0x0,
                            'price': 0x0,
                            'price_mode': 'c',
                            'price_type': 'm2',
                            'price_acc_id': 0x0,
                            'params': {}
                        }],
                        'trap_variants': []
                    },
                    'prices': {
                        'common': 0x0,
                        'trap': 0x0
                    },
                    'accessories': {
                        'conn': 0x0,
                        'end': 0x0
                    }
                };
                for (let E = 0x0; E < B['items']['length']; E++) {
                    var D = B['items'][E]
                      , D = _['merge'](copy_object(C), copy_object(D));
                    D['params']['materials_mode'] && (D['params']['variants']['splice'](0x0, 0x1),
                    D['params']['mat_mode'] = 0x1,
                    D['params']['variants']['push']({
                        'name': D['name'],
                        'code': D['code'],
                        'width': D['params']['width'],
                        'height': D['params']['depth'],
                        'thickness': D['params']['height'],
                        'price': D['prices']['common'],
                        'price_mode': 'm',
                        'price_type': 'p',
                        'price_acc_id': 0x0,
                        'params': {}
                    })),
                    delete D['code_trap'],
                    delete D['mat_categories'],
                    delete D['name_trap'],
                    delete D['params']['depth'],
                    delete D['params']['height'],
                    delete D['params']['materials_mode'],
                    delete D['params']['width'],
                    delete D['prices'],
                    B['items'][E] = D;
                }
            } else
                B['items']['push']({
                    'id': 0x0,
                    'name': 'Столешница',
                    'code': '',
                    'has_trap': 0x0,
                    'icon': '',
                    'category': ['0'],
                    'active': 0x1,
                    'order': 0x2710,
                    'params': {
                        'mat_mode': 0x0,
                        'material': 0x0,
                        'mat_params': {},
                        'variants': [{
                            'name': '',
                            'code': '',
                            'width': 0xbb8,
                            'height': 0x258,
                            'thickness': 0x28,
                            'price': 0x0,
                            'price_mode': 'm',
                            'price_type': 'p',
                            'price_acc_id': 0x0,
                            'params': {}
                        }],
                        'trap_variants': []
                    },
                    'prices': {
                        'common': 0x0,
                        'trap': 0x0
                    },
                    'accessories': {
                        'conn': 0x0,
                        'end': 0x0
                    }
                });
            convert_lib(tabletop_lib, B),
            pp['libs']['tabletop'] = tabletop_lib;
        },
        'washes': function(B) {
            var C = {
                'id': 0x0,
                'name': 'Мойка',
                'price': 0x0,
                'model': '/common_assets/models/washes/m1.fbx',
                'icon': '/common_assets/models/washes/m1icon.jpg',
                'width': 0x1cc,
                'height': 0xc4,
                'depth': 0x1cc,
                'smes_rotation': 0x0,
                'variants': [{
                    'material': {
                        'add_params': {
                            'real_width': '1024',
                            'real_height': '1024',
                            'stretch_width': '1',
                            'stretch_height': '1',
                            'wrapping': 'mirror'
                        },
                        'params': {
                            'color': '#ffffff',
                            'roughness': '0.8',
                            'metalness': '0.2'
                        },
                        'type': 'Standart'
                    },
                    'name': 'Металл',
                    'price': '1000'
                }, {
                    'material': {
                        'add_params': {
                            'real_width': '1024',
                            'real_height': '1024',
                            'stretch_width': '1',
                            'stretch_height': '1',
                            'wrapping': 'mirror'
                        },
                        'params': {
                            'color': '#ffffff',
                            'roughness': '0.8',
                            'metalness': '1'
                        },
                        'type': 'Standart'
                    },
                    'name': 'Металл\x20Черный',
                    'price': '1000'
                }]
            };
            materials_lib['items']['w_mat_0'] = {
                'params': {
                    'color': '#ffffff',
                    'metalness': 0.2,
                    'roughness': 0.8
                },
                'add_params': {},
                'name': 'Material',
                'id': 'w_mat_0'
            };
            let D = 0x0;
            D = 0x0 < B['items']['length'] ? (C['active'] = 0x0,
            0x1) : 0x0,
            B['items']['push'](C),
            0x0 == D && Object['keys'](washes_catalog)['forEach'](function(E) {
                (washes_catalog[E]['category'] = 0x0) != E && B['items']['push'](washes_catalog[E]);
            }),
            convert_lib(washes_lib, B);
        },
        'cokol': function(B) {
            var C = {
                'name': '',
                'code': '',
                'icon': '',
                'category': [],
                'active': 0x1,
                'order': 0x2710,
                'params': {
                    'mat_mode': 0x0,
                    'material': 0x0,
                    'mat_params': {},
                    'models': {
                        'common': {
                            'enabled': 0x1,
                            'model': '',
                            'code': '',
                            'price_mode': 'm',
                            'price': 0x0,
                            'acc_id': 0x0
                        },
                        'radius': {
                            'enabled': 0x1,
                            'model': '',
                            'code': '',
                            'price_mode': 'm',
                            'price': 0x0,
                            'acc_id': 0x0
                        },
                        'radius_i': {
                            'enabled': 0x1,
                            'model': '',
                            'code': '',
                            'price_mode': 'm',
                            'price': 0x0,
                            'acc_id': 0x0
                        }
                    },
                    'accs': [],
                    'conns': {
                        'a0': {
                            'enabled': 0x1,
                            'model': '',
                            'code': '',
                            'price_mode': 'm',
                            'price': 0x0,
                            'acc_id': 0x0
                        },
                        'a180': {
                            'enabled': 0x1,
                            'model': '',
                            'code': '',
                            'price_mode': 'm',
                            'price': 0x0,
                            'acc_id': 0x0
                        },
                        'a90': {
                            'enabled': 0x1,
                            'model': '',
                            'code': '',
                            'price_mode': 'm',
                            'price': 0x0,
                            'acc_id': 0x0
                        },
                        'a135': {
                            'enabled': 0x1,
                            'model': '',
                            'code': '',
                            'price_mode': 'm',
                            'price': 0x0,
                            'acc_id': 0x0
                        }
                    },
                    'height': 0x0,
                    'thickness': 0x0,
                    'width': 0x0
                }
            };
            for (let E = 0x0; E < B['items']['length']; E++) {
                var D = _['merge'](copy_object(C), copy_object(B['items'][E]));
                D['materials'] && (D['params']['models']['common']['code'] = B['items'][E]['code'],
                'i' == D['params']['materials_mode'] && (D['params']['mat_mode'] = 0x1,
                D['params']['material'] = B['items'][E]['materials'][0x0]),
                delete D['materials']),
                delete D['models'],
                delete D['items'],
                B['items'][E] = D;
            }
            cokol_lib = new lib(C,category_0),
            convert_lib_multi_cat(cokol_lib, B),
            libs['cokol'] = cokol_lib,
            pp['libs']['cokol'] = cokol_lib;
        },
        'cokol_top': function(B) {
            var C;
            cokol_top_lib = new lib({
                'name': '',
                'code': '',
                'icon': '',
                'category': [],
                'active': 0x1,
                'order': 0x2710,
                'params': {
                    'mat_mode': 0x0,
                    'material': 0x0,
                    'mat_params': {},
                    'models': {
                        'common': {
                            'enabled': 0x1,
                            'model': '',
                            'code': '',
                            'price_mode': 'm',
                            'price': 0x0,
                            'acc_id': 0x0
                        },
                        'radius': {
                            'enabled': 0x1,
                            'model': '',
                            'code': '',
                            'price_mode': 'm',
                            'price': 0x0,
                            'acc_id': 0x0
                        },
                        'radius_i': {
                            'enabled': 0x1,
                            'model': '',
                            'code': '',
                            'price_mode': 'm',
                            'price': 0x0,
                            'acc_id': 0x0
                        }
                    },
                    'accs': [],
                    'conns': {
                        'a0': {
                            'enabled': 0x1,
                            'model': '',
                            'code': '',
                            'price_mode': 'm',
                            'price': 0x0,
                            'acc_id': 0x0
                        },
                        'a180': {
                            'enabled': 0x1,
                            'model': '',
                            'code': '',
                            'price_mode': 'm',
                            'price': 0x0,
                            'acc_id': 0x0
                        },
                        'a90': {
                            'enabled': 0x1,
                            'model': '',
                            'code': '',
                            'price_mode': 'm',
                            'price': 0x0,
                            'acc_id': 0x0
                        },
                        'a135': {
                            'enabled': 0x1,
                            'model': '',
                            'code': '',
                            'price_mode': 'm',
                            'price': 0x0,
                            'acc_id': 0x0
                        }
                    },
                    'height': 0x0,
                    'thickness': 0x0,
                    'width': 0x0
                }
            },category_0),
            convert_lib_multi_cat(cokol_top_lib, B),
            libs['cokol_top'] = cokol_top_lib,
            pp['libs']['cokol_top'] = cokol_top_lib;
        },
        'legs': function(B) {
            convert_lib_multi_cat(legs_lib, B),
            libs['legs'] = legs_lib,
            pp['libs']['legs'] = legs_lib;
        },
        'hole': function(B) {
            var C, D = new lib({
                'name': '',
                'code': '',
                'icon': '',
                'category': [],
                'active': 0x1,
                'order': 0x2710,
                'params': {
                    'type': 'hole',
                    'spec': {
                        'name': '',
                        'code': '',
                        'orientation': 'f',
                        'key': '',
                        'global': 0x1,
                        'direction': ''
                    },
                    'size': {
                        'x': 0x64,
                        'y': 0x0,
                        'z': 0xf
                    }
                }
            },category_0);
            convert_lib_multi_cat(D, B),
            libs['hole'] = D,
            pp['libs']['hole'] = D;
        },
        'furniture': function(B) {
            var C, D = new lib({
                'name': '',
                'code': '',
                'icon': '',
                'category': [],
                'active': 0x1,
                'order': 0x2710,
                'params': {
                    'spec': {
                        'name': '',
                        'code': ''
                    }
                }
            },category_0);
            convert_lib_multi_cat(D, B),
            libs['furniture'] = D,
            pp['libs']['furniture'] = D;
        },
        'catalogs_info': function(B) {
            if (pp['libs']['catalogs_info'] = B || {},
            catalogs_keys = pp['libs']['catalogs_info']['keys'],
            catalogs_keys_hash = {},
            catalogs_keys) {
                for (var C of catalogs_keys)
                    catalogs_keys_hash[C['key']] = C;
            }
        },
        'catalogs_by_key': function(B) {
            if (pp['libs']['catalogs_by_key'] = B || {},
            catalogs_by_key = pp['libs']['catalogs_by_key'],
            B)
                for (let F of Object['keys'](B)) {
                    var C = {
                        'id': 0x0,
                        'name': '',
                        'code': '',
                        'icon': '',
                        'category': [],
                        'cabinet_tag': '',
                        'element_type': F,
                        'catalog_type': '',
                        'active': 0x1,
                        'order': 0x2710
                    }, D;
                    for (D of B[F]?.['items'] || [])
                        D?.['params']?.['spec']?.['defaults']?.['facade'] && delete D['params']['spec']['defaults']['facade'];
                    var C = new lib(C,category_0)
                      , E = (convert_lib_multi_cat(C, B[F]),
                    _['find'](pp['libs']['catalogs_info']['keys'], G => G['key'] === F) || {
                        'name': ''
                    });
                    C['set_name'](E ? E['name'] : ''),
                    pp['libs']['catalogs'][F] = C;
                }
        },
        'materials_info': function(B) {
            if (pp['libs']['materials_info'] = B || {},
            materials_keys = pp['libs']['materials_info']['keys'],
            materials_keys_hash = {},
            materials_keys) {
                var C = ['hdf', 'glass', 'm4'], D;
                for (D of materials_keys)
                    void 0x0 === (materials_keys_hash[D['key']] = D)['butts'] && (C['includes'](D['key']) ? (D['butts'] = '',
                    D['butt_visible'] = 0x0) : (D['butts'] = 'butts',
                    D['butt_visible'] = 0x1));
            }
            if (materials_groups = pp['libs']['materials_info']['groups'],
            materials_groups_hash = {},
            materials_groups) {
                for (var E of materials_groups)
                    materials_groups_hash[E['key']] = E;
            }
        },
        'materials_by_key': function(B) {
            if (pp['libs']['materials_by_key'] = B || {},
            materials_by_key = pp['libs']['materials_by_key'],
            B)
                for (let F of Object['keys'](B)) {
                    var C, D = new lib({
                        'id': 0x0,
                        'name': 'Материал\x20в\x20базе\x20не\x20найден',
                        'code': '',
                        'key': '',
                        'icon': '',
                        'category': [],
                        'active': 0x1,
                        'order': 0x2710,
                        'material': 0x0,
                        'params': {
                            'butts': {
                                'id': 0x0,
                                'key': 'butts'
                            },
                            'mat_mode': 0x1,
                            'material': 0x0,
                            'mat_params': {},
                            'variants': [{
                                'name': 'Материал\x20в\x20базе\x20не\x20найден',
                                'code': '',
                                'width': 0x0,
                                'height': 0x0,
                                'thickness': 0x0,
                                'price': 0x0,
                                'price_mode': 'c',
                                'price_type': 'm2',
                                'price_acc_id': 0x0,
                                'params': {}
                            }]
                        }
                    },category_0), E = (convert_lib_multi_cat(D, B[F]),
                    _['find'](pp['libs']['materials_info']['keys'], G => G['key'] === F) || {
                        'name': ''
                    });
                    D['set_name'](E ? E['name'] : ''),
                    pp['libs']['materials'][F] = D;
                }
        },
        'butts_info': function(B) {
            pp['libs']['butts_info'] = B || {};
        },
        'butts_by_key': function(B) {
            if (B)
                for (let F of Object['keys'](B)) {
                    var C, D = new lib({
                        'id': 0x0,
                        'name': 'Материал\x20в\x20базе\x20не\x20найден',
                        'code': '',
                        'key': '',
                        'icon': '',
                        'category': [],
                        'active': 0x1,
                        'order': 0x2710,
                        'params': {
                            'mat_mode': 0x1,
                            'material': 0x0,
                            'mat_params': {},
                            'variants': [{
                                'name': 'Материал\x20в\x20базе\x20не\x20найден',
                                'code': '',
                                'width': 0x0,
                                'height': 0x0,
                                'thickness': 0x0,
                                'price': 0x0,
                                'price_mode': 'c',
                                'price_type': 'm2',
                                'price_acc_id': 0x0,
                                'params': {}
                            }]
                        }
                    },category_0), E = (convert_lib_multi_cat(D, B[F]),
                    _['find'](pp['libs']['butts_info']['keys'], G => G['key'] === F) || {
                        'name': ''
                    });
                    D['set_name'](E ? E['name'] : ''),
                    pp['libs']['butts'][F] = D;
                }
        },
        'key_value': function(B) {
            if (pp['libs']['key_value'] = B || {},
            pp['libs']['key_value']['__global_vars']) {
                let H = pp['libs']['key_value']['__global_vars']['value'];
                for (var C of H = Array['isArray'](H) ? H : [])
                    Array['isArray'](C['vars']) || (C['vars'] = []);
                H['length'] || (H = [{
                    'name': '',
                    'key': '__default_vars',
                    'active': 0x1,
                    'default': 0x1,
                    'vars': []
                }]),
                pp['variables']['global_vars'] = copy_object(H),
                pp['variables']['selected_index'] = H['findIndex'](I => I['default']);
                for (var D of pp['variables']['global_vars'])
                    D['vars_hash'] = _['keyBy'](D['vars'], 'key');
            }
            if (pp['libs']['key_value']['__bazis_settings'] && (bazis_settings = JSON['parse'](pp['libs']['key_value']['__bazis_settings']['value'])),
            pp['libs']['key_value']['__spec_settings']?.['value']) {
                merge(pp['spec_settings'], copy_object(pp['libs']['key_value']['__spec_settings']['value'])),
                pp['spec_settings']['settings']['price_enabled'] = parse_int(pp['spec_settings']['settings']['price_enabled']),
                pp['spec_settings']['settings']['price_modificator'] = parse_num(pp['spec_settings']['settings']['price_modificator'], 0x1),
                pp['spec_settings']['settings']['price_modificator_dealer'] = parse_num(pp['spec_settings']['settings']['price_modificator_dealer'], 0x1),
                pp['spec_settings']['settings']['price_modificator_seller'] = parse_num(pp['spec_settings']['settings']['price_modificator_seller'], 0x1);
                for (var E of Object['values'](pp['spec_settings']['price_mod']['by_mod_type']))
                    for (var F of Object['values'](E))
                        for (var G of F)
                            G['price_mod'] = parse_num(G['price_mod'], 0x1);
            }
        },
        'modules_groups': function(B) {
            pp['libs']['modules_groups'] = Array['isArray'](B) ? B : [];
        },
        'defaults': function(B) {
            _def_data = B['items'][0x0];
        },
        'models': function(B) {
            var C;
            pp['libs']['models'] = new lib({
                'name': '',
                'code': '',
                'icon': '',
                'category': [],
                'active': 0x1,
                'order': 0x2710,
                'params': {
                    'mat_mode': 0x0,
                    'material': 0x0,
                    'mat_params': {},
                    'models': {
                        'common': {
                            'enabled': 0x1,
                            'model': '',
                            'code': '',
                            'price_mode': 'm',
                            'price': 0x0,
                            'acc_id': 0x0
                        },
                        'radius': {
                            'enabled': 0x1,
                            'model': '',
                            'code': '',
                            'price_mode': 'm',
                            'price': 0x0,
                            'acc_id': 0x0
                        },
                        'radius_i': {
                            'enabled': 0x1,
                            'model': '',
                            'code': '',
                            'price_mode': 'm',
                            'price': 0x0,
                            'acc_id': 0x0
                        }
                    },
                    'accs': [],
                    'conns': {
                        'a0': {
                            'enabled': 0x1,
                            'model': '',
                            'code': '',
                            'price_mode': 'm',
                            'price': 0x0,
                            'acc_id': 0x0
                        },
                        'a180': {
                            'enabled': 0x1,
                            'model': '',
                            'code': '',
                            'price_mode': 'm',
                            'price': 0x0,
                            'acc_id': 0x0
                        },
                        'a90': {
                            'enabled': 0x1,
                            'model': '',
                            'code': '',
                            'price_mode': 'm',
                            'price': 0x0,
                            'acc_id': 0x0
                        },
                        'a135': {
                            'enabled': 0x1,
                            'model': '',
                            'code': '',
                            'price_mode': 'm',
                            'price': 0x0,
                            'acc_id': 0x0
                        }
                    },
                    'height': 0x0,
                    'thickness': 0x0,
                    'width': 0x0
                }
            },category_0),
            convert_lib_multi_cat(pp['libs']['models'], B);
        },
        'model_materials': function(B) {
            convert_lib_multi_cat(pp['libs']['model_materials'], B);
        }
    };
    let g = {};
    Object['keys'](urls)['forEach'](B => {
        g[B] = urls[B]['replace'](/\?\d+$/, '');
    }
    );
    var h = global_options['acc_url'] + 'config/index.php/api/available_data_files';
    let j = await fetch(h, {
        'method': 'POST',
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': JSON['stringify']({
            'urls': g
        })
    })['then'](B => B['json']())['catch']( () => ({}));
    var h = !0x0 === j['language'] || !0x1
      , k = !0x0 === j['washes'] || !0x1
      , q = void 0x0 !== getUrlParameter('forced_common');
    let u = urls['project_settings'];
    q && (u = urls['project_settings_common']),
    mat_types = null;
    var v = '/common_assets/config/lng_front.php'
      , w = ('custom' === constructor_settings['default_language'] && (v = urls['language']),
    0x1 == constructor_settings['use_common_modules'] && (urls['modules'] = '/common_assets/data/modules_common.json'),
    await promise_request(urls['constructor_settings']));
    f['constructor_settings'](w),
    q && (constructor_settings['custom_sizes_available'] = 0x1);
    let x = []
      , y = [];
    y['push'](promise_request(urls['materials'])),
    y['push'](promise_request(urls['glass_materials'])),
    y['push'](promise_request(urls['facade_categories'])),
    y['push'](promise_request(urls['facade_sets'])),
    y['push'](promise_request(urls['kitchen_templates'])),
    y['push'](promise_request(urls['tech_catalog'])),
    y['push'](promise_request(urls['comms_catalog'])),
    y['push'](promise_request(urls['interior_catalog'])),
    y['push'](promise_request(urls['kitchen_models'])),
    y['push'](promise_request(urls['handles'])),
    y['push'](promise_request(urls['prices'])),
    y['push'](promise_request(urls['sections'])),
    y['push'](promise_request(urls['built_in_models_common'])),
    x['push']('materials'),
    x['push']('glass_materials'),
    x['push']('facade_categories'),
    x['push']('facade_sets'),
    x['push']('kitchen_templates'),
    x['push']('tech_catalog'),
    x['push']('comms_catalog'),
    x['push']('interior_catalog'),
    x['push']('kitchen_models'),
    x['push']('handles'),
    x['push']('prices'),
    x['push']('sections'),
    x['push']('built_in_models_common');
    var z, w = (['accessories', 'catalog', 'bardesks', 'tabletop', 'models3d', 'lockers', 'tabletop_plints', 'mat_types', 'params_blocks', 'backgrounds', 'cornice', 'cokol', 'cokol_top', 'legs', 'hole', 'furniture', 'catalogs_info', 'catalogs_by_key', 'materials_info', 'materials_by_key', 'butts_info', 'butts_by_key', 'key_value', 'modules_groups', 'defaults', 'models', 'model_materials', 'smes']['forEach'](B => {
        j['hasOwnProperty'](B) && !0x0 === j[B] && (y['push'](promise_request(urls[B])),
        x['push'](B));
    }
    ),
    interface_version < 0x2 && (y['push'](promise_request(urls['facade_systems'])),
    x['push']('facade_systems')),
    !0x0 === j['washes'] ? (y['push'](promise_request(urls['washes'])),
    x['push']('washes')) : washes_lib['items'] = washes_catalog,
    new FormData()), A;
    w['append']('get_lang', 0x1),
    y['push'](promise_post('/common_assets/config/lng_front.php', w)),
    x['push']('language'),
    h && 'custom' === constructor_settings['default_language'] && (y['push'](promise_request(urls['language'])),
    x['push']('language_custom')),
    y['push'](promise_request(u)),
    x['push']('project_settings'),
    q && (constructor_settings['shop_mode'] = 0x0,
    constructor_settings['decorations_enabled'] = 0x1,
    constructor_settings['facade_style_change_availabale'] = 0x1,
    constructor_settings['facades_system_available'] = 0x1,
    constructor_settings['frontend_configurator_available'] = 0x1,
    constructor_settings['multiple_facades_mode'] = 0x0,
    global_options['forced_common'] = 0x1),
    fbx_loader['load']('/common_assets/models/furni/hinge_door_2.fbx', function(B) {
        furniture_models['hinge_door'] = B['children'][0x0]['geometry'],
        furniture_models['hinge_door']['sizes'] = box3['setFromObject'](B)['getSize'](vec3)['clone']()['divideScalar'](0x64);
    }),
    fbx_loader['load']('/common_assets/models/furni/hinge_facade.fbx', function(B) {
        furniture_models['hinge_facade'] = B['children'][0x0]['geometry'],
        furniture_models['hinge_facade']['sizes'] = box3['setFromObject'](B)['getSize'](vec3)['clone']()['divideScalar'](0x64);
    }),
    fbx_loader['load']('/common_assets/models/furni/napr_corp.fbx', function(B) {
        furniture_models['napr_corp'] = B['children'][0x0]['geometry'],
        furniture_models['napr_corp']['sizes'] = box3['setFromObject'](B)['getSize'](vec3)['clone']()['divideScalar'](0x64);
    }),
    fbx_loader['load']('/common_assets/models/furni/napr_locker.fbx', function(B) {
        furniture_models['napr_locker'] = B['children'][0x0]['geometry'],
        furniture_models['napr_locker']['sizes'] = box3['setFromObject'](B)['getSize'](vec3)['clone']()['divideScalar'](0x64);
    }),
    fbx_loader['load']('/common_assets/models/pb2.fbx', function(B) {
        inner_models['pb'] = B['children'][0x0]['geometry'],
        inner_models['pb']['sizes'] = box3['setFromObject'](B)['getSize'](vec3)['clone']();
    }),
    fbx_loader['load']('/common_assets/models/pt2.fbx', function(B) {
        inner_models['pt'] = B['children'][0x0]['geometry'],
        inner_models['pt']['sizes'] = box3['setFromObject'](B)['getSize'](vec3)['clone']();
    }),
    A = await Promise['allSettled'](y);
    for (let B = 0x0; B < A['length']; B++)
        'rejected' == A[B]['status'] ? f[x[B]]([]) : f[x[B]](A[B]['value']);
    sc['init_catalog_size_hash'](),
    (mat_types = mat_types || {
        'dsp': {
            'key': 'dsp',
            'name': 'ДСП',
            'type': 'm2',
            'default': 'v_16',
            'variants': {
                'v_16': {
                    'name': '',
                    'size': {
                        'z': 0x10
                    },
                    'id': project_settings['selected_materials']['top']['corpus'],
                    'categories': project_settings['materials']['top']['corpus']
                },
                'v_18': {
                    'name': '',
                    'size': {
                        'z': 0x12
                    },
                    'id': project_settings['selected_materials']['top']['corpus'],
                    'categories': project_settings['materials']['top']['corpus']
                },
                'v_22': {
                    'name': '',
                    'size': {
                        'z': 0x16
                    },
                    'id': project_settings['selected_materials']['top']['corpus'],
                    'categories': project_settings['materials']['top']['corpus']
                },
                'v_32': {
                    'name': '',
                    'size': {
                        'z': 0x20
                    },
                    'id': project_settings['selected_materials']['top']['corpus'],
                    'categories': project_settings['materials']['top']['corpus']
                }
            }
        },
        'hdf': {
            'key': 'hdf',
            'name': 'ХДФ',
            'type': 'm2',
            'default': 'v_3',
            'variants': {
                'v_3': {
                    'name': '',
                    'size': {
                        'z': 0x3
                    },
                    'id': 0x28b,
                    'categories': [0x12, 0x2e]
                }
            }
        },
        'mdf': {
            'key': 'mdf',
            'name': 'МДФ',
            'type': 'm2',
            'default': 'v_3',
            'variants': {
                'v_3': {
                    'name': '',
                    'size': {
                        'z': 0x3
                    },
                    'id': 0x2d6,
                    'categories': [0x1, 0x2b]
                },
                'v_32': {
                    'name': '',
                    'size': {
                        'z': 0x20
                    },
                    'id': 0x2d6,
                    'categories': [0x1, 0x2b]
                }
            }
        }
    })['__tabletop'] || (mat_types['__tabletop'] = {
        'name': 'Столешница',
        'type': 'm2',
        'default': 'v_16',
        'key': '__tabletop',
        'variants': {
            'v_16': {
                'name': 'Столешница',
                'key': 'v_16',
                'id': project_settings['selected_materials']['tabletop'],
                'size': {
                    'x': 0x0,
                    'y': 0x0,
                    'z': project_settings['tabletop_thickness']
                },
                'categories': project_settings['materials']['tabletop']
            }
        },
        'id': '99999'
    }),
    mat_types['__no_mat'] = {
        'name': 'Материал\x20удален',
        'type': 'm2',
        'default': 'v_16',
        'key': '__no_mat',
        'variants': {
            'v_16': {
                'name': 'Материал\x20удален',
                'key': 'v_16',
                'id': 0x0,
                'size': {
                    'x': 0x0,
                    'y': 0x0,
                    'z': 0x10
                },
                'categories': []
            }
        },
        'id': '99998'
    },
    set_obj = {
        'materials': mat_types
    },
    env_urls = ['/common_assets/tests/prod/test12.jpg', '/common_assets/tests/prod/test12.jpg', '/common_assets/tests/prod/test12.jpg', '/common_assets/tests/prod/test12.jpg', '/common_assets/tests/prod/test12.jpg', '/common_assets/tests/prod/test12.jpg'],
    0x1 == constructor_settings['use_custom_reflection'] && constructor_settings['custom_reflection_image'] && (-0x1 < constructor_settings['custom_reflection_image']['indexOf']('broskokitchenplanner.com') && (constructor_settings['custom_reflection_image'] = constructor_settings['custom_reflection_image']['replace']('https://broskokitchenplanner.com', 'https://planplace.ru')),
    env_urls = [constructor_settings['custom_reflection_image'], constructor_settings['custom_reflection_image'], constructor_settings['custom_reflection_image'], constructor_settings['custom_reflection_image'], constructor_settings['custom_reflection_image'], constructor_settings['custom_reflection_image']]),
    (textureCube2 = new THREE['CubeTextureLoader']()['load'](env_urls))['format'] = THREE['RGBAFormat'],
    textureCube2['mapping'] = THREE['CubeReflectionMapping'],
    mirror_material = new THREE['MeshStandardMaterial']({
        'roughness': 0x0,
        'metalness': 0x1,
        'envMap': textureCube2
    });
}
function init() {
    function q(ag) {
        var ah = copy_object(ag)
          , ag = (ah['categories'] = [],
        ah['items'] = [],
        ag['categories'] || []);
        let ai = [ah];
        return 0x0 < ag['length'] && ag['forEach'](aj => {
            ai['push'](...q(aj));
        }
        ),
        ai;
    }
    if (constructor_settings['core_v2'] && libs['cokol']['items_arr']?.['length'] && (project_settings['selected_cokol_model'] = project_settings['selected_materials']['cokol']),
    constructor_settings['core_v2'] && !libs['cokol']['items_arr']?.['length']) {
        var A = {
            'name': '',
            'code': '',
            'icon': '',
            'category': [],
            'active': 0x1,
            'order': 0x2710,
            'params': {
                'mat_mode': 0x0,
                'material': 0x0,
                'mat_params': {},
                'models': {
                    'common': {
                        'enabled': 0x1,
                        'model': '',
                        'code': '',
                        'price_mode': 'm',
                        'price': 0x0,
                        'price_type': 'v'
                    },
                    'radius': {
                        'enabled': 0x1,
                        'model': '',
                        'code': '',
                        'price_mode': 'm',
                        'price': 0x0,
                        'price_type': 'v'
                    },
                    'radius_i': {
                        'enabled': 0x1,
                        'model': '',
                        'code': '',
                        'price_mode': 'm',
                        'price': 0x0,
                        'price_type': 'v'
                    }
                },
                'accs': [],
                'conns': {
                    'a0': {
                        'enabled': 0x1,
                        'model': '',
                        'code': '',
                        'price_mode': 'm',
                        'price': 0x0,
                        'price_type': 'v'
                    },
                    'a180': {
                        'enabled': 0x1,
                        'model': '',
                        'code': '',
                        'price_mode': 'm',
                        'price': 0x0,
                        'price_type': 'v'
                    },
                    'a90': {
                        'enabled': 0x1,
                        'model': '',
                        'code': '',
                        'price_mode': 'm',
                        'price': 0x0,
                        'price_type': 'v'
                    },
                    'a135': {
                        'enabled': 0x1,
                        'model': '',
                        'code': '',
                        'price_mode': 'm',
                        'price': 0x0,
                        'price_type': 'v'
                    }
                },
                'height': 0x0,
                'thickness': 0x0,
                'width': 0x0
            }
        }
          , C = []
          , D = []
          , F = project_settings['materials']['cokol'];
        for (let ag = 0x0; ag < F['length']; ag++) {
            var G = materials_lib['categories'][F[ag]];
            C['push'](...q(G));
        }
        for (let ah = 0x0; ah < C['length']; ah++) {
            var I = materials_lib['categories'][C[ah]['id']]['items'];
            for (let ai = 0x0; ai < I['length']; ai++) {
                var J = I[ai]
                  , K = copy_object(A);
                K['id'] = J['id'],
                K['icon'] = J['icon'] || '',
                K['name'] = J['name'] || '',
                K['active'] = void 0x0 !== J['active'] ? J['active'] : 0x1,
                K['category'] = isArray(J['category']) ? J['category'] : [J['category']],
                K['params']['material'] = J['id'],
                K['params']['height'] = project_settings['cokol_height'],
                K['params']['thickness'] = 0x10,
                K['params']['width'] = 0xfa0,
                K['params']['models']['common']['code'] = J['code'] || '',
                K['params']['models']['radius']['code'] = J['code'] || '',
                K['params']['models']['radius_i']['code'] = J['code'] || '',
                K['params']['models']['common']['price_mode'] = 'm2',
                K['params']['models']['radius']['price_mode'] = 'm2',
                K['params']['models']['radius_i']['price_mode'] = 'm2',
                D['push'](K);
            }
        }
        project_settings['selected_cokol_model'] = project_settings['selected_materials']['cokol'];
        var L = {
            'categories': C,
            'items': D
        };
        cokol_lib = new lib(copy_object(A),category_0),
        convert_lib_multi_cat(cokol_lib, L),
        libs['cokol'] = cokol_lib;
    }
    if (constructor_settings['core_v2']) {
        project_settings['kitchen'] || (project_settings['kitchen'] = {}),
        project_settings['kitchen']['defaults'] = _def_data;
        var L = project_settings['kitchen']['defaults']?.['handle'], L, N, L, P, Q, U, L;
        if (project_settings['handle'] && !is_empty_id(L?.['id']) && pp?.['libs']?.['handles']?.['items']?.[L['id']] && (project_settings['handle'] = pp['libs']['handles']['get_item'](L['id']),
        project_settings['handle']['selected_model'] = L['id'],
        is_empty_value(L['size']) || (project_settings['handle']['size_index'] = L['size'],
        project_settings['handle']['preferable_size'] = L['size']),
        void 0x0 === project_settings['handle']['bottom_as_top'] && (project_settings['handle']['bottom_as_top'] = !0x0),
        void 0x0 === project_settings['handle']['no_handle'] && (project_settings['handle']['no_handle'] = !0x1),
        'center' === project_settings['handle']['lockers_position'] && (project_settings['handle']['lockers_position'] = 'middle'),
        project_settings['handle']['orientation'] || (project_settings['handle']['orientation'] = 'vertical'),
        project_settings['handle']['is_gola'] || (project_settings['handle']['is_gola'] = !0x1),
        'gola' == project_settings['handle']['type'] && (project_settings['handle']['is_gola'] = !0x0,
        (L = handles_lib['get_item'](project_settings['handle']['model']['id']))['is_gola'] = !0x0,
        L['model_top_module'] = '/common_assets/models/handles/18/gola_top_module.fbx',
        L['model_top_module_ch'] = '/common_assets/models/handles/18/gola_top_module_ch.fbx',
        L['model_tabletop'] = '/common_assets/models/handles/18/gola_under_tabletop.fbx',
        L['model_tabletop_ch'] = '/common_assets/models/handles/18/gola_under_tabletop_ch.fbx',
        L['model_ch'] = '/common_assets/models/handles/18/gola_common_ch.fbx',
        L['sizes_top_module'] = {
            'width': 0x4,
            'height': 0x11,
            'depth': 0x1b
        },
        L['sizes_tabletop'] = {
            'width': 0x11,
            'height': 0x39,
            'depth': 0x1b
        },
        load_gola(L),
        project_settings['handle']['model'] = L),
        project_settings['handle']['model'] = copy_object(project_settings['handle']),
        project_settings['handle']['top'] = copy_object(project_settings['handle']),
        project_settings['handle']['bottom'] = copy_object(project_settings['handle']['top'])),
        view_mode || (L = (aj => {
            var ak;
            return pp['libs']['cokol']['items'][aj]?.['params']['height'] || 0x0;
        }
        )(project_settings['kitchen']['defaults']?.['cokol']?.['id']),
        sc['change_global_var'](pp['const']['vars']['cokol_height'], L, !0x1),
        L = (P = (aj, ak) => {
            var al = pp['libs']['tabletop'];
            return get_variant_thickness(aj, ak || 0x0, al, 0x0);
        }
        )(project_settings['kitchen']['defaults']?.['tabletop']?.['id'], project_settings['kitchen']['defaults']?.['tabletop']?.['variant_id']),
        sc['change_global_var'](pp['const']['vars']['tabletop_height'], L, !0x1)),
        project_settings['bort_active'] = !0x1 === check_global_vars_flag(pp['const']['vars']['plint_enabled']) ? 0x0 : 0x1,
        !view_mode) {
            var W = {}, Z = {}, a0, a1;
            for (a0 of pp['libs']['modules_groups'])
                W[a0['key']] = copy_object(a0);
            for (a1 of pp['libs']['materials_info']['groups'])
                Z[a1['key']] = copy_object(a1);
            var a2 = Object['keys'](W), a3;
            if (project_settings['kitchen']['defaults']['facades'] && void 0x0 !== project_settings['kitchen']['defaults']['facades']['id']) {
                var a4 = {};
                let aj = {
                    'id': project_settings['kitchen']['defaults']['facades']['id'],
                    'materials': {
                        'gen': parseInt(project_settings['kitchen']['defaults']['facades']['material']),
                        'glass': project_settings['selected_materials']['glass']
                    }
                }
                  , ak = pp['libs']['facades']['find_item'](project_settings['kitchen']['defaults']['facades']['id']);
                Object['keys'](ak['additional_materials'] || {})['forEach'](al => {
                    aj['materials'][al] = ak['additional_materials'][al]['selected'];
                }
                );
                for (let al = 0x0; al < a2['length']; al++)
                    a4[a2[al]] = copy_object(aj);
                project_settings['kitchen']['defaults']['facades'] = a4;
            }
            for (a3 of Object['values'](Z)) {
                a3['available'] || (a3['available'] = []);
                for (var a5 of a3['available'])
                    void 0x0 === a5['key'] && (a5['key'] = 'ldsp'),
                    void 0x0 === a5['thickness'] && (a5['thickness'] = []),
                    void 0x0 === a5['categories'] && (a5['categories'] = []);
                var a6, a6, a7 = (a3['selected'] = {},
                a3['selected_butt'] = {},
                a3['material'] || (a3['material'] = {
                    'av_index': 0x0,
                    'id': 0x0,
                    'key': '',
                    'variant_id': 0x0
                }),
                (!a3['material']['key'] || is_empty_id(a3['material']['id'])) && (a6 = a3['available'][0x0],
                a6 = pp['libs']['materials'][a6?.['key']]?.['first_item']) && (a3['material']['av_index'] = 0x0,
                a3['material']['id'] = a6['id'],
                a3['material']['key'] = a6['key'],
                a3['material']['variant_id'] = 0x0),
                a3['material']);
                let am = a7?.['key'] || a3['available']?.[0x0]?.['key'];
                var a8 = pp['libs']['materials_info']['keys'], a9;
                for (a9 of a2) {
                    a7 && (a3['selected'][a9] = copy_object(a7));
                    var aa, ab = _['find'](a8, an => an['key'] === am)?.['butts'] || '';
                    a3['selected_butt'][a9] = {
                        'key': ab,
                        'id': 0x0
                    };
                }
            }
            project_settings['kitchen']['cabinet_tags'] = W,
            project_settings['kitchen']['mat_groups'] = Z;
            var ac = {}, ad, ae;
            for (ad of pp['libs']['model_materials']['items_arr']) {
                ad['mode'] && ad['key'] && ('' + ad['mode'] != '2' && '' + ad['mode'] != '3' || (ae = {
                    'id': parse_int(ad['selected']),
                    'key': ad['p_key']
                },
                ac[ad['key']] = {
                    'name': ad['name'],
                    'key': ad['key'],
                    'mode': '' + ad['mode'],
                    'material': ae,
                    'categories': ad['categories'] || []
                }));
            }
            project_settings['kitchen']['model_materials'] = ac;
        }
        view_mode || pp['libs']['key_value']['__spec_settings']?.['value'] || (pp['spec_settings']['settings']['price_enabled'] = parse_int(constructor_settings['price_enabled']),
        pp['spec_settings']['settings']['price_modificator'] = parse_num(constructor_settings['price_modificator'], 0x1),
        pp['spec_settings']['settings']['price_modificator_dealer'] = parse_num(constructor_settings['price_modificator_dealer'], 0x1),
        pp['spec_settings']['settings']['price_modificator_seller'] = parse_num(constructor_settings['price_modificator_seller'], 0x1)),
        constructor_settings['price_enabled'] = pp['spec_settings']['settings']['price_enabled'],
        constructor_settings['price_modificator'] = pp['spec_settings']['settings']['price_modificator'],
        constructor_settings['price_modificator_dealer'] = pp['spec_settings']['settings']['price_modificator_dealer'],
        constructor_settings['price_modificator_seller'] = pp['spec_settings']['settings']['price_modificator_seller'];
    }
    if (built_in_models_common) {
        (bim_models = built_in_models_common)['by_types'] = {};
        for (let an = 0x0; an < bim_models['types']['length']; an++)
            bim_models['by_types'][bim_models['types'][an]] = [];
        Object['keys'](bim_models['items'])['forEach'](function(ao) {
            bim_models['by_types'][bim_models['items'][ao]['type']]['push'](bim_models['items'][ao]);
        });
    }
    var L, L, L;
    if (project_settings['defaults'] || (project_settings['defaults'] = {
        'facades': {
            'top': project_settings['models']['top'],
            'bottom': project_settings['models']['bottom']
        },
        'tabletop': 0x0,
        'tabletop_variant': 0x0,
        'cokol': {
            'material': 0x1
        },
        'cokol_top': {
            'material': 0x1
        },
        'leg': {
            'material': 0x1
        },
        'cornice': 0x0
    }),
    constructor_settings['core_v2'] && (L = project_settings['kitchen']['defaults'],
    project_settings['materials']['floor'] = L?.['floor']?.['available'],
    project_settings['materials']['walls'] = L?.['walls']?.['available'],
    project_settings['selected_materials']['floor'] = L?.['floor']?.['id'],
    project_settings['selected_materials']['walls'] = L?.['walls']?.['id']),
    project_settings['selected_materials']['facades'] = {},
    project_settings['defaults']['glass'] || (project_settings['defaults']['glass'] = project_settings['selected_materials']['glass']),
    tabletop_lib && tabletop_lib['first_item'] && 0x0 != tabletop_lib['first_item']['id'] && ('function' == typeof set_default_tabletop ? set_default_tabletop() : (0x0 != project_settings['defaults']['tabletop'] && void 0x0 !== project_settings['defaults']['tabletop'] || (project_settings['defaults']['tabletop'] = tabletop_lib['first_item']['id']),
    void 0x0 === project_settings['defaults']['tabletop_variant'] && (project_settings['defaults']['tabletop_variant'] = 0x0))),
    pp['libs']['cornice'] && pp['libs']['cornice']['first_item']) {
        'function' == typeof set_default_cornice ? set_default_cornice() : 0x0 != project_settings['defaults']['cornice'] && void 0x0 !== project_settings['defaults']['cornice'] || (project_settings['defaults']['cornice'] = pp['libs']['cornice']['first_item']['id']),
        project_settings['selected_cornice_model'] = project_settings['defaults']['cornice'];
        var af = pp['libs']['cornice']['find_item'](project_settings['selected_cornice_model']);
        project_settings['cornice_can_change_with_facade'] = 'f' == af['params']['materials_mode'],
        project_settings['cornice_change_with_facade'] = 0x1 == project_settings['cornice_can_change_with_facade'];
        let ao = 0x0;
        if (af['params']['default_material'])
            ao = af['params']['default_material'];
        else
            switch (af['params']['materials_mode']) {
            case 'i':
                ao = parseInt(af['materials'][0x0]);
                break;
            case 'c':
                ao = parseInt(pp['libs']['decors']['get_first_item'](af['mat_categories'][0x0])['id']);
                break;
            default:
                ao = parseInt(project_settings['selected_materials']['top']['facades']);
            }
        project_settings['selected_materials']['cornice'] = ao;
    }
    libs['tabletop_plints'] && libs['tabletop_plints']['first_item'] && (0x0 != project_settings['defaults']['tabletop_plint'] && void 0x0 !== project_settings['defaults']['tabletop_plint'] || (project_settings['defaults']['tabletop_plint'] = libs['tabletop_plints']['first_item']['id'])),
    constructor_settings['core_v2'] && pp['libs']['bort']?.['first_item'] && (L = project_settings['kitchen']?.['defaults'] || {},
    is_empty_id(L['tabletop']?.['bort_id'])) && (L['tabletop'] || (L['tabletop'] = {}),
    L['tabletop']['bort_id'] = pp['libs']['bort']['first_item']['id']),
    constructor_settings['core_v2'] ? view_mode || (L = project_settings['kitchen']['defaults']['facades']?.[pp['libs']['modules_groups'][0x0]['key']]?.['id']) && !project_settings['selected_materials']['facades'][L] && (project_settings['selected_materials']['facades'][L] = {
        'gen': {
            'top': project_settings['kitchen']['defaults']['facades'][pp['libs']['modules_groups'][0x0]['key']]['materials']['gen'],
            'bottom': project_settings['kitchen']['defaults']['facades'][pp['libs']['modules_groups'][0x0]['key']]['materials']['gen']
        }
    }) : Object['keys'](project_settings['defaults']['facades'])['forEach'](function(ap) {
        let aq = project_settings['defaults']['facades'][ap];
        var ar = 0x0;
        if (!project_settings['selected_materials']['facades'][aq]) {
            project_settings['selected_materials']['facades'][aq] = {};
            let as = facades_lib['items'][aq], at;
            for (let au = 0x0; au < as['materials']; au++)
                if (materials_lib['get_first_item'](as['materials'][au])['id']) {
                    at = materials_lib['get_first_item'](as['materials'][au])['id'];
                    break;
                }
            project_settings['selected_materials']['facades'][aq]['gen'] = {},
            project_settings['selected_materials']['facades'][aq]['gen']['top'] = project_settings['selected_materials']['top']['facades'],
            project_settings['selected_materials']['facades'][aq]['gen']['bottom'] = project_settings['selected_materials']['bottom']['facades'],
            ar = at,
            as['additional_materials'] || (as['additional_materials'] = {}),
            Object['keys'](as['additional_materials'])['forEach'](function(av) {
                0x0 == as['additional_materials'][av]['fixed'] && (project_settings['selected_materials']['facades'][aq][av] = {},
                project_settings['selected_materials']['facades'][aq][av]['top'] = copy_object(as['additional_materials'][av]['selected']),
                project_settings['selected_materials']['facades'][aq][av]['bottom'] = copy_object(as['additional_materials'][av]['selected']));
            });
        }
    }),
    project_settings['project_id'] || (project_settings['project_id'] = new Date()['getTime']()),
    wallpanel_params['height'] = project_settings['wall_panel']['height'],
    project_settings['facades_data'] && delete project_settings['facades_data'],
    THREE['Cache']['enabled'] = !0x0,
    constructor_settings['core_v2'] ? cornice_lib['items'][0x0]['name'] = lang['cornice'] + '\x20' + lang['cornice_common'] : (cornice_lib['items'][0x0]['name'] = lang['cornice'] + '\x20' + lang['cornice_common'],
    cornice_lib['items'][0x0]['items'][0x0]['name'] = lang['cornice'] + '\x20' + lang['cornice_common'],
    cornice_lib['items'][0x0]['items'][0x0]['name_radius'] = lang['cornice'] + '\x20' + lang['cornice_radius'],
    cornice_lib['items'][0x0]['items'][0x0]['name_radius_i'] = lang['cornice'] + '\x20' + lang['cornice_radius_i']),
    view_mode || (0x0 < $('#pre_scene')['length'] ? pre_scene : load_from_params)(),
    room_models_catalog = {
        'categories': [{
            'id': 0x1,
            'active': 0x1,
            'name': lang['windows']
        }, {
            'id': 0x2,
            'active': 0x1,
            'name': lang['doors']
        }],
        'items': [{
            'id': 0xa,
            'model': '/common_assets/models/window.fbx',
            'icon': '/common_assets/images/module_icons/window1.jpg',
            'material': {
                'type': 'Standart',
                'params': {
                    'color': '#ffffff',
                    'metalness': 0.1,
                    'roughness': 0.7
                }
            },
            'category': 0x1,
            'variants': [{
                'width': 0x49c,
                'height': 0x456,
                'depth': 0x94
            }],
            'obj_type': 'window',
            'draggable': !0x0
        }, {
            'id': 0xb,
            'model': '/common_assets/models/window_2.fbx',
            'icon': '/common_assets/images/module_icons/window_2.jpg',
            'material': {
                'type': 'Standart',
                'params': {
                    'color': '#ffffff',
                    'metalness': 0.1,
                    'roughness': 0.7
                }
            },
            'category': 0x1,
            'variants': [{
                'width': 0x49c,
                'height': 0x456,
                'depth': 0x1e
            }],
            'obj_type': 'window',
            'draggable': !0x0
        }, {
            'id': 0x1,
            'category': 0x2,
            'model': '/common_assets/models/door.fbx',
            'icon': '/common_assets/images/module_icons/door.png',
            'material': {
                'type': 'Standart',
                'params': {
                    'color': '#ffffff',
                    'map': '/common_assets/models/doormap.jpg',
                    'metalness': 0.1,
                    'roughness': 0.7
                }
            },
            'variants': [{
                'width': 0x384,
                'height': 0x8de,
                'depth': 0x41
            }],
            'draggable': !0x0,
            'obj_type': 'door',
            'cabinet_group': 'bottom'
        }, {
            'id': 0x2,
            'category': 0x2,
            'model': '/common_assets/models/doors/door.fbx',
            'icon': '/common_assets/models/doors/door2_icon.jpg',
            'material': {
                'type': 'Standart',
                'params': {
                    'color': '#ffffff',
                    'map': '/common_assets/models/doors/door2_map.jpg',
                    'metalness': 0.1,
                    'roughness': 0.7
                }
            },
            'variants': [{
                'width': 0x35c,
                'height': 0x7a8,
                'depth': 0x57
            }],
            'draggable': !0x0,
            'obj_type': 'door',
            'cabinet_group': 'bottom'
        }, {
            'id': 0x3,
            'category': 0x2,
            'model': '/common_assets/models/doors/door.fbx',
            'icon': '/common_assets/models/doors/door3_icon.jpg',
            'material': {
                'type': 'Standart',
                'params': {
                    'color': '#ffffff',
                    'map': '/common_assets/models/doors/door3_map.jpg',
                    'metalness': 0.1,
                    'roughness': 0.7
                }
            },
            'variants': [{
                'width': 0x35c,
                'height': 0x7a8,
                'depth': 0x57
            }],
            'draggable': !0x0,
            'obj_type': 'door',
            'cabinet_group': 'bottom'
        }, {
            'id': 0x4,
            'category': 0x2,
            'model': '/common_assets/models/doors/door.fbx',
            'icon': '/common_assets/models/doors/door4_icon.jpg',
            'material': {
                'type': 'Standart',
                'params': {
                    'color': '#ffffff',
                    'map': '/common_assets/models/doors/door4_map.jpg',
                    'metalness': 0.1,
                    'roughness': 0.7
                }
            },
            'variants': [{
                'width': 0x35c,
                'height': 0x7a8,
                'depth': 0x57
            }],
            'draggable': !0x0,
            'obj_type': 'door',
            'cabinet_group': 'bottom'
        }]
    };
    var L = copy_object(room_models_catalog)
      , L = (L['categories']['push']({
        'id': 0x3,
        'active': 0x1,
        'name': lang['shafts_columns']
    }),
    L['items']['push']({
        'category': '3',
        'icon': '/common_assets/images/module_icons/shaft1.jpg',
        'depth': 0x12c,
        'height': 0x12c,
        'orientation': 'horizontal',
        'mode': 'stretch'
    }, {
        'category': '3',
        'icon': '/common_assets/images/module_icons/shaft2.jpg',
        'width': 0x12c,
        'depth': 0x12c,
        'orientation': 'vertical',
        'mode': 'stretch'
    }, {
        'category': '3',
        'icon': '/common_assets/images/module_icons/shaft3.jpg',
        'width': 0x64,
        'depth': 0x3e8,
        'orientation': 'vertical',
        'mode': 'stretch'
    }, {
        'category': '3',
        'icon': '/common_assets/images/module_icons/shaft4.jpg',
        'width': 0x3e8,
        'height': 0x3e8,
        'depth': 0x3e8,
        'mode': 'normal'
    }),
    convert_lib(constructions_lib, L),
    pat_material = create_material_by_id(project_settings['selected_materials']['pat']),
    scene = new THREE['Scene'](),
    constructor_settings['enabled_360'] && (hdr_loader = new THREE['RGBELoader'](),
    project_settings['background'] || (project_settings['background'] = {
        'active': 0x0,
        'id': 0x0,
        'scale': 0x1388,
        'radius': 0x1388,
        'height': 0x2ee
    })),
    view_mode && (pp['helpers']['axes_helper'] = new PPAxes(),
    pp['helpers']['axes_helper']['visible'] = !0x1,
    scene['add'](pp['helpers']['axes_helper'])),
    scene['add'](numbers),
    numbers['userData']['childrenRenderable'] = !0x1,
    (sel_box = new Selection_box())['hide'](),
    scene['add'](sel_box),
    (selection_box = new THREE['BoxHelper']())['material']['depthTest'] = !0x1,
    selection_box['material']['transparent'] = !0x0,
    selection_box['visible'] = !0x0,
    scene['add'](selection_box),
    (wrong_place_box = new THREE['Mesh'](new THREE['BoxBufferGeometry'](0xa,0xa,0xa),red_mat_opac))['set_new_size'] = function(ap, aq, ar) {
        this['geometry']['dispose'](),
        this['geometry'] = new THREE['BoxBufferGeometry'](ap,aq,ar);
    }
    ,
    wrong_place_box['visible'] = !0x1,
    scene['add'](wrong_place_box),
    scene['userData']['rulers'] = new THREE['Group'](),
    scene['userData']['rulers']['name'] = 'rulers',
    scene['add'](scene['userData']['rulers']),
    scene['userData']['grid'] = new THREE['Group'](),
    scene['userData']['grid']['name'] = 'grid',
    scene['userData']['grid']['userData']['by_axis'] = {
        'x': [],
        'y': [],
        'z': []
    },
    scene['userData']['grid']['clear'] = function() {
        for (let ap = this['children']['length']; ap--; )
            this['children'][ap]['geometry'] && this['children'][ap]['geometry']['dispose'](),
            this['remove'](this['children'][ap]);
        this['userData']['by_axis'] = {
            'x': [],
            'y': [],
            'z': []
        };
    }
    ,
    scene['add'](scene['userData']['grid']),
    scene['userData']['temp'] = new THREE['Group'](),
    scene['userData']['temp']['name'] = 'temp',
    scene['add'](scene['userData']['temp']),
    scene['userData']['ruler'] = new Ruler_obj({
        'p1': new THREE['Vector3'](),
        'p2': new THREE['Vector3'](),
        'depth': !0x1
    }),
    scene['userData']['ruler']['hide'](),
    scene['add'](scene['userData']['ruler']),
    scene['userData']['guides'] = new THREE['Group'](),
    scene['userData']['guides']['name'] = 'guides',
    scene['userData']['guides']['userData']['by_axis'] = {
        'x': [],
        'y': [],
        'z': []
    },
    scene['userData']['guides']['clear'] = function() {
        for (let ap = this['children']['length']; ap--; )
            this['children'][ap]['geometry'] && this['children'][ap]['geometry']['dispose'](),
            this['remove'](this['children'][ap]);
        this['userData']['by_axis'] = {
            'x': [],
            'y': [],
            'z': []
        };
    }
    ,
    scene['add'](scene['userData']['guides']),
    pp['project_settings'] = project_settings,
    pp['three']['mount'] = mount,
    view_mode || mount(),
    {
        'width': room_width,
        'height': room_height,
        'depth': room_depth
    });
    custom_settings['room_sizes'] && (L['width'] = custom_settings['room_sizes']['width'],
    L['height'] = custom_settings['room_sizes']['height'],
    L['depth'] = custom_settings['room_sizes']['depth']),
    custom_settings['floor_only'] && (L['floor_only'] = !0x0),
    (room = new Room(L))['addEventListener']('change', function() {
        0x1 == global_options['grid']['active'] && sc['draw_grid']();
    }),
    scene['add'](room),
    0x1 == custom_constructor_settings['default_edges_mode'] && (global_options['mode'] = 'edges',
    room['change_mode']()),
    pp['three']['room'] = room;
}
function mount() {
    var f = document['getElementById']('viewport');
    init_renderer(),
    selectionBox = new THREE['SelectionBox'](camera,scene),
    helper = new THREE['SelectionHelper'](renderer,'selectBox'),
    controls = new THREE['OrbitControls'](camera,renderer['domElement']),
    0x6e < THREE['REVISION'] && (controls['rotateRight_90'] = function() {
        this['_rotateLeft'](-Math['PI'] / 0x2),
        this['update']();
    }
    ),
    controls['target']['set'](0xee, 0x40, 0x11),
    controls['update'](),
    controls['addEventListener']('change', function(g) {
        pp['config']['on_demand_render'] && pp['render']();
    }),
    void 0x0 === THREE['Math'] && (THREE['Math'] = THREE['MathUtils']),
    0x1 == custom_settings['new_drag'] ? ((dControls = new THREE['DragControls2'](d_objects,camera,f))['addEventListener']('dragstart', function(g) {
        controls['enabled'] = !0x1;
    }),
    dControls['addEventListener']('dragend', function(g) {
        controls['enabled'] = !0x0;
    })) : ((dControls = new THREE['DragControls'](d_objects,camera,f))['addEventListener']('dragstart', function(g) {
        global_options['mouse_mode']['enabled_base_drag'] ? controls['enabled'] = !0x1 : controls['enabled'] = !0x0,
        pp['config']['on_demand_render'] && pp['render']();
    }),
    dControls['addEventListener']('drag', function(g) {
        pp['config']['on_demand_render'] && pp['render']();
    }),
    dControls['addEventListener']('dragend', function(g) {
        controls['enabled'] = !0x0,
        pp['config']['on_demand_render'] && pp['render']();
    }),
    dControls['addEventListener']('hoveron', function(g) {
        'function' == typeof g['object']['hover_on'] && g['object']['hover_on']();
    }),
    dControls['addEventListener']('hoveroff', function(g) {
        'function' == typeof g['object']['hover_off'] && g['object']['hover_off']();
    })),
    window['addEventListener']('resize', onWindowResize, !0x1),
    'function' == typeof pp['events']['global']['after_init'] && pp['events']['global']['after_init'](),
    onWindowResize(),
    render(),
    pp['config']['on_demand_render'] && pp['render']();
}
async function cornice_preload() {
    var f = cornice_lib['get_item'](project_settings['selected_cornice_model'])
      , g = f['params']?.['models']?.['common']?.['model'] || f['models']?.['common']
      , f = f['params']?.['models']?.['radius']?.['model'] || f['models']?.['radius']
      , h = []
      , [j,k] = (g && h['push'](load_model({
        'model': g
    })),
    f && h['push'](load_model({
        'model': f
    })),
    await Promise['all'](h))
      , l = []
      , m = [];
    if (g) {
        for (let n = 0x0; n < j['length']; n++)
            l['push'](new THREE['Mesh'](j[n],red_mat));
    }
    if (f) {
        for (let p = 0x0; p < k['length']; p++)
            m['push'](new THREE['Mesh'](k[p],red_mat));
    }
    global_options['cornice_data'] = {
        'model': l,
        'radius_model': m
    };
}
function onWindowResize() {
    var f = document['getElementById']('viewport')
      , g = f['clientWidth']
      , f = f['clientHeight'];
    camera['aspect'] = g / f,
    renderer['getPixelRatio'](),
    camera['aspect'] = g / f,
    camera['updateProjectionMatrix'](),
    renderer['setSize'](g, f),
    label_renderer['setSize'](g, f),
    camera_ortho['left'] = g / -0x2,
    camera_ortho['right'] = g / 0x2,
    camera_ortho['top'] = f / 0x2,
    camera_ortho['bottom'] = f / -0x2,
    camera_ortho['updateProjectionMatrix'](),
    pp['config']['on_demand_render'] && pp['render']();
}
function resize_viewport() {
    var f = document['getElementById']('viewport');
    camera['aspect'] = f['clientWidth'] / f['clientHeight'],
    camera['updateProjectionMatrix'](),
    renderer['setSize'](f['clientWidth'], f['clientHeight']),
    label_renderer['setSize'](f['clientWidth'], f['clientHeight']),
    pp['config']['on_demand_render'] && pp['render']();
}
function get_wall_panel() {}
function position_arrows() {
    var f, g, h, j, k, l, m;
    !document['getElementById']('left_panel') || 0x28 < document['getElementById']('left_panel')['width'] || (f = $('#camera_move_left'),
    g = $('#camera_move_right'),
    h = $('#camera_move_up'),
    j = $('#camera_move_down'),
    k = 0x0,
    l = 0x17,
    m = null,
    $('.left_subpanel')['each'](function() {
        0x0 < $(this)['offset']()['left'] && (m = $(this),
        k = 0x1);
    }),
    l = 0x1 === k ? m['width']() + m['offset']()['left'] + 0x5 : 0x17,
    g['css']({
        'right': -0xf,
        'top': window['innerHeight'] / 0x2 - 0x14
    }),
    f['css']({
        'left': l,
        'top': window['innerHeight'] / 0x2 - 0x14
    }),
    h['css']({
        'left': window['innerWidth'] / 0x2 - 0x14,
        'top': 0x19
    }),
    j['css']({
        'left': window['innerWidth'] / 0x2 - 0x14,
        'bottom': -0xa
    }));
}
function setBackground(f, g, h) {
    var i, g, h;
    f['background'] && (h = g / h / ((g = function(j) {
        var k = 0x0
          , l = 0x0
          , l = void 0x0 !== window['innerWidth'] ? (k = window['innerWidth'],
        window['innerHeight']) : (0x0 == document['documentElement']['clientWidth'] ? (k = document['body']['clientWidth'],
        document['body']) : (k = document['documentElement']['clientWidth'],
        document['documentElement']))['clientHeight'];
        return {
            'width': k - (j ? k - document['body']['offsetWidth'] + 0x1 : 0x0),
            'height': l
        };
    }(!0x0))['width'] / g['height']),
    f['background']['offset']['x'] = 0x1 < h ? (0x1 - 0x1 / h) / 0x2 : 0x0,
    f['background']['offset']['y'] = 0x1 < h ? 0x0 : (0x1 - h) / 0x2,
    f['background']['repeat']['x'] = 0x1 < h ? 0x1 / h : 0x1,
    f['background']['repeat']['y'] = 0x1 < h ? 0x1 : h);
}
mixers = [],
clock = new THREE['Clock'](),
_def_data = {},
document['addEventListener']('DOMContentLoaded', async function() {
    if (-0x1 < location['href']['indexOf']('/config') && (pp['is_config_page'] = !0x0),
    !pp['is_config_page'] && -0x1 < location['href']['indexOf']('catalogs') && (pp['catalog'] = location['pathname']['replace'](/\/+$/, '')['split']('/')['pop']()),
    WEBGL['isWebGLAvailable']()) {
        try {
            var f = JSON['parse'](document['getElementById']('ini_settings')['innerText']);
            f['tariff'] && f['tariff']['parent'] && (global_options['is_sub'] = !0x0,
            global_options['parent_name'] = f['tariff']['parent']);
        } catch (j) {}
        if (interface_version = document['getElementById']('interface_version') ? parseInt(document['getElementById']('interface_version')['value']) : 0x2,
        document['getElementById']('t_rnv_pp') && 0x1 == parseInt(document['getElementById']('t_rnv_pp')['value']) && !pp['is_config_page'])
            try {
                vkBridge['send']('VKWebAppInit')['then'](async k => {}
                )['catch'](k => {}
                );
            } catch (k) {}
        0x1 == (view_mode = document['getElementById']('viewport')['dataset']['preview'] ? !0x0 : view_mode) && Object['keys'](urls)['forEach'](function(l) {
            urls[l] = '/common_assets/data/preview_' + urls[l];
        });
        for (let l = 0x0; l < pp['custom']['item_types']['length']; l++)
            pp['engine']['item_types'][pp['custom']['item_types'][l]['key']] = pp['custom']['item_types'][l]['item'],
            pp['engine']['item_def_params'][pp['custom']['item_types'][l]['key']] = pp['custom']['item_types'][l]['def_params'];
        preload_arrows(),
        get_url_params();
        for (let m = 0x0; m < pp['events']['global']['before_load_params']['length']; m++) {
            var g = pp['events']['global']['before_load_params'][m];
            'AsyncFunction' === g['constructor']['name'] ? await g() : g();
        }
        if (await load_params(),
        'function' == typeof before_interface_callback && (pp['events']['global']['before_interface'] = before_interface_callback),
        'function' == typeof pp['events']['global']['before_interface'] && ('AsyncFunction' === pp['events']['global']['before_interface']['constructor']['name'] ? await pp['events']['global']['before_interface']() : pp['events']['global']['before_interface']()),
        accsessories_data && void 0x0 !== accsessories_data['types']) {
            Object['keys'](accsessories_data['default'])['forEach'](function(n) {
                null === accsessories_data['default'][n] || accsessories_data['items'][accsessories_data['default'][n]] || accsessories_data['types'][n] && (accsessories_data['default'][n] = Object['keys'](accsessories_data['types'][n])[0x0]),
                null !== accsessories_data['default'][n] && '' != accsessories_data['default'][n] && (accsessories_data['is_auto'] = !0x0);
            });
            for (var h = 0x0; h < accsessories_data['tree']['length']; h++)
                for (let n = 0x0; n < accsessories_data['tree'][h]['items']['length']; n++) {
                    var i = accsessories_data['items'][accsessories_data['tree'][h]['items'][n]];
                    i && i['images'] && (i['images'] = i['images']['replaceAll']('https://broskokitchenplanner.com', 'https://planplace.ru')),
                    void 0x0 === i['active'] && (i['active'] = 0x1);
                }
        }
        if (await cornice_preload(),
        check_interface_components(),
        pp['defaults']['order_form_fields'] = [{
            'id': 'name',
            'label': lang['name'],
            'required': 0x1,
            'required_check_type': 'non_empty',
            'type': 'text',
            'error': !0x1,
            'val': '',
            'placeholder': ''
        }, {
            'id': 'email',
            'label': lang['email'],
            'required': 0x1,
            'required_check_type': 'email',
            'type': 'text',
            'error': !0x1,
            'val': '',
            'placeholder': ''
        }, {
            'id': 'phone',
            'label': lang['phone'],
            'required': 0x1,
            'required_check_type': 'phone',
            'type': 'text',
            'val': '',
            'error': !0x1,
            'placeholder': '',
            'mask_enabled': !0x1,
            'mask_template': '+7\x20(999)\x20999-99-99'
        }, {
            'id': 'comments',
            'label': lang['comments'],
            'required': 0x0,
            'rows': 0x5,
            'required_check_type': '',
            'type': 'textarea',
            'val': '',
            'error': !0x1,
            'placeholder': ''
        }],
        'function' == typeof before_init && ('AsyncFunction' === before_init['constructor']['name'] ? await before_init() : before_init()),
        await pp['run_event']('global', 'before_init'),
        pp['storage'] = new IDBStorage(getClientIdFromUrl()),
        -0x1 < window['location']['href']['indexOf']('3dkitchen.project'))
            try {
                pp['is_local'] = !0x0,
                init(),
                view_mode || interface_init();
            } catch (o) {}
        else
            try {
                init(),
                view_mode || interface_init();
            } catch (p) {
                $('body')['html']('')['append']('<p\x20style=\x22text-align:\x20center;\x20padding-top:\x20190px;\x20font-size:\x2020px;\x22>' + lang['error_constructor_init'] + '\x20support@planplace.ru</p><p\x20style=\x22text-align:\x20center\x22>' + lang['error_constructor_screen'] + ':\x20<br>' + p + '</p>');
            }
        0x1 == project_settings['is_kitchen_model'] && location['search']['indexOf']('?co=') < 0x0 && (global_options['url_params']['file_url'] || change_kitchen_style(project_settings['id'], !0x0, !0x1)),
        document['dispatchEvent'](new CustomEvent('PP_ready',{
            'detail': {
                'pp': pp
            }
        }));
    } else
        document['body']['innerHTML'] = WEBGL['getWebGLErrorMessage']();
}),
Array['prototype']['unique'] = function() {
    for (var f = [], g = 0x0; g < this['length']; g++) {
        var h = this[g];
        f['indexOf'](h) < 0x0 && f['push'](h);
    }
    return f;
}
,
(f => {
    var g = f['Uint8Array'], f, h = (f = f['HTMLCanvasElement']) && f['prototype'], i = /\s*;\s*base64\s*(?:;|$)/i, j = 'toDataURL', k, l = function(p) {
        for (var q = p['length'], u = new g(q / 0x4 * 0x3 | 0x0), v = 0x0, w = 0x0, x = [0x0, 0x0], y = 0x0, z = 0x0, A, B, C; q--; )
            B = p['charCodeAt'](v++),
            0xff !== (A = k[B - 0x2b]) && A !== C && (x[0x1] = x[0x0],
            x[0x0] = B,
            z = z << 0x6 | A,
            0x4 === ++y) && (u[w++] = z >>> 0x10,
            0x3d !== x[0x1] && (u[w++] = z >>> 0x8),
            0x3d !== x[0x0] && (u[w++] = z),
            y = 0x0);
        return u;
    };
    g && (k = new g([0x3e, -0x1, -0x1, -0x1, 0x3f, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x3b, 0x3c, 0x3d, -0x1, -0x1, -0x1, 0x0, -0x1, -0x1, -0x1, 0x0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x9, 0xa, 0xb, 0xc, 0xd, 0xe, 0xf, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, -0x1, -0x1, -0x1, -0x1, -0x1, -0x1, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d, 0x2e, 0x2f, 0x30, 0x31, 0x32, 0x33])),
    !f || h['toBlob'] && h['toBlobHD'] || (h['toBlob'] || (h['toBlob'] = function(p, q) {
        var u, u, v, w, u, x;
        q = q || 'image/png',
        this['mozGetAsFile'] ? p(this['mozGetAsFile']('canvas', q)) : this['msToBlob'] && /^\s*image\/png\s*(?:$|;)/i['test'](q) ? p(this['msToBlob']()) : (u = Array['prototype']['slice']['call'](arguments, 0x1),
        v = (u = this[j]['apply'](this, u))['indexOf'](','),
        w = u['substring'](v + 0x1),
        u = i['test'](u['substring'](0x0, v)),
        Blob['fake'] ? ((x = new Blob())['encoding'] = u ? 'base64' : 'URI',
        x['data'] = w,
        x['size'] = w['length']) : g && (x = u ? new Blob([l(w)],{
            'type': q
        }) : new Blob([decodeURIComponent(w)],{
            'type': q
        })),
        p(x));
    }
    ),
    !h['toBlobHD'] && h['toDataURLHD'] ? h['toBlobHD'] = function() {
        j = 'toDataURLHD';
        var o = this['toBlob']();
        return j = 'toDataURL',
        o;
    }
    : h['toBlobHD'] = h['toBlob']);
}
)('undefined' != typeof self && self || 'undefined' != typeof window && window || this['content'] || this);
let materials_cache = {};
function create_material(f, j=null) {
    (f = f || {})['add_params'] || (f['add_params'] = {});
    let k;
    try {
        k = texture_loader;
    } catch (I) {
        k = new THREE['TextureLoader']();
    }
    if (j) {
        var q, v, w, x = (void 0x0 !== f['add_params']['model_width'] ? f['add_params']['model_width'] : 0x100) + '_' + (void 0x0 !== f['add_params']['model_width'] ? f['add_params']['model_height'] : 0x100) + '_' + (void 0x0 !== f['add_params']['rotation'] ? f['add_params']['rotation'] : 'normal') + '_' + j;
        if (materials_cache[x])
            return materials_cache[x];
    }
    let y, z, A, B = 0x0;
    var C = {
        'type': void 0x0 !== f['type'] ? f['type'] : 'Phong',
        'params': void 0x0 !== f['params'] ? JSON['parse'](JSON['stringify'](f['params'])) : {},
        'add_params': {
            'texture_width': void 0x0 !== f['add_params']['texture_width'] ? f['add_params']['texture_width'] : 0x100,
            'texture_height': void 0x0 !== f['add_params']['texture_height'] ? f['add_params']['texture_height'] : 0x100,
            'normal_map_width': void 0x0 !== f['add_params']['normal_map_width'] ? f['add_params']['normal_map_width'] : 0x100,
            'normal_map_height': void 0x0 !== f['add_params']['normal_map_height'] ? f['add_params']['normal_map_height'] : 0x100,
            'normal_stretch_width': void 0x0 !== f['add_params']['normal_stretch_width'] && f['add_params']['normal_stretch_width'],
            'normal_stretch_height': void 0x0 !== f['add_params']['normal_stretch_height'] && f['add_params']['normal_stretch_height'],
            'real_width': void 0x0 !== f['add_params']['real_width'] ? f['add_params']['real_width'] : 0x100,
            'real_height': void 0x0 !== f['add_params']['real_height'] ? f['add_params']['real_height'] : 0x100,
            'model_width': void 0x0 !== f['add_params']['model_width'] ? f['add_params']['model_width'] : 0x100,
            'model_height': void 0x0 !== f['add_params']['model_height'] ? f['add_params']['model_height'] : 0x100,
            'rotation': void 0x0 !== f['add_params']['rotation'] ? f['add_params']['rotation'] : 'normal',
            'stretch_width': void 0x0 !== f['add_params']['stretch_width'] && f['add_params']['stretch_width'],
            'stretch_height': void 0x0 !== f['add_params']['stretch_height'] && f['add_params']['stretch_height'],
            'normal_scale': void 0x0 !== f['add_params']['normal_scale'] && f['add_params']['normal_scale'],
            'wrapping': void 0x0 !== f['add_params']['wrapping'] ? f['add_params']['wrapping'] : 'mirror',
            'normal_wrapping': void 0x0 !== f['add_params']['normal_wrapping'] ? f['add_params']['normal_wrapping'] : 'mirror',
            'roughness_wrapping': void 0x0 !== f['add_params']['roughness_wrapping'] ? f['add_params']['roughness_wrapping'] : 'mirror',
            'debug': void 0x0 !== f['add_params']['debug'] && f['add_params']['debug']
        }
    }, x, f, x, f, x, f, x, f, D, E, F, G;
    if (delete C['params']['icon'],
    'Standart' == C['type'] && (C['type'] = 'Standard'),
    C['params']['side'] && 'double' == C['params']['side'] && (C['params']['side'] = THREE['DoubleSide']),
    C['params']['metalness'] && (C['params']['metalness'] = parseFloat(C['params']['metalness'])),
    C['params']['roughness'] && (C['params']['roughness'] = parseFloat(C['params']['roughness'])),
    C['params']['opacity'] && (C['params']['opacity'] = parseFloat(C['params']['opacity'])),
    C['params']['transparent'] && (C['params']['transparent'] = 0x1 === to_int(C['params']['transparent'])),
    C['add_params']['normal_scale'] && (C['params']['normalScale'] = new THREE['Vector2'](C['add_params']['normal_scale'],C['add_params']['normal_scale']),
    delete C['add_params']['normal_scale']),
    C['params']['alphaMap'] && (x = k['load'](correct_url(C['params']['alphaMap'])),
    'repeat' === C['add_params']['wrapping'] ? x['wrapS'] = x['wrapT'] = THREE['RepeatWrapping'] : x['wrapS'] = x['wrapT'] = THREE['MirroredRepeatWrapping'],
    z = 0x1 == C['add_params']['stretch_width'] ? 0x1 : C['add_params']['model_width'] / C['add_params']['real_width'],
    A = 0x1 == C['add_params']['stretch_height'] ? 0x1 : C['add_params']['model_height'] / C['add_params']['real_height'],
    x['repeat']['set'](z, A),
    C['params']['alphaMap'] = x),
    C['params']['map'] && (f = k['load'](correct_url(C['params']['map'])),
    'repeat' === C['add_params']['wrapping'] ? f['wrapS'] = f['wrapT'] = THREE['RepeatWrapping'] : f['wrapS'] = f['wrapT'] = THREE['MirroredRepeatWrapping'],
    0x0 === B && (A = 'normal' === C['add_params']['rotation'] ? (f['center']['set'](Math['random'](), Math['random']()),
    z = 0x1 == C['add_params']['stretch_width'] ? 0x1 : C['add_params']['model_width'] / C['add_params']['real_width'],
    0x1 == C['add_params']['stretch_height'] ? 0x1 : C['add_params']['model_height'] / C['add_params']['real_height']) : (f['center']['set'](0.5, 0.5),
    f['rotation'] = Math['PI'] / 0x2,
    f['center']['set'](Math['random'](), Math['random']()),
    z = 0x1 == C['add_params']['stretch_width'] ? 0x1 : C['add_params']['model_height'] / C['add_params']['real_height'],
    C['add_params']['stretch_height'] ? 0x1 : C['add_params']['model_width'] / C['add_params']['real_width']),
    f['repeat']['set'](z, A),
    B = 0x1),
    C['params']['map'] = f),
    C['params']['normalMap'] && ((x = k['load'](correct_url(C['params']['normalMap'])))['wrapS'] = x['wrapT'] = THREE['RepeatWrapping'],
    'repeat' === C['add_params']['normal_wrapping'] ? x['wrapS'] = x['wrapT'] = THREE['RepeatWrapping'] : x['wrapS'] = x['wrapT'] = THREE['MirroredRepeatWrapping'],
    z = 0x1 == C['add_params']['normal_stretch_width'] ? 0x1 : C['add_params']['model_width'] / C['add_params']['normal_map_width'],
    A = C['add_params']['normal_stretch_height'] ? 0x1 : C['add_params']['model_height'] / C['add_params']['normal_map_height'],
    x['repeat']['set'](z, A),
    C['params']['normalMap'] = x),
    C['params']['metalnessMap'] && (f = k['load'](correct_url(C['params']['metalnessMap'])),
    C['params']['metalnessMap'] = f),
    C['params']['roughnessMap'] && (x = k['load'](correct_url(C['params']['roughnessMap'])),
    'repeat' === C['add_params']['roughness_wrapping'] ? x['wrapS'] = x['wrapT'] = THREE['RepeatWrapping'] : x['wrapS'] = x['wrapT'] = THREE['MirroredRepeatWrapping'],
    0x0 === B && (z = 0x1 == C['add_params']['stretch_width'] ? 0x1 : C['add_params']['model_width'] / C['add_params']['real_width'],
    A = C['add_params']['stretch_height'] ? 0x1 : C['add_params']['model_height'] / C['add_params']['real_height'],
    B = 0x1),
    x['repeat']['set'](z, A),
    C['params']['roughnessMap'] = x),
    C['params']['aoMap'] && (f = k['load'](correct_url(C['params']['aoMap'])),
    C['params']['aoMap'] = f),
    C['params']['displacementMap'] && (x = k['load'](correct_url(C['params']['displacementMap'])),
    C['params']['displacementMap'] = x),
    C['params']['emissiveMap'] && (f = k['load'](correct_url(C['params']['emissiveMap'])),
    C['params']['emissiveMap'] = f),
    C['params']['envMap'] && (C['params']['envMap'] = k['load'](correct_url(C['params']['envMap']))),
    C['params']['bumpMap']) {
        var x = k['load'](correct_url(C['params']['bumpMap']));
        x['wrapS'] = x['wrapT'] = THREE['RepeatWrapping'],
        0x0 === B && (z = C['add_params']['model_width'] / C['add_params']['real_width'],
        A = C['add_params']['model_height'] / C['add_params']['real_height']),
        x['repeat']['set'](z, A),
        C['params']['bumpMap'] = x;
        let J = 0x1;
        THREE['REVISION'] < 0xaa && (J = 0.2),
        C['params']['bumpScale'] = J;
    }
    let H = 0x0;
    switch ((THREE['REVISION'] < 0x78 || 0x1 == C['params']['metalness']) && (H = 0x1),
    C['type']) {
    case 'Basic':
        y = new THREE['MeshBasicMaterial'](C['params']);
        break;
    default:
        try {
            C['params']['envMap'] = textureCube2,
            C['params']['envMapIntensity'] = H;
        } catch (K) {}
        0x0 != (y = new THREE['MeshStandardMaterial'](C['params']))['transparent'] && 0x1 != y['opacity'] && (y['depthWrite'] = !0x1),
        j && (G = C['add_params']['model_width'] + '_' + C['add_params']['model_height'] + '_' + C['add_params']['rotation'] + '_' + j,
        materials_cache[G] || (materials_cache[G] = y));
        break;
    }
    return y;
}
function correct_url(e) {
    let f = e;
    return f['indexOf']('common_assets') < 0x0 && f['indexOf']('http') < 0x0 && f['indexOf']('base64') < 0x0 ? (f = global_options['acc_url'] + '/' + e,
    global_options['is_sub'] && (f = f['replace'](global_options['account_name'], global_options['parent_name']))) : 'undefined' != typeof constructor_settings && 0x1 == constructor_settings['icons_type'] && -0x1 < f['indexOf']('modules_templates') && (f = f['replace']('v3', 'v4')),
    f;
}
function dispose_material(e) {
    if (isArray(e)) {
        for (let f = 0x0; f < e['length']; f++)
            e[f]['map'] && e[f]['map']['dispose'](),
            e[f]['normalMap'] && e[f]['normalMap']['dispose'](),
            e[f]['bumpMap'] && e[f]['bumpMap']['dispose'](),
            e[f]['metalnessMap'] && e[f]['metalnessMap']['dispose']();
    } else
        e['map'] && e['map']['dispose'](),
        e['normalMap'] && e['normalMap']['dispose'](),
        e['bumpMap'] && e['bumpMap']['dispose'](),
        e['metalnessMap'] && e['metalnessMap']['dispose']();
}
function create_material_by_id(e, f) {
    return f = f || materials_catalog,
    create_material(get_material_by_id(parseInt(e), f));
}
function get_material_by_id(e, f) {
    var f;
    return (f = f || materials_catalog) == materials_catalog ? materials_lib['get_item'](e) : (f = find_obj_by_id(f['items'], e)) ? copy_object(f) : null;
}
function get_material_category_by_id(e, f) {
    var f;
    return f = f || materials_catalog,
    null != (f = _['find'](f['categories'], function(g) {
        return g['id'] == e;
    })) ? copy_object(f) : null;
}
function get_material_category_by_id_no_items(f, g) {
    g = g || materials_catalog;
    let h = _['find'](g['categories'], function(j) {
        return j['id'] === parseInt(f);
    });
    var g, i = (h || (h = {
        'id': 0x0,
        'name': 'НЕТ\x20КАТЕГОРИИ'
    },
    g == glass_materials_catalog && (h['name'] = 'Стекло')),
    {
        'id': h['id'],
        'name': h['name']
    });
    return h['parent'] && (g = _['find'](g['categories'], function(j) {
        return j['id'] === parseInt(h['parent']);
    }),
    i['parent_id'] = g['id'],
    i['parent_name'] = g['name']),
    i;
}
function get_top_material_category_by_material_id(e) {
    var e = find_obj_by_id(materials_catalog['items'], e);
    return e ? get_top_material_category(e['category']) : 0x0;
}
function get_top_material_category(e) {
    var e = find_obj_by_id(materials_catalog['categories'], e);
    return e['parent'] && 0x0 !== e['parent'] ? get_top_material_category(e['parent']) : e;
}
function check_material_in_category(f, g) {
    if (f && g) {
        var h = get_top_material_category_by_material_id(g);
        if (h) {
            for (let i = 0x0; i < f['length']; i++)
                if (f[i] == h['id'])
                    return !0x0;
        }
    }
    return !0x1;
}
function get_first_material_from_category(e) {
    var f = get_material_category_by_id(e);
    if (f['items'])
        return f['items'][0x0];
    for (let g = 0x0; g < f['categories']['length']; g++)
        if (f['categories'][g]['items'] && f['categories'][g]['items'][0x0])
            return f['categories'][g]['items'][0x0];
}
function get_material_data(f, g) {
    var h = {};
    let i = get_material_by_id(f, g = g || materials_catalog);
    i = i || {
        'id': 0x0,
        'name': 'Материал\x20не\x20существует',
        'code': ''
    },
    h['id'] = i['id'],
    h['name'] = i['name'],
    h['code'] = i['code'],
    h['color'] = void 0x0,
    h['map'] = void 0x0,
    i['params'] && (h['color'] = i['params']['color'],
    i['params']['map']) && (h['map'] = i['params']['map']);
    var f = get_material_category_by_id_no_items(i['category'], g), f;
    return h['category_name'] = f['name'],
    h['category'] = i['category'],
    f['parent_id'] && (f = get_material_category_by_id_no_items(f['parent_id'], g),
    h['parent_category_name'] = f['name'],
    h['parent_category'] = f['id']),
    h;
}
class Model_utils {
    constructor() {}
    static['cache'] = {};
    static['loaders'] = {
        'fbx': fbx_loader,
        'gltf': gltf_loader,
        'glb': gltf_loader,
        'obj': obj_loader,
        '3ds': tds_loader,
        'dae': collada_loader
    };
    static['get_model_from_cache'](f) {
        return this['cache'][f];
    }
    static['add_geometry_to_cache'](f, g) {
        void 0x0 === this['get_model_from_cache'](f) && (this['cache'][f] = {
            'model': f,
            'geometry': g
        });
    }
    static['load_model'](e) {
        if ('' != e['model']) {
            e['center_g'] || (e['center_g'] = 0x1);
            let f = e['model']['split']('.')['pop']()['toLowerCase']();
            if (void 0x0 === e['process'] && (e['process'] = 0x1),
            !e['no_cache'] && 0x1 == e['process'] && this['get_model_from_cache'](e['model']))
                return this['get_model_from_cache'](e['model'])['geometry'];
            e['rot'] || (e['rot'] = {
                'x': 0x0,
                'y': 0x0,
                'z': 0x0
            }),
            e['scale'] || (e['scale'] = {
                'x': 0x0,
                'y': 0x0,
                'z': 0x0
            });
            let g = e['model'];
            return -0x1 < g['indexOf']('broskokitchenplanner.com') && g['replace']('https://broskokitchenplanner.com', 'https://planplace.ru'),
            g['indexOf']('common_assets') < 0x0 && g['indexOf']('http') < 0x0 && (g = global_options['acc_url'] + e['model'],
            global_options['is_sub']) && (g = g['replace'](global_options['account_name'], global_options['parent_name'])),
            pp['is_local'] && -0x1 < g['indexOf']('https://planplace.ru') && g['replace']('https://planplace.ru', 'http://3dkitchen.project'),
            e['buffer'] = !0x0,
            loadingModels['add'](g),
            0x1 == e['process'] ? new Promise( (h, i) => {
                this['loaders'][f]['load'](g, j => {
                    loadingModels['remove'](g),
                    (j = j['scene'] ? j['scene'] : j)['updateMatrixWorld'](!0x0);
                    let k = [];
                    j['traverse'](l => {
                        var m;
                        'Mesh' != l['type'] && 'LineSegments' != l['type'] || ((m = l['geometry']['clone']())['scale'](l['scale']['x'], l['scale']['y'], l['scale']['z']),
                        m['name'] = l['name'],
                        k['push'](m));
                    }
                    ),
                    e['no_cache'] ? h(k) : (this['add_geometry_to_cache'](e['model'], k),
                    h(this['get_model_from_cache'](e['model'])['geometry']));
                }
                );
            }
            ) : new Promise( (h, i) => {
                this['loaders'][f]['load'](g, function(j) {
                    loadingModels['remove'](g),
                    (j = j['scene'] ? j['scene'] : j)['updateMatrixWorld'](!0x0),
                    h(j);
                });
            }
            );
        }
    }
    static['get_meshes'](f) {
        let g = [];
        return f['traverse'](h => {
            'Mesh' != h['type'] && 'LineSegments' != h['type'] || g['push'](h);
        }
        ),
        g;
    }
    static['get_model_meshes'](e) {
        loadingModels['add'](e);
        let f = e['split']('.')['pop']()['toLowerCase']()
          , g = [];
        return new Promise( (h, i) => {
            this['loaders'][f]['load'](e, function(j) {
                loadingModels['remove'](e),
                (j = j['scene'] ? j['scene'] : j)['traverse'](k => {
                    'Mesh' != k['type'] && 'LineSegments' != k['type'] || g['push'](k['name']);
                }
                ),
                h(g);
            });
        }
        );
    }
    static async['try_get_model_meshes'](f) {
        loadingModels['add'](f);
        let g = f['split']('.')['pop']()['toLowerCase']()
          , h = [];
        try {
            var i;
            return await new Promise( (j, k) => {
                this['loaders'][g] ? this['loaders'][g]['load'](f, function(l) {
                    try {
                        loadingModels['remove'](f),
                        (l = l['scene'] ? l['scene'] : l)['traverse'](m => {
                            'Mesh' != m['type'] && 'LineSegments' != m['type'] || h['push'](m['name']);
                        }
                        ),
                        j(h);
                    } catch (m) {
                        k(m);
                    }
                }, function(l) {}, function(l) {
                    loadingModels['remove'](f),
                    k(new Error('Failed\x20to\x20load\x20model\x20from\x20' + f + ':\x20' + (l['message'] || l)));
                }) : k(new Error('No\x20loader\x20found\x20for\x20extension:\x20' + g));
            }
            );
        } catch (j) {
            return loadingModels['remove'](f),
            [];
        }
    }
    static['parse_mesh_name'](f) {
        var g = {
            'v': 0x1,
            'm': '',
            't': '',
            's': ''
        }, h, j, k;
        if (/v\([^)]*\)/['test'](f) || f['includes']('('))
            for (k of f['split']('_')) {
                var p = k['match'](/([a-zA-Z]+)\(([^)]*)\)/), p, q, u;
                p && ([,p,q] = p,
                u = Number(q),
                g[p] = isNaN(u) || '' === q ? q : u);
            }
        else {
            var f = f['split']('_'), v = ['gen', 'glass', 'mirror', 'back', 'black', 'al'], w = /^[xyz]+$/, y, f;
            for (y of f)
                v['includes'](y) ? g['m'] = y : w['test'](y) && !g['t'] && (g['t'] = y);
            0x0 === Object['keys'](g)['length'] && 0x2 <= f['length'] && 0x2 <= (f = f['filter'](B => '' !== B['trim']()))['length'] && (g['m'] = f[0x0],
            g['t'] = f[0x1]);
        }
        var z = {
            'x': 0x0,
            'y': 0x0,
            'z': 0x0
        };
        for (let B = 0x0; B < g['t']['length']; B++)
            z[g['t'][B]] = 0x1;
        g['t'] = z;
        var A = {
            'x': 0x0,
            'y': 0x0,
            'z': 0x0
        };
        for (let C = 0x0; C < g['s']['length']; C++)
            A[g['s'][C]] = 0x1;
        return g['s'] = A,
        g['tax'] = {
            'x': 'x',
            'y': 'y'
        },
        g;
    }
    static['set_size'](f, g, h) {
        var j = f['geometry']['attributes']['position'];
        let k = new THREE['Vector3'](h['size']['x'],h['size']['y'],h['size']['z'])['sub'](h['box'])['divideScalar'](0x2);
        var l = ['x', 'y', 'z'];
        let m = {
            'x': 0x1,
            'y': 0x1,
            'z': 0x1
        }
          , p = {
            'x': [0x0, 0x0],
            'y': [0x0, 0x0],
            'z': [0x0, 0x0]
        };
        for (let q = 0x0; q < j['count']; q++) {
            let u = {
                'x': j['getX'](q),
                'y': j['getY'](q),
                'z': j['getZ'](q)
            };
            l['forEach'](v => {
                0x0 != h['t'][v] && (u[v] < p[v][0x0] && (u[v] = u[v] - k[v] / m[v]),
                u[v] > p[v][0x1]) && (u[v] = u[v] + k[v] / m[v]),
                0x0 != h['s'][v] && (u[v] *= h['size'][v] / h['box'][v]);
            }
            ),
            j['setXYZ'](q, u['x'], u['y'], u['z']);
        }
    }
    static['set_scale'](f, g) {
        var h = f['geometry']['attributes']['position']
          , i = ['x', 'y', 'z'];
        for (let j = 0x0; j < h['count']; j++) {
            let k = {
                'x': h['getX'](j),
                'y': h['getY'](j),
                'z': h['getZ'](j)
            };
            i['forEach'](l => {
                k[l] *= g[l];
            }
            ),
            h['setXYZ'](j, k['x'], k['y'], k['z']);
        }
    }
}
function load_model(f) {
    return Model_utils['load_model'](f);
}
function load_envmap(e={}) {
    return e['urls'] || (e['urls'] = ['/common_assets/tests/prod/test12.jpg', '/common_assets/tests/prod/test12.jpg', '/common_assets/tests/prod/test12.jpg', '/common_assets/tests/prod/test12.jpg', '/common_assets/tests/prod/test12.jpg', '/common_assets/tests/prod/test12.jpg']),
    new Promise(function(f, g) {
        new THREE['CubeTextureLoader']()['load'](e['urls'], function(h) {
            f(h);
        });
    }
    );
}
function correct_uv(f, g) {
    f['computeBoundingBox'](),
    g['computeBoundingBox']();
    var h = (g['boundingBox']['max']['x'] - g['boundingBox']['min']['x']) / (f['boundingBox']['max']['x'] - f['boundingBox']['min']['x'])
      , j = (g['boundingBox']['max']['y'] - g['boundingBox']['min']['y']) / (f['boundingBox']['max']['y'] - f['boundingBox']['min']['y']);
    for (let k = 0x0; k < g['faceVertexUvs']['length']; k++)
        for (let m = 0x0; m < g['faceVertexUvs'][k]['length']; m++)
            for (let p = 0x0; p < g['faceVertexUvs'][k][m]['length']; p++) {
                let q = g['faceVertexUvs'][k][m][p]
                  , u = q['x']
                  , v = q['y'];
                0x0 < u && u < 0x1 && (u < 0.5 ? u /= h : 0.5 < u && (u = 0x1 - (0x1 - u) / h)),
                0x0 < v && v < 0x1 && (v < 0.5 ? v /= j : 0.5 < v && (v = 0x1 - (0x1 - v) / j)),
                q['set'](u, v);
            }
}
function correct_uv_buff(f, g) {
    if (f && g) {
        f['computeBoundingBox'](),
        g['computeBoundingBox']();
        var h = g['attributes']['uv'];
        if (h) {
            var i = (g['boundingBox']['max']['x'] - g['boundingBox']['min']['x']) / (f['boundingBox']['max']['x'] - f['boundingBox']['min']['x'])
              , j = (g['boundingBox']['max']['y'] - g['boundingBox']['min']['y']) / (f['boundingBox']['max']['y'] - f['boundingBox']['min']['y']);
            g['name']['indexOf']('steklo2');
            for (let k = 0x0; k < h['count']; k++) {
                let l = h['getX'](k)
                  , m = h['getY'](k);
                0x0 < l && l < 0x1 && (l < 0.5 ? l /= i : 0.5 < l && (l = 0x1 - (0x1 - l) / i)),
                0x0 < m && m < 0x1 && (m < 0.5 ? m /= j : 0.5 < m && (m = 0x1 - (0x1 - m) / j)),
                h['setXY'](k, l, m);
            }
            g['attributes']['uv']['needsUpdate'] = !0x0;
        }
    }
}
function set_size_buff(h, j, k) {
    var q = h['geometry']['attributes']['position']
      , v = (k['size'] || (k['size'] = {},
    k['size']['x'] = k['width'],
    k['size']['y'] = k['height'],
    k['size']['z'] = k['depth']),
    new THREE['Vector3'](k['size']['x'],k['size']['y'],k['size']['z'])['sub'](k['box'])['divideScalar'](0x2));
    if (-0x1 < j['indexOf']('v(2)') || -0x1 < j['indexOf']('v(3)')) {
        var w = j['match'](/_s\((.*?)\)/)
          , y = j['match'](/_t\((.*?)\)/);
        if (null !== w && (-0x1 < w[0x1]['indexOf']('x') && (h['scale']['x'] = k['size']['x'] / k['box']['x']),
        -0x1 < w[0x1]['indexOf']('y') && (h['scale']['y'] = k['size']['y'] / k['box']['y']),
        -0x1 < w[0x1]['indexOf']('z')) && (h['scale']['z'] = k['size']['z'] / k['box']['z']),
        null !== y) {
            let G = [0x1, 0x1, 0x1];
            var w = j['match'](/_tdiv\((.*?)\)/)
              , h = (null != w && (G = w[0x1]['split'](',')),
            j['match'](/_tpx\((.*?)\)/))
              , w = j['match'](/_tpy\((.*?)\)/)
              , z = j['match'](/_tpz\((.*?)\)/);
            let H = [0x0, 0x0]
              , I = [0x0, 0x0]
              , J = [0x0, 0x0]
              , K = 0x0
              , L = 0x0
              , N = 0x0;
            null != h && ((H = h[0x1]['split'](','))[0x0] = parseInt(H[0x0]) / units,
            H[0x1] = parseInt(H[0x1]) / units,
            K = 0x1),
            null != w && ((I = w[0x1]['split'](','))[0x0] = parseInt(I[0x0]) / units,
            I[0x1] = parseInt(I[0x1]) / units,
            L = 0x1),
            null != z && ((J = z[0x1]['split'](','))[0x0] = parseInt(J[0x0]) / units,
            J[0x1] = parseInt(J[0x1]) / units,
            N = 0x1);
            for (let O = 0x0; O < q['count']; O++) {
                var A = q['getX'](O)
                  , B = q['getY'](O)
                  , C = q['getZ'](O);
                let P = A
                  , Q = B
                  , R = C;
                -0x1 < y[0x1]['indexOf']('x') && (0x0 == K ? A < 0x0 ? P -= v['x'] / G[0x0] : P += v['x'] / G[0x0] : (A < H[0x0] && (P -= v['x'] / G[0x0]),
                A > H[0x1] && (P += v['x'] / G[0x0]))),
                -0x1 < y[0x1]['indexOf']('y') && (0x0 == L ? B < 0x0 ? Q -= v['y'] / G[0x0] : Q += v['y'] / G[0x0] : (B < I[0x0] && (Q -= v['y'] / G[0x0]),
                B > I[0x1] && (Q += v['y'] / G[0x0]))),
                -0x1 < y[0x1]['indexOf']('z') && (0x0 == N ? C < 0x0 ? R -= v['z'] / G[0x0] : R += v['z'] / G[0x0] : (B < J[0x0] && (R -= v['z'] / G[0x0]),
                B > J[0x1] && (R += v['z'] / G[0x0]))),
                q['setXYZ'](O, P, Q, R);
            }
        }
    } else {
        let S = -0x1 < j['indexOf']('x')
          , T = -0x1 < j['indexOf']('y')
          , U = -0x1 < j['indexOf']('z');
        0x1 == k['is_handle'] && (S = 0x1,
        T = 0x0,
        U = 0x0);
        for (let W = 0x0; W < q['count']; W++) {
            var D = q['getX'](W)
              , E = q['getY'](W)
              , F = q['getZ'](W);
            let Z = D
              , a0 = E
              , a1 = F;
            S && (D < 0x0 ? Z -= v['x'] : Z += v['x']),
            T && (E < 0x0 ? a0 -= v['y'] : a0 += v['y']),
            U && (F < 0x0 ? a1 -= v['z'] : a1 += v['z']),
            q['setXYZ'](W, Z, a0, a1);
        }
    }
}
let t_s1, t_s2;
function get_drag_areas(f, g) {
    var h = [];
    for (let i = f['length']; i--; )
        'Module' === f[i]['userData']['class'] && f[i]['uuid'] != g['uuid'] && 0x1 !== f[i]['userData']['params']['spec']['is_fill'] && h['push'](...f[i]['get_drag_areas'](g['userData']['params']['id'] + ''));
    return h;
}
function get_drag_areas_embed(f, g) {
    let h = [];
    for (let i = f['length']; i--; )
        'Module' === f[i]['userData']['class'] && f[i]['uuid'] !== g['uuid'] && !0x0 !== f[i]['userData']['params']['spec']['is_fill'] && f[i]['userData']['parts']?.['fill_section'] && Object['values'](f[i]['userData']['parts']['fill_section'])['forEach'](j => {
            j['drag_area'] && j['drag_area']['visible'] && h['push'](j['drag_area']);
        }
        );
    return h;
}
function get_snap_points(f) {
    var g = {}, h, j;
    let k = f['userData']['children'];
    f['userData']['params']['spec']['replace'] && 0x0 < k['length'] && 0x0 < k['map']( (w, x) => 'Module' === w['temp_type'] ? x : -0x1)['filter'](w => -0x1 !== w)['length'] && (k = k['filter'](w => 'Module' !== w['temp_type']));
    for (let w = 0x0; w < k['length']; w++)
        if (k[w]['userData']['params']) {
            var m = k[w]
              , p = m['userData']['path']
              , q = []
              , u = [{
                'x': 0x0,
                'y': 0x0,
                'z': 0x0
            }, {
                'x': 's:x',
                'y': 0x0,
                'z': 0x0
            }, {
                'x': 's:x',
                'y': 's:y',
                'z': 0x0
            }, {
                'x': 0x0,
                'y': 's:y',
                'z': 0x0
            }, {
                'x': 0x0,
                'y': 0x0,
                'z': 's:z'
            }, {
                'x': 's:x',
                'y': 0x0,
                'z': 's:z'
            }, {
                'x': 's:x',
                'y': 's:y',
                'z': 's:z'
            }, {
                'x': 0x0,
                'y': 's:y',
                'z': 's:z'
            }];
            for (let x = 0x0; x < u['length']; x++) {
                q['push']({
                    'pos': u[x]
                });
                var v = m['userData']['params']['spec']['snap_points']?.[x];
                v && q['push']({
                    'pos': v
                });
            }
            g[p] = q;
        }
    return f['userData']['path'] && (g[f['userData']['path']] = (j = [{
        'x': 0x0,
        'y': 0x0,
        'z': 0x0
    }, {
        'x': 's:x',
        'y': 0x0,
        'z': 0x0
    }, {
        'x': 's:x',
        'y': 's:y',
        'z': 0x0
    }, {
        'x': 0x0,
        'y': 's:y',
        'z': 0x0
    }, {
        'x': 0x0,
        'y': 0x0,
        'z': 's:z'
    }, {
        'x': 's:x',
        'y': 0x0,
        'z': 's:z'
    }, {
        'x': 's:x',
        'y': 's:y',
        'z': 's:z'
    }, {
        'x': 0x0,
        'y': 's:y',
        'z': 's:z'
    }])['map'](y => ({
        'pos': y
    }))),
    g;
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
function get_section_intersection_embed(f, g, h) {
    if (pp['events']['drag']['intersection_embed']) {
        var i = pp['events']['drag']['intersection_embed'](f, g, h);
        if (i && i['obj'])
            return i;
    }
    var i = g['layers']['mask'];
    if (g['layers']['set'](0x1),
    f) {
        var j = g['intersectObject'](f, !0x0);
        if (0x0 < j['length'])
            return f['highlight'](),
            g['layers']['mask'] = i,
            {
                'obj': f,
                'point': j[0x0]['point']
            };
        f['unhighlight']();
        var j = f['userData']['parent'];
        j instanceof CabinetFillSection && (0x0 < j['userData']['children']['length'] && (j['userData']['children']['forEach'](k => {
            k['snap_points_group'] && (k['remove'](k['snap_points_group']),
            k['snap_points_group'] = null);
        }
        ),
        j['snap_points_group']) && (j['remove'](j['snap_points_group']),
        j['snap_points_group'] = null),
        j['userData']['dragCache'] = null);
    }
    var j = get_drag_areas_embed(d_objects, h), h = g['intersectObjects'](j, !0x0), g, i, j;
    return g['layers']['mask'] = i,
    j['forEach'](k => {
        var k, k;
        k !== f && (k['unhighlight'](),
        (k = k['userData']['parent'])instanceof CabinetFillSection && k['userData']['params']['spec']['show_sizes'] && !k['userData']['params']['spec']['show_sizes_hover'] && k['userData']['own_object']['children']['forEach'](l => {
            l instanceof CabinetSize && global_options['sizes_visible'] && (l['visible'] = !0x0);
        }
        ),
        k instanceof CabinetFillSection) && k['userData']['params']['spec']['replace'] && 0x0 < (k = k['userData']['children'] || [])['length'] && k['forEach'](l => {
            'Module' === l['temp_type'] && (l['visible'] = !0x0);
        }
        );
    }
    ),
    0x0 < h['length'] ? ((g = h[0x0]['object']['parent'])['highlight'](),
    (i = h[0x0]['object']['parent']['userData']['parent'])instanceof CabinetFillSection && i['userData']['params']['spec']['replace'] && 0x0 < (j = i['userData']['children'] || [])['length'] && j['forEach'](k => {
        'Module' === k['temp_type'] && (k['visible'] = !0x1);
    }
    ),
    {
        'obj': g,
        'point': h[0x0]['point']
    }) : {
        'obj': null,
        'point': null
    };
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
function connect_coupe() {
    var f = copy_object(c_params_n)
      , g = (f['spec']['group'] = 'bottom',
    f['spec']['variants'][0x0]['size']['x'] = parseInt(t_s1['params']['size']['x']) + parseInt(t_s2['params']['size']['x']),
    f['spec']['variants'][0x0]['size']['y'] = parseInt(t_s1['params']['size']['y']),
    f['spec']['variants'][0x0]['size']['z'] = parseInt(t_s1['params']['size']['z']),
    f['spec']['variants'][0x0]['code'] = t_s1['params']['code'] + ',' + t_s2['params']['code'],
    f['spec']['rest'] = t_s1['params']['spec']['rest'],
    f['events'] = copy_object(t_s1['params']['events']),
    f['spec']['rest']['free_size'] = 0x0,
    f['variables'] = copy_object(t_s1['params']['variables']),
    f['materials'] = copy_object(t_s1['params']['materials']),
    [])
      , h = []
      , j = copy_object(t_s1['params']['children'][0x0])
      , k = copy_object(t_s2['params']['children'][0x0])
      , l = dp['get']('section');
    l['children']['push'](j),
    l['children']['push'](k);
    let m;
    for (let q = j['children']['length']; q--; )
        'Секция\x20под\x20двери\x20купе' == j['children'][q]['name'] && (m = copy_object(j['children'][q]),
        j['children']['splice'](q, 0x1));
    for (let u = k['children']['length']; u--; )
        'Секция\x20под\x20двери\x20купе' == k['children'][u]['name'] && k['children']['splice'](u, 0x1);
    var p = 0x0
      , l = (0x0 == t_s1['rotation']['y'] ? t_s1['position']['x'] > t_s2['position']['x'] ? (j['size']['x'] = t_s1['params']['size']['x'],
    k['size']['x'] = t_s2['params']['size']['x'],
    j['pos']['x'] = k['size']['x']) : (j['size']['x'] = t_s1['params']['size']['x'],
    k['size']['x'] = t_s2['params']['size']['x'],
    k['pos']['x'] = j['size']['x']) : t_s1['rotation']['y'] == Math['PI'] ? t_s1['position']['x'] > t_s2['position']['x'] ? (j['size']['x'] = t_s1['params']['size']['x'],
    k['size']['x'] = t_s2['params']['size']['x'],
    k['pos']['x'] = j['size']['x']) : (j['size']['x'] = t_s1['params']['size']['x'],
    k['size']['x'] = t_s2['params']['size']['x'],
    j['pos']['x'] = k['size']['x']) : t_s1['position']['z'] > t_s2['position']['z'] ? (j['size']['x'] = t_s1['params']['size']['x'],
    k['size']['x'] = t_s2['params']['size']['x'],
    k['pos']['x'] = j['size']['x']) : (j['size']['x'] = t_s1['params']['size']['x'],
    k['size']['x'] = t_s2['params']['size']['x'],
    j['pos']['x'] = k['size']['x']),
    l['children']['push'](m),
    f['children']['push'](l),
    sc['add_object']('cabinet_cn', f, !0x1));
    l['position']['copy'](t_s1['position']),
    0x0 == t_s1['rotation']['y'] ? t_s1['position']['x'] > t_s2['position']['x'] ? (j['size']['x'] = t_s1['params']['size']['x'],
    k['size']['x'] = t_s2['params']['size']['x'],
    j['pos']['x'] = k['size']['x'],
    t_s2['box']['update'](),
    l['position']['copy'](t_s1['position']),
    l['position']['x'] = t_s2['box']['min']['x'] + f['spec']['variants'][0x0]['size']['x'] / units / 0x2) : (j['size']['x'] = t_s1['params']['size']['x'],
    k['size']['x'] = t_s2['params']['size']['x'],
    k['pos']['x'] = j['size']['x'],
    t_s1['box']['update'](),
    l['position']['copy'](t_s1['position']),
    l['position']['x'] = t_s1['box']['min']['x'] + f['spec']['variants'][0x0]['size']['x'] / units / 0x2) : t_s1['rotation']['y'] == Math['PI'] ? t_s1['position']['x'] > t_s2['position']['x'] ? (j['size']['x'] = t_s1['params']['size']['x'],
    k['size']['x'] = t_s2['params']['size']['x'],
    k['pos']['x'] = j['size']['x'],
    t_s1['box']['update'](),
    l['position']['copy'](t_s1['position']),
    l['position']['x'] = t_s1['box']['min']['x'] + f['spec']['variants'][0x0]['size']['x'] / units / 0x2) : (j['size']['x'] = t_s1['params']['size']['x'],
    k['size']['x'] = t_s2['params']['size']['x'],
    j['pos']['x'] = k['size']['x'],
    t_s2['box']['update'](),
    l['position']['copy'](t_s1['position']),
    l['position']['x'] = t_s2['box']['min']['x'] + f['spec']['variants'][0x0]['size']['x'] / units / 0x2) : t_s1['position']['z'] > t_s2['position']['z'] ? (j['size']['x'] = t_s1['params']['size']['x'],
    k['size']['x'] = t_s2['params']['size']['x'],
    k['pos']['x'] = j['size']['x']) : (j['size']['x'] = t_s1['params']['size']['x'],
    k['size']['x'] = t_s2['params']['size']['x'],
    j['pos']['x'] = k['size']['x']),
    t_s1['delete'](),
    t_s2['delete']();
}
function rotate_by_normal(f, g) {
    var g = new THREE['Vector3'](g['x'],g['y'],g['z'])['normalize']()
      , h = new THREE['Vector3'](0x0,0x0,0x1)
      , h = new THREE['Quaternion']()['setFromUnitVectors'](h, g);
    f['quaternion']['copy'](h);
}
function get_objects_for_inter() {
    let f = [];
    return f = constructor_settings['tabletop_v2'] ? f['concat'](room['active_objects'], global_data['tabletop']['items']) : room['active_objects'];
}
function debounce(f, g) {
    let h;
    return function j(...k) {
        var l = () => {
            clearTimeout(h),
            f(...k);
        }
        ;
        clearTimeout(h),
        h = setTimeout(l, g);
    }
    ;
}
THREE['DragControls'] = function(N, a0, a1) {
    this['params'] = {};
    let a2 = bb()
      , a3 = (this['params']['grid'] = 0x1 / units,
    this['params']['snap_distance'] = 0xa,
    this['top_cabinets_helper'] = null,
    this['wallpanel_helper'] = null,
    this['block_move'] = 0x0,
    this['view_mode'] = 0x0)
      , a4 = {
        'x': 0x0,
        'y': 0x0
    }
      , a5 = 0x12c
      , a6 = 0x5
      , a7 = null;
    var a8, a9;
    let aa = new THREE['Vector3'](), ab = new THREE['Vector3'](), ac, ad;
    var af = !0x1
      , ag = 0x0
      , ah = 0x0
      , ai = 0x0
      , aj = new THREE['Plane']()
      , ak = new THREE['Vector3']();
    let al = {
        'x': 0x0,
        'y': 0x0
    };
    var am = null;
    let an = null
      , ao = {
        'x': 0x0,
        'y': 0x0,
        'both': 0x0,
        'tabletop_rebuilt': 0x0
    }
      , ap = null;
    var aq = 0x0, ar, as;
    this['set_camera'] = function(bi) {
        a0 = bi;
    }
    ;
    let at = ''
      , au = 0x96;
    var av = 0x0
      , aw = 0x1
      , ax = new THREE['Raycaster']()
      , ay = new THREE['Vector2']()
      , az = new THREE['Vector3']()
      , aA = null
      , aB = null
      , aC = null
      , aD = this;
    let aE = null;
    var aF = null;
    let aG = null
      , aH = !0x1
      , aI = !0x0
      , aJ = null
      , aK = {};
    var aL = null
      , aM = null
      , aN = null
      , aO = null
      , aP = null
      , aQ = (this['get_selected'] = function() {
        return aA;
    }
    ,
    this['set_selected'] = function(bi) {
        av = 0x1,
        aw = 0x0,
        (aA = bi)['box']['update'](),
        aa['copy'](aA['position']['clone']()),
        aD['s_helper']['set_size'](aA['box']),
        aD['s_helper']['position']['copy'](aA['position']),
        aD['s_helper']['position']['y'] = aA['position']['y'] + aD['s_helper']['size']['y'] / 0x2,
        aD['s_helper']['show']();
    }
    ,
    this['update_selection'] = function(bi) {}
    ,
    this['clear_selected'] = function() {
        aA = null,
        this['s_helper']['hide']();
    }
    ,
    this['hide_helper'] = function() {
        this['s_helper']['hide']();
    }
    ,
    this['set_selection_position'] = function(bi) {
        this['s_helper']['position']['set'](bi);
    }
    ,
    this['set_cursor'] = function(bi='auto') {
        a1['style']['cursor'] = bi;
    }
    ,
    new THREE['Matrix4']())
      , aR = (this['s_helper'] = make_s_helper(0x1, 0x1, 0x1),
    this['s_helper']['userData']['renderable'] = !0x1,
    this['s_helper']['renderOrder'] = 0x1,
    this['s_helper']['size'] = new THREE['Vector3'](0x1,0x1,0x1),
    this['s_helper']['set_size'] = function(bi) {
        aD['s_helper']['scale']['set'](0x1, 0x1, 0x1);
        var bj = common_box['setFromObject'](aD['s_helper'])['getSize'](new THREE['Vector3']())['clone']()
          , bi = bi['getSize'](new THREE['Vector3']())['clone']();
        aD['s_helper']['size'] = bi,
        aD['s_helper']['scale']['set']((bi['x'] + 0.1) / bj['x'], (bi['y'] + 0.1) / bj['y'], (bi['z'] + 0.1) / bj['z']);
    }
    ,
    this['s_helper']['make'] = function(bi) {
        var bj, bk, bk;
        0x1 == (bi = bi || aA)['userData']['is_interactive'] || 'draggable' == bi['object_type'] ? (bk = box3['setFromObject'](bi)['clone']()['getCenter'](new THREE['Vector3']()),
        aD['s_helper']['set_size'](box3['setFromObject'](bi)),
        aD['s_helper']['position']['copy'](bk),
        ce(bi)) : (bi['box'] ? aD['s_helper']['set_size'](bi['box']) : aD['s_helper']['set_size'](box3['setFromObject'](bi)),
        bk = bi['getWorldPosition'](new THREE['Vector3']()),
        aD['s_helper']['position']['copy'](bk),
        aD['s_helper']['position']['y'] = bk['y'] + aD['s_helper']['size']['y'] / 0x2),
        aD['s_helper']['show'](),
        aD['update_selection'](bi);
    }
    ,
    this['clear_hovered'] = function() {
        aB = null;
    }
    ,
    this['s_helper']['make_w_box'] = function(bi, bj) {
        aD['s_helper']['show']();
        var bk = box3['setFromObject'](aA['model']);
        bk['expandByObject'](aA['smes_model']),
        aD['s_helper']['set_size'](bk),
        aD['s_helper']['position']['copy'](bk['getCenter'](vec3));
    }
    ,
    this['s_helper']['make_box'] = function(bi) {
        bi = bi || aA,
        aD['s_helper']['show'](),
        aD['s_helper']['set_size'](box3['setFromObject'](bi)),
        aD['s_helper']['position']['copy'](bi['getWorldPosition'](new THREE['Vector3']())),
        aD['s_helper']['position']['z'] = bi['getWorldPosition'](new THREE['Vector3']())['z'] + aD['s_helper']['size']['z'] / 0x2,
        aD['update_selection'](bi);
    }
    ,
    new THREE['Vector3']())
      , aS = (this['s_helper']['make_from_center_and_size'] = function(bi) {
        aD['s_helper']['scale']['set'](0x1, 0x1, 0x1);
        var bj = common_box['setFromObject'](aD['s_helper'])['getSize'](new THREE['Vector3']())['clone']()
          , bk = bi['getSize'](new THREE['Vector3']())['clone']();
        aD['s_helper']['size'] = bk,
        aD['s_helper']['scale']['set']((bk['x'] + 0.1) / bj['x'], (bk['y'] + 0.1) / bj['y'], (bk['z'] + 0.1) / bj['z']),
        aD['position']['x'] = bi['getCenter'](new THREE['Vector3']())['x'],
        aD['position']['z'] = bi['getCenter'](new THREE['Vector3']())['z'],
        aD['position']['y'] = bi['getCenter'](new THREE['Vector3']())['y'];
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
    this['cut_helper'] = new THREE['Mesh'](new THREE['BoxBufferGeometry'](0x1,0x4,0x3c),new THREE['MeshPhongMaterial']({
        'color': '#880000',
        'depthTest': !0x0,
        'depthWrite': !0x1,
        'side': THREE['DoubleSide'],
        'transparent': !0x0,
        'opacity': 0x1
    })),
    this['cut_helper']['params'] = {},
    this['cut_helper']['params']['height'] = 0x4,
    this['cut_helper']['params']['depth'] = 0x3c,
    this['cut_helper']['visible'] = !0x1,
    this['cut_helper']['set_size'] = function(bi, bj) {}
    ,
    [])
      , aT = (0x1 != constructor_settings['tabletop_v2'] && 0x1 != constructor_settings['core_v2'] || scene['add'](this['cut_helper']),
    null);
    let aU = 0x0;
    function aV(bi) {
        if (!global_options['size_edit_mode']?.['active'] && (bi['type']['indexOf']('touch') < 0x0 ? bi['preventDefault']() : bi = bi['changedTouches'][0x0],
        0x1 != aU) && 0x1 !== aD['block_move']) {
            var bj = a1['getBoundingClientRect'](), bk, bl, bj, bm, bn, bo, bp, bj, bo, bq, br;
            ay['x'] = (bi['clientX'] - bj['left']) / bj['width'] * 0x2 - 0x1,
            ay['y'] = -(bi['clientY'] - bj['top']) / bj['height'] * 0x2 + 0x1,
            ax['setFromCamera'](ay, a0);
            let c5;
            if ('picker' == global_options['mouse_mode']['mode']) {
                if ('walls' == global_options['mouse_mode']['target'])
                    return void (0x0 < (c5 = ax['intersectObjects'](b7(), !0x0))['length'] ? (aB && (aB['material']['emissiveIntensity'] = 0x0),
                    (aB = c5[0x0]['object'])['material']['emissive']['set']('#9bff96'),
                    aB['material']['emissiveIntensity'] = 0.05,
                    global_options['mouse_mode']['obj'] = aB,
                    a1['style']['cursor'] = global_options['color_picker_cursor']) : (aB && (aB['material']['emissiveIntensity'] = 0x0),
                    aB = null,
                    global_options['mouse_mode']['obj'] = null,
                    a1['style']['cursor'] = 'auto'));
                if ('facade_materials' == global_options['mouse_mode']['target']) {
                    var bj = ax['intersectObjects'](b8(), !0x0), bs;
                    if (0x0 < bj['length'] && 'wall' !== b2(bj[0x0]['object'])['object_type']) {
                        if ('wall_panel' == bj[0x0]['object']['name'] && 0x1 != b2(bj[0x0]['object'])['params']['draggable'])
                            return;
                        bj[0x0]['object']['no_click_event'] && bj['shift'](),
                        aB && (aB['material']['emissiveIntensity'] = 0x0),
                        aB = bj[0x0]?.['object'],
                        bi['ctrlKey'],
                        null !== (aB ? b3(aB) : null) && (aB['material']['emissive']['set']('#9bff96'),
                        aB['material']['emissiveIntensity'] = 0.05,
                        global_options['mouse_mode']['obj'] = aB,
                        a1['style']['cursor'] = global_options['color_picker_cursor']);
                    } else
                        aB && (aB['material']['emissiveIntensity'] = 0x0),
                        aB = null,
                        global_options['mouse_mode']['obj'] = null,
                        a1['style']['cursor'] = 'auto';
                    return;
                }
                if ('facades' == global_options['mouse_mode']['target']) {
                    var bj = ax['intersectObjects'](b8(), !0x0);
                    if (0x0 < bj['length'] && 'wall' !== b2(bj[0x0]['object'])['object_type']) {
                        if ('wall_panel' == bj[0x0]['object']['name'] && 0x1 != b2(bj[0x0]['object'])['params']['draggable'])
                            return;
                        bj[0x0]['object']['no_click_event'] && bj['shift'](),
                        aB && (aB['material']['emissiveIntensity'] = 0x0);
                        let c6 = b3(aB = bj[0x0]?.['object']);
                        if ('Tabletop' == c6?.['parent']['name'])
                            return;
                        null !== c6 && c6['userData']['cabinet'] && (0x1 == global_options['mouse_mode']['radius'] ? c6['cabinet']['params']['cabinet']['type']['indexOf']('radius') < 0x0 && (c6 = null) : -0x1 < c6['cabinet']['params']['cabinet']['type']['indexOf']('radius') && (c6 = null)),
                        null !== c6 && (aB['material']['emissive']['set']('#9bff96'),
                        aB['material']['emissiveIntensity'] = 0.05,
                        global_options['mouse_mode']['obj'] = aB,
                        a1['style']['cursor'] = global_options['color_picker_cursor']);
                    } else
                        aB && (aB['material']['emissiveIntensity'] = 0x0),
                        aB = null,
                        global_options['mouse_mode']['obj'] = null,
                        a1['style']['cursor'] = 'auto';
                    return;
                }
                if ('fill' == global_options['mouse_mode']['target']) {
                    let c7 = [];
                    for (let c8 = 0x0; c8 < room['active_objects']['length']; c8++)
                        'Module' === room['active_objects'][c8]['temp_type'] && 0x1 != room['active_objects'][c8]['userData']['params']['spec']['is_fill'] && (c7 = c7['concat'](room['active_objects'][c8]['get_drag_areas'](global_options['mouse_mode']['item_id'] + '')));
                    var bj = ax['intersectObjects'](c7, !0x0);
                    return void (0x0 < bj['length'] ? (aB && aB['material']['color']['setHex'](0x96c296),
                    (aB = bj[0x0]['object'])['material']['color']['setHex'](0x81c481),
                    global_options['mouse_mode']['obj'] = aB,
                    a1['style']['cursor'] = global_options['color_picker_cursor']) : (aB && aB['material']['color']['setHex'](0x96c296),
                    aB = null,
                    global_options['mouse_mode']['obj'] = null,
                    a1['style']['cursor'] = 'auto'));
                }
                if ('erase' == global_options['mouse_mode']['target']) {
                    let c9 = [];
                    for (let ca = 0x0; ca < room['active_objects']['length']; ca++)
                        'Module' === room['active_objects'][ca]['temp_type'] && 0x1 != room['active_objects'][ca]['userData']['params']['spec']['is_fill'] && (c9 = c9['concat'](room['active_objects'][ca]['get_draggables']()));
                    var bj = ax['intersectObjects'](c9, !0x0), bj;
                    return void (0x0 < bj['length'] ? (bj = b4(bj[0x0]['object']),
                    aB && 'Module' !== aB['temp_type'] && aB['material']['color']['setHex'](0x96c296),
                    (aB = bj['userData']['helpers']['children'][0x0])['material']['color']['setHex'](0xff0000),
                    global_options['mouse_mode']['obj'] = aB,
                    a1['style']['cursor'] = global_options['color_picker_cursor']) : (aB && aB['material']['color']['setHex'](0x96c296),
                    aB = null,
                    global_options['mouse_mode']['obj'] = null,
                    a1['style']['cursor'] = 'auto'));
                }
                if ('tabletop_cut' == global_options['mouse_mode']['target'])
                    switch (global_options['mouse_mode']['item_id']) {
                    case 0x1:
                        return aA ? (bl = gp_t(aA),
                        void ((c5 = ax['intersectObject'](bl, !0x0)) && c5[0x0]['object'] && (aA['position']['x'] = Math['round'](bl['worldToLocal'](c5[0x0]['point'])['x'] / aD['params']['grid']) * aD['params']['grid'],
                        bl['build_conn_sizes']()))) : void ((c5 = ax['intersectObjects'](global_data['tabletop']['needs_cut'], !0x0))['length'] ? (aB = gp_t(c5[0x0]['object']),
                        (c5 = ax['intersectObjects'](aB['connects']['children'], !0x0))['length'] ? (aB = c5[0x0]['object'],
                        a1['style']['cursor'] = 'pointer') : a1['style']['cursor'] = 'auto') : (aB = null,
                        scene['add'](aD['cut_helper']),
                        aD['cut_helper']['visible'] = !0x1,
                        a1['style']['cursor'] = 'auto'));
                    case 0x2:
                        return void ((c5 = ax['intersectObjects'](global_data['tabletop']['needs_cut'], !0x0))['length'] ? (aB = gp_t(c5[0x0]['object']),
                        aD['cut_helper']['visible'] = !0x0,
                        aB['add'](aD['cut_helper']),
                        aD['cut_helper']['position']['x'] = aB['worldToLocal'](c5[0x0]['point'])['x']) : (aB = null,
                        scene['add'](aD['cut_helper']),
                        aD['cut_helper']['visible'] = !0x1,
                        a1['style']['cursor'] = 'auto'));
                    case 0x3:
                        return void ((c5 = ax['intersectObjects'](global_data['tabletop']['needs_cut'], !0x0))['length'] ? (aB = gp_t(c5[0x0]['object']),
                        (c5 = ax['intersectObjects'](aB['connects']['children'], !0x0))['length'] ? (aB = c5[0x0]['object'],
                        a1['style']['cursor'] = 'pointer') : a1['style']['cursor'] = 'auto') : (aB = null,
                        scene['add'](aD['cut_helper']),
                        aD['cut_helper']['visible'] = !0x1,
                        a1['style']['cursor'] = 'auto'));
                    }
                if ('tabletop_cut_v2' == global_options['mouse_mode']['target'])
                    switch (global_options['mouse_mode']['item_id']) {
                    case 0x1:
                        if (aA) {
                            var bt = gp_t(aA);
                            if ((c5 = bt ? ax['intersectObject'](bt, !0x0) : null) && c5[0x0] && c5[0x0]['object'] && c5[0x0]['object'] !== aA) {
                                let cb = bt['worldToLocal'](c5[0x0]['point'])['x'];
                                cb = bi['shiftKey'] ? Math['round'](cb * units) / units : 0xa * Math['round'](cb * units / 0xa) / units;
                                var bu = bt?.['userData']['computed']['u_size']['x'] / 0x2;
                                bu && !bi['shiftKey'] && Math['abs'](bu - Math['abs'](cb)) < 0.8 && (cb = Math['sign'](cb) * bu),
                                aA['position']['x'] = cb,
                                bt['build_conn_sizes']();
                            }
                            return;
                        }
                        return void ((c5 = ax['intersectObjects'](pp['info']['tabletop']['items_parts'], !0x0))['length'] ? (aB = gp_t(c5[0x0]['object']),
                        (c5 = ax['intersectObjects'](aB['userData']['cuts']['connects']['children'], !0x0))['length'] ? (aB = c5[0x0]['object'],
                        a1['style']['cursor'] = 'pointer') : a1['style']['cursor'] = 'auto') : (aB = null,
                        scene['add'](aD['cut_helper']),
                        aD['cut_helper']['visible'] = !0x1,
                        a1['style']['cursor'] = 'auto'));
                    case 0x2:
                        if ((c5 = ax['intersectObjects'](pp['info']['tabletop']['items_parts'], !0x0))['length']) {
                            if (aB = gp_t(c5[0x0]['object']),
                            aD['cut_helper']['visible'] = !0x0,
                            c5[0x0]['object'] !== aD['cut_helper']) {
                                aB['add'](aD['cut_helper']);
                                let cc = aB['worldToLocal'](c5[0x0]['point'])['x'];
                                cc = bi['shiftKey'] ? Math['round'](cc * units) / units : 0xa * Math['round'](cc * units / 0xa) / units,
                                constructor_settings['core_v2'] ? aD['cut_helper']['position']['set'](cc, aB['userData']['computed']['u_size']['y'] / 0x2, aB['userData']['cuts']['position']['z']) : aD['cut_helper']['position']['set'](cc, aB['userData']['cuts']['position']['y'] + aB['userData']['computed']['u_size']['z'] / 0x2, aB['userData']['cuts']['position']['z']);
                            }
                        } else
                            aB = null,
                            scene['add'](aD['cut_helper']),
                            aD['cut_helper']['visible'] = !0x1,
                            a1['style']['cursor'] = 'auto';
                        return;
                    case 0x3:
                        return void ((c5 = ax['intersectObjects'](pp['info']['tabletop']['items_parts'], !0x0))['length'] ? (aB = gp_t(c5[0x0]['object']),
                        (c5 = ax['intersectObjects'](aB['userData']['cuts']['connects']['children'], !0x0))['length'] ? (aB = c5[0x0]['object'],
                        a1['style']['cursor'] = 'pointer') : a1['style']['cursor'] = 'auto') : (aB = null,
                        scene['add'](aD['cut_helper']),
                        aD['cut_helper']['visible'] = !0x1,
                        a1['style']['cursor'] = 'auto'));
                    }
            }
            if ('embed' === global_options['mouse_mode']['mode'])
                return bj = global_options['mouse_mode']['planeInfo'],
                bm = global_options['mouse_mode']['embed_obj'],
                bj && bm && !global_options['mouse_mode']['_embed_locked'] && (bn = computeUVOnPlane(bj, ax, aD, units, bi)) ? (bo = uvToWorld(bj, bn['u'], bn['v']),
                bm['position']['copy'](bo),
                bj['crossHelper'] && bj['crossHelper']['position']['set'](bn['u'], bn['v'], 0x0),
                void (global_options['mouse_mode']['_embed_last_uv'] = {
                    'u': bn['u'],
                    'v': bn['v'],
                    'halfU': bj['halfU'],
                    'halfV': bj['halfV']
                })) : void 0x0;
            if (aK['current_obj'] && !aK['trigger_start']) {
                var bm = bi['clientX'] - aK['mouse_pos']['x']
                  , bo = bi['clientY'] - aK['mouse_pos']['y'];
                if (controls['enabled'] = !0x1,
                0x5 < Math['sqrt'](bm * bm + bo * bo)) {
                    aK['trigger_start'] = !0x0;
                    var bn = aK['current_obj'];
                    if (bn?.['_grab_point']?.['_is_grab_point']) {
                        fill_edit_mode(bn);
                        var bj = bn['userData']['root']['get_child_params_by_path'](bn['userData']['path'])
                          , bm = bn['userData']['root']['uuid']
                          , bo = bn['userData']['parent']
                          , bv = bo['uuid']
                          , bq = bn['get_connected']()
                          , bw = new THREE['Quaternion']()
                          , bo = (bo['getWorldQuaternion'](bw),
                        bn['_get_size'] ? bn['_get_size']() : new THREE['Vector3'](0x0,0x0,0x0))
                          , bx = new THREE['Vector3']();
                        bn['getWorldPosition'](bx);
                        var by, bz = new THREE['Vector3'](bo['x'] / 0x2,0x0,bo['z'] / 0x2)['clone']()['applyQuaternion'](bw), bz = bx['clone']()['add'](bz), bj = (bj['pos'] = new THREE['Vector3'](),
                        bj['scale'] = new THREE['Vector3'](0x1,0x1,0x1),
                        bj['spec']['cabinet_group'] = '',
                        bj['interaction'] ? bj['interaction']['check_intersection'] = 0x1 : bj['interaction'] = {
                            'check_intersection': 0x1
                        },
                        bj['spec']['safe_size'] = bj['size'],
                        bj['size'] && delete bj['size'],
                        scene['remove'](bn['_grab_point']),
                        sc['add_object']('module', bj, !0x1));
                        bn['visible'] = !0x1,
                        bj['position']['copy'](bz),
                        bj['quaternion']['copy'](bw),
                        bj['userData']['connected'] = bq,
                        bj['section_uuid'] = bv,
                        bj['parent_uuid'] = bm,
                        bj['old_pos'] = aK['old_pos'],
                        bj['object_path'] = bn['userData']['path'],
                        bj['_size_objects'] = bn['userData']['computed']['additional_sizes'],
                        0x0 < bn['userData']['computed']['additional_sizes']['length'] && bn['userData']['computed']['additional_sizes']['forEach'](cd => {
                            cd['full_dispose']();
                        }
                        ),
                        (aA = bj)['userData']['own_object']['visible'] = !0x1,
                        aA['fill_helper'] = new Fill_Helper({
                            'parent': aD,
                            'size': {
                                'x': bo['x'],
                                'y': bo['y'],
                                'z': bo['z']
                            }
                        }),
                        aA['fill_helper']['position']['copy'](bx['clone']()),
                        aA['fill_helper']['quaternion']['copy'](bw),
                        scene['add'](aA['fill_helper']);
                        try {
                            for (let cd = 0x0; cd < aA['userData']['sizes_items']['length']; cd++)
                                aA['userData']['sizes_items'][cd]['visible'] = !0x1;
                        } catch (cf) {}
                        aI = !0x0;
                    }
                    aK['current_obj'] = null,
                    global_options['mouse_mode']?.['root'] || (global_options['mouse_mode']['root'] = aA),
                    fill_edit_mode(aA);
                }
            } else {
                if (aA && 'camera' == global_options['mouse_mode']['mode'] && 0x0 == aI) {
                    let cg = {
                        'x': bi['clientX'],
                        'y': bi['clientY']
                    }
                      , ch = debounce(ci => {
                        var cj = ci['clientX'] - cg['x'], ci = ci['clientY'] - cg['y'], ck;
                        0.0001 < Math['sqrt'](cj * cj + ci * ci) && (active_el = null,
                        aA = null,
                        sc['select_object'](null),
                        aD['s_helper']['hide'](),
                        aI,
                        document['removeEventListener']('mousemove', ch));
                    }
                    , 0xa);
                    if (!(aA && aB && active_el && aA['uuid'] === aB['uuid'] && active_el['uuid'] === aA['uuid'] && aB['uuid'] === active_el['uuid'])) {
                        document['addEventListener']('mousemove', ch);
                        let ci = () => {
                            document['removeEventListener']('mousemove', ch),
                            document['removeEventListener']('mouseup', ci);
                        }
                        ;
                        document['addEventListener']('mouseup', ci);
                    }
                }
                if ('drag' == global_options['mouse_mode']['mode'] && (global_options['mouse_mode']['enabled_base_drag'] = !0x0),
                aA?.['fill_helper'] && aA) {
                    aA['updateMatrixWorld'](!0x0);
                    var bz = new THREE['Vector3'](aA['userData']['params']['size']['x'] / units,aA['userData']['params']['size']['y'] / units,aA['userData']['params']['size']['z'] / units)
                      , bq = aA['getWorldPosition'](new THREE['Vector3']())
                      , bv = aA['getWorldQuaternion'](new THREE['Quaternion']())
                      , bm = bz['clone']()['multiplyScalar'](0.5);
                    bm['y'] = 0x0,
                    bm['applyQuaternion'](bv),
                    aA['fill_helper']['position']['copy'](bq)['sub'](bm),
                    aA['fill_helper']['quaternion']['copy'](bv),
                    aA['fill_helper']['update_size'](bz);
                    try {
                        for (let cj = 0x0; cj < aA['userData']['sizes_items']['length']; cj++)
                            aA['userData']['sizes_items'][cj]['visible'] = !0x1;
                    } catch (ck) {}
                    try {
                        aD['s_helper']['hide']();
                    } catch (cm) {}
                }
                if (aA && global_options['mouse_mode']['enabled_base_drag'] && 0x1 == aI) {
                    if (!global_options['single_preview'] && 0x1 != aA['userData']['is_interactive']) {
                        if (aA['is_control'])
                            aA['userData']['obj']['resizable'] && aA['userData']['obj']['resizable']['handleDragMove'](aA, bi, a0);
                        else {
                            if (!aA['userData'] || !aA['userData']['interaction'] && !aA['userData']['params']['interaction'] || !aA['userData']?.['interaction']?.['movement_locked']) {
                                if ((bi['shiftKey'] || pp_keyboard['c']) && 0x1 !== aA['copied'] && 0x1 !== av) {
                                    var bn = copy_object(aA['params']);
                                    bn['obj_id'] = void 0x0;
                                    let cn = [];
                                    'Cabinet' == bn['type'] && (cn = copy_object(bn['accessories_list']),
                                    bn['accessories_list'] = []);
                                    var bA = sc['add_object'](aA['params']['object_type'], bn);
                                    for (let co = 0x0; co < cn['length']; co++) {
                                        var bB = cn[co]
                                          , bC = copy_object(accsessories_data['items'][bB['id']]);
                                        pp['interface']['root']['$emit']('add_cart_item', bC, bB['count'], bA['params']['obj_id']);
                                    }
                                    bA['copied'] = 0x1;
                                }
                                if ('washer' === aA['object_type'] && (aA['box']['update'](),
                                bj = (constructor_settings['core_v2'] ? pp['info']['tabletop']['items_parts'] : global_data['tabletop']['items']) || [],
                                (bo = ax['intersectObjects'](bj, !0x0))['length'] ? (null != aE && aE['object']['uuid'] != bo[0x0]['object']['uuid'] && (aE['object']['material']['transparent'] = !0x1,
                                aE['object']['material']['opacity'] = 0x1,
                                aE['object']['material']['needsUpdate'] = !0x0,
                                aD['s_helper']['material']['color']['setHex'](0x1ab394)),
                                aE = bo[0x0]) : null != aE && (room['add'](aA),
                                aE = null),
                                c5 = ax['intersectObjects'](room['walls_objects'], !0x0)),
                                'Module' == aA['userData']['class'] && 0x1 == aA['userData']['params']['spec']['is_fill'] && 0x0 == aH) {
                                    for (let cp = room['active_objects']['length']; cp--; ) {
                                        var bD = room['active_objects'][cp];
                                        'Module' == bD['userData']['class'] && bD['show_drag_areas'](aA['userData']['params']['spec']['id'], aA['userData']['params']['spec']['element_type']);
                                    }
                                    aH = !0x0;
                                }
                                if (0x1 == aA['userData']['params']?.['spec']?.['is_fill']) {
                                    for (let cq = 0x0; cq < room['active_objects']['length']; cq++) {
                                        var bE = room['active_objects'][cq];
                                        'Module' == bE['userData']['class'] && traverse_parts(bE, (cr, cs, ct) => {
                                            cr['userData']['params']['hide_on_drag'] && (cr['visible'] = !0x1);
                                        }
                                        );
                                    }
                                    var bx = get_section_intersection_embed(aG, ax, aA), bw;
                                    if (bx['obj'])
                                        return bw = bx['obj']['userData']['parent'],
                                        ap = ap || bw,
                                        aA['_size_objects'] && 0x0 < aA['_size_objects']['length'] && ap['uuid'] !== bw['uuid'] && (aA['_size_objects']['forEach'](cr => {
                                            cr['parent'] && (cr['full_dispose'](),
                                            cr['parent']['remove'](cr),
                                            aA['_size_objects'] = null);
                                        }
                                        ),
                                        ap = bw),
                                        aA['_snap_points'] = get_snap_points(bw, aA),
                                        aA['drag_move'](bx['point'], bw, bx['obj']),
                                        aG = bx['obj'],
                                        aD['s_helper']['hide'](),
                                        void (a2['visible'] = !0x1);
                                    aA['_size_objects'] && 0x0 < aA['_size_objects']['length'] && aA['_size_objects']['forEach'](cr => {
                                        cr['parent'] && (cr['full_dispose'](),
                                        cr['parent']['remove'](cr),
                                        aA['_size_objects'] = null);
                                    }
                                    ),
                                    aG = null;
                                }
                                if ('Shaft' === aA['type'] ? c5 = ax['intersectObjects'](room['walls']['children']) : 'washer' !== aA['object_type'] && (c5 = bi['ctrlKey'] || 'surface' === aA['drag_mode'] ? ax['intersectObjects'](removeElementFromArray(get_objects_for_inter(), aA), !0x0) : (bq = room['walls_objects'],
                                ax['intersectObjects'](bq, !0x0))),
                                c5['length']) {
                                    if ('washer' === aA['object_type']) {
                                        let cs = 0x0
                                          , ct = 0x0;
                                        var bm = b1(aA);
                                        if ('Cabinet' == bm['type'] && null == aE && (aA['parent']['parent']['rebuild_washer_tabletop'](),
                                        room['attach'](aA)),
                                        0x0 == ao['tabletop_rebuilt'] && (ao['x'] != bi['clientY'] || ao['y'] != bi['clientY']) && aA['parent']['uuid'] != room['uuid'] && 'function' == typeof aA['parent']['parent']['rebuild_washer_tabletop'])
                                            return aA['parent']['parent']['rebuild_washer_tabletop'](),
                                            void (ao['tabletop_rebuilt'] = 0x1);
                                        if (null != aE ? (br = aE['point']['clone'](),
                                        0x0 == aA['parent']['parent']['rotation']['y'] && (cs = Math['round']((-aA['parent']['parent']['position']['x'] + br['x']) / aD['params']['grid']) * aD['params']['grid'],
                                        ct = Math['round']((-aA['parent']['parent']['position']['z'] + br['z']) / aD['params']['grid']) * aD['params']['grid']),
                                        aA['parent']['parent']['rotation']['y'] == Math['PI'] && (cs = Math['round']((aA['parent']['parent']['position']['x'] - br['x']) / aD['params']['grid']) * aD['params']['grid'],
                                        ct = Math['round']((aA['parent']['parent']['position']['z'] - br['z']) / aD['params']['grid']) * aD['params']['grid']),
                                        aA['parent']['parent']['rotation']['y'] == -Math['PI'] / 0x2 && (cs = Math['round']((-aA['parent']['parent']['position']['z'] + br['z']) / aD['params']['grid']) * aD['params']['grid'],
                                        ct = Math['round']((aA['parent']['parent']['position']['x'] - br['x']) / aD['params']['grid']) * aD['params']['grid']),
                                        aA['parent']['parent']['rotation']['y'] == Math['PI'] / 0x2 && (cs = Math['round']((aA['parent']['parent']['position']['z'] - br['z']) / aD['params']['grid']) * aD['params']['grid'],
                                        ct = Math['round']((-aA['parent']['parent']['position']['x'] + br['x']) / aD['params']['grid']) * aD['params']['grid'])) : (br = c5[0x0]['point']['clone'](),
                                        cs = br['x'] / aD['params']['grid'] * aD['params']['grid'],
                                        bL = br['y'] / aD['params']['grid'] * aD['params']['grid'],
                                        ct = br['z'] / aD['params']['grid'] * aD['params']['grid']),
                                        null != aE)
                                            aA['position']['y'] = box3['setFromObject'](aE['object'])['max']['y'];
                                        else {
                                            if (aA['parent']['uuid'] === room['uuid']) {
                                                let cu = 0x0;
                                                try {
                                                    cu = parseFloat(aA['params']['height']) / units;
                                                } catch (cv) {}
                                                cu = cu || (aA['box']['max']['y'] - aA['box']['min']['y']) / 0x2,
                                                'floor' === c5[0x0]['object']['name'] && (bL = cu),
                                                bL = Math['max'](bL, cu);
                                            }
                                            aA['position']['y'] = bL;
                                        }
                                        return aA['position']['x'] = cs,
                                        aA['position']['z'] = ct,
                                        aD['s_helper']['make_w_box'](),
                                        void (al = {
                                            'x': bi['clientX'],
                                            'y': bi['clientY']
                                        });
                                    }
                                    var bv = new THREE['Matrix3']()['getNormalMatrix'](c5[0x0]['object']['matrixWorld']), bz = c5[0x0]['face']['normal']['clone']()['applyMatrix3'](bv)['normalize'](), br = (0x1 !== bz['x'] && -0x1 !== bz['x'] && (bz['x'] = 0x0),
                                    0x1 !== bz['y'] && -0x1 !== bz['y'] && (bz['y'] = 0x0),
                                    0x1 !== bz['z'] && -0x1 !== bz['z'] && (bz['z'] = 0x0),
                                    c5[0x0]['normal_vector'] = bz,
                                    c5[0x0]['point']['clone']()), bn = (0x1 !== bz['x'] && -0x1 !== bz['x'] || (az['x'] = 0x0),
                                    0x1 !== bz['y'] && -0x1 !== bz['y'] || (az['y'] = 0x0),
                                    0x1 !== bz['z'] && -0x1 !== bz['z'] || (az['z'] = 0x0),
                                    aA['box']), bj = (bn = aA['box'] ? bn : new THREE['Box3']()['setFromObject'](aA))['getSize'](new THREE['Vector3']()), bo = (bi['ctrlKey'] || 'surface' === aA['drag_mode'] || br['sub'](az),
                                    {
                                        'x': !0x1,
                                        'y': !0x1,
                                        'z': !0x1
                                    }), bw = new THREE['Box3'](), bx = new THREE['Box3'](), bq = new THREE['Box3'](), bm = new THREE['Vector3'](aA['position']['x'],aA['position']['y'] + bj['y'] / 0x2,aA['position']['z']), bF = (bw['setFromCenterAndSize'](bm, new THREE['Vector3'](room['params']['width'] / units * 0x2,bj['y'] + 0x1,bj['z'] + 0x1)),
                                    bx['setFromCenterAndSize'](bm, new THREE['Vector3'](bj['x'] + 0x1,room['params']['height'] / units * 0x2,bj['z'] + 0x1)),
                                    bq['setFromCenterAndSize'](bm, new THREE['Vector3'](bj['x'] + 0x1,bj['y'] + 0x1,room['params']['depth'] / units * 0x2)),
                                    check_intersection_all(bw, aA)), bG = check_intersection_all(bx, aA), bH = check_intersection_all(bq, aA), bI = new THREE['Box3']()['setFromCenterAndSize'](br, bj), bv = (custom_settings['floor_only'] || aA['params'] && aA['params']['hasOwnProperty']('auto_rotation') && !aA['params']['auto_rotation'] || aA['userData'] && aA['userData']['interaction']['hasOwnProperty']('auto_rotation') && !aA['userData']['interaction']['auto_rotation'] || 0x0 === c5[0x0]['object']['rotation']['x'] && Math['abs'](bz['y']) < 0.01 && rotate_by_normal(aA, bz),
                                    aA['box'] && !aA['userData']?.['params']?.['spec']?.['is_fill'] && aA['box']['update'](),
                                    aA['position']['clone']()), bn, bJ, bK, bm = ('floor' != c5[0x0]['object']['name'] || 'at_wall' !== aA['userData']['cabinet_group'] && 'at_wall_bottom' !== aA['userData']['cabinet_group'] || ((bn = aA['getWorldDirection'](new THREE['Vector3']()))['y'] = 0x0,
                                    bn['normalize'](),
                                    (bJ = Math['abs'](bn['x'])) < Math['abs'](bn['z']) ? br['z'] = bv['z'] : br['x'] = bv['x']),
                                    Math['round'](br['x'] / aD['params']['grid']) * aD['params']['grid']), bL = Math['round'](br['y'] / aD['params']['grid']) * aD['params']['grid'], bw = Math['round'](br['z'] / aD['params']['grid']) * aD['params']['grid'], bM = [], bN = [], bO = [], bP, bP;
                                    let cr = [];
                                    if ('function' == typeof check_add_boxes_mouse_move && (cr = check_add_boxes_mouse_move(aA)),
                                    bF = bF['concat'](cr),
                                    bG = bG['concat'](cr),
                                    bH = bH['concat'](cr),
                                    'top' === aA['cabinet_type'] && 'Cabinet' === aA['type'] && (bP = {
                                        'object_type': 'wall',
                                        'box': {
                                            'max': {
                                                'y': (project_settings['cokol_height'] + project_settings['bottom_modules_height'] + project_settings['tabletop_thickness'] + project_settings['wall_panel']['height']) / units
                                            },
                                            'min': {
                                                'y': 0x0
                                            }
                                        }
                                    },
                                    bG['push'](bP),
                                    null === aD['top_cabinets_helper']) && (aD['top_cabinets_helper'] = make_edges_dashed(room['params']['width'] / units, 0x1 / units, room['params']['depth'] / units),
                                    aD['top_cabinets_helper']['position']['set'](room['params']['width'] / units / 0x2, bP['box']['max']['y'], room['params']['depth'] / units / 0x2),
                                    room['add'](aD['top_cabinets_helper'])),
                                    'Wall_panel' === aA['type'] && (bP = {
                                        'object_type': 'wall',
                                        'box': {
                                            'max': {
                                                'y': (project_settings['cokol_height'] + project_settings['bottom_modules_height'] + project_settings['tabletop_thickness']) / units
                                            },
                                            'min': {
                                                'y': 0x0
                                            }
                                        }
                                    },
                                    bG['push'](bP),
                                    null === aD['wallpanel_helper']) && (aD['wallpanel_helper'] = make_edges_dashed(room['params']['width'] / units, 0x1 / units, room['params']['depth'] / units),
                                    aD['wallpanel_helper']['position']['set'](room['params']['width'] / units / 0x2, bP['box']['max']['y'], room['params']['depth'] / units / 0x2),
                                    room['add'](aD['wallpanel_helper'])),
                                    'function' == typeof int_y_mouse && int_y_mouse(bG),
                                    !bi['ctrlKey'] && 'surface' !== aA['drag_mode']) {
                                        for (as = 0x0; as < bF['length']; as++) {
                                            'wall' !== bF[as]['object_type'] && bF[as]['box']['update']();
                                            var bQ = bF[as]['userData']?.['params']?.['interaction']?.['check_intersection'] || 0x0;
                                            Math['abs'](bI['max']['x'] - bF[as]['box']['min']['x']) < aD['params']['snap_distance'] && bM['push']({
                                                'pos': bF[as]['box']['min']['x'] - bI['getSize'](new THREE['Vector3']())['x'] / 0x2,
                                                'dist': Math['abs'](bI['max']['x'] - bF[as]['box']['min']['x']),
                                                'check_intersection': bQ
                                            }),
                                            Math['abs'](bI['max']['x'] - bF[as]['box']['max']['x']) < aD['params']['snap_distance'] && bM['push']({
                                                'pos': bF[as]['box']['max']['x'] - bI['getSize'](new THREE['Vector3']())['x'] / 0x2,
                                                'dist': Math['abs'](bI['max']['x'] - bF[as]['box']['max']['x']),
                                                'check_intersection': bQ
                                            }),
                                            Math['abs'](bI['min']['x'] - bF[as]['box']['max']['x']) < aD['params']['snap_distance'] && bM['push']({
                                                'pos': bF[as]['box']['max']['x'] + bI['getSize'](new THREE['Vector3']())['x'] / 0x2,
                                                'dist': Math['abs'](bI['min']['x'] - bF[as]['box']['max']['x']),
                                                'check_intersection': bQ
                                            }),
                                            Math['abs'](bI['min']['x'] - bF[as]['box']['min']['x']) < aD['params']['snap_distance'] && bM['push']({
                                                'pos': bF[as]['box']['min']['x'] + bI['getSize'](new THREE['Vector3']())['x'] / 0x2,
                                                'dist': Math['abs'](bI['min']['x'] - bF[as]['box']['min']['x']),
                                                'check_intersection': bQ
                                            }),
                                            bi['altKey'] && Math['abs'](bI['center']()['x'] - bF[as]['box']['center']()['x']) < aD['params']['snap_distance'] && bM['push']({
                                                'pos': bF[as]['box']['center']()['x'],
                                                'dist': Math['abs'](bI['center']()['x'] - bF[as]['box']['center']()['x']),
                                                'check_intersection': bQ
                                            });
                                        }
                                        for (as = 0x0; as < bH['length']; as++) {
                                            'wall' !== bH[as]['object_type'] && bH[as]['box']['update']();
                                            var bR = bH[as]['userData']?.['params']?.['interaction']?.['check_intersection'] || 0x0;
                                            Math['abs'](bI['max']['z'] - bH[as]['box']['min']['z']) < aD['params']['snap_distance'] && bO['push']({
                                                'pos': bH[as]['box']['min']['z'] - bI['getSize'](new THREE['Vector3']())['z'] / 0x2,
                                                'dist': Math['abs'](bI['max']['z'] - bH[as]['box']['min']['z']),
                                                'check_intersection': bR
                                            }),
                                            Math['abs'](bI['max']['z'] - bH[as]['box']['max']['z']) < aD['params']['snap_distance'] && bO['push']({
                                                'pos': bH[as]['box']['max']['z'] - bI['getSize'](new THREE['Vector3']())['z'] / 0x2,
                                                'dist': Math['abs'](bI['max']['z'] - bH[as]['box']['max']['z']),
                                                'check_intersection': bR
                                            }),
                                            Math['abs'](bI['min']['z'] - bH[as]['box']['max']['z']) < aD['params']['snap_distance'] && bO['push']({
                                                'pos': bH[as]['box']['max']['z'] + bI['getSize'](new THREE['Vector3']())['z'] / 0x2,
                                                'dist': Math['abs'](bI['min']['z'] - bH[as]['box']['max']['z']),
                                                'check_intersection': bR
                                            }),
                                            Math['abs'](bI['min']['z'] - bH[as]['box']['min']['z']) < aD['params']['snap_distance'] && bO['push']({
                                                'pos': bH[as]['box']['min']['z'] + bI['getSize'](new THREE['Vector3']())['z'] / 0x2,
                                                'dist': Math['abs'](bI['min']['z'] - bH[as]['box']['min']['z']),
                                                'check_intersection': bR
                                            }),
                                            bi['altKey'] && Math['abs'](bI['center']()['z'] - bH[as]['box']['center']()['z']) < aD['params']['snap_distance'] && bO['push']({
                                                'pos': bH[as]['box']['center']()['z'],
                                                'dist': Math['abs'](bI['center']()['z'] - bH[as]['box']['center']()['z']),
                                                'check_intersection': bR
                                            });
                                        }
                                        for (as = 0x0; as < bG['length']; as++) {
                                            'wall' !== bG[as]['object_type'] && bG[as]['box']['update']();
                                            var bS = bG[as]['userData']?.['params']?.['interaction']?.['check_intersection'] || 0x0;
                                            Math['abs'](bI['max']['y'] + bI['getSize'](new THREE['Vector3']())['y'] / 0x2 - bG[as]['box']['min']['y']) < aD['params']['snap_distance'] && bN['push']({
                                                'pos': bG[as]['box']['min']['y'] - bI['getSize'](new THREE['Vector3']())['y'],
                                                'dist': Math['abs'](bI['max']['y'] + bI['getSize'](new THREE['Vector3']())['y'] / 0x2 - bG[as]['box']['min']['y']),
                                                'check_intersection': bS
                                            }),
                                            Math['abs'](bI['max']['y'] + bI['getSize'](new THREE['Vector3']())['y'] / 0x2 - bG[as]['box']['max']['y']) < aD['params']['snap_distance'] && bN['push']({
                                                'pos': bG[as]['box']['max']['y'] - bI['getSize'](new THREE['Vector3']())['y'],
                                                'dist': Math['abs'](bI['max']['y'] + bI['getSize'](new THREE['Vector3']())['y'] / 0x2 - bG[as]['box']['max']['y']),
                                                'check_intersection': bS
                                            }),
                                            Math['abs'](br['y'] - bG[as]['box']['max']['y']) < aD['params']['snap_distance'] && bN['push']({
                                                'pos': bG[as]['box']['max']['y'],
                                                'dist': Math['abs'](br['y'] - bG[as]['box']['max']['y']),
                                                'check_intersection': bS
                                            }),
                                            Math['abs'](br['y'] - bG[as]['box']['min']['y']) < aD['params']['snap_distance'] && bN['push']({
                                                'pos': bG[as]['box']['min']['y'],
                                                'dist': Math['abs'](br['y'] - bG[as]['box']['min']['y']),
                                                'check_intersection': bS
                                            });
                                        }
                                    }
                                    var bx = _['minBy'](bM, 'dist'), bq = (bM['length'] && (bm = bx['pos']),
                                    _['minBy'](bO, 'dist')), bj = (bO['length'] && (bw = bq['pos']),
                                    _['minBy'](bN, 'dist')), bn = (bN['length'] && (bL = bj['pos']),
                                    c5[0x0]['object']), bv = new THREE['Box3'](), bT, bU, bV, bW, bX, bY, bZ, bP, bx;
                                    0x1 === bz['x'] && (bT = bv['setFromObject'](bn)['max']['x'] + bI['getSize'](new THREE['Vector3']())['x'] / 0x2),
                                    -0x1 === bz['x'] && (bT = bI['getSize'](new THREE['Vector3']())['x'] / 0x2),
                                    0x0 === bz['x'] && (bT = bI['getSize'](new THREE['Vector3']())['x'] / 0x2),
                                    0x1 === bz['z'] && (bV = bv['setFromObject'](bn)['max']['z'] + bI['getSize'](new THREE['Vector3']())['z'] / 0x2),
                                    -0x1 === bz['z'] && (bV = bI['getSize'](new THREE['Vector3']())['z'] / 0x2),
                                    0x0 === bz['z'] && (bV = bI['getSize'](new THREE['Vector3']())['z'] / 0x2),
                                    -0x1 === bz['x'] && (bW = bv['setFromObject'](bn)['min']['x'] - bI['getSize'](new THREE['Vector3']())['x'] / 0x2),
                                    0x1 === bz['x'] && (bW = room['params']['width'] / units - bI['getSize'](new THREE['Vector3']())['x'] / 0x2),
                                    0x0 === bz['x'] && (bW = room['params']['width'] / units - bI['getSize'](new THREE['Vector3']())['x'] / 0x2),
                                    -0x1 === bz['z'] && (bY = bv['setFromObject'](bn)['min']['z'] - bI['getSize'](new THREE['Vector3']())['z'] / 0x2),
                                    0x1 === bz['z'] && (bY = room['params']['depth'] / units - bI['getSize'](new THREE['Vector3']())['z'] / 0x2),
                                    0x0 === bz['z'] && (bY = room['params']['depth'] / units - bI['getSize'](new THREE['Vector3']())['z'] / 0x2),
                                    bm = clamp(Math['round'](bm / aD['params']['grid']) * aD['params']['grid'], bT, bW),
                                    bw = clamp(Math['round'](bw / aD['params']['grid']) * aD['params']['grid'], bV, bY),
                                    bL = clamp(Math['round'](bL / aD['params']['grid']) * aD['params']['grid'], 0x0, room['params']['height'] / units - bI['getSize'](new THREE['Vector3']())['y']),
                                    'top' === global_options['projection_mode'] && (bo['y'] = !0x0),
                                    'front' !== global_options['projection_mode'] && 'back' !== global_options['projection_mode'] || (bo['z'] = !0x0),
                                    'left' !== global_options['projection_mode'] && 'right' !== global_options['projection_mode'] || (bo['x'] = !0x0),
                                    'bottom' === aA['cabinet_type'] && (bo['y'] = !0x0),
                                    'bottom' !== aA['userData']['cabinet_group'] && 'at_wall_bottom' !== aA['userData']['cabinet_group'] || (bo['y'] = !0x0),
                                    'Module' == aA['temp_type'] ? (bP = aA['position']['clone']()['clone'](),
                                    !0x1 === bo['x'] && (bP['x'] = bm),
                                    !0x1 === bo['y'] && (bP['y'] = bL),
                                    !0x1 === bo['z'] && (bP['z'] = bw),
                                    (bx = bg(aA, d_objects, bP, bM, bN, bO, cr))?.['hasCollision'] || (bx?.['snapInfo']?.['isNearSnap'] && bx?.['snapInfo']?.['snapPosition'] ? aA['position']['copy'](bx['snapInfo']['snapPosition']) : aA['position']['copy'](bP))) : ((a2['visible'] = !0x1) === bo['x'] && (aA['position']['x'] = bm),
                                    !0x1 === bo['y'] && (aA['position']['y'] = bL),
                                    !0x1 === bo['z'] && (aA['position']['z'] = bw)),
                                    aA['box'] && !aA['userData']?.['params']?.['spec']?.['is_fill'] && aA['box']['update'](),
                                    aD['s_helper']['make'](),
                                    'function' == typeof aA['mouse_move'] && aA['mouse_move'](c5[0x0]),
                                    'function' == typeof aA['calculate_distances'] && aA['calculate_distances'](),
                                    'function' == typeof on_mouse_drag && on_mouse_drag(aA),
                                    check_overlap_single(aA),
                                    a1['style']['cursor'] = 'pointer',
                                    aD['dispatchEvent']({
                                        'type': 'drag',
                                        'object': aA
                                    });
                                }
                                al = {
                                    'x': bi['clientX'],
                                    'y': bi['clientY']
                                };
                            }
                        }
                    }
                } else {
                    if (aJ && aJ?.['_hide_helpers'](),
                    0x0 < grab_points_list['length'])
                        for (let cw = 0x0; cw < grab_points_list['length']; cw++) {
                            var c0 = grab_points_list[cw];
                            scene['remove'](c0);
                        }
                    if (!pp['events']['mouse']['find_hit'] && active_el instanceof Module) {
                        let cx = active_el;
                        if (!(cx = global_options['mouse_mode']['root'] ? global_options['mouse_mode']['root'] : cx)?.['userData']?.['parts_by_path']?.['module'])
                            return;
                        var bq = Object['keys'](cx['userData']['parts_by_path']['module']), bj = find_hit_box_fill_section(cx, ax), bv, c1;
                        bj && ((bv = bj) && bv['userData']['params']['spec']['is_fill'] && bq['includes'](bv['userData']['path']) ? (bq['forEach'](cy => {
                            var cy = cx['userData']['parts_by_path']['module'][cy];
                            cy['_hide_helpers'](),
                            change_grap_point(cy, 'delete', ax),
                            cy['_grab_point'] = null;
                        }
                        ),
                        bv['_show_helpers'](),
                        bv['userData']['parent']instanceof CabinetFillSection && (c1 = bv['userData']['parent']),
                        a1['style']['cursor'] = 'pointer',
                        aJ = bv,
                        global_options['mouse_mode']['target'] = bv,
                        change_grap_point(aJ, 'add', ax),
                        check_grap_point_intersection(aJ, ax)) : bq['forEach'](cy => {
                            var cy = cx['userData']['parts_by_path']['module'][cy], cz;
                            cy['_hide_helpers'](),
                            cy['userData']['parent']instanceof CabinetFillSection && (cz = cy['userData']['parent']),
                            change_grap_point(cy, 'delete', ax),
                            cy['_grab_point'] = null;
                        }
                        ));
                    }
                    if (global_options['mouse_mode']['fill_edit_mode'] && pp['interface']['root'] && pp['interface']['root']['$selected_object']['_show_helpers'](),
                    0x0 < (c5 = ax['intersectObjects'](b8(), !0x0))['length']) {
                        for (; c5[0x0] && c5[0x0]['object'] && !0x1 === c5[0x0]['object']['userData']['mouse_events']; )
                            c5['shift']();
                    }
                    if (0x0 < c5['length']) {
                        let cy = null;
                        var c2 = [], c3 = [], bn;
                        for (let cA = 0x0; cA < c5['length']; cA++)
                            c5[cA]['object']['userData']['is_mouse_target'] && c2['push'](c5[cA]),
                            c5[cA]['object']['userData']['is_draggable_child'] && c3['push'](c5[cA]);
                        let cz = c5[0x0]['object'];
                        c3['length'] ? (cy = b9(c3[0x0]['object']),
                        cz = c3[0x0]['object']) : c2['length'] && (cy = c2[0x0]['object'],
                        cz = c2[0x0]['object']),
                        !cy || null != aC && aC['uuid'] == cy['uuid'] || (aC = cy),
                        aB !== cz && (bn = b9(cz),
                        aB = bn,
                        aD['dispatchEvent']({
                            'type': 'hoveron',
                            'object': aB
                        })),
                        'wall' === aB['object_type'] ? a1['style']['cursor'] = 'auto' : a1['style']['cursor'] = 'pointer';
                    } else
                        null !== aB && (aD['dispatchEvent']({
                            'type': 'hoveroff',
                            'object': aB
                        }),
                        a1['style']['cursor'] = 'auto',
                        aB = null),
                        null !== aC && (aC = null);
                    if (pp['events']['mouse']['find_hit'] && pp['events']['mouse']['find_hit'](ax, a1, aB),
                    al = {
                        'x': bi['clientX'],
                        'y': bi['clientY']
                    },
                    helper['isDown'] && 0x1 == custom_settings['group_enabled']) {
                        for (let cB = 0x0; cB < selectionBox['collection']['length']; cB++)
                            selectionBox['collection'][cB]['size_box']['visible'] = !0x1;
                        selectionBox['endPoint']['set'](bi['clientX'] / window['innerWidth'] * 0x2 - 0x1, -bi['clientY'] / window['innerHeight'] * 0x2 + 0x1, 0.5);
                        var c4 = selectionBox['select']();
                        for (let cC = 0x0; cC < c4['length']; cC++)
                            selectionBox['collection'][cC]['size_box']['visible'] = !0x0;
                    }
                }
            }
        }
    }
    function aW(bi) {
        var bj, bj, bk, bl, bk, bl, bj, bl, bj, bm;
        if (aD['enabled'] && (!global_options['size_edit_mode']?.['active'] && (bi['type']['indexOf']('touch') < 0x0 ? (bi['preventDefault'](),
        bi['stopPropagation']()) : bi = bi['changedTouches'][0x0],
        !view_mode || 0x2 == bi['which']) && (at = new Date()['getTime'](),
        view_mode || pp['interface']['root']['radial_hide'](),
        bi['altKey'] || 0x2 == bi['which'] || !global_options['view_only_mode']))) {
            if ('picker' == global_options['mouse_mode']['mode'] && 0x1 == bi['which']) {
                if ('walls' == global_options['mouse_mode']['target'])
                    aB && ('Shaft_wall' == aB['name'] ? aB['userData']['root']['change_plane_material'](aB['userData']['tag'], global_options['mouse_mode']['item_id']) : (bj = aB['name']['replace']('_wall', ''),
                    room['change_wall_material'](bj, global_options['mouse_mode']['item_id'])));
                else {
                    if ('facade_materials' == global_options['mouse_mode']['target'])
                        aB && null !== (bj = aB ? b3(aB) : null) && (bj instanceof CabinetFacade && (constructor_settings['core_v2'] ? (bk = bj['userData']['computed']['item']['id'],
                        bl = global_options['mouse_mode']['item_id'],
                        module_utils['can_change_facade_material'](bk, bl) && bj['_change_material'](global_options['cpk_key'], bl)) : bj['_change_material'](global_options['cpk_key'], global_options['mouse_mode']['item_id'])),
                        sc['get_price']());
                    else {
                        if ('facades' == global_options['mouse_mode']['target'] && aB) {
                            let bv = b3(aB);
                            0x1 == global_options['mouse_mode']['radius'] ? bv['cabinet'] && bv['cabinet']['params']['cabinet']['type']['indexOf']('radius') < 0x0 && (bv = null) : bv['cabinet'] && -0x1 < bv['cabinet']['params']['cabinet']['type']['indexOf']('radius') && (bv = null),
                            null !== bv && ('function' == typeof sc['add_facade'] && sc['add_facade'](bv),
                            sc['get_price']());
                        }
                        if ('fill' == global_options['mouse_mode']['target'])
                            aB && (bk = aB['parent']['parent']['userData']['root'],
                            bl = aB['parent']['parent'],
                            bj = copy_object(catalog_lib['items'][global_options['mouse_mode']['item_id']]['params']),
                            bk['add_drag_child_2'](global_options['mouse_mode']['item_id'] + '', bl, bj),
                            bk['show_drag_areas'](global_options['mouse_mode']['item_id'] + ''));
                        else {
                            if ('erase' == global_options['mouse_mode']['target'])
                                aB && null !== (bl = b4(aB)) && ((bj = bl['userData']['root'])['remove_draggable'](bl),
                                bpi) && 0x1 == bpi['$refs']['module_menu']['show'] && (bpi['$refs']['module_menu']['price'] = format_price(bj['get_price']()));
                            else {
                                if ('tabletop_cut' == global_options['mouse_mode']['target'] || 'tabletop_cut_v2' == global_options['mouse_mode']['target'])
                                    switch (global_options['mouse_mode']['item_id']) {
                                    case 0x1:
                                        return void (aA = aB ? (controls['enabled'] = !0x1,
                                        aB) : null);
                                    case 0x2:
                                        return void (aB && (controls['enabled'] = !0x1,
                                        aB['add_connection'](aD['cut_helper']['position'])));
                                    case 0x3:
                                        return void (aB && (controls['enabled'] = !0x1,
                                        bm = gp_t(aB)) && bm['remove_connection'](aB));
                                    }
                            }
                        }
                    }
                }
            } else {
                if (aB && aB['is_control'])
                    aB ? (controls['enabled'] = !0x1,
                    (aA = aB)['userData']['obj']['resizable'] && aA['userData']['obj']['resizable']['handleDragStart'](aA, bi, a0)) : aA = null;
                else {
                    aJ?.['_grab_point'] && scene['remove'](aJ['_grab_point']),
                    ax['setFromCamera'](ay, a0);
                    var bn = ax['intersectObjects'](b8(), !0x0), bo, bp, bq, bp;
                    if (0x0 < bn['length']) {
                        for (; bn[0x0] && bn[0x0]['object'] && !0x1 === bn[0x0]['object']['userData']['mouse_events']; )
                            bn['shift']();
                    }
                    let bw = 'short';
                    switch (bw = new Date()['getTime']() >= at + au ? 'long' : 'short',
                    bi['which']) {
                    case 0x1:
                        if (0x0 < bn['length']) {
                            var bq = Date['now']()
                              , bp = Math['abs'](bi['clientX'] - a4['x'])
                              , bo = Math['abs'](bi['clientY'] - a4['y'])
                              , bp = bq - a3 < a5 && bp < a6 && bo < a6;
                            if (a3 = bq,
                            a4 = {
                                'x': bi['clientX'],
                                'y': bi['clientY']
                            },
                            bp)
                                return aI = !0x1,
                                aK['current_obj'] = null,
                                void (pp['interface']['root'] && (pp['events']['mouse']['dblclick'] ? pp['events']['mouse']['dblclick'](bi, bn) : pp['interface']['root']['$emit']('show_object_panel', 'settings')));
                            var br = []
                              , bs = [];
                            for (let bz = 0x0; bz < bn['length']; bz++)
                                bn[bz]['object']['userData']['is_mouse_target'] && br['push'](bn[bz]),
                                bn[bz]['object']['userData']['params']?.['spec']?.['is_fill'] && bs['push'](bn[bz]);
                            let bx = bn;
                            if (bs['length'] ? bx = bs : br['length'] && (bx = br),
                            aA = b9(bx[0x0]['object']),
                            void 0x0 !== global_options['mouse_mode']?.['fill_edit_mode'] && !0x1 !== global_options['mouse_mode']?.['fill_edit_mode'] && aA?.['userData']?.['root']['uuid'] !== global_options['mouse_mode']['root']['uuid'] && (fill_edit_mode(),
                            aJ = null,
                            global_options['mouse_mode']['enabled_base_drag'] = !0x0,
                            aI = !0x0),
                            aA && (controls['enabled'] = !0x1,
                            'function' == typeof aA['build_from_wall_sizes']) && aA['build_from_wall_sizes'](!0x0),
                            bi['altKey'] && bi['shiftKey']) {
                                bn[0x0]['object']['no_click_event'] && bn[0x0]['shift']();
                                let bA = b2(bn[0x0]['object'], bi)
                                  , bB = make_cube(0x5, 0x5, 0x5);
                                bB['position']['copy'](bn[0x0]['point']),
                                bA['attach'](bB),
                                setTimeout( () => {
                                    app && app['$emit']('add_point_mouse', {
                                        'pos': bB['position']
                                    }),
                                    bA['remove'](bB);
                                }
                                , 0x64);
                            }
                            if (bi['altKey'])
                                return void (bn['length'] && (bn[0x0]['object']['no_click_event'] && bn['shift'](),
                                ba(bn[0x0]['object'])));
                            let by = room['walls_objects'];
                            aA instanceof Shaft && (by = room['walls_objects']['filter'](bC => 'Mesh' == bC['type']));
                            var bo = ax['intersectObjects'](by), bo, bq, bp, bq, bo, bp, bq, bp;
                            if (bo['length'] && az['copy'](bo[0x0]['point'])['sub'](aA['position']),
                            'washer' === aA['object_type'] && (ao['x'] = bi['clientX'],
                            ao['y'] = bi['clientY'],
                            ao['tabletop_rebuilt'] = 0x0,
                            aU = 0x1,
                            setTimeout(function() {
                                aU = 0x0;
                            }, 0x96),
                            !constructor_settings['core_v2'] && constructor_settings['tabletop_v2'] && sc['washer_drag_start_legacy'](aA),
                            0x1)) {
                                var bq, bp = (aA['parent']['uuid'] !== room['uuid'] && aA['parent']['parent']['uuid'] !== room['uuid'] && ((bq = aA['parent']['parent'])['washer'] = {
                                    'children': []
                                },
                                bq['params']['washer'] = {},
                                bq['params']['sink'] && (bq['params']['sink']['active'] = !0x1),
                                room['active_objects']['push'](aA),
                                d_objects['push'](aA),
                                room['add'](aA)),
                                aA['find_related_tabletop_parts']()), bt;
                                for (bt of bp)
                                    bt['userData']['washers'] = [],
                                    bt['_rebuild']?.();
                            }
                            if (aJ && (global_options['mouse_mode']['fill_edit_mode'] && pp['interface']['root'] && pp['interface']['root']['$selected_object']['_hide_helpers'](),
                            bo = Object['keys'](aJ['userData']['root']['userData']['parts_by_path']['module']),
                            (bq = find_hit_box_fill_section(aJ['userData']['root'], ax)) && (bp = bq)['uuid'] == aJ['uuid'] && bo['includes'](bp['userData']['path']) && (bq = {
                                'x': comp2(bp['userData']['params']['pos']['x'], bp['userData']['computed']['c_object']),
                                'y': comp2(bp['userData']['params']['pos']['y'], bp['userData']['computed']['c_object']),
                                'z': comp2(bp['userData']['params']['pos']['z'], bp['userData']['computed']['c_object'])
                            },
                            aK['mouse_pos'] = {
                                'x': bi['clientX'],
                                'y': bi['clientY']
                            },
                            aK['trigger_start'] = !0x1,
                            aK['current_obj'] = aJ,
                            aK['old_pos'] = bq),
                            aJ = null),
                            !pp['events']['mouse']['down_fill_hit'] && aA instanceof Module && aB?.['uuid'] === aA['uuid'] && active_el?.['uuid'] === aB?.['uuid'] && !aA?.['userData']['params']['spec']['is_fill'] && (bo = Object['keys'](aA['userData']['parts_by_path']['module']),
                            bp = find_hit_box_fill_section(aA, ax)) && ((bq = bp) && bq['userData']['params']['spec']['is_fill'] && bo['includes'](bq['userData']['path']) ? (void 0x0 !== global_options['mouse_mode']['fill_edit_mode'] && !0x1 !== global_options['mouse_mode']['fill_edit_mode'] && (aA = bq,
                            aJ = bq),
                            fill_edit_mode(bq),
                            aA['_grab_point'] && scene['remove'](aA['_grab_point'])) : bo['forEach'](bC => {
                                var bD;
                                aA['userData']['parts_by_path']['module'][bC]['_hide_helpers']();
                            }
                            )),
                            pp['events']['mouse']['down_fill_hit'] && pp['events']['mouse']['down_fill_hit'](ax, a1, aA),
                            aA instanceof Module && !aJ && 0x1 == aA['userData']['params']['spec']['is_fill'] && 0x0 == aH) {
                                for (let bC = room['active_objects']['length']; bC--; ) {
                                    var bu = room['active_objects'][bC];
                                    'Module' == bu['userData']['class'] && bu['show_drag_areas'](aA['userData']['params']['spec']['id'], aA['userData']['params']['spec']['element_type']);
                                }
                                aH = !0x0;
                            }
                            'function' == typeof aA['find_washers'] && (bp = aA['find_washers']())['length'] && (aA['userData']['tempDragWashers'] = bp),
                            aA['box'] && aA['box']['update'](),
                            aa['copy'](aA['position']['clone']()),
                            ac = aA['rotation']['clone']();
                            var bq = active_el;
                            sc['select_object'](aA),
                            'function' == typeof aA['calculate_distances'] && aA['calculate_distances'](),
                            'Draggable' == aA['userData']['class'] ? aD['s_helper']['make_box'](aA) : 'washer' === aA['object_type'] ? aD['s_helper']['make_w_box']() : aD['s_helper']['make'](),
                            'function' == typeof on_mouse_select && on_mouse_select(aA, bi),
                            global_options['mouse_mode']['enabled_base_drag'] = !0x0,
                            bq?.['uuid'] == aA['uuid'] && 'camera' == global_options['mouse_mode']['mode'] || !aJ && aA['userData']['params']?.['spec']?.['is_fill'] && 'camera' == global_options['mouse_mode']['mode'] ? (global_options['mouse_mode']['enabled_base_drag'] = !0x0,
                            aI = !0x0) : 'camera' == global_options['mouse_mode']['mode'] ? (global_options['mouse_mode']['enabled_base_drag'] = !0x1,
                            aI = !0x1) : aJ || void 0x0 !== global_options['mouse_mode']['fill_edit_mode'] && !0x1 !== global_options['mouse_mode']['fill_edit_mode'] ? (aJ ? (global_options['mouse_mode']['enabled_base_drag'] = !0x0,
                            aI = !0x1,
                            aH = !0x1) : (aJ = global_options['mouse_mode']['target'],
                            global_options['mouse_mode']['enabled_base_drag'] = !0x0,
                            aI = !0x0,
                            aH = !0x1,
                            sc['select_object'](aJ)),
                            'function' == typeof aA['calculate_distances'] && aJ['calculate_distances'](),
                            aD['s_helper']['make'](aJ['userData']['root'])) : (global_options['mouse_mode']['enabled_base_drag'] = !0x0,
                            aI = !0x0),
                            aD['dispatchEvent']({
                                'type': 'dragstart',
                                'object': aA
                            });
                        } else
                            active_el && (0x2 == custom_settings['no_active_null_on_click'] && sc['select_object'](null),
                            pp['interface']['root']['$emit']('hide_interactive_menu', 0x1),
                            aD['s_helper']['hide']());
                        aJ && (global_options['mouse_mode']['fill_edit_mode'] && pp['interface']['root'] && pp['interface']['root']['$selected_object']['_hide_helpers'](),
                        bo = Object['keys'](aJ['userData']['root']['userData']['parts_by_path']['module']),
                        bp = find_hit_box_fill_section(aJ['userData']['root'], ax)) && (bq = bp)['uuid'] == aJ['uuid'] && bo['includes'](bq['userData']['path']) && (bp = {
                            'x': comp2(bq['userData']['params']['pos']['x'], bq['userData']['computed']['c_object']),
                            'y': comp2(bq['userData']['params']['pos']['y'], bq['userData']['computed']['c_object']),
                            'z': comp2(bq['userData']['params']['pos']['z'], bq['userData']['computed']['c_object'])
                        },
                        aK['mouse_pos'] = {
                            'x': bi['clientX'],
                            'y': bi['clientY']
                        },
                        aK['trigger_start'] = !0x1,
                        aK['current_obj'] = aJ,
                        aK['old_pos'] = bp),
                        aJ = null,
                        global_options['mouse_mode']['fill_edit_mode'] && pp['interface']['root'] && pp['interface']['root']['$selected_object']['_show_helpers'](),
                        helper['isDown'] && 0x1 == custom_settings['group_enabled'] && selectionBox['startPoint']['set'](bi['clientX'] / window['innerWidth'] * 0x2 - 0x1, -bi['clientY'] / window['innerHeight'] * 0x2 + 0x1, 0.5);
                        break;
                    case 0x2:
                        if (bn['length']) {
                            for (; bn[0x0] && bn[0x0]['object'] && bn[0x0]['object']['no_click_event']; )
                                bn['shift']();
                            ba(bn[0x0]['object']);
                        }
                        aA = null;
                        break;
                    case 0x3:
                        0x0 < bn['length'] && 'function' == typeof pp['events']['mouse']['on_mouse_down_3_get_selected'] && (aA = pp['events']['mouse']['on_mouse_down_3_get_selected'](bi, bn)),
                        aD['block_move'] = 0x1,
                        aA && (0x1 == aA['userData']['is_interactive'] ? aD['s_helper']['make']() : (sc['select_object'](aA),
                        'washer' === aA['object_type'] ? aD['s_helper']['make_w_box']() : (aA['object_type'],
                        aD['s_helper']['make']())));
                        break;
                    }
                    'function' == typeof mousedown && mousedown(aA, bi),
                    'function' == typeof on_mouse_down && on_mouse_down(aA, bi);
                }
            }
        }
    }
    function aX(bi) {
        if (!global_options['size_edit_mode']?.['active']) {
            clearInterval(an),
            bi['type']['indexOf']('touch') < 0x0 ? bi['preventDefault']() : bi = bi['changedTouches'][0x0],
            rotation_mode = !0x1;
            let bt = 'short';
            if (bt = new Date()['getTime']() >= at + au ? 'long' : 'short',
            controls['enabled'] = !0x0,
            'embed' !== global_options['mouse_mode']['mode'] || global_options['mouse_mode']['_embed_fixed_active']) {
                for (let bu = scene['children']['length'] - 0x1; 0x0 <= bu; bu--) {
                    var bj = scene['children'][bu];
                    bj instanceof CabinetSize && (bj['userData']['children']['forEach'](bv => {
                        bv instanceof Sizes_obj && bv['full_dispose']();
                    }
                    ),
                    scene['remove'](bj));
                }
                if (aA) {
                    var bk, bk, bk, bl, bk, bm;
                    if (sc['update_kitchen_sizes'](!0x0),
                    aA['userData']?.['params']?.['spec']?.['is_fill'] || (aJ = null),
                    aD['block_move'] = 0x0,
                    sc['mouseup_selected'](aA),
                    'washer' === aA['object_type'])
                        return 'not_loaded' === aA['model_loaded'] && aA['load_model'](),
                        !constructor_settings['core_v2'] && constructor_settings['tabletop_v2'] && sc['washer_drag_end_legacy'](aA),
                        bk = aA,
                        controls['enabled'] = !0x0,
                        aA = null,
                        av = 0x0,
                        aw = 0x1,
                        aD['block_move'] = 0x0,
                        aD['s_helper']['hide'](),
                        !0x0 === global_options['colorpicker_mode'] || global_options['facade_mode'] ? a1['style']['cursor'] = global_options['color_picker_cursor'] : a1['style']['cursor'] = aB ? 'pointer' : 'auto',
                        aE = null,
                        aD['s_helper']['material']['color']['setHex'](0x1ab394),
                        sc['build_tabletop'](),
                        bk['check_cabinets_around'](),
                        void bk['show_radial_menu'](bi['clientX'], bi['clientY']);
                    if ('Draggable' == aA['userData']['class'])
                        return aA['userData']['root']['hide_drag_areas'](),
                        bk = aA['userData']['parent'],
                        0x1 == bi['which'] && (bk = {
                            'x': aA['position']['x'] * units + parseInt(bk['userData']['size']['x']) / 0x2,
                            'y': aA['position']['y'] * units + parseInt(bk['userData']['size']['y']) / 0x2,
                            'z': 0x0
                        },
                        aA['userData']['root']['change_param'](aA['userData']['path'], 'pos', bk, !0x1)),
                        pp['events']['mouse']['on_mouse_cancel_draggable'] ? pp['events']['mouse']['on_mouse_cancel_draggable'](bi, aA) : aA['show_radial_menu'](bi['clientX'], bi['clientY']),
                        void (aA = null);
                    for (let bv = room['active_objects']['length']; bv--; ) {
                        var bn = room['active_objects'][bv];
                        'Module' == bn['userData']['class'] && bn['hide_drag_areas']();
                    }
                    if (aA instanceof Module) {
                        if (0x1 == aA['userData']['params']['spec']['is_fill']) {
                            if (aA['_fill_helpers'] && 0x0 < aA['_fill_helpers']['helpers']['length'] && aA['_fill_helpers']['helpers']['forEach'](bw => {
                                scene['remove'](bw);
                            }
                            ),
                            aA['fill_helper'] && scene['remove'](aA['fill_helper']),
                            aG) {
                                var bk = aG['userData']['parent'], bm = bk['userData']['root'], bk;
                                aA['local_pos'] && ((bk = aA['embed_in_section'](bk, bm, aG))['enabled'] ? (aA = bk['root'],
                                aK['current_obj'] = bk['new_obj']) : (aA['delete'](),
                                aA = bk['root'],
                                sc['select_object'](bk['root'])));
                            } else {
                                if (aA['section_uuid']) {
                                    let bw = scene['getObjectByProperty']('uuid', aA['section_uuid']);
                                    var bm = bw['userData']['root'];
                                    let bx = Number(aA['object_path']['split'](',')['pop']())
                                      , by = [];
                                    bm['walk_params_tree'](bz => {
                                        'fill_section' == bz['type'] && bz['section_key'] && bz['section_key'] === bw['userData']['params']['section_key'] && by['push'](bz);
                                    }
                                    , bm['userData']['params'], 0x2),
                                    0x0 < by['length'] ? (by['forEach'](bz => {
                                        bz['children']['splice'](bx, 0x1);
                                    }
                                    ),
                                    bm['_rebuild']()) : bm['remove_child_by_path'](aA['object_path']),
                                    aA['userData']['params']['pos'] = new THREE['Vector3'](0x0,0x0,0x0),
                                    aA['_rebuild']();
                                }
                            }
                            for (let bz = room['active_objects']['length']; bz--; ) {
                                var bo = room['active_objects'][bz];
                                'Module' == bo['userData']['class'] && bo['hide_drag_areas'](),
                                bo['_snap_label'] && (scene['remove'](bo['_snap_label']),
                                bo['_snap_label']['element']['remove'](),
                                bo['_snap_label'] = null);
                            }
                            aA['userData']['connected'] = [],
                            aH = !0x1,
                            aA['section_uuid'] = null,
                            aA['parent_uuid'] = null,
                            aA['old_pos'] = null,
                            aA['_fill_helpers'] = null,
                            aA['object_path'] && (aA['object_path'] = null,
                            aA['userData']['own_object']['visible'] = !0x0);
                        } else {
                            if (-0x1 < location['href']['indexOf']('12414613') && 0x3 == aA['userData']['params']['id'] && (ab['copy'](aA['position']['clone']()),
                            !ab['equals'](aa)))
                                for (let bA = 0x0; bA < room['active_objects']['length']; bA++) {
                                    'Module' === room['active_objects'][bA]['temp_type'] && 0x1 != room['active_objects'][bA]['userData']['params']['spec']['is_fill'] && room['active_objects'][bA]['uuid'] != aA['uuid'] && (aA['box']['update'](),
                                    room['active_objects'][bA]['box']['update'](),
                                    bl = room['active_objects'][bA]['box']['clone']()['expandByScalar'](0.1),
                                    aA['box']['intersectsBox'](bl)) && aA['userData']['params']['size']['z'] == room['active_objects'][bA]['userData']['params']['size']['z'] && aA['userData']['params']['size']['y'] == room['active_objects'][bA]['userData']['params']['size']['y'] && parseInt(aA['userData']['params']['size']['x']) + parseInt(room['active_objects'][bA]['userData']['params']['size']['x']) <= 0x7d0 && (t_s1 = aA,
                                    t_s2 = room['active_objects'][bA],
                                    pp['interface']['root']['$emit']('yn_modal_show', {
                                        'heading': 'Объединение\x20корпуса',
                                        'body': 'Для\x20установки\x20дверей\x20купе\x20необходимо\x20объединить\x20корпус.\x20Объединить\x20корпус?',
                                        'cb': 'connect_coupe'
                                    }));
                                }
                        }
                    }
                    if (aA && aA['type'] && 'Cabinet' == aA['type']) {
                        if (!constructor_settings['tabletop_v2'] && 'bottom' == aA['params']['cabinet_group'] && aA['params']['tabletop']['active']) {
                            if (check_at_wall(aA)) {
                                if (aA['temp']['tabletop_plints']) {
                                    let bB = 0x0;
                                    Object['keys'](aA['params']['tabletop']['plints'])['forEach'](function(bC) {
                                        aA['params']['tabletop']['plints'][bC] != aA['temp']['tabletop_plints'][bC] && (bB = 0x1);
                                    }),
                                    0x1 == bB && (aA['params']['tabletop']['plints'] = copy_object(aA['temp']['tabletop_plints']),
                                    'function' == typeof aA['build_tabletop']) && aA['build_tabletop']();
                                }
                            } else {
                                aA['temp']['tabletop_plints'] = copy_object(aA['params']['tabletop']['plints']);
                                let bC = 0x0;
                                Object['keys'](aA['params']['tabletop']['plints'])['forEach'](function(bD) {
                                    0x0 != aA['params']['tabletop']['plints'][bD] && (aA['params']['tabletop']['plints'][bD] = !0x1,
                                    bC = 0x1);
                                }),
                                0x1 == bC && 'function' == typeof aA['build_tabletop'] && aA['build_tabletop']();
                            }
                        }
                        'bottom' == aA['params']['cabinet_group'] && (!aA['params']['tabletop'] || !aA['params']['tabletop']['active']) && aA['params']['cabinet'] && 0x2d1 < aA['params']['cabinet']['height'] && sc['build_bort']();
                    }
                    if (aA && aA['is_control'] && aA['userData']['obj']['resizable'] && aA['userData']['obj']['resizable']['handleDragEnd'](aA, bi, a0),
                    aD['s_helper']['material']['color']['setHex'](0x1ab394),
                    aA && (ab['copy'](aA['position']['clone']()),
                    ad = aA['rotation']['clone'](),
                    ab['equals'](aa) || (add_undo_action({
                        'type': 0x1 === av ? 'move_and_create' : 'move',
                        'from': aa['clone'](),
                        'to': ab['clone'](),
                        'rotation_from': ac,
                        'rotation_to': ad,
                        'object': aA
                    }),
                    0x1 == bi['which'] && (aA['userData']['tempDragWashers'] && (aA['update_washers_on_move'](aa, ab, ad['y'] - ac['y'], aA['userData']['tempDragWashers']),
                    delete aA['userData']['tempDragWashers']),
                    0x1 != constructor_settings['tabletop_v2'] && !constructor_settings['core_v2'] || (bk = aA['userData']['params'] && 'module' === aA['userData']['params']['type'],
                    ('Cabinet' == aA['temp_type'] || bk) && aA['check_tabletop_rebuild']() && (constructor_settings['core_v2'] && aA['is_detached_tabletop']() && (bm = aA['userData']['parts']['tabletop'][0x0],
                    _['get'](bm, 'userData.washers.length')) && bm['_rebuild'](),
                    sc['build_tabletop']()),
                    'Bardesk' != aA['temp_type']) || sc['build_tabletop'](),
                    'function' == typeof aA['find_around'] && aA['find_around'](),
                    'function' == typeof aA['after_move']) && aA['after_move']())),
                    check_overlap(),
                    0x1 == av && 'Cabinet' === aA['type'] && 'corner_straight' === aA['params']['cabinet']['type'] && 'function' == typeof corner_mouse_up && corner_mouse_up(),
                    pp['events']['mouse']['on_mouse_cancel'])
                        pp['events']['mouse']['on_mouse_cancel'](bi, aA);
                    else {
                        if (bi['type'] && bi['type']['indexOf']('touch') < 0x0)
                            switch (bi['which']) {
                            case 0x1:
                                bi['altKey'] || custom_settings['radial_rmb'] || 'function' == typeof aA['show_radial_menu'] && aA['show_radial_menu'](bi['clientX'], bi['clientY']);
                                break;
                            case 0x2:
                                break;
                            case 0x3:
                                bi['preventDefault'](),
                                0x1 == aA['userData']['is_interactive'] ? 'function' == typeof aA['show_radial_menu'] ? aA['show_radial_menu']() : (pp['interface']['root']['set_item'](null),
                                pp['interface']['root']['set_interactive'](aA),
                                pp['interface']['root']['$emit']('show_interactive_menu', '')) : custom_settings['radial_rmb'] && 'function' == typeof aA['show_radial_menu'] && aA['show_radial_menu'](bi['clientX'], bi['clientY']);
                            }
                        else
                            'function' == typeof aA['show_radial_menu'] && aA['show_radial_menu'](bi['clientX'], bi['clientY']);
                    }
                    if ('not_loaded' === aA['model_loaded'] && aA['load_model'](),
                    ab['equals'](aa) || (!project_settings['wall_panel']['active'] && 0x1 != av || (update_materials_panel(),
                    get_total_price_test()),
                    build_sizes_all(),
                    autosave()),
                    0x1 === aA['copied'] && (aA['copied'] = 0x0,
                    av = 0x0),
                    'function' == typeof aA['build_from_wall_sizes']) {
                        let bD = !0x1;
                        aA['params'] && 'surface' == aA['params']['drag_mode'] && (bD = !0x0),
                        aA['build_from_wall_sizes'](bD);
                    }
                    'function' == typeof aA['mouse_up'] && aA['mouse_up'](),
                    'top' === aA['cabinet_type'] && 'Cabinet' === aA['type'] && (room['remove'](aD['top_cabinets_helper']),
                    aD['top_cabinets_helper'] = null),
                    'Wall_panel' === aA['type'] && (room['remove'](aD['wallpanel_helper']),
                    aD['wallpanel_helper'] = null),
                    aD['dispatchEvent']({
                        'type': 'dragend',
                        'object': aA
                    }),
                    'washer' == aA['object_type'] || global_options['single_preview'] || 0x0 === aA['position']['x'] && 0x0 === aA['position']['z'] && 'function' == typeof aA['delete'] && (aA['delete'](),
                    aD['s_helper']['hide']()),
                    'function' == typeof on_mouse_up && on_mouse_up(aA),
                    'function' == typeof aA['_on_drag_end'] && aA['_on_drag_end'](bi),
                    a2['material'] !== bd['collision'] || aG || 0x1 != aA['userData']['params']?.['spec']?.['is_fill'] || (aA['delete'](),
                    aA = null,
                    aD['s_helper']['hide'](),
                    fill_edit_mode(),
                    pp['interface']['root'] && pp['interface']['root']['radial_hide'](),
                    bf('snap'),
                    a2['visible'] = !0x1),
                    a7 = null;
                }
                if (helper['isDown'] && 0x1 == custom_settings['group_enabled']) {
                    selectionBox['endPoint']['set'](bi['clientX'] / window['innerWidth'] * 0x2 - 0x1, -bi['clientY'] / window['innerHeight'] * 0x2 + 0x1, 0.5);
                    let bE = selectionBox['select']();
                    setTimeout( () => {
                        if (bE['length']) {
                            if (0x1 < bE['length']) {
                                let bF = sc['add_object']('drag_group', {}, !0x1);
                                for (let bG = bE['length']; bG--; )
                                    bE[bG]['size_box']['visible'] = !0x1,
                                    bF['add_object'](bE[bG]);
                                sc['select_object'](bF),
                                setTimeout( () => {
                                    aD['s_helper']['make'](bF),
                                    aD['s_helper']['show']();
                                }
                                , 0x64);
                            } else
                                bE[0x0]['size_box']['visible'] = !0x1;
                        }
                    }
                    , 0x64);
                }
                for (let bF = 0x0; bF < room['active_objects']['length']; bF++) {
                    var bp = room['active_objects'][bF];
                    'Module' == bp['userData']['class'] && traverse_parts(bp, (bG, bH, bI) => {
                        bG['userData']['params']['hide_on_drag'] && (bG['visible'] = !0x0);
                    }
                    );
                }
                if (0x0 < grab_points_list['length'])
                    for (let bG = 0x0; bG < grab_points_list['length']; bG++) {
                        var bq = grab_points_list[bG];
                        scene['remove'](bq);
                    }
                if (bi['type'] && bi['type']['indexOf']('touch') < 0x0)
                    switch (bi['which']) {
                    case 0x1:
                        aB || !global_options['mouse_mode']['fill_edit_mode'] || aK['current_obj'] || aA ? aK['current_obj'] && ('function' == typeof aK['current_obj']['show_radial_menu'] && aK['current_obj']['show_radial_menu'](bi['clientX'], bi['clientY']),
                        'function' == typeof aK['current_obj']['_on_drag_end'] && aK['current_obj']['_on_drag_end'](bi),
                        sc['select_object'](aK['current_obj']),
                        fill_edit_mode(aK['current_obj'])) : (fill_edit_mode(),
                        global_options['mouse_mode']['enabled_base_drag'] = !0x0,
                        active_el = null),
                        bi['preventDefault']();
                        break;
                    case 0x3:
                        aB || (fill_edit_mode(),
                        aJ = null,
                        global_options['mouse_mode']['enabled_base_drag'] = !0x0,
                        aI = !0x0,
                        active_el = null),
                        bi['preventDefault']();
                        break;
                    }
                0x1 == global_options['check_intersections'] && check_box_intersections(scene),
                aA = null,
                av = 0x0,
                aw = 0x1,
                aD['block_move'] = 0x0,
                a2['visible'] = !0x1,
                aI = !0x0,
                aJ = null,
                red_mat_opac['color']['setHex'](0x880000),
                s_helper_red_mat['color']['setHex'](0x880000),
                aD['s_helper']['material'] = s_helper_mat,
                aK = {},
                !0x0 === global_options['colorpicker_mode'] || global_options['facade_mode'] ? a1['style']['cursor'] = global_options['color_picker_cursor'] : a1['style']['cursor'] = aB ? 'pointer' : 'auto',
                pp['interface']['root'] && pp['interface']['root']['tmp_dis']();
            } else {
                if (0x1 == bi['which']) {
                    var bk = global_options['mouse_mode']['planeInfo']
                      , bm = global_options['mouse_mode']['embed_obj'];
                    if (!bk || !bm)
                        return;
                    var br = computeUVOnPlane(bk, ax, aD, units, bi);
                    if (!br)
                        return;
                    global_options['mouse_mode']['_embed_fixed'] = {
                        'u': br['u'],
                        'v': br['v'],
                        'halfU': bk['halfU'],
                        'halfV': bk['halfV']
                    };
                    var bs = uvToWorld(bk, br['u'], br['v']);
                    bm['position']['copy'](bs),
                    bk['crossHelper'] && bk['crossHelper']['position']['set'](br['u'], br['v'], 0x0),
                    global_options['mouse_mode']['_embed_locked'] = !0x0,
                    global_options['mouse_mode']['_embed_fixed_active'] = !0x0,
                    app?.['$root'] && app['$root']['$emit']('embed_fixed_changed', global_options['mouse_mode']['_embed_fixed_active']);
                }
            }
        }
    }
    function aY() {
        a1['addEventListener']('mousemove', aV, !0x1),
        a1['addEventListener']('mousedown', aW, !0x1),
        a1['addEventListener']('mouseup', aX, !0x1),
        a1['addEventListener']('touchmove', aV, !0x1),
        a1['addEventListener']('touchstart', aW, !0x1),
        a1['addEventListener']('touchend', aX, !0x1);
    }
    function aZ() {
        a1['removeEventListener']('mousemove', aV, !0x1),
        a1['removeEventListener']('mousedown', aW, !0x1),
        a1['removeEventListener']('mouseup', aX, !0x1),
        a1['removeEventListener']('touchmove', aV, !0x1),
        a1['removeEventListener']('touchstart', aW, !0x1),
        a1['removeEventListener']('touchend', aX, !0x1);
    }
    function b0() {
        aZ();
    }
    function b1(bi) {
        return 'cabinet' === bi['object_type'] || 'Room' === bi['name'] ? bi : b1(bi['parent']);
    }
    function b2(bi) {
        var bj;
        let bk = 0x0
          , bl = bi['object_type'];
        return bl = bl || bi['userData']['object_type'],
        bi['userData'] && 0x1 == bi['userData']['grouped'] && (bk = 0x1),
        pp_keyboard['r'] && (bk = 0x0),
        !{
            'cabinet': 0x1,
            'drag_group': 0x1,
            'washer': 0x1,
            'tabletop': 0x1,
            'wall': 0x1
        }[bl] || bi['userData'] && bk ? b2(bi['parent'], event) : bi;
    }
    function b3(bi) {
        return bi instanceof CabinetFacade ? bi : bi['parent'] ? b3(bi['parent']) : null;
    }
    function b4(bi) {
        return bi instanceof Draggable ? bi : bi['parent'] ? b4(bi['parent']) : null;
    }
    function b5(bi) {
        return bi instanceof Module && !0x0 !== bi['userData']['params']['spec']['raycast_ignore'] ? bi : bi['parent'] ? b5(bi['parent']) : null;
    }
    function b6(bi) {
        return bi instanceof Slider || bi instanceof Rotator || bi instanceof CabinetAnimator ? bi : bi['parent'] ? b6(bi['parent']) : null;
    }
    function b7() {
        var bi = [];
        bi['push'](room['left_wall']),
        bi['push'](room['right_wall']),
        bi['push'](room['front_wall']),
        bi['push'](room['back_wall']);
        for (let bj = N['length']; bj--; )
            'Shaft' == N[bj]['temp_type'] && bi['push'](N[bj]);
        return bi;
    }
    function b8(bi) {
        var bj = [];
        for (let bl = N['length']; bl--; ) {
            if ('Module' == N[bl]['temp_type'] && 0x1 != N[bl]['userData']['params']['spec']['fill_locked']) {
                var bk = N[bl]['get_draggables']();
                for (let bm = bk['length']; bm--; )
                    bj['push'](bk[bm]);
            }
            bj['push'](N[bl]);
        }
        return bj;
    }
    function b9(bi, bj=!0x1) {
        var bk = {
            'cabinet': 0x1,
            'module': 0x1,
            'drag_group': 0x1,
            'washer': 0x1,
            'tabletop': 0x1,
            'wall': 0x1,
            'draggable': 0x1
        }, bl;
        let bm = bi['object_type'];
        return bm = bm || bi['userData']['object_type'],
        bi['userData']['params'] && 'module' === bi['userData']['params']['type'] ? bi['userData']['root'] : bj && bi['userData']['is_interactive'] || bi['is_control'] ? bi : 'draggable' == bm && 0x1 == bi['userData']['root']['userData']['params']['spec']['fill_locked'] ? b9(bi['parent'], bj) : bk[bm] ? bi : bi['parent'] ? b9(bi['parent'], bj) : null;
    }
    function ba(bi) {
        if (ce(bi),
        'function' == typeof Slider) {
            var bj = b6(bi);
            if (bj)
                return void bj['animate']();
        }
        if ('function' == typeof CabinetAnimator) {
            var bj = b6(bi);
            if (bj)
                return void bj['animate']();
        }
        -0x1 < bi['name']['indexOf']('door_rtl') && bi['click'](),
        -0x1 < bi['name']['indexOf']('door_ltr') && bi['click'](),
        -0x1 < bi['name']['indexOf']('door_simple_top') && bi['click'](),
        -0x1 < bi['name']['indexOf']('door_simple_bottom') && bi['click'](),
        -0x1 < bi['name']['indexOf']('locker') && bi['click'](),
        -0x1 < bi['name']['indexOf']('door_slide_left') && bi['click'](),
        -0x1 < bi['name']['indexOf']('door_slide_right') && bi['click'](),
        aD['block_move'] = 0x1,
        bi['parent']['o_type'] && 'Locker' === bi['parent']['o_type'] && bi['parent']['click'](),
        bi['parent']['parent']['o_type'] && 'Locker' === bi['parent']['parent']['o_type'] ? bi['parent']['parent']['click']() : bi['parent']['parent']['parent']['o_type'] && 'Locker' === bi['parent']['parent']['parent']['o_type'] ? bi['parent']['parent']['parent']['click']() : bi['parent']['parent']['parent']['parent']['o_type'] && 'Locker' === bi['parent']['parent']['parent']['parent']['o_type'] && bi['parent']['parent']['parent']['parent']['click']();
    }
    function bb() {
        var bi = new THREE['BoxGeometry'](0x1,0x1,0x1)
          , bj = new THREE['MeshBasicMaterial']({
            'color': 0xff0000,
            'transparent': !0x0,
            'opacity': 0.5,
            'depthTest': !0x1
        })
          , bi = new THREE['Mesh'](bi,bj);
        return bi['visible'] = !0x1,
        scene['add'](bi),
        bi;
    }
    function bc(bi, bj) {
        var bk, bj;
        bi && bj && (bk = bj['getSize'](new THREE['Vector3']()),
        bj = bj['getCenter'](new THREE['Vector3']()),
        bi['scale']['copy'](bk),
        bi['position']['copy'](bj));
    }
    this['hover_helper'] = new Drag_helper({
        'material': global_materials['hover_material']
    }),
    scene['add'](this['hover_helper']),
    this['hover_helper']['visible'] = !0x1,
    this['drag_helper'] = new Drag_helper({}),
    scene['add'](this['drag_helper']),
    this['drag_helper']['visible'] = !0x1,
    aY(),
    this['enabled'] = !0x0,
    this['activate'] = aY,
    this['deactivate'] = aZ,
    this['dispose'] = b0,
    this['go'] = function() {
        return b8();
    }
    ,
    this['setObjects'] = function() {}
    ,
    this['on'] = function(bi, bj) {
        aD['addEventListener'](bi, bj);
    }
    ,
    this['off'] = function(bi, bj) {
        aD['removeEventListener'](bi, bj);
    }
    ,
    this['notify'] = function(bi) {
        aD['dispatchEvent']({
            'type': bi
        });
    }
    ;
    let bd = {
        'collision': new THREE['MeshBasicMaterial']({
            'color': 0xff0000,
            'transparent': !0x0,
            'opacity': 0.5,
            'depthTest': !0x1
        }),
        'warning': new THREE['MeshBasicMaterial']({
            'color': 0xffaa00,
            'transparent': !0x0,
            'opacity': 0.3,
            'depthTest': !0x1
        }),
        'snap': new THREE['MeshBasicMaterial']({
            'color': 0xff00,
            'transparent': !0x0,
            'opacity': 0.3,
            'depthTest': !0x1
        })
    };
    function bf(bi) {
        switch (bi) {
        case 'collision':
            a2['material'] = bd['collision'];
            break;
        case 'warning':
            a2['material'] = bd['warning'];
            break;
        case 'snap':
            a2['material'] = bd['snap'];
            break;
        }
    }
    function bg(bi, bj, bk, bl, bm, bn, bo=[]) {
        if (!bi['userData']['params']['interaction']['check_intersection']) {
            var bp = 'bottom' === bi['cabinet_type'] || 'bottom' === bi['userData']['cabinet_group'] || 'at_wall_bottom' === bi['userData']['cabinet_group'], bk = bk['clone'](), bl = (bp && (bk['y'] = bi['position']['y']),
            bh(bk, bl, bm, bn, aD['params']['snap_distance'] || 0.1, bi)), bm = bi['box']['clone'](), bn = bk['clone'](), bk = (bl['isNearSnap'] && bl['snapPosition'] && bn['copy'](bl['snapPosition']),
            bp && (bn['y'] = bi['position']['y']),
            bn['clone']()['sub'](bi['position'])), bq = (bm['translate'](bk),
            0.01), br = bm['clone']()['expandByScalar'](-bq), bp;
            let bu = !0x1;
            a2['visible'] = !0x1;
            for (let bv = 0x0; bv < bj['length']; bv++) {
                var bs = bj[bv];
                if (bs !== bi && bs['visible'] && bs['box'] && !bs['userData']?.['params']?.['interaction']?.['check_intersection']) {
                    bs['box']['update']();
                    var bs = bs['box']['clone']()['expandByScalar'](-bq);
                    if (br['intersectsBox'](bs)) {
                        bu = !0x0;
                        break;
                    }
                }
            }
            for (let bw = 0x0; bw < bo['length']; bw++) {
                var bt = bo[bw]['box']['expandByScalar'](-bq);
                if (br['intersectsBox'](bt)) {
                    bu = !0x0;
                    break;
                }
            }
            return bu ? (a2['visible'] = !0x0,
            bc(a2, bm),
            bf('collision')) : bl['isNearSnap'] ? (a2['visible'] = !0x0,
            (bp = bi['box']['clone']())['translate'](bn['clone']()['sub'](bi['position'])),
            bc(a2, bp),
            bf('snap')) : a2['visible'] = !0x1,
            {
                'hasCollision': bu,
                'snapInfo': {
                    'isNearSnap': bl['isNearSnap'],
                    'snapPosition': bn,
                    'snapDistance': bl['snapDistance']
                }
            };
        }
    }
    function bh(bi, bj, bk, bl, bm, bn) {
        var bo = {
            'distance': 0x1 / 0x0,
            'position': null
        }, bp = 'bottom' === bn['cabinet_type'] || 'bottom' === bn['userData']['cabinet_group'], bq = new THREE['Vector3'](), bi = (bn['box']['getSize'](bq),
        bi['clone']()), bn, br, bs, bs, bn, br, bp, bk, br;
        return bp && (bi['y'] = bn['position']['y']),
        bj['length'] && !bj['check_intersection'] && (bn = _['minBy'](bj, 'dist'),
        (br = bi['clone']())['x'] = bn['pos'],
        (bs = {
            'x': br['x'] >= bq['x'] / 0x2 && br['x'] <= room['params']['width'] / units - bq['x'] / 0x2,
            'y': !0x0,
            'z': br['z'] >= bq['z'] / 0x2 && br['z'] <= room['params']['depth'] / units - bq['z'] / 0x2
        })['x']) && bs['z'] && bn['dist'] < bo['distance'] && (bo['distance'] = bn['dist'],
        bo['position'] = br),
        !bk['length'] || bp || bj['check_intersection'] || (bs = _['minBy'](bk, 'dist'),
        (bn = bi['clone']())['y'] = bs['pos'],
        (br = {
            'x': bn['x'] >= bq['x'] / 0x2 && bn['x'] <= room['params']['width'] / units - bq['x'] / 0x2,
            'y': 0x0 <= bn['y'] && bn['y'] <= room['params']['height'] / units - bq['y'],
            'z': bn['z'] >= bq['z'] / 0x2 && bn['z'] <= room['params']['depth'] / units - bq['z'] / 0x2
        })['x'] && br['y'] && br['z'] && bs['dist'] < bo['distance'] && (bo['distance'] = bs['dist'],
        bo['position'] = bn)),
        bl['length'] && !bj['check_intersection'] && (bp = _['minBy'](bl, 'dist'),
        (bk = bi['clone']())['z'] = bp['pos'],
        (br = {
            'x': bk['x'] >= bq['x'] / 0x2 && bk['x'] <= room['params']['width'] / units - bq['x'] / 0x2,
            'y': !0x0,
            'z': bk['z'] >= bq['z'] / 0x2 && bk['z'] <= room['params']['depth'] / units - bq['z'] / 0x2
        })['x']) && br['z'] && bp['dist'] < bo['distance'] && (bo['distance'] = bp['dist'],
        bo['position'] = bk),
        {
            'isNearSnap': bo['distance'] < bm,
            'snapPosition': bo['position'],
            'snapDistance': bo['distance']
        };
    }
}
,
THREE['DragControls']['prototype'] = Object['create'](THREE['EventDispatcher']['prototype']),
THREE['DragControls']['prototype']['constructor'] = THREE['DragControls'];
let grab_points_list = [];
function createCircularSprite(f) {
    var g = 0x40
      , h = document['createElement']('canvas')
      , i = (h['width'] = h['height'] = 0x40,
    h['getContext']('2d'))
      , f = (i['beginPath'](),
    i['arc'](0x20, 0x20, 0x20, 0x0, 0x2 * Math['PI']),
    i['fillStyle'] = f,
    i['fill'](),
    new THREE['CanvasTexture'](h));
    return new THREE['Sprite'](new THREE['SpriteMaterial']({
        'map': f,
        'depthTest': !0x1
    }));
}
function check_grap_point_intersection(f, g) {
    var h, g;
    return !!f['_grab_point'] && (g = 0x0 < g['intersectObject'](f['_grab_point'])['length'],
    f['_grab_point']['_is_grab_point'] = g,
    f['_grab_point']['scale']['set'](g ? 0x5 : 0x3, g ? 0x5 : 0x3, 0x1),
    document['body']['style']['cursor'] = g ? 'pointer' : 'default',
    g);
}
function change_grap_point(f, g, h) {
    var j, k, m, p, p, q, u, v, q, u, v;
    'add' !== g || !f || f['_grab_point'] || f['userData']?.['interaction']?.['movement_locked'] || f['userData']?.['params']['spec']?.['movement_locked'] || ((k = createCircularSprite('#ffff00'))['name'] = 'grab_point',
    m = f['getWorldPosition'](new THREE['Vector3']()),
    p = f['userData']['computed']['size'],
    p = new THREE['Vector3'](p['x'] / 0x2 / units,p['y'] / 0x2 / units,p['z'] / 0x2 / units),
    (q = f['userData']['params']['pivot']) && (u = 'string' == typeof q['x'] ? parseFloat(q['x']['split']('::')[0x0]) : q['x'],
    v = 'string' == typeof q['y'] ? parseFloat(q['y']['split']('::')[0x0]) : q['y'],
    q = 'string' == typeof q['z'] ? parseFloat(q['z']['split']('::')[0x0]) : q['z'],
    u = new THREE['Vector3']((u + 0x1) * f['userData']['computed']['size']['x'] / 0x2 / units,(v + 0x1) * f['userData']['computed']['size']['y'] / 0x2 / units,(q + 0x1) * f['userData']['computed']['size']['z'] / 0x2 / units),
    p['sub'](u)),
    p['applyQuaternion'](f['getWorldQuaternion'](new THREE['Quaternion']())),
    k['position']['copy'](m)['add'](p),
    k['scale']['set'](0x5, 0x5, 0x1),
    k['renderOrder'] = 0x270f,
    k['lookAt'](camera['position']),
    f['_grab_point'] = k,
    scene['add'](k),
    grab_points_list['push'](k)),
    'delete' === g && f && f['_grab_point'] && (scene['remove'](f['_grab_point']),
    -0x1 !== (v = grab_points_list['indexOf'](f['_grab_point'])) && grab_points_list['splice'](v, 0x1),
    f['_grab_point'] = null,
    document['body']['style']['cursor'] = 'default');
}
function traverse_parts(f, g) {
    if (f && f['userData'] && f['userData']['parts']) {
        var h = f['userData']['parts'], j;
        for (j in h)
            if (h['hasOwnProperty'](j)) {
                var k = h[j];
                if (Array['isArray'](k)) {
                    for (var l of k)
                        l && (g(l, j, f),
                        traverse_parts(l, g));
                }
            }
    }
}