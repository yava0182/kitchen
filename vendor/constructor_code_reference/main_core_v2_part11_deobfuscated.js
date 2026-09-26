 'methods': {
   'check_v2': function() {
     var f = this['$root']['$selected_object'],
       g;
     return !f || f['userData']['params'] && 'module' === f['userData']['params']['type'];
   },
   'update_price'() {
     var f = this['$root']['$selected_object'],
       f = (sc['get_price'](),
         f['_get_specs']());
     module_utils['apply_specs_aggr'](f),
       this['price'] = f['total_price'] ? format_price(f['total_price']) : '-';
   },
   'get_size_value': function(f) {
     var g;
     return void 0 === f ? '' : void 0 !== (g = pp['temp']['catalog_size_hash'][f]) ? g : f;
   },
   'get_variant_name': function(f) {
     let g = this['get_size_value'](f['size']['x']) + 'x' + this['get_size_value'](f['size']['y']) + 'x' + this[
       'get_size_value'](f['size']['z']) + '\x20' + this['lang']('mm');
     return 1 == constructor_settings['show_modules_names_in_sizes_select'] && (g += '\x20' + f['name']),
       g;
   },
   'change_tab': function(f, g = 0) {
     if (this['current_tab'] = f,
       this['panel_showed'] = 0,
       this['current_item'] = null,
       this['selected_module_index'] = null,
       'furni' == f && Vue['set'](this, 'accessories_list', this['$root']['$selected_object']['get_accessories']()),
       'hierarchy' === f && !this['config_item']) {
       var h = this['$root']['$selected_object'],
         h = copy_object(h['userData']['params']),
         j;
       for (j of h['spec']['templates'])
         module_utils['remove_nested_modules'](j['template']['tree']);
       Vue['set'](this, 'config_item', {
         'params': h
       });
     }
     if ('handles' == f) {
       let k = this['$root']['$selected_object'];
       var h = k['userData']['parts']['facade'];
       let l = [],
         m = [];
       for (let n = 0; n < handles_lib['tree']['length']; n++)
         m.push(handles_lib['tree'][n]['id']);
       h.forEach(o => {
           var o = {
             'facade_id': o['id'],
             'facade_name': o['name'],
             'path': o['userData']['path'],
             'handle_type': o['userData']['computed']['handle_type'],
             'params': o['userData']['params'],
             'categories': m,
             'cabinet_group': k['userData']['cabinet_group']
           };
           l.push(o);
         }),
         Vue['set'](this, 'handles_data', l);
     }
   },
   'set_accs_component': function() {
     var f = this;
     this['current_item'] = null,
       Vue['set'](f, 'current_props', {
         'mode': 'p',
         'mod_id': this['$root']['$selected_object']['userData']['params']['obj_id']
       }),
       this['current_item'] = 'cart',
       f['panel_showed'] = 1;
   },
   'check_tabs': function() {
     this['tabs']['size'] = 1 != this['disabled_tabs']['size'] ? 1 : 0;
     var f = Object['keys'](this['tabs']);
     if (0 == this['tabs'][this['current_tab']]) {
       for (let g = 0; g < f.length; g++)
         if (1 == this['tabs'][f[g]]) {
           this['change_tab'](f[g]);
           break;
         }
     } else
       this['change_tab'](this['current_tab']);
   },
   'find_corpus_item_in_group': function(f) {
     let g = this,
       h = _['find'](g['corpus_groups']?.[0], i => i['group'] === f);
     h && (g['corpus_props']['selected'] = copy_object(h['selected']),
       g['corpus_props']['group'] = h['group'],
       g['corpus_props']['cabinet_group'] = h['cabinet_tag'],
       g['corpus_props']['cabinet_group_data'] = copy_object(h['cabinet_group_data']),
       g['set_corpus_material_picker_v2_component'](),
       Vue['nextTick'](function() {
         Vue['nextTick'](function() {
           g['$refs']['current_comp']['find_item'](h['selected']);
         });
       }));
   },
   'find_cokol_item': function(f) {
     this['set_cokol_material_picker_component']();
     let g = this;
     Vue['nextTick'](function() {
       g['$refs']['current_comp']['find_item'](g['cokol_props']['selected']);
     });
   },
   'find_cokol_top_item': function(f) {
     this['set_cokol_material_picker_component'](true);
     let g = this;
     Vue['nextTick'](function() {
       g['$refs']['current_comp']['find_item'](g['cokol_top_props']['selected']);
     });
   },
   'find_cornice_item': function(f) {
     this['set_cornice_material_picker_component'](true);
     let g = this;
     Vue['nextTick'](function() {
       g['$refs']['current_comp']['find_item'](g['cornice_props']['selected']);
     });
   },
   'find_facade_item': function(f) {
     this['set_facade_picker_component']();
     let g = this;
     Vue['nextTick'](function() {
       g['$refs']['current_comp']['find_item'](g['facade_props']['selected']);
     });
   },
   'find_facade_material_item': function(f) {
     this['set_facade_material_picker_component']();
     let g = this;
     Vue['nextTick'](function() {
       g['$refs']['current_comp']['find_item'](g['facade_materials'][f]);
     });
   },
   'find_tabletop_item': function(f) {
     this['set_tabletop_picker_component']();
     let g = this;
     Vue['nextTick'](function() {
       g['$refs']['current_comp']['find_item'](g['tabletop_props']['selected']);
     });
   },
   'find_butt_item': function(f) {
     this['set_tabletop_picker_component']();
     let g = this;
     Vue['nextTick'](function() {
       g['$refs']['current_comp']['find_item'](g['butt_props']['selected']);
     });
   },
   async 'set_catalog_group_component'(f, g, h) {
     'corpus_material_picker_v2' == this['current_item'] && (this['current_item'] = null,
       await Vue['nextTick']());
     var g = {
       'method': 'single',
       'mode': 'c',
       'material_group': g,
       'mat_group_key': g['key'],
       'mode': h ? 'bc' : 'c'
     };
     Vue['set'](this, 'current_props', g),
       this['current_item'] = 'corpus_material_picker_v2',
       this['panel_showed'] = 1,
       await Vue['nextTick'](),
       this['$refs']['current_comp'] && (this['$refs']['current_comp']['$off']('select_item'),
         this['$refs']['current_comp']['$on']('select_item', j => {
           var k = this['$root']['$selected_object'],
             l = k['userData']['path'],
             m = k['userData']['root'],
             n = k['userData']['is_root'],
             j = (j['obj_groups'] = [k['userData']['params']['spec']['cabinet_tag']],
               k['change_material_group'](j),
               n ? k : module_utils['get_child_by_path'](m, l));
           this['set_mat_groups'](j),
             this['update_price']();
         }));
   },
   'forceRerender'() {
     this['componentKey'] += 1;
   },
   async 'set_catalog_group_handles'(f, g) {
     var h;
     Vue['set'](this, 'current_props', {
         'method': 'single',
         'mode': 'c',
         'multiple': 0,
         'categories': []
       }),
       this['current_item'] = 'handles_picker',
       this['panel_showed'] = 1,
       await Vue['nextTick'](),
       this['$refs']['current_comp'] && (this['$refs']['current_comp']['$off']('change_handle_single'),
         this['$refs']['current_comp']['$on']('change_handle_single', j => {
           var k = this['$root']['$selected_object'],
             l = this['$root']['$selected_object']['userData']['parts']['facade'][f]['userData']['path'],
             m = pp['libs']['handles']['find_item'](j['id'])['type'],
             n = this['handles_data'][f]['params']['spec']['handle']['dir'],
             m = (this['handles_data'][f]['handle_type'] = m,
               this['handles_data'][f]['params']['spec']['handle']['id'] = j['id'],
               this['handles_data'][f]['params']['spec']['handle']['p_size'] = j['size'],
               module_utils['get_child_by_path'](k, l));
           m?.['userData']['local_parent'] && module_utils['set_defaults_param'](m['userData']['local_parent'],
               'handle.id', j['id']),
             module_utils['set_defaults_param'](k, 'handle.id', j['id']),
             k['change_param_by_path'](l, 'spec.handle.id', j['id'], false),
             k['change_param_by_path'](l, 'spec.handle.p_size', j['size']),
             this['forceRerender']();
         }));
   },
   'change_mat_group_fixed'(f) {
     var g = this['$root']['$selected_object'];
     let h = null;
     var j = g['userData']['is_root'] ? g['userData']['params'] : module_utils['get_child_params_by_path'](g, g[
       'userData']['path']);
     if (f['is_nested']) {
       let l = j['spec']['mat_groups_state'];
       l || (l = [],
           j['spec']['mat_groups_state'] = l),
         h = l;
     } else
       h = j['spec']['mat_groups'];
     let k = _['find'](h, m => m['key'] === f['key']);
     k || (k = {
           'key': f['key'],
           'material': {},
           'fixed': 0
         },
         f['is_nested'] && h.push(k)),
       k['fixed'] = k['fixed'] ? 0 : 1,
       f['is_nested'] && g['userData']['is_root'] || g['_rebuild'](),
       this['set_mat_groups'](g);
   },
   'unset_defaults'(f) {
     var g = this['$root']['$selected_object'];
     if (f) {
       let i = f;
       'cornice_placer' === f && (i = 'cornice');
       var h = 'plints' === f ? 'tabletop.plints.material' : i + '.id';
       g['set_defaults_param'](h, pp['const']['not_set_value']),
         'butt' !== f && 'tabletop' !== f || g['set_defaults_param'](i + '.variant_id', pp['const']['not_set_value']),
         g['walk_params_tree'](j => {
           j['type'] === f && j['spec']['can_change']?.['id'] && (j['spec']['id'] = pp['const']['not_set_value']);
         }),
         g['_rebuild_parts_by_type'](f),
         'tabletop' !== f && 'plints' !== f || sc['build_tabletop'](),
         this[i + '_props'] && (this[i + '_props']['selected'] = 0,
           this[i + '_props']['is_empty'] = true);
     }
   },
   'set_tabletop_materials_picker_component_click': function() {
     this['set_tabletop_picker_component']();
   },
   'set_tabletop_materials_picker_component': function() {
     this['panel_showed'] = 1;
     let e = this,
       f = this['$root']['$selected_object'];
     Vue['set'](this, 'current_props', this['tabletop_props']),
       this['current_item'] = 'tabletop_materials_picker',
       this['tabletop_props']['lib'] = 'materials',
       Vue['nextTick'](function() {
         e['$refs']['current_comp'] && (e['$refs']['current_comp']['$off']('change_material'),
           e['$refs']['current_comp']['$off']('change_thickness'),
           e['$refs']['current_comp']['$on']('change_material', function(g) {
             f['change_tabletop_material'](g['id']),
               e['tabletop_props']['selected'] = parseInt(g['id']),
               e['update_price']();
           }),
           e['$refs']['current_comp']['$on']('change_thickness', function(g) {
             f['userData']['params']['tabletop']['height'] = parseInt(g),
               f['build'](),
               e['update_price']();
           }));
       });
   },
   'set_tabletop_picker_component': function() {
     if (constructor_settings['tabletop_v2']) {
       let e = this,
         f = this['$root']['$selected_object'];
       this['tabletop_props']['categories'] = null,
         this['tabletop_props']['lib'] = 'tabletop',
         this['tabletop_props']['tabletop_enabled'] = to_int(this['has_tabletop_var']),
         Vue['set'](this, 'current_props', this['tabletop_props']),
         this['current_item'] = 'tabletop_picker',
         this['panel_showed'] = 1,
         Vue['nextTick'](function() {
           e['$refs']['current_comp'] && (e['$refs']['current_comp']['$off']('change_material'),
             e['$refs']['current_comp']['$off']('change_material_plint'),
             e['$refs']['current_comp']['$off']('change_material_plint_active'),
             e['$refs']['current_comp']['$off']('change_param'),
             e['$refs']['current_comp']['$on']('change_material', function(g) {
               var h = find_selected_variant(g);
               f['change_tabletop_material_v2'](g['id'], h),
                 e['tabletop_props']['selected'] = parseInt(g['id']),
                 sc['build_tabletop']();
             }),
             e['$refs']['current_comp']['$on']('change_material_plint', function(g) {
               f['set_defaults_param']('tabletop.plints.material', g['id'], 'number'),
                 f['walk_params_tree'](h => {
                   'tabletop' === h['type'] && (h['spec']['plints']['material'] = g['id']);
                 }),
                 f['_rebuild_parts_by_type']('tabletop'),
                 e['tabletop_props']['selected_plint'] = parseInt(g['id']),
                 sc['build_bort_v3']();
             }),
             e['$refs']['current_comp']['$on']('change_param', function(g) {
               var h;
               if ('tabletop_enabled' === g['id'])
                 h = to_int(g['value']),
                 module_utils['change_variables'](f, {
                   'key': '_tbl',
                   'value': h
                 }, {
                   'isMain': true,
                   'isTemplate': true,
                   'isVariant': true,
                   'isGlobal': true,
                   'action': 'update',
                   'triggerBuild': 'rebuild',
                   'raiseEvent': true
                 }),
                 f['_rebuild'](),
                 sc['build_tabletop']();
               else {
                 if ('tabletop_plint_enabled' === g['id']) {
                   let i = to_int(g['value']);
                   f['set_defaults_param']('tabletop.plints.enabled', i, 'bool'),
                     f['walk_params_tree'](j => {
                       'tabletop' === j['type'] && (j['spec']['plints']['enabled'] = i);
                     }),
                     f['_rebuild_parts_by_type']('tabletop'),
                     e['tabletop_props']['plint_enabled'] = i,
                     sc['build_bort_v3']();
                 }
               }
             }));
         });
     } else
       this['set_tabletop_materials_picker_component']();
   },
   'set_cokol_material_picker_component': function(f) {
     this['panel_showed'] = 1;
     let g = this,
       h = this['$root']['$selected_object'];
     Vue['set'](this, 'current_props', f ? this['cokol_top_props'] : this['cokol_props']),
       this['current_item'] = 'cokol_material_picker_v2',
       Vue['nextTick'](function() {
         if (g['$refs']['current_comp']) {
           g['$refs']['current_comp']['$off']('change_height'),
             g['$refs']['current_comp']['$off']('change_cokol_float'),
             g['$refs']['current_comp']['$off']('change_material_as_corpus'),
             g['$refs']['current_comp']['$off']('change_material');
           let j = f ? 'cokol_top' : 'cokol';
           g['$refs']['current_comp']['$on']('change_material', function(k) {
             let l = false;
             h['set_defaults_param'](j + '.id', parseInt(k['id']) || pp['const']['not_set_value']),
               h['walk_params_tree'](m => {
                 m['type'] === j && m['spec']['can_change']?.['id'] && (m['spec']['id'] = k['id'],
                   l = true);
               }),
               l && ('cokol' == j ? (h['_rebuild'](),
                 sc['build_tabletop']()) : 'cokol_top' == j && h['_rebuild_parts_by_type'](j)),
               g[j + '_props']['is_empty'] = is_empty_id(parseInt(k['id'])),
               g[j + '_props']['selected'] = parseInt(k['id']),
               g['update_price']();
           });
         }
       });
   },
   'set_cornice_material_picker_component': function() {
     this['panel_showed'] = 1;
     let f = this,
       g = this['$root']['$selected_object'];
     Vue['set'](this, 'current_props', this['cornice_props']),
       this['current_item'] = 'cokol_material_picker_v2',
       Vue['nextTick'](function() {
         f['$refs']['current_comp'] && (f['$refs']['current_comp']['$off']('change_material'),
           f['$refs']['current_comp']['$on']('change_material', function(h) {
             let i = false;
             g['walk_params_tree'](j => {
                 'cornice_placer' === j['type'] && j['spec']['can_change']?.['id'] && (j['spec']['id'] = h[
                     'id'],
                   i = true);
               }),
               i && g['_rebuild_parts_by_type']('cornice_placer'),
               g['set_defaults_param']('cornice.id', parseInt(h['id']) || pp['const']['not_set_value']),
               f['cornice_props']['is_empty'] = is_empty_id(parseInt(h['id'])),
               f['cornice_props']['selected'] = parseInt(h['id']),
               f['update_price']();
           }));
       });
   },
   'set_facade_picker_component': function() {
     this['panel_showed'] = 1;
     let e = this,
       f = this['$root']['$selected_object'];
     Vue['set'](this, 'current_props', this['facade_props']),
       this['current_item'] = 'cokol_material_picker_v2',
       Vue['nextTick'](function() {
         e['$refs']['current_comp'] && (e['$refs']['current_comp']['$off']('change_material'),
           e['$refs']['current_comp']['$on']('change_material', function(g) {
             let h = false,
               j = (f['walk_params_tree'](w => {
                   if ('facade' === w['type'] && w['spec']['can_change']?.['id']) {
                     w['spec']['id'] = g['id'];
                     let x = true;
                     (x = isNaN(parseInt(w['spec']['type'])) && module_utils['get_facade_type'](w['spec'][
                       'id'], w['spec']['type']) ? false : x) && (w['spec']['type'] = 'full'),
                     h = true;
                   }
                 }),
                 false);
             if (!(j = f['userData']['params']['variables']?.['main']?.[pp['const']['vars'][
                 'facade_thickness']] ? true : j)) {
               for (var k of f['userData']['parts']['module'])
                 if (!j && k['userData']['params']['variables']?.['main']?.[pp['const']['vars'][
                     'facade_thickness'
                   ]]) {
                   j = true;
                   break;
                 }
             }
             h && !j && f['_rebuild_parts_by_type']('facade');
             let m = [];
             var n = e['facade_type_props']['selected'];
             if (!is_empty_value(n)) {
               let w = true;
               (w = isNaN(parseInt(n)) && module_utils['get_facade_type'](g['id'], n) ? false : w) && (m.push(
                   ['facade.type', 'full']),
                 e['facade_type_props']['selected'] = 'full',
                 e['facade_type_props']['item'] = copy_object(module_utils['get_facade_type'](g['id'],
                   'full') || {}),
                 e['facade_type_props']['name'] = e['get_facade_type_name'](e['facade_type_props']['item']));
             }
             var n = e['facade_type_radius_props']['selected'];
             if (!is_empty_value(n)) {
               let x = true;
               (x = isNaN(parseInt(n)) && module_utils['get_facade_type'](g['id'], n) ? false : x) && (m.push(
                   ['facade.type_radius', 'full']),
                 e['facade_type_radius_props']['selected'] = 'full',
                 e['facade_type_radius_props']['item'] = copy_object(module_utils['get_facade_type'](g['id'],
                   'full') || {}),
                 e['facade_type_radius_props']['name'] = e['get_facade_type_name'](e['facade_type_radius_props']
                   ['item']));
             }
             var n = e['facade_type_side_props']['selected'];
             if (!is_empty_value(n)) {
               let y = true;
               (y = isNaN(parseInt(n)) && module_utils['get_facade_type'](g['id'], n) ? false : y) && (m.push(
                   ['facade.type_side', 'full']),
                 e['facade_type_side_props']['selected'] = 'full',
                 e['facade_type_side_props']['item'] = copy_object(module_utils['get_facade_type'](g['id'],
                   'full') || {}),
                 e['facade_type_side_props']['name'] = e['get_facade_type_name'](e['facade_type_side_props'][
                   'item'
                 ]));
             }
             var n = parseInt(g['id']),
               q;
             m.push(['facade.id', n || pp['const']['not_set_value']]),
               module_utils['walk_params_tree'](f, (z, A) => {
                 if ('module' === z['type']) {
                   for (var B of m)
                     module_utils['set_defaults_param'](z, B[0], B[1]);
                 }
               });
             for (q of f['userData']['parts']['module'])
               for (var u of m)
                 module_utils['set_defaults_param'](q, u[0], u[1]);
             j ? f['_rebuild']() : f['_build_defaults'](),
               e['facade_props']['is_empty'] = is_empty_id(n),
               e['facade_props']['selected'] = n;
             var v = pp['libs']['facades']['get_item'](e['facade_props']['selected']);
             e['facade_material_props']['categories'] = v['materials'],
               e['facade_type_props']['facade'] = n,
               e['facade_type_props']['item'] = copy_object(module_utils['get_facade_type'](e[
                 'facade_type_props']['facade'], e['facade_type_props']['selected']) || {}),
               e['facade_type_props']['name'] = e['get_facade_type_name'](e['facade_type_props']['item']),
               e['facade_type_radius_props']['facade'] = n,
               e['facade_type_radius_props']['item'] = copy_object(module_utils['get_facade_type'](e[
                 'facade_type_radius_props']['facade'], e['facade_type_radius_props']['selected']) || {}),
               e['facade_type_radius_props']['name'] = e['get_facade_type_name'](e['facade_type_radius_props'][
                 'item'
               ]),
               e['facade_type_side_props']['facade'] = n,
               e['facade_type_side_props']['item'] = copy_object(module_utils['get_facade_type'](e[
                 'facade_type_side_props']['facade'], e['facade_type_side_props']['selected']) || {}),
               e['facade_type_side_props']['name'] = e['get_facade_type_name'](e['facade_type_side_props'][
                 'item'
               ]),
               e['update_price']();
           }));
       });
   },
   'set_facade_material_picker_component': function(e) {
     this['panel_showed'] = 1;
     let f = this,
       g = this['$root']['$selected_object'];
     Vue['set'](this, 'current_props', this['facade_material_props']),
       this['current_item'] = 'cokol_material_picker_v2',
       Vue['nextTick'](function() {
         f['$refs']['current_comp'] && (f['$refs']['current_comp']['$off']('change_material'),
           f['$refs']['current_comp']['$on']('change_material', function(h) {
             var j = f['facade_props']['selected'],
               k;
             g['set_defaults_param']('facade.materials.' + e, parseInt(h['id']) || pp['const'][
               'not_set_value']),
               module_utils['walk_params_tree'](g, (l, m) => {
                 'module' === l['type'] && module_utils['set_defaults_param'](l, 'facade.materials.' + e,
                   parseInt(h['id']) || pp['const']['not_set_value']);
               });
             for (k of g['userData']['parts']['module'])
               module_utils['set_defaults_param'](k, 'facade.materials.' + e, parseInt(h['id']) || pp['const'][
                 'not_set_value'
               ]);
             g['_build_defaults'](),
               module_utils['change_facade_material'](g, j, e, h['id']),
               f['facade_materials'][e] = parseInt(h['id']),
               f['facade_material_props']['selected'] = parseInt(h['id']),
               f['update_price']();
           }));
       });
   },
   'set_facades_type_picker_component': async function(e) {
     let f = this,
       g = (this['current_item'] = null,
         this['$root']['$selected_object']),
       h = this['facade_type_props'];
     'radius' === e ? h = this['facade_type_radius_props'] : 'side' === e && (h = this['facade_type_side_props']),
       Vue['set'](f, 'current_props', h),
       this['current_item'] = 'facade_type_picker',
       f['panel_showed'] = 1,
       await Vue['nextTick'](),
       f['$refs']['current_comp'] && (f['$refs']['current_comp']['$off']('change_type'),
         f['$refs']['current_comp']['$on']('change_type', function(j) {
           let k = e ? 'facade.type_' + e : 'facade.type';
           module_utils['walk_params_tree'](g, (u, v) => {
             'module' === u['type'] && module_utils['set_defaults_param'](u, k, j);
           });
           for (var l of g['userData']['parts']['module'])
             module_utils['set_defaults_param'](l, k, j);
           var m;
           g['_build_defaults']();
           let n = g['_get_defaults']()?.['facade']['id'],
             q = false;
           if ('side' === e)
             g['walk_params_tree'](u => {
               'facade' === u['type'] && '' + u['spec']['id'] == '' + n && u['spec']['can_change']?.['type'] &&
                 1 === to_int(u['spec']['side']) && (u['spec']['type'] = j,
                   q = true);
             });
           else {
             let u = to_int('radius' === e);
             g['walk_params_tree'](v => {
               'facade' === v['type'] && '' + v['spec']['id'] == '' + n && v['spec']['can_change']?.['type'] &&
                 !v['spec']['side'] && to_int(v['spec']['radius']) === u && (v['spec']['type'] = j,
                   q = true);
             });
           }
           q && g['_rebuild_parts_by_type']('facade'),
             h['selected'] = j,
             h['item'] = copy_object(module_utils['get_facade_type'](n, j) || {}),
             h['name'] = f['get_facade_type_name'](h['item']),
             f['update_price']();
         }));
   },
   'get_type_icon': function(f) {
     let g = this['facade_type_props'];
     'radius' === f ? g = this['facade_type_radius_props'] : 'side' === f && (g = this['facade_type_side_props']);
     var f = pp['libs']['facades']['items'][g['facade']],
       h;
     if (!f || !f['types'])
       return h = {
         'background-image': 'url(/common_assets/images/no_image.png)'
       };
     var j = {
       'full': '/common_assets/images/icons/common_full_78.jpg',
       'window': '/common_assets/images/icons/common_window_78.jpg',
       'frame': '/common_assets/images/icons/common_frame_78.jpg'
     };
     let k = copy_object(g['selected'] || 0),
       l = '',
       m = (Array.isArray(k) && (k = k[0]),
         isNaN(parseInt(k)) && (l = k,
           k = f['compatibility_types']?.[k]),
         k = k || 0,
         f['types'][k]?.['icon']);
     var f = {};
     return (m = m || j[l]) ? f['background-image'] = 'url(' + m + ')' : f['background-image'] =
       'url(/common_assets/images/no_image.png)',
       f;
   },
   'get_facade_type_name': function(f) {
     return f?.['name'] || '';
   },
   'get_module_info': function() {
     var f = this['$root']['$selected_object'],
       g, h, h;
     'function' == typeof c_module_info ? c_module_info(f) : (g = {
         'name': '',
         'icon': '',
         'code': '',
         'data': '',
         'total': copy_object(f['userData']['computed']['price'])
       },
       (h = pp['libs']['catalogs'][f['userData']['params']['spec']['element_type']])['items'][f['userData'][
         'params']['id']] && (g['icon'] = h['items'][f['userData']['params']['id']]['icon']),
       f['userData']['computed']['code'] && (g['code'] = f['userData']['computed']['code']),
       g['name'] = f['userData']['params']['name'],
       g['icon'] || (g['icon'] = '/common_assets/images/no_image.png'),
       'function' == typeof f['_get_specs'] ? (h = f['_get_specs'](),
         module_utils['apply_specs_aggr'](h),
         h['mode'] = 'object',
         this['$root']['$emit']('info_modal_show', {
           'heading': this['lang']('module_info'),
           'v2': 2,
           'data': h
         })) : this['$root']['$emit']('info_modal_show', {
         'heading': this['lang']('module_info'),
         'data': [g]
       }));
   },
   'set_intersection_check': function() {
     var f;
     this['$root']['$selected_object']['userData']['params']['interaction']['check_intersection'] = this[
         'check_intersections'] ? 1 : 0,
       check_overlap();
   },
   'do_elem_function'(f, g) {
     'function' == typeof pp['module_menu']['functions'][f['fn']] && pp['module_menu']['functions'][f['fn']](this[
       '$root']['$selected_object'], g);
   },
   'generate_obj_id': function() {
     return Math['random']()['toString'](36)['substr'](2, 9);
   },
   'set_model_materials'(f) {
     if (f['userData']['is_root'] && f['userData']['parts']?.['model']?.['length']) {
       var g = [],
         h = new Map(),
         j = get_mat_lib_hash_ids();
       if (j['size']) {
         var k = f['userData']['params']['spec']['model_mats'] || {},
           m;
         for (m of f['userData']['parts']['model']) {
           var q = m['userData']['computed']['model_item']?.['params']?.['meshes'],
             v;
           for (v of Object['keys'](q || {})) {
             var w = q[v],
               x = j['get']('' + w['selected']),
               y, z, A;
             x && x['key'] && (h['has'](x['key']) || ((y = {
                 'name': x['name'],
                 'key': x['key'],
                 'mode': '' + x['mode'],
                 'mat_id': parse_int(x['selected']),
                 'mat_key': x['p_key'],
                 'categories': x['categories'] || []
               })['categories'] = _.map(y['categories'], B => parse_int(B)),
               z = k[x['key']],
               A = '' + y['mode'],
               is_empty_id(z?.['mat_id']) || A != '' + z['mode'] ? is_empty_id(w['mat_id']) || A != '' + w[
               'mode'] || ('2' == A && (y['mat_id'] = w['mat_id']),
                 '3' == A && w['mat_key'] && (y['mat_id'] = w['mat_id'],
                   y['mat_key'] = w['mat_key'])) : (y['mode'] = A,
                 y['key'] = z['key'] || '',
                 y['mat_id'] = z['mat_id'] || 0,
                 y['mat_key'] = z['mat_key'] || '',
                 y['mat_variant_id'] = z['mat_variant_id'] || 0),
               h['set'](x['key'], y),
               g.push(y)));
           }
         }
         Vue['set'](this, 'model_materials', g);
       }
     } else
       Vue['set'](this, 'model_materials', []);
   },
   'set_model_material_component'(f) {
     '2' === f['mode'] ? this['set_model_material_component_m2'](f) : '3' === f['mode'] && this[
       'set_model_material_component_m3'](f);
   },
   async 'set_model_material_component_m2'(f) {
     'cokol_material_picker_v2' == this['current_item'] && (this['current_item'] = null,
         await Vue['nextTick']()),
       this['panel_showed'] = 1;
     let g = this,
       h = this['$root']['$selected_object'];
     var j = {
       'categories': f['categories'] || [],
       'selected': f['mat_id'] || 0,
       'method': 'single',
       'height_val': 0,
       'cokol_as_corpus_val': false,
       'lib': 'materials',
       'mode': 'c',
       'is_empty': true
     };
     Vue['set'](this, 'current_props', j),
       this['current_item'] = 'cokol_material_picker_v2',
       await Vue['nextTick'](),
       g['$refs']['current_comp'] && (g['$refs']['current_comp']['$off']('change_height'),
         g['$refs']['current_comp']['$off']('change_cokol_float'),
         g['$refs']['current_comp']['$off']('change_material_as_corpus'),
         g['$refs']['current_comp']['$off']('change_material'),
         g['$refs']['current_comp']['$on']('change_material', function(k) {
           var l = {
               'mode': f['mode'],
               'key': f['key'],
               'mat_id': parseInt(k['id'])
             },
             k = (f['mat_id'] = parseInt(k['id']),
               module_utils['change_model_material'](h, l),
               h['userData']['is_root'] ? h : module_utils['get_child_by_path'](root, path));
           g['set_model_materials'](k),
             g['update_price']();
         }));
   },
   async 'set_model_material_component_m3'(f) {
     'corpus_material_picker_v2' == this['current_item'] && (this['current_item'] = null,
       await Vue['nextTick']());
     let g = this,
       h = this['$root']['$selected_object'];
     var j = {
         'available': [{
           'key': f['mat_key'] || '',
           'name': pp['libs']['materials'][f['mat_key']]?.['get_name']() || '',
           'categories': [],
           'thickness': []
         }],
         'material': {
           'av_index': 0,
           'key': f['mat_key'],
           'id': f['mat_id'],
           'variant_id': 0
         },
         'butt': {}
       },
       k;
     Vue['set'](this, 'current_props', {
         'method': 'single',
         'mode': 'c',
         'show_butt': 0,
         'show_fixed': 0,
         'material_group': j,
         'mat_group_key': 'model_material'
       }),
       this['current_item'] = 'corpus_material_picker_v2',
       this['panel_showed'] = 1,
       await Vue['nextTick'](),
       this['$refs']['current_comp'] && (this['$refs']['current_comp']['$off']('select_item'),
         this['$refs']['current_comp']['$on']('select_item', l => {
           var m = {
               'mode': f['mode'],
               'key': f['key'],
               'mat_id': parseInt(l['mat_id']),
               'mat_key': l['mat_key'],
               'mat_variant_id': l['mat_variant_id']
             },
             l = (f['mat_id'] = parseInt(l['id']),
               f['mat_key'] = l['mat_key'],
               module_utils['change_model_material'](h, m),
               h['userData']['is_root'] ? h : module_utils['get_child_by_path'](root, path));
           g['set_model_materials'](l),
             g['update_price']();
         }));
   },
   'set_mat_groups'(j) {
     var q = j['userData']['params'],
       w = j['userData']['params']['spec'],
       x, z = j['userData']['root']['userData']['params']['spec']['cabinet_tag'];
     let A = project_settings['kitchen']?.['mat_groups'] || {};
     var w = _.filter(copy_object(w['mat_groups'] || []), S => 0 !== A[S['key']]?.['active']),
       B = [],
       C = new Map();
     if (j['userData']['parts']?.['module']?.['length']) {
       for (var D of w)
         C['set'](D['key'], D);
       var E = Object['keys'](j['userData']['parts_by_path']['module']),
         F, G, H, I, J;
       natural_sort(E);
       for (F of E) {
         var K = j['get_child_params_by_path'](F),
           L = j['get_child_by_path'](F),
           K = K?.['spec']?.['mat_groups'],
           N, N;
         if (K)
           for (var O of K) {
             O['fixed'] || 0 !== A[O['key']]?.['active'] && ((N = C['get'](O['key'])) ? N['is_nested'] && is_empty_id(
               N['material']['id']) && module_utils['init_mat_group_material'](q, N, O, L, z, true) : ((N =
                 copy_object(O))['is_nested'] = 1,
               N['vue_id'] = this['generate_obj_id'](),
               C['set'](O['key'], N),
               B.push(N),
               module_utils['init_mat_group_material'](q, N, O, L, z, true)));
           }
       }
       for (let S of w) {
         is_empty_id(S['material']['id']) && module_utils['init_mat_group_material'](q, S, null, j, z, false),
           S['material']['id'] = parseInt(S['material']['id']),
           S['butt'] || (H = _['find'](pp['libs']['materials_info']['keys'], T => T['key'] === S['material']?.['key'])
             ?.['butts'] || '',
             S['butt'] = {
               'key': H,
               'id': 0
             });
       }
       for (let T of B) {
         T['material']['id'] = parseInt(T['material']['id']),
           T['butt'] || (J = _['find'](pp['libs']['materials_info']['keys'], U => U['key'] === T['material']?.['key'])
             ?.['butts'] || '',
             T['butt'] = {
               'key': J,
               'id': 0
             });
       }
       Vue['set'](this, 'corpus_groups', [{
         'name': '',
         'mat_groups': w
       }, {
         'name': 'Вложенные\x20модули',
         'mat_groups': B
       }]);
     } else {
       for (var P of w)
         P['vue_id'] = this['generate_obj_id']();
       var E = j['userData']['is_root'] ? w : _.filter(w, U => U['local']),
         Q, R;
       for (let U of E) {
         module_utils['init_mat_group_material'](q, U, null, j, z, false),
           U['butt'] || (R = _['find'](pp['libs']['materials_info']['keys'], W => W['key'] === U['material']?.['key'])
             ?.['butts'] || '',
             U['butt'] = {
               'key': R,
               'id': 0
             });
       }
       Vue['set'](this, 'corpus_groups', [{
         'name': '',
         'mat_groups': E
       }]);
     }
   },
   'set_modules'(f) {
     if (!f['userData']['parts']?.['module'] || !f['userData']['parts']?.['module']['length'])
       return Vue['set'](this, 'modules', []),
         null;
     var g = f['userData']['params']?.['spec']?.['module_types'] || {};
     if (0 === g?.['__all']?.['visible'])
       return Vue['set'](this, 'modules', []),
         null;
     let h = new Map();
     var j = _.map(pp['libs']['catalogs_info']['keys'], p => {
         var q = {
           'name': p['name'],
           'key': p['key'],
           'modules': []
         };
         return h['set'](p['key'], q),
           q;
       }),
       k, l;
     for (k of f['userData']['parts']['module']) {
       var m = k['userData']['params']['spec'] || {},
         n = h['get'](m['element_type']);
       if (n && 0 !== g?.[m['element_type']]?.['visible']) {
         let p = pp['libs']['catalogs'][m['element_type']]?.['items'][m['id']];
         var m = {
           'obj_id': '' + k['uuid'] + m['id'] + m['element_type'],
           'id': m['id'],
           'element_type': m['element_type'],
           'name': p?.['name'] || p?.['params']?.['name'] || k['userData']['params']['name'],
           'code': k['userData']['computed']['code'] || '-',
           'path': k['userData']['path'],
           'can_change_id': m['can_change']['id']
         };
         n['modules']['push'](m);
       }
     }
     for (l of j)
       l['modules']['length'] && natural_sort(l['modules'], 'path');
     return Vue['set'](this, 'modules', j),
       j;
   },
   'change_toggle'(f) {
     var g;
     this['$root']['$selected_object']['change_toggle_by_key'](f['key'], f['value']);
   },
   'item_icon': function() {
     var f = {};
     return f['background-image'] = 'url(' + this['icon'] + ')',
       f;
   },
   'change_variant': function() {
     var f = this['$root']['$selected_object'],
       g = (delete f['userData']['params']['size_changed'],
         f['userData']['is_root'] && f['box'] ? (f['box']['update'](),
           f['box']['clone']()) : null),
       g = (f['set_variant_active'](this['selected_variant']),
         this['set_item'](f),
         sc['correct_position_new'](f, g),
         _['get'](f, 'userData.parts.tabletop'));
     if (g && g.length) {
       for (var h of g)
         h['resize_connects']();
       sc['update_tabletops_connects']();
     }
     try {
       setTimeout(() => {
         dControls['s_helper']['make'](this['$root']['$selected_object']);
       }, 50);
     } catch (i) {}
   },
   'change_size': function() {
     clearTimeout(this['debounce']);
     let e = this;
     is_empty_value(e['size']['width']) || is_empty_value(e['size']['height']) || is_empty_value(e['size'][
       'depth']) || (this['debounce'] = setTimeout(function() {
         var f = e['$root']['$selected_object'],
           g = (f['userData']['params']['size_changed'] = 1,
             f['userData']['is_root'] && f['box'] ? (f['box']['update'](),
               f['box']['clone']()) : null),
           h = f['userData']['params']['resizable']['minmax'],
           h = (0 < h['min']['x'] && e['size']['width'] < h['min']['x'] && (e['size']['width'] = h['min']['x']),
             0 < h['max']['x'] && e['size']['width'] > h['max']['x'] && (e['size']['width'] = h['max']['x']),
             0 < h['min']['y'] && e['size']['height'] < h['min']['y'] && (e['size']['height'] = h['min']['y']),
             0 < h['max']['y'] && e['size']['height'] > h['max']['y'] && (e['size']['height'] = h['max']['y']),
             0 < h['min']['z'] && e['size']['depth'] < h['min']['z'] && (e['size']['depth'] = h['min']['z']),
             0 < h['max']['z'] && e['size']['depth'] > h['max']['z'] && (e['size']['depth'] = h['max']['z']),
             f['set_size']({
               'x': parseInt(e['size']['width']),
               'y': parseInt(e['size']['height']),
               'z': parseInt(e['size']['depth'])
             }),
             f),
           h = _['get'](h, 'userData.parts.tabletop');
         if (h && h.length) {
           for (var j of h)
             j['resize_connects']();
           sc['update_tabletops_connects']();
         }
         sc['correct_position_new'](f, g),
           e['update_price']();
       }, this['delay']));
   },
   'change_comments': function() {
     let f = this,
       g = this['$root']['$selected_object'];
     this['debounce'] = setTimeout(function() {
       g['userData']['params']['comments'] = f['comments'],
         g['build_comments']();
     }, this['delay']);
   },
   'change_variable': function(f) {
     let g = f['variable'];
     var f = this['$root']['$selected_object'];
     if (g && f) {
       var h = f['userData']?.['parts']?.['model']['length'],
         j;
       for (j of this['variables'] || [])
         if (j['vars'] && j['vars']['length']) {
           var k = _['find'](j['vars'], B => B['key'] === g['key'] && B['is_nested'] == g['is_nested'] && B[
             'is_global'] == g['is_global'] && B['is_template'] == g['is_template']);
           if (k && !_['find'](k['disabled_values'], B => '' + B == '' + g['value'])) {
             k['value'] = g['value'],
               k['fixed'] = g['fixed'];
             break;
           }
         }
       let z = {
         'key': g['key'],
         'value': g['value'],
         'fixed': g['fixed']
       };
       var m = {
           'action': 'update',
           'isTemplate': g['is_template'],
           'isGlobal': g['is_global'],
           'triggerBuild': 'rebuild'
         },
         q;
       let A = f;
       if (g['is_nested'] || f['userData']['is_root']) {
         m['isMain'] = true,
           m['isGlobal'] = true,
           m['checkFixed'] = true;
         var q = z['fixed'],
           v = (delete z['fixed'],
             f['userData']['params']),
           w, x;
         if (g['is_nested']) {
           let B = v['variables']['mass_state'],
             C = (B || (B = [],
                 v['variables']['mass_state'] = B),
               _['find'](B, D => D['key'] === z['key']));
           C ? (C['value'] = z['value'],
             C['fixed'] = q) : (C = {
               'key': z['key'],
               'value': z['value'],
               'fixed': q
             },
             B.push(C));
         }
         if (A = [],
           !is_empty_value(z['value'])) {
           for (x of f['userData']['parts']['module']) {
             var y = x['userData']['params']['variables']['main']?.[g['key']];
             y && !y['fixed'] ? A.push(x) : (y = _['find'](x['userData']['params']['variables']['global'], D => D[
               'key'] === g['key'] && !D['fixed'])) && A.push(x);
           }
           A['sort']((D, E) => {
             var D = D['userData']['path']['match'](/,/g),
               E = E['userData']['path']['match'](/,/g),
               D, E;
             return (D = D ? D.length : 0) < (E = E ? E.length : 0) ? 1 : E < D ? -1 : 0;
           });
         }
       } else {
         var v = f['userData']['params'];
         let D;
         if (!(D = g['is_global'] ? _['find'](v['variables']?.['global'], E => E['key'] === z['key']) : v['variables']
             ?.['main']?.[z['key']])?.['local']) {
           if (D['fixed'] === z['fixed'])
             return;
           delete z['value'];
         }
       }
       if (module_utils['change_variables'](A, z, m),
         Array.isArray(A) && !g['is_nested'] && (m['checkFixed'] = false,
           z['fixed'] = g['fixed'],
           module_utils['change_variables'](f, z, m)),
         z['key'] === pp['const']['vars']['tabletop_enabled']) {
         let E = this['$root']['$selected_object'];
         this['has_tabletop'] = 0 < E['userData']['parts']['tabletop']['length'],
           this['can_change_tabletop'] = _['some'](E['userData']['parts']['tabletop'],
             'userData.params.spec.can_change.id');
       }
       z['key'] !== pp['const']['vars']['tabletop_enabled'] && z['key'] !== pp['const']['vars']['plint_enabled'] ||
         sc['build_tabletop'](),
         (h || f['userData']?.['parts']?.['model']?.['length']) && (q = f['userData']['is_root'] ? f : module_utils[
             'get_child_by_path'](f, f['userData']['path']),
           this['set_model_materials'](q)),
         this['$root']['$emit']('change_variable'),
         this['update_price']();
     }
   },
   'set_corpus_material_picker_v2_component': function() {
     this['panel_showed'] = 1;
     let e = this;
     Vue['set'](this, 'current_props', this['corpus_props']),
       this['current_item'] = null,
       Vue['nextTick'](() => {
         e['current_item'] = 'corpus_material_picker_v2',
           Vue['nextTick'](function() {
             e['$refs']['current_comp'] && (e['$refs']['current_comp']['$off']('change_material'),
               e['$refs']['current_comp']['$on']('change_material', function(f) {
                 var g = _['get'](pp['libs']['materials'][f['mat_key']]['get_item'](f['mat_id']),
                     'params.material', 0),
                   h = _['find'](e['corpus_groups'], k => k['group'] === f['group_key']),
                   j;
                 h && (h['selected']['id'] = f['mat_id'],
                     h['selected']['key'] = f['mat_key'],
                     h['selected']['variant_id'] = f['mat_variant_id'],
                     h['selected']['mat_lib_id'] = g,
                     h['cabinet_group_data'] = {
                       'key': f['mat_key'],
                       'id': f['mat_id'],
                       'variant_id': f['mat_variant_id']
                     }),
                   e['$root']['$selected_object']['change_material_group'](f),
                   e['update_price']();
               }));
           });
       });
   },
   'get_variables_for_options_menu'(f, g = false) {
     var j = this['$root']['$selected_object'],
       k = j['get_child_by_path'](f['path']),
       j = j['get_child_params_by_path'](f['path']),
       q, f, v;
     let w = j['variables']?.['main'],
       x = j['spec']['templates'][k['userData']['selected_template']]['template']['variables'],
       y = j['variables']?.['global'],
       z = true;
     if (w) {
       var A = {},
         B;
       for (B of Object['keys'](w))
         if (w[B]['editable']) {
           if (z = false,
             g)
             break;
           A[B] = w[B];
         }
       if (!g) {
         w = copy_object(A);
         for (var C of Object['keys'](w))
           void 0 === w[C]['fixed'] && (w[C]['fixed'] = 0);
       }
     }
     if (x && (g ? z && _['find'](x, 'editable') && (z = false) : (f = _.filter(x, 'editable'),
         (x = copy_object(f))['length'] && (z = false))),
       y) {
       if (g)
         z && _['find'](y, F => F['editable']) && (z = false);
       else {
         var k = _.filter(y, F => F['editable']),
           D;
         for (D of y = copy_object(k))
           void 0 === D['fixed'] && (D['fixed'] = 0);
         y.length && (z = false);
       }
     }
     let E;
     return E = g ? {
       'basic': {},
       'template': [],
       'global': [],
       'is_empty': z
     } : {
       'basic': w,
       'template': x,
       'global': y,
       'is_empty': z
     };
   },
   'set_module_options_component': async function(f) {
     var g;
     let h = this['$root']['$selected_object']['get_child_by_path'](f['path']);
     var j = this['get_variables_for_options_menu'](f);
     this['panel_showed'] = 1;
     let k = this;
     Vue['set'](this, 'current_props', {
         'variables': j,
         'path': f['path']
       }),
       this['current_item'] = null,
       await Vue['nextTick'](),
       k['current_item'] = 'module_options',
       await Vue['nextTick'](),
       k['$refs']['current_comp'] && (k['$refs']['current_comp']['$off']('change_variable'),
         k['$refs']['current_comp']['$on']('change_variable', function(l) {
           var m = {
             'key': l['variable']['key'],
             'value': l['variable']['value'],
             'fixed': l['variable']['fixed']
           };
           h['change_variables'](m, {
               'isTemplate': l['is_template'],
               'isGlobal': l['is_global'],
               'triggerBuild': 'rebuild'
             }),
             k['update_price']();
         }));
   },
   'set_module_picker_component': function(e, f = false) {
     this['panel_showed'] = 1;
     let g = this;
     Vue['set'](this, 'current_props', {
         'method': 'single',
         'lib': 'catalogs.' + e['element_type']
       }),
       this['current_item'] = null,
       Vue['nextTick'](() => {
         g['current_item'] = 'catalog',
           Vue['nextTick'](function() {
             g['$refs']['current_comp'] && (g['$refs']['current_comp']['$off']('select_item'),
               g['$refs']['current_comp']['$on']('select_item', function(h) {
                 var j = e['id'],
                   k = e['path'],
                   l = g['$root']['$selected_object'],
                   m, m, j;
                 f ? (e['id'] = h['id'],
                   l['mass_change_id_by_type'](h['id'], e['element_type']),
                   g['set_mat_groups'](l),
                   g['set_modules'](l),
                   m = l['get_toggles'](),
                   Vue['set'](g, 'toggles', copy_object(m)),
                   g['has_toggles'] = 0 < m.length) : '' + j != '' + h['id'] && (m = l[
                   'get_child_by_path'](k)) && m['change_id'](h['id']) && (e['id'] = h['id'],
                   g['set_mat_groups'](l),
                   g['set_modules'](l),
                   j = l['get_toggles'](),
                   Vue['set'](g, 'toggles', copy_object(j)),
                   g['has_toggles'] = 0 < j.length);
               }));
           });
       });
   },
   'showHelper'(f) {
     this['$root']['$selected_object']['userData']['parts_by_path']['module'][f]?.['_show_helpers']();
   },
   'hideHelper'(f) {
     this['$root']['$selected_object']['userData']['parts_by_path']['module'][f]?.['_hide_helpers']();
   },
   'select_module_type'(f) {
     this['panel_showed'] = 0,
       this['current_item'] = null,
       this['selected_module_index'] = f;
   },
   'get_module_icon'(f) {
     var g;
     return {
       'background-image': 'url(' + (pp['libs']['catalogs'][f['element_type']]?.['items'][f['id']]?.['icon'] ||
         '/common_assets/images/no_image.png') + ')'
     };
   },
   'set_butt_picker_component': function() {
     var f = 'butts';
     this['panel_showed'] = 1;
     let g = this;
     Vue['set'](this, 'current_props', {
         'method': 'single',
         'lib': 'butts.butts',
         'selected': this['$root']['$selected_object']['userData']['params']['spec']?.['defaults']?.['butt']?.['id']
       }),
       this['current_item'] = null,
       Vue['nextTick'](() => {
         g['current_item'] = 'catalog',
           Vue['nextTick'](function() {
             g['$refs']['current_comp'] && (g['$refs']['current_comp']['$off']('select_item'),
               g['$refs']['current_comp']['$on']('select_item', function(h) {
                 var j = g['$root']['$selected_object'];
                 let k = h['key'],
                   l = h['id'],
                   m = find_selected_variant(h),
                   n = _['get'](h, 'params.variants[' + m + '].thickness') || 0;
                 j['set_defaults_param']('butt.id', l, 'number'),
                   j['set_defaults_param']('butt.variant_id', m, 'number'),
                   j['walk_params_tree'](p => {
                     if ('wall' === p['type'] && p['spec']['butts'])
                       for (var q of p['spec']['butts']) {
                         var q = q['spec'] || q;
                         q['id'] = l,
                           q['key'] = k,
                           q['thickness'] = n,
                           q['variant_id'] = m;
                       }
                   }),
                   j['_rebuild_parts_by_type']('wall'),
                   Vue['set'](g['butt_props'], 'selected', parseInt(l));
               }));
           });
       });
   },
   'set_configurator_v2_params_component': function() {
     this['panel_showed'] = 1;
     let f = this;
     Vue['set'](this, 'current_props', this['configurator_params']),
       this['current_item'] = null,
       Vue['nextTick'](() => {
         f['current_item'] = 'configurator_v2_params';
       });
   },
   'change_bardesk_corner': function(e, f, g, h) {
     clearTimeout(this['debounce']);
     let j = this;
     this['debounce'] = setTimeout(function() {
       var k = j['$root']['$selected_object'],
         l = j['tabletop_props']['corners'][e],
         l = (null === f && (f = l['type']),
           null === g && (g = l['val']),
           null === h && (h = l['percent']),
           k['userData']['parts']['tabletop'][0]);
       let m = l['userData']['params']['spec']['type_params'];
       m[e]['type'] = f,
         m[e]['val'] = h ? g + '%' : g;
       var k = k['get_child_params_by_path'](l['userData']['path']);
       if (k) {
         let n = k['spec']['type_params'];
         n[e]['type'] = f,
           n[e]['val'] = h ? g + '%' : g;
       }
       l['_rebuild'](),
         sc['build_tabletop']();
     }, this['delay']);
   },
   'set_bardesk_corners_equal': function() {
     var f = this['$root']['$selected_object'],
       g = f['userData']['parts']['tabletop'][0],
       f = (g['userData']['params']['spec']['type_params']['corners_equal'] = this['tabletop_props']['corners_equal'],
         f['get_child_params_by_path'](g['userData']['path']));
     f && (f['spec']['type_params']['corners_equal'] = this['tabletop_props']['corners_equal']),
       g['_rebuild'](),
       sc['build_tabletop']();
   },
   'set_offset_y': function() {
     let e = this,
       f = this['$root']['$selected_object'];
     clearTimeout(this['debounce']),
       this['debounce'] = setTimeout(() => {
         let g = parseInt(e['offset_y']);
         Number['isFinite'](g) || (g = void 0),
           f['set_offset_y'](g),
           sc['build_tabletop']();
       }, this['delay']);
   },
   'detach_tabletop': function() {
     this['tabletop_props']['autogen'] = false;
     let f = this['$root']['$selected_object'];
     setTimeout(() => {
       sc['detach_tabletop'](f);
     }, 50);
   },
   'change_cabinet_to_top': function() {
     let f = this['$root']['$selected_object'],
       g = this['changed_to_top'];
     setTimeout(() => {
       f['change_type_to_top'](g);
     }, 50);
   },
   'set_auto_rotation': function() {
     var f;
     this['$root']['$selected_object']['userData']['params']['interaction']['auto_rotation'] = this['auto_rotation'] ?
       1 : 0;
   },
   'close_panel': function() {
     this['panel_showed'] = 0,
       this['selected'] = null,
       this['current_item'] = null;
   },
   'close_all': function() {
     this['show'] = false,
       this['close_panel']();
   },
   'set_item'(g) {
     if (g) {
       if (g['userData']['params'] && g['userData']['params']['spec']) {
         this['is_root'] = !!g['userData']['is_root'];
         var j = g['userData']['params'],
           k = g['userData']['params']['spec'],
           q = g['userData']['computed'];
         let C = {
           'x': k?.['fill_size_x'] || 0,
           'y': k?.['fill_size_y'] || 0,
           'z': k?.['fill_size_z'] || 0
         };
         var v = ['x', 'y', 'z'],
           w;
         let D = [],
           E = [];
         if (j['custom_menu']) {
           if (j['custom_menu']['size']) {
             D = copy_object(j['custom_menu']['size']);
             for (let H = 0; H < D.length; H++) {
               'button' != D[H]['type'] && D[H]['value']['startsWith']('::') && (w = D[H]['value']['replace']('::', ''),
                 D[H]['value'] = utils['nested_object']['get'](g['userData']['params'], w));
             }
           }
           j['custom_menu']?.['components']?.['size'] && (E = copy_object(j['custom_menu']['components']['size']));
         }
         Vue['set'](this, 'custom_size_items', D),
           Vue['set'](this, 'custom_size_tab_components', E),
           this['config_item'] = null,
           this['element_type'] = j['spec']['element_type'] || '',
           this['element_id'] = j['spec']['id'] || '',
           this['icon'] = '',
           this['minmax'] = g['userData']['params']['resizable']['minmax'] || null,
           this['tabs']['size'] = 1,
           this['tabs']['material'] = 1,
           this['tabs']['furni'] = 1,
           this['tabs']['modules'] = g['userData']?.['parts']?.['module'] && 0 < g['userData']?.['parts']?.['module'][
             'length'
           ],
           this['tabs']['handles'] = 1,
           this['tabs']['hierarchy'] = 1,
           this['tabs']['comments'] = 1,
           this['selected_module_index'] = null,
           this['can_change_tabletop'] = false,
           this['has_tabletop_v3'] = false,
           this['has_tabletop'] = 0 < g['userData']['parts']?.['tabletop']?.['length'],
           this['has_tabletop_plints'] = g['userData']['has_tabletop_plints'],
           this['has_toggles'] = false,
           this['has_cokol'] = 0 < g['userData']['parts']?.['cokol']?.['length'],
           this['has_cokol_top'] = 0 < g['userData']['parts']?.['cokol_top']?.['length'],
           this['has_cornice'] = 0 < g['userData']['parts']?.['cornice_placer']?.['length'];
         var x = g['userData']['parts']?.['facade'] || [],
           x, q = (this['has_facade'] = 0 < x.length,
             this['has_facade_type'] = _['some'](x, I => !I['userData']['params']['spec']['radius']),
             this['has_facade_type_radius'] = _['some'](x, I => I['userData']['params']['spec']['radius']),
             this['has_facade_type_side'] = _['some'](x, I => I['userData']['params']['spec']['side']),
             this['group'] = k['cabinet_group'],
             this['name'] = j['name'] || 'Модуль',
             this['comments'] = j['comments'] || '',
             this['auto_rotation'] = Boolean(j['interaction']['auto_rotation']),
             this['changed_to_top'] = Boolean(j['changed_to_top']),
             this['check_intersections'] = g['userData']['params']['interaction']['check_intersection'],
             this['code'] = q['code'] || '-',
             'function' == typeof g['get_code'] && (this['code'] = g['get_code']()),
             k['variants'] && !k['is_fill'] ? (this['show_variants'] = true,
               -1 == k['selected_variant'] ? this['selected_variant'] = 0 : this['selected_variant'] = k[
                 'selected_variant'],
               this['variants'] = copy_object(k['variants'])) : (this['show_variants'] = false,
               this['selected_variant'] = 0,
               this['variants'] = []),
             0 != constructor_settings['custom_sizes_available'] && j['resizable']['enabled'] ? (x = j['resizable'][
                 'locks'
               ] || {},
               this['size_locks'] = {
                 'x': x['x'] || false,
                 'y': x['y'] || false,
                 'z': x['z'] || false
               }) : this['size_locks'] = {
               'x': true,
               'y': true,
               'z': true
             },
             k['is_fill'] && v.forEach(I => {
               1 == C[I] ? this['size_locks'][I] = true : this['size_locks'][I] = false;
             }),
             g['userData']['computed']['size']),
           x = (this['size']['width'] = q['x'] || 0,
             this['size']['height'] = q['y'] || 0,
             this['size']['depth'] = q['z'] || 0,
             module_utils['create_defaults'](k['defaults'] ? copy_object(k['defaults']) : {})),
           v = parseInt(x['butt']['id']),
           v, q, y, v, q, x, z, A;
         if (this['butt_props']['selected'] = parseInt(v),
           this['has_cokol'] && (this['cokol_props']['selected'] = parseInt(x['cokol']['id']),
             this['cokol_props']['is_empty'] = is_empty_id(x['cokol']['id'])),
           this['has_cokol_top'] && (this['cokol_top_props']['selected'] = parseInt(x['cokol_top']['id']),
             this['cokol_top_props']['is_empty'] = is_empty_id(x['cokol_top']['id'])),
           this['has_facade']) {
           this['facade_materials'] = x['facade']['materials'] ? copy_object(x['facade']['materials']) : {};
           for (var B of Object['keys'](this['facade_materials']))
             this['facade_materials'][B] = parseInt(this['facade_materials'][B]);
           this['facade_materials']?.['glass'] && delete this['facade_materials']['glass'];
           var q = parseInt(x['facade']['id']);
           this['facade_props']['selected'] = q,
             this['facade_props']['is_empty'] = is_empty_id(q);
           let I = pp['libs']['facades']['get_item'](q);
           this['facade_material_props']['categories'] = I['materials'],
             this['facade_type_props']['facade'] = q,
             this['facade_type_props']['radius'] = 0,
             this['facade_type_props']['selected'] = x['facade']['type'],
             this['facade_type_props']['item'] = copy_object(module_utils['get_facade_type'](q, x['facade']['type']) ||
             {}),
             this['facade_type_props']['all'] = 1,
             this['facade_type_props']['name'] = this['get_facade_type_name'](this['facade_type_props']['item']),
             this['facade_type_radius_props']['facade'] = q,
             this['facade_type_radius_props']['radius'] = 1,
             this['facade_type_radius_props']['selected'] = x['facade']['type_radius'],
             this['facade_type_radius_props']['item'] = copy_object(module_utils['get_facade_type'](q, x['facade'][
               'type_radius'
             ]) || {}),
             this['facade_type_radius_props']['all'] = 1,
             this['facade_type_radius_props']['name'] = this['get_facade_type_name'](this['facade_type_radius_props'][
               'item'
             ]),
             this['facade_type_side_props']['facade'] = q,
             this['facade_type_side_props']['radius'] = 0,
             this['facade_type_side_props']['filter'] = J => J['side'],
             this['facade_type_side_props']['selected'] = x['facade']['type_side'],
             this['facade_type_side_props']['item'] = copy_object(module_utils['get_facade_type'](q, x['facade'][
               'type_side'
             ]) || {}),
             this['facade_type_side_props']['all'] = 1,
             this['facade_type_side_props']['name'] = this['get_facade_type_name'](this['facade_type_side_props'][
               'item']);
         }
         this['has_cornice'] && (this['cornice_props']['selected'] = parseInt(x['cornice']['id']),
             this['cornice_props']['is_empty'] = is_empty_id(x['cornice']['id'])),
           this['has_tabletop'] && (constructor_settings['tabletop_v2'] || (this['tabletop_props']['lib'] =
             'materials'),
             this['can_change_tabletop'] = _['some'](g['userData']['parts']['tabletop'],
               'userData.params.spec.can_change.id'),
             this['tabletop_props']['categories'] = null,
             v = parseInt(x['tabletop']['id']),
             q = parseInt(x['tabletop']['variant_id']),
             this['tabletop_props']['selected'] = parseInt(v),
             this['tabletop_props']['thickness_val'] = get_tabletop_thickness(v, q),
             this['tabletop_props']['autogen'] = x['tabletop']['autogen'],
             this['tabletop_props']['selected_plint'] = parseInt(x['tabletop']['plints']['material']),
             this['tabletop_props']['plint_enabled'] = x['tabletop']['plints']['enabled'],
             g['is_detached_tabletop']?.()) && (v = g['userData']['parts']['tabletop'][0]['userData']['params'][
               'spec']['type_params'],
             this['has_tabletop_v3'] = true,
             this['offset_y'] = j['interaction']['offset_y'],
             this['tabletop_props']['corners'] = v ? copy_object(v) : void 0,
             this['tabletop_props']['corners_equal'] = v['corners_equal'],
             this['tabletop_props']['corners']) && ((q = J => {
               J['percent'] = false;
               let K = J['val'];
               'string' == typeof K && (K['endsWith']('%') ? (K = parseFloat(K['slice'](0, -1)),
                   J['percent'] = true) : K = parseFloat(K)),
                 J['val'] = Number['isFinite'](K) ? K : 0;
             })(this['tabletop_props']['corners']['c1']),
             q(this['tabletop_props']['corners']['c2']),
             q(this['tabletop_props']['corners']['c3']),
             q(this['tabletop_props']['corners']['c4']));
         let F = pp['libs']['catalogs'][k['element_type']];
         if (F && F['items'][j['id']]) {
           let J = pp['libs']['catalogs'][k['element_type']];
           this['icon'] = J['items'][j['id']]['icon'];
         }
         this['icon'] || (this['icon'] = '/common_assets/images/no_image.png'),
           Vue['set'](this, 'variables', g['get_variables']()),
           g['userData']['toggles_by_path'] ? (x = g['get_toggles'](),
             Vue['set'](this, 'toggles', copy_object(x)),
             this['has_toggles'] = 0 < x.length) : Vue['set'](this, 'toggles', []),
           this['set_mat_groups'](g),
           this['set_model_materials'](g);
         let G = false;
         for (A of this['set_modules'](g) || [])
           if (A['modules']['length']) {
             G = true;
             break;
           }
         this['tabs']['modules'] = G,
           this['update_price'](),
           'function' == typeof set_module_menu_item_callback && set_module_menu_item_callback(g, this),
           this['check_tabs'](),
           this['$root']['$emit']('item_is_set', g);
       } else
         this['show'] = false;
     } else
       this['show'] = false;
   },
   'get_root'(f = null) {
     var f;
     this['is_root'] || (f = (f || this['$root']['$selected_object'])['userData']['root'],
       this['is_root'] = true,
       fill_edit_mode(),
       sc['select_object'](f),
       dControls['s_helper']['make'](f),
       f['show_radial_menu']());
   }
 }
 });
 }
 }),
 interface_components_init.push(function() {
     Vue['component']('module_options', {
       'template': '#module_options_template',
       'props': {
         'variables': {
           'type': Object,
           'default': function() {
             return {};
           }
         },
         'path': {
           'type': String,
           'default': ''
         }
       },
       'data': function() {
         return {
           'vars': {},
           'delay': 'undefined' == typeof input_delay ? 500 : input_delay,
           'debounce': null
         };
       },
       'created': function() {
         this['cr']();
       },
       'mounted': function() {},
       'methods': {
         'cr': function() {
           var f = this['$root']['$selected_object'],
             g = (this['$options']['sel_obj'] = f,
               this['$options']['module_part'] = f['get_child_by_path'](this['path']),
               this['$options']['module_params'] = f['get_child_params_by_path'](this['path']), {});
           if (pp['variables']['global_vars'] && pp['variables']['global_vars'][0]) {
             for (var h of pp['variables']['global_vars'][0]['vars'])
               g[h['key']] || (g[h['key']] = h);
           }
           this['$options']['global_vars_hash'] = g,
             this['vars'] = this['variables'] ? copy_object(this['variables']) : {};
         },
         'change_select'(f, g) {
           this['do_change'](f, g);
         },
         'change_number'(f, g) {
           clearTimeout(this['debounce']),
             this['debounce'] = setTimeout(() => {
               this['do_change'](f, g);
             }, this['delay']);
         },
         'change_fixed'(f, g) {
           f['fixed'] = to_int(!f['fixed']),
             this['change_select'](f, g);
         },
         'change_global_select'(f, g) {
           this['do_change'](f, g, true);
         },
         'change_global_number'(f, g) {
           clearTimeout(this['debounce']),
             this['debounce'] = setTimeout(() => {
               this['do_change'](f, g, true);
             }, this['delay']);
         },
         'change_global_fixed'(f, g) {
           f['fixed'] = to_int(!f['fixed']),
             this['change_global_select'](f, g);
         },
         'reset_global_variable': function(f) {
           var g = _.findIndex(this['vars']['global'], h => h['key'] === f);
           g < 0 || (this['vars']['global'][g]['value'] = null,
             this['do_change'](this['vars']['global'][g], g, true));
         },
         'do_change'(f, g, h) {
           var g = {
             'is_template': void 0 !== g && !h,
             'is_global': void 0 !== g && h,
             'variable': copy_object(f)
           };
           this['$emit']('change_variable', g);
         },
         'get_select_options'(f, g) {
           var g = (g ? this['$options']['global_vars_hash'][f['key']] : f)['params']['options'];
           return f['disabled_values']?.['length'] ? _.filter(g, h => {
             var i;
             return _.findIndex(f['disabled_values'], j => '' + j == '' + h['value']) < 0;
           }) : g || [];
         }
       }
     });
   }),
   interface_components_init.push(function() {
     Vue['component']('module_picker', {
         'template': '#module_picker_template',
         'props': ['categories', 'heading', 'cid', 'fn', 'catalog'],
         'mixins': [mixin],
         'data': function() {
           return {
             'mode': 'c',
             'expanded': false,
             'top_depth': pp['interface']['root']['$custom_top_depth_value'],
             'top_apply_by_default': pp['interface']['root']['$custom_top_depth'],
             'bottom_depth': pp['interface']['root']['$custom_bottom_depth_value'],
             'bottom_apply_by_default': pp['interface']['root']['$custom_bottom_depth'],
             'top_height': pp['interface']['root']['$custom_top_height_value'],
             'top_apply_height_by_default': pp['interface']['root']['$custom_top_height'],
             'bottom_height': pp['interface']['root']['$custom_bottom_height_value'],
             'bottom_apply_height_by_default': pp['interface']['root']['$custom_bottom_height']
           };
         },
         'methods': {
           'reset': function() {},
           'expand_panel': function() {
             this['expanded'] = !this['expanded'],
               this['$root']['$emit']('expand_panel', this['expanded']);
           },
           'mouse_down': function(e) {
             var f, f, f;
             sc['unset_mouse_mode'](),
               'function' == typeof before_mousedown_catalog && !before_mousedown_catalog(e) || (
                 constructor_settings['core_v2'] && e['params']?.['spec'] ? ((f = copy_object(e['params']))[
                     'size'] && delete f['size'],
                   sc['add_object']('module', f)) : e['params']['spec'] ? ((f = copy_object(e['params']))[
                     'is_default'] = true,
                   f['id'] = e['id'],
                   this['$root']['$refs']['interface']['classList']['add']('tmp_dis'),
                   sc['add_object']('cabinet_cn', f)) : (this['$root']['$refs']['interface']['classList']['add'](
                     'tmp_dis'),
                   (f = mod_lib['get_item'](e['id'])['params'])['id'] = e['id'],
                   pp['interface']['root']['$custom_top_depth'] && (f['cabinet'] && 'top' == f['cabinet_group'] &&
                     (f['cabinet']['depth'] = pp['interface']['root']['$custom_top_depth_value']),
                     f['variants']) && 'top' == f['cabinet_group'] && f['variants']['forEach'](function(g) {
                     g['depth'] = pp['interface']['root']['$custom_top_depth_value'];
                   }),
                   pp['interface']['root']['$custom_bottom_depth'] && (f['cabinet'] && 'bottom' == f[
                       'cabinet_group'] && (f['cabinet']['depth'] = pp['interface']['root'][
                       '$custom_bottom_depth_value'
                     ]),
                     f['variants']) && 'bottom' == f['cabinet_group'] && f['variants']['forEach'](function(g) {
                     g['depth'] = pp['interface']['root']['$custom_bottom_depth_value'];
                   }),
                   pp['interface']['root']['$custom_top_height'] && (f['cabinet'] && 'top' == f[
                     'cabinet_group'] && (f['cabinet']['height'] = pp['interface']['root'][
                       '$custom_top_height_value'
                     ]),
                     f['variants']) && 'top' == f['cabinet_group'] && f['variants']['forEach'](function(g) {
                     g['height'] = pp['interface']['root']['$custom_top_height_value'];
                   }),
                   pp['interface']['root']['$custom_bottom_height'] && (f['cabinet'] && 'bottom' == f[
                       'cabinet_group'] && (f['cabinet']['height'] = pp['interface']['root'][
                       '$custom_bottom_height_value'
                     ]),
                     f['variants']) && 'bottom' == f['cabinet_group'] && f['variants']['forEach'](function(g) {
                     g['height'] = pp['interface']['root']['$custom_bottom_height_value'];
                   }),
                   constructor_settings['core_v2'] && -1 < location['href']['indexOf']('cab_to_module') ? (f[
                       'size'] && delete f['size'],
                     sc['add_object']('module', f)) : sc['add_object']('cabinet', f)));
           },
           'handle_cl': function(e) {},
           'handle_md': function(e) {
             this['mouse_down'](e);
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
           'change_top_height': function() {
             pp['interface']['root']['$custom_top_height_value'] = parseInt(this['top_height']);
           },
           'change_bottom_height': function() {
             pp['interface']['root']['$custom_bottom_height_value'] = parseInt(this['bottom_height']);
           },
           'change_apply_height_by_default_top': function() {
             pp['interface']['root']['$custom_top_height'] = this['top_apply_height_by_default'];
           },
           'change_apply_height_by_default_bottom': function() {
             pp['interface']['root']['$custom_bottom_height'] = this['bottom_apply_height_by_default'];
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
       Vue['component']('module_picker_v2', {
         'template': '#module_picker_v2_template',
         'props': ['categories', 'heading', 'cid', 'fn', 'lib_key', 'hide_variants'],
         'mixins': [mixin],
         'data': function() {
           return {
             'mode': 'r',
             'lib': '',
             'expanded': false
           };
         },
         'created': function() {
           Array.isArray(this['categories']) ? (this['filtered_key'] = Array.from(new Set(this['categories']
                 ['map'](e => {
                   var f;
                   return String(e)['replace'](/_\d+$/, '');
                 }))),
               this['$options']['catalogs_keys'] = pp['libs']['catalogs_info']['keys']['filter'](e => this[
                 'filtered_key']['includes'](e['key']))) : this['$options']['catalogs_keys'] = pp['libs'][
               'catalogs_info'
             ]['keys'],
             this['lib_key'] && this['cid'] && (this['lib'] = this['lib_key']),
             this['cid'] && this['set_catalog_mode'](),
             (Array.isArray(this['categories']) && 1 == this['categories']['length'] || 1 == this[
               '$options']['catalogs_keys']['length']) && this['set_catalog_mode']();
         },
         'methods': {
           'expand_panel': function() {
             this['expanded'] = !this['expanded'],
               this['$root']['$emit']('expand_panel', this['expanded']);
           },
           'select_catalog': function(e) {
             e && (this['lib'] = 'catalogs.' + e,
               this['mode'] = 'c');
           },
           'set_catalog_mode': function() {
             !this['lib'] && this['$options']['catalogs_keys']['length'] && (this['lib'] = 'catalogs.' + this[
                 '$options']['catalogs_keys'][0]['key']),
               this['cid']?.['includes']('_') ? (this['lib'] = this['cid']['replace'](/_\d+$/, ''),
                 this['lib'] = 'catalogs.' + this['lib']) : this['cid'] && /[a-zA-Z]/ ['test'](this['cid']) && (
                 this['lib'] = 'catalogs.' + this['cid']),
               this['mode'] = 'c';
           },
           'mouse_down': function(f) {
             var g, h;
             sc['unset_mouse_mode'](),
               'function' == typeof before_mousedown_catalog && !before_mousedown_catalog(f) || (this['$root'][
                   '$refs'
                 ]['interface']['classList']['add']('tmp_dis'),
                 (h = (g = _['get'](pp['libs'], this['lib'])['get_item'](f['id']))['params'])['id'] = f['id'],
                 h['spec']['id'] = f['id'],
                 h['lib'] = this['lib'],
                 h['category'] = g['category'],
                 h['size'] && delete h['size'],
                 sc['add_object']('module', h));
           }
         }
       });
   }),
   interface_components_init.push(function() {
     Vue['component']('module_type_picker', {
       'template': '#module_type_picker_template',
       'props': {
         'method': {
           'type': String,
           'default': 'global'
         },
         'mode': {
           'type': String,
           'default': 'p'
         },
         'types': {
           'type': Array,
           'default': function() {
             return [];
           }
         }
       },
       'mixins': [mixin],
       'data': function() {
         return {
           'expanded': false,
           'l_mode': 'p',
           'l_types': [],
           'l_lib': '',
           'l_selected': '',
           'l_type': ''
         };
       },
       'created': function() {
         this['init']();
       },
       'methods': {
         'init'() {
           let f = _['keyBy'](pp['libs']['catalogs_info']?.['keys'], 'key'),
             g = this['types']?.['length'] ? copy_object(this['types']) : [],
             h = (g.length || (g = project_settings['kitchen']['defaults']['module_types_available'])?.[
                 'length'
               ] || (g = _.map(pp['libs']['catalogs_info']?.['keys'], i => i['key'])),
               project_settings['kitchen']['defaults']['module_types'] || (project_settings['kitchen']['defaults']
                 ['module_types'] = {}),
               project_settings['kitchen']['defaults']['module_types']);
           g = _.map(g, j => {
               var k = h[j] || 0,
                 m;
               let p = 'Не\x20выбран',
                 q = null;
               return is_empty_id(k) || (m = is_empty_id(k) ? null : pp['libs']['catalogs'][j]?.['items'][k],
                 p = m ? m['params']?.['name'] : 'Не\x20найден',
                 q = m ? m['params']?.['icon'] || m['icon'] : null), {
                 'type': j,
                 'name': f[j]?.['name'] || j || '',
                 'module_id': k,
                 'module_name': p || '',
                 'module_icon': q || ''
               };
             }),
             this['l_types'] = g,
             this['l_lib'] = '',
             this['l_type'] = '',
             this['l_selected'] = '',
             this['l_mode'] = this['mode'],
             'global' != this['method'] && 'single' == this['method'] && (this['l_mode'] = 'c');
         },
         'get_module_icon'(f) {
           var g;
           return {
             'background-image': 'url(' + (f['module_icon'] || '/common_assets/images/no_image.png') + ')'
           };
         },
         'select_type'(f) {
           this['l_lib'] = 'catalogs.' + f['type'],
             this['l_type'] = f['type'],
             this['l_selected'] = f['module_id'],
             this['l_mode'] = 'c';
         },
         'select_item'(f) {
           var g = _.findIndex(this['l_types'], k => k['type'] === this['l_type']),
             g = this['l_types'][g];
           if ('global' == this['method']) {
             project_settings['kitchen']['defaults']['module_types'] || (project_settings['kitchen']['defaults'][
               'module_types'
             ] = {});
             var f = is_empty_id(f['id']) ? 0 : parseInt(f['id']),
               h, j;
             project_settings['kitchen']['defaults']['module_types'][g['type']] = f;
             let k = 'Не\x20выбран',
               m = null;
             is_empty_id(f) || (j = is_empty_id(f) ? null : pp['libs']['catalogs'][g['type']]?.['items'][f],
                 k = j ? j['params']?.['name'] : 'Не\x20найден',
                 m = j ? j['params']?.['icon'] || j['icon'] : null),
               g['module_id'] = f,
               g['module_name'] = k || '',
               g['module_icon'] = m || '',
               void sc['mass_change_module_id'](g['type'], f);
           } else
             this['method'];
         }
       }
     });
   }),
   interface_components_init.push(function() {
     Vue['component']('object_hierarchy', {
       'template': '#object_hierarchy_template',
       'props': {
         'open': {
           'type': Boolean,
           'default': true
         },
         'content': {
           'type': Object,
           'default': () => ({})
         }
       },
       'data': function() {
         return {
           'isOpened': this['open']
         };
       },
       'computed': {
         'hasChildren'() {
           return Boolean(this['content']['items'] && 0 < this['content']['items']['length']);
         }
       },
       'methods': {
         'toggleDetails'(f) {
           this['isOpened'] = 'open' === f['newState'];
         },
         'itemClick'() {
           this['$root']['$refs']['module_menu']['hierarchy_item_click'](this['content']);
         },
         'paramsClick'() {
           this['$root']['$refs']['module_menu']['hierarchy_params_click'](this['content']);
         }
       }
     });
   }),
   interface_components_init.push(function() {
     Vue['component']('radial_menu', {
       'template': '#radial_menu_template',
       'props': {},
       'mixins': [mixin],
       'data': function() {
         return {
           'is_radial': true,
           'show': false,
           'left': 0,
           'top': 0,
           'rotating': false,
           'rotate_free': false,
           'rotate': true,
           'move_lock': true,
           'copypaste': true,
           'settings': true,
           'ungroup': false,
           'materials': false,
           'erase': false,
           'open_doors': false,
           'open_lockers': false,
           'can_change_opens': false,
           'movement_locked': false,
           'rotation_locked': false,
           'fill_locked': false,
           'fill_enabled': true,
           'flip_button': false,
           'can_lock_rotation': true,
           'can_delete': true
         };
       },
       'created': function() {
         custom_settings['context_menu_is_list'] && (this['$options']['is_list'] = true),
           custom_settings['new_drag'] && (this['rotate_free'] = true);
         let e = this;
         this['$root']['$on']('show_rad_menu', function(f) {
             e['show'] = false,
               e['show'] = true,
               e['left'] = f['left'],
               e['top'] = f['top'],
               this['$options']['is_inside'] = f['fill_mode'],
               Vue['nextTick'](function() {
                 e['set_position'](f);
               });
           }),
           this['$root']['$on']('hide_rad_menu', function(f) {
             e['show'] = false;
           });
       },
       'mounted': function() {
         this['$refs']['body']['addEventListener']('contextmenu', function(e) {
           e['preventDefault']();
         });
       },
       'watch': {},
       'methods': {
         'toggle_resize': function() {
           this['$root']['$selected_object']['toggleResizeMode']();
         },
         'change_orientation': function() {
           var e;
           this['$root']['$selected_object']['change_orientation']();
         },
         'set_position': function(e) {
           this['$refs']['body']['style']['top'] = 'auto',
             this['$refs']['body']['style']['bottom'] = 'auto',
             this['$refs']['body']['style']['left'] = 'auto',
             this['$refs']['body']['style']['right'] = 'auto',
             this['$refs']['body']['style']['left'] = this['left'] + 'px',
             this['$refs']['body']['style']['top'] = this['top'] + 'px',
             false !== e['obj']['settings'] && (e['obj']['settings'] = true),
             void 0 === e['obj']['can_delete'] && (e['obj']['can_delete'] = true),
             void 0 === e['obj']['can_lock_rotation'] && (e['obj']['can_lock_rotation'] = true),
             false !== e['obj']['move_lock'] && (e['obj']['move_lock'] = true),
             false !== e['obj']['copypaste'] && (e['obj']['copypaste'] = true),
             false !== e['obj']['rotate'] && (e['obj']['rotate'] = true),
             true !== e['obj']['open_lockers'] && (e['obj']['open_lockers'] = false),
             e['obj']['ungroup'] || (e['obj']['ungroup'] = false);
           var f = isOutOfViewport(this['$refs']['body']),
             f = (f['bottom'] && (this['$refs']['body']['style']['top'] = 'auto',
                 this['$refs']['body']['style']['bottom'] = '20px'),
               f['right'] && (this['$refs']['body']['style']['left'] = 'auto',
                 this['$refs']['body']['style']['right'] = '20px'),
               this['open_doors'] = e['obj']['open_doors'],
               false === e['obj']['rotate'] && (this['rotate'] = false),
               this['flip_button'] = e['obj']['flip_button'],
               this['erase'] = e['obj']['erase'],
               this['ungroup'] = e['obj']['ungroup'],
               this['settings'] = e['obj']['settings'],
               this['move_lock'] = e['obj']['move_lock'],
               this['copypaste'] = e['obj']['copypaste'],
               this['rotate'] = e['obj']['rotate'],
               this['can_lock_rotation'] = e['obj']['can_lock_rotation'],
               this['open_lockers'] = e['obj']['open_lockers'],
               this['can_delete'] = e['obj']['can_delete'],
               this['materials'] = !!e['obj']['material'],
               this['can_change_opens'] = e['obj']['open_type'],
               this['$root']['$selected_object']);
           this['movement_locked'] = false,
             f['userData']['interaction'] && (this['movement_locked'] = 1 == f['userData']['interaction'][
               'movement_locked'
             ]),
             this['rotation_locked'] = false,
             f['params'] && f['params']['hasOwnProperty']('auto_rotation') && (this['rotation_locked'] = !f[
               'params']['auto_rotation']),
             this['fill_enabled'] = 'function' == typeof f['check_fill_enabled'] && f['check_fill_enabled'](),
             this['fill_enabled'] && (this['fill_locked'] = f['get_fill_locked']());
         },
         'delete_object': function() {
           var e = this['$root']['$selected_object'];
           constructor_settings['core_v2'] && 'Washer' === e['type'] ? (sc['remove_object'](e),
             this['show'] = false,
             sc['need_update_tabletops']()) : (sc['remove_object'](e),
             this['show'] = false);
         },
         'rotate_left': function() {
           var e;
           this['movement_locked'] || this['$root']['$selected_object']['rotate_left']();
         },
         'rotate_right': function() {
           var e;
           this['movement_locked'] || this['$root']['$selected_object']['rotate_right']();
         },
         'rotate_down': function(e) {
           custom_settings['new_drag'] && (dControls['mode'] = 'r',
             dControls['r_el'] = this['$refs']['rotate_down'],
             dControls['r_el']['style']['pointerEvents'] = 'none',
             dControls['rot']['rY'] = this['$root']['$selected_object']['rotation']['y'],
             dControls['rot']['par'] = this['$refs']['body'],
             dControls['rot']['cX'] = this['left'],
             dControls['rot']['cY'] = this['top'],
             this['rotating'] = true,
             dControls['set_selected'](this['$root']['$selected_object']));
         },
         'do_open': function(e = 0) {
           var f;
           this['$root']['$selected_object']['open_all'](e);
         },
         'copy': function() {
           dControls['clear_selected'](),
             this['$root']['$selected_object']['copypaste'](),
             this['show'] = false;
         },
         'change_opens': function() {
           this['$root']['$selected_object']['change_opens']();
         },
         'lock_movement': function() {
           this['movement_locked'] = !this['movement_locked'],
             this['$root']['$selected_object']['userData']['interaction']['movement_locked'] = to_int(this[
               'movement_locked']);
         },
         'lock_rotation': function() {
           this['rotation_locked'] = !this['rotation_locked'];
           var e = this['$root']['$selected_object'];
           e['params'] && e['params']['hasOwnProperty']('auto_rotation') && (this['$root']['$refs'][
               'module_menu'
             ] && (this['$root']['$refs']['module_menu']['auto_rotation'] = !this['rotation_locked']),
             e['params']['auto_rotation'] = this['rotation_locked'] ? 0 : 1);
         },
         'lock_fill': function() {
           this['fill_locked'] = !this['fill_locked'],
             this['$root']['$selected_object']['lock_fill'](to_int(this['fill_locked']));
         },
         'panel_settings': function() {
           this['$root']['$emit']('show_object_panel', 'settings'),
             this['$root']['$emit']('hide_interactive_menu', ''),
             this['show'] = false;
         },
         'panel_materials': function() {
           this['$root']['$emit']('show_object_panel', 'materials'),
             this['show'] = false;
         },
         'erase_mode': function() {
           'erase' == global_options['mouse_mode']['target'] ? this['$root']['unset_erase_mode']() : this[
               '$root']['set_erase_mode'](),
             1 < interface_version && pp['interface']['root']['radial_hide']();
         },
         'act_ungroup': function() {
           this['$root']['$selected_object']['ungroup'](),
             this['show'] = false;
         }
       }
     });
   }),
   interface_components_init.push(function() {
     Vue['component']('radial_menu_v2', {
       'template': '#radial_menu_template_v2',
       'props': {},
       'mixins': [mixin],
       'data': function() {
         return {
           'menu_mode': 0,
           'show': false,
           'left': 0,
           'top': 0,
           'rotating': false,
           'is_list': false,
           'rotate_free': false,
           'rotate': true,
           'move_lock': true,
           'copypaste': true,
           'settings': true,
           'ungroup': false,
           'materials': false,
           'erase': false,
           'open_doors': false,
           'open_lockers': false,
           'can_change_opens': false,
           'movement_locked': false,
           'resize': false,
           'rotation_locked': false,
           'fill_locked': false,
           'fill_enabled': true,
           'flip_button': false,
           'can_lock_rotation': true,
           'can_delete': true,
           'body': null,
           'is_root': true,
           'name': ''
         };
       },
       'created': function() {
         custom_settings['new_drag'] && (this['rotate_free'] = true),
           constructor_settings['menu_mode'] && (this['menu_mode'] = parseFloat(constructor_settings[
             'menu_mode']));
         let e = this;
         this['$root']['$on']('show_rad_menu', function(f) {
             e['show'] = false,
               e['show'] = true,
               e['left'] = f['left'],
               e['top'] = f['top'] + 70,
               this['$options']['is_inside'] = f['fill_mode'],
               Vue['nextTick'](function() {
                 e['set_position'](f);
               });
           }),
           this['$root']['$on']('hide_rad_menu', function(f) {
             e['show'] = false;
           });
       },
       'mounted': function() {
         switch (this['menu_mode']) {
           case 1:
             this['body'] = this['$refs']['list_menu'];
             break;
           case 2:
             this['body'] = this['$refs']['bottom_menu'];
             break;
           default:
             this['body'] = this['$refs']['body'];
             break;
         }
         this['body']['addEventListener']('contextmenu', function(e) {
             e['preventDefault']();
           }),
           document['addEventListener']('click', this['handle_click_outside']);
       },
       'beforeUnmount'() {
         document['removeEventListener']('click', this['handle_click_outside']);
       },
       'watch': {},
       'methods': {
         'toggle_resize': function() {
           this['$root']['$selected_object']['toggleResizeMode']();
         },
         'change_orientation': function() {
           var e;
           this['$root']['$selected_object']['change_orientation']();
         },
         'set_position': function(e) {
           2 !== this['menu_mode'] && (this['body']['style']['top'] = 'auto',
               this['body']['style']['bottom'] = 'auto',
               this['body']['style']['left'] = 'auto',
               this['body']['style']['right'] = 'auto',
               this['body']['style']['left'] = this['left'] + 'px',
               this['body']['style']['top'] = this['top'] + 'px'),
             false !== e['obj']['settings'] && (e['obj']['settings'] = true),
             void 0 === e['obj']['can_delete'] && (e['obj']['can_delete'] = true),
             void 0 === e['obj']['can_lock_rotation'] && (e['obj']['can_lock_rotation'] = true),
             false !== e['obj']['move_lock'] && (e['obj']['move_lock'] = true),
             false !== e['obj']['copypaste'] && (e['obj']['copypaste'] = true),
             false !== e['obj']['rotate'] && (e['obj']['rotate'] = true),
             false !== e['obj']['resize'] && (e['obj']['resize'] = true),
             true !== e['obj']['open_lockers'] && (e['obj']['open_lockers'] = false),
             e['obj']['ungroup'] || (e['obj']['ungroup'] = false);
           var f = isOutOfViewport(this['body']),
             f = (f['bottom'] && (this['body']['style']['top'] = 'auto',
                 this['body']['style']['bottom'] = '20px'),
               f['right'] && (this['body']['style']['left'] = 'auto',
                 this['body']['style']['right'] = '20px'),
               this['open_doors'] = e['obj']['open_doors'],
               false === e['obj']['rotate'] && (this['rotate'] = false),
               this['flip_button'] = e['obj']['flip_button'],
               this['erase'] = e['obj']['erase'],
               this['ungroup'] = e['obj']['ungroup'],
               this['settings'] = e['obj']['settings'],
               this['move_lock'] = e['obj']['move_lock'],
               this['copypaste'] = e['obj']['copypaste'],
               this['rotate'] = e['obj']['rotate'],
               this['can_lock_rotation'] = e['obj']['can_lock_rotation'],
               this['open_lockers'] = e['obj']['open_lockers'],
               this['can_delete'] = e['obj']['can_delete'],
               this['resize'] = e['obj']['resize'],
               this['materials'] = !!e['obj']['material'],
               this['can_change_opens'] = e['obj']['open_type'],
               this['$root']['$selected_object']);
           f && (this['movement_locked'] = false,
             f['userData']['interaction'] && (this['movement_locked'] = 1 == f['userData']['interaction'][
               'movement_locked'
             ]),
             this['rotation_locked'] = false,
             constructor_settings['core_v2'] && f['userData'] && f['userData']?.['params']?.['interaction'][
               'hasOwnProperty'
             ]('auto_rotation') ? this['rotation_locked'] = !f['userData']['params']['interaction'][
               'auto_rotation'
             ] : f['params'] && f['params']['hasOwnProperty']('auto_rotation') && (this['rotation_locked'] = !
               f['params']['auto_rotation']),
             this['fill_enabled'] = 'function' == typeof f['check_fill_enabled'] && f['check_fill_enabled'](),
             this['fill_enabled'] && (this['fill_locked'] = f['get_fill_locked']()),
             constructor_settings['core_v2'] && f instanceof Module && !f?.['userData']?.['is_root'] ? this[
               'is_root'] = false : this['is_root'] = true,
             f['name']) && (this['name'] = f['name']);
         },
         'delete_object': function() {
           var f = this['$root']['$selected_object'],
             g;
           if ('function' == typeof pp['events']['interaction']['on_module_delete'] && false === pp['events'][
               'interaction'
             ]['on_module_delete'](f))
             return void(this['show'] = false);
           let h = 0;
           for (let i = cart['accessories']['length']; i--;)
             cart['accessories'][i]['obj_id'] === f['userData']['params']['obj_id'] ? cart['accessories'][
               'splice'
             ](i, 1) : h += cart['accessories'][i]['count'];
           for (let j = cart['custom_items']['length']; j--;)
             h += cart['custom_items'][j]['count'];
           cart['count'] = h,
             this['$root']['$emit']('cart_update', h),
             constructor_settings['core_v2'] && 'Washer' === f['type'] ? (sc['remove_object'](f),
               this['show'] = false,
               sc['need_update_tabletops']()) : (sc['remove_object'](f),
               this['show'] = false,
               this['is_root'] || this['get_root'](f));
         },
         'rotate_left': function() {
           var e;
           this['movement_locked'] || this['$root']['$selected_object']['rotate_left']();
         },
         'rotate_right': function() {
           var e;
           this['movement_locked'] || this['$root']['$selected_object']['rotate_right']();
         },
         'rotate_down': function(e) {
           custom_settings['new_drag'] && (dControls['mode'] = 'r',
             dControls['r_el'] = this['$refs']['rotate_down'],
             dControls['r_el']['style']['pointerEvents'] = 'none',
             dControls['rot']['rY'] = this['$root']['$selected_object']['rotation']['y'],
             dControls['rot']['par'] = this['body'],
             dControls['rot']['cX'] = this['left'],
             dControls['rot']['cY'] = this['top'],
             this['rotating'] = true,
             dControls['set_selected'](this['$root']['$selected_object']));
         },
         'do_open': function(e = 0) {
           var f;
           this['$root']['$selected_object']['open_all'](e);
         },
         'copy': function() {
           dControls['clear_selected'](),
             this['$root']['$selected_object']['copypaste'](),
             this['show'] = false;
         },
         'change_opens': function() {
           this['$root']['$selected_object']['change_opens']();
         },
         'lock_movement': function() {
           this['movement_locked'] = !this['movement_locked'],
             this['$root']['$selected_object']['userData']['interaction']['movement_locked'] = to_int(this[
               'movement_locked']);
         },
         'lock_rotation': function() {
           this['rotation_locked'] = !this['rotation_locked'];
           var e = this['$root']['$selected_object'];
           constructor_settings['core_v2'] && !e['userData']['params']['interaction'] || !e['userData'][
             'params']['interaction']['hasOwnProperty']('auto_rotation') || (this['$root']['$refs'][
               'module_menu'
             ] && (this['$root']['$refs']['module_menu']['auto_rotation'] = !this['rotation_locked']),
             constructor_settings['core_v2'] ? e['userData']['params']['interaction']['auto_rotation'] = this[
               'rotation_locked'] ? 0 : 1 : e['params']['auto_rotation'] = this['rotation_locked'] ? 0 :
             1);
         },
         'lock_fill': function() {
           this['fill_locked'] = !this['fill_locked'],
             this['$root']['$selected_object']['lock_fill'](to_int(this['fill_locked']));
         },
         'panel_settings': function() {
           this['$root']['$emit']('show_object_panel', 'settings'),
             this['$root']['$emit']('hide_interactive_menu', ''),
             2 !== this['menu_mode'] && (this['show'] = false);
         },
         'panel_materials': function() {
           this['$root']['$emit']('show_object_panel', 'materials'),
             2 !== this['menu_mode'] && (this['show'] = false);
         },
         'erase_mode': function() {
           'erase' == global_options['mouse_mode']['target'] ? this['$root']['unset_erase_mode']() : this[
               '$root']['set_erase_mode'](),
             1 < interface_version && pp['interface']['root']['radial_hide']();
         },
         'act_ungroup': function() {
           this['$root']['$selected_object']['ungroup'](),
             2 !== this['menu_mode'] && (this['show'] = false);
         },
         'handle_click_outside'(e) {
           var f;
           this['body']['contains'](e['target']) || this['hide_options_list']();
         },
         'show_options_list'() {
           this['is_list'] = !this['is_list'],
             this['$nextTick'](() => {
               var f, g, f, h, i;
               2 == this['menu_mode'] && this['is_list'] && (f = this['$refs']['options_button'],
                 g = this['$refs']['bottom_list'],
                 f) && g && (f = f['getBoundingClientRect'](),
                 h = g['offsetWidth'],
                 i = g['offsetHeight'],
                 g['style']['top'] = f['top'] - i + 'px',
                 g['style']['left'] = f['left'] + f['width'] + 'px');
             });
         },
         'hide_options_list'() {
           this['is_list'] = false;
         },
         'get_root'(e = null) {
           var e;
           this['is_root'] || (e = (e || this['$root']['$selected_object'])['userData']['root'],
             this['is_root'] = true,
             fill_edit_mode(),
             sc['select_object'](e),
             dControls['s_helper']['make'](e),
             e['show_radial_menu']());
         },
         'sign_out'() {
           this['show'] = false,
             this['is_root'] = false,
             dControls['clear_selected'](),
             fill_edit_mode();
         }
       }
     });
   }),
   interface_components_init.push(function() {
     Vue['component']('selected_facade', {
       'template': '#selected_facade_template',
       'props': {
         'selected': {
           'type': [String, Number],
           'default': null
         },
         'lib': {
           'type': String,
           'default': 'materials'
         },
         'heading': {
           'type': String,
           'default': 'Фасад'
         },
         'is_equal': {
           'type': Boolean,
           'default': false
         },
         'group': {
           'type': String,
           'default': 'all'
         },
         'materials': {
           'type': Object,
           'default': null
         },
         'facade_style': {
           'type': [String, Number],
           'default': 'full'
         },
         'radius': {
           'type': [String, Number, Boolean],
           'default': false
         },
         'can_facade': {
           'type': [Boolean, Number],
           'default': true
         },
         'can_style': {
           'type': [Boolean, Number],
           'default': true
         },
         'can_color': {
           'type': [Boolean, Number],
           'default': true
         }
       },
       'mixins': [mixin],
       'data': function() {
         return {
           'l_selected': 0,
           'l_facade_style': 'full',
           'item': {},
           'l_lib': '',
           'path': []
         };
       },
       'watch': {
         'selected': function(f, g) {
           this['cr']();
         },
         'lib': function(f, g) {
           this['cr']();
         },
         'materials': function(f, g) {
           this['cr']();
         }
       },
       'created': function() {
         this['cr'](),
           this['$root']['$on']('set_menu_facade_style', f => {
             this['l_facade_style'] = f;
           });
       },
       'methods': {
         'cr': function() {
           this['l_lib'] = this['lib'],
             this['l_facade_style'] = this['facade_style'],
             'string' == typeof this['selected'] && isNaN(parseInt(this['selected'])) ? this['l_selected'] =
             copy_object(utils['nested_object']['get'](project_settings, this['selected'])) : this[
             'l_selected'] = this['selected'];
           let f = facades_lib['get_item'](this['l_selected']),
             g = (f['additional_materials'] || (f['additional_materials'] = {}), {}),
             h = (Object['keys'](f['additional_materials'])['forEach'](function(k) {
                 var k = f['additional_materials'][k];
                 g[k['key']] = {
                   'key': k['key'],
                   'name': k['name'],
                   'fixed': k['fixed']
                 };
               }),
               g['gen'] = {
                 'key': 'gen',
                 'name': lang['facades_gen']
               }, {});
           h = null == this['materials'] ? copy_object(project_settings['selected_materials']['facades'][this[
             'l_selected']]) : this['materials'][this['l_selected']];
           var j = {
             'id': f['id'],
             'name': f['name'],
             'code': void 0 !== f['code'] ? f['code'] : '',
             'icon': f['icon'],
             'category': f['category'],
             'materials': h,
             'mat_info': g
           };
           Vue['set'](this, 'item', j),
             this['$options']['lib'] = facades_lib,
             this['$options']['item'] = this['$options']['lib']['get_item'](this['l_selected']),
             this['find_item_path']();
         },
         'add_mat': function(f, g, h) {
           return !!this['can_color'] && !!g && ('gen' == h || 0 === g['fixed'] || void 0);
         },
         'get_type_icon': function(f) {
           var g = {
               'full': '/common_assets/images/icons/common_full_78.jpg',
               'window': '/common_assets/images/icons/common_window_78.jpg',
               'frame': '/common_assets/images/icons/common_frame_78.jpg'
             },
             h = {
               'full': 'radius',
               'window': 'radius_window',
               'radius_window2': 'radius_window2',
               'frame': 'radius_frame'
             },
             j = this['$options']['lib']['items'][this['selected']];
           let k = copy_object(this['l_facade_style']),
             m = '',
             o = (Array.isArray(k) && (k = k[0]),
               isNaN(parseInt(k)) && (m = k,
                 k = 1 == this['radius'] ? j['compatibility_types'][h[k]] : j['compatibility_types'][k]),
               null == k && (k = 0),
               j['types'][k]['icon']);
           var h = {};
           return '' == (o = '' == o ? g[m] : o) ? h['background-image'] =
             'url(/common_assets/images/no_image.png)' : h['background-image'] = 'url(' + o + ')',
             h;
           return o = '' == o ? g[m] : o;
         },
         'get_facade_type_name': function(f) {
           return this['$options']['lib']['items'][this['selected']]['types'][this['find_type']()]['name'];
         },
         'find_type': function() {
           var f = this['$options']['lib']['items'][this['selected']];
           let g = copy_object(this['l_facade_style']);
           return Array.isArray(g) && (g = g[0]),
             g = isNaN(parseInt(g)) ? (g = f['compatibility_types'][g]) || 0 : g;
         },
         'select_facade_type': function(f) {
           var f = {
             'id': f['id'],
             'style': this['l_facade_style'],
             'radius': this['radius']
           };
           this['$root']['$emit']('select_facade_type', f, true);
         },
         'select_category': function(f, g) {
           var h = copy_object(this['path']);
           h.length = g + 1,
             this['$emit']('find_category', h);
         },
         'select_material': function(f) {
           let g = this['group'];
           this['is_equal'] && (g = 'all'),
             f['facade_id'] = this['item']['id'],
             this['$emit']('select_material', {
               'item': f,
               'group': g
             });
         },
         'find_item_path': function() {
           var f = this,
             g;
           let h = [];

           function j(k) {
             facades_lib['categories'][k]['parent'] && 0 != facades_lib['categories'][k]['parent'] ? (h[
                 'unshift'](k),
               j(facades_lib['categories'][k]['parent'])) : h['unshift'](k);
           }
           return j(this['item']['category']),
             this['path'] = h;
         },
         'find_item': function(f) {
           this['$emit']('find_item', f);
         }
       }
     });
   }),
   interface_components_init.push(function() {
     Vue['component']('selected_handle', {
       'template': '#selected_handle_template',
       'props': {
         'selected': {
           'type': [String, Number],
           'default': null
         },
         'lib': {
           'type': String,
           'default': 'handles'
         },
         'heading': {
           'type': String,
           'default': 'Ручка'
         },
         'no_handle': {
           'type': [Boolean, String, Number],
           'default': false
         },
         'handle_type': {
           'type': String,
           'default': ''
         },
         'orientation': {
           'type': String,
           'default': 'vertical'
         },
         'direction': {
           'type': String,
           'default': 'bottom'
         },
         'lockers_position': {
           'type': String,
           'default': 'top'
         },
         'preferable_size': {
           'type': Number,
           'default': 0
         },
         'group': {
           'type': String,
           'default': 'top'
         },
         'single_mode': {
           'type': Number,
           'default': 0
         },
         'method': {
           'type': String,
           'default': 'project'
         },
         'show_doors': {
           'type': Number,
           'default': 1
         },
         'show_lockers': {
           'type': Number,
           'default': 1
         },
         'pos': {
           'type': Object,
           'default': function() {
             return {};
           },
           'required': false
         }
       },
       'mixins': [mixin],
       'data': function() {
         return {
           '_selected': 0,
           'item': {},
           '_lib': '',
           'l_orientation': '',
           'l_position': '',
           'l_direction': '',
           'l_lockers_position': '',
           'l_no_handle': false,
           'l_preferable_size': 0,
           'core_v2': constructor_settings['core_v2']
         };
       },
       'watch': {
         'selected': function(f, g) {
           this['cr']();
         },
         'lib': function(f, g) {
           this['cr']();
         }
       },
       'created': function() {
         this['cr']();
       },
       'methods': {
         'cr': function() {
           this['l_orientation'] = this['orientation'],
             this['l_position'] = this['pos'],
             this['l_no_handle'] = this['no_handle'],
             this['l_direction'] = this['direction'],
             this['l_lockers_position'] = this['lockers_position'],
             this['l_preferable_size'] = this['preferable_size'],
             this['_lib'] = this['lib'],
             'string' == typeof this['selected'] ? this['_selected'] = utils['nested_object']['get'](
               project_settings, this['selected']) : this['_selected'] = this['selected'],
             this['$options']['lib'] = handles_lib;
         },
         'icon_url': function(f) {
           return '' != f['icon'] ? f['icon'] : '/common_assets/images/no_image.png';
         },
         'change_size': function() {
           'rm' === this['group'] ? this['$emit']('get_params_select', {
             'id': this['selected'],
             'key': 'p_size',
             'value': this['l_preferable_size']
           }) : this['single_mode'] ? this['$emit']('change_size', {
             'id': this['selected'],
             'size': this['l_preferable_size']
           }) : change_handle_model(this['selected'], this['l_preferable_size'], this['group']);
         },
         'change_no_handle': function() {
           'rm' === this['group'] ? (this['$emit']('get_params_select', {
               'id': this['selected'],
               'key': 'enabled',
               'value': this['l_no_handle']
             }),
             this['l_no_handle'] = !this['l_no_handle']) : this['single_mode'] || (this['l_no_handle'] = !
             this['l_no_handle'],
             change_no_handle(this['l_no_handle'], this['group']));
         },
         'change_orientation': function() {
           var f;
           'rm' === this['group'] ? this['$emit']('get_params_select', {
             'id': this['selected'],
             'key': 'orient',
             'value': (g => ({
               'horizontal': 'h',
               'vertical': 'v'
             } [g] ?? 'h'))(this['l_orientation'])
           }) : this['single_mode'] || change_handles_orientation(this['l_orientation'], this['group']);
         },
         'change_direction': function() {
           var f;
           'rm' === this['group'] ? this['$emit']('get_params_select', {
             'id': this['selected'],
             'key': 'dir',
             'value': (g => ({
               'left': 'l',
               'right': 'r',
               'bottom': 'b',
               'center': 'c',
               'top': 't'
             } [g] ?? 'b'))(this['l_direction'])
           }) : this['single_mode'] || change_handles_direction(this['l_direction'], this['group']);
         },
         'change_position': function() {
           'rm' === this['group'] ? this['$emit']('get_params_select', {
             'id': this['selected'],
             'key': 'pos',
             'value': this['l_position']
           }) : change_handles_position(this['l_position'], this['group']);
         },
         'change_lockers': function() {
           this['single_mode'] || change_lockers_handles_position(this['l_lockers_position'], this['group']);
         },
         'get_size': function(f) {
           return f['axis_size'] || f['width'];
         },
         'find_item': function(f) {
           this['$emit']('find_item', f);
         }
       }
     });
   }),
   interface_components_init.push(function() {
     Vue['component']('selected_material_group', {
       'template': '#selected_material_group_template',
       'props': {
         'method': {
           'type': String,
           'default': 'global'
         },
         'group_name': {
           'type': String,
           'default': ''
         },
         'group_key': {
           'type': String,
           'default': ''
         },
         'item_id': {
           'type': [String, Number],
           'default': 0
         },
         'variant_id': {
           'type': [String, Number],
           'default': 0
         },
         'butt_item_id': {
           'type': [String, Number],
           'default': 0
         },
         'butt_key': {
           'type': String,
           'default': 'butts'
         },
         'fixed': {
           'type': [String, Number],
           'default': 0
         },
         'show_butt': {
           'type': [Boolean, Number],
           'default': 1
         },
         'show_fixed': {
           'type': [Boolean, Number],
           'default': 1
         },
         'has_auto': {
           'type': [String, Number],
           'default': 0
         }
       },
       'mixins': [mixin],
       'data': function() {
         return {};
       },
       'watch': {
         'group_key': function() {
           this['cr']();
         },
         'butt_key': function() {
           this['cr']();
         }
       },
       'computed': {
         'path'() {
           return this['get_path'](this['item'], this['$options']['lib'], this['$options']['mat_name']);
         },
         'butt_path'() {
           return this['$options']['butt_lib'] ? this['get_path'](this['butt_item'], this['$options']['butt_lib'],
             this['$options']['butt_mat_name']) : [];
         },
         'item'() {
           return this['has_auto'] && is_empty_id(this['item_id']) ? {
             'name': 'Автоматически',
             'code': '',
             'icon': '/common_assets/assets/misc_icons/auto_butt.jpg'
           } : this['$options']['lib']['find_item'](this['item_id']);
         },
         'butt_item'() {
           return this['has_auto'] && is_empty_id(this['butt_item_id']) ? {
             'name': 'Автоматически',
             'code': '',
             'icon': '/common_assets/assets/misc_icons/auto_butt.jpg'
           } : this['$options']['butt_lib']?.['find_item'](this['butt_item_id']);
         },
         'butt_visible'() {
           var e = _['find'](pp['libs']['materials_info']['keys'], f => f['key'] === this['group_key']);
           return !e || Boolean(e['butt_visible']);
         },
         'variant'() {
           return this['item']?.['params']?.['variants']?.[this['variant_id']] || {};
         }
       },
       'created': function() {
         this['cr']();
       },
       'methods': {
         'cr'() {
           this['$options']['lib'] = pp['libs']['materials'][this['group_key']] || pp['libs']['materials'][
             'ldsp'],
             this['$options']['mat_name'] = this['$options']['lib']['get_name'](),
             this['$options']['butt_lib'] = pp['libs']['butts'][this['butt_key']],
             this['$options']['butt_mat_name'] = this['$options']['butt_lib']?.['get_name']() || '';
         },
         'get_path'(f, g, h) {
           let j = [],
             k = f['category'];

           function l(m) {
             var n = g['categories'][m] || g['get_category'](m);
             n['parent'] && 0 != n['parent'] ? (j['unshift']({
                 'id': m,
                 'name': n['name']
               }),
               l(n['parent'])) : j['unshift']({
               'id': m,
               'name': n['name']
             });
           }
           return l(k = (k = Array.isArray(k) ? k[0] : k) && (!Array.isArray(k) || k.length) ? k :
             0),
             j['unshift']({
               'key': this['group_key'],
               'name': h
             }),
             j;
         },
         'get_item_style': function(e) {
           var f = e['params'],
             f;
           return f ? 0 == f['mat_mode'] ? this['item_style'](f['mat_params']) : 1 == f['mat_mode'] ? (f =
             pp['libs']['decors']['find_item'](f['material'])) ? this['item_style'](f) : {} : void 0 : this[
             'item_style'](e);
         },
         'get_category'(e) {
           this['$emit']('get_category', e);
         },
         'get_item'() {
           this['$emit']('get_item', {
             'id': this['item_id'],
             'key': this['group_key']
           });
         },
         'click_item'() {
           this['$emit']('click_item', this['item']);
         },
         'click_butt_item'() {
           this['$emit']('click_butt_item', this['butt_item']);
         },
         'click_category'(e) {
           this['$emit']('click_category', e);
         },
         'click_butt_category'(e) {
           this['$emit']('click_butt_category', e);
         },
         'change_fixed'() {
           this['$emit']('click_fixed');
         }
       }
     });
   }),
   interface_components_init.push(function() {
     Vue['component']('selected_side', {
         'template': '#selected_side_template',
         'props': {
           'selected_left': {
             'type': [String, Boolean],
             'default': 'facade'
           },
           'selected_right': {
             'type': [String, Boolean],
             'default': 'facade'
           },
           'mat_left': {
             'type': [String, Number],
             'default': 0
           },
           'mat_right': {
             'type': [String, Number],
             'default': 0
           },
           'fac_left': {
             'type': [String, Number],
             'default': 0
           },
           'fac_right': {
             'type': [String, Number],
             'default': 0
           },
           'is_left': {
             'type': Boolean,
             'default': true
           },
           'is_right': {
             'type': Boolean,
             'default': true
           },
           'style_left': {
             'type': [String, Number],
             'default': 'full'
           },
           'style_right': {
             'type': [String, Number],
             'default': 'full'
           },
           'facade_id': {
             'type': [Number, String],
             'default': 58
           }
         },
         'mixins': [mixin],
         'data': function() {
           return {
             'l_selected_left': true,
             'l_selected_right': true,
             'l_mat_left': 0,
             'l_mat_right': 0,
             'l_fac_left': 0,
             'l_fac_right': 0,
             'l_style_left': 'full',
             'l_style_right': 'full',
             'icon_left': '',
             'name_left': '',
             'st_left': '',
             'icon_right': '',
             'name_right': '',
             'st_right': ''
           };
         },
         'watch': {
           'selected_left': function(f, g) {
             this['cr']();
           },
           'selected_right': function(f, g) {
             this['cr']();
           },
           'style_left': function() {
             this['cr']();
           },
           'style_right': function() {
             this['cr']();
           }
         },
         'created': function() {
           this['$options']['facade'] = facades_lib['items'][this['facade_id']],
             this['cr']();
         },
         'computed': {
           'version': function() {
             return this['$root']['$cs']['module_sides_version'] || 1;
           }
         },
         'methods': {
           'get_type_icon': function(f, g) {
             var h = {
                 'full': '/common_assets/images/icons/common_full_78.jpg',
                 'window': '/common_assets/images/icons/common_window_78.jpg',
                 'frame': '/common_assets/images/icons/common_frame_78.jpg'
               },
               j = this['$options']['facade'];
             let k, m = (null == (k = isNaN(parseInt(f)) ? j['compatibility_types'][f] : f) && (k = 0),
               j['types'][k]['icon']);
             var j = j['types'][k]['name'];
             return {
               'icon': m = '' == m ? h[f] : m,
               'name': j
             };
           },
           'cr': function() {
             if (this['l_selected_left'] = this['selected_left'],
               this['l_selected_right'] = this['selected_right'],
               this['l_style_left'] = this['style_left'],
               this['l_style_right'] = this['style_right'],
               this['l_mat_left'] = this['mat_left'],
               this['l_mat_right'] = this['mat_right'],
               this['l_fac_left'] = this['fac_left'],
               this['l_fac_right'] = this['fac_right'],
               1 == this['l_selected_left']) {
               var f = this['$root']['$selected_object']['params']['cabinet']['material'],
                 f = materials_lib['items'][f];
               Vue['set'](this, 'st_left', this['get_ic_style'](f)),
                 this['icon_left'] = '/common_assets/images/no_image.png',
                 this['name_left'] = 'ДСП';
             } else {
               if ('facade_simple' == this['l_selected_left'])
                 Vue['set'](this, 'st_left', {
                   'background-image': 'url(/common_assets/images/icons/common_full_78.jpg)'
                 }),
                 this['icon_left'] = '/common_assets/images/icons/common_full_78.jpg',
                 this['name_left'] = lang['cabinet_side_facade'];
               else {
                 if (2 == this['version']) {
                   var f = facades_lib['items'][this['l_fac_left']];
                   let h = this['l_style_left'];
                   isNaN(parseInt(h)) && (h = f['compatibility_types'][h]);
                   var g = {};
                   '' == f['icon'] ? g['background-image'] = 'url(/common_assets/images/no_image.png)' : g[
                       'background-image'] = 'url(' + f['icon'] + ')',
                     this['st_left'] = g,
                     this['icon_left'] = f['icon'],
                     this['name_left'] = f['name'] + '\x20' + f['types'][h]['name'];
                 } else {
                   var g = this['get_type_icon'](this['style_left'], 'left');
                   this['st_left'] = {
                       'background-image': 'url(' + g['icon'] + ')'
                     },
                     this['icon_left'] = g['icon'],
                     this['name_left'] = g['name'];
                 }
               }
             }
             if (1 == this['l_selected_right']) {
               var f = this['$root']['$selected_object']['params']['cabinet']['material'],
                 f = materials_lib['items'][f];
               this['st_right'] = this['get_ic_style'](f),
                 this['icon_right'] = '/common_assets/images/no_image.png',
                 this['name_right'] = 'ДСП';
             } else {
               if ('facade_simple' == this['l_selected_right'])
                 Vue['set'](this, 'st_right', {
                   'background-image': 'url(/common_assets/images/icons/common_full_78.jpg)'
                 }),
                 this['icon_right'] = '/common_assets/images/icons/common_full_78.jpg',
                 this['name_right'] = lang['cabinet_side_facade'];
               else {
                 if (2 == this['version']) {
                   var g = facades_lib['items'][this['l_fac_right']];
                   let j = this['l_style_right'];
                   isNaN(parseInt(j)) && (j = g['compatibility_types'][j]);
                   var f = {};
                   '' == g['icon'] ? f['background-image'] = 'url(/common_assets/images/no_image.png)' : f[
                       'background-image'] = 'url(' + g['icon'] + ')',
                     this['st_right'] = f,
                     this['icon_right'] = g['icon'],
                     this['name_right'] = g['name'] + '\x20' + g['types'][j]['name'];
                 } else {
                   var f = this['get_type_icon'](this['style_right'], 'right');
                   this['st_right'] = {
                       'background-image': 'url(' + f['icon'] + ')'
                     },
                     this['icon_right'] = f['icon'],
                     this['name_right'] = f['name'];
                 }
               }
             }
             this['$forceUpdate']();
           },
           'get_ic_style': function(f) {
             var g = {},
               h;
             return f['icon'] || '' == f['icon'] ? '' == f['icon'] ? f['params'] && f['params']['material'] ? (h =
                 materials_lib['items'][f['params']['material']])['params'] && (h['params']['icon'] ? g[
                   'background-image'] = 'url(' + correct_url(h['params']['icon']) + ')' : h['params']['map'] ? g[
                   'background-image'] = 'url(' + correct_url(h['params']['map']) + ')' : g['background-color'] =
                 h['params']['color']) : g['background-image'] = 'url(/common_assets/images/no_image.png)' : g[
                 'background-image'] = 'url(' + correct_url(f['icon']) + ')' : f['params'] && (f['params'][
                 'icon'] ? g['background-image'] = 'url(' + correct_url(f['params']['icon']) + ')' : f['params'][
                   'map'
                 ] ? g['background-image'] = 'url(' + correct_url(f['params']['map']) + ')' : g[
                   'background-color'] = f['params']['color']),
               g;
           },
           'select_item': function(f) {
             var g, g;
             1 == this['version'] ? ((g = {})['side'] = f,
                 g['facade'] = this['facade_id'],
                 'left' == f ? 1 == this['l_selected_left'] ? g['style'] = 'dsp' : 'facade_simple' == this[
                   'l_selected_left'] ? g['style'] = 'simple' : g['style'] = this['style_left'] : 1 == this[
                   'l_selected_right'] ? g['style'] = 'dsp' : 'facade_simple' == this['l_selected_right'] ? g[
                   'style'] = 'simple' : g['style'] = this['style_right'],
                 this['$root']['$emit']('select_cabinet_side', g)) : (g = {
                   'side': f,
                   'style': this['l_style_' + f],
                   'fac_id': this['l_fac_' + f],
                   'mat_id': this['l_mat_' + f],
                   'version': this['version']
                 },
                 this['$root']['$emit']('select_cabinet_side', g)),
               this['cr']();
           }
         }
       }),
       Vue['component']('side_type_picker', {
         'template': '#side_type_picker_template',
         'props': {
           'facade': {
             'type': [Number, String],
             'default': 0
           },
           'selected': {
             'type': [String, Number, Array],
             'default': 0
           },
           'selected_facade': {
             'type': [String, Number],
             'default': 0
           },
           'selected_mat': {
             'type': [String, Number],
             'default': 0
           },
           'side': {
             'type': String,
             'default': 'left'
           }
         },
         'mixins': [mixin],
         'data': function() {
           return {
             'expanded': false,
             'l_selected': 0,
             'mode': 0,
             'sel_facade': 0,
             'temp_facade': 0,
             'sel_mat': 0,
             'sel_type': 0,
             'materials_categories': []
           };
         },
         'watch': {
           'selected': function(f, g) {
             this['get_selected_index']();
           }
         },
         'created': function() {
           this['$options']['facade'] = facades_lib['items'][this['facade']],
             this['get_selected_index']();
         },
         'computed': {
           'facades': function() {
             var f = [];
             for (let h = 0; h < facades_lib['side_items']['length']; h++) {
               var g = facades_lib['side_items'][h];
               for (let j = 0; j < g['types']['length']; j++)
                 1 == g['types'][j]['side'] && f.push({
                   'id': g['id'],
                   'type_index': j,
                   'name': g['name'] + '\x20' + g['types'][j]['name'],
                   'icon': g['types'][j]['icon'] || g['icon'],
                   'materials': g['materials']
                 });
             }
             return f;
           },
           'version': function() {
             return this['$root']['$cs']['module_sides_version'] || 1;
           },
           'fac_name': function() {
             return facades_lib['items'][this['temp_facade']]['name'];
           }
         },
         'methods': {
           'item_style_type': function(f, g) {
             let h = {};
             var j, j;
             if ('dsp' == f)
               return j = this['$root']['$selected_object']['params']['cabinet']['material'],
                 j = materials_lib['items'][j],
                 h = this['get_ic_style'](j);
             if ('simple' == f)
               h['background-image'] = 'url(/common_assets/images/icons/common_full_78.jpg)';
             else {
               let k = {
                   'full': '/common_assets/images/icons/common_full_78.jpg',
                   'window': '/common_assets/images/icons/common_window_78.jpg',
                   'frame': '/common_assets/images/icons/common_frame_78.jpg'
                 },
                 m = {
                   'radius': 'full',
                   'radius_window': 'window',
                   'radius_window2': 'radius_window2',
                   'radius_frame': 'frame'
                 },
                 n = this['$options']['facade']['compatibility_types'],
                 o = f['icon'];
               '' == o && (f['radius'] ? Object['keys'](n)['forEach'](function(p) {
                   n[p] == g && (o = k[m[p]]);
                 }) : Object['keys'](n)['forEach'](function(p) {
                   n[p] == g && (o = k[p]);
                 })),
                 '' == o || null == o ? h['background-image'] = 'url(/common_assets/images/no_image.png)' : h[
                   'background-image'] = 'url(' + o + ')';
             }
             return h;
           },
           'item_style_facade': function(f) {
             var g = {};
             return '' == f['icon'] ? g['background-image'] = 'url(/common_assets/images/no_image.png)' : g[
                 'background-image'] = 'url(' + f['icon'] + ')',
               g;
           },
           'get_selected_index': function() {
             let f = this['selected'];
             'dsp' == this['selected'] ? this['l_selected'] = 'dsp' : 'simple' == this['selected'] ? this[
               'l_selected'] = 'simple' : (Array.isArray(this['selected']) && (f = this['selected'][0]),
               f = isNaN(parseInt(f)) ? this['$options']['facade']['compatibility_types'][f] : parseInt(f),
               this['l_selected'] = f);
           },
           'get_ic_style': function(f) {
             var g = {},
               h;
             return f['icon'] || '' == f['icon'] ? '' == f['icon'] ? f['params'] && f['params']['material'] ? (h =
                 materials_lib['items'][f['params']['material']])['params'] && (h['params']['icon'] ? g[
                   'background-image'] = 'url(' + correct_url(h['params']['icon']) + ')' : h['params']['map'] ? g[
                   'background-image'] = 'url(' + correct_url(h['params']['map']) + ')' : g['background-color'] =
                 h['params']['color']) : g['background-image'] = 'url(/common_assets/images/no_image.png)' : g[
                 'background-image'] = 'url(' + correct_url(f['icon']) + ')' : f['params'] && (f['params'][
                 'icon'] ? g['background-image'] = 'url(' + correct_url(f['params']['icon']) + ')' : f['params'][
                   'map'
                 ] ? g['background-image'] = 'url(' + correct_url(f['params']['map']) + ')' : g[
                   'background-color'] = f['params']['color']),
               g;
           },
           'select_type': function(f, g) {
             let h;
             if ('dsp' == f)
               this['l_selected'] = 'dsp',
               h = 'dsp';
             else {
               if ('simple' == f)
                 this['l_selected'] = 'simple',
                 h = 'simple';
               else {
                 this['l_selected'] = g,
                   h = g;
                 var j = Object['keys'](this['$options']['facade']['compatibility_types']);
                 for (let k = j.length; k--;)
                   if (this['$options']['facade']['compatibility_types'][j[k]] == g) {
                     if (this['radius']) {
                       h = j[k];
                       break;
                     }
                     h = j[k];
                     break;
                   }
               }
             }
             this['$emit']('change_side', {
               'side': this['side'],
               'style': h
             });
           },
           'select_type_v2': function() {
             this['sel_facade'] = 0,
               this['$emit']('change_side', {
                 'side': this['side'],
                 'style': 'dsp',
                 'version': this['version']
               });
           },
           'check_radius': function(f) {
             if (!f['radius'])
               return true;
           },
           'select_facade'(f) {
             this['temp_facade'] = f['id'],
               this['sel_type'] = f['type_index'],
               this['materials_categories'] = copy_object(f['materials']),
               this['mode'] = 1;
           },
           'sel_item'(f) {
             this['sel_mat'] = f['id'],
               this['sel_facade'] = this['temp_facade'],
               this['$emit']('change_side', {
                 'side': this['side'],
                 'style': this['sel_type'],
                 'fac_id': this['sel_facade'],
                 'mat_id': f['id'],
                 'version': this['version']
               }),
               this['mode'] = 0;
           }
         }
       });
   }),
   interface_components_init.push(function() {
     Vue['component']('tabletop_picker', {
         'template': '#tabletop_picker_template_ext',
         'props': {
           'heading': {
             'type': String,
             'default': ''
           },
           'categories': {
             'type': [String, Array],
             'default': []
           },
           'selected': {
             'type': [String, Number],
             'default': 0
           },
           'selected_variant': {
             'type': [String, Number],
             'default': 0
           },
           'lib': {
             'type': String,
             'default': 'tabletop'
           },
           'mode': {
             'type': String,
             'default': 'p'
           },
           'fn': {
             'type': String,
             'default': ''
           },
           'delay': {
             'type': Number,
             'default': 'undefined' == typeof input_delay ? 500 : input_delay
           },
           'method': {
             'type': String,
             'default': 'project'
           },
           'thickness_val': {
             'type': Number,
             'default': null
           },
           'selected_plint': {
             'type': [String, Number],
             'default': 0
           },
           'tabletop_enabled': {
             'type': Number,
             'default': 0
           },
           'plint_enabled': {
             'type': Number,
             'default': 0
           }
         },
         'mixins': [mixin],
         'data': function() {
           return {
             'tabletop_mode': 0,
             'expanded': false,
             'tabletop_thickness': 0,
             'l_custom_props': [],
             'l_selected': 0,
             'l_selected_variant': 0,
             'l_selected_plint': 0,
             'l_mode': '',
             'l_tabletop_active': false,
             'l_bort_active': false,
             'catalog_params': [],
             'catalog_params_plints': [],
             'core_v2': constructor_settings['core_v2'],
             'debounce': null
           };
         },
         'watch': {
           'selected': function(f, g) {
             this['l_selected'] = this['selected'];
           },
           'selected_variant': function(f, g) {
             this['l_selected_variant'] = this['selected_variant'];
           },
           'selected_plint': function(f, g) {
             'project' != this['method'] && constructor_settings['core_v2'] && (this['l_selected_plint'] = this[
               'selected_plint']);
           }
         },
         'created': function() {
           if (this['l_selected'] = this['selected'],
             this['l_mode'] = this['mode'],
             this['$options']['show_plint'] = constructor_settings['core_v2'] || 'project' == this['method'],
             this['l_custom_props'] = [],
             'project' != this['method'] && constructor_settings['core_v2'] ? (this['l_selected_plint'] =
               parseInt(this['selected_plint'], 10),
               this['l_tabletop_active'] = Boolean(this['tabletop_enabled']),
               this['l_bort_active'] = Boolean(this['plint_enabled']),
               this['l_selected_plint'] && Number['isFinite'](this['l_selected_plint']) || !project_settings[
                 'defaults']['tabletop_plint'] || (this['l_selected_plint'] = parseInt(project_settings[
                 'defaults']['tabletop_plint']))) : (project_settings['defaults']['tabletop_plint'] && (this[
                 'l_selected_plint'] = parseInt(project_settings['defaults']['tabletop_plint'])),
               project_settings['bort_active'] && (this['l_bort_active'] = true)),
             'project' === this['method'] && constructor_settings['core_v2']) {
             'defaults.tabletop' === this['l_selected'] && (this['l_selected'] = 'kitchen.defaults.tabletop.id'),
               is_empty_id(project_settings['kitchen']?.['defaults']?.['tabletop']?.['bort_id']) ? pp?.['libs']?.[
                 'bort'
               ]?.['first_item'] ? this['l_selected_plint'] = parseInt(pp['libs']['bort']['first_item']['id']) :
               this['l_selected_plint'] = 0 : this['l_selected_plint'] = parseInt(project_settings['kitchen'][
                 'defaults'
               ]['tabletop']['bort_id']),
               this['l_tabletop_active'] = true;
             let h = pp['const']['vars']['tabletop_enabled'];
             var f = _['find'](pp['variables']['current'], i => i['key'] === h);
             f && is_empty_id(f['value']) && (this['l_tabletop_active'] = false),
               h = pp['const']['vars']['plint_enabled'],
               (f = _['find'](pp['variables']['current'], i => i['key'] === h)) && is_empty_id(f['value']) && (
                 this['l_bort_active'] = false);
           }
           if (this['$root']['$custom_options']['tabletop']) {
             var g = this['$root']['$custom_options']['tabletop'];
             for (let i = 0; i < g.length; i++)
               this['l_custom_props']['push'](g[i]);
           }
         },
         'methods': {
           'change_param': function(f, g) {
             if (constructor_settings['core_v2']) {
               var g = 'plints' === g ? this['catalog_params_plints'] : this['catalog_params'];
               let h = f,
                 j;
               j = 'number' == typeof f ? (h = g[f])?.['value'] : (h = _['find'](g, k => k['id'] === f['id']),
                   f['value']),
                 h && (h['value'] = copy_object(j),
                   g['splice'](0, 0),
                   'project' != this['method'] ? this['$emit']('change_param', h) : 'tabletop_enabled' === h[
                   'id'] ? sc['change_tabletop_active'](h['value']) : 'tabletop_plint_enabled' === h['id'] && sc[
                     'change_bort_active'](h['value']));
             }
           },
           'change_custom_prop': function(e) {
             this['$root']['$custom_functions'][this['l_custom_props'][e]['function']]();
           },
           'change_bort_active': function(e) {
             'project' != this['method'] ? (this['l_bort_active'] = e['target']['checked'],
               this['$emit']('change_material_plint_active', e['target']['checked'])) : (this['l_bort_active'] =
               e['target']['checked'],
               sc['change_bort_active'](e['target']['checked']));
           },
           'expand_panel': function() {
             this['expanded'] = !this['expanded'],
               this['$root']['$emit']('expand_panel', this['expanded']);
           },
           'select_item': function(f) {
             var g;
             'project' != this['method'] ? (ce('seitem'),
               this['$emit']('change_material', f),
               this['l_selected'] = parseInt(f['id'])) : (g = f['id'],
               this['l_selected'] = parseInt(g),
               sc[this['fn']]({
                 'id': g,
                 'variant_id': find_selected_variant(f)
               }));
           },
           'select_item_plint': function(e) {
             'project' != this['method'] ? this['$emit']('change_material_plint', e) : sc['change_tabletop_plint']
               (e);
           },
           'find_item': function(e) {
             this['$refs']['catalog']['check_scroll'](),
               this['l_mode'] = 'c';
           },
           'find_item_plint': function(e) {
             this['$refs']['catalog_plint']['check_scroll'](),
               this['l_mode'] = 'c_p';
           }
         }
       }),
       Vue['component']('selected_tabletop', {
         'template': '#selected_tabletop_template',
         'props': {
           'selected': {
             'type': [String, Number],
             'default': null
           },
           'cropper_enabled': 0,
           'lib': {
             'type': String,
             'default': 'materials'
           },
           'heading': {
             'type': String,
             'default': lang['tabletop']
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
             '_selected': 0,
             'item': {},
             '_lib': ''
           };
         },
         'watch': {
           'selected': function(f, g) {
             this['cr']();
           },
           'lib': function(f, g) {
             this['cr']();
           }
         },
         'created': function() {
           this['cr']();
         },
         'methods': {
           'cr': function() {
             let e = '';
             switch (this['lib']) {
               case 'tabletop':
                 e = tabletop_lib;
                 break;
               case 'materials':
                 e = materials_lib;
                 break;
               case 'glass':
                 e = glass_lib;
                 break;
               case 'washers':
                 e = washes_materials_lib;
                 break;
               default:
                 e = materials_lib;
             }
             this['_lib'] = this['lib'],
               'string' == typeof this['selected'] ? this['_selected'] = utils['nested_object']['get'](
                 project_settings, this['selected']) : this['_selected'] = this['selected'],
               this['$options']['lib'] = e,
               this['item'] = this['$options']['lib']['get_item'](this['_selected']);
           },
           'find_item': function(f, g = null) {
             this['cropper_enabled'] ? this['$root']['$emit']('cropper_modal_show', copy_object(this[
               'add_data'])) : null != this['add_data'] ? this['$emit']('find_item', {
                 'id': f,
                 'data': this['add_data']
               }) : null != this['f_key'] ? this['$emit']('find_item', {
                 'id': f,
                 'key': this['f_key']
               }) : this['$emit']('find_item', f);
           }
         }
       }),
       Vue['component']('selected_tabletop_plint', {
         'template': '#selected_tabletop_plint_template',
         'props': {
           'selected': {
             'type': [String, Number],
             'default': null
           },
           'cropper_enabled': 0,
           'lib': {
             'type': String,
             'default': 'materials'
           },
           'heading': {
             'type': String,
             'default': lang['tabletop_plints']
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
             '_selected': 0,
             'item': {},
             '_lib': ''
           };
         },
         'watch': {
           'selected': function(f, g) {
             this['cr']();
           },
           'lib': function(f, g) {
             this['cr']();
           }
         },
         'created': function() {
           this['cr']();
         },
         'methods': {
           'cr': function() {
             var e = '';
             this['_lib'] = libs['tabletop_plints'],
               this['_selected'] = this['selected'],
               this['$options']['lib'] = this['_lib'],
               this['item'] = this['$options']['lib']['get_item'](this['_selected']),
               ce();
           },
           'item_style': function(f) {
             var g = {},
               f;
             return '' != f['icon'] ? g['background-image'] = 'url(' + correct_url(f['icon']) + ')' : (f =
                 materials_lib['items'][f['params']['material']]) && f['params'] && (f['params']['icon'] ? g[
                   'background-image'] = 'url(' + correct_url(f['params']['icon']) + ')' : f['params']['map'] ? g[
                   'background-image'] = 'url(' + correct_url(f['params']['map']) + ')' : g['background-color'] =
                 f['params']['color']),
               g;
           },
           'find_item': function(f, g = null) {
             this['cropper_enabled'] ? this['$root']['$emit']('cropper_modal_show', copy_object(this[
               'add_data'])) : null != this['add_data'] ? this['$emit']('find_item', {
                 'id': f,
                 'data': this['add_data']
               }) : null != this['f_key'] ? this['$emit']('find_item', {
                 'id': f,
                 'key': this['f_key']
               }) : this['$emit']('find_item', f);
           }
         }
       });
   }),
   interface_components_init.push(function() {
     async function e(g) {
       if (pp['libs']['key_value'] && pp['libs']['key_value']['__custom_menu'] && pp['libs']['key_value'][
           '__custom_menu'
         ]['value'])
         try {
           var h = JSON['parse'](pp['libs']['key_value']['__custom_menu']['value']);
           if ('left' == g && 0 < h['top_menu_left']['length'])
             return h['top_menu_left'];
           if ('right' == g && 0 < h['top_menu_right']['length'])
             return h['top_menu_right'];
         } catch (i) {}
       var h = await promise_request('/common_assets/data/top_menu.json' + date_timestamp);
       return 'left' == g ? h['left'] : 'right' == g ? h['right'] : void 0;
     }

     function f() {
       let g = [];
       var h = document['querySelector']('svg[style*=\x22display:none\x22]'),
         i;
       return h ? (h['querySelectorAll']('symbol')['forEach'](j => {
           var j = j['id'],
             j;
           j && j['startsWith']('icon-') && (j = j.replace('icon-', ''),
             g.push(j));
         }),
         g) : [];
     }
     Vue['component']('top_menu', {
       'template': '#top_menu_template',
       'data': function() {
         return {
           'current': null,
           'was_loaded': 0,
           'is_fullscreen': 0,
           'show_numbers': false,
           'edges': {
             'is_on': false,
             'transparent': false
           },
           'sizes': {
             'no': false,
             'basic': true,
             'all': false
           },
           'undo_active': false,
           'redo_active': false,
           'show_specs': 0 == constructor_settings['shop_mode'] && 1 == constructor_settings['show_specs'],
           'shop_mode': constructor_settings['shop_mode'],
           'fill_mode': false,
           'common_mode': {
             'available': constructor_settings['components']['common_mode'],
             'active': false
           },
           'colorpicker_notice': false,
           'colorpicker_target': '',
           'project_select_notice': false,
           'tabletop_cut_mode': 0,
           'ruler_mode': 0,
           'rulers_visible': null == project_settings['rulers_visible'] ? 1 : project_settings[
             'rulers_visible'],
           'grid_mode': 0,
           'guides_mode': 0,
           'guides_visible': null == project_settings['guides_visible'] ? 1 : project_settings[
             'guides_visible'],
           'logo_top_src': 1 == constructor_settings['core_v2'] ? '/common_assets/images/logo_scene_20.png' :
             '/common_assets/images/logo_scene_R.png',
           'discount_visible': 0,
           'debounce': null,
           'buttons': {
             'right': [],
             'left': []
           },
           'counts': {},
           'filters': {},
           'icons': {}
         };
       },
       'computed': {
         'is_auth'() {
           return this['$root']['$up']['is_auth'];
         }
       },
       'created': async function() {
         let g = this;
         var h;
         this['check_common'](),
           this['items_left'] = await e('left'),
           this['items_right'] = await e('right'),
           (this['items_left'] || this['items_right']) && (this['buttons'] = {
             'right': this['items_right'],
             'left': this['items_left']
           }),
           this['$options']['cl'] = 0,
           this['$root']['$is']['tariff'] && (1 == this['$root']['$is']['tariff']['add_logo_part'] || 70 <=
             this['$root']['$is']['tariff']['id']) && (this['$options']['cl'] = 1,
             h = document['getElementById']('logo_top_src')['value']) && (this['logo_top_src'] = h),
           this['$root']['$on']('project_loaded', function() {
             g['facades_active'] = 1 == project_settings['facades_active'];
           }),
           this['$root']['$on']('undo_changed', function() {
             g['undo_active'] = 0 < undo_list.length;
           }),
           this['$root']['$on']('cart_update', function(i) {
             g['cart_count'] = i;
           }),
           this['$root']['$on']('update_services_count', () => {
             this['get_services_count']();
           }),
           this['$root']['$on']('update_discount', () => {
             this['discount_val'] = project_settings['discount'];
           }),
           this['$root']['$on']('redo_changed', function() {
             g['redo_active'] = 0 < undo_list.length;
           }),
           this['$root']['$on']('yn_modal_new_project', function(i) {
             clear_project();
           }),
           this['$root']['$on']('yn_modal_connect_coupe', function(i) {
             connect_coupe();
           }),
           this['$root']['$on']('yn_modal_remove_outside', function(i) {
             room['remove_outside']();
           }),
           this['$root']['$on']('colorpicker_mode_change', function(i) {
             g['colorpicker_notice'] = 'picker_' + i,
               g['colorpicker_target'] = i;
           }),
           this['$root']['$on']('colorpicker_mode_off', function(i) {
             g['colorpicker_notice'] = '',
               g['colorpicker_target'] = '';
           }),
           this['$root']['$on']('project_select_mode', function() {
             g['project_select_notice'] = false,
               g['is_auth'] && project_settings['project_select'] && (g['project_select_notice'] = true,
                 this['$root']['$emit']('select_project_data', project_settings['project_select']),
                 g['get_project_select_id']());
           }),
           this['$root']['$on']('set_ruler_mode', function(i) {
             g['set_ruler_mode'](i);
           }),
           this['$root']['$on']('set_guides_mode', function(i) {
             g['set_guides_mode'](i);
           }),
           this['$root']['$on']('set_camera_mode', function(i) {
             g['set_camera_mode'](i);
           }),
           this['$root']['$on']('yn_modal_kitchen_style', function(i) {
             set_kitchen_style(global_temp['kitchen_style_id'], true),
               g['$root']['$emit']('set_kitchen_style_selected', global_temp['kitchen_style_id']);
           }),
           this['$root']['$on']('fill_enabled', function(i) {
             g['fill_mode'] = i;
           }),
           this['icon_map'] = f(),
           this['init_counts'](),
           this['add_or_update_button']();
       },
       'mounted': function() {
         if (0 == this['$options']['cl']) {
           setTimeout(() => {
             this['$refs']['top_logo']['src'] = this['logo_top_src'];
           }, 1);
           let g = 0,
             h = setInterval(() => {
               g++,
               this['$refs']['top_logo']['src'] = this['logo_top_src'],
                 9 < g && clearInterval(h);
             }, 1000);
         }
       },
       'methods': {
         'init_counts'() {
           var g;
           [...this['buttons']['left'], ...this['buttons']['right']]['forEach'](h => {
             h['count'] && (this['$set'](this['counts'], h['count'], 0),
               this['setup_count_listeners'](h));
           });
         },
         'setup_count_listeners'(g) {
           this['$root']['$on'](g['update_count'], () => {
             'services_count' === g['count'] ? this['counts'][g['count']] = project_settings['services'] ?
               project_settings['services']['length'] : 0 : 'discount_count' === g['count'] ? this['counts']
               [g['count']] = project_settings['discount'] || 0 : 'cart_count' === g['count'] && (this[
                 'counts'][g['count']] = cart['count'] || 0);
           });
         },
         'process_click'(g, ...h) {
           var i = k => Array.isArray(k) && k['some'](l => '' !== l && null != l),
             j;
           'object' == typeof g && g['name'] ? 'function' == typeof(j = this[g['name']]) ? i(g['args']) && !h[
               'length'] ? j['call'](this, ...g['args']) : i(g['args']) && h.length ? j['call'](this, ...g[
               'args'], ...h) : j['call'](this, ...h) : 'function' == typeof window[g['name']] && (i(g['args']) &&
               !h.length ? window[g['name']](...g['args']) : i(g['args']) && h.length ? window[g['name']](
                 ...g['args'], ...h) : window[g['name']](...h)) : 'function' == typeof this[g] ? this[g]() :
             'function' == typeof g && g();
         },
         'get_icon': function(g) {
           var h = {};
           return h[g['icon']] = true,
             h;
         },
         'get_svg_icon'(g) {
           return this['icon_map'] && Array.isArray(this['icon_map']) && this['icon_map']['includes'](g) ? g :
             null;
         },
         'add_or_update_button'() {
           var g = h => {
             let i = new Map();
             return h.forEach(j => {
                 if (j['id']) {
                   if (i['has'](j['id'])) {
                     let k = i['get'](j['id']);
                     j['children']?.['forEach'](l => {
                       k['children']['some'](m => m['text'] === l['text']) || k['children']['push'](l);
                     });
                   } else
                     i['set'](j['id'], {
                       ...j,
                       'children': [...j['children'] || []]
                     });
                 }
               }),
               Array.from(i['values']());
           };
           this['buttons']['left'] = g(this['buttons']['left']),
             this['buttons']['right'] = g(this['buttons']['right']);
         },
         'check_condition'(g) {
           if ('function' == typeof g)
             return g(this);
           var h = {
               '$root': this['$root'],
               'top_menu': this
             },
             g = new Function('with(this)\x20{\x20return\x20' + g + ';\x20}');
           try {
             return g['call'](h);
           } catch (i) {
             return null;
           }
         },
         'trigger_input'(g) {
           var g = this['$refs'][g];
           $(g)['click']();
         },
         'reset_camera'() {
           controls['target']['set'](238, 64, 17),
             camera['position']['set'](34, 203, 401),
             controls['update']();
         },
         'close_colorpicker'() {
           switch (this['colorpicker_notice'] = '',
             this['colorpicker_target']) {
             case 'fill':
               this['$root']['unset_fill_mode']();
               break;
             case 'erase':
               this['$root']['unset_erase_mode']();
               break;
             default:
               this['$root']['unset_colorpicker_mode']();
           }
         },
         'close_project_select'() {
           let g = this;
           this['$root']['$emit']('yn_modal_show', {
             'heading': '',
             'body': this['lang']('project_overwrite_notice'),
             'callback': function() {
               project_settings['project_select'] = null,
                 g['$root']['$emit']('project_selected'),
                 g['project_select_notice'] = false;
             }
           });
         },
         'get_project_select_id'() {
           var g;
           project_settings['project_select'] && (g = this['buttons']['left']['find'](h =>
             'project_select_notice' === h['text'])) && (g['label'] = this['lang']('project_select_notice') +
             '\x20' + project_settings['project_select']);
         },
         'toggle_tabletop_cut_mode': function() {
           clearTimeout(this['debounce']),
             this['debounce'] = setTimeout(() => {
               1 == this['tabletop_cut_mode'] ? (this['tabletop_cut_mode'] = 0,
                 sc['set_tabletop_cut_mode'](0)) : (this['tabletop_cut_mode'] = 1,
                 sc['set_tabletop_cut_mode'](1));
             }, 100);
         },
         'show_project_materials'() {
           let g = document['getElementsByClassName']('materials_panel_body')[0],
             h = setInterval(() => {
               '' != g['innerHTML'] && (clearInterval(h),
                 this['$root']['$emit']('show_custom_modal', {
                   'heading': lang['materials_panel'],
                   'body': document['getElementsByClassName']('materials_panel_body')[0]['innerHTML']
                 }));
             }, 100);
         },
         'change_filter': function(g) {
           switch (pp['state']['scene_layers'][g] = Boolean(this['filter'][g]),
             g) {
             case 'tabletop':
               set_tabletop_visible(this['filter'][g]);
               break;
             case 'facades':
               set_facades_visible(this['filter'][g]);
               break;
             case 'modules_top':
               set_modules_visible('top', this['filter'][g]);
               break;
             case 'modules_bottom':
               set_modules_visible('bottom', this['filter'][g]);
               break;
             case 'comms':
               set_models_visible('Comms', this['filter'][g]);
               break;
             case 'interior':
               set_models_visible('Other', this['filter'][g]);
               break;
             case 'tech':
               set_models_visible('Tech', this['filter'][g]);
               break;
             case 'ceiling':
               room['ceiling']['visible'] = this['filter'][g];
               break;
             case 'walls':
               room['left_wall']['visible'] = this['filter'][g],
                 room['right_wall']['visible'] = this['filter'][g],
                 room['front_wall']['visible'] = this['filter'][g],
                 room['back_wall']['visible'] = this['filter'][g],
                 set_shafts_visible(this['filter'][g]);
               break;
             case 'floor':
               room['floor']['visible'] = this['filter'][g];
               break;
           }
         },
         'new_project': function() {
           this['$root']['$emit']('yn_modal_show', {
             'heading': this['lang']('new_project'),
             'body': this['lang']('new_project_confirm'),
             'cb': 'new_project'
           });
         },
         'guess': function() {
           1 == this['was_loaded'] ? this['save_project']() : this['$refs']['project_file']['click']();
         },
         'load_project': function(g) {
           var h, i, i;
           this['$refs']['project_file'][0]['files']['length'] && ((h = this['$refs']['project_file'][0][
               'files'
             ][0])['name']['endsWith'](global_options['save_file_zip']) ? ((i = new FileReader())[
               'onload'] = async function(j) {
                   try {
                     var k = await JSZip['loadAsync'](j['target']['result']);
                     if (k['files']['project.json']) {
                       var l = await k['files']['project.json']['async']('string'),
                         m;
                       if (load_scene_new(l),
                         k['folder']('textures'))
                         for (let u of Object['keys'](k['files'])['filter'](v => v['startsWith'](
                           'textures/'))) {
                           var p = await k['files'][u]['async']('base64'),
                             q, r = 'data:' + (u['endsWith']('.png') ? 'image/png' : 'image/jpeg') +
                             ';base64,' + p;
                           let v = new Image();
                           v['onload'] = () => {
                               u['includes']('lr_wall') ? (sc['set_walls_custom_material'](v),
                                 global_options['custom_textures']['lr_wall']['texture'] = v['src'],
                                 global_options['custom_textures']['fb_wall']['texture'] = v['src']) : u[
                                 'includes']('floor') && (sc['set_floor_custom_material'](v),
                                 global_options['custom_textures']['floor']['texture'] = v['src']);
                             },
                             v['src'] = r;
                         }
                     }
                   } catch (w) {}
                 },
                 i['readAsArrayBuffer'](h)) : h['name']['endsWith'](global_options['save_file_ext']) && ((i =
                 new FileReader())['onload'] = function(j) {
                 load_scene_new(j['target']['result']);
               },
               i['readAsText'](h))),
             this['was_loaded'] = 1,
             this['$refs']['project_file'][0]['value'] = null;
         },
         'save_project': function() {
           save_scene_new();
         },
         'save_project_as_zip': function() {
           save_scene_new_as_zip();
         },
         'export_model': function(g) {
           switch (g) {
             case 'obj':
               export_to_obj();
               break;
             case 'gltf':
               exportGLTF();
               break;
             case 'glb':
               exportGLB();
               break;
             case 'dae':
               exportDAE();
               break;
           }
         },
         'change_proj': function(g) {
           'persp' == g ? camera_mode_3d() : projection(g);
         },
         'set_ceiling_visible'(g) {
           room['ceiling']['visible'] = g;
         },
         'set_floor_visible'(g) {
           room['floor']['visible'] = g;
         },
         'set_walls_visible'(g) {
           room['left_wall']['visible'] = g,
             room['right_wall']['visible'] = g,
             room['front_wall']['visible'] = g,
             room['back_wall']['visible'] = g,
             set_shafts_visible(g);
         },
         'change_shadow'(g) {
           room['light1']['castShadow'] = g,
             room['directionalLight']['castShadow'] = g;
         },
         'comments_toggle'(g) {
           sc['comments_toggle'](g);
         },
         'edges_mode'(g) {
           global_options['mode'] = g ? 'edges' : 'design',
             room['change_mode']();
         },
         'numbers_mode'(g) {
           sc['numbers'](g);
         },
         'edges_transparent'(g) {
           global_options['edges_transparent'] = g,
             transparent_edges(global_options['edges_transparent']);
         },
         'sizes_mode': function(g) {
           switch (Vue['set'](this, 'sizes', {
               'no': false,
               'basic': false,
               'all': false
             }),
             this['sizes'][g] = true,
             g) {
             case 'no':
               no_sizes_mode();
               break;
             case 'basic':
               basic_sizes_mode();
               break;
             case 'all':
               all_sizes_mode();
               break;
           }
         },
         'additional_sizes_mode': function(g = 0) {
           g = parseFloat(g),
             additional_sizes_mode(g);
         },
         'kitchen_sizes_mode': function(g) {
           global_options['kitchen_sizes_visible'] = g,
             sc['update_kitchen_sizes']();
         },
         'fullscreen': function() {
           var g;
           0 == this['is_fullscreen'] ? (this['is_fullscreen'] = 1,
             (g = document['querySelector']('#calc'))['requestFullscreen'] ? g['requestFullscreen']() : g[
               'mozRequestFullScreen'] ? g['mozRequestFullScreen']() : g['webkitRequestFullScreen'] && g[
               'webkitRequestFullScreen']()) : (this['is_fullscreen'] = 0,
             document['cancelFullScreen'] ? document['cancelFullScreen']() : document['mozCancelFullScreen'] ?
             document['mozCancelFullScreen']() : document['webkitCancelFullScreen'] && document[
               'webkitCancelFullScreen']());
         },
         'screenshot': function() {
           save_screen();
         },
         'custom_screenshot': function() {
           this['$root']['$emit']('custom_screenshot_modal_show', {
             'cb': 'pdf_new_tab'
           });
         },
         'intersections_toggle': function(g) {
           sc['intersections_toggle'](g);
         },
         'view_only_toggle': function(g) {
           (global_options['view_only_mode'] = g) && dControls['clear_selected']();
         },
         'facades_active_change': function(g) {
           project_settings['facades_active'] = !g,
             sc['set_facades_active'](!g);
         },
         'pdf_new_tab': async function() {
           1 == constructor_settings['pdf_use_password'] ? this['$root']['$emit']('password_modal_show', {
             'cb': 'pdf_new_tab'
           }) : ic['pdf_new_tab']();
         },
         'pdf_download': function() {
           1 == constructor_settings['pdf_use_password'] ? this['$root']['$emit']('password_modal_show', {
             'cb': 'pdf_download'
           }) : ic['pdf_download']();
         },
         'xls_download': function() {
           1 == constructor_settings['pdf_use_password'] ? this['$root']['$emit']('password_modal_show', {
             'cb': 'xls_download'
           }) : ic['xls_download']();
         },
         'csv_export_Asai': function() {
           1 == constructor_settings['pdf_use_password'] ? this['$root']['$emit']('password_modal_show', {
             'cb': 'csv_export_Asai'
           }) : ic['csv_export_Asai']();
         },
         'asai_nest_export': function() {
           var g;
           new Nest()['ExportNestFile']();
         },
         'show_order_modal': function() {
           'function' == typeof c_show_order_modal ? c_show_order_modal() : this['$root']['$emit'](
             'order_modal_show', {});
         },
         'show_info_modal': function() {
           'function' == typeof c_project_info ? c_project_info() : constructor_settings['core_v2'] ? this[
             '$root']['$emit']('info_modal_show', {
             'heading': this['lang']('modules_info'),
             'data': sc['get_objects_info'](),
             'v2': 2
           }) : this['$root']['$emit']('info_modal_show', {
             'heading': this['lang']('modules_info'),
             'data': sc['get_objects_info']()
           });
         },
         'show_comments_modal': function() {
           this['$root']['$emit']('show_comments_modal', 1);
         },
         'show_auth_modal': function() {
           this['$root']['$emit']('show_auth_modal', {
             'heading': this['lang']('auth')
           });
         },
         'show_project_list_modal'() {
           this['$root']['$emit']('show_project_list_modal', {
             'heading': this['lang']('project_list')
           });
         },
         'logout': function() {
           this['project_select_notice'] = false,
             this['$root']['$up']['logout']();
         },
         'set_tabletop_cut_mode': function(g) {
           this['tabletop_cut_mode'] = g,
             sc['set_tabletop_cut_mode'](g);
         },
         'set_ruler_mode': function(g, h) {
           this['ruler_mode'] == g ? (this['ruler_mode'] = 0,
               sc['set_ruler_mode'](0, h)) : (this['ruler_mode'] = g,
               sc['set_ruler_mode'](g, h)),
             this['current'] = null;
         },
         'clear_rulers': function() {
           this['$root']['$emit']('yn_modal_show', {
             'heading': this['lang']('confirm_action'),
             'body': this['lang']('clear_rulers'),
             'callback': () => {
               sc['clear_rulers']();
             }
           });
         },
         'change_rulers_visible': function(g) {
           sc['set_rulers_visible'](g);
         },
         'set_grid_mode': function(g) {
           this['grid_mode'] == g ? (this['grid_mode'] = 0,
             sc['grid_mode'](0)) : (this['grid_mode'] = g,
             sc['grid_mode'](g));
         },
         'set_grid': function(g, h) {
           clearTimeout(this['debounce']),
             this['debounce'] = setTimeout(() => {
               var i = parseInt(h['target']['value']);
               this['grid_' + g] = i,
                 sc['set_grid'](g, i);
             }, 600);
         },
         'set_guides_mode': function(g) {
           this['guides_mode'] == g ? (this['guides_mode'] = 0,
             sc['set_guides_mode'](0)) : (this['guides_mode'] = g,
             sc['set_guides_mode'](g));
         },
         'clear_guides': function() {
           this['$root']['$emit']('yn_modal_show', {
             'heading': this['lang']('confirm_action'),
             'body': this['lang']('clear_guides'),
             'callback': () => {
               sc['clear_guides']();
             }
           });
         },
         'change_guides_visible': function(g) {
           sc['set_guides_visible'](this['guides_visible']);
         },
         'unset_mouse_mode': function() {
           this['ruler_mode'] = 0,
             this['guides_mode'] = 0,
             this['close_colorpicker']();
         },
         'undo': function() {
           undo_action(),
             this['undo_active'] = 0 < undo_list.length;
         },
         'redo': function() {
           redo_action(),
             this['redo_active'] = 0 < redo_list.length;
         },
         'lang': function(g) {
           return this['$root']['lang'](g);
         },
         'show_cart': function() {
           'function' == typeof c_show_cart ? c_show_cart() : this['$root']['show_accessories'](1, 0);
         },
         'show_discount': function() {
           1 == this['discount_visible'] ? this['discount_visible'] = 0 : this['discount_visible'] = 1;
         },
         'change_disc': function(g) {
           clearTimeout(this['debounce']),
             this['debounce'] = setTimeout(() => {
               var h = parseFloat(g['target']['value']);
               this['discount_val'] = h,
                 project_settings['discount'] = h,
                 sc['get_price']();
             }, 600);
         },
         'show_services': function() {
           pp['interface']['root']['$emit']('services_modal_show');
         },
         'get_services_count'() {
           this['services_count'] = project_settings['services'] ? project_settings['services']['length'] : 0;
         },
         'check_common': function() {
           this['common_mode']['active'] = 1 == global_options['forced_common'];
         },
         'change_common'(g) {
           this['common_mode'] != g && (this['common_mode']['active'] = g,
             this['common_mode']['active'] ? location['href'] = location['href'] + '?forced_common=1' :
             location['href'] = location['href']['replace']('?forced_common=1', ''));
         },
         'link_lk'() {
           this['is_auth'] && (window['location']['href'] = 'config/index.php/settings');
         },
         'set_camera_mode'(g) {
           sc['set_camera_mode'](g);
         },
         'disabled_fill_mode'() {
           this['fill_mode'] = false,
             fill_edit_mode();
         },
         'bazis_convert'() {
           var g;
           this['is_auth'] ? ((g = new CFRN())['disable_remote_flag'] = 0,
             g['exportAndDownloadCFRNResult']()) : pp['interface']['root']['$emit']('show_loader_modal', {
             'mode': 'error',
             'text': pp['interface']['root']['lang']('auth_not_token')
           });
         }
       }
     });
   }),
   interface_components_init.push(function() {
     Vue['component']('variables_component', {
       'template': '#variables_component_template',
       'props': {
         'variables': {
           'type': Array,
           'default': []
         },
         'object': {
           'type': String,
           'default': 'selected_object'
         }
       },
       'mixins': [mixin],
       'data': function() {
         return {
           'delay': 'undefined' == typeof input_delay ? 500 : input_delay,
           'debounce': null
         };
       },
       'created': function() {},
       'methods': {
         'change_select'(f) {
           this['do_change'](f);
         },
         'change_number'(e, f) {
           clearTimeout(this['debounce']),
             this['debounce'] = setTimeout(() => {
               var g = parseFloat(e['params']['max']),
                 h = parseFloat(e['params']['min']),
                 i = parseFloat(f['target']['value']);
               g < i ? (f['target']['value'] = g,
                   e['value'] = g) : i < h ? (f['target']['value'] = h,
                   e['value'] = h) : e['value'] = i,
                 this['do_change'](e);
             }, this['delay']);
         },
         'do_change'(f) {
           var g = this['$root']['$' + this['object']];
           ce(f['value']),
             g && (g['change_variable'](f['key'], f['value']),
               sc['get_price']());
         }
       }
     });
   }),
   interface_components_init.push(function() {
     Vue['component']('variables_v2_component', {
       'template': '#variables_v2_component_template',
       'props': {
         'variables': {
           'type': Array,
           'default': []
         }
       },
       'mixins': [mixin],
       'data': function() {
         return {
           'groups': [],
           'delay': 'undefined' == typeof input_delay ? 500 : input_delay,
           'debounce': null
         };
       },
       'watch': {
         'variables': function() {
           this['cr']();
         }
       },
       'created': function() {
         this['cr']();
       },
       'mounted': function() {},
       'methods': {
         'cr'() {
           var f = this['variables'] ? copy_object(this['variables']) : [];
           if (f.length) {
             for (var g of f)
               if (g['vars'] && g['vars']['length']) {
                 for (var h of g['vars'])
                   void 0 === h['fixed'] && (h['fixed'] = 0);
               }
           }
           this['groups'] = f;
         },
         'change_select'(f) {
           this['do_change'](f);
         },
         'change_number'(e, f) {
           clearTimeout(this['debounce']),
             this['debounce'] = setTimeout(() => {
               var g = parseFloat(e['params']['max']),
                 h = parseFloat(e['params']['min']),
                 j = parseFloat(f['target']['value']);
               g < j ? (f['target']['value'] = g,
                   e['value'] = g) : j < h ? (f['target']['value'] = h,
                   e['value'] = h) : e['value'] = j,
                 this['do_change'](e);
             }, this['delay']);
         },
         'change_fixed'(f) {
           f['fixed'] = to_int(!f['fixed']),
             this['change_select'](f);
         },
         'do_change'(f) {
           var f = {
             'variable': copy_object(f)
           };
           this['$emit']('change_variable', f);
         },
         'get_select_options'(e) {
           return e['disabled_values']?.['length'] ? _.filter(e['params']['options'], f => {
             var g;
             return _.findIndex(e['disabled_values'], h => '' + h == '' + f['value']) < 0;
           }) : e['params']['options'] || [];
         }
       }
     });
   }),
   interface_components_init.push(function() {
     Vue['component']('washes_picker', {
       'template': '#washes_picker_template',
       'props': ['categories', 'heading', 'cid', 'fn'],
       'mixins': [mixin],
       'data': function() {
         return {
           'mode': 'c',
           'expanded': false
         };
       },
       'methods': {
         'reset': function() {},
         'expand_panel': function() {
           this['expanded'] = !this['expanded'],
             this['$root']['$emit']('expand_panel', this['expanded']);
         },
         'mouse_down': function(f) {
           sc['unset_mouse_mode'](),
             this['$root']['$refs']['interface']['classList']['add']('tmp_dis');
           var g = libs['washes']['get_item'](f['id']);
           g['id'] = f['id'],
             sc['add_object']('washer', g);
         },
         'handle_cl': function(f) {},
         'handle_md': function(f) {
           this['mouse_down'](f);
         }
       }
     });
   }),
   interface_components_init.push(function() {
     Vue['component']('widget_mode', {
       'template': '#widget_mode_template',
       'data': function() {
         return {
           'show_open_btn': false,
           'cab': null
         };
       },
       'methods': {
         'init_widget_mode'() {
           if (1 == global_options['url_params']['widget']) {
             room['hide'](),
               dControls['enabled'] = false,
               $('#interface')['hide'](),
               this['handle_catalog']();
             let e = 30,
               f = 25;
             global_options['url_params']['x'] && (e = parseInt(global_options['url_params']['x'])),
               global_options['url_params']['y'] && (f = parseInt(global_options['url_params']['y'])),
               fitCameraToCenteredObject(camera, d_objects[0], 2.4, controls),
               controls['rotateLeftAngle'](deg2rad(e)),
               controls['rotateUpAngle'](-deg2rad(f));
           }
         },
         'handle_catalog'() {
           var e, e, e, e;
           'modules' == global_options['url_params']['catalog'] && ((e = mod_lib['get_item'](global_options[
                 'url_params']['id'])['params'])['id'] = global_options['url_params']['id'],
               this['cab'] = sc['add_object']('cabinet', e, false),
               hide_sizes(),
               this['cab']['position']['set'](0, -this['cab']['params']['cabinet']['height'] / units / 2,
               0),
               this['show_open_btn'] = true,
               this['has_materials'] = true),
             'interior' == global_options['url_params']['catalog'] && ((e = interior_lib['get_item'](
                 global_options['url_params']['id']))['catalog'] = 'Other',
               e['id'] = global_options['url_params']['id'],
               this['cab'] = sc['add_object']('model', e, false),
               hide_sizes(),
               this['cab']['position']['set'](0, -this['cab']['params']['height'] / units / 2, 0)),
             'tech' == global_options['url_params']['catalog'] && ((e = tech_lib['get_item'](global_options[
                 'url_params']['id']))['catalog'] = 'Tech',
               e['id'] = global_options['url_params']['id'],
               this['cab'] = sc['add_object']('model', e, false),
               hide_sizes(),
               this['cab']['position']['set'](0, -this['cab']['params']['height'] / units / 2, 0)),
             'catalog' == global_options['url_params']['catalog'] && ((e = catalog_lib['get_item'](global_options[
                 'url_params']['id'])['params'])['id'] = global_options['url_params']['id'],
               e['is_default'] = true,
               this['cab'] = sc['add_object']('cabinet_cn', e, false),
               hide_sizes(),
               this['cab']['position']['set'](0, -this['cab']['userData']['params']['size']['y'] / units / 2,
                 0),
               this['show_open_btn'] = true,
               this['has_materials'] = true);
         },
         'open_doors'() {
           this['cab']['open_all']();
         }
       },
       'mounted'() {
         this['init_widget_mode']();
       }
     });
   }),
   interface_components_init.push(function() {
     Vue['component']('catalog_facades', {
       'template': '#catalog_facades_template',
       'props': {
         'lib': {
           'type': String,
           'default': 'facades'
         },
         'categories': {
           'type': [String, Array],
           'default': null
         },
         'items': {
           'type': [String, Array],
           'default': null
         },
         'selected': {
           'type': Object,
           'default': () => ({})
         },
         'method': {
           'type': String,
           'default': 'global'
         },
         'picker_enabled': {
           'type': [Boolean, Number],
           'default': false
         },
         'picker_target': {
           'type': String,
           'default': 'facades'
         },
         'cid': {
           'type': String,
           'default': ''
         },
         'params': {
           'type': [Array],
           'default': () => []
         }
       },
       'mixins': [mixin],
       'data': function() {
         return {
           'l_selected': {},
           'cats': [],
           'cats_hash': [],
           'multi': false,
           'category': 0,
           'path': [0],
           'l_mode': 'click',
           'l_lib': 'materials',
           'picker_mode': false,
           'picker_item': null,
           'items_mode': false,
           'debounce': null,
           'show_search': false,
           'search': '',
           'no_results': false,
           'dd_menu': {
             'id': 0,
             'variant': 0,
             'show': false,
             'pos': {
               'left': 0,
               'right': 'auto',
               'top': 'auto',
               'bottom': 'auto'
             }
           },
           'dd_menu_picker': {
             'id': 0,
             'variant': 0,
             'show': false,
             'target': null,
             'it': null,
             'items': [],
             'pos': {
               'left': 0,
               'right': 'auto',
               'top': 'auto',
               'bottom': 'auto'
             }
           },
           'params_data': []
         };
       },
       'beforeCreate': function() {},
       'created': function() {
         this['cr'](),
           this['$options']['elem'] = document['getElementById']('interface'),
           this['$options']['all_keys'] = [],
           this['$options']['dd_options'] = [{
             'group': 'all',
             'text': this['lang']('apply_to_all')
           }];
         var f = pp['libs']['modules_groups'] || [];
         for (let h = 0; h < f.length; h++) {
           var g = f[h];
           this['$options']['all_keys']['push'](g['key']),
             this['$options']['dd_options']['push']({
               'group': g['key'],
               'text': this['lang']('apply') + ':\x20' + g['name']
             });
         }
         Vue['set'](this, 'l_selected', copy_object(this['selected'])),
           this['$root']['$on']('colorpicker_mode_off', () => {
             this['picker_mode'] = false,
               this['picker_item'] = null;
           });
       },
       'watch': {
         'selected': function() {
           this['sel'] = this['selected'],
             this['multi'] || (this['sel2'] = this['selected']);
         },
         'selected_variant': function() {
           this['variant'] = this['selected_variant'];
         },
         'selected2': function() {
           this['sel2'] = this['selected2'];
         },
         'items': function() {
           this['cr']();
         },
         'lib': function(f, g) {
           this['cr']();
         },
         'categories': function(f, g) {
           this['cr']();
         },
         'cid': function(f, g) {
           this['cr']();
         },
         'params': function(f, g) {
           this['params_data'] = this['params'] ? copy_object(this['params']) : [];
         }
       },
       'mounted': function() {},
       'computed': {
         'search_items': function() {
           let e = [],
             f = this;
           return '' == this['search'] ? this['no_results'] = true : (0 == this['category'] ? g(this[
                 '$options']['tree']) : g(this['$options']['lib']['categories'][this['category']]),
               this['no_results'] = 0 === e.length),
             e;

           function g(j) {
             var k = f['search']['toLowerCase']();
             if (j['categories']) {
               for (let A = 0; A < j['categories']['length']; A++)
                 g(j['categories'][A], j['categories'][A]['id']);
             }
             if (j['items']) {
               var m = {
                 'group': j['name'],
                 'category': j['id'],
                 'items': []
               };
               for (let B = 0; B < j['items']['length']; B++) {
                 let C = 0;
                 if ('modules' == f['l_lib'])
                   for (let D = 0; D < j['items'][B]['params']['variants']['length']; D++) {
                     var q = j['items'][B]['params']['variants'][D];
                     j['is_height'] || (q['name'] && -1 < q['name']['toLowerCase']()['indexOf'](k) && (C =
                         1),
                       q['code'] && -1 < q['code']['toLowerCase']()['indexOf'](k) && (C = 1));
                   }
                 if ('tabletop' == f['l_lib']) {
                   var u = j['items'][B];
                   if (u['name'] && -1 < u['name']['toLowerCase']()['indexOf'](k) && (C = 1),
                     u['code'] && -1 < u['code']['toLowerCase']()['indexOf'](k) && (C = 1),
                     u['params'] && u['params']['variants']) {
                     var v = u['params']['variants'];
                     for (let E = 0; E < v.length; E++) {
                       var w = v[E];
                       w['name'] && -1 < w['name']['toLowerCase']()['indexOf'](k) && (C = 1),
                         w['code'] && -1 < w['code']['toLowerCase']()['indexOf'](k) && (C = 1);
                     }
                   }
                 }
                 if ('tech' == f['l_lib'] || 'comms' == f['l_lib'] || 'interior' == f['l_lib']) {
                   j['items'][B]['name'] && -1 < j['items'][B]['name']['toLowerCase']()['indexOf'](k) && (C =
                     1);
                   for (let F = 0; F < j['items'][B]['variants']['length']; F++) {
                     var x = j['items'][B]['variants'][F];
                     x['name'] && -1 < x['name']['toLowerCase']()['indexOf'](k) && (C = 1),
                       x['code'] && -1 < x['code']['toLowerCase']()['indexOf'](k) && (C = 1);
                   }
                 }
                 if ('catalog' == f['l_lib']) {
                   j['items'][B]['name'] && -1 < j['items'][B]['name']['toLowerCase']()['indexOf'](k) && (C =
                     1);
                   for (let G = 0; G < j['items'][B]['params']['spec']['variants']['length']; G++) {
                     var y = j['items'][B]['params']['spec']['variants'][G];
                     j['is_height'] || (y['name'] && -1 < y['name']['toLowerCase']()['indexOf'](k) && (C =
                         1),
                       y['code'] && -1 < y['code']['toLowerCase']()['indexOf'](k) && (C = 1));
                   }
                 }
                 if ('materials' != f['l_lib'] && 'glass' != f['l_lib'] || (j['items'][B]['name'] && -1 < j[
                       'items'][B]['name']['toLowerCase']()['indexOf'](k) && (C = 1),
                     j['items'][B]['code'] && -1 < j['items'][B]['code']['toLowerCase']()['indexOf'](k) && (
                       C = 1)),
                   'facades' == f['l_lib'] && (j['items'][B]['name'] && -1 < j['items'][B]['name'][
                       'toLowerCase'
                     ]()['indexOf'](k) && (C = 1),
                     j['items'][B]['code']) && -1 < j['items'][B]['code']['toLowerCase']()['indexOf'](k) && (
                     C = 1),
                   'handles' == f['l_lib']) {
                   j['items'][B]['name'] && -1 < j['items'][B]['name']['toLowerCase']()['indexOf'](k) && (C =
                     1);
                   for (let H = 0; H < j['items'][B]['sizes']['length']; H++) {
                     var z = j['items'][B]['sizes'][H];
                     z['code'] && -1 < z['code']['toLowerCase']()['indexOf'](k) && (C = 1);
                   }
                 }
                 1 == C && m['items']['push'](j['items'][B]);
               }
               0 < m['items']['length'] && e.push(m);
             }
           }
         },
         'current_selected'() {
           let e = {};
           return Object['keys'](this['l_selected'])['forEach'](f => {
               e[this['l_selected'][f]['selected']['id']] || (e[this['l_selected'][f]['selected']['id']] = []),
                 e[this['l_selected'][f]['selected']['id']]['push'](this['l_selected'][f]['name']);
             }),
             e;
         }
       },
       'methods': {
         'get_path'(f) {
           let g = this['cats_hash'],
             h = [];

           function j(k) {
             g[k] && (h['unshift']({
                 'id': k,
                 'name': g[k] && g[k]['name']
               }),
               void 0 !== g[k]['parent_id']) && j(g[k]['parent_id']);
           }
           return j(f['category']),
             h;
         },
         'cr': function() {
           var f = this,
             g = (this['category'] = 0,
               this['show_search'] = false,
               this['search'] = '',
               this['path'] = [0], {
                 'cornice': pp['libs']['cornice'],
                 'cokol': pp['libs']['cokol'],
                 'cokol_top': libs['cokol_top'],
                 'legs': pp['libs']['legs'],
                 'corpus': pp['libs']['corpus'],
                 'washes': pp['libs']['washes'],
                 'facades': pp['libs']['facades'],
                 'washers': pp['libs']['washes_materials_lib'],
                 'materials': materials_lib,
                 'glass': pp['libs']['glass'],
                 'handles': pp['libs']['handles'],
                 'modules': pp['libs']['modules'],
                 'tech': pp['libs']['tech'],
                 'comms': pp['libs']['comms'],
                 'interior': pp['libs']['interior'],
                 'constructions': pp['libs']['constructions'],
                 'catalog': pp['libs']['catalog'],
                 'bardesks': pp['libs']['bardesks'],
                 'background': pp['libs']['background'],
                 'tabletop': pp['libs']['tabletop'],
                 'tabletop_plints': pp['libs']['bort'],
                 'templates': pp['libs']['templates']
               });
           if (this['l_lib'] = this['lib'],
             lib = g[this['lib']] || materials_lib,
             !this['categories'] || isArray(this['categories']) && 0 === this['categories']['length']) {
             this['cats'] = [];
             for (let k = 0; k < lib['tree']['length']; k++)
               1 == lib['tree'][k]['active'] && this['cats']['push'](lib['tree'][k]['id']);
           } else
             'string' == typeof this['categories'] ? this['cats'] = copy_object(utils['nested_object']['get'](
               project_settings, this['categories'])) : this['cats'] = this['categories'];
           if (this['cid'] && /\d/ ['test'](this['cid'])) {
             let l = this['cid'];
             var g, g = (l['includes']('_') ? (g = l['match'](/_(\d+)$/),
                 l = g ? g[1] : 0) : /[a-zA-Z]/ ['test'](l) && (this['cats'] = pp['libs'][
                 'catalogs_by_key'
               ]['' + l]['categories']['map'](m => m['id'])),
               this['cats'] = [],
               this['findNodeById'](lib['tree'], l));
             g && (this['cats'] = [l],
               this['path'] = this['build_path'](l, lib['tree']));
           } else
             this['cid'] && ('' + this['lib'])['startsWith']('catalogs.') && 0 < this['cid']['length'] && (
               this['cats'] = pp['libs']['catalogs_by_key']['' + this['cid']]['categories']['map'](m => m['id'])
               );
           'string' == typeof this['selected'] ? this['sel'] = utils['nested_object']['get'](project_settings,
               this['selected']) : this['sel'] = this['selected'],
             'string' == typeof this['selected2'] ? this['sel2'] = utils['nested_object']['get'](
               project_settings, this['selected2']) : this['sel2'] = this['selected2'],
             this['multi'] = this['multiple'],
             0 == this['multi'] && (this['sel2'] = this['sel']),
             this['variant'] = this['selected_variant'],
             null === this['variant'] && (this['variant'] = 0),
             'click' != this['mode'] && (this['multi'] = false,
               this['sel'] = 0,
               this['sel2'] = 0),
             this['l_mode'] = this['mode'];
           var h = {
               'id': 0,
               'name': 'Каталог',
               'active': 1,
               'categories': [],
               'items': []
             },
             g;
           if (this['items'] && this['items']['length']) {
             this['items_mode'] = true;
             for (let m = 0; m < this['items']['length']; m++)
               lib['items'][this['items'][m]] && h['items']['push'](lib['items'][this['items'][m]]);
           } else {
             function n(p, q) {
               for (var r of p)
                 this['cats']['includes'](r['id']) && q['categories']['push'](r),
                 r['categories'] && n['call'](this, r['categories'], q);
             }
             this['items_mode'] = false,
               n['call'](this, lib['tree'], h);
           }
           this['$options']['tree'] = h,
             this['$options']['lib'] = lib;
           let j = String(this['cid'] || 0);
           '0' != j && /\d/ ['test'](j) ? (j['includes']('_') && (g = j['match'](/_(\d+)$/),
                 j = g ? g[1] : 0),
               Vue['nextTick'](() => {
                 this['select_category'](j);
               })) : 1 === this['cats']['length'] && Vue['nextTick'](() => {
               this['select_category'](this['cats'][0]);
             }),
             1 == constructor_settings['show_modules_names_in_sizes_select'] && (f['modules_show_names'] =
               1),
             1 == constructor_settings['show_modules_code_in_sizes_select'] && (f['modules_show_code'] = 1),
             this['params_data'] = this['params'] ? copy_object(this['params']) : [];
         },
         'build_path': function(f, g) {
           let h = [];

           function i(k, m) {
             if (String(k['id']) === String(f))
               return h = [...m, String(k['id'])];
             var n, p;
             for (p of k['categories'] || k['children'] || [])
               if (i(p, [...m, String(k['id'])]))
                 return 1;
           }
           for (var j of g)
             if (i(j, ['0']))
               break;
           return h;
         },
         'set_picker_mode': function(f, g) {
           if ('facades' == this['picker_target']) {
             let h = libs['facades']['items'][f['id']],
               j = [];
             if (Array.isArray(h['types'])) {
               for (let k = 0; k < h['types']['length']; k++)
                 j.push({
                   'name': h['types'][k]['name'],
                   'value': k,
                   'radius': h['types'][k]['radius']
                 });
             } else
               Object['keys'](h['types'])['forEach'](l => {
                 j.push({
                   'name': h['types'][l]['name'],
                   'value': l,
                   'radius': h['types'][l]['radius']
                 });
               });
             this['dd_menu_picker']['id'] = f['id'],
               this['dd_menu_picker']['it'] = f,
               this['dd_menu_picker']['target'] = g['target']['closest']('.item'),
               Vue['set'](this['dd_menu_picker'], 'items', j),
               void this['get_dd_coords_picker'](f['id'], g);
           } else
             this['picker_item'] && f['id'] == this['picker_item']['id'] ? (global_options['mouse_mode'][
               'mode'] = 'drag',
               global_options['mouse_mode']['target'] = null,
               global_options['mouse_mode']['item_id'] = null,
               global_options['mouse_mode']['el'] = null,
               this['picker_item'] = null,
               this['$root']['unset_colorpicker_mode'](this['picker_target']),
               this['picker_mode'] = false) : (global_options['mouse_mode']['mode'] = 'picker',
               global_options['mouse_mode']['target'] = this['picker_target'],
               global_options['mouse_mode']['item_id'] = parseInt(f['id']),
               global_options['mouse_mode']['el'] = g['target']['closest']('.item')['cloneNode'](),
               this['$root']['set_colorpicker_mode'](this['picker_target']),
               this['picker_mode'] = true,
               this['picker_item'] = f);
         },
         'select_dd_picker': function(f, g) {
           global_options['mouse_mode']['mode'] = 'picker',
             global_options['mouse_mode']['target'] = this['picker_target'],
             global_options['mouse_mode']['item_id'] = parseInt(this['dd_menu_picker']['id']),
             global_options['mouse_mode']['style'] = parseInt(f),
             global_options['mouse_mode']['radius'] = 1 == g,
             global_options['mouse_mode']['el'] = this['dd_menu_picker']['target']['cloneNode'](),
             this['$root']['set_colorpicker_mode'](this['picker_target']),
             this['picker_mode'] = true,
             this['picker_item'] = this['dd_menu_picker']['it'],
             this['dd_menu_picker']['show'] = false;
         },
         'set_picker_mode_catalog': function(f, g) {
           this['picker_item'] && f['id'] == this['picker_item']['id'] ? (global_options['mouse_mode']['mode'] =
             'drag',
             global_options['mouse_mode']['target'] = null,
             global_options['mouse_mode']['item_id'] = null,
             global_options['mouse_mode']['el'] = null,
             this['picker_item'] = null,
             this['$root']['unset_fill_mode'](),
             this['picker_mode'] = false) : (global_options['mouse_mode']['mode'] = 'picker',
             global_options['mouse_mode']['target'] = this['picker_target'],
             global_options['mouse_mode']['item_id'] = parseInt(f['id']),
             global_options['mouse_mode']['el'] = g['target']['closest']('.item')['cloneNode'](),
             this['picker_mode'] = true,
             Vue['set'](this, 'picker_item', f),
             this['$root']['set_fill_mode']());
         },
         'show_picker': function(f) {
           return !!this['picker_enabled'] && f['params']['spec']['is_fill'];
         },
         'lang': function(f) {
           return this['$root']['lang'](f);
         },
         'select_category': function(f, g = false) {
           0 == (this['category'] = f) ? this['path'] = [0] : false !== g ? this['path']['length'] = g +
             1 : this['path']['includes'](f) || this['path']['push'](f);
         },
         'set_path': function(f) {
           f['unshift'](0),
             this['path'] = f,
             this['category'] = f[f.length - 1];
         },
         'do_search': function(f) {
           clearTimeout(this['debounce']);
           let g = this;
           this['debounce'] = setTimeout(function() {
             g['search'] = f['target']['value'];
           }, 600);
         },
         'clear_search': function() {
           this['$refs']['search_input']['value'] = '',
             this['search'] = '';
         },
         'change_show_search'() {
           this['show_search'] = !this['show_search'];
         },
         'find_item_path': function() {
           let f = this,
             g = [];
           var h = this['$options']['lib']['items'][this['sel']]['category'];

           function j(k) {
             f['$options']['lib']['categories'][k]['parent'] && 0 != f['$options']['lib']['categories'][k][
               'parent'
             ] ? (g['unshift'](k),
               j(f['$options']['lib']['categories'][k]['parent'])) : g['unshift'](k);
           }
           return j(h),
             g['unshift'](0),
             this['path'] = g,
             this['category'] = h,
             g;
         },
         'find_item_path_by_id': function(f) {
           let g = this,
             h = [];
           var f = this['$options']['lib']['items'][f]['category'];

           function j(k) {
             g['$options']['lib']['categories'][k]['parent'] && 0 != g['$options']['lib']['categories'][k][
               'parent'
             ] ? (h['unshift'](k),
               j(g['$options']['lib']['categories'][k]['parent'])) : h['unshift'](k);
           }
           return j(f),
             h['unshift'](0),
             this['path'] = h,
             this['category'] = f,
             h;
         },
         'double_click': function(f) {
           this['$emit']('double_click', f);
         },
         'select_item_v2': function(f) {
           var f = f['group'],
             g = this['$options']['lib']['find_item'](this['dd_menu']['id']),
             h = pp['libs']['modules_groups'] || [],
             j = [];
           if ('all' == f) {
             for (let k = 0; k < h.length; k++)
               j.push(h[k]['key']);
           } else
             j.push(f);
           for (let l = 0; l < j.length; l++)
             this['l_selected'][j[l]]['selected']['id'] = g['id'];
           this['$emit']('select_item', g, j),
             this['dd_menu']['show'] = false;
         },
         'get_dd_coords': function(f, g) {
           let h = 0;
           var j = g['target']['parentElement']['parentElement']['getElementsByTagName']('SELECT'),
             j = (j.length && (h = j[0]['value']),
               this['dd_menu']['id'] = f,
               this['dd_menu']['variant'] = h,
               this['dd_menu']['show'] = true,
               this['$refs']['dd_menu']['getBoundingClientRect']());
           this['dd_menu']['pos']['top'] = g['clientY'] - j['height'] / 2,
             this['dd_menu']['pos']['left'] = g['clientX'] - j['width'] / 2;
         },
         'get_dd_style': function(f) {
           return {
             'top': 'auto' == this['dd_menu']['pos']['top'] ? 'auto' : this['dd_menu']['pos']['top'] + 'px',
             'left': this['dd_menu']['pos']['left'] + 'px',
             'visibility': this['dd_menu']['show'] ? 'visible' : 'hidden'
           };
         },
         'dd_mouseout': function(f) {
           this['dd_menu']['show'] = false;
         },
         'get_dd_coords_picker': function(f, g) {
           let h = 0;
           var j = g['target']['parentElement']['parentElement']['getElementsByTagName']('SELECT'),
             k = (j.length && (h = j[0]['value']),
               this['dd_menu_picker']['id'] = f,
               this['dd_menu_picker']['variant'] = h,
               this['dd_menu_picker']['show'] = true,
               this['$refs']['dd_menu_picker']['getBoundingClientRect']());
           this['dd_menu_picker']['pos']['top'] = g['clientY'] - 20,
             this['dd_menu_picker']['pos']['left'] = g['clientX'] - 20;
         },
         'get_dd_style_picker': function(f) {
           return {
             'top': 'auto' == this['dd_menu_picker']['pos']['top'] ? 'auto' : this['dd_menu_picker']['pos'][
               'top'
             ] + 'px',
             'left': this['dd_menu_picker']['pos']['left'] + 'px',
             'visibility': this['dd_menu_picker']['show'] ? 'visible' : 'hidden'
           };
         },
         'dd_mouseout_picker': function(f) {
           this['dd_menu_picker']['show'] = false;
         },
         'findNodeById'(f, g) {
           for (var h of f) {
             if (String(h['id']) === String(g))
               return h;
             if (h['categories']) {
               var h = this['findNodeById'](h['categories'], g);
               if (h)
                 return h;
             }
           }
           return null;
         }
       }
     });
   }),
   interface_components_init.push(function() {
       Vue['component']('catalog_facades_decor', {
             'template': '#catalog_facades_decor_template',
             'props': {
               'lib': {
                 'type': String,
                 'default': 'materials'
               },
               'categories': {
                 'type': [String, Array],
                 'default': null
               },
               'items': {
                 'type': [String, Array],
                 'default': null
               },
               'selected': {
                 'type': Object,
                 'default': () => ({})
               },
               'method': {
                 'type': String,
                 'default': 'global'
               },
               'picker_enabled': {
                 'type': [Boolean, Number],
                 'default': false
               },
               'picker_target': {
                 'type': String,
                 'default': 'facades'
               },
               'cid': {
                 'type': String,
                 'default': ''
               },
               'params': {
                 'type': [Array],
                 'default': () => []
               }
             },
             'mixins': [mixin],
             'data': function() {
               return {
                 'l_selected': {},
                 'cats': [],
                 'cats_hash': [],
                 'multi': false,
                 'category': 0,
                 'path': [0],
                 'l_mode': 'click',
                 'l_lib': 'decors',
                 'picker_mode': false,
                 'picker_item': null,
                 'items_mode': false,
                 'available_groups': [],
                 'debounce': null,
                 'show_search': false,
                 'search': '',
                 'no_results': false,
                 'dd_menu': {
                   'id': 0,
                   'variant': 0,
                   'show': false,
                   'pos': {
                     'left': 0,
                     'right': 'auto',
                     'top': 'auto',
                     'bottom': 'auto'
                   }
                 },
                 'dd_menu_picker': {
                   'id': 0,
                   'variant': 0,
                   'show': false,
                   'target': null,
                   'it': null,
                   'items': [],
                   'pos': {
                     'left': 0,
                     'right': 'auto',
                     'top': 'auto',
                     'bottom': 'auto'
                   }
                 },
                 'params_data': [],
                 'selected_data': {}
               };
             },
             'beforeCreate': function() {},
             'created': function() {
               this['cr'](),
                 this['$options']['elem'] = document['getElementById']('interface'),
                 Vue['set'](this, 'l_selected', copy_object(this['selected'])),
                 this['$root']['$on']('colorpicker_mode_off', () => {
                   this['picker_mode'] = false,
                     this['picker_item'] = null;
                 });
             },
             'watch': {
               'selected': function() {
                 this['sel'] = this['selected'],
                   this['multi'] || (this['sel2'] = this['selected']);
               },
               'selected_variant': function() {
                 this['variant'] = this['selected_variant'];
               },
               'selected2': function() {
                 this['sel2'] = this['selected2'];
               },
               'items': function() {
                 this['cr']();
               },
               'lib': function(f, g) {
                 this['cr']();
               },
